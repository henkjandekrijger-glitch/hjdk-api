// Rekenkern van de rekenhulp hypotheek berekenen (keuzehulp.best/hypotheek-berekenen, 19 nov 2026). Puur: geen imports buiten de normen,
// zodat dezelfde functies in de browser draaien (lib/hypotheek.js zet ze met toString() in de pagina) en in de test (scripts/test-hypotheek.mjs).
// Elke norm komt uit een officiele bron met datum (BRONNEN in lib/hypotheek.js):
// - financieringslastpercentages: Tijdelijke regeling hypothecair krediet, bijlage 1 (2026: geldend vanaf 1 jan 2026; 2027: Stcrt. 2026, 38415);
// - toetsrente (art. 3 lid 9 en 10), alleenstaanden (lid 8), studielening met bruteringsfactor (art. 3a), energielabel (art. 4 lid 3 tot 5),
//   100% en 106% van de woningwaarde (art. 5); financieringslast = annuiteit over 30 jaar, maandelijks achteraf (art. 3 lid 2 en 4);
// - andere leningen: Gedragscode Hypothecaire Financieringen 2020, art. 4.5 (doorlopend krediet ten minste 2% van de limiet per maand);
// - belasting: Belastingdienst (tarieven en eigenwoningforfait 2026), Fiscale sleuteltabel 2027 (Belastingplan 2027, september 2026);
// - NHG: Kamerbrief 8 okt 2025 (2026) en Consumentenbond 2 nov 2026 (2027); overdrachtsbelasting en startersvrijstelling: Belastingdienst.
// Getoetst tegen de 16 voorbeeldbedragen van het Nibud (Advies hypotheeknormen 2027, tabel 3 en 4): scripts/test-hypotheek.mjs.
import NORM from '../data/hypotheek-normen.json' with { type: 'json' };

export const D = {
  kol: NORM.kolommen, fl: NORM.fl,
  // art. 3a lid 2: termijnbedrag studielening maal deze factor (toetsrente tot en met de grens)
  bruto: [[2, 1.05], [2.5, 1.10], [3, 1.15], [3.5, 1.20], [4, 1.20], [4.5, 1.25], [5, 1.30], [5.5, 1.30], [6, 1.35], [99, 1.40]],
  // art. 4 lid 3: bedrag dat buiten de financieringslast blijft per energielabel; lid 4: extra voor energiebesparende voorzieningen; lid 5: zonder label 10.000
  label: { G: 0, F: 0, E: 0, D: 5000, C: 5000, B: 10000, A: 10000, 'A+': 20000, 'A++': 20000, 'A+++': 25000, 'A++++': 30000, 'A++++G': 40000, geen: 0 },
  maatregel: { G: 20000, F: 20000, E: 20000, D: 15000, C: 15000, B: 10000, A: 10000, 'A+': 10000, 'A++': 10000, 'A+++': 0, 'A++++': 0, 'A++++G': 0, geen: 10000 },
  jaar: {
    2026: { alleen: { grens: 30000, grensAow: 29000, bedrag: 17000 }, nhg: { grens: 470000, energie: 498200, prov: 0.4 }, start: 555000,
      ib: { s1: 38883, s2: 78426, t1: 35.75, t1aow: 17.85, t2: 37.56, t3: 49.5, max: 37.56 },
      ewf: { grens: 1350000, pct: 0.35, basis: 4725, boven: 2.35, laag: [[12500, 0], [25000, 0.10], [50000, 0.20], [75000, 0.25]] }, hillen: 71.867 },
    2027: { alleen: { grens: 31000, grensAow: 31000, bedrag: 18000 }, nhg: { grens: 500000, energie: 530000, prov: 0.4 }, start: 615000,
      ib: { s1: 39247, s2: 78426, t1: 36.23, t1aow: 18.33, t2: 38.16, t3: 49.5, max: 38.16 },
      ewf: { grens: 1360000, pct: 0.35, basis: 4760, boven: 2.35, laag: null }, hillen: null }
  }
};

