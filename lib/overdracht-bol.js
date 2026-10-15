// Overdracht bol-API voor andere chats en collega's. Live: https://hjdk-api-henq.vercel.app/api/bol/overdracht
export const OVERDRACHT_BOL = `# Overdracht: bol.com-API (stand 15 okt 2026)

Alles rond bol loopt via het Vercel-project hjdk-api (team henq, repo henkjandekrijger-glitch/hjdk-api).
Adres: https://hjdk-api-henq.vercel.app (keuzehulp.best werkt ook). Andere projecten hoeven geen sleutels te hebben: roep deze adressen aan.

## Wat je kunt opvragen
- GET /api/bol/check
  Werken de sleutels? Toont nooit de waarden.
- GET /api/bol/search?q=airfryer&country=NL&size=24&sort=RELEVANCE
  Producten uit de bol-catalogus (NL of BE): ean, id, titel, url, beeld, prijs, van-prijs, rating. 20 minuten cache.
- GET /api/bol/pick?q=<paginatitel of zoekterm>&country=NL
  Eén passend product. 24 uur cache.
- GET /api/bol/report?from=JJJJ-MM-DD&to=JJJJ-MM-DD&what=orders&raw=1
  Bol Reporting API v2. Per order: datum en tijd, product, prijs, commissie, status, siteCode en subId.
  - what=promotion geeft kliks, orders en commissie per dag, per site, per subId-groep en per subId.
  - what=commission geeft de commissie.
- GET /api/bol/learn
  Cron, elke 6 uur. Koppelt orders aan kliks (via de klikcode aan het eind van de subId), meldt ze als conversie aan PropellerAds en telt opbrengst per pagina, zone en lay-out.

## Partnerlink maken
https://partner.bol.com/click/click?p=2&t=url&s=<SITE_ID>&f=TXL&subid=<subid>&url=<bol-url, ge-encodeerd>

Site-ID's:
- Yoors: 1229920
- Keuzehulp (keuzehulp.best): 1547300
- De brugpagina /b/<slug> (api/b.js): Site-ID uit variabele BOL_BRIDGE_SITE

SubId-afspraken: per project een eigen voorvoegsel, kort (liefst onder 50 tekens), alleen letters, cijfers, _ en -. Leg er zone en campagne in vast, zodat je in het rapport ziet waar orders vandaan komen.
- Brug: br_<slug>-Z<zone>-<variant>[-<klikcode>]
- t-pagina's: t_<pagina>-Z<zone>-<opbouw>

## Sleutels
De sleutels staan in Vercel, nooit in code of chat. Nooit ontsleutelen of tonen.
- BOL_CLIENT_ID en BOL_CLIENT_SECRET: Marketing Catalog API, voor zoeken en producten
- BOL_REPORT_CLIENT_ID en BOL_REPORT_CLIENT_SECRET: Reporting API, voor kliks, orders en commissie

Wil een ander project bol rechtstreeks aanspreken, dan moeten deze variabelen gedeelde team-variabelen zijn. Henkjan zet die. Anders: gebruik de adressen hierboven.

## Wat we geleerd hebben
- Orders komen soms weken na de klik binnen, via het bol-koekje.
  Voorbeeld: de kliks van 25 en 26 sep uit zone 11853619 (pagina afvalemmer) gaven orders op 11 en 14 okt, samen €19,75 commissie (iPad-bestelling).
  Kijk dus minstens 30 dagen terug voordat je een zone of pagina afschrijft.
- Een bol-cadeaubon levert 0% commissie op.
- Een doorstuurpagina zonder handeling van de bezoeker mag niet (bol-voorwaarden 3.12). Daarom is de variant 'direct' uit; er moet een echte klik op een bol-knop zitten.
- Laatste 30 dagen (15 sep tot 15 okt): 5.106 kliks, 17 orders, €46,61 commissie. Bijna alles via Yoors (1229920); keuzehulp.best 2 kliks.
- De beste pagina tot nu toe is afvalemmer-kiezen-voor-kleine-keuken: 5 orders op 1.705 kliks.

## Waar het in de code zit
- lib/bol.js: tokens, catalogus en zoeken met cache
- api/bol.js: de adressen hierboven
- api/b.js: de brugpagina /b/<slug>, met Thompson-sampling tussen lay-outs en de subId per zone
- api/kz.js: keuzehulp.best, met bol-knoppen op Site-ID 1547300
`;
