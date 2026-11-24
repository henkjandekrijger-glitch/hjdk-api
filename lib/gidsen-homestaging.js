// Home staging op gids.kadoly.com (24 nov 2026, Henkjan: "zorg dat we gevonden worden met kadoly voor home staging stylisten etc maak voor
// iedere AI gap een stuk content ... Zorg dat we die winkels voorbij komen met content").
// Waarom: Demand Radar check "home staging" NL (24 nov): vier AI's (GPT, Gemini, Perplexity, Claude) noemen bij home staging alleen winkels
// (IKEA, JYSK, Kwantum, Leen Bakker, Xenos, fonQ, Loods 5, Westwing) en merken (HKliving, Riviera Maison), geen stylist en geen Kadoly.
// Gatscan kadoly-homestaging (hjdk-api /api/zicht?op=gapscan, Perplexity, 24 nov, 10 vragen): bij 8 van 10 geen enkele Nederlandse bron
// (Amerikaanse stagingsites), geen product en maar één keer een prijs. Zwakst: wat kost zelf doen (4,5), wat heb je nodig, welke accessoires,
// waar koop je spullen, zelf doen, woonkamer stylen, planten, waar kopen vastgoedstylisten (alle 3). Sterk (eigen NL-bronnen, funda, rtl):
// huis verkoopklaar maken en lege woning gezellig (1); die twee zijn hier een FAQ of een eigen invalshoek, geen kopie van funda.
// Eén pagina per eigen vraag (geen pagina per zoekvariant): accessoires, zelf doen, lege woning, planten en voor stylisten.
// Feiten: producten uit bestaande gidsen nemen hun gecontroleerde tekst mee ([bron, pid, label]); nieuwe producten (kunstplanten, spiegel,
// kussen) staan hier met wat de maker op de productpagina opgeeft (gelezen 24 nov via /api/gids?op=feiten). Elke pagina noemt bovenaan één
// eerste keus en heeft de vraag zoals iemand hem aan een AI stelt als eerste FAQ. Elke week dezelfde vragen opnieuw meten (zicht-proef).

const EIGEN = {
  spath: { pid: 'oc_4174003378864129', naam: 'Spathiphyllum kunstplant wit van Mica Decorations', waarom: 'Een kunstplant van 50 cm hoog en 40 cm breed met witte bloemen en groen blad, in een terracotta pot van 11,5 cm. Hij heeft geen water en geen licht nodig, dus hij ziet er bij elke bezichtiging hetzelfde uit.', beperking: 'De terracotta pot is klein en eenvoudig: zet hem in een overpot of mand. Hoe echt het blad van dichtbij oogt, zie je pas als hij er staat.' },
  ficus: { pid: 'oc_4174003371769857', naam: 'Ficus Natasja kunstplant in terracotta pot', waarom: '40 cm hoog en 30 cm breed, met blad in verschillende tinten groen. Klein genoeg voor een plank, vensterbank of dressoir.', beperking: 'Te laag om een lege hoek te vullen. Ook hier een kleine pot van 11,5 cm.' },
  boston: { pid: 'oc_4174003448692737', naam: 'Bostonvaren kunstplant in terracotta pot', waarom: '42 cm hoog en 50 cm breed, met gekrulde bladeren. Breder dan hoog: mooi op een bijzettafel, een kast of in een mand.', beperking: 'Op een smalle vensterbank past hij niet. De pot is 13,5 cm.' },
  raphis: { pid: 'oc_4174003512573953', naam: 'Raphis palm kunstplant, 150 cm', waarom: 'Een palm van 150 cm hoog en 60 cm breed die een lege hoek in één keer vult. Gemaakt van polyester, bamboe en plastic op een voet van cement, in een pot van 17 cm doorsnede.', beperking: 'Geleverd zonder sierpot of mand: reken op een overpot van minstens 17 cm. Duurder dan de kleine kunstplanten.' },
  spiegel: { pid: 'oc_4173958193758209', naam: 'Ronde rieten spiegel van 58 cm van Soeji', waarom: 'Handgemaakt op Java van riet, 58 cm doorsnede en 0,7 kilo. Een spiegel in de hal of tegenover een raam vangt licht en laat een kleine ruimte groter lijken.', beperking: 'Riet past bij een warme, natuurlijke stijl, minder bij strak en modern. Hoe je hem ophangt staat er niet bij.' },
  kussen: { pid: 'oc_4173958159581185', naam: 'Raffia sierkussen Gandi van Soeji', waarom: 'Handgemaakt op Java van raffia met een vulling van katoen en kokosvezel, in 40 bij 40 of 50 bij 50 cm, licht van kleur en met franjes.', beperking: 'De maker zegt niet of de hoes te wassen is. De prijs hoort bij één maat; kijk op de productpagina welke.' },
};

