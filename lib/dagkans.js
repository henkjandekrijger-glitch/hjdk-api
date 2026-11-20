// Kadoly Spaarpot (Henkjan 14 nov 2026: "Je krijgt een tegoed met elkaar . We kunnen het nog slimmer maken een tegoed opbouwen gewoon samen
// zonder dat je win kans hebt ." en "Gewoon altijd ."). Opvolger van de Winterkans-loterij van dezelfde dag: geen kans meer, dus geen kansspel,
// geen einddatum en geen prijzenplafond. Iedereen die meedoet, krijgt wat hij spaart.
//
// Werking
// - Aanmelden met dubbele opt-in (18+, woonadres in Nederland). Elke ochtend één mail met je eigen link; de TIK op die link telt als je dag
//   (geen open-pixel: Apple Mail opent alles zelf).
// - Start: bij aanmelding staat er meteen €5 in de pot (Henkjan 20 nov: "We starten met een gevulde spaarpot").
// - Elke klik (tik op de link in de ochtendmail): +€0,10 in je pot, direct. Elke 10e dag op rij: +€1.
// - Samen klikken (Henkjan 20 nov: "als iemand klikt krijg je beiden een punt . Jij klikt voor hen . Zij klikken voor jou . En WEER klikken naar
//   product"): vrienden zijn wie jou uitnodigde en wie jij uitnodigde (de band telt zodra de nieuwe 3 dagen klikte). Klikt een vriend, dan krijg
//   jij direct €0,10; klik jij, dan krijgt elke vriend €0,10. Van vrienden samen hooguit €0,90 per dag. De ochtendmail toont wat je samen
//   gespaard hebt en wie gisteren voor je klikte; na de klik staat het cadeau-idee van vandaag (product van Kadoly) bovenaan.
// - Pot hooguit €30. Is je pot genoeg voor een cadeau (shopcatalogus: tot €30 incl. verzending, levertijd bekend en kort of onbekend, kortste eerst), dan kies je het
//   gratis; het bedrag gaat van je pot af en Henkjan krijgt een bestelmail. Na 14 dagen zonder tik stopt de dagmail, na 30 dagen vervalt de pot.
// - Live pas aan op Henkjans woord (kv dk:aan). Testwereld alleen op de beschermde host met &test=1 (eigen opslag dkt<versie>:).
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { kv } from './db.js';
import { stuurMails, mailSchil, knop, mailHenkjan, mailKlaar, KADOLY_BEDRIJF } from './kadoly-nieuws.js';
import { proefBeslis, proefEv, proefStand, proefTekst } from './proef.js';
import { verwerkKlik, serverSignalen, laterAf } from './mensmeter.js';

// bedragen in centen
// tik, vriend, vriendMax en reeksBonus zijn de spaarrente van de week (zie economie hieronder); vriendBonus: nieuwe vriend die 3 dagen klikt, voor beiden
export const R = { naam: 'Kadoly Spaarpot', start: 500, tik: 10, vriend: 10, vriendMax: 90, reeksElke: 10, reeksBonus: 100, vriendBonus: 100, potMax: 3000, prijsMax: 30, leverMax: 7, vriendDagen: 3, rustNa: 14, vervalNa: 30 };
const h = s => createHash('sha256').update(String(s)).digest('hex');
const tok = () => randomBytes(24).toString('hex');
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const amsDag = ms => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });
export const plusDag = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const datumNl = d => new Date(d + 'T12:00:00Z').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const okMail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
const euro = x => '€' + (Number.isInteger(N(x)) ? String(N(x)) : N(x).toFixed(2).replace('.', ','));
export const ct = c => euro(Math.round(N(c)) / 100); // centen als bedrag
export function canon(email) { let [l, d] = String(email || '').trim().toLowerCase().split('@'); if (!l || !d) return ''; l = l.split('+')[0]; if (d === 'gmail.com' || d === 'googlemail.com') { l = l.replace(/\./g, ''); d = 'gmail.com'; } return l + '@' + d; }
const idVan = email => 'd' + h('dk:' + canon(email)).slice(0, 31); // met letter voorop: kv.get leest een id nooit als getal
const nep = e => /\.invalid$/i.test(String(e || '')); // testvrienden in de testwereld: nooit mailen
const smem = async k => (((await kv.raw(['SMEMBERS', k]).catch(() => [])) || []).map(String));

// ---------- wereld: live of test ----------
export async function wereld(test) {
  if (!test) { const c = { test: false, ns: 'dk:', base: 'https://gids.kadoly.com/api/gids' }; await renteLees(c); return c; }
  const v = N(await kv.get('dktv').catch(() => 0)); const c = { test: true, ns: 'dkt' + v + ':', base: 'https://hjdk-api-henq.vercel.app/api/gids' }; await renteLees(c); return c;
}
const u = (c, op, extra = '') => c.base + '?op=' + op + (c.test ? '&test=1' : '') + extra;
export async function vandaag(c) { const o = c.test ? N(await kv.get(c.ns + 'offset').catch(() => 0)) : 0; return amsDag(Date.now() + o * 864e5); }
const lees = (c, id) => kv.get(c.ns + 'p:' + id).catch(() => null);
const bewaar = (c, p) => kv.set(c.ns + 'p:' + p.id, p);
async function tel(c, wat, n = 1) { if (!n) return; try { const k = c.ns + 'tel:' + (await vandaag(c)); await kv.raw(['HINCRBY', k, wat, n]); await kv.raw(['EXPIRE', k, 120 * 86400]); } catch (e) {} }
const aanStaat = async c => c.test || !!(await kv.get('dk:aan').catch(() => null));

// ---------- economie: de pot betaalt zichzelf ----------
// Henkjan 20 nov 2026: "Maak het economisch totaal werkend en groeiende dus bij groei gaat relatief minder kosten ?"
// Elk tegoed komt uit iets wat al geld oplevert: een nieuw lid via een vriend of een site (wat een advertentie anders kost, ECO.lidWaard),
// een deel van de winst op aankopen van leden (winstcent, via ecoVerkoop), merken die betalen voor het cadeau-idee of een cadeau leveren
// (merkcent, op=dkeco&merk=) en een startbudget per dag op Henkjans woord (eco:startbudget). De spaarrente (bedrag per klik, per vriendenklik
// en de reeksbonus) zet zich elke maandag zo dat de verwachte kosten van nieuw tegoed niet hoger zijn dan die inkomsten over 30 dagen.
// Verwachte kosten = deel van het tegoed dat echt een cadeau wordt (gemeten vanaf €100 aan cadeaus, daarvoor 30%) x tegoed, cadeaus tegen
// kostprijs (prijs min marge). Hooguit 25% per week omhoog of omlaag, tussen 20% en 200% van de basis. Wat in een pot zit, blijft altijd staan.
// Startpot en vriendbonus zijn acquisitie (vaste bedragen) en staan apart in de stand, naast wat een advertentie per lid kost.
// Waarom het bij groei relatief goedkoper wordt: steeds meer leden komen via vrienden en sites (betaald uit wat ze opleveren, niet vooraf),
// merken betalen meer voor een groter publiek, vaste kosten (mail, techniek) verdelen zich, en vervallen tegoed vloeit terug.
export const ECO = { lidWaard: 50, winstDeel: 0.5, kansPrior: 0.3, kansVanaf: 10000, minF: 0.2, maxF: 2, stap: 1.25 };
const BASIS = { tik: 10, vriend: 10, reeksBonus: 100 };
async function eco(c, wat, n) { n = Math.round(N(n)); if (!n) return; await tel(c, wat, n); try { await kv.raw(['HINCRBY', c.ns + 'eco:tot', wat, n]); } catch (e) {} }
const hash = a => { const o = {}; if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) o[a[j]] = N(a[j + 1]); return o; };
async function renteLees(c) {
  const r = await kv.get(c.ns + 'eco:rente').catch(() => null), f = r && N(r.f) > 0 ? N(r.f) : 1;
  R.tik = Math.max(1, Math.round(BASIS.tik * f)); R.vriend = Math.max(1, Math.round(BASIS.vriend * f)); R.vriendMax = R.vriend * 9; R.reeksBonus = Math.max(10, Math.round(BASIS.reeksBonus * f));
  c.rente = { f, sinds: (r && r.sinds) || '' }; return c.rente;
}
export async function ecoStand(c, D) {
  const S = {}; for (let i = 0; i < 30; i++) { const o = hash(await kv.raw(['HGETALL', c.ns + 'tel:' + plusDag(D, -i)]).catch(() => [])); for (const k in o) S[k] = N(S[k]) + o[k]; }
  const T = hash(await kv.raw(['HGETALL', c.ns + 'eco:tot']).catch(() => [])), sb = N(await kv.get(c.ns + 'eco:startbudget').catch(() => 0));
  const bron = { nieuweLeden: ECO.lidWaard * (N(S.lidvriend) + N(S.lidsite)), winst: Math.round(ECO.winstDeel * N(S.winstcent)), merken: N(S.merkcent), startbudget: sb * 30 };
  const inkomen = bron.nieuweLeden + bron.winst + bron.merken + bron.startbudget;
  const uitT = N(T.startcent) + N(T.bonuscent) + N(T.rentecent) - N(T.vervalcent), gemeten = N(T.kostcent) >= ECO.kansVanaf && uitT > 0;
  // gemeten: wat cadeaus Henkjan echt kostten per euro tegoed; daarvoor: 30% wordt een cadeau x wat een cadeau kost per euro tegoed (inkoop met btw + verzending / tegoed, uit de cadeaulijst)
  const L = await cadeaus().catch(() => []), lijstVerh = L.length ? L.reduce((s, o) => s + verh(o), 0) / L.length : 1, bekend = L.filter(o => !o.geschat).length;
  const kans = gemeten ? Math.min(1, Math.max(0.05, N(T.kostcent) / uitT)) : ECO.kansPrior * lijstVerh;
  const verwacht = Math.round(kans * Math.max(0, N(S.rentecent) - N(S.vervalcent))), nieuw = Math.round(N(S.startcent) / R.start), act = N(S.lidvriend) + N(S.lidsite);
  return { dagen: 30, inkomen, bron, verwacht, kans: Math.round(kans * 100) / 100, kansGemeten: gemeten, cadeaulijst: { aantal: L.length, inkoopBekend: bekend, kostPerEuroTegoed: Math.round(lijstVerh * 100) / 100, goedkoopste: L.length ? (o => ({ naam: o.naam, tegoed: Math.round(o.prijs * 100), kost: o.kost }))(L.slice().sort((a, b) => a.prijs - b.prijs)[0]) : null }, tegoed: { rente: N(S.rentecent), startpot: N(S.startcent), vriendbonus: N(S.bonuscent), vervallen: N(S.vervalcent) },
    cadeaus: { aantal: N(S.cadeau), tegoed: N(S.cadeaucent), kostprijs: N(S.kostcent) }, leden: { nieuw, viaVriendOfSite: act, deelViaVriend: nieuw ? Math.round(act / nieuw * 100) : null },
    acquisitiePerLid: Math.round(kans * (R.start + (nieuw ? N(S.bonuscent) / nieuw : 0))), klikken: N(S.tik), kostPerKlik: N(S.tik) ? Math.round(verwacht / N(S.tik) * 10) / 10 : null, inkomenPerKlik: N(S.tik) ? Math.round(inkomen / N(S.tik) * 10) / 10 : null };
}
// elke maandag (of de eerste keer): rente naar inkomsten / verwachte kosten, met hooguit 25% stap per week
export async function renteZet(c, D) {
  const oud = await kv.get(c.ns + 'eco:rente').catch(() => null), maandag = new Date(D + 'T12:00:00Z').getUTCDay() === 1;
  if (oud && (!maandag || oud.sinds === D)) return oud;
  const s = await ecoStand(c, D); let f = oud ? N(oud.f) || 1 : 1;
  if (oud && s.verwacht > 0) { const doel = f * s.inkomen / s.verwacht; f = Math.min(f * ECO.stap, Math.max(f / ECO.stap, doel)); } // de eerste keer: basis
  f = Math.min(ECO.maxF, Math.max(ECO.minF, Math.round(f * 100) / 100));
  const r = { f, sinds: D, inkomen: s.inkomen, verwacht: s.verwacht, vorig: oud ? N(oud.f) : null }; await kv.set(c.ns + 'eco:rente', r); await renteLees(c); return r;
}
// winst op een aankoop van een lid (centen, na inkoop en verzending); aan te roepen vanuit de shop zodra een bestelling aan een Spaarpot-klik hangt
export async function ecoVerkoop(test, winstCent) { const c = await wereld(!!test); await eco(c, 'winstcent', winstCent); }

