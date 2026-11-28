// Omgevingsdata als voorspeller bij elke klik (Henkjan 28 nov 2026, taak l9144w: "gratis omgevingsdata als voorspeller bij elke klik: koopkracht
// per postcode, weer op de plek van de klik, licht of donker buiten. Na de klik verwerken, nooit vertragen."):
//   koopkracht  vijfde deel (laag tot hoog) van het postcodegebied, uit een vaste tabel (lib/koopkracht-tabel.js, alleen laat geladen)
//   daglicht    licht, schemer of donker buiten, uit lengte- en breedtegraad en de tijd van de klik berekend (geen opvraag)
//   weer, temp  weer en temperatuur op de plek van de klik, per stad per uur gecachet, zonder sleutel
// Nooit vertragend: de hele verwerking loopt na het antwoord (laterAf, zoals lib/d51.js); niets hiervan wordt in verwerkKlik afgewacht.
// Privacy (kop van lib/voorspel.js): de postcode, het IP en de coordinaten worden niet bewaard, alleen de afgeleide waarde. In de weercache
// staat alleen stad en uur (of een grof raster van 0,5 graad), nooit de coordinaten van de bezoeker.
// Weerbron: standaard MET Norway (api.met.no, gratis, data onder CC BY 4.0). Hun voorwaarden (gelezen 28 nov 2026): een herkenbare
// User-Agent met naam en site, coordinaten met hoogstens 4 decimalen, dezelfde plek niet opnieuw opvragen voor de Expires van het antwoord
// (daarom een uur bewaren per stad en hoogstens een opvraag per stad per uur), onder 20 opvragen per seconde, bronvermelding waar we het tonen.
// Open-Meteo is de andere keuze, maar het gratis plan daarvan is alleen voor niet-commercieel gebruik (voorwaarden gelezen 28 nov 2026)
// en Clickmind is commercieel: dus alleen aanzetten met een betaald abonnement. WEER.bron = 'uit' zet alle opvragen uit.
// Opslag: mm:vf:<cid> veld o (voorspellers), u_<uitkomst> (markering: deze uitkomst is er) en c_<uitkomst> (geteld voor o), mm:weer:<sleutel>
// weer (1 uur), mm:weern:<dag> opvragen per dag, mm:omg:<dag> tellers voor de controle (15 dagen), mm:omg:pauze (zelf ingrijpen).
import { telCmds, tagCmds, vfTekst, vfLees } from './voorspel.js';
import * as S from './segment.js'; // koopkrachtscore (28 nov 2026, taak dnhwt6): vastgezet in deze late verwerking en geteld via veld o

export const WEER = { bron: 'metno', dag: 8000, tijd: 2500, ttl: 3600, pauze: 6 * 3600, fouten: 30 };
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const VF_TTL = 30 * 3600; // gelijk aan VF_TTL in lib/mensmeter.js
const dagVan = t => new Date(t || Date.now()).toISOString().slice(0, 10);
const paren = h => { const o = []; if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); else if (h && typeof h === 'object') for (const e of Object.entries(h)) o.push(e); return o; };
// zelfde als laterAf in lib/mensmeter.js (hier nagemaakt om geen kring tussen de modules te maken)
export function laat(p) { try { const ctx = globalThis[Symbol.for('@vercel/request-context')]; const w = ctx && ctx.get && ctx.get(); if (w && typeof w.waitUntil === 'function') w.waitUntil(p); } catch (e) {} return p; }

// ---- licht of donker buiten: hoogte van de zon (NOAA-benadering, nauwkeurig op ongeveer 0,1 graad) ----
export function zonHoogte(lat, lon, t) {
  const r = Math.PI / 180, n = (N(t) / 864e5) + 2440587.5 - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360, g = ((357.528 + 0.9856003 * n) % 360) * r;
  const lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * r, eps = (23.439 - 0.0000004 * n) * r;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam)), ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const gmst = (280.46061837 + 360.98564736629 * n) % 360, ha = ((gmst + lon) * r) - ra;
  return Math.asin(Math.sin(lat * r) * Math.sin(dec) + Math.cos(lat * r) * Math.cos(dec) * Math.cos(ha)) / r;
}
export function daglicht(lat, lon, t) {
  lat = Number(lat); lon = Number(lon); t = N(t) || Date.now();
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return '';
  const h = zonHoogte(lat, lon, t);
  return h > -0.833 ? 'licht' : h > -6 ? 'schemer' : 'donker';
}