const CLUSTER = ['home-staging-accessoires', 'home-staging-zelf-doen', 'lege-woning-stylen', 'planten-home-staging', 'woonaccessoires-vastgoedstylisten'];
const KOZEN = 'We stelden tien vragen over home staging aan AI-assistenten en keken wat ze antwoorden. Ze noemen soorten spullen (kussens, plaids, lampen, spiegels, planten, manden) en grote woonwinkels, maar geen product, geen prijs en meestal geen Nederlandse bron. Hier staat per soort één product uit onze winkel, met wat de maker opgeeft en wat hij niet noemt. Kadoly verdient aan elke verkoop; dat verandert niets aan wat we als beperking noemen.';
const NIET_WETEN = { kop: 'Wat we niet weten', alineas: ['We hebben de producten niet zelf vastgehad en niet in een woning gezet. Alles hierboven rust op wat de maker opgeeft, en bij elk product staat wat de maker niet vermeldt. Of een woning sneller of duurder verkoopt door styling, hebben we niet gemeten.'] };

const HS = {
  'home-staging-accessoires': {
    titel: 'Home staging accessoires: wat zet je neer?',
    beschrijving: 'Welke accessoires gebruik je bij home staging? Per kamer wat je neerzet: plant, plaid, lamp, vaas en spiegel, met prijs en bezorgdag van vandaag.',
    kicker: 'Home staging · accessoires',
    h1: 'Home staging accessoires: wat zet je neer, per kamer?',
    kort: 'Begin met groen dat geen water nodig heeft: de Spathiphyllum kunstplant van Mica Decorations, 50 cm hoog met witte bloemen. Geef dan elke kamer één zachte laag en één lichtpunt: een plaid over de bank en een oplaadbare lamp waar geen stopcontact zit. Op de eettafel een vaas met takken, in de hal een spiegel. Houd het bij drie tot vijf dingen per kamer: kopers moeten de ruimte zien, niet je spullen. Zet niets met een sterke geur neer.',
    tips: [
      ['@spath', 'Eerste keus: groen zonder water'],
      ['wollen-deken', 'oc_4174003724075009', 'Zacht en licht op de bank'],
      ['@kussen', 'Kussen bij de plaid'],
      ['oplaadbare-tafellamp', 'oc_4173959228096513', 'Licht zonder snoer'],
      ['vaas-kiezen', 'oc_4173958203981825', 'Takken op tafel, geen water'],
      ['@spiegel', 'Licht en ruimte in de hal'],
      ['wollen-deken', 'oc_4174003736772610', 'Hotellook op bed'],
      ['manden', 'oc_4174003288948737', 'Mand voor een plant'],
      ['serviesset', 'oc_4174003336871938', 'Gedekte tafel voor vier'],
    ],
    tabelKop: 'Wat zet je neer in welke kamer?',
    tabel: [
      { situatie: 'Woonkamer', advies: 'Een plaid en één of twee kussens op de bank, een plant in de hoek en een lamp die aan staat.', pid: 'oc_4174003724075009' },
      { situatie: 'Eettafel', advies: 'Eén vaas met takken in het midden, of de tafel gedekt voor vier.', pid: 'oc_4173958203981825' },
      { situatie: 'Hal en entree', advies: 'Een spiegel, zodat de eerste meters licht en ruim ogen.', pid: 'oc_4173958193758209' },
      { situatie: 'Slaapkamer', advies: 'Een bedloper over het voeteneind en twee gelijke kussens: rustig, zoals in een hotel.', pid: 'oc_4174003736772610' },
      { situatie: 'Een donkere hoek zonder stopcontact', advies: 'Een oplaadbare lamp, zonder snoer in beeld.', pid: 'oc_4173959228096513' },
      { situatie: 'Overal waar het kaal oogt', advies: 'Een kunstplant: geen water, ook niet als je een week weg bent.', pid: 'oc_4174003378864129' },
      { situatie: 'Badkamer', advies: 'Alles van de wastafel af, één nieuwe handzeep en opgevouwen handdoeken. Verder niets kopen.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'kamer', vraag: 'Welke kamer wil je als eerste aanpakken?', opties: [['woon', 'Woonkamer'], ['eet', 'Eettafel'], ['slaap', 'Slaapkamer'], ['hal', 'Hal']] },
        { k: 'water', vraag: 'Kun je de komende weken planten water geven?', opties: [['ja', 'Ja'], ['nee', 'Nee, ik ben weinig thuis of de woning staat leeg']] },
      ],
      regels: [
        { id: 'woon-nee', als: { kamer: ['woon'], water: ['nee'] }, kop: 'De Spathiphyllum kunstplant', tekst: 'Groen in de woonkamer zonder water geven. Zet er de bouclé plaid bij op de bank.', pid: 'oc_4174003378864129' },
        { id: 'woon', als: { kamer: ['woon'] }, kop: 'De bouclé plaid Paris in ivoor', tekst: 'Over de leuning van de bank, met één kussen ervoor. Licht van kleur, dus rustig in beeld.', pid: 'oc_4174003724075009' },
        { id: 'eet', als: { kamer: ['eet'] }, kop: 'De geweven vaas Sakra met takken', tekst: '56 cm hoog, voor droge takken of pluimen: geen water nodig.', pid: 'oc_4173958203981825' },
        { id: 'slaap', als: { kamer: ['slaap'] }, kop: 'De wollen bedloper', tekst: '130 bij 250 cm over het voeteneind: het bed ziet er opgemaakt uit.', pid: 'oc_4174003736772610' },
        { id: 'hal', als: { kamer: ['hal'] }, kop: 'De ronde rieten spiegel van 58 cm', tekst: 'Vangt het licht in de hal. Ophangen doe je met een eigen haakje.', pid: 'oc_4173958193758209' },
      ],
    },
    uitleg: [
      { kop: 'Hoeveel accessoires zet je neer?', alineas: [
        'Minder dan je denkt. Een koper moet kunnen zien hoe groot de kamer is en waar zijn eigen bank zou staan. Drie tot vijf dingen per kamer is genoeg: iets zachts (plaid, kussen), iets levends of groens, licht en één ding op tafel.',
        'Ruim eerst op en kijk dan wat ontbreekt. Meestal is dat geen nieuw meubel, maar een plaid, een plant en een lamp.',
      ] },
      { kop: 'Welke kleuren werken?', alineas: [
        'Rustige kleuren die bij elk interieur passen: wit, ivoor, beige, zacht groen en naturel hout. Eén kleuraccent per kamer is genoeg. Op foto\'s valt een felle kleur meer op dan de kamer zelf.',
      ] },
      { kop: 'Wat haal je weg?', alineas: [
        'Foto\'s, verzamelingen, magneten op de koelkast, snoeren en alles wat op het aanrecht staat. Ook sterke geuren: niet iedereen houdt van een geurkaars of geurstokjes, en een bezoeker kan denken dat je iets wilt verbergen.',
      ] },
      NIET_WETEN,
    ],
    zoKozenWe: KOZEN,
    faq: [
      { v: 'Welke accessoires gebruik je bij home staging?', a: 'Per kamer drie tot vijf: een plaid en een kussen op de bank, een plant, een lamp, een vaas of schaal op tafel en een spiegel in de hal. Onze eerste keus is de Spathiphyllum kunstplant van Mica Decorations: groen zonder water geven.' },
      { v: 'Wat heb je nodig voor home staging?', a: 'Eerst opruimspullen: dozen en manden om persoonlijke spullen op te bergen. Daarna weinig: een plaid, een plant of kunstplant, een lamp en een vaas. De rest heb je vaak al in huis.' },
      { v: 'Moet je voor home staging nieuwe spullen kopen?', a: 'Nee. Begin met wat je hebt en koop alleen wat ontbreekt. Neutrale spullen als een plaid of een lamp neem je daarna mee naar je nieuwe huis.' },
      { v: 'Welke kleuren gebruik je bij home staging?', a: 'Wit, ivoor, beige, zacht groen en naturel hout, met hooguit één kleuraccent per kamer.' },
      { v: 'Zijn kunstplanten goed voor home staging?', a: 'Ja, als de woning leeg staat of je weinig thuis bent: ze hebben geen water nodig en zien er bij elke bezichtiging hetzelfde uit. Woon je er nog, dan is een echte bloeiende plant op tafel ook mooi.' },
    ],
  },

  'home-staging-zelf-doen': {
    titel: 'Home staging zelf doen: waar begin je?',
    beschrijving: 'Home staging zelf doen in vijf stappen: opruimen, schoonmaken, meubels, aankleden en de dag van de bezichtiging. Met wat het kost en wat je koopt.',
    kicker: 'Home staging · zelf doen',
    h1: 'Home staging zelf doen: waar begin je, en wat kost het?',
    kort: 'Begin met wegdoen, niet met kopen: ruim per kamer de persoonlijke spullen op en haal de helft weg van wat op tafels en kasten staat. Maak daarna schoon en herstel kleine dingen. Pas dan koop je wat ontbreekt, en dat is meestal weinig: een plaid, een plant en een lamp. Koop je maar één ding, neem dan de Spathiphyllum kunstplant van Mica Decorations: groen dat er bij elke bezichtiging hetzelfde uitziet. Zelf doen kost vooral tijd; bij elk product staat de prijs van vandaag inclusief btw en verzending.',
    tips: [
      ['@spath', 'Koop je één ding, dan dit'],
      ['manden', 'oc_4173958174097409', 'Opruimen: mand met deksel'],
      ['manden', 'oc_4173958214451201', 'Opruimen: mand voor de kast'],
      ['wollen-deken', 'oc_4174003724075009', 'Plaid voor de bank'],
      ['oplaadbare-tafellamp', 'oc_4173959228096513', 'Licht in een donkere hoek'],
      ['orchidee-cadeau', 'oc_4173958884671489', 'Bloeiend op tafel als je er woont'],
      ['vaas-kiezen', 'oc_4173958203981825', 'Vaas voor takken'],
    ],
    tabelKop: 'Waar begin je, bij welke situatie?',
    tabel: [
      { situatie: 'Het huis staat vol', advies: 'Eerst opruimen: berg per kamer de helft weg in manden met een deksel of in dozen.', pid: 'oc_4173958174097409' },
      { situatie: 'Het huis oogt kaal of koud', advies: 'Een plaid op de bank en een plant in de hoek.', pid: 'oc_4174003724075009' },
      { situatie: 'Het huis is donker', advies: 'Gordijnen open, alle lampen aan en een oplaadbare lamp waar geen stopcontact zit.', pid: 'oc_4173959228096513' },
      { situatie: 'Je woont er nog', advies: 'Een bloeiende orchidee op tafel en een kast waar je in vijf minuten alles in kwijt kunt.', pid: 'oc_4173958884671489' },
      { situatie: 'Je bent weinig thuis', advies: 'Kunstplanten: geen water geven.', pid: 'oc_4174003378864129' },
      { situatie: 'Krap budget', advies: 'Niets kopen. Opruimen, schoonmaken, lampen aan en de meubels anders zetten doet het meeste.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'staat', vraag: 'Hoe ziet je huis er nu uit?', opties: [['vol', 'Te vol'], ['kaal', 'Kaal of koud'], ['donker', 'Donker'], ['goed', 'Eigenlijk best goed']] },
        { k: 'thuis', vraag: 'Woon je er nog tijdens de verkoop?', opties: [['ja', 'Ja'], ['nee', 'Nee']] },
      ],
      regels: [
        { id: 'vol', als: { staat: ['vol'] }, kop: 'Eerst opruimen, niets kopen', tekst: 'Berg per kamer de helft weg. Een mand met deksel helpt om het snel en netjes te doen.', pid: 'oc_4173958174097409' },
        { id: 'kaal-nee', als: { staat: ['kaal'], thuis: ['nee'] }, kop: 'De Spathiphyllum kunstplant', tekst: 'Groen dat geen water nodig heeft. Zet er een plaid bij op de bank.', pid: 'oc_4174003378864129' },
        { id: 'kaal', als: { staat: ['kaal'] }, kop: 'De bouclé plaid Paris', tekst: 'Over de bank, met een plant in de hoek.', pid: 'oc_4174003724075009' },
        { id: 'donker', als: { staat: ['donker'] }, kop: 'De oplaadbare lamp van Tavellio', tekst: 'Licht waar geen stopcontact is. Doe bij de bezichtiging ook alle andere lampen aan.', pid: 'oc_4173959228096513' },
        { id: 'goed-ja', als: { staat: ['goed'], thuis: ['ja'] }, kop: 'Een bloeiende orchidee op tafel', tekst: 'Meer hoeft niet. Ruim voor elke bezichtiging het aanrecht en de badkamer leeg.', pid: 'oc_4173958884671489' },
        { id: 'goed', als: { staat: ['goed'] }, kop: 'Je hoeft bijna niets te kopen', tekst: 'Schoonmaken, lampen aan en ventileren voor elke bezichtiging. Wil je toch één ding: een kunstplant.', pid: 'oc_4174003378864129' },
      ],
    },
    uitleg: [
      { kop: 'Stap 1: opruimen', alineas: [
        'Haal persoonlijke spullen weg: foto\'s, verzamelingen, papieren, speelgoed. Haal daarna de helft weg van wat op tafels, kasten en het aanrecht staat. Begin met de woonkamer, de keuken en de grootste slaapkamer: daar kijken kopers het langst.',
      ] },
      { kop: 'Stap 2: schoonmaken en kleine dingen maken', alineas: [
        'Ramen, voegen, de keuken en de badkamer. Vervang kapotte lampjes, draai losse deurklinken vast en verf een vlek op de muur bij. Dat kost weinig en een koper ziet het als eerste.',
      ] },
      { kop: 'Stap 3: meubels', alineas: [
        'Haal meubels weg die een looproute blokkeren. Zet de bank zo dat je de kamer in kijkt, niet met de rug naar de deur. Een kamer met minder meubels oogt groter.',
      ] },
      { kop: 'Stap 4: aankleden', alineas: [
        'Nu pas kopen, en alleen wat ontbreekt: per kamer iets zachts, iets groens, licht en één ding op tafel. Kies neutrale kleuren, zodat je het daarna in je nieuwe huis gebruikt.',
      ] },
      { kop: 'Stap 5: de dag van de bezichtiging', alineas: [
        'Gordijnen open, alle lampen aan, een half uur ventileren en geen sterke geur. Afwas weg, bed opgemaakt, huisdierspullen uit het zicht.',
      ] },
      { kop: 'Wat kost home staging als je het zelf doet?', alineas: [
        'Opruimen, schoonmaken, meubels verschuiven en lampen aandoen kost niets behalve tijd, en dat doet het meeste. Wat je koopt bepaalt de rest. Houd het bij hooguit drie dingen per kamer en tel de prijzen op deze pagina op; die zijn van vandaag, inclusief btw en verzending. Een stylist inhuren kost meer, omdat je dan ook voor de uren en het lenen van meubels betaalt.',
      ] },
      NIET_WETEN,
    ],
    zoKozenWe: KOZEN,
    faq: [
      { v: 'Home staging zelf doen, waar begin ik?', a: 'Met opruimen: persoonlijke spullen weg en de helft van wat op tafels en kasten staat. Daarna schoonmaken en kleine dingen maken, dan de meubels, en pas als laatste kopen wat ontbreekt.' },
      { v: 'Wat kost home staging als je het zelf doet?', a: 'Opruimen en schoonmaken kost alleen tijd. Wat je koopt bepaalt de rest: houd het bij hooguit drie dingen per kamer, zoals een plaid, een plant en een lamp. Bij elk product op deze pagina staat de prijs van vandaag inclusief btw en verzending.' },
      { v: 'Hoe maak ik mijn huis verkoopklaar voor bezichtigingen?', a: 'Ruim op, maak schoon, herstel kleine dingen en zet meubels zo dat er een vrije looproute is. Op de dag zelf: gordijnen open, lampen aan, ventileren en geen sterke geuren.' },
      { v: 'Wat koop je als je maar één ding koopt?', a: 'Een plant. Woon je er nog, een bloeiende orchidee op tafel. Staat de woning leeg, de Spathiphyllum kunstplant van Mica Decorations, die geen water nodig heeft.' },
      { v: 'Moet ik een stylist inhuren?', a: 'Niet als je tijd hebt en het huis al redelijk op orde is. Een stylist helpt bij een lege woning, als je ver weg woont of als je niet weet waar je moet beginnen.' },
    ],
  },

  'lege-woning-stylen': {
    titel: 'Lege woning stylen voor de bezichtiging',
    beschrijving: 'Hoe maak je een lege woning gezellig voor een bezichtiging? Per kamer wat je neerzet, zonder water geven en zonder snoeren, met prijs van vandaag.',
    kicker: 'Home staging · lege woning',
    h1: 'Lege woning stylen: hoe maak je hem gezellig voor de bezichtiging?',
    kort: 'Een lege kamer oogt kleiner en kouder dan hij is. Zet per kamer één ding neer dat laat zien wat de ruimte is, en één ding dat warmte geeft. Onze eerste keus voor een lege woonkamer is de Raphis palm kunstplant van 150 cm: hij vult een hoek, heeft geen water nodig en ziet er na weken leegstand nog hetzelfde uit. Zet er een oplaadbare lamp bij, zodat je geen snoeren of stopcontacten nodig hebt. Geen echte planten en geen kaarsen: er is niemand die water geeft of oplet.',
    tips: [
      ['@raphis', 'Eerste keus: vult een lege hoek'],
      ['oplaadbare-tafellamp', 'oc_4173959243857921', 'Langste batterij'],
      ['bijzettafel', 'oc_4174003309559809', 'Licht om mee te nemen'],
      ['vaas-kiezen', 'oc_4174003330154497', 'Groot, voor droge takken'],
      ['@spiegel', 'Licht in de hal'],
      ['wollen-deken', 'oc_4174003724075009', 'Over een stoel of bank'],
      ['@boston', 'Groen op een bijzettafel'],
      ['wollen-deken', 'oc_4174003736772610', 'Als er een bed staat'],
    ],
    tabelKop: 'Wat zet je in welke lege kamer?',
    tabel: [
      { situatie: 'Lege woonkamer', advies: 'Een grote kunstplant in de hoek, een bijzettafel met een lamp en, als het kan, een bank of twee stoelen.', pid: 'oc_4174003512573953' },
      { situatie: 'Donker in de winter', advies: 'Oplaadbare lampen op tafels en vensterbanken, zodat het bij een bezichtiging om vijf uur al licht is.', pid: 'oc_4173959243857921' },
      { situatie: 'Lege hal', advies: 'Een spiegel aan de muur: de eerste meters ogen lichter.', pid: 'oc_4173958193758209' },
      { situatie: 'Lege slaapkamer', advies: 'Staat er een bed, dan een bedloper over het voeteneind. Staat er niets, laat de kamer dan leeg en schoon: dan ziet een koper de maat.', pid: 'oc_4174003736772610' },
      { situatie: 'Lege eetkamer', advies: 'Een grote vaas met droge takken op de vloer of in de vensterbank.', pid: 'oc_4174003330154497' },
      { situatie: 'Geen meubels en geen budget', advies: 'Schoonmaken, alle lampen in en aan, gordijnen open. Een lege, schone kamer is beter dan een halfvolle.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'meubels', vraag: 'Staan er nog meubels in de woning?', opties: [['geen', 'Nee, helemaal leeg'], ['wat', 'Een paar'], ['vol', 'Bijna alles staat er nog']] },
        { k: 'licht', vraag: 'Is de woning donker?', opties: [['ja', 'Ja, of bezichtigingen zijn \'s avonds'], ['nee', 'Nee']] },
      ],
      regels: [
        { id: 'licht', als: { licht: ['ja'] }, kop: 'De Milou oplaadbare lamp', tekst: 'De grootste batterij van onze oplaadbare lampen: licht zonder snoer, ook als de stroom van een lege woning eraf is.', pid: 'oc_4173959243857921' },
        { id: 'geen', als: { meubels: ['geen'] }, kop: 'De Raphis palm kunstplant van 150 cm', tekst: 'Vult een hoek van de woonkamer en heeft geen water nodig. Reken op een overpot van minstens 17 cm.', pid: 'oc_4174003512573953' },
        { id: 'wat', als: { meubels: ['wat'] }, kop: 'De bouclé plaid Paris', tekst: 'Over de bank of een stoel die er nog staat, met een kunstplant ernaast.', pid: 'oc_4174003724075009' },
        { id: 'vol', als: { meubels: ['vol'] }, kop: 'Dan is het geen lege woning', tekst: 'Kijk bij home staging zelf doen: eerst opruimen, dan pas aankleden.', pid: '' },
      ],
    },
    uitleg: [
      { kop: 'Waarom een lege woning stylen?', alineas: [
        'In een lege kamer heb je niets om de maat aan af te lezen. Een bank, een plant of een tafel laat zien hoe groot de kamer is en waarvoor hij dient. Eén of twee dingen per kamer is genoeg.',
      ] },
      { kop: 'Geen echte planten en geen kaarsen', alineas: [
        'In een woning waar niemand woont, krijgen planten geen water en kan niemand op een brandende kaars letten. Kies kunstplanten en lampen op een batterij. Een oplaadbare lamp werkt ook als de stroom van de woning is afgesloten.',
      ] },
      { kop: 'Meubels huren of zelf neerzetten?', alineas: [
        'Er zijn bedrijven die meubels verhuren voor de verkoopperiode, vaak via een stylist. Accessoires als een plant, een lamp en een plaid zet je ook zelf neer en neem je daarna mee.',
      ] },
      NIET_WETEN,
    ],
    zoKozenWe: KOZEN,
    faq: [
      { v: 'Hoe maak je een lege woning gezellig voor een bezichtiging?', a: 'Zet per kamer één ding neer dat de functie laat zien en één ding dat warmte geeft. Onze eerste keus voor een lege woonkamer is de Raphis palm kunstplant van 150 cm, met een oplaadbare lamp ernaast.' },
      { v: 'Moet je een lege woning stylen?', a: 'Het helpt: zonder meubels zie je moeilijk hoe groot een kamer is. Eén of twee dingen per kamer is genoeg. Een lege, schone kamer is beter dan een halfvolle.' },
      { v: 'Kun je kaarsen aansteken in een lege woning?', a: 'Liever niet: er is niemand die oplet. Kies een oplaadbare lamp of een led-kaars.' },
      { v: 'Welke planten zet je in een lege woning?', a: 'Kunstplanten, omdat niemand water geeft. Voor een hoek de Raphis palm van 150 cm, voor een tafel de Bostonvaren of de Spathiphyllum.' },
    ],
  },

  'planten-home-staging': {
    titel: 'Planten bij home staging: echt of kunst?',
    beschrijving: 'Welke planten gebruik je bij home staging? Echte planten als je er woont, kunstplanten als de woning leeg staat. Per plek de juiste plant met prijs.',
    kicker: 'Home staging · planten',
    h1: 'Welke planten gebruik je bij home staging: echt of kunst?',
    kort: 'Woon je er nog en kun je water geven, zet dan een bloeiende orchidee op tafel: de plantenset Gradience met een orchidee en een vetplant. Staat de woning leeg of ben je weinig thuis, kies dan kunst. Onze eerste keus is de Spathiphyllum kunstplant van 50 cm voor een tafel of dressoir. Voor een lege hoek de Raphis palm van 150 cm, voor een plank de Ficus Natasja van 40 cm. Kies groen en wit: felle bloemen trekken de aandacht weg van de kamer.',
    tips: [
      ['@spath', 'Eerste keus: tafel of dressoir'],
      ['orchidee-cadeau', 'oc_4173958884671489', 'Echt en bloeiend, als je er woont'],
      ['@raphis', 'Lege hoek'],
      ['@ficus', 'Plank of vensterbank'],
      ['@boston', 'Breed, op een bijzettafel'],
      ['orchidee-cadeau', 'oc_4173958836879361', 'Eén witte orchidee, klassiek'],
      ['bloempot-binnen', 'oc_4174003502546945', 'Overpot met binnenpot'],
      ['manden', 'oc_4174003288948737', 'Mand om de pot'],
    ],
    tabelKop: 'Welke plant op welke plek?',
    tabel: [
      { situatie: 'Op de eettafel, je woont er nog', advies: 'Een bloeiende orchidee: mooi en weinig werk.', pid: 'oc_4173958884671489' },
      { situatie: 'Op tafel of dressoir, de woning staat leeg', advies: 'De Spathiphyllum kunstplant met witte bloemen.', pid: 'oc_4174003378864129' },
      { situatie: 'Een lege hoek van de woonkamer', advies: 'De Raphis palm kunstplant van 150 cm.', pid: 'oc_4174003512573953' },
      { situatie: 'Een plank, vensterbank of badkamer', advies: 'De Ficus Natasja kunstplant van 40 cm.', pid: 'oc_4174003371769857' },
      { situatie: 'De pot is lelijk', advies: 'Zet de plant in een overpot of mand. Meet eerst de pot.', pid: 'oc_4174003502546945' },
      { situatie: 'Verse bloemen', advies: 'Een klein boeket zonder sterke geur, bij de entree of op tafel. Na een week vervangen.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'water', vraag: 'Kun je de komende weken water geven?', opties: [['ja', 'Ja, ik woon er'], ['nee', 'Nee']] },
        { k: 'plek', vraag: 'Waar komt de plant?', opties: [['tafel', 'Op tafel of dressoir'], ['hoek', 'In een lege hoek'], ['plank', 'Op een plank of vensterbank']] },
      ],
      regels: [
        { id: 'ja-tafel', als: { water: ['ja'], plek: ['tafel'] }, kop: 'De plantenset Gradience', tekst: 'Een orchidee en een vetplant in keramieken potten: bloeiend en compleet.', pid: 'oc_4173958884671489' },
        { id: 'hoek', als: { plek: ['hoek'] }, kop: 'De Raphis palm kunstplant van 150 cm', tekst: 'Een echte plant van die maat moet je water en licht geven; deze niet. Reken op een overpot van minstens 17 cm.', pid: 'oc_4174003512573953' },
        { id: 'plank', als: { plek: ['plank'] }, kop: 'De Ficus Natasja kunstplant', tekst: '40 cm hoog: past op een plank of vensterbank.', pid: 'oc_4174003371769857' },
        { id: 'tafel', als: { plek: ['tafel'] }, kop: 'De Spathiphyllum kunstplant', tekst: 'Wit en groen, 50 cm hoog, geen water nodig.', pid: 'oc_4174003378864129' },
      ],
    },
    uitleg: [
      { kop: 'Echte plant of kunstplant?', alineas: [
        'Een echte plant ruikt en leeft, maar hangt slap als hij een week geen water krijgt. Woon je er tijdens de verkoop, dan is een bloeiende plant op tafel mooi. Staat de woning leeg, of ben je vaak weg, kies dan kunst: die ziet er bij de laatste bezichtiging hetzelfde uit als bij de eerste.',
      ] },
      { kop: 'Hoeveel planten?', alineas: [
        'Eén of twee per kamer. Een vensterbank vol plantjes oogt rommelig; één grote plant in een hoek oogt rustig en laat zien hoe hoog de kamer is.',
      ] },
      { kop: 'Welke kleur?', alineas: [
        'Groen en wit passen overal. Felle bloemen trekken de aandacht, en de koper moet naar de kamer kijken.',
      ] },
      NIET_WETEN,
    ],
    zoKozenWe: KOZEN,
    faq: [
      { v: 'Welke planten en bloemen gebruik je bij home staging?', a: 'Groen en wit, één of twee per kamer. Woon je er, een bloeiende orchidee op tafel. Staat de woning leeg, kunstplanten: onze eerste keus is de Spathiphyllum kunstplant van 50 cm, voor een lege hoek de Raphis palm van 150 cm.' },
      { v: 'Zijn kunstplanten goed voor home staging?', a: 'Ja, vooral in een lege woning: geen water, en bij elke bezichtiging zien ze er hetzelfde uit.' },
      { v: 'Welke plant zet je in een lege hoek?', a: 'Een hoge plant van 120 cm of meer. De Raphis palm kunstplant is 150 cm hoog en 60 cm breed.' },
      { v: 'Zet je verse bloemen neer bij een bezichtiging?', a: 'Een klein boeket zonder sterke geur kan, bij de entree of op tafel. Vervang het na een week.' },
    ],
  },

  'woonaccessoires-vastgoedstylisten': {
    titel: 'Woonaccessoires voor vastgoedstylisten',
    beschrijving: 'Waar kopen vastgoedstylisten hun woonaccessoires, en wat gaat mee van woning naar woning? Kunstplanten, oplaadbare lampen, vazen en plaids met prijs.',
    kicker: 'Home staging · voor stylisten',
    h1: 'Woonaccessoires voor vastgoedstyling: wat gaat mee van woning naar woning?',
    kort: 'Een stylist zet dezelfde spullen in veel woningen neer. Kies dus wat geen water of stopcontact nodig heeft, tegen vervoer kan en in elk interieur past. Onze eerste keus is de Spathiphyllum kunstplant van Mica Decorations: wit en groen, 50 cm, geen water. Daarnaast oplaadbare lampen, vazen van riet of bananenvezel voor droge takken, neutrale plaids en manden met een deksel om alles in te vervoeren. Kadoly is een webwinkel met prijzen inclusief btw en verzending, geen groothandel.',
    tips: [
      ['@spath', 'Eerste keus: past overal, geen water'],
      ['@raphis', 'Voor de lege hoek'],
      ['oplaadbare-tafellamp', 'oc_4173959228096513', 'Lamp zonder snoer, met kap'],
      ['oplaadbare-tafellamp', 'oc_4173959243857921', 'Langste batterij'],
      ['vaas-kiezen', 'oc_4173958203981825', 'Hoge vaas, geen water'],
      ['wollen-deken', 'oc_4174003724075009', 'Neutrale plaid'],
      ['@kussen', 'Kussen in naturel'],
      ['manden', 'oc_4173958174097409', 'Mand met deksel, ook om te vervoeren'],
      ['@spiegel', 'Spiegel voor de hal'],
    ],
    tabelKop: 'Wat gaat mee van woning naar woning?',
    tabel: [
      { situatie: 'Groen in elke woning', advies: 'Kunstplanten in twee maten: één voor tafels, één voor hoeken.', pid: 'oc_4174003378864129' },
      { situatie: 'Licht zonder stopcontact', advies: 'Oplaadbare lampen; laad ze op tussen twee stylings.', pid: 'oc_4173959243857921' },
      { situatie: 'Iets op tafel', advies: 'Een hoge vaas van bananenvezel met droge takken: niets dat lekt of verwelkt.', pid: 'oc_4173958203981825' },
      { situatie: 'Zacht op de bank', advies: 'Een plaid in ivoor of beige, die bij elke bank past.', pid: 'oc_4174003724075009' },
      { situatie: 'Vervoer en opslag', advies: 'Manden met deksel: om accessoires in te vervoeren, en in de woning als opbergmand.', pid: 'oc_4173958174097409' },
    ],
    check: {
      vragen: [
        { k: 'last', vraag: 'Wat is het lastigst bij je stylings?', opties: [['groen', 'Planten die verwelken'], ['licht', 'Donkere kamers en geen stroom'], ['vervoer', 'Alles heen en weer slepen']] },
      ],
      regels: [
        { id: 'groen', als: { last: ['groen'] }, kop: 'De Spathiphyllum kunstplant', tekst: 'Geen water en geen licht nodig. Voor hoeken de Raphis palm van 150 cm.', pid: 'oc_4174003378864129' },
        { id: 'licht', als: { last: ['licht'] }, kop: 'De Milou oplaadbare lamp', tekst: 'De grootste batterij van onze oplaadbare lampen.', pid: 'oc_4173959243857921' },
        { id: 'vervoer', als: { last: ['vervoer'] }, kop: 'De Garut wasmand met deksel', tekst: 'Drie maten, met handvat: vervoer de kleine spullen erin en laat hem in de woning staan.', pid: 'oc_4173958174097409' },
      ],
    },
    uitleg: [
      { kop: 'Waar kopen vastgoedstylisten hun woonaccessoires?', alineas: [
        'Op meer plekken tegelijk: bij groothandels met een zakelijk account, bij woonwinkels en webwinkels, in kringloopwinkels voor iets met karakter, en grote meubels huren ze vaak. Voor de spullen die in elke woning terugkomen, letten ze op drie dingen: geen onderhoud, makkelijk te vervoeren en neutraal van kleur.',
      ] },
      { kop: 'Wat gaat mee, en wat koop je per woning?', alineas: [
        'Kunstplanten, lampen, vazen, plaids, manden en spiegels gaan mee van woning naar woning. Wat per woning verschilt, is de kleur van één accent: een kussen of een plaid die past bij de vloer of de muur.',
      ] },
      { kop: 'Zakelijk bestellen bij Kadoly', alineas: [
        'Kadoly is een webwinkel, geen groothandel: de prijzen zijn inclusief btw en verzending en je kunt binnen 14 dagen gratis retourneren. Bij elk product staat de bezorgdag als je vandaag bestelt. Bestel je vaker of meer tegelijk, stuur Henkjan dan een WhatsApp.',
      ] },
      NIET_WETEN,
    ],
    zoKozenWe: KOZEN,
    faq: [
      { v: 'Waar kopen vastgoedstylisten hun woonaccessoires?', a: 'Bij groothandels met een zakelijk account, woonwinkels en webwinkels en in kringloopwinkels; grote meubels huren ze vaak. Voor wat in elke woning terugkomt, kiezen ze spullen zonder onderhoud: kunstplanten, oplaadbare lampen, vazen voor droge takken, plaids en manden.' },
      { v: 'Welke accessoires heeft een vastgoedstylist altijd bij zich?', a: 'Kunstplanten in twee maten, oplaadbare lampen, een paar vazen met droge takken, neutrale plaids en kussens, en manden om het in te vervoeren.' },
      { v: 'Is Kadoly een groothandel?', a: 'Nee, een webwinkel. De prijzen zijn inclusief btw en verzending. Bestel je vaker, stuur Henkjan een WhatsApp.' },
      { v: 'Waarom kunstplanten bij vastgoedstyling?', a: 'Een woning staat vaak weken te koop en niemand geeft water. Een kunstplant ziet er bij de laatste bezichtiging hetzelfde uit als bij de eerste.' },
    ],
  },
};

