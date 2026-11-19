// Huisdierenverzekering vergelijken voor hond en kat (keuzehulp.best/huisdierenverzekering, 19 nov 2026).
// Henkjan 19 nov 2026: aanmelden bij Awin voor PetSecur NL en Figopet NL "met de juiste keuzehulp", en "Als we geen keuzehulp hebben maken
// we er een vandaag." Demand Radar (thema verzekeringen, NL, 11 nov 2026): huisdierenverzekering 5.400, verzekering kat 3.600,
// hondenverzekering 2.900 per maand. Elk cijfer met bron en datum van controle; wat een aanbieder niet publiceert staat er niet.
// Wij vergelijken voorwaarden, de lezer kiest (geen advies op maat, Wft). Links naar aanbieders zijn gewone links tot Awin akkoord is:
// dan alleen het veld site per aanbieder vervangen. Chat met pills (lib/kzux.js kzuxBlok reken): hond of kat, leeftijd, wat telt.
import { kzuxBlok } from './kzux.js';
import { lookNieuw } from './look.js';
import { kv } from './db.js';

export const DIER_SLUG = 'huisdierenverzekering';
export const DIER_URL = 'https://keuzehulp.best/' + DIER_SLUG;
export const DIER_DATUM = '2026-11-19';
export const DIER_TITEL = 'Huisdierenverzekering vergelijken voor hond en kat';
export const DIER_DESC = '6 aanbieders naast elkaar: vergoeding 50 tot 90%, maximum per jaar, eigen risico, wachttijd en leeftijdsgrens, met premievoorbeeld en bron.';

// bronnen: [naam, url, datum van de bron zelf (leeg als de bron geen datum noemt)]; alles gecontroleerd op DIER_DATUM
export const DIER_BRONNEN = {
  'figo-vw': ['Figo Pet, polisvoorwaarden huisdierenverzekering', 'https://figopet.nl/wp-content/uploads/sites/4/2025/09/Polisvoorwaarden-2025-09-FIGO-NL.pdf', 'versie 1 september 2025'],
  'ov-figo': ['Overstappen.nl, Figo Pet dierenverzekering', 'https://www.overstappen.nl/dierenverzekering/aanbieders/figo-pet-dierenverzekering', 'bijgewerkt 4 november 2026'],
  'ov-petsecur': ['Overstappen.nl, PetSecur dierenverzekering', 'https://www.overstappen.nl/dierenverzekering/aanbieders/petsecur-dierenverzekering/', 'bijgewerkt 5 oktober 2026'],
  'hf-petsecur': ['HomeFinance, PetSecur huisdierenverzekering', 'https://www.homefinance.nl/petsecur-huisdierenverzekering-bescherm-je-kat-en-hond-vandaag-nog/', ''],
  'ohra-vo': ['OHRA, vergoedingenoverzicht huisdierenverzekering (SCH3332_0424)', 'https://www.ohra.nl/binaries/content/assets/huisdierenverzekering/vergoedingsoverzicht-huisdieren.pdf', ''],
  'ov-ohra': ['Overstappen.nl, OHRA dierenverzekering', 'https://www.overstappen.nl/dierenverzekering/aanbieders/ohra-dierenverzekering/', 'bijgewerkt 2 november 2026'],
  'unive': ['Univé, huisdierenverzekering', 'https://unive.nl/huisdierenverzekering', ''],
  'unive-oud': ['Univé, oudere hond verzekeren', 'https://www.unive.nl/huisdierenverzekering/hondenverzekering/oudere-hond-verzekeren', ''],
  'ov-unive': ['Overstappen.nl, Univé dierenverzekering', 'https://www.overstappen.nl/dierenverzekering/aanbieders/unive-dierenverzekering/', 'bijgewerkt 5 oktober 2026'],
  'inshared-vw': ['InShared, bijzondere voorwaarden huisdierenverzekering (HU-0224)', 'https://www.inshared.nl/documenten/download/voorwaarden-dierenverzekering.pdf', '26 februari 2024'],
  'ov-inshared': ['Overstappen.nl, InShared dierenverzekering', 'https://www.overstappen.nl/dierenverzekering/aanbieders/inshared-dierenverzekering/', 'bijgewerkt 5 oktober 2026'],
  'ov-asr': ['Overstappen.nl, Ik kies zelf van a.s.r. dierenverzekering', 'https://www.overstappen.nl/dierenverzekering/aanbieders/ik-kies-zelf-van-asr-dierenverzekering/', 'bijgewerkt 5 oktober 2026'],
  'ov-faq': ['Overstappen.nl, veelgestelde vragen over dierenverzekeringen', 'https://www.overstappen.nl/dierenverzekering/faq/', 'bijgewerkt 1 april 2026'],
  'radar': ['Radar (AVROTROS), enquête onder 8.688 baasjes', 'https://radar.avrotros.nl/artikel/van-15-naar-50-euro-per-maand-onvrede-over-hoge-premies-en-weinig-dekking-bij-huisdierverzekeringen-62088', '10 november 2025'],
};

