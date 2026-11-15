// Kadoly Winterkans (Henkjan 14 nov 2026: "Stel we maken dagelijkse nieuwsbrief waarin als je opent alleen als je opent . Je gratis een product
// kunt kiezen als je gewoonnen hebt . Kan allleen als je streak van minimaal 10 dagen of door gestuurd naar minimaal 10 mensen en is ook geopend
// door hen", "Verhoog je kans per vriend die ook doorstuurt", "Bouw het en laat het me zien op test url zodat we samen goed kunnen testen").
//
// Werking
// - Aanmelden met dubbele opt-in (18+, woonadres in Nederland). Elke ochtend één mail met je eigen link. De TIK op die link telt als je dag
//   (geen open-pixel: Apple Mail opent alles zelf). Pas na de tik zie je de uitslag van gisteren.
// - Meedoen aan de trekking: een reeks van minstens 10 dagen op rij, of minstens 10 vrienden die zich zelf aanmeldden en 3 dagen tikten.
// - Lootjes op een dag dat je tikte: 1 + 5 per actieve vriend + 2 per actieve vriend van een vriend, hooguit 100. Won iemand uit je kring
//   (je aanbrenger, diens aanbrenger, je vrienden, hun vrienden), dan tellen je lootjes de dag erna dubbel (plafond blijft 100).
// - Elke ochtend (cron 06:05 UTC) de trekking van gisteren met het openbare toeval van drand, gewogen op lootjes; daarna de dagmail.
//   Tikt de winnaar 2 dagen niet, dan krijgt hij alsnog een mail (een prijs moet echt worden toegekend). 14 dagen om te kiezen.
// - Prijs: één product tot €30 incl. verzending dat binnen 3 werkdagen thuis is (shopcatalogus hjdk:shop:cat).
// - Juridisch: klein promotioneel kansspel (Gedragscode Promotionele Kansspelen art. 8): tijdelijk (t/m 31 jan 2027), prijzen samen hooguit
//   €4.500 (de code stopt de trekkingen daarboven). Spelregels: op=dkregels. Niet live zonder Henkjans woord (kv dk:aan).
// - Testwereld (alleen op de beschermde vercel.app-host, ?test=1): eigen opslag (dkt<versie>:), knoppen volgende dag, trek nu, dagmail nu,
//   testvrienden, reeks zetten, alles wissen.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { stuurMails, mailSchil, knop, mailHenkjan, mailKlaar, KADOLY_BEDRIJF, KADOLY_PERSONEEL } from './kadoly-nieuws.js';

export const R = { naam: 'Kadoly Winterkans', eind: '2027-01-31', prijsMax: 30, leverMax: 3, meeReeks: 10, meeVrienden: 10, vriendDagen: 3, lootVriend: 5, lootVV: 2, plafond: 100, potMax: 4500, rustNa: 14, winMeldNa: 2, kiesDagen: 14 };
const DRAND = 'https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971/public/latest';
const h = s => createHash('sha256').update(String(s)).digest('hex');
const tok = () => randomBytes(24).toString('hex');
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const amsDag = ms => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });
export const plusDag = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const datumNl = d => new Date(d + 'T12:00:00Z').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const okMail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
const euro = x => '€' + N(x).toFixed(2).replace('.', ',');
export function canon(email) { let [l, d] = String(email || '').trim().toLowerCase().split('@'); if (!l || !d) return ''; l = l.split('+')[0]; if (d === 'gmail.com' || d === 'googlemail.com') { l = l.replace(/\./g, ''); d = 'gmail.com'; } return l + '@' + d; }
const idVan = email => 'd' + h('dk:' + canon(email)).slice(0, 31); // met letter voorop: kv.get leest een id nooit als getal
const nep = e => /\.invalid$/i.test(String(e || '')); // testvrienden in de testwereld: nooit mailen
const smem = async k => (((await kv.raw(['SMEMBERS', k]).catch(() => [])) || []).map(String));

// ---------- wereld: live of test ----------
export async function wereld(test) {
  if (!test) return { test: false, ns: 'dk:', base: 'https://gids.kadoly.com/api/gids' };
  const v = N(await kv.get('dktv').catch(() => 0)); return { test: true, ns: 'dkt' + v + ':', base: 'https://hjdk-api-henq.vercel.app/api/gids' };
}
const u = (c, op, extra = '') => c.base + '?op=' + op + (c.test ? '&test=1' : '') + extra;
export async function vandaag(c) { const o = c.test ? N(await kv.get(c.ns + 'offset').catch(() => 0)) : 0; return amsDag(Date.now() + o * 864e5); }
const lees = (c, id) => kv.get(c.ns + 'p:' + id).catch(() => null);
const bewaar = (c, p) => kv.set(c.ns + 'p:' + p.id, p);
async function tel(c, wat) { try { const k = c.ns + 'tel:' + (await vandaag(c)); await kv.raw(['HINCRBY', k, wat, 1]); await kv.raw(['EXPIRE', k, 120 * 86400]); } catch (e) {} }

// ---------- aanmelden en bevestigen ----------
export async function aanmelden(c, b, ip) {
  const email = String(b.email || '').trim().toLowerCase(); if (!okMail(email)) return { ok: false, fout: 'Vul een geldig e-mailadres in.' };
  if (b.oud !== true && b.oud !== '1') return { ok: false, fout: 'Meedoen kan vanaf 18 jaar met een woonadres in Nederland.' };
  if (!c.test && !(await kv.get('dk:aan').catch(() => null))) return { ok: false, fout: 'De Winterkans is nog niet begonnen.' };
  if (!(await mailKlaar())) return { ok: false, fout: 'Even niet beschikbaar.' };
  if (b.website || N(b.ms) < 1200) return { ok: true }; // honingpot of te snel
  const rk = c.ns + 'rl:' + h(ip + ':' + Math.floor(Date.now() / 60000)).slice(0, 20); const n = N(await kv.incr(rk)); if (n === 1) await kv.raw(['EXPIRE', rk, '120']); if (n > 6) return { ok: false, fout: 'Even te druk, probeer het zo nog eens.' };
  const id = idVan(email), oud = await lees(c, id); if (oud && oud.actief) return { ok: true, al: true };
  if (!(await kv.raw(['SET', c.ns + 'er:' + id, '1', 'NX', 'EX', '600']))) return { ok: true };
  let van = ''; const vc = String(b.v || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8); if (vc) { const r = String((await kv.get(c.ns + 'code:' + vc)) || ''); if (r && r !== id) van = r; }
  const t = tok(); await kv.set(c.ns + 'pending:' + h(t), { id, email, van, at: Date.now() }, { ex: 2 * 86400 });
  await stuurMails([{ to: [email], subject: (c.test ? '[TEST] ' : '') + 'Bevestig je deelname aan de Kadoly Winterkans', html: mailBevestig(u(c, 'dkbevestig', '&t=' + t)) }], 'dk-bev-' + h(t).slice(0, 32));
  await tel(c, 'aanvraag'); return { ok: true };
}
export async function bevestig(c, t) {
  if (!/^[a-f0-9]{48}$/.test(t || '')) return null; const p = await kv.get(c.ns + 'pending:' + h(t)); if (!p) return null;
  const oud = await lees(c, p.id); if (oud && oud.actief) return oud;
  let code = ''; for (let i = 0; i < 6 && !code; i++) { const k = randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6); if (k.length === 6 && (await kv.raw(['SET', c.ns + 'code:' + k, p.id, 'NX']))) code = k; }
  const s = { id: p.id, email: p.email, at: p.at, bevestigd: Date.now(), actief: true, af: tok(), link: tok(), code, van: p.van || '', reeks: 0, laatste: '', dagen: 0, act: false };
  await bewaar(c, s); await kv.set(c.ns + 'link:' + h(s.link), s.id); await kv.set(c.ns + 'af:' + h(s.af), s.id); await kv.raw(['SADD', c.ns + 'emails', s.id]);
  if (s.van) await kv.raw(['SADD', c.ns + 'kids:' + s.van, s.id]);
  await kv.set(c.ns + 'pending:' + h(t), { ...p, klaar: Date.now() }, { ex: 2 * 86400 }); await tel(c, 'bevestigd'); return s;
}
export async function afmelden(c, t, weer) {
  if (!/^[a-f0-9]{48}$/.test(t || '')) return null; const id = await kv.get(c.ns + 'af:' + h(t)); if (!id) return null; const p = await lees(c, id); if (!p) return null;
  if (weer) { p.actief = true; p.rust = false; await kv.raw(['SADD', c.ns + 'emails', id]); } else { p.actief = false; p.afAt = Date.now(); await kv.raw(['SREM', c.ns + 'emails', id]); await tel(c, 'af'); }
  await bewaar(c, p); return p;
}
export async function vanLink(c, k) { if (!/^[a-f0-9]{48}$/.test(k || '')) return null; const id = await kv.get(c.ns + 'link:' + h(k)); return id ? lees(c, id) : null; }

