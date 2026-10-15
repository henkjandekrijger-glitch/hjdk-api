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
// terugmelden wat een onderwerp echt opleverde (blijft privé bij de radar; verandert alleen de rangorde). Werkt alleen met DEMANDRADAR_KEY.
export async function meldUitkomst(o) {
  const key = process.env.DEMANDRADAR_KEY; if (!key) return { ok: false, waarom: 'geen DEMANDRADAR_KEY' };
  try { const r = await fetch(DR() + '/api/outcome?key=' + encodeURIComponent(key), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(o) }); return { ok: r.ok, status: r.status }; } catch (e) { return { ok: false, waarom: String(e.message).slice(0, 80) }; }
}
