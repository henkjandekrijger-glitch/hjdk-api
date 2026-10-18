# Overdracht Yoors Shop-campagnes

Levend document voor collega's en voor elke chat die aan de Yoors Shop-campagnes werkt. Bovenaan de pagina staat een stand die bij elk bezoek live wordt opgebouwd. Wat hieronder staat, schrijven de chats zelf bij.

**Elke chat die hier kijkt en iets verandert, werkt dit bestand bij in dezelfde beurt:**
1. `git pull --rebase` in repo henkjandekrijger-glitch/hjdk-api.
2. Pas `OVERDRACHT-YOORS-SHOP.md` aan: zet de stand goed (geen geschiedenis stapelen) en voeg één regel toe onder "Logboek", nieuwste bovenaan, met datum, wat er veranderde en waarom.
3. Commit en push naar main. Vercel rolt binnen 2 minuten uit.

Lezen: https://hjdk-api-henq.vercel.app/api/shop/overdracht (met web_fetch_vercel_url). Als platte tekst voor een chat: `?vorm=tekst`. Gebruik bij het werk ook de skills campagnes-henkjan en clickmind.

## Doel (Henkjan)
- Direct op verkoop testen: elke advertentieklik gaat via Clickmind in één keer naar de productpagina op yoo.rs. Geen keuzehulpen meer.
- Eén product per campagne. Producten kiezen met Demand Radar (`https://demandradar-ivory.vercel.app/api/demand?view=products&cc=NL`) plus onze eigen tractie.
- Meer verkeer op producten die tractie tonen.
- De lus sluiten met marge: per product een maximum aan advertentiekosten, dat meebeweegt met de prijs.

## Hoe het nu loopt
- **Route.** Campagnelink `keuzehulp.best/shop?...&clickid=..&zoneid=..&p=<product-id>&arm=d` → `direct()` in `api/shop.js` → Clickmind `verwerkKlik` → 302 naar `yoo.rs/product/<id>?...&hj=<kenmerk>&mmc=<klik-id>&lang=nl`. Aandeel direct: 100% (Henkjan 14 okt).
- **Meting op yoo.rs.** cm.js van Clickmind staat sinds 16 okt op yoo.rs en meldt `echt` (aanraking of scroll en 3 seconden zichtbaar) en `actie` (eerste tik). De eerste tik is het hoofddoel voor het netwerk.
- **Shopmeldingen.** De shop meldt via `yoors-shop-conversies.php` aan `/api/shop/px`: winkelwagen, afrekenen, betaling gestart, mislukt en betaald (versie 2 van 17 okt, met betaalmethode). PropellerAds doel 2 = afrekenen, doel 3 = betaald. Een winkelwagen zonder eerdere tik meldt het hoofddoel als terugval.
- **Controle achteraf.** De lus haalt elk uur `yoo.rs/shop/api/lus-feed` op (header `X-Lus-Key` = Vercel-variabele `SHOP_FEED_KEY`). Daar staan inkoop per product en de bestellingen. Een betaalde bestelling met kenmerk telt ook als de directe melding niet afging, en gaat dan alsnog naar het netwerk.
- **Marge.** `lib/shopmarge.js`: marge = (prijs + verzending klant) / 1,21 − inkoop − onze verzending − betaalkosten (2,9% + €0,30). Hooguit de helft van de marge per verkoop aan advertenties. Testbudget per product = 2 × dat bedrag.
- **Per uur.** `lib/shopuur.js` telt elk uur elke stap (één Redis-hash per dag). De pagina per uur: `/api/shop/lekken?k=<Babita's link>`. Betaalde PropellerAds-kliks per uur komen via de PropellerAds-lus (`propellerads-mcp /api/statistiek`, `perUur`).
- **PropellerAds-lus.** Repo propellerads-mcp, `lib/shop.ts`, cron `3 5-21 * * *`. Beheert campagnes met SHOP-LUS in de naam. `vervangt=<id>` in de naam stopt de oude campagne zodra de nieuwe loopt. `thema=solo|skull|sint|advent` voegt geen extra advertenties toe.

## Openstaande lekken (stand 17 okt)
1. **Geen enkele betaling gemeld.** Tot 17 okt 10 winkelwagens en 0 betaald. De betaald-melding kwam alleen bij de test van 12 okt. Vermoeden: `betaald()` zit alleen in de PayPal-code, niet bij iDEAL. Ligt bij Babita (briefing bovenaan haar pagina, 6 stappen met live stand).
2. **Datapagina werkt (opgelost 17 okt).** `yoo.rs/shop/api/lus-feed` geeft 200 met de sleutel uit de shop (SHOP_FEED_KEY in Vercel gelijkgezet, vingerafdruk `ef89a7cd`, 32 tekens): 1.027 producten, 1.023 met inkoopprijs, 0 bestellingen in de periode. Controle: `https://hjdk-api-henq.vercel.app/api/shop/feedcheck`.
3. **Productpagina houdt bezoekers niet vast.** 4 tot 5% van de directe bezoekers is een echt mens, tegen 24% op onze eigen landingspagina. Doel 15%. Voorstel aan Babita: voor bezoekers met `hj` een lichte pagina zonder Yoors-menu.
4. **Database vol op 16 okt (06 tot 14 UTC).** Daardoor kwam 1 tot 3% van de betaalde kliks aan in de meting, en ging er geen signaal naar het netwerk. Opgelost (ruwe kliklog naar Vercel Blob). Controleren: `https://hjdk-api-henq.vercel.app/api/mm/geheugen`.
5. **CPA-doel $0,01.** Met ongeveer 1 conversie per dag leert PropellerAds niets en koopt het restverkeer (16 okt: 16 campagnes samen $3,20). Een hoger CPA-doel op de beste producten alleen op Henkjans woord.
6. **Saldo's.** Mondiad staat sinds 16 okt rond $0,40, dus alle Mondiad-campagnes staan stil (OFF_ACCOUNT_BUDGET). PropellerAds zit onder de grens van $150. Actuele saldo's staan in de live stand bovenaan. Opwaarderen doet Henkjan.

