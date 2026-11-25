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
      { v: 'Welke bijzettafel moet ik kopen?', a: 'Voor naast de bank met weinig ruimte de smalle zwarte tafel van Housevitamin: 45 bij 30 cm en 60 cm hoog. Komt er iets zwaars op, kies de Pomante van mangohout: de enige die een draagvermogen noemt, 20 kilo. Voor buiten de set van drie nesting tafels.' },
      { v: 'Is er een set bijzettafels?', a: 'Ja, de set van drie nesting tafels van zwart ijzer: 35, 40 en 45 cm breed, ze schuiven in elkaar. Volgens de maker UV- en waterbestendig, hooguit 5 kilo per tafel.' },
      { v: 'Welke bijzettafel past naast de bank?', a: 'Een smalle van ongeveer de hoogte van je armleuning. De zwarte tafel van Housevitamin is 45 bij 30 cm en 60 cm hoog.' },
      { v: 'Welke bijzettafel kan buiten staan?', a: 'De set van drie nesting tafels van zwart ijzer is volgens de maker UV- en waterbestendig. Ze dragen elk hooguit 5 kilo.' },
      { v: 'Hoeveel kan een bijzettafel dragen?', a: 'Dat verschilt en staat er vaak niet bij. Van deze acht noemen alleen de mangohouten Pomante (20 kilo) en de nesting set (5 kilo per tafel) een draagvermogen.' },
      { v: 'Is er een houten bijzettafel?', a: 'Ja, de Pomante van mangohout: 46 cm hoog en 38 cm breed, handgemaakt.' },
      { v: 'Moet ik een bijzettafel zelf in elkaar zetten?', a: 'De nesting set komt volgens de maker al in elkaar gezet. Bij de andere staat het er niet bij.' },
      { v: 'Kan ik een bijzettafel terugsturen?', a: 'Meld je retour binnen 14 dagen na ontvangst; daarna heb je volgens de shop nog 14 dagen om terug te sturen.' },
    ],
    bijgewerkt: '2026-11-25',
  },
  // 25 nov 2026 (Henkjan: "maak content voor alle high demand producten zodat we erop gaan ranken in LLMs ed."): tuinposter en kunstboom uit
  // reports/Moeilijk vergelijkbare producten NL.md (tuinposter 6.600 per maand, piek 14.800; kunstplant(en) 14.800). Alleen producten die nu
  // in de winkel staan; feiten uit /api/gids?op=feiten (productpagina van de shop, gelezen 25 nov 2026). We hebben ze niet zelf vastgehad.
  'tuinposter': {
    slug: 'tuinposter',
    titel: 'Tuinposter kiezen: welke maat en welk ontwerp?',
    beschrijving: 'Vijf tuinposters van Label2X, gemaakt in Nederland: A3, A2 of A1, met vier metalen ringen. Welke past op jouw schutting en wat de maker niet zegt.',
    kicker: 'Keuzehulp · tuinposters',
    h1: 'Tuinposter: welke maat en welk ontwerp past in jouw tuin?',
    kort: 'Onze eerste keus is de botanische tuinposter van Label2X: een rustig plantenontwerp dat bij elke tuin past, in drie maten tot 59 bij 84 cm en met 4 metalen ringen om op te hangen. Wil je kleur, kies de abstracte regenboogzon. Wil je een tekst, kies Geniet Elke Dag. Alle vijf worden in Nederland gemaakt. Let op: de maker noemt geen materiaal en geen weerbestendigheid, en raadt een tuin of overdekt terras aan.',
    keuze: [
      { pid: 'oc_4174004623278083', label: 'Onze eerste keus, rustig', naam: 'Botanische tuinposter van Label2X', waarom: 'Een plantenontwerp dat niet gaat vervelen en bij groen in de tuin past. In A3 (30 x 42 cm), A2 (42 x 59 cm) of A1 (59 x 84 cm), met 4 metalen ringen. Volgens de maker op te hangen met touw of tiewraps.', beperking: 'Materiaal en weerbestendigheid noemt de maker niet. De prijs hierboven is die van de kleinste maat.' },
      { pid: 'oc_4174004671856641', label: 'Kleurrijk', naam: 'Tuinposter abstracte regenboogzon', waarom: 'Een abstracte regenboogzon in vrolijke kleuren. Drie maten, A3 tot A1, en 4 metalen ringen.', beperking: 'Een uitgesproken ontwerp: minder rustig naast veel groen. Materiaal niet opgegeven.' },
      { pid: 'oc_4174004469071874', label: 'Met tekst, geel', naam: 'Tuinposter Geniet Elke Dag, geel', waarom: 'De tekst Geniet Elke Dag op een geel ontwerp. Volgens de maker voor de tuin of onder een overkapping. A3, A2 of A1.', beperking: 'Materiaal en gewicht zijn volgens de productpagina niet gespecificeerd.' },
      { pid: 'oc_4174004471300097', label: 'Voor het voorjaar', naam: 'Tuinposter lente-ontwerp', waarom: 'Een lenteontwerp, in de doos met vier metalen ringen. A3, A2 of A1.', beperking: 'Een seizoensontwerp: in de winter minder passend. Materiaal en gewicht niet gespecificeerd.' },
      { pid: 'oc_4174004670054401', label: 'Strak, zwart', naam: 'Tuinposter Favo Plekje, zwart', waarom: 'De tekst Favo Plekje op zwart: voor een zitplek of loungehoek. A3, A2 of A1, met 4 metalen ringen.', beperking: 'Materiaal en weerbestendigheid noemt de maker niet. Een tekst past vooral bij een vaste zitplek.' },
    ],
    tabelKop: 'Welke tuinposter past bij jouw tuin?',
    tabel: [
      { situatie: 'Veel groen, je wilt rust', advies: 'De botanische tuinposter.', pid: 'oc_4174004623278083' },
      { situatie: 'Een kale schutting die kleur mag hebben', advies: 'De abstracte regenboogzon.', pid: 'oc_4174004671856641' },
      { situatie: 'Een tekst bij de zitplek', advies: 'Favo Plekje in zwart, of Geniet Elke Dag in geel.', pid: 'oc_4174004670054401' },
      { situatie: 'Een overkapping of veranda', advies: 'Elk van de vijf: de maker noemt overdekte terrassen als plek.', pid: 'oc_4174004469071874' },
      { situatie: 'Je wilt een groot doek van 120 bij 80 cm', advies: 'Niet deze: de grootste maat is A1, 59 bij 84 cm.', pid: '' },
      { situatie: 'Een poster met je eigen foto', advies: 'Niet deze: Label2X verkoopt hier vaste ontwerpen.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'plek', vraag: 'Waar komt hij te hangen?', opties: [['open', 'In de open tuin'], ['dak', 'Onder een overkapping']] },
        { k: 'stijl', vraag: 'Wat wil je zien?', opties: [['rust', 'Iets rustigs'], ['kleur', 'Veel kleur'], ['tekst', 'Een tekst']] },
      ],
      regels: [
        { id: 'open', als: { plek: ['open'] }, kop: 'Liever onder een overkapping', tekst: 'De maker raadt tuinen en overdekte terrassen aan, maar noemt geen materiaal en geen weerbestendigheid. Hang hem in de open tuin op een plek met zo min mogelijk regen en zon, of vraag het in de chat na voor je bestelt.', pid: 'oc_4174004623278083' },
        { id: 'rust', als: { stijl: ['rust'] }, kop: 'De botanische tuinposter', tekst: 'Een plantenontwerp dat bij groen past, tot 59 bij 84 cm.', pid: 'oc_4174004623278083' },
        { id: 'kleur', als: { stijl: ['kleur'] }, kop: 'De abstracte regenboogzon', tekst: 'Kleur op een kale schutting.', pid: 'oc_4174004671856641' },
        { id: 'tekst', als: { stijl: ['tekst'] }, kop: 'Favo Plekje of Geniet Elke Dag', tekst: 'Favo Plekje in zwart voor een zitplek, Geniet Elke Dag in geel.', pid: 'oc_4174004670054401' },
      ],
    },
    uitleg: [
      { kop: 'Welke maat tuinposter?', alineas: [
        'Deze posters zijn er in A3 (30 x 42 cm), A2 (42 x 59 cm) en A1 (59 x 84 cm). Meet het stuk schutting of muur waar hij komt. Op een schutting van 180 cm hoog valt A3 weg; daar past A1 beter.',
        'Veel tuinposters elders zijn 120 bij 80 cm of groter. Zoek je zo een groot doek, dan zijn deze te klein.',
      ] },
      { kop: 'Ophangen en buiten', alineas: [
        'Alle vijf hebben 4 metalen ringen. De maker noemt touw of tiewraps om ze vast te zetten. Span hem strak: een losse poster klappert in de wind.',
        'De maker raadt tuinen en overdekte terrassen aan, maar geeft geen materiaal, geen UV-bestendigheid en geen waterdichtheid op. Onder een overkapping of veranda is de veiligste plek.',
      ] },
      { kop: 'Wie maakt ze?', alineas: [
        'Label2X uit Heerlen maakt wanddecoratie, posters, stickers en naambordjes, alles in Nederland. Op WebwinkelKeur heeft het merk een score van 8,8 uit 3.229 reviews; dat gaat over het merk, niet over deze posters.',
      ] },
    ],
    zoKozenWe: 'We legden de tuinposters uit onze winkel naast elkaar; ze komen allemaal van Label2X en verschillen vooral in ontwerp. We kozen er vijf die samen de keuzes dekken: rustig, kleurrijk, met tekst en voor het voorjaar. We hebben ze niet zelf buiten gehangen. Kadoly verdient aan elke verkoop; daarom staat bij elke poster wat de maker niet vermeldt.',
    faq: [
      { v: 'Welke tuinposter is het mooist voor in de tuin?', a: 'Bij veel groen de botanische tuinposter van Label2X: een rustig plantenontwerp, tot 59 bij 84 cm. Wil je kleur op een kale schutting, kies de abstracte regenboogzon.' },
      { v: 'Welke maat tuinposter moet ik nemen?', a: 'Meet de plek. A3 is 30 bij 42 cm, A2 42 bij 59 cm en A1 59 bij 84 cm. Op een hoge schutting valt een kleine poster weg; neem daar A1.' },
      { v: 'Kan een tuinposter tegen regen?', a: 'Dat zegt de maker van deze posters niet. Hij noemt tuinen en overdekte terrassen als plek, maar geen materiaal of waterdichtheid. Hang hem daarom bij voorkeur onder een overkapping.' },
      { v: 'Hoe hang je een tuinposter op?', a: 'Met de 4 metalen ringen in de hoeken en touw of tiewraps, zegt de maker. Span hem strak zodat hij niet klappert in de wind.' },
      { v: 'Kan ik een tuinposter met eigen foto bestellen?', a: 'Niet bij deze posters: het zijn vaste ontwerpen van Label2X.' },
      { v: 'Kan ik een tuinposter terugsturen?', a: 'Volgens de productpagina retourneer je gratis binnen 14 dagen na ontvangst.' },
    ],
    bijgewerkt: '2026-11-25',
  },
  'kunstboom': {
    slug: 'kunstboom',
    titel: 'Kunstboom of kunstolijfboom: welke kies je?',
    beschrijving: 'Zes grote kunstbomen naast elkaar: olijfboom van 183 cm, bananenboom, Raphis palm, eucalyptus, laurier en populier. Met maten, pot en of hij buiten kan.',
    kicker: 'Keuzehulp · kunstbomen',
    h1: 'Kunstboom kiezen: olijfboom, palm of laurier voor jouw hoek?',
    kort: 'Onze eerste keus voor een grote lege hoek is de kunstolijfboom van Mica Decorations: 183 cm hoog en 130 cm breed, met smalle groene bladeren. Heb je minder ruimte in de breedte, kies de Raphis palm van 150 cm, die maar 60 cm breed is. Voor buiten is de laurier van 120 cm de enige die de maker waterdicht en UV-bestendig noemt. Bijna alle bomen komen in een eenvoudige pot: reken op een overpot of mand.',
    keuze: [
      { pid: 'oc_4174003312721921', label: 'Onze eerste keus, groot', naam: 'Kunstolijfboom in zwarte pot van Mica Decorations', waarom: '183 cm hoog en 130 cm breed, met slanke groene olijfbladeren. Volgens de maker geen water of verzorging nodig. Hij staat in een zwarte plastic pot van 15 cm hoog en 16 cm doorsnede.', beperking: 'Je krijgt alleen de zwarte pot, geen overpot. Met 130 cm breedte heeft hij echt ruimte nodig. Buitengebruik noemt de maker niet.' },
      { pid: 'oc_4174003512573953', label: 'Hoog, maar smal', naam: 'Raphis palm kunstplant, 150 cm', waarom: 'Een palm van 150 cm hoog en 60 cm breed die een hoek vult zonder in de weg te staan. Gemaakt van polyester, bamboe en plastic op een voet van cement, in een pot van 17 cm doorsnede.', beperking: 'Geleverd zonder sierpot of mand: reken op een overpot van minstens 17 cm.' },
      { pid: 'oc_4174003313590273', label: 'Tropisch', naam: 'Bananenboom kunstplant van Mica Decorations', waarom: '155 cm hoog en 90 cm breed, met grote bladeren voor een tropische look. In een stevige zwarte plastic pot. Volgens de maker kun je de bladeren bijbuigen.', beperking: 'Breed blad vraagt ruimte. Buitengebruik niet opgegeven.' },
      { pid: 'oc_4174003465994242', label: 'Luchtig, voor binnen', naam: 'Kunst eucalyptusboom 140 cm van Mica Decorations', waarom: '140 cm hoog en 75 cm breed, met ronde bladeren aan volle takken. De maker noemt een lege hoek, naast de bank of in de gang. Pot 11,5 cm hoog en 12,5 cm doorsnede.', beperking: 'Volgens de maker voor binnen. Kleine pot: zet hem in een zwaardere overpot zodat hij niet omvalt.' },
      { pid: 'oc_4174003411730433', label: 'Ook voor buiten', naam: 'Kunst laurierboom van Mica Decorations', waarom: '120 cm hoog en 40 cm breed, met glanzende donkergroene bladeren in een slanke zwarte pot. Volgens de maker waterdicht en UV-bestendig, voor binnen en buiten.', beperking: 'Kleiner dan de andere bomen: geen hoekvuller voor een hoog plafond. Hoe lang de kleur in de zon blijft, staat er niet bij.' },
      { pid: 'oc_4174003414204417', label: 'Klein en licht', naam: 'Populier kunstboom van Mica Decorations', waarom: '110 cm hoog en 60 cm breed, met ronde bladeren. Pot van 15 cm hoog en 17 cm doorsnede. Volgens de maker voor woonkamer, kantoor of gang.', beperking: 'De kleinste van de zes. De maker raadt zelf een sierpot aan.' },
    ],
    tabelKop: 'Welke kunstboom past bij jouw plek?',
    tabel: [
      { situatie: 'Een grote lege hoek, veel ruimte', advies: 'De kunstolijfboom van 183 cm.', pid: 'oc_4174003312721921' },
      { situatie: 'Hoog plafond, weinig ruimte in de breedte', advies: 'De Raphis palm: 150 cm hoog, 60 cm breed.', pid: 'oc_4174003512573953' },
      { situatie: 'Tropische sfeer', advies: 'De bananenboom van 155 cm.', pid: 'oc_4174003313590273' },
      { situatie: 'Naast de bank of in de gang', advies: 'De eucalyptus van 140 cm.', pid: 'oc_4174003465994242' },
      { situatie: 'Balkon, terras of voordeur', advies: 'De laurier: de enige die de maker waterdicht en UV-bestendig noemt.', pid: 'oc_4174003411730433' },
      { situatie: 'Je wilt luchtzuivering', advies: 'Geen kunstboom: die zuivert de lucht niet.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'waar', vraag: 'Waar komt hij te staan?', opties: [['binnen', 'Binnen'], ['buiten', 'Buiten']] },
        { k: 'ruimte', vraag: 'Hoeveel ruimte is er in de breedte?', opties: [['veel', 'Meer dan een meter'], ['weinig', 'Minder dan een meter']] },
      ],
      regels: [
        { id: 'buiten', als: { waar: ['buiten'] }, kop: 'De laurierboom', tekst: 'Volgens de maker waterdicht en UV-bestendig. De andere bomen noemen geen buitengebruik.', pid: 'oc_4174003411730433' },
        { id: 'veel', als: { ruimte: ['veel'] }, kop: 'De kunstolijfboom', tekst: '183 cm hoog en 130 cm breed. Zet hem in een overpot; je krijgt alleen de zwarte pot.', pid: 'oc_4174003312721921' },
        { id: 'weinig', als: { ruimte: ['weinig'] }, kop: 'De Raphis palm', tekst: '150 cm hoog en maar 60 cm breed. Reken op een overpot van minstens 17 cm.', pid: 'oc_4174003512573953' },
      ],
    },
    uitleg: [
      { kop: 'Hoe groot moet een kunstboom zijn?', alineas: [
        'Meet de hoogte en de breedte van de plek. Een boom die het plafond bijna raakt, oogt gedrongen; houd er een flinke hand ruimte boven. Kijk ook naar de breedte: de olijfboom is 130 cm breed, de Raphis palm 60 cm.',
      ] },
      { kop: 'Pot en overpot', alineas: [
        'Deze bomen komen in een eenvoudige pot van 12,5 tot 17 cm doorsnede. Zet ze in een zwaardere overpot of mand. Dat oogt beter en een hoge boom valt dan minder snel om.',
      ] },
      { kop: 'Binnen of buiten?', alineas: [
        'Alleen bij de laurier noemt de maker waterdicht en UV-bestendig. De eucalyptus is volgens de maker voor binnen. Bij de andere staat niets over buiten; houd die binnen.',
      ] },
      { kop: 'Wat een kunstboom niet doet', alineas: [
        'Een kunstboom zuivert de lucht niet en heeft geen licht nodig. Stof hem af en toe af. Of een boom echt lijkt, hangt af van hoe je hem neerzet: buig de takken uit nadat je hem uitpakt.',
      ] },
    ],
    zoKozenWe: 'We legden de grote kunstplanten en kunstbomen uit onze winkel naast elkaar en kozen er zes van 110 tot 183 cm, met maten volgens de maker. Vijf zijn van Mica Decorations uit Reeuwijk. We hebben de bomen niet zelf neergezet. Kadoly verdient aan elke verkoop; daarom staat bij elke boom wat de maker niet vermeldt.',
    faq: [
      { v: 'Wat is een goede kunstolijfboom?', a: 'Voor een grote hoek de kunstolijfboom van Mica Decorations: 183 cm hoog en 130 cm breed. Je krijgt hem in een zwarte plastic pot, zonder overpot. Heb je minder dan een meter in de breedte, kies dan de Raphis palm van 150 cm.' },
      { v: 'Welke kunstboom kan buiten staan?', a: 'Van deze zes alleen de laurierboom van 120 cm: volgens de maker waterdicht en UV-bestendig. De eucalyptus is volgens de maker voor binnen; bij de andere staat niets over buiten.' },
      { v: 'Hoe groot is een kunstolijfboom?', a: 'De olijfboom hier is 183 cm hoog en 130 cm breed, in een pot van 15 cm hoog en 16 cm doorsnede.' },
      { v: 'Heeft een kunstboom een overpot nodig?', a: 'Meestal wel. Deze bomen komen in een eenvoudige pot van 12,5 tot 17 cm doorsnede. Een zwaardere overpot oogt beter en voorkomt dat een hoge boom omvalt.' },
      { v: 'Zuivert een kunstboom de lucht?', a: 'Nee. Een kunstboom is van kunststof en neemt niets op uit de lucht.' },
      { v: 'Kan ik een kunstboom terugsturen?', a: 'Volgens de productpagina retourneer je gratis binnen 14 dagen na ontvangst. Bij een grote boom loont het om eerst de maat van je plek te meten.' },
    ],
    bijgewerkt: '2026-11-25',
  },
};

