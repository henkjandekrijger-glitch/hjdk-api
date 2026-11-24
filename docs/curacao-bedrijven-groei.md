# Curaçao-bedrijven en keuzehulpen: gedeelde groeironde

Bijgewerkt: 23 november 2026 (Curaçao). Opdracht Henkjan: veel meer zoekverkeer, vooral via de 11.906 bestaande Curaçao-bedrijven; samen met de keuzehulpen. Ontwikkeling blijft in deze chat. De bestaande dagelijkse keuzehulpenronde doet onderhoud aan data, zonder nieuwe functies of extra campagnes.

## Wat nu werkt

- Exacte eigen bronlinks koppelen een keuzehulpzaak aan de juiste bestaande bedrijvengidszaak. Naamgelijkenis of een gedeelde ketenwebsite is onvoldoende. Alleen een bestaand, indexeerbaar NL/EN-doel met minstens vijf reviews kan het hoofdadres worden.
- De zaakpagina neemt bestaande bijzonderheden, voor- en nadelen, prijzen en platformbeoordelingen met bron en oorspronkelijke peildatum over. De vergelijking blijft een eigen pagina voor de keuzevraag; de categorie bedient alle zaken, adressen en tijden.
- Na de gegevenskoppeling verwijzen kaarten en oude keuzehulpdetail-URL's naar het bedrijfs-hoofdadres. Bestaande lezersreviews blijven in hun opslag en worden op de hoofdpagina meegelezen. Samengevoegde reviews krijgen geen aggregateRating-schema. De eigen website en een interne bronlink zijn aparte rollen.
- De NL/EN-taalverwijzingen blijven intact. DE/ES/PT-bedrijfspagina's blijven noindex zoals eerder besloten.
- Gelijke begin- en eindtijden bewijzen geen 24-uursopening. Onbekende tijden verdwijnen uit status, week en schema; expliciete 24-uursopening en diensten na middernacht blijven staan.
- Meting start na een echte interactie of drie seconden zichtbaar. Bekende bots en webdriver zijn uitgesloten. Bedrijfsmeting gebruikt bz2 en proefronde 5; geen oude botvervuilde tellers als nieuwe baseline.
- De bestaande gidsbouw controleert dagelijks ook dezelfde hoeveelheid bronpagina's. Incomplete bron stopt vóór schrijven; sterke afname onder 90% bewaart de huidige catalogus. Hashes bewaren ongewijzigde data en bestaande slugs; lastmod verandert alleen bij echte inhoud. Geen nieuwe cron of AI-aanroep. Een dagelijkse controle leest de bestaande broncache; alleen gewijzigde categorieën worden opnieuw geschreven, plus eenmaal hashmetadata.

## Elke dag in de bestaande keuzehulpenronde

1. Lees de levende bedrijfsoverdracht en dit protocol. Lees /api/gsc?op=curvind en /api/gsc?op=curinhoud op hjdk-api-henq.vercel.app; /curacao-gids?op=bedrijfsgroei toont de actuele dekking en recente voorbeelden. Lees ook curacao.day/api/cw?w=regie en de beloofde gidsen in todayin/bzz/data/cw/keuzehulp-kansen.json. Voer geen tweede editie, campagne- of gidsbouwronde uit.
2. Werk eerst bestaande zaken op positie 4-20 met vertoningen en weinig kliks af. Begin met de bestaande keuzehulpen voor kleding, fastfood, pizza en bouwmarkt. Hoogstens vijf inhoudelijke bronverbeteringen per dag; meerdere onafhankelijke reparaties mogen in één geteste batch.
3. Controleer openingstijden, menu of feit bij de eigen site of andere genoemde primaire bron. Bewaar datum en URL in data/cur/<gids>.json bij het bestaande item. Een filiaalconflict krijgt een expliciete notitie; nooit prijzen van een ander adres zonder waarschuwing overnemen. Zet geen tijden terug zonder bevestiging. Geen tekst verzinnen om een lege bedrijfspagina te vullen.
4. De gedeelde renderer neemt die wijziging automatisch mee op de gekoppelde zaakpagina en in de chatcontext. Controleer de NL- en EN-pagina, canonical, taalretourlink, de vergelijking en één echte websiteknop. IndexNow alleen voor inhoudelijk veranderde bestaande URL's, via het bestaande curacao.day-eindpunt; dit is geen verzoek aan Google.
5. Bescherm lopende SEO-controles; wijzig geen titelproef zonder voldoende waarnemingen. De structurele reparatie van 23 november is een mogelijke verstoring van oudere proeven, geen winnaar. De nieuwe werking wordt na 14 en 28 dagen beoordeeld; langere Google-vensters uit de algemene groeitaak blijven leidend voor een groeiconclusie.
6. Schrijf begin/eind, URL, bron, wijziging, dag en volgende toets in data/cur/bedrijf-groei-log.json. Is deze dag met dezelfde wijziging al vastgelegd, voer hem niet nogmaals uit. Alleen geaggregeerde cijfers en openbare bedrijfsfeiten; geen lezersgegevens of sleutels.

## Meten

Bevroren startoverzicht, opgehaald 24 november 00:06 UTC (23 november Curaçao): /api/gsc?op=curinhoud gaf over 28 dagen 19.413 vertoningen en 276 kliks in het paginaoverzicht, waarvan bedrijven/* 16.721 vertoningen en 192 kliks. Dit zijn pagina-overzichten; rapporteer site-totalen zonder query-dimensie apart. De eigen browserteller en Google lopen niet over hetzelfde venster.

Dagrapport: Google-kliks/vertoningen en periode, bedrijfs-/categorie-/keuzehulpsegment, gemeten zoekverwijzingen, aanmeldingen en later gelezen mail. Dekking, gecrawld zijn en meer paginaweergaven zijn geen bewezen groei. De metric 'paginas_in_google_7d' bij curvind betekent pagina's met vertoningen, geen volledige URL-inspectie. Crawlers en AI-broncitaten apart tellen.

## Nog begrensd

Geen eigenaren benaderen zonder akkoord op ontvangers en concrete tekst. Flipboard-publicatie vraagt een werkende eigen writersessie; geen eindeloos rondje herplaatsen. De nieuwe bronhashes krijgen hun eerste opslag tijdens de bestaande gidsbouw; tel die stap pas als uitgevoerd wanneer het live antwoord dat bevestigt. De tier-1-aanmeldroute blijft apart van deze organische ingreep en houdt eigen campagne- en budgetgrenzen.

