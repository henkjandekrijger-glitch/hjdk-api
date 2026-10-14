# Overdracht Yoors Shop-campagnes (14 okt 2026)

Voor de sessie die verdergaat met de Yoors Shop. Gebruik ook de skills campagnes-henkjan en clickmind.

## Wat er sinds 14 okt draait
- **Directe route, 100% (Henkjan 14 okt: "ik wil dat alles direct gaat").** Alle betaalde klikken met klik-id op `keuzehulp.best/shop` (alle netwerken) gaan met een 302 in één keer naar `yoo.rs/product/<pid>?...&hj=<kenmerk>&mmc=<Clickmind-klik-id>&lang=nl`. Het product is dat van de advertentie (crmap).
  - De code kan nog splitsen (arm l = landingspagina, arm d = direct, per persoon vast op hash van IP plus user-agent), maar het aandeel staat op 100.
  - Iedereen krijgt dezelfde behandeling, ook bots (geen cloaking).
  - De cadeau-keuzehulpen (`/cadeau/...`) blijven een eigen pagina.
  - De campagnelinks zijn niet gewijzigd.
- **Clickmind onzichtbaar ertussen (arm d).** Elke klik gaat in het klikregister (`verwerkKlik`), met server-signalen, persoon en bewijs voor het terugbetalingsdossier. `mm:cid:<mmc>` krijgt het veld `shop` = het kenmerk.
- **Uitkomsten.** cm.js op yoo.rs meldt `echt` en `actie` via `/api/mm/uitkomst`. `lib/wissel.js uitkomst()` roept dan `shopUitkomst` aan (`lib/shopdirect.js`).
  - **Arm d:** de eerste `actie` (eerste tik op de productpagina) gaat als hoofddoel naar het netwerk. Voor PropellerAds is dat doel 1, voor Mondiad de conversie. Clickadu krijgt alleen de betaling.
  - **Arm l:** de doorklik op de landingspagina blijft doel 1. `/api/shop/uit` geeft nu ook `mmc` mee, zodat we het gedrag op de shop van beide routes vergelijken.
  - **Winkelwagen en betaling:** zoals altijd via de shop-pixel `/api/shop/px` (doel 2 en 3). Dat werkt voor beide routes, want `hj` gaat mee.
- **Tellers.**
  - Nieuw per net, zone (`z`), advertentie (`a`), campagne (`k`), product en dag:
    - `dv` = aangekomen via de directe route;
    - `dm` / `da` = echt / tik op de shop, arm d;
    - `lm` / `la` = hetzelfde voor arm l.
  - `view`, `mens`, `eng` en `klik` tellen alleen de landingspagina.
- **Lussen aangepast.**
  - **Zones:** het nep-oordeel per zone gebruikt aankomst = `view + dv`.
  - **Lekregel** (campagne stil bij geld zonder doorkliks):
    - Zolang cm.js op yoo.rs niet meet, telt alleen het deel van het geld dat bij de landingspagina hoort.
    - Daarna tellen `klik + da` als doorkliks.
  - Waar: in Mondiad (`api/shop.js ronde`) en in de PropellerAds-lus (repo propellerads-mcp, `lib/shop.ts`, commit 345d15b).

## Wat nog openstaat
1. **Babita zet één regel op alle shoppagina's van yoo.rs:** `<script src="https://whichtobuy.best/cm.js" data-site="yoors" async></script>`.
   - Zonder die regel krijgt PropellerAds geen doel 1 meer, alleen afrekenen en betalen. Ook de zone- en lekregels oordelen dan alleen op aankomst; mens en tik tellen pas mee zodra cm.js meet (`meet`).
   - Status staat op haar pagina (`/api/shop/advies?k=<haar link>`, sectie "Nieuw sinds 14 oktober"). Daar staat ook de PropellerAds-uitleg voor haar.
   - Testlink: `keuzehulp.best/shop?utm_source=propellerads&clickid=test-babita&zoneid=1&arm=d`. Testkliks tellen niet en melden niets.
2. **Volgen.** Lees `/api/shop/trechter`, onderdeel `perRoute`: aangekomen, echt en tik op de shop, afrekenen en betaald.
   - Vergelijk met de landingspagina tot 14 okt: 464 doorkliks, 3 winkelwagens, 0 bestellingen.
3. **Het aandeel direct aanpassen.** Alleen via de beschermde host: `https://hjdk-api-henq.vercel.app/api/shop/direct?pct=<0-100>` (met web_fetch_vercel_url). Lezen: `/api/shop/direct`.
   - Henkjan wil 100%. Alleen terug naar een split op zijn woord.
4. **Hoofddoel van doel 1 naar doel 2 (afrekenpagina).** Pas zodra er een paar afrekeningen per dag binnenkomen. Henkjan beslist.
5. **Eerlijk risico.** Tot 14 okt kwamen er 464 doorkliks, 3 winkelwagens en 0 bestellingen. Blijft het bij beide routes 0, dan ligt het aan aanbod, prijs, vertrouwen of levertijd, niet aan de route.
   - De afrekenpagina gaf op 14 okt één keer een 502. Daarna weer 200.
   - Controleren met `/api/shop?op=koopcheck&vers=1`.

## Vaste regels (Henkjan)
- Nooit campagnes stoppen of pauzeren, en nooit bod, budget of dagplanning wijzigen zonder Henkjan. Uitzondering: de shop-lussen doen dat zelf binnen hun regels.
- Zones blokkeren mag altijd.
- Hoogstens $10 per dag per campagne. CPA, gebruikersactiviteit LOW.
- Sleutels nooit tonen of ontsleutelen.
- Kort, gewoon Nederlands, met cijfers.

## Waar alles staat
- `api/shop.js`: landingspagina, `direct()`, `uitgang`, `pixel`, ronde, trechter, voorpa, advies.
- `lib/shopdirect.js`: verdeling, instelling, `shopUitkomst`, terugmeldlinks.
- `lib/shopadvies.js`: Babita's pagina.
- `lib/wissel.js` (`uitkomst`, `cidKoppel` met `shop`) en `lib/mensmeter.js` (klikregister).
- PropellerAds-lus: repo propellerads-mcp, `lib/shop.ts`.
