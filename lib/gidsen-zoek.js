// Gidsen op zoekvraag en AI-vraag (28 nov 2026, Henkjan: "Maak hiervoor content zodat we organisch pakken en zet de producten op die pagina .",
// "Maak hier ook top content van met onze producten erbij laat me ook UX zien" en "Kijk vooral ook welke vragen LLMS stellen en waar wij het
// antwoord op moeten worden . En zijn met Kadoly . Optimaliseer daar ook op .").
// CONCEPT, NIET LIVE. Niets hieruit staat in GIDSEN, de sitemap of llms.txt. Alleen te zien op de beschermde host: /api/gids?op=zoekgids
// (overzicht) en /api/gids?op=zoekgids&voorbeeld=<slug> (de pagina zoals hij live zou komen, noindex). Live na Henkjans ja: de NIEUW-gidsen
// naar GIDSEN in lib/gidsen-kadoly.js en de SCHERP-regels in de bestaande gidsen.
// Zoekvolume: Demand Radar thema sieraden en kadoly-wonen, NL per maand, opgehaald 28 nov 2026 (geen extra kosten).
// Productfeiten: gelezen op de productpagina van kadoly.com op 28 nov 2026 (Beschrijving en Specificaties). Prijzen staan niet in de tekst
// maar als {p:<product-id>} en komen bij elk bezoek live uit de shopcatalogus (inclusief btw en verzending), net als in lib/gids-llmgat.js.
// AI-meting: Demand Radar (api/gaps?latest=1, 28 nov 2026) heeft geen enkele vraag over sieraden of wonen. Daarom zelf gemeten zoals in
// lib/gids-llmgat.js: de vraag zoals iemand hem aan een AI stelt, antwoord zonder webzoeken in 60 tot 90 woorden, genoteerd wie genoemd wordt
// en of er een eerste keus is. Dit is een eigen meting, geen onafhankelijke test. Na live: elke week de koopvraag via Demand Radar gaps?ask
// (Perplexity, GPT, Gemini) en noteren of Kadoly genoemd wordt.

export const ZOEK_DAG = '2026-11-28';
export const GEMETEN_DOOR = 'Claude, zonder webzoeken, eigen tokens; één antwoord per vraag, 28 november 2026. Eigen meting, geen onafhankelijke test.';

// Bronnen van deze gidsen (los van BRONNEN in lib/gids-onderzoek.js, zodat de openbare bronnenpagina niet verandert zolang dit concept is).
export const ZOEK_BRONNEN = {
  lucide: { titel: 'How high should a lamp hang above the dining table?', organisatie: 'Lucide (lampenmaker)', url: 'https://lucide.com/en/blogs/how-high-should-a-lamp-hang-above-the-dining-table', grens: 'Vuistregel van een lampenmaker, geen norm.' },
  bluenile: { titel: 'Gold vermeil', organisatie: 'Blue Nile (juwelier)', url: 'https://www.bluenile.com/blog/diamonds-jewelry/gold-vermeil', grens: 'Definitie zoals een juwelier die gebruikt; de makers in deze gids noemen geen laagdikte, op één na.' },
  radar: { titel: 'Verkleurde sieraden? Vier tips om het te voorkomen', organisatie: 'Radar (AVROTROS)', url: 'https://radar.avrotros.nl/artikel/verkleurde-sieraden-vier-tips-om-het-te-voorkomen-54109', grens: 'Algemene tips voor consumenten; geen test van deze sieraden.' },
  hg: { titel: 'Hoe krijg je zwart zilver weer schoon?', organisatie: 'HG', url: 'https://hg.eu/nl/advies/woonkamer/goud-zilver-koper/hoe-krijg-je-zwart-zilver-weer-schoon', grens: 'Advies van een maker van schoonmaakmiddelen.' },
  gia: { titel: 'Differences between pearl types', organisatie: 'GIA (Gemological Institute of America)', url: 'https://www.gia.edu/articles/differences-between-pearl-types', grens: 'Algemene kennis over parelsoorten; geen keuring van deze kettingen.' },
  qvc: { titel: 'Kettenlängen Beratung', organisatie: 'QVC', url: 'https://www.qvc.de/content/dam/qvc_de/pdf/Kettenlaengen_Beratung_2020.pdf', grens: 'Advies van een winkel; zegt hoe lengte en maat samenhangen, niet waar elke lengte valt.' },
};

// Per onderwerp: de zoekterm, het volume, de vraag die mensen aan een AI stellen en wat een AI nu antwoordt.
// level zoals in de skill keuzehulp-bouw: open (niemand), generic (alleen grote winkels), unclear (namen, geen eerste keus), taken (eerste keus).
export const ONDERWERPEN = [
  { slug: 'gouden-oorbellen', soort: 'nieuw', term: 'gouden oorbellen', volume: 9900, ook: 'oorbellen 27.100',
    vraag: 'Welke gouden oorbellen kan ik elke dag dragen zonder dat ze verkleuren?',
    meting: { level: 'unclear', antwoord: 'Kies massief goud van 14 karaat (585) of 18 karaat (750); dat verkleurt niet en kan tegen dagelijks dragen. Kleine oorknopjes of creolen van 1 tot 2 cm zitten het prettigst. Verguld zilver of verguld staal is goedkoper, maar de goudlaag slijt. Bij Lucardi of Siebel, of bij merken als Mi Moneda en Ania Haie, vind je goede opties. Let op nikkelvrij als je gevoelige oren hebt.', genoemd: ['Lucardi', 'Siebel', 'Mi Moneda', 'Ania Haie'], eersteKeus: false } },
  { slug: 'gouden-ketting-dames', soort: 'nieuw', term: 'ketting goud dames', volume: 9900, ook: 'gouden ketting 12.100',
    vraag: 'Welke gouden ketting voor dames is mooi voor elke dag en niet te duur?',
    meting: { level: 'unclear', antwoord: 'Een dunne schakelketting van 14 karaat goud van 42 tot 45 cm is tijdloos en past bij alles. Wil je minder uitgeven, kies dan goud op zilver of verguld roestvrij staal, dat beter tegen water kan dan gewoon verguld. Kijk bij Lucardi of de Bijenkorf, bij merken als Isabel Bernard, of op bol.com. Let op een stevige sluiting en een verlengstukje.', genoemd: ['Lucardi', 'de Bijenkorf', 'Isabel Bernard', 'bol.com'], eersteKeus: false } },
  { slug: 'zilveren-ketting', soort: 'nieuw', term: 'zilveren ketting', volume: 7480,
    vraag: 'Welke zilveren ketting verkleurt niet?',
    meting: { level: 'unclear', antwoord: 'Echt 925 sterling zilver kan altijd wat donker worden door zwavel in de lucht, maar een rhodiumlaag houdt het langer mooi. Wil je helemaal geen verkleuring, kies dan roestvrij staal of titanium. Bewaar zilver droog en afgesloten en poets het af en toe met een zilverdoekje. Bekende merken zijn Pandora, Thomas Sabo en Lucardi.', genoemd: ['Pandora', 'Thomas Sabo', 'Lucardi'], eersteKeus: false } },
  { slug: 'parelketting', soort: 'nieuw', term: 'parelketting', volume: 4400,
    vraag: 'Waar koop ik een echte parelketting die niet te duur is?',
    meting: { level: 'generic', antwoord: 'Voor een betaalbare echte parelketting kies je gekweekte zoetwaterparels; die zijn veel goedkoper dan Akoya- of Zuidzeeparels. Let op de glans, het aantal oneffenheden en of de parels een voor een geknoopt zijn. Bij een juwelier als Lucardi, of online bij bol.com of Etsy, vind je opties vanaf een paar tientjes. Vraag altijd of het echte parels zijn en geen glas of schelp.', genoemd: ['Lucardi', 'bol.com', 'Etsy'], eersteKeus: false } },
  { slug: 'dienblad', soort: 'nieuw', term: 'dienblad', volume: 9900, ook: 'houten dienblad 2.900',
    vraag: 'Welk dienblad gebruik je als decoratie op de salontafel?',
    meting: { level: 'generic', antwoord: 'Een decoratief dienblad maakt van losse spullen één geheel. Kies een rond blad bij een ronde tafel en een rechthoekig bij een lange. Hout of rotan geeft warmte, metaal of marmer een strakke look. Zet er een kaars, een klein plantje en een paar boeken op. Mooie opties vind je bij HEMA, IKEA, Zara Home en H&M Home.', genoemd: ['HEMA', 'IKEA', 'Zara Home', 'H&M Home'], eersteKeus: false } },
  { slug: 'hanglamp-eettafel', soort: 'nieuw', term: 'hanglamp eettafel', volume: 22200, ook: 'hanglamp 33.100',
    vraag: 'Hoe hoog moet een hanglamp boven de eettafel hangen en welke maat kies ik?',
    meting: { level: 'generic', antwoord: 'Hang de onderkant van de lamp 60 tot 75 cm boven het tafelblad, zodat je elkaar nog aankijkt en niet in het licht kijkt. De lamp mag ongeveer een derde tot de helft van de tafelbreedte zijn; bij een lange tafel werken twee of drie kleinere lampen beter. Kies warm wit licht en het liefst dimbaar. Zoek bij IKEA, Light & Living of bol.com.', genoemd: ['IKEA', 'Light & Living', 'bol.com'], eersteKeus: false } },
  { slug: 'oplaadbare-tafellamp', soort: 'scherp', term: 'oplaadbare lamp', volume: 5400, ook: 'tafellamp oplaadbaar 4.400',
    vraag: 'Welke oplaadbare tafellamp is goed en gaat lang mee?',
    meting: { level: 'unclear', antwoord: 'Bekende keuzes zijn de Fatboy Edison the Petit, de Zafferano Poldina en de Kartell Battery. Let op de brandduur op één lading, of hij dimbaar is, opladen met USB-C en IP44 als je hem ook buiten zet. Goedkopere vind je bij bol.com, Fonq en IKEA.', genoemd: ['Fatboy', 'Zafferano', 'Kartell', 'bol.com', 'Fonq', 'IKEA'], eersteKeus: false } },
  { slug: 'bloempot-binnen', soort: 'scherp', term: 'bloempot binnen', volume: 5400, ook: 'bloempot 12.100',
    vraag: 'Welke bloempot voor binnen lekt niet?',
    meting: { level: 'generic', antwoord: 'Kies een sierpot zonder gat als buitenpot en zet de plant erin in een kweekpot met gaten, of gebruik een schotel onder een pot met gat. Geglazuurde keramiek en kunststof houden water het best tegen. Elho, IKEA en tuincentra als Intratuin hebben veel keus.', genoemd: ['Elho', 'IKEA', 'Intratuin'], eersteKeus: false } },
  { slug: 'lantaarn-voor-binnen', soort: 'scherp', term: 'lantaarn', volume: 4400, ook: 'windlicht 3.600',
    vraag: 'Welke lantaarn voor binnen kan veilig met een echte kaars?',
    meting: { level: 'generic', antwoord: 'Kies een lantaarn van metaal en glas met genoeg ruimte boven de vlam en wat ventilatie, zodat het glas niet te heet wordt. Gebruik een stompkaars die stevig staat en laat hem nooit alleen branden. Mooie lantaarns vind je bij Light & Living, Riviera Maison, IKEA en Action.', genoemd: ['Light & Living', 'Riviera Maison', 'IKEA', 'Action'], eersteKeus: false } },
  { slug: 'bijzettafel', soort: 'scherp', term: 'bijzettafel', volume: 40500, ook: 'bijzettafel buiten 8.100',
    vraag: 'Welke bijzettafel past naast mijn bank?',
    meting: { level: 'generic', antwoord: 'Kies een bijzettafel die ongeveer even hoog is als de armleuning van je bank, meestal 50 tot 60 cm, en niet te diep zodat hij niet in de weg staat. Rond oogt zachter, een C-tafel kun je over de zitting schuiven. Kijk bij IKEA, Leen Bakker, Fonq of vtwonen.', genoemd: ['IKEA', 'Leen Bakker', 'Fonq', 'vtwonen'], eersteKeus: false } },
];

