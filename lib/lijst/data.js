// Opslag van de verlanglijst (Redis via lib/db.js). Alles verloopt na 400 dagen zonder wijziging.
//   wl:l:<id>   lijst {id, naam, gel, datum, taal, ek (hash bewerksleutel), items[], smaak, kd (Kadoly-tips), gm (groep), t}
//   wl:c:<id>   wie wat geeft {itemId: {pid, ch (hash geheim), naam, t}}  -- nooit naar de eigenaar
//   wl:p:<id>   samen geven {itemId: {naam, link, doel, munt, mee:[{naam,bedrag,t}]}} -- nooit naar de eigenaar
//   wl:g:<gid>  lootjesgroep {gid, naam, datum, budget, taal, ak, jk, open, leden[{m,naam,sh,niet[],lijst,open}], trek{m:m}, roddel{m:[{tekst,t}]}}
//   wl:a:<id>:<item>  prijsalarm {p0, munt, mails[]}; set wl:alarmen
//   wl:h:<dag>  herinneringen (lijst van JSON), wl:stop:<hash mail> afgemeld
//   c:wl:<dag>:<stap>  tellers per stap (Clickmind-stijl, 60 dagen)
import crypto from 'node:crypto';
import { kv } from '../db.js';

export const TTL = 400 * 86400;
const ABC = 'abcdefghjkmnpqrstuvwxyz23456789';
export const rid = (n = 8) => { const b = crypto.randomBytes(n); let s = ''; for (let i = 0; i < n; i++) s += ABC[b[i] % ABC.length]; return s; };
export const hash = s => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 32);
export const dagNL = (d) => new Date(d || Date.now()).toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
export const geldigId = s => /^[a-z0-9]{6,12}$/.test(String(s || ''));
export const kort = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

// tellers: elke stap van de verlanglijst (Henkjan: alles meten)
export const STAPPEN = ['home', 'lijst_maak', 'item_link', 'item_foto', 'item_tekst', 'item_half', 'deel', 'deel_wa', 'deel_kopie', 'mailmij', 'gast', 'eigen', 'claim', 'unclaim',
  'uit', 'uit_kd', 'uit_zoek', 'vergelijk', 'pot_start', 'pot_mee', 'alarm', 'alarm_mail', 'herinner', 'herinner_mail', 'smaak', 'tips', 'groep_maak', 'groep_open', 'aanmeld',
  'trek', 'lot_open', 'lot_lijst', 'roddel', 'gedicht', 'zoek_view', 'zoek', 'lt_view', 'ged_view', 'maak_ook', 'bron'];
export async function tel(stap, extra) {
  const d = dagNL(); const paren = [['c:wl:' + d + ':' + stap, 1]];
  if (extra) paren.push(['c:wl:' + d + ':' + stap + ':' + String(extra).toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 30), 1]);
  try { await kv.incrMany(paren); } catch (e) {}
}
export async function stand(dagen = 7) {
  const uit = {}; const nu = Date.now();
  for (let i = 0; i < dagen; i++) {
    const d = dagNL(nu - i * 86400000); const keys = STAPPEN.map(s => 'c:wl:' + d + ':' + s);
    const v = await kv.mget(...keys).catch(() => []); const o = {}; STAPPEN.forEach((s, j) => { const n = Number(v[j] || 0); if (n) o[s] = n; }); uit[d] = o;
  }
  const nl = await kv.raw(['SCARD', 'wl:alarmen']).catch(() => 0);
  return { dagen: uit, prijsalarmen: Number(nl) || 0 };
}

// misbruik: per IP en soort hoogstens zoveel per dag
export async function mag(ip, soort, max) {
  const k = 'wl:rl:' + soort + ':' + dagNL() + ':' + hash(ip || '?').slice(0, 12);
  try { const n = await kv.incr(k); if (n === 1) await kv.raw(['EXPIRE', k, '90000']); return n <= max; } catch (e) { return true; }
}

export const leesLijst = id => geldigId(id) ? kv.get('wl:l:' + id) : null;
export const bewaarLijst = l => { l.t2 = Date.now(); return kv.set('wl:l:' + l.id, l, { ex: TTL }); };
export const isEigenaar = (l, k) => !!(l && k && l.ek === hash(k));
export const leesClaims = async id => (await kv.get('wl:c:' + id).catch(() => null)) || {};
export const bewaarClaims = (id, c) => kv.set('wl:c:' + id, c, { ex: TTL });
export const leesPotten = async id => (await kv.get('wl:p:' + id).catch(() => null)) || {};
export const bewaarPotten = (id, p) => kv.set('wl:p:' + id, p, { ex: TTL });
export const leesGroep = gid => geldigId(gid) ? kv.get('wl:g:' + gid) : null;
export const bewaarGroep = g => kv.set('wl:g:' + g.gid, g, { ex: TTL });

// wat iedereen van een lijst mag zien (zonder sleutel, mail of tellers)
export function openbaar(l) {
  if (!l) return null;
  return { id: l.id, naam: l.naam, gel: l.gel, datum: l.datum || null, taal: l.taal, smaak: l.smaak || null, gm: l.gm ? { g: l.gm.g } : null,
    items: (l.items || []).map(i => ({ i: i.i, t: i.t, p: i.p || null, m: i.m || 'EUR', img: i.img || null, w: i.w || null, n: i.n || null, f: i.f ? 1 : 0, u: i.u ? 1 : 0, ean: i.ean || null, kd: i.kd || null, zoek: i.zoek || null })) };
}

// e-mail: alleen versturen als iemand zich niet heeft afgemeld
let ZOUT = null;
async function zout() { if (ZOUT) return ZOUT; let z = process.env.WL_ZOUT || await kv.get('wl:zout').catch(() => null); if (!z) { z = rid(24); await kv.set('wl:zout', z).catch(() => {}); } ZOUT = String(z); return ZOUT; }
export async function mailToken(mail) { return hash((await zout()) + ':' + String(mail).toLowerCase().trim()).slice(0, 20); }
export async function afgemeld(mail) { return !!(await kv.get('wl:stop:' + await mailToken(mail)).catch(() => null)); }
export async function meldAf(token) { if (!/^[a-f0-9]{20}$/.test(String(token || ''))) return false; await kv.set('wl:stop:' + token, 1, { ex: 5 * 365 * 86400 }); return true; }
export const geldigeMail = m => /^[^\s@<>"']{1,64}@[^\s@<>"']{1,180}\.[a-z]{2,24}$/i.test(String(m || '').trim());
