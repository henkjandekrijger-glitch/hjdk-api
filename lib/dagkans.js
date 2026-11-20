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
// - Pot hooguit €30. Is je pot genoeg voor een cadeau (shopcatalogus: tot €30 incl. verzending, binnen 3 werkdagen thuis), dan kies je het
//   gratis; het bedrag gaat van je pot af en Henkjan krijgt een bestelmail. Na 14 dagen zonder tik stopt de dagmail, na 30 dagen vervalt de pot.
// - Live pas aan op Henkjans woord (kv dk:aan). Testwereld alleen op de beschermde host met &test=1 (eigen opslag dkt<versie>:).
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { kv } from './db.js';
import { stuurMails, mailSchil, knop, mailHenkjan, mailKlaar, KADOLY_BEDRIJF } from './kadoly-nieuws.js';

// bedragen in centen
export const R = { naam: 'Kadoly Spaarpot', start: 500, tik: 10, vriend: 10, vriendMax: 90, reeksElke: 10, reeksBonus: 100, potMax: 3000, prijsMax: 30, leverMax: 3, vriendDagen: 3, rustNa: 14, vervalNa: 30 };
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
  if (!test) return { test: false, ns: 'dk:', base: 'https://gids.kadoly.com/api/gids' };
  const v = N(await kv.get('dktv').catch(() => 0)); return { test: true, ns: 'dkt' + v + ':', base: 'https://hjdk-api-henq.vercel.app/api/gids' };
}
const u = (c, op, extra = '') => c.base + '?op=' + op + (c.test ? '&test=1' : '') + extra;
export async function vandaag(c) { const o = c.test ? N(await kv.get(c.ns + 'offset').catch(() => 0)) : 0; return amsDag(Date.now() + o * 864e5); }
const lees = (c, id) => kv.get(c.ns + 'p:' + id).catch(() => null);
const bewaar = (c, p) => kv.set(c.ns + 'p:' + p.id, p);
async function tel(c, wat, n = 1) { if (!n) return; try { const k = c.ns + 'tel:' + (await vandaag(c)); await kv.raw(['HINCRBY', k, wat, n]); await kv.raw(['EXPIRE', k, 120 * 86400]); } catch (e) {} }
const aanStaat = async c => c.test || !!(await kv.get('dk:aan').catch(() => null));

// ---------- aanmelden en bevestigen ----------
export async function aanmelden(c, b, ip) {
  const email = String(b.email || '').trim().toLowerCase(); if (!okMail(email)) return { ok: false, fout: 'Vul een geldig e-mailadres in.' };
  if (b.oud !== true && b.oud !== '1') return { ok: false, fout: 'Meedoen kan vanaf 18 jaar met een woonadres in Nederland.' };
  if (!(await aanStaat(c))) return { ok: false, fout: 'De Spaarpot is nog niet begonnen.' };
  if (!(await mailKlaar())) return { ok: false, fout: 'Even niet beschikbaar.' };
  if (b.website || N(b.ms) < 1200) return { ok: true }; // honingpot of te snel
  const rk = c.ns + 'rl:' + h(ip + ':' + Math.floor(Date.now() / 60000)).slice(0, 20); const n = N(await kv.incr(rk)); if (n === 1) await kv.raw(['EXPIRE', rk, '120']); if (n > 6) return { ok: false, fout: 'Even te druk, probeer het zo nog eens.' };
  const id = idVan(email), oud = await lees(c, id); if (oud && oud.actief) return { ok: true, al: true };
  if (!(await kv.raw(['SET', c.ns + 'er:' + id, '1', 'NX', 'EX', '600']))) return { ok: true };
  let van = ''; const vc = String(b.v || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8); if (vc) { const r = String((await kv.get(c.ns + 'code:' + vc)) || ''); if (r && r !== id) van = r; }
  const t = tok(); await kv.set(c.ns + 'pending:' + h(t), { id, email, van, at: Date.now() }, { ex: 2 * 86400 });
  await stuurMails([{ to: [email], subject: (c.test ? '[TEST] ' : '') + 'Bevestig je Kadoly Spaarpot', html: mailBevestig(u(c, 'dkbevestig', '&t=' + t)) }], 'dk-bev-' + h(t).slice(0, 32));
  await tel(c, 'aanvraag'); return { ok: true };
}
async function nieuweCode(c, id) { for (let i = 0; i < 6; i++) { const k = randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6); if (k.length === 6 && (await kv.raw(['SET', c.ns + 'code:' + k, id, 'NX']))) return k; } return ''; }
async function maak(c, { id, email, van = '', at = Date.now() }) {
  const s = { id, email, at, bevestigd: Date.now(), actief: true, af: tok(), link: tok(), code: await nieuweCode(c, id), van, reeks: 0, laatste: '', dagen: 0, act: false, pot: 0, log: [] };
  boek(s, R.start, await vandaag(c), 'start'); // gevulde spaarpot bij de start
  await bewaar(c, s); await kv.set(c.ns + 'link:' + h(s.link), id); await kv.set(c.ns + 'af:' + h(s.af), id); await kv.raw(['SADD', c.ns + 'emails', id]);
  if (van) await kv.raw(['SADD', c.ns + 'kids:' + van, id]); return s;
}
export async function bevestig(c, t) {
  if (!/^[a-f0-9]{48}$/.test(t || '')) return null; const p = await kv.get(c.ns + 'pending:' + h(t)); if (!p) return null;
  const oud = await lees(c, p.id); if (oud && oud.actief) return oud;
  const s = await maak(c, p); await kv.set(c.ns + 'pending:' + h(t), { ...p, klaar: Date.now() }, { ex: 2 * 86400 }); await tel(c, 'bevestigd'); return s;
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
  if (p.laatste && p.laatste < plusDag(D, -R.vervalNa) && N(p.pot) > 0) { p.vervallen = { D, c: p.pot }; p.pot = 0; }
  p.reeks = p.laatste === plusDag(D, -1) ? N(p.reeks) + 1 : 1; p.dagen = N(p.dagen) + 1; p.laatste = D; p.rust = false;
  boek(p, R.tik, D, 'tik'); if (p.reeks % R.reeksElke === 0) boek(p, R.reeksBonus, D, 'reeks');
  await kv.raw(['SADD', c.ns + 'tik:' + D, p.id]); await kv.raw(['EXPIRE', c.ns + 'tik:' + D, 90 * 86400]);
  if (!p.act && p.van && p.dagen >= R.vriendDagen) { p.act = true; await kv.raw(['SADD', c.ns + 'act:' + p.van, p.id]); }
  p.gaf = { D, n: await geefVrienden(c, p, D) }; // jij klikt voor hen
  await bewaar(c, p); await tel(c, 'tik'); await tel(c, 'samencent', p.gaf.n * R.vriend); return p;
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
    const echt = boek(q, Math.min(R.vriend, ruimte), D, 'samen'); if (!echt) continue; q.samen.n++; q.samen.c += echt; await bewaar(c, q); n++; }
  return n;
}

