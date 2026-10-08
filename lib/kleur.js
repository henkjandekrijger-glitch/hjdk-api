// Kleurtest-tellers ophalen (5 min in geheugen), voor colourHead() en voor de statuspagina's.
import { kv } from './db.js';
import { PALETTES, colourHead } from './look.js';
const mem = {};
export async function colourCounts(prefix, n) {
  const c = mem[prefix]; if (c && Date.now() - c.at < 300000) return c.v;
  let r = []; try { r = await kv.mget(...Array.from({ length: n }, (_, i) => ['c:col-' + prefix + '-v' + i + '-imp', 'c:col-' + prefix + '-v' + i + '-clk']).flat()); } catch (e) {}
  const v = Array.from({ length: n }, (_, i) => [Number(r[i * 2]) || 0, Number(r[i * 2 + 1]) || 0]); mem[prefix] = { at: Date.now(), v }; return v;
}
export async function colourTag(site, prefix, clickSel, dark) { const pal = PALETTES[site]; return colourHead(prefix, pal, await colourCounts(prefix, pal.length), clickSel, dark); }
export async function colourReport(site, prefix) {
  const pal = PALETTES[site]; mem[prefix] = null; const v = await colourCounts(prefix, pal.length);
  return pal.map((p, i) => ({ kleur: p.naam, hex: p.acc, weergaven: v[i][0], winkelkliks: v[i][1], klikPct: v[i][0] ? Math.round(1000 * v[i][1] / v[i][0]) / 10 : null }));
}
