# KDP: voorspellen, afrekenen en omzet leren

Opdracht Henkjan 28 november 2026: voorspel vandaag en december uit de account- en advertentiedata; zet dit als dagelijkse taak op het dashboard. Leren betekent vinden wat royalty en opbrengst na ads beïnvloedt, en dat voor extra omzet gebruiken.

## Stand en uitvoering

Eén kaart, in Boeken vandaag op https://nexy.now/o. Voor chats: `/oversight?vorm=tekst`; alleen de voorspelling en een nieuwe ronde: `/oversight?voorspel=1`. De bestaande KDP-rondes blijven de bron voor ingelogde Amazon-data. Vercel heeft geen Amazon-login of Ads-API-toegang; een cloudronde presenteert oude cijfers nooit als een verse accountmeting.

De rekenronde draait dagelijks om 08:00 Curaçao (12:00 UTC) zonder betaald taalmodel, via de bestaande mm-route. De controle op ontbrekende/verouderde voorspelling draait ieder uur op :05, uitsluitend met het echte CRON_SECRET. De dagelijkse ChatGPT-taak leest de uitkomst, vult waar mogelijk de echte data aan, benoemt de belangrijkste omzethefboom en zet één toetsbare opvolging in het dashboard. B en D blijven volgens het zuinige ritme uit. A en C worden niet verdubbeld.

## Meting, A en C

Ronde A voedt de afgesloten dag en herleest correcties op dag -3 en -7. Voor elke dag: KDP Reports USD-royalty, netto stuks, per boek en markt waar beschikbaar; datum en tab Today/Yesterday expliciet controleren. Print wordt pas royalty bij verwerking/verzending. Bewaar besteldatum en royaltydatum afzonderlijk wanneer een export ze levert. Een dag kan nog worden herzien, ook na de eerste ochtendmeting.

Amazon Ads: per dag kosten, vertoningen/kliks/aankopen waar beschikbaar; daarnaast per campagne, boek en land met dezelfde meetperiode. Ook gepauzeerde campagnes met kosten tellen mee; noteer als de bron gearchiveerde campagnes uitsluit. Advertentieomzet is de verkoopprijs bij Amazon, geen royalty voor ons. Attributie op klikdag en vertraging mogen geen fictieve royalty of organische groei worden. Dollaromrekening met bron en tijdstip; ontbrekend blijft onbekend. Een native bedrag nooit als USD doorgeven.

Ronde C bewaart alleen de actuele KDP Today-stand en brondata die toch al worden gelezen. Elke bestaande `zet {kdp:...}` bewaart vanaf nu ook een gedateerd snapshot. Die vervangen de eerste dagvoorspelling niet. Geen extra dure rondes.

Voeden via de bestaande beschermde ingang: `/oversight?zet=<URL-gecodeerde JSON>` of POST met de bestaande teamsleutel. JSON:

```json
{"kdpdata":{"dagen":[{"dag":"JJJJ-MM-DD","royalty":12.34,"stuks":4,"afgesloten":true,"munt":"USD","bron":"KDP Reports USD, datum gecontroleerd","gezien":"ISO-8601","per":[{"boek":"stabiele naam","markt":"Amazon.ca","royalty":12.34,"stuks":4}]}],"adsdagen":[{"dag":"JJJJ-MM-DD","kosten":2.34,"aankopen":1,"afgesloten":true,"munt":"USD","bron":"Amazon Ads, land en periode","gezien":"ISO-8601"}],"ads":[{"id":"campagne-id","naam":"campagnenaam","markt":"Canada","van":"JJJJ-MM-DD","tot":"JJJJ-MM-DD","kosten":2.34,"kliks":5,"aankopen":1,"omzet":9.99,"munt":"USD","bron":"Amazon Ads, filter en omrekening","gezien":"ISO-8601"}]}}
```

Hoogstens 100 rijen per verzameling. Oudere waarnemingen kunnen nieuwere niet overschrijven. Een gevalideerde batch wordt pas daarna geschreven. Correcties op royalty blijven als revisies bewaard. Grote batches mogen als `{kdpdata:{gzip:"base64url van gzip(JSON)"}}`, maximaal 30.000 gecodeerde tekens en 1 MB uitgepakt. Geen sleutels of accountdata in Git. Opvragen: `/oversight?voorspeldata=1`, beschermde host. Redis-prefix `kdp:voorspel:`.

