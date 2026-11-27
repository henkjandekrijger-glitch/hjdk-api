---
name: "campagnes-henkjan"
description: "Gebruik bij elk werk aan Henkjans advertentiecampagnes op elk netwerk en project, zoals PropellerAds, Mondiad, RichAds, MGID en de Amazon-blanket. Aanmaken, zones, bewaken, uurlijkse verspillingscheck, echte mensen herkennen, rapporten, leren en geen verspilling."
---

# Campagnes van Henkjan

Schrijf kort, in gewoon Nederlands, met ingevulde cijfers. Eerst doen, dan melden. Sluit elke browsertab die je opent. Henkjan wil niets verspillen.

## Altijd eerst

00. Schrijf je advertentietekst of kies je beeld (nieuwe campagne, kopie of nieuwe creatives): lees eerst de briefing van Clickmind, `https://hjdk-api-henq.vercel.app/api/mm/briefing?medium=<propeller|mondiad|gads|tiktok-ads|meta|richads|mgid>&project=<id>&doel=<koop|aanmelding|echt|actie|store>` (Henkjan 27 nov 2026: elke advertentie leert van alle vorige; ook bestaande research telt als voorsprong). Bouw voort op wat daar werkt, herhaal niet wat mis was en neem minstens één ding mee dat elders werkt en hier nog niet is geprobeerd. Zet na het aanmaken het doel van de campagne vast: `/api/mm?op=stuk&campagne=<netwerk>:<campagne-id>&doel=<doel>`. De creatives komen vanzelf in het geheugen (`/geheugen`). Kijk vóór een nieuwe campagne of kopie de landingspagina na op de uitkomstpoort: `/api/mm?op=stuk&poort=<landing-url>`. Staat daar `dicht: true`, dan kreeg die pagina 300 of meer betaalde kliks zonder één gemeten aanmelding of verkoop: eerst een aanmelding of gemeten verkoop op de pagina, nieuw verkeer alleen op Henkjans woord.
0. Lees de live handover: https://hjdk-api-henq.vercel.app/api/mm/handover (web_fetch_vercel_url). Die staat altijd bij: stand van nu (aankomst, geld per uniek mens, Yoors, todayin, Associates per tag, retargeting, CTR-tests, Mondiad-saldo), open punten en het werklog van eerdere chats. Schrijf na elke grote stap en aan het eind van de chat bij: ?log=<wat je deed en wat er nog ligt>&wie=<chat>. Open punten vervangen: ?open=<JSON-lijst van teksten>. Elke deploy van hjdk-api zet zelf een regel met de commit in het werklog (Henkjan 17 okt: "zet handover op Vercel zodat ik met iedere chat verder kan werken en zorg dat deze continu wordt bijgewerkt").
1. Kijk of alle wachten draaien: tool wacht_overzicht (PropellerAds, RichAds, Mondiad en MGID in één keer). Zie je die tool niet, gebruik dan ronde_modus met overzicht op 1. Voor MGID: wacht_nu met droog true. Mondiad: https://hjdk-api.vercel.app/api/md/wachtlog (of een deploy-URL van hjdk-api met /api/md/wacht?droog=1).
2. Lees de lessen van vandaag: haal https://moonlighter-henq.vercel.app/api/ti?lessen=1&t=1 op (met web_fetch_vercel_url). Pas ze toe voordat je iets aanmaakt of wijzigt.
3. Staat er een alarm, of is een ronde ouder dan 25 minuten: eerst dat oplossen, dan pas de rest. Een ALARM-regel in de Mondiad-wacht ("maar x% komt aan") is geen storing van de wacht maar een campagne waar het geld niet aankomt: meld die bovenaan aan Henkjan.
4. Een lus mag nooit stilvallen en nooit alles op orde melden terwijl hij niets doet.
5. Lees de stand van de zwarte lijst botzones: https://moonlighter-henq.vercel.app/api/cron/botzones. Staan er fouten in, dan eerst repareren.

## Clickmind in iedere campagne (Henkjan 15 okt)

- Vanaf 15 okt loopt elke nieuwe campagne en elke dagelijkse kopie via Clickmind. Dat geldt voor elk netwerk en elk project. Geen enkele link gaat nog rechtstreeks naar de bestemming.
  - Naar Amazon: via het klikregister /go, of via een wissel /w/<naam>. Zie Echte mensen herkennen.
  - Naar een eigen pagina: de pagina krijgt de Clickmind-meting (mensmeter, zone, campagne, echt-mens-melding), zoals de Yoors Shop-route (hjdk-api lib/shopdirect.js). Een andere mogelijkheid is een wissel /w met de pagina als arm.
  - Naar bol: altijd via een eigen pagina met een zichtbare bol-knop, zoals de brugpagina /b/<slug> of een keuzehulp. Nooit direct doorsturen (bol-voorwaarden 3.12). Zet de zone en de klikcode in de subid.
- Bestaande campagnes zonder Clickmind gaan over via de dagelijkse kopieën, want een lopende PropellerAds-campagne kan zijn link niet wijzigen. De oude campagne gaat uit volgens Dagelijkse kopieën.
- Bij elke uurlijkse check: tel de lopende campagnes zonder Clickmind-link per netwerk en meld het aantal.

## Oversight: dagelijkse zoekwoordencheck op Amazon Ads (Henkjan 26 nov 2026)

Elke dag kijkt KDP-ronde A (B als A het niet deed) alle lopende Amazon Ads-campagnes in alle markten na, zodat er nooit geld naar bleeders gaat. Bleeder: 10+ kliks of kosten van één royalty (standaard $5) zonder aankoop in 30 dagen; oude winnaars (2+ aankopen onder $9 per aankoop) pas bij 20 kliks. Actie: woord of target op pauze, zoekterm in AUTO of BROAD negatief exact. Nooit bod, budget of campagne. Regels, meldformaat en stand: https://hjdk-api-henq.vercel.app/oversight?vorm=tekst (code lib/oversight.js).

## Uurlijkse verspillingscheck (elk uur, in de cloud)

Naast de wachten van elke 10 minuten draait elk uur één check over alle netwerken en projecten. Doel: elke dollar die niet naar een echt mens gaat binnen het uur zien en stoppen. Zelf mag: zones en bronnen blokkeren. Pauzeren, bod, budget en targeting alleen op Henkjans woord ("los op", of een opdracht zoals "zet alles voor rereviews uit", die geldt dan voor precies die campagnes).

Elk uur, in deze volgorde:
1. Saldo's: PropellerAds get_balance (grens $150), Mondiad mondiad_get_current_account (grens $40), MGID account wallet.balance (grens EUR 40), RichAds balance (grens $30), Clickadu via de eigen koppeling (grens $20). Onder de grens: bovenaan melden welke winnaar stilvalt en wanneer.
2. Tempo: uitgave vandaag tot nu per campagne tegenover dagbudget en regel ($10 per dag, MGID EUR 20). Een campagne die zijn dag in minder dan een kwart van de dag opmaakt, of een zone die meer dan $0,30 per uur kost: oorzaak zoeken.
3. Geld zonder mens: per campagne en zone de uitgave van het laatste uur naast de eigen meting (echte mensen, acties). Zones die kosten en geen enkel echt mens leveren: blokkeren (drempels onder Zwarte lijst).
4. Afgerekend tegen aangekomen: kliks (of pops) van het netwerk tegen bezoeken op de eigen pagina, zelfde uren. Zone onder 30%: blokkeren. Campagne onder 10%: pagina kapot of alles nep, ALARM.
5. Landingspagina's: van elke lopende campagne de doel-URL ophalen (status 200, juiste pagina, meetscript aanwezig). Kapot of omgeleid: ALARM met het bedrag per uur dat erheen gaat.
6. Conversiesignaal: telt het netwerk 0 echt-mens-meldingen terwijl onze meting mensen ziet, dan is de postback of het conversiedoel kapot (zoals MGID zonder conversiestappen, het oude RichAds-veld). Melden en repareren.
7. Zombies: lopende campagnes van gestopte projecten of oude domeinen (rereview, Benchmarked, keuzehulp-betaald, Lasting Change-site) en tags die op twee campagnes of netwerken tegelijk staan. Melden met bedrag; stilzetten op Henkjans woord.
8. Bot-segmenten: desktop, oude browsers, datacenters, één zone met meer dan 60% van het geld. Melden als voorstel (targeting).
9. Stoppen dat niet lukt: campagnes die gestopt hadden moeten zijn maar nog lopen (Clickadu). Melden.
10. Amazon (blanket en boeken): geen eigen pagina; per uur alleen kosten per zone tegen de prijsregel. Het oordeel op mensen en kopers komt uit het hele-dagrapport van Associates: kliks die Amazon telt tegen netwerkkliks, en artikelen per tag. Loopt een campagne via het klikregister /go, kijk dan ook per uur naar /api/mm/proef (zie Echte mensen herkennen).
11. Clickmind: aantal lopende campagnes zonder Clickmind-link per netwerk (zie Clickmind in iedere campagne).
Henkjan krijgt alleen bericht bij meer dan $1 verspilling in het uur, bij een ALARM of bij een saldo onder de grens. Anders één logregel.

Waar de cijfers per uur vandaan komen:
- PropellerAds: api_get /adv/statistics met tz=%2B0000, day_from en day_to (JJJJ-MM-DD UU:MM:SS), group_by[]=campaign_id en group_by[]=zone_id (of hour, country_id, os_id, banner_id), order_by=spent, per_page 500. Binnen minuten vers. Uurlabels staan altijd in EST. Apparaat, browser en provider lopen een uur achter. payout, profit, roi en conversions3 zijn onbruikbaar. daily_report, zone_stats en segment_stats rekenen in EST-dagen (de dag begint om 05:00 UTC).
- Mondiad: mondiad_campaign_report voor vandaag (UTC) met breakdown ZONE_ID, CAMPAIGN, PLATFORM, DEVICE_TYPE, COUNTRY of SUB_ID; bij pop is clicks 0 en tellen impressions als pops. Geen uur- en geen ISP-uitsplitsing: per uur is het verschil met de stand van het vorige uur. carrierName, views, invalid en newSubscriptions zijn opvulling.
- RichAds: campaign_stats per campagne met groupBy hour, site-id, os, browser, device of isp. Alleen kliks en kosten zijn betrouwbaar; conversies staan in conversions; vertoningen per site kloppen niet. spend_guard pauzeert echt: nooit als test aanroepen.
- MGID: campaigns_stats today, source_stats per campagne, click_log (per klik tijd, IP, bron, widget en land; ongeveer 5 minuten vers). Dag in Amsterdamse tijd. Geen OS of apparaat. MGID wijst zelf ongeveer 19% van de kliks af (niet betaald).
- Clickadu: alleen via de eigen koppeling (statistiek per dag; per uur en per zone nog niet getest), 200 verzoeken per uur gedeeld.
- Eigen metingen: spel /api/zones, todayin /api/tree?diag=loop, rereview /api/b/zones, finds, Outnamed scan-stats, MYLEVEL pulse, het klikregister /api/mm/proef en /api/mm/zones op whichtobuy.best (adressen staan bij Zwarte lijst, bij Echte mensen herkennen en in de cloudtaken).
- bol: https://hjdk-api-henq.vercel.app/api/bol/report?from=&to=&what=orders&raw=1 (orders met subid, dus met zone). Alles over de bol-API: https://hjdk-api-henq.vercel.app/api/bol/overdracht.

