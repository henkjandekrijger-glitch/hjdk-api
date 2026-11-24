// Meubelgidsen voor gids.kadoly.com (21 nov 2026, Henkjan: "Zet alles van droppery in de winkel. En maak er de juiste content bij"
// en "Ja 1 - 3 gaan we doen": stap 3 = gidsen voor dure onderwerpen met veel vraag en weinig aanbod, zoals eettafels).
// Producten: Modus Furniture via Droppery (dp_10xx). Feiten uit de productpagina's (op=feiten, 21 nov 2026): maten, gewicht,
// materiaal en wat de maker belooft. Wat de maker niet zegt, staat als beperking.

export const MEUBELS = {
  'eettafel': {
    slug: 'eettafel',
    titel: 'Eettafel kiezen: rond of groot, marmer, steen of hout',
    beschrijving: 'Vijf eettafels naast elkaar: rond 119 cm in marmer of gesinterd steen, of acacia van 183 tot 241 cm. Met hoeveel ruimte je nodig hebt.',
    kicker: 'Keuzehulp · eettafels',
    h1: 'Eettafel: welke past in jouw ruimte en bij hoeveel mensen?',
    kort: 'Eet je meestal met vier en heb je een plek van ongeveer 3 bij 3 meter, neem een ronde tafel van 119 cm. Wil je echt marmer, kies de Coral met Carrara-marmer op een voet van roestvrij staal. Moet het blad tegen hete pannen en krassen kunnen, kies de Winston van gesinterd steen. Voor zes tot acht mensen: de Oxford van massief acacia, 183 cm lang en met verlengstuk 241 cm. Reken rondom de tafel 90 cm voor stoel en doorloop.',
    keuze: [
      { pid: 'dp_1025', label: 'Echt marmer, rond', naam: 'Coral ronde eettafel van marmer en geborsteld roestvrij staal', waarom: 'Blad van Carrara-marmer met natuurlijke aders, dus elk blad is anders, op een handgesneden en gelaste voet van roestvrij staal. 119 cm doorsnede en 76 cm hoog, 80 kilo. De nylon voeten bekrassen de vloer niet.', beperking: 'Marmer is poreus: wijn, citroen en azijn meteen wegvegen, anders blijft er een vlek. Hoeveel mensen eraan passen noemt de maker niet; bij 119 cm zijn dat er vier.' },
      { pid: 'dp_1027', label: 'Steen, tegen hitte', naam: 'Winston ronde eettafel met blad van gesinterd steen, zwart', waarom: 'Gesinterd steen is volgens de maker bestand tegen hitte en krassen en heeft de uitstraling van natuursteen zonder het onderhoud. Zandlopervoet, handgelast. 119 cm doorsnede, plaats voor vier tot vijf personen volgens de maker.', beperking: 'De beschrijving noemt ook fluwelen stoelen, de titel alleen de tafel. Kijk op de productpagina wat er geleverd wordt voor je bestelt.' },
      { pid: 'dp_1026', label: 'Steen, warm licht', naam: 'Winston ronde eettafel met stenen blad, havermelk', waarom: 'Dezelfde Winston met een licht blad en een voet in warme champagnekleur. Gesinterd steen, volgens de maker bestand tegen hitte en krassen. 119 bij 119 cm en 76 cm hoog, 72 kilo.', beperking: 'Ook hier noemt de beschrijving stoelen. Een lichte kleur laat vlekken sneller zien, al neemt gesinterd steen weinig op.' },
      { pid: 'dp_1029', label: 'Marmerlook zonder onderhoud', naam: 'Winston ronde eettafel met stenen blad, grigio', waarom: 'Rond blad van gesinterd steen en glas met een marmerpatroon, op een zwart gepoedercoat stalen onderstel. 119 bij 119 cm en 76 cm hoog.', beperking: 'Het is een marmerpatroon, geen echt marmer. De beschrijving noemt ook stoelen.' },
      { pid: 'dp_1021', label: 'Groot, zes tot acht mensen', naam: 'Oxford rechthoekige eettafel van acacia, basaltgrijs', waarom: 'Massief acacia met acaciafineer, geborsteld zodat de nerf voelbaar is, op een zwevende voet. 183 cm lang en met verlengstuk 241 cm, 99 cm diep en 76 cm hoog.', beperking: '129 kilo: draag hem met minstens drie mensen naar binnen. Alleen in basaltgrijs.' },
    ],
    tabelKop: 'Welke eettafel past bij jouw situatie?',
    tabel: [
      { situatie: 'Twee tot vier mensen, plek van ongeveer 3 bij 3 meter', advies: 'Een ronde tafel van 119 cm, zoals de Winston in zwart.', pid: 'dp_1027' },
      { situatie: 'Je wilt echt marmer', advies: 'De Coral met een blad van Carrara-marmer.', pid: 'dp_1025' },
      { situatie: 'Kinderen, hete pannen, dagelijks gebruik', advies: 'De Winston van gesinterd steen, volgens de maker bestand tegen hitte en krassen.', pid: 'dp_1027' },
      { situatie: 'Een lichte, warme eetkamer', advies: 'De Winston in havermelk met een champagnekleurige voet.', pid: 'dp_1026' },
      { situatie: 'De look van marmer zonder het onderhoud', advies: 'De Winston grigio met marmerpatroon.', pid: 'dp_1029' },
      { situatie: 'Zes tot acht mensen, of vaak gasten', advies: 'De Oxford van 183 cm, met verlengstuk 241 cm.', pid: 'dp_1021' },
    ],
    check: {
      vragen: [
        { k: 'mensen', vraag: 'Met hoeveel mensen eet je meestal?', opties: [['vier', 'Twee tot vier'], ['zes', 'Zes of meer']] },
        { k: 'ruimte', vraag: 'Hoe groot is de plek voor de tafel?', opties: [['drie', 'Ongeveer 3 bij 3 meter'], ['lang', 'Minstens 3,6 bij 2,8 meter']] },
        { k: 'blad', vraag: 'Wat wil je van het blad?', opties: [['marmer', 'Echt marmer'], ['sterk', 'Tegen hitte en krassen'], ['hout', 'Warm hout']] },
      ],
      regels: [
        { id: 'zes-klein', als: { mensen: ['zes'], ruimte: ['drie'] }, kop: 'Op 3 bij 3 meter past geen tafel voor zes', tekst: 'De Oxford vraagt 3,6 bij 2,8 meter, uitgeschoven 4,2 meter lang. Op 3 bij 3 meter past een ronde tafel van 119 cm voor vier, volgens de maker van de Winston tot vijf.', pid: 'dp_1027' },
        { id: 'zes', als: { mensen: ['zes'] }, kop: 'De Oxford van acacia', tekst: '183 cm voor zes, met verlengstuk 241 cm voor acht. Laat aan elke kant 90 cm vrij.', pid: 'dp_1021' },
        { id: 'hout', als: { blad: ['hout'] }, kop: 'De Oxford van massief acacia', tekst: 'De enige houten tafel hier. Past alleen als de plek minstens 3,6 bij 2,8 meter is.', pid: 'dp_1021' },
        { id: 'marmer', als: { blad: ['marmer'] }, kop: 'De Coral van Carrara-marmer', tekst: 'Rond, 119 cm. Wijn en citroen meteen wegvegen.', pid: 'dp_1025' },
        { id: 'sterk', als: { blad: ['sterk'] }, kop: 'De Winston van gesinterd steen', tekst: 'Volgens de maker bestand tegen hitte en krassen. Rond, 119 cm, vier tot vijf personen.', pid: 'dp_1027' },
      ],
    },
    uitleg: [
      { kop: 'Past de tafel? Reken 90 cm rondom', alineas: [
        'Tel bij de maat van de tafel aan elke kant 90 cm op: ruimte voor de stoel en om erlangs te lopen. Krapper dan 75 cm wordt het schuiven. Een ronde tafel van 119 cm vraagt zo een plek van ongeveer 3 bij 3 meter. De Oxford van 183 bij 99 cm vraagt 3,6 bij 2,8 meter, en met verlengstuk (241 cm) 4,2 meter lengte.',
        'Leg met plakband de omtrek van de tafel op de vloer en zet er stoelen omheen. Dan zie je in een minuut of het past.',
      ] },
      { kop: 'Hoeveel mensen passen eraan?', alineas: [
        'Reken met 60 cm tafelrand per persoon. Rond 119 cm is vier mensen ruim; de maker van de Winston noemt tot vijf. De Oxford van 183 cm is zes plaatsen aan de lange kanten, met verlengstuk acht.',
      ] },
      { kop: 'Marmer, gesinterd steen of hout?', alineas: [
        'Echt marmer (Coral) is uniek per blad maar poreus: zuur van wijn, citroen of azijn laat doffe plekken achter als het blijft liggen. Gesinterd steen (Winston) is volgens de maker bestand tegen hitte en krassen en vraagt weinig onderhoud. Massief acacia (Oxford) voelt warm en krijgt met de jaren gebruikssporen; een onderzetter onder hete pannen.',
      ] },
      { kop: 'Welke lamp erboven?', alineas: [
        'Hang een lamp boven de eettafel 60 tot 75 cm boven het blad, zodat je elkaar nog ziet. Een kap van ongeveer de helft tot twee derde van de tafelbreedte valt in verhouding: boven een ronde tafel van 119 cm is dat 60 tot 80 cm. In de gids grote hanglampen staan rotan kappen in die maten.',
      ] },
    ],
    zoKozenWe: 'We legden de eettafels die Kadoly levert naast elkaar en lazen per tafel de maten, het gewicht en wat de maker belooft. We hebben de tafels niet zelf gebruikt. Waar de maker iets niet noemt, zoals hoeveel mensen aan de Coral passen, zeggen we dat. Kadoly verdient aan elke verkoop; dat verandert niets aan wat we als beperking noemen.',
    faq: [
      { v: 'Hoe groot moet een eettafel voor vier personen zijn?', a: 'Rond ongeveer 110 tot 120 cm, of rechthoekig 120 tot 140 cm lang. De ronde tafels hier zijn 119 cm; de maker van de Winston noemt plaats voor vier tot vijf.' },
      { v: 'Hoeveel ruimte heb je nodig rond een eettafel?', a: 'Reken 90 cm aan elke kant voor stoel en doorloop, minimaal 75 cm. Voor een ronde tafel van 119 cm is dat een plek van ongeveer 3 bij 3 meter.' },
      { v: 'Is een marmeren eettafel lastig in onderhoud?', a: 'Marmer is poreus: wijn, citroen en azijn meteen wegvegen. Wil je de look zonder dat, kies gesinterd steen met marmerpatroon, zoals de Winston grigio.' },
      { v: 'Wat is gesinterd steen?', a: 'Steenpoeder dat onder hoge druk en hitte tot een plaat is gebakken. De maker van de Winston noemt het bestand tegen hitte en krassen.' },
      { v: 'Is er een uitschuifbare eettafel?', a: 'De Oxford van massief acacia is 183 cm en met verlengstuk 241 cm lang, 99 cm diep.' },
      { v: 'Worden de tafels gratis bezorgd?', a: 'Ja, de verzending is gratis. De tafels wegen 72 tot 129 kilo: zorg voor hulp bij het naar binnen dragen.' },
    ],
    bijgewerkt: '2026-11-21',
  },

  'dressoir': {
    slug: 'dressoir',
    titel: 'Dressoir, tv-meubel of ladekast kiezen: maten en hout',
    beschrijving: 'Dressoirs, tv-meubels en ladekasten van massief essen en acacia naast elkaar, met maten, gewicht en of je afstandsbediening erdoor werkt.',
    kicker: 'Keuzehulp · kasten',
    h1: 'Dressoir, tv-meubel of ladekast: welke past bij jouw muur?',
    kort: 'Voor een grote tv: de Tanner mediaconsole van 198 cm, met lattenfronten waar je afstandsbediening doorheen werkt en kabelbeheer in de achterwand. Kleinere muur: de drie-deurs Tanner van 124 cm. Een dressoir om op te bergen en iets op te zetten: de Tanner van 163 cm of de Oxford van acacia in basaltgrijs. Veel kleding of linnengoed: de brede ladekast met zes lades op kogellagers. Meet eerst de muur en houd 10 cm aan elke kant vrij.',
    keuze: [
      { pid: 'dp_1022', label: 'Tv-meubel, groot', naam: 'Tanner vierdeurs mediaconsole van essenhout, vlaskleur', waarom: 'Massief essen in Japandi-stijl, 198 cm breed, 66 cm hoog en 46 cm diep. De lattenfronten laten het signaal van een afstandsbediening door naar ontvanger, streamer of spelcomputer, en de achterwand heeft kabelbeheer. Verstelbare planken, softclose scharnieren.', beperking: '67 kilo. Hoe zwaar de tv erop mag zijn noemt de maker niet.' },
      { pid: 'dp_1023', label: 'Tv-meubel, donker', naam: 'Tanner vierdeurs mediaconsole van essenhout, roux', waarom: 'Dezelfde mediaconsole van 198 cm in roux, een aards bruin. Lattenfronten waar de afstandsbediening doorheen werkt, kabelbeheer achter.', beperking: 'Draagvermogen van het blad staat er niet bij.' },
      { pid: 'dp_1028', label: 'Tv-meubel, kleiner', naam: 'Tanner drie-deurs mediameubel, vlaskleur', waarom: '124 cm breed, 66 cm hoog en 46 cm diep, 42 kilo. Ook met lattenfronten voor de afstandsbediening, kabelbeheer en verstelbare planken.', beperking: 'Voor een tv tot ongeveer 55 inch: een bredere tv steekt buiten het meubel uit.' },
      { pid: 'dp_1037', label: 'Dressoir, licht hout', naam: 'Tanner vierdeurs dressoir, vlaskleur', waarom: 'Massief essen en essenfineer met lattenfronten, 163 cm breed, 79 cm hoog en 46 cm diep, 71 kilo. Planken verstelbaar of uitneembaar, softclose scharnieren, kabeltoegang in de achterwand.', beperking: 'Geen lades: alles achter deuren.' },
      { pid: 'dp_1032', label: 'Dressoir, donker acacia', naam: 'Oxford dressoir van acacia, basaltgrijs', waarom: 'Massief acacia met een verouderde afwerking en vernikkelde grepen, 168 cm breed, 81 cm hoog en 46 cm diep. Lades op kogellagers met zwaluwstaartverbindingen, verstelbare planken en kabelbeheer.', beperking: '90 kilo. Alleen in basaltgrijs.' },
      { pid: 'dp_1033', label: 'Ladekast, breed', naam: 'Tanner ladekast met zes lades van essenhout, vlaskleur', waarom: '173 cm breed, 84 cm hoog en 46 cm diep. Zes lades op kogellagers, volledig uittrekbaar, met uitneembaar vilt in de bovenste lades voor kwetsbare spullen. Ladebakken van vijfzijdig multiplex met zwaluwstaarten.', beperking: '87 kilo. Ook in roux.' },
      { pid: 'dp_1024', label: 'Ladekast, hoog', naam: 'Tanner ladekast met vijf lades van essenhout, vlaskleur', waarom: 'Hoog en smal: 132 cm hoog, 107 cm breed en 46 cm diep. Vijf ruime lades die helemaal uittrekken, met uitneembaar vilt voor kwetsbare spullen.', beperking: '78 kilo. Zet een hoge kast altijd vast aan de muur, zeker met kinderen in huis; een muuranker noemt de maker niet.' },
    ],
    tabelKop: 'Welk meubel past bij jouw situatie?',
    tabel: [
      { situatie: 'Tv van 65 inch of groter', advies: 'De Tanner mediaconsole van 198 cm.', pid: 'dp_1022' },
      { situatie: 'Tv tot ongeveer 55 inch, kleinere muur', advies: 'De drie-deurs Tanner van 124 cm.', pid: 'dp_1028' },
      { situatie: 'Ontvanger en spelcomputer achter de deur', advies: 'De Tanner mediaconsoles: de afstandsbediening werkt door de lattenfronten.', pid: 'dp_1022' },
      { situatie: 'Opbergen in de eetkamer, iets erop zetten', advies: 'Het Tanner dressoir van 163 cm.', pid: 'dp_1037' },
      { situatie: 'Donker hout, stoere uitstraling', advies: 'Het Oxford dressoir van acacia in basaltgrijs.', pid: 'dp_1032' },
      { situatie: 'Kleding of linnengoed, brede muur', advies: 'De Tanner ladekast met zes lades, 173 cm.', pid: 'dp_1033' },
      { situatie: 'Weinig muurbreedte', advies: 'De hoge Tanner ladekast van 107 cm breed.', pid: 'dp_1024' },
    ],
    check: {
      vragen: [
        { k: 'voor', vraag: 'Waarvoor is het meubel?', opties: [['tv', 'Tv en apparaten'], ['opbergen', 'Opbergen en iets erop zetten'], ['kleding', 'Kleding of linnengoed']] },
        { k: 'muur', vraag: 'Hoe breed is de muur?', opties: [['smal', 'Minder dan 1,5 meter'], ['middel', '1,5 tot 2 meter'], ['breed', 'Meer dan 2 meter']] },
        { k: 'kleur', vraag: 'Welke kleur hout?', opties: [['licht', 'Licht'], ['donker', 'Donker']] },
      ],
      regels: [
        { id: 'tv-smal', als: { voor: ['tv'], muur: ['smal'] }, kop: 'De drie-deurs Tanner van 124 cm', tekst: 'Past op een smallere muur en houdt de afstandsbediening werkend door de lattenfronten.', pid: 'dp_1028' },
        { id: 'tv-donker', als: { voor: ['tv'], kleur: ['donker'] }, kop: 'De Tanner mediaconsole in roux', tekst: '198 cm, lattenfronten en kabelbeheer.', pid: 'dp_1023' },
        { id: 'tv', als: { voor: ['tv'] }, kop: 'De Tanner mediaconsole van 198 cm', tekst: 'Voor een grote tv. De afstandsbediening werkt door de deuren heen.', pid: 'dp_1022' },
        { id: 'kleding-smal', als: { voor: ['kleding'], muur: ['smal'] }, kop: 'De hoge Tanner ladekast', tekst: '107 cm breed en 132 cm hoog, vijf lades. Zet hem vast aan de muur.', pid: 'dp_1024' },
        { id: 'kleding', als: { voor: ['kleding'] }, kop: 'De Tanner ladekast met zes lades', tekst: '173 cm breed, lades op kogellagers met vilt in de bovenste.', pid: 'dp_1033' },
        { id: 'opbergen-donker', als: { voor: ['opbergen'], kleur: ['donker'] }, kop: 'Het Oxford dressoir van acacia', tekst: '168 cm, basaltgrijs, lades en planken achter de deuren.', pid: 'dp_1032' },
        { id: 'opbergen', als: { voor: ['opbergen'] }, kop: 'Het Tanner dressoir van 163 cm', tekst: 'Vier deuren met verstelbare planken, licht essenhout.', pid: 'dp_1037' },
      ],
    },
    uitleg: [
      { kop: 'Hoe breed moet een tv-meubel zijn?', alineas: [
        'Minstens zo breed als de tv, liefst 20 tot 30 cm breder, zodat hij niet top-zwaar oogt. Een tv van 55 inch is ongeveer 123 cm breed, 65 inch ongeveer 145 cm en 75 inch ongeveer 168 cm. De drie-deurs Tanner (124 cm) past dus bij 55 inch, de vierdeurs (198 cm) tot 75 inch.',
      ] },
      { kop: 'Afstandsbediening achter een dichte deur', alineas: [
        'Bij de Tanner tv-meubels zitten latten in de deuren. Volgens de maker gaat het signaal van de afstandsbediening daar doorheen naar ontvanger, streamer of spelcomputer. Kabels gaan via het achterpaneel naar buiten.',
      ] },
      { kop: 'Meet de muur en de deur', alineas: [
        'Houd aan elke kant 10 cm vrij en kijk of er een stopcontact of radiator achter komt. Meet ook de voordeur en het trapgat: deze meubels wegen 42 tot 90 kilo.',
      ] },
      { kop: 'Essen of acacia?', alineas: [
        'Tanner is massief essen met essenfineer, in licht vlas of donker roux, met lattenfronten in Japandi-stijl. Oxford is massief acacia met een geborstelde, verouderde afwerking in basaltgrijs.',
      ] },
    ],
    zoKozenWe: 'We legden de kasten die Kadoly levert naast elkaar en kozen per situatie het meubel met de maten die erbij passen, volgens de productpagina van de maker. We hebben ze niet zelf gebruikt. Wat de maker niet noemt, zoals draagvermogen of een muuranker, staat als beperking. Kadoly verdient aan elke verkoop; dat verandert niets aan wat we als beperking noemen.',
    faq: [
      { v: 'Welk tv-meubel past bij een tv van 65 inch?', a: 'Een meubel van minstens 144 cm breed, mooi vanaf 174 cm. De Tanner mediaconsole is 198 cm en past mooi tot 75 inch. Andere maten: zie onze rekenhulp tv-meubel breedte berekenen.' },
      { v: 'Werkt de afstandsbediening door een dicht tv-meubel?', a: 'Bij de Tanner tv-meubels wel: volgens de maker gaat het signaal door de lattenfronten.' },
      { v: 'Wat is het verschil tussen een dressoir en een ladekast?', a: 'Een dressoir heeft vooral deuren met planken en staat vaak in de eet- of woonkamer. Een ladekast heeft alleen lades, voor kleding of linnengoed.' },
      { v: 'Hoe diep is een dressoir?', a: 'Deze zijn allemaal 46 cm diep. Het Tanner dressoir is 163 cm breed en 79 cm hoog, het Oxford dressoir 168 cm breed en 81 cm hoog.' },
      { v: 'Moet ik een ladekast aan de muur vastzetten?', a: 'Ja, zeker een hoge kast en zeker met kinderen in huis. De hoge Tanner ladekast is 132 cm; een muuranker noemt de maker niet, koop er een bij de bouwmarkt.' },
      { v: 'Worden de kasten gratis bezorgd?', a: 'Ja, de verzending is gratis. Ze wegen 42 tot 90 kilo: zorg voor hulp bij het naar binnen dragen.' },
    ],
    bijgewerkt: '2026-11-21',
  },
};

// Voor lib/gidsen-alle.js: alles van deze soort onder de gids.
export const MEUBELS_ALLE = {
  'eettafel': { kop: 'Alle eettafels', re: 'eettafel', uit: 'lamp|hanglamp|stoel|kleed|loper|placemat',
    groepen: [['Rond', 'rond'], ['Rechthoekig', 'rechthoek|uitschuif']], rest: 'Overige eettafels' },
  'dressoir': { kop: 'Alle kasten en tv-meubels', re: 'dressoir|ladekast|mediaconsole|mediameubel|tv-meubel|tv meubel|commode',
    groepen: [['Tv-meubels', 'media|tv'], ['Ladekasten', 'ladekast|commode|lades'], ['Dressoirs', 'dressoir']], rest: 'Overige kasten' },
};