// ---------- tik, kring en lootjes ----------
export async function tik(c, p, dag) {
  if (p.laatste === dag) return p;
  p.reeks = p.laatste === plusDag(dag, -1) ? N(p.reeks) + 1 : 1; p.dagen = N(p.dagen) + 1; p.laatste = dag; p.rust = false;
  await kv.raw(['SADD', c.ns + 'tik:' + dag, p.id]); await kv.raw(['EXPIRE', c.ns + 'tik:' + dag, 90 * 86400]);
  if (!p.act && p.van && p.dagen >= R.vriendDagen) { p.act = true; await kv.raw(['SADD', c.ns + 'act:' + p.van, p.id]); }
  await bewaar(c, p); await tel(c, 'tik'); return p;
}
export async function kring(c, id) {
  const v1 = await smem(c.ns + 'act:' + id); let v2 = 0; for (const k of v1) v2 += N(await kv.raw(['SCARD', c.ns + 'act:' + k]).catch(() => 0));
  const alle = N(await kv.raw(['SCARD', c.ns + 'kids:' + id]).catch(() => 0));
  return { v1: v1.length, v2, onderweg: Math.max(0, alle - v1.length), vrienden: v1 };
}
export const mee = (p, k) => N(p.reeks) >= R.meeReeks || k.v1 >= R.meeVrienden;
export async function lootjes(c, p, k, dag) {
  if (!mee(p, k)) return 0; const basis = 1 + R.lootVriend * k.v1 + R.lootVV * k.v2;
  const dub = String((await kv.get(c.ns + 'dubbel:' + p.id).catch(() => '')) || '') === dag ? 2 : 1; return Math.min(R.plafond, basis * dub);
}

// ---------- trekking ----------
async function toeval() { try { const r = await fetch(DRAND, { signal: AbortSignal.timeout(5000) }); const j = await r.json(); if (j && j.randomness) return { bron: 'drand', ronde: j.round, waarde: String(j.randomness) }; } catch (e) {} return { bron: 'toevalsgenerator van de server', ronde: null, waarde: randomBytes(32).toString('hex') }; }
export function kiesGewogen(waarde, D, lijst) { // lijst: [[id, lootjes]] gesorteerd op id
  const tot = lijst.reduce((s, x) => s + x[1], 0); if (!tot) return null; const lh = h(lijst.map(x => x[0] + ':' + x[1]).join(','));
  let r = Number(BigInt('0x' + h(waarde + ':' + D + ':' + lh)) % BigInt(tot)); for (const [id, l] of lijst) { if (r < l) return { id, tot, lh }; r -= l; } return null;
}
async function potGebruikt(c) { let n = 0; for (const D of ((await kv.get(c.ns + 'trekkingen')) || [])) { const t = await kv.get(c.ns + 'trek:' + D); if (t && t.id && t.status !== 'verlopen') n++; } return n * R.prijsMax; }
export async function trek(c, D) {
  const key = c.ns + 'trek:' + D, oud = await kv.get(key); if (oud) return { D, al: true, deelnemers: oud.deelnemers, lootjes: oud.lootjes, bron: oud.bron, ronde: oud.ronde };
  if (!c.test && D > R.eind) return { D, buiten: true };
  if ((await potGebruikt(c)) + R.prijsMax > R.potMax) return { D, potVol: true };
  const lijst = [];
  for (const id of (await smem(c.ns + 'tik:' + D)).sort()) { const p = await lees(c, id); if (!p || !p.actief || (!c.test && KADOLY_PERSONEEL.test(p.email || ''))) continue; const k = await kring(c, id); const l = await lootjes(c, p, k, D); if (l > 0) lijst.push([id, l]); }
  if (!lijst.length) { await kv.set(key, { D, at: Date.now(), deelnemers: 0, lootjes: 0 }); await lijstBij(c, D); return { D, deelnemers: 0 }; }
  const r = await toeval(), w = kiesGewogen(r.waarde, D, lijst);
  const t = { D, at: Date.now(), deelnemers: lijst.length, lootjes: w.tot, bron: r.bron, ronde: r.ronde, lijst: w.lh, id: w.id, winLootjes: (lijst.find(x => x[0] === w.id) || [])[1], token: tok(), status: 'getrokken' };
  await kv.set(key, t); await kv.set(c.ns + 'win:' + h(t.token), D, { ex: 120 * 86400 }); await kv.set(c.ns + 'mijnwin:' + w.id, D, { ex: 30 * 86400 }); await lijstBij(c, D);
  // kring wint: aanbrenger, diens aanbrenger, vrienden en hun vrienden krijgen de dag erna dubbele lootjes
  const p = await lees(c, w.id), bonus = new Set(); if (p && p.van) { bonus.add(p.van); const pv = await lees(c, p.van); if (pv && pv.van) bonus.add(pv.van); }
  for (const k of await smem(c.ns + 'act:' + w.id)) { bonus.add(k); for (const kk of await smem(c.ns + 'act:' + k)) bonus.add(kk); }
  bonus.delete(w.id); for (const id of bonus) await kv.set(c.ns + 'dubbel:' + id, plusDag(D, 1), { ex: 5 * 86400 });
  await tel(c, 'trekking'); return { D, deelnemers: lijst.length, lootjes: w.tot, bron: r.bron, ronde: r.ronde, kringBonus: bonus.size };
}
async function lijstBij(c, D) { const L = (await kv.get(c.ns + 'trekkingen')) || []; if (!L.includes(D)) { L.push(D); await kv.set(c.ns + 'trekkingen', L.slice(-120)); } }

// ---------- producten (shopcatalogus) ----------
let CAT = null, CAT_AT = 0;
async function catalogus() { if (CAT && Date.now() - CAT_AT < 600000) return CAT; let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {} CAT = (c && Array.isArray(c.items)) ? c.items : []; CAT_AT = Date.now(); return CAT; }
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
const snel = i => i && i.img && i.vr !== false && N(i.lt) > 0 && N(i.lt) <= R.leverMax && N(i.p) > 0 && !/^[A-Z][a-z]+ (for|with|and|the) /.test(String(i.t || ''));
const populair = i => N(i.so30) * 3 + N(i.ca7) + N(i.so7) * 5;
export async function prijsOpties() { return (await catalogus()).filter(i => snel(i) && thuis(i) <= R.prijsMax).sort((a, b) => populair(b) - populair(a) || thuis(b) - thuis(a)).slice(0, 24).map(i => ({ pid: i.id, naam: i.t, prijs: thuis(i), img: i.img, lt: N(i.lt) })); }
export async function dagProducten(D) { const L = (await catalogus()).filter(i => snel(i) && thuis(i) <= 60).sort((a, b) => populair(b) - populair(a)).slice(0, 30); if (!L.length) return []; const s = Number(BigInt('0x' + h('dp:' + D).slice(0, 12)) % BigInt(L.length)); return [0, 1, 2].map(j => L[(s + j * 7) % L.length]).filter((x, j, a) => a.indexOf(x) === j).map(i => ({ pid: i.id, naam: i.t, prijs: thuis(i), img: i.img, lt: N(i.lt) })); }

