---
name: zicht-seo-llm
description: Gebruik bij elk werk aan vindbaarheid in Google/Bing of vermeldingen in AI-assistenten (ChatGPT, Perplexity, Copilot, Gemini, Claude), voor elk project: lees eerst het ZICHT-draaiboek, pas toe, meld proeven en inzichten terug.
---

# ZICHT: SEO en AI-vermeldingen, lerend voor alle projecten

Dit bestand is de bron van de skill. Het staat in de repo henkjandekrijger-glitch/hjdk-api (.claude/skills/zicht-seo-llm/SKILL.md), zodat het niet afhangt van een Claude-account: elke chat, elk account en elke andere AI-assistent kan het lezen. Live, altijd de versie van main: https://hjdk-api-henq.vercel.app/api/zicht?op=skill . Pas je de werkwijze aan, wijzig dan dit bestand (en zet een regel in het logboek van lib/overdracht-kz-tekst.js).

Eén gedeelde, lerende lus in de cloud (Vercel-project hjdk-api, lib/zicht.js en api/zicht.js).

- Adres: https://hjdk-api-henq.vercel.app/api/zicht
- Uitleg: https://hjdk-api-henq.vercel.app/api/zicht?op=overdracht

Iedere chat en elk project gebruikt hetzelfde draaiboek en voedt het. Zo leert alles van elkaar.

## Werk je aan keuzehulpen (keuzehulp.best, whichtobuy.best, kaufberater.best)?

1. Lees EERST de levende overdracht: https://hjdk-api-henq.vercel.app/api/kz?op=overdracht (in een Claude-chat met de Vercel-tool web_fetch_vercel_url). Die wordt bij elke opvraag opnieuw opgebouwd met de cijfers van nu: keuzehulpen vandaag, stand per site, lopende proeven, gatscans, crons, werkwijze en logboek. Er werken meerdere chats aan; lees het logboek zodat je niets dubbel doet of terugdraait.
2. Werk na elke wijziging in DEZELFDE commit het logboek (nieuwste boven) en zo nodig 'Open punten' en 'Bevindingen' bij in lib/overdracht-kz-tekst.js. Zo is de overdracht altijd actueel.

## Altijd eerst

1. Lees het draaiboek: https://hjdk-api-henq.vercel.app/api/zicht?op=draaiboek&t=1&site=<id>
   - In een cloudsessie: gebruik web_fetch_vercel_url (curl naar deze domeinen en naar keuzehulp.best wordt geblokkeerd), of de brug van een project die wel bereikbaar is: curl -s "https://mylevel-henq.vercel.app/api/p?a=zicht&op=werk&site=<id>&t=1" (problemen, de genummerde lessen voor die site, wat alleen Henkjan kan doen en de lopende proeven; ook op=draaiboek, op=stand).
   - Alleen AI-vermeldingen: voeg &kanaal=llm toe.
   - De volgorde is de score: de kans dat een les werkt (voorkennis plus eigen proeven) maal het effect, gedeeld door de moeite.
2. Lees de stand van de site: /api/zicht?op=stand&site=<id>. Die bevat:
   - Search Console
   - indexering
   - echte bezoekers uit zoek en uit AI (7 dagen)
   - AI-crawlers
   - vermeldingen in Perplexity
   - welke sites AI wél noemt
   - lopende proeven
3. Begin bij de hoogste les die op deze site nog niet is toegepast. Bij een nieuwe site eerst de site aanmelden (zie hieronder).

## Zoekvragen: alles bewaren en ervan leren

