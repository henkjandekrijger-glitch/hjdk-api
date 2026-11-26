# OVERDRACHT CONTENT EN DISTRIBUTIE

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
- Account kadolyshop (Kadoly), via Zernio. Zernio account-id 6afb8a5d86e8bb18f844fc95.
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


## Actuele aanvulling 24 november 2026: leren van iedere post

Henkjan verlangt dagelijks leren van IEDERE post en blijven doorposten. De actuele uitvoeringsbron staat op branch codex/content-dagboek: WERKAFSPRAKEN.md, PUBLICATIEWACHTRIJ.json, PIN-LEERREGISTER.json en de datumplanning. De twee eerder wachtende pins zijn24nov daadwerkelijk gepubliceerd: https://www.pinterest.com/pin/271060471319715665/ en https://www.pinterest.com/pin/271060471319715692/. Het zeven-dagenartikel is ook live op https://lastingchange.works/how-to-start-over-in-life . Oudere concept- of dagruimteblokkades niet herhalen voor deze afgeronde acties.

De drie bestaande ChatGPT-taken zijn bijgewerkt met één gedeeld ritme: ochtend09:15, Pinterest15:37, artikel23:41 Curaçao. Elke echte boekpin blijft in het leerregister met vorige en nieuwe verifieerbare providerperiode, pinleeftijd, vertoningen, organische uitgaande kliks en saves afzonderlijk. Iedere pin krijgt bewijs, les of onvoldoende data, en vervolgactie. Ontbrekende data blijven onbekend. Dagelijks bijsturen, inhoudelijk oordeel na14tot21dagen met voldoende vergelijkbare data. Nieuwe ongeziene beelden en copy eerst laten zien. Geen onbeperkte volumeverhoging uit de extra24novtoestemming afleiden.

Nieuw aangetoond meetlek: lib/bsmeet.js bewaart geen utm_content, en fn/bs.js bewaart bron en pagina als afzonderlijke totalen. Geen pinlandingen uit deze marges afleiden. Eerst bestaande provider/Clickmind-data onderzoeken; zo nodig klein meetvoorstel met werkingstoets op aparte branch. Dit dagboek is geen live codewijziging of meetherstel. Morgen25nov worden conceptpreviews voorbereid voor gratis kerstkleurplaten, kerstquiz en het bestaande live weekplan; de actuele meting bepaalt de keuze.

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

- 2026-11-25 UTC, content-Codex: nieuw1294woordconcept i-wasted-another-year opgeslagen in eerst-zien; beschermdHTTP200/noindex, nietinlivegidsen/sitemap,2bestaandeartikelenlivebehouden. Eigenjaarterugblikkaart,3gecontroleerdeprimairebronnen. Radar gerelateerdevraag210/mndUS,exactjaartitelonbekend;geenambiguewastedvolumes. Gesloten24nov42/5geregistreerdeopeningen,geenorganischegroei/conversieclaim. KerstquizFAQmismatch11/5/16/8vs10vragenals exacttekstconceptbewaard. Alleendatabranch,geenpublicatie/main/build/extraTelegram.


- 2026-11-24, content-Codex: Henkjan breidt scope uit naar Instagram @kadoly.shop voor eigen boeken via bestaand Zernio-account6afb8787a26245ebf04dc7be. Drie bestaande taken aangepast met sitecontent plus eigenReelconcept, sharedKadolyplanning en kanaalspecifiekleren. Nieuwebeelden/copy blijven eerst-zien; geen publicatie of bioverandering gedaan. Morgenplan bevat storyboard/caption voor mannenboek, nog geen gerenderdeReel. LC2artikelenlive opnieuwbevestigd; dagelijkse nuttigeStockingupdate en max1LCconcept behouden.

- 2026-11-24, content-Codex: Henkjan vraagt blijven posten en maximaliseren. Bestaande Pinterest- en rapporttaak aangepast: vanaf25nov4uniekeconcepten als eerste werkvolume, geen bewezen optimum of verplicht quotum. Oude3cap niet opnieuw automatische blokkade; nieuwebeelden/copy eerst-zien, geen duplicaten. Plan aangevuld met kerstgrappen als vierde ingang. Officiële Pinterestbron: kwaliteit/relevantie gaat boven frequentie. Dagelijks per-pinleren, geen verkeerswinst uit volume afleiden.

