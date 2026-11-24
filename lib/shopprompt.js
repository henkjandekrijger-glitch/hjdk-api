// Kant-en-klare opdracht voor Babita's Claude Code in de yoo.rs-shop (Henkjan 20 okt 2026: "zorg dat het voor haar kant en klare prompt is voor claude code").
// Live opgebouwd: de cijfers van de laatste 24 uur staan erin, zodat ze ziet wat er nu misgaat. Geen sleutels, geen persoonsgegevens.
export function shopPrompt({ tot = {}, lekLink = '', datum = '' } = {}) {
  const n = v => Number(v) || 0;
  return `Je werkt in de code van de Yoors Shop (yoo.rs, PHP). Voer de taken hieronder in deze volgorde uit. Lees per taak eerst de bestaande code, verander zo weinig mogelijk, test, en meld per taak in één zin wat je deed en hoe je het getest hebt.

Stand ${datum} (laatste 24 uur, gemeten door de campagne-lus): ${n(tot.paKliks)} betaalde kliks, ${n(tot.aangekomen)} aangekomen, ${n(tot.echt)} echte mensen op de productpagina, ${n(tot.tik)} tikken, ${n(tot.cart)} winkelwagens, ${n(tot.afreken)} op de afrekenpagina, ${n(tot.betaal)} betaling gestart, ${n(tot.koop)} betaald. PropellerAds krijgt de tikken en winkelwagens wel binnen; alles na de winkelwagen ontbreekt. Daarom kunnen de campagnes niet leren wat verkoopt.

Volgorde = prioriteit: de bovenste taak levert het meeste op.

TAAK G — DE GIDS IN GOOGLE KRIJGEN (24 nov 2026, Henkjan: "Check met demandradar waar wij enorm op kunnen scoren organisch SEO en LLM" en daarna "Ja . begin .")
Google heeft van gids.kadoly.com maar 6 van de 67 pagina's opgenomen en leest de gids een paar keer per week. Kadoly.com zelf wordt wel gelezen (Merchant Center, productpagina's). Gewone links vanaf kadoly.com laten Google de gids vinden en geven hem gewicht. Verander zo weinig mogelijk aan de opmaak.
1. Productpagina: haal één keer per nacht https://gids.kadoly.com/api/gids?op=pidgids op (JSON, perProduct: { <product-id>: [ { url, titel } ] }) en bewaar het. Staat het product erin, zet dan onder de productomschrijving één blok "Hulp bij kiezen" met hooguit 2 gewone links (<a href="https://gids.kadoly.com/...">titel</a>, zonder nofollow, zonder JavaScript, in de HTML die de server stuurt). Staat het er niet in: geen blok.
2. Onderaan elke pagina (footer) één gewone link "Kadoly gids" naar https://gids.kadoly.com/ en in de footer van de categoriepagina's wonen, cadeaus en keuken ook "Home staging" naar https://gids.kadoly.com/home-staging-accessoires en "Cadeautips" naar https://gids.kadoly.com/cadeau-voor-haar.
3. robots.txt van kadoly.com: voeg de regel "Sitemap: https://gids.kadoly.com/sitemap.xml" toe (onder de bestaande Sitemap-regel). Laat de rest van robots.txt ongemoeid.
4. Niet doen: geen canonical of noindex naar de gids, geen redirect, geen links die alleen voor bots zichtbaar zijn.
De volgorde in perProduct is de prioriteit: neem de eerste twee. Bij dp_1022, dp_1023, dp_1028, dp_1037 en dp_1032 staat de tv-meubelrekenhulp vooraan. Zo komt de link ook echt op de meubels waar de rekenhulp over gaat.
Test: open een productpagina die in een gids staat (bijvoorbeeld oc_4174003724075009, de bouclé plaid Paris) met curl en zie de link naar https://gids.kadoly.com/wollen-deken in de HTML. Controleer bij dp_1022 de gewone link naar https://gids.kadoly.com/tv-meubel-breedte-berekenen. Een product zonder gids heeft geen blok. curl https://kadoly.com/robots.txt toont de nieuwe Sitemap-regel. Lever per controle de URL en het gevonden href op; een bijgewerkte opdracht alleen bewijst geen live winkelwijziging.
Later (niet nu, eerst vragen): de gids onder kadoly.com/gids zetten, zodat hij meelift op het hoofddomein.

TAAK L — LOKKERS (23 nov 2026, Henkjan: "Ja zet live", en later: "Lokkers zijn niet geschrapt dat is een apart proces ." De margevloer van TAAK M geldt niet voor deze drie.)
Drie producten staan als lokker in Google Shopping, ver onder de marktprijs: rietdiffuser Amsterdam 500 ml (oc_4174002164400133, € 15,95 met verzending), ivory kaarsenhouder trio (oc_4174003456851970, € 29,95) en bloemvaas boekvorm (oc_4174002211717121, € 13,95). De prijs komt uit de prijslijst (TAAK Y); lees die vandaag nog in, zodat prijs in Google, op de productpagina en in de kassa gelijk is (anders keurt Google af).
1. Hooguit 1 per klant per lokker: in de winkelwagen niet meer dan 1 stuk, en op de productpagina één regel "Actieprijs, 1 per klant".
2. Onder de koopknop van een lokker: het pakket of 2 producten van hetzelfde merk die er goed bij passen ("Maak het cadeau compleet"), met één tik in dezelfde bestelling.
3. Staat het product niet meer in de prijslijst als lokker (de stopregel: EUR 60 verlies of 14 dagen zonder extra verkoop), dan geldt weer de gewone prijs en verdwijnt de regel van punt 1.
4. EERST (24 nov, gevonden door de lokkercontrole): de rietdiffuser (oc_4174002164400133) en de bloemvaas (oc_4174002211717121) staan niet in de Google-feed cdn.kadoly.com/uploads/feeds/google-shopping-nl.xml; de kaarsenhouder wel. Zoek waarom de feed ze overslaat (waarschijnlijk een filter op marge, prijs of verlies) en laat lokkers uit de prijslijst altijd door, met g:price = de lokkerprijs met verzending (15.95 en 13.95 EUR) en verzending 0.
Test: zet een lokker en een ander product in de winkelwagen, probeer 2 lokkers: het blijft 1. Totaal met verzending klopt met de prijslijst. In de feed staan alle drie de lokkers met hun lokkerprijs.

TAAK M — MARGEVLOER SIERADEN EN HORLOGES (23 nov 2026, Henkjan: "Zorg vor marges . Geen verlies meer accepteren .")
De sieraden en horloges van GLAM & GLORY, Menthe à l'eau, LanLivia, Luxaa en Lisberg verdienden € 1,40 tot € 2,20 per bestelling. De prijslijst (TAAK Y) zet ze nu op minstens € 10 marge en 20% van de omzet zonder btw. Lees de prijslijst vandaag nog in; zet bij nieuwe producten van Orderchamp voortaan nooit een prijs onder de inkoop + verzending + btw + € 10.

TAAK K — GOOGLE-KLIK BIJ ELKE BESTELLING (23 nov 2026, Henkjan: "Zorg dat je echt alles meet ." en "Zorg dat clickmind noooooooit vertragend is .")
Waarom: Google Shopping brengt de meeste bezoekers van kadoly.com (30 dagen: 11.439 bezoeken uit de gratis vermeldingen, 138 advertentiekliks), maar geen bestelling is aan Google te koppelen. Google Ads ziet nul aankopen en kan dus niet leren welke producten verkopen.
1. Lees op elke pagina serverkant (PHP, bij het laden, geen extra JavaScript) gclid, gbraid, wbraid en srsltid uit de URL en bewaar ze in een eerste-partijcookie ys_g (90 dagen, httponly, secure, SameSite=Lax), alleen overschrijven als er een nieuwe in de URL staat. Alleen als de bezoeker advertentiecookies toestond in de cookiemelding; anders niets bewaren.
2. Sla die waarden bij het aanmaken van de order op bij de order (velden gclid, gbraid, wbraid, srsltid).
3. Zet ze per order in de datapagina van de shop (de JSON met orders die go.kadoly.com ophaalt): order.gclid, order.gbraid, order.wbraid, order.srsltid. Verder niets aan die JSON veranderen.
4. Snelheid: geen nieuw script, geen redirect, niets dat op het laden wacht. Zet ook de wachttijd in het korte script in de kop dat html.cm-wacht zet (setTimeout 1500) op 300: de proefblokken mogen hooguit 0,3 seconde onzichtbaar zijn.
5. Google Klantenreviews op de bedankpagina na betaling (Merchant Center Kadoly 5876502305, het standaard opt-in-script van Google met order_id, e-mail, land NL en verwachte leverdatum = vandaag + max_handling_time + max_transit_time uit de feed). Alleen laden op de bedankpagina, async, na de betaling. Waarom: Kadoly heeft nog geen winkelbeoordeling; Google laat de gratis vermeldingen bijna niet zien (1 klik in 28 dagen) en weegt winkelkwaliteit en reviews mee.
Test: open kadoly.com/product/<een product>?gclid=test123 met toestemming, bestel met de testbetaling en kijk of die order in de datapagina gclid test123 heeft. Zonder toestemming: geen cookie. Op de bedankpagina verschijnt de vraag van Google Klantenreviews.

TAAK T — KLANTENSERVICE-TIJDEN IN DE WINKEL (22 nov 2026, Henkjan: "gewoon NL tijden noteren . Ik regel support vanuit NL ." en "snelle respons als er vragen zijn")
Waarom: een onbekende winkel moet laten zien dat er mensen achter zitten en wanneer (vergelijk deonlinedrogist.nl: "klantenservice Wij zijn: nu bereikbaar" bovenin en een blok met telefoon, chat, WhatsApp en tijden boven de voet).
1. Tijden: maandag tot en met vrijdag 9:00 tot 17:30 uur, Nederlandse tijd (Europe/Amsterdam). Binnen die tijden antwoord binnen een uur via WhatsApp (+31 6 55395630) of de chat; daarbuiten antwoordt de AI-hulp direct.
2. In de kop (ypn__band, naast de drie claims): "Nu bereikbaar" met een groene stip als het binnen de tijden is, anders "Maandag vanaf 9:00 bereikbaar" of "Morgen vanaf 9:00 bereikbaar". Reken in de browser in Europe/Amsterdam, niet in de tijd van de bezoeker.
3. Productpagina, blok "Goed om te weten": de regel "Vragen" wordt "Klantenservice": status zoals hierboven, dan "WhatsApp of de chat: binnen kantoortijd antwoord binnen een uur" (zo staat het al in de Shopify-winkel, lib/shoptheme.js).
4. Voet: één regel met de tijden bij telefoon en e-mail.
Test: bekijk de kop op een werkdag om 10:00 en om 20:00 Nederlandse tijd (zet de klok van je testbrowser om) en op zaterdag; geen andere kleuren dan de huisstijl.

TAAK V — VERTROUWEN ZOALS DE GROTE WINKELS (22 nov 2026, Henkjan op de vergelijking met deonlinedrogist.nl: "Ja maak een briefing voor code en voer de rest door")
Waarom: Kadoly is nieuw en onbekend; een bezoeker wil op de productpagina zonder zoeken zien wanneer het komt, of het er echt is en wie erachter zit. De Shopify-winkel van Kadoly heeft dit al (lib/shoptheme.js), kadoly.com moet hetzelfde tonen. Geen nullen, geen "nog geen reviews", niets verzinnen.
1. Leverdatum bij de prijs, als echte datum: "Vandaag besteld, tussen donderdag 27 en maandag 1 december in huis" (één datum als min = max). Reken in werkdagen vanaf vandaag in Nederlandse tijd met de levertijd van de leverancier (data-days die er al is). Ken je de besteltijd van de leverancier (bijv. voor 15:00 besteld = vandaag verzonden), zet die ervoor: "Voor 15:00 besteld, morgen verzonden". Onbekende levertijd: toon niets, geen schatting.
2. Voorraad concreet: 1 tot 5 stuks "Nog 3 op voorraad", 20 of meer "Ruim op voorraad", daartussen "Op voorraad". Uitverkocht blijft zoals nu (yso-blok). Bron: de voorraad die al per product binnenkomt (AW, Droppery, Orderchamp, inkoopwinkel).
3. Reviews: stuur na elke bezorgde bestelling automatisch de reviewuitnodiging van WebwinkelKeur (Kadoly is aspirant-lid sinds 17 november 2026, winkel-id 1226796). Toon de score (bijv. 9,4/10) met het aantal en "geschreven na aankoop" pas vanaf 10 reviews, bij de titel en in de voet. Daaronder nooit.
4. Wie erachter zit: de regel onder de koopknop wordt "Kadoly is van Henkjan de Krijger, medeoprichter van Mijndomein · een handelsnaam van AdsFair B.V., Gouda · KVK 60126035". Op de pagina Over Kadoly één alinea met dezelfde feiten.
Niet overnemen: gratis verzending vanaf een bedrag (Henkjan: geen gratis verzending), awards die we niet hebben, een maximum per persoon, reviews van mensen die het product gratis kregen.
Test: een product met levertijd 2-4, een met 3 stuks voorraad, een zonder bekende levertijd (geen datum), op telefoon en desktop.

TAAK Z — SAMEN SPAREN IN DE WINKEL (23 nov 2026, Henkjan: "Geven van zegels met een link en zo geconnect sparen 1 zegel per aan koop" en "Alles geeft een zegel"; staat nog uit: toon alles alleen als het veld live true is)
1. Productpagina: haal https://gids.kadoly.com/api/gids?op=ss&product=<product-id> op en zet het veld tekst (bijv. "1 zegel bij je aankoop. Gratis te krijgen voor 1 kaart van 5 zegels.") onder de prijs, in een omlijnd label met een zwarte stip ervoor. Geen tekst of live false: niets tonen.
2. Winkelmandje: haal https://gids.kadoly.com/api/gids?op=ss&mand=<id>:<aantal>,<id>:<aantal> op en zet het veld tekst ("Deze bestelling geeft 1 zegel. Wie jou uitnodigde, krijgt er ook 1.") in een omlijnd blok direct boven de afrekenknop.
3. Bedankpagina na betalen en de bevestigingsmail: de regel "Deze bestelling gaf 1 zegel" met één knop "Zet je zegel op je kaart" naar https://gids.kadoly.com/api/gids?op=ss&o=<ordernummer>. Op de bedankpagina is dit het enige blok onder de bestelgegevens.
4. Datapagina /api/lus-feed: geef per bestelling ook bezorgd door (status delivered en delivered_at) en blijf refund, return en cancel doorgeven zoals nu. Met bezorgd sturen wij op het bezorgmoment één bericht om een zegel door te geven; met retour gaat de zegel eraf.
5. Later, samen met het tegoed van de Spaarpot: een volle kaart inwisselen in de kassa (een code die één cadeau op 0 euro zet). Tot die er is, loopt inwisselen via WhatsApp met Henkjan.
Test: een product met en zonder marge (beide 1 zegel), een mandje met twee producten (1 zegel), en de knop op de bedankpagina op telefoon.

TAAK S — INKOOPWINKEL: PRODUCTEN VAN SHOPIFY-LEVERANCIERS IN EIGEN TESTHOEKEN (21 nov 2026, Henkjan: "Shopify . We kunnen misschien nog meer van ze leren") (22 nov 2026, Henkjan: "JA doen ." op het voorstel om alleen via kadoly.com te verkopen en Shopify alleen als verborgen inkoopwinkel te houden: deze taak gaat nu voor; toon bij deze producten ook de punten van TAAK T en V)
Achter Kadoly staat een verborgen Shopify-winkel (Kadoly Inkoop) waarop dropship-apps aansluiten (Syncee, Gelato, Printful ...). Bron: GET https://gids.kadoly.com/api/dp?op=shfeed&start=0&size=250 (X-Lus-Key), volg volgende. Elk product: sku (SH-...), hub_variant, titel, omschrijving, merk/leverancier, hoek, prijs_kadoly, adviesprijs, verzending_klant (6,95), voorraad, beelden, kenmerken, keur.
1. Import elke nacht na 05:45 UTC. Elk product staat alleen in zijn hoek (zelfde regels als TAAK A punt 4: /categorie/<hoek>, niet in menu of homepage, wel zoeken, Shopping met g:custom_label_2 = hoek, link onderaan, data-hoek op de pagina). Niet meer in de feed = offline.
2. Elke regel in de feed is een variant: groepeer regels met dezelfde hub_id tot één product met keuzes (kenmerken, bijv. maat en kleur). Engelse titels vertalen zonder iets te verzinnen. Prijs = prijs_kadoly, verzending 6,95. voorraad null = niet bijgehouden (handgemaakt op bestelling): wel te koop.
3. Betaalde order met SH-regels: POST https://gids.kadoly.com/api/dp?op=shorder (X-Lus-Key) met { order_id, klant: { naam, email, telefoon, adres1, adres2, plaats, postcode, land }, regels: [{ sku, hub_variant, aantal }] }. Gemengde order: alleen de SH-regels hierheen.
Test: zodra de feed producten heeft, één hoek op een telefoon openen, een product in de wagen tot de betaalpagina. Meld per punt klaar of niet.

TAAK P — PAKKETTEN IN DE WINKEL (versie 2, 21 nov 2026, Henkjan: "deze pakketten mogen ook best een plek op de winkel zelf hebben . Geef daar goede Ux voor aan code")
Waarom: een los product levert per bestelling € 0 tot € 2 op, een pakket € 16 tot € 35. Elk pakket is een kant-en-klaar cadeau van één merk voor één ontvanger of moment (Winterse verwenbox, Winteravond box, Kersthoek set, Sfeerset haard en geur, Plantenhoek set, Boho wandmanden set, Bureau set voor hem), net onder een cadeaubudget (€ 50, € 75, € 100). Elke nacht (04:47 UTC) rekent go.kadoly.com ze opnieuw door; elk pakket heeft een VAST adres op slug.
Wij leveren de HTML (server-side, goed voor Google; wij verbeteren de UX zonder dat jij opnieuw bouwt). Jij zet hem op zijn plek, maakt de koop-route en de feed. Bouw geen eigen pakketkaarten of pakketpagina.

Gegevens (openbaar): https://go.kadoly.com/api/shop/pakketten (velden per pakket: code, slug, naam, voor, groep, verhaal, let, merk, link, geldigTot, regels [id, titel, kort, img, los, aantal, prijs], verzending, totaal, losBijOns, besparing, grens, gratis {id, titel, los}, keuze {regel, vraag, opties [{label, id}]}, levertijd). Eén pakket: https://go.kadoly.com/api/shop/bundel?slug=<slug> (zelfde velden plus geldig). De regelprijzen plus verzending tellen precies op tot het totaal.
HTML: https://go.kadoly.com/api/shop/pakkethtml?vorm=<vorm> met vorm = strip, lijst, detail (&slug=), product (&pid=), mand (&pids=id,id), meta (&slug=, JSON met title, description, canonical, image). Elk stuk heeft zijn eigen <style> (klassen kp-...) en een klein script; een leeg antwoord betekent: niets tonen.

PHP om in te voegen (één functie, 10 minuten cache, 3 seconden time-out; bij een fout of leeg antwoord toon je niets):
  function kadoly_pakket($vorm, $q = []) {
    $url = 'https://go.kadoly.com/api/shop/pakkethtml?' . http_build_query(array_merge(['vorm' => $vorm], $q));
    $f = sys_get_temp_dir() . '/kp_' . md5($url); if (is_file($f) && time() - filemtime($f) < 600) return file_get_contents($f);
    $ctx = stream_context_create(['http' => ['timeout' => 3, 'ignore_errors' => true]]); $h = @file_get_contents($url, false, $ctx);
    $ok = isset($http_response_header[0]) && strpos($http_response_header[0], ' 200') !== false;
    if ($ok && $h !== false) { @file_put_contents($f, $h); return $h; } return is_file($f) ? file_get_contents($f) : '';
  }

1. Route kadoly.com/pakket/<slug>: shopkop, dan echo kadoly_pakket('detail', ['slug' => $slug]), dan de vertrouwensregel van de productpagina (iDEAL, PayPal, Klarna, gratis retourneren, WebwinkelKeur, KvK), dan de voet. In de <head>: title, description, canonical en og:image uit vorm=meta. Geeft meta 404 (pakket bestaat niet meer): 302 naar /pakketten. cm.js laden zoals op de productpagina, met data-bundel="<code>".
2. Route kadoly.com/pakket/<slug>/koop (GET, parameters keuze en vervang): haal https://go.kadoly.com/api/shop/bundel?slug=<slug>. Niet geldig: terug naar /pakket/<slug>. Anders: zet elke regel in de winkelwagen met regel.prijs en aantal 1, als één pakket (pakketcode op elke regel, één verzending = het veld verzending). keuze = een id uit keuze.opties: die vervangt de regel op plek keuze.regel (zelfde prijs). vervang=1: haal eerst losse regels uit de wagen die in het pakket zitten. Daarna naar de kassa. In de kassa nog een keer de API: geldig en totaal gelijk, anders de losse prijzen.
3. Route kadoly.com/pakketten: shopkop, echo kadoly_pakket('lijst'), voet. Title "Cadeaupakketten: kant-en-klare cadeaus, samen voordeliger | Kadoly". Zet hem in het menu als eerste item "Cadeaupakketten" tot en met 25 december, daarna als gewoon item.
4. Homepage: echo kadoly_pakket('strip') direct onder het eerste blok.
5. Productpagina: echo kadoly_pakket('product', ['pid' => $id]) direct onder de koopknop (leeg als het product in geen pakket zit).
6. Winkelwagen: echo kadoly_pakket('mand', ['pids' => implode(',', $idsInWagen)]) boven de totalen (leeg als er niets te zeggen is).
7. Oude adressen kadoly.com/bundel/<code>: haal https://go.kadoly.com/api/shop/bundel?code=<code>; heeft het antwoord een slug, dan 301 naar /pakket/<slug>; anders de productpagina van het eerste product.
8. Google Shopping: elk pakket als eigen product in google-shopping-nl.xml: id = pakket-<slug> (vast), titel = naam + ": " + de korte namen van de regels, prijs = totaal, link = https://kadoly.com/pakket/<slug>, afbeelding = img van de eerste regel, brand = merk, g:is_bundle = yes, beschikbaar zolang het pakket in de API staat. Haal een pakket dat niet meer in de API staat uit de feed.
9. Sitemap: /pakketten en elke /pakket/<slug>, lastmod = dag uit de API.
Test: open op een telefoon /pakketten, /pakket/winteravond-box, /pakket/kersthoek-set (kies Rood, druk Pakket in mandje: de wagen heeft de rode set van 26), de productpagina van oc_4174003419430913 (blok "Ook in de Winteravond box") en een wagen met alleen die lantaarn (blok "Maak er de Winteravond box van"). Reken af tot de betaalpagina (niet betalen): totaal gelijk aan de API. Meld per punt klaar of niet.

TAAK D — DROPPERY: ALLES WAT DE KEURING GOEDKEURT IN DE WINKEL, TEGEN DE JUISTE PRIJS (21 nov 2026, Henkjan: "Zet alles van droppery in de winkel" en "Ja 1 - 3 gaan we doen")
Waarom: een Droppery-meubel of XL-hanglamp levert € 140 tot € 557 per verkoop op, honderd keer een Orderchamp-product. Maar de shop rekent nu meer dan Droppery zelf en zelfs meer dan de adviesprijs: Oxford eettafel € 1.911,99 (Droppery € 1.529,99, advies € 1.699,99), Winston € 1.461,99 (€ 1.169,99), Tanner mediaconsole € 1.629,99 (€ 1.304,10), Sky-hanglamp XXL € 484,97 (€ 449,97). Daarmee verkoop je niets en keurt Google Shopping de prijs af.
Bron: GET https://gids.kadoly.com/api/dp?op=feed&start=0&size=250 met header X-Lus-Key = SHOP_FEED_KEY. Sinds 21 nov in pagina's (er komen ~2.500 producten): volg het veld volgende tot het null is; totaal geeft het aantal. Zonder start/size krijg je alleen de eerste 250. Elk product heeft nu ook: categorie, prijs_kadoly, gratis_verzending, keur {ok, score, label, rol, marge, marge_bak, vraag, reden}.
1. Import elke nacht en na elke wijziging. Alleen producten met keur.ok = true staan zichtbaar in de winkel; keur.ok = false gaat offline (niet verwijderen, de keuring kan morgen anders zijn). keur.rol = 'onderdeel' (plafondfitting) nooit los tonen: alleen als vast onderdeel in de prijs van de hanglamp met dat fitting_sku.
2. Prijs = prijs_kadoly (de Droppery-prijs, nooit boven de adviesprijs). Geen eigen opslag. Staat adviesprijs hoger dan prijs_kadoly, toon de adviesprijs doorgestreept. Verzending gratis.
3. Categorie = categorie uit de feed (Verlichting, Eettafels, Tafels, Kasten, Bedden, Tuin en barbecue, Keuken, Wonen). Maak de ontbrekende categoriepagina's aan en zet ze in het menu onder Wonen.
4. Productpagina: alle beelden, de volledige omschrijving, maten en gewicht als lijst bovenaan (uit de omschrijving), levertijd zoals de feed hem geeft, en "Gratis bezorgd, ook bij meubels". Zet onder de koopknop de link naar de gids als die er is (gids.kadoly.com/eettafel, /dressoir, /grote-hanglamp).
5. Google Shopping (google-shopping-nl.xml): elk keur.ok-product. Zonder EAN: g:identifier_exists = no en g:brand = merk of leverancier (Modus Furniture, Bazar Bizar), nooit een verzonnen GTIN. g:custom_label_0 = keur.label (dp-top, dp-mid of dp-test; dp-test = marge EUR 5 tot 15, de proef van Henkjan 21 nov: wel in de winkel en in Shopping, apart label zodat het bod laag kan), g:custom_label_1 = keur.marge_bak, g:product_type = categorie. Prijs = prijs_kadoly, verzending 0.
6. Clickmind: de productpagina's van Droppery krijgen dezelfde cm.js-meting als de rest; niets apart.
8. Testhoeken (21 nov 2026, lib/hoeken.js): heeft een product een veld hoek (kinderkamer, kerstverlichting, verlichting-design), dan staat het alleen in die hoek, met dezelfde regels als TAAK A punt 4: eigen categoriepagina /categorie/<hoek>, niet in het hoofdmenu, niet op de homepage, niet in Ook populair, wel in zoeken, Google Shopping (g:custom_label_2 = hoek) en een link onderaan de site; data-hoek="<hoek>" op elke pagina van de hoek. Producten zonder hoek blijven waar ze staan.
7. Meld een betaalde order met Droppery-producten via POST /api/dp?op=order (zoals nu). Test: zet één goedgekeurd meubel in de wagen en reken af tot de betaalpagina (niet betalen): prijs = prijs_kadoly, verzending 0.
Test: open op een telefoon de Oxford eettafel, een Tanner dressoir en de Whipped-hanglamp: prijs gelijk aan prijs_kadoly in de feed, adviesprijs doorgestreept waar hoger. De plafondfitting en de keukenspullen met keur.ok = false zijn niet te vinden. Meld per punt klaar of niet.

TAAK O — ORDERCHAMP: NIEUWE PUBLICATIES KOMEN NIET BINNEN (21 nov 2026, Henkjan: "Gebeurt auto ?" en "Zit er veel jewelry tussen ik wil daarvoor gaan met de kerst")
Wat er mis is: op 21 nov rond 14:00 UTC zijn ~170 sieraden van LanLivia, Luxaa en Lisberg Jewellery in Orderchamp gepubliceerd naar de koppeling "Yoors" (Orderchamp, Dropshipping, Instellingen, Software: custom API, URL https://yoo.rs, access token en gedeeld geheim voor X-Orderchamp-Signature). Om 16:05 UTC staan ze in Orderchamp, Importlijst nog op "Synchroniseren" en zijn ze niet te vinden in de winkel (zoeken op moissanite, sterling zilver, oorstekers, oorringen: 0). Oudere producten staan wel op "Gesynchroniseerd", dus de koppeling werkte eerder.
1. Zoek uit waarom: draait het ophalen van publicaties nog (cron of wachtrij), komen de webhooks binnen (yoo.rs stuurt nu door naar kadoly.com; een POST die een 301 krijgt, wordt een GET en de webhook valt weg: zet het webhookadres op de echte host of laat yoo.rs POST zonder doorsturen afhandelen), en geeft de API een fout terug (token verlopen, signature-check).
2. Haal alle publicaties op die nog niet in de winkel staan, maak de producten aan (oc_<listing-id>, zoals de rest), en bevestig ze aan Orderchamp zodat de status "Gesynchroniseerd" wordt.
3. Laat dit voortaan elk uur lopen en meld een fout (geen nieuwe publicaties binnen na 2 uur terwijl Orderchamp er heeft) in het logboek.
Stand 23 nov 16:50 UTC: GLAM & GLORY Jewels (445 producten) en Menthe à l'eau (180 horloges) staan sinds ~14:55 UTC in de importlijst en zijn 2 uur later nog niet in de winkel (zoeken op glory, menthe, horloge: 0). LanLivia en Luxaa staan er wel, maar Orderchamp toont ze nog als "Synchroniseren" (punt 2, bevestigen, ontbreekt).
4. Sieraden krijgen de categorie Sieraden (subcategorieen Kettingen, Oorbellen, Armbanden, Ringen, Horloges) en staan wel in het hoofdmenu: dit is de kerstcampagne.
Test: zoek op kadoly.com naar "moissanite" en "oorringen": producten van Luxaa en LanLivia, prijs en foto's goed; in Orderchamp, Importlijst staan ze op "Gesynchroniseerd". Meld per punt klaar of niet.

TAAK A — AW DROPSHIP: EIGEN HOEK "RUST & RITUEEL" (21 nov 2026, Henkjan: "Maak AW in orde en maken we aparte spirituele hoek" en "we verstoppen het anders gewoon van de rest . en draaien experiment")
Waarom: Demand Radar meet per maand in NL en BE edelstenen 213.517, diffusers 123.288, tarot 40.561, wierook 38.859, etherische olie 19.644, zoutlamp 9.655 en klankschaal 9.398 zoekopdrachten. Kadoly heeft daar niets voor. AW Dropship EU (Ancient Wisdom, Slowakije) levert in 4 werkdagen en is aan Kadoly gekoppeld (verkoopkanaal "Kadoly (Manual/API)"). AW verkoopt tegen ongeveer 1,75 keer de inkoop, dus losse spullen van € 10 leveren te weinig op; daarom vooral pakketten van 5 dingen rond € 70 (marge minstens € 15) en los alleen wat de keuring goedkeurt.
Bron: GET https://gids.kadoly.com/api/dp?op=awfeed&start=0&size=250 met header X-Lus-Key = SHOP_FEED_KEY. Volg volgende tot het null is. Elk product: sku (AW-<code>), aw_sku, rol (product of onderdeel), titel_en, omschrijving_en, merk (Ancient Wisdom), ean, inkoop (excl. btw), adviesprijs, prijs_kadoly, verzending_klant, voorraad, levertijd, gewicht, maten, materiaal, herkomst, beelden, categorie, hoek, subcategorie, keur {ok, score, label (aw-top of aw-mid), marge, marge_bak, vraag}. De eerste pagina heeft ook pakketten: [{ slug, naam, voor, verhaal, vraag, link, prijs, los, besparing, verzending_klant, levertijd, regels: [{ sku, naam, aantal, los, beeld }] }].
1. Import elke nacht (na 05:30 UTC, dan is de keuring van die nacht klaar). Alleen wat in de feed staat is te koop; een AW-product dat er niet meer in staat gaat offline (niet verwijderen). rol onderdeel: importeren maar verborgen, alleen als regel van een pakket te koop.
2. Titel en omschrijving zijn Engels: vertaal naar goed Nederlands. Niets verzinnen: geen genezende of spirituele beloftes die niet in de Engelse tekst staan, geen "geneest", "beschermt tegen", "verlaagt stress". Zet de zoekterm uit keur.vraag.term vooraan in de titel als die past (bijv. "Palo santo, 1 kg eerste kwaliteit"). Materiaal, maten en herkomst als lijst bovenaan.
3. Prijs = prijs_kadoly (de adviesprijs van AW, incl. btw). Geen eigen opslag. Verzending = verzending_klant (€ 6,95 per bestelling, één keer per bestelling, ook als er meer AW-producten in zitten), zichtbaar bij de prijs zoals bij de rest van Kadoly.
4. De hoek: één nieuwe categorie "Rust & ritueel" (/categorie/rust-ritueel) met de subcategorieen uit het veld subcategorie (Edelstenen en kristallen, Klankschalen en trommels, Wierook en salie, Aromatherapie, Kaarsen, Bad en lichaam, Thee, Sieraden met edelsteen, Tassen en kleding, Tarot en pendels, Beelden en decoratie). Bovenaan de hoek de pakketten, daaronder de losse producten. Apart van de rest: niet in het hoofdmenu, niet in "Ook populair", niet op de homepage en niet bij de andere categorieen. Wel: een link "Rust & ritueel" onderaan de site (footer), in de zoekresultaten als iemand ernaar zoekt, en op de eigen categoriepagina's. Kop van de hoek: "Rust & ritueel: edelstenen, klankschalen, wierook en salie, in 4 werkdagen bezorgd".
4b. Pakketten uit de feed: elk op kadoly.com/pakket/<slug> (zelfde opzet als de andere pakketten: één prijs, de regels met naam en losse prijs, "los € X, in het pakket € Y", foto's van de regels, één knop "Pakket in mandje" die de regels als één pakketregel in de wagen zet). Een pakket dat niet meer in de feed staat gaat offline. Bij afrekenen gaan de regels als gewone AW-regels naar /api/dp?op=aworder.
5. Google Shopping (google-shopping-nl.xml): elk product met rol product en elk pakket. g:gtin = ean als die er is (pakket: g:identifier_exists = no), anders g:identifier_exists = no; g:brand = Ancient Wisdom; g:product_type = categorie (pakket: Rust & ritueel > Pakketten); g:custom_label_0 = keur.label (pakket: aw-pakket); g:custom_label_1 = keur.marge_bak; g:custom_label_2 = rust-ritueel. Prijs = prijs_kadoly, verzending 6,95.
6. Clickmind: zelfde cm.js-meting als de rest; zet op elke AW-pagina data-hoek="rust-ritueel" zodat de proef de hoek apart kan tellen.
7. Een betaalde order met AW-producten: POST https://gids.kadoly.com/api/dp?op=aworder (X-Lus-Key) met { order_id, klant: { naam, email, telefoon, adres1, adres2, plaats, postcode, land }, regels: [{ sku, aantal }] }. Het antwoord zegt of het mandje bij AW klaar staat. Een gemengde order (AW en andere leveranciers) splits je: alleen de AW-regels hierheen.
Test: open op een telefoon /categorie/rust-ritueel, /pakket/rookritueel-set en een losse klankschaal. Titel Nederlands, prijs gelijk aan de feed, verzending € 6,95, de hoek staat niet in het hoofdmenu en niet op de homepage. Zet het pakket in de wagen en reken af tot de betaalpagina (niet betalen): totaal = pakketprijs + 6,95. Meld per punt klaar of niet.

TAAK X — EERST, VANDAAG (19 nov 2026, Henkjan: "Ja doe dat vraag dat ."): geen naakt of intieme lichaamsdelen op kadoly.com
Whop (Meta) keurde twee Kadoly-advertenties af met "Explicit sexual content": op de landingspagina staan bij de aanbevolen producten artikelen in de vorm van blote geslachtsdelen en borsten. Blijft dat zo, dan kan Meta ook de 14 advertenties afkeuren die nu lopen, en uiteindelijk het advertentieaccount.
1. Haal deze producten uit de shop (niet meer zichtbaar, niet in zoeken, aanbevelingen, "Ook gekozen", categorieën, sitemap, Merchant-feed en RSS): oc_4174004500398081 ('Laten We Naakt Gaan' plaque), oc_4174004682178562 (tegel 'All Bums'), oc_4174004630552578 (ovaal lichaamslijn), oc_4174004631650305 (ovaal vrouwen lijntekening), oc_4174004638973955 (ovaal kunst voor vrouwen), oc_4174004632600578 (ovaal lijntekening), oc_4174004630306818 (ovaal lijn kunst), oc_4174004463386625 en oc_4174004492648449 (posters lijntekening dama).
2. Bekijk daarna de foto's van alle producten van Label2X, by Vivi en ScandiArt en van alle tegels, posters, kaarsen, vazen en sleutelhangers. Alles wat een bloot lichaam, billen, borsten of geslachtsdelen laat zien, of die vorm heeft, gaat er op dezelfde manier uit. Twijfel = eruit.
3. Zet een vaste regel in de import van Orderchamp en Droppery: zulke producten komen er nooit meer in (op titel en op categorie, plus een lijst met ids die je met de hand aanvult).
4. Test: open https://kadoly.com/product/oc_4174004461895681?lang=nl (muursticker puntjes, een van de afgekeurde) en drie andere productpagina's van Label2X op een telefoon. Bij de aanbevelingen en "Ook gekozen" staat niets meer van het bovenstaande. Zoek in de shop op "naakt", "bums" en "dama": geen resultaat.
5. Meld in één zin hoeveel producten eruit gingen, met hun ids. De campagne-lus (go.kadoly.com) filtert ze al sinds 19 nov (lib/shopgevoelig.js); stuur nieuwe ids ook naar Henkjan, dan komen ze daar ook in.

TAAK Y — Prijslijst volledig inlezen (17 nov, nog maar deels gedaan)
Lees https://go.kadoly.com/api/shop/prijslijst elke nacht helemaal in (prijs_nieuw = productprijs zonder verzending). Op 19 nov stonden nog de oude prijzen bij onder meer de rietdiffuser (18,45 in plaats van 24,45), de babydeken (26,35 in plaats van 35,95) en de eiken snijplank (109,29 in plaats van 131,05). Test: die drie tonen op kadoly.com de nieuwe prijs. Meld hoeveel rijen je bijwerkte en hoeveel er nog openstaan.

TAAK A — EERST: een afrekenpagina die zelf leert (10 nov 2026, Henkjan: "maak alles daarvan lerend")
Gemeten 6-10 nov (Clickmind): 60 bezoekers op de afrekenpagina, 0 drukten op Betalen. 49 van de 60 openden hem binnen 12 seconden na de advertentieklik; 74% van wie weggaat, doet dat binnen 5 seconden. Je vervangt niets: je bouwt van elk onderdeel hieronder de nieuwe versie (b) naast de huidige (a). Clickmind (cm.js, staat al op elke pagina) kiest per bezoeker welke hij ziet en leert vanzelf welke versie meer betalingen oplevert. Haal niets van Clickmind weg.

Zo werkt het:
- Huidige versie in een element met data-cm-v="<onderdeel>:a", de nieuwe ernaast met data-cm-v="<onderdeel>:b" hidden. cm.js laat er één zien. Meer is niet nodig.
- Gaat het om gedrag in je code (niet om een blok om te wisselen): vraag de versie op het moment dat je hem nodig hebt met (window.cmProef ? cmProef('<onderdeel>') : 'a') en zet data-cm-proef="<onderdeel>" op het element waar het om gaat, dan weet Clickmind dat de bezoeker het zag.
- In de <head> van product- en afrekenpagina, vóór de cm.js-regel (zo flitst de oude versie niet even):
  <script>try{if(localStorage.getItem('cmpf'))document.documentElement.classList.add('cm-wacht');setTimeout(function(){document.documentElement.classList.remove('cm-wacht')},1500)}catch(e){}</script><style>.cm-wacht [data-cm-v]{visibility:hidden}[data-cm-v][hidden]{display:none!important}</style>
- data-cm-stap="betaal" op elke knop die een betaling start (Betalen, Apple Pay, Google Pay, PayPal, iDEAL), data-cm-stap="methode" op elke betaalmethode in de lijst, en data-cm-betaald="<bedrag>" op de bedankpagina als dat er nog niet staat.
- Zet elk onderdeel live zodra het klaar is; een onderdeel telt pas mee als het op de pagina staat. Volgorde: 1, 3, 2, 4, 6.

De onderdelen (a = wat er nu staat, b = nieuw):
1. levering (afrekenpagina) — a: "Thuisbezorgd in 5–7 werkdagen · verwacht …". b: alleen de datum, dezelfde tekst als op de productpagina ("In huis di 17 – do 19 nov"). Op beide plekken: onder de bestelling en bij Bezorging.
2. snel (afrekenpagina) — a: het huidige PayPal-blok. b: direct onder de bestelling drie grote knoppen: Apple Pay op een iPhone of Google Pay op Android (wat het toestel kan; kan het geen van beide, dan alleen de andere twee), PayPal en iDEAL. Bij Apple Pay, Google Pay en PayPal komen adres en e-mail uit de wallet; iDEAL gaat naar het formulier met iDEAL al gekozen.
3. kop (afrekenpagina) — a: de huidige bestelkaart met kleine foto. b: grote productfoto over de volle breedte, daaronder de naam en één regel "€<prijs> · verzending gratis · gratis retour binnen 14 dagen" (de echte prijs; "verzending gratis" alleen als dat voor deze klant klopt).
4. adres (afrekenpagina) — a: het huidige formulier. b: eerst e-mail, dan postcode + huisnummer die straat en plaats zelf invullen (met handmatig invullen als terugval), land vast Nederland met een link "Ander land?" die de landenlijst opent.
5. vervallen (10 nov): het vinkje op de afrekenpagina is de wettelijke afstandsverklaring voor downloads. Laat het staan zoals het is.
6. koopbalk (productpagina) — a: de Nu kopen-balk staat direct in beeld. b: de balk verschijnt pas als de prijs en de grote koopknop uit beeld zijn gescrold (IntersectionObserver op de koopknop). data-cm-proef="koopbalk" op de balk.

Testen, op een telefoon in een privévenster: open een productpagina en daarna de afrekenpagina. In de console laat localStorage.cmpf zien welke versies je kreeg; pas v daarin aan, herlaad, en controleer dat beide versies van elk onderdeel goed werken en betalen lukt. Stand van het leren: https://go.kadoly.com/api/mm/proefstand?site=kadoly&vorm=tekst
Meld per onderdeel in één zin dat het live staat.

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

TAAK 0 — EERST, VANDAAG (5 nov 2026, besluit van een panel van 13 experts; eerlijkheid en doodlopende routes, geen test)
Uit ~5.940 echte advertentiebezoekers betaalde nog nooit een vreemde. Deze punten gaan direct in de hele shop:
1. Haal de regel "👀 … mensen bekeken dit vandaag" (data-cm-zicht="drukte") helemaal weg. Hij telt bots mee, dus het getal klopt niet. Niet vervangen. (Clickmind verbergt hem tot dan al met een stijlregel.)
2. Vervang de doorgestreepte prijs door één regel: "€16,39 · incl. btw · gratis thuisbezorgd bij je eerste bestelling (anders €[echte verzendkosten] verzending)". Een doorgestreepte prijs leest als nepkorting.
3. Verberg het blok "Reviews" zolang een product 0 echte reviews heeft.
4. Zet de kopersbescherming (5% + €0,70, staat als PLACEHOLDER in de code) uit voor alle Kadoly-producten en haal sum-fee en sum-fee-note uit het overzicht. Het totaal op de afrekenpagina is precies de prijs van de productpagina.
5. Haal van de afrekenpagina weg: Saldo, "Nog te betalen", "Niet genoeg saldo", Inloggen, "Bewaar dit adres", de YS-chat, het menu ALL OF YOORS en het zoekpaneel. De AdSense-zin uit de cookietekst als er geen AdSense draait.
6. De cookiebanner op telefoons (<640 px) nooit over "Nu kopen" of de betaalbalk: bovenaan, of bottom: calc(84px + env(safe-area-inset-bottom)). Weigeren en Accepteren even groot. Stuur een screenshot op 360x640 in een privévenster.
7. /cart en /checkout zonder product sturen door naar kadoly.com/. Afhaalpunt: de kaart weg tot er een Maps-sleutel is, en het afhaalpunt alleen tonen als de lijst laadt.
8. Eén levertijd per product, overal gelijk (productpagina, "Ook gekozen", afrekenpagina, mail). Een voorraadgetal alleen tonen als het uit Orderchamp komt.
9. Je eigen pop-up op productpagina's uit. Zet data-cm-betaald="<bedrag>" op de bedankpagina als dat er nog niet staat. Voeg een knop "Aankoop herroepen" toe als die ontbreekt.
10. Stuur Henkjan de foutmeldingen van 4 en 5 nov (card_refused, debug-id van PayPal) en meld bij een mislukte betaling de reden mee in de pixel (parameter r). Check dat de Stripe-webhook en de return- en cancel-URL's van PayPal op kadoly.com staan, niet op yoo.rs of yoors.shop.

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

TAAK 11 — INGETROKKEN (5 nov 2026): haal de regel "… mensen bekeken dit vandaag" (data-cm-zicht="drukte") helemaal weg en vervang hem niet. De shop kan bots niet scheiden (van de advertentiebezoekers is maar ~6% een echt mens), dus het getal klopt niet en dat is een nep-aantal. Pas terug als Clickmind per product echte mensen levert. Hieronder de oude tekst, alleen ter info.
OUD: Echte drukte (laten zien wat anderen echt doen)
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

// 23 nov 2026 (Henkjan: "Maak iets zodat code die taak kan vinden en doorvoert een release doet op tijd iedere nacht ."): de briefing als losse taken
// voor de nachtronde van de winkel (fn/shop.js op=taken). id = letter of nummer van de taak (een dubbele krijgt -2), versie = hash van de tekst
// (zonder live cijfers, dus alleen anders als de taak zelf verandert). Bouwen alleen voor taken van de laatste 10 dagen; oudere taken alleen controleren.
import { createHash } from 'node:crypto';
const MAAND = { jan: 0, feb: 1, mrt: 2, maa: 2, apr: 3, mei: 4, jun: 5, jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11 };
export function shopTaken(nu = Date.now()) {
  const kop = [], blokken = [], gezien = {}; let huidig = null, groep = [];
  for (const r of shopPrompt({}).split('\n')) {
    const m = r.match(/^TAAK ([A-Z0-9]+) — (.*)$/);
    if (m) { gezien[m[1]] = (gezien[m[1]] || 0) + 1; huidig = { id: m[1] + (gezien[m[1]] > 1 ? '-' + gezien[m[1]] : ''), titel: m[2].trim(), regels: groep.concat([r]) }; groep = []; blokken.push(huidig); continue; }
    if (/^TAKEN \S/.test(r)) { groep = [r]; huidig = null; continue; } // inleiding van een groep taken: hoort bij de eerstvolgende taak
    if (groep.length) groep.push(r); else if (huidig) huidig.regels.push(r); else if (!/^Stand /.test(r)) kop.push(r);
  }
  let slot = ''; const laatste = blokken[blokken.length - 1];
  if (laatste) { const i = laatste.regels.findIndex(r => /^Werkwijze:/.test(r)); if (i > 0) { slot = laatste.regels.slice(i).join('\n').trim(); laatste.regels = laatste.regels.slice(0, i); } }
  const taken = blokken.map(b => {
    let datum = null; for (const d of b.titel.matchAll(/\b(\d{1,2}) (jan|feb|mrt|maa|apr|mei|jun|jul|aug|sep|okt|nov|dec)[a-z]*\.?(?: (\d{4}))?/g)) { const t = Date.UTC(Number(d[3] || 2026), MAAND[d[2]], Number(d[1])); if (!datum || t > datum) datum = t; }
    const tekst = b.regels.join('\n').trim();
    return { id: b.id, titel: b.titel.slice(0, 140), datum: datum ? new Date(datum).toISOString().slice(0, 10) : null, bouwen: !!(datum && nu - datum <= 10 * 864e5), versie: createHash('sha256').update(tekst).digest('hex').slice(0, 10), tekst };
  });
  return { kop: kop.join('\n').trim(), slot, taken };
}

// Eenmalige opdracht voor Claude Code in de winkelcode: de nachtronde op die computer inrichten (fn/shop.js op=nacht, openbaar, zonder sleutels).
export function nachtOpdracht(basis) {
  return `NACHTRONDE VOOR DE KADOLY-WINKEL (Henkjan 23 nov 2026: "Maak iets zodat code die taak kan vinden en doorvoert een release doet op tijd iedere nacht .")

Dit is een eenmalige opdracht voor Claude Code in de code van de winkel (kadoly.com). Richt op deze computer een nachtronde in die elke nacht om 05:00 UTC (01:00 Curaçao, 06:00 Nederland) zelf draait, zonder dat iemand iets hoeft te plakken.

INRICHTEN (nu, één keer)
1. Zet in de winkelrepo het bestand nachtronde.md met de tekst onder "WAT DE NACHTRONDE DOET" hieronder, letterlijk.
2. Maak een script (scripts/nachtronde.sh, op Windows scripts/nachtronde.ps1) dat in de map van de winkel Claude Code zonder scherm start (claude -p) met de opdracht: "Voer nachtronde.md uit." Geef het de rechten die het nodig heeft om bestanden te wijzigen, tests te draaien, te committen, te pushen en de release te doen; kies de vlaggen met claude --help. Uitvoer naar logs/nachtronde-<datum>.log, en zet logs/ in .gitignore.
3. Plan het script elke nacht om 05:00 UTC met de planner van dit systeem (launchd op een Mac, cron op Linux, Taakplanner op Windows). Zorg dat de computer dan wakker is (een wekmoment, of zeg Henkjan dat de computer aan en ingelogd moet blijven).
4. Schrijf onderaan nachtronde.md hoe de release in dit project gaat: welke opdracht, welke branch, en hoe je daarna ziet dat hij live staat. Weet je dat niet zeker, vraag het Henkjan nu één keer.
5. Het script leest SHOP_FEED_KEY uit de omgeving van de winkel (.env). Zet die sleutel nooit in nachtronde.md, het script, het log of een commit.
6. Draai het script één keer nu met de hand en laat Henkjan zien wat het meldde (stap g). Commit nachtronde.md en het script.

WAT DE NACHTRONDE DOET
a. git pull. Is de werkmap niet schoon of mislukt de pull: niets veranderen, alleen melden (stap g) met de reden.
b. Haal de open taken: GET ${basis}/api/shop?op=taken&vorm=tekst met header X-Lus-Key: <SHOP_FEED_KEY>. Daar staat per taak id, versie en "bouwen" of "alleen controleren".
c. Werk de taken van boven naar beneden af. Lees eerst de code: staat het er al, dan status bestond. Een taak met "alleen controleren" bouw je nooit: staat het er niet, dan status wacht met in één zin wat ontbreekt. Een taak met "bouwen": zo klein mogelijk bouwen, testen (de test uit de taak plus de tests van het project), één commit per taak met "TAAK <id>: <wat>". Faalt de test, probeer één andere aanpak; faalt die ook, zet de taak terug (git revert of reset van alleen die commit), status fout met de reden, en ga door. Heeft een taak iets van Henkjan nodig (een keuze, een account, een sleutel), dan status wacht met de vraag in één zin. Staat er bij een taak "eerder gedaan", pas dan alleen het verschil aan.
d. Begin na 90 minuten geen nieuwe taak meer; wat open blijft komt de volgende nacht.
e. Is er minstens één nieuwe commit: push en doe de release zoals onderaan dit bestand staat. Controleer daarna live: de homepage, een productpagina, de winkelwagen en de afrekenpagina geven 200 en tonen prijzen, en de datapagina (kadoly.com/shop/api/lus-feed met X-Lus-Key) geeft geldige JSON. Gaat er iets mis: zet de vorige release terug en meld release ok false met de reden.
f. Nooit: prijzen zetten die niet uit de prijslijst komen, producten, klanten of bestellingen verwijderen, betaal- of verzendinstellingen wijzigen, sleutels in code, het log of een commit.
g. Meld altijd, ook als er niets te doen was: POST ${basis}/api/shop?op=taken met header X-Lus-Key: <SHOP_FEED_KEY> en content-type application/json:
{"begin":"<iso-tijd>","eind":"<iso-tijd>","taken":[{"id":"L","versie":"<versie uit stap b>","status":"gedaan|bestond|wacht|fout","commit":"<korte hash of leeg>","toelichting":"<één zin: wat en hoe getest, of de reden>"}],"release":{"gedaan":true,"ok":true,"commit":"<hash>","toelichting":"<één zin>"}}
Krijg je geen 200 terug, probeer het één keer opnieuw na een minuut en zet het antwoord in het log.

Henkjan en de andere chats zien de uitkomst in de overdracht van de shop. Komt er een nacht geen melding, dan staat daar een waarschuwing.`;
}