- Elke meting van de lus bewaart alle Search Console-zoekvragen van de site per dag (zoekvraag, pagina, vertoningen, kliks, positie; ook de verse dagen). Google zelf geeft per keer maar een venster en bewaart 16 maanden; wij houden 400 dagen per dag.
- Lezen: /api/zicht?op=zoekvragen&site=<id>&dagen=28 (lijst per zoekvraag met eerste en laatste dag, positie en pagina's, plus totaal per dag). Eén dag ruw: &dag=JJJJ-MM-DD. Nu verversen: &ververs=1 (eens per uur).
- Gebruik het voor: FAQ en antwoorden uit echte vragen, nieuwe onderwerpen, titels, het AI-meetpanel (les meetpanel-echte-vragen) en om pieken te verklaren (nieuwe zoekvragen op één dag = een media- of nieuwsmoment).
- Search Console loopt 2 tot 3 dagen achter. Voor een piek van vandaag kijk je naar de eigen bezoekteller van de site (bijv. taniakross.media /api/seo?a=bezoek&dagen=1: per uur, bron, scrolldiepte, bekeken onderdelen, kliks).

## Zoekvraag-onderzoek met Demand Radar (vóór je bouwt of optimaliseert)

Henkjan 9 nov 2026: "Doe goed onderzoek met demand radar waar mensen naar zoeken en optimaliseer de site daarop ... maak die skill ook beter en lerend als je wat geleerd hebt voor andere projecten."
- Search Console laat alleen zien waar de site al voor verschijnt. Wat mensen écht zoeken over een thema (een plaats, merk of onderwerp) haal je uit Demand Radar: https://demandradar-ivory.vercel.app/api/zoekvraag?thema=<id> (openbaar; &cc=US geeft één markt helemaal). Per markt in de eigen taal elke zoekterm met het thema erin: volume per maand, jaartrend, zoekintentie, 12 maanden, en per onderwerp het totaal en de grootste termen.
- Nieuw thema: één regel in `THEMA` in repo demand_radar, api/zoekvraag.js (regex op de zoekterm en de markten met taal). De data wordt per thema hooguit één keer per 7 dagen gekocht (DataForSEO, hooguit $0,60), daarna komt alles uit de opslag; roep het dus gerust aan, maar nooit in een lus met steeds nieuwe thema's.
- Werkwijze: (1) leg de onderwerpen met het meeste volume naast de eigen pagina's (sitemap); (2) een onderwerp met veel volume en geen eigen pagina = de eerstvolgende pagina, in de taal van de markt waar het volume zit; (3) een onderwerp met een pagina maar zonder de zoekterm in titel of H1 = titel herschrijven (zoekterm voorop); (4) de grootste vraagtermen (hoe, wat, wanneer, is) worden FAQ op de pagina die erover gaat; (5) meld elke toepassing als proef in zicht.json (metric gsc, controle = vergelijkbare pagina's zonder wijziging); (6) na 7 dagen opnieuw ophalen en kijken wat stijgt.
- Ook voor nieuwe projecten: draai het vóór de bouw, samen met de gatscan hieronder. Volume zonder pagina is vraag die nog niemand van jou kan krijgen.
- Lessen uit de eerste ronde (curacao.day, 10 nov 2026, 6 markten, 700 termen per markt):
  - Kijk naar de maandreeks (`m`, 12 maanden), niet alleen naar het laatste volume. Een piek in één maand (WK-wedstrijd: 5 miljoen in juni) is een gebeurtenis; reken met de laagste recente maanden als vaste vraag.
  - De grootste vragen zijn vaak geen reisvragen: waar ligt de plaats ('where is curacao' 18-27k per maand in de VS, 'onde fica curaçao' 15-33k in Brazilië), sport ('curacao voetbal' 90-246k in NL de laatste maanden) en een product met de naam van de plaats ('blue curacao', 90k per maand in de VS, het hele jaar). Maak daar eerlijke antwoordpagina's voor die naar de plaats terugleiden (de echte likeur wordt op het eiland gemaakt, de stokerij is te bezoeken).
  - Sport en nieuws alleen met uitslagen uit een bron met datum (Wikipedia-groepspagina, bond), nooit uit het geheugen; zet de datum van controle erbij.
  - De onderwerpgroepen in /api/zoekvraag zijn een grove indeling op woorden ('costa rica vs curaçao' viel onder geld door 'cost'): lees de toptermen per groep zelf na voordat je een gat kiest.
  - Het eindpunt kost geld binnen de gedeelde dagrem van de radar ($1,50 per dag). Krijg je 503 'daily data budget reached', probeer dan één keer na 00:00 UTC opnieuw, nooit in een lus.

