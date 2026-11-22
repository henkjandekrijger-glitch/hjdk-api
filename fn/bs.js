// Bookstuffers (bookstuffers.com). Op dat domein komen alle verzoeken via vercel.json hier binnen (rewrites naar /api/bs?p=<pagina>).
// Overal anders (hjdk-api-*.vercel.app, keuzehulp.best) is dit een voorbeeld: /api/bs?p=<pagina>, met noindex in kop en meta.
// Acties: robots, sitemap, llms, zicht (zicht.json), overdracht (?format=text), fav, key (IndexNow-sleutel), gezond (controle, &omslagen=1
// vraagt ook elke omslag op), indexnow (pingt alle URL's één keer per BIJGEWERKT; daarna alleen de bewaarde uitkomst, nooit in een lus).
import { kv } from '../lib/db.js';
import { render, SLUGS, ROBOTS, sitemap, llms, zichtJson, OVERDRACHT, FAVICON, INDEXNOW_KEY, BIJGEWERKT, HOST, BASE, TEL, amz, omslag, keur, BOEK_ASIN } from '../lib/bs.js';
import { BOEKEN, LC, PRIJS_DATUM } from '../lib/bs-data.js';

function stuur(res, status, type, body, { cache = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400', robots = '' } = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', cache);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (robots) res.setHeader('X-Robots-Tag', robots);
  res.end(body);
}

const isEcht = req => /(^|\.)bookstuffers\.com$/i.test(String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]);
const ctx = echt => ({ echt, L: s => echt ? '/' + s : '/api/bs?p=' + encodeURIComponent(s) });

