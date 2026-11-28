// Alles van een soort in de gids (10 nov 2026, Henkjan: "Zorg dat je zeker nog 200 producten van kadoly in de keuzehulpen zet").
// Per gids een filter op de producttitel uit de shopcatalogus (hjdk:shop:cat): elk beschikbaar product dat erbij past komt onder de
// handgeschreven keuze in een lijst "Alle ... bij Kadoly", met prijs inclusief btw en verzending en bezorgdag van vandaag. Nieuwe producten in de
// winkel komen er vanzelf bij. Geen eigen tekst per product: alleen wat de winkel opgeeft. Volgorde: kliks in deze gids (gk:p:<gids>), dan prijs.
// Nieuwe gids? Zet hier een regel bij (kop, re, optioneel uit en groepen [naam, regex]; eerste passende groep wint).
import { WONEN_ALLE } from './gidsen-wonen.js';
import { MEUBELS_ALLE } from './gidsen-meubels.js';
export const ALLE = {
  '3d-houten-puzzel-volwassenen': { kop: 'Alle 3D-puzzels en bouwpakketten', re: '3d|bouwpakket|bouwset|muziekdoos|book ?nook|boeknook',
    groepen: [['Boeknooks', 'book ?nook|boeknook'], ['Muziekdozen', 'muziekdoos|muziek'], ['Spaarpotten', 'spaarpot'], ['Voertuigen en wat beweegt', 'auto|trein|motor|vliegtuig|schip|boot|tractor|truck|beweg|mechani'], ['Dieren', 'dier|uil|kat\\b|hond|vogel|draak|dino|olifant|leeuw|vos\\b|wolf|beer|spin\\b']], rest: 'Overige bouwpakketten' },
  'houten-legpuzzel-volwassenen': { kop: 'Alle legpuzzels', re: 'puzzel', uit: '3d|bouw|muziekdoos|nook|krans|spaarpot',
    groepen: [['Wereldkaarten', 'wereldkaart|kaart'], ['Dieren', 'dier|schildpad|vos\\b|wolf|adelaar|uil|kat\\b|hond|vogel|vlinder|dino|t-rex|leeuw|olifant|paard']], rest: 'Overige puzzels' },
  'sierpot-orchidee': { kop: 'Alle sierpotten en bloempotten', re: 'sierpot|bloempot|plantenpot|\\bpot\\b|potten', uit: 'theepot|koffiepot|spaarpot|pottenbakker|orchidee .*(set|cadeau|mand)',
    groepen: [['Voor orchideeën', 'orchidee'], ['Voor buiten', 'buiten|tuin|cortenst'], ['Keramiek en terracotta', 'keramiek|keramische|terracotta|steengoed'], ['Groot', 'groot|grote|\\bxl\\b|vloer']], rest: 'Overige potten' },
  'orchidee-cadeau': { kop: 'Alle orchideeën en plantensets', re: 'orchidee|phalaenopsis',
    groepen: [['Verzorging en accessoires', 'voeding|watergeef|lont|wick|wenskaart|spray|plantenvoeding|stokje|clip'], ['Alleen een pot voor een orchidee', 'sierpot|pot voor|potje voor|voor orchidee'], ['Plantensets en cadeausets', 'set|cadeau|mand|doos|duo'], ['Orchideeën in een pot', 'orchidee|phalaenopsis']], rest: 'Overig' },
  'lantaarn-voor-binnen': { kop: 'Alle lantaarns, kandelaars en theelichthouders', re: 'lantaarn|windlicht|kandelaar|kaarshouder|kaarsenhouder|theelicht|waxine',
    groepen: [['Lantaarns en windlichten', 'lantaarn|windlicht'], ['Kandelaars en kaarsenhouders', 'kandelaar|kaarshouder|kaarsenhouder'], ['Theelicht- en waxinelichthouders', 'theelicht|waxine']], rest: 'Overig' },
  'oplaadbare-tafellamp': { kop: 'Alle lampen', re: 'lamp', uit: 'lampion',
    groepen: [['Oplaadbaar en snoerloos', 'oplaadba|draadloos|draadloze|snoerloos'], ['Zoutlampen', 'zoutlamp|zout'], ['Hanglampen', 'hanglamp'], ['Tafel-, bureau- en leeslampen', 'tafellamp|bureaulamp|leeslamp']], rest: 'Overige lampen' },
  'windspinner-tuin': { kop: 'Alle windspinners, windgongen en tuindecoratie', re: 'windspinner|windgong|tuinsteker|tuinbeeld|tuindecoratie',
    groepen: [['Windspinners', 'windspinner'], ['Windgongen', 'windgong'], ['Tuinstekers en tuinbeelden', 'tuinsteker|tuinbeeld|tuindecoratie']], rest: 'Overig' },
  'muursticker-kinderkamer': { kop: 'Alle muurstickers en kinderkamerdecoratie', re: 'muursticker|kinderkamer', groepen: [['Muurstickers', 'muursticker']], rest: 'Overig voor de kinderkamer' },
  'schoencadeautjes-sinterklaas': { kop: 'Alles voor Sinterklaas', re: 'sinterklaas|\\bsint\\b|\\bpiet\\b|schoenzet|pakjesavond' },
  'kerstballen-set': { kop: 'Alle kerstballen en kersthangers', re: 'kerstbal|kersthanger|kerstboomhanger|kerstornament|kerst.*ornament|ornament.*(kerst|boom)', uit: 'kerststal|plantenkolom|bloemenstandaard|ornamentontwerp|ornamentale',
    groepen: [['Kerstballen', 'kerstbal'], ['Hangers en ornamenten', 'hanger|ornament']], rest: 'Overig' },
  'alpaca-sokken': { kop: 'Alle sokken', re: 'sokken', groepen: [['Dames', 'dames|vrouw'], ['Heren', 'heren|\\bman'], ['Kinderen', 'kind']], rest: 'Overige sokken' },
  'vegan-handzeep': { kop: 'Alle zeep en handverzorging', re: 'zeep|handlotion|handcr' },
  'scheerset-cadeau': { kop: 'Alles voor scheren', re: 'scheer|baard' },
  'flatlay-achtergrond': { kop: 'Alle flatlay borden', re: 'flatlay|fotobord|achtergrondbord' },
  // 28 nov 2026: voor de concept-gidsen op zoekvraag (lib/gidsen-zoek.js). Pas zichtbaar als de gids live staat; tot dan alleen in het voorbeeld.
  'gouden-oorbellen': { kop: 'Alle oorbellen', re: 'oorbel|oorstek|oorknop|creool|creolen|\\bhoops?\\b', uit: 'houder|standaard|organizer',
    groepen: [['Met parels', 'parel'], ['Goud verguld en goudkleurig', 'goud|verguld|vermeil'], ['Zilver', 'zilver']], rest: 'Overige oorbellen' },
  'gouden-ketting-dames': { kop: 'Alle kettingen', re: 'ketting|collier|choker|chain', uit: 'armband|enkelband|sleutel|brillenkoord|telefoon|kerst',
    groepen: [['Goud verguld en goudkleurig', 'goud|verguld|vermeil'], ['Zilver', 'zilver'], ['Met parels', 'parel']], rest: 'Overige kettingen' },
  'zilveren-ketting': { kop: 'Alle zilveren kettingen', re: '(zilver|sterling).*(ketting|collier|chain)|(ketting|collier|chain).*(zilver|sterling)', uit: 'verguld|goudkleurig|armband|oorbel',
    groepen: [['Met hanger', 'hanger|kruis|solitaire|medaillon']], rest: 'Zonder hanger' },
  'parelketting': { kop: 'Alle sieraden met parels', re: 'parel', uit: 'parelmoer|moeder van parel|synthetisch',
    groepen: [['Kettingen', 'ketting|collier|choker|snoer'], ['Oorbellen', 'oorbel|oorstek|oorknop|creool|creolen|hoop'], ['Armbanden', 'armband'], ['Ringen', 'ring']], rest: 'Overig met parels' },
  'dienblad': { kop: 'Alle dienbladen en plateaus', re: 'dienblad|plateau|\\btray\\b',
    groepen: [['Hout en bamboe', 'hout|bamboe|mango'], ['Spiegel en metaal', 'spiegel|metaal|metalen|rvs|aluminium|goud']], rest: 'Overige dienbladen' },
  'hanglamp-eettafel': { kop: 'Alle hanglampen en lampenkappen', re: 'hanglamp|plafondlamp|lampenkap', uit: 'tafellamp|houten lamp',
    groepen: [['Riet, rotan en bamboe', 'riet|rotan|bamboe'], ['Zeegras, jute en raffia', 'zeegras|zeewier|jute|raffia|bananenvezel']], rest: 'Overige hanglampen' },
  'kerststal': { kop: 'Alle kerststallen', re: 'kerststal|kribbe' },
  'wollen-deken': { kop: 'Alle dekens en plaids', re: 'plaid|deken|blanket|bedloper|bed runner',
    groepen: [['Voor baby en ledikant', 'ledikant|baby'], ['Fleece', 'fleece'], ['Merino en kasjmier', 'merino|kasjmier|cashmere'], ['Bouclé', 'boucl'], ['Voor op bed', 'beddeken|dekbed|bedloper|bed runner'], ['Wol', 'wol|wollen'], ['Katoen', 'katoen']], rest: 'Overige dekens' },
  'kerstkrans': { kop: 'Alle kransen en adventsdecoratie', re: 'krans|advent', groepen: [['Advent', 'advent'], ['Kransen', 'krans']], rest: 'Overig' },
  'kerstdecoratie': { kop: 'Alle kerstdecoratie', re: 'kerst|christmas|weihnacht|xmas|rendier|\\belch\\b|sneeuwman|sneeuwvlok|engel|guirlande|slinger|boomrok|disco ?bal',
    uit: 'kerstbal|kerststal|krans|advent|tuinposter|lepel|servetring|onderbord|piekje|nook|model|laser|puzzel|sokken|deken|zoutlamp|seleniet|windgong|diffuser|cadeaubox met|lamp|monstera|serveerschaal|meditatie|engelwortel',
    groepen: [['Kerstboomrokken', 'boomrok'], ['Discoballen', 'disco'], ['Guirlandes en slingers', 'guirlande|slinger'], ['Kerststrikken', 'strik'], ['Hangers en ornamenten', 'ornament|hanger|hang|mobiel'], ['Kerstbomen om neer te zetten', 'kerstboom|boom'], ['Rendieren, engelen en sterren', 'rendier|elch|engel|ster|sneeuwman|sneeuwvlok|tuin|buiten']], rest: 'Overige kerstdecoratie' },
  'vaas-kiezen': { kop: 'Alle vazen', re: '\\bvaas|vaasje|vazen|\\bvase\\b',
    groepen: [['Glas', 'glas|glazen'], ['Keramiek en steengoed', 'keramiek|keramische|steengoed|aardewerk|porselein|terracotta'], ['Riet, rotan en bananenvezel (droogbloemen)', 'riet|rotan|bananenvezel|zeegras|raffia|geweven|waterhyacint|jute'], ['Metaal', 'metaal|metalen|messing|brons|cortenst|ijzer']], rest: 'Overige vazen' },
  'serviesset': { kop: 'Alle servies', re: 'servies|dinerbord|ontbijtbord|dessert ?bord|dinerteller|diepe? ?bord|soepkom|soepbord|dinerplaat|diepteplaat|\\bmok(ken)?\\b|koffiemok|brunch ?set|ontbijtset|kopjes', uit: 'servieskast|onderzetter|flatlay|mokkenrek|bekerhouder|speelgoed|muurcirkel|welkom',
    groepen: [['Complete sets', 'servies|delig|brunch ?set|ontbijtset'], ['Borden', 'bord|plaat'], ['Kommen', 'kom'], ['Mokken en kopjes', 'mok|kop']], rest: 'Overig servies' },
  'bloempot-binnen': { kop: 'Alle bloempotten en plantenbakken', re: 'bloempot|plantenpot|plantenbak', uit: 'orchidee|paddenstoelring',
    groepen: [['Voor binnen', 'binnen'], ['Op poten of standaard', 'poten|standaard|zuil|kolom|sokkel|säule'], ['Voor buiten en balkon', 'buiten|tuin|balkon|terras|cortenst'], ['Fiberstone', 'fiberstone']], rest: 'Overige potten' },
  'kaarsen-cadeau': { kop: 'Alle kaarsen en geurkaarsen', re: 'kaarsenset|geurkaars|dinerkaars|dip ?dye|kaarsen set|\\bkaars\\b', uit: 'houder|kandelaar|lantaarn|windlicht|halloween|kroonluchter',
    groepen: [['Zelf maken: geen gebruiksklare kaars', 'diy|zelf.*maken|maak.*zelf'], ['Geurkaarsen', 'geur'], ['Dinerkaarsen en kaarsensets', 'diner|dip ?dye|set']], rest: 'Overige kaarsen' },
  'houten-bureau-accessoires': { kop: 'Alle bureau accessoires', re: 'pennenhouder|penhouder|pennenbak|verzamelbak|bureau ?mat|bureaumat|bureau ?organi[sz]er|opbergpot voor bureau|hoofdtelefoonstandaard|koptelefoonstandaard|monsterset',
    uit: 'zit-sta|massief houten klassiek|tafelblad|laptop|monitor|oplaad|oplader|magsafe|sleeve|modulaire.*bureau.*organi|oakyblocks',
    groepen: [['Pennenhouders', 'pen'], ['Bakken en organizers', 'bak|organi|pot|lade'], ['Koptelefoonstandaards', 'telefoon'], ['Bureaumatten', 'mat']], rest: 'Overige bureau accessoires' },
  'tafelhaard': { kop:'Alle tafelhaarden en vuurpotten', re: 'tafelhaard|tafel ?haard|bio ?-?ethanol|vuurpot', uit: 'vuurschaal',
    groepen: [['Tafelhaarden', 'haard'], ['Vuurpotten', 'vuurpot']], rest: 'Overig' },
  'badset-cadeau': { kop: 'Alle badsets en verzorgingssets', re: 'badset|bad set|handverzorgingsset|rug ?scrubber|rugschrobber|badschuim|badolie|bath set',
    groepen: [['Badsets', 'badset|bad set|bath'], ['Handverzorgingssets', 'handverzorging'], ['Scrubbers', 'scrub|schrob']], rest: 'Overige sets' },
  'whisky-set-cadeau': { kop: 'Alle whiskysets, glazen en drinkbekers', re: 'whisk(e)?y|tumbler', uit: 'wijnkaraf|cocktail|polijst|sieraad|rotatie|machine|kaars|geur',
    groepen: [['Sets met karaf', 'karaf.*glazen|set.*karaf'], ['Losse karaffen', 'karaf'], ['Acrylaat drinkbekers', 'acryl'], ['Whiskyglazen', 'glas|glazen|tumbler']], rest: 'Overige whiskyspullen' },
};
Object.assign(ALLE, MEUBELS_ALLE); // eettafels en kasten (21 nov 2026)
Object.assign(ALLE, WONEN_ALLE); // manden en bijzettafels (21 nov 2026)
export const ALLE_MAX = 120;
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

