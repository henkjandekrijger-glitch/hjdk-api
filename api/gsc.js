// Search Console-leerlus voor keuzehulp.best, whichtobuy.best en kaufberater.best (dagelijks, cron 02:40 UTC, vóór de planners).
// 1) per pagina én per zoekvraag ophalen (28 dagen); 2) zoekvragen waarvoor we vertoond worden maar die nergens echt beantwoord worden -> hjdk:gsc:<site>.open
//    (kzmaak en wtbmaak zetten die vooraan in hun onderwerpenlijst); 3) pagina's met te lage CTR -> nieuwe titel + omschrijving (max 3 per site per dag, 21 dagen rust per pagina).
// Routes: /api/gsc?op=status (openbaar overzicht), op=whoami (welk Vercel-token, zonder het token zelf), op=dag (cron of token=HJDK_TOKEN), op=sites (token).
import { kv } from '../lib/db.js';
import { SITES, claims, sites, propFor, rows, analyse } from '../lib/gsc.js';
import { MARKETS, items as wtbItems, K as WK, claude, json, indexnow as wtbIndexnow } from '../lib/wtb.js';
import seed from '../data/kz.json' with { type: 'json' };

const KZ_INDEXNOW = '466971cbc1bbe43e6bb64a94465e4470';
const DAY = () => new Date().toISOString().slice(0, 10);
const isLive = it => !it.publishAt || String(it.publishAt) <= DAY();
async function kzItems() {
  const extra = []; try { const idx = (await kv.get('hjdk:kz:index')) || []; const vals = idx.length ? await kv.mget(...idx.map(s => 'hjdk:kz:' + s)) : []; vals.forEach(v => { if (v && v.slug) extra.push(v); }); } catch (e) {}
  const ov = {}; extra.forEach(v => { if (v.override) ov[v.slug] = v; }); const seen = {}; const out = [];
  seed.items.concat(extra.filter(v => !v.override)).forEach(i0 => { const it = ov[i0.slug] ? Object.assign({}, i0, ov[i0.slug]) : i0; if (!seen[it.slug] && isLive(it)) { seen[it.slug] = 1; out.push(it); } });
  return out;
}
async function log(e) { try { const l = (await kv.get('hjdk:gsc:log')) || []; l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set('hjdk:gsc:log', l.slice(0, 200)); } catch (x) {} }

// nieuwe titel en omschrijving voor een pagina die wel getoond, maar niet aangeklikt wordt
async function herschrijf(lang, it, p, oidc) {
  const sys = `You write search result snippets (title tag + meta description) that get clicked. Language: ${lang === 'nl' ? 'Dutch (je-vorm)' : lang === 'de' ? 'German (du-Form)' : 'US English'}. The page is a buying guide that asks 3 questions and gives one product pick with today's price. Rules: title max 60 characters, starts with the words searchers actually use, includes the year 2026 only if it helps, no clickbait, no ALL CAPS, no brand names unless in the queries. Description 120-155 characters: say what the reader gets (a clear pick in 3 questions, current prices, what to watch out for). Reply ONLY JSON {"seoTitle":"","metaDesc":""}.`;
  const user = JSON.stringify({ huidigeTitel: it.seoTitle || it.h1 || it.title, huidigeOmschrijving: it.metaDesc || it.kort || it.intro, zoekvragenWaarvoorGetoond: p.topQ, vertoningen: p.imp, kliks: p.clicks, gemiddeldePositie: p.pos });
  const r = await claude(sys, user, { fast: true, max: 400, oidc }); const j = json(r.txt);
  const t = String(j.seoTitle || '').trim().slice(0, 70), d = String(j.metaDesc || '').trim().slice(0, 170);
  if (t.length < 15 || d.length < 60) throw new Error('herschrijving te kort'); return { seoTitle: t, metaDesc: d };
}
async function fixKz(it, nieuw, p) {
  const key = 'hjdk:kz:' + it.slug; const cur = await kv.get(key).catch(() => null);
  const hist = { dag: DAY(), oud: it.seoTitle || it.h1, imp: p.imp, clicks: p.clicks, pos: p.pos };
  if (cur && cur.slug && !cur.override) await kv.set(key, Object.assign(cur, nieuw, { titleFixAt: DAY(), titleHist: [hist, ...(cur.titleHist || [])].slice(0, 5) }));
  else { await kv.set(key, Object.assign({}, cur || {}, { slug: it.slug, override: true }, nieuw, { titleFixAt: DAY(), titleHist: [hist, ...((cur && cur.titleHist) || [])].slice(0, 5) })); const idx = (await kv.get('hjdk:kz:index')) || []; if (!idx.includes(it.slug)) { idx.push(it.slug); await kv.set('hjdk:kz:index', idx); } }
}
async function fixWtb(m, it, nieuw, p) {
  const key = WK.item(m.id, it.slug); const cur = (await kv.get(key)) || it;
  await kv.set(key, Object.assign(cur, nieuw, { titleFixAt: DAY(), titleHist: [{ dag: DAY(), oud: cur.seoTitle || cur.h1, imp: p.imp, clicks: p.clicks, pos: p.pos }, ...(cur.titleHist || [])].slice(0, 5) }));
}