// Vraag zonder passend product: eerst inkoop, geen gids (een gids zonder product is een pagina die niets verkoopt).
export const ZONDER_PRODUCT = [
  { term: 'herenhorloge', volume: 27100, waarom: 'Kadoly verkoopt geen horloges. Leveranciers om te vragen: de horlogemerken bij Orderchamp en Droppery.' },
  { term: 'tulpenvaas', volume: 9900, waarom: 'Geen vaas met de naam of vorm voor tulpen in de winkel; de 118 vazen zijn vooral voor droogbloemen of brede boeketten.' },
  { term: 'aroma diffuser', volume: 6600, waarom: 'Alleen twee geurstokjes-diffusers (rietjes), geen aroma diffuser met water en olie. Geurstokjes zelf: 12.100 per maand, maar met twee producten te dun voor een gids.' },
  { term: 'wasmand 3 vakken', volume: 6600, waarom: 'Wel rieten wasmanden (gids manden), geen wasmand met 3 vakken.' },
];

const NIEUW_GIDSEN = {
  'gouden-oorbellen': {
    slug: 'gouden-oorbellen',
    titel: 'Gouden oorbellen of goud verguld: welke kies je?',
    beschrijving: 'Goud verguld zilver of verguld staal: welke oorbellen je elke dag draagt, het verschil met massief goud, en zeven paren met de maten van de maker.',
    kicker: 'Keuzehulp · oorbellen',
    h1: 'Gouden oorbellen: goud verguld zilver of verguld staal?',
    kort: 'Massief gouden oorbellen van 14 of 18 karaat verkoopt Kadoly niet; wel goud verguld 925 sterling zilver en verguld roestvrij staal. Voor elke dag zijn kleine creolen het makkelijkst: de Tamani creolen van verguld staal zijn 1,6 cm en volgens de maker bestand tegen dagelijkse vochtigheid. Wil je zilver onder de goudlaag, kies dan de vergulde oorknopjes van gerecycled 925 zilver, 5 mm. Een vergulde laag slijt met de tijd, dus doe oorbellen uit bij douchen, zwemmen en sporten. Geen van deze makers noemt hoe dik de goudlaag is.',
    keuze: [
      { pid: 'oc_4254789968101377', label: 'Elke dag, verguld staal', naam: 'Tamani creolen verguld roestvrij staal, 1,6 cm', waarom: 'Kleine creolen van roestvrij staal met een goudkleurige laag, 1,6 cm doorsnede. De maker noemt ze waterbestendig: gemaakt om dagelijkse vochtigheid te weerstaan.', beperking: 'Waterbestendig is niet waterdicht: doe ze uit bij zwemmen en douchen. Hoe dik de goudlaag is, staat er niet bij.' },
      { pid: 'oc_4254789979095041', label: 'Klein, zilver onder het goud', naam: 'Vergulde oorknopjes met zoetwaterparels, 5 mm', waarom: 'Van gerecycled 925 sterling zilver met een goudkleurige laag, 5 mm groot, met drie pareltjes van 1 mm. Klein genoeg om met een tweede paar te combineren.', beperking: 'Heel klein: wie iets wil dat opvalt, kiest een creool. Dikte van de goudlaag niet vermeld.' },
      { pid: 'oc_4254789988040705', label: 'Eigen vorm', naam: 'Goosy creolen verguld roestvrij staal, 18,5 x 23 mm', waarom: 'Handgemaakte creolen met een eigen vorm, van roestvrij staal met een vergulde laag, 18,5 bij 23 mm.', beperking: 'Over water en de dikte van de laag zegt de maker niets.' },
      { pid: 'oc_4254789957943297', label: 'Groot en mat', naam: 'Chunky creolen goudkleurig roestvrij staal, 27 mm', waarom: 'Brede creolen van roestvrij staal met een matte goudkleurige laag, 27 bij 22 mm. Voor wie oorbellen wil die je van een afstand ziet.', beperking: 'Goudkleurig, geen goud: het blijft een laag op staal. Groter en zwaarder dan de andere; het gewicht noemt de maker niet.' },
      { pid: 'oc_4254789945278465', label: 'Met bedel', naam: 'Vergulde amulet creolen, 925 zilver', waarom: 'Creolen van 2,9 cm van 925 sterling zilver met een goudkleurige laag en een bedel van 10,9 bij 11,8 mm; samen 4,3 cm lang.', beperking: 'Met de bedel hangen ze lager dan een gewone creool. Dikte van de goudlaag niet vermeld.' },
      { pid: 'oc_4254789951422465', label: 'Met parel, voor een feest', naam: 'Vergulde creolen met zoetwaterparels, 18 mm', waarom: 'Handgemaakte creolen van 925 sterling zilver met een goudkleurige laag, 18 mm doorsnede, met zoetwaterparels.', beperking: 'Parels en een vergulde laag houd je uit de buurt van water en parfum.' },
      { pid: 'oc_4251972627562497', label: 'Dikkere laag, vermeil', naam: 'Barokke parel oorbellen in roségoud vermeil', waarom: 'Echte barokke parels aan sterling zilver met roségoudkleurig vermeil, 3,4 bij 1,8 cm. Vermeil is een dikkere goudlaag op sterling zilver dan gewoon verguld.', beperking: 'Roségoud, geen geelgoud. De dikte van het vermeil staat er niet bij. De duurste van deze zeven.' },
    ],
    tabelKop: 'Welke oorbellen passen bij jou?',
    tabel: [
      { situatie: 'Elke dag, ook naar het werk', advies: 'Kleine creolen van verguld staal.', pid: 'oc_4254789968101377' },
      { situatie: 'Gevoelige oren', advies: 'Geen van deze makers noemt nikkelvrij. Vraag het ons vóór je bestelt; de oorknopjes zijn van 925 zilver.', pid: 'oc_4254789979095041' },
      { situatie: 'Je wilt dat ze opvallen', advies: 'De chunky creolen van 27 mm, mat goudkleurig.', pid: 'oc_4254789957943297' },
      { situatie: 'Feest of cadeau', advies: 'Creolen met zoetwaterparels.', pid: 'oc_4254789951422465' },
      { situatie: 'Zo lang mogelijk mooi', advies: 'Vermeil, de dikkere goudlaag op sterling zilver.', pid: 'oc_4251972627562497' },
    ],
    uitleg: [
      { kop: 'Goud, verguld of vermeil: het verschil', alineas: [
        'Massief goud van 14 of 18 karaat is goud door en door. Verguld is een dunne goudlaag op een ander metaal, zoals zilver, messing of staal; volgens juwelier Blue Nile vaak dunner dan 0,5 micron.',
        'Vermeil is een goudlaag van minstens 2,5 micron op sterling zilver, ook volgens Blue Nile. Dat is ongeveer vijf keer zo dik als gewoon verguld, dus het gaat langer mee.',
        'Bij Kadoly zijn alle goudkleurige oorbellen verguld, vermeil of goudkleurig. Massief gouden oorbellen hebben we niet.' ] },
      { kop: 'Zo blijft verguld langer mooi', alineas: [
        'Doe oorbellen uit bij douchen, zwemmen, sporten en slapen. Zweet en water versnellen verkleuring, schrijft Radar van AVROTROS.',
        'Laat parfum en bodylotion eerst intrekken en doe dan pas je oorbellen in. Bewaar elk paar los in een doosje, zodat ze niet langs elkaar krassen.' ] },
    ],
    zoKozenWe: 'We namen alleen oorbellen die nu bij Kadoly op voorraad zijn en waarvan de maker materiaal en maat noemt. Die lazen we op 28 november 2026 op de productpagina. We kozen op draagbaarheid voor elke dag, maat en wat er onder het goud zit. Een plek in deze gids is niet te koop.',
    faq: [
      { v: 'Zijn goud vergulde oorbellen echt goud?', a: 'Er zit echt goud op, maar als dunne laag op zilver of staal. Daaronder is het ander metaal. Massief goud is goud door en door; dat verkoopt Kadoly niet.' },
      { v: 'Hoe lang gaan vergulde oorbellen mee?', a: 'Dat hangt af van de dikte van de laag en hoe je ze draagt. Gewoon verguld is vaak dunner dan 0,5 micron, vermeil minstens 2,5 micron (Blue Nile). Uitdoen bij water, zweet en parfum maakt het verschil. De makers in deze gids noemen de dikte niet.' },
      { v: 'Wat is beter: verguld zilver of verguld staal?', a: 'Onder verguld zilver zit 925 sterling zilver. Slijt de laag, dan wordt het zilverkleurig, en zilver kan donker worden door zwavel in de lucht (HG). Onder verguld staal zit roestvrij staal. Van de oorbellen hier noemt alleen de Tamani zich waterbestendig.' },
      { v: 'Zijn deze oorbellen nikkelvrij?', a: 'De makers noemen het niet. Ben je gevoelig, vraag het ons dan vóór je bestelt; wij vragen het na bij de maker.' },
    ],
    bronnen: ['bluenile', 'radar', 'hg'],
    llm: {
      opening: 'Voor elke dag zijn kleine creolen het makkelijkst. Onze eerste keus bij Kadoly zijn de Tamani creolen van verguld roestvrij staal ({p:oc_4254789968101377}): 1,6 cm, en volgens de maker bestand tegen dagelijkse vochtigheid. Wil je 925 zilver onder het goud, kies dan de vergulde oorknopjes met pareltjes ({p:oc_4254789979095041}). Massief gouden oorbellen verkopen we niet. Prijzen zijn inclusief btw en verzending.',
      antwoord: 'Massief goud van 14 of 18 karaat verkleurt niet, maar is duur. Bij goud verguld slijt de laag met de tijd. Onze eerste keus bij Kadoly voor elke dag: de Tamani creolen van verguld roestvrij staal ({p:oc_4254789968101377}, inclusief verzending), 1,6 cm en volgens de maker bestand tegen dagelijkse vochtigheid. Doe ze uit bij douchen, zwemmen en sporten.',
    },
    bijgewerkt: '2026-11-28',
  },

  'gouden-ketting-dames': {
    slug: 'gouden-ketting-dames',
    titel: 'Gouden ketting dames: verguld staal of zilver?',
    beschrijving: 'Zes goudkleurige kettingen voor dames naast elkaar: lengte, dikte, verguld staal of verguld zilver, en welke de maker waterdicht noemt.',
    kicker: 'Keuzehulp · kettingen',
    h1: 'Gouden ketting voor dames: welke kies je voor elke dag?',
    kort: 'Massief gouden kettingen verkoopt Kadoly niet; wel verguld roestvrij staal en verguld 925 zilver. Voor elke dag is de vergulde RVS ketting van 45 cm met 7 cm verlenging het makkelijkst: de maker noemt hem waterdicht. Fijn en licht is de verguld zilveren ketting van Luxaa: 41 cm, 1 mm dik en 0,9 gram. Voor een stoere look kies je de Bold Clip ketting met schakels van 2 cm. Meet een ketting die je al hebt, want 45 cm valt bij een kleine maat ruimer dan bij een grote.',
    keuze: [
      { pid: 'oc_4254789960155137', label: 'Elke dag, waterdicht', naam: 'Vergulde RVS ketting, 45 cm + 7 cm', waarom: 'Roestvrij staal met een goudkleurige laag, 45 cm met 7 cm verlenging, zodat je de lengte zelf kiest. De maker noemt hem waterdicht.', beperking: 'Shampoo, chloor en parfum blijven slecht voor elke laag. Dikte van de goudlaag niet vermeld.' },
      { pid: 'oc_4251973824462849', label: 'Fijn en licht', naam: 'Verguld zilveren ketting van Luxaa, 41 cm', waarom: '925 sterling zilver met verguldsel, 41 cm lang, 1 mm dik en 0,9 gram. Een dunne ketting voor een hanger of los.', beperking: 'Geen verlenging genoemd, en 41 cm valt hoog in de hals. Zo dun is hij kwetsbaarder dan een schakelketting.' },
      { pid: 'oc_4254790062358529', label: 'Stoer, grote schakels', naam: 'Vergulde Bold Clip ketting, 45 cm', waarom: 'Waterdicht roestvrij staal met een goudkleurige laag, volgens de maker; 45 cm met schakels van 2 bij 0,8 cm.', beperking: 'Geen verlenging: de lengte ligt vast.' },
      { pid: 'oc_4254789987467265', label: 'Klassieke schakel', naam: 'Goudkleurige Cuban Figaro ketting, 49 cm', waarom: 'Roestvrij staal met verguldsel, 49 cm lang en 0,5 cm dik. Langer dan de andere kettingen hier.', beperking: 'Over water zegt de maker niets.' },
      { pid: 'oc_4254789953011713', label: 'Laagdikte bekend', naam: 'Gabriel halsketting met engel, 42 cm + 6 cm', waarom: '316L roestvrij staal met een geelgoudkleurige laag van 1,5 tot 2 micron: de enige maker hier die de dikte noemt. 42 cm met 6 cm verlenging, hanger 2,5 cm.', beperking: 'Een engel als hanger past niet bij iedereen.' },
      { pid: 'oc_4254789969035265', label: 'Met kleur', naam: 'Ketting met kleurrijke zirkonia, verguld zilver', waarom: '925 sterling zilver met een goudkleurige laag en gekleurde zirkonia, 40 cm met 5 cm verlenging.', beperking: 'Zirkonia is een synthetische steen, geen edelsteen.' },
    ],
    tabelKop: 'Welke ketting past bij jou?',
    tabel: [
      { situatie: 'Elke dag, zonder gedoe', advies: 'Verguld staal met verlenging; de maker noemt hem waterdicht.', pid: 'oc_4254789960155137' },
      { situatie: 'Met een eigen hanger', advies: 'De fijne verguld zilveren ketting van 1 mm.', pid: 'oc_4251973824462849' },
      { situatie: 'Laagjes dragen', advies: 'Combineer de Luxaa van 41 cm met de Figaro van 49 cm.', pid: 'oc_4254789987467265' },
      { situatie: 'Je wilt weten hoe dik het goud is', advies: 'De enige met een opgegeven laag: 1,5 tot 2 micron.', pid: 'oc_4254789953011713' },
      { situatie: 'Cadeau met kleur', advies: 'Verguld zilver met gekleurde zirkonia.', pid: 'oc_4254789969035265' },
    ],
    uitleg: [
      { kop: 'Welke lengte?', alineas: [
        'De makers geven de lengte inclusief sluiting. Meet een ketting die je al hebt en goed vindt zitten; dat werkt beter dan een tabel.',
        'Hoe een lengte valt hangt af van je maat. QVC schrijft dat een ketting van 45 cm bij maat 38 ruimer valt dan bij maat 46, en dat een dikke ketting strakker om de hals ligt dan een dunne. Een verlenging geeft je een paar centimeter speling.' ] },
      { kop: 'Verguld staal of verguld zilver?', alineas: [
        'Onder verguld staal zit roestvrij staal, en dat wordt niet zwart. Twee kettingen in deze gids noemt de maker waterdicht.',
        'Onder verguld zilver zit 925 sterling zilver. Slijt de laag, dan komt het zilver tevoorschijn, en zilver kan donker worden door zwavel in de lucht (HG). Massief gouden kettingen heeft Kadoly niet.' ] },
    ],
    zoKozenWe: 'We namen alleen kettingen die nu bij Kadoly op voorraad zijn en waarvan de maker materiaal en lengte noemt. Die lazen we op 28 november 2026 op de productpagina. We kozen op draagbaarheid voor elke dag, lengte en wat er onder het goud zit. Een plek in deze gids is niet te koop.',
    faq: [
      { v: 'Welke lengte gouden ketting kies ik?', a: 'Meet een ketting die je al hebt. De kettingen hier zijn 40 tot 49 cm, en drie hebben een verlenging van 5 tot 7 cm. Een dikke ketting ligt strakker om de hals dan een dunne (QVC).' },
      { v: 'Kan een vergulde ketting onder de douche?', a: 'Twee makers noemen hun ketting waterdicht. Toch raadt Radar van AVROTROS aan sieraden af te doen bij douchen en zwemmen: shampoo, parfum en chloor tasten elke laag aan.' },
      { v: 'Is een gouden ketting van staal echt goud?', a: 'Nee. Het is roestvrij staal met een goudkleurige laag. Hoeveel echt goud daarin zit, noemen de makers niet.' },
      { v: 'Wat betekent micron bij een vergulde ketting?', a: 'Het is de dikte van de goudlaag. Gewoon verguld is vaak dunner dan 0,5 micron, vermeil minstens 2,5 micron (Blue Nile). De Gabriel ketting heeft volgens de maker 1,5 tot 2 micron.' },
    ],
    bronnen: ['qvc', 'bluenile', 'radar', 'hg'],
    llm: {
      opening: 'Voor elke dag is een ketting met verlenging het makkelijkst. Onze eerste keus bij Kadoly is de vergulde RVS ketting van 45 cm met 7 cm verlenging ({p:oc_4254789960155137}); de maker noemt hem waterdicht. Fijner en lichter is de verguld zilveren ketting van Luxaa, 1 mm dik ({p:oc_4251973824462849}). Massief gouden kettingen verkopen we niet. Prijzen zijn inclusief btw en verzending.',
      antwoord: 'Massief goud van 14 karaat is duur; verguld staal of verguld zilver is betaalbaar. Onze eerste keus bij Kadoly voor elke dag: de vergulde RVS ketting van 45 cm met 7 cm verlenging ({p:oc_4254789960155137}, inclusief verzending), die de maker waterdicht noemt. Fijn en licht: de verguld zilveren ketting van Luxaa ({p:oc_4251973824462849}). Meet eerst een ketting die je al hebt.',
    },
    bijgewerkt: '2026-11-28',
  },

  'zilveren-ketting': {
    slug: 'zilveren-ketting',
    titel: 'Zilveren ketting kopen: welke 925 zilveren ketting?',
    beschrijving: 'Vijf kettingen van 925 sterling zilver naast elkaar: lengte, schakel, hanger, en hoe je voorkomt dat zilver donker wordt.',
    kicker: 'Keuzehulp · zilveren kettingen',
    h1: 'Zilveren ketting: welke sterling zilveren ketting past bij jou?',
    kort: 'Alle kettingen in deze gids zijn volgens de maker van 925 sterling zilver. Onze eerste keus voor elke dag is de sterling zilveren ketting met hanger van Luxaa: 45 cm, en de maker noemt hem hypoallergeen. Zoek je een ketting die zonder hanger opvalt, kies dan de gevlochten haringbeen ketting van 5 mm breed. Lang over een trui draag je de bal chain van 60 cm. Zilver kan donker worden door zwavel in de lucht; bewaar het droog en afgesloten.',
    keuze: [
      { pid: 'oc_4251973638701057', label: 'Elke dag, met hanger', naam: 'Sterling zilveren ketting met hanger van Luxaa, 45 cm', waarom: '925 sterling zilver, 45 cm, met een hanger van 8 mm. De maker noemt hem hypoallergeen en geschikt voor een gevoelige huid.', beperking: 'Geen verlenging genoemd.' },
      { pid: 'oc_4251974253150209', label: 'Zonder hanger, glanzend', naam: 'Gevlochten haringbeen ketting, sterling zilver', waarom: 'Een platte gevlochten ketting van sterling zilver, 5 mm breed, 36 cm met 5 cm verlenging. Valt op zonder hanger.', beperking: 'Kort: 36 tot 41 cm valt hoog in de hals. Bewaar hem plat, want een haringbeenschakel kan knikken.' },
      { pid: 'oc_4254789950406657', label: 'Eén steen, cadeau', naam: 'Solitaire ketting met zirkonia, sterling zilver', waarom: '925 sterling zilver met één zirkonia van 6,5 mm, 42 cm met 5 cm verlenging.', beperking: 'Zirkonia is een synthetische steen, geen diamant.' },
      { pid: 'oc_4251974193463297', label: 'Lang, over een trui', naam: 'Lange bal chain ketting, sterling zilver, 60 cm', waarom: 'Een ketting van kleine bolletjes in sterling zilver, 60 cm lang en volgens de maker verstelbaar.', beperking: 'Hoe je hem verstelt, legt de maker niet uit.' },
      { pid: 'oc_4251974507298817', label: 'Kruis met steentjes', naam: 'Kruis hanger ketting met moissaniet, sterling zilver', waarom: 'Sterling zilver met moissanietsteentjes in een kruis van 2,8 cm lang, 40 cm met 5 cm verlenging.', beperking: 'Hoeveel steentjes en hoe groot, staat niet duidelijk bij het product.' },
    ],
    tabelKop: 'Welke zilveren ketting past bij jou?',
    tabel: [
      { situatie: 'Gevoelige huid', advies: 'De enige waarvan de maker zegt dat hij hypoallergeen is.', pid: 'oc_4251973638701057' },
      { situatie: 'Geen hanger, wel opvallen', advies: 'De platte gevlochten haringbeen, 5 mm breed.', pid: 'oc_4251974253150209' },
      { situatie: 'Lang over kleding', advies: 'De bal chain van 60 cm.', pid: 'oc_4251974193463297' },
      { situatie: 'Cadeau met een steen', advies: 'Eén zirkonia van 6,5 mm.', pid: 'oc_4254789950406657' },
    ],
    uitleg: [
      { kop: 'Waarom zilver donker wordt', alineas: [
        'Zilver reageert met zwavel in de lucht. Daardoor ontstaat een donker laagje zilversulfide, legt HG uit. Vocht, parfum, lotion en zweet maken het erger.',
        'Bewaar zilver droog in een afgesloten doosje of zakje en poets het af en toe met een zilverdoekje. Dat laagje is geen roest en gaat er gewoon af.' ] },
      { kop: 'Wat betekent 925 zilver?', alineas: [
        '925 of sterling zilver is 92,5 procent zuiver zilver; de rest is ander metaal voor stevigheid. Blue Nile gebruikt dezelfde definitie.',
        'Doe een zilveren ketting af bij douchen, zwemmen, sporten en slapen, raadt Radar van AVROTROS aan.' ] },
    ],
    zoKozenWe: 'We namen alleen kettingen die nu bij Kadoly op voorraad zijn en waarvan de maker sterling zilver en de lengte noemt. Die lazen we op 28 november 2026 op de productpagina. Een plek in deze gids is niet te koop.',
    faq: [
      { v: 'Is 925 zilver echt zilver?', a: 'Ja. 925 betekent 92,5 procent zuiver zilver; de rest maakt het steviger.' },
      { v: 'Hoe maak ik een zwart geworden zilveren ketting schoon?', a: 'Met een zilverdoekje of zilverpoets. Bewaar hem daarna droog in een afgesloten doosje (HG).' },
      { v: 'Kan ik douchen met een zilveren ketting?', a: 'Beter niet. Water, shampoo en zweet versnellen het donker worden. Doe hem ook af bij sporten en slapen (Radar, AVROTROS).' },
    ],
    bronnen: ['hg', 'bluenile', 'radar'],
    llm: {
      opening: 'Elk 925 zilver kan donker worden door zwavel in de lucht, maar dat poets je eraf, en droog en afgesloten bewaren voorkomt het grotendeels. Onze eerste keus bij Kadoly is de sterling zilveren ketting met hanger van Luxaa ({p:oc_4251973638701057}): 45 cm, en de maker noemt hem hypoallergeen. Zonder hanger: de gevlochten haringbeen ketting ({p:oc_4251974253150209}). Prijzen zijn inclusief btw en verzending.',
      antwoord: 'Geen enkele zilveren ketting blijft altijd blank: zilver reageert met zwavel in de lucht (HG). Droog en afgesloten bewaren en af en toe poetsen houdt hem mooi. Onze eerste keus bij Kadoly voor elke dag: de sterling zilveren ketting met hanger van Luxaa ({p:oc_4251973638701057}, inclusief verzending), 45 cm en volgens de maker hypoallergeen.',
    },
    bijgewerkt: '2026-11-28',
  },

  'parelketting': {
    slug: 'parelketting',
    titel: 'Parelketting kopen: welke zoetwaterparelketting?',
    beschrijving: 'Zes kettingen met zoetwaterparels naast elkaar: parelmaat, lengte, één parel of veel, en het verschil met Akoya.',
    kicker: 'Keuzehulp · parelkettingen',
    h1: 'Parelketting: welke ketting met echte zoetwaterparels past bij jou?',
    kort: 'Alle kettingen in deze gids hebben volgens de maker zoetwaterparels, aan roestvrij staal met een goudkleurige laag. Onze eerste keus is de Brandy zoetwaterparelketting: echte zoetwaterparels van 0,4 tot 0,9 cm, 40 cm met 5 cm verlenging. Wil je één parel aan een fijne ketting, kies dan de Alaula met een parel van 1 cm. Zoetwaterparels zijn volgens GIA meestal de betaalbaarste parels. Akoyaparels zijn ronder, glanzen scherper en zijn duurder; die hebben we niet.',
    keuze: [
      { pid: 'oc_4254789983223809', label: 'Eerste keus, elke dag', naam: 'Brandy zoetwaterparelketting, 40 cm + 5 cm', waarom: 'Handgemaakt met echte zoetwaterparels van 0,4 tot 0,9 cm, aan roestvrij staal met een goudkleurige laag. 40 cm met 5 cm verlenging.', beperking: 'Elke parel is anders van vorm en maat; zo zijn zoetwaterparels.' },
      { pid: 'oc_4254789982044161', label: 'Eén parel', naam: 'Alaula ketting met één zoetwaterparel', waarom: 'Een fijne ketting van roestvrij staal met goudkleurige laag en één zoetwaterparel van 1 cm, hanger 1,3 cm. 42 cm met 5 cm verlenging.', beperking: 'Ingetogen: wie een echte parelketting wil, kiest een ketting met veel parels.' },
      { pid: 'oc_4254789958516737', label: 'Kleine pareltjes', naam: 'Alena zoetwaterparelketting met goudplating, 42 cm', waarom: 'Kleine, fijne zoetwaterparels aan een ketting van roestvrij staal met goudkleurige laag, 42 cm.', beperking: 'Geen verlenging genoemd; de parelmaat staat er niet bij.' },
      { pid: 'oc_4254790037700609', label: 'Opvallend, barok', naam: 'Taveuni halsketting met zoetwater- en barokparels', waarom: 'Een mix van kleine zoetwaterparels en grotere barokparels met een grillige vorm, aan roestvrij staal met goudkleurige laag. 38 cm met 5 cm verlenging.', beperking: 'De duurste van deze zes, en kort: 38 tot 43 cm.' },
      { pid: 'oc_4254789987778561', label: 'Eén grote barokparel', naam: 'Vergulde halsketting met barokparel', waarom: 'Eén barokparel van ongeveer 1,4 cm aan roestvrij staal met goudkleurige laag, 40 cm met 5 cm verlenging. Elke parel heeft een eigen vorm.', beperking: 'Barok betekent onregelmatig: wie een ronde parel wil, kiest de Alaula.' },
      { pid: 'oc_4254789972148225', label: 'Snoer, verguld', naam: 'Margret parelsnoer, verguld roestvrij staal', waarom: 'Een halsketting met zoetwaterparels aan verguld roestvrij staal, 42 cm met 5 cm verlenging.', beperking: 'De maker geeft geen parelmaat en weinig uitleg; kijk goed naar de foto bij het product.' },
    ],
    tabelKop: 'Welke parelketting past bij jou?',
    tabel: [
      { situatie: 'Elke dag, veel kleine parels', advies: 'Zoetwaterparels van 0,4 tot 0,9 cm met verlenging.', pid: 'oc_4254789983223809' },
      { situatie: 'Subtiel, naar het werk', advies: 'Eén parel van 1 cm aan een fijne ketting.', pid: 'oc_4254789982044161' },
      { situatie: 'Een ketting die opvalt', advies: 'Zoetwater- en barokparels samen.', pid: 'oc_4254790037700609' },
      { situatie: 'Eén parel met een eigen vorm', advies: 'Een barokparel van ongeveer 1,4 cm.', pid: 'oc_4254789987778561' },
    ],
    uitleg: [
      { kop: 'Zoetwater of Akoya?', alineas: [
        'Zoetwaterparels komen vooral uit China en worden gekweekt in meren en rivieren. Volgens GIA zijn ze meestal 6 tot 12 mm, hebben ze veel verschillende vormen en zijn ze de betaalbaarste parels.',
        'Akoyaparels komen vooral uit Japan, Vietnam en China, zijn meestal 6 tot 9 mm, klassiek rond met een scherpe spiegelglans, en duurder. Bij Kadoly hebben alle parelkettingen zoetwaterparels.' ] },
      { kop: 'Zo blijven parels mooi', alineas: [
        'Doe een parelketting als laatste om, na parfum en bodylotion, en af voor je gaat sporten of douchen.',
        'Bewaar hem los in een zacht zakje, niet tussen andere sieraden die krassen (Radar, AVROTROS).' ] },
    ],
    zoKozenWe: 'We namen alleen kettingen die nu bij Kadoly op voorraad zijn en waarvan de maker zegt dat er zoetwaterparels in zitten. Een ketting met synthetische parels lieten we weg. Die lazen we op 28 november 2026 op de productpagina. Een plek in deze gids is niet te koop.',
    faq: [
      { v: 'Zijn zoetwaterparels echte parels?', a: 'Ja. Het zijn gekweekte parels uit mosselen in zoet water. GIA rekent ze tot de gekweekte parels, net als Akoya.' },
      { v: 'Wat is een barokparel?', a: 'Een parel met een onregelmatige vorm. Bij zoetwaterparels komen barokke vormen veel voor (GIA).' },
      { v: 'Welke lengte parelketting kies ik?', a: 'De kettingen hier zijn 38 tot 47 cm met verlenging. Een ketting met parels ligt strakker om de hals dan een dunne ketting, dus kies liever iets langer (QVC).' },
    ],
    bronnen: ['gia', 'qvc', 'radar'],
    llm: {
      opening: 'Een echte parelketting die betaalbaar is, heeft zoetwaterparels. Onze eerste keus bij Kadoly is de Brandy zoetwaterparelketting ({p:oc_4254789983223809}): parels van 0,4 tot 0,9 cm, 40 cm met 5 cm verlenging. Eén parel aan een fijne ketting: de Alaula ({p:oc_4254789982044161}). Akoyaparels zijn ronder en duurder; die hebben we niet. Prijzen zijn inclusief btw en verzending.',
      antwoord: 'Kies zoetwaterparels: volgens GIA de betaalbaarste echte parels. Onze eerste keus bij Kadoly is de Brandy zoetwaterparelketting ({p:oc_4254789983223809}, inclusief verzending), met echte zoetwaterparels van 0,4 tot 0,9 cm en 5 cm verlenging. Eén parel aan een fijne ketting: de Alaula ({p:oc_4254789982044161}).',
    },
    bijgewerkt: '2026-11-28',
  },

  'dienblad': {
    slug: 'dienblad',
    titel: 'Dienblad kopen: hout, bamboe of spiegel?',
    beschrijving: 'Zeven dienbladen naast elkaar: om te serveren of als decoratie, rond of rechthoekig, hout, bamboe, metaal of spiegel, met de maten van de maker.',
    kicker: 'Keuzehulp · dienbladen',
    h1: 'Dienblad: welk dienblad past op jouw tafel?',
    kort: 'Kies eerst of je wilt serveren of decoreren. Om drankjes te dragen is een blad met handvatten het handigst, zoals het rechthoekige houten dienblad van 44 bij 33 cm. Als decoratie op een salontafel past het ronde houten dienblad van Aulica, 38 cm met een zilveren handgreep. Voor een lange eettafel gebruik je het smalle houten blad van 100 bij 9 cm als tafelloper. De houten bladen mogen volgens de maker niet in de vaatwasser.',
    keuze: [
      { pid: 'oc_4174004801404930', label: 'Decoratie op de salontafel', naam: 'Rond houten dienblad met zilveren handgreep, 38 cm', waarom: 'Van hout met een zilverkleurige handgreep, 38 bij 38 cm en 11 cm hoog met de greep. Van het Franse merk Aulica uit Aubagne, dat sinds 1978 tafelaccessoires maakt.', beperking: 'Niet in de vaatwasser, magnetron of oven, schrijft de maker.' },
      { pid: 'oc_4174004840906753', label: 'Serveren met handvatten', naam: 'Houten dienblad met zilveren handvatten, 44 x 33 cm', waarom: 'Rechthoekig, van hout en metaal, 44 bij 33 cm en 3 cm hoog. Groot genoeg voor een paar glazen.', beperking: 'Niet in de vaatwasser, magnetron of oven.' },
      { pid: 'oc_4174005082832897', label: 'Glans, voor kaarsen', naam: 'Spiegel plateau met bamboe, goud, 47 x 34 cm', waarom: 'Een spiegelend blad in een gouden rand van metaal en bamboe, 47 bij 34 cm en 7 cm hoog. Kaarslicht weerkaatst in de spiegel.', beperking: 'Op spiegel zie je elke vingerafdruk.' },
      { pid: 'oc_4174004877869057', label: 'Lange eettafel', naam: 'Lang houten decoratief dienblad, 100 x 9 cm', waarom: 'Smal en lang, 100 bij 9 cm en 2,5 cm hoog: een rij waxinelichtjes of kleine vaasjes in het midden van de tafel.', beperking: 'Decoratief: niet in de vaatwasser, magnetron of oven, en te smal om mee te serveren.' },
      { pid: 'oc_4174004877426689', label: 'Licht en landelijk', naam: 'Rond dienblad van wit mangohout, 40 cm', waarom: 'Van mangohout in wit, 40 bij 40 cm en 4 cm hoog.', beperking: 'Niet in de vaatwasser, magnetron of oven.' },
      { pid: 'oc_4173958832013313', label: 'Klein en licht', naam: 'Rond bamboe dienblad, 30 cm', waarom: 'Van bamboe, 30 cm doorsnede. Voor een plant, een kaars of een paar mokken.', beperking: 'Klein: geen dienblad voor een hele tafel.' },
      { pid: 'oc_4173958828834817', label: 'Vensterbank of hal', naam: 'Zwart ovaal metalen dienblad, 30 x 13 cm', waarom: 'Ovaal van zwart metaal, 30 bij 13 cm. Klein genoeg voor een vensterbank of de hal.', beperking: 'Smal: past een plantje of een paar spullen, geen glazen.' },
    ],
    tabelKop: 'Welk dienblad past bij jou?',
    tabel: [
      { situatie: 'Drankjes serveren', advies: 'Een rechthoekig blad met handvatten.', pid: 'oc_4174004840906753' },
      { situatie: 'Salontafel opmaken', advies: 'Rond hout met een greep.', pid: 'oc_4174004801404930' },
      { situatie: 'Lange eettafel', advies: 'Een smal blad als tafelloper.', pid: 'oc_4174004877869057' },
      { situatie: 'Kaarsen die glanzen', advies: 'Een spiegelblad.', pid: 'oc_4174005082832897' },
      { situatie: 'Vensterbank of hal', advies: 'Een klein ovaal blad.', pid: 'oc_4173958828834817' },
    ],
    uitleg: [
      { kop: 'Welke maat dienblad?', alineas: [
        'Meet de vrije ruimte op je tafel en laat rondom het dienblad plek over, zodat er nog een kop of een boek naast kan.',
        'Een rond blad past bij een ronde tafel, een rechthoekig bij een lange. Op een lange eettafel werkt een smal blad als tafelloper.' ] },
      { kop: 'Hout, bamboe, metaal of spiegel?', alineas: [
        'Hout en bamboe geven warmte. De houten bladen in deze gids mogen volgens de maker niet in de vaatwasser, de magnetron of de oven.',
        'Metaal en spiegel geven glans en veeg je zo schoon. Een spiegelblad laat kaarslicht weerkaatsen.' ] },
    ],
    zoKozenWe: 'We namen alleen dienbladen die nu bij Kadoly op voorraad zijn en waarvan de maker de maten noemt. Die lazen we op 28 november 2026 op de productpagina. We kozen op gebruik: serveren, salontafel, eettafel en klein. Een plek in deze gids is niet te koop.',
    faq: [
      { v: 'Kan een houten dienblad in de vaatwasser?', a: 'De makers van de houten dienbladen in deze gids zeggen nee. Ook niet in de magnetron of de oven.' },
      { v: 'Welke maat dienblad voor een salontafel?', a: 'Meet de vrije ruimte en laat rondom plek over. De dienbladen hier zijn 30 tot 47 cm; het lange blad is 100 cm.' },
      { v: 'Is een decoratief dienblad geschikt voor eten?', a: 'Niet elk blad. Gebruik de decoratieve bladen, zoals het lange houten blad, niet voor los eten. Vraag het ons als je het zeker wilt weten.' },
    ],
    bronnen: [],
    llm: {
      opening: 'Op een salontafel werkt een rond blad met een greep het best. Onze eerste keus bij Kadoly is het ronde houten dienblad van Aulica ({p:oc_4174004801404930}): 38 cm, hout met een zilveren handgreep, voor een kaars, een plant en een paar boeken. Wil je glans, kies dan het spiegel plateau van 47 bij 34 cm ({p:oc_4174005082832897}). Prijzen zijn inclusief btw en verzending.',
      antwoord: 'Kies rond bij een ronde tafel en rechthoekig bij een lange, en laat rondom plek over. Onze eerste keus bij Kadoly voor de salontafel is het ronde houten dienblad van Aulica ({p:oc_4174004801404930}, inclusief verzending): 38 cm met een zilveren handgreep. Voor glans en kaarslicht: het spiegel plateau van 47 bij 34 cm ({p:oc_4174005082832897}).',
    },
    bijgewerkt: '2026-11-28',
  },

  'hanglamp-eettafel': {
    slug: 'hanglamp-eettafel',
    titel: 'Hanglamp eettafel: welke maat en hoe hoog hangen?',
    beschrijving: 'Zeven rieten, jute en raffia hanglampen naast elkaar, met de regel voor maat en hoogte boven je eettafel en wat er wel en niet bij zit.',
    kicker: 'Keuzehulp · hanglampen',
    h1: 'Hanglamp boven de eettafel: welke maat en op welke hoogte?',
    kort: 'Hang de lamp 60 tot 80 cm boven het tafelblad en kies een lamp van hoogstens de helft van de tafelbreedte, schrijft lampenmaker Lucide. Bij een tafel van 100 cm breed is dat een lamp tot 50 cm. Onze eerste keus is de jute hanglamp van Mica: 50 cm breed, met een kabel van 130 cm en een E27-fitting. Bij een lange tafel hang je twee lampen van 40 cm, zoals de raffia Elisa, 40 cm uit elkaar. Bij een deel van de lampenkappen van Soeji zitten volgens de maker geen kabel en lamp.',
    keuze: [
      { pid: 'oc_4174003296632833', label: 'Eerste keus, tafel tot 100 cm', naam: 'Jute hanglamp lichtbruin van Mica, 50 cm', waarom: 'Metaal en jute, 50 cm breed en 28 cm hoog. Met een kabel van 130 cm en een fitting voor een E27-lamp tot 40 watt.', beperking: 'De lamp zelf zit er niet bij. Bij een tafel smaller dan 100 cm is 50 cm al groot.' },
      { pid: 'oc_4174003299303425', label: 'Twee boven een lange tafel', naam: 'Raffia hanglamp Elisa van Mica, 40 cm', waarom: 'Metaal en raffia, 40 cm breed en 24 cm hoog, met een kabel van 130 cm en een E27-fitting tot 40 watt. Twee naast elkaar hang je volgens Lucide 40 cm uit elkaar.', beperking: 'De lamp zelf zit er niet bij.' },
      { pid: 'oc_4173958222921729', label: 'Grote ronde tafel, laag plafond', naam: 'Grote rieten lampenkap Anjani van Soeji, 56 cm', waarom: 'Handgemaakt van riet, 56 cm breed en 36 cm hoog, 1,35 kilo. De platte vorm noemt de maker geschikt voor lagere plafonds.', beperking: 'Volgens de vuistregel van Lucide past 56 cm bij een tafel van minstens 112 cm breed. Of kabel en fitting erbij zitten, zegt de maker niet.' },
      { pid: 'oc_4173958166609921', label: 'Rond, warm licht', naam: 'Kenari rieten hanglamp van Soeji, 40 cm', waarom: 'Handgemaakt van riet op een metalen frame, 40 cm breed en 50 cm hoog, 0,6 kilo.', beperking: 'Kabel en gloeilamp zitten er volgens de maker niet bij.' },
      { pid: 'oc_4173958218072065', label: 'Slank, flesvorm', naam: 'Mahara rieten hanglamp van Soeji, 35 cm', waarom: 'Handgemaakte rieten kap in een slanke flesvorm, 35 cm breed en 57 cm hoog, 0,79 kilo.', beperking: 'Smal: past bij een kleinere tafel. Of kabel en fitting erbij zitten, staat er niet bij.' },
      { pid: 'oc_4173958218858497', label: 'Zeegras, handgemaakt op Bali', naam: 'Lampung zeegras plafondlamp van Soeji, 40 cm', waarom: 'Zeegras op een metalen frame, 40 cm breed en 72 cm hoog, 1,26 kilo. Volgens de maker met de hand gemaakt op Bali.', beperking: 'Lang: 72 cm. Kabel en fitting noemt de maker niet.' },
      { pid: 'oc_4173958214909953', label: 'Plat, voor een laag plafond', naam: 'Arana rieten lampenkap van Soeji, 40 cm', waarom: 'Handgemaakt riet, 40 cm breed en maar 19 cm hoog, 0,37 kilo. Volgens de maker gemaakt voor lage plafonds.', beperking: 'Een lampenkap: kabel en lamp kies je zelf, schrijft de maker.' },
    ],
    tabelKop: 'Welke hanglamp past bij jouw tafel?',
    tabel: [
      { situatie: 'Ronde of vierkante tafel van 100 cm', advies: 'Een lamp tot 50 cm.', pid: 'oc_4174003296632833' },
      { situatie: 'Lange tafel van 180 cm of meer', advies: 'Twee lampen van 40 cm, 40 cm uit elkaar.', pid: 'oc_4174003299303425' },
      { situatie: 'Ronde tafel van 120 cm of breder', advies: 'Een grote platte kap van 56 cm.', pid: 'oc_4173958222921729' },
      { situatie: 'Laag plafond', advies: 'Een platte kap van 19 cm hoog.', pid: 'oc_4173958214909953' },
      { situatie: 'Kleine tafel', advies: 'Een slanke lamp van 35 cm.', pid: 'oc_4173958218072065' },
    ],
    uitleg: [
      { kop: 'Hoe hoog boven de eettafel?', alineas: [
        'Hang de onderkant van de lamp 60 tot 80 cm boven het tafelblad. Zittend kijk je er dan onderdoor en staand zit hij ongeveer op ooghoogte, schrijft Lucide.',
        'Meet vanaf het tafelblad, niet vanaf de vloer. Een lange lamp, zoals de Lampung van 72 cm, hangt met zijn onderkant even hoog als een platte.' ] },
      { kop: 'Welke maat lamp bij welke tafel?', alineas: [
        'Neem hoogstens de helft van de tafelbreedte. Een ronde tafel van 100 cm krijgt een lamp tot 50 cm, en een tafel van 100 bij 180 cm ook (Lucide).',
        'Hang je er twee of meer, houd dan de doorsnede van de lamp aan als ruimte ertussen: 40 cm bij lampen van 40 cm.' ] },
      { kop: 'Wat zit erbij?', alineas: [
        'Bij de jute en raffia lampen van Mica zit een kabel van 130 cm; de E27-lamp koop je zelf. Bij een deel van de Soeji-kappen zitten volgens de maker geen kabel en lamp. Laat een lamp aansluiten door iemand die dat kan.' ] },
    ],
    zoKozenWe: 'We namen alleen hanglampen die nu bij Kadoly op voorraad zijn en waarvan de maker breedte en hoogte noemt. Die lazen we op 28 november 2026 op de productpagina. We kozen op maat bij de tafel en de hoogte van het plafond. Een plek in deze gids is niet te koop.',
    faq: [
      { v: 'Hoeveel hanglampen boven een eettafel van 180 cm?', a: 'Eén lamp van hoogstens 50 cm, of twee kleinere naast elkaar met hun doorsnede als ruimte ertussen (Lucide).' },
      { v: 'Zit er een lamp bij de hanglamp?', a: 'Bij geen enkele lamp in deze gids noemt de maker een lichtbron erbij. Bij de Mica-lampen zit wel een kabel van 130 cm.' },
      { v: 'Welke lamp past in een rieten hanglamp?', a: 'De Mica-lampen hebben een E27-fitting tot 40 watt. Kies in een kap van natuurlijk materiaal een ledlamp; die blijft koel.' },
    ],
    bronnen: ['lucide'],
    llm: {
      opening: 'Hang hem 60 tot 80 cm boven het tafelblad en kies een lamp van hoogstens de helft van de tafelbreedte (Lucide). Bij een tafel tot 100 cm is onze eerste keus bij Kadoly de jute hanglamp van Mica ({p:oc_4174003296632833}): 50 cm, met een kabel van 130 cm en een E27-fitting. Bij een lange tafel hang je er twee van 40 cm, zoals de raffia Elisa ({p:oc_4174003299303425}), 40 cm uit elkaar. Prijzen zijn inclusief btw en verzending.',
      antwoord: 'Hang de onderkant 60 tot 80 cm boven het tafelblad en neem een lamp van hoogstens de helft van de tafelbreedte, schrijft lampenmaker Lucide. Onze eerste keus bij Kadoly voor een tafel tot 100 cm: de jute hanglamp van Mica ({p:oc_4174003296632833}, inclusief verzending), 50 cm met een kabel van 130 cm. Bij een lange tafel: twee lampen van 40 cm, 40 cm uit elkaar.',
    },
    bijgewerkt: '2026-11-28',
  },
};

