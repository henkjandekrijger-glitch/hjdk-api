// Gidsen manden en bijzettafels voor gids.kadoly.com (21 nov 2026, Henkjan: "Ja bouwen . Nu").
// Waarom: Demand Radar (hjdk-api /api/gids?op=vraagkansen, NL+BE, gemiddeld per maand over 12 maanden) gaf deze twee als grootste
// onderwerpen zonder gids met eigen aanbod: manden en wasmanden 187.408 per maand (wasmand 35.067, rieten mand 11.225, rieten mandjes
// 11.000, opbergmand 6.617; 81 leverbare manden in de winkel) en bijzettafels 156.867 per maand (bijzettafel 38.667, bijzettafeltjes
// 10.417, bijzettafels buiten 7.702, bijzettafeltje voor buiten 7.643, houten bijzettafel 4.200; 58 leverbaar).
// Feiten per product uit /api/gids?op=feiten (productpagina van de shop, 21 nov 2026). We hebben de producten niet zelf vastgehad.

export const WONEN = {
  'manden': {
    slug: 'manden',
    titel: 'Wasmand, rieten mand of opbergmand: welke kies je?',
    beschrijving: 'Acht handgemaakte manden naast elkaar: wasmanden met en zonder deksel, opbergmanden, een broodmand en een wandmand. Met maten en wat de maker niet zegt.',
    kicker: 'Keuzehulp · manden',
    h1: 'Manden kiezen: wasmand, opbergmand of broodmand?',
    kort: 'Voor de was kies je de wasmand van waterhyacint met handvatten, in drie maten tot 40 bij 45 cm. Wil je de was uit het zicht, neem de Garut wasmand met deksel. Voor een plank of kast past de rechthoekige mand van zeegras. Voor een plant de lichte bamboemand, met een binnenpot erin. Over vocht zegt geen van de makers iets: leg er liever geen natte was in.',
    keuze: [
      { pid: 'oc_4173958154862594', label: 'Wasmand, drie maten', naam: 'Wasmand van waterhyacint met handvatten van Soeji', waarom: 'Handgemaakt van waterhyacint, in drie maten: 32 bij 28 cm, 37 bij 39 cm en 40 bij 45 cm, van 1,4 tot 2,6 kilo. Volgens de maker ook voor planten of opslag. Elke mand heeft een mix van lichtere en donkerdere vezels.', beperking: 'Geen deksel. De prijs hoort bij één maat; kijk op de productpagina welke. Over vocht en schoonmaken zegt de maker niets, dus leg er liever geen natte was in.' },
      { pid: 'oc_4173958174097409', label: 'Met deksel', naam: 'Garut wasmand met deksel van Soeji', waarom: 'Waterhyacint op een metalen frame, met een deksel met handvat. Drie maten: 30 bij 30, 40 bij 40 en 50 bij 50 cm, van 1,3 tot 3,1 kilo. Met de hand gemaakt in Java.', beperking: 'De maker zegt niet of die maten de hoogte of de breedte zijn. Handgemaakt, dus kleine verschillen in maat en kleur. Over vocht zegt de maker niets.' },
      { pid: 'oc_4173958214451201', label: 'Rechthoekig, voor de kast', naam: 'Batik opbergmand van zeegras van Soeji', waarom: 'Rechthoekig, dus hij past op een plank of in een kast. Van zeegras met een geblokt patroon, in drie maten: 30x25x20, 40x30x21 en 45x35x23 cm.', beperking: 'Geen deksel. Handvatten noemt de maker niet. Laag, dus niet bedoeld voor een volle wasmand.' },
      { pid: 'oc_4173958185697282', label: 'Licht, ook voor een plant', naam: 'Benoa was- en plantenmand van bamboe van Soeji', waarom: 'Van bamboe met handvatten van zeegras en jute, in wit of zwart met een gebruikte look. Licht: 0,5 tot 1,1 kilo. Drie maten: 35x38, 40x48 en 45x58 cm, met een opening van 25 tot 35 cm.', beperking: 'Of de mand waterdicht is zegt de maker niet: zet een plant er met een binnenpot in. De opening is smaller dan de mand zelf.' },
      { pid: 'oc_4173958199771137', label: 'Voor tijdschriften', naam: 'KUNO krantenmand van riet van Soeji', waarom: 'Een smalle mand van riet van 40 bij 20 bij 26 cm en 0,49 kilo, voor kranten en tijdschriften naast de bank.', beperking: 'Voor een plaid of speelgoed is hij aan de smalle kant.' },
      { pid: 'oc_4173958190399490', label: 'Voor brood en fruit', naam: 'Jawah broodmand van waterhyacint van Soeji', waarom: 'Een platte ronde mand met handvatten: 30 cm breed en 10 cm hoog, of 35 bij 12 cm. Voor brood, fruit of om mee te serveren.', beperking: 'Over contact met eten en schoonmaken zegt de maker niets. Leg brood op een doek.' },
      { pid: 'oc_4173958204620801', label: 'Aan de muur', naam: 'Taman boho wandmand of kom van bananenvezel van Soeji', waarom: 'Bananenvezel met een patroon van katoenkoord, 30 of 40 cm breed. Hang hem aan de muur of gebruik hem als schaal voor fruit en kleine spullen.', beperking: 'Hoe je hem ophangt staat er niet bij; reken op een eigen spijker of haakje.' },
      { pid: 'oc_4174003288948737', label: 'Set van twee, voor planten', naam: 'Plantenmanden Anne met visgraatpatroon van Mica Decorations', waarom: 'Een grote (28 cm hoog, 30 cm breed) en een kleine (24 cm hoog, 26 cm breed) plantenmand met visgraatpatroon, voor planten of kleine spullen.', beperking: 'Het materiaal noemt de maker alleen "stevig materiaal". Gebruik een binnenpot voor planten.' },
    ],
    tabelKop: 'Welke mand past bij jouw situatie?',
    tabel: [
      { situatie: 'Wasmand voor de slaapkamer', advies: 'De wasmand van waterhyacint met handvatten, in drie maten.', pid: 'oc_4173958154862594' },
      { situatie: 'De was moet uit het zicht', advies: 'De Garut wasmand met deksel.', pid: 'oc_4173958174097409' },
      { situatie: 'Opbergen op een plank of in de kast', advies: 'De rechthoekige zeegrasmand.', pid: 'oc_4173958214451201' },
      { situatie: 'Een plant in een mand', advies: 'De lichte bamboemand of de set Anne, met een binnenpot.', pid: 'oc_4173958185697282' },
      { situatie: 'Tijdschriften naast de bank', advies: 'De smalle krantenmand van riet.', pid: 'oc_4173958199771137' },
      { situatie: 'Brood of fruit op tafel', advies: 'De platte broodmand met handvatten.', pid: 'oc_4173958190399490' },
      { situatie: 'Een lege muur', advies: 'De boho wandmand van bananenvezel.', pid: 'oc_4173958204620801' },
      { situatie: 'Natte was of een vochtige badkamer', advies: 'Geen van de makers zegt iets over vocht. Laat de was eerst drogen of kies een wasmand van kunststof.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'voor', vraag: 'Waarvoor is de mand?', opties: [['was', 'De was'], ['opbergen', 'Opbergen'], ['plant', 'Een plant'], ['tafel', 'Brood of fruit'], ['muur', 'Aan de muur']] },
        { k: 'nat', vraag: 'Komt er natte was in of staat hij in een vochtige badkamer?', opties: [['nee', 'Nee'], ['ja', 'Ja'], ['weet', 'Weet ik niet']] },
        { k: 'deksel', vraag: 'Moet er een deksel op?', opties: [['ja', 'Ja'], ['nee', 'Nee, maakt niet uit']] },
      ],
      regels: [
        { id: 'nat', als: { voor: ['was'], nat: ['ja'] }, kop: 'Liever geen natuurvezel', tekst: 'Geen van de makers zegt iets over vocht. Laat de was eerst drogen, of kies voor een vochtige badkamer een wasmand van kunststof.' },
        { id: 'deksel', als: { voor: ['was'], deksel: ['ja'] }, kop: 'De Garut wasmand met deksel', tekst: 'Waterhyacint op een metalen frame, in drie maten tot 50 bij 50 cm.', pid: 'oc_4173958174097409' },
        { id: 'was', als: { voor: ['was'] }, kop: 'De wasmand van waterhyacint met handvatten', tekst: 'In drie maten, tot 40 bij 45 cm.', pid: 'oc_4173958154862594' },
        { id: 'opbergen', als: { voor: ['opbergen'] }, kop: 'De rechthoekige zeegrasmand', tekst: 'Past op een plank of in een kast, in drie maten.', pid: 'oc_4173958214451201' },
        { id: 'plant', als: { voor: ['plant'] }, kop: 'De lichte bamboemand', tekst: 'Met een binnenpot erin. Twee kleinere: de set Anne.', pid: 'oc_4173958185697282' },
        { id: 'tafel', als: { voor: ['tafel'] }, kop: 'De Jawah broodmand', tekst: 'Plat en rond met handvatten, 30 of 35 cm breed.', pid: 'oc_4173958190399490' },
        { id: 'muur', als: { voor: ['muur'] }, kop: 'De boho wandmand van bananenvezel', tekst: '30 of 40 cm breed, ook te gebruiken als schaal.', pid: 'oc_4173958204620801' },
      ],
    },
    uitleg: [
      { kop: 'Waterhyacint, zeegras, bamboe of riet?', alineas: [
        'Alle manden hier zijn met de hand gevlochten van natuurvezel. De wasmanden van Soeji zijn van waterhyacint, de opbergmand van zeegras, de lichtste mand van bamboe en de krantenmand van riet. Bamboe is hier het lichtst: de grote Benoa weegt 1,1 kilo, de grote Garut wasmand van waterhyacint met metalen frame 3,1 kilo.',
        'Handgemaakt betekent kleine verschillen in maat, kleur en vorm. Dat zeggen de makers er zelf bij.',
      ] },
      { kop: 'Let op de maat bij de prijs', alineas: [
        'Veel manden zijn er in twee of drie maten. De prijs die je hier ziet hoort bij één maat. Kijk op de productpagina welke maat je kiest voor je bestelt.',
        'Een wasmand met drie vakken om de was te sorteren, waar veel naar gezocht wordt, hebben we nu niet.',
      ] },
      { kop: 'Wat de makers niet zeggen', alineas: [
        'Geen van de makers zegt iets over vocht of schoonmaken. Natte was of een vochtige badkamer is dus op eigen risico; laat de was eerst drogen. Voor planten noemt ook niemand een waterdichte binnenkant: gebruik een binnenpot.',
      ] },
    ],
    zoKozenWe: 'We legden de leverbare manden uit onze winkel naast elkaar en kozen per gebruik de mand met de duidelijkste maten en materialen volgens de maker. De broodmand en de wandmand legden bezoekers het vaakst in de winkelwagen of bekeken ze het meest. We hebben de manden niet zelf gebruikt. Kadoly verdient aan elke verkoop; dat verandert niets aan wat we als beperking noemen.',
    faq: [
      { v: 'Welke wasmand moet ik kiezen?', a: 'Voor gewone was de wasmand van waterhyacint met handvatten, in drie maten tot 40 bij 45 cm. Wil je de was uit het zicht, de Garut wasmand met deksel.' },
      { v: 'Is een rieten of waterhyacint wasmand geschikt voor de badkamer?', a: 'De makers zeggen niets over vocht. Laat natte was eerst drogen; voor een vochtige badkamer is kunststof veiliger.' },
      { v: 'Kan ik een plant in een rieten mand zetten?', a: 'Ja, met een binnenpot. Geen van de makers noemt een waterdichte binnenkant.' },
      { v: 'Welke mand past in een kast?', a: 'De rechthoekige opbergmand van zeegras: 30x25x20, 40x30x21 of 45x35x23 cm.' },
      { v: 'Hebben jullie een wasmand met drie vakken?', a: 'Nu niet. De wasmanden hier hebben één vak.' },
      { v: 'Kan ik een mand terugsturen?', a: 'Meld je retour binnen 14 dagen na ontvangst; daarna heb je volgens de shop nog 14 dagen om terug te sturen.' },
    ],
    bijgewerkt: '2026-11-21',
  },

  'bijzettafel': {
    slug: 'bijzettafel',
    titel: 'Bijzettafel kiezen: binnen, buiten, hout of metaal?',
    beschrijving: 'Acht bijzettafels naast elkaar: metaal voor binnen en buiten, mangohout, riet, een set van drie en een plantentafel. Met maten en draagvermogen.',
    kicker: 'Keuzehulp · bijzettafels',
    h1: 'Bijzettafel: welke past naast jouw bank of op je balkon?',
    kort: 'Naast de bank met weinig ruimte: de smalle zwarte tafel van Housevitamin, 45 bij 30 cm en 60 cm hoog. Voor buiten: de set van drie zwarte tafels die in elkaar schuiven, volgens de maker UV- en waterbestendig. Wil je echt hout, kies de bijzettafel van mangohout die tot 20 kilo draagt. Voor een plant op ooghoogte: de plantentafel van 80 cm. Zet nooit iets zwaars op een tafel waarvan de maker het draagvermogen niet noemt.',
    keuze: [
      { pid: 'oc_4174002148999169', label: 'Smal, naast de bank', naam: 'Zwarte metalen bijzettafel van Housevitamin', waarom: 'Rechthoekig, 45 bij 30 cm en 60 cm hoog, van zwart metaal. Smal genoeg om naast de bank te passen. Volgens de maker voor ontspannen of werken.', beperking: 'Gewicht en draagvermogen noemt de maker niet.' },
      { pid: 'oc_4174003467632641', label: 'Voor buiten, set van drie', naam: 'Set van drie nesting bijzettafels van zwart ijzer van Mica Decorations', waarom: 'Drie tafels die in elkaar schuiven: 35, 40 en 45 cm breed en 40, 46 en 52 cm hoog. Volgens de maker UV- en waterbestendig en al in elkaar gezet geleverd.', beperking: 'Hooguit 5 kilo per tafel volgens de maker: voor een drankje of een kleine plant, niet voor een grote pot.' },
      { pid: 'oc_4174003309559809', label: 'Licht, binnen en buiten', naam: 'Seattle bijzettafel zwart metaal van Mica Decorations', waarom: 'Rond, 58 cm hoog en 38 cm breed, van zwart metaal. Volgens de maker licht om te verplaatsen en voor binnen en buiten. De Seattle-serie is er ook in andere kleuren.', beperking: 'Over roest en weer zegt de maker niets en het draagvermogen staat er niet bij.' },
      { pid: 'oc_4174003463897090', label: 'Echt hout, draagt 20 kilo', naam: 'Pomante bijzettafel van mangohout van Mica Decorations', waarom: 'Handgemaakt van mangohout met een gegraveerd patroon op het ronde blad, 46 cm hoog en 38 cm breed. Draagt volgens de maker tot 20 kilo.', beperking: 'Buitengebruik noemt de maker niet. Handgemaakt, dus elk exemplaar wijkt iets af.' },
      { pid: 'oc_4174003430506497', label: 'Met dienblad', naam: 'Bijzettafel met afneembaar dienblad van Mica Decorations', waarom: 'Metaal, 40 cm hoog en 31 cm breed. Het blad kan eraf om drankjes of snacks mee te serveren.', beperking: 'Laag en klein: past naast een lage stoel, minder naast een hoge armleuning. Draagvermogen niet vermeld.' },
      { pid: 'oc_4174003343441921', label: 'Warm bruin, breed blad', naam: 'Ronde ijzeren bijzettafel bruin van Mica Decorations', waarom: 'Rond ijzer in diepbruin, 40 cm hoog met een blad van 45 cm doorsnede. Er is ook een versie van 50 cm.', beperking: 'Laag: 40 cm. Draagvermogen niet vermeld.' },
      { pid: 'oc_4173958225084417', label: 'Riet, handgeweven', naam: 'Bayu rieten bijzettafel met metalen frame van Soeji', waarom: 'Een metalen frame omwikkeld met handgeweven riet, 55 bij 45 bij 45 cm en bijna 8 kilo. Volgens de maker in ongeveer twee dagen met de hand gemaakt in Java.', beperking: 'De duurste van deze acht. Buitengebruik noemt de maker niet.' },
      { pid: 'oc_4174003383648257', label: 'Hoog, voor een plant', naam: 'Adine plantentafel zwart van Mica Decorations', waarom: 'Een standaard op drie poten, 80 cm hoog met een blad van 30 cm. Voor een plant of decoratie op ooghoogte.', beperking: 'Draagvermogen niet vermeld en het blad is klein: geen zware pot zonder het na te vragen.' },
    ],
    tabelKop: 'Welke bijzettafel past bij jouw situatie?',
    tabel: [
      { situatie: 'Naast de bank, weinig ruimte', advies: 'De smalle zwarte tafel van Housevitamin, 45 bij 30 cm.', pid: 'oc_4174002148999169' },
      { situatie: 'Voor balkon of terras', advies: 'De set van drie nesting tafels, volgens de maker UV- en waterbestendig.', pid: 'oc_4174003467632641' },
      { situatie: 'Je wilt echt hout', advies: 'De Pomante van mangohout, draagt tot 20 kilo.', pid: 'oc_4174003463897090' },
      { situatie: 'Drankjes serveren', advies: 'De tafel met afneembaar dienblad.', pid: 'oc_4174003430506497' },
      { situatie: 'Een plant op ooghoogte', advies: 'De Adine plantentafel van 80 cm.', pid: 'oc_4174003383648257' },
      { situatie: 'Natuurlijk of boho interieur', advies: 'De Bayu van handgeweven riet.', pid: 'oc_4173958225084417' },
      { situatie: 'Er komt iets zwaars op, zoals een grote pot of lamp', advies: 'Alleen de mangohouten tafel noemt een draagvermogen: 20 kilo. De nesting set houdt het bij 5 kilo per tafel.', pid: 'oc_4174003463897090' },
    ],
    check: {
      vragen: [
        { k: 'waar', vraag: 'Waar komt de tafel?', opties: [['binnen', 'Binnen'], ['buiten', 'Buiten op balkon of terras']] },
        { k: 'voor', vraag: 'Waarvoor gebruik je hem?', opties: [['koffie', 'Koffie, boek of telefoon'], ['plant', 'Een plant'], ['serveren', 'Drankjes serveren'], ['zwaar', 'Iets zwaars']] },
        { k: 'stijl', vraag: 'Welke stijl?', opties: [['metaal', 'Strak metaal'], ['hout', 'Hout'], ['riet', 'Riet']] },
      ],
      regels: [
        { id: 'buiten', als: { waar: ['buiten'] }, kop: 'De set van drie nesting tafels', tekst: 'Volgens de maker UV- en waterbestendig. Hooguit 5 kilo per tafel.', pid: 'oc_4174003467632641' },
        { id: 'zwaar', als: { voor: ['zwaar'] }, kop: 'De Pomante van mangohout', tekst: 'De enige hier met een opgegeven draagvermogen: 20 kilo.', pid: 'oc_4174003463897090' },
        { id: 'plant', als: { voor: ['plant'] }, kop: 'De Adine plantentafel', tekst: '80 cm hoog met een blad van 30 cm. Voor een lichte pot.', pid: 'oc_4174003383648257' },
        { id: 'serveren', als: { voor: ['serveren'] }, kop: 'De tafel met afneembaar dienblad', tekst: '40 cm hoog; het blad gaat mee naar de keuken.', pid: 'oc_4174003430506497' },
        { id: 'hout', als: { stijl: ['hout'] }, kop: 'De Pomante van mangohout', tekst: 'Handgemaakt, 46 cm hoog en 38 cm breed.', pid: 'oc_4174003463897090' },
        { id: 'riet', als: { stijl: ['riet'] }, kop: 'De Bayu van handgeweven riet', tekst: '55 bij 45 bij 45 cm op een metalen frame.', pid: 'oc_4173958225084417' },
        { id: 'metaal', als: { stijl: ['metaal'] }, kop: 'De smalle zwarte tafel van Housevitamin', tekst: '45 bij 30 cm en 60 cm hoog, past naast de bank.', pid: 'oc_4174002148999169' },
      ],
    },
    uitleg: [
      { kop: 'Hoe hoog moet een bijzettafel zijn?', alineas: [
        'Kijk naar de stoel of bank waar hij naast komt. De tafels hier lopen van 40 cm (de ronde bruine en die met dienblad) tot 60 cm (Housevitamin) en 80 cm voor de plantentafel. Een lage tafel past naast een lage loungestoel, een hogere naast een bank met hoge armleuningen.',
      ] },
      { kop: 'Binnen of buiten?', alineas: [
        'Alleen de set van drie nesting tafels noemt de maker UV- en waterbestendig. De Seattle zegt binnen en buiten, maar niets over roest of regen. De houten en rieten tafels noemen geen buitengebruik: houd die binnen.',
      ] },
      { kop: 'Draagvermogen', alineas: [
        'Alleen twee makers noemen een draagvermogen: de mangohouten Pomante 20 kilo en de nesting tafels 5 kilo per tafel. Bij de rest staat het er niet bij. Zet daar geen zware pot of lamp op zonder het na te vragen.',
      ] },
    ],
    zoKozenWe: 'We legden de leverbare bijzettafels uit onze winkel naast elkaar en kozen per situatie de tafel met de duidelijkste maten volgens de maker: smal, voor buiten, hout, met dienblad, laag en breed, riet en hoog voor een plant. We hebben de tafels niet zelf gebruikt. Kadoly verdient aan elke verkoop; dat verandert niets aan wat we als beperking noemen.',
    faq: [
      { v: 'Welke bijzettafel past naast de bank?', a: 'Een smalle van ongeveer de hoogte van je armleuning. De zwarte tafel van Housevitamin is 45 bij 30 cm en 60 cm hoog.' },
      { v: 'Welke bijzettafel kan buiten staan?', a: 'De set van drie nesting tafels van zwart ijzer is volgens de maker UV- en waterbestendig. Ze dragen elk hooguit 5 kilo.' },
      { v: 'Hoeveel kan een bijzettafel dragen?', a: 'Dat verschilt en staat er vaak niet bij. Van deze acht noemen alleen de mangohouten Pomante (20 kilo) en de nesting set (5 kilo per tafel) een draagvermogen.' },
      { v: 'Is er een houten bijzettafel?', a: 'Ja, de Pomante van mangohout: 46 cm hoog en 38 cm breed, handgemaakt.' },
      { v: 'Moet ik een bijzettafel zelf in elkaar zetten?', a: 'De nesting set komt volgens de maker al in elkaar gezet. Bij de andere staat het er niet bij.' },
      { v: 'Kan ik een bijzettafel terugsturen?', a: 'Meld je retour binnen 14 dagen na ontvangst; daarna heb je volgens de shop nog 14 dagen om terug te sturen.' },
    ],
    bijgewerkt: '2026-11-21',
  },
};

// Voor lib/gidsen-alle.js: alles van deze soort onder de gids.
export const WONEN_ALLE = {
  'manden': { kop: 'Alle manden', re: 'mand|manden', uit: 'mandarijn|friteuse|orchidee|hondenmand|kattenmand|dierenmand|bijzettafel|mandje',
    groepen: [['Wasmanden', 'wasmand|was- '], ['Opbergmanden', 'opberg'], ['Voor planten', 'plant'], ['Voor aan de muur', 'wand'], ['Voor brood en fruit', 'brood|fruit']], rest: 'Overige manden' },
  'bijzettafel': { kop: 'Alle bijzettafels', re: 'bijzettafel|plantentafel|side table',
    groepen: [['Sets', 'set|nesting'], ['Voor planten', 'plant'], ['Hout en riet', 'hout|mango|teak|riet|bamboe'], ['Metaal en ijzer', 'metaal|metalen|ijzer']], rest: 'Overige bijzettafels' },
};
