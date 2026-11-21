# Overdracht: organisch verkeer uit de bedrijfspagina's van curacao.day

Gemaakt 21 nov 2026. Live: https://hjdk-api-henq.vercel.app/curacao-gids?op=bzoverdracht (met de Vercel-tool `web_fetch_vercel_url`), en als bestand `OVERDRACHT-CURACAO-BEDRIJFSPAGINAS.md` in de repo hjdk-api. Werk dit bestand bij in dezelfde commit als elke wijziging, met een regel in het logboek onderaan (nieuwste bovenaan).

## 0. Opdracht

Henkjan (21 nov 2026): "focus komende week op organische verkeer uit de bedrijven paginas . Check wat je daar kunt verbeteren en kom met voorstel wat ik aan andere chat kan geven om te verbouwen dus moet helemaal compleet zijn die handover en advies ."

Het doel voor de week van 22 tot 29 nov 2026: meer mensen uit Google, Bing en AI-assistenten op de bedrijfspagina's, en daarna door naar de ochtendmail (de noordster van curacao.day: lezers).

## 1. Eerst lezen en harde regels

Lees eerst:
- `CLAUDE.md` van hjdk-api, sectie "curacao.day bedrijfspagina's: strak en lerend". Daar staan ook de nachtronde, de UX-ronde en de vaste regels van de controle.
- De skill `.claude/skills/zicht-seo-llm/SKILL.md` (ZICHT), en de skill `keuzehulp-bouw` voor de vorm.
- `lib/werking.js` (de regels over de gidsen van curacao.day) en het logboek in `lib/overdracht-kz-tekst.js`.

Harde regels:
1. **Eerst laten zien.** Henkjan wil alles eerst zien met een klikbare link voor het live gaat ("geldt voor alles wat je maakt . Ik wil eerst zien voor live gaat"). Werkwijze die al werkt: een nieuwe versie achter `?v=<naam>` met `noindex,follow` en de canonical naar de gewone pagina. Stuur hem de link `https://curacao.day/...?v=<naam>` plus een schermafbeelding van de telefoon. Pas na zijn akkoord wordt het de standaard.
2. **Geen nep-inhoud.** Geen verzonnen reviews, menu's, prijzen of tijden. Elk feit heeft een bron en een datum. Geen massaal gegenereerde of automatisch vertaalde pagina's zonder eigen inhoud. Daarom zijn de bedrijfspagina's in DE, ES en PT sinds 18 nov `noindex,follow`; laat dat zo (`GIDS_INDEX_TALEN` in `lib/cur.js`).
3. **Teksten** schrijft Claude met eigen tokens in een geplande taak, nooit via de AI Gateway.
4. **Vorm.** Nooit grijs, alle tekst #111113. Geen nullen en geen "nog geen". Gewone tekst 16 px. Op curacao.day zorgt `lib/currust.js` voor de lettermaten en `lib/curdonker.js` voor de donkere modus.
5. **Structured data.** Zet nooit `aggregateRating` met scores van Google, Tripadvisor of andere sites in de JSON-LD. Google verbiedt dat ("don't aggregate reviews from other websites"). Alleen reviews die lezers op curacao.day zelf geven mogen erin, en dan pas vanaf een redelijk aantal.
6. **Nieuwbouwrem.** Zolang minder dan de helft van de pagina's in Google staat, komen er geen nieuwe soorten URL's bij. Maak bestaande pagina's beter. Een nieuwe URL alleen als die echt een eigen zoekvraag heeft.
7. **Controle bij elke stap.** Bouw in dezelfde stap de controle die meet of het werkt, met een drempel. Na een fout hooguit één nieuwe poging op dezelfde manier, daarna een andere aanpak. Nooit langer dan 15 minuten vastzitten.
8. **Git.** Altijd eerst `git pull --rebase`. Commit met expliciete bestandsnamen. Push naar main (Vercel rolt uit). Na de push de live pagina nakijken.
9. **Proeven.** Elke verbetering is een proef met een vaste helft per zaak (zoals `TITEL_PROEF` in `lib/curvind.js`), tegen de huidige versie. Hoogstens één proef per stap tegelijk. Nooit voor en na vergelijken als het ook als proef kan.
10. **IndexNow.** Ping alleen URL's die echt veranderden. Gebruik curacao.day `/api/cw?w=indexnow&u=...` (meerdere `u` per oproep; hoogstens 30 oproepen per dag).

