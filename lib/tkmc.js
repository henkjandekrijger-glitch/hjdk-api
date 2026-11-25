// Oude Mailchimp-lijst van Tania Kross opnieuw vragen (Henkjan 25 nov 2026: "vind lijst van mailchimp in mijn email en stuur per dag een aantal met
// vraag of ze nog op lijst willen blijven lang niets gehoord van Tania zorg wel dat de mail super is . En fokking lerend dus iedere 20 wordt ie beter .
// Je kan in mijn inbox replies laten landen of vanaf mij Laten sturen . Wat slimste is.").
//
// Waarom zo:
// - Bron: de export members_export_839147311c.zip die Henkjan op 9 nov 2020 aan zichzelf mailde (lijst "Tania Kross", account Adsfair BV). De import
//   leest hem zelf uit zijn Gmail via Zernio (bijlage downloaden, zip uitpakken), alleen subscribed_members, MEMBER_RATING 3 tot 5 (13.724 van 19.197).
//   Adressen staan alleen in de database (tkmc:rij en tkmc:a), nooit in code.
// - Kanaal: uit Henkjans eigen Gmail via Zernio (zoals lib/clubwerf.js). Resend verbiedt oude en gekochte lijsten en daar loopt alle andere mail over;
//   taniakross.media staat niet bij Resend (domeinlimiet). Antwoorden landen zo vanzelf in zijn inbox. Zernio-grenzen: gewone Gmail 200 per dag
//   (400 na 14 schone dagen); 10 harde bounces binnen een uur of dezelfde tekst naar 50+ mensen in een uur zet de grens terug. Daarom hooguit
//   8 per uur, verspreid over 9 tot 21 uur NL, en elke mail met eigen aanhef en jaartal.
// - Toestemming: alleen wie zelf ja zegt (knop op taniakross.media/blijf/<tok>, of "ja" terugmailen) komt op de lijst (POST naar
//   taniakross.media/api/lijst?a=aan, p=mailchimp-<variant>; daar volgt de welkomstmail). Niets doen = niet meer mailen. Stop-link en
//   List-Unsubscribe in elke mail. De knoppagina bevestigt met JavaScript, zodat linkscanners van mailservers niets aanzetten.
// - Leren: twee varianten tegelijk (Thompson op ja per verstuurde mail). Elke 20 verstuurde mails een leermoment: is een variant met 20 of meer
//   verstuurd voor 80% of meer de slechtste, dan gaat hij eruit en komt de volgende uit de rij (VARIANTEN, daarna uitdagers die de dagronde schrijft
//   met op=tkmc&uitdager=). Na 60 per variant zonder duidelijke winnaar valt de laagste toch af, zodat er altijd iets nieuws getest wordt.
// - Volume: start 40 per dag. Bounce onder 5% en stop onder 3% over de laatste 7 dagen (vanaf 40 mails): +10 per 2 dagen, tot 180. Bounce 8% of
//   meer, of stop 5% of meer: halveren. Elke mail wordt gemeld in de POST-lus (project tk-mailchimp).
// Uit tot Henkjans woord: LIVE hieronder én kv tkmc:regels.aan (op=tkmc&zet=1&aan=1 op de beschermde host).
import { createHash, randomBytes } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import { kv } from './db.js';

export const LIVE = false;
const SITE = 'https://taniakross.media';
const STD = { aan: false, perDag: 40, max: 180, perUur: 8, armen: [0, 1], volgende: 2, knopAt: 0, gedaan: [], extra: [] };
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const hk = s => createHash('sha256').update('tkmc:' + String(s).toLowerCase().trim()).digest('hex').slice(0, 24);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dagNL = (t = Date.now()) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
const uurNL = (t = Date.now()) => N(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: 'numeric', hour12: false }).format(new Date(t))) % 24;
const MAILRE = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i;