// ---------- mails ----------
const voet = (c, p) => `${esc(KADOLY_BEDRIJF)}<br>Elke ochtend één mail, tot en met ${esc(datumNl(R.eind))}. <a href="${u(c, 'dkregels')}" style="color:#0B0D12">Spelregels</a>${p ? ` · <a href="${u(c, 'dkaf', '&t=' + p.af)}" style="color:#0B0D12">Afmelden met één klik</a>` : ''}`;
export function mailBevestig(url) {
  return mailSchil({ titel: 'Bevestig je deelname', voorkop: 'Eén klik en je doet mee met de Kadoly Winterkans.',
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Bevestig je deelname</h1><p style="margin:0 0 20px">Klik op de knop en je doet mee met de Kadoly Winterkans. Je krijgt dan elke ochtend één mail met je eigen link. Elke dag dat je tikt, telt.</p><p style="margin:0 0 22px">${knop(url, 'Ja, ik doe mee')}</p><p style="margin:0">Heb je je niet aangemeld? Dan hoef je niets te doen. Zonder bevestiging krijg je niets van ons.</p>`,
    voet: esc(KADOLY_BEDRIJF) });
}
export function mailDag(c, p, { k, D, gisteren }) {
  const regel = N(p.reeks) >= R.meeReeks || k.v1 >= R.meeVrienden ? 'Je doet mee aan de trekking zodra je vandaag tikt.' : p.laatste === plusDag(D, -1) ? `Je reeks staat op ${p.reeks} ${p.reeks === 1 ? 'dag' : 'dagen'}. Nog ${R.meeReeks - p.reeks}, dan doe je mee aan de trekking.` : 'Begin vandaag aan je reeks. Na 10 dagen op rij doe je mee aan de trekking.';
  return mailSchil({ titel: 'Je kans van vandaag', voorkop: gisteren && gisteren.deelnemers ? 'De trekking van gisteren is gedaan. Tik om te zien of jij hebt gewonnen.' : 'Tik voor je kans van vandaag.',
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Tik voor je kans van vandaag</h1>${gisteren && gisteren.deelnemers ? '<p style="margin:0 0 14px">De trekking van gisteren is gedaan. Tik op de knop: dan zie je of jij hebt gewonnen.</p>' : ''}<p style="margin:0 0 20px">${esc(regel)}</p><p style="margin:0 0 8px">${knop(u(c, 'dkt', '&k=' + p.link), 'Tik voor vandaag')}</p>`,
    voet: voet(c, p) });
}
export function mailWin(c, url) {
  return mailSchil({ titel: 'Je hebt gewonnen', voorkop: 'Kies zelf een product, wij sturen het gratis op.',
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Je hebt gewonnen bij de Kadoly Winterkans</h1><p style="margin:0 0 20px">Kies zelf een product tot ${euro(R.prijsMax)} inclusief verzending. Het is binnen 3 werkdagen bij je thuis.</p><p style="margin:0 0 20px">${knop(url, 'Kies je product')}</p><p style="margin:0">Je betaalt niets en we vragen nooit om bankgegevens. Twijfel je of deze mail echt is? Antwoord gewoon, dan krijg je antwoord van een mens.</p>`,
    voet: voet(c, null) });
}
const lijstKop = (c, p) => ({ 'List-Unsubscribe': `<${u(c, 'dkaf', '&t=' + p.af)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });

// ---------- dagronde: trekking van gisteren, herinneringen voor winnaars, dagmail ----------
export async function ronde(c, { mail = true } = {}) {
  const D = await vandaag(c), uit = { D, mails: 0, rust: 0 };
  if (!c.test && !(await kv.get('dk:aan').catch(() => null))) return { ...uit, uit: 'niet aan' };
  uit.trekking = await trek(c, plusDag(D, -1));
  const gisteren = await kv.get(c.ns + 'trek:' + plusDag(D, -1));
  for (const W of ((await kv.get(c.ns + 'trekkingen')) || []).slice(-30)) { const t = await kv.get(c.ns + 'trek:' + W); if (!t || !t.id) continue;
    const dagenOud = (Date.parse(D) - Date.parse(t.D)) / 864e5;
    if (t.status === 'getrokken' && dagenOud > R.winMeldNa + R.kiesDagen) { t.status = 'verlopen'; await kv.set(c.ns + 'trek:' + W, t); continue; }
    if (t.status === 'getrokken' && !t.gemeld && !t.gezien && dagenOud >= R.winMeldNa) { const p = await lees(c, t.id); if (p && !nep(p.email)) { await stuurMails([{ to: [p.email], subject: (c.test ? '[TEST] ' : '') + 'Je hebt gewonnen bij de Kadoly Winterkans', html: mailWin(c, u(c, 'dkwin', '&t=' + t.token)) }], 'dk-win-' + c.ns + W); t.gemeld = Date.now(); await kv.set(c.ns + 'trek:' + W, t); uit.winMail = (uit.winMail || 0) + 1; } } }
  if (!mail || (!c.test && D > R.eind)) return uit;
  const batch = [];
  for (const id of await smem(c.ns + 'emails')) { const p = await lees(c, id); if (!p || !p.actief || nep(p.email)) continue;
    const laatst = p.laatste || amsDag(N(p.bevestigd)); if (laatst < plusDag(D, -R.rustNa)) { if (!p.rust) { p.rust = true; await bewaar(c, p); } uit.rust++; continue; }
    batch.push({ to: [p.email], subject: (c.test ? '[TEST] ' : '') + (N(p.reeks) >= 2 && p.laatste === plusDag(D, -1) ? 'Dag ' + (N(p.reeks) + 1) + ': je kans van vandaag' : 'Je kans van vandaag'), html: mailDag(c, p, { k: await kring(c, id), D, gisteren }), headers: lijstKop(c, p) }); }
  for (let i = 0; i < batch.length; i += 90) { await stuurMails(batch.slice(i, i + 90), 'dk-dag-' + c.ns + D + '-' + i); uit.mails += batch.slice(i, i + 90).length; }
  await tel(c, 'dagmail'); return uit;
}

// ---------- winnaar kiest ----------
export async function winLees(c, t) { if (!/^[a-f0-9]{48}$/.test(t || '')) return null; const D = await kv.get(c.ns + 'win:' + h(t)); if (!D) return null; const w = await kv.get(c.ns + 'trek:' + D); return w && w.token === t ? w : null; }
const schoon = (v, n) => String(v || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
export async function winKies(c, t, b) {
  const w = await winLees(c, t); if (!w) return { fout: 'link' }; if (w.status !== 'getrokken') return { fout: w.status };
  const keuze = (await prijsOpties()).find(o => o.pid === String(b.pid || '')); if (!keuze) return { fout: 'Kies een product.' };
  const a = { voornaam: schoon(b.voornaam, 40), achternaam: schoon(b.achternaam, 60), adres: schoon(b.adres, 100), postcode: schoon(b.postcode, 10).toUpperCase(), plaats: schoon(b.plaats, 60) };
  if (!a.voornaam || !a.achternaam || !a.adres || !/^[1-9][0-9]{3} ?[A-Z]{2}$/.test(a.postcode) || !a.plaats) return { fout: 'Vul je naam en een Nederlands adres in.' };
  w.status = 'gekozen'; w.gekozenAt = Date.now(); w.keuze = keuze; w.toestemming = b.toestemming === '1' || b.toestemming === true; w.voornaam = a.voornaam; w.plaats = a.plaats;
  await kv.set(c.ns + 'adres:' + w.D, a, { ex: 60 * 86400 }); await kv.set(c.ns + 'trek:' + w.D, w); const p = await lees(c, w.id);
  try { await mailHenkjan({ subject: (c.test ? '[TEST] ' : '') + 'Winterkans: bestel ' + keuze.naam + ' voor ' + a.voornaam, html: mailSchil({ titel: 'Winterkans: bestellen', voorkop: keuze.naam, inhoud: `<h1 style="font-size:22px;margin:0 0 12px">Winnaar ${esc(datumNl(w.D))}: graag bestellen</h1><p style="margin:0 0 6px"><b>Product:</b> ${esc(keuze.naam)} (${euro(keuze.prijs)} incl. verzending, ${keuze.lt} ${keuze.lt === 1 ? 'werkdag' : 'werkdagen'})<br><a href="https://kadoly.com/product/${encodeURIComponent(keuze.pid)}">kadoly.com/product/${esc(keuze.pid)}</a></p><p style="margin:12px 0 0"><b>Sturen naar:</b><br>${esc(a.voornaam)} ${esc(a.achternaam)}<br>${esc(a.adres)}<br>${esc(a.postcode)} ${esc(a.plaats)}<br>${esc(p ? p.email : '')}</p>`, voet: esc(KADOLY_BEDRIJF) }), replyTo: p ? p.email : undefined }); } catch (e) {}
  await tel(c, 'gekozen'); return { ok: true, w };
}

// ---------- pagina's ----------
export const CSS = `<style>.dk-k{border:1px solid var(--line-strong);border-radius:16px;padding:16px 18px;margin:0 0 16px}.dk-k h2{margin:0 0 8px}.dk-r{display:flex;gap:5px;margin:12px 0 6px}.dk-r i{flex:1;height:10px;border-radius:5px;background:var(--acc2)}.dk-r i.v{background:var(--acc)}.dk-w{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc2)}.dk-p{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.dk-p a{display:block;text-decoration:none;color:inherit}.dk-p img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;display:block;margin:0 0 6px}.dk-f{display:grid;gap:10px;max-width:520px}.dk-f input[type=email],.dk-f input[type=text]{min-height:48px;border:1px solid var(--line-strong);border-radius:12px;padding:10px 12px;font:inherit;background:var(--bg);color:var(--ink)}.dk-f label.vk{display:flex;gap:10px;align-items:flex-start}.dk-f label.vk input{width:20px;height:20px;accent-color:#1D9BF0;flex:none;margin-top:2px}.dk-t{border:2px dashed #1D9BF0;border-radius:16px;padding:14px 16px;margin:0 0 18px}.dk-t a,.dk-t button{margin:0 8px 8px 0}.dk-o{display:grid;gap:10px;margin:0 0 18px}.dk-o label{display:flex;gap:12px;align-items:center;border:1px solid var(--line-strong);border-radius:14px;padding:10px 12px;cursor:pointer}.dk-o label:has(input:checked){border-color:var(--acc);box-shadow:0 0 0 2px var(--acc2)}.dk-o img{width:56px;height:56px;border-radius:10px;object-fit:cover;flex:none}.dk-o input{accent-color:#1D9BF0;width:20px;height:20px;flex:none}</style>`;
export function testBalk(c, D, p) {
  if (!c.test) return '';
  const a = (actie, tekst, extra = '') => `<a class="btn deel" href="${u(c, 'dktest', '&actie=' + actie + (p ? '&k=' + p.link : '') + extra)}">${esc(tekst)}</a>`;
  return `<div class="dk-t"><p><b>Testwereld</b> · testdag ${esc(datumNl(D))}. Niets hiervan raakt echte deelnemers. Mails krijgen [TEST] in het onderwerp.</p>${p ? '' : a('maak', 'Snel een testdeelnemer zonder mail')}${a('volgende', 'Volgende dag (trekking + dagmail)')}${a('volgende', 'Volgende dag zonder mail', '&mail=0')}${p ? a('reeks', 'Zet mijn reeks op 10', '&n=10') + a('vrienden', 'Maak 4 testvrienden (met elk 2 vrienden)', '&n=4') + a('trek', 'Trek nu voor vandaag') : ''}<a class="btn deel" href="${u(c, 'dkmails', p ? '&k=' + p.link : '')}">Bekijk de mails</a>${a('lijst', 'Alle testdeelnemers')}${a('wis', 'Alles wissen')}</div>`;
}
export function aanmeldBlok(c, v) {
  return `<form class="dk-f" id="dkf"><input type="email" name="email" required placeholder="Je e-mailadres" aria-label="Je e-mailadres" autocomplete="email"><input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><label class="vk"><input type="checkbox" name="oud" value="1" required><span>Ik ben 18 jaar of ouder en woon in Nederland.</span></label><button class="btn knop" type="submit">Doe mee</button><p class="meta" id="dko" role="status"></p></form>
<script>(function(){var f=document.getElementById('dkf'),o=document.getElementById('dko'),t0=Date.now();f.addEventListener('submit',function(e){e.preventDefault();o.textContent='Even geduld…';fetch(${JSON.stringify(u(c, 'dkaanmelden'))},{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:f.email.value,oud:f.oud.checked,website:f.website.value,ms:Date.now()-t0,v:${JSON.stringify(v || '')}})}).then(function(r){return r.json()}).then(function(j){o.textContent=j&&j.ok?'Bijna klaar: bevestig je deelname via de mail die we je net stuurden.':((j&&j.fout)||'Dat lukte even niet.')})['catch'](function(){o.textContent='Dat lukte even niet.'})})})();</script>`;
}
export function uitlegHtml() {
  return `<dl class="rows"><div class="r"><dt>Elke dag</dt><dd>Je krijgt elke ochtend één mail met je eigen link. Tik erop: dan zie je de uitslag van gisteren en tel je mee voor vandaag.</dd></div><div class="r"><dt>Meedoen</dt><dd>Na 10 dagen op rij doe je mee aan de trekking. Of eerder: zodra 10 vrienden via jouw link meedoen.</dd></div><div class="r"><dt>Lootjes</dt><dd>1 lootje per dag dat je tikt. Plus 5 voor elke vriend die meedoet, en 2 voor elke vriend van een vriend. Hooguit 100. Wint iemand uit je kring, dan tellen jouw lootjes de dag erna dubbel.</dd></div><div class="r"><dt>De prijs</dt><dd>Elke dag één winnaar. Die kiest zelf een cadeau tot ${euro(R.prijsMax)} inclusief verzending, binnen 3 werkdagen thuis.</dd></div></dl>`;
}
export async function dagHtml(c, p, D) {
  const k = await kring(c, p.id), l = await lootjes(c, p, k, D), dub = String((await kv.get(c.ns + 'dubbel:' + p.id).catch(() => '')) || '') === D;
  const gD = plusDag(D, -1), g = await kv.get(c.ns + 'trek:' + gD), mw = String((await kv.get(c.ns + 'mijnwin:' + p.id).catch(() => '')) || '');
  let win = null; if (mw) { const t = await kv.get(c.ns + 'trek:' + mw); if (t && t.id === p.id && t.status === 'getrokken') { win = t; if (!t.gezien) { t.gezien = Date.now(); await kv.set(c.ns + 'trek:' + mw, t); } } }
  const blokken = [];
  if (win) blokken.push(`<div class="dk-k dk-w"><h2>Je hebt gewonnen</h2><p>Je bent getrokken op ${esc(datumNl(win.D))}, met ${win.winLootjes} ${win.winLootjes === 1 ? 'lootje' : 'lootjes'} van de ${win.lootjes}. Kies zelf een cadeau tot ${euro(R.prijsMax)}, binnen 3 werkdagen thuis.</p><p><a class="btn knop" href="${u(c, 'dkwin', '&t=' + win.token)}">Kies je cadeau</a></p></div>`);
  else if (g && g.deelnemers) blokken.push(`<div class="dk-k"><h2>Uitslag van gisteren</h2><p>${g.id === p.id ? 'Je hebt gewonnen.' : 'Iemand anders won, uit ' + (g.deelnemers === 1 ? '1 deelnemer' : g.deelnemers + ' deelnemers') + '.'} Lot uit ${esc(g.bron)}${g.ronde ? ' (ronde ' + esc(g.ronde) + ')' : ''}.</p></div>`);
  const meeNu = mee(p, k);
  blokken.push(`<div class="dk-k"><h2>${meeNu ? `Je doet vandaag mee met ${l} ${l === 1 ? 'lootje' : 'lootjes'}` : `Dag ${p.reeks} van je reeks`}</h2>${meeNu ? `<p>De trekking is morgenochtend om 7 uur.${dub ? ' Iemand uit je kring won: je lootjes tellen vandaag dubbel.' : ''}</p>` : `<div class="dk-r" aria-hidden="true">${Array.from({ length: R.meeReeks }, (_, i) => `<i class="${i < p.reeks ? 'v' : ''}"></i>`).join('')}</div><p>Nog ${R.meeReeks - p.reeks} ${R.meeReeks - p.reeks === 1 ? 'dag' : 'dagen'} op rij, dan doe je mee aan de trekking.${k.v1 ? ` Of nog ${R.meeVrienden - k.v1} ${R.meeVrienden - k.v1 === 1 ? 'vriend' : 'vrienden'}.` : ''}</p>`}</div>`);
  const kr = [k.v1 ? `${k.v1} ${k.v1 === 1 ? 'vriend' : 'vrienden'}` : '', k.v2 ? `${k.v2} ${k.v2 === 1 ? 'vriend van een vriend' : 'vrienden van vrienden'}` : ''].filter(Boolean);
  const onderweg = k.onderweg ? ` ${k.onderweg === 1 ? '1 vriend is' : k.onderweg + ' vrienden zijn'} onderweg.` : '';
  const deelUrl = u(c, 'dk', '&v=' + p.code), deelTekst = `Ik doe mee met de Kadoly Winterkans: elke dag kiest iemand gratis een cadeau. Doe je mee? Dan krijg ik er zelf ook extra lootjes voor. ${deelUrl}`;
  blokken.push(`<div class="dk-k"><h2>Je kring</h2><p>${kr.length ? 'Jij → ' + esc(kr.join(' → ')) + '.' : 'Nodig vrienden uit. Elke vriend die meedoet geeft je 5 lootjes, elke vriend van een vriend 2.'}${onderweg} Een vriend telt mee als hij zich aanmeldt en 3 dagen tikt.</p><p><a class="btn knop" href="https://wa.me/?text=${encodeURIComponent(deelTekst)}" target="_blank" rel="noopener">Deel via WhatsApp</a></p><p class="meta">Je eigen link: ${esc(deelUrl)}</p></div>`);
  const pr = await dagProducten(D);
  if (pr.length) blokken.push(`<div class="dk-k"><h2>Vandaag bij Kadoly</h2><div class="dk-p">${pr.map(x => `<a href="https://kadoly.com/product/${encodeURIComponent(x.pid)}?utm_source=winterkans&amp;utm_medium=dagpagina"><img src="${esc(x.img)}" alt="" loading="lazy">${esc(x.naam)}<br><b>${euro(x.prijs)}</b></a>`).join('')}</div></div>`);
  return `<p class="kicker">${esc(R.naam)} · ${esc(datumNl(D))}</p><h1>${win ? 'Gefeliciteerd' : 'Je tik voor vandaag telt'}</h1>${blokken.join('')}<p class="meta"><a href="${u(c, 'dkregels')}">Spelregels</a> · <a href="${u(c, 'dkaf', '&t=' + p.af)}">Afmelden</a></p>`;
}
export const SPELREGELS = (c) => `<p class="kicker">${esc(R.naam)}</p><h1>Spelregels ${esc(R.naam)}</h1><dl class="rows">
<div class="r"><dt>Organisator</dt><dd>ADSFAIR B.V. (Kadoly Shop), Albert Plesmanplein 20, 2805 AB Gouda, KVK 60126035. De actie promoot de webshop Kadoly.</dd></div>
<div class="r"><dt>Looptijd</dt><dd>Vanaf de start tot en met ${esc(datumNl(R.eind))}. Dit is een klein promotioneel kansspel: alle prijzen samen zijn hooguit ${euro(R.potMax)} waard.</dd></div>
<div class="r"><dt>Meedoen</dt><dd>Gratis, zonder aankoop. Voor iedereen van 18 jaar of ouder met een woonadres in Nederland, met één bevestigd e-mailadres per persoon. Medewerkers van Kadoly en ADSFAIR B.V. doen niet mee.</dd></div>
<div class="r"><dt>Elke dag</dt><dd>Je krijgt elke ochtend een mail met je eigen link. Een dag telt als je op die link tikt. Meedoen aan de trekking kan na 10 dagen op rij tikken, of zodra 10 vrienden via jouw link meedoen. Een vriend doet mee als hij zich zelf aanmeldt en op 3 dagen tikt.</dd></div>
<div class="r"><dt>Lootjes</dt><dd>Op een dag dat je tikt en meedoet: 1 lootje, plus 5 per vriend die meedoet, plus 2 per vriend van een vriend, met een maximum van 100. Is iemand uit je kring (wie jou uitnodigde, diens uitnodiger, jouw vrienden en hun vrienden) de winnaar, dan tellen jouw lootjes de dag erna dubbel, binnen hetzelfde maximum. Meer lootjes geeft meer kans, nooit een grotere prijs.</dd></div>
<div class="r"><dt>Trekking</dt><dd>Elke ochtend om 7 uur (Nederlandse tijd) loten we één winnaar uit de deelnemers van de dag ervoor, naar verhouding van hun lootjes. Het lot komt uit drand, een openbare toevalsgenerator die niemand kan sturen.</dd></div>
<div class="r"><dt>Prijs</dt><dd>Eén product naar keuze uit een selectie van Kadoly, tot ${euro(R.prijsMax)} inclusief verzending, binnen 3 werkdagen gratis thuisbezorgd in Nederland. Niet in te wisselen voor geld. Eventuele kansspelbelasting betaalt Kadoly.</dd></div>
<div class="r"><dt>Winnaar</dt><dd>Ziet de uitslag zodra hij op zijn link tikt. Tikt hij 2 dagen niet, dan krijgt hij een mail. Hij kiest binnen 14 dagen daarna een product en een bezorgadres; daarna vervalt de prijs. We vragen nooit om bankgegevens of een betaling.</dd></div>
<div class="r"><dt>Vrienden uitnodigen</dt><dd>Je deelt je eigen link zelf, alleen met mensen die je kent. Kadoly stuurt nooit berichten naar je vrienden. Nep-adressen of meerdere adressen van één persoon tellen niet mee; dan vervallen de lootjes.</dd></div>
<div class="r"><dt>Privacy</dt><dd>We gebruiken je e-mailadres alleen voor deze actie en wissen het uiterlijk 60 dagen na afloop, tenzij je je apart aanmeldt voor de nieuwsbrief. Het bezorgadres gebruiken we alleen voor de prijs en wissen we binnen 60 dagen. Afmelden kan met één klik onder elke mail. Zie ook het <a href="https://kadoly.com/privacy">privacybeleid</a>.</dd></div>
<div class="r"><dt>Verder</dt><dd>We volgen de Gedragscode Promotionele Kansspelen. De regels veranderen niet in het nadeel van deelnemers zolang de actie loopt. Vragen of klachten: antwoord op een mail van de Winterkans, dan krijg je binnen 2 werkdagen antwoord.</dd></div></dl>`;

// ---------- testhulp ----------
async function maakTest(c, { email, van = '', reeks = 0, dag = '' } = {}) {
  const id = idVan(email); let code = ''; for (let i = 0; i < 6 && !code; i++) { const k = randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6); if (k.length === 6 && (await kv.raw(['SET', c.ns + 'code:' + k, id, 'NX']))) code = k; }
  const s = { id, email, at: Date.now(), bevestigd: Date.now(), actief: true, af: tok(), link: tok(), code, van, reeks, laatste: reeks ? dag : '', dagen: reeks, act: false };
  await bewaar(c, s); await kv.set(c.ns + 'link:' + h(s.link), id); await kv.set(c.ns + 'af:' + h(s.af), id); await kv.raw(['SADD', c.ns + 'emails', id]);
  if (van) { await kv.raw(['SADD', c.ns + 'kids:' + van, id]); if (s.dagen >= R.vriendDagen) { s.act = true; await kv.raw(['SADD', c.ns + 'act:' + van, id]); await bewaar(c, s); } }
  if (reeks && dag) { await kv.raw(['SADD', c.ns + 'tik:' + dag, id]); await kv.raw(['EXPIRE', c.ns + 'tik:' + dag, 90 * 86400]); }
  return s;
}
const rnd = () => randomBytes(3).toString('hex');
async function wis(c) { let cur = '0', n = 0; do { const [nx, keys] = await kv.scan(cur, { match: c.ns + '*', count: 500 }); cur = nx; if (keys.length) { await kv.del(keys); n += keys.length; } } while (cur !== '0' && n < 20000); await kv.incr('dktv'); return n; }
async function testLijst(c) { const L = []; for (const id of await smem(c.ns + 'emails')) { const p = await lees(c, id); if (!p) continue; const k = await kring(c, id); L.push({ p, k }); } return L.sort((a, b) => N(a.p.at) - N(b.p.at)); }

// ---------- routes (api/gids.js stuurt elke op=dk... hierheen) ----------
export async function dkOp(op, { req, res, q, host, ua, kaal, leesBody, isBot }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const beschermd = /\.vercel\.app$/i.test(host); const wilTest = q.get('test') === '1';
  if (wilTest && !beschermd) return res.status(404).send('Niet gevonden');
  const c = await wereld(wilTest); let D = await vandaag(c);
  const aan = c.test || !!(await kv.get('dk:aan').catch(() => null));
  const k0 = String(q.get('k') || ''), p0 = /^[a-f0-9]{48}$/.test(k0) ? await vanLink(c, k0) : null;
  const pagina = (code, titel, inhoud, script, p = p0) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(code).send(kaal(titel, CSS + testBalk(c, D, p) + inhoud, script)); };
  const naar = url => { res.setHeader('location', url); return res.status(303).end(); };
  const vanHier = () => { const o = req.headers.origin; if (!o) return true; try { const hh = new URL(o).hostname; return hh === 'gids.kadoly.com' || /\.vercel\.app$/i.test(hh); } catch (e) { return false; } };
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim();
  const kop = `<p class="kicker">${esc(R.naam)}</p>`;
  const regelsLink = `<a href="${u(c, 'dkregels')}">Spelregels</a>`;

  if (op === 'dkronde') { // cron elke ochtend; handmatig alleen via de beschermde host
    const cron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(ua)); if (!cron && !beschermd) return res.status(404).send('Niet gevonden');
    const uit = { live: await ronde(await wereld(false)).catch(e => ({ fout: String(e.message || e).slice(0, 160) })) };
    if (cron) uit.test = await ronde(await wereld(true)).catch(e => ({ fout: String(e.message || e).slice(0, 160) })); // de testwereld loopt ook gewoon elke dag door
    return res.status(200).json(uit); }
  if (op === 'dkstand') { if (!beschermd) return res.status(404).send('Niet gevonden');
    const tel = {}; for (let i = 0; i < 14; i++) { const d = plusDag(D, -i); const a = await kv.raw(['HGETALL', c.ns + 'tel:' + d]).catch(() => []); if (Array.isArray(a) && a.length) { tel[d] = {}; for (let j = 0; j + 1 < a.length; j += 2) tel[d][a[j]] = N(a[j + 1]); } }
    const T = []; for (const d of ((await kv.get(c.ns + 'trekkingen')) || []).slice(-14)) { const t = await kv.get(c.ns + 'trek:' + d); if (t) T.push({ d, deelnemers: t.deelnemers, lootjes: t.lootjes, status: t.status || '', bron: t.bron, keuze: t.keuze ? t.keuze.naam : '' }); }
    return res.status(200).json({ ok: true, wereld: c.test ? 'test' : 'live', aan, vandaag: D, eind: R.eind, deelnemers: N(await kv.raw(['SCARD', c.ns + 'emails']).catch(() => 0)), potGebruikt: await potGebruikt(c), potMax: R.potMax, tel, trekkingen: T }); }
  if (!aan) return res.status(404).send('Niet gevonden'); // live pas op Henkjans woord (kv dk:aan)

  if (op === 'dkregels') return pagina(200, 'Spelregels ' + R.naam, SPELREGELS(c));
  if (op === 'dkaanmelden') { if (req.method !== 'POST' || !vanHier() || isBot(ua)) return res.status(403).json({ ok: false });
    try { return res.status(200).json(await aanmelden(c, await leesBody(req), ip)); } catch (e) { console.error('dk aanmelden', String(e && e.message || e).slice(0, 160)); return res.status(503).json({ ok: false, fout: 'Dat lukte even niet. Probeer het zo nog eens.' }); } }
  if (op === 'dk') { const v = String(q.get('v') || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8); const uitgenodigd = v && (await kv.get(c.ns + 'code:' + v).catch(() => null));
    if (!c.test && D > R.eind) return pagina(200, R.naam, `${kop}<h1>De Winterkans is afgelopen</h1><p>Dank je wel voor het meedoen. De winnaars zijn bericht.</p><p><a href="https://kadoly.com">Naar Kadoly</a></p>`);
    return pagina(200, R.naam, `${kop}<h1>Elke dag kans op een gratis cadeau</h1><p>${uitgenodigd ? '<b>Een vriend nodigde je uit.</b> ' : ''}Elke ochtend loten we één winnaar. Die kiest zelf een cadeau tot ${euro(R.prijsMax)}, binnen 3 werkdagen gratis thuis. Meedoen is gratis, tot en met ${esc(datumNl(R.eind))}.</p>${aanmeldBlok(c, uitgenodigd ? v : '')}${uitlegHtml()}<p class="meta">${regelsLink} · 18+ · Kadoly Shop</p>`); }
  if (op === 'dkbevestig') { const t = String(q.get('t') || ''); const ongeldig = () => pagina(400, 'Deze link werkt niet meer', `${kop}<h1>Deze link werkt niet meer</h1><p>Een bevestigingslink is twee dagen geldig. Meld je gerust opnieuw aan.</p><p><a class="btn knop" href="${u(c, 'dk')}">Opnieuw aanmelden</a></p>`);
    if (req.method === 'POST') { const s = await bevestig(c, t); if (!s) return ongeldig(); await tik(c, s, D); return naar(u(c, 'dkt', '&k=' + s.link + '&nieuw=1')); }
    const pd = /^[a-f0-9]{48}$/.test(t) ? await kv.get(c.ns + 'pending:' + h(t)) : null; if (!pd) return ongeldig();
    if (pd.klaar) { const s = await lees(c, pd.id); if (s && s.actief) return naar(u(c, 'dkt', '&k=' + s.link)); return ongeldig(); }
    return pagina(200, 'Bevestig je deelname', `${kop}<h1>Nog één klik</h1><p>Bevestig dat je meedoet met <b>${esc(pd.email)}</b>.</p><form method="post" action="${u(c, 'dkbevestig', '&t=' + t)}" id="dkb"><button class="btn knop" type="submit">Ja, ik doe mee</button></form>`, '<script>setTimeout(function(){if(document.visibilityState==="visible"){var f=document.getElementById("dkb");f.querySelector("button").disabled=true;f.submit()}},400)</script>', null); }
  if (op === 'dkt') { const p = p0;
    if (!p) return pagina(400, 'Deze link werkt niet', `${kop}<h1>Deze link werkt niet</h1><p>Gebruik de link uit je laatste mail van de Winterkans, of meld je opnieuw aan.</p><p><a class="btn knop" href="${u(c, 'dk')}">Naar de Winterkans</a></p>`, '', null);
    if (!p.actief) return pagina(200, 'Je bent afgemeld', `${kop}<h1>Je bent afgemeld</h1><p>Je krijgt geen mail meer van de Winterkans.</p><form method="post" action="${u(c, 'dkaf', '&t=' + p.af + '&weer=1')}"><button class="btn deel" type="submit">Meld me weer aan</button></form>`, '', null);
    if (!c.test && D > R.eind) return pagina(200, R.naam, `${kop}<h1>De Winterkans is afgelopen</h1><p>Dank je wel voor het meedoen.</p>`);
    if (req.method === 'POST') { if (!vanHier()) return res.status(403).send('Niet toegestaan'); await tik(c, p, D); return naar(u(c, 'dkt', '&k=' + p.link)); }
    if (p.laatste !== D) return pagina(200, 'Tik voor vandaag', `${kop}<h1>Tik voor vandaag</h1><p>Eén tik, dan tel je mee voor ${esc(datumNl(D))} en zie je de uitslag van gisteren.</p><form method="post" action="${u(c, 'dkt', '&k=' + p.link)}" id="dkf2"><button class="btn knop" type="submit">Tik voor vandaag</button></form>`, isBot(ua) ? '' : '<script>setTimeout(function(){if(document.visibilityState==="visible"){var f=document.getElementById("dkf2");f.querySelector("button").disabled=true;f.submit()}},300)</script>');
    return pagina(200, R.naam, (q.get('nieuw') === '1' ? '<div class="dk-k dk-w"><h2>Gelukt, je doet mee</h2><p>Vanaf morgen krijg je elke ochtend één mail met je eigen link. Je eerste dag telt al.</p></div>' : '') + await dagHtml(c, p, D)); }
  if (op === 'dkaf') { const t = String(q.get('t') || ''), weer = q.get('weer') === '1';
    if (req.method === 'POST' && !weer) { await afmelden(c, t); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('Afgemeld'); } // één klik vanuit de mailapp
    const terug = req.method === 'POST' && weer; const s = await afmelden(c, t, terug);
    if (!s) return pagina(400, 'Deze afmeldlink werkt niet', `${kop}<h1>Deze afmeldlink werkt niet</h1><p>Antwoord op een mail van de Winterkans, dan melden we je met de hand af. Dat doen we dezelfde dag.</p>`, '', null);
    if (terug) return naar(u(c, 'dkt', '&k=' + s.link));
    return pagina(200, 'Je bent afgemeld', `${kop}<h1>Je bent afgemeld</h1><p><b>${esc(s.email)}</b> krijgt geen mail meer van de Winterkans. Eén klik was genoeg.</p><form method="post" action="${u(c, 'dkaf', '&t=' + t + '&weer=1')}"><button class="btn deel" type="submit">Per ongeluk? Meld me weer aan</button></form>`, '', null); }
  if (op === 'dkwin') { const t = String(q.get('t') || ''); const w = await winLees(c, t);
    if (!w) return pagina(400, 'Deze link werkt niet', `${kop}<h1>Deze link werkt niet</h1><p>Antwoord op de mail waarin je deze link kreeg, dan zoeken we het samen uit.</p>`, '', null);
    if (w.status === 'verlopen') return pagina(200, 'Deze prijs is verlopen', `${kop}<h1>Deze prijs is verlopen</h1><p>Je had ${R.kiesDagen} dagen om te kiezen. Je doet wel gewoon weer mee met de volgende trekkingen.</p>`, '', null);
    if (w.status === 'gekozen') return pagina(200, 'Je keuze is binnen', `${kop}<h1>Je keuze is binnen</h1><p>Je koos <b>${esc(w.keuze.naam)}</b>. We bestellen hem voor je, binnen 3 werkdagen is hij thuis.</p>`, '', null);
    if (req.method === 'POST') { const r = await winKies(c, t, await leesBody(req)); if (r.fout) return pagina(400, 'Nog niet compleet', `${kop}<h1>Nog niet compleet</h1><p>${esc(r.fout.length > 12 ? r.fout : 'Er ging iets mis. Antwoord op je winmail, dan regelen we het samen.')}</p><p><a class="btn knop" href="${u(c, 'dkwin', '&t=' + t)}">Terug</a></p>`, '', null);
      return pagina(200, 'Je cadeau komt eraan', `${kop}<h1>Top, je cadeau komt eraan</h1><p>Je koos <b>${esc(r.w.keuze.naam)}</b>. We bestellen hem voor je en hij is binnen 3 werkdagen gratis bij je thuis. Je adres gebruiken we alleen hiervoor en we wissen het binnen 60 dagen.</p>`, '', null); }
    const opties = await prijsOpties(); const tot = plusDag(w.D, R.winMeldNa + R.kiesDagen);
    if (!opties.length) return pagina(200, 'Gefeliciteerd', `${kop}<h1>Gefeliciteerd</h1><p>Antwoord op je winmail met wat je zoekt, dan zoeken we samen een cadeau tot ${euro(R.prijsMax)} uit.</p>`, '', null);
    return pagina(200, 'Kies je cadeau', `${kop}<h1>Gefeliciteerd, kies je cadeau</h1><p>Kies één cadeau tot ${euro(R.prijsMax)}. Wij bestellen het en het is binnen 3 werkdagen gratis bij je thuis. Je betaalt niets en we vragen nooit om bankgegevens.</p>
<form class="dk-f" method="post" action="${u(c, 'dkwin', '&t=' + t)}" style="max-width:none"><div class="dk-o" role="radiogroup" aria-label="Kies je cadeau">${opties.map((o, i) => `<label><input type="radio" name="pid" value="${esc(o.pid)}"${i === 0 ? ' required' : ''}><img src="${esc(o.img)}" alt="" loading="lazy" width="56" height="56"><span>${esc(o.naam)}<br><b>${euro(o.prijs)}</b> · ${o.lt} ${o.lt === 1 ? 'werkdag' : 'werkdagen'}</span></label>`).join('')}</div>
<input type="text" name="voornaam" autocomplete="given-name" placeholder="Voornaam" required aria-label="Voornaam"><input type="text" name="achternaam" autocomplete="family-name" placeholder="Achternaam" required aria-label="Achternaam"><input type="text" name="adres" autocomplete="street-address" placeholder="Straat en huisnummer" required aria-label="Straat en huisnummer"><input type="text" name="postcode" autocomplete="postal-code" placeholder="Postcode" required aria-label="Postcode" maxlength="7"><input type="text" name="plaats" autocomplete="address-level2" placeholder="Plaats" required aria-label="Plaats">
<label class="vk"><input type="checkbox" name="toestemming" value="1"><span>Je mag mijn voornaam en woonplaats noemen bij de winnaars.</span></label><button class="btn knop" type="submit">Stuur mijn cadeau</button><p class="meta">Kiezen kan tot en met ${esc(datumNl(tot))}. ${regelsLink}</p></form>`, '', null); }
  if (op === 'dkmails') { if (!c.test) return res.status(404).send('Niet gevonden');
    const p = p0 || { reeks: 4, laatste: plusDag(D, -1), link: '0'.repeat(48), af: '0'.repeat(48) }; const k = p0 ? await kring(c, p0.id) : { v1: 0, v2: 0 };
    const ifr = (titel, html) => `<h2>${esc(titel)}</h2><iframe title="${esc(titel)}" srcdoc="${esc(html.replace('<head>', '<head><base target="_top">'))}" style="width:100%;height:640px;border:1px solid var(--line);border-radius:18px;background:#E8F4FD;margin:0 0 22px" loading="lazy"></iframe>`;
    return pagina(200, 'De mails van de Winterkans', `${kop}<h1>Zo zien de mails eruit</h1><p>Precies wat een deelnemer krijgt${p0 ? ', met jouw testlink' : ''}.</p>${ifr('Elke ochtend', mailDag(c, p, { k, D, gisteren: { deelnemers: 12 } }))}${ifr('Na aanmelden', mailBevestig(u(c, 'dkbevestig', '&t=voorbeeld')))}${ifr('Als je wint en 2 dagen niet tikt', mailWin(c, u(c, 'dkwin', '&t=voorbeeld')))}`); }
  if (op === 'dktest') { if (!c.test) return res.status(404).send('Niet gevonden'); const actie = String(q.get('actie') || ''), n = Math.max(1, Math.min(20, N(q.get('n')) || 1)); const p = p0;
    const klaar = (titel, regels) => pagina(200, titel, `${kop}<h1>${esc(titel)}</h1><ul>${regels.map(r => `<li>${r}</li>`).join('')}</ul><p>${p ? `<a class="btn knop" href="${u(c, 'dkt', '&k=' + p.link)}">Naar mijn dagpagina</a>` : `<a class="btn knop" href="${u(c, 'dk')}">Naar de aanmeldpagina</a>`}</p>`);
    if (actie === 'maak') { const s = await maakTest(c, { email: 'ik-' + rnd() + '@voorbeeld.invalid' }); await tik(c, s, D); return naar(u(c, 'dkt', '&k=' + s.link + '&nieuw=1')); }
    if (actie === 'volgende') { await kv.incr(c.ns + 'offset'); const r = await ronde(c, { mail: q.get('mail') !== '0' }); const D2 = r.D, t = r.trekking || {}; D = D2;
      return klaar('Het is nu ' + datumNl(D2), [t.deelnemers ? `Trekking van ${esc(datumNl(t.D))}: ${t.deelnemers} ${t.deelnemers === 1 ? 'deelnemer' : 'deelnemers'}, ${t.lootjes} lootjes, lot uit ${esc(t.bron)}${t.kringBonus ? `. ${t.kringBonus} mensen uit de kring van de winnaar krijgen vandaag dubbele lootjes` : ''}.` : `Trekking van ${esc(datumNl(plusDag(D2, -1)))}: nog niemand deed mee (dat kan na een reeks van 10 dagen of met 10 vrienden).`, r.mails ? `${r.mails} ${r.mails === 1 ? 'dagmail' : 'dagmails'} verstuurd (testvrienden krijgen geen mail).` : 'Geen dagmail verstuurd.', r.winMail ? 'Winmail verstuurd naar een winnaar die 2 dagen niet tikte.' : '', p ? 'Open je dagpagina: je tikt dan voor de nieuwe dag.' : ''].filter(Boolean)); }
    if (!p && ['reeks', 'vrienden', 'trek'].includes(actie)) return naar(u(c, 'dk'));
    if (actie === 'reeks') { p.reeks = n; p.laatste = D; p.dagen = Math.max(N(p.dagen), n); await kv.raw(['SADD', c.ns + 'tik:' + D, p.id]); if (!p.act && p.van && p.dagen >= R.vriendDagen) { p.act = true; await kv.raw(['SADD', c.ns + 'act:' + p.van, p.id]); } await bewaar(c, p); return naar(u(c, 'dkt', '&k=' + p.link)); }
    if (actie === 'vrienden') { for (let i = 0; i < Math.min(n, 10); i++) { const v = await maakTest(c, { email: 'vriend-' + rnd() + '@voorbeeld.invalid', van: p.id, reeks: R.meeReeks, dag: D }); for (let j = 0; j < 2; j++) await maakTest(c, { email: 'vriend-' + rnd() + '@voorbeeld.invalid', van: v.id, reeks: R.meeReeks, dag: D }); } return naar(u(c, 'dkt', '&k=' + p.link)); }
    if (actie === 'trek') { const key = c.ns + 'trek:' + D; const oud = await kv.get(key); if (oud && oud.token) await kv.del([c.ns + 'win:' + h(oud.token)]); await kv.del([key]); const r = await trek(c, D);
      const t = await kv.get(key); const ik = !!(t && t.id === p.id); return klaar(ik ? 'Je hebt gewonnen' : 'Getrokken', [r.deelnemers ? `${r.deelnemers} ${r.deelnemers === 1 ? 'deelnemer' : 'deelnemers'}, ${r.lootjes} lootjes, lot uit ${esc(r.bron)}${r.ronde ? ' (ronde ' + esc(r.ronde) + ')' : ''}.` : 'Vandaag doet nog niemand mee: zet eerst je reeks op 10 of maak testvrienden.', r.deelnemers ? (ik ? 'Jij bent getrokken. Open je dagpagina en kies je cadeau.' : 'Iemand anders is getrokken. Probeer het nog eens, of maak meer vrienden voor meer lootjes.') : '', r.kringBonus ? `${r.kringBonus} mensen uit de kring van de winnaar krijgen morgen dubbele lootjes.` : ''].filter(Boolean)); }
    if (actie === 'lijst') { const L = await testLijst(c); return pagina(200, 'Alle testdeelnemers', `${kop}<h1>Alle testdeelnemers</h1><dl class="rows">${L.map(({ p: x, k }) => `<div class="r"><dt>${esc(x.email)}</dt><dd>reeks ${x.reeks} · ${x.dagen} ${x.dagen === 1 ? 'dag' : 'dagen'}${k.v1 ? ' · ' + k.v1 + ' vrienden' : ''}${k.v2 ? ' · ' + k.v2 + ' vrienden van vrienden' : ''}${x.van ? ' · uitgenodigd' : ''} · <a href="${u(c, 'dkt', '&k=' + x.link)}">dagpagina</a></dd></div>`).join('')}</dl>`); }
    if (actie === 'wis') { await wis(c); return naar(u(c, 'dk')); }
    return naar(u(c, 'dk')); }
  return res.status(404).send('Niet gevonden');
}
