# Todayin surgery: tandheelkunde, lezerswaarde en groei

Besluit en uitvoering van de nacht 15 op 16 november 2026, Curaçao. Dit assessment beschrijft de implementatie in deze commit. De levende overdracht en het werklog vermelden de daarna geverifieerde deployment en actuele cijfers. Bronselectie is geen complete markt of medisch kwaliteitsregister.

## Wat een abonnee krijgt

**Wij blijven jouw behandeling uitzoeken.** Meteen na bevestiging een bronoverzicht voor de gekozen onderwerpen en landen, gepubliceerde prijsvoorbeelden met hun precieze omvang en een offertechecklist. Daarna dagelijks relevante bronwijzigingen of een concrete vergelijkstap. Een bestaande vergelijking wordt herkenbaar als bestaande informatie aangeduid. Geen verzonnen nieuws wanneer een bron niet veranderde.

De mail helpt iemand een bruikbare vergelijking opbouwen: wat zit in de prijs, wat ontbreekt, bij welke behandelaar en locatie moet je controleren, hoeveel bezoeken zijn nodig, wie verzorgt de nazorg en welke kosten kunnen bij een herhaalreis ontstaan. Hij kiest maximaal acht onderwerpen, zijn thuisland en eventueel een behandelland. Oude wijzigingsabonnementen behouden hun frequentie; dagelijks versturen vraagt de expliciete nieuwe aanvraag plus bevestiging.

- NL ingang: https://todayin.email/surgery/nl/tandheelkunde
- EN ingang: https://todayin.email/surgery/dental
- DE ingang: https://todayin.email/surgery/de/zahnmedizin
- Publiek voorbeeld: https://todayin.email/surgery/nl/voorbeeldmail
- Het voorbeeld gebruikt dezelfde bronoverzichtfunctie als de echte welkomstmail. Het is geen daadwerkelijk verzonden editie en bevat geen persoonlijke tokens.

## Dekking en vraag

| Onderwerp | Voor deze ronde: dossiers | Na deze ronde: dossiers | Landen met dossiers | Indexeerbaar na deze ronde |
| --- | ---: | ---: | ---: | --- |
| Implantaten | 15 | 35 | 25 | Ja |
| All-on-4 | 5 | 14 | 9 | Ja |
| Facings / veneers | 13 | 31 | 22 | Ja |
| Kronen | 11 | 22 | 16 | Ja |
| Invisalign en andere aligners | 3 | 16 | 12 | Ja |
| Bleken | 16 | 28 | 20 | Ja |

De totalen overlappen: **35 verschillende tandheelkundige aanbieders in 25 landen**, geen 146 unieke aanbieders. Twaalf aligneraanbieders noemen Invisalign expliciet in de waargenomen aanbiedersbron. Motto, Spark en ClearCorrect worden onderscheiden; een generieke alignerpagina bewijst het merk Invisalign niet. Andere vermeldingen hebben geen bevestigd merk.

Aanwezige bronlanden: Nederland, België, Duitsland, Spanje, Portugal, Hongarije, Polen, Tsjechië, Slowakije, Kroatië, Bulgarije, Verenigd Koninkrijk, Turkije, Thailand, Mexico, Costa Rica, Colombia, Maleisië, Nieuw-Zeeland, Singapore, India, Verenigde Staten, Australië, Canada en Verenigde Arabische Emiraten.

De landenkiezer ondersteunt 249 thuislanden/gebieden en 73 bestemmingen plus het gekozen thuisland en bronlanden. **Selecteerbaarheid is geen inhoudsdekking.** Ontbrekende dossiers blijven expliciet zichtbaar. De volgorde volgt geografische nabijheid en regio; het is geen populariteitsranglijst, reisadvies of aanbeveling van zorgkwaliteit.

Vraagmeting: Demand Radar-cache van 16 november, thema plastische-chirurgie, NL, versie 3. De maandelijkse schattingen voor de afzonderlijke zoektermen zijn Invisalign 14.800, haartransplantatie 9.900, facings 8.100, veneers 4.400 en facings kosten 1.300. Synoniemen en zoekers overlappen. De precieze implantaattermen ontbreken in deze steekproef en zijn dus onbekend, niet nul. Dit onderbouwt de prioriteit van tandheelkunde, maar bewijst geen exacte factor waarmee de totale tandmarkt groter is dan haar.

## Wat concreet is aangepast

