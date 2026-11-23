# Traffic leren: onderzoek en eerste voorstel

23 november 2026. Onderzocht 2026-11-23T19:33:31.287Z. Alleen Stocking Books, Lasting Change en boeken-Pinterest. Status: onderzoek en ongepubliceerd concept.

## Waar we staan

Laatste volledig afgesloten dag: 22 november UTC. Stocking Books: 7 geregistreerde pagina-openingen. Lasting Change: 13. Eén vergelijkbare meetdag; groei onbekend. De 208 Amazonredirectverzoeken zijn geen unieke klikkers of verkopen. Bronverdeling is niet beschikbaar. Acht gelogde pins zijn verricht werk, geen bereikresultaat. Verse Pinterest-weergaven, uitgaande kliks en saves ontbreken.

Vandaag zijn drie van de zeventien sitemap-URL's via de bestaande Google-API gecontroleerd: één geïndexeerd, twee ontdekt maar nog niet geïndexeerd. De niet-geïndexeerde ingangen zijn stocking-stuffers en free-printable-christmas-word-search. Dit is geen uitspraak over alle zeventien URL's. Geen DNS, rechten of verificatie opnieuw wijzigen.

## Wat anderen daadwerkelijk laten zien

| Bron | Waarneming | Overneembare werkwijze | Beperking |
| --- | --- | --- | --- |
| [Melissa Bourbon, 25 juni 2025](https://janefriedman.com/pinterest-is-my-best-kept-author-marketing-secret/) | Een als organisch gefilterd 30-dagendashboard toont 5,15k uitgaande kliks. Het artikel plaatst het onder december 2024 tot januari 2025. | Bruikbare artikelen en gratis materiaal naast boekcovers; verticale beelden; borden op lezersinteresse. | Zelfrapportage van een auteur met marketingcursus. Geen gecontroleerde oorzaak of bewezen KDP-attributie. |
| [One Little Project, 18 november 2026](https://onelittleproject.com/christmas-word-search/) | Een actuele gratis woordzoekpagina met drie niveaus, antwoordbladen en duidelijke printlinks. Dit domein komt als bron terug in ons vaste woordzoekpanel van 23 november. | Laat het gratis resultaat meteen zien, benoem wie het gebruikt, maak afdrukken eenvoudig. | Geen verkeerscijfers op de gecontroleerde pagina. Een AI-citaat is geen Google-positie of verkoop. |
| [Ness Labs, december 2020](https://nesslabs.com/newsletter-curiosity-consistency) | De maker beschrijft 25.000 nieuwsbriefabonnees en distributiepieken na externe vermeldingen, onder meer Product Hunt, Hacker News, YouTube en Calm. | Elk sterk stuk heeft een externe ingang en een nuttig resultaat dat lezers kunnen delen. | Historisch en zelfgerapporteerd. Abonnees zijn geen websitebezoekers. |
| [Pinterest over Chiara Celani](https://create.pinterest.com/en-ca/success-stories/chiara-celani/) | Platformcasus meldt 165% meer uitgaande kliks in drie maanden. | Publicatieplanning en inhoudskeuze met echte kanaalcijfers bijsturen. | Geen absolute basis of exacte kalenderperiode; marketingcasus, geen causaal experiment. |

Afleiding voor ons: een gratis bruikbaar resultaat is een toetsbare ingang naar onze boeken. Deze bronnen voorspellen geen verkeerswinst voor onze sites. Volume of regelmaat alleen is geen bewezen verklaring.

## Eén concreet lek in de geplande distributie

De geplande sok-puzzel-pin toont/promoot een betaald sudokuboek, maar verwijst naar gratis woordzoekers. De standaardtekst noemt drie gratis puzzels. De doelpagina bevat twaalf grote woordzoekers met antwoorden en vraagt geen aanmelding. Dit verschil is gecontroleerd in lib/bspin.js en de live HTML. Het is een aantoonbare mismatch, geen berekende hoeveelheid verloren verkeer.

Eerste voorstel: behoud het bestaande puzzelslot in de aangekondigde batch en toon de echte gratis woordzoeker. De overige drie concepten blijven staan. Geen extra pins of hoger dagvolume.

**Titel:** 12 Free Printable Christmas Word Searches with Answer Keys

**Beschrijving:** Print 12 free Christmas word search puzzles in large print, with an answer key for every puzzle. Choose Christmas Morning, Santa's Workshop, Christmas Baking and more. Print at home, no sign-up.

**Beeld:** [concept van 1000 × 1500](2026-11-23-pin-woordzoekers.svg), zwart-wit, met het exacte eerste raster uit onze eigen pagina. Geen beeld of tekst van concurrenten gekopieerd. SVG is de bewerkbare preview; vóór plaatsing omzetten naar PNG/JPEG en formaat opnieuw controleren.

**Bord:** bestaand stocking-stuffersbord 271060540011963292, account kadolyshop 6afb8a5d86e8bb18f844fc95.

**Bestemming:** https://stockingbooks.com/free-printable-christmas-word-search?utm_source=pinterest&utm_medium=organic_social&utm_campaign=sb-free-wordsearch-20261123&utm_content=20261123-sok-puzzel-1j5t

De bestaande boekaanbevelingen onder de gratis puzzels blijven de relevante vervolgroute. Geen nieuwe e-maildrempel en geen beschikbaarheid van een LC-PDF beloven.

## Hoe we er werkelijk van leren

1. Eerst het concrete beeld en de tekst tonen. Publiceren pas na exact akkoord en binnen de bestaande planning. Geen succes afleiden uit goedkeuring of plaatsing.
2. Bij toegestane plaatsing echte post-ID, publicatietijd, bestemming en campagne-ID bewaren. Beeldformaat en werkende URL controleren.
3. Hoofdmaat: echte organische uitgaande Pinterestkliks naar deze bestemming. Vertoningen en saves apart. Site-openingen vanuit Pinterest op dezelfde pagina zijn een andere maat, geen unieke mensen.
4. Eerste distributiecheck na zeven dagen; oordeel na veertien tot eenentwintig dagen vanaf de daadwerkelijke plaatsing en alleen met voldoende vergelijkbare gegevens. Zonder bereik of providerdata blijft de uitkomst onbekend.
5. Er is nog geen vergelijkbare historische puzzelpin in de lijst van geplaatste pins. Dit is een verkennende pilot, geen eerlijke A/B-overwinning. Laat lopende sitecontrolegroepen intact. Een latere vergelijking gebruikt dezelfde pagina, leeftijd, bord en meetdefinitie binnen bestaande slots.
6. Ruwe Amazonverzoeken blijven operationele signalen. Geen verkoop uit Pinterest claimen zonder attributie. KDP blijft een afzonderlijke verkoopbron.

Definities: [Pinterest Analytics](https://help.pinterest.com/en/business/article/pinterest-analytics). Uitgaande kliks verlaten Pinterest; pinopeningen vergroten alleen de pin. Metricool-branduitlezing gaf tweemaal INVALID_ARGUMENT. Een pluginzoekactie vond geen Zernio-connector. Interne ongedateerde nulwaarden blijven daarom onbekend als prestatiemeting; geen nieuw eindpunt of sleutel zoeken.

## Dagelijks blijvend toepassen

Elke ronde leest minimaal één relevante primaire bron van een vergelijkbare maker of een bron met echte kanaalcijfers. Sla bron, datum, waarneming, tegenbewijs en overdraagbaarheid op. Kies één aanpassing, maak het concept en lees de eerdere proef terug. Het ochtendrapport noemt wat verkeer bracht en wat nog onbekend is. Een overgenomen aanpak wordt pas onze les wanneer onze eigen data die ondersteunt.

Voor LC krijgt het al geplande start-over-artikel een eigen invulbaar weekplan dat zich later in een pin laat samenvatten. De schrijfopdracht blijft één artikel; geen extra vergelijkbare pagina's. Nieuwsbrief en externe vermeldingen zijn latere opties, met aparte goedkeuring voor verzending en met werkende instellingen.