## Echte mensen herkennen (de mensmeter)

Een klik is pas iets waard als er een echt mens achter zit. Alle landingspagina's gebruiken dezelfde meting, zodat zones en patronen over alle netwerken heen te vergelijken zijn.

Per klik vastleggen (met netwerk, zone, campagne en subid):
- Op de server, gratis, bij elke klik: IP en of dat een datacenter, proxy of VPN is (ASN-lijst); land, stad en tijdzone van Vercel tegenover de targeting; de TLS-vingerafdruk (JA4) tegenover de browser die de user-agent claimt; tijd tussen netwerkklik en aankomst; herhaalde IP's. Vercel geeft het netwerknummer mee in de kop x-vercel-ip-as-number en de TLS-vingerafdruk in x-vercel-ja4-digest.
- In de browser, met een klein script: BotD (open source, herkent headless browsers en automatisering); Vercel BotID Basic (gratis; Deep Analysis kost $1 per 1.000 checks, alleen bij twijfel of vóór een conversie); een gehashte vingerafdruk (canvas, WebGL-renderer, scherm, taal, tijdzone); tegenstrijdigheden (browsertijdzone tegenover het IP, "mobiel" zonder aanraakscherm, WebGL-renderer SwiftShader of llvmpipe = emulator); gedrag: 3 seconden zichtbaar, eerste aanraking of scroll, natuurlijke variatie in aanrakingen, bewegingssensor met ruis (echte telefoon).
- Score van 0 tot 100 per klik. Alleen bij een hoge score gaat de echt-mens-melding naar het netwerk, zodat het netwerk op echte mensen leert.

Patronen, elke dag:
- Dezelfde vingerafdruk via veel zones, netwerken of IP's is een botfarm: die zones overal op de zwarte lijst.
- Een zone met weinig verschillende vingerafdrukken op veel kliks is een emulatorfarm.
- Welke signalen voorspellen een latere actie (stem, aanmelding, koop)? Die wegen zwaarder in de score; de gewichten worden elke week opnieuw geleerd.
- Terugkomen binnen 24 uur per zone telt als extra mens-signaal.
- Alleen gehashte vingerafdrukken bewaren, 30 dagen, alleen voor fraudeherkenning.

Geld terughalen: het terugbetalingsdossier (hjdk-api lib/terug.js, elke nacht om 03:40 UTC voor gisteren) zet per netwerk de kliks via /go of /w met bewijs op een rij: klik-id van het netwerk, tijd in hun tijdzone, campagne, zone, netwerkdeel van het IP, ASN en reden.
- Eén klik = één klik-id. Komt een klik-id vaker binnen (de bezoeker plus een Google-server die de link ophaalt), dan telt hij alleen als elk verzoek verdacht is, en sterk alleen als elk verzoek sterk bewijs heeft. Zo claimen we nooit een echte klik.
- Sterk: datacenter, bot of headless, emulator, serieklik (zelfde persoon 3 of meer keer binnen 10 minuten). Een losse herhaalklik is zwak.
- Uitlezen: https://hjdk-api-henq.vercel.app/api/mm/terugbetaling?net=propeller&van=JJJJ-MM-DD&tot=JJJJ-MM-DD (met &formaat=csv voor een bestand).
- Termijnen: PropellerAds 3 kalenderdagen, onderbouwd rapport, hun statistiek is leidend (voorwaarden §4.2). RichAds 5 dagen, alleen abnormale kliks van hetzelfde IP op een plek (§3.10). MGID 30 dagen via de accountmanager, correctie bij meer dan 5% en minstens $5; MGID geeft ook per klik het IP (click_log). Mondiad onbekend: schriftelijk vragen.
- Indienen is een bericht namens Henkjan: alleen op zijn woord.
- Eerste dossier, PropellerAds 14 okt: 369 kliks via /go, 67 verdacht, 42 sterk, vooral series rond 01:00 EST in zones 10778063, 11702861, 10765442 en 11287454.

Amazon heeft geen eigen pagina, dus meten we in de link zelf: het klikregister /go op whichtobuy.best (sinds 14 okt, repo hjdk-api, api/mm.js en lib/mensmeter.js).
- Link: https://whichtobuy.best/go?n=propeller&c={campaignid}&z={zoneid}&s=${SUBID}&b={bannerid}&k=<zoekterm>&tag=<tag>&tag2=<tag voor de 302-variant>&p=<kort voorvoegsel>. Voor een ASIN a=<ASIN>, voor een andere markt m=de (of co.uk, ca). Mondiad: n=mondiad&c=[campaignid]&z=[zoneid]&s=[clickid]&b=[creativeid].
- Elke klik krijgt een klik-id en een persoons-id (eigen cookie mmp, 6 maanden); die blijven in ons eigen register. Zo zien we wie terugkomt en via welke zones en advertenties. Amazon krijgt alleen de tag en een ascsubtag per zone (voorvoegsel-zone), nooit per klik of persoon (Associates §2(b)). De meetpagina verbergt de herkomst niet (referrer origin), want verbergen telt als cloaking (§6(v)).
- Twee varianten, per persoon vast: js = een lege meetpagina die in ongeveer 150 ms browsersignalen meet (vingerafdruk, WebGL, scherm, batterij, netwerk, toestelmodel, headless en emulator) en dan doorstuurt; 302 = direct door. Elke variant een eigen tag, zodat Associates eerlijk vergelijkt.
- Server, bij elke klik gratis: netwerk (ASN), datacenter, TLS-vingerafdruk (JA4), land, stad, tijdzone, alle browserkoppen en hun volgorde, de app waarin geklikt werd. IP alleen gehasht plus het netwerkdeel.
- Uitlezen: /api/mm/proef?dagen=2 (per campagne, variant en tag), /api/mm/zones, /api/mm/patronen, /api/mm/stand. Ruwe regels per klik en per persoon alleen via https://hjdk-api-henq.vercel.app/api/mm/export?dag=JJJJ-MM-DD en /api/mm/persoon?pid= (achter Vercel-inlog, met web_fetch_vercel_url). hjdk-api.vercel.app stuurt door naar keuzehulp.best; gebruik daarom hjdk-api-henq.vercel.app.
- Eerste proef 14 tot 16 okt: 12006513 direct (bl-hw13-20, controle) tegen 12006514 via /go (bl-mh13-20 meetpagina, bl-ls13-20 direct door). Maatstaf: aankomst (Amazon-kliks gedeeld door wat we doorstuurden) en conversie per tag. Uitslag 17 okt: /go verliest geen kliks (87% aankomst tegen 82-90% direct), dus US gaat stap voor stap over (zie De Amazon-blanket).
- De wissel /w/<naam> (lib/wissel.js, sinds 14 okt): één link per campagne; de server kiest per persoon de bestemming (arm). Een arm is een Amazon-zoekterm met een eigen tag, of een eigen pagina (finds, todayin for-you) met {net} {zone} {camp} {sub} {cr} {cid} in de URL. Per persoon vast.
  - Modus vast (vaste verdeling) of leer (Thompson, elk uur bijgewerkt door de leerronde, met een minimum per arm).
  - Regels gaan voor: amazon24 (ging binnen 24 uur al naar Amazon), herhaal, terug, mens, abonnee of nieuw → een vaste arm.
  - Instellen en stand: /api/mm/wissel (achter Vercel-inlog; ?naam= voor stand en link, ?j= om op te slaan). Uitkomsten: /api/mm/uitkomst of het script /mmu.js op de eigen pagina. Associates per tag per dag: /api/mm/amazon.
  - Klaar maar uit (uit: true) tot Henkjan ze aanzet: us-amazon (cadeau bl-mh13-20, kerst bl-ls13-20), us-eigen (todayin for-you tegen finds, doel aanmelding) en us-zoekwoorden (leer, 5 zoektermen met tags bl-gh13-20, bl-af13-20, bl-fd13-20, bl-lm13-20, bl-sc13-20).
  - In us-amazon en us-zoekwoorden stuurt de regel amazon24 een herhaalklik naar finds (eigen publiek) in plaats van nog eens naar Amazon. Ongeveer 20% van de /go-kliks is een herhaalklik.
- De leerronde (lib/leer.js, elk uur op :12) maakt zoneprofielen, menszones, zones die lijken op winnaars, botfarms, dezelfde site via twee netwerken, gewichten voor leer-wissels en een blokvoorstel per netwerk (/api/mm/blok?net=).
  - Blokkeren staat aan sinds 14 okt (Henkjan, via /api/mm/instelling). Elke netwerkwacht (PropellerAds, Mondiad, RichAds, MGID; Clickadu niet) neemt het blokvoorstel over in campagnes waar de zone geld kostte. De grootste bron van een campagne en zones met uitkomsten nooit automatisch.
  - Overzicht in gewone taal voor Henkjan: https://hjdk-api-henq.vercel.app/api/mm/clickmind. Venster 0x0 per zone: /api/mm/venster?dag=. Een bezoek zonder echt venster (0x0) was op 15 okt in 1,2% van de gevallen een mens, tegen 13,6% zonder 0x0; sinds 15 okt is een zone met een meerderheid 0x0 en minder dan 5% mens zwart.
  - Alles op één pagina: https://hjdk-api-henq.vercel.app/api/mm/overzicht.
  - Aankomst per zone en per campagne (betaald tegen aangekomen) haalt Clickmind via de PropellerAds-lus (propellerads-mcp /api/statistiek); zie Clickmind-uurwacht.