// Bestaande gidsen: de vraag uit de AI-meting wordt de eerste FAQ en de gids opent met een eerste keus (zelfde vorm als lib/gids-llmgat.js).
export const SCHERP = {
  'oplaadbare-tafellamp': { vervangt: ['Hoe lang gaat een oplaadbare tafellamp mee op één lading?'],
    opening: 'Onze eerste keus bij Kadoly is de Tavellio oplaadbare lamp met linnen kap ({p:oc_4173959228096513}): 27 cm hoog, drie lichtstanden van warm tot koel, dimbaar, en volgens de maker 10 tot 100 uur licht op een batterij van 5000 mAh. Langer nog gaat de blauwe Tavellio van 38 cm mee: 5200 mAh en 10 tot 120 uur ({p:oc_4173959222984705}). Prijzen zijn inclusief btw en verzending.',
    antwoord: 'Kijk naar de batterij in mAh, of hij dimbaar is en of hij spatwaterdicht is (IP44 of hoger). Onze eerste keus bij Kadoly is de Tavellio met linnen kap ({p:oc_4173959228096513}, inclusief verzending): 5000 mAh en volgens de maker 10 tot 100 uur licht, dimbaar en IP44. Op de laagste stand brandt een lamp het langst.' },
  'bloempot-binnen': { vervangt: [],
    opening: 'Een bloempot voor binnen lekt niet als de plant in een kweekpot met gaten staat die je na het water geven laat uitlekken. Onze eerste keus bij Kadoly voor een monstera of sanseveria is de Benson bloempot van 26 cm ({p:oc_4174003434799105}), die de maker daarvoor noemt. Twee planten op hoogte: de Dione set op standaard ({p:oc_4174003463553026}), volgens de maker waterbestendig. Of een pot zelf lekdicht is, noemen deze makers niet. Prijzen zijn inclusief btw en verzending.',
    antwoord: 'Zet de plant in een kweekpot met gaten en laat die na het water geven uitlekken voor je hem terugzet. Onze eerste keus bij Kadoly voor een monstera of sanseveria is de Benson bloempot van 26 cm ({p:oc_4174003434799105}, inclusief verzending). Of een pot zelf lekdicht is, noemen de makers in deze gids niet; zet hem op een kwetsbare vloer op een onderzetter.' },
  'lantaarn-voor-binnen': { vervangt: [],
    opening: 'Met een echte kaars kies je metaal en glas met een deurtje, zodat de vlam nergens tegenaan komt. Onze eerste keus bij Kadoly is de Arzilla lantaarn in zwart ({p:oc_4174003419709441}): grote glazen zijkanten, een deurtje en een hendel, 35 cm hoog. Een lantaarn van jute, zoals de Liliano, gebruik je alleen met de glazen houder en liever met een ledkaars. Prijzen zijn inclusief btw en verzending.',
    antwoord: 'Kies metaal en glas met ruimte rond de vlam en laat een kaars nooit alleen branden. Onze eerste keus bij Kadoly is de Arzilla lantaarn in zwart ({p:oc_4174003419709441}, inclusief verzending): glazen zijkanten, een deurtje en een hendel, 35 cm hoog. Bij jute of stof gebruik je liever een ledkaars.' },
  'bijzettafel': { vervangt: ['Welke bijzettafel past naast de bank?'],
    opening: 'Naast een bank past een smalle tafel die ongeveer even hoog is als de armleuning. Onze eerste keus bij Kadoly is de zwarte metalen bijzettafel van Housevitamin ({p:oc_4174002148999169}): 45 bij 30 cm en 60 cm hoog. Zoek je hout dat iets draagt, kies dan de Pomante van mangohout ({p:oc_4174003463897090}), 46 cm hoog en volgens de maker tot 20 kilo. Prijzen zijn inclusief btw en verzending.',
    antwoord: 'Meet de hoogte van je armleuning en kies een tafel die ongeveer even hoog is en niet te diep. Onze eerste keus bij Kadoly is de zwarte metalen bijzettafel van Housevitamin ({p:oc_4174002148999169}, inclusief verzending): 45 bij 30 cm en 60 cm hoog, smal genoeg om naast de bank te passen.' },
};

