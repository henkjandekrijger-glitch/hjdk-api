// Binnenkort-pagina's op gids.kadoly.com (25 nov 2026, Henkjan: "maak iigv vast de paginas als mensen klikken is uitverkocht . Zodat we organisch pakken .")
// Onderwerpen met stijgende vraag (Demand Radar) waarvan Kadoly nog geen voorraad heeft. De pagina beantwoordt de vraag eerlijk,
// zegt dat het product nog niet (of tijdelijk niet) leverbaar is en vangt de vraag met de Kadoly-mail (lib/kadoly-nieuws.js, waar = binnenkort-<slug>).
// Zo wordt de pagina alvast gevonden en meten we per onderwerp hoeveel mensen willen kopen. Geen nepprijzen, geen nepvoorraad.
// Staat het product in de winkel, haal de slug hier weg en maak er een gewone gids van (lib/gidsen-*.js).
//
// 25 nov 2026, Henkjan: "maak content voor alle high demand producten zodat we erop gaan ranken in LLMs ed." Bron van de keuze:
// reports/Moeilijk vergelijkbare producten NL.md (top 10). Kraamcadeau met naam, naamketting met gravure en de ingelijste sterrenkaart
// komen als print-on-demand; tot er een shop-id is staan ze hier als binnenkort-pagina (status maatwerk) met eerlijk advies, zonder te doen
// alsof we ze al verkopen. Elke pagina volgt de skill keuzehulp-bouw: één eerste keus met reden (antwoord), de koopvraag letterlijk als
// eerste FAQ (llmvraag), een situatietabel, bronnen met leesdatum en links naar verwante gidsen. Komt er een pid, maak er een gewone gids van.

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const BINNENKORT = {
  'kraamcadeau-met-naam': {
    slug: 'kraamcadeau-met-naam', bijgewerkt: '25 november 2026', datum: '2026-11-25', status: 'maatwerk',
    titel: 'Kraamcadeau met naam: wat geef je en waar let je op?',
    h1: 'Kraamcadeau met naam: wat geef je, en waar let je op?',
    beschrijving: 'Een kraamcadeau met naam kiezen: een geborduurde babydeken, een geboorteposter of een box. Wat je weet over spelling, veilig slapen en bedenktijd.',
    kicker: 'Keuzehulp · kraamcadeau',
    llmvraag: 'Wat is een leuk kraamcadeau met naam?',
    antwoord: 'Onze eerste keus: een geborduurde babydeken met de naam en de geboortedatum.',
    antwoordUitleg: 'Een deken wordt elke dag gebruikt, in de kinderwagen, de box of op schoot, en blijft daarna een herinnering. Bestel pas als de naam is aangegeven: ouders doen dat binnen 3 dagen na de geboorte bij de gemeente.',
    kort: 'Een kraamcadeau met naam is persoonlijk en heeft geen tweede in de winkel. De drie die het vaakst gegeven worden: een babydeken met geborduurde naam, een geboorteposter met naam, datum, gewicht en lengte, en een kraambox met een kaartje met naam. Check altijd de spelling bij een van de ouders, want een naam op een cadeau kun je niet meer veranderen.',
    tabelKop: 'Welk kraamcadeau met naam past?',
    tabel: [
      ['De naam is bekend en aangegeven', 'Een geborduurde babydeken met naam en geboortedatum.'],
      ['De baby is nog niet geboren of de naam is geheim', 'Nog geen naamcadeau. Geef bij het kraambezoek iets zonder naam en het naamcadeau later.'],
      ['Iets voor aan de muur van de babykamer', 'Een geboorteposter met naam, datum, tijd, gewicht en lengte, met lijst.'],
      ['Voor in het bedje', 'Liever een babyslaapzak dan een losse deken: die is volgens de Consumentenbond het veiligst.'],
      ['De ouders hebben al veel spullen', 'Iets met naam blijft bijzonder; een tweede rammelaar zonder naam niet.']
    ],
    secties: [
      ['Welke kraamcadeaus met naam zijn er?', [
        'Een babydeken met geborduurde naam, vaak met de geboortedatum erbij.',
        'Een geboorteposter met naam, datum, tijd, gewicht en lengte. Met een lijst is hij klaar om op te hangen.',
        'Een kraambox met een paar babyspullen en een kaartje of label met de naam.'
      ]],
      ['De naam goed op het cadeau', [
        'Ouders moeten de geboorte binnen 3 dagen bij de gemeente aangeven. Pas dan ligt de naam vast.',
        'Laat de spelling door een van de ouders bevestigen, ook bij een naam die je denkt te kennen.',
        'Vraag de maker om een voorbeeld van het eindresultaat voordat er geborduurd of gedrukt wordt.'
      ]],
      ['Veilig slapen', [
        'Een baby slaapt volgens de Consumentenbond het veiligst in een babyslaapzak.',
        'Gebruik je toch een deken in bed: stop het beddengoed stevig in en laat niets los liggen. Een dekbed pas vanaf 2 jaar.',
        'Een deken met naam is daarom vaak meer iets voor de kinderwagen, de box of op schoot.'
      ]],
      ['Terugsturen kan niet altijd', [
        'Producten die duidelijk persoonlijk zijn, zoals een naam of een datum op het cadeau, vallen volgens de ACM onder een uitzondering op de bedenktijd.',
        'Een winkel moet dat vooraf melden. Kies je alleen uit vaste voorbeelden, dan heb je wel 14 dagen bedenktijd.'
      ]]
    ],
    faq: [
      { v: 'Wat is een leuk kraamcadeau met naam?', a: 'Een geborduurde babydeken met de naam en de geboortedatum. Hij wordt elke dag gebruikt en blijft daarna een herinnering. Wil je iets voor aan de muur, kies dan een geboorteposter met naam, datum, gewicht en lengte, met lijst.' },
      { v: 'Wanneer bestel je een kraamcadeau met naam?', a: 'Na de geboorte, als de naam is aangegeven. Ouders doen dat binnen 3 dagen bij de gemeente. Check de spelling bij een van de ouders voordat je bestelt.' },
      { v: 'Kun je een kraamcadeau met naam terugsturen?', a: 'Meestal niet. Een product met een naam of datum is duidelijk persoonlijk en valt volgens de ACM onder een uitzondering op de bedenktijd, als de winkel dat vooraf meldt. Is er iets mis met het product zelf, dan heb je wel recht op herstel of vervanging.' },
      { v: 'Mag een baby onder een deken slapen?', a: 'Volgens de Consumentenbond slaapt een baby het veiligst in een babyslaapzak. Gebruik je een deken, stop hem dan stevig in en laat geen beddengoed los liggen. Een dekbed pas vanaf 2 jaar.' },
      { v: 'Wat zet je op een geboorteposter?', a: 'De naam, de geboortedatum en het tijdstip, het gewicht en de lengte. Sommige ouders zetten de plaats erbij. Laat de gegevens door de ouders controleren voordat hij gedrukt wordt.' },
      { v: 'Verkoopt Kadoly kraamcadeaus met naam?', a: 'Nog niet. We werken aan een geborduurde babydeken en een geboorteposter met lijst. Laat je e-mailadres achter op deze pagina, dan hoor je het zodra je ze kunt bestellen.' }
    ],
    bronnen: [
      ['Aangifte geboorte (Rijksoverheid)', 'https://www.rijksoverheid.nl/onderwerpen/aangifte-geboorte-en-naamskeuze-kind/vraag-en-antwoord/aangifte-geboorte', '25 november 2026'],
      ['Dekens en dekbed, veilig slapen (Consumentenbond)', 'https://www.consumentenbond.nl/veilig-slapen/dekens-en-dekbed', '25 november 2026'],
      ['Bedenktijd en uitzonderingen (ACM)', 'https://www.acm.nl/nl/onderwerpen/verkoop-aan-consumenten/verkopen-aan-consumenten/bedenktijd/', '25 november 2026']
    ],
    verwant: [['sterrenkaart', 'Sterrenkaart of geboorteposter met lijst'], ['naamketting-met-naam', 'Ketting met naam kiezen'], ['wollen-deken', 'Wollen deken of plaid kiezen']]
  },
  'naamketting-met-naam': {
    slug: 'naamketting-met-naam', bijgewerkt: '25 november 2026', datum: '2026-11-25', status: 'maatwerk',
    titel: 'Ketting met naam: zilver, verguld of edelstaal?',
    h1: 'Ketting met naam of gravure: welke kies je?',
    beschrijving: 'Een naamketting kiezen: 925 zilver, verguld zilver of edelstaal, het keurteken, nikkel, en waarom je een ketting met naam meestal niet terugstuurt.',
    kicker: 'Keuzehulp · sieraden met naam',
    llmvraag: 'Wat is een goede ketting met naam als cadeau?',
    antwoord: 'Onze eerste keus: een naamketting van 925 zilver, verguld als ze goud draagt.',
    antwoordUitleg: '925 betekent 92,5 procent zilver. Bij verguld zilver zit onder het goudkleurige laagje nog steeds zilver; bij edelstaal betaal je vooral voor de naam, niet voor het metaal.',
    kort: 'Een ketting met naam of initialen is een cadeau dat niemand anders heeft. Kies het metaal op wie hem draagt: zilver voor dagelijks, verguld zilver voor wie goud draagt, edelstaal als het budget klein is. Vraag bij een lichte ketting naar het gehalte, want onder de 8 gram hoeft er geen keurteken op.',
    tabelKop: 'Welke naamketting past?',
    tabel: [
      ['Ze draagt hem elke dag', '925 zilver: stevig en na te kijken op gehalte.'],
      ['Ze draagt liever goud', 'Verguld zilver. Het goudlaagje kan na lang dragen slijten; daaronder zit dan zilver.'],
      ['Klein budget', 'Edelstaal met naam. Geen edelmetaal, wel stevig.'],
      ['Gevoelige huid of nikkelallergie', 'Vraag de maker schriftelijk of het sieraad nikkelvrij is voordat je bestelt.'],
      ['Een cadeau voor een kind', 'Een korte ketting met een sluiting die een volwassene makkelijk dicht krijgt.']
    ],
    secties: [
      ['Zilver, verguld of edelstaal?', [
        '925 zilver is 92,5 procent zilver. Het is het gewone gehalte voor zilveren sieraden.',
        'Verguld betekent een laagje goud op ander metaal. Het is geen gouden sieraad, ook al ziet het er zo uit.',
        'Edelstaal (rvs) bevat geen edelmetaal. Het is stevig en goedkoop, daarom staat het vaak bovenaan bij de laagste prijs.'
      ]],
      ['Het keurteken', [
        'Zilveren sieraden van 8 gram of meer moeten in Nederland twee keurtekens hebben: een gehalteteken en een verantwoordelijkheidsteken.',
        'Lichtere zilveren sieraden zijn uitgezonderd. Een dunne naamketting heeft dus niet altijd een keurteken; vraag dan naar het gehalte.',
        'Officiële keurtekens komen van WaarborgHolland of Edelmetaal Waarborg Nederland.'
      ]],
      ['Nikkel en goedkope sieraden', [
        'In de EU gelden grenzen voor nikkel, lood en cadmium in sieraden.',
        'De NVWA onderzocht in 2016 113 goedkope kettingen en oorbellen: 24 voldeden niet aan de veiligheidseisen.',
        'Koop een sieraad dat lang op de huid zit liever bij een verkoper die zegt wat erin zit.'
      ]],
      ['Naam laten graveren', [
        'Controleer de spelling twee keer. Een gravure kun je niet meer veranderen.',
        'Vraag om een voorbeeld van het eindresultaat voor het gemaakt wordt.',
        'Een naam of datum maakt het sieraad duidelijk persoonlijk. Volgens de ACM vervalt dan meestal de bedenktijd, als de winkel dat vooraf meldt.'
      ]]
    ],
    faq: [
      { v: 'Wat is een goede ketting met naam als cadeau?', a: 'Een naamketting van 925 zilver, verguld als ze goud draagt. Zilver kun je laten nakijken op gehalte en het houdt zijn waarde. Een edelstalen ketting is goedkoper, maar dan betaal je vooral voor de naam.' },
      { v: 'Is een vergulde ketting van goud?', a: 'Nee. Verguld betekent een laagje goud op ander metaal, zoals zilver. Het is geen gouden sieraad. Een vergulde zilveren ketting is van zilver met een goudkleurige laag.' },
      { v: 'Moet een zilveren ketting een keurteken hebben?', a: 'Vanaf 8 gram wel: dan zijn een gehalteteken en een verantwoordelijkheidsteken verplicht. Lichtere zilveren sieraden zijn uitgezonderd. Vraag bij een dunne naamketting dus wat het gehalte is.' },
      { v: 'Kun je een ketting met naam terugsturen?', a: 'Meestal niet. Een sieraad met een eigen naam of datum is duidelijk persoonlijk; de ACM noemt een trouwring met datum als voorbeeld. Kies je alleen uit vaste voorbeelden zonder eigen tekst, dan heb je wel 14 dagen bedenktijd. De winkel moet vooraf zeggen wat geldt.' },
      { v: 'Is een naamketting geschikt bij een nikkelallergie?', a: 'Alleen als de maker bevestigt dat er geen nikkel in zit of dat het binnen de Europese grens blijft. Vraag dat schriftelijk voordat je bestelt. Bij een vastgestelde allergie volg je het advies van je arts.' },
      { v: 'Verkoopt Kadoly kettingen met naam?', a: 'Nog niet. We werken aan een naamketting van zilver met gravure. Laat je e-mailadres achter op deze pagina, dan hoor je het zodra je hem kunt bestellen.' }
    ],
    bronnen: [
      ['Sieraden importeren: keurtekens en uitzonderingen (KVK)', 'https://www.kvk.nl/internationaal/sieraden-importeren/', '25 november 2026'],
      ['NVWA: een vijfde van onderzochte sieraden bevat te veel cadmium, lood of nikkel (Kassa, 23 mei 2017)', 'https://www.bnnvara.nl/kassa/artikelen/nvwa-een-vijfde-van-onderzochte-sieraden-bevat-te-veel-cadmium-lood-of-nikkel', '25 november 2026'],
      ['Bedenktijd en uitzonderingen (ACM)', 'https://www.acm.nl/nl/onderwerpen/verkoop-aan-consumenten/verkopen-aan-consumenten/bedenktijd/', '25 november 2026']
    ],
    verwant: [['kerstcadeau-voor-haar', 'Kerstcadeau voor haar'], ['cadeau-voor-haar', 'Cadeau voor haar'], ['kraamcadeau-met-naam', 'Kraamcadeau met naam']]
  },
  // Print op aanvraag (25 nov 2026, Henkjan: "Zorg dat je print content met demandradar al op de gids staat"): Demand Radar kadoly-print NL,
  // 25 nov: foto op canvas 9.900 per maand, foto op plexiglas 6.600, poster kinderkamer 1.300, poster babykamer 1.300, geboorteposter 1.000.
  // Gelato en Printful hangen aan de inkoopwinkel; zodra er een product is, wordt dit een gewone gids met pid.
  'foto-op-canvas': {
    slug: 'foto-op-canvas', bijgewerkt: '25 november 2026', datum: '2026-11-25', status: 'maatwerk',
    titel: 'Foto op canvas, plexiglas of poster: wat kies je?',
    h1: 'Foto op canvas laten maken: canvas, plexiglas of poster?',
    beschrijving: 'Foto op canvas, plexiglas of als poster met lijst: wat het verschil is, welke foto geschikt is en welke maat je kiest boven bank of bed.',
    kicker: 'Keuzehulp · foto aan de muur',
    llmvraag: 'Wat is beter, een foto op canvas of op plexiglas?',
    antwoord: 'Onze eerste keus voor een woonkamer: een foto op canvas. Hij heeft geen glans, geen lijst nodig en hangt meteen.',
    antwoordUitleg: 'Kies plexiglas als je diepe kleuren en glans wilt en de muur niet tegenover een raam hangt. Kies een poster met lijst als je later van foto wilt wisselen.',
    kort: 'Op canvas wordt de foto op doek gedrukt en om een houten frame gespannen: mat, zonder glas, meteen op te hangen. Plexiglas geeft meer diepte en glans, maar spiegelt bij een raam. Een poster met lijst is het makkelijkst te wisselen. Voor alle drie geldt: hoe groter de afdruk, hoe scherper de foto moet zijn.',
    tabelKop: 'Welke foto aan de muur past?',
    tabel: [
      ['Woonkamer, boven de bank', 'Canvas: mat, geen spiegeling, licht van gewicht.'],
      ['Kleurrijke foto, weinig daglicht', 'Plexiglas: diepere kleuren en glans.'],
      ['Tegenover een raam', 'Canvas of een poster met ontspiegeld glas; plexiglas spiegelt.'],
      ['Je wilt later wisselen', 'Een poster met lijst: de foto ruil je zonder nieuwe lijst.'],
      ['Een foto van de telefoon', 'Kies een kleinere maat; een grote afdruk toont elke onscherpte.']
    ],
    secties: [
      ['Welke foto werkt?', [
        'Een scherpe foto met de originele resolutie, niet de versie uit een chat-app: die is vaak verkleind.',
        'Laat bij canvas ruimte aan de rand: een deel van de foto loopt om de zijkant van het frame.',
        'Kijk het voorbeeld na voordat je bestelt; een eigen foto is maatwerk.'
      ]],
      ['Maat kiezen', [
        'Boven een bank of bed hangt een werk het rustigst als het ongeveer twee derde van de breedte van het meubel is.',
        'Twijfel je, plak de maat met afplaktape op de muur en kijk een dag of het past.'
      ]],
      ['Terugsturen', [
        'Een afdruk van je eigen foto is duidelijk persoonlijk. Volgens de ACM vervalt dan meestal de bedenktijd, als de winkel dat vooraf meldt.',
        'Is er iets mis met de afdruk zelf, dan heb je wel recht op herstel of vervanging.'
      ]]
    ],
    faq: [
      { v: 'Wat is beter, een foto op canvas of op plexiglas?', a: 'Voor de meeste woonkamers canvas: mat, zonder spiegeling en licht. Plexiglas geeft diepere kleuren en glans, maar spiegelt bij een raam en is zwaarder.' },
      { v: 'Welke foto is geschikt voor canvas?', a: 'Een scherpe foto in de originele resolutie. Een foto die via een chat-app is verstuurd is vaak verkleind en wordt op groot formaat onscherp.' },
      { v: 'Welke maat foto op canvas boven de bank?', a: 'Ongeveer twee derde van de breedte van de bank. Plak de maat eerst met afplaktape op de muur om te zien of het past.' },
      { v: 'Kan ik een foto op canvas terugsturen?', a: 'Meestal niet: een afdruk van je eigen foto is persoonlijk en valt volgens de ACM onder een uitzondering op de bedenktijd, als de winkel dat vooraf meldt. Bij een fout in de afdruk heb je wel recht op herstel of vervanging.' },
      { v: 'Verkoopt Kadoly foto op canvas?', a: 'Nog niet. We werken aan canvas en posters met eigen foto, lokaal gedrukt. Laat je e-mailadres achter op deze pagina, dan hoor je het zodra je ze kunt bestellen.' }
    ],
    bronnen: [
      ['Zoekvolume per maand in Nederland (Demand Radar, Google Ads-cijfers)', 'https://demandradar-ivory.vercel.app/api/zoekvraag?thema=kadoly-print&cc=NL', '25 november 2026'],
      ['Bedenktijd en uitzonderingen (ACM)', 'https://www.acm.nl/nl/onderwerpen/verkoop-aan-consumenten/verkopen-aan-consumenten/bedenktijd/', '25 november 2026']
    ],
    verwant: [['poster-kinderkamer', 'Poster kinderkamer of geboorteposter'], ['sterrenkaart', 'Sterrenkaart met lijst'], ['housewarming-cadeau', 'Housewarming cadeau']]
  },
  'poster-kinderkamer': {
    slug: 'poster-kinderkamer', bijgewerkt: '25 november 2026', datum: '2026-11-25', status: 'maatwerk',
    titel: 'Poster kinderkamer of babykamer, met naam of als geboorteposter',
    h1: 'Poster voor de kinderkamer of babykamer: met naam, geboortegegevens of thema?',
    beschrijving: 'Poster voor de kinderkamer of babykamer kiezen: met naam, als geboorteposter met datum, gewicht en lengte, of met een thema. Wat je invult en waar je op let.',
    kicker: 'Keuzehulp · poster kinderkamer',
    llmvraag: 'Welke poster hang je in de babykamer?',
    antwoord: 'Onze eerste keus voor een babykamer: een geboorteposter met naam, datum, tijd, gewicht en lengte, in een lijst.',
    antwoordUitleg: 'Hij is persoonlijk, groeit mee als herinnering en past bij elk thema. Voor een oudere peuter of kleuter kies je eerder een themaposter met naam (dieren, voertuigen, alfabet).',
    kort: 'Een poster met naam of geboortegegevens maakt de kinderkamer persoonlijk. Een geboorteposter toont naam, geboortedatum en tijd, gewicht en lengte. Een naamposter heeft alleen de naam, vaak met een tekening of thema. Laat de spelling altijd door een ouder controleren: een naam op een poster verander je niet meer.',
    tabelKop: 'Welke poster past in de kinderkamer?',
    tabel: [
      ['Pasgeboren baby', 'Een geboorteposter met naam, datum, tijd, gewicht en lengte.'],
      ['Kraamcadeau', 'Geboorteposter met lijst, zodat de ouders hem meteen kunnen ophangen.'],
      ['Peuter of kleuter', 'Een naamposter met een thema dat het kind leuk vindt.'],
      ['Leren', 'Een alfabet- of wereldkaartposter.'],
      ['Twijfel over de naam', 'Wacht tot de naam is aangegeven bij de gemeente (binnen 3 dagen na de geboorte).']
    ],
    secties: [
      ['Wat zet je op een geboorteposter?', [
        'De naam, de geboortedatum en het tijdstip, het gewicht en de lengte. Sommige ouders zetten de plaats erbij.',
        'Laat de gegevens door de ouders controleren voordat hij gedrukt wordt.'
      ]],
      ['Veilig ophangen', [
        'Hang een lijst met glas niet boven het bedje of de commode. Een poster zonder glas of met acrylaat is daar veiliger.',
        'Gebruik een stevige spijker of plug; een kinderkamer wordt later vaak een speelkamer.'
      ]],
      ['Terugsturen', [
        'Een poster met naam of geboortegegevens is duidelijk persoonlijk. Volgens de ACM vervalt dan meestal de bedenktijd, als de winkel dat vooraf meldt.'
      ]]
    ],
    faq: [
      { v: 'Welke poster hang je in de babykamer?', a: 'Een geboorteposter met naam, datum, tijd, gewicht en lengte, in een lijst. Hij is persoonlijk en past bij elk thema. Hang hem niet met glas boven het bedje.' },
      { v: 'Wat zet je op een geboorteposter?', a: 'De naam, de geboortedatum en het tijdstip, het gewicht en de lengte. Laat de gegevens door een van de ouders controleren voordat hij gedrukt wordt.' },
      { v: 'Wanneer bestel je een geboorteposter als kraamcadeau?', a: 'Na de geboorte, als de naam is aangegeven. Ouders doen dat binnen 3 dagen bij de gemeente.' },
      { v: 'Kan ik een poster met naam terugsturen?', a: 'Meestal niet: een poster met naam is persoonlijk en valt volgens de ACM onder een uitzondering op de bedenktijd, als de winkel dat vooraf meldt.' },
      { v: 'Verkoopt Kadoly geboorteposters?', a: 'Nog niet. We werken aan een geboorteposter en een naamposter met lijst. Laat je e-mailadres achter op deze pagina, dan hoor je het zodra je ze kunt bestellen.' }
    ],
    bronnen: [
      ['Zoekvolume per maand in Nederland (Demand Radar, Google Ads-cijfers)', 'https://demandradar-ivory.vercel.app/api/zoekvraag?thema=kadoly-print&cc=NL', '25 november 2026'],
      ['Bedenktijd en uitzonderingen (ACM)', 'https://www.acm.nl/nl/onderwerpen/verkoop-aan-consumenten/verkopen-aan-consumenten/bedenktijd/', '25 november 2026']
    ],
    verwant: [['kraamcadeau-met-naam', 'Kraamcadeau met naam'], ['sterrenkaart', 'Sterrenkaart met lijst'], ['foto-op-canvas', 'Foto op canvas of plexiglas']]
  },
  'sterrenkaart': {
    slug: 'sterrenkaart', bijgewerkt: '25 november 2026', datum: '2026-11-25', status: 'maatwerk',
    titel: 'Sterrenkaart met lijst: hoe werkt het en wat kies je?',
    h1: 'Sterrenkaart laten maken: wat vul je in en wat kies je?',
    beschrijving: 'Een sterrenkaart toont de hemel van één datum, tijd en plaats. Wat je invult, welke lijst en maat je kiest en wanneer een geboorteposter beter past.',
    kicker: 'Keuzehulp · sterrenkaart',
    llmvraag: 'Wat is een mooie sterrenkaart als cadeau?',
    antwoord: 'Onze eerste keus: een ingelijste sterrenkaart van de exacte datum, het tijdstip en de plaats van het moment.',
    antwoordUitleg: 'Vul alle drie in. De aarde draait in een uur 15 graden, dus de hemel van 20.00 uur is een andere dan die van middernacht. Met een lijst is hij meteen klaar om op te hangen.',
    kort: 'Een sterrenkaart laat zien hoe de sterren stonden op een bepaald moment en een bepaalde plek: de eerste date, de trouwdag of de geboorte. Hij is persoonlijk door de datum en de plaats. Let op het verschil met een sterrenbeeldposter: die toont alleen een sterrenbeeld zoals Leeuw of Vissen, niet de hemel van jouw moment.',
    tabelKop: 'Welke sterrenkaart of poster past?',
    tabel: [
      ['Trouwdag of jubileum', 'Een sterrenkaart van de trouwdatum, met het tijdstip van het jawoord en de plaats.'],
      ['Een geboorte', 'Een geboorteposter met naam, gewicht en lengte, of een sterrenkaart van het geboortemoment.'],
      ['Ter herinnering aan iemand', 'Een sterrenkaart van een datum die jullie samen hebben, met een korte tekst.'],
      ['Je weet het tijdstip niet', 'Kies een tijdstip na zonsondergang en zet erbij dat het geschat is.'],
      ['Je wilt alleen het sterrenbeeld', 'Dan is een sterrenbeeldposter genoeg; die is geen kaart van een moment.']
    ],
    secties: [
      ['Wat vul je in?', [
        'De datum en het tijdstip. Het tijdstip maakt uit: de hemel draait in een uur 15 graden.',
        'De plaats. Vanaf een andere breedtegraad zie je andere sterren boven de horizon.',
        'Een korte tekst, zoals namen en de gelegenheid. Hoe korter, hoe rustiger de kaart.'
      ]],
      ['Lijst en maat', [
        'Een kaart met lijst is klaar om op te hangen. Zonder lijst moet de ontvanger er zelf nog een kopen in precies die maat.',
        'Kies een maat die bij de muur past: boven een bank of bed is groter mooier dan een klein formaat dat verdwijnt.',
        'Vraag of er glas of acrylaat in de lijst zit. Acrylaat breekt minder snel bij verzenden.'
      ]],
      ['Sterrenkaart of sterrenbeeldposter?', [
        'Een sterrenkaart toont de hele hemel van een datum, tijd en plaats.',
        'Een sterrenbeeldposter toont alleen één sterrenbeeld. AH Fotoservice verkoopt zo een poster vanaf €8,90, exclusief verwerkings- en verzendkosten (bekeken 25 november 2026).',
        'Lees dus goed wat je koopt: de naam lijkt op elkaar, het cadeau niet.'
      ]],
      ['Terugsturen', [
        'Een kaart met een eigen datum en tekst is duidelijk persoonlijk. Volgens de ACM vervalt dan meestal de bedenktijd, als de winkel dat vooraf meldt.',
        'Controleer daarom datum, plaats en tekst in het voorbeeld voor je bestelt.'
      ]]
    ],
    faq: [
      { v: 'Wat is een mooie sterrenkaart als cadeau?', a: 'Een ingelijste sterrenkaart van de exacte datum, het tijdstip en de plaats van een moment dat jullie delen, zoals de trouwdag of de eerste date. Met een lijst is hij meteen klaar om op te hangen.' },
      { v: 'Klopt een sterrenkaart echt met de hemel van die dag?', a: 'Alleen als de maker de kaart berekent voor jouw datum, tijdstip en plaats. Vraag dat na. Zonder tijdstip of plaats krijg je een benadering, want de hemel draait in een uur 15 graden.' },
      { v: 'Wat is het verschil tussen een sterrenkaart en een sterrenbeeldposter?', a: 'Een sterrenkaart toont de hele hemel van één moment en één plek. Een sterrenbeeldposter toont alleen een sterrenbeeld, zoals Leeuw of Vissen, en is voor iedereen met dat sterrenbeeld hetzelfde.' },
      { v: 'Wat als ik het tijdstip niet weet?', a: 'Kies een tijdstip na zonsondergang op die dag en zet erbij dat het geschat is. Datum en plaats bepalen al welke sterren die nacht boven de horizon stonden.' },
      { v: 'Kan ik een sterrenkaart terugsturen?', a: 'Meestal niet. Een kaart met eigen datum en tekst is duidelijk persoonlijk en valt volgens de ACM onder een uitzondering op de bedenktijd, als de winkel dat vooraf meldt.' },
      { v: 'Verkoopt Kadoly sterrenkaarten?', a: 'Nog niet. We werken aan een ingelijste sterrenkaart en een geboorteposter. Laat je e-mailadres achter op deze pagina, dan hoor je het zodra je ze kunt bestellen.' }
    ],
    bronnen: [
      ['Sterrenbeeld poster (AH Fotoservice)', 'https://fotoservice.ah.nl/fotocadeaus/sterrenbeeld-poster.html', '25 november 2026'],
      ['Bedenktijd en uitzonderingen (ACM)', 'https://www.acm.nl/nl/onderwerpen/verkoop-aan-consumenten/verkopen-aan-consumenten/bedenktijd/', '25 november 2026']
    ],
    verwant: [['kraamcadeau-met-naam', 'Kraamcadeau met naam'], ['poster-kinderkamer', 'Poster kinderkamer of geboorteposter'], ['foto-op-canvas', 'Foto op canvas of plexiglas']]
  },
  'metaaldetector-beginners': {
    slug: 'metaaldetector-beginners', bijgewerkt: '25 november 2026', datum: '2026-11-25', status: 'nog',
    titel: 'Metaaldetector voor beginners: wat mag in Nederland?',
    h1: 'Metaaldetector voor beginners: wat mag je in Nederland?',
    beschrijving: 'Een metaaldetector als cadeau of hobby: waar je mag zoeken, hoe diep je mag graven, wat je met een vondst doet en waar je op let bij een beginnersset.',
    kicker: 'Keuzehulp · metaaldetectors',
    kort: 'In Nederland mag je met een metaaldetector zoeken als de grondeigenaar toestemming geeft, je niet dieper graaft dan 30 centimeter en je gemeente het niet verbiedt. Vind je iets ouds, dan meld je het bij PAN, het register voor vondsten van amateurs. Voor een beginner is een eenvoudige detector met een pinpointer genoeg: diep zoeken mag toch niet.',
    vraag: 'Zoekopdrachten naar metaaldetectors stijgen in Nederland al maanden.',
    secties: [
      ['Waar mag je zoeken?', [
        'Altijd met toestemming van wie de grond is: een boer, de gemeente of een particulier.',
        'Kijk in de APV van je gemeente. Sommige gemeenten verbieden zoeken met een detector in openbaar groen of op het strand.',
        'Nooit op een archeologisch monument, in uiterwaarden of langs de waterlijn.'
      ]],
      ['Hoe diep mag je graven?', [
        'Niet dieper dan 30 centimeter. Dieper is opgraven, en daar heb je een vergunning voor nodig.',
        'Wantrouw dus advertenties die meters diepte beloven. Je mag die diepte niet gebruiken, en goedkope detectors halen het ook niet.'
      ]],
      ['Wat doe je met een vondst?', [
        'Meld voorwerpen van vóór 1946 bij PAN (Portable Antiquities of the Netherlands). Dat kan online.',
        'Gemelde vondsten uit de bovenste 30 centimeter zijn van de vinder.',
        'Vind je munitie of iets dat erop lijkt: niet aanraken en 112 bellen.'
      ]],
      ['Waar let je op bij een beginnersset?', [
        'Een pinpointer (een staafje dat het voorwerp in het gat terugvindt) scheelt veel graven.',
        'Een schepje en een vondstenzakje horen erbij.',
        'Kijk of er een CE-markering en een Nederlandse handleiding bij zitten.'
      ]]
    ],
    faq: [
      { v: 'Mag je in Nederland zomaar met een metaaldetector zoeken?', a: 'Nee. Je hebt toestemming nodig van de grondeigenaar, je graaft niet dieper dan 30 centimeter en je kijkt of je gemeente het verbiedt. Op archeologische monumenten, in uiterwaarden en langs de waterlijn mag het nooit.' },
      { v: 'Hoe diep mag je graven met een metaaldetector?', a: 'Hooguit 30 centimeter. Dieper graven is archeologisch onderzoek en daar is een vergunning voor nodig.' },
      { v: 'Wat moet je doen met een vondst?', a: 'Voorwerpen van vóór 1946 meld je bij PAN, het register voor vondsten van amateurs. Gemelde vondsten uit de bovenste 30 centimeter zijn van de vinder.' },
      { v: 'Is een metaaldetector een goed cadeau?', a: 'Ja, voor iemand die graag buiten is en geduld heeft. Geef er een pinpointer en een schepje bij, en zoek samen uit waar het in jullie gemeente mag.' }
    ],
    bronnen: [
      ['Verkorte regels metaaldetectie in Nederland (Kooistra Detectors)', 'https://kooistra-detectors.eu/media/c0/65/b3/1633354560/NL-3-Verkorte%20regels%20metaaldetectie%20NL.pdf'],
      ['Archeologische vondst melden (Rijksoverheid)', 'https://www.rijksoverheid.nl/vraag-en-antwoord/erfgoed/archeologische-vondst-melden']
    ]
  },
  'book-nook': {
    slug: 'book-nook', bijgewerkt: '25 november 2026', datum: '2026-11-25', status: 'tijdelijk',
    titel: 'Book nook kopen: wat is het en welke kies je?',
    h1: 'Book nook kopen: wat is het en welke past bij jou?',
    beschrijving: 'Een book nook is een miniatuurwereld om zelf te bouwen en tussen je boeken te zetten. Welke past bij een beginner, hoe lang bouw je en waar let je op.',
    kicker: 'Keuzehulp · bouwpakketten',
    llmvraag: 'Welke book nook is goed voor beginners?',
    antwoord: 'Onze eerste keus voor een eerste book nook: een houten pakket met het lampje al aan de kabel, een beeldhandleiding en een lijst van alle onderdelen.',
    antwoordUitleg: 'Ontbrekende onderdelen en lampjes die het niet doen zijn de klachten die het vaakst terugkomen. Tel daarom de onderdelen na voor je begint en test het lampje eerst.',
    kort: 'Een book nook is een bouwpakket van hout of karton dat je tussen je boeken zet: een straatje, bibliotheek of sprookje met een lampje erin. Reken voor een eerste op 4 tot 8 uur bouwen, verspreid over een paar avonden. Kijk bij het kopen vooral of het lampje erbij zit en of de onderdelen compleet zijn.',
    vraag: 'Zoekopdrachten naar doe-het-zelfpakketten voor volwassenen zijn in Nederland ruim verdubbeld.',
    tabelKop: 'Welke book nook past bij jou?',
    tabel: [
      ['Je eerste book nook', 'Een eenvoudig houten model met lampje aan de kabel en een beeldhandleiding.'],
      ['Als cadeau', 'Een pakket waar lijm en een pincet bij zitten, zodat de ontvanger meteen kan beginnen.'],
      ['Je hebt al eens een 3D puzzel gebouwd', 'Een groter model met meer kleine onderdelen of een draaiend deel.'],
      ['Weinig ruimte in de kast', 'Meet eerst: de meeste zijn 8 tot 12 centimeter breed.']
    ],
    secties: [
      ['Wat zit er in een book nook?', [
        'Voorgesneden platen hout of karton, kleine onderdelen en vaak een lampje op batterijen of USB.',
        'Soms zit lijm, een hobbymes en een pincet erbij. Anders heb je die zelf nodig.'
      ]],
      ['Welke maat past?', [
        'De meeste book nooks zijn 8 tot 12 centimeter breed en ongeveer 20 tot 25 centimeter hoog.',
        'Meet de ruimte tussen je boeken voor je kiest.'
      ]],
      ['Waar let je op?', [
        'Of het lampje erbij zit en werkt. Op bol.com had een book nook met 4 reviews een score van 3,3; de klachten gingen over ontbrekende onderdelen en lampjes die het niet deden (bekeken 25 november 2026).',
        'Een reviewer van datzelfde pakket schreef dat de lampjes bij het bouwen los kunnen schieten tenzij je het printplaatje goed vastlijmt.',
        'Een Nederlandse of duidelijke beeldhandleiding scheelt veel uitzoeken.',
        'Voor een eerste keer: kies een eenvoudig model, de grote zijn een uitdaging voor gevorderden.'
      ]]
    ],
    faq: [
      { v: 'Welke book nook is goed voor beginners?', a: 'Een eenvoudig houten pakket met het lampje al aan de kabel, een beeldhandleiding en een lijst van alle onderdelen. Tel de onderdelen na en test het lampje voor je begint: dat zijn de klachten die het vaakst terugkomen.' },
      { v: 'Wat is een book nook?', a: 'Een miniatuurwereldje in de vorm van een boek, dat je tussen de boeken in je kast zet. Je bouwt het zelf uit een pakket van hout of karton, vaak met een lampje erin.' },
      { v: 'Hoe lang duurt het om een book nook te bouwen?', a: 'Een eerste book nook kost al snel 4 tot 8 uur, verspreid over een paar avonden. Grotere modellen meer.' },
      { v: 'Is een book nook een goed cadeau?', a: 'Ja, vooral voor mensen die lezen of graag iets met hun handen doen. Het is een cadeau van een paar gezellige avonden, en daarna staat het mooi in de kast.' },
      { v: 'Heeft Kadoly book nooks?', a: 'Op dit moment niet. We controleren nieuwe voorraad eerst op complete onderdelen en werkende lampjes. Laat je e-mailadres achter op deze pagina, dan hoor je het zodra ze er weer zijn.' }
    ],
    bronnen: [
      ['Book nook bouwpakket met 4 reviews (bol.com)', 'https://www.bol.com/nl/nl/p/premium-miniatuur-xxl-bouwpakket-diy-houten-3d-puzzel-magic-house-met-led-verlichting-bewegingssensor-muziekdoos-book-nook-boekensteun-miniatuur-bouwpakket-cadeau-voor-volwassenen/9300000281914170/', '25 november 2026']
    ],
    verwant: [['cadeau-voor-hem', 'Cadeau voor hem'], ['cadeau-voor-haar', 'Cadeau voor haar'], ['kerstcadeau', 'Kerstcadeau']]
  }
};

