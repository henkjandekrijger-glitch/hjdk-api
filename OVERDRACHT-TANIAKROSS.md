# Overdracht taniakross.media (Tania Kross): site, lijst, podcastmail, betaald en organisch

Eerste versie: vrijdag 20 november 2026 door chat-taniakross. Laatst bijgewerkt: zaterdag 28 november 2026, 12:45 UTC, door tk-chat2. Begin bij deel 0.
Live te lezen: https://hjdk-api-henq.vercel.app/api/wtb?op=tkoverdracht (met web_fetch_vercel_url). Bovenaan staat dan het werklog van alle regels met wie=chat-taniakross of wie=tk-...

## 0. START HIER (27 nov 2026, 14:05 UTC, door tk-chat2)

Dit deel gaat voor op alles eronder. Alleen dit deel lezen: `/api/wtb?op=tkoverdracht&deel=kort`.

### Elke dag beter: de opdracht van de dagronde (28 nov 2026, tk-chat2)

Henkjan 28 nov 12:29 UTC: "Adressen moet beter moet naar 0.05 cent per adres max iedere dag moet campagne dus met geleerde en 8 niewe creatives aan de slag . Beantwoord iedereen die echt reageert in mijn email met een kort bericht maak dat ook lerend zit veel informatie in . Zet dit in dboard als taak dagelijks beter . dus ook campagne". Dit gaat voor op oudere regels over de dagkopie hieronder.

Elke ochtend, in deze volgorde:
1. Campagne (PropellerAds, lijn TK ADRES). Doel: hoogstens $0,05 per adres. Lees de briefing (`/api/mm/briefing?medium=propeller&project=tk&doel=aanmelding`) en gisteren per advertentie (creative_stats) en per zone (zone_stats). Maak één kopie met `kopie_met_verse_creatives` (bod_van_bron true, behouden_ids [-1] = niets mee) met **8 nieuwe advertenties**: 4 tweelingen native en trend, gebouwd op de haak en woorden die gisteren adressen gaven; elke dag een andere nog niet geprobeerde haak erbij. Knoptekst hoogstens 15 tekens. Beeld met `beeld_van` (een losse foto-URL wordt geweigerd zonder icoon van precies 192x192). Zet het bod op $0,05 (`update_campaign` rate; nooit hoger zonder Henkjans woord), haal met `zones_erbij_uitsluiten` elke zone van de witte lijst die $0,02 of meer kostte zonder adres, start, en stop de voorganger als de kopie op status 6 staat (opvolger_lager_bewust alleen als de kopie bewust lager biedt). Zet het doel van de kopie in Clickmind: `/api/mm?op=instelling&j={"doelPerAdres":{"<nieuwe id>":0.05}}` (het hele object; vorige ids mogen blijven staan). Dan blokkeert Clickmind elk uur zelf elke zone die vandaag $0,05 kostte zonder adres, of $0,02 met een dure klik (Henkjan 28 nov: "Waarom niet EERDER ?!!!!"). Meld elke advertentie in het paspoort (`/api/mm?op=stuk&j=` met id ad:propeller:<creative>, variant en paar) en het campagnedoel (`op=stuk&campagne=propeller:<id>&doel=aanmelding`). Twee uur na de start: krijgt de kopie vertoningen op de zones die gisteren adressen gaven? Zo niet, of meer dan $0,15 per adres na $0,30: bron weer aan, kopie uit, melden.
2. Mail (Mailmind tk-mailchimp). Antwoorden gaan vanzelf (antwoordmotor, lib/tkmc.js). Lees `/api/post?op=mailmind&s=tk-mailchimp&inzicht=1`: wat zeggen de replies over de lezers? Neem de sterkste les mee in de advertenties van vandaag en, als hij nieuw is, in een uitdager voor de mail (`op=tkmc&uitdager=`, eerst als voorbeeld aan Henkjan).
3. Eén regel in het werklog (wie=tk-dagronde): kosten per adres gisteren, wat eruit ging, welke haak won, wat de replies leerden. Geen nullen.

Stand 28 nov 12:45 UTC: kopie 12202790 loopt op $0,05 met 8 nieuwe advertenties en 93 zones (bron 12193513 gestopt). 26-28 nov: 5 adressen voor $1,06 ($0,21 per adres); de zones met een adres kostten samen $0,13 ($0,025 per adres), 11 zones zonder adres namen 64% van het geld (eraf). Antwoordmotor tk-mailchimp staat aan (na de uitrol van 28 nov). De zin over een ander adres in de mail zelf wacht op Henkjans ja (voorbeeld: `/api/post?op=tkmc&voorbeeld=1&metander=1` op de beschermde host; aanzetten na zijn ja met `&ander=1` zonder voorbeeld).

### Eén eigenaar en één plek per soort informatie

Henkjan 27 nov: "goede overdracht die chat staat nu uit moet allemaal centraal in dashboard staan zodat geen miscomms" en "zorg voor goede overdracht met iedere taak of schedule".

- Er werkt één chat tegelijk aan TK. Op 27 nov werkten er twee tegelijk in twee accounts (tk-chat en tk-chat2): dubbel werk en twee keer dezelfde vragen aan Henkjan. tk-chat staat uit op Henkjans woord. tk-chat2 is eigenaar tot een volgende chat het overneemt.
- Eén uitzondering sinds 27 nov 13:38 UTC (Henkjan in tk-chat: "Optimaliseer verder voor Google en LLM vindbaarheid . Geef me plan hier ."): tk-chat doet alleen vindbaarheid (Google, AI, Demand Radar). Plan en stand staan in sectie 13, los te lezen op `/api/wtb?op=tkoverdracht&deel=vind`. Campagne, Mailmind, dagartikel, aanmeldvenster en elke uitrol van simpele-site blijven bij tk-chat2; tk-chat meldt een uitrol eerst in het werklog.
- Overnemen: lees dit deel en het werklog bovenaan. Staat er in het laatste uur een regel van een andere chat, schrijf dan eerst één regel in het werklog (wie=tk-<naam>: "ik neem TK over" of "ik doe alleen X") en doe niets wat daar al staat.
- Nooit twee uitrollen van simpele-site tegelijk. Een uitrol neemt de bestandslijst van de vorige over, dus het nieuwe bestand van een ander valt weg. Kijk vlak voor je uitrolt met list_deployments of er een nieuwere productie-uitrol is en neem die lijst.
- Een open vraag aan Henkjan is een planregel op het dashboard die begint met "Wacht op Henkjan:". Zijn ja schrijf je in het werklog met zijn eigen woorden erbij. Zo ziet de volgende chat wat gevraagd is en wat beantwoord.
- Een controle die je voor later plant in je chat verdwijnt als de chat stopt. Zet hem ook als planregel met datum op het dashboard.

| Wat | Waar | Wie schrijft |
|---|---|---|
| Doel, getal, planning, output, geld, alles wat vanzelf draait | dashboard, project tk (`/api/mm/dashboard?vorm=tekst&project=tk`) | elke chat en ronde, in dezelfde beurt als het werk |
| Wat er gebeurde en wat er ligt | werklog met wie=tk-... (bovenaan deze overdracht en op het dashboard) | idem |
| Hoe het werkt, regels, opdrachten van de taken | dit bestand, OVERDRACHT-TANIAKROSS.md in hjdk-api | de chat die iets verandert, in dezelfde commit |
| Mailmind | `/api/post?op=mailmind&s=tk-mailchimp` (perKenmerk, bank, dagen) | vanzelf |
| Lijst | simpele-site `/api/lijst?a=stand` | vanzelf |
| Campagnes van vandaag | kaart Campagnes op het dashboard | vanzelf |

