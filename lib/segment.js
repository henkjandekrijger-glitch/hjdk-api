// Segmenten per product (Henkjan 27 nov 2026, taak dnhwt6: "alleen mannen of vrouwen, koopkrachtig of niet, product zijn doelgroep laten
// vinden"). Vier delen, alles inert tot iemand het instelt:
//  1) koopkrachtscore per klik (kks: hoog, midden, laag) uit vaste punten per signaal, eenmaal per klik vastgezet en als voorspeller geteld;
//  2) segmentconversie: een wissel met pb en pbseg meldt alleen kliks binnen dat segment als conversie aan het netwerk;
//  3) zoneprofiel per product en segment: welke zones dat segment met uitkomsten leveren (alleen data en voorstel, nooit een lijst);
//  4) "Voor wie zoek je?": een tik van de bezoeker zelf (voor mij, voor haar, voor hem) als segment van zijn klik. Nooit afgeleid.
// Geen gevoelige kenmerken: niets over gezondheid, geloof, afkomst, en geslacht wordt nooit geschat; voor-haar en voor-hem komen alleen uit
// de eigen tik van de bezoeker, en zeggen voor wie hij zoekt, niet wie hij is.
// Privacy (kop van lib/voorspel.js): geen postcode, IP of coordinaten; alleen de afgeleide emmers die al bij de klik staan.
// Opslag (alles met houdbaarheid):
//   mm:vf:<cid> (30 uur, bestaat al) velden kks (vaste score of '-'), zp (product|netwerk|zone|subzone), pbw_<soort> (postback wacht op de
//     score), pbc_<soort> (beslist, precies eenmaal)
//   mm:cid:<cid> (7 dagen, bestaat al) velden pbg (segment van de wissel) en vw (tik voor wie)
//   mm:seg:<dag> (15 dagen) controle: scores, verdeling, segmentpostbacks en tikken per dag
//   mm:segz:<dag> (15 dagen) zoneprofiel: "product|segment|netwerk|zone|subzone|uitkomst", alleen betaalde zones
import { vfLees } from './voorspel.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const paren = h => { const o = []; if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); else if (h && typeof h === 'object') for (const e of Object.entries(h)) o.push(e); return o; };
const dagVan = t => new Date(t || Date.now()).toISOString().slice(0, 10);
const TTL = 15 * 86400, VF_TTL = 30 * 3600;
// zelfde schoonmaak als vfTekst in lib/voorspel.js: werkt op de ruwe waarde en op wat al in mm:vf staat
const norm = v => String(v == null ? '' : v).toLowerCase().replace(/[|;=\s]+/g, '-').replace(/[^a-z0-9_.:+<>()-]/g, '');

export const VOORWIE = ['voor-mij', 'voor-haar', 'voor-hem'];
export const SEGMENTEN = ['kk-hoog', 'kk-midden', 'kk-laag', ...VOORWIE];
export const UIT4 = ['echt', 'actie', 'aanmelding', 'koop'];
const BETAALD = new Set(['propeller', 'mondiad', 'richads', 'mgid', 'clickadu']); // de betaalde netwerken uit NET in lib/mensmeter.js

