# OVERDRACHT CONTENT EN DISTRIBUTIE

Actueel 28 november: dagelijks content/video en verkeer onder KDP op hnkjn.me; zie de nieuwe sectie onderaan en het gedeelde dagritme op codex/content-dagboek. Bestaande eerst-zien-regels en Kadoly-boekpinstop blijven gelden.

Voor het Claude-account dat Henkjan (Henkjan 23 nov 2026: "Ik ga een account helemaal reserveren voor content en distributie") alleen inzet voor content en distributie: stockingbooks.com, lastingchange.works, Pinterest, de dagelijkse artikelen en de leerlus op organisch verkeer.

Live te lezen, met de stand van vandaag eronder: https://hjdk-api-henq.vercel.app/api/bs?op=content (lees met de Vercel-tool web_fetch_vercel_url; ?format=md voor alleen dit document).
Bron: OVERDRACHT-CONTENT.md in de repo henkjandekrijger-glitch/hjdk-api. Werk dit bestand bij in dezelfde commit als elke wijziging aan hoe het werkt, met een regel in het logboek onderaan (nieuwste bovenaan).

## 1. Doel en de ene maat

Doel: zoveel mogelijk organisch verkeer uit de VS (Google, Bing, ChatGPT, Perplexity, Gemini, Pinterest) dat koopt. Kerst 2026 is de piek. Henkjan wil hier "minimaal 30x beter" scoren dan nu.

De ene maat is verkoop: kliks naar Amazon (Stocking Books) en verkochte Lasting Change-PDF's of paperbacks. Bezoek telt alleen als het naar verkoop leidt.

Vraag naar onderwerpen komt uit Demand Radar. Er komt nooit een pagina zonder gemeten zoekvraag.

## 2. Vaste regels van Henkjan (altijd)

- Praat Nederlands met hem, kort. Elke status is simpel: vooruitgang of niet, geen stapels getallen. Toon nooit nullen of nulgroei; laat de regel dan weg.
- Alles wat je maakt laat je eerst zien met een klikbare link, voordat het live gaat ("Ik wil eerst zien voor live gaat"). Bij artikelen eerst het idee, dan het stuk.
- Siteteksten schrijf je zelf met je eigen tokens, nooit via de Vercel AI Gateway.
- Ontwerp: de stijl van sealedintent.com. Zwart-wit, nooit grijs, één maat voor de broodtekst, titels naar verhouding groter. Boeken altijd met omslag (dat is de kleur op de pagina). Nieuws- en artikelblokken met een echte foto; een tekening alleen als er geen foto te vinden is.
- Posts op sociale media maak je voor het medium en lerend per medium, nooit "zomaar een tekstje".
- Telegram naar Henkjan: hoogstens 1 bericht per uur. Alles draait in de cloud, nooit afhankelijk van zijn computer.
- Kosten:
  - één push naar main per afgeronde taak, want elke push is een build;
  - geen nieuw bestand in api/;
  - een nieuw eindpunt wordt een op=... in een bestaand bestand in fn/.
- Demand Radar: alles samen hoogstens $1,50 per dag, en per thema hooguit één aankoop per 7 dagen. Roep betaalde eindpunten nooit in een lus aan; bij een 503 niet opnieuw proberen.
- Git:
  - eerst `git pull --rebase`;
  - commit met expliciete bestandsnamen (nooit `git add -A`);
  - nooit sleutels in code, pagina's, URL's of commits.
- Nooit vastlopen. Na een fout probeer je hooguit één keer opnieuw op dezelfde manier, daarna een andere aanpak, of je meldt het met de reden. Bouw bij alles in dezelfde stap de controle die meet of het werkt.
- Advertenties en campagnes vallen buiten dit account. Verander ze niet; meld wat je ziet.

## 3. Wat er staat

### stockingbooks.com (Stocking Books, tot 23 nov 2026 bookstuffers.com)
Henkjans eigen boekenplank: kleine cadeauboeken van KDP.
- 44 kerst- en cadeauboeken: stocking stuffers en white elephant.
- 57 andere boeken (bijbel, koken, gezond, puzzel, kleur, kennis, roman), op de site niet prominent.
- bookstuffers.com stuurt met een 308 door. Hernoemd omdat "book stuffers" in KDP-land de naam is voor oplichters die boeken volproppen (Amazon klaagde ze aan); Google noemde de site daardoor niet.

Pagina's (lib/bs.js SLUGS):
- Kerst en cadeaus:
  - / (home)
  - stocking-stuffers
  - stocking-stuffers-for-women
  - stocking-stuffers-for-men
  - stocking-stuffers-for-teens
  - white-elephant-gift-ideas
  - white-elephant-gifts-under-10
  - white-elephant-rules (met een gratis nummerkiezer)
  - secret-santa-generator (gratis, privélinks)
