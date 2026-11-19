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
import VARIANTEN from '../data/whop-varianten.json' with { type: 'json' };
import BEWEZEN from '../data/whop-bewezen.json' with { type: 'json' };

export const WHOP_BIZ = (process.env.WHOP_BIZ_KADOLY || 'biz_gwtIgPUYUJOx2e').trim(); // Whop-bedrijf Kadoly (geen sleutel, staat ook in de dashboard-URL)
// 19 nov (Whop-mail "Whop pixel not detected" voor go.kadoly.com/shop): het officiële Whop-snippet letterlijk in de <head> van een landingspagina,
// zodat Whop het in de bron vindt (validate_pixel kijkt naar de bron van de doel-URL). Zelfde toestemmingsregel als cm.js: s.js laadt pas als
// ad_storage in de consent-dataLayer op granted staat; tot dan blijft alles in de wachtrij. Zet __whl, zodat cm.js de pixel niet nog eens laadt.
export function whPixelHtml(biz = WHOP_BIZ) {
  return '<script>\n!function(w,d,s,u,n,a){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});a.q.push([+new Date,"setScope"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};w.__whl=1;'
    + 'function ok(){var l=w.dataLayer||[],g=null;for(var i=0;i<l.length;i++){var x=l[i];if(x&&x[0]==="consent"&&x[2]&&x[2].ad_storage)g=x[2].ad_storage}return g==="granted"}'
    + 'function laad(){var b=d.createElement(s);b.async=1;b.src=u+"/s.js";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}'
    + 'if(ok())laad();else{var k=0,t=setInterval(function(){if(ok()){clearInterval(t);laad()}if(++k>180)clearInterval(t)},1000)}}(window,document,"script","https://t.whop.tw","whop");\n'
    + 'whop.setScope("' + String(biz).replace(/[^A-Za-z0-9_]/g, '') + '");\nwhop.track("page");\n</script>';
}
const API = 'https://api.whop.com/api/v1';
const sleutel = () => (process.env.WHOP_API_KEY || process.env.WHOP_KADOLY_API_KEY || '').trim();
export const whopKlaar = () => !!sleutel();
export const whId = s => String(s || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase().slice(0, 40); // zelfde vorm als plekId in api/shop.js

export async function whopApi(pad, o = {}) {
  const k = o.key || sleutel(); if (!k) return { ok: false, status: 0, fout: 'geen WHOP_API_KEY' };
  try {
    const r = await fetch(API + pad, { method: o.method || 'GET', headers: { authorization: 'Bearer ' + k, 'content-type': 'application/json', accept: 'application/json', ...(o.versie ? { 'Api-Version-Date': o.versie } : {}) }, body: o.body ? JSON.stringify(o.body) : undefined, signal: AbortSignal.timeout(o.ms || 15000) });
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

// 19 nov (Henkjan: "Dit is niet ok !! doe diep onderzoek"): Whop levert advertenties pas vlot als de pixel vuurt op de doel-URL
// (mail 19 nov: "Your ads send people to go.kadoly.com/shop, but the Whop pixel hasn't fired there in 3 days"). Echte klikken gaan in
// één keer (302) naar kadoly.com, dus de browserpixel vuurt nooit op go.kadoly.com/shop. Daarom bij elke klik met klik-id een
// paginaweergave via de Events API, met de echte landings-URL (alle parameters, ook wacid/wasid/waid en fbclid), dezelfde gegevens
// als bij de andere server-events (browser, fbclid, utm), event_id per klik zodat een herhaling niet dubbel telt.
export async function whPage(x) {
  if (!sleutel() || !x || !x.clickid || !x.url) return 0;
  const body = { account_id: WHOP_BIZ, event_name: 'page', event_id: 'page-' + createHash('sha1').update(String(x.clickid)).digest('hex').slice(0, 24), event_time: new Date().toISOString(), action_source: 'website', url: x.url,
    ...(x.wuid ? { user: { anonymous_id: x.wuid } } : {}),
    ...(x.referrer ? { referrer_url: x.referrer } : {}),
    context: { ...(x.fbclid ? { fbclid: x.fbclid } : {}), ...(x.ua ? { user_agent: x.ua } : {}), ...(x.utm_source ? { utm_source: x.utm_source } : {}), ...(x.utm_medium ? { utm_medium: x.utm_medium } : {}), ...(x.utm_campaign ? { utm_campaign: x.utm_campaign } : {}) } };
  const r = await whopApi('/events', { method: 'POST', body, ms: 4000 });
  return r.ok ? 200 : (r.status || 'weg') + (r.fout ? ' ' + r.fout : '');
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
export const WH_REGEL = { minLeverend: 2, geenMens: 1.5, minKliksMens: 5, geenKlik: 6, geenTik: 6, factor: 2.5, minAan: 6, minKliksAankomst: 25, aankomstAlarm: 0.3, dagMax: 24 } // dagMax: budget $20 sinds 16 nov (Henkjan), alarm boven $24;
export function oordeel(rijen, pool) {
  const r = WH_REGEL, aan = rijen.filter(x => x.status === 'active');
  const metTik = aan.filter(x => x.tik > 0 && x.spend > 0); const besteTik = metTik.length ? Math.min(...metTik.map(x => x.spend / x.tik)) : null;
  const uit = [];
  // 19 nov: de ronde zette om 05:41 UTC de enige advertentie uit waar Meta nog op leverde (alpaca sokken); de nieuwe advertenties hadden nog
  // nooit een vertoning, dus de hele campagne viel stil. Daarom blijven er altijd minstens minLeverend advertenties aan die al uitgaven.
  const leverend = aan.filter(x => x.spend > 0).length; const magUit = x => !(x.spend > 0) || leverend - uit.filter(u => u.spend > 0).length > (r.minLeverend || 2);
  for (const x of aan.sort((a, b) => b.spend - a.spend)) {
    if (aan.length - uit.length <= r.minAan) break;
    if (!magUit(x)) continue;
    // 17 nov: Meta rekent per vertoning; zonder klik zegt 0 echte mensen niets. Eerst kliks, dan pas oordelen op mensen.
    if (x.spend >= r.geenMens && x.echt === 0 && x.kliks >= r.minKliksMens) uit.push({ id: x.id, spend: x.spend, reden: `$${x.spend.toFixed(2)} uitgegeven, ${x.kliks} kliks, ${x.aan} aangekomen, 0 echte mensen` });
    else if (x.spend >= r.geenKlik && x.kliks === 0) uit.push({ id: x.id, spend: x.spend, reden: `$${x.spend.toFixed(2)} uitgegeven zonder één klik (advertentie spreekt niet aan)` });
    else if (x.tik === 0 && x.spend >= Math.max(r.geenTik, besteTik ? r.factor * besteTik : r.geenTik)) uit.push({ id: x.id, spend: x.spend, reden: `$${x.spend.toFixed(2)} uitgegeven, ${x.echt} echte mensen, 0 tikken op de koopknop${besteTik ? ' (beste advertentie: $' + besteTik.toFixed(2) + ' per tik)' : ''}` });
  }
  // ROAS (16 nov): de slechtste eerst, zolang er meer dan minAan aan blijven
  if (pool && pool.poolRoas != null && pool.spend >= ROAS_REGEL.poolMin) {
    const al = new Set(uit.map(u => u.id));
    for (const x of aan.filter(x => !al.has(x.id) && x.spend >= ROAS_REGEL.minSpend && x.kansBeter != null && x.kansBeter < ROAS_REGEL.kansGrens).sort((a, b) => a.kansBeter - b.kansBeter)) {
      if (aan.length - uit.length <= r.minAan) break;
      if (!magUit(x)) continue;
      uit.push({ id: x.id, spend: x.spend, reden: `verwachte ROAS ${x.roasVerw} tegen ${pool.poolRoas} gemiddeld, kans dat ze beter is ${Math.round(x.kansBeter * 100)}% ($${x.spend.toFixed(2)} uitgegeven)` });
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

// ===== Budget en verkenning (16 nov 2026, Henkjan: "Ja en zorg dat het extreem lerend is ." op: PropellerAds-shop uit, Meta naar $20 per dag) =====
// Budget gaat nooit vanzelf omhoog: alleen via op=whbudget op de beschermde host, en nooit boven WH_BUDGET_MAX (Henkjans woord).
export const WH_BUDGET_MAX = 20;
export async function whopGroepen(campagneId) {
  for (const pad of ['/ad_groups?ad_campaign_id=' + campagneId + '&first=50', '/ad_groups?campaign_id=' + campagneId + '&first=50', '/ad_groups?account_id=' + WHOP_BIZ + '&first=100', '/ad_groups?company_id=' + WHOP_BIZ + '&first=100']) {
    const r = await whopApi(pad); if (!r.ok) continue; const data = (r.j && r.j.data) || [];
    const eigen = data.filter(g => !campagneId || !g.ad_campaign || g.ad_campaign.id === campagneId || g.ad_campaign_id === campagneId);
    if (eigen.length) return { ok: true, pad: pad.split('&')[0], groepen: eigen };
  }
  return { ok: false, groepen: [] };
}
export async function whopZetBudget(campagneId, bedrag) {
  const b = Number(bedrag); if (!(b >= 5) || b > WH_BUDGET_MAX) return { ok: false, fout: 'bedrag tussen 5 en ' + WH_BUDGET_MAX };
  const g = await whopGroepen(campagneId); const pogingen = [];
  for (const x of g.groepen) {
    if (x.budget_amount == null && x.daily_budget == null && x.budget == null) continue; // budget staat op de campagne
    for (const body of [{ budget: b, budget_type: 'daily' }, { budget_amount: b, budget_type: 'daily' }, { daily_budget: b }]) {
      const r = await whopApi('/ad_groups/' + x.id, { method: 'PATCH', body }); pogingen.push({ groep: x.id, body: Object.keys(body).join('+'), status: r.status, fout: r.fout || undefined });
      if (r.ok) { const n = await whopApi('/ad_groups/' + x.id); const nu = n.j ? (n.j.budget_amount ?? n.j.daily_budget ?? n.j.budget) : null; if (Number(nu) === b) break; }
    }
  }
  if (!pogingen.length) for (const body of [{ budget_amount: b, budget_type: 'daily' }, { budget: b, budget_type: 'daily' }, { daily_budget: b }]) { // budget op de campagne (budget_optimization ad_campaign)
    const r = await whopApi('/ad_campaigns/' + campagneId, { method: 'PATCH', body }); pogingen.push({ campagne: campagneId, body: Object.keys(body).join('+'), status: r.status, fout: r.fout || undefined });
    if (r.ok) { const n = await whopApi('/ad_campaigns/' + campagneId); if (n.j && Number(n.j.budget_amount ?? n.j.budget) === b) break; }
  }
  const na = await whopGroepen(campagneId), c = await whopApi('/ad_campaigns/' + campagneId);
  return { ok: pogingen.some(p => !p.fout), pogingen, groepen: na.groepen.map(x => ({ id: x.id, budget: x.budget_amount ?? x.daily_budget ?? x.budget ?? null, type: x.budget_type || null })), campagneBudget: c.j ? (c.j.budget_amount ?? c.j.budget ?? c.j.daily_budget ?? null) : null };
}

// Verkennen: nieuwe teksten bij de producten die het best lopen (16 nov). Eigen foto van de bestaande advertentie, eigen tekst uit
// data/whop-varianten.json, nooit gegenereerde beelden. Alleen als er advertenties uit gingen (zo blijft Meta zo min mogelijk opnieuw leren),
// hoogstens VERKEN.perDag per dag, nooit meer dan VERKEN.max advertenties in de campagne.
export const VERKEN = { perDag: 3, doelAan: 20, max: 40, vanafSpend: 10 }; // max 40 sinds 18 nov: ruimte voor de negen bewezen producten
const jsonVan = v => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch (e) { return v; } };
export function verkenPlan(ruw, rijen, pool, al = 0) {
  const aan = rijen.filter(x => x.status === 'active').length; const ruimte = Math.min(VERKEN.perDag - al, VERKEN.doelAan - aan, VERKEN.max - ruw.length);
  if (ruimte <= 0 || !pool || pool.spend < VERKEN.vanafSpend) return { plan: [], waarom: ruimte <= 0 ? 'geen ruimte (' + aan + ' aan)' : 'nog te weinig uitgegeven' };
  const bestaand = new Set(ruw.map(a => String(a.title || '').trim().toLowerCase()));
  const perProduct = {}; for (const a of ruw) { const prod = String(a.title || '').split(' | ')[0].trim(); const cr = (jsonVan(a.creatives) || [])[0]; const grp = jsonVan(a.ad_group) || {}; if (!prod || !cr || !cr.id) continue; (perProduct[prod] = perProduct[prod] || []).push({ status: a.status, file: cr.id, groep: grp.id || a.ad_group_id, url: a.url, params: jsonVan(a.url_parameters) || {} }); }
  const alleRang = (pool.producten || []).filter(p => p.roasVerw != null && p.roasVerw > 0 && perProduct[p.naam] && perProduct[p.naam].some(x => x.status === 'active'));
  const rang = alleRang.slice(0, Math.max(1, Math.ceil(alleRang.length / 2))); // alleen de bovenste helft; de beste krijgt wat er overblijft
  const plan = [], gebruikt = new Set(bestaand), neem = p => { const v = (VARIANTEN.varianten || []).find(v => v.product === p.naam && !gebruikt.has((v.product + ' | ' + v.invalshoek).toLowerCase())); if (!v) return false; gebruikt.add((v.product + ' | ' + v.invalshoek).toLowerCase()); const bron = perProduct[p.naam].find(x => x.status === 'active') || perProduct[p.naam][0];
    plan.push({ titel: v.product + ' | ' + v.invalshoek, kop: v.kop, tekst: v.tekst, file: bron.file, groep: bron.groep, url: bron.url || 'https://go.kadoly.com/shop', params: Object.assign({}, bron.params, { wa: whId(v.product + v.invalshoek).slice(0, 24) }), waarom: p.naam + ' verwacht ROAS ' + p.roasVerw }); return true; };
  for (const p of rang) { if (plan.length >= ruimte) break; neem(p); }
  for (const p of rang) while (plan.length < ruimte && neem(p)) {}
  return { plan, waarom: plan.length ? '' : 'geen nieuwe tekst voor de beste producten' };
}
export async function whopNieuweAd(x) {
  const body = { title: x.titel, primary_texts: [{ text: x.tekst }], headlines: [{ text: x.kop }], call_to_action: 'shop_now', url: x.url, url_parameters: x.params, creatives: [{ id: x.file }], ad_group_id: x.groep };
  let r = await whopApi('/ads', { method: 'POST', body });
  if (!r.ok && r.status >= 400 && r.status < 500 && /url_param/i.test(r.fout)) { const qs = new URLSearchParams(x.params || {}).toString(); const b2 = Object.assign({}, body, { url: x.url + (qs ? '?' + qs : '') }); delete b2.url_parameters; r = await whopApi('/ads', { method: 'POST', body: b2 }); }
  return r;
}

// Bewezen producten uit de Meta Ad Library (17 nov 2026, Henkjan: "match op onze producten dus daar bewezen gaan we ook testen" en
// "2. JA": eerst de prijzen naar het prijsadvies, dan testen). data/whop-bewezen.json. Een product gaat pas de campagne in als de shop
// het tegen de nieuwe prijs verkoopt (marge minstens margeMin) en het op voorraad is; per ronde hoogstens één product, twee advertenties,
// met de productfoto (4:5) die de ronde zelf bij Whop uploadt. Zo kost een test nooit geld op een product met EUR 1,50 marge.
export const BEWEZEN_MARGE = Number(BEWEZEN.margeMin) || 10;
export function bewezenPlan(ruw, items) {
  const titels = (ruw || []).map(a => String(a.title || '').toLowerCase()), perId = new Map((items || []).map(i => [i.id, i])), uit = [];
  for (const p of BEWEZEN.producten || []) {
    if (titels.some(t => t.startsWith(p.naam.toLowerCase() + ' |'))) { uit.push({ naam: p.naam, staat: 'loopt al' }); continue; }
    const kand = (p.kandidaten || []).map(id => perId.get(id)).filter(Boolean), op = kand.filter(i => i.vr !== false);
    const ok = op.find(i => Number(i.mg) >= BEWEZEN_MARGE);
    if (ok) { uit.push({ naam: p.naam, staat: 'klaar', pid: ok.id, marge: Number(ok.mg), varianten: p.varianten }); continue; }
    const b = op.sort((x, y) => Number(y.mg) - Number(x.mg))[0];
    uit.push({ naam: p.naam, staat: b ? 'wacht op nieuwe prijs' : 'niet op voorraad', pid: b ? b.id : null, marge: b ? Number(b.mg) : null });
  }
  return uit;
}
export async function whopUpload(bytes, naam, type = 'image/jpeg') {
  const c = await whopApi('/files', { method: 'POST', body: { filename: naam, visibility: 'public' } });
  if (!c.ok || !c.j || !c.j.upload_url) return { ok: false, fout: 'aanmaken: ' + (c.fout || 'geen upload_url') };
  const h = Object.assign({}, c.j.upload_headers || {}); if (!Object.keys(h).some(k => k.toLowerCase() === 'content-type')) h['content-type'] = type;
  const put = await fetch(c.j.upload_url, { method: 'PUT', headers: h, body: bytes, signal: AbortSignal.timeout(20000) }).catch(e => ({ ok: false, status: String(e.message || e).slice(0, 60) }));
  if (!put.ok) return { ok: false, fout: 'uploaden: ' + put.status };
  for (let i = 0; i < 6; i++) {
    const g = await whopApi('/files?file_ids=' + encodeURIComponent(c.j.id)); const f = g.j && Array.isArray(g.j.data) ? g.j.data[0] : null; const st = f && f.upload_status;
    if (st === 'ready') return { ok: true, id: c.j.id }; if (st === 'failed') return { ok: false, fout: 'verwerken mislukt' };
    await new Promise(r => setTimeout(r, 1500));
  }
  return { ok: true, id: c.j.id, nogBezig: true };
}
export async function bewezenRonde(ruw, items, beeldUrl) {
  if ((ruw || []).length >= VERKEN.max) return [];
  const pl = bewezenPlan(ruw, items).find(x => x.staat === 'klaar'); if (!pl) return [];
  const bron = ruw.find(a => a.status === 'active') || ruw[0]; const grp = jsonVan(bron && bron.ad_group) || {}; const groep = grp.id || (bron && bron.ad_group_id);
  if (!groep) return [{ titel: pl.naam, ok: false, fout: 'geen advertentiegroep' }];
  const r = await fetch(beeldUrl(pl.pid), { signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!r || !r.ok) return [{ titel: pl.naam, ok: false, fout: 'foto ' + (r ? r.status : 'geen antwoord') }];
  const up = await whopUpload(Buffer.from(await r.arrayBuffer()), 'kadoly-' + pl.pid.slice(-10) + '.jpg', r.headers.get('content-type') || 'image/jpeg');
  if (!up.ok) return [{ titel: pl.naam, ok: false, fout: up.fout }];
  const uit = [];
  for (const v of pl.varianten || []) {
    const x = { titel: pl.naam + ' | ' + v.invalshoek, kop: v.kop, tekst: v.tekst, file: up.id, groep, url: 'https://go.kadoly.com/shop', params: { p: pl.pid, arm: 'd', lang: 'nl', utm_campaign: 'nl-' + pl.pid.slice(-8), wa: whId(pl.naam + v.invalshoek).slice(0, 24) } };
    const a = await whopNieuweAd(x); uit.push({ titel: x.titel, pid: pl.pid, marge: pl.marge, ok: a.ok, fout: a.ok ? undefined : a.fout }); if (!a.ok) break;
  }
  return uit;
}

// ===== Abonnees werven via Meta (Whop), per project (16 nov 2026, Henkjan: "Kun je met whop ook de email abbo tool aanzetten op meta ?
// Dat wil ik dan graag voor Curacao.day testen en ook andere projecten ." Daarna Sealed Intent.) =====
// Elk project heeft een eigen Whop-bedrijf (één advertentieaccount per bedrijf) met een eigen sleutel als gedeelde team-variabele:
// WHOP_API_KEY_<PROJECT> en WHOP_BIZ_<PROJECT>. De aanmeldpagina bewaart wacid/wasid/waid/fbclid van de klik en meldt na een
// geslaagde aanmelding één 'lead' aan de Events API van Whop (server naar server), eenmaal per aanmelding.
export const WH_PROJECTEN = {
  curacao: { naam: 'Curacao.day', env: 'CURACAO', url: 'https://curacao.day/', biz: 'biz_i6OjoMmfNeOL9T' }, // Whop-bedrijf 'Curacao' aangemaakt 17 nov 2026
  sealed: { naam: 'Sealed Intent', env: 'SEALED', url: 'https://sealedintent.com/' }
};
export function whProject(p) {
  const c = WH_PROJECTEN[p]; if (!c) return null;
  const key = String(process.env['WHOP_API_KEY_' + c.env] || '').trim(), biz = String(process.env['WHOP_BIZ_' + c.env] || c.biz || '').trim();
  return Object.assign({ id: p, key, biz, klaar: !!(key && /^biz_[A-Za-z0-9]+$/.test(biz)) }, c);
}
export const WH_LEAD_EVENTS = ['lead', 'complete_registration', 'subscribe'];
export async function whLead(pr, x) {
  if (!pr || !pr.klaar) return 'niet-klaar';
  const ev = WH_LEAD_EVENTS.includes(x.ev) ? x.ev : 'lead';
  const qs = new URLSearchParams(); for (const k of ['wacid', 'wasid', 'waid', 'fbclid']) if (x[k]) qs.set(k, x[k]);
  let basis = pr.url; try { const u = new URL(String(x.u || '')); if (u.hostname.replace(/^www\./, '') === new URL(pr.url).hostname.replace(/^www\./, '')) basis = u.origin + u.pathname; } catch (e) {}
  const body = { account_id: pr.biz, event_name: ev, event_id: ev + '-' + createHash('sha1').update(pr.id + '|' + String(x.eid)).digest('hex').slice(0, 24), event_time: new Date().toISOString(), action_source: 'website',
    url: basis + (qs.toString() ? '?' + qs : ''), context: { ...(x.fbclid ? { fbclid: x.fbclid } : {}), ...(x.ua ? { user_agent: x.ua } : {}), utm_source: 'whop' } };
  const r = await whopApi('/events', { method: 'POST', body, key: pr.key, ms: 4000 });
  return r.ok ? 200 : (r.status || 'weg');
}

// waid (eigen nummer van Whop in de link) koppelen aan de ad-id van de API (17 nov). Eerst onze eigen wa (bij nieuwe advertenties),
// anders het product (p): één advertentie met dat product, of maar één ervan heeft geld of kliks. Eenmaal gekoppeld blijft het staan.
export function koppelWaid(ads, waidP, waidWa, vast) {
  const v = Object.assign({}, vast || {}); let nieuw = false;
  const info = ads.map(a => { const up = jsonVan(a.url_parameters) || {}; return { id: a.id, p: up.p, wa: up.wa ? whId(up.wa) : '', geld: Number(a.spend) > 0 || Number(a.link_clicks) > 0 }; });
  for (const [w, p] of Object.entries(waidP || {})) {
    if (v[w]) continue; const wa = (waidWa || {})[w];
    let k = wa ? info.filter(a => a.wa === wa) : info.filter(a => a.p === p && !a.wa);
    if (k.length > 1) { const g = k.filter(a => a.geld); if (g.length === 1) k = g; }
    if (k.length === 1) { v[w] = k[0].id; nieuw = true; }
  }
  return { vast: v, nieuw };
}
export async function whopAan(id) {
  let r = await whopApi('/ads/' + encodeURIComponent(id) + '/unpause', { method: 'POST' });
  if (!r.ok && (r.status === 404 || r.status === 405)) r = await whopApi('/ads/' + encodeURIComponent(id), { method: 'PATCH', body: { status: 'active' } });
  return r;
}

// Waar Meta op stuurt (conversion_event van de advertentiegroep). Alleen op Henkjans woord (17 nov: "Ja doen ." op view_content
// tot er rond de 50 tikken per week zijn, dan add_to_cart, daarna purchase). Probeert de veldnamen die de documentatie noemt en leest terug.
export const WH_DOELEN = ['view_content', 'add_to_cart', 'initiate_checkout', 'purchase'];
export async function whopZetDoel(groepId, ev) {
  if (!WH_DOELEN.includes(ev)) return { ok: false, fout: 'doel' };
  const pogingen = []; let nu = null;
  // 17 nov: Whop weigert 'view_content' als conversion_event ("Use a standard event"); de standaardnamen volgen Meta (CONTENT_VIEW, INITIATED_CHECKOUT)
  const namen = { view_content: ['content_view', 'view_content', 'ViewContent'], add_to_cart: ['add_to_cart'], initiate_checkout: ['initiated_checkout', 'initiate_checkout', 'InitiateCheckout'], purchase: ['purchase'] }[ev];
  for (const naam of namen) {
    const r = await whopApi('/ad_groups/' + groepId, { method: 'PATCH', body: { conversion_event: naam } }); pogingen.push({ naam, status: r.status, fout: r.fout || undefined });
    if (!r.ok) continue; const n = await whopApi('/ad_groups/' + groepId); nu = n.j ? (n.j.conversion_event || null) : null; if (nu && nu !== 'add_to_cart' || ev === 'add_to_cart') break;
  }
  return { ok: !!nu && (ev === 'add_to_cart' ? nu === 'add_to_cart' : nu !== 'add_to_cart'), nu, pogingen };
}

// 19 nov (Henkjan: "Ja het moet gaan leren ... JA dus ."): optimalisatie van de advertentiegroep (optimization_goal). Meta rekende $65 tot $280
// per 1.000 vertoningen op content_view; tijdelijk op landingspaginaweergaven tot er genoeg tikken zijn. Leest terug wat Whop opslaat.
export const WH_OPT = ['landing_page_views', 'link_clicks', 'conversions'];
export async function whopZetOptimalisatie(groepId, goal) {
  if (!WH_OPT.includes(goal)) return { ok: false, fout: 'goal' };
  const pogingen = []; let nu = null;
  for (const body of [{ optimization_goal: goal }, { optimization_goal: goal, conversion_event: null }]) {
    const r = await whopApi('/ad_groups/' + groepId, { method: 'PATCH', body, versie: WH_LPV_VERSIE }); pogingen.push({ velden: Object.keys(body).join('+'), status: r.status, fout: r.fout || undefined });
    const n = await whopApi('/ad_groups/' + groepId, { versie: WH_LPV_VERSIE }); nu = n.j ? { optimization_goal: n.j.optimization_goal ?? null, conversion_event: n.j.conversion_event ?? null, delivery_status: n.j.delivery_status } : null;
    if (r.ok && nu && nu.optimization_goal === goal) break;
  }
  return { ok: !!nu && nu.optimization_goal === goal, nu, pogingen };
}

// 19 nov (Henkjan: "Ja het moet gaan leren ... JA dus ."): in een sales-campagne kan de optimalisatie na de start niet meer om (Whop: veld
// Conversion event vergrendeld). Daarom een nieuwe campagne met doel traffic en een groep op landingspaginaweergaven, met dezelfde
// doelgroep en dezelfde advertenties die nu aan staan; pas als alles staat gaat de oude campagne op pauze en de nieuwe aan. Budget zoals
// Henkjan zei (EUR/USD 20 per dag), op de dag van de wissel minder zodat het dagtotaal niet boven het afgesproken bedrag komt.
// POST met automatisch weglaten van velden die Whop niet kent ("Unsupported fields: a, b"); velden in moet blijven nooit weglaten.
export const WH_LPV_VERSIE = '2026-10-24';
async function postZonder(pad, body, moet = [], opt = {}) {
  let b = { ...body }; const weg = []; let r = null;
  for (let i = 0; i < 4; i++) {
    r = await whopApi(pad, { method: 'POST', body: b, ...opt }); if (r.ok) break;
    const m = String(r.fout || '').match(/Unsupported fields?:\s*([A-Za-z0-9_.,\s]+)/i); if (!m) break;
    const velden = m[1].split(',').map(x => x.trim().split('.')[0]).filter(Boolean); if (!velden.length || velden.some(v => moet.includes(v))) break;
    for (const v of velden) { delete b[v]; weg.push(v); }
  }
  return Object.assign(r || {}, { weggelaten: weg });
}
export async function whLpvBouw(oudId, budget, uitvoeren = false) {
  const log = [], gr = await whopGroepen(oudId); const g = (gr.groepen || [])[0]; if (!g) return { ok: false, stap: 'groep', fout: 'geen groep in ' + oudId };
  const alle = await whopAds(); if (!alle.ok) return { ok: false, stap: 'advertenties', fout: alle.fout };
  const mijn = alle.ads.filter(a => (jsonVan(a.ad_group) || {}).id === g.id && a.status === 'active');
  const kopie = {}; for (const k of ['regions', 'languages', 'devices', 'demographics']) if (g[k] != null) kopie[k] = jsonVan(g[k]);
  const camp = { account_id: WHOP_BIZ, title: 'KADOLY META NL landingspagina', objective: 'traffic', budget_optimization: 'ad_campaign', budget_amount: budget, budget_type: 'daily' }; // platform: Whop kent het veld hier niet (19 nov)
  const groep = { title: 'NL mobiel 18+ landingspagina', optimization_goal: 'landing_page_views', conversion_location: 'website', ...kopie };
  // optimization_goal bestaat alleen in API-versie 2026-10-24 en ouder (proef 19 nov: de nieuwste versie kent alleen conversion_event)
  const V = { versie: WH_LPV_VERSIE };
  const ads = mijn.map(a => ({ title: a.title, primary_texts: (jsonVan(a.primary_texts) || []).map(x => ({ text: x.text || x })).filter(x => x.text), headlines: (jsonVan(a.headlines) || []).map(x => ({ text: x.text || x })).filter(x => x.text), call_to_action: a.call_to_action || 'shop_now', url: a.url, url_parameters: jsonVan(a.url_parameters) || {}, creatives: (jsonVan(a.creatives) || []).map(c => ({ id: c.id })).filter(c => c.id) }));
  if (!uitvoeren) return { ok: true, droog: true, oudeGroep: g.id, campagne: camp, groep, ads: ads.map(a => a.title) };
  // 19 nov: eerste poging maakte de campagne (draft) maar de groep weigerde optimization_goal bij POST. Daarom: bestaande campagne met
  // deze naam hergebruiken (nooit een tweede), groep zonder optimization_goal maken als Whop het veld bij aanmaken niet kent, het doel
  // daarna zetten met PATCH op de groep of op de campagne (CBO), teruglezen, en pas met het juiste doel advertenties maken en wisselen.
  const lijst = await whopApi('/ad_campaigns?account_id=' + WHOP_BIZ + '&first=50');
  const bestaand = ((lijst.j && lijst.j.data) || []).find(c => c.title === camp.title && c.id !== oudId);
  let campId = bestaand && bestaand.id;
  if (campId) log.push({ stap: 'campagne', hergebruikt: campId, status: bestaand.status });
  else {
    const nc = await postZonder('/ad_campaigns', camp, ['objective', 'budget_amount', 'account_id']); log.push({ stap: 'campagne', status: nc.status, fout: nc.fout || undefined, id: nc.j && nc.j.id, objective: nc.j && nc.j.objective, weggelaten: nc.weggelaten });
    if (!nc.ok || !nc.j || !nc.j.id) return { ok: false, log }; campId = nc.j.id;
  }
  const gl = await whopApi('/ad_groups?ad_campaign_id=' + campId + '&first=50');
  let groepId = (((gl.j && gl.j.data) || []).find(x => (x.ad_campaign && x.ad_campaign.id) === campId && x.title === groep.title) || {}).id;
  if (groepId) log.push({ stap: 'groep', hergebruikt: groepId });
  else {
    const ng = await postZonder('/ad_groups', { ad_campaign_id: campId, ...groep }, ['ad_campaign_id', 'regions', 'optimization_goal'], V); log.push({ stap: 'groep', status: ng.status, fout: ng.fout || undefined, id: ng.j && ng.j.id, optimization_goal: ng.j && ng.j.optimization_goal, weggelaten: ng.weggelaten });
    if (!ng.ok || !ng.j || !ng.j.id) return { ok: false, nieuweCampagne: campId, log }; groepId = ng.j.id;
  }
  const doel = groep.optimization_goal, lees = async () => { const a = await whopApi('/ad_groups/' + groepId, V), c = await whopApi('/ad_campaigns/' + campId, V); return { groep: a.j ? a.j.optimization_goal ?? null : null, campagne: c.j ? c.j.optimization_goal ?? null : null, objective: c.j && c.j.objective, status: c.j && c.j.status }; };
  // Whop laat optimization_goal leeg (null) bij traffic, ook na PATCH, en het dashboard toont voor traffic geen keuze: Whop optimaliseert
  // dan zelf op kliks naar de site (zijn link_clicks = paginaweergaven via de pixel). Dat telt als goed; een ander gezet doel niet.
  const goed = x => x.groep === doel || x.campagne === doel || (x.groep == null && x.campagne == null && x.objective === 'traffic');
  let nu = await lees(); const doelPogingen = [];
  if (!(nu.groep === doel || nu.campagne === doel)) for (const [pad, body] of [['/ad_groups/' + groepId, { optimization_goal: doel }], ['/ad_campaigns/' + campId, { optimization_goal: doel }]]) {
    const r = await whopApi(pad, { method: 'PATCH', body, ...V }); doelPogingen.push({ pad: pad.split('/')[1], status: r.status, fout: r.fout || undefined });
    nu = await lees(); if (nu.groep === doel || nu.campagne === doel) break;
  }
  log.push({ stap: 'optimalisatie', doel, nu, pogingen: doelPogingen });
  if (!goed(nu)) return { ok: false, nieuweCampagne: campId, nieuweGroep: groepId, reden: 'optimalisatie staat niet op ' + doel + '; niets gewisseld, oude campagne loopt door', log };
  const al = await whopAds(); const bestaandeAds = new Set((al.ads || []).filter(a => (jsonVan(a.ad_group) || {}).id === groepId).map(a => a.title));
  const gemaakt = []; for (const a of ads) { if (bestaandeAds.has(a.title)) { gemaakt.push({ id: 'bestond', title: a.title }); continue; } let r = await whopApi('/ads', { method: 'POST', body: { ...a, ad_group_id: groepId } }); if (!r.ok && r.status >= 400 && r.status < 500 && /url_param/i.test(r.fout)) { const qs = new URLSearchParams(a.url_parameters || {}).toString(); const b2 = { ...a, ad_group_id: groepId, url: a.url + (qs ? '?' + qs : '') }; delete b2.url_parameters; r = await whopApi('/ads', { method: 'POST', body: b2 }); } gemaakt.push(r.ok ? { id: r.j && r.j.id, title: a.title } : { title: a.title, fout: r.fout, status: r.status }); }
  log.push({ stap: 'advertenties', gemaakt: gemaakt.filter(x => x.id).length, van: ads.length, fouten: gemaakt.filter(x => !x.id) });
  if (gemaakt.filter(x => x.id).length < Math.max(1, Math.ceil(ads.length / 2))) { log.push({ stap: 'oude campagne blijft aan', reden: 'te weinig advertenties gemaakt' }); return { ok: false, nieuweCampagne: campId, nieuweGroep: groepId, log }; }
  // nooit twee tegelijk aan: eerst de oude op pauze, dan de nieuwe aan; gaat de nieuwe niet aan, dan de oude weer aan
  let pz = await whopApi('/ad_campaigns/' + oudId + '/pause', { method: 'POST' }); if (!pz.ok && (pz.status === 404 || pz.status === 405)) pz = await whopApi('/ad_campaigns/' + oudId, { method: 'PATCH', body: { status: 'paused' } });
  log.push({ stap: 'oude campagne op pauze', status: pz.status, fout: pz.fout || undefined });
  let st = await whopApi('/ad_campaigns/' + campId); if (st.j && st.j.status !== 'active') { const ac = await whopApi('/ad_campaigns/' + campId, { method: 'PATCH', body: { status: 'active' } }); log.push({ stap: 'nieuwe campagne aan', status: ac.status, fout: ac.fout || undefined }); st = await whopApi('/ad_campaigns/' + campId); }
  if (!st.j || st.j.status !== 'active') { let up = await whopApi('/ad_campaigns/' + oudId + '/unpause', { method: 'POST' }); if (!up.ok) up = await whopApi('/ad_campaigns/' + oudId, { method: 'PATCH', body: { status: 'active' } }); log.push({ stap: 'nieuwe ging niet aan, oude weer aan', status: up.status, fout: up.fout || undefined }); return { ok: false, nieuweCampagne: campId, nieuweGroep: groepId, log }; }
  log.push({ stap: 'nieuwe campagne', status: st.j.status, levering: st.j.delivery_status, optimization_goal: st.j.optimization_goal ?? nu.groep });
  return { ok: true, nieuweCampagne: campId, nieuweGroep: groepId, log };
}

// ---------------- Facebook-formulier (Meta lead ads / instant forms) voor curacao.day ----------------
// Henkjan 17 nov 2026: "Ik wil dat je email form ad van fb gebruikt" en "optimaliseer dat sterk dat form ... zorg dat adresssen meteen
// in juiste data base en meteen eerste email". Whop kent lead_form alleen nog in API-versie 2026-10-06 (proef 17 nov: nieuwere versies
// geven "Unsupported fields: lead_form"). Inname en eerste mail: todayin bzz/lib/cwwhop.js (elke 5 min, GET /leads).
// Sterk formulier: één vraag (e-mail, door Facebook vooringevuld), more_volume (geen extra bevestigingsstap), intro = de belofte,
// eindscherm zegt dat de eerste mail al onderweg is en stuurt door naar de site. Alleen het strandformulier vraagt eerst één keuze:
// die belooft de advertentie ("één tik en je weet het") en de eerste mail is dan de strandgids.
export const WH_FORM_VERSIE = '2026-10-06';
export const WH_FORM = {
  nl: { taal: 'nl', intro: { headline: 'Curaçao elke ochtend in je mail', description: 'Wat er vandaag speelt, welke cruiseschepen er liggen, het weer en de zee. Gratis. Eén mail per ochtend, stoppen met één tik.' },
    klaar: { headline: 'Gelukt! Je eerste mail is onderweg', description: 'Kijk in je inbox, anders even bij reclame of spam. Morgenochtend om 7 uur komt de volgende.', button_text: 'Bekijk Curaçao vandaag', url: 'https://curacao.day/nl?src=fbform' },
    strand: { label: 'Wat zoek je op het strand?', opties: ['Wit strand en rust', 'Met kinderen', 'Snorkelen', 'Strandtent en feest'], intro: { headline: 'Welk strand past bij jou?', description: 'Kies wat je zoekt. Je top 5 met prijzen en tips staat meteen in je mail, daarna elke ochtend Curaçao.' }, klaar: 'Gelukt! Je strandtop 5 staat al in je mail' }, privacy: 'Privacy' },
  de: { taal: 'de', intro: { headline: 'Curaçao jeden Morgen per Mail', description: 'Was heute los ist, welche Kreuzfahrtschiffe da sind, Wetter und Meer. Kostenlos. Eine Mail pro Morgen, mit einem Klick abbestellen.' },
    klaar: { headline: 'Geschafft! Deine erste Mail ist unterwegs', description: 'Schau in dein Postfach, sonst kurz im Spam-Ordner. Morgen früh um 7 Uhr kommt die nächste.', button_text: 'Curaçao heute ansehen', url: 'https://curacao.day/de?src=fbform' },
    strand: { label: 'Was suchst du am Strand?', opties: ['Weißer Strand und Ruhe', 'Mit Kindern', 'Schnorcheln', 'Strandbar und Party'], intro: { headline: 'Welcher Strand passt zu dir?', description: 'Wähle, was du suchst. Deine Top 5 mit Preisen und Tipps kommt sofort per Mail, danach jeden Morgen Curaçao.' }, klaar: 'Geschafft! Deine Strand-Top-5 ist schon in deiner Mail' }, privacy: 'Datenschutz' },
  en: { taal: 'en', intro: { headline: 'Curaçao in your inbox every morning', description: "What's on today, which cruise ships are in, the weather and the sea. Free. One email a morning, unsubscribe in one tap." },
    klaar: { headline: 'Done! Your first email is on its way', description: 'Check your inbox, or your spam folder just in case. The next one lands tomorrow at 7 am.', button_text: 'See Curaçao today', url: 'https://curacao.day/en?src=fbform' },
    strand: { label: 'What are you looking for?', opties: ['White sand and quiet', 'With kids', 'Snorkeling', 'Beach bar and party'], intro: { headline: 'Which Curaçao beach is yours?', description: 'Pick what you want. Your top 5 with prices and tips lands in your inbox right away, then Curaçao every morning.' }, klaar: 'Done! Your beach top 5 is already in your inbox' }, privacy: 'Privacy' }
};
const FORM_TAAL = { nl: 'nl', de: 'de', ca: 'en', en: 'en' };
export function leadForm(land, arm) {
  const f = WH_FORM[FORM_TAAL[land] || 'en'], strand = arm === 'strand';
  return { name: `cur-${land}-${arm}`, form_type: 'more_volume', phone_verification: false,
    intro: strand ? f.strand.intro : f.intro,
    questions: [...(strand ? [{ type: 'custom', format: 'multiple_choice', label: f.strand.label, options: f.strand.opties.map(value => ({ value })) }] : []), { type: 'email' }],
    privacy_policy: { url: `https://curacao.day/${f.taal}/privacy`, link_text: f.privacy },
    completion: strand ? { ...f.klaar, headline: f.strand.klaar } : f.klaar };
}
// land uit de groepsnaam (NL mobiel, DE mobiel, CA mobiel) en arm uit de advertentienaam (nl-vandaag, de-fernweh, en-strand)
export const formLand = titel => { const m = String(titel || '').trim().toLowerCase().match(/^(nl|de|ca|en)\b/); return m ? m[1] : ''; };
export const formArm = titel => { const m = String(titel || '').toLowerCase().match(/-(vandaag|strand|korsou|fernweh|live)\b/); return m ? m[1] : 'vandaag'; };

// Plan (en zo gevraagd uitvoeren): per websitegroep een formuliergroep met dezelfde doelgroep, per advertentie dezelfde beelden en
// teksten met een eigen formulier; daarna de websitegroep op pauze. Zonder uitvoeren=true verandert er niets.
export async function whFormBouw(pr, campagneId, uitvoeren = false) {
  const opt = { key: pr.key, versie: WH_FORM_VERSIE }, log = [];
  const gr = await whopApi(`/ad_groups?account_id=${pr.biz}&ad_campaign_id=${campagneId}&first=50`, opt); if (!gr.ok) return { ok: false, stap: 'groepen', fout: gr.fout, status: gr.status };
  const ad = await whopApi(`/ads?account_id=${pr.biz}&ad_campaign_id=${campagneId}&first=100`, opt); if (!ad.ok) return { ok: false, stap: 'advertenties', fout: ad.fout, status: ad.status };
  const groepen = (gr.j && gr.j.data) || [], ads = (ad.j && ad.j.data) || [], plan = [];
  for (const g of groepen) {
    const land = formLand(g.title); if (!land || /formulier/i.test(g.title || '') || /instant/.test(String(g.conversion_location || ''))) continue;
    const kopie = {}; for (const k of ['regions', 'languages', 'devices', 'demographics', 'delivery_schedule']) if (g[k] != null) kopie[k] = g[k];
    const body = { ad_campaign_id: campagneId, title: `${land.toUpperCase()} formulier`, status: 'paused', conversion_location: 'instant_forms', conversion_event: 'lead', ...kopie }; // op pauze: aan pas op Henkjans woord
    const mijn = ads.filter(a => (a.ad_group && a.ad_group.id || a.ad_group_id) === g.id);
    plan.push({ van: g.id, groep: body, ads: mijn.map(a => ({ title: `${a.title || ''} formulier`.trim(), call_to_action: 'subscribe', primary_texts: (a.primary_texts || []).map(x => ({ text: x.text || x })).filter(x => x.text), headlines: (a.headlines || []).map(x => ({ text: x.text || x })).filter(x => x.text), creatives: (a.creatives || []).map(c => ({ id: c.id })).filter(c => c.id), lead_form: leadForm(land, formArm(a.title)) })) });
  }
  if (!uitvoeren) return { ok: true, droog: true, groepen: groepen.length, ads: ads.length, plan };
  for (const p of plan) {
    const ng = await whopApi('/ad_groups', { method: 'POST', body: p.groep, ...opt }); if (!ng.ok || !ng.j || !ng.j.id) { log.push({ groep: p.groep.title, fout: ng.fout, status: ng.status }); continue; }
    const r = { groep: p.groep.title, id: ng.j.id, conversion_location: ng.j.conversion_location || null, ads: [] };
    for (const a of p.ads) { const na = await whopApi('/ads', { method: 'POST', body: { ...a, ad_group_id: ng.j.id }, ...opt }); r.ads.push(na.ok ? { id: na.j && na.j.id, title: a.title } : { title: a.title, fout: na.fout, status: na.status }); }
    if (r.ads.length && r.ads.every(x => x.id)) { const pz = await whopApi('/ad_groups/' + p.van + '/pause', { method: 'POST', ...opt }); r.oudeGroepPauze = pz.ok ? 'ja' : pz.fout; }
    log.push(r);
  }
  return { ok: log.length > 0 && log.every(x => x.id && x.ads.every(a => a.id)), uitgevoerd: true, log };
}

// Formuliergroepen nazetten: Whop negeert conversion_location bij POST /ad_groups (proef 17 nov: groep kwam terug als website,
// lead_form van de advertentie daardoor null). Hier per formuliergroep PATCH conversion_location en daarna per advertentie PATCH lead_form.
export async function whFormFix(pr, campagneId) {
  const opt = { key: pr.key, versie: WH_FORM_VERSIE }, uit = [];
  const gr = await whopApi(`/ad_groups?account_id=${pr.biz}&ad_campaign_id=${campagneId}&first=50`, opt); if (!gr.ok) return { ok: false, stap: 'groepen', fout: gr.fout };
  const ad = await whopApi(`/ads?account_id=${pr.biz}&ad_campaign_id=${campagneId}&first=100`, opt); if (!ad.ok) return { ok: false, stap: 'ads', fout: ad.fout };
  for (const g of (gr.j && gr.j.data) || []) {
    if (!/formulier/i.test(g.title || '')) continue; const land = formLand(g.title);
    const r = { groep: g.title, id: g.id, was: g.conversion_location || null, pogingen: [], ads: [] };
    for (const v of ['instant_forms', 'website_and_instant_forms']) {
      if (/instant/.test(String(r.nu || g.conversion_location || ''))) break;
      const p = await whopApi('/ad_groups/' + g.id, { method: 'PATCH', body: { conversion_location: v }, ...opt }); r.pogingen.push(v + ': ' + p.status + (p.fout ? ' ' + p.fout : ''));
      const n = await whopApi('/ad_groups/' + g.id, opt); r.nu = n.j ? (n.j.conversion_location || null) : null;
    }
    for (const a of ((ad.j && ad.j.data) || []).filter(a => (a.ad_group && a.ad_group.id) === g.id)) {
      const p = await whopApi('/ads/' + a.id, { method: 'PATCH', body: { lead_form: leadForm(land, formArm(a.title)) }, ...opt });
      const n = await whopApi('/ads/' + a.id, opt); r.ads.push({ id: a.id, title: a.title, patch: p.status + (p.fout ? ' ' + p.fout : ''), lead_form: !!(n.j && n.j.lead_form), lead_form_id: n.j ? n.j.lead_form_id || null : null });
    }
    uit.push(r);
  }
  return { ok: uit.length > 0 && uit.every(x => /instant/.test(String(x.nu || '')) && x.ads.every(a => a.lead_form)), uit };
}
