// Kopersjacht per product (Henkjan 27 nov 2026, taak d4rc1s: "uit een berg verkeer de kenmerken van de koper vinden en dan jagen op dezelfde
// kenmerken of variaties daarop; bij de start een hypothese waar de koper zit"). Gebouwd 28 nov 2026. Drie delen:
//  1) hypothese per product als startkennis (data/jacht-priors.json, elke regel met bron); vervaagt naarmate eigen data binnenkomt;
//  2) kopersprofiel per product: gewogen uitkomsten (koop > checkout > koopklik > examen) tegen alle betaalde bezoeken, per kenmerk de lift;
//  3) jachtlijst: na elke koop of diepe stap jachtdoelen (exact en variaties), elk met reden, vertrouwen en verloopdatum, en een bodadvies.
// Alleen een voorstel: hjdk-api raakt geen campagne aan, schrijft nooit naar mm:blok en stuurt geen postback. De netwerkwacht (propellerads-mcp)
// of een oppakker voert uit, op een aparte campagne per lijn (nooit de witte lijst op de brede campagne, les 6 nov).
// Waar het meet: MyLevel-advertenties landen direct op mylevel.today (mm.js, geen /go). Het bezoek telt eenmaal (eerste meting in verwerkBeacon,
// r.eerste) en elke uitkomst eenmaal per bezoek en soort (paginaUitkomst, SET NX op mm:vfu). Dat is hier het precies-eenmaal-protocol;
// de u_/c_-markeringen van lib/omgeving.js horen bij /go-kliks en zijn voor deze bezoeken niet nodig. Alles loopt na het antwoord (laterAf).
// Product: het landingspad (mylevel.today/cdl-practice-test, /real-estate-practice-exam), anders de campagnenaam of de productsleutel van
// lib/segment.js (zpVan: wissel of campagnelijn, zoals "mylevel-push-real-estate-pass-pack-us"). Alleen producten uit PRODUCTEN tellen.
// Privacy (kop van lib/voorspel.js): geen IP, postcode of coordinaten; alleen afgeleide emmers (regio, koopkracht van het gebied, uur).
// Geen gevoelige kenmerken: niets over geslacht, afkomst, geloof of gezondheid; leeftijd alleen als leeftijd van het toestel.
// Opslag (zuinig, de database zit rond 69% van 1 GB):
//   mm:jacht:<dag> (15 dagen) een hash: "<product>|<kenmerk>=<waarde>|<n of uitkomst>", "<product>|_|<..>" totaal, "_m|..." controle
//   mm:jachtu (40 dagen, hoogstens 300) de diepe stappen zelf (product, soort, tijd, zone, subzone, toestelklasse, regio, uur) voor de jachtlijst
//   mm:vf:<vid> veld j (30 uur, de hash bestaat al) de kenmerken van het bezoek, zodat een latere uitkomst bij dezelfde waarden telt
import { readFileSync } from 'node:fs';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const paren = h => { const o = []; if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); else if (h && typeof h === 'object') for (const e of Object.entries(h)) o.push(e); return o; };
const dagVan = t => new Date(t || Date.now()).toISOString().slice(0, 10);
const norm = v => String(v == null ? '' : v).toLowerCase().replace(/[|;=\s]+/g, '-').replace(/[^a-z0-9_.:+<>()-]/g, '').slice(0, 40);
const TTL = 15 * 86400, U_TTL = 40 * 86400, U_MAX = 300, VF_TTL = 30 * 3600;
const BETAALD = new Set(['propeller', 'mondiad', 'richads', 'mgid', 'clickadu']); // zelfde als in lib/segment.js

