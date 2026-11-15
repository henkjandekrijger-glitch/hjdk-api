// Sealed Intent (sealedintent.com). Alle verzoeken op die host komen via vercel.json hier binnen.
// Pagina's: / (voordeur), /nl /de /en (hub), /<taal>/<slug> (landingspagina). Verder robots.txt, sitemap.xml, llms.txt, zicht.json,
// logo.svg en het IndexNow-sleutelbestand. POST ?op=intent bewaart een verzegelde intentie en meldt hem via Telegram.
// Eigenaar: ?op=intents&token=HJDK_TOKEN (laatste 50, e-mail gemaskeerd), ?op=indexnow&token=... (ping alle URL's eenmalig).
import { kv } from '../lib/db.js';
import { PAGINAS, UI } from '../lib/sealed-content.js';
import { renderPagina, renderHub, renderVoordeur, zoekPagina, sitemap, ROBOTS, llms, zichtJson, LOGO_SVG, INDEXNOW_KEY, BASE, HOST, url } from '../lib/sealed.js';

const GSC_META = process.env.SEALED_GSC_META || '';

function stuur(res, status, type, body, cache = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400') {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', cache);
  if (/html/.test(type)) { res.setHeader('X-Robots-Tag', status === 200 ? 'index, follow' : 'noindex'); res.setHeader('Content-Language', 'nl, de, en'); }
  res.end(body);
}
const schoon = (s, n = 200) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);

async function meld(tekst) {
  const s = process.env.MELD_SLEUTEL; if (!s) return false;
  try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'Sealed Intent', tekst: tekst.slice(0, 3400) }), signal: AbortSignal.timeout(8000) }); const j = await r.json().catch(() => ({})); return !!(j && j.ok); } catch (e) { return false; }
}

async function leesBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const delen = []; for await (const d of req) delen.push(d); try { return JSON.parse(Buffer.concat(delen).toString('utf8') || '{}'); } catch (e) { return {}; }
}

async function intent(req, res) {
  const b = await leesBody(req);
  const mail = schoon(b.mail, 120).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return stuur(res, 400, 'application/json', JSON.stringify({ ok: false, fout: 'mail' }), 'no-store');
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  // hooguit 10 per IP per uur
  try { const k = 'si:rl:' + ip + ':' + new Date().toISOString().slice(0, 13); const n = await kv.incr(k); if (n === 1) await kv.raw(['EXPIRE', k, 3600]); if (n > 10) return stuur(res, 429, 'application/json', '{"ok":false}', 'no-store'); } catch (e) {}
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const keuzes = {}; if (b.keuzes && typeof b.keuzes === 'object') for (const [k, v] of Object.entries(b.keuzes).slice(0, 20)) keuzes[schoon(k, 12)] = Array.isArray(v) ? v.slice(0, 10).map(x => +x || 0) : (+v || 0);
  const rec = { id, t: new Date().toISOString(), taal: schoon(b.taal, 2), pagina: schoon(b.pagina, 30), tool: schoon(b.tool, 10), soort: schoon(b.soort, 10), execSoort: schoon(b.execSoort, 20),
    sector: schoon(b.sector, 60), band: schoon(b.band, 40), bod: Math.max(0, Math.min(1e10, +b.bod || 0)), min: schoon(b.min, 20), keuzes, route: Array.isArray(b.route) ? b.route.slice(0, 2).map(x => x ? 1 : 0) : [],
    teaser: schoon(b.teaser, 120), mail, stijl: schoon(b.stijl, 2), ref: schoon(b.ref, 200), url: schoon(b.url, 200), land: schoon(req.headers['x-vercel-ip-country'], 2) };
  try { await kv.set('si:i:' + id, rec, { ex: 400 * 86400 }); await kv.raw(['LPUSH', 'si:list', id]); await kv.raw(['LTRIM', 'si:list', 0, 4999]); await kv.incr('si:n'); }
  catch (e) { return stuur(res, 503, 'application/json', '{"ok":false}', 'no-store'); }
  const p = PAGINAS.find(x => x.paar === rec.pagina && x.taal === rec.taal);
  await meld(`Nieuwe verzegelde intentie (${rec.taal.toUpperCase()}, ${rec.land || '?'})\n${p ? p.h1 : rec.pagina}\n${rec.teaser}${rec.bod ? '\nBod: ' + rec.bod.toLocaleString('nl-NL') : ''}${rec.min ? '\nMinimum: ' + rec.min : ''}\nStijl ${rec.stijl} · id ${id}`);
  return stuur(res, 200, 'application/json', JSON.stringify({ ok: true, id }), 'no-store');
}

