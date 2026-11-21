// Cadeautips op gids.kadoly.com (21 nov 2026, Henkjan: "Bouw jij de paginas vast en kijk goed naar demandradar voor kansen").
// Waarom deze vijf: Demand Radar (hjdk-api /api/gids?op=vraagkansen, NL+BE, gemiddeld per maand over 12 maanden, in nov-dec):
//   cadeau voor man/hem 193.009 (nov-dec 337.805): cadeaus voor mannen 22.542, cadeautips mannen 14.075, cadeau voor hem 14.017
//   cadeau voor vrouw/haar 156.456 (nov-dec 252.165): cadeautips voor haar 13.058, cadeau voor haar 12.725, cadeaubox voor haar 12.233
//   kerstcadeau 40.540 (nov-dec 132.595), kerstcadeau voor vrouw 27.127 (76.550), voor man 24.192 (73.200)
//   cadeau voor moeder 89.910 (moeder cadeautje 30.358, moeder cadeau 30.125)
//   housewarming / nieuwe woning 21.800 (cadeau voor housewarming 6.625): past het best bij wat Kadoly verkoopt (wonen) en is het hele jaar
// Geen van deze onderwerpen had een gids (actie cadeaugids of gids aanscherpen). AI-gat, eigen meting zonder webzoeken: op "wat is een goed
// cadeau voor haar/hem" noemt een AI-assistent categorieën (verzorging, kaarsen, sokken, een ervaring) zonder winkel en zonder eerste keus.
// Hier staat het antwoord met een eerste keus, een tabel per situatie en een check die ook kan afraden.
// Werkwijze: elke tip is een keuze uit een bestaande gids op deze site, met dezelfde feiten (naam, waarom, beperking) die daar al gecontroleerd
// zijn; alleen het label is nieuw. Valt een product weg, dan verdwijnt het hier vanzelf (de pagina toont alleen leverbare producten).

