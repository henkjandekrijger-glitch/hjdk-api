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
   - In een cloudsessie: gebruik web_fetch_vercel_url (curl naar deze domeinen wordt geblokkeerd).
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

## Persoonsmerken en mediapieken (taniakross.media en dergelijke)

- Na tv, radio of krant zoeken mensen de naam op en landen op de homepage. Ze kijken alleen naar het bovenste scherm (27 okt 2026: 46 van 48 zoekbezoekers, mediaan 32 seconden). Zet daar wat ze dan zoeken: wat er nu en binnenkort te zien en te horen is, en een snelle aanmelding (les mediapiek-bovenaan-antwoord).
- Wikipedia is bij een piek de tweede ingang (13% van het bezoek). Alleen echte, controleerbare nieuwe feiten toevoegen, met de eigen site als bron, nooit eigen promotie (les wikipedia-ingang-mediapiek).
- Zet een tv- of radio-optreden vooraf in de eigen agenda van de site, zodat de site er die avond klaar voor is.
- Een feitenpagina met echte vragen (taniakross.media/vragen) en de eigen site als bron in de Person-gegevens helpen AI om de site te citeren in plaats van alleen andere bronnen.

## Gaten zoeken

- Gatscan: /api/zicht?op=gapscan&naam=<naam>&v=vraag1|vraag2|... stelt tot 40 echte koop- of keuzevragen aan Perplexity en laat per vraag zien welke soort bronnen geciteerd worden (betaalmuur, forum, winkel, media, buitenlands), of er een prijs of maat in het antwoord staat, en welke antwoorden het zwakst zijn. Zonder token 6 scans per dag.
- Les uit de scan van 17 okt 2026: AI beantwoordt maatvragen zelf goed (daar is geen AI-gat), maar bij 'beste X onder EUR Y' en situatievragen leunt het op één dunne bron zonder actuele prijs. Een tabel per situatie met product en prijs van vandaag, zonder klikken leesbaar, vult dat gat.
- In Google zitten de kansen juist wel in maat- en rekenvragen met een zwakke top: één sterke rekenpagina per echte vraag, met tabel, meetuitleg, vragen als kopjes en een product per maat.

## Controlelijst bij elke wijziging (uit de audit van 20 okt 2026)

- **hreflang:** elke taalversie noemt alle andere en zichzelf, plus x-default. Mist er één, dan negeert Google de hele set. Alleen tussen echte vertalingen, nooit tussen verschillende gidsen per markt.
- **Clusters linken onderling:** elke onderwerppagina linkt naar 6 onderwerpen uit dezelfde groep, 2 uit een andere en naar de hub, als gewone links in de HTML (lib/cur.js meerBlok).
- **Hub en voorpagina openen met een kort antwoord:** feiten uit de eigen pagina's (met bron daar) en 5 tot 6 FAQ's met FAQPage. Geen nieuwe cijfers zonder bron.
- **Antwoord past bij de lezer van die taal:** DE begint bij vertrek uit Duitsland, ES en PT bij Zuid-Amerika, niet bij de VS.
- **Schema:** auteur en uitgever zijn de site als organisatie (geen persoonsnaam, Henkjan 20 okt). In lijsten krijgt elk item een type (Hotel, Restaurant, Beach) met land CW en plaats. Geen aggregateRating met scores van derden.
- **Titels:** hooguit ~60 tekens, description hooguit 155.
- **Geen gedachtestreepjes** in titels, beschrijvingen, llms.txt of zichtbare tekst. Controleer met grep op het teken voor elke push.
- **Afbeeldingen:** alt met de productnaam, plus breedte en hoogte. Serveer foto's nooit via een rewrite naar Vercel Blob: die stuurt `X-Robots-Tag: noindex` en `max-age=60` mee, zodat ze niet in Google Afbeeldingen komen en elke keer opnieuw laden. Lever ze via een eigen functie (sharp) met `<picture>`, AVIF en WebP in 320 tot 1600 breed, `loading="lazy"` onder het bovenste scherm, `fetchpriority="high"` op de grootste foto bovenin en een versie in de URL zodat een jaar cache veilig is (les foto-eigen-adres, taniakross.media 28 okt). Geen foto's als data:image in de HTML.
- **llms.txt:** per onderwerp en taal een eigen kopje, en de intro noemt alle soorten inhoud.
- **Eerst de lijst, dan de vragen:** mensen en AI willen een korte 'beste voor'-lijst met tabel en de prijs van vandaag. De keuzehulp staat eronder als knop, niet als drempel (les keuzehulp-als-knop-niet-drempel).
- **Nog open:** pagina's aan de rand van Vercel bewaren (s-maxage) kan pas als de telling van AI-crawlers niet meer op de server hangt (telBot). Ook nog open: de zoekindex van de NL-voorpagina (88 KB) pas laden bij gebruik, en afgekapte slugs in api/wtbmaak.js.
- **Een audit doe je met een aparte agent die alleen leest:** die controleert de live pagina's, sitemap, llms.txt en robots per host en levert een lijst met bestand en regel. Daarna voer je de top uit en zet je proeven in START_PROEVEN.

## Na elke wijziging: terugmelden

Zonder terugmelding leert niemand ervan.

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
