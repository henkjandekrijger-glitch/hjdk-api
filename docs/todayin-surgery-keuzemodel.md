# Todayin surgery: van losse informatie naar een onderbouwde artsenkeuze

Productbesluit van 15 november 2026. Opdracht: eigen onderzoek, een reviewmodel, een consistente UX en een verdienmodel voor aanvragen aan artsen. Dit document maakt onderscheid tussen onderzoeksbewijs, reeds gebouwde functionaliteit en voorgestelde vervolgbouw.


## Actuele uitvoering: reviewranking en dagelijkse keuzehulp

De gebruikersinstructie van later op 15 november vervangt de eerdere vergelijking met drie geselecteerde dossiers. De live opzet is nu een **genummerde reviewranking**, met aparte ranglijsten van klinieken en individuele artsen, 42 onderwerpen in het keuzemenu en 31 extra aanbieders. Alle dossiers staan in de server-HTML. De bronselectie is geen volledige wereldmarkt; ontbrekende individuele artsreviews worden niet aangevuld met klinieksterren.

De publieke review-index is een redactionele ervaringsmaat. Normaliseer naar 5; per platform gewicht min(n,100); voeg 20 pseudo-waarnemingen op de vergelijkingsmediaan toe; neem het gelijke gemiddelde van de gecorrigeerde platformscores. Minimaal één passende bron met 5 reviews. Exacte profielduplicaten en meerdere profielen op één platform tellen eenmaal. Organisatie, locatie en arts blijven gescheiden. Geschorste/ongeldige bronnen zijn uitgesloten en zichtbaar met reden; zware onopgeloste kwesties blijven buiten de ranking. Dit is geen gevalideerde medische score of statistisch betrouwbaarheidsinterval. We sommeren aantallen niet tot unieke patiënten. Betaling verandert niets.

Bronnen bevatten zowel rechtstreekse platformgegevens als zichtbare snapshots uit hun openbare zoekindex. De datum is de leesdatum, niet automatisch de publicatiedatum van het platformcijfer. De gebruiker kan elk profiel openen. Onderlinge verschillen, kleine aantallen en ontbrekende tweede bronnen staan in de conclusie. Individuele reviewteksten zijn niet voor alle aanbieders verzameld; we verzinnen daarom geen thema’s zoals goede nazorg op basis van alleen sterren.

De UX van deze uitvoering gebruikt de blauw/witte todayin-huisstijl, compacte rankingrijen en gegroepeerde categoriekaarten. De lange native ingrepenlijst is vervangen door een eigen zoekbaar keuzescherm, met categorieën, maximaal 8 onderwerpen, expliciet bewaren en annuleren. Op mobiel opent dit als paneel onderin; desktop, tablet en telefoon hebben eigen indelingen. Het browsertabblad gebruikt een eigen blauw todayin-favicon.

Aanmelden staat bovenaan, zonder toestemmingsvinkje. De duidelijke aanvraagknop en zichtbare uitleg leggen de dagelijkse aanvraag vast; daarna volgt bevestiging per e-mail. De bezoeker kiest maximaal 8 onderwerpen en geeft expliciete toestemming voor gebruik van die gezondheidsinteresses. Na dubbele opt-in volgt dagelijks rond 08:10 UTC een mail: passende bronwijzigingen of, bij geen nieuws, één herkenbaar vaste keuzevraag. De frequentie wordt vooraf vermeld. Oude inschrijvingen behouden alleen-bij-wijziging. Voorkeuren aanpassen en afmelden kan in elke mail; geen verborgen bestemmingsfilter en geen gegevensoverdracht aan klinieken.

