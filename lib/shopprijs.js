// Slimste prijs per product voor de Yoors Shop: zo veel mogelijk verkoop met zo veel mogelijk marge.
// Marktprijzen komen van Demand Radar (per product bol.com, Amazon.nl en Amazon.de; AI zegt of het hetzelfde product is
// of een vergelijkbaar), inkoop en verzending van de datapagina van de shop (K_KOST, lib/shopmarge.js).
//
// Rekenregels (bedragen in euro, totaal = productprijs + verzending die de klant betaalt):
//   marge(totaal)   = totaal / 1,21 − inkoop − onze verzending − (2,9% × totaal + 0,30)
//   ondergrens      = het laagste totaal met marge ≥ € 3 én ≥ 20% van de omzet zonder btw
//   zelfde product  → net onder de goedkoopste aanbieder (2% en minstens € 0,50 lager), afgerond op ,95
//   alleen vergelijkbaar → op de middelste prijs van de vergelijkbare producten, afgerond op ,95, maar hooguit 15% omlaag per keer
//   lukt dat niet boven de ondergrens: op de ondergrens als dat hooguit 5% boven de goedkoopste is, anders niet adverteren
// Zonder verkoopcijfers is "maximale verkoop" hier: goedkoper dan of gelijk aan de markt. Zodra er verkopen zijn, leert de lus bij.
import { K_KOST } from './shopmarge.js';

const BTW = 1.21, FEE = 0.029, VAST = 0.30;
const r2 = v => Math.round(v * 100) / 100;
const eu = v => '€ ' + Number(v).toFixed(2).replace('.', ',');
const neg5 = v => Math.floor(v - 0.95) + 0.95;              // hoogste x,95 die ≤ v is
const pos5 = v => Math.ceil(v - 0.95) + 0.95;               // laagste x,95 die ≥ v is
export const margeBij = (totaal, c, z) => r2(totaal / BTW - c - z - (FEE * totaal + VAST));
export function ondergrens(c, z) { return r2(Math.max((c + z + VAST + 3) / (1 / BTW - FEE), (c + z + VAST) / (1 / BTW - FEE - 0.2 / BTW))); }

export function advies(it, k, m) {
  const p = Number(it.p) || 0, vk = Number(it.vk) || 0; if (!p || !k || k.c == null || !m) return null;
  const c = k.c, z = k.z || 0, nu = r2(p + vk), min = ondergrens(c, z);
  const same = m.lowSame, sim = m.medSimilar;
  let doel = null, waarom = '', stand = 'geen vergelijking';
  if (same) { doel = neg5(same - Math.max(0.5, same * 0.02)); waarom = `net onder de goedkoopste aanbieder van hetzelfde product (${eu(same)})`; }
  else if (sim) { // alleen vergelijkbaar: voorzichtig, hooguit 15% omlaag per keer (het is niet precies hetzelfde product)
    doel = neg5(Math.max(sim + 0.04, nu * 0.85)); waarom = doel > sim + 0.5 ? `richting de middelste prijs van vergelijkbare producten (${eu(sim)}), hooguit 15% omlaag per keer` : `op de middelste prijs van vergelijkbare producten (${eu(sim)})`; }
  if (doel == null) return { id: it.id, t: it.t, nu, p, vk, stand, marge: margeBij(nu, c, z), min };
  if (doel < min) {
    if (same && min <= same * 1.05) { doel = pos5(min); waarom = `zo laag als de marge toelaat; de goedkoopste aanbieder vraagt ${eu(same)}`; }
    else return { id: it.id, t: it.t, nu, p, vk, stand: 'niet adverteren', waarom: `anderen verkopen dit voor ${eu(same || sim)}; met onze inkoop is ${eu(min)} het minimum`, marge: margeBij(nu, c, z), min, markt: m };
  }
  const nieuwP = r2(Math.max(0.95, doel - vk)), nieuw = r2(nieuwP + vk);
  stand = Math.abs(nieuw - nu) < 0.5 ? 'goed zo' : nieuw > nu ? 'omhoog' : 'omlaag';
  return { id: it.id, t: it.t, nu, p, vk, nieuwP, nieuw, stand, waarom, marge: margeBij(nu, c, z), margeNieuw: margeBij(nieuw, c, z), min, markt: m };
}

export async function prijsStand(kv, items) {
  let m = null; try { const r = await fetch('https://demandradar-ivory.vercel.app/api/feed?shop=yoors&cc=NL&prices=1', { signal: AbortSignal.timeout(8000) }); if (r.ok) m = await r.json(); } catch (e) {}
  const kaart = (await kv.get(K_KOST)) || {}, markt = (m && m.items) || {};
  const rows = (items || []).map(it => advies(it, kaart[it.id], markt[it.id])).filter(Boolean);
  const tel = s => rows.filter(r => r.stand === s).length;
  // eerst wat het meest oplevert: extra marge bij omhoog, prijsverschil bij omlaag
  const winst = r => (r.stand === 'omhoog' ? (r.margeNieuw - r.marge) * 2 : r.stand === 'omlaag' ? r.nu - r.nieuw : r.stand === 'niet adverteren' ? 0.5 : 0);
  rows.sort((a, b) => winst(b) - winst(a));
  return { at: m && m.at, vergeleken: rows.length, catalogus: (items || []).length, metMarkt: Object.keys(markt).length, omhoog: tel('omhoog'), omlaag: tel('omlaag'), goed: tel('goed zo'), nietAdverteren: tel('niet adverteren'), geen: tel('geen vergelijking'), rows };
}

export function prijsCsv(stand) {
  const q = s => `"${String(s == null ? '' : s).replace(/"/g, '""')}"`;
  return ['id,titel,prijs_nu,verzending_klant,advies_prijs,stand,marge_nu,marge_advies,bol,amazon_nl,amazon_de,waarom',
    ...stand.rows.filter(r => r.stand !== 'geen vergelijking').map(r => { const mk = r.markt || {}, s = mk.same || {}, sm = mk.similar || {}; const b = k => (s[k] ? s[k].p : sm[k] ? '~' + sm[k].median : '');
      return [q(r.id), q(r.t), r.p, r.vk, r.nieuwP == null ? '' : r.nieuwP, q(r.stand), r.marge, r.margeNieuw == null ? '' : r.margeNieuw, q(b('bol')), q(b('amzNl')), q(b('amzDe')), q(r.waarom || '')].join(','); })].join('\n');
}
