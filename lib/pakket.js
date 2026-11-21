// Kadoly-pakketten (20 nov 2026, Henkjan: "doe grondig onderzoek en dan zetten we die bundels klaar als in een pakket te koop").
// Versie 2 (21 nov 2026, Henkjan: "Ga alle pakketten nog een keer beconomics na" en "Ja gaan we bouwen"): elk pakket is één verhaal
// voor één ontvanger of moment, staat net onder een cadeaubudget, zegt "X gratis" als de besparing groter is dan één product, meldt
// wat op de foto staat maar er niet bij zit, en heeft een vast adres (kadoly.com/pakket/<slug>) zodat pins en Google blijven werken.
// Zoekvraag (Demand Radar, NL+BE per maand, 20 nov): cadeautips mannen 14.075, voor hem 13.558, voor haar 13.058, vrouwen 6.833,
// kerstcadeautips 5.873, cadeautips voor sinterklaas 4.576; kerstballen 134.672 (nov-dec 391.015), plaids 72.350, geurstokjes 123.981,
// bloempotten 130.310, manden 187.408. Lessen uit Henkjans P&L's: meer stuks per bestelling gaf 36% winst tegen 23%.
//
// Keuze per soort: eerst de vaste set (kern, met Henkjan doorgenomen op 21 nov) als die de regels haalt; anders het pakket van gisteren
// als dat nog geldig is; anders de beste set binnen het thema van één merk (lib/bundel.js rekent prijs en marge: marge minstens EUR 15,
// klant bespaart minstens 10% tegenover los bij ons, nooit duurder dan alles los bij de goedkoopste aanbieder). Een product zit in
// hooguit één pakket.
import { bundelKandidaten, rekenSet, setGoed, geldigeSets, teGelijk, BUNDEL_REGEL } from './bundel.js';

export const PAKKET_REGEL = { DREMPELS: [24.95, 49.95, 74.95, 99.95, 149.95], SNAP: 10, GELDIG_DAGEN: 14, MAX: 149.95 };

