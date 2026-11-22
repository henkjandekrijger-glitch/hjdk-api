// Bookstuffers (bookstuffers.com). Op dat domein komen alle verzoeken via vercel.json hier binnen (rewrites naar /api/bs?p=<pagina>).
// Overal anders (hjdk-api-*.vercel.app, keuzehulp.best) is dit een voorbeeld: /api/bs?p=<pagina>, met noindex in kop en meta.
// Acties: robots, sitemap, llms, zicht (zicht.json), overdracht (?format=text), fav, key (IndexNow-sleutel), gezond (controle, &omslagen=1
// vraagt ook elke omslag op), indexnow (pingt alle URL's één keer per BIJGEWERKT; daarna alleen de bewaarde uitkomst, nooit in een lus).
import { kv } from '../lib/db.js';
import { render, SLUGS, ROBOTS, sitemap, llms, zichtJson, OVERDRACHT, FAVICON, INDEXNOW_KEY, BIJGEWERKT, HOST, BASE, TEL, amz, omslag, keur, BOEK_ASIN, LC_URL } from '../lib/bs.js';
import { BOEKEN, LC, PRIJS_DATUM, ANDER } from '../lib/bs-data.js';
import fs from 'node:fs';
import * as LCF from '../lib/lcfunnel.js';
import { ImageResponse } from '@vercel/og';
import { INTER_500, INTER_800 } from '../lib/pinfont.js';
import { pinPlan, haakVan, vind, HAKEN, ACCOUNT as PIN_ACCOUNT } from '../lib/bspin.js';
const FONTS = [{ name: 'Inter', data: Buffer.from(INTER_500, 'base64'), weight: 500, style: 'normal' }, { name: 'Inter', data: Buffer.from(INTER_800, 'base64'), weight: 800, style: 'normal' }];
const el = (type, style, children) => ({ type, props: { style: Object.assign({ display: 'flex' }, style), children } });
const beschermd = req => /-henq\.vercel\.app$/i.test(String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]);

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


// Lasting Change-funnel (lastingchange.works, lib/lcfunnel.js). Voorbeeld buiten het domein: /api/bs?site=lc&p=<pagina> (noindex).
const isLc = req => /(^|\.)lastingchange\.works$/i.test(String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]);
async function lcHandler(req, res, q, echt) {
  const op = q.get('op') || '', pdf = !!(await LCF.paddleSleutel(kv));
  const c = { echt, pdf, L: s => echt ? '/' + s : '/api/bs?site=lc&p=' + encodeURIComponent(s) };
  const noidx = echt ? '' : 'noindex, nofollow';
  if (op === 'robots') return stuur(res, 200, 'text/plain; charset=utf-8', echt ? LCF.ROBOTS : 'User-agent: *\nDisallow: /\n');
  if (op === 'sitemap') return stuur(res, 200, 'application/xml; charset=utf-8', LCF.sitemap(), { robots: noidx });
  if (op === 'llms') return stuur(res, 200, 'text/plain; charset=utf-8', LCF.llms(), { robots: noidx });
  if (op === 'fav') return stuur(res, 200, 'image/svg+xml', LCF.FAVICON, { cache: 'public, max-age=86400' });
  if (op === 'gezond') {
    const fouten = []; for (const s of LCF.SLUGS) { try { fouten.push(...keur(LCF.renderLc(s, { ...c, echt: true }), 'lc:' + (s || 'home'))); } catch (e) { fouten.push('lc:' + s + ': ' + e.message); } }
    let pdfBestand = false; try { pdfBestand = fs.statSync(LCF.PDF_PAD).size > 100000; } catch (e) {}
    if (!pdfBestand) fouten.push('PDF-bestand ontbreekt in de uitrol');
    const st = { ok: !fouten.length, pdfKnop: pdf, pdfBestand, mail: !!process.env.RESEND_API_KEY, uitleg: pdf ? 'PDF-verkoop staat aan' : 'PDF-knop uit: PADDLE_API_KEY ontbreekt in Vercel (hjdk-api); alles verwijst naar Amazon', fouten };
    return stuur(res, fouten.length ? 500 : 200, 'application/json; charset=utf-8', JSON.stringify(st), { cache: 'no-store', robots: 'noindex' });
  }
  if (op === 'download') {
    if (!LCF.checkDownload(q)) return stuur(res, 403, 'text/plain; charset=utf-8', 'This download link is not valid any more. Reply to the email with your receipt and you get a new one.', { cache: 'no-store', robots: 'noindex' });
    let buf; try { buf = fs.readFileSync(LCF.PDF_PAD); } catch (e) { return stuur(res, 500, 'text/plain; charset=utf-8', 'The file is temporarily unavailable. Reply to your receipt email and you get it directly.', { cache: 'no-store' }); }
    res.statusCode = 200; res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', 'attachment; filename="Lasting-Change-Workbook-2027.pdf"'); res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Robots-Tag', 'noindex'); return res.end(buf);
  }
  if (op === 'thanks') {
    const txn = String(q.get('txn') || '');
    const r = await LCF.checkTransactie(kv, txn);
    if (!r.ok) return stuur(res, 200, 'text/html; charset=utf-8', LCF.bedanktPagina(c, { ok: false, reden: r.reden }), { cache: 'no-store', robots: 'noindex' });
    const link = (echt ? LCF.BASE + '/download?' : 'https://' + (req.headers.host || HOST) + '/api/bs?site=lc&op=download&') + LCF.tekenDownload(txn);
    try { const nieuw = await kv.raw(['SET', 'lc:koop:' + txn, new Date().toISOString(), 'NX', 'EX', String(400 * 86400)]); if (nieuw) { await kv.raw(['HINCRBY', 'lc:verkoop', new Date().toISOString().slice(0, 10), '1']); await LCF.mailDownload(r.email, link); } } catch (e) {}
    return stuur(res, 200, 'text/html; charset=utf-8', LCF.bedanktPagina(c, { ok: true, link }), { cache: 'no-store', robots: 'noindex' });
  }
  if (op === 'verkoop') { let h = []; try { h = await kv.raw(['HGETALL', 'lc:verkoop']); } catch (e) {} const o = {}; for (let i = 0; h && i < h.length; i += 2) o[h[i]] = +h[i + 1]; return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify({ pdfKnop: pdf, perDag: o }), { cache: 'no-store', robots: 'noindex' }); }
  const slug = String(q.get('p') || '').replace(/^\/+|\/+$/g, '');
  const html = LCF.renderLc(slug, c);
  if (html == null) { res.statusCode = 302; res.setHeader('Location', c.L('')); res.setHeader('Cache-Control', 'no-store'); return res.end(); }
  return stuur(res, 200, 'text/html; charset=utf-8', html, { robots: noidx || 'index, follow', cache: 'public, max-age=120, s-maxage=600' });
}