## Campagnes
- **PropellerAds** (In-Page, NL mobiel, CPA $0,01, $10 per dag): Skull 12011189, Tegeltje 12016745, Kaarsenset 12016748, en 13 losse productcampagnes van 16 okt (12016779-12016796) die de oude themacampagnes vervangen.
- **Mondiad:** Skull 150578. De drie oude keuzehulp-campagnes (149472-149474) staan nog; stoppen alleen op Henkjans woord.

## Waar de stand staat
- Babita's pagina met de briefing: `/api/shop/advies?k=<haar link>` (de link heeft Henkjan).
- Google Shopping en concurrentie: Demand Radar `https://demandradar-ivory.vercel.app/mine/mfiz7lshdw` (feed `https://demandradar-ivory.vercel.app/api/feed?shop=yoors&cc=NL`, Merchant Center Yoors 5875752564, dagelijks 00:00; code in repo demand_radar: lib/feed.js, lib/feedopt.js, lib/compete.js).
- Per uur: `/api/shop/lekken?k=<haar link>`.
- Trechter (openbaar, alleen totalen): `/api/shop/trechter`.
- Datapagina nu ophalen: `/api/shop/feedcheck`.
- Clickmind: `https://hjdk-api-henq.vercel.app/api/mm/overdracht?project=yoors` en `/api/mm/clickmind`.

## Vaste regels (Henkjan)
- Nooit campagnes stoppen of pauzeren, en nooit bod, budget of dagplanning wijzigen zonder Henkjans woord ("los op" of een letterlijke opdracht). Uitzondering: de shop-lussen binnen hun eigen regels, en `vervangt=`.
- Zones blokkeren mag altijd.
- Bieden op CPA, nooit op CPC. Gebruikersactiviteit LOW. Hoogstens $10 per dag per campagne.
- PropellerAds: hoogstens 40 nieuwe starts per dag (nieuwe dag om 05:00 UTC). Een gepauzeerde campagne komt terug als verse kopie.
- Sleutels staan als gedeelde Vercel-teamvariabelen. Nooit tonen, ontsleutelen of in een pagina of URL zetten.
- Babita's pagina's bevatten geen sleutels en geen persoonsgegevens.
- Kort, gewoon Nederlands, met cijfers. Links geven, geen screenshots.

## Waar de code staat
- `api/shop.js`: route `direct()`, landingspagina, `pxVerwerk`/`pixel`, `haalFeed`, ronde, trechter, lekken, feedcheck, advies, overdracht.
- `lib/shopdirect.js` (route en uitkomsten), `lib/shopuur.js` (per uur), `lib/shopmarge.js` (marge), `lib/shopadvies.js` (Babita's pagina), `lib/shopphp.js` (het PHP-bestand voor de shop).
- PropellerAds-lus: repo propellerads-mcp, `lib/shop.ts` en `app/api/statistiek/route.ts`.

## Logboek (nieuwste bovenaan, één regel per wijziging)
- 2026-10-18: Google Shopping-stand (producten in Merchant Center, titels met zoektermen, laatste verversing) staat nu op het shop-overzicht (`/api/shop/overzicht`) en in de live overdracht, live uit Demand Radar (`/api/feed?shop=yoors&cc=NL&status=1`). Van de klantpagina van de radar gehaald (Henkjan: niet voor radarklanten).
- 2026-10-17: Babita's briefing: korte "Nieuw · 17 oktober"-kader (Google Shopping, wat de shop kan doen) helemaal bovenaan, vóór het rode betaalblok; het volledige stuk stond op een telefoon pas ±3 schermen lager en Henkjan zag het niet.
- 2026-10-17: Datapagina werkt: SHOP_FEED_KEY in Vercel gelijk aan de sleutel in de shop (Henkjan), feedcheck 200 met 1.027 producten en 1.023 inkoopprijzen.
- 2026-10-17: Google Shopping live: 1.027 producten in Merchant Center (Yoors 5875752564) via de feed van Demand Radar, links met `?lang=nl`; titels met radar-zoektermen lopen. Concurrentiecheck (Dille & Kamille, HEMA, vtwonen, Leen Bakker, Xenos winnen; Yoors nergens in top 10 en 0 keer genoemd door AI) en 7 punten om te concurreren toegevoegd aan Babita's briefing.
- 2026-10-17: Overdracht levend gemaakt op `/api/shop/overdracht` (live stand plus dit bestand). Babita's briefing samengevoegd tot één blok met 6 stappen en live stand.
- 2026-10-17: Datapagina staat live bij de shop, maar weigert onze sleutel (403). `feedcheck` gebouwd om het direct te testen.
- 2026-10-17: Pagina per uur (`/api/shop/lekken`), PHP versie 2 (afrekenen, betaalStart, betaalMislukt, methode), controle achteraf op betaalde bestellingen uit de datapagina.
- 2026-10-16: Analyse geen verkopen: database vol 06 tot 14 UTC, 4% echt mens op yoo.rs, 10 winkelwagens en 0 betaald, Mondiad-saldo op.
- 2026-10-16: 13 themacampagnes vervangen door losse productcampagnes (`vervangt=`), plus Tegeltje en Kaarsenset uit Demand Radar.
- 2026-10-15: Marge per product (`lib/shopmarge.js`), Skull-campagne op PropellerAds en Mondiad.
- 2026-10-14: Directe route naar de productpagina met Clickmind ertussen, 100% direct.