## 2. Hoe het nu werkt

### Twee soorten bedrijfspagina's

| Soort | Adres | Aantal | Code |
|---|---|---|---|
| Bedrijvengids, zaak | `curacao.day/<taal>/<bedrijven\|businesses\|firmen\|negocios\|empresas>/<soort>/<zaak>` | 11.906 zaken in 1.344 soorten, in 5 talen | `lib/cur.js` `renderGidsBedrijf` |
| Bedrijvengids, soort | `curacao.day/<taal>/bedrijven/<soort>` | 591 soorten met 3 of meer zaken | `lib/cur.js` `renderGidsCat` |
| Keuzehulp-bedrijf | `curacao.day/<taal>/<gids>/<id>` (bijv. `/nl/pizza/pizzarroni`) | ongeveer 1.300 zaken uit 31 gidsen | `lib/cur.js` `renderBedrijf` |
| Keuzehulp | `curacao.day/<taal>/<gids>` | 29 gidsen in het skillformaat sinds 21 nov | `lib/curkh.js` `renderKh` |

curacao.day stuurt `/<taal>/<pad>` door naar `keuzehulp.best/curacao-gids?m=<taal>&s=...` (todayin `bzz/vercel.json`). `curHandler` in `lib/cur.js` haalt de kop en het menu van de site op (`siteKop`, bzz `/api/cw?w=kop`). Daarna gaat elke pagina door `metRust` (`lib/currust.js`), `metDonker` (`lib/curdonker.js`), `viaBeeld` en `metAanmeld`.

### Gegevens
- Bedrijvengids: Demand Radar `/api/reviews?op=listings`. `gidsBouw` in `lib/cur.js` zet ze in Vercel Blob (privé): `cw/gids/index.json`, `cw/gids/cat/<soort>.json` en `cw/gids/namen.json`. Per zaak staan er naam, slug, adres, telefoon, site, uren, score, aantal reviews en coördinaten.
- Keuzehulpen: `data/cur/<gids>.json`, met scores per platform, voor en tegen, prijs en bronnen. Tijden en plek per zaak staan in KV `cur:p:<gids>:<id>`.
- Reviews van lezers: `lib/curbedrijf.js` (`B2.reviews`, `B2.reviewPost`).
- Claim door de eigenaar: `B2.claimPost` en `B2.claimOk`. Op de eigenaarspagina ziet de eigenaar zijn cijfers.

### Wanneer een pagina in Google mag
- Zaak: alleen NL en EN, en alleen met 5 of meer reviews, of met telefoon, tijden en adres (`renderGidsBedrijf`, `const index = ...`).
- Sitemap (`gidsSitemapUrls`): soorten met 3 of meer zaken, en zaken met 5 of meer reviews. Dat zijn 3.963 zaken en 591 soorten per taal (NL en EN). Alle `lastmod` staan op 22 oktober 2026.
- DE, ES en PT staan tot `GIDS_SITEMAP_TOT` nog in hun sitemap als noindex-lijst, zodat Google de noindex snel ziet. Daarna gaan ze er vanzelf uit.

### Titel, beschrijving en structured data
- Titel: `VIND.titel` in `lib/curvind.js`. Daar loopt de titelproef sinds 15 nov: a "Naam Curaçao: openingstijden, telefoon en reviews" tegen b "Naam (straat) Curaçao: openingstijden en telefoon".
- Beschrijving: `B2.beschrijving` in `lib/curbedrijf.js`, met tijden, score, adres en telefoon.
- JSON-LD: `LocalBusiness` (naam, adres, geo, hasMap, telefoon, uren, soms url en priceRange) plus `BreadcrumbList`.

