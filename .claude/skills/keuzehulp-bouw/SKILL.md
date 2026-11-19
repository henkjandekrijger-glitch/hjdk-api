---
name: keuzehulp-bouw
description: Gebruik bij het kiezen, maken, verbeteren of onderhouden van een keuzehulp op keuzehulp.best, whichtobuy.best of kaufberater.best (product, beslisgids voor een dienst, lokale gids of rekenhulp), en als wegwijzer naar de keuzehulpen op curacao.day, todayin surgery en gids.kadoly.com. Onderwerp kiezen uit Demand Radar en de AI-gaten, nieuwbouwrem, bouwprotocol, UX-regels, verdienen, leren en aansluiten bij wat er al is.
---

# Keuzehulp kiezen, bouwen en onderhouden

Bron van deze skill: repo henkjandekrijger-glitch/hjdk-api, `.claude/skills/keuzehulp-bouw/SKILL.md`. Live, altijd de versie van main: https://hjdk-api-henq.vercel.app/api/zicht?op=skill&naam=keuzehulp-bouw (met web_fetch_vercel_url). Verander je de werkwijze, pas dan dit bestand aan in dezelfde commit en zet een regel in het logboek van `lib/overdracht-kz-tekst.js`.

Henkjan, 19 nov 2026: "Zullen we hiervan skill maken hoe je keuzehulp maakt, onderhoud en ook aansluit bij de bestaanden?", "Stop in Keuzehulp bouw en onderhoud protocol altijd max contrast dus geen grijs." en "Maak deze helemaal compleet. En of sluit aan bij wat er al is."

Deze skill is het bouwprotocol. Wat een zusterskill al regelt staat hier niet nog een keer:

| Werk | Waar |
|---|---|
| Vindbaarheid in Google, Bing en AI-assistenten, proeven en lessen | skill `zicht-seo-llm` |
| Lek zoeken van advertentie tot betaling (B = MAP) | skill `leerlus-henkjan` |
| Advertentiecampagnes | skill `campagnes-henkjan` |
| Elke mail die de deur uit gaat | skill `mail-lerend` |
| Keuzehulpen en bedrijvengids op curacao.day | `CLAUDE.md`, sectie curacao.day (`lib/cur.js`, `lib/curux.js`) |
| Keuzehulp chirurgie (todayin surgery) | https://todayin.email/surgery/overdracht |
| Cadeaugidsen op gids.kadoly.com | `OVERDRACHT-KADOLY-GIDS.md` |

## 1. Altijd eerst

1. Lees de levende overdracht: https://hjdk-api-henq.vercel.app/api/kz?op=overdracht (met web_fetch_vercel_url). Daarin staan het logboek van andere chats, de open punten, de lopende proeven en de stand. Doe niets dubbel en draai niets terug.
2. Vindbaarheid: volg ook de skill `zicht-seo-llm`.
3. Kijk of de keuzehulp al bestaat:
   - sitemap: https://hjdk-api-henq.vercel.app/api/kz?op=sitemap;
   - `data/kz.json` en `lib/kz-hand.js`;
   - `lib/dienstgids.js`, `lib/wtb-dienst.js`, `lib/kb-dienst.js`, `lib/wtb-hand.js`, `lib/rdam.js`;
   - de lijst in sectie 2 (beslisgidsen op AI-gaten).
   Bestaat hij al: verbeter hem, maak geen tweede.
4. Kijk of er gebouwd mag worden: sectie 3 (nieuwbouwrem en kernfase).

## 2. Onderwerp kiezen

Volgorde, van boven naar beneden:

1. Wat Henkjan vraagt en de open punten in de overdracht.
2. Een bestaande pagina op plek 4 tot 20 in Google. Verbeteren gaat voor nieuw.
3. Een AI-gat zonder eigen keuzehulp (hieronder).
4. De rangorde van `onderwerpScore` (`lib/demandradar.js`): vraag maal stijging maal zwakte van de top 10, plus Google plek 4 tot 20, chatvragen en AI-gaten. De bouwmotors `api/kzmaak.js` en `api/wtbmaak.js` beginnen bij die rangorde.
5. Een chatvraag zonder antwoord die vaak terugkomt, en wat mensen dit seizoen willen (Sinterklaas, Kerst, Black Friday, weer).

### AI-gaten: waar AI geen eerste keus heeft

