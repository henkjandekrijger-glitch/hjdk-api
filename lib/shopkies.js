// Dagkeuze voor de shoptest (Henkjan 19 okt 2026): "We gaan iedere dag 20 producten testen deze week. Lerend. Met demand
// radar en prijs radar en dan gaan we lerend verkeer sturen naar presterend of veel belovend."
//
// Kiest elke dag n producten (standaard 20) uit de catalogus van de Yoors Shop en zegt van elk product dat al getest is of
// het presteert, veelbelovend is, afvalt of nog geen oordeel heeft. De PropellerAds-lus (propellerads-mcp lib/shoptest.ts)
// zet per gekozen product een eigen campagne aan, houdt presterende en veelbelovende producten aan en ruimt de rest op.
//
// Harde eisen: foto, op voorraad, inkoop bekend (marge), thuisprijs (prijs + verzending klant) hoogstens 60 euro, wat een
// verkoop aan advertenties mag kosten (helft van de marge, lib/shopmarge.js) minstens 1,50 euro, de prijsradar
// (lib/shopprijs.js) zegt niet 'niet adverteren' of 'controleren', en niet in de laatste 7 dagen al getest.
// Score: vraag (Demand Radar: zoekterm in de titel, welke lijst, kans op stijging) x seizoen x prijs tegen de markt x marge.
// Geen Engelse titels; levertijd boven 5 dagen telt minder.
// Prijsband: 3/4 tot 30 euro thuis, 1/4 van 30 tot 60 euro (de band zelf is ook een test). 10% verkenning: willekeurig uit
// wat overblijft. Spreiding: hoogstens 3 per categorie en 2 per merk.
//
// Oordeel per getest product, relatief tegen het gemiddelde van alle shopproducten (geen vaste bedragen):
//   presterend   = minstens 1 verkoop
//   veelbelovend = minstens 1 winkelwagen, of minstens 10 echte mensen en een tikratio boven het gemiddelde
//   af           = verwacht minstens 3 tikken (echte mensen x gemiddelde tikratio), toch 0 tikken en 0 winkelwagens
//   onbeslist    = de rest; draait door tot het een oordeel heeft (hoogstens 3 dagen, dan beslist de lus)
// Een product dat in de pagina lekt (alle bronnen samen te weinig echte mensen) is een paginalek, geen productoordeel:
// daarom tellen alleen echte mensen mee, niet aankomsten.
import { margeVan } from './shopmarge.js';
import { advies } from './shopprijs.js';

export const KIES_REGELS = { n: 20, maxThuis: 60, laagTot: 30, aandeelLaag: 0.75, minMaxVerkoop: 1.5, perCategorie: 3, perMerk: 2, verkenning: 0.1, rustDagen: 7, minEcht: 10, afVerwachtTik: 3, testDagen: 3 };

const r2 = v => Math.round(v * 100) / 100;
const num = v => Number(v) || 0;
export const eur = v => '€' + Number(v).toFixed(2).replace('.', ',');
// Afkappen op een woordgrens, zonder half woord of losse leesteken aan het eind.
export function kort(s, max) {
  s = String(s || '').replace(/\s+/g, ' ').trim(); if (Array.from(s).length <= max) return s;
  const w = s.split(' '); let o = '';
  for (const x of w) { const n = o ? o + ' ' + x : x; if (Array.from(n).length > max) break; o = n; }
  o = (o || Array.from(s).slice(0, max).join('')).replace(/[\s,.;:\-–|&]+$/, '');
  // geen los voorzetsel of lidwoord aan het eind ("... Lief met")
  for (let i = 0; i < 3; i++) { const m = o.match(/^(.*\S)\s+(met|voor|van|en|de|het|een|op|in|uit|om|aan|bij|te|tot|the|for|with|and|of)$/i); if (!m) break; o = m[1].replace(/[\s,.;:\-–|&]+$/, ''); }
  return o;
}
// Engelse titels (een deel van de catalogus is nog niet vertaald) horen niet in een Nederlandse advertentie of op een Nederlandse
// pagina: dat is een onbetrouwbaarheidssignaal en breekt de message match. Twee of meer Engelse woorden en geen Nederlands = Engels.
const EN = new Set(['for', 'with', 'by', 'and', 'the', 'of', 'from', 'candle', 'gift', 'box', 'plate', 'elegant', 'tableware', 'design', 'decoration', 'butterfly', 'wall', 'circle', 'snow', 'tree', 'shape', 'green', 'christmas', 'cup', 'mug', 'bowl', 'holder', 'lamp', 'wooden', 'handmade', 'natural', 'black', 'white', 'pink', 'blue', 'gold', 'silver', 'small', 'large', 'pack']);
const NL = new Set(['voor', 'met', 'van', 'en', 'de', 'het', 'op', 'uit', 'om', 'een', 'houten', 'zwart', 'wit', 'groen', 'roze', 'blauw', 'goud', 'klein', 'groot']);
export function engelsTitel(t) { const w = String(t || '').toLowerCase().split(/[^a-z\u00e0-\u00ff]+/).filter(Boolean); return w.filter(x => EN.has(x)).length >= 2 && !w.some(x => NL.has(x)); }
const woorden = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(w => w.length >= 3);

