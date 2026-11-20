// Engelse beslisgids "welk energiecontract in Nederland" op whichtobuy.best. Zelfde vorm als lib/wtb-dienst.js (decisionKind 'dienst').
// Waarom (Henkjan 20 nov 2026: "JA zeker bouwen"): Demand Radar 20 nov, bronnen die Perplexity aanhaalt. Bij de Nederlandse vraag
// "energiecontract" waren vier van de acht bronnen Engelstalig (nlcompass.com, leideninternationalcentre.nl, housinganywhere.com,
// dutchnews.nl); bij de Engelse vraag "Which energy supplier should I choose in the Netherlands and where do I sign up?" had geen van
// de drie AI's een eerste keus (3 van 3) en waren de bronnen nlcompass.com, keuze.nl, energievergelijker.nl, iamexpat.nl. Wij: niet aangehaald.
// Proef: komt een Engelse pagina met één eerste keus per situatie tussen die bronnen? Meten met dezelfde vraag (ask-URL), elke week.
//
// De bedragen en leveranciers komen uit lib/energie-keuze.js (ENERGY_KEUS en ENERGY_TOP: op de bron gelezen, met bron en datum).
// Deze pagina leest ze daar, zodat de Engelse versie meeloopt als de Nederlandse pagina ververst wordt. Hier staan geen eigen prijzen.
// Geen gedachtestreepjes, geen feit zonder bron.

import { ENERGY_KEUS, ENERGY_TOP, ENERGY_UPDATED, ENERGY_SOURCES } from './energie-keuze.js';

const MAAND = { januari: 'January', februari: 'February', maart: 'March', april: 'April', mei: 'May', juni: 'June', juli: 'July', augustus: 'August', september: 'September', oktober: 'October', november: 'November', december: 'December' };
const TERM = [[/3 jaar vast/i, '3-year fixed'], [/1 jaar vast/i, '1-year fixed'], [/variabel/i, 'variable'], [/dynamisch/i, 'dynamic']];
const SITE = { ENGIE: 'https://www.engie.nl', Energiedirect: 'https://www.energiedirect.nl', 'Frank Energie': 'https://www.frankenergie.nl', Greenchoice: 'https://www.greenchoice.nl', 'Budget Thuis': 'https://www.budgetthuis.nl' };
// "€ 214,24 per maand (geschat)" -> "€214.24"; "€ 0,2884" -> "€0.2884"
const eur = s => { const m = String(s || '').match(/€\s*([\d.]+)(?:,(\d+))?/); return m ? '€' + m[1].replace(/\./g, ',') + (m[2] ? '.' + m[2] : '') : ''; };
// "Overstappen.nl, 3 november 2026" -> "Overstappen.nl, November 3, 2026"
const bron = s => String(s || '').replace(/(?:bijgewerkt\s+)?(\d{1,2}) ([a-z]+) (\d{4})/i, (x, d, m, y) => (MAAND[m.toLowerCase()] ? `${MAAND[m.toLowerCase()]} ${d}, ${y}` : x));
// de regel zoeken op de situatie, niet op de plek in de lijst: zo blijft het kloppen als de Nederlandse lijst van volgorde wisselt
function keus(i, re) {
  const k = ENERGY_KEUS.find(x => re.test(x.situatie || '')) || ENERGY_KEUS[i] || {}, [naam, rest = ''] = String(k.keus || '').split(',').map(x => x.trim());
  const t = (TERM.find(([re]) => re.test(rest || k.keus || '')) || [])[1] || '';
  const tar = String(k.detail || '').match(/Stroom (€ [\d,]+) per kWh, gas (€ [\d,]+) per m³/);
  const kort = String(k.detail || '').match(/(€ [\d.]+) korting/);
  const pan = String(k.detail || '').match(/(\d+) panelen die ([\d.]+) kWh/);
  return { naam, term: t, panelen: pan ? ` The example home has ${pan[1]} panels that generate ${pan[2].replace('.', ',')} kWh a year.` : '', label: `${naam} ${t}`.trim(), bedrag: eur(k.bedrag), geschat: /geschat/i.test(k.bedrag || ''), stroom: tar ? eur(tar[1]) : '', gas: tar ? eur(tar[2]) : '', korting: kort ? eur(kort[1]) : '', bron: bron(k.bron), url: k.url, site: SITE[naam] || '' };
}
const V = keus(0, /^vast, zonder/i), VZ = keus(1, /^vast, met/i), F = keus(2, /^variabel, zonder/i), FZ = keus(3, /^variabel, met/i), D = keus(4, /^dynamisch/i);
const tarief = k => (k.stroom && k.gas ? ` Rates in that list: electricity ${k.stroom} per kWh and gas ${k.gas} per m³${k.korting ? `, with a ${k.korting} welcome discount already counted in the monthly amount` : ''}.` : '');
const knoppen = k => [...(k.site ? [[`${k.naam}: check your own address`, k.site]] : []), [`The price list we used (in Dutch)`, k.url]];
const BRON_EN = [[/^ACM.*tips bij/i, 'ACM, Dutch consumer authority: tips for choosing an energy supplier'], [/^ACM.*aanbod op maat/i, 'ACM, Dutch consumer authority: a personal offer (aanbod op maat)'], [/^ACM.*opzegvergoeding/i, 'ACM, Dutch consumer authority: termination fee and notice period'], [/^Milieu Centraal/i, 'Milieu Centraal: the types of energy contract'], [/^Rijksoverheid.*salder/i, 'Dutch government: the netting scheme for solar panels ends in 2027']];
const BASIS = '2,300 kWh of electricity and 1,000 m³ of gas a year';
const top5 = (ENERGY_TOP.rijen || []).map(([n, b]) => [n, eur(b) + ' a month']);

