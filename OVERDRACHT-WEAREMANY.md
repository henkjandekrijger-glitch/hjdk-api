# Overdracht we are many now: de dossiersite

Voor een volgende chat of een ander account. Actuele overdracht op main, met live stand: https://hjdk-api-henq.vercel.app/api/wam?op=doverdracht (achter Vercel-inlog).
Bijgewerkt: 23 november 2026. Werk dit bestand bij in dezelfde commit als elke wijziging, met een regel in het logboek onderaan.

## Wat het is

we are many now (wearemany.now, Adsfair B.V.) bundelt losse klachten over hetzelfde bedrijf tot één dossier met bewijs, een cijfer en één stem. Kader: "machteloos tegen een bedrijf", niet "erger je kapot". De naam schrijf je in kleine letters met spaties. Op wearemany.now draait ook Whoz, de chat (lib/wam.js); die blijft op de root staan tot Henkjan anders zegt.

Henkjan is niet technisch. Praat Nederlands, kort, één stap tegelijk, en doe het technische werk zelf.

## Publicatie van 23 november 2026

Henkjan gaf opdracht: "Zet live op WAM en meteen goede favo ico". De bronregels en het goedgekeurde verhaal worden daarmee op main gepubliceerd. Op /nl staat de korte tekst met een link naar /achtergrond#waarom-afpoeieren. Het artikel beschrijft de aanpak als visie; verdere opvolging en bewijscontrole zijn nog niet gebouwd. Chat en dossiersite gebruiken één zwart-wit groepsicoon, met SVG, PNG (32), Apple (180) en een echt ICO (16/32/48). Favicon-adressen zijn uitsluitend voor de WAM-host herschreven naar op=dico. De root blijft de chat. Dossiers met cijfers en de opzegservice blijven ontwerp.

## Stand

| Onderdeel | Stand |
|---|---|
| Ontwerp, alle schermen | Af, op https://ontwerp.wearemany.now (noindex, zwarte balk "Ontwerp") |
| Stap 1 echt: melden, tellen, e-mail, vijf pagina's | Live op wearemany.now sinds 23 nov 2026 (Henkjan: "Ja zet live"): /nl /start /achtergrond /pers /vriendenloterij-opzeggen. Noindex en nergens gelinkt tot `op=dlive&aan=1`. De root is nog Whoz |
| Dossiers met cijfer en wet (Blendle, ANP, hosters) | Alleen ontwerp. Wacht op een jurist |
| "Wij zeggen voor je op" | Alleen ontwerp. Wacht op een jurist |
| Mails aan melders | Bestaan niet. Eerst langs de POST-lus en langs Henkjan |
| Vindbaarheid (ZICHT) | Lessen toegepast in de pagina's. Nog niet aangemeld, de pagina's zijn noindex |

## Waar alles staat

