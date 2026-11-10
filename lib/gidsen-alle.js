// Alles van een soort in de gids (10 nov 2026, Henkjan: "Zorg dat je zeker nog 200 producten van kadoly in de keuzehulpen zet").
// Per gids een filter op de producttitel uit de shopcatalogus (hjdk:shop:cat): elk beschikbaar product dat erbij past komt onder de
// handgeschreven keuze in een lijst "Alle ... bij Kadoly", met prijs inclusief verzending en bezorgdag van vandaag. Nieuwe producten in de
// winkel komen er vanzelf bij. Geen eigen tekst per product: alleen wat de winkel opgeeft. Volgorde: kliks in deze gids (gk:p:<gids>), dan prijs.
// Nieuwe gids? Zet hier een regel bij (kop, re, optioneel uit en groepen [naam, regex]; eerste passende groep wint).
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
  'kerststal': { kop: 'Alle kerststallen', re: 'kerststal|kribbe' },
  'wollen-deken': { kop: 'Alle dekens en plaids', re: 'plaid|deken|blanket|bedloper|bed runner',
    groepen: [['Voor baby en ledikant', 'ledikant|baby'], ['Fleece', 'fleece'], ['Merino en kasjmier', 'merino|kasjmier|cashmere'], ['Bouclé', 'boucl'], ['Voor op bed', 'beddeken|dekbed|bedloper|bed runner'], ['Wol', 'wol|wollen'], ['Katoen', 'katoen']], rest: 'Overige dekens' },
  'kerstkrans': { kop: 'Alle kransen en adventsdecoratie', re: 'krans|advent', groepen: [['Advent', 'advent'], ['Kransen', 'krans']], rest: 'Overig' },
  'vaas-kiezen': { kop: 'Alle vazen', re: '\\bvaas|vaasje|vazen|\\bvase\\b',
    groepen: [['Glas', 'glas|glazen'], ['Keramiek en steengoed', 'keramiek|keramische|steengoed|aardewerk|porselein|terracotta'], ['Riet, rotan en bananenvezel (droogbloemen)', 'riet|rotan|bananenvezel|zeegras|raffia|geweven|waterhyacint|jute'], ['Metaal', 'metaal|metalen|messing|brons|cortenst|ijzer']], rest: 'Overige vazen' },
};
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