| Bevinding | Afhandeling |
| --- | --- |
| Facings, kronen, aligners en bleken hadden noindex | Eigen consultcontext met primaire ADA/NHS/FDA-bronnen toegevoegd; voldoende gevulde overzichten in EN/NL/DE mogen indexeren. Dunne andere onderwerpen behouden noindex. |
| Alleen drie alignerdossiers | Uitgebreid naar zestien met expliciete behandel- en merkbronnen. |
| Prijzen konden een schroef met een complete tand verwarren | Elf gedateerde snapshots met munt, eenheid, omvang, inclusies en open posten; geen landgemiddelden of automatische wisselkoersconversies. |
| Alleen vier nieuwsitems, geen tandheelkunde | Negen duidelijk gelabelde eigen broninventaris-/gidsupdates voor drie tandonderwerpen in drie talen. Geen prijsverandering verzonnen. |
| NL-verzekeringsnieuws kon tandabonnees bereiken | Onderwerp- en thuislandvoorwaarden aangescherpt; expliciete behandellanden worden in nieuwsselectie en bronoverzicht gerespecteerd. |
| Snel invullen onder 1,5 seconde gaf succes zonder mail | Tijdval verwijderd; snelle autofill werkt. Honeypot en begrenzing blijven. |
| Providerfout liet een tienminutenlock achter | Eerlijk tijdelijk-foutantwoord, korte gedeelde lock, bewaarde bevestigingspayload en stabiele provider-idempotencykey; onmiddellijk opnieuw proberen getest. |
| Formulierweergave telde bij renderen, ook buiten beeld | Servertoewijzing, daadwerkelijke browserzichtbaarheid, bevestigde receipt en deduplicatie. Een late variantwissel na verzenden wordt niet als zichtbare proefvariant gemeten. |
| Client kon een variant of conversie zonder denominator melden | Serverreceipt bepaalt de variant; alleen geacknowledgede zichtbaarheid kan proefconversie opleveren. Algemene echte opt-in blijft apart meetbaar. |
| Campagneherkomst ging verloren | Begrensde source/medium/campaign/content-labels, gekoppeld aan bevestigingsaanvraag en eerste bevestigde abonnee; geen volledige URL, zoekterm of gevoelig profiel naar advertentienetwerken. Betaald verkeer afzonderlijk van organisch. |
| Nieuwsbrief kende maar zes thuislanden | Dezelfde zoekbare 249/73-landenkiezer met zichtbare samenvatting en expliciete voorkeuren. |
| Welkomstmail had weinig concrete waarde | Werkelijk bronoverzicht, passende dossiers, beschikbare prijsvoorbeelden, vergelijkstap en offertechecklist; openbaar voorbeeld uit dezelfde functie. |
| Alles volgen begon steeds bij haar | Dagvragen en dossiers roteren over onderwerpen. |
| Mailbeveiligingsscanners konden bevestigen of afmelden | GET/HEAD tonen een expliciete POST-handeling; standaard List-Unsubscribe one-click POST blijft ondersteund. |
| Nieuwe feiten ontbraken in chatcontext | Dezelfde gedateerde behandelaanbiedingen, merkbronnen en prijsomvang aan tandvragen en tandpagina's gekoppeld. Onbeantwoorde vraag gaat naar de onderzoekslijst zonder belofte dat het antwoord morgenochtend al klaar is. |
| Dossierdatum sloot nieuwe bronnen uit | Nieuwste daadwerkelijke bron-/behandeldatum telt mee; oude bronfeiten worden niet automatisch als opnieuw gecontroleerd gemarkeerd. |

Reviews blijven op hun eigen entiteitsschaal. De 11/5/8/8/5/9 gerangschikte dossiers voor respectievelijk implantaten/All-on-4/facings/kronen/aligners/bleken betreffen reviewbewijs binnen de selectie. Zij bewijzen geen klinische geschiktheid, individuele artsregistratie, behandelingsspecifieke uitkomst of volledig geverifieerde vergunning.

## Prijzen eerlijk vergelijkbaar maken

Het datacontract bevat: aanbieder-id, onderwerp, bedrag of bandbreedte, vanaf-aanduiding, valuta, eenheid (tand/kaak/behandeling), omvang, expliciete onderdelen, nog onbekende posten, bron-URL en leesdatum. Voorbeelden zijn Smile Clinic Slowakije €1.415 voor implantaat + abutment + kroon en INDEXMEDICA Polen €1.552 voor dezelfde drie genoemde onderdelen. De Singaporese bonding/veneers-band is nadrukkelijk een gemengde aanbieding, niet een zuivere keramische-facingprijs. De Costa Rica All-on-4-prijs betreft één kaak met definitieve tanden, vanafprijs, met overige posten nog te vragen.