const SPA = ['bad', 'spa', 'sheaboter', 'bodylotion', 'handcrème', 'handcreme', 'badzout', 'douche', 'scrub', 'wellness', 'nagel', 'sokken', 'geurkaars', 'zeep'];
const HEM = ['heren', 'mannen', 'whisky', 'bier', 'bbq', 'grill', 'barbecue', 'scheer', 'baard', 'zakmes', 'multitool', 'flesopener', 'houten kaart', 'penhouder', 'bureau'];
export const PAKKET_SOORTEN = [
  { id: 'verwen', slug: 'winterse-verwenbox', naam: 'Winterse verwenbox', voor: 'Cadeau voor haar', groep: 'haar', verhaal: 'Een verwenavond in de winter, kant-en-klaar.', vraag: 'cadeautips voor haar 13.058 per maand',
    kern: ['oc_4173959372324865', 'oc_4173959369080833', 'oc_4173959373094913'], woorden: SPA, niet: ['heren', 'baby', 'kinder', 'hond', 'kat'] },
  { id: 'winteravond', slug: 'winteravond-box', naam: 'Winteravond box', voor: 'Voor moeder, schoonmoeder of vriendin', groep: 'haar', verhaal: 'Lantaarn, plaid en kandelaar voor lange avonden op de bank.', vraag: 'plaids 72.350 per maand (nov-dec 110.905)',
    kern: ['oc_4174003419430913', 'oc_4174003404292098', 'oc_4174003451723777'], woorden: ['lantaarn', 'plaid', 'kandelaar', 'fleece', 'deken'], niet: ['baby', 'kinder'], let: 'Kaarsen op de foto horen er niet bij' },
  { id: 'kersthoek', slug: 'kersthoek-set', naam: 'Kersthoek set', voor: 'Voor jezelf of als kerstcadeau', groep: 'kerst', verhaal: 'Lantaarn en kerstballen: je kersthoek in één keer af.', vraag: 'kerstballen 134.672 per maand (nov-dec 391.015)',
    kern: ['oc_4174003419709441', 'oc_4174003397361666', 'oc_4174003438288897'], woorden: ['kerstbal', 'lantaarn', 'kerstboom'], niet: ['boomrok'], let: 'Kerstboom op de foto hoort er niet bij',
    keuze: { id: 'oc_4174003397361666', vraag: 'Kleur van de 26 kerstballen', opties: [['Wit', 'oc_4174003397361666'], ['Rood', 'oc_4174003395592193'], ['Donkerbruin', 'oc_4174003396526081'], ['Champagne', 'oc_4174003395198977'], ['Goud', 'oc_4174003396820994']] } },
  { id: 'haardgeur', slug: 'sfeerset-haard-en-geur', naam: 'Sfeerset haard en geur', voor: 'Voor lange avonden', groep: 'wonen', verhaal: 'Echt vuur op tafel en de geur van Amsterdam.', vraag: 'geurstokjes en diffusers 123.981 per maand, wij hebben er 4',
    kern: ['oc_4174002164744193', 'oc_4174002164400133'], woorden: ['tafelhaard', 'diffuser', 'geurstok', 'geurkaars'] },
  { id: 'plantenhoek', slug: 'plantenhoek-set', naam: 'Plantenhoek set', voor: 'Voor wie van planten houdt', groep: 'wonen', verhaal: 'Een standaard en twee potten: zet je eigen planten erin en de hoek is af.', vraag: 'bloempotten 130.310 per maand',
    kern: ['oc_4173958825099265', 'oc_4173958843039745', 'oc_4173958883393537'], woorden: ['plantenstandaard', 'bloempot', 'sierpot', 'plantenpot'], niet: ['orchidee', 'phalaenopsis', 'kunstplant'], let: 'Zonder planten' },
  { id: 'wandmanden', slug: 'boho-wandmanden-set', naam: 'Boho wandmanden set', voor: 'Voor aan de muur en op tafel', groep: 'wonen', verhaal: 'Drie handgevlochten manden van bananenvezel en waterhyacint.', vraag: 'manden en wasmanden 187.408 per maand',
    kern: ['oc_4173958180110337', 'oc_4173958204620801', 'oc_4173958190399490'], woorden: ['mand', 'wasmand', 'opberg'], gelijkMag: true },
  { id: 'bureau', slug: 'bureau-set-voor-hem', naam: 'Bureau set voor hem', voor: 'Cadeau voor hem', groep: 'hem', verhaal: 'Een houten kaart van Nederland en een Japanse penhouder voor zijn werkplek.', vraag: 'cadeautips mannen 14.075 en voor hem 13.558 per maand',
    kern: ['oc_4173957638225921', 'oc_4173957639913473'], woorden: HEM, niet: ['dames', 'vrouw', 'meisje', 'baby', 'kinder'] }
];
export const PAKKET_GROEPEN = { haar: 'Voor haar', hem: 'Voor hem', kerst: 'Kerst', wonen: 'Wonen' };

