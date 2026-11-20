// Beeldopens zijn technische signalen, nooit bewijs van lezen of dossierbehandeling.
import { randomBytes } from 'node:crypto';
import { kv } from './db.js';
const HOST = 'https://hjdk-api-henq.vercel.app/api/post';
const TTL = 180 * 86400;
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
export async function maakMeting(id) {
  let m = await kv.get('post:meet:' + id);
  if (!m) {
    m = { beeld: randomBytes(16).toString('hex'), sleutel: randomBytes(24).toString('hex') };
    await kv.set('post:meet:' + id, m, { ex: TTL });
    await kv.set('post:beeld:' + m.beeld, id, { ex: TTL });
    await kv.set('post:lees:' + m.sleutel, id, { ex: TTL });
  }
  return { pixel: HOST + '?op=o&code=' + m.beeld, stand: HOST + '?op=meting&sleutel=' + m.sleutel, uitleg: 'beeldopvraging is geen bewijs van lezen; kliks en antwoorden staan apart' };
}
export function beeldSoort(req) {
  const h = req.headers || {}, ua = String(h['user-agent'] || '');
  if (req.method !== 'GET' || /prefetch|prerender/i.test(String(h['sec-purpose'] || h.purpose || ''))) return null;
  if (!ua || /bot|crawl|spider|scan|preview|proofpoint|mimecast|barracuda|safelinks|urldefense|python|curl|headless/i.test(ua)) return 'scanner';
  if (/GoogleImageProxy|Google-Image|AppleMail|MailPrivacy|YahooMailProxy/i.test(ua)) return 'proxy';
  return 'onbekend';
}
export async function beeldAntwoord(req, res, code) {
  res.setHeader('content-type', 'image/gif');
  res.setHeader('cache-control', 'no-store, no-cache, private, max-age=0, must-revalidate');
  res.setHeader('x-robots-tag', 'noindex, nofollow'); res.setHeader('expires', '0');
  if (/^[0-9a-f]{32}$/.test(code)) {
    try {
      const id = await kv.get('post:beeld:' + code), soort = beeldSoort(req);
      if (id && soort) {
        const k = 'post:beeldtel:' + id, nu = new Date().toISOString();
        // Atomic counters; geen IP, user-agent, cookies of ontvanger opslaan.
        await kv.raw(['HINCRBY', k, soort, 1]);
        await kv.raw(['HSETNX', k, 'eerste', nu]);
        await kv.raw(['HSET', k, 'laatste', nu]);
        await kv.raw(['EXPIRE', k, TTL]);
      }
    } catch (e) { /* meetfout mag de afbeelding niet breken */ }
  }
  res.statusCode = 200;
  return res.end(req.method === 'HEAD' ? undefined : GIF);
}
export async function meetStand(sleutel) {
  if (!/^[0-9a-f]{48}$/.test(sleutel)) return null;
  const id = await kv.get('post:lees:' + sleutel); if (!id) return null;
  const m = await kv.get('post:mail:' + id); if (!m) return null;
  const r = await kv.raw(['HGETALL', 'post:beeldtel:' + id]);
  const t = Array.isArray(r) ? Object.fromEntries(Array.from({ length: r.length / 2 }, (_, i) => [r[i * 2], r[i * 2 + 1]])) : r || {};
  return { ok: true, id, status: m.status, verstuurd: m.verstuurd || null,
    beelden: { onbekend: Number(t.onbekend || 0), proxy: Number(t.proxy || 0), scanner: Number(t.scanner || 0), eerste: t.eerste || null, laatste: t.laatste || null },
    kliks: m.kliks || 0, linkScans: m.scans || 0, eersteKlik: m.klikOp || null,
    uitkomst: m.uitkomst || null, uitkomstOp: m.uitkomstOp || null,
    uitleg: 'Beeldopvragingen en kliks kunnen door doorsturen, scanners of proxies komen. Geen bewijs van lezen, identiteit of behandeling. Alleen een inhoudelijk antwoord bevestigt vervolgactie.' };
}
