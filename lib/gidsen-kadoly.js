// De gidsen van gids.kadoly.com (api/gids.js). Elke gids is met de hand geschreven op echte productfeiten uit de shop (op=feiten);
// geen massapagina's, geen verzonnen cijfers. We hebben de producten niet zelf vastgehad (Henkjan 30 okt: nog niet zelf bestellen),
// dus elk oordeel rust op wat de maker opgeeft, en we zeggen erbij wat de maker niet vermeldt.
// Velden: slug, titel (hooguit 60 tekens), beschrijving (hooguit 155), kicker, h1, kort, keuze [{pid, label, naam, waarom, beperking}],
// tabelKop, tabel [{situatie, advies, pid}], check {vragen [{k, vraag, opties [[waarde, label]]}], regels [{id, als {k: [waarden]}, kop, tekst, pid}]},
// uitleg [{kop, alineas}], zoKozenWe, faq [{v, a}], bijgewerkt (JJJJ-MM-DD). Seizoensdata (Sinterklaas, kerst) elk jaar nalopen.
export const GIDSEN = {
  '3d-houten-puzzel-volwassenen': {
    slug: '3d-houten-puzzel-volwassenen',
    titel: '3D houten puzzel voor volwassenen: welke kies je?',
    beschrijving: 'Zeven 3D houten bouwpakketten naast elkaar: onderdelen, lijm, formaat en wat beweegt. Met prijs en levertijd van vandaag, en voor wie ze niet passen.',
    kicker: 'Keuzehulp · bouwpakketten van hout',
    h1: '3D houten puzzel voor volwassenen: welke past bij jou?',
    kort: 'Bouw je voor het eerst, begin dan met de boeknook: 168 onderdelen, geen lijm en volgens de maker 2 tot 4 uur werk. Wil je iets dat echt beweegt, kies de spin of de Speedster, die op een elastiekmotor tot 10 meter rijdt. Ervaren bouwers vinden de grootste uitdaging in de Magische Winkel (311 onderdelen, vijf sterren). Alle pakketten zijn volgens de makers bedoeld voor 14 jaar en ouder.',
    keuze: [
      { pid: 'oc_4174004503183364', label: 'Beste eerste bouwpakket', naam: 'Boeknook De Scholar\'s Boekwinkel', waarom: '168 onderdelen die zonder lijm in elkaar klikken. De maker rekent 2 tot 4 uur bouwen. Daarna staat er een klein boekwinkeltje tussen je boeken.', beperking: 'Klein: 17 cm hoog. Het is een plankdecoratie, geen groot pronkstuk.' },
      { pid: 'oc_4174004332822530', label: 'Beweegt echt', naam: 'Spin met bewegende poten', waarom: '293 onderdelen, geen lijm. Een motor op elastiek laat de poten lopen. Na het bouwen 35 cm breed.', beperking: 'Vier van de vijf sterren moeilijkheid: niet in één avondje klaar voor wie nog nooit bouwde.' },
      { pid: 'oc_4174004402634753', label: 'Voor wie van auto\'s houdt', naam: 'Speedster V2', waarom: '442 onderdelen, geen lijm. De auto rijdt op een elastiekmotor tot 10 meter, met vooruit, achteruit en neutraal. Deuren, kofferbak en motorkap gaan open, met een V8 onder de kap.', beperking: 'Het model is maar 16 cm lang. Veel techniek in een klein formaat.' },
      { pid: 'oc_4174004386267138', label: 'Groot pronkstuk', naam: 'Grammofoon', waarom: 'Na het bouwen 41 cm lang, 27 cm breed en 31 cm hoog, en 1,2 kilo hout. Valt op in de kast.', beperking: 'De maker noemt geen aantal onderdelen en geen moeilijkheid. Meet eerst of er plek is.' },
      { pid: 'oc_4174004469792770', label: 'Met muziek', naam: 'Muziekdoos Bosfeest', waarom: '89 onderdelen. Als hij af is, speelt hij de melodie Always with me. Een cadeau dat iets doet als je het opendraait.', beperking: 'Lijm zit er niet bij. Vier sterren moeilijkheid en volgens de maker vanaf 15 jaar.' },
      { pid: 'oc_4174004474920961', label: 'Voor de echte uitdaging', naam: 'Magische Winkel met geluid', waarom: '311 onderdelen en de hoogste moeilijkheid: vijf sterren. Een winkeltje vol details met geluidseffecten.', beperking: 'Lijm en batterijen zitten er niet bij (de maker raadt witte lijm aan). Niet voor een eerste keer.' },
      { pid: 'oc_4174004451622913', label: 'Kleinste budget', naam: 'Uil spaarpot', waarom: '88 onderdelen en na het bouwen een echte spaarpot van 13 cm hoog. Een klein cadeau of een proefje om te zien of bouwen iets voor je is.', beperking: 'De maker raadt lijm aan voor een stevige spaarpot. Lijm zit er niet bij.' },
    ],
    tabelKop: 'Welk bouwpakket past bij jouw situatie?',
    tabel: [
      { situatie: 'Nog nooit gebouwd, wil een rustige avond', advies: 'Een pakket zonder lijm met weinig onderdelen.', pid: 'oc_4174004503183364' },
      { situatie: 'Wil dat het na het bouwen beweegt', advies: 'Een model met elastiekmotor.', pid: 'oc_4174004332822530' },
      { situatie: 'Houdt van auto\'s en techniek', advies: 'Een rijdend model met deuren die opengaan.', pid: 'oc_4174004402634753' },
      { situatie: 'Zoekt iets groots voor de kast', advies: 'Kies op formaat, niet op aantal onderdelen.', pid: 'oc_4174004386267138' },
      { situatie: 'Wil een cadeau met muziek', advies: 'Een muziekdoos; koop er wel houtlijm bij.', pid: 'oc_4174004469792770' },
      { situatie: 'Ervaren bouwer, wil een uitdaging', advies: 'Vijf sterren en de meeste details.', pid: 'oc_4174004474920961' },
      { situatie: 'Budget onder de 20 euro', advies: 'Een klein model met een functie.', pid: 'oc_4174004451622913' },
      { situatie: 'Cadeau voor een kind jonger dan 14', advies: 'Niet doen: de makers bedoelen deze pakketten voor 14 jaar en ouder.', pid: '' },
    ],
    check: {
      vragen: [
        { k: 'voor', vraag: 'Voor wie is het?', opties: [['zelf', 'Voor mezelf'], ['volw', 'Cadeau voor een volwassene'], ['tiener', 'Cadeau voor een tiener van 14 of ouder'], ['kind', 'Cadeau voor een kind jonger dan 14']] },
        { k: 'ervaring', vraag: 'Hoeveel ervaring met bouwpakketten?', opties: [['nooit', 'Nog nooit gedaan'], ['paar', 'Een paar keer'], ['veel', 'Veel']] },
        { k: 'leuk', vraag: 'Wat maakt het leuk?', opties: [['beweegt', 'Dat het beweegt'], ['kast', 'Iets moois voor de kast'], ['muziek', 'Muziek'], ['maakt', 'Maakt niet uit']] },
      ],
      regels: [
        { id: 'kind', als: { voor: ['kind'] }, kop: 'Liever niet voor een kind onder de 14', tekst: 'De makers bedoelen al deze bouwpakketten voor 14 jaar en ouder, sommige voor 15 jaar en ouder. Voor een jonger kind raden we ze af, tenzij een volwassene meebouwt.' },
        { id: 'muziek', als: { leuk: ['muziek'] }, kop: 'De muziekdoos Bosfeest', tekst: '89 onderdelen en hij speelt een melodie als hij af is. Let op: lijm zit er niet bij en de maker geeft vier sterren moeilijkheid. Heb je nog nooit gebouwd, koop dan houtlijm erbij en neem er een paar avonden voor.', pid: 'oc_4174004469792770' },
        { id: 'beweegt-veel', als: { leuk: ['beweegt'], ervaring: ['veel'] }, kop: 'De Speedster V2', tekst: '442 onderdelen zonder lijm, en hij rijdt tot 10 meter op een elastiekmotor. Voor wie van techniek houdt.', pid: 'oc_4174004402634753' },
        { id: 'beweegt', als: { leuk: ['beweegt'] }, kop: 'De spin met bewegende poten', tekst: '293 onderdelen zonder lijm en de poten lopen echt. Reken op meer dan één avond.', pid: 'oc_4174004332822530' },
        { id: 'kast-nooit', als: { leuk: ['kast'], ervaring: ['nooit'] }, kop: 'Begin met de boeknook', tekst: 'Voor een eerste keer is de grammofoon groot werk zonder opgave van de moeilijkheid. De boeknook is klein, zonder lijm en volgens de maker in 2 tot 4 uur klaar.', pid: 'oc_4174004503183364' },
        { id: 'kast', als: { leuk: ['kast'] }, kop: 'De grammofoon', tekst: 'Na het bouwen 41 bij 27 bij 31 cm: een echt pronkstuk. Meet eerst of je er plek voor hebt.', pid: 'oc_4174004386267138' },
        { id: 'uitdaging', als: { leuk: ['maakt'], ervaring: ['veel'] }, kop: 'De Magische Winkel', tekst: 'Vijf sterren en 311 onderdelen. Koop witte houtlijm en batterijen erbij, die zitten er niet in.', pid: 'oc_4174004474920961' },
        { id: 'paar', als: { leuk: ['maakt'], ervaring: ['paar'] }, kop: 'De spin met bewegende poten', tekst: 'Een stap verder dan een beginnerspakket, zonder lijm, en hij doet iets als hij af is.', pid: 'oc_4174004332822530' },
        { id: 'nooit', als: { leuk: ['maakt'], ervaring: ['nooit'] }, kop: 'De boeknook', tekst: '168 onderdelen, geen lijm, 2 tot 4 uur. Bevalt het, dan is de spin of de Speedster een mooie volgende.', pid: 'oc_4174004503183364' },
      ],
    },
    uitleg: [
      { kop: 'Waar let je op bij een 3D houten puzzel?', alineas: [
        'Aantal onderdelen en sterren. De makers geven de moeilijkheid in sterren, van een tot vijf. Meer onderdelen en meer sterren betekent meer avonden werk. Alleen bij de boeknook noemt de maker een bouwtijd: 2 tot 4 uur.',
        'Lijm. De meeste pakketten klikken zonder lijm in elkaar (de boeknook, de spin, de Speedster en de trein). Bij de muziekdoos Bosfeest en de Magische Winkel zit geen lijm, terwijl je die wel nodig hebt; bij de uil raadt de maker lijm aan.',
        'Formaat. Kijk naar de centimeters, niet naar de foto. De Speedster is 16 cm lang, de boeknook 17 cm hoog en de grammofoon ruim 40 cm lang.',
        'Wat het doet als het af is. Sommige modellen bewegen op een elastiekmotor, spelen muziek of zijn een spaarpot. Dat maakt het als cadeau vaak leuker dan alleen iets om neer te zetten.',
      ] },
    ],
    zoKozenWe: 'We legden alle 3D houten bouwpakketten uit onze winkel naast elkaar: bijna 150 stuks, vrijwel allemaal geleverd door Art Bizniz, veel onder het merk Eco-Wood-Art. We kozen op wat de maker zelf opgeeft: aantal onderdelen, moeilijkheid, formaat, of er lijm nodig is en wat het model doet. We hebben ze niet zelf gebouwd. Daarom staat bij elk pakket ook wat de maker niet vermeldt of wat tegen kan vallen.',
    faq: [
      { v: 'Heb je lijm nodig voor een 3D houten puzzel?', a: 'Meestal niet. De boeknook, de spin, de Speedster en de trein klikken zonder lijm in elkaar. Bij de muziekdoos Bosfeest en de Magische Winkel zit geen lijm in het pakket, terwijl de maker die wel aanraadt (witte houtlijm). Bij de uil spaarpot raadt de maker lijm aan voor een stevige spaarpot.' },
      { v: 'Vanaf welke leeftijd is een 3D houten puzzel geschikt?', a: 'De makers bedoelen deze pakketten voor 14 jaar en ouder. De muziekdoos Bosfeest en de Magische Winkel zijn volgens de maker voor 15 jaar en ouder.' },
      { v: 'Hoe lang ben je bezig met een 3D houten puzzel?', a: 'Alleen voor de boeknook geeft de maker een bouwtijd: 2 tot 4 uur voor 168 onderdelen. Pakketten met 300 tot 500 onderdelen en vier of vijf sterren kosten meer avonden.' },
      { v: 'Welke 3D houten puzzel is het moeilijkst?', a: 'Van deze keuze de Magische Winkel: vijf sterren en 311 onderdelen, met lijm en batterijen die je zelf koopt. De trein (538 onderdelen) en de Speedster (442) hebben vier sterren.' },
      { v: 'Wanneer heb ik het in huis?', a: 'Het merk verstuurt het pakket met DHL en track en trace; reken op 3 tot 5 werkdagen. Bij elk product hierboven staat de verwachte dag als je vandaag bestelt. Voor Sinterklaas 2026 bestel je uiterlijk vrijdag 27 november, voor kerst uiterlijk donderdag 17 december.' },
      { v: 'Kan ik het terugsturen als het tegenvalt?', a: 'Ja. Je hebt 14 dagen na ontvangst. Je krijgt een retourlabel en het hele bedrag terug.' },
    ],
    bijgewerkt: '2026-10-30',
  },
};
export const GIDS_IDS = Object.keys(GIDSEN);
