// Wat de wereld zoekt over Curaçao (Henkjan 7 nov 2026: "Op de voorkant van de site zet je nieuwe verschuivingen en trends . Laat ook zien via
// demandradar in ieder land waar op gezocht word maar zorg dat dat Strak is ingekleed"). Bron: Demand Radar /api/series (Google Ads-zoekvolumes
// via DataForSEO, 25 maanden; de radar geeft alleen reeksen van 15 maanden of langer terug) met DEMANDRADAR_KEY; per land de echte zoekvragen in de eigen taal. Eens per week vers (kv cur:trends), want
// zoekvolumes zijn maandcijfers. Openbaar als GET /curacao-gids?op=trends (keuzehulp.best), todayin Curaçao toont het op de voorkant.
import { kv } from './db.js';

const DR = () => process.env.DEMANDRADAR_URL || process.env.DR_URL || 'https://demandradar-ivory.vercel.app';
// kandidaat-zoekvragen per land, in de taal van dat land (de radar geeft alleen volumes; wat 0 of niets heeft valt weg)
export const VRAGEN = {
  NL: ['curaçao', 'curacao vakantie', 'curaçao all inclusive', 'vliegtickets curaçao', 'vlucht curaçao', 'curaçao weer', 'curaçao stranden', 'wat te doen op curaçao', 'curaçao duiken', 'curaçao hotel', 'curaçao appartement', 'auto huren curaçao', 'klein curaçao', 'curaçao snorkelen', 'curaçao met kinderen', 'curaçao last minute', 'curaçao restaurants', 'curaçao carnaval', 'emigreren naar curaçao', 'huis kopen curaçao', 'curaçao bezienswaardigheden', 'tui curaçao', 'corendon curaçao', 'klm curaçao', 'willemstad', 'curaçao reisadvies', 'curaçao valuta', 'curaçao december', 'curaçao kerst', 'curaçao zwemmen met schildpadden'],
  DE: ['curaçao', 'curacao urlaub', 'curaçao all inclusive', 'curaçao flug', 'flug curaçao', 'curaçao wetter', 'curaçao strände', 'curaçao sehenswürdigkeiten', 'curaçao tauchen', 'curaçao hotel', 'curaçao reisen', 'klein curaçao', 'curaçao schnorcheln', 'curaçao mit kindern', 'curaçao pauschalreise', 'curaçao beste reisezeit', 'willemstad', 'curaçao mietwagen', 'condor curaçao', 'curaçao karneval', 'auswandern curaçao', 'curaçao last minute', 'curaçao kreuzfahrt', 'curaçao dezember', 'curaçao reisewarnung'],
  US: ['curacao', 'curacao vacation', 'curacao all inclusive', 'flights to curacao', 'curacao weather', 'curacao beaches', 'things to do in curacao', 'curacao diving', 'curacao resorts', 'curacao hotels', 'klein curacao', 'curacao snorkeling', 'curacao with kids', 'curacao vacation packages', 'best time to visit curacao', 'willemstad curacao', 'curacao car rental', 'curacao cruise port', 'curacao carnival', 'curacao travel advisory', 'curacao restaurants', 'curacao airbnb', 'is curacao safe', 'curacao in december', 'curacao christmas'],
  // de andere grote toeristenmarkten van Curaçao (Henkjan 9 nov 2026: "Zet hier ook BR CO CA enz bij de andere grote toeristen leveranciers .")
  CA: ['curacao', 'curacao vacation', 'curacao all inclusive', 'flights to curacao', 'curacao weather', 'curacao beaches', 'things to do in curacao', 'curacao resorts', 'curacao hotels', 'curacao diving', 'klein curacao', 'curacao snorkeling', 'curacao vacation packages', 'westjet curacao', 'air canada curacao'],
  CO: ['curazao', 'curacao', 'viaje a curazao', 'vuelos a curazao', 'curazao playas', 'que hacer en curazao', 'curazao todo incluido', 'hoteles en curazao', 'clima en curazao', 'curazao requisitos', 'curazao planes', 'tour curazao', 'curazao desde colombia', 'moneda de curazao', 'curazao visa'],
  BR: ['curaçao', 'curacao', 'viagem curaçao', 'passagem curaçao', 'curaçao praias', 'o que fazer em curaçao', 'curaçao all inclusive', 'hotel curaçao', 'clima curaçao', 'curaçao pacote', 'curaçao precisa de visto', 'moeda curaçao', 'curaçao mergulho', 'aruba e curaçao', 'curaçao quando ir'],
  BE: ['curaçao', 'curacao vakantie', 'curaçao all inclusive', 'vlucht curaçao', 'curaçao weer', 'curaçao stranden', 'wat te doen op curaçao', 'curaçao duiken', 'curaçao hotel', 'tui curaçao', 'curaçao reis', 'klein curaçao', 'curaçao appartement', 'curaçao beste reistijd', 'curaçao snorkelen'],
};
async function volumes(cc) {
  const key = process.env.DEMANDRADAR_KEY || process.env.DR_KEY; if (!key) throw new Error('geen DEMANDRADAR_KEY of DR_KEY');
  const c = new AbortController(), t = setTimeout(() => c.abort(), 60000);
  try {
    const r = await fetch(DR() + '/api/series?cc=' + cc + '&ads=1&months=25&key=' + encodeURIComponent(key), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keywords: VRAGEN[cc] }), signal: c.signal });
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
  const vers7 = c0 && !vers && Date.now() - Date.parse(c0.bijgewerkt) < 7 * 864e5;
  // nieuw land erbij (9 nov 2026): alleen de ontbrekende landen ophalen, hooguit eens per 6 uur proberen (de radar heeft een dagrem; nooit in een lus)
  const mist = vers7 ? Object.keys(VRAGEN).filter(cc => !(c0.landen && c0.landen[cc] && (c0.landen[cc].top || []).length)) : [];
  if (vers7 && (!mist.length || await kv.get('cur:trends:poging').catch(() => null))) { const { info, ...rest } = c0; return rest; } // info: oud debugveld (8 nov 2026)
  if (vers7) await kv.set('cur:trends:poging', 1, { ex: 6 * 3600 }).catch(() => {});
  const uit = vers7 ? { ...c0, landen: { ...c0.landen } } : { bijgewerkt: new Date().toISOString(), bron: 'Google Ads-zoekvolumes via Demand Radar (DataForSEO), per maand', landen: {}, kosten: 0 };
  for (const cc of vers7 ? mist : Object.keys(VRAGEN)) {
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
