# Kadoly: checkout en betaling, controle 23 november 2026

## Wat vaststaat

- De shopfeed bevat 27 orderregels en 5 betaalde regels over 28 dagen. Alle 22 verlopen regels zijn van vóór 11 november; 20 daarvan hebben methode PayPal.
- Over de laatste 7 UTC-kalenderdagen zijn er 2 feedorders, allebei betaald: één iDEAL en één Klarna, samen EUR 91,36. Dit zijn slechts twee waarnemingen, geen bewezen structureel succespercentage.
- De historische gidsproef bevat 5 betaalstartmeldingen: 3 op 3 november, 1 op 7 november en 1 op 12 november. In OVERDRACHT-YOORS-SHOP.md staat expliciet dat de betaalstarts op 3 november Henkjans tests waren. Er staat ook een gids `test-check` tussen de afrekenmeldingen.
- De gidsproef bewijst daardoor geen 5 onafhankelijke echte klanten die alle 5 bij de bank uitvielen. Een kansberekening tegen 85% is op deze selectie niet geldig.
- De TikTok-teller van 53 heet afrekenpagina, maar combineert gewone checkoutopeningen met directe kassalanders die pas na interactie meetellen. E-mail is focus op een veld, geen bevestiging dat een adres is ingevuld. De verhouding 53 naar 2 is geen zuivere checkoutbenchmark.

Bronnen: live `op=feedcheck`, `op=kassalek`, `op=koopcheck&px=1`, `api/gids?op=stand&dagen=28` en de bestaande overdracht. De oude verhoudingen vergelijken verschillende perioden, routes, meetdefinities en tests.

## Hersteld in deze wijziging

1. De teller `dkl` was zowel directe checkoutopening als lang vertrek. Nieuwe tellers: `dk0` voor directe opening en `dk9` voor lang vertrek. De oude gemengde teller blijft als zodanig herkenbaar; historische aantallen zijn niet gewist of opnieuw ingedeeld.
2. `op=kassalek&dagen=7` gaf voor orders nog de hele feed terug, terwijl de gedragsmeting wel op 7 dagen stond. Orders volgen nu dezelfde UTC-kalenderperiode op created_at. Buiten de periode, toekomstige/ontbrekende datums, gemarkeerde tests en dubbele orderregels worden apart verantwoord.
3. Het orderrapport groepeert per dag, netwerk en betaalmethode, vermeldt onbekende teststatus en legt uit dat aangemaakte orders geen bevestigde providerstarts zijn.
4. De betaalstatus wordt exact beoordeeld; `unpaid` telt niet meer door substringmatching als `paid`.
5. De regressietests draaien ook tijdens de bestaande rooktest. Er is geen extra Vercel-functie of cron toegevoegd.

## Nog nodig in de shop zelf

De gekoppelde hjdk-api-repository bevat de meting, de productbrug en de instructie voor de PHP-shop. De PHP-code van het Kadoly-betaalformulier en de providerafhandeling is hier niet beschikbaar. Er is geen betaalformulier aangepast en geen huidige bankstoring gereproduceerd.

De concrete implementatieopdracht staat bovenaan `lib/shopprompt.js` als **TAAK BETAALCONTROLE**:

- Stel in code vast op welk moment de order en de providerbetaling worden aangemaakt.
- Koppel order/poging aan de providerstatus en tijden; houd checkoutopening, betaalbutton, providercreatie en betaald apart.
- Reproduceer in TikTok/in-app en Safari validatie, overdracht naar bank/app, terugkeer en fout/annulering.
- Behoud mandje en velden bij fouten; herproberen en herhaalde webhooks geven geen dubbele order of omzet.
- Verifieer betaald aan de providerkant, niet op basis van een klik of return-URL.
- Gebruik eerst provider-testmodus. Een echte bankbevestiging en eventuele proefaankoop doet Henkjan.

Een servercontrole met een iPhone/Safari-header kreeg product en checkout met HTTP 200 en Nederlandse tekst. Dat is geen uitgevoerde mobiele browser- of betaaltest. De browsercontrole liep vast; verborgen tekst in HTML is niet als zichtbaar defect aangemerkt.

## Validatie

Zes regressietests: aparte landing/vertrektellers in beide routes; 7 versus 28 dagen; UTC-daggrens; test/dubbel/ongeldige datum; exacte betaalstatus; lege/onbereikbare feed. Syntaxcontrole van gewijzigde JavaScript-bestanden. De actuele feed gaf met de nieuwe rapportfunctie 2 orders voor 7 dagen en 27 voor 28 dagen, met 25 oudere regels buiten het weekvenster.

Live controle na uitrol: `/api/shop?op=kassalek&dagen=7` en `/api/shop?op=kassa&vorm=tekst`. Geen testbetaling, nieuwe conversie of omzet geboekt voor deze verificatie.