// Per aanbieder alleen wat de bron noemt: [tekst, bron]. lt = afsluiten kan als de leeftijd lager is (null = geen grens).
// pctMax, maxMax, prevMax, cast (0 niet, 1 alleen medisch, 2 aanvullend of per keer, 3 module ook preventief) zijn voor de volgorde in de chat.
// vanaf = laagste premie uit het voorbeeld (Labrador of Britse Korthaar van 0 jaar).
export const DIER_AANBIEDERS = [
  { id: 'figo', naam: 'Figo Pet', site: 'https://figopet.nl/', pctMax: 90, maxMax: 1e9, prevMax: 75, prevBasis: true, cast: 1, lt: { hond: null, kat: null }, vanaf: { hond: 23.47, kat: 14.08 },
    v: {
      pct: ['50%, 70% of 90%, zelf te kiezen', 'figo-vw'],
      max: ['€ 3.000, € 6.000 of onbeperkt per jaar', 'figo-vw'],
      er: ['Zelf te kiezen: € 0, € 100, € 250 of € 500 per jaar', 'figo-vw'],
      wacht: ['30 dagen bij ziekte, 2 dagen na een ongeval', 'figo-vw'],
      leeftijd: ['Geen maximumleeftijd bij afsluiten', 'ov-figo'],
      hond: ['€ 23,47 (50%), € 45,59 (70%) of € 60,40 (90%) per maand', 'ov-figo'],
      kat: ['€ 14,08 (50%), € 25,95 (70%) of € 38,04 (90%) per maand', 'ov-figo'],
      basis: ['Bij een maximum van € 3.000 en € 100 eigen risico per jaar', 'ov-figo'],
      castratie: ['Alleen medisch noodzakelijk en vanaf 4 jaar; preventieve castratie niet', 'figo-vw'],
      prev: ['Preventieve zorg zoals vaccinaties tot € 75 per jaar in de basis, zonder eigen risico', 'figo-vw'],
      gebit: ['Aanvullende dekking Gebit, tot € 500 per jaar', 'figo-vw'],
      chip: ['Chip of ringnummer verplicht', 'figo-vw'],
    } },
  { id: 'petsecur', naam: 'PetSecur', site: 'https://www.petsecur.nl/', pctMax: 90, maxMax: 12500, prevMax: 60, prevBasis: false, cast: 2, lt: { hond: 8, kat: 8 }, vanaf: { hond: 26.84, kat: 18.55 },
    v: {
      pct: ['50% (Basis), 70% (Standaard) of 90% (Extra)', 'ov-petsecur'],
      max: ['€ 3.250, € 5.000 of € 12.500 per jaar', 'ov-petsecur'],
      er: ['Zelf te kiezen: € 0, € 50, € 100 of € 150', 'ov-petsecur'],
      wacht: ['De dekking gaat op zijn vroegst 14 dagen na de aanvraag in; een kruisband- of skeletoperatie voor een aandoening uit de eerste 2 maanden valt erbuiten', 'ov-petsecur'],
      leeftijd: ['Hoogstens 7 jaar bij aanvang, en gechipt', 'hf-petsecur'],
      hond: ['€ 26,84 (Basis), € 41,57 (Standaard) of € 54,65 (Extra) per maand', 'ov-petsecur'],
      kat: ['€ 18,55 (Basis), € 24,79 (Standaard) of € 28,40 (Extra) per maand', 'ov-petsecur'],
      basis: ['Zonder extra eigen risico', 'ov-petsecur'],
      castratie: ['Aanvullend, vast bedrag per ingreep: castratie kat € 50 tot € 74,25, hond € 71,50 tot € 168,30', 'ov-petsecur'],
      prev: ['Aanvullend: vaccinaties, ontworming en vlooienmiddel tot € 60 per jaar', 'ov-petsecur'],
      gebit: ['Aanvullend, tot € 275 per jaar met € 50 eigen risico', 'ov-petsecur'],
    } },
  { id: 'ohra', naam: 'OHRA', site: 'https://www.ohra.nl/huisdierenverzekering', pctMax: 80, maxMax: 10000, prevMax: 150, prevBasis: false, cast: 3, lt: { hond: 7, kat: 9 }, vanaf: { hond: 33.76, kat: 15.05 },
    v: {
      pct: ['80%, je betaalt 20% eigen bijdrage per declaratie', 'ohra-vo'],
      max: ['Basis € 2.000, Plus € 5.000, Top € 10.000 per jaar', 'ohra-vo'],
      er: ['Per jaar: hond € 100, € 75 of € 50; kat € 70, € 50 of € 30 (Basis, Plus, Top)', 'ohra-vo'],
      wacht: ['30 dagen bij ziekte, geen wachttijd na een ongeval', 'ov-ohra'],
      leeftijd: ['Hond jonger dan 7 jaar, kat jonger dan 9 jaar', 'ov-ohra'],
      hond: ['€ 33,76 (Basis), € 43,40 (Plus) of € 62,23 (Top) per maand', 'ov-ohra'],
      kat: ['€ 15,05 (Basis), € 19,35 (Plus) of € 26,88 (Top) per maand', 'ov-ohra'],
      basis: ['Met € 100 extra eigen bijdrage per jaar', 'ov-ohra'],
      castratie: ['Module Aanvullende Therapieën: tot € 300 per jaar, preventief en medisch', 'ohra-vo'],
      prev: ['Module Vaccinatie en gebit: vaccinaties tot € 50, € 75 of € 150', 'ohra-vo'],
      gebit: ['Module Vaccinatie en gebit: tot € 200, € 400 of € 800', 'ohra-vo'],
      chip: ['Aanschaf en plaatsen van de chip in alle pakketten', 'ohra-vo'],
    } },
  { id: 'unive', naam: 'Univé', site: 'https://www.unive.nl/huisdierenverzekering', pctMax: 80, maxMax: 5000, prevMax: 100, prevBasis: false, cast: 0, lt: { hond: 8, kat: 10 }, vanaf: { hond: 38.06, kat: 32.55 },
    v: {
      pct: ['80%, je betaalt 20% eigen bijdrage', 'unive'],
      max: ['€ 2.500 of € 5.000 per jaar', 'ov-unive'],
      er: ['Geen eigen risico, wel de 20% eigen bijdrage', 'ov-unive'],
      wacht: ['30 dagen bij ziekte, niet bij een ongeval', 'unive'],
      leeftijd: ['Hond tot 8 jaar elke dekking, vanaf 8 jaar alleen Ongevallen', 'unive-oud'],
      leeftijdKat: ['Kat jonger dan 10 jaar met volledige dekking; vanaf 7 weken', 'ov-unive'],
      hond: ['€ 38,06 (maximum € 2.500) of € 48,48 (maximum € 5.000) per maand', 'ov-unive'],
      kat: ['€ 32,55 (maximum € 2.500) of € 40,06 (maximum € 5.000) per maand', 'ov-unive'],
      castratie: ['Niet verzekerd', 'unive'],
      prev: ['Aanvullend Gebitszorg en preventieve zorg: preventief tot € 100 per jaar', 'unive'],
      gebit: ['Aanvullend, tot € 500 per jaar', 'unive'],
    } },
  { id: 'inshared', naam: 'InShared', site: 'https://www.inshared.nl/dierenverzekering', pctMax: 80, maxMax: 6000, prevMax: 100, prevBasis: false, cast: 2, lt: { hond: 6, kat: 6 }, vanaf: null,
    v: {
      pct: ['80%, je betaalt 20% eigen bijdrage', 'inshared-vw'],
      max: ['€ 3.000, € 4.000 of € 6.000 per jaar', 'inshared-vw'],
      er: ['Geen apart eigen risico, wel de 20% eigen bijdrage', 'inshared-vw'],
      wacht: ['30 dagen, niet voor zorg na een ongeval', 'inshared-vw'],
      leeftijd: ['Hond en kat jonger dan 6 jaar', 'ov-inshared'],
      castratie: ['Medisch noodzakelijk, tot € 250 per keer', 'inshared-vw'],
      prev: ['Extra dekking: vaccinaties en controles tot € 100 per jaar', 'inshared-vw'],
      gebit: ['Aanvullend Gebit, tot € 250 per jaar', 'inshared-vw'],
      chip: ['Alleen honden en katten met een ISO-chip', 'inshared-vw'],
    } },
  { id: 'asr', naam: 'Ik kies zelf van a.s.r.', site: '', pctMax: 75, maxMax: 2500, prevMax: 0, prevBasis: false, cast: -1, lt: { hond: 6, kat: 6 }, vanaf: null,
    v: {
      pct: ['75%, je betaalt 25% per declaratie met een minimum van € 25', 'ov-asr'],
      max: ['€ 2.500 per jaar', 'ov-asr'],
      wacht: ['30 dagen bij ziekte, niet na een ongeval', 'ov-asr'],
      leeftijd: ['Meestal tot 6 jaar', 'ov-asr'],
    } },
];

