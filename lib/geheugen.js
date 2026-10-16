// Geheugen van de database per sleutelgroep (alleen lezen). De database liep 16 okt opnieuw vol (OOM, ~250 MB).
// Telt sleutels per groep (eerste twee delen van de naam, cijfers en datums weg) en schat de omvang met MEMORY USAGE op een steekproef.
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const groep = k => String(k).split(':').slice(0, 2).join(':').replace(/\d{4}-\d{2}-\d{2}/g, '<dag>').replace(/[0-9a-f]{12,}/g, '<id>').replace(/\d+/g, '#');
export async function geheugenPerGroep(kv, { tijd = 22000, steek = 25 } = {}) {
  const t0 = Date.now(), G = {}; let cu = '0', gescand = 0, klaar = true;
  do {
    if (Date.now() - t0 > tijd * 0.6) { klaar = false; break; }
    const [c, keys] = await kv.scan(cu, { match: '*', count: 5000 }); cu = String(c); gescand += keys.length;
    for (const k of keys) { const g = groep(k), x = G[g] || (G[g] = { n: 0, monster: [] }); x.n++; if (x.monster.length < steek) x.monster.push(k); }
  } while (cu !== '0');
  const info = String(await kv.raw(['INFO', 'memory']).catch(() => '')); const pick = k => ((info.match(new RegExp('^' + k + ':(.*)$', 'm')) || [])[1] || '').trim();
  const dbsize = N(await kv.raw(['DBSIZE']).catch(() => 0));
  const rijen = [];
  for (const [g, x] of Object.entries(G).sort((a, b) => b[1].n - a[1].n).slice(0, 40)) {
    if (Date.now() - t0 > tijd) break;
    const m = await Promise.all(x.monster.map(k => kv.raw(['MEMORY', 'USAGE', k]).catch(() => null)));
    const ok = m.map(N).filter(v => v > 0), gem = ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : 0;
    const ttl = await kv.raw(['TTL', x.monster[0]]).catch(() => null);
    rijen.push({ groep: g, sleutels: x.n, gemBytes: Math.round(gem), schatMB: Math.round(gem * x.n / 1048576 * 10) / 10, ttlVoorbeeldDagen: ttl == null ? null : Math.round(N(ttl) / 864) / 100 });
  }
  const factor = klaar || !gescand ? 1 : dbsize / gescand;
  return { ok: true, gebruikt: pick('used_memory_human'), max: pick('maxmemory_human') || null, beleid: pick('maxmemory_policy') || null, dbsize, gescand, volledig: klaar, factorTotaal: Math.round(factor * 100) / 100, groepen: rijen.sort((a, b) => b.schatMB - a.schatMB) };
}
