// ZICHT: lerende lus voor vindbaarheid in Google/Bing en vermeldingen in AI-assistenten, voor ELK project.
// Kern: (1) een kennisbank met lessen die zichzelf rangschikt op bewijs, (2) metingen per site (Search Console, indexering,
// AI-crawlers, vermeldingen in Perplexity), (3) proeven: elke toegepaste les wordt na 14-28 dagen beoordeeld tegen een controle,
// en die uitkomst verschuift de rangorde. Iedereen (andere projecten, chats, cronjobs) leest het draaiboek en meldt ervaringen terug.
import { kv } from './db.js';
import { sites as gscSites, propFor, rows } from './gsc.js';
import { claude, json } from './wtb.js';
import priors from '../data/zicht-priors.json' with { type: 'json' };

export const DAY = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const K = { sites: 'zicht:sites', lessen: 'zicht:lessen', exp: s => 'zicht:exp:' + s, meting: (s, d) => 'zicht:meting:' + s + ':' + d, hist: s => 'zicht:hist:' + s, log: 'zicht:log', ideeen: 'zicht:ideeen:laatst' };
const STANDAARD_SITES = {
  kz: { id: 'kz', host: 'keuzehulp.best', taal: 'nl', land: 'NL', merk: ['keuzehulp.best', 'keuzehulp best'], gsc: true, vragen: [] },
  us: { id: 'us', host: 'whichtobuy.best', taal: 'en', land: 'US', merk: ['whichtobuy.best', 'which to buy'], gsc: true, vragen: [] },
  de: { id: 'de', host: 'kaufberater.best', taal: 'de', land: 'DE', merk: ['kaufberater.best'], gsc: true, vragen: [] }
};
export async function log(e) { try { const l = (await kv.get(K.log)) || []; l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set(K.log, l.slice(0, 300)); } catch (x) {} }

