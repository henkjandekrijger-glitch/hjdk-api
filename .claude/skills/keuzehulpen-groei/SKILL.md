---
name: keuzehulpen-groei
description: Overdracht en dagritme voor het account dat elke dag de keuzehulpen laat groeien (keuzehulp.best, whichtobuy.best, kaufberater.best): stand, toegang, harde grenzen, dagronde, proeven, campagne, affiliate, open punten en valkuilen.
---

# Keuzehulpen: elke dag groei (overdracht voor het eigen account)

Henkjan, 23 nov 2026: "Ik ga apart account maken voor keuzehulpen groei per dag geef me een zeer complete handover."

Bron: repo henkjandekrijger-glitch/hjdk-api, `.claude/skills/keuzehulpen-groei/SKILL.md`. Live (altijd de versie van main): https://hjdk-api-henq.vercel.app/api/zicht?op=skill&naam=keuzehulpen-groei. Verander je de werkwijze, pas dan dit bestand aan in dezelfde commit en zet een regel in het logboek van `lib/overdracht-kz-tekst.js`.

Deze overdracht is de ingang. De levende stand staat niet hier maar op de pagina's onder 1; die worden bij elke opvraag opnieuw opgebouwd. Wat een andere skill al regelt staat hier alleen als verwijzing.

## 0. Wat dit account doet

Elke dag de keuzehulpen beter laten scoren, gemeten in:

1. **Bezoek uit Google, Bing en AI-assistenten** per site (eigen keuzehulppagina's, niet de verhuisde Curaçao-inhoud).
2. **Pagina's in Google** per site.
3. **Intenties en contact per 100 bezoekers** in de chat (proef kzuxnl, kzuxus, kzuxde).
4. **Inkomsten**: doorverwijzingen naar bol, Amazon, Awin en (vanaf nu) Daisycon. Dashboard: https://keuzehulp.best/api/bol?op=inkomsten&vorm=html

**Taakverdeling** (Henkjan 23 nov 2026: "ontwikkeling blijven we hier doen"): dit account doet de dagelijkse groei: meten, repareren, verbeteren binnen wat er staat, proeven beslissen, nieuwbouw binnen de rem, aanmeldingen en melden. Nieuwe ontwikkeling (nieuwe functies zoals de haken, de chat voor je hele leven, de koppeling met sharedby, nieuwe soorten pagina's) blijft in de ontwikkelchat (werklog wie=kz-chat). Zie je daarvoor een kans of een lek dat om nieuwe bouw vraagt: zet het als voorstel in het werklog en meld het Henkjan, niet zelf bouwen.

Niet van dit account (eigen overdracht, eigen chat): Curaçao-gidsen en bedrijvengids (curacao.day), chirurgie, Kadoly en de cadeaugids, Spaarpot, KDP, WAM, Sealed Intent, Clickmind zelf, de Amazon-blanket. Zie CLAUDE.md voor hun overdrachten. Raak hun campagnes en code niet aan; meld wat je ziet.

## 1. Elke sessie eerst

1. `git pull --rebase` in de repo. Is lokaal Git-netwerk niet beschikbaar, lees en schrijf via de GitHub-connector; gebruik bij de laatste stap de actuele main-SHA als lease en behoud werk van andere chats.
2. Lees met de Vercel-tool `web_fetch_vercel_url` (curl naar deze domeinen wordt door de proxy geblokkeerd):
   - de levende overdracht van de keuzehulpen: https://hjdk-api-henq.vercel.app/api/kz?op=overdracht (groot, ruim 350.000 tekens: bewaar het resultaat en lees per kop; koppen: Stand nu, Dagmeting, Vindbaarheid per site, Proeven, Crons, Open punten, Logboek);
   - de algemene handover: https://hjdk-api-henq.vercel.app/api/mm/handover (werklog van alle chats, budget, slots);
   - de chatproeven: https://hjdk-api-henq.vercel.app/api/mm/proefstand?site=kzuxnl&vorm=tekst (ook kzuxus, kzuxde, tafelnl, tafelus, tafelde, deel, chatbewijs).
3. Volg bij het werk de skills in de repo: `keuzehulp-bouw` (bouwen en UX), `zicht-seo-llm` (vindbaarheid en AI), `mail-lerend` (elke mail), en via de PropellerAds-connector `campagne_skill` (elke campagne).
4. Kijk of er sinds de vorige sessie runtime-fouten zijn: Vercel `get_runtime_errors` voor project hjdk-api.

## 2. Toegang

| Wat | Hoe |
|---|---|
| Repo | henkjandekrijger-glitch/hjdk-api, branch main. Push naar main = uitrol (1,5 tot 5 minuten; bij drukte staat een uitrol even in de wachtrij) |
| Vercel | project hjdk-api `prj_xAWlThjvk5VfU9AMN8GGI8LrdOSF`, team `team_9EYxyAU5QDExrrrOSKamefJT` (henq). Lezen van live pagina's: `web_fetch_vercel_url` op https://hjdk-api-henq.vercel.app/... (toont keuzehulp.best) |
| PropellerAds | eigen MCP-connector "Propads Henkjan" (campagnes, creatives, zones, stopregel, slots) |
| Demand Radar | https://demandradar-ivory.vercel.app (gaten, zoekvraag, niche). Zoekvolumes via onze eigen route: `/api/zicht?op=volumes&cc=NL&v=term1|term2` (Google Ads, 25 maanden, zonder token 8 keer per dag, max 60 termen) |
| Search Console | service-account heeft toegang tot alle drie de sites; via `/api/gsc?...` en de ZICHT-ronde. Bing Webmaster: alle drie geverifieerd |
| Awin | publisher 3159915, promo space `promo:3628944` = https://keuzehulp.best. API via de Vercel-variabele AWIN_TOKEN; aanmelden gaat via de website (Chrome) |
| Resend | mail van henkjan@whichtobuy.best (geverifieerd), antwoord naar Henkjans Gmail. Domeinlimiet 10 |

Sleutels staan als gedeelde team-variabelen in Vercel. Nooit tonen, ontsleutelen, of in code, pagina's, URL's of het werklog zetten. Vul zelf nooit een wachtwoord of token in.

## 3. Henkjan: hoe hij werkt en wat vastligt

- Praat Nederlands, gewoon en kort. Geen jargon, geen aankondigingen, geen stapels getallen. Wel alles wat ertoe doet.
- Hij is niet technisch: jij bouwt, test en rolt uit. Laat altijd eerst zien (een klikbare link, of het ontwerp als artifact) voordat iets nieuws live gaat.
- Ontwerp: maximaal contrast, nooit grijs, één tekstmaat (16 px), titels groter, zo min mogelijk UX-variabelen, ronde zwarte pills. Ontwerpen als gewone artifact-pagina, niet als Design-canvas.
- Nooit nullen of "nog geen" tonen op sites of in mails: laat de regel weg.
- Mail: altijd via de POST-lus (skill mail-lerend), altijd met een Clickmind-meetlink, laat de echte mail eerst in de chat zien. Verstuur via Resend.
- Elke aanmelding bij een affiliate-programma stuurt de passende keuzehulp van dat merk mee, kort en zakelijk, merknaam ingevuld.
- Bouw bij alles de controle mee die meet of het werkt, met een drempel. Blijf nooit langer dan 15 minuten hangen op een fout; na één mislukte herhaling een andere aanpak of melden.
- Wees zuinig met tokens en met cloudkosten.

**Harde grenzen campagnes** (skill campagnes-henkjan, connector `regels`):
- Bod, budget, status of planning alleen met Henkjans woord, of via de stopregel (een campagne die duidelijk verlies maakt mag uit; relatieve drempels).
- Hoogstens $10 per dag per campagne; totaal zonder bewezen omzet hoogstens $100 per dag netto; testprojecten hoogstens $20 per dag en 10 dagen.
- Altijd CPA, start op 0,01 (uitzondering met zijn woord: airfryer op 0,03), nooit auto-creatives, 8 creatives met CTA-knop, mobiel voor push.
- Een kopie kost een startslot (hoogstens 5 per dag) en stopt de voorganger.
- Nooit campagnes aanpassen waar hij niet om vroeg; nooit in bulk aanzetten.
- Geen campagne op /chat. Campagne 12168044 blijft staan tot hij "stop NL" zegt.

## 4. De sites en de stand (23 november 2026)

| Site | Land, winkel | Keuzehulpen | Google 28 dagen (eigen pagina's) | In Google |
|---|---|---|---|---|
| keuzehulp.best | NL, bol (Site-ID 1547300) | 511 | 16 vertoningen, 0 kliks | 14 van 165 gecontroleerd |
| whichtobuy.best | VS, Amazon | 176 | 18 vertoningen, 0 kliks | 10 van 190 |
| kaufberater.best | DE, Amazon | 131 | 11 vertoningen, 2 kliks | 7 van 128 |

- Gebruik van de gidsen (antwoord kiezen of advies versturen) 22 nov: NL 3, VS 108, DE 20.
- Perplexity noemt ons in 0% van de testvragen; AI noemt wel coolblue.nl, beterbed.nl en dergelijke.
- **Ontdekking en indexering blijven het gemeten knelpunt; inhoudskwaliteit is daarmee niet bewezen.** De hele-host-crawlteller meldt op 23 nov 538 Googlebot-UA-events in 7 dagen, na de tellercorrectie van 21 nov. Dat bewijst geen groei van zoekverkeer of indexering en is niet rechtstreeks vergelijkbaar met de oude onvolledige teller. Daarom geldt de nieuwbouwrem (`lib/organic-policy.js`): bij minder dan de helft in Google hoogstens 2 nieuwe pagina's NL, 1 VS en 1 DE per dag; op keuzehulp.best de kernfase (alleen de kern open en in de sitemap, de rest noindex). Verbeteren van pagina's op plek 4 tot 20 gaat voor nieuwbouw.
- Inkomsten 30 dagen: €0 bij bol en Awin (dashboard hierboven). Elke eerste verkoop is nieuws.

## 5. De dagronde

De crons draaien vanzelf (lijst in de overdracht onder "Automatische rondes"). De expliciet gevraagde dagelijkse ChatGPT-ronde staat vanaf 24 nov ingesteld rond 08.00 Curaçao; controleer de bestaande taak voordat je er een maakt. Bewaar elke dag een geaggregeerde beginstand en beslissing in data/keuzehulpen-groei/JJJJ-MM-DD.json, zonder persoonsgegevens. Dit account doet elke dag, in deze volgorde:

1. **Lezen** (sectie 1). Wat is er sinds gisteren veranderd: vertoningen, kliks, pagina's in Google, gebruik, fouten.
2. **Fouten eerst.** Runtime-fouten, mislukte crons, een bouwmotor die stilstaat ("Laatste fout in de bouwmotor" in de overdracht), de huisstijlkeuring (`/api/kz?op=keuring&lees=1`). Repareren, `node scripts/rooktest.mjs` draaien, uitrollen, live nakijken.
3. **ZICHT** (skill zicht-seo-llm): stand per site, proeven met uitslag vandaag beoordelen, 1 tot 2 verbeteringen op pagina's die al vertoningen hebben (titel met zoekterm voorop, FAQ met de echte zoekvraag, een eerste keus met getal), IndexNow voor wat veranderde.
4. **Chatproeven**: lees de proefstanden. Heeft een factor een winnaar (kans beste 95% en 300 gezien per versie), maak die de standaard in de code, zet de verliezer uit en zet de volgende uitdager erin. Eén factor per dag.
5. **Nieuwbouw** binnen de rem, volgens skill keuzehulp-bouw: eerst wat Henkjan vraagt, dan de open punten, dan AI-gaten uit Demand Radar zonder eigen keuzehulp, dan de rangorde van `onderwerpScore`.
6. **Geld**: inkomstendashboard, nieuwe Awin-goedkeuringen (link naar de passende keuzehulp zetten), afwijzingen (opnieuw aanvragen zodra de passende keuzehulp er is), mails aan merken via de POST-lus.
7. **Campagne(s)** van de keuzehulpen: alleen wat bij de keuzehulpen hoort (nu de airfryer, zie 7). Kosten per chatvraag tegen de grens.
8. **Melden en vastleggen**:
   - één kort bericht aan Henkjan: wat beter werd, wat niet, wat geleerd is, wat morgen komt, met zoekverkeer erbij, zonder nullen;
   - werklog: `https://hjdk-api-henq.vercel.app/api/mm/handover?log=<wat je deed en wat er nog ligt>&wie=kzgroei-<chat>`;
   - logboek in `lib/overdracht-kz-tekst.js` (nieuwste bovenaan, één regel, nooit mailadressen);
   - verander je hoe iets werkt: `lib/werking.js` bijwerken en `WERKING_DATUM` op vandaag.

**Werktempo vanaf 23 nov (Henkjan: "doe zoveel mogelijk op een dag")**: werk de volledige geprioriteerde ronde af; stop niet na één verbetering. Bundel onafhankelijke reparaties en verbeteringen in één geteste uitrol. Nieuwbouwrem, privacy, campagnebudgetten en één chatproeffactor per dag blijven gelden. Nieuwe ontwerpen eerst als werkend voorbeeld tonen. Meer werk is geen groeibewijs: meld bereik, bruikbaar advies, rekengebruik en bevestigde opbrengst afzonderlijk. Lees ook data/keuzehulpen-groei/voorkant-plan-2026-11-23.json voor de expliciet gevraagde complete voorkant en de geplande rekenhulpen; status gepland is niet gebouwd.

Aanvullende werking van de avondronde: docs/keuzehulpen-groei-werking-2026-11-23.md. De oude volledige overdracht blijft intact; lees ook deze wijzigingsnotitie en het levende werklog.

## 5c. Elke dag UX en vindbaarheid (27 november 2026)

Henkjan, 27 nov 2026: "Ja en optimaliseer dagelijks voor UX en Organische vindbaarheid zet dat ook in dashboard ." Sinds die dag hebben alle productkeuzehulpen op de drie sites één sjabloon (`lib/sjabloon.js`, controle `node scripts/test-sjabloon.mjs`; terugval per site: kv `kz:sjabloon:uit` of `wtb:sjabloon:uit` op 1, of `?sjabloon=1`). De dagronde doet elke dag, na stap 2:

1. **UX-controle, 3 pagina's per dag** (één per site, elke dag andere; begin bij wat de meeste bezoekers had): haal ze op met web_fetch_vercel_url (`https://hjdk-api-henq.vercel.app/api/kz?slug=<slug>`, `/api/wtb?m=us&slug=<slug>`, `/api/wtb?m=de&slug=<slug>`). Moet kloppen: één eerste keus met prijs en één zwarte knop, de 3 beste met prijs, hoogstens 3 pills die bij de pagina passen, geen interne zin in beeld, geen grijs, geen dubbele producten in de tabel, geen losse zinnen bij "Waar je op let", FAQ zonder "niet gevonden". Fout in de data: repareer de data (kort antwoord, uitleg, FAQ). Fout in het sjabloon: repareer `lib/sjabloon.js` en draai de test.
2. **Chat**: stel op één pagina per site de eerste pill via `POST /api/keuze-tools?tool=intentie&op=chat` (of in Chrome). Het antwoord moet één product noemen dat op de pagina staat. Lees `/api/keuze-tools?tool=intentie&op=chatanalyse`: de vraag met de meeste "weet niet" krijgt een antwoord in de data van die pagina.
3. **Lekken in de pagina**: winkelkliks per 100 bezoekers per site (tellers `hjdk6-kz-<slug>-clk`, `wtb-<m>-<slug>-clk`, chat `*-sj-vraag`, volgen `*-sj-volg`, aanmelden `*-sj-mail`). Het blok met de grootste val is het lek van vandaag (leerlus, B = MAP); één verbetering per dag, eerst in de data, dan in het sjabloon.
4. **Vindbaarheid**: `/api/gsc?op=paginas&host=<host>&dagen=28` per site: wat steeg, wat zakte. In Search Console (Chrome, Henkjans Gmail is eigenaar van alle drie de domeinen) per dag hoogstens 5 indexeringsverzoeken per domein voor pagina's die het sterkst zijn en nog niet in Google staan; nooit voor dunne of verborgen pagina's. Een zoekvraag op plek 4 tot 20: titel met de zoekterm voorop en de vraag letterlijk als eerste FAQ. IndexNow voor elke gewijzigde pagina.
5. **Vastleggen op het dashboard** (project keuzehulpen): `nu` = zoekbezoeken per dag, één regel in het werklog met `wie=keuzehulpen-dagronde` (wat er gerepareerd is, welk lek, wat er ingediend is) en de stand met `chat.naam` `keuzehulpen-dagronde`. Geen nullen melden.

Stopregel: staat er in het werklog al een regel van `keuzehulpen-dagronde` met de datum van vandaag, dan is de ronde gedaan.

## 5a. Onderwerpkeuze die leert (23 november 2026)

Lees data/keuzehulpen-groei/potenties-2026-11-23.json voor de bevroren eerste rangorde, bronnen, tegenbewijs en ontwikkelopdracht. Begin bij thuisbatterij met stekker en de bestaande Marstek/HomeWizard/Anker-vergelijking (NL), daarna balkonopslag achteraf in DE en pompnoodstroom in de VS. Alle kandidaten bestaan al; controleer steeds de actuele catalogus en sitemap. Maak geen tweede pagina voor dezelfde keuzevraag.

Behandel volume als een schatting per term, tel synoniemen niet op en noteer de bronversie. De nichedata van 23 nov is onvoldoende voor een zwakke-top-10-claim (89 van 90 teruggegeven rijen tonen alleen google.com in top3). Hotel near me zonder locatie is geen bewezen AI-gat. De bouwmotor vraagt /api/llmgap op dat nu 404 geeft; de actuele cache staat op /api/gaps?latest=1. De terugmeldfunctie meldUitkomst heeft geen gevonden aanroep in deze repo. Nieuwe koppeling en selectiecode gaan als concrete ontwikkelopdracht naar kz-chat; claim niet dat die al werkt.

Leg vóór elke inzet vast: vraag, gekozen en afgewezen onderwerp, huidige beperking, URL, bron/venster, traffic-segment, teller/noemer, wijzigings- en blootstellingsdatum, verwachte uitkomst, tegenbewijs en evaluatiemoment. Onderzoek na 7 dagen eerst meetdekking en ontdekking. Een SEO-oordeel vereist volwassen gescheiden vensters, minimaal circa 35 dagen na de echte ingreep en voldoende data. Beoordeel later ook of de vooraf voorspelde onderwerpvolgorde klopt. Meer bots, pill-kliks of zoekvolume bewijst geen omzet. Bescherm lopende SEO-proeven; herstel een aantoonbaar fout product wel en leg die meetverstoring apart vast. Geen onbewezen tweede pagina of verplichte dagelijkse nieuwbouw.

## 5b. Focus organisch en mobiliseren (26 november 2026)

Lees data/keuzehulpen-groei/focus-2026-11-26.json. Volgorde tot een nieuwe meting iets anders zegt:

1. Curaçao-bedrijfspagina's waar Google ons al op plek 4 tot 15 toont: tot 3 per dag in plaats van 1, elk feit met een officiële bron, volgens OVERDRACHT-CURACAO-BEDRIJFSPAGINAS.md. Geen feit zonder bron.
2. keuzehulp.best: de kern terug in Google (`/api/kz?op=kern`, 26 nov: 9 van 139). Wijzig geen inhoud van pagina's in een lopende proef. Verversen gebeurt overdag in de Claude-chat met de tokens van die chat, met de Vercel AI Gateway als reserve, en pas op Henkjans woord; de volgorde staat in het focusbestand.
3. VS en DE: Googlebot leest nauwelijks. Geen nieuwe gidsen om dat op te lossen.

Mobiliseren per bedrijf (lib/mobiliseer.js): achter de chat staat een blok 'Ik heb dit ook' zodra een bedrijf met een gepubliceerd dossier op we are many now op de pagina staat of in de chat genoemd wordt. Lees elke dag `https://hjdk-api-henq.vercel.app/api/keuze-tools?tool=mobi&op=meet` (stappen per site, bevestigde aanmeldingen, lek) en meld alleen wat bewoog. Meldt het veld `lek` iets: pas één ding aan, de regel of de knoptekst in MOBI of T. Komt er op de dossiersite een dossier met ik-ook bij: regel in MOBI, `node scripts/test-mobiliseer.mjs`, en kijk of een bestaande keuzehulp dat bedrijf noemt. Zet nooit een bedrijf zonder dossier in MOBI.

Doel sinds 26 nov (Henkjans woord): minimaal 100 zoekbezoeken per dag en 100 chats per dag met 1 aankoop per dag, affiliate of eigen. Meld elke dag de drie getallen: zoekbezoeken, chats, aankopen.

Chat op 26 nov gelijkgetrokken: één kop op alle pagina's, een wedervraag als de chat een getypte vraag niet kan plaatsen, nexy.help en lastingchange.works uit de proef van de keuzehulpen. Reken een uitslag van de Nederlandse proef pas op waarnemingen vanaf 27 nov. Rotterdam: alleen de dienstpagina's staan open voor Google (lib/rdam.js ZAAK_IN_GOOGLE); eerste oordeel 10 dec op `/api/zicht?op=stand&site=rotterdam`.

## 6. Lopende proeven in de chat (stand 23 nov 15:02 UTC)

Dagronde 23 nov: uitsluitend factor pillflow beslist voor VS en DE. In VS won a met waarde 3,20 tegen 0,69 (4.432 tegen 601 gezien; intenties 356 tegen 5); in DE 4,97 tegen 1,16 (2.056 tegen 332; intenties 295 tegen 2). Beide voldeden aan 300 per arm en 95% kans volgens het bestaande model. Versie a blijft de standaard; b staat in de code uit. Alleen oude b-beslissingen worden opnieuw opgehaald, zodat ze niet zes dagen doorlopen. Ronde 3 en de andere factoren blijven bewaard. NL wacht nog op 300 voor a. De meeste waarnemingen komen van Android; dit is geen omzetbewijs. Geen nieuwe variant verzonnen: geef een volgende uitdager door aan ontwikkelchat kz-chat.

Proef kzuxnl (ronde 3). Waarde per bezoeker: tik 1, pill 2, vraag 4, quiz 6, winkel 10, blijf 12, onthoud 15, deel 25, intentie 30, datum 30, gekoppeld 40, contact 45.

| Factor | Stand | Wat te doen |
|---|---|---|
| pillflow | b (vaste stappen met pills) 2,14 tegen a 0,42, kans beste 99%, 537 tegen 120 gezien | Zodra a ook 300 gezien heeft: b standaard maken in `lib/kzux.js`, a uit |
| meer | a (wel vragen, 4 pills) 1,28 tegen 0,74, kans 90% | Wachten op 300 per versie |
| onthoud | b (na het tweede antwoord) 1,07 tegen 0,92, kans 64% | Wachten |
| start | a 1,02 tegen c 1,08; b staat uit | Wachten |
| haak (sinds 21 nov, alleen /airfryer) | b peiling 2,35 (26 gezien), d 1,82, c 1,36, e 0,73, a 0,30 | Wachten op 300 per versie; daarna de winnaar naar de keuzehulpen met het meeste verkeer (inhoud per pagina in `HAAK` in `lib/haak.js`) |

De haken (lib/haak.js):
- b peiling boven de chat, met wat anderen kozen vanaf 5 stemmen;
- c kennistest: score, "beter dan x%" vanaf 10, vriend uitdagen, contact met dezelfde score;
- d peiling na het eerste antwoord;
- e uitdaging jij tegen je vriend;
- `?uitdaag=<score>` geeft altijd de test met de score van de vriend.

Stand: `/api/keuze-tools?tool=haak&op=stand`. De voorstelmail (drie mensen met dezelfde score krijgen samen één mail) draait elke 2 uur (`tool=haak&op=voorstel`), maar verstuurt pas als kv `haak:zend` op 1 staat. Henkjan heeft de mail gezien maar nog geen "verstuur" gegeven.

Proeven op vindbaarheid: zie de overdracht onder "Lopende en afgeronde proeven". De meeste krijgen hun uitslag tussen 2 en 26 december.

## 7. Campagne airfryer (PropellerAds 12171454)

- KEUZEHULP AIRFRYER CHAT NL, kopie van 12168044, In-Page, Android, NL, bod 0,03 (Henkjans woord), $10 per dag, $30 totaal, 8 creatives met knop "Vraag het", wissel kz-airfryer (Clickmind naar keuzehulp.best/airfryer, conversie = chatvraag). Advertentievragen als eerste pill in `lib/advraag.js`.
- Grens: kost per chatvraag hoogstens 3x KB DE ($0,028), dus $0,084.
- Stand 21 tot 23 nov: 229 kliks, 7 chatvragen, $2,39, dus $0,34 per vraag. Sinds de nieuwe chat (21 nov 12:40 UTC) ongeveer $0,28 per vraag. Beste creatives 27794351 ($0,12 per vraag) en 27794350 ($0,20); 27794352, 27794345, 27794349 en 27794348 zonder vraag.
- **Gestopt op 23 nov 2026** met Henkjans woord ("Ja stop airfriyer"): grens $0,084 per chatvraag, gemeten ongeveer $0,28 sinds de nieuwe chat. Niet zelf weer aanzetten. Wat geleerd is: dit In-Page-verkeer stelt weinig vragen; de chat op /airfryer en de haken lopen door op ander verkeer.

## 8. Geld: affiliate en inkomsten

- **Inkomstendashboard** (`lib/inkomsten.js`, `/api/bol?op=inkomsten&vorm=html`): bol plus Awin-transacties. Daisycon, Impact en Amazon moeten er nog bij.
- **Awin** (`lib/aff.js` awinProg, `data/awin-keuzehulp.json`):
  - 21 nov opnieuw aangemeld met de juiste keuzehulp bij 16 programma's, waaronder OfficeCity (/bureaustoel), Navimow (/robotmaaier), Xiaomi (/robotstofzuiger), LUX Pannen, X-Sense, Fiido, Babor, 5 internetaanbieders, Simyo en 50plus Mobiel. Sanitair Online (/regendouche) is goedgekeurd.
  - Bij 8 aanvragen (X-Sense, Fiido, Babor, Trined, Odido Thuis, Freedom, Internetten, Ziggo) stond de promo space op "Content" in plaats van keuzehulp.best; het bericht met de juiste link ging wel mee.
  - Afgewezen programma's mogen 20 en 21 december opnieuw, met de juiste keuzehulp.
  - Nog te bouwen voor aanmelding (`nog_bouwen`): camping Frankrijk (Camping and Co, EPC €19,20), pizzaoven (Ooni, Fornello), smartphone (Honor), tent en kamperen, hotel.
  - Niet aanmelden: verzekeraars (AFM-vergunning nodig), Odido Mobiel (verbiedt advies), gokken, volwassenen, mode.
  - Mogelijk AFM-risico op /verzekeringen en de aanmelding bij Surebird: nog uitzoeken (aangeboden aan Henkjan).
- **Mails aan merken** (`lib/awinmail.js`, `/api/post?op=awinstuur&max=<n>`, `droog=1` om te kijken):
  - alleen ids uit `data/awin-zend.json`;
  - controle of het merk echt op de gelinkte pagina staat;
  - Clickmind-link en open-meting;
  - van henkjan@whichtobuy.best, antwoord naar Henkjans Gmail.
  - Verstuurd 21 nov: De'Longhi, EcoFlow, AEG. Rustig aan, een paar per keer.
- **Daisycon**: Henkjan wilde daar na Awin mee verder ("morgen gaan we ook daisycon en zo af"). Nog niet gestart.

## 9. Ideeën die op Henkjans besluit wachten

- **Eén chat voor je hele leven**: leert je kennen, toont bij elke invoer wat anderen zoals jij kozen, contact met wie meechatte als die wil, werkt ook in je eigen AI-assistent, herinneringen.
  - Ontwerp: https://claude.ai/artifact/7RMofS9CH6Xk7pNNfN7245
  - Voorstel: samen met sharedby.ai, waarbij sharedby de mensen, pagina's en het geheugen levert en de keuzehulpen de kennis, de cijfers en de inkomsten.
  - Open vragen aan Henkjan: de naam (sharedby zelf of een eigen ingang), en inloggen pas bij de eerste herinnering of het eerste contact.
  - Verdienen: we verwijzen door, de aanbieder betaalt een klein bedrag, en bij elke doorverwijzing staat dat erbij.
- **Herinneringen, data van 21 nov**: naar "gezamenlijke reminders" zoekt bijna niemand (NL 10, VS 50 per maand). Mensen zoeken wel op de aanleiding:
  - verjaardagskalender NL 14.800 (piek november 27.100);
  - geburtstagskalender DE 9.900;
  - afvalkalender 22.200;
  - family calendar app VS 4.400;
  - medication reminder app VS 3.600;
  - reminder app VS 33.100.

  Voorstel was een gezamenlijke verjaardagskalender met cadeautip als eerste ingang.
- **Chat op curacao.day** heeft de nieuwe zwarte stijl nog niet (andere repo, todayin bzz). Henkjan kreeg dat aangeboden.

## 10. Open punten uit de overdracht

De volledige lijst staat in de overdracht onder "Open punten". De belangrijkste voor groei:

1. **Rotan hanglampen** (Bazar Bizar via Droppery in Kadoly): in de keuzehulpen zetten zodra ze op kadoly.com staan (VOORRANG, 18 nov). Marge 165 tot 600 euro per lamp.
2. **Intentiechat** op de WAM-motor, MyLevel-cursussen in de keuzehulpen, nexy.help overnemen (16 nov). Daarbij is het doel van Henkjan 100.000 intenties dit jaar.
3. **Rotterdam**: diensten per plaats als proefgebied (15 nov), `lib/rdam.js`.
4. **Dubbele pagina's** (strijkplank, kinderfiets): `lib/kwaliteit.js` voegt ze zelf samen zodra Google de zoekterm aan de sterke pagina geeft.
5. **Crawlval keuzehulp.best**: Googlebot leest sinds 20 okt nauwelijks; oorzaak nog niet gevonden. Volgen op `/api/zicht?op=crawl`.
6. **whichtobuy.best krijgt minder Googlebot-bezoek dan kaufberater.best**: uitzoeken waarom.
7. **Google Ads-zoekvolumes via /api/gads** wachten op de developer token van Henkjan; tot dan Demand Radar en `/api/zicht?op=volumes`.

## 11. Waar wat staat (code)

| Wat | Bestand |
|---|---|
| Site keuzehulp.best (pagina's, sitemap, llms.txt) | `fn/kz.js`, bouwmotor `fn/kzmaak.js` |
| whichtobuy.best en kaufberater.best | `fn/wtb.js`, `fn/wtbmaak.js`, `lib/wtb*.js`, `lib/kb-dienst.js` |
| Beslisgidsen (diensten) | `lib/dienstgids.js`, `lib/dienstgids3.js` (internet en tv, sim only, 21 nov), `lib/energie-keuze.js`, `lib/energie-page.js` |
| De chat (één chat op alle keuzehulpen) | `lib/kzux.js` (KX_CONTRAST = zwarte stijl sinds 21 nov), `lib/geheugen.js` (onthouden), `lib/tafel.js` (live tafel), `lib/haak.js` (haken), `lib/advraag.js` (advertentievraag als eerste pill), `lib/chatbewijs.js`, `lib/deel.js` |
| Huisstijl op alle pagina's | `lib/huisstijl.js` (ook het aanmeldvak #choice-updates), favicons in `img/kzc` |
| Proeven (Clickmind) | `lib/proef.js` (PROEVEN), stand `/api/mm/proefstand` |
| Vindbaarheid | `lib/zicht.js`, `fn/zicht.js`, `data/zicht-priors.json`, `fn/gsc.js`, `lib/organic-policy.js`, `lib/kwaliteit.js` |
| Demand Radar | `lib/demandradar.js` (sleutel DEMANDRADAR_KEY of DR_KEY) |
| Affiliate | `lib/aff.js`, `lib/inkomsten.js`, `lib/awinmail.js`, `data/awin-*.json`, `fn/bol.js` |
| Mail | `lib/postlus.js`, `fn/post.js`, skill mail-lerend |
| Router | Sinds 21 nov is de repo één Vercel-functie: `api/[hjdkfn].js` stuurt /api/<naam> door naar `fn/<naam>.js`. Nieuw eindpunt = bestand in fn/ en dan `node scripts/router-maak.mjs`; liever een op=... in een bestaand eindpunt. Controle `node scripts/router-maak.mjs --check`, live /api/routergezond |
| Routes | `vercel.json` (rewrites per slug, crons; tekstueel invoegen, niet het hele bestand herschrijven) |
| Controle | `scripts/rooktest.mjs` (airfryer, matras, voorpagina), `scripts/keur-huisstijl.mjs` |

## 12. Valkuilen (zelf meegemaakt)

- **Kosten**: elke push is een build (in november $182 aan bouwen). Eén push per afgeronde, geteste taak; commit zo vaak je wilt. Kostenwacht: https://opruimlus.vercel.app/overdracht
- **Een build-script in package.json breekt de uitrol** (Vercel "Other": geen public-map). De rooktest blijft een los npm-script; draai hem zelf vóór elke push.
- **Een commentaar dat een regel code opslokt** gaf op 21 nov een half uur 500-fouten op alle keuzehulpen. Daarom: `node --check` plus rooktest, en na de uitrol live nakijken.
- **Inline stijlen winnen van de stylesheet zonder `!important`.** Dat liet de knop van het aanmeldvak zakken.
- **Playwright headless wordt door onze eigen botcheck geweerd** (UA HeadlessChrome en navigator.webdriver). Zet bij testen een gewone UA en webdriver op false.
- **Een privacy-plugin weigert shell-commando's op bestanden met een mailadres** (zoals `lib/werking.js`). Gebruik dan de Read- en Edit-tools.
- **Nooit mailadressen in het logboek** (dat is openbaar via de overdracht) of in de repo.
- **De Gmail-koppeling van Claude herschrijft links naar google.com/url.** Mail daarom via Resend of Gmail in de browser, nooit met kapotte links.
- **Redis zit krap** (rond 250 MB). Nieuwe tellers altijd met een vervaltijd en per dag in een hash.
- **De overdracht is groot.** Lees per kop, niet in één keer in de context.
- **Een stopopdracht voor een campagne kan door de beveiliging worden geweigerd.** Vraag dan Henkjans letterlijke woord, of gebruik de stopregel.
- **Een dagkopie naast een lopend CPA-origineel verliest (24 nov).** De kopieën van 20 nov converteerden 7 tot 17 keer slechter dan hun origineel (DE 12168047 2,6% vraag per klik tegen 19,5%, US 12168048 0,8% tegen 13,5%): het origineel met geschiedenis wint de goede zones. Maak een kopie pas als het origineel op is of stopt, en wijzig geen creative van een lopende winnaar (moderatie). Eerste kopie volgens die regel: US 12182934 (24 nov).

## 13. Melden aan Henkjan

Kort, in gewoon Nederlands, alleen wat nieuw is:

- vooruitgang of niet, met het zoekverkeer erbij;
- wat werkt en wat niet;
- wat geleerd is;
- wat morgen komt;
- bij elk lek wat eraan gedaan is en wanneer de controle het volgende oordeel geeft.

Nooit nullen tonen.
