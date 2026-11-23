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

## Bezoekers laten kiezen en actualiseren

Op verzoek van Henkjan, 23 november: bij alle geplande kaarten een stemknop, één actieve voorkeur per browser en taal, te veranderen of in te trekken. Alleen positieve aantallen zichtbaar. Stemmen worden met een atomaire Redis-opdracht opgeslagen; herhaalde identieke verzending telt niet dubbel.

Elke vermelding (gids, rekentool, veelgebruikt en losse module) heeft datumgegevens en Vraag om update. Gidsmetadata behoudt updatedAt en publishAt uit de inhoud. De bekende statische datums komen uit de betreffende bronmodule: NL seed-baseline fn/kz.js UPDATED, fietsmaat 17 oktober, hypotheek/huis/huisdier 19 november. Ontbreekt een betrouwbare datum, dan staat er Updatedatum onbekend. Het controleren van de catalogus verandert de inhoudsdatum niet. Geplande kaarten tonen de plandatum.

Na succesvolle registratie gaat het verzoek als bericht naar de bestaande chat. De chat vraagt wat er moet worden gecontroleerd; de invoer bevat de betreffende hulp voor het vervolgbericht. Geen AI-belofte dat een wijziging al is uitgevoerd. Bij een opslagfout staat er dat het verzoek niet is opgeslagen, met opnieuw proberen. Het aantal updateverzoeken wordt eenmaal per browser, hulp en inhoudsversie verhoogd.

Lees geaggregeerde feedback via /api/keuze-voorkant?market=nl&op=signalen, ook us en de. Preview en live hebben gescheiden namespaces; deze handler schrijft uitsluitend preview. Er worden geen naam, mailadres of vrije berichten in het feedbacklog opgeslagen. Browserkenmerk en tijdelijke limiet per netwerk zijn gehasht. Tellers en deduplicatie blijven maximaal 400 dagen na activiteit, tijdelijke netwerkbeperking 120 seconden. Openbare JSON bevat alleen aantallen en laatste verzoekdatum.

Dagronde: lees alle drie de signaaloverzichten, vergelijk met de vorige momentopname en neem actuele updateverzoeken en favoriete plannen mee naast Demand Radar, bronnen en de bouwrem. Previewreacties apart houden van publieksdata; testverzoeken zijn geen bezoekersvraag of groeibewijs. Een geteste preview-update voor fietsmaat kan uit deze bouwronde komen.