## Persoonsmerken en mediapieken (taniakross.media en dergelijke)

- Na tv, radio of krant zoeken mensen de naam op en landen op de homepage. Ze kijken alleen naar het bovenste scherm (27 okt 2026: 46 van 48 zoekbezoekers, mediaan 32 seconden). Zet daar wat ze dan zoeken: wat er nu en binnenkort te zien en te horen is, en een snelle aanmelding (les mediapiek-bovenaan-antwoord).
- Wikipedia is bij een piek de tweede ingang (13% van het bezoek). Alleen echte, controleerbare nieuwe feiten toevoegen, met de eigen site als bron, nooit eigen promotie (les wikipedia-ingang-mediapiek).
- Zet een tv- of radio-optreden vooraf in de eigen agenda van de site, zodat de site er die avond klaar voor is.
- Een feitenpagina met echte vragen (taniakross.media/vragen) en de eigen site als bron in de Person-gegevens helpen AI om de site te citeren in plaats van alleen andere bronnen.

## Gaten zoeken

- Gatscan: /api/zicht?op=gapscan&naam=<naam>&v=vraag1|vraag2|... stelt tot 40 echte koop- of keuzevragen aan Perplexity en laat per vraag zien welke soort bronnen geciteerd worden (betaalmuur, forum, winkel, media, buitenlands), of er een prijs of maat in het antwoord staat, en welke antwoorden het zwakst zijn. Zonder token 6 scans per dag.
- Les uit de scan van 17 okt 2026: AI beantwoordt maatvragen zelf goed (daar is geen AI-gat), maar bij 'beste X onder EUR Y' en situatievragen leunt het op één dunne bron zonder actuele prijs. Een tabel per situatie met product en prijs van vandaag, zonder klikken leesbaar, vult dat gat.
- In Google zitten de kansen juist wel in maat- en rekenvragen met een zwakke top: één sterke rekenpagina per echte vraag, met tabel, meetuitleg, vragen als kopjes en een product per maat.
- Nieuw project: draai de gatscan vóór de bouw, met de vragen die de doelgroep echt stelt, en bouw de eerste pagina's op het zwakste antwoord. Valt de scan uit (402, geen tegoed), zet de vragenlijst in het logboek en herhaal hem zodra hij weer werkt; oordeel niet op een lege scan (7 nov 2026, We Are Many: scan wam-blackfriday, 0 van 10 vragen gemeten).
- Betrouwbaarheidsvragen ("is winkel X betrouwbaar", "ist X seriös", "is X legit"): AI citeert Trustpilot, Reddit, scamchecksites en het handelsregister, maar niemand meet of een winkel zijn beloftes nakomt. Een pagina per winkel alleen met eigen meting: antwoord in de eerste zin, de belofte letterlijk uit de voorwaarden met datum, de meting met aantal bewijzen en datum, link naar het handelsregister, elke week bijgewerkt. Te weinig bewijs: noindex. Eerst aanmelden bij Bing (Webmaster Tools en IndexNow) en Search Console; minstens drie echte onafhankelijke vermeldingen zoeken, persberichten tellen niet (les winkel-betrouwbaar-ai-bronnen, 7 nov 2026).

## Controlelijst bij elke wijziging (uit de audit van 20 okt 2026)

