// Beslisgidsen zonder producten voor keuzehulp.best (19 nov 2026, Henkjan: "Maak deze keuzehulpen als we nog niet hebben of update . En kijk met
// demandradar naar de te vullen gaten door ons mbt de LLMS . Dus wij gaan hier nu op scoren ."). Demand Radar vroeg een AI zonder internet om advies
// en kreeg op "zonnepanelen" (80.600 per maand) en "schoonmaakbedrijven" (18.100) een rij namen zonder eerste keus. Deze pagina's geven per situatie
// één eerste keus met bron en datum. Kopjes, pills en FAQ zoals mensen zoeken (Henkjan: "Als je hulp maakt is dat altijd door de pov vd gebruiker = dus zoek termen.").
// Elk cijfer komt van een pagina die op 19 november 2026 gelezen is; de bron staat erbij. Route: /api/keuze-tools?tool=dienstgids&g=<slug>.
import { lookNieuw } from './look.js';
import { kzuxBlok } from './kzux.js';

const GELEZEN = '19 november 2026';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- zonnepanelen ----------
const CB_TERUG = 'https://consumentenbond.nl/zonnepanelen/terugverdientijd-zonnepanelen';
const CB_KOPEN = 'https://www.consumentenbond.nl/zonnepanelen/zonnepanelen-kopen';
const CB_COLL = 'https://www.consumentenbond.nl/zonnepanelen/zonnepanelencollectief';
const RO_SALD = 'https://www.rijksoverheid.nl/onderwerpen/energie-thuis/salderingsregeling';
const BD_BTW = 'https://www.belastingdienst.nl/wps/wcm/connect/nl/btw/content/btw-terugvragen-voor-zonnepanelen-ik-ben-particulier';
const COOLBLUE = 'https://www.coolblue.nl/zonnepanelen';
const COOLBLUE_KOSTEN = 'https://coolblue.nl/en/solar-panels/advice/solar-panels-costs';
const ZONNEPLAN = 'https://www.zonneplan.nl/zonnepanelen/kopen/set-10-panelen/';
const OVERSTAPPEN_NOV = 'https://www.overstappen.nl/nieuws/dit-zijn-de-goedkoopste-energieleveranciers-in-november-2026/';

