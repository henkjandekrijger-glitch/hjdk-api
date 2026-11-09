// Originele foto's van de aanbieders bij elke tour, plus de onderhoudslus van de tours (Henkjan 9 nov 2026: "Bij tours moeten kloppende plaatjes
// zitten pak gewoon originals we sturen door dus zullen ze geen bezwaar tegen hebben . Activeer de onderhouds lus ook").
//
// Bron per tour: de eigen pagina van de aanbieder. Volgorde: v.site (een of meer tourpagina's op de site van de aanbieder), dan v.boek en v.url
// als dat geen Tripadvisor, Viator, GetYourGuide of een gidssite is (die weren servers en zijn niet de maker van de foto).
// Onderhoudslus (op=touronderhoud, Vercel-cron elke 2 uur, ook met de hand): per ronde een portie tours, oudste eerst (elke 7 dagen opnieuw,
// mislukt na 2 dagen opnieuw). Per pagina: og:image, twitter:image, JSON-LD image en de grote foto's op de pagina. Per tour hoogstens 3 bruikbare
// foto's (minstens 600x340, geen logo of icoon), elk als kopie 1600 breed JPEG in Blob cur/tourbeeld/<hash>.jpg. Dezelfde ronde controleert de
// boeklink: twee keer 404/410/5xx/onbereikbaar = dood (tourData laat hem dan weg; lijst op op=touronderhoud&lees=1).
// Keuze (cur:tourkeuze): per tour de eerste foto die niet op 3 of meer pagina's van dezelfde site staat (sitebrede kopfoto's tellen niet) en
// die geen andere tour al heeft; zo staat er nooit twee keer dezelfde foto op een pagina. Zonder eigen foto valt de tour terug op Wikimedia.
// Met het oog afgekeurd (controleblad op=tourblad): per tour nietBeeld [hash] in de data; vlakke beelden (entropie < 6) gaan er vooraf al uit.
// Serveren: op=tourbeeld&f=<id>-<hash>-<breedte>.<avif|webp|jpg> (sharp, een jaar cache, breedtes 320 tot 1600); op curacao.day als
// /beeld/tours/<id>-<hash>-<breedte>.<fmt> (rewrite in todayin bzz/vercel.json), zodat de foto's op het eigen domein vindbaar zijn.
import { put, get } from '@vercel/blob';
import { createHash } from 'node:crypto';
import { kv } from './db.js';
import excursies from '../data/cur/excursies.json' with { type: 'json' };