// ---- 1. koopkrachtscore ----
// LET OP: de punten en grenzen hieronder zijn een eerste hypothese (28 nov 2026), geen bewezen kennis. De lessen moeten ze bevestigen:
// /api/mm/voorspel toont per kks-waarde hoe vaak echt, actie, aanmelding en koop voorkomen; past dat niet bij hoog > midden > laag,
// dan gaan de punten om, niet de lessen.
// Vier groepen, elk hoogstens -2 tot +2; een groep telt als signaal als er een bekende waarde is. Minder dan twee signalen: geen score.
export const KKS = { hoog: 3, laag: -2, minSignalen: 2, wachtB: 4000, vers: 60000 };
export const PUNTEN = {
  // koopkracht van het postcodegebied (lib/omgeving.js, veld o; nu alleen VS)
  koopkracht: { '1-laagste-20': -2, '2-onder-midden': -1, '3-midden': 0, '4-boven-midden': 1, '5-hoogste-20': 2 },
  // iOS of Android (os bij de klik; desktop: mac telt als iOS, windows en linux neutraal)
  platform: { ios: 1, mac: 1, android: -1, windows: 0, linux: 0 },
  // toestel: leeftijd uit 51Degrees (tjaar, veld b), plus of min een punt voor het soort model (toestel uit 51Degrees, anders n_device van het netwerk),
  // en als terugval een oude iOS-versie (iOS 15 of ouder draait alleen op oude iPhones; nieuwere iOS zegt niets, Safari bevriest de versie)
  tjaar: { '0-1-jaar-oud': 2, '2-3-jaar-oud': 1, '4-5-jaar-oud': -1, '6+-jaar-oud': -2 },
  duur: /(^|-)(pro|ultra|max|fold|flip|plus)(-|$)|iphone-1[5-9]|pixel-(8|9|1\d)/,
  goedkoop: /galaxy-a0|galaxy-a1[0-6]|sm-a0|sm-a1[0-6]|moto-e|moto-g-(play|pure|power)|redmi|poco-c|tcl|(^|-)onn(-|$)|(^|-)blu(-|$)|revvl|nokia-c|zte|alcatel|itel|tecno/,
  // verbinding: wifi (vaak thuis-internet) tegen mobiel, traag mobiel een punt eraf (con uit de browser, anders n_conn van het netwerk)
  verbinding: { wifi: 1, ethernet: 1, broadband: 1, cable: 1, dsl: 1, 'mobiel-netwerk': 0, 'mobiel-4g': 0, '4g': 0, mobile: 0, cellular: 0, carrier: 0, 'mobiel-3g': -1, 'mobiel-2g': -1, 'mobiel-slow-2g': -1, '3g': -1, '2g': -1, 'slow-2g': -1 }
};
const toestelPunt = s => { s = norm(s); if (!s) return null; return PUNTEN.duur.test(s) ? 1 : PUNTEN.goedkoop.test(s) ? -1 : 0; };
const begrens = x => Math.max(-2, Math.min(2, x));

// a = servervoorspellers van de klik (os, iosv, n_device, n_conn), b = browser (con, toestel, tjaar), o = omgeving (koopkracht). Puur en uitlegbaar.
export function kksBereken({ a = {}, b = {}, o = {} } = {}) {
  const p = {};
  const kk = PUNTEN.koopkracht[norm(o.koopkracht)]; if (kk != null) p.koopkracht = kk;
  const pl = PUNTEN.platform[norm(a.os)]; if (pl != null) p.platform = pl;
  { const tj = PUNTEN.tjaar[norm(b.tjaar)], md = toestelPunt(b.toestel) ?? (b.toestel ? null : toestelPunt(a.n_device)), iv = /^ios(\d+)$/.exec(norm(a.iosv));
    if (tj != null || (md != null && md !== 0)) p.toestel = begrens(N(tj) + N(md)); // een gewoon model zonder leeftijd is geen signaal (n_device is vaak alleen 'phone')
    else if (iv && N(iv[1]) <= 15) p.toestel = -1; }
  { const c = norm(b.con), v = PUNTEN.verbinding[c] ?? (c ? null : PUNTEN.verbinding[norm(a.n_conn)]); if (v != null) p.verbinding = v; }
  const signalen = Object.keys(p).length, som = Object.values(p).reduce((s, x) => s + x, 0);
  const kks = signalen < KKS.minSignalen ? '' : som >= KKS.hoog ? 'hoog' : som <= KKS.laag ? 'laag' : 'midden';
  return { kks, som, signalen, punten: p };
}

// product van een klik: de wissel, anders de campagnelijn; alleen voor betaalde zones (zone niet '-'), anders leeg
const prodSchoon = s => String(s || '').toLowerCase().replace(/[^a-z0-9_.:-]/g, '').slice(0, 40);
export function zpVan({ wissel, camp, net, zone, sz }) {
  const p = prodSchoon(wissel) || prodSchoon(camp); zone = String(zone || '-');
  if (!p || p === '-' || !BETAALD.has(String(net)) || zone === '-' || !zone) return '';
  return [p, net, zone.slice(0, 40), String(sz || '-').replace(/\|/g, '').slice(0, 30) || '-'].join('|');
}