// Voor lib/gidsen-alle.js: alles van deze soort onder de gids.
export const WONEN_ALLE = {
  'manden': { kop: 'Alle manden', re: 'mand|manden', uit: 'mandarijn|friteuse|orchidee|hondenmand|kattenmand|dierenmand|bijzettafel|mandje',
    groepen: [['Wasmanden', 'wasmand|was- '], ['Opbergmanden', 'opberg'], ['Voor planten', 'plant'], ['Voor aan de muur', 'wand'], ['Voor brood en fruit', 'brood|fruit']], rest: 'Overige manden' },
  'bijzettafel': { kop: 'Alle bijzettafels', re: 'bijzettafel|plantentafel|side table',
    groepen: [['Sets', 'set|nesting'], ['Voor planten', 'plant'], ['Hout en riet', 'hout|mango|teak|riet|bamboe'], ['Metaal en ijzer', 'metaal|metalen|ijzer']], rest: 'Overige bijzettafels' },
  'tuinposter': { kop: 'Alle tuinposters', re: 'tuinposter|tuindoek|tuinschilderij',
    groepen: [['Met tekst', 'geniet|favo|tijd|welkom'], ['Natuur en planten', 'botanisch|lente|bloem|plant']], rest: 'Overige tuinposters' },
  'kunstboom': { kop: 'Alle kunstbomen en grote kunstplanten', re: 'kunstboom|olijfboom|laurierboom|bananenboom|eucalyptus ?boom|palm kunstplant|kunst.*(boom|palm)', uit: 'kerst|krans|muur',
    groepen: [['Bomen', 'boom'], ['Palmen', 'palm']], rest: 'Overige grote kunstplanten' },
};