- Gratis printbaar:
  - free-printable-christmas-word-search (12 puzzels)
  - christmas-coloring-pages (12 eigen SVG-tekeningen)
  - christmas-jokes (50 moppen)
  - christmas-trivia (40 vragen)
- Inhoud voor de andere boeken: book-of-enoch, apocrypha
- Overig: all-books, about

Elke link naar Amazon gaat via /go/<ASIN>. Die redirect wordt geteld per boek en per bron, zonder affiliate-tag (het zijn eigen boeken, dus Henkjan verdient de royalty).

### lastingchange.works (de Lasting Change Workbook-funnel)
- Home: "Don't throw away another year". Met de datumkalender, een vergelijking (PDF $9 tegen paperback $19,99 en hardcover $59), FAQ en een vaste balk onderaan.
- how-to-stick-to-new-years-resolutions
- refund (60 dagen geld terug)
- guides (lijst van artikelen)
- Dagelijkse artikelen (kv, zie 5)
- why-it-didnt-work: de lerende coach-chat. Dit is de chat van de keuzehulpen (lib/kzchat.js, markt us, slug lc-waarom). Eerst gesprek, dan pas verkopen. Staat nog als concept tot Henkjans ok.
- PDF-verkoop via Paddle ($9). De knop staat uit tot PADDLE_API_KEY in Vercel (hjdk-api) staat. Mail aan kopers via Resend: de sleutel staat nog niet in hjdk-api.

### Pinterest
- Account kadolyshop (Kadoly), via Zernio. Zernio account-id 6afb8a5d86e8bb18f844fc95. Sinds 27 nov 2026 met schakelaar (Henkjan: geen boekpins meer op het Kadoly-account): lees vóór elke pinronde `op=pinplan`; staat daar `boekpinsUit: true`, plaats dan niets en kies geen ander account. Stand en omzetten: `/api/bs?op=pinschakel` (beschermde host). De boeken hebben nog geen eigen Pinterest-account.
- Borden (lib/bspin.js BORD): we (white elephant), sok (stocking stuffers), lc (Lasting Change), bijbel.
- 17 haken (lib/bspin.js HAKEN). Elke haak is een invalshoek met een eigen beeld van 1000x1500 (/pin/<ASIN>-<haak>.png).
- Lerend: pinPlan kiest op kliks plus 0,3 keer saves per pin, met wat toeval voor nieuwe haken.

### Demand Radar (repo demand_radar, openbaar)
- https://demandradar-ivory.vercel.app/api/zoekvraag?thema=<id>
- Thema's: bookstuffers (cadeauboeken, printables, moppen, quiz) en jaar-reset (voornemens, gewoontes, uitstel, opnieuw beginnen).
- Een nieuw thema is één regel in THEMA in api/zoekvraag.js.
- Gebruik &droog=1 om te zien wat er gekocht zou worden.

### ZICHT (vindbaarheid Google en AI)
- Site-id bookstuffers (host stockingbooks.com) en lastingchange. Manifest: stockingbooks.com/zicht.json.
- Dagelijkse meting: indexering, Search Console en of Perplexity de site noemt bij echte vragen.
- Skill: zicht-seo-llm (in de repo .claude/skills/zicht-seo-llm/SKILL.md). Draaiboek: https://keuzehulp.best/api/zicht?op=draaiboek&t=1&site=bookstuffers

## 4. Waar de code staat (repo henkjandekrijger-glitch/hjdk-api, Vercel-project hjdk-api, team henq)

