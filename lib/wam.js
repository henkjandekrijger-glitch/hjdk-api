// We Are Many (WAM) — de chat op wearemany.now voor koud verkeer (Henkjan 9 nov 2026).
// "Ze komen direct in de chat terecht, getriggerd door de advertentieklik, die wat van ze weet uit de browser. Zoek zelf uit hoe je
//  aan de praat komt, breng intenties in kaart en geef iets terug. Begin bij 0, een baby. Per dialoog meer engagement, meet wanneer
//  en waarom ze uitstappen, onthoud ze als ze terugkomen." + "Je mag ook dingen voor ze opzoeken; leg contact vast (WhatsApp, e-mail,
//  Telegram door ze een berichtje te laten sturen)." Besluiten 9 nov: eerst alleen leren (geen affiliatelinks), AI-plafond $5 per dag
//  (chat + leerronde samen), campagnes meteen binnen de regels.
//
// Opbouw
// - Pagina (api/wam.js op=pagina): de server kiest meteen een opener (bandit per taal, passend bij de advertentie) en zet die in de HTML,
//   dus de chat staat er zonder wachten. Terugkerende bezoekers (cookie wam_v) krijgen een welkom-terug met hun laatste wens.
// - Elke zet daarna gaat via AI (Haiku via de gateway, lib/ai.js). De bot mag opzoeken (Perplexity sonar) als hij verse feiten nodig heeft.
// - Uitkomsten naar Clickmind (lib/wissel.js uitkomst): echt (eerste bewuste tik of zin), actie (eerste wens vastgelegd), aanmelding
//   (contact vastgelegd). De wissel wam meldt 'echt' terug aan PropellerAds (vroege conversie, zie campagneskill).
// - Meten per beurt: geladen, js, 1 s in beeld, opener getoond, eerste tik, beurten, contact gevraagd/gegeven, wacht op bot, weg na wat.
// - Leerronde (elk uur, op=leer): cijfers, signaalcheck A-F, redenen van uitstappen, en eens per 3 uur een coach (Sonnet) die
//   hoogstens 2 wijzigingen doet: een les erbij of eraf, of een nieuwe opener. De bandit kiest daarna zelf.
// Opslag (Redis, prefix wam:): p:<vid> profiel (365 d), s:<sid> gesprek (2 d, na eerste tik 30 d), o openers, ot tellers per opener,
//   c:<dag> tellers (60 d), kost:<dag> micro-dollars, lessen, code:<code> -> vid, tg:<chat> -> vid, sessies:<dag> lijst, leerlog.
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { berichten, chat, HAIKU, SONNET } from './ai.js';

