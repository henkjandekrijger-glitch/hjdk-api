// Wie wel binnenkomt maar de shop nooit laadt (Henkjan 5 nov 2026: "Ja iedere bot of hoe dan ook waardeloos moet er uit ."). Op 5 nov laadde
// 21% van de betaalde MGID-kliks kadoly.com nooit (cm.js meldde niets). Dit zet per kenmerk naast elkaar hoe vaak de pagina laadde (yg) en
// hoe vaak er een echt mens kwam (ym): netwerk, plek, apparaat en alles wat Clickmind bij de klik vastlegde (mm:vf:<cid>, 30 uur bewaard:
// os, browser, app of webview, soort IP, provider (asn), taal, regio, uur, wat het netwerk meegaf). Alleen betaald verkeer, geen tests.
// Een kenmerk is "waardeloos" als het 95%-interval van zijn mensaandeel helemaal onder een derde van het netwerkgemiddelde ligt
// (relatief, Henkjan 16 okt). Die kenmerken staan in hjdk:shop:botkenmerk (rapport). Weren gebeurt op plek en bron (lib/shopbot.js, MGID-wacht),
// want daar betaal je; plekken die nooit laden zijn sinds 5 nov zelf ook een botplek.
import { vfLees } from './voorspel.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
export const K_KENMERK = 'hjdk:shop:botkenmerk';
export function wilson(k, n, z = 1.96) { if (!n) return [0, 1]; const p = k / n, d = 1 + z * z / n, m = (p + z * z / (2 * n)) / d, w = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [Math.max(0, m - w), Math.min(1, m + w)]; }
const BETAALD = new Set(['pa', 'mg', 'md', 'ra', 'ca']);
const OVERSLA = new Set(['kw', 'maand', 'dag']); // zegt niets over bots

export async function nietGeladen(kv, { uren = 24, bewaar = false } = {}) {
  const T0 = Date.now(), sinds = T0 - Math.max(1, Math.min(30, N(uren) || 24)) * 36e5;
  const recs = []; let cur = '0';
  do { const [cc, keys] = await kv.scan(cur, { match: 'hjdk:shc:*', count: 1000 }); cur = String(cc);
    for (let i = 0; i < keys.length; i += 200) { const vals = await kv.mget(...keys.slice(i, i + 200));
      for (const r of vals) if (r && !r.t && r.arm === 'd' && BETAALD.has(r.s) && N(r.at) >= sinds) recs.push(r); }
  } while (cur !== '0' && Date.now() - T0 < 30000);
  // kenmerken van de klik erbij (Clickmind, 30 uur)
  for (let i = 0; i < recs.length; i += 200) {
    const deel = recs.slice(i, i + 200);
    const vs = await Promise.all(deel.map(r => r.mmc ? kv.raw(['HGET', 'mm:vf:' + r.mmc, 'a']).catch(() => null) : null));
    deel.forEach((r, j) => { r._f = vs[j] ? vfLees(vs[j]) : null; });
  }
  const net = {}, per = {};
  const tel = (o, r) => { o.v++; if (r.yg) o.g++; if (r.ym) o.m++; };
  for (const r of recs) {
    const n = net[r.s] || (net[r.s] = { v: 0, g: 0, m: 0, metKenmerk: 0 }); tel(n, r); if (r._f) n.metKenmerk++;
    const f = Object.assign({ apparaat: r.h || '?', plek: r.z || '-', uurNL: String(new Date(N(r.at) + 3600e3).getUTCHours()).padStart(2, '0') }, r._f || {});
    for (const [k, w] of Object.entries(f)) { if (OVERSLA.has(k) || k === 'net' || !w) continue; const sl = r.s + '|' + k + '=' + String(w).slice(0, 50); tel(per[sl] || (per[sl] = { v: 0, g: 0, m: 0 }), r); }
  }
  const uit = { ok: true, at: new Date().toISOString(), uren: Math.round((T0 - sinds) / 36e5), kliks: recs.length, netten: {}, nietGeladen: {}, waardeloos: [] };
  for (const [n, o] of Object.entries(net)) uit.netten[n] = { kliks: o.v, geladenPct: o.v ? Math.round(100 * o.g / o.v) : 0, mensPct: o.v ? Math.round(100 * o.m / o.v) : 0, nooitGeladen: o.v - o.g, metKenmerken: o.metKenmerk };
  for (const [sl, o] of Object.entries(per)) {
    const [n, kw] = [sl.split('|')[0], sl.slice(sl.indexOf('|') + 1)]; const b = net[n]; if (!b || o.v < 15) continue;
    const G = b.g / b.v, M = b.m / b.v, [, gHoog] = wilson(o.g, o.v), [, mHoog] = wilson(o.m, o.v);
    if (gHoog < 0.75 * G) (uit.nietGeladen[n] = uit.nietGeladen[n] || []).push({ kenmerk: kw, kliks: o.v, geladenPct: Math.round(100 * o.g / o.v), gemiddeld: Math.round(100 * G), mensPct: Math.round(100 * o.m / o.v) });
    if (M > 0 && mHoog < M / 3 && !kw.startsWith('plek=')) uit.waardeloos.push({ net: n, kenmerk: kw, kliks: o.v, mens: o.m, mensPct: Math.round(1000 * o.m / o.v) / 10, gemiddeldPct: Math.round(1000 * M) / 10 });
  }
  for (const n of Object.keys(uit.nietGeladen)) uit.nietGeladen[n] = uit.nietGeladen[n].sort((a, b) => a.geladenPct - b.geladenPct || b.kliks - a.kliks).slice(0, 25);
  uit.waardeloos.sort((a, b) => b.kliks - a.kliks);
  if (bewaar) { try { await kv.set(K_KENMERK, { at: T0, lijst: uit.waardeloos.slice(0, 60) }, { ex: 3 * 86400 }); } catch (e) {} }
  uit.duurMs = Date.now() - T0; return uit;
}
