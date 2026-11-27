---
name: "clickmind"
description: "Gebruik bij alles rond Clickmind, Henkjans systeem dat van elke klik leert: klikregister /go, wissel /w, lerende modal, catalogus, leerronde, terugbetalingsdossier. Site toevoegen, aan/uit, stand lezen."
---

# Clickmind

Clickmind (naam van Henkjan, 14 okt 2026) leert van elke advertentieklik en elk bezoek op zijn eigen sites. Code: repo henkjandekrijger-glitch/hjdk-api (api/mm.js, lib/mensmeter.js, lib/wissel.js, lib/leer.js, lib/terug.js, lib/modal.js). Vercel-project hjdk-api (prj_xAWlThjvk5VfU9AMN8GGI8LrdOSF, team team_9EYxyAU5QDExrrrOSKamefJT), deploy vanaf main. Schrijf kort, in gewoon Nederlands, met cijfers.

## Paspoort en geheugen: eerst de briefing, dan maken, dan melden (27 nov 2026)

Henkjan 27 nov 2026: "Clikmind moet altijd medium meenemen waarop en waarvoor en welk doel er gepost wordt en van ieder vorige bericht of alle vorige berichten leren", "Moet ook alle ad copy en creatives meenemen" en "Ook altijd vast bestaande research inladen zonder dat we daar ons vooleidig door laten leiden maar kan data voorsprong geven". Code `lib/paspoort.js`, test `scripts/test-paspoort.mjs`.

- Alles wat de deur uit gaat is een stuk met een paspoort: medium (waarop), voor (project, pagina, publiek) en doel (koop, aanmelding, store, antwoord, actie, echt, klik, reactie, bereik). Geldt voor advertentietekst en beeld, posts, reacties, video's en mails.
- Vóór je iets maakt: lees de briefing `https://hjdk-api-henq.vercel.app/api/mm/briefing?medium=<medium>&project=<id>&doel=<doel>` (web_fetch_vercel_url). Daar staan de vaste regels, wat hier aantoonbaar werkt en niet, de beste en slechtste stukken, wat elders werkt en hier nog niet is geprobeerd (neem er minstens één mee), de startkennis uit research en de laatste stukken (herhaal die niet).
- Research is een voorsprong, geen wet. Eigen cijfers gaan voor; de briefing zegt per researchregel of eigen data hem bevestigt of tegenspreekt. Nieuwe research of een vaste regel van Henkjan zet je met bron in `data/stuk-priors.json`.
- Geef het doel altijd mee: `doelsoort=<doel>` bij `op=distmaak`, `doelsoort` bij een video in Videomind, `?op=stuk&campagne=<netwerk>:<id>&doel=<doel>` na het aanmaken van een campagne. Een los stuk meld je met `?op=stuk&j={"medium":"...","project":"...","doel":"...","titel":"...","tekst":"...","haak":"...","pagina":"https://..."}`; zonder medium, project en doel wordt het geweigerd.
- Lezen: `https://hjdk-api-henq.vercel.app/geheugen` (pagina voor Henkjan), `/api/mm/stukken?vorm=tekst` (voor chats). De ronde loopt mee met de crons van het campagne-archief en Videomind; nu draaien: `/api/mm/stukken?run=1`.
- Oordeel eerlijk: een advertentie telt tegen wat je binnen zijn eigen campagne mocht verwachten, een post, video of mail binnen zijn project en medium. Dezelfde tekst in kopieën van een campagne telt als één stuk. Bij advertenties gaat het om de conversies die het netwerk per advertentie meldt (het doel waarop de campagne biedt); noem dat conversies, niet verkopen. Lessen per kenmerk (haak, emotie, opening, vraag, getal, lengte, prijs, knoptekst, vorm, onderwerp) tellen pas als ze aantoonbaar van de verwachting afwijken.
- Meld bij een post altijd de tekst (`tekst=` bij `op=distmaak`). Zonder tekst kan Clickmind niets leren van die post; de pagina telt ze.
- Het geheugen plaatst niets. Het enige wat het doorgeeft is de uit-lijst: een advertentie die binnen zijn eigen campagne hard mis is (hoogstens de helft van de verwachte conversies bij 3+ verwacht en 100+ kliks, liep de laatste 3 dagen nog) gaat mee in `/api/mm/vroeguit`; de ronde van het netwerk zet hem stil binnen zijn eigen grenzen (nooit onder 4 actief, hoogstens 10 per uur).
- In het geheugen staan ook de pins (boeken en keuzehulpen), de varianten van de lerende modal en de versies van de paginaproeven. Bestaande stukken met hun oordeel opvragen: `/api/mm/stukken?lijst=1&project=<id>&medium=<medium>[&regel=1][&uitslag=mis]`.