- **hreflang:** elke taalversie noemt alle andere en zichzelf, plus x-default. Mist er één, dan negeert Google de hele set. Alleen tussen echte vertalingen, nooit tussen verschillende gidsen per markt.
- **Clusters linken onderling:** elke onderwerppagina linkt naar 6 onderwerpen uit dezelfde groep, 2 uit een andere en naar de hub, als gewone links in de HTML (lib/cur.js meerBlok).
- **Hub en voorpagina openen met een kort antwoord:** feiten uit de eigen pagina's (met bron daar) en 5 tot 6 FAQ's met FAQPage. Geen nieuwe cijfers zonder bron.
- **Antwoord past bij de lezer van die taal:** DE begint bij vertrek uit Duitsland, ES en PT bij Zuid-Amerika, niet bij de VS.
- **Schema:** auteur en uitgever zijn de site als organisatie (geen persoonsnaam, Henkjan 20 okt). In lijsten krijgt elk item een type (Hotel, Restaurant, Beach) met land CW en plaats. Geen aggregateRating met scores van derden.
- **Titels:** hooguit ~60 tekens, description hooguit 155.
- **Geen gedachtestreepjes** in titels, beschrijvingen, llms.txt of zichtbare tekst. Controleer met grep op het teken voor elke push.
- **Afbeeldingen:** alt met de productnaam, plus breedte en hoogte. Serveer foto's niet rechtstreeks uit Vercel Blob (korte cache, geen maten, geen moderne formaten). Lever ze via een eigen functie (sharp) met `<picture>`, AVIF en WebP in 320 tot 1600 breed, `loading="lazy"` onder het bovenste scherm, `fetchpriority="high"` op de grootste foto bovenin en een versie in de URL zodat een jaar cache veilig is (les foto-eigen-adres, taniakross.media 28 okt). Geen foto's als data:image in de HTML. Maak ze ook vindbaar in Google en Bing Afbeeldingen: image:image in de sitemap, een ImageObject per foto met alt, onderschrift en fotograaf als de pagina die noemt, beschrijvende bestandsnamen en IndexNow met de foto-adressen (les beelden-vindbaar).
- **llms.txt:** per onderwerp en taal een eigen kopje, en de intro noemt alle soorten inhoud.
- **Eerst de lijst, dan de vragen:** mensen en AI willen een korte 'beste voor'-lijst met tabel en de prijs van vandaag. De keuzehulp staat eronder als knop, niet als drempel (les keuzehulp-als-knop-niet-drempel).
- **Nog open:** pagina's aan de rand van Vercel bewaren (s-maxage) kan pas als de telling van AI-crawlers niet meer op de server hangt (telBot). Ook nog open: de zoekindex van de NL-voorpagina (88 KB) pas laden bij gebruik, en afgekapte slugs in api/wtbmaak.js.
- **Een audit doe je met een aparte agent die alleen leest:** die controleert de live pagina's, sitemap, llms.txt en robots per host en levert een lijst met bestand en regel. Daarna voer je de top uit en zet je proeven in START_PROEVEN.

## Lokale plaatsmerken: dagelijkse inhoud en gidsen op één domein (todayin Curaçao, 1 nov 2026)

