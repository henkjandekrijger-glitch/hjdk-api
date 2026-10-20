// Kant-en-klare opdracht voor Babita's Claude Code in de yoo.rs-shop (Henkjan 20 okt 2026: "zorg dat het voor haar kant en klare prompt is voor claude code").
// Live opgebouwd: de cijfers van de laatste 24 uur staan erin, zodat ze ziet wat er nu misgaat. Geen sleutels, geen persoonsgegevens.
export function shopPrompt({ tot = {}, lekLink = '', datum = '' } = {}) {
  const n = v => Number(v) || 0;
  return `Je werkt in de code van de Yoors Shop (yoo.rs, PHP). Voer de taken hieronder in deze volgorde uit. Lees per taak eerst de bestaande code, verander zo weinig mogelijk, test, en meld per taak in één zin wat je deed en hoe je het getest hebt.

Stand ${datum} (laatste 24 uur, gemeten door de campagne-lus): ${n(tot.paKliks)} betaalde kliks, ${n(tot.aangekomen)} aangekomen, ${n(tot.echt)} echte mensen op de productpagina, ${n(tot.tik)} tikken, ${n(tot.cart)} winkelwagens, ${n(tot.afreken)} op de afrekenpagina, ${n(tot.betaal)} betaling gestart, ${n(tot.koop)} betaald. PropellerAds krijgt de tikken en winkelwagens wel binnen; alles na de winkelwagen ontbreekt. Daarom kunnen de campagnes niet leren wat verkoopt.

TAAK 1 — Afrekenmeldingen (belangrijkste)
1. Download https://keuzehulp.best/api/shop/babita (yoors-shop-conversies.php, versie 2) en zet hem in de shop. Bestaat er al een oudere ShopConversies-klasse: vervang die.
2. Roep aan:
   - ShopConversies::onthoud($_GET) op elke pagina, vóór er uitvoer is;
   - ShopConversies::winkelwagen() als iets in de winkelwagen gaat (staat er waarschijnlijk al);
   - ShopConversies::afrekenen() als de afrekenpagina opent;
   - bij "betalen": $kenmerk = ShopConversies::voorOrder(); sla $kenmerk op bij de order (eigen kolom of JSON-veld), en roep ShopConversies::betaalStart($orderId, $bedrag, $kenmerk, $methode) aan;
   - als een betaling mislukt, wordt afgebroken of verloopt: ShopConversies::betaalMislukt($orderId, $kenmerk, $methode, $reden);
   - op de ENE centrale plek waar een order de status betaald krijgt (de webhook of statusafhandeling van de betaalprovider), voor ELKE methode, ook iDEAL: ShopConversies::betaald($orderId, $bedrag, $kenmerkUitDeOrder, $methode). Niet alleen in de PayPal-code.
   In een webhook is er geen cookie: geef altijd het kenmerk mee dat bij de order is opgeslagen.
3. Test: open https://yoo.rs/shop/?hj=test1020, leg een product in de winkelwagen, open afrekenen, start een iDEAL-betaling en breek die één keer af en rond die één keer af. Binnen het uur moet op ${lekLink || 'de lekkenpagina'} bij afrekenen, betaling gestart, mislukt en betaald een tijd van de laatste melding staan.

TAAK 2 — Bestellingen in de datapagina
De datapagina https://yoo.rs/shop/api/lus-feed (header X-Lus-Key) geeft producten, maar "orders" is leeg. Vul "orders" met alle bestellingen van de laatste 30 dagen, ook onbetaalde, met: order_id, created_at, paid_at, product_id, quantity, amount, hj (het opgeslagen kenmerk), status (paid, open, expired, cancelled, refunded) en payment_method. Geen naam, e-mail of adres. Klaar als https://keuzehulp.best/api/shop/feedcheck bij "bestellingen" meer dan 0 laat zien.

TAAK 3 — Prijs van de lokker zichtbaar voor iedereen
De 3D Houten Uil Spaarpot (oc_4174004451622913) moet €9,95 kosten. Uitgelogd toont https://yoo.rs/product/oc_4174004451622913?lang=nl nog €16,59 (ook in de JSON-LD en in https://yoo.rs/shop/api/shop). De advertentie zegt al €9,95. Zet de prijs zo dat hij overal €9,95 is: productpagina uitgelogd, JSON-LD, shop-API en datapagina. Toon bij dit product en in de winkelwagen duidelijk "Gratis verzending bij je eerste bestelling", en zorg dat de verzendkosten bij een eerste bestelling echt €0 zijn.

TAAK 4 — Sitemap voor Google en Bing
https://yoo.rs/sitemap.xml werkt niet (Bing meldt "Failed") en robots.txt noemt geen sitemap. Maak /sitemap.xml met alle productpagina's (https://yoo.rs/product/<id>?lang=nl, met lastmod) en de shoppagina's, en zet in https://yoo.rs/robots.txt een regel: Sitemap: https://yoo.rs/sitemap.xml . Laat de bestaande sitemap-image-index.xml staan.

TAAK 5 — Productgegevens voor Google Shopping
Zet op elke productpagina volledige JSON-LD van het type Product met: name, image, description, brand, sku (het product-id), offers met price, priceCurrency EUR, availability, url, shippingDetails (verzendkosten naar NL en levertijd in dagen) en hasMerchantReturnPolicy (14 dagen, NL). Dan kan Google prijzen zelf bijwerken en verzending en retour bij de producten laten zien. Controleer één pagina met https://search.google.com/test/rich-results .

TAAK 6 — Productpagina die mensen vasthoudt
Van de bezoekers via advertenties is maar ${n(tot.aangekomen) ? Math.round(n(tot.echt) / n(tot.aangekomen) * 100) : 4}% een echt mens die blijft (doel 15%). Zorg dat op mobiel binnen 1 seconde foto, naam, prijs inclusief verzending en de knop "In winkelwagen" zichtbaar zijn, zonder pop-up, spel, inlogvraag of cookiemuur ervoor. Meet met PageSpeed Insights (mobiel) vóór en na, en meld beide scores.

Werkwijze: commit per taak met een duidelijke boodschap. Zet nooit sleutels in code of commits. Lukt een taak niet, schrijf dan precies wat er misgaat en ga door met de volgende.`;
}