Zonder bevestigde onderdelen noemen we iets geen volledige offerte. Reizen, verblijf, botopbouw, extracties, tijdelijke tanden, controles thuis, retainers en reparaties kunnen buiten een behandelprijs vallen. Een nieuwe brochureprijs is geen actuele individuele offerte en geen gemeten besparing.

## Landen verdiepen op betekenisvolle routes

| Thuisregio | Eerst te verdiepen bronroutes | Waarom deze volgorde |
| --- | --- | --- |
| NL | NL, BE, DE, PL, HU, CZ, SK, TR, ES, PT, HR | Eigen zorg en bereikbare alternatieven naast behandelingen op reis vergelijken. |
| GB / DE | Eigen land, Europees aanbod en TR | Taalspecifieke registratie, nazorg en prijsomvang uitzoeken. |
| US / CA | Eigen land, MX, CR, CO | Aanwezige dossiers uitbreiden met concrete locaties en herhaalreizen. |
| CW / AW | Eigen land, CO, overige aantoonbare routes | Geen ontbrekend lokaal aanbod invullen; Colombiaanse bronselectie verdiepen. |
| AU / NZ | Eigen land, TH, MY, SG | Bestaande primaire bronnen verdiepen en afstand/nazorg expliciteren. |

Dit zijn redactionele onderzoekssporen vanuit het thuisland, geen gemeten marktaandelen van medisch toerisme. Meer bestemmingen krijgen pas gepubliceerde inhoud na echte bronnen. Geen honderden lege landpagina's.

## Campagne voor maandag 16 november

De campagne kan op de concrete bron-/offertewaarde landen. Geen korting, gegarandeerde besparing, behandeluitkomst of claim over de beste arts.

Voorstel eerste boodschap: **“Implantaatprijs gezien? Wat krijg je daar precies voor? Vergelijk implantaten, facings en Invisalign met bronprijzen, ontbrekende kosten en een checklist voor je offerte. Ontvang je eerste overzicht en laat ons jouw onderwerpen dagelijks bijhouden.”**

Drie bruikbare invalshoeken: complete tand tegenover losse implantaatschroef; echte facing tegenover kroon; merk en nazorg bij Invisalign tegenover generieke aligners. Gebruik één invalshoek per advertentie en dezelfde behandeling op de landing. Begin in NL; EN/DE kunnen met dezelfde inhoudsstructuur volgen. Geen targeting afgeleid uit persoonlijke gezondheidsvragen.

- Brede NL-campagne: https://todayin.email/surgery/nl/tandheelkunde?utm_source=campaign&utm_medium=paid&utm_campaign=dental_nl_20261116&utm_content=complete_quote_a
- De procedurepaden staan op de hub; koppel de advertentie rechtstreeks aan het passende pad en dezelfde vier labels.
- Vul bij de daadwerkelijke campagnebron het werkelijke platform in in plaats van campaign. Gebruik geen e-mailadres of naam in labels.
- Betaalde campagne is hiermee voorbereid, niet gestart. Platform, budget en advertentiebesteding zijn niet in deze opdracht vastgesteld; geen nieuwe uitgaven geactiveerd.
- De technische inschrijfproef draait naast inhoudelijke campagnehoeken; verander bij lage aantallen niet dagelijks de proefopzet.

## Groei meten richting zondag 22 november

Nulmeting vóór deze ronde: 44 geregistreerde browserbezoeken in zeven dagen, nul als Google/Bing/AI toegeschreven bezoeken, één bevestigde abonnee. Dit is geen onafhankelijk geverifieerd aantal unieke mensen. De eerdere vier AI-panelvragen hadden nul eigen surgery-citaties; het nieuwe tandheelkundige vier-vragenpanel is een nieuwe nulmeting en mag niet rechtstreeks met het oude onderwerpenset worden vergeleken.

Rapporteer dagelijks per echt campagnecohort: zichtbare formulieren, door de provider geaccepteerde bevestigingsaanvragen, eerste bevestigde abonnees en geaccepteerde dagmails. Presenteer bevestigd/zichtbaar alleen op dezelfde gekoppelde receiptcohort; latere bevestiging apart in het venster uitleggen. Acquisitiecijfers zijn browsergerapporteerde zichtbaarheidsreceipts, geen audit van unieke personen of advertentie-impressies.

Organisch en betaald apart. Search Console geeft vertoningen, klikken en indexstatus met vertraging. IndexNow melden is geen opnamegarantie. Eind deze week aantoonbaar relevant verkeer en bevestigde lezers is het werkdoel; substantiële omvang hangt ook van distributie en werkelijk budget af. Geen belofte van organische schaal binnen zes dagen. Kosten per bevestigde lezer blijven onbekend zolang echte besteding ontbreekt.

