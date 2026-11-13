// Kadoly in Clickmind-lookalikes (Henkjan 1 nov 2026: "Regel dit ook voor kadoly verkeer", over: "Clickmind houdt nu per bezoeker bij
// wie zich aanmeldt en zoekt per land advertentieplekken die lijken op de plekken die adressen opleverden").
// Uitkomsten per zone per dag uit de klikrecords van de shop (hjdk:shc:*, 7 dagen), in het formaat van lib/lookalike.js:
//   v = aangekomen vanaf de advertentie, m = echt mens op kadoly.com (cm.js), k = tikte op de shop, s = afrekenpagina geopend
//   (winkelwagen en afrekenen zijn bij Kadoly dezelfde stap; zodra er betalingen zijn telt betaald ook mee als s).
// Alleen PropellerAds en Mondiad (gidsklikken, net x, hebben geen zone). Land: alle shopcampagnes zijn NL.
import { kv } from './db.js';
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const NET = { pa: 'propeller', md: 'mondiad' };
let MEM = null; // alleen in het geheugen van de functie (1 uur): de database is krap
export async function kadolyCmData(vers) {
  if (!vers && MEM && Date.now() - MEM.at < 3600e3) return MEM;
  const per = {}, T0 = Date.now(); let cur = '0', gezien = 0; // T0 ontbrak: bij meer dan één scanpagina viel de Kadoly-lookalike om (13 nov)
  do {
    const [cc, keys] = await kv.scan(cur, { match: 'hjdk:shc:*', count: 1000 }); cur = cc;
    for (let i = 0; i < keys.length; i += 200) {
      const vals = await kv.mget(...keys.slice(i, i + 200)); gezien += vals.length;
      for (const r of vals) {
        if (!r || r.t || !r.z || !NET[r.s] || !/^\d{1,12}$/.test(String(r.z)) || !N(r.at)) continue;
        const d = new Date(N(r.at)).toISOString().slice(0, 10), key = d + '|' + r.s + '|' + r.z + '|' + (r.k || '-');
        const o = per[key] || (per[key] = { dag: d, net: NET[r.s], zone: String(r.z), camp: String(r.k || ''), cc: 'nl', v: 0, m: 0, k: 0, s: 0, b: 0 });
        o.v++; if (r.ym) o.m++; if (r.ya) o.k++; const px = r.px || {};
        if (px.cart || px.afreken || Object.keys(px).some(x => /^(betaal|koop)/.test(x))) o.s++;
        if (Object.keys(px).some(x => /^koop/.test(x))) o.b++;
      }
    }
  } while (cur !== '0' && Date.now() - T0 < 40000);
  const dagen = {}; for (const o of Object.values(per)) { const { dag, ...rij } = o; (dagen[dag] = dagen[dag] || []).push(rij); }
  const uit = { at: Date.now(), records: gezien, dagen: Object.entries(dagen).sort((a, b) => b[0].localeCompare(a[0])).map(([dag, rijen]) => ({ dag, rijen })) };
  MEM = uit; return uit;
}
