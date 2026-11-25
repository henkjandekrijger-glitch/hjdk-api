---
name: "leerlus"
description: "Gebruik bij het bouwen, instellen of bijsturen van een zelflerende leerlus op een site, funnel, mailreeks of campagne: van bezoek naar echte verkoop, volledig automatisch in de cloud."
---

# Leerlus: van bezoek naar verkoop

Doel: een site, funnel, mailreeks of campagne die zichzelf verbetert tot hij echt verkoopt. Zonder Henkjan, zonder Claude-account, zonder zijn laptop.

## Altijd zo gebouwd
- Draait in de cloud op Vercel (cron of route). Nooit afhankelijk van een Claude-sessie of een lokale machine.
- Sleutels en postbacks staan als gedeelde team-variabelen in Vercel. Vraag nooit een sleutel in de chat.
- De agenten in de lus roepen zelf een taalmodel aan met de sleutel uit Vercel.
- Eigenaarspagina (bijv. /leer of /status): stand, wat de lus deed en waarom, en de lessen. Henkjan krijgt een link, geen spreadsheet.
- Bij "bouw": zelf bouwen, deployen, live controleren en de eerste ronde draaien.
- Elke lus heeft een signaalcheck die elk uur draait (zie hieronder). Zonder signaalcheck is een lus niet af.

## Signaalcheck (elk uur)
Een lus kan blind worden zonder dat iemand het ziet: hij draait, meldt cijfers, maar leert niets. Voorbeeld todayin, 11 tot 13 okt: de campagnes boden per conversie, maar Mondiad kreeg alleen een seintje bij een aanmelding, en die kwam bijna nooit. Mondiad kocht restverkeer: 95% van de kliks uit één zone, 4% echte mensen, 0 aanmeldingen op 825 bezoeken. Twee dagen lang zag niemand het.
Daarom controleert elke lus elk uur, over de laatste 2 dagen, per netwerk:
- **A. Krijgt het netwerk een signaal?** 100 of meer betaalde bezoeken en 0 conversies gemeld aan het netwerk: alarm. Een CPA-netwerk zonder conversies leert niets.
- **B. Komen de conversies aan?** Elke door het netwerk geweigerde postback: alarm.
- **C. Zijn het mensen?** 200 of meer bezoeken en minder dan 5% echte mensen: alarm.
- **D. Is de inkoop breed genoeg?** 60% of meer van de echte mensen uit één zone: alarm.
- **E. Kunnen we per zone rekenen?** Een zone- of campagnecode die niet is ingevuld (bijv. "zoneid", "{zoneid}", "[zoneid]"): alarm.
- **F. Ligt het aan de pagina?** 30 of meer echte mensen en 0 aanmeldingen: alarm.
Een nieuw alarm wordt meteen een klus met voorrang voor de uitvoerder en staat bovenaan de eigenaarspagina. De uitvoerder lost het zelf op; alleen als iets van Henkjan nodig is, gaat het naar hem.
Voorbeeld van de bouw: lib/lessen.js in de repo henkjandekrijger-glitch/todayin (alarms(), elk uur vanuit de cron), te lezen op /api/ti?lessen=1&t=1.

## Meetlat
- Hoofdgetal: netto omzet (na terugbetalingen en geschillen) per 1.000 echte bezoekers, naast wat 1.000 echte bezoekers aan advertenties kosten. Is het geld indirect (affiliate, lead), dan het eerste getal dat geld voorspelt, bijv. kosten per klik naar de winkel.
- Echte bezoeker = JavaScript draait plus interactie. Bots en fouten uit in-app-browsers eruit filteren.
- Elke trechterstap gemeten per bron, zone, land, apparaat, taal, variant en prijs. Per stap: nu, streef, minimum voor een besluit.
- Een variant stopt bij minder dan 5% kans de beste te zijn en wint boven 95%. Daartussen blijft hij draaien.
- Tot 20 verkopen tellen tussenstappen mee, gewogen naar hoe dicht ze bij betalen zitten. Daarna alleen omzet per bezoeker.
- Zeldzame verkoop (abonnementen): per ronde sturen op de tussenstappen, per week op verkoop.
- Te weinig data: niets wijzigen en dat melden.
- Geen trackers van derden. Geen IP-adres of mailadres in de telling.

