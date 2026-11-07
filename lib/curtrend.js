// Wat de wereld zoekt over Curaçao (Henkjan 7 nov 2026: "Op de voorkant van de site zet je nieuwe verschuivingen en trends . Laat ook zien via
// demandradar in ieder land waar op gezocht word maar zorg dat dat Strak is ingekleed"). Bron: Demand Radar /api/series (Google Ads-zoekvolumes
// via DataForSEO, 13 maanden) met DEMANDRADAR_KEY; per land de echte zoekvragen in de eigen taal. Eens per week vers (kv cur:trends), want
// zoekvolumes zijn maandcijfers. Openbaar als GET /curacao-gids?op=trends (keuzehulp.best), todayin Curaçao toont het op de voorkant.
import { kv } from './db.js';

const DR = () => process.env.DEMANDRADAR_URL || 'https://demandradar-ivory.vercel.app';
// kandidaat-zoekvragen per land, in de taal van dat land (de radar geeft alleen volumes; wat 0 of niets heeft valt weg)
export const VRAGEN = {
  NL: ['curaçao', 'curacao vakantie', 'curaçao all inclusive', 'vliegtickets curaçao', 'vlucht curaçao', 'curaçao weer', 'curaçao stranden', 'wat te doen op curaçao', 'curaçao duiken', 'curaçao hotel', 'curaçao appartement', 'auto huren curaçao', 'klein curaçao', 'curaçao snorkelen', 'curaçao met kinderen', 'curaçao last minute', 'curaçao restaurants', 'curaçao carnaval', 'emigreren naar curaçao', 'huis kopen curaçao', 'curaçao bezienswaardigheden', 'tui curaçao', 'corendon curaçao', 'klm curaçao', 'willemstad', 'curaçao reisadvies', 'curaçao valuta', 'curaçao december', 'curaçao kerst', 'curaçao zwemmen met schildpadden'],
  DE: ['curaçao', 'curacao urlaub', 'curaçao all inclusive', 'curaçao flug', 'flug curaçao', 'curaçao wetter', 'curaçao strände', 'curaçao sehenswürdigkeiten', 'curaçao tauchen', 'curaçao hotel', 'curaçao reisen', 'klein curaçao', 'curaçao schnorcheln', 'curaçao mit kindern', 'curaçao pauschalreise', 'curaçao beste reisezeit', 'willemstad', 'curaçao mietwagen', 'condor curaçao', 'curaçao karneval', 'auswandern curaçao', 'curaçao last minute', 'curaçao kreuzfahrt', 'curaçao dezember', 'curaçao reisewarnung'],
  US: ['curacao', 'curacao vacation', 'curacao all inclusive', 'flights to curacao', 'curacao weather', 'curacao beaches', 'things to do in curacao', 'curacao diving', 'curacao resorts', 'curacao hotels', 'klein curacao', 'curacao snorkeling', 'curacao with kids', 'curacao vacation packages', 'best time to visit curacao', 'willemstad curacao', 'curacao car rental', 'curacao cruise port', 'curacao carnival', 'curacao travel advisory', 'curacao restaurants', 'curacao airbnb', 'is curacao safe', 'curacao in december', 'curacao christmas'],
};
async function volumes(cc) {
  const key = process.env.DEMANDRADAR_KEY; if (!key) throw new Error('geen DEMANDRADAR_KEY');
  const c = new AbortController(), t = setTimeout(() => c.abort(), 60000);
  try {
    const r = await fetch(DR() + '/api/series?cc=' + cc + '&ads=1&months=13&key=' + encodeURIComponent(key), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keywords: VRAGEN[cc] }), signal: c.signal });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error('radar ' + r.status + ' ' + (j.error || ''));
    return { series: j.series || {}, kosten: j.spent || 0 };
  } finally { clearTimeout(t); }
}
const pct = (a, b) => b > 0 ? Math.round((a / b - 1) * 100) : null;
// per zoekvraag: laatste maand, 12 maanden, verschil met dezelfde maand vorig jaar en de laatste 3 maanden tegen dezelfde 3 vorig jaar
function rij(q, a) {
  const m = (a.m || []).slice().sort((x, y) => (x[0] - y[0]) || (x[1] - y[1])); if (m.length < 2) return null;
  const v = m.map(x => Number(x[2]) || 0), n = v.length, laatste = m[n - 1];
  const jaar = n >= 13 ? pct(v[n - 1], v[n - 13]) : null, drie = n >= 15 ? pct(v[n - 1] + v[n - 2] + v[n - 3], v[n - 13] + v[n - 14] + v[n - 15]) : null;
  return { q, v: v[n - 1], gem: Math.round(v.slice(-12).reduce((s, x) => s + x, 0) / Math.min(12, n)), jaar, drie, maand: `${laatste[0]}-${String(laatste[1]).padStart(2, '0')}`, reeks: v.slice(-12) };
}
export async function curTrends({ vers = false } = {}) {
  const c0 = await kv.get('cur:trends').catch(() => null);
  if (c0 && !vers && Date.now() - Date.parse(c0.bijgewerkt) < 7 * 864e5) return c0;
  const uit = { bijgewerkt: new Date().toISOString(), bron: 'Google Ads-zoekvolumes via Demand Radar (DataForSEO), per maand', landen: {}, kosten: 0 };
  for (const cc of Object.keys(VRAGEN)) {
    try {
      const { series, kosten } = await volumes(cc); uit.kosten += kosten;
      const rijen = Object.entries(series).map(([q, a]) => rij(q, a)).filter(x => x && x.v >= 10);
      const top = rijen.slice().sort((a, b) => b.v - a.v).slice(0, 8);
      const stijgers = rijen.filter(x => x.v >= 50 && x.jaar != null && x.jaar >= 15).sort((a, b) => b.jaar - a.jaar).slice(0, 5);
      const dalers = rijen.filter(x => x.v >= 50 && x.jaar != null && x.jaar <= -15).sort((a, b) => a.jaar - b.jaar).slice(0, 3);
      uit.landen[cc] = { maand: (top[0] || {}).maand || null, top, stijgers, dalers };
    } catch (e) { uit.landen[cc] = { fout: String(e.message || e).slice(0, 100) }; }
  }
  if (Object.values(uit.landen).some(l => l.top && l.top.length)) await kv.set('cur:trends', uit).catch(() => {});
  else if (c0) return c0;
  return uit;
}
