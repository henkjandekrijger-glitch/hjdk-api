# Clickmind-distributie voor Kadoly

Implementatie voor de bestaande `henkjandekrijger-glitch/hjdk-api` applicatie, met bestaande Redis en Clickmind-productmeting. Dit is geen afzonderlijk Vercel-project.

## Wat de dagelijkse ronde doet

- Om 06:10 Curaçao (10:10 UTC) leest `/api/cm-distributie?op=dag` de actuele Clickmind-catalogus (`hjdk:shop:cat`, maximaal 24 uur oud).
- Haalt Pinterest Trends via de officiële API op: Benelux, growing en seasonal. Brondatum komt uit de laatste wekelijkse waarneming, niet uit het moment van ophalen. API-toegang is niet hetzelfde als ingelogd zijn in Chrome.
- Leest openbare Flipboard-topicfeeds voor interieur, kerst, DIY en cadeaus. Recente redactionele aanwezigheid is een onderwerp-signaal; de code presenteert dit nooit als zoekvolume, percentage groei of bewezen bereik. Het internationale Flipboard-signaal is geen bewijs van Nederlandse vraag.
- Matcht producten met specifieke onderwerpen, voorraad, seizoen en bronactualiteit. Verlopen Halloween-pieken worden in november afgewezen. Een bloemschikworkshop wordt niet automatisch een advertentie voor een vaas. De regels zijn een eerste, beperkte relevantiefilter; Nederlandse productteksten worden niet aan US Pinterest-trends gekoppeld.
- Kiest maximaal drie items per kanaal per dag, maximaal twee per onderwerp. Pinterest krijgt een nieuwe 1000×1500-compositie met productfoto, eigen Kadoly-logo en trendkop. De oude catalogusimport wordt dus niet opnieuw als identieke productfoto verstuurd. Eén nieuwe trendcompositie per product in deze module, niet dagelijks opnieuw hetzelfde product.
- Publicatiecron: 06:35, 09:35, 12:35, 15:35 en 18:35 Curaçao; maximaal twee bevestigde plaatsingen per run, drie pogingen per kanaal per lokale dag. Deze startcadans is een eigen proefinstelling.
- Een gedeeld atomair Redis-slot voorkomt tegelijk plannen/publiceren. De publicatiegrens wordt vóór de schrijfactie permanent als `uncertain` vastgelegd. Onzekere plaatsingen worden nooit blind opnieuw geprobeerd. Een bevestigde plaatsing is nodig voor `published`.

## Clickmind en leren

Alle nieuwe productlinks gaan direct via `/api/shop/distuit?id=<vast publicatie-ID>` naar hetzelfde Kadoly-product, zonder tussenpagina. De bestemming komt uitsluitend uit een bewaard distributierecord. De bestaande Clickmind-route voegt `hj` en `mmc` toe en registreert de bron, publicatie en trend. Social previews en prefetch krijgen hetzelfde product zonder menselijke klik te registreren.

De dagelijkse ronde telt per trend bestaande Clickmind-records: aankomsten, `echt`-gebeurtenissen, winkelmand, afrekenen en bevestigde betaalde orders. Geen persoonsgegevens worden in het distributierapport opgenomen. Kleine steekproeven veranderen de selectie niet; bij minstens 20 aankomsten krijgt de waargenomen uitkomst een begrensd gewicht. Dit is een startregel, geen causaal bewijs van trendwerking. Platformimpressies en saves zijn hier nog niet automatisch gekoppeld. De oude losse 1.715 Pinterest-imports hebben deze nieuwe Clickmind-IDs niet en worden niet achteraf als gemeten conversies opgevoerd.

Flipboard-historie importeert 122 eerder gecontroleerde product-IDs om oude cataloguslinks over te slaan. De 1.715 Pinterest-import-IDs zijn als conservatieve historische inzendingen vastgelegd, niet als 1.715 bewezen live pins. De nu acht handmatig geplaatste onderzoeksgidsen staan los van de productplanner. Automatische nieuwe gidsredactie/publicatie is nog geen onderdeel van deze productronde.

## Activatie op Vercel

1. Doel: bestaand `hjdk-api` project, team `henq`. Controleer actuele productiecommit en preview voordat deze branch wordt opgenomen. Bestaande crons, routes en betaald-verkeerinstellingen blijven staan; de nieuwe route is organisch (`net=x`) en stuurt geen advertentienetwerk-postbacks.
2. Node.js 24.x. Bestaande productievariabelen `KV_REDIS_URL` of `REDIS_URL`, `CRON_SECRET` en `HJDK_TOKEN` worden hergebruikt. Geen nieuwe database nodig. De bestaande Pinterest OAuth-token blijft server-side.
3. Pinterest: dezelfde API-gebruiker moet exact `kadoly_shop` zijn. Trends API moet toegankelijk zijn en de app moet Standard-toegang hebben voor openbare pins. Zet uitsluitend na verificatie `CM_PINTEREST_STANDARD=1`. De module publiceert anders niets. Geen accounts verwisselen of API-goedkeuring veronderstellen op basis van de Metricool-koppeling.
4. Flipboard: een aparte, door de eigenaar aangemaakte serversessie is vereist in `FLIPBOARD_STORAGE_STATE_B64`. Zie `scripts/connect-cm-flipboard.mjs`. Cookies uit de bestaande Chrome-sessie worden niet uitgelezen. Alleen Flipboard-cookies/origins worden bewaard; nooit de inhoud in chat, Git of logs plaatsen. Verlopen sessie of CAPTCHA stopt de publicatieronde.
5. Preview kan wel health/beelden tonen maar publiceert nooit. Controleer op preview de modulehealth, authenticatie, bronophaal, productmatch, 1000×1500-beelden en 302-productroute. Productie: eerst één gecontroleerde plaatsing per kanaal en het opgeslagen record controleren, dan de normale crons laten uitvoeren.
6. Controleer `/api/cm-distributie?op=status` met Bearer-beheersleutel. Hier staan bronstatus, laatste scan, publicatieblokkades en gemeten uitkomsten. Een 200 op health bewijst geen actieve bronverbinding of publicatie.

## Huidige praktische grens

Vercel-teamtoegang gaf op 5 november 2026 nog 403. Productie-/previewdeployment, productie-OAuth, Standard-toegang, Trends API-rechten en Flipboard-serversessie zijn nog niet live geverifieerd. De browsercode en gekozen Chromium/Playwright-combinatie moeten op Vercel worden getest. Alleen lokale tests zijn geen bewijs dat het dagelijks live draait.

Bronnen: https://developer.pinterest.com/docs/analytics-and-reports/trends/ en https://help.pinterest.com/en/business/article/pinterest-trends . Flipboard-topicfeeds zijn openbare bronnen; deze implementatie gebruikt een apart ingelogde browser voor het bestaande magazine en claimt geen publisher/RSS-goedkeuring.
