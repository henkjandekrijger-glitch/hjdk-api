// Yoors Shop: directe route met Clickmind onzichtbaar ertussen (Henkjan, 14 okt 2026).
// Een advertentieklik op keuzehulp.best/shop gaat per persoon (vast) naar de landingspagina (arm l) of in één keer
// door naar de productpagina op yoo.rs (arm d, 302). In arm d logt Clickmind de klik (bot- en terugbetalingsbewijs)
// en gaan hj (winkelwagen en betaling via de shop) en mmc (Clickmind-klik-id) mee in de URL.
// Op yoo.rs meldt cm.js (één regel van Babita) "echt" en "actie" terug via /api/mm/uitkomst; lib/wissel.js roept dan
// shopUitkomst aan. In arm d is de eerste tik op de productpagina (actie) het hoofddoel voor het netwerk: dat is het
// equivalent van de doorklik op de landingspagina. Clickadu krijgt alleen de betaling (SmartCPA rekent per conversie).
import { createHash } from 'node:crypto';

export const PB = { pa: 'https://ad.propellerads.com/conversion.php?aid=3772727&pid=&tid=151850&visitor_id={clickid}', md: 'https://postback.mondiad.com/track?uid=31070&clickid={clickid}', ra: 'https://us.ahows.co/log?action=conversion&key={clickid}' };
if (/^https:\/\/\S+\{clickid\}/.test(process.env.SHOP_PB_CLICKADU || '')) PB.ca = process.env.SHOP_PB_CLICKADU.trim();
export const CM_NET = { pa: 'propeller', md: 'mondiad', ra: 'richads', ca: 'clickadu', x: 'onbekend' };
export const SOORTEN_DIRECT = ['dv', 'dm', 'da', 'lm', 'la']; // dv = aangekomen via de directe route, dm/da = echt/actie op de shop (arm d), lm/la = idem voor wie via de landingspagina kwam
const K_INST = 'hjdk:shop:direct', K_MEET = 'hjdk:shop:ymeet';
const D8 = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const pk = pid => String(pid).toLowerCase().replace(/[^a-z0-9]/g, '');
const num = v => Number(v) || 0;

// Instelling: welk deel van de betaalde bezoekers direct naar de shop gaat. Standaard 50 (proef: helft direct, helft landingspagina).
export async function directInst(kv) { let c = null; try { c = await kv.get(K_INST); } catch (e) {} const pct = c && Number.isFinite(Number(c.pct)) ? Math.max(0, Math.min(100, Math.round(Number(c.pct)))) : 50; return { pct, at: (c && c.at) || null, door: (c && c.door) || null }; }
export async function zetDirect(kv, pct, door) { const p = Math.max(0, Math.min(100, Math.round(Number(pct)))); if (!Number.isFinite(p)) throw new Error('pct 0 tot 100'); const c = { pct: p, at: new Date().toISOString(), door: String(door || '').slice(0, 40) }; await kv.set(K_INST, c); return c; }
// Meet cm.js op yoo.rs al? (gezet bij de eerste "echt" van een shopbezoeker, 2 dagen geldig)
export async function shopMeet(kv) { try { const t = num(await kv.get(K_MEET)), tt = num(await kv.get(K_MEET + ':test')); return { aan: !!t, laatst: t ? new Date(t).toISOString() : null, test: tt ? new Date(tt).toISOString() : null }; } catch (e) { return { aan: false, laatst: null, test: null }; } }
// Vaste arm per persoon (zelfde apparaat = zelfde arm), los van of het een bot lijkt: iedereen krijgt dezelfde behandeling (geen cloaking).
export function shopArm(sleutel, pct) { const h = createHash('sha256').update('shoparm|' + String(sleutel || '')).digest(); return (h.readUInt16BE(0) % 100) < pct ? 'd' : 'l'; }
// Deel van het geld dat bij de landingspagina hoort, voor regels die op doorkliks oordelen (o = tellers met view en dv).
// Meet cm.js op de shop, dan telt de directe route mee via da (eerste tik op de productpagina) en schalen we niet.
export function landDeel(o, meet) { const v = num(o && o.view), d = num(o && o.dv); if (meet || v + d === 0) return 1; return v / (v + d); }
export const doorkliks = (o, meet) => num(o && o.klik) + (meet ? num(o && o.da) : 0);

async function stuur(url) { let st = 0; try { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 2500); const r = await fetch(url, { signal: ctl.signal }); clearTimeout(tm); st = r.status; } catch (e) {} return st; }

// Uitkomst van cm.js op yoo.rs voor een shopbezoeker (aangeroepen vanuit lib/wissel.js uitkomst, eenmaal per klik en soort).
export async function shopUitkomst(kv, code, soort) {
  code = String(code || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); if (!code || (soort !== 'echt' && soort !== 'actie')) return { ok: false };
  const key = 'hjdk:shc:' + code; const rec = await kv.get(key); if (!rec) return { ok: false, fout: 'onbekend kenmerk' };
  const veld = soort === 'echt' ? 'ym' : 'ya'; if (rec[veld]) return { ok: true, dubbel: true };
  rec[veld] = Date.now(); const net = rec.s || 'x', direct = rec.arm === 'd', s = (direct ? 'd' : 'l') + (soort === 'echt' ? 'm' : 'a');
  const keys = ['sh-' + net + '-' + s, 'sh-d' + D8() + '-' + net + '-' + s];
  if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-' + s); if (rec.a) keys.push('sh-' + net + '-a' + rec.a + '-' + s); if (rec.k) keys.push('sh-' + net + '-k' + rec.k + '-' + s); if (rec.p) keys.push('sh-p-' + pk(rec.p) + '-' + s);
  let pb = null;
  if (direct && soort === 'actie' && rec.c && !rec.t && !rec.conv && PB[net] && net !== 'ca') { // hoofddoel voor het netwerk (PropellerAds doel 1)
    pb = await stuur(PB[net].replace('{clickid}', encodeURIComponent(rec.c))); rec.conv = Date.now(); rec.pb = pb;
    keys.push('sh-' + net + '-conv', 'sh-d' + D8() + '-' + net + '-conv', 'sh-' + net + '-pb' + (pb || 0)); if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-conv');
  }
  if (!rec.t) { try { await kv.incrMany(keys.map(k => ['c:' + k, 1])); } catch (e) {} } // rec.t = testklik (klik-id begint met test): telt niet mee
  await kv.set(key, rec, { ex: 30 * 86400 });
  if (soort === 'echt') { try { await kv.set(rec.t ? K_MEET + ':test' : K_MEET, Date.now(), { ex: 2 * 86400 }); } catch (e) {} }
  return { ok: true, arm: direct ? 'd' : 'l', soort, gemeld: pb };
}
