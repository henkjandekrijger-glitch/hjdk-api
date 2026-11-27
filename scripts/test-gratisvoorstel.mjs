// Test van het voorstel voor de gratis vermeldingen (lib/gratisvoorstel.js, taak dxy7ri). Draai: node scripts/test-gratisvoorstel.mjs
import { analyseer, leesFeed, naarMarkt, voorstelHtml } from '../lib/gratisvoorstel.js';
const ok = (c, n) => { if (!c) { console.log('FOUT', n); process.exitCode = 1; } else console.log('ok', n); };

ok(naarMarkt(134.58) === 133.95 && naarMarkt(15) === 14.95 && naarMarkt(42.30) === 41.95, 'voorstelprijs net onder de markt op ,95');
const xml = `<rss><channel><item><g:id>a</g:id><g:title>Lamp A</g:title><g:brand>Kadoly</g:brand><g:gtin>4260000000001</g:gtin><g:google_product_category>1</g:google_product_category></item>
<item><g:id>b</g:id><g:title><![CDATA[Vaas B]]></g:title><g:brand>Kadoly</g:brand><g:identifier_exists>no</g:identifier_exists></item>
<item><g:id>c-1</g:id><g:title>Plaid C rood</g:title><g:brand>Lucca</g:brand><g:gtin>4260000000002</g:gtin><g:certification>x</g:certification></item></channel></rss>`;
const feed = leesFeed(xml);
ok(feed.length === 3 && feed[1].titel === 'Vaas B' && feed[1].idNee && feed[2].cert && feed[0].cat, 'feed lezen');
const a = analyseer({
  prest: { a: { gv: 10, gk: 1, bv: 500, bk: 5 }, b: { gv: 0, gk: 0, bv: 100, bk: 1 }, 'c-1': { gv: 2, gk: 0, bv: 0, bk: 0 } },
  perDag: { '2026-11-01': { gv: 0, gk: 0, bv: 10, bk: 0 }, '2026-11-02': { gv: 3, gk: 1, bv: 20, bk: 1 } },
  prijs: { a: { prijs: 60, benchmark: 40 }, b: { prijs: 30, benchmark: 29.9 }, 'c-1': { prijs: 10, benchmark: 20 }, d: { prijs: 100, benchmark: 50 } },
  feed, cat: [{ id: 'a', t: 'Lamp A', b: 'Lumo', mg: 30 }, { id: 'b', t: 'Vaas B', b: 'Kadoly', mg: 3 }, { id: 'c', t: 'Plaid C', b: 'Lucca', mg: 20 }, { id: 'd', t: 'Duur D', b: '', mg: 10 }]
});
ok(a.reeks.gratisVert28 === 3 && a.reeks.eersteDagMetGratisVertoning === '2026-11-02', 'reeks per dag');
ok(a.reeks.gratisVertPerProduct28 === 12 && a.reeks.gratisKliks28 === 1 && /Per product meldt Google maar 12 van deze 3/.test(voorstelHtml(a)), 'totaal per dag en het deel per product staan er allebei');
ok(/dat zijn er nu geen/.test(voorstelHtml(analyseer({ feed, cat: [] }))) && !/dat zijn er nu geen/.test(voorstelHtml(a)), 'geen merkvoorstel als de winkel geen ander merk kent');
ok(a.prijs.bak.duurder.n === 1 && a.prijs.bak.gelijk.n === 1 && a.prijs.bak.goedkoper.n === 1 && a.prijs.bak.duurder.gv === 10, 'prijsbakken tellen elk product uit feed of cijfers een keer');
const ra = a.prijs.rijen.find(r => r.id === 'a'), rd = a.prijs.rijen.find(r => r.id === 'd');
ok(ra.advies === 'naar marktprijs' && ra.nieuw === 39.95 && ra.margeNieuw === 9.95, 'naar markt met marge na verlaging');
ok(rd.advies === 'niet verlagen: marge te klein' && rd.nieuw === null, 'nooit onder EUR 5 marge');
ok(!a.prijs.rijen.some(r => r.id.includes('-')) && !a.prijs.rijen.some(r => r.id === 'b'), 'geen varianten en niets binnen 2%');
ok(a.prijs.naarMarkt === 1 && a.prijs.margeInleveringPerVerkoop === 20.05, 'telling voorstel');
ok(a.velden.merkKadoly === 2 && a.velden.merkKadolyMetGtin === 1 && a.merk.teCorrigeren === 1 && a.merk.rijen[0].nieuw === 'Lumo', 'merk Kadoly met GTIN van een ander merk');
const html = voorstelHtml(a, { at: '2026-11-27', fouten: [] });
ok(/Lamp A/.test(html) && /€ 39,95/.test(html) && /Lumo/.test(html) && !/—|–/.test(html), 'pagina toont oud naast nieuw, zonder gedachtestreepjes');
ok(/Niet gelukt: feed/.test(voorstelHtml(a, { fouten: ['feed: 500'] })), 'fouten staan op de pagina');
