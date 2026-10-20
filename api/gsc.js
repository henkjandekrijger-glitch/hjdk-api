// Search Console-leerlus voor keuzehulp.best, whichtobuy.best en kaufberater.best (dagelijks, cron 02:40 UTC, vóór de planners).
// 1) per pagina én per zoekvraag ophalen (28 dagen); 2) zoekvragen waarvoor we vertoond worden maar die nergens echt beantwoord worden -> hjdk:gsc:<site>.open
//    (kzmaak en wtbmaak zetten die vooraan in hun onderwerpenlijst); 3) pagina's met te lage CTR -> nieuwe titel + omschrijving (max 3 per site per dag, 21 dagen rust per pagina).
// Routes: /api/gsc?op=status (openbaar overzicht), op=whoami (welk Vercel-token, zonder het token zelf), op=dag (cron of token=HJDK_TOKEN), op=sites (token).
import { kv } from '../lib/db.js';
import { queryMatchesGuide } from '../lib/organic-policy.js';
import { nieuweProef } from '../lib/zicht.js';
import { SITES, SITEMAPS, claims, sites, propFor, rows, totals, analyse, submitSitemap, sitemapInfo, ruis, inspect } from '../lib/gsc.js';
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
  const sys = `You write search result snippets (title tag + meta description) that get clicked. Language: ${lang === 'nl' ? 'Dutch (je-vorm)' : lang === 'de' ? 'German (du-Form)' : 'US English'}. The page is a buying guide that asks 3 questions and gives one product pick with today's price. Rules: title max 60 characters, starts with the words searchers actually use${lang === 'nl' ? ' (Dutch: begin with "Keuzehulp <producttype>:" unless the queries clearly use other first words, e.g. "beste ...")' : ''}, includes the year 2026 only if it helps, no clickbait, no ALL CAPS, no brand names unless in the queries. Description 120-155 characters: say what the reader gets (a clear pick in 3 questions, current prices, what to watch out for). Reply ONLY JSON {"seoTitle":"","metaDesc":""}.`;
  const user = JSON.stringify({ huidigeTitel: it.seoTitle || it.h1 || it.title, huidigeOmschrijving: it.metaDesc || it.kort || it.intro, zoekvragenWaarvoorGetoond: p.topQ, vertoningen: p.imp, kliks: p.clicks, gemiddeldePositie: p.pos });
  const r = await claude(sys, user, { fast: true, max: 400, oidc }); const j = json(r.txt);
  const t = String(j.seoTitle || '').trim().slice(0, 70), d = String(j.metaDesc || '').trim().slice(0, 170);
  if (t.length < 15 || d.length < 60) throw new Error('herschrijving te kort'); return { seoTitle: t, metaDesc: d };
}
async function fixKz(it, nieuw, p) {
  const key = 'hjdk:kz:' + it.slug; const cur = await kv.get(key).catch(() => null);
  const hist = { dag: DAY(), oud: it.seoTitle || it.h1, imp: p.imp, clicks: p.clicks, pos: p.pos };
  if (cur && cur.slug && !cur.override) await kv.set(key, Object.assign(cur, nieuw, { updatedAt: DAY(), titleFixAt: DAY(), titleHist: [hist, ...(cur.titleHist || [])].slice(0, 5) }));
  else { await kv.set(key, Object.assign({}, cur || {}, { slug: it.slug, override: true }, nieuw, { updatedAt: DAY(), titleFixAt: DAY(), titleHist: [hist, ...((cur && cur.titleHist) || [])].slice(0, 5) })); const idx = (await kv.get('hjdk:kz:index')) || []; if (!idx.includes(it.slug)) { idx.push(it.slug); await kv.set('hjdk:kz:index', idx); } }
}
async function fixWtb(m, it, nieuw, p) {
  const key = WK.item(m.id, it.slug); const cur = (await kv.get(key)) || it;
  await kv.set(key, Object.assign(cur, nieuw, { updatedAt: DAY(), titleFixAt: DAY(), titleHist: [{ dag: DAY(), oud: cur.seoTitle || cur.h1, imp: p.imp, clicks: p.clicks, pos: p.pos }, ...(cur.titleHist || [])].slice(0, 5) }));
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
// sitemap eens per dag opnieuw indienen, zodat Google nieuwe keuzehulpen sneller ophaalt
async function smap(id, prop, oidc, force) {
  try { if (!force && (await kv.get('hjdk:gsc:smap:' + id)) === DAY()) return { ok: true, al: 'vandaag ingediend' };
    const r = await submitSitemap(prop, SITEMAPS[id], oidc); if (r.ok) await kv.set('hjdk:gsc:smap:' + id, DAY(), { ex: 172800 }); return r;
  } catch (e) { return { ok: false, fout: String(e.message).slice(0, 160) }; }
}
// speerpunten: pagina's die we als eerste naar de top duwen (zoekvragen met 'keuzehulp' = onze domeinnaam, en pagina's dicht bij pagina 1);
// knooppunten: pagina's die al kliks of een topplek hebben en hun gezag via interne links doorgeven aan verwante keuzehulpen
function speerKies(rs, its) {
  const slugOf = u => { try { return new URL(u).pathname.replace(/^\/(keuzehulp\/)?/, '').replace(/\/$/, ''); } catch (e) { return ''; } };
  const ok = new Set(its.map(i => i.slug)); const P = {};
  rs.forEach(r => { const s = slugOf(r.page); if (!ok.has(s) || ruis(r.q) || !queryMatchesGuide(r.q, s)) return; const x = P[s] || (P[s] = { s, imp: 0, clicks: 0, posW: 0, kw: 0, near: 0, qs: [] }); x.imp += r.imp; x.clicks += r.clicks; x.posW += r.pos * r.imp; x.qs.push([r.q, r.imp]);
    if (/keuzehulp/i.test(r.q) && r.pos <= 40) x.kw += r.imp * (r.pos <= 25 ? 2 : 1); if (r.pos >= 4 && r.pos <= 20) x.near += r.imp; });
  const L = Object.values(P).map(x => Object.assign(x, { pos: x.posW / Math.max(1, x.imp) }));
  const hubs = L.filter(x => x.clicks > 0 || (x.imp >= 5 && x.pos <= 5)).sort((a, b) => b.clicks - a.clicks || a.pos - b.pos).map(x => x.s).slice(0, 6);
  let speer = L.filter(x => !hubs.includes(x.s) && (x.kw > 0 || x.near > 0)).sort((a, b) => (b.near > 0 ? 1 : 0) - (a.near > 0 ? 1 : 0) || b.near - a.near || b.kw - a.kw).map(x => x.s).slice(0, 3);
  if (!speer.length && ok.has('printer')) speer = ['printer'];
  const vragen = Object.fromEntries(speer.map(s => [s, (P[s] ? P[s].qs : []).sort((a, b) => b[1] - a[1]).map(q => q[0]).slice(0, 10)]));
  return { dag: DAY(), speer, hubs, vragen };
}
async function ronde(oidc) {
  const lijst = await sites(oidc); const out = { dag: DAY(), eigendommen: lijst, sites: {} };
  for (const [id, host] of Object.entries(SITES)) {
    const prop = propFor(lijst, host); if (!prop) { out.sites[id] = { host, fout: 'geen toegang in Search Console' }; continue; }
    out.sitemaps = out.sitemaps || {}; out.sitemaps[id] = await smap(id, prop, oidc);
    try {
      const m = id === 'kz' ? null : MARKETS[id]; const its = m ? await wtbItems(m) : await kzItems();
      const rs = await rows(prop, 28, oidc); const a = analyse(rs, its); const google = await totals(prop, 28, oidc).catch(() => null); if (id === 'kz') { try { const sp = speerKies(rs, its); await kv.set('hjdk:kz:speerpunt', sp); out.speerpunt = sp; } catch (e) {} }
      const running = ((await kv.get('zicht:exp:' + id).catch(() => null)) || []).filter(p => p.status === 'loopt' && p.metric === 'gsc');
      const protectedUrls = new Set(running.flatMap(p => [...(p.urls || []), ...(p.controle || [])]));
      const protectedSlug = slug => protectedUrls.has('https://' + host + '/' + slug);
      const fixes = []; const bySlug = Object.fromEntries(its.map(i => [i.slug, i]));
      // eerst de kansen (positie 4-20): titel die begint met de woorden van die zoekvraag, als die er nog niet in staan
      const perKans = {}; a.kansen.forEach(k => { (perKans[k.slug] = perKans[k.slug] || []).push(k); });
      for (const [slug, ks] of Object.entries(perKans).sort((x, y) => y[1].reduce((t, k) => t + k.imp, 0) - x[1].reduce((t, k) => t + k.imp, 0))) {
        if (fixes.length >= 3) break; if (protectedSlug(slug)) continue; const it = bySlug[slug]; if (!it) continue; if (it.titleFixAt && (Date.now() - Date.parse(it.titleFixAt)) < 21 * 864e5) continue;
        const titel = String(it.seoTitle || it.h1 || it.title || '').toLowerCase(); const q0 = ks[0].q.toLowerCase(); const mist = q0.split(/\s+/).filter(w => w.length > 3 && !titel.includes(w));
        if (!mist.length) continue; const p = { slug, imp: ks.reduce((t, k) => t + k.imp, 0), clicks: 0, pos: ks[0].pos, topQ: ks.map(k => k.q).slice(0, 6), ctr: 0 };
        try { const nieuw = await herschrijf(m ? m.lang : 'nl', it, p, oidc); if (m) await fixWtb(m, it, nieuw, p); else await fixKz(it, nieuw, p); fixes.push({ slug, waarom: 'positie ' + ks[0].pos + ' op "' + ks[0].q + '"', oud: it.seoTitle || it.h1, nieuw: nieuw.seoTitle }); }
        catch (e) { fixes.push({ slug, fout: String(e.message).slice(0, 100) }); }
      }
      // en meer interne links naar die pagina's (de sites zetten ze vooraan bij 'ook handig' binnen dezelfde categorie)
      try { await kv.set('hjdk:gsc:' + id + ':boost', [...new Set(a.kansen.map(k => k.slug))].slice(0, 12)); } catch (e) {}
      for (const p of a.laagCtr) {
        if (fixes.length >= 3) break; if (protectedSlug(p.slug)) continue; p.topQ = p.topQ.filter(q => queryMatchesGuide(q, p.slug)); if (!p.topQ.length) continue; const it = bySlug[p.slug]; if (!it) continue;
        if (it.titleFixAt && (Date.now() - Date.parse(it.titleFixAt)) < 21 * 864e5) continue;
        try { const nieuw = await herschrijf(m ? m.lang : 'nl', it, p, oidc); if (m) await fixWtb(m, it, nieuw, p); else await fixKz(it, nieuw, p); fixes.push({ slug: it.slug, oud: it.seoTitle || it.h1, nieuw: nieuw.seoTitle, imp: p.imp, ctr: Math.round(p.ctr * 1000) / 10 }); }
        catch (e) { fixes.push({ slug: it.slug, fout: String(e.message).slice(0, 100) }); }
      }
      // vervolgvragen -> FAQ op de bestaande pagina (max 4 pagina's per site per dag, max 2 vragen per pagina, elke zoekvraag één keer)
      const doneKey = 'hjdk:gsc:' + id + ':faqdone'; const done = new Set((await kv.get(doneKey).catch(() => null)) || []); const faqs = [];
      const perPage = {}; a.subvragen.filter(v => !done.has(v.slug + '|' + v.q.toLowerCase())).forEach(v => { (perPage[v.slug] = perPage[v.slug] || []).push(v); });
      for (const [slug, vs] of Object.entries(perPage).filter(([slug]) => !protectedSlug(slug) && !fixes.some(f => f.slug === slug && f.nieuw)).sort((x, y) => y[1].reduce((t, v) => t + v.imp, 0) - x[1].reduce((t, v) => t + v.imp, 0)).slice(0, 4)) {
        const it = bySlug[slug]; if (!it || protectedSlug(slug) || fixes.some(f => f.slug === slug && f.nieuw)) continue; const vragen = vs.slice(0, 5);
        try { const nieuw = await faqErbij(m ? m.lang : 'nl', it, vragen, oidc); if (nieuw.length) { await saveFaq(m, it, nieuw); faqs.push({ slug, vragen: nieuw.map(f => f.q), uit: vragen.map(v => v.q) }); } else faqs.push({ slug, overgeslagen: vragen.map(v => v.q) }); }
        catch (e) { faqs.push({ slug, fout: String(e.message).slice(0, 100) }); continue; }
        vragen.forEach(v => done.add(v.slug + '|' + v.q.toLowerCase()));
      }
      try { await kv.set(doneKey, [...done].slice(-2000)); } catch (e) {}
      const gewijzigd = new Set([...fixes.filter(f => f.nieuw), ...faqs.filter(f => f.vragen)].map(f => f.slug));
      const active = [...protectedUrls];
      const controlsFor = slug => { const it = bySlug[slug]; const scores = {};
        rs.forEach(r => { const s = new URL(r.page).pathname.replace(/^\/(keuzehulp\/)?/, '').replace(/\/$/, ''); scores[s] = (scores[s] || 0) + r.imp; });
        const n = scores[slug] || 0;
        return its.filter(x => x.slug !== slug && x.cat === it?.cat && !gewijzigd.has(x.slug) && !active.includes('https://' + host + '/' + x.slug) && (scores[x.slug] || 0) >= Math.max(2, n / 2) && scores[x.slug] <= n * 2).sort((a, b) => Math.abs(scores[a.slug] - n) - Math.abs(scores[b.slug] - n)).slice(0, 3).map(x => 'https://' + host + '/' + x.slug); };
      // ZICHT: elke wijziging wordt een proef die de lus over 21 dagen zelf beoordeelt (vertoningen tegen de hele site)
      for (const f of fixes.filter(f => f.nieuw)) { try { await nieuweProef({ site: id, les: 'titel-zoekterm-voorop', urls: ['https://' + host + '/' + f.slug], controle: controlsFor(f.slug), metric: 'gsc', wat: 'titel: ' + f.nieuw, van: 'gsc-ronde' }); } catch (e) {} }
      for (const f of faqs.filter(f => f.vragen)) { try { await nieuweProef({ site: id, les: 'faq-uit-zoekvragen', urls: ['https://' + host + '/' + f.slug], controle: controlsFor(f.slug), metric: 'gsc', wat: 'faq: ' + f.vragen.join(' | ').slice(0, 200), van: 'gsc-ronde' }); } catch (e) {} }
      const urls = [...new Set([...fixes.filter(f => f.nieuw), ...faqs.filter(f => f.vragen)].map(f => 'https://' + host + '/' + f.slug))];
      if (urls.length) { if (m) await wtbIndexnow(m, urls); else await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host, key: KZ_INDEXNOW, keyLocation: 'https://' + host + '/' + KZ_INDEXNOW + '.txt', urlList: urls }) }).catch(() => {}); }
      const res = { host, prop, dag: DAY(), periode: google && google.periode, totaalBasis: google ? 'Google-site-totaal zonder zoekvraagfilter (inclusief anonieme zoekvragen)' : 'Google-totaal niet beschikbaar; zoekvraagregels apart, niet als volledig totaal gebruiken', totaal: google ? { imp: google.imp, clicks: google.clicks, ctr: google.ctr, pos: google.pos } : null, zoekvraagTotaal: a.totaal, open: a.open, laagCtr: a.laagCtr.map(p => ({ slug: p.slug, imp: p.imp, clicks: p.clicks, pos: p.pos, topQ: p.topQ })), titelsVernieuwd: fixes, faqErbij: faqs, subvragen: a.subvragen.slice(0, 30), kansen: a.kansen.slice(0, 20) };
      await kv.set('hjdk:gsc:' + id, res); out.sites[id] = { host, totaal: res.totaal, open: a.open.length, laagCtr: a.laagCtr.length, titelsVernieuwd: fixes.length, faqErbij: faqs.reduce((t, f) => t + ((f.vragen || []).length), 0) };
    } catch (e) { out.sites[id] = { host, fout: String(e.message).slice(0, 200) }; }
  }
  await log({ wat: 'ronde', sites: out.sites, sitemaps: out.sitemaps, speerpunt: out.speerpunt }); return out;
}