### Stand 27 nov 13:40 UTC

- Lijst 83 van 1.000. Nodig rond 27 per dag tot 31 dec; er komen er rond 7 per dag bij.
- PropellerAds: alleen 12193513 loopt, bod $0,06, dagvenster 07:00 tot 22:00 NL (beide 27 nov hersteld door tk-chat). Oordeel 28 nov: levert hij weer rond 10 adressen per dag onder $0,06.
- Mailmind tk-mailchimp: 80 per dag, een stop remt niet meer, bounces wel. Eerste leermoment (94 mails): gmail en hotmail 30 verstuurd, 5 ja, 1 stop, 0 bounces; eigen domeinen 29, 4 ja, 10 stops, 2 bounces; provider 23, 0 ja, 2 bounces; score 3: 18 verstuurd, 0 ja, 3 bounces. Onderwerp: nog geen winnaar (o0 7 ja op 51, o1 4 op 43).
- Mailmind slimmer en veilig voor Gmail (Henkjans ja, 27 nov): bakkeuze per kenmerk met bounce en stop erin, de bank en de dagrem. Code lib/mailmind-bak.js, uitleg in sectie 10. Live sinds 27 nov rond 13:00 UTC (Henkjan: "ja push").
- Vercel simpele-site: NB_VOORBEELD_AAN, LIJST_ANTWOORD en RAPPORT_AAN staan erin (27 nov, zelfde adressen als de code al gebruikte). Ze gelden vanaf de eerstvolgende productie-uitrol.
- **Live gezet 27 nov 12:57 UTC in één uitrol (dpl_PLxypyXyKihPEj8rxNwvSbqVLwC9), op Henkjans "ja en ja":** het artikel van 27 nov "Klankschalen en sound healing: werkt het?" (data/mm/2026-11-27-klankschalen.json, geschreven door tk-chat2 omdat de Claude-taak niet leverde) en de Google-weergave van de homepage van tk-chat (api/_google.js en api/page.js: omschrijving van 151 tekens, ProfilePage, data-nosnippet, boeken via Dorien). Nagekeken: de homepage is regel voor regel gelijk aan het goedgekeurde voorbeeld, de stand toont het artikel van vandaag. Met deze uitrol gelden ook de drie variabelen. De proef staat in ZICHT (tk-google-weergave-1127, lib/zicht.js). Herindexering en het vervolg voor Google en AI: sectie 13 (tk-chat).
- **Live gezet 27 nov 13:30 UTC (dpl_BkdnGz2ZRK65pUdZ65qNWeh3Zxcc; dit is nu de bestandslijst om op te bouwen), twee dingen op Henkjans woord:**
  1. De agenda van Tania is uit beeld (Henkjan: "Haal die agenda tool van de site bij tania . die leidt erg af ad zijkant en op mobiel ook ."). Dat is Tania's eigen onderdeel in haar homepage: de ladder rechts (.ag-rail), de knop op de telefoon (.ag-fab) en het paneel (.ag-veil, .ag-panel). Haar bestand blijft zoals het is (haar script zoekt die elementen, dus ze blijven in de pagina); onderaan tk-extra.css staat één regel die ze verbergt (sha c240e31d806db80b53a550ab0dc53e241590c039). Haar AGENDA voedt nog steeds de dagcarrousel, /optredens en de mail. Terugzetten: die regel weghalen.
  2. Het videovenster voor betaald verkeer heeft variant pv niet meer (Henkjan: "Zorg dat die campagne WEL gaat opleveren"). Cijfers tot 27 nov, herkomst betaald: pv (formulier onder de video, geen vraag bij sluiten) 11 adressen op 1.199 vensters, 0,9%; pv2 en pv3 samen 49 op 2.311, 2,1%. De vraag bij sluiten (moment dicht) gaf 36 van de 70 adressen. Nu krijgt iedereen pv2 of pv3 (lijst.js, sha bb2c593489ed25d84e94462a26308ccda96c953a). Verwacht: ruim een vijfde meer adressen per klik. Oordeel 4 dec: adressen per venster van pv2 en pv3 in /api/lijst?a=stand (perHerkomst.betaald.moment); de slechtste gaat er dan uit. Teksten in dat venster leren zelf: g2 (verrassing) 35 op 1.797, p1 15 op 1.024, g1 5 op 464, g3 1 op 225.
  - In lijst.js zit ook al de code voor de link onder het aanmeldvenster; die doet niets tot de server hem meegeeft (zie Wacht op Henkjan). api/lijst.js is live nog de oude (sha fe59883366b115410f296bcdb815c31b3e929549). api/_intern/overdracht.html op de site zelf is voor deze twee wijzigingen niet bijgewerkt (dat kost een volledige upload); deze overdracht is de bron.
  - simpele-site heeft geen repo: elke wijziging in een bestaand bestand kost een volledige upload van dat bestand in de uitrol (lijst.js, api/lijst.js en tk-extra.css zijn elk rond 30.000 tekens). Bundel dus wijzigingen per bestand, en neem een bestand dat al eens geupload is mee per sha.
- **Regel voor elke uitrol van simpele-site:** neem de bestandslijst van de laatste productie-uitrol en zet alleen je eigen bestanden erbij (per sha of inline). Nooit de lijst van een voorbeeld: dan haalt het ene voorbeeld het andere weer weg. Niet promoten: een voorbeeldbouw mist UPLOAD_KEY. Bestanden die al in een voorbeeld zaten kun je per sha meenemen. De volledige bron van elk bestand (ook api/lijst.js) staat op https://simpele-site-henq.vercel.app/api/bron omdat de Vercel-tool grote bestanden afkapt op ongeveer 2.000 tekens (groot antwoord: opslaan en met python lezen).

### Alles wat vanzelf draait

Dezelfde lijst staat op het dashboard onder "Draait vanzelf" (veld taken van project tk). Verander je een taak, werk dan beide bij.

