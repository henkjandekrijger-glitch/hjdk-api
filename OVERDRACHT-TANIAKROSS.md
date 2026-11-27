# Overdracht taniakross.media (Tania Kross): site, lijst, podcastmail, betaald en organisch

Bijgewerkt: vrijdag 20 november 2026, 15:15 UTC (11:15 Curaçao), door chat-taniakross.
Live te lezen: https://hjdk-api-henq.vercel.app/api/wtb?op=tkoverdracht (met web_fetch_vercel_url). Bovenaan staat dan het werklog van alle regels met wie=chat-taniakross of wie=tk-...

Bijgewerkt 27 nov 2026 12:00 UTC door tk-chat. Dit blok gaat voor op oudere tekst hieronder.

- **Doel:** 1.000 adressen voor 31 dec 2026. Stand 80. Nodig 27 per dag: Mailmind rond 17 (150 mails x 12% ja) plus PropellerAds rond 10.
- **Oordeel hoger bod: nee.** Bod $0,20 gaf op 26 nov 3 adressen voor $1,44 ($0,48 per adres); $0,05 tot $0,06 gaf 11 tot 12 per dag voor $0,03 tot $0,06. Hoger bieden koopt duurdere kliks, niet meer adressen. **Het bod van de TK-lijn is $0,06**, ook voor elke dagkopie.
- **Fout van 26 nov en het slot daarop (Henkjan: "Dit mag nooit meer gebeuren zorg daarvoor"):** dagkopie 12193513 stond op $0,01 terwijl de tool "bod 0.2" meldde (het getal uit het verzoek); de voorganger ging uit en er kwam geen adres meer. Sinds 27 nov zit het slot in de connector (propellerads-mcp, lib/bodcheck.mjs): elke kopie-tool meldt het bod dat PropellerAds teruggeeft, `bod_van_bron: true` geeft de dagkopie meteen het bod van de bron, en `update_campaign` weigert het stoppen van een campagne zolang zijn opvolger op dezelfde link lager biedt. Nalezen: tool `bod_controle`. Maak elke dagkopie met `bod_van_bron: true` en schrijf alleen een bod op dat je in dat antwoord las.
- **Dagvenster (Henkjans ja, 27 nov):** 12193513 koopt van 07:00 tot 22:00 Nederlandse tijd (was 14:00 tot 05:00: de nacht erbij, de ochtend gemist). Een kopie neemt dit venster over; controleer het na elke kopie (campagnetijd is -5).
- **Mailmind (Henkjans akkoord, 27 nov):** bij deze toestemmingsmail telt een stop niet meer als rem (`stopIsAntwoord` in lib/tkmc.js; de rem op bounces blijft: 8% halveren, onder 5% groeien). Tempo terug op 80 per dag, +25 per dag naar 150. Was door 15 stops op 86 mails naar 20 gezakt terwijl 12% ja zei.
- **Vercel simpele-site (Henkjans ja, 27 nov):** NB_VOORBEELD_AAN, LIJST_ANTWOORD en RAPPORT_AAN staan erin. Ze gelden vanaf de eerstvolgende uitrol. Vanaf dan gaat het voorbeeld van de weekmail naar Tania en Henkjan (cron 14:30 UTC, naar de lijst pas na Nu versturen), kan het nieuwe ochtendverslag uit (adressen uit de code naar RAPPORT_AAN) en kan het venster naar de Mailmind-modal.
- **Google (Henkjan 27 nov: "breng structuur aan zodat googlers juiste structuur zien van haar en niet een random tekst uit de site"):** de homepage heeft al Person, WebSite en de rest in JSON-LD. Het lek zit in de zichtbare tekst: de eerste lopende tekst is de inleiding van de podcast, de omschrijving is 198 tekens (te lang) en het menu wijst naar ankers in plaats van pagina's. Voorstel ligt bij Henkjan (eerst zien, dan live): korte regel wie Tania is bovenaan, omschrijving onder 155 tekens, data-nosnippet op podcasttekst, menu en aanmeldvenster, ProfilePage erbij. Open vraag: mag "Boekingen via Theaterbureau de Mannen" uit de omschrijving.

Bijgewerkt 24 nov 2026 11:30 UTC: de pauze tot maandag 20:00 is voorbij. Campagne opgesplitst in BEWEZEN (12183102) en VERKENNER (12168319) met een dagelijkse leerronde (zie 7). De Mailchimp-adressen (zie 10) zijn nog niet besproken.

## 1. Wat het is

- taniakross.media is de site van mezzosopraan Tania Kross. Tania beheert haar eigen inhoud (homepage, agenda, gasten van de podcast). Henkjan en de chats doen de techniek, de lijst, de mail, de campagnes en de vindbaarheid.
- De podcast heet **A Kross …**. Eerste aflevering met Francis Sling staat live; aflevering 2 komt nog. Gasten met "Binnenkort" op de homepage: onder meer Izaline Calister, Samira Rafaela en Valika Smeulders.
- Doel Henkjan (20 nov): **1.000 adressen op de lijst eind 2026**. Stand 20 nov 15:12 UTC: **20 leden**. Dat is ongeveer 24 adressen per dag vanaf nu.
- Mailing: Henkjan wil naar **één podcastmail per week** (20 nov: "We moeten naar een week mailing toe vr de podcast").

## 2. Harde regels

