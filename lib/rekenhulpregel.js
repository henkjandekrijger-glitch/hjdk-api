// Vaste regel (Henkjan 19 nov 2026): "Als rekenhulp nodig of mogelijk altijd toevoegen !"
// Elke keuzehulp of gids waar iets te berekenen valt (kosten, maat, maandlast, besparing, terugverdientijd, hoeveel) krijgt een rekenhulp; een grote
// "berekenen/calculator/rechner"-zoekterm uit Demand Radar krijgt een eigen rekenhulp. De planners (api/kzmaak.js en api/wtbmaak.js) krijgen REGEL in hun
// prompt en geven per onderwerp een veld rekenhulp; elk onderwerp met een rekenhulp komt hier op de open lijst (KV kz:rekenhulp:open), zodat een chat hem
// bouwt volgens het patroon van /hypotheek-berekenen (lib/hypotheek.js: pure rekenkern met test tegen een officieel voorbeeld, normen met bron en datum).
// Lijst lezen: /api/keuze-tools?tool=hyp&op=rekenopen
import { kv } from './db.js';

export const REGEL_NL = 'Vaste regel van Henkjan (19 nov 2026, "Als rekenhulp nodig of mogelijk altijd toevoegen !"): valt er bij een onderwerp iets te berekenen (kosten, maat, maandlast, verbruik, besparing, terugverdientijd, hoeveel), geef dan in het veld rekenhulp in een korte zin wat de rekenhulp uitrekent; anders laat je het veld leeg. Een zoekterm met berekenen, calculator, rekenen of hoeveel met veel volume is zelf een onderwerp voor een rekenhulp.';
export const REGEL_EN = 'Fixed rule from the owner (19 Nov 2026, "If a calculator is needed or possible, always add it!"): if a topic involves something to calculate (cost, size, monthly payment, consumption, savings, payback time, how much), put a short sentence in the field calculator saying what it calculates; otherwise leave it empty. A high-volume search term with calculate, calculator, Rechner or berechnen is itself a topic for a calculator.';
const SLEUTEL = 'kz:rekenhulp:open', REKEN = /bereken|calculat|rechner|berechn|rekenhulp|hoeveel|how much|wie viel/i;
export const heeftRekenterm = t => REKEN.test(String(t || ''));

// onderwerpen met een rekenhulp op de open lijst zetten (hoogstens 80, nieuwste eerst, geen dubbele slug per site)
export async function rekenhulpOpen(site, lijst) {
  const nieuw = (lijst || []).map(p => ({ site, slug: String(p.slug || '').slice(0, 80), term: String(p.term || '').slice(0, 80), wat: String(p.rekenhulp || p.calculator || (heeftRekenterm(p.term) ? 'zoekterm vraagt om rekenen: ' + p.term : '')).slice(0, 200) })).filter(p => p.slug && p.wat);
  if (!nieuw.length) return 0;
  const oud = (await kv.get(SLEUTEL).catch(() => null)) || [];
  const dag = new Date().toISOString().slice(0, 10), alle = nieuw.map(p => Object.assign(p, { dag })).concat(oud.filter(o => !nieuw.some(n => n.site === o.site && n.slug === o.slug))).slice(0, 80);
  await kv.set(SLEUTEL, alle).catch(() => {}); return nieuw.length;
}
export async function rekenhulpOpenLijst() {
  const l = (await kv.get(SLEUTEL).catch(() => null)) || [];
  return { ok: true, regel: REGEL_NL, voorbeeld: 'https://keuzehulp.best/hypotheek-berekenen (lib/hypotheek.js, lib/hypotheek-kern.js, scripts/test-hypotheek.mjs)', n: l.length, open: l };
}