// Het moment van de score (28 nov 2026). De bouwstenen komen op verschillende momenten: a bij de klik, o een paar seconden later
// (lib/omgeving.js), b alleen als de meetpagina laadt (js-arm, en 51Degrees nog iets later) en bij de 302-arm nooit. Gekozen: de score
// wordt eenmaal vastgezet in de late verwerking van de klik (verwerkO, na het antwoord, nooit afgewacht door de klik), op het moment dat
// o bekend is. Bij een js-klik wacht die late taak tot KKS.wachtB (4 s) na de klik, zodat de meetpagina en meestal ook 51Degrees binnen
// zijn; bij een 302-klik wacht hij niet. Wat later binnenkomt telt niet meer mee: de score verandert nooit, zodat de klik en elke latere
// uitkomst onder dezelfde waarde vallen. De score gaat mee in veld o en telt zo via het precies-eenmaal-protocol van lib/omgeving.js.
export async function kksMoment(kv, a, o, { wachtB = KKS.wachtB, slaap = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  const t = N(a.t) || Date.now();
  if (a.uit && N(a.uit.js) === 1) { const rest = wachtB - (Date.now() - t); if (rest > 0) await slaap(Math.min(rest, wachtB)); }
  const b = vfLees(await kv.raw(['HGET', 'mm:vf:' + a.cid, 'b']).catch(() => null));
  return kksBereken({ a: a.vf || {}, b, o });
}
// controle en zoneprofiel bij het vastzetten: verdeling vandaag en de klik in mm:segz op de dag van de klik
export function vastCmds(a, kks) {
  const od = 'mm:seg:' + dagVan(), c = [['HINCRBY', od, 'klik', 1], ['HINCRBY', od, 'kks_' + (kks || 'onbekend'), 1], ['EXPIRE', od, TTL]];
  if (kks && a.zp) c.push(...segzCmds(a.D || dagVan(a.t), a.zp, 'kk-' + kks, 'n'));
  return c;
}
export function segzCmds(D, zp, seg, u) {
  if (!zp || !seg) return []; const k = 'mm:segz:' + D, [p, net, zone, sz] = String(zp).split('|');
  return [['HINCRBY', k, [p, seg, net, zone, sz || '-', u].join('|'), 1], ['EXPIRE', k, TTL]];
}
// een uitkomst bij het kk-segment van de klik (aangeroepen binnen het precies-eenmaal-protocol van lib/omgeving.js, dus nooit dubbel)
export function uitSegz(D, zp, o, soort) { if (!UIT4.includes(soort) || !zp) return []; const kks = vfLees(o).kks; return kks ? segzCmds(D, zp, 'kk-' + kks, soort) : []; }

// ---- 2. segmentconversie ----
// Poort voor de postback van een wissel met pbseg (lib/wissel.js uitkomst). Uitkomst: in, buiten, onbekend, wacht of dubbel.
// kk-segmenten: de score kan nog niet vastliggen als de uitkomst heel snel komt (echt via de meetpagina binnen een seconde). Dan zet de
// poort de markering pbw_<soort> en beslist de late verwerking (naVast) zodra de score er is; HSETNX op pbc_<soort> laat precies één kant
// beslissen, en pbd in mm:cid (wissel.js pbStuur) houdt de postback op eenmaal per klik.
const seg1 = (kv, veld) => kv.raw(['HINCRBY', 'mm:seg:' + dagVan(), veld, 1]).then(() => kv.raw(['EXPIRE', 'mm:seg:' + dagVan(), TTL])).catch(() => {});
export const segUit = (seg, kks, vw) => VOORWIE.includes(seg) ? (!vw ? 'onbekend' : vw === seg ? 'in' : 'buiten') : (!kks || kks === '-' ? 'onbekend' : 'kk-' + kks === seg ? 'in' : 'buiten');
export async function segPoort(kv, { cid, k, soort, nu = Date.now() }) {
  const seg = String(k.pbg || '');
  if (!SEGMENTEN.includes(seg)) { await seg1(kv, 'pb_onbekend_segment'); return 'onbekend'; }
  if (VOORWIE.includes(seg)) { const r = segUit(seg, '', k.vw); await seg1(kv, 'pb_' + r + '_' + seg); return r; } // de tik staat in mm:cid; de uitkomst komt hier eenmaal per soort (wissel.js)
  const vk = 'mm:vf:' + cid;
  await kv.raw(['HSET', vk, 'pbw_' + soort, String(nu)]);
  const [kks] = await Promise.all([kv.raw(['HGET', vk, 'kks']).catch(() => null), kv.raw(['EXPIRE', vk, VF_TTL]).catch(() => 0)]);
  let w = kks;
  if (w == null) { const lo = await kv.raw(['HGET', 'mm:vfl:' + cid, 'o']).catch(() => null); if (lo) w = vfLees(lo).kks || '-'; } // aanmelding: 30 dagen bewaard (lib/uitkomstterug.js)
  if (w == null && nu - N(k.t) < KKS.vers) { await seg1(kv, 'pb_wacht'); return 'wacht'; }
  if (N(await kv.raw(['HSETNX', vk, 'pbc_' + soort, String(nu)])) !== 1) return 'dubbel';
  const r = segUit(seg, w || '-', ''); await seg1(kv, 'pb_' + r + '_' + seg); return r;
}
// na het vastzetten van de score: wachtende segmentpostbacks van deze klik beslissen
export async function naVast(kv, cid, { pbStuur } = {}) {
  const vk = 'mm:vf:' + cid, h = Object.fromEntries(paren(await kv.raw(['HGETALL', vk]).catch(() => null))), uit = [];
  for (const veld of Object.keys(h)) {
    if (!/^pbw_/.test(veld)) continue; const soort = veld.slice(4);
    if (N(await kv.raw(['HSETNX', vk, 'pbc_' + soort, String(Date.now())]).catch(() => 0)) !== 1) continue;
    const k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + cid]).catch(() => null)));
    if (k.pbs !== soort || !SEGMENTEN.includes(String(k.pbg || ''))) continue;
    const r = segUit(k.pbg, h.kks || '-', k.vw); await seg1(kv, 'pb_' + r + '_' + k.pbg); await seg1(kv, 'pb_laat');
    let st = null; if (r === 'in') { const stuur = pbStuur || (await import('./wissel.js')).pbStuur; st = await stuur(kv, k, cid, new Date(N(k.t) || Date.now()).toISOString().slice(0, 10)); if (st != null) await seg1(kv, 'pb_gestuurd'); }
    uit.push({ soort, r, pb: st });
  }
  return uit;
}