const RIJEN = [['pct', 'Vergoeding'], ['max', 'Maximum'], ['er', 'Eigen risico'], ['wacht', 'Wachttijd'], ['leeftijd', 'Leeftijd bij afsluiten'], ['leeftijdKat', 'Leeftijd kat'], ['hond', 'Premie hond'], ['kat', 'Premie kat'], ['basis', 'Uitgangspunt premie'], ['castratie', 'Castratie'], ['prev', 'Vaccinaties'], ['gebit', 'Gebit'], ['chip', 'Chip']];

export const DIER_FAQ = [
  ['Is een huisdierenverzekering de moeite waard?', 'Dat hangt af van of je een grote rekening zelf kunt betalen. Een kruisbandoperatie kost ongeveer € 2.000 tot € 4.000 per poot en een ingewikkelde breuk € 1.500 tot € 3.000 (Overstappen.nl). Daartegenover staat de premie, die met de leeftijd stijgt: in de enquête van Radar onder 8.688 baasjes (november 2025) begon die rond € 15 per maand en liep die bij oudere dieren op tot boven € 50, en vond 52% de verzekering het geld niet waard. Wie geen spaargeld voor de dierenarts heeft, wordt met een verzekering beschermd tegen een onverwachte rekening. Een huisdierenverzekering is niet verplicht.'],
  ['Tot welke leeftijd kun je een hond of kat verzekeren?', 'Dat verschilt per aanbieder. Figo Pet heeft geen maximumleeftijd. InShared neemt dieren jonger dan 6 jaar aan en Ik kies zelf van a.s.r. meestal tot 6 jaar, PetSecur tot en met 7 jaar, OHRA honden jonger dan 7 en katten jonger dan 9 jaar. Bij Univé kan een hond tot 8 jaar elke dekking krijgen en daarna alleen Ongevallen, en een kat jonger dan 10 jaar elke dekking. Univé verzekert vanaf 7 weken. Bij OHRA loopt de verzekering gewoon door als je dier na het afsluiten de grens passeert.'],
  ['Wat valt er niet onder een huisdierenverzekering?', 'Aandoeningen die er al waren voordat de verzekering inging, zijn uitgesloten, net als klachten die in de wachttijd ontstaan; zo staat het bij Figo Pet, InShared, PetSecur en Univé. Figo Pet en InShared sluiten erfelijke en aangeboren aandoeningen uit, bij Figo bijvoorbeeld BOS bij kortsnuitige rassen. Preventieve zorg, gebit en castratie zitten meestal alleen in een aanvullende module. Univé noemt daarnaast voortplanting en alternatieve geneeswijzen zoals acupunctuur.'],
  ['Hoe lang is de wachttijd van een huisdierenverzekering?', 'Meestal 30 dagen voor ziekte. Na een ongeval geldt bij OHRA, Univé, InShared en Ik kies zelf geen wachttijd, bij Figo Pet 2 dagen. Figo kent 6 maanden voor een paar aandoeningen, zoals BOS en gebitsbehandelingen bij dieren ouder dan 6 maanden. Bij PetSecur gaat de dekking op zijn vroegst 14 dagen na de aanvraag in.'],
  ['Worden castratie en sterilisatie vergoed?', 'Niet standaard. OHRA vergoedt tot € 300 per jaar met de module Aanvullende Therapieën, ook preventief. PetSecur betaalt met een aanvullende dekking een vast bedrag per ingreep, voor een kater € 50 tot € 74,25 en voor een reu € 71,50 tot € 168,30. InShared vergoedt medisch noodzakelijke castratie tot € 250. Figo Pet alleen als het medisch nodig is en vanaf 4 jaar. Univé vergoedt castratie en sterilisatie niet.'],
  ['Worden vaccinaties vergoed?', 'Bij Figo Pet zit preventieve zorg zoals vaccinaties tot € 75 per jaar in de basis. Bij de anderen gaat het via een module: OHRA tot € 50, € 75 of € 150 (Basis, Plus, Top), Univé en InShared tot € 100 per jaar en PetSecur tot € 60 per jaar voor vaccinaties, ontworming en vlooienmiddel.'],
  ['Wat kost een huisdierenverzekering per maand?', 'Voor een Labrador van 0 jaar rekent Overstappen.nl bij Figo Pet vanaf € 23,47, bij PetSecur € 26,84, bij OHRA € 33,76 en bij Univé € 38,06 per maand, voor een Britse Korthaar van 0 jaar vanaf € 14,08, € 18,55, € 15,05 en € 32,55. Dat is het goedkoopste pakket met per aanbieder andere uitgangspunten. Een hond is duurder dan een kat, en de premie stijgt als je dier ouder wordt.'],
  ['Wat is het verschil tussen eigen risico en eigen bijdrage?', 'Een eigen bijdrage is een percentage dat je van elke rekening zelf betaalt, bijvoorbeeld 20% bij OHRA, Univé en InShared. Een eigen risico is een vast bedrag per jaar dat je eerst zelf betaalt, zoals € 50 tot € 100 voor een hond bij OHRA. Univé rekent het zelf voor: van een rekening van € 1.500 voor een gebroken poot betaalt Univé € 1.200 en jij € 300.'],
  ['Moet mijn hond of kat gechipt zijn?', 'Bij Figo Pet is een chip of ringnummer verplicht, InShared verzekert alleen honden en katten met een ISO-chip en PetSecur alleen gechipte dieren. OHRA vergoedt de aanschaf en het plaatsen van de chip in elk pakket.'],
  ['Geven jullie advies over welke verzekering ik moet nemen?', 'Nee. We zetten de voorwaarden die de aanbieders publiceren naast elkaar, met de bron erbij. We kennen jouw situatie niet en kiezen geen verzekering voor je. Lees de polisvoorwaarden en vraag de premie voor jouw dier op bij de aanbieder. Persoonlijk advies over een verzekering mag alleen een adviseur met een vergunning van de AFM geven.'],
];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bronLink = k => { const b = DIER_BRONNEN[k]; return b ? '<a class="hd-b" href="' + esc(b[1]) + '" target="_blank" rel="noopener">bron: ' + esc(b[0].split(',')[0]) + '</a>' : ''; };
const nb = h => h.replace(/€ (?=\d)/g, '€&nbsp;');