// ---------- lerend: Clickmind-proef spaarpot (lib/proef.js) ----------
// Henkjan 20 nov 2026: "Maak het volkomen lerend . ALLE variabelen". Elke deelnemer krijgt van elk onderdeel een versie (cookie dkpf op de
// aanmeldpagina, daarna op zijn record p.pf); de server meldt zie, aanvraag, bevestigd, terug, deel, product en vriend. Stand: op=dkstand.
const ctxVan = ua => /iphone|ipad/i.test(String(ua)) ? 'i' : /android/i.test(String(ua)) ? 'a' : 'd';
const proefSite = c => c.test ? 'spaarpottest' : 'spaarpot';
const V = (pf, f) => (pf && pf.v && pf.v[f]) || 'a';
async function beslis(c, ua) { try { const b = await proefBeslis(kv, { site: proefSite(c), ctx: ctxVan(ua) }); if (b && b.ok && b.aan) return { pid: b.pid, d: b.d, r: b.r, v: b.v, c: ctxVan(ua) }; } catch (e) {} return null; }
async function ev(c, pf, e, extra = {}) { if (!pf || !pf.pid) return; try { await proefEv(kv, { site: proefSite(c), pid: pf.pid, d: pf.d, r: pf.r, c: pf.c, e, ...extra }); } catch (x) {} }
const zie = (c, pf, fs) => ev(c, pf, 'zie', { v: Object.fromEntries(fs.map(f => [f, V(pf, f)])) });
async function pfVan(c, p, ua) { if (p && !p.pf) { p.pf = await beslis(c, ua); if (p.pf) await bewaar(c, p); } return p ? p.pf : null; }

// ---------- aanmelden en bevestigen ----------
export async function aanmelden(c, b, ip, pf = null) {
  const email = String(b.email || '').trim().toLowerCase(); if (!okMail(email)) return { ok: false, fout: 'Vul een geldig e-mailadres in.' };
  if (b.oud !== true && b.oud !== '1') return { ok: false, fout: 'Meedoen kan vanaf 18 jaar met een woonadres in Nederland.' };
  if (!(await aanStaat(c))) return { ok: false, fout: 'De Spaarpot is nog niet begonnen.' };
  if (!(await mailKlaar())) return { ok: false, fout: 'Even niet beschikbaar.' };
  if (b.website || N(b.ms) < 1200) return { ok: true }; // honingpot of te snel
  const rk = c.ns + 'rl:' + h(ip + ':' + Math.floor(Date.now() / 60000)).slice(0, 20); const n = N(await kv.incr(rk)); if (n === 1) await kv.raw(['EXPIRE', rk, '120']); if (n > 6) return { ok: false, fout: 'Even te druk, probeer het zo nog eens.' };
  const id = idVan(email), oud = await lees(c, id); if (oud && oud.actief) return { ok: true, al: true };
  if (!(await kv.raw(['SET', c.ns + 'er:' + id, '1', 'NX', 'EX', '600']))) return { ok: true };
  let van = ''; const vc = String(b.v || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8); if (vc) { const r = String((await kv.get(c.ns + 'code:' + vc)) || ''); if (r && r !== id) van = r; }
  const t = tok(); await kv.set(c.ns + 'pending:' + h(t), { id, email, van, at: Date.now(), pf }, { ex: 2 * 86400 });
  await stuurMails([{ to: [email], subject: (c.test ? '[TEST] ' : '') + 'Bevestig je Kadoly Spaarpot', html: mailBevestig(u(c, 'dkbevestig', '&t=' + t)) }], 'dk-bev-' + h(t).slice(0, 32));
  await tel(c, 'aanvraag'); await ev(c, pf, 'aanvraag'); return { ok: true };
}
async function nieuweCode(c, id) { for (let i = 0; i < 6; i++) { const k = randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6); if (k.length === 6 && (await kv.raw(['SET', c.ns + 'code:' + k, id, 'NX']))) return k; } return ''; }
async function maak(c, { id, email, van = '', at = Date.now() }) {
  const s = { id, email, at, bevestigd: Date.now(), actief: true, af: tok(), link: tok(), code: await nieuweCode(c, id), van, reeks: 0, laatste: '', dagen: 0, act: false, pot: 0, log: [] };
  await eco(c, 'startcent', boek(s, R.start, await vandaag(c), 'start')); // gevulde spaarpot bij de start
  await bewaar(c, s); await kv.set(c.ns + 'link:' + h(s.link), id); await kv.set(c.ns + 'af:' + h(s.af), id); await kv.raw(['SADD', c.ns + 'emails', id]);
  if (van) await kv.raw(['SADD', c.ns + 'kids:' + van, id]); return s;
}
export async function bevestig(c, t) {
  if (!/^[a-f0-9]{48}$/.test(t || '')) return null; const p = await kv.get(c.ns + 'pending:' + h(t)); if (!p) return null;
  const oud = await lees(c, p.id); if (oud && oud.actief) return oud;
  const s = await maak(c, p); if (p.pf) { s.pf = p.pf; await bewaar(c, s); } await kv.set(c.ns + 'pending:' + h(t), { ...p, klaar: Date.now() }, { ex: 2 * 86400 }); await tel(c, 'bevestigd'); return s;
}
export async function afmelden(c, t, weer) {
  if (!/^[a-f0-9]{48}$/.test(t || '')) return null; const id = await kv.get(c.ns + 'af:' + h(t)); if (!id) return null; const p = await lees(c, id); if (!p) return null;
  if (weer) { p.actief = true; p.rust = false; await kv.raw(['SADD', c.ns + 'emails', id]); } else { p.actief = false; p.afAt = Date.now(); await kv.raw(['SREM', c.ns + 'emails', id]); await tel(c, 'af'); }
  await bewaar(c, p); return p;
}
export async function vanLink(c, k) { if (!/^[a-f0-9]{48}$/.test(k || '')) return null; const id = await kv.get(c.ns + 'link:' + h(k)); return id ? lees(c, id) : null; }

// ---------- pot ----------
function boek(p, cent, D, wat) { const voor = N(p.pot); p.pot = Math.min(R.potMax, voor + Math.round(cent)); const echt = p.pot - voor; if (echt) p.log = [{ D, c: echt, w: wat }, ...(p.log || [])].slice(0, 30); return echt; }
export async function tik(c, p, D) {
  if (p.laatste === D) return p;
  if (p.laatste && p.laatste < plusDag(D, -R.vervalNa) && N(p.pot) > 0) { p.vervallen = { D, c: p.pot }; await eco(c, 'vervalcent', p.pot); p.pot = 0; }
  p.reeks = p.laatste === plusDag(D, -1) ? N(p.reeks) + 1 : 1; p.dagen = N(p.dagen) + 1; p.laatste = D; p.rust = false;
  let rente = boek(p, R.tik, D, 'tik'); if (p.reeks % R.reeksElke === 0) rente += boek(p, R.reeksBonus, D, 'reeks'); await eco(c, 'rentecent', rente);
  await kv.raw(['SADD', c.ns + 'tik:' + D, p.id]); await kv.raw(['EXPIRE', c.ns + 'tik:' + D, 90 * 86400]);
  if (!p.act && p.van && p.dagen >= R.vriendDagen) { p.act = true; await kv.raw(['SADD', c.ns + 'act:' + p.van, p.id]);
    // nieuwe vriend telt zwaarder (Pinduoduo-les, voorstel 20 nov): beiden de vriendbonus; betaald uit wat een advertentie voor dit lid anders kost
    let b = boek(p, R.vriendBonus, D, 'nieuwevriend'); const iv = await lees(c, p.van); if (iv && iv.actief) { b += boek(iv, R.vriendBonus, D, 'nieuwevriend'); await bewaar(c, iv); }
    await eco(c, 'bonuscent', b); await eco(c, 'lidvriend', 1); }
  if (N(p.dagen) >= 2) await ev(c, p.pf, 'terug'); // komt terug op een latere dag
  p.gaf = { D, n: await geefVrienden(c, p, D) }; // jij klikt voor hen
  await bewaar(c, p); await tel(c, 'tik'); return p;
}
// vrienden: wie jij uitnodigde (actief) en wie jou uitnodigde (zodra jij actief bent); vrienden van vrienden: hun vrienden, zonder jou en je vrienden
async function buren(c, id, p) { const s = new Set(await smem(c.ns + 'act:' + id)); if (p === undefined) p = await lees(c, id); if (p && p.act && p.van) s.add(p.van); s.delete(id); return s; }
export async function kring(c, id, p) {
  const v1 = await buren(c, id, p); let vriendenPot = 0; for (const f of v1) { const q = await lees(c, f); if (q && q.actief) vriendenPot += N(q.pot); }
  const alle = N(await kv.raw(['SCARD', c.ns + 'kids:' + id]).catch(() => 0)), eigen = N(await kv.raw(['SCARD', c.ns + 'act:' + id]).catch(() => 0));
  return { v1, vriendenPot, onderweg: Math.max(0, alle - eigen) };
}
// elke klik geeft elke vriend direct R.vriend, hooguit R.vriendMax per ontvanger per dag (p.samen = wat iemand die dag van vrienden kreeg)
const vanGisteren = (p, D) => [p.samen, p.samenVorig].find(x => x && x.D === plusDag(D, -1) && x.c) || null;
async function geefVrienden(c, p, D) {
  let n = 0;
  for (const f of await buren(c, p.id, p)) { const q = await lees(c, f); if (!q || !q.actief) continue;
    if (!q.samen || q.samen.D !== D) { if (q.samen && q.samen.c) q.samenVorig = q.samen; q.samen = { D, n: 0, c: 0 }; } const ruimte = R.vriendMax - N(q.samen.c); if (ruimte <= 0) continue;
    const echt = boek(q, Math.min(R.vriend, ruimte), D, 'samen'); if (!echt) continue; q.samen.n++; q.samen.c += echt; await bewaar(c, q); n++; await eco(c, 'rentecent', echt); await tel(c, 'samencent', echt); }
  return n;
}