export default async function handler(req, res) {
  const u = new URL(req.url, 'https://' + HOST), q = u.searchParams, op = q.get('op') || '', echt = isEcht(req);
  const noidx = echt ? '' : 'noindex, nofollow';
  if (op === 'robots') return stuur(res, 200, 'text/plain; charset=utf-8', echt ? ROBOTS : 'User-agent: *\nDisallow: /\n');
  if (op === 'sitemap') return stuur(res, 200, 'application/xml; charset=utf-8', sitemap(), { robots: noidx });
  if (op === 'llms') return stuur(res, 200, 'text/plain; charset=utf-8', llms(), { robots: noidx });
  if (op === 'zicht') return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify(zichtJson(), null, 1), { robots: 'noindex' });
  if (op === 'fav') return stuur(res, 200, 'image/svg+xml', FAVICON, { cache: 'public, max-age=86400' });
  if (op === 'key') return stuur(res, 200, 'text/plain; charset=utf-8', INDEXNOW_KEY, { robots: 'noindex' });
  if (op === 'overdracht') {
    const stand = { bijgewerkt: BIJGEWERKT, prijzenGelezen: PRIJS_DATUM, paginas: SLUGS.map(s => BASE + '/' + s), boeken: TEL.boeken, totVijfDollar: TEL.tot5, whiteElephantOnderTien: TEL.we10, lastingChange: amz(LC.a), live: echt ? 'bookstuffers.com' : 'voorbeeld', indexnow: await kv.get('bs:indexnow').catch(() => null) };
    if (q.get('format') === 'json') return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify(stand, null, 1), { cache: 'no-store', robots: 'noindex' });
    return stuur(res, 200, 'text/plain; charset=utf-8', OVERDRACHT + '\nSTAND (live)\n' + Object.entries(stand).map(([k, v]) => `- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n') + '\n', { cache: 'no-store', robots: 'noindex' });
  }
  if (op === 'gezond') {
    const fouten = [];
    for (const s of SLUGS) { try { fouten.push(...keur(render(s, ctx(true)), s || 'home')); } catch (e) { fouten.push(`${s || 'home'}: ${e.message}`); } }
    if (q.get('omslagen') === '1') {
      const lijst = [...BOEKEN, LC];
      for (let i = 0; i < lijst.length; i += 8) await Promise.all(lijst.slice(i, i + 8).map(b => fetch(omslag(b.i, 200), { method: 'HEAD', signal: AbortSignal.timeout(8000) }).then(r => { if (!r.ok) fouten.push(`omslag ${b.a}: ${r.status}`); }).catch(e => fouten.push(`omslag ${b.a}: ${e.message}`))));
    }
    return stuur(res, fouten.length ? 500 : 200, 'application/json; charset=utf-8', JSON.stringify({ ok: !fouten.length, paginas: SLUGS.length, boeken: TEL.boeken, fouten }), { cache: 'no-store', robots: 'noindex' });
  }
  // Klik naar Amazon (Henkjan 22 nov 2026: "Lerende modal voor naar amz te sturen"): één 302 zonder tussenpagina, telt de klik per boek per dag
  // (bs:klik:<dag> hash ASIN -> n, 60 dagen) zodat de modal en de pagina's op echte doorkliks leren. Alleen ASIN's van de eigen plank.
  if (op === 'go') {
    const a = String(q.get('a') || '').toUpperCase();
    if (!BOEK_ASIN.has(a)) { res.statusCode = 302; res.setHeader('Location', echt ? '/' : '/api/bs?p='); res.setHeader('Cache-Control', 'no-store'); return res.end(); }
    const bot = /bot|crawler|spider|headless|preview|facebookexternalhit|slurp/i.test(String(req.headers['user-agent'] || ''));
    if (!bot) { const k = 'bs:klik:' + new Date().toISOString().slice(0, 10); try { await kv.raw(['HINCRBY', k, a, '1']); await kv.raw(['EXPIRE', k, String(60 * 864e2)]); } catch (e) {} }
    res.statusCode = 302; res.setHeader('Location', amz(a)); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.setHeader('Referrer-Policy', 'no-referrer');
    return res.end();
  }
  // Omslag via het eigen domein (de modal accepteert alleen beelden op eigen domeinen): 302 naar het Amazon-plaatje, alleen bekende id's.
  if (op === 'omslag') {
    const i = String(q.get('i') || ''); const b = [...BOEKEN, LC].find(x => x.i === i);
    if (!b) return stuur(res, 404, 'text/plain', 'nee', { cache: 'no-store' });
    res.statusCode = 302; res.setHeader('Location', omslag(i, 600)); res.setHeader('Cache-Control', 'public, max-age=86400'); return res.end();
  }
  // Doorkliks per boek, laatste 14 dagen (voor de rondes en de overdracht)
  if (op === 'kliks') {
    const uit = {}; for (let d = 0; d < 14; d++) { const dag = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10); try { const r = await kv.raw(['HGETALL', 'bs:klik:' + dag]); for (let j = 0; r && j < r.length; j += 2) uit[r[j]] = (uit[r[j]] || 0) + (+r[j + 1] || 0); } catch (e) {} }
    const lijst = Object.entries(uit).sort((x, y) => y[1] - x[1]).map(([a, n]) => ({ a, n, t: ([...BOEKEN, LC].find(b => b.a === a) || {}).t }));
    return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify({ dagen: 14, totaal: lijst.reduce((x, y) => x + y.n, 0), boeken: lijst }), { cache: 'no-store', robots: 'noindex' });
  }
  if (op === 'indexnow') {
    if (!echt) return stuur(res, 400, 'application/json', '{"ok":false,"reden":"alleen op bookstuffers.com"}', { cache: 'no-store' });
    const oud = await kv.get('bs:indexnow').catch(() => null);
    if (oud && oud.versie === BIJGEWERKT) return stuur(res, 200, 'application/json', JSON.stringify({ al: true, ...oud }), { cache: 'no-store' });
    const urlList = SLUGS.map(s => BASE + '/' + s);
    let status = 0;
    try { const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`, urlList }), signal: AbortSignal.timeout(15000) }); status = r.status; } catch (e) { status = String(e.message || e).slice(0, 80); }
    if (status === 200 || status === 202) await kv.set('bs:indexnow', { versie: BIJGEWERKT, t: new Date().toISOString(), status, n: urlList.length }).catch(() => {});
    return stuur(res, 200, 'application/json', JSON.stringify({ status, n: urlList.length }), { cache: 'no-store' });
  }
  const slug = String(q.get('p') || '').replace(/^\/+|\/+$/g, '');
  const html = render(slug, ctx(echt));
  if (html == null) return stuur(res, 404, 'text/html; charset=utf-8', render('', ctx(echt)).replace('<main>', '<main><p class="meta">That page does not exist. Here is the shelf.</p>'), { robots: 'noindex', cache: 'public, max-age=60' });
  return stuur(res, 200, 'text/html; charset=utf-8', html, { robots: noidx || 'index, follow' });
}
