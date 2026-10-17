# Verspreidingsplan keuzehulpen — 17 oktober 2026

## Doel en stand

De koop-, prijs- en voorraadvragen staan op de bestaande NL-, US- en DE-keuzehulpen. Gebruik één inhoudelijke bestemmingspagina per koopvraag, met winkelopties en brongegevens. Maak geen kopiepagina voor elke formulering van dezelfde vraag. Een specifieke modelpagina verdient pas een eigen URL wanneer die extra gecontroleerde informatie geeft: bijvoorbeeld verschillende verkopers, uitvoeringen of werkelijk beschikbare voorraad. De voorpagina uit concept-PR #1 blijft een apart voorstel.

De gecontroleerde Pinterest-API in dit project meldt geen app-configuratie en geen verbonden account. Het eigen project kan daarom nog geen geslaagde nieuwe Pinterest-publicatie aantonen. Eerder gemeten Pinterest-verkeer kan uit bestaande pins of een RSS-koppeling komen; de status daarvan is niet bevestigd. Instagram, X en overige kanalen zijn in deze opdracht een plan, geen opdracht om daar nu berichten te plaatsen.

## Hoeveel pins per keuzehulp?

Pinterest noemt geen ideaal aantal per bestemmingspagina. Het platform adviseert originele, relevante inhoud, regelmatig nieuwe pins en het vermijden van duplicaten. Het adviseert uitdrukkelijk inhoud boven een vast aantal per week. Drie is daarom onze toetsbare startkeuze, geen platformregel of bewezen omzetoptimum.

Voor elke levende keuzehulp staan drie concepten klaar via /api/distributie:

1. **Keuzevraag:** de bestaande hoofdvraag en de belangrijkste echte vragen uit de gids. Eigen overzichtsbeeld.
2. **Situatie of afweging:** de eerste inhoudelijke vraag met de bijbehorende opties. Als de gids geen vragen heeft, een voorzichtig geformuleerde vergelijking op gebruik, eigenschappen en kosten. Ander beeld en andere tekst.
3. **Kopen:** waar kopen, prijs controleren en voorraad/levering bevestigen. Verwijst naar de bijgewerkte gids. Derde beeld; geen verzonnen voorraad en geen snel verouderende prijs op de pin.

Alle concepten hebben een eigen 1000 × 1500-beeld, titel, beschrijving, bordvoorstel en URL met bron-, campagne- en conceptcode. De data wordt uit de eigen actuele catalogus opgebouwd, inclusief handmatige gidsen. Nieuwe levende gidsen krijgen dezelfde drie concepten. Toekomstige gidsen blijven buiten de export. Dit zijn klaarstaande concepten en openbare beeld-URL's, geen bewijs dat ze al op Pinterest staan.

**Proef:** kies eerst tien inhoudelijk sterke gidsen per markt. Test concepten bijvoorbeeld op dag 0, 7 en 21. Begin met maximaal drie nieuwe pins per dag per taalprofiel. Dit tempo is een voorzichtige eigen proef; het is geen officiële limiet. Controleer na 28 dagen de daadwerkelijke uitgaande kliks en downstreamgebruik, en bekijk na 56 dagen opnieuw. Geef winnaars hooguit twee extra inhoudelijke concepten, zoals een echte maatvraag of aantoonbaar relevant seizoen. Een andere kleur of hetzelfde beeld met een andere titel is onvoldoende reden voor extra pins.

De hele bibliotheek voorbereiden is iets anders dan alles tegelijk publiceren. Geef bewezen onderwerpen voorrang en bouw de publicatierij geleidelijk op. Een vast publicatietempo kan lager zijn dan de aanwas van nieuwe gidsen; beloof daarom geen datum waarop elke gids drie gepubliceerde pins heeft zonder beschikbare accountcapaciteit te meten. Houd per gids en concept de echte Pinterest-ID bij zodra er daadwerkelijk gepubliceerd wordt. Bij een onzekere API-respons eerst controleren, niet blind opnieuw plaatsen.

**Exports:** /api/distributie?op=manifest&site=nl|us|de geeft alle concepten. /api/distributie?op=csv&site=nl&offset=0&limit=30 geeft een CSV in het officiële Pinterest-formaat, maximaal 200 rijen per bestand. Publicatiedatums zijn leeg: een upload in Pinterest publiceert zulke rijen direct. Vul eerst de gewenste datums in voor een gespreide proef. Er wordt niets naar Pinterest verstuurd door het openen van deze projectpagina.

## Kanalen: voorstel voor de eerste vier weken

Deze aantallen zijn testinstellingen per actief taalprofiel, geen algemeen bewezen beste frequenties. Start niet automatisch alle kanalen en talen tegelijk. Gebruik eigen bestaande accounts, lokale teksten en de bijbehorende landsite.