- De lerende modal (lib/modal.js, sinds 14 okt): één script op een eigen pagina, <script src="https://whichtobuy.best/mmm.js" data-site="<site>" async></script>.
  - De server kiest per bezoeker: e-mail, een andere eigen site, of niets. Niets is de controlegroep: verplicht, minstens 10%.
  - Hoogstens 1 keer per 72 uur, niet vóór 8 seconden op de pagina, nooit aan bots. Moment: exit, tijd of scroll.
  - Meet bij iedereen ook de gewone klik naar buiten (Amazon), zodat zichtbaar is of de modal die klik kost.
  - Leert elk uur per segment (mobiel/desktop x nieuw/terug) op waarde per bezoeker.
  - Nooit Amazon in de modal.
  - E-mail gaat via de eigen aanmeldfunctie van de pagina (window.mmAanmelden), of wordt met de toestemmingstekst bewaard in mm:mail:<lijst>. E-mailarmen pas aanzetten als er verzending met bevestiging is.
  - Klaar en uit: whichtobuy en kaufberater (het script staat al op hun pagina's).
  - Testen: ?mmm=<arm-id> achter de pagina-URL. Beheer en stand: /api/mm/modalbeheer (achter Vercel-inlog) en het overzicht.
  - Op todayin, finds of spel alleen met Henkjans OK (andere projecten).

## Deze skill leert elke dag

- Elke dag na 06.00 uur UTC zet een cloudtaak op Vercel (lib/lessen.js in de repo henkjandekrijger-glitch/todayin) de eigen metingen om in feiten en lessen: per bron bezoeken, echte mensen, iets gedaan, aanmeldingen; per zone; echt-mens-meldingen naar de netwerken; vergelijking met een week eerder. Bewaard 60 dagen.
- Lezen: ?lessen=1 geeft JSON, ?lessen=1&t=1 gewone tekst. Nieuwste dag eerst, plus de 7 dagen ervoor.
- Leer je zelf iets nieuws tijdens het werk: leg het vast waar het automatisch terugkomt. Een drempel via regels_zet (met cijfers), een meetregel of les als codewijziging in de repo (map site/, Vercel deployt vanaf de repo, nooit met de CLI). Niet alleen in de chat.
- Amazon-opbrengst per klik leert apart, elke dag via regels_leer (zie Leren).

## Vaste lessen

- Op CPA koopt een netwerk alleen wat het kan meten. Telt alleen de aanmelding als conversie, dan ziet het netwerk bijna niets, leert niet en koopt restverkeer. Mondiad-lab 11 tot 13 okt: 95% van de kliks uit één zone (1458), 4% echte mensen, 0 aanmeldingen op 825 bezoeken.
- Geef het netwerk daarom altijd een vroege conversie "echt mens": de eerste bewuste stap op de pagina, eenmaal per klik, met een token dat de server bij het tonen van de pagina maakt. Meet de aanmeldingen apart. Zo doen /for-you (lib/mine.js) en de onderwerp- en plaatspagina's (lib/echtmens.js) het sinds 13 okt.
- /for-you met PropellerAds In-Page en echt-mens-conversie gaf op de eerste dag 3 aanmeldingen. Dat is nu de beste ingang.
- Oordeel op eigen metingen (3 seconden zichtbaar, een aanraking, een aanmelding), nooit op kliks van het netwerk.
- Vergelijk altijd wat het netwerk afrekent (kliks, of pops bij pop) met wat er echt op de pagina aankomt, over dezelfde dagen. Komt er van een zone minder dan 30% aan, dan is het nep. Komt er van een hele campagne bijna niets aan, dan is de pagina kapot of is alles nep: meld het, pauzeren beslist Henkjan. Rereview op Mondiad, 12 tot 14 okt: ongeveer 22.800 pops afgerekend tegen 12 bezoeken; op 14 okt zijn op Henkjans woord alle 17 rereview-campagnes gepauzeerd (ook 145454 met tag rereviews-20).
- Komt meer dan 60% van de echte mensen uit één zone, dan is de inkoop te smal. Groei via andere formaten of landen, niet via meer campagnes op dezelfde inkoop.
- Praisy op PropellerAds Telegram (13 okt): 88% van het geld en 5.639 kliks kwamen uit één zone (9326997). Op de Praisy-pagina was maar 6% een echt mens, op de spelpagina 31% zichtbaar bij dezelfde zone. Eerst de pagina en echte mensen omhoog, dan pas budget (Henkjan).
- Echt menselijk verkeer per netwerk (Clickmind en eigen metingen, 15 okt):
  - PropellerAds: 25% echt mens op eigen pagina's en de enige bron met aanmeldingen (for-you In-Page, zone 10567468: 40 aanmeldingen op een dag). 82 tot 90% komt aan bij Amazon. Maar Telegram-zone 9326997 (Praisy) is een botfarm: 4,7% mens, datacenter-IP's met Aziatische tijdzones, ongeveer $25 per dag. Blokkeren alleen op Henkjans woord, want het is de grootste bron van de campagne.
  - Mondiad: schoon maar weinig interactie, sterk op Amazon.
  - MGID: echte mensen, maar 10 tot 15 keer duurder per klik.
  - Clickadu: bots.
  - RichAds: bijna geen verkeer meer.
- Nooit een merk of nieuwsmedium als onderwerp of campagne, zodat het lijkt of de lijst van hen is. Bot-paden zoals /auth, /search en /pricing worden nooit een onderwerp (lib/topicguard.js).
- Bol-orders komen tot weken na de klik binnen, via het bol-koekje. Voorbeeld: zone 11853619 klikte op 25 en 26 sep door via de brugpagina (afvalemmer). De orders kwamen op 11 en 14 okt, samen €19,75 commissie. Oordeel over een bol-zone of bol-pagina dus pas na 30 dagen. Een bol-cadeaubon levert 0% commissie op.

## Yoors Shop: lekken in de trechter (16 okt)

- Lees de trechter altijd van achter naar voren: betaald, winkelwagen, echt mens op yoo.rs, aangekomen, afgerekende kliks. Bronnen: https://hjdk-api-henq.vercel.app/api/shop/trechter (perRoute en perDag), Clickmind /api/mm/export?dag= (tag yoors-shop, per klik), PropellerAds /adv/statistics met campaign_id[] van de SHOP-LUS-campagnes en group_by[]=hour of zone_id.
- Database vol = alles blind, terwijl het netwerk gewoon afrekent. 16 okt 06:00 tot 14:00 UTC zat de Redis van hjdk-api vol (OOM, beleid noeviction): PropellerAds rekende ongeveer 1.000 shopkliks af, wij telden er 6. Geen kenmerk bewaard, dus geen winkelwagen of verkoop toe te wijzen en geen CPA-signaal naar het netwerk. Controleer bij elke ronde https://hjdk-api-henq.vercel.app/api/mm/geheugen en vergelijk per uur afgerekende kliks met aangekomen (PropellerAds-uurlabels zijn EST, UTC-5). Onder 30% over een uur: ALARM.
- yoo.rs houdt direct verkeer slecht vast: van de directe bezoekers is 4 tot 5% een echt mens op de productpagina (cm.js: een aanraking of scroll en 3 seconden zichtbaar), tegen 24% op onze eigen landingspagina. Wie wel echt is, legt vaak iets in de winkelwagen (21 echt, 5 winkelwagens).
- Winkelwagen naar betaald is het grootste gat: tot 16 okt 10 winkelwagens en 0 betaalde bestellingen gemeld, en de betaald-melding kwam alleen bij de test van 12 okt. Eerst bij de shop nagaan of er echt geen orders zijn (of dat de melding niet afgaat), voordat je op campagnes oordeelt.
- CPA-doel $0,01 met ongeveer 1 conversie per dag: het netwerk leert niets en koopt restverkeer. 16 okt: 16 campagnes samen $3,20 per dag. Hoger CPA-doel alleen op Henkjans woord; de marge per product (lib/shopmarge.js) geeft de grens.
- Mondiad-shopcampagnes vallen stil op saldo (16 okt: $0,42, alles OFF_ACCOUNT_BUDGET). Saldo hoort bovenaan het rapport.
- Herhaalkliks: 30 tot 55% van de aangekomen shopbezoekers klikt binnen 10 minuten opnieuw op de advertentie. Dat wijst op een pagina die ze niet vasthoudt.
- Clickmind kijkt elk uur mee (hjdk-api lib/eigenwacht.js, Henkjan 17 okt: "zeer goed naar de Yoors Shop- en todayin-campagnes kijken, veel NL-verkeer"): per campagne naar yoo.rs, todayin en MyLevel de afgerekende kliks tegen bezoeken, echte mensen, acties, aanmeldingen en verkopen, per project en NL apart, plus de shoptrechter per uur. Alarm bij kapotte pagina of meting, aankomst onder 30%, geld zonder mens, todayin zonder leden of boven 3x het doel van $0,10 per lid, rode shoplekken en elke shopverkoop. De shop wordt twee keer gemeten (Clickmind per campagne, shoptrechter per dag); verschillen die, dan een meetgat-melding in plaats van valse alarmen. Les 16 okt: de volle database gaf ook bij de shop 12% aankomst (15 okt: 93%): eerst de meting controleren.

## Echt mens per netwerk

- Welke pagina meldt aan welk netwerk (stand 13 okt):
  - Spel (spel.todayin.email, spel/lib/routes/vraag.js en act.js): Mondiad, PropellerAds en MGID. Naar MGID gaan echtmens (eerste echte mens, eenmaal per klik) en stem.
  - Todayin-site (/for-you via lib/mine.js, onderwerp- en plaatspagina's via lib/echtmens.js): alleen Mondiad en PropellerAds (NETS en ECHT_NET). RichAds krijgt alleen de aanmelding (lib/postback.js). Stuur je MGID-verkeer naar deze pagina's, voeg dan eerst mgid toe aan NETS, ECHT_NET en de postback.
  - MYLEVEL op MGID: mlecht (echt mens) en mlkoop (koop). MYLEVEL op Mondiad meldt alleen een verkoop (14 okt: 0 meldingen in 24 uur), dus Mondiad leert daar niets.
  - Rereview meldt sinds 10 okt niets meer aan Mondiad (alle rereview-campagnes staan sinds 14 okt uit).
- MGID-postback: https://a.mgid.com/postback/878485?c={click_id}&e=<naam>. De link draagt src=mgid, subid={click_id}, zone={widget_id} en creative={teaser_id}.
- MGID gooit een melding weg als de campagne geen conversiestap met precies die naam heeft. Zet daarom bij elke nieuwe MGID-campagne met een eigen pagina de stappen: interest = de echt-mens-melding, buy = de echte actie (set_conversions, controleren met get_conversions). Praisy op MGID (12512708, 13 okt) had geen stappen: het spel stuurde echtmens en stem, MGID telde 0.
- Gaat de link naar Amazon (boeken, blanket), dan is er geen eigen pagina en dus geen echt-mens-melding. Zet daarom altijd het klikregister /go of een wissel /w ervoor (zie Clickmind in iedere campagne en Echte mensen herkennen), en meet daarnaast met de eigen Associates-tag per campagne.

## Harde grenzen

- Nooit een campagne stoppen of pauzeren. Nooit bod, budget of dagplanning wijzigen. Alleen als Henkjan zelf zegt: los op.
- Uitzondering, vaste werkwijze van Henkjan (15 okt): "we doen iedere dag de kopieën en zetten oude uit". Zie Dagelijkse kopieën. Een oude campagne gaat alleen uit als zijn kopie loopt en het verkeer overneemt. De veiligheidscheck weigert massaal stoppen zonder letterlijke opdracht in de chat: vraag Henkjan dan om de letterlijke zin (bijvoorbeeld "stop de 168 directe DE-campagnes") of laat hem het in het panel doen. Werk er nooit omheen.
- Omzet mag nooit omlaag (Henkjan 15 okt): stop of beperk niets voordat er een vervanger loopt die de kliks overneemt.
- Zones blokkeren mag altijd, dat kost nooit geld.
- Bieden altijd op CPA, nooit op CPC. Nieuwe campagnes op gebruikersactiviteit LOW. Uitzondering: MGID kan op dit account alleen CPC.
- Hoogstens $10 per dag per campagne. Uitzondering: MGID vraagt minimaal EUR 20 per dag per campagne.
- Geen conversie-postback naar PropellerAds voor de Amazon-blanket.
- Nooit pop of popunder naar Amazon, ook niet als test.
- Boekcampagnes (eigen KDP-boeken) nooit op PropellerAds; die gaan op MGID, Mondiad of RichAds.
- Sleutels staan als gedeelde team-variabelen in Vercel. Nooit ontsleutelen of tonen.
- Alles draait in de cloud op Vercel, nooit op de laptop.

## Starts per dag

- PropellerAds: hoogstens 40 nieuwe campagnes per dag voor het hele account. Om 05.00 uur UTC begint een nieuwe dag.
- Een campagne als concept aanmaken (clone_campaign met start false) telt niet mee; pas het starten telt. Zo kun je 's avonds klaarzetten en om 05.01 uur UTC laten starten door de Vercel-cron startrij in amz-ronde (api/cron/startrij.js, lijst RIJ).
- Mondiad heeft geen startlimiet, maar veel bots: zie Mondiad.
- Slots = deze 40 starts. Verdeling (Henkjan 15 okt): Yoors Shop minstens 20 (die doet hij in een andere chat, maar de plekken moeten vrij zijn), AMZ hoogstens 10, de rest van de AMZ-groei via Mondiad. Tel vóór elke handmatige start hoeveel AMZ-campagnes die PropellerAds-dag al gestart zijn.
- Amazon: de aanvulronde (amz-ronde, env AMZ_MAX_STARTS) maakt hoogstens 8 nieuwe campagnes per PropellerAds-dag (sinds 15 okt, was 14; plus hoogstens 2 handmatige starts = 10). US gaat voor; DE krijgt wat US niet nodig heeft. Na een env-wijziging amz-ronde opnieuw uitrollen (redeploy), anders geldt de oude waarde. Alleen Henkjan verhoogt dat.
- Op 15 okt startten 30 DE-/go-kopieën en was de limiet om 05:10 UTC al op; 2 concepten bleven liggen tot de volgende dag. Klaarzetten als concept (start false) en na 05:00 UTC starten, binnen de AMZ-ruimte.
- MGID: ongeveer 9 tot 10 nieuwe advertenties per dag in Amsterdamse tijd (LS_TEASER_ADD_LIMIT_ERROR). Dan de volgende dag verder.
- Tel starts die je met de hand doet zelf mee en meld het totaal.

## Dagelijkse kopieën en oude uit (Henkjan 15 okt)

- Iedere dag nieuwe kopieën, en de oude campagne van die zoekterm en tag uit zodra de kopie loopt (status 6, niet in moderatie, met kliks). Zo komt elke dag vers verkeer binnen en lopen er geen dubbele campagnes op dezelfde inkoop.
- De kopieën maakt de aanvulronde van amz-ronde (elk uur op :02, doelen in env AMZ_AANVUL, plafond AMZ_MAX_STARTS). Ze nemen de doel-URL van de bron over; is de bron een /go-campagne, dan blijft de kopie op /go. Is de bron nog een directe link, dan krijgt de kopie een Clickmind-link (Clickmind in iedere campagne).
- Een lopende PropellerAds-campagne kan zijn link niet wijzigen (PATCH negeert target_url, PUT bestaat niet). Een nieuwe link (/go, macro's) gaat dus altijd via een kopie: clone_campaign met start false, daarna starten.
- Oude uit: alleen als de kopie het verkeer overneemt. DE 15 okt: de 30 /go-kopieën kregen meteen 93% van de Duitse kliks; de 168 directe campagnes kregen nog 7% en lekken (geen meting, slechtere conversie). Stoppen vraagt Henkjans letterlijke opdracht in de chat (zie Harde grenzen).
- Meld elke dag: hoeveel kopieën gestart, hoeveel oude uit, en hoeveel van de 40 starts AMZ gebruikte.

## Mondiad

- We kopen voor ongeveer 0,25 cent per klik, tegen een marktgemiddelde van ongeveer 1,6 cent voor in-page push in de VS. Dat is het goedkoopste restverkeer, en daar zitten de bots.
- Desktop is daar bot-verkeer: 11 tot 13 okt kostte desktop $50 (32% van alles) met 0 conversies, en desktop klikte vaker dan mobiel (bij echte mensen is dat andersom). Nieuwe Mondiad-campagnes alleen mobiel; voor Amazon hooguit één desktopkopie met een eigen tag als controle.
- Datacenters uitsluiten kost niets. Het is targeting, dus alleen op Henkjans woord. De ASN's:
  - AWS: 45064, 627008, 25827, 111755, 289334, 210685
  - Google Cloud, proxy en bot: 3983, 474438, 162728, 5683, 5686, 9942
  - Azure: 17025, 207467
  - DigitalOcean: 13806, 201358
  - OVH: 251469, 210279, 77842, 589440
  - Overig: Linode 7512, Choopa 4324, M247 34151, Datacamp 69509, Hetzner 345382
- Pop-campagnes hebben geen maximum per zone; één botzone (2327) kostte op 13 okt $5,27 op één dag. Stel bij nieuwe pop-campagnes $0,30 per zone per dag in.
- Een witte lijst van menszones helpt weinig: bij in-page push in de Engelstalige landen komt ongeveer 96% al uit zone 1458.
- De Amazon-parfumcampagnes (bl-bku-20) draaien op een witte lijst met zones die elders als botzone gelden, en zijn toch de beste Amazon-bron: 14 okt 96% van de betaalde kliks kwam bij Amazon aan, 2,1 artikelen per 100 betaalde kliks, 3x terugverdiend. Mondiad-verkeer is technisch schoon (0,6% datacenter, geen headless) maar doet weinig op eigen pagina's (4 tot 10% echt mens, 0 aanmeldingen). Mondiad dus vooral voor directe Amazon-zoekpagina's.
- Associates heeft geen rapport per ascsubtag (zone): Download Reports kent alleen Linked Product, Category, Tracking ID, Top Sellers en Bounties (15 okt gecontroleerd). Welke zones kopers geven, meet je alleen met een eigen tag per zonegroep.
- AMZ-groei die niet op PropellerAds past, gaat naar Mondiad (Henkjan 15 okt). Neem de instellingen over van de DE-productcampagnes van 9 okt:
  - IN_PAGE_PUSH, CPA 0,04
  - $10 per dag, $20 totaal, $6 per zone per dag
  - alleen mobiel (device 3,4,5, os 2,3,5,6), Duits (taal 37)
  - witte lijst van 17 zones
  - link via /go met n=mondiad
  - bannerFormat en campaignId bij de creatives op null
  - Eerste campagnes: 150582-150585 (DE winterstiefel, stiefeletten, steppjacke, AT stiefeletten; voorvoegsel mdde en mdat op direct).
- Een Mondiad-campagne naar /go zetten: een lopende campagne van link wisselen zet hem terug in moderatie. Maak daarom een /go-kopie:
  - https://hjdk-api-henq.vercel.app/api/mm/mdgo?ids=<id,id>&p=<voorvoegsel> (web_fetch_vercel_url; hoogstens 12 per keer; droog=1 laat eerst zien wat er komt).
  - Zelfde zoekterm, tag, beelden en instellingen. mal=<id> neemt de instellingen (bod, witte lijst, targeting) van een winnaar over. tag=<vrije tag> vervangt een tag die gedeeld is met PropellerAds of een andere site.
  - Nooit dubbel (mm:mdgo:<bron> onthoudt de kopie), dagbudget hoogstens $10, alleen aanmaken: de oude gaat uit volgens Dagelijkse kopieën.
  - mdgo slaat sinds 16 okt bronnen over waarvan de tag 1.500+ Amazon-kliks zonder kopers had, of waarvan de zoekterm te duur is voor pushverkeer (zie Lessen 15 okt); forceer=1 om toch.
- 15 okt (Henkjan "zet meteen Mondiad op GO", "GO US"): 99 US-/go-kopieën, voorvoegsel mdus (gosplit 50: helft meetpagina, helft direct). Alles herkenbaar aan "GO" en "| go" in de naam.
  - 150594-150631: de 34 bl-bku-20-winnaars plus 4 ml-gift-20 (zelfde tag).
  - 150632-150692: 61 kopieën van de merkcampagnes van 16-21 sep die 0 kliks kregen, met mal 149770 en tag ml-push-20. Op 16 okt liepen ze nog de hele dag ($27,77, 6.966 kliks, de helft van alles op Mondiad); om 21:31 Curaçao-tijd zei Henkjan "Ja zet mondiad uit" en zijn alle 61 gepauzeerd via /api/mm/mdpauze.
- Lessen 15 okt (hele dag; Henkjan 16 okt: "leer eerst waarom en zorg dat Clickmind er wat mee kan"; gebouwd in hjdk-api lib/termles.js, uitlezen op /api/mm/termen):
  - Uitslag: ml-push-20 (61 merkcampagnes) 4.562 Amazon-kliks, minder dan 5 artikelen, $14,30 kosten. bl-bku-20 met de 38 /go-kopieën erbij: kliks +76% (2.463 naar 4.327), artikelen +25% (53 naar 66), omzet -17% ($1.194 naar $986). Het Mondiad-saldo ging in één dag van $95 naar $3 en alles op Mondiad viel stil.
  - Prijs: pushkopers kopen artikelen van gemiddeld $15-25 (Associates: bku $15-23, notcart $21). Een zoekterm waarvan Amazon vooral producten boven $40 toont (Chanel, Creed, Dyson, Canada Goose) verkoopt niet, hoeveel kliks er ook komen. Controleer elke nieuwe zoekterm met /api/mm/termen?k=<zoekterm>: mediaan onder $40 en minstens 40% van de producten onder $40. Die controle heeft de Amazon Creators API nodig (AMAZON_CREATORS_ID en _SECRET in hjdk-api); de zoekpagina zelf blokkeert Amazon voor Vercel. Zonder sleutel: kijk zelf naar de prijzen.
  - Tag: een tag met 1.500+ Amazon-kliks zonder kopers is geen koper (/api/mm/termen?tag=). Geef een nieuwe groep zoektermen een eigen tag, anders meet Associates niets per groep.
  - Verzadiging: op dezelfde witte lijst (17 zones, frequentie 1 per campagne per dag) geven meer campagnes vooral meer kliks van dezelfde mensen, niet meer kopers. Groei komt van nieuwe zones of nieuwe kopersgroepen, niet van meer kopieën. Laat kopie en origineel niet naast elkaar lopen. De leerronde meldt dit elk uur onder amazonVerzadiging (/api/mm/termen toont het per dag).
  - Saldo: reken vooraf hoeveel een uitrol per dag kost tegen het saldo. 99 extra campagnes kostten $4-10 per uur.
- Verdict 14-16 okt (Mondiad-rapport per zone, alle campagnes, $131 totaal): zone 1567 $71,61 (55% van al het geld, 20.253 kliks, CTR 0,96%), 1458 $18,01 (CTR 1,57%), 437 $10,42, 455 $7,16, 1824 $5,91; de andere zones elk onder $3. Correctie op "96% uit 1458": in /go-kliks (14-17 okt) is 1567 de grootste (9.421) en 1458 de tweede (1.315). bl-bku-20 kostte 14-16 okt ongeveer $45 en verdiende op 16 okt $16,81 (22 artikelen); ml-push-20 kostte $42 en verdiende $11,25 op 16 okt (verlies, terecht gepauzeerd).
- Tag per zonegroep (17 okt, lib/zonetag.js, /api/mm/zonetag?j=): /go kiest de Amazon-tag op de zone, zodat Associates per zonegroep laat zien wie koopt. Sinds 17 okt 16:00 UTC voor mondiad|bl-bku-20: zone 1567 houdt bl-bku-20, 1458 krijgt ml-web-20, de overige 15 zones rrpush-20. Lees vanaf de hele dag 18 okt per tag af welke zonegroep koopt; tel de drie tags samen voor het oude bl-bku-20-cijfer.
- Verkennen buiten de witte lijst (17 okt): mdgo met zones=zwart (de witte lijst van de mal wordt een zwarte lijst), perzone=<$ per zone per dag> en label=<naam> (tweede kopie van dezelfde bron). Mondiad weigert $1 per zone (fout 400); $3 werkt. Eerste verkenner: 151012, perfume gift set for women, tag bannertest0e-20, voorvoegsel mdvk (gosplit 50), $10 per dag, $20 totaal. Oordeel per zone met het Mondiad-rapport (breakdown ZONE_ID, campaignId 151012) en Associates bannertest0e-20; goede zones gaan naar Henkjan als voorstel voor de witte lijst.
- De /go-meetpagina (600 ms) kan geen mens bewijzen: Mondiad-zones op /go staan in de mensmeter dus altijd op onbekend. Per zone oordelen kan alleen met eigen tags (Associates) of met verkeer naar een eigen pagina.
- Clickmind zag zone 1458 (de grootste zone op de witte lijst) als 1,7% mens in 118 bezoeken. Niet zelf van de witte lijst halen (grootste bron, witte-lijstcampagne): eerst de /go-meting per zone, dan Henkjan voorstellen.

## Clickmind-uurwacht en aankomst (16-17 okt)

- Elk uur op :47 zet /api/mm/wachtuur (hjdk-api lib/wachtuur.js) drie dingen naast elkaar, alleen melden:
  - Aankomst per netwerk en per /go-campagne: wat het netwerk afrekent tegen wat er bij /go binnenkomt (UTC-dag en het laatste uur). PropellerAds via de lus (propellerads-mcp /api/statistiek), Mondiad via de Mondiad-MCP.
  - Geld vandaag naar tags die volgens de Associates-meter geen kopers geven (1.500+ Amazon-kliks zonder kopers, lib/termles.js).
  - Verzadiging per tag (kliks fors omhoog, artikelen niet).
- Elk nieuw alarm (een keer per dag) gaat naar Henkjans Telegram via het doorgeefluik van todayin-spel (/api/meld, sleutel MELD_SLEUTEL in beide projecten) en staat bovenaan /api/mm/overzicht. Lezen: /api/mm/wachtuur?lees=1. Stoppen blijft altijd op Henkjans woord.
- Maatstaf aankomst: direct naar Amazon komt 82-90% van de netwerkkliks aan (Amazon-kliks gedeeld door netwerkkliks, zelfde uren). Via /go in de nacht van 17 okt: 87% (233 van 268 PropellerAds-kliks). /go antwoordt in ongeveer 15 ms (Vercel, mediaan), dus /go kost geen kliks.
- Les 16 okt: met een volle database leek de aankomst 24-33% (Mondiad 2.960 van 12.584, PropellerAds 2.443 van 7.494), maar Clickmind telde toen gewoon niets terwijl /go wel doorstuurde. Oordeel nooit op aankomst van uren waarin de database vol zat (/api/mm/geheugen).
- Mondiad pauzeren kan via de API (mondiad_update_campaign met status PAUSED), alleen op Henkjans woord: /api/mm/mdpauze?ids=<id,id>&reden=<zijn woorden> (logt in mm:mdpauze).
- Clickmind-blokkeren in geld (16 okt, zelfde uren als 15 okt): van de 81 zones die Clickmind als bot of zonder mens zag, sloot de PropellerAds-wacht er 75 uit in de Amazon-campagnes. Geld naar die zones in AMZ ging van $7,60 naar $3,45 (US $4,12 naar $2,86, DE $3,48 naar $0,59). Dat is ongeveer 3% van de AMZ-kosten; de oude prijsregel (343 zones die dag) doet nog het meeste werk.

## Voorspellers per klik (17 okt)

- Henkjan 16 okt: "Bedenk andere variabelen waarmee we kunnen voorspellen wat een klik gaat doen en vind die." Clickmind legt per /go-klik, /w-klik en paginabezoek ongeveer 30 voorspellers vast (hjdk-api lib/voorspel.js), allemaal na de redirect:
  - server: netwerk, systeem, browser, uur (blok van 3 uur) en weekdag bij de bezoeker, deel van de maand, land, regio, postcodegebied, browsertaal tegen land, provider, app, zoekterm;
  - persoon en zone: nieuw of terug, tijd sinds de vorige klik, kliks en campagnes in 24 uur, leeftijd van de zone;
  - browser (meetpagina en eigen pagina's): geheugen, kernen, scherm, scherpte, wifi of mobiel, databesparing, batterij, donkere modus, toestelmerk.
- Elk uur rekent de leerronde per voorspeller de lift uit tegen het gemiddelde voor: meetpagina geladen, binnen 24 uur terug, snelle herhaalklik, bot/datacenter, en op eigen pagina's echt, actie, aanmelding, koop. Alleen cellen met 30+ kliks en een betrouwbaarheidsinterval dat het gemiddelde niet raakt. Lezen: /api/mm/voorspel?dagen=7; top 5 op /api/mm/clickmind en /api/mm/overzicht.
- Eerste uitkomst (14-17 okt, 26.000 kliks):
  - Regio's be-bru en nl-gr en postcodegebied nl-99 zijn 96-100% datacenter of headless: serverparken.
  - Browsertaal die niet bij het land past: 2,5x zo vaak een snelle herhaalklik (48% tegen 20%).
  - Mondiad-kliks zijn veel minder vaak een snelle herhaalklik (2,1%) dan PropellerAds (36%) en Duitsland (33%).
  - Linux-toestellen komen 3,3x zo vaak terug binnen 24 uur: lijkt op bots. Provider 15169 (Google) laadt de meetpagina nooit.
  - Voor Amazon nog zwak (Associates telt alleen per tag): iOS gaat naar tags die 1,75x beter converteren, wifi 1,2x; Windows en 15-18 uur scoren 27-33% slechter.
- Niet te meten: koop per klik op Amazon, kosten per klik (geen kostenmacro in de link), koopkracht per postcode (nog geen inkomenstabel), geheugen op iPhones.
- Vangnet leerronde (17 okt): valt het ophalen van de PropellerAds-kliks uit, dan blijven de grootste bronnen van de vorige ronde en alles op "wacht op Henkjan" beschermd (mm:grootste:propeller). Zonder dat vangnet kwamen de zones 10799219, 10858179 en 11768999 (grootste bron van 13 DE-campagnes) bij "klaar" te staan.

## Per uniek mens, niet per klik (17 okt)

- Henkjan 17 okt: "ga weer verder denken wat we uit een klik nog meer kunnen halen, zeker als het een mens is". Voor Amazon telt per mens één cookie van 24 uur, dus de maatstaf is kosten per uniek mens, niet per klik. /api/mm/mensgeld?dag= (hjdk-api lib/mensgeld.js) geeft per netwerk en land en per tag: kliks, unieke personen (cookie mmp), kliks per mens, herhaalkliks binnen 10 minuten, kosten per uniek mens, en het geld naar mensen die we die dag al hadden. Per tag ook verdiend per mens en terug per dollar. Staat ook in de uurwacht en op /api/mm/overzicht.
- 15 okt (hele dag): PropellerAds DE 8.280 kliks van 4.551 mensen (1,82 per mens, 37% binnen 10 minuten opnieuw), $9,64 van $21,40 naar mensen die we die dag al hadden. PropellerAds AT 2,13 per mens. Mondiad US 1,03 en Mondiad DE 1,09 per mens. Totaal $12,47 van $62,24 aan /go-kliks naar al bereikte mensen.
- Waarom: Mondiad heeft een frequentiegrens van 1 per 24 uur, PropellerAds In-Page niet instelbaar: frequentie en capping zijn vast voor dit campagnetype (de kopieertool laat ze weg; de advertenties zelf dragen click_frequency 2 per 86.400 s). Correctie van 17 okt: een frequentiegrens voorstellen heeft bij PA In-Page dus geen zin. Per uniek mens kost PA DE ongeveer hetzelfde als Mondiad DE ($0,0047 tegen $0,0049). Minder dubbel geld komt dus van zones met minder herhaalklikken blokkeren, niet van een instelling.
- Termoverlap: /go telt per persoon welke zoektermen hij binnen 24 uur aanklikt (mm:kwp, alleen zonder botsignaal). /api/mm/overlap?dagen=3: veel overlap = een kopie of nieuwe term bereikt dezelfde mensen opnieuw; weinig overlap = een eigen kopersgroep. Kies nieuwe termen op weinig overlap.
- Per mens verdiend (15 okt, richtgetal): bl-bku-20 $0,012 per mens, 2,7 artikelen per 100 mensen, $3,07 terug per dollar; bl-gd01/gd02 (boeken) $0,005-0,006 per mens, $1,85-2,05 per dollar; ml-push-20 en ml-gift-20 $0.

## CTR per advertentie en CTR-test (17 okt)

- Henkjan 17 okt: "Kunnen we hier geen campagne van maken om uit te zoeken wat de hoogste CTR is aan het begin van de funnel, bij de advertentie?" Gebouwd: lib/ctrtest.js. Eén campagne (dezelfde zones, hetzelfde bod, dezelfde mensen) met per zoekterm een eigen advertentie; /go met t=<test> en b={bannerid} stuurt elke advertentie naar haar eigen Amazon-zoekterm. Instelling mm:ctrtest:<naam> via /api/mm/ctrtest?j=<json>, stand op /api/mm/ctrtest?naam=<naam> (aangekomen en unieke mensen per advertentie; CTR met ?pa=<json per banner uit PropellerAds>).
- Eerste test dewinter: PA-concept 12022579 (kopie van 12011388, DE, CPA $0,02, $10 per dag, $10 totaal), 6 advertenties 27562363-68: gefütterte boots, stiefeletten, winterstiefel wasserdicht, hausschuhe gefüttert, wellness geschenkset frauen, damen winterstiefel. Beelden staan op whichtobuy.best/img/ct/<oude creative-id>-b.jpg en -i.jpg. Start telt als een handmatige AMZ-start.
- Wat de bestaande cijfers al zeggen (15-17 okt, 40 AMZ DE/AT-campagnes, 4,5 mln vertoningen, CTR gemiddeld 0,42%): Stiefeletten für den Herbst 0,51%, Wellness-Geschenk 0,49%, Wasserdichte Winterstiefel 0,49%, Gefütterte Boots 0,48%, Kuschelige Hausschuhe 0,41%; jassen 0,31-0,39%; selfcare-advertenties 0,73% (weinig vertoningen). Oostenrijk klikt meer dan Duitsland (0,55% tegen 0,40%).
- Of de advertentie bij de zoekterm past, maakt voor de CTR niets uit (0,423% tegen 0,426%). Veel DE-campagnes delen dezelfde 5 advertenties: de geschenke- en weihnachtsgeschenke-für-frauen-campagnes tonen alleen jassen, wellness en hausschuhe tonen vooral laarzen. Wat dat voor de verkoop betekent, meet de CTR-test (elke advertentie landt op haar eigen term).
- Max 8 advertenties per PA-campagne ("Maximum creatives count exceeded"). Eigen beelden in een kopie: clone_campaign met creatives (icon_url, image_url).

## Retargeting / Clickmind-publiek (17 okt)

- Henkjan 17 okt: "Ja retargeting is heel interessant, doe daar uitgebreide studie naar! En voeg toe." Gebouwd in hjdk-api lib/retarget.js; instelling en stand op /api/mm/retarget (?j=<json> om te zetten), ook op /api/mm/overzicht. Staat aan voor PropellerAds; wacht op de publieks-id (partner) uit het PropellerAds-dashboard in netwerken.propeller.publieken["amazon-us"].
- Wie erin komt: alleen bewezen echte mensen. Eigen pagina (cm.js): minstens 8 s zichtbaar en 2 keer scrollen of tikken, mensmeter niet onder 60. /go-meetpagina: alleen iemand die eerder echt iets deed (mm:p echt/actie/aanmelding/koop), geen datacenter. Een keer per mens per publiek per dag.
- Waar: alleen VS (landen-lijst), nooit EU/EER, VK of Zwitserland zonder toestemming (DE §25 TDDDG, AT §165(3) TKG, NL 11.7a: een advertentiepixel van een ander mag pas na opt-in; een meetpagina van 150 ms kan geen toestemming vragen). Nooit bij Global Privacy Control of Do Not Track. Alleen op sites waarvan de privacytekst het noemt: nu whichtobuy (privacy met afmeldknop, Do Not Sell or Share-link in de voet) en /go. Andere sites (todayin, MyLevel) pas na hun privacytekst, op Henkjans akkoord.
- PropellerAds Audiences: drie bronnen. Klikkers op je push-advertenties (PropellerAds verzamelt zelf, geen pixel), converters (via S2S-postback) en de retargeting-pixel (my.rtmark.net, img.gif of p.js, f=sync voegt toe, f=off sluit uit, partner = publieks-id). 90 dagen, hoogstens 15 publieken per account, starten vanaf 30-50 mensen, opnemen en uitsluiten kan allebei, voor push, in-page push, onclick, interactive en Telegram en alle biedmodellen. Geen API: publiek maken en aan een campagne hangen gaat in het dashboard.
- Andere netwerken: MGID heeft zelf-retargeting (pixel met URL-regels of JS-events, advertentieklikkers zonder koppeling maar niet bij push, 0-30 dagen, geen API). Kadam het sterkst (klikkers en converters uit campagnes, pixel, tot 365 dagen, ook via API). RichAds alleen via de accountmanager. Mondiad heeft geen retargeting van mensen: zijn "Traffic Audiences" zijn lijsten met zones, SubID's of domeinen. Clickadu, Galaksion en Adsterra niet.
- Amazon: de regels verbieden een eigen publiek niet, maar vragen dat de privacytekst cookies en pixels van derden noemt (Operating Agreement 3(e)). Geen Amazon-inhoud (productbeelden, prijzen, logo) in de advertentie zelf (6(b)). Een retargeting-advertentie landt het best op een eigen pagina met een zichtbare klik naar Amazon (2(b) en 2(e)).
- Draaiboek: publiek alleen vullen met bewezen mensen, nooit met ruwe kliks (push is volgens fraudebedrijven 25-40% ongeldig). Blanket: venster 1 dag (nieuwe 24-uurssessie) en 2-7 dagen, wie in de laatste 24 uur al naar Amazon ging uitsluiten. Shop: 1-3, 7 en 30 dagen, kopers uitsluiten. Nieuwsbrieven: leden uitsluiten in de werfcampagnes. Hoogstens 1-2 advertenties per dag, wekelijks nieuwe creatives.
- Momenten 2026: Singles Day 11 nov, intocht Sinterklaas 14 nov, Amazon Black Friday-week naar schatting 19-30 nov (2025: 20 nov-1 dec), Black Friday 27 nov, Cyber Monday 30 nov, pakjesavond 5 dec, Nikolaus 6 dec, laatste kerstverzending VS 17-19 dec, DE rond 22 dec.

## Clickmind-database (16 okt)

- De Redis-database van hjdk-api (250 MB, geen eviction) liep op 16 okt vol: de ruwe kliklog mm:raw:<dag> is ongeveer 2 kB per regel en met de Mondiad-massa ongeveer 60 MB per dag. Bij een volle database telt Clickmind niets meer (geen leren, geen meter), maar /go stuurt wel gewoon door naar Amazon.
- Oplossing (Henkjan koos "Ruwe log naar Vercel Blob"): Blob-store clickmind-ruw (privé). Elk uur op :23 verplaatst /api/mm/ruwarchief de ruwe regels naar Blob (gzip, 8x kleiner) en kort Redis in; alle data blijft. Export, terugbetalingsdossier en venster lezen Blob en Redis als één reeks. Na de verplaatsing: van 250 MB naar 75 MB.
- Stand: /api/mm/ruwstand. Geheugen per sleutelgroep: /api/mm/geheugen (en ?match=<patroon> per sleutel). Het geheugen staat ook in /api/mm/stand. Kijk daar bij elke grote uitrol.

## Meta via Whop Ads (Kadoly, sinds 16 nov)

- Waarom: eigen Meta-account geblokkeerd; Whop levert agency-accounts op Meta zonder gedoe. Whop-bedrijf Kadoly biz_gwtIgPUYUJOx2e, campagne KADOLY META NL test 20 (adcamp_8LZEhtO86Lf), 20 advertenties (10 producten x 2 invalshoeken, titel "Product | invalshoek"). Sleutel: gedeelde team-variabele WHOP_API_KEY. Kaart en saldo: https://whop.com/dashboard/biz_gwtIgPUYUJOx2e/ads/settings/?tab=billing.
- Link: https://go.kadoly.com/shop?utm_campaign=nl-<pid8>&p=<pid>&arm=d&lang=nl. utm_source en utm_medium zijn bij Whop gereserveerd (Whop zet zelf facebook/instagram en paid_social). Het net is wh zodra wacid in de link staat; plek = wasid, advertentie = waid, klik-id = fbclid. Altijd direct naar de productpagina, geen tussenpagina.
- Conversies server naar server via de Events API van Whop (lib/whop.js): view_content = echt mens, add_to_cart = tik op de koopknop na 10 s of bewust afrekenen, initiate_checkout = afrekenpagina, alle drie met de productprijs als waarde; purchase met het echte bedrag. De Whop-pixel op kadoly.com alleen na toestemming (cm.js).
- Ronde elke 30 minuten (/api/shop?op=whopronde, :11 en :41). Leert op ROAS: verwachte omzet per advertentie = diepste stap per bezoeker x waarde per stap (elke dag uit 28 dagen Kadoly over alle netten), Thompson per stap. Uit: $1,50 zonder echt mens; geen tik na max($4, 2,5x beste kosten per tik); of na $3 met kans beter dan gemiddeld onder 10% (pas als de campagne $10 uitgaf). Altijd 6 aan. Budget en bod alleen op Henkjans woord.
- Rapport: https://hjdk-api-henq.vercel.app/api/shop?op=whopstand&vorm=tekst (ROAS per advertentie, product en invalshoek). Alarmen via Telegram (sleutel kapot, afgekeurd, aankomst onder 30%, dag boven $12). Dagelijkse les in het werklog van de handover.
- Les 16 nov: 28 dagen Kadoly over alle netten = 10.490 echte mensen, 467 tikken, 359 op de afrekenpagina en 0 toegeschreven kopen. In de shopfeed stonden 26 bestellingen, waarvan 3 betaald en 23 verlopen: het grootste ROAS-lek zit bij het betalen, niet in de advertenties.
- Les 19 nov (levering lag 5 uur stil, Henkjan: "Voorkom deze fouten in de toekomst"):
  - Whop rekent elk cijfer (link clicks, paginaweergaven, resultaten) toe via de eigen pixel en levert advertenties trager of niet als die pixel niet vuurt op de doel-URL. Een doel-URL die met een 302 doorstuurt (go.kadoly.com/shop naar kadoly.com) vuurt nooit in de browser. Daarom stuurt land() bij elke klik met klik-id een paginaweergave via de Events API (whPage, url = de echte landings-URL met wacid/wasid/waid en fbclid). Controle: Whop > Websites > go.kadoly.com moet op Pixel connected staan, en /api/shop?op=whpixel toont paginaweergaven vandaag (goed/fout).
  - Zet nooit de laatste advertenties uit waar Meta op levert terwijl de rest nog geen vertoning had: WH_REGEL.minLeverend = 2.
  - Nieuwe advertenties die 24 uur aan staan zonder één vertoning zijn een levering-probleem, geen slechte advertentie. Eerst pixel, keuring en levering nakijken.
  - Uitgave die overdag 90 minuten niet beweegt terwijl er budget over is = alarm (Telegram), niet wachten op de uurstand.
  - Optimaliseren op content_view gaf $65 tot $280 per 1.000 vertoningen (bijna geen signaal bij Meta). Op Henkjans ja (19 nov) twee dagen op landingspaginaweergaven, daarna op add_to_cart zodra er rond de 50 tikken per week zijn.
  - Advertenties alleen voor producten met minstens EUR 10 marge; goedkope producten (portemonnee EUR 8) kosten bij elke verkoop geld.
  - Wie meldt dat iets niet loopt, zoekt eerst de oorzaak in de cijfers van Whop zelf (dashboard Ads per advertentie: Spent, Impressions) naast Clickmind (aangekomen, echt), voordat hij meldt dat er niets bewoog.

## MGID (account 878485)

- Push mag niet op dit account; gebruik type product of content (native).
- Alleen CPC. Minimumbod VS en Duitsland 3,1 cent, Canada 3,6 cent.
- Minimaal EUR 20 per dag per campagne (in de API 2000). Dagbudget en totaalbudget gaan niet samen; begrens met een einddatum.
- Product-campagnes accepteren categoryId 264; andere categorieën gaven CAMPAIGN_CATEGORY_NOT_ALLOWED. Duitse advertenties hebben advertText nodig en een Duitse knoptekst (call_to_actions, bijv. "Jetzt ansehen").
- Advertentie: beeld van Amazon als https://m.media-amazon.com/images/I/<id>._SR720,480_.jpg.
- MGID wijst zelf ongeveer 19% van de kliks af (niet betaald). De prijsregel van de wacht werkt niet bij een vaste klikprijs; zonder conversiestappen ziet de wacht niets, dan beslist de uurlijkse check.
- Boeken kerst 2026: 12512712 (VS) en 12512713 (Canada); blanket-test DE tegen VS sinds 14 okt: 12512721 (bl-de07-21), 12512722 (bl-de08-21), 12512723 (bl-t06-20). Dagelijkse cloudtaak "AMZ MGID ronde" om 07:20 UTC.

## RichAds

- Rekent op dit account altijd $0,01 per klik, ook met een CPA-doel; minimaal $30 dagbudget.
- Conversies staan in het veld conversions; conversions_sum is altijd 0 (wacht gerepareerd 14 okt). Vertoningen per site kloppen niet; gebruik alleen kliks en kosten. spend_guard pauzeert echt en heeft geen proefstand.
- 9 tot 11 okt ging 82% van het geld naar verkeer zonder echt mens. Per aanmelding todayin $9 tot 12 tegen ongeveer $4 tot 5 bij Mondiad en PropellerAds; een shop-doorklik 7x duurder dan PropellerAds In-Page. Finds was de enige plek waar RichAds kon meekomen ($1,50 per aanmelding).
- Daarom: RichAds alleen weer aan met een witte lijst van sites die echt aanmeldingen gaven, en een harde stop op $10 per dag.

## Clickadu

- Stoppen via de API lukt niet: statuswissel naar 7 of 8 wordt geweigerd, en de hele campagne terugsturen zonder beelden ook. Stoppen kan alleen in het paneel (adv.clickadu.com), door Henkjan. De budgetwacht kan op Clickadu dus niets stoppen; alleen de eigen budgetten van Clickadu remmen.
- SmartCPA rekent na de testfase per conversie. Laat de conversie pas melden bij een koopklik of betaling, niet bij een tussenstap (MyLevel betaalde $0,50 per afgemaakte test, 0 verkopen).
- Zones uitsluiten kan alleen veilig via zonesUit van de shop-lus (samenvoegen en beelden meesturen), en alleen voor SHOP-LUS.
- Geen nieuwe Clickadu-campagnes zolang stoppen via de koppeling niet aantoonbaar werkt.
- Clickmind 15 okt: Clickadu-bezoekers 0% echt mens, 98% datacenter, 93% headless. MyLevel: 174 bezoeken, 1 mens. Het is botverkeer.

## De Amazon-blanket

- Een pushklik gaat naar een Amazon-zoekpagina met de tag en een ascsubtag met de zone-id erin. Sinds 15 okt gaat dat via het klikregister /go (Clickmind in iedere campagne). De klik zet een cookie van 24 uur.
- Naam van een campagne: AMZ, land, dag, zoekterm en tag, zoals de bestaande campagnes. De tag in de naam moet gelijk zijn aan de tag in de link.
- Tags voor de VS eindigen op -20, voor Duitsland en het VK op -21. Nieuwe tags mag je zelf maken op affiliate-program.amazon.com/home/account/tag/manage. Maximum 100 tags per account (13 okt gaf het maken een fout); meer kan via Customer Service.
- Een klik levert in de VS ongeveer een halve dollarcent op, in Duitsland bijna een dollarcent. Een klik kost gemiddeld 0,2 tot 0,3 dollarcent. De prijs per zone maakt het verschil.
- Meer kopieen van dezelfde zoekterm geven nauwelijks meer kliks. Groei komt uit nieuwe termen of landen.
- Meer kliks geven nauwelijks meer kopers. Van 20 sep tot 12 okt bleven de bestellingen in de VS rond 160 tot 260 per dag, terwijl de kliks van ongeveer 17.000 naar 30.000 per dag gingen. Extra kliks converteren ongeveer 0,5%, het gemiddelde ligt rond 0,8 tot 0,9%. Ze verdienen zichzelf nog net terug, dus niet blind kliks schrappen: zoek de zones die onder break-even zitten.
- 91% van het US-verkeer is Android met Chrome. Segmenteren op besturingssysteem of apparaat verschuift weinig; de verschillen zitten in de zones.
- Oordeel alleen op hele-dagrapporten van Associates, nooit op een tussenstand. Een tussenstand kan beide kanten op zitten: 13 okt overdag 0,54% (hele dag 0,58%), 14 okt overdag 1,64% (hele dag 1,33%).
- Amazon US rekent in Amerikaanse tijd (Pacific). Vergelijk netwerkkliks in dezelfde uren (tz -0700), anders klopt het percentage geteld niet. De Amazon-meter doet dat: /api/mm/amazonmeter?dag= op hjdk-api-henq.vercel.app (invoer per tag: /api/mm/amazon?dag=&tag=&kliks=&artikelen=&omzet=&verdiend=&bron=associates-heledag). Alleen meten, nooit blokkeren op het percentage geteld; zones gaan eruit op geld.
- Associates per tag uitlezen: Reports, Yesterday, Group by Tracking ID. De tabel geeft 25 rijen per pagina. Kleine aantallen (onder ongeveer 5 artikelen) staan als "-" en tellen mee onder Other.
- Hele dagen US:
  - 13 okt: 37.690 kliks, 217 artikelen (0,58%), $4.909 besteld.
  - 14 okt: 29.221 kliks, 388 artikelen (1,33%), $8.060 besteld.
  - 14 okt per tag terugverdiend (opbrengst tegen kosten): notcart-20 2,1x, bl-t20-20 4,2x, bl-bku-20 3,1x (Mondiad), bl-t14-20 3,6x, pboss0f-20 3,3x, luxury08c2-20 1,5x. bl-t09-20 gaf 0 artikelen op 734 betaalde kliks, twee dagen op rij.
  - 15 okt: 37.957 kliks, 262 artikelen (0,69%), $4.908 besteld. Per tag terugverdiend: notcart-20 1,5x, bl-bku-20 1,95x, bl-t20-20 1,85x, pboss0f-20 1,56x, bl-gd01-20 1,85x, bl-gd02-20 2,05x, luxury08c2-20 0,75x, ml-push-20 en ml-gift-20 0 (minder dan 5 artikelen).
  - Winst 15 okt: Amazon US $247,84 verdiend ($232,34 commissie plus $15,50 bonus) tegen $107,40 Amazon-kosten (PropellerAds $65,12, Mondiad $42,28), dus +$140. Alle projecten samen kostten $334,88 (MyLevel $106,73 zonder gemelde verkoop). Commissie telt pas bij verzending, dus een deel komt van eerdere dagen.
  - Gemiddeld besteld bedrag per artikel: $15-25. Pushkopers kopen goedkoop (zie Lessen 15 okt bij Mondiad).
  - Werkelijk commissietarief 2,5 tot 2,8%, plus bounties.
- Conversie per zonegroep meet je alleen met een eigen tag: een campagne met een witte lijst van die zones en een eigen tag. De wacht laat campagnes met een witte lijst met rust.
- Kliktest 14 en 15 okt: bl-ctrh-20 (campagne 12005831, 125 zones met veel kliks per vertoning) tegen bl-ctrl-20 (12005832, 78 zones met weinig).
  - Uitslag op 16 okt. Zakt de veel-kliks-groep onder break-even, dan gaan die zones overal uit.
  - Tussenstand 14 okt: ctrl 21 artikelen op 372 Amazon-kliks (16x terugverdiend), ctrh 18 op 562 (12x). Op 13 okt stonden ze allebei verborgen.
- /go-proef 14 tot 16 okt: 12006513 (bl-hw13-20, direct) tegen 12006514 (via /go).
  - Les 15 okt: bl-hw13-20, bl-mh13-20 en bl-ls13-20 waren nooit aangemaakt in Associates. Een niet-geregistreerde tag levert niets op en Amazon telt hem niet.
  - /go zet daarom mh13 om naar bl-lr01-20 (meetpagina) en ls13 naar bl-lr02-20 (direct), via TAG_ALIAS in hjdk-api lib/mensmeter.js. De controle 12006513 is niet te meten.
  - Controleer elke nieuwe tag in Manage Your Tracking IDs voordat hij op een campagne gaat.
- US loopt sinds 17 okt stap voor stap via /go. De aanvulronde kopieert de doel-URL van de vorige ronde, dus staat de nieuwste kopie van een zoekterm op /go, dan blijft die term op /go. Per PropellerAds-dag hoogstens 2 termen omzetten (de 2 handmatige AMZ-starts): clone_campaign van de nieuwste kopie met start false, naam "AMZ <label van morgen> | <zoekterm> | <tag>", target_url https://whichtobuy.best/go?n=propeller&c={campaignid}&z={zoneid}&s=${SUBID}&b={bannerid}&k=<zoekterm>&tag=<tag>&p=gous, en na 05:00 UTC starten (vóór de aanvulronde van 06:02). Voorvoegsel gous staat op gosplit 90 (90% direct door, 10% de meetpagina voor browsersignalen).
  - 17 okt 05:06 UTC gestart: 12020831 gift ideas for women (notcart-20) en 12020832 ugg slippers women (bl-t14-20), daarna in moderatie (status 2). Daarna nog: red light therapy mask en matching christmas pajamas for family (bl-t14-20), en de termen van bl-t09-20 en luxury08c2-20.
  - 18 okt gaat een van de twee handmatige plekken naar de CTR-test DE (12022579, Henkjans eigen vraag); daarna weer de US-termen.
  - Een terugkerende geplande taak hiervoor werd door de veiligheidscheck geweigerd; een herinnering terug in de chat (send_later) werkt wel.
  - amz-ronde heeft geen git-repo en de Vercel-tool geeft de broncode afgekapt terug. De code van amz-ronde dus niet aanpassen; werk via de doel-URL van de bronkopie, of via env-variabelen en een redeploy van de bestaande deploy.
- DE loopt sinds 15 okt via /go (30 kopieën 12011386-12011435, voorvoegsel dego op direct). /go-variant per voorvoegsel op de server: /api/mm/gosplit?p=&pct= (0 = meetpagina, 100 = direct).
- Vrije geregistreerde US-tags (17 okt): bl-lr09-20, ml-mail-20, ml-mailb-20, rrmail-20. Sinds 17 okt in gebruik: ml-web-20 en rrpush-20 (zonegroepen van bl-bku-20 op Mondiad, zie Mondiad), bannertest0e-20 (Mondiad-verkenner 151012). ml-gift-20 en ml-push-20 staan sinds 15 okt op Mondiad (ml-push-20 is geen koper).
  - bl-lr01..08-20 zijn alias voor de /go- en wisseltags.
  - bl-gd01..03-20 staan op de boeken op Mondiad (150381-150383).
  - Controleer een tag altijd op beide netwerken voordat je hem gebruikt: target_url en url, en bij Mondiad alle pagina's (meer dan 800 campagnes, 500 per pagina).
- Kopie naar een ander land: clone_campaign met country, voor het VK is dat gb. Controleer eerst met campaign_payload.
- Gereserveerd voor de wissels (niet op campagnes zetten): bl-gh13-20, bl-af13-20, bl-fd13-20, bl-lm13-20, bl-sc13-20.

## Amazon-regels (Associates, onderzocht 14 okt)

- Sinds 14 april 2026 telt een aankoop niet als de koper via een betaalde of gepromote advertentie direct naar Amazon kwam (VS, VK, DE). Henkjan weet dit en beslist zelf.
- Een doorstuurlink zonder handeling van de bezoeker op de tussensite telt als directe link (§2(e)). /go en /w veranderen dat niet. Wat wel past: advertentie → echte pagina met eigen inhoud en waarde voor de bezoeker → zichtbare klik naar Amazon. Over de "limited exceptions" Amazon schriftelijk vragen.
- Sub-tags (ascsubtag) nooit per bezoeker of klik toewijzen (§2(b)). Blanket-campagnes die ${SUBID} in de ascsubtag zetten doen precies dat: melden, Henkjan beslist.
- Herkomst niet verbergen (§6(v)). Geen beloning of cashback voor kopen (§6(g)). Amazon-links in e-mail, push of Telegram alleen met opt-in (§4). Op de site: "As an Amazon Associate I earn from qualifying purchases".
- Geen rapportage-API: de Creators API vraagt 10 verkopen in 30 dagen en PA-API 5 is gestopt. Opbrengst per tag komt uit het dagrapport.

## Verspillingswacht op alle netwerken

- PropellerAds, RichAds, Mondiad en MGID hebben elk een wacht die elke 10 minuten draait.
- Ze gebruiken dezelfde centrale regels en melden elke ronde op dezelfde plek. Zo leert elke wacht van dezelfde cijfers.
- Een wacht vult alleen de zwarte lijst aan en controleert na het schrijven of de zones er echt op staan.
- De Mondiad-wacht (hjdk-api lib/mdwacht.js) doet sinds 14 okt ook pop-campagnes, met de prijsregel op pops.
  - Hij leest de zonemeting van rereview: zwart en verdacht eruit, wit nooit, de grootste bron nooit automatisch.
  - Zones waar minder dan 30% van het afgerekende verkeer aankomt gaan eruit. Komt van een hele campagne minder dan 10% aan, dan geeft hij een ALARM in plaats van te blokkeren.
  - Nog niet aangesloten: de metingen van todayin, MYLEVEL, Outnamed, finds en het klikregister /go.
- De MGID-wacht (wacht_nu) blokkeert bronnen per campagne en oordeelt op de conversiestap buy. Zonder conversiestappen ziet hij alleen kosten, geen echte mensen.
- Campagnes met een eigen lus, zoals SHOP-LUS en TODAYIN, laat de wacht met rust.
- Clickadu heeft geen wacht: zones zijn daar alleen voor SHOP-LUS veilig te blokkeren en stoppen via de API lukt niet (zie Clickadu).
- Nieuw netwerk erbij: zelfde opzet. Elke 10 minuten, centrale regels ophalen, alleen blokkeren, controleren, centraal melden.

## Zwarte lijst botzones (alle netwerken, alle vormen)

- Openbare lijsten met zone-nummers bestaan niet bruikbaar (gezocht 13 okt: fora, netwerkblogs, GitHub). Onze eigen metingen van echte mensen zijn de enige bron.
- Een zone komt op de lijst als hij bij ons verkeer stuurt maar nooit een mens.
  - Spel: 15 keer geladen en geen enkel echt mens, of 40 keer geladen en minder dan 5% echt.
  - Todayin: 50 bezoeken zonder mens, of het script draaide bij minder dan de helft na 30 bezoeken.
- Nooit een zone waar iemand iets deed (stem, deling, keuze, e-mail). Nooit de grootste bron van een campagne of netwerk.
- Elke 5 minuten zet een cloudtaak de lijst op de uitsluitlijst van elke lopende PropellerAds-campagne, in alle vormen: push, in-page, onclick, interstitial en Telegram. Hooguit 40 campagnes per ronde. Een campagne die de lijst al heeft, wordt overgeslagen. Alleen toevoegen, nooit weghalen.
- Waar het draait: in de repo henkjandekrijger-glitch/todayin, site/lib/botzones.js met cron /api/cron/botzones in Moonlighter (daar staat de PropellerAds-sleutel). De lijst van het spel staat op spel.todayin.email/api/zones/botlijst.
- Stand met bewijs per zone: https://moonlighter-henq.vercel.app/api/cron/botzones. Lees die bij elke ronde. Staan er fouten in, dan eerst repareren.
- Mondiad: het spel geeft per campagne de slechte zones door op /api/zones/blok, en de Mondiad-wacht blokkeert die.
  - Een nieuwe Mondiad-campagne naar het spel moet in CAMPAGNE in spel/lib/routes/zones.js, anders leert hij niet mee.
  - Rereview geeft zijn zones op rereview.app/api/b/zones?dagen=3, met oordeel zwart, verdacht, wit of onbekend (v = bezoeken, h + e = echte mensen).
- MGID: het spel meet per widget (cid mg-..., zone = widget_id), maar die widgets gaan nog niet automatisch op een zwarte lijst. Blokkeer slechte MGID-widgets uit de spelmeting met block_sources.
- Elke nieuwe campagne en landingspagina moet meedoen. De link draagt zone en campagne. De pagina meet per zone geladen, script, echt mens en actie, zoals spel (lib/routes/act.js, vraag.js) en todayin (lib/mine.js) dat doen. Zonder die meting kan de lijst niet groeien.
- Topverkeer: zones met echte mensen nooit blokkeren. Zie je een zone met veel echte mensen en acties, meld die dan, zodat er een eigen campagne of een hoger zonebod komt (bod alleen op zijn woord).

## De regels

- Amazon per land, laatste 72 uur: een zone gaat weg vanaf 8 dollarcent als de klikprijs hoger is dan 2,5 keer het landgemiddelde en ook hoger dan wat een klik oplevert. Ook weg: 5 dollarcent zonder een enkele klik.
- Campagnes met minstens 3 conversies: weg bij geld zonder conversie, minstens een halve dollar en 2 keer de gemiddelde kosten per conversie. Of bij meer dan 3 keer de gemiddelde kosten per conversie.
- Andere campagnes: zelfde klikprijsregel binnen de campagne; bij pop dezelfde regel op de prijs per pop.
- Aanmeldcampagnes (todayin, for-you): een zone met 50 of meer bezoeken en geen enkel echt mens gaat op de zwarte lijst. De dagelijkse lessen noemen die zones.
- Bol-campagnes: een zone pas afschrijven na 30 dagen, omdat orders laat binnenkomen (zie Vaste lessen).

## Leren

- Elke dag na het hele-dagrapport van Associates: geef per land de opbrengst per klik door met regels_leer (commissie van de PropellerAds-tags gedeeld door hun Amazon-kliks; 13 okt $0,0029, 14 okt $0,0064, mediaan $0,0045). Zie je die tool niet, gebruik dan ronde_modus met leer_land, leer_waarde, leer_dag en leer_bron.
- De wacht gebruikt het midden van de laatste 7 dagen, zodat een rare dag niets omgooit.
- Een regel aanpassen kan met regels_zet, altijd met een reden. Er zijn veilige grenzen, zodat de wacht nooit alles of niets blokkeert.
- Elke dag ook de lessen van ?lessen=1 lezen en uitvoeren: zones blokkeren die ze noemen, en bij een les over te smalle inkoop of een slechte bron een voorstel of wijziging doen.

## Rapporteren

- Resultaat eerst, in een paar regels.
- Wat het kostte, wat het opleverde en wat je veranderde.
- Saldo's onder de grens bovenaan: PropellerAds onder $150, Mondiad onder $40, MGID onder EUR 40, RichAds onder $30.
- Escalaties gaan naar Henkjan via Telegram (todayin-spel /api/meld met MELD_SLEUTEL, zoals de Clickmind-uurwacht) en bovenaan het dagrapport.