async function eigenaar(op, res) {
  if (op === 'intents') {
    const ids = await kv.raw(['LRANGE', 'si:list', 0, 49]).catch(() => []);
    const recs = ids.length ? await kv.mget(...ids.map(i => 'si:i:' + i)) : [];
    const lijst = recs.filter(Boolean).map(r => ({ ...r, mail: r.mail.replace(/^(.).*(@.*)$/, '$1***$2') }));
    return stuur(res, 200, 'application/json', JSON.stringify({ n: await kv.get('si:n').catch(() => null), lijst }, null, 1), 'no-store');
  }
  if (op === 'indexnow') {
    const urlList = [BASE + '/', ...Object.keys(UI).map(t => BASE + '/' + t), ...PAGINAS.map(url), BASE + '/sitemap.xml', BASE + '/llms.txt'];
    let status = 0; try { const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: BASE + '/' + INDEXNOW_KEY + '.txt', urlList }), signal: AbortSignal.timeout(15000) }); status = r.status; } catch (e) { status = String(e.message || e).slice(0, 80); }
    try { await kv.set('si:indexnow', { t: new Date().toISOString(), status, n: urlList.length }); } catch (e) {}
    return stuur(res, 200, 'application/json', JSON.stringify({ status, n: urlList.length }), 'no-store');
  }
  return stuur(res, 404, 'application/json', '{}', 'no-store');
}

export default async function handler(req, res) {
  const u = new URL(req.url, 'https://' + HOST), q = u.searchParams, op = q.get('op') || '';
  if (req.method === 'OPTIONS') return stuur(res, 204, 'text/plain', '', 'no-store');
  if (op === 'intent' && req.method === 'POST') return intent(req, res);
  if (op === 'intents' || op === 'indexnow') {
    if (!process.env.HJDK_TOKEN || q.get('token') !== process.env.HJDK_TOKEN) return stuur(res, 403, 'application/json', '{"ok":false}', 'no-store');
    return eigenaar(op, res);
  }
  if (op === 'robots') return stuur(res, 200, 'text/plain; charset=utf-8', ROBOTS);
  if (op === 'sitemap') return stuur(res, 200, 'application/xml; charset=utf-8', sitemap());
  if (op === 'llms') return stuur(res, 200, 'text/plain; charset=utf-8', llms());
  if (op === 'zicht') return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify(zichtJson(), null, 1));
  if (op === 'logo') return stuur(res, 200, 'image/svg+xml', LOGO_SVG, 'public, max-age=86400');
  if (op === 'key') return stuur(res, 200, 'text/plain; charset=utf-8', INDEXNOW_KEY, 'public, max-age=86400');
  const taal = q.get('taal') || '', slug = q.get('slug') || '';
  const opts = { gscMeta: GSC_META };
  if (!taal) return stuur(res, 200, 'text/html; charset=utf-8', renderVoordeur(opts));
  if (!UI[taal]) return stuur(res, 404, 'text/html; charset=utf-8', renderVoordeur(opts), 'public, max-age=60');
  if (!slug) return stuur(res, 200, 'text/html; charset=utf-8', renderHub(taal, opts));
  const p = zoekPagina(taal, slug);
  if (!p) return stuur(res, 404, 'text/html; charset=utf-8', renderHub(taal, opts), 'public, max-age=60');
  return stuur(res, 200, 'text/html; charset=utf-8', renderPagina(p, opts));
}