### Native en trend (Henkjan 27 nov 2026)

"Maak inderdaad voor ieder platform alles native EN check er altijd bij wat op dat moment goed werkt en maak daar altijd een alternatief mee . Dus trending of mega op dat plaform die kennis gebruik je ." Code `lib/trend.js`.

- Elk stuk is voor zijn eigen platform gemaakt: nooit dezelfde tekst op twee platforms.
- Bij elk stuk hoort een tweede versie op wat op dat moment groot is op dat platform. De briefing toont de trendkennis van het platform. Is die oud of leeg: zoek eerst op wat nu groot is (vormen, geluiden, onderwerpen, haken; minstens 2 bronnen van deze week) en meld het met `/api/mm?op=trend&j={"medium":"<platform>","wie":"<chat>","items":[{"wat":"...","vorm":"hoe je het native gebruikt","voorbeeld":"...","maat":"het getal","bron":"https://..."}]}`. Zonder https-bron wordt een trend geweigerd: niets verzinnen. Alles lezen: `/api/mm?op=trend&vorm=tekst`.
- Meld de twee als tweeling: `variant=native` en `variant=trend` met `trend=<welke trend>` en `paar=<id van de ander>` (bij `op=distmaak`, in Videomind of bij `op=stuk`). Het geheugen leert welke van de twee wint.
- Een videotrend met een getal gaat vanzelf naar de trendscan van Videomind; de briefing leest beide. Voor advertentienetwerken is de trend wat de laatste 14 dagen bij ons zelf het best liep.
- De dagronde zet zelf een taak "Trendcheck voor Clickmind" in de takenlijst als een gebruikt platform geen verse trendkennis heeft (3 dagen).

### Voorstel: Henkjan ziet het eerst

- Nieuwe advertentieteksten of een proef zet je op een link voor Henkjan: `/api/mm?op=voorstel&j={"titel":"...","project":"...","medium":"...","uitleg":"...","kosten":"...","meten":"...","stop":"...","items":[{"campagne":"<id>","campagneNaam":"...","oudId":"...","oudTitel":"...","oudTekst":"...","titel":"...","tekst":"...","cta":"...","variant":"native|trend","waarom":"..."}]}` (POST mag ook). Het antwoord geeft `https://hjdk-api-henq.vercel.app/voorstel?id=<id>`; zet die als `toon` in je stand.
- Een advertentietekst met een prijs of levertijd wordt geweigerd. Plaatsen pas na zijn ja: `?op=voorstel&id=<id>&besluit=ja`, en na het plaatsen `besluit=geplaatst`.
- Kijk vóór een advertentievoorstel de live stand na (campagne aan, oude advertentie aan). Het geheugen loopt een dag achter. Een voorstel voor campagnes die vandaag niet lopen wordt geweigerd; kan een voorstel niet meer, sluit het met `besluit=vervallen&notitie=<waarom>`. Les van 27 nov 2026: het voorstel kadoly-zonder-prijs ging over campagnes die die ochtend al uit stonden.

## Waar kijken

