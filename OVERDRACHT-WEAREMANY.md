# Overdracht we are many now: de dossiersite

Voor een volgende chat of een ander account. Live te lezen op Vercel (achter de Vercel-inlog, met de tool web_fetch_vercel_url): https://hjdk-api-git-wam-dossier-henq.vercel.app/api/wam?op=doverdracht en, zodra de branch op main staat, https://hjdk-api-henq.vercel.app/api/wam?op=doverdracht. Onderaan staat dan de live stand.
Bijgewerkt: 23 november 2026. Werk dit bestand bij in dezelfde commit als elke wijziging, met een regel in het logboek onderaan.

## Wat het is

we are many now (wearemany.now, Adsfair B.V.) bundelt losse klachten over hetzelfde bedrijf tot één dossier met bewijs, een cijfer en één stem. Kader: "machteloos tegen een bedrijf", niet "erger je kapot". De naam schrijf je in kleine letters met spaties. Op wearemany.now draait ook Whoz, de chat (lib/wam.js); die blijft op de root staan tot Henkjan anders zegt.

Henkjan is niet technisch. Praat Nederlands, kort, één stap tegelijk, en doe het technische werk zelf.

## Stand

| Onderdeel | Stand |
|---|---|
| Ontwerp, alle schermen | Af, op https://ontwerp.wearemany.now (noindex, zwarte balk "Ontwerp") |
| Stap 1 echt: melden, tellen, e-mail, vijf pagina's | Gebouwd en getest op de proefversie, branch `wam-dossier`. NIET op main, dus niet op wearemany.now |
| Dossiers met cijfer en wet (Blendle, ANP, hosters) | Alleen ontwerp. Wacht op een jurist |
| "Wij zeggen voor je op" | Alleen ontwerp. Wacht op een jurist |
| Mails aan melders | Bestaan niet. Eerst langs de POST-lus en langs Henkjan |
| Vindbaarheid (ZICHT) | Lessen toegepast in de pagina's. Nog niet aangemeld, de pagina's zijn noindex |

## Waar alles staat