- lib/bs-data.js: de boeken (ASIN, omslag, titel, soort, prijs, pagina's, voor wie, groep), LC en de puzzelwoorden. Prijzen gelezen op PRIJS_DATUM.
- lib/bs.js:
  - de pagina's, CSS, keuring (keur), sitemap, llms.txt, zicht.json en OVERDRACHT;
  - BIJGEWERKT alleen ophogen bij een echte inhoudswijziging (eerlijke lastmod);
  - NIEUW plus kv bs:live: nieuwe pagina's eerst als concept.
- lib/bsxmas.js: moppen, quizvragen (alleen vaststaande feiten) en kleurplaten (eigen SVG).
- lib/lcfunnel.js: de LC-pagina's, Paddle-controle, getekende downloadlinks, de mail en de artikelkeuring (checkArtikel: minimaal 600 woorden, 3 secties, 3 vragen, geen gedachtestreepjes).
- lib/lcwaarom.js: de coach-chatpagina en de kennis voor de chat (chatItems).
- lib/bspin.js: Pinterest-borden, haken en het plan.
- lib/bsmeet.js: het meetscript op elke pagina. Het bepaalt de bron uit de referrer (google, bing, chatgpt, perplexity, gemini, copilot, pinterest, social, mail, betaald, direct) en zet s=<bron> op elke /go-link.
- lib/bsorganisch.js: dagcijfers en het Telegram-rapport.
- fn/bs.js: het eindpunt (alle op=...; de LC-site via de host lastingchange.works of ?site=lc).
- vercel.json:
  - host-rewrites voor stockingbooks.com en lastingchange.works;
  - redirect bookstuffers.com;
  - cron /api/bs?op=dagrapport om 12:13 UTC.
- test/bookstuffers.test.mjs: `node --test test/bookstuffers.test.mjs` moet slagen voor elke push.

Voorbeeld op de beschermde host: /api/bs?p=<slug> (Stocking Books) en /api/bs?site=lc&p=<slug> (Lasting Change). Altijd noindex.

## 5. Eindpunten (lees met web_fetch_vercel_url op https://hjdk-api-henq.vercel.app)

Stocking Books:
- /api/bs?op=gezond&omslagen=1: elke pagina door de keuring, en elke omslag bestaat
- /api/bs?op=kliks: doorkliks naar Amazon per boek, 14 dagen
- /api/bs?op=overdracht: stand van de site (?format=json)
- /api/bs?op=bslive&slug=<slug>: een conceptpagina live zetten, plus een IndexNow-ping voor die URL (alleen na Henkjans ok)
- /api/bs?op=indexnow: alle pagina's één keer per versie. Draait ook vanzelf in de dagelijkse cron.

Lasting Change:
- /api/bs?site=lc&op=gezond: pdfKnop, pdfBestand, mail
- /api/bs?site=lc&op=verkoop: verkochte PDF's per dag
- /api/bs?site=lc&op=lcartikelen: alle artikelen met status (concept of live) en de modus
- /api/bs?site=lc&op=lcartikel&z=<deflateRaw base64url JSON>: een artikel opslaan, als concept in modus eerst-zien
- /api/bs?site=lc&op=lclive&slug=<slug>: een artikel live zetten (na Henkjans ok)
- /api/bs?site=lc&op=lcmodus&m=direct|eerst-zien
- /api/bs?site=lc&op=lcwaaromlive: de coach-chatpagina live zetten (na ok)
- Chat testen: /api/keuze-tools?tool=intentie&op=chat&site=us&slug=lc-waarom&v=<vraag>

Pinterest:
- /api/bs?op=pinplan: welke haken vandaag
- /api/bs?op=pinbeeld&a=<ASIN>&h=<haak>: het beeld
- /api/bs?op=pinlog: een geplaatste pin melden
- /api/bs?op=pinuitkomst: kliks en saves per pin terugmelden
- /api/bs?op=pinstand: de stand per haak

Rapport:
- /api/bs?op=dagrapport&droog=1: het Telegram-rapport van vandaag als tekst, zonder te versturen

## 6. Wat er elke dag vanzelf draait

- 12:13 UTC (08:13 Curaçao), Vercel-cron /api/bs?op=dagrapport, onafhankelijk van welk account dan ook:
  - één Telegram-bericht met organisch bezoek per site en bron, kliks naar Amazon (ook per bron), LC-verkopen, pins, ZICHT (vertoningen, kliks, geïndexeerd), nieuwe LC-artikelen en concepten met een bekijk- en live-zet-link, en de lekregel;
  - daarna een IndexNow-ping als de versie veranderd is.
- 19:37 UTC (15:37 Curaçao): nieuwe ChatGPT-taak 'Boeken: Pinterest en leerlus', actief vanaf 23 nov. Maakt een conceptbatch volgens pinPlan en de leerlus; publiceert uitsluitend na expliciet akkoord op die batch. De oude taak trig_01Mh5ZacGxcLhJDZRbiQiyCV is vanuit dit account niet bereikbaar en kon niet worden uitgezet.
- 03:41 UTC (23:41 Curaçao op de vorige kalenderdag): nieuwe ChatGPT-taak 'Lasting Change: artikel en leerlus', actief vanaf 23 nov. Eerst het idee tonen, na akkoord schrijven en als concept bewaren; nooit automatisch live. De oude taak trig_01EAQTfpmjosnYXwm9dNzrJB is vanuit dit account niet bereikbaar en kon niet worden uitgezet. Eén LC-artikel. Onderwerpen in deze volgorde: procrastination, start over, I wasted another year, get your life together, habit formation, self improvement books. Daarna de grootste vraag uit Demand Radar jaar-reset. Het komt als concept in het rapport.
- Migratie nog niet volledig: de twee nieuwe taken zijn bevestigd actief. Zet de oude twee uit vanuit het oorspronkelijke account; de huidige tools vinden ze niet. Claim geen voltooide migratie tot dit bevestigd is.

## 7. De leerlus: elke dag meten, het grootste lek eerst

### Meetcorrectie goedgekeurd op 23 nov 2026
Het rapport van 23 nov over 22 nov bevat 7 geregistreerde pagina-openingen op Stocking Books, 13 op Lasting Change en 208 ruwe Amazonredirects. Dit zijn verschillende metingen, geen unieke personen of bewezen verkopen. De hoofdknoppen voor de LC-paperback omzeilen de /go-meting; alleen onder meer omslag en vaste balk gebruiken hem. Deze versie herstelt die hoofdknoppen, splitst Amazonverzoeken per site, noemt hun ruwe aard, en verwijdert het ongeldige percentage dat verzoeken van beide sites door alleen Stocking Books-openingen deelt. Zonder koppeling per pagina en klik blijft de inhoudelijke conversie onbekend.

Controle bij akkoord: paperbackknoppen op home, gidsen en artikel gebruiken /go met site lc en bron; de test dekt PDF aan/uit en het beschermde voorbeeld. Geen menselijke unieke conversie of verkoop afleiden uit deze route alleen. Binnen 24 uur na live controle van bron- en siteverdeling, daarna dagelijks. Volgende stap is koppeling van klik aan pagina/browseractie; pas daarna inhoudsproef met controlegroep en oordeel na 14 tot 21 dagen. Geen betaalinstellingen, advertenties of campagnes aangepast.


Meet elke dag in deze volgorde. Het rapport geeft het meeste; vul aan met de eindpunten.

1. Bereik: vertoningen en kliks per pagina in Search Console (ZICHT), geïndexeerde pagina's, Pinterest-weergaven, kliks en saves, en AI-vermeldingen.
2. Bezoek per bron en per pagina: kv bs:tel:<dag>, velden site|bron en site|p|pad.
3. Doorklik naar Amazon per pagina, boek en bron (bs:klik:<dag>, bs:gosrc:<dag>), en voor LC: kliks naar de koopknop en verkoop.
4. Verkoop: LC-PDF (lc:verkoop) en Amazon (KDP-rapport; die stand staat in de KDP-overdracht, /api/wtb?op=kdpoverdracht).

Waar je optimaliseert. Elke dag één lek, het grootste eerst, met een getal erbij:
- Niet geïndexeerd: pagina's ontbreken in Google. Interne links vanaf verse pagina's, IndexNow, en de sitemap met eerlijke lastmod.
- Vertoningen zonder kliks (CTR onder 2% bij plek 1 tot 10): betere titel en description, met de zoekterm voorop en één concreet getal. Meld dat als ZICHT-proef.
- Zoekvragen op plek 4 tot 15: geef op die pagina een echt antwoord op precies die vraag (FAQ of een sectie), met feiten.
- Bezoek zonder doorklik: 30 of meer bezoeken en minder dan 5% doorklik naar Amazon is een lek. Zet de boekkeuze hoger op de pagina en het beste boek bovenaan. Meet het via Clickmind-modal (site bookstuffers).
- Pins met veel weergaven en weinig kliks: een andere haak of beeld. Haken met kliks krijgen meer pins (dat doet pinPlan zelf).
- LC: bezoek zonder klik op de koopknop. Kijk naar de chat (doorpraten, waar het gesprek stopt: /api/keuze-tools?tool=intentie&op=chatstand) en naar de eerste schermhoogte van de home.
- Nieuwe pagina's alleen bij gemeten vraag uit Demand Radar zonder eigen pagina. Lees de maandreeks (piek of vaste vraag) en meld de pagina als proef in zicht.json (zichtJson in lib/bs.js).

Elke wijziging is een proef met een controle. Na 14 tot 21 dagen beoordeelt ZICHT hem zelf. Wat je leert zet je als les in zicht.json en in dit document.

## 7b. Strategie: wat stapelt en wat niet (onderzoek 23 nov 2026)

Henkjan 23 nov 2026: "geef me aan hoe anderen werken met compounding inzet van LLM om distributie te verzorgen en compounding te verdienen". De kern: gebruik AI om iets te maken dat anderen niet hebben (eigen cijfers, gratis tools). Verspreid dat via kanalen die zichzelf blijven voeden. Massa maken werkt niet meer.

Wat niet meer werkt:
- Massa dunne pagina's. De update van Google van maart 2026 tegen massaal gemaakte inhoud kostte zulke sites 50 tot 80% van hun verkeer (madx.digital, digitalapplied.com).
- Van 220 sites op AI-contentplatforms verloor 54% minstens 30% van het piekverkeer en 22% minstens 75% (Lily Ray, Search Engine Journal).
- Dus geen pagina per zoekvariant, en nieuwe pagina's alleen bij gemeten vraag (Demand Radar) met eigen inhoud.

Zeven patronen die stapelen, met bewijs:
1. Eigen cijfers. Primair onderzoek krijgt per pagina 3,3 keer zoveel AI-vermeldingen, vooral als het een benchmark is (Search Engine Land, Gauge-data). Sites met eigen data werden 22% zichtbaarder terwijl massasites vielen.
2. Gratis tools (engineering as marketing). Ze blijven verkeer en links trekken ("marketing assets with ongoing returns", Dharmesh Shah, HubSpot).
3. Op lijstjes van anderen staan. 43,8% van de pagina's die ChatGPT citeert zijn "best X"-lijsten, en merken die hoog op meerdere lijsten staan worden vaker aanbevolen (Ahrefs, 26.283 bronnen). Merken worden 6,5 keer vaker via andere sites genoemd dan via hun eigen site (AirOps). Vermeldingen op YouTube hangen bij ChatGPT het sterkst samen met zichtbaarheid (Ahrefs, 75.000 merken).
4. Bewijs op de pagina. Citaten gaven +41%, statistieken +31% en bronnen +28% zichtbaarheid in AI-antwoorden; zoekwoorden volproppen gaf −8% (GEO-studie Princeton, KDD 2024).
5. Vers houden. Wat AI citeert is 25,7% verser dan de organische resultaten van Google (Ahrefs, 17 miljoen citaties). Bijgewerkte pagina's kregen gemiddeld +4,5% Google-bezoek en deden het beter dan vergelijkbare pagina's zonder update (Raptive, 103.000 pagina's). Seizoenspagina's werk je bij vóór de piek.
6. Pinterest als bezit. Meer dan 60% van de saves komt van pins die ouder zijn dan een jaar (Tailwind). Plan vroeg voor seizoenspieken (kerst, nieuwjaar).
7. Eigen publiek. Een e-maillijst met doorverwijzen: makers die elkaar aanbevelen groeien 2 keer zo snel (Kit). Doorverwijzen versnelt groei, maar schept die niet uit het niets.

AI-verkeer: Adobe zag het in maart 2026 42% beter converteren dan ander verkeer. Een studie onder 973 webshops zag ChatGPT-verkeer juist slechter converteren dan Google. Meet het dus per bron; het dagrapport doet dat al. Het aandeel van Reddit in AI-citaties schommelt sterk (bij ChatGPT van ongeveer 60% naar 10% in zes weken eind 2025). Bouw daar niet op; alleen echte, eerlijke antwoorden.

De lus van dit account:
Demand Radar (vraag) → pagina met eigen cijfers of een gratis tool → ZICHT meet → bijwerken vóór de piek → Pinterest en vermeldingen op andere sites → e-mailadressen → wat gebruikers invoeren wordt nieuwe eigen cijfers → AI noemt je.

Werkvolgorde, op opbrengst:
1. Eigen cijfers uit wat er al is:
   - De LC-coach-chat (waarom het mensen niet lukte) wordt een jaarlijkse benchmark: "Why resolutions fail: what N people told us". Pas vanaf genoeg gesprekken, en nooit met nullen.
   - Uit de Secret Santa-generator: gemiddeld budget en groepsgrootte, anoniem en alleen tellingen.
   - Uit Demand Radar: "de meest gezochte stocking stuffers, gemeten".
2. Meer gratis tools in plaats van meer artikelen. Het model zijn de Secret Santa-generator, de kleurplaten, de quiz en de woordzoekers. Een volgende kan een printbare 30-dagenkaart voor gewoontes worden, met een link naar het werkboek.
3. Vermeldingen buiten de eigen site:
   - Stocking Books in cadeaugidsen van anderen ("best stocking stuffers under $10");
   - Lasting Change in lijsten met de beste habit-werkboeken;
   - korte YouTube-video's van de kleurplaten en de quiz;
   - outreach eerst als concept aan Henkjan, via de skill mail-lerend.
4. Bijwerkritme: elke seizoenspagina 4 tot 6 weken vóór de piek, met nieuwe cijfers en een eerlijke datum (kerst in oktober, voornemens in november).
5. E-mail vastleggen:
   - LC: de modal met dagelijkse tips;
   - Stocking Books: "stuur me de kleurplaten van volgend jaar".

Altijd via Resend, en elke mail eerst langs mail-lerend.

Bronnen: arxiv.org/abs/2311.09735 (GEO), ahrefs.com/blog/best-lists-research, ahrefs.com/blog/fresh-content, airops.com/research/the-influence-of-offsite-signals-in-ai-search, searchengineland.com/why-most-original-data-never-gets-cited-481676, raptive.com/blog/refresh-analysis-and-google-traffic-growth, searchenginejournal.com/it-works-until-it-doesnt-ai-content-strategies-that-backfire/574820, tailwindapp.com/blog/pinterest-seo-in-2025, kit.com/features/creator-network, digitalapplied.com/blog/ai-traffic-converts-42-percent-better-2026-channel-strategy, searchengineland.com/llms-google-referral-conversion-study-463747.

### Amazonknoppen, goedgekeurd 23 november
De boekkaarten krijgen een zichtbare zwarte 'View on Amazon'-knop met pijl; op Lasting Change gebruikt de paperbackknop dezelfde gedeelde stijl. Op mobiel is de knop volledig breed. De kaart blijft één link, zonder geneste knoppen of extra tussenpagina. Nieuwe artikelen en boekblokken nemen dit automatisch over. Een beschikbare PDF houdt zijn eigen primaire koopknop; Amazon wordt dan een stevige omlijnde tweede optie. De bestaande vaste balk op de LC-home blijft behouden. Status: Henkjan keurde de getoonde preview op 23 november expliciet goed voor publicatie.

Controle: 17 bestaande pagina- en rapporttests geslaagd, desktop visueel gecontroleerd; mobiele CSS en rendering nagekeken zonder volledige mobiele screenshotcontrole; URL's en ASIN's blijven dezelfde /go-meetroute gebruiken. De CTR blijft onbekend zolang de koppeling tussen pagina en klik ontbreekt. Na akkoord eerst de werking controleren en daarna met vergelijkbare meetgegevens volgen; geen vroege winnaar of publiek klikbewijs uit ruwe redirects.

## 8. Lopende proeven

- bs-kerst-gratis-1123 (gsc, 21 dagen): christmas-jokes, christmas-trivia en christmas-coloring-pages, tegen de controle free-printable-christmas-word-search en white-elephant-rules.
- Clickmind-modal op Stocking Books: 5 armen plus een controle, zwarte stijl. Klikken gaan via /go zodat ze geteld worden.
- LC-chat: proef van de keuzehulpchat (start, pillflow, stijl) via de keuzehulp-proef (kzux*).

## 9. Open punten (wat alleen Henkjan kan, of wacht op zijn ok)

- PADDLE_API_KEY in Vercel (hjdk-api). Dan gaat de PDF-knop van $9 vanzelf aan.
- De Resend-sleutel voor hjdk-api: kopers krijgen de downloadlink anders niet per mail. Kijk eerst of de LC-sleutel uit het oude project hergebruikt mag worden.
- Google Search Console voor stockingbooks.com (TXT-record gezet op 23 nov) en lastingchange.works. Voeg daarna het serviceaccount seo-leerlus@hjdk-seo.iam.gserviceaccount.com toe als gebruiker, zodat ZICHT kan meten.
- De coach-chatpagina op lastingchange.works live zetten (na ok).
- LC-pins op het bord lc. Een aparte modal voor dagelijkse tips op LC ("maar eerst even de rest").
- KDP-listings herschrijven (titels en beschrijvingen op zoekvraag) als concept. Henkjan klikt zelf op Publish.
- IndexNow voor lastingchange.works (er is nog geen sleutelroute).

## 10. Starten in het nieuwe account

Plak dit als eerste bericht:

"Lees eerst de overdracht content en distributie: https://hjdk-api-henq.vercel.app/api/bs?op=content (Vercel-tool web_fetch_vercel_url) en de repo henkjandekrijger-glitch/hjdk-api (OVERDRACHT-CONTENT.md, CLAUDE.md). Jij doet vanaf nu alleen content en distributie voor stockingbooks.com, lastingchange.works en Pinterest, met de dagelijkse leerlus uit hoofdstuk 7 en de strategie uit hoofdstuk 7b. Maak de twee geplande taken uit hoofdstuk 6 opnieuw aan in dit account. Begin met het grootste lek uit het rapport van vandaag en laat me alles eerst zien voor het live gaat."

## Logboek (nieuwste bovenaan)

- 2026-11-27, oppakker taak 4qiye9 (Henkjan 27 nov, 'voer alles door': geen Engelse boekpins meer op het Kadoly-Pinterestaccount): schakelaar voor de boekenpinronde. `/api/bs?op=pinschakel&uit=1` (beschermde host) zet kv bs:pinuit; dan geeft `op=pinplan` een lege lijst met `boekpinsUit: true` en een reden. `uit=0` zet het terug, zonder `uit=` lees je alleen de stand. De ronde die pint (externe taak die `op=pinplan` leest): staat `boekpinsUit` op true, plaats dan niets op Pinterest en kies geen ander account; de boeken hebben geen eigen Pinterest-account tot Henkjan er een koppelt (dan `ACCOUNT` en `BORD` in lib/bspin.js aanpassen en de schakelaar terugzetten). Stand sinds 22 nov: 26 boekpins, 4 uitgaande kliks, 12 saves, 95 vertoningen. Lijst voor Henkjans ja op weghalen: `/api/bs?op=pinlijst`; er is niets verwijderd.

- 2026-11-23, content-Codex: Henkjan geeft met 'yes' akkoord op de getoonde Amazonknoppen. Uitrol van precies die versie via PR #11; code en bestaande /go-meting blijven gelijk aan de gecontroleerde preview. Productie en beide gezondheidscontroles worden na uitrol gecontroleerd; geen gemeten klik- of verkoopwinst geclaimd.

- 2026-11-23, content-Codex: op Henkjans verduidelijking 'Amazonknoppen prominenter' een visueel voorstel gemaakt. Gedeelde zwarte Amazonknop met pijl, minimumhoogte 56px, volle breedte op mobiel en een expliciete knop op iedere boekkaart. Dezelfde stijl werkt automatisch door in nieuwe boekblokken en LC-artikelen; PDF-knop en /go-meetroute blijven behouden. Geen klikvolumes als publiek bewijs getoond. Dit is een ontwerpwijziging, geen bewezen klik- of verkoopwinst. Eerst preview, nog niet op main/live.

- 2026-11-23, content-Codex: Henkjan geeft akkoord om door te werken. Meetcorrectie klaar voor uitrol: alle 14 bestaande/uitgebreide paginatests en 3 rapporttests slagen, inclusief LC-chat. Offline is alleen het ongebruikte Redis-clientimport vervangen door een blokkade die faalt bij aanroep; echte rendercode en rapportlogica getest. Productiecontrole volgt na deploy. Artikel blijft concept; bronverwijzingen en eigen startplan worden als verbeterde versie eerst getoond.

- 2026-11-23, content-Codex: twee taken opnieuw aangemaakt met eerst-zien en de dagelijkse leerlus. Oude taken niet bereikbaar, dus uitzetten nog open. Meetlek onderzocht: LC-hoofdknoppen buiten /go en gemengde Amazonteller; correctie met regressiecontroles op aparte reviewbranch voorbereid, niet op main gezet. Bestaand artikel how-to-stop-procrastinating blijft concept. PDF en kopersmail blijven geblokkeerd door ontbrekende instellingen.

- 2026-11-23: hoofdstuk 7b Strategie toegevoegd (onderzoek naar wat stapelt met AI: eigen cijfers, gratis tools, lijstjes van anderen, verversen, Pinterest, eigen publiek), met een werkvolgorde voor dit account.
- 2026-11-23: overdracht geschreven voor het content-account. Bookstuffers heet Stocking Books (stockingbooks.com). Kerstmoppen, kerstquiz en kleurplaten zijn live. IndexNow loopt mee in de dagelijkse cron. Het LC-artikel begint met procrastination.


## 26 november 2026: reparatie publicatiekeuze ter beoordeling
Henkjan vraagt slimmer te werken na uitblijvende verkeersgroei. Concreet lek: vier25novpost-ID's gebruiken drie ASIN's die22nov al geregistreerdwaren; één ASIN tweemaal op25nov. De planner filterde maar twee dagen, viel bij lege kandidaten terug op een uitgesloten boek en kon dezelfde ASIN via verschillende haken kiezen.
Voorstelbranch codex/books-cooldown-20261126: pinPlan gebruikt het volledige geregistreerde boeklog met14dagenvenster op ASIN, kiest elke ASIN eenmaal per batch en slaat haken zonder toegestane kandidaat over. Exact14dagen oud is weer beschikbaar. Ongeldige/toekomstige registratietijden blokkeren tot controle. Bestaande gisteren-aanroepers blijven ondersteund. op=pinplan gebruikt alleboeklogregels; ontbrekend/onleesbaar/ongeldig log geeft503 in plaats van kandidaten op basis van onbekende historie. Reactie noemt dat dit geen volledige providerplanning of reservering is. pinlog blijft echte gebeurde plaatsingen registreren, ook bij overtreding; historie niet wegdrukken.
Scope: bekende boekregistraties en één planbatch. Geen atomaire reservering tussen gelijktijdige aanvragen, directe Zernio-providercontrole of blokkade op publishers die het plan omzeilen. Vóór publicatie blijven accountgezondheid, geplande én geplaatste pins, exacte contentgoedkeuring en bord/URL vereist. Kandidaten zijn geen publicatietoestemming. Bestaande pins/planningen niet gewijzigd.
Validatie:26tests geslaagd (12planner/route-regressies en14bestaande paginacontroles), fn/bs.js syntaxischeck. OfflineRedisloader blokkeert echteRedisverbinding bij rendering; geen liveKV/Zernio-integratietest. Deterministische simulatie met22registraties en8gevraagde kandidaten: oudeplanner7recente-ASINkeuzes inclusief herhaaldeASIN; nieuweplanner4geschikte uniekeASIN's, geenrecente-ASINkeuze. Werkingstoets, geen verkeer/verkoop.
Lokale bronmap heeft geen gitmetadata; git pull --rebase gaf niet-een-git-repository. Daarom exacte remote main-ref8162101f66994fb340fdd83510e9b9c64ed4549a en bronblobs gelezen vóór branchopbouw. Alleen reviewbranch, geen main-update of productie-uitrol zonder precies akkoord. Per-pinmeetvoorstel en liveartikelbeschermingPR13 blijven apart.


### Uitrolakkoord26nov2026
Henkjan: 'Ja akkoord .' op precies PR15. Deze commit voert die geteste reparatie uit;26tests slagen ook tegen de huidige main-afhankelijkheden. De bescherming geldt voor bekende boekregistraties en één batch; providerplanning en gelijktijdige reserveringen blijven buiten scope. Productiecontrole volgt na deploy en wordt in het centrale werklog en codex/content-dagboek vastgelegd. Geen nieuwe pin/artikel/CTA/affiliatepublicatie aan dit akkoord toevoegen.


## 27 november 2026: bronrapport als eerste stap van het 10x-weekplan
Henkjan vraagt een plan voor 10x verkeer komende vrijdag en uitvoering. Deadline 4 december 2026. Werkdoel: 160 geregistreerde pagina-openingen op die UTC-dag, tegenover 16 op 26 november (14 Stocking Books en 2 Lasting Change). Geen unieke bezoekers; organische bronnen apart. Het doel is ambitie en geen voorspelling. Langetermijn-Noordster en ontbrekende organische zevendaagse baseline blijven apart.
Uitvoering van eerder getoonde PR16: beschermd op=dagrapport&droog=1&vorm=json geeft de laatste gesloten UTC-dag en vorige dag met bron- en publieke paginatellingen, expliciete meetdefinities en null bij ontbrekende of ongeldige gegevens. Geen Telegram, providerverzoek, IndexNow of schrijfactie vanuit deze JSON-tak. Ruwe Amazonverzoeken blijven afzonderlijk. Geen unieke mensen, conversie, verkoopattributie of per-pinlandingen afleiden. Bestaande tekstcron blijft intact. 22 gerichte tests en syntaxiscontrole slagen; livecontrole volgt na deploy. Huidige main-codeblobs zijn identiek aan de geteste basis; documentconflict opgelost met behoud van de nieuwe main-notities. Git pull --rebase was niet mogelijk door ontbrekende gitmetadata; exacte remote ref en blobs gelezen.
Het volledige uitvoerplan en dagelijkse waarnemingen staan op codex/content-dagboek; centraal projectdashboard content is bijgewerkt. Nieuwe ongeziene openbare content blijft eerst-zien, bestaande publicaties niet opnieuw plaatsen. Geen advertenties, outreach of betaalde calls.


## 28 november 2026: meetbare content onder KDP en Lasting Change-video

Henkjan vraagt: verkeer meetbaar maken, dagelijks nieuwe content met Clickmind, en Lasting Change op YouTube met dagelijks een goede Short en alleen langer bij onderbouwde potentie. De bestaande drie contenttaken zijn bijgewerkt, niet gedupliceerd: 09:15 verkeer, 15:37 video/distributie, 23:41 artikel (America/Curacao). Stand en uitvoering komen onder project kdp op hnkjn.me, terwijl alle bestaande content-paspoorten en dagrecords behouden blijven. Financiële KDP-doelen, bestaande winsttaken en advertenties blijven apart.

Gedeelde werkwijze: content/dagrapport/KDP-DAGELIJKSE-CONTENT.md op branch codex/content-dagboek. Clickmind-briefing vóór ieder stuk, Videomind vóór iedere video; iedere nieuwe versie noemt de toegepaste eerdere les en één toetsbare verbetering. Dagelijks teruglezen, video na 48 uur en 7 dagen; inhoud na 14 tot 21 dagen en voldoende data. Geen prestatiegarantie voor ieder volgend stuk. Nieuwe ongeziene teksten en video's blijven eerst-zien; precies goedgekeurde inhoud uitvoeren. De Kadoly-stop voor Engelse boekpins blijft gelden.

De getoonde meetreparatie van branch claude/boeken-clickmind-meetbaar is op deze opdracht naar actuele main overgenomen: beide boekdomeinen als eigen kortelinkdoel, kruiscontrole tussen mail- en postcodes en onbekende kliks niet meer als kunstmatige nul. Bestaande pinbestemmingen, modal, mailverzending en betaalstatus niet gewijzigd. Tests tegen een geïsoleerde lokale Redis en bestaande Zernio-regressies slagen; productiecontrole wordt pas na uitrol in het centrale werklog vastgelegd. Korte-routeverzoeken zijn geen bewezen unieke menselijke landingen.

Kanaalaanmaak Lasting Change / @LastingChangeWorks: formulier klaar onder Henkjans bestaande Google-account, definitieve stap accepteert YouTube-voorwaarden en vereist apart gevraagd akkoord. Geen kanaal-ID of publicatie verzinnen. Shorts-beschrijvingen/reacties hebben geen klikbare gewone URL; meet de profielroute op kanaalniveau en nooit als zekere individuele Shortklik. Gecontroleerde bron: https://support.google.com/youtube/answer/13748639?hl=en .
