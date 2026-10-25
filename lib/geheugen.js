// Geheugen van de database per sleutelgroep (alleen lezen). De database liep 16 okt opnieuw vol (OOM, ~250 MB).
// Telt sleutels per groep (eerste twee delen van de naam, cijfers en datums weg) en schat de omvang met MEMORY USAGE op een steekproef.
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const groep = k => String(k).split(':').slice(0, 2).join(':').replace(/\d{4}-\d{2}-\d{2}/g, '<dag>').replace(/[0-9a-f]{12,}/g, '<id>').replace(/\d+/g, '#');
// match=<patroon>: meet elke sleutel die past (MEMORY USAGE, type, lengte), grootste eerst
export async function geheugenPatroon(kv, { match, tijd = 22000 } = {}) {
  const t0 = Date.now(), uit = []; let cu = '0';
  do { const [c, keys] = await kv.scan(cu, { match, count: 5000 }); cu = String(c);
    for (let i = 0; i < keys.length && Date.now() - t0 < tijd; i += 50) { const deel = keys.slice(i, i + 50);
      const m = await Promise.all(deel.map(k => kv.raw(['MEMORY', 'USAGE', k]).catch(() => null)));
      const t = await Promise.all(deel.map(k => kv.raw(['TYPE', k]).catch(() => null)));
      deel.forEach((k, j) => uit.push({ k, mb: Math.round(N(m[j]) / 10485.76) / 100, type: String(t[j] || '') })); }
  } while (cu !== '0' && Date.now() - t0 < tijd);
  uit.sort((a, b) => b.mb - a.mb);
  const tot = Math.round(uit.reduce((a, b) => a + b.mb, 0) * 10) / 10;
  for (const x of uit.slice(0, 15)) { if (x.type === 'list') x.lengte = N(await kv.raw(['LLEN', x.k]).catch(() => 0)); else if (x.type === 'hash') x.lengte = N(await kv.raw(['HLEN', x.k]).catch(() => 0)); x.ttlDagen = Math.round(N(await kv.raw(['TTL', x.k]).catch(() => -1)) / 864) / 100; }
  return { ok: true, match, sleutels: uit.length, totaalMB: tot, grootste: uit.slice(0, 40) };
}
export async function geheugenPerGroep(kv, { tijd = 22000, steek = 25, alle = false } = {}) {
  const t0 = Date.now(), G = {}; let cu = '0', gescand = 0, klaar = true;
  do {
    if (Date.now() - t0 > tijd * 0.6) { klaar = false; break; }
    const [c, keys] = await kv.scan(cu, { match: '*', count: 5000 }); cu = String(c); gescand += keys.length;
    for (const k of keys) { const g = groep(k), x = G[g] || (G[g] = { n: 0, monster: [] }); x.n++; if (x.monster.length < steek) x.monster.push(k); }
  } while (cu !== '0');
  const info = String(await kv.raw(['INFO', 'memory']).catch(() => '')); const pick = k => ((info.match(new RegExp('^' + k + ':(.*)$', 'm')) || [])[1] || '').trim();
  const dbsize = N(await kv.raw(['DBSIZE']).catch(() => 0));
  const rijen = [];
  // alle=1: ook kleine groepen (weinig maar grote sleutels, zoals lange lijsten) met een kleiner monster
  const lijst = Object.entries(G).sort((a, b) => b[1].n - a[1].n); if (alle) for (const [, x] of lijst.slice(40)) x.monster = x.monster.slice(0, 3);
  for (const [g, x] of (alle ? lijst : lijst.slice(0, 40))) {
    if (Date.now() - t0 > tijd) break;
    const m = await Promise.all(x.monster.map(k => kv.raw(['MEMORY', 'USAGE', k]).catch(() => null)));
    const ok = m.map(N).filter(v => v > 0), gem = ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : 0;
    const ttl = await kv.raw(['TTL', x.monster[0]]).catch(() => null);
    rijen.push({ groep: g, sleutels: x.n, gemBytes: Math.round(gem), schatMB: Math.round(gem * x.n / 1048576 * 10) / 10, ttlVoorbeeldDagen: ttl == null ? null : Math.round(N(ttl) / 864) / 100 });
  }
  const factor = klaar || !gescand ? 1 : dbsize / gescand;
  return { ok: true, gebruikt: pick('used_memory_human'), max: pick('maxmemory_human') || null, beleid: pick('maxmemory_policy') || null, dbsize, gescand, volledig: klaar, factorTotaal: Math.round(factor * 100) / 100, groepenTotaal: Object.keys(G).length, groepen: rijen.sort((a, b) => b.schatMB - a.schatMB).slice(0, alle ? 60 : 40) };
}
// Volledige meting in stukken (25 okt, database vol): elke sleutel MEMORY USAGE, per groep opgeteld, met cursor om door te gaan.
// Schrijft niets (werkt ook bij OOM). Aanroep: /api/mm/geheugenvol?cursor=0 en daarna met de teruggegeven cursor tot die 0 is.
export async function geheugenVol(kv, { cursor = '0', tijd = 24000 } = {}) {
  const t0 = Date.now(), G = {}; let cu = String(cursor || '0'), n = 0;
  do {
    const [c, keys] = await kv.scan(cu, { match: '*', count: 2000 }); cu = String(c);
    for (let i = 0; i < keys.length; i += 250) {
      const deel = keys.slice(i, i + 250);
      const [m, t] = await Promise.all([Promise.all(deel.map(k => kv.raw(['MEMORY', 'USAGE', k, 'SAMPLES', '0']).catch(() => 0))), Promise.all(deel.map(k => kv.raw(['TTL', k]).catch(() => -2)))]);
      deel.forEach((k, j) => { const g = /^c:/.test(k) ? 'c:' + String(k).slice(2).split('-').slice(0, 2).join('-').replace(/\d+/g, '#') : groep(k), x = G[g] || (G[g] = { n: 0, b: 0, zonderTtl: 0, max: 0, maxK: '' }); const b = N(m[j]); x.n++; x.b += b; if (N(t[j]) === -1) x.zonderTtl++; if (b > x.max) { x.max = b; x.maxK = k; } });
      n += deel.length;
    }
  } while (cu !== '0' && Date.now() - t0 < tijd);
  return { ok: true, volgende: cu, gemeten: n, groepen: Object.entries(G).map(([g, x]) => ({ g, ...x })).sort((a, b) => b.b - a.b).slice(0, 80) };
}
// Opruimen per patroon (alleen via de beschermde host). Standaard droog (telt alleen). echt=1 gooit weg (UNLINK) of zet met ttl=<dagen> een verlooptijd.
// zonderttl=1: alleen sleutels zonder verlooptijd. ouderdan=<YYYY-MM-DD>: alleen sleutels met een datum in de naam van vóór die dag.
export async function opruim(kv, { match, echt = false, ttlDagen = 0, zonderTtl = false, ouderDan = '', cursor = '0', tijd = 24000 } = {}) {
  if (!match || match === '*' || match.length < 3) return { ok: false, fout: 'match te breed' };
  const t0 = Date.now(); let cu = String(cursor || '0'), gezien = 0, raak = 0, bytes = 0; const voorbeeld = [];
  do {
    const [c, keys] = await kv.scan(cu, { match, count: 2000 }); cu = String(c); gezien += keys.length;
    let kies = keys;
    if (ouderDan) kies = kies.filter(k => { const d = (String(k).match(/\d{4}-\d{2}-\d{2}/) || [])[0]; return d && d < ouderDan; });
    if (zonderTtl && kies.length) { const t = await Promise.all(kies.map(k => kv.raw(['TTL', k]).catch(() => -2))); kies = kies.filter((k, j) => N(t[j]) === -1); }
    if (!kies.length) continue;
    const m = await Promise.all(kies.map(k => kv.raw(['MEMORY', 'USAGE', k, 'SAMPLES', '0']).catch(() => 0))); bytes += m.reduce((a, b) => a + N(b), 0);
    raak += kies.length; if (voorbeeld.length < 8) voorbeeld.push(...kies.slice(0, 8 - voorbeeld.length));
    if (echt) { if (ttlDagen > 0) await Promise.all(kies.map(k => kv.raw(['EXPIRE', k, Math.round(ttlDagen * 86400)]).catch(() => 0))); else for (let i = 0; i < kies.length; i += 500) await kv.del(kies.slice(i, i + 500)); }
  } while (cu !== '0' && Date.now() - t0 < tijd);
  return { ok: true, match, echt, actie: echt ? (ttlDagen > 0 ? 'ttl ' + ttlDagen + 'd' : 'weg') : 'droog', volgende: cu, gezien, raak, mb: Math.round(bytes / 10485.76) / 100, voorbeeld };
}
