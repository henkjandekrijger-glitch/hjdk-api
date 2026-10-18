// Clickmind: lookalikes op uitkomst (Henkjan 18 okt 2026: "Kunnen we met clickmind goed lookalike clicks vinden nav een
// aankoop of een aanmelding? Pro actief?" -> "Ja"). Les van die dag: echte mensen zijn nog geen aanmelders (zone 11261241:
// 93 echte mensen op todayin, 0 aanmeldingen), en de oude lijkt-op-winnaar (lib/leer.js) telde elke uitkomst even zwaar en
// vergeleek alleen OS en uren, waardoor bijna elke pushzone op elke andere leek.
//
// Wat dit doet, per project en land (eerst todayin VS; MyLevel zodra die per zone uitkomsten levert):
// 1. Uitkomsten per zone uit de eigen tellers van het project (todayin: /api/ti?cmdata=1, m = echte mensen, k = onderwerp
//    gekozen, s = aanmelding; cc = land van de campagne). Getest = minstens MIN_TEST echte mensen in het project.
// 2. Kenmerken per zone uit de mensmeter (7 dagen, alle sites en netwerken van Henkjan): aandeel echte mensen, interactie,
//    3 seconden in beeld, unieke apparaten en IP's, datacenter, headless, herhaalklikken, in-app, terugkomers, iOS, uren.
//    Gestandaardiseerd (z-scores), zodat geen kenmerk alles bepaalt.
// 3. Voorspelling per niet-geteste zone: kernel-regressie op de geteste zones (Gauss op afstand, bandbreedte = mediaan
//    afstand), met de projectgemiddelde aanmeldkans als prior. Verwachte aanmeldingen per 1.000 bezoeken = echte mensen per
//    bezoek x voorspelde aanmeldkans per mens; verwachte kosten per aanmelding = klikprijs / aanmeldingen per klik.
// 4. Eerlijk: modelkwaliteit = rangcorrelatie bij weglaten-van-een op de geteste zones; met weinig winnaars is het een
//    zoeklicht, geen zekerheid. Daarom test de verkenner (verkenVoorstel) elke kandidaat zelf: na ~20 echte mensen houden
//    (aanmelding of >= 25% onderwerp) of eruit, en dat resultaat traint de volgende ronde.
import { zones, dag } from './mensmeter.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };
const DAGEN = 7, MIN_TEST = 8, MIN_JS = 20, PRIOR_N = 20;
// campagnes van voor 18 okt zonder land in todayins tellers (cmData kreeg toen pas cc)
const NL_OUD = new Set(['12020870', '12022649', '12020822', '12020823', '12023370', '12023374']);
export const PROJECTEN = {
  todayin: { naam: 'todayin', doel: 'aanmelding', bron: () => (process.env.TODAYIN_URL || 'https://todayin.email') + '/api/ti?cmdata=1&dagen=' + DAGEN, landen: ['us', 'nl'] },
};
const KENM = ['mens', 'int', 'vis3', 'uniekFp', 'uniekIp', 'dc', 'hl', 'rep', 'inapp', 'terug', 'ios', 'ochtend', 'middag', 'avond', 'nacht'];