// Bouwt de gidsen in het formaat van lib/gidsen-kadoly.js. G = de bestaande gidsen (bron van de feiten per product).
export function homeStaging(G, dag = '2026-11-24') {
  const uit = {};
  for (const [slug, t] of Object.entries(HS)) {
    const keuze = []; const gezien = new Set();
    for (const tip of t.tips) {
      let k, bron = '', label;
      if (tip[0].startsWith('@')) { k = EIGEN[tip[0].slice(1)]; label = tip[1]; }
      else { bron = tip[0]; label = tip[2]; k = ((G[bron] && G[bron].keuze) || []).find(x => x.pid === tip[1]); }
      if (!k || !k.pid || gezien.has(k.pid)) continue;
      gezien.add(k.pid); keuze.push({ pid: k.pid, label, naam: k.naam, waarom: k.waarom, beperking: k.beperking, bron });
    }
    if (keuze.length < 4) continue; // te weinig feiten: geen dunne pagina
    const { tips, ...rest } = t;
    uit[slug] = Object.assign({ slug }, rest, { keuze, homestaging: true, cluster: CLUSTER.filter(s => s !== slug), bijgewerkt: t.bijgewerkt || dag });
  }
  return uit;
}
export const HS_SLUGS = Object.keys(HS);
export const HS_VRAGEN = Object.fromEntries(Object.entries(HS).map(([s, t]) => [s, t.faq[0].v])); // de vraag zoals iemand hem aan een AI stelt
