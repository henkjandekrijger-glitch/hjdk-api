# Kadoly groei, maandag 23 november

Eerste ochtendronde. Bronnen gelezen tussen 11:58 en 12:10 UTC. Kanaaltotalen zijn cumulatief sinds 16 november, geen weekcijfers. De nulmeting staat in `kadoly/groei/2026-11-23.json`.

## Uitkomst

| Kanaal | Geregistreerde kliks | Echt mens | Actie | Mandje |
| --- | ---: | ---: | ---: | ---: |
| Facebook | 33 | 9 | 2 | 1 |
| Gids | 6 | 1 | 1 | niet geregistreerd |
| Pinterest | 3 | niet geregistreerd | niet geregistreerd | niet geregistreerd |

Er is geen organische koop geregistreerd. De organische kooproute is daarmee nog niet bewezen. Gisteren, 22 november, registreerde Facebook 7 uitgaande kliks. Opt-ins per kanaal of motor en een betrouwbare weekvergelijking ontbreken. Ontbrekend is geen gemeten nul.

De algemene TikTok-route heeft 2 betaalde bestellingen voor samen € 91,36 in Clickmind. De laatste echte koopmelding is van 19 november, iDEAL, € 52,91, bron shop. Er is geen proefbestelling geplaatst en geen conversie nagemaakt. De 2 gemeten TikTok-kopen bewijzen niet dat alle 5 betaalde regels uit de shopfeed correct zijn toegeschreven. De verschillen blijven bij de shop ter controle.

De gidsproef rapporteert cumulatief 391 productkliks, 7 afrekenmeldingen en 5 betaalstarts zonder geregistreerde koop. Dit zijn geen 391 bewezen unieke mensen. Dat er inmiddels echte TikTok-kopen worden gemeten, rechtvaardigt nog geen conclusie over de oorzaak bij gidsverkeer.

