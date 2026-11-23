# Complete voorkant: werkend voorbeeld

Op verzoek van Henkjan, 23 november 2026. Voorbeeldroute /api/keuze-voorkant?market=nl (ook us en de). Deze route vervangt de bestaande homepages niet en draagt noindex,nofollow.

- Eén bestaande chat bovenaan; vier startkeuzes, bestaande antwoorden en rekenroutes.
- Complete catalogus uit live gegevens met vijf minuten geheugen. Bij onbereikbare gegevens de gecontroleerde momentopname van 23 november: NL511, US176, DE131.
- Zoeken, categoriefilters en alle gewone links in de HTML; categorieën blijven zonder JavaScript te openen.
- Bestaande rekeninterfaces en losse keuzemodules.
- Drie geplande kaarten per taal, met bron en onderscheid nieuwe hulp/uitbreiding in data/keuzehulpen-groei/voorkant-plan-2026-11-23.json. Geplande nieuwe hulpmiddelen krijgen geen startknop naar een niet-bestaande tool.
- Veelgebruikt komt uit de bestaande zeven-dagenmeting, minimaal drie geldige gebruiken; geen opvulling met ongefundeerde populariteit.
- Zwart-witte gedeelde huisstijl, dezelfde componenten in drie talen.

Broncode: fn/keuze-voorkant.js en lib/voorkant-compleet.js. api/[hjdkfn].js opnieuw gegenereerd, één serverfunctie met40 handlers.

Controle: scripts/test-voorkant-compleet.mjs en rooktest. Playwright in geïsoleerde browser: drie talen op360,390 en1280 px; geen horizontale overflow, één H1 en chat, vier startkeuzes. Zoeken en categoriefilters leveren de verwachte lijsten. Echte chatvraag naar fietsmaathulp beantwoord via de bestaande API. De productiehomepage is in deze ronde niet vervangen.
