// Controle van het nieuwe sjabloon (lib/sjabloon.js): rust, geen grijs, één hoofdknop, geen interne opdracht in beeld.
// Draai: node scripts/test-sjabloon.mjs
import { sjabloonHtml, SJ_CSS, kortNaam, zinnen } from '../lib/sjabloon.js';
let fout = 0; const ok = (c, m) => { if (!c) { fout++; console.log('FOUT', m); } else console.log('ok  ', m); };
const basis = { taal: 'nl', host: 'keuzehulp.best', logo: 'keuzehulp', winkel: 'bol', slug: 'vaatwasser', term: 'vaatwasser', h1: 'Welke vaatwasser past bij jou?', title: 'Vaatwasser kiezen', desc: 'x', canonical: 'https://keuzehulp.best/vaatwasser', noindex: true,
  crumbs: [['Keuzehulp', '/keuzehulp'], ['Huishouden', '/keuzehulp/categorie/huishouden'], ['vaatwasser']], bijgewerkt: '2026-11-27', kortKop: 'Onze keuze: Bosch Serie 4.', kort: 'Voor de meeste huishoudens.',
  keus: { naam: 'Bosch Serie 4', prijs: '€555,00', was: '€619,00', url: 'https://example.com/a' },
  prods: [{ naam: 'Bosch Serie 4', rol: 'Ons advies', prijs: '€555,00', sterren: '4.8', url: 'https://example.com/a' }, { naam: 'Klarstein 45 cm', rol: 'Goedkoper alternatief', prijs: '€478,98', url: 'https://example.com/b' }, { naam: 'Siemens iQ500', rol: 'Als je meer wilt', prijs: '€749,00', url: 'https://example.com/c' }],
  pills: ['60 cm (standaard)', '45 cm (smal)', 'Tafelmodel / compact', 'vierde valt weg'], situaties: [{ situatie: '60 cm', keus: 'Bosch', prijs: '€555,00' }, { situatie: '45 cm', keus: 'Klarstein', prijs: '€478,98' }],
  letop: ['Een couvert is één set.'], faq: [{ q: 'Hoeveel couverts?', a: '9 à 10 voor twee.' }], verder: [['Koelkast', '/koelkast']], meet: { site: 'keuzehulp', hitPage: 'p' } };
const kaal = x => x.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
const h0 = sjabloonHtml(basis), h = kaal(h0);
const maten = new Set([...SJ_CSS.matchAll(/font-size:(\d+)px/g)].map(x => x[1]));
ok(maten.size <= 4, 'hoogstens 4 lettergroottes (' + [...maten].join(', ') + ')');
ok(!/#(6b7280|9ca3af|d1d5db|e5e7eb|f3f4f6|78716c|666|777|888|999)\b/i.test(h), 'geen grijs');
ok(!/font-weight:(500|600)/.test(SJ_CSS), 'alleen diktes 400 en 700');
ok((h.match(/class="sj-knop"/g) || []).length === 1, 'één zwarte knop op de pagina (de eerste keus)');
ok((h.match(/class="sj-pill"/g) || []).length === 3, 'hoogstens 3 pills');
ok(!/Name the best pick|What do you recommend|Wat raad je aan\?/i.test(h), 'geen interne opdracht in beeld');
ok(/noindex,follow/.test(h0), 'voorbeeld staat op noindex');
ok(!/class="kx[ "]|tafel|haak|mobi|kzux/.test(h), 'geen oude lagen (chat kx, tafel, haken, mobiliseren, proef)');
ok((h0.match(/<script/g) || []).length <= 3, 'hoogstens 3 scripts (ld, cm.js, eigen)');
ok(h.indexOf('id="sj-keus"') < h.indexOf('class="sj-pills"'), 'eerste keus staat boven de chat');
ok(!/<h2>[^<]*<\/h2>\s*<\/main>/.test(h), 'geen lege kop onderaan');
const zonder = kaal(sjabloonHtml(Object.assign({}, basis, { prods: [], keus: null, situaties: [{ situatie: 'a', keus: 'X' }, { situatie: 'b', keus: 'X' }] })));
ok(!/sj-rij/.test(zonder) && !/<table/.test(zonder), 'zonder producten geen lijst, tabel met één keus weg');
ok(kortNaam('Bosch SMS4HTW00E - Serie 4 - Vaatwasser - Vrijstaand') === 'Bosch SMS4HTW00E', 'korte productnaam');
ok(zinnen('Eén. Twee. Drie.', 2) === 'Eén. Twee.', 'twee zinnen');
const us = sjabloonHtml(Object.assign({}, basis, { taal: 'us', winkel: 'Amazon' }));
ok(/lang="en"/.test(us) && /See on Amazon/.test(us), 'Engelse teksten op whichtobuy');
console.log(fout ? fout + ' fout(en)' : 'alles goed'); process.exit(fout ? 1 : 0);