const r2 = v => Math.round(v * 100) / 100;
const kort = t => String(t || '').split(/[,(|]| - | voor | van /)[0].trim();
const plusDagen = (dag, n) => new Date(Date.parse(dag) + n * 864e5).toISOString().slice(0, 10);
export const pakketCode = (soort, dag) => 'p' + soort + String(dag).replace(/-/g, '');
export const soortVan = x => PAKKET_SOORTEN.find(s => s.id === x || s.slug === x) || null;
const grensVan = t => PAKKET_REGEL.DREMPELS.find(d => t <= d) || null;

// Net onder een cadeaubudget: staat de prijs tot EUR 10 boven een grens, dan gaat hij naar de grens als de marge minstens EUR 15 blijft.
export function snap(r) {
  const d = [...PAKKET_REGEL.DREMPELS].reverse().find(x => r.totaal > x && r.totaal - x <= PAKKET_REGEL.SNAP); if (!d) return r;
  const marge = r2(r.marge - (r.totaal - d) * (1 / 1.21 - 0.029)); if (marge < BUNDEL_REGEL.MIN_MARGE) return r;
  const besparing = r2(r.losOns - d); return Object.assign({}, r, { totaal: d, marge, besparing, besparingPct: r.losOns > 0 ? r2(besparing / r.losOns) : 0, gesnapt: r.totaal });
}
// "X gratis": de andere producten kosten los al meer dan het hele pakket. Het duurste product waarvoor dat geldt.
export function gratisVan(items, totaal) {
  const losOns = items.reduce((a, x) => a + x.nu, 0); const kan = items.filter(x => losOns - x.nu >= totaal).sort((a, b) => b.nu - a.nu)[0];
  return kan ? { id: kan.id, titel: kort(kan.t), los: r2(losOns - kan.nu) } : null;
}

function maakPakket(soort, s, dag, code) {
  const p = { code, slug: soort.slug, soort: soort.id, naam: soort.naam, voor: soort.voor, groep: soort.groep, verhaal: soort.verhaal, vraag: soort.vraag, let: soort.let || '', dag,
    geldigTot: plusDagen(dag, PAKKET_REGEL.GELDIG_DAGEN), merk: s.merk, titel: soort.naam + ' van ' + s.merk + ': ' + s.items.map(i => kort(i.t)).join(' + '),
    items: s.items.map(i => ({ id: i.id, t: i.t, img: i.img, nu: i.nu, los: i.los, deel: i.deel, vk: i.vk, lt: i.lt != null ? i.lt : null, c: i.c, same: i.same })),
    totaal: s.totaal, verzending: s.verzending, losOns: s.losOns, losMarkt: s.losMarkt, besparing: s.besparing, besparingPct: s.besparingPct, marge: s.marge,
    margePct: s.totaal > 0 ? r2(s.marge / (s.totaal / 1.21)) : 0, score: s.score, grens: grensVan(s.totaal), gesnapt: s.gesnapt || null, at: new Date().toISOString() };
  p.gratis = gratisVan(s.items, s.totaal);
  if (soort.keuze && s.items.some(i => i.id === soort.keuze.id)) p.keuze = { regel: s.items.findIndex(i => i.id === soort.keuze.id), vraag: soort.keuze.vraag, opties: soort.keuze.opties.map(([label, id]) => ({ label, id })) };
  return p;
}
const zelfde = (a, b) => a.length === b.length && a.every(x => b.includes(x));

// bestaand = { soort: pakket } van de vorige ronde. Geeft { pakketten: [...], log: [...] }.
export function kiesPakketten(items, kaart, markt, opties = {}) {
  const dag = opties.dag, bestaand = opties.bestaand || {}, recent = opties.recent || [], gebruikt = new Set(), uit = [], log = [];
  const perId = {}; bundelKandidaten(items, kaart, markt, null).forEach(x => { perId[x.id] = x; });
  const geldig = (soort, set) => { if (set.some(x => !x || gebruikt.has(x.id))) return null; if (!soort.gelijkMag && teGelijk(set)) return null; const r = snap(rekenSet(set)); return setGoed(r, PAKKET_REGEL.MAX) ? r : null; };
  for (const soort of PAKKET_SOORTEN) {
    const oud = bestaand[soort.id]; let keus = null, bron = '';
    const kern = (soort.kern || []).map(id => perId[id]);
    if (kern.length) { const r = geldig(soort, kern); if (r) { keus = Object.assign({ merk: kern[0].b, items: kern, score: 0 }, r); bron = 'vast'; } else log.push(soort.id + ': vaste set haalt de regels niet (' + (kern.some(x => !x) ? 'product niet leverbaar of zonder inkoop' : 'marge of besparing') + ')'); }
    if (!keus && oud && Array.isArray(oud.items)) { const set = oud.items.map(i => perId[i.id]); const r = set.every(Boolean) ? geldig(soort, set) : null; if (r) { keus = Object.assign({ merk: oud.merk, items: set, score: oud.score }, r); bron = 'gisteren'; } }
    if (!keus) {
      const kand = bundelKandidaten(items, kaart, markt, soort.woorden, soort.niet).filter(x => !gebruikt.has(x.id));
      for (const max of [49.95, 74.95, 99.95]) {
        const g = geldigeSets(kand, { maxTotaal: max + PAKKET_REGEL.SNAP, recent, divers: !soort.gelijkMag }).goed.map(s => Object.assign({}, s, snap(s))).filter(s => s.totaal <= max && s.marge >= BUNDEL_REGEL.MIN_MARGE);
        if (g.length) { keus = g.sort((a, b) => b.score - a.score)[0]; bron = 'gekozen'; break; }
      }
      if (!keus) { log.push(soort.id + ': geen set (' + kand.length + ' producten in het thema)'); continue; }
    }
    const zelfdeAlsOud = oud && Array.isArray(oud.items) && zelfde(oud.items.map(i => i.id), keus.items.map(i => i.id));
    const p = maakPakket(soort, keus, zelfdeAlsOud ? oud.dag : dag, zelfdeAlsOud ? oud.code : pakketCode(soort.id, dag)); p.geldigTot = plusDagen(dag, PAKKET_REGEL.GELDIG_DAGEN);
    keus.items.forEach(x => gebruikt.add(x.id)); uit.push(p);
    if (!zelfdeAlsOud) log.push(soort.id + ': nieuw ' + p.code + ' (' + bron + ', ' + p.titel + ', EUR ' + p.totaal + ', marge ' + p.marge + (p.gratis ? ', gratis ' + p.gratis.titel : '') + ')');
  }
  return { pakketten: uit, log };
}

// Openbaar (zonder inkoop en marge): voor de shop, de pakketpagina's en de cadeautips.
export function pakketOpenbaar(p) {
  if (!p) return null; const zonder = r2(p.totaal - p.verzending), somDeel = p.items.reduce((a, x) => a + x.deel, 0); let rest = zonder;
  const regels = p.items.map((x, i) => { const pr = i === p.items.length - 1 ? r2(rest) : r2(zonder * x.deel / somDeel); rest = r2(rest - pr); return { id: x.id, titel: x.t, kort: kort(x.t), img: x.img, los: x.nu, aantal: 1, prijs: pr }; });
  return { code: p.code, slug: p.slug, soort: p.soort, naam: p.naam, voor: p.voor || '', groep: p.groep || '', verhaal: p.verhaal || '', let: p.let || '', merk: p.merk, titel: p.titel,
    link: 'https://kadoly.com/pakket/' + (p.slug || p.code), dag: p.dag, geldigTot: p.geldigTot, regels, verzending: p.verzending, totaal: p.totaal, losBijOns: p.losOns, besparing: p.besparing,
    grens: p.grens || grensVan(p.totaal), gratis: p.gratis || null, keuze: p.keuze || null, levertijd: Math.max(0, ...p.items.map(i => Number(i.lt) || 0)) || null };
}

export function pakketTekst(lijst) {
  if (!lijst || !lijst.length) return 'Geen pakketten.';
  return lijst.map(p => `${p.naam} (${p.code}, ${p.merk}): ${p.items.map(i => kort(i.t)).join(' + ')}\n  EUR ${Number(p.totaal).toFixed(2)}${p.gesnapt ? ' (was ' + p.gesnapt + ', naar het budget)' : ''}; los bij ons EUR ${Number(p.losOns).toFixed(2)}, bespaart EUR ${Number(p.besparing).toFixed(2)}; marge EUR ${Number(p.marge).toFixed(2)}${p.gratis ? '; gratis: ' + p.gratis.titel : ''}${p.let ? '; let op: ' + p.let : ''}\n  Vraag: ${p.vraag}\n  Shop: https://kadoly.com/pakket/${p.slug || p.code}`).join('\n\n');
}
