// Bundel van de dag voor Kadoly (17 nov 2026, Henkjan: "experimenteer met een bundel die kunnen we klaar zetten iedere dag").
// Waarom: de meeste producten leveren per bestelling € 0 tot € 2 op, terwijl een verkoop via TikTok rond € 11 aan advertenties kost.
// Twee of drie producten van hetzelfde merk gaan in één zending: de klant betaalt één keer verzending (dat is zijn besparing),
// wij betalen één keer advertentiekosten en tellen de marges van alle producten bij elkaar op.
//
// Rekenregels (bedragen in euro, totaal = productprijs + verzending die de klant betaalt):
//   los_i      = wat de klant los kwijt is: onze prijs met verzending, of de goedkoopste aanbieder van hetzelfde product als die lager is
//   deel_i     = los_i - verzending_i (het product zonder verzending, op marktprijs)
//   bundel     = (som deel_i) x (1 - KORTING) + één keer verzending (de hoogste van de set), afgerond op ,95 omlaag
//   marge      = bundel / 1,21 - som inkoop - onze verzending (één zending) - (2,9% x bundel + 0,30)
//                onze verzending = de hoogste bekende van de set, anders de verzending die de klant betaalt zonder btw
//   eisen      : marge >= MIN_MARGE, de klant bespaart minstens MIN_BESPAAR tegenover los bij ons, en de set is nooit duurder
//                dan alles los bij de goedkoopste aanbieder; op voorraad, met foto, levertijd hooguit MAX_LEVERTIJD dagen
//   impuls     : setprijs hooguit MAX_TOTAAL (TikTok koopt op impuls; eerste proef 17 nov gaf 3 kandelaars voor EUR 77,95)
//   herhalen   : een product dat in de laatste NIET_HERHALEN_DAGEN in een bundel zat telt zwaar af; dezelfde set nooit opnieuw
export const BUNDEL_REGEL = { KORTING: 0.05, MIN_MARGE: 15, MIN_BESPAAR: 0.10, MAX_PER_MERK: 24, MAX_LEVERTIJD: 7, NIET_HERHALEN_DAGEN: 7, MAX_TOTAAL: 65 };
const KERST = ['kerst', 'advent', 'kerstbal', 'kerstboom', 'kaars', 'lantaarn', 'winter', 'sneeuw', 'christmas', 'xmas', 'sinterklaas', 'piek', 'krans'];
const BTW = 1.21, FEE = 0.029, VAST = 0.30;
const r2 = v => Math.round(v * 100) / 100;
const neg5 = v => Math.floor(v - 0.95) + 0.95;
const num = v => Number(v) || 0;

// Thema per seizoen; null = alles. Vaste woorden kunnen per dag worden gezet (kv hjdk:shop:bundel:thema).
export function themaVan(dag) { const md = String(dag || '').slice(5, 10); return md >= '11-01' && md <= '12-24' ? KERST : null; }
export const bundelCode = dag => 'b' + String(dag).replace(/-/g, '');

// Kandidaten voor een set: op voorraad, met merk, foto, inkoop en levertijd binnen de grens; thema = lijst woorden of null (alles).
export function bundelKandidaten(items, kaart, markt, thema) {
  const kand = [];
  for (const it of items || []) {
    if (it.vr === false || !it.b || !it.img || !(num(it.p) > 0)) continue; if (it.lt != null && num(it.lt) > BUNDEL_REGEL.MAX_LEVERTIJD) continue;
    const k = kaart[it.id]; if (!k || k.c == null) continue; // z = 0 in de kostenkaart betekent onbekend (17 nov: tafelhaard kwam met 0 op 8,34 marge tegen 1,07 volgens de shop); dan rekent rekenSet() met de verzending die de klant betaalt
    if (thema) { const t = (it.t + ' ' + (it.c || '') + ' ' + (it.s || '')).toLowerCase(); if (!thema.some(w => t.includes(w))) continue; }
    const m = markt[it.id] || null, vk = it.fs ? 0 : num(it.vk), nu = r2(num(it.p) + vk);
    const los = m && m.lowSame ? r2(Math.min(nu, m.lowSame)) : nu, deel = r2(los - vk); if (deel <= 0) continue;
    kand.push({ id: it.id, t: it.t, b: it.b, img: it.img, nu, los, deel, vk, c: num(k.c), z: num(k.z) > 0 ? num(k.z) : null, same: m && m.lowSame ? m.lowSame : null, interesse: num(it.v) + 3 * num(it.f) });
  }
  return kand;
}