// Vraag uit Demand Radar: beste overeenkomst tussen een zoekterm en de producttitel.
const LIJST_GEWICHT = { rise: 1.5, coming: 1.2, products: 1.0, money: 1.0, missing: 0.8 };
export function vraagVan(it, termen) {
  const t = new Set(woorden(it.t + ' ' + (it.s || ''))); let beste = null;
  for (const x of termen || []) {
    const w = woorden(x.term); if (!w.length || !w.every(y => t.has(y) || t.has(y.replace(/s$/, '')) || t.has(y.replace(/en$/, '')))) continue;
    const kans = num(String(x.kansStijging3mnd || '').replace('%', '')) / 100;
    const s = 1 + (LIJST_GEWICHT[x.lijst] || 1) * (w.length > 1 ? 1.2 : 1) + kans + (x.vandaag === 'piek' || x.vandaag === 'stijgt' ? 0.3 : 0);
    if (!beste || s > beste.score) beste = { score: r2(s), term: x.term, lijst: x.lijst, vandaag: x.vandaag || null, kans: x.kansStijging3mnd || null };
  }
  return beste;
}

// Oordeel over een product dat al verkeer had. s = tellers van Clickmind {dv, dm, da, cart, koop}, gem = gemiddelde tikratio.
export function oordeel(s, gem) {
  const dm = num(s.dm), da = num(s.da), cart = num(s.cart), koop = num(s.koop);
  if (koop > 0) return { stand: 'presterend', waarom: koop + ' verkoop' + (koop > 1 ? 'en' : '') };
  if (cart > 0) return { stand: 'veelbelovend', waarom: cart + ' winkelwagen' + (cart > 1 ? 's' : '') + ', ' + dm + ' echte mensen' };
  if (dm >= KIES_REGELS.minEcht && gem > 0 && da / dm > gem) return { stand: 'veelbelovend', waarom: da + ' tikken op ' + dm + ' echte mensen (' + Math.round(100 * da / dm) + '%, gemiddeld ' + Math.round(100 * gem) + '%)' };
  if (gem > 0 && dm * gem >= KIES_REGELS.afVerwachtTik && da === 0) return { stand: 'af', waarom: dm + ' echte mensen, verwacht ' + r2(dm * gem) + ' tikken, kreeg er 0' };
  return { stand: 'onbeslist', waarom: dm + ' echte mensen, ' + da + ' tikken' };
}