export const PLAFOND = Number(process.env.WAM_AI_PLAFOND || 5); // dollar per UTC-dag voor alle AI van WAM
const TTL = { p: 365 * 86400, s0: 2 * 86400, s: 30 * 86400, teller: 60 * 86400, code: 90 * 86400 };
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
export const dag = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const hex = n => randomBytes(n).toString('hex');
const h12 = s => createHash('sha256').update(String(s)).digest('hex').slice(0, 12);
const kort = (s, n) => { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
export const TALEN = ['nl', 'en', 'de', 'fr', 'es', 'it', 'pt', 'pl'];

// ---------- geheim en tokens ----------
let GEHEIM = null;
async function geheim() {
  if (GEHEIM) return GEHEIM;
  let g = await kv.get('wam:geheim').catch(() => null);
  if (!g) { g = hex(24); await kv.raw(['SET', 'wam:geheim', g, 'NX']).catch(() => {}); g = (await kv.get('wam:geheim').catch(() => null)) || g; }
  GEHEIM = String(g); return GEHEIM;
}
export async function teken(sid) { return createHmac('sha256', await geheim()).update('wam|' + sid).digest('hex').slice(0, 20); }
export async function tokOk(sid, tok) { return /^[0-9a-f]{16}$/.test(String(sid || '')) && String(tok || '') === await teken(sid); }

// ---------- tellers ----------
export async function tel(velden, d = dag(), test = false) {
  if (test) return;
  const k = 'wam:c:' + d; const cmds = Object.entries(velden).filter(([, n]) => n).map(([v, n]) => ['HINCRBY', k, v, String(Math.round(n))]);
  if (!cmds.length) return; cmds.push(['EXPIRE', k, String(TTL.teller)]);
  await Promise.all(cmds.map(c => kv.raw(c).catch(() => {})));
}
async function telOpener(id, veld, d = dag(), test = false) {
  if (test) return;
  await Promise.all([kv.raw(['HINCRBY', 'wam:ot', id + '|' + veld, '1']), kv.raw(['HINCRBY', 'wam:otd:' + d, id + '|' + veld, '1']), kv.raw(['EXPIRE', 'wam:otd:' + d, String(TTL.teller)])].map(p => p.catch(() => {})));
}
async function telHook(hook, veld, d = dag(), test = false) { if (!hook || test) return; await Promise.all([kv.raw(['HINCRBY', 'wam:ht:' + d, hook + '|' + veld, '1']), kv.raw(['EXPIRE', 'wam:ht:' + d, String(TTL.teller)])].map(p => p.catch(() => {}))); }

// ---------- AI-kosten en plafond ----------
const PRIJS = { haiku: [1, 5], sonnet: [3, 15], sonar: [1, 1] }; // dollar per miljoen tokens (in, uit); voorzichtig geschat
function kostVan(model, u, extra = 0) {
  const p = /sonnet/i.test(model) ? PRIJS.sonnet : /sonar|perplexity/i.test(model) ? PRIJS.sonar : PRIJS.haiku;
  const inn = Math.max(0, N(u && u.in) - N(u && u.cacheLees) * 0.9);
  return (inn * p[0] + N(u && u.uit) * p[1]) / 1e6 + extra;
}
async function boekKost(usd, fn) {
  const micro = Math.round(usd * 1e6); if (micro <= 0) return;
  const k = 'wam:kost:' + dag();
  await Promise.all([kv.raw(['HINCRBY', k, 'totaal', String(micro)]), kv.raw(['HINCRBY', k, fn, String(micro)]), kv.raw(['EXPIRE', k, String(TTL.teller)])].map(p => p.catch(() => {})));
}
export async function kostVandaag(d = dag()) { const v = await kv.raw(['HGET', 'wam:kost:' + d, 'totaal']).catch(() => 0); return N(v) / 1e6; }
async function binnenPlafond(marge = 0) { return (await kostVandaag()) + marge < PLAFOND; }

// ---------- openers (de eerste zin, zonder AI) ----------
// familie = waar de opener over gaat; de advertentie (hook) kiest de familie, de bandit kiest binnen de familie.
// {groet} wordt goedemorgen/-middag/-avond in de taal van de bezoeker, {stad} de stad uit het IP (alleen als die bekend is).
const ZAAD = [
  { id: 'nl-open', taal: 'nl', familie: 'open', tekst: '{groet}! Ik ben WAM. Waar kan ik je vandaag mee helpen? Ik zoek dingen voor je uit, vergelijk prijzen en regel gedoe.', knoppen: ['Iets goedkoper krijgen', 'Iets opzeggen', 'Ik zoek iets', 'Even rondkijken'] },
  { id: 'nl-teveel', taal: 'nl', familie: 'besparen', tekst: '{groet}! Betaal jij ook ergens te veel voor? Noem het maar, dan kijk ik of het goedkoper kan.', knoppen: ['Energie', 'Telefoon of internet', 'Verzekering', 'Iets anders'] },
  { id: 'nl-wens', taal: 'nl', familie: 'wens', tekst: '{groet}! Wat wil je nu het liefst geregeld zien, of hebben?', knoppen: ['Een betere deal', 'Een product vinden', 'Iets kwijt', 'Weet ik nog niet'] },
  { id: 'nl-opzeg', taal: 'nl', familie: 'opzeggen', tekst: '{groet}! Welk abonnement wil je kwijt? Ik help je het vandaag nog op te zeggen.', knoppen: ['Sportschool', 'Streaming', 'Telefoon', 'Iets anders'] },
  { id: 'nl-samen', taal: 'nl', familie: 'samen', tekst: '{groet}! Met z\'n allen krijg je betere deals. Waarvoor zou jij samen met anderen een betere prijs willen?', knoppen: ['Energie', 'Zorgverzekering', 'Iets kopen', 'Hoe werkt dat?'] },
  { id: 'nl-vraag', taal: 'nl', familie: 'open', tekst: '{groet}! Korte vraag: wat kost je elke maand geld dat je liever kwijt zou zijn?', knoppen: ['Abonnementen', 'Vaste lasten', 'Boodschappen', 'Geen idee'] },
  { id: 'en-open', taal: 'en', familie: 'open', tekst: '{groet}! I\'m WAM. What can I help you with today? I look things up, compare prices and sort out hassle.', knoppen: ['Pay less for something', 'Cancel something', 'Find something', 'Just looking'] },
  { id: 'en-teveel', taal: 'en', familie: 'besparen', tekst: '{groet}! Paying too much for something? Name it and I\'ll check if it can be cheaper.', knoppen: ['Energy', 'Phone or internet', 'Insurance', 'Something else'] },
  { id: 'en-wens', taal: 'en', familie: 'wens', tekst: '{groet}! What would you most like sorted out, or to have, right now?', knoppen: ['A better deal', 'Find a product', 'Get rid of a bill', 'Not sure yet'] },
  { id: 'en-opzeg', taal: 'en', familie: 'opzeggen', tekst: '{groet}! Which subscription do you want to get rid of? I\'ll help you cancel it today.', knoppen: ['Gym', 'Streaming', 'Phone plan', 'Something else'] },
  { id: 'en-samen', taal: 'en', familie: 'samen', tekst: '{groet}! Together we get better deals. What would you want a better price on, together with others?', knoppen: ['Energy', 'Insurance', 'Something to buy', 'How does it work?'] },
  { id: 'en-vraag', taal: 'en', familie: 'open', tekst: '{groet}! Quick question: what costs you money every month that you\'d rather get rid of?', knoppen: ['Subscriptions', 'Bills', 'Groceries', 'No idea'] },
  { id: 'de-open', taal: 'de', familie: 'open', tekst: '{groet}! Ich bin WAM. Wobei kann ich dir heute helfen? Ich recherchiere, vergleiche Preise und kläre lästige Dinge.', knoppen: ['Etwas günstiger', 'Etwas kündigen', 'Ich suche etwas', 'Nur schauen'] },
  { id: 'de-teveel', taal: 'de', familie: 'besparen', tekst: '{groet}! Zahlst du irgendwo zu viel? Sag mir was, ich schaue, ob es günstiger geht.', knoppen: ['Strom & Gas', 'Handy oder Internet', 'Versicherung', 'Etwas anderes'] }
];
const GROET = {
  nl: ['Goedemorgen', 'Goedemiddag', 'Goedenavond', 'Hoi'], en: ['Good morning', 'Good afternoon', 'Good evening', 'Hi'], de: ['Guten Morgen', 'Hallo', 'Guten Abend', 'Hallo'],
  fr: ['Bonjour', 'Bonjour', 'Bonsoir', 'Salut'], es: ['Buenos días', 'Buenas tardes', 'Buenas noches', 'Hola'], it: ['Buongiorno', 'Buon pomeriggio', 'Buonasera', 'Ciao'],
  pt: ['Bom dia', 'Boa tarde', 'Boa noite', 'Olá'], pl: ['Dzień dobry', 'Dzień dobry', 'Dobry wieczór', 'Cześć']
};
export function groet(taal, uur) { const g = GROET[taal] || GROET.en; if (uur == null || !Number.isFinite(uur)) return g[3]; return uur >= 5 && uur < 12 ? g[0] : uur >= 12 && uur < 18 ? g[1] : uur >= 18 && uur < 24 ? g[2] : g[3]; }

export async function openers() {
  let o = await kv.get('wam:o').catch(() => null);
  if (!o || typeof o !== 'object' || !Object.keys(o).length) { o = {}; for (const z of ZAAD) o[z.id] = Object.assign({ actief: true, bron: 'zaad', t: Date.now() }, z); await kv.set('wam:o', o).catch(() => {}); }
  return o;
}
async function openerStand() {
  const r = await kv.raw(['HGETALL', 'wam:ot']).catch(() => []); const s = {};
  const paren = Array.isArray(r) ? r : Object.entries(r || {}).flat();
  for (let i = 0; i + 1 < paren.length; i += 2) { const [id, v] = String(paren[i]).split('|'); s[id] = s[id] || {}; s[id][v] = N(paren[i + 1]); }
  return s;
}
// gamma/beta-trekking voor Thompson
function gamma(k) { if (k < 1) return gamma(1 + k) * Math.pow(Math.random(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { const u1 = Math.random(), u2 = Math.random(); x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - 0.0331 * x * x * x * x) return d * v; if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
// beloning van een opener: in gesprek gekomen (e) telt 1, contact (c) telt 3 extra; per keer getoond (g)
const score = s => ({ a: 1 + N(s.e) + 3 * N(s.c), b: 1 + Math.max(0, N(s.g) - N(s.e)) });
export async function kiesOpener(taal, familie) {
  const o = await openers(); const st = await openerStand();
  let pool = Object.values(o).filter(x => x.actief && x.taal === taal);
  if (!pool.length) pool = Object.values(o).filter(x => x.actief && x.taal === 'en');
  if (familie) { const f = pool.filter(x => x.familie === familie); if (f.length) pool = f; }
  let best = null, bw = -1;
  for (const x of pool) { const sc = score(st[x.id] || {}); const w = beta(sc.a, sc.b); if (w > bw) { bw = w; best = x; } }
  return best || ZAAD[0];
}
// kans dat elke opener de beste is (voor de eigenaarspagina en het uitzetten van verliezers)
export function kansBeste(lijst, st, n = 3000) {
  const win = Object.fromEntries(lijst.map(x => [x.id, 0]));
  for (let i = 0; i < n; i++) { let b = null, bw = -1; for (const x of lijst) { const sc = score(st[x.id] || {}); const w = beta(sc.a, sc.b); if (w > bw) { bw = w; b = x.id; } } win[b]++; }
  return Object.fromEntries(Object.entries(win).map(([k, v]) => [k, v / n]));
}

// ---------- advertentie -> hook -> familie ----------
// Bij het maken van een campagne slaan we per advertentie (banner-id) op welke hook ze gebruikt: wam:cr:<id> = { hook, familie, tekst }.
export async function hookVan(b) { if (!/^\d{3,14}$/.test(String(b || ''))) return null; return kv.get('wam:cr:' + b).catch(() => null); }
export async function zetHook(b, v) { if (!/^\d{3,14}$/.test(String(b || ''))) return false; await kv.set('wam:cr:' + b, v); await kv.raw(['SADD', 'wam:crs', String(b)]); return true; }

// ---------- context uit de browser en het IP ----------
export function taalVan(accept, land) {
  const t = String(accept || '').toLowerCase().split(',').map(x => x.trim().slice(0, 2)).find(x => TALEN.includes(x));
  if (t) return t; const l = String(land || '').toUpperCase();
  return { NL: 'nl', BE: 'nl', DE: 'de', AT: 'de', CH: 'de', FR: 'fr', ES: 'es', MX: 'es', IT: 'it', PT: 'pt', BR: 'pt', PL: 'pl' }[l] || 'en';
}
export function lokaalUur(tz) { try { return Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz || 'UTC' }).format(new Date())); } catch (e) { return new Date().getUTCHours(); } }
export function apparaat(ua) { ua = String(ua || ''); return { os: /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : /Windows/.test(ua) ? 'windows' : /Mac OS X/.test(ua) ? 'mac' : /Linux/.test(ua) ? 'linux' : 'anders', mobiel: /Mobi|Android|iPhone|iPad/i.test(ua), app: /FBAN|FBAV|Instagram|Telegram|WhatsApp|Line\//.test(ua) ? 'inapp' : '' }; }
export function lijktBot(ua) { return !ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|phantom|python|curl|wget|httpclient|monitor/i.test(String(ua)); }

// ---------- profiel en gesprek ----------
export async function profiel(vid) { if (!/^[0-9a-f]{16}$/.test(String(vid || ''))) return null; return kv.get('wam:p:' + vid).catch(() => null); }
async function bewaarProfiel(p) { p.laatst = Date.now(); await kv.set('wam:p:' + p.vid, p, { ex: TTL.p }); }
export function nieuwProfiel(vid, ctx) { return { vid, eerst: Date.now(), laatst: Date.now(), bezoeken: 0, taal: ctx.taal, land: ctx.land, stad: ctx.stad, intenties: [], feiten: {}, contact: {}, samenvatting: '', sessies: [] }; }
export async function sessie(sid) { if (!/^[0-9a-f]{16}$/.test(String(sid || ''))) return null; return kv.get('wam:s:' + sid).catch(() => null); }
async function bewaarSessie(s) { await kv.set('wam:s:' + s.sid, s, { ex: s.echt ? TTL.s : TTL.s0 }); }

// Nieuwe sessie bij het openen van de pagina (server-side, voordat er JS draait). Geeft de opener terug die in de HTML komt.
export async function startSessie({ vid, ctx, params }) {
  const sid = hex(8), tok = await teken(sid);
  const p = (await profiel(vid)) || null;
  const hk = await hookVan(params.b);
  let opener, terug = false;
  if (p && (p.intenties || []).length && p.bezoeken > 0) {
    terug = true; const w = p.intenties[p.intenties.length - 1];
    const T = { nl: ['Welkom terug! Vorige keer ging het over: ' + kort(w.wat, 80) + '. Zullen we daar verder mee?', ['Ja, verder', 'Iets nieuws', 'Wat weet je nog?']],
      en: ['Welcome back! Last time we talked about: ' + kort(w.wat, 80) + '. Shall we continue?', ['Yes, continue', 'Something new', 'What do you remember?']],
      de: ['Willkommen zurück! Letztes Mal ging es um: ' + kort(w.wat, 80) + '. Machen wir weiter?', ['Ja, weiter', 'Etwas Neues', 'Was weißt du noch?']] }[ctx.taal] || null;
    const t = T || ['Welcome back! Last time we talked about: ' + kort(w.wat, 80) + '. Shall we continue?', ['Yes, continue', 'Something new', 'What do you remember?']];
    opener = { id: 'terug', taal: ctx.taal, familie: 'terug', tekst: t[0], knoppen: t[1] };
  } else opener = await kiesOpener(ctx.taal, hk && hk.familie);
  const tekst = opener.tekst.replace('{groet}', groet(ctx.taal, ctx.uur)).replace('{stad}', ctx.stad || '');
  const s = { sid, vid, t0: Date.now(), ctx, params, hook: hk ? hk.hook : '', opener: opener.id, terug, berichten: [{ r: 'b', t: Date.now(), x: tekst, k: opener.knoppen }], beurten: 0, echt: false, contactGevraagd: 0, zoek: 0, ev: {} };
  await bewaarSessie(s);
  const d = dag(); const velden = { geladen: 1, [params.n ? 'betaald' : 'organisch']: 1 }; if (terug) velden.terug = 1;
  await tel(velden, d, !!ctx.test);
  return { sid, tok, opener: { id: opener.id, tekst, knoppen: opener.knoppen }, terug };
}

// ---------- gebeurtenissen uit de browser ----------
const EV = ['js', 'zicht1', 'typt', 'verborgen', 'terug', 'weg', 'contact_mail', 'contact_tg', 'contact_wa', 'contact_nee', 'knop_kopie'];
export async function gebeurtenis(sid, tok, e, d = {}) {
  if (!EV.includes(e) || !(await tokOk(sid, tok))) return { ok: false };
  const s = await sessie(sid); if (!s) return { ok: false };
  s.ev = s.ev || {}; const eerste = !s.ev[e]; s.ev[e] = (s.ev[e] || 0) + 1;
  if (e === 'js' && d) { s.ctx = Object.assign(s.ctx || {}, { tzb: kort(d.tz, 40), uurb: N(d.uur), scherm: kort(d.scherm, 20), aanraak: !!d.aanraak, taalb: kort(d.taal, 10), donker: !!d.donker }); }
  if (e === 'weg' || e === 'verborgen') s.eind = { t: Date.now(), beurt: s.beurten, wacht: !!(d && d.wacht), typte: !!(d && d.typte), msNaBot: N(d && d.ms) };
  if (e === 'terug') s.eind = null;
  await bewaarSessie(s);
  if (eerste) {
    const T0 = !!(s.ctx && s.ctx.test); const v = { ['ev_' + e]: 1 }; await tel(v, dag(), T0);
    if (e === 'zicht1') { await telOpener(s.opener, 'g', dag(), T0); await telHook(s.hook, 'g', dag(), T0); }
    if (s.params && s.params.mmc && (e === 'js' || e === 'zicht1')) await clickmind(s.params.mmc, e === 'js' ? 'geladen' : 'zicht1');
  }
  return { ok: true };
}

// ---------- Clickmind-uitkomst (wissel wam meldt 'echt' terug aan PropellerAds) ----------
async function clickmind(mmc, soort) {
  if (!/^[0-9a-f]{8,24}$/.test(String(mmc || ''))) return null;
  try { const { uitkomst } = await import('./wissel.js'); return await uitkomst(kv, { cid: mmc, soort, bron: 'wam' }); } catch (e) { return { ok: false, fout: String(e && e.message || e).slice(0, 80) }; }
}

// ---------- de bot ----------
const MAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
export async function lessen() { const l = await kv.get('wam:lessen').catch(() => null); return l && Array.isArray(l.regels) ? l : { versie: 0, regels: [] }; }

function systeem(taal, ls, kanalen) {
  const regels = (ls.regels || []).map((r, i) => (i + 1) + '. ' + r.tekst).join('\n');
  return `You are WAM (We Are Many), a personal fixer in a chat on wearemany.now. Most people arrive cold from an ad, on a phone, and leave fast. You learn from every conversation.
Mission, in this order:
1. Hook: make every reply effortless and rewarding. Keep it short: at most 2 short sentences (under ~220 characters) unless you deliver information they asked for. End with one easy next step. Give 2-4 tap buttons ("knoppen") that are natural answers, each max 28 characters.
2. Help for real: answer, look things up, compare, draft a cancellation or complaint letter, explain options, give a concrete tip. Deliver real value by your 2nd or 3rd reply. When you need fresh facts (prices, providers, deals, rules, products, local info), set "zoek" to a short web search query and leave "antwoord" empty; you will get results and answer then.
3. Map intentions naturally: what they want, need, want to get rid of or want to know; their limit (budget/price) and their moment (when). One question at a time, only when it helps you help them. Never interrogate.
4. Keep in touch: once you delivered value, or when following up is genuinely useful (a price watch, sending the letter, a reminder before a deadline, telling them when others want the same), ask how they want to hear back. Available: ${kanalen.join(', ')}. Set "contact":"vraag" in that turn and say why it helps them. If the user asks you to send, mail, remind, notify, watch something or keep them posted, ask for their contact in that same turn ("contact":"vraag") and say what you will send. From your 3rd reply on, when you have helped, offer one concrete follow-up that needs contact (a price watch, the letter, the overview, a reminder). At most twice per conversation; respect a no.
Use the visitor context silently to tailor what you say (currency, local providers, rules, time of day). Never tell them you know their location, city, device, or that they came from an ad. Make sensible assumptions from their language and words instead of asking clarifying questions; ask only when the answer really changes your help.
Rules: answer in the user's language (start in "${taal}", switch if they write another language). Warm, direct, a little playful, never salesy. Never invent numbers, prices, reviews or community statistics; look it up or say you don't know. You sell nothing and recommend no paid products for commission. Never ask for full names, addresses, ID numbers or bank details; if they share sensitive data, do not repeat it. If asked who you are: WAM, an AI assistant from We Are Many that helps people get better deals and get things sorted, and that bundles people with the same wish so they get more done together. If someone is clearly testing or trolling, stay friendly and brief.
${regels ? 'Lessons learned from earlier conversations (follow them):\n' + regels + '\n' : ''}Return ONLY one JSON object, no markdown:
{"antwoord":"your message","knoppen":["..."],"zoek":"","intenties":[{"wat":"","soort":"kopen|besparen|opzeggen|klagen|vergelijken|vraag|regelen|overig","grens":"","wanneer":""}],"feiten":{"key":"value"},"contact":"","fase":"kennismaken|helpen|waarde|contact|afronden","samenvatting":"one line about this person and what they want"}
"intenties" and "feiten" only for NEW things learned this turn (facts like country, household, provider, plan, price they pay, end date). "contact" is "vraag" or "".`;
}

function contextTekst(s, p, extra) {
  const c = s.ctx || {}; const r = ['Today is ' + new Date().toISOString().slice(0, 10) + '. Use current-year information.'];
  r.push('Visitor: ' + [c.land && 'country ' + c.land, c.stad && 'city ' + c.stad, 'language ' + c.taal, 'local hour ' + (c.uurb || c.uur), c.os, c.mobiel ? 'mobile' : 'desktop', c.app].filter(Boolean).join(', ') + '.');
  r.push('Source: ' + (s.params && s.params.n ? 'paid ad (' + s.params.n + ')' + (s.hook ? ', ad promised: "' + s.hook + '"' : '') : 'direct/organic') + '.');
  if (p && p.bezoeken > 1) r.push('Returning visitor (' + p.bezoeken + ' visits). Known: ' + kort(p.samenvatting, 200) + ' Intentions: ' + (p.intenties || []).slice(-5).map(i => i.wat).join('; ') + '.');
  if (p && p.feiten && Object.keys(p.feiten).length) r.push('Facts: ' + kort(JSON.stringify(p.feiten), 400));
  const ck = p && p.contact ? Object.keys(p.contact).filter(k => p.contact[k]) : [];
  r.push(ck.length ? 'We can already reach them via: ' + ck.join(', ') + ' (do not ask again).' : 'No contact details yet. Asked so far this conversation: ' + (s.contactGevraagd || 0) + 'x.');
  if (extra) r.push(extra);
  return r.join('\n');
}
function transcript(s) { return s.berichten.slice(-16).map(m => (m.r === 'b' ? 'WAM: ' : 'User: ') + kort(m.x, 700)).join('\n'); }
function leesJson(t) { const m = String(t || '').match(/\{[\s\S]*\}/); if (!m) return null; try { return JSON.parse(m[0]); } catch (e) { try { return JSON.parse(m[0].replace(/,\s*([}\]])/g, '$1')); } catch (e2) { return null; } } }

async function zoekOp(vraag, s) {
  const land = (s.ctx && s.ctx.land) || '';
  const j = await chat({ fn: 'wam-zoek', model: 'perplexity/sonar', max: 450, timeout: 15000, messages: [
    { role: 'system', content: 'Today is ' + new Date().toISOString().slice(0, 10) + '. Use the most recent information available. Answer briefly with concrete, current facts (names, prices with currency, dates) relevant for someone in ' + (land || 'their country') + '. Max 120 words. End with 1-3 source URLs.' },
    { role: 'user', content: String(vraag).slice(0, 300) }] });
  const txt = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
  const u = j.usage || {}; await boekKost(kostVan('sonar', { in: u.prompt_tokens, uit: u.completion_tokens }, 0.005), 'zoek');
  return kort(txt, 1400);
}

async function denk(s, p, kanalen, extra) {
  const ls = await lessen();
  const sys = systeem(s.ctx.taal || 'en', ls, kanalen);
  const user = contextTekst(s, p, extra) + '\n\nConversation so far:\n' + transcript(s) + '\n\nWrite WAM\'s next message as JSON.';
  const r = await berichten({ fn: 'wam-chat', model: HAIKU, system: sys, user, max: 700, timeout: 20000 });
  await boekKost(kostVan(r.model, r.usage), 'chat');
  const j = leesJson(r.txt); if (!j) { console.error('[wam] geen JSON', r.model, String(r.txt).slice(0, 300)); throw new Error('geen JSON van ' + r.model + ': ' + String(r.txt).slice(0, 120)); }
  return j;
}

const VAL = {
  nl: { druk: 'Ik ben heel even overbelast. Laat je e-mail achter, dan kom ik er vandaag nog op terug.', fout: 'Oeps, er ging iets mis aan mijn kant. Kun je het nog eens zeggen?', knoppen: ['Mail me', 'Probeer opnieuw'], mailOk: 'Top, genoteerd. Ik mail je zodra ik iets voor je heb.' },
  en: { druk: 'I\'m a bit overloaded right now. Leave your email and I\'ll get back to you today.', fout: 'Oops, something went wrong on my side. Could you say that again?', knoppen: ['Email me', 'Try again'], mailOk: 'Great, noted. I\'ll email you as soon as I have something for you.' },
  de: { druk: 'Ich bin gerade kurz überlastet. Hinterlass deine E-Mail, ich melde mich heute noch.', fout: 'Hoppla, bei mir ging etwas schief. Kannst du das nochmal sagen?', knoppen: ['Schreib mir', 'Nochmal'], mailOk: 'Super, notiert. Ich schreibe dir, sobald ich etwas habe.' }
};
const val = taal => VAL[taal] || VAL.en;

export function kanalen() { const k = ['email']; if (process.env.WAM_TG_BOT && process.env.WAM_TG_TOKEN) k.push('Telegram'); if (process.env.WAM_WA_NUMMER) k.push('WhatsApp'); return k; }

// Eén zet van de gebruiker: tekst of een getikte knop. Geeft het antwoord van de bot terug.
export async function zeg({ sid, tok, x, knop, ip }) {
  if (!(await tokOk(sid, tok))) return { ok: false, fout: 'sessie' };
  const s = await sessie(sid); if (!s) return { ok: false, fout: 'sessie verlopen' };
  const tekst = kort(x || knop || '', 1200); if (!tekst) return { ok: false, fout: 'leeg' };
  // grenzen tegen misbruik
  if (s.beurten >= 40) return { ok: true, x: s.ctx.taal === 'nl' ? 'Dit gesprek is lang genoeg geworden. Begin gerust een nieuw gesprek.' : 'This conversation got long. Feel free to start a new one.', knoppen: [] };
  const ipk = 'wam:ip:' + dag() + ':' + h12(ip || '-'); const nIp = N(await kv.incr(ipk).catch(() => 0)); if (nIp === 1) kv.raw(['EXPIRE', ipk, '90000']).catch(() => {});
  if (nIp > 150) return { ok: false, fout: 'te veel' };
  const D = dag(); const velden = {}; const TEST = !!(s.ctx && s.ctx.test); s.fout = '';
  s.berichten.push({ r: 'u', t: Date.now(), x: tekst, knop: !!knop });
  s.beurten += 1; velden['beurt' + Math.min(s.beurten, 10)] = 1; if (knop) velden.knoptik = 1; else velden.getypt = 1;
  let p = (await profiel(s.vid)) || nieuwProfiel(s.vid, s.ctx);
  if (!s.echt) { // eerste bewuste stap: echt mens (vroege conversie voor het netwerk)
    s.echt = true; velden.echt = 1; await telOpener(s.opener, 'e', D, TEST); await telHook(s.hook, 'e', D, TEST);
    p.bezoeken = N(p.bezoeken) + 1; p.sessies = [...(p.sessies || []), s.sid].slice(-8);
    if (s.params && s.params.mmc) await clickmind(s.params.mmc, 'echt');
    if (!TEST) await kv.raw(['RPUSH', 'wam:sessies:' + D, s.sid]).catch(() => {}); kv.raw(['EXPIRE', 'wam:sessies:' + D, String(TTL.s)]).catch(() => {});
  }
  // e-mailadres in het bericht: contact vastleggen
  let extra = '';
  const m = tekst.match(MAIL);
  if (m && !(p.contact && p.contact.mail)) {
    p.contact = Object.assign(p.contact || {}, { mail: m[0].toLowerCase(), mailT: Date.now() });
    velden.contact = 1; velden.contact_mail = 1; await telOpener(s.opener, 'c', D, TEST); await telHook(s.hook, 'c', D, TEST);
    if (s.params && s.params.mmc) await clickmind(s.params.mmc, 'aanmelding');
    extra = 'The user just gave their email address. Thank them briefly, confirm what you will send or tell them, and continue helping.';
  }
  const kan = kanalen();
  let a = null, gezocht = '';
  if (!(await binnenPlafond(0.01))) {
    velden.plafond = 1; a = { antwoord: val(s.ctx.taal).druk, knoppen: [], contact: p.contact && p.contact.mail ? '' : 'vraag' };
    await meldEenmaal('plafond:' + D, 'WAM: het AI-plafond van $' + PLAFOND + ' voor vandaag is bereikt. De chat vraagt nu om een e-mailadres en antwoordt morgen weer normaal.');
  } else {
    const t0 = Date.now();
    try {
      a = await denk(s, p, kan, extra);
      if (a && a.zoek && String(a.zoek).trim() && s.zoek < 4 && (await binnenPlafond(0.02))) {
        s.zoek += 1; velden.zoek = 1; gezocht = String(a.zoek).trim().slice(0, 200);
        const res = await zoekOp(gezocht, s).catch(() => '');
        a = await denk(s, p, kan, (extra ? extra + '\n' : '') + 'Search results for "' + gezocht + '":\n' + (res || '(no results)') + '\nNow answer the user with these facts (mention a source domain if useful). Do not set "zoek" again.');
      }
    } catch (e) { velden.ai_fout = 1; a = null; s.fout = String(e && e.message || e).slice(0, 200); console.error('[wam] ai-fout', s.fout); kv.set('wam:laatsteFout', { t: Date.now(), fout: s.fout }).catch(() => {}); }
    velden.ms_bot = Date.now() - t0; velden.n_bot = 1;
  }
  if (!a || !String(a.antwoord || '').trim()) { velden.leeg = 1; if (!s.fout) { s.fout = 'leeg of geen JSON'; console.error('[wam] leeg antwoord'); } a = { antwoord: val(s.ctx.taal).fout, knoppen: [] }; }
  const antwoord = kort(a.antwoord, 1500);
  const knoppen = (Array.isArray(a.knoppen) ? a.knoppen : []).map(k => kort(k, 32)).filter(Boolean).slice(0, 4);
  // wat de bot leerde
  const nieuwI = (Array.isArray(a.intenties) ? a.intenties : []).filter(i => i && i.wat).slice(0, 3).map(i => ({ wat: kort(i.wat, 140), soort: kort(i.soort, 20), grens: kort(i.grens, 60), wanneer: kort(i.wanneer, 60), t: Date.now(), sid: s.sid }));
  if (nieuwI.length) {
    const eerste = !(p.intenties || []).length && !s.actie;
    p.intenties = [...(p.intenties || []), ...nieuwI].slice(-25); velden.intentie = nieuwI.length;
    if (!s.actie) { s.actie = true; velden.actie = 1; if (s.params && s.params.mmc) await clickmind(s.params.mmc, 'actie'); }
    for (const i of nieuwI) await kv.raw(['HINCRBY', 'wam:soort:' + D, i.soort || 'overig', '1']).catch(() => {});
    if (eerste) velden.eerste_intentie = 1;
  }
  if (a.feiten && typeof a.feiten === 'object') for (const [k, v] of Object.entries(a.feiten).slice(0, 8)) if (v != null && String(v).trim()) p.feiten[kort(k, 40)] = kort(v, 120);
  if (a.samenvatting) p.samenvatting = kort(a.samenvatting, 300);
  const contactVraag = a.contact === 'vraag' && !(p.contact && (p.contact.mail || p.contact.tg || p.contact.wa)) && s.contactGevraagd < 2;
  if (contactVraag) { s.contactGevraagd += 1; velden.contact_gevraagd = 1; }
  s.berichten.push({ r: 'b', t: Date.now(), x: antwoord, k: knoppen, fase: kort(a.fase, 20), zoek: gezocht || undefined, cv: contactVraag || undefined });
  s.laatste = Date.now(); s.fase = kort(a.fase, 20); s.eind = null;
  p.taal = s.ctx.taal; p.land = s.ctx.land;
  await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]);
  let code = null; if (contactVraag && kan.length > 1) code = await contactCode(s.vid);
  return { ok: true, x: antwoord, knoppen, contact: contactVraag ? contactOpties(kan, code, s.ctx.taal) : null, zocht: !!gezocht, ...(TEST && s.fout ? { fout: s.fout } : {}) };
}

