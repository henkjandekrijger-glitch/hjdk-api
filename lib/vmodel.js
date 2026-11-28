// Voorspelmodel per klik (Henkjan 27 nov 2026: "Wat voor data kunnen we nog meer toevoegen om betere clicks te krijgen ... We zijn in AI
// tijd . Zorg voor top voorspellingen !! Je bent de patroon herkenner !!" en eerder: "alles killen wat geen mensen zijn . Zo snel mogelijk
// zodat clik twee niet meer komt").
// Alle voorspellers van een klik (lib/voorspel.js: uur, toestel, provider, land, terugkomer, zone-leeftijd, wat het netwerk meegeeft, ...)
// samen in één kans: wordt dit een echt mens op de bestemming (echt), is het een bot (bot). Model = naive Bayes op log-odds per
// voorspeller-waarde, gekrompen naar het gemiddelde (a) en gedempt (demp) omdat voorspellers samenhangen. Bouwen: elk uur in de leerronde
// uit de tellers mm:vs:<dag> van 7 dagen, opgeslagen in mm:model:g.
// Bij de klik: score uit het model in het geheugen (nooit wachten, verversen na het antwoord), de score-emmer gaat als voorspeller 'score'
// mee in de tellers. Zo meet Clickmind per emmer hoe vaak het echt een mens werd: voorspeld tegen echt, de kalibratie.
// Handelen: telt een zone 2+ betaalde kliks met gemiddeld minder dan 2% kans op een mens, dan gaat hij meteen dicht (lib/pxcheck.js
// snelDicht), maar alleen als het model bewezen raak is: van de kliks die het 'geen mens' noemt (emmers onder 3%) was de afgelopen
// 7 dagen minstens 95% inderdaad geen mens, op minstens 150 kliks. Anders scoort het alleen en meet het.
import { snelDicht } from './pxcheck.js';

// koop en mailklik erbij (28 nov 2026, lib/uitkomstterug.js): koper tegen kijker (koop per echt mens) en lezer tegen alleen aangemeld (mailklik per aanmelding); meten en scoren, er hangt geen ingreep aan
export const VM = { doelen: { echt: 'ud', bot: 'n', koop: 'echt', mailklik: 'aanmelding' }, a: 30, demp: 0.7, min: 30, wMin: 0.1, grenzen: [0.01, 0.03, 0.07, 0.15, 0.3], grens: 0.02, zoneMin: 2, kalMin: 150, raak: 0.95, ververs: 10 * 60e3 };
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dagStr = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const paren = h => { const o = []; if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); else if (h && typeof h === 'object') o.push(...Object.entries(h)); return o; };
const logit = p => Math.log(p / (1 - p)), sig = x => 1 / (1 + Math.exp(-x));
const kl = p => Math.min(1 - 1e-6, Math.max(1e-6, p));

export function emmer(p) { for (let i = 0; i < VM.grenzen.length; i++) if (p < VM.grenzen[i]) return 'b' + i; return 'b' + VM.grenzen.length; }
export const EMMER_TEKST = ['onder 1%', '1 tot 3%', '3 tot 7%', '7 tot 15%', '15 tot 30%', '30% of meer'];

export async function bouwModel(kv, { dagen = 7 } = {}) {
  const D = Array.from({ length: dagen }, (_, i) => dagStr(-i));
  const hs = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:vs:' + d]).catch(() => null)));
  const T = {}; // T[nm=w][uitkomst] = n
  for (const h of hs) for (const [fld, v] of paren(h)) { if (!fld.startsWith('g|')) continue; const j = fld.lastIndexOf('|'), kw = fld.slice(2, j), u = fld.slice(j + 1); const x = T[kw] || (T[kw] = {}); x[u] = N(x[u]) + N(v); }
  const model = { t: new Date().toISOString(), dagen, p0: {}, w: {}, kal: {}, mag: false };
  for (const [doel, den] of Object.entries(VM.doelen)) {
    // gemiddelde uit één volledige voorspeller (os staat bij elke klik)
    let K = 0, Nn = 0; for (const [kw, x] of Object.entries(T)) if (kw.startsWith('os=')) { K += N(x[doel]); Nn += N(x[den]); }
    if (Nn < 200 || !K) continue; const p0 = kl(K / Nn); model.p0[doel] = Math.round(p0 * 1e5) / 1e5; const W = model.w[doel] = {};
    for (const [kw, x] of Object.entries(T)) { if (kw.startsWith('score=')) continue; const n = N(x[den]), k = Math.min(N(x[doel]), n); if (n < VM.min || n >= Nn) continue;
      const pv = kl((k + VM.a * p0) / (n + VM.a)), w = (logit(pv) - logit(p0)) * VM.demp; if (Math.abs(w) >= VM.wMin) W[kw] = Math.round(w * 1000) / 1000; }
    // kalibratie: per score-emmer (voorspeller 'score' bij de klik) hoe vaak het echt gebeurde
    const kal = model.kal[doel] = []; for (let i = 0; i <= VM.grenzen.length; i++) { const x = T['score=b' + i] || {}; kal.push({ emmer: 'b' + i, kliks: N(x[den]), keer: Math.min(N(x[doel]), N(x[den])) }); }
  }
  const laag = (model.kal.echt || []).slice(0, 2), nL = laag.reduce((s, x) => s + x.kliks, 0), kL = laag.reduce((s, x) => s + x.keer, 0);
  model.raak = nL ? Math.round((1 - kL / nL) * 1000) / 1000 : null; model.raakKliks = nL;
  model.mag = nL >= VM.kalMin && model.raak >= VM.raak;
  await kv.set('mm:model:g', model, { ex: 3 * 86400 }).catch(() => {});
  return { ok: true, t: model.t, p0: model.p0, voorspellers: Object.fromEntries(Object.entries(model.w).map(([d, W]) => [d, Object.keys(W).length])), raak: model.raak, raakKliks: nL, mag: model.mag };
}

