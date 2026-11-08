// ZICHT: lerende lus voor vindbaarheid in Google/Bing en vermeldingen in AI-assistenten, voor ELK project.
// Kern: (1) een kennisbank met lessen die zichzelf rangschikt op bewijs, (2) metingen per site (Search Console, indexering,
// AI-crawlers, vermeldingen in Perplexity), (3) proeven: elke toegepaste les wordt na 14-28 dagen beoordeeld tegen een controle,
// en die uitkomst verschuift de rangorde. Iedereen (andere projecten, chats, cronjobs) leest het draaiboek en meldt ervaringen terug.
import { kv } from './db.js';
import { organicStatus } from './organic.js';
import { indexEvidence, gscEvidence, llmEvidence } from './organic-policy.js';
import { createHash } from 'node:crypto';
import { sites as gscSites, propFor, rows, totals, pageRows, token as gscToken } from './gsc.js';
import { claude, json } from './wtb.js';
import { chat } from './ai.js';
import priors from '../data/zicht-priors.json' with { type: 'json' };

export const DAY = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const K = { sites: 'zicht:sites', lessen: 'zicht:lessen', exp: s => 'zicht:exp:' + s, meting: (s, d) => 'zicht:meting:' + s + ':' + d, hist: s => 'zicht:hist:' + s, log: 'zicht:log', ideeen: 'zicht:ideeen:laatst' };
const STANDAARD_SITES = {
  kz: { id: 'kz', host: 'keuzehulp.best', taal: 'nl', land: 'NL', merk: ['keuzehulp.best', 'keuzehulp best'], gsc: true, vragen: [] },
  us: { id: 'us', host: 'whichtobuy.best', taal: 'en', land: 'US', merk: ['whichtobuy.best', 'which to buy'], gsc: true, vragen: [] },
  de: { id: 'de', host: 'kaufberater.best', taal: 'de', land: 'DE', merk: ['kaufberater.best'], gsc: true, vragen: [] }
};
['kz', 'us', 'de'].forEach(id => Object.assign(STANDAARD_SITES[id], { soort: 'keuzehulp', groep: 1, repo: 'henkjandekrijger-glitch/hjdk-api' }));
// Alle andere projecten met een eigen domein op Vercel (Henkjan 17 okt 2026: "Zet zicht draaiboek beschikbaar voor iedere project op vercel
// zodat dat altijd wordt uitgevoerd en met het geleerde uit data wordt geoptimaliseerd"). Groep 2 = eigen ronde om 05:50 UTC.
// Zoekvragen, merknamen en eigen metingen komen uit https://<host>/zicht.json van het project zelf (lib/zicht-projecten.js).
const P2 = (id, host, taal, land, merk, extra) => [id, Object.assign({ id, host, taal, land, merk, gsc: true, vragen: [], groep: 2, vragenPerDag: 4 }, extra || {})];
const PROJECT_SITES = Object.fromEntries([
  P2('todayin', 'todayin.email', 'en', 'US', ['todayin.email', 'todayin'], { repo: 'henkjandekrijger-glitch/todayin', soort: 'nieuwsbrief' }),
  P2('mylevel', 'mylevel.today', 'en', 'US', ['mylevel.today', 'MyLevel'], { repo: 'henkjandekrijger-glitch/mylevel', soort: 'oefentests', eigenUitvoerder: "cloudtaak 'MyLevel: dagelijks 5 nieuwe tests uit de radar' (STAP 4)" }),
  P2('praisy', 'praisy.me', 'nl', 'NL', ['praisy.me', 'Praisy'], { repo: 'henkjandekrijger-glitch/todayin', soort: 'groepsspel' }),
  P2('outname', 'outname.now', 'en', 'US', ['outname.now', 'outname'], { repo: 'henkjandekrijger-glitch/mentionedinstead' }),
  P2('nexy', 'nexy.help', 'en', 'US', ['nexy.help', 'nexy'], { repo: 'henkjandekrijger-glitch/nexy-help' }),
  P2('kadolygids', 'gids.kadoly.com', 'nl', 'NL', ['Kadoly', 'kadoly.com', 'gids.kadoly.com', 'Kadoly gids'], { repo: 'henkjandekrijger-glitch/hjdk-api', soort: 'keuzehulp', eigenUitvoerder: "cloudtaak 'Kadoly gids dagronde (cloud)' (30 okt 2026)" }),
  P2('inkoopspiegel', 'inkoopspiegel.com', 'nl', 'NL', ['inkoopspiegel.com', 'inkoopspiegel'], { repo: 'henkjandekrijger-glitch/inkoopspiegel' }),
  P2('lastingchange', 'lastingchange.works', 'en', 'US', ['lastingchange.works', 'lasting change'], {}),
  P2('finds', 'finds.email', 'en', 'US', ['finds.email'], {}),
  P2('benchmarked', 'benchmarked.today', 'en', 'US', ['benchmarked.today'], {}),
  P2('adsfair', 'adsfair.xyz', 'en', 'NL', ['adsfair.xyz', 'AdsFair'], {}),
  P2('rereview', 'rereview.app', 'en', 'US', ['rereview.app', 'rereview'], {}),
  P2('goonfree', 'goonfree.app', 'en', 'US', ['goonfree.app', 'goonfree'], {}),
  P2('formready', 'formready.photos', 'en', 'US', ['formready.photos', 'formready'], {}),
  P2('pickready', 'pickready.fyi', 'en', 'US', ['pickready.fyi', 'pickready'], {}),
  P2('taniakross', 'taniakross.media', 'en', 'US', ['taniakross.media', 'tania kross'], {})
]);
export async function log(e) { try { const l = (await kv.get(K.log)) || []; l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set(K.log, l.slice(0, 300)); } catch (x) {} }