async function uitkomsten(project, land) {
  const P = PROJECTEN[project]; if (!P) throw new Error('onbekend project ' + project);
  const r = await fetch(P.bron(), { headers: { 'user-agent': 'clickmind-lookalike' }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(project + ' http ' + r.status);
  const j = await r.json(), Z = {}, camps = new Set();
  for (const d of j.dagen || []) for (const x of d.rijen || []) {
    if (String(x.net) !== 'propeller' || !/^\d{1,12}$/.test(String(x.zone))) continue;
    const cc = x.cc || (NL_OUD.has(String(x.camp)) ? 'nl' : 'us');
    if (cc !== land) continue;
    camps.add(String(x.camp));
    const z = Z[x.zone] || (Z[x.zone] = { zone: String(x.zone), v: 0, m: 0, k: 0, s: 0 });
    z.v += N(x.v); z.m += N(x.m); z.k += N(x.k); z.s += N(x.s);
  }
  return { zones: Z, camps: [...camps], dagen: (j.dagen || []).map(d => ({ dag: d.dag, rijen: (d.rijen || []).filter(x => String(x.net) === 'propeller') })) };
}

async function kenmerkenPerZone(kv) {
  const D = Array.from({ length: DAGEN }, (_, i) => dag(-i));
  const hs = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:zf:' + d]).catch(() => null)));
  const F = {}; for (const h of hs) for (const [f, v] of paren(h)) { const p = f.split('|'); if (p.length < 3 || p[0] !== 'propeller') continue; const o = F[p[1]] || (F[p[1]] = {}); o[p.slice(2).join('|')] = N(o[p.slice(2).join('|')]) + N(v); }
  return F;
}

function vector(z, f) {
  const v = Math.max(1, N(z.v)), js = Math.max(1, N(z.js));
  return { mens: N(z.mens) / js, int: N(z.int) / js, vis3: N(z.vis3) / js, uniekFp: N(z.fpUniek) / Math.max(1, N(z.fpn)), uniekIp: N(z.ipUniek) / v, dc: N(z.dc) / v, hl: N(z.hl) / js, rep: N(z.rep) / v,
    inapp: N(f.inapp) / v, terug: N(f.terug) / v, ios: N(f.os_ios) / v, ochtend: N(f.uur_ochtend) / v, middag: N(f.uur_middag) / v, avond: N(f.uur_avond) / v, nacht: N(f.uur_nacht) / v };
}

// klikprijs per zone uit PropellerAds (7 dagen, alleen de campagnes van het project in dat land)
async function klikprijzen(camps) {
  const tok = process.env.PROPELLER_API_TOKEN || process.env.PROPELLER_API_TOKEN_BACKUP || process.env.PROPELLER_TOKEN || '';
  if (!tok || !camps.length) return {};
  const q = new URLSearchParams({ tz: '+0000', day_from: dag(-(DAGEN - 1)) + ' 00:00:00', day_to: dag() + ' 23:59:59', per_page: '1000' });
  q.append('group_by[]', 'zone_id'); for (const c of camps.slice(0, 80)) q.append('campaign_id[]', c);
  try {
    const r = await fetch('https://ssp-api.propellerads.com/v5/adv/statistics?' + q, { headers: { Authorization: 'Bearer ' + tok, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return {};
    const j = await r.json(), o = {}; for (const x of j.items || []) o[String(x.zone_id)] = { kliks: N(x.clicks), kosten: N(x.spent) }; return o;
  } catch { return {}; }
}

const mediaan = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
function spearman(a, b) {
  const rang = x => { const i = x.map((v, k) => [v, k]).sort((p, q) => p[0] - q[0]), r = Array(x.length); i.forEach((p, k) => { r[p[1]] = k; }); return r; };
  const ra = rang(a), rb = rang(b), n = a.length; if (n < 4) return null;
  let d2 = 0; for (let k = 0; k < n; k++) d2 += (ra[k] - rb[k]) ** 2; return Math.round((1 - 6 * d2 / (n * (n * n - 1))) * 100) / 100;
}

export async function lookalike(kv, { project = 'todayin', land = 'us' } = {}) {
  const [U, F, ZM] = await Promise.all([uitkomsten(project, land), kenmerkenPerZone(kv), zones(kv, { net: 'propeller', dagen: DAGEN })]);
  const meet = {}; for (const z of ZM.zones || []) meet[String(z.zone)] = z;
  // standaardiseren over alle zones met genoeg metingen
  const ruw = {}; for (const [zone, z] of Object.entries(meet)) if (N(z.js) >= MIN_JS) ruw[zone] = vector(z, F[zone] || {});
  const gem = {}, sd = {};
  for (const k of KENM) { const xs = Object.values(ruw).map(v => v[k]); const m = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length); gem[k] = m; sd[k] = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length)) || 1; }
  const std = v => Object.fromEntries(KENM.map(k => [k, (v[k] - gem[k]) / sd[k]]));
  const afst = (a, b) => Math.sqrt(KENM.reduce((t, k) => t + (a[k] - b[k]) ** 2, 0));
  // geteste zones (training)
  const test = Object.values(U.zones).filter(z => z.m >= MIN_TEST && ruw[z.zone]);
  const Sm = test.reduce((t, z) => t + z.m, 0), Ss = test.reduce((t, z) => t + z.s, 0), Sk = test.reduce((t, z) => t + z.k, 0);
  const p0 = Sm ? Ss / Sm : 0, a0 = Sm ? Sk / Sm : 0;
  const T = test.map(z => ({ ...z, x: std(ruw[z.zone]), p: (z.s + p0 * PRIOR_N) / (z.m + PRIOR_N), a: (z.k + a0 * PRIOR_N) / (z.m + PRIOR_N) }));
  const paar = []; for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) paar.push(afst(T[i].x, T[j].x));
  const sigma = mediaan(paar) || 1;
  const voorspel = (x, zonder = null) => { let W = 1, P = p0, A = a0, best = null, bw = 0; for (const t of T) { if (t === zonder) continue; const w = Math.exp(-(afst(x, t.x) ** 2) / (2 * sigma * sigma)); W += w; P += w * t.p; A += w * t.a; if (t.s > 0 && w > bw) { bw = w; best = t.zone; } } return { p: P / W, a: A / W, lijktOp: best, gelijkenis: Math.round(bw * 100) / 100 }; };
  const kwaliteit = T.length >= 4 ? spearman(T.map(t => voorspel(t.x, t).p), T.map(t => t.p)) : null;
  const prijs = await klikprijzen(U.camps);
  const cpcs = Object.values(prijs).filter(x => x.kliks >= 5).map(x => x.kosten / x.kliks), cpcMed = mediaan(cpcs) || 0.01;
  const perKlik = (zone, pMens) => { const z = meet[zone]; return z && N(z.v) ? (N(z.mens) / N(z.v)) * pMens : 0; };
  const kandidaten = [];
  for (const [zone, v] of Object.entries(ruw)) {
    const z = meet[zone], u = U.zones[zone];
    if (u && u.m >= MIN_TEST) continue; // al getest in dit project
    if (z.oordeel === 'zwart' || z.oordeel === 'verdacht') continue;
    const r = voorspel(std(v)), pk = perKlik(zone, r.p), cpc = prijs[zone] && prijs[zone].kliks >= 5 ? prijs[zone].kosten / prijs[zone].kliks : cpcMed;
    kandidaten.push({ zone, aanmeldkans_per_mens: Math.round(r.p * 1000) / 10, onderwerpkans: Math.round(r.a * 100), mens_pct: Math.round(N(z.mens) / Math.max(1, N(z.js)) * 100), gemeten: N(z.js), per_1000_bezoeken: Math.round(pk * 10000) / 10, kosten_per_aanmelding: pk ? Math.round(cpc / pk * 100) / 100 : null, klikprijs: Math.round(cpc * 1000) / 1000, klikprijs_bron: prijs[zone] ? 'gemeten' : 'mediaan', lijkt_op: r.lijktOp, gelijkenis: r.gelijkenis, al_gezien_in_project: u ? { mensen: u.m, onderwerp: u.k, aanmeldingen: u.s } : null });
  }
  kandidaten.sort((a, b) => b.per_1000_bezoeken - a.per_1000_bezoeken);
  const winnaars = T.filter(t => t.s > 0).sort((a, b) => b.p - a.p).map(t => ({ zone: t.zone, mensen: t.m, onderwerp: t.k, aanmeldingen: t.s, aanmeldkans_per_mens: Math.round(t.p * 1000) / 10, kosten_per_aanmelding: prijs[t.zone] && t.s ? Math.round(prijs[t.zone].kosten / t.s * 100) / 100 : null }));
  const verliezers = T.filter(t => t.s === 0 && t.m >= 20).sort((a, b) => b.m - a.m).slice(0, 20).map(t => ({ zone: t.zone, mensen: t.m, onderwerp: t.k }));
  return { project, land, doel: PROJECTEN[project].doel, bijgewerkt: new Date().toISOString(), dagen: DAGEN, uitleg: 'Lookalikes op uitkomst (lib/lookalike.js): getest = minstens ' + MIN_TEST + ' echte mensen in het project; voorspelling = kernel-regressie op ' + KENM.length + ' mensmeter-kenmerken met de projectkans als prior; per_1000_bezoeken = verwachte aanmeldingen; modelkwaliteit = rangcorrelatie bij weglaten-van-een (1 = perfect, 0 = gokken).', getest: T.length, winnaars_aantal: winnaars.length, aanmeldkans_project: Math.round(p0 * 1000) / 10, modelkwaliteit: kwaliteit, klikprijs_mediaan: Math.round(cpcMed * 1000) / 1000, winnaars, verliezers, kandidaten: kandidaten.slice(0, 40) };
}

// ---------- verkenner: een vaste witte-lijstcampagne per project die zichzelf ververst ----------
// Stand in mm:verken:<project>-<land>: { campagne, lijst, sinds: {zone: dag}, uit: {zone: dag}, log }. Voorstel = nieuwe lijst;
// propellerads-mcp (app/api/verken) zet hem en meldt terug (op=verkengedaan), pas dan wordt de stand bijgewerkt.
const VERKEN_STANDAARD = { 'todayin-us': { project: 'todayin', land: 'us', campagne: '12024558', max: 20, nieuwPerDag: 4, aan: true, start: ['10567468', '10598544', '11245397', '11823730', '9357307', '10967034', '11423871', '11989415', '9787683', '10578194', '11799261', '11442881', '12021752', '9667835', '10911181', '10199334'], startDag: '2026-10-18' } };
export async function verkenCfg(kv) { const c = (await kv.get('mm:verken:cfg').catch(() => null)) || {}; return Object.fromEntries(Object.entries(VERKEN_STANDAARD).map(([k, v]) => [k, { ...v, ...(c[k] || {}) }])); }

export async function verkenVoorstel(kv, sleutel = 'todayin-us') {
  const C = (await verkenCfg(kv))[sleutel]; if (!C) return { ok: false, fout: 'onbekende verkenner ' + sleutel };
  const st = (await kv.get('mm:verken:' + sleutel).catch(() => null)) || { campagne: C.campagne, lijst: C.start, sinds: Object.fromEntries(C.start.map(z => [z, C.startDag])), uit: {}, log: [] };
  const L = await lookalike(kv, { project: C.project, land: C.land });
  const U = await uitkomsten(C.project, C.land);
  // per zone in de lijst: wat deze campagne er sinds de start van die zone mee deed
  const vanaf = {}; for (const d of U.dagen) for (const x of d.rijen) { if (String(x.camp) !== String(C.campagne)) continue; const z = String(x.zone); if (!st.lijst.includes(z) || d.dag < (st.sinds[z] || C.startDag)) continue; const o = vanaf[z] || (vanaf[z] = { m: 0, k: 0, s: 0 }); o.m += N(x.m); o.k += N(x.k); o.s += N(x.s); }
  const houden = [], eruit = [], testen = [];
  for (const z of st.lijst) { const o = vanaf[z] || { m: 0, k: 0, s: 0 }; if (o.m >= 20) { if (o.s >= 1 || o.k / o.m >= 0.25) houden.push({ zone: z, ...o }); else eruit.push({ zone: z, ...o }); } else testen.push({ zone: z, ...o }); }
  let lijst = [...houden.map(x => x.zone), ...testen.map(x => x.zone)];
  if (!lijst.length) lijst = houden.length ? houden.map(x => x.zone) : st.lijst.slice(0, 1); // nooit leeg
  const vandaag = dag(), recentUit = z => st.uit[z] && (Date.parse(vandaag) - Date.parse(st.uit[z])) / 864e5 < 14;
  const erbijVandaag = Object.values(st.sinds).filter(d => d === vandaag).length;
  const erbij = [];
  for (const k of L.kandidaten) { if (lijst.length >= C.max || erbijVandaag + erbij.length >= C.nieuwPerDag) break; if (lijst.includes(k.zone) || recentUit(k.zone) || eruit.some(e => e.zone === k.zone) || !(k.per_1000_bezoeken > 0)) continue; erbij.push(k); lijst.push(k.zone); }
  return { ok: true, sleutel, aan: !!C.aan, campagne: String(C.campagne), project: C.project, land: C.land, lijst_nu: st.lijst, nieuwe_lijst: lijst, houden, eruit, testen, erbij: erbij.map(k => ({ zone: k.zone, per_1000_bezoeken: k.per_1000_bezoeken, kosten_per_aanmelding: k.kosten_per_aanmelding, lijkt_op: k.lijkt_op })), verandert: lijst.join(',') !== st.lijst.join(','), modelkwaliteit: L.modelkwaliteit, bijgewerkt: new Date().toISOString() };
}

// de uitvoerder meldt welke lijst echt op de campagne staat; pas dan schuift de stand door
export async function verkenGedaan(kv, sleutel, lijst, voorstel) {
  const C = (await verkenCfg(kv))[sleutel]; if (!C) return { ok: false };
  const st = (await kv.get('mm:verken:' + sleutel).catch(() => null)) || { campagne: C.campagne, lijst: C.start, sinds: Object.fromEntries(C.start.map(z => [z, C.startDag])), uit: {}, log: [] };
  const vandaag = dag(), nieuw = lijst.map(String);
  for (const z of nieuw) if (!st.lijst.includes(z)) st.sinds[z] = vandaag;
  for (const z of st.lijst) if (!nieuw.includes(z)) { st.uit[z] = vandaag; delete st.sinds[z]; }
  st.lijst = nieuw; st.log = [{ t: new Date().toISOString(), zones: nieuw.length, eruit: (voorstel && voorstel.eruit || []).map(x => x.zone), erbij: (voorstel && voorstel.erbij || []).map(x => x.zone) }, ...(st.log || [])].slice(0, 30);
  await kv.set('mm:verken:' + sleutel, st);
  return { ok: true, stand: st };
}