## Voorspellen

Hoofdmaat: geschatte KDP-royalty in USD, vóór advertentiekosten. Geen winkelomzet, bankuitbetaling of commissie uit Associates.

Dag: vergelijk gisteren, gemiddeld 3/7/14 dagen, mediaan, recent gewogen tempo en weekdag. Een alternatief vervangt de weekbasis alleen bij minstens 14 vergelijkbare historische toetsen en minstens 10% lagere gemiddelde absolute fout. De dag die voorspeld wordt en toekomstige waarden zitten nooit in de training. Een eenvoudige correctie op advertentiekosten met vertraging 1/2/3/7 dagen wordt pas een kandidaat met minstens 28 trainingsparen; ook die moet de weekbasis buiten de training verslaan. Dit leert voorspelkracht, geen oorzakelijke advertentie-elasticiteit.

De eerste echte voorspelling wordt atomair met SET NX vastgezet, met model, invoertijd en band. Een latere tussenstand is een aparte bijstelling. Er worden geen achteraf verzonnen voorspellingen voor oude dagen aangemaakt. De historische terugtest op later gedownloade exports is duidelijk apart van prospectieve nauwkeurigheid: destijds was nog niet alle exportdata bekend. De band is indicatief en heeft nog geen bewezen kansdekking.

December: schaal de verhouding december/november van vorig jaar per boek met het huidige hele-novembertempo en afzonderlijk met het recente weektempo. Het midden is een expliciete startaanname, geen geleerd optimum. De weekvariant kan de kerstgroei dubbel tellen en is het hoge scenario; het vlakke weektempo geeft het lage scenario. Een verdwenen bestseller krijgt geen automatische terugkeer naar zijn oude niveau. De eerste maandraming blijft vast. Tijdens december komt werkelijk geboekte royalty plus resterende dagen in beeld, met een geleidelijke weging van het actuele weektempo. Daggegevens met een andere definitie, zoals maandaggregaten uit een jaarexport, nooit naar fictieve dagelijkse verkopen verdelen.

## Afrekenen en omzetactie

Iedere ronde vergelijkt eerdere echte voorspellingen met de laatste waargenomen royalty. Morgen is voorlopig; na 3 en 7 dagen opnieuw lezen. Een definitieve score vereist een nieuwe bronwaarneming na minstens 7 dagen. Toon absolute fout, te hoog/te laag, banddekking en de fout van de gelijktijdig bewaarde weekbasis. Leren loopt ook door als de nieuwste dagdata ontbreken. Maandraming op 1 januari voorlopig en op 8 januari met herlezen volledige decemberdata afrekenen.

Rangschik per boek en land: aandeel in royalty, netto bijdrage na ads, conversie per zoekwoord/campagne, prijs en royalty per exemplaar, beschikbare druk/edities, weekdag, seizoen en rang. Een correlatie of een goede voorspeller is geen bewijs van extra omzet. Leg eerst drie mogelijke acties naast elkaar; kies de grootste verwachte extra royalty na extra kosten per inzet. Voer één meetbare wijziging uit binnen het actuele mandaat, met vergelijkbare controle en een oordeel na voldoende data. Niet tegelijk prijs, bod en doelgroep wijzigen. Bescherm de bestaande winnaars en gebruik de laatste grenzen uit de korte KDP-overdracht (Teens, PIT BOSS en overige boeken hebben verschillende grenzen). Geen extra advertentiebudget omdat het model een hoog scenario toont.

Controle: `node --test scripts/test-kdp-voorspel.mjs`, ook in de rooktest. Test datum/valuta/ontbrekende waarden, toekomstige data, oorspronkelijke voorspelling, bronrevisies, maandverdeling en HTML-escaping. Dagelijkse taak en rapportage op het bestaande KDP-dashboard; elke uitkomst met bron en datum in het werklog.