| Taak | Waar | Wanneer | Controle dat hij liep | Als hij niet liep |
|---|---|---|---|---|
| Mailmind uurronde | Vercel-cron hjdk-api, `/api/post?op=mailmind&ronde=1` | elk uur op :23, verstuurt 9 tot 21 uur NL | `laatsteRonde` in de stand; elke ochtend een regel tk-mailmind | kijk naar wachtOp, de poort (180 per dag, 12 per uur), de dagrem; proef zonder versturen: `&ronde=1&droog=1` |
| Ochtendverslag | Vercel-cron simpele-site, `/api/rapport` | 11:00 UTC | mail bij Tania en Henkjan | runtime-fouten van simpele-site (get_runtime_errors) |
| Weekmail-voorbeeld | Vercel-cron simpele-site, `/api/nieuwsbrief` | 14:30 UTC, alleen als de vorige mail 6 dagen oud is en er een nieuwe aflevering of gast is | voorbeeld bij Tania en Henkjan; naar de lijst pas na Nu versturen | NB_VOORBEELD_AAN nakijken, sectie 6 |
| Dagartikel | Claude-taak trig_01GBsTSx84bciUTnNr7qnpe1, in het andere Claude-account | 10:37 UTC | `artikelVandaag` in `/api/mmart?op=stand`; regel tk-dagartikel | terugval hieronder; of een chat voert Taak A uit |
| Dagartikel, reserve | Claude-taak trig_01Enpb2outQNGeq1zYr6bJ4h, in het tweede account (dat van tk-chat2) | 11:37 UTC | `artikelVandaag`; regel tk-dagartikel | stopt zelf als er al een artikel staat |
| Dagartikel terugval | Vercel-cron simpele-site, `/api/mmart?op=dag` | 15:07 UTC | regel tk-dagartikel-gateway | wachtrij op? Vul WACHTRIJ in api/mmart.js aan |
| TK dagronde adressen | Claude-taak trig_01Dxs5zUJ4mzjJUDJHPsS4Z3, in het andere Claude-account | 08:17 Curaçao (12:17 UTC) | regel tk-dagronde van vandaag | de reserve hieronder |
| TK dagronde, reserve | Claude-taak trig_0119rmetMryqU13DoAEU7e6X, in het tweede account (dat van tk-chat2) | 09:17 Curaçao (13:17 UTC) | regel tk-dagronde van vandaag | stopt zelf als de ronde al gedaan is; anders voert een chat Taak B uit |
| Budgetwacht en uurwacht | Vercel-cron propellerads-mcp en Clickmind | elk uur | kaart Campagnes op het dashboard | zie CLAUDE.md |
| Tellers en logboek van de site | Vercel-cron simpele-site, `/api/rollup` en `/api/logboek?scan=1` | elke 15 minuten | ochtendverslag heeft cijfers | runtime-fouten |

De twee Claude-taken staan sinds 27 nov in beide accounts (Henkjan: "Ja"). In het tweede account lopen ze een uur later en beginnen ze met een stopregel: staat het artikel van vandaag er al, of staat er vandaag al een regel tk-dagronde in het werklog, dan stoppen ze zonder iets te doen. Zo maakt het niet uit welk account loopt en gebeurt er niets dubbel. De taken in het tweede account dragen alleen de verwijzing naar Taak A en Taak B hieronder. Een account kan de taken van het andere niet zien of wijzigen.

### Opdrachten van de Claude-taken (dit is de bron)

Zet in de geplande taak zelf alleen de verwijzing, zodat elk account dezelfde tekst uitvoert:

> Lees met web_fetch_vercel_url https://hjdk-api-henq.vercel.app/api/wtb?op=tkoverdracht&deel=kort en voer Taak A (of Taak B) precies uit. Nederlands, kort, zuinig met tokens. Vraag niets; kies bij twijfel de veiligste optie.

De taken in het eerste account (10:37 UTC en 08:17 Curaçao) dragen nog hun eigen tekst van 26 nov en hebben geen stopregel. Wie daar bij kan, vervangt die door de verwijzing en zet de stopregel erin.

**Taak A: dagartikel Muziek als medicijn**

1. Stand: `https://simpele-site-henq.vercel.app/api/mmart?op=stand`. Staat `artikelVandaag` er al: stop, geen log, geen bericht. Loopt er volgens list_deployments (project simpele-site) net een uitrol van een ander, wacht tot die klaar is.
2. Onderwerp: de grootste vraag zonder artikel uit `https://demandradar-ivory.vercel.app/api/zoekvraag?thema=muziek-medicijn` (één keer ophalen). Niet een onderwerp uit `laatste` en niet uit `wachtrijOver` (die zijn van de terugval). Gedaan tot en met 27 nov: slapen, binaural beats, studeren, klankschalen. Volgende kandidaten: muziek tegen angst en stress, wat is muziektherapie, helende frequenties, zingen is gezond.
3. Bronnen: twee of drie bronnen die je zelf leest, een overzichtsstudie of meta-analyse eerst, dan een proef (Cochrane, PubMed, PMC). Elk getal in het artikel staat in een bron die je las.
4. Schrijf `data/mm/<datum>-<onderwerp>.json` in de vorm van het laatste artikel (ophalen: `https://simpele-site-henq.vercel.app/data/mm/2026-11-27-klankschalen.json` of het artikel van 26 nov): `datum`, en voor `nl` en `en`: `slug`, `titel` (zoekterm voorop, hooguit 70 tekens), `beschrijving` (hooguit 155), `h1`, `antwoord` (het antwoord in 4 tot 6 zinnen met de belangrijkste getallen), `delen` (`{kop, p: [...]}` of `{kop, lijst: [...]}`), `vragen` (`[[vraag, antwoord]]`, 4 of 5 echte zoekvragen), `bronnen` (`[[naam, url]]`).
5. De lat (Henkjan 26 nov, "briljant"): een haak in de eerste alinea, getallen in mensentaal (van 45 naar 35, geen effectmaten), een deel "Hoe zeker is dit?" dat zegt wat we niet weten, een lijst "Vanavond doen" met wat je zelf kunt doen en wanneer je naar de huisarts gaat. Geen gedachtestreepjes, geen HTML, geen verzonnen feiten. Zelftoets voor je uitrolt: haak, mensentaal, hoe zeker, vanavond doen, elk getal in een gelezen bron, NL en EN gelijk. Eén punt niet gehaald: herschrijven.
6. Uitrollen: mcp__Vercel__create_deployment met name en project simpele-site, target production, files = elk src-bestand uit list_deployment_files van de laatste productie-uitrol als `{file, sha}` (pad zonder `src/`) plus het nieuwe bestand inline (encoding utf-8). Geen ander bestand inline.
7. Controle: uitrol READY; `/muziek-als-medicijn/<slug>` en `/en/music-as-medicine/<slug>` op simpele-site-henq.vercel.app geven 200 met de h1 en `id="dossier"`; de stand toont `artikelVandaag`.
8. Werklog: `/api/mm/handover?log=<datum, titel, zoekvraag met volume, bronnen, uitrol-id>&wie=tk-dagartikel`. Drie regels aan Henkjan met de link.

In een chat met Henkjan erbij: eerst het idee en het stuk laten zien (uitrol zonder target is een voorbeeld; deellink met get_access_to_vercel_url), live na zijn ja. De geplande taak plaatst zelf (Henkjan 24 nov: "vul dit iedere dag aan met een artikel").

**Taak B: TK dagronde adressen (PropellerAds)**

Lees eerst de skill campagnes-henkjan (tool campagne_skill van de PropellerAds-connector); die regels gaan voor.