// Rekenkern terugverdientijd (draait op de server en in de browser). Aannames van de Consumentenbond (bijgewerkt 30 januari 2026) na 2027:
// terugleververgoeding € 0,059 en terugleverkosten € 0,051 per kWh, € 1.000 voor een nieuwe omvormer na 12 jaar. Met hun voorbeeld (€ 4.100,
// 3.700 kWh, 30% direct zelf verbruikt, € 0,24 per kWh) komt er 17,8 jaar uit, net als bij de Consumentenbond zonder salderen.
export function zonTerug(inv) {
  var k = Number(inv.k), o = Number(inv.o), e = Number(inv.e) / 100, p = Number(inv.p);
  if (!(k > 0 && k < 100000 && o > 0 && o < 100000 && e >= 0 && e <= 1 && p > 0 && p < 2)) return null;
  var VG = 0.059, TK = 0.051, OMV = 1000, zelf = o * e, terug = o - zelf, jaar = zelf * p + terug * (VG - TK);
  var eu = function (n, d) { return '€ ' + Number(n).toLocaleString('nl-NL', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var n0 = function (n) { return Math.round(n).toLocaleString('nl-NL'); };
  var tijd = jaar > 0 ? Math.round((k + OMV) / jaar * 10) / 10 : null;
  var h = '<p><strong>' + (tijd ? 'Terugverdientijd: ' + String(tijd).replace('.', ',') + ' jaar' : 'Met deze invoer verdien je de panelen niet terug') + '</strong></p>' +
    '<p>Je gebruikt ' + n0(zelf) + ' kWh zelf. Dat scheelt ' + eu(zelf * p) + ' per jaar. De ' + n0(terug) + ' kWh die je teruglevert brengt netto ' + eu(terug * (VG - TK)) + ' op (vergoeding € 0,059 min terugleverkosten € 0,051 per kWh). Samen ' + eu(jaar) + ' per jaar.</p>' +
    '<p>Kosten: ' + eu(k) + ' plus ' + eu(OMV) + ' voor een nieuwe omvormer na 12 jaar. ' + (tijd && tijd > 25 ? 'Dat is langer dan de 25 jaar die panelen gemiddeld meegaan: kies minder panelen of gebruik meer stroom overdag.' : 'Panelen gaan gemiddeld 25 jaar mee.') + '</p>';
  return { h: h, tijd: tijd, jaar: Math.round(jaar) };
}

const ZON = {
  slug: 'zonnepanelen', cat: 'Energie & wonen', term: 'zonnepanelen kopen', kicker: 'Zonnepanelen · Nederland',
  title: 'Zonnepanelen kopen in 2027: kosten, terugverdientijd, advies',
  h1: 'Zonnepanelen kopen: wat kosten ze en verdien je ze na 2027 nog terug?',
  desc: 'Zonnepanelen kopen na het einde van salderen? 10 panelen kosten rond € 4.100 en verdien je in 17,8 jaar terug. Eerste keus per situatie, met rekenhulp.',
  kort: 'Eerste keus: koop zonnepanelen als je een eigen huis met een schuin dak hebt en overdag veel stroom gebruikt, en vraag offertes bij een installateur uit de buurt en bij een landelijke partij als Coolblue of Zonneplan. 10 panelen kosten rond € 4.100 inclusief installatie, zonder btw (Consumentenbond). Salderen stopt op 1 januari 2027; met 30% eigen verbruik verdien je ze daarna in 17,8 jaar terug, en panelen gaan gemiddeld 25 jaar mee (Rijksoverheid). Ben je overdag weinig thuis, neem dan minder panelen.',
  keusKop: 'Zonnepanelen kopen of niet? Eerste keus per situatie',
  keus: [
    ['Eigen huis, schuin dak, overdag veel stroom (thuiswerk, warmtepomp, elektrische auto)', 'Nu kopen: ongeveer 10 panelen, offertes van minstens twee installateurs', 'Elke kWh die je zelf gebruikt scheelt € 0,24; een teruggeleverde kWh levert na 2027 netto maar € 0,008 op. Hoe meer je zelf gebruikt, hoe sneller terugverdiend.', 'Consumentenbond, 30 januari 2026', CB_TERUG],
    ['Eigen huis, overdag niemand thuis', 'Minder panelen, afgestemd op wat je zelf gebruikt', 'Met 20% eigen verbruik kom je met de cijfers van de Consumentenbond op 25,3 jaar terugverdientijd, langer dan de 25 jaar dat panelen meegaan. Met 50% op 11,1 jaar.', 'Onze rekensom met de cijfers van de Consumentenbond', CB_TERUG],
    ['Plat dak', 'Reken met hogere kosten', 'Op een plat dak kosten 10 panelen € 4.800 (parallel) tot € 5.000 (serie); de terugverdientijd is dan 19,3 tot 20,0 jaar.', 'Consumentenbond, 30 januari 2026', CB_TERUG],
    ['Je hebt al zonnepanelen', 'Energiedirect 1 jaar vast, € 224,12 per maand', 'Goedkoopste vaste contract met zonnepanelen in de lijst van 3 november 2026. Na een jaar kies je opnieuw met de regels van na salderen.', 'Overstappen.nl, 3 november 2026', OVERSTAPPEN_NOV],
    ['Je wilt je eigen stroom bewaren voor de avond', 'Eerst een batterij met stekker vergelijken', 'Een batterij verhoogt je eigen verbruik. Vergelijk modellen en reken het na op onze pagina over de stekkerbatterij.', 'keuzehulp.best/stekkerbatterij', '/stekkerbatterij']
  ],
  secties: [
    ['kosten', 'Wat kosten zonnepanelen in 2026?', ['Een gemiddelde installatie met 10 zonnepanelen kost ongeveer € 4.100, zegt de Consumentenbond. Minder dan 5 panelen is relatief duur. Met in serie geschakelde panelen reken je € 4.300, op een plat dak € 4.800 tot € 5.000. Reken ook € 1.000 voor een nieuwe omvormer na 12 jaar.', 'Coolblue noemde voor 10 panelen € 4.408 tot € 5.714 inclusief installatie (prijzen 2025). Zonneplan verkoopt een set van 10 panelen van 475 Wp met 10 jaar all-in garantie via het Zonneplan Serviceplan.', 'Btw: volgens de Belastingdienst is het tarief 0% als de panelen op of bij je woning worden geleverd en geïnstalleerd. Je betaalt dus geen btw en kunt ook niets terugvragen.']],
    ['terugverdientijd', 'Zonnepanelen terugverdientijd na 2027', ['De Consumentenbond rekende met 10 panelen op een schuin dak die 3.700 kWh per jaar opwekken, waarvan 30% direct zelf verbruikt. Met de cijfers van 2026 erbij duurt terugverdienen 16,8 jaar; als salderen helemaal weg is en de tarieven blijven zoals nu 17,8 jaar.', 'Na 2027 is de gemiddelde terugleververgoeding € 0,059 per kWh en de gemiddelde terugleverkosten € 0,051 per kWh. Wat je teruglevert levert dus bijna niets op. Wat telt is hoeveel stroom je zelf direct gebruikt.']],
    ['salderen', 'Salderingsregeling stopt op 1 januari 2027: wat betekent dat?', ['De Rijksoverheid: de salderingsregeling stopt vanaf 1 januari 2027. Voor alle stroom die je teruglevert krijg je een vergoeding van je energieleverancier. Tot 2030 moet die minimaal 50% van het kale leveringstarief zijn (het tarief zonder belastingen).', 'Leveranciers mogen terugleverkosten rekenen, alleen voor kosten die ze echt maken; de ACM houdt toezicht. Zonnepanelen gaan gemiddeld 25 jaar mee en verdienen zich volgens de Rijksoverheid ruim binnen die tijd terug.']],
    ['offerte', 'Zonnepanelen offerte vergelijken: waar let je op?', ['Kijk niet alleen naar de prijs. Vergelijk welk voorstel het meest doordacht is en met welke opbrengst de installateur rekent. Kijk of een extra groep in de meterkast al in de prijs zit, welke garantie je krijgt op de panelen en op de installatie, en bij wie je terecht kunt als er iets misgaat (Consumentenbond).', 'Laat de panelen leggen door een vakkundige installateur, voor de aarding en de veiligheid. Na de installatie meld je bij energieleveren.nl dat je stroom teruglevert; dat is wettelijk verplicht.']],
    ['waar-kopen', 'Waar kun je zonnepanelen kopen?', ['Bij een installateur uit de buurt, bij Coolblue (installatie door Hoppenbrouwers, met glas-glas panelen) of bij Zonneplan (set van 10 panelen met 10 jaar all-in garantie). De Consumentenbond heeft een Zonnepanelen Collectief via homeQgo met gecertificeerde installateurs, een aanbetaling van € 29 die je na installatie terugkrijgt en een installatie 8 tot 16 weken na akkoord.', 'Vraag bij minstens twee aanbieders een offerte op met hetzelfde aantal panelen en dezelfde opbrengst, en leg ze naast elkaar met de rekenhulp hieronder.']]
  ],
  faq: [
    ['Waar kun je het beste zonnepanelen kopen in Nederland?', 'Onze eerste keus: vraag een offerte bij een installateur uit de buurt en bij een landelijke partij als Coolblue (installatie door Hoppenbrouwers) of Zonneplan (10 jaar all-in garantie), en kies op garantie, opbrengstberekening en prijs. 10 panelen kosten rond € 4.100 inclusief installatie (Consumentenbond). Koop alleen als je een eigen huis met een geschikt dak hebt en overdag een flink deel van de stroom zelf gebruikt: na 1 januari 2027 levert teruggeleverde stroom netto bijna niets op. Ben je overdag weg, neem dan minder panelen. Heb je al panelen, kijk dan naar je energiecontract (Energiedirect 1 jaar vast was op 3 november 2026 het goedkoopst met zonnepanelen).'],
    ['Wat kosten 10 zonnepanelen?', 'Ongeveer € 4.100 inclusief installatie op een schuin dak, volgens de Consumentenbond. Op een plat dak € 4.800 tot € 5.000. Coolblue noemde € 4.408 tot € 5.714 (prijzen 2025). Er zit geen btw op zonnepanelen op of bij je woning.'],
    ['Zijn zonnepanelen nog rendabel na 2027?', 'Ja, als je een groot deel van de stroom zelf gebruikt. Met 30% eigen verbruik verdien je 10 panelen in 17,8 jaar terug (Consumentenbond), en panelen gaan gemiddeld 25 jaar mee (Rijksoverheid). Met 20% eigen verbruik duurt het met dezelfde cijfers 25,3 jaar, met 50% 11,1 jaar.'],
    ['Wat is de terugverdientijd van zonnepanelen?', 'Bij de Consumentenbond 16,8 jaar voor 10 panelen op een schuin dak, met 2026 nog met salderen. Zonder salderen 17,8 jaar. Reken je eigen situatie uit met de rekenhulp op deze pagina.'],
    ['Wanneer stopt de salderingsregeling?', 'Op 1 januari 2027. Daarna krijg je voor teruggeleverde stroom een vergoeding van je leverancier: tot 2030 minimaal 50% van het kale leveringstarief (Rijksoverheid).'],
    ['Wat krijg je na 2027 voor teruggeleverde stroom?', 'Gemiddeld € 0,059 per kWh, terwijl de gemiddelde terugleverkosten € 0,051 per kWh zijn (Consumentenbond). Netto blijft er per kWh dus bijna niets over.'],
    ['Betaal je btw op zonnepanelen?', 'Nee. Het btw-tarief is 0% als de panelen op of bij je woning worden geleverd en geïnstalleerd. Je kunt dus ook geen btw terugvragen (Belastingdienst).'],
    ['Moet je zonnepanelen aanmelden?', 'Ja. Meld bij energieleveren.nl dat je stroom gaat terugleveren; dat is wettelijk verplicht (Consumentenbond).']
  ],
  bronnen: [
    ['Consumentenbond: terugverdientijd zonnepanelen (bijgewerkt 30 januari 2026)', CB_TERUG], ['Consumentenbond: zonnepanelen kopen', CB_KOPEN], ['Consumentenbond: Zonnepanelen Collectief', CB_COLL],
    ['Rijksoverheid: salderingsregeling', RO_SALD], ['Belastingdienst: btw en zonnepanelen voor particulieren', BD_BTW],
    ['Coolblue: zonnepanelen', COOLBLUE], ['Coolblue: kosten zonnepanelen (prijzen 2025)', COOLBLUE_KOSTEN], ['Zonneplan: set van 10 zonnepanelen', ZONNEPLAN],
    ['Overstappen.nl: goedkoopste energieleveranciers november 2026', OVERSTAPPEN_NOV]
  ],
  verder: [['Goedkoopste energiecontract met zonnepanelen', '/energieleverancier-vergelijken'], ['Stekkerbatterij kiezen', '/stekkerbatterij'], ['Thuisbatterij kiezen', '/thuisbatterij']],
  reken: {
    id: 'zon', kop: 'Zonnepanelen terugverdientijd berekenen', fn: zonTerug,
    tekst: 'Vul de prijs en de opbrengst uit je offerte in. We rekenen met de cijfers van de Consumentenbond voor na 2027.',
    velden: [['k', 'Prijs van de offerte, inclusief installatie (€)', 4100, 1, 100000, 1], ['o', 'Opbrengst per jaar volgens de offerte (kWh)', 3700, 1, 100000, 1], ['e', 'Deel dat je direct zelf gebruikt (%)', 30, 0, 100, 1], ['p', 'Wat je per kWh betaalt (€)', 0.24, 0.01, 2, 0.01]],
    tabel: { kop: 'Terugverdientijd van 10 panelen (€ 4.100, 3.700 kWh)', kol: ['Zelf verbruikt', 'Bij € 0,24 per kWh', 'Bij € 0,35 per kWh'], rijen: [20, 30, 50, 70].map(e => [e + '%', { k: 4100, o: 3700, e, p: 0.24 }, { k: 4100, o: 3700, e, p: 0.35 }]) },
    chat: {
      wat: 'zonnepanelen', tot: 4, voortg: '{n} van {t} klaar', ph: 'Of typ je vraag over zonnepanelen',
      st: [
        { f: 'k', v: 'Wat kost de offerte, inclusief installatie?', p: [3000, 4100, 5000, 6000].map(n => ['€ ' + n.toLocaleString('nl-NL'), String(n)]), ander: { l: 'Ander bedrag', ph: 'Bijvoorbeeld 4500', voor: '€ ', min: 100, max: 100000 } },
        { f: 'o', v: 'Hoeveel kWh per jaar staat in de offerte?', p: [2000, 3000, 3700, 4500].map(n => [n.toLocaleString('nl-NL') + ' kWh', String(n)]), ander: { l: 'Ander aantal', ph: 'Bijvoorbeeld 3200', min: 100, max: 100000, na: ' kWh' } },
        { f: 'e', v: 'Hoeveel van die stroom gebruik je direct zelf?', p: [['Weinig, overdag niemand thuis (20%)', '20'], ['Gemiddeld (30%)', '30'], ['Veel: thuiswerk, warmtepomp of auto (50%)', '50']] },
        { f: 'p', v: 'Wat betaal je per kWh, alles inbegrepen?', p: [['€ 0,24 (Consumentenbond)', '0.24'], ['€ 0,30', '0.30'], ['€ 0,35', '0.35']], ander: { l: 'Ander tarief', ph: 'Bijvoorbeeld 0,32', voor: '€ ', min: 0.01, max: 2 } }
      ],
      na: [{ l: 'Goedkoopste energiecontract met zonnepanelen', s: 'link', href: '/energieleverancier-vergelijken' }, { l: 'Batterij erbij?', s: 'link', href: '/stekkerbatterij' }, { l: 'Alles zelf invullen', s: 'zelf' }]
    }
  }
};

// ---------- schoonmaakbedrijf ----------
const RO_DAH = 'https://www.rijksoverheid.nl/onderwerpen/dienstverlening-aan-huis/vraag-en-antwoord/ik-huur-iemand-in-voor-huishoudelijk-werk.-wat-kan-ik-afspreken';
const RO_WML = 'https://www.rijksoverheid.nl/themas/werk/minimumloon/bedragen-minimumloon/bedragen-minimumloon-2026';
const TRUSTOO = 'https://trustoo.nl/kosten/schoonmaakbedrijf-kosten/';
const TRUSTOO_TOP = 'https://trustoo.nl/nederland/schoonmaakbedrijf';
const HELPLING_TP = 'https://se.trustpilot.com/review/helpling.nl';
const CAO = 'https://www.salarisvanmorgen.nl/2026/09/15/cao-schoonmaak-en-glazenwassersbranche-van-1-juli-2026-tot-1-juli-2028-afgesloten/';
const KEURMERK = 'https://careers.kiwa.com/globalassets/dam/kiwa-netherlands/downloads/de-7-zekerheden-van-keurmerk-schoon.pdf';
const KIWA = 'https://www.kiwa.com/nl-be/nl/diensten/certificering/keurmerk-schoon/';
const TOP50 = 'https://www.consultancy.nl/nieuws/12338/de-top-50-grootste-schoonmaakbedrijven-van-nederland';

// Rekenkern: wat kost een schoonmaker per maand. Zelf inhuren (Regeling dienstverlening aan huis, Rijksoverheid): minimaal minimumloon plus 8%
// vakantiegeld, en je betaalt door bij vakantie (4 keer de uren per week), dus 52 weken per jaar. Bedrijf of platform: het uurtarief, 52 weken.
export function schoonKosten(inv) {
  var u = Number(inv.u), t = Number(inv.t), zelf = String(inv.m) === 'zelf';
  if (!(u > 0 && u <= 60 && t > 0 && t < 200)) return null;
  var eu = function (n) { return '€ ' + Number(n).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var uur = zelf ? t * 1.08 : t, week = u * uur, maand = week * 52 / 12;
  var laag = zelf && t < 14.99;
  var h = '<p><strong>Ongeveer ' + eu(maand) + ' per maand</strong> (' + eu(week) + ' per week voor ' + String(u).replace('.', ',') + ' uur).</p>' +
    (zelf ? '<p>Zelf inhuren: ' + eu(t) + ' per uur plus 8% vakantiegeld is ' + eu(uur) + ' per uur. Je betaalt ook door bij 4 weken vakantie en bij ziekte tot 6 weken, dus we rekenen met 52 weken.' + (laag ? ' Let op: dit is minder dan het minimumloon van € 14,99 bruto per uur (vanaf 1 juli 2026).' : '') + '</p>'
      : '<p>Via een bedrijf of platform betaal je alleen het uurtarief; vakantie en ziekte regelt het bedrijf. We rekenen met 52 weken; sla je weken over, dan betaal je minder.</p>');
  return { h: h, maand: Math.round(maand) };
}

const SCHOON = {
  slug: 'schoonmaakbedrijf', cat: 'Huishouden', term: 'schoonmaakbedrijf inhuren', kicker: 'Schoonmaak · Nederland',
  title: 'Schoonmaakbedrijf inhuren: wat kost een schoonmaker per uur?',
  h1: 'Schoonmaker of schoonmaakbedrijf inhuren: wie kies je en wat kost het?',
  desc: 'Een schoonmaker aan huis kost € 17 tot € 25 per uur, een schoonmaakbedrijf € 25 tot € 35. Eerste keus voor thuis en zakelijk, met rekenhulp.',
  kort: 'Eerste keus voor thuis: huur zelf een vaste schoonmaker in via de Regeling dienstverlening aan huis, voor minimaal € 14,99 bruto per uur plus 8% vakantiegeld (minimumloon vanaf 1 juli 2026). Wil je niet zelf zoeken en regelen, boek dan via Helpling (4,1 op Trustpilot uit 1.434 reviews). Voor een kantoor: een schoonmaakbedrijf met Keurmerk Schoon, voor € 20 tot € 35 per uur per schoonmaker (Trustoo, 3 november 2026).',
  keusKop: 'Schoonmaker inhuren: eerste keus per situatie',
  keus: [
    ['Thuis, elke week een paar uur', 'Zelf een vaste schoonmaker inhuren', 'Werkt die minder dan 4 dagen per week bij jou, dan val je onder de Regeling dienstverlening aan huis: minimaal minimumloon (€ 14,99 bruto per uur vanaf 1 juli 2026) plus 8% vakantiegeld, doorbetalen bij vakantie en bij ziekte tot 6 weken. Verder hoef je niets te regelen met de Belastingdienst.', 'Rijksoverheid, gelezen ' + GELEZEN, RO_DAH],
    ['Thuis, je wilt niet zelf zoeken of regelen', 'Helpling', 'Platform waar je een schoonmaker boekt. 4,1 uit 5 op Trustpilot, uit 1.434 reviews. Een huishoudelijke hulp kost gemiddeld € 17 tot € 25 per uur.', 'Trustpilot en Trustoo, gelezen ' + GELEZEN, HELPLING_TP],
    ['Eenmalig: verhuizing, oplevering of grote schoonmaak', 'Een schoonmaakbedrijf, offertes via Trustoo of Werkspot', 'Een schoonmaakbedrijf rekent gemiddeld € 25 tot € 35 per uur. Vraag een prijs voor de hele klus.', 'Trustoo, 3 november 2026', TRUSTOO],
    ['Kantoor, winkel of praktijk', 'Een schoonmaakbedrijf met Keurmerk Schoon', 'Het keurmerk van Schoonmakend Nederland: het bedrijf past de cao schoonmaak juist toe, heeft de administratie op orde en wordt jaarlijks getoetst. Reguliere schoonmaak van een bedrijfsruimte kost € 20 tot € 35 per uur per schoonmaker.', 'Schoonmakend Nederland (Kiwa) en Trustoo', KEURMERK],
    ['Meerdere vestigingen of een groot gebouw', 'Een landelijk bedrijf: Hago, CSU, ISS, Asito of Gom', 'Dat waren de vijf grootste in de laatste openbare top 50 van schoonmaakbedrijven (cijfers 2015). Vraag er twee of drie om een offerte op hetzelfde bestek.', 'Consultancy.nl, 2 mei 2016', TOP50],
    ['Je woont in Rotterdam', 'Kies uit de schoonmaakbedrijven bij jou in de buurt', 'Onze lijst met schoonmaakbedrijven in Rotterdam, met wie nu open is en de score.', 'keuzehulp.best/rotterdam', '/rotterdam/schoonmaakbedrijf']
  ],
  secties: [
    ['kosten', 'Wat kost een schoonmaker per uur?', ['Volgens Trustoo (bijgewerkt 3 november 2026) ligt het tarief van een schoonmaker gemiddeld tussen € 20 en € 30 per uur, met uitschieters van € 15 tot € 45. Een huishoudelijke hulp aan huis kost € 17 tot € 25 per uur, een schoonmaakbedrijf € 25 tot € 35. Reguliere kantoorschoonmaak kost € 20 tot € 35 per uur per schoonmaker.', 'Huur je zelf iemand in, dan betaal je minimaal het minimumloon: € 14,99 bruto per uur voor 21 jaar en ouder vanaf 1 juli 2026 (Rijksoverheid), plus 8% vakantiegeld.']],
    ['regeling', 'Regeling dienstverlening aan huis: zo huur je zelf een schoonmaker in', ['Je valt onder de regeling als je als particulier iemand inhuurt voor huishoudelijk werk in en om het huis, voor minder dan 4 dagen per week. Het aantal uren per dag maakt niet uit.', 'Je betaalt minimaal het minimumloon en 8% vakantiegeld, je betaalt door bij vakantie (4 keer het aantal werkuren per week) en bij ziekte tot 6 weken, en je zorgt voor een veilige werkplek. Je hoeft verder niets te regelen met de Belastingdienst (Rijksoverheid).']],
    ['zakelijk', 'Schoonmaakbedrijf voor kantoor kiezen: waar let je op?', ['Vraag naar Keurmerk Schoon van Schoonmakend Nederland. Een bedrijf met dat keurmerk past de cao schoonmaak juist toe, heeft de financiële en personele administratie op orde, investeert in de vakbekwaamheid van zijn mensen en komt zijn contracten na; een onafhankelijke instantie (Kiwa) toetst dat elk jaar.', 'De cao schoonmaak- en glazenwassersbedrijf loopt van 1 juli 2026 tot 30 juni 2028: 3,1% erbij op 1 januari 2027 en 3% op 1 januari 2028. Loongroep 1 start per 1 januari 2027 op € 16 per uur. Een offerte ver onder dat loon plus de kosten van het bedrijf is een waarschuwing.']],
    ['vergelijken', 'Schoonmaakbedrijven vergelijken', ['Vraag minstens twee offertes op hetzelfde werk: welke ruimtes, hoe vaak, hoeveel uur, wie de middelen meeneemt en wat er gebeurt bij ziekte. Trustoo en Werkspot zetten bedrijven bij jou in de buurt op een rij. Voor grote panden doen Hago, CSU, ISS, Asito en Gom mee.']]
  ],
  faq: [
    ['Welk schoonmaakbedrijf kun je het beste inhuren?', 'Voor thuis is onze eerste keus zelf een vaste schoonmaker inhuren via de Regeling dienstverlening aan huis: minimaal € 14,99 bruto per uur plus 8% vakantiegeld, en verder niets te regelen met de Belastingdienst (Rijksoverheid). Wil je niet zelf zoeken, boek dan via Helpling (4,1 op Trustpilot uit 1.434 reviews); een huishoudelijke hulp kost gemiddeld € 17 tot € 25 per uur. Voor een eenmalige klus vraag je offertes via Trustoo of Werkspot. Voor een kantoor kies je een schoonmaakbedrijf met Keurmerk Schoon, voor € 20 tot € 35 per uur per schoonmaker; bij meerdere vestigingen een landelijk bedrijf als Hago, CSU, ISS, Asito of Gom.'],
    ['Wat kost een schoonmaker per uur?', 'Gemiddeld € 20 tot € 30 per uur. Een huishoudelijke hulp aan huis € 17 tot € 25, een schoonmaakbedrijf € 25 tot € 35 (Trustoo, 3 november 2026). Zelf inhuren kan vanaf het minimumloon: € 14,99 bruto per uur plus 8% vakantiegeld.'],
    ['Wat is de Regeling dienstverlening aan huis?', 'Als particulier mag je iemand minder dan 4 dagen per week inhuren voor huishoudelijk werk zonder dat je werkgever wordt voor de Belastingdienst. Je betaalt minimaal het minimumloon plus 8% vakantiegeld, en door bij vakantie en bij ziekte tot 6 weken (Rijksoverheid).'],
    ['Wat kost een schoonmaker per maand?', 'Bij 3 uur per week en het minimumloon met vakantiegeld ongeveer € 210 per maand. Via een bedrijf van € 30 per uur ongeveer € 390. Reken je eigen uren uit met de rekenhulp op deze pagina.'],
    ['Wat kost kantoorschoonmaak?', 'Reguliere schoonmaak van een bedrijfsruimte kost € 20 tot € 35 per uur per schoonmaker (Trustoo). De cao-lonen gaan op 1 januari 2027 met 3,1% omhoog.'],
    ['Wat is Keurmerk Schoon?', 'Het keurmerk van Schoonmakend Nederland. Het bedrijf past de cao schoonmaak juist toe, heeft zijn administratie op orde en wordt jaarlijks getoetst door een onafhankelijke instantie.'],
    ['Schoonmaakbedrijf of zelf iemand inhuren?', 'Zelf inhuren is goedkoper per uur, maar je regelt vervanging zelf en betaalt door bij vakantie en ziekte. Een bedrijf of platform is duurder per uur en regelt dat voor je.']
  ],
  bronnen: [
    ['Rijksoverheid: iemand inhuren voor huishoudelijk werk (gewijzigd 28 augustus 2026)', RO_DAH], ['Rijksoverheid: bedragen minimumloon 2026', RO_WML],
    ['Trustoo: wat kost een schoonmaker in 2026 (3 november 2026)', TRUSTOO], ['Trustoo: schoonmaakbedrijven in Nederland', TRUSTOO_TOP], ['Trustpilot: Helpling.nl', HELPLING_TP],
    ['Salaris van Morgen: cao schoonmaak 2026 tot 2028 (15 september 2026)', CAO], ['Kiwa: de zekerheden van Keurmerk Schoon', KEURMERK], ['Kiwa: Keurmerk Schoon', KIWA],
    ['Consultancy.nl: top 50 grootste schoonmaakbedrijven (2016)', TOP50]
  ],
  verder: [['Schoonmaakbedrijven in Rotterdam', '/rotterdam/schoonmaakbedrijf'], ['Robotstofzuiger met station kiezen', '/robotstofzuiger-met-station-roborock-dreame-ecovacs']],
  reken: {
    id: 'schoon', kop: 'Wat kost een schoonmaker per maand?', fn: schoonKosten,
    tekst: 'Kies hoeveel uur per week en hoe je iemand inhuurt.',
    velden: [['u', 'Uren per week', 3, 0.5, 60, 0.5], ['t', 'Uurtarief (€)', 14.99, 1, 200, 0.01], ['m', 'Zelf inhuren (zelf) of via bedrijf (bedrijf)', 'zelf']],
    tabel: { kop: 'Kosten per maand bij 52 weken', kol: ['Uren per week', 'Zelf, minimumloon € 14,99', 'Bedrijf € 25 per uur', 'Bedrijf € 35 per uur'], rijen: [2, 3, 4].map(u => [u + ' uur', { u, t: 14.99, m: 'zelf' }, { u, t: 25, m: 'bedrijf' }, { u, t: 35, m: 'bedrijf' }]) },
    chat: {
      wat: 'schoonmaak', tot: 3, voortg: '{n} van {t} klaar', ph: 'Of typ je vraag over schoonmaak',
      st: [
        { f: 'u', v: 'Hoeveel uur per week wil je schoonmaak?', p: [2, 3, 4, 6].map(n => [n + ' uur', String(n)]), ander: { l: 'Ander aantal', ph: 'Bijvoorbeeld 5', min: 0.5, max: 60, na: ' uur' } },
        { f: 'm', v: 'Hoe huur je iemand in?', p: [['Zelf een schoonmaker inhuren', 'zelf'], ['Via Helpling of een schoonmaakbedrijf', 'bedrijf']] },
        { f: 't', v: 'Welk uurtarief?', p: [['€ 14,99 (minimumloon)', '14.99'], ['€ 18', '18'], ['€ 25', '25'], ['€ 35', '35']], ander: { l: 'Ander tarief', ph: 'Bijvoorbeeld 22', voor: '€ ', min: 1, max: 200 } }
      ],
      na: [{ l: 'Schoonmaakbedrijven in Rotterdam', s: 'link', href: '/rotterdam/schoonmaakbedrijf' }, { l: 'Alles zelf invullen', s: 'zelf' }]
    }
  }
};

export const DIENSTGIDSEN = { zonnepanelen: ZON };
export const _SCHOON = SCHOON;
const DATUM = '2026-11-19';

export function dienstItems() {
  return Object.values(DIENSTGIDSEN).map(g => ({ slug: g.slug, title: g.title, h1: g.h1, seoTitle: g.title, metaDesc: g.desc, cat: g.cat, term: g.term, intro: g.kort, kort: g.kort,
    questions: [{ q: 'Wat is jouw situatie?', options: g.keus.map(k => ({ label: k[0] })) }],
    uitleg: g.keus.map(k => k[0] + ': ' + k[1] + '. ' + k[2] + ' (' + k[3] + ')').join('\n') + '\n\n' + g.secties.map(([, h, ps]) => h + ': ' + ps.join(' ')).join('\n\n'),
    faq: g.faq.map(([q, a]) => ({ q, a })), fouten: [], publishAt: DATUM, updatedAt: DATUM, tool: true, kern: true, priority: 96 }));
}

const CSS = 'main{max-width:1040px;margin:auto;padding:28px 20px 64px}.panel{padding:24px;border:1px solid #dbe3dd;border-radius:16px;margin:28px 0}label{display:block;font-weight:700;margin:10px 0 16px}input[type=number],input[type=text],select{display:block;width:100%;font:inherit;margin:10px 0;padding:11px;border:1px solid #b6c5bb;border-radius:8px}.note{font-size:16px;color:#56625a}.btn{display:inline-block;padding:12px 17px}section{margin:34px 0}p,li{line-height:1.7}h1{font-size:clamp(30px,4.5vw,46px);line-height:1.15}.toc a{display:inline-block;margin:5px 18px 5px 0}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;min-width:560px}th,td{text-align:left;vertical-align:top;padding:14px;border-bottom:1px solid #dbe3dd}details{border-bottom:1px solid #dbe3dd;padding:14px 0}summary{cursor:pointer;font-weight:700}.uit{padding:18px;background:#f1f7f3;border-radius:10px}@media(max-width:720px){.panel{padding:18px}}';

function rekenChat(g) {
  const R = g.reken; const fn = R.fn.toString();
  return Object.assign({}, R.chat, { slug: g.slug, zelf: 'rk-' + R.id, js: 'var REKEN=(function(){' + fn + ';return function(inv){return ' + R.fn.name + '(inv)}})();' });
}

export function renderDienstgids(g, q, css) {
  const canonical = 'https://keuzehulp.best/' + g.slug, R = g.reken;
  const inv = {}; let uit = null; if (q && R.velden.every(([n]) => q.get(n) != null && q.get(n) !== '')) { R.velden.forEach(([n]) => { inv[n] = String(q.get(n)).replace(',', '.'); }); uit = R.fn(inv); }
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: g.h1, description: g.desc, inLanguage: 'nl-NL', datePublished: DATUM, dateModified: DATUM, mainEntityOfPage: canonical, author: { '@type': 'Organization', name: 'Keuzehulp' }, publisher: { '@type': 'Organization', name: 'Keuzehulp', url: 'https://keuzehulp.best/' }, citation: g.bronnen.map(b => b[1]) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Keuzehulp', item: 'https://keuzehulp.best/' }, { '@type': 'ListItem', position: 2, name: g.term, item: canonical }] },
    { '@type': 'FAQPage', mainEntity: g.faq.map(([n, a]) => ({ '@type': 'Question', name: n, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@type': 'WebApplication', name: R.kop, url: canonical + '#rk-' + R.id, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'nl-NL', isAccessibleForFree: true }
  ] };
  const chat = kzuxBlok({ alleenChat: true, kop: 'Vraag het de keuzehulp', taal: 'nl', site: 'kzuxdienst', slug: g.slug, term: g.term, shop: '', prods: [], opties: [], faq: g.faq.map(([a, b]) => ({ q: a, a: b })), reken: rekenChat(g) });
  const kort = g.kort.split('. '), eerste = kort.shift();
  const veld = ([n, l, d, min, max, st]) => typeof d === 'string' ? '<label for="rk-' + n + '">' + esc(l.replace(/ \(.*$/, '')) + '<select id="rk-' + n + '" name="' + n + '"><option value="zelf"' + ((inv[n] || d) === 'zelf' ? ' selected' : '') + '>Zelf inhuren</option><option value="bedrijf"' + (inv[n] === 'bedrijf' ? ' selected' : '') + '>Via bedrijf of platform</option></select></label>'
    : '<label for="rk-' + n + '">' + esc(l) + '<input id="rk-' + n + '" name="' + n + '" type="number" inputmode="decimal" min="' + min + '" max="' + max + '" step="' + st + '" required value="' + esc(inv[n] != null ? inv[n] : d) + '"></label>';
  const tabel = '<h3>' + esc(R.tabel.kop) + '</h3><div class="scroll"><table><thead><tr>' + R.tabel.kol.map(k => '<th>' + esc(k) + '</th>').join('') + '</tr></thead><tbody>' + R.tabel.rijen.map(([l, ...cs]) => '<tr><th>' + esc(l) + '</th>' + cs.map(c => { const r = R.fn(c); return '<td>' + (r ? (r.tijd != null ? (r.tijd ? String(r.tijd).replace('.', ',') + ' jaar' : 'niet terug') : '€ ' + r.maand.toLocaleString('nl-NL')) : '') + '</td>'; }).join('') + '</tr>').join('') + '</tbody></table></div>';
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(g.title) + '</title><meta name="description" content="' + esc(g.desc) + '"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="' + canonical + '"><meta property="og:title" content="' + esc(g.title) + '"><meta property="og:description" content="' + esc(g.desc) + '"><meta property="og:url" content="' + canonical + '"><meta property="og:type" content="article"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script><style>' + css + CSS + '</style></head><body><header class="topbar"><div class="wrap"><a class="mark" href="/">keuze<em>hulp</em></a></div></header><main><article>'
    + '<p class="kicker">' + esc(g.kicker) + '</p><h1>' + esc(g.h1) + '</h1><p class="note">Door de redactie · Bronnen gelezen op <time datetime="' + DATUM + '">' + GELEZEN + '</time></p>'
    + '<div class="answer"><p><strong>' + esc(eerste) + '.</strong> ' + esc(kort.join('. ')) + '</p></div>' + chat
    + '<nav class="toc" aria-label="Inhoud"><a href="#eerste-keus">Eerste keus per situatie</a>' + g.secties.map(([id, h]) => '<a href="#' + id + '">' + esc(h) + '</a>').join('') + '<a href="#rk-' + R.id + '">' + esc(R.kop) + '</a><a href="#vragen">Vragen</a></nav>'
    + '<section id="eerste-keus"><h2>' + esc(g.keusKop) + '</h2><div class="scroll"><table><thead><tr><th>Jouw situatie</th><th>Eerste keus</th><th>Waarom</th><th>Bron</th></tr></thead><tbody>' + g.keus.map(([s, k, w, b, u]) => '<tr><td>' + esc(s) + '</td><th>' + esc(k) + '</th><td>' + esc(w) + '</td><td><a href="' + esc(u) + '"' + (/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(b) + '</a></td></tr>').join('') + '</tbody></table></div></section>'
    + g.secties.map(([id, h, ps]) => '<section id="' + id + '"><h2>' + esc(h) + '</h2>' + ps.map(p => '<p>' + esc(p) + '</p>').join('') + '</section>').join('')
    + '<section class="panel" id="rekenhulp"><h2>' + esc(R.kop) + '</h2><p>' + esc(R.tekst) + ' De chat bovenaan rekent het ook uit in een paar tikken.</p>' + tabel
    + '<details id="rk-' + R.id + '"' + (uit ? ' open' : '') + '><summary>Alles zelf invullen</summary><form method="get" action="/' + g.slug + '#rk-' + R.id + '">' + R.velden.map(veld).join('') + '<button class="btn" type="submit">Bereken</button></form>' + (uit ? '<div class="uit" role="status">' + uit.h + '</div>' : '') + '</details></section>'
    + '<section id="vragen"><h2>Veelgestelde vragen</h2>' + g.faq.map(([a, b]) => '<details><summary>' + esc(a) + '</summary><p>' + esc(b) + '</p></details>').join('') + '</section>'
    + '<section id="bronnen"><h2>Bronnen</h2><p>Alle bronnen gelezen op ' + GELEZEN + '. Prijzen en regels veranderen; controleer ze bij de aanbieder.</p><ul>' + g.bronnen.map(([n, u]) => '<li><a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(n) + '</a></li>').join('') + '</ul><p>Ook handig: ' + g.verder.map(([l, h]) => '<a href="' + esc(h) + '">' + esc(l) + '</a>').join(' · ') + '</p></section>'
    + '</article></main><footer><div class="wrap">Keuzehulp · AdsFair B.V. · <a href="/over">Over ons</a> · <a href="/privacy">Privacy</a></div></footer><script defer src="/api/vindbaarheid?op=tracker&v=2"></script></body></html>';
}

export async function dienstgidsHandler(req, res) {
  if (req.method && !['GET', 'HEAD'].includes(req.method)) { res.setHeader('allow', 'GET, HEAD'); return res.status(405).send('Method not allowed'); }
  const q = new URL(req.url, 'https://keuzehulp.best').searchParams, g = DIENSTGIDSEN[String(q.get('g') || '')];
  if (!g) return res.status(404).send('Not found');
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=300'); res.setHeader('x-robots-tag', 'index, follow');
  return res.status(200).send(renderDienstgids(g, q, lookNieuw()));
}
