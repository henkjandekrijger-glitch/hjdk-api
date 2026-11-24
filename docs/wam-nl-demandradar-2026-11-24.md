# WAM: Nederlandse zoekvragen en praktische hulp

Uitvoering 24 november 2026, America/Curacao. Opdracht Henkjan: kijk naar DemandRadar en voeg Nederlandse inhoud toe die de organische positie versterkt. De toestemming om in hjdk-api te schrijven en de hele WAM-site te publiceren geldt. Geen campagne gestart of budget gewijzigd.

## Keuze uit Demand Radar

Bestaande meting `machteloos`, markt NL, bijgewerkt 23 november 2026 om 20:15:24 UTC. Geen nieuwe zoekwoordinkoop. Ruwe geselecteerde records, maandreeks en AI-diagnose: `data/wam/demandradar-nl-2026-11-24.json`. Zoekvolumes zijn ramingen van de zoekmarkt, geen WAM-bezoek en geen voorspelling van haalbare kliks. Varianten overlappen en worden niet opgeteld.

| Zoekvraag in de meting | Volumesamenvatting per maand | Keuze en onderscheid |
| --- | ---: | --- |
| opzeggen postcodeloterij | 22.200 | Bestaande `/bedrijven/postcodeloterij` aanvullen met directe officiële lotenroute, meerdere loten, bevestiging en latere afschrijving. |
| geld terug bij vertraging ns | 9.900 | Bestaande `/bedrijven/ns` aanvullen met route per vervoerbewijs, betaalpas/telefoon, aanvraagtermijn en uitzonderingen. |
| incasso flanderijn | 14.800 | Bestaande `/bedrijven/flanderijn` verdiepen: soort document, afzonderlijke kosten, bezwaar versus klacht, begin betaaltermijn. De laatste vijf maandwaarden liggen tussen 1.900 en 2.900; zie de afbakening hieronder. |
| incassokosten berekenen | 1.300 | Nieuwe gratis rekenhulp met gewone wettelijke staffel, één losse consumentenrekening. Geen vergelijkbare calculator gevonden bij repositoryzoekopdracht op incassokosten. |

Afbakening bij Flanderijn: de volledige opgeslagen reeks is leidend. De laatste vijf waarden zijn **2.900, 1.900, 1.900, 2.400, 2.400**. De samenvatting 14.800 is dus geen actuele maandclaim en de trendkolom is niet als groei geïnterpreteerd. Dit onderwerp is mede gekozen vanwege de bestaande lezerstaak op WAM en de aansluiting op de rekenhulp.

VriendenLoterij (33.100) en Videoland (18.100) hebben al praktische inhoud. Eerst de minder ingevulde bestaande pagina’s verbeteren. Volgende kandidaten: Ziggo/KPN met betaalroute en bevestiging van opzegging; PostNL met juiste partij voor onderzoek. Alleen na aparte primaire bronnencontrole, geen reeks generieke artikelen voor zoekvarianten.

## Wat de AI-diagnose wel en niet aantoont

ZICHT `gapscan`, naam `wam-nl-content-20261124`, model `perplexity/sonar`, 3/3 vragen gelukt, geen fout. Dit is één diagnose bij één model, geen meting van alle LLMs, geen SEO-nulmeting en geen bewijs dat WAM na publicatie wordt geciteerd.

1. **Hoe zeg ik de Postcode Loterij online op als ik meerdere loten heb?** Antwoord bruikbaar; genoemde bronhost `datisnietnoodzakelijk.nl`. WAM voegt de daadwerkelijk gelezen officiële route en controle van bevestigde lotnummers toe.
2. **Hoe vraag ik geld terug bij NS-vertraging als ik met mijn betaalpas reisde?** Antwoord bruikbaar, bron `ns.nl`. WAM onderscheidt betaalpas, OV-kaart, zakelijke kaart en internationaal vervoerbewijs, met directe bronlinks.
3. **Een brief van Flanderijn ontvangen, hoe controleer ik de incassokosten?** Antwoord noemt `flanderijn.nl` en `kvk.nl`, met 15 dagen zonder uitgewerkt startmoment. Vijftien dagen na ontvangst is op zichzelf niet fout: de Rechtspraak noemt ook deze formulering. WAM legt de veertien volle dagen vanaf de dag ná ontvangst uit en vermijdt een eigen oordeel over individuele brieven.

Het bestaande dagelijkse panel van vier dossier-/VriendenLoterijvragen blijft behouden. Nieuwe vragen apart opvolgen zodat de eerdere meetreeks vergelijkbaar blijft.

## Gelezen primaire bronnen