// vervolgvragen beantwoorden op de pagina die al getoond wordt: nieuwe FAQ-items (eerlijk, algemeen, geen verzonnen productdata)
async function faqErbij(lang, it, vragen, oidc) {
  const sys = `You add FAQ entries to an existing buying-guide page. Language: ${lang === 'nl' ? 'Dutch (je-vorm)' : lang === 'de' ? 'German (du-Form)' : 'US English'}. People found this page on Google with the search queries given, but the page does not answer them yet. For each query that a buyer of this product type genuinely asks, write ONE FAQ entry: "q" = the question as a buyer would phrase it (natural, not keyword-stuffed), "a" = a direct, honest answer of 2-4 sentences that starts with the answer itself, gives typical ranges or rules of thumb where useful, and ends by tying back to choosing the right product. Never invent specific product specs, prices, test results or model numbers; if a query is about one specific model or needs data you do not have, answer generally (what to check) or skip it. Skip queries that are off-topic, not about buying/using this product, or would duplicate an existing FAQ. Reply ONLY JSON {"faq":[{"q":"","a":"","query":"the original search query"}]} with at most 2 entries.`;
  const user = JSON.stringify({ pagina: it.title || it.h1, kort: it.kort || it.intro, bestaandeFaq: (it.faq || []).map(f => f.q), zoekvragen: vragen.map(v => v.q) });
  const r = await claude(sys, user, { fast: true, max: 900, oidc }); const j = json(r.txt);
  return (j.faq || []).filter(f => f && String(f.q || '').length > 8 && String(f.a || '').length > 60).slice(0, 2).map(f => ({ q: String(f.q).trim().slice(0, 160), a: String(f.a).trim().slice(0, 700), bron: 'search-console', query: String(f.query || '').slice(0, 120), dag: DAY() }));
}
async function saveFaq(m, it, nieuw) {
  if (m) { const key = WK.item(m.id, it.slug); const cur = (await kv.get(key)) || it; await kv.set(key, Object.assign(cur, { faq: [...(cur.faq || []), ...nieuw], updatedAt: DAY() })); return; }
  const key = 'hjdk:kz:' + it.slug; const cur = await kv.get(key).catch(() => null);
  if (cur && cur.slug && !cur.override) { await kv.set(key, Object.assign(cur, { faq: [...(cur.faq || []), ...nieuw], updatedAt: DAY() })); return; }
  const base = it.faq || []; await kv.set(key, Object.assign({}, cur || {}, { slug: it.slug, override: true, faq: [...((cur && cur.faq) || base), ...nieuw], updatedAt: DAY() }));
  const idx = (await kv.get('hjdk:kz:index')) || []; if (!idx.includes(it.slug)) { idx.push(it.slug); await kv.set('hjdk:kz:index', idx); }
}
async function ronde(oidc) {
  const lijst = await sites(oidc); const out = { dag: DAY(), eigendommen: lijst, sites: {} };
  for (const [id, host] of Object.entries(SITES)) {
    const prop = propFor(lijst, host); if (!prop) { out.sites[id] = { host, fout: 'geen toegang in Search Console' }; continue; }
    try {
      const m = id === 'kz' ? null : MARKETS[id]; const its = m ? await wtbItems(m) : await kzItems();
      const rs = await rows(prop, 28, oidc); const a = analyse(rs, its);
      const fixes = []; const bySlug = Object.fromEntries(its.map(i => [i.slug, i]));
      for (const p of a.laagCtr) {
        if (fixes.length >= 3) break; const it = bySlug[p.slug]; if (!it) continue;
        if (it.titleFixAt && (Date.now() - Date.parse(it.titleFixAt)) < 21 * 864e5) continue;
        try { const nieuw = await herschrijf(m ? m.lang : 'nl', it, p, oidc); if (m) await fixWtb(m, it, nieuw, p); else await fixKz(it, nieuw, p); fixes.push({ slug: it.slug, oud: it.seoTitle || it.h1, nieuw: nieuw.seoTitle, imp: p.imp, ctr: Math.round(p.ctr * 1000) / 10 }); }
        catch (e) { fixes.push({ slug: it.slug, fout: String(e.message).slice(0, 100) }); }
      }
      // vervolgvragen -> FAQ op de bestaande pagina (max 4 pagina's per site per dag, max 2 vragen per pagina, elke zoekvraag één keer)
      const doneKey = 'hjdk:gsc:' + id + ':faqdone'; const done = new Set((await kv.get(doneKey).catch(() => null)) || []); const faqs = [];
      const perPage = {}; a.subvragen.filter(v => !done.has(v.slug + '|' + v.q.toLowerCase())).forEach(v => { (perPage[v.slug] = perPage[v.slug] || []).push(v); });
      for (const [slug, vs] of Object.entries(perPage).sort((x, y) => y[1].reduce((t, v) => t + v.imp, 0) - x[1].reduce((t, v) => t + v.imp, 0)).slice(0, 4)) {
        const it = bySlug[slug]; if (!it) continue; const vragen = vs.slice(0, 5);
        try { const nieuw = await faqErbij(m ? m.lang : 'nl', it, vragen, oidc); if (nieuw.length) { await saveFaq(m, it, nieuw); faqs.push({ slug, vragen: nieuw.map(f => f.q), uit: vragen.map(v => v.q) }); } else faqs.push({ slug, overgeslagen: vragen.map(v => v.q) }); }
        catch (e) { faqs.push({ slug, fout: String(e.message).slice(0, 100) }); continue; }
        vragen.forEach(v => done.add(v.slug + '|' + v.q.toLowerCase()));
      }
      try { await kv.set(doneKey, [...done].slice(-2000)); } catch (e) {}
      const urls = [...new Set([...fixes.filter(f => f.nieuw), ...faqs.filter(f => f.vragen)].map(f => 'https://' + host + '/' + f.slug))];
      if (urls.length) { if (m) await wtbIndexnow(m, urls); else await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host, key: KZ_INDEXNOW, keyLocation: 'https://' + host + '/' + KZ_INDEXNOW + '.txt', urlList: urls }) }).catch(() => {}); }
      const res = { host, prop, dag: DAY(), totaal: a.totaal, open: a.open, laagCtr: a.laagCtr.map(p => ({ slug: p.slug, imp: p.imp, clicks: p.clicks, pos: p.pos, topQ: p.topQ })), titelsVernieuwd: fixes, faqErbij: faqs, subvragen: a.subvragen.slice(0, 30) };
      await kv.set('hjdk:gsc:' + id, res); out.sites[id] = { host, totaal: a.totaal, open: a.open.length, laagCtr: a.laagCtr.length, titelsVernieuwd: fixes.length, faqErbij: faqs.reduce((t, f) => t + ((f.vragen || []).length), 0) };
    } catch (e) { out.sites[id] = { host, fout: String(e.message).slice(0, 200) }; }
  }
  await log({ wat: 'ronde', sites: out.sites }); return out;
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x'); const op = url.searchParams.get('op') || 'status'; res.setHeader('cache-control', 'no-store');
  const oidc = String(req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN || '');
  const isCron = /vercel-cron/i.test(String(req.headers['user-agent'] || '')); const isToken = !!process.env.HJDK_TOKEN && url.searchParams.get('token') === process.env.HJDK_TOKEN;
  try {
    if (op === 'whoami') { const c = claims(oidc); let google = null; try { const l = await sites(oidc); google = { ok: true, eigendommen: l.length, sites: Object.fromEntries(Object.entries(SITES).map(([k, h]) => [h, !!propFor(l, h)])) }; } catch (e) { google = { ok: false, fout: String(e.message).slice(0, 200) }; } return res.status(200).json({ ok: !!c, iss: c && c.iss, aud: c && c.aud, sub: c && c.sub, google }); }
    if (op === 'status') { const v = await kv.mget('hjdk:gsc:kz', 'hjdk:gsc:us', 'hjdk:gsc:de', 'hjdk:gsc:log'); return res.status(200).json({ ok: true, keuzehulp: v[0], whichtobuy: v[1], kaufberater: v[2], log: (v[3] || []).slice(0, 20) }); }
    if (op === 'dag' && !isCron && !isToken) { // zonder token: hooguit eens per 2 uur (alleen lezen + max 3 titels per site)
      const last = await kv.get('hjdk:gsc:lastrun').catch(() => 0); if (last && Date.now() - last < 2 * 3600e3) return res.status(429).json({ ok: false, fout: 'laatste ronde was minder dan 2 uur geleden', status: '/api/gsc?op=status' });
      await kv.set('hjdk:gsc:lastrun', Date.now()); return res.status(200).json(Object.assign({ ok: true }, await ronde(oidc)));
    }
    if (!isCron && !isToken) return res.status(401).json({ error: 'alleen cron of token' });
    if (op === 'sites') return res.status(200).json({ ok: true, sites: await sites(oidc) });
    if (op === 'dag') { await kv.set('hjdk:gsc:lastrun', Date.now()); return res.status(200).json(Object.assign({ ok: true }, await ronde(oidc))); }
    return res.status(400).json({ error: 'onbekende op' });
  } catch (e) { await log({ wat: op, fout: String(e.message).slice(0, 300) }); return res.status(500).json({ ok: false, fout: String(e.message).slice(0, 300) }); }
}
