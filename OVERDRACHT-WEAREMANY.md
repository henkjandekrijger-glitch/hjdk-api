# Overdracht we are many now: de dossiersite

Voor een volgende chat of een ander account. Actuele overdracht op main, met live stand: https://hjdk-api-henq.vercel.app/api/wam?op=doverdracht (achter Vercel-inlog).
Bijgewerkt: 24 november 2026. Werk dit bestand bij in dezelfde commit als elke wijziging, met een regel in het logboek onderaan.

## Wat het is

we are many now (wearemany.now, Adsfair B.V.) bundelt losse klachten over hetzelfde bedrijf tot één dossier met bewijs, een cijfer en één stem. Kader: "machteloos tegen een bedrijf", niet "erger je kapot". De naam schrijf je in kleine letters met spaties. Op / staat sinds 24 november de dossiersite. Whoz, de bestaande chat (lib/wam.js), staat op /chat; contact is /chat#henkjan.

Henkjan is niet technisch. Praat Nederlands, kort, één stap tegelijk, en doe het technische werk zelf.

## Publicatie van 24 november 2026: de volledige site en lezersreacties

Henkjan verduidelijkte de opdracht: "zet hele site live", "vergeet artikel even", vormgeving volgens sealedintent.com, Flanderijn nader onderzoeken en een totaalbeeld uit reviews en andere signalen, met directe lezersreacties die gemodereerd en geconcentreerd worden gepubliceerd. Dit is de toestemming voor de hele publieke site op /; de vorige artikelpublicatie was niet de volledige opdracht.

Sinds 24 november 2026 op Henkjans expliciete opdracht ('zet hele site live', 'volgens sealedintent.com design', bronnenconsensus en gemodereerde lezersreacties): / is de dossiersite; de bestaande chat staat op /chat en contact op /chat#henkjan. /nl is dezelfde voorkant met canonical /. Tien bedrijfspagina's /bedrijven/<id>, /dossiers en drie feitelijke dossierpagina's /dossier/blendle, /dossier/anp en /dossier/hosters. Geen eigen rapportcijfers of juridische oordelen uit het prototype als feiten gepubliceerd. De publieke vormgeving volgt sealedintent.com: maximaal 680 px, 17 px tekst, 13 px bronmetadata, kop 24-30 px, rustige lijnen en compacte bronuitklappers. Per bedrijf een redactionele synthese van 28 bronpagina's samen, met positieve ervaringen, kritiek, afweging, profielafbakening en datum 24 november 2026. Geen claim dat alle internetreviews zijn onderzocht; cijfers van platforms niet gemiddeld. Flanderijn 4,2/726 mét 56% vijf sterren, 32% één ster en eigen klachtenjaarverslag (2024: 155 intern, 62 door bedrijf terecht bevonden). Nieuwe modules lib/wam-voorkant.js en lib/wam-reacties.js; bronnen data/wam/bronnen-2026-11-24.json. Lezersformulier rechtstreeks bij elk bedrijf en dossier, alleen na toestemming; op=dreactie, dreacties en dreactiewis. Besloten wachtrij, menselijke moderatie op op=dmoderatie (beschermde vercel.app-host én werkelijke Host-header, CSRF-token); uitsluitend een geredigeerde zin van maximaal 240 tekens wordt per onderwerp/strekking gebundeld gepubliceerd. Origineel maximaal 30 dagen en direct weg na besluit; gepubliceerde zin afzonderlijk maximaal een jaar; persoonlijke wislink. IP-rem 8/uur, identieke inzendingen ontdubbeld, wachtrijcap 3000. Controle op=dstand waarschuwt na twee dagen wachten; op=dreactietest voert de hele Redis-route in een gewiste proefnaamruimte uit. /sitemap.xml, /robots.txt, /llms.txt en /zicht.json beschrijven de nieuwe site. wmn:live wordt bij deze uitrol op 1 gezet. Het artikel is niet het onderwerp van de voorkant. De bestaande groepsfavicon blijft. 

### Bediening van lezersreacties