- **Eén merkdomein per plaats.** Gidsen over een plaats (hotels, stranden, restaurants, evenementen, bedrijven) horen op het domein van het lokale merk dat elke dag gedateerde inhoud over die plaats publiceert. Op generieke vergelijkingsdomeinen bleef het stil: 115 Curaçao-pagina's in 5 talen haalden in 14 dagen samen ongeveer 10 zoekbezoekers. Ze staan sinds 1 nov op todayin.email/curacao/<taal>/... (les merkdomein-met-dagelijkse-inhoud, proef todayin-curacao-gidsen-1101).
- **Wat een plaatsmerk elke dag vult:** een dagpagina per editie (archief, NewsArticle met datum), een agenda van 14 dagen (Event in een ItemList, met plaats en bron), een cruise- of drukteschema (FAQPage met het antwoord van vandaag), een vragenpagina met korte antwoorden, en de gidsen. Elke pagina heeft de aanmelding bovenaan; tel aanmeldingen per paginasoort en per bron (zoek, ai).
- **Verhuizen (migratie):** 301 per adres (niet alles naar de voorpagina), canonical, hreflang, logo-link en interne links naar het nieuwe domein, de pagina's uit de oude sitemaps, catalogi en llms.txt halen, de nieuwe sitemaps in de index en robots.txt van het nieuwe domein, IndexNow met de sleutel van het nieuwe domein, een proef in ZICHT. Houd een terugknop (instelling) en schrijf in de overdracht wat er dan ook terug moet.
- **Rewrites altijd naar het eigen domein van het doelproject en een pad zonder noindex-regel**, nooit naar *.vercel.app (daar stuurt Vercel x-robots-tag: noindex mee) en niet naar een /api/-pad met een noindex-header (hjdk-api zet die op /api/(.*); de Curaçao-gidsen lopen daarom via /curacao-gids). Die header komt via de rewrite op de echte pagina (les rewrite-naar-eigen-domein-niet-vercel-app). Controleer na elke nieuwe rewrite de headers van de live pagina.
- **Koppen testen alleen op advertentie- of kiesverkeer.** De canonieke taalpagina toont de beste variant en een vaste SEO-titel met de zoekterm voorop (les proefkop-niet-op-canonieke-pagina). Een adres dat zelf de taal kiest krijgt Vary: Accept-Language en is x-default (les vary-bij-taalkeuze).
- **Archief zonder 'vandaag'.** Dag- en archiefpagina's beschrijven de dag met datum en feiten, niet met het mailonderwerp (les archief-zonder-vandaag).
- **Datum en geschiedenis (Henkjan 2 nov 2026: "Datum er heel duidelijk bij en history opslaan voor SEO en LLM").** Elk tijdgebonden blok (alles vandaag, agenda, schema) draagt in de kop de volledige datum met weekdag en jaar, als <time datetime="JJJJ-MM-DD">. Bewaar elke dag een momentopname van wat er die dag was (todayin Curaçao: cw/alles/<dag>.json) en toon de dagpagina daaruit, nooit teruggerekend uit de actuele agenda: evenementen verdwijnen of veranderen (les dagpagina-momentopname-niet-terugrekenen). Zet gedateerde items als Event in een ItemList (startDate, plaats, bron). Maak bestaande dagpagina's rijker in plaats van nieuwe URL-soorten (les niet-sneller-bouwen-dan-google-ontdekt).
- **Eén entiteit per merk.** Twee merken op één domein krijgen elk een eigen Organization-@id met vaste naam en logo (les eigen-entiteit-per-merk).
- **Geen inhoud die op runtime-AI leunt.** Toen de AI Gateway 402 gaf (31 okt en 1 nov), vielen vertalingen, metingen, nieuwe gidsen en antwoorden stil. Laat een geplande taak van Claude de inhoud schrijven en committen, met een reserve zonder AI (les inhoud-zonder-runtime-ai).
- **Zelfherstel.** Loop aanbiederslinks dagelijks in porties na; twee keer dood = link weg en op een nakijklijst voor de gidsronde (les zelfherstel-dode-aanbiederslinks, lib/cur.js curGezond).
- **Uitrollen naar een andere plaats:** volg het draaiboek in de repo todayin, spel/leerlus/werking.md sectie 0b.

## Na elke wijziging: terugmelden

Zonder terugmelding leert niemand ervan.

- **Projecten met een eigen repo (todayin, MyLevel, enz.):** meld in <host>/zicht.json (site/public/zicht.json): toegepast {les, dag, wat}, proeven {id, les, metric, na, urls, controle, wat}, lessen {id, les, kanaal, bewijs, bron, sterkte, moeite} en nvt. Alleen toevoegen; een id wordt één keer gemeld en nooit gewijzigd. ZICHT leest het elke ochtend om 05:50 UTC (lib/zicht-projecten.js; uitleg /api/zicht?op=manifest). Moet een wijziging op alle pagina's, neem dan als controle pagina's van voor de wijziging (voor/na op datum) en zeg dat in wat.
- **Na de uitrol altijd nakijken op de live pagina:** headers (geen noindex), de nieuwe inhoud in de HTML zelf, geldige JSON-LD, en of de scripts zonder fout laden (in een cloudsessie met Playwright). Een kapotte pagina kost meer dan een gemiste les.
- **Zonder token (altijd mogelijk):**
  - Nieuwe proef: zet hem in START_PROEVEN in lib/zicht.js (id, site, les, metric, na, urls, controle, wat, van) en push; de volgende ronde maakt hem één keer aan.
  - Nieuwe les of nieuw bewijs: voeg toe aan data/zicht-priors.json (id, les, kanaal, bewijs met cijfers, bron, sterkte 1-4, effect, moeite 1-5, meten).
  - Les al toegepast op een site: zet hem in AL_TOEGEPAST in lib/zicht.js.
