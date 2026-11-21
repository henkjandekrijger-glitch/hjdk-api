// Demand Radar (eigen project, demandradar-ivory.vercel.app): gemeten en voorspelde vraag per land (NL, DE, US), elke nacht vernieuwd.
// Gebruikt door de planners van keuzehulp.best, whichtobuy.best en kaufberater.best om te kiezen waar een keuzehulp voor komt.
import { kv } from './db.js';
const DR = () => process.env.DEMANDRADAR_URL || 'https://demandradar-ivory.vercel.app';
async function get(url, ms) { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 12000); try { const r = await fetch(url, { signal: c.signal }); clearTimeout(t); return r.ok ? await r.json() : null; } catch (e) { clearTimeout(t); return null; } }
export async function demandRadar(cc) {
  cc = String(cc || 'NL').toUpperCase(); const ck = 'hjdk:dr:' + cc + ':' + new Date().toISOString().slice(0, 10);
  const c0 = await kv.get(ck).catch(() => null); if (c0) return c0;
  const views = ['products', 'rise', 'coming', 'money', 'missing']; const out = []; const seen = new Set();
  const res = await Promise.all(views.map(v => get(DR() + '/api/demand?view=' + v + '&cc=' + cc + '&limit=40').then(j => ({ v, j }))));
  res.forEach(({ v, j }) => ((j && j.items) || []).forEach(x => { const k = String(x.keyword || x.topic || x.name || '').toLowerCase(); if (!k || seen.has(k)) return; seen.add(k);
    const kans = Math.max(0, ...(((x.forecast || {}).months) || []).slice(0, 3).map(m => m.chance || 0));
    out.push({ term: k, naam: x.name || x.title, lijst: v, zoekPerMaand: x.last || null, groeiJaar: x.yoy != null ? x.yoy + '%' : null, vandaag: (x.now || {}).status || null, kansStijging3mnd: kans ? kans + '%' : null, label: x.label || null, cpc: x.cpc || null, ook: (x.also || []).slice(0, 4), wat: x.what || null }); }));
  const lijst = out.slice(0, 120); if (lijst.length) await kv.set(ck, lijst, { ex: 2 * 86400 }).catch(() => {});
  return lijst;
}
// Nichelijst (Henkjan 16 nov 2026, "Los dit dan op voor producten . Vind de intenties en maak er paginas voor"): koopvragen met een situatie of
// doelgroep waar de top 10 in Google zwak is (geen echte vergelijkpagina's), gesorteerd op kans = vaste maandvraag x zwakte. Eén keer per dag per markt
// opgehaald; n = hoeveel nieuwe termen de radar die dag in Google naloopt (ongeveer $0,002 per term, binnen de dagrem van de radar).
export async function nicheLijst(cc, n) {
  cc = String(cc || 'NL').toUpperCase(); const ck = 'hjdk:dr:niche:' + cc + ':' + new Date().toISOString().slice(0, 10);
  const c0 = await kv.get(ck).catch(() => null); if (c0) return c0.lijst || [];
  const j = await get(DR() + '/api/zoekvraag?niche=' + cc + '&n=' + (n == null ? 15 : n) + '&max=80', 90000);
  const lijst = ((j && j.kansen) || []).filter(x => x.kans > 0).slice(0, 60).map(x => ({ term: x.k, vasteVraagPerMaand: x.vast, zwakteTop10: x.zwakte, vergelijkersInTop10: x.sterk, forum: x.forum, kans: x.kans, kd: x.kd }));
  await kv.set(ck, { lijst }, { ex: lijst.length ? 2 * 86400 : 6 * 3600 }).catch(() => {});
  return lijst;
}
// terugmelden wat een onderwerp echt opleverde (blijft privé bij de radar; verandert alleen de rangorde). Werkt alleen met DEMANDRADAR_KEY.
export async function meldUitkomst(o) {
  const key = process.env.DEMANDRADAR_KEY || process.env.DR_KEY; if (!key) return { ok: false, waarom: 'geen DEMANDRADAR_KEY of DR_KEY' };
  try { const r = await fetch(DR() + '/api/outcome?key=' + encodeURIComponent(key), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(o) }); return { ok: r.ok, status: r.status }; } catch (e) { return { ok: false, waarom: String(e.message).slice(0, 80) }; }
}
// zoekvolumes uit Google Ads via de radar (DataForSEO): {kw: {v, cpc, m:[[y,m,v],...]}}. Werkt met DEMANDRADAR_KEY (teamsleutel van de radar).
export async function zoekVolumes(kws, cc) {
  const key = process.env.DEMANDRADAR_KEY || process.env.DR_KEY; if (!key) return { ok: false, waarom: 'geen DEMANDRADAR_KEY of DR_KEY' };
  cc = String(cc || 'NL').toUpperCase(); const lijst = [...new Set((kws || []).map(k => String(k).toLowerCase().trim()).filter(Boolean))].slice(0, 200);
  const ck = 'hjdk:dr:vol2:' + cc + ':' + lijst.join('|').slice(0, 180); const c0 = await kv.get(ck).catch(() => null); if (c0) return c0;
  try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 60000);
    const r = await fetch(DR() + '/api/series?cc=' + cc + '&ads=1&months=25&key=' + encodeURIComponent(key), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keywords: lijst }), signal: c.signal }); clearTimeout(t);
    const j = await r.json().catch(() => ({})); if (!r.ok) return { ok: false, status: r.status, fout: j.error || null };
    const uit = { ok: true, cc, kosten: j.spent, volumes: Object.fromEntries(Object.entries(j.series || {}).map(([k, a]) => [k, { perMaand: a.v, cpc: a.cpc, maanden: a.m }])), zonderData: lijst.filter(k => !(j.series || {})[k]) };
    if (Object.keys(uit.volumes).length) await kv.set(ck, uit, { ex: 30 * 86400 }).catch(() => {}); return uit;
  } catch (e) { return { ok: false, fout: String(e.message || e).slice(0, 120) }; }
}
// reviews via de radar (Google Maps, Tripadvisor, Trustpilot; DataForSEO). post zet een taak klaar (max 10 per dag bij de radar), get haalt hem op.
export async function reviewsRadar(op, src, q, m, extra) {
  const u = DR() + '/api/reviews?op=' + op + '&src=' + encodeURIComponent(src) + '&m=' + encodeURIComponent(m || 'NL') + (q ? '&q=' + encodeURIComponent(q) : '') + (extra || '');
  try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 20000); const r = await fetch(u, { signal: c.signal }); clearTimeout(t); const j = await r.json().catch(() => ({})); return Object.assign({ http: r.status }, j); }
  catch (e) { return { fout: String(e.message || e).slice(0, 120) }; }
}