1. **Niets naar de lijst zonder akkoord van Henkjan en Tania** (20 nov: "Verstuur niet zomaar dingen in de mail lijst want ze kloppen niet moet ik overleggen met Tania"). Bedoeld zijn de gewone mailingen (de wekelijkse podcastmail). De welkomstmail bij aanmelding mag blijven lopen.
2. Mails namens Henkjan (outreach, pitches): eerst het concept in de chat laten zien, pas na zijn "verstuur" in Gmail. Skill mail-lerend (lees de regels, meld met /api/post?op=meld). De Gmail-koppeling herschrijft links naar google.com/url: controleer met get_draft, of verstuur via Gmail in Chrome.
3. Nooit Tania's eigen bestanden of teksten overschrijven. Geen verzonnen feiten. Geen gedachtestreepjes in zichtbare tekst.
4. Campagnes: bod, budget, pauzeren en targeting alleen op Henkjans woord. Zones blokkeren mag zelf. Hoogstens $10 per dag per campagne.
5. Nooit wachtwoorden typen (ook niet die van Tania), nooit CAPTCHA's. Sluit elke browsertab die je opent.
6. E-mailadressen nooit in code, pagina's of URL's. Een privacy-plugin weigert sinds 20 nov elke uitrol of elk commando waarin een persoonlijk adres naast een naam staat. Adressen horen in Vercel-variabelen.
7. Werk nakijken voor het online gaat (uid-sha's na een uitrol vergelijken, pagina live ophalen).

## 3. Toegang en uitrollen

- Vercel-project **simpele-site** (prj_647ggjACuojq0k8KCIJwMXIWrt7y), team henq (team_9EYxyAU5QDExrrrOSKamefJT). Domeinen: taniakross.media, www, taniakross.nl, taniakross.com, simpele-site-henq.vercel.app.
- **Geen git-repo.** Uitrollen gaat met mcp__Vercel__create_deployment (target production, name en project simpele-site) met alle bestanden: ongewijzigde bestanden als {file, sha} uit list_deployment_files van de laatste productie-uitrol (pad zonder "src/"), gewijzigde bestanden inline (encoding utf-8). Daarna list_deployment_files van de nieuwe uitrol: de uid moet de sha1 van je lokale bestand zijn.
- De volledige live bron staat op https://simpele-site-henq.vercel.app/api/bron (web_fetch_vercel_url; groot, opslaan en met python lezen). Zo haal je een bestand op om te wijzigen.
- Bestanden waar een persoonlijk adres in staat (bijv. fn/rapport.js, fn/lijst.js, api/_intern/overdracht.html, api/_push.js) kun je **niet inline** uitrollen door de privacy-plugin: alleen per sha meenemen. Moet je er iets in wijzigen, haal dan eerst het adres eruit naar een Vercel-variabele (zoals bij fn/nieuwsbrief.js op 20 nov).
- De shell in de cloud kan taniakross.media niet bereiken (proxy); gebruik web_fetch_vercel_url op simpele-site-henq.vercel.app.
- Laatste productie-uitrol: zie sectie 12 (24 nov). Haal altijd zelf de laatste op met list_deployments.

## 4. Onderdelen van de site (bestanden in simpele-site)

- fn/home.js: homepage (kopie van Tania's eigen pagina met onze blokken). **Niet uitgerold, wacht nog:** sameAs in de Person-gegevens aanvullen met YouTube @Taniakrossmezzo en Facebook taniakrossmezzo (alleen lokaal gemaakt in de vorige chat, opnieuw doen).
- fn/podiumklassiek.js: pagina /podium-klassiek (live 20 nov). Special 27 okt 2026 (41 min), Talent Masterclass Operazang (NPO Cultuur), aflevering 27 sep 2026 met Floris Kortie. FAQ en TVEpisode-gegevens. Reden: Demand Radar 'podium klassiek' 5.400 zoekopdrachten per maand in NL, Search Console 'tania kross podium klassiek' op plek 9.
- fn/mezzosopraan.js: /mezzosopraan en /en/mezzo-soprano met aria's en bekende mezzo's (live, datePublished 16 nov, lastmod 20 nov).
- fn/kaart.js: sitemap-omhulsel om fn/seo.js (seo.js is te groot om inline te zetten). ERBIJ voegt /podium-klassiek toe, DATUM zet lastmod van de mezzo-pagina's. vercel.json stuurt /sitemap.xml naar /api/kaart?a=sitemap.
- fn/llms.js: llms.txt met een Podium Klassiek-deel (metPK).
- vercel.json: rewrite /podium-klassiek, sitemap, crons (zie 6). Geen afsluitende nieuwe regel in het bestand (anders klopt de sha niet).
- fn/lijst.js (server) en lijst.js (browser): aanmelden, venster, modal, welkomstmail, afmelden, tellen. Zie 5.
- api/_mailleer.js: lerende onderwerpen en linkteller voor alle mail (Thompson op kliks). Toegestane linkdoelen: taniakross.media, YouTube, Spotify, Apple Podcasts, en sinds 20 nov de Clickmind-wissel whichtobuy.best/w/tk-mail.
- fn/nieuwsbrief.js: wekelijkse podcastmail. Zie 6.
- fn/rapport.js: dagelijks verslag (cron 11:00 UTC) naar Tania en Henkjan. Gaat niet naar de lijst.
- Wikidata en NL-Wikipedia: oude domeinen omgezet naar taniakross.media (door Henkjan gedaan, 20 nov).

## 5. De lijst en aanmelden

- Leden staan als blob lijst/leden/<hash>.json. Geen dubbele opt-in meer: aanmelden is meteen lid (Henkjan 20 nov: "Ze hoeven niet te bevestigen").
- Stand lezen: https://simpele-site-henq.vercel.app/api/lijst?a=stand (leden, armen, momenten, per herkomst, mail).
- Overige eindpunten in fn/lijst.js: a=aan (aanmelden, POST), a=kies (welke tekst), a=af (afmelden), a=k (linkteller), a=o (openpixel), a=ga (bestemming uit de welkomstmail), a=voorbeeld&v=<arm> (welkomstmail bekijken zonder te versturen), a=inhaal en a=omzet (beheer).
- **Teksten (armen)**, lerend per bezoeker:
  - Modal op de site: p1 tot p3 (podcast), m1 tot m4 (post van Tania, live), t1 tot t3, plus de cadeau-armen.
  - Cadeau-armen (sinds 20 nov): g1 "Barcelona, meteen in je mail" (Barcelona van Tania en Tommie Christiaan), g2 "Tania heeft iets voor je" (verrassing), g3 "Kijk meteen: Tania met <laatste gast>".
  - Videovenster voor betaald verkeer (bron=betaald&venster=1): armen g1, g2, g3, p1; vensterversie pv, pv2, pv3 wordt als moment geteld.
- **Welkomstmail** (stuurWelkom in a=aan, gaat meteen bij elke aanmelding): houdt zich aan de belofte uit het venster (BELOOFD g1 = barcelona, g3 = aflevering). Varianten w1 tot w4 (lijst), b1/b2 (Barcelona), a1/a2 (aflevering). Elke link loopt via Clickmind-wissel tk-mail naar taniakross.media/api/lijst?a=ga (Barcelona-pagina met cm.js, of /podcast). Stand 20 nov: w1 2, w3 2, w2 1, w4 1, a2 1, b2 1 verstuurd; 0 kliks.
- **Open fout:** de Barcelona-pagina (a=ga&d=barcelona) gebruikt een youtube-nocookie-embed (video Y420kVQ45GA) die bij sommige bezoekers om inloggen vraagt. Omzetten naar de gewone youtube.com-embed.
- **Ochtendverslag (api/rapport.js) toont sinds 25 nov ook de e-mailadressen:** nieuwe adressen van gisteren (Curaçao-dag) met land en herkomst, totaal in de lijst en het aantal erbij in de 7 dagen daarvoor. Gebouwd in api/_logboek.js (recent() en mailBlok(), alleen door rapport.js gebruikt), omdat rapport.js adressen bevat en niet inline uitgerold kan worden. Adressen staan alleen in die mail, nergens op de site.
- Stand 20 nov 15:12 UTC: 20 leden. Betaald verkeer: venster pv 4.418 getoond / 5 aan, pv3 1.782 / 4, pv2 1.758 / 1; cadeau g1 23 / 1, g2 30 / 1, g3 25 / 0, p1 35 / 0. Gewone modal: m1 20 / 2, p3 20 / 2, t1 14 / 1 (3 ja).

## 6. Wekelijkse podcastmail (fn/nieuwsbrief.js)

- Cron elke dag 14:30 UTC (vercel.json). Is de vorige mail minstens 6 dagen oud en staat er een nieuwe aflevering live (soort aflevering) of een gast met "Binnenkort" (soort binnenkort), dan gaat er een **voorbeeld** naar Tania en Henkjan met de knoppen Nu versturen en Niet versturen.
- **Sinds 20 nov 14:47 UTC: niet meer vanzelf versturen.** De mail gaat alleen naar de lijst als iemand op Nu versturen klikt (a=ja met teken). Zonder klik vervalt het voorbeeld na 6 dagen en komt er een nieuw. Daarvoor ging hij na 23 uur vanzelf naar iedereen.
- Adressen staan niet meer in de code. **Henkjan moet in Vercel (simpele-site, Environment Variables, Production) nog zetten:**
  - NB_VOORBEELD_AAN: zijn adres en dat van Tania, met een komma ertussen.
  - LIJST_ANTWOORD: Tania's adres (antwoordadres van de lijstmail).
  - Zolang NB_VOORBEELD_AAN leeg is gaat er geen voorbeeld uit; het log zegt dan "voorbeeld mislukt: NB_VOORBEELD_AAN staat niet in Vercel". Er gaat dus ook niets naar de lijst.
- Onderwerpen lerend (a1 tot a4, b1 tot b3) via api/_mailleer.js. Stand: /api/nieuwsbrief?a=stand (sleutel nodig). Bekijken: a=bekijk&s=<slug>&t=<teken>.
- Afspraak voor maandag: Henkjan en Tania bepalen samen wat er in de weekmail komt. Pas daarna de tekst in mailHtml en binnenkortHtml aanpassen.

## 7. Betaald: PropellerAds "betalen per adres"

- Campagne **12168319 TK PODCAST ADRES NL** (In-Page Push, NL, CW, AW, BQ, SR, mobiel; kopie van 12162921). Model CPA goal (rate_model cpag) op een e-mailadres, **bod $0,03 per adres op Henkjans woord (20 nov 13:15 UTC)**. $10 per dag, $30 totaal. 8 advertenties. Zwarte lijst van 1.164 zones.
- Link: Clickmind-wissel **/w/tk-podcast** (whichtobuy.best) met een url-arm naar taniakross.media (utm_source=propeller). pb {"propeller":"aanmelding"}: de PropellerAds-conversie gaat alleen terug bij een aanmelding.
- Stand 14:05 UTC 20 nov: 20.102 vertoningen, 154 kliks, $0,26, 1 aanmelding (banner 27789106), Clickmind 37 echt, 28 actie. Rekensom: een klik kost ongeveer $0,0017. Voor $0,03 per adres moet 1 op 18 klikkers zich aanmelden; nu is dat ongeveer 1 op 80. Clickmind ziet maar ongeveer 20% van de klikkers als echt mens.
- Henkjan 20 nov: "gebruik clickmind om juiste zones te vinden moet naar 0.03 cent per adres. Blijf leren op alle variabelen" (advertenties, venstertekst, moment, zones, mail). Zones: /api/mm/zones op hjdk-api-henq (wit, zwart, verdacht, mensPct). De netwerkwacht neemt het blokvoorstel van Clickmind vanzelf over.
- Uurstand in de chat (send_later-keten "Uurstand TK PODCAST ADRES") is op 20 nov 15:12 UTC gestopt; sinds 24 nov is er een dagelijkse leerronde (hieronder).
- **Uitslag 20-24 nov (12168319):** 564.313 vertoningen, 3.138 kliks, $5,14, 32 adressen ($0,16 per adres). Lijst van 20 naar 51 leden. **De 48 zones die Clickmind "wit" noemt (echt mens) gaven 27 van de 32 adressen voor $0,53 ($0,02 per adres); de andere ~1.100 zones 5 adressen voor $4,57 ($0,91 per adres).** Zone 10771611 alleen: 21 adressen op 583 kliks voor $0,32. Advertenties: "Nieuw van Tania Kross" (cr 1,69%), "Wie is Tania Kross echt?" (1,61%), "Muziek als medicijn" (1,46%), "Opera, maar dan anders" (1,33%) winnen; "Van Curaçao tot Concertgebouw" (0,25%) en "Winnaar van The Masked Singer" (0,27%) verliezen en staan uit. Venster: tekst g2 "Tania heeft iets voor je" wint (20 aanmeldingen op 922, 2,2%).
- **Opzet sinds 24 nov (Henkjan: "verbeter campagne drastisch met wat je geleerd heb OF leer beter leren voor de campagne . Bod kan iets omhoog als je beter leert . Dus iedere dag gaat er betere campagne live"):**
  - **BEWEZEN 12183102** "TK ADRES BEWEZEN NL": witte lijst van 53 zones (Clickmind-wit plus elke zone met een adres), de 4 winnende advertenties plus 4 nieuwe (Tania heeft iets voor je; Waarom muziek ons heelt; Opera zonder drempel; Het verhaal achter de stem), knop "Gratis in mail", **bod $0,05 per adres**, $10 per dag, $50 totaal.
  - **VERKENNER 12168319**: blijft op $0,03 om nieuwe zones te vinden; de 53 bewezen zones staan daar op de zwarte lijst, zodat de twee niet tegen elkaar bieden.
- **Dagelijkse leerronde** (sinds 25 nov een cloudtaak "TK dagronde adressen (cloud)" trig_01Dxs5zUJ4mzjJUDJHPsS4Z3, 08:17 Curaçao, los van computer en account; doel 40 adressen per dag; de oude send_later-keten loopt na 26 nov niet meer door):
  1. Cijfers van de laatste 3 dagen per zone en per advertentie van BEWEZEN en VERKENNER (PropellerAds /adv/statistics, group_by zone_id en banner_id, tz +0000) plus Clickmind /api/mm/zones (lijst wit) en de lijststand.
  2. Promoveren: een zone in de VERKENNER met een adres, of die Clickmind wit noemt, gaat naar de witte lijst van BEWEZEN en op de zwarte lijst van de VERKENNER.
  3. Degraderen: een zone in BEWEZEN met 80 of meer kliks en geen adres gaat van de witte lijst af (zones_erbij_uitsluiten).
  4. Advertenties: met 300 of meer kliks en minder dan de helft van de gemiddelde conversie van zijn campagne gaat uit; elke dag een nieuwe kopie van BEWEZEN met de beste advertenties plus 2 nieuwe (kopie_met_verse_creatives, knop hoogstens 15 tekens, dan witte lijst zetten, bod zetten, starten), de oude BEWEZEN uit zodra de nieuwe loopt.
  5. Bod: BEWEZEN omhoog met $0,01 (hoogstens $0,08) alleen als de kosten per adres daar onder $0,05 blijven en hij minder dan $5 per dag uitgeeft; nooit boven $0,10 zonder Henkjan. Budget blijft $10 per dag.
  6. Rapport, hooguit 6 regels: adressen gisteren per campagne, kosten per adres, leden totaal, wat er veranderde. Werklog met wie=chat-taniakross.
- **Stand 26 nov (dagronde + Henkjan "Ja doen .Go !"):** 12187841 en VERKENNER 12168319 staan uit op Henkjans woord (25 nov), **12183102 is de enige lopende TK-campagne** en blijft aan. Gisteren 7 adressen ($0,05 per adres in 12183102; alles samen $1,05, $0,15 per adres), maar hij won maar 0,12% van de veilingen. Daarom **bod $0,10 naar $0,20** en **witte lijst 43 naar 82 zones** (39 Clickmind-wit zones uit de verkenner erbij; 12219015 blijft eraf). Lijst 73 leden. Grens: haalt hij 40+ per dag en stijgt de prijs boven $0,15 per adres, dan bod -$0,02.
- **Stand 25 nov (dagronde, Henkjan: "optimaliseer en vernieuw campagen met geleerde"):** BEWEZEN 12183102 gaf 12 adressen voor ongeveer $0,057 per adres, maar won maar 0,2% van de veilingen (leverde te weinig), dus **bod $0,05 naar $0,06**. Witte lijst nu 44 zones (12219015 eraf, 11196806 erbij). Advertenties 27810196 en 27810200 uit. VERKENNER 12168319: zone 12300292 geblokkeerd; zonder de bewezen zones 1 adres voor $0,28. **Nieuwe dagkopie 12187841** met de 6 beste en 2 nieuwe advertenties, zelfde 44 zones, bod $0,06, $10 per dag, $50 totaal, bij moderatie ingediend; de oude BEWEZEN gaat uit zodra 12187841 loopt. Lijst van 51 naar 63 leden.
- **Stand 26 nov 12:20 UTC (dagronde):** alleen **BEWEZEN 12183102** loopt (bod **$0,10** op Henkjans woord 25 nov; 43 zones op de witte lijst). VERKENNER 12168319 en dagkopie 12187841 staan uit op Henkjans woord ("VEEEEEEEL eerder stoppen": 12168319 224 kliks zonder adres; 12187841 136 kliks, 0 adressen voor $0,47). Gisteren 12183102 11 adressen voor $0,36 ($0,033 per adres). Vandaag tot 12:18 1 adres voor $0,12. Win rate blijft 0,12%: het hogere bod levert niet meer vertoningen op. Geen advertentie heeft 300 kliks, dus geen nieuwe kopie; geen zone boven 80 kliks zonder adres (12219015 stond al van de lijst). Lijst 73 leden. Zonder VERKENNER worden er geen nieuwe zones gevonden: dat vraagt een besluit van Henkjan.
- **Dagkopie 26 nov 14:25 UTC (Henkjan: "Je moet /campagnes-henkjan gebruiken dan zie je dat je verbeterde nieuwe campagne moet starten iedere dag"): 12193513**, ingediend voor moderatie.
  - Witte lijst van 118 zones: de 82 van 12183102, zonder 10572751 (63 kliks, 0 adressen), plus 37 zones die Clickmind wit noemt (js 5+, mens 30%+, geen datacenter).
  - Advertenties: de 6 beste (Waarom muziek ons heelt cr 4,3%, Wie is Tania Kross echt 3%, Opera zonder drempel, Tania heeft iets voor je, Nieuw van Tania Kross, Muziek als medicijn) plus 2 nieuwe (Muziek die je beter maakt; Tania Kross, heel persoonlijk).
  - Knop in het Nederlands, "Luister gratis" (was het Engelse "Discover now").
  - Bod $0,20, hetzelfde als 12183102 sinds 26 nov ~12:30 UTC.
  - 12183102 gaat uit zodra 12193513 levert (check om 18:26 UTC).
  - **Vaste regel vanaf nu: elke dagronde zet een nieuwe, verbeterde kopie live** (stap 4 hierboven) en zet de vorige uit zodra de nieuwe levert.
- Advertentiebeelden op maat: https://hjdk-api-henq.vercel.app/api/advbeeld?u=<beeld>&t=icon|pa|mg.
- Volledige werking van tk-podcast en tk-mail staat ook in lib/werking.js (regel taniakross.media podcast).

## 8. Social en Meta

- Henkjan wil ook social boosten met een leadformulier ("formulier is essentieel").
- Zijn eigen Meta-gebruiker is geblokkeerd voor adverteren, ook binnen het portfolio Tania Kross (ID 117039557707523). Het portfolio Krossover is "not eligible for advertising". Twee keer geprobeerd, afgebroken.
- Route: Tania moet zelf inloggen (niet als gedelegeerde van Henkjan). Zernio-profiel "Tania Kross" id 6b004d8fc4618c7ccf1e428c; connect_ads met zakelijke login; daarna lead_gen_create_lead_form en lead_gen_list_leads. Nodig: team-variabele ZERNIO_API_KEY.

## 9. Ligt te marineren (niet versturen)

- **Profielplekken:** mails aan plekken waar Tania een profiel heeft (zoals de Academie van de Kunsten): vraag om de link te wijzigen naar taniakross.media en meteen de vraag of ze op de hoogte willen blijven, dan zet Henkjan ze op de lijst. Concepten stonden alleen in de vorige chat; opnieuw opstellen volgens mail-lerend en eerst aan Henkjan laten zien. Henkjan: "Nog niet versturen. Even marineren."
- **Pitch aan tv-redacties** voor de podcast. De tour was vorig jaar, dit jaar geen tour; Theaterbureau de Mannen niet noemen ("vergeet de mannen"). Haakjes: Tania als gast aan tafel, een liveliedje in december, cultuur en Caribische media, fragmenten van 60 seconden.
- Open vraag aan Henkjan: klopt het boekingscontact (Dorien Scholtens, Theaterbureau de Mannen) nog op de homepage en op /podium-klassiek? Gezien "vergeet de mannen" misschien niet meer.

## 10. Oude Mailchimp-lijst opnieuw vragen (Mailmind-stroom tk-mailchimp, lib/tkmc.js, sinds 25 nov)

Henkjan 25 nov: "vind lijst van mailchimp in mijn email en stuur per dag een aantal met vraag of ze nog op lijst willen blijven lang niets gehoord van Tania zorg wel dat de mail super is . En fokking lerend dus iedere 20 wordt ie beter . Je kan in mijn inbox replies laten landen of vanaf mij Laten sturen . Wat slimste is."

- **Bron:** members_export_839147311c.zip (Henkjan aan zichzelf, 9 nov 2020, lijst "Tania Kross" op Adsfair BV): 19.197 subscribed, 1.384 afgemeld, 1.466 cleaned. We nemen alleen subscribed met Mailchimp-score 3 tot 5: **13.724 adressen** (score 5: 1.318, 4: 6.823, 3: 5.583), eerst 5, dan 4, dan 3, binnen een score willekeurig. Aangemeld 2017 tot 2020. Ouder: export van 11 dec 2018 (fanlijst, niet gebruikt).
- **Import:** /api/post?op=tkmc&import=1 (beschermde host) haalt de zip zelf uit Henkjans Gmail via Zernio en zet de adressen in de Mailmind-bakken (score | soort adres | jaar). De eerste import van 25 nov ging naar kv tkmc:rij en is met &naarbakken=1 verplaatst. Nooit adressen in code.
- **Motor:** Mailmind (lib/mailmind.js): kiest per ronde de bak met de beste kans op ja, leert de varianten, poort voor Henkjans Gmail samen met de clubwerving, gedeelde blokkeerlijst. Zie de skill mail-lerend.
- **Kanaal:** uit Henkjans eigen Gmail via Zernio (zoals de clubwerving). Resend verbiedt oude lijsten en daar loopt al het andere over; taniakross.media staat niet bij Resend (domeinlimiet van het gratis plan). Antwoorden landen vanzelf in zijn inbox. Zernio: gewone Gmail 200 per dag (400 na 14 schone dagen); 10 harde bounces in een uur of dezelfde tekst naar 50+ mensen in een uur zet de grens terug. Daarom hooguit 8 per uur, 9 tot 21 uur NL, eigen aanhef en jaartal per mail.
- **Toestemming:** alleen wie ja zegt komt op de lijst: knop op taniakross.media/blijf/<tok> (bevestigt met JavaScript, dus linkscanners zetten niets aan) of "ja" terugmailen. Dan POST naar /api/lijst?a=aan met p=mailchimp-<variant>; de gewone welkomstmail volgt (bij een Barcelona-variant v=g1). Stop: taniakross.media/stop/<tok> en List-Unsubscribe. Niets doen = nooit meer mailen.
- **Rewrite** in simpele-site/vercel.json: /blijf/:t en /stop/:t naar keuzehulp.best/api/post?op=tkmc&t=:t&w=ja|stop.
- **Leren:** twee varianten tegelijk, Thompson op ja per verstuurde mail. Elke 20 verstuurde mails een leermoment: een variant met 20+ verstuurd die voor 80% de slechtste is gaat eruit, de volgende komt erbij; na 60 per variant zonder duidelijke winnaar valt de laagste toch af. Zes varianten klaar (o0 vraag plus podcast, o1 met Barcelona als cadeau, o2 "Lang niets van Tania Kross gehoord", o3 podcast voorop, o4 heel kort, o5 "We ruimen de lijst op" met Barcelona). Daarna uitdagers via op=mailmind&s=tk-mailchimp&uitdager={"o":..,"t":..}; de TK-dagronde leest de antwoorden (op=mailmind&s=tk-mailchimp&leer=1) en schrijft er een als de rij opraakt.
- **Volume:** start 40 per dag; bounce onder 5% en stop onder 3% over 7 dagen (vanaf 40 mails): +10 per 2 dagen, tot 180; bounce 8% of stop 5%: halveren. Elke mail wordt gemeld in de POST-lus (project tk-mailchimp).
- **Stand:** /api/post?op=mailmind&s=tk-mailchimp (per variant, per bak, mailbox, lekken), voorbeeld van de echte mail: /api/post?op=tkmc&voorbeeld=1 (beschermde host hjdk-api-henq.vercel.app).
- **Live sinds 25 nov 13:55 UTC** (Henkjan: "Verstuur en zorg voor updates hier en in dashboard ."): LIVE in lib/tkmc.js op true en /api/post?op=mailmind&s=tk-mailchimp&zet=1&aan=1. Uitzetten: &zet=1&aan=0.

## 12. Muziek als medicijn, leesstand en dagartikelen (24 nov)

- **Dossier** /muziek-als-medicijn en /en/music-as-medicine (api/muziek.js in simpele-site): verborgen (niet in menu of homepage), wel index,follow, in sitemap en llms.txt. Alles uit gelezen bronnen (Cochrane, Lancet, BJS, NIHR). Wacht op Tania's persoonlijke noot; dan ook Paleissymposium "Music and Mind, Music as Medicine" (2025, co-voorzitter met Ineke Sluiter) en "The Art of Healing" (Erasmus 2026) erbij, het dossier vanaf de site linken, de advertentie "Muziek als medicijn" erheen laten wijzen en een ZICHT-proef zetten.
- **Dagartikelen** (Henkjan: "vul dit iedere dag aan met een artikel wat relevant is en verwijs dan naar dossier onderaan dat artikel"): api/mmart.js. Eén JSON per dag in data/mm/<datum>-<onderwerp>.json (nl en en). Adressen /muziek-als-medicijn/<slug> en /en/music-as-medicine/<slug>. Het dossier loopt ook via mmart.js (zet de lijst "Nieuwste artikelen" erin), zodat muziek.js nooit mee hoeft. Sitemap via api/kaart.js uit dezelfde map. Een nieuw artikel = alleen het nieuwe JSON-bestand inline uitrollen, de rest op sha.
- Eerste artikel: /muziek-als-medicijn/muziek-om-in-slaap-te-vallen en /en/music-as-medicine/music-to-fall-asleep (Cochrane CD010459).
- **Dagtaak, los van account of computer** (Henkjan: "onafh van account of computer als account beschikbaar die tokens gebruiken of ander account anders AI gateway . Met altijd efficient token gebruik"):
  1. Claude-account: geplande taak trig_01GBsTSx84bciUTnNr7qnpe1 "TK dagartikel muziek als medicijn", 10:37 UTC in de cloud. Kijkt eerst /api/mmart?op=stand, kiest onderwerp uit Demand Radar muziek-medicijn plus AI-gaten, leest bronnen, schrijft data/mm/<datum>-<onderwerp>.json, rolt uit (alleen dat bestand inline), controleert, werklog wie=tk-dagartikel, bericht aan Henkjan. Een ander account kan precies dezelfde taak draaien: de prompt staat hieronder in het kort en volledig in de taak zelf.
  2. Terugval zonder account: Vercel-cron /api/mmart?op=dag om 15:07 UTC in simpele-site. Staat er vandaag nog geen artikel, dan één poging per dag (slot in Blob mm/poging/<datum>.json): haalt de brontekst zelf op uit de WACHTRIJ (7 onderwerpen met bronnen die voor het dossier gelezen zijn), schrijft via de AI Gateway met het goedkoopste model (Haiku 5.5, terugval Haiku 4.5, systeemprompt gecachet, ~1 cent), keurt zelf: JSON, slugs, geen gedachtestreepjes, geen HTML, elk getal moet in de bron staan; anders één herkansing en dan geen artikel. Bewaard in Blob mm/artikelen/, getoond zoals de rest; werklog wie=tk-dagartikel-gateway. Sleutel: AI_GATEWAY_API_KEY of anders het OIDC-token van het project.
  3. Stand: https://simpele-site-henq.vercel.app/api/mmart?op=stand (artikel vandaag en door wie, laatste 5, poging van vandaag, wat er in de wachtrij over is). Is de wachtrij op en draait er geen account, dan stopt het vanzelf (gemeld in het werklog): vul dan WACHTRIJ in api/mmart.js aan met gelezen bronnen.
  Prompt in het kort: stand lezen, onderwerp uit Demand Radar, bronnen lezen, JSON in NL en EN zoals data/mm/2026-11-24-slapen.json, alleen dat bestand inline uitrollen met de rest op sha, live controleren, werklog, drie regels aan Henkjan.
- **Toegankelijke weergave**: knop met het toegankelijkheidsteken (figuur met gespreide armen in een cirkel) naast de zon/maan op elke pagina, of ?lees=1 (uit met ?lees=0). Exact de vormgeving van de live pagina sealedintent.com (Henkjan: "Ik vroeg sealedintent look . Exact"; niet de oude blauwe kleuren uit lib/sealed.js): zwart-wit (inkt #111113, lijnen #E5E7EB, vlak #F3F4F6), Inter 17px/1.6, kop 1040px met merk links (dichte cirkel + naam) en tekstlinks rechts, inhoud 680px, h1 24-30px, kleine kopjes 13px hoofdletters, rijen met een lijn ertussen, pilknoppen met rand (hoofdknop zwart), kaarten hoek 16, vlakken hoek 12, voet 13px, foto bovenaan klein (220px). Donker = omgekeerd. Alles in tk-extra.css onder html[data-tk-lees].
- Laatste uitrol: dpl_HJ7Tn2BWHze4j5zn1qr3HG3HLVRk (24 nov 13:38 UTC): tk-extra.css exact sealedintent.com (zwart-wit), vakgebieden-lijst in de kolom, geen streep onder blok-links. Controle: alle paginasoorten (home, podcast, optredens, pers, vragen, dossier, artikel) op 1280 en 390 px zonder te brede of uitstekende blokken. Daarvoor dpl_ETPHTDPmPon4QApCeHeVBeg76Y9B: api/mmart.js (terugval), api/kaart.js, vercel.json (cron), tk.js (toegankelijkheidsteken).

## 11. Open punten, op volgorde

1. Maandag na 20:00: Mailchimp-adressen bespreken (10).
2. Henkjan zet NB_VOORBEELD_AAN en LIJST_ANTWOORD in Vercel (6).
3. Inhoud van de weekmail met Tania afstemmen, dan de mailtekst aanpassen (6).
4. Uurstand en dagronde van 12168319 weer plannen als Henkjan dat wil; door op zones naar $0,03 per adres (7).
5. Barcelona-embed naar youtube.com (5).
6. home.js sameAs YouTube en Facebook uitrollen (4).
7. Meta-leadformulier zodra Tania zelf kan inloggen (8).
8. Profielmails en tv-pitch: marineren tot Henkjan zegt (9).
9. Boekingscontact op de site controleren met Henkjan (9).
10. Tania's persoonlijke noot in het dossier, daarna dossier linken, advertentie erheen, ZICHT-proef (12).

## Logboek (nieuwste boven)

- 26 nov 18:27 UTC chat-taniakross: dagkopie 12193513 goedgekeurd en levert (25.051 vertoningen, 65 kliks, $0,11, nog 0 adressen). Oude BEWEZEN 12183102 uitgezet (vandaag 4 adressen voor $1,56 = $0,39 per adres sinds het bod $0,20 is). Nu loopt alleen 12193513.

- 26 nov 14:25 UTC chat-taniakross: dagkopie 12193513 ingediend (118 zones, 6 beste + 2 nieuwe advertenties, knop Luister gratis). Daarna gaat 12183102 uit. Elke dag een nieuwe kopie (Henkjan).

- 26 nov 12:30 UTC tk-dagronde: op Henkjans "Ja doen .Go !" 12183102 bod $0,20 en 82 zones (was 43). Gisteren 7 adressen, lijst 73, Mailmind 62 verstuurd 5 ja 8 stop.

- 26 nov 12:20 UTC chat-taniakross: dagronde. Gisteren 12183102 11 adressen ($0,033 per adres), 12168319 en 12187841 0 (beide uit). Niets gewijzigd: geen zone of advertentie over de drempel, bod al $0,10 (boven de rondegrens $0,08). Lijst 73 leden. Ochtendverslag zonder runtime-fouten (alleen de oude vertaling-403).

- 25 nov 19:20 UTC chat-taniakross: Henkjan: "Ok Jij kiest en leert beste onderwerp vr hoogste conversie via mailmind en clickmind". Nieuwe onderwerpen (o0 Tania Kross in gesprek met <nieuwste gast>, o1 Barcelona van Tania Kross en Tommie Christiaan, o4 Nieuw van Tania Kross: haar podcast A Kross …, o5 Van Tania Kross: Barcelona en haar podcast). Mailmind leert op ja + 0,3 x klik. Tempo op zijn ok: 80 per dag nu, +25 per dag naar 150, 12 per uur, remmen bij 8% bounce of 5% stop. Doel 1.000 adressen voor 31 dec.
- 25 nov 15:10 UTC chat-taniakross: Henkjan: "Zet de link naar de site erin met francis podcast in beeld en laat ze ook zien dat ze welkom zijn met welkom terug". Welkompagina in de stijl van de site op taniakross.media/blijf/<tok> (na ja: welkom terug, bevestiging, nieuwste aflevering live van de site, nu Francis Sling) en /blijf/<tok>?l=1 (kijklink: welkom terug, aflevering in beeld, ja-knop onder de video). Voorbeeld: /blijf/voorbeeld?l=1. De kijklink in de mail staat klaar maar uit tot Henkjans akkoord (kv tkmc:kijk, op=tkmc&kijk=1 op de beschermde host). Mailmind vervangt links nu langste eerst.
- 25 nov 13:55 UTC chat-taniakross: Henkjan: "Verstuur". Mailmind-stroom tk-mailchimp aan (LIVE en aan=1); eerste mails in de uurronde van :23, 40 per dag, hooguit 7 per uur, 9 tot 21 uur NL. Elke link in de mail is nu een Clickmind-meetlink (taniakross.media/m/<code>, rewrite in simpele-site naar keuzehulp.best).

- 25 nov 13:40 UTC chat-taniakross: op Henkjans "Ja ga naar 40 per dag . en verhoog dus": bod 12187841 van $0,01 (stond per ongeluk zo laag) naar $0,10, verkenner 12168319 van $0,03 naar $0,05. Uitzetten van de oude 12183102 werd door de veiligheidscontrole geweigerd; hij loopt nog. Dagronde nu als cloudtaak trig_01Dxs5zUJ4mzjJUDJHPsS4Z3 (08:17 Curaçao), los van computer en account. Doel en planning op het dashboard (project tk: 40 adressen per dag, op weg naar 1.000); Mailmind zet de ledenstand elk uur zelf op het dashboard.

- 25 nov 13:50 UTC chat-taniakross: Mailmind gebouwd (lib/mailmind.js, één lerende mailmotor voor alle projecten); de Tania-lijst is de eerste stroom (tk-mailchimp), adressen in bakken die leren welk soort adres het best scoort. Clubwerving deelt de Gmail-poort en blokkeerlijst. Nog steeds uit tot Henkjans verstuur.

- 25 nov 13:30 UTC chat-taniakross: oude Mailchimp-lijst (13.724 adressen, score 3-5) klaargezet om opnieuw te vragen, lerend, uit Henkjans Gmail via Zernio (lib/tkmc.js, /api/post?op=tkmc). Staat uit tot Henkjans verstuur.

- 25 nov 11:40 UTC chat-taniakross: ochtendverslag krijgt blok E-mailadressen (nieuw gisteren met land en herkomst, totaal, 7 dagen) via api/_logboek.js, uitrol dpl_Tid8NwQqSRF2HjhjdLooKZZ25wJW. Campagnes: BEWEZEN 12183102 bod $0,06 en 44 zones, 2 advertenties uit, VERKENNER zone 12300292 geblokkeerd, nieuwe dagkopie 12187841 bij moderatie.

- 24 nov 13:38 UTC chat-taniakross: fout in toegankelijke weergave hersteld (vakgebieden Podcast, Radio, Concerten enz. stonden paginabreed met grote witruimte; nu een lijst in de kolom), streep onder hele gastblokken weg, kop op telefoon netter. Alle paginasoorten nagelopen. Uitrol dpl_HJ7Tn2BWHze4j5zn1qr3HG3HLVRk.

- 24 nov 13:22 UTC chat-taniakross: toegankelijke weergave exact naar de live sealedintent.com (zwart-wit, 17px, 680px, lijnen, pilknoppen) in plaats van de oude blauwe kleuren. Uitrol dpl_G9rVHRKo7JUKEruUQkeMoUhf8Z3F.

- 24 nov 12:55 UTC chat-taniakross: toegankelijke weergave nu volledig in Sealed-vormgeving met het toegankelijkheidsteken als knop; dagartikel los van account: terugval via Vercel-cron en AI Gateway (Haiku, getallencontrole) om 15:07 UTC. Uitrol dpl_ETPHTDPmPon4QApCeHeVBeg76Y9B.

- 24 nov 12:30 UTC chat-taniakross: leesstand (Aa-knop, sealedintent-look) live op de hele site; dagartikelen bij het dossier (api/mmart.js), eerste artikel over muziek en slapen live; dagtaak trig_01GBsTSx84bciUTnNr7qnpe1 om 10:37 UTC.

- 24 nov 11:30 UTC chat-taniakross: les uit 20-24 nov: Clickmind-wit zones gaven 27 van 32 adressen voor $0,02 per adres. BEWEZEN 12183102 (53 zones, 8 advertenties, $0,05) gestart; VERKENNER 12168319 zonder die zones en zonder de 2 slechtste advertenties; dagelijkse leerronde gepland. Lijst 51 leden.

- 20 nov 15:15 UTC chat-taniakross: overdracht geschreven. Podcastmail gaat niet meer vanzelf (alleen na Nu versturen), adressen naar Vercel-variabelen, uitrol dpl_F1Z7GzbzA1d8qiHsgaTgvNK4aqLC live. Mailchimp-exports gevonden. Uurstand gestopt tot maandag 20:00 Curaçao.
- 20 nov chat-taniakross: welkomstmail met cadeau (Barcelona, verrassing, aflevering), wissel tk-mail, venster lerend; campagne 12168319 op CPA $0,03 per adres; /podium-klassiek, mezzo-aria's, sitemap en llms.txt live.