const ENERGY_EN = {
  slug: 'energy-supplier-netherlands-which-contract-to-choose', decisionKind: 'dienst', priority: 54, cat: 'Home', term: 'energy supplier netherlands',
  title: 'Energy supplier in the Netherlands: which contract to choose',
  h1: 'Energy supplier in the Netherlands: which contract should you choose?',
  seoTitle: 'Energy supplier Netherlands: cheapest contract 2026',
  metaDesc: `Energy supplier Netherlands: ${V.label} ${V.bedrag} a month for 2,300 kWh and 1,000 m³, with solar panels ${VZ.naam}. First choice per situation.`,
  intro: 'In the Netherlands you choose your own electricity and gas supplier, and most price lists are in Dutch. This guide names one first choice for each situation, with the monthly amount and where it comes from. Three questions.',
  kort: `First choice without solar panels: ${V.label}, ${V.bedrag} a month. With solar panels: ${VZ.label}, ${VZ.bedrag} a month. Prefer no fixed term: ${F.label}, ${F.bedrag}. The amounts are for ${BASIS}, from ${V.bron}. Ask for a quote for your own address before you sign.`,
  questions: [
    { q: 'What kind of contract do you want?', options: [{ label: 'Fixed price, no solar panels' }, { label: 'Fixed price, with solar panels' }, { label: 'Flexible, no fixed term' }, { label: 'Dynamic hourly prices' }] },
    { q: 'What about your current contract?', options: [{ label: 'My fixed contract is still running' }, { label: 'It ends soon or it is variable' }, { label: 'I do not know my contract type' }] },
    { q: 'What matters most to you?', options: [{ label: 'Price certainty' }, { label: 'Staying flexible' }, { label: 'The lowest bill, I can shift my usage' }] }
  ],
  routes: [
    { title: `Take ${V.label}`, why: `It has the lowest monthly amount of the fixed contracts in the list we used: ${V.bedrag} a month for ${BASIS} (${V.bron}). Your supply rates stay the same for the whole term.${tarief(V)}`, note: 'Good if you want to know what you pay per kWh and per m³ and you expect to stay at this address.', tradeoff: 'If you leave a fixed contract early, the supplier can charge a termination fee. Ask what it would be before you sign.', links: knoppen(V) },
    { title: `Take ${VZ.label}`, why: `It is our first choice for a fixed contract with solar panels: ${VZ.bedrag} a month in the list we used (${VZ.bron}).${VZ.panelen}${tarief(VZ)} The Dutch netting scheme for solar panels ends on January 1, 2027, so after one year you choose again under the new rules.`, note: 'Good if you have panels now and do not want to be locked in past the change in the rules.', tradeoff: 'Suppliers charge feed-in costs and pay a feed-in fee, and both differ per supplier. Have your usage and your feed-in put in the same quote.', links: knoppen(VZ) },
    { title: `Take ${F.label}`, why: `It is our first choice for a variable contract without solar panels: ${F.bedrag} a month for ${BASIS} (${F.bron}).${tarief(F)} With solar panels the first choice for variable is ${FZ.label}, ${FZ.bedrag} a month (${FZ.bron}).`, note: 'Good if you may move soon or want to be able to leave without a termination fee.', tradeoff: 'Variable rates can change during the contract, so the amount is not fixed. It is also higher than the fixed first choice.', links: [...knoppen(F), ...(FZ.site ? [[`${FZ.naam} (with solar panels)`, FZ.site]] : [])] },
    { title: `Take ${D.label}`, why: `It is our first choice for a dynamic contract: ${D.bedrag} a month${D.geschat ? ' (an estimate)' : ''} for ${BASIS} in the list we used (${D.bron}). With a dynamic contract the electricity price changes per hour or quarter of an hour and the gas price per day.`, note: 'Good if you have a smart meter and can move part of your usage, for example charging a car or running the washing machine at cheap hours.', tradeoff: 'The real bill depends on the hourly prices. A low estimate is not a guaranteed saving, and you carry the price risk yourself.', links: knoppen(D) }
  ],
  extra2: ['Before you switch, ask your current supplier to calculate the termination fee, and check whether you would have to pay back a welcome bonus. Do not cancel only because a new monthly amount looks lower.', 'Check your exact end date and notice period, and let the new contract start when the old one ends. With variable or dynamic rates there is no termination fee, according to the Dutch consumer authority ACM.', 'First look up your contract type and end date in your contract or your online account, or ask your supplier. Without those you cannot judge what switching costs.'],
  extra3: ['For price certainty, compare fixed contracts on the full yearly estimate and the term, not only on the monthly advance payment.', 'To stay flexible, compare a variable contract with a short fixed one. Look at how often the rates can change, the fixed supply costs and the notice period.', 'A dynamic contract can pay off if you can plan part of your electricity use. Check the surcharge per kWh on top of the market price.'],
  picks: [
    ['Fixed price, no solar panels', V.label, `${V.bedrag} a month. ${V.bron}.`],
    ['Fixed price, with solar panels', VZ.label, `${VZ.bedrag} a month. ${VZ.bron}.`],
    ['No fixed term, no solar panels', F.label, `${F.bedrag} a month. ${F.bron}.`],
    ['No fixed term, with solar panels', FZ.label, `${FZ.bedrag} a month. ${FZ.bron}.`],
    ['You can shift your usage', D.label, `${D.bedrag} a month${D.geschat ? ', estimated' : ''}. ${D.bron}.`]
  ],
  tabel: top5.length ? { kop: 'Cheapest 1-year fixed energy contracts in the Netherlands', cols: ['Supplier', 'Monthly amount'], rows: top5, noot: `For ${BASIS}, a home in The Hague, welcome discount counted in the monthly amount. Source: ${ENERGY_TOP.bron}, ${bron(ENERGY_TOP.datum)}. For your address the order can be different.` } : undefined,
  guide: 'Decide on the type of contract first. With a fixed contract the supply rates stay the same for the agreed term. With a variable contract the supplier can change them during the contract. With a dynamic contract the price follows the market: electricity per hour or quarter of an hour, gas per day.\nCompare the full yearly amount, not the monthly payment. The monthly amount is an advance payment. A lower advance with the same costs only means you pay more at the yearly settlement. Check whether a welcome discount is already counted in, when you receive it and what happens if you leave early.\nUse your own address and usage. The amounts on this page are for one example household. Ask for offers for the same address, the same period and the same expected usage, and compare the complete estimate including fixed costs and taxes.\nWith solar panels, look past January 1, 2027. The netting scheme ends on that date, according to the Dutch government. Ask how an offer that runs past that date handles feed-in costs and the feed-in fee.\nSign up with the supplier itself or through a Dutch comparison site such as Overstappen.nl, Gaslicht.com or Pricewise.',
  mistakes: ['Reading the lowest monthly advance payment as the lowest yearly bill.', 'Counting a welcome discount twice: once in the monthly amount and once on top.', 'Leaving a fixed contract early without asking for the termination fee first.', 'With solar panels: comparing only the feed-in fee and forgetting the feed-in costs.', 'Reading the estimate for a dynamic contract as a guaranteed bill.'],
  aiMiss: ['AI answers say there is no single best supplier and list a row of names. For one example household there is a cheapest one per type of contract, and we name it with the amount and the date.', 'Most answers send you to a comparison site without saying which type of contract to pick first.', 'The end of the solar netting scheme on January 1, 2027 is often left out, while it decides how long you should fix your price with panels.'],
  faq: [
    { q: 'Which energy supplier should I choose in the Netherlands?', a: `Without solar panels our first choice is ${V.label}: ${V.bedrag} a month for ${BASIS}, the lowest fixed amount in the list of ${V.bron}. With solar panels it is ${VZ.label} at ${VZ.bedrag} a month. If you do not want a fixed term, ${F.label} at ${F.bedrag}. Ask for a quote for your own address and usage before you sign.` },
    { q: 'What is the cheapest energy supplier in the Netherlands?', a: `It depends on your address, usage and the term. For 1-year fixed contracts the list of ${ENERGY_TOP.bron} of ${bron(ENERGY_TOP.datum)} was: ${top5.map(([n, b]) => `${n} ${b}`).join(', ')}. That is a snapshot for one example household, not a ranking for your address.` },
    { q: 'Fixed, variable or dynamic energy contract: what is the difference?', a: 'Fixed: the supply rates stay the same for the agreed term. Variable: the supplier can change the rates during the contract. Dynamic: the price follows the market, electricity per hour or quarter of an hour and gas per day. Your total bill can still change with your usage in all three.' },
    { q: 'Can I switch energy supplier while my fixed contract is still running?', a: 'Yes, but check the end date first and ask your current supplier what the termination fee would be. Add that fee, and any welcome bonus you must pay back, to the cost of the new contract before you decide. With variable or dynamic rates there is no termination fee, according to the consumer authority ACM.' },
    { q: 'Which energy contract is best with solar panels in the Netherlands?', a: `Our first choice is ${VZ.label}, ${VZ.bedrag} a month in the list of ${VZ.bron}. The netting scheme ends on January 1, 2027, so a one-year term lets you choose again under the new rules. Have your usage and your feed-in put in the same quote and check the feed-in costs.` },
    { q: 'Does a lower monthly payment mean I pay less for energy?', a: 'Not automatically. The monthly amount is an advance payment, not a final price. Compare the expected total for the year and the contract terms for the same address and usage.' },
    { q: 'Where do I sign up for an energy contract in the Netherlands?', a: 'On the website of the supplier itself, or through a Dutch comparison site such as Overstappen.nl, Gaslicht.com or Pricewise. Have your postcode, house number and your yearly usage in kWh and m³ at hand.' }
  ],
  sources: [
    ['Overstappen.nl: cheapest energy suppliers of the month (in Dutch)', V.url],
    ...(FZ.url && FZ.url !== V.url ? [['Gaslicht.com: cheapest contracts for homes with solar panels (in Dutch)', FZ.url]] : []),
    ...ENERGY_SOURCES.map(([n, u]) => [(BRON_EN.find(([re]) => re.test(n)) || [])[1], u]).filter(([n]) => n).map(([n, u]) => [n + ' (in Dutch)', u]),
    ['Our Dutch guide with a calculator to compare two offers', 'https://keuzehulp.best/energieleverancier-vergelijken']
  ],
  disc: 'We do not earn money from the links on this page and no energy supplier paid to be named. The amounts are a snapshot for one example household.',
  gelezen: ENERGY_UPDATED, publishAt: '2026-11-20', updatedAt: ENERGY_UPDATED > '2026-11-20' ? ENERGY_UPDATED : '2026-11-20'
};

export const ENERGIE_NL_GUIDES = { us: [ENERGY_EN], de: [] };