Henkjan, 19 nov 2026: "Wij moeten simpelweg de betere antwoorden leveren." Demand Radar stelt per land (NL, DE, VS) de koopvraag achter de 30 grootste onderwerpen aan een AI en legt vast wie genoemd wordt.

**Lezen**

| Wat | Adres |
|---|---|
| Lijst met per gat wat elke AI noemt (openbaar) | https://demandradar-ivory.vercel.app/api/demand?view=gaps&format=text |
| Dezelfde uitkomst als JSON (openbaar) | https://demandradar-ivory.vercel.app/api/gaps?latest=1 |
| Alleen gaten zonder eigen keuzehulp (teamsleutel) | https://demandradar-ivory.vercel.app/api/demand?view=gaps&guide=none&format=text&key=<teamsleutel> |

De teamsleutel is een gedeelde team-variabele in Vercel. Hij komt nooit in code, een pagina, het logboek of een bericht.

**Oordeel per vraag**

| Oordeel | Betekenis | Gewicht |
|---|---|---|
| `open` | AI noemt niemand | 1 |
| `generic` | alleen grote algemene winkels of zoekplatforms | 0,7 |
| `unclear` | wel namen, geen eerste keus | 0,35 |
| `taken` | duidelijke eerste keus, dus geen gat | 0,1 |

- De rangorde is het gewicht maal log10 van het zoekvolume.
- `misread` (typfout of vage zoekterm, de AI vroeg terug) telt niet als gat.
- Bij elk gat staat hoeveel van de andere AI's (Perplexity, een GPT-model, Gemini) ook geen eerste keus hebben. "3 van 3" krijgt voorrang. Hebben ze alle drie dezelfde favoriet (tandarts VS: Zocdoc), dan is er geen AI-gat en bouw je alleen als het zoekvolume het waard is.

**Welke gaten eerst**

1. Lokale diensten (schoonmaak, stomerij, advocaat, tandarts, massage). AI verwijst daar door naar een zoekplatform en kiest zelf niemand.
2. Beslissingen met een rekensom of een situatie (spaarrekening, energiecontract, rijbewijs, zonnepanelen).
3. Producten die bol en Amazon niet verkopen (huisrobot).

Sla over:
- brede woorden zonder koopvraag (verzekering, benzine). Die krijgen vanzelf geen eerste keus. Versmal ze eerst tot de echte vraag met het zoekvraag-onderzoek, of laat ze liggen;
- gewone winkelproducten waar AI al een favoriet heeft. Daar zit de winst in zoeken, niet in AI.

**AI-check vóór de bouw en daarna elke week**

- Staat de zoekterm niet in de lijst, stel de koopvraag dan los: https://demandradar-ivory.vercel.app/api/gaps?ask=<koopvraag>&site=<onze host>&key=<teamsleutel>. Het antwoord zegt wie de drie AI's noemen, of er een eerste keus is, of ze ons noemen (`named`), welke pagina's Perplexity aanhaalt (`sources`) en welke AI ons aanhaalt (`cited`).
- Zet de vraag bij de pagina (veld llmvraag of de eerste FAQ). Dezelfde vraag geeft binnen 7 dagen het bewaarde antwoord en daarna een nieuwe meting. `history` toont het verloop.
- Meld in het logboek wanneer een AI ons voor het eerst noemt. Een pagina die na 4 weken nergens genoemd wordt: eerst de eerste keus en de bronnen aanscherpen, dan pas iets nieuws bouwen.
- Vraag een AI nooit zelf om een "eerste keus", dan kiest hij er bijna altijd een. Stel alleen de koopvraag en lees het antwoord.

De volledige regels staan in de skill `zicht-seo-llm`, sectie AI-gaten (regel 1 tot en met 5).

**Beslisgidsen die al op een AI-gat staan (19 november 2026).** Verbeter deze, maak geen tweede.

