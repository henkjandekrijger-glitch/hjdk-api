// Test van de Bijouxmode-feed (lib/bjx.js). Zonder argument: rekenregels, x,95, bovengrens, Waarborgwet en de vorm van een product
// uit een voorbeeld. Met --live: haalt de gekozen stukken echt op bij grossiste-bijouxmode.com en controleert elk product in de feed.
// Gebruik: node scripts/test-bjx.mjs [--live]
import { BJX_KEUZE, BJX_REGEL, bjxReken, bjxMarge, opX95, WAARBORG, leesPp, leesMaat, bjxNorm, eigenVerzend, bjxBouw, mandjeLink } from '../lib/bjx.js';

let fout = 0; const ok = (c, t) => { console.log((c ? 'ok   ' : 'FOUT ') + t); if (!c) fout++; };

ok(opX95(37.44) === 37.95 && opX95(36.95) === 36.95 && opX95(37.0) === 37.95 && opX95(26.01) === 26.95, 'afronden op x,95 (nooit lager dan nodig)');
ok(eigenVerzend() === 3.16, 'eigen deel verzending 8,90 - 6,95/1,21 = 3,16');
// hanger 1,29 + ketting 1,39 + gravure 6 + 2 x 2 dropship
const h = bjxReken({ delen: [{ prijs: 1.29, pp: 24.9, rol: 'hanger' }, { prijs: 1.39, pp: null, rol: 'ketting' }], gravure: { max: 16, gratis: false } });
ok(h.inkoop === 12.68 && h.prijs === 37.95 && h.marge >= 15 && h.ok, 'ketting met naam: inkoop 12,68, prijs 37,95, marge ' + h.marge + ' (grens ' + h.grens + ')');
const g = bjxReken({ delen: [{ prijs: 6.99, pp: 24.9, rol: 'hanger' }, { prijs: 1.39, pp: null, rol: 'ketting' }], gravure: { max: 20, gratis: true } });
ok(g.gravureKost === 0 && g.marge >= 15, 'gratis gravure telt niet in de inkoop (prijs ' + g.prijs + ', marge ' + g.marge + ')');
const zonder = bjxReken({ delen: [{ prijs: 2.99, pp: null, rol: 'armband' }], gravure: { max: 20 } });
ok(!zonder.ok && /adviesprijs/.test(zonder.reden[0]), 'zonder adviesprijs: weglaten');
const duur = bjxReken({ delen: [{ prijs: 9.99, pp: 14.9, rol: 'ketting' }] });
ok(!duur.ok && /boven de grens/.test(duur.reden[0]), 'boven 1,5 x adviesprijs: weglaten');
ok(bjxReken({ delen: [{ prijs: 30, pp: 80, rol: 'set' }] }).grens === 49.95, 'nooit boven 49,95');
ok(Math.abs(bjxMarge(37.95, 12.68) - (37.95 / 1.21 - 12.68 - 3.16 - 0.5)) < 0.01, 'marge = prijs/1,21 - inkoop - eigen verzending - betaalkosten');
ok(WAARBORG.test('Ketting 18k goud') && WAARBORG.test('gouden hart') && WAARBORG.test('verguld staal') && !WAARBORG.test('goudkleurig staal'), 'Waarborgwet-controle');
ok(BJX_KEUZE.every(k => !WAARBORG.test(k.titel)), 'geen titel met goud, gouden of 18k');
ok(new Set(BJX_KEUZE.map(k => k.id)).size === BJX_KEUZE.length, 'ids uniek (' + BJX_KEUZE.length + ' gekozen)');
ok(BJX_KEUZE.every(k => k.titel.length <= 80), 'titels kort (hooguit 80 tekens)');
ok(BJX_KEUZE.filter(k => k.hoek === 'naam').every(k => k.gravure && k.gravure.max > 0), 'elk stuk in Met naam heeft een gravure met tekstgrens');
const pp = leesPp('<p>Dimensions: 24*20*2 mm</p><p>Prix public constaté : 24.90€ à 29.90€</p>'); ok(pp && pp.van === 24.9 && pp.tot === 29.9, 'prix public constaté lezen');
ok(/39 cm/.test(leesMaat('Dimensions : 39 cm + 5 cm chainette réglable . Taille des pierres') || ''), 'maat lezen: ' + leesMaat('Dimensions : 39 cm + 5 cm chainette réglable . Taille des pierres'));
const n = bjxNorm({ handle: 'x', title: 'Pendentif acier', available: true, tags: ['Bijoux acier'], description: 'Prix public constaté : 14.90€ à 24.90€', images: ['//cdn.shopify.com/a.jpg?v=1'], variants: [{ id: 5, price: 129, available: true, weight: 1 }] });
ok(n.prijs === 1.29 && n.beelden[0] === 'https://cdn.shopify.com/a.jpg' && n.materiaal_ok && n.pp.tot === 24.9, 'Shopify-product omzetten (prijs uit centen, https-beeld)');
ok(!bjxNorm({ handle: 'y', title: 'Collier plaqué or', available: true, tags: [], description: '', images: [], variants: [{ price: 100, available: true }] }).materiaal_ok, 'verguld (plaqué or) valt af');
ok(bjxNorm({ handle: 'z', title: 'Pendentif acier à personnaliser plaque militaire or 35*25', available: true, tags: [], description: '', images: [], variants: [{ price: 129, available: true }] }).materiaal_ok, 'plaque militaire (plaatje) is geen verguld');
ok(mandjeLink([{ varianten: [[11, 1], [22, 1]] }, { varianten: [[11, 2]] }]) === 'https://grossiste-bijouxmode.com/cart/11:3,22:1', 'mandje-link telt varianten op');

if (process.argv.includes('--live')) {
  const t0 = Date.now(); const { producten, weg, stand } = await bjxBouw({ vers: true });
  console.log('live: ' + producten.length + ' in de feed, ' + weg.length + ' weggelaten, ' + Object.keys(stand.fouten).length + ' leesfouten, ' + (Date.now() - t0) + ' ms');
  for (const w of weg) console.log('  weg ' + w.id + ': ' + w.reden.join('; '));
  ok(producten.length >= 20, 'minstens 20 producten in de feed');
  for (const p of producten) {
    const e = [];
    if (!(p.prijs_kadoly <= BJX_REGEL.MAX_PRIJS)) e.push('prijs'); if (!(p.keur.marge >= 15)) e.push('marge'); if (!/\.95$/.test(p.prijs_kadoly.toFixed(2))) e.push('x,95');
    if (!p.beelden.length) e.push('geen beeld'); if (WAARBORG.test(p.titel + ' ' + p.omschrijving)) e.push('waarborg'); if (p.adviesprijs && p.prijs_kadoly > 1.5 * p.adviesprijs + 0.01) e.push('boven 1,5 x adviesprijs');
    if (p.gravure && !p.bjx.gravure_variant && !p.gravure.gratis_bij_leverancier) e.push('geen gravurevariant');
    ok(!e.length, p.id + ': inkoop ' + p.inkoop.toFixed(2) + ', prijs ' + p.prijs_kadoly.toFixed(2) + ', marge ' + p.keur.marge.toFixed(2) + (p.adviesprijs ? ', advies tot ' + p.adviesprijs.toFixed(2) : '') + (e.length ? ' [' + e.join(', ') + ']' : ''));
  }
}
console.log(fout ? fout + ' fout(en)' : 'alles goed'); process.exit(fout ? 1 : 0);
