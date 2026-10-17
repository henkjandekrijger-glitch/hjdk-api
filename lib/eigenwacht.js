// Clickmind kijkt mee naar de campagnes die op eigen pagina's landen (Henkjan 17 okt: "Zorg dat Clickmind ook zeer goed naar de
// Yoors Shop-campagnes kijkt, en ook naar de todayin-campagnes, veel NL-verkeer").
// Draait in de uurwacht (lib/wachtuur.js, elk uur op :47). Alleen meten en melden, nooit stoppen of bod/budget wijzigen.
//
// Per campagne (PropellerAds en Mondiad, UTC-dag, niet de Amazon-/go-campagnes):
//   afgerekende kliks en kosten (netwerk)  ->  bezoeken en echte mensen (Clickmind mm:c, cm.js op yoo.rs, todayin en mylevel)
//   ->  uitkomsten (mm:cu: echt, actie, aanmelding, koop; mm:cx: todayin-acties en -aanmeldingen per campagne, elk uur via lib/extern.js).
// Per project (Yoors Shop, todayin, MyLevel) een totaal, en NL apart (campagnenaam met NL).
// Yoors Shop daarnaast per uur de hele trechter (lib/shopuur.js): aankomst, echt, winkelwagen, afrekenen, betaling, verkoop.
// Alarm (een keer per dag per soort, Telegram via de uurwacht):
//   - kapot: 100+ kliks en 0 bezoeken terwijl het project wel gemeten wordt (pagina of meting stuk);
//   - aankomst: 100+ kliks en minder dan 30% komt aan;
//   - geld zonder mens: $1+ kosten, 20+ bezoeken en geen enkel echt mens;
//   - todayin: $2+ kosten en 0 aanmeldingen, of meer dan 3x het doel ($0,10 per lid, Henkjan) bij $3+;
//   - Yoors Shop: rode lekken van het laatste hele uur (aankomst, betaling) en elke verkoop (goed nieuws).
import { uurStand } from './shopuur.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const r2 = x => Math.round(N(x) * 100) / 100;
const pct = (a, b) => (b ? Math.round(1000 * a / b) / 10 : null);
export const DOEL_LID = 0.10;
export const EG = { minKliks: 100, aankomst: 30, geldZonderMens: 1, minBezoek: 20, tiGeenLid: 2, tiDuurFactor: 3, tiDuurMin: 3 };

export function projectVan(naam) {
  const s = String(naam || '');
  if (/^AMZ\b|\bMD AMZ\b|\bBOEK\b|\|\s*go\s*$|\bGO\b/i.test(s)) return 'amazon';
  if (/SHOP-LUS|YOORS/i.test(s)) return 'shop';
  if (/TODAYIN|FOR-YOU|DAGVRAAG|QUIZ|PRAISY|\bSPEL\b|MOONLIGHT|ONTHULLING|KETTING/i.test(s)) return 'todayin';
  if (/MYLEVEL/i.test(s)) return 'mylevel';
  return 'overig';
}
export const isNL = naam => /\bNL\b|NL-BE|\bnederland/i.test(String(naam || ''));
const NAAM = { shop: 'Yoors Shop', todayin: 'todayin', mylevel: 'MyLevel', overig: 'overig' };

async function hash(kv, k) { const o = {}; try { const h = await kv.raw(['HGETALL', k]); for (let i = 0; h && i < h.length; i += 2) o[h[i]] = N(h[i + 1]); } catch (e) {} return o; }
function perCamp(h) { const o = {}; for (const [f, v] of Object.entries(h)) { const p = f.split('|'); if (p.length < 3) continue; const k = p[0] + '|' + p[1], veld = p.slice(2).join('|'); const x = o[k] || (o[k] = {}); x[veld] = N(x[veld]) + v; } return o; }