De leerlus vergelijkt knopteksten op bevestigde inschrijvingen en onderwerpregels op expliciete keuzefasewijzigingen na de mail, alleen met afzonderlijke meettoestemming. Fases zijn oriënteren, vergelijken en een consult overwegen; dit is geen medische beoordeling of consultaanvraag. [Apple bevestigt dat mailcontent ook zonder werkelijk lezen op de achtergrond wordt opgehaald](https://www.apple.com/legal/privacy/data/en/mail-privacy-protection/). Nieuwe mails hebben geen openpixel. Automatische klik-GETs bepalen geen warmte. Vanaf 200 waarnemingen per arm en 30 uitkomsten kan een 99%-vergelijking een kandidaatwinnaar opleveren; 10% blijft uitdager. Deze adaptieve praktijkregel is geen klinische validatie of sluitend causaal experiment.

De technische keten gebruikt gedeelde ontvangerlocks, een vaste dagpayload, ontvanger/dag-idempotency bij Resend en atomaire deelupdates. Welkomstmail en cron tellen samen als maximaal één dagmail. Een droogrun wijzigt geen abonnementen en verstuurt niets. Tests gebruiken alleen een in-memory provider; geen echt testadres is ingeschreven.

Vindbaarheid: een apart ZICHT-profiel surgery meet Google-totalen, pagina’s en zoekvragen met hetzelfde /surgery-filter, plus een eigen vast AI-vragenpanel. Het oude todayin-profiel bevat ook Curaçao en is geen surgery-resultaat. Procedurepagina’s krijgen pas indexatie bij voldoende werkelijk rangschikbare dossiers en eigen ingreepcontext; andere pagina’s blijven bruikbaar met noindex. Canonicals, werkelijke vertalingen, beide ItemLists en paginadatum staan in de server-HTML. Demand Radar v3 filtert vervuilde bestaande cache zonder aankoop en breidt de volgende toegestane verversing uit met ogen/tanden. Ontbrekende volumes zijn onbekend, geen nul, en synoniemen zijn geen unieke zoekers.

Validatie: 23 testgroepen in scripts/test-tsc-choice.mjs controleren de selectie/annulering, limiet, gescheiden filters en favicon, plus alle 126 rankingvertalingen, metadata/anchors, bronnen/scope/duplicaten, toestemming, volledige double-opt-in met gemockte verzending, 101 ontvangers zonder afkap, dezelfde-dag-idempotency, afmelden tijdens verzending, voorkeurwijziging en scriptinjectie. De eigen Chromecontrole omvat desktop, 320px/360px telefoon, 768px tablet en 667x375px landschap: picker zoeken, meerdere keuzes bewaren, annuleren, categorieën en bronuitklappers. Het favicon verschijnt in het tabblad. Werkelijke inboxbezorging en gebruikstesten met patiënten zijn nog niet gemeten.

## Wat wij aan de zoeker leveren

Een bezoeker wil weten: wie behandelt mij, op welke plaats, met welke aantoonbare ervaring, wat kan ik verwachten, wat kost het volledige traject en wie helpt mij als het herstel anders verloopt? De uitkomst van onze dienst is een onderbouwde shortlist, een concreet consultdossier en desgewenst contact met een zelfgekozen behandelaar. Ook uitstellen, een andere behandeling of thuis behandelen blijven legitieme uitkomsten.

Onzekerheid verminderen betekent ontbrekende informatie invullen en grenzen zichtbaar maken. De site mag mensen geen medische zekerheid geven die de onderliggende gegevens niet kunnen dragen.

## Wat het onderzoek wel en niet aantoont

| Bevinding | Bron | Gevolg voor het product |
|---|---|---|
| Keuzehulpen verbeteren kennis, risicobegrip en duidelijkheid over persoonlijke voorkeuren. De review omvat 209 onderzoeken met 107.698 deelnemers. | [Cochrane, Stacey e.a., 2024](https://www.cochrane.org/evidence/CD001431_patient-decision-aids-help-people-who-are-facing-decisions-about-health-treatment-or-screening) | Maak de keuze, alternatieven, voor- en nadelen en persoonlijke prioriteiten expliciet. Dit bewijst niet dat onze eigen site angst vermindert of meer consulten verkoopt. |
| Online reviews hangen consistent samen met patiëntervaring; de relatie met klinische kwaliteit is gemengd. | [Placona & Rathert, 32 studies, 2022](https://journals.sagepub.com/doi/abs/10.1177/10775587211014534) | Houd communicatie, organisatie en nazorgervaring apart van bevoegdheid, veiligheid en behandeluitkomsten. |
| De patiënt moet de uitvoerder, diens opleiding en ervaring, nazorg en extra kosten kunnen bespreken. | [NHS: choosing who will do your procedure](https://www.nhs.uk/tests-and-treatments/cosmetic-procedures/advice/choosing-who-will-do-your-procedure/) | Gebruik exact deze onderwerpen op elke kaart en in elke vergelijking. |
| Bij buitenlandse zorg zijn nazorg thuis, complicaties, terugreizen en verzekering concrete aandachtspunten. | [NHS: cosmetic surgery abroad](https://www.nhs.uk/tests-and-treatments/cosmetic-procedures/advice/cosmetic-surgery-abroad/) | Een reisroute bevat een herstel- en nazorgplan, een kostenspecificatie en een contactpersoon. |
| BIG-registratie bevestigt niet automatisch bekwaamheid voor iedere cosmetische ingreep. | [Rijksoverheid: mag mijn behandelaar de ingreep uitvoeren?](https://www.rijksoverheid.nl/themas/familie-zorg-en-gezondheid/cosmetische-ingrepen/vraag-en-antwoord/cosmetische-ingrepen/mag-mijn-behandelaar-de-cosmetische-ingreep-uitvoeren) | Controleer actuele registratie en proceduregerelateerde bekwaamheid afzonderlijk. |
| Ervaringsvragen kunnen concreet gaan over uitleg, luisteren, respect, bereikbaarheid en coördinatie. | [AHRQ CAHPS measures](https://www.ahrq.gov/cahps/surveys-guidance/cg/about/survey-measures.html) | Ontwerp concrete vragen over wat gebeurde. Onze eigen vragenlijst is daarmee nog geen gevalideerde CAHPS-vragenlijst. |
| Reviewherkomst, selectie, berekening en controle moeten duidelijk zijn; positieve en negatieve ervaringen horen zichtbaar te zijn. | [ACM](https://www.acm.nl/nl/verkoop-aan-consumenten/reclame-en-verleiden/online-beinvloeden/reviews-en-beoordelingen-gebruiken), [FTC platform guidance](https://www.ftc.gov/business-guidance/resources/featuring-online-customer-reviews-guide-platforms) | Eén neutrale uitnodigings- en moderatieregel voor iedere uitkomst. |
| Een responspercentage vraagt om expliciete teller en noemer. | [AHRQ: calculating response rates](https://www.ahrq.gov/cahps/surveys-guidance/survey-methods-research/calculating-response-rates.html) | Publiceer uitgenodigd, ontvangen, bruikbaar en follow-upuitval. |

De oorspronkelijke driekaartvergelijking is vervangen door de bovenstaande reviewranking. De indexparameters en publicatiedrempels zijn redactionele ontwerpkeuzes, zonder bewezen conversiewinst of medische validatie.

## Audit van de huidige gegevens

Momentopname van 15 november: Turkije bevat 46 kandidaatklinieken, waarvan de oude methode er 16 rangschikte. Tien daarvan hebben nul kwalificatiepunten. Geen van de 46 heeft in de huidige velden een bevestigde HealthTurkiye/JCI-status; dat is geen vaststelling dat een kliniek geen vergunning heeft. Slechts zes records hebben een gestructureerde artsenlijst. De oude nummer één kon bovenaan komen met reviews en openheid, zonder kwalificatie- of vergunningpunten.

De code kende drie punten toe aan elke niet-lege garantietekst, ook aan ‘Geen garantie’. Die fout is gerepareerd: alleen een expliciet geverifieerde nazorgbron kan hiervoor meetellen. De oude somscore is uit de nieuwe publieke vergelijking gehaald. Platformaantallen worden niet meer als één gewogen reviewscore gepresenteerd.

## De vergelijkbare eenheid

De definitieve entiteit is **arts × ingreep × operatielocatie**. Dezelfde arts kan voor een andere ingreep of locatie een ander dossier hebben. Kliniekreviews worden niet naar een arts gekopieerd. Een verwijzing naar een oprichter bewijst niet dat de oprichter de bezoeker behandelt.

```json
{
  "case_id": "doctor:procedure:facility",
  "doctor_id": "verified-professional-id",
  "procedure_id": "defined-procedure",
  "facility_id": "verified-operating-location",
  "checks": {
    "identity": {"status":"verified|unknown|failed", "source_url":"...", "verified_at":"YYYY-MM-DD", "valid_until":"YYYY-MM-DD"},
    "registration": {},
    "procedure_scope": {},
    "facility_permission": {},
    "operator_roles": {},
    "restrictions": {}
  },
  "restriction": {"status":"none_found|unknown|active|under_review", "source_url":"...", "checked_at":"YYYY-MM-DD"},
  "quote": {"currency":"EUR", "from":null, "to":null, "includes":[], "excludes":[], "checked_at":null},
  "aftercare": {"named_contact":null, "home_country_provider":null, "followup_schedule":null, "revision_terms":null, "source_url":null},
  "commercial_partner_id": null
}
```

Betaling en partnerstatus zijn afgeschermd van de beoordeling. Registratie, specialisatie, beroepsvereniging, board-certificaat en ziekenhuisaccreditatie worden afzonderlijk opgeslagen. Een accreditatie vervangt geen wettelijke vergunning. Een broncontrole heeft een vervaldatum; die hangt af van register en brontype.

## Ranking in twee fasen

**Nu gebouwd:** alle bestaande dossiers blijven bereikbaar. Zes gedocumenteerde onderwerpen bepalen de presentatiesortering: artsennamen, kwalificatiebron, locatieregisterbron, prijsbron, taakverdeling en expliciet nazorgbeleid. Gelijke dekking staat alfabetisch. Het aantal gedocumenteerde onderwerpen is zichtbaar als bewijsdekking, met de ontbrekende controles erbij. Het is geen artsenkwaliteitsscore. De pagina, metadata, chatcontext en gestructureerde data sluiten hierop aan.

**Definitieve artsenranking:** eerst toelating op actuele identiteit, registratie, relevante bevoegdheid/bekwaamheid, locatievergunning, behandelaarsrollen en actuele maatregelen. Een actieve officiële beperking gaat naar menselijke beoordeling en kan niet met sterren worden weggestemd. Onvolledige dossiers blijven in de directory maar krijgen geen aanbevolenbadge.

Binnen de toegelaten groep vergelijkt de bezoeker per prioriteit: onderbouwde ervaring met de ingreep, nazorg, uitleg en verwachtingen, bereikbaarheid, taal en volledige kosten. Een sortering op patiëntervaring gebruikt dezelfde ingreep, locatie, vraag en follow-upfase. Deel patiënten niet automatisch in op medische geschiktheid; dat is een gesprek met een behandelaar.

`lib/tsc-evidence.js` bevat het voorbereidende contract, toelatingsregels, ontdubbeling, ervaringssamenvatting en een voorlopige sortering op de ondergrens van een Wilson-interval. De standaarddrempel van twintig antwoorden is redactioneel en moet worden gekalibreerd. Overlappende intervallen geven geen bewezen verschil in zorgkwaliteit. De functie activeert nog geen publiek reviewsysteem.

## Reviews verzamelen en conclusies trekken

### Drie gescheiden bronlagen

1. Officiële registers en uitspraken: identiteit, actuele status, specialisatie, vergunning en maatregelen. Bewaar bron, controledatum, vervaldatum en de exacte entiteit.
2. Externe platformprofielen: platform, URL, score, aantal, datum, onderwerp en eventuele waarschuwing. Alleen verzamelen via toegestane toegang of licentie. Bewaar geen volledige reviewteksten zonder toegestane verwerking. Geef arts- en kliniekprofielen hun eigen label. Aggregaten leveren geen unieke patiëntenteller en geen eigen geverifieerde reviews.
3. Eigen uitnodigingen: alle deelnemende patiënten met afzonderlijke toestemming krijgen dezelfde uitnodiging en herinneringen. De kliniek mag niet alleen tevreden patiënten selecteren. Maak zichtbaar hoeveel behandelingen buiten ons uitnodigingsbestand vallen.

### Eigen reviewrecord

```text
review_id, source_type, source_url, collected_at, published_at
doctor_id?, facility_id?, procedure_id?, subject_type
episode_id [privé], treatment_month?, followup_wave, followup_months?
relationship_verified, verification_method, solicitation_source
incentive_disclosure, duplicate_cluster_id?, language
communication, expectations, cost_clarity, aftercare [1..5 of niet van toepassing]
patient_reported_result?, reported_problem? [afzonderlijke optionele gegevens]
moderation_status, moderation_reason, version
consent_processing_version, consent_publication_version
```

Een afspraakbevestiging of redactief gecontroleerd afgeschermd bewijs kan de behandelrelatie staven. Verzamel hiervoor geen compleet medisch dossier. Scheid contactgegevens, verificatiebewijs en publieke tekst; verwijder bewijs volgens een vooraf vastgesteld bewaarbeleid. Een geverifieerde relatie betekent dat de relatie is gecontroleerd, niet dat iedere inhoudelijke uitspraak medisch bewezen is.

### Momenten en vragen

| Moment | Wat meten | Wat er niet uit volgt |
|---|---|---|
| Na het consult | Uitleg, realistische verwachtingen, volledige offerte, ervaren druk, wie zou behandelen | Dat de operatie een goed resultaat heeft |
| Na de behandeling, vroeg contact | Organisatie, bereikbaarheid, informatie en afgesproken controles | Definitief behandelresultaat |
| Procedurepassende latere follow-up | Ervaren resultaat, nazorg, extra kosten en onopgeloste problemen | Een vergelijkbare medische complicatiekans zonder volledige denominator en case-mixcorrectie |

De precieze follow-upmomenten worden per ingreep met een bevoegde inhoudelijk reviewer vastgelegd. Een planning van één, drie, zes en twaalf maanden kan voor het prototype dienen, maar is geen universele medische standaard. Gebruik voor klinische uitkomsten zo nodig gevalideerde, correct gelicenseerde PROMs; noem een eigen tevredenheidsvraag nooit een gevalideerde uitkomstmaat.

Concrete ervaringsvragen: kreeg je begrijpelijke uitleg, wist je wie je zou behandelen, klopte de vooraf opgegeven totaalprijs, kon je iemand bereiken en volgde de afgesproken nazorg? Vraag ook wat tegenviel. ‘Niet meegemaakt’ telt niet als een ontevreden antwoord.

### Analyse en moderatie

Ontdubbel op behandeling, arts, locatie en follow-upgolf; behoud versies. Dezelfde persoon op twee platforms mag geen twee eigen geverifieerde patiënten worden. Onbekende externe dubbelen blijven expliciet onbekend.

Publiceer per onderwerp de respons, verdeling en onzekerheid. Een Wilson-interval beschrijft steekproefonzekerheid in de respondergroep; het corrigeert niet voor selectiebias, uitval, ontbrekende patiënten of verschillen in casemix. Formuleer een probleem als ‘gemeld door x van n respondenten in deze groep’; presenteer dat niet als complicatiepercentage van alle behandelingen.

AI mag onderwerpen en patronen voorstellen. Elke openbare conclusie verwijst naar de gebruikte feiten en reviewrecords. Negatieve en positieve ervaringen volgen dezelfde moderatieregels. Claims over schade krijgen menselijke broncontrole, een status en wederhoor; betalen kan een klacht niet verwijderen. Verdachte patronen zijn onderzoekssignalen en geen automatische beschuldiging van fraude.

### Vaste conclusie op ieder profiel

> **Onderbouwd:** welke kwalificaties, rollen en voorwaarden we konden controleren.  
> **Patiënten ervaren:** de belangrijkste positieve en negatieve thema’s met aantallen en follow-upfase.  
> **Nog bespreken:** concrete ontbrekende antwoorden vóór een consult.  
> **Voor jouw voorkeuren:** welke aantoonbare kenmerken overeenkomen met wat je belangrijk vindt.  
> **Grenzen van het dossier:** welke behandelkwaliteit of persoonlijke geschiktheid we niet kunnen vaststellen.

Geen verzonnen voorbeeldconclusie over een echte arts. De huidige data bevat vooral platformaggregaten; daaruit kunnen nog geen geverifieerde themafrequenties worden afgeleid.

## Consistente UX

Eén navigatie: artsen vergelijken, kosten en herstel, hoe we beoordelen. Op de homepage staat één ingreep-bestemmingskeuze. Bestaande vergelijkingen blijven ook als gewone links vindbaar. De losse ongefilterde reisroutes en gemengde taalblokken verdwijnen van de homepage.

Iedere resultaatkaart heeft dezelfde volgorde en woorden. Eerst verschijnen drie kaarten, met een knop voor alle dossiers. De bezoeker kan op naam zoeken en maximaal drie dossiers naast elkaar leggen. Conclusies, reviewbronnen, gemelde kwesties en bronlinks zijn per kaart uitklapbaar. Het gebrek aan een bevestigde vergunning is meteen zichtbaar en niet verstopt onder sterren. De chat zit op de vergelijking als uitklapbare hulp met pagina-inhoud als context.

Een vervolgversie voegt een persoonlijk consultdossier toe met geselecteerde artsen, open vragen, kosten en afspraken over nazorg. Bewaren kan lokaal of via een afzonderlijk toegestane contactfunctie. Een bezoeker hoeft zich niet aan te melden om de ranking, prijzen, bronnen of onzekerheden te lezen. Contact is de vervolgstap na verkregen waarde.

Vaste ontwerpkeuzes: één accentkleur, rustige achtergrond, één primaire actie per blok, dezelfde labels, leesbare tekst, toetsenbordfocus, grote aantikvlakken, systeemvoorkeur voor donker en minder beweging. De vergelijkingtabel mag op een smal scherm horizontaal schuiven; kaarten en formulieren stapelen.

## Aanvragen aan artsen verkopen

De verkochte eenheid is een **bevestigde consultaanvraag voor de door de bezoeker geselecteerde arts en locatie**, met de gekozen contactwijze. De bezoeker ziet vóór verzenden de ontvanger, gegevens en het doel. Deel het consultdossier alleen met de expliciet gekozen ontvanger. Medische geschiktheid wordt niet automatisch vastgesteld.

Een aanvraag aan één arts is exclusief. Wil de bezoeker drie artsen vergelijken, dan kiest en bevestigt hij drie afzonderlijke ontvangers. Een geïnteresseerde bezoeker wordt niet ongemerkt aan de hoogste bieder of een reeks callcenters verkocht.

### Afhandeling en facturatie

```text
concept → adres bevestigd → toestemming vastgelegd → ontvanger gekozen
→ veilig afgeleverd → ontvangst bevestigd → contactuitkomst → eventueel consult gepland
```

Voor de commerciële pilot gelden vastgelegde acceptatiecriteria: echt bevestigd contact, expliciete ontvanger, passende ingreep/locatie en geen dubbel verkochte aanvraag binnen de afgesproken periode. Houd afleveren, reactie, contact en gepland consult als verschillende gebeurtenissen bij. Een arts die een verzoek ontvangt, mag het bedrag niet via ons rangschikkingsmodel beïnvloeden. Annulering en intrekking stoppen toekomstige overdrachten; reeds gedeelde gegevens hebben hun eigen bewaarplichten bij de ontvanger.

Prijsstelling is nog een experiment. Test in één juridisch geschikte markt een vooraf afgesproken vaste vergoeding per geldige aanvraag, zonder percentage van de operatieprijs. Vergelijk dat met een vaste vergoeding voor echte software- en communicatiediensten als die constructie ter plaatse is toegestaan. Een abonnement is niet automatisch een oplossing voor een verboden verwijzingsvergoeding.

**Routevoorwaarde:** betaalde patiëntenverwijzingen zijn niet overal toegestaan. De beroepsorde van de Ärztekammer Westfalen-Lippe verbiedt bijvoorbeeld vergoedingen voor patiëntentoewijzing in §31. Dat bewijst geen wereldwijd verbod, maar maakt een landencontrole vóór activering noodzakelijk. [Primaire bron](https://recht.nrw.de/lrmb/bekanntmachung/04122025-berufsordnung-der-aerztekammer-westfalen-lippe-vom-15-november-2003/). Voor de eerste markt ontbreken nog een definitieve contractpartij, de concrete vergoeding en de lokale juridische toets.

Behandel ingreep-interesse en contactgegevens samen als mogelijk gevoelige gezondheidsgegevens. Leg een geldige grondslag en toepasselijke uitzondering voor gezondheidsgegevens vast. Maak verwerking van de aanvraag, overdracht naar een genoemde ontvanger, reviewpublicatie, follow-up en marketing afzonderlijk. Voor overdrachten buiten de EER zijn ook de toepasselijke overdrachtswaarborgen nodig; algemene toestemming voor ‘partners’ volstaat niet. [EDPB consent guidance, 2026](https://www.edpb.europa.eu/system/files/2026-04/edpb-summary-consent_en.pdf).

### Verdienmodel meten

Rapporteer per route: vergelijking bekeken → twee dossiers vergeleken → consultdossier afgerond → bevestigde ontvanger → geldige aanvraag → arts reageert → contact bevestigd → consult gepland. Daarnaast: intrekkingen, klachten en antwoorden op ‘weet je wat je nog moet vragen?’

Omzetmodel: **geldige aanvragen × gerealiseerde vergoeding**. Brutomarge: omzet minus acquisitie, verificatie, support, afleveren en restituties. Gebruik geen verzonnen conversiepercentages. De waarde voor de arts moet blijken uit werkelijk bereikbare en goed voorbereide mensen en gerealiseerde consulten.

## Wat is gebouwd en wat volgt

| Onderdeel | Status |
|---|---|
| Homepage, catalogus en ranking EN/NL/DE | Gebouwd in lib/tsc-ranking-ui.js en aangesloten op bestaande en nieuwe routes |
| Genummerde reviewranking, aparte artsen/klinieken, naam- en landfilter | Gebouwd in lib/tsc-ranking-ui.js; vergelijking met vinkjes vervallen |
| Afzonderlijke reviewplatforms en zichtbare ontbrekende controles | Gebouwd |
| Reparatie garantietekst en nieuwe chatcontext | Gebouwd |
| Review- en toelatingsmodel met ontdubbeling en onzekerheid | Voorbereid als pure functies in lib/tsc-evidence.js |
| Gevalideerde arts × ingreep × locatie-dossiers | Aanvullen en inhoudelijk controleren nodig |
| Eigen reviewuitnodigingen, beveiligde bewijsverificatie en moderatie | Nog te bouwen volgens dit contract |
| Artsencontracten, landencontrole, beveiligde aanvraagoverdracht en facturatie | Nog in te richten; er is geen actieve leadverkoop |
| Gebruikerstest en conversie-/besliskwaliteitmeting | Volgende validatiestap; het ontwerp is nog niet met patiënten gevalideerd |

Naast de brede catalogus moet de dagelijkse verdieping per ingreep voldoende actuele arts-, locatie- en reviewbronnen opleveren. Brede dekking vervangt die controle niet. Voer daarna vijf echte gebruikstesten uit met zoekers: kunnen zij de behandelaar herkennen, de verschillen uitleggen, een ontbrekende controle noemen en de juiste vervolgvraag stellen? Dit is een onderzoeksplan, geen uitgevoerd patiëntenonderzoek.