- Echte code: repo hjdk-api, branch `main`. `lib/wam-dossier.js` (pagina's, melden, tellen, stand), aangeroepen vanuit `fn/wam.js` (`DOS.OPS`), rewrite in `vercel.json` voor `/nl /start /achtergrond /pers /vriendenloterij-opzeggen` op wearemany.now, test `test/wam-dossier.test.mjs` (`node --test test/wam-dossier.test.mjs`).
- Proefversie: https://hjdk-api-git-wam-dossier-henq.vercel.app/api/wam?op=dpagina&p=nl (achter Vercel-inlog; `p=start`, `achtergrond`, `pers`, `vriendenloterij-opzeggen`). Een branch bouwt hier niet vanzelf: maak de proef met de Vercel-tool `create_deployment`, `gitSource` github `henkjandekrijger-glitch/hjdk-api` ref `wam-dossier`, project `hjdk-api`.
- Controle: `/api/wam?op=dstand` (tellers en lekken met drempels) en `/api/wam?op=dtest` (droge proef: leest de AI een voorbeeldmelding), beide alleen op de beschermde host.
- Ontwerp: Vercel-project `wearemany-ontwerp` (team henq), domein ontwerp.wearemany.now. Statische tekstbestanden, geen functies. De volledige gedecodeerde HTML staat nu ook in `docs/wam-ontwerp-2026-11-23.html` op de bronnenbranch; bronfeiten en namen in `data/wam/bronnen-2026-11-23.json`.
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

## Bronnenaanvulling van 23 november 2026

- De bronaanvulling is eerst beoordeeld op `codex/wam-bronnen-20261123` en wordt nu op Henkjans woord op main gepubliceerd. Schrijftoestemming en publicatieopdracht zijn beide gegeven.
- Tien bronregels worden ook door de echte voorkant in `lib/wam-dossier.js` gerenderd uit het gedateerde JSON-bestand. De gepubliceerde aanvulling bevat bronregels, bronfeiten, het verhaal en de faviconvarianten; de HTML-bron van het ontwerp blijft op de bronnenbranch. Geen wijzigingen aan melden, tellen, mails of de rootchat.
- De namen en juridische dossiers staan in het ontwerp en het bronbestand. Er zijn geen nieuwe openbare dossierpagina's of opzegservice toegevoegd.
- Gecontroleerd: de bestaande zes tests slagen lokaal met een offline Redis-import (geen database of AI aangeroepen); JavaScript van het ontwerp parseert; tien uitklapbare bronblokken staan buiten de hoofdlinks; desktopweergave en uitklappen via Chrome bekeken. Mobiele browsercontrole niet afgerond door een time-out en daarna activiteit van de gebruiker in Chrome.
- Live: https://wearemany.now/nl en https://wearemany.now/achtergrond#waarom-afpoeieren. Het centrale werklog legt de gecontroleerde productie-uitrol vast. Het aparte ontwerp blijft https://ontwerp.wearemany.now.

## Het ontwerp bijwerken (ontwerp.wearemany.now)

De pagina is één HTML-bestand, in stukken uitgerold omdat er geen repo achter zit:

- `a.txt b.txt c.txt d.txt`: de pagina in vier delen, gecodeerd: `~` staat voor `"`, een backtick voor `\`, `¦` voor een regeleinde.
- `e.txt f.txt g.txt h.txt` (ruimte tot `j.txt`): wijzigingen. Paren `zoek QyQ vervang`, gescheiden door `QxQ`, toegepast in volgorde op de gecodeerde tekst.
- `index.html`: de lader. Die haalt alles op, past de wijzigingen toe, decodeert en schrijft de pagina.

Bron terughalen: haal de bestanden op met de Vercel-tool `get_deployment_file_contents` of gewoon van het domein, plak a tot d aan elkaar, pas e tot j toe, en vervang `~` door `"`, de backtick door `\` en `¦` door een regeleinde. Wijzigen: bewerk de HTML, maak van het verschil een nieuw wijzigingsbestand (de volgende letter) en rol uit met `create_deployment` (project `wearemany-ontwerp`, target `production`): alleen het nieuwe bestand als tekst, de rest als verwijzing met `sha` en `size`. Controleer daarna met `list_deployment_files` dat de sha's kloppen. Bij veel wijzigingen: de hele pagina opnieuw in vier delen.

Sha1 en grootte van de vaste bestanden: a `dcacad529fac7b81c153a41f1b45aeb82fc62ef9` 17742 · b `9eed4708cce223bc6cf8dcfb5e8fe13b216b35fd` 17817 · c `d024f6ee9132dfae0c7bc9d2ffc9826f02b53248` 17805 · d `3a8a9aad0a2332bd5a3958786ab9b746db7dbd26` 17804 · e `af56c36282e541cee7619497978a7d758055cc83` 5921 · f `e85d9e95695c181609076c9f0a28e8a051d2557f` 3637 · g `46ea5ddc5dafd38201c31289a8be9ae3f0b491ef` 268 · index.html `fc74c1d34590425cfd794abe1a83f6b89ebb9854` 863 · favicon.svg `4489141bd5a23fa7b25f16c22511f275eb10920e` 248 · robots.txt `63657cbb7d7086c56b0cd4e5c6999bb683664868` 26 · vercel.json `6790a64721010f6de648e21abb8e8d2d588442c7` 95. h `d8b4f5f74b97553ff77afb98a4c4bfa7b6542db1` 292 · i `f570ee9754787ff4f4a24a52c5298028948d8286` 1996. j `f90ec3ceed2f32e658e3d327a68ed87db61d1a30` 22778. Alle tien wijzigingsplekken zijn nu gebruikt; bij de volgende wijziging de volledige pagina opnieuw in vier delen opbouwen (of de lader bewust uitbreiden).

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

1. **Voorkant: bronregels bij alle tien bedrijven toegevoegd aan het ontwerp en op Henkjans publicatieopdracht aan main op 23 november 2026.** Negen Trustpilot-profielen met TrustScore en aantal reviews; PostNL met de Nederlandse Klacht.nl-pagina. Elke regel heeft `meer »`, bronlinks en raadpleegdatum. Waar beschikbaar staan onder meer ook de afzonderlijke Klacht.nl-registraties met hun eigen brondatum. Positieve cijfers (Flanderijn en ANWB 4,2/5) worden eveneens getoond. De geopende bronweergave is leidend, niet een afwijkend nieuwer aantal uit de zoekindex. Geen platforms, profielen of landen samengevoegd; opgelost op Klacht.nl betekent geregistreerd als opgelost op dat platform. Dit zijn geen representatieve klanttevredenheidsmetingen.
1b. **Directieblokken ingevuld met gedateerde bronnen in het ontwerp.** Blendle: Laurent Kayser (eigen juridische pagina noemt hem wettelijk vertegenwoordiger; CEO Cafeyn sinds 7 oktober 2023). ANP: Martha Riemsma (algemeen directeur vanaf half oktober 2024). Mijndomein: Dion Goudkuil (eigen interview 22 oktober 2026; benoemingsdatum onbekend). STRATO: Jens Reich, Hüseyin Dogan, Markus Leander Noga en Patrik Heider, volgens eigen imprint, met functie-ingangsdata uit de eigen managementpagina. Yourhosting: Wouter Stoutjesdijk (begin 2025; eigen en groepsbericht plus klantcase 2026). Hostnet: René Oldenbeuving (directeur vanaf 2021, via Company.info met KVK-brondatum 29 september 2026 en interview april 2026). Een direct Handelsregister-uittreksel is niet gecontroleerd.
1c. **Nog te bevestigen:** lokale/statutaire directie Vimexx (groeps-CEO Claudio Corbetta is wel bevestigd op team.blue; Tom Denkers wordt alleen als historische vermelding uit BIT-interview 6 augustus 2024 genoemd). Actuele functie van Robbert Buitenhuis bij ANP Fair Licensing en zijn benoemingsdatum (publicatie 3 juli 2026 noemt hem hoofd International Photo Sales & Infringements; huidige functie nog niet door ANP of register bevestigd). Benoemingsdatum Dion Goudkuil en ingangsdatum vertegenwoordiging Blendle ontbreken. Deze beperkingen staan zichtbaar bij de namen. Ook dit langs de jurist voordat de dossiers publiek live gaan.

2. Gedaan op 23 nov: branch `wam-dossier` staat op main. Nog doen: één echte melding met foto of pdf via wearemany.now/start en daarna `op=dstand` nakijken (https://hjdk-api-henq.vercel.app/api/wam?op=dstand).
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

- 23 nov 2026: op Henkjans expliciete publicatieopdracht de tien bronregels en het verhaal vanuit support en PR op WAM gezet. Korte versie op /nl, volledig op /achtergrond#waarom-afpoeieren; onjuiste buitenlandse samenvattingen vervangen door precieze, gelinkte officiële bronnen. Nieuw centraal merkteken in lib/wam-merk.js voor chat en dossiersite, echte ICO-, SVG-, PNG- en Apple-varianten, serveractie dico zonder database of AI. Alleen WAM krijgt de favicon-rewrites. Geen automatische mails, ACM-melding of publicatie van juridische dossierpagina's toegevoegd.

- 23 nov 2026: conceptverhaal vanuit support en PR geschreven in docs/wam-waarom-afpoeieren-2026-11-23.md, met korte voorkanttekst, productlessen en primaire bronnen. Eerdere volmachtlinks over SignalConso zijn onjuist; 85% in het DGCCRF-persbericht 2024 betreft gelezen meldingen, geen causaal bewijs of percentage voor WAM. CFPB-vijftiendagentermijn is sectorspecifiek. Nog bouwen: controleerbare uitkomsten, opvolging en bewijscontrole; eerste versie bewaart geen uploads. Geen websitepublicatie of externe berichten in deze ronde.

- 23 nov 2026: bronregels bij tien bedrijven en directieblokken in het ontwerp aangevuld. Ontwerpwijziging j.txt (sha1 f90ec3ceed2f32e658e3d327a68ed87db61d1a30, 22778 bytes); bronnenbestand /bronnen.json. UI gebruikt bestaande lettergroottes en zwart-wit; details staan buiten de hoofdlink. Inline-script syntaxis en HTML-interactiestructuur gecontroleerd. Dezelfde bronregels, bronfeiten en HTML-bron staan nu op codex/wam-bronnen-20261123. Henkjan gaf schrijftoestemming. Geen wijziging aan hjdk-api/main door deze ronde. De actuele hoofd-overdracht meldt dat stap 1 inmiddels live staat; oudere branch-overdracht is op dat punt achterhaald.

- 23 nov 2026: live op main op Henkjans woord ("Ja zet live"). Pagina's blijven noindex. Volgende: de voorkant meer inhoud geven (voorstel ligt bij Henkjan).
- 23 nov 2026: blok "Eindverantwoordelijk" bovenaan de drie dossiers in het ontwerp (nog zonder namen), en de overdracht live via op=doverdracht.
- 23 nov 2026: overdracht geschreven. Knop op de voorkant is "Plak je verhaal". Links werken op het proefadres. Contact op Pers via de chat, geen mailadres. Open: de regels "hoe ze bekend staan" met bronnen.
- 23 nov 2026: stap 1 gebouwd op branch `wam-dossier` (melden, tellen, e-mail, vijf pagina's, dstand, dtest). Push naar main geweigerd zonder Henkjans woord.
- 23 nov 2026: ontwerp op ontwerp.wearemany.now, met Achtergrond, Pers, upload en favicon. Thema machteloos in Demand Radar gemeten ($0,27).