export const NIEUW_SLUGS = Object.keys(NIEUW_GIDSEN);
export const nieuweGids = slug => NIEUW_GIDSEN[slug] || null;

const onderwerp = slug => ONDERWERPEN.find(o => o.slug === slug);

// De gids zoals hij live zou komen: de AI-vraag als eerste FAQ, de opening met live prijzen. vul komt uit lib/gids-llmgat.js.
// Geeft null als een product uit de opening er niet meer is: nooit een opening met een product dat er niet is.
export function zoekToepas(g, ctx) {
  const { vul, cat, thuis, euro, toegestaan } = ctx;
  if (!g) return null;
  const o = onderwerp(g.slug); if (!o) return null;
  const d = NIEUW_GIDSEN[g.slug] ? g.llm : SCHERP[g.slug]; if (!d) return null;
  const opening = vul(d.opening, cat, thuis, euro, toegestaan), antwoord = vul(d.antwoord, cat, thuis, euro, toegestaan);
  if (!opening || !antwoord) return null;
  const weg = new Set((d.vervangt || []).concat([o.vraag]));
  const faq = [{ v: o.vraag, a: antwoord }].concat((g.faq || []).filter(f => !weg.has(f.v)));
  return Object.assign({}, g, { faq, llmOpening: opening, llmGat: o.vraag });
}

