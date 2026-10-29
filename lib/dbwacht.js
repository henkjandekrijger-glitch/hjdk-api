// Databasewacht (Henkjan 29 okt 2026: "Zorg dat dit niet meer volloopt en sla slimmer op !").
// De database (Redis, 250 MB, zonder automatisch weggooien) liep 16 okt en 28-29 okt vol. Dan mislukt elke schrijfactie: Clickmind
// bewaart geen kliks, echte mensen, mandjes of verkopen meer en PropellerAds krijgt geen conversies (29 okt ging zo een verkoop op
// kadoly.com verloren: de klik was niet opgeslagen). Deze wacht draait elk kwartier (cron /api/mm?op=dbwacht) en ruimt op voordat
// het misgaat, in vaste volgorde, oudste en minst waardevolle data eerst:
//   1. boven 70%: dagstatistieken van Clickmind (mm:...:JJJJ-MM-DD) ouder dan 14 dagen, klikrecords (mm:cid) ouder dan 2 dagen;
//   2. boven 80%: dagstatistieken ouder dan 10 dagen, eenmalige bezoekers (mm:p zonder vervolg) ouder dan 14 dagen;
//   3. boven 90%: dagstatistieken ouder dan 7 dagen (de rondes kijken hooguit 7 dagen terug: botplekken, uurritme, voorspellers).
// Lukt het niet om onder 80% te komen, dan zet hij een alarm in het werklog van de handover.
// Slimmer opslaan (zelfde dag): dagstatistieken blijven 14 in plaats van 40 dagen (lib/mensmeter.js T.dag en T.raw), de logs van de
// PropellerAds-lus (hjdk:shop:palog) houden 48 rondes met ingekorte lijsten in plaats van 120 volledige.
import { opruim, opruimCid, opruimPersonen } from './geheugen.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
export const K_DBWACHT = 'mm:dbwacht';
const MAX = () => (N(process.env.DB_MAX_MB) || 250) * 1048576;
const DAGPATROON = 'mm:*:20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]*';
const dagVan = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

export async function dbGebruik(kv) {
  let used = 0; try { const info = String(await kv.raw(['INFO', 'memory'])); used = N((info.match(/^used_memory:(\d+)/m) || [])[1]); } catch (e) {}
  return { used, max: MAX(), pct: used ? Math.round(1000 * used / MAX()) / 10 : null };
}

async function dagenWeg(kv, dagen, tijd) {
  let cu = '0', raak = 0, mb = 0; const t0 = Date.now();
  do { const r = await opruim(kv, { match: DAGPATROON, echt: true, ouderDan: dagVan(dagen), cursor: cu, tijd: Math.max(2000, tijd - (Date.now() - t0)) }); cu = String(r.volgende || '0'); raak += N(r.raak); mb += N(r.mb); }
  while (cu !== '0' && Date.now() - t0 < tijd);
  return { stap: 'dagstatistieken ouder dan ' + dagen + ' dagen', weg: raak, mb: Math.round(mb * 10) / 10, klaar: cu === '0' };
}

export async function dbWacht(kv, { tijd = 50000, log } = {}) {
  const t0 = Date.now(), voor = await dbGebruik(kv), stappen = [];
  const rest = () => tijd - (Date.now() - t0);
  const nu = async () => (await dbGebruik(kv)).pct || 0;
  if (voor.pct != null && voor.pct >= 70) {
    stappen.push(await dagenWeg(kv, 14, rest() / 3));
    try { const r = await opruimCid(kv, { echt: true, dagen: 2, tijd: Math.min(15000, rest() / 3) }); stappen.push({ stap: 'klikrecords ouder dan 2 dagen', weg: N(r.weg), klaar: String(r.volgende) === '0' }); } catch (e) { stappen.push({ stap: 'klikrecords', fout: String(e.message || e).slice(0, 120) }); }
    if (await nu() >= 80 && rest() > 5000) {
      stappen.push(await dagenWeg(kv, 10, rest() / 2));
      try { const r = await opruimPersonen(kv, { echt: true, dagen: 14, tijd: Math.min(15000, rest() / 2) }); stappen.push({ stap: 'eenmalige bezoekers ouder dan 14 dagen', weg: N(r.weg), korter: N(r.korter), klaar: String(r.volgende) === '0' }); } catch (e) { stappen.push({ stap: 'eenmalige bezoekers', fout: String(e.message || e).slice(0, 120) }); }
    }
    if (await nu() >= 90 && rest() > 5000) stappen.push(await dagenWeg(kv, 7, rest()));
  }
  const na = await dbGebruik(kv);
  const uit = { at: new Date().toISOString(), voorPct: voor.pct, naPct: na.pct, usedMB: Math.round(na.used / 1048576), maxMB: Math.round(na.max / 1048576), stappen, alarm: na.pct != null && na.pct >= 80 };
  try { await kv.set(K_DBWACHT, uit, { ex: 30 * 86400 }); } catch (e) {}
  if (stappen.length && typeof log === 'function') { try { await log(uit); } catch (e) {} }
  return uit;
}