### Opbouw van een zaakpagina
Naam, open nu, score, knoppen (bellen, WhatsApp, route), de chat van de site, feiten, zaken in de buurt, best beoordeeld in de soort, een link naar de keuzehulp, aanmelden en eigenaar. Een zaakpagina heeft 200 tot 270 woorden, en het meeste daarvan is een lijst met andere zaken.

### Wat al leert
- Clickmind-proef `curbedrijf`: hoofdknop gevuld en de lijst andere zaken. Stand: `https://keuzehulp.best/api/mm/proefstand?site=curbedrijf&vorm=tekst`.
- Titelproef en soortproef: `/api/gsc?op=curvind`.
- De nachtronde (zie CLAUDE.md) doet elke nacht de UX-ronde en vindbaarheid, met hoogstens 5 kansen per nacht.

### Waar je de cijfers leest
| Wat | Adres (hjdk-api-henq met `web_fetch_vercel_url`, of bzz-henq) |
|---|---|
| Google per soort pagina, titelproef, kansen | `https://hjdk-api-henq.vercel.app/api/gsc?op=curvind` |
| Google 28 dagen: pagina's en zoekvragen | `https://hjdk-api-henq.vercel.app/api/gsc?op=curinhoud` |
| Tikken per blok op zaakpagina's | `https://hjdk-api-henq.vercel.app/curacao-gids?op=uxstand&dagen=14` |
| Crawlers en echte bezoekers per bron | `https://bzz-henq.vercel.app/api/cw?w=stand`, onder `herkomst` |
| Bedrijvengids-status | `https://hjdk-api-henq.vercel.app/curacao-gids?op=gidsstatus` |
| Sitemap per taal | `https://hjdk-api-henq.vercel.app/curacao-gids?op=gidssitemap&m=nl` |

## 3. Stand op 21 nov 2026

- In 28 dagen kwam 86% van alle Google-vertoningen van curacao.day van bedrijfspagina's: 16.361 van 19.002 vertoningen, en 190 van 273 kliks. Die vertoningen landden op 2.349 pagina's. **De bedrijfspagina's zijn de organische motor van de site.**
- De laatste 7 dagen tegen de 7 dagen daarvoor:

| Soort pagina | Vertoningen | Kliks | Pagina's in Google |
|---|---|---|---|
| Zaak | 6.161 (was 6.936) | 63 (was 58) | 1.417 |
| Soort | 1.518 (was 1.746) | 30 (was 39) | 290 |
| Keuzehulp-bedrijf | 374 (was 377) | 5 (was 1) | 121 |
| Keuzehulp | 210 (was 232) | 7 (was 4) | 19 |

- **Zoekvragen:** 98% van de vertoningen bij bekende zoekvragen is de naam van een zaak: "flakos curacao", "dominos curacao", "nine west sambil willemstad", "la granja curacao". Vragen met menu, tijden of telefoon erin zijn samen 2%.
- **Positie:** 47% van de vertoningen staat op plek 8 tot 10 en 37% op plek 4 tot 7. CTR is ongeveer 1%.
- **Taal:** Engels 64%, Nederlands 35%.
- **Titelproef:** a en b verschillen nog niet (z −0,41).
- **Crawlers op de gidspagina's per dag:** Googlebot 24 tot 247, Bingbot 536 tot 645, Applebot 2.300 tot 2.850, GPTBot 440 tot 1.368, OAI-SearchBot (ChatGPT-zoeken) 251 tot 455.
- **Echte bezoekers volgens de bzz-meting:** 115 op de gidspagina's in 7 dagen, waarvan 21 uit Google. Search Console telde in dezelfde week ongeveer 100 kliks.

## 4. Diagnose: de lekken, grootste eerst

