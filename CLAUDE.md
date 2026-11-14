# Werkafspraak voor elke chat in deze repo

## Altijd eerst (Henkjan, 17 okt 2026)

Lees aan het begin van elke chat de live handover. Die wordt bij elk bezoek opnieuw opgebouwd uit de live cijfers en bevat de stand, de open punten en het werklog van eerdere chats:

https://hjdk-api-henq.vercel.app/api/mm/handover (in een Claude-chat met de Vercel-tool web_fetch_vercel_url; `?vorm=json` voor JSON)

Werk hem bij aan het eind van elke chat en na elke grote stap:
- werklog: `/api/mm/handover?log=<wat je deed en wat er nog ligt>&wie=<chat>`
- open punten (vervangt de lijst): `/api/mm/handover?open=<JSON-lijst van teksten>`

Elke nieuwe deploy zet zelf een regel met de commit in het werklog.

De overdracht is de complete werking en stand (Henkjan 19 okt: "Zorg dat op vercel een handover doc staat met complete status en dat dat handover doc altijd wordt bijgewerkt bestaat uit complete werking en status"):
- Werking van het geheel staat in `lib/werking.js`. Verander je hoe iets werkt (regels, rondes, crons, ingrepen, projecten), werk dan in dezelfde commit `lib/werking.js` bij en zet `WERKING_DATUM` op vandaag.
- Projecten met een eigen repo sturen elke 15 minuten hun stand en werking (POST /api/mm/handoverzet, gedeelde team-sleutel). MyLevel doet dat vanuit api/cron/lek.js met docs/werking.md. Een nieuw project hoort dat ook te doen.
- Budget, slots en tempowacht komen live uit propellerads-mcp (/api/wachtlog?stand=1, header x-shop-sleutel).
- De overdracht waarschuwt zelf als een projectstand ouder is dan 1 uur of als de regels van een project nieuwer zijn dan zijn werking.

## Per onderdeel