// ---------- producten (shopcatalogus) ----------
let CAT = null, CAT_AT = 0;
async function catalogus() { if (CAT && Date.now() - CAT_AT < 600000) return CAT; let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {} CAT = (c && Array.isArray(c.items)) ? c.items : []; CAT_AT = Date.now(); return CAT; }
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
const snel = i => i && i.img && i.vr !== false && N(i.lt) > 0 && N(i.lt) <= R.leverMax && N(i.p) > 0 && !/^[A-Z][a-z]+ (for|with|and|the) /.test(String(i.t || ''));
const populair = i => N(i.so30) * 3 + N(i.ca7) + N(i.so7) * 5;
const kort = i => ({ pid: i.id, naam: i.t, prijs: thuis(i), img: i.img, lt: N(i.lt) });
export async function cadeaus() { return (await catalogus()).filter(i => snel(i) && thuis(i) <= R.prijsMax).sort((a, b) => populair(b) - populair(a) || thuis(a) - thuis(b)).slice(0, 30).map(kort); }
export async function dagProducten(D) { const L = (await catalogus()).filter(i => snel(i) && thuis(i) <= 60).sort((a, b) => populair(b) - populair(a)).slice(0, 30); if (!L.length) return []; const s = Number(BigInt('0x' + h('dp:' + D).slice(0, 12)) % BigInt(L.length)); return [0, 1, 2].map(j => L[(s + j * 7) % L.length]).filter((x, j, a) => a.indexOf(x) === j).map(kort); }
async function doel(pot) { const L = (await cadeaus()).slice().sort((a, b) => a.prijs - b.prijs); const kan = L.filter(o => Math.round(o.prijs * 100) <= pot); return { kan, volgende: L.find(o => Math.round(o.prijs * 100) > pot) || null, goedkoopst: L[0] || null }; }

