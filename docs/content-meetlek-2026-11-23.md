# Voorstel content en distributie, 23 november 2026

Dit voorstel staat los van de live websites. Publicatie wacht op Henkjans akkoord.

## Eerste lek: de leerlus mist de belangrijkste LC-paperbackklikken

Het dagrapport van vandaag gaat over 22 november UTC. Het toont 7 geregistreerde pagina-openingen op Stocking Books, 13 op Lasting Change en 208 Amazonverzoeken. Deze cijfers zijn geen unieke mensen en bewijzen geen verkopen of conversiepercentage.

De belangrijkste paperbackknoppen op Lasting Change gaan rechtstreeks naar Amazon. Daardoor slaan ze de bestaande /go-telling over. De omslag en vaste balk gebruiken die route al wel. Bovendien vergelijkt de oude lekregel Amazonverzoeken van beide sites met alleen de openingen op Stocking Books.

## Wat je krijgt na akkoord

| Onderdeel | Nu | Voorgestelde correctie |
| --- | --- | --- |
| LC-paperbackknop op home, gidsen en artikelen | Omzeilt de klikmeting | Gebruikt dezelfde meetroute als de omslag |
| Rapport | Naar Amazon: 208 kliks (+208) | Amazonverzoeken: 208 (ruwe redirects, geen unieke personen) |
| Verdeling | Beide sites samen | Bekende Amazonbronregels ook per site |
| Beste pagina's | Twee keer / zonder sitenaam | De sitenaam bij elk pad |
| Automatische conversieconclusie | Deelt gemengde teller door Stocking Books-openingen | Stelt het percentage niet vast zonder gekoppelde klikmeting |

De teksten, prijzen en PDF-betaaltoegang veranderen niet. De PDF-route blijft geblokkeerd door ontbrekende betaal- en mailinstellingen.

## Controle en volgende stap

De regressies dekken de paperbackroute met PDF aan en uit, op de publieke site en in het beschermde voorbeeld. De rapporttests voorkomen dat de genoemde 208 redirects als unieke kliks of als aangetoonde groei worden weergegeven, en dat LC-verzoeken een Stocking Books-lek bepalen.

Uitgevoerd: drie rapporttests en dertien pagina-/linktests geslaagd. Eén bestaande coach-chattest niet uitgevoerd: de lokale bronmomentopname bevat niet alle chatdependencies. De volledige verplichte suite moet in de complete repo slagen vóór een eventuele push naar main.

Na akkoord en uitrol: controle van site en bron binnen 24 uur. Daarna volgt de koppeling per pagina/browseractie, zodat een inhoudelijke proef een bruikbare teller en noemer krijgt. Deze correctie is meetherstel; er is nog geen verkoopeffect aangetoond. Een daaropvolgende inhoudsproef krijgt een controle en beoordeling na 14 tot 21 dagen.

## Dagelijkse taken

| Taak | Curaçao | Publicatie |
| --- | --- | --- |
| Pinterest en leerlus | 15:37 | Conceptbatch, eerst akkoord |
| Lasting Change-artikel en leerlus | 23:41 | Eerst idee, daarna stuk als concept |

De twee nieuwe taken zijn bevestigd actief. De twee oude taken zijn vanuit dit account niet bereikbaar en konden dus niet worden uitgezet. Dat blijft nodig in het oorspronkelijke account om dubbele uitvoering te voorkomen.

## Bestaand artikel om te bekijken

[How to Stop Procrastinating: 7 Steps When Willpower Fails](https://hjdk-api-henq.vercel.app/api/bs?site=lc&p=how-to-stop-procrastinating&concept=1)

Dit bestaande stuk blijft concept en is niet opnieuw geschreven of gepubliceerd.

## Bronnen

- [Overdracht en live stand](https://hjdk-api-henq.vercel.app/api/bs?op=content)
- [Dagrapport zonder verzending](https://hjdk-api-henq.vercel.app/api/bs?op=dagrapport&droog=1)
- [LC-status](https://hjdk-api-henq.vercel.app/api/bs?site=lc&op=gezond)
- Broncode in deze wijziging: lib/lcfunnel.js en lib/bsorganisch.js.