- **Met token** (gedeelde team-variabele ZICHT_TOKEN, GADS_TOKEN of HJDK_TOKEN, als Authorization: Bearer):
  - **Iets toegepast:** POST /api/zicht?op=proef met body {site, les, urls, controle, metric, wat, van}. metric is gsc (vertoningen), index (komt het in Google) of llm (noemt AI de site). Neem waar het kan een controlegroep: pagina's die de wijziging niet krijgen. De lus beoordeelt het na 14 tot 28 dagen zelf.
  - **Al toegepast, zonder meetbare start:** POST op=toegepast met {site, les}.
  - **Zelf een uitkomst gemeten:** POST op=uitkomst met {site, les, uitkomst: beter|slechter|gelijk, effect, toelichting}.
  - **Nieuw inzicht of nieuw bewijs:** POST op=les met {les, kanaal: google|llm|beide, bewijs (met cijfers), bron, sterkte 1-4, moeite 1-5}. Een bestaande id voegt bewijs toe.
  - **Nieuwe site laten meten:** POST op=site met {id, host, taal, land, merk[], vragen[] (echte zoek- of koopvragen), gsc}. gsc: true werkt alleen als seo-leerlus@hjdk-seo.iam.gserviceaccount.com toegang heeft in Search Console.

Zonder token kun je verder lezen, eens per uur een meting starten (/api/zicht?op=meet&site=<id>) en eens per 6 uur een hele ronde (/api/zicht?op=ronde).

## Wat de lus zelf doet

- **Dagelijks 05:30 UTC**, met een vangnet om 09:30, 13:30, 17:30 en 21:30 UTC als de ochtendronde uitviel:
  - Meten per site: Search Console, indexering per pagina, echte bezoekers uit zoek en AI, AI-crawlers, en 8 echte vragen aan Perplexity (wordt de site genoemd, welke domeinen winnen).
  - Proeven beoordelen: tegen de controlegroep, of anders tegen de hele site. De uitkomst gaat in de score van de les. Een les met 5 of meer proeven zonder winst wordt verworpen.
- **Indexcheck** voor keuzehulp.best, whichtobuy.best en kaufberater.best elke ochtend tussen 04:15 en 04:35 UTC, roterend over alle pagina's.
- **Wekelijks:** een onderzoeker leest de data en voegt hooguit 3 nieuwe, toetsbare lessen toe.
- **Dagelijkse controle door Claude** (geplande taak 'ZICHT dagcontrole SEO en AI', 06:10 UTC): stand bekijken, repareren, 1 tot 2 verbeteringen bouwen als proef, logboek bijwerken, Henkjan kort melden wat veranderde.
- **Automatisch op keuzehulp.best, whichtobuy.best en kaufberater.best:** elke titel- en FAQ-wijziging uit de Search Console-ronde wordt een proef.
- **Alleen keuzehulp.best:** interne links naar pagina's die Google nog niet kent, met 1 op 5 als controlegroep.

## Vaste regels

- Nooit massaal gegenereerde pagina's, nep-reviews, verborgen tekst of een pagina per kleine zoekvariant (doorway).
- Wat we publiceren mag niet als AI-content ogen: een Google-penalty is het grootste risico.
- Googlebot nooit blokkeren. AI-zoekbots (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot) toelaten. AI-crawlers voeren geen JavaScript uit: wat AI moet citeren, moet in de HTML staan.
- Een lastmod in de sitemap alleen bij een echte inhoudswijziging.
- Bronnen, cijfers en uitspraken alleen als ze echt zijn. Nooit URL's of cijfers verzinnen.
- Oordeel op metingen, niet op gevoel. Te weinig data: niets concluderen, langer meten.
- Cijfers die je meldt haal je live op (stand of overdracht), nooit uit dit bestand.

## Melden aan Henkjan

Resultaat eerst, in gewone taal, met cijfers en een link naar /api/zicht?op=stand, de overdracht of het draaiboek. Geen jargon, geen spreadsheet.