| Prioriteit | Kanaal | Inhoud en starttempo | Route naar keuzehulp |
| --- | --- | --- | --- |
| 1 | Pinterest | Drie concepten per gids klaarzetten; start met maximaal drie verse pins per dag. | Iedere pin naar de specifieke gids, met eigen meetcode. |
| 1 | Instagram | Drie carrousels en twee korte video's per week, op basis van de beste gidsen. Bijvoorbeeld probleem → drie afwegingen → conclusie. | Storylink waar het account die ondersteunt; anders een duidelijke profielroute naar de specifieke gids. Pas beeldverhouding aan: een Pinterest-beeld is niet automatisch een goede Instagram-post. |
| 1 | X | Eén zelfstandig nuttige tip per dag en twee inhoudelijke draadjes per week. Bijvoorbeeld de beslissende eigenschap met een uitleg waarom. | Eén relevante gidslink. Geen herhaalde identieke posts, ongevraagde automatische mentions of replies. Lees vóór uitvoering ook de bestaande X-projectoverdracht, zodat er geen dubbele publicatielus ontstaat. |
| 2 | Facebook | Drie nuttige beeldposts per week op eigen pagina's; hergebruik een Instagram-concept met eigen tekst. | Specifieke gidslink. Groepen alleen waar het onderwerp en de groepsregels het toelaten. |
| 2 | YouTube | Eén uitlegvideo per week plus twee afgeleide Shorts. Laat een keuze of berekening echt zien. | Via relevante langere video en kanaalprofiel. Reken niet op klikbare gewone URL's in Shorts-beschrijvingen of -reacties. |
| 2 | Eigen e-mail | Benut de bestaande toegestane dagelijkse keuzehulpmail. Geef de winnaar uit social extra aandacht wanneer die bij de inhoud past. | Specifieke gids en bestaande meetcodes. Geen nieuwe mailing naar mensen zonder bestaande toestemming. |
| 3 | Threads en Bluesky | Twee eigen, nuttige korte bijdragen per week per gekozen platform. | Relevante gidslink; meet of deze kanalen echt gebruikers aanleveren. |
| 3 | TikTok | Twee uitlegvideo's per week als het videowerk al gemaakt wordt voor Instagram. | Controleer eerst welke profiel-/linkmogelijkheden het echte account heeft. |
| Selectief | Reddit, Quora, communities | Alleen inhoudelijke antwoorden bij bestaande relevante vragen, volgens de lokale regels. Geen automatische linkdistributie. | Alleen een gidslink wanneer die het antwoord aantoonbaar aanvult en is toegestaan. |
| Selectief | LinkedIn | Eén bijdrage per week voor zakelijke onderwerpen, bijvoorbeeld domeinnaamkeuze of laadbeleid. | Zakelijke relevante gids. Consumentencadeaus niet willekeurig op dit netwerk verspreiden. |
| Productfunctie | WhatsApp | Maak de gids, uitkomst of een compacte vergelijking eenvoudig deelbaar door de bezoeker zelf. | Delen naar specifieke gids of antwoordroute; geen automatische massaberichten. |

## Meten en verbeteren

Gebruik in iedere link utm_source, utm_medium=organic_social, utm_campaign=guide-[slug] en een herkenbare utm_content voor kanaal, formaat en invalshoek. Pinterest-concepten hebben deze al. Meet per kanaal en markt: platformvertoningen, saves/engagement, uitgaande kliks, binnenkomende paginaweergaven, gestarte keuzehulpen, bekeken adviezen, winkelkliks en waar beschikbaar bevestigde affiliate-opbrengst. Houd platformkliks en eigen paginaweergaven apart. Een verwijzer kan ontbreken; een winkelklik is geen aankoop.

De bestaande koopblokmeting telt weergaven en kliks van het koopblok per markt en UTC-dag. Die is geen volledige meting per sociaal concept. De FP-trechter uit concept-PR #1 is bovendien nog niet live. Claim daarom geen volledig gekoppelde omzetmeting of automatische optimalisatie per concept voordat die koppeling is gebouwd en gecontroleerd. Behoud bestaande affiliate-tags en route-sub-ID's; gebruik nooit een persoonlijke identifier waar het partnerprogramma dat verbiedt.

Wekelijks: sorteer op nuttig vervolggebruik per werkelijk bezoek, niet alleen bereik. Bekijk waar mensen uitvallen. Veel bereik zonder sitebezoek vraagt om een betere belofte/linkroute. Veel bezoeken zonder antwoorden vraagt om betere aansluiting tussen post en gids. Veel winkelkliks zonder aankopen vraagt om betere productmatch, aanbod of meetcontrole. Werk de gids eerst inhoudelijk bij en maak daarna pas nieuwe varianten. Behoud een deel van de publicatieruimte voor nieuwe onderwerpen, zodat dezelfde vroege winnaar niet alle kansen krijgt.

## Uitvoering

1. Controleer bestaande Pinterest-account/RSS-koppeling en leg vast welk account bij welke taal hoort. Koppel de officiële API voordat de publicatiemotor wordt aangezet; haal geen geheime sleutels naar de chat.
2. Controleer tien gidsen per markt inhoudelijk en visueel, waaronder de drie verschillende pinconcepten. Vermijd oude publicaties opnieuw te plaatsen; controleer bestaande Pinterest-ID's of importlog.
3. Begin met de beperkte Pinterest-proef. Publiceer Instagram en X pas na controle van de bestaande accounts en de al lopende X-lus.
4. Na twee weken: controleer of bezoekers en vervolggebruik meetbaar zijn. Na vier weken: beoordeel inhoud en kanalen. Schaal winnaars, niet automatisch de hele bibliotheek. Beoordeel Pinterest ook na acht weken omdat pins langer kunnen doorwerken.

## Bronnen

- Pinterest, kwaliteit, distributie en duplicaten: https://help.pinterest.com/en/business/article/pin-performance-and-distribution
- Pinterest, inhoud boven een vast aantal: https://business.pinterest.com/tl/blog/how-to-build-audience-pinterest/?change_language=true
- Pinterest, bulk-CSV en publicatiedatums: https://help.pinterest.com/en/business/article/bulk-upload-video-pins
- Pinterest, creatieprincipes en 2:3-beelden: https://create.pinterest.com/fundamentals/
- X, automatiseringsregels: https://help.x.com/en/rules-and-policies/x-automation
- YouTube, welke links klikbaar zijn: https://support.google.com/youtube/answer/13748639

Onderzoek en accountcontrole: 17 oktober 2026. De voorgestelde aantallen en intervallen zijn onze hypotheses; de bovenstaande bronnen bewijzen geen universeel optimum per gids.