// ---------- de mail ----------
// Velden: {aanhef} "Hoi Marieke," of "Hoi,", {jaar} jaar van aanmelden, {laatste} laatste podcastgast, {drie} volgende gasten, {ja} {stop} de links.
// Alles wat erin staat komt van taniakross.media (podcastblok via /api/lijst?a=stand) of uit de export (voornaam, jaar).
const ONDER = '\n\nHenkjan de Krijger\nIk produceerde jarenlang de voorstellingen van Tania en doe nu haar site.\nAntwoorden op deze mail kan gewoon, of bel of app 06 55395630.';
export const VARIANTEN = [
  { o: 'Wil je nog mail van Tania Kross?', t: '{aanhef}\n\nJe meldde je in {jaar} aan voor de mail van Tania Kross. Daarna is het lang stil geweest. Dat ligt aan ons.\n\nTania heeft nu een eigen podcast, A Kross …{podcast}\n\nWil je op de lijst blijven? Eén klik:\n{ja}\n\nLiever niet? Dan haal ik je eraf:\n{stop}\n\nDoe je niets, dan mailen we je niet meer.' + ONDER },
  { o: 'Wil je nog mail van Tania Kross?', t: '{aanhef}\n\nJe meldde je in {jaar} aan voor de mail van Tania Kross. Daarna is het lang stil geweest. Dat ligt aan ons.\n\nZeg je ja, dan krijg je meteen Barcelona in je mail, het duet van Tania en Tommie Christiaan. Daarna hoor je het als er een nieuwe aflevering is van haar podcast A Kross ….\n\nJa, ik blijf op de lijst:\n{ja}\n\nLiever niet? Dan haal ik je eraf:\n{stop}\n\nDoe je niets, dan mailen we je niet meer.' + ONDER, gift: 'g1' },
  { o: 'Lang niets van Tania Kross gehoord', t: '{aanhef}\n\nJe staat sinds {jaar} op de lijst van Tania Kross, maar je hebt lang niets van ons gehoord. Voor we je weer mailen, vraag ik het eerst.\n\nTania heeft nu een eigen podcast, A Kross …{podcast}\n\nBlijf je op de lijst?\n{ja}\n\nNee, haal me eraf:\n{stop}' + ONDER },
  { o: 'Tania Kross heeft nu een eigen podcast', t: '{aanhef}\n\nTania Kross heeft nu een eigen podcast, A Kross …{podcast}\n\nJe meldde je in {jaar} aan voor haar mail. Daarna is het lang stil geweest. Wil je het weer horen als er een nieuwe aflevering is?\n\nJa, houd me op de hoogte:\n{ja}\n\nNee, haal me eraf:\n{stop}\n\nDoe je niets, dan mailen we je niet meer.' + ONDER },
  { o: 'Nog op de lijst van Tania Kross?', t: '{aanhef}\n\nKorte vraag. Je meldde je in {jaar} aan voor de mail van Tania Kross. Wil je die nog krijgen? Er is nu een podcast, A Kross …, en Tania mailt alleen als er echt iets is.\n\nJa:\n{ja}\n\nNee:\n{stop}' + ONDER },
  { o: 'Een vraag van het team van Tania Kross', t: '{aanhef}\n\nJe meldde je in {jaar} aan voor de mail van Tania Kross. We ruimen de lijst op en mailen alleen nog wie dat wil.\n\nZeg je ja, dan krijg je meteen Barcelona in je mail, het duet van Tania en Tommie Christiaan, en daarna elke nieuwe aflevering van haar podcast A Kross ….\n\nJa, ik blijf:\n{ja}\n\nNee, haal me eraf:\n{stop}' + ONDER, gift: 'g1' }
];
let EXTRA = [];
const pool = () => [...VARIANTEN, ...EXTRA];
let POD = { t: 0, laatste: '', drie: '' };
async function podcast() {
  if (Date.now() - POD.t < 3600e3) return POD;
  try { const j = await (await fetch(SITE + '/api/lijst?a=stand', { signal: AbortSignal.timeout(8000) })).json(); const p = j.podcast || {}; POD = { t: Date.now(), laatste: String(p.laatste || ''), drie: String(p.drie || '') }; } catch (e) {}
  return POD;
}
export function mailTekst(a, { arm = 0, tok = 'xxxx', pod = {} } = {}) {
  const v = pool()[arm] || VARIANTEN[0];
  const pz = pod.laatste ? ` De laatste aflevering is met ${pod.laatste}.${pod.drie ? ` Binnenkort volgen ${pod.drie}.` : ''}` : (pod.drie ? ` Binnenkort volgen ${pod.drie}.` : '');
  const vn = String(a.n || '').trim().split(/\s+/)[0];
  const aanhef = vn && /^[A-Za-zÀ-ÿ'-]{2,20}$/.test(vn) ? 'Hoi ' + vn.charAt(0).toUpperCase() + vn.slice(1).toLowerCase() + ',' : 'Hoi,';
  const t = v.t.replace('{aanhef}', aanhef).replace(/\{jaar\}/g, String(a.j || '2018')).replace('{podcast}', pz).replace('{ja}', SITE + '/blijf/' + tok).replace('{stop}', SITE + '/stop/' + tok).replace(/\{voornaam\}/g, vn || '');
  return { onderwerp: v.o.replace(/\{voornaam\}/g, vn || '').replace(/^,\s*/, ''), tekst: t, gift: v.gift || '' };
}

// ---------- opslag ----------
async function regels() { const r = await kv.get('tkmc:regels').catch(() => null); const R = { ...STD, ...(r && typeof r === 'object' ? r : {}) }; EXTRA = Array.isArray(R.extra) ? R.extra : []; return R; }
async function zetRegels(R) { await kv.set('tkmc:regels', R); }
const hash = l => { const o = {}; if (Array.isArray(l)) for (let i = 0; i < l.length; i += 2) o[l[i]] = N(l[i + 1]); else if (l && typeof l === 'object') for (const [k, v] of Object.entries(l)) o[k] = N(v); return o; };
async function hlees(k) { return hash(await kv.raw(['HGETALL', k]).catch(() => [])); }
async function tel(wat, n = 1, t = Date.now()) { try { const k = 'tkmc:tel:' + dagNL(t); await kv.raw(['HINCRBY', k, wat, String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); await kv.raw(['HINCRBY', 'tkmc:tot', wat, String(n)]); } catch (e) {} }
async function arm(v, wat, n = 1) { try { await kv.raw(['HINCRBY', 'tkmc:arm:' + v, wat, String(n)]); } catch (e) {} }
async function adres(tok) { const s = await kv.raw(['HGET', 'tkmc:a', String(tok).slice(0, 16)]).catch(() => null); try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }
async function bewaar(a) { await kv.raw(['HSET', 'tkmc:a', a.tok, JSON.stringify(a)]); }

// ---------- import uit Henkjans Gmail (via Zernio) ----------
const ZK = () => process.env.ZERNIO_API_KEY || process.env.ZERNIO_KEY || '';
async function zApi(pad, { method = 'GET', body, raw = false } = {}) {
  const r = await fetch('https://zernio.com/api/v1' + pad, { method, headers: { authorization: 'Bearer ' + ZK(), 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(25000) });
  if (raw) return r; return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
}
const idVan = x => x && (x.id || x._id || x.accountId || x.messageId || (x.message && (x.message.id || x.message._id)) || (x.data && (x.data.id || x.data._id)));
const lijstVan = j => (j && (j.messages || j.threads || j.accounts || j.data || j.items)) || (Array.isArray(j) ? j : []);
async function zAccount() {
  if (process.env.ZERNIO_MAIL_ACCOUNT) return String(process.env.ZERNIO_MAIL_ACCOUNT).split(',')[0].trim();
  const k = await kv.get('cw:zacc').catch(() => null); if (k && Array.isArray(k.ids) && k.ids[0]) return k.ids[0]; if (!ZK()) return '';
  const r = await zApi('/accounts?limit=200'); const a = lijstVan(r.j).find(x => /mail|gmail|google|outlook|imap/i.test(String(x.platform || x.type || '')) && /@/.test(String(x.username || x.email || '')));
  return a ? String(idVan(a) || '') : '';
}
export function unzip(buf, wil) { // alleen wat nodig is: centrale map lezen, één bestand (stored of deflate) uitpakken
  let e = buf.length - 22; while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--; if (e < 0) throw new Error('geen zip');
  const n = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16);
  for (let i = 0; i < n; i++) {
    const meth = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const naam = buf.slice(p + 46, p + 46 + nl).toString('utf8'); p += 46 + nl + xl + cl;
    if (!wil.test(naam)) continue;
    const ln = buf.readUInt16LE(off + 26), lx = buf.readUInt16LE(off + 28), d = buf.slice(off + 30 + ln + lx, off + 30 + ln + lx + csize);
    return meth === 0 ? d.toString('utf8') : inflateRawSync(d).toString('utf8');
  }
  throw new Error('bestand niet in zip');
}
export function csv(tekst) { // RFC 4180: aanhalingstekens, komma's en regeleinden binnen een veld
  const rijen = []; let r = [], v = '', q = false;
  for (let i = 0; i < tekst.length; i++) { const c = tekst[i];
    if (q) { if (c === '"') { if (tekst[i + 1] === '"') { v += '"'; i++; } else q = false; } else v += c; continue; }
    if (c === '"') q = true; else if (c === ',') { r.push(v); v = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && tekst[i + 1] === '\n') i++; r.push(v); rijen.push(r); r = []; v = ''; } else v += c; }
  if (v || r.length) { r.push(v); rijen.push(r); }
  const kop = (rijen.shift() || []).map(x => x.replace(/^﻿/, '').trim());
  return rijen.filter(x => x.length > 1).map(x => Object.fromEntries(kop.map((k, i) => [k, x[i] || ''])));
}
export function selecteer(rows) {
  const uit = [], gezien = new Set();
  for (const r of rows) { const m = String(r['Email Address'] || '').trim().toLowerCase(), rt = N(r.MEMBER_RATING);
    if (!MAILRE.test(m) || gezien.has(m) || rt < 3) continue; gezien.add(m);
    uit.push({ m, n: String(r['First Name'] || '').trim().slice(0, 30), r: rt, j: String(r.OPTIN_TIME || r.CONFIRM_TIME || r.LAST_CHANGED || '').slice(0, 4) || '', t: String(r.TAGS || '').replace(/"/g, '').slice(0, 40) }); }
  for (let i = uit.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [uit[i], uit[k]] = [uit[k], uit[i]]; }
  return uit.sort((a, b) => b.r - a.r); // eerst de meest betrokken lezers (Mailchimp-score 5, dan 4, dan 3), binnen een score willekeurig
}
async function importeer() {
  if (N(await kv.raw(['LLEN', 'tkmc:rij']).catch(() => 0)) || await kv.get('tkmc:import').catch(() => null)) return { ok: false, fout: 'al geïmporteerd', import: await kv.get('tkmc:import').catch(() => null) };
  const acc = await zAccount(); if (!acc) return { ok: false, fout: 'geen mailbox in Zernio' };
  const s = await zApi('/email/messages?accountId=' + encodeURIComponent(acc) + '&limit=5&searchQueryNative=' + encodeURIComponent('subject:"Adressen Tania Kross" has:attachment'));
  const msg = lijstVan(s.j)[0]; if (!msg) return { ok: false, fout: 'mail met de export niet gevonden', status: s.status };
  let bij = msg.attachments, x = {}; if (!bij || !bij.length) { const r = await zApi('/email/messages/' + encodeURIComponent(idVan(msg)) + '?accountId=' + encodeURIComponent(acc)); x = r.j.message || r.j.data || r.j || {}; bij = x.attachments || []; }
  const z = (bij || []).find(b => /members_export.*\.zip$/i.test(String(b.filename || b.name || ''))); if (!z) return { ok: false, fout: 'zip niet in de mail', bijlagen: (bij || []).map(b => b.filename || b.name), velden: Object.keys(msg), veldenVol: Object.keys(x), onderwerp: msg.subject };
  const r = await zApi('/email/attachments/' + encodeURIComponent(z.id || z.attachmentId) + '?accountId=' + encodeURIComponent(acc) + '&messageId=' + encodeURIComponent(idVan(msg)), { raw: true });
  if (!r.ok) return { ok: false, fout: 'bijlage ' + r.status };
  const buf = Buffer.from(await r.arrayBuffer()); const rows = csv(unzip(buf, /^subscribed_members/i)); const sel = selecteer(rows);
  for (let i = 0; i < sel.length; i += 500) await kv.raw(['RPUSH', 'tkmc:rij', ...sel.slice(i, i + 500).map(x => JSON.stringify(x))]);
  const per = {}; for (const x of sel) per[x.r] = N(per[x.r]) + 1;
  const info = { at: Date.now(), bestand: z.filename || z.name, inExport: rows.length, inRij: sel.length, perScore: per }; await kv.set('tkmc:import', info); return { ok: true, ...info };
}

// ---------- versturen ----------
async function verstuur({ aan, onderwerp, tekst, tok }) {
  const acc = await zAccount(); if (!acc) return { ok: false, fout: 'geen mailbox gekoppeld in Zernio' };
  const stop = SITE + '/stop/' + tok;
  const body = { accountId: acc, to: [{ email: aan }], fromName: 'Henkjan de Krijger', subject: onderwerp, text: tekst, trackReplies: true, headers: { 'List-Unsubscribe': '<' + stop + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }, metadata: { stroom: 'tk-mailchimp', tok } };
  const r = await zApi('/email/messages', { method: 'POST', body });
  return r.ok ? { ok: true, id: String(idVan(r.j) || ''), draad: String((r.j && (r.j.threadId || (r.j.message && r.j.message.threadId))) || '') } : { ok: false, status: r.status, fout: 'zernio ' + r.status + ' ' + String((r.j && (r.j.error && (r.j.error.code || r.j.error.message) || r.j.message)) || '').slice(0, 80) };
}
const normaal = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
function gamma(k) { if (k < 1) return gamma(k + 1) * Math.pow(Math.random(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = normaal(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
async function armStand(R) { const o = {}; for (const i of R.armen) o['o' + i] = await hlees('tkmc:arm:o' + i); return o; }
export function kansSlechtst(S, n = 4000) { const k = Object.keys(S), w = Object.fromEntries(k.map(x => [x, 0])); for (let i = 0; i < n; i++) { let sl = null, sv = 2; for (const x of k) { const s = N(S[x].ja), v = N(S[x].verstuurd); const b = beta(s + 1, Math.max(0, v - s) + 1); if (b < sv) { sv = b; sl = x; } } w[sl]++; } for (const x of k) w[x] = Math.round(w[x] / n * 1000) / 1000; return w; }
function kiesArm(R, S) {
  const k = R.armen.map(i => 'o' + i), weinig = k.filter(x => N(S[x] && S[x].verstuurd) < 10);
  if (weinig.length) return weinig.sort((a, b) => N(S[a] && S[a].verstuurd) - N(S[b] && S[b].verstuurd))[0];
  let best = k[0], bv = -1; for (const x of k) { const s = N(S[x].ja), v = N(S[x].verstuurd); const b = beta(s + 1, Math.max(0, v - s) + 1); if (b > bv) { bv = b; best = x; } } return best;
}
export async function leerMoment(R) { // elke 20 verstuurde mails
  const S = await armStand(R), k = R.armen.map(i => 'o' + i); if (!k.every(x => N(S[x].verstuurd) >= 20)) return null;
  const P = kansSlechtst(S), [sl, p] = Object.entries(P).sort((a, b) => b[1] - a[1])[0];
  const genoeg = k.every(x => N(S[x].verstuurd) >= 60), r = x => N(S[x].ja) / Math.max(1, N(S[x].verstuurd));
  const weg = p >= 0.8 ? sl : genoeg ? k.slice().sort((a, b) => r(a) - r(b))[0] : null; if (!weg || R.volgende >= pool().length) return null;
  const blijf = k.find(x => x !== weg); R.armen = [N(blijf.slice(1)), R.volgende]; R.volgende++;
  const g = { dag: dagNL(), weg, blijf, kansSlechtst: P[weg], cijfers: Object.fromEntries(k.map(x => [x, N(S[x].ja) + ' ja op ' + N(S[x].verstuurd)])), nieuw: 'o' + R.armen[1] };
  R.gedaan = [...(R.gedaan || []), g].slice(-30); await kv.raw(['RPUSH', 'tkmc:lessen', JSON.stringify(g)]).catch(() => {}); return g;
}
async function volume(R) {
  let V = 0, B = 0, A = 0; for (let i = 0; i < 7; i++) { const t = await hlees('tkmc:tel:' + dagNL(Date.now() - i * 864e5)); V += N(t.verstuurd); B += N(t.bounce); A += N(t.stop); }
  if (V < 40) return null; const oud = R.perDag;
  if (B / V >= 0.08 || A / V >= 0.05) { R.perDag = Math.max(10, Math.floor(R.perDag / 2)); R.knopAt = Date.now(); }
  else if (B / V < 0.05 && A / V < 0.03 && Date.now() - N(R.knopAt) > 2 * 86400000 && R.perDag < R.max) { R.perDag = Math.min(R.max, R.perDag + 10); R.knopAt = Date.now(); }
  return oud !== R.perDag ? 'volume ' + oud + ' naar ' + R.perDag + ' per dag (' + B + ' bounces, ' + A + ' stops op ' + V + ')' : null;
}
const schoon = t => String(t || '').replace(/<br\s*\/?>|<\/p>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').split(/\n(?:op .{5,80} schreef|on .{5,80} wrote|-----|van:|from:)/i)[0].split('\n').filter(r => !/^\s*>/.test(r)).join('\n').replace(/[ \t]+/g, ' ').trim().slice(0, 600);
export function soortAntwoord(t) {
  const s = String(t || '').toLowerCase();
  if (/automatisch|afwezig|out of office|auto-?reply|met vakantie|niet aanwezig/.test(s) && s.length < 2500) return 'afwezig';
  if (/afmelden|uitschrijven|haal (me|mij) (eraf|van)|geen (mail|e-mail) meer|niet meer (mailen|op de lijst)|verwijder|\bnee\b|liever niet/.test(s)) return 'stop';
  if (/\bja\b|graag|blijf|houd me|hou me|leuk|natuurlijk|zeker|prima/.test(s)) return 'ja';
  return 'anders';
}
const vanAdres = x => (String((x && (x.from && (x.from.email || x.from.address || x.from)) || x.sender || '')).toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/) || [''])[0];
async function leesPost() { // antwoorden en bounces in Henkjans mailbox, laatste 21 dagen
  const acc = await zAccount(); if (!acc) return { gelezen: false };
  const toks = ((await kv.raw(['LRANGE', 'tkmc:gestuurd', '-400', '-1']).catch(() => [])) || []); const open = [];
  for (const t of toks) { const a = await adres(t); if (a && a.vo && Date.now() - a.vo < 21 * 86400000 && !a.antw && !a.bo && !a.ja && !a.stop) open.push(a); }
  const uit = { gelezen: true, antwoord: 0, bounce: 0 }, na = new Date(Date.now() - 22 * 86400000).toISOString();
  const zoek = async q => { const r = await zApi('/email/messages?accountId=' + encodeURIComponent(acc) + '&after=' + encodeURIComponent(na) + '&limit=50&searchQueryNative=' + encodeURIComponent(q)); return r.ok ? lijstVan(r.j) : []; };
  for (let i = 0; i < open.length; i += 15) { const deel = open.slice(i, i + 15); const L = await zoek('from:(' + deel.map(a => a.m).join(' OR ') + ')');
    for (const a of deel) { const m = L.find(x => vanAdres(x) === a.m); if (!m) continue;
      let t = m.text || m.snippet || m.body || ''; if (!m.text && idVan(m)) { const r = await zApi('/email/messages/' + encodeURIComponent(idVan(m)) + '?accountId=' + encodeURIComponent(acc) + '&clean=true'); const x = r.ok ? (r.j.message || r.j.data || r.j) : {}; t = (x.clean && x.clean.text) || x.text || x.html || t; }
      const soort = soortAntwoord(schoon(t)); if (soort === 'afwezig') continue;
      a.antw = { soort, t: schoon(t).slice(0, 300), at: Date.now() }; uit.antwoord++; await tel('antw-' + soort); await arm(a.v, 'antwoord');
      if (soort === 'ja' && !a.ja) await zegJa(a, 'antwoord'); else if (soort === 'stop') await zegStop(a); else await bewaar(a);
      await kv.raw(['RPUSH', 'tkmc:antw', a.tok]).catch(() => {}); } }
  const b = await zoek('from:(mailer-daemon OR postmaster) newer_than:3d'); const bs = JSON.stringify(b).toLowerCase();
  for (const a of open) if (!a.antw && !a.bo && bs.includes(a.m)) { a.bo = Date.now(); uit.bounce++; await bewaar(a); await tel('bounce'); await arm(a.v, 'bounce'); }
  return uit;
}
async function zegJa(a, hoe) {
  if (a.ja) return { al: true }; a.ja = Date.now(); a.jaHoe = hoe; await bewaar(a); await tel('ja'); await arm(a.v, 'ja');
  const v = pool()[N(String(a.v || 'o0').slice(1))] || {};
  try { const r = await fetch(SITE + '/api/lijst?a=aan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: a.m, v: v.gift || '', p: 'mailchimp-' + (a.v || 'o0'), lang: 'nl' }), signal: AbortSignal.timeout(15000) }); const j = await r.json().catch(() => ({})); a.lijst = j.al ? 'al' : (r.ok ? 'ok' : 'fout ' + r.status); await bewaar(a); return j; } catch (e) { a.lijst = 'fout'; await bewaar(a); return { fout: String(e.message).slice(0, 60) }; }
}
async function zegStop(a) { if (a.stop) return; a.stop = Date.now(); await bewaar(a); await tel('stop'); await arm(a.v, 'stop'); await kv.raw(['SADD', 'tkmc:af', hk(a.m)]).catch(() => {}); }
export async function wachtOp(R) { const w = []; if (!LIVE || !R.aan) w.push('Henkjans verstuur (LIVE en aan)'); if (!ZK()) w.push('ZERNIO_API_KEY in Vercel'); else if (!(await zAccount())) w.push('mailbox in Zernio'); if (!N(await kv.raw(['LLEN', 'tkmc:rij']).catch(() => 0))) w.push('import van de lijst (op=tkmc&import=1)'); return w; }

export async function ronde({ nu = Date.now(), droog = false } = {}) {
  const R = await regels(), w = await wachtOp(R); if (w.length && !droog) return { ok: true, wacht: w };
  const uur = uurNL(nu); if (!droog && (uur < 9 || uur > 20)) return { ok: true, rust: uur + 'u NL' };
  const uit = { ok: true, verstuurd: 0, fouten: [] };
  if (!droog) { uit.post = await leesPost().catch(e => ({ fout: String(e.message).slice(0, 80) }));
    if ((await kv.raw(['SET', 'tkmc:dag:' + dagNL(nu), '1', 'NX', 'EX', '90000']).catch(() => null)) === 'OK') { uit.volume = await volume(R); await zetRegels(R); } }
  const vandaag = await hlees('tkmc:tel:' + dagNL(nu)); const urenOver = Math.max(1, 21 - uur);
  let ruimte = Math.max(0, Math.min(R.perUur, Math.ceil((R.perDag - N(vandaag.verstuurd)) / urenOver)));
  const S = await armStand(R), pod = await podcast(); let P = null; try { P = await import('./postlus.js'); } catch (e) {}
  if (droog) { const l = ((await kv.raw(['LRANGE', 'tkmc:rij', '0', String(Math.max(0, ruimte - 1))]).catch(() => [])) || []); return { ...uit, zou: l.length, regels: R }; }
  while (ruimte > 0) {
    const s = await kv.raw(['LPOP', 'tkmc:rij']).catch(() => null); if (!s) { uit.rijLeeg = true; break; } let a; try { a = JSON.parse(s); } catch (e) { continue; }
    if (N(await kv.raw(['SISMEMBER', 'tkmc:af', hk(a.m)]).catch(() => 0))) continue;
    let tok = ''; for (let i = 0; i < 5; i++) { tok = randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, 'x').slice(0, 11); if (!N(await kv.raw(['HEXISTS', 'tkmc:a', tok]).catch(() => 1))) break; }
    const v = kiesArm(R, S), m = mailTekst(a, { arm: N(v.slice(1)), tok, pod });
    const g = P ? await P.meld({ project: 'tk-mailchimp', doel: 'Oude lezer van Tania Kross zegt ja tegen haar mail', aan: a.m, soort: 'klant', taal: 'nl', onderwerp: m.onderwerp, variant: v, lessen: 'doel-een-zin,kort,recht-voor-zn-raap,bereikbaar,alleen-echte-feiten', wie: 'tkmc' }).catch(() => null) : null;
    const r = await verstuur({ aan: a.m, onderwerp: m.onderwerp, tekst: m.tekst, tok });
    if (!r.ok) { uit.fouten.push(r.fout); await kv.raw(['LPUSH', 'tkmc:rij', s]); if (g && g.id) await P.uitkomst({ id: g.id, uitkomst: 'geen', toelichting: 'niet verstuurd: ' + r.fout }).catch(() => {}); break; }
    if (g && g.id) await P.uitkomst({ id: g.id, uitkomst: 'verstuurd' }).catch(() => {});
    Object.assign(a, { tok, v, vo: nu, zid: r.id, pid: g && g.id }); await bewaar(a); await kv.raw(['RPUSH', 'tkmc:gestuurd', tok]);
    await tel('verstuurd', 1, nu); await arm(v, 'verstuurd'); S[v] = S[v] || {}; S[v].verstuurd = N(S[v].verstuurd) + 1; uit.verstuurd++; ruimte--;
    const tot = N((await hlees('tkmc:tot')).verstuurd); if (tot % 20 === 0) { const l = await leerMoment(R); if (l) { uit.geleerd = l; await zetRegels(R); } }
    await new Promise(z => setTimeout(z, 3000 + Math.random() * 5000));
  }
  await kv.set('tkmc:laatste', { at: nu, ...uit }).catch(() => {});
  return uit;
}

export async function stand() {
  const R = await regels(), tot = await hlees('tkmc:tot'), S = await armStand(R), V = N(tot.verstuurd);
  const dagen = {}; for (let i = 0; i < 14; i++) { const d = dagNL(Date.now() - i * 864e5), t = await hlees('tkmc:tel:' + d); if (Object.keys(t).length) dagen[d] = t; }
  const L = [];
  if (V >= 60 && !N(tot.ja) && !N(tot.antwoord)) L.push({ lek: 'niemand zegt ja of antwoordt', cijfers: V + ' mails, 0 ja', gedaan: 'varianten wisselen elke 20 mails', oordeel: 'volgende 20 mails' });
  if (V >= 40 && N(tot.bounce) / V >= 0.08) L.push({ lek: 'veel bounces', cijfers: tot.bounce + ' op ' + V, gedaan: 'volume automatisch gehalveerd', oordeel: 'volgende dag' });
  if (N(tot.zie) >= 20 && N(tot.ja) / Math.max(1, N(tot.zie)) < 0.3) L.push({ lek: 'mensen openen de knoppagina maar zeggen geen ja', cijfers: tot.zie + ' bekeken, ' + N(tot.ja) + ' ja', gedaan: 'nog niets: knoppagina nakijken', oordeel: 'na 20 keer bekeken' });
  const perVariant = Object.fromEntries(Object.entries(S).map(([k, s]) => [k, { onderwerp: (pool()[N(k.slice(1))] || {}).o, ...s, jaPct: s.verstuurd ? Math.round(1000 * N(s.ja) / s.verstuurd) / 10 : 0 }]));
  return { ok: true, live: LIVE && R.aan, wachtOp: await wachtOp(R), regels: R, import: await kv.get('tkmc:import').catch(() => null), inRij: N(await kv.raw(['LLEN', 'tkmc:rij']).catch(() => 0)), totaal: tot, perVariant,
    kansSlechtst: R.armen.every(i => N(S['o' + i] && S['o' + i].verstuurd) > 0) ? kansSlechtst(S) : undefined, varianten: pool().map((v, i) => ({ id: 'o' + i, onderwerp: v.o })), lessen: ((await kv.raw(['LRANGE', 'tkmc:lessen', '-10', '-1']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return x; } }).reverse(), dagen, lekken: L, laatsteRonde: await kv.get('tkmc:laatste').catch(() => null) };
}

// ---------- pagina's (op taniakross.media/blijf/<tok> en /stop/<tok>, doorgestuurd vanuit simpele-site) ----------
const PAG = (titel, inhoud) => `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(titel)}</title><style>:root{--bg:#fff;--ink:#111113;--line:#E5E7EB}@media(prefers-color-scheme:dark){:root{--bg:#111113;--ink:#F3F4F6;--line:#2E2E33}}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}main{max-width:560px;margin:0 auto;padding:48px 18px}h1{font-size:28px;line-height:1.25;margin:0 0 14px}p{margin:0 0 16px}a{color:var(--ink)}button{min-height:52px;padding:0 26px;border:0;border-radius:999px;background:var(--ink);color:var(--bg);font:600 17px/1 inherit;cursor:pointer}.k{font-size:13px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px}</style></head><body><main><p class="k">Tania Kross</p>${inhoud}</main></body></html>`;
export async function tkmcOp({ req, res, q }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || ''), beschermd = /\.vercel\.app$/i.test(host), ua = String(req.headers['user-agent'] || '');
  const cron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(ua);
  const html = (t, x, code = 200) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(code).send(PAG(t, x)); };
  const tok = String(q.get('t') || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16), w = q.get('w');
  if (tok && (w === 'ja' || w === 'stop')) {
    const a = await adres(tok); if (!a) return html('Niet gevonden', '<h1>Deze link werkt niet</h1><p>Misschien is hij afgebroken in je mail. Meld je anders aan op <a href="' + SITE + '">taniakross.media</a>.</p>', 404);
    if (req.method === 'POST') { if (w === 'ja') await zegJa(a, 'knop'); else await zegStop(a); if (!/text\/html/.test(String(req.headers.accept || ''))) return res.status(200).json({ ok: true }); }
    if (req.method === 'POST' && w === 'ja') a.ja = a.ja || Date.now(); if (req.method === 'POST' && w === 'stop') a.stop = a.stop || Date.now();
    if (!a.zie && !/bot|crawl|spider|preview|scan|safe|proofpoint|mimecast|barracuda/i.test(ua)) { a.zie = Date.now(); await bewaar(a); await tel('zie'); await arm(a.v, 'zie'); }
    const doe = `<script>fetch(location.pathname+location.search,{method:'POST'}).then(function(r){if(r.ok){document.getElementById('d').hidden=false;document.getElementById('f').hidden=true}})</script>`;
    if (w === 'ja') return html('Je blijft op de lijst', a.ja ? '<h1>Je staat op de lijst</h1><p>Je hoort het als er een nieuwe aflevering van A Kross … is. Kijk alvast op <a href="' + SITE + '/podcast">taniakross.media/podcast</a>.</p>'
      : `<div id="f"><h1>Blijf je op de lijst van Tania Kross?</h1><form method="post"><button type="submit">Ja, ik blijf</button></form></div><div id="d" hidden><h1>Fijn, je blijft op de lijst</h1><p>Kijk in je mail: je krijgt meteen een bericht van Tania. Daarna hoor je het als er een nieuwe aflevering van A Kross … is.</p><p><a href="${SITE}/podcast">Luister alvast naar de podcast</a></p></div>${doe}`);
    return html('Afgemeld', a.stop ? '<h1>Je staat er niet meer op</h1><p>Je krijgt geen mail meer van ons. Vragen? Bel of app Henkjan: 06 55395630.</p>'
      : `<div id="f"><h1>Wil je geen mail meer?</h1><form method="post"><button type="submit">Haal me eraf</button></form></div><div id="d" hidden><h1>Je staat er niet meer op</h1><p>Je krijgt geen mail meer van ons. Vragen? Bel of app Henkjan: 06 55395630.</p></div>${doe}`);
  }
  if (beschermd || cron) { if (q.get('ronde') === '1') return res.status(200).json(await ronde({ droog: q.get('droog') === '1' })); }
  if (!beschermd) return res.status(404).send('Niet gevonden');
  if (q.get('import') === '1') return res.status(200).json(await importeer());
  if (q.get('stand') === '1') return res.status(200).json(await stand());
  if (q.get('zet') === '1') { const R = await regels(), ok = []; // alleen op Henkjans woord (in de chat)
    if (q.has('aan')) { R.aan = q.get('aan') === '1'; ok.push('aan=' + R.aan); } if (q.has('perDag')) { R.perDag = Math.max(1, Math.min(R.max, N(q.get('perDag')) || R.perDag)); ok.push('perDag=' + R.perDag); }
    await zetRegels(R); return res.status(200).json({ ok: true, gezet: ok, regels: R }); }
  if (q.get('uitdager')) { const R = await regels(); let v; try { v = JSON.parse(q.get('uitdager')); } catch (e) { return res.status(400).json({ fout: 'uitdager={"o":"onderwerp","t":"tekst met {aanhef} {jaar} {ja} {stop}"}' }); }
    if (!v || !v.o || !v.t || !/\{ja\}/.test(v.t) || !/\{stop\}/.test(v.t) || String(v.o).length > 60 || /—|–/.test(v.o + v.t)) return res.status(400).json({ fout: 'onderwerp hooguit 60 tekens, tekst met {ja} en {stop}, geen gedachtestreepjes' });
    R.extra = [...(R.extra || []), { o: String(v.o), t: String(v.t).slice(0, 1400) + (/Henkjan de Krijger/.test(v.t) ? '' : ONDER), gift: v.gift === 'g1' ? 'g1' : '' }].slice(-20); await zetRegels(R); return res.status(200).json({ ok: true, varianten: pool().length }); }
  if (q.get('leer') === '1') { const ids = ((await kv.raw(['LRANGE', 'tkmc:antw', '-40', '-1']).catch(() => [])) || []), l = []; for (const t of ids) { const a = await adres(t); if (a && a.antw) l.push({ variant: a.v, score: a.r, jaar: a.j, soort: a.antw.soort, tekst: a.antw.t }); } return res.status(200).json({ ok: true, antwoorden: l.reverse(), stand: await stand() }); }
  if (q.get('voorbeeld') === '1') { const R = await regels(), pod = await podcast(); const l = ((await kv.raw(['LRANGE', 'tkmc:rij', '0', '1']).catch(() => [])) || []).map(x => JSON.parse(x)); if (!l.length) l.push({ n: 'Marieke', j: '2018' });
    let x = '<h1>Zo gaat de mail de deur uit</h1>'; for (const a of l) for (const i of R.armen) { const m = mailTekst(a, { arm: i, tok: 'VOORBEELD', pod }); x += `<p><b>Variant o${i}</b> · aan …@${esc(String(a.m || 'voorbeeld.nl').split('@')[1] || '')} · score ${esc(a.r || '')}<br><b>Onderwerp:</b> ${esc(m.onderwerp)}</p><pre style="white-space:pre-wrap;border:1px solid var(--line);border-radius:12px;padding:14px;font:15px/1.5 inherit">${esc(m.tekst)}</pre>`; }
    return html('Voorbeeld', x); }
  return res.status(200).json(await stand());
}
