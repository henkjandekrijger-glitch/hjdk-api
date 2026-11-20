// Kadoly-pakketten (20 nov 2026, Henkjan: "doe grondig onderzoek en dan zetten we die bundels klaar als in een pakket te koop").
// Waarom: een set van 2 of 3 producten van hetzelfde merk is nergens één-op-één te vergelijken, levert per bestelling meer marge
// (één zending, één keer advertentiekosten) en past op zoekvraag waar Kadoly bijna niets voor heeft. Demand Radar (hjdk-api
// /api/gids?op=vraagkansen, NL+BE per maand, 19 nov 2026): cadeaubox voor hem 13.058 en voor haar 12.233 (beide snel stijgend),
// cadeautjes mand 13.892, cadeaupakketten en boxen samen 53.270 met 20 producten aanbod; geurstokjes en diffusers 123.981 met 4;
// kerstballen 134.672 (nov-dec 391.015); manden 187.408; servies 201.319; bloempotten 130.310; plaids 72.350 (nov-dec 110.905).
// Lessen uit Henkjans P&L's (OVERDRACHT-YOORS-SHOP.md): dagen met meer stuks per bestelling gaven 36% winst tegen 23%.
//
// Per soort één pakket van hetzelfde merk (lib/bundel.js rekent prijs en marge: marge minstens EUR 15, de klant bespaart minstens
// 10% tegenover los bij ons, nooit duurder dan alles los bij de goedkoopste aanbieder). Eerst tot IMPULS (TikTok en Pinterest kopen
// op impuls), lukt dat niet tot GROOT. Een product zit in hooguit één pakket. Een pakket blijft staan (zelfde code, prijs elke dag
// opnieuw berekend) zolang het de regels haalt; anders kiest de ronde een nieuw.
import { bundelKandidaten, rekenSet, setGoed, geldigeSets, teGelijk } from './bundel.js';

export const PAKKET_REGEL = { IMPULS: 65, GROOT: 99, GELDIG_DAGEN: 14 };

export const PAKKET_SOORTEN = [
  { id: 'haar', naam: 'Cadeaubox voor haar', vraag: 'cadeaubox voor haar, 12.233 zoekopdrachten per maand (NL+BE), sterk stijgend', woorden: ['oorbel', 'ketting', 'armband', 'ring', 'hanger', 'sieraad', 'geurkaars', 'handzeep', 'handcrème', 'handcreme', 'bodylotion', 'badzout', 'sjaal', 'parfum', 'lippen', 'portemonnee', 'tasje', 'make-up', 'dames'], niet: ['heren', 'baby', 'kinder'] },
  { id: 'hem', naam: 'Cadeaubox voor hem', vraag: 'cadeaubox voor hem, 13.058 per maand, sterk stijgend', woorden: ['scheer', 'baard', 'aftershave', 'whisky', 'bier', 'kaartspel', 'heren', 'barbecue', 'bbq', 'grill', 'messen', 'flesopener', 'bourbon', 'sigaar'], niet: ['dames', 'vrouw', 'meisje', 'baby', 'kinder'] },
  { id: 'kerst', naam: 'Kerstpakket', vraag: 'kerstballen 134.672 per maand (nov-dec 391.015), kerstdecoratie 110.682 (nov-dec 307.180)', woorden: ['kerst', 'advent', 'kerstbal', 'kerstboom', 'kaars', 'lantaarn', 'piek', 'krans', 'sneeuw', 'winter', 'christmas', 'sinterklaas'] },
  { id: 'sfeer', naam: 'Sfeerpakket', vraag: 'geurstokjes en diffusers 123.981 per maand met maar 4 producten aanbod, lantaarns 31.736', woorden: ['diffuser', 'geurstok', 'geurkaars', 'kaars', 'lantaarn', 'windlicht', 'kandelaar', 'theelicht'] },
  { id: 'tafel', naam: 'Tafelpakket', vraag: 'servies 201.319 per maand, serviessets 15.317, mokken 54.523', woorden: ['bord', 'kom', 'schaal', 'mok', 'beker', 'servies', 'dienblad', 'theepot', 'glazen', 'onderzetter', 'placemat'], niet: ['flatlay', 'fotografie', 'wandbord', 'krijtbord', 'prikbord', 'tekstbord', 'naambord'] },
  { id: 'mand', naam: 'Mandenset', vraag: 'manden en wasmanden 187.408 per maand, wasmand 35.067, rieten mand 11.225', woorden: ['mand', 'wasmand', 'opberg'] },
  { id: 'groen', naam: 'Plantenpakket', vraag: 'bloempotten 130.310 per maand, kunstplanten 95.157, orchideeën 67.643', woorden: ['bloempot', 'sierpot', 'plantenpot', 'plantenstandaard', 'plantenbak', 'kunstplant', 'orchidee', 'vetplant', 'pot '] },
  { id: 'knus', naam: 'Knus pakket', vraag: 'plaids en dekens 72.350 per maand (nov-dec 110.905), sierkussens 72.179', woorden: ['plaid', 'deken', 'kussen', 'sierkussen', 'woldeken'] },
  { id: 'kind', naam: 'Kraamcadeau', vraag: 'cadeau voor geboorte 45.573 per maand, cadeau voor kind 101.259', woorden: ['baby', 'kraam', 'kinder', 'knuffel', 'speelgoed', 'slab', 'rammelaar', 'boxkleed'] }
];

