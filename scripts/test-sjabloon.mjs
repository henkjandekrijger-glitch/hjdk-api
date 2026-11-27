// Controle van het nieuwe sjabloon (lib/sjabloon.js): rust, geen grijs, één hoofdknop, geen interne opdracht in beeld.
// Draai: node scripts/test-sjabloon.mjs
import { sjabloonHtml, SJ_CSS, kortNaam, zinnen, zinLijst } from '../lib/sjabloon.js';
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
ok(zinLijst('Meist reicht 1 kWh mit 1.500 bis 2.000 W. Ein Gerät mit 100 W läuft an 1.024 Wh rund 8 Stunden.').length === 2, 'getallen breken geen zin');
ok(zinnen('Het vermogen ligt tussen 1.200 en 1.700 watt. Kies 4,5 liter.', 1) === 'Het vermogen ligt tussen 1.200 en 1.700 watt.', 'eerste zin met getallen heel');
const us = sjabloonHtml(Object.assign({}, basis, { taal: 'us', winkel: 'Amazon' }));
ok(/lang="en"/.test(us) && /See on Amazon/.test(us), 'Engelse teksten op whichtobuy');
// dagronde 27 nov 2026: FAQ-volgorde, JSON-LD alleen zichtbare vragen, aanvulling uit de repo
const vijf = Array.from({ length: 7 }, (_, i) => ({ q: 'Vraag ' + i + '?', a: 'Antwoord ' + i + '.' })).concat([{ q: 'Zoekvraag?', a: 'Uit Search Console.', bron: 'search-console' }]);
const ldObj = { '@context': 'https://schema.org', '@graph': [{ '@type': 'Article', headline: 'x' }, { '@type': 'FAQPage', mainEntity: vijf.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] };
const hf = sjabloonHtml(Object.assign({}, basis, { faq: vijf, jsonld: ldObj })); const ldUit = JSON.parse(hf.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const fq = ldUit['@graph'].find(n => n['@type'] === 'FAQPage').mainEntity.map(x => x.name); const zichtbaar = [...kaal(hf).matchAll(/<summary>([^<]*)<\/summary>/g)].map(x => x[1]);
ok(fq.length === 5 && fq.every((q, i) => q === zichtbaar[i]), 'JSON-LD FAQ = de zichtbare vragen (' + fq.length + ')');
ok(zichtbaar[0] === 'Zoekvraag?', 'vraag uit Search Console staat eerst');
const hh = sjabloonHtml(Object.assign({}, basis, { faq: vijf, ldHtml: '<script type="application/ld+json">' + JSON.stringify(ldObj) + '</script>' }));
ok(JSON.parse(hh.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'][1].mainEntity.length === 5, 'ook via ldHtml (keuzehulp.best)');
const { vulAan, AANVULLING } = await import('../lib/aanvulling.js');
const sl = Object.keys(AANVULLING.de)[0]; const va = vulAan('de', [{ slug: sl, faq: [{ q: 'Alt?', a: 'x' }] }, { slug: 'ander', faq: [] }]);
ok(va[0].faq.length === 2 && va[0].faq[0].voor && va[1].faq.length === 0, 'aanvulling komt vooraan bij de juiste pagina');
ok(vulAan('de', va)[0].faq.length === 2, 'aanvulling niet dubbel');
ok(Object.values(AANVULLING).every(s => Object.values(s).every(x => (x.faq || []).every(f => f.bron && /^https:\/\//.test(f.bron) && !/[\u2013\u2014]/.test(f.a)))), 'aanvulling: elke vraag met bron, geen gedachtestreepjes');
const hv = kaal(sjabloonHtml(Object.assign({}, basis, { pillVraag: 'Hoe breed is de nis?' })));
ok(/<h2>Hoe breed is de nis\?<\/h2><div class="sj-pills">/.test(hv) && !/Twijfel je/.test(hv), 'vraag bij de pills staat als kop');
ok(/<h2>Twijfel je\? Vraag het<\/h2>/.test(h), 'zonder vraag de gewone kop');
// advies per mail (taak 3fts1f, lib/adviesmail.js): tweede tekst op de volgknop als proef, schakelaar standaard uit
const SJ2 = await import('../lib/sjabloon.js'); const js = h0.match(/<script>window\.__SJ[\s\S]*?<\/script>/)[0];
ok(SJ2.SJ_TEKST.nl.adv === 'Stuur mij dit advies per mail' && SJ2.SJ_TEKST.us.adv === 'Email me this advice' && SJ2.SJ_TEKST.de.adv === 'Schick mir diesen Rat per Mail', 'tweede tekst in NL, EN en DE');
ok(SJ2.SJ_TEKST.nl.volg === 'Volg {term} in je ochtendmail', 'oude tekst blijft ongewijzigd');
ok(/AM\.arm===.b.\?C\.t\.adv:C\.t\.volg/.test(js), 'zonder schakelaar (arm null) toont de knop de oude tekst');
ok(/op=adviestekst/.test(js) && /\.catch\(function\(\)\{return null\}\)/.test(js), 'schakelaar wordt op de server gelezen; een fout geeft de oude tekst');
ok(/setTimeout\(function\(\)\{r\(null\)\},1500\)/.test(js) && !/a:AM\.a/.test(js), 'de chat wacht hooguit 1500 ms op de proef en stuurt geen antwoord mee naar de server');
ok(/advHit\('getoond'\)/.test(js) && /advHit\('getikt'\)/.test(js) && /advHit\('adres'\)/.test(js), 'tellen per tekst: getoond, getikt, adres');
ok(/"adv":"Stuur mij dit advies per mail"/.test(h0), 'tekst staat in de pagina-config');
try { new Function(js.slice(8, -9)); ok(true, 'client-js is geldig'); } catch (e) { ok(false, 'client-js is geldig: ' + e.message); }
console.log(fout ? fout + ' fout(en)' : 'alles goed'); process.exit(fout ? 1 : 0);
