// Met de hand geschreven keuzehulpen voor keuzehulp.best (2 nov 2026). Waarom: het AI-tegoed van de AI Gateway is op (402 sinds 31 okt),
// dus kzmaak schrijft niets meer, en Henkjan wil "werk dat ik zelf kan doen, doe ik zelf". Deze items gaan langs dezelfde bol-toets als kzmaak
// (api/kzmaak.js op=hand: elke antwoordroute moet bij bol een passend product vinden) en worden dan gepubliceerd zoals kzmaak dat doet.
// Velden: zoals data/kz.json, plus kadoly (slug van een gids op gids.kadoly.com: die keuzes staan bovenaan, bol is de vergelijking), vanaf (publiceren vanaf die dag).
// Schrijfregels: gewoon Nederlands, geen gedachtestreepjes, geen verzonnen tests of cijfers, eerlijk over wat we niet weten.

export const HAND = [
  {
    slug: '3d-houten-puzzel-bouwpakket-volwassenen', cat: 'Speelgoed', term: '3d houten puzzel', kadoly: '3d-houten-puzzel-volwassenen', vanaf: '2026-11-02',
    title: 'Welke 3D houten puzzel past bij jou?', h1: '3D houten puzzel voor volwassenen: welke kies je?',
    seoTitle: 'Keuzehulp 3D houten puzzel: welk bouwpakket past bij jou?', metaDesc: 'Boeknook, iets dat beweegt of een muziekdoos? 3 vragen, onze keuze bij Kadoly en de vergelijking met de prijs van vandaag bij bol.',
    intro: 'Een 3D houten puzzel is een bouwpakket van dun hout dat je uit plaatjes drukt en in elkaar zet. Het verschil zit in wat je bouwt, hoe moeilijk het is en of er lijm bij moet. Drie vragen.',
    kort: 'Bouw je voor het eerst, kies dan een boeknook of klein model van rond de 150 tot 250 onderdelen zonder lijm. Wil je dat het beweegt, kies een model met elastiekmotor of tandwielen. Een muziekdoos is het mooiste cadeau, maar vraagt vaak lijm en geduld.',
    questions: [
      { q: 'Wat wil je bouwen?', options: [
        { label: 'Iets moois voor op de plank', term: '3d houten puzzel boeknook', must: ['book nook', 'boeknook', 'booknook', 'huis', 'winkel'] },
        { label: 'Iets dat echt beweegt', term: '3d houten puzzel mechanisch', must: ['mechanisch', 'beweg', 'motor', 'auto', 'trein', 'klok'] },
        { label: 'Een muziekdoos', term: '3d houten puzzel muziekdoos', must: ['muziekdoos', 'music box', 'muziek'] } ] },
      { q: 'Hoeveel bouwervaring heb je?', options: [
        { label: 'Dit wordt mijn eerste', must: ['beginner', 'eenvoudig', 'makkelijk', 'diy'] },
        { label: 'Ik heb er al eens een gebouwd' },
        { label: 'Ik wil een echte uitdaging', must: ['uitdaging', 'gevorderd', 'expert', 'mechanisch'] } ] },
      { q: 'Wat wil je uitgeven?', options: [
        { label: 'Tot 50 euro', max: 50 },
        { label: 'Het mag een pronkstuk zijn', min: 50 } ] } ],
    uitleg: 'Kijk eerst naar het aantal onderdelen en of er lijm bij moet. Tot ongeveer 250 onderdelen zonder lijm bouw je in een of twee avonden. Modellen met 400 of meer onderdelen, tandwielen of een uurwerk kosten meerdere avonden en vragen nauwkeurig werk. Bij een boeknook zit vaak verlichting met batterijen: kijk of die erbij zitten. Bewegende modellen lopen meestal op een elastiek of een veer, niet op een motor met stroom. Bijna alle pakketten zijn volgens de makers voor 14 jaar en ouder: voor jongere kinderen is een gewone houten bouwset handiger.',
    fouten: ['Een pakket van 400+ onderdelen kopen voor iemand die nog nooit bouwde.', 'Niet kijken of er lijm of batterijen bij zitten, zodat je halverwege stilstaat.', 'Een 3D houten puzzel kopen voor een kind onder de 14: de plaatjes zijn klein en breekbaar.'],
    faq: [
      { q: 'Heb je lijm nodig voor een 3D houten puzzel?', a: 'Vaak niet: veel pakketten klikken in elkaar. Bij muziekdozen en grote gebouwen raadt de maker soms witte houtlijm aan die niet in de doos zit. Dat staat in de productomschrijving.' },
      { q: 'Hoe lang ben je bezig met een 3D houten puzzel?', a: 'Een klein model of boeknook kost 2 tot 6 uur. Grote modellen met 400 of meer onderdelen kosten meerdere avonden.' },
      { q: 'Is een 3D houten puzzel een goed cadeau?', a: 'Ja, voor iemand die graag met de handen bezig is en van een rustige avond houdt. Kies voor een eerste keer een klein pakket zonder lijm, dan wordt het geen frustratie.' },
      { q: 'Wat is een boeknook?', a: 'Een klein huisje of straatje dat je tussen je boeken op de plank zet, vaak met een lampje erin. Het is een van de populairste soorten 3D houten puzzels.' } ],
    verwant: ['puzzel-volwassenen', 'puzzel-1000-stukjes', 'bouwset', 'cadeau-voor-iemand-die-alles-heeft', 'haakpakket-beginners', 'sinterklaas-cadeau-man'],
  },
  {
    slug: 'sierpot-orchidee-maat-kiezen', cat: 'Wonen', term: 'sierpot orchidee', kadoly: 'sierpot-orchidee', vanaf: '2026-11-02',
    title: 'Welke sierpot past bij je orchidee?', h1: 'Sierpot voor een orchidee: welke maat en welke pot?',
    seoTitle: 'Keuzehulp sierpot orchidee: welke maat en welke pot?', metaDesc: 'Meet het kweekpotje, kies de look. 3 vragen, onze keuze bij Kadoly en de vergelijking met de prijs van vandaag bij bol.',
    intro: 'Een orchidee blijft het best in zijn doorzichtige kweekpotje staan. De sierpot eromheen moet passen bij dat potje en bij je interieur. Drie vragen.',
    kort: 'Meet de bovenrand van het plastic kweekpotje: de meeste orchideeën staan in 9 of 12 cm. Kies een sierpot met die potmaat, zonder gat in de bodem, en zet de orchidee er met kweekpot en al in.',
    questions: [
      { q: 'Hoe groot is het kweekpotje van je orchidee?', options: [
        { label: 'Ongeveer 9 cm', must: ['9 cm', '9cm', 'ø9', 'ø 9', '10 cm'] },
        { label: 'Ongeveer 12 cm', must: ['12 cm', '12cm', 'ø12', 'ø 12', '13 cm'] },
        { label: 'Weet ik niet', must: ['orchidee'] } ] },
      { q: 'Welke look zoek je?', options: [
        { label: 'Rustig en natuurlijk', must: ['travertin', 'beige', 'naturel', 'zand', 'wit', 'creme'] },
        { label: 'Met glans, goud of zilver', must: ['goud', 'zilver', 'gold', 'glans'] },
        { label: 'Met kleur', must: ['groen', 'blauw', 'roze', 'terracotta', 'kleur'] } ] },
      { q: 'Alleen de pot, of met orchidee erin?', options: [
        { label: 'Alleen de pot', term: 'sierpot binnen keramiek', must: ['sierpot', 'bloempot', 'plantenpot', 'pot'] },
        { label: 'Pot met orchidee erin, als cadeau', must: ['orchidee', 'phalaenopsis'] } ] } ],
    uitleg: 'Een orchidee wil licht bij de wortels en geen water dat blijft staan. Daarom laat je hem in het doorzichtige kweekpotje staan en zet je dat in een sierpot zonder gat. De sierpot moet net iets groter zijn dan het kweekpotje: meet de bovenrand van rand tot rand. Na het water geven laat je de plant eerst uitlekken voor je hem terugzet. Een hoge, smalle pot houdt de bladeren rechtop; een lage brede pot past beter bij een orchidee met veel luchtwortels.',
    fouten: ['Een sierpot kopen zonder het kweekpotje te meten.', 'De orchidee direct in de sierpot planten: zonder gat gaan de wortels rotten.', 'Water in de sierpot laten staan na het gieten.'],
    faq: [
      { q: 'Welke maat sierpot heb ik nodig voor een orchidee?', a: 'Dezelfde potmaat als het plastic kweekpotje, meestal 9 of 12 cm. Meet de bovenrand van rand tot rand.' },
      { q: 'Moet een sierpot voor een orchidee een gat hebben?', a: 'Nee. De orchidee blijft in zijn kweekpotje, dat wel gaten heeft. Laat hem na het water geven uitlekken voor je hem terugzet.' },
      { q: 'Kan een orchidee in een glazen pot?', a: 'Ja, glas laat licht door naar de wortels. Let er wel op dat er geen water onderin blijft staan.' } ],
    verwant: ['kamerplanten-thuis-kiezen', 'cadeau-voor-tuinliefhebbers', 'cadeau-schoonmoeder', 'cadeau-voor-iemand-die-net-verhuisd-is', 'luchtbevochtiger'],
  },
  {
    slug: 'lantaarn-binnen-kaars-kiezen', cat: 'Wonen', term: 'lantaarn binnen', kadoly: 'lantaarn-voor-binnen', vanaf: '2026-11-02',
    title: 'Welke lantaarn voor binnen past bij jou?', h1: 'Lantaarn voor binnen: welke past bij jouw kaarslicht?',
    seoTitle: 'Keuzehulp lantaarn binnen: welke past bij jouw kaarslicht?', metaDesc: 'Op tafel, op de vloer of ook buiten? 3 vragen, onze keuze bij Kadoly en de vergelijking met de prijs van vandaag bij bol.',
    intro: 'Een lantaarn geeft kaarslicht dat niet uitwaait en niet tegen de gordijnen komt. Waar hij staat, de stijl en of je een echte kaars gebruikt, bepalen welke past. Drie vragen.',
    kort: 'Voor op tafel of de vensterbank: een lantaarn van 20 tot 35 cm met glas. Voor op de vloer: 45 cm of hoger, of twee in verschillende maten. Gebruik je hem ook buiten, kies metaal of cortenstaal. Bij hout, jute of rotan altijd een led-kaars.',
    questions: [
      { q: 'Waar komt hij te staan?', options: [
        { label: 'Op tafel of de vensterbank', must: ['tafel', 'klein', 'windlicht', 'theelicht'] },
        { label: 'Op de vloer, als blikvanger', term: 'lantaarn groot', must: ['groot', 'xl', 'vloer', 'hoog'] },
        { label: 'Binnen en soms buiten', term: 'lantaarn binnen en buiten', must: ['buiten', 'outdoor', 'tuin'] } ] },
      { q: 'Welke stijl past bij je?', options: [
        { label: 'Strak, metaal en glas', must: ['metaal', 'glas', 'zwart', 'goud'] },
        { label: 'Natuurlijk, hout of rotan', must: ['hout', 'jute', 'bamboe', 'rotan'] },
        { label: 'Met een lichtpatroon op de muur', must: ['corten', 'uitgesneden', 'sterren', 'patroon', 'marokkaans'] } ] },
      { q: 'Wat zet je erin?', options: [
        { label: 'Een echte kaars', must: ['kaars', 'kaarsen', 'windlicht'] },
        { label: 'Een led-kaars, zonder vlam', add: 'led', must: ['led'] } ] } ],
    uitleg: 'Meet eerst de plek: een lantaarn op tafel mag het zicht niet blokkeren, dus houd hem onder de 35 cm. Op de vloer werkt een lantaarn pas vanaf ongeveer 45 cm, of twee lantaarns in verschillende hoogtes naast elkaar. Met glas zie je de vlam goed en blijft de kaars uit de wind. Cortenstaal en uitgesneden metaal geven lichtpatronen, maar cortenstaal kan roestafgifte geven: zet hem binnen op een onderzetter. Hout, jute en rotan zijn brandbaar; gebruik daarin altijd een led-kaars en laat een echte kaars nooit alleen branden.',
    fouten: ['Een echte kaars in een lantaarn van hout, jute of rotan zetten.', 'Een te hoge lantaarn op de eettafel, zodat je elkaar niet meer ziet.', 'Een cortenstalen lantaarn zonder onderzetter op een lichte vloer.'],
    faq: [
      { q: 'Welke kaars past in een lantaarn?', a: 'Een theelicht of led-kaars past bijna altijd. Voor een stompkaars meet je de opening en de hoogte binnenin.' },
      { q: 'Kan een lantaarn voor binnen ook buiten staan?', a: 'Metaal, cortenstaal en terracotta kunnen meestal buiten. Hout en jute niet zonder bescherming. Kijk wat de maker zegt.' },
      { q: 'Wat is het verschil tussen een lantaarn en een windlicht?', a: 'In de praktijk niets groots: beide beschermen een kaars tegen tocht. Een lantaarn heeft vaak een hendel om hem te dragen.' } ],
    verwant: ['kerstverlichting', 'kerstboom-verlichting-binnen-led', 'cadeau-voor-iemand-die-net-verhuisd-is', 'kerstcadeau-buren', 'plaid', 'tuinverlichting-zonne-energie'],
  },
  {
    slug: 'oplaadbare-tafellamp-snoerloos-kiezen', cat: 'Wonen', term: 'oplaadbare tafellamp', kadoly: 'oplaadbare-tafellamp', vanaf: '2026-11-02',
    title: 'Welke oplaadbare tafellamp past bij jou?', h1: 'Oplaadbare tafellamp: welke draadloze lamp past bij jou?',
    seoTitle: 'Keuzehulp oplaadbare tafellamp: welke draadloze lamp past?', metaDesc: 'Eettafel, terras of nachtkastje? 3 vragen, onze keuze bij Kadoly en de vergelijking met de prijs van vandaag bij bol.',
    intro: 'Een oplaadbare tafellamp zet je overal neer zonder snoer of stopcontact. Het verschil zit in hoe lang de accu meegaat, hoe fel hij kan en of hij buiten mag staan. Drie vragen.',
    kort: 'Voor sfeer op tafel: een dimbare lamp met warm licht en minstens 8 uur op vol licht. Voor buiten: let op IP44 of hoger. Voor het nachtkastje: een kleine lamp met een lage stand. Een oplaadbare lamp is sfeerlicht, geen vervanging voor je plafondlamp.',
    questions: [
      { q: 'Waar wil je hem gebruiken?', options: [
        { label: 'Op de eettafel of bij de bank', must: ['dimbaar', 'sfeer', 'tafellamp', 'touch'] },
        { label: 'Ook buiten op het terras', must: ['buiten', 'ip44', 'ip54', 'ip65', 'waterdicht'] },
        { label: 'Op het nachtkastje', must: ['nachtlamp', 'nachtkastje', 'mini', 'klein', 'slaapkamer'] } ] },
      { q: 'Welke look zoek je?', options: [
        { label: 'Metaal, goud of messing', must: ['goud', 'messing', 'metaal', 'gold', 'brons'] },
        { label: 'Zwart of wit, strak', must: ['zwart', 'wit', 'black', 'white'] },
        { label: 'Met een stoffen kap', must: ['kap', 'linnen', 'stof', 'plissé'] } ] },
      { q: 'Wat wil je uitgeven?', options: [
        { label: 'Tot 30 euro', max: 30 },
        { label: '30 tot 60 euro', min: 30, max: 60 },
        { label: 'Meer dan 60 euro', min: 60 } ] } ],
    uitleg: 'Kijk naar drie dingen. De batterijduur: fabrikanten noemen vaak de duur op de laagste stand, dus zoek ook naar de duur op vol licht (8 uur of meer is goed). De lichtkleur: voor sfeer wil je warm wit, rond 2700 Kelvin, en liefst een dimmer of touch-bediening. En waar hij staat: buiten heb je minstens IP44 nodig, dan kan hij tegen spatwater. Laden gaat meestal via USB-C; kijk of er een kabel bij zit. Een oplaadbare lamp geeft minder licht dan een lamp aan het stopcontact, dus lezen gaat beter met een gewone leeslamp.',
    fouten: ['Alleen naar de batterijduur op de laagste stand kijken.', 'Een lamp zonder IP-waarde mee naar buiten nemen.', 'Verwachten dat een oplaadbare lamp genoeg licht geeft om bij te lezen of te werken.'],
    faq: [
      { q: 'Hoe lang gaat een oplaadbare tafellamp mee op een lading?', a: 'Op vol licht meestal 6 tot 12 uur, op de laagste stand soms 50 tot 120 uur. Kijk welke stand de maker bedoelt.' },
      { q: 'Kan een oplaadbare tafellamp buiten staan?', a: 'Alleen als hij IP44 of hoger heeft. Zet hem bij regen toch even binnen, en laad hem binnen op.' },
      { q: 'Hoe laad je een oplaadbare tafellamp op?', a: 'Bijna altijd met een USB-C-kabel aan een gewone telefoonlader. Sommige lampen hebben een laadstation.' } ],
    verwant: ['leeslamp', 'bureaulamp', 'zaklamp-led-oplaadbaar', 'tuinverlichting-zonne-energie', 'nachtlamp-kind-slaaptrainer', 'matter-slimme-lamp'],
  },
  {
    slug: 'waterdichte-overschoenen-fiets-regen', cat: 'Kleding & schoenen', term: 'overschoenen regen', vanaf: '2026-11-02',
    title: 'Welke overschoenen houden je voeten droog op de fiets?', h1: 'Overschoenen tegen regen: welke houden je voeten droog op de fiets?',
    seoTitle: 'Keuzehulp overschoenen regen: droge voeten op de fiets', metaDesc: 'Gewone schoenen, wielrenschoenen of nette schoenen? 3 vragen en het passende paar met de prijs van vandaag bij bol.',
    intro: 'Een regenpak houdt je droog tot je enkels. Daaronder worden je schoenen nat, want het water loopt langs je broek naar beneden en spat op van het wiel. Overschoenen trek je over je eigen schoenen. Drie vragen.',
    kort: 'Voor gewone schoenen en korte ritten: rubberen of pvc-overschoenen met een rits of klittenband, die je in je tas meeneemt. Voor wielrenschoenen: neopreen overschoenen met een opening voor het klikplaatje. Kies een maat groter dan je schoenmaat als je stevige schoenen draagt.',
    actueel: 'November is de natste maand op de fiets: dit is de week om je regenuitrusting rond te maken.', actueelTot: '2026-11-30',
    questions: [
      { q: 'Wat voor schoenen draag je op de fiets?', options: [
        { label: 'Gewone schoenen of sneakers', must: ['overschoenen', 'regenhoes', 'schoenhoes', 'schoenhoezen'] },
        { label: 'Wielrenschoenen met klikpedalen', term: 'overschoenen wielrennen', must: ['wielren', 'race', 'fiets', 'neopreen'] },
        { label: 'Nette schoenen of laarsjes', must: ['overschoenen', 'hoog', 'laars', 'regen'] } ] },
      { q: 'Hoe vaak fiets je in de regen?', options: [
        { label: 'Af en toe, korte ritten', must: ['regen', 'waterdicht', 'herbruikbaar'] },
        { label: 'Elke dag naar werk of school', must: ['waterdicht', 'reflect', 'antislip', 'stevig'] } ] },
      { q: 'Wil je ze in je tas meenemen?', options: [
        { label: 'Ja, ze moeten klein opvouwen', must: ['opvouw', 'compact', 'herbruikbaar', 'siliconen'] },
        { label: 'Maakt niet uit' } ] } ],
    uitleg: 'Overschoenen houden pas droog als je broek of regenbroek over de overschoen valt, niet erin. Anders loopt het water er van boven in. Let op de zool: een antislip zool is belangrijk als je ermee loopt, en bij klikpedalen heb je een opening onder de schoen nodig. Reflecterende strepen maken je in het donker beter zichtbaar van achteren. Neopreen houdt ook warm, maar is na een lange rit van binnen vochtig; rubber en pvc zijn echt waterdicht maar ademen niet. Neem bij twijfel een maat groter: over een stevige schoen is een krappe overschoen lastig aan te trekken.',
    fouten: ['De regenbroek in de overschoen stoppen, zodat het water er van boven in loopt.', 'Een krappe maat kiezen voor stevige schoenen.', 'Overschoenen zonder antislip zool, en dan uitglijden bij het afstappen.'],
    faq: [
      { q: 'Welke maat overschoenen moet ik nemen?', a: 'Je eigen schoenmaat, of een maat groter bij stevige schoenen of laarsjes. Kijk in de maattabel van de maker.' },
      { q: 'Zijn overschoenen echt waterdicht?', a: 'Rubber, pvc en siliconen wel. Neopreen houdt veel tegen en is warm, maar laat bij lange ritten wat vocht door.' },
      { q: 'Kun je met overschoenen lopen?', a: 'Korte stukjes wel, zeker met een antislip zool. Voor lange wandelingen zijn waterdichte schoenen beter.' } ],
    verwant: ['regenpak-fiets', 'stormparaplu-en-regenpak-volwassenen-kiezen', 'waterdichte-jas-fiets-forenzen', 'fietstas-waterdicht', 'handschoenen-touchscreen-fiets', 'waterdichte-schoenen-heren', 'wintertijd-fietslamp-donkere-avonden'],
  },
  {
    slug: 'voorruit-afdekhoes-vorst-kiezen', cat: 'Klussen', term: 'voorruit afdekhoes', vanaf: '2026-11-02',
    title: 'Welke afdekhoes houdt je voorruit ijsvrij?', h1: 'Voorruit afdekhoes tegen vorst: welke past bij jouw auto?',
    seoTitle: 'Keuzehulp voorruit afdekhoes: geen krabben bij vorst', metaDesc: 'Kleine auto of SUV, met of zonder spiegelhoezen? 3 vragen en de passende hoes met de prijs van vandaag bij bol.',
    intro: 'Een afdekhoes leg je ’s avonds over je voorruit. Bij vorst trek je hem er ’s ochtends af en is de ruit vrij, zonder krabben of ontdooien. Drie vragen.',
    kort: 'Kies een hoes die breder is dan je ruit en een stuk over de zijkanten valt. Voor een kleine auto is een standaardmaat genoeg; voor een SUV of busje neem je XL. Flappen die je in de deuren klemt houden hem ook bij wind op zijn plek; magneten zijn sneller, maar kunnen lak krassen als er vuil onder zit.',
    actueel: 'De eerste nachtvorst is begin november voorspeld: leg de hoes klaar voordat je hem nodig hebt.', actueelTot: '2026-12-15',
    questions: [
      { q: 'Wat voor auto heb je?', options: [
        { label: 'Kleine auto of hatchback', must: ['universeel', 'standaard', 'auto', 'personenauto'] },
        { label: 'SUV, stationwagen of busje', must: ['suv', 'xl', 'groot', 'large', 'bus'] } ] },
      { q: 'Wat wil je ijsvrij houden?', options: [
        { label: 'Alleen de voorruit', must: ['voorruit', 'ruit'] },
        { label: 'Voorruit en zijspiegels', must: ['spiegel', 'spiegelhoes', 'spiegels'] } ] },
      { q: 'Hoe zet je hem vast?', options: [
        { label: 'Met magneten, snel klaar', must: ['magneet', 'magnetisch', 'magneten'] },
        { label: 'Met flappen in de deuren, ook bij wind', must: ['deur', 'flappen', 'klem', 'bevestiging'] },
        { label: 'Maakt niet uit' } ] } ],
    uitleg: 'Een afdekhoes werkt alleen als hij de hele ruit bedekt en goed vastzit. Meet de breedte van je voorruit en kies een hoes die aan beide kanten ruim overlapt. Flappen die je in de voordeuren klemt houden de hoes vast en maken hem lastiger te stelen. Magneten zijn handig, maar haal eerst vuil en zand van de motorkap, anders kras je de lak. Een hoes met zilveren kant werkt in de zomer ook als zonnescherm. Leg een natte hoes na gebruik niet opgevouwen in de auto: laat hem drogen, anders gaat hij muf ruiken.',
    fouten: ['Een te smalle hoes, zodat de randen van de ruit toch bevriezen.', 'Magneten op een vuile motorkap: dat geeft krassen.', 'De hoes op een al bevroren ruit leggen: hij moet er ’s avonds op.'],
    faq: [
      { q: 'Werkt een afdekhoes ook tegen sneeuw?', a: 'Ja, je trekt de sneeuw er met de hoes in één keer af. Bij veel natte sneeuw wordt hij wel zwaar.' },
      { q: 'Kan een afdekhoes vastvriezen?', a: 'Op een droge ruit zelden. Leg hem niet op een natte ruit, dan kan de onderkant vastvriezen.' },
      { q: 'Past een universele afdekhoes op elke auto?', a: 'Op de meeste personenauto’s wel. Voor een SUV of busje heb je een grotere maat nodig.' } ],
    verwant: ['sneeuwketting', 'dashcam', 'thermosfles-isoleerfles', 'handschoenen-touchscreen-fiets', 'cadeau-voor-motorrijders-en-autoliefhebbers'],
  },
  {
    slug: 'verwarmde-bodywarmer-jas-accu-kiezen', cat: 'Kleding & schoenen', term: 'verwarmde bodywarmer', vanaf: '2026-11-03',
    title: 'Welke verwarmde bodywarmer of jas past bij jou?', h1: 'Verwarmde bodywarmer of jas: welke houdt je warm buiten?',
    seoTitle: 'Keuzehulp verwarmde bodywarmer: warm zonder dikke jas', metaDesc: 'Fietsen, wandelen met de hond of langs het veld staan? 3 vragen en de passende verwarmde kleding met de prijs van vandaag bij bol.',
    intro: 'Een verwarmde bodywarmer heeft dunne verwarmingselementen in de rug en op de borst, die op een powerbank werken. Je blijft warm zonder dikke lagen. Drie vragen.',
    kort: 'Voor fietsen en buiten werken: een dunne verwarmde bodywarmer onder je jas. Voor stilstaan in de kou, zoals langs het sportveld: een verwarmde jas. Kijk of er een powerbank bij zit en hoeveel standen hij heeft; op de hoogste stand gaat een powerbank vaak maar 2 tot 4 uur mee.',
    questions: [
      { q: 'Waarvoor wil je hem gebruiken?', options: [
        { label: 'Fietsen of buiten werken', must: ['bodywarmer', 'vest', 'gilet'] },
        { label: 'Stilstaan in de kou, zoals langs het veld', term: 'verwarmde jas', must: ['jas', 'jack', 'parka'] },
        { label: 'Als extra laag onder mijn eigen jas', must: ['vest', 'bodywarmer', 'dun', 'licht'] } ] },
      { q: 'Voor wie is hij?', options: [
        { label: 'Heren', add: 'heren', must: ['heren', 'men', 'unisex', 'man'] },
        { label: 'Dames', add: 'dames', must: ['dames', 'women', 'unisex', 'vrouw'] },
        { label: 'Maakt niet uit', must: ['unisex', 'verwarmd', 'verwarmde'] } ] },
      { q: 'Heb je al een powerbank?', options: [
        { label: 'Ja, ik gebruik mijn eigen', must: ['usb', 'powerbank'] },
        { label: 'Nee, die moet erbij zitten', must: ['inclusief', 'met powerbank', 'met accu', 'accu', 'batterij'] } ] } ],
    uitleg: 'Let op drie dingen. Waar de verwarming zit: rug en borst is genoeg voor de meeste mensen, met extra zones bij de nek of zakken is fijner bij lang stilstaan. De powerbank: de meeste werken met een gewone USB-powerbank van 10.000 mAh, goed voor ongeveer 3 uur op de hoogste stand en langer op de laagste. En de pasvorm: een verwarmde laag werkt het best als hij dicht op je lichaam zit, dus kies niet te ruim. De meeste kun je wassen nadat je de powerbank en de kabel eruit hebt gehaald; kijk naar het wasvoorschrift.',
    fouten: ['Een ruime maat kiezen, zodat de warmte niet bij je lichaam komt.', 'Verwachten dat de hoogste stand de hele dag meegaat.', 'Wassen met de kabel of powerbank er nog in.'],
    faq: [
      { q: 'Hoe lang blijft een verwarmde bodywarmer warm?', a: 'Met een powerbank van 10.000 mAh ongeveer 3 uur op de hoogste stand en 6 tot 8 uur op de laagste.' },
      { q: 'Kun je een verwarmde bodywarmer wassen?', a: 'Meestal wel, op een lage temperatuur, nadat je de powerbank en de kabel eruit hebt gehaald. Volg het wasvoorschrift.' },
      { q: 'Is een verwarmde bodywarmer veilig in de regen?', a: 'Lichte regen is meestal geen probleem, omdat de spanning laag is. Bij harde regen draag je er een regenjas over.' } ],
    verwant: ['bodywarmer-dames', 'thermo-ondergoed', 'elektrische-deken', 'waterdichte-jas-fiets-forenzen', 'cadeau-voor-koude-voeten-en-winterwarmte', 'handschoenen-touchscreen-fiets'],
  },
  {
    slug: 'kerstboomstandaard-kiezen', cat: 'Wonen', term: 'kerstboomstandaard', vanaf: '2026-11-04',
    title: 'Welke kerstboomstandaard past bij jouw boom?', h1: 'Kerstboomstandaard kiezen: welke houdt jouw boom recht?',
    seoTitle: 'Keuzehulp kerstboomstandaard: welke houdt je boom recht?', metaDesc: 'Echte boom of kunstboom, met of zonder water? 3 vragen en de passende standaard met de prijs van vandaag bij bol.',
    intro: 'Een kerstboom die scheef staat of na een week al naalden verliest, ligt vaak aan de standaard. Hoe hoog de boom is, of hij water nodig heeft en hoe je hem vastzet, bepalen welke past. Drie vragen.',
    kort: 'Voor een echte boom tot 2 meter: een standaard met waterreservoir van minstens 1 liter en een stamdiameter tot 10 cm. Voor grotere bomen een zware voet met snelspanner. Een kunstboom heeft genoeg aan een simpele metalen kruisvoet.',
    questions: [
      { q: 'Wat voor boom heb je?', options: [
        { label: 'Een echte boom tot 2 meter', must: ['kerstboomstandaard', 'kerstboomvoet', 'water', 'reservoir'] },
        { label: 'Een echte boom van meer dan 2 meter', must: ['250', '300', 'groot', 'xl', 'zwaar'] },
        { label: 'Een kunstkerstboom', term: 'kerstboomvoet kunstkerstboom', must: ['kunstkerstboom', 'kunst', 'voet', 'standaard'] } ] },
      { q: 'Hoe wil je hem rechtzetten?', options: [
        { label: 'Snel, met een pedaal of spanner', must: ['snel', 'pedaal', 'spanner', 'eenvoudig', 'draai'] },
        { label: 'Met schroeven is prima', must: ['schroef', 'schroeven', 'bout'] } ] },
      { q: 'Wat wil je uitgeven?', options: [
        { label: 'Tot 25 euro', max: 25 },
        { label: 'Meer dan 25 euro', min: 25 } ] } ],
    uitleg: 'Meet de stam onderaan voor je koopt: de meeste standaarden passen tot 10 of 12 cm. Een echte boom drinkt de eerste dagen veel, soms meer dan een liter per dag, dus een groot waterreservoir voorkomt dat hij uitdroogt en naalden verliest. Zaag thuis een dun plakje van de stam, dan neemt hij weer water op. Een standaard met pedaal of snelspanner zet je met één persoon recht; met schroeven heb je iemand nodig die de boom vasthoudt. Hoe hoger de boom, hoe zwaarder de voet moet zijn, anders kan hij omvallen.',
    fouten: ['De stam niet meten, en dan past hij niet in de standaard.', 'Een standaard zonder water voor een echte boom.', 'Een lichte voet onder een hoge boom, zodat hij kan omvallen.'],
    faq: [
      { q: 'Hoeveel water heeft een kerstboom nodig?', a: 'De eerste dagen vaak meer dan een liter per dag. Kijk elke dag of er nog water in het reservoir staat.' },
      { q: 'Welke stamdiameter past in een kerstboomstandaard?', a: 'Meestal tot 10 of 12 cm. Grote standaarden passen tot 15 cm. Meet de stam onderaan.' },
      { q: 'Heeft een kunstkerstboom een speciale standaard nodig?', a: 'Nee, de meeste kunstbomen hebben een eigen metalen voet. Een losse voet koop je alleen als die kwijt of kapot is.' } ],
    verwant: ['kunstkerstboom', 'kerstverlichting', 'kerstboom-verlichting-binnen-led', 'kerstverlichting-buiten-zonne-energie', 'kerstservies', 'adventskalender'],
  },
  {
    slug: 'kerstballen-set-kiezen', cat: 'Wonen', term: 'kerstballen set', kadoly: 'kerstballen-set', vanaf: '2026-11-04',
    title: 'Welke set kerstballen past bij jouw boom?', h1: 'Kerstballen kiezen: glas of onbreekbaar, en hoeveel heb je nodig?',
    seoTitle: 'Keuzehulp kerstballen: glas of onbreekbaar, en hoeveel?', metaDesc: 'Glas of onbreekbaar, welke kleur en hoeveel ballen? 3 vragen, onze keuze bij Kadoly en de vergelijking met de prijs van vandaag bij bol.',
    intro: 'Kerstballen kopen gaat vaak mis op twee punten: te weinig ballen voor de boom, of glas in een huis met kleine kinderen of een kat. Drie vragen.',
    kort: 'Reken voor een boom van 1,80 m op 40 tot 60 ballen in twee of drie maten. Glas glanst het mooist; met kleine kinderen of huisdieren kies je onbreekbaar, of glas bovenin en onbreekbaar onderin. Houd het bij twee of drie kleuren, dan oogt de boom rustig.',
    questions: [
      { q: 'Glas of onbreekbaar?', options: [
        { label: 'Glas, voor de mooiste glans', term: 'kerstballen glas set', must: ['glas', 'glazen'] },
        { label: 'Onbreekbaar, er lopen kinderen of huisdieren rond', term: 'kerstballen onbreekbaar set', must: ['onbreekbaar', 'kunststof', 'plastic', 'shatterproof'] } ] },
      { q: 'Welke kleur past bij je?', options: [
        { label: 'Goud of champagne', must: ['goud', 'champagne', 'gold'] },
        { label: 'Wit of zilver', must: ['wit', 'zilver', 'white', 'silver'] },
        { label: 'Klassiek rood', must: ['rood', 'red', 'bordeaux'] },
        { label: 'Mix van kleuren', must: ['mix', 'assorti', 'kleuren', 'multi'] } ] },
      { q: 'Hoe groot is je boom?', options: [
        { label: 'Tot 1,50 meter', max: 25 },
        { label: '1,50 meter of groter', min: 15 } ] } ],
    uitleg: 'Een veelgebruikte vuistregel: ongeveer 20 ballen per 60 cm boomhoogte, dus 50 tot 60 voor een boom van 1,80 m. Een set met twee of drie maten (bijvoorbeeld 5, 6 en 7 cm) geeft diepte: grote ballen binnenin bij de stam, kleine aan de punten. Glazen ballen glanzen meer, maar breken op een harde vloer. Onbreekbare ballen van kunststof zien er tegenwoordig vaak bijna hetzelfde uit en kunnen onderin de boom, waar kinderen en katten bij kunnen. Hang de lichtjes eerst op, dan de grote ballen, dan de kleine.',
    fouten: ['Eén set van 20 ballen kopen voor een boom van 2 meter.', 'Glazen ballen onderin hangen terwijl er een peuter of kat rondloopt.', 'Te veel kleuren door elkaar, zodat de boom onrustig oogt.'],
    faq: [
      { q: 'Hoeveel kerstballen heb je nodig?', a: 'Ongeveer 20 per 60 cm boomhoogte. Voor een boom van 1,80 m zijn dat 50 tot 60 ballen.' },
      { q: 'Zijn onbreekbare kerstballen mooi?', a: 'De meeste zien er van een afstand uit als glas, vooral in mat of glitter. Van dichtbij glanst glas meer.' },
      { q: 'Welke maat kerstballen kies je?', a: 'Een mix van 5 tot 8 cm. Grote ballen hang je binnenin, kleine aan de punten van de takken.' } ],
    verwant: ['kunstkerstboom', 'kerstverlichting', 'kerstboom-verlichting-binnen-led', 'kerstboomstandaard-kiezen', 'kerstservies', 'kerstdiner-thuis-servies-en-tafel'],
  },
  {
    slug: 'windspinner-tuin-kiezen', cat: 'Tuin', term: 'windspinner', kadoly: 'windspinner-tuin', vanaf: '2026-11-04',
    title: 'Welke windspinner past bij jouw tuin?', h1: 'Windspinner kiezen: hangen of in de grond, en welke maat?',
    seoTitle: 'Keuzehulp windspinner: hangen of in de grond, welke maat?', metaDesc: 'Hangen of op een paal, met of zonder kristal? 3 vragen, onze keuze bij Kadoly en de vergelijking met de prijs van vandaag bij bol.',
    intro: 'Een windspinner draait mee met de wind en vangt het licht. Waar je hem kwijt kunt, hoe groot hij moet zijn en of hij moet schitteren, bepalen welke past. Drie vragen.',
    kort: 'Heb je een tak, pergola of balkon om iets aan te hangen, kies een hangende spinner; voor veel schittering een met kristal of kijkbal. Geen plek om te hangen: een spinner op een paal. Kies roestvrij staal of gepoedercoat metaal als hij het hele jaar buiten blijft.',
    questions: [
      { q: 'Waar komt hij?', options: [
        { label: 'Aan een tak, pergola of balkon', must: ['hang', 'haak', 'hangend', 'ophang'] },
        { label: 'In de grond, op een paal', term: 'windspinner met paal tuin', must: ['paal', 'steker', 'grond', 'stok'] } ] },
      { q: 'Wat wil je zien?', options: [
        { label: 'Schittering, met kristal of glas', must: ['kristal', 'glas', 'kijkbal', 'bol'] },
        { label: 'Een rustig draaiend patroon', must: ['mandala', 'spiraal', 'vortex', '3d'] },
        { label: 'Vrolijke kleuren', must: ['kleur', 'regenboog', 'bloem', 'vlinder'] } ] },
      { q: 'Hoe groot mag hij zijn?', options: [
        { label: 'Klein, tot 20 cm', must: ['15 cm', '16 cm', '20 cm', 'klein', 'mini'] },
        { label: 'Groot, 30 cm of meer', must: ['30 cm', '40 cm', '45 cm', '50 cm', 'groot'] } ] } ],
    uitleg: 'Een windspinner draait pas goed als hij vrij hangt en wind vangt: hang hem minstens een armlengte van muren en takken. Een draaihaak met kogellager zorgt dat hij soepel blijft draaien en niet in de knoop raakt. Roestvrij staal (RVS) kan het hele jaar buiten; geverfd metaal kan na een paar seizoenen dof worden. Kristallen en kijkbollen werpen in de zon lichtvlekjes, maar binnen draait een spinner niet zonder batterijmotor. Bij een spinner op een paal: steek de paal diep genoeg in de grond, anders waait hij om.',
    fouten: ['Een spinner te dicht tegen een muur hangen, zodat hij nauwelijks draait.', 'Geen draaihaak gebruiken, zodat het touw in de knoop raakt.', 'Verwachten dat een windspinner binnen vanzelf draait.'],
    faq: [
      { q: 'Draait een windspinner ook binnen?', a: 'Niet vanzelf. Binnen heb je een draaiende motor op batterijen nodig, die je los koopt.' },
      { q: 'Kan een windspinner de hele winter buiten hangen?', a: 'Een van roestvrij staal wel. Haal hem bij storm even binnen, dan blijft hij heel.' },
      { q: 'Hoe hang je een windspinner op?', a: 'Aan een draaihaak met kogellager, aan een tak of haak, met ruimte rondom zodat hij vrij kan draaien.' } ],
    verwant: ['tuinverlichting-zonne-energie', 'cadeau-voor-tuinliefhebbers', 'cadeau-voor-tuinvogels-en-natuurliefhebbers', 'stormbestendige-tuinmeubelhoes', 'cadeau-voor-iemand-die-net-verhuisd-is'],
  },
  {
    slug: 'muursticker-kinderkamer-kiezen', cat: 'Wonen', term: 'muursticker kinderkamer', kadoly: 'muursticker-kinderkamer', vanaf: '2026-11-04',
    title: 'Welke muursticker past in de kinderkamer?', h1: 'Muursticker kinderkamer: tekst, stippen of een heel thema?',
    seoTitle: 'Keuzehulp muursticker kinderkamer: tekst, stippen of thema?', metaDesc: 'Eén blikvanger of een hele muur, en kan hij er later weer af? 3 vragen, onze keuze bij Kadoly en de vergelijking met de prijs van vandaag bij bol.',
    intro: 'Met een muursticker maak je een kinderkamer af zonder te verven. Het verschil zit in hoe groot hij is, wat erop staat en of je hem later zonder sporen weer weghaalt. Drie vragen.',
    kort: 'Voor één blikvanger boven het bed: een tekst- of figuursticker van 50 tot 80 cm breed. Voor een speelse hele muur: losse stippen, hartjes of sterren die je zelf verdeelt. Huur je, of wil je hem later weghalen? Kies een sticker die als verwijderbaar wordt verkocht en test eerst op een verborgen plek.',
    questions: [
      { q: 'Wat wil je op de muur?', options: [
        { label: 'Eén blikvanger boven het bed', must: ['tekst', 'naam', 'quote', 'maan', 'regenboog'] },
        { label: 'Een hele muur met stippen of figuurtjes', term: 'muursticker stippen kinderkamer', must: ['stippen', 'dots', 'hartjes', 'sterren', 'confetti'] },
        { label: 'Een thema, zoals dieren of de ruimte', term: 'muursticker dieren kinderkamer', must: ['dieren', 'jungle', 'ruimte', 'planeten', 'safari'] } ] },
      { q: 'Welke kleuren?', options: [
        { label: 'Rustig: wit, beige, zand of terra', must: ['beige', 'terra', 'naturel', 'wit', 'zand', 'oker'] },
        { label: 'Vrolijk en kleurrijk', must: ['kleur', 'regenboog', 'roze', 'blauw', 'groen', 'geel'] } ] },
      { q: 'Moet hij er later weer af kunnen?', options: [
        { label: 'Ja, zonder sporen', must: ['verwijderbaar', 'herpositioneerbaar', 'zonder resten', 'removable'] },
        { label: 'Maakt niet uit' } ] } ],
    uitleg: 'Muurstickers zijn meestal van vinyl. Ze hechten het best op een gladde, droge muur met latex: op structuurverf of vers geverfde muren (wacht minstens drie weken) laten ze sneller los. Een grote tekststicker komt op applicatiefolie: plak hem in één keer, van het midden naar buiten, en wrijf luchtbellen weg. Losse stippen en hartjes zijn makkelijker voor een eerste keer en vergeven scheef plakken. Wil je hem later weghalen, trek dan langzaam en laag langs de muur; een föhn maakt de lijm zachter.',
    fouten: ['Plakken op een muur die net geverfd is.', 'Een grote tekststicker zonder hulp in één keer opplakken, met scheve letters als gevolg.', 'Aannemen dat elke sticker zonder sporen weggaat in een huurhuis.'],
    faq: [
      { q: 'Kun je een muursticker weghalen zonder schade?', a: 'Vaak wel bij latex op een gladde muur, langzaam trekken en eventueel even föhnen. Garantie geven alleen stickers die als verwijderbaar worden verkocht.' },
      { q: 'Op welke muur blijft een muursticker plakken?', a: 'Op een gladde, droge, schone muur met latex. Op structuurverf of behang met reliëf hecht hij slecht.' },
      { q: 'Hoe lang moet verf drogen voor je een sticker plakt?', a: 'Minstens drie weken, anders kan de sticker de verf meenemen als je hem verwijdert.' } ],
    verwant: ['kinderkamer-opbergkast-speelgoed', 'nachtlamp-kind-slaaptrainer', 'kinderbed', 'hoogslaper-kind', 'cadeau-peuter', 'wekker-kind-leren-klok'],
  },
  {
    slug: 'lootjes-cadeau-sinterklaas-20-euro', cat: 'Speelgoed', term: 'fleece plaid', vanaf: '2026-11-04',
    title: 'Welk lootjescadeau van 20 euro past bij jouw lootje?', h1: 'Lootjes trekken: een cadeau van 20 euro dat wel past',
    seoTitle: 'Keuzehulp lootjes 20 euro: cadeau dat wel past', metaDesc: 'Lootje voor een man, vrouw of tiener, voor thuis, buiten of de keuken? 3 vragen en een cadeau van rond 20 euro met de prijs van vandaag bij bol.',
    intro: 'Bij lootjes trekken ken je je lootje soms maar half, en het budget ligt vast. Een goed cadeau van 20 euro is klein, bruikbaar en past bij wat iemand graag doet. Drie vragen.',
    kort: 'Kies iets wat iemand zelf niet snel koopt maar wel gebruikt: een spel voor de familieavond, warme sokken of een fleece plaid, een goede thermosbeker of iets lekkers voor in de keuken. Blijf rond de 20 euro, zodat het eerlijk is tegenover de anderen, en houd de bon erbij.',
    actueel: 'Sinterklaas is op 5 december. Lootjes worden nu getrokken: bestel ruim voor 1 december, dan ligt het op tijd klaar.', actueelTot: '2026-12-05',
    questions: [
      { q: 'Waar houdt je lootje van?', options: [
        { label: 'Lekker thuis op de bank', term: 'fleece plaid', must: ['plaid', 'deken', 'fleece'] },
        { label: 'Spelletjes en gezelligheid', term: 'kaartspel volwassenen', must: ['spel', 'kaartspel', 'quiz', 'party'] },
        { label: 'Buiten, fietsen of sporten', term: 'thermosbeker', must: ['thermos', 'beker', 'isoleer', 'koffie'] },
        { label: 'Warme voeten', term: 'warme sokken', must: ['sokken', 'huissokken', 'thermo', 'wol'] } ] },
      { q: 'Voor wie is het lootje?', options: [
        { label: 'Een vrouw', must: ['dames', 'vrouw', 'unisex', 'grijs', 'beige', 'roze'] },
        { label: 'Een man', must: ['heren', 'man', 'unisex', 'zwart', 'grijs', 'blauw'] },
        { label: 'Een tiener', must: ['tiener', 'kinderen', 'familie', 'unisex', 'kleur'] } ] },
      { q: 'Wat wil je uitgeven?', options: [
        { label: 'Tot 20 euro', min: 8, max: 20 },
        { label: 'Rond de 25 euro', min: 18, max: 28 } ] } ],
    uitleg: 'Een lootjescadeau werkt het best als het iets is dat je lootje echt gebruikt. Kijk naar hobby\'s en gewoontes in plaats van naar dingen die iemand al heeft. Spellen en kaartspellen doen het goed, omdat je ze op de avond zelf kunt spelen. Warme sokken, een plaid of een goede beker zijn veilige keuzes als je iemand minder goed kent. Pak een klein extraatje erbij, zoals een chocoladeletter of een gedicht: dat maakt het af zonder over het budget te gaan. Bewaar de bon of kies iets met een ruime ruiltermijn.',
    fouten: ['Ruim boven het afgesproken bedrag gaan, zodat anderen zich ongemakkelijk voelen.', 'Iets persoonlijks als parfum kiezen voor iemand die je nauwelijks kent.', 'Te laat bestellen, zodat het cadeau er op 5 december nog niet is.'],
    faq: [
      { q: 'Wat geef je bij lootjes trekken voor 20 euro?', a: 'Iets bruikbaars dat past bij een hobby of gewoonte: een spel, warme sokken of plaid, een thermosbeker of iets lekkers voor in de keuken.' },
      { q: 'Wat geef je als je je lootje niet goed kent?', a: 'Iets wat bijna iedereen gebruikt: een kaartspel, een fleece plaid of een goede beker. Vermijd geur en kleding in een maat.' },
      { q: 'Tot wanneer kun je bestellen voor Sinterklaas?', a: 'Bestel liefst voor 1 december. Kijk bij het product naar de levertijd die erbij staat.' } ],
    verwant: ['sinterklaas-cadeau-vrouw-25-euro', 'sinterklaas-cadeau-man', 'schoencadeautjes', 'kerstcadeau-onder-10-euro', 'kerstcadeau-collega-onder-15-euro', 'sinterklaasspel', 'kerstcadeau-tiener-onder-25-euro'],
  },
  {
    slug: 'kerststal-kiezen', cat: 'Wonen', term: 'kerststal', kadoly: 'kerststal', vanaf: '2026-11-10',
    title: 'Welke kerststal past bij jou?', h1: 'Kerststal kiezen: binnen of buiten, klassiek of modern?',
    seoTitle: 'Keuzehulp kerststal: binnen of buiten, klassiek of modern?', metaDesc: 'Op tafel, in de tuin of met licht? 3 vragen, onze keuze bij Kadoly en de vergelijking met de prijs van vandaag bij bol.',
    intro: 'Een kerststal koop je meestal voor jaren. Waar hij komt, hoe hij eruitziet en of hij licht moet geven, bepalen welke past. Drie vragen.',
    kort: 'Voor binnen kies je een stal die stevig staat op een voetplaat of sokkel, van hout, beeldjes of metaal. Voor buiten moet hij tegen regen en wind kunnen: metaal of cortenstaal met staven of een zware voet. Wil je dat hij licht geeft, kies een stal met verlichting of een silhouet met een kaarsje erachter.',
    questions: [
      { q: 'Waar komt hij?', options: [
        { label: 'Binnen, op tafel, kast of vensterbank', term: 'kerststal', must: ['kerststal', 'stal', 'kribbe'] },
        { label: 'Buiten, in de tuin of bij de voordeur', term: 'kerststal buiten', must: ['buiten', 'tuin', 'outdoor', 'weerbestendig', 'metaal', 'metalen'] } ] },
      { q: 'Hoe moet hij eruitzien?', options: [
        { label: 'Klassiek, met beeldjes', term: 'kerststal met beelden', must: ['beelden', 'beeldjes', 'figuren', 'heilige familie'] },
        { label: 'Modern, een strak silhouet', term: 'kerststal metaal', must: ['metaal', 'metalen', 'silhouet', 'staal', 'hout'] },
        { label: 'Met verlichting', term: 'kerststal verlichting', must: ['verlichting', 'led', 'licht', 'verlicht'] } ] },
      { q: 'Wat wil je uitgeven?', options: [
        { label: 'Tot 50 euro', max: 50 },
        { label: 'Het mag meer zijn', min: 40 } ] } ],
    uitleg: 'Een kerststal bestaat uit de stal (het dak of de achterwand) en de figuren: Maria, Jozef en de kribbe, vaak met herders, engel en de drie koningen. Bij goedkope sets zijn de figuren vaak los en klein; bij een silhouet van metaal zitten stal en figuren in één stuk. Voor buiten kies je metaal of cortenstaal: hout en polystone kunnen in de regen gaan splijten of verkleuren. Cortenstaal is staal met een roestlaag die het beschermt, maar het kan afgeven op lichte vloeren en vensterbanken; leg er iets onder. Een kerststal komt het mooist uit met licht erachter of erin: een lampje, lichtsnoer of kaarsje.',
    fouten: ['Een houten of polystone stal buiten zetten, zodat hij in de regen beschadigt.', 'Een stal van geroest staal direct op een lichte vensterbank zetten.', 'Te laat bestellen: kijk naar de levertijd als hij er op de eerste advent moet staan.'],
    faq: [
      { q: 'Welke kerststal kan buiten staan?', a: 'Een van metaal of cortenstaal, met staven voor in de grond of een zware voetplaat. Hout en polystone zijn vooral voor binnen.' },
      { q: 'Wanneer zet je de kerststal neer?', a: 'Veel mensen zetten hem neer op de eerste adventszondag, in 2026 is dat 29 november, en laten hem staan tot Driekoningen op 6 januari.' },
      { q: 'Zitten de figuren erbij?', a: 'Dat verschilt. Kijk in de omschrijving of de stal leeg is, met losse figuren komt, of één silhouet is waarin de figuren zitten.' } ],
    verwant: ['kerstballen-set-kiezen', 'kunstkerstboom', 'kerstverlichting', 'kerstboomstandaard-kiezen', 'lantaarn-binnen-kaars-kiezen'],
  },
  {
    slug: 'kerstkrans-kiezen', cat: 'Wonen', term: 'kerstkrans', kadoly: 'kerstkrans', vanaf: '2026-11-10',
    title: 'Welke kerstkrans past bij jouw deur?', h1: 'Kerstkrans kiezen: welke stijl, welke maat, en kan hij buiten?',
    seoTitle: 'Keuzehulp kerstkrans: stijl, maat en kan hij buiten?', metaDesc: 'Rood, natuurlijk of met lichtjes, binnen of aan de voordeur? 3 vragen, onze keuze bij Kadoly en de vergelijking met de prijs van vandaag bij bol.',
    intro: 'Een kerstkrans hangt vaak van de eerste advent tot Driekoningen. Waar hij komt, welke stijl en of hij licht moet geven, bepalen welke past. Drie vragen.',
    kort: 'Voor buiten aan de voordeur kies je een krans die tegen regen kan, of je hangt hem onder een afdak. Binnen kan elke krans. 40 cm past op een gewone deur, 45 tot 50 cm valt op aan een voordeur. Wil je lichtjes, neem een krans met led-verlichting of gebruik led-theelichtjes, zeker bij kunststof en schuim.',
    questions: [
      { q: 'Waar komt hij?', options: [
        { label: 'Buiten aan de voordeur', term: 'kerstkrans buiten', must: ['buiten', 'deur', 'outdoor', 'weerbestendig', 'krans'] },
        { label: 'Binnen, aan muur of deur', term: 'kerstkrans', must: ['krans', 'kerstkrans'] } ] },
      { q: 'Welke stijl past bij je?', options: [
        { label: 'Klassiek rood', must: ['rood', 'rode', 'bessen', 'besjes', 'red'] },
        { label: 'Natuurlijk, met groen en dennenappels', must: ['dennenappel', 'groen', 'natuur', 'dennen'] },
        { label: 'Met lichtjes', term: 'kerstkrans met verlichting', must: ['verlichting', 'led', 'licht', 'verlicht'] } ] },
      { q: 'Wat wil je uitgeven?', options: [
        { label: 'Tot 35 euro', max: 35 },
        { label: 'Het mag meer zijn', min: 30 } ] } ],
    uitleg: 'De meeste kerstkransen zijn van kunststof, met schuim, papier of echte dennenappels erin. Kijk bij buitengebruik of de maker het noemt: binnenkransen kunnen in de regen verkleuren of slap worden. Hang een krans aan de buitenkant van de deur met een kranshaak over de bovenkant, of aan een lint dat je binnen vastzet; dan hoef je niet te boren. Een krans plat op tafel met vier lichtjes is meteen een adventskrans. Gebruik in kunststof en schuim led-theelichtjes in plaats van echte kaarsen.',
    fouten: ['Een binnenkrans buiten in de regen hangen.', 'Echte kaarsen in een krans van kunststof of schuim zetten.', 'Een te kleine krans aan een grote voordeur, zodat hij wegvalt.'],
    faq: [
      { q: 'Kan een kerstkrans buiten hangen?', a: 'Alleen als de maker dat noemt, of onder een afdak. Veel kransen zijn voor binnen gemaakt.' },
      { q: 'Welke maat kerstkrans voor de voordeur?', a: '45 tot 50 cm valt goed op aan een voordeur; 40 cm past op een binnendeur.' },
      { q: 'Wanneer hang je de kerstkrans op?', a: 'Veel mensen rond de eerste advent, in 2026 op 29 november, tot Driekoningen op 6 januari.' } ],
    verwant: ['kerststal-kiezen', 'kerstballen-set-kiezen', 'kerstverlichting', 'kerstverlichting-buiten-zonne-energie', 'adventskalender', 'lantaarn-binnen-kaars-kiezen'],
  },
  {
    slug: 'vaas-kiezen', cat: 'Wonen', term: 'vaas', kadoly: 'vaas-kiezen', vanaf: '2026-11-10',
    title: 'Welke vaas past bij jouw bloemen?', h1: 'Vaas kiezen: glas of keramiek, verse bloemen of droogbloemen?',
    seoTitle: 'Keuzehulp vaas: glas of keramiek, vers of droog?', metaDesc: 'Verse bloemen, droogbloemen of leeg als decoratie? 3 vragen, onze keuze bij Kadoly en de vergelijking met de prijs van vandaag bij bol.',
    intro: 'Een mooie vaas die lekt, of een vaas die te smal is voor je boeket: dat gaat vaak mis. Wat erin komt, hoe groot hij is en van welk materiaal, bepalen welke past. Drie vragen.',
    kort: 'Voor verse bloemen is glas het veiligst: het houdt water en je ziet wanneer het ververst moet. Keramiek is niet altijd waterdicht; zet er dan een binnenvaas in. Riet, rotan en bananenvezel zijn voor droogbloemen. Kies de opening op het aantal stelen: smal voor een paar, breed voor een vol boeket.',
    questions: [
      { q: 'Wat komt erin?', options: [
        { label: 'Verse bloemen', term: 'glazen vaas', must: ['glas', 'glazen', 'vaas'] },
        { label: 'Droogbloemen of pampas', term: 'vaas droogbloemen', must: ['droogbloemen', 'pampas', 'rotan', 'riet', 'jute', 'vaas'] } ] },
      { q: 'Welk materiaal past bij je?', options: [
        { label: 'Glas', must: ['glas', 'glazen'] },
        { label: 'Keramiek of aardewerk', must: ['keramiek', 'keramische', 'aardewerk', 'stoneware', 'porselein'] },
        { label: 'Natuurlijk, riet of rotan', must: ['riet', 'rotan', 'bamboe', 'jute', 'zeegras', 'natuur'] } ] },
      { q: 'Wat wil je uitgeven?', options: [
        { label: 'Tot 30 euro', max: 30 },
        { label: 'Het mag meer zijn', min: 25 } ] } ],
    uitleg: 'Glas houdt water; keramiek is soms poreus en dan niet helemaal waterdicht, zeker als de binnenkant niet geglazuurd is. Zet in zo een vaas een glazen of plastic binnenvaas. Riet, rotan, jute en bananenvezel zijn alleen voor droogbloemen. Kies de opening op het aantal stelen: een smalle hals houdt een paar stelen rechtop, een brede opening is voor een vol boeket. Een veelgebruikte vuistregel is dat de bloemen ongeveer anderhalf keer zo hoog uitsteken als de vaas. Mondgeblazen glas hoort met de hand schoongemaakt te worden.',
    fouten: ['Verse bloemen in een keramische vaas zonder binnenvaas, zodat er een kring op de kast komt.', 'Een vaas met een te smalle hals voor een vol boeket.', 'Mondgeblazen glas in de vaatwasser.'],
    faq: [
      { q: 'Is een keramische vaas waterdicht?', a: 'Niet altijd. Is de binnenkant niet geglazuurd of zegt de maker dat hij poreus is, zet er dan een binnenvaas in.' },
      { q: 'Welke vaas voor droogbloemen?', a: 'Een vaas die geen water hoeft te houden, van riet, rotan, jute of keramiek. Pampas staat het mooist in een hoge vaas.' },
      { q: 'Hoe hoog moet een vaas zijn?', a: 'Een vuistregel: de bloemen steken ongeveer anderhalf keer zo hoog uit als de vaas.' } ],
    verwant: ['kamerplanten-thuis-kiezen', 'sierpot-orchidee-maat-kiezen', 'cadeau-voor-iemand-die-net-verhuisd-is', 'cadeau-schoonmoeder', 'lantaarn-binnen-kaars-kiezen'],
  },
  {
    slug: 'kerstdecoratie-kiezen', cat: 'Wonen', term: 'kerstdecoratie', kadoly: 'kerstdecoratie', vanaf: '2026-11-11',
    title: 'Welke kerstdecoratie past bij jouw huis?', h1: 'Kerstdecoratie kiezen: binnen, buiten of rond de kerstboom?',
    seoTitle: 'Keuzehulp kerstdecoratie: binnen, buiten of bij de boom?', metaDesc: 'Vensterbank, tuin of rond de kerstboom? 3 vragen, onze keuze bij Kadoly en de vergelijking met de prijs van vandaag bij bol.',
    intro: 'Decoratie die buiten na een week regen verkleurd is, of een boompje dat niet op de vensterbank past: dat gaat vaak mis. Waar het komt, welke stijl en wat je wilt uitgeven, bepalen wat past. Drie vragen.',
    kort: 'Voor buiten kies je iets waarvan de maker zegt dat het weerbestendig is, zoals cortenstaal of kunststof die voor buiten is gemaakt. Binnen kan bijna alles. Meet voor de vensterbank de breedte en de hoogte onder het raam. Rond de kerstboom werkt een boomrok of mand de standaard weg. Wil je lichtjes, kies led.',
    questions: [
      { q: 'Waar komt het?', options: [
        { label: 'Binnen, op vensterbank of kast', term: 'kerstdecoratie binnen', must: ['kerst', 'kerstdecoratie', 'kerstboom', 'decoratie'] },
        { label: 'Buiten, in de tuin of bij de voordeur', term: 'kerstdecoratie buiten', must: ['buiten', 'tuin', 'outdoor', 'weerbestendig'] },
        { label: 'Rond de kerstboom', term: 'kerstboomrok', must: ['kerstboomrok', 'boomrok', 'rok', 'mand'] } ] },
      { q: 'Welke stijl past bij je?', options: [
        { label: 'Landelijk en natuurlijk', must: ['hout', 'houten', 'natuur', 'jute', 'riet', 'zeegras', 'rustiek', 'roest', 'corten'] },
        { label: 'Glans en goud', must: ['goud', 'gouden', 'glitter', 'zilver', 'disco'] },
        { label: 'Winters, met sneeuw', must: ['sneeuw', 'besneeuwd', 'wit', 'witte', 'winter'] } ] },
      { q: 'Wat wil je uitgeven?', options: [
        { label: 'Tot 25 euro', max: 25 },
        { label: 'Het mag meer zijn', min: 20 } ] } ],
    uitleg: 'Kijk bij decoratie voor buiten of de maker buitengebruik of weerbestendigheid noemt; staat dat er niet, zet het dan binnen. Cortenstaal roest met opzet en kan roestwater geven op lichte tegels: zet het in de aarde of in een bak. Een boomrok moet om je standaard passen, dus meet de voet. Wil je lichtjes in een guirlande of rond de boom, gebruik led en houd brandende kaarsen minstens 30 cm van alles wat kan branden.',
    fouten: ['Binnendecoratie buiten in de regen zetten.', 'Cortenstaal op lichte tegels zonder iets eronder, zodat er roestvlekken komen.', 'Een kerstboompje of guirlande kopen zonder de plek te meten.'],
    faq: [
      { q: 'Welke kerstdecoratie kan buiten?', a: 'Alleen wat de maker voor buiten noemt, zoals cortenstaal of weerbestendige kunststof. Staat het er niet bij, zet het dan binnen.' },
      { q: 'Wat is een kerstboomrok?', a: 'Een rok of mand rond de voet van de kerstboom die de standaard verbergt. Meet eerst of je standaard erin past.' },
      { q: 'Wanneer zet je de kerstversiering neer?', a: 'Veel mensen in Nederland na Sinterklaas op 5 december, anderen bij de eerste advent, in 2026 op 29 november.' } ],
    verwant: ['kerstkrans-kiezen', 'kerstballen-set-kiezen', 'kerststal-kiezen', 'kerstboomstandaard-kiezen', 'kerstverlichting', 'kerstverlichting-buiten-zonne-energie'],
  },
  {
    slug: '3d-printer-kiezen-beginner', cat: 'Elektronica', term: '3d printer', vanaf: '2026-11-10',
    title: 'Welke 3D-printer past bij jou als beginner?', h1: '3D-printer kiezen voor beginners: open, dicht of meerkleurig?',
    seoTitle: 'Keuzehulp 3D-printer: welke past bij jou als beginner?', metaDesc: 'Bambu Lab A1, P2S of een dichte printer van Creality of Elegoo? 3 vragen en de passende 3D-printer met de prijs van vandaag bij bol.',
    intro: 'Een moderne 3D-printer kalibreert zichzelf en print binnen een uur na het uitpakken. Het verschil zit in hoe groot je print, of je meerdere kleuren wilt en of je sterkere materialen dan PLA wilt gebruiken. Drie vragen.',
    kort: 'Voor de meeste beginners is een open printer die zichzelf kalibreert genoeg, zoals de Bambu Lab A1 (25,6 cm) of de kleinere A1 mini (18 cm). Wil je ABS of ASA printen, of staat hij in de woonkamer, kies dan een dichte printer zoals de Bambu Lab P2S, Creality K1C of Elegoo Centauri Carbon. Voor meer kleuren neem je een combo met een kleurenunit voor 4 spoelen.',
    actueel: 'Black Friday is op 27 november 2026: 3D-printers en combo-sets gaan dan vaak in prijs omlaag. Vergelijk de prijs met die van vandaag.', actueelTot: '2026-11-30',
    questions: [
      { q: 'Hoeveel kleuren wil je printen?', options: [
        { label: 'Eén kleur is genoeg', must: ['3d printer', 'printer'] },
        { label: 'Meerdere kleuren in één print', term: '3d printer combo meerkleurig', must: ['combo', 'ams', 'multicolor', 'meerkleur', 'cfs', 'ace'] } ] },
      { q: 'Welke materialen wil je gebruiken?', options: [
        { label: 'Vooral PLA en PETG', must: ['pla', 'petg'] },
        { label: 'Ook ABS en ASA (sterk en hittebestendig)', must: ['enclosed', 'dicht', 'behuizing', 'gesloten', 'corexy', 'abs'] } ] },
      { q: 'Wat wil je uitgeven?', options: [
        { label: 'Tot 400 euro', max: 400 },
        { label: 'Meer dan 400 euro', min: 400 } ] } ],
    uitleg: 'Kijk eerst naar de printruimte: 18 cm (A1 mini) is genoeg voor sleutelhangers, houders en kleine onderdelen; met 25 tot 26 cm (A1, P1S, P2S, Centauri Carbon, Kobra S1) print je ook grotere dozen en organizers. Een open printer is prima voor PLA, maar ABS en ASA geven meer dampen en kromtrekken in de tocht: die print je in een dichte printer, liefst met filter, en zet je niet in de slaapkamer. Bijna alle huidige printers kalibreren zelf het bed en de trillingen, dat scheelt beginners veel mislukte prints. Meerdere kleuren werkt met een extra unit (bij Bambu AMS of AMS lite, bij Creality CFS, bij Anycubic ACE) voor 4 spoelen, uitbreidbaar bij de duurdere modellen. Reken op 20 tot 45 euro per kilo filament. Bambu Lab vraagt sinds 2025 een officiële autorisatie voor besturing op afstand; printen vanaf een SD-kaart en in de LAN-modus blijft mogelijk.',
    fouten: ['ABS of ASA printen op een open printer in een woonkamer of slaapkamer.', 'Een kleine printer kopen terwijl je organizers of cosplay-onderdelen wilt maken.', 'Vergeten dat meerkleurig printen meer afval en tijd kost door het wisselen van kleur.'],
    faq: [
      { q: 'Welke 3D-printer is het best voor beginners?', a: 'Een printer die zichzelf kalibreert, zoals de Bambu Lab A1 of A1 mini. Testers van Tom\'s Hardware noemen de A1 snel, stil en makkelijk. Wil je ook ABS printen, neem dan een dichte printer zoals de Bambu Lab P2S.' },
      { q: 'Wat is het verschil tussen de Bambu Lab A1, P1S en P2S?', a: 'De A1 is open (25,6 cm, voor PLA, PETG en TPU). De P1S en de nieuwere P2S zijn dicht en kunnen ook ABS en ASA aan; de P2S heeft een betere camera en de AMS 2 Pro voor meerdere kleuren.' },
      { q: 'Is een 3D-printer schadelijk binnenshuis?', a: 'PLA geeft weinig dampen, ABS en ASA meer. Print die in een dichte printer met filter en zet hem in een geventileerde ruimte, niet in de slaapkamer.' },
      { q: 'Wat kost filament?', a: 'Ongeveer 20 tot 45 euro per kilo voor PLA, afhankelijk van merk en kleur. Een kilo is genoeg voor tientallen kleine prints.' } ],
    verwant: ['laptop', 'cadeau-voor-techliefhebbers', 'knutselset', 'bouwset', 'cadeau-voor-iemand-die-alles-heeft'],
  },
  {
    slug: 'robotstofzuiger-met-station-roborock-dreame-ecovacs', cat: 'Huishouden', term: 'robotstofzuiger met station', vanaf: '2026-11-10',
    title: 'Roborock, Dreame of Ecovacs: welke robotstofzuiger met station past bij jou?', h1: 'Robotstofzuiger met station: Roborock, Dreame of Ecovacs kiezen',
    seoTitle: 'Keuzehulp robotstofzuiger met station: Roborock of Dreame?', metaDesc: 'Roborock Qrevo Edge 2 of Saros, Dreame X50 of X60, Ecovacs X12? 3 vragen en de passende robot met station, met de prijs van vandaag bij bol.',
    intro: 'Een robotstofzuiger met station leegt zichzelf, wast zijn dweilen en droogt ze. Roborock, Dreame en Ecovacs verkopen de meeste dure modellen. Het verschil zit in je vloer, de hoogte van je meubels en hoeveel je wilt uitgeven. Drie vragen.',
    kort: 'Voor de meeste huizen is een model rond 650 tot 1.000 euro genoeg, zoals de Roborock Qrevo Edge 2 Pro of de Ecovacs Deebot X12 OmniCyclone. Lage banken (onder 9 cm)? Kies een platte Roborock Saros (7,98 cm hoog). Veel drempels of hoogteverschillen? De Dreame X60 Pro Ultra neemt volgens Dreame tot 10 cm in twee stappen. Kijk niet blind naar het aantal Pa: Stiftung Warentest noemt dat vooral marketing.',
    actueel: 'Black Friday is op 27 november 2026. Robotstofzuigers met station dalen dan vaak flink in prijs; vergelijk met de prijs van vandaag.', actueelTot: '2026-11-30',
    questions: [
      { q: 'Wat voor vloer heb je vooral?', options: [
        { label: 'Vooral harde vloer', must: ['dweil', 'mop', 'dweilfunctie', 'zelfreinigend'] },
        { label: 'Veel tapijt of dierenhaar', must: ['huisdier', 'haar', 'tangle', 'tapijt', 'klit'] } ] },
      { q: 'Welk merk heeft je voorkeur?', options: [
        { label: 'Roborock', term: 'roborock robotstofzuiger station', must: ['roborock'] },
        { label: 'Dreame', term: 'dreame robotstofzuiger station', must: ['dreame'] },
        { label: 'Ecovacs', term: 'ecovacs deebot station', must: ['ecovacs', 'deebot'] },
        { label: 'Geen voorkeur', must: ['station', 'zelflegend', 'ultra', 'omni'] } ] },
      { q: 'Wat wil je uitgeven?', options: [
        { label: 'Tot 700 euro', max: 700 },
        { label: 'Meer dan 700 euro', min: 700 } ] } ],
    uitleg: 'Navigatie bepaalt het meest, zegt de Consumentenbond: alle modellen hier hebben laser of 3D-camera\'s en herkennen snoeren en sokken. Let daarna op drie dingen. De hoogte: de Roborock Saros 10R en Saros 20 zijn 7,98 cm hoog en hebben geen lidartoren, de Dreame X60 Pro Ultra is 8,9 cm (met sensor omhoog 11,1 cm), de Ecovacs X12 9,8 cm. Drempels: Roborock noemt voor de Saros 20 4,5 cm enkel, Dreame voor de X60 Pro Ultra 5,2 cm enkel en 10 cm in twee stappen, Ecovacs voor de X12 2,4 cm enkel. Het dweilen: roterende dweilen (Roborock, Dreame) of een rol (Ecovacs X12, 27 cm, wast zichzelf tijdens het dweilen). Het station heeft ruimte nodig, ongeveer 40 bij 45 bij 50 cm, plus een stopcontact. Prijzen op 10 november 2026: Roborock Qrevo Edge 2 Pro 649 euro bij Coolblue, Roborock Saros 20 adviesprijs 1.499 euro, Dreame X60 Pro Ultra Complete 1.499 euro, Ecovacs X12 OmniCyclone adviesprijs 1.249 euro.',
    fouten: ['Kiezen op het hoogste aantal Pa: dat zegt weinig over hoe schoon hij maakt.', 'Niet meten onder de bank: een robot van 9,8 cm komt niet onder een bank van 9 cm.', 'Geen plek voor het station rekenen, of het in een hoek zetten waar de robot niet bij kan.'],
    faq: [
      { q: 'Wat is beter, Roborock of Dreame?', a: 'Allebei zijn sterk. Roborock heeft met de Saros-serie de platste robots (7,98 cm), Dreame met de X60 Pro Ultra het meeste klimvermogen (tot 10 cm in twee stappen). Kies op je meubels en drempels, niet op het merk.' },
      { q: 'Is een robotstofzuiger met station de prijs waard?', a: 'Als je niet zelf wilt legen en dweilen wassen wel. Het station leegt de robot tot weken lang en wast de dweilen met heet water. Het neemt wel ruimte in en maakt het geheel duurder.' },
      { q: 'Hoeveel Pa zuigkracht heb je nodig?', a: 'Minder dan de reclame doet denken. Stiftung Warentest noemt een hoog aantal Pa vooral marketing. Navigatie, borstel en dweil bepalen meer.' },
      { q: 'Wanneer is Black Friday 2026?', a: 'Vrijdag 27 november 2026; Cyber Monday is 30 november.' } ],
    verwant: ['robotstofzuiger', 'dweilrobot', 'stofzuiger', 'dyson-stofzuiger-kiezen', 'black-friday-keukenapparaten'],
  },
];