- Publiek: `POST /api/wam?op=dreactie` met bedrijf, ervaring, onderwerp, tekst en expliciete toestemming. De bezoeker krijgt een wislink met een geheim in het fragment; geen naam of e-mail nodig. De inzending verschijnt nooit direct openbaar.
- Redactie: https://hjdk-api-henq.vercel.app/api/wam?op=dmoderatie (Vercel-inlog). Lees origineel, kies onderwerp en strekking, schrijf een anonieme concrete samenvatting, controleer privacy en onbewezen beschuldigingen, publiceer of wijs af. Neem ook positieve ervaringen en correcties serieus.
- Publiek verschijnen alleen goedgekeurde samenvattingen op de bedrijfspagina, gegroepeerd per onderwerp en strekking, maximaal drie verschillende zinnen per groep. Het aantal betreft inzendingen, geen uniek geverifieerde personen. Geen eigen reviews of nepreacties toegevoegd.
- Origineel `wmn:r:<id>` EX 30 dagen; wachtrij `wmn:r:wacht` (ZSET, oude leden worden opgeruimd). Na moderatie verdwijnt het origineel direct. Publicatie `wmn:r:goedgekeurd:<id>` EX 365 dagen met per-bedrijfindex `wmn:r:pub:<bedrijf>`; geen glijdende bewaring van oude teksten.
- Wisbewijs `wmn:r:bewijs:<id>` bevat alleen een tokenhash, bedrijf en ontdubbelsleutel; wordt bij publicatie één jaar verlengd. Wissen verwijdert zowel de inzending als publicatie, index en ontdubbelhash. Alleen goedgekeurde zinnen komen in `dreacties`; geen inzend-ID’s, tokens of oorspronkelijke teksten.
- Beveiliging: maximaal 8 inzendingen per IP-hash per uur, verborgen botveld, identieke tekst 30 dagen ontdubbeld, wachtrijcap 3000, bekende bedrijven/onderwerpen, lengtegrenzen, HTML-escaping en herkenbare privégegevens weren. Publicatie heeft naast Vercel-bescherming een tijdelijk CSRF-token en expliciete redactiecontrole nodig. De werkelijke Host-header moet ook vercel.app zijn, zodat een aangeleverde x-forwarded-host niet volstaat.
- Controle: `op=dstand` noemt de wachtrij en waarschuwt als de oudste inzending meer dan twee dagen wacht. `op=dreactietest` draait een echte Redis-proef van ontvangen, besloten houden, autorisatie, publicatie, concentratie, afwijzen en wissen in een eigen naamruimte die wordt opgeruimd. Dit levert geen publieke reacties, meldingen of tellers op.
- Privacy en werkwijze staan op /privacy#lezersreacties en /werkwijze. Moderatie gaat niet automatisch via een AI-model en er worden geen mails verstuurd.

### Validatie en beperkingen

15 lokale tests slagen: bestaande meldparser, canonicals en interne navigatie van alle 23 publieke pagina’s, scriptsyntaxis, toestemming, brondekking, publieke afscherming, privégegevens, moderatiecontrole, concentratie en HTML-escaping. Routercontrole en commentaarcheck slagen. Nieuwe statische HTML en formulierstructuur worden aanvullend gecontroleerd. Volledige visuele controle in Chrome was geblokkeerd door gelijktijdig gebruik van de browser; er is geen afgeronde mobiele browsercontrole geclaimd. De uitrol en de echte Redis-proef worden daarna in het centrale werklog vastgelegd.

## Publicatie van 23 november 2026 (historisch)

Henkjan gaf opdracht: "Zet live op WAM en meteen goede favo ico". De bronregels en het goedgekeurde verhaal worden daarmee op main gepubliceerd. Op /nl staat de korte tekst met een link naar /achtergrond#waarom-afpoeieren. Het artikel beschrijft de aanpak als visie; verdere opvolging en bewijscontrole zijn nog niet gebouwd. Chat en dossiersite gebruiken één zwart-wit groepsicoon, met SVG, PNG (32), Apple (180) en een echt ICO (16/32/48). Favicon-adressen zijn uitsluitend voor de WAM-host herschreven naar op=dico. De root blijft de chat. Dossiers met cijfers en de opzegservice blijven ontwerp.

