// Samen sparen bij Kadoly. Model van 22-23 nov 2026 (Henkjan): "Geven van zegels met een link en zo geconnect sparen 1 zegel per aan koop",
// "Alles geeft een zegel . Retouren etc wel id gaten houden", "ze tellen meteen", "En kost pas als er werkelijke aankoopt wodr gedaan",
// "Dus je kunt iemand een of twee zegels geven dat gaan we testen . En je kunt kaarten blijven sparen kaart 1 is al een cadeau gratis",
// "je moet dus hele keten meten" en "De bijvangst van branding en attenderen ... moeten we allemaal meenemen in dit model".
//
// Spelregels (zo staan ze ook op elke pagina, SPELREGELS hieronder):
// 1. Deel je link. Wie via jouw link koopt, spaart voor altijd met jou mee.
// 2. Elke aankoop geeft meteen 1 zegel aan de koper en 1 aan wie hem uitnodigde. Een club of site krijgt €2 in plaats van een zegel.
// 3. Een kaart is 5 zegels. Elk cadeau in de winkel kost een aantal kaarten. Neem nu een cadeau, of spaar door voor iets groters.
// 4. Elke zegel die je krijgt, mag je 1 keer doorgeven. Wie hem op tijd pakt, begint met een zegel van jou.
// 5. Stuur je iets terug, dan gaat de zegel van die bestelling eraf.
// 6. Zegels blijven 6 maanden geldig na je laatste zegel; daarna 3 weken om een cadeau te kiezen of iets te bestellen.
// 7. Hooguit 2 cadeauzegels per kaart; de rest spaar je met aankopen.
//
// Geld: een zegel staat voor R.zegelEur (standaard €2) aan cadeaukosten. Een cadeau kost zoveel kaarten als het ons kost (inkoop met btw plus
// verzending, zegelsNodig) gedeeld door 5 x R.zegelEur, naar boven. Het kost ons pas iets als er echt gekocht is: zegels komen alleen bij een
// betaalde bestelling, en geld gaat pas weg als een volle kaart een cadeau wordt (of een club €2 krijgt). Henkjan accepteert dat een aankoop
// met weinig marge meer kost dan hij oplevert; de kettingmeter (ssKetting) meet per keten wat het oplevert tegen een controlegroep (10% van
// de kopers zonder kaart krijgt geen zegel) en telt de bijvangst mee (echte bezoekers via gedeelde links x R.bezoekEur). Is de keten
// negatief, dan gaat R.zegelEur stap voor stap omhoog (een cadeau kost dan meer kaarten); loopt het goed, dan weer omlaag.
//
// Drempelzoeker: R.armen (1 of 2 cadeauzegels bij doorgeven) en R.dagen (3, 7 of 21 dagen om de zegel te pakken), willekeurig per lid; meting
// per aanbod in ss:niv. Steeds één ding tegelijk testen (Henkjan). Instellen op de beschermde host met op=ss&zet=1.
// Alles gebeurt in de controle van de datapagina van de shop (fn/shop.js haalFeed, elk uur), één keer per bestelling (ss:ord); retour haalt
// de zegel eraf (is hij al ingewisseld, dan staat de kaart één zegel achter: m.schuld). Concept tot LIVE = true.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';

export const LIVE = false;
export const KAART = 5;
const GRATIS_PER_KAART = 2, GELDIG_DAGEN = 182, AFLOOP_DAGEN = 21, LOS_DAGEN = 60, CADEAU_MAX = 2, UITNODIG_DOEL = 3;
const REGELS0 = { zelf: 1, armen: [1, 2], dagen: [7], zegelEur: 2, bezoekEur: 0.2, ctrlPct: 10 };
export const SPELREGELS = [
  'Deel je link. Wie via jouw link koopt, spaart voor altijd met jou mee.',
  'Elke aankoop geeft meteen 1 zegel aan de koper en 1 aan wie hem uitnodigde. Een club of site krijgt €2 in plaats van een zegel.',
  'Een kaart is 5 zegels. Elk cadeau in de winkel kost een aantal kaarten. Neem nu een cadeau, of spaar door voor iets groters.',
  'Elke zegel die je krijgt, mag je 1 keer doorgeven. Wie hem op tijd pakt, begint met een zegel van jou.',
  'Stuur je iets terug, dan gaat de zegel van die bestelling eraf.',
  'Zegels blijven 6 maanden geldig na je laatste zegel. Daarna heb je 3 weken om een cadeau te kiezen of iets te bestellen.',
  'Hooguit 2 cadeauzegels per kaart. De rest spaar je met aankopen, van jezelf of van wie jij uitnodigde.'];