1. Werklog: staat er vandaag al een regel tk-dagronde, stop dan. De ronde is gedaan.
2. Cijfers: gisteren en vandaag per campagne (daily_report), de lopende TK-campagne per zone en per advertentie over 3 dagen (zone_stats, creative_stats), Clickmind-zones (`/api/mm/zones`: wit, zwart), de lijststand en de Mailmind-stand.
3. Zones: een zone met 80 of meer kliks zonder adres gaat van de witte lijst (zones_erbij_uitsluiten). Een zone die Clickmind wit noemt of die een adres gaf mag erbij.
4. Advertenties: 300 of meer kliks en minder dan de helft van de gemiddelde conversie van de campagne: uit.
5. Dagkopie: één verbeterde kopie per dag met kopie_met_verse_creatives (de beste advertenties plus 2 nieuwe, knop in het Nederlands van hooguit 15 tekens, `bod_van_bron: true`). Lees het veld bod in het antwoord: $0,06. Controleer het dagvenster (07:00 tot 22:00 NL, campagnetijd is -5) en de witte lijst. De voorganger gaat pas uit als de kopie op $0,06 staat en vertoningen krijgt. Eén live TK-campagne. Draait de lopende campagne minder dan een dag op zijn huidige bod en venster, maak dan geen kopie: één wijziging per dag, anders is niet te zien wat werkte.
6. Bod en budget: $0,06 voor de hele lijn, $10 per dag. Wijzigen alleen op Henkjans woord. Een hoger bod kocht duurdere kliks, niet meer adressen ($0,20 gaf $0,48 per adres).
7. Mailmind meelezen, niets wijzigen: ja, stops en bounces van gisteren, wat op de bank staat, of de dagrem viel.
8. Dashboard: planregels af en erbij. Werklog met wie=tk-dagronde: adressen gisteren per bron, kosten per adres, leden, wat er veranderde, wat de controle van morgen is.
9. Rapport aan Henkjan in hooguit 6 regels.

### Wacht op Henkjan

Niets van 27 nov staat nog open: om 12:53 UTC zei Henkjan ja op alle vier (pushen naar hjdk-api, artikel live, Google-weergave live, de twee taken ook in het tweede account). De afloop staat in het werklog van tk-chat2. Nieuwe vragen aan Henkjan staan als planregel "Wacht op Henkjan:" op het dashboard.

**Aanmeldvenster met podcast en link: live sinds 27 nov 13:59 UTC** (dpl_SLg5PfLorvaUap7N5xJasHuE2fED; dit is nu de bestandslijst om op te bouwen). Henkjan bij het venster "Hoor het als Tania weer optreedt" (tekst m4): "Moet ook gaan over podcast etc . Om de andere week een volgende . En kijk HIER naar de laatste . Kijk of luister ." en op het voorbeeld: "Ja prima maar lang het moet volledig lerend zijn met mailmind en clickmind ." Nagekeken live: a=kies&toon=m4 geeft de nieuwe tekst en `laatst` naar /podcast/francis-sling. Wat er live staat:

- api/lijst.js (nieuw, sha e965a17ce2e9596b44922fcf980a995c9a258c6b, al geupload): MAIL.m4 wordt kicker "Podcast en concerten", titel "Hoor het als Tania iets nieuws heeft", tekst "Om de week een nieuw gesprek in haar podcast A Kross …. En haar concerten en voorstellingen, zodra ze bekend zijn." De zin "Afmelden kan altijd met één klik." gaat uit de tekst van m3, m4 en p2: hij staat al in de kleine regel eronder.
- Onder de tekst van elk mailvenster een link naar de nieuwste aflevering: "Kijk of luister nu: Tania met <laatste gast>" naar /podcast/<gast> (uit de slug van de gast; g.href is de link naar buiten). De server geeft hem mee in a=kies als `laatst: {tekst, href}`, niet bij betaald verkeer of het videovenster (daar telt alleen het adres). De browser (lijst.js, kaart; staat al live) zet hem als `p.tkl__l` onder de tekst en telt de klik (klik, k lijst, x laatste).
- In hetzelfde bestand gaat het antwoordadres naar de variabele: `const ANTWOORD = process.env.LIJST_ANTWOORD || undefined`.
**Aanmeldvenster lerend met Clickmind: uitgerold 27 nov rond 14:45 UTC (Henkjan: "Voer alles door ."). De terugkoppeling van de mail (stap 3) is sinds 27 nov 16:52 UTC ook live (zie Stap 3 hieronder).**