export function scoor(model, f) {
  const uit = {}; if (!model || !model.p0) return uit;
  for (const [doel, p0] of Object.entries(model.p0)) { let x = logit(kl(p0)); const W = model.w[doel] || {}; for (const [nm, v] of Object.entries(f || {})) { const w = W[nm + '=' + v]; if (w) x += w; } uit[doel] = Math.round(sig(x) * 1e4) / 1e4; }
  return uit;
}

// model in het geheugen van deze functie-instantie: nooit wachten bij een klik, verversen na het antwoord
const C = { m: null, t: 0, bezig: false };
export function modelNu(kv, laterAf = p => p) {
  if (Date.now() - C.t > VM.ververs && !C.bezig) { C.bezig = true; laterAf(kv.get('mm:model:g').then(m => { if (m && m.p0) C.m = m; }).catch(() => {}).finally(() => { C.t = Date.now(); C.bezig = false; })); }
  return C.m;
}
export function zetModel(m) { C.m = m; C.t = Date.now(); } // voor de test

// per betaalde zone per dag: som van de kansen op een mens en aantal kliks; dicht zodra het model bewezen raak is en de zone duidelijk geen mensen brengt
export async function zoneTel(kv, { net, zone, p, D = dagStr(), model }) {
  if (!zone || zone === '-' || !(p >= 0)) return null;
  const k = 'mm:vz:' + D, z = net + '|' + zone;
  const [s, n] = await Promise.all([kv.raw(['HINCRBYFLOAT', k, z + '|s', String(p)]), kv.raw(['HINCRBY', k, z + '|n', 1])]).catch(() => [0, 0]);
  await kv.raw(['EXPIRE', k, 9 * 86400]).catch(() => {});
  const gem = N(s) / Math.max(1, N(n));
  if (model && model.mag && N(n) >= VM.zoneMin && gem < VM.grens) return snelDicht(kv, net, zone, 'voorspelmodel: ' + N(n) + ' kliks met gemiddeld ' + Math.round(gem * 1000) / 10 + '% kans op een mens (model ' + Math.round(model.raak * 100) + '% raak op ' + model.raakKliks + ' kliks)');
  return { zone, n: N(n), gem };
}

export function modelTekst(m) {
  if (!m || !m.p0) return 'VOORSPELMODEL: nog niet gebouwd (de leerronde bouwt het elk uur uit 7 dagen kliks).';
  const r = ['VOORSPELMODEL (per klik, ' + m.t.slice(0, 16).replace('T', ' ') + ' UTC): kans op een echt mens gemiddeld ' + Math.round(N(m.p0.echt) * 1000) / 10 + '%, op een bot ' + Math.round(N(m.p0.bot) * 1000) / 10 + '%; ' + Object.keys(m.w.echt || {}).length + ' voorspeller-waarden.'];
  r.push(m.mag ? 'Blokkeert zelf: van de kliks die het "geen mens" noemt was ' + Math.round(m.raak * 100) + '% inderdaad geen mens (' + m.raakKliks + ' kliks).'
    : 'Blokkeert nog niet: ' + (m.raakKliks ? Math.round(N(m.raak) * 100) + '% raak op ' + m.raakKliks + ' kliks' : 'nog geen gescoorde kliks met uitkomst') + ' (nodig: ' + Math.round(VM.raak * 100) + '% op ' + VM.kalMin + ').');
  const k = (m.kal.echt || []).filter(x => x.kliks); if (k.length) r.push('Voorspeld tegen echt: ' + k.map(x => EMMER_TEKST[Number(x.emmer.slice(1))] + ' voorspeld: ' + Math.round(x.keer / x.kliks * 1000) / 10 + '% echt (' + x.kliks + ')').join(' · '));
  return r.join('\n');
}