// ---------- chat met pills: hond of kat, leeftijd, wat telt (rekent in de browser, geen AI) ----------
// Dezelfde functie draait op de server (test) en in de browser; alleen D als data erbij.
function REKEN(inv, m) {
  var dier = inv.d === 'kat' ? 'kat' : 'hond', l = Number(inv.l), w = String(inv.w || 'max'), L = D.a;
  var eur = function (n) { return '€ ' + n.toLocaleString('nl-NL', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
  var e = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  if (!(l >= 0)) return null;
  var kan = L.filter(function (a) { var g = a.lt[dier]; return g === null || l < g; }), niet = L.filter(function (a) { return kan.indexOf(a) < 0; });
  var ongeval = dier === 'hond' && l >= 8 ? L.filter(function (a) { return a.id === 'unive'; }) : [];
  if (!kan.length) return { h: '<p>Voor een ' + dier + ' van ' + (l >= 10 ? '10 jaar of ouder' : l + ' jaar') + ' kun je bij geen van deze aanbieders nog een volledige dekking afsluiten.' + (ongeval.length ? ' Univé biedt dan alleen de dekking Ongevallen.' : '') + '</p><p class="kx-rk-w"><a href="#aanbieders">Bekijk alle voorwaarden met bron</a></p>', vel: { wat: 'huisdierenverzekering', voorWie: dier } };
  if (m === 'terug') {
    var b = Number(inv.b) || 1500;
    var rij = kan.map(function (a) { var t = Math.min(b * a.pctMax / 100, a.maxMax); return '<p><b>' + e(a.naam) + '</b>: ' + eur(Math.round(t * 100) / 100) + ' terug bij ' + a.pctMax + '%' + (a.maxMax < 1e8 && b * a.pctMax / 100 > a.maxMax ? ', want het maximum is ' + eur(a.maxMax) : '') + '</p>'; }).join('');
    return { h: '<p class="kx-rk-k">Van een rekening van ' + eur(b) + '</p>' + rij + '<p class="kx-rk-w">Met het ruimste pakket van elke aanbieder en vóór een eventueel eigen risico. Alleen als de behandeling onder de dekking valt.</p>', vel: { wat: 'huisdierenverzekering', voorWie: dier } };
  }
  var S = {
    max: [function (a) { return -a.maxMax; }, 'het hoogste maximum per jaar', function (a) { return 'maximum ' + (a.maxMax > 1e8 ? 'onbeperkt' : eur(a.maxMax)) + ' per jaar, tot ' + a.pctMax + '% vergoed'; }],
    pct: [function (a) { return -a.pctMax; }, 'het hoogste vergoedingspercentage', function (a) { return 'tot ' + a.pctMax + '% vergoed, maximum ' + (a.maxMax > 1e8 ? 'onbeperkt' : eur(a.maxMax)); }],
    prev: [function (a) { return -(a.prevMax + (a.prevBasis ? 1000 : 0)); }, 'vaccinaties en preventieve zorg', function (a) { return a.prevMax ? 'vaccinaties tot ' + eur(a.prevMax) + ' per jaar' + (a.prevBasis ? ', in de basis' : ', met een module') : 'tot ' + a.pctMax + '% vergoed, maximum ' + eur(a.maxMax); }],
    cast: [function (a) { return -a.cast; }, 'castratie en sterilisatie', function (a) { return a.v.castratie ? a.v.castratie[0].charAt(0).toLowerCase() + a.v.castratie[0].slice(1) : 'tot ' + a.pctMax + '% vergoed, maximum ' + eur(a.maxMax); }],
    prijs: [function (a) { return a.vanaf ? a.vanaf[dier] : 1e9; }, 'de laagste premie in het rekenvoorbeeld', function (a) { return a.vanaf ? 'vanaf ' + eur(a.vanaf[dier]) + ' per maand voor een ' + (dier === 'hond' ? 'Labrador' : 'Britse Korthaar') + ' van 0 jaar' : 'premie bereken je op de site van de aanbieder'; }],
  }[w] || null;
  if (!S) return null;
  var lijst = kan.slice().sort(function (a, b) { return S[0](a) - S[0](b); });
  var top = lijst.slice(0, 3).map(function (a, i) { return '<p><b>' + (i + 1) + '. ' + e(a.naam) + '</b>: ' + e(S[2](a)) + '. <a href="#a-' + a.id + '">Voorwaarden</a></p>'; }).join('');
  var rest = lijst.slice(3).map(function (a) { return e(a.naam); });
  var leeft = l >= 10 ? '10 jaar of ouder' : l === 5 ? 'jonger dan 6 jaar' : l + ' jaar';
  return { h: '<p class="kx-rk-k">Een ' + dier + ' van ' + leeft + ' kun je verzekeren bij</p><p class="kx-rk-g">' + kan.length + ' van de ' + L.length + ' aanbieders</p><p>Gesorteerd op ' + S[1] + ':</p>' + top + (rest.length ? '<p>Ook mogelijk: ' + rest.join(', ') + '.</p>' : '') + (niet.length ? '<p class="kx-rk-w">Niet meer bij ' + niet.map(function (a) { return e(a.naam); }).join(', ') + ' (leeftijdsgrens).' + (ongeval.length ? ' Univé biedt dan alleen Ongevallen.' : '') + '</p>' : '') + (w === 'prijs' ? '<p class="kx-rk-w">De premie voor een ouder dier is hoger; vraag die op bij de aanbieder.</p>' : '') + '<p class="kx-rk-w">Een vergelijking van de gepubliceerde voorwaarden, geen advies. Lees de polisvoorwaarden voor je afsluit.</p>', vel: { wat: 'huisdierenverzekering', voorWie: dier } };
}
export const _test = { REKEN, rekenCfg: () => rekenCfg() };

function rekenCfg() {
  const D = { a: DIER_AANBIEDERS.map(a => ({ id: a.id, naam: a.naam, lt: a.lt, pctMax: a.pctMax, maxMax: a.maxMax, prevMax: a.prevMax, prevBasis: a.prevBasis, cast: a.cast, vanaf: a.vanaf, v: { castratie: a.v.castratie } })) };
  const leeftijd = { f: 'l', v: 'Hoe oud is je dier nu?', p: [['Jonger dan 6 jaar', '5'], ['6 jaar', '6'], ['7 jaar', '7'], ['8 jaar', '8'], ['9 jaar', '9'], ['10 jaar of ouder', '10']] };
  const belang = { f: 'w', v: 'Wat vind je het belangrijkst?', p: [['Hoog maximum per jaar', 'max'], ['Zoveel mogelijk vergoed', 'pct'], ['Ook vaccinaties', 'prev'], ['Ook castratie', 'cast'], ['Laagste premie', 'prijs']] };
  return {
    wat: 'huisdierenverzekering', tot: 3, voortg: '{n} van {t} klaar', ph: 'Of typ je vraag over je huisdierenverzekering',
    st: [{ f: 'd', v: 'Is het voor een hond of een kat?', p: [['Hond', 'hond', { voorWie: 'hond' }], ['Kat', 'kat', { voorWie: 'kat' }]] }, leeftijd, belang],
    na: [
      { l: 'Iets anders belangrijk', s: 'stap', st: belang },
      { l: 'Andere leeftijd', s: 'stap', st: leeftijd },
      { l: 'Wat krijg ik terug van een rekening?', s: 'stap', m: 'terug', st: { f: 'b', v: 'Hoe hoog is de rekening van de dierenarts?', p: [['€ 500', '500'], ['€ 1.500', '1500'], ['€ 3.000', '3000'], ['€ 6.000', '6000']], ander: { l: 'Ander bedrag', ph: 'Bijvoorbeeld 2500', voor: '€ ', min: 1, max: 100000 } } },
      { l: 'Alle cijfers met bron', s: 'link', href: '#aanbieders' },
      { l: 'Houd me op de hoogte', s: 'blijf', v: 'Zal ik je een seintje geven als premies of voorwaarden van deze aanbieders veranderen?' },
      { l: 'Koppel aan je assistent', s: 'koppel', href: '/koppel' },
    ],
    js: 'var REKEN=(function(){"use strict";var D=' + JSON.stringify(D).replace(/</g, '\\u003c') + ';' + REKEN.toString() + ';return REKEN})();',
  };
}

// ---------- pagina ----------
function kaart(a) {
  const rijen = RIJEN.filter(([k]) => a.v[k]).map(([k, l]) => '<div><dt>' + esc(l) + '</dt><dd>' + esc(a.v[k][0]) + ' <span class="hd-bron">' + bronLink(a.v[k][1]) + '</span></dd></div>').join('');
  return '<article class="hd-k" id="a-' + a.id + '"><h3>' + esc(a.naam) + '</h3><dl>' + rijen + '</dl>' + (a.site ? '<p class="hd-l"><a href="' + esc(a.site) + '" target="_blank" rel="noopener" data-out="' + a.id + '">Naar de site van ' + esc(a.naam) + '</a></p>' : '') + '</article>';
}
function schema() {
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': DIER_URL + '#article', headline: DIER_TITEL, description: DIER_DESC, inLanguage: 'nl-NL', datePublished: DIER_DATUM, dateModified: DIER_DATUM, mainEntityOfPage: DIER_URL, author: { '@type': 'Organization', name: 'Keuzehulp', url: 'https://keuzehulp.best/' }, publisher: { '@type': 'Organization', name: 'Keuzehulp', url: 'https://keuzehulp.best/' }, about: { '@type': 'Thing', name: 'Huisdierenverzekering' }, citation: Object.values(DIER_BRONNEN).map(b => b[1]) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Keuzehulp', item: 'https://keuzehulp.best/' }, { '@type': 'ListItem', position: 2, name: 'Verzekeringen', item: 'https://keuzehulp.best/verzekeringen' }, { '@type': 'ListItem', position: 3, name: 'Huisdierenverzekering', item: DIER_URL }] },
    { '@type': 'ItemList', name: 'Aanbieders van huisdierenverzekeringen voor hond en kat', numberOfItems: DIER_AANBIEDERS.length, itemListElement: DIER_AANBIEDERS.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: DIER_URL + '#a-' + a.id, item: { '@type': 'Organization', name: a.naam } })) },
    { '@type': 'FAQPage', mainEntity: DIER_FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ] };
}
const CSS = 'main{max-width:960px;margin:auto;padding:24px 16px 64px}section{margin:34px 0}p,li{line-height:1.65}.hd-kort{padding:18px 20px;border:1px solid #E5E7EB;border-radius:16px}.hd-kort ul{margin:8px 0 0;padding-left:20px}.hd-toc{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.hd-toc a{border:1px solid #D1D5DB;border-radius:999px;padding:7px 14px;text-decoration:none;color:inherit;font-size:15px}'
  + '.hd-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}table{border-collapse:collapse;width:100%;min-width:560px;font-size:15px}th,td{text-align:left;vertical-align:top;padding:11px 10px;border-bottom:1px solid #E5E7EB}thead th{font-weight:700}'
  + '.hd-ks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.hd-k{border:1px solid #E5E7EB;border-radius:16px;padding:18px;min-width:0}.hd-k h3{margin:0 0 8px;font-size:18px}.hd-k dl{margin:0}.hd-k dl div{padding:8px 0;border-bottom:1px solid #F0F1F3}.hd-k dl div:last-child{border-bottom:0}.hd-k dt{font-size:14px;font-weight:700}.hd-k dd{margin:2px 0 0;font-size:16px;line-height:1.5;overflow-wrap:anywhere}.hd-bron{font-size:14px;white-space:nowrap}a.hd-b{color:inherit;text-decoration:underline;text-underline-offset:2px}.hd-l a{display:inline-block;border:1px solid #111113;border-radius:999px;padding:8px 16px;text-decoration:none;color:inherit;font-weight:600}'
  + '.hd-n{font-size:14px}details{border-bottom:1px solid #E5E7EB;padding:12px 0}summary{cursor:pointer;font-weight:700}ol.hd-bronnen li{font-size:15px;overflow-wrap:anywhere}'
  + '@media(max-width:720px){.hd-ks{grid-template-columns:1fr}}html.hs-dk .hd-kort,html.hs-dk .hd-k,html.hs-dk th,html.hs-dk td,html.hs-dk details{border-color:#3A3F4A}html.hs-dk .hd-k dl div{border-color:#2A2E36}html.hs-dk .hd-toc a{border-color:#4A5260}html.hs-dk .hd-l a{border-color:#F2F3F5}';

