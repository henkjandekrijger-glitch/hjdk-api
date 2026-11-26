# Boekensites: aanmelding, lezersteam en Associates

Waarneming 2026-11-26T12:44:20.752Z. Status: UX-concept, niet op de productiesites. Henkjan vraagt altijd eerst de UX te zien. Exacte preview: [interactieve HTML](./2026-11-26-subscribers-ux.html). De HTML werkt zonder netwerkafhankelijkheden; alleen expliciet aangeklikte bestaande inhoudslinks navigeren. Geen echte aanmelding, mail, affiliatelink, campagne of betaling gestart.

## Nieuw live uitgevoerd
Na Henkjans precieze akkoord is PR15 samengevoegd als 659bdcbb40fbad335aa3ec85f774ff210d23b477 en productie READY (dpl_GBpKrPYBWfKQayrsmRziAMobTczB). Op 2026-11-26T12:35:06.240Z gaf /api/bs?op=pinplan&n=8 vier kandidaten/vier unieke ASINs/geen bekende herhaling binnen14dagen. 26tests geslaagd. BS-gezond17paginas44boeken, LC-gezondok,3liveartikelen2concepten behouden. Geen verkeerstoename afleiden. Beperking: bekende boekhistorie, geen atomaire reservering en geen volledige providerplanning. PR13 blijft apart.

## Concreet aanmeldlek
Bestaande cloudbron /api/mm/motorbeheer?p=bookstuffers en p=lastingchange, gelezen 26nov12:36UTC: project=null, stand.ok=false, fout=onbekend project. De parameter is p, niet site; een leesaanvraag met site viel terug op Kadoly. Die Kadolycijfers zijn geen boekencijfers. lib/modalmotor.js heeft doubleoptin/consenttekst/voorkeuren/pauze/opzegging en per-projectconfig; vaste projectenlijst bevat Kadoly. Mailmind lib/mailmind.js heeft nog geen boekenstroom. Bestaand Clickmind/modal.js heeft controlegroepen; behouden. LC-PDF/mailgezondheid is niet automatisch bewijs over Mailmind-verzendbaarheid.

## UX ter inzage
Stocking Books: email links naar bestaande gratis activiteiten, daarna wekelijkse activiteiten/boekideeën. Knop: Email me the free activities. Gratis inhoud blijft ook rechtstreeks bereikbaar, geen poort voor bestaande gratis pagina's.
Lasting Change: bestaande gratis zeven-dagenstructuur, daarna één reflectievraag per week. Knop: Send me the free reset plan. Geen betaalde PDF-belofte of zeven-dagenresultaatbelofte.
Lezersteam: aparte optin voor occasionele uitnodigingen, voorstel vanaf1feb2027. Geen automatische nieuwsbriefkoppeling of gegarandeerd gratis boek/review.
Demo: verplichte expliciete toestemming voor de gekozen merkbelofte; emailvalidatie; controleerinbox; gesimuleerde bevestiging; resource; voorkeuren en opzegroute. Niets verstuurd/bewaard. Mobiel gestapelde layout onder700px, desktop twee kolommen. JS-syntaxis gecontroleerd, geen externe scripts, fetch/analytics/localStorage. Browser QA niet mogelijk: IAB niet beschikbaar, browserinventaris leeg. Geen screenshots of rendercontrole claimen.
Na exact UX-akkoord: kleinst mogelijke implementatie op reviewbranch, aparte merkprojecten/consent/opzegging en bevestigde afzender onderzoeken. Bevestigingsmail pas activeren na expliciet akkoord op de exacte flow. Geen bestaande Kadolyinschrijvers overzetten.
Primaire meetmaat: bevestigde inschrijvingen per100geschikte geregistreerde pagina-openingen, met bron/periode/definitie en bestaande no-modalcontrole. Formulierverzending is geen bevestigde inschrijving. Eerst meetwerking, daarna voldoende vergelijkbare data; geen vaste conversiewinst beloofd. Retourbezoek/sitekliks uit volgende emails apart, geen verzending in deze ronde.

## Primaire actuele bronnen, gecontroleerd26nov2026
Amazon KDP https://kdp.amazon.com/en_US/help/topic/G202101910 : gratis/afgeprijsde boekkopie mag zonder vereiste of beïnvloede review; andere beloning zoals cadeaubon ongeldig. Geen reviewruil opnemen in een nieuwe proef. Voor1feb2027 vrijwillig eigen lezersteam en eventueel distributieplatform, eerst titelrechten/KDPSelect/digitalevoorwaarden en genrecriteria toetsen. Geen gegarandeerde sterren/Verified Purchase/positieve review.
Booksprout https://booksprout.co/pricing : primaire zoekindex noemt Growing Author$9/maand; open leverde alleen tagmanagerframe, dus detail25kopieën/1campagne niet zelfstandig bevestigd uit volledig zichtbare primaire pagina in deze ronde. Kosten/titelgeschiktheid en review-vrijblijvendheid opnieuw verifiëren vóór aankoop; geen abonnement afgesloten.
BookSirens https://booksirens.com/pricing en https://support.booksirens.com/article/124-how-do-i-stay-within-my-budget : $10plaatsing bij acceptatie plus$2pergevondenlezer. Dit koopt distributie, geen gegarandeerde reviews. https://support.booksirens.com/article/48-why-was-my-book-declined (bijgewerkt31aug2026): ouderdan30dagen of nonfictionniche kan worden afgewezen, dus bestaande catalogus niet blind aanmelden. Exacte keuze blijft voorstel.
Voorkeursvolgorde: eigen vrijwillig lezersteam opbouwen; daarna één passend boek in beperkte distributieproef na akkoord op kosten, titel en voorwaarden. Geen betaalde reviewruil. Meten: echte geïnteresseerde lezers/downloads, vrijwillig daadwerkelijk verschenen reviews met datum/link; geen vendorreviewpercentage als voorspelling.

## Contextuele Associates-aanvulling
Per inhoud één relevant hulpmiddel, bij puzzels potlood/gum, bij LC notitieboek. Eigen boekkooproute behouden; niet iedere pagina vol producten. UX toont categorievoorbeelden met inactieve demoknop, geen geverifieerde productkeuze of winkelvoorraad. Echte product-ASIN/tag/sitegoedkeuring nog te controleren via bestaande integratie, geen sleutels zoeken.
Disclosure in preview: As an Amazon Associate I earn from qualifying purchases.
Primaire bronnen: https://affiliate-program.amazon.com/help/operating/agreement en https://affiliate-program.amazon.com/help/operating/participation/ . Geen prijs/rating/voorraad verzonnen, geen clickbeloning, geen email-SpecialLinks. Mailmindlinks eerst naar eigen nuttige pagina; vrijwillige expliciete Amazonklik op site. Eigen KDProyalties en Associatescommissies apart. Klikken zijn geen verkopen. Geen bio/ads/budget/betaalinstelling gewijzigd.

## Volgende toets
Na UX-akkoord eerst backend/afzender/consent/doubleoptin/opzegging/Clickmind-eventmeting testen zonder echte verzending. Technische werking toetsen vóór campagnegereedmelding. NorthStar30xorganisch blijft zonder geldige7dagenbaseline niet berekenbaar. Deze aanmeld/affiliateconcepten bewijzen geen extra organisch verkeer.