## De ronde
Start bij 150 nieuwe echte bezoekers, nooit vaker dan eens per uur. 's Nachts alleen controle en lessen.
1. **Meten.** Alle stappen, plus kosten uit de advertentienetwerken. Eerst de signaalcheck: staat er een alarm, dan dat eerst.
2. **Lek kiezen.** Verkoop: de stap waar het meeste geld verloren gaat (hoeveel extra verkopen als alleen die stap zijn streef haalt). Verspreiding: de stap met de grootste vermenigvuldiger op de virale factor (zie Virale flow en frictie). Alleen daar wordt gewerkt.
3. **Oorzaak zoeken.** Eerst techniek en meting (komt het signaal aan, fout, traag, knop werkt niet op iOS), dan frictie (zie UX en frictie), pas dan tekst of psychologie.
4. **Voorstellen.** Zes rollen doen elk één voorstel voor dat lek.
5. **Kritiek.** Elke rol scoort de anderen van -2 tot +2: past het bij het lek, is het eerlijk, is het nieuw, hoeveel extra verkoop.
6. **Besluit.** Een voorzitter kiest maximaal twee wijzigingen. Nieuwe varianten krijgen eerst 20% van het verkeer op die stap.
7. **Uitrollen.** Tekst, volgorde, aanbod en nieuwe ingangen direct live. Code via tests en automatische deploy; faalt een test, dan gaat er niets live.
8. **Beoordelen.** Na het minimum: beter blijft en krijgt meer verkeer, slechter gaat terug, twijfel meet langer.
9. **Leren.** Elke beoordeelde wijziging wordt één les ("op Android werkt X niet"), gelabeld met het principe erachter. De lessen sturen de volgende voorstellen. Lessen over campagnes gaan ook naar de dagelijkse campagnelessen (/campagnes-henkjan).

## De zes rollen
Data-analist, koperpsycholoog, gedragseconoom, producent (tests, games, content, advertenties), mediabuyer, techneut. Plus een voorzitter die besluit.

## Hefbomen
De lus draait aan alles wat verkoop raakt, niet alleen aan teksten:
- **Verkeer:** bron, zone, land, apparaat, uur van de dag.
- **Advertentie:** belofte, toon, beeld.
- **Product:** welke tests, tools of pagina's er zijn; nieuwe maakt de lus zelf.
- **Flow:** aantal stappen, één tik per stap, voortgang, laadsnelheid.
- **Uitslag of waarde-moment:** wat gratis is, wat achter betalen zit, hoe het onthuld wordt.
- **Aanbod:** los, bundel, extra's.
- **Prijs:** hoogte, anker, lokprijs, eigen munt, inclusief btw (alleen als prijs in dit project mag bewegen).
- **Checkout:** betaalmethoden (Apple Pay, Google Pay bovenaan), overlay of eigen pagina, e-mail vooraf.
- **Vertrouwen:** geld-terug-belofte, wie de verkoper is, voorbeeld van wat je krijgt.
- **Taal:** browsertaal, per land meten.
- **Terugkomst:** mail, tweede aankoop, delen met een vriend, herinnering.
- **Mail:** onderwerpregel, openingszin, tijdstip.
- **Techniek:** fouten per 100 bezoekers, snelheid.

## Psychologie per stap
Elke variant noemt het principe, zodat lessen per principe optellen.
- **Advertentie naar klik:** nieuwsgierigheidskloof, identiteit ("wie ben ik").
- **Landing naar start:** nulprijs, kleine eerste stap (direct beginnen, geen startknop).
- **Start naar afgemaakt:** doelgradiënt, voortgang die al op 20% begint, open lus, tussenbeloning halverwege.
- **Afgemaakt naar betaalscherm:** IKEA-effect, bezit ("jouw uitslag", op naam, half zichtbaar).
- **Betaalscherm naar klik:** verliesaversie, autoriteit, vergelijking met echte aantallen.
- **Prijs:** anker, lokprijs, mentale boekhouding ("minder dan een koffie").
- **Klik naar betaald:** minder frictie, vertrouwen, commitment (al e-mail gegeven).
- **Na de koop:** wederkerigheid, delen uit trots.
- **Delen naar openen:** persoonlijke inzet in het bericht (uitdaging, open uitslag, nog x nodig), sociale vergelijking, iets dat pas compleet is met de ander (drempel, groepsuitslag).

## Virale flow en frictie

