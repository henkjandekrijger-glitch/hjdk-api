// Botplekken voor de shop (Henkjan 28 okt 2026: "Zorg dat clikmind echt bots blijft killen en filteren en volgende keer niet
// doorlate"). Clickmind ziet per betaalde klik op kadoly.com of er een echt mens kwam (cm.js op de shop, veld ym op het klikrecord).
// Een plek (zone) waar in 7 dagen veel kliks aankomen en (bijna) geen echt mens verschijnt, is een botplek:
//   - 40 of meer aankomsten en 0 echte mensen, of
//   - 80 of meer aankomsten en minder dan een kwart van het gemiddelde aandeel echte mensen van dat netwerk (relatief, geen vast bedrag).
// Een botplek blijft 30 dagen staan, ook als er daarna geen verkeer meer van komt (anders komt hij na een week vanzelf terug).
// Gevolg: Clickmind stuurt een klik van een botplek niet meer door (api/shop.js direct, 403) en de PropellerAds-ronde
// (propellerads-mcp lib/shoptest.ts) zet de plek elk uur op de zwarte lijst van elke lopende shopcampagne.
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
export const K_BOTZ = 'hjdk:shop:botzones';
const BLIJF = 30 * 864e5;
let MEM = { at: 0, v: null };

export async function berekenBotZones(kv) {
  const nu = Date.now(), sinds = nu - 7 * 864e5, per = {};
  let cur = '0', gezien = 0;
  do {
    const [cc, keys] = await kv.scan(cur, { match: 'hjdk:shc:*', count: 1000 }); cur = cc;
    for (let i = 0; i < keys.length; i += 200) {
      const vals = await kv.mget(...keys.slice(i, i + 200)); gezien += vals.length;
      for (const r of vals) {
        if (!r || r.t || r.arm !== 'd' || N(r.at) < sinds || !r.z || !r.s || !/^\d+$/.test(String(r.z))) continue;
        const k = r.s + ':' + r.z; const o = per[k] || (per[k] = { v: 0, g: 0, m: 0 });
        o.v++; if (r.yg) o.g++; if (r.ym) o.m++;
      }
    }
  } while (cur !== '0' && gezien < 80000);
  const tot = {};
  for (const [k, o] of Object.entries(per)) { if (o.v < 20) continue; const n = k.split(':')[0]; const t = tot[n] || (tot[n] = { v: 0, m: 0 }); t.v += o.v; t.m += o.m; }
  let oud = null; try { oud = await kv.get(K_BOTZ); } catch (e) {}
  const uit = { at: nu, dagen: 7, records: gezien, gem: {}, zones: {}, redenen: {}, sinds: {} };
  for (const [n, t] of Object.entries(tot)) uit.gem[n] = t.v ? Math.round(t.m / t.v * 10000) / 10000 : 0;
  const zet = (k, w, s) => { const [n, z] = k.split(':'); (uit.zones[n] = uit.zones[n] || []).push(z); uit.redenen[k] = w; uit.sinds[k] = s; };
  for (const [k, o] of Object.entries(per)) {
    const gem = uit.gem[k.split(':')[0]] || 0; let w = '';
    if (o.v >= 40 && o.m === 0) w = o.v + ' aankomsten in 7 dagen, 0 echte mensen' + (o.g === 0 ? ', cm.js nooit geladen' : '');
    else if (o.v >= 80 && gem > 0 && o.m / o.v < gem / 4) w = o.v + ' aankomsten in 7 dagen, ' + o.m + ' echte mensen (' + (100 * o.m / o.v).toFixed(1) + '% tegen gemiddeld ' + (100 * gem).toFixed(1) + '%)';
    if (w) zet(k, w, N(oud && oud.sinds && oud.sinds[k]) || nu);
  }
  // eerder gevonden botplekken blijven 30 dagen staan
  if (oud && oud.sinds) for (const [k, s] of Object.entries(oud.sinds)) if (!uit.redenen[k] && nu - N(s) < BLIJF) zet(k, (oud.redenen && oud.redenen[k] ? oud.redenen[k] + '; ' : '') + 'blijft tot 30 dagen na de eerste keer', N(s));
  try { await kv.set(K_BOTZ, uit, { ex: 35 * 86400 }); } catch (e) {}
  MEM = { at: nu, v: uit };
  return uit;
}

// snel, voor elke klik: uit het geheugen (1 minuut) of uit Redis; rekent niet
export async function botZones(kv) {
  if (MEM.v && Date.now() - MEM.at < 60000) return MEM.v;
  let v = null; try { v = await kv.get(K_BOTZ); } catch (e) {}
  MEM = { at: Date.now(), v: v || (MEM.v || null) };
  return MEM.v;
}
export async function isBotZone(kv, net, zone) {
  if (!zone || !net) return false;
  const v = await botZones(kv);
  return !!(v && v.zones && Array.isArray(v.zones[net]) && v.zones[net].includes(String(zone)));
}
// voor de PropellerAds-ronde: herberekenen als de lijst ouder is dan 30 minuten
export async function botZonesVers(kv) {
  const v = await botZones(kv);
  if (v && Date.now() - N(v.at) < 30 * 60000) return v;
  try { return await berekenBotZones(kv); } catch (e) { return v || { at: 0, zones: {}, redenen: {} }; }
}
// een echte klik van een netwerk heeft een klik-id; een controle van het netwerk (moderatie, voorbeeld) heeft er geen
export const echteKlikId = c => { const s = String(c || ''); return s.length >= 6 && !/[{}$]|^test/i.test(s); };
