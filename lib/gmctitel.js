// Titelproef gratis vermeldingen Kadoly (28 nov 2026, Henkjan: "Optimaliseer GMC gratis zodat meer verkeer .").
// Waarom: Google kiest gratis vermeldingen vooral op de titel. De titels van de winkel beginnen vaak met een bijvoeglijk naamwoord
// en eindigen met sfeerwoorden ("Rond Tafelhaard Zand voor Gezellige Winteravonden"); de zoekterm staat dan niet voorop.
// Hoe: een aanvullende bron in Merchant Center 5876502305 ("Kadoly titels", vóór de hoofdfeed in de regel) geeft alleen een nieuwe titel
// voor de helft van de producten (arm b, vaste helft op het product-id). De andere helft (arm a) houdt de titel van de winkel en is de controle.
// De titels staan in data/kadoly-gmc-titels.json, geschreven uit de bestaande titel, het merk en de soort: niets erbij verzonnen.
// Oordeel: gratis vertoningen en kliks per 100 producten, arm b tegen arm a, 14 dagen na de start (stand: /api/shop?op=gmctitels&vorm=stand).
import T from '../data/kadoly-gmc-titels.json' with { type: 'json' };

export const START = T.start;
export const basis = id => String(id).split('-')[0];
// vaste helft per product (FNV-1a op het basis-id), zelfde uitkomst elke dag en op elke server
export const arm = id => { let h = 2166136261; for (const c of basis(id)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 2 ? 'b' : 'a'; };
export const titels = () => T.titels || {};
export const controle = () => T.controle || [];

// een titel mag de deur uit als hij kort genoeg is, geen gedachtestreepje, prijs of reclame heeft en niet schreeuwt
const VERBODEN = /[—–!€]|\bgratis\b|\bkorting\b|\bactie\b|\bbeste\b|\bnu\b/i;
export function titelOk(t) {
  const s = String(t || '').trim(); if (s.length < 12 || s.length > 150) return false; if (VERBODEN.test(s)) return false;
  const letters = s.replace(/[^A-Za-zÀ-ÿ]/g, ''); if (letters.length && s.replace(/[^A-Z]/g, '').length / letters.length > 0.5) return false; return true; // schreeuwen: meer dan de helft hoofdletters (een merk als GLAM & GLORY mag)
}

const q = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
// regels voor de aanvullende bron: alleen ids die precies zo in de feed van de winkel staan, alleen arm b
export function csv(feedIds) {
  const t = titels(), inFeed = new Set(feedIds || []); const rijen = [];
  for (const [id, titel] of Object.entries(t)) { if (arm(id) !== 'b' || !titelOk(titel)) continue; if (inFeed.size && !inFeed.has(id)) continue; rijen.push(q(id) + ',' + q(titel)); }
  return { tekst: 'id,title\n' + rijen.join('\n') + (rijen.length ? '\n' : ''), rijen: rijen.length };
}

// kandidaten om een titel voor te schrijven: op voorraad, geen variant in de feed, marge minstens minMarge, arm b eerst
export function kandidaten(items, feedIds, { minMarge = 5, n = 400 } = {}) {
  const inFeed = new Set(feedIds || []), t = titels();
  return (items || []).filter(it => it && it.id && !String(it.id).includes('-') && (!inFeed.size || inFeed.has(String(it.id))) && it.vr !== false && it.mg != null && Number(it.mg) >= minMarge)
    .map(it => ({ id: String(it.id), arm: arm(it.id), heeft: !!t[it.id], t: String(it.t || ''), b: String(it.b || ''), c: String(it.c || ''), s: String(it.s || ''), p: Number(it.p) || 0, mg: Number(it.mg) }))
    .sort((a, b) => (a.arm === 'b' ? 0 : 1) - (b.arm === 'b' ? 0 : 1) || b.mg - a.mg).slice(0, n);
}

// prest: { offerId: {gk,gv,bk,bv} } uit Merchant Center (lib/merchant.js prestaties), varianten tellen bij hun basis
export function stand(prest) {
  const b = new Set(Object.keys(titels()).filter(id => arm(id) === 'b')), a = new Set(controle().filter(id => arm(id) === 'a'));
  const som = set => { const o = { producten: set.size, gratisVert: 0, gratisKliks: 0, betaaldVert: 0 }; for (const [id, x] of Object.entries(prest || {})) { if (!set.has(basis(id))) continue; o.gratisVert += x.gv || 0; o.gratisKliks += x.gk || 0; o.betaaldVert += x.bv || 0; } o.vertPer100 = o.producten ? Math.round(1000 * o.gratisVert / o.producten) / 10 : 0; o.kliksPer100 = o.producten ? Math.round(1000 * o.gratisKliks / o.producten) / 10 : 0; return o; };
  const dag = Math.floor((Date.now() - Date.parse(START + 'T00:00:00Z')) / 864e5);
  const B = som(b), A = som(a);
  const oordeel = dag < 14 ? 'loopt (dag ' + Math.max(0, dag) + ' van 14)' : B.vertPer100 > A.vertPer100 * 1.2 && B.gratisVert >= 30 ? 'raak: nieuwe titels krijgen meer gratis vertoningen, ook voor arm a doorvoeren' : A.vertPer100 >= B.vertPer100 ? 'mis: winkeltitels doen het even goed of beter' : 'onduidelijk: verschil te klein';
  return { start: START, dag, nieuw: B, controle: A, oordeel };
}
