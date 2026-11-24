# UX-review van de keuzehulpenchat

Op verzoek van Henkjan beoordeelden vier gespecialiseerde AI-reviewers onafhankelijk de visuele rust, gespreksflow, toegankelijkheid en taakvoltooiing. Zij bekeken broncode en bestaande mobiele/desktopscreenshots. De gespreksreviewer reproduceerde fouten met lokale DOM- en fetch-mocks. Dit was geen bezoekersonderzoek en levert geen conversiebewijs op.

| Bevinding | Correctie | Controle |
|---|---|---|
| Mobiele chat stond18px verder naar binnen | Extra chatpadding weg; hero-marge24px | Bronverificatie door visuele reviewer |
| Eerste zin werd na100tekens afgebroken | Hele eerste zin zichtbaar; volledige originele antwoordtekst blijft beschikbaar | Pure helpertests, inclusief voorwaardelijk advies |
| Vertraagd updateantwoord wisselde de actieve hulp | Laatste klik bepaalt de context; oudere antwoorden kunnen die niet overschrijven | Omgekeerde antwoordvolgorde gereproduceerd en opnieuw getest |
| Toelichting kon tijdens eerste registratie koopvraag worden | Updatemodus start onmiddellijk; verzenden wacht op registratie | Pending-submit-regressie |
| Vertraagde fout/opslag kon nieuwe tekst wissen | Alleen de daadwerkelijk verzonden tekst wordt gewist of hersteld | Koop- en updatedraft-regressies |
| Moduswissel veranderde de bestemming van een concept | Koopconcept en updateconcepten per hulp apart bewaard | Moduswissel A/B/koop/A getest |
| Focus verdween bij antwoordknoppen | Invoerveld krijgt focus zonder paginasprong | Gerichte focustest |
| Herhaalde linknamen misten het onderwerp | Update-/stemlabels bevatten de titel en volgen de zichtbare status | HTML-/broncontrole |
| Oude berichten vielen buiten benoemde historie | Historie is een eigen benoemde regio | Rendercontrole |
| Fietsmaat/cadeauantwoord miste soms een bestemming | Alleen bij expliciete taak een bestaande hulp als terugval | Routehelpertests; cadeauherkenning per taal |

De functionele reviewer herhaalde de eerder gevonden races en moduswissels onafhankelijk. Alle concrete eerdere fouten waren in die herhaling opgelost. Alle netwerkantwoorden in deze reproducties waren gemockt; er zijn geen testtoelichtingen als bezoekersdata ingestuurd.

Verificatie: scripts/test-voorkant-chat.mjs, scripts/test-voorkant-updategesprek.mjs, scripts/test-voorkant-races.mjs, scripts/test-voorkant-signalen.mjs, scripts/test-voorkant-compleet.mjs en de bestaande rooktest. De volledige huidige werking wordt als preview aangeboden; gedeelde productiechat en AI-backend zijn in deze review niet herschreven.

Nog apart te verbeteren: de algemene cataloguszoeker behandelt stopwoorden letterlijk en toont de losse cadeauvinder niet tussen de818 catalogusgidsen. De updatetoelichting is160tekens; die grens wordt nu vermeld. Echte gebruikstests blijven nodig om te weten of bezoekers hiermee sneller hun taak afronden.

Aanvulling24november: voor beide hierboven genoemde zoekproblemen is de reparatie getest voor de previewbranch. Henkjan heeft op 24 november expliciet toestemming gegeven voor publicatie van de zes voorbeeldbestanden. Gewone zoekzinnen in drie talen worden getoetst tegen de bewaarde catalogus, inclusief bestaande cadeauvinder en losse hulpen. Ontkenningen, eigenschappen en bedragen blijven zoekwoorden; modules worden op slug ontdubbeld. Twaalf zoekscenario's en de acht eerdere race-/conceptregressies slagen. Deze technische controles zijn geen gebruiks- of conversiebewijs.