// ---------- sites ----------
export async function sites() { const s = (await kv.get(K.sites).catch(() => null)) || {}; return Object.assign({}, STANDAARD_SITES, s); }
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
export async function lessen() {
  let ls = (await kv.get(K.lessen).catch(() => null)) || [];
  const have = new Set(ls.map(l => l.id)); let nieuw = 0;
  priors.forEach(p => { if (!have.has(p.id)) { ls.push(Object.assign({ proeven: 0, winst: 0, verlies: 0, effect: 0, toegepast: {}, status: 'actief', sinds: DAY(), bewijzen: [] }, p, { bron: [].concat(p.bron || []), bewijs: undefined, bewijzen: [{ dag: DAY(), wat: p.bewijs, bron: p.bron }] })); nieuw++; } });
  if (nieuw) await kv.set(K.lessen, ls);
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
  const p = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), site: x.site, les: x.les, urls, controle, metric, start: DAY(), klaar: addDays(DAY(), Math.max(7, Math.min(60, Number(x.na) || (metric === 'index' ? 14 : 21)))), status: 'loopt', wat: String(x.wat || '').slice(0, 300), van: String(x.van || '').slice(0, 80) };
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
  const prop = await gscProp(s, oidc); if (!prop) return null; const rs = await rows(prop, 28, oidc);
  const per = {}; let ti = 0, tc = 0; rs.forEach(r => { const p = padOf(r.page); const x = per[p] || (per[p] = { imp: 0, clicks: 0, posW: 0 }); x.imp += r.imp; x.clicks += r.clicks; x.posW += r.pos * r.imp; ti += r.imp; tc += r.clicks; });
  const pick = {}; (urls || []).forEach(u => { const p = padOf(u); const x = per[p] || { imp: 0, clicks: 0, posW: 0 }; pick[p] = { imp: x.imp, clicks: x.clicks, pos: x.imp ? Math.round(x.posW / x.imp * 10) / 10 : null }; });
  return { dag: DAY(), site: { imp: ti, clicks: tc }, paginas: pick };
}
const som = (st, ps) => ps.reduce((a, p) => { const x = (st && st.paginas && st.paginas[padOf(p)]) || { imp: 0, clicks: 0 }; a.imp += x.imp; a.clicks += x.clicks; return a; }, { imp: 0, clicks: 0 });
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
        const t0 = som(p.voor, p.urls), t1 = som(na, p.urls); const siteRatio = (na.site.imp + 1) / (p.voor.site.imp + 1);
        let ref = siteRatio; if (p.controle.length) { const c0 = som(p.voor, p.controle), c1 = som(na, p.controle); ref = (c1.imp + 1) / (c0.imp + 1); }
        effect = Math.round((((t1.imp + 1) / (t0.imp + 1)) / ref - 1) * 1000) / 1000; const genoeg = t0.imp + t1.imp >= 20;
        uitkomst = !genoeg ? 'te-weinig' : effect > 0.15 ? 'beter' : effect < -0.15 ? 'slechter' : 'gelijk';
        toel = 'vertoningen ' + t0.imp + ' -> ' + t1.imp + ', kliks ' + t0.clicks + ' -> ' + t1.clicks + (p.controle.length ? ' (tegen controlegroep)' : ' (tegen hele site)');
      } else if (p.metric === 'index') {
        const st = {}; ((idx && idx.alles) || []).forEach(x => { st[padOf(x.url)] = x.verdict === 'PASS'; });
        const rate = arr => { const k = arr.filter(u => padOf(u) in st); return k.length ? k.filter(u => st[padOf(u)]).length / k.length : null; };
        const rt = rate(p.urls), rc = p.controle.length ? rate(p.controle) : null;
        if (rt == null) { p.status = 'geen-data'; continue; }
        effect = rc != null ? Math.round((rt - rc) * 1000) / 1000 : Math.round(rt * 1000) / 1000;
        uitkomst = rc == null ? (rt >= 0.5 ? 'beter' : 'gelijk') : (effect > 0.1 ? 'beter' : effect < -0.1 ? 'slechter' : 'gelijk');
        toel = 'geïndexeerd: getest ' + Math.round(rt * 100) + '%' + (rc != null ? ', controle ' + Math.round(rc * 100) + '%' : '');
      } else if (p.metric === 'llm') {
        const h = (await kv.get(K.hist(siteId)).catch(() => null)) || []; const voor = h.find(x => x.dag <= p.start), nu = h[0];
        if (!voor || !nu) { p.status = 'geen-data'; continue; }
        effect = Math.round(((nu.llmRate || 0) - (voor.llmRate || 0)) * 1000) / 1000; uitkomst = effect > 0.05 ? 'beter' : effect < -0.05 ? 'slechter' : 'gelijk'; toel = 'genoemd in AI-antwoorden ' + Math.round((voor.llmRate || 0) * 100) + '% -> ' + Math.round((nu.llmRate || 0) * 100) + '%';
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
async function vraagAI(model, vraag, taal, oidc) {
  const key = process.env.AI_GATEWAY_API_KEY || oidc || process.env.VERCEL_OIDC_TOKEN; if (!key) throw new Error('geen AI Gateway');
  const sys = taal === 'nl' ? 'Beantwoord de koopvraag kort en noem je bronnen.' : taal === 'de' ? 'Beantworte die Kauffrage kurz und nenne deine Quellen.' : 'Answer the buying question briefly and cite your sources.';
  const r = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify({ model, max_tokens: 700, messages: [{ role: 'system', content: sys }, { role: 'user', content: vraag }] }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(model + ' ' + r.status + ' ' + String((j.error && (j.error.message || j.error)) || '').slice(0, 120));
  return j;
}
const domeinen = txt => [...new Set((String(txt).match(/https?:\/\/[^\s"'<>)\]]+/g) || []).map(u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }).filter(Boolean))];
export async function meetLLM(s, vragen, oidc) {
  const model = process.env.ZICHT_LLM_MODEL || 'perplexity/sonar'; const out = [];
  for (const v of vragen) {
    try { const j = await vraagAI(model, v, s.taal, oidc); const raw = JSON.stringify(j); const txt = ((j.choices || [])[0] || {}).message ? j.choices[0].message.content : '';
      const dom = domeinen(raw); const merk = (s.merk || [s.host]).map(m => String(m).toLowerCase());
      const genoemd = dom.some(d => d === s.host || d.endsWith('.' + s.host)) || merk.some(m => String(txt).toLowerCase().includes(m));
      out.push({ vraag: v, genoemd, bronnen: dom.filter(d => !/perplexity|vercel/.test(d)).slice(0, 8) }); }
    catch (e) { out.push({ vraag: v, fout: String(e.message).slice(0, 120) }); }
  }
  return out;
}
async function vragenVoor(s) {
  const eigen = s.vragen || []; const g = (await kv.get('hjdk:gsc:' + s.id).catch(() => null)) || {};
  const uitGsc = [...(g.kansen || []), ...(g.subvragen || [])].sort((a, b) => b.imp - a.imp).map(x => x.q).filter(q => String(q).split(' ').length >= 2);
  const alle = [...new Set([...eigen, ...uitGsc])]; if (!alle.length) return [];
  const n = Number(process.env.ZICHT_VRAGEN_PER_DAG || 8); const start = (Math.floor(Date.now() / 864e5) * n) % alle.length;
  return Array.from({ length: Math.min(n, alle.length) }, (_, i) => alle[(start + i) % alle.length]);
}
async function aiBots(s) { // AI-crawlers die de site lazen (alleen voor sites die deze tellers bijhouden: keuzehulp.best)
  if (s.id !== 'kz') return null; const bots = ['oai-searchbot', 'chatgpt-user', 'gptbot', 'claude-user', 'claudebot', 'perplexity-user', 'perplexitybot', 'googlebot', 'bingbot'];
  const dagen = Array.from({ length: 7 }, (_, i) => addDays(DAY(), -i).replace(/-/g, '')); const keys = []; dagen.forEach(d => bots.forEach(b => keys.push('c:hjdk6-kz-botd-' + d + '-' + b)));
  const v = await kv.mget(...keys).catch(() => []); const per = {}; keys.forEach((k, i) => { const b = k.split('-').slice(4).join('-'); per[b] = (per[b] || 0) + (Number(v[i]) || 0); }); return per;
}
export async function meet(siteId, oidc) {
  const s = (await sites())[siteId]; if (!s) throw new Error('onbekende site');
  const m = { dag: DAY(), site: siteId, host: s.host };
  try { const g = await gscStand(s, [], oidc); if (g) m.gsc = g.site; } catch (e) { m.gscFout = String(e.message).slice(0, 100); }
  try { const ix = await kv.get('hjdk:gsc:index:' + siteId); if (ix) m.index = { dag: ix.dag, inSitemap: ix.inSitemap, bekeken: ix.bekeken, geindexeerd: ix.geindexeerd }; } catch (e) {}
  try { m.aiBots = await aiBots(s); } catch (e) {}
  const vragen = await vragenVoor(s); if (vragen.length) { m.llm = await meetLLM(s, vragen, oidc); const ok = m.llm.filter(x => !x.fout); m.llmRate = ok.length ? Math.round(ok.filter(x => x.genoemd).length / ok.length * 1000) / 1000 : null; const cnt = {}; ok.forEach(x => x.bronnen.forEach(d => { cnt[d] = (cnt[d] || 0) + 1; })); m.winnaars = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 10); }
  await kv.set(K.meting(siteId, DAY()), m, { ex: 120 * 86400 });
  const h = (await kv.get(K.hist(siteId)).catch(() => null)) || []; const kort = { dag: m.dag, imp: m.gsc && m.gsc.imp, clicks: m.gsc && m.gsc.clicks, geindexeerd: m.index && m.index.geindexeerd, llmRate: m.llmRate, aiBots: m.aiBots ? Object.entries(m.aiBots).filter(([b]) => !/googlebot|bingbot/.test(b)).reduce((t, [, n]) => t + n, 0) : null };
  await kv.set(K.hist(siteId), [kort, ...h.filter(x => x.dag !== m.dag)].slice(0, 180));
  return m;
}

// ---------- nieuwe inzichten uit eigen data (wekelijks): een onderzoeker leest metingen en uitkomsten en stelt lessen voor ----------
export async function onderzoeker(oidc) {
  const last = await kv.get(K.ideeen).catch(() => null); if (last && last > addDays(DAY(), -7)) return { overgeslagen: 'deze week al gedaan' };
  const ss = await sites(); const ls = await lessen(); const data = {};
  for (const id of Object.keys(ss)) { const h = (await kv.get(K.hist(id)).catch(() => null)) || []; const m = await kv.get(K.meting(id, DAY())).catch(() => null) || await kv.get(K.meting(id, addDays(DAY(), -1))).catch(() => null); const ex = ((await kv.get(K.exp(id)).catch(() => null)) || []).filter(p => p.status === 'klaar').slice(0, 15); data[id] = { host: ss[id].host, historie: h.slice(0, 14), wieWintInAI: m && m.winnaars, nietGenoemdOp: m && (m.llm || []).filter(x => !x.genoemd && !x.fout).map(x => x.vraag).slice(0, 8), proefUitkomsten: ex.map(p => ({ les: p.les, uitkomst: p.uitkomst, effect: p.effect, toel: p.toelichting })) }; }
  const sys = 'Je bent een nuchtere SEO- en AI-zichtbaarheidsonderzoeker. Je krijgt de meetdata van een paar kleine affiliate-sites (keuzehulpen) en de huidige lessen met hun bewijs. Stel hooguit 3 NIEUWE, toetsbare lessen voor die uit deze data volgen (bijv. welke soort sites AI-assistenten citeren waar wij ontbreken, wat proeven lieten zien). Geen herhaling van bestaande lessen. Geen trucs die Google als spam ziet (geen massaal gegenereerde pagina\'s, geen nep-reviews). Antwoord alleen JSON: {"lessen":[{"id":"kort-kebab","les":"een zin wat te doen","kanaal":"google|llm|beide","bewijs":"welke data dit laat zien, met cijfers","moeite":1-5,"meten":"hoe we het effect meten (gsc|index|llm)"}]}';
  const user = JSON.stringify({ dag: DAY(), data, bestaandeLessen: ls.slice(0, 40).map(l => ({ id: l.id, les: l.les, score: l.score, proeven: l.proeven, winst: l.winst })) });
  const a = await claude(sys, user, { max: 2500, oidc }); const j = json(a.txt); const toegevoegd = [];
  for (const x of (j.lessen || []).slice(0, 3)) { try { const l = await voegLesToe({ id: x.id, les: x.les, kanaal: x.kanaal, bewijs: x.bewijs + (x.meten ? ' (meten: ' + x.meten + ')' : ''), bron: 'onderzoeker eigen data ' + DAY(), sterkte: 2, moeite: x.moeite }); toegevoegd.push(l.id); } catch (e) {} }
  await kv.set(K.ideeen, DAY()); return { toegevoegd };
}

// ---------- draaiboek: wat moet een site nu doen ----------
export async function draaiboek(siteId, kanaal) {
  const ls = (await lessen()).filter(l => l.status !== 'verworpen' && (!kanaal || l.kanaal === kanaal || l.kanaal === 'beide'));
  return ls.map(l => ({ id: l.id, score: l.score, les: l.les, kanaal: l.kanaal, moeite: l.moeite, status: l.status, bewijs: (l.bewijzen || []).slice(0, 3).map(b => b.dag + ': ' + b.wat), proeven: l.proeven || 0, beter: l.winst || 0, slechter: l.verlies || 0, effect: l.effect || 0, risico: l.risico || '', toegepastOp: siteId ? ((l.toegepast || {})[siteId] || null) : Object.keys(l.toegepast || {}) }));
}
export async function stand(siteId) {
  const ss = await sites(); const ids = siteId ? [siteId] : Object.keys(ss); const out = {};
  for (const id of ids) { const h = (await kv.get(K.hist(id)).catch(() => null)) || []; const ex = (await kv.get(K.exp(id)).catch(() => null)) || []; const m = (await kv.get(K.meting(id, (h[0] || {}).dag || DAY())).catch(() => null));
    out[id] = { host: ss[id] && ss[id].host, laatste: m, historie: h.slice(0, 30), proeven: { lopend: ex.filter(p => p.status === 'loopt').length, klaar: ex.filter(p => p.status === 'klaar').slice(0, 20).map(p => ({ les: p.les, uitkomst: p.uitkomst, effect: p.effect, toel: p.toelichting, dag: p.beoordeeld })) } }; }
  return out;
}

// ---------- de ronde (dagelijks): meten, proeven beoordelen, lessen herrangschikken, nieuwe inzichten, volgende stappen ----------
export async function ronde(oidc, opts) {
  opts = opts || {}; const ss = await sites(); const res = { dag: DAY(), sites: {} };
  for (const id of Object.keys(ss)) {
    const r = {}; try { r.beoordeeld = await beoordeel(id, oidc); } catch (e) { r.beoordeelFout = String(e.message).slice(0, 120); }
    if (!opts.zonderMeten) { try { const m = await meet(id, oidc); r.meting = { gsc: m.gsc, index: m.index, llmRate: m.llmRate, winnaars: (m.winnaars || []).slice(0, 5) }; } catch (e) { r.meetFout = String(e.message).slice(0, 120); } }
    if (id === 'kz') { try { // lopende linkproef voor pagina's die Google nog niet kent (zelfde regel als api/kz.js isControle)
      const ex = (await kv.get(K.exp(id)).catch(() => null)) || []; const loopt = ex.some(p => p.les === 'interne-links-niet-geindexeerd' && p.start > addDays(DAY(), -14));
      const ix = await kv.get('hjdk:gsc:index:kz').catch(() => null);
      if (!loopt && ix && ix.nietGeindexeerd) { const isC = u => { let h = 0; for (const c of padOf(u).slice(1)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 5 === 0; };
        const kand = ix.nietGeindexeerd.filter(x => /onbekend|Gevonden/i.test(String(x.staat || '')) && !padOf(x.url).slice(1).includes('/')).map(x => x.url);
        if (kand.length >= 10) r.linkproef = (await nieuweProef({ site: 'kz', les: 'interne-links-niet-geindexeerd', urls: kand.filter(u => !isC(u)), controle: kand.filter(isC), metric: 'index', na: 14, wat: 'homepage Net toegevoegd + 4 links per pagina', van: 'zicht-ronde' })).id; }
    } catch (e) { r.linkproefFout = String(e.message).slice(0, 100); } }
    const db = await draaiboek(id); r.volgende = db.filter(l => !l.toegepastOp && l.status === 'actief').slice(0, 5).map(l => ({ id: l.id, score: l.score, les: l.les }));
    res.sites[id] = r;
  }
  try { res.onderzoeker = await onderzoeker(oidc); } catch (e) { res.onderzoekerFout = String(e.message).slice(0, 120); }
  const ls = await lessen(); res.top = ls.slice(0, 8).map(l => ({ id: l.id, score: l.score, proeven: l.proeven || 0, beter: l.winst || 0 }));
  await log({ wat: 'ronde', res: JSON.stringify(res).slice(0, 3000) }); return res;
}
