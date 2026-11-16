// Whop Ads (Meta via de agency-accounts van Whop), Kadoly. 16 nov 2026, Henkjan: "Zet cadoly campagne op met 20 te testen ads en zeg me
// waar ik funds moet toevoegen . Ik wil dat je per 30 mins monitort en leert ." Whop is gekozen omdat Henkjan meteen op Meta wil starten
// "zonder iets van gedoe" (eigen Meta-account geblokkeerd); sturen gaat via de Whop-API.
//
// - Advertentielink: https://go.kadoly.com/shop?utm_source=whop&utm_medium=meta&utm_campaign=nl-<pid8>&p=<pid>&arm=d&lang=nl
//   Whop zet zelf wacid (campagne), wasid (advertentiegroep) en waid (advertentie) achter de link, Meta zet fbclid erachter.
//   In de shoproute (api/shop.js) is dat net wh: campagne = wacid, plek = wasid, advertentie = waid, klik-id = fbclid.
// - Conversies gaan server naar server naar de Events API van Whop (POST /events, recht event:create), met de volledige
//   landings-URL (wacid/wasid/waid/fbclid), zodat Whop de advertentie vindt: view_content = echt mens, add_to_cart = doel 1
//   (zelfde regel als PropellerAds en TikTok: tik op de koopknop na 10 s of bewust afrekenen), initiate_checkout = afrekenpagina,
//   purchase = betaald met bedrag. Eenmaal per klik per soort (event_id).
// - De Whop-pixel staat via cm.js op kadoly.com, alleen na toestemming (Google consent mode ad_storage granted).
// - Sleutel: gedeelde team-variabele WHOP_API_KEY (Henkjan zet hem zelf). Zonder sleutel wordt er niets gestuurd en slaat de ronde over.
import { createHash } from 'node:crypto';

