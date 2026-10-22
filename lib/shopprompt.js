// Kant-en-klare opdracht voor Babita's Claude Code in de yoo.rs-shop (Henkjan 20 okt 2026: "zorg dat het voor haar kant en klare prompt is voor claude code").
// Live opgebouwd: de cijfers van de laatste 24 uur staan erin, zodat ze ziet wat er nu misgaat. Geen sleutels, geen persoonsgegevens.
export function shopPrompt({ tot = {}, lekLink = '', datum = '' } = {}) {
  const n = v => Number(v) || 0;
  return `Je werkt in de code van de Yoors Shop (yoo.rs, PHP). Voer de taken hieronder in deze volgorde uit. Lees per taak eerst de bestaande code, verander zo weinig mogelijk, test, en meld per taak in één zin wat je deed en hoe je het getest hebt.

Stand ${datum} (laatste 24 uur, gemeten door de campagne-lus): ${n(tot.paKliks)} betaalde kliks, ${n(tot.aangekomen)} aangekomen, ${n(tot.echt)} echte mensen op de productpagina, ${n(tot.tik)} tikken, ${n(tot.cart)} winkelwagens, ${n(tot.afreken)} op de afrekenpagina, ${n(tot.betaal)} betaling gestart, ${n(tot.koop)} betaald. PropellerAds krijgt de tikken en winkelwagens wel binnen; alles na de winkelwagen ontbreekt. Daarom kunnen de campagnes niet leren wat verkoopt.

Volgorde = prioriteit: de bovenste taak levert het meeste op.

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

TAAK 2 — Lokker: alleen nog controleren
De Uil Spaarpot (oc_4174004451622913) staat sinds 20 oktober overal op €9,95. Controleer alleen dat bij dit product en in de winkelwagen "Gratis verzending bij je eerste bestelling" staat en dat een eerste bestelling echt €0 verzendkosten krijgt.

TAAK 3 — Geen nepproducten voor Google
Google Merchant Center haalt naast onze feed ook zelf "producten" van yoo.rs op (automatische bron "yoo.rs"): 2.298 stuks, waarvan 1.385 afgekeurd. Het zijn vooral pagina's die geen shopproduct zijn, met titels als "Past bij dit artikel · prijs van vandaag bij bol" en "€62,50 · 0,0 · morgen in huis" (de bol-blokken op contentpagina's), plus enkele tabak- en levende-dierenpagina's. Zoek waar die pagina's JSON-LD van het type Product of Offer (of microdata itemtype Product) uitsturen buiten https://yoo.rs/product/<id> en haal dat weg: alleen echte shopproducten mogen Product-gegevens hebben. Bol-aanbevelingen en vergelijkingen zijn geen eigen product.

TAAK 4 — Google-crawlers doorlaten
59 productpagina's staan in Merchant Center als "Productpagina niet beschikbaar", terwijl ze voor een gewone browser werken. Controleer in CloudFront/WAF en de app dat Googlebot, Storebot-Google (de crawler van Merchant Center), Google-InspectionTool en AdsBot-Google altijd een 200 krijgen op /product/<id>, zonder rate limit, captcha of 403. Controleer bijvoorbeeld https://yoo.rs/product/oc_4174004362575874?lang=nl met de URL-inspectie in Search Console.

TAAK 5 — Bestellingen in de datapagina
De datapagina https://yoo.rs/shop/api/lus-feed (header X-Lus-Key) geeft producten, maar "orders" is leeg. Vul "orders" met alle bestellingen van de laatste 30 dagen, ook onbetaalde, met: order_id, created_at, paid_at, product_id, quantity, amount, hj (het opgeslagen kenmerk), status (paid, open, expired, cancelled, refunded) en payment_method. Geen naam, e-mail of adres. Klaar als https://keuzehulp.best/api/shop/feedcheck bij "bestellingen" meer dan 0 laat zien.

TAAK 6 — Productgegevens voor Google Shopping
Zet op elke productpagina volledige JSON-LD van het type Product met: name, image, description, brand, sku (het product-id), offers met price, priceCurrency EUR, availability, url, shippingDetails (verzendkosten naar NL en levertijd in dagen) en hasMerchantReturnPolicy (14 dagen, NL). Dan kan Google prijzen zelf bijwerken en verzending en retour bij de producten laten zien. Controleer één pagina met https://search.google.com/test/rich-results .

TAAK 7 — Sitemap: alleen nog controleren
/sitemap.xml werkt en staat in robots.txt. Controleer dat alle productpagina's (https://yoo.rs/product/<id>?lang=nl) erin staan met lastmod, en dat nieuwe producten er vanzelf bij komen.

TAAK 8 — Productpagina die mensen vasthoudt
Van de bezoekers via advertenties is maar ${n(tot.aangekomen) ? Math.round(n(tot.echt) / n(tot.aangekomen) * 100) : 4}% een echt mens die blijft (doel 15%). Dezelfde advertentieplekken geven op onze eigen pagina's 33% echte mensen: het lek zit op de productpagina van yoo.rs, niet in het verkeer. Doe dit, en meet vóór en na met PageSpeed Insights (mobiel) en de lekkenpagina:
1. Meten: cm.js meet dit sinds 21 oktober zelf (tabel "Gedrag op de pagina" op de lekkenpagina): pagina geladen, 1 s in beeld, 5/15/30/60/180 seconden gekeken, scrollen 25/50/90%, tik op foto, variant of aantal, bewaren, vergelijken, delen, chat, bundel gezien en bundel-tik, tik op Bestellen/winkelwagen, afrekenknop, winkelwagen- en afrekenpagina, 2 of 4+ pagina's, en of iemand terugkomt. Verander de id's buy-btn, bb-sticky-buy, bundle-card, bundle-go, gal-save en compare-btn niet zonder het te melden; daar haakt de meting op in. Zet op nieuwe knoppen of blokken die je wilt laten meten data-cm="<naam>".
2. Snel: het productblok (foto, naam, prijs, knop) zit direct in de HTML die de server stuurt, niet pas na JavaScript. Eén hoofdfoto van 800 pixels breed, WebP, kleiner dan 80 kB, met fetchpriority="high". Chat, spel, punten, trackers en andere scripts pas laden nadat de pagina zichtbaar is (defer, of na het load-event). Cache de HTML van productpagina's in CloudFront. Doel: eerste inhoud binnen 1 seconde op 4G.
3. Bovenaan precies wat de advertentie beloofde: dezelfde foto en prijs (Uil €9,95), "Gratis verzending bij je eerste bestelling", levertijd als datum ("Vandaag besteld, vrijdag in huis") en een grote knop "In winkelwagen" die onderaan in beeld blijft (sticky).
4. Niets ervoor: geen pop-up, inlogvraag, spel of punten, en geen cookiemuur die de pagina blokkeert (een smalle balk onderaan is genoeg). Geen nieuwsbrief-pop-up in de eerste 30 seconden.
5. Vertrouwen naast de knop: iDEAL-logo, "14 dagen bedenktijd", "verzonden vanuit NL", contact, en echte reviews als die er zijn.
6. Eerlijk prijsanker: "elders €35,50" alleen waar dat gecontroleerd is (veld lokker of de prijsradar).
7. Eén keuze: geen groot menu bovenaan op mobiel; andere producten en de bundel pas onder de knop.
8. Afrekenen zonder account: iDEAL bovenaan, Apple Pay en Google Pay erbij, adres via postcode en huisnummer.
9. Wie terugkomt ziet zijn winkelwagen terug (30 tot 55% klikt binnen 10 minuten opnieuw op de advertentie).
10. Klaar als op de lekkenpagina per uur minstens 60% "pagina geladen", 15% echt mens en 3% tik staat.

TAAK 9 — Toestemming voor advertenties (remarketing)
Clickmind kan echte bezoekers (geen bots) later opnieuw bereiken via een PropellerAds-publiek, bijvoorbeeld wie op Bestellen tikte maar niet betaalde. In Nederland mag dat alleen na toestemming. De cookiebalk vraagt nu alleen toestemming voor statistiek (a1 in de cookie yoors_consent). Doe dit:
1. Voeg in de cookiebalk een aparte keuze "Advertenties" toe (standaard uit). Bij ja: zet m1 in yoors_consent (bij nee m0) en stuur het event yoors:consent met detail.marketing = true of false, net zoals nu detail.analytics.
2. Zet in /shop/privacy en /shop/cookies dat bezoekers die toestemming geven voor advertenties in een publiek van PropellerAds kunnen komen om later advertenties van Yoors te zien, 90 dagen bewaard, en dat je dit intrekt via de cookiebalk.
3. Test: geef toestemming voor advertenties op https://yoo.rs/shop/?hj=test1020 en controleer dat de cookie yoors_consent m1 bevat.

Werkwijze: commit per taak met een duidelijke boodschap. Zet nooit sleutels in code of commits. Lukt een taak niet, schrijf dan precies wat er misgaat en ga door met de volgende.`;
}