export async function eigenPaginas(kv, d, { pa = [], mo = [] } = {}) {
  const [c, cu, cx] = await Promise.all([hash(kv, 'mm:c:' + d), hash(kv, 'mm:cu:' + d), hash(kv, 'mm:cx:' + d)]);
  const C = perCamp(c), U = perCamp(cu), X = perCamp(cx);
  const camps = [], proj = {}, alarmen = [];
  for (const [net, lijst] of [['propeller', pa], ['mondiad', mo]]) for (const r of lijst) {
    const p = projectVan(r.naam); if (p === 'amazon' || (!r.kliks && !r.kosten)) continue;
    const k = net + '|' + r.camp, m = C[k] || {}, u = U[k] || {}, x = X[k] || {};
    const c1 = { net, camp: r.camp, naam: String(r.naam || '').slice(0, 90), project: p, nl: isNL(r.naam), kliks: r.kliks, kosten: r2(r.kosten), bezoek: N(m.n), mens: N(m.mens), dc: N(m.dc), actie: N(u.actie) + N(x.actie), aanmelding: N(u.aanmelding) + N(x.aanmelding), koop: N(u.koop) };
    c1.aankomst = pct(c1.bezoek, c1.kliks); c1.mensPct = pct(c1.mens, c1.bezoek); c1.perLid = c1.aanmelding ? r2(c1.kosten / c1.aanmelding) : null; c1.perMens = c1.mens ? Math.round(1000 * c1.kosten / c1.mens) / 1000 : null;
    camps.push(c1);
    for (const sl of [p, p + (c1.nl ? '|NL' : '|rest')]) { const t = proj[sl] || (proj[sl] = { kliks: 0, kosten: 0, bezoek: 0, mens: 0, actie: 0, aanmelding: 0, koop: 0, campagnes: 0, gemeten: 0 }); for (const f of ['kliks', 'kosten', 'bezoek', 'mens', 'actie', 'aanmelding', 'koop']) t[f] += c1[f]; t.campagnes++; if (c1.bezoek) t.gemeten++; }
  }
  for (const t of Object.values(proj)) { t.kosten = r2(t.kosten); t.aankomst = pct(t.bezoek, t.kliks); t.mensPct = pct(t.mens, t.bezoek); t.perLid = t.aanmelding ? r2(t.kosten / t.aanmelding) : null; t.perMens = t.mens ? Math.round(1000 * t.kosten / t.mens) / 1000 : null; }

  // alarmen per campagne
  for (const c1 of camps) {
    const pr = proj[c1.project] || {}, label = NAAM[c1.project] + (c1.nl ? ' NL' : '') + ' ' + c1.net + ' ' + c1.camp + ' (' + c1.naam.slice(0, 60) + ')';
    if (c1.kliks >= EG.minKliks && c1.bezoek === 0 && pr.gemeten > 0) alarmen.push({ soort: 'eigen', sleutel: 'kapot|' + c1.net + '|' + c1.camp, tekst: label + ': ' + c1.kliks + ' kliks afgerekend ($' + c1.kosten + ') en 0 bezoeken gemeten. Pagina of meting kapot?' });
    else if (c1.kliks >= EG.minKliks && c1.bezoek > 0 && c1.aankomst < EG.aankomst) alarmen.push({ soort: 'eigen', sleutel: 'aankomst|' + c1.net + '|' + c1.camp, tekst: label + ': maar ' + c1.aankomst + '% van ' + c1.kliks + ' afgerekende kliks kwam aan (' + c1.bezoek + ' bezoeken).' });
    if (c1.kosten >= EG.geldZonderMens && c1.bezoek >= EG.minBezoek && c1.mens === 0) alarmen.push({ soort: 'eigen', sleutel: 'geenmens|' + c1.net + '|' + c1.camp, tekst: label + ': $' + c1.kosten + ' vandaag, ' + c1.bezoek + ' bezoeken en geen enkel echt mens.' });
    if (c1.project === 'todayin') {
      if (c1.kosten >= EG.tiGeenLid && c1.aanmelding === 0) alarmen.push({ soort: 'todayin', sleutel: 'geenlid|' + c1.net + '|' + c1.camp, tekst: label + ': $' + c1.kosten + ' vandaag en nog geen aanmelding (' + c1.mens + ' echte mensen).' });
      else if (c1.kosten >= EG.tiDuurMin && c1.perLid > EG.tiDuurFactor * DOEL_LID) alarmen.push({ soort: 'todayin', sleutel: 'duurlid|' + c1.net + '|' + c1.camp, tekst: label + ': $' + c1.perLid + ' per lid (' + c1.aanmelding + ' leden voor $' + c1.kosten + '), doel $' + DOEL_LID.toFixed(2) + '.' });
    }
  }

  // Yoors Shop per uur: hele trechter, rode lekken van het laatste hele uur, en elke verkoop
  let winkel = null;
  try {
    const uren = Math.max(2, new Date().getUTCHours() + 1);
    const st = await uurStand(kv, Math.min(uren, 24));
    const vorig = st.rijen[1] || null;
    winkel = { totaalVandaag: st.totaal, pa: st.pa, laatsteUur: vorig ? { uur: vorig.uur, paKliks: vorig.paKliks, paKosten: vorig.paKosten, aangekomen: vorig.aangekomen, echt: vorig.echt, cart: N(vorig.cart), koop: N(vorig.koop), pctAan: vorig.pctAan, pctEcht: vorig.pctEcht, lekken: vorig.lekken } : null };
    if (vorig) for (const l of vorig.lekken || []) if (l.ernst === 'rood') alarmen.push({ soort: 'shop', sleutel: 'shoplek|' + l.waar + '|' + d, tekst: 'Yoors Shop ' + vorig.uur + ': ' + l.tekst });
    if (N(st.totaal.koop) > 0) alarmen.push({ soort: 'shop', sleutel: 'shopkoop|' + d + '|' + N(st.totaal.koop), tekst: 'Yoors Shop: ' + st.totaal.koop + ' verkoop vandaag, samen €' + r2(st.totaal.omzet) + ' (' + st.totaal.cart + ' winkelwagens, ' + st.totaal.echt + ' echte mensen).' });
  } catch (e) { winkel = { fout: String(e.message || e).slice(0, 120) }; }

  camps.sort((a, b) => b.kosten - a.kosten);
  return { projecten: proj, campagnes: camps.slice(0, 60), winkel, alarmen, doelLid: DOEL_LID };
}