- Geld eerst (13 nov): https://hjdk-api-henq.vercel.app/api/geld — per project $ uit, $ waard (uitkomsten x de munt lib/waarde.js, Redis mm:waarde, instellen met de Opslaan-knop op die pagina), verspild en wat Clickmind deed. Begin elke analyse hier.
- Alles op één pagina: https://hjdk-api-henq.vercel.app/api/mm/overzicht (met de Vercel-tool web_fetch_vercel_url; hjdk-api.vercel.app stuurt door, gebruik de -henq-host).
- Modal per site: /api/mm/modalbeheer (lijst), /api/mm/modalbeheer?site=<site> (instelling, stand per aanbod, momenten, tekstvarianten), /api/mm/modalbeheer?catalogus=1.
- Klikregister: /api/mm/proef?dagen=2, /api/mm/zones, /api/mm/patronen, /api/mm/stand. Ruw: /api/mm/export?dag=, /api/mm/persoon?pid=.
- Wissels: /api/mm/wissel (?naam= voor stand en link).
- Leerronde: /api/mm/leer?lees=1. Blokvoorstel: /api/mm/blok?net=propeller.
- Terugbetaling: /api/mm/terugbetaling?net=propeller&van=&tot= (&formaat=csv, &max= tot 20.000 rijen).
- Bewezen zones per verkenner (80/20): /api/mm/bewezen. Zone Score (product): https://whichtobuy.best/zone-score en /api/zonescore?net=&zone=.

## Onderdelen

- cm.js, één regel per pagina: `<script src="https://whichtobuy.best/cm.js" data-site="<site>" async></script>`. Doet drie dingen: uitkomsten melden (automatisch echt, actie en aanmelding als er een klik-id mmc in de URL staat), de mensmeter (alleen bij betaald verkeer: zone, klik-id of mmc in de URL; uit met data-meet="0"), en de lerende modal.
- Staat op (14 okt): whichtobuy, kaufberater, keuzehulp (hjdk-api), todayin, Moonlighter, spel/Praisy (repo todayin), MyLevel (via p/engine.js, data-meet=0). Niet op finds.email (geen repo gevonden).
- /go en /w: klikregister en wissel voor Amazon-campagnes. Amazon krijgt alleen tag en ascsubtag per zone, nooit per klik (Associates §2(b)); herkomst niet verbergen (§6(v)).
- Leerronde elk uur op :12: zones, botfarms, wissel-gewichten, modal-modellen, zonekwaliteit (mm:zq), blokvoorstel. Blokkeren staat aan (Henkjan 14 okt). Nooit automatisch: de grootste bron van een campagne, en zones met een waardevolle uitkomst (actie, aanmelding, koop, lezer). Een zone met alleen 'echt' is beschermd tegen zwak bewijs, niet tegen sterk botbewijs (zwart, datacenter, 0x0, botfarm, headless, aankomst onder de grens, herhaalklikzone zonder waarde).
- Oordeel (13 nov): botfarm alleen bij minder dan 5% mens per vingerafdruk (gewone iPhones en Samsungs delen een vingerafdruk); wit pas bij 10+ gemeten en Wilson-ondergrens >= 10%; datacenter eerst.
- Geen conversie-postback naar het netwerk voor zones op het blokvoorstel (teller pbbot).
- Terugbetalingsdossier elke ochtend 05:40 UTC per netwerkdag (PropellerAds EST). PropellerAds dient Clickmind sinds 13 nov zelf in (lib/terugauto.js: mail aan support@propellerads.com van henkjan@todayin.email, Henkjan cc en antwoordadres, alleen sterk bewijs, eenmaal per dag; uit met mm:instelling terugAuto=false). Andere netwerken alleen op Henkjans woord: RichAds 5 dagen, MGID 30.
- Klikgrens (13 nov): elke nieuwe PropellerAds-campagne en kopie krijgt 1 klik per persoon per 24 uur per advertentie (propellerads-mcp). Wissel met roteer: true geeft een terugkomer binnen 24 uur een arm die hij nog niet zag.
- 80/20 (13 nov): bewezen zones op een aparte BEWEZEN-campagne naast de brede; de ochtendronde van propellerads-mcp (05:45 UTC) maakt of ververst die, hoogstens 1 nieuwe per project per dag.

## De lerende modal