// ---- 4. de tik "Voor wie zoek je?" (inert: geen pagina stuurt hem tot Henkjan ja zegt) ----
// Eén tik per klik telt (HSETNX), en alleen de bezoeker zelf zet hem. Uitkomsten die al vóór de tik kwamen tellen bij de tik mee in het zoneprofiel.
export async function voorWie(kv, { cid, w }) {
  cid = String(cid || ''); w = String(w || '').toLowerCase(); if (!/^voor-/.test(w)) w = 'voor-' + w;
  if (!/^[0-9a-f]{8,24}$/.test(cid)) return { ok: false, fout: 'cid (mmc) 8-24 hex' };
  if (!VOORWIE.includes(w)) return { ok: false, fout: 'w = mij | haar | hem' };
  const k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + cid]).catch(() => null)));
  if (!k.pid) { await seg1(kv, 'tik_onbekend'); return { ok: false, fout: 'onbekende klik' }; }
  if (N(await kv.raw(['HSETNX', 'mm:cid:' + cid, 'vw', w])) !== 1) { await seg1(kv, 'tik_dubbel'); return { ok: true, dubbel: true }; }
  await seg1(kv, 'tik_' + w);
  const zp = (await kv.raw(['HGET', 'mm:vf:' + cid, 'zp']).catch(() => null)) || zpVan({ wissel: k.wissel, camp: k.camp, net: k.net, zone: k.zone });
  const D = dagVan(N(k.t) || Date.now()), c = segzCmds(D, zp, w, 'n');
  for (const u of UIT4) if (k['u:' + u]) c.push(...segzCmds(D, zp, w, u));
  await Promise.all(c.map(x => kv.raw(x))).catch(() => {});
  return { ok: true, w };
}
// een uitkomst na de tik (lib/wissel.js uitkomst roept dit eenmaal per klik en soort aan)
export async function uitVoorWie(kv, cid, k, soort, D) {
  if (!k.vw || !UIT4.includes(soort)) return;
  const zp = (await kv.raw(['HGET', 'mm:vf:' + cid, 'zp']).catch(() => null)) || zpVan({ wissel: k.wissel, camp: k.camp, net: k.net, zone: k.zone });
  await Promise.all(segzCmds(D, zp, k.vw, soort).map(x => kv.raw(x))).catch(() => {});
}