| Land | Gat | Pagina | Bestand |
|---|---|---|---|
| NL | energiecontract | keuzehulp.best/energieleverancier-vergelijken | `lib/energie-keuze.js` |
| NL | zonnepanelen | keuzehulp.best/zonnepanelen | `lib/dienstgids.js` |
| NL | schoonmaakbedrijven | keuzehulp.best/schoonmaakbedrijf | `lib/dienstgids.js` |
| VS | hotel near me | whichtobuy.best/where-to-book-a-hotel-near-me-tonight-or-this-weekend | `lib/wtb-dienst.js` |
| VS | massage near me | whichtobuy.best/massage-near-me-where-to-book-and-how-much-it-costs | `lib/wtb-dienst.js` |
| VS | dentists | whichtobuy.best/dentists-how-to-find-one-with-or-without-insurance | `lib/wtb-dienst.js` |
| VS | humanoid robot | whichtobuy.best/humanoid-robot-for-home-which-one-can-you-buy-now | `lib/wtb-robot.js` |
| DE | führerschein | kaufberater.best/fuehrerschein-kosten-2026-theorie-app-fahrschule-ablauf | `lib/kb-dienst.js` |
| DE | tagesgeld konto | kaufberater.best/tagesgeld-vergleich-zinsen-2026-ohne-neukundenbonus | `lib/kb-dienst.js` |
| DE | anwalt | kaufberater.best/anwalt-erstberatung-kosten-online-fachanwalt-beratungshilfe | `lib/kb-dienst.js` |
| DE | reinigungen | kaufberater.best/reinigung-hemd-preis-textilreinigung-in-der-naehe | `lib/kb-dienst.js` |

Deze lijst is een geheugensteun. De sitemap en de lijst met `guide=none` zijn de waarheid.

## 3. Mag er gebouwd worden: nieuwbouwrem en kernfase

Henkjan, 18 nov 2026: "Eerst vindbaar worden, dan pas meer pagina's."

- **Nieuwbouwrem** (`lib/organic-policy.js`): bij minder dan de helft van de pagina's in Google hoogstens 2 nieuwe pagina's per dag op NL, 1 op VS en 1 op DE. Is de crawl ingestort, dan 0. Extra rondes omzeilen de rem niet.
- **Kernfase op keuzehulp.best** (sinds 18 nov 2026): alleen de kern van de sterkste keuzehulpen staat open en in de sitemap, de rest is noindex. Automatische nieuwbouw op NL staat stil tot de kern in Google staat. Verversen gaat door, binnen de kern.
- Stand van nu: https://hjdk-api-henq.vercel.app/api/zicht?op=organisch&t=1 en https://hjdk-api-henq.vercel.app/api/kzmaak?op=kort.
- **Een handgemaakte toppagina** krijgt `kern: true`. Zonder dat veld staat een nieuwe pagina in de kernfase op noindex.
- **Eén sterke pagina per echte vraag.** Geen varianten per getal, persoon of kleine zoekvariant die naar hetzelfde antwoord leiden. Dubbele en dunne pagina's ruimt `lib/kwaliteit.js` op (canonical, 301 of noindex).
- **Talen.** Elke keuzehulp hoort er in het Nederlands, Engels en Duits te komen (Henkjan, 10 nov 2026). Begin in het land waar de vraag zit. De andere talen volgen zodra de rem het toelaat.

## 4. Vanuit de gebruiker: zoektermen eerst

Henkjan: "ALs je hulp maakt is dat altijd door de pov vd gebruiker = dus zoek termen."

- **Zoekvolume.** Haal de zoekvraag op uit Demand Radar: https://demandradar-ivory.vercel.app/api/zoekvraag?thema=<id>.
  - Een nieuw thema voeg je toe in repo demand_radar (`THEMA` in `api/zoekvraag.js`).
  - Dit kost budget: één keer per thema, nooit in een lus.
- **Nichescan.** https://demandradar-ivory.vercel.app/api/zoekvraag?niche=NL (ook US en DE) geeft koop- en vergelijkvragen met een situatiewoord (voor, zonder, met, onder) en hoe zwak de top 10 is.
- **Titel en H1.** Zet de grootste zoekterm voorop. Een titel is hoogstens 60 tekens, de description hoogstens 155.
- **Eerste FAQ.** De eerste FAQ is letterlijk de vraag zoals mensen hem zoeken of aan een AI stellen ("Wat is de beste X in Y?"). Het antwoord begint met de uitkomst.
- **Rekenhulp: als het kan, altijd** (Henkjan, 19 nov 2026). Valt er iets te berekenen (kosten, maat, maandlast, besparing), dan krijgt de keuzehulp een rekenhulp. Rekenen gebeurt in de chat met pills, hoogstens één vraag per beurt. Werkwijze: skill `zicht-seo-llm`, sectie Zoekvraag-onderzoek.

