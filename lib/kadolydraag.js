// Gedragen foto's voor sieraden (Henkjan 25 nov 2026: "Ja maak", na: de leverancier levert bijna alleen kale productfoto's).
// Een beeldmodel via de AI Gateway (goedkoopste eerst) zet het sieraad van de productfoto om, aan of in de hand. Het origineel van het
// model wordt ongewijzigd bewaard (PNG, met het eigen AI-watermerk van het model) en krijgt XMP met IPTC DigitalSourceType
// trainedAlgorithmicMedia, zoals Merchant Center vraagt voor beelden die met AI gemaakt zijn. Pas na een controle met het oog
// (oordeel goed) gaat een foto naar Google (gmcbeeld.csv) en de advertenties (beeld/<pid>/<t>.jpg?d=1).
import { put, get } from '@vercel/blob';
import { kv } from './db.js';
import { gatewaySleutel, tags } from './ai.js';

export const MODELLEN = ['google/gemini-2.5-flash-image', 'google/gemini-2.5-flash-image']; // tweede keer hetzelfde model: een eerste poging faalt soms zonder reden (25 nov); gemini-3.1-flash-image-preview gaf 404 op de gateway
const KADER = {
  oor: 'a close-up side view of a woman\'s ear, earlobe and jawline wearing exactly these earrings; hair tucked behind the ear; show from cheekbone to neck, no eyes',
  arm: 'a close-up of a woman\'s wrist and hand wearing exactly this bracelet; relaxed hand resting on a soft knit sleeve or linen',
  ring: 'a close-up of a woman\'s hand wearing exactly this ring on the ring finger; natural nails, relaxed fingers',
  hals: 'a close-up of a woman\'s neck and collarbone wearing exactly this necklace; plain cream or white top with an open neckline; cropped from just below the lips to the chest, no eyes'
};
export function soortVan(titel) {
  const t = String(titel || '').toLowerCase();
  if (/sieradenbox|box|charm\b|bedel(?!s)/.test(t) && !/ketting|armband|oorbel/.test(t)) return '';
  if (/oorbel|hoops|huggies|threader|creol|oorknop/.test(t)) return 'oor';
  if (/armband|bangle|enkelband/.test(t)) return 'arm';
  if (/ketting|hanger|halsketting|choker|collier/.test(t)) return 'hals';
  if (/\bring\b|ring met|ring van|sterring|signet/.test(t)) return 'ring';
  return '';
}
export const prompt = soort => 'Photorealistic jewellery lifestyle photo for a webshop. The input image is the product. Show ' + KADER[soort] + '. '
  + 'Keep the jewellery IDENTICAL to the reference: same shape, same proportions relative to the body, same metal colour, same stones, pearls and chain links, same number of pieces. '
  + 'Do not add, remove or change any jewellery. Realistic size on the body. Soft natural daylight, warm neutral background, shallow depth of field, the jewellery in sharp focus and clearly visible. '
  + 'Square 1:1. No text, no logo, no watermark, no packaging.';

// XMP met IPTC DigitalSourceType in een PNG (iTXt-blok na IHDR); de pixels en de andere blokken blijven zoals het model ze gaf
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const XMP = '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:dc="http://purl.org/dc/elements/1.1/"><Iptc4xmpExt:DigitalSourceType>http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia</Iptc4xmpExt:DigitalSourceType><dc:description><rdf:Alt><rdf:li xml:lang="x-default">AI-generated lifestyle photo of the product, made from the supplier product photo</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
export function metXmp(png) {
  if (!png || png.length < 33 || png.readUInt32BE(0) !== 0x89504e47) return png;
  const data = Buffer.concat([Buffer.from('XML:com.adobe.xmp\0\0\0\0\0', 'latin1'), Buffer.from(XMP, 'utf8')]);
  const typ = Buffer.from('iTXt', 'latin1'), len = Buffer.alloc(4), crc = Buffer.alloc(4); len.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([typ, data])));
  const naIhdr = 8 + 4 + 4 + png.readUInt32BE(8) + 4;
  return Buffer.concat([png.subarray(0, naIhdr), len, typ, data, crc, png.subarray(naIhdr)]);
}

export async function stand(pid) { return (await kv.get('kd:draag:' + pid).catch(() => null)) || null; }

// maak een nieuwe versie; bron = JPEG-buffer van de productfoto (wit, 1200x1200)
export async function maak(pid, titel, bron, oidc) {
  const soort = soortVan(titel); if (!soort) return { ok: false, fout: 'geen soort sieraad herkend in de titel' };
  const sleutel = gatewaySleutel(oidc); if (!sleutel) return { ok: false, fout: 'geen toegang tot de AI Gateway' };
  const oud = await stand(pid), n = ((oud && oud.n) || 0) + 1; let laatste = '';
  for (const model of MODELLEN) {
    const t0 = Date.now();
    const r = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', { method: 'POST', headers: Object.assign({ authorization: 'Bearer ' + sleutel, 'content-type': 'application/json' }, tags('kadoly-draagfoto')),
      body: JSON.stringify({ model, stream: false, modalities: ['text', 'image'], messages: [{ role: 'user', content: [{ type: 'text', text: prompt(soort) }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + bron.toString('base64') } }] }] }),
      signal: AbortSignal.timeout(110000) }).catch(e => ({ ok: false, status: 0, json: async () => ({ error: { message: String(e && e.message || e) } }) }));
    const j = await r.json().catch(() => ({}));
    const url = r.ok && (((((j.choices || [])[0] || {}).message || {}).images || [])[0] || {}).image_url && j.choices[0].message.images[0].image_url.url;
    if (!url || !/^data:image\/\w+;base64,/.test(url)) { laatste += (laatste ? ' | ' : '') + model + ': ' + (r.status || '-') + ' ' + String((j.error && j.error.message) || JSON.stringify(j).slice(0, 160)); continue; }
    let buf = Buffer.from(url.split(',')[1], 'base64'); const png = /^data:image\/png/.test(url); if (png) buf = metXmp(buf);
    const pad = 'kadoly/draag/' + pid + '-' + n + (png ? '.png' : '.jpg');
    await put(pad, buf, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: png ? 'image/png' : 'image/jpeg' });
    const rec = { n, pad, soort, model, at: new Date().toISOString(), ms: Date.now() - t0, bytes: buf.length, oordeel: null, versies: [...((oud && oud.versies) || []), { n, pad, model }].slice(-6) };
    await kv.set('kd:draag:' + pid, rec);
    return { ok: true, ...rec, tekst: String((j.choices[0].message.content) || '').slice(0, 200), usage: j.usage || null };
  }
  return { ok: false, fout: laatste };
}
export async function oordeel(pid, o, waarom) { const s = await stand(pid); if (!s) return { ok: false, fout: 'geen foto' }; s.oordeel = o === 'goed' ? 'goed' : 'af'; s.waarom = String(waarom || '').slice(0, 200); s.beoordeeld = new Date().toISOString(); await kv.set('kd:draag:' + pid, s); return { ok: true, ...s }; }
export async function lees(pid, n) {
  const s = await stand(pid); if (!s) return null; const v = n ? ((s.versies || []).find(x => x.n === Number(n)) || null) : s; if (!v) return null;
  const r = await get(v.pad, { access: 'private' }); if (!r) return null;
  return { buf: Buffer.from(await new Response(r.stream).arrayBuffer()), ct: /\.png$/.test(v.pad) ? 'image/png' : 'image/jpeg', stand: s };
}