// ---- koopkracht per postcode ----
export const KOOP = ['1 laagste 20%', '2 onder midden', '3 midden', '4 boven midden', '5 hoogste 20%'];
// land 'us' (ZIP, 5 cijfers) of 'nl' (PC4); T = de tabelmodule { US, NL }. Leeg als het gebied onbekend is.
export function koopkracht(land, pc, T) {
  land = String(land || '').toLowerCase(); pc = String(pc || '').replace(/\s/g, ''); if (!T) return '';
  let c = '';
  if (land === 'us') { const m = /^(\d{5})/.exec(pc); if (m) c = (T.US || '')[Number(m[1])]; }
  else if (land === 'nl') { const m = /^(\d{4})/.exec(pc); if (m && Number(m[1]) >= 1000) c = (T.NL || '')[Number(m[1]) - 1000]; }
  const i = Number(c); return i >= 1 && i <= 5 ? KOOP[i - 1] : '';
}

// ---- weer ----
const temEmmer = x => x < 0 ? 'onder 0' : x < 10 ? '0-9' : x < 20 ? '10-19' : x < 30 ? '20-29' : '30+';
// MET Norway symbol_code (clearsky_day, lightrainshowers_night, rainandthunder ...)
export function weerMetno(j) {
  const ts = j && j.properties && j.properties.timeseries && j.properties.timeseries[0], d = ts && ts.data; if (!d) return null;
  const tmp = d.instant && d.instant.details && d.instant.details.air_temperature; if (typeof tmp !== 'number') return null;
  const s = (d.next_1_hours && d.next_1_hours.summary) || (d.next_6_hours && d.next_6_hours.summary) || (d.next_12_hours && d.next_12_hours.summary);
  const sym = String((s && s.symbol_code) || '').replace(/_(day|night|polartwilight)$/, '').toLowerCase(); if (!sym) return null;
  const w = /thunder/.test(sym) ? 'onweer' : /snow|sleet/.test(sym) ? 'sneeuw' : /rain|drizzle/.test(sym) ? 'regen' : sym === 'fog' ? 'mist' : sym === 'clearsky' || sym === 'fair' ? 'helder' : sym === 'partlycloudy' ? 'half bewolkt' : sym === 'cloudy' ? 'bewolkt' : '';
  return w ? { weer: w, temp: temEmmer(tmp) } : null;
}
// Open-Meteo: WMO-code
export function weerOpenMeteo(j) {
  const c = j && j.current; if (!c || typeof c.temperature_2m !== 'number' || typeof c.weather_code !== 'number') return null;
  const k = c.weather_code;
  const w = k <= 1 ? 'helder' : k === 2 ? 'half bewolkt' : k === 3 ? 'bewolkt' : (k === 45 || k === 48) ? 'mist' : (k >= 51 && k <= 67) || (k >= 80 && k <= 82) ? 'regen' : (k >= 71 && k <= 77) || k === 85 || k === 86 ? 'sneeuw' : k >= 95 && k <= 99 ? 'onweer' : '';
  return w ? { weer: w, temp: temEmmer(c.temperature_2m) } : null;
}
const gr = x => String(Math.round(N(x) * 100) / 100); // 2 decimalen (ongeveer een kilometer): genoeg voor het weer, en de bron krijgt nooit meer dan de stad
const BRONNEN = {
  metno: { url: (la, lo) => 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=' + gr(la) + '&lon=' + gr(lo), kop: () => ({ 'user-agent': process.env.WEER_UA || 'hjdk-clickmind/1.0 (+https://keuzehulp.best)', accept: 'application/json' }), lees: weerMetno },
  openmeteo: { url: (la, lo) => 'https://api.open-meteo.com/v1/forecast?latitude=' + gr(la) + '&longitude=' + gr(lo) + '&current=temperature_2m,weather_code', kop: () => ({ accept: 'application/json' }), lees: weerOpenMeteo }
};
const stadSchoon = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
// sleutel per stad, een uur bewaard (per stad per uur gecachet); zonder stad een raster van 0,5 graad (nooit de exacte plek)
export function weerSleutel({ lat, lon, land, regio, stad }) {
  const s = stadSchoon(stad), pl = s ? [String(land || '').toLowerCase(), String(regio || '').toLowerCase(), s].join('|') : 'll' + (Math.round(N(lat) * 2) / 2) + ',' + (Math.round(N(lon) * 2) / 2);
  return 'mm:weer:' + pl;
}
const tel = (kv, D, veld) => kv.raw(['HINCRBY', 'mm:omg:' + D, veld, 1]).catch(() => 0);

// weer op de plek van de klik: eerst het geheugen (per stad, een uur), dan de bron, hoogstens WEER.dag opvragen per dag; null als het niet kan
export async function weer(kv, p, { fetchFn = fetch } = {}) {
  const b = BRONNEN[WEER.bron]; if (!b) return null;
  const t = N(p.t) || Date.now(), D = dagVan(t), la = Number(p.lat), lo = Number(p.lon);
  const ck = weerSleutel(Object.assign({}, p, { t }));
  const oud = await kv.raw(['GET', ck]).catch(() => null);
  if (oud) { const [w, tm] = String(oud).split('|'); if (w && tm) { await tel(kv, D, 'wcache'); return { weer: w, temp: tm }; } }
  if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180 || (!la && !lo)) return null;
  if (await kv.raw(['GET', 'mm:omg:pauze']).catch(() => null)) { await tel(kv, D, 'wpauze'); return null; }
  // één opvraag tegelijk per stad: een stoot kliks uit dezelfde stad vraagt het weer niet vijftig keer op
  if (!(await kv.raw(['SET', ck + ':slot', '1', 'NX', 'EX', 30]).catch(() => null))) { await tel(kv, D, 'wslot'); return null; }
  const mk = 'mm:weern:' + D, n = N(await kv.raw(['INCR', mk]).catch(() => 0)); if (n === 1) await kv.raw(['EXPIRE', mk, 2 * 86400]).catch(() => {});
  if (n > WEER.dag) { await tel(kv, D, 'wcap'); return null; }
  await tel(kv, D, 'wcall');
  let uit = null, fout = '';
  try {
    const r = await fetchFn(b.url(la, lo), { headers: b.kop(), signal: AbortSignal.timeout(WEER.tijd) });
    if (!r.ok) fout = 'http' + r.status; else { uit = b.lees(await r.json().catch(() => null)); if (!uit) fout = 'inhoud'; }
  } catch (e) { fout = 'net'; }
  if (fout) { // controle: te veel fouten en meer dan de helft van de opvragen op een dag: zes uur geen opvragen, daarna weer proberen
    await tel(kv, D, 'wfout_' + fout);
    const f = N(await kv.raw(['HINCRBY', 'mm:omg:' + D, 'wfout', 1]).catch(() => 0)), c = N(await kv.raw(['HGET', 'mm:omg:' + D, 'wcall']).catch(() => 0));
    if (f > WEER.fouten && f * 2 > c) { await kv.raw(['SET', 'mm:omg:pauze', D + ' ' + f + ' fouten bij ' + c + ' opvragen', 'EX', WEER.pauze]).catch(() => {}); await tel(kv, D, 'wpauzes'); }
    return null;
  }
  await kv.raw(['SET', ck, uit.weer + '|' + uit.temp, 'EX', WEER.ttl]).catch(() => {});
  return uit;
}

// ---- uitkomsten precies eenmaal tellen voor de omgevingsvoorspellers (veld o) ----
// Een uitkomst kan vóór de late verwerking komen (meetpagina binnen een seconde, weer 2,5 s) of erna. Protocol: elke schrijver zet eerst de
// markering u_<uitkomst> en leest dan o; de late verwerking schrijft eerst o en leest dan de markeringen. Zo ziet minstens één kant de
// ander, en HSETNX op c_<uitkomst> zorgt dat er één telt.
const uitVan = (soort, w) => { const u = { [soort]: 1 }; if (soort === 'aan' && /\|1$/.test(String(w || ''))) u.botb = 1; return u; };
export async function oUitkomst(kv, cid, soort, D, botb = 0) {
  const k = 'mm:vf:' + cid;
  await kv.raw(['HSET', k, 'u_' + soort, D + (botb ? '|1' : '')]);
  // altijd een houdbaarheid: komt de uitkomst na 30 uur (hash al weg), dan maakt de markering een nieuwe hash en die mag nooit blijven staan
  const [o] = await Promise.all([kv.raw(['HGET', k, 'o']), kv.raw(['EXPIRE', k, VF_TTL]).catch(() => 0)]); if (!o) return [];
  if (N(await kv.raw(['HSETNX', k, 'c_' + soort, 1])) !== 1) return [];
  const zp = S.UIT4.includes(soort) ? await kv.raw(['HGET', k, 'zp']).catch(() => null) : null; // zoneprofiel per segment (lib/segment.js), binnen dezelfde claim
  return telCmds(D, 'g', vfLees(o), uitVan(soort, botb ? '|1' : '')).concat(S.uitSegz(D, zp, o, soort));
}
// na het antwoord: markeren, o lezen en tellen; nooit afwachten
export function oUitkomstLater(kv, cid, soort, D, botb = 0) {
  return laat(oUitkomst(kv, cid, soort, D, botb).then(c => Promise.all(c.map(x => kv.raw(x)))).catch(() => {}));
}

// ---- de late verwerking van één klik ----
// a = { cid, srv: { lat, lon, land, regio, stad, pc }, t, D, uit: { n, rep, bot, js, ud }, tag, vf: { os, iosv, n_device, n_conn }, zp }
// vf en zp (28 nov 2026, lib/segment.js): met vf zet deze taak ook de koopkrachtscore van de klik vast (kks in o, en veld kks altijd, ook '-')
export async function verwerkO(kv, a, { fetchFn, tabel, wachtB, slaap } = {}) {
  const s = a.srv || {}, t = N(a.t) || Date.now(), D = a.D || dagVan(t), land = String(s.land || '').toLowerCase(), f = {};
  const dl = daglicht(s.lat, s.lon, t); if (dl) f.daglicht = dl;
  let kk = ''; if ((land === 'us' || land === 'nl') && s.pc) { try { kk = koopkracht(land, s.pc, tabel || await import('./koopkracht-tabel.js')); } catch (e) {} } if (kk) f.koopkracht = kk;
  const w = await weer(kv, { lat: s.lat, lon: s.lon, land, regio: s.regio, stad: s.stad, t }, { fetchFn }).catch(() => null); if (w) { f.weer = w.weer; f.temp = w.temp; }
  if (a.vf) { try { const kz = await S.kksMoment(kv, Object.assign({}, a, { t }), f, { wachtB, slaap }); if (kz.kks) f.kks = kz.kks; } catch (e) {} } // na o, en bij een js-klik na de meetpagina
  const od = dagVan(Date.now()), ok = 'mm:omg:' + od;
  const c = [['HINCRBY', ok, 'klik', 1]]; if (kk) c.push(['HINCRBY', ok, 'koop', 1]); if (dl) c.push(['HINCRBY', ok, 'licht', 1]); if (w) c.push(['HINCRBY', ok, 'weer', 1]); c.push(['EXPIRE', ok, 15 * 86400]);
  await Promise.all(c.map(x => kv.raw(x))).catch(() => {});
  const k = 'mm:vf:' + a.cid, extra = a.vf ? ['kks', f.kks || '-', ...(a.zp ? ['zp', a.zp] : [])] : [];
  if (a.vf) await Promise.all(S.vastCmds(Object.assign({}, a, { D }), f.kks).map(x => kv.raw(x))).catch(() => {});
  if (!Object.keys(f).length) { if (extra.length) { await Promise.all([['HSET', k, ...extra], ['EXPIRE', k, VF_TTL]].map(x => kv.raw(x))); await S.naVast(kv, a.cid).catch(() => {}); } return null; }
  await Promise.all([['HSET', k, 'o', vfTekst(f), ...extra], ['EXPIRE', k, VF_TTL]].map(x => kv.raw(x))); // eerst o (en kks), dan pas de markeringen lezen
  await Promise.all([...telCmds(D, 'g', f, a.uit || { n: 1 }), ...tagCmds(D, f, a.tag)].map(x => kv.raw(x)));
  const alles = paren(await kv.raw(['HGETALL', k]).catch(() => null));
  for (const [veld, w2] of alles) {
    if (!/^u_/.test(veld)) continue; const soort = veld.slice(2), dg = String(w2).split('|')[0];
    if (N(await kv.raw(['HSETNX', k, 'c_' + soort, 1]).catch(() => 0)) !== 1) continue;
    const dd = /^\d{4}-\d{2}-\d{2}$/.test(dg) ? dg : D;
    await Promise.all(telCmds(dd, 'g', f, uitVan(soort, w2)).concat(S.uitSegz(dd, a.zp, vfTekst(f), soort)).map(x => kv.raw(x))).catch(() => {});
  }
  if (a.vf) await S.naVast(kv, a.cid).catch(() => {}); // segmentpostbacks die op deze score wachtten
  return f;
}

// stand voor /api/mm?op=bronnen
export async function stand(kv) {
  const D = dagVan(), [h, p, pt, n] = await Promise.all([kv.raw(['HGETALL', 'mm:omg:' + D]).catch(() => null), kv.raw(['GET', 'mm:omg:pauze']).catch(() => null), kv.raw(['TTL', 'mm:omg:pauze']).catch(() => null), kv.raw(['GET', 'mm:weern:' + D]).catch(() => 0)]);
  const o = {}; for (const [k, v] of paren(h)) o[k] = N(v);
  const fout = {}; for (const [k, v] of Object.entries(o)) if (/^wfout_/.test(k)) fout[k.slice(6)] = v;
  return { bron: WEER.bron, dag: D, kliks: o.klik || 0, metKoopkracht: o.koop || 0, metDaglicht: o.licht || 0, metWeer: o.weer || 0, cacheTreffers: o.wcache || 0, opvragen: o.wcall || 0, opvragenVandaag: N(n), max: WEER.dag, fouten: fout, foutTotaal: o.wfout || 0, overgeslagen: { pauze: o.wpauze || 0, slot: o.wslot || 0, maxdag: o.wcap || 0 }, pauze: p ? { sinds: String(p), nogSeconden: N(pt) } : null };
}
export function standTekst(s) {
  if (!s) return '';
  const pct = x => s.kliks ? Math.round(100 * x / s.kliks) + '%' : '0%';
  return 'Omgeving (' + s.bron + ', ' + s.dag + '): ' + s.kliks + ' kliks, koopkracht ' + pct(s.metKoopkracht) + ', licht of donker ' + pct(s.metDaglicht) + ', weer ' + pct(s.metWeer) + '; weer: ' + s.cacheTreffers + ' uit het geheugen, ' + s.opvragen + ' van ' + s.max + ' opvragen' + (s.foutTotaal ? ', fouten ' + JSON.stringify(s.fouten) : '') + (s.pauze ? ', PAUZE nog ' + Math.round(s.pauze.nogSeconden / 60) + ' min (' + s.pauze.sinds + ')' : '') + (s.bron === 'metno' ? '. Weerdata: MET Norway (CC BY 4.0)' : s.bron === 'openmeteo' ? '. Weerdata: Open-Meteo (CC BY 4.0)' : '');
}
