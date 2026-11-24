# Overdracht taniakross.media (Tania Kross): site, lijst, podcastmail, betaald en organisch

Bijgewerkt: vrijdag 20 november 2026, 15:15 UTC (11:15 Curaçao), door chat-taniakross.
Live te lezen: https://hjdk-api-henq.vercel.app/api/wtb?op=tkoverdracht (met web_fetch_vercel_url). Bovenaan staat dan het werklog van alle regels met wie=chat-taniakross of wie=tk-...

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
- Laatste productie-uitrol: dpl_F1Z7GzbzA1d8qiHsgaTgvNK4aqLC (20 nov 14:47 UTC, READY): fn/nieuwsbrief.js uid acf4a499eae8872de0927874d4ca2d2c704c0a29.

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
- **Dagelijkse leerronde** (send_later-keten "TK ADRES dagronde", rond 12:17 UTC, rapport in de chat van Henkjan):
  1. Cijfers van de laatste 3 dagen per zone en per advertentie van BEWEZEN en VERKENNER (PropellerAds /adv/statistics, group_by zone_id en banner_id, tz +0000) plus Clickmind /api/mm/zones (lijst wit) en de lijststand.
  2. Promoveren: een zone in de VERKENNER met een adres, of die Clickmind wit noemt, gaat naar de witte lijst van BEWEZEN en op de zwarte lijst van de VERKENNER.
  3. Degraderen: een zone in BEWEZEN met 80 of meer kliks en geen adres gaat van de witte lijst af (zones_erbij_uitsluiten).
  4. Advertenties: met 300 of meer kliks en minder dan de helft van de gemiddelde conversie van zijn campagne gaat uit; elke dag een nieuwe kopie van BEWEZEN met de beste advertenties plus 2 nieuwe (kopie_met_verse_creatives, knop hoogstens 15 tekens, dan witte lijst zetten, bod zetten, starten), de oude BEWEZEN uit zodra de nieuwe loopt.
  5. Bod: BEWEZEN omhoog met $0,01 (hoogstens $0,08) alleen als de kosten per adres daar onder $0,05 blijven en hij minder dan $5 per dag uitgeeft; nooit boven $0,10 zonder Henkjan. Budget blijft $10 per dag.
  6. Rapport, hooguit 6 regels: adressen gisteren per campagne, kosten per adres, leden totaal, wat er veranderde. Werklog met wie=chat-taniakross.
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

## 10. Adressen uit Mailchimp (voor maandag na 20:00)

Henkjan vroeg 20 nov: "Check in mn mail naar adressen van tania ooit uit mailchimp gehaald". Gevonden in Henkjans Gmail:
- **13 maart 2020**: twee imports in de Mailchimp-lijst (audience) "Tania Kross" op het account Adsfair BV: 1.714 adressen toegevoegd of bijgewerkt (323 stonden er al, 5 afgemeld) en 3.679 (682 stonden er al, 4 afgemeld, 3 met fouten).
- **9 november 2020**: mail van Henkjan aan zichzelf "Adressen Tania Kross" met de bijlage members_export_839147311c.zip (ongeveer 1,2 MB): de export van die lijst.
- **11 december 2018**: thread "export mailchimp" (met Culdy en de Mannen) met bijlage members_export_a1d14e592d.zip, de fanlijst van toen.
- **7 oktober 2024**: Tania vroeg Henkjan Sherry-Ann toegang te geven tot zijn Mailchimp-account; Henkjan deed dat. Het account bestaat dus waarschijnlijk nog, met de nieuwste stand.
- Niets gedownload, niets geïmporteerd, niets verstuurd. Henkjan wil dit maandag na 20:00 doen.
- Voorstel (nog niet besloten): de adressen niet stil op de lijst zetten (aanmelding van jaren geleden, deels via import), maar één mail waarin ze zelf bevestigen ("Wil je de podcast van Tania blijven krijgen?"); alleen wie klikt komt op de lijst. Tekst eerst door Henkjan en Tania laten goedkeuren. Versturen via Resend in batches, met afmeldlink, eerst een kleine proef. Dit is in één keer genoeg voor het doel van 1.000.
- Eerste stap maandag: vragen of je de zip mag downloaden om alleen te tellen (hoeveel actief, afgemeld, weggevallen), of dat Henkjan inlogt op Mailchimp voor de actuele stand.

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

## Logboek (nieuwste boven)

- 24 nov 11:30 UTC chat-taniakross: les uit 20-24 nov: Clickmind-wit zones gaven 27 van 32 adressen voor $0,02 per adres. BEWEZEN 12183102 (53 zones, 8 advertenties, $0,05) gestart; VERKENNER 12168319 zonder die zones en zonder de 2 slechtste advertenties; dagelijkse leerronde gepland. Lijst 51 leden.

- 20 nov 15:15 UTC chat-taniakross: overdracht geschreven. Podcastmail gaat niet meer vanzelf (alleen na Nu versturen), adressen naar Vercel-variabelen, uitrol dpl_F1Z7GzbzA1d8qiHsgaTgvNK4aqLC live. Mailchimp-exports gevonden. Uurstand gestopt tot maandag 20:00 Curaçao.
- 20 nov chat-taniakross: welkomstmail met cadeau (Barcelona, verrassing, aflevering), wissel tk-mail, venster lerend; campagne 12168319 op CPA $0,03 per adres; /podium-klassiek, mezzo-aria's, sitemap en llms.txt live.
