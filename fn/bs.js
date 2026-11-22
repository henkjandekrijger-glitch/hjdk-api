// Bookstuffers (bookstuffers.com). Op dat domein komen alle verzoeken via vercel.json hier binnen (rewrites naar /api/bs?p=<pagina>).
// Overal anders (hjdk-api-*.vercel.app, keuzehulp.best) is dit een voorbeeld: /api/bs?p=<pagina>, met noindex in kop en meta.
// Acties: robots, sitemap, llms, zicht (zicht.json), overdracht (?format=text), fav, key (IndexNow-sleutel), gezond (controle, &omslagen=1
// vraagt ook elke omslag op), indexnow (pingt alle URL's één keer per BIJGEWERKT; daarna alleen de bewaarde uitkomst, nooit in een lus).
import { kv } from '../lib/db.js';
import { render, SLUGS, ROBOTS, sitemap, llms, zichtJson, OVERDRACHT, FAVICON, INDEXNOW_KEY, BIJGEWERKT, HOST, BASE, TEL, amz, omslag, keur, BOEK_ASIN, LC_URL } from '../lib/bs.js';
import { BOEKEN, LC, PRIJS_DATUM, ANDER } from '../lib/bs-data.js';
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import * as LCF from '../lib/lcfunnel.js';
import * as LCW from '../lib/lcwaarom.js';
import { berichten, HAIKU } from '../lib/ai.js';
import { ImageResponse } from '@vercel/og';
import { INTER_500, INTER_800 } from '../lib/pinfont.js';
import { pinPlan, haakVan, vind, HAKEN, ACCOUNT as PIN_ACCOUNT } from '../lib/bspin.js';
import { dagRapport, rapportTekst, BRON_OK } from '../lib/bsorganisch.js';
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
  const c = { echt, pdf, L: s => echt ? '/' + s : '/api/bs?site=lc&p=' + encodeURIComponent(s), go: a => echt ? '/go/' + a : '/api/bs?site=lc&op=go&a=' + a };
  const noidx = echt ? '' : 'noindex, nofollow';
  // Artikelen (lib/lcfunnel.js): index lc:arts, stuk lc:art:<slug>, modus lc:art:modus
  const index = (await kv.get('lc:arts').catch(() => null)) || [];
  const live = index.filter(x => x.status === 'live').sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
  c.artikelen = live;
  if (op === 'lcartikel' || op === 'lclive' || op === 'lcmodus') {
    if (!beschermd(req)) return stuur(res, 403, 'application/json', '{"ok":false,"fout":"alleen via de beschermde host"}', { cache: 'no-store' });
    if (op === 'lcmodus') { const m = q.get('m') === 'direct' ? 'direct' : 'eerst-zien'; await kv.set('lc:art:modus', m); return stuur(res, 200, 'application/json', JSON.stringify({ ok: true, modus: m }), { cache: 'no-store' }); }
    if (op === 'lclive') { const sl = q.get('slug') || '', a = await kv.get('lc:art:' + sl).catch(() => null); if (!a) return stuur(res, 404, 'application/json', '{"ok":false}', { cache: 'no-store' }); a.status = q.get('live') === '0' ? 'concept' : 'live'; await kv.set('lc:art:' + sl, a); const i = index.find(x => x.slug === sl); if (i) i.status = a.status; await kv.set('lc:arts', index); return stuur(res, 200, 'text/html; charset=utf-8', `<p style="font:18px system-ui;padding:24px">${a.status === 'live' ? 'Live gezet' : 'Teruggezet naar concept'}: <a href="${LCF.BASE}/${sl}">${LCF.BASE}/${sl}</a></p>`, { cache: 'no-store', robots: 'noindex' }); }
    let a = null; try { a = req.method === 'POST' ? (typeof req.body === 'object' && req.body ? req.body : JSON.parse(await new Promise(r => { let d = ''; req.on('data', x => d += x); req.on('end', () => r(d)); }))) : q.get('z') ? JSON.parse(zlib.inflateRawSync(Buffer.from(q.get('z'), 'base64url')).toString('utf8')) : JSON.parse(q.get('j') || 'null'); } catch (e) {}
    const fout = LCF.checkArtikel(a); if (fout.length) return stuur(res, 400, 'application/json', JSON.stringify({ ok: false, fout }), { cache: 'no-store' });
    const modus = (await kv.get('lc:art:modus').catch(() => null)) || 'eerst-zien';
    a.datum = a.datum || new Date().toISOString().slice(0, 10); a.status = modus === 'direct' ? 'live' : 'concept';
    await kv.set('lc:art:' + a.slug, a); const rest = index.filter(x => x.slug !== a.slug); rest.push({ slug: a.slug, titel: a.titel, datum: a.datum, status: a.status, zoekterm: a.zoekterm || '', volume: a.volume || 0, gerelateerd: a.gerelateerd || [] }); await kv.set('lc:arts', rest);
    return stuur(res, 200, 'application/json', JSON.stringify({ ok: true, slug: a.slug, status: a.status, voorbeeld: 'https://hjdk-api-henq.vercel.app/api/bs?site=lc&p=' + a.slug + '&concept=1', liveZetten: 'https://hjdk-api-henq.vercel.app/api/bs?site=lc&op=lclive&slug=' + a.slug }), { cache: 'no-store' });
  }
  // Lerende chat "Why didn't it work this year?" (lib/lcwaarom.js)
  c.waaromLive = String(await kv.get('lc:w:live').catch(() => '')) === '1';
  if (op === 'lcwaaromlive' || op === 'lcwaarom') {
    if (!beschermd(req)) return stuur(res, 403, 'application/json', '{"ok":false,"fout":"alleen via de beschermde host"}', { cache: 'no-store' });
    if (op === 'lcwaaromlive') { const aan = q.get('live') !== '0'; await kv.set('lc:w:live', aan ? '1' : '0'); return stuur(res, 200, 'application/json', JSON.stringify({ ok: true, live: aan, pagina: LCF.BASE + '/' + LCW.SLUG }), { cache: 'no-store' }); }
    const tel = await hash('lc:w:tel'), arm = await hash('lc:w:arm'), log = ((await kv.raw(['LRANGE', 'lc:w:log', '0', '49']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
    return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify({ live: c.waaromLive, tel, arm, winnaar: await kv.get('lc:w:winnaar').catch(() => null), nieuweRedenen: await hash('lc:w:nieuw'), log }, null, 1), { cache: 'no-store', robots: 'noindex' });
  }
  if (op === 'lcchat') return lcChat(req, res);
  if (op === 'lcartikelen') return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify({ modus: (await kv.get('lc:art:modus').catch(() => null)) || 'eerst-zien', artikelen: index }), { cache: 'no-store', robots: 'noindex' });
  if (op === 'robots') return stuur(res, 200, 'text/plain; charset=utf-8', echt ? LCF.ROBOTS : 'User-agent: *\nDisallow: /\n');
  if (op === 'sitemap') return stuur(res, 200, 'application/xml; charset=utf-8', LCF.sitemapMet(c.waaromLive ? [{ slug: LCW.SLUG, datum: '2026-11-22' }, ...live] : live), { robots: noidx });
  if (op === 'llms') return stuur(res, 200, 'text/plain; charset=utf-8', LCF.llms(), { robots: noidx });
  if (op === 'fav') return stuur(res, 200, 'image/svg+xml', LCF.FAVICON, { cache: 'public, max-age=86400' });
  if (op === 'gezond') {
    const fouten = []; try { fouten.push(...keur(LCW.renderWaarom({ ...c, echt: true }, {}), 'lc:check')); } catch (e) { fouten.push('lc:check: ' + e.message); } for (const s of LCF.SLUGS) { try { fouten.push(...keur(LCF.renderLc(s, { ...c, echt: true }), 'lc:' + (s || 'home'))); } catch (e) { fouten.push('lc:' + s + ': ' + e.message); } }
    let pdfBestand = false; try { pdfBestand = fs.statSync(LCF.PDF_PAD).size > 100000; } catch (e) {}
    if (!pdfBestand) fouten.push('PDF-bestand ontbreekt in de uitrol');
    const st = { ok: !fouten.length, pdfKnop: pdf, pdfBestand, mail: !!(await LCF.resendSleutel(kv)), uitleg: pdf ? 'PDF-verkoop staat aan' : 'PDF-knop uit: PADDLE_API_KEY ontbreekt in Vercel (hjdk-api); alles verwijst naar Amazon', fouten };
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
    try { const nieuw = await kv.raw(['SET', 'lc:koop:' + txn, new Date().toISOString(), 'NX', 'EX', String(400 * 86400)]); if (nieuw) { await kv.raw(['HINCRBY', 'lc:verkoop', new Date().toISOString().slice(0, 10), '1']); await LCF.mailDownload(kv, r.email, link); } } catch (e) {}
    return stuur(res, 200, 'text/html; charset=utf-8', LCF.bedanktPagina(c, { ok: true, link }), { cache: 'no-store', robots: 'noindex' });
  }
  if (op === 'verkoop') { let h = []; try { h = await kv.raw(['HGETALL', 'lc:verkoop']); } catch (e) {} const o = {}; for (let i = 0; h && i < h.length; i += 2) o[h[i]] = +h[i + 1]; return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify({ pdfKnop: pdf, perDag: o }), { cache: 'no-store', robots: 'noindex' }); }
  const slug = String(q.get('p') || '').replace(/^\/+|\/+$/g, '');
  if (slug === 'guides') return stuur(res, 200, 'text/html; charset=utf-8', LCF.renderGidsen(c, live), { robots: noidx || 'index, follow', cache: 'public, max-age=120, s-maxage=600' });
  if (slug && !LCF.SLUGS.includes(slug)) {
    const a = await kv.get('lc:art:' + slug).catch(() => null);
    if (a && (a.status === 'live' || q.get('concept') === '1')) {
      const rel = [...(a.gerelateerd || []).map(s => live.find(x => x.slug === s)).filter(Boolean), ...live.filter(x => x.slug !== a.slug && !(a.gerelateerd || []).includes(x.slug))].slice(0, 4);
      return stuur(res, 200, 'text/html; charset=utf-8', LCF.renderArtikel(c, a, rel), { robots: a.status === 'live' ? (noidx || 'index, follow') : 'noindex, nofollow', cache: a.status === 'live' ? 'public, max-age=120, s-maxage=600' : 'no-store' });
    }
  }
  if (slug === LCW.SLUG) {
    if (!c.waaromLive && q.get('concept') !== '1') { res.statusCode = 302; res.setHeader('Location', c.L('')); res.setHeader('Cache-Control', 'no-store'); return res.end(); }
    return stuur(res, 200, 'text/html; charset=utf-8', LCW.renderWaarom(c, await hash('lc:w:tel')), { robots: c.waaromLive ? (noidx || 'index, follow') : 'noindex, nofollow', cache: c.waaromLive ? 'public, max-age=60, s-maxage=300' : 'no-store' });
  }
  const html = LCF.renderLc(slug, c);
  if (html == null) { res.statusCode = 302; res.setHeader('Location', c.L('')); res.setHeader('Cache-Control', 'no-store'); return res.end(); }
  return stuur(res, 200, 'text/html; charset=utf-8', html, { robots: noidx || 'index, follow', cache: 'public, max-age=120, s-maxage=600' });
}