// Uitgelicht op de voorpagina zolang de AI-planner niets zet (hjdk:kz:uitgelicht verloopt na 2 dagen). Per blok een looptijd.
export const UITGELICHT = [
  { van: '2026-11-01', tot: '2026-11-30', naam: 'Nat en donker op de fiets', waarom: 'Droog en zichtbaar blijven nu de dagen kort zijn en het vaak regent.', slugs: ['regenpak-fiets', 'waterdichte-overschoenen-fiets-regen', 'stormparaplu-en-regenpak-volwassenen-kiezen', 'wintertijd-fietslamp-donkere-avonden', 'fietstas-waterdicht'] },
  { van: '2026-11-01', tot: '2026-11-11', naam: 'Sint-Maarten op 11 november', waarom: 'Lampionnen en warme, droge kleding voor de avond zelf.', slugs: ['sint-maarten-lampion-kind', 'regenjas-kind', 'winterjas-kind', 'regenlaarzen-kind'] },
  { van: '2026-11-01', tot: '2026-12-15', naam: 'Eerste nachtvorst', waarom: 'Warm blijven en niet krabben in de ochtend.', slugs: ['voorruit-afdekhoes-vorst-kiezen', 'verwarmde-bodywarmer-jas-accu-kiezen', 'thermo-ondergoed', 'elektrische-deken', 'warmwaterkruik'] },
  { van: '2026-11-01', tot: '2026-12-05', naam: 'Sinterklaas', waarom: 'Cadeaus die op tijd binnen zijn.', slugs: ['lootjes-cadeau-sinterklaas-20-euro', 'sinterklaas-cadeau-man', 'sinterklaas-cadeau-vrouw-25-euro', '3d-houten-puzzel-bouwpakket-volwassenen', 'schoencadeautjes', 'sinterklaas-cadeau-8-12'] },
  { van: '2026-11-01', tot: '2026-12-24', naam: 'Sfeer in huis', waarom: 'Kaarslicht en lampen zonder snoer voor de donkere maanden.', slugs: ['kerstballen-set-kiezen', 'kerststal-kiezen', 'kerstkrans-kiezen', 'kerstdecoratie-kiezen', 'lantaarn-binnen-kaars-kiezen', 'oplaadbare-tafellamp-snoerloos-kiezen', 'sierpot-orchidee-maat-kiezen', 'kerstboomstandaard-kiezen', 'plaid'] },
];