// ---------- producten (shopcatalogus) ----------
let CAT = null, CAT_AT = 0;
// een lege uitkomst (KV even niet bereikbaar) niet onthouden, anders blijft het cadeau 10 minuten weg
// KOST: inkoop (zonder btw) en de verzending die wij betalen, per product, zoals de shop die doorgeeft (lib/shopmarge.js, kv hjdk:shop:kost)
let KOST = {};
async function catalogus() { if (CAT && CAT.length && Date.now() - CAT_AT < 600000) return CAT; let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {} try { KOST = (await kv.get('hjdk:shop:kost')) || {}; } catch (e) {} CAT = (c && Array.isArray(c.items)) ? c.items : []; CAT_AT = Date.now(); return CAT; }
// Wat een cadeau Henkjan echt kost (Henkjan 20 nov: "Ik moet dat cadeau inkoop en verzend betalen natuurlijk"): inkoop met btw (een weggegeven
// product: btw op de inkoop rekenen we voorzichtig als kosten) plus de verzending die wij betalen. Zonder doorgegeven inkoop een schatting uit de
// marge: prijs en verzending van de klant min de marge met btw. In centen; geschat = true als het een schatting is.
function kostVan(i) { const k = KOST[i.id]; if (k && k.c != null) return { kost: Math.round((N(k.c) * 1.21 + N(k.z)) * 100), geschat: false };
  const klant = N(i.p) + N(i.vk); return { kost: Math.round(Math.max(0, klant - N(i.mg) * 1.21) * 100), geschat: true }; }
// geen babyspullen als cadeau of eerste doel (20 nov: het eerste doel was een set peuterlepels, het cadeau-idee een ledikantdeken)
const geenCadeau = i => i.c === 'kids' && /^(baby|kinderkamer|overig)$/.test(String(i.s || '')) || /peuter|baby|ledikant|verschoon|bedbumper|borstvoeding|slaapzak/i.test(String(i.t || ''));
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
// levertijd: bekend en hooguit R.leverMax, of onbekend (de shop-API geeft delivery_days niet altijd mee; 20 nov: daardoor bleef de lijst leeg)
const snel = i => i && i.img && i.vr !== false && !geenCadeau(i) &&(!N(i.lt) || N(i.lt) <= R.leverMax) && N(i.p) > 0 && !/^[A-Z][a-z]+ (for|with|and|the) /.test(String(i.t || ''));
const populair = i => N(i.so30) * 3 + N(i.ca7) + N(i.so7) * 5;
const kort = i => ({ pid: i.id, naam: i.t, prijs: thuis(i), img: i.img, lt: N(i.lt), ...kostVan(i) }); // kost: wat het cadeau Henkjan kost (centen)
// verhouding kosten / tegoed: hoe lager, hoe meer cadeau per euro die Henkjan uitgeeft
const verh = o => o.prijs > 0 ? o.kost / Math.round(o.prijs * 100) : 9;
const lev = i => N(i.lt) || 9;
// cadeaus: de 30 met het meeste cadeau per euro die Henkjan uitgeeft (kosten / tegoed laagst), bekende inkoop voor een schatting; nooit een cadeau dat meer kost dan het tegoed
export async function cadeaus() { return (await catalogus()).filter(i => snel(i) && thuis(i) <= R.prijsMax).map(i => ({ ...kort(i), _p: populair(i), _l: lev(i) })).filter(o => verh(o) <= 1)
  .sort((a, b) => (a.geschat - b.geschat) || (Math.round(verh(a) * 20) - Math.round(verh(b) * 20)) || b._p - a._p || a._l - b._l || a.prijs - b.prijs).slice(0, 30).map(({ _p, _l, ...o }) => o); }
export async function dagProducten(D) { const L = (await catalogus()).filter(i => snel(i) && thuis(i) <= 60).sort((a, b) => populair(b) - populair(a)).slice(0, 30); if (!L.length) return []; const s = Number(BigInt('0x' + h('dp:' + D).slice(0, 12)) % BigInt(L.length)); return [0, 1, 2].map(j => L[(s + j * 7) % L.length]).filter((x, j, a) => a.indexOf(x) === j).map(kort); }
// ---------- meer of minder van dit ----------
// Henkjan 20 nov 2026: "Waar klik je precies op ? Daar kunnen we leer element in brengen . Meer of minder van dit . En zo verzamelen we ook data
// de handeling wordt betaald de uitkomst niet ." De klik van de dag is een oordeel over één product: Meer van dit of Minder van dit. Beide knoppen
// tellen als klik en geven precies hetzelfde tegoed, dus niemand wordt betaald voor een bepaald antwoord. Elk oordeel leert: per product (iedereen)
// en per soort (de deelnemer zelf). Het product van morgen: wat anderen vaak 'meer' gaven, wat bij jouw soorten past, plus verkenning; nooit iets
// wat je al beoordeelde. De oordelen samen zijn een smaakpanel (stand in op=dkstand), ook waardevol voor merken.
const soortVan = i => (String(i.c || '-') + '>' + String(i.s || '-')).slice(0, 40);
async function oordelen(c) { return hash(await kv.raw(['HGETALL', c.ns + 'oordeel']).catch(() => [])); }
export async function dagProductVoor(c, p, D, O = null) {
  O = O || await oordelen(c); const zag = new Set((p.smaak && p.smaak.zag) || []), cat = (p.smaak && p.smaak.cat) || {};
  const L = (await catalogus()).filter(i => snel(i) && thuis(i) <= 60 && !zag.has(i.id)).sort((a, b) => populair(b) - populair(a)).slice(0, 300); if (!L.length) return null;
  let best = null, bs = -1;
  for (const i of L) { const m = N(O[i.id + '|meer']), n = N(O[i.id + '|minder']), g = (m + 1) / (m + n + 2), a = Math.max(-3, Math.min(3, N(cat[soortVan(i)]))) / 3, ruis = parseInt(h(p.id + D + i.id).slice(0, 6), 16) / 0xffffff;
    const s = g + 0.25 * a + 0.35 * ruis; if (s > bs) { bs = s; best = i; } }
  return best ? kort(best) : null;
}
const productVan = async pid => { const i = (await catalogus()).find(x => x.id === pid); return i ? kort(i) : null; };
async function oordeel(c, p, D, pid, o) { // één oordeel per dag; true als het telde
  if (!pid || (o !== 'meer' && o !== 'minder') || (p.smaak && p.smaak.D === D)) return false;
  const i = (await catalogus()).find(x => x.id === pid); const sm = p.smaak || { cat: {}, zag: [] }; sm.cat = sm.cat || {};
  sm.D = D; sm.o = o; sm.pid = pid; sm.zag = [pid, ...(sm.zag || []).filter(x => x !== pid)].slice(0, 120); if (i) { const k = soortVan(i); sm.cat[k] = N(sm.cat[k]) + (o === 'meer' ? 1 : -1); }
  sm.n = N(sm.n) + 1; sm.meer = N(sm.meer) + (o === 'meer' ? 1 : 0); p.smaak = sm;
  await kv.raw(['HINCRBY', c.ns + 'oordeel', pid + '|' + o, 1]); if (i) await kv.raw(['HINCRBY', c.ns + 'oordeel', 'soort:' + soortVan(i) + '|' + o, 1]);
  await tel(c, 'oordeel-' + o); return true;
}
async function smaakStand(c) { // smaakpanel: producten en soorten met de meeste 'meer' (vanaf 5 oordelen)
  const O = await oordelen(c), P = {}, S = {}; for (const [k, v] of Object.entries(O)) { const [x, o] = k.split('|'); const doelL = x.startsWith('soort:') ? S : P; const id = x.replace(/^soort:/, ''); (doelL[id] = doelL[id] || { meer: 0, minder: 0 })[o] = v; }
  const rij = (M, n) => Object.entries(M).map(([id, x]) => ({ id, meer: x.meer, minder: x.minder, n: x.meer + x.minder, pct: Math.round(x.meer / Math.max(1, x.meer + x.minder) * 100) })).filter(x => x.n >= n).sort((a, b) => b.pct - a.pct || b.n - a.n);
  const pr = rij(P, 5).slice(0, 10); for (const x of pr) { const k = await productVan(x.id); if (k) x.naam = k.naam; }
  return { oordelen: Object.values(P).reduce((s, x) => s + x.meer + x.minder, 0), producten: pr, soorten: rij(S, 5).slice(0, 10) };
}
async function doel(pot) { const L = (await cadeaus()).slice().sort((a, b) => a.prijs - b.prijs); const kan = L.filter(o => Math.round(o.prijs * 100) <= pot); return { kan, volgende: L.find(o => Math.round(o.prijs * 100) > pot) || null, goedkoopst: L[0] || null }; }