// lijst voor een gids: { def, totaal, n, groepen: [{naam, items}], lijst } of null
export function alleVan(slug, keuzePids, cat, geleerd, thuis) {
  const d = ALLE[slug]; if (!d) return null;
  const re = new RegExp(d.re, 'i'), uit = d.uit ? new RegExp(d.uit, 'i') : null, inKeuze = new Set(keuzePids || []), L = geleerd || {};
  const alle = Object.values(cat || {}).filter(i => i && i.id && i.t && i.vr !== false && thuis(i) > 0 && !inKeuze.has(i.id) && re.test(i.t) && !(uit && uit.test(i.t)))
    .sort((a, b) => N(L[b.id]) - N(L[a.id]) || thuis(a) - thuis(b) || String(a.t).localeCompare(String(b.t), 'nl'));
  const lijst = alle.slice(0, ALLE_MAX);
  const groepen = (d.groepen || []).map(([naam, r]) => ({ naam, re: new RegExp(r, 'i'), items: [] })), rest = { naam: d.rest || 'Overig', items: [] };
  for (const i of lijst) (groepen.find(x => x.re.test(i.t)) || rest).items.push(i);
  const pr = alle.map(thuis);
  return { def: d, totaal: alle.length, n: lijst.length, van: pr.length ? Math.min(...pr) : 0, tot: pr.length ? Math.max(...pr) : 0, groepen: [...groepen, rest].filter(x => x.items.length).map(({ naam, items }) => ({ naam, items })), lijst };
}