## 5. Welke soort

| Soort | Waar | Voorbeeld |
|---|---|---|
| Productkeuzehulp, automatisch | NL `api/kzmaak.js` (onderwerp vastzetten: `STARTLIJST`), VS en DE `api/wtbmaak.js`. Moet de winkeltoets halen (bol of Amazon) | stekkerbatterij |
| Productkeuzehulp, met de hand | NL `lib/kz-hand.js` via /api/kzmaak?op=hand (dry=1 toont de bol-toets), VS en DE `lib/wtb-hand.js` via /api/wtbmaak?op=hand | raamrobot |
| Beslisgids: dienst, vergelijking of product dat de winkels niet verkopen | NL `lib/dienstgids.js` of een eigen module (`lib/energie-keuze.js`, `lib/huisdier.js`), VS `lib/wtb-dienst.js` en `lib/wtb-robot.js`, DE `lib/kb-dienst.js`. Direct live, zonder winkeltoets | zonnepanelen, massage near me, Tagesgeld |
| Lokale gids met alle zaken | `lib/rdam.js` (Rotterdam, per dienst en per zaak) | /rotterdam/tandarts |
| Rekenhulp | `lib/rekenhulp.js`, `lib/hypotheek.js` (rekenkern `lib/hypotheek-kern.js`) | kinderfiets-maat, hypotheek |

Lukt het schrijven in de bouwmotor niet, dan komt het onderwerp in de handwachtrij (/api/kzmaak?op=status, onder handwachtrij). Die schrijf je met de hand in `lib/kz-hand.js`.

### Eén eerste keus, op elke keuzehulp

- Het korte antwoord begint met één naam of één product, met de reden en een getal (prijs van vandaag, score, aantal reviews). Daarna pas "kies X als ...".
- Een rij van zes namen zonder keus is wat AI al geeft.
- Bij een beslisgids: één eerste keus per situatie, knoppen naar de aanbieder of de officiële bron.
- Prijzen en beschikbaarheid lees je op de pagina van de fabrikant of aanbieder zelf, niet op een vergelijkingssite of in een zoekresultaat. Zet de leesdatum erbij.

### Lokale gidsen

**Ranking: de Keuzehulp-score**

Altijd onze eigen score, nooit betaald (`lib/rdam.js`, `WEGING`):

| Onderdeel | Punten |
|---|---|
| Reviews | 45 |
| Aantal reviews | 20 |
| Platforms | 15 |
| Gegevens | 10 |
| Bezoekers | 10 |

- **Waarom plek N.** Elke zaak heeft een eigen pagina die dat uitlegt in gewone woorden.
- **Gegevens.** Alleen uit openbare bronnen (OpenStreetMap, de eigen site van de zaak), met bron en datum.
- **Eigenaar.** Eén regel naar `/rotterdam/voor-bedrijven`. Een vermelding is gratis, met een claimknop. Betalen koopt nooit een hogere plek.

**Ervaringen**

De link "Jouw ervaring" (`lib/ervaring.js`) laat bezoekers reageren en hun contact achterlaten.

- Na moderatie verschijnt één samenvatting vanaf 3 reacties.
- Nooit losse reviews.

## 6. Volgorde van een pagina

1. Kruimelpad "Keuzehulp › …".
2. Bovenregel: alleen "Keuzehulp X", hoogstens 40 tekens.
3. H1.
4. "Bijgewerkt 19 november 2026".
5. Inleiding.
6. Het antwoord (`.answer`): één vette zin met de eerste keus plus hoogstens 2 zinnen.
7. De chat met pills.
8. Producten of zaken.
9. Eén situatietabel.
10. Uitleg.
11. FAQ.
12. Volgende gidsen.
13. Aanmelden.
14. Voet in één regel.

Op 390×800 staan het antwoord en de eerste actieknop in het eerste scherm.

## 7. UX-regels (de keuring bewaakt ze)

**Contrast.**
- Geen grijze tekst. Alle tekst is #111113.
- Hiërarchie maak je met grootte en dikte, niet met grijs.
- Donkere kleuren alleen onder `html.hs-dk`, nooit via een losse `prefers-color-scheme` op een pagina die wit blijft.
- Minimaal WCAG 4,5.

**Typografie.**

