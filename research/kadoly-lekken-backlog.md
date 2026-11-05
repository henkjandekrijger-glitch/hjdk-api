# Kadoly: uitdagers per trechterstap (panel 5 nov 2026)

Panel van 13 specialisten plus voorzitter, op Henkjans vraag "neem een heel groot panel aan experts en kijk ook naar de dingen die we niet zien". Eén experiment per stap tegelijk; verkoop is de rechter. Bovenste eerst.

## Grootste lek
Betaling gestart naar betaald: 100% weg. Een vreemde heeft nog nooit betaald (enige echte poging, 5 nov, PayPal, mislukt na 4,9 s). Oorzaak vooral A (vermogen): in-app-browser naar bank-app of PayPal, cookiebanner over de koopbalk op mobiel, signalen die nep ogen. Daaronder M (koud verkeer, lootjes nog niet getrokken) en een vervuilde P (tikken op de vaste koopbalk werden als conversie aan de netwerken gemeld).

## Direct gedaan of opgedragen (geen test)
- Netwerkconversies en warm publiek alleen bij bewust afrekenen (lib/shopdirect.js isBewust).
- Reden van een mislukte betaling bewaren (hjdk:shop:betaalfout).
- Kijkersteller "… mensen bekeken dit vandaag" verborgen (telde bots); Babita haalt hem weg.
- Geen gezins- of kinderbelofte bij producten voor 14+ (lib/shoptekst.js).
- Babita-taak 0 in lib/shopprompt.js: doorgestreepte prijs, leeg reviewblok, placeholder-fee, Yoors-resten, cookiebanner, doodlopende routes, één levertijd, herroepknop, betaal-URL's.
- Henkjan: testbetaling door een vreemde via een advertentieklik (iDEAL, PayPal als gast, kaart); naam KADOLY in Stripe en PayPal; handelsnaam Kadoly in de KvK.

## Eerste arm (bouwen, live op Henkjans woord)
"Bewaar dit idee" via mmm.js op /product/, vorm onder, na 25 s in beeld, hoogstens 1 keer per 72 uur, alleen echte mensen uit PropellerAds of MGID; 50% controle zonder laag. Hoofdmaat: betaald per echt mens binnen 30 dagen.
Tekst: "Nog niet beslist? Bewaar dit idee. We mailen je de link naar dit product. Daarna nog één herinnering, ruim op tijd voor de feestdagen. Meer niet." [Je e-mailadres] [Mail mij de link] · "Nee, dank je". Mail 1 meteen, mail 2 één keer (ma 23 nov, uiterste besteldag pakjesavond wo 25 nov bij 3-5 werkdagen).

## Uitdagers
| Stap | # | Uitdager | M/A/P | Wie |
|---|---|---|---|---|
| Advertentie naar klik | 1 | Netwerk leert op bewust (koopknop na 8+ s en interactie), per campagne half oud half nieuw | M | wij |
| | 2 | Zoek- of Shopping-verkeer op dezelfde producten als scheidsrechter | M | wij, met Henkjans ja |
| | 3 | Afzender in de advertentie ("Van Kadoly uit Gouda: …") | A | wij |
| | 4 | iOS-Safari-arm, in-app-browsers uitgesloten (kost slots) | A/M | wij, met Henkjans ja |
| Klik naar geladen | 5 | Doorstuur sneller (geen wachttijd voor de 302, EU-regio) | A | wij |
| Product naar bewuste koopknop | 6 | Echte afzender bij de koopknop (Adsfair B.V., Gouda, App Henkjan) | A | wij + Babita (plek) |
| | 7 | Blok "In het kort": voor wie, leeftijd, wat zit erin, wanneer in huis | A/M | wij schrijven, Babita plaatst |
| | 8 | Nederlandse titel en eerste regels, merk en maker voor de geadverteerde producten | A/M | wij schrijven, Babita plaatst |
| | 9 | Rustige pagina voor advertentiebezoekers (taalkeuze, menu, 6-werkdagen-blok ingeklapt) | A | Babita |
| | 10 | Koopbalk pas na 3 s en een scroll | P | Babita |
| Tweede prompt | 11 | Gratis Sinterklaasgedicht bij het bewaarde Sint-product, tot 1 dec | M/P | wij |
| | 12 | Knop "Vraag het even aan …" (WhatsApp-deellink met Clickmind-kenmerk) | P | wij |
| | 13 | Remarketing alleen op wie mailde, 60+ s bleef of bewust tikte | P/A | wij |
| Afrekenen naar gestart | 14 | Klarna "betaal binnen 30 dagen" onder iDEAL, pas als het bewezen werkt en de regels na 20 nov gecheckt zijn | A | Babita + wij |
| | 15 | iDEAL vooraf gekozen, postcode + huisnummer vult het adres | A | Babita |
| | 16 | Apple Pay en Google Pay als eerste knop | A | Babita |
| Gestart naar betaald | 17 | "In je bank-app zie je: KADOLY. Lukt betalen niet? App Henkjan." | A | Babita |
| Aanbod | 18 | Drie heldenproducten naast de huidige mix | M | wij |
| | 19 | Bundel per merk rond €20-25 (enige manier om MGID rond te rekenen) | M | Babita + wij |
| | 20 | Ruilen tot half januari voor aankopen in november en december | A/M | Henkjan + Babita |

## Meetpunten
Bewust afrekenen per tik (tijd sinds laden, scroll of tik vooraf, vaste balk of hoofdknop), kpag alleen als in beeld, kpay zonder de tegels, terug naar product apart van weg, betaalknop bedekt of vrij, soort browser per klik (webview), tabblad weg en terug, unieke personen per stap, 403's per UA en ASN, koop koppelen aan de modal-beslissing.

## Stopregel (voorstel, Henkjan beslist)
- Tot een vreemde met succes betaald heeft: niet boven het Kadoly-plafond; faalt een betaalmethode, dan koud verkeer stil tot die werkt.
- PropellerAds koud: 3.000 nieuwe echte mensen en 0 betaald = stoppen.
- MGID losse producten: 150 nieuwe echte mensen en 0 betaald = stoppen; alleen bundels met 14+ euro marge.
- Bewaar-arm: minder dan 1 adres per 100 vertoningen = uit.
- Doorgaan alleen bij 1 betaalde bestelling per 250 echte mensen op push, of kosten per bestelling onder de marge.