Voor alles wat zich via mensen moet verspreiden (doorsturen, delen, uitnodigen). Henkjan, 14 okt 2026.
- **Flowkaart eerst.** Teken elke stap van eerste bezoek tot de tweede generatie. Per scherm leg je vast wie het ziet (maker, ontvanger, gever, terugkeerder) en wat die net deed.
- **Per stap meten, alleen echte mensen.** Meet ook de onzichtbare stappen:
  - tik op delen;
  - de app ging echt open;
  - kwam binnen 6 seconden terug (dus niet verstuurd);
  - de linkvoorbeeld-bot haalde de pagina op (dus echt in een chat geplakt);
  - een vriend opent;
  - de vriend doet de actie;
  - de vriend maakt zelf iets (generatie 2).
- **Hoofdgetal:** nieuwe makers per maker (virale factor) en echte doorstuurders per 100 makers, per generatie.
- **De virale factor is een product van stappen** (speler, begint, maakt af, tikt delen, echt verstuurd, vriend opent, vriend doet mee). Daarom kiest de lekzoeker (lib/flowlek.js in todayin/spel) niet de stap met het laagste percentage, maar de stap waar de virale factor het meest stijgt als alleen die stap zijn streef haalt (virale factor nieuw gedeeld door nu), met minstens 20 keer basis. Bij gelijke winst telt de stap die het verst onder zijn streef zit.
- **Startstreefwaarden** tot er eigen data is: beginnen 40% van echte bezoekers, afmaken 70%, delen tikken 30% van wie afmaakt, echt verstuurd 70% van de tikken, 1 of meer vriend-opens per verstuurd bericht in groepsapps, vriend doet mee 60%. Haalt een variant meer, dan wordt dat de nieuwe streef.
- **Reken de virale factor op generatie 2 en verder.** Betaald verkeer (generatie 1) is alleen de vonk en deelt anders dan vrienden. Meet ook per kanaal (WhatsApp, Telegram, sms, kopieer) en per land: een lek kan in één kanaal zitten, bijvoorbeeld de voorvertoning in WhatsApp.
- **Vergelijk formats op de virale factor en op kosten per nieuwe speler via delen**, niet op kosten per klik. Een format gaat pas uit na minstens 150 echte spelers zonder enig doorsturen.
- **Melden:** het lek en de cijfers staan op de eigenaarspagina. Naar Henkjan gaat hoogstens elke 4 uur één stand, en alleen met wat er bewoog (Henkjan, 15 okt: geen uurstanden die niets zeggen).
- **Frictie weg, standaard.** Elk veld, elke extra tik en elk tussenscherm moet zich bewijzen met cijfers, anders gaat het eruit. Vraag nooit wat al bekend is (de afzender in een groepsapp is bekend, dus geen naamveld).
- **Delen zonder tussenstap.** Op mobiel direct de app openen (whatsapp://, tg://). Ging de app niet open, na 1,6 seconden terugvallen op de weblink. Kwam iemand meteen terug, dan direct "niet verstuurd? kopieer de link" tonen.
- **Controle op logica.** Voor een scherm live gaat, toetst een aparte rol: klopt dit voor iemand die net deze stap deed? Nooit "je kunt alleen geven" tonen aan iemand die net iets kreeg.
- **Het deelplaatje is het product in de chat.** Werk met een pool van stijlen in vormen die bewezen rondgaan: award- en medaillekaarten, "welke ben jij"-rasters, jaaroverzicht-kaarten, oorkondes. Zelf gemaakt, nooit plaatjes van anderen. Per link één stijl, gekozen met een bandit op vriend-opens per keer delen.
- **Elke ronde:** werk aan het grootste lek, met twee nieuwe varianten op 20% van het verkeer. Een variant gaat eruit onder 5% kans de beste te zijn en wint boven 95%.

## UX en frictie: de lus lost het zelf op

Henkjan, 14 okt 2026: UX- en frictieoplossers gaan automatisch mee, in elk project. Wat hij over één scherm zegt, wordt een regel voor alle schermen.
- **Elke pagina meet zichzelf**, alleen echte mensen:
  - hoe ver ze scrollen;
  - waar ze tikken, en tikken op iets dat niets doet;
  - drie keer snel op dezelfde plek tikken;
  - tijd tot de eerste actie;
  - wat er in het eerste scherm staat.
- **Opties sorteren zichzelf.** Elke keuze, knop of chip heeft een vaste naam. Tel per optie: gezien door een echt mens, getikt, en daarna de actie gedaan. De meest getikte gaan vanzelf naar boven, en één plek blijft vrij om een nieuwe optie te proberen. Eén tik telt nauwelijks, pas tientallen tellen zwaar. Voorbeeld: lib/lpzoek.js in todayin, met een zoekveld en logische opties bovenaan (stand op /api/ti?lpostats=1).
- **Logische opties, niet zomaar populaire.** Een klein model kiest eenmalig per pagina de logische opties uit de hele catalogus en bewaart die 30 dagen. Nooit opties voor een andere plaats, en geen rare eenmalige onderwerpen.
- **Frictielijst die automatisch keurt.** Elke nacht en vóór elke deploy keurt een script elke landingspagina op telefoonformaat. Het zoekt naar:
  - een merkbalk of logo bovenaan dat ruimte kost zonder te helpen;
  - meer dan zo'n 25 woorden boven de eerste actie;
  - een eerste actie die niet in het eerste scherm staat;
  - een veld dat al bekend of niet nodig is (naam, plaats die we al weten);
  - een los label of woord dat er verloren bij staat;
  - delen zonder directe app-link;
  - een knop die op iPhone of in een in-app-browser niet werkt;
  - tekst die niet klopt voor wie het scherm ziet.
- **Fout gevonden?** De lus zet de oplossing als variant live op 20% van het verkeer. Beter blijft, slechter gaat terug.
- **Lekzoeker kiest de volgorde.** Het grootste lek krijgt eerst een oplossing uit de frictielijst, pas daarna tekst of psychologie.
- **Elke opgeloste frictie wordt een regel** in de frictielijst, zodat geen project hem ooit nog heeft. Een opmerking van Henkjan ("te veel tekst bovenin", "naamveld is drempel") gaat meteen in de lijst en wordt in alle projecten toegepast.

## Zelf nieuwe ingangen maken
Om de drie dagen maakt de lus één nieuwe test, game, tool of pagina:
1. **Bedenken:** onderwerp uit wat werkt en wat mensen zoeken, geschreven als data.
2. **Controleren:** een tweede rol speelt hem tien keer door. Kloppen de uitkomsten, is hij op mobiel binnen 2 minuten klaar, staat er niets onwaars in.
3. **Starten:** 10% van het verkeer, alleen overdag.
4. **Beoordelen:** na 150 starts tegen de beste bestaande. Slechter uit, beter meer verkeer en een eigen advertentie.

## Verkeer
- Altijd CPA met postback per netwerk (Mondiad, PropellerAds, Clickadu, RichAds).
- De conversie die het netwerk krijgt is een vroege stap: het eerste echte mens (een bewuste aanraking op de pagina, eenmaal per klik, met een token dat de server maakt). Verkoop of aanmelding is het tweede doel en wordt apart gemeten. Alleen de verkoop als conversie geven maakt het netwerk blind (signaalcheck A).
- Elke link draagt netwerk, campagne, zone en creatief, zodat de lus per bron kan rekenen. Controleer na de start dat de codes echt ingevuld binnenkomen (signaalcheck E).
- De lus mag zones uitsluiten en advertenties wisselen. Bod en budget alleen binnen een dagplafond dat Henkjan per project vastzet.

## Vangrails
- Alleen verkopen met wat waar is. Geen verzonnen aantallen, reviews of aftelklokken. Geen verborgen abonnement.
- Per project vastleggen wat de lus nooit aanraakt. Standaard: juridische pagina's, elk cijfer met bron, beloftes die niet gedaan mogen worden, verplichte mailvoettekst, landenregels voor koude mail.
- Maximaal 2 wijzigingen per ronde en 10 per dag. Nooit de koploper stoppen.
- Zakt de omzet per bezoeker duidelijk na een wijziging: automatisch terug naar de vorige versie.
- Elke nacht controle: laden de pagina's, opent de checkout, komen er fouten binnen. Bij een fout geen wijzigingen tot het opgelost is.

## Nieuw project aansluiten
1. Wat is het geldmoment, en wat voorspelt het?
2. Elke trechterstap meten, inclusief de checkout zelf.
3. Postbacks per netwerk werkend en met een echte conversie getest. De vroege conversie (echt mens) meldt aan het netwerk.
4. Signaalcheck aan en één keer met de hand gedraaid: geen alarm, of elk alarm verklaard.
5. Frictielijst één keer over elke landingspagina gedraaid, en de opties op de pagina met namen gemeten.
6. Lijst van wat vast staat.
7. Eigenaarspagina live, met de signaalcheck bovenaan.
8. Eerste ronde draaien en het grootste lek benoemen.

## Melden aan Henkjan
Gewone taal, resultaat eerst, kort. Link naar de live pagina. Geen jargon, geen spreadsheet. Alleen melden als er iets opvallends is of iets van hem nodig is.