async function hash(k) { const r = await kv.raw(['HGETALL', k]).catch(() => null), o = {}; if (Array.isArray(r)) for (let i = 0; i + 1 < r.length; i += 2) o[r[i]] = +r[i + 1] || 0; else if (r) for (const x in r) o[x] = +r[x] || 0; return o; }
async function leesBody(req) { if (req.body && typeof req.body === 'object') return req.body; const t = typeof req.body === 'string' ? req.body : await new Promise(r => { let d = ''; req.on('data', x => { if (d.length < 8000) d += x; }); req.on('end', () => r(d)); req.on('error', () => r('')); }); try { return JSON.parse(t || '{}'); } catch (e) { return {}; } }

// De chat: advies na drie tikken, een klik op de knop, of een persoonlijk antwoord op vrije tekst. Telt alles; nooit een leeg antwoord.
async function lcChat(req, res) {
  const json = (o, s = 200) => stuur(res, s, 'application/json; charset=utf-8', JSON.stringify(o), { cache: 'no-store', robots: 'noindex' });
  if (req.method !== 'POST') return json({ ok: false }, 405);
  const b = await leesBody(req), d = new Date().toISOString().slice(0, 10), sid = String(b.sid || '').replace(/[^a-z0-9]/gi, '').slice(0, 40);
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), ih = crypto.createHash('sha256').update(ip + d).digest('hex').slice(0, 16);
  if (/bot|crawler|spider|headless/i.test(String(req.headers['user-agent'] || ''))) return json({ ok: false }, 403);
  const per = +(await kv.raw(['INCR', 'lc:w:ip:' + ih]).catch(() => 0)) || 0; if (per === 1) await kv.raw(['EXPIRE', 'lc:w:ip:' + ih, '86400']).catch(() => null);
  if (per > 40) return json({ ok: false, fout: 'te veel' }, 429);
  let arm = b.arm === 'b' ? 'b' : 'a'; const winnaar = await kv.get('lc:w:winnaar').catch(() => null);
  if (b.ev === 'klik') { if (sid && (await kv.raw(['SET', 'lc:w:k:' + sid, '1', 'NX', 'EX', '86400']).catch(() => null)) === 'OK') { await kv.raw(['HINCRBY', 'lc:w:arm', arm + ':klik', '1']).catch(() => null); await kv.raw(['HINCRBY', 'lc:w:dag:' + d, 'klik', '1']).catch(() => null); } return json({ ok: true }); }
  if (!LCW.geldig(b)) return json({ ok: false, fout: 'ongeldig' }, 400);
  if (winnaar === 'a' || winnaar === 'b') arm = winnaar;
  if (typeof b.tekst === 'string' && b.tekst.trim()) {
    const tekst = b.tekst.trim().slice(0, 600);
    if (LCW.ZORG.test(tekst)) return json({ ok: true, a: LCW.ZORG_ANTWOORD, zorg: true });
    const reserve = () => { const a = LCW.advies(b); return a.oplossing + ' ' + a.vandaag; };
    const pm = +(await kv.raw(['INCR', 'lc:w:m:' + ih]).catch(() => 0)) || 0; if (pm === 1) await kv.raw(['EXPIRE', 'lc:w:m:' + ih, '86400']).catch(() => null);
    const tot = +(await kv.raw(['HINCRBY', 'lc:w:dag:' + d, 'model', '1']).catch(() => 0)) || 0;
    let a = '', reden = '';
    if (pm <= 4 && tot <= 400) {
      try {
        const r = await berichten({ fn: 'lc-waarom', model: HAIKU, system: LCW.SYSTEEM, user: `Goal: ${LCW.naam(LCW.DOELEN, b.doel)}. How far they got: ${LCW.naam(LCW.FASEN, b.fase)}. Reason they picked: ${LCW.naam(LCW.REDENEN, b.reden)}.\nIn their own words: ${tekst}`, max: 400, timeout: 20000 });
        const m = String(r.txt || '').match(/\{[\s\S]*\}/); const j = m ? JSON.parse(m[0]) : null;
        if (j && typeof j.a === 'string' && j.a.length > 40) { a = j.a.replace(/\s[—–]\s/g, ', ').trim(); reden = String(j.reden || '').toLowerCase().replace(/[^a-z ]/g, '').trim().slice(0, 40); }
      } catch (e) {}
    }
    if (reden) { if (LCW.REDENEN.some(x => x[0] === reden)) await kv.raw(['HINCRBY', 'lc:w:tel', 'vrij:' + reden, '1']).catch(() => null); else await kv.raw(['HINCRBY', 'lc:w:nieuw', reden, '1']).catch(() => null); }
    await kv.raw(['LPUSH', 'lc:w:log', JSON.stringify({ t: new Date().toISOString(), doel: b.doel, fase: b.fase, reden: b.reden, tekst, model: reden || '', a: a ? 1 : 0 })]).catch(() => null); await kv.raw(['LTRIM', 'lc:w:log', '0', '999']).catch(() => null);
    await kv.raw(['HINCRBY', 'lc:w:dag:' + d, 'vrij', '1']).catch(() => null);
    return json({ ok: true, a: a || reserve() });
  }
  if (sid && (await kv.raw(['SET', 'lc:w:s:' + sid, '1', 'NX', 'EX', '86400']).catch(() => null)) === 'OK') {
    for (const v of LCW.telVelden(b)) await kv.raw(['HINCRBY', 'lc:w:tel', v, '1']).catch(() => null);
    await kv.raw(['HINCRBY', 'lc:w:dag:' + d, 'n', '1']).catch(() => null); await kv.raw(['HINCRBY', 'lc:w:dag:' + d, 'r:' + b.reden, '1']).catch(() => null); await kv.raw(['EXPIRE', 'lc:w:dag:' + d, String(120 * 86400)]).catch(() => null);
    const st = await hash('lc:w:arm'); await kv.raw(['HINCRBY', 'lc:w:arm', arm + ':toon', '1']).catch(() => null); st[arm + ':toon'] = (st[arm + ':toon'] || 0) + 1;
    if (!winnaar && (st['a:toon'] || 0) >= 150 && (st['b:toon'] || 0) >= 150) { const ra = (st['a:klik'] || 0) / st['a:toon'], rb = (st['b:klik'] || 0) / st['b:toon']; if (Math.max(ra, rb) >= 1.3 * Math.min(ra, rb) && Math.max(ra, rb) > 0) await kv.set('lc:w:winnaar', ra > rb ? 'a' : 'b').catch(() => null); }
  }
  return json(Object.assign({ ok: true, arm }, LCW.advies({ ...b, arm }, await hash('lc:w:tel'))));
}

