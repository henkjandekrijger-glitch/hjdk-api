export const LOG = [];
let n = 0;
export async function proefBeslis(kv, { site, ctx }) { n++; return { ok: true, aan: true, site, pid: ('a' + n).padStart(12, '0'), d: '2026-11-20', r: 1, v: { kop: n % 2 ? 'a' : 'b', knop: 'b', onderwerp: 'b', mknop: 'b', deel: 'b', deeltekst: 'b', product: 'b' } }; }
export async function proefEv(kv, b) { LOG.push(b.e + (b.v ? ':' + Object.keys(b.v).join(',') : '')); return { ok: true }; }
export async function proefStand() { return {}; }
export const proefTekst = () => 'stand';