// ---------- sites ----------
export async function sites() { const s = (await kv.get(K.sites).catch(() => null)) || {}; const all = Object.assign({}, STANDAARD_SITES, PROJECT_SITES); Object.entries(s).forEach(([id, x]) => { all[id] = Object.assign({}, all[id] || { groep: 2, vragenPerDag: 4 }, x); }); return all; }
export async function zetSite(x) {
  const id = String(x.id || x.host || '').toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 40); if (!id || !x.host) throw new Error('id en host nodig');
  const all = (await kv.get(K.sites).catch(() => null)) || {}; all[id] = Object.assign({}, all[id] || {}, { id, host: String(x.host).replace(/^https?:\/\//, '').replace(/\/.*$/, ''), taal: x.taal || 'en', land: x.land || 'US', merk: x.merk || [x.host], gsc: !!x.gsc, vragen: (x.vragen || []).slice(0, 60), sitemap: x.sitemap || null, eigenaar: x.eigenaar || null, sinds: (all[id] && all[id].sinds) || DAY() });
  await kv.set(K.sites, all); return all[id];
}

// ---------- kennisbank: lessen en hun score ----------
// score = kans dat de les werkt (Beta: voorkennis uit 'sterkte' + eigen proeven) x verwacht effect / wortel(moeite)
export function scoreLes(l) {
  const s = Number(l.sterkte) || 2, w = l.winst || 0, n = l.proeven || 0, v = l.verlies || 0;
  const a = 1 + s * 0.6 + w, b = 1 + (5 - s) * 0.5 + v + Math.max(0, n - w - v) * 0.5; const p = a / (a + b);
  const eff = n ? Math.max(-0.5, Math.min(1.5, l.effect || 0)) : 0.2; const m = Math.max(1, Number(l.moeite) || 2);
  return Math.round(1000 * p * (1 + eff) / Math.sqrt(m)) / 1000;
}
// wat al aantoonbaar op een site staat (gecontroleerd 15 okt 2026), zodat het draaiboek bij de volgende stap begint
const AL_TOEGEPAST = { todayin: { 'ai-zoekbots-toelaten': '2026-11-01', 'ssr-gids-inhoud': '2026-11-01', 'indexnow-pushen': '2026-11-01', 'lastmod-eerlijk': '2026-11-01', 'titel-zoekterm-voorop': '2026-11-01', 'antwoord-bovenaan': '2026-11-01', 'vraag-koppen-faq': '2026-11-01', 'hreflang-retourlinks': '2026-11-01', 'rewrite-naar-eigen-domein-niet-vercel-app': '2026-11-01', 'proefkop-niet-op-canonieke-pagina': '2026-11-01', 'archief-zonder-vandaag': '2026-11-01', 'eigen-entiteit-per-merk': '2026-11-01', 'inhoud-zonder-runtime-ai': '2026-11-01', 'vary-bij-taalkeuze': '2026-11-01' }, kz: { 'ai-zoekbots-toelaten': '2026-10-03', 'google-extended-is-geen-aio-knop': '2026-10-03', 'ssr-gids-inhoud': '2026-10-03', 'antwoord-bovenaan': '2026-10-03', 'indexnow-pushen': '2026-10-03', 'datum-recency-bias': '2026-10-03', 'interne-links-hub': '2026-10-09', 'statistieken-toevoegen': '2026-10-03', 'sitemap-gsc-bwt': '2026-10-09', 'lastmod-eerlijk': '2026-10-15', 'llms-txt-lage-prio': '2026-10-03', 'schema-geen-ai-hefboom': '2026-10-03', 'onderwerpen-uit-vraagdata': '2026-10-15', 'antwoord-op-subvragen-positie-4-20': '2026-10-09', 'titel-zoekterm-voorop': '2026-10-09', 'faq-uit-zoekvragen': '2026-10-09', 'interne-links-niet-geindexeerd': '2026-10-15', 'vraag-koppen-faq': '2026-10-03', 'situatie-product-prijs-tabel': '2026-10-17', 'rekenhulp-maatvragen': '2026-10-17' } };
export async function lessen() {
  for (const site of ['kz', 'us', 'de']) { AL_TOEGEPAST[site] ||= {}; for (const id of ['google-totalen-zonder-queryfilter', 'proef-vergelijkbare-meetvensters', 'ai-vast-panel-echte-citaten', 'nieuwbouw-rem-bij-indexachterstand', 'zoekbezoek-alleen-met-gsc', 'lastmod-eerlijk']) AL_TOEGEPAST[site][id] = '2026-10-20'; }
  let ls = (await kv.get(K.lessen).catch(() => null)) || [];
  const have = new Set(ls.map(l => l.id)); let nieuw = 0;
  priors.forEach(p => { if (!have.has(p.id)) { ls.push(Object.assign({ proeven: 0, winst: 0, verlies: 0, effect: 0, toegepast: {}, status: 'actief', sinds: DAY(), bewijzen: [] }, p, { bron: [].concat(p.bron || []), bewijs: undefined, bewijzen: [{ dag: DAY(), wat: p.bewijs, bron: p.bron }] })); nieuw++; } });
  // Versiecorrecties van meetregels behouden eerdere proeven en toepassingen.
  priors.filter(p => p.revisie).forEach(p => { const l = ls.find(x => x.id === p.id); if (l && (l.revisie || 0) < p.revisie) { Object.assign(l, { les: p.les, revisie: p.revisie, risico: p.risico, status: p.status || l.status }); l.bewijzen = [{ dag: DAY(), wat: p.bewijs, bron: p.bron }, ...(l.bewijzen || [])].slice(0, 20); nieuw++; } });
  ls.forEach(l => Object.entries(AL_TOEGEPAST).forEach(([site, m]) => { if (m[l.id] && !(l.toegepast || {})[site]) { l.toegepast = Object.assign({}, l.toegepast, { [site]: m[l.id] }); nieuw++; } }));
  if (nieuw) await kv.set(K.lessen, ls.map(l => { const c = Object.assign({}, l); delete c.score; return c; }));
  ls.forEach(l => { l.score = scoreLes(l); if (l.status !== 'regel' && (l.proeven || 0) >= 5 && (l.winst || 0) / l.proeven < 0.2 && (l.effect || 0) < 0) l.status = 'verworpen'; });
  return ls.sort((x, y) => (x.status === 'verworpen') - (y.status === 'verworpen') || y.score - x.score);
}
export async function bewaarLessen(ls) { await kv.set(K.lessen, ls.map(l => { const c = Object.assign({}, l); delete c.score; return c; })); }
const slugId = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
// nieuw inzicht of nieuw bewijs bij een bestaande les (van wie dan ook)
export async function voegLesToe(x) {
  const ls = await lessen(); const id = slugId(x.id || x.les); if (!id || !x.les && !ls.find(l => l.id === id)) throw new Error('les (tekst) nodig');
  let l = ls.find(e => e.id === id);
  if (!l) { l = { id, les: String(x.les).slice(0, 400), kanaal: ['google', 'llm', 'beide'].includes(x.kanaal) ? x.kanaal : 'beide', sterkte: Math.max(1, Math.min(4, Number(x.sterkte) || 2)), moeite: Math.max(1, Math.min(5, Number(x.moeite) || 2)), risico: String(x.risico || '').slice(0, 300), bron: [], bewijzen: [], proeven: 0, winst: 0, verlies: 0, effect: 0, toegepast: {}, status: 'actief', sinds: DAY() }; ls.push(l); }
  if (x.bewijs) l.bewijzen = [{ dag: DAY(), wat: String(x.bewijs).slice(0, 400), bron: String(x.bron || x.van || '').slice(0, 200) }, ...(l.bewijzen || [])].slice(0, 20);
  if (x.bron) l.bron = [...new Set([...(l.bron || []), String(x.bron).slice(0, 200)])].slice(0, 10);
  if (x.status && ['actief', 'regel', 'verworpen'].includes(x.status)) l.status = x.status;
  await bewaarLessen(ls); return l;
}
// uitkomst van een proef verwerken in de les (gebruikt door de beoordeling en door handmatige meldingen)
export async function verwerkUitkomst(lesId, uitkomst, effect, site, toelichting) {
  const ls = await lessen(); const l = ls.find(e => e.id === lesId); if (!l) return null;
  l.proeven = (l.proeven || 0) + 1; if (uitkomst === 'beter') l.winst = (l.winst || 0) + 1; if (uitkomst === 'slechter') l.verlies = (l.verlies || 0) + 1;
  if (isFinite(effect)) l.effect = Math.round(((l.effect || 0) * (l.proeven - 1) + Number(effect)) / l.proeven * 1000) / 1000;
  l.bewijzen = [{ dag: DAY(), wat: (site ? site + ': ' : '') + uitkomst + (isFinite(effect) ? ' (' + (effect > 0 ? '+' : '') + Math.round(effect * 100) + '%)' : '') + (toelichting ? ' — ' + String(toelichting).slice(0, 200) : ''), bron: 'proef' }, ...(l.bewijzen || [])].slice(0, 20);
  l.laatsteProef = DAY(); await bewaarLessen(ls); return l;
}

// ---------- proeven ----------
// x = { site, les, urls[] (getest), controle[] (optioneel), metric: 'gsc'|'index'|'llm', voor: {...} (optioneel), na: dagen (standaard 21) }
export async function nieuweProef(x) {
  if (!x.site || !x.les) throw new Error('site en les nodig'); const s = (await sites())[x.site]; if (!s) throw new Error('onbekende site ' + x.site);
  const ls = await lessen(); const l = ls.find(e => e.id === x.les); if (!l) throw new Error('onbekende les ' + x.les + ' (eerst toevoegen met op=les)');
  const urls = [].concat(x.urls || x.url || []).map(String).slice(0, 200), controle = [].concat(x.controle || []).map(String).slice(0, 200);
  const metric = ['gsc', 'index', 'llm'].includes(x.metric) ? x.metric : 'gsc';
  const p = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), site: x.site, les: x.les, urls, controle, metric, start: DAY(), klaar: addDays(DAY(), Math.max(7, Math.min(60, Number(x.na) || (metric === 'index' ? 14 : metric === 'gsc' ? 35 : 21)))), status: 'loopt', wat: String(x.wat || '').slice(0, 300), van: String(x.van || '').slice(0, 80) };
  if (metric === 'gsc') p.klaar = addDays(DAY(), Math.min(60, Math.max(35, Number(x.na) || 35)));
  if (metric === 'gsc') p.voor = x.voor || await gscStand(s, urls.concat(controle)).catch(() => null);
  if (metric === 'index') p.voor = x.voor || null;
  const list = (await kv.get(K.exp(x.site)).catch(() => null)) || []; list.unshift(p); await kv.set(K.exp(x.site), list.slice(0, 500));
  l.toegepast = l.toegepast || {}; l.toegepast[x.site] = DAY(); await bewaarLessen(ls);
  return p;
}
const padOf = u => { try { return new URL(u.startsWith('http') ? u : 'https://x/' + u.replace(/^\//, '')).pathname.replace(/\/$/, '') || '/'; } catch (e) { return '/' + String(u).replace(/^\//, ''); } };
async function gscProp(s, oidc) { if (!s.gsc) return null; const l = await gscSites(oidc); return propFor(l, s.host); }
// vertoningen, kliks en gemiddelde positie per pad (28 dagen) + site-totaal
async function gscStand(s, urls, oidc) {
  const prop = await gscProp(s, oidc); if (!prop) return null; const rs = await pageRows(prop, 28, oidc);
  const per = {}; let ti = 0, tc = 0; rs.forEach(r => { const p = padOf(r.page); const x = per[p] || (per[p] = { imp: 0, clicks: 0, posW: 0 }); x.imp += r.imp; x.clicks += r.clicks; x.posW += r.pos * r.imp; ti += r.imp; tc += r.clicks; });
  const pick = {}; (urls || []).forEach(u => { const p = padOf(u); const x = per[p] || { imp: 0, clicks: 0, posW: 0 }; pick[p] = { imp: x.imp, clicks: x.clicks, pos: x.imp ? Math.round(x.posW / x.imp * 10) / 10 : null }; });
  const totaal = await totals(prop, 28, oidc);
  return { meetversie: 'gsc-page-v2', dag: DAY(), periode: totaal.periode, site: { imp: totaal.imp, clicks: totaal.clicks }, zoekvraagSubset: { imp: ti, clicks: tc }, paginas: pick };
}
// ---------- alle zoekvragen bewaren (Henkjan 27 okt: "Sla alle zoekvragen ook op om van te leren") ----------
// Per site per dag de Search Console-regels (zoekvraag, pagina, vertoningen, kliks, positie), ook verse dagen (dataState all).
// Kv zicht:zv:<site>:<dag>, 400 dagen bewaard. Lezen: /api/zicht?op=zoekvragen&site=<id>&dagen=N (of &dag=JJJJ-MM-DD).
const KZV = (s, d) => 'zicht:zv:' + s + ':' + d;
export async function bewaarZoekvragen(siteId, oidc) {
  const s = (await sites())[siteId]; if (!s) return null; const prop = await gscProp(s, oidc); if (!prop) return null;
  const start = addDays(DAY(), -10), end = DAY();
  const r = await fetch('https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(prop) + '/searchAnalytics/query', { method: 'POST', headers: { authorization: 'Bearer ' + await gscToken(oidc), 'content-type': 'application/json' }, body: JSON.stringify({ startDate: start, endDate: end, dimensions: ['date', 'query', 'page'], dataState: 'all', rowLimit: 25000 }), signal: AbortSignal.timeout(25000) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error('zoekvragen ' + r.status);
  const perDag = {};
  for (const x of j.rows || []) { const [d, q, page] = x.keys; (perDag[d] = perDag[d] || []).push({ q, p: padOf(page), imp: x.impressions, kl: x.clicks, pos: Math.round(x.position * 10) / 10 }); }
  for (const [d, rs] of Object.entries(perDag)) await kv.set(KZV(siteId, d), rs.sort((a, b) => b.imp - a.imp).slice(0, 5000), { ex: 400 * 86400 });
  return { dagen: Object.keys(perDag).length, regels: (j.rows || []).length };
}
export async function zoekvragen(siteId, dagen, dag) {
  if (dag) return { site: siteId, dag, regels: (await kv.get(KZV(siteId, dag)).catch(() => null)) || [] };
  const n = Math.min(400, Math.max(1, Number(dagen) || 28)); const per = {}; const perDag = [];
  for (let i = 0; i < n; i++) { const d = addDays(DAY(), -i); const rs = await kv.get(KZV(siteId, d)).catch(() => null); if (!rs) continue; perDag.push({ dag: d, zoekvragen: new Set(rs.map(x => x.q)).size, imp: rs.reduce((t, x) => t + x.imp, 0), kliks: rs.reduce((t, x) => t + x.kl, 0) });
    for (const x of rs) { const o = per[x.q] || (per[x.q] = { q: x.q, imp: 0, kliks: 0, posW: 0, eerst: d, laatst: d, paginas: {} }); o.imp += x.imp; o.kliks += x.kl; o.posW += x.pos * x.imp; if (d < o.eerst) o.eerst = d; if (d > o.laatst) o.laatst = d; o.paginas[x.p] = (o.paginas[x.p] || 0) + x.imp; } }
  const lijst = Object.values(per).map(o => ({ q: o.q, imp: o.imp, kliks: o.kliks, pos: o.imp ? Math.round(o.posW / o.imp * 10) / 10 : null, eerst: o.eerst, laatst: o.laatst, paginas: Object.keys(o.paginas).sort((a, b) => o.paginas[b] - o.paginas[a]).slice(0, 3) })).sort((a, b) => b.imp - a.imp);
  return { site: siteId, dagen: n, basis: 'Search Console-regels per zoekvraag (geanonimiseerde zoekvragen ontbreken; site-totaal staat in op=stand)', perDag: perDag.sort((a, b) => (a.dag < b.dag ? -1 : 1)), zoekvragen: lijst.slice(0, 500), aantal: lijst.length };
}

// beoordeel alle proeven die klaar zijn
export async function beoordeel(siteId, oidc) {
  const s = (await sites())[siteId]; const list = (await kv.get(K.exp(siteId)).catch(() => null)) || []; const klaar = list.filter(p => p.status === 'loopt' && p.klaar <= DAY()); const out = [];
  if (!klaar.length) return out;
  let na = null; if (klaar.some(p => p.metric === 'gsc')) na = await gscStand(s, [...new Set(klaar.flatMap(p => p.urls.concat(p.controle)))], oidc).catch(() => null);
  let idx = null; if (klaar.some(p => p.metric === 'index')) idx = await kv.get('hjdk:gsc:index:' + siteId).catch(() => null);
  for (const p of klaar) {
    let uitkomst = 'gelijk', effect = null, toel = '';
    try {
      if (p.metric === 'gsc') {
        if (!p.voor || !na) { p.status = 'geen-data'; continue; }
        const evidence = gscEvidence(p, na);
        ({ uitkomst, effect, toel } = evidence); p.signaal = evidence.signaal; p.bewijs = evidence;
      } else if (p.metric === 'index') {
        const evidence = indexEvidence(p, idx);
        ({ uitkomst, effect, toel: toel } = evidence); p.bewijs = evidence;
      } else if (p.metric === 'llm') {
        const h = (await kv.get(K.hist(siteId)).catch(() => null)) || []; const evidence = llmEvidence(p, h);
        ({ uitkomst, effect, toel } = evidence); p.bewijs = evidence;
      }
    } catch (e) { p.status = 'fout'; p.fout = String(e.message).slice(0, 120); continue; }
    p.status = 'klaar'; p.uitkomst = uitkomst; p.effect = effect; p.toelichting = toel; p.beoordeeld = DAY();
    if (uitkomst !== 'te-weinig') await verwerkUitkomst(p.les, uitkomst, effect, siteId, toel); else { p.klaar = addDays(DAY(), 14); p.status = 'loopt'; p.verlengd = (p.verlengd || 0) + 1; if (p.verlengd > 3) p.status = 'te-weinig'; }
    out.push({ id: p.id, les: p.les, uitkomst, effect, toel });
  }
  await kv.set(K.exp(siteId), list); return out;
}

// ---------- metingen ----------
// vermeldingen in AI-antwoorden: Perplexity (met bronnen) via de Vercel AI Gateway
export async function vraagAI(model, vraag, taal, oidc, o) {
  const sys = taal === 'nl' ? 'Beantwoord de koopvraag kort. Sluit af met een regel "Bronnen:" en daaronder de volledige URL\'s (https://...) van alle pagina\'s die je gebruikte, één per regel.' : taal === 'de' ? 'Beantworte die Kauffrage kurz. Schließe mit einer Zeile "Quellen:" und darunter die vollständigen URLs (https://...) aller verwendeten Seiten, eine pro Zeile.' : 'Answer the buying question briefly. End with a line "Sources:" followed by the full URLs (https://...) of every page you used, one per line.';
  // meting: hetzelfde model + dezelfde vraag hoogstens één keer per 20 uur (de vangnet- en alsNodig-rondes hergebruiken het antwoord van de ochtend)
  return chat({ fn: o && o.fn || 'zicht-meting', model, max: 700, messages: [{ role: 'system', content: sys }, { role: 'user', content: vraag }], cacheTtl: o && o.vers ? 0 : (o && o.cacheTtl) || 20 * 3600, oidc });
}
const domeinen = txt => [...new Set((String(txt).match(/https?:\/\/[^\s"'<>)\]]+/g) || []).map(u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }).filter(Boolean))];
export async function meetLLM(s, vragen, oidc) {
  const model = process.env.ZICHT_LLM_MODEL || 'perplexity/sonar'; const out = [];
  for (const v of vragen) {
    try { const j = await vraagAI(model, v, s.taal, oidc); const raw = JSON.stringify(j); const txt = ((j.choices || [])[0] || {}).message ? j.choices[0].message.content : '';
      const dom = domeinen(String(txt || '').replace(/\\n/g, '\n') + '\n' + raw.replace(/\\n/g, ' ')); const merk = (s.merk || [s.host]).map(m => String(m).toLowerCase());
      const genoemd = dom.some(d => d === s.host || d.endsWith('.' + s.host)) || (s.soort === 'keuzehulp' ? String(txt).toLowerCase().includes(s.host) : merk.some(m => String(txt).toLowerCase().includes(m)));
      out.push({ vraag: v, model, genoemd, geciteerd: dom.some(d => d === s.host || d.endsWith('.' + s.host)), bronnen: dom.filter(d => !/perplexity|vercel/.test(d)).slice(0, 8) }); }
    catch (e) { out.push({ vraag: v, fout: String(e.message).slice(0, 120) }); }
  }
  return out;
}
// ---------- gatscan: waar antwoorden AI-assistenten slecht op keuzevragen? ----------
const SOORT = [
  ['betaalmuur', /(^|\.)(consumentenbond\.nl|test-aankoop\.be|testaankoop\.be|test\.de|which\.co\.uk|consumerreports\.org)$/],
  ['forum', /(^|\.)(reddit\.com|gathering\.tweakers\.net|forum\.|quora\.com|zoover|viva\.nl|startpagina|ervaringen|community\.)/],
  ['winkel', /(^|\.)(bol\.com|coolblue\.(nl|be)|mediamarkt\.(nl|be|de)|amazon\.(nl|de|com|co\.uk)|blokker|action\.com|hema\.nl|gamma\.(nl|be)|praxis\.nl|karwei\.nl|kieskeurig\.nl|tweakers\.net\/pricewatch|beslist\.nl|idealo\.de|otto\.de|bestbuy\.com|walmart\.com|decathlon|ikea|wehkamp|fonq|lidl|aldi|kruidvat|intratuin|bcc\.nl|expert\.nl|electroworld)/],
  ['media', /(^|\.)(tweakers\.net|nu\.nl|ad\.nl|telegraaf\.nl|nos\.nl|rtl\.nl|androidplanet|iculture|anwb\.nl|independer|rtings\.com|nytimes\.com|cnet\.com|techradar|tomsguide|wired|theverge|zdnet|forbes|businessinsider|goodhousekeeping|chip\.de|computerbild|stern\.de|t-online\.de)/]
];
const soortVan = d => { for (const [n, re] of SOORT) if (re.test(d)) return n; return 'overig'; };
export async function gapScan(vragen, taal, oidc, model) {
  const m = model || process.env.ZICHT_LLM_MODEL || 'perplexity/sonar'; const uit = new Array(vragen.length); let i = 0;
  const werker = async () => { while (i < vragen.length) { const k = i++; const v = vragen[k];
    try { const j = await vraagAI(m, v, taal, oidc, { fn: 'zicht-gatscan', cacheTtl: 3 * 86400 }); const txt = String((((j.choices || [])[0] || {}).message || {}).content || ''); const raw = JSON.stringify(j);
      const dom = domeinen(txt.replace(/\\n/g, '\n') + '\n' + raw.replace(/\\n/g, ' ')).filter(d => !/perplexity|vercel/.test(d)).slice(0, 10);
      const soorten = {}; dom.forEach(d => { const s = soortVan(d); soorten[s] = (soorten[s] || 0) + 1; });
      const lokaal = taal === 'nl' ? dom.filter(d => /\.(nl|be)$/.test(d)).length : taal === 'de' ? dom.filter(d => /\.(de|at|ch)$/.test(d)).length : dom.length;
      const antwoord = txt.split(/Bronnen:|Quellen:|Sources:/i)[0];
      uit[k] = { vraag: v, bronnen: dom, soorten, lokaal, prijs: /(€|eur|euro|\$)\s?\d|\d+[.,]?\d*\s?(€|euro)/i.test(antwoord), getal: /\d+\s?(cm|kg|liter|l\b|watt|w\b|kwh|mah|inch|m2|m²|couverts|personen|°)/i.test(antwoord), twijfel: /(hangt af|afhankelijk van|het beste is om|raadpleeg|advies in de winkel|depends on|kommt darauf an)/i.test(antwoord), lengte: antwoord.length, kort: antwoord.replace(/\s+/g, ' ').slice(0, 260) }; }
    catch (e) { uit[k] = { vraag: v, fout: String(e.message).slice(0, 100) }; } } };
  await Promise.all(Array.from({ length: Math.min(8, vragen.length) }, werker));
  const ok = uit.filter(x => x && !x.fout); const som = {}; ok.forEach(x => Object.entries(x.soorten).forEach(([s, n]) => { som[s] = (som[s] || 0) + n; }));
  const zwak = x => (x.soorten.betaalmuur || 0) + (x.soorten.forum || 0) + (x.bronnen.length <= 1 ? 2 : 0) + (x.lokaal === 0 ? 2 : 0) + (x.twijfel ? 1 : 0) + (!x.prijs ? 0.5 : 0) + (!x.getal ? 0.5 : 0);
  return { model: m, vragen: vragen.length, gelukt: ok.length, bronSoorten: som, metPrijs: ok.filter(x => x.prijs).length, metGetal: ok.filter(x => x.getal).length, twijfel: ok.filter(x => x.twijfel).length, zonderLokaleBron: ok.filter(x => x.lokaal === 0).length, zwaksteEerst: ok.map(x => Object.assign({ zwakte: zwak(x) }, x)).sort((a, b) => b.zwakte - a.zwakte), fouten: uit.filter(x => x && x.fout) };
}
async function vragenVoor(s) {
  const eigen = s.vragen || [];
  const panelKey = 'zicht:vast-panel:' + (s.id === 'us' || s.id === 'de' ? 'v3' : 'v1') + ':' + s.id; // v2 (21 okt): US/DE-panel uit paginatitels, v1 had sjabloonvragen als 'welche acai bowl zubereiten soll ich kaufen'; v3 (4 nov): zonder Curaçao-vragen, die gidsen staan sinds 1 nov op todayin.email
  const nietHier = q => (s.id === 'us' || s.id === 'de') && /cura[cç]ao|curazao/i.test(String(q)); // verhuisd naar todayin: telt niet meer als vraag voor deze site
  if (s.soort === 'keuzehulp') { const panel = await kv.get(panelKey).catch(() => null); if (panel?.vragen?.length) return panel.vragen; }
  if (s.soort !== 'keuzehulp') { // andere projecten: alleen echte vragen (eigen zicht.json, aanmelding, Search Console); geen verzonnen koopvragen uit de sitemap
    const g2 = (await kv.get('hjdk:gsc:' + s.id).catch(() => null)) || {}; const uitGsc2 = [...(g2.kansen || []), ...(g2.subvragen || [])].sort((a, b) => b.imp - a.imp).map(x => x.q).filter(q => String(q).split(' ').length >= 2);
    const alle2 = [...new Set([...eigen, ...uitGsc2])]; if (!alle2.length) return [];
    const n2 = Number(s.vragenPerDag || 4); const st2 = (Math.floor(Date.now() / 864e5) * n2) % alle2.length; return Array.from({ length: Math.min(n2, alle2.length) }, (_, i) => alle2[(st2 + i) % alle2.length]); } const g = (await kv.get('hjdk:gsc:' + s.id).catch(() => null)) || {};
  const uitGsc = [...(g.kansen || []), ...(g.subvragen || [])].sort((a, b) => b.imp - a.imp).map(x => x.q).filter(q => String(q).split(' ').length >= 2 && !/[,%]|\d{3,}/.test(q));
  let alle = [...new Set([...eigen, ...uitGsc])];
  if (alle.length < 16) { // aanvullen met vragen uit de eigen pagina's (sitemap), in de taal van de site
    let uitMap = await kv.get('zicht:vragen5:' + s.id).catch(() => null);
    if (!uitMap && s.soort === 'keuzehulp') { try { // echte vragen: de titels in llms.txt zijn al koopvragen zoals mensen ze stellen; gelijk verspreid over de lijst
      const txt = await (await fetch('https://' + s.host + '/llms.txt', { signal: AbortSignal.timeout(8000) })).text();
      const titels = [...new Set([...txt.matchAll(/^- \[([^\]]{12,140}\?)\]\(/gm)].map(m => m[1].trim()))].filter(q => !nietHier(q));
      if (titels.length >= 8) { const stap = titels.length / 8; uitMap = Array.from({ length: Math.min(8, titels.length) }, (_, i) => titels[Math.floor(i * stap)]); await kv.set('zicht:vragen5:' + s.id, uitMap, { ex: 7 * 86400 }); }
    } catch (e) { uitMap = null; } }
    if (!uitMap) { try { const xml = await (await fetch(s.sitemap || ('https://' + s.host + '/sitemap.xml'))).text(); const slugs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => { try { return new URL(m[1]).pathname.replace(/^\/|\/$/g, ''); } catch (e) { return ''; } }).filter(x => x && !x.includes('/') && x.length > 2 && !/^(about|over|privacy|impressum|datenschutz|contact|kontakt|cookies|disclaimer|sitemap|vindbaarheid|search|zoeken|suche)$/.test(x));
      const w = x => x.replace(/-/g, ' '); uitMap = slugs.slice(0, 200).map(x => /^(best|beste|welke|welche|which|wat|was|what|how|hoe|wie)-/.test(x) ? w(x) : s.taal === 'nl' ? 'welke ' + w(x) + ' moet ik kopen' : s.taal === 'de' ? 'welche ' + w(x) + ' soll ich kaufen' : 'which ' + w(x) + ' should I buy'); await kv.set('zicht:vragen5:' + s.id, uitMap, { ex: 7 * 86400 }); } catch (e) { uitMap = []; } }
    alle = [...new Set([...alle, ...uitMap])];
  }
  alle = alle.filter(q => !nietHier(q));
  if (!alle.length) return [];
  const n = Number(process.env.ZICHT_VRAGEN_PER_DAG || 8); /* Panel blijft 28 dagen gelijk; de volgende versie krijgt een andere panelhash. */
  const panel = Array.from({ length: Math.min(n, alle.length) }, (_, i) => alle[i]);
  await kv.set(panelKey, { vanaf: DAY(), vragen: panel }, { ex: 28 * 86400 });
  return panel;
}
const BRON_ZOEK = ['google', 'bing', 'duckduckgo']; const BRON_AI = ['chatgpt', 'perplexity', 'copilot', 'gemini', 'claude'];
async function aiBots(s) { // AI- en zoekcrawlers die de site lazen, laatste 7 dagen (kz: hjdk6-tellers, us/de: wtb-tellers)
  const dagen = Array.from({ length: 7 }, (_, i) => addDays(DAY(), -i)); const keys = []; const naam = [];
  if (s.id === 'kz') { const bots = ['oai-searchbot', 'chatgpt-user', 'gptbot', 'claude-user', 'claudebot', 'perplexity-user', 'perplexitybot', 'googlebot', 'bingbot']; dagen.forEach(d => bots.forEach(b => { keys.push('c:hjdk6-kz-botd-' + d.replace(/-/g, '') + '-' + b); naam.push(b); })); }
  else if (s.id === 'us' || s.id === 'de') { const bots = ['oai-searchbot', 'chatgpt-user', 'gptbot', 'claude', 'perplexity', 'googlebot', 'bingbot']; dagen.forEach(d => bots.forEach(b => { keys.push('c:wtb-' + s.id + '-botd-' + d + '-' + b); naam.push(b); })); }
  else { const m = await kv.get('zicht:manifest:' + s.id).catch(() => null); const a = m && m.meting && m.meting.aiBots7d; return a && typeof a === 'object' ? Object.fromEntries(Object.entries(a).map(([b, n]) => [String(b).toLowerCase().slice(0, 30), Number(n) || 0]).slice(0, 20)) : null; }
  const v = await kv.mget(...keys).catch(() => []); const per = {}; naam.forEach((b, i) => { per[b] = (per[b] || 0) + (Number(v[i]) || 0); }); return per;
}
// Crawltrend van Googlebot en Bingbot per dag (28 dagen), zodat een instorting van het Google-crawlen zichtbaar wordt.
// Aanleiding 7 nov 2026: Googlebot las keuzehulp.best 92 keer in 7 dagen op 17 okt, 41 op 20 okt en nog maar 2 op 7 nov, terwijl Bingbot 126 keer las.
export async function crawlTrend(siteId, dagen = 28) {
  if (!['kz', 'us', 'de'].includes(siteId)) return null; const lijst = Array.from({ length: dagen }, (_, i) => addDays(DAY(), -i)); const bots = ['googlebot', 'bingbot']; const keys = [];
  lijst.forEach(d => bots.forEach(b => keys.push(siteId === 'kz' ? 'c:hjdk6-kz-botd-' + d.replace(/-/g, '') + '-' + b : 'c:wtb-' + siteId + '-botd-' + d + '-' + b)));
  const v = await kv.mget(...keys).catch(() => []); const perDag = lijst.map((d, i) => ({ dag: d, googlebot: Number(v[i * 2]) || 0, bingbot: Number(v[i * 2 + 1]) || 0 }));
  const som = (a, b, k) => perDag.slice(a, b).reduce((t, x) => t + x[k], 0); const g7 = som(0, 7, 'googlebot'); const gVoor = som(7, 28, 'googlebot') / 3; const b7 = som(0, 7, 'bingbot');
  const vr = perDag.slice(7, 28).map(x => x.googlebot).sort((a, b) => a - b); const gMed = vr.length ? vr[Math.floor(vr.length / 2)] * 7 : 0; // mediaan per dag x 7: losse uitschieters (DE 20 okt 102 op één dag) gaven een valse waarschuwing
  const waarschuwing = gVoor >= 10 && g7 < gVoor * 0.25 && g7 < gMed * 0.5 ? 'Googlebot leest ' + g7 + ' keer in 7 dagen tegen gemiddeld ' + Math.round(gVoor) + ' in de drie weken ervoor: Google crawlt veel minder. Kijk naar serverfouten (database vol), trage pagina\'s en dunne of dubbele pagina\'s.' : null;
  return { googlebot7d: g7, googlebot7dVoorheen: Math.round(gVoor), googlebot7dMediaan: gMed, bingbot7d: b7, waarschuwing, perDag };
}
async function bezoek(s) { // echte bezoekers uit zoekmachines en AI-assistenten, laatste 7 dagen
  const dagen = Array.from({ length: 7 }, (_, i) => addDays(DAY(), -i)); const bronnen = BRON_ZOEK.concat(BRON_AI); const keys = []; const naam = [];
  if (s.id === 'kz') dagen.forEach(d => bronnen.forEach(b => { keys.push('c:hjdk6-kz-orgd-' + d.replace(/-/g, '') + '-' + b); naam.push(b); }));
  else if (s.id === 'us' || s.id === 'de') dagen.forEach(d => bronnen.forEach(b => { keys.push('c:wtb-' + s.id + '-d-' + d + '-' + b); naam.push(b); }));
  else { const m = await kv.get('zicht:manifest:' + s.id).catch(() => null); const b7 = m && m.meting && m.meting.bezoek7d; if (!b7 || typeof b7 !== 'object') return null;
    const pb = {}; Object.entries(b7.perBron || {}).forEach(([b, n]) => { if (Number(n)) pb[String(b).toLowerCase().slice(0, 30)] = Number(n); }); return { zoek: Number(b7.zoek) || BRON_ZOEK.reduce((t, b) => t + (pb[b] || 0), 0), ai: Number(b7.ai) || BRON_AI.reduce((t, b) => t + (pb[b] || 0), 0), perBron: pb }; }
  const v = await kv.mget(...keys).catch(() => []); const per = {}; naam.forEach((b, i) => { const n = Number(v[i]) || 0; if (n) per[b] = (per[b] || 0) + n; });
  const som = l => l.reduce((t, b) => t + (per[b] || 0), 0); return { zoek: som(BRON_ZOEK), ai: som(BRON_AI), perBron: per };
}
export async function meet(siteId, oidc) {
  let s = (await sites())[siteId]; if (!s) throw new Error('onbekende site');
  const man = await kv.get('zicht:manifest:' + siteId).catch(() => null); // eigen zicht.json van het project (lib/zicht-projecten.js)
  if (man) s = Object.assign({}, s, { vragen: [...new Set([...(s.vragen || []), ...(man.vragen || [])])], merk: [...new Set([...(s.merk || []), ...(man.merk || [])])], taal: man.taal || s.taal });
  const m = { dag: DAY(), site: siteId, host: s.host };
  try { const g = await gscStand(s, [], oidc); if (g) m.gsc = g.site; } catch (e) { m.gscFout = String(e.message).slice(0, 100); }
  try { const ix = await kv.get('hjdk:gsc:index:' + siteId); if (ix) m.index = { dag: ix.dag, inSitemap: ix.inSitemap, bekeken: ix.bekeken, geindexeerd: ix.geindexeerd }; } catch (e) {}
  try { m.aiBots = await aiBots(s); } catch (e) {}
  try { m.zoekvragen = await bewaarZoekvragen(siteId, oidc); } catch (e) { m.zoekvragenFout = String(e.message).slice(0, 100); }
  try { m.bezoek = await bezoek(s); } catch (e) {}
  try { const ct = await crawlTrend(siteId); if (ct) m.crawl = { googlebot7d: ct.googlebot7d, googlebot7dVoorheen: ct.googlebot7dVoorheen, googlebot7dMediaan: ct.googlebot7dMediaan, bingbot7d: ct.bingbot7d, waarschuwing: ct.waarschuwing }; } catch (e) {}
  // Referrer en GSC hebben verschillende periodes/definities; een verschil bewijst geen bots. GSC mist de laatste twee dagen.
  if (m.bezoek && m.gsc && Number(m.gsc.clicks) === 0 && (m.bezoek.perBron || {}).google > 0) { m.bezoek.googleOnbevestigd = m.bezoek.perBron.google; m.bezoek.zoekBevestigd = Math.max(0, m.bezoek.zoek - m.bezoek.perBron.google); }
  if (['kz', 'us', 'de'].includes(siteId)) m.organic = await organicStatus(siteId, siteId === 'kz' ? Number(process.env.KZ_PER_DAG || 12) : siteId === 'us' ? Number(process.env.WTB_PER_DAG_US || 10) : Number(process.env.WTB_PER_DAG_DE || 10));
  const vragen = await vragenVoor(s); if (vragen.length) { m.llmPanel = createHash('sha256').update(JSON.stringify([s.taal, process.env.ZICHT_LLM_MODEL || 'perplexity/sonar', vragen])).digest('hex').slice(0, 16); m.llm = await meetLLM(s, vragen, oidc); const ok = m.llm.filter(x => !x.fout); m.llmRate = ok.length ? Math.round(ok.filter(x => x.genoemd).length / ok.length * 1000) / 1000 : null; m.llmCitatie = { model: process.env.ZICHT_LLM_MODEL || 'perplexity/sonar', panel: m.llmPanel, geslaagd: ok.length, perVraag: ok.map(x => ({ id: createHash('sha256').update(x.vraag).digest('hex').slice(0, 16), geciteerd: x.geciteerd })), geciteerd: ok.filter(x => x.geciteerd).length, rate: ok.length ? ok.filter(x => x.geciteerd).length / ok.length : null }; const cnt = {}; ok.forEach(x => x.bronnen.forEach(d => { cnt[d] = (cnt[d] || 0) + 1; })); m.winnaars = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 10); }
  await kv.set(K.meting(siteId, DAY()), m, { ex: 120 * 86400 });
  const h = (await kv.get(K.hist(siteId)).catch(() => null)) || []; const kort = { dag: m.dag, imp: m.gsc && m.gsc.imp, clicks: m.gsc && m.gsc.clicks, geindexeerd: m.index && m.index.geindexeerd, llmRate: m.llmRate, llmCitatie: m.llmCitatie || null, aiBots: m.aiBots ? Object.entries(m.aiBots).filter(([b]) => !/googlebot|bingbot/.test(b)).reduce((t, [, n]) => t + n, 0) : null, bezoekZoek7d: m.bezoek ? m.bezoek.zoek : null, bezoekZoekBevestigd7d: null, bezoekAI7d: m.bezoek ? m.bezoek.ai : null, googlebot7d: m.crawl ? m.crawl.googlebot7d : null };
  await kv.set(K.hist(siteId), [kort, ...h.filter(x => x.dag !== m.dag)].slice(0, 180));
  return m;
}

// ---------- nieuwe inzichten uit eigen data (wekelijks): een onderzoeker leest metingen en uitkomsten en stelt lessen voor ----------
export async function onderzoeker(oidc) {
  const last = await kv.get(K.ideeen).catch(() => null); if (last && last > addDays(DAY(), -7)) return { overgeslagen: 'deze week al gedaan' };
  const ss = await sites(); const ls = await lessen(); const data = {};
  for (const id of Object.keys(ss)) { const h = (await kv.get(K.hist(id)).catch(() => null)) || []; const m = await kv.get(K.meting(id, DAY())).catch(() => null) || await kv.get(K.meting(id, addDays(DAY(), -1))).catch(() => null); const ex = ((await kv.get(K.exp(id)).catch(() => null)) || []).filter(p => p.status === 'klaar').slice(0, 15); data[id] = { host: ss[id].host, historie: h.slice(0, 14), wieWintInAI: m && m.winnaars, nietGenoemdOp: m && (m.llm || []).filter(x => !x.genoemd && !x.fout).map(x => x.vraag).slice(0, 8), proefUitkomsten: ex.map(p => ({ les: p.les, uitkomst: p.uitkomst, effect: p.effect, toel: p.toelichting })) }; }
  const sys = 'Je bent een nuchtere SEO- en AI-zichtbaarheidsonderzoeker. Je krijgt de meetdata van een paar kleine sites van één eigenaar (keuzehulpen, een lokale ochtendmail, oefentests en andere projecten; per site staat de host erbij) en de huidige lessen met hun bewijs. Stel hooguit 3 NIEUWE, toetsbare lessen voor die uit deze data volgen (bijv. welke soort sites AI-assistenten citeren waar wij ontbreken, wat proeven lieten zien). Geen herhaling van bestaande lessen. Geen trucs die Google als spam ziet (geen massaal gegenereerde pagina\'s, geen nep-reviews). Antwoord alleen JSON: {"lessen":[{"id":"kort-kebab","les":"een zin wat te doen","kanaal":"google|llm|beide","bewijs":"welke data dit laat zien, met cijfers","moeite":1-5,"meten":"hoe we het effect meten (gsc|index|llm)"}]}';
  const user = JSON.stringify({ dag: DAY(), data, bestaandeLessen: ls.slice(0, 40).map(l => ({ id: l.id, les: l.les, score: l.score, proeven: l.proeven, winst: l.winst })) });
  let j; try { const a = await claude(sys, user, { max: 2000, oidc, fn: 'zicht-onderzoeker' }); j = json(a.txt); } catch (e) { const a2 = await claude(sys + ' Geef ALLEEN geldige JSON, zonder aanhalingstekens binnen teksten.', user, { max: 2000, oidc, fn: 'zicht-onderzoeker' }); j = json(a2.txt); } const toegevoegd = [];
  for (const x of (j.lessen || []).slice(0, 3)) { try { const l = await voegLesToe({ id: x.id, les: x.les, kanaal: x.kanaal, bewijs: x.bewijs + (x.meten ? ' (meten: ' + x.meten + ')' : ''), bron: 'onderzoeker eigen data ' + DAY(), sterkte: 2, moeite: x.moeite }); toegevoegd.push(l.id); } catch (e) {} }
  await kv.set(K.ideeen, DAY()); return { toegevoegd };
}

// ---------- draaiboek: wat moet een site nu doen ----------
export async function draaiboek(siteId, kanaal) {
  const ls = (await lessen()).filter(l => l.status !== 'verworpen' && (!kanaal || l.kanaal === kanaal || l.kanaal === 'beide') && !(siteId && (l.nvt || {})[siteId]));
  return ls.map(l => ({ id: l.id, score: l.score, les: l.les, kanaal: l.kanaal, moeite: l.moeite, status: l.status, bewijs: (l.bewijzen || []).slice(0, 3).map(b => b.dag + ': ' + b.wat), proeven: l.proeven || 0, beter: l.winst || 0, slechter: l.verlies || 0, effect: l.effect || 0, risico: l.risico || '', toegepastOp: siteId ? ((l.toegepast || {})[siteId] || null) : Object.keys(l.toegepast || {}) }));
}
export async function stand(siteId) {
  const ss = await sites(); const ids = siteId ? [siteId] : Object.keys(ss); const out = {};
  for (const id of ids) { const h = (await kv.get(K.hist(id)).catch(() => null)) || []; const ex = (await kv.get(K.exp(id)).catch(() => null)) || []; const m = (await kv.get(K.meting(id, (h[0] || {}).dag || DAY())).catch(() => null));
    out[id] = { host: ss[id] && ss[id].host, laatste: m, historie: h.slice(0, 30), proeven: { lopend: ex.filter(p => p.status === 'loopt').length, klaar: ex.filter(p => p.status === 'klaar').slice(0, 20).map(p => ({ les: p.les, uitkomst: p.uitkomst, effect: p.effect, toel: p.toelichting, dag: p.beoordeeld })), perStatus: ex.reduce((t, p) => { t[p.status] = (t[p.status] || 0) + 1; return t; }, {}), verlengd: ex.filter(p => p.status === 'loopt' && p.verlengd).length, eerstKlaar: ex.filter(p => p.status === 'loopt').map(p => p.klaar).sort()[0] || null, nietBeoordeeld: ex.filter(p => p.status !== 'loopt' && p.status !== 'klaar').slice(0, 10).map(p => ({ les: p.les, status: p.status, fout: p.fout || null, toel: p.toelichting || null, start: p.start })), langLopend: ex.filter(p => p.status === 'loopt' && p.verlengd).slice(0, 10).map(p => ({ les: p.les, start: p.start, klaar: p.klaar, verlengd: p.verlengd, toel: p.toelichting || null })) } }; }
  return out;
}

// ---------- de ronde (dagelijks): meten, proeven beoordelen, lessen herrangschikken, nieuwe inzichten, volgende stappen ----------
// proeven die bij een uitrol horen: worden één keer aangemaakt bij de eerstvolgende ronde
const START_PROEVEN = [
  { id:'kadolygids-ontdekking-1107', site:'kadolygids', les:'interne-links-niet-geindexeerd', metric:'index', na:28, urls:['https://gids.kadoly.com/onderzoek-vaas-verse-bloemen','https://gids.kadoly.com/onderzoek-tafellamp-lumen','https://gids.kadoly.com/onderzoek-bamboe-textiel-claims'], controle:[], wat:'Drie bestaande bronchecks rechtstreeks op de homepage bereikbaar met concrete gebruiksvragen; onderwerppaginas niet herschreven. IndexNow in de bestaande cron herkent nu ook prijs, voorraad, verzending en levertijd per relevante URL. Laatste beschikbare Google-inspectie: 1 van 33 URLs geïndexeerd, overige onbekend. Observationele indexmeting zonder causale effectclaim of nieuwe nulmeting; lopende proef- en controle-inhoud beschermd.', van:'Henkjan SEO en LLM 7 nov' },
  { id: 'kadolygids-plantenkolom-1107', site: 'kadolygids', les: 'productspecifieke-feiten', metric: 'gsc', na: 28, urls: ['https://gids.kadoly.com/onderzoek-bloempot-afvoergat'], controle: [], wat: 'Eén nieuw Kadoly-product van 7 november, een cortenstalen planten­kolom met grote schaal, inhoudelijk gekoppeld aan de bestaande drainagecheck. Zichtbaar productspecifiek: 110 cm, schaal Ø 70 cm of 70 × 70 cm, makersclaim vorstbestendig en voorgeroest; afvoermaterialen niet inbegrepen. De automatische titelmatch blijft beperkt tot kolommen of zuilen die ook schaal, plantenbak of kom noemen; decoratieve kolommen zonder bevestigde beplantingsfunctie vallen erbuiten. Algemene RHS-voorlichting blijft categorieadvies en geen exacte modeltest. Observationele voor/na-analyse zonder causale groeiclaim; bestaande proef- en controlepaginas niet gewijzigd.', van: 'gidsronde 7 nov avond' },
  { id: 'wtb-kdp-boekgidsen-1107', site: 'us', les: 'vraag-koppen-faq', metric: 'index', na: 28, urls: ['https://whichtobuy.best/stocking-stuffers-for-teens', 'https://whichtobuy.best/funny-stocking-stuffers-for-adults', 'https://whichtobuy.best/bible-coloring-books-for-kids', 'https://whichtobuy.best/apocrypha-book', 'https://whichtobuy.best/pellet-grill-cookbook'], controle: [], wat: 'Vijf met de hand geschreven boekgidsen (Henkjan 7 nov: eigen KDP-boeken in de keuzehulpen, SEO en LLM). Eerlijke keuzehulp met drie vragen, ons boek alleen waar het past met de vermelding dat wij het uitgeven, andere antwoorden naar een Amazon-zoekopdracht, FAQ met echte koopvragen, Book-schema met ISBN, link naar de Amazon-winkel van het land. Meet: komen ze in Google en noemt AI ze.', van: 'chat-kdp 7 nov' },
  { id: 'kadolygids-volledig-aanbod-1107', site: 'kadolygids', les: 'ssr-gids-inhoud', metric: 'index', na: 28, urls: ['https://gids.kadoly.com/alle-producten'], controle: [], wat: 'Eén volledig, server-gerenderd bladeroverzicht van alle beschikbare producten per rubriek, ook producten ouder dan 14 dagen en c2b-aanbod. Prijs inclusief verzending en verwachte bezorging uit actuele catalogus; passende broncheck of eerlijk nog geen broncheck. Nieuwe pagina: observationele voor/na-analyse, geen vergelijkbare nulmeting of causale groeiclaim. Home en rubrieken linken naar het complete aanbod; bestaande proef- en controlegidsen niet herschreven.', van: 'gids compleet 7 nov' },
  { id: 'kadolygids-bronchecks-1106', site: 'kadolygids', les: 'statistieken-toevoegen', metric: 'gsc', na: 28, urls: ['https://gids.kadoly.com/onderzoek-servies-gebruik', 'https://gids.kadoly.com/onderzoek-kaarsen-gebruik'], controle: ['https://gids.kadoly.com/onderzoek-kamerplanten-luchtzuivering', 'https://gids.kadoly.com/onderzoek-houten-puzzels-bewijs'], wat: 'Bestaande bronpaginas verrijkt: servies met BuRO-advies 16 oktober 2026, tegenbewijs over ontbrekend pictogram, vier productspecificaties en een materiaalconflict; passende productkoppelingen voor keukengerei en theelichthouders. Observationele voor/na-analyse met vergelijkingspaginas, geen gerandomiseerde proef: verschillen in onderwerp en nieuwe catalogusinstroom zijn confounders. GSC ontbreekt bij start; nog geen effect meetbaar. Lopende seizoen-, nieuw- en controlegidsen niet redactioneel herschreven; alleen schemafout op rubrieken en onbewezen onafhankelijkheidsclaim op Nieuw gecorrigeerd als kwaliteitsreparatie.', van: 'gidsronde 6 nov' },
  { id: 'wtb-curacao-kaart-1102', site: 'us', les: 'verhuisde-inhoud-direct-linken', metric: 'index', na: 21, urls: ['https://whichtobuy.best/', 'https://kaufberater.best/'], controle: ['https://keuzehulp.best/'], wat: 'Curaçao-kaart op de homepage van whichtobuy en kaufberater linkt direct naar todayin.email/curacao/<en|de>/gids in plaats van via een 301, met eerlijke tekst dat de gidsen daar staan; minder doorverwijzingen in het crawlpad van de homepage' },
  { id: 'todayin-curacao-gidsen-1101', site: 'todayin', les: 'merkdomein-met-dagelijkse-inhoud', metric: 'gsc', na: 28, urls: ['https://todayin.email/curacao/nl/stranden', 'https://todayin.email/curacao/en/beaches', 'https://todayin.email/curacao/de/straende', 'https://todayin.email/curacao/es/playas', 'https://todayin.email/curacao/pt/praias', 'https://todayin.email/curacao/nl/restaurants', 'https://todayin.email/curacao/en/restaurants', 'https://todayin.email/curacao/nl/hotel-resort', 'https://todayin.email/curacao/en/hotels-resorts', 'https://todayin.email/curacao/en/events', 'https://todayin.email/curacao/nl/gids', 'https://todayin.email/curacao/en/gids'], controle: [], wat: 'Curaçao-gidsen (115 paginas in 5 talen, 963 plekken) op 1 nov 2026 met 301 per adres verhuisd van keuzehulp.best, whichtobuy.best en kaufberater.best naar todayin.email/curacao/<taal>/..., naast de dagelijkse editie, agenda en het cruiseschema; aanmelding voor de ochtendmail op elke gidspagina; zelfherstel van dode aanbiederslinks (curGezond).', van: 'sessie 1 nov' },
  { id: 'fietsmaat-rekenhulp-1017', site: 'kz', les: 'rekenhulp-maatvragen', metric: 'gsc', na: 28, urls: ['https://keuzehulp.best/fietsmaat', 'https://keuzehulp.best/kinderfiets-maat-bepalen', 'https://keuzehulp.best/kinderfiets', 'https://keuzehulp.best/fietshelm-kind', 'https://keuzehulp.best/fietshelm-volwassenen'], controle: ['https://keuzehulp.best/e-bike', 'https://keuzehulp.best/loopfiets', 'https://keuzehulp.best/kinderhelm-skate-step'], wat: 'rekenhulpen fietsmaat, kinderfietsmaat en helmmaat met tabel en product per maat', van: 'sessie 17 okt' },
  { id: 'zusterlinks-us-1017', site: 'us', les: 'zusterlinks-ontdekking', metric: 'index', na: 21, urls: ['https://whichtobuy.best/best-cordless-stick-vacuums-for-small-apartments', 'https://whichtobuy.best/best-space-heaters-for-small-rooms-and-apartments', 'https://whichtobuy.best/best-air-fryer-ovens-for-thanksgiving-2026', 'https://whichtobuy.best/best-wifi-7-routers-for-gaming-2026', 'https://whichtobuy.best/best-ereaders-for-christmas-gifts-2026', 'https://whichtobuy.best/best-tablets-for-kids-christmas-2026', 'https://whichtobuy.best/best-espresso-machines-under-500-for-home-2026', 'https://whichtobuy.best/best-smartwatches-for-iphone-users-2026', 'https://whichtobuy.best/best-video-doorbells-without-subscription-2026', 'https://whichtobuy.best/best-gifts-for-coffee-lovers-2026', 'https://whichtobuy.best/best-humidifiers-for-bedrooms-winter-2026', 'https://whichtobuy.best/best-mattresses-for-black-friday-2026', 'https://whichtobuy.best/best-robot-vacuums-for-black-friday-2026', 'https://whichtobuy.best/best-laptops-for-black-friday-2026', 'https://whichtobuy.best/best-dash-cams-front-and-rear-with-parking-mode-2026'], wat: 'voettekst op alle drie de sites linkt naar de zustersites (keuzehulp.best wordt 90 keer per week door Googlebot gelezen); meet of onbekende US-pagina\'s ontdekt en opgenomen worden', van: 'dagcontrole 17 okt' },
  { id: 'zusterlinks-de-1017', site: 'de', les: 'zusterlinks-ontdekking', metric: 'index', na: 21, urls: ['https://kaufberater.best/oled-fernseher-55-zoll-unter-1000-euro', 'https://kaufberater.best/kopfhoerer-noise-cancelling-unter-150-euro', 'https://kaufberater.best/saugroboter-tierhaare-wischfunktion-2026', 'https://kaufberater.best/elektrische-heizdecke-oder-heizluefter-sparsam', 'https://kaufberater.best/airfryer-doppelkammer-kaufen-familie', 'https://kaufberater.best/balkonkraftwerk-speicher-2026-kaufen', 'https://kaufberater.best/kaffeevollautomat-unter-500-euro-milchschaum-2026', 'https://kaufberater.best/luftentfeuchter-waschetrocknen-wohnung-kompressor', 'https://kaufberater.best/e-reader-2026-kindle-kobo-tolino-vergleich-geschenk', 'https://kaufberater.best/babyphone-mit-kamera-wlan-oder-funk-2026', 'https://kaufberater.best/luftreiniger-allergiker-hepa-h13-schlafzimmer-2026', 'https://kaufberater.best/video-tuerklingel-ohne-abo-2026-wlan-akku', 'https://kaufberater.best/raclette-fondue-set-silvester-2026-6-personen', 'https://kaufberater.best/messerset-kochmesser-geschenk-2026-ueber-60-euro', 'https://kaufberater.best/winterstiefel-damen-wasserdicht-gefuettert-2026'], wat: 'voettekst op alle drie de sites linkt naar de zustersites; meet of onbekende DE-pagina\'s ontdekt en opgenomen worden', van: 'dagcontrole 17 okt' },
  { id: 'curacao-hub-1020', site: 'kz', les: 'volledige-lokale-vergelijking-met-reviews', metric: 'llm', na: 28, urls: ['https://keuzehulp.best/curacao', 'https://whichtobuy.best/curacao', 'https://kaufberater.best/curacao', 'https://whichtobuy.best/es/curazao', 'https://whichtobuy.best/pt/curacao'], wat: 'Curaçao-voorpagina met 13 keuzehulpen in 5 talen (vluchten, hotels, autohuur, excursies, stranden, duiken, vakantiehuis, eSIM, huis kopen, huis huren, emigreren, internet, auto kopen); alle aanbieders met reviewscores en voor/nadelen; eigen AI-meting op=llm', van: 'sessie 20 okt' },
  { id: 'autohuur-curacao-1020', site: 'kz', les: 'volledige-lokale-vergelijking-met-reviews', metric: 'gsc', na: 28, urls: ['https://keuzehulp.best/auto-huren-curacao', 'https://whichtobuy.best/curacao-car-rental', 'https://kaufberater.best/mietwagen-curacao'], wat: 'keuzehulp autohuur Curaçao: 66 verhuurders met reviews per platform, voor- en nadelen uit reviews, borg, eigen risico, ophalen; NL/EN/DE; reviews dagelijks ververst', van: 'sessie 20 okt' },
  { id: 'cur-interne-links-1020', site: 'kz', les: 'onderwerpen-onderling-linken', metric: 'index', na: 21, urls: ['https://keuzehulp.best/curacao/restaurants', 'https://keuzehulp.best/curacao/esim-simkaart', 'https://keuzehulp.best/curacao/hotel-resort', 'https://keuzehulp.best/curacao/stranden', 'https://keuzehulp.best/curacao/duiken', 'https://keuzehulp.best/auto-huren-curacao'], wat: 'blok Meer over Curaçao: 8 vaste links tussen onderwerpen op alle 115 Curaçao-pagina\'s en de autohuurpagina\'s', van: 'sessie 20 okt' },
  { id: 'autohuur-hreflang-1020', site: 'us', les: 'hreflang-retourlinks', metric: 'gsc', na: 28, urls: ['https://whichtobuy.best/es/curazao/alquiler-de-autos', 'https://whichtobuy.best/pt/curacao/aluguel-de-carro', 'https://whichtobuy.best/curacao-car-rental'], wat: 'autohuur nl/en/de noemen nu ook es, pt en x-default; taalbalk met ES en PT', van: 'sessie 20 okt' },
  { id: 'cur-hub-kort-faq-1020', site: 'kz', les: 'antwoord-bovenaan', metric: 'llm', na: 28, urls: ['https://keuzehulp.best/curacao', 'https://whichtobuy.best/curacao', 'https://kaufberater.best/curacao', 'https://whichtobuy.best/es/curazao', 'https://whichtobuy.best/pt/curacao'], wat: 'hub kreeg In het kort (feiten uit de onderwerpen) en 6 FAQ met FAQPage, beschrijvende titel', van: 'sessie 20 okt' },
  { id: 'kinderfiets-maat-1023', site: 'kz', les: 'antwoord-bovenaan', metric: 'gsc', na: 35, urls: ['https://keuzehulp.best/kinderfiets'], wat: 'In het kort met dezelfde maten als de maattabel plus zadelhoogte, FAQ 6 jaar, en de wielmaat is een harde eis bij de producten (was een 26 inch stadsfiets bij 3 tot 5 jaar); beginstand hoogte kinderfiets bepalen pos 17,5, maat kinderfiets bepalen pos 16, kinderfiets maat bepalen pos 6', van: 'dagcontrole 23 okt' },
  { id: 'strijkplank-maten-1024', site: 'kz', les: 'antwoord-bovenaan', metric: 'gsc', na: 35, urls: ['https://keuzehulp.best/strijkplank'], wat: 'In het kort begint met de afmetingen (compact, standaard, breed, tafelmodel), h1 formaat wordt afmetingen, 8 FAQ op de echte zoekvragen (afmetingen, lengte, hoogte, kleine ruimte, alternatief, welke kopen, actieve strijkplank, hoes) en vastgezet tegen verversing; beginstand afmetingen strijkplank pos 14,3, strijkplank afmetingen 11,7, strijkplank kleine ruimte 11, welke strijkplank kopen 15,5', van: 'dagcontrole 24 okt' },
  { id: 'heggenschaar-antwoord-1025', site: 'kz', les: 'antwoord-bovenaan', metric: 'gsc', na: 35, urls: ['https://keuzehulp.best/heggenschaar'], wat: 'In het kort begint met het antwoord op welke heggenschaar (mesblad, tandafstand, gewicht, steelmodel boven 2 m, zelfde accuplatform), 8 FAQ op de echte zoekvragen (welke kiezen, wat is een goede, beste professionele accu, meslengte, tandafstand, accu of snoer, steelmodel, slijpen) en vastgezet tegen verversing; beginstand welke heggenschaar pos 7,7, heggenschaar kiezen 10', van: 'dagcontrole 25 okt' },
  { id: 'robotmaaier-antwoord-1026', site: 'kz', les: 'antwoord-bovenaan', metric: 'gsc', na: 35, urls: ['https://keuzehulp.best/robotmaaier'], wat: 'In het kort begint met het antwoord op robotmaaier kiezen (1,5 keer het gazon, hellingen boven 25% en zones, draad of RTK-gps/camera), 7 FAQ op de echte zoekvragen (hoe kiezen, maaihoogte, met of zonder draad, hoeveel m², installeren, egels, onderhoud) en vastgezet tegen verversing; beginstand robotmaaier kiezen pos 12,8 (6 vertoningen), maaihoogte robotmaaier pos 93,5', van: 'dagcontrole 26 okt' },
  { id: 'blender-antwoord-1027', site: 'kz', les: 'antwoord-bovenaan', metric: 'gsc', na: 35, urls: ['https://keuzehulp.best/blender'], wat: 'In het kort begint met waar je op let bij een blender (vermogen, kan, pulsestand, vaatwasser) en welke voor soep (hittebestendige kan, kookblender, staafmixer), 7 FAQ op de echte zoekvragen (waar op letten, blender voor soep, hete soep, ijs, hoeveel watt, glas of plastic, staafmixer) en vastgezet tegen verversing; beginstand soep blender pos 12, blender kopen waar op letten pos 27 (8 vertoningen, ook vraag in het Perplexity-panel)', van: 'dagcontrole 27 okt' },
  { id: 'printer-antwoord-1028', site: 'kz', les: 'antwoord-bovenaan', metric: 'gsc', na: 35, urls: ['https://keuzehulp.best/printer'], wat: 'In het kort begint met het antwoord per printgedrag (weinig: laser, regelmatig en kleur: inkttank, veel zwart-wit: monolaser, cartridges alleen bij zelden en goedkoop), 7 FAQ op de echte zoekvragen (welke past bij mij, waar op letten, goedkoopst per pagina, laser of inkjet, zuinig met inkt, uitdrogen, soorten) en vastgezet tegen verversing; beginstand printer keuzehulp pos 23 (27 vertoningen), keuzehulp printer pos 21, printer kopen advies pos 34,7, ook vraag in het Perplexity-panel', van: 'dagcontrole 28 okt' },
  { id: 'soundbar-antwoord-1029', site: 'kz', les: 'antwoord-bovenaan', metric: 'gsc', na: 35, urls: ['https://keuzehulp.best/soundbar'], wat: 'In het kort begint met het antwoord op welke soundbar (dialogen: 3.1 met middenspeaker, kleine kamer: compacte 2.0 of 2.1, films: 5.1 of Atmos met sub, eerst HDMI ARC/eARC checken; oude tekst raadde 2.1 aan voor dialogen), FAQ van 4 naar 7 (welke past bij mij, waar op letten, beste voor dialogen, Atmos de moeite waard, subwoofer, ARC en eARC, breedte bij tv) en vastgezet tegen verversing; beginstand soundbar keuzehulp pos 13 (2 vertoningen)', van: 'dagcontrole 29 okt' },
  { id: 'advent-tiener-1031', site: 'kz', les: 'antwoord-bovenaan', metric: 'gsc', na: 35, urls: ['https://keuzehulp.best/adventskalender'], wat: 'In het kort begint met het antwoord per leeftijd en noemt nu tieners apart (kiezen naar hobby: beauty, haar, bouw of puzzel, snoep van een bekend merk), FAQ van 3 naar 6 met welke voor een tiener, kind tot 8, volwassene; vastgezet; beginstand adventkalender tiener pos 10 (1 vertoning), seizoen begint 1 november', van: 'dagcontrole 31 okt' },
  { id: 'slee-opblaas-1031', site: 'kz', les: 'antwoord-bovenaan', metric: 'gsc', na: 35, urls: ['https://keuzehulp.best/slee'], wat: 'In het kort begint met het antwoord per leeftijd en helling en zegt eerlijk wanneer een opblaasbare slee wel en niet past (hard en slecht te sturen op steile helling), FAQ van 3 naar 6 met opblaasbare slee goed, vanaf welke leeftijd, weinig sneeuw; vastgezet; beginstand opblaasbare slee pos 13,5 (2 vertoningen), voor het winterseizoen', van: 'dagcontrole 31 okt' },
  { id: 'airfryer-5liter-1101', site: 'kz', les: 'antwoord-bovenaan', metric: 'gsc', na: 35, urls: ['https://keuzehulp.best/airfryer'], wat: 'In het kort noemt nu elke gangbare maat met het aantal personen, ook 5 liter (2 tot 3 personen, 4 bij een bijgerecht); FAQ van 3 naar 5 met voor hoeveel personen is 5 liter en hoeveel liter voor 1 of 2; vastgezet; beginstand airfryer 5 liter hoeveel personen pos 11 (1 vertoning), voor Black Friday en Sinterklaas', van: 'dagcontrole 1 nov' },
  { id: 'faq-dubbel-1021', site: 'kz', les: 'faq-zonder-herhaling', metric: 'gsc', na: 28, urls: ['https://keuzehulp.best/kinderfiets'], wat: 'automatische FAQ die een eerdere vraag herhaalt valt weg (lib/faq-dubbel.js, bij tonen en bij toevoegen); kinderfiets van 11 naar 8 vragen', van: 'dagcontrole 21 okt' },
  { id: 'tk-gastprofielen-1031', site: 'taniakross', les: 'entiteit-profielen-gasten', metric: 'gsc', na: 35, urls: ['https://taniakross.media/podcast/izaline-calister', 'https://taniakross.media/podcast/francis-sling', 'https://taniakross.media/podcast/samira-rafaela', 'https://taniakross.media/podcast/valika-smeulders', 'https://taniakross.media/podcast/levi-silvanie', 'https://taniakross.media/podcast/kurt-schoop'], controle: ['https://taniakross.media/podcast/dionne-pietersz-christiaan'], wat: 'feitelijke gastprofielen (wie is, werk, FAQ, bronnen, Person met sameAs) voor zes podcastgasten, indexeerbaar vóór de aflevering; Dionne zonder profiel als controle (noindex)', van: 'sessie 31 okt' },
  { id: 'kadolygids-seizoen-1104', site: 'kadolygids', les: 'antwoord-bovenaan', metric: 'gsc', na: 28, urls: ['https://gids.kadoly.com/schoencadeautjes-sinterklaas', 'https://gids.kadoly.com/kerstballen-set'], controle: ['https://gids.kadoly.com/muursticker-kinderkamer', 'https://gids.kadoly.com/windspinner-tuin'], wat: 'twee seizoensgidsen voor de piek (Sinterklaas en kerst) op makersfeiten, met keuze, tabel, check, FAQ en uiterste besteldag; geschreven voor de piek zodat Google ze op tijd kent', van: 'sessie 4 nov' },
  { id: 'kadolygids-nieuw-1104', site: 'kadolygids', les: 'ssr-gids-inhoud', metric: 'index', na: 21, urls: ['https://gids.kadoly.com/nieuw-bij-kadoly'], wat: 'pagina Nieuw bij Kadoly: elk product van de afgelopen 14 dagen per rubriek en soort in de HTML (naam, maker, prijs incl. verzending, bezorgdag, nieuw sinds), CollectionPage met ItemList en FAQ; rubriekpagina\'s krijgen Nieuw in; llms.txt noemt de nieuwste, llms-full.txt bevat alles nieuw plus het hele aanbod per rubriek en soort', van: 'sessie 4 nov' },
  { id: 'situatietabel-1017', site: 'kz', les: 'situatie-product-prijs-tabel', metric: 'llm', na: 21, urls: ['https://keuzehulp.best/'], wat: 'tabel per situatie met product en prijs van vandaag op alle keuzehulpen', van: 'sessie 17 okt' }
];
async function startProeven() { const uit = []; for (const p of START_PROEVEN) { const k = 'zicht:startproef:' + p.id; if (await kv.get(k).catch(() => null)) continue; try { await nieuweProef(p); await kv.set(k, DAY()); uit.push(p.id); } catch (e) { uit.push(p.id + ': ' + String(e.message).slice(0, 80)); } } return uit; }
export async function ronde(oidc, opts) {
  opts = opts || {}; const alle = await sites(); const groep = Number(opts.groep) || 1; const res = { dag: DAY(), groep, sites: {} };
  const ss = Object.fromEntries(Object.entries(alle).filter(([, s]) => (Number(s.groep) || 1) === groep)); const PJ = await import('./zicht-projecten.js');
  if (groep === 1) { try { const sp = await startProeven(); if (sp.length) res.startProeven = sp; } catch (e) {} }
  // techcheck van alle sites tegelijk (alleen ophalen), daarna per site na elkaar verwerken (de lessenlijst is één record)
  const tech = Object.fromEntries(await Promise.all(Object.values(ss).map(async s => [s.id, await PJ.techcheck(s).catch(e => ({ fout: String(e.message || e).slice(0, 100) }))])));
  for (const id of Object.keys(ss)) {
    const r = {}; try { r.controle = await PJ.controleer(ss[id], tech[id]); } catch (e) { r.controleFout = String(e.message).slice(0, 120); } // techcheck + eigen zicht.json
    try { r.beoordeeld = await beoordeel(id, oidc); } catch (e) { r.beoordeelFout = String(e.message).slice(0, 120); }
    if (!opts.zonderMeten) { try { const m = await meet(id, oidc); r.meting = { gsc: m.gsc, index: m.index, bezoek7d: m.bezoek, aiCrawlers7d: m.aiBots, llmRate: m.llmRate, winnaars: (m.winnaars || []).slice(0, 5) }; } catch (e) { r.meetFout = String(e.message).slice(0, 120); } }
    if (['kz', 'us', 'de'].includes(id)) { try { // lopende linkproef voor pagina's die Google nog niet kent (zelfde regel als api/kz.js isControle; us/de sinds 5 nov via api/wtb.js 'Also new'/'Auch neu')
      const ex = (await kv.get(K.exp(id)).catch(() => null)) || []; const loopt = ex.some(p => p.les === 'interne-links-niet-geindexeerd' && p.start > addDays(DAY(), -14));
      const ix = await kv.get('hjdk:gsc:index:' + id).catch(() => null);
      if (!loopt && ix && ix.nietGeindexeerd) { const isC = u => { let h = 0; for (const c of padOf(u).slice(1)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 5 === 0; };
        const kand = ix.nietGeindexeerd.filter(x => /onbekend|unknown|Gevonden|Discovered/i.test(String(x.staat || '')) && !padOf(x.url).slice(1).includes('/')).map(x => x.url);
        if (kand.length >= 10) r.linkproef = (await nieuweProef({ site: id, les: 'interne-links-niet-geindexeerd', urls: kand.filter(u => !isC(u)), controle: kand.filter(isC), metric: 'index', na: 14, wat: id === 'kz' ? 'homepage Net toegevoegd + 4 links per pagina' : '4 links Also new/Auch neu per gidspagina (homepage lijst ze al in de categorieën)', van: 'zicht-ronde' })).id; }
    } catch (e) { r.linkproefFout = String(e.message).slice(0, 100); } }
    const db = await draaiboek(id); r.volgende = db.filter(l => !l.toegepastOp && l.status === 'actief').slice(0, 5).map(l => ({ id: l.id, score: l.score, les: l.les }));
    res.sites[id] = r;
  }
  if (groep === 1) { try { res.onderzoeker = await onderzoeker(oidc); } catch (e) { res.onderzoekerFout = String(e.message).slice(0, 120); } }
  const ls = await lessen(); res.top = ls.slice(0, 8).map(l => ({ id: l.id, score: l.score, proeven: l.proeven || 0, beter: l.winst || 0 }));
  await log({ wat: 'ronde', res: JSON.stringify(res).slice(0, 3000) }); return res;
}


