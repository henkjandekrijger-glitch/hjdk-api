# WAM: dossiers vooraan, SEO en AI-vragen

24 november 2026. Brononderzoek en een afgebakende diagnose; geen bewezen verkeersgroei.

De homepage zet twee concrete eigen dossiers voorop. Reviews blijven op /bedrijven bereikbaar via gewone HTML-links en de sitemap. Hoofdtekst 20px, secundaire tekst 16px.

## Gemeten AI-antwoorden

ZICHT gapscan `wam-dossiers-20261124`, model `perplexity/sonar`: 4 vragen, 4 gelukt. Dit is één AI. De automatische zwaktescore is een heuristiek; hij bewijst geen inhoudelijke onjuistheid of afwezigheid in andere LLMs.

| Vraag | Aangehaalde domeinen | Toegepaste aanvulling |
|---|---|---|
| Blendle schrijft jaarlijks geld af voor een vergeten abonnement. Welke gegevens moet ik controleren? | blendle.support, mwm.ai, nl.trustpilot.com | Eigen correspondentie, onderscheid €396 gemelde jaarbedragen/€297 terugvraag, opzegbevestiging en ticketstatus. |
| Hosting opgezegd maar toch weer een factuur ontvangen. Wat moet ik controleren? | hostgator.com, bluehost.com, ahosting.net, mijndomein.zendesk.com, hostinger.com | Nederlandse controlelijst per product en factuurperiode, met officiële Mijndomein-bronnen. |
| Hoe kan ik de VriendenLoterij rechtstreeks online opzeggen? | stichting-aad.nl | Bestaande directe opzegpagina met officieel reglement behouden; geen betaalde opzegservice. |
| ANP Fair Licensing fotoclaim ontvangen. Hoe controleer ik de opbouw van het bedrag? | fotoclaimhulp.nl, feitoffake.wordpress.com | Echte kostenbijlage met vijf posten en twee subtotalen, plus controlelijst en bronstatus. |

## Zoekvraaggegevens

Demand Radar `machteloos`, opgeslagen meting van 23 november 2026, Nederlandse markt. Voorbeelden: `opzeggen vriendenloterij` 33.100, `opzeggen vriendenloterij online` 3.600, `opzeggen yourhosting` 170 geschatte zoekopdrachten per maand. Dit zijn schattingen per term; synoniemen overlappen. De eigen dossiers Blendle en ANP hebben in deze themameting geen afzonderlijke volumebasis. Daarom geen hoog zoekvolume voor die dossiers geclaimd en de vraaggerichte bedrijfspagina’s niet verwijderd.

## Uitvoering

- Bestaande canonieke dossieradressen behouden. Antwoord en status bovenaan, bronverantwoording, echte datums en controleerbare kostenopbouw in de HTML.
- Organization/WebSite, Article, Breadcrumb en FAQ beschrijven zichtbare inhoud; geen aggregateRating op basis van externe reviews.
- Vier vaste vragen aangemeld voor de bestaande dagelijkse ZICHT-ronde. Een broncitaat van WAM telt apart van een merkvermelding. De gatscan is geen vergelijkbare nulmeting voor die ronde.
- Index- en AI-opvolging observationeel op 21/28 dagen. Geen causale proefuitslag of gegarandeerde indexering/citaties.
- /llms.txt noemt de dossiers individueel, als lage-prioriteitwegwijzer. Het bestand is geen bewezen SEO-hefboom.
- IndexNow dient zes vaste gewijzigde URLs in na uitrol. Een ontvangststatus is geen indexeringsbewijs.

## Controle en open punt

21 tests, HTML/interne links, router en commentaarcheck geslaagd. Primaire correspondentiedata blijven onderscheiden van onafhankelijke bank- of juridische controle. Geen oorspronkelijke e-mails, klantgegevens, bankgegevens, toegangsgegevens of privéadvies van derden in repo of openbare site.

Directe Search Console-opvraag via de Vercel-tool gaf HTTP401, ook via een concrete deployment. Geen indexering of nulverkeer uit afgeleid. De bestaande ZICHT-meting moet de werkelijke meettoegang vaststellen. Browserweergave niet visueel afgerond: previewserveerder HTTP200, app-openfout en IAB-time-outs.

## Primaire documentatie

- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/appearance/structured-data/article
- https://www.indexnow.org/documentation

Google vermeldt dat voor AI-functies geen speciaal AI-bestand of speciaal schema nodig is; indexeerbaarheid, vindbare nuttige inhoud en bronnen blijven de basis.