// ---- producten ----
export const PRODUCTEN = {
  'mylevel-cdl': { naam: 'MyLevel CDL', site: 'ml', pagina: /(^|\/)cdl(-|\/|$)/, camp: /(^|[^a-z])cdl([^a-z]|$)/i },
  'mylevel-realestate': { naam: 'MyLevel real estate', site: 'ml', pagina: /(^|\/)real-estate/, camp: /real[\s_-]*estate/i }
};
export function productVan({ pg, camp, wissel } = {}) {
  const pad = String(pg || '').toLowerCase().replace(/^[^/]*/, '').split(/[?#]/)[0];
  for (const [id, p] of Object.entries(PRODUCTEN)) if (pad && p.pagina.test(pad)) return id;
  for (const s of [wissel, camp]) { const t = String(s || ''); if (!t || /^\d+$/.test(t)) continue; for (const [id, p] of Object.entries(PRODUCTEN)) if (p.camp.test(t)) return id; }
  return '';
}

// ---- 2. gewichten en grenzen ----
// LET OP: de gewichten zijn een hypothese (28 nov 2026): hoe dichter bij de koop, hoe zwaarder. Bijstellen hier, zodra er kopen zijn:
// het gewicht van een stap hoort ongeveer de kans te zijn dat die stap een koop wordt, gedeeld door die kans voor een koop (1).
export const GEWICHT = { koop: 10, checkout: 5, koopklik: 3, examen: 1 };
export const DIEP = ['koop', 'checkout', 'koopklik', 'examen'];
export const KENMERKEN = { zone: 'zone', sz: 'subzone', tk: 'toestelklasse', tl: 'leeftijd van het toestel', kk: 'koopkracht van het gebied', kks: 'koopkrachtscore', regio: 'regio', uur: 'uur bij de bezoeker', net: 'netwerk', app: 'app of browser', terug: 'nieuw of terugkomer' };
// KRIMP: zoveel schijnkliks op het productgemiddelde trekken een kleine waarde naar lift 1; WMIN: zoveel gewogen uitkomstpunten voor de eigen
// data volledig meetelt tegen de hypothese; MINKLIKS: ondergrens om een eigen lift te tonen of een zone als lijkt-op te noemen
export const JACHT = { krimp: 50, wmin: 20, minKliks: 30, dagen: 14, cache: 5 * 60e3 };
// hoe lang een stap jaagt, en hoe zwaar een variatie telt tegen exact
export const VERLOOP = { koop: 30, checkout: 21, koopklik: 14, examen: 7 };
export const VARIATIE = { exact: 1, 'andere-subzones': 0.6, 'uur-1': 0.7, 'uur-2': 0.5, 'vergelijkbare-regio': 0.5, 'lijkt-op-profiel': 0.4 };
export const GRENS = { perCampagnePerDag: 10, perSaldoPerDag: 100, factorMax: 1.3 };

// ---- 1. hypothese ----
let PRI = null;
export function priors() {
  if (PRI) return PRI;
  for (const p of [process.cwd() + '/data/jacht-priors.json', new URL('../data/jacht-priors.json', import.meta.url).pathname]) { try { const j = JSON.parse(readFileSync(p, 'utf8')); PRI = (j.regels || []).filter(geldigePrior); return PRI; } catch (e) {} }
  return [];
}
export const zetPriors = r => { PRI = r ? r.filter(geldigePrior) : null; }; // voor de test (null = opnieuw uit het bestand)
const GEVOELIG = /geslacht|gender|vrouw|man$|afkomst|etni|geloof|religi|gezond|ziekte|leeftijd$/i;
export function geldigePrior(r) {
  if (!r || !PRODUCTEN[r.product] || !KENMERKEN[r.kenmerk] || GEVOELIG.test(r.kenmerk) || !r.waarde) return false;
  const b = r.bron || {}; if (!(b.soort === 'https' && /^https:\/\//.test(b.url || '')) && !(b.soort === 'henkjan' && b.citaat) && !(b.soort === 'eigen' && b.citaat)) return false;
  return N(r.lift) > 0 && N(r.sterkte) > 0 && (r.richting === 'meer' ? N(r.lift) >= 1 : r.richting === 'minder' ? N(r.lift) <= 1 : false);
}
// Vervagen: de hypothese telt als m = sterkte schijnkliks met lift Lp; de eigen data als d = kliks x min(1, gewogen uitkomsten van het product / WMIN)
// met lift Ld. Samen: exp((m ln Lp + d ln Ld) / (m + d)). Aandeel hypothese = m / (m + d).
export function vervaag({ lp = 1, m = 0, ld = 1, d = 0 }) {
  if (m + d <= 0) return { lift: 1, hypothese: 0 };
  return { lift: Math.exp((m * Math.log(Math.max(lp, 1e-6)) + d * Math.log(Math.max(ld, 1e-6))) / (m + d)), hypothese: m / (m + d) };
}
// lift met krimp: (w + k p0) / (n + k) gedeeld door p0
export function liftKrimp(w, n, p0, k = JACHT.krimp) { return p0 > 0 ? ((w + k * p0) / (n + k)) / p0 : 1; }
export function wilson(k, n, z = 1.96) { if (!n) return [0, 1]; const p = Math.min(1, k / n), d = 1 + z * z / n, m = (p + z * z / (2 * n)) / d, w = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [Math.max(0, m - w), Math.min(1, m + w)]; }

// ---- tellen (na het antwoord) ----
const uurBij = (tz, t) => { try { const h = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(new Date(t)); const n = Number(h); return Number.isFinite(n) ? String(n % 24).padStart(2, '0') : ''; } catch (e) { return ''; } };
// kenmerken van een bezoek uit wat de mensmeter al afleidde (f = serverVoorspellers + browserVoorspellers)
export function kenmerken({ net, zone, sz, f = {}, tz, t, kk = '', kks = '', tl = '', terug = '' }) {
  const o = { zone: norm(net) + ':' + norm(zone), net: norm(net) };
  if (sz && sz !== '-') o.sz = norm(sz).slice(0, 30);
  const os = norm(f.os); if (os) o.tk = os + (os === 'android' && f.merk ? '-' + norm(f.merk) : '');
  if (tl) o.tl = norm(tl); if (kk) o.kk = norm(kk); if (kks) o.kks = norm(kks);
  if (f.regio) o.regio = norm(f.regio);
  const u = uurBij(tz, t || Date.now()); if (u) o.uur = u;
  if (f.app) o.app = norm(f.app); if (terug) o.terug = norm(terug);
  return o;
}
const telVelden = (p, km, u, n = 1) => [[p + '|_|' + u, n], ...Object.entries(km).map(([k, v]) => [p + '|' + k + '=' + v + '|' + u, n])];
const hinc = (k, velden) => velden.map(([f, n]) => ['HINCRBY', k, f, n]).concat([['EXPIRE', k, TTL]]);

// Een betaald bezoek op een productpagina (lib/mensmeter.js verwerkBeacon, eerste meting). b = { vid, net, zone, camp, sub, pg, f, srv: { tz, land, pc } }
export async function bezoek(kv, b, { tabel } = {}) {
  const D = dagVan(), k = 'mm:jacht:' + D, t = Date.now();
  const p = productVan({ pg: b.pg, camp: b.camp });
  if (!p) { await kv.raw(['HINCRBY', k, '_m|onbekend_product', 1]).catch(() => {}); return null; }
  if (!BETAALD.has(String(b.net)) || !b.zone || b.zone === '-') { await kv.raw(['HINCRBY', k, '_m|' + p + '|onbetaald', 1]).catch(() => {}); return null; }
  const s = b.srv || {}, f = b.f || {}, land = String(s.land || '').toLowerCase();
  let kk = '', kks = '';
  try { if ((land === 'us' || land === 'nl') && s.pc) { const O = await import('./omgeving.js'); kk = O.koopkracht(land, s.pc, tabel || await import('./koopkracht-tabel.js')); } } catch (e) {}
  try { const S = await import('./segment.js'); kks = S.kksBereken({ a: { os: f.os, iosv: f.iosv }, b: { con: f.con }, o: { koopkracht: kk } }).kks; } catch (e) {}
  const km = kenmerken({ net: b.net, zone: b.zone, sz: b.sub, f, tz: s.tz, t, kk, kks });
  const j = JSON.stringify({ p, c: String(b.camp || '-').slice(0, 20), km });
  await Promise.all([...hinc(k, telVelden(p, km, 'n')), ['HINCRBY', k, '_m|' + p + '|bezoek', 1], ['HSET', k, '_m|' + p + '|laatst', t], ['HSET', 'mm:vf:' + b.vid, 'j', j], ['EXPIRE', 'mm:vf:' + b.vid, VF_TTL]].map(x => kv.raw(x)));
  return { p, km };
}
// 51Degrees komt later binnen: de leeftijd van het toestel telt dan alleen nog bij het bezoek (en bij uitkomsten die daarna komen)
export async function toestelLeeftijd(kv, vid, tjaar) {
  if (!tjaar) return; const r = await kv.raw(['HGET', 'mm:vf:' + vid, 'j']).catch(() => null); if (!r) return;
  let j; try { j = JSON.parse(r); } catch (e) { return; } if (j.km.tl) return;
  j.km.tl = norm(tjaar); const D = dagVan(), k = 'mm:jacht:' + D;
  await Promise.all([['HINCRBY', k, j.p + '|tl=' + j.km.tl + '|n', 1], ['EXPIRE', k, TTL], ['HSET', 'mm:vf:' + vid, 'j', JSON.stringify(j)]].map(x => kv.raw(x)));
}
// Een uitkomst van dat bezoek (lib/mensmeter.js paginaUitkomst, al precies eenmaal per bezoek en soort). Telt op de dag van de uitkomst.
export async function uitkomst(kv, { vid, soort, t = Date.now() }) {
  if (!DIEP.includes(soort)) return null;
  const D = dagVan(t), k = 'mm:jacht:' + D;
  const r = await kv.raw(['HGET', 'mm:vf:' + vid, 'j']).catch(() => null);
  let j = null; try { j = r ? JSON.parse(r) : null; } catch (e) {}
  if (!j || !PRODUCTEN[j.p]) { await kv.raw(['HINCRBY', k, '_m|zonder_bezoek_' + soort, 1]).catch(() => {}); return null; }
  const km = j.km || {}, [net, zone] = String(km.zone || ':').split(':');
  const ev = { t, p: j.p, s: soort, net, zone, sz: km.sz || '-', tk: km.tk || '', regio: km.regio || '', uur: km.uur || '', c: j.c || '-' };
  await Promise.all([...hinc(k, telVelden(j.p, km, soort)), ['HINCRBY', k, '_m|' + j.p + '|uit_' + soort, 1], ['LPUSH', 'mm:jachtu', JSON.stringify(ev)], ['LTRIM', 'mm:jachtu', 0, U_MAX - 1], ['EXPIRE', 'mm:jachtu', U_TTL]].map(x => kv.raw(x)));
  CACHE.clear();
  return ev;
}

// ---- 2. kopersprofiel ----
const CACHE = new Map();
async function lees(kv, dagen) {
  const D = Array.from({ length: dagen }, (_, i) => dagVan(Date.now() - i * 864e5));
  return { D, hs: await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:jacht:' + d]).catch(() => null))) };
}
export function profielUit(hs, product, pri = priors()) {
  const T = { n: 0 }, V = {}; // V[kenmerk][waarde] = { n, examen, ... }
  for (const h of hs) for (const [fld, v] of paren(h)) {
    if (fld.startsWith('_m|')) continue; const a = fld.split('|'); if (a.length !== 3 || a[0] !== product) continue;
    const [, kw, u] = a;
    if (kw === '_') { T[u] = N(T[u]) + N(v); continue; }
    const i = kw.indexOf('='); if (i < 1) continue; const km = kw.slice(0, i), w = kw.slice(i + 1);
    const x = ((V[km] || (V[km] = {}))[w] || (V[km][w] = { n: 0 })); x[u] = N(x[u]) + N(v);
  }
  const gw = x => DIEP.reduce((s, u) => s + GEWICHT[u] * N(x[u]), 0), stappen = x => DIEP.reduce((s, u) => s + N(x[u]), 0);
  const W = gw(T), K = stappen(T), p0 = T.n ? W / T.n : 0, q0 = T.n ? Math.min(1, K / T.n) : 0, vertrouwData = Math.min(1, W / JACHT.wmin);
  const P = pri.filter(r => r.product === product), kenm = [];
  for (const km of Object.keys(KENMERKEN)) {
    const rij = [], pk = P.filter(r => r.kenmerk === km), waarden = new Set([...Object.keys(V[km] || {}), ...pk.map(r => r.waarde)]);
    for (const w of waarden) {
      const x = (V[km] || {})[w] || { n: 0 }, pr = pk.find(r => r.waarde === w);
      const ld = W > 0 ? liftKrimp(gw(x), x.n, p0) : 1, d = W > 0 ? x.n * vertrouwData : 0, m = pr ? N(pr.sterkte) : 0;
      const sam = vervaag({ lp: pr ? N(pr.lift) : 1, m, ld, d });
      const [lo, hi] = wilson(stappen(x), x.n);
      rij.push({ waarde: w, kliks: x.n, stappen: stappen(x), gewogen: gw(x), ...Object.fromEntries(DIEP.filter(u => x[u]).map(u => [u, x[u]])),
        liftData: W > 0 && x.n >= JACHT.minKliks ? r2(ld) : null, marge: W > 0 && x.n >= JACHT.minKliks && q0 > 0 ? [r2(lo / q0), r2(hi / q0)] : null,
        hypothese: pr ? { lift: N(pr.lift), richting: pr.richting, sterkte: N(pr.sterkte), bron: pr.bron } : null,
        lift: r2(sam.lift), aandeelHypothese: Math.round(sam.hypothese * 100), aandeelData: m + d > 0 ? 100 - Math.round(sam.hypothese * 100) : 0 });
    }
    rij.sort((a, b) => b.lift - a.lift || b.kliks - a.kliks);
    if (rij.length) kenm.push({ kenmerk: km, label: KENMERKEN[km], waarden: rij.slice(0, 40), meer: Math.max(0, rij.length - 40) });
  }
  return { product, naam: PRODUCTEN[product] ? PRODUCTEN[product].naam : product, kliks: T.n, gewogen: W, stappen: Object.fromEntries(DIEP.map(u => [u, N(T[u])])), gemiddeld: r3(p0), dataTelt: Math.round(vertrouwData * 100), hypotheseRegels: P.length, kenmerken: kenm };
}
const r2 = x => Math.round(x * 100) / 100, r3 = x => Math.round(x * 1000) / 1000;

// ---- 3. jachtdoelen ----
// ev = een diepe stap uit mm:jachtu; prof = profielUit van dat product (voor vergelijkbare regio's en zones die op het profiel lijken)
export function doelenUit(evs, prof, nu = Date.now()) {
  const M = new Map();
  const zet = (sl, d, v, reden) => { const o = M.get(sl); if (o) { o.vertrouwen = Math.min(1, r2(o.vertrouwen + v)); o.redenen.push(reden); o.verloopt = o.verloopt > d.verloopt ? o.verloopt : d.verloopt; } else M.set(sl, Object.assign(d, { vertrouwen: r2(Math.min(1, v)), redenen: [reden] })); };
  const top = km => ((prof && prof.kenmerken.find(k => k.kenmerk === km)) || { waarden: [] }).waarden;
  const regios = top('regio').filter(x => x.lift >= 1.2).slice(0, 5).map(x => x.waarde);
  const zones = top('zone').filter(x => x.liftData != null && x.marge && x.marge[0] > 1).slice(0, 10);
  for (const e of evs) {
    if (!DIEP.includes(e.s) || !e.zone) continue;
    const leeftijd = (nu - N(e.t)) / 864e5, dur = VERLOOP[e.s]; if (leeftijd < 0 || leeftijd >= dur) continue;
    const basis = GEWICHT[e.s] / GEWICHT.koop * (1 - leeftijd / dur), verloopt = dagVan(N(e.t) + dur * 864e5);
    const reden = e.s + ' op ' + dagVan(e.t) + ' (gewicht ' + GEWICHT[e.s] + ')', z = e.net + ':' + e.zone, b = { net: e.net, zone: e.zone, camp: e.c, uitkomst: e.s };
    zet(['exact', z, e.sz, e.tk, e.regio, e.uur].join('|'), Object.assign({ soort: 'exact', sz: e.sz, tk: e.tk, regio: e.regio, uur: e.uur, verloopt }, b), basis * VARIATIE.exact, reden);
    if (e.sz && e.sz !== '-') zet(['andere-subzones', z].join('|'), Object.assign({ soort: 'andere-subzones', sz: '*', verloopt }, b), basis * VARIATIE['andere-subzones'], reden + ', zelfde zone met andere subzones');
    if (e.uur !== '') for (const dx of [-2, -1, 1, 2]) { const u = String((N(e.uur) + dx + 24) % 24).padStart(2, '0'); zet(['uur', z, e.sz, u].join('|'), Object.assign({ soort: 'uur' + (dx < 0 ? dx : '+' + dx), sz: e.sz, uur: u, verloopt }, b), basis * VARIATIE[Math.abs(dx) === 1 ? 'uur-1' : 'uur-2'], reden + ', ' + Math.abs(dx) + ' uur ' + (dx < 0 ? 'eerder' : 'later')); }
    for (const r of regios) if (r !== e.regio) zet(['regio', z, e.tk, r].join('|'), Object.assign({ soort: 'vergelijkbare-regio', tk: e.tk, regio: r, verloopt }, b), basis * VARIATIE['vergelijkbare-regio'], reden + ', zelfde toestelklasse in ' + r + ' (lift ' + (top('regio').find(x => x.waarde === r) || {}).lift + ')');
    for (const x of zones) if (x.waarde !== z) { const [n2, z2] = x.waarde.split(':'); zet(['lijkt', x.waarde].join('|'), { soort: 'lijkt-op-profiel', net: n2, zone: z2, camp: e.c, uitkomst: e.s, verloopt }, basis * VARIATIE['lijkt-op-profiel'], 'zone lijkt op het kopersprofiel (lift ' + x.liftData + ', ondergrens ' + x.marge[0] + ') na ' + reden); }
  }
  return [...M.values()].sort((a, b) => b.vertrouwen - a.vertrouwen);
}
// Bodadvies: nooit uitgevoerd. Hoger alleen met een koop (omzet) eronder: de regel in propellerads-mcp weigert een hoger bod zonder omzet.
export function bodAdvies(doel) {
  const uit = doel.redenen || [], koop = uit.some(r => /^koop /.test(r));
  return { richting: koop ? 'hoger' : 'gelijk', factor: koop ? r2(Math.min(GRENS.factorMax, 1 + 0.3 * doel.vertrouwen)) : 1, gedragenDoor: uit, omzet: koop,
    grens: 'hoogstens $' + GRENS.perCampagnePerDag + ' per dag per campagne en $' + GRENS.perSaldoPerDag + ' per dag per saldo zonder gegarandeerde omzet',
    waarom: koop ? 'een koop is omzet: een hoger bod binnen de grens mag' : 'nog geen koop onder dit doel: alleen op de witte lijst, geen hoger bod (propellerads-mcp weigert een hoger bod zonder omzet)' };
}

// ---- alles voor een product ----
export async function jacht(kv, { product = '', dagen = JACHT.dagen, vers = false } = {}) {
  dagen = Math.max(1, Math.min(15, Math.round(N(dagen)) || JACHT.dagen));
  const ck = product + '|' + dagen, oud = CACHE.get(ck); if (!vers && oud && Date.now() - oud.t < JACHT.cache) return oud.r;
  const [{ hs }, lu] = await Promise.all([lees(kv, dagen), kv.raw(['LRANGE', 'mm:jachtu', 0, U_MAX - 1]).catch(() => null)]);
  const evs = (Array.isArray(lu) ? lu : []).map(s => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(Boolean);
  const ids = product ? [product].filter(p => PRODUCTEN[p]) : Object.keys(PRODUCTEN);
  const producten = ids.map(p => { const prof = profielUit(hs, p); const doelen = doelenUit(evs.filter(e => e.p === p), prof).map(d => Object.assign(d, { bod: bodAdvies(d) })); return Object.assign(prof, { doelen: doelen.slice(0, 100), stappenLijst: evs.filter(e => e.p === p).slice(0, 20) }); });
  const r = { ok: true, voorstel: true, dagen, bijgewerkt: new Date().toISOString(), gewichten: GEWICHT, verloopDagen: VERLOOP, variatie: VARIATIE, grens: GRENS, producten };
  CACHE.set(ck, { t: Date.now(), r }); return r;
}
// JSON voor de netwerkwacht, zelfde soort vorm als /api/mm/bewezen: per product een aparte campagne met een witte lijst en bodadvies per zone
export function voorNet(r, net = 'propeller') {
  const lijnen = r.producten.map(p => {
    const Z = new Map();
    for (const d of p.doelen) { if (d.net !== net || !/^\d{1,12}$/.test(String(d.zone))) continue; const z = Z.get(d.zone) || { zone: d.zone, vertrouwen: 0, soorten: [], uren: [], regios: [], subzones: [], redenen: [], verloopt: d.verloopt };
      z.vertrouwen = Math.max(z.vertrouwen, d.vertrouwen); if (!z.soorten.includes(d.soort)) z.soorten.push(d.soort); if (d.uur && !z.uren.includes(d.uur)) z.uren.push(d.uur); if (d.regio && !z.regios.includes(d.regio)) z.regios.push(d.regio); if (d.sz && d.sz !== '-' && d.sz !== '*' && !z.subzones.includes(d.sz)) z.subzones.push(d.sz);
      for (const x of d.redenen) if (!z.redenen.includes(x)) z.redenen.push(x); if (d.verloopt > z.verloopt) z.verloopt = d.verloopt; Z.set(d.zone, z); }
    const zones = [...Z.values()].map(z => Object.assign(z, { bod: bodAdvies(z) })).sort((a, b) => b.vertrouwen - a.vertrouwen);
    return { product: p.product, naam: p.naam, aparteCampagne: true, campagnes: [...new Set(p.stappenLijst.map(e => e.c).filter(c => c && c !== '-'))], witteLijst: zones.map(z => z.zone), zones, kliks: p.kliks, gewogen: p.gewogen };
  });
  return { ok: true, voorstel: true, net, bijgewerkt: r.bijgewerkt, regels: ['alleen een voorstel: hjdk-api voert niets uit', 'een aparte campagne per lijn, nooit de witte lijst op de brede campagne (les 6 nov)', 'hoger bod alleen met een koop eronder en binnen ' + bodAdvies({ vertrouwen: 0 }).grens, 'een doel vervalt op zijn verloopdatum'], lijnen };
}

// ---- controle ----
// per product: bezoeken, gewogen uitkomsten, jachtdoelen, leeftijd van het profiel; hardop bij een meetgat en bij een hypothese zonder diepe stap in 7 dagen
export async function stand(kv, { r = null } = {}) {
  r = r || await jacht(kv, { dagen: 7 });
  const D = dagVan(), [h, vs] = await Promise.all([kv.raw(['HGETALL', 'mm:jacht:' + D]).catch(() => null), kv.raw(['HGET', 'mm:vs:' + D, 'pml|net=propeller|n']).catch(() => null)]);
  const m = {}; for (const [k, v] of paren(h)) if (k.startsWith('_m|')) m[k.slice(3)] = v;
  const pri = priors(), alarm = [];
  const prod = r.producten.map(p => {
    const vandaag = N(m[p.product + '|bezoek']), laatst = N(m[p.product + '|laatst']), stap = DIEP.reduce((s, u) => s + N(p.stappen[u]), 0);
    const x = { product: p.product, naam: p.naam, bezoekenVandaag: vandaag, kliks7d: p.kliks, gewogen7d: p.gewogen, stappen7d: p.stappen, jachtdoelen: p.doelen.length, hypotheseRegels: p.hypotheseRegels, profielLeeftijdMin: laatst ? Math.round((Date.now() - laatst) / 60000) : null };
    if (p.hypotheseRegels && !stap) alarm.push(p.naam + ': wel een hypothese, maar geen diepe stap (examen, koopklik, checkout, koop) in 7 dagen' + (p.kliks ? ' bij ' + p.kliks + ' betaalde bezoeken' : ' en geen betaalde bezoeken'));
    return x;
  });
  const mlVandaag = N(vs), jachtVandaag = prod.reduce((s, x) => s + x.bezoekenVandaag, 0);
  if (mlVandaag >= 10 && !jachtVandaag) alarm.push('MEETGAT: ' + mlVandaag + ' betaalde MyLevel-bezoeken vandaag (mm:vs pml) maar 0 in de tellers per product: kijk of de haak in verwerkBeacon loopt en of het landingspad bij PRODUCTEN past');
  if (!pri.length) alarm.push('hypothese niet geladen: data/jacht-priors.json ontbreekt in de uitrol (vercel.json includeFiles)');
  const zonder = Object.entries(m).filter(([k]) => k.startsWith('zonder_bezoek_')).reduce((s, [, v]) => s + N(v), 0);
  if (zonder) alarm.push(zonder + ' uitkomsten vandaag zonder bekend bezoek (ouder dan 30 uur of geen productpagina)');
  return { ok: true, dag: D, mylevelBetaaldVandaag: mlVandaag, onbekendProduct: N(m.onbekend_product), zonderBezoek: zonder, producten: prod, alarm, goed: !alarm.length };
}
export function standTekst(s) {
  if (!s) return '';
  return 'Kopersjacht (' + s.dag + '): ' + s.producten.map(p => p.naam + ' ' + p.bezoekenVandaag + ' bezoeken vandaag, ' + p.kliks7d + ' in 7 dagen, ' + p.gewogen7d + ' gewogen uitkomstpunten, ' + p.jachtdoelen + ' jachtdoelen' + (p.profielLeeftijdMin != null ? ', laatste bezoek ' + p.profielLeeftijdMin + ' min geleden' : '')).join('; ')
    + '. ' + (s.alarm.length ? 'LET OP: ' + s.alarm.join('; ') : 'Geen meetgat.');
}

// ---- leesbare pagina ----
const fmt = x => String(x).replace('.', ',');
export function tekst(r, st) {
  const L = ['KOPERSJACHT PER PRODUCT (Clickmind, voorstel: er verandert geen campagne)', '',
    'Hoe het werkt: elke betaalde klik op een productpagina telt met zijn kenmerken. Elke stap naar de koop telt zwaarder naarmate hij dichter bij de koop is: koop ' + GEWICHT.koop + ', checkout ' + GEWICHT.checkout + ', koopklik ' + GEWICHT.koopklik + ', examen ' + GEWICHT.examen + ' (een hypothese, bij te stellen zodra er kopen zijn). Per kenmerk staat de lift: 2 is twee keer zoveel koopgedrag als gemiddeld. Bij de start leunt alles op de hypothese met bron; elke eigen klik met uitkomsten neemt een deel over.',
    'Na elke diepe stap volgen jachtdoelen: exact (zelfde zone, subzone, toestel, regio en uur) en variaties (andere subzones, een of twee uur eerder of later, vergelijkbare regio, zones die op het profiel lijken). Een doel vervalt: koop na ' + VERLOOP.koop + ' dagen, checkout ' + VERLOOP.checkout + ', koopklik ' + VERLOOP.koopklik + ', examen ' + VERLOOP.examen + '.', ''];
  if (st) { L.push('Controle: ' + standTekst(st), ''); }
  for (const p of r.producten) {
    L.push('== ' + p.naam + ' (' + r.dagen + ' dagen) ==');
    L.push('Eigen data: ' + p.kliks + ' betaalde bezoeken, ' + DIEP.map(u => p.stappen[u] + ' ' + u).join(', ') + ' (' + p.gewogen + ' gewogen punten). ' + (p.gewogen ? 'De eigen data telt voor ' + p.dataTelt + '% mee.' : 'Nog geen enkele stap naar de koop: het profiel leunt helemaal op de hypothese.'));
    const reg = p.kenmerken.find(k => k.kenmerk === 'regio'), hyp = reg ? reg.waarden.filter(w => w.hypothese) : [];
    if (hyp.length) { L.push('Hypothese (waar de koper zit):'); for (const w of hyp) L.push('  ' + w.waarde.toUpperCase() + ': ' + w.hypothese.richting + ', lift ' + fmt(w.hypothese.lift) + ' volgens ' + w.hypothese.bron.url + ' ("' + w.hypothese.bron.citaat + '", gelezen ' + w.hypothese.bron.gelezen + '); nu lift ' + fmt(w.lift) + ', ' + w.aandeelHypothese + '% hypothese, ' + w.aandeelData + '% eigen data, ' + w.kliks + ' kliks'); }
    L.push('Wat de eigen data zegt:');
    let iets = false;
    for (const k of p.kenmerken) { const w = k.waarden.filter(x => x.liftData != null); if (!w.length) continue; iets = true; L.push('  ' + k.label + ': ' + w.slice(0, 6).map(x => x.waarde + ' lift ' + fmt(x.liftData) + (x.marge ? ' (marge ' + fmt(x.marge[0]) + ' tot ' + fmt(x.marge[1]) + ')' : '') + ', ' + x.kliks + ' kliks, ' + x.stappen + ' stappen').join('; ')); }
    if (!iets) L.push('  nog niets: een eigen lift staat er pas bij minstens ' + JACHT.minKliks + ' kliks op een waarde en minstens een stap naar de koop bij het product.' + (p.kliks ? ' Meeste kliks nu: ' + p.kenmerken.filter(k => ['zone', 'regio', 'tk'].includes(k.kenmerk)).map(k => k.label + ' ' + k.waarden.slice().sort((a, b) => b.kliks - a.kliks).slice(0, 3).map(x => x.waarde + ' (' + x.kliks + ')').join(', ')).join('; ') : ''));
    L.push('Jachtlijst: ' + (p.doelen.length ? p.doelen.length + ' doelen' : 'leeg, er is nog geen diepe stap om op te jagen'));
    for (const d of p.doelen.slice(0, 25)) L.push('  ' + d.soort + ' ' + d.net + ' zone ' + d.zone + (d.sz && d.sz !== '-' ? ' subzone ' + d.sz : '') + (d.tk ? ', ' + d.tk : '') + (d.regio ? ', ' + d.regio : '') + (d.uur ? ', uur ' + d.uur : '') + ': vertrouwen ' + fmt(d.vertrouwen) + ', tot ' + d.verloopt + '. Waarom: ' + d.redenen.slice(0, 3).join('; ') + '. Bod: ' + d.bod.richting + (d.bod.factor !== 1 ? ' x' + fmt(d.bod.factor) : '') + ' (' + d.bod.waarom + ')');
    L.push('');
  }
  L.push('Bod en budget: alleen advies, ' + bodAdvies({ vertrouwen: 0 }).grens + '. Uitvoeren doet de netwerkwacht op een aparte campagne per lijn: /api/mm?op=jacht&net=propeller.');
  return L.join('\n');
}