- Postcode Loterij: `https://www.postcodeloterij.nl/opzeggen?wmstepid=opzeggen`, daadwerkelijk in de browser gelezen en FAQ uitgeklapt. Directe lotenroute `https://mijn.postcodeloterij.nl/loten#abonnementwijzigen`; actuele opzegtelefoon 088 020 1050, gratis zelf online opzeggen en lotnummer op afschrift. Geen oude reglementtelefoon overgenomen; geen account geopend of echte deelname beëindigd.
- NS: `https://www.ns.nl/service-en-contact/geld-terug/geld-terug-bij-vertraging`, plus vertragingsvoorwaarden-PDF en `https://www.ns.nl/service-en-contact/geld-terug/welke-vergoeding-biedt-ns`. Gewone regeling vanaf 30 minuten op bestemming en aanvraag binnen drie maanden; HSL en internationaal afzonderlijk. Geen algemeen teruggaafpercentage voor alle vervoerbewijzen berekend.
- De link voor internationaal reizen is vanuit de officiële NS-pagina gevolgd naar `https://www.nsinternational.com/nl/na-de-reis/geld-terug-vragen`. De eerder voorbereide onjuiste diepe URL is vóór publicatie vervangen.
- Flanderijn: `https://www.flanderijn.nl/betalen/advies-of-bezwaar/`, onderscheid documenten, bezwaar en klacht. Kosten narekenen vervangt geen reactie op een dagvaarding, vonnis of dwangbevel.
- Rijksoverheid: consumenteninformatie `wanneer-incassobureau` en `hoogte-incassokosten` onder `/themas/economie/bescherming-van-consumenten/vraag-en-antwoord/schulden/`. Gewone staffel en officieel voorbeeld €3.500 → €475.
- Rechtspraak: actuele staffelpagina (bijgewerkt 1 oktober 2024) en aanbeveling veertiendagenbrief-PDF, exact gelinkt in de gepubliceerde bronsecties. De oorspronkelijke uitspraakpagina was niet volledig toegankelijk; niet als gelezen volledige uitspraak opgevoerd.
- Artikel 2 Besluit vergoeding voor buitengerechtelijke incassokosten: `https://zoek.officielebekendmakingen.nl/stb-2012-141.pdf`, oorspronkelijke publicatie. Voor actualiteit van de termijnuitzondering daarnaast Rechtspraak/Inspectie geraadpleegd.
- Inspectie JenV: `https://www.inspectie-jenv.nl/toezichtgebieden/t/toezicht-op-de-incassomarkt/faq-incassodienstverlener`. Terugkerende termijnen tot €266,67, terugkijkperiode zes maanden en onder voorwaarden €20. Geen algemene totaallimiet voor ieder samenstel van schulden voorgespiegeld.

## Bouw en grenzen

Drie bestaande bedrijfspagina’s openen nu met praktische uitleg en officiële route. Het reviewbeeld, positieve en negatieve ervaringen, gedateerde bronafweging en gemodereerde reactie blijven aanwezig, afzonderlijk herkenbaar. De echte Blendle- en ANP-dossiers blijven vooraan op de homepage. Videoland gebruikt dezelfde generieke renderer; de bestaande inhoud en FAQ blijven behouden.

`/incassokosten-berekenen` gebruikt één pure rekenkern op server en browser, gehele centen en afronding na optellen van schijven. Minimale gewone staffel €40, plafond €6.775. Exclusief eventuele btw, rente, proceskosten en deurwaardershandelingen. Geen oordeel of de vordering of kosten verschuldigd zijn. Btw is niet automatisch 21%; de voorwaarden uit artikel 2 staan in de zichtbare FAQ.

De eerste vraag bewaakt de reikwijdte: één losse consumentenrekening, terugkerende termijnen/meerdere rekeningen of zakelijk. Alleen de eerste route rekent. Geen persoonsgegevens of brieven nodig, geen AI-aanroep. Interactief delen gebruikt de URL-fragmentidentifier, bedragen gaan niet in Clickmind-actiemetingen. De serverfallback zonder JavaScript gebruikt een GET-formulier met alleen bedrag en situatie; de canonical blijft de schone URL. Voorbeelden en alle FAQ staan al in de HTML.

Sitemap bevat de nieuwe route; gewone interne links, `llms.txt`, FAQ-/Article-/WebApplication-schema op zichtbare inhoud en de IndexNow-lijst zijn bijgewerkt. Schema en llms.txt zijn geen gegarandeerde ranking- of citeerhefboom.

## Controle en vervolg

34 gerichte tests slagen, waaronder schijfgrenzen, officiële voorbeelden, minimum/plafond, Nederlandse invoer, server/browsergelijkheid, scope en ontsmetting, zichtbare FAQ/schema, canonical en de bestaande reactie-/aanmeldroutes. Routercheck en commentaarcheck slagen. Geen gehele-repositoryrooktest geclaimd vanuit de gedeeltelijke lokale checkout. Mobiel 390×844 en desktop 1280×900 daadwerkelijk in de browser bekeken: geen horizontale uitloop, hoofdtekst 19/20px; calculator €3.500 → €475 en termijnroute gecontroleerd. Onafhankelijke read-only audit uitgevoerd; gevonden URL-statefout bij teruggaan na serverinvoer hersteld en opnieuw gecontroleerd. Oude invoer wordt bij wisselen gewist, overige campagneparameters blijven behouden.

Observatieproeven in `/zicht.json`: drie verdiepte URLs tegenover ongewijzigde KPN/Ziggo/ANWB als context (geen randomisatie), plus aparte ontdekking van de calculator. Hercontrole **1 december** en **8 december**: bereikbaarheid/indexstatus, zoekvragen, vertoningen en kliks waar Search Console-toegang bestaat, organische Clickmind-landingen per URL en herhaling van de drie specifieke AI-vragen. Geen beschikbare GSC-nulmeting; onbekend blijft onbekend. IndexNow-ontvangst is geen indexeringsbewijs.

Noordster blijft 1.000 organische bezoeken per dag op 31 december 2026. Eerste volledige WAM-meetdag is 25 november. Verkeer uit campagnes, AI, onbekende herkomst en bots apart houden. Dagelijkse taak gebruikt ook deze prioriteiten via de bijgewerkte overdracht.
