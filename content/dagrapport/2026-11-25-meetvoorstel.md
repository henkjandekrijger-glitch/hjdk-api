# Voorstel: kunnen leren welke pin een website-opening brengt

25 november 2026. Status: uitsluitend voorstel, geen code, deploy, telverzoek of instelling uitgevoerd.

## Bewijs van het lek
lib/bsmeet.js leest bron maar verzendt geen utm_content. Het bestaande op=tel in fn/bs.js bewaart afzonderlijke bron- en paginatotalen. Het dagrapport geeft24nov42Stocking- en5LCpagina-openingen; bronbezoek per pin kan daar niet uit worden gereconstrueerd. De bestaande Clickmind-proefstand voor bookstuffers antwoordt bij deze controle: geen proef voor deze site. Dit bewijst geen afwezigheid van alle Clickminddata, wel dat deze bestaande uitlezing geen per-pin landingsbewijs levert. op=zicht organisch accepteert alleen kz/us/de, niet onze twee site-ID's; lege sites[] is dus geen nulverkeer. De bestaande Google-zoekvragenlijsten bevatten geen dagen/regels; dat is geen betrouwbare nulmeting.

## Exact kleinste voorgestelde wijziging
1. Breid alleen het bestaande meetscript en op=tel uit. Behoud bron/pagina/UTC-tellers. Lees utm_content uitsluitend op de actuele URL en accepteer alleen bekende gepubliceerde pin-ID's uit een beperkte toegestane lijst. Onbekende waarden negeren, geen vrije URL/zoektekst opslaan.
2. Tel een extra gezamenlijke rij per UTC-dag, site, exacte bestaande landingspagina, bron en goedgekeurde pin-ID. Alleen de eerste pagina met die UTM markeren als aankomst; doorbladeren zonder UTM blijft gewone pagina-opening. Geen blijvende per-pin toeschrijving uit sessiebron.
3. Voeg aan het bestaande droge dagrapport een optionele gestructureerde uitlezing toe voor gesloten meetdag, vorige meetdag, bestaande afzonderlijke bron/paginatotalen en de nieuwe gezamenlijke pinrijen. Dit is een VOORGESTELDE uitbreiding, nu nog niet aanroepbaar; geen nieuw eindpunt introduceren. Geen Telegram in droge modus.
4. Geen cookies, vingerafdruk, persoonsgegevens of gebruikers-ID. Bestaande botfilter en webdriver-uitsluiting behouden. Retentie60dagen. Maat heet geregistreerde UTM-landingsopeningen, geen unieke mensen, bewezen menselijke kliks of verkoop. Herladen kan opnieuw tellen.
5. Bestaande pins, beelden, bestemmingen, site-inhoud, controlegroepen, volume en betaalinstellingen behouden. Geen terugwerkende cijfers: meting start pas na eventuele exacte goedkeuring en livecontrole.

## Hypothese, controle en toets
Hypothese: één gezamenlijke telrij maakt de bijdrage van elke herkenbare pin aan geregistreerde landingsopeningen zichtbaar zonder ongeldige samenvoeging van marginale totalen. Primair technisch: twee verschillende testpin-ID's komen exact op juiste site/pagina/bron/dag terecht en worden niet onderling gemengd. Test in geïsoleerde opslag: pinA/pinB, SB/LC, intern doorbladeren, ongeldig ID, bot, dubbele beacon binnen één rendering, UTC-daggrens, oude tellingen gelijk, dry-run geen Telegram. Geen testbezoeken aan productie en geen pinlog/pinuitkomst verzinnen. Ontbrekende of niet geleverde metingen blijven null.

Bij akkoord: eerst code op aparte branch en tests, vervolgens gecontroleerde uitrol en werkingstoets. Een technische werkingstoets bewijst geen trafficgroei. Inhoudelijke pinhaak daarna14tot21dagen met voldoende vergelijkbare providergegevens beoordelen. Provider-uitgaande kliks, saves en vertoningen blijven afzonderlijke vereiste bronnen; deze aanvulling vervangt ze niet.
