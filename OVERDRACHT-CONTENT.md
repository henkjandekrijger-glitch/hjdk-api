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

### Correctie ter beoordeling, nog niet live (23 nov 2026)
Het rapport van 23 nov over 22 nov bevat 7 geregistreerde pagina-openingen op Stocking Books, 13 op Lasting Change en 208 ruwe Amazonredirects. Dit zijn verschillende metingen, geen unieke personen of bewezen verkopen. De hoofdknoppen voor de LC-paperback omzeilen de /go-meting; alleen onder meer omslag en vaste balk gebruiken hem. Het concept herstelt die hoofdknoppen, splitst Amazonverzoeken per site, noemt hun ruwe aard, en verwijdert het ongeldige percentage dat verzoeken van beide sites door alleen Stocking Books-openingen deelt. Zonder koppeling per pagina en klik blijft de inhoudelijke conversie onbekend.

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

"Lees eerst de overdracht content en distributie: https://hjdk-api-henq.vercel.app/api/bs?op=content (Vercel-tool web_fetch_vercel_url) en de repo henkjandekrijger-glitch/hjdk-api (OVERDRACHT-CONTENT.md, CLAUDE.md). Jij doet vanaf nu alleen content en distributie voor stockingbooks.com, lastingchange.works en Pinterest, met de dagelijkse leerlus uit hoofdstuk 7. Maak de twee geplande taken uit hoofdstuk 6 opnieuw aan in dit account. Begin met het grootste lek uit het rapport van vandaag en laat me alles eerst zien voor het live gaat."

## Logboek (nieuwste bovenaan)

- 2026-11-23, content-Codex: twee taken opnieuw aangemaakt met eerst-zien en de dagelijkse leerlus. Oude taken niet bereikbaar, dus uitzetten nog open. Meetlek onderzocht: LC-hoofdknoppen buiten /go en gemengde Amazonteller; correctie met regressiecontroles op aparte reviewbranch voorbereid, niet op main gezet. Bestaand artikel how-to-stop-procrastinating blijft concept. PDF en kopersmail blijven geblokkeerd door ontbrekende instellingen.

- 2026-11-23: overdracht geschreven voor het content-account. Bookstuffers heet Stocking Books (stockingbooks.com). Kerstmoppen, kerstquiz en kleurplaten zijn live. IndexNow loopt mee in de dagelijkse cron. Het LC-artikel begint met procrastination.