- Echte code: repo hjdk-api, branch `wam-dossier`. `lib/wam-dossier.js` (pagina's, melden, tellen, stand), aangeroepen vanuit `fn/wam.js` (`DOS.OPS`), rewrite in `vercel.json` voor `/nl /start /achtergrond /pers /vriendenloterij-opzeggen` op wearemany.now, test `test/wam-dossier.test.mjs` (`node --test test/wam-dossier.test.mjs`).
- Proefversie: https://hjdk-api-git-wam-dossier-henq.vercel.app/api/wam?op=dpagina&p=nl (achter Vercel-inlog; `p=start`, `achtergrond`, `pers`, `vriendenloterij-opzeggen`). Een branch bouwt hier niet vanzelf: maak de proef met de Vercel-tool `create_deployment`, `gitSource` github `henkjandekrijger-glitch/hjdk-api` ref `wam-dossier`, project `hjdk-api`.
- Controle: `/api/wam?op=dstand` (tellers en lekken met drempels) en `/api/wam?op=dtest` (droge proef: leest de AI een voorbeeldmelding), beide alleen op de beschermde host.
- Ontwerp: Vercel-project `wearemany-ontwerp` (team henq), domein ontwerp.wearemany.now. Alleen tekstbestanden, geen functies, geen repo.
- Zoekdata: Demand Radar, thema `machteloos` (repo demand_radar, `api/zoekvraag.js`): https://demandradar-ivory.vercel.app/api/zoekvraag?thema=machteloos
- Overdracht van Whoz en WAM als geheel: https://hjdk-api-henq.vercel.app/api/wam?op=overdracht

## Hoe stap 1 werkt

1. `/start`: iemand plakt tekst of uploadt een foto of pdf. De browser verkleint foto's tot 1600 px; een pdf mag 3 MB zijn.
2. `POST /api/wam?op=dmeld`: AI (Haiku) leest bedrijf, bedrag, datum, soort en één zin zonder namen. De tekst en de bestanden worden niet bewaard.
3. Tellen: één keer per bezoeker per bedrijf (Redis `wmn:tel`, namen in `wmn:naam`, melding in `wmn:m:<id>`).
4. Leest de AI het bedrijf niet, of is de dagrem (800) of de uurrem (15 per bezoeker) bereikt, dan vraagt de pagina zelf om de bedrijfsnaam.
5. `POST /api/wam?op=dmail`: het e-mailadres komt bij de melding. Er gaat geen mail uit.
6. De pagina's zijn noindex tot `GET /api/wam?op=dlive&aan=1` op de beschermde host (kv `wmn:live`).

Getest: de eenheidstest (6 slaagt), het formulier met een nagebootste server, en op de proefversie `dstand` en `dtest` (AI las Ziggo, €49,50, oktober 2026 in 2,5 seconde). Niet getest: een echte melding met foto of pdf door de proefversie.

## Het ontwerp bijwerken (ontwerp.wearemany.now)

De pagina is één HTML-bestand, in stukken uitgerold omdat er geen repo achter zit:

- `a.txt b.txt c.txt d.txt`: de pagina in vier delen, gecodeerd: `~` staat voor `"`, een backtick voor `\`, `¦` voor een regeleinde.
- `e.txt f.txt g.txt h.txt` (ruimte tot `j.txt`): wijzigingen. Paren `zoek QyQ vervang`, gescheiden door `QxQ`, toegepast in volgorde op de gecodeerde tekst.
- `index.html`: de lader. Die haalt alles op, past de wijzigingen toe, decodeert en schrijft de pagina.

Bron terughalen: haal de bestanden op met de Vercel-tool `get_deployment_file_contents` of gewoon van het domein, plak a tot d aan elkaar, pas e tot j toe, en vervang `~` door `"`, de backtick door `\` en `¦` door een regeleinde. Wijzigen: bewerk de HTML, maak van het verschil een nieuw wijzigingsbestand (de volgende letter) en rol uit met `create_deployment` (project `wearemany-ontwerp`, target `production`): alleen het nieuwe bestand als tekst, de rest als verwijzing met `sha` en `size`. Controleer daarna met `list_deployment_files` dat de sha's kloppen. Bij veel wijzigingen: de hele pagina opnieuw in vier delen.

Sha1 en grootte van de vaste bestanden: a `dcacad529fac7b81c153a41f1b45aeb82fc62ef9` 17742 · b `9eed4708cce223bc6cf8dcfb5e8fe13b216b35fd` 17817 · c `d024f6ee9132dfae0c7bc9d2ffc9826f02b53248` 17805 · d `3a8a9aad0a2332bd5a3958786ab9b746db7dbd26` 17804 · e `af56c36282e541cee7619497978a7d758055cc83` 5921 · f `e85d9e95695c181609076c9f0a28e8a051d2557f` 3637 · g `46ea5ddc5dafd38201c31289a8be9ae3f0b491ef` 268 · index.html `fc74c1d34590425cfd794abe1a83f6b89ebb9854` 863 · favicon.svg `4489141bd5a23fa7b25f16c22511f275eb10920e` 248 · robots.txt `63657cbb7d7086c56b0cd4e5c6999bb683664868` 26 · vercel.json `6790a64721010f6de648e21abb8e8d2d588442c7` 95. h `d8b4f5f74b97553ff77afb98a4c4bfa7b6542db1` 292.

Schermen in het ontwerp (achter `#`): voorkant, nu, melders, modal, gesprek, opgelost (Blendle), anp, hosters, vriendenloterij, opzegmails, over, pers, seo (plan vindbaarheid en juridisch), start, dagmail, advertenties.

## Afspraken met Henkjan (hard)

- Alles eerst laten zien met een link voordat het live gaat. Naar main pushen (dat is live) alleen op zijn woord: "ja live".
- Nooit grijs. Zo min mogelijk verschillende lettermaten en stijlen. Nooit nultellers. Geen gedachtestreepjes.
- Kort, eenvoudig Nederlands. Eén vraag per keer. Zuinig met tokens en met builds.
- Sleutels nooit lezen, tonen of gebruiken. Deze repo is openbaar.
- Geen e-mailadres van Henkjan op pagina's: contact loopt via de chat (https://wearemany.now/#henkjan).
- Advertentiecampagnes waar hij niet om vroeg niet wijzigen. De root van wearemany.now is Whoz en kan een landingspagina van campagnes zijn.
- De ACM-melding tegen Blendle alleen op "ja ACM". De tweet aan Klöpping alleen op "ja tweet".
- Het woord "scam" niet gebruiken. Bij ANP ook melden dat ANP zaken wint. Materiaal van derden die hem mailden over ANP niet gebruiken zonder hun toestemming.
- Dossiers met cijfer en wetsparagraaf, en "wij zeggen voor je op", pas na één jurist. Henkjan mag dat zelf openbreken.
- Mail aan melders of bedrijven: skill mail-lerend (POST-lus), het concept eerst in de chat laten zien, verzenden via Resend.

## Open punten, in deze volgorde

1. **Voorkant: bij elk van de tien kort hoe het bedrijf bekend staat, met "meer »" en de bronnen** (Henkjan 23 nov: "Zet bij alle dingen op voorkant ook kort hoe ze bekend staan met meer >> en de bronnen"). Nog niet gedaan: het vraagt per bedrijf echt bronnenonderzoek. Vorm: één neutrale regel per bedrijf met een feit en datum, uitklapbaar met `<details>` (twee of drie regels en de bronnen als links). Bronnen: klacht.nl (aantal, % opgelost, cijfer), Consumentenbond, Radar, Kassa, ACM, Trustpilot. Alleen wat op de bronpagina zelf staat, met datum. Geen oordeel van ons. Tien bedrijven: VriendenLoterij, Postcode Loterij, Videoland, Flanderijn, Ziggo, NS, PostNL, KPN, Intrum, ANWB.
2. "ja live" van Henkjan: branch `wam-dossier` op main (eerst `git fetch` en rebase, test, dan push). Daarna `op=dstand` op de echte host nakijken en zelf één melding met foto doen.
3. Eigen opzegpagina voor de andere negen, zoals de VriendenLoterij, alleen met gecontroleerde opzegwegen. Gecontroleerd: Ziggo `ziggo.nl/opzeggen/formulier`, KPN `kpn.com/service/administratie/opzeggen`, Videoland `videoland.com/account` (alleen via de website). Niet gecontroleerd: telefoon en adres van de VriendenLoterij (088 020 10 20, Beethovenstraat 200, 1077 JZ Amsterdam, uit het reglement zoals aangehaald op een forum) en de opzeglinks van beide loterijen.
4. Privacypagina (`op=privacy` in fn/wam.js) beschrijft alleen de chat: alinea over meldingen erbij.
5. Bevestigingsmail na aanmelden, en de dagmail: eerst het concept.
6. Jurist: de machtiging en voorwaarden van "wij zeggen voor je op", het cijfer en de wetsparagrafen.
7. "Wij zeggen voor je op" bouwen zoals in het ontwerp (#vriendenloterij, #opzegmails, #seo): e-mail, naam, postcode en huisnummer, één vinkje machtiging, één tik in de mail, wij mailen namens de klant vanaf ons eigen adres met de klant in de cc en een eigen antwoordadres, volgpagina, dag 7 herinnering, dag 14 brief (wie die brief betaalt is niet beslist). Wij nemen nooit een aanbod aan. Artikelen: 3:60, 3:71 en 3:37 lid 3 BW, 6:236 onder o BW. Per bedrijf pas aan als het mailadres gecontroleerd is.
8. Idee uit Henkjans onderzoek naar collectieve macht, nog niet beslist: "ik zeg op als 100 anderen meedoen", en bij 100 gaan alle opzeggingen op één dag weg. En: de voorkant telt daden (opzeggingen, geld terug), niet sympathie.
9. Na live: de site aanmelden bij ZICHT met `/zicht.json` (toegepast: titel-zoekterm-voorop, antwoord-bovenaan, statistieken-toevoegen, datum-recency-bias, ssr-gids-inhoud, geen-doorway-paginas, faq-uit-zoekvragen; proef: de zoekpagina's tegen de dossierpagina's, 21 dagen, metric gsc), sitemap, IndexNow, en dan pas `op=dlive&aan=1`.
10. Wanneer de voorkant van wearemany.now de dossiersite wordt en Whoz naar een eigen pad gaat: Henkjans besluit, en eerst nagaan welke campagnes op de root landen.
11. Open vragen aan Henkjan: zijn eigen band met een van de bedrijven in de dossiers vermelden op Achtergrond; het ANP-dossier op naam van Adsfair B.V. of op zijn eigen naam; uploads weggooien (nu) of bewaren als bewijs.
12. Het logboek van Demand Radar heeft nog geen regel over het thema machteloos (dat vraagt de teamsleutel; die gebruiken wij niet zelf).
13. Het project `wearemany-ontwerp` kan weg zodra de echte site live is en het ontwerp niet meer nodig is.

## Cijfers en feiten die gebruikt zijn

Zoekvragen per maand in Nederland (Demand Radar, thema machteloos, november 2026): opzeggen vriendenloterij 33.100 (twaalf maanden tussen 27.100 en 49.500), opzeggen postcodeloterij 22.200, opzeggen videoland 18.100, incasso flanderijn 14.800 (+175% in een jaar), opzeggen ziggo 9.900, geld terug bij vertraging ns 9.900, klacht postnl 5.400, opzeggen kpn 4.400, incasso intrum 3.600 (+26%), opzeggen anwb 3.600. Eigen dossiers hebben bijna geen zoekvolume, daarom twee lijsten op de voorkant van het ontwerp.

klacht.nl, hosters, 23 november 2026: Mijndomein 272 klachten, 9% opgelost; Hostnet 95, 86%; Strato 417, 74%; Yourhosting 133, 48%; Vimexx 28, geen oplospercentage.

Andere landen: SignalConso (Frankrijk) 460.000 meldingen in 2025, 85% van de bedrijven antwoordt; CFPB (VS) 15 dagen om te antwoorden, daarna openbaar; Reclame Aqui (Brazilië) cijfer uit antwoord, oplossing en terugkomen; Duitsland: meedoen aan een massaclaim is gratis, 116.000 mensen tegen Vodafone.

Voorstel cijfer per bedrijf (1 tot 10): antwoord 3 punten (binnen 15 dagen), oplossing 4 (deel van de melders dat geld of een oplossing kreeg), stopt het 2, openheid 1. Laagste cijfer 1, elk punt terug te verdienen, pas bij 10 melders en na 15 dagen wederhoor.

## Voor een nieuw account

- GitHub: schrijftoegang tot `henkjandekrijger-glitch/hjdk-api` en `demand_radar`. Vraag Henkjan om het letterlijk te zeggen ("je mag in hjdk-api schrijven"); zonder zijn woord wordt de toegang geweigerd.
- Vercel-koppeling op team henq, voor de proefversies, `web_fetch_vercel_url` en het project `wearemany-ontwerp`.
- Het Claude-artifact van het ontwerp gaat niet mee naar een ander account. Het ontwerp zelf staat volledig op ontwerp.wearemany.now.
- Begin met CLAUDE.md van hjdk-api en de live handover https://hjdk-api-henq.vercel.app/api/mm/handover.

## Logboek (nieuwste bovenaan)

- 23 nov 2026: overdracht geschreven. Knop op de voorkant is "Plak je verhaal". Links werken op het proefadres. Contact op Pers via de chat, geen mailadres. Open: de regels "hoe ze bekend staan" met bronnen.
- 23 nov 2026: stap 1 gebouwd op branch `wam-dossier` (melden, tellen, e-mail, vijf pagina's, dstand, dtest). Push naar main geweigerd zonder Henkjans woord.
- 23 nov 2026: ontwerp op ontwerp.wearemany.now, met Achtergrond, Pers, upload en favicon. Thema machteloos in Demand Radar gemeten ($0,27).
