---
name: "vraagsignalen"
description: "Gebruik vóór je een campagne opzet of producten, angles en prijzen kiest: verzamelt alle signalen van bestaande vraag (zoeken, marktplaatsen, lang lopende advertenties, eigen data), scoort ze en levert vraagkaarten aan de leerlus."
---

# Vraagsignalen: vraag vinden vóór je geld uitgeeft

Demand Radar is de dienst die deze vraagsignalen levert (Henkjan 25 nov 2026: "Zet demandradar er als aparte dienst uit. Dat is de vraag signalen."): https://demandradar-ivory.vercel.app/ (NL, DE, US; AI-gaten op /api/gaps?latest=1). Kijk daar eerst. Bouw geen losse verzameling ernaast: ontbreekt een bron uit deze skill, dan komt die in Demand Radar.

Doel: voor een catalogus of een set aanbiedingen vooraf bepalen waar al vraag naar is, op welk moment, met welke boodschap en tegen welke prijs. Pas daarna gaat er iets de campagnes in. Deze skill levert de keuze; de skill `leerlus` test en meet. De uitkomsten van de leerlus stellen de weging van deze skill weer bij.

Werk in de cloud (Vercel-cron, gegevens in KV), los van de laptop. Sleutels staan als gedeelde team-variabelen in Vercel. Rapporteer in gewone taal met ingevulde cijfers.

## Grondregels

1. Gedrag telt meer dan meningen. Volgorde van bewijskracht: echte verkopen of voorverkoop > klik naar afrekenen > verkooprang en groei van reviews op marktplaatsen > zoekvolume > advertenties van anderen > peilingen en "zou je dit kopen". Peilingen alleen als zwak startpunt.
2. Vraagsignalen (kopers die iets doen) en aanbodsignalen (verkopers die geld inzetten) apart houden. Veel adverteerders bevestigt vraag, maar betekent ook concurrentie. Tel het aan beide kanten.
3. Geen enkel signaal beslist alleen. Een kandidaat gaat pas de test in als minstens twee onafhankelijke bronnen het eens zijn.
4. Generieke vraag, geen merkvraag. Zoek op wat het is ("windspinner tuin", "book nook"), plus "goedkoop", "alternatief", "cadeau". Merknamen apart en laag wegen.
5. Lokaal weegt zwaarder dan wereldwijd. NL-signalen volle weging; VS/TikTok-trends als vroeg signaal op halve weging.
6. Elke stap wordt bewaard (datum, bron, waarde), zodat je je eigen geschiedenis opbouwt. Advertentiebibliotheken tonen maar een venster; je eigen dagelijkse momentopnames laten zien wat blijft draaien en wanneer varianten bijkomen.

## Stap 1. Kandidaten en zoekwoorden

- Haal de catalogus of de aanbiedingen op (titel, prijs, marge, categorie, voorraad, levertijd).
- Maak per kandidaat 3 tot 8 zoekwoorden in de taal van het land: wat het is, waarvoor, voor wie, en de cadeauvorm. Groepeer gelijksoortige producten tot een thema; meet vraag op thema en kies daarna het product.
- Leg per kandidaat de economie vast: prijs, marge, verzendkosten, het totaal dat de koper betaalt.

## Stap 2. Signalen verzamelen (per laag)

Lees per bron wat het bewijst en of het vooruitloopt (lead) of bevestigt (confirm).

**A. Eigen data (altijd eerst, gratis en het meest waard)**
- Zoekwoorden in de eigen shop, bekeken, bewaard, vergeleken, "Nu kopen" getikt, winkelwagen, betaald.
- Uit eerdere campagnes: echte mensen, doorklik naar de productpagina, per advertentie, thema, plek en uur.
- Dit is de enige bron die over dit verkeer en deze klanten gaat. Andere bronnen voorspellen, deze meet.