export function kolom(D, r) { for (let i = 0; i < D.kol.length; i++) if (r <= D.kol[i] + 1e-9) return i; return D.kol.length; }
export function flPct(D, j, aow, ink, r) {
  const rows = D.fl[j][aow ? 't2' : 't1']; let b = rows[0];
  for (const x of rows) if (ink >= x[0]) b = x;
  const k = kolom(D, r);
  return { pct: b[1 + k], rij: b[0], min: rows[1][0], k, van: k ? D.kol[k - 1] + 0.001 : 0, tot: k < D.kol.length ? D.kol[k] : 0 };
}
export function annu(r, n) { const i = r / 1200; return i > 0 ? i / (1 - Math.pow(1 + i, -n)) : 1 / n; }
export function bruteer(D, r) { for (const g of D.bruto) if (r <= g[0] + 1e-9) return g[1]; return 1.4; }
export function getal(v, d) { if (typeof v === 'number') return Number.isFinite(v) ? v : d; let s = String(v == null ? '' : v).trim().replace(/[€\s]/g, ''); if (!s) return d; if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); const n = Number(s); return Number.isFinite(n) ? n : d; }
// invoer uit hash of querystring (zelfde sleutels): j jaar, i1 i2 inkomen, p partner, aow (nee|binnen10|al), ia inkomen na AOW, st studie p/m, le leningen p/m,
// rv rentevaste periode in jaren, r rente, afm AFM-toetsrente, w koopsom, l label, m verduurzaming, s starter, n NHG, kp overige kosten %, v vorm (ann|lin), h gewenst bedrag
export function invoer(o, rentes) {
  const g = k => o[k] == null ? undefined : o[k];
  const rv = [1, 5, 10, 15, 20, 30].includes(getal(g('rv'), 10)) ? getal(g('rv'), 10) : 10;
  const rStd = rentes && rentes[rv >= 15 ? 'P' : rv >= 10 ? 'O' : rv >= 5 ? 'I' : 'F'];
  const L = Object.keys(D.label);
  return { j: String(g('j')) === '2026' ? 2026 : 2027, i1: Math.max(0, Math.min(2e6, getal(g('i1'), 50000))), partner: String(g('p')) === '1', i2: Math.max(0, Math.min(2e6, getal(g('i2'), 0))),
    aow: ['nee', 'binnen10', 'al'].includes(g('aow')) ? g('aow') : 'nee', iAow: Math.max(0, getal(g('ia'), 0)),
    studie: Math.max(0, getal(g('st'), 0)), lening: Math.max(0, getal(g('le'), 0)), rvp: rv, rente: Math.max(0, Math.min(15, getal(g('r'), rStd ? rStd.v : 4))), afm: Math.max(5, Math.min(15, getal(g('afm'), 5))),
    waarde: Math.max(0, Math.min(2e7, getal(g('w'), 0))), label: L.includes(g('l')) ? g('l') : 'geen', maat: Math.max(0, Math.min(500000, getal(g('m'), 0))),
    starter: String(g('s')) === '1', nhg: String(g('n')) !== '0', kostPct: Math.max(0, Math.min(15, getal(g('kp'), 3))), vorm: g('v') === 'lin' ? 'lin' : 'ann', h: Math.max(0, getal(g('h'), 0)) };
}
// maximale hypotheek op inkomen en op woningwaarde, met elke stap van de berekening
export function maxHypotheek(D, j, x) {
  const tr = x.rvp >= 10 ? x.rente : Math.max(x.rente, x.afm), ti = x.i1 + (x.partner ? x.i2 : 0), aowNu = x.aow === 'al';
  const f = flPct(D, j, aowNu, ti, tr), jaarlast = ti * f.pct / 100, fb = bruteer(D, tr), stud = x.studie * fb;
  const ruimte = Math.max(0, jaarlast / 12 - stud - x.lening), af = annu(tr, 360);
  let hInk = ruimte / af, naAow = null;
  if (x.aow === 'binnen10' && x.iAow > 0) { const f2 = flPct(D, j, true, x.iAow, tr); const r2 = Math.max(0, x.iAow * f2.pct / 1200 - stud - x.lening); naAow = { ti: x.iAow, pct: f2.pct, rij: f2.rij, maand: r2, h: r2 / af, laagst: r2 / af < hInk }; if (naAow.laagst) hInk = naAow.h; }
  const J = D.jaar[j], alleen = !x.partner && ti > (aowNu ? J.alleen.grensAow : J.alleen.grens) ? J.alleen.bedrag : 0;
  const lab = D.label[x.label] || 0, maatMax = D.maatregel[x.label] == null ? 0 : D.maatregel[x.label], maat = Math.min(x.maat, maatMax);
  const opInkomen = Math.floor(hInk + alleen + lab + maat);
  const opWaarde = x.waarde > 0 ? Math.floor(x.waarde + Math.min(x.maat, x.waarde * 0.06)) : null;
  return { j, tr, toetsAfm: x.rvp < 10 && x.afm > x.rente, ti, aowNu, pct: f.pct, rij: f.rij, minRij: f.min, kolVan: f.van, kolTot: f.tot, jaarlast, maandlast: jaarlast / 12, fb, stud, lening: x.lening, ruimte, af,
    hInk: Math.floor(hInk), naAow, alleen, lab, maat, maatMax, opInkomen, opWaarde, max: opWaarde == null ? opInkomen : Math.min(opInkomen, opWaarde), grens: opWaarde != null && opWaarde < opInkomen ? 'waarde' : 'inkomen' };
}
export function forfait(J, w) {
  const e = J.ewf; if (!(w > 0)) return 0; if (w > e.grens) return e.basis + (w - e.grens) * e.boven / 100;
  if (e.laag) for (const g of e.laag) if (w <= g[0]) return w * g[1] / 100;
  return w * e.pct / 100;
}
// belastingverschil voor een aftrek van a euro bij een belastbaar inkomen ink; elk tarief hoogstens het aftrektarief (tariefmaatregel)
export function aftrekVoordeel(ib, ink, a, aow) {
  const t1 = aow ? ib.t1aow : ib.t1, seg = [[0, ib.s1, t1], [ib.s1, ib.s2, ib.t2], [ib.s2, 1e12, ib.t3]]; let v = 0; const lo = Math.max(0, ink - a);
  for (const [van, tot, t] of seg) { const o = Math.max(0, Math.min(ink, tot) - Math.max(lo, van)); v += o * Math.min(t, ib.max) / 100; }
  return v;
}
export function margTarief(ib, ink, aow) { return ink <= ib.s1 ? (aow ? ib.t1aow : ib.t1) : ink <= ib.s2 ? ib.t2 : ib.t3; }
// maandlasten bruto en netto (eerste jaar), aftrek toegerekend aan de hoogste verdiener; koopsom als WOZ-waarde
export function lasten(D, j, x, H) {
  const i = x.rente / 1200, n = 360, pmt = H * annu(x.rente, n); let rest = H, rente1 = 0, afl1 = 0;
  for (let m = 0; m < 12; m++) { const ri = rest * i, a = x.vorm === 'lin' ? H / n : pmt - ri; rente1 += ri; afl1 += a; rest -= a; }
  const J = D.jaar[j], ewf = forfait(J, x.waarde), saldo = rente1 - ewf, ink = Math.max(x.i1, x.partner ? x.i2 : 0), aow = x.aow === 'al';
  const hillen = J.hillen == null ? D.jaar[2026].hillen : J.hillen;
  const voordeel = saldo >= 0 ? aftrekVoordeel(J.ib, ink, saldo, aow) : -(-saldo) * (1 - hillen / 100) * margTarief(J.ib, ink, aow) / 100;
  const eerste = x.vorm === 'lin' ? H / n + H * i : pmt, laatste = x.vorm === 'lin' ? H / n + (H / n) * i : pmt;
  return { H, pmt, eerste, laatste, rente1, afl1, bruto1: rente1 + afl1, ewf, saldo, ink, voordeel, nettoMaand: (rente1 + afl1 - voordeel) / 12, brutoMaand: (rente1 + afl1) / 12, totaalRente: x.vorm === 'lin' ? H * i * (n + 1) / 2 : pmt * n - H, hillenGeschat: J.hillen == null && saldo < 0 };
}
export function kosten(D, j, x, H) {
  const J = D.jaar[j], k = x.waarde, ovbVrij = x.starter && k > 0 && k <= J.start, ovb = ovbVrij ? 0 : k * 0.02;
  const nhgGrens = x.maat > 0 ? J.nhg.energie : J.nhg.grens, nhgKan = k > 0 && k + x.maat <= nhgGrens, nhg = x.nhg && nhgKan ? H * J.nhg.prov / 100 : 0;
  const overig = k * x.kostPct / 100, totaal = k + x.maat + ovb + nhg + overig;
  return { k, ovb, ovbVrij, startGrens: J.start, starterTeDuur: x.starter && k > J.start, nhgGrens, nhgKan, nhg, overig, totaal, eigen: Math.max(0, totaal - H) };
}
export function bereken(D, x) {
  const m = maxHypotheek(D, x.j, x), ander = maxHypotheek(D, x.j === 2027 ? 2026 : 2027, x);
  const H = x.h > 0 ? x.h : x.waarde > 0 ? Math.min(m.max, x.waarde + x.maat) : m.max;
  const l = lasten(D, x.j, x, H), lAnder = lasten(D, x.j, Object.assign({}, x, { vorm: x.vorm === 'lin' ? 'ann' : 'lin' }), H);
  return { x, m, ander, H, teHoog: H > m.max, l, lAnder, k: x.waarde > 0 ? kosten(D, x.j, x, H) : null };
}
