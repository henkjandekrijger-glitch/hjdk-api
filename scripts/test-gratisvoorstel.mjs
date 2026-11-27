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

// taak s397p7: de lijst voor de winkel met elk product met merk Kadoly en een GTIN, en de aanwijzing uit de feed
import { gtinBegin } from '../lib/gratisvoorstel.js';
ok(gtinBegin('8712345678906') === '8712345' && gtinBegin('712345678906') === '0712345' && gtinBegin('18712345678903') === '8712345', 'begin van de code als GTIN-13');
const xml2 = `<item><g:id>k1</g:id><g:title>Lamp K1</g:title><g:brand>Kadoly</g:brand><g:gtin>8712345000011</g:gtin></item>
<item><g:id>k2</g:id><g:title>Lamp K2</g:title><g:brand>Kadoly</g:brand><g:gtin>8712345000028</g:gtin></item>
<item><g:id>k3</g:id><g:title>Vaas K3</g:title><g:brand>Kadoly</g:brand><g:gtin>4009999000017</g:gtin></item>
<item><g:id>k4</g:id><g:title>Kom K4</g:title><g:brand>Kadoly</g:brand></item>
<item><g:id>m1</g:id><g:title>Pot M1</g:title><g:brand>Mica</g:brand><g:gtin>8712345000035</g:gtin></item>
<item><g:id>m2</g:id><g:title>Pot M2</g:title><g:brand>Mica</g:brand><g:gtin>8712345000042</g:gtin></item>
<item><g:id>t1</g:id><g:title>Pot T1</g:title><g:brand>Tavo</g:brand><g:gtin>8712345000059</g:gtin></item>`;
const a2 = analyseer({ feed: leesFeed(xml2), cat: [], prest: { k3: { bv: 7, gv: 1 } } });
const ng = a2.merk.nagaan;
ok(ng.length === 3 && a2.velden.merkKadolyMetGtin === 3 && !ng.some(r => r.id === 'k4'), 'lijst = elk product met merk Kadoly en een GTIN');
ok(ng[0].id === 'k1' && ng[0].samen === 2 && ng[0].lijktOp[0][0] === 'Mica' && ng[0].lijktOp[0][1] === 2 && ng[0].lijktOp[1][0] === 'Tavo', 'aanwijzing: merk van andere producten met hetzelfde begin, meeste eerst');
ok(ng[2].id === 'k3' && ng[2].lijktOp.length === 0 && a2.merk.metAanwijzing === 2 && a2.merk.teCorrigeren === 0, 'zonder aanwijzing achteraan, en het is geen voorstel');
const h2 = voorstelHtml(a2);
ok(/Na te gaan door de winkel: 3 producten/.test(h2) && /<b>Mica<\/b> \(2\)/.test(h2) && /geen ander merk met dit begin/.test(h2) && /7 \/ 1/.test(h2) && !/—|–/.test(h2), 'pagina toont de lijst met code, aanwijzing en vertoningen');
ok(!/Na te gaan door de winkel/.test(voorstelHtml({ ...a2, merk: { teCorrigeren: 0, rijen: [] } })), 'oude bewaarde stand zonder lijst geeft geen fout');