// ---------- contact via Telegram en WhatsApp (de bezoeker stuurt ons een berichtje met een code) ----------
async function contactCode(vid) {
  const bestaand = await kv.get('wam:vcode:' + vid).catch(() => null); if (bestaand) return bestaand;
  const code = hex(3).toUpperCase(); await kv.set('wam:code:' + code, vid, { ex: TTL.code }); await kv.set('wam:vcode:' + vid, code, { ex: TTL.code }); return code;
}
export function contactOpties(kan, code, taal) {
  const o = [{ soort: 'mail' }];
  if (code && process.env.WAM_TG_BOT && process.env.WAM_TG_TOKEN) o.push({ soort: 'tg', url: 'https://t.me/' + process.env.WAM_TG_BOT + '?start=wam' + code });
  if (code && process.env.WAM_WA_NUMMER) o.push({ soort: 'wa', url: 'https://wa.me/' + String(process.env.WAM_WA_NUMMER).replace(/\D/g, '') + '?text=' + encodeURIComponent((taal === 'nl' ? 'Hoi WAM! Mijn code: ' : 'Hi WAM! My code: ') + code) });
  return o;
}
// Telegram-webhook: /start wam<CODE> koppelt de chat aan het profiel; daarna praat de bezoeker gewoon verder in Telegram.
export async function telegramUpdate(u) {
  const tok = process.env.WAM_TG_TOKEN; if (!tok) return { ok: false, fout: 'geen bot' };
  const m = u && (u.message || u.edited_message); if (!m || !m.chat || !m.text) return { ok: true };
  const chatId = String(m.chat.id), txt = String(m.text).trim();
  const stuur = t => fetch('https://api.telegram.org/bot' + tok + '/sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: t, disable_web_page_preview: true }) }).catch(() => {});
  const st = txt.match(/^\/start\s+wam([0-9A-F]{6})$/i);
  if (st) {
    const vid = await kv.get('wam:code:' + st[1].toUpperCase()).catch(() => null); if (!vid) { await stuur('Hi! I could not find that code. Open wearemany.now to start.'); return { ok: true }; }
    const p = (await profiel(vid)) || nieuwProfiel(vid, { taal: 'en' });
    const nieuw = !(p.contact && p.contact.tg); p.contact = Object.assign(p.contact || {}, { tg: chatId, tgT: Date.now() }); await bewaarProfiel(p); await kv.set('wam:tg:' + chatId, vid, { ex: TTL.p });
    if (nieuw) { await tel({ contact: 1, contact_tg: 1 }); const s = p.sessies && p.sessies.length ? await sessie(p.sessies[p.sessies.length - 1]) : null; if (s && s.params && s.params.mmc) await clickmind(s.params.mmc, 'aanmelding'); if (s) await telOpener(s.opener, 'c'); }
    await stuur(p.taal === 'nl' ? 'Top, we zijn verbonden! Je kunt hier gewoon verder praten. ' + (p.samenvatting ? 'Ik weet nog: ' + p.samenvatting : '') : 'Great, we\'re connected! You can just keep talking here. ' + (p.samenvatting ? 'I remember: ' + p.samenvatting : ''));
    return { ok: true, gekoppeld: true };
  }
  const vid = await kv.get('wam:tg:' + chatId).catch(() => null);
  if (!vid) { await stuur('Hi! Start at https://wearemany.now and tap Telegram there, so I know who you are.'); return { ok: true }; }
  // verder praten in Telegram: een eigen sessie per Telegram-chat
  const sid = createHash('sha256').update('tg|' + chatId).digest('hex').slice(0, 16);
  let s = await sessie(sid); const p = await profiel(vid);
  if (!s) { s = { sid, vid, t0: Date.now(), ctx: { taal: (p && p.taal) || 'en', land: p && p.land, kanaal: 'telegram' }, params: {}, hook: '', opener: 'telegram', berichten: [], beurten: 0, echt: true, contactGevraagd: 2, zoek: 0, ev: {} }; await bewaarSessie(s); }
  const r = await zeg({ sid, tok: await teken(sid), x: txt, ip: 'tg' + chatId });
  if (r.ok) await stuur(r.x + (r.knoppen && r.knoppen.length ? '\n\n' + r.knoppen.map(k => '• ' + k).join('\n') : ''));
  return { ok: true };
}

// ---------- melden aan Henkjan (doorgeefluik todayin-spel, zoals de Clickmind-uurwacht) ----------
export async function meld(tekst) {
  const s = process.env.MELD_SLEUTEL; if (!s) return false;
  try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'WAM', tekst: String(tekst).slice(0, 3400) }), signal: AbortSignal.timeout(10000) }); const j = await r.json().catch(() => ({})); return !!(j && j.ok); } catch (e) { return false; }
}
async function meldEenmaal(sleutel, tekst) { const nieuw = await kv.raw(['SET', 'wam:meld:' + sleutel, '1', 'NX', 'EX', '172800']).catch(() => null); if (nieuw) await meld(tekst); }