- Wat er draait: de helft van de gewone bezoekers (vast per browser, sleutel tk-eng) krijgt de lerende modal van Clickmind in plaats van het eigen venster. Instelling `tkpost` in Clickmind: armen m4, kort ("Podcast om de week. Concerten zodra ze bekend zijn."), m1, p3 en een controlegroep; vormen hoek, onder en tab; catalogus uit en claude uit (geen andere sites en geen automatisch geschreven teksten op Tania's site). Aanmelden gaat via window.mmAanmelden naar dezelfde lijst (lid krijgt v = arm, m = cm). Betaald verkeer houdt het videovenster.
- Schakelaar: het bestand tkcm.json op de site, `{"deel":0.5}`. 0 is niemand, 1 is iedereen. Wijzigen is een uitrol met alleen dat bestandje inline. Clickmind zelf uit: /api/mm?op=modalbeheer&site=tkpost&aan=0, maar zet dan ook tkcm.json op 0, anders krijgt die groep geen venster.
- Bekijken: https://taniakross.media/?tklijst=cm&mmm=kort (of mmm=m4, m1, p3) dwingt de Clickmind-modal af; ?tklijst=m4 toont het eigen venster.
- Oordeel na 14 dagen of 60 aanmeldingen: aanmeldingen per bezoeker per groep. Bezoekers per groep: klik lijst groep-cm en groep-eigen in de sitestatistiek; aanmeldingen van de Clickmind-groep hebben m = cm. De winnaar krijgt alles (tkcm.json op 1 of 0).
- Bestanden: lijst.js sha ed0847c028c0f163c2efcb3bcd144cb1d4bfab13, tkcm.json sha 96c76ff92cafd90cbc1e6ecfc0bd8864b4d25080. In hjdk-api: taniakross.media bij de eigen domeinen van de modal (lib/modal.js EIGEN), uitleg in lib/werking.js.

Achtergrond en wat nog open staat:

- Wat er nu leert: de eigen lus van de site (api/lijst.js: Thompson op aanmeldingen per tekst en per moment, apart per herkomst; stand /api/lijst?a=stand) en de onderwerpregel van de welkomstmail (api/_mailleer.js). Clickmind meet alleen betaald verkeer (cm.js laadt bij mmc in de URL). Mailmind doet alleen de oude lezers (stroom tk-mailchimp).
- Wat erbij moet: de lerende modal van Clickmind (lib/modal.js: leert tekst, moment, vorm en kenmerken van de bezoeker, heeft een controlegroep en een rem, en leent van dezelfde soort arm op de andere sites) en de terugkoppeling van de mail: wat een adres met de mail doet telt als uitkomst van het venster dat het opleverde (lib/mailmind.js modalTerug, lib/modal.js mailMidSleutel en modalUitkomst). De motor erachter is lib/modalmotor.js; zie daar en in lib/werking.js "Aanzetten op een nieuw project".
- Stap 1, Clickmind: modal voor site `taniakross` (domein taniakross.media) met /api/mm?op=modalbeheer&j=<JSON> op de beschermde host. E-mailarmen met doel `eigen` (dan roept cm.js window.mmAanmelden aan), een controle-arm (soort geen), moment en vorm op leer. Teksten: de huidige m1 tot m4 en p1 tot p3, plus een korte versie van m4 (Henkjan vond de tekst lang), bijvoorbeeld titel "Hoor het als Tania iets nieuws heeft" met tekst "Podcast om de week. Concerten zodra ze bekend zijn." Betaald verkeer houdt het videovenster (pv2, pv3).
- Stap 2, site (lijst.js, één upload): cm.js op elke pagina laden (async, data-site taniakross; Clickmind mag een pagina nooit vertragen), `window.mmAanmelden(email, ctx)` die /api/lijst?a=aan aanroept met v = cm-<arm> en {ok, nieuw} teruggeeft, en het eigen venster (kaart) uit voor wie de Clickmind-modal krijgt. Eerst de helft van de bezoekers, vast per bezoeker: eigen venster tegen Clickmind-modal. Oordeel op aanmeldingen per bezoeker na 14 dagen of 60 aanmeldingen; de winnaar krijgt alles. Het vaste blok onderaan blijft.
- Stap 1, 2 en 3 zijn gedaan (stap 3: zie hieronder).
- **Stap 3, hjdk-api (klaar):** `GET /api/mm/modalmailev?k=<24 hex>&e=mailopen|mailklik`. k = de eerste 24 tekens van sha256(adres, kleine letters, getrimd), dezelfde sleutel als `mailMidSleutel` in lib/modal.js; zo gaat er geen e-mailadres en geen mid de deur uit. `modalMail` bewaart al bij elke aanmelding via de modal `mm:mailmid:<k>` -> mid (180 dagen); `modalMailEv` zoekt de beslissing op en telt eenmaal per beslissing en soort (`modalUitkomst`, veld mu:<soort>). Antwoord 200 `{ok:true}` of `{ok:true,dubbel:true}`; onbekend adres 404 `{onbekend:true}`; k of e fout 400. Uitkomsten `mailopen` (waarde 0: Apple Mail laadt het pixel vanzelf) en `mailklik` (waarde 5 cent) staan in VELDEN en WAARDE; niet in EVENTS, dus het openbare /api/mm/modalev kent ze niet. Eigen namen omdat `open` het openen van het venster is en Mailmind zijn eigen mail-open via modalTerug als `open` meldt. cm.js geeft nu `ctx.mid` mee aan `window.mmAanmelden` (andere sites merken er niets van). Test: scripts/test-modalmotor.mjs (welkomstmail van een eigen lijst telt terug). Uitzetten: de site niet laten melden (of de uitkomsten uit WAARDE halen, dan leert er niets van); terugdraaien van de code is een revert van deze commit.
- **Stap 3, site (gedaan, 27 nov 2026 16:52 UTC, tk-oppakker, taak 962lsh):** api/lijst.js van simpele-site, voorbeeld dpl_b1D7V2d564HULshdBtMFCkseNpAu, productie dpl_8BbHp2JjHfCp9pdA3Vk5JiNWitaM (basis dpl_Ah4UygDo5HD4m6kUsyGXSAWhdJau), sha van api/lijst.js voor e965a17ce2e9596b44922fcf980a995c9a258c6b en na 7c4bc9b6168661316e7c04609097e04f65797a9b (uid in beide uitrollen en in /api/bron gecontroleerd). Wat het doet: bij a=o (open) en a=k (klik) van de welkomstmail (s = welkom) van een lid met m = cm leest `meldMail` het lid, rekent k = eerste 24 tekens van sha256(adres) uit en roept `https://whichtobuy.best/api/mm/modalmailev?k=&e=mailopen|mailklik` aan. Er gaat geen adres de deur uit. De melding loopt samen met het tellen (Promise.all), de fetch heeft een grens van 700 ms (AbortSignal.timeout) en het geheel van 1.500 ms (metGrens); elke fout wordt geslikt, het pixel en de doorverwijzing breken nooit. Leden zonder m = cm en andere mails (weekmail) melden niet. Tellers in blob stats/mailcm.json en in `/api/lijst?a=stand` onder `mailcm` (per mailopen en mailklik: gemeld, onbekend (404), fout), en in de modalstand van tkpost in Clickmind (mailopen waarde 0, mailklik waarde 5). **Drempel voor een lek:** 5 opens of kliks van cm-leden op de welkomstmail en 0 gemeld, of meer dan 20 procent fout. Uitzetten: Vercel-variabele `LIJST_MCM` op een eindpunt dat niets doet (dan tellen alleen fouten), of de vorige api/lijst.js per sha e965a17c terug uitrollen. Eerste controle: bij de eerstvolgende opens van cm-leden (mailcm in a=stand moet dan gemeld > 0 tonen); nu staat mailcm leeg op {}. De welkomstmail zelf, de tekst en de lijst zijn niet veranderd.
- Open na stap 3: de welkomst- en podcastmail als stroom in Mailmind of de motor. Enkele opt-in blijft (Henkjan 7 nov: bevestigen hoeft niet). Mail naar de lijst alleen na akkoord van Henkjan en Tania. In api/lijst.js staan nog twee afzenderadressen als terugval in de code (bij LIJST_FROM en LIJST_FROM_RESERVE); die horen naar Vercel-variabelen, maar dat raakt de mail en is dus een aparte stap met controle dat beide variabelen bestaan. Gekozen weg bij stap 3 (afwijking van het eerste plan): de site bewaart geen mid, want hjdk-api kent de koppeling adres naar beslissing al; de site meldt alleen de sleutel k.
- Zuinig: lijst.js en api/lijst.js kosten elk een volledige upload. Bundel alles per bestand in één keer en neem daarna per sha mee.

### Eerstvolgende stappen, op volgorde

1. Mailmind-bakkeuze is live (proefronde 27 nov 13:02 UTC: 83% naar gmail en hotmail, niets naar score 3, bank 0:r3). Oordeel na 100 mails naar gratis adressen: ja boven 12%, bounces onder 3%.
1b. Vindbaarheid (Google, AI, Demand Radar) doet tk-chat: plan en stand in sectie 13 (`/api/wtb?op=tkoverdracht&deel=vind`), wacht op Henkjans ja. De Google-weergave is als proef gemeld in ZICHT (tk-google-weergave-1127).
1c. Aanmeldvenster met podcast en link is live (27 nov 13:59 UTC) en leert sinds 27 nov ook met Clickmind (de helft van de gewone bezoekers, zie Wacht op Henkjan). De mail telt sinds 27 nov 16:52 UTC terug (stap 3). Open: de eerste controle daarvan op 4 dec (mailcm in /api/lijst?a=stand: gemeld boven 0 zodra een lid uit de Clickmind-groep de welkomstmail opent; onbekend of fout zonder gemeld is een lek) en het oordeel eigen venster tegen Clickmind rond 11 dec.
1d. Campagne laten opleveren (Henkjan 27 nov: "Zorg dat die campagne WEL gaat opleveren komt nieuwe CM aan ."; CM gelezen als Clickmind). Stand 27 nov 13:20 UTC: 14.358 vertoningen, 95 kliks, 1 adres, $0,06. De dagronde van 27 nov haalde zone 9819976 van de witte lijst (113 kliks, geen adres) en maakte geen dagkopie, omdat de campagne nog geen dag op het goede bod draait (26 nov liep de kopie op $0,01). Gedaan aan de pagina: variant pv eruit (zie Stand). Eerstvolgende: 28 nov de dagkopie (verse start), elke dag de slechtste advertenties eruit en nieuwe erin, en zones erbij als het tempo onder 500 kliks per dag blijft. Bod en budget blijven van Henkjan.
2. 28 nov: levert 12193513 weer rond 10 adressen per dag onder $0,06.
3. Adressen uit api/rapport.js, api/lijst.js en api/_push.js naar de variabelen (RAPPORT_AAN, LIJST_ANTWOORD). Daarna kunnen die bestanden inline uitgerold worden: nieuw ochtendverslag, Barcelona-embed naar youtube.com, venster naar de Mailmind-modal.
4. De rest staat in sectie 11.

Bijgewerkt 27 nov 2026 12:00 UTC door tk-chat. Dit blok gaat voor op oudere tekst hieronder.

- **Doel:** 1.000 adressen voor 31 dec 2026. Stand 80. Nodig 27 per dag: Mailmind rond 17 (150 mails x 12% ja) plus PropellerAds rond 10.
- **Oordeel hoger bod: nee.** Bod $0,20 gaf op 26 nov 3 adressen voor $1,44 ($0,48 per adres); $0,05 tot $0,06 gaf 11 tot 12 per dag voor $0,03 tot $0,06. Hoger bieden koopt duurdere kliks, niet meer adressen. **Het bod van de TK-lijn is $0,06**, ook voor elke dagkopie.
- **Fout van 26 nov en het slot daarop (Henkjan: "Dit mag nooit meer gebeuren zorg daarvoor"):** dagkopie 12193513 stond op $0,01 terwijl de tool "bod 0.2" meldde (het getal uit het verzoek); de voorganger ging uit en er kwam geen adres meer. Sinds 27 nov zit het slot in de connector (propellerads-mcp, lib/bodcheck.mjs): elke kopie-tool meldt het bod dat PropellerAds teruggeeft, `bod_van_bron: true` geeft de dagkopie meteen het bod van de bron, en `update_campaign` weigert het stoppen van een campagne zolang zijn opvolger op dezelfde link lager biedt. Nalezen: tool `bod_controle`. Maak elke dagkopie met `bod_van_bron: true` en schrijf alleen een bod op dat je in dat antwoord las.
- **Dagvenster (Henkjans ja, 27 nov):** 12193513 koopt van 07:00 tot 22:00 Nederlandse tijd (was 14:00 tot 05:00: de nacht erbij, de ochtend gemist). Een kopie neemt dit venster over; controleer het na elke kopie (campagnetijd is -5).
- **Mailmind (Henkjans akkoord, 27 nov):** bij deze toestemmingsmail telt een stop niet meer als rem (`stopIsAntwoord` in lib/tkmc.js; de rem op bounces blijft: 8% halveren, onder 5% groeien). Tempo terug op 80 per dag, +25 per dag naar 150. Was door 15 stops op 86 mails naar 20 gezakt terwijl 12% ja zei.
- **Vercel simpele-site (Henkjans ja, 27 nov):** NB_VOORBEELD_AAN, LIJST_ANTWOORD en RAPPORT_AAN staan erin. Ze gelden vanaf de eerstvolgende uitrol. Vanaf dan gaat het voorbeeld van de weekmail naar Tania en Henkjan (cron 14:30 UTC, naar de lijst pas na Nu versturen), kan het nieuwe ochtendverslag uit (adressen uit de code naar RAPPORT_AAN) en kan het venster naar de Mailmind-modal.
- **Google (Henkjan 27 nov: "breng structuur aan zodat googlers juiste structuur zien van haar en niet een random tekst uit de site"):** de homepage heeft al Person, WebSite en de rest in JSON-LD. Het lek zit in de zichtbare tekst: de eerste lopende tekst is de inleiding van de podcast, de omschrijving is 198 tekens (te lang) en het menu wijst naar ankers in plaats van pagina's. Voorstel ligt bij Henkjan (eerst zien, dan live): korte regel wie Tania is bovenaan, omschrijving onder 155 tekens, data-nosnippet op podcasttekst, menu en aanmeldvenster, ProfilePage erbij. Open vraag: mag "Boekingen via Theaterbureau de Mannen" uit de omschrijving.

<!-- einde kort -->

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
- **Welke adressen eerst (27 nov, Henkjan: "zorg dat mail mind slimmer wordt en mijn account gmail niet gekilld", lib/mailmind-bak.js):** elk kenmerk van een bak leert mee (score, soort adres, jaar), de keuze is de kans op ja min 3 keer de kans op een bounce en een half keer die op een stop, en een kenmerk met 15 of meer mails en 10% of meer bounces gaat op de bank (27 nov: score 3). Op de cijfers van 27 nov gaat 87% naar gmail en hotmail (was 66%), 6% naar eigen domeinen (was 23%) en niets naar score 3 (was 6%). Dagrem: 4 of meer bounces vandaag en 6% of meer van wat vandaag uitging, dan vandaag niets meer. Stand: `perKenmerk` en `bank` in de stand; test `node scripts/test-mailmind-bak.mjs`. Zet de bank of de dagrem niet uit om het tempo te halen: het Gmail-account van Henkjan gaat voor het doel.
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

<!-- vind -->
## 13. Vindbaarheid: plan voor Google en AI (27 nov 2026, tk-chat)

Henkjan 27 nov 13:38 UTC: "Optimaliseer verder voor Google en LLM vindbaarheid . Geef me plan hier . Ik wil veel meer organische verkeer dan nu gebruik demand radar ." Status: plan gegeven, wacht op zijn ja. Niets van dit plan gaat live zonder dat hij het eerst zag.

**Stand 27 nov (nulmeting)**

- Bezoek uit zoek, 7 dagen: 31 (Google 15, Bing 13). Uit AI: geen. Search Console: 2.707 vertoningen en 80 kliks.
- "tania kross": plek 6, 1.033 vertoningen, 31 kliks (31 okt tot 26 nov). Ruim driekwart van alle vertoningen is haar naam of een schrijfwijze ervan.
- De daling van het totaal in Search Console (6.600 naar 2.700) is de tv-piek van eind oktober die uit het venster schuift (31 okt: 283 vertoningen op één dag). Per dag groeit het: van 6 tot 9 zoekvragen per dag begin november naar 25 tot 30 nu.
- Perplexity (4 vragen): noemt Tania bij 3, haalt de site aan bij 2.
- Demand Radar, thema taniakross, zoekers per maand: tania kross 2.400 in NL (8.100 in een tv-maand), podium klassiek 5.400, operazangeres nederland 2.400, izaline calister 880, samira rafaela 590, dagvoorzitter 480 en dagvoorzitter inhuren 180, mezzosopraan 480, mezzo soprano 12.100 in de VS.

**Al gedaan, niet opnieuw doen**

- Engelse Wikipedia wijst sinds 9 nov naar de site, NL-Wikipedia en Wikidata sinds 20 nov. taniakross.nl en taniakross.com sturen door (308, pad blijft). De plek op haar naam bleef 6 (was 6,5).
- /podium-klassiek en de mezzopagina's zijn proef tot 18 dec (tk-podiumklassiek-1120, tk-mezzo-arias-1120), de gastprofielen tot 5 dec (tk-gastprofielen-1031): tot die datum niet wijzigen. De Google-weergave van de homepage is proef tk-google-weergave-1127.
- De techniek staat (api/seo.js, a=zicht): robots, sitemap met beelden en video, IndexNow, hreflang nl, en, es, /vragen, /pers, llms.txt.

**Plan, grootste winst eerst**

1. Plek 1 op haar naam. Links naar de site vanaf plekken met gezag: Theaterbureau de Mannen, NPO en NTR (Podium Klassiek), Curaçao.nu, Speakers Academy na de deal, zalen waar ze optreedt. Link in de bio van al haar socials en YouTube, sameAs YouTube en Facebook in home.js (open punt 6 in sectie 11). Kennispaneel van Google claimen (alleen Tania kan dat). Oude adressen van de vorige sites die nu doodlopen opvangen. Verwachting: van plek 6 naar de top 3 is ongeveer vier keer zoveel kliks op haar naam.
2. Elke podcastgast is een zoekwoord. Op de dag van de aflevering: video met hoofdstukken, vijf uitspraken, vragen uit het gesprek, en de gast vragen te delen en te linken. De pagina's van Izaline Calister en Samira Rafaela krijgen nog geen vertoning.
3. "Tania zingt het voor" en "Vraag het Tania". Eén opname van een uur: 30 korte antwoorden op echte zoekvragen, met 20 seconden zang waar het kan. Elk antwoord wordt een pagina, een YouTube Short en een fragment voor Instagram, via Videomind. De Engelse mezzopagina staat na een week op plek 19 en op "voice example" op plek 5. Op de mezzopagina's zelf plaatsen na 18 dec.
4. Dagvoorzitter wordt een boekpagina: titel met "inhuren", bel- en mailknop bovenaan, antwoord op wat een dagvoorzitter doet en kost. Nu heeft de pagina geen knop en krijgt hij op geen enkele dagvoorzitter-zoekvraag een vertoning. Vraag aan Henkjan: gaat de aanvraag naar Dorien of naar Speakers Academy.
5. Echte menupagina's (Podcast, Optredens, Dagvoorzitter, Boeken) voor sitelinks onder haar naam, en de pagina's die nog niet in Google staan aanmelden (laatste meting 30 van 50; de sitemap telt nu 67 adressen).
6. AI-meting elke week: 12 echte vragen bij 4 AI's via Demand Radar (gaps?ask=), per vraag invullen wat ontbreekt.
7. Persoonlijke vragen (gezin, leeftijd; samen rond 500 zoekers per maand): Tania kiest zelf wat ze in één zin op /vragen beantwoordt.
8. Muziek als medicijn blijft elke dag lopen; onderwerpen uit Demand Radar (thema muziek-medicijn).

**Doel en meting.** Van 80 kliks naar 400 kliks per 28 dagen op 31 dec. Elke maandag één regel: kliks, plek op haar naam, aanmeldingen uit zoek. Voor de 1.000 adressen blijven Mailmind en de campagne de hoofdroute; zoekverkeer levert dit jaar tientallen adressen.

**Nodig van Henkjan en Tania.** Ja op het plan, een uur van Tania voor stap 3, haar bio-links en het kennispaneel (stap 1), en Dorien of Speakers Academy (stap 4).

**Werkafspraak.** tk-chat doet alleen dit plan. Elke uitrol van simpele-site gaat eerst als voorbeeld, op de bestandslijst van de laatste productie-uitrol, live op Henkjans ja, en wordt vooraf in het werklog gemeld.

### Kansen in AI in haar vak: meting 27 nov 15:04 UTC

Henkjan 27 nov 14:59 UTC: "Vind op demandradar kansen in LLMs om naar Tania om te buigen of te landen als er op gezocht wordt wel met de juiste antwoorden natuurlijk en in haar branche . Longtail rond podcast , zingen, Concerten . Enz er zijn duizenden koren bijv in NL ."

Meting: gatscan `tk-branche-1127` (ZICHT, Perplexity, 36 echte vragen over koren, zingen, concerten, podcast en dagvoorzitter; opnieuw draaien met dezelfde vragen geeft het verloop). In de vaste AI-gatenlijst van Demand Radar (`gaps?latest=1`, 91 koopvragen) staat niets uit haar vak.

- Tania wordt genoemd bij 4 van de 36 vragen: bekendste Nederlandse operazangeressen, mezzosopranen, zangeressen uit Curaçao en musici uit Curaçao. taniakross.media wordt bij geen van de 36 als bron aangehaald.
- Open gaten waar Tania een juist antwoord is (feiten van haar eigen pagina /dagvoorzitter):
  - Dagvoorzitter die Nederlands, Engels, Spaans en Papiaments spreekt: AI "kan geen dagvoorzitter vinden die aantoonbaar alle vier spreekt". Tania presenteert in precies die vier (Talen op een rij).
  - Bekende Nederlander die dagvoorzitter is en ook zingt: AI noemt Paul de Munnik. Tania: The Art of Healing, Erasmus Universiteit 2026, voorzitter met muzikaal intermezzo.
  - Dagvoorzitter voor muziek en gezondheid: AI noemt Michelle Willemsen. Tania: Paleissymposium Music and Mind, Music as Medicine, 2025.
  - Dagvoorzitter voor Caribisch Nederland of het Koninkrijk: AI noemt Lisette Wellens.
- Open gaten in haar vak:
  - Papiamentse of Caribische liederen voor een koor: één bron met drie titels (waaronder van podcastgasten Levi Silvanie en Izaline Calister), of Jamaicaanse volksliedjes.
  - Inzingoefeningen voor een koor en hoger leren zingen: alleen Engelse bronnen.
  - Solist of workshop voor een koor, operazangeres boeken voor een gala: boekingssites (evenses.com, artiest.nu); Tania ontbreekt.
  - Podcast over Curaçao, met Caribische makers, over nation building: A Kross ontbreekt; de bron is steeds Apple Podcasts.
  - Nederlandstalige radio op Curaçao: Middagmagazine ontbreekt.
  - Carmen in het buitenland en de winnaar van The Masked Singer: Tania ontbreekt.
- Waar AI zijn antwoorden haalt: sprekersbureaus (quality-bookings.nl, sprekershuys.nl, despreker.nl, showbird.com), linkedin.com, podcasts.apple.com, Wikipedia, evenses.com, artiest.nu. Daar moet het antwoord staan, in de woorden van de vraag.
- Henkjan 27 nov 16:02 UTC op het voorstel: "1. Eventueel als heel goed betaald. Nee niet solist . 2. Ja mag 3. Ja . Zet alles online voor organische groei mogelijkheden maar niet prominent op site maar wel als verkeer generator ." Dus: workshop of masterclass voor een koor alleen op aanvraag (geen prijs op de pagina, alleen als het heel goed betaald is), nooit Tania als solist aanbieden; vindpagina's wel online, maar niet in het menu en niet op de homepage.
- Live sinds 27 nov 16:14 UTC (dpl_Ah4UygDo5HD4m6kUsyGXSAWhdJau, proef tk-vindpaginas-1127 tot 25 dec, tot dan niet wijzigen):
  - https://taniakross.media/koren : Tania en koren. Dameskoor Music Is Love, ambassadeur KBZON, Talent Masterclass Podium Klassiek, koorrepertoire dat ze zong, Katibu di Shon, knop Masterclass aanvragen (WhatsApp naar Dorien), 5 vragen met antwoord. Code `api/_vind.js` (koren).
  - https://taniakross.media/middagmagazine : het Middagmagazine, live gelezen uit de sectie radio van de homepage (luisterlink, recente gesprekken, gast worden), tijden in Curaçao en Nederland, 5 vragen. Code `api/_vind.js` (middag).
  - /dagvoorzitter: titel "Dagvoorzitter in vier talen: Tania Kross", 4 vragen bovenaan de FAQ (vier talen, zingt ook, muziek en gezondheid, Curaçao en Koninkrijk), link naar /koren en /middagmagazine.
  - De twee nieuwe pagina's draaien in de functie van api/dagvoorzitter.js (`?p=koren`, `?p=middagmagazine`, rewrites in vercel.json): geen nieuwe Vercel-functie. Ze staan in de sitemap en llms.txt (api/seo.js), niet in menu of homepage.
- Nog te doen: IndexNow-melding van /koren en /middagmagazine (`/api/seo?a=indexnow&urls=...` met de sleutel, of via Search Console), aanmelden in Search Console (Henkjan kiest welke Chrome), de omschrijving van A Kross op Apple Podcasts en Spotify en de LinkedIn-regel (teksten hieronder, Tania of Henkjan plakt ze), Carmen en The Masked Singer als feit op /vragen (alleen met bron), Papiamentse liederen voor koren (pas met materiaal van Tania).
- Te plakken (A Kross, Apple Podcasts en Spotify): "A Kross is de Nederlandstalige podcast van mezzosopraan Tania Kross over Curaçao: gesprekken met Caribische makers, denkers en bouwers over cultuur, identiteit en nation building. Elke aflevering heet naar de gast." LinkedIn, onder Tania's kop: "Dagvoorzitter en moderator in vier talen (Nederlands, Engels, Spaans, Papiaments) · mezzosopraan · presentator Middagmagazine Curaçao.nu".
- Eerder voorstel (afgehandeld zoals hierboven): (1) de dagvoorzittervragen letterlijk met antwoord op /dagvoorzitter, in Tania's LinkedIn en in het profiel bij het bureau; (2) "Tania voor koren": pagina Papiamentse liederen voor koren met uitspraak door Tania, wekelijks "Inzingen met Tania" per mail (een dirigent die zich aanmeldt bereikt een heel koor, dus ook een route naar de lijst) en een boekpagina voor solist en workshop als Tania dat doet; (3) omschrijving van A Kross op Apple Podcasts en Spotify in de woorden van de vraag; (4) pagina over Middagmagazine; (5) Carmen en The Masked Singer als feit op /vragen.
- Zoekvolume uit bestaande thema's, NL per maand: dagvoorzitter 480 en dagvoorzitter inhuren 180; kan iedereen leren zingen met varianten rond 800 (thema stemcoach); muziek bij begrafenis, uitvaart en crematie ruim 1.400 (thema muziek-medicijn); masked singer winnaars rond 300 met België.
- Koren hebben nog geen cijfers in Demand Radar. Nieuw thema voor repo demand_radar, `api/zoekvraag.js`, in THEMA (tk-chat kreeg in deze sessie geen schrijftoegang tot die repo; staat als taak in Henkjans lijst). Zonder `vrij`: de data wordt gekocht zodra de dagrem ruimte heeft, hooguit $0,45.

```js
  // taniakross.media, 27 nov 2026 (Henkjan: "Longtail rond podcast , zingen, Concerten . Enz er zijn duizenden koren bijv in NL ."): wat koren, dirigenten en zangers zoeken.
  'tk-koren': { naam: 'Koren, zingen en concerten (longtail taniakross.media)', markten: ['NL', 'BE'], max: 0.45, bron: 'suggest',
    ow: [['ruis', /songtekst|lyrics|akkoorden|chords|karaoke|mp3|download|kleurplaat|puzzel|kruiswoord/], ['koor zoeken en beginnen', /koor zoeken|koor in de buurt|bij een koor|koor gezocht|koorleden|auditie|koor beginnen|koor oprichten/], ['repertoire en liederen', /repertoire|liederen|liedjes|kerstliederen|meerstemmig|arrangement|bladmuziek|papiaments|antilliaans|caribisch/], ['inzingen en techniek', /inzing|stemoefening|opwarm|ademsteun|ademhaling|zangtechniek|hoog zingen|hoger zingen|vals zingen|zuiver zingen/], ['stemsoort', /stemsoort|stembereik|sopraan|\balt\b|tenor|bariton|\bbas\b/], ['dirigent, workshop en solist', /dirigent|workshop|masterclass|koordag|scratch|solist|zangeres boeken|operazangeres boeken/], ['concert', /concert|kerstconcert|passion|requiem|messiah|uitvoering/], ['podcast', /podcast/]],
    zaden: ['koor repertoire', 'inzingen koor', 'inzingoefeningen', 'stemoefeningen zingen', 'ademsteun zingen', 'workshop voor koor', 'koor workshop zang', 'solist voor koor', 'kerstconcert koor', 'meerstemmig zingen', 'hoger leren zingen', 'vals zingen', 'welke stemsoort heb ik', 'stembereik testen', 'koor zoeken', 'koordirigent gezocht', 'papiamentse liedjes', 'antilliaanse liedjes', 'operazangeres boeken', 'zangeres boeken kerst', 'podcast klassieke muziek', 'podcast curacao', 'scratch koor', 'koordag'],
    regex: '(koor|koren|koorzang|inzing|stemoefening|ademsteun|zangtechniek|meerstemmig|stemsoort|stembereik|sopraan|bariton|dirigent|solist|kerstconcert|scratch|leren zingen|hoger zingen|vals zingen|zuiver zingen|papiamentse lied|antilliaanse lied|operazangeres boeken|zangeres boeken|podcast klassiek|podcast curacao|podcast opera)' },
```
<!-- vind -->

## Logboek (nieuwste boven)

- 27 nov 16:20 UTC tk-chat: op Henkjans "Zet alles online" live gezet (dpl_Ah4UygDo5HD4m6kUsyGXSAWhdJau, bestandslijst van dpl_BoveGUD3 plus api/_vind.js, api/dagvoorzitter.js, api/seo.js, vercel.json): /koren en /middagmagazine als vindpagina's (niet in menu of homepage, wel sitemap en llms.txt) en /dagvoorzitter met de letterlijke AI-vragen. Alles gecontroleerd: 200, JSON-LD in orde, geen gedachtestreepjes, homepage ongewijzigd. Proef tk-vindpaginas-1127 tot 25 dec. Zie sectie 13.

- 27 nov 15:15 UTC tk-chat: kansen in AI gemeten in Tania's vak (gatscan tk-branche-1127, 36 vragen bij Perplexity): genoemd bij 4, site bij geen enkele aangehaald, grootste gat de dagvoorzitter in vier talen. Uitkomst, voorstel "Tania voor koren" en het nieuwe Demand Radar-thema tk-koren staan in sectie 13.

- 27 nov 14:00 UTC tk-chat: Google-weergave live nagekeken (omschrijving 151 tekens, 4 JSON-LD-blokken geldig, voetregel met Dorien en de nieuwste podcast) en als proef gemeld in ZICHT (tk-google-weergave-1127). Plan voor zoekverkeer in sectie 13, los te lezen met `deel=vind`, wacht op Henkjans ja. tk-chat doet alleen vindbaarheid.

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