const UA = 'Mozilla/5.0 (compatible; curacao.day/1.0; +https://curacao.day)';
const NIET_BRON = /(^|\.)(tripadvisor\.[a-z.]+|viator\.com|getyourguide\.[a-z.]+|mycuracaoguide\.com|expedia\.[a-z.]+|klook\.com|booking\.com|google\.[a-z.]+)$/i;
const NIET_BEELD = /logo|favicon|icon|sprite|avatar|badge|placeholder|blank|pixel|tracking|flag|payment|visa|mastercard|paypal|trustpilot|tripadvisor|certificate|award|qr[-_]?code|banner-ad|emoji|gravatar|wpml|flags?\//i;
export const BREEDTES = [320, 480, 640, 960, 1280, 1600];
const DAG = () => new Date().toISOString().slice(0, 10);
const hash = u => createHash('sha1').update(u).digest('hex').slice(0, 10);
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const ent = s => String(s || '').replace(/&amp;/g, '&').replace(/&#0?38;/g, '&').replace(/&quot;/g, '"').replace(/&#x2F;/gi, '/').replace(/&#47;/g, '/');

export function bronPaginas(v) {
  const l = [].concat(v.site || []).filter(Boolean);
  for (const u of [v.boek, v.url]) if (u && /^https?:\/\//.test(u) && !NIET_BRON.test(host(u))) l.push(u);
  return [...new Set(l)].slice(0, 3);
}
async function haal(u, ms, max) {
  try {
    const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,image/avif,image/webp,image/*,*/*;q=0.8', 'accept-language': 'en-US,en;q=0.9' }, signal: AbortSignal.timeout(ms) });
    const ct = r.headers.get('content-type') || '';
    const b = Buffer.from(await r.arrayBuffer());
    return { s: r.status, u: r.url || u, ct, b: max ? b.subarray(0, max) : b };
  } catch (e) { return { s: 0, fout: String(e.name || e.message || e).slice(0, 40) }; }
}
function kandidaten(html, base) {
  const uit = [];
  const add = (u, via) => {
    if (!u) return; u = ent(u.trim()); if (/^data:|\.svg(\?|$)|\.gif(\?|$)/i.test(u)) return;
    try { u = new URL(u, base).href; } catch { return; }
    if (NIET_BEELD.test(u) || uit.some(x => x.u === u)) return; uit.push({ u, via });
  };
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const t = m[0], p = (t.match(/(?:property|name)=["']([^"']+)["']/i) || [])[1] || '', c = (t.match(/content=["']([^"']+)["']/i) || [])[1];
    if (/^(og:image(:secure_url)?|og:image:url|twitter:image(:src)?)$/i.test(p)) add(c, /^og/i.test(p) ? 'og' : 'tw');
  }
  for (const m of html.matchAll(/"image"\s*:\s*(\[[^\]]*\]|"[^"]+"|\{[^}]*\})/g)) for (const u of m[1].match(/https?:\\?\/\\?\/[^"\\\s]+/g) || []) add(u.replace(/\\\//g, '/'), 'ld');
  let n = 0;
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    if (n >= 20) break; const t = m[0];
    const src = (t.match(/\s(?:data-src|data-lazy-src|data-orig-file|src)=["']([^"']+)["']/i) || [])[1];
    const ss = (t.match(/\s(?:data-srcset|srcset)=["']([^"']+)["']/i) || [])[1];
    let best = src;
    if (ss) { const d = ss.split(',').map(p => p.trim().split(/\s+/)).sort((a, b) => (parseInt(b[1]) || 0) - (parseInt(a[1]) || 0)); if (d[0] && d[0][0]) best = d[0][0]; }
    if (best && /\.(jpe?g|png|webp|avif)(\?|$)/i.test(best)) { add(best, 'img'); n++; }
  }
  return uit;
}
// een kandidaat ophalen, controleren en als kopie bewaren (eenmalig per bron-URL)
async function bewaar(u, sharp) {
  const h = hash(u); const al = await kv.get('cur:tbm:' + h).catch(() => null); if (al && al.w) return { h, ...al };
  const r = await haal(u, 15000);
  if (r.s !== 200 || !/^image\//i.test(r.ct) || !r.b || r.b.length < 12000) return null;
  let meta; try { meta = await sharp(r.b).metadata(); } catch { return null; }
  const w = meta.width || 0, ht = meta.height || 0;
  if (w < 600 || ht < 340 || w / ht > 2.6 || ht / w > 1.5) return null; // te klein, een strook of een staande poster
  let km = null; try { km = await kenmerkVan(r.b, sharp); if (km.e < 6) return null; } catch {} // vlak beeld: logo, icoon of tekstbanner, geen foto
  const uitB = await sharp(r.b).rotate().resize({ width: 1600, withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const m2 = await sharp(uitB).metadata();
  await put('cur/tourbeeld/' + h + '.jpg', uitB, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'image/jpeg' });
  const rec = { u, w: m2.width, h2: m2.height, t: Date.now(), ...(km || {}) };
  await kv.set('cur:tbm:' + h, rec).catch(() => {});
  return { h, ...rec };
}
// kenmerken van een foto: entropie (vlak beeld = logo of banner) en een vingerafdruk van 8x8 grijswaarden (dezelfde foto onder een andere naam of maat)
async function kenmerkVan(buf, sharp) {
  const st = await sharp(buf).stats(), px = await sharp(buf).resize(8, 8, { fit: 'fill' }).grayscale().raw().toBuffer();
  const gem = px.reduce((a, b) => a + b, 0) / px.length; let bits = ''; for (const p of px) bits += p > gem ? '1' : '0';
  return { e: Math.round(st.entropy * 100) / 100, ph: BigInt('0b' + bits).toString(16).padStart(16, '0') };
}
const afstand = (a, b) => { let x = BigInt('0x' + a) ^ BigInt('0x' + b), n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };
// eenmalig aanvullen voor foto's die van vóór de kenmerken zijn (op=tourkenmerk)
export async function tourKenmerk(max = 80) {
  const sharp = (await import('sharp')).default, ids = excursies.items.map(v => v.id), recs = await kv.mget(...ids.map(id => 'cur:tog:' + id)).catch(() => []);
  const hs = [...new Set(recs.flatMap(r => ((r && r.kand) || []).map(k => k.h)))], tbm = hs.length ? await kv.mget(...hs.map(h => 'cur:tbm:' + h)).catch(() => []) : [];
  const nodig = hs.filter((h, i) => tbm[i] && tbm[i].ph == null).slice(0, max), uit = { totaal: hs.length, nodig: 0, gedaan: 0 };
  uit.nodig = hs.filter((h, i) => tbm[i] && tbm[i].ph == null).length;
  for (let i = 0; i < nodig.length; i += 8) await Promise.all(nodig.slice(i, i + 8).map(async h => { try { const r = await get('cur/tourbeeld/' + h + '.jpg', { access: 'private' }); const buf = Buffer.from(await new Response(r.stream).arrayBuffer()); const km = await kenmerkVan(buf, sharp); const o = tbm[hs.indexOf(h)]; await kv.set('cur:tbm:' + h, { ...o, ...km }); uit.gedaan++; } catch {} }));
  await maakKeuze(); return uit;
}
async function doeTour(v, sharp, oud) {
  const pag = bronPaginas(v), rec = { t: Date.now(), dag: DAG(), paginas: [], kand: [], f: (oud && oud.f) || 0 };
  let boekS = null;
  for (const p of pag) {
    const r = await haal(p, 12000, 2_500_000);
    rec.paginas.push({ p, s: r.s, fout: r.fout || undefined });
    if (p === v.boek) boekS = r;
    if (r.s !== 200 || !/html/i.test(r.ct)) continue;
    const k = kandidaten(r.b.toString('utf8'), r.u || p);
    for (const c of k.slice(0, 8)) {
      if (rec.kand.length >= 3) break;
      if (rec.kand.some(x => x.u === c.u)) continue;
      const b = await bewaar(c.u, sharp).catch(() => null);
      if (b) rec.kand.push({ u: c.u, h: b.h, w: b.w, ht: b.h2, via: c.via, pagina: p });
    }
    if (rec.kand.length >= 3) break;
  }
  // boeklink nakijken (ook als die niet als fotobron dient, behalve sites die servers weren)
  if (v.boek && !NIET_BRON.test(host(v.boek))) {
    const r = boekS || await haal(v.boek, 10000, 4000);
    const stuk = !!r.fout || r.s === 404 || r.s === 410 || r.s >= 500;
    rec.boek = { s: r.s, fout: r.fout || undefined }; rec.f = stuk ? rec.f + 1 : 0;
  }
  return rec;
}
// de keuze over alle tours: geen sitebrede foto's, elke foto maar één keer
export async function maakKeuze() {
  const ids = excursies.items.map(v => v.id), recs = await kv.mget(...ids.map(id => 'cur:tog:' + id)).catch(() => []);
  const tel = {}; recs.forEach(r => { for (const k of (r && r.kand) || []) (tel[k.h] = tel[k.h] || new Set()).add(k.pagina); }); // op twee verschillende pagina's = sitebreed
  const alleH = Object.keys(tel), TB = {}; if (alleH.length) { const l = await kv.mget(...alleH.map(h => 'cur:tbm:' + h)).catch(() => []); alleH.forEach((h, i) => { TB[h] = l[i] || {}; }); }
  const vlak = h => TB[h] && TB[h].e != null && TB[h].e < 6, phs = [], dubbel = h => TB[h] && TB[h].ph && phs.some(p => afstand(p, TB[h].ph) <= 6);
  const gebruikt = new Set(), keuze = {}, dood = [], NIET = new Set(excursies.items.flatMap(x => x.nietBeeld || []));
  ids.forEach((id, i) => {
    const r = recs[i]; if (!r) return;
    if (r.f >= 2) { const v = excursies.items[i]; dood.push({ id, naam: v.naam, boek: v.boek, status: r.boek && r.boek.s, fout: r.boek && r.boek.fout }); }
    if (excursies.items[i].beeldUit) return; // met het oog: geen passende eigen foto bij deze aanbieder, vrije foto
    const v = excursies.items[i], voorkeur = v.beeldVoorkeur || null; // met het oog afgekeurd (logo, tekstbanner, ander onderwerp) geldt voor alle tours; beeldVoorkeur = met het oog gekozen
    const lijst = (r.kand || []).filter(x => x.h === voorkeur || !NIET.has(x.h)).sort((a, b) => ((b.h === voorkeur) - (a.h === voorkeur)) || ((b.w >= b.ht * 1.15) - (a.w >= a.ht * 1.15))); // liggend eerst, verder de volgorde van de pagina
    const k = lijst.find(x => x.h === voorkeur || (tel[x.h].size <= 2 && !gebruikt.has(x.h) && !vlak(x.h) && !dubbel(x.h))); // op 3 of meer pagina's = kopfoto van de site; vlak = logo; dubbel = dezelfde foto als bij een andere tour
    if (k) { gebruikt.add(k.h); if (TB[k.h] && TB[k.h].ph) phs.push(TB[k.h].ph); keuze[id] = { h: k.h, w: k.w, ht: k.ht, door: host(k.pagina) || host(k.u), pagina: k.pagina }; }
  });
  const uit = { at: new Date().toISOString(), n: Object.keys(keuze).length, totaal: ids.length, keuze, dood };
  await kv.set('cur:tourkeuze', uit).catch(() => {});
  return uit;
}
export async function tourKeuze() { return (await kv.get('cur:tourkeuze').catch(() => null)) || { keuze: {}, dood: [] }; }

export async function tourOnderhoud(n = 12) {
  const lk = 'cur:tourond:' + new Date().toISOString().slice(0, 16); // hoogstens één ronde per minuut
  const keer = await kv.incr(lk).catch(() => 1); if (keer === 1) await kv.raw(['EXPIRE', lk, 120]).catch(() => {}); if (keer > 1) return { overgeslagen: 'al een ronde deze minuut' };
  const sharp = (await import('sharp')).default;
  const items = excursies.items.filter(v => bronPaginas(v).length || (v.boek && !NIET_BRON.test(host(v.boek))));
  const oud = await kv.mget(...items.map(v => 'cur:tog:' + v.id)).catch(() => []);
  const nu = Date.now(), wacht = r => !r ? 0 : (r.kand && r.kand.length ? 7 : 2) * 86400000;
  const rij = items.map((v, i) => ({ v, r: oud[i] })).filter(x => !x.r || nu - x.r.t > wacht(x.r)).sort((a, b) => ((a.r && a.r.t) || 0) - ((b.r && b.r.t) || 0)).slice(0, n);
  const start = Date.now(), uit = { gedaan: 0, metFoto: 0, zonder: 0, resterend: 0 };
  for (let i = 0; i < rij.length; i += 4) {
    if (Date.now() - start > 80000) break; // ruim binnen de 120 s van de functie
    await Promise.all(rij.slice(i, i + 4).map(async ({ v, r }) => {
      const rec = await doeTour(v, sharp, r).catch(e => ({ t: Date.now(), dag: DAG(), fout: String(e.message || e).slice(0, 80), kand: [], f: (r && r.f) || 0 }));
      await kv.set('cur:tog:' + v.id, rec, { ex: 60 * 86400 }).catch(() => {});
      uit.gedaan++; if (rec.kand && rec.kand.length) uit.metFoto++; else uit.zonder++;
    }));
  }
  const nog = await kv.mget(...items.map(v => 'cur:tog:' + v.id)).catch(() => []);
  uit.resterend = nog.filter(x => !x).length; uit.bronnen = items.length; uit.zonderBron = excursies.items.length - items.length;
  const k = await maakKeuze(); uit.eigenFoto = k.n; uit.dood = k.dood.length;
  await kv.set('cur:tourond:log', { at: new Date().toISOString(), ...uit }).catch(() => {});
  return uit;
}
// stand voor de overdracht en controle: per tour de bron, de keuze en waarom niet
export async function tourStand() {
  const K = await tourKeuze(), recs = await kv.mget(...excursies.items.map(v => 'cur:tog:' + v.id)).catch(() => []);
  return { ...K, log: await kv.get('cur:tourond:log').catch(() => null), tours: excursies.items.map((v, i) => ({ id: v.id, bron: bronPaginas(v), eigen: !!K.keuze[v.id], kand: ((recs[i] || {}).kand || []).length, paginas: ((recs[i] || {}).paginas || []).map(p => p.s || p.fout), dag: (recs[i] || {}).dag || null })) };
}
// serveren: één kopie, elke breedte en elk formaat op aanvraag, daarna een jaar in de cache van Vercel en de browser
export async function tourBeeld(res, f) {
  const m = /^([a-z0-9-]{2,90})-([a-f0-9]{10})-(\d{3,4})\.(avif|webp|jpg)$/.exec(String(f || ''));
  if (!m) { res.setHeader('cache-control', 'public, max-age=300'); return res.status(404).send('niet gevonden'); }
  const w = BREEDTES.reduce((a, b) => Math.abs(b - Number(m[3])) < Math.abs(a - Number(m[3])) ? b : a, 640), fmt = m[4];
  let buf = null;
  try { const r = await get('cur/tourbeeld/' + m[2] + '.jpg', { access: 'private' }); if (r && r.stream) buf = Buffer.from(await new Response(r.stream).arrayBuffer()); } catch {}
  if (!buf) { res.setHeader('cache-control', 'public, max-age=300'); return res.status(404).send('niet gevonden'); }
  const sharp = (await import('sharp')).default;
  let s = sharp(buf).resize({ width: w, withoutEnlargement: true });
  s = fmt === 'avif' ? s.avif({ quality: 52, effort: 4 }) : fmt === 'webp' ? s.webp({ quality: 74 }) : s.jpeg({ quality: 80, mozjpeg: true, progressive: true });
  const out = await s.toBuffer();
  res.setHeader('content-type', fmt === 'avif' ? 'image/avif' : fmt === 'webp' ? 'image/webp' : 'image/jpeg');
  res.setHeader('cache-control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  res.setHeader('access-control-allow-origin', '*');
  return res.status(200).send(out);
}

// controleblad: alle gekozen foto's in een raster (volgorde = ids), om met het oog na te lopen of ze bij de tour passen
export async function tourBlad(b64) {
  const K = await tourKeuze(), ids = Object.keys(K.keuze || {}), sharp = (await import('sharp')).default, W = 200, H = 134, R = 6;
  const tegels = await Promise.all(ids.map(async id => { try { const r = await get('cur/tourbeeld/' + K.keuze[id].h + '.jpg', { access: 'private' }); const buf = Buffer.from(await new Response(r.stream).arrayBuffer()); return await sharp(buf).resize(W, H, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer(); } catch { return null; } }));
  const rijen = Math.ceil(ids.length / R) || 1;
  const blad = await sharp({ create: { width: R * W, height: rijen * H, channels: 3, background: '#ffffff' } }).composite(tegels.map((t, i) => t ? { input: t, left: (i % R) * W, top: Math.floor(i / R) * H } : null).filter(Boolean)).jpeg({ quality: 72 }).toBuffer();
  return b64 ? { ids, per: R, jpg: blad.toString('base64') } : blad;
}