export default async function handler(req, res) {
  const u = new URL(req.url, 'https://' + HOST), q = u.searchParams, op = q.get('op') || '', echt = isEcht(req);
  if (isLc(req) || q.get('site') === 'lc') return lcHandler(req, res, q, isLc(req));
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
      const lijst = [...BOEKEN, ...ANDER, LC];
      for (let i = 0; i < lijst.length; i += 8) await Promise.all(lijst.slice(i, i + 8).map(b => fetch(omslag(b.i, 200), { method: 'HEAD', signal: AbortSignal.timeout(8000) }).then(r => { if (!r.ok) fouten.push(`omslag ${b.a}: ${r.status}`); }).catch(e => fouten.push(`omslag ${b.a}: ${e.message}`))));
    }
    return stuur(res, fouten.length ? 500 : 200, 'application/json; charset=utf-8', JSON.stringify({ ok: !fouten.length, paginas: SLUGS.length, boeken: TEL.boeken, fouten }), { cache: 'no-store', robots: 'noindex' });
  }

  // Pinbeeld 1000x1500 in de huisstijl (wit, zwart, de omslag is de kleur): /pin/<ASIN>-<haak>.png op bookstuffers.com
  if (op === 'pinbeeld') {
    const m = String(q.get('f') || '').match(/^([A-Za-z0-9]{10})-([a-z0-9-]+?)(?:\.png)?$/), b = m && vind(m[1]), h = m && haakVan(m[2]);
    if (!b || !h) return stuur(res, 404, 'text/plain', 'onbekend', { cache: 'no-store' });
    try {
      const kop = h.kop(b), lc = h.bord === 'lc';
      const beeld = el('div', { width: '100%', height: '100%', flexDirection: 'column', background: '#ffffff', fontFamily: 'Inter', color: '#111113', padding: '70px 72px 64px' }, [
        el('div', { fontSize: 28, fontWeight: 800, letterSpacing: 4 }, lc ? 'LASTING CHANGE' : 'BOOKSTUFFERS'),
        el('div', { fontSize: kop.length > 44 ? 66 : 80, fontWeight: 800, lineHeight: 1.06, marginTop: 26, letterSpacing: -2 }, kop),
        el('div', { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: '40px 0 30px' }, [{ type: 'img', props: { src: `https://m.media-amazon.com/images/I/${b.i}._SL900_.jpg`, height: 820, style: { objectFit: 'contain', boxShadow: '0 30px 60px rgba(17,17,19,.25)', borderRadius: 8 } } }]),
        el('div', { alignItems: 'center', justifyContent: 'space-between' }, [
          el('div', { background: '#111113', color: '#ffffff', fontSize: 36, fontWeight: 800, padding: '22px 40px', borderRadius: 999 }, lc ? 'Start Day 0 today' : h.bord === 'bijbel' ? 'Read the guide' : 'See the book'),
          el('div', { fontSize: 32, fontWeight: 500 }, `${b.n} pages${b.c >= 10 ? ` · ${b.r}★` : ''}`)
        ])
      ]);
      const buf = Buffer.from(await new ImageResponse(beeld, { width: 1000, height: 1500, fonts: FONTS }).arrayBuffer());
      if (buf.length < 5000) throw new Error('leeg beeld');
      res.statusCode = 200; res.setHeader('Content-Type', 'image/png'); res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800'); return res.end(buf);
    } catch (e) { return stuur(res, 500, 'text/plain', 'beeld mislukt: ' + String(e.message || e).slice(0, 100), { cache: 'no-store' }); }
  }
  // Plan van vandaag (lezen mag iedereen); log en uitkomst alleen via de beschermde host (hjdk-api-henq.vercel.app)
  if (op === 'pinplan' || op === 'pinstand') {
    const stand = (await kv.get('bs:pinstand').catch(() => null)) || {}, log = (await kv.get('bs:pinlog').catch(() => null)) || [];
    if (op === 'pinstand') return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify({ account: PIN_ACCOUNT, haken: HAKEN.map(h => ({ id: h.id, ...(stand[h.id] || {}) })), laatste: log.slice(-20) }), { cache: 'no-store', robots: 'noindex' });
    const gisteren = log.filter(x => Date.now() - Date.parse(x.t) < 2 * 864e5).map(x => x.a);
    return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify({ account: PIN_ACCOUNT, pins: pinPlan(stand, { aantal: Math.max(1, Math.min(8, +q.get('n') || 4)), gisteren }) }), { cache: 'no-store', robots: 'noindex' });
  }
  if (op === 'pinlog' || op === 'pinuitkomst') {
    if (!beschermd(req)) return stuur(res, 403, 'application/json', '{"ok":false,"fout":"alleen via de beschermde host"}', { cache: 'no-store' });
    const log = (await kv.get('bs:pinlog').catch(() => null)) || [], stand = (await kv.get('bs:pinstand').catch(() => null)) || {};
    if (op === 'pinlog') {
      const x = { id: String(q.get('id') || ''), haak: String(q.get('haak') || ''), a: String(q.get('a') || ''), post: String(q.get('post') || ''), t: new Date().toISOString() };
      if (!haakVan(x.haak) || !vind(x.a) || log.some(y => y.id === x.id)) return stuur(res, 400, 'application/json', '{"ok":false}', { cache: 'no-store' });
      log.push(x); (stand[x.haak] = stand[x.haak] || { pins: 0, klik: 0, saves: 0, imp: 0 }).pins++;
    } else {
      const x = log.find(y => y.id === q.get('id')); if (!x) return stuur(res, 404, 'application/json', '{"ok":false}', { cache: 'no-store' });
      const oud = x.m || { klik: 0, saves: 0, imp: 0 }, nu = { klik: +q.get('klik') || 0, saves: +q.get('saves') || 0, imp: +q.get('imp') || 0 };
      const s = stand[x.haak] = stand[x.haak] || { pins: 0, klik: 0, saves: 0, imp: 0 }; for (const k of ['klik', 'saves', 'imp']) s[k] += nu[k] - (oud[k] || 0); x.m = nu;
    }
    await kv.set('bs:pinlog', log.slice(-500)); await kv.set('bs:pinstand', stand);
    return stuur(res, 200, 'application/json', JSON.stringify({ ok: true, stand }), { cache: 'no-store' });
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
    const i = String(q.get('i') || ''); const b = [...BOEKEN, ...ANDER, LC].find(x => x.i === i);
    if (!b) return stuur(res, 404, 'text/plain', 'nee', { cache: 'no-store' });
    res.statusCode = 302; res.setHeader('Location', omslag(i, 600)); res.setHeader('Cache-Control', 'public, max-age=86400'); return res.end();
  }
  // Doorkliks per boek, laatste 14 dagen (voor de rondes en de overdracht)
  if (op === 'kliks') {
    const uit = {}; for (let d = 0; d < 14; d++) { const dag = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10); try { const r = await kv.raw(['HGETALL', 'bs:klik:' + dag]); for (let j = 0; r && j < r.length; j += 2) uit[r[j]] = (uit[r[j]] || 0) + (+r[j + 1] || 0); } catch (e) {} }
    const lijst = Object.entries(uit).sort((x, y) => y[1] - x[1]).map(([a, n]) => ({ a, n, t: ([...BOEKEN, ...ANDER, LC].find(b => b.a === a) || {}).t }));
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
  if (slug === 'lasting-change') { res.statusCode = 301; res.setHeader('Location', LC_URL); res.setHeader('Cache-Control', 'public, max-age=3600'); return res.end(); }
  const html = render(slug, ctx(echt));
  if (html == null) return stuur(res, 404, 'text/html; charset=utf-8', render('', ctx(echt)).replace('<main>', '<main><p class="meta">That page does not exist. Here is the shelf.</p>'), { robots: 'noindex', cache: 'public, max-age=60' });
  return stuur(res, 200, 'text/html; charset=utf-8', html, { robots: noidx || 'index, follow' });
}