**L1. Indexering.** 7.926 zaak-URL's staan in de sitemap (NL plus EN). Maar in 28 dagen hadden maar 2.349 pagina's een vertoning. Google kruipt weinig (Googlebot tot 250 per dag, tegen 2.300 van Applebot). De pagina's zijn dun en op elkaar gelijk: 200 tot 270 woorden, vooral lijsten met andere zaken. Elke `lastmod` is 22 oktober, dus Google ziet niet wat er veranderde. Een steekproef van de hoofdsitemap gaf op 21 nov: 100 geïndexeerd, 214 "gevonden, niet geïndexeerd", 123 onbekend. *Oorzaak:* weinig eigen waarde per pagina, weinig links van buiten, geen eerlijk signaal van verandering.

**L2. Positie 8 tot 10 op de naam van de zaak.** Wie de naam zoekt, wil tijden, telefoon, adres, menu en de mening van anderen. Google laat dat al zien in het bedrijfsprofiel. Daarboven staan de eigen site, Facebook en Tripadvisor. Onze pagina voegt niets toe dat het Google-profiel niet heeft.

**L3. CTR ongeveer 1%.** De titel en beschrijving lezen als een telefoonboek. Er staat geen reden in om op ons te klikken in plaats van op het profiel.

**L4. Twee URL's voor dezelfde zaak.** Een zaak uit een keuzehulp heeft ook een pagina in de bedrijvengids, bijvoorbeeld `/nl/pizza/pizzarroni` en `/nl/bedrijven/pizza-restaurant/pizzarroni`. Die twee pagina's van één site strijden om dezelfde naam. Hoeveel overlap er is, moet je eerst meten (zie stap 4).

**L5. Fouten in de gegevens.** Voorbeelden:
- The Flakos Grill: "ma-zo 00:00-00:00" in de beschrijving en "Nu open · tot 00:00" op de pagina.
- Namen in kleine letters, zoals "The flakos grill".
- NL-URL's met Engelse soorten, zoals `/nl/bedrijven/clothing-store/`. Laat deze URL's deze week staan: omzetten kost redirects en ranking.

**L6. De meting telt crawlers mee.** `uxstand` telde 4.390 views op 21 nov, waar het eerder 48 tot 64 per dag waren, met 0,1 tik per 100 views. De Clickmind-proef `curbedrijf` en de UX-ronde beslissen dus op verkeer dat grotendeels bots is.

**L7. Soortpagina's.** De 591 soortpagina's per taal staan op plek 11 tot 20 voor "X curacao". Ze zijn de schakel tussen de keuzehulpen en de zaken, maar hebben nog niet het nieuwe keuzehulpformaat.
- Waar een keuzehulp bestaat (pizza, fastfood, restaurants, bouwmarkt, kleding en meer), strijden de soortpagina en de keuzehulp om "beste X curacao".
- Soortproef b ("Beste X", antwoord eerst) staat op CTR 1,9% tegen 8,2%. Dat zegt nog weinig: 73 en 103 vertoningen.

**L8. AI-assistenten.** ChatGPT leest de gidspagina's dagelijks (OAI-SearchBot 251 tot 455 per dag, GPTBot tot 1.368). Bing kruipt goed. Toch staat er per zaak geen korte samenvatting die een AI kan overnemen: wat het is, waar het om bekend staat, voor wie, prijsniveau.

## 5. Plan voor de week, in deze volgorde

Elke stap: eerst bouwen achter een vlag of als proef, Henkjan de link laten zien, na zijn akkoord live, en dan controleren.

### Stap 0. Meting zonder bots (dag 1, voorwaarde voor alles)
- **Wat:** de view- en tikteller van zaakpagina's (`hit` en `meetJs` in `lib/cur.js`, `UX.uxStand` in `lib/curux.js`) telt alleen nog echte mensen: geen `navigator.webdriver`, geen bekende crawler-UA (dezelfde lijst als `BOTS`/`telBot`), en pas tellen na tik, scroll of 3 seconden zichtbaar (zoals bzz `herkomst`). Doe hetzelfde voor de proef `curbedrijf` in `lib/proef.js`.
- **Controle:** een test die één bezoek met de UA van Googlebot en één met Playwright (webdriver) doet. Beide mogen niet tellen.
- **Klaar als:** het aantal views per dag weer in de orde ligt van de echte bezoekers volgens bzz `herkomst`, en `uxstand` per 100 bezoeken iets zegt.