export function renderHuisdier(css = '') {
  const A = DIER_AANBIEDERS, ld = JSON.stringify(schema()).replace(/</g, '\\u003c');
  const chat = kzuxBlok({ alleenChat: true, kop: 'Vergelijk in 3 tikken', taal: 'nl', site: 'kzuxdier', slug: DIER_SLUG, term: 'huisdierenverzekering', shop: '', prods: [], opties: [], faq: DIER_FAQ.map(([q, a]) => ({ q, a })), reken: rekenCfg() });
  const kort = '<section class="hd-kort" id="kort-antwoord"><h2>Huisdierenverzekeringen in het kort</h2><ul>'
    + '<li>Het hoogste maximum per jaar: Figo Pet (tot onbeperkt) en PetSecur Extra (€ 12.500).</li>'
    + '<li>Het hoogste vergoedingspercentage: Figo Pet en PetSecur, tot 90%. OHRA, Univé en InShared vergoeden 80%, Ik kies zelf van a.s.r. 75%.</li>'
    + '<li>Voor een ouder dier: Figo Pet heeft geen maximumleeftijd; Univé neemt katten jonger dan 10 en honden jonger dan 8 jaar aan, OHRA katten jonger dan 9 jaar.</li>'
    + '<li>Vaccinaties in de basis: alleen Figo Pet, tot € 75 per jaar. Castratie, ook preventief: OHRA met een module, tot € 300 per jaar.</li>'
    + '<li>De laagste premie in het rekenvoorbeeld voor een pup of kitten: Figo Pet, € 23,47 voor een Labrador en € 14,08 voor een Britse Korthaar per maand (50% vergoed).</li></ul></section>';
  const kol = [['Vergoeding', a => a.pctMax === 90 ? '50 tot 90%' : a.pctMax + '%'], ['Maximum per jaar', a => a.maxMax > 1e8 ? 'tot onbeperkt' : 'tot € ' + a.maxMax.toLocaleString('nl-NL')], ['Afsluiten hond', a => a.lt.hond === null ? 'geen grens' : 'jonger dan ' + a.lt.hond], ['Afsluiten kat', a => a.lt.kat === null ? 'geen grens' : 'jonger dan ' + a.lt.kat], ['Wachttijd ziekte', a => a.id === 'petsecur' ? 'start na 14 dagen' : '30 dagen']];
  const tabel = '<section id="naast-elkaar"><h2>Huisdierenverzekeringen naast elkaar</h2><p>Zes aanbieders voor hond en kat. De volgorde is geen ranglijst. De bron van elk cijfer staat bij de aanbieder hieronder.</p><p class="hd-n">Leeftijd in jaren bij het afsluiten. Gecontroleerd op <time datetime="' + DIER_DATUM + '">19 november 2026</time>. Schuif de tabel opzij voor alle kolommen.</p><div class="hd-scroll" tabindex="0" role="region" aria-label="Tabel huisdierenverzekeringen"><table><thead><tr><th scope="col">Aanbieder</th>' + kol.map(k => '<th scope="col">' + k[0] + '</th>').join('') + '</tr></thead><tbody>' + A.map(a => '<tr><th scope="row"><a href="#a-' + a.id + '">' + esc(a.naam) + '</a></th>' + kol.map(k => '<td>' + esc(k[1](a)) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></section>';
  const kaarten = '<section id="aanbieders"><h2>Per aanbieder: vergoeding, eigen risico, wachttijd en premie</h2><p>De premievoorbeelden zijn het rekenvoorbeeld van Overstappen.nl voor een Labrador Retriever en een Britse Korthaar van 0 jaar, eigenaar man, postcode 1013 AP in Amsterdam. De uitgangspunten verschillen per aanbieder, dus leg ze niet één op één naast elkaar; voor jouw dier vraag je de premie op bij de aanbieder.</p><div class="hd-ks">' + A.map(kaart).join('') + '</div><p class="hd-n">De links naar de aanbieders zijn gewone links, zonder partnercode of korting via ons.</p></section>';
  const zo = '<section id="zo-vergelijk-je"><h2>Zo vergelijk je een huisdierenverzekering</h2><ol>'
    + '<li><strong>Vergoeding en maximum samen.</strong> 90% vergoed met een maximum van € 3.000 kan bij een dure operatie minder opleveren dan 80% met € 10.000.</li>'
    + '<li><strong>Eigen bijdrage en eigen risico.</strong> Een percentage per rekening en een vast bedrag per jaar kunnen allebei gelden. Bij OHRA gaat eerst de eigen bijdrage eraf, dan geldt het maximum en daarna het eigen risico.</li>'
    + '<li><strong>Leeftijd.</strong> Na 6 tot 9 jaar nemen de meeste aanbieders geen nieuw dier meer aan. Sluit je af terwijl je dier jong is, dan loopt de verzekering bij OHRA door als het die grens passeert.</li>'
    + '<li><strong>Wachttijd en bestaande klachten.</strong> Wat al speelt voor de ingangsdatum of in de eerste 30 dagen ontstaat, wordt niet vergoed, ook later niet.</li>'
    + '<li><strong>Modules.</strong> Gebit, vaccinaties en castratie zitten meestal niet in de basis. Tel de premie van de module mee.</li></ol>'
    + '<p>Rekenvoorbeeld van Univé: een gebroken poot kost € 1.500. Univé vergoedt 80%, dus € 1.200, en jij betaalt € 300 <span class="hd-bron">' + bronLink('unive') + '</span>.</p></section>';
  const faq = '<section id="vragen"><h2>Vragen over huisdierenverzekeringen</h2>' + DIER_FAQ.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</section>';
  const bronnen = '<section id="bronnen"><h2>Bronnen en werkwijze</h2><p>Alles gecontroleerd op 19 november 2026. Wat een aanbieder of bron niet noemt, staat er niet. De polisvoorwaarden van de aanbieder gaan altijd voor. Dit is een vergelijking van algemene productinformatie, geen persoonlijk advies over een verzekering.</p><ol class="hd-bronnen">' + Object.values(DIER_BRONNEN).map(([n, u, d]) => '<li><a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(n) + '</a>' + (d ? ', ' + esc(d) : '') + '</li>').join('') + '</ol><p>Ook vergelijken: <a href="/verzekeringen">alle verzekeringen naast elkaar</a> en de <a href="/zorgverzekering">zorgverzekering 2027</a>. Fout gezien? <a href="https://wa.me/31655395630" rel="nofollow">App de redactie</a>.</p></section>';
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><link rel="icon" href="data:,"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(DIER_TITEL) + '</title><meta name="description" content="' + esc(DIER_DESC) + '"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"><link rel="canonical" href="' + DIER_URL + '"><link rel="alternate" type="text/plain" href="/llms.txt"><meta property="og:type" content="article"><meta property="og:locale" content="nl_NL"><meta property="og:title" content="' + esc(DIER_TITEL) + '"><meta property="og:description" content="' + esc(DIER_DESC) + '"><meta property="og:url" content="' + DIER_URL + '"><meta name="twitter:card" content="summary"><script type="application/ld+json">' + ld + '</script><style>' + css + CSS + '</style></head><body>'
    + '<header class="topbar"><div class="wrap"><a class="mark" href="/">keuze<em>hulp</em></a><nav class="topnav" aria-label="Menu"><a href="/">Alle keuzehulpen</a><a href="/verzekeringen">Verzekeringen</a></nav></div></header>'
    + '<main><article><p class="crumbs"><a href="/">Keuzehulp</a> › <a href="/verzekeringen">Verzekeringen</a> › Huisdierenverzekering</p><h1>' + esc(DIER_TITEL).replace('Huisdierenverzekering', 'Huisdieren&shy;verzekering') + '</h1><p class="standfirst">Figo Pet, PetSecur, OHRA, Univé, InShared en Ik kies zelf van a.s.r. naast elkaar: hoeveel ze vergoeden, tot welk bedrag per jaar, het eigen risico, de wachttijd en tot welke leeftijd je je hond of kat kunt verzekeren.</p><p class="hd-n">Door de redactie · gecontroleerd op <time datetime="' + DIER_DATUM + '">19 november 2026</time></p>'
    + chat + nb(kort) + '<nav class="hd-toc" aria-label="Inhoud"><a href="#naast-elkaar">Naast elkaar</a><a href="#aanbieders">Per aanbieder</a><a href="#zo-vergelijk-je">Zo vergelijk je</a><a href="#vragen">Vragen</a><a href="#bronnen">Bronnen</a></nav>'
    + nb(tabel + kaarten + zo + faq + bronnen) + '</article></main><footer><div class="wrap">Keuzehulp · AdsFair B.V.</div></footer><script defer src="/api/vindbaarheid?op=tracker&v=2"></script></body></html>';
}

// voor de chat op de hele site (lib/kzchat.js) en llms.txt
export function chatItems() {
  const uitleg = DIER_AANBIEDERS.map(a => a.naam + ': ' + Object.entries(a.v).map(([k, [t]]) => k + ' ' + t).join('; ')).join(' | ') + ' | Premievoorbeelden van Overstappen.nl voor een Labrador en een Britse Korthaar van 0 jaar in Amsterdam. Vergelijking, geen advies.';
  return [{ slug: DIER_SLUG, pad: '/' + DIER_SLUG, term: 'huisdierenverzekering', title: DIER_TITEL, kort: 'Zes aanbieders voor hond en kat naast elkaar: Figo Pet en PetSecur vergoeden tot 90%, OHRA, Univé en InShared 80%. Figo Pet heeft geen maximumleeftijd.', uitleg, faq: DIER_FAQ.map(([q, a]) => ({ q, a })) }];
}
export function llmsDeel() {
  return '\n\n## Huisdierenverzekering ([vergelijken](' + DIER_URL + '))\n\n- [Huisdierenverzekering vergelijken voor hond en kat](' + DIER_URL + '): Figo Pet, PetSecur, OHRA, Univé, InShared en Ik kies zelf van a.s.r. met vergoeding (50 tot 90%), maximum per jaar, eigen risico, wachttijd, leeftijdsgrens en premievoorbeeld, elk cijfer met bron.';
}

export async function huisdierHandler(req, res) {
  if (req.method && !['GET', 'HEAD'].includes(req.method)) { res.setHeader('allow', 'GET, HEAD'); return res.status(405).send('Method not allowed'); }
  try { const bot = /bot|crawl|spider|ChatGPT-User|Claude-User|Perplexity-User/i.test(String(req.headers['user-agent'] || '')); await kv.incrMany([['c:hjdk6-kz-huisdier-' + (bot ? 'bot' : 'page'), 1]]); } catch (e) {}
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=300'); res.setHeader('x-robots-tag', 'index, follow');
  return res.status(200).send(renderHuisdier(lookNieuw()));
}