- 2026-11-24, content-Codex: beide goedgekeurde wachtende pins Published en openbaar gecontroleerd, echte IDs gelogd. Op Henkjans vervolgvraag alle18boekpins in leerregister gezet, drie bestaande dagtaken bijgewerkt en25novconceptplan vastgelegd. Gesloten23nov: Stocking32tegen7, LC12tegen13 geregistreerdeopeningen; Pinterest1siteopening. Geen bewezen organische groeitrend. Meetgat per-pinlandingen in bestaande bron/pagecounters aangetoond; nog geen live meetreparatie. Alleen databranch, geen sitebuild.

- 2026-11-24 UTC (23 november Curaçao), artikelronde: How to Start Over in Life: A Practical 7-Day Reset Plan als beschermd concept opgeslagen en gecontroleerd, 1539 woorden, zeven dagstappen, kopieerbare invulkaart, vijf FAQ en drie primaire bronnen. Modus eerst-zien; niet in sitemap; procrastination blijft live. Preview: https://hjdk-api-henq.vercel.app/api/bs?site=lc&p=how-to-start-over-in-life&concept=1. Zoekvraag 590/mnd US uit bestaande Radar-cache. Oordeel pas 14 tot 21 dagen na eventuele goedgekeurde publicatie, GSC-kliks op exacte URL; bestaande resolutionspagina alleen richtinggevende vergelijking. Gesloten23nov:32/12 geregistreerde openingen, één Pinterestopening; geen unieke mensen/conversieclaim. Nieuwe indexcontrole24nov:17/17bekeken,1geïndexeerd; eerdere3URL-steekproef behouden. LC-provider meldt geen toegang, geen rechten gewijzigd. Volledige ronde en bronresponsen: content/dagrapport/2026-11-24-artikel.json op codex/content-dagboek. Dit is een dagboekaanvulling zonder mainpush/build of publicatie.

- 2026-11-23, content-Codex: Henkjan geeft akkoord om door te werken. Meetcorrectie klaar voor uitrol: alle 14 bestaande/uitgebreide paginatests en 3 rapporttests slagen, inclusief LC-chat. Offline is alleen het ongebruikte Redis-clientimport vervangen door een blokkade die faalt bij aanroep; echte rendercode en rapportlogica getest. Productiecontrole volgt na deploy. Artikel blijft concept; bronverwijzingen en eigen startplan worden als verbeterde versie eerst getoond.

- 2026-11-23, content-Codex: twee taken opnieuw aangemaakt met eerst-zien en de dagelijkse leerlus. Oude taken niet bereikbaar, dus uitzetten nog open. Meetlek onderzocht: LC-hoofdknoppen buiten /go en gemengde Amazonteller; correctie met regressiecontroles op aparte reviewbranch voorbereid, niet op main gezet. Bestaand artikel how-to-stop-procrastinating blijft concept. PDF en kopersmail blijven geblokkeerd door ontbrekende instellingen.

- 2026-11-23: hoofdstuk 7b Strategie toegevoegd (onderzoek naar wat stapelt met AI: eigen cijfers, gratis tools, lijstjes van anderen, verversen, Pinterest, eigen publiek), met een werkvolgorde voor dit account.
- 2026-11-23: overdracht geschreven voor het content-account. Bookstuffers heet Stocking Books (stockingbooks.com). Kerstmoppen, kerstquiz en kleurplaten zijn live. IndexNow loopt mee in de dagelijkse cron. Het LC-artikel begint met procrastination.


## 25 november2026 2026-11-25T11:18:54.501Z: expliciet live-akkoord uitgevoerd en vast ritme
I Wasted Another Year: A Fair Review and One Next Step is live sinds11:11:15UTC: https://lastingchange.works/i-wasted-another-year . Exact getoonde oorspronkelijke reviewkaartversie1294woorden, geen30dagenvariant. HTTP200, canonical,index/follow,guides/sitemap en drie liveartikelen gecontroleerd. Nooit deze slugs als nieuwe concepten opslaan. Oorspronkelijk dagrecord behouden; nieuwe waarnemingen in additions.
Concrete nieuwe codeoplossing ter inzage: https://github.com/henkjandekrijger-glitch/hjdk-api/pull/13 . Bestaande liveartikelwaarde blokkeert conceptopslag met409;21offline tests slagen, geenCAS/liveKVtest. Nietgemerged/nietlive.
Drie bestaande automations daadwerkelijk bijgewerkt, tijden09:15/15:37/23:41Curaçao behouden. Lees NOORDSTER.json: elkeoudepostdagelijks, snapshots+definitie, onbekend=null,14tot21dageneindoordeel, éénlek/variabele, primairebrononderzoek hergebruiken.30xambitie zondergeldigenulmeting enabsoluteeindwaarde/deadline:voortgangnietberekenbaar, geenverzonnenbezoekdoel.
Geslotendag24nov:42SB/5LCpaginaopeningen versus32/12op23nov;geengroeibewijsorganisch. ActueleGooglecontrole25nov11:12UTC:11van17geïndexeerd versus4van17op24nov;oude1van17cacheachterhaald,geentrafiekresultaat. Per-pinoutboundenlandingenblijvenmeetlek. Vandaagresterendvierpinpreviews,échteReelpreview,quizupdatevoorstel,metingonderzoek,goedgekeurdmateriaaluitvoeren. Geenextrasocialplaatsingindezeronde.