// Prijs en marge van een set (zie de rekenregels bovenaan).
export function rekenSet(set) {
  const vk = Math.max(...set.map(x => x.vk)), zs = set.map(x => x.z).filter(v => v != null), z = zs.length ? Math.max(...zs) : vk / BTW;
  const som = set.reduce((a, x) => a + x.deel, 0), losOns = r2(set.reduce((a, x) => a + x.nu, 0)), losMarkt = r2(set.reduce((a, x) => a + x.los, 0));
  const totaal = neg5(som * (1 - BUNDEL_REGEL.KORTING) + vk), marge = r2(totaal / BTW - set.reduce((a, x) => a + x.c, 0) - z - (FEE * totaal + VAST));
  return { totaal, marge, verzending: vk, losOns, losMarkt, besparing: r2(losOns - totaal), besparingPct: losOns > 0 ? r2((losOns - totaal) / losOns) : 0 };
}
export const setGoed = (r, maxTotaal) => !(r.totaal > (maxTotaal || BUNDEL_REGEL.MAX_TOTAAL) || r.marge < BUNDEL_REGEL.MIN_MARGE || r.besparingPct < BUNDEL_REGEL.MIN_BESPAAR || r.totaal > r.losMarkt);

// Alle sets van 2 of 3 producten van hetzelfde merk die de regels halen, beste eerst. score = marge + halve besparing + interesse,
// min 8 per product dat kort geleden al in een set zat, min 2 voor een set van 3 (bij gelijke marge liever de kleinere set).
export function geldigeSets(kand, opties = {}) {
  const recent = new Set(opties.recent || []), sets = new Set(opties.sets || []), uit = new Set(opties.uitsluiten || []);
  const perMerk = {}; kand.forEach(x => { if (!uit.has(x.id)) (perMerk[x.b] = perMerk[x.b] || []).push(x); });
  const goed = []; let bekeken = 0;
  for (const [merk, lijst] of Object.entries(perMerk)) {
    if (lijst.length < 2) continue;
    const L = lijst.sort((a, b) => (b.deel / BTW - b.c) - (a.deel / BTW - a.c)).slice(0, BUNDEL_REGEL.MAX_PER_MERK);
    const sets2 = []; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { sets2.push([L[i], L[j]]); for (let k = j + 1; k < L.length; k++) sets2.push([L[i], L[j], L[k]]); }
    for (const set of sets2) {
      bekeken++; const sleutel = set.map(x => x.id).sort().join(','); if (sets.has(sleutel)) continue;
      const r = rekenSet(set); if (!setGoed(r, opties.maxTotaal)) continue;
      const score = r.marge + 0.5 * r.besparing + Math.log1p(set.reduce((a, x) => a + x.interesse, 0)) - 8 * set.filter(x => recent.has(x.id)).length - (set.length === 3 ? 2 : 0);
      goed.push(Object.assign({ merk, sleutel, items: set, score: r2(score) }, r));
    }
  }
  goed.sort((a, b) => b.score - a.score);
  return { goed, bekeken, merken: Object.values(perMerk).filter(l => l.length > 1).length };
}

export function kiesBundel(items, kaart, markt, opties = {}) {
  const thema = opties.thema === undefined ? themaVan(opties.dag) : opties.thema;
  const kand = bundelKandidaten(items, kaart, markt, thema);
  const g = geldigeSets(kand, opties);
  return { beste: g.goed[0] || null, kandidaten: kand.length, merken: g.merken, bekeken: g.bekeken, voldoen: g.goed.length, thema: thema ? thema.slice(0, 4).join(', ') : 'alles' };
}

// Wat de shop nodig heeft (openbaar, zonder inkoop of marge): de regels tellen op tot het totaal min verzending.
export function bundelOpenbaar(b) {
  if (!b) return null; const zonder = r2(b.totaal - b.verzending), somDeel = b.items.reduce((a, x) => a + x.deel, 0); let rest = zonder;
  const regels = b.items.map((x, i) => { const p = i === b.items.length - 1 ? r2(rest) : r2(zonder * x.deel / somDeel); rest = r2(rest - p); return { id: x.id, titel: x.t, img: x.img, aantal: 1, prijs: p }; });
  return { code: b.code, dag: b.dag, geldigTot: b.geldigTot, merk: b.merk, titel: b.titel, regels, verzending: b.verzending, totaal: b.totaal, losBijOns: b.losOns, besparing: b.besparing };
}

export function bundelTekst(b, info) {
  if (!b) return 'Geen bundel vandaag: geen set van hetzelfde merk haalt EUR ' + BUNDEL_REGEL.MIN_MARGE + ' marge met minstens ' + Math.round(BUNDEL_REGEL.MIN_BESPAAR * 100) + '% voordeel voor de klant' + (info ? ` (${info.kandidaten} producten in het thema, ${info.merken} merken met 2 of meer, ${info.bekeken} sets bekeken).` : '.');
  return `Bundel ${b.code} (${b.dag}, ${b.merk}): ${b.items.map(x => x.t).join(' + ')}\n` +
    `Setprijs EUR ${b.totaal.toFixed(2)} met één keer verzending; los bij ons EUR ${b.losOns.toFixed(2)}, de klant bespaart EUR ${b.besparing.toFixed(2)} (${Math.round(b.besparingPct * 100)}%).\n` +
    `Wij houden over: EUR ${b.marge.toFixed(2)} per bestelling (inkoop, één zending en betaalkosten eraf).\n` +
    `Shop: https://kadoly.com/bundel/${b.code}   Advertenties: https://go.kadoly.com/shop?bundel=${b.code}&utm_source=tiktok&campaignid=__CAMPAIGN_ID__&creativeid=__CID__`;
}