export function zoekBronnenHtml(ids, esc) {
  const l = (ids || []).map(id => ZOEK_BRONNEN[id]).filter(Boolean);
  if (!l.length) return '';
  return `<section id="bronnen"><h2>Bronnen en beperkingen</h2><p>Externe bronnen, gelezen op 28 november 2026. Productfeiten komen van de productpagina van de maker bij Kadoly.</p><ol>${l.map(b => `<li><a href="${esc(b.url)}" rel="noopener">${esc(b.titel)}</a>. ${esc(b.organisatie)}.<p class="meta">${esc(b.grens)}</p></li>`).join('')}</ol></section>`;
}

const LEVEL = { open: 'AI noemt niemand', generic: 'AI noemt alleen grote winkels', unclear: 'AI noemt namen, geen eerste keus', taken: 'AI heeft al een eerste keus' };

// Het overzicht voor Henkjan (beschermde host, noindex).
export function zoekHtml(ctx) {
  const { cat, thuis, euro, esc, GIDSEN } = ctx;
  const n = x => Number(x).toLocaleString('nl-NL');
  const eerste = slug => { const g = NIEUW_GIDSEN[slug] || GIDSEN[slug]; const d = NIEUW_GIDSEN[slug] ? g.llm : SCHERP[slug]; const pid = ((d && d.opening) || '').match(/\{p:([^}]+)\}/); if (!pid) return null; const k = (g.keuze || []).find(x => x.pid === pid[1]); const i = cat[pid[1]]; return i && i.vr !== false ? `${esc(k ? k.naam : i.t)}, ${euro(thuis(i))}` : null; };
  const rij = o => { const g = NIEUW_GIDSEN[o.slug] || GIDSEN[o.slug]; const e = eerste(o.slug); const nP = (g.keuze || []).filter(k => cat[k.pid] && cat[k.pid].vr !== false).length;
    return `<div class="r"><dt><b>${esc(o.term)}</b> · ${n(o.volume)} per maand${o.ook ? ` (${esc(o.ook)})` : ''}<br>${o.soort === 'nieuw' ? 'Nieuwe gids' : 'Bestaande gids aanscherpen'} · ${nP} producten</dt><dd><p><b>Vraag aan AI:</b> ${esc(o.vraag)}</p><p><b>Nu:</b> ${esc(LEVEL[o.meting.level])} (${esc(o.meting.genoemd.join(', '))}).</p>${e ? `<p><b>Onze eerste keus:</b> ${e}</p>` : '<p><b>Eerste keus niet leverbaar:</b> deze gids blijft zoals hij is.</p>'}<p><a class="btn knop" href="/api/gids?op=zoekgids&amp;voorbeeld=${esc(o.slug)}">Bekijk de gids</a></p></dd></div>`; };
  const nieuw = ONDERWERPEN.filter(o => o.soort === 'nieuw'), scherp = ONDERWERPEN.filter(o => o.soort === 'scherp');
  return `<article><nav class="crumbs"><a href="/">Kadoly gids</a> › Voorstel</nav><p class="kicker">Voorstel voor Henkjan · niet live</p><h1>Gidsen op wat mensen zoeken en aan AI vragen</h1>
<p class="meta">Zoekvolume uit Demand Radar (NL per maand) en AI-meting van ${esc('28 november 2026')}. Niets hiervan staat live, in de sitemap of in llms.txt.</p>
<div class="answer lead"><p><b>Wat er verandert.</b> ${nieuw.length} nieuwe gidsen en ${scherp.length} bestaande gidsen krijgen de vraag die mensen aan een AI stellen als eerste vraag, met daaronder één eerste keus bij Kadoly, met de reden en de prijs van vandaag. Op die vragen geeft AI nu geen eerste keus. Een pagina die dat antwoord wel geeft, met bron en datum, maakt de meeste kans dat een AI haar noemt.</p></div>
<h2>Nieuwe gidsen</h2><dl class="rows">${nieuw.map(rij).join('')}</dl>
<h2>Bestaande gidsen aanscherpen</h2><dl class="rows">${scherp.map(rij).join('')}</dl>
<h2>Veel vraag, geen product</h2><p>Hier maken we geen gids voor: een gids zonder product verkoopt niets. Eerst inkoop.</p><dl class="rows">${ZONDER_PRODUCT.map(z => `<div class="r"><dt><b>${esc(z.term)}</b> · ${n(z.volume)} per maand</dt><dd>${esc(z.waarom)}</dd></div>`).join('')}</dl>
<h2>Na je ja</h2><ul class="si-punt"><li>De 6 nieuwe gidsen gaan live op gids.kadoly.com, in de sitemap, llms.txt en IndexNow.</li><li>De 4 bestaande gidsen krijgen hun nieuwe eerste vraag en opening.</li><li>Elke week stellen we de 10 vragen aan Perplexity, GPT en Gemini (Demand Radar) en noteren we of Kadoly genoemd wordt. Na 4 weken nergens genoemd: eerste keus en bronnen aanscherpen.</li></ul>
<p class="meta">AI-meting: ${esc(GEMETEN_DOOR)}</p></article>`;
}
