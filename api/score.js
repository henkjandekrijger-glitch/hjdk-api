// Scorebord per site (keuzehulp.best = kz, whichtobuy.best = us, kaufberater.best = de): wat doen ECHTE bezoekers (gemeten in de browser),
// per dag, per bron en per pagina, plus bestellingen en commissie bij bol (keuzehulp). Met vaste beslisregels die de makers vannacht oppakken.
// /api/score?site=kz (openbaar, 7 dagen)  ·  /api/score?op=dag (cron 02:30 UTC: schrijft hjdk:score:<site> voor planners en de kleurtest)
import { kv } from '../lib/db.js';
import { BRONNEN } from '../lib/kleur.js';
import { MARKETS, items as wtbItems } from '../lib/wtb.js';
import seed from '../data/kz.json' with { type: 'json' };

const P = { kz: 'kz', us: 'wtbus', de: 'wtbde' };
const dag = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
async function kzSlugs() {
  const extra = []; try { const idx = (await kv.get('hjdk:kz:index')) || []; const vals = idx.length ? await kv.mget(...idx.map(s => 'hjdk:kz:' + s)) : []; vals.forEach(v => { if (v && v.slug && !v.override) extra.push(v); }); } catch (e) {}
  const seen = new Set(); return seed.items.concat(extra).filter(i => !seen.has(i.slug) && seen.add(i.slug)).map(i => ({ slug: i.slug, cat: i.cat }));
}
async function mget(keys) { const out = []; for (let i = 0; i < keys.length; i += 500) { try { (await kv.mget(...keys.slice(i, i + 500))).forEach(v => out.push(Number(v) || 0)); } catch (e) { keys.slice(i, i + 500).forEach(() => out.push(0)); } } return out; }

export async function score(site, dagen) {
  const p = P[site]; const pages = site === 'kz' ? await kzSlugs() : (await wtbItems(MARKETS[site])).map(i => ({ slug: i.slug, cat: i.cat }));
  const slugs = ['home', ...pages.map(x => x.slug)]; const days = Array.from({ length: dagen }, (_, i) => dag(i));
  const keys = []; const idx = [];
  days.forEach(d => { BRONNEN.forEach(b => ['hv', 'hss', 'hcs'].forEach(t => { idx.push([d, 'bron', b, t]); keys.push('c:' + p + '-' + t + '-' + d + '-' + b); }));
    slugs.forEach(s => ['hp', 'hs', 'hc'].forEach(t => { idx.push([d, 'pag', s, t]); keys.push('c:' + p + '-' + t + '-' + d + '-' + s); })); });
  const vals = await mget(keys);
  const perDag = {}, perBron = {}, perPag = {};
  idx.forEach(([d, soort, k, t], i) => { const v = vals[i]; if (!v) return;
    const D = perDag[d] || (perDag[d] = { bezoeken: 0, weergaven: 0, starts: 0, winkelkliks: 0 });
    if (soort === 'bron') { const B = perBron[k] || (perBron[k] = { bezoeken: 0, starts: 0, winkelkliks: 0 }); if (t === 'hv') { B.bezoeken += v; D.bezoeken += v; } if (t === 'hss') B.starts += v; if (t === 'hcs') B.winkelkliks += v; }
    else { const X = perPag[k] || (perPag[k] = { weergaven: 0, starts: 0, winkelkliks: 0 }); if (t === 'hp') { X.weergaven += v; D.weergaven += v; } if (t === 'hs') { X.starts += v; D.starts += v; } if (t === 'hc') { X.winkelkliks += v; D.winkelkliks += v; } } });
  const catOf = Object.fromEntries(pages.map(x => [x.slug, x.cat]));
  let geld = null; if (site === 'kz') { try { const v = await kv.get('hjdk:kz:verdiensten'); if (v && v.ok) geld = { periode: v.periode, keuzehulpOrders: v.totaal.keuzehulpOrders, keuzehulpCommissie: v.totaal.keuzehulpCommissie, perBron: v.perBron || [], perKeuzehulp: v.besteKeuzehulpen }; } catch (e) {} }
  const pag = Object.entries(perPag).map(([slug, x]) => Object.assign({ slug, cat: catOf[slug] || '' }, x, { klikPct: x.weergaven ? Math.round(1000 * x.winkelkliks / x.weergaven) / 10 : 0 })).sort((a, b) => b.weergaven - a.weergaven);
  // beslisregels (over de gekozen periode)
  const aanpassen = pag.filter(x => x.slug !== 'home' && x.weergaven >= 15 && x.winkelkliks === 0).map(x => x.slug).slice(0, 5);
  const cats = {}; pag.filter(x => x.winkelkliks >= 2 && x.cat).forEach(x => { cats[x.cat] = (cats[x.cat] || 0) + x.winkelkliks; });
  const uitbreiden = Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 3);
  const g = perDag[dag(1)] || { bezoeken: 0, weergaven: 0, starts: 0, winkelkliks: 0 };
  return { site, prefix: p, periode: days[days.length - 1] + ' t/m ' + days[0], gisteren: g, vandaag: perDag[dag(0)] || null, perDag, perBron, paginas: pag.slice(0, 40), geld,
    beslissingen: { adviesblokAanpassen: aanpassen, meerInCategorie: uitbreiden, kleurtest: g.weergaven >= 400 ? 'aan' : 'uit tot er 400+ weergaven per dag zijn (gisteren ' + g.weergaven + ')' } };
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x'); const op = url.searchParams.get('op') || 'status'; res.setHeader('cache-control', 'no-store');
  try {
    if (op === 'dag') { const out = {}; for (const s of Object.keys(P)) { const sc = await score(s, 7); await kv.set('hjdk:score:' + s, Object.assign({ at: Date.now() }, sc)); out[s] = { gisteren: sc.gisteren, beslissingen: sc.beslissingen }; } return res.status(200).json({ ok: true, out }); }
    const site = P[url.searchParams.get('site')] ? url.searchParams.get('site') : 'kz'; const n = Math.max(1, Math.min(30, Number(url.searchParams.get('dagen')) || 7));
    return res.status(200).json(Object.assign({ ok: true }, await score(site, n)));
  } catch (e) { return res.status(500).json({ ok: false, fout: String(e.message).slice(0, 200) }); }
}