| Gebruik | Maat |
|---|---|
| Bronnen en labels | 13 px |
| Lopende tekst, tabellen en pills | 16 px |
| H2 | 22 px |
| H1 | 38 px (mobiel) tot 54 px |

- Diktes 400 en 700.
- Hoofdletters alleen voor labels van hoogstens 3 woorden.
- Tekstregels hoogstens 68ch.

**Tekstblokken.**
- Hoogstens 3 regels per alinea op mobiel.
- Drie feiten of meer = een lijst.
- Bronnen niet tussen haakjes in de zin, maar in één regel eronder (`lib/leesbaar.js` `leesbaarBlok` doet dat voor lange tekst).
- Geen gedachtestreepjes, geen interne termen (zoekvolume, AC-opslag).
- Datums als "19 november 2026", decimalen met een komma.

**Knoppen.**
- Per kaart precies één gevulde zwarte pill: de hoofdactie.
- Tweede acties omrand.
- Bijzaken (Stuur door, Jouw ervaring, Meer) als tekstlink van 14 px.
- Dezelfde actie heeft overal dezelfde stijl.
- Hoogstens 4 vraag-pills in de chat.

**Tabellen.**
- Hoogstens 3 kolommen op mobiel. Breder stapelt `TABEL_JS` vanzelf.
- Geen knoppen in rijen, geen cel langer dan 140 tekens.
- Een tabel waarin elke rij hetzelfde antwoord geeft, gaat eruit.

**Herhaling en lengte.**
- Elk product en elke vraag hoogstens één keer als blok.
- Lijsten langer dan 20: eerst 20, dan "Toon alle N".
- Volgende gidsen: 6 zichtbaar.

**Inhoud.**
- Alleen feiten met bron en datum. Geen accessoire als "goedkoper alternatief".
- Advies op de pagina spreekt zichzelf niet tegen.
- Niet herkenbaar als AI-tekst.
- Geen nullen, geen "nog geen" en geen "niet gevonden". Is er niets te melden, dan staat de regel er niet.
- Nooit een interne prompt als vraag op de pagina ("I'm looking for: … Name specific names."): de FAQ-vraag is de echte zoekvraag in mensentaal. Antwoordblok en uitleg gaan door antwoordBlok en gidsBlok/leesbaarBlok (lib/leesbaar.js), op alle drie de sites.
- Nooit massaal gegenereerde pagina's, nep-reviews of verborgen tekst.

## 8. Aansluiten bij wat er al is (niet zelf opnieuw bouwen)

**Gedeelde laag.** `HUISSTIJL_CSS` uit `lib/huisstijl.js` hoort op elke pagina, via de kz/wtb-schil of `metHuisstijl`. Die laag brengt mee:

| Onderdeel | Bestand |
|---|---|
| Pills, geen grijs, gestapelde tabellen | `lib/huisstijl.js` |
| Doorsturen | `lib/deel.js` |
| Volgende gidsen per persoon | `lib/volgende.js` |
| Cijfers bij de chat | `lib/chatbewijs.js` |
| Meting | `measureTag` |

**Chat.** De chat is `kzuxBlok` (`lib/kzux.js`) en komt vanzelf via `chatErin` als de pagina er geen heeft. Antwoorden komen uit `lib/kzchat.js` met de FAQ van de pagina. Andere sites lenen deze chat, ze kopiëren hem niet (gids.kadoly.com, 19 nov 2026).

**Verdienen.**
- Winkelproducten: bol op keuzehulp.best, Amazon op whichtobuy.best en kaufberater.best, via de bestaande toets en linkbouw. Prijs altijd die van vandaag.
- Eigen aanbod waar het past: een keuzehulp met `kadoly=<gids>` toont drie keuzes van gids.kadoly.com (`lib/kz-kadoly.js`), met eerlijk erbij dat Kadoly bij dezelfde makers hoort.
- Diensten: alleen affiliate als er een echt programma is en het akkoord binnen is (huisdierenverzekering: gewone links tot Awin akkoord geeft). Anders een knop naar de aanbieder of de officiële bron.
- Uitgaande kliks lopen via Clickmind, zonder tussenpagina.

**Leren.**
- Elke variant is een Clickmind-proef in `lib/proef.js`, met een controle (versie a).
- Stand: /api/mm/proefstand?site=<proef>&vorm=tekst.
- De centrale leerlus haalt elke 15 minuten /api/keuze-leerlus?site=kz (us, de) op. Lees voor werk aan de lus eerst https://propellerads-mcp.vercel.app/api/leerlus en volg de skill `leerlus-henkjan`.
- De conversie van een campagnepagina is een echte vraag in de chat (dialoog), niet elke klik.