// Drie advertenties per product: wat het is en wat het thuis kost (zelfde bedrag als de koopbalk op de productpagina).
const HAAK = { halloween: 'Klaar voor Halloween?', herfst: 'Gezellig de herfst in', sint: 'Voor in de schoen', kerst: 'Alvast voor de kerst', cadeau: 'Een cadeau dat blijft', tuin: 'Mooi voor je tuin', planten: 'Groen in huis', hobby: 'Zelf bouwen, zelf genieten' };
export function advertenties(it, thuis, thema) {
  const t = String(it.t || '').replace(/['"\u2018\u2019\u201c\u201d]/g, ''), naam = kort(t, 30), lt = num(it.lt);
  const prijsRegel = kort(eur(thuis) + ' thuisbezorgd' + (lt ? ' · ' + lt + ' dagen' : ''), 40);
  return [
    { title: naam, description: prijsRegel },
    { title: kort(HAAK[thema] || 'Nieuw in de Yoors Shop', 30), description: kort(t, 40) },
    { title: naam, description: kort(eur(thuis) + ' · geld terug binnen 14 dagen', 40) },
  ];
}

// De keuze zelf. Alles wat hij nodig heeft wordt meegegeven, zodat dit los te testen is.
//   items    catalogus (api/shop.js catalog): id, t, p, vk, fs, img, vr, lt, b, c, s
//   kaart    inkoop per product (K_KOST): { id: {c, z, m} }
//   markt    marktprijzen van de prijsradar (Demand Radar feed prices): { id: {lowSame, medSimilar, ...} }
//   termen   Demand Radar NL (lib/demandradar.js)
//   tellers  Clickmind per product: { id: {dv, dm, da, cart, koop} }
//   getest   { id: 'JJJJ-MM-DD' } eerste testdag per product
//   seizoen  it -> factor (api/shop.js seizoen), thema: it -> naam (api/shop.js themaVan)
export function kies({ items = [], kaart = {}, markt = {}, termen = [], tellers = {}, getest = {}, seizoen = () => 1, thema = () => '', vandaag, n = KIES_REGELS.n, plaatje = () => ({}), rnd = Math.random } = {}) {
  const R = KIES_REGELS, dag = vandaag || new Date().toISOString().slice(0, 10);
  const dagenGeleden = d => d ? Math.floor((Date.parse(dag) - Date.parse(d)) / 864e5) : 1e9;
  // gemiddelde tikratio over alle producten met echte mensen
  let sm = 0, sa = 0; for (const s of Object.values(tellers)) { sm += num(s.dm); sa += num(s.da); }
  const gem = sm ? sa / sm : 0;

  // oordeel over alles wat al verkeer of een testdag had
  const oordelen = {};
  for (const it of items) { const s = tellers[it.id]; if (!s && !getest[it.id]) continue; if (!s || (!num(s.dv) && !num(s.dm))) { if (getest[it.id]) oordelen[it.id] = { stand: 'onbeslist', waarom: 'nog geen bezoek', getest: getest[it.id] }; continue; } oordelen[it.id] = Object.assign(oordeel(s, gem), { getest: getest[it.id] || null, tellers: s }); }

  const reden = {}; const telReden = r => { reden[r] = (reden[r] || 0) + 1; };
  const kandidaten = [];
  for (const it of items) {
    if (!it.img) { telReden('geen foto'); continue; }
    if (engelsTitel(it.t)) { telReden('Engelse titel'); continue; }
    if (it.vr === false) { telReden('niet op voorraad'); continue; }
    const vk = it.fs ? 0 : num(it.vk), thuis = r2(num(it.p) + vk);
    if (!num(it.p) || thuis > R.maxThuis) { telReden('thuisprijs boven ' + R.maxThuis); continue; }
    const m = margeVan(it, kaart[it.id]); if (!m) { telReden('inkoop onbekend'); continue; }
    if (m.maxVerkoop < R.minMaxVerkoop) { telReden('te weinig marge voor advertenties'); continue; }
    const pr = markt[it.id] ? advies(it, kaart[it.id], markt[it.id]) : null;
    if (pr && (pr.stand === 'niet adverteren' || pr.stand === 'controleren')) { telReden('prijsradar: ' + pr.stand); continue; }
    if (getest[it.id] && dagenGeleden(getest[it.id]) < R.rustDagen) { telReden('al getest in de laatste ' + R.rustDagen + ' dagen'); continue; }
    const o = oordelen[it.id]; if (o && o.stand === 'af') { telReden('eerder afgevallen'); continue; }
    const vraag = vraagVan(it, termen);
    const same = pr && pr.markt && num(pr.markt.lowSame), sim = pr && pr.markt && num(pr.markt.medSimilar);
    // alleen adverteren wat all-in (met onze verzending) het goedkoopst is, of nergens anders te koop is (19 okt: met verzending
    // waren we bij 84% van de producten die elders te koop zijn duurder; Tegeltje Geluk €15,99 + verzending tegen €15,95 op bol)
    if (same && thuis > same) { telReden('elders goedkoper (all-in)'); continue; }
    const prijsF = same ? (thuis <= same ? 1.25 : thuis <= same * 1.05 ? 1 : 0.6) : sim ? (thuis <= sim ? 1.1 : thuis <= sim * 1.3 ? 1 : 0.8) : 1;
    const margeF = 0.5 + Math.min(1, m.maxVerkoop / 10);
    const seiz = num(seizoen(it)) || 1;
    const lt = num(it.lt), levF = !lt ? 1 : lt <= 3 ? 1.1 : lt <= 5 ? 1 : 0.75; // lang wachten kost verkoop
    const score = r2((vraag ? vraag.score : 1) * seiz * prijsF * margeF * levF);
    kandidaten.push({ it, thuis, vk, m, pr, vraag, score, band: thuis <= R.laagTot ? 'laag' : 'midden' });
  }

  // kiezen: per band op score, met spreiding over categorie en merk, en 10% verkenning
  const gekozen = [], perCat = {}, perMerk = {};
  const past = k => (perCat[k.it.c || '?'] || 0) < R.perCategorie && (perMerk[k.it.b || '?'] || 0) < R.perMerk && !gekozen.includes(k);
  const neem = (k, hoe) => { gekozen.push(k); k.hoe = hoe; perCat[k.it.c || '?'] = (perCat[k.it.c || '?'] || 0) + 1; perMerk[k.it.b || '?'] = (perMerk[k.it.b || '?'] || 0) + 1; };
  const nVerken = Math.max(1, Math.round(n * R.verkenning)), nVast = n - nVerken;
  const doel = { laag: Math.round(nVast * R.aandeelLaag), midden: nVast - Math.round(nVast * R.aandeelLaag) };
  for (const band of ['laag', 'midden']) { let k = 0; for (const x of kandidaten.filter(c => c.band === band).sort((a, b) => b.score - a.score)) { if (k >= doel[band]) break; if (past(x)) { neem(x, 'score'); k++; } } }
  for (const x of kandidaten.sort((a, b) => b.score - a.score)) { if (gekozen.length >= nVast) break; if (past(x)) neem(x, 'score'); } // band te klein: aanvullen
  const rest = kandidaten.filter(c => !gekozen.includes(c));
  while (gekozen.length < n && rest.length) { const i = Math.floor(rnd() * rest.length); const x = rest.splice(i, 1)[0]; if (past(x)) neem(x, 'verkenning'); }

  const uit = gekozen.map(k => {
    const th = thema(k.it);
    return { pid: k.it.id, titel: k.it.t, merk: k.it.b || null, categorie: k.it.c || null, prijs: num(k.it.p), verzending: k.vk, thuis: k.thuis, levertijd: num(k.it.lt) || null, band: k.band, marge: k.m.marge, maxAdvPerVerkoop: k.m.maxVerkoop, vraag: k.vraag, markt: k.pr && k.pr.markt ? { zelfde: k.pr.markt.lowSame || null, vergelijkbaar: k.pr.markt.medSimilar || null } : null, seizoen: seizoen(k.it), thema: th, score: k.score, hoe: k.hoe, advertenties: advertenties(k.it, k.thuis, th), ...plaatje(k.it.id) };
  });
  const lijst = s => Object.entries(oordelen).filter(([, o]) => o.stand === s).map(([pid, o]) => ({ pid, waarom: o.waarom, getest: o.getest || null }));
  return { dag, n: uit.length, regels: R, gemiddeldeTikratio: r2(gem), kandidaten: kandidaten.length, afgewezen: reden, gekozen: uit, presterend: lijst('presterend'), veelbelovend: lijst('veelbelovend'), af: lijst('af'), onbeslist: lijst('onbeslist') };
}
