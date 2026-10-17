# Koopvraag-voorpagina, 17 oktober 2026

De drie bestaande domeinen houden hun eigen markt en catalogus. Nederlands: keuzehulp.best, Engels/VS: whichtobuy.best, Duits: kaufberater.best. Nieuwe markten vereisen een eigen domein-/padkeuze, gecontroleerde COPY, land, valuta, lokale catalogus en wederkerige taalverwijzingen. Er worden geen lege of automatisch vertaalde taalpagina's gepubliceerd. Een nieuwe taal wordt niet automatisch een nieuwe verkoopmarkt.

## Inhoud en doorstroom

`lib/koop-front.js` rendert de volledige voorpagina. Zoeken werkt lokaal met Unicode-normalisatie, product-synoniemen, titels, termen en situaties. Het is cataloguszoeken, geen generatieve chatbot of live voorraadzoekmachine. Vraagtekst verlaat het apparaat niet. De homepage heeft gewone server-gerenderde gidslinks, inhoudelijke vragen/antwoorden, een lokale canonical, wederkerige hreflang en CollectionPage/WebSite/ItemList-data die bij de zichtbare inhoud past. Zoekresultaten zijn uitbreidbaar in stappen van twaalf, maximaal drie kolommen. Het bestaande NL-SPEER-linkblok blijft beschikbaar voor de lopende indexeringsproef. Bestaande betaalde NL-campagnelinks behouden de oude conversie-afhandeling.

Een winkel-, prijs- of voorraadvraag opent de relevante bestaande keuzehulp bij het adviesblok. Er wordt geen voorraad of beste prijs verzonnen. De bestaande productbronnen en affiliate-tags blijven van kracht. De trendcijfers en de hypothese dat AI de volumegroei veroorzaakt worden niet als bewezen publieke feiten overgenomen.

## Metingen

`api/ontdek.js` telt begrensde dagelijkse Redis-hashes per markt. Verloop: weergave, beginnen met typen, zoekopdracht, resultaat/geen resultaat, voorbeeld, categorie, intentie, extra resultaten, keuzehulpklik, hulpweergave, eerste antwoord, verdere antwoorden, zichtbaar advies, winkelklik, FAQ, geopende catalogus, bekeken secties en taalwissel. Een browser-script op de bestaande keuzehulpen en handmatige tools neemt de attributie over via `via=fp&fpv=a|b&fpi=choose|where|price|stock&fps=...`.

Alle getallen zijn gebeurtenissen, geen unieke personen, bewezen aankopen of omzet. Herkomst is een indicatie via referrer/UTM, geen bewijs van een Google- of AI-klik. De bestaande definitieve GSC-metingen en affiliate-ordergegevens blijven apart. Een winkelklik is geen aankoop. Start- en adviesweergave zijn eenmaal per geopende pagina, antwoorden en kliks zijn gebeurtenissen.

Volledige zoektekst, e-mail en ruwe IP worden niet bewaard. Kortlevende rate-limits gebruiken een dagelijkse HMAC; rate-keys vervallen na 120 seconden. Daghashes vervallen na 45 dagen. Boten worden op user-agent uitgesloten; publieke eventtelling blijft indicatief en kan nooit alle botverkeer uitsluiten. Events en dimensies zijn begrensd en slugs worden aan de eigen catalogus getoetst. Schrijfacties worden atomair van een vervaltijd voorzien.

De levende overdracht toont bij iedere opvraag de laatste zeven dagen en de meest gebruikte keuzehulpen. Een uitgebreid rapport is beschikbaar via `GET /api/ontdek?op=report&market=nl|us|de&days=7`, met de bestaande HJDK_TOKEN in de `x-hjdk-token`-header, nooit in de URL. Gebruik ontbrekende meetdata niet als nul.

## Verbeteren

Knoptekst A/B per paginaweergave, gelijke kans, geen cookie: 'Vind mijn keuzehulp' versus 'Help mij kiezen', met gecontroleerde Engelse en Duitse teksten. Vergelijk per variant naast keuzehulpkliks ook winkelkliks per voorpaginaweergave. Aantallen zijn geen unieke conversieratio's; interpretatie kan terugkerende bezoeken omvatten. Minimaal honderd weergaven per variant is slechts een ondergrens voor onderzoek, geen significantiebewijs of automatische winstverklaring. Er wordt geen winnaar op te weinig data uitgerold.

Dagcontrole leest eerst overdracht en ZICHT-draaiboek. Controleer uitval per intentie, niet gevonden onderwerpen en hulpen met veel starts maar weinig winkelkliks. Verbeter de betreffende hulp of productmatching voordat meer pagina's worden gemaakt. Volledige niet-gevonden vragen worden bewust niet opgeslagen; vraag indien nodig expliciete feedback in een latere wijziging. Geen honderden zoekvarianten, geen automatische keyword-herhaling, geen valse datums of gegarandeerde AI-citatieclaims. Hompage-GSC-effecten zijn observationeel naast andere lopende proeven; schrijf er geen gecontroleerd causaal effect aan toe.

## Verificatie

Uitvoeren: `node checks/koop-front.mjs` (zoekt bronbestanden via de repo-paden). Controleert vraagmatching NL/EN/DE, filters en lege uitkomst, taalconfiguratie, canonical/hreflang, HTML/script-escaping, gewone gidslinks, JSON-LD, ingebedde scripts, eventvalidatie en meetrekenwerk. Alle gewijzigde JavaScript-bestanden krijgen ook een syntaxiscontrole. Controleer na uitrol drie homepages, een gids per markt, tracker, ongeautoriseerd rapport, eventvalidatie en actuele overdracht. Een echte aankoop wordt niet uitgevoerd voor QA.