## Stand

| Onderdeel | Stand |
|---|---|
| Ontwerp, alle schermen | Af, op https://ontwerp.wearemany.now (noindex, zwarte balk "Ontwerp") |
| Volledige publieke site | / is de voorkant, /nl alias, /chat de bestaande chat. Tien bedrijfspagina’s, drie feitelijke dossiers, bronmethodiek, privacy, pers, achtergrond en werkende meld- en reactieroutes |
| Dossiers | Feitelijke startpagina’s openbaar met bron, context en publiek vermelde leiding. Eigen rapportcijfer en juridische conclusies blijven bij de jurist |
| "Wij zeggen voor je op" | Alleen ontwerp. Wacht op een jurist |
| Mails aan melders | Bestaan niet. Eerst langs de POST-lus en langs Henkjan |
| Vindbaarheid | Canonicals, sitemap, robots, llms.txt en zicht.json voor de hele site. wmn:live wordt op 1 gezet; daadwerkelijke indexering volgt pas na bezoek door zoekmachines |

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
- Geen e-mailadres van Henkjan op pagina's: contact loopt via https://wearemany.now/chat#henkjan.
- Advertentiecampagnes waar hij niet om vroeg niet wijzigen. De root is sinds Henkjans expliciete besluit van 24 november de dossiersite; Whoz staat op /chat. Campagnes blijven uit en worden hier niet gewijzigd.
- De ACM-melding tegen Blendle alleen op "ja ACM". De tweet aan Klöpping alleen op "ja tweet".
- Het woord "scam" niet gebruiken. Bij ANP ook melden dat ANP zaken wint. Materiaal van derden die hem mailden over ANP niet gebruiken zonder hun toestemming.
- Dossiers met cijfer en wetsparagraaf, en "wij zeggen voor je op", pas na één jurist. Henkjan mag dat zelf openbreken.
- Mail aan melders of bedrijven: skill mail-lerend (POST-lus), het concept eerst in de chat laten zien, verzenden via Resend.

## Open punten, in deze volgorde

1. Echte lezersreacties na binnenkomst modereren op op=dmoderatie; positieve, negatieve en corrigerende bijdragen even zorgvuldig behandelen. Na inhoudelijke nieuwe bronnen het bronnenbeeld en de datum bijwerken.
2. Bronbereik uitbreiden wanneer andere afgebakende profielen of onafhankelijke signalen beschikbaar zijn. Niet claimen dat alle internetreviews zijn onderzocht. De huidige tien syntheses staan in data/wam/bronnen-2026-11-24.json, de bronlijst bij ieder bedrijf is leidend.
3. Namen in het Handelsregister bevestigen waar nodig: lokale/statutaire directie Vimexx, huidige ANP Fair Licensing-functie en ingangsdata. Huidige publieke leidingblokken zijn expliciet op openbare bronnen gebaseerd, geen gecontroleerd Handelsregister-uittreksel.
4. Jurist voor eigen dossiercijfers, juridische conclusies en de machtiging/voorwaarden van "wij zeggen voor je op". Geen automatische opzegservice of prototypebevestigingen gepubliceerd. ANP-wederhoor en eigen band met Mijndomein staan bij de dossiers.
5. De bevestigingsmail en dagmail aan melders bestaan nog niet: eerst concept via de POST-lus en Henkjan. E-mail kan wel bij een melding worden opgeslagen.
6. Aanvullende visuele en mobiele browsercontrole zodra de browser vrij is. De programmatische controles en productieproef moeten wel al slagen.
7. Echte foto/pdf-meldroute nog apart volledig doorlopen zonder proefmeldingen in publieke aantallen te laten belanden. De bestaande droge tekstproef en parser zijn beschikbaar.
8. Zoekmachine-indexering meten; sitemap en zicht.json worden bij deze uitrol gepubliceerd. Een vermelding in Google of een AI is geen automatisch gevolg van live zetten.
9. Niet besloten: voorwaardelijke gezamenlijke opzegging, uploadbewaring als bewijs en wie een eventuele papieren brief betaalt. Uploads worden nu niet bewaard.
10. Het aparte ontwerp kan later worden opgeruimd; niet verwijderd in deze taak.

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

