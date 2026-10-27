// Kant-en-klare opdracht voor Babita's Claude Code in de yoo.rs-shop (Henkjan 20 okt 2026: "zorg dat het voor haar kant en klare prompt is voor claude code").
// Live opgebouwd: de cijfers van de laatste 24 uur staan erin, zodat ze ziet wat er nu misgaat. Geen sleutels, geen persoonsgegevens.
export function shopPrompt({ tot = {}, lekLink = '', datum = '' } = {}) {
  const n = v => Number(v) || 0;
  return `Je werkt in de code van de Yoors Shop (yoo.rs, PHP). Voer de taken hieronder in deze volgorde uit. Lees per taak eerst de bestaande code, verander zo weinig mogelijk, test, en meld per taak in één zin wat je deed en hoe je het getest hebt.

Stand ${datum} (laatste 24 uur, gemeten door de campagne-lus): ${n(tot.paKliks)} betaalde kliks, ${n(tot.aangekomen)} aangekomen, ${n(tot.echt)} echte mensen op de productpagina, ${n(tot.tik)} tikken, ${n(tot.cart)} winkelwagens, ${n(tot.afreken)} op de afrekenpagina, ${n(tot.betaal)} betaling gestart, ${n(tot.koop)} betaald. PropellerAds krijgt de tikken en winkelwagens wel binnen; alles na de winkelwagen ontbreekt. Daarom kunnen de campagnes niet leren wat verkoopt.

Volgorde = prioriteit: de bovenste taak levert het meeste op.

TAAK 0 — Afrekenpagina: de lekken die er nu in zitten (eerst doen)
Gemeten 22 oktober: 6 bezoekers op de afrekenpagina, 0 betalingen gestart. Gast-afrekenen werkt al (account is een vinkje, goed zo). Wat er wel mis is, op /shop/checkout/<id>:
1. Adresvelden zonder autocomplete: f-name, f-street, f-zip, f-city, f-country en f-phone hebben geen autocomplete- en geen name-attribuut. De browser vult dan verkeerd in; bij een echte test kwam de postcode in "Straat + huisnummer" en een andere postcode in "Postcode". Zet autocomplete="name", "address-line1", "postal-code", "address-level2", "country" en "tel", inputmode="numeric" waar het past, en geef elk veld een name.
2. Postcode + huisnummer eerst, straat en plaats vullen zich vanzelf (PostcodeAPI of PDOK, gratis). Controleer dat Straat een huisnummer bevat en dat de postcode 4 cijfers + 2 letters is, met een duidelijke melding bij het veld, niet pas na Betalen.
3. Taal: een cookieloze aanvraag geeft Engels (lang="en", "Pay", "Price summary"), en Henkjan kreeg zelf ook de Engelse versie. De knop Naar afrekenen linkt zonder lang. Neem de taal van de productpagina mee (?lang=nl in de link, of uit de sessie) en val voor NL-bezoekers terug op Nederlands. Ook de productnaam op de afrekenpagina in het Nederlands (nu "3D DIY House Kit The Green Grocery for Craft Lovers" terwijl de advertentie en productpagina Nederlands zijn).
4. "Bewaar dit adres" en "Maak dit mijn standaardadres" staan vooraf aangevinkt, ook voor een gast zonder account. Alleen tonen als iemand een account maakt of ingelogd is, en dan niet vooraf aangevinkt.
5. Betaalknop: "Betaal €28,99 met iDEAL" in plaats van "Pay", en op mobiel ook onderaan, na de betaalmethode, in beeld (sticky). Nu staat Betalen in het overzicht bovenaan, vóór het formulier.
6. "Kortingscode?" naast de betaalknop laat mensen weggaan om een code te zoeken. Klein onderaan zetten of alleen tonen als iemand via een link met code komt.
7. Apple Pay en Google Pay toevoegen (bij Mollie of Stripe een vinkje); op mobiel de snelste route.
8. Vertrouwen bij de knop: "14 dagen bedenktijd, gratis retour" (staat nu alleen elders), "Vragen? WhatsApp" en de review-score als die er is.
9. Wie zijn e-mail invult maar niet betaalt: na 1 uur één herinneringsmail met de winkelwagen en een link terug (alleen als hij afrekenen startte; afmelden kan).
10. Meten: de afrekenpagina meldt nog geen betaalstart (TAAK 1). Zonder die melding zien we niet of mensen bij Betalen, bij de bank of bij het formulier afhaken.
Test op een telefoon in een privévenster: https://kadoly.com/product/oc_4174004346978305?lang=nl&hj=test1020, Naar afrekenen, laat de telefoon het adres invullen en controleer dat alles in het goede veld staat en de pagina Nederlands is.

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
3. Test: open https://kadoly.com/shop/?hj=test1020, leg een product in de winkelwagen, open afrekenen, start een iDEAL-betaling en breek die één keer af en rond die één keer af. Binnen het uur moet op ${lekLink || 'de lekkenpagina'} bij afrekenen, betaling gestart, mislukt en betaald een tijd van de laatste melding staan.

TAAK 2 — Lokker: alleen nog controleren
De Uil Spaarpot (oc_4174004451622913) staat sinds 20 oktober overal op €9,95. Controleer alleen dat bij dit product en in de winkelwagen "Gratis verzending bij je eerste bestelling" staat en dat een eerste bestelling echt €0 verzendkosten krijgt.

TAAK 3 — Geen nepproducten voor Google
Google Merchant Center haalt naast onze feed ook zelf "producten" van yoo.rs op (automatische bron "yoo.rs"): 2.298 stuks, waarvan 1.385 afgekeurd. Het zijn vooral pagina's die geen shopproduct zijn, met titels als "Past bij dit artikel · prijs van vandaag bij bol" en "€62,50 · 0,0 · morgen in huis" (de bol-blokken op contentpagina's), plus enkele tabak- en levende-dierenpagina's. Zoek waar die pagina's JSON-LD van het type Product of Offer (of microdata itemtype Product) uitsturen buiten https://kadoly.com/product/<id> en haal dat weg: alleen echte shopproducten mogen Product-gegevens hebben. Bol-aanbevelingen en vergelijkingen zijn geen eigen product.

TAAK 4 — Google-crawlers doorlaten
59 productpagina's staan in Merchant Center als "Productpagina niet beschikbaar", terwijl ze voor een gewone browser werken. Controleer in CloudFront/WAF en de app dat Googlebot, Storebot-Google (de crawler van Merchant Center), Google-InspectionTool en AdsBot-Google altijd een 200 krijgen op /product/<id>, zonder rate limit, captcha of 403. Controleer bijvoorbeeld https://kadoly.com/product/oc_4174004362575874?lang=nl met de URL-inspectie in Search Console.

TAAK 5 — Bestellingen in de datapagina
De datapagina https://kadoly.com/shop/api/lus-feed (header X-Lus-Key) geeft producten, maar "orders" is leeg. Vul "orders" met alle bestellingen van de laatste 30 dagen, ook onbetaalde, met: order_id, created_at, paid_at, product_id, quantity, amount, hj (het opgeslagen kenmerk), status (paid, open, expired, cancelled, refunded) en payment_method. Geen naam, e-mail of adres. Klaar als https://keuzehulp.best/api/shop/feedcheck bij "bestellingen" meer dan 0 laat zien.

TAAK 6 — Productgegevens voor Google Shopping
Zet op elke productpagina volledige JSON-LD van het type Product met: name, image, description, brand, sku (het product-id), offers met price, priceCurrency EUR, availability, url, shippingDetails (verzendkosten naar NL en levertijd in dagen) en hasMerchantReturnPolicy (14 dagen, NL). Dan kan Google prijzen zelf bijwerken en verzending en retour bij de producten laten zien. Controleer één pagina met https://search.google.com/test/rich-results .

TAAK 7 — Sitemap: alleen nog controleren
/sitemap.xml werkt en staat in robots.txt. Controleer dat alle productpagina's (https://kadoly.com/product/<id>?lang=nl) erin staan met lastmod, en dat nieuwe producten er vanzelf bij komen.

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
3. Test: geef toestemming voor advertenties op https://kadoly.com/shop/?hj=test1020 en controleer dat de cookie yoors_consent m1 bevat.

TAKEN 10 TOT 15 — De bezoeker helpen met wat hij al deed (gedragseconomie, eerlijk)
Elke dag komen honderden mensen op de shop en laten gedrag achter. Gebruik dat voor henzelf: minder zoeken, minder twijfel, betere keuze. Regels die voor alle zes gelden:
- Alleen echte gegevens. Geen verzonnen aantallen, geen "nog maar 2" tenzij de voorraad echt 2 is, geen aftelklokken, geen nepkorting.
- Niets vooraf aangevinkt dat geld kost. Geen schuldgevoel-knoppen ("Nee, ik wil geen korting"). Alles is met één tik weg te klikken.
- Wat op het toestel van de bezoeker blijft (localStorage of een eigen cookie van yoo.rs) en niet naar een ander gaat, is een functie van de winkel; daar is geen extra toestemming voor nodig. Gaat het naar een derde partij, dan valt het onder TAAK 9.
- Meting: zet data-cm-zicht="<naam>" op het blok (telt als het half in beeld komt) en data-cm="<naam>" op de knop (telt een tik). Gebruik precies de namen hieronder; cm.js en de lekkenpagina tellen ze per uur.

TAAK 10 — Verder waar je was (wie terugkomt, hoeft niet opnieuw te zoeken)
Waarom: na een eerste bezoek is de zoekmoeite het grootste obstakel; wie terugkomt (30 tot 55% klikt binnen 10 minuten opnieuw) wil verder, niet opnieuw beginnen. Een onafgemaakte keuze trekt (Zeigarnik), en wat je al gekozen had, voelt al een beetje van jou.
1. Bewaar in localStorage (sleutel yoors_recent) de laatste 8 bekeken product-id's met tijd, plus gekozen variant en aantal. Geen account of inlog nodig.
2. Bij een volgend bezoek: bovenaan de shop en op elke productpagina, onder de koopknop, een smalle balk "Verder waar je was" met de laatst bekeken producten (foto, naam, actuele prijs). Was er iets in de winkelwagen: "Je winkelwagen staat nog klaar" met één tik naar afrekenen.
3. Is de prijs sinds het vorige bezoek gedaald, zet dat erbij met het echte oude en nieuwe bedrag. Gestegen: gewoon de nieuwe prijs, geen melding.
4. Een kruisje haalt de balk weg en wist yoors_recent.
Meting: data-cm-zicht="verderzicht" op de balk, data-cm="verder" op elk product of de winkelwagenlink erin.

TAAK 11 — Echte drukte (laten zien wat anderen echt doen)
Waarom: bij een onbekende winkel kijken mensen naar wat anderen doen (sociaal bewijs). Echte cijfers geven vertrouwen; verzonnen cijfers ontdekken mensen en dan is het vertrouwen weg.
1. Tel uit je eigen gegevens per product: bekeken vandaag (unieke bezoekers, bots eruit) en besteld in de laatste 7 dagen (betaald).
2. Toon onder de prijs één regel, alleen boven een drempel: "18 mensen bekeken dit vandaag" vanaf 10, "3 keer besteld deze week" vanaf 2 bestellingen. Onder de drempel: niets tonen. Rond naar beneden af.
3. In de lijst en zoekresultaten: een klein label "Populair deze week" bij de top 10% op bestellingen (geen label als er nog geen bestellingen zijn).
4. Cijfers hooguit een uur oud, uit de cache.
Meting: data-cm-zicht="drukte" op de regel.

TAAK 12 — Anderen kozen ook (kiezen makkelijker maken)
Waarom: te veel keuze doet mensen afhaken. Wat bezoekers met dezelfde interesse daarna bekeken of kochten, is de beste korte lijst.
1. Bereken elke nacht per product de 4 producten die bezoekers van dat product in dezelfde sessie het vaakst ook bekeken, bewaarden of kochten (bestellingen tellen drie keer zo zwaar). Minimaal 5 gedeelde bezoekers, anders vul je aan met producten uit dezelfde categorie in dezelfde prijsband.
2. Toon ze onder de koopknop als "Wie dit bekeek, koos ook" met foto, prijs en levertijd. Hooguit 4, horizontaal te vegen.
Meting: data-cm="ookgekozen" op elk product in het blok.

TAAK 13 — Zekerheid op het moment van twijfel
Waarom: wie op Bestellen tikt maar niet doorgaat, twijfelt meestal over de totaalprijs, de levertijd of het risico. Verlies weegt zwaarder dan winst, dus haal het risico weg met feiten, niet met druk.
1. cm.js zet in sessionStorage cmSeg = "warm" na een tik op Bestellen of de winkelwagenpagina, en "heet" op de afrekenpagina. Is cmSeg warm en is de bezoeker 20 seconden later niet op afrekenen (of gaat hij terug naar de productpagina), toon dan één keer per sessie een rustig blok bij de knop: totaalprijs inclusief verzending als één bedrag, levertijd als datum ("Vandaag besteld, vrijdag in huis"), "14 dagen bedenktijd, gratis retour" als dat zo is, iDEAL, en "verzonden vanuit NL".
2. Geen pop-up over de pagina, geen extra korting als lokmiddel, geen klok.
3. Laat de hele prijs al op de productpagina zien (inclusief verzending), zodat er bij afrekenen niets bijkomt.
Meting: data-cm-zicht="zeker" op het blok.

TAAK 14 — Slimme set als duidelijke keuze
Waarom: mensen nemen vaak de voorgestelde optie (standaardeffect) en vergelijken met wat ze als eerste zien (anker). Gebruik dat alleen als de set de bezoeker echt iets oplevert.
1. Toon de bundel alleen als hij goedkoper is dan de losse producten samen, met het echte verschil in euro ("samen €4,10 goedkoper"). Neem de producten voor de bundel uit TAAK 12 (wat mensen echt samen kiezen).
2. De losse aankoop blijft de standaard en staat bovenaan; de bundel is een tweede, even grote knop. Niets vooraf aangevinkt.
3. Toon drie aantallen als het product per stuk goedkoper wordt (1, 2 of 3), met de prijs per stuk.
Meting: bestaand (bundle-card, bundle-go); zet data-cm="keuze" op de aantal-knoppen als ze geen data-qty hebben.

TAAK 15 — Seintje als het beter wordt (alleen als de bezoeker erom vraagt)
Waarom: een kleine, vrije stap ("laat het me weten") is makkelijker dan nu kopen, en de bezoeker komt terug op een moment dat het voor hem beter is.
1. Onder de koopknop een tekstlink "Stuur me een seintje bij een lagere prijs of als het weer op voorraad is". Eén veld: e-mail. Geen vooraf aangevinkte nieuwsbrief.
2. Stuur alleen een mail bij een echte prijsdaling van minstens 5% of als het product weer leverbaar is, hooguit één mail per product, met een afmeldlink. Bewaar de aanmelding hooguit 90 dagen.
3. Vermeld dit kort op /shop/privacy.
Meting: data-cm="melding" op de verstuurknop.

Klaar voor 10 tot 15 als de lekkenpagina bij de nieuwe kolommen (verder-blok gezien, verder-tik, drukte gezien, anderen-kozen-tik, zekerheid gezien, melding aangezet) per dag cijfers laat zien.

Werkwijze: commit per taak met een duidelijke boodschap. Zet nooit sleutels in code of commits. Lukt een taak niet, schrijf dan precies wat er misgaat en ga door met de volgende.`;
}