export default async function handler(req, res) {
  const t0 = Date.now();
  const url = new URL(req.url, 'http://x'); const op = url.searchParams.get('op') || 'status'; res.setHeader('cache-control', 'no-store');
  const oidc = String(req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN || '');
  const isCron = /vercel-cron/i.test(String(req.headers['user-agent'] || '')); const isToken = !!process.env.HJDK_TOKEN && url.searchParams.get('token') === process.env.HJDK_TOKEN;
  try {
    if (op === 'merchant') { // Merchant Center Yoors (Henkjan 20 okt: "Check merchant center of ik die kan verbeteren"): account- en productmeldingen via de Merchant API, zelfde serviceaccount als Search Console
      if (!/vercel\.app$/.test(String(req.headers.host || '')) && !isToken) return res.status(403).json({ ok: false, fout: 'alleen via de beschermde host' });
      const { merchantStand } = await import('../lib/merchant.js'); const { token } = await import('../lib/gsc.js'); return res.status(200).json(await merchantStand(await token(oidc, 'https://www.googleapis.com/auth/content'), url.searchParams.get('account') || '5875752564'));
    }
    if (op === 'whoami') { const c = claims(oidc); let google = null; try { const l = await sites(oidc); google = { ok: true, eigendommen: l.length, sites: Object.fromEntries(Object.entries(SITES).map(([k, h]) => [h, !!propFor(l, h)])) }; } catch (e) { google = { ok: false, fout: String(e.message).slice(0, 200) }; } return res.status(200).json({ ok: !!c, iss: c && c.iss, aud: c && c.aud, sub: c && c.sub, google }); }
    if (op === 'totalen') {
      const lijst = await sites(oidc); const out = {};
      const syncTotal = async (id, total) => { const key = 'hjdk:gsc:' + id; const current = await kv.get(key).catch(() => null); if (current && (!current.periode || current.periode.endDate <= total.periode.endDate)) await kv.set(key, { ...current, zoekvraagTotaal: current.zoekvraagTotaal || (!current.periode ? current.totaal : null), periode: total.periode, totaal: { imp: total.imp, clicks: total.clicks, ctr: total.ctr, pos: total.pos }, totaalBasis: 'Google-site-totaal zonder zoekvraagfilter (inclusief anonieme zoekvragen)', totaalGecontroleerdOp: total.at }); };
      for (const [id, host] of Object.entries(SITES)) { const key = 'hjdk:gsc:totalen:' + id; const cache = await kv.get(key).catch(() => null);
        if (cache && Date.now() - cache.at < 6 * 3600e3) { await syncTotal(id, cache); out[id] = cache; continue; }
        const prop = propFor(lijst, host); if (!prop) { out[id] = { fout: 'geen toegang' }; continue; }
        try { const total = { at: Date.now(), dag: DAY(), host, ...await totals(prop, 28, oidc) }; await kv.set(key, total); await syncTotal(id, total); out[id] = total; } catch (e) { out[id] = { fout: String(e.message).slice(0, 160) }; }
      }
      return res.status(200).json({ ok: true, sites: out, basis: 'Google Search Console site-totaal zonder zoekvraagfilter; definitieve gegevens, laatste twee dagen ontbreken.' });
    }
    if (op === 'status') { const v = await kv.mget('hjdk:gsc:kz', 'hjdk:gsc:us', 'hjdk:gsc:de', 'hjdk:gsc:log', 'hjdk:kz:speerpunt'); return res.status(200).json({ ok: true, speerpunt: v[4], keuzehulp: v[0], whichtobuy: v[1], kaufberater: v[2], log: (v[3] || []).slice(0, 20) }); }
    if (op === 'sitemaps') { // openbaar: indienen (hooguit eens per dag per site) + wat Google ervan heeft gelezen
      const l = await sites(oidc); const out = {}; for (const [id, host] of Object.entries(SITES)) { const prop = propFor(l, host); if (!prop) { out[host] = { fout: 'geen toegang' }; continue; } out[host] = { indienen: await smap(id, prop, oidc), google: await sitemapInfo(prop, oidc).catch(e => String(e.message).slice(0, 120)) }; }
      return res.status(200).json({ ok: true, sitemaps: out }); }
    if (op === 'index') { // openbaar: welke pagina's uit de sitemap staan echt in Google; elke ronde de langst niet gecontroleerde eerst, resultaten per URL bewaard
      // 17 okt 2026: ook voor alle andere ZICHT-projecten (lib/zicht.js PROJECT_SITES); site=volgende = de site met Search Console-toegang die het langst niet is bekeken
      let id = url.searchParams.get('site'); let ZS = {}; if (!SITES[id]) { try { ZS = await (await import('../lib/zicht.js')).sites(); } catch (e) {} }
      if (id === 'volgende') { const l0 = await sites(oidc); const kand = Object.values(ZS).filter(x => !SITES[x.id] && propFor(l0, x.host));
        if (!kand.length) return res.status(200).json({ ok: true, niets: 'geen ander project met Search Console-toegang (serviceaccount seo-leerlus@hjdk-seo.iam.gserviceaccount.com toevoegen)' });
        const at = await Promise.all(kand.map(x => kv.get('hjdk:gsc:index:' + x.id).then(v => (v && v.at) || 0).catch(() => 0))); id = kand[at.indexOf(Math.min(...at))].id; }
      if (!SITES[id] && !ZS[id]) id = 'kz'; const host = SITES[id] || ZS[id].host; const ck = 'hjdk:gsc:index:' + id; const mk = ck + ':map';
      const c0 = await kv.get(ck).catch(() => null); if (c0 && Date.now() - c0.at < 6 * 3600e3 && !isToken && !isCron) return res.status(200).json(Object.assign({ ok: true, uitCache: true }, c0, { alles: undefined }));
      const l = await sites(oidc); const prop = propFor(l, host); if (!prop) return res.status(200).json({ ok: false, fout: 'geen toegang tot ' + host });
      let urls; if (SITEMAPS[id]) { const xml = await (await fetch(SITEMAPS[id])).text(); urls = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()))]; }
      else { const tech = await kv.get('zicht:tech:' + id).catch(() => null); urls = (tech && tech.sitemapVoorbeeld) || [];
        if (!urls.length) { const xml = await (await fetch('https://' + host + '/sitemap.xml')).text().catch(() => ''); urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()).filter(u => !/\.xml($|\?)/.test(u)); } }
      // pagina's van lopende ZICHT-proeven (getest en controle) altijd meenemen en eerst bekijken, zodat de proef te beoordelen is
      const proefUrls = ((await kv.get('zicht:exp:' + id).catch(() => null)) || []).filter(p => p.status === 'loopt' && p.metric === 'index').flatMap(p => [...(p.urls || []), ...(p.controle || [])]).filter(u => /^https?:\/\//.test(u)).slice(0, 300);
      urls = [...new Set([...proefUrls, ...urls])]; const isProef = new Set(proefUrls);
      const map = (await kv.get(mk).catch(() => null)) || {}; const dag = new Date().toISOString().slice(0, 10);
      // volgorde: nooit bekeken, dan niet geïndexeerd en langst geleden, dan geïndexeerd en langst geleden
      const todo = urls.slice().sort((x, y) => { const a = map[x], b = map[y]; const ka = !a ? 0 : a.v === 'PASS' ? 2 : 1, kb = !b ? 0 : b.v === 'PASS' ? 2 : 1; const pa = isProef.has(x) && (!a || a.d !== dag) ? 0 : 1, pb = isProef.has(y) && (!b || b.d !== dag) ? 0 : 1; return pa - pb || ka - kb || String((a || {}).d || '').localeCompare(String((b || {}).d || '')); });
      let n = 0; for (let i = 0; i < todo.length; i += 8) { const part = await Promise.all(todo.slice(i, i + 8).map(u => inspect(prop, u, oidc))); part.forEach(x => { if (!x.fout) { map[x.url] = { v: x.verdict, s: x.staat, c: x.gecrawld, d: dag, canoniek: x.canoniek, opgegevenCanoniek: x.opgegevenCanoniek, robots: x.robots, indexToegestaan: x.indexToegestaan, opgehaald: x.opgehaald }; n++; } }); if (Date.now() - t0 > 230e3) break; }
      Object.keys(map).forEach(u => { if (!urls.includes(u)) delete map[u]; }); await kv.set(mk, map).catch(() => {});
      const alles = urls.filter(u => map[u]).map(u => ({ url: u, verdict: map[u].v, staat: map[u].s, gecrawld: map[u].c, dag: map[u].d, canoniek: map[u].canoniek, opgegevenCanoniek: map[u].opgegevenCanoniek, robots: map[u].robots, indexToegestaan: map[u].indexToegestaan, opgehaald: map[u].opgehaald }));
      const per = {}; alles.forEach(x => { const k = x.staat || x.verdict || 'onbekend'; per[k] = (per[k] || 0) + 1; });
      const res0 = { at: Date.now(), dag, site: host, inSitemap: urls.length, bekeken: alles.length, vandaagBekeken: n, geindexeerd: alles.filter(x => x.verdict === 'PASS').length, perStaat: per, nietGeindexeerd: alles.filter(x => x.verdict !== 'PASS').slice(0, 150).map(x => ({ url: x.url, staat: x.staat, gecrawld: x.gecrawld, canoniek: x.canoniek, robots: x.robots, indexToegestaan: x.indexToegestaan, opgehaald: x.opgehaald })), alles };
      await kv.set(ck, res0).catch(() => {}); const hist = (await kv.get(ck + ':hist').catch(() => null)) || []; const h1 = { dag, inSitemap: res0.inSitemap, bekeken: res0.bekeken, geindexeerd: res0.geindexeerd }; await kv.set(ck + ':hist', [h1, ...hist.filter(x => x.dag !== dag)].slice(0, 90)).catch(() => {});
      return res.status(200).json(Object.assign({ ok: true }, res0, { alles: undefined, historie: [h1, ...hist.filter(x => x.dag !== dag)].slice(0, 14) }));
    }
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
