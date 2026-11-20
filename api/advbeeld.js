// Advertentiebeeld op maat voor PropellerAds en andere netwerken (20 nov 2026, campagne podcast Tania Kross "betalen per adres").
// GET /api/advbeeld?u=<beeld-URL>&t=icon|pa|mg
//   icon = 192x192 (PropellerAds-icoon), pa = 492x328 (PropellerAds-beeld), mg = 984x656 (MGID). Bijsnijden vanuit het midden.
// Alleen beelden van eigen sites en YouTube-thumbnails, zodat dit geen open beeldproxy is.
import sharp from 'sharp';

const MATEN = { icon: [192, 192], pa: [492, 328], mg: [984, 656] };
const HOSTS = /^(taniakross\.media|www\.taniakross\.media|simpele-site-henq\.vercel\.app|i\.ytimg\.com|img\.youtube\.com|keuzehulp\.best|kadoly\.com|todayin\.email)$/i;

export default async function handler(req, res) {
  try {
    const q = new URL(req.url, 'https://x').searchParams;
    const m = MATEN[String(q.get('t') || 'icon').replace(/\.(jpe?g|png)$/i, '')] || MATEN.icon;
    let u; try { u = new URL(String(q.get('u') || '')); } catch (e) { return res.status(400).send('geen geldige u'); }
    if (u.protocol !== 'https:' || !HOSTS.test(u.hostname)) return res.status(400).send('host niet toegestaan');
    const r = await fetch(u.toString(), { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return res.status(502).send('beeld niet op te halen: ' + r.status);
    const bron = Buffer.from(await r.arrayBuffer());
    const pos = q.get('p') === 'boven' ? 'top' : 'centre';
    const out = await sharp(bron).rotate().flatten({ background: '#ffffff' }).resize(m[0], m[1], { fit: 'cover', position: pos }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    res.setHeader('content-type', 'image/jpeg');
    res.setHeader('cache-control', 'public, max-age=86400, s-maxage=604800');
    return res.status(200).send(out);
  } catch (e) {
    return res.status(500).send('beeld mislukt: ' + String(e && e.message || e).slice(0, 120));
  }
}
