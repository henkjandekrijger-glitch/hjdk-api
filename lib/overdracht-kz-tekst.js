// Vaste werkinstructie keuzehulpen. ELKE chat die iets verandert aan keuzehulp.best, whichtobuy.best, kaufberater.best,
// de bouwrondes of de ZICHT-lus werkt in dezelfde commit dit bestand bij (vooral het LOGBOEK, nieuwste boven).
// Live te lezen, samen met de actuele cijfers: https://hjdk-api-henq.vercel.app/api/kz?op=overdracht
// Gebruik geen backticks in deze tekst.
export const TEKST = String.raw`
## Wie, wat, waarom

- Eigenaar: Henkjan de Krijger (AdsFair B.V.). Doel: omzet uit keuzehulpsites via affiliate, groei uit Google/Bing en uit vermeldingen in AI-assistenten (ChatGPT, Perplexity, Copilot, Gemini, Claude). Betaald verkeer naar keuzehulp.best staat sinds 8 okt 2026 uit.
- keuzehulp.best (NL, bol.com-partner, Site-ID 1547300), whichtobuy.best (VS, Amazon), kaufberater.best (DE, Amazon).
- Werkwijze Henkjan: gewoon Nederlands, geen jargon; minder praten, meer doen; "bouw" = zelf bouwen en uitrollen; alles draait in de cloud (Vercel), nooit op zijn laptop; links naar live pagina's in plaats van screenshots; browsertabs die je opent sluit je zelf; wat we publiceren mag er niet uitzien als AI-content (risico op een Google-straf); sleutels staan als gedeelde team-variabelen in Vercel en worden nooit getoond of ontsleuteld; campagnewerk altijd via de skill campagnes-henkjan; SEO/AI-werk via de skill zicht-seo-llm.

## Code en uitrollen

- Repo: henkjandekrijger-glitch/hjdk-api, branch main. Vercel-project hjdk-api (prj_xAWlThjvk5VfU9AMN8GGI8LrdOSF, team team_9EYxyAU5QDExrrrOSKamefJT). Push naar main = uitrol in ongeveer 90 seconden. Altijd eerst git pull --rebase.
- Commits eindigen met: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
- Lezen vanuit een cloudsessie: curl naar deze domeinen wordt door de proxy geblokkeerd; gebruik de Vercel-tool web_fetch_vercel_url op https://hjdk-api-henq.vercel.app/... Dat domein toont keuzehulp.best (de paden /keuzehulp/<slug> en /api/...).
- Controleren na uitrol: node --check op elk gewijzigd bestand vóór de push, daarna de live pagina ophalen.

## Belangrijke bestanden

- api/kz.js: de site keuzehulp.best (pagina's, sitemap, llms.txt, llms-full.txt, advies per route, situatietabel, deals, push).
- api/kzmaak.js: de bouwmotor voor nieuwe keuzehulpen (signalen, plan, schrijven met Claude via de AI Gateway, bol-toets, verversen). STARTLIJST bovenin = onderwerpen die vast gemaakt moeten worden (velden slug, term, cat, waarom, optioneel vanaf).
- lib/rekenhulp.js: rekenhulpen voor maatvragen (fietsmaat, kinderfietsmaat, helmmaat) met tabellen en product per maat.
- api/wtb.js, api/wtbmaak.js, lib/wtb.js: whichtobuy.best en kaufberater.best (Amazon) en hun bouwmotor.
- lib/zicht.js, api/zicht.js, data/zicht-priors.json: de ZICHT-leerlus voor vindbaarheid en AI-vermeldingen (lessen met score, metingen, proeven, gatscan).
- api/gsc.js, lib/gsc.js: Google Search Console (dagronde, titels en FAQ bijschaven, indexcheck per pagina).
- lib/bol.js: bol Marketing Catalog API (searchCached). Bol-overdracht: /api/bol/overdracht
- lib/demandradar.js: vraagdata van demandradar (kiest mee welke onderwerpen gemaakt worden).

## Keuzehulpen maken

- Automatisch: cron /api/kzmaak/dag elke 10 minuten van 03:00 tot 23:59 UTC, tot het dagdoel (KZ_PER_DAG, standaard 12) is gehaald. Plan komt uit signalen (Google-autocomplete, Search Console, demandradar, seizoen, weer, nieuws, wat bij bol al verkoopt). Elke keuzehulp moet de bol-toets halen (genoeg passende producten per antwoordroute), anders valt hij af.
- Extra ronde (openbaar, max 60 per dag, één tegelijk): /api/kzmaak?op=extra (optioneel &thema=kerst&n=25).
- Een specifiek onderwerp laten maken zonder token: voeg het toe aan STARTLIJST in api/kzmaak.js en push; de volgende dagronde neemt het mee. Met token (HJDK_TOKEN, gedeelde variabele): /api/kzmaak?op=nu&onderwerp=<slug>&token=...
- Stand: /api/kzmaak?op=kort (vandaag) en /api/kzmaak?op=status (alles, groot).
- Regels voor inhoud: één sterke pagina per echte vraag, geen varianten per getal of persoon die naar hetzelfde product leiden; gewone taal, concrete getallen, geen opvulzinnen; producten altijd uit bol met de prijs van vandaag.

## Vindbaarheid en AI (ZICHT)

- Draaiboek met lessen op score: /api/zicht?op=draaiboek&t=1 . Stand per site: /api/zicht?op=stand&site=kz (us, de). Uitleg: /api/zicht?op=overdracht
- Gatscan (welke vragen AI-assistenten slecht beantwoorden): /api/zicht?op=gapscan&naam=<naam>&v=vraag1|vraag2|... (max 40 vragen, zonder token 6 scans per dag).
- Proeven: elke wijziging die effect moet hebben wordt een proef met controlegroep; de lus beoordeelt na 14 tot 28 dagen en past de score van de les aan. Nieuwe proef zonder token: voeg hem toe aan START_PROEVEN in lib/zicht.js (wordt bij de volgende ronde één keer aangemaakt). Met token: POST /api/zicht op=proef.
- Dagelijkse controle: geplande taak "ZICHT dagcontrole SEO en AI" om 06:10 UTC bekijkt de stand, repareert, bouwt 1 tot 2 verbeteringen en meldt Henkjan wat er veranderde.
- Bing Webmaster Tools: alle drie de sites geverifieerd (BingSiteAuth.xml in de repo-root) met sitemap, sinds 16 okt 2026. Google Search Console: de service-account heeft toegang tot alle drie.

## Bevindingen die richting geven (17 okt 2026)

- AI-gat: bij "beste X onder EUR Y" leunt Perplexity op één dunne bron en zegt "controleer de actuele prijs"; bij situatievragen noemt het geen prijs. Daarom staat op elke keuzehulp een tabel "Welke X past bij jouw situatie?" met per antwoord een product en de bol-prijs van vandaag, zonder klikken leesbaar en ook in llms-full.txt. Maatvragen beantwoordt AI zelf goed; daar zit voor AI geen gat.
- SEO-gat: maat- en rekenvragen. Wij staan op positie 4,6 tot 6,6 voor kinderfietsmaat; de top bij "welke maat fiets", "framemaat berekenen", "maat fietshelm" is zwak. Gebouwd: /fietsmaat (nieuw), rekenhulp op /kinderfiets-maat-bepalen, /kinderfiets, /fietshelm-kind, /fietshelm-volwassenen. Volgende kandidaten als dit werkt: grootte apparaat bij huishouden (airfryer liters, wasmachine kg, vaatwasser couverts), vermogen per ruimte (kachel, luchtontvochtiger, thuisbatterij).
- whichtobuy.best en kaufberater.best: Google kent de meeste pagina's nog niet (17 okt: US 6 van 91, waarvan 75 'onbekend bij Google'; DE 1 van 68, 67 onbekend). Googlebot las DE 2 en US 12 keer in 7 dagen, keuzehulp.best 92 keer. Het probleem is ontdekken, niet kwaliteit: daarom sinds 17 okt een voettekstlink tussen de drie sites. Eerst vindbaarheid, dan pas meer pagina's.
- AI-crawlers lezen in golven: GPTBot las keuzehulp.best rond 10 okt 123 keer en daarna 7 dagen niet (teller 124 naar 2 op 17 okt). Geen storing; oordeel AI-crawlers over langere tijd, niet per dag.
- Database (Redis) liep 16 okt vol; bouwrondes vielen tot 15:20 UTC stil. Sindsdien bouwen tot 23:59 UTC en een vangnet voor de ZICHT-ronde. Bij OOM-fouten: kijk /api/mm/geheugen en ruim de grootste sleutelgroep op of zet een vervaltijd.

## Open punten

- Proeven fietsmaat-rekenhulp (28 dagen) en situatietabel (21 dagen) lopen sinds 17 okt; uitslag rond 7 tot 14 november.
- Bezoekersteller: de site telt bezoekers met Google als herkomst terwijl Search Console 0 kliks toont; nog uitzoeken wat echt zoekverkeer is.
- Google Ads-zoekvolumes (/api/gads) wachten op de developer token van Henkjan.

## Logboek (nieuwste boven, één regel per wijziging: datum, wat, waarom, link)

- 2026-10-17: US-vraaggestuurde keuzehulpen live: https://whichtobuy.best/glass-air-fryer en bestaande https://whichtobuy.best/best-space-heaters-for-small-rooms-and-apartments vernieuwd, geen tweede kachel-URL. DataForSEO/Amazon-signalen waren de aanleiding; geen zoekvolumes als kwaliteitsbewijs op de site. lib/us-demand-guides.js bevat redactionele catalogus en beslisregels, lib/us-demand-view.js renderers. Drie vragen geven een concrete productsoort/modelfamilie met reden, compromis en controlepunten, plus directe Amazon.com-zoeklink met bestaande WTB_TAG_US (live gecontroleerd bl-t15-20). Geen ongeverifieerde prijzen, voorraad of testclaims. Kachel: stroomkostenrekener met eigen tarief, CPSC-bronnen en fout all-night advies hersteld (uitschakelen voor slapen). Glas: compact FN101 versus groter AS101, dual zone en budget-basket; fabrikantbronnen, bundels en beperkingen. Catalogus deelt homepage, sitemap en llms. Gedeelde WTB-renderer lost handmatige catalogusitems nu ook via advice-API op; antwoorden via ?answers=0-1-2 deelbaar/herstelbaar, aria-pressed, netwerkfoutmelding en bescherming tegen verouderde responses. Start/advies/deel/winkelklik volgen bestaande dagtellers; geen campagnewijziging. Controles: syntaxis en test/us-demand-guides.test.mjs (54 combinaties, rekenen, SSR, API, tag). Amazon-login niet nodig voor bestaande tag; live productkaarten vereisen een werkende Creators API-koppeling.

- 2026-10-17: eigen directe Pinterest-planner gebouwd: /api/pin-connect, lib/pinterest-direct.js en lib/pinterest-plan.js. Hergebruikt officiële OAuth/API v5 en bestaande drie concepten per gids. NL/US/DE, standaard 1 (max 3) per land per Curaçao-dag, varianten na minstens 7/21 dagen, permanente pin-id/deduplicatie, atomair werkerslot en onzekere publicaties vastgehouden zonder automatische herhaling. Bestaande /api/pinterest/post-cron vereist nu CRON_SECRET of HJDK_TOKEN; na configuratie neemt eigen planner over en blijft oude wachtrij intact maar wordt niet verwerkt. OAuth-state eenmalig, API-timeouts, geheimen server-side. Planner blijft uit tot eigen app gekoppeld en Standard-toegang bevestigd; Metricool-OAuth is niet overdraagbaar. Bij Trial zijn pins alleen voor de maker zichtbaar. Authenticated pinanalytics beschikbaar, website-UTM's behouden. Nog geen pins via deze koppeling gepubliceerd; eigen Pinterest-app moet worden geregistreerd/goedgekeurd. Metricool is inmiddels gekoppeld aan yoors_official maar wordt hiervoor niet verder gebruikt; Instagram/X-accountaanmaak nog onvoltooid. Tests voor planning, limieten, auth en onzekere POSTs. Handleiding docs/pinterest-direct.md.

- 2026-10-17: drie afzonderlijke Pinterest-concepten per levende keuzehulp NL/US/DE klaargezet via https://keuzehulp.best/api/distributie (keuzevraag, situatie, kopen), met eigen 1000x1500-beelden, titel, beschrijving, lokaal bord en UTM-link. Alle huidige en volgende levende gidsen worden uit de catalogus meegenomen; geen prijzen of voorraadclaims op de beelden. api/distributie.js en lib/social-keuzehulpen.js bieden overzicht, manifest en officiële CSV per maximaal 200 rijen. Concepten zijn niet gepubliceerd of ingepland: de bestaande Pinterest-API meldt geen app-configuratie en niet verbonden; eventuele RSS-publicatie is onbekend. CSV met lege datum publiceert bij import direct. Drie concepten op dag 0/7/21 is onze startproef, geen officieel optimum; Pinterest adviseert inhoud boven vaste aantallen en geen duplicaten. Kanaalplan in docs/distributie-keuzehulpen.md (Pinterest, Instagram, X en overige kanalen), tests in test/social-keuzehulpen.test.mjs. Metricool als optionele publicatie-/meetkoppeling voorgesteld, nog niet verbonden.
- 2026-10-17: koopblokken gebruiken natuurlijke vraagzinnen per taal (Waar kun je dit kopen? / Where can I buy this? / Wo kann ich das kaufen?), zodat technische productzoektermen niet als kop worden herhaald.
- 2026-10-17: koop-, prijs- en voorraadvragen toegevoegd aan alle gedeelde gidsrenderers: api/kz.js, api/wtb.js, api/keuze-tools.js, lib/thema-tools.js en de fietsmaatrekenhulp. Nieuw lib/koopblok.js toont per bestaande keuzehulp een zichtbaar koopblok met lokale winkelopties, bekende bronprijzen en echte broncontroletijd; voorraad blijft expliciet onbevestigd. Antwoordwissels verversen het koopblok mee, bestaande affiliate-tags en klikmetingen behouden. Prijzen zonder bronmoment of ouder dan 24 uur worden niet als actueel getoond. Domeinnaamhulpen krijgen registratie-/verlengkostenadvies zonder winkelvoorraad te veinzen. Geen duplicaatpagina per frase: meerdere formuleringen worden op dezelfde passende gids beantwoord. Blokweergaven en kliks via dagtellers koop-nl/us/de-YYYYMMDD-view/click (UTC). Syntaxis en test/koopblok.test.mjs gecontroleerd. De eerder gebouwde voorpagina staat apart in concept-PR #1 en wordt met deze gidswijziging niet uitgerold.
- 2026-10-17 (dagcontrole): voettekst op keuzehulp.best, whichtobuy.best en kaufberater.best linkt naar de twee zustersites, zodat Google de US- en DE-pagina's via de vaak gelezen NL-site ontdekt; proeven zusterlinks-us-1017 en zusterlinks-de-1017 (index, 21 dagen), les zusterlinks-ontdekking. Testvragen voor AI-meting slaan nu pagina's als /about en /privacy over (DE vroeg Perplexity 'welche about soll ich kaufen').
- 2026-10-17: uitgebreide açaí-keuzehulpen https://kaufberater.best/acai-bowl-zubereiten (prioriteit op Duitse homepage; bestaande WTB_TAG_DE / bl-de10-21) en https://keuzehulp.best/acai-bowl-maken, met productsoorten, portiekosten, apparaatgeschiktheid, primaire bronnen en wederkerige inhoudelijke links. Verwarmen met mobiele split-airco: https://keuzehulp.best/verwarmen-met-mobiele-airco en https://kaufberater.best/heizen-mit-mobiler-split-klimaanlage. Gewone PortaSplit nominaal 3,5 kW, SCOP 4,0; Cool kan niet verwarmen. Geen ongeverifieerde trendcijfers of gezondheidsclaims gepubliceerd. Vier vaste gidsen met antwoordblokken, vergelijkingen, FAQ, Article/Breadcrumb/FAQ-schema en wederkerige hreflang; catalogus, sitemaps en llms blijven dezelfde bron gebruiken.
- 2026-10-17: dagelijks rapport https://keuzehulp.best/vindbaarheid, native Vercel-cron /api/vindbaarheid?op=dag om 11:15 UTC (07:15 Curaçao). Definitieve GSC-dag per site/pagina met aparte pagina-totalen en max. acht gedeelde zoekvragen, dagelijkse bronweergaven per hulp, zes begrensde neutrale Perplexity Sonar-API-proeven. Exacte bronmetadata, tekstlinks en domeinvermeldingen apart; geen claim dat API-proeven consumenteninterfaces volledig meten. Archief 35 dagen gecomprimeerd, brontellingen 45 dagen, ratehashes 120 seconden, geen meetcookies of opgeslagen ruwe IP's. De nieuwe bronmeting heeft geen terugwerkende geschiedenis. Bing-key nog niet ingevoerd volgens Henkjan: zet BING_WEBMASTER_KEY in hjdk-api (alleen Demand Radar is onvoldoende). Bing API ververst wekelijks; ontbrekend is onbekend, geen nulscore.
- 2026-10-17: domeinchecker hersteld: .nl/.de worden door Vercel Registrar niet ondersteund. Ze worden niet meer als bezet aangemerkt en gaan niet naar die provider; status onbekend met SIDN/DENIC-controlelink. Beschikbaarheid .com e.d. blijft via de provider lopen.

- 2026-10-16: laadpaalkeuzehulp NL met thuis/VvE/openbaar, aansluiting, laadwens en stroomkostenrekener: https://keuzehulp.best/laadpaal . Domeinnaamkeuzehulp met naamgenerator, transparante naamcheck en openbare Vercel-beschikbaarheidsopvraag: https://keuzehulp.best/domeinnaam-kiezen , https://whichtobuy.best/domain-name (US, Engels), https://kaufberater.best/domain-finden . api/keuze-tools.js en lib/keuze-*.js; vaste catalogusitems in lib/keuze-extra-content.js, zichtbaar in bestaande index, sitemaps en llms-bestanden; wederkerige hreflang. Geen domeinregistratie, geen onbevestigde prijzen of merkcontrole. Geaggregeerde formulier-, klik- en verdiepingsvragen tellen mee; kandidaatnamen worden niet in de eigen database opgeslagen. Live beschikbaarheid en prijzen blijven een momentopname. Geen bevestigde commerciële installatiepartner.

- 2026-10-17: overdracht keuzehulpen live gezet (deze pagina), met actuele cijfers bij elke opvraag.
- 2026-10-17: rekenhulpen fietsmaat, kinderfietsmaat en helmmaat; nieuwe pagina https://keuzehulp.best/fietsmaat ; proef fietsmaat-rekenhulp-1017.
- 2026-10-17: situatietabel met product en prijs van vandaag op alle keuzehulpen; proef situatietabel-1017.
- 2026-10-17: gatscan in ZICHT (/api/zicht?op=gapscan).
- 2026-10-16: bouwrondes kzmaak en wtbmaak tot 23:59 UTC (inhalen na storing); ZICHT meet echte bezoekers uit zoek en AI per site, AI-crawlers ook voor US/DE, indexcheck US/DE dagelijks, vangnetronde.
- 2026-10-16: Bing Webmaster Tools voor alle drie de sites, sitemaps ingediend.
`;


