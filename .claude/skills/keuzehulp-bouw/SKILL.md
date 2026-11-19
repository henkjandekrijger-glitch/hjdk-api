---
name: keuzehulp-bouw
description: Gebruik bij het maken, verbeteren of onderhouden van een keuzehulp op keuzehulp.best, whichtobuy.best of kaufberater.best (product, dienst, lokale gids of rekenhulp): bouwprotocol, UX-regels en hoe je aansluit bij wat er al is.
---

# Keuzehulp bouwen en onderhouden

Bron van deze skill: repo henkjandekrijger-glitch/hjdk-api, `.claude/skills/keuzehulp-bouw/SKILL.md`. Verander je de werkwijze, pas dan dit bestand aan in dezelfde commit en zet een regel in het logboek van `lib/overdracht-kz-tekst.js`.

Henkjan, 19 nov 2026: "Zullen we hiervan skill maken hoe je keuzehulp maakt, onderhoud en ook aansluit bij de bestaanden?" en "Stop in Keuzehulp bouw en onderhoud protocol altijd max contrast dus geen grijs."

## 1. Altijd eerst

1. Lees de levende overdracht: https://hjdk-api-henq.vercel.app/api/kz?op=overdracht (met web_fetch_vercel_url). Daarin staan het logboek van andere chats, de lopende proeven en de stand. Doe niets dubbel en draai niets terug.
2. Vindbaarheid: volg ook de skill `zicht-seo-llm`.
3. Kijk of de keuzehulp al bestaat:
   - sitemap: https://hjdk-api-henq.vercel.app/api/kz?op=sitemap;
   - `data/kz.json`;
   - `lib/dienstgids.js`, `lib/wtb-dienst.js`, `lib/kb-dienst.js`, `lib/rdam.js`.
   Bestaat hij al: verbeter hem, maak geen tweede.

## 2. Vanuit de gebruiker: zoektermen eerst

Henkjan: "ALs je hulp maakt is dat altijd door de pov vd gebruiker = dus zoek termen."

- **Zoekvolume.** Haal de zoekvraag op uit Demand Radar: https://demandradar-ivory.vercel.app/api/zoekvraag?thema=<id>.
  - Een nieuw thema voeg je toe in repo demand_radar.
  - Dit kost budget: één keer per thema, nooit in een lus.
- **AI-gaten.** https://demandradar-ivory.vercel.app/api/gaps?latest=1 laat vragen zien waar AI geen duidelijke eerste keus heeft. Die vullen wij.
- **Titel en H1.** Zet de grootste zoekterm voorop. Een titel is hoogstens 60 tekens, de description hoogstens 155.
- **Eerste FAQ.** De eerste FAQ is letterlijk de vraag zoals mensen hem zoeken ("Wat is de beste X in Y?"). Het antwoord begint met de uitkomst.

## 3. Welke soort

| Soort | Waar | Voorbeeld |
|---|---|---|
| Productkeuzehulp | `data/kz.json` (en kz-hand), weergave in `api/kz.js`; US/DE via `api/wtb.js` | raamrobot, stekkerbatterij |
| Dienstgids zonder producten | `lib/dienstgids.js` (NL), `lib/wtb-dienst.js` (US), `lib/kb-dienst.js` (DE) | zonnepanelen, massage near me, Tagesgeld |
| Lokale gids met alle zaken | `lib/rdam.js` (Rotterdam, per dienst en per zaak) | /rotterdam/tandarts |
| Rekenhulp | `lib/rekenhulp.js`, `lib/hypotheek.js` | kinderfiets-maat, hypotheek |

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
- **Eigenaar.** Eén regel naar `/rotterdam/voor-bedrijven`.

**Ervaringen**

De link "Jouw ervaring" (`lib/ervaring.js`) laat bezoekers reageren en hun contact achterlaten.

- Na moderatie verschijnt één samenvatting vanaf 3 reacties.
- Nooit losse reviews.

## 4. Volgorde van een pagina

1. Kruimelpad "Keuzehulp › …".
2. Bovenregel: alleen "Keuzehulp X", hoogstens 40 tekens.
3. H1.
4. "Bijgewerkt 19 november 2026".
5. Inleiding.
6. Het antwoord (`.answer`): één vette zin plus hoogstens 2 zinnen.
7. De chat met pills.
8. Producten of zaken.
9. Eén situatietabel.
10. Uitleg.
11. FAQ.
12. Volgende gidsen.
13. Aanmelden.
14. Voet in één regel.

Op 390×800 staan het antwoord en de eerste actieknop in het eerste scherm.

## 5. UX-regels (de keuring bewaakt ze)

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

- Nooit een interne prompt als vraag op de pagina ("I'm looking for: … Name specific names."): de FAQ-vraag is de echte zoekvraag in mensentaal. Antwoordblok en uitleg gaan door antwoordBlok en gidsBlok/leesbaarBlok (lib/leesbaar.js), op alle drie de sites.

## 6. Aansluiten bij wat er al is (niet zelf opnieuw bouwen)

**Gedeelde laag.** `HUISSTIJL_CSS` uit `lib/huisstijl.js` hoort op elke pagina, via de kz/wtb-schil of `metHuisstijl`. Die laag brengt mee:

| Onderdeel | Bestand |
|---|---|
| Pills | — |
| Doorsturen | `lib/deel.js` |
| Volgende gidsen per persoon | `lib/volgende.js` |
| Cijfers bij de chat | `lib/chatbewijs.js` |
| Geen grijs | — |
| Gestapelde tabellen | — |
| Meting | `measureTag` |

**Chat.** De chat is `kzuxBlok` (`lib/kzux.js`) en komt vanzelf via `chatErin` als de pagina er geen heeft. Antwoorden komen uit `lib/kzchat.js` met de FAQ van de pagina.

**Leren.**
- Elke variant is een Clickmind-proef in `lib/proef.js`, met een controle (versie a).
- Stand: /api/mm/proefstand?site=<proef>&vorm=tekst.

**Campagnes.**
- Altijd via een wissel `/w/<naam>` met pb dialoog.
- De advertentievraag als eerste pill (`lib/advraag.js`).
- Bod en budget alleen op Henkjans woord, hoogstens $10 per dag per campagne. Skill `campagnes-henkjan`.

**Vindbaarheid.**
- Sitemap, llms.txt en interne links (verwante gidsen in dezelfde categorie).
- IndexNow na elke nieuwe pagina.
- Een proef in `START_PROEVEN` (`lib/zicht.js`).

## 7. Onderhoud (elke ronde)

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

## 8. Klaar is pas klaar als

- de module laadt, getest met een laadscript op de gewijzigde bestanden;
- de pagina met Playwright bekeken is op 390 en 1280 px, met de schermafbeelding zelf gelezen. HTML haal je met web_fetch_vercel_url op hjdk-api-henq.vercel.app; laad die via page.route op de echte URL en zet navigator.webdriver op false;
- het gepusht is (git pull --rebase, expliciete bestandsnamen, nooit git add -A of stash);
- het live opnieuw is nagekeken;
- er een regel in het logboek staat (`lib/overdracht-kz-tekst.js`, via de Edit-tool);
- `lib/werking.js` is bijgewerkt als de werking veranderde;
- er een regel in het werklog staat: /api/mm/handover?log=…&wie=keuzehulp-<chat>;
- je Henkjan kort in het Nederlands hebt gemeld wat er veranderde, met live links.