### Stap 1. Gegevens repareren (dag 1)
- Tijden `00:00-00:00`: toon "24 uur open" alleen als de bron dat echt zegt (`periods` zonder sluittijd). Anders geen tijden en geen "Nu open". Dat geldt in de pagina, de beschrijving en `openingHoursSpecification`.
- Namen die helemaal in kleine letters of helemaal in hoofdletters staan: zet ze in de schrijfwijze van de eigen site van de zaak, als die er is. Anders hoofdletter per woord, behalve lidwoorden.
- **Controle:** een script over alle zaken in `cw/gids/cat/*.json` dat telt hoeveel van elk probleem er nog zijn. Draai het in de nachtronde en meld het verschil.

### Stap 2. Eigen waarde per zaak: blok "In het kort" (dag 2 tot 4, grootste hefboom voor L1, L2 en L8)
- **Wat:** bovenaan elke zaakpagina, onder de naam, twee of drie zinnen uit echte gegevens: wat het is, waar het om bekend staat, voor wie, prijsniveau, en wat reviews herhalen. Daaronder, als het er is: menu of menulink met bron en datum, en de plek in de keuzehulp ("plek 3 van 187 restaurants, 80 van 100").
- **Bron:** de gegevens die er al zijn (omschrijving, soort, prijsniveau, attributen, scores per platform) en reviewteksten als Demand Radar die levert. Elke zin heeft een bron. Bij te weinig gegevens komt er geen blok; geen vulsel.
- **Schrijven:** Claude in een geplande taak, met eigen tokens. Eerst de 300 zaken met de meeste vertoningen (uit `curinhoud`), daarna 200 per nacht. Bewaar per zaak in Blob `cw/gids/kort/<soort>/<zaak>.json` met `{tekst per taal (nl, en), bronnen, datum}`.
- **Proef:** vaste helft per zaak (b met blok, a zonder). Meet per helft de vertoningen, positie, CTR en het aantal pagina's met vertoningen na 14 dagen.
- **Klaar als:** de 300 zaken hun blok hebben, het blok in de proef staat en de controle elke nacht meldt hoeveel zaken een blok hebben.

### Stap 3. Snippet die een reden geeft om te klikken (dag 3)
- **Titelproef ronde 2** in `lib/curvind.js` (`TITEL_PROEF`). Zet c erbij: "Naam: menu, prijzen en reviews | Curaçao" voor zaken met een menu, en "Naam Curaçao: reviews van 3 sites en tijden" voor zaken met scores op 2 of meer platforms. Sluit de huidige proef af als die na 1.500 vertoningen per helft nog gelijk is: a blijft dan.
- **Beschrijving:** begin met wat Google niet laat zien, bijvoorbeeld "4,7 uit 69 reviews op Google en Tripadvisor · menu met prijzen · vandaag open tot 22:00". Haal fouten uit stap 1 eruit.
- **Controle:** in `curvind` per versie de CTR en positie.