// ---------- cijfers ----------
async function hget(k) { const r = await kv.raw(['HGETALL', k]).catch(() => []); const o = {}; const a = Array.isArray(r) ? r : Object.entries(r || {}).flat(); for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = N(a[i + 1]); return o; }
export async function cijfers(dagen = 1) {
  const som = {}, perDag = [];
  for (let i = 0; i < dagen; i++) { const d = dag(Date.now() - i * 86400000); const c = await hget('wam:c:' + d); perDag.push({ dag: d, ...c }); for (const [k, v] of Object.entries(c)) som[k] = (som[k] || 0) + v; }
  return { som, perDag };
}
// gesprekken van de laatste dagen: hoe ver ze kwamen en waar ze afhaakten
export async function gesprekken(dagen = 1, max = 400) {
  const sids = []; for (let i = 0; i < dagen; i++) { const l = await kv.raw(['LRANGE', 'wam:sessies:' + dag(Date.now() - i * 86400000), '0', '-1']).catch(() => []); sids.push(...(l || [])); }
  const uniek = [...new Set(sids)].slice(-max); const out = [];
  for (let i = 0; i < uniek.length; i += 50) { const deel = uniek.slice(i, i + 50); const vs = await kv.mget(...deel.map(x => 'wam:s:' + x)).catch(() => []); out.push(...vs.filter(Boolean)); }
  return out;
}
export function reden(s) {
  const nu = Date.now(), stil = nu - N(s.laatste || s.t0) > 30 * 60000; if (!stil) return 'bezig';
  const p = s.berichten; const lb = [...p].reverse().find(m => m.r === 'b'); const lu = [...p].reverse().find(m => m.r === 'u');
  if (s.beurten >= 6) return 'lang_gesprek';
  if (s.eind && s.eind.wacht) return 'wacht_op_bot';
  if (lb && lb.cv) return 'na_contactvraag';
  if (lb && lb.zoek) return 'na_zoekantwoord';
  if (lb && String(lb.x).length > 300) return 'na_lang_antwoord';
  if (lb && lu && lb.t > lu.t && /\?\s*$/.test(String(lb.x))) return 'na_vraag';
  if (s.eind && s.eind.typte) return 'typte_maar_stuurde_niet';
  return 'na_antwoord';
}