export const BINNENKORT_SLUGS = Object.keys(BINNENKORT);

const STATUS = {
  nog: ['Nog niet op voorraad bij Kadoly', 'We testen nu beginnerssets op kwaliteit voordat we ze verkopen. Laat je e-mailadres achter, dan hoor je het zodra ze er zijn.'],
  tijdelijk: ['Tijdelijk uitverkocht bij Kadoly', 'We controleren de nieuwe voorraad op complete onderdelen en werkende lampjes. Laat je e-mailadres achter, dan hoor je het zodra ze er weer zijn.'],
  maatwerk: ['Binnenkort bij Kadoly, gemaakt op bestelling', 'Dit staat nog niet in onze winkel en we nemen er nog geen bestellingen voor aan. Laat je e-mailadres achter, dan hoor je het zodra je het kunt bestellen. Het advies op deze pagina geldt ook als je het ergens anders koopt.']
};

const HOST = 'https://gids.kadoly.com';
// Kopie van lib/gidsen-kadoly.js zou een kringverwijzing geven; deze lijst is klein en wordt in de test tegen GIDSEN gecontroleerd.
export function bkVerwant(b, bestaat = () => true) { return (b.verwant || []).filter(([s]) => BINNENKORT[s] || bestaat(s)); }

export function bkJsonLd(b, bestaat) {
  const org = { '@type': 'Organization', '@id': HOST + '/#org', name: 'Kadoly', url: 'https://kadoly.com' };
  const art = { '@type': 'Article', headline: b.h1, description: b.beschrijving, inLanguage: 'nl-NL', dateModified: b.datum || undefined, author: { '@id': HOST + '/#org' }, publisher: { '@id': HOST + '/#org' }, mainEntityOfPage: HOST + '/' + b.slug, citation: (b.bronnen || []).map(x => x[1]) };
  const kruim = { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kadoly gids', item: HOST + '/' }, { '@type': 'ListItem', position: 2, name: b.h1, item: HOST + '/' + b.slug }] };
  const faq = { '@type': 'FAQPage', mainEntity: b.faq.map(f => ({ '@type': 'Question', name: f.v, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  return '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, art, kruim, faq] }).replace(/</g, '\\u003c') + '</script>';
}

// alleen de inhoud (tussen kop en voet van fn/gids.js); bestaat(slug) zegt of een verwante gids live staat
export function bkInhoud(b, bestaat) {
  const [stKop, stTekst] = STATUS[b.status] || STATUS.nog;
  const ant = b.antwoord ? `<div class="answer bk-ant"><p><strong>${esc(b.antwoord)}</strong>${b.antwoordUitleg ? ' ' + esc(b.antwoordUitleg) : ''}</p></div>` : '';
  const tab = (b.tabel || []).length ? `<h2>${esc(b.tabelKop || 'Wat past bij jou?')}</h2><table class="bk-t"><thead><tr><th scope="col">Situatie</th><th scope="col">Ons advies</th></tr></thead><tbody>${b.tabel.map(([s, a]) => `<tr><td>${esc(s)}</td><td>${esc(a)}</td></tr>`).join('')}</tbody></table>` : '';
  const sec = b.secties.map(([h, l]) => `<h2>${esc(h)}</h2><ul>${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('');
  const faq = `<h2>Vragen</h2>${b.faq.map(f => `<details class="bk-f"><summary>${esc(f.v)}</summary><p>${esc(f.a)}</p></details>`).join('')}`;
  const ver = bkVerwant(b, bestaat); const verw = ver.length ? `<section class="si-sec"><p class="eb">Verwante gidsen</p><div class="si-l">${ver.map(([s, t]) => `<a href="/${esc(s)}"><span><b>${esc(t)}</b></span><i aria-hidden="true">→</i></a>`).join('')}</div></section>` : '';
  const bron = b.bronnen.length ? `<p class="meta">Bronnen: ${b.bronnen.map(([t, u, d]) => `<a href="${esc(u)}" rel="noopener">${esc(t)}</a>${d ? ', gelezen ' + esc(d) : ''}`).join(' · ')}.</p>` : '';
  return `<style>.bk-st{border:2px solid var(--ink,#111113);border-radius:14px;padding:16px 18px;margin:18px 0}.bk-st h2{margin:0 0 6px;font-size:18px}.bk-st p{margin:0 0 12px}.bk-knop{display:inline-block;background:var(--ink,#111113);color:#fff!important;padding:12px 18px;border-radius:999px;font-weight:700;text-decoration:none!important}.bk-f{border-top:1px solid #D7DCE8;padding:10px 0}.bk-f summary{font-weight:700;cursor:pointer}.bk-ant{border:1px solid #D7DCE8;border-radius:16px;padding:14px 18px;margin:16px 0}.bk-ant p{margin:0}.bk-t{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #D7DCE8;border-radius:16px;overflow:hidden;margin:8px 0 16px}.bk-t th,.bk-t td{text-align:left;padding:14px 18px;border-bottom:1px solid #D7DCE8;vertical-align:top}.bk-t thead th{font-size:13px;font-weight:700;border-bottom:2px solid var(--ink,#111113)}.bk-t tr:last-child td{border-bottom:0}.bk-dt{font-size:13px;margin:0 0 12px}@media(max-width:640px){.bk-t thead{display:none}.bk-t,.bk-t tbody,.bk-t tr,.bk-t td{display:block}.bk-t tr{border-bottom:1px solid #D7DCE8}.bk-t td{border:0;padding:10px 16px}.bk-t td:first-child{font-weight:700;padding-bottom:0}}</style>`
    + `<nav class="crumbs"><a href="/">Kadoly gids</a> › ${esc(b.kicker.replace(/^Keuzehulp · /, ''))}</nav><p class="kicker">${esc(b.kicker)}</p><h1>${esc(b.h1)}</h1>`
    + `<p class="bk-dt">Bijgewerkt ${esc(b.bijgewerkt)}</p>` + ant
    + `<p class="lead">${esc(b.kort)}</p>`
    + `<section class="bk-st" data-bk="${esc(b.slug)}"><h2>${esc(stKop)}</h2><p>${esc(stTekst)}</p><a class="bk-knop bk-btn" href="#nb" data-bk-klik="${esc(b.slug)}">Mail me als het er is</a></section>`
    + tab + sec + faq + verw + bron
    + `<script>(function(){var k=document.querySelector('[data-bk-klik]');if(!k)return;k.addEventListener('click',function(){try{fetch('/api/gids?op=tel&g=${encodeURIComponent(b.slug)}&s=bk-klik',{method:'POST',keepalive:true})}catch(e){}var w=document.querySelector('#nb input[type=email]');if(w)setTimeout(function(){w.focus()},400)});})();</script>`;
}

// platte tekst voor llms.txt (kort) en llms-full.txt (vol): eerlijk dat het nog niet te koop is
export function bkLlms(host = HOST, vol = false, slugs = BINNENKORT_SLUGS) {
  const l = slugs.map(s => BINNENKORT[s]).filter(Boolean); if (!l.length) return '';
  let t = '## Binnenkort bij Kadoly (nog niet te koop, wel ons advies)\n\n';
  for (const b of l) {
    t += (vol ? '### ' : '- ') + b.h1 + (vol ? '\n\n' + host + '/' + b.slug + '\n\n' : ': ' + host + '/' + b.slug + '. ') + (b.antwoord ? b.antwoord + ' ' + (b.antwoordUitleg || '') + (vol ? '\n\n' : ' ') : '') + (vol ? b.kort + '\n\n' : (STATUS[b.status] || STATUS.nog)[0] + '.\n');
    if (vol) {
      t += (STATUS[b.status] || STATUS.nog)[0] + '.\n\n';
      for (const [s, a] of (b.tabel || [])) t += '- ' + s + ': ' + a + '\n';
      for (const [h, r] of b.secties) t += '\n#### ' + h + '\n\n' + r.map(x => '- ' + x).join('\n') + '\n';
      t += '\n#### Veelgestelde vragen\n\n' + b.faq.map(f => '**' + f.v + '**\n' + f.a).join('\n\n') + '\n';
      if (b.bronnen.length) t += '\n#### Bronnen\n\n' + b.bronnen.map(([n, u, d]) => '- ' + n + ', ' + u + (d ? ', gelezen ' + d : '')).join('\n') + '\n';
      t += '\n';
    }
  }
  return t + '\n';
}

// voor de IndexNow-ronde: een pagina telt als gewijzigd als de inhoud verandert
export function bkIndex(slugs = BINNENKORT_SLUGS) {
  return slugs.map(s => BINNENKORT[s]).filter(Boolean).map(b => ({ pad: '/' + b.slug, versie: 'bk-' + b.datum + '-' + JSON.stringify(b).length }));
}
