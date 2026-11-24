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

## Correctie na Henkjans test

De oude ingevulde tekst Update voor [hulp]: werd bij versturen als koopvraag behandeld. Nu blijft een updateverzoek een apart gesprek binnen dezelfde chat: het formulier onderschept verzenden zolang een updateverzoek actief is, registreert de toelichting bij de gekozen slug en bevestigt de opslag. Er gaat geen verzoek naar het koopadviesmodel en er volgen geen productpills of onthoudvraag. Nieuwe vraag sluit deze toestand af. Het invoerveld blijft leeg met een duidelijke vraag wat moet veranderen. Bij een fout blijft de tekst staan om opnieuw te proberen.

Toelichtingen worden met de bestaande schoon-functie ontdaan van mailadressen, telefoonnummers en URLs, beperkt tot 160 tekens en eenmalig in het bestaande intentielog gezet met bron update-preview, scope, de volledige slug en datum. Dit telt niet mee in het gewone chat-/groeimodel. De openbare signaal-API geeft geen toelichting of browserkenmerk terug. Dagronde leest via de beschermde preview-host /api/keuze-tools?tool=intentie&n=200 en filtert laatst op bron=update-preview. Behandel dit als onderhoudsverzoek.

Ontwerp op verzoek van Henkjan: 16px voor tekst, knoppen, labels, chatkoppen en kaartkoppen; alleen de paginatitel groter. Vraag vet, antwoord normaal, geen verticale antwoordlijnen of herhaalde afzenderlabels, geen gekleurde vraagballonnen en één rand rond het invoerveld. Opmaak voor dit voorbeeld in lib/chat-rust.js wordt uitsluitend door lib/voorkant-compleet.js geladen. lib/kzux.js blijft ongewijzigd. Voorlopig alleen deze previewbranch, bestaande productiehomepages zijn niet vervangen.

De automatische goedkeuringscontrole blokkeerde het volledig terugschrijven van de gedeelde chatmodule wegens de bredere productiefunctionaliteit. De correctie gebruikt daarom alleen de bestaande publieke chatinterface en lokaal begrensde previewopmaak. De afgewezen module is niet gepusht.

## Compact gesprek na tweede schermtest

De gebruiker zag nog steeds een uitdijend gesprek met herhaalde vervolgvraag en veel witruimte. De voorkant heeft nu één eigen compacte presentatie in lib/voorkant-chat.js die rechtstreeks de bestaande keuzehulp-chat-API gebruikt. De gedeelde lib/kzux.js, AI-aansturing, veiligheids- en budgetcontroles blijven ongewijzigd. Er komen geen extra geheugen-, volg- of deelvragen uit de oudere chatpresentatie bij. De aanwezige rekenhulpen blijven bereikbaar via hun gewone links en de chat verwijst naar dezelfde hulp-API.

Alleen de actuele vraag en reactie staan open. Eerdere beurten zijn ingeklapt en lange uitleg staat onder Hele antwoord. De actuele antwoordknoppen worden volledig getoond; het invoerveld staat daar direct onder. Per antwoord één korte zin als samenvatting; alle overige inhoud staat onder Hele antwoord. Hoogstens één vervolgvraag en drie antwoordknoppen, één gewone link naar de gevonden hulp. Eerdere vragen staan ingeklapt onder Vorige vragen. De geschiedenis blijft beschikbaar in het gespreksvak en gaat mee naar dezelfde API. De intro blijft boven de chat staan. Stemmen, volledige catalogus, datums en updateverzoeken blijven intact.

Een updateverzoek onderbreekt een eventueel nog lopend koopantwoord. De toelichting blijft in de afzonderlijke updatetoestand tot Nieuwe vraag. De werkomgeving-beveiliging is niet uitgezet of gewijzigd.

Browsercontrole: 390px en1280px, vijf gespreksbeurten, twee actuele berichten en acht ingeklapte historische berichten, één vervolgvraag en drie opties; geen JavaScriptfouten of horizontale overflow. Updateknop voor fietsmaat en toelichting leveren uitsluitend feedback/update-detail op; Nieuwe vraag schakelt terug naar de gewone chat. Echte online chatvraag naar fietsmaatrekenhulp kreeg een antwoord via de bestaande API. Lange tekst is een kort fragment met Hele antwoord; samengestelde vragen worden beperkt tot het eerste gevraagde gegeven. De actuele vraag blijft bovenin het gespreksvak zichtbaar.
