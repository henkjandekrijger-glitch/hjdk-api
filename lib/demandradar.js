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
  const key = process.env.DEMANDRADAR_KEY; if (!key) return { ok: false, waarom: 'geen DEMANDRADAR_KEY' };
  try { const r = await fetch(DR() + '/api/outcome?key=' + encodeURIComponent(key), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(o) }); return { ok: r.ok, status: r.status }; } catch (e) { return { ok: false, waarom: String(e.message).slice(0, 80) }; }
}
// zoekvolumes uit Google Ads via de radar (DataForSEO): {kw: {v, cpc, m:[[y,m,v],...]}}. Werkt met DEMANDRADAR_KEY (teamsleutel van de radar).
export async function zoekVolumes(kws, cc) {
  const key = process.env.DEMANDRADAR_KEY; if (!key) return { ok: false, waarom: 'geen DEMANDRADAR_KEY' };
  cc = String(cc || 'NL').toUpperCase(); const lijst = [...new Set((kws || []).map(k => String(k).toLowerCase().trim()).filter(Boolean))].slice(0, 200);
  const ck = 'hjdk:dr:vol:' + cc + ':' + lijst.join('|').slice(0, 180); const c0 = await kv.get(ck).catch(() => null); if (c0) return c0;
  try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 60000);
    const r = await fetch(DR() + '/api/series?cc=' + cc + '&ads=1&months=13&key=' + encodeURIComponent(key), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keywords: lijst }), signal: c.signal }); clearTimeout(t);
    const j = await r.json().catch(() => ({})); if (!r.ok) return { ok: false, status: r.status, fout: j.error || null };
    const uit = { ok: true, cc, kosten: j.spent, volumes: Object.fromEntries(Object.entries(j.series || {}).map(([k, a]) => [k, { perMaand: a.v, cpc: a.cpc, maanden: a.m }])), zonderData: lijst.filter(k => !(j.series || {})[k]) };
    await kv.set(ck, uit, { ex: 30 * 86400 }).catch(() => {}); return uit;
  } catch (e) { return { ok: false, fout: String(e.message || e).slice(0, 120) }; }
}
// reviews via de radar (Google Maps, Tripadvisor, Trustpilot; DataForSEO). post zet een taak klaar (max 10 per dag bij de radar), get haalt hem op.
export async function reviewsRadar(op, src, q, m, extra) {
  const u = DR() + '/api/reviews?op=' + op + '&src=' + encodeURIComponent(src) + '&m=' + encodeURIComponent(m || 'NL') + (q ? '&q=' + encodeURIComponent(q) : '') + (extra || '');
  try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 20000); const r = await fetch(u, { signal: c.signal }); clearTimeout(t); const j = await r.json().catch(() => ({})); return Object.assign({ http: r.status }, j); }
  catch (e) { return { fout: String(e.message || e).slice(0, 120) }; }
}
