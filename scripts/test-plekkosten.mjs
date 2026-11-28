// test lib/plekkosten.js: node scripts/test-plekkosten.mjs
import { plekOordeel, plekTekst, PK } from '../lib/plekkosten.js';
let f = 0; const ja = (c, t) => { console.log((c ? 'ok   ' : 'FOUT ') + t); if (!c) f++; };
// TK-achtig: $0,40 per dag, 3 goede plekken ($0,025 per adres), 11 dure plekken zonder adres, veel centenplekken
const R = [];
for (let i = 0; i < 3; i++) R.push({ camp: '100', zone: 'g' + i, kliks: 40, kosten: 0.05, conv: 2 });
for (let i = 0; i < 11; i++) R.push({ camp: '100', zone: 'd' + i, kliks: 30, kosten: 0.07, conv: 0 });
for (let i = 0; i < 20; i++) R.push({ camp: '100', zone: 'c' + i, kliks: 2, kosten: 0.004, conv: 0 });
R.push({ camp: '100', zone: 'duur', kliks: 1, kosten: 0.012, conv: 0 }); // dure klik: $0,012 tegen een midden van ~$0,002
const o = plekOordeel(R);
const c = o.campagnes[0];
ja(c.doel === 0.025 && /goede plekken/.test(c.bron), 'zonder gezet doel leert de regel het doel uit de goede plekken ($0,025 per uitkomst)');
ja(o.blok.filter(b => /^d\d/.test(b.zone)).length === 11, 'de 11 dure plekken zonder uitkomst gaan eruit');
ja(!o.blok.some(b => /^c/.test(b.zone)), 'centenplekken onder het doel blijven (nog) staan');
ja(o.blok.some(b => b.zone === 'duur' && /dure kliks/.test(b.waarom)), 'plek met dure kliks gaat er al bij 40% van het doel uit');
ja(!o.blok.some(b => /^g/.test(b.zone)), 'plekken met uitkomst blijven altijd');
ja(o.blok.filter(b => b.sterk).length === 11, '2x het doel zonder uitkomst is sterk bewijs');
// gezet doel wint
const o2 = plekOordeel(R, { doelGezet: { '100': 0.05 } });
ja(o2.campagnes[0].doel === 0.05 && o2.blok.filter(b => /^d\d/.test(b.zone)).length === 11 && !o2.blok.some(b => b.zone === 'duur'), 'gezet doel ($0,05) wint van het geleerde');
// beschermd door Clickmind-uitkomst
const o3 = plekOordeel(R, { beschermd: new Set(['d0']) });
ja(!o3.blok.some(b => b.zone === 'd0'), 'plek met een aanmelding bij Clickmind blijft, ook zonder conversie bij het netwerk');
// campagne zonder uitkomst: geen plekoordeel
const o4 = plekOordeel([{ camp: '200', zone: 'x', kliks: 50, kosten: 1, conv: 0 }]);
ja(!o4.blok.length && /campagne-oordeel/.test(o4.campagnes[0].reden), 'campagne zonder uitkomst: geen plekoordeel, valt onder het campagne-oordeel');
// alleen live campagnes
const o5 = plekOordeel(R, { live: new Set(['999']) });
ja(!o5.campagnes.length, 'alleen campagnes die vandaag geld uitgaven');
// vloer
const o6 = plekOordeel([{ camp: '300', zone: 'g', kliks: 100, kosten: 0.001, conv: 5 }, { camp: '300', zone: 'z', kliks: 3, kosten: 0.004, conv: 0 }]);
ja(o6.campagnes[0].doel === PK.vloer && !o6.blok.length, 'doel nooit lager dan $' + PK.vloer);
ja(plekTekst(o).length > 1 && c.pctVerspild > 50, 'tekst en aandeel verspild (' + c.pctVerspild + '%)');
process.exit(f ? 1 : 0);