- 24 nov 2026: hele site naar / op Henkjans expliciete opdracht; Sealed Intent-typografie, tien bronnenbeelden (28 bronnen), Flanderijn met sterverdeling en eigen klachtenjaarverslag, directe lezersreacties, besloten menselijke moderatie, geanonimiseerde concentratie en wislink. Drie feitelijke dossiers zonder prototypecijfers; bestaande chat naar /chat. 15 lokale tests, router en commentaarcheck geslaagd; productiecontrole volgt in centraal werklog.

- 23 nov 2026: op Henkjans expliciete publicatieopdracht de tien bronregels en het verhaal vanuit support en PR op WAM gezet. Korte versie op /nl, volledig op /achtergrond#waarom-afpoeieren; onjuiste buitenlandse samenvattingen vervangen door precieze, gelinkte officiële bronnen. Nieuw centraal merkteken in lib/wam-merk.js voor chat en dossiersite, echte ICO-, SVG-, PNG- en Apple-varianten, serveractie dico zonder database of AI. Alleen WAM krijgt de favicon-rewrites. Geen automatische mails, ACM-melding of publicatie van juridische dossierpagina's toegevoegd.

- 23 nov 2026: conceptverhaal vanuit support en PR geschreven in docs/wam-waarom-afpoeieren-2026-11-23.md, met korte voorkanttekst, productlessen en primaire bronnen. Eerdere volmachtlinks over SignalConso zijn onjuist; 85% in het DGCCRF-persbericht 2024 betreft gelezen meldingen, geen causaal bewijs of percentage voor WAM. CFPB-vijftiendagentermijn is sectorspecifiek. Nog bouwen: controleerbare uitkomsten, opvolging en bewijscontrole; eerste versie bewaart geen uploads. Geen websitepublicatie of externe berichten in deze ronde.

- 23 nov 2026: bronregels bij tien bedrijven en directieblokken in het ontwerp aangevuld. Ontwerpwijziging j.txt (sha1 f90ec3ceed2f32e658e3d327a68ed87db61d1a30, 22778 bytes); bronnenbestand /bronnen.json. UI gebruikt bestaande lettergroottes en zwart-wit; details staan buiten de hoofdlink. Inline-script syntaxis en HTML-interactiestructuur gecontroleerd. Dezelfde bronregels, bronfeiten en HTML-bron staan nu op codex/wam-bronnen-20261123. Henkjan gaf schrijftoestemming. Geen wijziging aan hjdk-api/main door deze ronde. De actuele hoofd-overdracht meldt dat stap 1 inmiddels live staat; oudere branch-overdracht is op dat punt achterhaald.

- 23 nov 2026: live op main op Henkjans woord ("Ja zet live"). Pagina's blijven noindex. Volgende: de voorkant meer inhoud geven (voorstel ligt bij Henkjan).
- 23 nov 2026: blok "Eindverantwoordelijk" bovenaan de drie dossiers in het ontwerp (nog zonder namen), en de overdracht live via op=doverdracht.
- 23 nov 2026: overdracht geschreven. Knop op de voorkant is "Plak je verhaal". Links werken op het proefadres. Contact op Pers via de chat, geen mailadres. Open: de regels "hoe ze bekend staan" met bronnen.
- 23 nov 2026: stap 1 gebouwd op branch `wam-dossier` (melden, tellen, e-mail, vijf pagina's, dstand, dtest). Push naar main geweigerd zonder Henkjans woord.
- 23 nov 2026: ontwerp op ontwerp.wearemany.now, met Achtergrond, Pers, upload en favicon. Thema machteloos in Demand Radar gemeten ($0,27).
