// WAM leert drie dingen extra (Henkjan 12 nov 2026, 19:11 UTC):
// 1. "Vind minste info om een goede match te maken. Dat moet echt zeer lerend zijn." -> vraagbeleid per soort en per vraag
// 2. "Ik wil ook dat je leert over wat voor usecases ze proberen" -> usecaseregister met gaten (vraag zonder aanbod) en wat WAM niet snapt
// 3. "en ik wil ook dat je goed beveiligt als er vandalen tussen zitten" -> inhoudscheck, tempo, strafpunten, blokkeren en melden
import { kv } from './db.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dag = () => new Date().toISOString().slice(0, 10);
function gamma(k) { if (k < 1) return gamma(1 + k) * Math.pow(Math.random(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { const u1 = Math.random(), u2 = Math.random(); x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - 0.0331 * x * x * x * x) return d * v; if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
async function hget(k) { const r = await kv.raw(['HGETALL', k]).catch(() => []); const o = {}; const a = Array.isArray(r) ? r : Object.entries(r || {}).flat(); for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = N(a[i + 1]); return o; }
const inc = (k, f, n = 1) => kv.raw(['HINCRBY', k, f, String(n)]).catch(() => {});

// ---------- 1. vraagbeleid: welke vragen zijn nodig voor een goede match ----------
// Per soort (kant|soort, bijv. zoekt|woning) en per vraag (wat, waar, budget, wanneer) twee armen: v = vragen, s = overslaan.
// Telling in wam:vb als kw|veld|arm|f, plus samengevoegd over alle soorten als *|veld|arm|f (leert sneller bij weinig verkeer):
// g gestart, q gevraagd, b beantwoord, m gemaakt, c contact getikt bij een match, j echt contact van twee kanten, n slechte match
// (past niet, niet geïnteresseerd, nee), r reden van past niet (welke vraag het verschil maakte).
// Beloning: goed contact (c, j dubbel, een beetje voor gemaakt), straf: slechte match (dubbel), en een overgeslagen vraag die de
// reden van past niet was nog eens dubbel. Afhakers tellen vanzelf als mislukt. Verkennen tot 12 per arm (soort plus deel van het
// geheel), daarna Thompson met 10% blijven proberen. 'wat' wordt altijd gevraagd als het ontbreekt, en een vraag die eerder de reden
// van past niet was wordt bij het opnieuw zoeken altijd gevraagd.
export const VB_ESS = { 'zoekt|woning': ['budget', 'waar', 'wanneer'], 'biedt|woning': ['budget', 'waar', 'wanneer'], 'zoekt|baan': ['wat', 'waar'], 'biedt|baan': ['wat', 'waar'], 'zoekt|dienst': ['wat', 'waar', 'wanneer'], 'biedt|dienst': ['wat', 'waar', 'budget'], 'zoekt|iets': ['wat', 'budget', 'waar'], 'biedt|iets': ['wat', 'budget', 'waar'], 'zoekt|iemand': ['wat', 'waar'] };
const VB_MIN = 12;
function vbS(h, kw, v, a) { const g = f => N(h[kw + '|' + v + '|' + a + '|' + f]); return { g: g('g'), q: g('q'), b: g('b'), m: g('m'), c: g('c'), j: g('j'), n: g('n') }; }
function vbMix(h, kw, v, a) { const x = vbS(h, kw, v, a), p = vbS(h, '*', v, a), w = Math.min(1, 15 / Math.max(1, p.g)); const mix = f => x[f] + w * Math.max(0, p[f] - x[f]); return { g: mix('g'), ok: mix('c') + 2 * mix('j') + 0.15 * mix('m'), bad: 2 * mix('n') }; }
function vbArm(h, kw, v) {
  const vr = vbMix(h, kw, v, 'v'), sk = vbMix(h, kw, v, 's');
  if (vr.g < VB_MIN || sk.g < VB_MIN || Math.random() < 0.1) return Math.random() < 0.5 ? 'v' : 's';
  const sc = o => beta(1 + o.ok, 1 + Math.max(0, o.g - o.ok) + o.bad);
  return sc(vr) >= sc(sk) ? 'v' : 's';
}
// volgorde: wat altijd eerst; daarna de vraag die het vaakst beantwoord wordt en het vaakst de reden van past niet was
function vbVolgorde(h, kw) {
  const ess = VB_ESS[kw] || ['wat', 'waar'];
  const w = v => { const q = N(h['*|' + v + '|v|q']), b = N(h['*|' + v + '|v|b']), r = N(h[kw + '|' + v + '|*|r']) + 0.3 * N(h['*|' + v + '|*|r']); return (q >= 15 ? b / q : 0.7) + 0.1 * Math.min(5, r); };
  return [...ess].sort((a, b) => (a === 'wat' ? -9 : b === 'wat' ? 9 : w(b) - w(a)));
}
export async function kiesVb() {
  const h = await hget('wam:vb'), uit = {};
  for (const kw of Object.keys(VB_ESS)) { const o = { _o: vbVolgorde(h, kw) }; for (const v of VB_ESS[kw]) o[v] = vbArm(h, kw, v); uit[kw] = o; }
  return uit;
}
export async function telVb(kw, veld, arm, f, test, n = 1) { if (test || !kw || !veld || !arm) return; await inc('wam:vb', kw + '|' + veld + '|' + arm + '|' + f, n); await inc('wam:vb', '*|' + veld + '|' + arm + '|' + f, n); }
// events die regelAntwoord synchroon verzamelt in s.vbEv ([kw, veld, arm, f]) wegschrijven
export async function vbFlush(s, test) { const ev = s.vbEv || []; s.vbEv = []; for (const [kw, v, a, f] of ev) await telVb(kw, v, a, f, test); }
// per gemaakt item onthouden welke armen golden, zodat een latere uitkomst (ook van de ander, ook in een ander kanaal) telt
export async function vbItem(k, kw, armen, test) { if (test || !k || !kw || !armen) return; const a = {}; for (const v of VB_ESS[kw] || []) a[v] = armen[v] || 'v'; await kv.set('wam:vbi:' + k, { kw, a }, { ex: 30 * 86400 }).catch(() => {}); }
export async function vbUitkomst(k, f, reden, test) {
  if (test || !k) return; const x = await kv.get('wam:vbi:' + k).catch(() => null); if (!x || !x.kw) return;
  const gezien = await kv.raw(['SET', 'wam:vbu:' + k + ':' + f, '1', 'NX', 'EX', String(30 * 86400)]).catch(() => 'OK'); if (!gezien && f !== 'n') return; // c en j eenmaal per item
  for (const [v, a] of Object.entries(x.a || {})) await telVb(x.kw, v, a, f, false, f === 'n' && reden === v && a === 's' ? 3 : 1);
  if (reden) await telVb(x.kw, reden, '*', 'r', false);
  await ucUit(x.kw, k, f);
}
export async function vbStand() {
  const h = await hget('wam:vb'), uit = {};
  for (const kw of ['*', ...Object.keys(VB_ESS)]) {
    const velden = kw === '*' ? ['wat', 'waar', 'budget', 'wanneer'] : VB_ESS[kw], o = {};
    for (const v of velden) { const V = vbS(h, kw, v, 'v'), S = vbS(h, kw, v, 's'); if (!V.g && !S.g && !V.q) continue; o[v] = { vragen: V, overslaan: S, reden_past_niet: N(h[kw + '|' + v + '|*|r']), contact_per_100: { vragen: V.g ? Math.round(100 * (V.c + 2 * V.j) / V.g) : null, overslaan: S.g ? Math.round(100 * (S.c + 2 * S.j) / S.g) : null }, beantwoord_pct: V.q ? Math.round(100 * V.b / V.q) : null }; }
    if (Object.keys(o).length) uit[kw] = o;
  }
  return uit;
}

// ---------- 2. usecases: wat proberen mensen met WAM ----------
// Elk gemaakt item krijgt een label: land, kant|soort en een onderwerp (twee kernwoorden uit wat). wam:uc telt per label
// n gemaakt, m meteen een match, c contact getikt, j echt contact, x past niet; wam:ucd:<dag> telt nieuwe items per dag.
// Wat WAM niet snapt (geen regel past, getypt) gaat zonder cijfers, mail of links in wam:ucvrij (laatste 300) en woorden in wam:ucwoord.
const STOP = new Set('a an the and or for to of in on at with my me i im i\'m am is are be need want looking look search searching seeking would like some any someone something new good cheap near nearby here please hi hello hey under over around about max per month week day hour euro euros dollar dollars bucks asap now today urgent urgently help een de het en of voor naar van in op met mijn ik zoek wil heb nodig iets iemand nieuwe goede goedkoop buurt hier graag hoi hallo onder boven rond per maand week dag uur ein eine der die das und oder für mit ich suche will brauche'.split(' '));
export function ucOnderwerp(wat) {
  const w = String(wat || '').toLowerCase().replace(/https?:\S+/g, ' ').replace(/[^a-zà-ÿ\s'-]/g, ' ').split(/\s+/).map(x => x.replace(/^['-]+|['-]+$/g, '')).filter(x => x.length > 2 && !STOP.has(x));
  return w.slice(0, 2).map(x => (x.length > 4 && x.endsWith('s') && !x.endsWith('ss') ? x.slice(0, -1) : x)).join(' ') || 'overig';
}
const ucSleutel = (land, kw, wat) => String(land || 'XX').toUpperCase().slice(0, 2) + '|' + kw + '|' + ucOnderwerp(wat);
export async function ucIn(k, land, kw, wat, test) {
  if (test) return; const s = ucSleutel(land, kw, wat); await inc('wam:uc', s + '|n');
  const d = 'wam:ucd:' + dag(); await inc(d, s); kv.raw(['EXPIRE', d, String(35 * 86400)]).catch(() => {});
  if (k) await kv.set('wam:uck:' + k, s, { ex: 30 * 86400 }).catch(() => {});
}
async function ucUit(kw, k, f) { const s = await kv.get('wam:uck:' + k).catch(() => null); if (s) await inc('wam:uc', s + '|' + ({ n: 'x' }[f] || f)); }
export async function ucMatch(k, test) { if (test || !k) return; const s = await kv.get('wam:uck:' + k).catch(() => null); if (s) await inc('wam:uc', s + '|m'); }
const anoniem = t => String(t || '').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[mail]').replace(/https?:\S+|www\.\S+/gi, '[link]').replace(/\+?\d[\d\s().-]{5,}\d/g, '[nr]').replace(/\s+/g, ' ').trim().slice(0, 120);
export async function ucVrij(tekst, ctx, test) {
  if (test) return; const x = anoniem(tekst); if (x.length < 4) return;
  await kv.raw(['RPUSH', 'wam:ucvrij', JSON.stringify({ t: Date.now(), land: (ctx && ctx.land) || '', taal: (ctx && ctx.taal) || '', kanaal: (ctx && ctx.kanaal) || 'web', x })]).catch(() => {});
  kv.raw(['LTRIM', 'wam:ucvrij', '-300', '-1']).catch(() => {});
  for (const w of new Set(ucOnderwerp(x).split(' '))) if (w && w !== 'overig') await inc('wam:ucwoord', ((ctx && ctx.land) || 'XX') + '|' + w);
}
export async function ucStand({ metVoorbeelden = false } = {}) {
  const h = await hget('wam:uc'), per = {};
  for (const [k, n] of Object.entries(h)) { const d = k.split('|'); if (d.length !== 5) continue; const id = d.slice(0, 4).join('|'); (per[id] = per[id] || { land: d[0], kant: d[1], soort: d[2], onderwerp: d[3] })[d[4]] = n; }
  const lijst = Object.values(per).map(u => Object.assign(u, { n: N(u.n), m: N(u.m), c: N(u.c), j: N(u.j), x: N(u.x) })).sort((a, b) => b.n - a.n);
  // gaten: wat gezocht wordt zonder aanbod in hetzelfde land (en omgekeerd): daar moet aanbod of vraag bij komen
  const heeft = new Set(lijst.map(u => u.land + '|' + u.kant + '|' + u.soort + '|' + u.onderwerp)), tegen = k => (k === 'zoekt' ? 'biedt' : 'zoekt');
  const gaten = lijst.filter(u => u.n >= 2 && !heeft.has(u.land + '|' + tegen(u.kant) + '|' + u.soort + '|' + u.onderwerp) && !(u.soort === 'woning' || u.soort === 'baan') ).slice(0, 15).map(u => ({ land: u.land, mist: tegen(u.kant), soort: u.soort, onderwerp: u.onderwerp, vraag: u.n }));
  const soortGat = {}; for (const u of lijst) { const k = u.land + '|' + u.soort; (soortGat[k] = soortGat[k] || { zoekt: 0, biedt: 0 })[u.kant] = N((soortGat[k] || {})[u.kant]) + u.n; }
  const woord = await hget('wam:ucwoord'); const nieuw = Object.entries(woord).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, n]) => ({ land: k.split('|')[0], woord: k.split('|')[1], n }));
  const dg = await hget('wam:ucd:' + dag());
  const uit = { totaal: lijst.reduce((s, u) => s + u.n, 0), vandaag: Object.values(dg).reduce((s, n) => s + n, 0), top: lijst.slice(0, 40), gaten, vraag_aanbod_per_soort: soortGat, niet_begrepen_woorden: nieuw };
  if (metVoorbeelden) { const r = await kv.raw(['LRANGE', 'wam:ucvrij', '-40', '-1']).catch(() => []); uit.niet_begrepen = (r || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean).reverse(); }
  return uit;
}

// ---------- 3. veiligheid tegen vandalen ----------
// Inhoud: alleen gewone, legale dingen tussen mensen. Ernst 3 = meteen blokkeren, 2 = weigeren en strafpunt, 1 = weigeren zonder straf.
const ONVEILIG = [
  // jong (Henkjan 13 nov 13:37 UTC over Delhi: "Hoe ga je daar mee om? Die modereer je?"): signalen van kinderen (gamecodes, leeftijd onder 18, schoolklas). WAM koppelt vreemden,
  // dus bij deze signalen: geen matching, geen contactvraag, geen doorsturen, voor de rest van het gesprek (s.jong) en het profiel (p.jong)
  ['jong', 1, /\b(roblox|robux|free ?fire|ff diamonds?|diamonds? (top ?up|free|chahiye)|redeem ?codes?|gift ?codes? for (games?|roblox|free fire)|v-?bucks|(i am|i'm|im|me) (in )?(class|std|standard|grade) ?([1-9]|1[0-2])\b|(i am|i'm|im) (in )?([5-9]|1[0-2])(st|nd|rd|th) (class|grade|std|standard)|i(?:'| a)?m (1[0-7]|[5-9]) ?(years?|yrs?|y\/?o)\b|my age is (1[0-7]|[5-9])\b|my (mom|mum|mummy|papa|dad) (won'?t|doesn'?t) (let|give|buy)|ik ben (1[0-7]|[5-9]) jaar|ik zit in (groep [5-8]|de brugklas))\b/i],
  ['minderjarig', 3, /\b(pthc|loli|lolita|jailbait|kiddie porn|child porn|kinderporno)\b/i],
  ['minderjarig', 2, /\b(child|children|kids?|minors?|underage|teens?|young girls?|young boys?|schoolgirls?|kinderen|minderjarig\w*)\b[^.]{0,40}\b(sexy|sexual|nudes|naked|erotic|seksueel|naakt|bloot)\b|\b(sexy|sexual|nudes|naked|erotic|seksueel|naakt)\b[^.]{0,40}\b(child|children|kids?|minors?|underage|teens?|young girls?|schoolgirls?|kinderen|minderjarig\w*)\b/i],
  ['seks', 2, /\b(girls? (can |pls |please |plz )?(text|call|chat|message|dm|msg) me|need (a )?(gf|girl ?friend|girl|bf) (for|to) (chat|fun|night|sex)|xxx|sex videos?|nude videos?|bf videos?|dikhao|gand|chut|lund|chudai|sexy (girls?|chat|video)|hot girls?|lonely (girls?|bhabhi)|bhabhi (number|chat)|escort (service|girl|agency)s?|escorts|sugar ?(daddy|baby|mommy)|send nudes|nudes|onlyfans|only fans|sexting|hook ?up for (money|cash)|sex (for|work|chat)|happy ending|erotic massage|prostitut\w*|call ?girls?|hookers?|nsfw|porn\w*|seks ?(werk|date|contact|tegen)|erotische massage|hoer\w*|sexdate)\b/i],
  ['drugs', 2, /\b(cocaine|crystal meth|meth|heroin|fentanyl|mdma|xtc|ecstasy|lsd|ketamine|oxycodone|oxycontin|percocet|xanax|adderall|shrooms|weed plug|plug for (weed|coke|pills)|drugs? (for sale|te koop|verkopen|dealer)|cocaïne|speed te koop|wiet te koop|harddrugs|pills? for sale)\b/i],
  ['wapens', 2, /\b((?<!(glue|nail|water|heat|spray|massage|caulk|caulking|staple|nerf|toy|paint|grease|tattoo|lijm|kit|nietjes) )guns? (for sale|te koop)|handguns?|firearms?|pistols?|glock|rifles?|ammo|ammunition|ar-?15|ak-?47|silencers?|vuurwapen\w*|pistool|geweer|munitie|schusswaffe\w*)\b/i],
  ['oplichting', 2, /\b(crypto (invest\w*|signals?|trading group)|forex (signals?|trading)|double your (money|investment)|guaranteed (profit|returns?)|investment opportunity|western union|moneygram|cash ?app flip|fake (id|ids|passport|documents?|diploma)|bank (login|account for rent)|verification code|send (me )?(the|your) code|otp code|loan (with|without) (no )?credit check|recover (your )?(lost )?funds|bitcoin doubl\w*|money mule|valse? (id|paspoort|papieren|diploma)|verificatiecode|stuur (me )?(de|je) code|snel rijk)\b/i],
  ['riskant', 1, /\b(gift ?cards?|cadeaukaart\w*|itunes cards?|steam cards?|pay (upfront|in advance) via|vooraf betalen via)\b/i],
  ['dreiging', 2, /\b(kill (you|u|yourself|urself)|kys|i will (kill|hurt|find) you|shoot (you|up)|ik maak je dood|ik vermoord|ik weet waar je woont|i know where you live)\b/i],
  ['schelden', 2, /\b(n[i1]gg(a|er)s?|f[a4]gg?ots?|k[a4]nker(lijer|hoer|mongool|homo|turk|marokkaan|zooi|wijf|joden?)|kk ?(hoer|lijer|mongool)|tyfus(lijer|hoer)|tering(lijer|hoer)|retard(ed|s)?|cunt|whore|slut|kut ?(wijf|marokkaan|turk))\b/i],
  ['prive_persoon', 1, /\b(track (location|phone|number|someone'?s?)|location of (this|a) (number|phone)|find (my )?(ex|girlfriend|boyfriend|wife|husband)|where (does|do) .{1,30} live|home address of|address of (my|this|that)|track (my|someone|a person)|spy on|stalk\w*|waar woont|adres van (mijn|deze|die)|ex terugvinden)\b/i],
];
export function veilig(tekst) {
  const t = String(tekst || ''); if (!t.trim()) return null;
  for (const [reden, ernst, re] of ONVEILIG) if (re.test(t)) return { reden, ernst };
  // onzin en flood: toetsenbordrammen, één teken herhaald, bijna geen letters
  const l = t.replace(/[^a-zà-ÿ]/gi, ''); if (t.length >= 12 && ((!/\d/.test(t) && l.length / t.length < 0.35) || /(.)\1{7,}/.test(t) || /[bcdfghjklmnpqrstvwxz]{9,}/i.test(t))) return { reden: 'onzin', ernst: 1 };
  return null;
}
// tempo per afzender (vid, WhatsApp-hash of ip-hash): per minuut en per dag; boven de grens niets meer verwerken
export async function tempoOk(wie, { perMin = 12, perDag = 200 } = {}) {
  if (!wie) return true; const m = Math.floor(Date.now() / 60000), km = 'wam:tm:' + wie + ':' + m, kd = 'wam:td:' + dag() + ':' + wie;
  const [a, b] = await Promise.all([kv.incr(km).catch(() => 0), kv.incr(kd).catch(() => 0)]);
  if (N(a) === 1) kv.raw(['EXPIRE', km, '120']).catch(() => {}); if (N(b) === 1) kv.raw(['EXPIRE', kd, '90000']).catch(() => {});
  if (N(a) > perMin || N(b) > perDag) { if (N(a) === perMin + 1) await inc('wam:veilig', dag() + '|tempo'); return false; }
  return true;
}
// hoeveel nieuwe items iemand per dag mag maken (spam van nepaanbod)
export async function itemsOk(vid, test, max = 8) { if (test || !vid) return true; const k = 'wam:itd:' + dag() + ':' + vid; const n = N(await kv.incr(k).catch(() => 0)); if (n === 1) kv.raw(['EXPIRE', k, '90000']).catch(() => {}); if (n > max) { await inc('wam:veilig', dag() + '|items'); return false; } return true; }
export async function geblokt(vid) { if (!vid) return false; return N(await kv.raw(['SISMEMBER', 'wam:blok', vid]).catch(() => 0)) === 1; }
async function blokSet() { const r = await kv.raw(['SUNION', 'wam:blok', 'wam:repstop']).catch(() => []); return new Set(Array.isArray(r) ? r : []); } // ook wie door 2 verschillende mensen gemeld is (reputatie)
export { blokSet };
// strafpunt; bij 3 punten (of ernst 3) blokkeren: items uit de matchlijst, geen berichten meer naar anderen, geen antwoord meer
export async function straf(vid, reden, ernst, test) {
  if (test || !vid) return { blok: false };
  await inc('wam:veilig', dag() + '|' + reden); const n = N(await kv.raw(['HINCRBY', 'wam:straf', vid, String(ernst >= 3 ? 3 : 1)]).catch(() => 0));
  if (n < 3) return { blok: false, punten: n };
  const nieuw = N(await kv.raw(['SADD', 'wam:blok', vid]).catch(() => 0)) === 1;
  if (nieuw) { await kv.raw(['HSET', 'wam:blokreden', vid, JSON.stringify({ t: Date.now(), reden })]).catch(() => {}); await inc('wam:veilig', dag() + '|geblokt'); }
  return { blok: true, nieuw, punten: n };
}
// iemand meldt de ander (report, spam, scam): telt als strafpunt voor de ander; twee meldingen van verschillende mensen = blok
export async function meldAnder(van, ander, test) {
  if (test || !van || !ander) return { blok: false };
  const nieuw = N(await kv.raw(['SADD', 'wam:gemeld:' + ander, van]).catch(() => 0)) === 1; if (!nieuw) return { blok: false };
  const n = N(await kv.raw(['SCARD', 'wam:gemeld:' + ander]).catch(() => 0)); await inc('wam:veilig', dag() + '|gemeld');
  return straf(ander, 'gemeld', n >= 2 ? 3 : 1, false);
}
export const MELD_RE = /^(report|report (them|this|him|her|it)|spam|scam|scammer|block|block (them|this)|fake|melden|meld|blokkeer|nep|oplichter|oplichting|melden als spam)\W*$/i;
export async function veiligStand() {
  const h = await hget('wam:veilig'), per = {}; for (const [k, n] of Object.entries(h)) { const [d, r] = k.split('|'); (per[d] = per[d] || {})[r] = n; }
  const dagen = Object.keys(per).sort().slice(-7); const o = {}; for (const d of dagen) o[d] = per[d];
  return { per_dag: o, geblokt: N(await kv.raw(['SCARD', 'wam:blok']).catch(() => 0)) };
}

// ---------- 4. WhatsApp-start: waarom stuurt niemand het eerste bericht ----------
// Henkjan 12 nov 19:47 UTC: "Zoek uit waarom niemand via whatsapp in gesprek gaat ... als je 1e bericht naar WAM stuurt moet duidelijk zijn
// waarom en wat je terug kan verwachten. Dat antwoord geeft ze CTA en/of inspiratie ... Leer per 10 interacties geslaagd of niet geslaagd!
// Sla alle data op en voer snel verbeterpunten door."
// Om 19:47 UTC: 160 getoond, 33 tikken, 0 aangekomen. Varianten: w0 = oude pagina (opener-peiling, bericht met alleen de code) als controle;
// w1-w3 = uitleg wat WAM doet en wat je terugkrijgt, knoppen per wens, en een ingevuld bericht dat zelf zegt wat je wilt.
export const WAV = {
  w1: { en: { x: 'WAM is a free matchmaker on WhatsApp. Tap what you need or offer, hit send, and WAM replies within a minute with people near you. Anonymous, stop anytime.', pre: w => 'Hi WAM! ' + w + '. Who near me fits?' },
        nl: { x: 'WAM is een gratis matchmaker op WhatsApp. Tik wat je zoekt of aanbiedt, druk op versturen en WAM antwoordt binnen een minuut met mensen bij jou in de buurt. Anoniem, stoppen kan altijd.', pre: w => 'Hoi WAM! ' + w + '. Wie in de buurt past?' } },
  w2: { en: { x: 'Get matched on WhatsApp in one minute. Pick one, hit send, WAM tells you who near you fits. Free and anonymous.', pre: w => w },
        nl: { x: 'Binnen een minuut gematcht op WhatsApp. Kies er een, druk op versturen, WAM zegt wie bij jou in de buurt past. Gratis en anoniem.', pre: w => w } },
  w3: { en: { x: 'What do you need this week? Tell WAM on WhatsApp and it finds someone near you who has it, or who needs what you offer. WhatsApp is free worldwide, WAM is free too.', pre: w => 'Hi WAM! ' + w + '. What can you find for me?' },
        nl: { x: 'Wat heb je deze week nodig? Zeg het tegen WAM op WhatsApp en hij vindt iemand bij jou in de buurt die het heeft, of die zoekt wat jij biedt. Gratis.', pre: w => 'Hoi WAM! ' + w + '. Wat kun je voor me vinden?' } },
};
export const WAWENS = {
  en: [['A room or place to live', 'I need a room or a place to live'], ['Work', 'I am looking for work'], ['Help with a task', 'I need help with a repair, moving or cleaning'], ['Buy something', 'I want to buy something'], ['I offer something', 'I offer a service or something for sale']],
  nl: [['Een kamer of woning', 'Ik zoek een kamer of woning'], ['Werk', 'Ik zoek werk'], ['Hulp bij een klus', 'Ik zoek hulp bij een reparatie, verhuizing of schoonmaak'], ['Iets kopen', 'Ik wil iets kopen'], ['Ik bied iets aan', 'Ik bied een dienst of iets te koop aan']],
};
// wat er na de code van het ingevulde bericht overblijft weer schoon maken voor de regels
export const waSchoon = t => String(t || '').replace(/^(hi|hey|hello|hoi|hallo)\s+wam[!,.]?\s*/i, '').replace(/[.\s]*(who near me fits\?|what can you find for me\?|wie in de buurt past\?|wat kun je voor me vinden\?)\s*$/i, '').trim();
const WV = ['w0', 'w1', 'w2', 'w3'];
// per variant leren in blokken van 10 (getoond); succes = aangekomen in WhatsApp, gesprek telt dubbel. Eerst elke variant 10 keer, dan Thompson.
export async function kiesWaV() {
  const h = await hget('wam:wav'); const g = v => N(h[v + '|toon']); const weinig = WV.filter(v => g(v) < 10);
  if (weinig.length) return weinig[Math.floor(Math.random() * weinig.length)];
  let best = 'w1', bs = -1; for (const v of WV) { const ok = N(h[v + '|aan']) + 2 * N(h[v + '|dialoog']); const sc = beta(1 + ok, 1 + Math.max(0, g(v) - ok)); if (sc > bs) { bs = sc; best = v; } } return best;
}
// elke stap van elke WhatsApp-start bewaren (wam:walog, laatste 5000) plus tellers per variant en segment; elke 10 getoond per variant een blok
export async function waLog(s, e, test) {
  if (test || !s) return; const v = s.waV || 'w0', c = s.ctx || {}, segs = ['app:' + (c.app || (c.mobiel ? 'browser' : 'desktop')), 'os:' + (c.os || '?'), 'land:' + (c.land || '?')];
  await kv.raw(['RPUSH', 'wam:walog', JSON.stringify({ t: Date.now(), sid: s.sid, v, e, app: c.app || '', os: c.os || '', land: c.land || '', taal: c.taal || '' })]).catch(() => {}); kv.raw(['LTRIM', 'wam:walog', '-5000', '-1']).catch(() => {});
  const n = N(await kv.raw(['HINCRBY', 'wam:wav', v + '|' + e, '1']).catch(() => 0)); for (const sg of segs) await inc('wam:waseg', v + '|' + sg + '|' + e);
  if (e === 'toon' && n % 10 === 0) { const h = await hget('wam:wav'), vorig = await kv.get('wam:wablokv:' + v).catch(() => null) || {}; const nu = {}; for (const f of ['toon', 'tik', 'open', 'geenapp', 'terug', 'aan', 'dialoog']) nu[f] = N(h[v + '|' + f]); const blok = { t: Date.now(), v }; for (const f of Object.keys(nu)) blok[f] = nu[f] - N(vorig[f]); await kv.raw(['RPUSH', 'wam:wablok', JSON.stringify(blok)]).catch(() => {}); kv.raw(['LTRIM', 'wam:wablok', '-500', '-1']).catch(() => {}); await kv.set('wam:wablokv:' + v, nu).catch(() => {}); }
}
export async function waStand() {
  const h = await hget('wam:wav'), per = {}; for (const [k, n] of Object.entries(h)) { const [v, f] = k.split('|'); (per[v] = per[v] || {})[f] = n; }
  const sg = await hget('wam:waseg'), seg = {}; for (const [k, n] of Object.entries(sg)) { const [v, s2, f] = k.split('|'); ((seg[s2] = seg[s2] || {})[f] = N((seg[s2] || {})[f]) + n); }
  const b = (await kv.raw(['LRANGE', 'wam:wablok', '-30', '-1']).catch(() => [])) || [];
  return { varianten: per, segmenten: seg, blokken_van_10: b.map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean) };
}

// ---------- 5. seintje bij een match: gewoon vragen hoe ----------
// Henkjan 12 nov 19:58 UTC: "Gewoon vragen hoe, dan leren we vanzelf welke we niet hebben." Na een gemaakte wens zonder contact vraagt WAM
// hoe iemand het wil horen: WhatsApp, sms, e-mail, Telegram, Messenger. wam:alert telt per land en kanaal g (gevraagd), k (gekozen),
// c (gegeven: nummer, mail, WhatsApp of Telegram gekoppeld). Sms en Messenger heeft WAM nog niet: die keuzes laten zien wat erbij moet.
// Volgorde per land: meest gekozen eerst zodra er 20 vragen zijn, de laatste plek wisselt om te blijven leren.
export const ALERT_K = ['wa', 'sms', 'mail', 'tg']; // Messenger eruit (13 nov): Meta laat een pagina buiten de EU, VK, Japan en Korea alleen binnen 24 uur na het laatste bericht antwoorden, dus een match die later komt kan er niet heen; 16 mensen liepen vandaag dood op die knop
export const ALERT_L = { en: { wa: 'WhatsApp', sms: 'Text message', mail: 'Email', tg: 'Telegram', meta: 'Messenger' }, nl: { wa: 'WhatsApp', sms: 'Sms', mail: 'E-mail', tg: 'Telegram', meta: 'Messenger' } };
export function alertKanaal(t) {
  const x = String(t || '').toLowerCase().trim();
  for (const tl of Object.keys(ALERT_L)) for (const [k, l] of Object.entries(ALERT_L[tl])) if (x === l.toLowerCase()) return k;
  if (/\b(whats ?app|wa)\b/.test(x)) return 'wa'; if (/\b(text|texts|sms|txt|imessage|message me|bericht)\b/.test(x)) return 'sms'; if (/\b(e-?mail|mail|gmail)\b/.test(x)) return 'mail'; if (/\b(telegram|tg)\b/.test(x)) return 'tg'; if (/\b(messenger|facebook|fb)\b/.test(x)) return 'meta'; if (/\b(instagram|insta|ig)\b/.test(x)) return 'ig'; if (/\b(signal)\b/.test(x)) return 'signal'; if (/\b(call|phone|bel|bellen)\b/.test(x)) return 'bel';
  return '';
}
export async function alertVolgorde(land) {
  const L = String(land || 'XX').toUpperCase(), h = await hget('wam:alert'); const g = k => N(h[L + '|' + k + '|g']), kz = k => N(h[L + '|' + k + '|k']);
  const tot = ALERT_K.reduce((s, k) => Math.max(s, g(k)), 0); if (tot < 20) return [...ALERT_K];
  const vast = [...ALERT_K].sort((a, b) => beta(1 + kz(b), 1 + g(b) - kz(b)) - beta(1 + kz(a), 1 + g(a) - kz(a)));
  return vast;
}
export async function telAlert(land, k, f, test) { if (test || !k) return; await inc('wam:alert', String(land || 'XX').toUpperCase() + '|' + k + '|' + f); }
export async function alertStand() {
  const h = await hget('wam:alert'), o = {}; for (const [k, n] of Object.entries(h)) { const [l, kz, f] = k.split('|'); ((o[l] = o[l] || {})[kz] = (o[l] || {})[kz] || {})[f] = n; }
  return { per_land: o, nog_niet_beschikbaar: ['sms', 'meta', 'ig', 'signal', 'bel'] };
}

// WhatsApp als seintje: link (zelf het eerste bericht sturen) tegen nummerveld met landcode al ingevuld en automatisch aanvullen door de browser
// (Henkjan 12 nov 21:09 UTC: "Ik geloof niet in typen ... kengetal voor invullen heel makkelijk maken. Test en leer dat"). wam:alert land|walink|g/c en
// land|wanr|g/k2/c (getoond, nummer gegeven, WhatsApp gekoppeld). Eerst elk 15 keer, dan Thompson op gekoppeld (c), nummer gegeven telt half.
export async function kiesWaAlert(land) {
  const L = String(land || 'XX').toUpperCase(), h = await hget('wam:alert'); const g = a => N(h[L + '|wa' + a + '|g']) + N(h['*|wa' + a + '|g']), ok = a => N(h[L + '|wa' + a + '|c']) + 0.5 * N(h[L + '|wa' + a + '|k2']);
  if (g('link') < 15 || g('nr') < 15) return Math.random() < 0.5 ? 'link' : 'nr';
  return beta(1 + ok('nr'), 1 + Math.max(0, g('nr') - ok('nr'))) >= beta(1 + ok('link'), 1 + Math.max(0, g('link') - ok('link'))) ? 'nr' : 'link';
}

// ---------- 6. dagelijkse vraag (Henkjan 12 nov 21:21 UTC: "Ja dagelijkse vraag en nog steeds alles lerend") ----------
// Per persoon een vaste arm: frequentie (f1 elke dag, f3 om de drie dagen) en tekst (v1 eerst wat er nieuw is, v2 eerst de vraag, v3 vraag WAM naar
// anderen). wam:dagv telt per arm g (gestuurd), a (antwoord binnen 24 uur), m (daarna iets gemaakt), s (STOP). Eerst elke arm 15 keer, dan Thompson
// op antwoord plus dubbel voor iets gemaakt, met straf voor STOP. Drie keer geen antwoord op rij = pauze van 14 dagen.
const DV_F = ['f1', 'f3'], DV_V = ['v1', 'v2', 'v3'];
function dvKies(h, armen) { const g = a => N(h[a + '|g']), sc = a => beta(1 + N(h[a + '|a']) + 2 * N(h[a + '|m']), 1 + Math.max(0, g(a) - N(h[a + '|a'])) + 3 * N(h[a + '|s'])); const weinig = armen.filter(a => g(a) < 15); if (weinig.length) return weinig[Math.floor(Math.random() * weinig.length)]; return armen.reduce((b, a) => (sc(a) > sc(b) ? a : b), armen[0]); }
export async function kiesDagv() { const h = await hget('wam:dagv'); return { f: dvKies(h, DV_F), v: dvKies(h, DV_V) }; }
export async function telDagv(dv, f, test) { if (test || !dv) return; if (dv.f) await inc('wam:dagv', dv.f + '|' + f); if (dv.v) await inc('wam:dagv', dv.v + '|' + f); }
export async function dagvStand() { const h = await hget('wam:dagv'), o = {}; for (const [k, n] of Object.entries(h)) { const [a, f] = k.split('|'); (o[a] = o[a] || {})[f] = n; } return { armen: o, ingeschreven: N(await kv.raw(['SCARD', 'wam:dvset']).catch(() => 0)) }; }