## Ochtendrapport 25 november 2026, waarneming 2026-11-25T13:54:45.649Z
Meetdag24novUTC: Stocking42tegen32, LC5tegen12 geregistreerde pagina-openingen; bronverkeer onbekend, geenweekgemiddelde.30ruweAmazonredirects27SB/3LC, geenconversieofsales. Index11/17 is actuele25novcache11:12UTC, niet24novtraffic. Nieuwe25novAIpanelmetingen:SB0citaties/8vragen(gewijzigdpanel,geenvergelijkbaretrend),LC0/4;zoekvragenleegzondergeldigeperiode.
Alle18pinregels met behoud van vorige snapshots aangevuld; vertoningen, organischeuitklikken en saves null wegens ontbrekende verse provideruitlezing. PluginzoekactieZernioleeg;geennieuweaccountontkoppelingofChrome/DNS/setupactieclaim. Geenpinuitkomstzonderechtecijfers,geenrepost. Compactoverzicht2026-11-25-pin-overzicht.md.
Kleinsteconcretemeetvoorstel2026-11-25-meetvoorstel.md: bestaande bsmeet/op=tel gezamentlijke site/pagina/bron/pinID-telling uitbreiden, alleen bekendeUTMIDs, geenPII, gestructureerde drogeuitlezing, geïsoleerde2pins/2sites/bot/UTCcontrole. Uitsluitendconcept;geenlivecodeofsettings. Clickmindproefstandbookstufferslevertgeenproef,geenvolledigbewijsdateldersgeenCMdatazijn. op=zichtorganischondersteuntonzesiteIDs niet,sites[]nietalsnulverkeerlezen.
Eerder25novgepubliceerdeartikelbehouden,3liveartikelen;oudePR13nietalsnieuwedagverbeteringopgevoerd. Gedeeldonderzoek25novNessLabshergebruikt,geenverkeerswinstuittemplateafgeleid. KDPrapport24novportefeuille$61,95royaltyapart,geenorganischeattributie. PDFcheckout/mailuit,nooitnulverkoopuitontbrekendedagregelafleiden. NorthStar30xnoggeenbetrouwbareorganische7dagenbaseline/eindwaarde/deadline. Hoofdles: eerstgezamenlijkepinlandingmetenvoorrangorde,geenwinnaarforceren. Inhoudstoets24novpins8tot15dec;25novartikel9tot16decmetvoldoendegegevens. Geenmainpush/build/extraTelegram/ads/verzending.


## Pinterest en Instagram,25 november2026 2026-11-25T19:45:32.046Z
Vier nieuwe complete pinconcepten gemaakt:12kerstkleurplaten,40quizvragen,50kerstmoppen en live7dagenresetplan. Elk werkelijkPNG1000x1500, bewerkbaarSVG, exacteEigenVoorbeeldinhoud, titel/beschrijving/bord/UTM/hypothese/vergelijking. Zie2026-11-25-batch.md en batch.json. Eén echte12seconden1080x1920H264boeken-Reel voor kadoly.shop met volledige caption, echte mannenboekomslag, géén fakebinnenwerk/prijs/voorraadclaim. CaptionURLnietklikbaarverondersteld;biolinkgeengoedgekeurdeboekroute,geenlink-in-bio-claim/profielwijziging. Nieuwepreviewswachtenoppreciesakkoord,oudebatchblijftPublished.
NIEUW: andere rondebookstuffers-pin meldde25nov19:40:40vierboekplaatsingen. Pinstandbevestigt4nieuweIDs:6b07397bcb651a6eadc070bb/6b073986be3f02dcc0ff44d7/6b073998b436184d7f495f0b/6b0739a3be3f02dcc0ff4563. Alle3ASINsal22novgelogd;dadASINB0DK3CSYXWtweemaalvandaag. Geenplaatsingenvanonzeronde. Registernu22regels,18oudesnapshotsbehouden,4nieuwemetonzekerheden. Andere ronde rapporteert9metingenviaZernio;partiëlesignalen Enoch2kliks5imp,Apocrypha1klik5imp,Dad1klik7imp,elksave1. Klikdefinitie/vensterontbreken:gerapporteerdsignaal,nietbewezenorganischeuitklikkenofwinnaar;geenpinuitkomstdooronzeronde. Eigen-saveverklaringonbewezen.
Grootsteconcretelek:pinPlanfiltertalleengisteren enkiestbijlegekandidatenalsnogeersteuitgeslotenboek. Voorstel(geenlivecode):gedeelde14dagenASINcontrole,geenfallbackuitgeslotenproducten,ASINhoogstens1keerperbatch,echteproviderqueue/previewakkoordvóórplaatsing. Ditstaatterbeoordelinginbatchpreview;andereworkflowsnietgewijzigd. CloudZernioconnectorzoekactieopnieuwleeg;geenaccountontkoppelinggeclaimd,geenTinyFishoflokalecomputergebruikt. Providerhealth/planningnogonbekend;repo3Kadolyreserveringenzijngeenvollediglivebeeld.
Geslotendag24novnog42SB/5LCopeningenvs32/12,geenbetrouwbarebron/organischegroeiclaim,30ruweAmazonredirectsgeenverkoop.3LCartikelenbehouden,Pdf/mailuit. NessLabs25novonderzoekhergebruikt,nietalsnieuweresearchofvoorspeldewinstopgevoerd. Nieuweconceptenpas14tot21dagennaechtegoedgekeurdepublicatiebeoordelenmetvoldoendevergelijkbaredata. Geenmain/sitecode/build/ads/Telegram/outreach/pinlogdooronzeronde.