export const WHOP_BIZ = (process.env.WHOP_BIZ_KADOLY || 'biz_gwtIgPUYUJOx2e').trim(); // Whop-bedrijf Kadoly (geen sleutel, staat ook in de dashboard-URL)
const API = 'https://api.whop.com/api/v1';
const sleutel = () => (process.env.WHOP_API_KEY || process.env.WHOP_KADOLY_API_KEY || '').trim();
export const whopKlaar = () => !!sleutel();
export const whId = s => String(s || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase().slice(0, 40); // zelfde vorm als plekId in api/shop.js

export async function whopApi(pad, o = {}) {
  const k = sleutel(); if (!k) return { ok: false, status: 0, fout: 'geen WHOP_API_KEY' };
  try {
    const r = await fetch(API + pad, { method: o.method || 'GET', headers: { authorization: 'Bearer ' + k, 'content-type': 'application/json', accept: 'application/json' }, body: o.body ? JSON.stringify(o.body) : undefined, signal: AbortSignal.timeout(o.ms || 15000) });
    let j = null; try { j = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, j, fout: r.ok ? '' : String((j && (j.error && (j.error.message || j.error)) || j && j.message) || ('HTTP ' + r.status)).slice(0, 200) };
  } catch (e) { return { ok: false, status: 0, fout: String(e.message || e).slice(0, 120) }; }
}

// Landings-URL zoals Whop hem zag: kadoly.com/product/<pid> met de Whop- en Meta-parameters die de klik meekreeg.
function landUrl(rec) { const w = rec.w || {}; const qs = new URLSearchParams(); for (const k of ['wacid', 'wasid', 'waid', 'fbclid', 'utm_source', 'utm_medium', 'utm_campaign']) if (w[k]) qs.set(k, w[k]); return 'https://kadoly.com/' + (rec.vk ? '' : 'product/' + encodeURIComponent(rec.p || '')) + (qs.toString() ? '?' + qs : ''); }

// Eén gebeurtenis naar de Events API van Whop. Geeft de HTTP-status terug (0 = niets gestuurd).
export async function whEvent(rec, event, waarde) {
  if (!sleutel() || !rec || !rec.c || rec.t) return 0;
  if (event === 'purchase' && !(Number(waarde) > 0)) return 'geen-bedrag'; // Whop weigert purchase zonder bedrag
  const w = rec.w || {};
  const body = { account_id: WHOP_BIZ, event_name: event, event_id: event + '-' + createHash('sha1').update(String(rec.c)).digest('hex').slice(0, 24), event_time: new Date().toISOString(), action_source: 'website', url: landUrl(rec), currency: 'eur',
    ...(Number(waarde) > 0 ? { value: Math.round(Number(waarde) * 100) / 100 } : {}),
    context: { ...(w.fbclid ? { fbclid: w.fbclid } : {}), ...(rec.ua ? { user_agent: rec.ua } : {}), utm_source: w.utm_source || 'whop', ...(w.utm_campaign ? { utm_campaign: w.utm_campaign } : {}) } };
  const r = await whopApi('/events', { method: 'POST', body, ms: 4000 });
  return r.ok ? 200 : (r.status || 'weg');
}

// Alle advertenties van Kadoly met cijfers over een venster (stats_from/stats_to, ISO). Pagineert tot 300.
export async function whopAds(van, tot) {
  const out = []; let na = ''; for (let i = 0; i < 3; i++) {
    const q = new URLSearchParams({ account_id: WHOP_BIZ, first: '100', time_zone: 'Europe/Amsterdam' }); if (van) q.set('stats_from', van); if (tot) q.set('stats_to', tot); if (na) q.set('after', na);
    const r = await whopApi('/ads?' + q); if (!r.ok) return { ok: false, fout: r.fout, status: r.status, ads: out };
    out.push(...((r.j && r.j.data) || [])); const pi = r.j && r.j.page_info; if (!pi || !pi.has_next_page || !pi.end_cursor) break; na = pi.end_cursor;
  }
  return { ok: true, ads: out };
}

// Advertentie pauzeren. De pauze-route staat niet volledig in de documentatie: eerst POST /ads/{id}/pause, anders PATCH status.
export async function whopPauze(id) {
  let r = await whopApi('/ads/' + encodeURIComponent(id) + '/pause', { method: 'POST' });
  if (!r.ok && (r.status === 404 || r.status === 405)) r = await whopApi('/ads/' + encodeURIComponent(id), { method: 'PATCH', body: { status: 'paused' } });
  return r;
}

export async function meld(tekst) {
  const s = process.env.MELD_SLEUTEL; if (!s) return false;
  try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'Kadoly Meta (Whop)', tekst: String(tekst).slice(0, 3400) }), signal: AbortSignal.timeout(10000) }); const j = await r.json().catch(() => ({})); return !!(j && j.ok); } catch (e) { return false; }
}

// De stopregel per advertentie (elke 30 minuten). Alleen advertenties binnen deze ene testcampagne; nooit de campagne zelf, nooit budget of bod.
// Een advertentie gaat uit als ze geld kost zonder dat Clickmind er een mens achter ziet, of als ze ruim het dubbele van de beste
// kosten per tik op de koopknop kost zonder één tik. Altijd minstens MIN_AAN advertenties aan, zodat de test blijft leren.
export const WH_REGEL = { geenMens: 1.5, geenTik: 4, factor: 2.5, minAan: 6, minKliksAankomst: 25, aankomstAlarm: 0.3, dagMax: 12 };
export function oordeel(rijen) {
  const r = WH_REGEL, aan = rijen.filter(x => x.status === 'active');
  const metTik = aan.filter(x => x.tik > 0 && x.spend > 0); const besteTik = metTik.length ? Math.min(...metTik.map(x => x.spend / x.tik)) : null;
  const uit = [];
  for (const x of aan.sort((a, b) => b.spend - a.spend)) {
    if (aan.length - uit.length <= r.minAan) break;
    if (x.spend >= r.geenMens && x.echt === 0) uit.push({ id: x.id, reden: `$${x.spend.toFixed(2)} uitgegeven, ${x.aan} aangekomen, 0 echte mensen` });
    else if (x.tik === 0 && x.spend >= Math.max(r.geenTik, besteTik ? r.factor * besteTik : r.geenTik)) uit.push({ id: x.id, reden: `$${x.spend.toFixed(2)} uitgegeven, ${x.echt} echte mensen, 0 tikken op de koopknop${besteTik ? ' (beste advertentie: $' + besteTik.toFixed(2) + ' per tik)' : ''}` });
  }
  return { uit, besteTik };
}