// Onderwerpscore (Henkjan 19 nov 2026: "Ja doe dat", plan contentmotor op Demand Radar): één rangorde voor kzmaak en wtbmaak.
// score = vaste vraag per maand x (1 + kans op stijging in 3 maanden) x zwakte van de Google-top 10 (onbekend 0,5)
//         x 2 als Google ons al toont op plek 4 tot 20, x 1,5 per chatvraag zonder antwoord (hoogstens x 3), x (1 + gat bij AI-assistenten) zodra de radar dat levert.
// Bestaat er al een pagina voor (de woorden van de term zitten in een slug), dan staat hij onder verbeteren in plaats van nieuw.
const STOP = new Set('de het een en of voor met van in op te bij je beste welke kopen best for the a an and of to in on with what which buy kaufen der die das und fur für mit von zu'.split(' '));
const woordenVan = s => String(s || '').toLowerCase().replace(/[^a-z0-9à-ÿ ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
export async function llmGaten(cc) { // levert de radar dit (in overleg, 19 nov 2026), dan telt het mee; anders leeg
  cc = String(cc || 'NL').toUpperCase(); const ck = 'hjdk:dr:llmgap:' + cc + ':' + new Date().toISOString().slice(0, 10);
  const c0 = await kv.get(ck).catch(() => null); if (c0) return c0.lijst || [];
  const j = await get(DR() + '/api/llmgap?cc=' + cc, 15000); const lijst = ((j && (j.vragen || j.items)) || []).map(x => ({ term: String(x.term || x.vraag || x.q || '').toLowerCase(), gat: Math.max(0, Math.min(1, Number(x.gat ?? x.gap ?? 0))) })).filter(x => x.term);
  await kv.set(ck, { lijst }, { ex: lijst.length ? 2 * 86400 : 6 * 3600 }).catch(() => {}); return lijst;
}
export function onderwerpScore({ dr = [], niche = [], gsc = null, intent = null, slugs = [], gaten = [] } = {}) {
  const per = new Map(); const pak = t => { const k = String(t || '').toLowerCase().trim(); if (!k) return null; if (!per.has(k)) per.set(k, { term: k, vast: 0, kans: 0, zwakte: null, bron: new Set() }); return per.get(k); };
  for (const x of dr) { const o = pak(x.term); if (!o) continue; o.vast = Math.max(o.vast, Number(x.zoekPerMaand) || 0); o.kans = Math.max(o.kans, (parseFloat(x.kansStijging3mnd) || 0) / 100); o.bron.add('radar'); }
  for (const x of niche) { const o = pak(x.term); if (!o) continue; o.vast = Math.max(o.vast, Number(x.vasteVraagPerMaand) || 0); const z = Number(x.zwakteTop10); if (Number.isFinite(z)) o.zwakte = z > 1 ? z / 100 : z; o.bron.add('niche'); }
  const gscQ = [...((gsc && gsc.kansen) || []).map(k => k.q), ...((gsc && gsc.open) || []).map(k => k.q)].map(q => new Set(woordenVan(q)));
  const open = ((intent && intent.chatZonderAntwoord) || []).map(o => new Set(woordenVan((o.wat || '') + ' ' + (o.vraag || ''))));
  const slugW = slugs.map(s => [s, new Set(woordenVan(String(s).replace(/-/g, ' ')))]);
  const raak = (w, set) => w.length && w.every(x => set.has(x)) ;
  const uit = [];
  for (const o of per.values()) {
    const w = woordenVan(o.term); if (!w.length || !o.vast) continue;
    let s = o.vast * (1 + o.kans) * (o.zwakte == null ? 0.5 : Math.max(0.05, o.zwakte));
    if (gscQ.some(q => raak(w, q))) { s *= 2; o.bron.add('google-plek-4-20'); }
    const nChat = open.filter(q => w.some(x => q.has(x)) && w.filter(x => q.has(x)).length >= Math.min(2, w.length)).length; if (nChat) { s *= Math.min(3, Math.pow(1.5, nChat)); o.bron.add('chat'); }
    const g = gaten.find(x => raak(woordenVan(x.term), new Set(w)) || raak(w, new Set(woordenVan(x.term)))); if (g && g.gat) { s *= 1 + g.gat; o.bron.add('ai-gat'); }
    const bestaat = (slugW.find(([, set]) => raak(w, set)) || [])[0] || null;
    uit.push({ term: o.term, score: Math.round(s), vastePerMaand: o.vast, kansStijging: Math.round(o.kans * 100) + '%', zwakteTop10: o.zwakte, bron: [...o.bron], bestaat });
  }
  uit.sort((a, b) => b.score - a.score);
  return { nieuw: uit.filter(x => !x.bestaat).slice(0, 30), verbeteren: uit.filter(x => x.bestaat).slice(0, 15), uitleg: 'score = vaste vraag x (1 + kans op stijging) x zwakte top 10 (onbekend 0,5) x2 bij Google plek 4-20, x1,5 per chatvraag zonder antwoord (max x3), x(1+gat bij AI) als de radar dat levert' };
}