const r2 = v => Math.round(v * 100) / 100;
const kort = t => String(t || '').split(/[,(|]| - | voor | van /)[0].trim();
const plusDagen = (dag, n) => new Date(Date.parse(dag) + n * 864e5).toISOString().slice(0, 10);
export const pakketCode = (soort, dag) => 'p' + soort + String(dag).replace(/-/g, '');

function maakPakket(soort, s, dag, code) {
  return { code, soort: soort.id, naam: soort.naam, vraag: soort.vraag, dag, geldigTot: plusDagen(dag, PAKKET_REGEL.GELDIG_DAGEN), merk: s.merk,
    titel: soort.naam + ' van ' + s.merk + ': ' + s.items.map(i => kort(i.t)).join(' + '),
    items: s.items.map(i => ({ id: i.id, t: i.t, img: i.img, nu: i.nu, los: i.los, deel: i.deel, vk: i.vk, c: i.c, same: i.same })),
    totaal: s.totaal, verzending: s.verzending, losOns: s.losOns, losMarkt: s.losMarkt, besparing: s.besparing, besparingPct: s.besparingPct, marge: s.marge,
    margePct: s.totaal > 0 ? r2(s.marge / (s.totaal / 1.21)) : 0, score: s.score, groot: s.totaal > PAKKET_REGEL.IMPULS, at: new Date().toISOString() };
}

// bestaand = { soort: pakket } van de vorige ronde. Geeft { pakketten: [...], log: [...] }.
export function kiesPakketten(items, kaart, markt, opties = {}) {
  const dag = opties.dag, bestaand = opties.bestaand || {}, recent = opties.recent || [], gebruikt = new Set(), uit = [], log = [];
  const alle = bundelKandidaten(items, kaart, markt, null), perId = {}; alle.forEach(x => { perId[x.id] = x; });
  // eerst de pakketten die nog geldig zijn: zelfde producten, prijs van vandaag
  for (const soort of PAKKET_SOORTEN) {
    const oud = bestaand[soort.id]; if (!oud || !Array.isArray(oud.items)) continue;
    const set = oud.items.map(i => perId[i.id]); if (set.some(x => !x)) { log.push(soort.id + ': ' + oud.code + ' vervalt (product niet meer leverbaar of zonder inkoop)'); continue; }
    if (set.some(x => gebruikt.has(x.id))) continue;
    if (teGelijk(set)) { log.push(soort.id + ': ' + oud.code + ' vervalt (producten te veel gelijk)'); continue; }
    const r = rekenSet(set); if (!setGoed(r, oud.groot ? PAKKET_REGEL.GROOT : PAKKET_REGEL.IMPULS)) { log.push(soort.id + ': ' + oud.code + ' vervalt (haalt de regels niet meer: EUR ' + r.totaal + ', marge ' + r.marge + ')'); continue; }
    const p = maakPakket(soort, Object.assign({ merk: oud.merk, items: set, score: oud.score }, r), oud.dag, oud.code); p.geldigTot = plusDagen(dag, PAKKET_REGEL.GELDIG_DAGEN);
    set.forEach(x => gebruikt.add(x.id)); uit.push(p);
  }
  // dan de soorten zonder pakket: beste set binnen het thema, eerst impuls, dan groot
  for (const soort of PAKKET_SOORTEN) {
    if (uit.some(p => p.soort === soort.id)) continue;
    const kand = bundelKandidaten(items, kaart, markt, soort.woorden, soort.niet).filter(x => !gebruikt.has(x.id));
    let keus = null, grootte = PAKKET_REGEL.IMPULS;
    for (const max of [PAKKET_REGEL.IMPULS, PAKKET_REGEL.GROOT]) { const g = geldigeSets(kand, { maxTotaal: max, recent, divers: true }); if (g.goed.length) { keus = g.goed[0]; grootte = max; break; } }
    if (!keus) { log.push(soort.id + ': geen set (' + kand.length + ' producten in het thema)'); continue; }
    const p = maakPakket(soort, keus, dag, pakketCode(soort.id, dag)); p.groot = grootte > PAKKET_REGEL.IMPULS;
    keus.items.forEach(x => gebruikt.add(x.id)); uit.push(p); log.push(soort.id + ': nieuw ' + p.code + ' (' + p.titel + ', EUR ' + p.totaal + ', marge ' + p.marge + ')');
  }
  uit.sort((a, b) => PAKKET_SOORTEN.findIndex(s => s.id === a.soort) - PAKKET_SOORTEN.findIndex(s => s.id === b.soort));
  return { pakketten: uit, log };
}

export function pakketTekst(lijst) {
  if (!lijst || !lijst.length) return 'Geen pakketten.';
  return lijst.map(p => `${p.naam} (${p.code}, ${p.merk}): ${p.items.map(i => kort(i.t)).join(' + ')}\n  EUR ${Number(p.totaal).toFixed(2)} met één keer verzending; los bij ons EUR ${Number(p.losOns).toFixed(2)}, bespaart EUR ${Number(p.besparing).toFixed(2)}; marge EUR ${Number(p.marge).toFixed(2)} (${Math.round(p.margePct * 100)}% van de prijs zonder btw)\n  Vraag: ${p.vraag}\n  Shop: https://kadoly.com/bundel/${p.code}`).join('\n\n');
}