const BASE = () => (LIVE ? 'https://gids.kadoly.com' : 'https://hjdk-api-henq.vercel.app') + '/api/gids?op=ss';
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const h = s => createHash('sha256').update(String(s)).digest('hex');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = x => '€' + (Math.round(N(x) * 100) / 100).toFixed(2).replace('.', ',').replace(',00', '');
const schoon = (v, n) => String(v || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const dagNL = (t = Date.now()) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
const datum = t => new Date(t).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' });
const zt = n => n === 1 ? '1 zegel' : n + ' zegels';
const kt = n => n === 1 ? '1 kaart' : n + ' kaarten';
async function tel(wat, n = 1) { try { const k = 'ss:tel:' + dagNL(); await kv.raw(['HINCRBY', k, wat, String(Math.round(n))]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); } catch (e) {} }
async function telNiv(L, wat, n = 1) { if (!L) return; try { await kv.raw(['HINCRBY', 'ss:niv', L + '|' + wat, String(n)]); } catch (e) {} }
async function hash(k) { const a = await kv.raw(['HGETALL', k]).catch(() => []); const o = {}; for (let j = 0; j + 1 < (a || []).length; j += 2) o[a[j]] = N(a[j + 1]); return o; }
async function cat() { let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {} const m = {}; for (const i of (c && c.items) || []) if (i && i.id) m[i.id] = i; return m; }
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
const item = (C, pid) => C[pid] || C[String(pid || '').split('-').slice(0, 2).join('-')] || C[String(pid || '').split('-')[0]] || null;
const lees = async k => { try { return await kv.get(k); } catch (e) { return null; } };
const zet = (k, v) => kv.set(k, v, { ex: 400 * 86400 }).catch(() => {});
// wat een cadeau ons kost (euro, naar boven): inkoop met btw plus verzending = prijs en verzending van de klant min de marge met btw
export const zegelsNodig = i => Math.max(1, Math.ceil(i && i.mg != null ? thuis(i) - N(i.mg) * 1.21 : thuis(i || {})));
export const kaartenVoor = (i, R) => Math.max(1, Math.ceil(Math.ceil(zegelsNodig(i) / Math.max(0.5, N(R && R.zegelEur) || 2)) / KAART));

// ---------- de kaart: aankoopzegels (z.o) en cadeauzegels (z.start); hooguit 2 cadeauzegels per volle kaart ----------
export function stand(m) {
  const z = (m && m.zegels) || [], G = z.filter(x => x.start).length, A = Math.max(0, z.length - G - N(m && m.schuld));
  let k = Math.floor((A + G) / KAART); while (k > 0 && A + Math.min(G, GRATIS_PER_KAART * k) < KAART * k) k--;
  const gTelt = Math.min(G, GRATIS_PER_KAART * (k + 1)), telt = A + gTelt, rest = telt - k * KAART;
  return { A, G, kaarten: k, opKaart: rest, totaal: telt, vol: k > 0 && rest === 0, gratisOp: G > gTelt };
}
const rechten = m => Math.max(0, N(m.ontvangen != null ? m.ontvangen : (m.zegels || []).length) - N(m.gegeven));
const laatst = m => Math.max(N(m.at), ...(m.zegels || []).map(z => N(z.t)));
const geldigTot = m => laatst(m) + GELDIG_DAGEN * 864e5;
const startZegels = (n, van, soort, nu) => Array.from({ length: n }, () => ({ t: nu, van, start: soort }));
// kies je cadeau: per aantal kaarten (1 tot 5) de 3 cadeaus met de hoogste winkelprijs (meeste cadeau per kaart), op voorraad en met foto
const geenCadeau = i => i.c === 'kids' && /^(baby|kinderkamer|overig)$/.test(String(i.s || '')) || /peuter|baby|ledikant|verschoon|bedbumper|borstvoeding|slaapzak/i.test(String(i.t || ''));
export function kiesLijst(C, R, per = 3) {
  const L = Object.values(C).filter(i => i && i.mg != null && N(i.p) > 0 && i.vr !== false && i.img && !geenCadeau(i)).map(i => ({ i, k: kaartenVoor(i, R) })).filter(x => x.k <= 5);
  const uit = []; for (let k = 1; k <= 5; k++) uit.push(...L.filter(x => x.k === k).sort((a, b) => thuis(b.i) - thuis(a.i)).slice(0, per)); return uit;
}

// ---------- regels, drempelzoeker en acties ----------
export async function regels() {
  const r = await lees('ss:regels'); const R = { ...REGELS0, ...(r && typeof r === 'object' ? r : {}) };
  R.armen = (Array.isArray(R.armen) && R.armen.length ? R.armen : REGELS0.armen).map(x => Math.min(CADEAU_MAX, Math.max(1, Math.round(N(x)))));
  R.dagen = (Array.isArray(R.dagen) && R.dagen.length ? R.dagen : REGELS0.dagen).map(x => Math.min(31, Math.max(1, Math.round(N(x)))));
  R.zegelEur = Math.min(3, Math.max(1.5, N(R.zegelEur) || 2)); R.ctrlPct = Math.min(30, Math.max(0, N(R.ctrlPct))); R.bezoekEur = Math.max(0, N(R.bezoekEur));
  return R;
}
async function actieNu() { const a = await lees('ss:actie'); return a && a.naam && Date.now() < N(a.tot) ? a : null; }
// wat iemand cadeau krijgt via jouw link: { niv, dagen, L (label voor de meting), actie }
async function aanbod(m) {
  const A = await actieNu(), R = await regels();
  let niv = Math.min(CADEAU_MAX, Math.max(1, N(m && m.niv) || R.armen[0])), dagen = N(m && m.dg) || R.dagen[0], L = 'geef ' + niv + ' / ' + dagen + 'd';
  if (A) { niv = Math.min(CADEAU_MAX, Math.max(1, N(A.cadeau))); L = 'actie ' + A.naam + ' (' + niv + ')'; }
  return { niv, dagen, L, actie: A };
}
const waTekst = (link, AB, tot, met) => met
  ? `Ik geef je ${AB.niv === 1 ? 'een zegel' : AB.niv + ' zegels'} bij Kadoly. Pak ${AB.niv === 1 ? 'hem' : 'ze'} voor ${datum(tot)}, dan spaar je mee voor een gratis cadeau. ${link}`
  : `Spaar je mee bij Kadoly? Bij elke aankoop krijg je een zegel, en 5 zegels is een cadeau gratis. ${link}`;

// ---------- controlegroep en meting per koper (kettingmeter) ----------
const isCtrl = (em, R) => N(R.ctrlPct) > 0 && parseInt(String(em).slice(0, 6), 16) % 100 < N(R.ctrlPct);
const margeVan = (rg, C) => { let mg = 0, onbekend = 0; for (const r of rg || []) { const i = item(C, r.p); if (i && i.mg != null) mg += N(i.mg) * Math.max(1, Math.min(50, Math.round(N(r.n) || 1))); else onbekend++; } return { mg: Math.round(mg * 100) / 100, onbekend }; };
async function koperTel(em, groep, mg, nu, verwezen) { // per koper (ss:kop:<hash>) en per groep (ss:grp:<groep>): kopers, bestellingen, marge in centen
  if (!/^[0-9a-f]{64}$/.test(String(em || ''))) return groep; const k = 'ss:kop:' + em;
  try { await kv.raw(['HSETNX', k, 'g', groep === 'ctrl' ? '0' : '1']); const g = String(await kv.raw(['HGET', k, 'g'])) === '0' ? 'ctrl' : 'test';
    const n = N(await kv.raw(['HINCRBY', k, 'n', '1'])); await kv.raw(['HINCRBY', k, 'mgc', String(Math.round(mg * 100))]); await kv.raw(['EXPIRE', k, String(400 * 86400)]);
    if (n === 1) { await kv.raw(['HINCRBY', 'ss:grp:' + g, 'kopers', '1']); if (verwezen) await kv.raw(['HINCRBY', 'ss:grp:verwezen', 'kopers', '1']); }
    await kv.raw(['HINCRBY', 'ss:grp:' + g, 'orders', '1']); await kv.raw(['HINCRBY', 'ss:grp:' + g, 'mgc', String(Math.round(mg * 100))]);
    if (verwezen) { await kv.raw(['HINCRBY', 'ss:grp:verwezen', 'orders', '1']); await kv.raw(['HINCRBY', 'ss:grp:verwezen', 'mgc', String(Math.round(mg * 100))]); }
    return g; } catch (e) { return groep; }
}

// ---------- mail (via de Kadoly-afzender van lib/kadoly-nieuws.js) ----------
const goUrl = (m, w) => BASE() + '&go=' + w + '&m=' + m.id + '&k=' + m.k;
function balk(n, van) { const p = Math.max(2, Math.min(100, Math.round(n / Math.max(1, van) * 100))); return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1.5px solid #111113;border-radius:999px;border-collapse:separate"><tr><td width="${p}%" style="background:#111113;height:12px;border-radius:999px;font-size:0;line-height:0">&nbsp;</td><td style="font-size:0;line-height:0">&nbsp;</td></tr></table>`; }
// Henkjan 23 nov 2026: "Alle schermen simpeler !! ZO min mogelijjk op een scherm om juist duidelijker te zijn": kop, één zin, de kaart, één knop, hooguit één tekstlink
export function mailInhoud(KN, m, soort, x = {}) {
  const s = stand(m), r = rechten(m), van = esc(x.van || 'Iemand');
  const kaart = `<p style="margin:0 0 6px;font-size:24px;font-weight:700">${s.vol ? KAART : s.opKaart} van ${KAART} zegels</p>${balk(s.vol ? KAART : s.opKaart, KAART)}`;
  const link = (u, t) => `<a href="${u}" style="color:#0B0D12;font-weight:700">${t}</a>`;
  const voet = af => `Je krijgt deze mail omdat je bij Kadoly samen spaart.${af ? ` <a href="${BASE()}&af=${m.id}&t=${m.af}" style="color:#0B0D12;font-weight:700">Geen bericht meer bij een zegel</a>` : ''}<br><br>Vragen? Antwoord op deze mail, of bel of app Henkjan van Kadoly: <a href="https://wa.me/31655395630" style="color:#0B0D12;font-weight:700">06 55395630</a>.<br><br>${esc(KN.KADOLY_BEDRIJF)}`;
  // de knop: een volle kaart = cadeau kiezen, een zegel over = doorgeven, anders je kaart
  const hoofd = s.kaarten ? [goUrl(m, 'kiesk'), 'Kies je cadeau'] : r ? [goUrl(m, 'deel'), 'Geef een zegel door'] : [goUrl(m, 'kaart'), 'Open je spaarkaart'];
  const tweede = hoofd[1] === 'Open je spaarkaart' ? '' : `<p style="margin:0">${link(goUrl(m, 'kaart'), 'Open je spaarkaart')}</p>`;
  const blok = (kop, zin, voorkop, af) => KN.mailSchil({ titel: kop, voorkop, inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">${kop}</h1><p style="margin:0 0 16px">${zin}</p>${kaart}<p style="margin:0 0 14px">${KN.knop(hoofd[0], hoofd[1])}</p>${tweede}`, voet: voet(af) });
  if (soort === 'welkom') { const ns = (m.zegels || []).filter(z => z.start).length, cv = x.cadeauVan ? esc(x.cadeauVan) : '';
    return { onderwerp: cv ? `${x.cadeauVan} geeft je ${zt(ns)} bij Kadoly` : 'Je spaarkaart bij Kadoly', html: blok(`Je spaarkaart staat klaar, ${esc(m.naam)}`, `${cv ? cv + ' gaf je ' + zt(ns) + '.' : 'Je eerste zegel is cadeau.'} Elke aankoop geeft 1 zegel. 5 zegels is een gratis cadeau.`, 'Bewaar deze mail: met de knop kom je terug op je kaart.', false) }; }
  if (soort === 'afloop') return { onderwerp: 'Je zegels vervallen over 3 weken', html: blok('Je zegels vervallen over 3 weken', `Bestel voor ${datum(m.afloop)} iets bij Kadoly, dan blijft je kaart staan.`, 'Eén bestelling houdt je kaart open.', false) };
  const eigen = soort === 'eigen';
  const kop = s.vol ? 'Je kaart is vol' : eigen ? 'Je bestelling gaf 1 zegel' : `${van} kocht iets: 1 zegel voor jou`;
  const zin = s.vol ? 'Neem nu een cadeau, of spaar door voor iets groters.' : eigen ? 'Hij staat meteen op je kaart.' : `Omdat jij ${van} uitnodigde, krijg jij er ook 1.`;
  const onderwerp = s.vol ? 'Je kaart is vol: kies je cadeau' : eigen ? 'Je bestelling gaf 1 zegel' : `${x.van || 'Iemand'} kocht iets: 1 zegel voor jou`;
  return { onderwerp, html: blok(kop, zin, s.vol ? 'Kies je cadeau, of spaar door.' : `Nog ${zt(KAART - s.opKaart)} tot een volle kaart.`, true) };
}
async function mailNaar(m, soort, x = {}) {
  if (!m || !m.mail || !m.k || ((soort === 'zegel' || soort === 'eigen') && (!m.ok || m.stil)) || (soort === 'afloop' && !m.ok)) return false;
  try { const KN = await import('./kadoly-nieuws.js'); if (!(await KN.mailKlaar())) { await tel('mailNietKlaar'); return false; }
    const { onderwerp, html } = mailInhoud(KN, m, soort, x);
    const headers = soort === 'zegel' || soort === 'eigen' ? { 'List-Unsubscribe': '<' + BASE() + '&af=' + m.id + '&t=' + m.af + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined;
    await KN.stuurMails([{ to: [m.mail], subject: onderwerp, html, ...(headers ? { headers } : {}) }], 'ss-' + soort + '-' + m.id + '-' + String(x.sleutel || dagNL()).slice(0, 60));
    await tel('mail-' + soort); return true;
  } catch (e) { await tel('mailFout'); return false; }
}

// ---------- de koppeling met de winkel: vanuit de controle van de datapagina (fn/shop.js haalFeed), één keer per bestelling ----------
// regels: [{ p, n }]; klikPartner: campagne p-<code> van de klik (7 dagen); bedrag: wat de klant betaalde (0 of minder: geen zegel, bv. een gratis cadeau)
export async function ssBestelling({ em, order, t, regels: rg, klikPartner, bedrag, test = false }) { // test: doorloop van Henkjan (op=clubs&doorloop=1), telt nergens mee
  const T = test ? async () => {} : tel;
  order = String(order || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40); if (!order) return { ok: false };
  if (bedrag != null && N(bedrag) <= 0) { await T('bestelNul'); return { ok: true, zegels: 0 }; }
  const nieuw = await kv.raw(['SET', 'ss:ord:' + order, '1', 'NX', 'EX', String(200 * 86400)]).catch(() => null); if (!nieuw) return { ok: true, dubbel: true };
  const C = await cat(), R = await regels(), nu = t || Date.now(), { mg } = margeVan(rg, C); await T('bestel');
  const geldig = /^[0-9a-f]{64}$/.test(String(em || '')); const mid = geldig ? await lees('ss:em:' + em) : null; const m = mid ? await lees('ss:m:' + mid) : null;
  const kp = klikPartner && /^p-[a-z0-9-]{3,30}$/.test(klikPartner) ? klikPartner.slice(2) : '';
  const info = { koper: m ? m.id : '', door: '', pt: '', ptk: '', em: geldig ? em : '', mg, g: 'test' }; let naar = '';
  // controlegroep: alleen kopers zonder kaart en zonder uitnodiger; zij krijgen geen zegel en geen deelknop
  if (!test && !m && !kp && geldig && isCtrl(em, R)) { info.g = 'ctrl'; await koperTel(em, 'ctrl', mg, nu, false); await T('ctrlBestel');
    try { await kv.set('ss:ordinfo:' + order, info, { ex: 200 * 86400 }); } catch (e) {} return { ok: true, zegels: 0, ctrl: true }; }
  info.g = test ? 'proef' : await koperTel(em, 'test', mg, nu, !!(m && (m.door || m.pt)) || !!kp); if (test) info.test = 1;
  let Z = 0;
  if (m) {
    if (m.club && /^[a-z0-9-]{3,30}$/.test(m.club)) { info.ptk = m.club; try { const { boekBestelling } = await import('./partner.js'); await boekBestelling('p-' + m.club, { order: order + '-k', t: nu, cent: 200, v: bedrag, test }); if (!test) await kv.raw(['HINCRBY', 'ss:kost', 'partnerCent', '200']); } catch (e) {} await T('clubVanLid'); }
    else { m.zegels = (m.zegels || []).concat([{ t: nu, van: m.naam, o: order }]).slice(-600); m.ontvangen = N(m.ontvangen != null ? m.ontvangen : m.zegels.length - 1) + 1; Z = 1; await T('zegelsKoper'); }
    if (m.afloop) { m.afloop = 0; await T('afloopGered'); } await zet('ss:m:' + m.id, m); if (Z) await mailNaar(m, 'eigen', { sleutel: order });
    if (m.door) { const d = await lees('ss:m:' + m.door); if (d) { d.zegels = (d.zegels || []).concat([{ t: nu, van: m.naam, o: order }]).slice(-600); d.ontvangen = N(d.ontvangen != null ? d.ontvangen : d.zegels.length - 1) + 1; if (d.afloop) { d.afloop = 0; await T('afloopGered'); } await zet('ss:m:' + d.id, d); info.door = d.id; naar = 'lid'; await T('zegelsUitnodiger'); await telNiv(m.via, 'koop'); await mailNaar(d, 'zegel', { van: m.naam, sleutel: order }); } }
    else if (m.pt) { info.pt = m.pt; naar = 'partner'; }
  } else if (geldig) { try { await kv.raw(['RPUSH', 'ss:los:' + em, JSON.stringify({ o: order, t: nu })]); await kv.raw(['EXPIRE', 'ss:los:' + em, String(LOS_DAGEN * 86400)]); } catch (e) {} await T('zegelsLos'); Z = 1; }
  if (!info.door && !info.pt && kp) { info.pt = kp; naar = 'klikpartner'; } // precies één uitnodiger per bestelling
  if (info.pt) { try { const { boekBestelling } = await import('./partner.js'); await boekBestelling('p-' + info.pt, { order, t: nu, cent: 200, v: bedrag, test }); if (!test) await kv.raw(['HINCRBY', 'ss:kost', 'partnerCent', '200']); await T('partnerEuro', 2); } catch (e) {} }
  try { await kv.set('ss:ordinfo:' + order, info, { ex: 200 * 86400 }); if (!test) { await kv.raw(['RPUSH', 'ss:log', JSON.stringify({ t: nu, o: order, Z, naar, mg })]); await kv.raw(['LTRIM', 'ss:log', '-2000', '-1']); } } catch (e) {}
  return { ok: true, zegels: Z, naar, lid: !!m };
}
// doorloop (lib/clubwerf.js op=clubs&doorloop=1): een proefaankoop voor een lid op e-mailadres, en opruimen van de proefleden
export async function ssProefKoop(mail, order, bedrag = 25) { return ssBestelling({ em: h(String(mail || '').toLowerCase().trim()), order, bedrag, test: true, regels: [] }); }
export async function ssProefLid(mail) { const mid = await lees('ss:em:' + h(String(mail || '').toLowerCase().trim())); const m = mid ? await lees('ss:m:' + mid) : null; return m ? { id: m.id, naam: m.naam, ok: !!m.ok, stand: stand(m), uitgenodigd: (m.uitgenodigd || []).length, pt: m.pt || '', club: m.club || '', k: m.k } : null; }
export async function ssProefOpruimen(mails, orders) {
  let n = 0; for (const mail of mails || []) { const em = h(String(mail).toLowerCase().trim()), mid = await lees('ss:em:' + em); await kv.del(['ss:los:' + em]).catch(() => {}); if (mid) { const m = await lees('ss:m:' + mid); for (const d of (m && m.delen) || []) await kv.del(['ss:deel:' + d]).catch(() => {}); await kv.del(['ss:m:' + mid, 'ss:em:' + em]); await kv.raw(['SREM', 'ss:leden', mid]).catch(() => {}); n++; } }
  for (const o of orders || []) await kv.del(['ss:ord:' + o, 'ss:ordinfo:' + o, 'pt:ord:' + o, 'pt:ord:' + o + '-k']).catch(() => {});
  return n;
}
// retour of terugbetaald: de zegel van die bestelling eraf bij koper en uitnodiger (al ingewisseld: de kaart staat één zegel achter), clubgeld terug
export async function ssRetour(order) {
  order = String(order || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40); if (!order) return { ok: false };
  const info = await lees('ss:ordinfo:' + order); if (!info || info.retour) return { ok: true, niets: true };
  for (const id of [info.koper, info.door].filter(Boolean)) { const m = await lees('ss:m:' + id); if (!m) continue; const voor = (m.zegels || []).length; m.zegels = (m.zegels || []).filter(z => z.o !== order);
    if (m.zegels.length === voor && !(id === info.koper && info.ptk)) m.schuld = N(m.schuld) + 1; await zet('ss:m:' + id, m); }
  if (info.em && !info.koper) { try { const los = await kv.raw(['LRANGE', 'ss:los:' + info.em, '0', '-1']) || []; const rest = los.filter(x => { try { return JSON.parse(x).o !== order; } catch (e) { return true; } }); if (rest.length !== los.length) { await kv.raw(['DEL', 'ss:los:' + info.em]); for (const x of rest) await kv.raw(['RPUSH', 'ss:los:' + info.em, x]); if (rest.length) await kv.raw(['EXPIRE', 'ss:los:' + info.em, String(LOS_DAGEN * 86400)]); } } catch (e) {} } // nog geen spaarder: de bewaarde zegel eraf
  const pr = !!info.test; try { const { stornoBestelling } = await import('./partner.js'); if (info.pt) { await stornoBestelling(order, pr); if (!pr) await kv.raw(['HINCRBY', 'ss:kost', 'partnerCent', '-200']); } if (info.ptk) { await stornoBestelling(order + '-k', pr); if (!pr) await kv.raw(['HINCRBY', 'ss:kost', 'partnerCent', '-200']); } } catch (e) {}
  if (!pr) try { await kv.raw(['HINCRBY', 'ss:grp:' + (info.g || 'test'), 'retour', '1']); await kv.raw(['HINCRBY', 'ss:grp:' + (info.g || 'test'), 'mgc', String(-Math.round(N(info.mg) * 100))]); } catch (e) {}
  info.retour = Date.now(); await kv.set('ss:ordinfo:' + order, info, { ex: 200 * 86400 }).catch(() => {}); if (!pr) await tel('retour'); return { ok: true };
}
// inwisselen (beschermde host, door Henkjan of de chat na de vraag via WhatsApp): kaarten eraf, cadeauzegels eerst (hooguit 2 per kaart), kosten geboekt
export async function ssInwissel(mid, pid) {
  const m = /^[a-f0-9]{12}$/.test(String(mid || '')) ? await lees('ss:m:' + mid) : null; if (!m) return { ok: false, fout: 'kaart onbekend' };
  const C = await cat(), R = await regels(), i = item(C, pid); if (!i) return { ok: false, fout: 'product onbekend' };
  const k = kaartenVoor(i, R), s = stand(m); if (s.kaarten < k) return { ok: false, fout: 'te weinig volle kaarten: ' + s.kaarten + ' van ' + k };
  let gratis = Math.min(s.G, GRATIS_PER_KAART * k), aank = KAART * k - gratis; const z = [];
  for (const x of m.zegels || []) { if (x.start && gratis > 0) { gratis--; continue; } if (!x.start && aank > 0) { aank--; continue; } z.push(x); }
  m.zegels = z; m.ingewisseld = (m.ingewisseld || []).concat([{ t: Date.now(), pid: i.id, k }]).slice(-50); if (m.doel === i.id) m.doel = ''; await zet('ss:m:' + m.id, m);
  const kost = zegelsNodig(i); try { await kv.raw(['HINCRBY', 'ss:kost', 'cadeauCent', String(kost * 100)]); await kv.raw(['RPUSH', 'ss:inwissel', JSON.stringify({ t: Date.now(), m: m.id, pid: i.id, k, kost })]); } catch (e) {}
  await tel('inwissel'); await tel('inwisselKost', kost); return { ok: true, cadeau: i.t, kaarten: k, kost, over: stand(m) };
}

// ---------- kettingmeter: wat de zegels opleveren tegen wat ze kosten, met de controlegroep en de bijvangst ----------
export async function ssKetting({ open = null, nu = Date.now(), knop = true } = {}) {
  const R = await regels(), test = await hash('ss:grp:test'), ctrl = await hash('ss:grp:ctrl'), verw = await hash('ss:grp:verwezen'), kost = await hash('ss:kost');
  const som = {}; for (let i = 0; i < 60; i++) { const a = await hash('ss:tel:' + dagNL(nu - i * 864e5)); for (const [k, v] of Object.entries(a)) som[k] = N(som[k]) + v; }
  const per = g => g.kopers ? (N(g.mgc) / 100) / g.kopers : null, pT = per(test), pC = per(ctrl);
  const extra = pT != null && pC != null ? Math.round((pT - pC) * N(test.kopers) * 100) / 100 : null;
  const echteOpens = N(som.open), bijvangst = Math.round(echteOpens * R.bezoekEur * 100) / 100;
  const openZegels = open != null ? open : null; // zegels die nog op kaarten staan (uit ssRonde): kosten zodra ze een cadeau worden
  const kosten = Math.round((N(kost.cadeauCent) + N(kost.partnerCent)) / 100 * 100) / 100, verwacht = openZegels != null ? Math.round(openZegels * R.zegelEur * 100) / 100 : null;
  const zegelsUit = N(som.zegelsKoper) + N(som.zegelsUitnodiger) + N(som.zegelsLos) + N(som.cadeauzegels);
  const genoeg = N(test.kopers) >= 50 && N(ctrl.kopers) >= 10;
  const saldo = extra != null ? Math.round((extra + bijvangst - kosten - N(verwacht)) * 100) / 100 : null;
  const regel = genoeg
    ? `Zegels kosten ons ${euro(kosten)} (cadeaus en clubs) plus ${euro(verwacht || 0)} voor zegels die nog op kaarten staan. Ze brachten ${euro(extra)} extra marge tegen de controlegroep en ${echteOpens} bezoekers via gedeelde links (bij advertenties ${euro(bijvangst)}). Saldo ${euro(saldo)}.`
    : `Nog te weinig voor een oordeel: ${N(test.kopers)} van 50 kopers met zegels en ${N(ctrl.kopers)} van 10 in de controlegroep. Tot nu toe ${zegelsUit ? zt(zegelsUit) + ' gegeven, ' : ''}${echteOpens ? echteOpens + ' bezoekers via gedeelde links' : 'nog geen gedeelde links geopend'}.`;
  const uit = { at: nu, zegelEur: R.zegelEur, test, ctrl, verwezen: verw, margePerKoper: { test: pT, ctrl: pC }, extraMarge: extra, bijvangst: { bezoekers: echteOpens, waarde: bijvangst }, kosten, verwachteKosten: verwacht, saldo, regel, knop: null };
  // de knop: hooguit één stap per 7 dagen, alleen met genoeg kopers
  if (knop && genoeg && saldo != null) { const vorig = await lees('ss:knopAt'); if (!vorig || nu - N(vorig) > 7 * 864e5) {
    let nw = R.zegelEur; if (saldo < 0) nw = Math.min(3, R.zegelEur + 0.25); else if (extra + bijvangst > 1.5 * (kosten + N(verwacht))) nw = Math.max(1.5, R.zegelEur - 0.25);
    if (nw !== R.zegelEur) { const r = (await lees('ss:regels')) || {}; r.zegelEur = nw; await kv.set('ss:regels', r).catch(() => {}); await kv.set('ss:knopAt', nu).catch(() => {}); uit.knop = { van: R.zegelEur, naar: nw, waarom: saldo < 0 ? 'keten negatief' : 'keten ruim positief' };
      try { await kv.raw(['RPUSH', 'ss:knop', JSON.stringify({ t: nu, ...uit.knop, saldo })]); } catch (e) {} } } }
  await kv.set('ss:ketting', uit, { ex: 30 * 86400 }).catch(() => {}); return uit;
}

// ---------- doorrekenen: wat 1 zegel per aankoop (koper en uitnodiger) kost tegen de marge per product ----------
export async function ssMarges() {
  let c = null, f = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {} try { f = await kv.get('hjdk:shop:lusfeed'); } catch (e) {}
  const R = await regels(), items = ((c && c.items) || []).filter(i => i && N(i.p) > 0), kost = 2 * R.zegelEur;
  const uit = { producten: items.length, metMarge: 0, zegelEur: R.zegelEur, kostenPerAankoop: kost, margeBovenKosten: 0, margeOnderKosten: 0, mediaanMarge: null, kaartenPerCadeau: {} };
  const ms = []; for (const i of items) { if (i.mg == null) continue; uit.metMarge++; ms.push(N(i.mg)); if (N(i.mg) >= kost) uit.margeBovenKosten++; else uit.margeOnderKosten++; const k = kaartenVoor(i, R); const lab = k > 5 ? 'meer dan 5' : String(k); uit.kaartenPerCadeau[lab] = N(uit.kaartenPerCadeau[lab]) + 1; }
  if (ms.length) { const s = ms.slice().sort((a, b) => a - b); uit.mediaanMarge = euro(s[Math.floor(s.length / 2)]); }
  const C = {}; for (const i of items) C[i.id] = i; const ord = {};
  for (const o of ((f && f.orders) || []).filter(o => /paid|betaald/i.test(String(o.s || '')))) { const k = o.id || Math.random(); const x = ord[k] = ord[k] || { v: 0, mg: 0 }; x.v = Math.max(x.v, N(o.v)); const it = item(C, o.p); if (it && it.mg != null) x.mg += N(it.mg) * Math.max(1, N(o.n)); }
  uit.betaaldeBestellingen = Object.values(ord).map(x => ({ bedrag: x.v, marge: Math.round(x.mg * 100) / 100, kostenZegels: kost, verschil: Math.round((x.mg - kost) * 100) / 100 }));
  uit.voorbeeldCadeaus = kiesLijst(C, R, 1).map(x => ({ cadeau: x.i.t, winkelprijs: thuis(x.i), kaarten: x.k }));
  return uit;
}

// ---------- dagelijkse ronde (cron op=indexnow in fn/gids.js): geldigheid, en de kettingmeter ----------
export async function ssRonde(nu = Date.now()) {
  const uit = { leden: 0, afloopMail: 0, verlopen: 0, openZegels: 0 }; let ids = []; try { ids = await kv.raw(['SMEMBERS', 'ss:leden']) || []; } catch (e) {}
  for (const id of ids.slice(0, 5000)) { const m = await lees('ss:m:' + id); if (!m) continue; uit.leden++;
    if (!(m.zegels || []).length) continue;
    if (m.afloop && nu > m.afloop) { const n = m.zegels.length; m.zegels = []; m.afloop = 0; m.verlopen = N(m.verlopen) + n; await zet('ss:m:' + id, m); await tel('verlopen', n); uit.verlopen += n; continue; }
    if (!m.afloop && nu > geldigTot(m)) {
      if (stand(m).A > 0) { m.afloop = nu + AFLOOP_DAGEN * 864e5; await zet('ss:m:' + id, m); if (await mailNaar(m, 'afloop', { sleutel: 'afloop-' + laatst(m) })) uit.afloopMail++; }
      else { const n = m.zegels.length; m.zegels = []; m.verlopen = N(m.verlopen) + n; await zet('ss:m:' + id, m); await tel('verlopen', n); uit.verlopen += n; continue; } }
    uit.openZegels += stand(m).totaal; }
  try { uit.ketting = (await ssKetting({ open: uit.openZegels, nu })).regel; } catch (e) { uit.kettingFout = String(e.message || e).slice(0, 100); }
  try { uit.clubs = await (await import('./partner.js')).maandRonde(); } catch (e) {} // 1e van de maand: stand naar de clubs, uitbetaallijst naar Henkjan
  return uit;
}

const CSS = `<style>.ss-meer{margin:28px 0 0;border-top:1px solid #D7DCE8;padding:14px 0 0}.ss-meer summary{cursor:pointer;font-weight:700;text-decoration:underline}.ss-klein{font-size:14px}.ss-k{border:1px solid #D7DCE8;border-radius:16px;padding:16px 18px;margin:0 0 14px}.ss-f{display:grid;gap:10px;max-width:520px}.ss-f input[type=text],.ss-f input[type=email]{min-height:48px;border:1.5px solid #111113;border-radius:12px;padding:10px 12px;font:inherit;background:#fff;color:#111113}.ss-kaart{border:2px solid #111113;border-radius:18px;padding:16px;margin:8px 0 12px;max-width:420px}.ss-v{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.ss-v span{aspect-ratio:1;border:2px dashed #111113;border-radius:50%;display:grid;place-items:center;font-size:18px;font-weight:700}.ss-v span.vol{border-style:solid;background:#111113;color:#fff}.ss-tel{font-size:28px;font-weight:700;margin:10px 0 0}.ss-l{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.ss-l span{border:1.5px solid #111113;border-radius:999px;padding:2px 10px;font-weight:700;font-size:14px}.ss-wa{background:#1A7A43!important;border-color:#1A7A43!important;color:#fff!important}.ss-hp{position:absolute!important;left:-9999px!important}.ss-cadeau{border:2px solid #111113;border-radius:16px;padding:12px 14px;margin:0 0 14px}.ss-geef{border:2px dashed #111113;border-radius:16px;padding:12px 14px;margin:0 0 14px}.ss-r{margin:0;padding-left:20px}.ss-r li{margin:0 0 6px}.ss-c{display:grid;grid-template-columns:56px minmax(0,1fr) auto;align-items:center;gap:12px;border:1px solid #D7DCE8;border-radius:14px;padding:10px 12px;margin:0 0 8px}.ss-c img{width:56px;height:56px;object-fit:cover;border-radius:10px}.ss-c .t{min-width:0}.ss-c .z{display:inline-block;border:1.5px solid #111113;border-radius:999px;padding:1px 10px;font-weight:700;font-size:13px;white-space:nowrap;margin:4px 0 0}.ss-c .btn{padding:8px 14px;white-space:nowrap}.ss-c form{margin:0}.ss-tg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:8px 0 12px}.ss-tg a{display:block;border:1px solid #D7DCE8;border-radius:12px;padding:6px;text-decoration:none;color:#111113;font-size:13px;font-weight:700}.ss-tg img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block;margin:0 0 4px}</style>`;
const meerHtml = (titel, inhoud) => `<details class="ss-meer"><summary>${titel}</summary>${inhoud}<p><b>Spelregels</b></p><ol class="ss-r">${SPELREGELS.map(r => `<li>${esc(r)}</li>`).join('')}</ol></details>`;
const regelsHtml = () => `<details class="ss-k"><summary><b>Spelregels</b></summary><ol class="ss-r">${SPELREGELS.map(r => `<li>${esc(r)}</li>`).join('')}</ol></details>`;
function kaartHtml(m, s) {
  const z = m.zegels || [], namen = z.map(x => String(x.van || '?').charAt(0)), toon = s.vol ? KAART : s.opKaart, eerst = (s.vol ? s.kaarten - 1 : s.kaarten) * KAART;
  let v = ''; for (let j = 0; j < KAART; j++) v += j < toon ? `<span class="vol">${esc(namen[eerst + j] || '')}</span>` : '<span></span>';
  return `<div class="ss-kaart"><div class="ss-v" aria-label="${toon} van ${KAART} zegels">${v}</div><p class="ss-tel">${s.vol ? 'Je kaart is vol' : toon ? toon + ' van ' + KAART + ' zegels' : 'Nieuwe kaart'}</p>${s.kaarten > (s.vol ? 1 : 0) ? `<p style="margin:0"><b>Volle kaarten: ${s.kaarten}</b></p>` : ''}</div>`;
}

export async function ssOp({ req, res, q, host, ua, kaal, leesBody, isBot }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const beschermd = /\.vercel\.app$/i.test(host);
  // ---------- openbaar voor de shop: zegel en kaarten per product of mandje (alleen aantallen) ----------
  if (q.get('product') || q.get('mand')) { res.setHeader('access-control-allow-origin', '*'); const C = await cat(), R = await regels();
    if (q.get('product')) { const i = item(C, String(q.get('product')).slice(0, 60)); const k = i && i.mg != null ? kaartenVoor(i, R) : null;
      return res.status(200).json({ ok: true, live: LIVE, zegels: 1, kaarten: k, tekst: '1 zegel bij je aankoop' + (k && k <= 5 ? `. Gratis te krijgen voor ${kt(k)} van 5 zegels.` : '.'), link: LIVE ? 'https://gids.kadoly.com/samen-sparen' : null }); }
    const n = String(q.get('mand')).split(',').filter(Boolean).length;
    return res.status(200).json({ ok: true, live: LIVE, zegels: n ? 1 : 0, tekst: n ? 'Deze bestelling geeft 1 zegel. Wie jou uitnodigde, krijgt er ook 1.' : '', link: LIVE ? 'https://gids.kadoly.com/samen-sparen' : null }); }
  if (!beschermd && !LIVE) return res.status(404).send('Niet gevonden');
  const base = (beschermd ? 'https://' + host : 'https://gids.kadoly.com') + '/api/gids?op=ss';
  const naar = u => { res.setHeader('location', u); return res.status(303).end(); };
  const pagina = (titel, x) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(kaal(titel, CSS + (LIVE ? '' : '<div class="ss-k"><p><b>Concept.</b> Dit staat nog niet op gids.kadoly.com; alleen jij ziet het hier.</p></div>') + x, '<script src="https://go.kadoly.com/cm.js" data-site="samensparen" async></script>')); };
  const C = await cat(), R = await regels();
  const vb = () => { const v = kiesLijst(C, R, 1).find(x => x.k === 1); return v ? v.i.t : ''; };
  const tegels = () => { const L = kiesLijst(C, R, 1).slice(0, 3); return L.length ? `<p style="margin:16px 0 0"><b>Cadeaus van deze week</b></p><div class="ss-tg">${L.map(x => `<a href="https://kadoly.com/product/${esc(x.i.id)}"><img src="${esc(x.i.img)}" alt="" loading="lazy">${esc(String(x.i.t).slice(0, 40))}</a>`).join('')}</div>` : ''; };

  // ---------- instellen (alleen beschermde host): armen, dagen, actie, zegelwaarde, controlegroep ----------
  if (q.get('zet') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden');
    const r = (await lees('ss:regels')) || {};
    if (q.get('armen')) { const a = String(q.get('armen')).split(',').map(x => Math.round(N(x))).filter(x => x >= 1 && x <= CADEAU_MAX).slice(0, 4); if (a.length) r.armen = a; }
    if (q.get('dagen')) { const a = String(q.get('dagen')).split(',').map(x => Math.round(N(x))).filter(x => x >= 1 && x <= 31).slice(0, 4); if (a.length) r.dagen = a; }
    if (q.get('zegelEur')) { const v = N(q.get('zegelEur')); if (v >= 1.5 && v <= 3) r.zegelEur = v; }
    if (q.get('ctrlPct') != null && q.get('ctrlPct') !== '') { const v = N(q.get('ctrlPct')); if (v >= 0 && v <= 30) r.ctrlPct = v; }
    await kv.set('ss:regels', r);
    const an = String(q.get('actie') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
    if (an === 'uit') await kv.set('ss:actie', null).catch(() => {});
    else if (an) { const c = Math.round(N(q.get('cadeau'))), d = Math.min(31, Math.max(1, Math.round(N(q.get('dagen')) || 7)));
      if (c < 1 || c > CADEAU_MAX) return res.status(400).json({ ok: false, fout: 'cadeau moet 1 tot ' + CADEAU_MAX + ' zegels zijn' });
      await kv.set('ss:actie', { naam: an, cadeau: c, van: Date.now(), tot: Date.now() + d * 864e5 }); }
    return res.status(200).json({ ok: true, regels: await regels(), actie: await actieNu() }); }
  if (q.get('marges') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, ...(await ssMarges()) }); }
  if (q.get('inwissel') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json(await ssInwissel(q.get('m'), q.get('c'))); }
  if (q.get('ketting') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, ...(await ssKetting({ knop: false })) }); }

  if (q.get('stand') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden');
    const som = {}; for (let i = 0; i < 14; i++) { const a = await hash('ss:tel:' + dagNL(Date.now() - i * 864e5)); for (const [k, v] of Object.entries(a)) som[k] = N(som[k]) + v; }
    const L = [];
    if (N(som.zie) >= 200 && !N(som.start)) L.push({ lek: 'niemand start', cijfers: som.zie + ' bezoekers, niemand begon', actie: 'kop en eerste scherm' });
    if (N(som.leden) >= 20 && !N(som.deel)) L.push({ lek: 'niemand geeft een zegel door', cijfers: som.leden + ' leden, 0 keer gedeeld', actie: 'de doorgeefknop na de aankoop en in de mail; de drempelzoeker zet 2 zegels' });
    if (N(som.deel) >= 20 && !N(som.open)) L.push({ lek: 'gedeelde links worden niet geopend', cijfers: som.deel + ' keer gedeeld, 0 keer geopend', actie: 'de tekst en de foto van het bericht' });
    if (N(som.open) >= 50 && !N(som.mee)) L.push({ lek: 'wie de link opent, pakt zijn zegel niet', cijfers: som.open + ' keer geopend, 0 meespaarders', actie: 'de uitnodigingspagina' });
    if (N(som.mailNietKlaar) || N(som.mailFout)) L.push({ lek: 'mail gaat niet weg', cijfers: N(som.mailNietKlaar) + ' keer verzenddomein niet klaar, ' + N(som.mailFout) + ' fouten', actie: 'verzenddomein post.kadoly.com bij Resend en de mailsleutel' });
    const K = await lees('ss:ketting'); if (K && K.saldo != null && K.saldo < 0) L.push({ lek: 'de keten kost meer dan hij oplevert', cijfers: K.regel, actie: 'de kettingmeter zet de zegelwaarde hoger (cadeaus kosten meer kaarten); daarna de drempelzoeker op doorgeven' });
    const nv = {}, raw = await kv.raw(['HGETALL', 'ss:niv']).catch(() => []); for (let j = 0; j + 1 < (raw || []).length; j += 2) { const [l, w] = String(raw[j]).split('|'); (nv[l] = nv[l] || {})[w] = N(raw[j + 1]); }
    const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : null;
    const aanbodStand = Object.entries(nv).map(([l, x]) => ({ aanbod: l, gedeeld: N(x.deel), geopend: N(x.open), meespaarders: N(x.mee), aankopen: N(x.koop), geopendPer100Delen: pct(N(x.open), N(x.deel)), meespaardersPer100Delen: pct(N(x.mee), N(x.deel)) }));
    const genoeg = aanbodStand.filter(x => x.gedeeld >= 50); const best = genoeg.slice().sort((a, b) => (b.meespaarders + 3 * b.aankopen) / b.gedeeld - (a.meespaarders + 3 * a.aankopen) / a.gedeeld)[0];
    return res.status(200).json({ ok: true, live: LIVE, spelregels: SPELREGELS, regels: R, actie: await actieNu(), ketting: K, laatste14: som, aanbod: aanbodStand, drempelzoeker: genoeg.length >= 2 && best ? 'meeste meespaarders en aankopen per 100 keer delen: ' + best.aanbod : 'nog te weinig: elk aanbod moet 50 keer gedeeld zijn', lekken: L }); }

  // ---------- link uit een mail of de deelknop: via Clickmind; de eerste mailklik bevestigt je adres ----------
  const go = String(q.get('go') || ''); if (go) { const m = /^[a-f0-9]{12}$/.test(String(q.get('m') || '')) ? await lees('ss:m:' + q.get('m')) : null, k = String(q.get('k') || '');
    if (!m || m.ak !== h(k)) return res.status(404).send('Niet gevonden');
    const voor = /prefetch|prerender/i.test(String(req.headers['sec-purpose'] || req.headers.purpose || '')) || req.method === 'HEAD';
    const cid = randomBytes(6).toString('hex'), w = ['kaart', 'deel', 'kies', 'kiesk'].includes(go) ? go : 'kaart'; let doel, net = 'mail';
    if (w === 'deel') { const AB = await aanbod(m), r = rechten(m), code = randomBytes(5).toString('hex'), tot = Date.now() + AB.dagen * 864e5;
      if (!voor && !isBot(ua)) { await kv.set('ss:deel:' + code, { m: m.id, niv: r ? AB.niv : 0, tot, L: AB.L }, { ex: 40 * 86400 }).catch(() => {}); await telNiv(AB.L, 'deel'); await tel('deel'); }
      doel = 'https://wa.me/?text=' + encodeURIComponent(waTekst(base + '&u=' + m.id + '&d=' + code, AB, tot, r > 0)); net = 'web'; }
    else if (w === 'kies') { const i = item(C, String(q.get('c') || '')); doel = 'https://wa.me/31655395630?text=' + encodeURIComponent(`Ik wil mijn spaarkaarten inwisselen voor ${i ? i.t : 'een cadeau'}${i ? ' (' + kt(kaartenVoor(i, R)) + ')' : ''}. Spaarkaart ${m.id}`); net = 'web';
      if (i && !voor && !isBot(ua)) { try { await kv.raw(['RPUSH', 'ss:vraag', JSON.stringify({ t: Date.now(), m: m.id, pid: i.id })]); } catch (e) {} await tel('inwisselVraag'); } }
    else doel = base + '&m=' + m.id + '&k=' + k + (w === 'kiesk' ? '&kies=1' : '') + '&mmc=' + cid;
    if (!voor && !isBot(ua)) { if (net === 'mail') { if (!m.ok) { m.ok = Date.now(); await zet('ss:m:' + m.id, m); } await tel('mailklik'); }
      try { const MM = await import('./mensmeter.js'); let mmp = (String(req.headers.cookie || '').match(/(?:^|;\s*)mmp=([0-9a-f]{16})/) || [])[1]; const nieuw = !mmp; if (nieuw) mmp = randomBytes(8).toString('hex');
        MM.laterAf(MM.verwerkKlik(kv, { cid, pid: mmp, nieuw, arm: '302', tag: '-', net, camp: LIVE ? 'samensparen' : 'samensparen-test', zone: w, sub: '-', cr: w, kw: '', doel, p: 'ss' }, MM.serverSignalen(req)).catch(() => {}));
        res.setHeader('set-cookie', 'mmp=' + mmp + '; Max-Age=15552000; Path=/; Secure; HttpOnly; SameSite=Lax'); } catch (e) {} }
    return naar(doel); }

  // ---------- geen bericht meer bij een zegel ----------
  const af = String(q.get('af') || ''); if (af) { const m = /^[a-f0-9]{12}$/.test(af) ? await lees('ss:m:' + af) : null; if (!m || !m.af || m.af !== String(q.get('t') || '')) return res.status(404).send('Niet gevonden');
    if (req.method === 'POST') { m.stil = Date.now(); await zet('ss:m:' + m.id, m); await tel('stil'); if (q.get('knop') !== '1') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('Afgemeld'); }
      return pagina('Geen berichten meer', '<p class="kicker">Samen sparen</p><h1>Je krijgt geen bericht meer bij een zegel</h1><p>Je kaart en je zegels blijven gewoon staan.</p>'); }
    return pagina('Geen bericht meer bij een zegel', `<p class="kicker">Samen sparen</p><h1>Geen bericht meer bij een zegel?</h1><p>Je kaart en je zegels blijven staan. Je krijgt alleen geen mail meer als er een zegel bij komt.</p><form method="post" action="${esc(base + '&af=' + m.id + '&t=' + m.af + '&knop=1')}"><button class="btn knop" type="submit">Geen berichten meer</button></form>`); }

  if (req.method === 'POST') { if (isBot(ua)) return res.status(403).send('Niet toegestaan'); const b = await leesBody(req); if (b.website) return naar(base);
    // je zegels aan je club geven (of terug naar je eigen kaart)
    if (String(b.a) === 'club') { const m = /^[a-f0-9]{12}$/.test(String(b.m || '')) ? await lees('ss:m:' + b.m) : null; if (!m || m.ak !== h(String(b.k || '')) || !m.pt) return naar(base);
      m.club = b.aan === '1' ? m.pt : ''; await zet('ss:m:' + m.id, m); await tel(m.club ? 'clubAan' : 'clubUit'); return naar(base + '&m=' + m.id + '&k=' + b.k); }
    // spaar voor een ander cadeau
    if (String(b.a) === 'doel') { const m = /^[a-f0-9]{12}$/.test(String(b.m || '')) ? await lees('ss:m:' + b.m) : null; if (!m || m.ak !== h(String(b.k || ''))) return naar(base);
      const i = item(C, String(b.c || '')); m.doel = i ? i.id : ''; await zet('ss:m:' + m.id, m); await tel('doelGekozen'); return naar(base + '&m=' + m.id + '&k=' + b.k); }
    const naam = schoon(b.naam, 20), mail = schoon(b.mail, 120).toLowerCase(), u = /^[a-f0-9]{12}$/.test(String(b.u || '')) ? String(b.u) : '', dc = /^[a-f0-9]{10}$/.test(String(b.d || '')) ? String(b.d) : '';
    if (!naam || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail)) return naar(base + (u ? '&u=' + u + (dc ? '&d=' + dc : '') : '') + '&fout=1');
    const em = h(mail), al = await lees('ss:em:' + em);
    if (al) { const m0 = await lees('ss:m:' + al); if (m0) await mailNaar(m0, 'welkom', { sleutel: 'opnieuw-' + dagNL() }); return naar(base + '&al=1'); }
    let door = null, pt = '', deel = null;
    if (u) door = await lees('ss:m:' + u); if (!door) { try { pt = await (await import('./partner.js')).ptUit(req, null); } catch (e) {} }
    if (door && dc) { deel = await lees('ss:deel:' + dc); if (!deel || deel.m !== door.id || Date.now() > N(deel.tot) || !N(deel.niv) || rechten(door) <= 0) deel = null; }
    const mid = randomBytes(6).toString('hex'), k = randomBytes(12).toString('hex'), nu = Date.now();
    const cadeau = deel ? Math.min(CADEAU_MAX, N(deel.niv)) : 0;
    const m = { id: mid, naam, mail, em, doel: '', door: door ? door.id : '', pt, via: deel ? deel.L : '', niv: R.armen[Math.floor(Math.random() * R.armen.length)], dg: R.dagen[Math.floor(Math.random() * R.dagen.length)],
      zegels: cadeau ? startZegels(cadeau, door.naam, 'cadeau', nu) : startZegels(R.zelf, 'Kadoly', 'start', nu), ak: h(k), k, af: randomBytes(9).toString('hex'), at: nu };
    try { const los = await kv.raw(['LRANGE', 'ss:los:' + em, '0', '-1']) || []; for (const x of los) { const o = JSON.parse(x); if (o && o.o && N(o.t) > nu - LOS_DAGEN * 864e5) { m.zegels = m.zegels.concat([{ t: N(o.t), van: naam, o: o.o }]); try { const inf = await lees('ss:ordinfo:' + o.o); if (inf && !inf.koper) { inf.koper = mid; await kv.set('ss:ordinfo:' + o.o, inf, { ex: 200 * 86400 }); } } catch (e) {} } } if (los.length) { await kv.raw(['DEL', 'ss:los:' + em]).catch(() => {}); await tel('losBijgeschreven', los.length); } } catch (e) {}
    m.ontvangen = m.zegels.length; if (cadeau) await tel('cadeauzegels', cadeau);
    await zet('ss:m:' + mid, m); await zet('ss:em:' + em, mid); try { await kv.raw(['SADD', 'ss:leden', mid]); } catch (e) {}
    if (door) { door.uitgenodigd = (door.uitgenodigd || []).concat([mid]).slice(-500); if (cadeau) door.gegeven = N(door.gegeven) + 1; await zet('ss:m:' + door.id, door); if (deel) await telNiv(deel.L, 'mee'); }
    await tel(door ? 'mee' : 'start'); await tel('leden');
    await mailNaar(m, 'welkom', { sleutel: 'eerst', cadeauVan: cadeau ? door.naam : '' });
    return naar(base + '&m=' + mid + '&k=' + k + '&nieuw=1'); }

  const velden = `<input type="text" name="naam" required maxlength="20" autocomplete="given-name" placeholder="Je voornaam" aria-label="Je voornaam"><input type="email" name="mail" required maxlength="120" autocomplete="email" placeholder="Je e-mail" aria-label="Je e-mail"><input type="text" name="website" class="ss-hp" tabindex="-1" autocomplete="off" aria-hidden="true">`;
  const fout = q.get('fout') === '1' ? '<p><b>Vul je voornaam en een geldig e-mailadres in.</b></p>' : '';
  const uitleg = 'Bij elke aankoop bij Kadoly krijg je een zegel, en wie jou uitnodigde krijgt er ook 1. Een kaart is 5 zegels. Elk cadeau in de winkel kost een aantal kaarten, de eerste kaart is al een cadeau gratis.';

  // ---------- jouw spaarkaart, of kies je cadeau ----------
  const mid = String(q.get('m') || ''); if (mid) { const m = /^[a-f0-9]{12}$/.test(mid) ? await lees('ss:m:' + mid) : null; if (!m || m.ak !== h(String(q.get('k') || ''))) return res.status(404).send('Niet gevonden');
    const s = stand(m), kk = String(q.get('k')), r = rechten(m), AB = await aanbod(m);
    if (q.get('kies') === '1') { const L = kiesLijst(C, R); let x = `<p class="kicker">Samen sparen</p><h1>Kies je cadeau</h1><p>${s.kaarten ? 'Je hebt ' + kt(s.kaarten) + '.' : 'Nog ' + zt(KAART - s.opKaart) + ' tot een volle kaart.'}</p>`;
      x += L.map(({ i, k }) => `<div class="ss-c"><img src="${esc(i.img)}" alt="" loading="lazy"><div class="t"><b>${esc(i.t)}</b><br><span class="z">${kt(k)}</span> <span class="ss-klein">${euro(thuis(i))}</span></div>${k <= s.kaarten ? `<a class="btn knop" href="${esc(base + '&go=kies&c=' + i.id + '&m=' + m.id + '&k=' + kk)}">Neem nu</a>` : `<form method="post" action="${esc(base)}"><input type="hidden" name="a" value="doel"><input type="hidden" name="m" value="${m.id}"><input type="hidden" name="k" value="${esc(kk)}"><input type="hidden" name="c" value="${esc(i.id)}"><button class="btn" type="submit">${m.doel === i.id ? 'Hier spaar je voor' : 'Spaar hiervoor'}</button></form>`}</div>`).join('');
      x = x.replace('<p class="kicker">Samen sparen</p>', ''); x += `<p><a href="${esc(base + '&m=' + m.id + '&k=' + kk)}">Terug naar je spaarkaart</a></p>`; return pagina('Kies je cadeau', x); }
    const namen = []; for (const l of (m.uitgenodigd || []).slice(-30)) { const y = await lees('ss:m:' + l); if (y) namen.push(y.naam); }
    let x = `<h1>${q.get('nieuw') === '1' ? ((m.zegels || []).some(z => z.start === 'cadeau') ? 'Je kaart begint met een zegel cadeau' : 'Je eerste zegel is cadeau') : 'Je spaarkaart'}</h1>`;
    x += kaartHtml(m, s);
    if (m.afloop && !s.kaarten) x += `<p><b>Je zegels vervallen op ${datum(m.afloop)}.</b> Eén bestelling houdt je kaart open.</p>`;
    const doelI = m.doel ? item(C, m.doel) : null; if (doelI) { const dk = kaartenVoor(doelI, R), rest = Math.max(0, dk - s.kaarten); x += `<p>Je spaart voor ${esc(doelI.t)}: ${rest ? 'nog ' + kt(rest) + '.' : 'je hebt genoeg kaarten.'}</p>`; }
    const kiesU = base + '&m=' + m.id + '&k=' + kk + '&kies=1', deelU = base + '&go=deel&m=' + m.id + '&k=' + kk;
    if (s.kaarten) x += `<p><a class="btn knop" href="${esc(kiesU)}">Kies je cadeau</a></p>${r ? `<p><a href="${esc(deelU)}">Geef een zegel door</a></p>` : ''}`;
    else if (r) x += `<p>Wie hem binnen ${AB.dagen} dagen pakt, begint met jouw zegel. Koopt die iets, dan krijg jij er 1.</p><p><a class="btn knop" href="${esc(deelU)}">Geef een zegel door</a></p><p><a href="${esc(kiesU)}">Bekijk de cadeaus</a></p>`;
    else x += `<p>Koopt iemand die jij uitnodigt iets, dan krijg jij er 1.</p><p><a class="btn knop" href="${esc(deelU)}">Nodig iemand uit</a></p><p><a href="${esc(kiesU)}">Bekijk de cadeaus</a></p>`;
    let meer = '';
    if (m.pt) { let pn = m.pt; try { const P = await (await import('./partner.js')).partner(m.pt); if (P) pn = P.naam; } catch (e) {}
      meer += `<form method="post" action="${esc(base)}" style="margin:0 0 14px"><input type="hidden" name="a" value="club"><input type="hidden" name="m" value="${m.id}"><input type="hidden" name="k" value="${esc(kk)}"><input type="hidden" name="aan" value="${m.club ? '0' : '1'}"><p>${m.club ? `Je zegels gaan naar ${esc(pn)}: de club krijgt €4 per aankoop.` : `${esc(pn)} krijgt €2 bij elke aankoop van jou. Geef je je eigen zegel ook, dan krijgt de club €4.`}</p><button class="btn" type="submit">${m.club ? 'Zegels weer op mijn eigen kaart' : 'Geef mijn zegels aan ' + esc(pn)}</button></form>`; }
    if (namen.length) meer += `<p><b>Spaart via jou:</b> ${namen.map(esc).join(', ')}</p>`;
    if (s.gratisOp) meer += '<p>De cadeauzegels voor deze kaart zijn op. Het laatste stuk spaar je met aankopen.</p>';
    meer += `<p>Je zegels blijven geldig tot ${datum(geldigTot(m))}; elke nieuwe zegel verlengt dat. Vragen? App Henkjan van Kadoly: 06 55395630.</p>`;
    x += meerHtml('Meer', meer);
    return pagina('Samen sparen: ' + m.naam, x); }

  // ---------- uitnodiging: een zegel cadeau, met echte deadline ----------
  const uid = String(q.get('u') || ''); if (uid) { const u = /^[a-f0-9]{12}$/.test(uid) ? await lees('ss:m:' + uid) : null; if (!u) return res.status(404).send('Niet gevonden');
    const dc = /^[a-f0-9]{10}$/.test(String(q.get('d') || '')) ? String(q.get('d')) : ''; let deel = dc ? await lees('ss:deel:' + dc) : null;
    if (deel && (deel.m !== u.id || Date.now() > N(deel.tot) || !N(deel.niv) || rechten(u) <= 0)) deel = null;
    if (!isBot(ua)) { await tel('open'); if (deel) await telNiv(deel.L, 'open'); }
    const n = deel ? Math.min(CADEAU_MAX, N(deel.niv)) : 0;
    let x = `<h1>${n ? `${esc(u.naam)} geeft je ${n === 1 ? 'een zegel' : n + ' zegels'}` : `${esc(u.naam)} nodigt je uit om mee te sparen`}</h1>`;
    if (n) { let v = ''; for (let j = 0; j < KAART; j++) v += j < n ? `<span class="vol">${esc(String(u.naam).charAt(0))}</span>` : '<span></span>'; x += `<div class="ss-kaart"><div class="ss-v">${v}</div><p class="ss-tel">${n} van ${KAART} zegels</p><p style="margin:0">Pak ${n === 1 ? 'hem' : 'ze'} voor ${datum(deel.tot)}.</p></div>`; }
    if (!n) x += `<p>Elke aankoop geeft 1 zegel. Een volle kaart van 5 zegels is een gratis cadeau${vb() ? ', bijvoorbeeld ' + esc(vb()) : ''}.</p>`;
    x += `${fout}<form class="ss-f" method="post" action="${esc(base)}"><input type="hidden" name="u" value="${esc(uid)}">${dc ? `<input type="hidden" name="d" value="${esc(dc)}">` : ''}${velden}<button class="btn knop" type="submit">${n ? 'Pak je ' + (n === 1 ? 'zegel' : 'zegels') : 'Start met sparen'}</button></form><p class="ss-klein">Gratis. Je hoeft niets te kopen.</p>`;
    x += meerHtml('Hoe werkt het?', `<p>${esc(uitleg)} Koop jij iets, dan krijgt ${esc(u.naam)} er ook 1.</p>${vb() ? `<p>Met één volle kaart krijg je bijvoorbeeld gratis: ${esc(vb())}.</p>` : ''}`);
    return pagina(u.naam + ' geeft je een zegel', x); }

  // ---------- start (na een bestelling, uit een advertentie, of via een site of vereniging) ----------
  if (!isBot(ua)) await tel('zie');
  let pnaam = '', pcent = 0; try { const P = await import('./partner.js'); const pt = await P.ptUit(req, q); if (pt) { const p = await P.partner(pt); pnaam = p ? p.naam : ''; if (pnaam) { res.setHeader('set-cookie', 'kpt=' + pt + '; Max-Age=' + (7 * 86400) + '; Path=/; Secure; SameSite=Lax'); pcent = N((await hash('pt:s:' + pt)).cent); } } } catch (e) {}
  const naBestelling = /^[A-Za-z0-9_-]{3,40}$/.test(String(q.get('o') || ''));
  let x = naBestelling ? `<h1>Je bestelling gaf 1 zegel</h1><p>Vul je naam en e-mail in, dan staat hij op je kaart.</p>`
    : `<h1>${pnaam ? 'Spaar mee met ' + esc(pnaam) : 'Spaar samen voor een gratis cadeau'}</h1>${pnaam && pcent > 0 ? `<p><b>${euro(pcent / 100)} gespaard voor ${esc(pnaam)}</b></p>` : ''}<p>${pnaam ? `Elke aankoop: jij 1 zegel, ${esc(pnaam)} €2.` : 'Je eerste zegel is cadeau.'} Een volle kaart van 5 zegels is een gratis cadeau${vb() ? ', bijvoorbeeld ' + esc(vb()) : ''}.</p>`;
  if (q.get('al') === '1') x += '<p><b>Met dit e-mailadres spaar je al.</b> We stuurden de link naar je kaart opnieuw naar dat adres.</p>';
  x += `${fout}<form class="ss-f" method="post" action="${esc(base)}">${velden}<button class="btn knop" type="submit">${naBestelling ? 'Zet hem op mijn kaart' : 'Start met sparen'}</button></form><p class="ss-klein">Gratis, ook de verzending van je cadeau.</p>`;
  x += meerHtml('Hoe werkt het?', `<p>${esc(uitleg)}</p><p>Kadoly is een webshop van ADSFAIR B.V. in Gouda.</p>`);
  return pagina('Samen sparen bij Kadoly', x);
}