// ---- 3. zoneprofiel per product en segment ----
function wilson(k, n, z = 1.96) { if (!n) return [0, 1]; const p = k / n, d = 1 + z * z / n, m = (p + z * z / (2 * n)) / d, w = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [Math.max(0, m - w), Math.min(1, m + w)]; }
const pct = x => Math.round(x * 1000) / 10;
export const PROFIEL = { minKliks: 50, minUit: 3 };
// Witte lijst-kandidaat: genoeg kliks en uitkomsten in dit segment, en de ondergrens (Wilson 95%) boven het gemiddelde van het product
// in dit segment. Duidelijk niet: genoeg kliks en de bovengrens onder de helft van dat gemiddelde. Alleen data en een voorstel: dit schrijft
// nooit naar mm:blok of een lijst die campagnes lezen.
export async function zoneProfiel(kv, { dagen = 14, prod = '', uit = 'echt', minKliks = PROFIEL.minKliks, minUit = PROFIEL.minUit, sub = false } = {}) {
  dagen = Math.max(1, Math.min(15, Math.round(N(dagen)) || 14)); if (!UIT4.includes(uit)) uit = 'echt';
  const D = Array.from({ length: dagen }, (_, i) => dagVan(Date.now() - i * 864e5));
  const hs = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:segz:' + d]).catch(() => null)));
  const P = {}; // P[prod][seg][net|zone(|sz)] = { n, echt, ... }
  for (const h of hs) for (const [fld, v] of paren(h)) {
    const a = fld.split('|'); if (a.length !== 6) continue; const [p, s, net, zone, sz, u] = a; if (prod && p !== prod) continue;
    const z = sub && sz !== '-' ? net + '|' + zone + '|' + sz : net + '|' + zone;
    const x = (((P[p] || (P[p] = {}))[s] || (P[p][s] = {}))[z] || (P[p][s][z] = { n: 0 })); x[u] = N(x[u]) + N(v);
  }
  const producten = [];
  for (const [p, S] of Object.entries(P)) {
    const segs = [];
    // aandeel van een segment in de kliks van een zone (alleen kk: die som is alle kliks met een score)
    const kkZone = {}; for (const s of ['kk-hoog', 'kk-midden', 'kk-laag']) for (const [z, x] of Object.entries(S[s] || {})) kkZone[z] = N(kkZone[z]) + x.n;
    for (const [s, Z] of Object.entries(S)) {
      let K = 0, Nn = 0; for (const x of Object.values(Z)) { K += Math.min(N(x[uit]), x.n); Nn += x.n; }
      const p0 = Nn ? K / Nn : 0, wit = [], niet = [], rest = [];
      for (const [z, x] of Object.entries(Z)) {
        const k = Math.min(N(x[uit]), x.n), [lo, hi] = wilson(k, x.n);
        const r = { zone: z, kliks: x.n, [uit]: k, pct: pct(x.n ? k / x.n : 0), ondergrens: pct(lo), bovengrens: pct(hi), aandeel: s.startsWith('kk-') && kkZone[z] ? pct(x.n / kkZone[z]) : undefined };
        if (x.n >= minKliks && k >= minUit && lo > p0) wit.push(r); else if (x.n >= minKliks && p0 > 0 && hi < p0 / 2) niet.push(r); else rest.push(r);
      }
      wit.sort((a, b) => b.ondergrens - a.ondergrens); niet.sort((a, b) => b.kliks - a.kliks);
      segs.push({ segment: s, kliks: Nn, [uit]: K, gemiddeld: pct(p0), zones: Object.keys(Z).length, witteLijst: wit.slice(0, 50), duidelijkNiet: niet.slice(0, 50), teWeinig: rest.length });
    }
    segs.sort((a, b) => SEGMENTEN.indexOf(a.segment) - SEGMENTEN.indexOf(b.segment));
    producten.push({ product: p, segmenten: segs });
  }
  producten.sort((a, b) => b.segmenten.reduce((s, x) => s + x.kliks, 0) - a.segmenten.reduce((s, x) => s + x.kliks, 0));
  return { ok: true, dagen: D.length, uitkomst: uit, subzones: !!sub, minKliks, minUit, voorstel: true,
    uitleg: 'Per product (wissel of campagnelijn) en segment: zones met minstens ' + minKliks + ' kliks en ' + minUit + ' keer ' + uit + ' waarvan de ondergrens (Wilson 95%) boven het gemiddelde van het product in dat segment ligt, zijn kandidaat voor een witte lijst. Duidelijk niet: genoeg kliks en de bovengrens onder de helft van het gemiddelde. Alleen een voorstel: er verandert geen campagne en geen lijst.',
    producten };
}
export function profielTekst(r) {
  if (!r || !r.producten) return '';
  const L = ['Zoneprofiel per segment (' + r.dagen + ' dagen, uitkomst ' + r.uitkomst + (r.subzones ? ', per subzone' : '') + '; voorstel, er verandert niets)'];
  if (!r.producten.length) L.push('Nog geen kliks met een segment in betaalde zones.');
  for (const p of r.producten.slice(0, 20)) for (const s of p.segmenten) {
    L.push(p.product + ' ' + s.segment + ': ' + s.kliks + ' kliks, ' + s[r.uitkomst] + ' ' + r.uitkomst + ' (' + String(s.gemiddeld).replace('.', ',') + '%), ' + s.zones + ' zones');
    if (s.witteLijst.length) L.push('  witte lijst: ' + s.witteLijst.slice(0, 10).map(z => z.zone + ' ' + z.kliks + '/' + z[r.uitkomst] + ' (ondergrens ' + String(z.ondergrens).replace('.', ',') + '%)').join(', '));
    if (s.duidelijkNiet.length) L.push('  duidelijk niet: ' + s.duidelijkNiet.slice(0, 10).map(z => z.zone + ' ' + z.kliks + '/' + z[r.uitkomst]).join(', '));
  }
  return L.join('\n');
}