const TIPS = {
  'cadeau-voor-haar': {
    titel: 'Cadeau voor haar: cadeautips per situatie',
    beschrijving: 'Cadeaus voor haar uit onze winkel: verwennen, warm, sfeer in huis of iets levends. Met wat erin zit, voor wie het niet past en een snelle check.',
    kicker: 'Cadeautips · voor haar',
    h1: 'Cadeau voor haar: welk cadeau past bij haar?',
    kort: 'Houdt ze van een avond in bad, kies de badset Den en Winterbessen: badolie, lotion, een geurkaars, een spiegeltje en een massagestick in een houten doos. Klein budget of schoencadeautje: de dames alpacasokken met rendier. Houdt ze van sfeer in huis, kies de dip dye kaarsen of een tafelhaard. Iets levends: de plantenset met orchidee en vetplant. Heeft ze een gevoelige huid, kies dan geen geurset als verrassing.',
    tips: [
      ['badset-cadeau', 'oc_4173959373897729', 'Verwenavond, meeste in de doos'],
      ['schoencadeautjes-sinterklaas', 'oc_4173959369080833', 'Klein budget, warm'],
      ['kaarsen-cadeau', 'oc_4174005828042753', 'Sfeer op tafel'],
      ['orchidee-cadeau', 'oc_4173958884671489', 'Iets levends'],
      ['wollen-deken', 'oc_4174003724075009', 'Voor op de bank'],
      ['oplaadbare-tafellamp', 'oc_4173959228096513', 'Licht zonder snoer'],
      ['tafelhaard', 'oc_4174002164744193', 'Vuur op tafel'],
      ['badset-cadeau', 'oc_4174002222333954', 'Zonder bad, voor de handen'],
      ['schoencadeautjes-sinterklaas', 'oc_4173959358431233', 'Klein en praktisch'],
    ],
    tabelKop: 'Welk cadeau past bij haar?',
    tabel: [
      { situatie: 'Ze houdt van een avond in bad', advies: 'De badset Den en Winterbessen: de meeste spullen in één doos.', pid: 'oc_4173959373897729' },
      { situatie: 'Klein budget of een schoencadeautje', advies: 'De dames alpacasokken met rendier, 2 paar.', pid: 'oc_4173959369080833' },
      { situatie: 'Ze maakt het graag gezellig in huis', advies: 'De dip dye kaarsenset voor op tafel.', pid: 'oc_4174005828042753' },
      { situatie: 'Ze heeft graag planten', advies: 'De plantenset met orchidee en vetplant.', pid: 'oc_4173958884671489' },
      { situatie: 'Lange avonden op de bank', advies: 'De bouclé plaid Paris in ivoor.', pid: 'oc_4174003724075009' },
      { situatie: 'Een collega of de buurvrouw', advies: 'Een handverzorgingsset, als geur en ingrediënten passen.', pid: 'oc_4174002222333954' },
      { situatie: 'Gevoelige huid, eczeem of parfumallergie', advies: 'Geen geurset als verrassing: vraag eerst wat ze kan gebruiken, of kies sokken, een plaid of een lamp.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'huid', vraag: 'Heeft ze een gevoelige huid of kan ze niet tegen parfum?', opties: [['nee', 'Nee'], ['ja', 'Ja'], ['weet', 'Weet ik niet']] },
        { k: 'wat', vraag: 'Waar houdt ze het meest van?', opties: [['verwen', 'Verwend worden'], ['sfeer', 'Sfeer in huis'], ['planten', 'Planten'], ['warm', 'Het warm hebben']] },
        { k: 'budget', vraag: 'Hoe groot is het cadeau?', opties: [['klein', 'Klein, voor in de schoen'], ['gewoon', 'Een echt cadeau']] },
      ],
      regels: [
        { id: 'klein', als: { budget: ['klein'] }, kop: 'De dames alpacasokken met rendier', tekst: 'Twee paar, warm en feestelijk, en ze passen in een schoen.', pid: 'oc_4173959369080833' },
        { id: 'huid-verwen', als: { huid: ['ja', 'weet'], wat: ['verwen'] }, kop: 'Liever geen geurset als verrassing', tekst: 'Bij de verzorgingssets vonden we online geen volledige ingrediëntenlijst. Verwen haar met iets zonder huidproduct: de bouclé plaid of de oplaadbare lamp.', pid: 'oc_4174003724075009' },
        { id: 'verwen', als: { wat: ['verwen'] }, kop: 'De badset Den en Winterbessen', tekst: 'Badolie, lotion, een geurkaars, een spiegeltje en een massagestick in een houten doos. Heeft ze geen bad, kies dan een handverzorgingsset.', pid: 'oc_4173959373897729' },
        { id: 'sfeer', als: { wat: ['sfeer'] }, kop: 'De dip dye kaarsenset', tekst: 'Voor op tafel. Liever geen open vuur in huis? Kies de oplaadbare tafellamp.', pid: 'oc_4174005828042753' },
        { id: 'planten', als: { wat: ['planten'] }, kop: 'De plantenset met orchidee en vetplant', tekst: 'Een levend cadeau dat lang meegaat als het licht en water goed zijn.', pid: 'oc_4173958884671489' },
        { id: 'warm', als: { wat: ['warm'] }, kop: 'De bouclé plaid Paris', tekst: 'Dik en zacht, voor op de bank.', pid: 'oc_4174003724075009' },
      ],
    },
    uitleg: [
      { kop: 'Hoe kies je een cadeau voor haar?', alineas: [
        'Begin bij wat ze al graag doet, niet bij wat jij mooi vindt. Gaat ze graag in bad, maakt ze het graag gezellig, heeft ze planten of zit ze vaak koud? Elk van die vier past bij een ander cadeau hierboven.',
        'Twijfel je over de maat, de geur of de kleur, kies dan iets waar dat niet uitmaakt: sokken in één maat, een plaid, een lamp of een plant. Bij verzorgingssets en kaarsen met geur is vragen beter dan gokken.',
      ] },
      { kop: 'Wat we niet weten', alineas: [
        'We hebben de producten niet zelf vastgehad. Alles hierboven rust op wat de maker opgeeft, en bij elke tip staat wat de maker niet vermeldt. De tips komen uit onze eigen gidsen, waar je per soort meer keuze vindt.',
      ] },
      { kop: 'Op tijd voor Sinterklaas en kerst', alineas: [
        'Bij elk product staat de verwachte bezorgdag als je vandaag bestelt; dat is een schatting, geen garantie. Bestel voor Sinterklaas uiterlijk vrijdag 27 november en voor kerst uiterlijk woensdag 16 december, dan heb je marge voor drukte bij de post.',
      ] },
    ],
    zoKozenWe: 'We zochten in onze winkel naar cadeaus voor vrouwen in vier richtingen: verwennen, sfeer in huis, planten en warmte. Per richting kozen we het product dat in onze eigen gids het best scoorde op wat de maker opgeeft, en we zetten er de beperkingen bij. Kadoly verdient aan elke verkoop; dat verandert niets aan wat we als beperking noemen.',
    faq: [
      { v: 'Wat is een goed cadeau voor haar?', a: 'Kies bij wat ze graag doet. Voor een verwenavond de badset Den en Winterbessen, voor een klein budget de alpacasokken met rendier, voor sfeer in huis de dip dye kaarsen en voor iets levends de plantenset met orchidee.' },
      { v: 'Wat geef je een vrouw die alles al heeft?', a: 'Iets dat opraakt of leeft: een badset, kaarsen of een plant. Dat staat niet in de weg en wordt gebruikt.' },
      { v: 'Wat is een leuk klein cadeautje voor haar?', a: 'De dames alpacasokken met rendier (2 paar) of de kurken portemonnee. Beide passen in een schoen.' },
      { v: 'Is een badset een goed cadeau als ik haar huid niet ken?', a: 'Liever niet als verrassing. De volledige ingrediëntenlijst ontbrak in de online gegevens. Vraag eerst wat ze kan gebruiken, of kies sokken, een plaid of een lamp.' },
      { v: 'Kan ik een cadeau terugsturen?', a: 'Meld je retour binnen 14 dagen na ontvangst; daarna heb je volgens de shop nog 14 dagen om terug te sturen. Voor geopende hygiëneproducten kan een vooraf vermelde uitzondering gelden.' },
    ],
  },

  'cadeau-voor-hem': {
    titel: 'Cadeau voor hem: cadeautips die hij gebruikt',
    beschrijving: 'Cadeaus voor mannen uit onze winkel: scheren, whisky, zijn bureau of vuur op tafel. Met wat erin zit, voor wie het niet past en een snelle check.',
    kicker: 'Cadeautips · voor hem',
    h1: 'Cadeau voor hem: welk cadeau past bij hem?',
    kort: 'Scheert hij zich, kies de scheerset met bamboe scheermes, 10 mesjes, scheerolie en een doekje. Drinkt hij whisky, kies de gestreepte set met karaf en 4 glazen van Aulica, of zes mini glaasjes om te proeven. Werkt hij thuis, de houten koptelefoonstandaard of de bureaumat van vilt en kurk. Klein budget: de natuurlijke scheerolie of de Japanse houten penhouder.',
    tips: [
      ['scheerset-cadeau', 'oc_4173959359135745', 'Scheert zich, compleet cadeau'],
      ['whisky-set-cadeau', 'oc_4174004900626435', 'Drinkt whisky'],
      ['whisky-set-cadeau', 'oc_4174004620263425', 'Proeft graag'],
      ['houten-bureau-accessoires', 'oc_4173957636800513', 'Werkt thuis'],
      ['houten-bureau-accessoires', 'oc_4173957649448961', 'Zijn hele bureau'],
      ['houten-bureau-accessoires', 'oc_4173957639913473', 'Klein, voor zijn bureau'],
      ['scheerset-cadeau', 'oc_4173959354744833', 'Klein budget, scheert zich'],
      ['tafelhaard', 'oc_4174002202804226', 'Vuur op tafel'],
      ['lantaarn-voor-binnen', 'oc_4174003627704321', 'Stoer en donker'],
    ],
    tabelKop: 'Welk cadeau past bij hem?',
    tabel: [
      { situatie: 'Hij scheert zich', advies: 'De complete scheerset met bamboe scheermes en scheerolie.', pid: 'oc_4173959359135745' },
      { situatie: 'Hij drinkt whisky', advies: 'De gestreepte set met karaf en 4 glazen. Let op: handwas.', pid: 'oc_4174004900626435' },
      { situatie: 'Hij proeft graag verschillende whisky\'s', advies: 'Zes mini whiskyglaasjes.', pid: 'oc_4174004620263425' },
      { situatie: 'Hij werkt thuis', advies: 'De houten koptelefoonstandaard, of de bureaumat van vilt en kurk voor het hele bureau.', pid: 'oc_4173957636800513' },
      { situatie: 'Hij zit graag bij vuur', advies: 'De ronde tafelhaard in zwart.', pid: 'oc_4174002202804226' },
      { situatie: 'Klein budget of een schoencadeautje', advies: 'De natuurlijke scheerolie of de Japanse houten penhouder.', pid: 'oc_4173959354744833' },
      { situatie: 'Hij drinkt geen alcohol', advies: 'Geen whiskyset: kies de koptelefoonstandaard, de tafelhaard of de skull lantaarn.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'wat', vraag: 'Waar houdt hij het meest van?', opties: [['verzorging', 'Goed verzorgd zijn'], ['whisky', 'Whisky'], ['bureau', 'Zijn werkplek'], ['vuur', 'Vuur en sfeer']] },
        { k: 'budget', vraag: 'Hoe groot is het cadeau?', opties: [['klein', 'Klein, voor in de schoen'], ['gewoon', 'Een echt cadeau']] },
      ],
      regels: [
        { id: 'klein', als: { budget: ['klein'] }, kop: 'De natuurlijke scheerolie', tekst: 'Klein genoeg voor in de schoen. Scheert hij zich niet, kies dan de Japanse houten penhouder.', pid: 'oc_4173959354744833' },
        { id: 'verzorging', als: { wat: ['verzorging'] }, kop: 'De complete scheerset', tekst: 'Een bamboe scheermes met 10 mesjes, scheerolie en een doekje. Scheert hij elektrisch, dan is dit geen goede keus.', pid: 'oc_4173959359135745' },
        { id: 'whisky', als: { wat: ['whisky'] }, kop: 'De gestreepte whiskyset met karaf', tekst: 'Karaf en 4 glazen van Aulica. Moet het in de vaatwasser kunnen, kies dan de zes losse kristallen glazen uit onze whiskygids.', pid: 'oc_4174004900626435' },
        { id: 'bureau', als: { wat: ['bureau'] }, kop: 'De houten koptelefoonstandaard', tekst: 'Voor wie aan een bureau werkt met een koptelefoon. Kleiner: de Japanse penhouder.', pid: 'oc_4173957636800513' },
        { id: 'vuur', als: { wat: ['vuur'] }, kop: 'De ronde tafelhaard in zwart', tekst: 'Een echte vlam op tafel. Liever stoer en donker: de skull lantaarn van cortenstaal.', pid: 'oc_4174002202804226' },
      ],
    },
    uitleg: [
      { kop: 'Hoe kies je een cadeau voor een man?', alineas: [
        'Kies iets dat hij gebruikt bij wat hij al doet: scheren, whisky drinken, thuiswerken. Een cadeau dat bij een gewoonte past, wordt gebruikt. Een cadeau voor een hobby die hij niet heeft, blijft in de kast.',
        'Weet je weinig van hem, kies dan iets kleins en bruikbaars: een penhouder, scheerolie of een set glazen als hij graag iets drinkt.',
      ] },
      { kop: 'Wat we niet weten', alineas: [
        'We hebben de producten niet zelf vastgehad. Alles hierboven rust op wat de maker opgeeft, en bij elke tip staat wat de maker niet vermeldt. Ons aanbod voor mannen is nog klein; we vullen het aan.',
      ] },
      { kop: 'Op tijd voor Sinterklaas en kerst', alineas: [
        'Bij elk product staat de verwachte bezorgdag als je vandaag bestelt; dat is een schatting, geen garantie. Bestel voor Sinterklaas uiterlijk vrijdag 27 november en voor kerst uiterlijk woensdag 16 december.',
      ] },
    ],
    zoKozenWe: 'We zochten in onze winkel naar cadeaus voor mannen bij vier gewoontes: scheren, whisky, thuiswerken en vuur. Per gewoonte kozen we het product dat in onze eigen gids het best paste bij wat de maker opgeeft, met de beperkingen erbij. Kadoly verdient aan elke verkoop; dat verandert niets aan wat we als beperking noemen.',
    faq: [
      { v: 'Wat is een goed cadeau voor hem?', a: 'Iets dat past bij wat hij al doet. Scheert hij zich: de scheerset met bamboe scheermes. Drinkt hij whisky: de set met karaf en 4 glazen. Werkt hij thuis: de houten koptelefoonstandaard.' },
      { v: 'Wat geef je een man die alles al heeft?', a: 'Iets dat hij gebruikt of beleeft: zes mini glaasjes om whisky te proeven of een tafelhaard.' },
      { v: 'Wat is een leuk klein cadeautje voor een man?', a: 'De natuurlijke scheerolie of de Japanse houten penhouder.' },
      { v: 'Kunnen de whiskysets in de vaatwasser?', a: 'De karafsets van Aulica volgens de maker niet. De losse sets van 6 glazen wel; die staan in onze whiskygids.' },
      { v: 'Kan ik een cadeau terugsturen?', a: 'Meld je retour binnen 14 dagen na ontvangst; daarna heb je volgens de shop nog 14 dagen om terug te sturen.' },
    ],
  },

  'kerstcadeau': {
    titel: 'Kerstcadeau: kerstcadeautips voor haar, hem en thuis',
    beschrijving: 'Kerstcadeaus uit onze winkel: voor haar, voor hem en voor in huis. Met wat erin zit, voor wie het niet past en tot wanneer je kunt bestellen.',
    kicker: 'Cadeautips · kerst',
    h1: 'Kerstcadeau: welk kerstcadeau past bij wie?',
    kort: 'Voor haar: de badset Den en Winterbessen of de dames alpacasokken met rendier. Voor hem: de whiskyglazen op een houten standaard, of zes mini whiskyglaasjes als het klein moet. Voor iedereen thuis: de wollen deken Tartan Noel in rood en groen, of een set van 26 glazen kerstballen. Voor de gastvrouw: de plantenset met orchidee en vetplant. Bestel uiterlijk woensdag 16 december.',
    tips: [
      ['badset-cadeau', 'oc_4173959373897729', 'Voor haar, verwennen'],
      ['alpaca-sokken', 'oc_4173959369080833', 'Voor haar, warm'],
      ['whisky-set-cadeau', 'oc_4174004606468097', 'Voor hem, om neer te zetten'],
      ['whisky-set-cadeau', 'oc_4174004620263425', 'Voor hem, klein'],
      ['wollen-deken', 'oc_4174003727745025', 'Voor thuis, kerstsfeer'],
      ['kerstballen-set', 'oc_4174003395198977', 'Voor de boom'],
      ['kerstkrans', 'oc_4174003400785923', 'Kerstkrans'],
      ['kaarsen-cadeau', 'oc_4174005851930625', 'Voor op de kersttafel'],
      ['orchidee-cadeau', 'oc_4173958884671489', 'Voor de gastvrouw'],
      ['lantaarn-voor-binnen', 'oc_4174003419709441', 'Sfeer in huis'],
    ],
    tabelKop: 'Welk kerstcadeau past bij wie?',
    tabel: [
      { situatie: 'Voor haar', advies: 'De badset Den en Winterbessen, of de alpacasokken met rendier als het klein moet.', pid: 'oc_4173959373897729' },
      { situatie: 'Voor hem', advies: 'De whiskyglazen op een houten standaard, of zes mini whiskyglaasjes als het klein moet.', pid: 'oc_4174004606468097' },
      { situatie: 'Voor het hele gezin', advies: 'De wollen deken Tartan Noel in rood en groen.', pid: 'oc_4174003727745025' },
      { situatie: 'Je gaat op kerstbezoek', advies: 'De plantenset met orchidee en vetplant.', pid: 'oc_4173958884671489' },
      { situatie: 'Een collega of de buren', advies: 'De kaarsenset of een kerstkrans voor de deur.', pid: 'oc_4174005851930625' },
      { situatie: 'Kinderen of huisdieren in huis', advies: 'Geen glazen kerstballen: kies de onbreekbare set uit onze kerstballengids.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'voor', vraag: 'Voor wie is het kerstcadeau?', opties: [['haar', 'Voor haar'], ['hem', 'Voor hem'], ['huis', 'Voor het huis of het gezin'], ['bezoek', 'Voor de gastvrouw']] },
        { k: 'budget', vraag: 'Hoe groot is het cadeau?', opties: [['klein', 'Klein'], ['gewoon', 'Een echt cadeau']] },
      ],
      regels: [
        { id: 'haar-klein', als: { voor: ['haar'], budget: ['klein'] }, kop: 'De dames alpacasokken met rendier', tekst: 'Twee paar, warm en feestelijk.', pid: 'oc_4173959369080833' },
        { id: 'haar', als: { voor: ['haar'] }, kop: 'De badset Den en Winterbessen', tekst: 'Badolie, lotion, een geurkaars, een spiegeltje en een massagestick in een houten doos.', pid: 'oc_4173959373897729' },
        { id: 'hem-klein', als: { voor: ['hem'], budget: ['klein'] }, kop: 'Zes mini whiskyglaasjes', tekst: 'Om een paar whisky\'s naast elkaar te proeven.', pid: 'oc_4174004620263425' },
        { id: 'hem', als: { voor: ['hem'] }, kop: 'De whiskyglazen op een houten standaard', tekst: 'Een set om neer te zetten. Drinkt hij geen alcohol, kijk dan bij onze cadeautips voor hem.', pid: 'oc_4174004606468097' },
        { id: 'huis', als: { voor: ['huis'] }, kop: 'De wollen deken Tartan Noel', tekst: 'Rood en groen, voor op de bank in de kerstdagen.', pid: 'oc_4174003727745025' },
        { id: 'bezoek', als: { voor: ['bezoek'] }, kop: 'De plantenset met orchidee en vetplant', tekst: 'Een levend cadeau dat na de kerst blijft staan.', pid: 'oc_4173958884671489' },
      ],
    },
    uitleg: [
      { kop: 'Tot wanneer kun je bestellen voor kerst?', alineas: [
        'Bij elk product staat de verwachte bezorgdag als je vandaag bestelt; dat is een schatting, geen garantie. Bestel uiterlijk woensdag 16 december, dan heb je marge voor de drukte bij de post rond de feestdagen.',
      ] },
      { kop: 'Hoe kies je een kerstcadeau?', alineas: [
        'Een kerstcadeau wordt in de kerstdagen gebruikt als het bij die dagen past: een deken voor op de bank, kaarsen voor op tafel, warme sokken. Voor wie het huis al vol heeft: iets dat opraakt of leeft, zoals een badset of een plant.',
        'Glazen kerstballen breken. Met kleine kinderen of een kat in huis is een onbreekbare set de betere keus.',
      ] },
      { kop: 'Wat we niet weten', alineas: [
        'We hebben de producten niet zelf vastgehad. Alles hierboven rust op wat de maker opgeeft, en bij elke tip staat wat de maker niet vermeldt.',
      ] },
    ],
    zoKozenWe: 'We kozen uit onze eigen gidsen per ontvanger één kerstcadeau: voor haar, voor hem, voor het huis en voor de gastvrouw, plus decoratie voor wie het zelf gezellig wil maken. De feiten en beperkingen komen uit die gidsen. Kadoly verdient aan elke verkoop; dat verandert niets aan wat we als beperking noemen.',
    faq: [
      { v: 'Wat is een goed kerstcadeau?', a: 'Iets dat in de kerstdagen gebruikt wordt: de wollen deken Tartan Noel voor het hele gezin, de badset Den en Winterbessen voor haar, de whiskyglazen op een houten standaard voor hem.' },
      { v: 'Wat is een goed kerstcadeau voor een vrouw?', a: 'De badset Den en Winterbessen, of de dames alpacasokken met rendier als het een klein cadeau moet zijn.' },
      { v: 'Wat is een goed kerstcadeau voor een man?', a: 'De whiskyglazen op een houten standaard, of zes mini whiskyglaasjes. Drinkt hij geen alcohol, kijk dan bij onze cadeautips voor hem.' },
      { v: 'Tot wanneer kan ik bestellen voor kerst?', a: 'Uiterlijk woensdag 16 december. De bezorgdag bij elk product is een schatting, geen garantie.' },
      { v: 'Wat neem je mee als je op kerstbezoek gaat?', a: 'De plantenset met orchidee en vetplant, of een kaarsenset voor op tafel.' },
    ],
  },

  'housewarming-cadeau': {
    titel: 'Housewarming cadeau: ideeën voor een nieuw huis',
    beschrijving: 'Cadeaus voor een nieuwe woning uit onze winkel: planten, licht, servies, geur en iets voor bij de deur. Met wat erin zit en voor wie het niet past.',
    kicker: 'Cadeautips · housewarming',
    h1: 'Housewarming cadeau: wat geef je bij een nieuw huis?',
    kort: 'Iets levends doet het altijd: de plantenset met orchidee en vetplant. Voor wie nog weinig spullen heeft: de serviesset Ozzu, 16 delen. Voor licht waar geen stopcontact is: de oplaadbare lamp van Tavellio met linnen kap. Voor bij de voordeur: een houten verzamelbak voor sleutels en telefoon. Weet je de stijl van het huis niet, kies dan iets dat opraakt, zoals een geurkaars.',
    tips: [
      ['orchidee-cadeau', 'oc_4173958884671489', 'Iets levends'],
      ['bloempot-binnen', 'oc_4174003463553026', 'Twee planten, op standaard'],
      ['serviesset', 'oc_4174003336871938', 'Eerste eigen servies'],
      ['oplaadbare-tafellamp', 'oc_4173959228096513', 'Licht zonder stopcontact'],
      ['houten-bureau-accessoires', 'oc_4173957637144577', 'Voor sleutels bij de deur'],
      ['orchidee-cadeau', 'oc_4173958872186881', 'Klein en levend'],
      ['kaarsen-cadeau', 'oc_4174004744241153', 'Geur in huis'],
      ['vaas-kiezen', 'oc_4173958203981825', 'Voor takken en pluimen'],
      ['tafelhaard', 'oc_4174002203230209', 'Vuur op tafel'],
    ],
    tabelKop: 'Welk housewarming cadeau past?',
    tabel: [
      { situatie: 'Je kent de stijl van het huis niet', advies: 'Iets dat opraakt: een geurkaars van EDDA.', pid: 'oc_4174004744241153' },
      { situatie: 'Ze houden van planten', advies: 'De plantenset met orchidee en vetplant, of twee bloempotten op standaard.', pid: 'oc_4173958884671489' },
      { situatie: 'Eerste eigen huis, nog weinig spullen', advies: 'De serviesset Ozzu, 16 delen.', pid: 'oc_4174003336871938' },
      { situatie: 'Een hoek zonder stopcontact', advies: 'De oplaadbare lamp van Tavellio met linnen kap.', pid: 'oc_4173959228096513' },
      { situatie: 'Altijd zoeken naar sleutels', advies: 'De houten verzamelbak voor sleutels en telefoon.', pid: 'oc_4173957637144577' },
      { situatie: 'Kleine kinderen of huisdieren', advies: 'Geen open vuur als verrassing: kies de oplaadbare lamp of de verzamelbak.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'stijl', vraag: 'Ken je de inrichting van het nieuwe huis?', opties: [['ja', 'Ja'], ['nee', 'Nee']] },
        { k: 'wat', vraag: 'Wat past het best?', opties: [['levend', 'Iets levends'], ['nuttig', 'Iets nuttigs'], ['sfeer', 'Sfeer en licht']] },
      ],
      regels: [
        { id: 'nee-stijl', als: { stijl: ['nee'], wat: ['nuttig', 'sfeer'] }, kop: 'Een geurkaars van EDDA', tekst: 'Raakt op en past in elk huis. Liever iets nuttigs? De houten verzamelbak voor bij de deur.', pid: 'oc_4174004744241153' },
        { id: 'levend', als: { wat: ['levend'] }, kop: 'De plantenset met orchidee en vetplant', tekst: 'Een levend cadeau, compleet in een pot.', pid: 'oc_4173958884671489' },
        { id: 'nuttig', als: { wat: ['nuttig'] }, kop: 'De serviesset Ozzu', tekst: '16 delen in off-white, voor wie net begint.', pid: 'oc_4174003336871938' },
        { id: 'sfeer', als: { wat: ['sfeer'] }, kop: 'De oplaadbare lamp van Tavellio', tekst: 'Licht waar geen stopcontact is, zonder open vuur. Drie lichtstanden en dimbaar.', pid: 'oc_4173959228096513' },
      ],
    },
    uitleg: [
      { kop: 'Wat geef je bij een housewarming?', alineas: [
        'In een nieuw huis is vaak nog niet alles af, en de bewoners hebben hun eigen smaak. Daarom werken twee soorten cadeaus het best: iets dat opraakt of leeft, zoals kaarsen of een plant, en iets dat een klein probleem oplost, zoals een lamp zonder snoer of een bak voor de sleutels.',
        'Grote spullen als servies of een vaas passen alleen als je weet hoe het huis eruitziet. Twijfel je, vraag het dan of kies iets kleins.',
      ] },
      { kop: 'Wat we niet weten', alineas: [
        'We hebben de producten niet zelf vastgehad. Alles hierboven rust op wat de maker opgeeft, en bij elke tip staat wat de maker niet vermeldt.',
      ] },
    ],
    zoKozenWe: 'We zochten in onze winkel naar cadeaus die in elk nieuw huis van pas komen: planten, licht, servies, geur en iets voor bij de deur. De feiten en beperkingen komen uit onze eigen gidsen. Kadoly verdient aan elke verkoop; dat verandert niets aan wat we als beperking noemen.',
    faq: [
      { v: 'Wat is een goed housewarming cadeau?', a: 'Iets dat opraakt of leeft, zoals een plant of een geurkaars, of iets dat een klein probleem oplost, zoals een oplaadbare lamp of een bak voor de sleutels.' },
      { v: 'Wat geef je bij een eerste eigen huis?', a: 'Iets nuttigs dat nog ontbreekt, zoals de serviesset Ozzu van 16 delen.' },
      { v: 'Wat geef je als je de inrichting niet kent?', a: 'Iets dat opraakt, zoals een geurkaars, of een kleine plant zoals de witte orchidee met vetplant in één pot.' },
      { v: 'Is een plant een goed housewarming cadeau?', a: 'Ja, als er genoeg licht is. De plantenset met orchidee en vetplant is een compleet cadeau.' },
    ],
  },

  'cadeau-voor-moeder': {
    titel: 'Cadeau voor moeder: ideeën om haar te verwennen',
    beschrijving: 'Cadeaus voor je moeder uit onze winkel: verwennen, warmte, planten, licht en iets voor als ze graag ontvangt. Met voor wie het niet past.',
    kicker: 'Cadeautips · voor moeder',
    h1: 'Cadeau voor moeder: waar maak je haar blij mee?',
    kort: 'Wil je haar verwennen, kies de badset Roos en Argan: badschuim en een massageborstel in een houten doos. Zit ze vaak koud, de merino-kasjmier plaid Milano. Houdt ze van planten, de witte orchidee met vetplant in één pot. Ontvangt ze graag, de steengoed brunchset van EDDA. Klein en altijd goed: de dames alpacasokken met rendier.',
    tips: [
      ['badset-cadeau', 'oc_4173959375896577', 'Verwennen in bad'],
      ['wollen-deken', 'oc_4174003728695297', 'Zit vaak koud'],
      ['orchidee-cadeau', 'oc_4173958872186881', 'Houdt van planten'],
      ['serviesset', 'oc_4174004737409025', 'Ontvangt graag'],
      ['alpaca-sokken', 'oc_4173959369080833', 'Klein en warm'],
      ['badset-cadeau', 'oc_4174002222628865', 'Zonder bad, voor de handen'],
      ['kaarsen-cadeau', 'oc_4174004745093121', 'Geurkaars zonder paraffine'],
      ['oplaadbare-tafellamp', 'oc_4173959218610177', 'Zacht licht zonder snoer'],
      ['kaarsen-cadeau', 'oc_4174004663975937', 'Klein cadeautje'],
    ],
    tabelKop: 'Welk cadeau past bij je moeder?',
    tabel: [
      { situatie: 'Ze gaat graag in bad', advies: 'De badset Roos en Argan.', pid: 'oc_4173959375896577' },
      { situatie: 'Ze zit vaak koud', advies: 'De merino-kasjmier plaid Milano.', pid: 'oc_4174003728695297' },
      { situatie: 'Ze houdt van planten', advies: 'De witte orchidee met vetplant in één pot.', pid: 'oc_4173958872186881' },
      { situatie: 'Ze ontvangt graag mensen', advies: 'De steengoed brunchset van EDDA.', pid: 'oc_4174004737409025' },
      { situatie: 'Klein cadeau', advies: 'De dames alpacasokken met rendier, of een vanille geurkaars.', pid: 'oc_4173959369080833' },
      { situatie: 'Gevoelige huid of parfumallergie', advies: 'Geen geurset of geurkaars als verrassing: kies de plaid, de lamp of de orchidee.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'wat', vraag: 'Waar houdt je moeder het meest van?', opties: [['verwen', 'Verwend worden'], ['warm', 'Het warm hebben'], ['planten', 'Planten'], ['ontvangen', 'Mensen ontvangen']] },
        { k: 'huid', vraag: 'Heeft ze een gevoelige huid of kan ze niet tegen parfum?', opties: [['nee', 'Nee'], ['ja', 'Ja'], ['weet', 'Weet ik niet']] },
      ],
      regels: [
        { id: 'huid-verwen', als: { wat: ['verwen'], huid: ['ja', 'weet'] }, kop: 'Liever geen geurset als verrassing', tekst: 'De volledige ingrediëntenlijst ontbrak in de online gegevens. Verwen haar met de merino-kasjmier plaid.', pid: 'oc_4174003728695297' },
        { id: 'verwen', als: { wat: ['verwen'] }, kop: 'De badset Roos en Argan', tekst: 'Badschuim en een massageborstel in een houten doos. Geen bad? Kies een handverzorgingsset.', pid: 'oc_4173959375896577' },
        { id: 'warm', als: { wat: ['warm'] }, kop: 'De merino-kasjmier plaid Milano', tekst: 'Diepgroen, merino met kasjmier.', pid: 'oc_4174003728695297' },
        { id: 'planten', als: { wat: ['planten'] }, kop: 'De witte orchidee met vetplant', tekst: 'Klein en strak, in één pot.', pid: 'oc_4173958872186881' },
        { id: 'ontvangen', als: { wat: ['ontvangen'] }, kop: 'De steengoed brunchset van EDDA', tekst: 'Voor ontbijt en brunch met de familie.', pid: 'oc_4174004737409025' },
      ],
    },
    uitleg: [
      { kop: 'Hoe kies je een cadeau voor je moeder?', alineas: [
        'Kies bij wat ze graag doet en waar ze zelf zelden geld aan uitgeeft: een goede plaid, een badset, bloeiende planten. Dat zijn dingen die ze gebruikt en die ze zelf niet snel koopt.',
        'Twijfel je over geur of huid, kies dan iets zonder geur: een plaid, een lamp of een plant.',
      ] },
      { kop: 'Wat we niet weten', alineas: [
        'We hebben de producten niet zelf vastgehad. Alles hierboven rust op wat de maker opgeeft, en bij elke tip staat wat de maker niet vermeldt.',
      ] },
      { kop: 'Op tijd voor Sinterklaas en kerst', alineas: [
        'Bij elk product staat de verwachte bezorgdag als je vandaag bestelt; dat is een schatting, geen garantie. Bestel voor Sinterklaas uiterlijk vrijdag 27 november en voor kerst uiterlijk woensdag 16 december.',
      ] },
    ],
    zoKozenWe: 'We zochten in onze winkel naar cadeaus voor moeders in vier richtingen: verwennen, warmte, planten en ontvangen, plus kleine cadeaus. De feiten en beperkingen komen uit onze eigen gidsen. Kadoly verdient aan elke verkoop; dat verandert niets aan wat we als beperking noemen.',
    faq: [
      { v: 'Wat is een goed cadeau voor mijn moeder?', a: 'Iets wat ze gebruikt maar zelf niet snel koopt: de badset Roos en Argan, de merino-kasjmier plaid Milano of een orchidee.' },
      { v: 'Wat geef je een moeder die alles al heeft?', a: 'Iets dat opraakt of leeft: een badset, een geurkaars of een orchidee.' },
      { v: 'Wat is een klein cadeautje voor mijn moeder?', a: 'De dames alpacasokken met rendier of een vanille geurkaars in een gouden houder.' },
      { v: 'Kan ik een cadeau terugsturen?', a: 'Meld je retour binnen 14 dagen na ontvangst; daarna heb je volgens de shop nog 14 dagen om terug te sturen. Voor geopende hygiëneproducten kan een vooraf vermelde uitzondering gelden.' },
    ],
  },
};