**B. Zoeken (lead, weken tot maanden vooruit)**
- Zoekvolume per maand per land: Google Ads Keyword Planner (`GenerateKeywordHistoricalMetrics`, NL = 2528, Nederlands = 1010) of goedkoper via DataForSEO.
- Richting: Google Trends via DataForSEO of SerpApi (pytrends werkt niet meer; de officiële Trends API is in alfa, op aanvraag). Gebruik de helling over 12 weken tegenover dezelfde weken vorig jaar.
- Autocomplete van Google, Amazon en bol: een nieuwe suggestie is een goedkoop vroeg teken.

**C. Marktplaatsen (bevestigt, 1 tot 3 weken achter)**
- Google Merchant Center Best sellers (Merchant API `reports.search`, `BestSellersProductClusterView`): wekelijkse ranglijst per land en categorie, ook voor producten die je niet hebt, met `relative_demand` en de vlag RISER. Gratis, NL gedekt. Sterkste enkele bron voor NL.
- bol.com Marketing Catalog API: `/products/lists/popular` per categorie, ratings, "vaak samen gekocht".
- Amazon: Best Sellers, Movers & Shakers (24 uur, snelste stijger), "X bought in past month". Geen officiële lijst-API; via een scrape-dienst. Keepa voor rangverloop, maar Keepa dekt amazon.nl niet: gebruik amazon.de als benadering.
- AliExpress affiliate API `hotproduct.query`, gesorteerd op verkoopvolume, met `ship_to_country`. Laat zien wat wereldwijd in bulk verkoopt; loopt vaak voor op Europese winkels.
- Etsy API voor smaak bij handgemaakt en DIY (favorieten, geen verkoopcijfers).

**D. Advertenties van anderen (aanbod dat geld inzet)**
- Meta Ad Library API `ads_archive` met `ad_reached_countries=['NL']`: door de DSA staan alle advertenties die de EU bereiken erin, met start- en stopdatum en EU-bereik. Gratis; vergt een geverifieerde Meta-app. Zoek per thema-zoekwoord, dagelijks, en sla op.
- TikTok Commercial Content API (EU, op aanvraag), Snapchat Ads Gallery API (open, zoeken op adverteerder), Google Ads Transparency als BigQuery-dataset (EER, onvolledig).
- Push, pop en native: alleen via betaalde spy-tools zonder API (Anstrex, AdPlexity, SpyPush, gratis Spy.House). Die tonen vooral welke angles en landingspagina's werken op dit verkeer, niet welk product. Handwerk, maandabonnement alleen als het iets oplevert.
- Lezen van looptijd: korter dan 7 dagen is een test, 14 tot 29 dagen gevalideerd, 30 dagen of meer een winnaar. Looptijd is een filter, geen ranglijst.
- Sterkste teken: nieuwe varianten met een recente startdatum naast een oude advertentie die blijft lopen. Dat is opschalen op winst.
- 3 tot 10 onafhankelijke adverteerders op hetzelfde product is gezond; boven de 20 is het verzadigd.
- Neem van lang lopende advertenties het soort haak over (demo, voor en na, probleem en oplossing, cadeau) en het prijspunt. Nooit het beeld of de tekst zelf.

**E. Social en vroege trends (vroegst, het meest ruis)**
- Pinterest Trends API (growing, seasonal; op aanvraag). Sterk voor wonen, tuin, feestdagen en cadeaus: mensen plannen daar weken vooruit.
- TikTok Creative Center (Top Products, trending hashtags): geen officiële API, alleen via scrapers.

**F. Verkeer en netwerken (kan dit verkeer het dragen)**
- Volume en prijs per land, OS en formaat: Mondiad `list_traffic_inventory`. PropellerAds heeft geen schatter in de API; statistiek per plek wel (`group_by=zone_id`, met `win_rate`, `is_broker`).
- Wat verkoopt op push en pop: impulsaankopen van ongeveer €10 tot €30, zichtbare korting, seizoen, cadeau, "nieuw of viraal". Boven €50 zelden bij een eerste koud bezoek; gebruik die als anker naast goedkopere.

**G. Affiliate-netwerken (vraag met prijs eraan)**
- EPC, conversie en topproducten: Awin `programmedetails`, Admitad, impact.com Catalogs, Daisycon, bol-partner, AliExpress hot products met commissie. Een hoge EPC in een categorie is bewijs dat er op dat moment gekocht wordt.