Bronnen: [organisch](https://hjdk-api-henq.vercel.app/api/shop?op=orgstand&dagen=7), [trechter](https://hjdk-api-henq.vercel.app/api/shop?op=trechter), [betaalmeldingen](https://hjdk-api-henq.vercel.app/api/shop?op=koopcheck&px=1), [gidsproef](https://hjdk-api-henq.vercel.app/api/gids?op=stand&dagen=7).

## Grootste lek: toegang tot de shop controleren

De volledige browserheader krijgt HTTP 200 op home en robots.txt. De volledige Pinterest-header ook. De volledige Google-, Bing- en Facebook-previewheaders krijgen op beide paden HTTP 403 met een CloudFront-foutpagina. Aanvragen met OAI-SearchBot, ChatGPT-User, Twitterbot en Applebot kregen op home eveneens 403; PerplexityBot en ClaudeBot kregen 200.

Dit zijn aanvragen met nagebootste user-agents vanaf één verbinding. Ze bewijzen geen blokkade van de echte, geverifieerde crawler-IP's. Een 403 van CloudFront identificeert op zichzelf ook geen specifieke WAF-regel. De eerdere algemene uitspraak dat Pinterest nog steeds geblokkeerd is, is niet als actuele zekerheid overgenomen.

### Concrete opdracht voor de beheerder, nog niet uitgevoerd

1. Bekijk CloudFront- en WAF-logs rond 23 november 12:09 UTC. Zoek `/`, `/robots.txt` en de betreffende user-agents. Noteer `action`, `terminatingRuleId`, rule group en verificatielabels. Geen volledige logs of bezoekersgegevens in dit openbare document plaatsen.
2. Controleer met echte Google- en Bing-inspectietools of geverifieerde crawlers dezelfde fout krijgen. Controleer ook één productpagina en de Pinterest-feed; home alleen is onvoldoende.
3. Pas uitsluitend de gevonden botblokkade aan voor geverifieerde zoek- en previewbots op openbare cataloguspagina's. Geen algemene toelating op alleen de tekst in een user-agent. Account-, bestel- en betaalroutes blijven afgeschermd.
4. Als AWS Bot Control al actief is, kan een uitzondering op bestaande verificatielabels passend zijn. AWS schrijft voor dat een labelregel na de Bot Control-groep komt, omdat het label anders nog niet bestaat. De exacte positie hangt af van de werkelijke blokkerende regel. Niet blind een Allow vóór alle controles zetten.
5. Pas na verificatie: Pinterest-claim/catalogus hervatten, sitemap bij Bing indienen en gewijzigde pagina's via IndexNow melden. De middagronde controleert opnieuw wat aantoonbaar is hersteld.

Dit is een beheerdersvoorstel, geen kant-en-klare universele configuratie. Bron: [AWS, explicitly allowing verified bots](https://docs.aws.amazon.com/waf/latest/developerguide/waf-bot-control-example-allow-verified-bots.html), gelezen 23 november 2026.

## Klaargezet voor de bestaande rondes

De gids- en socialopdracht krijgen een concrete voorrangslijst voor 23 tot 29 november. Bestaande gidsen aanscherpen voordat een overlappende pagina wordt gemaakt. De bestaande Demand Radar-cache is van 19 november. Deze brede cadeau-cache bevat geen exacte zoektermen voor lootjes, Secret Santa of cadeau 20 euro; daarvoor is vandaag geen zoekvolume geclaimd en niets bijgekocht.

1. Schoencadeautjes en de bestaande kerstcadeaupagina: actuele totaalprijs, passende ontvanger en echte leverinformatie. Een besteldatum pas noemen na controle per merk.
2. Secret Santa en cadeau collega binnen € 20 of € 25: eerst huidig aanbod inclusief verzending controleren, daarna één passende bestaande gids uitbreiden of één echte nieuwe vraag behandelen.
3. Redactie: controleer Black Friday-prijzen en de gevolgen van vroeg kopen voor retour. De tegenstelling tussen het eigen retourbeleid op verschillende winkelpagina's eerst aan de shop voorleggen; niets als opgelost publiceren.

Facebookvorm `v-kerstfinds` heeft één echt mens, één actie en één mandje bij één geregistreerde klik. Dat is een vervolgsignaal, geen winnaar. Soortgelijke reeds goedgekeurde video's mogen vervolg krijgen zonder de frequentie of het Pinterest-plafond te verhogen. Bereik en nieuwe borden zijn deze sessie niet live gecontroleerd, omdat Zernio niet beschikbaar is; de bestaande socialronde blijft daarvoor verantwoordelijk.

De gids heeft volgens de stand van 23 november 6 geïndexeerde pagina's uit 68 bekeken sitemapadressen. Het Perplexity-panel heeft 8 beantwoorde vragen zonder citaat van de gids. Crawlerbezoek is geen bewijs van een AI-vermelding. Bron: [ZICHT](https://hjdk-api-henq.vercel.app/api/zicht?op=stand&site=kadolygids).

## Nieuw om eerst te bekijken

[Lootjesconcept](kadoly-lootjes-concept.html): groep met voornamen, budget en datum, eigen lootje openen en een wens invullen. Het bestand werkt alleen als lokaal voorbeeld. Geen echte groep, mail, tracking, bestelling of openbare route. Uitsluitingen, geheime links met toegangscontrole, automatisch wissen en echte productsuggesties worden pas na akkoord gebouwd. De datum 25 november uit het plan is een streefdatum, geen toegezegde livegang.

## Weekbalans en vervolg

Week 1 begint vandaag. Doel: 150 echte bezoekers en 30 adressen met toestemming. De huidige cumulatieve bron levert nog geen vergelijkbare weekstand, adresuitsplitsing of week-op-week-pijl. Daarom is dit de startmeting; meer of minder tijd per motor pas na voldoende vergelijkbare waarnemingen. Nog geen vorm voldoet aantoonbaar aan de vereiste vijf stuks voor opschalen.

Vandaag: meetbeperkingen vastgelegd, bottoegang onderzocht, koopmeting gecontroleerd, gids- en socialprioriteiten klaar, lootjesconcept ter beoordeling. Middag: reactie beheerder verwerken en herstel controleren; bestaande redactie/socialronde volgen. Morgen: voortgang bottoegang en betaalattributie opnieuw controleren, snapshots vergelijken en bij akkoord het lootjesconcept verder uitwerken.

De twee taken zijn actief om 05:43 en 13:43 Curaçaose tijd. Pushinstellingen zijn via deze tools niet instelbaar of uitleesbaar. De taken zijn actief, push staat niet als bevestigd aan geregistreerd.

Henkjan heeft bevestigd dat Tim de CloudFront/WAF-configuratie beheert en gevraagd een bericht voor hem te maken. Dit concept is in de chat getoond en niet verstuurd:

> Hoi Tim, kun je de bottoegang van kadoly.com nakijken? Rond 12:09 UTC kregen aanvragen met Google-, Bing- en Facebook-botheaders een CloudFront 403. Browser en Pinterest kregen 200. Dit waren nagebootste headers, dus graag in de logs controleren of echte crawlers ook worden geraakt en welke regel dat veroorzaakt. Kun je een eventuele blokkade voor geverifieerde zoekbots en linkvoorvertoningen gericht herstellen? Graag ook één productpagina en de Pinterest-feed controleren. Dank!

Vervolg wacht op Tims log-/inspectie-uitkomst. De opdracht was een bericht maken, geen verzendopdracht.