- Per bezoek kiest de server: e-mail, een andere eigen site uit de catalogus (zelfde taal, niet de eigen site) of niets. Niets is de controlegroep: altijd minstens 10%.
- Leert per bezoeker (lineaire Thompson op 19 kenmerken: mobiel, terug, netwerk, zoekmachine, uur, land, eerder gezien of geklikt, zonekwaliteit, abonnee) op waarde in centen: hoofd (de gewone hoofdactie: klik naar buiten of de eigen aanmelding), klik, echt, actie, aanmelding, koop. Weinig data: leent van hetzelfde soort aanbod op alle sites.
- Leert ook het moment (exit, tijd 12/25/45, scroll 50/80) en de tekst. Claude schrijft hoogstens één nieuwe tekst per aanbod per dag (vanaf 150 keer getoond); verliezers gaan eruit, de starttekst blijft.
- Automatische rem: kost een aanbod aantoonbaar de hoofdactie en levert het minder op dan niets tonen, dan 7 dagen uit.
- Nooit Amazon in de modal, geen valse haast, geen beloning voor kopen. Nooit over een ander venster, niet bij typen, niet op betaal-, inlog- of winkelwagenpagina's, niet bij een lage mensmeter-score. Zoekbezoekers op mobiel alleen bij weggaan of 80% scrollen; op mobiel een onderbalk zonder donkere laag (geen Google-straf).
- E-mail: met doel moonlighter via https://moonlighter.email/api/cm-signup (welkomstmail en afmelden regelt Moonlighter; alleen Engelstalig), met doel eigen via window.mmAanmelden van de pagina, anders bewaard met de toestemmingstekst. Duitsland alleen met dubbele bevestiging.
- Testen: ?mmm=<aanbod-id> achter de pagina-URL toont dat aanbod direct, zonder te tellen.

## Beheren

- Modal aan of uit, een site of aanbod toevoegen, waarde van de hoofdactie: alleen op Henkjans woord. Zo:
  - /api/mm/modalbeheer?j=<JSON> met site, domeinen, taal, uit, waarde en armen (minstens {"id":"geen","soort":"geen"}). Bestaande modellen en teksten blijven bewaard.
  - Catalogus: /api/mm/modalbeheer?catalogus=1&j=[...] (id, host, taal, url met {site} {arm}, titel, tekst, knop).
  - Nieuwe site: cm.js in de head van de pagina's, config aanmaken (eerst uit), na 1 dag meten aanzetten.
- Waarde hoofdactie (14 okt): whichtobuy, kaufberater, keuzehulp 1 cent (Amazon- of bol-klik); todayin en Moonlighter 50 (aanmelding); spel 2 (delen); MyLevel 5 (modal uit, eigen vertrekvenster).
- Stand 14 okt: modal aan op whichtobuy (aanbod todayin, finds, AI-test van MyLevel); op de andere sites uit, meting en uitkomsten aan. kaufberater en keuzehulp hebben nog geen andere site in hun taal.
- De dagronde (cloudtaak AMZ dagelijkse verbeterronde) meldt per site één regel: bezoekers, dollar per 1.000 bezoekers per aanbod tegen de controlegroep, rem en nieuwe teksten.
- Zones blokkeren blijft voorlopig bij de bestaande wachten en lussen (todayin, spel, botzones, netwerkwachten). Clickmind levert alleen een voorstel tot Henkjan zegt dat de lussen het Clickmind-oordeel overnemen.

## Lessen

- 13 nov: Clickmind mat goed maar leerde op 'echt mens' en greep bijna niet in: 7 dagen $428 uit, 44% verspild, vooral herhaalkliks (39-44% van het geld naar mensen die we die dag al hadden), niet bots (~$0,20 per dag). Altijd eerst op geld per project kijken (/api/geld), dan pas op mensen.

- Amazon Associates verbergt per tag kleine aantallen (rij Other). Testtags met een paar honderd kliks per dag zijn daar niet te lezen: grotere testtags, of Download Reports.
- Een tussenstand van Associates slingert beide kanten op (vroeg op de dag te hoog door bestellingen van gisteravond, overdag te laag). Alleen hele dagen.
- Een //-commentaar midden in een regel met meer code breekt de pagina (wtb 14 okt, 4 minuten fout). Gebruik /* */ en controleer runtime-fouten na elke deploy.
- Wijzigingen in andere repo's (todayin, MyLevel) en het aanzetten van de modal vragen Henkjans expliciete akkoord; het systeem blokkeert anders.