### Stap 4. Eén URL per zaak (dag 3 tot 4)
- **Meet eerst** hoeveel keuzehulp-zaken ook in de bedrijvengids staan (naam plus coördinaten binnen 150 m).
- **Advies:** de bedrijvengids-URL is de hoofdpagina, want die rankt (2.349 pagina's met vertoningen tegen 121). Toon de keuzehulpgegevens (voor en tegen, scores per platform, plek in de keuzehulp) op de bedrijvengidspagina. Geef de keuzehulp-bedrijfspagina een `canonical` naar de bedrijvengids-URL. Links in de keuzehulpkaarten (`lib/curkh.js` `kaart`) gaan dan ook naar die URL.
- **Eerst laten zien** aan Henkjan met één voorbeeld, want dit verandert wat er in Google staat.
- **Controle:** geen pagina in de sitemap met een canonical naar een andere URL, en een test die per gids nagaat dat elke kaart naar één URL per zaak wijst.

### Stap 5. Kruipen en interne links (dag 4 tot 5)
- **Eerlijke `lastmod` per zaak:** de datum waarop de gegevens van die zaak echt veranderden. Bewaar een hash per zaak in de index en vergelijk na elke `gidsBouw`.
- **Sitemap per soortgroep** (hoogstens 1.000 URL's per bestand), zodat Search Console de indexering per groep laat zien. Dien ze in met `/api/gsc?op=sitemaps`.
- **Hub "Net bijgewerkt"** op `/<taal>/bedrijven`: de 50 zaken die het laatst een blok of nieuwe gegevens kregen. Zo vindt Google nieuwe inhoud via links.
- **IndexNow** voor elke zaak die in stap 2 een blok kreeg.
- **Controle:** de indexsteekproef (`/api/gsc?op=index`) ook over de gids-sitemap, per soortgroep. Meld wekelijks hoeveel er geïndexeerd zijn.

### Stap 6. Soortpagina's in het keuzehulpformaat (dag 5 tot 6)
- **Wat:** `renderGidsCat` krijgt de opbouw van `lib/curkh.js`: antwoord eerst, Keuzehulp-score, één zwarte knop, de chat van de site, een situatietabel als er tags zijn, en FAQ uit echte zoekvragen.
- **Waar al een keuzehulp bestaat:** de soortpagina mikt niet op "beste X curacao", want dat doet de keuzehulp. Ze krijgt bovenaan "Vergelijk in de keuzehulp" en mikt zelf op "alle X op Curaçao" (adressen, open nu). Soortproef b ("Beste ...") alleen voor soorten zonder keuzehulp. De koppeling staat in `TOPIC_VOOR`.
- **Klaar als:** het voorbeeld door Henkjan is goedgekeurd, live staat, en `test-cur-rang.mjs` plus een nieuwe test voor de soortpagina's slagen.

### Stap 7. Eigenaren als motor: unieke inhoud en links (dag 6 tot 7, alleen na akkoord van Henkjan)
- **Wat:** een badge "Gevonden op curacao.day" of "Top 3 in de keuzehulp", met een link naar hun pagina, voor op hun eigen site. Eigenaren kunnen via de claim (of WhatsApp naar het curacao.day-nummer) hun menu, foto's en een omschrijving sturen. Dat is eigen inhoud en geeft links van buiten.
- **Begin** met de 50 zaken met de meeste vertoningen.
- **Berichten** aan eigenaren gaan namens Henkjan, dus elk concept eerst langs de POST-lus (`/api/post?op=regels`) en daarna aan Henkjan laten zien. Altijd met de Clickmind-link.

### Stap 8. Gevonden worden door AI (doorlopend)
- **JSON-LD per zaak:** `sameAs` (eigen site, Google Maps-link als die er is), `priceRange`, voor eten `servesCuisine` en `hasMenu` (alleen met bron), en `image` alleen bij eigen foto's of foto's van de eigenaar. Geen `aggregateRating` met scores van andere sites (regel 5).
- **De zin "In het kort"** uit stap 2 staat als gewone tekst bovenaan. Die nemen AI-assistenten over.
- **llms.txt:** noem de bedrijvengids, wat een zaakpagina bevat en hoe de Keuzehulp-score werkt.
- **Controle:** in Demand Radar (`/api/gaps?latest=1`) of met een eigen meting: welke zaken een AI noemt bij "beste X op Curaçao", voor en na.

## 6. Doelen voor 29 nov 2026 (eerlijk: dit zijn doelen, geen voorspelling)

| Maat (7 dagen, zaakpagina's) | Nu | Doel |
|---|---|---|
| Vertoningen | 6.161 | 9.000 |
| Kliks | 63 | 120 |
| Pagina's met vertoningen | 1.417 | 2.000 |
| CTR | 1,0% | 1,5% |
| Echte bezoekers uit Google (bzz herkomst, alle gidspagina's) | 21 | 60 |

Belangrijker dan het doel: elke stap heeft een proef of een controle, en het rapport zegt per lek wat er gedaan is en wanneer het volgende oordeel komt.

## 7. Rapport aan Henkjan (kort, Nederlands, alleen wat nieuw is)
- Per stap: wat gedaan, de link om te bekijken, en wat de proef of controle zegt.
- Per lek: wat er al aan gedaan is en wanneer het volgende oordeel komt.
- Geen lijsten met nullen. Geen technische woorden zonder uitleg.
- Werklog: `/api/mm/handover?log=...&wie=bedrijfspaginas-<chat>`. Logboekregel onderaan dit bestand en in `lib/overdracht-kz-tekst.js`. `lib/werking.js` bijwerken als de werking verandert.

## 8. Open punten die Henkjan beslist
1. Mag stap 7 (eigenaren benaderen met badge en claim) beginnen? Zo ja: via mail, WhatsApp of allebei?
2. Bij stap 4: akkoord dat de bedrijvengids-URL de hoofdpagina wordt en de keuzehulp-bedrijfspagina een canonical daarnaartoe krijgt?
3. Voor indexeringsverzoeken in Search Console moet Henkjan één keer inloggen bij Google in de ingebouwde browser.

## Logboek (nieuwste bovenaan)
- 2026-11-21 (Codex, stap 0, alleen preview): gedeelde crawlerlijst en menspoort in lib/curmens.js. Views en tikken tellen na een echte tik, scroll of drie seconden zichtbaar; server controleert opnieuw. uxstand leest aparte schone tellers en geeft vanaf 200 bezoeken een blokbeslissing vrij. curbedrijf ronde 5 houdt dezelfde varianten; exposure en eerste actie worden atomair opgeslagen. Preview meet op eigen host in cur:voorbeeld en curbedrijfvoorbeeld; crawler- en GV-tellers worden overgeslagen. Ontwerpinstructie van Henkjan: sealedintent.com. Alleen v=sealed toont de vorm met ronde kaarten, dunne lijnen en zwarte knoppen; inhoud, tijden, canonical en sitemap blijven gelijk. De eerste negen lokale VM-controles slaagden; daarna vond een aparte audit een eerste-klikrace en resterende previewtellers, beide gerepareerd. Echte Chromium- en Redis-controle geslaagd: GitHub Actions 44960930707 (serverfilters, Googlebot, webdriver, drie seconden zichtbaar, tik, scroll en atomaire eerste actie). Snapshot van de echte gerenderde preview is op 390 en 1280 px geslaagd (44961257957, zonder JavaScriptfouten of horizontaal scrollen, knoppen in eerste scherm); scripts/fixtures/curacao-bedrijf-preview.html is de gecontroleerde HTML, geen nieuwe inhoud. Main en productie wachten op Henkjans akkoord. De werkcomputer viel weg; voortzetting via GitHub op vast main cc093d269d0610b16c4786da412eb85a803eb91f. Geen productiepush. De gedeelde chat krijgt in preview een eigen doorgeefactie (voorbeeldchat): alleen vragen worden beantwoord, tellers/aanmeldingen/bijdragen en review/claim-acties worden niet doorgestuurd. De eerste screenshot-job slaagde inhoudelijk maar het bewaren in git ging mis door checkout van de merge-ref; gecorrigeerd naar de previewbranch met pull --rebase.

- 2026-11-21 (curacao-chat): overdracht gemaakt na de analyse van Search Console (28 en 7 dagen), de sitemaps, drie zaakpagina's (The Flakos Grill, Nine West Sambil, Domino's), de crawlers en de bzz-meting. Dezelfde dag: alle keuzehulpen in het skillformaat (`lib/curkh.js`), en `aggregateRating` uit de JSON-LD van de keuzehulpen gehaald (regel 5).