// ---------- leerronde (elk uur) ----------
export async function signaal(c2, gs) {
  const alarmen = [], s = c2.som;
  const betaald = N(s.betaald), echt = N(s.echt), js = N(s.ev_js);
  if (betaald >= 100 && echt === 0) alarmen.push('A. 100+ betaalde bezoeken in 2 dagen en 0 echte mensen gemeld aan het netwerk: de netwerken leren niets.');
  const pbFout = gs.filter(x => x.pbFout).length; if (pbFout) alarmen.push('B. ' + pbFout + ' terugmeldingen naar het netwerk geweigerd.');
  if (N(s.geladen) >= 200 && js / Math.max(1, N(s.geladen)) < 0.3) alarmen.push('C. Van ' + s.geladen + ' geladen pagina\'s draaide maar bij ' + js + ' het script: veel bots of een kapotte pagina.');
  if (N(s.geladen) >= 200 && echt / Math.max(1, N(s.geladen)) < 0.05) alarmen.push('C. ' + s.geladen + ' bezoeken en maar ' + echt + ' echte mensen (<5%).');
  const perZone = {}; for (const x of gs) if (x.params && x.params.z) perZone[x.params.z] = (perZone[x.params.z] || 0) + 1;
  const top = Object.entries(perZone).sort((a, b) => b[1] - a[1])[0]; if (top && gs.length >= 20 && top[1] / gs.length >= 0.6) alarmen.push('D. ' + Math.round(top[1] / gs.length * 100) + '% van de echte mensen komt uit één plek (' + top[0] + '): inkoop te smal.');
  const leegZone = gs.filter(x => x.params && x.params.n && (!x.params.z || /[{\[]|zoneid/i.test(x.params.z))).length; if (leegZone >= 5) alarmen.push('E. ' + leegZone + ' betaalde gesprekken zonder ingevulde zonecode.');
  if (echt >= 30 && N(s.contact) === 0) alarmen.push('F. ' + echt + ' echte mensen in gesprek en 0 contactgegevens: de vraag om contact werkt niet.');
  return alarmen;
}

async function coach(gs, c3, ls, o, st) {
  const afgelopen = gs.filter(s => reden(s) !== 'bezig');
  const redenen = {}; for (const s of afgelopen) { const r = reden(s); redenen[r] = (redenen[r] || 0) + 1; }
  const voorbeelden = afgelopen.slice(-60).sort(() => Math.random() - 0.5).slice(0, 14).map(s => ({ beurten: s.beurten, reden: reden(s), contact: s.berichten.some(m => m.cv), taal: s.ctx && s.ctx.taal, hook: s.hook, gesprek: s.berichten.slice(0, 8).map(m => (m.r === 'b' ? 'W: ' : 'U: ') + kort(m.x, 220)) }));
  const openStand = Object.values(o).filter(x => x.actief).map(x => ({ id: x.id, taal: x.taal, familie: x.familie, tekst: x.tekst, getoond: N((st[x.id] || {}).g), gesprek: N((st[x.id] || {}).e), contact: N((st[x.id] || {}).c) }));
  const sys = 'You are the coach of WAM, a chat assistant for cold ad traffic. Goal: more people start talking, talk longer, state their real intentions, and leave contact details (email/WhatsApp/Telegram), because WAM gave them real value. You improve WAM by proposing at most 2 changes per round, based on evidence. Be concrete and honest; if the data is too thin, change nothing.';
  const user = 'Funnel last 3 days: ' + JSON.stringify(c3.som) + '\nWhy people left (heuristic): ' + JSON.stringify(redenen) + '\nOpeners (shown/started talking/contact): ' + JSON.stringify(openStand) + '\nCurrent lessons: ' + JSON.stringify((ls.regels || []).map((r, i) => ({ i, tekst: r.tekst, principe: r.principe }))) + '\nSample conversations: ' + JSON.stringify(voorbeelden) +
    '\n\nReturn ONLY JSON: {"analyse":"2-3 sentences: the biggest leak and why","lessen_nieuw":[{"tekst":"short imperative rule for WAM (max 160 chars)","principe":"behavioural principle"}],"lessen_weg":[index],"openers_nieuw":[{"taal":"nl|en|de|...","familie":"open|besparen|wens|opzeggen|samen","tekst":"opening line, may start with {groet}, max 160 chars","knoppen":["max 4 tap answers, max 28 chars"]}],"openers_uit":["id"]}. Total changes (new lessons + removed lessons + new openers + openers off) at most 2. Only switch off an opener with 50+ shows that clearly loses.';
  const r = await berichten({ fn: 'wam-coach', model: SONNET, system: sys, user, max: 1400, timeout: 60000 });
  await boekKost(kostVan(r.model, r.usage), 'coach');
  return { voorstel: leesJson(r.txt), redenen };
}

export async function leerRonde({ forceer = false } = {}) {
  const nu = Date.now(), uit = { t: new Date().toISOString(), wijzigingen: [] };
  const [c2, c3] = await Promise.all([cijfers(2), cijfers(3)]);
  const gs = await gesprekken(2);
  uit.alarmen = await signaal(c2, gs);
  for (const a of uit.alarmen) await meldEenmaal('alarm:' + dag() + ':' + a.slice(0, 2), 'WAM-alarm: ' + a);
  // coach eens per 3 uur, alleen met genoeg afgelopen gesprekken
  const laatste = N(await kv.get('wam:coachT').catch(() => 0));
  const afgelopen = gs.filter(s => reden(s) !== 'bezig').length;
  if ((forceer || nu - laatste > 3 * 3600000) && afgelopen >= (forceer ? 3 : 15) && (await binnenPlafond(0.15))) {
    await kv.set('wam:coachT', nu);
    const o = await openers(), st = await openerStand(), ls = await lessen();
    try {
      const { voorstel: v, redenen } = await coach(gs, c3, ls, o, st); uit.redenen = redenen; uit.analyse = v && v.analyse;
      let n = 0; const MAXW = 2;
      if (v && Array.isArray(v.lessen_weg)) for (const i of v.lessen_weg) { if (n >= MAXW) break; const r = ls.regels[N(i)]; if (r) { ls.regels.splice(N(i), 1); uit.wijzigingen.push('les weg: ' + r.tekst); n++; } }
      if (v && Array.isArray(v.lessen_nieuw)) for (const l of v.lessen_nieuw) { if (n >= MAXW || !l || !l.tekst) break; ls.regels.push({ tekst: kort(l.tekst, 180), principe: kort(l.principe, 60), t: nu }); uit.wijzigingen.push('les: ' + kort(l.tekst, 180)); n++; }
      ls.regels = ls.regels.slice(-12); ls.versie = N(ls.versie) + (n ? 1 : 0);
      if (v && Array.isArray(v.openers_uit)) for (const id of v.openers_uit) { if (n >= MAXW) break; const x = o[id]; const s0 = st[id] || {}; if (x && x.actief && N(s0.g) >= 50 && Object.values(o).filter(y => y.actief && y.taal === x.taal).length > 2) { x.actief = false; uit.wijzigingen.push('opener uit: ' + id); n++; } }
      if (v && Array.isArray(v.openers_nieuw)) for (const x of v.openers_nieuw) { if (n >= MAXW || !x || !x.tekst || !TALEN.includes(x.taal)) continue; const id = x.taal + '-l' + h12(x.tekst).slice(0, 5); if (o[id]) continue; o[id] = { id, taal: x.taal, familie: ['open', 'besparen', 'wens', 'opzeggen', 'samen'].includes(x.familie) ? x.familie : 'open', tekst: kort(x.tekst, 170), knoppen: (x.knoppen || []).map(k => kort(k, 28)).filter(Boolean).slice(0, 4), actief: true, bron: 'coach', t: nu }; uit.wijzigingen.push('nieuwe opener ' + id + ': ' + kort(x.tekst, 120)); n++; }
      await Promise.all([kv.set('wam:lessen', ls), kv.set('wam:o', o)]);
    } catch (e) { uit.coachFout = String(e && e.message || e).slice(0, 160); }
  }
  // vertalen: talen met bezoekers maar zonder eigen openers krijgen een vertaling van de beste Engelse opener
  try { await vertaalOpeners(gs); } catch (e) {}
  await kv.raw(['LPUSH', 'wam:leerlog', JSON.stringify(uit)]).catch(() => {}); await kv.raw(['LTRIM', 'wam:leerlog', '0', '199']).catch(() => {});
  // stand naar de centrale overdracht
  try { const H = await import('./handover.js'); await H.zetProject(kv, await overdrachtStand(c2, gs, uit)); } catch (e) { uit.overdrachtFout = String(e && e.message || e).slice(0, 100); }
  await rapport(c2, gs, uit);
  return uit;
}

async function vertaalOpeners(gs) {
  const o = await openers(); const talen = {}; for (const s of gs) { const t = s.ctx && s.ctx.taal; if (t) talen[t] = (talen[t] || 0) + 1; }
  for (const [t, n] of Object.entries(talen)) {
    if (n < 3 || !TALEN.includes(t) || Object.values(o).some(x => x.taal === t && x.actief) || !(await binnenPlafond(0.05))) continue;
    const bron = Object.values(o).filter(x => x.taal === 'en' && x.actief).slice(0, 4);
    const r = await berichten({ fn: 'wam-vertaal', model: HAIKU, system: 'Translate chat opening lines naturally and casually for a mobile chat. Keep {groet} untouched. Buttons max 28 characters.', user: 'Language: ' + t + '\nReturn ONLY JSON list [{"id":"...","tekst":"...","knoppen":["..."]}] for: ' + JSON.stringify(bron.map(x => ({ id: x.id, tekst: x.tekst, knoppen: x.knoppen }))), max: 900, timeout: 30000 });
    await boekKost(kostVan(r.model, r.usage), 'vertaal');
    const m = String(r.txt).match(/\[[\s\S]*\]/); let l = []; try { l = JSON.parse(m ? m[0] : '[]'); } catch (e) {}
    for (const x of l) { const b = bron.find(y => y.id === x.id); if (!b || !x.tekst) continue; const id = t + '-' + b.id.slice(3); o[id] = { id, taal: t, familie: b.familie, tekst: kort(x.tekst, 170), knoppen: (x.knoppen || []).map(k => kort(k, 28)).slice(0, 4), actief: true, bron: 'vertaling', t: Date.now() }; }
    await kv.set('wam:o', o);
  }
}

async function overdrachtStand(c2, gs, uit) {
  const s = c2.som, kost = await kostVandaag();
  const pct = (a, b) => (b ? Math.round(a / b * 100) + '%' : '-');
  const { WAM_WERKING } = await import('./werking.js').catch(() => ({ WAM_WERKING: '' }));
  return { project: 'wam', naam: 'We Are Many (wearemany.now)', bijgewerkt: new Date().toISOString(), datums: { werking: '2026-11-09' },
    stand: ['Laatste 2 dagen: ' + N(s.geladen) + ' geladen, ' + N(s.ev_js) + ' met script, ' + N(s.echt) + ' echt in gesprek (' + pct(N(s.echt), N(s.ev_zicht1)) + ' van wie de opener zag), ' + N(s.beurt3) + ' tot beurt 3, ' + N(s.intentie) + ' wensen, ' + N(s.contact) + ' contacten (' + pct(N(s.contact), N(s.echt)) + ').',
      'AI vandaag $' + kost.toFixed(2) + ' van $' + PLAFOND + '. Zoekopdrachten: ' + N(s.zoek) + '. Gemiddelde wachttijd op de bot: ' + (N(s.n_bot) ? Math.round(N(s.ms_bot) / N(s.n_bot) / 100) / 10 + ' s' : '-') + '.',
      ...(uit.alarmen || []).map(a => 'ALARM ' + a), ...(uit.wijzigingen || []).map(w => 'Leerronde: ' + w)],
    werking: WAM_WERKING || '', links: ['https://wearemany.now', 'https://hjdk-api-henq.vercel.app/api/wam?op=stand'] };
}

async function rapport(c2, gs, uit) {
  // naar Henkjan: hoogstens elke 4 uur, alleen als er iets bewoog (nieuwe contacten, wijziging door de leerronde, mijlpaal)
  const s = c2.som; const vorig = (await kv.get('wam:rapport').catch(() => null)) || { t: 0, contact: 0, echt: 0 };
  const nu = Date.now(); const bewoog = N(s.contact) > N(vorig.contact) || (uit.wijzigingen || []).length || N(s.echt) >= N(vorig.echt) + 25;
  if (nu - N(vorig.t) < 4 * 3600000 || !bewoog) return;
  const kost = await kostVandaag();
  const t = 'WAM (laatste 2 dagen): ' + N(s.echt) + ' mensen in gesprek, ' + N(s.beurt3) + ' tot beurt 3, ' + N(s.intentie) + ' wensen, ' + N(s.contact) + ' contacten. AI vandaag $' + kost.toFixed(2) + '.' +
    ((uit.wijzigingen || []).length ? '\nGeleerd: ' + uit.wijzigingen.join(' | ') : '') + (uit.analyse ? '\nLek: ' + kort(uit.analyse, 300) : '') + '\nStand: https://hjdk-api-henq.vercel.app/api/wam?op=stand';
  if (await meld(t)) await kv.set('wam:rapport', { t: nu, contact: N(s.contact), echt: N(s.echt) });
}

// ---------- eigenaarspagina ----------
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export async function standHtml() {
  const [c1, c3, gs, ls, o, st, kost] = await Promise.all([cijfers(1), cijfers(3), gesprekken(3), lessen(), openers(), openerStand(), kostVandaag()]);
  const log = ((await kv.raw(['LRANGE', 'wam:leerlog', '0', '5']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
  const alarmen = await signaal(await cijfers(2), await gesprekken(2));
  const s = c3.som, pct = (a, b) => (b ? Math.round(a / b * 100) + '%' : '–');
  const rij = (l, a, b) => '<tr><td>' + esc(l) + '</td><td>' + N(a) + '</td><td>' + pct(N(a), N(b)) + '</td></tr>';
  const redenen = {}; for (const x of gs) { const r = reden(x); if (r !== 'bezig') redenen[r] = (redenen[r] || 0) + 1; }
  const actief = Object.values(o).filter(x => x.actief); const kans = kansBeste(actief.filter(x => x.taal === 'nl' || x.taal === 'en'), st);
  const hk = {}; for (let i = 0; i < 3; i++) { const h = await hget('wam:ht:' + dag(Date.now() - i * 86400000)); for (const [k, v] of Object.entries(h)) hk[k] = (hk[k] || 0) + v; }
  const hooks = {}; for (const [k, v] of Object.entries(hk)) { const [h, f] = k.split('|'); hooks[h] = hooks[h] || {}; hooks[h][f] = v; }
  const laatste = gs.slice(-12).reverse();
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>WAM stand</title>
<style>body{font:15px/1.5 -apple-system,system-ui,sans-serif;max-width:900px;margin:0 auto;padding:16px;color:#1d1d1f}h1{font-size:22px}h2{font-size:17px;margin-top:28px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #eee;padding:6px 8px;text-align:left;vertical-align:top}.alarm{background:#fdecea;border:1px solid #f5c2c0;padding:10px;border-radius:8px;margin:6px 0}.g{color:#666;font-size:13px}.b{background:#f5f5f7;border-radius:8px;padding:8px;margin:6px 0;font-size:13px}</style></head><body>
<h1>We Are Many: stand van de chat</h1><p class="g">Live opgebouwd ${esc(new Date().toISOString().slice(0, 16).replace('T', ' '))} UTC. <a href="https://wearemany.now">wearemany.now</a> · AI vandaag $${kost.toFixed(2)} van $${PLAFOND}</p>
${alarmen.length ? alarmen.map(a => '<div class="alarm">' + esc(a) + '</div>').join('') : '<p>Signaalcheck: geen alarm.</p>'}
<h2>Trechter, laatste 3 dagen</h2><table><tr><th>Stap</th><th>Aantal</th><th>Van vorige</th></tr>
${rij('Pagina geladen', s.geladen, s.geladen)}${rij('Script draaide', s.ev_js, s.geladen)}${rij('1 s in beeld (opener gezien)', s.ev_zicht1, s.ev_js)}${rij('Echt mens: eerste tik of zin', s.echt, s.ev_zicht1)}${rij('Beurt 2', s.beurt2, s.echt)}${rij('Beurt 3', s.beurt3, s.beurt2)}${rij('Beurt 5', s.beurt5, s.beurt3)}${rij('Wens vastgelegd', s.actie, s.echt)}${rij('Contact gevraagd', s.contact_gevraagd, s.echt)}${rij('Contact gegeven', s.contact, s.contact_gevraagd)}</table>
<p class="g">Betaald ${N(s.betaald)} · organisch ${N(s.organisch)} · terugkerend ${N(s.terug)} · getypt ${N(s.getypt)} · knoppen ${N(s.knoptik)} · zoekopdrachten ${N(s.zoek)} · AI-fouten ${N(s.ai_fout)} · gemiddelde wachttijd bot ${N(s.n_bot) ? (Math.round(N(s.ms_bot) / N(s.n_bot) / 100) / 10) + ' s' : '–'}</p>
<h2>Waarom ze stoppen (afgelopen gesprekken, 3 dagen)</h2><table>${Object.entries(redenen).sort((a, b) => b[1] - a[1]).map(([r, n]) => '<tr><td>' + esc(r.replace(/_/g, ' ')) + '</td><td>' + n + '</td></tr>').join('') || '<tr><td>Nog geen afgelopen gesprekken</td></tr>'}</table>
<h2>Openers (bandit)</h2><table><tr><th>Opener</th><th>Getoond</th><th>In gesprek</th><th>Contact</th><th>Kans beste</th></tr>${actief.map(x => { const t = st[x.id] || {}; return '<tr><td><b>' + esc(x.id) + '</b> <span class="g">(' + esc(x.familie) + ', ' + esc(x.bron) + ')</span><br>' + esc(x.tekst) + '</td><td>' + N(t.g) + '</td><td>' + N(t.e) + ' (' + pct(N(t.e), N(t.g)) + ')</td><td>' + N(t.c) + '</td><td>' + (kans[x.id] != null ? Math.round(kans[x.id] * 100) + '%' : '–') + '</td></tr>'; }).join('')}</table>
<h2>Advertentie-hooks, 3 dagen</h2><table><tr><th>Hook</th><th>Opener gezien</th><th>In gesprek</th><th>Contact</th></tr>${Object.entries(hooks).map(([h, v]) => '<tr><td>' + esc(h) + '</td><td>' + N(v.g) + '</td><td>' + N(v.e) + ' (' + pct(N(v.e), N(v.g)) + ')</td><td>' + N(v.c) + '</td></tr>').join('') || '<tr><td>Nog geen advertentieverkeer</td></tr>'}</table>
<h2>Lessen (versie ${N(ls.versie)})</h2>${(ls.regels || []).length ? '<ol>' + ls.regels.map(r => '<li>' + esc(r.tekst) + ' <span class="g">(' + esc(r.principe) + ')</span></li>').join('') + '</ol>' : '<p>Nog geen lessen: de bot begint bij nul.</p>'}
<h2>Leerrondes</h2>${log.map(l => '<div class="b"><b>' + esc(String(l.t).slice(0, 16).replace('T', ' ')) + '</b> ' + esc(l.analyse || '') + (l.wijzigingen && l.wijzigingen.length ? '<br>' + l.wijzigingen.map(esc).join('<br>') : '') + (l.coachFout ? '<br>coachfout: ' + esc(l.coachFout) : '') + '</div>').join('') || '<p>Nog geen ronde.</p>'}
<h2>Laatste gesprekken</h2>${laatste.map(x => '<div class="b"><span class="g">' + esc([x.ctx && x.ctx.land, x.ctx && x.ctx.taal, x.params && x.params.n ? 'betaald z' + x.params.z : 'organisch', x.hook, 'beurten ' + x.beurten, reden(x)].filter(Boolean).join(' · ')) + '</span><br>' + x.berichten.slice(0, 10).map(m => (m.r === 'b' ? '<b>WAM</b> ' : '<b>Bezoeker</b> ') + esc(kort(m.x, 240))).join('<br>') + '</div>').join('') || '<p>Nog geen gesprekken.</p>'}
</body></html>`;
}