export default async function handler(req, res) {
  const u = new URL(req.url, 'https://' + HOST), q = u.searchParams, op = q.get('op') || '', echt = isEcht(req);
  if ((isLc(req) || q.get('site') === 'lc') && !['go', 'tel', 'dagrapport'].includes(op)) return lcHandler(req, res, q, isLc(req));
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

  // Tel per paginabezoek (lib/bsorganisch.js meetJs): site|bron en site|p|pad per UTC-dag, 60 dagen. Bots tellen niet.
  if (op === 'tel') {
    const site = q.get('site') === 'lc' ? 'lc' : 'bs', bron = BRON_OK.test(q.get('s') || '') ? q.get('s') : 'overig', pad = String(q.get('p') || '/').slice(0, 80).replace(/[^a-z0-9\/-]/gi, '') || '/';
    const bot = /bot|crawler|spider|headless|preview|slurp|facebookexternalhit/i.test(String(req.headers['user-agent'] || ''));
    if (!bot && bron !== 'intern') { const k = 'bs:tel:' + new Date().toISOString().slice(0, 10); try { await kv.raw(['HINCRBY', k, site + '|' + bron, '1']); await kv.raw(['HINCRBY', k, site + '|p|' + pad, '1']); await kv.raw(['EXPIRE', k, String(60 * 86400)]); } catch (e) {} }
    else if (!bot) { const k = 'bs:tel:' + new Date().toISOString().slice(0, 10); try { await kv.raw(['HINCRBY', k, site + '|p|' + pad, '1']); await kv.raw(['EXPIRE', k, String(60 * 86400)]); } catch (e) {} }
    return stuur(res, 204, 'text/plain', '', { cache: 'no-store', robots: 'noindex' });
  }
  // Dagrapport organisch via Telegram (cron 12:13 UTC); &droog=1 laat de tekst zien zonder te versturen
  if (op === 'dagrapport') {
    const cron = /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
    if (!cron && !beschermd(req)) return stuur(res, 403, 'application/json', '{"ok":false}', { cache: 'no-store' });
    let zicht = null; try { const z = await (await fetch('https://keuzehulp.best/api/zicht?op=stand&site=bookstuffers', { signal: AbortSignal.timeout(8000) })).json(); const l = z && z.sites && z.sites.bookstuffers && z.sites.bookstuffers.laatste; if (l) zicht = { imp: l.gsc && l.gsc.imp, clicks: l.gsc && l.gsc.clicks, geindexeerd: l.index && l.index.geindexeerd, ai: Array.isArray(l.llm) ? l.llm.filter(x => x.genoemd || x.geciteerd).length : 0 }; } catch (e) {}
    let pins = null; try { const log = (await kv.get('bs:pinlog')) || [], st = (await kv.get('bs:pinstand')) || {}, gist = new Date(Date.now() - 864e5).toISOString().slice(0, 10); const t = Object.entries(st).reduce((a, [, v]) => ({ klik: a.klik + (v.klik || 0), saves: a.saves + (v.saves || 0) }), { klik: 0, saves: 0 }); const beste = Object.entries(st).sort((a, b) => ((b[1].klik || 0) + (b[1].saves || 0)) - ((a[1].klik || 0) + (a[1].saves || 0)))[0]; pins = { geplaatst: log.filter(x => String(x.t).startsWith(gist)).length, ...t, beste: beste && ((beste[1].klik || 0) + (beste[1].saves || 0)) > 0 ? beste[0] : '' }; } catch (e) {}
    const arts = (await kv.get('lc:arts').catch(() => null)) || [];
    const r = await dagRapport(kv, { droog: q.get('droog') === '1', extra: { zicht, pins, arts } });
    return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify(r), { cache: 'no-store', robots: 'noindex' });
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
        el('div', { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: '24px 0 20px' }, [{ type: 'img', props: { src: `https://m.media-amazon.com/images/I/${b.i}._SL1200_.jpg`, width: 640, height: 900, style: { objectFit: 'contain' } } }]),
        el('div', { alignItems: 'center', justifyContent: 'space-between' }, [
          el('div', { background: '#111113', color: '#ffffff', fontSize: 36, fontWeight: 800, padding: '22px 40px', borderRadius: 999 }, lc ? 'Start Day 0 today' : h.bord === 'bijbel' ? 'Read the guide' : 'See the book'),
          el('div', { fontSize: 32, fontWeight: 500 }, `${b.n} pages${b.c >= 10 ? ` · rated ${b.r}/5` : ''}`)
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
    if (!bot) { const dg = new Date().toISOString().slice(0, 10), k = 'bs:klik:' + dg, bron = BRON_OK.test(q.get('s') || '') ? q.get('s') : 'onbekend'; try { await kv.raw(['HINCRBY', k, a, '1']); await kv.raw(['EXPIRE', k, String(60 * 864e2)]); await kv.raw(['HINCRBY', 'bs:gosrc:' + dg, (isLc(req) || q.get('site') === 'lc' ? 'lc' : 'bs') + '|' + bron, '1']); await kv.raw(['EXPIRE', 'bs:gosrc:' + dg, String(60 * 864e2)]); } catch (e) {} }
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
    const versie = BIJGEWERKT + '-' + SLUGS.length;
    if (oud && oud.versie === versie) return stuur(res, 200, 'application/json', JSON.stringify({ al: true, ...oud }), { cache: 'no-store' });
    const urlList = SLUGS.map(s => BASE + '/' + s);
    let status = 0;
    try { const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`, urlList }), signal: AbortSignal.timeout(15000) }); status = r.status; } catch (e) { status = String(e.message || e).slice(0, 80); }
    if (status === 200 || status === 202) await kv.set('bs:indexnow', { versie, t: new Date().toISOString(), status, n: urlList.length }).catch(() => {});
    return stuur(res, 200, 'application/json', JSON.stringify({ status, n: urlList.length }), { cache: 'no-store' });
  }
  const slug = String(q.get('p') || '').replace(/^\/+|\/+$/g, '');
  if (slug === 'lasting-change') { res.statusCode = 301; res.setHeader('Location', LC_URL); res.setHeader('Cache-Control', 'public, max-age=3600'); return res.end(); }
  const html = render(slug, ctx(echt));
  if (html == null) return stuur(res, 404, 'text/html; charset=utf-8', render('', ctx(echt)).replace('<main>', '<main><p class="meta">That page does not exist. Here is the shelf.</p>'), { robots: 'noindex', cache: 'public, max-age=60' });
  return stuur(res, 200, 'text/html; charset=utf-8', html, { robots: noidx || 'index, follow' });
}