- Werk je aan de Yoors Shop-campagnes (api/shop.js, lib/shop*.js, Babita's pagina, de PropellerAds-lus voor SHOP-LUS)? Lees eerst `OVERDRACHT-YOORS-SHOP.md` en werk hem in dezelfde beurt bij: stand goedzetten en één regel in het logboek (nieuwste bovenaan). Live te lezen op https://hjdk-api-henq.vercel.app/api/shop/overdracht.
- Werk je aan keuzehulpen (keuzehulp.best, whichtobuy.best, kaufberater.best), vindbaarheid in Google/Bing of vermeldingen in AI-assistenten? Volg de skill in `.claude/skills/zicht-seo-llm/SKILL.md` (ook live: https://hjdk-api-henq.vercel.app/api/zicht?op=skill) en lees eerst de levende overdracht https://hjdk-api-henq.vercel.app/api/kz?op=overdracht. Werk in dezelfde commit het logboek in `lib/overdracht-kz-tekst.js` bij. Wijzig je de werkwijze, pas dan de skill in de repo aan: die is de bron, niet een Claude-account.
- Werk je aan Clickmind? De overdracht daarvan bouwt zichzelf op uit `lib/overdracht.js` (https://hjdk-api-henq.vercel.app/api/mm/overdracht); zet nieuwe vaste kennis daar.
- Werk je aan de Amazon-blanket, Mondiad of CTR-tests? Vaste kennis in `lib/handover.js` en in de skill campagnes-henkjan.

## curacao.day bedrijfspagina's: strak en lerend (Henkjan, 14 nov 2026)

"Deze paginas moeten echt veel veel strakker ... doe ook echt UX asessment ... en neem dan mee in dagelijkse update vd bedrijven" en "Maak de pagina helemaal lerend op interactiviteit ."

- Code: `lib/cur.js` renderGidsBedrijf, `lib/curux.js` (opmaak, proef in de pagina, tikken per blok), `lib/curbedrijf.js`. Henkjan 14 nov: "Veel te druk moet veel cleaner . Chat moet zelfde zijn als heel curacaoday maar dan volledig zijn ingericht op bedrijven met de voorbeelden ." Henkjan 14 nov: "Dit moet echt via onze chat : Tijden, telefoon en adres als losse regels, met als laatste regel 'Been there? ★★★★★'. en dan intelligente eenvoudige vragen ." Volgorde: naam, open nu en score, knoppen (bellen, route, WhatsApp), dan de chat van de site (zelfde blok als op heel curacao.day, ingevuld door todayin bzz `/api/cw?w=chatjs` uit `data-ond`, `data-ondk`, `data-kop`, `data-ph`, `data-ctx`, `data-rv`, `data-vb` op `[data-cw-ama]`) met als regels tijden, telefoon, adres, website (tik = antwoord in de chat met de knop erbij), 'Been there? ★★★★★' (tik = sterren in de chat, opgeslagen als review van de zaak) en hoogstens twee slimme vragen met antwoord uit de gegevens; wat iemand typt gaat met de feiten als context naar de chat. Zonder JavaScript staat het feitenblok in de plaats van de chat. Daarna zaken dichtbij met afstand (4), reviews van lezers als die er zijn, ochtendmail klein, gevonden, eigenaar in één regel. Niets erbij zonder dat er iets anders af gaat.
- Keuzehulpen op curacao.day (Henkjan 14 nov: "Ja voer door over keuzehulpen ."): dezelfde chat (`UX.chatBlok` in `lib/curux.js`) staat ook op de keuzehulp-bedrijfspagina's (`renderBedrijf`: zelfde opzet als hierboven, met plus- en minpunten en de plek in de vergelijking als slimme vragen, sterren als review onder `<onderwerp>/<id>`), op elke keuzehulp (`renderOnderwerp`, direct na het korte antwoord: best beoordeeld, goedkoopst en twee echte vragen uit de FAQ; tours houden hun eigen gidschat) en op elke soort in de bedrijvengids (`renderGidsCat`: best beoordeeld en open op zondag). Het aanmeldvak staat één keer, onder de chat. `metAanmeld` zet geen los vraagveld als de pagina de chat al ingericht heeft.
- Lerend: Clickmind-proef `curbedrijf` (`lib/proef.js`): elke bezoeker krijgt per onderdeel een versie, waarde = zijn sterkste tik (bellen 10, WhatsApp 10, route 8, website 5, vraag 4, sterren 3, ander bedrijf 2, iets aangetikt 1, claim 12). Stand: `https://keuzehulp.best/api/mm/proefstand?site=curbedrijf&vorm=tekst`. Tikken per blok per 100 bezoeken: `https://hjdk-api-henq.vercel.app/curacao-gids?op=uxstand`.
- Elke nachtronde van de gidsen en bedrijvengids doet ook de UX-ronde:
  1. Haal 3 bedrijfspagina's op met web_fetch_vercel_url (`https://hjdk-api-henq.vercel.app/curacao-gids?m=<taal>&s=businesses&b=<soort>&c=<zaak>`): één uit de categorieën van vannacht, één met veel reviews, één zonder tijden of telefoon; elke nacht een andere taal. Bewaar het veld "text" als .html en draai `node scripts/ux-bedrijf.mjs <bestanden>`. Repareer elke fout (hooguit 5 per nacht) en draai opnieuw tot hij slaagt.
  2. Lees de proefstand. Heeft een onderdeel "winnaar: x": maak die versie de standaard (versie a in de code), zet de verliezer uit (`uit: true`) en zet de bovenste uitdager van dat onderdeel uit `data/cur/ux-uitdagers.json` erbij als nieuwe versie; hoogstens één onderdeel per nacht. Zet de uitkomst onder `gedaan`.
  3. Lees uxstand: het blok met de minste tikken per 100 bezoeken (vanaf 200 bezoeken) is het grootste lek. Bepaal of het motivatie, vermogen of prompt is (leerlus-skill, B = MAP) en zet een uitdager voor dat blok bovenaan de lijst.
  4. Eén regel in het logboek van `lib/overdracht-kz-tekst.js` en in het eindbericht: welke fouten gerepareerd, welke versie wint, wat erbij kwam. Geen nullen melden.
- Vaste regels (de controle bewaakt ze): geen Plus Code, telefoon leesbaar, geen "nog geen" of nullen, geen blok twee keer, de chat van de site en geen los vraagveld, knoppen in het eerste scherm van 360x640, contrast 4,5 in licht en donker, pagina korter dan 2.800 px, namen niet in HOOFDLETTERS, tijden op één regel.

## Altijd

- Altijd eerst `git pull --rebase`, daarna pushen naar main (Vercel rolt uit). Commit met expliciete bestandsnamen (nooit `git add -A`). Sleutels nooit in code, pagina's of URL's.
- Harde grenzen (campagnes niet stoppen, bod, budget of planning niet wijzigen zonder Henkjans woord; hoogstens $10 per dag per campagne; geen conversie-postback naar PropellerAds voor de Amazon-blanket) staan in de handover en in de skill.
