// Test van de rekenkern hypotheek (lib/hypotheek-kern.js) tegen officiele rekenvoorbeelden. Draai: node scripts/test-hypotheek.mjs
// 1) Nibud, Advies hypotheeknormen 2027 (Tweede Kamer 2026D54667, bijlage bij de Kamerbrief leennormen 2027 van 14 okt 2026), tabel 3 (rente 4,25%)
//    en tabel 4 (rente 5%): maximale hypotheek bij een bruto huishoudinkomen, annuiteit 30 jaar, zonder schulden, niet alleenstaand.
// 2) Belastingdienst: eigenwoningforfait bij WOZ 280.000 is 980 euro; aftrek geen of kleine eigenwoningschuld 2026 71,867%.
// 3) Regels uit de Tijdelijke regeling hypothecair krediet: toetsrente, 100%/106% woningwaarde, alleenstaandenbedrag, studielening.
import { D, bereken, maxHypotheek, invoer, forfait, aftrekVoordeel, annu, flPct } from '../lib/hypotheek-kern.js';
let fout = 0, ok = 0;
const is = (naam, a, b, tol = 0) => { if (Math.abs(a - b) <= tol) ok++; else { fout++; console.log('FOUT', naam, 'kreeg', a, 'verwacht', b); } };
const NIBUD = { 2026: { 4.25: [139922, 199889, 290517, 459067], 5: [133657, 190939, 274921, 434657] }, 2027: { 4.25: [142887, 204124, 294074, 467537], 5: [135830, 194043, 279267, 442419] } };
const INK = [35000, 50000, 70000, 100000];
for (const j of [2026, 2027]) for (const r of [4.25, 5]) INK.forEach((ink, n) => {
  // tweepersoonshuishouden in eenverdienerssituatie (Nibud par. 2.2.4): partner met 0 inkomen, dus geen alleenstaandenbedrag; rentevast 10 jaar
  const x = invoer({ j, i1: ink, p: '1', i2: 0, r, rv: 10 }); is('nibud ' + j + ' ' + r + '% ' + ink, maxHypotheek(D, j, x).opInkomen, NIBUD[j][r][n], 1);
});
// partnerinkomen telt volledig mee: 30.000 + 20.000 geeft hetzelfde als 50.000 alleen (Nibud par. 2.2.7)
is('partner telt volledig', maxHypotheek(D, 2027, invoer({ i1: 30000, p: '1', i2: 20000, r: 5, rv: 10 })).opInkomen, 194043, 1);
// toetsrente: rentevast 5 jaar met 3,8% wordt getoetst op 5% (art. 3 lid 9c en 10)
const kort = maxHypotheek(D, 2027, invoer({ i1: 50000, p: '1', r: 3.8, rv: 5 })); is('toetsrente 5%', kort.tr, 5); is('toetsrente bedrag', kort.opInkomen, 194043, 1);
// alleenstaand boven 31.000 in 2027: 18.000 extra (art. 3 lid 8, Stcrt. 2026, 38415)
is('alleenstaand 2027', maxHypotheek(D, 2027, invoer({ i1: 50000, r: 5, rv: 10 })).opInkomen, 194043 + 18000, 1);
is('alleenstaand 2026', maxHypotheek(D, 2026, invoer({ j: 2026, i1: 50000, r: 5, rv: 10 })).alleen, 17000);
// studielening: 100 euro per maand bij toetsrente 5% weegt 1,30 (art. 3a)
const st = maxHypotheek(D, 2027, invoer({ i1: 50000, p: '1', r: 5, rv: 10, st: 100 })); is('studie factor', st.fb, 1.3); is('studie bedrag', st.opInkomen, Math.floor((50000 * 0.25 / 12 - 130) / annu(5, 360)), 1);
// woningwaarde: 100%, met verduurzaming tot 106% (art. 5)
is('ltv 100', maxHypotheek(D, 2027, invoer({ i1: 120000, r: 4, rv: 10, w: 300000 })).max, 300000);
is('ltv 106', maxHypotheek(D, 2027, invoer({ i1: 120000, r: 4, rv: 10, w: 300000, m: 25000, l: 'E' })).max, 318000);
// energielabel A+++ geeft 25.000 extra op inkomen (art. 4 lid 3)
is('label A+++', maxHypotheek(D, 2027, invoer({ i1: 50000, p: '1', r: 5, rv: 10, l: 'A+++' })).opInkomen, 194043 + 25000, 1);
// tabelrij en kolom: 4,501-5,000% en 50.000 in 2027 = 25,0%
is('pct 2027', flPct(D, 2027, false, 50000, 5).pct, 25.0); is('pct AOW 2027 rij 110000', flPct(D, 2027, true, 150000, 7).pct, 43.2);
// Belastingdienst voorbeeld eigenwoningforfait 2026
is('ewf 280k', forfait(D.jaar[2026], 280000), 980); is('ewf villa', forfait(D.jaar[2026], 1450000), 4725 + 100000 * 0.0235, 0.01);
// aftrek in de 3e schijf hoogstens 37,56% (2026)
is('aftrek top', aftrekVoordeel(D.jaar[2026].ib, 120000, 10000, false), 3756, 0.01);
is('aftrek schijf 1', aftrekVoordeel(D.jaar[2026].ib, 30000, 10000, false), 3575, 0.01);
// volledige berekening draait zonder fouten en geeft eigen geld
const b = bereken(D, invoer({ i1: 60000, p: '1', i2: 30000, r: 3.87, rv: 10, w: 400000, s: '1', l: 'C' }));
is('starter vrij 400k', b.k.ovb, 0); is('nhg 0,4%', b.k.nhg, b.H * 0.004, 0.01); if (!(b.l.nettoMaand < b.l.brutoMaand)) { fout++; console.log('FOUT netto niet lager dan bruto'); } else ok++;
console.log(fout ? fout + ' fout(en), ' + ok + ' goed' : 'alle ' + ok + ' controles goed (16 Nibud-voorbeelden 2026 en 2027 exact)');
process.exit(fout ? 1 : 0);
