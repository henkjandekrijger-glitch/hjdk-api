// Whop Ads (Meta via de agency-accounts van Whop), Kadoly. 16 nov 2026, Henkjan: "Zet cadoly campagne op met 20 te testen ads en zeg me
// waar ik funds moet toevoegen . Ik wil dat je per 30 mins monitort en leert ." Whop is gekozen omdat Henkjan meteen op Meta wil starten
// "zonder iets van gedoe" (eigen Meta-account geblokkeerd); sturen gaat via de Whop-API.
//
// - Advertentielink: https://go.kadoly.com/shop?utm_campaign=nl-<pid8>&p=<pid>&arm=d&lang=nl
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
  if (!(Number(waarde) > 0) && Number(w.pr) > 0) waarde = Number(w.pr); // 16 nov (Henkjan: "max ROAS"): ook view_content, add_to_cart en initiate_checkout met de productprijs, zodat Meta op waarde leert
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

// Campagnes van het account (status, budget): voor de stand, zodat zichtbaar is of de campagne echt loopt (concept, geen saldo, actief).
// De lijstroute staat niet volledig in de documentatie: eerst account_id, dan company_id.
export async function whopCampagnes() {
  let laatste = null;
  for (const pad of ['/ad_campaigns?account_id=' + WHOP_BIZ + '&first=50', '/ad_campaigns?company_id=' + WHOP_BIZ + '&first=50']) {
    const r = await whopApi(pad); laatste = r; if (!r.ok) continue;
    const data = (r.j && (r.j.data || r.j.ad_campaigns)) || [];
    return { ok: true, pad: pad.split('?')[0], campagnes: data.map(c => ({ id: c.id, titel: c.title || c.name, status: c.status, levering: c.delivery_status, budget: c.daily_budget != null ? c.daily_budget : c.budget, velden: Object.keys(c || {}).slice(0, 30) })) };
  }
  return { ok: false, status: laatste && laatste.status, fout: laatste && laatste.fout };
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
export function oordeel(rijen, pool) {
  const r = WH_REGEL, aan = rijen.filter(x => x.status === 'active');
  const metTik = aan.filter(x => x.tik > 0 && x.spend > 0); const besteTik = metTik.length ? Math.min(...metTik.map(x => x.spend / x.tik)) : null;
  const uit = [];
  for (const x of aan.sort((a, b) => b.spend - a.spend)) {
    if (aan.length - uit.length <= r.minAan) break;
    if (x.spend >= r.geenMens && x.echt === 0) uit.push({ id: x.id, reden: `$${x.spend.toFixed(2)} uitgegeven, ${x.aan} aangekomen, 0 echte mensen` });
    else if (x.tik === 0 && x.spend >= Math.max(r.geenTik, besteTik ? r.factor * besteTik : r.geenTik)) uit.push({ id: x.id, reden: `$${x.spend.toFixed(2)} uitgegeven, ${x.echt} echte mensen, 0 tikken op de koopknop${besteTik ? ' (beste advertentie: $' + besteTik.toFixed(2) + ' per tik)' : ''}` });
  }
  // ROAS (16 nov): de slechtste eerst, zolang er meer dan minAan aan blijven
  if (pool && pool.poolRoas != null && pool.spend >= ROAS_REGEL.poolMin) {
    const al = new Set(uit.map(u => u.id));
    for (const x of aan.filter(x => !al.has(x.id) && x.spend >= ROAS_REGEL.minSpend && x.kansBeter != null && x.kansBeter < ROAS_REGEL.kansGrens).sort((a, b) => a.kansBeter - b.kansBeter)) {
      if (aan.length - uit.length <= r.minAan) break;
      uit.push({ id: x.id, reden: `verwachte ROAS ${x.roasVerw} tegen ${pool.poolRoas} gemiddeld, kans dat ze beter is ${Math.round(x.kansBeter * 100)}% ($${x.spend.toFixed(2)} uitgegeven)` });
    }
  }
  return { uit, besteTik };
}

// ===== Leren op ROAS (16 nov 2026, Henkjan: "Ja maak het zo lerend dat we max ROAS hebben .") =====
// Kopen zijn zeldzaam, dus elke advertentie krijgt een verwachte omzet uit de diepste stap die elke bezoeker haalde:
// betaald (echte omzet), afrekenpagina, tik op de koopknop, echt mens. De waarde per stap leert elke dag uit 28 dagen Kadoly
// over alle netten (Clickmind): gemiddelde bestelling en de kans van stap naar stap, met een voorzichtige startwaarde.
// Per advertentie trekt de ronde 3.000 keer uit de onzekerheid per stap (Gamma per stap, Thompson). Een advertentie gaat uit
// als ze minstens ROAS_REGEL.minSpend kostte en de kans dat ze beter is dan het gemiddelde van de campagne onder kansGrens zakt.
// Zo stroomt het budget naar de advertenties met de hoogste verwachte ROAS. Budget en bod blijven bij Henkjan.
export const ROAS_REGEL = { minSpend: 3, kansGrens: 0.1, poolMin: 10, priorSpend: 5, trekken: 3000, eurUsd: Number(process.env.EUR_USD) || 1.08, aovTerug: 30 };
const STAP = ['koop', 'kassa', 'tik', 'echt'];

// tot = som over 28 dagen, alle netten: { dm, dwk, dkp, koop, omzet (centen) }
// 16 nov: push-verkeer (PropellerAds, MGID, Mondiad) kocht in 28 dagen niets (359 op de afrekenpagina, 0 betaald; zonder advertentie 3 van 8
// bestellingen betaald). De stapkansen van Meta leert de ronde daarom uit Meta zelf (net wh) zodra er 20 tikken zijn; tot dan uit alle netten.
export function waardenUit(totAlle, totWh) {
  const eigen = totWh && (+totWh.dwk || 0) >= 20, tot = eigen ? totWh : totAlle;
  const koop = +tot.koop || 0, kassa = Math.max(+tot.dkp || 0, koop), tik = Math.max(+tot.dwk || 0, kassa), echt = Math.max(+tot.dm || 0, tik);
  const kA = +totAlle.koop || 0, aov = koop >= 2 ? (+tot.omzet || 0) / 100 / koop : kA >= 2 ? (+totAlle.omzet || 0) / 100 / kA : ROAS_REGEL.aovTerug;
  const qk = (koop + 1) / (kassa + 4), pkt = Math.min(1, (kassa + 3) / (tik + 10)), pte = Math.min(1, (tik + 1) / (echt + 10));
  return { at: new Date().toISOString(), bron: eigen ? 'meta (wh)' : 'alle netten', aov: +aov.toFixed(2), kassaKoop: +qk.toFixed(4), tikKassa: +pkt.toFixed(4), echtTik: +pte.toFixed(4), basis: { echt, tik, kassa, koop, omzet: Math.round((+tot.omzet || 0)) / 100 },
    v: { koop: aov, kassa: aov * qk, tik: aov * pkt * qk, echt: aov * pte * pkt * qk } };
}

// Aantallen per diepste stap (elke bezoeker telt één keer, in zijn diepste stap)
function stappen(x) { const koop = x.koop || 0, kassa = Math.max(0, (x.kassa || 0) - koop), tik = Math.max(0, (x.tik || 0) - Math.max(x.kassa || 0, koop)), echt = Math.max(0, (x.echt || 0) - Math.max(x.tik || 0, x.kassa || 0, koop)); return { koop, kassa, tik, echt }; }
function waardeVan(x, W) { const c = stappen(x); const koopW = c.koop > 0 && x.omzet > 0 ? x.omzet : c.koop * W.v.koop; return koopW + c.kassa * W.v.kassa + c.tik * W.v.tik + c.echt * W.v.echt; }

function randn() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function gamma(a) { if (a < 1) return gamma(a + 1) * Math.pow(Math.random(), 1 / a); const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = randn(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - 0.0331 * x * x * x * x) return d * v; if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }

// Vult per rij: verwacht (omzet in EUR), roas (echt betaald), roasVerw, kansBeter (dan gemiddeld), kansBeste (onder de actieve). Geeft de pool terug.
export function roasLeer(rijen, W) {
  const R = ROAS_REGEL, fx = R.eurUsd, mee = rijen.filter(x => x.spend > 0);
  const S = mee.reduce((a, x) => a + x.spend, 0), tel = { koop: 0, kassa: 0, tik: 0, echt: 0 }; let Wtot = 0;
  for (const x of mee) { const c = stappen(x); STAP.forEach(k => { tel[k] += c[k]; }); Wtot += waardeVan(x, W); }
  const poolRoas = S > 0 ? Wtot * fx / S : null;
  const prior = {}; STAP.forEach(k => { prior[k] = (tel[k] + 0.1) / (S + R.priorSpend); }); // per dollar, gedeeld over de campagne
  const actief = rijen.filter(x => x.status === 'active'), draws = {};
  for (const x of rijen) {
    x.verwacht = +waardeVan(x, W).toFixed(2); x.roas = x.spend > 0 ? +(x.omzet * fx / x.spend).toFixed(2) : null;
    if (!(x.spend > 0)) { x.roasVerw = poolRoas != null ? +poolRoas.toFixed(2) : null; x.kansBeter = null; continue; }
    const c = stappen(x), b = R.priorSpend + x.spend, d = new Float64Array(R.trekken); let som = 0, beter = 0;
    for (let i = 0; i < R.trekken; i++) { let w = 0; for (const k of STAP) { const a = prior[k] * R.priorSpend + c[k]; if (a > 0) w += gamma(a) / b * (k === 'koop' && c.koop > 0 && x.omzet > 0 ? x.omzet / c.koop : W.v[k]); } const r = w * fx; d[i] = r; som += r; if (poolRoas != null && r > poolRoas) beter++; }
    x.roasVerw = +(som / R.trekken).toFixed(2); x.kansBeter = poolRoas != null ? +(beter / R.trekken).toFixed(3) : null; draws[x.id] = d;
  }
  const ids = actief.map(x => x.id).filter(id => draws[id]); const best = {}; ids.forEach(id => { best[id] = 0; });
  if (ids.length) for (let i = 0; i < R.trekken; i++) { let bi = ids[0]; for (const id of ids) if (draws[id][i] > draws[bi][i]) bi = id; best[bi]++; }
  for (const x of rijen) x.kansBeste = best[x.id] != null ? +(best[x.id] / R.trekken).toFixed(3) : null;
  // per product (titel voor de " | ") en per invalshoek (na de " | ")
  const groep = f => { const g = {}; for (const x of rijen) { const k = f(String(x.titel || '')); if (!k) continue; const o = g[k] = g[k] || { spend: 0, verwacht: 0, omzet: 0, echt: 0, tik: 0, kassa: 0, koop: 0, n: 0 }; o.spend += x.spend; o.verwacht += x.verwacht; o.omzet += x.omzet; o.echt += x.echt; o.tik += x.tik; o.kassa += x.kassa; o.koop += x.koop; o.n++; } return Object.entries(g).map(([naam, o]) => ({ naam, ...o, spend: +o.spend.toFixed(2), verwacht: +o.verwacht.toFixed(2), roasVerw: o.spend > 0 ? +(o.verwacht * fx / o.spend).toFixed(2) : null })).sort((a, b) => (b.roasVerw ?? -1) - (a.roasVerw ?? -1)); };
  return { spend: +S.toFixed(2), verwacht: +Wtot.toFixed(2), omzet: +mee.reduce((a, x) => a + x.omzet, 0).toFixed(2), poolRoas: poolRoas != null ? +poolRoas.toFixed(2) : null, eurUsd: fx,
    producten: groep(t => t.split(' | ')[0].trim()), invalshoeken: groep(t => (t.split(' | ')[1] || '').trim()) };
}