// ---- controle ----
export async function segStand(kv, dagen = 1) {
  dagen = Math.max(1, Math.min(15, Math.round(N(dagen)) || 1));
  const D = Array.from({ length: dagen }, (_, i) => dagVan(Date.now() - i * 864e5));
  const hs = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:seg:' + d]).catch(() => null)));
  return { dagen: D.map((d, i) => { const o = {}; for (const [k, v] of paren(hs[i])) o[k] = N(v); const pb = {}; for (const [k, v] of Object.entries(o)) { const m = /^pb_(in|buiten|onbekend)_(.+)$/.exec(k); if (m) (pb[m[2]] || (pb[m[2]] = { in: 0, buiten: 0, onbekend: 0 }))[m[1]] = v; }
    return { dag: d, kliks: o.klik || 0, hoog: o.kks_hoog || 0, midden: o.kks_midden || 0, laag: o.kks_laag || 0, onbekend: o.kks_onbekend || 0, segmentPb: pb, pbWacht: o.pb_wacht || 0, pbLaat: o.pb_laat || 0, pbGestuurd: o.pb_gestuurd || 0, tik: { 'voor-mij': o['tik_voor-mij'] || 0, 'voor-haar': o['tik_voor-haar'] || 0, 'voor-hem': o['tik_voor-hem'] || 0, dubbel: o.tik_dubbel || 0, onbekend: o.tik_onbekend || 0 } }; }) };
}
export function segTekst(s) {
  const d = s && s.dagen && s.dagen[0]; if (!d) return '';
  const pct0 = x => d.kliks ? Math.round(100 * x / d.kliks) + '%' : '0%';
  const pb = Object.entries(d.segmentPb).map(([g, x]) => g + ' ' + x.in + ' gemeld, ' + x.buiten + ' buiten, ' + x.onbekend + ' onbekend').join('; ');
  return 'Koopkrachtscore (' + d.dag + '): ' + d.kliks + ' kliks vastgezet, hoog ' + pct0(d.hoog) + ', midden ' + pct0(d.midden) + ', laag ' + pct0(d.laag) + ', onbekend ' + pct0(d.onbekend) + (d.kliks ? '' : ' (staat op nul: kijk of verwerkO loopt)')
    + '. Segmentpostbacks: ' + (pb || 'geen wissel met pbseg') + (d.pbWacht ? ', ' + d.pbWacht + ' wachtten op de score (' + d.pbLaat + ' later beslist)' : '') + (d.pbGestuurd ? ', ' + d.pbGestuurd + ' verstuurd' : '')
    + '. Tik voor wie: ' + (d.tik['voor-mij'] + d.tik['voor-haar'] + d.tik['voor-hem'] ? 'mij ' + d.tik['voor-mij'] + ', haar ' + d.tik['voor-haar'] + ', hem ' + d.tik['voor-hem'] : 'uit (geen pagina stuurt hem)');
}