## Artikelronde 25 november laat Curaçao, 26 november UTC
Waarneming 2026-11-26T03:41:38.996Z. Laatste gesloten UTC-dag25nov: Stocking Books13pagina-openingen tegenover42op24nov; Lasting Change3tegenover5. Geen unieke mensen of bewezen organischebronverdeling.23ruweAmazonredirects, geen conversie of verkoop. InternePinterestcache4kliks/9saves heeft geen bewezen gelijke dagperiode of organischeoutbounddefinitie.22pinregels met vorige snapshots behouden en aangevuld; geen winnaar of nieuwe pinuitkomst.
Nieuw concept: How to Get Your Life Together: A Life Admin Checklist. Radarjaar-resetUScache23nov: how to get your life together720/maand, reeks[880,590,590,590,590,590,720,720,590,720,720,880]; smallerechecklistvraag70/maand apart, nooit optellen. Roblox/codes en Bonhoeffer uitgesloten. Geen nieuwe betaaldecall,0.1isoudcachebedrag.
Eigen1430woorden,8secties,5echtevragen en7regelsinvulkaart voor actueleverplichtingen/deadlines/volgendeactie/wachten. Onderscheidt zich van live7dagenkeuzeplan en jaarterugblik. Exact checkArtikel geenfouten. Vóórsaveeerst-zien en slugvrij gecontroleerd; savestatusconcept. BeschermdepreviewHTTP200/noindex,nietinsitemapoflivegidsen,3liveartikelenbehouden: https://hjdk-api-henq.vercel.app/api/bs?site=lc&p=how-to-get-your-life-together&concept=1
Twee volledige primairepapers gelezen:Masicampo/Baumeister2011(18paginas,experimenteleplannen)enHarkin2016(32paginas,138studies). PubMedextractieswarenonvolledig,daaromvolledigeprimairePDFs;geensterkereclaimsdanbron. Volledigechecklistisredactioneelenongetest. GedeeldNessLabs25novmakeronderzoekhergebruikt,nietalsnieuwecasusofverkeersvoorspellinggemeld.
Hypothese: concrete gratis life-admin-kaart beantwoordt een gemeten eigen nog onbeantwoorde checklistvraag. PrimairGSCkliksnaarexacteURLzodrageldigeperiodenbeschikbaarzijn. Laterpinmetechtekaartuitsnedeuitsluitendnaexactepreviewgoedkeuring. Controlebestaandestart-overpaginaongewijzigd,alleenrichtinggevendanderonderwerp. Oordeel14tot21dagenvanafdaadwerkelijkegoedgekeurdepublicatieenmetvoldoendevergelijkbaredata;conceptheeftgeenevaluatiestart. Paperbackoptioneel,PDF/mailnoguit.
Hoofdmeetlek/14dagenASINherhalinguit25novrondeblijvenbestaandeconcretevoorstellen,geennieuweongeautoriseerdecode. StockingquizFAQcorrectieblijftbestaandconcept. Rondedata2026-11-26-artikel.json,geslotenmeetdag2026-11-25.json. Geenmain/build/nieuwepubliekeinhoud/ads/betaling/extraTelegram/verzending.