// ---------- mails ----------
const BEREIK = 'Vragen? Antwoord op deze mail, of app of bel +31 6 55395630.';
const voet = (c, p) => `${esc(KADOLY_BEDRIJF)}<br>${BEREIK}<br>Elke ochtend één mail. <a href="${u(c, 'dkregels')}" style="color:#0B0D12">Voorwaarden</a>${p ? ` · <a href="${u(c, 'dkaf', '&t=' + p.af)}" style="color:#0B0D12">Afmelden met één klik</a>` : ''}`;
export function mailBevestig(url) {
  return mailSchil({ titel: 'Bevestig je Spaarpot', voorkop: `Eén klik en je spaarpot staat klaar, al gevuld met ${ct(R.start)}.`,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Bevestig je Spaarpot</h1><p style="margin:0 0 20px">Klik op de knop en je pot staat klaar, met ${ct(R.start)} erin. Elke dag dat je klikt, komt er tegoed bij. Klikken je vrienden, dan spaar jij mee. Is je pot genoeg, dan kies je een cadeau en sturen wij het gratis op.</p><p style="margin:0 0 22px">${knop(url, 'Start mijn Spaarpot')}</p><p style="margin:0">Heb je je niet aangemeld? Dan hoef je niets te doen. Zonder bevestiging krijg je niets van ons.</p>`,
    voet: esc(KADOLY_BEDRIJF) + '<br>' + BEREIK });
}
export function mailDag(c, p, { D, doelTekst = '', k = null, dp = null }) {
  const nv = k ? k.v1.size : 0, g = vanGisteren(p, D);
  const reeks = p.laatste === plusDag(D, -1) ? N(p.reeks) : 0, bonus = reeks && (reeks + 1) % R.reeksElke === 0 ? ` Vandaag is dag ${reeks + 1} op rij: dan krijg je er ${ct(R.reeksBonus)} bij.` : '';
  const kop = nv ? `Samen gespaard: ${ct(N(p.pot) + k.vriendenPot)}` : `Je pot: ${ct(p.pot)}`;
  const gist = g ? `Gisteren klikten ${g.n} ${g.n === 1 ? 'vriend' : 'vrienden'} voor je: +${ct(g.c)} in jouw pot.` : '';
  const stand = ((nv ? `Jouw pot: ${ct(p.pot)}. ` : '') + doelTekst).trim();
  const onder = nv ? `Jij krijgt ${ct(R.tik)} en ${nv === 1 ? 'je vriend krijgt' : 'je ' + nv + ' vrienden krijgen elk'} ${ct(R.vriend)}.${bonus}` : `Er komt ${ct(R.tik)} in je pot.${bonus} Nodig een vriend uit, dan klikken jullie voor elkaar.`;
  const P = t => t ? `<p style="margin:0 0 14px">${esc(t)}</p>` : '';
  // de klik van de dag: meer of minder van dit product; beide knoppen even groot en allebei dezelfde beloning (de handeling telt, niet de uitkomst)
  const kl = o => u(c, 'dkgo', '&w=t&m=1&o=' + o + '&p=' + encodeURIComponent(dp.pid) + '&k=' + p.link), b = V(p.pf, 'mknop') === 'b';
  const keuze = dp ? `<p style="margin:10px 0 6px;font-weight:700">${nv ? 'Klik voor je vrienden: m' : 'M'}eer of minder van dit?</p><p style="margin:0 0 10px"><img src="${esc(dp.img)}" alt="" width="240" style="width:240px;max-width:100%;height:auto;border-radius:12px;display:block"></p><p style="margin:0 0 12px">${esc(dp.naam)}</p>`
    + `<p style="margin:0 0 6px">${knop(kl('meer'), b ? 'Ja, leuk' : 'Meer van dit')}</p><p style="margin:0 0 12px">${knop(kl('minder'), b ? 'Niet mijn ding' : 'Minder van dit')}</p><p style="margin:0 0 6px">Wat je ook kiest, je klik telt. ${esc(onder)}</p><p style="margin:0">Je keuze bepaalt wat je morgen ziet.</p>`
    : `<p style="margin:6px 0 12px">${knop(u(c, 'dkgo', '&w=t&m=1&k=' + p.link), nv ? 'Klik voor je vrienden' : 'Klik voor vandaag')}</p><p style="margin:0">${esc(onder)}</p>`;
  return mailSchil({ titel: 'Je Spaarpot', voorkop: gist || onder,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">${esc(kop)}</h1>${P(gist)}${P(stand)}${keuze}`,
    voet: voet(c, p) });
}
function onderwerp(p, D, pot, k) {
  if (!k.v1.size) return `Je pot: ${ct(pot)} · klik voor vandaag`;
  if (V(p.pf, 'onderwerp') === 'b') { const g = vanGisteren(p, D); return g ? `${g.n} ${g.n === 1 ? 'vriend klikte' : 'vrienden klikten'} voor je · klik terug` : `Samen gespaard: ${ct(pot + k.vriendenPot)} · klik terug`; }
  return `Samen gespaard: ${ct(pot + k.vriendenPot)} · klik voor je vrienden`;
}
const lijstKop = (c, p) => ({ 'List-Unsubscribe': `<${u(c, 'dkaf', '&t=' + p.af)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });

// ---------- dagronde: vriendentegoed van gisteren en de dagmail ----------
export async function ronde(c, { mail = true } = {}) {
  const D = await vandaag(c), uit = { D, mails: 0, rust: 0 };
  if (!(await aanStaat(c))) return { ...uit, uit: 'niet aan' };
  try { uit.rente = await renteZet(c, D); } catch (e) { uit.renteFout = String(e.message || e).slice(0, 120); }
  if (c.test) { let n = 0; for (const id of await smem(c.ns + 'emails')) { const p = await lees(c, id); if (p && p.actief && nep(p.email) && p.van) { await tik(c, p, D); n++; } } uit.testvrienden = n; } // testvrienden tikken elke dag
  if (!mail) return uit;
  const L = (await cadeaus()).slice().sort((a, b) => a.prijs - b.prijs), batch = [], O = await oordelen(c);
  for (const id of await smem(c.ns + 'emails')) { const p = await lees(c, id); if (!p || !p.actief || nep(p.email)) continue;
    const laatst = p.laatste || amsDag(N(p.bevestigd)); if (laatst < plusDag(D, -R.rustNa)) { if (!p.rust) { p.rust = true; await bewaar(c, p); } uit.rust++; continue; }
    const k = await kring(c, id, p), pot = N(p.pot), kan = L.some(o => Math.round(o.prijs * 100) <= pot), vlg = L.find(o => Math.round(o.prijs * 100) > pot);
    const doelTekst = kan ? 'Je pot is genoeg voor een cadeau: kies het op je pagina.' : vlg ? `Nog ${ct(Math.round(vlg.prijs * 100) - pot)}, dan kies je ${vlg.naam} gratis.` : '';
    const dp = await dagProductVoor(c, p, D, O).catch(() => null);
    if (p.pf && !p.mzie) { await zie(c, p.pf, k.v1.size ? ['onderwerp', 'mknop'] : ['mknop']); p.mzie = 1; await bewaar(c, p); }
    batch.push({ to: [p.email], subject: (c.test ? '[TEST] ' : '') + onderwerp(p, D, pot, k), html: mailDag(c, p, { D, doelTekst, k, dp }), headers: lijstKop(c, p) }); }
  for (let i = 0; i < batch.length; i += 90) { await stuurMails(batch.slice(i, i + 90), 'dk-dag-' + c.ns + D + '-' + i); uit.mails += batch.slice(i, i + 90).length; }
  await tel(c, 'dagmail', uit.mails); return uit;
}

// ---------- cadeau kiezen ----------
const schoon = (v, n) => String(v || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
export async function kies(c, p, b, D) {
  const keuze = (await cadeaus()).find(o => o.pid === String(b.pid || '')); if (!keuze) return { fout: 'Kies een cadeau.' };
  const prijs = Math.round(keuze.prijs * 100); if (prijs > N(p.pot)) return { fout: 'Je pot is nog niet genoeg voor dit cadeau.' };
  const a = { voornaam: schoon(b.voornaam, 40), achternaam: schoon(b.achternaam, 60), adres: schoon(b.adres, 100), postcode: schoon(b.postcode, 10).toUpperCase(), plaats: schoon(b.plaats, 60) };
  if (!a.voornaam || !a.achternaam || !a.adres || !/^[1-9][0-9]{3} ?[A-Z]{2}$/.test(a.postcode) || !a.plaats) return { fout: 'Vul je naam en een Nederlands adres in.' };
  if (!(await kv.raw(['SET', c.ns + 'kiesslot:' + p.id, '1', 'NX', 'EX', '20']))) return { fout: 'Even geduld, je keuze wordt al verwerkt.' };
  p.pot = N(p.pot) - prijs; p.log = [{ D, c: -prijs, w: 'cadeau' }, ...(p.log || [])].slice(0, 30); p.cadeaus = [...(p.cadeaus || []), { D, pid: keuze.pid, naam: keuze.naam, c: prijs }].slice(-20);
  await bewaar(c, p); await kv.set(c.ns + 'adres:' + p.id + ':' + D, a, { ex: 60 * 86400 }); await tel(c, 'cadeau'); await tel(c, 'cadeaucent', prijs); await eco(c, 'kostcent', keuze.kost);
  try { await mailHenkjan({ subject: (c.test ? '[TEST] ' : '') + 'Spaarpot: bestel ' + keuze.naam + ' voor ' + a.voornaam, html: mailSchil({ titel: 'Spaarpot: bestellen', voorkop: keuze.naam, inhoud: `<h1 style="font-size:22px;margin:0 0 12px">Spaarpot-cadeau: graag bestellen</h1><p style="margin:0 0 6px"><b>Product:</b> ${esc(keuze.naam)} (${euro(keuze.prijs)} incl. verzending, ${keuze.lt ? keuze.lt + (keuze.lt === 1 ? ' werkdag' : ' werkdagen') : 'levertijd onbekend'})<br><a href="https://kadoly.com/product/${encodeURIComponent(keuze.pid)}">kadoly.com/product/${esc(keuze.pid)}</a></p><p style="margin:12px 0 0"><b>Sturen naar:</b><br>${esc(a.voornaam)} ${esc(a.achternaam)}<br>${esc(a.adres)}<br>${esc(a.postcode)} ${esc(a.plaats)}<br>${esc(p.email)}</p><p style="margin:12px 0 0"><b>Kost jou:</b> ${ct(keuze.kost)} aan inkoop met btw en verzending${keuze.geschat ? ' (geschat uit de marge; de shop gaf voor dit product geen inkoop door)' : ''}.</p><p style="margin:12px 0 0">Gespaard in ${N(p.dagen)} ${N(p.dagen) === 1 ? 'dag' : 'dagen'}. Pot na deze keuze: ${ct(p.pot)}.</p>`, voet: esc(KADOLY_BEDRIJF) }), replyTo: p.email }); } catch (e) {}
  return { ok: true, keuze };
}

// ---------- pagina's ----------
export const CSS = `<style>.dk-k{border:1px solid var(--line-strong);border-radius:16px;padding:16px 18px;margin:0 0 16px}.dk-k h2{margin:0 0 8px;font-size:24px}.dk-w{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc-2)}.dk-b{height:12px;border-radius:6px;background:var(--acc-2);overflow:hidden;margin:10px 0 8px}.dk-b i{display:block;height:100%;background:var(--acc);border-radius:6px}.dk-p{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.dk-top{display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:center;text-decoration:none;color:inherit;margin:0 0 10px}.dk-top img{width:96px;height:96px;object-fit:cover;border-radius:12px}.dk-p a{display:block;text-decoration:none;color:inherit}.dk-p img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;display:block;margin:0 0 6px}.dk-f{display:grid;gap:10px;max-width:520px}.dk-f input[type=email],.dk-f input[type=text]{min-height:48px;border:1px solid var(--line-strong);border-radius:12px;padding:10px 12px;font:inherit;background:var(--bg);color:var(--ink)}.dk-f label.vk{display:flex;gap:10px;align-items:flex-start}.dk-f label.vk input{width:20px;height:20px;accent-color:#1D9BF0;flex:none;margin-top:2px}.dk-t{border:2px dashed #1D9BF0;border-radius:16px;padding:14px 16px;margin:0 0 18px}.dk-t a{margin:0 8px 8px 0}.dk-o{display:grid;gap:10px;margin:0 0 18px}.dk-o label{display:flex;gap:12px;align-items:center;border:1px solid var(--line-strong);border-radius:14px;padding:10px 12px;cursor:pointer}.dk-o label:has(input:checked){border-color:var(--acc);box-shadow:0 0 0 2px var(--acc-2)}.dk-o img{width:56px;height:56px;border-radius:10px;object-fit:cover;flex:none}.dk-o input{accent-color:#1D9BF0;width:20px;height:20px;flex:none}</style>`;
export function testBalk(c, D, p) {
  if (!c.test) return '';
  const a = (actie, tekst, extra = '') => `<a class="btn deel" href="${u(c, 'dktest', '&actie=' + actie + (p ? '&k=' + p.link : '') + extra)}">${esc(tekst)}</a>`;
  return `<div class="dk-t"><p><b>Testwereld</b> · testdag ${esc(datumNl(D))}. Niets hiervan raakt echte deelnemers. Mails krijgen [TEST] in het onderwerp.</p>${p ? '' : a('maak', 'Snel een testdeelnemer zonder mail')}${a('volgende', 'Volgende dag (vrienden klikken + ochtendmail)')}${a('volgende', 'Volgende dag zonder mail', '&mail=0')}${p ? a('vrienden', 'Maak 4 testvrienden', '&n=4') + a('reeks', 'Zet mijn reeks op 9', '&n=9') + a('pot', 'Zet €10 in mijn pot', '&n=1000') : ''}<a class="btn deel" href="${u(c, 'dkmails', p ? '&k=' + p.link : '')}">Bekijk de mails</a>${a('lijst', 'Alle testdeelnemers')}${a('wis', 'Alles wissen')}</div>`;
}
export function aanmeldBlok(c, v, knopTekst = 'Start mijn Spaarpot') {
  return `<form class="dk-f" id="dkf"><input type="email" name="email" required placeholder="Je e-mailadres" aria-label="Je e-mailadres" autocomplete="email"><input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><label class="vk"><input type="checkbox" name="oud" value="1" required><span>Ik ben 18 jaar of ouder en woon in Nederland.</span></label><button class="btn knop" type="submit">${esc(knopTekst)}</button><p class="meta" id="dko" role="status"></p></form>
<script>(function(){var f=document.getElementById('dkf'),o=document.getElementById('dko'),t0=Date.now();f.addEventListener('submit',function(e){e.preventDefault();o.textContent='Even geduld…';fetch(${JSON.stringify(u(c, 'dkaanmelden'))},{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:f.email.value,oud:f.oud.checked,website:f.website.value,ms:Date.now()-t0,v:${JSON.stringify(v || '')}})}).then(function(r){return r.json()}).then(function(j){o.textContent=j&&j.ok?'Bijna klaar: bevestig via de mail die we je net stuurden.':((j&&j.fout)||'Dat lukte even niet.')})['catch'](function(){o.textContent='Dat lukte even niet.'})})})();</script>`;
}
export function uitlegHtml() {
  return `<dl class="rows"><div class="r"><dt>Je start</dt><dd>Bij je aanmelding staat er meteen ${ct(R.start)} in je pot.</dd></div><div class="r"><dt>Elke dag</dt><dd>Je krijgt elke ochtend één mail. Eén klik en er komt ${ct(R.tik)} in je pot. Elke 10e dag op rij ${ct(R.reeksBonus)} extra.</dd></div><div class="r"><dt>Spaarrente</dt><dd>Wat een klik oplevert, is de spaarrente van deze week. Die stelt zich elke maandag in op wat de Spaarpot samen opbrengt: hoe meer we samen zijn en hoe meer er bij Kadoly gekocht wordt, hoe hoger. Wat in je pot zit, blijft altijd staan.</dd></div><div class="r"><dt>Samen</dt><dd>Nodig vrienden uit met je eigen link. Klikt een vriend, dan krijg jij ${ct(R.vriend)}. Klik jij, dan krijgt elke vriend ${ct(R.vriend)}. Jij klikt voor hen, zij klikken voor jou.</dd></div><div class="r"><dt>Je cadeau</dt><dd>Is je pot genoeg, dan kies je een cadeau tot ${euro(R.prijsMax)}. Wij sturen het gratis op. Geen loting: wat je spaart, is van jou.</dd></div></dl>`;
}
export async function dagHtml(c, p, D, bovenaan = '') {
  const k = await kring(c, p.id, p), d = await doel(N(p.pot)), nv = k.v1.size, vandaagBij = (p.log || []).filter(x => x.D === D && x.c > 0);
  const gaf = p.gaf && p.gaf.D === D ? N(p.gaf.n) : 0, kreeg = p.samen && p.samen.D === D && p.samen.c ? p.samen : null, gist = vanGisteren(p, D);
  const wie = n => `${n} ${n === 1 ? 'vriend' : 'vrienden'}`, pl = x => `${u(c, 'dkgo', '&w=p&p=' + encodeURIComponent(x.pid) + '&k=' + p.link)}`; // via Clickmind
  const pf = p.pf; await zie(c, pf, ['deel', 'deeltekst', 'product']);
  const blokken = [];
  if (p.vervallen && p.vervallen.D === D) blokken.push(`<div class="dk-k"><p>Je vorige pot van ${ct(p.vervallen.c)} is vervallen, omdat je ${R.vervalNa} dagen niet klikte. Vanaf vandaag spaar je opnieuw.</p></div>`);
  const regels = [vandaagBij.some(x => x.w === 'start') ? `+${ct(R.start)} startpot.` : '',
    vandaagBij.some(x => x.w === 'tik') ? `+${ct(R.tik)} voor je klik${gaf ? `, en je klik gaf ${gaf === 1 ? 'je vriend' : wie(gaf) + ' elk'} ${ct(R.vriend)}` : ''}.` : '',
    vandaagBij.some(x => x.w === 'reeks') ? `+${ct(R.reeksBonus)} voor ${p.reeks} dagen op rij.` : '',
    vandaagBij.filter(x => x.w === 'nieuwevriend').length ? `+${ct(vandaagBij.filter(x => x.w === 'nieuwevriend').reduce((s, x) => s + x.c, 0))}: een nieuwe vriend klikte 3 dagen, jullie krijgen allebei ${ct(R.vriendBonus)}.` : '',
    kreeg ? `+${ct(kreeg.c)}, want ${wie(kreeg.n)} ${kreeg.n === 1 ? 'klikte' : 'klikten'} vandaag voor je.` : '',
    gist ? `Gisteren klikten ${wie(gist.n)} voor je: +${ct(gist.c)}.` : ''].filter(Boolean);
  const tot = R.reeksElke - (N(p.reeks) % R.reeksElke);
  blokken.push(`<div class="dk-k"><h2>${nv ? `Samen gespaard: ${ct(N(p.pot) + k.vriendenPot)}` : 'Vandaag'}</h2>${regels.map(r => `<p>${esc(r)}</p>`).join('')}<p>Dag ${N(p.reeks)} op rij. ${tot === R.reeksElke ? `Over ${R.reeksElke} dagen` : tot === 1 ? 'Morgen' : `Over ${tot} dagen`} krijg je ${ct(R.reeksBonus)} extra.</p></div>`);
  if (d.kan.length) blokken.push(`<div class="dk-k dk-w"><h2>Je pot is genoeg voor een cadeau</h2><p>Je kunt kiezen uit ${d.kan.length} ${d.kan.length === 1 ? 'cadeau' : 'cadeaus'}. Wij sturen het gratis op. Sparen voor iets groters mag ook.</p><p><a class="btn knop" href="${u(c, 'dkkies', '&k=' + p.link)}">Kies je cadeau</a></p></div>`);
  // bovenaan het product waarover je vandaag oordeelde (of het jouwe van vandaag), daarna twee andere ideeën
  const oVandaag = p.smaak && p.smaak.D === D ? p.smaak : null, eerst = oVandaag ? await productVan(oVandaag.pid) : await dagProductVoor(c, p, D).catch(() => null);
  const pr = [eerst, ...(await dagProducten(D))].filter((x, j, a) => x && a.findIndex(y => y && y.pid === x.pid) === j).slice(0, 3);
  const oRegel = oVandaag ? `<p>Je koos: ${oVandaag.o === 'meer' ? 'meer van dit' : 'minder van dit'}. Je klik telt, wat je ook kiest. Morgen zie je iets wat daarbij past.</p>` : '';
  if (pr.length) { const [a, ...rest] = pr; blokken[V(pf, 'product') === 'b' ? 'unshift' : 'push'](`<div class="dk-k"><h2>${oVandaag ? 'Jouw product van vandaag' : 'Cadeau-idee van vandaag'}</h2>${oRegel}<a class="dk-top" href="${pl(a)}"><img src="${esc(a.img)}" alt="" loading="lazy"><span>${esc(a.naam)}<br><b>${euro(a.prijs)}</b> · ${a.lt ? a.lt + (a.lt === 1 ? ' werkdag' : ' werkdagen') : 'levertijd bij het product'}</span></a><p><a class="btn knop" href="${pl(a)}">Bekijk bij Kadoly</a></p>${rest.length ? `<div class="dk-p">${rest.map(x => `<a href="${pl(x)}"><img src="${esc(x.img)}" alt="" loading="lazy">${esc(x.naam)}<br><b>${euro(x.prijs)}</b></a>`).join('')}</div>` : ''}</div>`); }
  if (!d.kan.length && d.volgende) { const doelC = Math.round(d.volgende.prijs * 100); blokken.push(`<div class="dk-k"><h2>Nog ${ct(doelC - N(p.pot))}</h2><div class="dk-b" aria-hidden="true"><i style="width:${Math.max(3, Math.min(100, Math.round(N(p.pot) / doelC * 100)))}%"></i></div><p>Dan kies je ${esc(d.volgende.naam)} gratis.</p></div>`); }
  const deelUrl = u(c, 'dk', '&v=' + p.code + '&n=deel'), kanaal = V(pf, 'deel');
  const deelTekst = V(pf, 'deeltekst') === 'b' ? `Wie klikt er elke dag voor mij? Ik klik terug, dan sparen we allebei voor een gratis cadeau. Je pot start gevuld. ${deelUrl}` : `Doe je mee met de Kadoly Spaarpot? Je pot start gevuld. Klik jij, dan krijg ik ${ct(R.vriend)}. Klik ik, dan krijg jij ${ct(R.vriend)}. Zo sparen we samen voor een gratis cadeau. ${deelUrl}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(deelTekst)}`, ml = `mailto:?subject=${encodeURIComponent('Spaar je mee voor een gratis cadeau?')}&body=${encodeURIComponent(deelTekst)}`;
  const onderweg = k.onderweg ? ` ${k.onderweg === 1 ? '1 vriend telt' : k.onderweg + ' vrienden tellen'} mee na 3 dagen klikken.` : '';
  // delen volgens de quizlessen (spel/leerlus/viraliteit): één grote knop, zeg wat er gebeurt, daarna tweede groep en een tweede kans
  blokken.push(`<div class="dk-k"><h2>Samen sparen</h2><p>${nv ? `Je spaart samen met ${wie(nv)}. Jij klikt voor hen, zij klikken voor jou.` : `Nodig een vriend uit. Klikt hij, dan krijg jij ${ct(R.vriend)}. Klik jij, dan krijgt hij ${ct(R.vriend)}.`}${onderweg}</p><p><a class="btn knop" data-dkdeel="wa" href="${wa}" target="_blank" rel="noopener">Stuur via WhatsApp</a>${kanaal === 'b' ? ` <a class="btn deel" data-dkdeel="mail" href="${ml}">Stuur per mail</a>` : ''}</p><p class="meta">WhatsApp opent: kies een vriend of groep en tik op verstuur.</p><div id="dk2" hidden><p>Verstuurd? Stuur hem ook naar een tweede groep. Lukte het niet, kopieer dan je link.</p><p><button type="button" class="btn deel" id="dkkopie">Kopieer je link</button></p></div><p class="meta">Je eigen link: ${esc(deelUrl)}</p></div>
<script>(function(){var B=${JSON.stringify(u(c, 'dkdeel', '&k=' + p.link))},L=${JSON.stringify(deelUrl)},z=document.getElementById('dk2');document.querySelectorAll('[data-dkdeel]').forEach(function(a){a.addEventListener('click',function(){try{navigator.sendBeacon(B+'&kanaal='+a.getAttribute('data-dkdeel'))}catch(e){}setTimeout(function(){z.hidden=false},1500)})});var k=document.getElementById('dkkopie');k.addEventListener('click',function(){var t=function(){k.textContent='Gekopieerd'};try{navigator.clipboard.writeText(L).then(t,function(){k.textContent=L})}catch(e){k.textContent=L}})})();</script>`);
  return `<p class="kicker">${esc(R.naam)} · ${esc(datumNl(D))}</p><h1>Je pot: ${ct(p.pot)}</h1>${bovenaan}${blokken.join('')}<p class="meta"><a href="${u(c, 'dkregels')}">Voorwaarden</a> · <a href="${u(c, 'dkaf', '&t=' + p.af)}">Afmelden</a></p>`;
}
export const VOORWAARDEN = () => `<p class="kicker">${esc(R.naam)}</p><h1>Voorwaarden ${esc(R.naam)}</h1><dl class="rows">
<div class="r"><dt>Organisator</dt><dd>ADSFAIR B.V. (Kadoly Shop), Albert Plesmanplein 20, 2805 AB Gouda, KVK 60126035.</dd></div>
<div class="r"><dt>Wat het is</dt><dd>Een spaarpot met tegoed voor een gratis cadeau van Kadoly. Geen loterij en geen kansspel: wat je spaart, is van jou.</dd></div>
<div class="r"><dt>Meedoen</dt><dd>Gratis, zonder aankoop. Voor iedereen van 18 jaar of ouder met een woonadres in Nederland, met één bevestigd e-mailadres per persoon.</dd></div>
<div class="r"><dt>Sparen</dt><dd>Bij je aanmelding: ${ct(R.start)} startpot, één keer per persoon. Elke dag dat je op de link in je ochtendmail klikt: ${ct(R.tik)}. Elke 10e dag op rij: ${ct(R.reeksBonus)} extra. Vrienden zijn wie jou uitnodigde en wie jij uitnodigde; een vriend telt mee als hij zich via een eigen link aanmeldt en op 3 dagen klikt. Klikt een vriend, dan krijg jij direct ${ct(R.vriend)}; klik jij, dan krijgt elke vriend ${ct(R.vriend)}. Van vrienden samen krijg je hooguit ${ct(R.vriendMax)} per dag. Telt een nieuwe vriend mee, dan krijgen jullie allebei één keer ${ct(R.vriendBonus)}. Je pot is hooguit ${ct(R.potMax)}.</dd></div>
<div class="r"><dt>Spaarrente</dt><dd>De bedragen per klik, per klik van een vriend en voor 10 dagen op rij zijn de spaarrente van de week (nu ${ct(R.tik)}, ${ct(R.vriend)} en ${ct(R.reeksBonus)}). Die stelt zich elke maandag in op wat de Spaarpot samen opbrengt, met hooguit een kwart omhoog of omlaag per week. Wat al in je pot zit, verandert nooit.</dd></div>
<div class="r"><dt>Je cadeau</dt><dd>Zodra je pot genoeg is, kies je een cadeau uit de selectie van Kadoly, tot ${euro(R.prijsMax)} inclusief verzending, gratis thuisbezorgd in Nederland; de levertijd staat bij elk cadeau. Het bedrag gaat van je pot af. Tegoed is niet in te wisselen voor geld en niet over te dragen. We vragen nooit om bankgegevens of een betaling.</dd></div>
<div class="r"><dt>Vervallen</dt><dd>Klik je ${R.rustNa} dagen niet, dan sturen we geen ochtendmail meer; je link blijft werken. Klik je ${R.vervalNa} dagen niet, dan vervalt je pot, ook wat vrienden voor je spaarden.</dd></div>
<div class="r"><dt>Eerlijk</dt><dd>Je deelt je link zelf, alleen met mensen die je kent. Kadoly stuurt nooit berichten naar je vrienden. Nepadressen of meerdere adressen van één persoon tellen niet mee; dan vervalt het tegoed.</dd></div>
<div class="r"><dt>Wijzigen</dt><dd>Passen we de startpot, de vriendbonus of de grenzen aan of stoppen we de Spaarpot, dan melden we dat minstens 30 dagen vooraf. De spaarrente stelt zich elke week in zoals hierboven staat. Wat al in je pot zit, kun je tot het einde gebruiken.</dd></div>
<div class="r"><dt>Privacy</dt><dd>We gebruiken je e-mailadres alleen voor de Spaarpot en wissen het uiterlijk 60 dagen nadat je je afmeldt. Je bezorgadres gebruiken we alleen voor je cadeau en wissen we binnen 60 dagen. Afmelden kan met één klik onder elke mail. Zie ook het <a href="https://kadoly.com/privacy">privacybeleid</a>.</dd></div>
<div class="r"><dt>Vragen</dt><dd>Antwoord op een mail van de Spaarpot, dan krijg je binnen 2 werkdagen antwoord van een mens.</dd></div></dl>`;

// ---------- testhulp ----------
async function maakTest(c, { email, van = '', reeks = 0, dag = '' } = {}) {
  const s = await maak(c, { id: idVan(email), email, van }); s.reeks = reeks; s.dagen = reeks; s.laatste = reeks ? dag : '';
  if (van && s.dagen >= R.vriendDagen) { s.act = true; await kv.raw(['SADD', c.ns + 'act:' + van, s.id]); // zelfde als een echte nieuwe vriend: bonus voor beiden en telt als nieuw lid via een vriend
    let b = boek(s, R.vriendBonus, dag || await vandaag(c), 'nieuwevriend'); const iv = await lees(c, van); if (iv && iv.actief) { b += boek(iv, R.vriendBonus, dag || await vandaag(c), 'nieuwevriend'); await bewaar(c, iv); } await eco(c, 'bonuscent', b); await eco(c, 'lidvriend', 1); }
  if (reeks && dag) { await kv.raw(['SADD', c.ns + 'tik:' + dag, s.id]); await kv.raw(['EXPIRE', c.ns + 'tik:' + dag, 90 * 86400]); }
  await bewaar(c, s); return s;
}
const rnd = () => randomBytes(3).toString('hex');
async function wis(c) { let cur = '0', n = 0; do { const [nx, keys] = await kv.scan(cur, { match: c.ns + '*', count: 500 }); cur = nx; if (keys.length) { await kv.del(keys); n += keys.length; } } while (cur !== '0' && n < 20000); await kv.incr('dktv'); return n; }

// ---------- routes (api/gids.js stuurt elke op=dk... hierheen) ----------
export async function dkOp(op, { req, res, q, host, ua, kaal, leesBody, isBot }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const beschermd = /\.vercel\.app$/i.test(host); const wilTest = q.get('test') === '1';
  if (wilTest && !beschermd) return res.status(404).send('Niet gevonden');
  const c = await wereld(wilTest); let D = await vandaag(c);
  const k0 = String(q.get('k') || ''), p0 = /^[a-f0-9]{48}$/.test(k0) ? await vanLink(c, k0) : null;
  const schoonAttr = x => String(x || '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 40);
  const cmTag = `<script src="https://go.kadoly.com/cm.js" data-site="${proefSite(c)}"${[['n', 'net'], ['z', 'zone'], ['c', 'campaign'], ['s', 'subid']].map(([a, b]) => q.get(a) ? ` data-${b}="${schoonAttr(q.get(a))}"` : '').join('')} async></script>`; // Clickmind op elke pagina
  const pagina = (code, titel, inhoud, script, p = p0) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(code).send(kaal(titel, CSS + testBalk(c, D, p) + inhoud, (script || '') + cmTag)); };
  const pfCookie = () => { try { const m = String(req.headers.cookie || '').match(/(?:^|;\s*)dkpf=([A-Za-z0-9_-]+)/); const x = m ? JSON.parse(Buffer.from(m[1], 'base64url').toString()) : null; return x && /^[0-9a-f]{12}$/.test(String(x.pid)) ? x : null; } catch (e) { return null; } };
  const zetPf = pf => res.setHeader('set-cookie', 'dkpf=' + Buffer.from(JSON.stringify(pf)).toString('base64url') + '; Max-Age=604800; Path=/; Secure; SameSite=Lax');
  const naar = url => { res.setHeader('location', url); return res.status(303).end(); };
  const vanHier = () => { const o = req.headers.origin; if (!o) return true; try { const hh = new URL(o).hostname; return hh === 'gids.kadoly.com' || /\.vercel\.app$/i.test(hh); } catch (e) { return false; } };
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim();
  const kop = `<p class="kicker">${esc(R.naam)}</p>`, voorw = `<a href="${u(c, 'dkregels')}">Voorwaarden</a>`;
  const geenLink = () => pagina(400, 'Deze link werkt niet', `${kop}<h1>Deze link werkt niet</h1><p>Gebruik de link uit je laatste mail van de Spaarpot, of meld je opnieuw aan.</p><p><a class="btn knop" href="${u(c, 'dk')}">Naar de Spaarpot</a></p>`, '', null);

  if (op === 'dkronde') { // cron elke ochtend; handmatig alleen via de beschermde host
    const cron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(ua)); if (!cron && !beschermd) return res.status(404).send('Niet gevonden');
    const uit = { live: await ronde(await wereld(false)).catch(e => ({ fout: String(e.message || e).slice(0, 160) })) };
    if (cron) uit.test = await ronde(await wereld(true)).catch(e => ({ fout: String(e.message || e).slice(0, 160) })); // de testwereld loopt elke dag mee
    return res.status(200).json(uit); }
  if (op === 'dkstand') { if (!beschermd) return res.status(404).send('Niet gevonden');
    const tel = {}; for (let i = 0; i < 14; i++) { const d = plusDag(D, -i); const a = await kv.raw(['HGETALL', c.ns + 'tel:' + d]).catch(() => []); if (Array.isArray(a) && a.length) { tel[d] = {}; for (let j = 0; j + 1 < a.length; j += 2) tel[d][a[j]] = N(a[j + 1]); } }
    let potten = 0, n = 0; for (const id of await smem(c.ns + 'emails')) { const p = await lees(c, id); if (p) { n++; potten += N(p.pot); } }
    const L = await catalogus(), cat = { n: L.length, img: L.filter(i => i && i.img).length, vr: L.filter(i => i && i.vr !== false).length, lt: L.filter(i => i && (!N(i.lt) || N(i.lt) <= R.leverMax)).length, p: L.filter(i => i && N(i.p) > 0).length, snel: L.filter(snel).length, tot30: L.filter(i => snel(i) && thuis(i) <= R.prijsMax).length, tot60: L.filter(i => snel(i) && thuis(i) <= 60).length };
    return res.status(200).json({ ok: true, wereld: c.test ? 'test' : 'live', aan: await aanStaat(c), vandaag: D, deelnemers: n, tegoedInPotten: ct(potten), tel, cat, smaak: await smaakStand(c).catch(() => null), proef: await proefStand(kv, proefSite(c)).then(proefTekst).catch(() => null) }); }
  if (op === 'dkeco') { if (!beschermd) return res.status(404).send('Niet gevonden'); // economie: inkomsten, verwachte kosten en de spaarrente (Henkjan 20 nov: "Maak het economisch totaal werkend")
    const merk = N(String(q.get('merk') || '').replace(',', '.')); if (merk > 0 && merk <= 10000) await eco(c, 'merkcent', Math.round(merk * 100)); // geld van een merk (euro), alleen beschermde host
    const sb = q.get('startbudget'); if (sb !== null && sb !== '') { const v = N(String(sb).replace(',', '.')); if (v >= 0 && v <= 100) await kv.set(c.ns + 'eco:startbudget', Math.round(v * 100)); } // euro per dag, alleen op Henkjans woord
    const s = await ecoStand(c, D), e = x => ct(x);
    const tekst = [`Spaarrente nu: ${e(R.tik)} per klik, ${e(R.vriend)} per vriendenklik, ${e(R.reeksBonus)} per 10 dagen op rij (${Math.round(c.rente.f * 100)}% van de basis${c.rente.sinds ? ', sinds ' + c.rente.sinds : ''}).`,
      `Laatste 30 dagen: inkomsten ${e(s.inkomen)} (nieuwe leden via vriend of site ${e(s.bron.nieuweLeden)}, deel van de winst op aankopen ${e(s.bron.winst)}, merken ${e(s.bron.merken)}, startbudget ${e(s.bron.startbudget)}).`,
      `Verwachte kosten van nieuw tegoed: ${e(s.verwacht)}: elke euro tegoed kost je ${Math.round(s.kans * 100)} cent aan inkoop en verzending (${s.kansGemeten ? 'gemeten aan de cadeaus tot nu toe' : '30% wordt een cadeau, aanname tot €100 aan cadeaus'}).`,
      s.cadeaulijst.goedkoopste ? `Cadeaulijst: ${s.cadeaulijst.aantal} cadeaus, van ${s.cadeaulijst.inkoopBekend} weten we de inkoop. Een cadeau kost je gemiddeld ${Math.round(s.cadeaulijst.kostPerEuroTegoed * 100)} cent per euro tegoed. Goedkoopste: ${s.cadeaulijst.goedkoopste.naam}, ${e(s.cadeaulijst.goedkoopste.tegoed)} tegoed, kost je ${e(s.cadeaulijst.goedkoopste.kost)}.` : '',
      s.cadeaus.aantal ? `Cadeaus: ${s.cadeaus.aantal}, kostprijs ${e(s.cadeaus.kostprijs)}.` : '',
      s.leden.nieuw ? `Nieuwe leden: ${s.leden.nieuw}, waarvan ${s.leden.viaVriendOfSite} via een vriend of site. Startpot en vriendbonus kosten verwacht ${e(s.acquisitiePerLid)} per nieuw lid.` : ''].filter(Boolean);
    return res.status(200).json({ ok: true, wereld: c.test ? 'test' : 'live', vandaag: D, tekst, rente: { perKlik: R.tik, perVriendenklik: R.vriend, tienDagen: R.reeksBonus, factor: c.rente.f, sinds: c.rente.sinds }, ...s }); }
  if (op === 'dkoverdracht') { if (!beschermd) return res.status(404).send('Niet gevonden'); // OVERDRACHT-KADOLY-SPAARPOT.md met de live stand erboven (Henkjan 17 nov: "Zet uitgebreide MD op vercel")
    const stand = {}; for (const w of [false, true]) { const cc = await wereld(w); let n = 0, potten = 0; for (const id of await smem(cc.ns + 'emails')) { const p = await lees(cc, id); if (p) { n++; potten += N(p.pot); } }
      const som = {}; const dd = await vandaag(cc); for (let i = 0; i < 7; i++) { const a = await kv.raw(['HGETALL', cc.ns + 'tel:' + plusDag(dd, -i)]).catch(() => []); if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) som[a[j]] = (som[a[j]] || 0) + N(a[j + 1]); }
      stand[w ? 'test' : 'live'] = { aan: await aanStaat(cc), dag: dd, deelnemers: n, tegoedInPotten: ct(potten), laatste7dagen: som }; }
    let md = ''; for (const f of [join(process.cwd(), 'OVERDRACHT-KADOLY-SPAARPOT.md'), new URL('../OVERDRACHT-KADOLY-SPAARPOT.md', import.meta.url).pathname]) { try { md = readFileSync(f, 'utf8'); break; } catch (e) {} }
    if (q.get('format') === 'json') return res.status(200).json({ ok: true, stand, md });
    const regel = (naam, s) => `- **${naam}**: ${s.aan ? 'aan' : 'uit'} · dag ${s.dag}${s.deelnemers ? ' · ' + s.deelnemers + ' deelnemers · ' + s.tegoedInPotten + ' tegoed in potten' : ''}${Object.values(s.laatste7dagen).some(v => v > 0) ? ' · laatste 7 dagen: ' + Object.entries(s.laatste7dagen).filter(([, v]) => v > 0).map(([k, v]) => k + ' ' + (/cent$/.test(k) ? ct(v) : v)).join(', ') : ''}`;
    const kopje = `> **Live stand, ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })} (Nederlandse tijd)**\n>\n> ${regel('Live', stand.live)}\n> ${regel('Testwereld', stand.test)}\n\n`;
    res.setHeader('content-type', 'text/markdown; charset=utf-8'); return res.status(200).send(kopje + (md || '# Overdracht Kadoly Spaarpot\n\n(Het bestand OVERDRACHT-KADOLY-SPAARPOT.md is niet gevonden in deze uitrol.)\n')); }
  if (!(await aanStaat(c))) return res.status(404).send('Niet gevonden'); // live pas op Henkjans woord (kv dk:aan)

  if (op === 'dkregels') return pagina(200, 'Voorwaarden ' + R.naam, VOORWAARDEN());
  if (op === 'dkaanmelden') { if (req.method !== 'POST' || !vanHier() || isBot(ua)) return res.status(403).json({ ok: false });
    try { return res.status(200).json(await aanmelden(c, await leesBody(req), ip, pfCookie())); } catch (e) { console.error('dk aanmelden', String(e && e.message || e).slice(0, 160)); return res.status(503).json({ ok: false, fout: 'Dat lukte even niet. Probeer het zo nog eens.' }); } }
  if (op === 'dk') { let pf = pfCookie(); if (!pf) { pf = await beslis(c, ua); if (pf) zetPf(pf); } await zie(c, pf, ['kop', 'knop']);
    const v = String(q.get('v') || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8); const uitgenodigd = v && (await kv.get(c.ns + 'code:' + v).catch(() => null));
    return pagina(200, R.naam, `${kop}<h1>${V(pf, 'kop') === 'b' ? 'Spaar samen voor een gratis cadeau' : 'Start met een gevulde spaarpot'}</h1><p>${uitgenodigd ? `<b>Een vriend nodigde je uit.</b> Klik jij, dan krijgt hij ${ct(R.vriend)}. Klikt hij, dan krijg jij ${ct(R.vriend)}. ` : ''}Meld je aan en er staat meteen ${ct(R.start)} in je pot. Eén klik per dag op de link in je ochtendmail, en hij groeit. Is hij genoeg, dan kies je een cadeau en sturen wij het gratis op. Geen loting: wat je spaart, is van jou.</p>${aanmeldBlok(c, uitgenodigd ? v : '', V(pf, 'knop') === 'b' ? 'Pak mijn gevulde pot' : 'Start mijn Spaarpot')}${uitlegHtml()}<p class="meta">${voorw} · 18+ · Kadoly Shop</p>`); }
  if (op === 'dkbevestig') { const t = String(q.get('t') || ''); const ongeldig = () => pagina(400, 'Deze link werkt niet meer', `${kop}<h1>Deze link werkt niet meer</h1><p>Een bevestigingslink is twee dagen geldig. Meld je gerust opnieuw aan.</p><p><a class="btn knop" href="${u(c, 'dk')}">Opnieuw aanmelden</a></p>`, '', null);
    if (req.method === 'POST') { const s = await bevestig(c, t); if (!s) return ongeldig(); await pfVan(c, s, ua); await ev(c, s.pf, 'bevestigd'); if (s.van) { const iv = await lees(c, s.van); if (iv) await ev(c, iv.pf, 'vriend'); } await tik(c, s, D); return naar(u(c, 'dkt', '&k=' + s.link + '&nieuw=1')); }
    const pd = /^[a-f0-9]{48}$/.test(t) ? await kv.get(c.ns + 'pending:' + h(t)) : null; if (!pd) return ongeldig();
    if (pd.klaar) { const s = await lees(c, pd.id); if (s && s.actief) return naar(u(c, 'dkt', '&k=' + s.link)); return ongeldig(); }
    return pagina(200, 'Bevestig je Spaarpot', `${kop}<h1>Nog één klik</h1><p>Bevestig je Spaarpot voor <b>${esc(pd.email)}</b>.</p><form method="post" action="${u(c, 'dkbevestig', '&t=' + t)}" id="dkb"><button class="btn knop" type="submit">Start mijn Spaarpot</button></form>`, '<script>setTimeout(function(){if(document.visibilityState==="visible"){var f=document.getElementById("dkb");f.querySelector("button").disabled=true;f.submit()}},400)</script>', null); }
  if (op === 'dkt') { const p = p0; if (!p) return geenLink();
    if (!p.actief) return pagina(200, 'Je bent afgemeld', `${kop}<h1>Je bent afgemeld</h1><p>Je krijgt geen mail meer van de Spaarpot. Je pot van ${ct(p.pot)} blijft nog ${R.vervalNa} dagen na je laatste klik staan.</p><form method="post" action="${u(c, 'dkaf', '&t=' + p.af + '&weer=1')}"><button class="btn deel" type="submit">Meld me weer aan</button></form>`, '', null);
    const oo = q.get('o') === 'meer' || q.get('o') === 'minder' ? q.get('o') : '', opid = String(q.get('p') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60), oex = oo && opid ? '&o=' + oo + '&p=' + encodeURIComponent(opid) : '';
    if (req.method === 'POST') { if (!vanHier()) return res.status(403).send('Niet toegestaan'); await tik(c, p, D); if (await oordeel(c, p, D, opid, oo)) await bewaar(c, p); return naar(u(c, 'dkt', '&k=' + p.link)); }
    if (oo && p.laatste === D && await oordeel(c, p, D, opid, oo)) await bewaar(c, p); // al geklikt vandaag, oordeel telt nog (één per dag)
    if (p.laatste !== D) return pagina(200, 'Klik voor vandaag', `${kop}<h1>Klik voor vandaag</h1><p>Eén klik en er komt ${ct(R.tik)} in je pot.</p><form method="post" action="${u(c, 'dkt', '&k=' + p.link + oex)}" id="dkf2"><button class="btn knop" type="submit">Klik voor vandaag</button></form>`, isBot(ua) ? '' : '<script>setTimeout(function(){if(document.visibilityState==="visible"){var f=document.getElementById("dkf2");f.querySelector("button").disabled=true;f.submit()}},300)</script>');
    await pfVan(c, p, ua);
    return pagina(200, R.naam, await dagHtml(c, p, D, q.get('nieuw') === '1' ? '<div class="dk-k dk-w"><h2>Gelukt, je pot staat klaar</h2><p>Vanaf morgen krijg je elke ochtend één mail met je eigen link. Je eerste klik telt al.</p></div>' : '')); }
  if (op === 'dkgo') { const p = p0; if (!p) return geenLink(); // elke link uit mail en pagina via Clickmind (Henkjan 20 nov: "altijd via clickmind en de mail ook alle links")
    const w = q.get('w') === 'p' ? 'p' : 't', mail = q.get('m') === '1'; let doel;
    if (w === 'p') { const pid = String(q.get('p') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60); if (!pid) return geenLink(); doel = `https://kadoly.com/product/${encodeURIComponent(pid)}?utm_source=spaarpot&utm_medium=${mail ? 'mail' : 'pagina'}`; await ev(c, p.pf, 'product'); await tel(c, 'product'); }
    else { const o = q.get('o') === 'meer' || q.get('o') === 'minder' ? q.get('o') : '', op2 = String(q.get('p') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60); doel = u(c, 'dkt', '&k=' + p.link + (o && op2 ? '&o=' + o + '&p=' + encodeURIComponent(op2) : '')); }
    const cid = randomBytes(6).toString('hex'); let mmp = (String(req.headers.cookie || '').match(/(?:^|;\s*)mmp=([0-9a-f]{16})/) || [])[1]; const nieuw = !mmp; if (nieuw) mmp = randomBytes(8).toString('hex');
    const d2 = new URL(doel); d2.searchParams.set('mmc', cid); doel = d2.toString();
    const voor = /prefetch|prerender/i.test(String(req.headers['sec-purpose'] || req.headers.purpose || '')) || req.method === 'HEAD';
    if (!voor) { try { laterAf(verwerkKlik(kv, { cid, pid: mmp, nieuw, arm: '302', tag: '-', net: mail ? 'mail' : 'web', camp: c.test ? 'spaarpot-test' : 'spaarpot', zone: w === 'p' ? 'product' : 'klik', sub: p.pf ? Object.entries(p.pf.v || {}).map(([a, b]) => a + b).join('.').slice(0, 60) : '-', cr: w, kw: '', doel, p: 'sp' }, serverSignalen(req)).catch(() => {})); } catch (e) {} }
    res.setHeader('set-cookie', 'mmp=' + mmp + '; Max-Age=15552000; Path=/; Secure; HttpOnly; SameSite=Lax'); return naar(doel); }
  if (op === 'dkdeel') { const p = p0; if (p) { await ev(c, p.pf, 'deel'); await tel(c, 'deel' + (q.get('kanaal') === 'mail' ? 'mail' : 'wa')); } return res.status(204).end(); }
  if (op === 'dkaf') { const t = String(q.get('t') || ''), weer = q.get('weer') === '1';
    if (req.method === 'POST' && !weer) { await afmelden(c, t); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('Afgemeld'); } // één klik vanuit de mailapp
    const terug = req.method === 'POST' && weer; const s = await afmelden(c, t, terug);
    if (!s) return pagina(400, 'Deze afmeldlink werkt niet', `${kop}<h1>Deze afmeldlink werkt niet</h1><p>Antwoord op een mail van de Spaarpot, dan melden we je met de hand af. Dat doen we dezelfde dag.</p>`, '', null);
    if (terug) return naar(u(c, 'dkt', '&k=' + s.link));
    return pagina(200, 'Je bent afgemeld', `${kop}<h1>Je bent afgemeld</h1><p><b>${esc(s.email)}</b> krijgt geen mail meer van de Spaarpot. Eén klik was genoeg.</p><form method="post" action="${u(c, 'dkaf', '&t=' + t + '&weer=1')}"><button class="btn deel" type="submit">Per ongeluk? Meld me weer aan</button></form>`, '', null); }
  if (op === 'dkkies') { const p = p0; if (!p || !p.actief) return geenLink();
    if (req.method === 'POST') { if (!vanHier()) return res.status(403).send('Niet toegestaan'); const r = await kies(c, p, await leesBody(req), D);
      if (r.fout) return pagina(400, 'Nog niet compleet', `${kop}<h1>Nog niet compleet</h1><p>${esc(r.fout)}</p><p><a class="btn knop" href="${u(c, 'dkkies', '&k=' + p.link)}">Terug</a></p>`);
      return pagina(200, 'Je cadeau komt eraan', `${kop}<h1>Top, je cadeau komt eraan</h1><p>Je koos <b>${esc(r.keuze.naam)}</b>. We bestellen het voor je en sturen het gratis naar je toe. Je adres gebruiken we alleen hiervoor en we wissen het binnen 60 dagen.</p><p>In je pot staat nu ${ct(p.pot)}. Je spaart gewoon door.</p><p><a class="btn knop" href="${u(c, 'dkt', '&k=' + p.link)}">Naar mijn pot</a></p>`); }
    const d = await doel(N(p.pot));
    if (!d.kan.length) return pagina(200, 'Nog even sparen', `${kop}<h1>Nog even sparen</h1><p>${d.volgende ? `Nog ${ct(Math.round(d.volgende.prijs * 100) - N(p.pot))}, dan kies je ${esc(d.volgende.naam)} gratis.` : 'Er is nu even geen cadeau beschikbaar.'}</p><p><a class="btn knop" href="${u(c, 'dkt', '&k=' + p.link)}">Naar mijn pot</a></p>`);
    const L = d.kan.slice().sort((a, b) => b.prijs - a.prijs);
    return pagina(200, 'Kies je cadeau', `${kop}<h1>Kies je cadeau</h1><p>In je pot: ${ct(p.pot)}. Kies één cadeau; het bedrag gaat van je pot af en wij sturen het gratis op. Je betaalt niets en we vragen nooit om bankgegevens.</p>
<form class="dk-f" method="post" action="${u(c, 'dkkies', '&k=' + p.link)}" style="max-width:none"><div class="dk-o" role="radiogroup" aria-label="Kies je cadeau">${L.map((o, i) => `<label><input type="radio" name="pid" value="${esc(o.pid)}"${i === 0 ? ' required' : ''}><img src="${esc(o.img)}" alt="" loading="lazy" width="56" height="56"><span>${esc(o.naam)}<br><b>${euro(o.prijs)}</b>${o.lt ? ' · ' + o.lt + (o.lt === 1 ? ' werkdag' : ' werkdagen') : ''}</span></label>`).join('')}</div>
<input type="text" name="voornaam" autocomplete="given-name" placeholder="Voornaam" required aria-label="Voornaam"><input type="text" name="achternaam" autocomplete="family-name" placeholder="Achternaam" required aria-label="Achternaam"><input type="text" name="adres" autocomplete="street-address" placeholder="Straat en huisnummer" required aria-label="Straat en huisnummer"><input type="text" name="postcode" autocomplete="postal-code" placeholder="Postcode" required aria-label="Postcode" maxlength="7"><input type="text" name="plaats" autocomplete="address-level2" placeholder="Plaats" required aria-label="Plaats">
<button class="btn knop" type="submit">Stuur mijn cadeau</button><p class="meta">${voorw}</p></form>`); }
  if (op === 'dkmails') { if (!c.test) return res.status(404).send('Niet gevonden');
    const p = p0 || { pot: 430, reeks: 4, laatste: plusDag(D, -1), samen: { D: plusDag(D, -1), n: 4, c: 40 }, link: '0'.repeat(48), af: '0'.repeat(48) };
    const ifr = (titel, html) => `<h2>${esc(titel)}</h2><iframe title="${esc(titel)}" srcdoc="${esc(html.replace('<head>', '<head><base target="_top">'))}" style="width:100%;height:600px;border:1px solid var(--line);border-radius:18px;background:#E8F4FD;margin:0 0 22px" loading="lazy"></iframe>`;
    const d = await doel(N(p.pot)), doelTekst = d.kan.length ? 'Je pot is genoeg voor een cadeau: kies het op je pagina.' : d.volgende ? `Nog ${ct(Math.round(d.volgende.prijs * 100) - N(p.pot))}, dan kies je ${d.volgende.naam} gratis.` : '';
    return pagina(200, 'De mails van de Spaarpot', `${kop}<h1>Zo zien de mails eruit</h1><p>Precies wat een deelnemer krijgt${p0 ? ', met jouw pot' : ''}.</p>${ifr('Elke ochtend', mailDag(c, p, { D, doelTekst, k: p0 ? await kring(c, p0.id, p0) : { v1: new Set(['a', 'b', 'c', 'd']), vriendenPot: 1880, onderweg: 0 } }))}${ifr('Na aanmelden', mailBevestig(u(c, 'dkbevestig', '&t=voorbeeld')))}`); }
  if (op === 'dktest') { if (!c.test) return res.status(404).send('Niet gevonden'); const actie = String(q.get('actie') || ''), n = Math.max(1, Math.min(5000, N(q.get('n')) || 1)); const p = p0;
    const klaar = (titel, regels) => pagina(200, titel, `${kop}<h1>${esc(titel)}</h1><ul>${regels.map(r => `<li>${r}</li>`).join('')}</ul><p>${p ? `<a class="btn knop" href="${u(c, 'dkt', '&k=' + p.link)}">Naar mijn pot</a>` : `<a class="btn knop" href="${u(c, 'dk')}">Naar de aanmeldpagina</a>`}</p>`);
    if (actie === 'maak') { const em = 'ik-' + rnd() + '@voorbeeld.invalid', s = await maak(c, { id: idVan(em), email: em }); await tik(c, s, D); return naar(u(c, 'dkt', '&k=' + s.link + '&nieuw=1')); }
    if (actie === 'volgende') { await kv.incr(c.ns + 'offset'); const r = await ronde(c, { mail: q.get('mail') !== '0' }); D = r.D; const s = r.samen || {};
      return klaar('Het is nu ' + datumNl(D), [r.testvrienden ? `${r.testvrienden} testvrienden klikten vandaag al, dus ook voor jou.` : '', r.mails ? `${r.mails} ${r.mails === 1 ? 'ochtendmail' : 'ochtendmails'} verstuurd (testvrienden krijgen geen mail).` : 'Geen ochtendmail verstuurd.', p ? 'Open je pot: je klikt dan voor de nieuwe dag.' : ''].filter(Boolean)); }
    if (!p && ['reeks', 'vrienden', 'pot'].includes(actie)) return naar(u(c, 'dk'));
    if (actie === 'reeks') { p.reeks = Math.min(n, 999); p.dagen = Math.max(N(p.dagen), p.reeks); if (!p.act && p.van && p.dagen >= R.vriendDagen) { p.act = true; await kv.raw(['SADD', c.ns + 'act:' + p.van, p.id]); } await bewaar(c, p); return naar(u(c, 'dkt', '&k=' + p.link)); }
    if (actie === 'pot') { boek(p, n, D, 'test'); await bewaar(c, p); return naar(u(c, 'dkt', '&k=' + p.link)); }
    if (actie === 'vrienden') { for (let i = 0; i < Math.min(n, 10); i++) { const v = await maakTest(c, { email: 'vriend-' + rnd() + '@voorbeeld.invalid', van: p.id, reeks: R.vriendDagen, dag: D }); await geefVrienden(c, v, D); } return naar(u(c, 'dkt', '&k=' + p.link)); }
    if (actie === 'lijst') { const L = []; for (const id of await smem(c.ns + 'emails')) { const x = await lees(c, id); if (x) L.push(x); } L.sort((a, b) => N(a.at) - N(b.at));
      return pagina(200, 'Alle testdeelnemers', `${kop}<h1>Alle testdeelnemers</h1><dl class="rows">${L.map(x => `<div class="r"><dt>${esc(x.email)}</dt><dd>pot ${ct(x.pot)} · ${N(x.reeks)} op rij${x.van ? ' · uitgenodigd' : ''} · <a href="${u(c, 'dkt', '&k=' + x.link)}">pot bekijken</a></dd></div>`).join('')}</dl>`); }
    if (actie === 'wis') { await wis(c); return naar(u(c, 'dk')); }
    return naar(u(c, 'dk')); }
  return res.status(404).send('Niet gevonden');
}