// ---------- mails ----------
const BEREIK = 'Vragen? Antwoord op deze mail, of app of bel +31 6 55395630.';
const voet = (c, p) => `${esc(KADOLY_BEDRIJF)}<br>${BEREIK}<br>Elke ochtend één mail. <a href="${u(c, 'dkregels')}" style="color:#0B0D12">Voorwaarden</a>${p ? ` · <a href="${u(c, 'dkaf', '&t=' + p.af)}" style="color:#0B0D12">Afmelden met één klik</a>` : ''}`;
export function mailBevestig(url) {
  return mailSchil({ titel: 'Bevestig je Spaarpot', voorkop: `Eén klik en je spaarpot staat klaar, al gevuld met ${ct(R.start)}.`,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Bevestig je Spaarpot</h1><p style="margin:0 0 20px">Klik op de knop en je pot staat klaar, met ${ct(R.start)} erin. Elke dag dat je klikt, komt er tegoed bij. Klikken je vrienden, dan spaar jij mee. Is je pot genoeg, dan kies je een cadeau en sturen wij het gratis op.</p><p style="margin:0 0 22px">${knop(url, 'Start mijn Spaarpot')}</p><p style="margin:0">Heb je je niet aangemeld? Dan hoef je niets te doen. Zonder bevestiging krijg je niets van ons.</p>`,
    voet: esc(KADOLY_BEDRIJF) + '<br>' + BEREIK });
}
export function mailDag(c, p, { D, doelTekst = '', k = null }) {
  const nv = k ? k.v1.size : 0, g = vanGisteren(p, D);
  const reeks = p.laatste === plusDag(D, -1) ? N(p.reeks) : 0, bonus = reeks && (reeks + 1) % R.reeksElke === 0 ? ` Vandaag is dag ${reeks + 1} op rij: dan krijg je er ${ct(R.reeksBonus)} bij.` : '';
  const kop = nv ? `Samen gespaard: ${ct(N(p.pot) + k.vriendenPot)}` : `Je pot: ${ct(p.pot)}`;
  const gist = g ? `Gisteren klikten ${g.n} ${g.n === 1 ? 'vriend' : 'vrienden'} voor je: +${ct(g.c)} in jouw pot.` : '';
  const stand = ((nv ? `Jouw pot: ${ct(p.pot)}. ` : '') + doelTekst).trim();
  const onder = nv ? `Jij krijgt ${ct(R.tik)} en ${nv === 1 ? 'je vriend krijgt' : 'je ' + nv + ' vrienden krijgen elk'} ${ct(R.vriend)}.${bonus}` : `Er komt ${ct(R.tik)} in je pot.${bonus} Nodig een vriend uit, dan klikken jullie voor elkaar.`;
  const P = t => t ? `<p style="margin:0 0 14px">${esc(t)}</p>` : '';
  return mailSchil({ titel: 'Je Spaarpot', voorkop: gist || onder,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">${esc(kop)}</h1>${P(gist)}${P(stand)}<p style="margin:6px 0 12px">${knop(u(c, 'dkt', '&k=' + p.link), nv ? 'Klik voor je vrienden' : 'Klik voor vandaag')}</p><p style="margin:0">${esc(onder)}</p>`,
    voet: voet(c, p) });
}
const lijstKop = (c, p) => ({ 'List-Unsubscribe': `<${u(c, 'dkaf', '&t=' + p.af)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });

// ---------- dagronde: vriendentegoed van gisteren en de dagmail ----------
export async function ronde(c, { mail = true } = {}) {
  const D = await vandaag(c), uit = { D, mails: 0, rust: 0 };
  if (!(await aanStaat(c))) return { ...uit, uit: 'niet aan' };
  if (c.test) { let n = 0; for (const id of await smem(c.ns + 'emails')) { const p = await lees(c, id); if (p && p.actief && nep(p.email) && p.van) { await tik(c, p, D); n++; } } uit.testvrienden = n; } // testvrienden tikken elke dag
  if (!mail) return uit;
  const L = (await cadeaus()).slice().sort((a, b) => a.prijs - b.prijs), batch = [];
  for (const id of await smem(c.ns + 'emails')) { const p = await lees(c, id); if (!p || !p.actief || nep(p.email)) continue;
    const laatst = p.laatste || amsDag(N(p.bevestigd)); if (laatst < plusDag(D, -R.rustNa)) { if (!p.rust) { p.rust = true; await bewaar(c, p); } uit.rust++; continue; }
    const k = await kring(c, id, p), pot = N(p.pot), kan = L.some(o => Math.round(o.prijs * 100) <= pot), vlg = L.find(o => Math.round(o.prijs * 100) > pot);
    const doelTekst = kan ? 'Je pot is genoeg voor een cadeau: kies het op je pagina.' : vlg ? `Nog ${ct(Math.round(vlg.prijs * 100) - pot)}, dan kies je ${vlg.naam} gratis.` : '';
    batch.push({ to: [p.email], subject: (c.test ? '[TEST] ' : '') + (k.v1.size ? `Samen gespaard: ${ct(pot + k.vriendenPot)} · klik voor je vrienden` : `Je pot: ${ct(pot)} · klik voor vandaag`), html: mailDag(c, p, { D, doelTekst, k }), headers: lijstKop(c, p) }); }
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
  await bewaar(c, p); await kv.set(c.ns + 'adres:' + p.id + ':' + D, a, { ex: 60 * 86400 }); await tel(c, 'cadeau'); await tel(c, 'cadeaucent', prijs);
  try { await mailHenkjan({ subject: (c.test ? '[TEST] ' : '') + 'Spaarpot: bestel ' + keuze.naam + ' voor ' + a.voornaam, html: mailSchil({ titel: 'Spaarpot: bestellen', voorkop: keuze.naam, inhoud: `<h1 style="font-size:22px;margin:0 0 12px">Spaarpot-cadeau: graag bestellen</h1><p style="margin:0 0 6px"><b>Product:</b> ${esc(keuze.naam)} (${euro(keuze.prijs)} incl. verzending, ${keuze.lt} ${keuze.lt === 1 ? 'werkdag' : 'werkdagen'})<br><a href="https://kadoly.com/product/${encodeURIComponent(keuze.pid)}">kadoly.com/product/${esc(keuze.pid)}</a></p><p style="margin:12px 0 0"><b>Sturen naar:</b><br>${esc(a.voornaam)} ${esc(a.achternaam)}<br>${esc(a.adres)}<br>${esc(a.postcode)} ${esc(a.plaats)}<br>${esc(p.email)}</p><p style="margin:12px 0 0">Gespaard in ${N(p.dagen)} ${N(p.dagen) === 1 ? 'dag' : 'dagen'}. Pot na deze keuze: ${ct(p.pot)}.</p>`, voet: esc(KADOLY_BEDRIJF) }), replyTo: p.email }); } catch (e) {}
  return { ok: true, keuze };
}

// ---------- pagina's ----------
export const CSS = `<style>.dk-k{border:1px solid var(--line-strong);border-radius:16px;padding:16px 18px;margin:0 0 16px}.dk-k h2{margin:0 0 8px;font-size:24px}.dk-w{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc-2)}.dk-b{height:12px;border-radius:6px;background:var(--acc-2);overflow:hidden;margin:10px 0 8px}.dk-b i{display:block;height:100%;background:var(--acc);border-radius:6px}.dk-p{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.dk-top{display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:center;text-decoration:none;color:inherit;margin:0 0 10px}.dk-top img{width:96px;height:96px;object-fit:cover;border-radius:12px}.dk-p a{display:block;text-decoration:none;color:inherit}.dk-p img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;display:block;margin:0 0 6px}.dk-f{display:grid;gap:10px;max-width:520px}.dk-f input[type=email],.dk-f input[type=text]{min-height:48px;border:1px solid var(--line-strong);border-radius:12px;padding:10px 12px;font:inherit;background:var(--bg);color:var(--ink)}.dk-f label.vk{display:flex;gap:10px;align-items:flex-start}.dk-f label.vk input{width:20px;height:20px;accent-color:#1D9BF0;flex:none;margin-top:2px}.dk-t{border:2px dashed #1D9BF0;border-radius:16px;padding:14px 16px;margin:0 0 18px}.dk-t a{margin:0 8px 8px 0}.dk-o{display:grid;gap:10px;margin:0 0 18px}.dk-o label{display:flex;gap:12px;align-items:center;border:1px solid var(--line-strong);border-radius:14px;padding:10px 12px;cursor:pointer}.dk-o label:has(input:checked){border-color:var(--acc);box-shadow:0 0 0 2px var(--acc-2)}.dk-o img{width:56px;height:56px;border-radius:10px;object-fit:cover;flex:none}.dk-o input{accent-color:#1D9BF0;width:20px;height:20px;flex:none}</style>`;
export function testBalk(c, D, p) {
  if (!c.test) return '';
  const a = (actie, tekst, extra = '') => `<a class="btn deel" href="${u(c, 'dktest', '&actie=' + actie + (p ? '&k=' + p.link : '') + extra)}">${esc(tekst)}</a>`;
  return `<div class="dk-t"><p><b>Testwereld</b> · testdag ${esc(datumNl(D))}. Niets hiervan raakt echte deelnemers. Mails krijgen [TEST] in het onderwerp.</p>${p ? '' : a('maak', 'Snel een testdeelnemer zonder mail')}${a('volgende', 'Volgende dag (vrienden klikken + ochtendmail)')}${a('volgende', 'Volgende dag zonder mail', '&mail=0')}${p ? a('vrienden', 'Maak 4 testvrienden', '&n=4') + a('reeks', 'Zet mijn reeks op 9', '&n=9') + a('pot', 'Zet €10 in mijn pot', '&n=1000') : ''}<a class="btn deel" href="${u(c, 'dkmails', p ? '&k=' + p.link : '')}">Bekijk de mails</a>${a('lijst', 'Alle testdeelnemers')}${a('wis', 'Alles wissen')}</div>`;
}
export function aanmeldBlok(c, v) {
  return `<form class="dk-f" id="dkf"><input type="email" name="email" required placeholder="Je e-mailadres" aria-label="Je e-mailadres" autocomplete="email"><input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><label class="vk"><input type="checkbox" name="oud" value="1" required><span>Ik ben 18 jaar of ouder en woon in Nederland.</span></label><button class="btn knop" type="submit">Start mijn Spaarpot</button><p class="meta" id="dko" role="status"></p></form>
<script>(function(){var f=document.getElementById('dkf'),o=document.getElementById('dko'),t0=Date.now();f.addEventListener('submit',function(e){e.preventDefault();o.textContent='Even geduld…';fetch(${JSON.stringify(u(c, 'dkaanmelden'))},{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:f.email.value,oud:f.oud.checked,website:f.website.value,ms:Date.now()-t0,v:${JSON.stringify(v || '')}})}).then(function(r){return r.json()}).then(function(j){o.textContent=j&&j.ok?'Bijna klaar: bevestig via de mail die we je net stuurden.':((j&&j.fout)||'Dat lukte even niet.')})['catch'](function(){o.textContent='Dat lukte even niet.'})})})();</script>`;
}
export function uitlegHtml() {
  return `<dl class="rows"><div class="r"><dt>Je start</dt><dd>Bij je aanmelding staat er meteen ${ct(R.start)} in je pot.</dd></div><div class="r"><dt>Elke dag</dt><dd>Je krijgt elke ochtend één mail. Eén klik en er komt ${ct(R.tik)} in je pot. Elke 10e dag op rij ${ct(R.reeksBonus)} extra.</dd></div><div class="r"><dt>Samen</dt><dd>Nodig vrienden uit met je eigen link. Klikt een vriend, dan krijg jij ${ct(R.vriend)}. Klik jij, dan krijgt elke vriend ${ct(R.vriend)}. Jij klikt voor hen, zij klikken voor jou.</dd></div><div class="r"><dt>Je cadeau</dt><dd>Is je pot genoeg, dan kies je een cadeau tot ${euro(R.prijsMax)}. Wij sturen het gratis op. Geen loting: wat je spaart, is van jou.</dd></div></dl>`;
}
export async function dagHtml(c, p, D, bovenaan = '') {
  const k = await kring(c, p.id, p), d = await doel(N(p.pot)), nv = k.v1.size, vandaagBij = (p.log || []).filter(x => x.D === D && x.c > 0);
  const gaf = p.gaf && p.gaf.D === D ? N(p.gaf.n) : 0, kreeg = p.samen && p.samen.D === D && p.samen.c ? p.samen : null, gist = vanGisteren(p, D);
  const wie = n => `${n} ${n === 1 ? 'vriend' : 'vrienden'}`, pl = x => `https://kadoly.com/product/${encodeURIComponent(x.pid)}?utm_source=spaarpot&amp;utm_medium=dagpagina`;
  const blokken = [];
  if (p.vervallen && p.vervallen.D === D) blokken.push(`<div class="dk-k"><p>Je vorige pot van ${ct(p.vervallen.c)} is vervallen, omdat je ${R.vervalNa} dagen niet klikte. Vanaf vandaag spaar je opnieuw.</p></div>`);
  const regels = [vandaagBij.some(x => x.w === 'start') ? `+${ct(R.start)} startpot.` : '',
    vandaagBij.some(x => x.w === 'tik') ? `+${ct(R.tik)} voor je klik${gaf ? `, en je klik gaf ${gaf === 1 ? 'je vriend' : wie(gaf) + ' elk'} ${ct(R.vriend)}` : ''}.` : '',
    vandaagBij.some(x => x.w === 'reeks') ? `+${ct(R.reeksBonus)} voor ${p.reeks} dagen op rij.` : '',
    kreeg ? `+${ct(kreeg.c)}, want ${wie(kreeg.n)} ${kreeg.n === 1 ? 'klikte' : 'klikten'} vandaag voor je.` : '',
    gist ? `Gisteren klikten ${wie(gist.n)} voor je: +${ct(gist.c)}.` : ''].filter(Boolean);
  const tot = R.reeksElke - (N(p.reeks) % R.reeksElke);
  blokken.push(`<div class="dk-k"><h2>${nv ? `Samen gespaard: ${ct(N(p.pot) + k.vriendenPot)}` : 'Vandaag'}</h2>${regels.map(r => `<p>${esc(r)}</p>`).join('')}<p>Dag ${N(p.reeks)} op rij. ${tot === R.reeksElke ? `Over ${R.reeksElke} dagen` : tot === 1 ? 'Morgen' : `Over ${tot} dagen`} krijg je ${ct(R.reeksBonus)} extra.</p></div>`);
  if (d.kan.length) blokken.push(`<div class="dk-k dk-w"><h2>Je pot is genoeg voor een cadeau</h2><p>Je kunt kiezen uit ${d.kan.length} ${d.kan.length === 1 ? 'cadeau' : 'cadeaus'}. Wij sturen het gratis op, binnen 3 werkdagen thuis. Sparen voor iets groters mag ook.</p><p><a class="btn knop" href="${u(c, 'dkkies', '&k=' + p.link)}">Kies je cadeau</a></p></div>`);
  const pr = await dagProducten(D);
  if (pr.length) { const [a, ...rest] = pr; blokken.push(`<div class="dk-k"><h2>Cadeau-idee van vandaag</h2><a class="dk-top" href="${pl(a)}"><img src="${esc(a.img)}" alt="" loading="lazy"><span>${esc(a.naam)}<br><b>${euro(a.prijs)}</b> · ${a.lt} ${a.lt === 1 ? 'werkdag' : 'werkdagen'}</span></a><p><a class="btn knop" href="${pl(a)}">Bekijk bij Kadoly</a></p>${rest.length ? `<div class="dk-p">${rest.map(x => `<a href="${pl(x)}"><img src="${esc(x.img)}" alt="" loading="lazy">${esc(x.naam)}<br><b>${euro(x.prijs)}</b></a>`).join('')}</div>` : ''}</div>`); }
  if (!d.kan.length && d.volgende) { const doelC = Math.round(d.volgende.prijs * 100); blokken.push(`<div class="dk-k"><h2>Nog ${ct(doelC - N(p.pot))}</h2><div class="dk-b" aria-hidden="true"><i style="width:${Math.max(3, Math.min(100, Math.round(N(p.pot) / doelC * 100)))}%"></i></div><p>Dan kies je ${esc(d.volgende.naam)} gratis.</p></div>`); }
  const deelUrl = u(c, 'dk', '&v=' + p.code), deelTekst = `Doe je mee met de Kadoly Spaarpot? Je pot start gevuld. Klik jij, dan krijg ik ${ct(R.vriend)}. Klik ik, dan krijg jij ${ct(R.vriend)}. Zo sparen we samen voor een gratis cadeau. ${deelUrl}`;
  const onderweg = k.onderweg ? ` ${k.onderweg === 1 ? '1 vriend telt' : k.onderweg + ' vrienden tellen'} mee na 3 dagen klikken.` : '';
  blokken.push(`<div class="dk-k"><h2>Samen sparen</h2><p>${nv ? `Je spaart samen met ${wie(nv)}. Jij klikt voor hen, zij klikken voor jou.` : `Nodig een vriend uit. Klikt hij, dan krijg jij ${ct(R.vriend)}. Klik jij, dan krijgt hij ${ct(R.vriend)}.`}${onderweg}</p><p><a class="btn knop" href="https://wa.me/?text=${encodeURIComponent(deelTekst)}" target="_blank" rel="noopener">Deel via WhatsApp</a></p><p class="meta">Je eigen link: ${esc(deelUrl)}</p></div>`);
  return `<p class="kicker">${esc(R.naam)} · ${esc(datumNl(D))}</p><h1>Je pot: ${ct(p.pot)}</h1>${bovenaan}${blokken.join('')}<p class="meta"><a href="${u(c, 'dkregels')}">Voorwaarden</a> · <a href="${u(c, 'dkaf', '&t=' + p.af)}">Afmelden</a></p>`;
}
export const VOORWAARDEN = () => `<p class="kicker">${esc(R.naam)}</p><h1>Voorwaarden ${esc(R.naam)}</h1><dl class="rows">
<div class="r"><dt>Organisator</dt><dd>ADSFAIR B.V. (Kadoly Shop), Albert Plesmanplein 20, 2805 AB Gouda, KVK 60126035.</dd></div>
<div class="r"><dt>Wat het is</dt><dd>Een spaarpot met tegoed voor een gratis cadeau van Kadoly. Geen loterij en geen kansspel: wat je spaart, is van jou.</dd></div>
<div class="r"><dt>Meedoen</dt><dd>Gratis, zonder aankoop. Voor iedereen van 18 jaar of ouder met een woonadres in Nederland, met één bevestigd e-mailadres per persoon.</dd></div>
<div class="r"><dt>Sparen</dt><dd>Bij je aanmelding: ${ct(R.start)} startpot, één keer per persoon. Elke dag dat je op de link in je ochtendmail klikt: ${ct(R.tik)}. Elke 10e dag op rij: ${ct(R.reeksBonus)} extra. Vrienden zijn wie jou uitnodigde en wie jij uitnodigde; een vriend telt mee als hij zich via een eigen link aanmeldt en op 3 dagen klikt. Klikt een vriend, dan krijg jij direct ${ct(R.vriend)}; klik jij, dan krijgt elke vriend ${ct(R.vriend)}. Van vrienden samen krijg je hooguit ${ct(R.vriendMax)} per dag. Je pot is hooguit ${ct(R.potMax)}.</dd></div>
<div class="r"><dt>Je cadeau</dt><dd>Zodra je pot genoeg is, kies je een cadeau uit de selectie van Kadoly, tot ${euro(R.prijsMax)} inclusief verzending, binnen 3 werkdagen gratis thuisbezorgd in Nederland. Het bedrag gaat van je pot af. Tegoed is niet in te wisselen voor geld en niet over te dragen. We vragen nooit om bankgegevens of een betaling.</dd></div>
<div class="r"><dt>Vervallen</dt><dd>Klik je ${R.rustNa} dagen niet, dan sturen we geen ochtendmail meer; je link blijft werken. Klik je ${R.vervalNa} dagen niet, dan vervalt je pot, ook wat vrienden voor je spaarden.</dd></div>
<div class="r"><dt>Eerlijk</dt><dd>Je deelt je link zelf, alleen met mensen die je kent. Kadoly stuurt nooit berichten naar je vrienden. Nepadressen of meerdere adressen van één persoon tellen niet mee; dan vervalt het tegoed.</dd></div>
<div class="r"><dt>Wijzigen</dt><dd>Passen we de bedragen aan of stoppen we de Spaarpot, dan melden we dat minstens 30 dagen vooraf. Wat al in je pot zit, kun je tot het einde gebruiken.</dd></div>
<div class="r"><dt>Privacy</dt><dd>We gebruiken je e-mailadres alleen voor de Spaarpot en wissen het uiterlijk 60 dagen nadat je je afmeldt. Je bezorgadres gebruiken we alleen voor je cadeau en wissen we binnen 60 dagen. Afmelden kan met één klik onder elke mail. Zie ook het <a href="https://kadoly.com/privacy">privacybeleid</a>.</dd></div>
<div class="r"><dt>Vragen</dt><dd>Antwoord op een mail van de Spaarpot, dan krijg je binnen 2 werkdagen antwoord van een mens.</dd></div></dl>`;

// ---------- testhulp ----------
async function maakTest(c, { email, van = '', reeks = 0, dag = '' } = {}) {
  const s = await maak(c, { id: idVan(email), email, van }); s.reeks = reeks; s.dagen = reeks; s.laatste = reeks ? dag : '';
  if (van && s.dagen >= R.vriendDagen) { s.act = true; await kv.raw(['SADD', c.ns + 'act:' + van, s.id]); }
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
  const pagina = (code, titel, inhoud, script, p = p0) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(code).send(kaal(titel, CSS + testBalk(c, D, p) + inhoud, script)); };
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
    return res.status(200).json({ ok: true, wereld: c.test ? 'test' : 'live', aan: await aanStaat(c), vandaag: D, deelnemers: n, tegoedInPotten: ct(potten), tel }); }
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
    try { return res.status(200).json(await aanmelden(c, await leesBody(req), ip)); } catch (e) { console.error('dk aanmelden', String(e && e.message || e).slice(0, 160)); return res.status(503).json({ ok: false, fout: 'Dat lukte even niet. Probeer het zo nog eens.' }); } }
  if (op === 'dk') { const v = String(q.get('v') || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8); const uitgenodigd = v && (await kv.get(c.ns + 'code:' + v).catch(() => null));
    return pagina(200, R.naam, `${kop}<h1>Start met een gevulde spaarpot</h1><p>${uitgenodigd ? `<b>Een vriend nodigde je uit.</b> Klik jij, dan krijgt hij ${ct(R.vriend)}. Klikt hij, dan krijg jij ${ct(R.vriend)}. ` : ''}Meld je aan en er staat meteen ${ct(R.start)} in je pot. Eén klik per dag op de link in je ochtendmail, en hij groeit. Is hij genoeg, dan kies je een cadeau en sturen wij het gratis op. Geen loting: wat je spaart, is van jou.</p>${aanmeldBlok(c, uitgenodigd ? v : '')}${uitlegHtml()}<p class="meta">${voorw} · 18+ · Kadoly Shop</p>`); }
  if (op === 'dkbevestig') { const t = String(q.get('t') || ''); const ongeldig = () => pagina(400, 'Deze link werkt niet meer', `${kop}<h1>Deze link werkt niet meer</h1><p>Een bevestigingslink is twee dagen geldig. Meld je gerust opnieuw aan.</p><p><a class="btn knop" href="${u(c, 'dk')}">Opnieuw aanmelden</a></p>`, '', null);
    if (req.method === 'POST') { const s = await bevestig(c, t); if (!s) return ongeldig(); await tik(c, s, D); return naar(u(c, 'dkt', '&k=' + s.link + '&nieuw=1')); }
    const pd = /^[a-f0-9]{48}$/.test(t) ? await kv.get(c.ns + 'pending:' + h(t)) : null; if (!pd) return ongeldig();
    if (pd.klaar) { const s = await lees(c, pd.id); if (s && s.actief) return naar(u(c, 'dkt', '&k=' + s.link)); return ongeldig(); }
    return pagina(200, 'Bevestig je Spaarpot', `${kop}<h1>Nog één klik</h1><p>Bevestig je Spaarpot voor <b>${esc(pd.email)}</b>.</p><form method="post" action="${u(c, 'dkbevestig', '&t=' + t)}" id="dkb"><button class="btn knop" type="submit">Start mijn Spaarpot</button></form>`, '<script>setTimeout(function(){if(document.visibilityState==="visible"){var f=document.getElementById("dkb");f.querySelector("button").disabled=true;f.submit()}},400)</script>', null); }
  if (op === 'dkt') { const p = p0; if (!p) return geenLink();
    if (!p.actief) return pagina(200, 'Je bent afgemeld', `${kop}<h1>Je bent afgemeld</h1><p>Je krijgt geen mail meer van de Spaarpot. Je pot van ${ct(p.pot)} blijft nog ${R.vervalNa} dagen na je laatste klik staan.</p><form method="post" action="${u(c, 'dkaf', '&t=' + p.af + '&weer=1')}"><button class="btn deel" type="submit">Meld me weer aan</button></form>`, '', null);
    if (req.method === 'POST') { if (!vanHier()) return res.status(403).send('Niet toegestaan'); await tik(c, p, D); return naar(u(c, 'dkt', '&k=' + p.link)); }
    if (p.laatste !== D) return pagina(200, 'Klik voor vandaag', `${kop}<h1>Klik voor vandaag</h1><p>Eén klik en er komt ${ct(R.tik)} in je pot.</p><form method="post" action="${u(c, 'dkt', '&k=' + p.link)}" id="dkf2"><button class="btn knop" type="submit">Klik voor vandaag</button></form>`, isBot(ua) ? '' : '<script>setTimeout(function(){if(document.visibilityState==="visible"){var f=document.getElementById("dkf2");f.querySelector("button").disabled=true;f.submit()}},300)</script>');
    return pagina(200, R.naam, await dagHtml(c, p, D, q.get('nieuw') === '1' ? '<div class="dk-k dk-w"><h2>Gelukt, je pot staat klaar</h2><p>Vanaf morgen krijg je elke ochtend één mail met je eigen link. Je eerste klik telt al.</p></div>' : '')); }
  if (op === 'dkaf') { const t = String(q.get('t') || ''), weer = q.get('weer') === '1';
    if (req.method === 'POST' && !weer) { await afmelden(c, t); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('Afgemeld'); } // één klik vanuit de mailapp
    const terug = req.method === 'POST' && weer; const s = await afmelden(c, t, terug);
    if (!s) return pagina(400, 'Deze afmeldlink werkt niet', `${kop}<h1>Deze afmeldlink werkt niet</h1><p>Antwoord op een mail van de Spaarpot, dan melden we je met de hand af. Dat doen we dezelfde dag.</p>`, '', null);
    if (terug) return naar(u(c, 'dkt', '&k=' + s.link));
    return pagina(200, 'Je bent afgemeld', `${kop}<h1>Je bent afgemeld</h1><p><b>${esc(s.email)}</b> krijgt geen mail meer van de Spaarpot. Eén klik was genoeg.</p><form method="post" action="${u(c, 'dkaf', '&t=' + t + '&weer=1')}"><button class="btn deel" type="submit">Per ongeluk? Meld me weer aan</button></form>`, '', null); }
  if (op === 'dkkies') { const p = p0; if (!p || !p.actief) return geenLink();
    if (req.method === 'POST') { if (!vanHier()) return res.status(403).send('Niet toegestaan'); const r = await kies(c, p, await leesBody(req), D);
      if (r.fout) return pagina(400, 'Nog niet compleet', `${kop}<h1>Nog niet compleet</h1><p>${esc(r.fout)}</p><p><a class="btn knop" href="${u(c, 'dkkies', '&k=' + p.link)}">Terug</a></p>`);
      return pagina(200, 'Je cadeau komt eraan', `${kop}<h1>Top, je cadeau komt eraan</h1><p>Je koos <b>${esc(r.keuze.naam)}</b>. We bestellen het voor je en het is binnen 3 werkdagen gratis bij je thuis. Je adres gebruiken we alleen hiervoor en we wissen het binnen 60 dagen.</p><p>In je pot staat nu ${ct(p.pot)}. Je spaart gewoon door.</p><p><a class="btn knop" href="${u(c, 'dkt', '&k=' + p.link)}">Naar mijn pot</a></p>`); }
    const d = await doel(N(p.pot));
    if (!d.kan.length) return pagina(200, 'Nog even sparen', `${kop}<h1>Nog even sparen</h1><p>${d.volgende ? `Nog ${ct(Math.round(d.volgende.prijs * 100) - N(p.pot))}, dan kies je ${esc(d.volgende.naam)} gratis.` : 'Er is nu even geen cadeau beschikbaar.'}</p><p><a class="btn knop" href="${u(c, 'dkt', '&k=' + p.link)}">Naar mijn pot</a></p>`);
    const L = d.kan.slice().sort((a, b) => b.prijs - a.prijs);
    return pagina(200, 'Kies je cadeau', `${kop}<h1>Kies je cadeau</h1><p>In je pot: ${ct(p.pot)}. Kies één cadeau; het bedrag gaat van je pot af en wij sturen het gratis op, binnen 3 werkdagen thuis. Je betaalt niets en we vragen nooit om bankgegevens.</p>
<form class="dk-f" method="post" action="${u(c, 'dkkies', '&k=' + p.link)}" style="max-width:none"><div class="dk-o" role="radiogroup" aria-label="Kies je cadeau">${L.map((o, i) => `<label><input type="radio" name="pid" value="${esc(o.pid)}"${i === 0 ? ' required' : ''}><img src="${esc(o.img)}" alt="" loading="lazy" width="56" height="56"><span>${esc(o.naam)}<br><b>${euro(o.prijs)}</b> · ${o.lt} ${o.lt === 1 ? 'werkdag' : 'werkdagen'}</span></label>`).join('')}</div>
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
