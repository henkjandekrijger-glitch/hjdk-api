# Werkafspraak voor elke chat in deze repo

## Altijd eerst (Henkjan, 17 okt 2026)

Lees aan het begin van elke chat de live handover. Die wordt bij elk bezoek opnieuw opgebouwd uit de live cijfers en bevat de stand, de open punten en het werklog van eerdere chats:

https://hjdk-api-henq.vercel.app/api/mm/handover (in een Claude-chat met de Vercel-tool web_fetch_vercel_url; `?vorm=json` voor JSON)

Werk hem bij aan het eind van elke chat en na elke grote stap:
- werklog: `/api/mm/handover?log=<wat je deed en wat er nog ligt>&wie=<chat>`
- open punten (vervangt de lijst): `/api/mm/handover?open=<JSON-lijst van teksten>`

Elke nieuwe deploy zet zelf een regel met de commit in het werklog.

## Per onderdeel

- Werk je aan de Yoors Shop-campagnes (api/shop.js, lib/shop*.js, Babita's pagina, de PropellerAds-lus voor SHOP-LUS)? Lees eerst `OVERDRACHT-YOORS-SHOP.md` en werk hem in dezelfde beurt bij: stand goedzetten en één regel in het logboek (nieuwste bovenaan). Live te lezen op https://hjdk-api-henq.vercel.app/api/shop/overdracht.
- Werk je aan Clickmind? De overdracht daarvan bouwt zichzelf op uit `lib/overdracht.js` (https://hjdk-api-henq.vercel.app/api/mm/overdracht); zet nieuwe vaste kennis daar.
- Werk je aan de Amazon-blanket, Mondiad of CTR-tests? Vaste kennis in `lib/handover.js` en in de skill campagnes-henkjan.

## Altijd

- Altijd eerst `git pull --rebase`, daarna pushen naar main (Vercel rolt uit). Commit met expliciete bestandsnamen (nooit `git add -A`). Sleutels nooit in code, pagina's of URL's.
- Harde grenzen (campagnes niet stoppen, bod, budget of planning niet wijzigen zonder Henkjans woord; hoogstens $10 per dag per campagne; geen conversie-postback naar PropellerAds voor de Amazon-blanket) staan in de handover en in de skill.