De knopproef heeft minimaal 200 waarnemingen per arm, 30 totale uitkomsten en een 99%-vergelijking nodig voor een kandidaatwinnaar. Eén abonnee en nul verkeer vormen geen bewijs van conversiewinst. Dagelijks optimaliseren betekent ook fouten oplossen, bronwaarde toevoegen en een lopende proef laten uitmeten. Mailonderwerpregels leren alleen van expliciete fasewijzigingen met vrijwillige meettoestemming; opens en automatische GETs tellen niet als interesse.

ZICHT volgt een 14-daagse indexeerbaarheidsproef voor tandhub/facings/aligners met bestaande oog-/haarpagina's als context. Het pakket bevat meerdere verbeteringen tegelijk en is observationeel, dus geen geïsoleerd causaal SEO-experiment. Nieuwe vier-vragen AI-panel blijft binnen hetzelfde aantal dagelijkse vragen en dezelfde budgetrem.

## Belangrijkste resterende gaten

| Prioriteit | Nog open | Volgende concrete stap |
| --- | --- | --- |
| P0 | Inboxbezorging, bounces en klachten nog niet onafhankelijk gemeten | Provideracceptatie apart rapporteren; domeinauthenticatie/providerstatus en echte vrijwillige ontvangst controleren zonder testabonnees te verzinnen. |
| P0 | Distributievolume en besteding nog onbekend | Campagne met echt platform/budget activeren zodra Henkjan die vastlegt; pas daarna CPA en schaal beoordelen. |
| P1 | Arts × behandeling × locatie × actuele registratie onvolledig | Nationale registers en echte behandelaar controleren; organisatieprofiel niet als geverifieerde arts presenteren. |
| P1 | Volledige persoonlijke offertes en nazorgafspraken ontbreken | Met vrijwillige, geredigeerde offertes het datacontract vullen; ontbrekende posten herkenbaar houden. Geen persoonlijke medische dossiers verzamelen. |
| P1 | Bronselectie is ongelijk, slechts 25 tandlanden | Eerst de genoemde thuis-/reisroutes verdiepen; openbare registraties en onafhankelijke bronlagen toevoegen. |
| P1 | Langetermijnwaarde nog niet bewezen | Na echte ontvangst vragen welke vergelijking hielp; vrijwillige terugkeer/fasewijziging en afmelding volgen. Herhaalde vaste overzichten niet als verse ontdekkingen verkopen. |
| P1 | UX nog geen echte patiënten-/lezersstudie | Test met lezers of zij prijsomvang, entiteit, ontbrekende checks en volgende stap juist begrijpen. Automatische QA is geen gebruiksonderzoek. |
| P2 | Volledig automatische offertevergelijker, reviewverificatie en artsenoverdracht | Eerst contract, privacy, identiteit, toestemming en acceptatieregels bouwen; geen live leadverkoop suggereren. |
| P2 | Extra talen en landelijke verzekering/regulering ongelijk | Bestaande EN/NL/DE verdiepen; alleen nieuwe lokalisatie bij concrete bronnen en aantoonbare vraag. |
| P2 | Chatwoordzoeker bij AI-uitval heeft minder tandinhoud dan de AI-context | Bron-FAQ's geleidelijk toevoegen op echte open vragen; geen gefabriceerde antwoorden om het gat te vullen. |

## Dagelijkse uitvoering en verificatie

De ingeschakelde nachtelijke taak draait vanaf maandag rond 01:30 Curaçao en daarna dagelijks, vóór de bestaande mailcron van 08:10 UTC (04:10 Curaçao). Hij herleest actuele repo en overdracht, verdiept echte bronlacunes, controleert inhoud en acquisitie, voert betekenisvolle QA uit en publiceert alleen na verificatie. Zie docs/todayin-surgery-onderhoud.md. Bestaande Claude-rondes en mailcron blijven staan; dezelfde bronwijziging niet dubbel publiceren.

De implementatie wordt getest met in-memory database en mailprovider, waaronder snelle autofill, providerfout/herhaalpoging, dubbele klik, zichtbaarheid/varianttoewijzing, herkomst/landfiltering, late ACK, dag-idempotency, afmelden tijdens verzenden en SSR/metadata in drie talen. Geen echte testmails. Live deployment, IndexNow-status en browsercontrole staan feitelijk in het werklog; een testpass is geen bewijs van inboxbezorging of verkeerstoename.