**Campagnes.**
- Altijd via een wissel `/w/<naam>` met pb dialoog.
- De advertentievraag als eerste pill (`lib/advraag.js`). Neem elke dag het geleerde uit de chat mee in de advertentie (Henkjan, 19 nov 2026).
- Bod en budget alleen op Henkjans woord, hoogstens $10 per dag per campagne. Skill `campagnes-henkjan`.

**Vindbaarheid.**
- Sitemap, llms.txt en interne links (verwante gidsen in dezelfde categorie).
- IndexNow na elke nieuwe pagina.
- Een proef in `START_PROEVEN` (`lib/zicht.js`).

**Mail.** Aanmelden staat één keer op de pagina. Elke mail volgt de skill `mail-lerend` en gaat via Resend.

## 9. Onderhoud (elke ronde)

1. **Uuroverzicht.** /api/keuze-tools?tool=groepen&vorm=tekst en stand4. Een chatvraag zonder antwoord wordt dezelfde dag een FAQ op de juiste pagina.
2. **Proeven.** Heeft een onderdeel een winnaar, dan wordt die de standaard en komt er een nieuwe uitdager bij.
3. **Prijzen en situatietabellen.**
   - Ververs de prijzen.
   - Controleer dat elke regel van de situatietabel nog verschilt.
   - Laat dode links weg.
4. **Keuring.** `lib/keuring.js` meet per pagina:
   - de paginabreedte op 390 px;
   - alinea's langer dan 5 regels;
   - tabellen breder dan het scherm;
   - lettermaten buiten de schaal;
   - grijze tekst;
   - de paginalengte.

   Repareer hooguit 5 problemen per ronde, bij de oorzaak.
5. **Lokale gidsen.**
   - Wekelijks verversen (op=ververs, beschermd).
   - Elke nacht de samenvattingen van ervaringen (op=wacht en op=cons).
6. **AI-vraag per pagina, elke week.** Dezelfde ask-URL als bij de bouw (sectie 2). Noteer wie ons noemt of aanhaalt.
7. **Handwachtrij.** Onderwerpen die de bouwmotor niet kon schrijven: /api/kzmaak?op=status.

## 10. Wat geld of tokens kost

- **Demand Radar.** Een zoekvraag-thema wordt hoogstens eens per 7 dagen gekocht. Een losse AI-vraag telt mee in de dagrem van 40 vragen. Nooit in een lus. Bij 503 één keer opnieuw na 00:00 UTC.
- **Inhoud.** Een handgids of beslisgids schrijf je zelf, met feiten die je op de bron hebt gelezen. Geen AI-aanroep bij het openen van een pagina.
- **Cloud.** Automatisch werk draait als cron op Vercel, niet op Henkjans computer. Geen nieuwe geplande Claude-taak zonder Henkjans woord (19 nov 2026: alle geplande taken uitgezet om de tokens). Geen Vercel-sandbox voor wat zonder kan.

## 11. Klaar is pas klaar als

- de module laadt, getest met een laadscript op de gewijzigde bestanden;
- de pagina met Playwright bekeken is op 390 en 1280 px, met de schermafbeelding zelf gelezen. HTML haal je met web_fetch_vercel_url op hjdk-api-henq.vercel.app; laad die via page.route op de echte URL en zet navigator.webdriver op false;
- het gepusht is (git pull --rebase, expliciete bestandsnamen, nooit git add -A of stash);
- het live opnieuw is nagekeken;
- er een regel in het logboek staat (`lib/overdracht-kz-tekst.js`, via de Edit-tool);
- `lib/werking.js` is bijgewerkt als de werking veranderde;
- er een regel in het werklog staat: /api/mm/handover?log=…&wie=keuzehulp-<chat>;
- je Henkjan kort in het Nederlands hebt gemeld wat er veranderde, met live links.

## 12. Melden aan Henkjan

- Nederlands, het resultaat eerst, met live links. Geen jargon.
- Alleen wat nieuw is. Wat al gemeld is herhaal je niet.
- Geen nullen.
- Cijfers haal je live op (overdracht, stand), nooit uit deze skill.