**H. Seizoen en kalender**
- Ontleed de reeks in trend en seizoen. Hoog seizoensaandeel = timen, geen trend.
- NL 2026: Halloween 31 okt; Singles Day 11 nov; Black Friday 27 nov (koopweek schuift naar de week ervoor, "Black November"); Sinterklaas 5 dec (pakjesavond-verzendgrens rond 2 tot 3 dec); Kerst. 2027: Valentijn 14 feb, Moederdag 9 mei, Vaderdag 20 jun, tuinseizoen maart tot juni.
- Testen 4 tot 6 weken voor de piek, opschalen in de laatste 1 tot 2 weken. Voor 2026: Sinterklaas en Black Friday testen half okt tot 10 nov, opschalen 18 tot 27 nov; Kerst testen voor 20 nov, opschalen 1 tot 18 dec.

## Stap 3. Opschonen en bewaken

Pas per signaal toe vóór het scoren:

| Valkuil | Bewaking |
|---|---|
| Overlevingsbias in advertentiebibliotheken | Minstens twee keer gezien met een week ertussen; nooit alleen beslissend |
| Seizoenspiek die op een trend lijkt | Als trend tellen alleen bij stijging over 8 weken én meer dan 1,2 keer dezelfde week vorig jaar |
| Alleen merkvraag | Merk en generiek scheiden; alleen generiek plus "goedkoop/alternatief" telt |
| Verzadiging | Te veel adverteerders of top-10 met elk 1000+ reviews telt negatief |
| Prijs hoger dan de markt | Eigen prijs gedeeld door de NL-mediaan; boven 1,15 alleen met een duidelijke reden |
| Eén plek of één bron domineert | Geen winnaar als meer dan de helft van de resultaten uit één plek komt; herhalen op een tweede netwerk |
| Nepverkeer | Tel echte mensen (pagina zichtbaar, gescrold of getikt, 5 seconden of meer, hetzelfde toestel binnen 24 uur één keer). Laat pop en verkeer met weinig echte mensen buiten de vraagmeting |
| Te kleine aantallen | Beslis op kansen (zie stap 6), niet op een tussenstand |
| Verdacht goed resultaat | Eerst controleren op bots en één bron, dan pas geloven |

## Stap 4. Score per kandidaat

1. Zet elk signaal om naar een rangpercentiel binnen de catalogus (0 tot 1). Ontbreekt het: 0,5 en lagere zekerheid.
2. Startweging (een ontwerpkeuze, geen vaststaand gegeven; de leerlus stelt bij):
   - 30% zoeken: volume (log) maal de helling tegenover vorig jaar
   - 25% marktplaats: Merchant Center-rang en RISER, bol popular, Amazon-rang
   - 20% advertenties en social: lang lopende advertenties in NL, Pinterest of TikTok-groei
   - 15% seizoen: dagen tot het passende moment
   - 10% past bij dit verkeer en deze winkel: prijsband, marge, niet goedkoper te koop bij Action, HEMA of vergelijkbaar
   - Concurrentie als omgekeerde U: een paar adverteerders is goed, heel veel trekt af.
3. Geef een fase: stijgend en versnellend (vroeg), stijgend maar vertragend (bijna verzadigd), seizoen, stabiel, dalend.
4. Zekerheid: hoog als 4 of meer lagen hetzelfde zeggen, middel bij 2 tot 3, laag bij 1.

## Stap 5. Vraagkaart en campagne-input

Eén kaart per kandidaat, opgeslagen in KV en zichtbaar op een overzichtspagina:

- Wat: product of thema, prijs, marge, totaal dat de koper betaalt.
- Score, zekerheid, fase.
- Bewijs: per signaal de waarde, de bron (link) en de datum.
- Risico's: seizoen, merkaandeel, verzadiging, prijs boven de markt.
- Advies:
  - Angle uit waar de vraag vandaan komt: probleemzoekwoorden → probleem; seizoen binnen 6 weken → cadeau of seizoen; versnellende trend met weinig reviews → nieuw; bestseller → "populair". Test 2 tot 3 angles.
  - Getoonde prijs: de echte prijs als die op of onder de markt ligt, anders het voordeel of de korting voorop. Toon het hele bedrag (inclusief verzending).
  - Haak voor de advertentie, afgeleid van lang lopende advertenties.
  - Venster: wanneer testen, wanneer opschalen.
  - Testbudget, netwerken, land.
  - Stopregel en opschaalregel (stap 6).

Alleen kaarten met minstens middel zekerheid en een positieve marge gaan naar de leerlus. Lever per ronde 6 tot 8 kandidaten, één thema per angle.

## Stap 6. Overdracht aan de leerlus en terugkoppeling

- Zet de score om naar een startverwachting voor conversie: verwachting = basisconversie maal (0,5 + score), sterkte 20 tot 50 schijnkliks. Na de test komen de echte kliks en verkopen erbij (Beta-verdeling).
- Budget per ronde naar de kandidaten met de beste getrokken verwachting maal marge min klikprijs (Thompson-sampling, past in een paar regels JavaScript).
- Break-even-conversie = klikprijs / (gemiddelde orderwaarde maal marge). Stoppen: nul verkopen na een uitgave van twee keer de toegestane kosten per order, of minder dan 10% kans om break-even te halen. Opschalen: 5 of meer verkopen én 90% kans erboven, verspreid over meerdere plekken.
- Zolang verkopen nog niet gemeten worden: beslis op echte mensen naar de productpagina en op winkelwagen-starts, met ongeveer 400 tot 750 echte bezoekers per angle voor een eerlijke vergelijking.
- Terugkoppeling: label elke afgeronde test (gewonnen of niet) en schuif de weging van elk signaal op naar wat echt voorspelde. Tot er 30 tot 50 tests zijn, blijft de weging dicht bij de start. Rapporteer per signaal hoe vaak het een winnaar aanwees.

## Wat de eigenaar moet aanleveren (eenmalig, als gedeelde Vercel-variabelen)

- Meta developer-app met identiteitsverificatie, voor de Ad Library API (token verloopt na 60 dagen, tenzij systeemgebruiker).
- Merchant Center-account (gratis) voor Best sellers.
- DataForSEO-account (zoekvolume en Trends, centen per opvraging).
- Advanced API-toegang bij AliExpress affiliate voor hot products.
- bol Marketing Catalog API (via het partneraccount).
- Optioneel: TikTok Commercial Content API-aanvraag, Pinterest Trends-toegang, een maand Anstrex voor push-angles.

Vraag deze alleen aan als ze nog niet bestaan, en ga intussen door met de bronnen die al werken.

## Rapport

Wekelijks (in seizoen dagelijks): de top 10 vraagkaarten met score en reden in één zin, wat er nieuw stijgt, wat er afvalt, welke tests de leerlus nu draait, en per signaal hoe goed het tot nu toe voorspelde. Gewone taal, cijfers ingevuld, links naar de live pagina.

## Bijlage: Yoors Shop

- Eigen bronnen: catalogus via `yoo.rs/shop/api/shop`, shopzoekwoorden via `/api/search-terms`, gedrag op de productpagina (view, bewaren, vergelijken, "Nu kopen"), en de leerlus op keuzehulp.best (`/api/shop/voorpa`, `/api/shop/overzicht?json=kort`) met echte mensen en doorkliks per product, advertentie, plek en uur.
- Lessen tot nu toe (okt 2026): wonen en cadeau klikten het best door; de avond (20 tot 23 uur) werkt het best; bijna alle PropellerAds-doorkliks kwamen van één plek (dus nog geen brede vraag bewezen); Clickadu leverde weinig echte mensen; verkopen worden nog niet teruggemeld, dus beslissen op doorklik en winkelwagen tot dat werkt.
- Prijsband die past bij dit verkeer: tot ongeveer €30 als hoofdproduct, duurdere producten als anker of in de bundel.
- Concurrent om op te letten bij goedkope decoratie en feestartikelen: Action.