// Bouwt de gidsen in het formaat van lib/gidsen-kadoly.js. G = de bestaande gidsen (bron van de feiten per product).
export function cadeauTips(G, dag = '2026-11-21') {
  const uit = {};
  for (const [slug, t] of Object.entries(TIPS)) {
    const keuze = []; const gezien = new Set();
    for (const [bron, pid, label] of t.tips) {
      const k = ((G[bron] && G[bron].keuze) || []).find(x => x.pid === pid); if (!k || gezien.has(pid)) continue;
      gezien.add(pid); keuze.push({ pid, label, naam: k.naam, waarom: k.waarom, beperking: k.beperking, bron });
    }
    if (keuze.length < 4) continue; // te weinig feiten: geen dunne pagina
    const { tips, ...rest } = t;
    uit[slug] = Object.assign({ slug }, rest, { keuze, cadeautips: true, bijgewerkt: dag });
  }
  return uit;
}
export const CADEAUTIPS_SLUGS = Object.keys(TIPS);

// Controle (21 nov 2026, Henkjan: "altijd checks"): het korte antwoord, de tabel en de check noemen vaste producten. Is zo'n product niet
// leverbaar, dan staat het niet op de pagina maar wel in de tekst. Draait elke dag in de indexnow-ronde van de gids en zet een regel in het werklog.
export function cadeauTipsCheck(G, cat) {
  const uit = []; if (!cat) return uit;
  for (const slug of CADEAUTIPS_SLUGS) { const g = G[slug]; if (!g) continue; const ids = new Set();
    for (const x of [...(g.tabel || []), ...((g.check && g.check.regels) || [])]) if (x.pid) ids.add(x.pid);
    for (const pid of ids) { const i = cat[pid]; if (!i || i.vr === false) { const k = (g.keuze || []).find(x => x.pid === pid); uit.push({ slug, pid, naam: k ? k.naam : pid }); } } }
  return uit;
}
