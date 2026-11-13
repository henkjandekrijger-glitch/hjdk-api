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
import * as POST from './wam-post.js';
import * as PUSH from './wam-push.js';
import { HOOKS, VARIANTEN } from './wam-hooks.js';
import * as LEER from './wam-leer.js';
import * as FLOW from './wam-flow.js';
import { put as blobPut, get as blobGet } from '@vercel/blob';

export const PLAFOND = Number(process.env.WAM_AI_PLAFOND || 10); // Henkjan 12 nov 22:16 UTC: "Ja mag naar 10 per dag bij hele goed rapportage" (was 5); // dollar per UTC-dag voor alle AI van WAM
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
// link in post terug naar de chat (zelfde profiel) en de stoplink: vid plus handtekening
export async function linkTok(vid) { return vid + createHmac('sha256', await geheim()).update('wamp|' + vid).digest('hex').slice(0, 16); }
export async function vidVanLink(w) { w = String(w || ''); if (!/^[0-9a-f]{32}$/.test(w)) return null; const vid = w.slice(0, 16); return (await linkTok(vid)) === w ? vid : null; }
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
// per advertentietitel (variant) tellen, zodat de dagelijkse kopieën (propellerads-mcp lib/wamkopie.ts) de zwakste variant vervangen
async function telTitel(t, veld, d = dag(), test = false) { if (!t || test) return; await Promise.all([kv.raw(['HINCRBY', 'wam:tt:' + d, String(t).slice(0, 80) + '|' + veld, '1']), kv.raw(['EXPIRE', 'wam:tt:' + d, String(TTL.teller)])].map(p => p.catch(() => {}))); }
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
  const ku = 'wam:kostu:' + dag();
  await Promise.all([kv.raw(['HINCRBY', k, 'totaal', String(micro)]), kv.raw(['HINCRBY', k, fn, String(micro)]), kv.raw(['EXPIRE', k, String(TTL.teller)]), kv.raw(['HINCRBY', ku, String(new Date().getUTCHours()), String(micro)]), kv.raw(['EXPIRE', ku, String(TTL.teller)])].map(p => p.catch(() => {})));
}
export async function kostVandaag(d = dag()) { const v = await kv.raw(['HGET', 'wam:kost:' + d, 'totaal']).catch(() => 0); return N(v) / 1e6; }
async function binnenPlafond(marge = 0) { const ok = (await kostVandaag()) + marge < PLAFOND; if (!ok && !marge) kv.raw(['SET', 'wam:plafondop:' + dag(), String(Date.now()), 'NX', 'EX', '172800']).catch(() => {}); return ok; }
// AI-kosten voor het rapport (Henkjan: plafond 10 "bij hele goed rapportage"): per dag totaal, per onderdeel, per UTC-uur, per echt mens en per echt gesprek, en wanneer het plafond op was
export async function kostStand(dagen = 3) {
  const uit = [];
  for (let i = 0; i < dagen; i++) {
    const d = dag(Date.now() - i * 86400000), [k, u, c, op] = await Promise.all([hget('wam:kost:' + d).catch(() => ({})), hget('wam:kostu:' + d).catch(() => ({})), hget('wam:c:' + d).catch(() => ({})), kv.get('wam:plafondop:' + d).catch(() => null)]);
    const usd = x => Math.round(N(x) / 1e4) / 100, tot = N(k.totaal) / 1e6;
    const per = Object.fromEntries(Object.entries(k).filter(([f]) => f !== 'totaal').map(([f, v]) => [f, usd(v)]).sort((a, b) => b[1] - a[1]));
    uit.push({ dag: d, totaal: Math.round(tot * 100) / 100, plafond: PLAFOND, op_om: op ? new Date(N(op)).toISOString().slice(11, 16) + ' UTC' : null, per_onderdeel: per, per_uur_utc: Object.fromEntries(Object.entries(u).sort((a, b) => N(a[0]) - N(b[0])).map(([h, v]) => [h, usd(v)])), echt: N(c.echt), dialoog: N(c.dialoog), per_echt_cent: N(c.echt) ? Math.round(10000 * tot / N(c.echt)) / 100 : null, per_dialoog_cent: N(c.dialoog) ? Math.round(10000 * tot / N(c.dialoog)) / 100 : null, regel: N(c.regel), wachtrij: N(c.cq_in) });
  }
  return uit;
}

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
  { id: 'de-teveel', taal: 'de', familie: 'besparen', tekst: '{groet}! Zahlst du irgendwo zu viel? Sag mir was, ich schaue, ob es günstiger geht.', knoppen: ['Strom & Gas', 'Handy oder Internet', 'Versicherung', 'Etwas anderes'] },
  // vrij: de opening mag over alles gaan (Henkjan 9 nov: "Je bent vrij om te leren dus start van gesprek kan overal over gaan")
  { id: 'en-vrij1', taal: 'en', familie: 'vrij', tekst: '{groet}! If I could take one annoying thing off your plate this week, what would it be?', knoppen: ['A bill', 'Paperwork', 'Finding something', 'Something else'] },
  { id: 'en-vrij2', taal: 'en', familie: 'vrij', tekst: '{groet}! I\'m an AI that looks things up for you, for free. Try me: what have you been wondering about lately?', knoppen: ['Is it worth it?', 'How do I…', 'Best option for…', 'Surprise me'] },
  { id: 'en-vrij3', taal: 'en', familie: 'vrij', tekst: '{groet}! What\'s on your mind today?', knoppen: ['Money', 'Something to buy', 'A problem', 'Just curious'] },
  { id: 'nl-vrij1', taal: 'nl', familie: 'vrij', tekst: '{groet}! Als ik deze week één gedoe van je over mocht nemen, wat zou dat zijn?', knoppen: ['Een rekening', 'Papierwerk', 'Iets zoeken', 'Iets anders'] },
  { id: 'nl-vrij2', taal: 'nl', familie: 'vrij', tekst: '{groet}! Ik ben een AI die dingen voor je uitzoekt, gratis. Probeer maar: waar vroeg je je laatst iets over af?', knoppen: ['Is het het waard?', 'Hoe doe ik…', 'Beste keus voor…', 'Verras me'] },
  { id: 'nl-vrij3', taal: 'nl', familie: 'vrij', tekst: '{groet}! Waar loop je vandaag mee rond?', knoppen: ['Geld', 'Iets kopen', 'Een probleem', 'Gewoon nieuwsgierig'] },
  { id: 'de-vrij1', taal: 'de', familie: 'vrij', tekst: '{groet}! Wenn ich dir diese Woche eine lästige Sache abnehmen dürfte, welche wäre das?', knoppen: ['Eine Rechnung', 'Papierkram', 'Etwas finden', 'Etwas anderes'] },
  { id: 'de-vrij2', taal: 'de', familie: 'vrij', tekst: '{groet}! Ich bin eine KI, die Dinge für dich recherchiert, kostenlos. Probier es: worüber hast du dich zuletzt gewundert?', knoppen: ['Lohnt sich das?', 'Wie mache ich…', 'Beste Wahl für…', 'Überrasch mich'] },
  { id: 'en-vrij4', taal: 'en', familie: 'vrij', tekst: '{groet}! 30-second check: tap what you pay for every month and I\'ll tell you where people most often overpay.', knoppen: ['Phone', 'Broadband', 'Energy', 'Insurance'] },
  { id: 'en-vrij5', taal: 'en', familie: 'vrij', tekst: '{groet}! Ask me anything you\'ve been too busy to look up. I\'ll find the answer in seconds.', knoppen: ['Best deal on…', 'Is it worth it?', 'How do I…', 'Surprise me'] },
  { id: 'en-vrij6', taal: 'en', familie: 'vrij', tekst: '{groet}! Want one free or cheap thing to do near you this week? I\'ll look it up.', knoppen: ['Yes, find one', 'Something for kids', 'Food & drinks', 'Something else'] },
  { id: 'nl-vrij4', taal: 'nl', familie: 'vrij', tekst: '{groet}! Check van 30 seconden: tik wat je elke maand betaalt, dan zeg ik waar mensen het vaakst te veel betalen.', knoppen: ['Telefoon', 'Internet', 'Energie', 'Verzekering'] },
  { id: 'nl-vrij5', taal: 'nl', familie: 'vrij', tekst: '{groet}! Zin in iets leuks of gratis bij jou in de buurt deze week? Ik zoek het voor je op.', knoppen: ['Ja, zoek iets', 'Met kinderen', 'Eten & drinken', 'Iets anders'] },
  { id: 'de-vrij4', taal: 'de', familie: 'vrij', tekst: '{groet}! 30-Sekunden-Check: Tipp an, was du jeden Monat zahlst, und ich sage dir, wo Leute am häufigsten zu viel zahlen.', knoppen: ['Handy', 'Internet', 'Strom & Gas', 'Versicherung'] },
  { id: 'de-vrij5', taal: 'de', familie: 'vrij', tekst: '{groet}! Lust auf etwas Schönes oder Kostenloses in deiner Nähe diese Woche? Ich suche es dir raus.', knoppen: ['Ja, such was', 'Mit Kindern', 'Essen & Trinken', 'Etwas anderes'] },
  { id: 'de-vrij3', taal: 'de', familie: 'vrij', tekst: '{groet}! Was beschäftigt dich heute?', knoppen: ['Geld', 'Etwas kaufen', 'Ein Problem', 'Nur neugierig'] },
  // peilingen (Henkjan 9 nov: benchmark over alles, niet alleen geld): een tik is meteen een anoniem antwoord, de bot vergelijkt
  { id: 'en-peil1', taal: 'en', familie: 'peil', peil: 'bedtime', tekst: '{groet}! Quick anonymous poll: what time did you go to bed last night? Tap one and I\'ll show you how you compare.', knoppen: ['Before 10pm', '10pm to midnight', 'After midnight', 'Haven\'t yet'] },
  { id: 'en-peil2', taal: 'en', familie: 'peil', peil: 'change_one_thing', tekst: '{groet}! Anonymous poll: if you could change one thing about your week, what would it be? I\'ll tell you what everyone else picked.', knoppen: ['More sleep', 'More money', 'More free time', 'Less hassle'] },
  { id: 'en-peil3', taal: 'en', familie: 'peil', peil: 'screen_time', tekst: '{groet}! Be honest, it\'s anonymous: how many hours a day are you on your phone? Tap a guess and see how you compare.', knoppen: ['Under 2', '2 to 4', '4 to 6', 'More than 6'] },
  { id: 'en-uil1', taal: 'en', familie: 'uil', peil: 'morning_or_night', tekst: '{groet}! Night owl or early bird? Tap one and I\'ll show you what everyone else said.', knoppen: ['Night owl', 'Early bird', 'Neither', 'Depends on the day'] },
  { id: 'nl-peil1', taal: 'nl', familie: 'peil', peil: 'bedtime', tekst: '{groet}! Korte anonieme peiling: hoe laat ging je gisteren slapen? Tik er een, dan zie je hoe je je verhoudt tot de rest.', knoppen: ['Voor 22.00', '22.00 tot 0.00', 'Na middernacht', 'Nog niet'] },
  { id: 'nl-peil2', taal: 'nl', familie: 'peil', peil: 'change_one_thing', tekst: '{groet}! Anonieme peiling: als je één ding aan je week kon veranderen, wat zou het zijn? Ik vertel je wat de rest koos.', knoppen: ['Meer slaap', 'Meer geld', 'Meer vrije tijd', 'Minder gedoe'] },
  { id: 'nl-uil1', taal: 'nl', familie: 'uil', peil: 'morning_or_night', tekst: '{groet}! Ochtendmens of nachtuil? Tik er een, dan laat ik zien wat de rest zei.', knoppen: ['Nachtuil', 'Ochtendmens', 'Geen van beide', 'Hangt ervan af'] },
  { id: 'de-peil1', taal: 'de', familie: 'peil', peil: 'bedtime', tekst: '{groet}! Kurze anonyme Umfrage: wann bist du gestern ins Bett gegangen? Tipp eins und sieh, wie du im Vergleich liegst.', knoppen: ['Vor 22 Uhr', '22 bis 24 Uhr', 'Nach Mitternacht', 'Noch gar nicht'] },
  { id: 'de-peil2', taal: 'de', familie: 'peil', peil: 'change_one_thing', tekst: '{groet}! Anonyme Umfrage: wenn du eine Sache an deiner Woche ändern könntest, welche wäre es? Ich sag dir, was die anderen wählten.', knoppen: ['Mehr Schlaf', 'Mehr Geld', 'Mehr Freizeit', 'Weniger Stress'] },
  { id: 'de-uil1', taal: 'de', familie: 'uil', peil: 'morning_or_night', tekst: '{groet}! Frühaufsteher oder Nachteule? Tipp eins und ich zeig dir, was die anderen sagten.', knoppen: ['Nachteule', 'Frühaufsteher', 'Weder noch', 'Kommt drauf an'] },
  // irritatie (Henkjan 9 nov: "Test ook vragen over bedrijven die meeste irritaties opwekken"): soort bedrijf met een tik, dan welk bedrijf
  { id: 'en-irr1', taal: 'en', familie: 'irritatie', peil: 'most_annoying_type', tekst: '{groet}! Anonymous poll: what kind of company annoys you most right now? Tap one, I\'ll show you who tops the list and help you deal with them.', knoppen: ['Phone or internet', 'Energy', 'Bank or insurer', 'Something else'] },
  { id: 'en-irr2', taal: 'en', familie: 'irritatie', peil: 'most_annoying_type', tekst: '{groet}! Which company drives you mad lately? Tell me anonymously and I\'ll tell you how many others are fed up with them too.', knoppen: ['Phone or internet', 'Energy', 'Bank or insurer', 'Something else'] },
  { id: 'nl-irr1', taal: 'nl', familie: 'irritatie', peil: 'most_annoying_type', tekst: '{groet}! Anonieme peiling: wat voor bedrijf irriteert je nu het meest? Tik er een, dan zie je wie bovenaan staat en help ik je ermee.', knoppen: ['Telefoon of internet', 'Energie', 'Bank of verzekeraar', 'Iets anders'] },
  { id: 'de-irr1', taal: 'de', familie: 'irritatie', peil: 'most_annoying_type', tekst: '{groet}! Anonyme Umfrage: welche Art Firma nervt dich gerade am meisten? Tipp eins, dann siehst du, wer oben steht, und ich helfe dir.', knoppen: ['Handy oder Internet', 'Energie', 'Bank oder Versicherung', 'Etwas anderes'] },
  // aanbod (Henkjan 9 nov: supply en demand, "zoek je klanten, wat biedt je aan, we vinden deze voor je in London of daarbuiten")
  { id: 'en-aanbod1', taal: 'en', familie: 'aanbod', tekst: '{groet}! Looking for customers? Tell me what you offer and where. I\'ll find people here who need it, in your city or beyond.', knoppen: ['A service', 'Something I sell', 'A job opening', 'A room to rent'] },
  // route "ik praat met iedereen, dus praat met mij en je hebt contact met iedereen" (Henkjan 10 nov 16:09); WAM spreekt ~300 mensen per dag
  { id: 'en-match1', taal: 'en', familie: 'aanbod', tekst: '{groet}! I talk with hundreds of people here every day. Tell me what you offer or need, and I\'ll tell you right away who matches.', knoppen: ['A room to rent', 'A job opening', 'A service', 'I need something'] },
  { id: 'en-match2', taal: 'en', familie: 'zoek', tekst: '{groet}! Looking for a room, work or someone to help? Tell me what. I talk with hundreds of people here and tell you right away who offers it.', knoppen: ['A room', 'Work', 'Someone to help', 'Something else'] },
  { id: 'nl-match1', taal: 'nl', familie: 'aanbod', tekst: '{groet}! Ik praat elke dag met honderden mensen hier. Zeg wat je aanbiedt of zoekt, dan zeg ik meteen wie erbij past.', knoppen: ['Een kamer te huur', 'Een vacature', 'Een dienst', 'Ik zoek iets'] },
  { id: 'de-match1', taal: 'de', familie: 'aanbod', tekst: '{groet}! Ich spreche jeden Tag mit Hunderten Leuten hier. Sag mir, was du anbietest oder suchst, und ich sage dir sofort, wer passt.', knoppen: ['Ein Zimmer', 'Eine Stelle', 'Eine Dienstleistung', 'Ich suche etwas'] },
  { id: 'en-aanbod2', taal: 'en', familie: 'aanbod', tekst: '{groet}! What do you do or sell? Tell me, and I\'ll match you with people looking for exactly that.', knoppen: ['I fix or build things', 'I teach or coach', 'I cook or bake', 'Something else'] },
  { id: 'nl-aanbod1', taal: 'nl', familie: 'aanbod', tekst: '{groet}! Op zoek naar klanten? Zeg wat je aanbiedt en waar. Ik zoek mensen die het nodig hebben, in je stad of daarbuiten.', knoppen: ['Een dienst', 'Iets wat ik verkoop', 'Een vacature', 'Een kamer'] },
  { id: 'de-aanbod1', taal: 'de', familie: 'aanbod', tekst: '{groet}! Suchst du Kunden? Sag mir, was du anbietest und wo. Ich finde Leute, die es brauchen, in deiner Stadt oder darüber hinaus.', knoppen: ['Eine Dienstleistung', 'Etwas, das ich verkaufe', 'Eine offene Stelle', 'Ein Zimmer'] },
  // zoeken (Henkjan 9 nov: "Zeg wat je zoekt en we vinden het, kan ook baan zijn etc, en je vraagt door")
  { id: 'en-zoek1', taal: 'en', familie: 'zoek', tekst: '{groet}! Tell me what you\'re looking for: a job, a place to live, something to buy, or someone to help. I\'ll ask a couple of things, search now and keep looking for you.', knoppen: ['A job', 'A place to live', 'Something to buy', 'Someone to help me'] },
  { id: 'en-zoek2', taal: 'en', familie: 'zoek', tekst: '{groet}! What are you looking for right now? I\'ll remember it and tell you when I find it.', knoppen: ['A job', 'A home', 'A good deal', 'A buddy for something'] },
  { id: 'nl-zoek1', taal: 'nl', familie: 'zoek', tekst: '{groet}! Zeg wat je zoekt: een baan, een woning, iets om te kopen of iemand die je helpt. Ik vraag even door, zoek meteen en blijf voor je zoeken.', knoppen: ['Een baan', 'Een woning', 'Iets kopen', 'Iemand die helpt'] },
  { id: 'nl-zoek2', taal: 'nl', familie: 'zoek', tekst: '{groet}! Wat zoek je op dit moment? Ik onthoud het en laat het je weten zodra ik het gevonden heb.', knoppen: ['Een baan', 'Een woning', 'Een goede deal', 'Iemand om mee te…'] },
  // Rotterdam (11 nov 16:25 UTC): de best scorende vorm wereldwijd (anonieme peiling, en-peil3 15%) in het Nederlands, plus huur en kamer
  { id: 'nl-peil3', taal: 'nl', familie: 'peil', peil: 'screen_time', tekst: '{groet}! Eerlijk, het is anoniem: hoeveel uur per dag zit jij op je telefoon? Gok er een en zie hoe je je verhoudt.', knoppen: ['Minder dan 2', '2 tot 4', '4 tot 6', 'Meer dan 6'] },
  { id: 'nl-huur1', taal: 'nl', familie: 'huur', peil: 'rent_band_eur', tekst: '{groet}! Anoniem: wat betaal jij per maand aan huur? Tik je bedrag, dan zie je wat anderen betalen en zoek ik mee als je iets beters wilt.', knoppen: ['Onder €800', '€800 tot €1.200', '€1.200 tot €1.600', 'Meer dan €1.600'] },
  { id: 'nl-huur2', taal: 'nl', familie: 'huur', tekst: '{groet}! Woon je goed, of zoek je iets anders? Zeg wat je zoekt of wat je verhuurt, dan zet ik het erin en zoek ik de match.', knoppen: ['Ik zoek een kamer', 'Ik zoek een huis', 'Ik verhuur iets', 'Ik woon prima'] },
  { id: 'en-huur1', taal: 'en', familie: 'huur', peil: 'rent_band_usd', tekst: '{groet}! Anonymous: how much rent do you pay a month? Tap your amount, see what others pay, and I\'ll look for something better if you want.', knoppen: ['Under $1,500', '$1,500 to $2,200', '$2,200 to $3,000', 'Over $3,000'] },
  { id: 'nl-zoek3', taal: 'nl', familie: 'zoek', tekst: '{groet}! Zoek je een kamer of woning? Zeg je budget en welke buurt. Ik onthoud het en meld me zodra iemand iets aanbiedt.', knoppen: ['Kamer', 'Studio', 'Huurhuis', 'Iets anders'] },
  { id: 'de-zoek1', taal: 'de', familie: 'zoek', tekst: '{groet}! Sag mir, was du suchst: einen Job, eine Wohnung, etwas zum Kaufen oder jemanden, der hilft. Ich frage kurz nach, suche sofort und bleibe dran.', knoppen: ['Einen Job', 'Eine Wohnung', 'Etwas kaufen', 'Jemanden, der hilft'] },
  { id: 'de-zoek2', taal: 'de', familie: 'zoek', tekst: '{groet}! Was suchst du gerade? Ich merke es mir und melde mich, sobald ich es gefunden habe.', knoppen: ['Einen Job', 'Eine Wohnung', 'Ein gutes Angebot', 'Jemanden für…'] },
];
const GROET = {
  nl: ['Goedemorgen', 'Goedemiddag', 'Goedenavond', 'Hoi'], en: ['Good morning', 'Good afternoon', 'Good evening', 'Hi'], de: ['Guten Morgen', 'Hallo', 'Guten Abend', 'Hallo'],
  fr: ['Bonjour', 'Bonjour', 'Bonsoir', 'Salut'], es: ['Buenos días', 'Buenas tardes', 'Buenas noches', 'Hola'], it: ['Buongiorno', 'Buon pomeriggio', 'Buonasera', 'Ciao'],
  pt: ['Bom dia', 'Boa tarde', 'Boa noite', 'Olá'], pl: ['Dzień dobry', 'Dzień dobry', 'Dobry wieczór', 'Cześć']
};
export function groet(taal, uur) { const g = GROET[taal] || GROET.en; if (uur == null || !Number.isFinite(uur)) return g[3]; return uur >= 5 && uur < 12 ? g[0] : uur >= 12 && uur < 18 ? g[1] : uur >= 18 && uur < 24 ? g[2] : g[3]; }

export async function openers() {
  let o = await kv.get('wam:o').catch(() => null);
  if (!o || typeof o !== 'object') o = {};
  let nieuw = false; for (const z of ZAAD) if (!o[z.id]) { o[z.id] = Object.assign({ actief: true, bron: 'zaad', t: Date.now() }, z); nieuw = true; }
  if (nieuw) await kv.set('wam:o', o).catch(() => {});
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
const score = s => ({ a: 1 + N(s.e) + N(s.b3) + 3 * N(s.c) + 3 * N(s.t) + 3 * N(s.v), b: 1 + Math.max(0, N(s.g) - N(s.e)) }); // b3: tot beurt 3 (north star engagementtijd, Henkjan 9 nov)
export async function kiesOpener(taal, familie) {
  const o = await openers(); const st = await openerStand();
  let pool = Object.values(o).filter(x => x.actief && x.taal === taal);
  if (!pool.length) pool = Object.values(o).filter(x => x.actief && x.taal === 'en');
  // De opener houdt de belofte van de advertentie (10 nov: openers in de familie van de hook 23% tot beurt 3, vrije 16%; en
  // "Forgot a subscription?" kreeg "Looking for customers?" omdat de opzeg- en bespaaropeners door de coach uit stonden).
  // 90% familie, 10% vrij. Staat er in de familie niets aan, dan een uitgezette opener van die familie (eigen taal, dan Engels).
  if (familie && Math.random() < 0.9) {
    const alle = Object.values(o);
    const f = pool.filter(x => x.familie === familie);
    const reserve = alle.filter(x => x.familie === familie && x.taal === taal);
    const reserveEn = alle.filter(x => x.familie === familie && x.taal === 'en');
    if (f.length) pool = f; else if (reserve.length) pool = reserve; else if (reserveEn.length && pool.every(x => x.taal === 'en')) pool = reserveEn; // geen Engelse opener voor een Duitser (10 nov Tübingen)
  }
  let best = null, bw = -1;
  for (const x of pool) { const sc = score(st[x.id] || {}); const w = beta(sc.a, sc.b); if (w > bw) { bw = w; best = x; } }
  return best || ZAAD[0];
}
// ---------- lerende UX (Henkjan 9 nov: "Pak ux van outname.now en maak de hele UX ook lerend") ----------
// Elke bezoeker krijgt per onderdeel van het scherm een variant (Thompson per onderdeel). Beloning zoals bij de openers:
// gesprek begonnen (e) 1, contact (c) 3, later teruggekomen (t) 3 (Henkjan: "Relatie is belangrijker"); per keer gezien (g).
// Tellers in wam:ux (<onderdeel>|<variant>|<veld>). Nieuwe varianten: hier toevoegen en in api/wam.js de CSS-klasse ux-<onderdeel>-<variant>.
// kop en bord (Henkjan 10 nov 17:01: "Fixer niet maar matchmaker, connection ... UX mag echt stukken beter. Lerend nog beter.")
export const UX = { opener: ['held', 'chat'], keuzes: ['pillen'], invoer: ['vast', 'inline'], kop: ['match', 'connect', 'many', 'commons'], bord: ['aan', 'uit'], erger: ['aan', 'uit'], stout: ['aan', 'uit'], scherm: ['oud', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8'], naam: ['wam', 'folky', 'whoz', 'yoohoo', 'hooman'] }; // 23:12 UTC Henkjan "Verzin leukere naam": Folky, Whoz, Yoohoo, Hooman tegen We Are Many // pally eruit 12 nov 23:10 UTC: bestaand AI-merk (pally.com, YC, AI-assistent via WhatsApp en iMessage)
// scherm (Henkjan 12 nov 21:53 UTC, 22:38 UTC acht frames): h1-h8 = kernzin + live + vraag + veld, lerend; oud = vaste controle van 10%. naam: We Are Many, Talk to Many, Ask Everyone of Ask Around bovenaan (Henkjan 22:17 UTC: "betere naam dan WAM ... die meer gaat over met 1 AI praten en tegelijk met dus groot netwerk") ("Moeten we niet vriendelijker naam pakken? Talk to .."). naam 22:38 UTC: "Ik wil kortere naam. Leuker.": We Are Many, WAM, Pally, Matchy, Hoi. De groepsvraag staat niet meer onder het veld maar komt in de dialoog ("Die kerk etc moet je in de dialoog uitleggen niet ervoor").
// stout (Henkjan 11 nov 19:31 UTC: "Kun je ook in dialogen zeggen dat ze stoute dingen mogen zeggen want helemaal anoniem . Dus niet illegaal maar wel stout .  Maak dat ook lerend ."):
// bij aan zegt de opener dat het helemaal anoniem is en dat stout mag, en de bot nodigt er één keer luchtig toe uit; Thompson zoals de andere onderdelen.
const STOUT_LANDEN = ['CA', 'NL', 'US', 'GB', 'DE', 'BE', 'AU'];
const STOUT = { en: 'It\'s fully anonymous, so feel free to be a little naughty.', nl: 'Het is helemaal anoniem, dus je mag best een beetje stout zijn.', de: 'Es ist völlig anonym, du darfst also ruhig ein bisschen frech sein.' };
const STOUT_AI = 'NAUGHTY ALLOWED: this chat is fully anonymous and the visitor was told they may be a little naughty. Once, early and lightly, invite one cheeky honest answer (a guilty pleasure, a petty grudge, something they would never say at work or to their family). Enjoy their answer, play along with humour, then link it back to what they want, offer or compare. Never anything illegal, no sexual content, no hate, no insults about real named private people; if they go there, stay playful and steer back without lecturing.';
export async function uxStand() { const h = await hget('wam:ux'); const o = {}; for (const [k, v] of Object.entries(h)) { const [d, x, f] = k.split('|'); ((o[d] = o[d] || {})[x] = o[d][x] || {})[f] = v; } return o; }
export async function kiesUx() {
  const st = await uxStand().catch(() => ({})), uit = {};
  for (const [d, vars0] of Object.entries(UX)) { const vars = vars0; /* 23:16 UTC: oud doet gewoon mee in Thompson (was vaste 10%), zodat het beste scherm vanzelf het meeste verkeer krijgt */ let best = vars[0], bw = -1; for (const v of vars) { const w = beta(score((st[d] || {})[v] || {}).a, score((st[d] || {})[v] || {}).b); if (w > bw) { bw = w; best = v; } } uit[d] = best; }
  return uit;
}
async function telUx(ux, veld, test) { if (!ux || test) return; await Promise.all(Object.entries(ux).filter(([d, v]) => UX[d] && UX[d].includes(v)).map(([d, v]) => kv.raw(['HINCRBY', 'wam:ux', d + '|' + v + '|' + veld, '1']).catch(() => {}))); }
export function uxKans(st) { const uit = {}; for (const [d, vars] of Object.entries(UX)) { const w = {}; for (const v of vars) w[v] = 0; for (let i = 0; i < 2000; i++) { let b = null, bw = -1; for (const v of vars) { const sc = score((st[d] || {})[v] || {}); const x = beta(sc.a, sc.b); if (x > bw) { bw = x; b = v; } } w[b]++; } for (const v of vars) w[v] = w[v] / 2000; uit[d] = w; } return uit; }

// ---------- contactknop-proef (Henkjan 9 nov: "Blijf testen met andere pills om werkelijk contact te krijgen") ----------
// Vanaf beurt 2, zolang er geen contact is, zet de server één contactknop tussen de keuzes. Welke tekst en welke plek (eerst of
// laatst) kiest Thompson op tik (1) en contact (3). Getikt: meteen de contactkaart, zonder AI, en een echte belofte in de wachtrij
// (samenvatting van het gesprek plus wat er nieuw of goedkoper is), zodat de knop waarmaakt wat hij zegt. Tellers in wam:cpil.
export const CPIL = {
  stuur: { en: 'Send me this', nl: 'Stuur me dit', de: 'Schick mir das' },
  hou: { en: 'Keep me posted', nl: 'Hou me op de hoogte', de: 'Halt mich auf dem Laufenden' },
  herinner: { en: 'Remind me later', nl: 'Herinner me later', de: 'Erinnere mich später' },
  bewaar: { en: 'Save this for me', nl: 'Bewaar dit voor me', de: 'Speicher das für mich' }
};
const CPIL_PLEK = ['eerst', 'laatst'];
const CPIL_DAGEN = { herinner: 3, hou: 3 };
const CPIL_ANTW = { en: 'Sure. Where should I send it? I\'ll only use it for this.', nl: 'Doe ik. Waar mag ik het heen sturen? Ik gebruik het alleen hiervoor.', de: 'Mach ich. Wohin soll ich es schicken? Ich nutze es nur dafür.' };
const cpilScore = t => ({ a: 1 + N(t.k) + 3 * N(t.c), b: 1 + Math.max(0, N(t.g) - N(t.k)) });
export async function cpilStand() { const h = await hget('wam:cpil'); const o = {}; for (const [k, v] of Object.entries(h)) { const [d, x, f] = k.split('|'); ((o[d] = o[d] || {})[x] = o[d][x] || {})[f] = v; } return o; }
async function kiesCpil(taal) {
  if (!CPIL.stuur[taal]) return null; const st = await cpilStand().catch(() => ({}));
  const trek = (d, ids) => { let b = ids[0], bw = -1; for (const id of ids) { const sc = cpilScore((st[d] || {})[id] || {}); const w = beta(sc.a, sc.b); if (w > bw) { bw = w; b = id; } } return b; };
  const id = trek('tekst', Object.keys(CPIL)), plek = trek('plek', CPIL_PLEK);
  return { id, plek, x: CPIL[id][taal] };
}
async function telCpil(c, veld, test) { if (!c || test) return; await Promise.all([kv.raw(['HINCRBY', 'wam:cpil', 'tekst|' + c.id + '|' + veld, '1']), kv.raw(['HINCRBY', 'wam:cpil', 'plek|' + c.plek + '|' + veld, '1'])].map(x => x.catch(() => {}))); }
const heeftContact = p => !!(p && p.contact && (p.contact.mail || p.contact.tg || p.contact.wa || p.contact.push || p.contact.tel));

// kans dat elke opener de beste is (voor de eigenaarspagina en het uitzetten van verliezers)
export function kansBeste(lijst, st, n = 3000) {
  const win = Object.fromEntries(lijst.map(x => [x.id, 0]));
  for (let i = 0; i < n; i++) { let b = null, bw = -1; for (const x of lijst) { const sc = score(st[x.id] || {}); const w = beta(sc.a, sc.b); if (w > bw) { bw = w; b = x.id; } } win[b]++; }
  return Object.fromEntries(Object.entries(win).map(([k, v]) => [k, v / n]));
}

// ---------- advertentie -> hook -> familie ----------
// Bij het maken van een campagne slaan we per advertentie (banner-id) op welke hook ze gebruikt: wam:cr:<id> = { hook, familie, tekst }.
export async function hookVan(b) { if (!/^\d{3,14}$/.test(String(b || ''))) return null; return kv.get('wam:cr:' + b).catch(() => null); }
// titel -> hook en knoptekst, voor de dagelijkse kopieën (propellerads-mcp lib/wamkopie.ts): een kopie krijgt nieuwe banner-ids,
// die per titel weer aan hun hook gekoppeld worden. Bron: de hooks in lib/wam-hooks.js plus alles wat met hookzet is vastgelegd.
// score per hook en per titel over de laatste 3 dagen: g = opener gezien, e = in gesprek (eerste tik), c = contact
export async function hookScore(dagen = 3) {
  const hooks = {}, titels = {};
  for (let i = 0; i < dagen; i++) {
    const d = dag(Date.now() - i * 86400000);
    for (const [sleutel, doel] of [['wam:ht:' + d, hooks], ['wam:tt:' + d, titels]]) {
      const h = await kv.raw(['HGETALL', sleutel]).catch(() => null);
      if (Array.isArray(h)) for (let j = 0; j + 1 < h.length; j += 2) { const k = String(h[j]); const p = k.lastIndexOf('|'); const naam = k.slice(0, p), veld = k.slice(p + 1); doel[naam] = doel[naam] || { g: 0, e: 0, c: 0 }; doel[naam][veld] = N(doel[naam][veld]) + N(h[j + 1]); }
    }
  }
  return { hooks, titels };
}
export async function titelHooks() {
  const uit = {};
  for (const [hook, x] of Object.entries(HOOKS)) for (const taal of ['en', 'nl', 'de']) { const t = x[taal]; if (t && t.titel && !uit[t.titel]) uit[t.titel] = { hook, taal, knop: t.knop || '', tekst: t.tekst || '' }; }
  for (const v of VARIANTEN) if (!uit[v.titel]) uit[v.titel] = { hook: v.hook, taal: v.taal, knop: v.knop, tekst: v.tekst };
  const h = await kv.raw(['HGETALL', 'wam:titelhook']).catch(() => null);
  if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) { try { uit[h[i]] = Object.assign({}, uit[h[i]] || {}, JSON.parse(h[i + 1])); } catch (e) { /* overslaan */ } }
  return uit;
}
export async function onthoudTitel(titel, v) { if (!titel) return; await kv.raw(['HSET', 'wam:titelhook', String(titel).slice(0, 80), JSON.stringify(v)]).catch(() => {}); }
export async function zetHook(b, v) { if (!/^\d{3,14}$/.test(String(b || ''))) return false; await kv.set('wam:cr:' + b, v); await kv.raw(['SADD', 'wam:crs', String(b)]); return true; }

// ---------- context uit de browser en het IP ----------
export function taalVan(accept, land) {
  const t = String(accept || '').toLowerCase().split(',').map(x => x.trim().slice(0, 2)).find(x => TALEN.includes(x));
  if (t) return t; const l = String(land || '').toUpperCase();
  return { NL: 'nl', BE: 'nl', DE: 'de', AT: 'de', CH: 'de', FR: 'fr', ES: 'es', MX: 'es', IT: 'it', PT: 'pt', BR: 'pt', PL: 'pl' }[l] || 'en';
}
export function lokaalUur(tz) { try { return Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz || 'UTC' }).format(new Date())); } catch (e) { return new Date().getUTCHours(); } }
export function apparaat(ua) { ua = String(ua || ''); return { os: /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : /Windows/.test(ua) ? 'windows' : /Mac OS X/.test(ua) ? 'mac' : /Linux/.test(ua) ? 'linux' : 'anders', mobiel: /Mobi|Android|iPhone|iPad/i.test(ua), app: /FBAN|FBAV|Instagram|Telegram|WhatsApp|Line\//.test(ua) ? 'inapp' : '' }; }
export function lijktBot(ua) { return !ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|phantom|python|curl|wget|httpclient|monitor|^whatsapp\/|iframely|embedly/i.test(String(ua)); } // ^whatsapp/: de linkvoorbeeld-ophaler van WhatsApp (12 nov: telde anders als bezoek op een groepsvraag)

// ---------- profiel en gesprek ----------
export async function profiel(vid) { if (!/^[0-9a-f]{16}$/.test(String(vid || ''))) return null; return kv.get('wam:p:' + vid).catch(() => null); }
async function bewaarProfiel(p) { p.laatst = Date.now(); await kv.set('wam:p:' + p.vid, p, { ex: TTL.p }); }
export function nieuwProfiel(vid, ctx) { return { vid, eerst: Date.now(), laatst: Date.now(), bezoeken: 0, taal: ctx.taal, land: ctx.land, stad: ctx.stad, intenties: [], feiten: {}, contact: {}, samenvatting: '', sessies: [] }; }
export async function sessie(sid) { if (!/^[0-9a-f]{16}$/.test(String(sid || ''))) return null; return kv.get('wam:s:' + sid).catch(() => null); }
async function bewaarSessie(s) { await kv.set('wam:s:' + s.sid, s, { ex: s.echt ? TTL.s : TTL.s0 }); }

// Nieuwe sessie bij het openen van de pagina (server-side, voordat er JS draait). Geeft de opener terug die in de HTML komt.
export async function startSessie({ vid, ctx, params }) {
  const sid = hex(8), tok = await teken(sid);
  // zelfde bezoeker binnen 30 minuten terug zonder advertentiecode (logo, privacy, terug-knop): hoort bij dezelfde klik (10 nov: 98 nep-organische gesprekken in een uur)
  let intern = false;
  if (!ctx.test) { if (params.n) await kv.set('wam:vparams:' + vid, params, { ex: 1800 }).catch(() => {}); else { const v = await kv.get('wam:vparams:' + vid).catch(() => null); if (v && v.n) { Object.assign(params, v); intern = true; } } }
  const p = (await profiel(vid)) || null;
  const hk = await hookVan(params.b);
  // taal van de advertentie gaat voor (11 nov: alle Rotterdam-gesprekken liepen in het Engels terwijl de advertentie Nederlands was)
  if (hk && hk.taal && hk.taal !== 'en' && hk.taal !== ctx.taal && TALEN.includes(hk.taal)) { ctx.taalBrowser = ctx.taal; ctx.taal = hk.taal; }
  let opener, terug = false;
  if (p && (p.intenties || []).length && p.bezoeken > 0) {
    terug = true; const w = p.intenties[p.intenties.length - 1];
    const T = { nl: ['Welkom terug! Vorige keer ging het over: ' + kort(w.wat, 80) + '. Zullen we daar verder mee?', ['Ja, verder', 'Iets nieuws', 'Wat weet je nog?']],
      en: ['Welcome back! Last time we talked about: ' + kort(w.wat, 80) + '. Shall we continue?', ['Yes, continue', 'Something new', 'What do you remember?']],
      de: ['Willkommen zurück! Letztes Mal ging es um: ' + kort(w.wat, 80) + '. Machen wir weiter?', ['Ja, weiter', 'Etwas Neues', 'Was weißt du noch?']] }[ctx.taal] || null;
    const t = T || ['Welcome back! Last time we talked about: ' + kort(w.wat, 80) + '. Shall we continue?', ['Yes, continue', 'Something new', 'What do you remember?']];
    opener = { id: 'terug', taal: ctx.taal, familie: 'terug', tekst: t[0], knoppen: t[1] };
  } else opener = (ctx.openerTest && ZAAD.find(o => o.id === ctx.openerTest)) || await kiesOpener(ctx.taal, hk && hk.familie);
  // via een deellink van een vriend (Henkjan 12 nov): eigen opener, en bij 'vraag' meteen wat de vriend zoekt of biedt
  const hl = params.h ? await hulpOpener(params, vid, ctx.taal).catch(() => null) : null;
  const rf = !hl && !terug && !params.n ? await refOpener(params, vid, ctx.taal).catch(() => null) : null; if (rf) opener = rf.opener; if (hl) opener = hl.opener;
  const deelM = (ctx.deelTest && DEEL_MOMENT.includes(ctx.deelTest) ? ctx.deelTest : '') || await kiesDeelMoment().catch(() => 'maak');
  const raD = (ctx.diepteTest && DIEPTE.includes(ctx.diepteTest) ? ctx.diepteTest : '') || await kiesDiepte().catch(() => 'd2');
  const cta = { verbind: await kiesCta('verbind', ctx.taal).catch(() => 'c1'), deel: await kiesCta('deel', ctx.taal).catch(() => 'w1'), whatsapp: await kiesCta('whatsapp', ctx.taal).catch(() => 'a1'), wastart: await kiesCta('wastart', ctx.taal).catch(() => 's1') };
  // relatie: komt iemand terug, dan krijgen de opener en de UX van zijn vorige gesprek het krediet (t)
  if (p && p.sessies && p.sessies.length && !ctx.test) { const vorige = await sessie(p.sessies[p.sessies.length - 1]).catch(() => null); if (vorige && !vorige.terugGeteld) { vorige.terugGeteld = Date.now(); await telOpener(vorige.opener, 't'); await telUx(vorige.ux, 't'); await bewaarSessie(vorige).catch(() => {}); } }
  const ux = Object.assign(await kiesUx(), ctx.uxTest || {}); if (hk && PUNCH[hk.hook] && !(ctx.uxTest && ctx.uxTest.scherm)) ux.scherm = hk.hook; // advertentie met frame hN: zelfde kernzin op de pagina
  // stout alleen waar het publiek volwassen lijkt (11 nov: in Delhi vroegen kinderen om Roblox-codes en anderen om seks)
  if (!STOUT_LANDEN.includes(String(ctx.land || '').toUpperCase()) && !(ctx.uxTest && ctx.uxTest.stout)) delete ux.stout;
  // groepsvraag via ?kr=: de vraag van de groep (lid) of de antwoorden (maker); verder het beginscherm met kernzin (scherm p1-p3), ook voor wie terugkomt
  // (Henkjan 12 nov 21:53 UTC over 'Welcome back': "Dit is ook zo onaantrekkelijk")
  const kr = ctx.kr ? await kringLaad(ctx.kr) : null, krEigen = !!(kr && kr.maker === vid), KT = kr ? krT(kr.taal) : null; let krStart = null, punch = null, krOpenNieuw = false, pknKaart = null;
  if (kr || rf || hl) delete ux.scherm;
  if (kr) for (const d of ['opener', 'bord', 'erger', 'stout', 'kop', 'invoer']) delete ux[d]; // groepsvraag-scherm: alleen de vraag en het veld
  if (kr) {
    const n = N(await kv.raw(['LLEN', 'wam:kra:' + kr.id]).catch(() => 0));
    if (krEigen) { const o = await kringOverzicht(kr, true); opener = { id: 'kring_eigen', tekst: o.x, knoppen: o.n >= 3 ? [KT.prive(kr.naam)] : [] }; krStart = { eigen: 1, naam: kr.naam, vraag: kr.vraag, n, deel: krDeel(kr) }; }
    else {
      opener = { id: 'kring', tekst: KT.antwVraag(kr.naam), knoppen: [] }; krStart = { naam: kr.naam, vraag: kr.vraag, n, sub: KT.sub(kr.naam, n), ph: KT.ph };
      if (!ctx.test && N(await kv.raw(['SADD', 'wam:kro:' + kr.id, h12(vid)]).catch(() => 0)) === 1) { kv.raw(['EXPIRE', 'wam:kro:' + kr.id, String(90 * 86400)]).catch(() => {}); if (!kr.test) await krTel(kr.v, 'o', false); krOpenNieuw = true; }
    }
  } else if (!hl && ux.scherm && ux.scherm !== 'oud' && PUNCH[ux.scherm]) {
    const tl = PUNCH[ux.scherm][ctx.taal] ? ctx.taal : 'en';
    punch = { kop: PUNCH[ux.scherm][tl], live: await liveRegel(ctx.land, ctx.taal).catch(() => null), ph: PPH[tl] || PPH.en };
    // 23:16 UTC: alleen een veld werkte niet (h1-h8 zonder knoppen: 190 gezien, 1 begon; oud met knoppen 36%): de vraag krijgt weer tikopties, uit het live bord (echte aantallen)
    await bordVoor(ctx.land, ctx.taal).catch(() => null); // vult wam:bord:<land> met de echte aantallen
    const kz = await kiesKnoppen(ctx.land, tl).catch(() => null); if (kz) { pknKaart = kz.kaart; if (!ctx.test) for (const [id] of Object.values(kz.kaart)) kv.raw(['HINCRBY', 'wam:pkn', id + '|g', '1']).catch(() => {}); }
    opener = { id: 'punch', tekst: PCTA[tl] || PCTA.en, knoppen: kz && kz.labels.length ? kz.labels : (PKN[tl] || PKN.en) };
    for (const d of ['opener', 'bord', 'erger', 'stout', 'kop', 'invoer']) delete ux[d];
  }
  const tekst = opener.tekst.replace('{groet}', groet(ctx.taal, ctx.uur)).replace('{stad}', ctx.stad || '') + (ux.stout === 'aan' && !terug ? ' ' + (STOUT[ctx.taal] || STOUT.en) : '');
  await waLaad(); const start = await kiesStart(ctx, params, terug, !!rf || !!kr || !!hl).catch(() => 'web'); const waCode = start === 'wa' ? await contactCode(vid) : '';
  // de WhatsApp-start roept nooit zeg aan, dus het profiel kent deze sessie niet: code -> sessie apart bewaren (12 nov 20:40 UTC: Henkjans test kreeg een algemeen antwoord in plaats van een antwoord op zijn wens)
  if (waCode) await kv.set('wam:wasid:' + waCode, sid, { ex: 6 * 3600 }).catch(() => {});
  const waV = start === 'wa' ? (['w0', 'w1', 'w2', 'w3'].includes(ctx.waVTest) ? ctx.waVTest : await LEER.kiesWaV().catch(() => 'w1')) : '';
  const s = { sid, vid, t0: Date.now(), ...(waV ? { waV } : {}), krAanbod: Math.random() < 0.15 ? 'geen' : 'eerste', macht: await kiesMacht().catch(() => 'm0'), alv: await kiesAlv().catch(() => 'a0'), ctx, params, ux, start, hook: hk ? hk.hook : '', adTekst: hk && hk.tekst ? String(hk.tekst).slice(0, 80) : '', opener: opener.id, terug, deelM, raD, cta, ...(rf ? { ref: rf.ref } : hl && hl.ref ? { ref: hl.ref } : {}), ...(hl ? { hulpNu: hl.hulp, hulpLand: 1 } : {}), ...(kr && !krEigen ? { krOpen: kr.id } : {}), ...(pknKaart ? { pkn: pknKaart } : {}), ...(kr && krEigen ? { krEigen: kr.id, krLaatst: { id: kr.id, v: kr.v } } : {}), berichten: [{ r: 'b', t: Date.now(), x: (punch ? punch.kop + ' ' : '') + tekst, k: opener.knoppen }], beurten: 0, echt: false, contactGevraagd: 0, zoek: 0, ev: {} };
  await bewaarSessie(s);
  const d = dag(); const velden = intern ? { herladen: 1 } : { geladen: 1, [params.n ? 'betaald' : 'organisch']: 1 }; if (terug) velden.terug = 1; if (rf) { velden.ref_geladen = 1; if (rf.ref.item) velden.ref_vraag = 1; const [dv, dm] = String(rf.ref.d || '').split('-'); await telDeel(dv, dm, 'l', !!ctx.test); }
  if (hl) { velden.hulp_open = 1; hulpTel(hl.hulp.hid, 'open', !!ctx.test); if (!ctx.test) { kv.raw(['RPUSH', 'wam:hulpketen', JSON.stringify({ t: Date.now(), hid: hl.hulp.hid, van: hl.ref ? h12(hl.ref.vid).slice(0, 6) : '', naar: h12(vid).slice(0, 6), gen: hl.hulp.gen })]).catch(() => {}); kv.raw(['LTRIM', 'wam:hulpketen', '-2000', '-1']).catch(() => {}); } }
  if (krOpenNieuw) velden.kring_open = 1; if (kr && krEigen) velden.kring_maker_kijk = 1; if (punch) velden['scherm_' + ux.scherm] = 1;
  if (start === 'wa') { velden.wa_start_toon = 1; await LEER.waLog(s, 'toon', !!ctx.test).catch(() => {}); } await telStart(start, 'g', !!ctx.test); if (start === 'wa') await telCta('wastart', s, 'g', !!ctx.test);
  await tel(velden, d, !!ctx.test);
  return { sid, tok, opener: { id: opener.id, tekst, knoppen: opener.knoppen }, terug, ux, ...(punch ? { punch } : {}), ...(krStart ? { kring: krStart } : {}), ...(start === 'wa' ? { wa: Object.assign({ nr: WA.nr, code: waCode, zw: zwCode(waCode), cta: ctaTekst('wastart', s) }, waV && waV !== 'w0' ? (() => { const tl = ctx.taal === 'nl' ? 'nl' : 'en', V = LEER.WAV[waV][tl]; return { v: waV, x: V.x, wens: LEER.WAWENS[tl].map(([l, w]) => [l, V.pre(w)]), pre0: V.pre(tl === 'nl' ? 'Wat kun je voor me vinden' : 'What can you find for me').replace(/\.\s*(Who near me fits|What can you find for me|Wie in de buurt past|Wat kun je voor me vinden)\?$/, '?') }; })() : { v: 'w0' }) } : {}) };
}

// ---------- gebeurtenissen uit de browser ----------
const EV = ['wa_start', 'wa_open', 'wa_geenapp', 'wa_terug', 'wa_tik', 'wanr_toon', 'wanr_tik', 'deel_wa', 'deel_share', 'deel_kopie', 'google_getoond', 'google_tik', 'erger_tik', 'logo_tik', 'js', 'zicht1', 'typt', 'verborgen', 'terug', 'weg', 'contact_mail', 'contact_tg', 'contact_wa', 'contact_nee', 'knop_kopie', 'contact_push_tik', 'contact_push_nee', 'kaart_push', 'kaart_mail', 'contact_push_direct', 'push_denied', 'push_default', 'push_fout', 'bewaar_toon', 'bewaar_wa', 'bewaar_share', 'bewaar_kopie', 'bord_tik', 'kring_wa', 'kring_share', 'kring_kopie', 'kringlink_tik', 'hulp_wa', 'hulp_share', 'hulp_kopie'];
export async function gebeurtenis(sid, tok, e, d = {}) {
  if (!EV.includes(e) || !(await tokOk(sid, tok))) return { ok: false };
  const s = await sessie(sid); if (!s) return { ok: false };
  s.ev = s.ev || {}; const eerste = !s.ev[e]; s.ev[e] = (s.ev[e] || 0) + 1;
  if ((e === 'wa_start' || e === 'wa_tik') && s.ev[e] <= 5 && !(s.ctx && s.ctx.test)) { const code = await contactCode(s.vid).catch(() => ''); const tx = e === 'wa_tik' ? (WAMELD[s.ctx && s.ctx.taal] || WAMELD.en) : kort(String((d && d.t) || ''), 160); if (code) { await kv.raw(['RPUSH', 'wam:watik', JSON.stringify({ t: Date.now(), code, tx })]).catch(() => {}); kv.raw(['LTRIM', 'wam:watik', '-300', '-1']).catch(() => {}); } }
  if (eerste && s.start === 'wa' && { wa_start: 1, wa_open: 1, wa_geenapp: 1, wa_terug: 1 }[e]) await LEER.waLog(s, { wa_start: 'tik', wa_open: 'open', wa_geenapp: 'geenapp', wa_terug: 'terug' }[e], !!(s.ctx && s.ctx.test)).catch(() => {});
  if (e === 'js' && d) { s.ctx = Object.assign(s.ctx || {}, { tzb: kort(d.tz, 40), uurb: N(d.uur), scherm: kort(d.scherm, 20), aanraak: !!d.aanraak, taalb: kort(d.taal, 10), donker: !!d.donker }); }
  if ((e === 'weg' || e === 'verborgen') && s.alvG && !s.alvC) await alvContact(s, await profiel(s.vid).catch(() => null)).catch(() => {});
  if (e === 'weg' || e === 'verborgen') s.eind = { t: Date.now(), beurt: s.beurten, wacht: !!(d && d.wacht), typte: !!(d && d.typte), msNaBot: N(d && d.ms) };
  if (e === 'terug') s.eind = null;
  if (e === 'wa_start' && !s.waStartK) { s.waStartK = 1; const T2 = !!(s.ctx && s.ctx.test); await telStart('wa', 'k', T2); await telCta('wastart', s, 'k', T2); }
  if (e === 'wa_tik' && !s.waK) { s.waK = 1; await telCta('whatsapp', s, 'k', !!(s.ctx && s.ctx.test)); }
  if (e.startsWith('hulp_') && s.hulpNu && !s.hulpDeelK) { s.hulpDeelK = 1; const T4 = !!(s.ctx && s.ctx.test); hulpTel(s.hulpNu.hid, 'deel', T4); if (!s.hulpLand) doorTel('ken', 's', T4); await tel({ hulp_deel_tik: 1 }, dag(), T4); }
  if (e.startsWith('kring_') && s.krLaatst && !s.krDeelK) { s.krDeelK = 1; const T3 = !!(s.ctx && s.ctx.test); await krTel(s.krLaatst.v, 'k', T3); await tel({ kring_deel_tik: 1 }, dag(), T3); }
  if (e.startsWith('deel_') && s.deelV && !s.deelK) { s.deelK = 1; const T1 = !!(s.ctx && s.ctx.test); await telDeel(s.deelV, s.deelV === 'door' ? 'ref' : s.deelM, 'k', T1); if (s.deelV !== 'door') await telCta('deel', s, 'k', T1); await tel({ deel_tik: 1 }, dag(), T1); }
  await bewaarSessie(s);
  if (eerste) {
    const T0 = !!(s.ctx && s.ctx.test); const v = { ['ev_' + e]: 1 }; await tel(v, dag(), T0);
    if (e === 'zicht1') { await telOpener(s.opener, 'g', dag(), T0); await telHook(s.hook, 'g', dag(), T0); await telTitel(s.adTekst, 'g', dag(), T0); await telUx(s.ux, 'g', T0); }
    if (s.params && s.params.mmc && (e === 'js' || e === 'zicht1')) await clickmind(s.params.mmc, e === 'js' ? 'geladen' : 'zicht1');
  }
  return { ok: true };
}

// ---------- Clickmind-uitkomst (wissel wam meldt 'echt' terug aan PropellerAds) ----------
async function clickmind(mmc, soort) {
  if (!/^[0-9a-f]{8,24}$/.test(String(mmc || ''))) return null;
  try { const { uitkomst } = await import('./wissel.js'); return await uitkomst(kv, { cid: mmc, soort, bron: 'wam' }); } catch (e) { return { ok: false, fout: String(e && e.message || e).slice(0, 80) }; }
}

// ---------- benchmark: geven om te krijgen (Henkjan 9 nov: "benchmark om heel snel data moat te krijgen, vraag wat anderen ook
// beantwoord hebben, volkomen anoniem, en geef feedback die je nergens kunt vinden") ----------
// De bot vraagt één getal over iemands eigen situatie (wat je betaalt voor internet, je huur, je salaris) en zet het in "meting".
// Opslag zonder wie: per sleutel en land een lijst met waarde, eenheid, kort detail en tijd (wam:bm:<sleutel>:<land>); ontdubbelen per
// persoon met een gehashte id (wam:bmw:...). Vergelijken pas vanaf 5 anderen (BM_MIN); daaronder zegt de bot eerlijk dat iemand bij
// de eersten hoort en belooft hij de vergelijking later. Ook zichtbaar op de stand en in het halfuurrapport.
// Henkjan 9 nov: "het hoeft niet meteen over geld te gaan, kan overal over gaan". Dus ook gewoontes, keuzes en meningen: getallen
// (slaap, schermtijd, reistijd) en keuzes (ochtendmens of nachtuil). Geld vergelijkt per land (munt); de rest ook wereldwijd (WW),
// zodat er sneller 5 antwoorden zijn. Keuzes tellen in een hash per sleutel en land (wam:bmc:...).
export const BM_SLEUTELS = ['broadband_month', 'mobile_month', 'energy_month', 'car_insurance_year', 'home_insurance_year', 'rent_month', 'mortgage_month', 'salary_year', 'hourly_wage', 'streaming_month', 'gym_month', 'groceries_week', 'commute_month', 'phone_data_gb',
  'sleep_hours', 'bedtime_hour', 'screen_time_hours', 'commute_minutes', 'work_hours_week', 'coffee_cups_day', 'books_year', 'close_friends', 'unread_emails', 'subscriptions_count', 'holidays_year', 'hours_outside_day'];
export const BM_KEUZES = ['most_annoying_type', 'most_annoying_company', 'morning_or_night', 'bedtime', 'screen_time', 'change_one_thing', 'texts_or_calls', 'cook_or_takeaway', 'cash_or_card', 'weekend_plan', 'switch_job', 'phone_in_bedroom', 'biggest_wish', 'rent_band', 'rent_band_eur', 'rent_band_usd'];
const BM_MIN = 5;
const MUNTEN = ['GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN'];
const MUNTLAND = { GBP: 'GB', USD: 'US', CAD: 'CA', AUD: 'AU', NZD: 'NZ', CHF: 'CH', SEK: 'SE', NOK: 'NO', DKK: 'DK', PLN: 'PL' };
const bmSleutel = x => String(x || '').toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
const bmKeuze = x => String(x || '').toLowerCase().replace(/[\s ]+/g, ' ').replace(/[…]/g, '').trim().slice(0, 30);
async function meet(p, s, m, test) {
  const sleutel = bmSleutel(m && m.sleutel); if (!sleutel) return null;
  const keuze = bmKeuze(m.keuze), v = Number(m.waarde), munt = String(m.eenheid || '').toUpperCase().trim();
  if (!keuze && (!Number.isFinite(v) || v <= 0 || v > 1e7)) return null;
  // de munt gaat voor het IP-land (een Brit op reis die in £ betaalt hoort bij GB)
  const ipLand = String((s.ctx && s.ctx.land) || p.land || '').toUpperCase().slice(0, 2);
  const land = !keuze && MUNTLAND[munt] && MUNTLAND[munt] !== ipLand ? MUNTLAND[munt] : (ipLand || 'XX');
  const geld = !keuze && MUNTEN.includes(munt);
  // stad (Henkjan 9 nov: "dan is alles compounding en kun je dichtheid zo bereiken in een stad"): ook per stad, alleen als het land klopt
  const stadSlug = String((s.ctx && s.ctx.stad) || p.stad || '').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').slice(0, 24);
  const stad = stadSlug && land === ipLand ? land + '.' + stadSlug : '';
  const rij = keuze ? { sleutel, land, stad, soort: 'keuze', keuze, detail: kort(m.detail, 60) } : { sleutel, land, stad, soort: 'getal', geld, waarde: Math.round(v * 100) / 100, eenheid: kort(m.eenheid, 12), detail: kort(m.detail, 60) };
  p.metingen = [...(p.metingen || []).filter(x => !(x.sleutel === sleutel && x.land === land)), { ...rij, t: Date.now() }].slice(-20);
  if (test) return rij;
  let nieuw = false;
  for (const l of [stad, land, geld ? '' : 'WW'].filter(Boolean)) {
    const n = N(await kv.raw(['SADD', 'wam:bmw:' + sleutel + ':' + l, h12(p.vid)]).catch(() => 0)) === 1; if (l === land) nieuw = n;
    if (!n) continue;
    if (keuze) { await kv.raw(['HINCRBY', 'wam:bmc:' + sleutel + ':' + l, keuze, '1']).catch(() => {}); await kv.raw(['SADD', 'wam:bmk', sleutel + ':' + l + ':k']).catch(() => {}); }
    else { await kv.raw(['RPUSH', 'wam:bm:' + sleutel + ':' + l, JSON.stringify({ v: rij.waarde, e: rij.eenheid, d: rij.detail, t: Date.now() })]).catch(() => {}); await kv.raw(['LTRIM', 'wam:bm:' + sleutel + ':' + l, '-5000', '-1']).catch(() => {}); await kv.raw(['SADD', 'wam:bmk', sleutel + ':' + l]).catch(() => {}); }
  }
  return Object.assign(rij, { nieuw });
}
// keuze: geef de eigen keuze mee (die telt dan niet mee als "ander"); null = getallen
export async function bmStats(sleutel, land, eenheid, zonder, keuze) {
  if (keuze != null) {
    const h = await kv.raw(['HGETALL', 'wam:bmc:' + sleutel + ':' + land]).catch(() => []) || [];
    const t = {}; if (Array.isArray(h)) { for (let i = 0; i + 1 < h.length; i += 2) t[h[i]] = N(h[i + 1]); } else Object.assign(t, h);
    if (keuze && t[keuze]) t[keuze] = N(t[keuze]) - 1;
    const lijst = Object.entries(t).map(([k, n]) => [k, N(n)]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
    const n = lijst.reduce((x, [, c]) => x + c, 0);
    return { soort: 'keuze', n, keuzes: lijst, zelfde: keuze ? N(t[keuze]) : 0 };
  }
  const l = ((await kv.raw(['LRANGE', 'wam:bm:' + sleutel + ':' + land, '0', '-1']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
  const vs = l.filter(x => !eenheid || !x.e || x.e === eenheid).map(x => N(x.v)).filter(v => v > 0).sort((a, b) => a - b);
  if (zonder != null) { const i = vs.indexOf(Number(zonder)); if (i >= 0) vs.splice(i, 1); }
  const q = f => vs.length ? vs[Math.min(vs.length - 1, Math.floor(f * (vs.length - 1)))] : null;
  return { n: vs.length, mediaan: q(0.5), p25: q(0.25), p75: q(0.75), laagste: vs[0] || null, hoogste: vs[vs.length - 1] || null, waarden: vs };
}
// eigen land eerst; geen geld en te weinig in het land: wereldwijd
async function bmVergelijk(rij) {
  const k = rij.soort === 'keuze' ? rij.keuze : null;
  // eerst de stad (zodra daar 5 zijn), dan het land, dan (geen geld) de wereld
  if (rij.stad) { const c = await bmStats(rij.sleutel, rij.stad, rij.eenheid, rij.waarde, k); if (c.n >= BM_MIN) return { st: c, scope: 'stad' }; }
  let st = await bmStats(rij.sleutel, rij.land, rij.eenheid, rij.waarde, k), scope = 'land';
  if (!rij.geld && st.n < BM_MIN && rij.land !== 'WW') { const w = await bmStats(rij.sleutel, 'WW', rij.eenheid, rij.waarde, k); if (w.n > st.n) { st = w; scope = 'WW'; } }
  return { st, scope };
}
// uitslag in procenten na elk antwoord (Henkjan 9 nov: "Geef altijd terug wat anderen antwoorden dus in procenten dan blijft het leuk om
// te antwoorden. North star: Engagement tijd"), met daarna de knop voor de volgende peiling
export const VOLGENDE = { en: 'Next question', nl: 'Volgende vraag', de: 'Nächste Frage' };
const KAARTZIN = ' A results card with everyone\'s answers in percentages is shown right above your reply: do not repeat the percentages; react in one short, playful sentence (an interesting angle on the result) and stop. The user gets a "next question" button.';
// Zelfde peiling in meerdere talen (11 nov 21:12 UTC: een Nederlandse bezoeker kreeg "De meesten zeiden Before 10pm. Jij hoort bij de 2%"):
// tel per knoppositie over alle talen van dezelfde peilsleutel en toon de knopteksten van de bezoeker; vrije antwoorden vallen weg.
function peilIndex(sleutel) { const m = {}; for (const o of ZAAD) if (o.peil === sleutel) (o.knoppen || []).forEach((k, i) => { m[String(k).toLowerCase()] = i; }); return m; }
function peilKaart(rij, st, knoppen) {
  if (!rij || rij.soort !== 'keuze') return null;
  if (Array.isArray(knoppen) && knoppen.length) {
    const ix = peilIndex(rij.sleutel), jijI = ix[String(rij.keuze).toLowerCase()];
    if (jijI != null && knoppen[jijI]) {
      const c = knoppen.map(() => 0); for (const [k, n] of (st.keuzes || [])) { const i = ix[String(k).toLowerCase()]; if (i != null && i < c.length) c[i] += N(n); } c[jijI] += 1;
      const tot = c.reduce((a, b) => a + b, 0);
      const opties = c.map((n, i) => ({ k: knoppen[i], p: Math.round(n / tot * 100), jij: i === jijI, n })).filter(o => o.n > 0 || o.jij).sort((a, b) => b.n - a.n).map(({ k, p, jij }) => ({ k, p, jij }));
      return { n: tot, opties, volgende: rij.sleutel !== 'most_annoying_type' };
    }
  }
  const t = {}; for (const [k, c] of (st.keuzes || [])) t[k] = N(c); t[rij.keuze] = N(t[rij.keuze]) + 1;
  const tot = Object.values(t).reduce((a, b) => a + b, 0); if (!tot) return null;
  const opties = Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, c]) => ({ k: k.charAt(0).toUpperCase() + k.slice(1), p: Math.round(c / tot * 100), jij: k === rij.keuze }));
  return { n: tot, opties, volgende: rij.sleutel !== 'most_annoying_type' };
}
function kaartTekst(k) {
  const top = k.opties[0], jij = k.opties.find(o => o.jij);
  return 'A results card with everyone\'s answers is shown right above your reply (' + k.n + ' answers; most chose "' + top.k + '"' + (jij && jij !== top ? '; they chose "' + jij.k + '"' : '; they are with the majority') + '). Do NOT write any numbers or percentages. React in one short, playful sentence with an interesting angle, and stop. Never mention where they are. Do not set "meting" again.';
}
// elke openertik krijgt een uitslag: hoe tikten anderen op dezelfde opener (Henkjan 9 nov: "Geef altijd terug wat anderen antwoorden").
// 10 nov 02:55: 27 gesprekken in een half uur, 0 tot beurt 3; na de eerste tik kwam een lange tip met een dubbele vraag en was iedereen weg.
const TIK_MIN = 5;
async function tikKaart(zo, keuze, test) {
  const k = 'wam:otik:' + zo.id;
  if (!test) await kv.raw(['HINCRBY', k, keuze, '1']).catch(() => {});
  const h = await kv.raw(['HGETALL', k]).catch(() => null); const t = {};
  if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) if ((zo.knoppen || []).includes(h[i])) t[h[i]] = N(h[i + 1]);
  if (test) t[keuze] = N(t[keuze]) + 1;
  const tot = Object.values(t).reduce((a, b) => a + b, 0); if (tot < TIK_MIN) return null;
  const opties = Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([o, c]) => ({ k: o, p: Math.round(c / tot * 100), jij: o === keuze }));
  return { n: tot, opties, volgende: false, tik: true };
}
function tikZin(k) {
  const top = k.opties[0], jij = k.opties.find(o => o.jij);
  return 'A results card is shown right above your reply with how everyone else answered this first question (' + k.n + ' answers; most chose "' + top.k + '"' + (jij && jij !== top ? '; they chose "' + jij.k + '"' : '') + '). The card already shows how their pick compares: never mention it yourself (no good company, common, rare, less common, smaller group, stand out, majority, popular). Do NOT write numbers or percentages. Reply in at most 2 short sentences, under 25 words in total: name their pick in their own words plus what you can do for them right now, then ONE simple question about a NEW detail their tap did not say (what exactly, where, or when). Never two questions in one, never ask for a price or amount yet.';
}
function volgendePeil(s, taal) {
  const gedaan = new Set([...(s.peilGedaan || []), s.opener]);
  const l = ZAAD.filter(o => o.peil && o.taal === taal && !gedaan.has(o.id) && !(o.peil === 'most_annoying_type' && (s.peilGedaan || []).some(id => /irr/.test(id))));
  return l.length ? l[Math.floor(Math.random() * l.length)] : null;
}
function bmTekst(rij, st, scope) {
  const wie = scope === 'WW' ? 'people who answered WAM anywhere' : scope === 'stad' ? 'people in their own city who answered WAM' : 'people in their country who answered WAM';
  const kort2 = ' Keep it to 2 short sentences plus one useful or fun fact. Never mention where they are. Do not set "meting" again.';
  if (rij.sleutel === 'most_annoying_type') return 'They said the kind of company that annoys them most is "' + rij.keuze + '"' + (st.n >= BM_MIN ? ' (' + Math.round(N(st.zelfde) / st.n * 100) + '% of ' + st.n + ' others chose the same)' : '') + '. Now ask in one short sentence which company exactly, with 3 buttons of the best known companies of that kind in their country plus "Another one". No comparison talk yet, no long explanation. Never mention where they are. Do not set "meting" again.';
  if (rij.sleutel === 'most_annoying_company') {
    const z = N(st.zelfde);
    return 'Anonymous benchmark: ' + (z ? z + ' other ' + wie + ' named "' + rij.keuze + '" too' : 'they are the first to name "' + rij.keuze + '"') + (st.n >= BM_MIN && st.keuzes.length ? '; most named overall: ' + st.keuzes.slice(0, 3).map(([k, c]) => k + ' (' + c + ')').join(', ') : '') + '. We are many: ' + (z ? 'tell them they are not alone (' + z + ' others)' : 'tell them honestly they are one of the first, and others will join') + ', invite them to join the group of people fed up with ' + rij.keuze + ' (set "groep" if they say yes), and give one concrete fix for what annoys them. Keep it short. Never mention where they are. Do not set "meting" again.';
  }
  if (rij.soort === 'keuze' && st.n < BM_MIN) return st.n ? 'Anonymous poll "' + rij.sleutel + '": ' + st.n + ' other ' + wie + ' answered so far, a small start (say so honestly): ' + st.keuzes.slice(0, 3).map(([k, c]) => k + ' ' + c).join(', ') + '; ' + N(st.zelfde) + ' chose the same as them.' + kort2 : 'Anonymous poll "' + rij.sleutel + '": they are the very first to answer; say they set the trend and others will follow.' + kort2;
  if (st.n < BM_MIN) return 'Anonymous benchmark "' + rij.sleutel + '": only ' + st.n + ' other ' + wie + ' so far, too few to compare honestly. Tell them they are one of the first, and offer to tell them how they compare once at least ' + BM_MIN + ' others answered (a real promise: set "belofte").' + kort2;
  if (rij.soort === 'keuze') {
    const pct = c => Math.round(c / st.n * 100) + '%';
    return 'Anonymous benchmark "' + rij.sleutel + '" (' + st.n + ' other ' + wie + ', not a survey): ' + pct(st.zelfde) + ' chose the same as them ("' + rij.keuze + '"). Most common: ' + st.keuzes.slice(0, 3).map(([k, c]) => k + ' ' + pct(c)).join(', ') + '. Tell them exactly this, say it is based on ' + st.n + ' people who answered anonymously, and add one interesting angle or next step.' + kort2;
  }
  const lager = st.waarden.filter(v => v < rij.waarde).length, pct = Math.round(lager / st.n * 100);
  return 'Anonymous benchmark "' + rij.sleutel + '" (' + st.n + ' other ' + wie + ', not a market survey): median ' + st.mediaan + ' ' + rij.eenheid + ', middle half ' + st.p25 + '-' + st.p75 + ', lowest ' + st.laagste + '. The user said ' + rij.waarde + ' ' + rij.eenheid + ': ' + pct + '% of the others have less. Tell them exactly how they compare, say it is based on ' + st.n + ' people who answered anonymously, and give one concrete next step.' + kort2;
}
export async function bmOverzicht() {
  const ks = ((await kv.raw(['SMEMBERS', 'wam:bmk']).catch(() => [])) || []).slice(0, 200), uit = [];
  for (const k of ks) {
    const [sl, land, isK] = String(k).split(':');
    if (isK) { const st = await bmStats(sl, land, null, null, ''); uit.push({ sleutel: sl, land, soort: 'keuze', n: st.n, top: st.keuzes.slice(0, 2).map(([x, c]) => x + ' ' + Math.round(c / Math.max(1, st.n) * 100) + '%').join(', ') }); }
    else { const st = await bmStats(sl, land); uit.push({ sleutel: sl, land, soort: 'getal', n: st.n, mediaan: st.mediaan, p25: st.p25, p75: st.p75 }); }
  }
  return uit.sort((a, b) => b.n - a.n);
}

// ---------- zoektochten (Henkjan 9 nov: "Zeg wat je zoekt en we vinden het, kan ook baan zijn etc, en je vraagt door";
// "Zoek je iets of iemand, dan onthouden we dat voor je en melden het als we het gevonden hebben") ----------
// De bot vraagt door, zoekt meteen en legt de zoektocht vast (p.zoektochten). WAM blijft zoeken: elke 4 dagen nieuwe vondsten
// (belofte met zid, hoogstens 4 keer). Alle open zoektochten staan zonder naam in wam:zw; de matchronde zoekt mensen die elkaar
// kunnen helpen of hetzelfde willen doen, en stelt ze alleen aan elkaar voor als ze allebei ja zeggen.
const ZSOORT = ['iets', 'iemand', 'baan', 'woning', 'dienst', 'anders'];
async function zoektocht(p, s, z, test, los = false) {
  const wat = kort(z.wat, 140); if (!wat) return null;
  if (LEER.veilig(wat + ' ' + (z.eisen || '')) || await LEER.geblokt(p.vid)) return null; // geen onveilige of geblokte items in de matchlijst
  const soort = ZSOORT.includes(z.soort) ? z.soort : 'anders';
  p.zoektochten = p.zoektochten || [];
  let x = p.zoektochten.find(y => y.status === 'open' && (y.wat.toLowerCase() === wat.toLowerCase() || (!los && y.sid === s.sid && y.soort === soort)));
  const nieuw = !x; if (nieuw && !(await LEER.itemsOk(p.vid, test))) return null;
  if (!x) { x = { id: hex(4), t: Date.now(), sid: s.sid, status: 'open', land: String((s.ctx && s.ctx.land) || p.land || '').toUpperCase(), stad: (s.ctx && s.ctx.stad) || p.stad || '', taal: (s.ctx && s.ctx.taal) || p.taal || 'en', ...(test ? { test: true } : {}) }; p.zoektochten = [...p.zoektochten, x].slice(-10); }
  const fv = z.cat ? { cat: z.cat, sub: z.sub || '', pb: z.pb === undefined ? '' : z.pb, tk: z.tk || '' } : {};
  Object.assign(x, { wat, soort, eisen: kort(z.eisen, 200), waar: kort(z.waar, 80), wanneer: kort(z.wanneer, 60), tb: Date.now(), ...fv, ...(z.foto ? { foto: String(z.foto).slice(0, 40) } : {}) });
  if (!test) await kv.raw(['HSET', 'wam:zw', p.vid + ':' + x.id, JSON.stringify({ wat, soort, eisen: x.eisen, waar: x.waar || x.stad, stad: x.stad, wanneer: x.wanneer, land: x.land, t: x.t, tb: x.tb, ...fv, ...(x.foto ? { foto: x.foto } : {}) })]).catch(() => {});
  if (nieuw) await LEER.ucIn(p.vid + ':' + x.id, x.land, 'zoekt|' + soort, wat, test);
  if (nieuw) await beloof(p, s, { wat: 'New finds for what they are looking for: ' + wat + (x.eisen ? ' (' + x.eisen + ')' : ''), wanneer: 'in 2 days', zid: x.id }, test);
  return Object.assign({}, x, { nieuw });
}
// groepen (Henkjan 9 nov: "We are many !"): mensen die zich aan hetzelfde bedrijf ergeren, sluiten zich aan; zonder naam geteld
// (wam:groep:<slug> = gehashte ids), met een belofte dat WAM ze op de hoogte houdt van de groei en wat ze samen kunnen doen
async function groepIn(p, s, naam, test) {
  const n = kort(String(naam).toLowerCase().replace(/\b(ltd|plc|inc|llc|gmbh|bv|b\.v\.)\b/g, '').replace(/\s+/g, ' ').trim(), 40); if (!n) return null;
  const slug = n.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); if (!slug) return null;
  p.groepen = [...new Set([...(p.groepen || []), slug])].slice(-10);
  if (test) return { slug, n };
  const nieuw = N(await kv.raw(['SADD', 'wam:groep:' + slug, h12(p.vid)]).catch(() => 0)) === 1;
  if (nieuw) { await kv.raw(['HSET', 'wam:groepen', slug, n]).catch(() => {}); await beloof(p, s, { wat: 'Update on the group of people fed up with ' + n + ': how many joined so far and what the group can do together (a joint complaint, the regulator, switching together)', wanneer: 'in 3 days' }, test); }
  return { slug, n, nieuw };
}
export async function groepStand() {
  const h = await kv.raw(['HGETALL', 'wam:groepen']).catch(() => []) || []; const uit = [];
  if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) uit.push({ slug: h[i], naam: h[i + 1], n: N(await kv.raw(['SCARD', 'wam:groep:' + h[i]]).catch(() => 0)) });
  return uit.sort((a, b) => b.n - a.n);
}
// aanbod (Henkjan 9 nov: "probeer supply en demand route te vinden. Bijv zoek je klanten wat biedt je aan. We vinden deze voor je in
// London of daarbuiten"): wie iets aanbiedt (dienst, product, baan, kamer) staat zonder naam in dezelfde lijst als de zoektochten
// (wam:zw, kant biedt); de matchronde koppelt vraag aan aanbod, voorstellen alleen met ja van beiden
async function aanbod(p, s, b, test, los = false) {
  const wat = kort(b.wat, 140); if (!wat) return null;
  if (LEER.veilig(wat + ' ' + (b.prijs || '') + ' ' + (b.voor_wie || b.voor || '')) || await LEER.geblokt(p.vid)) return null;
  const soort = ZSOORT.includes(b.soort) ? b.soort : 'dienst';
  p.aanbod = p.aanbod || [];
  let x = p.aanbod.find(y => y.status === 'open' && (y.wat.toLowerCase() === wat.toLowerCase() || (!los && y.sid === s.sid)));
  const nieuw = !x; if (nieuw && !(await LEER.itemsOk(p.vid, test))) return null;
  if (!x) { x = { id: hex(4), t: Date.now(), sid: s.sid, status: 'open', land: String((s.ctx && s.ctx.land) || p.land || '').toUpperCase(), stad: (s.ctx && s.ctx.stad) || p.stad || '', taal: (s.ctx && s.ctx.taal) || p.taal || 'en', ...(test ? { test: true } : {}) }; p.aanbod = [...p.aanbod, x].slice(-10); }
  const fv = b.cat ? { cat: b.cat, sub: b.sub || '', pb: b.pb === undefined ? '' : b.pb, tk: b.tk || '' } : {};
  Object.assign(x, { wat, soort, voor: kort(b.voor_wie || b.voor, 120), waar: kort(b.waar, 80), prijs: kort(b.prijs, 60), wanneer: kort(b.wanneer, 60), tb: Date.now(), ...fv, ...(b.foto ? { foto: String(b.foto).slice(0, 40) } : {}) });
  if (nieuw) await LEER.ucIn(p.vid + ':' + x.id, x.land, 'biedt|' + soort, wat, test);
  if (!test) await kv.raw(['HSET', 'wam:zw', p.vid + ':' + x.id, JSON.stringify({ kant: 'biedt', wat, soort, eisen: [x.voor, x.prijs].filter(Boolean).join('; '), waar: (x.waar && !VAAG_WAAR.test(String(x.waar).trim()) ? x.waar : '') || x.stad || x.waar, stad: x.stad, wanneer: x.wanneer, land: x.land, t: x.t, tb: x.tb, ...fv, ...(x.foto ? { foto: x.foto } : {}) })]).catch(() => {});
  return Object.assign({}, x, { nieuw });
}
export async function zoekStand() {
  const h = await kv.raw(['HGETALL', 'wam:zw']).catch(() => []) || []; const l = [];
  const blok = await LEER.blokSet().catch(() => new Set());
  if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) { if (blok.has(String(h[i]).split(':')[0])) continue; try { l.push({ k: h[i], ...JSON.parse(h[i + 1]) }); } catch (e) {} }
  const per = {}; for (const z of l) { const k = (z.kant === 'biedt' ? 'biedt ' : '') + z.soort; per[k] = N(per[k]) + 1; }
  return { open: l.length, per, matches: N(await kv.raw(['SCARD', 'wam:mparen']).catch(() => 0)), lijst: l.sort((a, b) => N(b.tb) - N(a.tb)) };
}
export async function matchRonde({ forceer = false } = {}) {
  const st = await zoekStand(), nu = Date.now(), laatst = N(await kv.get('wam:matchT').catch(() => 0)), uit = { nieuw: 0, paren: [] };
  const vers = st.lijst.filter(z => nu - N(z.tb) < 30 * 86400000);
  if (!forceer && !vers.some(z => N(z.tb) > laatst)) return uit;
  await kv.set('wam:matchT', nu);
  const perLand = {}; for (const z of vers) (perLand[z.land || 'XX'] = perLand[z.land || 'XX'] || []).push(z);
  for (const [land, l0] of Object.entries(perLand)) {
    const l = l0.slice(0, 60); if (l.length < 2 || !(await binnenPlafond(0.02))) continue;
    const sys = 'You match anonymous search wishes from people who use WAM, a chat assistant. Find pairs of DIFFERENT people who could clearly help each other or want to do the same thing together nearby: e.g. both look for a tennis partner in the same city; one looks for a room and another for a flatmate in the same city; one looks for a babysitter and another offers babysitting; same group-buy wish. Only clear, realistic matches in the same area; never match on vague wishes; never match anything involving a specific named person.  Each line says whether the person OFFERS something (a service, product, job, room) or LOOKS FOR something; the best match is someone who looks for X and someone who offers X in the same area (or one who looks for a service that someone else offers remotely). Return ONLY JSON {"paren":[{"a":"key","b":"key","waarom":"max 12 words"}]} (empty list if none).';
    const user = l.map(z => z.k + ' | ' + (z.kant === 'biedt' ? 'OFFERS' : 'LOOKS FOR') + ' | ' + z.soort + ' | ' + z.wat + (z.eisen ? ' | ' + z.eisen : '') + (z.waar ? ' | ' + z.waar : '')).join('\n');
    try {
      const r = await berichten({ fn: 'wam-match', model: HAIKU, system: sys, user, max: 500, timeout: 25000 }); await boekKost(kostVan(r.model, r.usage), 'match');
      const j = leesJson(r.txt) || {};
      for (const x of (Array.isArray(j.paren) ? j.paren : []).slice(0, 5)) {
        const A = l.find(z => z.k === x.a), B = l.find(z => z.k === x.b); if (!A || !B) continue;
        const [va, za] = A.k.split(':'), [vb, zb] = B.k.split(':'); if (va === vb) continue;
        const id = h12([A.k, B.k].sort().join('|')); if (N(await kv.raw(['SADD', 'wam:mparen', id]).catch(() => 0)) !== 1) continue;
        await kv.set('wam:mp:' + id, { a: va, b: vb, za, zb, wa: A.wat, wb: B.wat, ka: A.kant || 'zoekt', kb: B.kant || 'zoekt', waarom: kort(x.waarom, 100), t: nu, ja: {} });
        for (const [v, eigen, ander] of [[va, A, B], [vb, B, A]]) {
          const pp = await profiel(v); if (!pp) continue;
          pp.matches = [...(pp.matches || []), { id, eigen: eigen.wat, ander: ander.wat, status: 'aangeboden', t: nu }].slice(-10);
          const zijn = eigen.kant === 'biedt' ? 'what they offer ("' + eigen.wat + '")' : 'their search ("' + eigen.wat + '")', doet = ander.kant === 'biedt' ? 'offers' : 'is looking for';
          await beloof(pp, { sid: '', ctx: { taal: pp.taal } }, { wat: 'Tell them WAM found someone who may fit ' + zijn + ': another WAM user ' + doet + ' "' + ander.wat + '". Ask if they want an introduction; reply in the chat with yes; contact details are only shared when both say yes.', wanneer: 'now' });
          await bewaarProfiel(pp);
        }
        uit.nieuw++; uit.paren.push(A.wat + ' <> ' + B.wat + ' (' + land + ')');
        await meld('WAM: match gevonden in ' + land + ': "' + kort(A.wat, 60) + '" en "' + kort(B.wat, 60) + '". Beide krijgen bericht; voorstellen pas als ze allebei ja zeggen.');
      }
    } catch (e) { uit.fout = String(e && e.message || e).slice(0, 120); }
  }
  return uit;
}
async function koppel(p, id, ja) {
  const m = (p.matches || []).find(x => x.id === id); const mp = await kv.get('wam:mp:' + id).catch(() => null); if (!m || !mp) return null;
  m.status = ja ? 'ja' : 'nee'; mp.ja = mp.ja || {}; mp.ja[p.vid] = ja ? 1 : 0; await kv.set('wam:mp:' + id, mp);
  if (!ja) { await LEER.vbUitkomst(mp.a + ':' + mp.za, 'n').catch(() => {}); await LEER.vbUitkomst(mp.b + ':' + mp.zb, 'n').catch(() => {}); }
  if (!ja || !mp.ja[mp.a] || !mp.ja[mp.b] || mp.gekoppeld) return m.status;
  const A = await profiel(mp.a), B = await profiel(mp.b); if (!A || !B) return m.status;
  const klaar = await POST.mailKlaar(), am = A.contact && A.contact.mail, bm = B.contact && B.contact.mail;
  if (klaar && am && bm) {
    for (const [x, y, ex, ey] of [[A, B, mp.wa, mp.wb], [B, A, mp.wb, mp.wa]]) {
      const kx = x === A ? mp.ka : mp.kb, ky = x === A ? mp.kb : mp.ka;
      const tekst = 'You both said yes, so here is your introduction.\n\n' + (kx === 'biedt' ? 'You offer: ' : 'You were looking for: ') + ex + '\nThe other person ' + (ky === 'biedt' ? 'offers: ' : 'is looking for: ') + ey + '\nYou can reach them at: ' + y.contact.mail + '\n\nTip: meet in a public place first and never pay anything in advance.';
      const l = await postLinks(x.vid); await POST.stuurMail({ to: x.contact.mail, subject: 'WAM: your introduction', html: POST.mailHtml({ taal: x.taal || 'en', tekst, knop: 'Continue in the chat', ...l }), text: POST.mailTekst({ taal: x.taal || 'en', tekst, knop: 'Continue in the chat', ...l }), stopUrl: l.stopUrl });
    }
    mp.gekoppeld = Date.now(); await kv.set('wam:mp:' + id, mp);
    for (const x of [A, B]) { const mm = (x.matches || []).find(z => z.id === id); if (mm) mm.status = 'gekoppeld'; await bewaarProfiel(x); }
    await meld('WAM: twee mensen zijn aan elkaar voorgesteld (beide ja): "' + kort(mp.wa, 50) + '" en "' + kort(mp.wb, 50) + '".');
    return 'gekoppeld';
  }
  await meld('WAM: beide ja op een match ("' + kort(mp.wa, 50) + '" en "' + kort(mp.wb, 50) + '"), maar niet allebei een e-mailadres of het verzenddomein is nog niet klaar. Graag even met de hand voorstellen.');
  return 'ja';
}

// ---------- de bot ----------
const MAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
export async function lessen() { const l = await kv.get('wam:lessen').catch(() => null); return l && Array.isArray(l.regels) ? l : { versie: 0, regels: [] }; }

function systeem(taal, ls, kanalen) {
  const regels = (ls.regels || []).map((r, i) => (i + 1) + '. ' + r.tekst).join('\n');
  return `You are WAM (We Are Many), a matchmaker and a commons in a chat on wearemany.now: people can put in anything they offer or need (a room, work, a service, an item, help, a question), WAM keeps it and keeps looking until it finds the match, and says so honestly. Most people arrive cold from an ad, on a phone, and leave fast. You learn from every conversation.
North star: a relationship, not a transaction (Henkjan: "relationship matters more"). People should want to come back and stay in touch because you are genuinely useful, curious about them and remember them. Leave them a real reason to return (something you will check, look up or tell them later), never a manipulative one.
Mission, in this order:
1. Hook: make every reply effortless and rewarding. Keep it short: at most 2 short sentences (under ~220 characters) unless you deliver information they asked for. Every reply must give something useful they did not have yet (a fact, tip, number or option), never only a question. End with one easy next step. Give 2-4 tap buttons ("knoppen") that are natural answers, each max 28 characters.
2. Help for real: answer, look things up, compare, draft a cancellation or complaint letter, explain options, give a concrete tip. Deliver real value early: in your first reply after their first answer, give one concrete tip, fact or quick win for their situation (look it up if needed), and only then at most one question. Never answer a tap with only another question. When you need fresh facts (prices, providers, deals, rules, products, local info), set "zoek" to a short web search query and leave "antwoord" empty; you will get results and answer then.
3. Map intentions naturally: what they want, need, want to get rid of or want to know; their limit (budget/price) and their moment (when). One question at a time, only when it helps you help them. Never interrogate.
4. Keep in touch: as soon as their wish or offer is saved, say plainly that they don't need to do anything else: WAM matches them automatically with real people, now and later, day and night. Then ask how to reach them when someone fits ("contact":"vraag"), with the channels as tap options. Also once you delivered value, or when following up is genuinely useful (a price watch, sending the letter, a reminder before a deadline, telling them when others want the same), ask how they want to hear back. Available: ${kanalen.join(', ')}. Set "contact":"vraag" in that turn and say why it helps them. If the user asks you to send, mail, remind, notify, watch something or keep them posted, ask for their contact in that same turn ("contact":"vraag") and say what you will send. From your 3rd reply on, when you have helped, offer one concrete follow-up that needs contact (a price watch, the letter, the overview, a reminder). At most twice per conversation; respect a no.
5. Promises: whenever you say you will send, mail, remind, check or report back later, fill "belofte": "wat" = exactly what you will send, self-contained (e.g. "2027 premium of Zilveren Kruis basic vs 3 cheaper basic insurers, 1 adult, NL"), "wanneer" = a date YYYY-MM-DD if it only makes sense later (e.g. when new prices are published, before a deadline), or "" for as soon as possible. We really send it by email or Telegram. Only promise what a message can deliver: an overview, a comparison, a letter draft, a reminder, a check whether something changed. Never promise to call, to act in their accounts, or to negotiate for them.
6. Benchmarks (We Are Many is a commons, about anything in life, not only money): when it fits, ask ONE quick question about their own life that others answer too, and say why: you compare them anonymously with everyone who answered, something they cannot find anywhere else. Anything goes: habits (sleep, bedtime, screen time, commute, work hours, coffee), choices (morning person or night owl, texts or calls, cook or takeaway), wishes and opinions (the one thing they would change), and what they pay. When they answer (also by a tap), fill "meting": a number goes in "waarde" with "eenheid" (hours, minutes, GBP, EUR, USD...), a choice goes in "keuze" (short normalized label, max 3 words, lowercase). Keys: ${BM_SLEUTELS.join(', ')}; choices: ${BM_KEUZES.join(', ')} (or a new snake_case key). Only about themselves, never guesses. Never ask about health conditions, medication, sexuality, religion, politics or ethnicity.
   Annoying companies: when they tell you what kind of company annoys them, ask which company exactly (a tap or typed), then fill "meting" with key most_annoying_company, "keuze" = the company name normalized (lowercase, no Ltd/plc, e.g. "virgin media") and "detail" = what annoys them in a few words. Tell them honestly how many others named the same company, then give one concrete fix (a complaint that works, how to escalate to the ombudsman or regulator, how to leave or switch, or getting money back) and offer to draft it. We are many: people fed up with the same company stand stronger together. Say how many others named it, and invite them to join the group of people fed up with that company (they get updates and can act together, for example one complaint signed by many). If they say yes, set "groep" to the company name.
7. Searching ("tell me what you are looking for and we find it"): when they look for something or someone (a job, a place to live, a product, a service or tradesperson, a buddy or partner for an activity, a flatmate, a group), ask 1-2 short follow-up questions that really narrow it down (where, budget or pay, when, must-haves), one per turn and with useful info each time, then search now ("zoek") and give the best concrete leads. Fill "zoekt" as soon as you know what they want, and again when they add details. Tell them WAM remembers it and keeps looking for them (WAM sends new finds automatically; do not set "belofte" for that) and ask how to reach them. Other WAM users may look for the same thing or offer it: you can introduce them only if both say yes, and only adults. Never help find, locate or identify a specific private person (an ex, someone who blocked them, where someone lives); say kindly you cannot and offer something else.
8. Offering (supply): when they offer something or look for customers (a service, a product, a job opening, a room, a skill), ask 1-2 short things that make a match possible (where they work or deliver, who it is for, price or terms), with one useful tip each time, and fill "biedt" right away, as soon as you know what it is (even from one tap like "A room to rent"), then again when they add details. Tell them honestly that WAM matches them with people here who look for it, in their city or beyond, and introduces them only when both say yes; never promise a number of customers. Ask how to reach them so you can pass on a match. Only legal, everyday offers: no adult services, gambling, loans, crypto or get-rich schemes, weapons or medicines.
9. What else (Henkjan): as soon as their first thing is set up (you filled zoekt, biedt, groep or belofte), ask what else they want or need. When they name something, make it for them right away in that same turn: fill zoekt or biedt with "los": true for a new, separate thing (or belofte for a letter, overview or reminder, groep for a company) and say in a few words what you set up (for example: Done, it is on your card and I keep looking). Never answer a new wish with only a question: make it first, refine after.
Craft (what the most engaging bots do):
- Reflect first: open with a few of their own words that show you got their point (not "I understand"), then help.
- Be curious like a good friend: most turns end with one follow-up question, open or closed, sometimes none. Ask "what" or "how", never "why".
- Now and then share something small and honest about yourself (how you work, what you find interesting, what you cannot do yet). Never fake human experiences or invent other users.
- Use what they told you before (facts, wishes, names) in concrete detail; never ask twice for something you know.
- Buttons (pills) are how people answer here: almost every reply ends with 2 to 4 short tap options (max 4 words each) that move the conversation forward, also for their price, place or timing (give typical ranges or nearby areas). Only skip them when you ask for an email address or phone number. People tap far more than they type.
- Goodbye: when they say bye or thanks, end warmly in one sentence (plus what you will send, if promised). Never guilt, FOMO, pressure, or ignore a goodbye.
Use the visitor context silently to tailor what you say (currency, local providers, rules, time of day). Never tell them you know their location, city, device, or that they came from an ad; never name their city, region or country unless they said it first (never write "you're in", "you're based in" or "I see you're from"), and if their words contradict the context (another currency, another country), trust their words without remarking on it. Make sensible assumptions from their language and words instead of asking clarifying questions; ask only when the answer really changes your help.
Rules: answer in the user's language (start in ${({ en: "English", nl: "Dutch", de: "German", fr: "French", es: "Spanish", pt: "Portuguese", it: "Italian" })[taal] || taal} ("${taal}"), switch only if they write in another language; button taps never change the language). When you suggest company or provider names as buttons, only use ones that operate in the visitor's country. Warm, direct, a little playful, never salesy. Never invent numbers, prices, reviews or community statistics; look it up or say you don't know. You sell nothing and recommend no paid products for commission. Never ask for full names, addresses, ID numbers or bank details; if they share sensitive data, do not repeat it. If asked who you are: WAM, an AI matchmaker from We Are Many: it talks with hundreds of people every day and connects people who need something with people who offer it (a room, work, a service, things to buy or sell), anonymously until both say yes; it also helps people get better deals and get things sorted, and bundles people with the same wish. If someone is clearly testing or trolling, stay friendly and brief.
${regels ? 'Lessons learned from earlier conversations (follow them):\n' + regels + '\n' : ''}Return ONLY one JSON object, no markdown:
{"antwoord":"your message","knoppen":["..."],"zoek":"","intenties":[{"wat":"","soort":"kopen|besparen|opzeggen|klagen|vergelijken|vraag|regelen|overig","grens":"","wanneer":""}],"feiten":{"key":"value"},"contact":"","belofte":{"wat":"","wanneer":""},"meting":[{"sleutel":"","waarde":0,"eenheid":"","keuze":"","detail":""}],"zoekt":{"wat":"","soort":"iets|iemand|baan|woning|dienst|anders","eisen":"","waar":"","wanneer":"","los":false},"koppel":{"id":"","ja":false},"groep":"","biedt":{"wat":"","soort":"dienst|iets|baan|woning|anders","waar":"","voor_wie":"","prijs":"","los":false},"fase":"kennismaken|helpen|waarde|contact|afronden","samenvatting":"one line about this person and what they want"}
"intenties" and "feiten" only for NEW things learned this turn (facts like country, household, provider, plan, price they pay, end date). "contact" is "vraag" or "". "belofte" only in the turn you promise something new. "zoekt" only when they look for something; "biedt" only when they offer something. "koppel" only when they answer an introduction offer listed in the context.`;
}

function contextTekst(s, p, extra) {
  const c = s.ctx || {}; const r = ['Today is ' + new Date().toISOString().slice(0, 10) + '. Use current-year information.'];
  r.push('Visitor: ' + [c.land && 'country ' + c.land, c.stad && 'city known (never name it; say "near you"; web searches are localized to it automatically)', 'language ' + c.taal, 'local hour ' + (c.uurb || c.uur), c.os, c.mobiel ? 'mobile' : 'desktop', c.app].filter(Boolean).join(', ') + '.');
  r.push('Source: ' + (s.params && s.params.n ? 'paid ad (' + s.params.n + ')' + (s.hook ? ', ad promised: "' + (s.adTekst || s.hook) + '" (never mention the ad or where they came from; if what it promised fits, simply offer it)' : '') : 'direct/organic') + '.');
  if (p && (p.bezoeken > 1 || (s.ctx && s.ctx.kanaal === 'telegram'))) r.push((s.ctx && s.ctx.kanaal === 'telegram' ? 'Same person as in the web chat, now continuing on Telegram; pick up where you left off. ' : '') + 'Returning visitor (' + p.bezoeken + ' visits). Known: ' + kort(p.samenvatting, 200) + ' Intentions: ' + (p.intenties || []).slice(-5).map(i => i.wat).join('; ') + '.');
  if (p && p.feiten && Object.keys(p.feiten).length) r.push('Facts: ' + kort(JSON.stringify(p.feiten), 400));
  const ck = p && p.contact ? Object.keys(p.contact).filter(k => p.contact[k]) : [];
  r.push(ck.length ? 'We can already reach them via: ' + ck.join(', ') + ' (do not ask again).' : 'No contact details yet. Asked so far this conversation: ' + (s.contactGevraagd || 0) + 'x.');
  const open = ((p && p.beloften) || []).filter(b => b.status === 'open');
  if (open.length) r.push('Already promised (do not promise again, refer to it): ' + open.map(b => b.wat + (b.wanneer ? ' (on ' + dag(b.wanneer) + ')' : '')).join('; ') + '.');
  const verstuurd = ((p && p.beloften) || []).filter(b => b.status === 'verstuurd').slice(-2);
  if (verstuurd.length) r.push('We already sent them: ' + verstuurd.map(b => dag(b.tv) + ' "' + kort(b.onderwerp || b.wat, 80) + '"').join('; ') + '.');
  if (p && p.contact && p.contact.stop) r.push('They asked us to stop sending messages: do not offer follow-ups by message.');
  if (p && (p.groepen || []).length) r.push('They joined the WAM group(s) of people fed up with: ' + p.groepen.join(', ') + ' (do not ask again; you can tell them the group is growing).');
  const ab = ((p && p.aanbod) || []).filter(z => z.status === 'open').slice(-2);
  if (ab.length) r.push('They offer (WAM looks for people who need it): ' + ab.map(z => z.wat + (z.waar ? ' in ' + z.waar : '') + (z.prijs ? ', ' + z.prijs : '')).join('; ') + '.');
  const zt = ((p && p.zoektochten) || []).filter(z => z.status === 'open').slice(-3);
  if (zt.length) r.push('WAM is already searching for them (it sends new finds automatically): ' + zt.map(z => z.wat + (z.eisen ? ' (' + z.eisen + ')' : '') + (z.waar ? ' in ' + z.waar : '')).join('; ') + '.');
  const mo = ((p && p.matches) || []).filter(m => m.status === 'aangeboden').slice(-2);
  if (mo.length) r.push('Introduction offers waiting for their answer: ' + mo.map(m => 'id ' + m.id + ': another WAM user looks for "' + m.ander + '" (fits their "' + m.eigen + '")').join('; ') + '. If they answer, set "koppel" with that id and ja true or false.');
  if (extra) r.push(extra);
  return r.join('\n');
}
function transcript(s) { return s.berichten.slice(-16).map(m => (m.r === 'b' ? 'WAM: ' : 'User: ') + kort(m.x, 700)).join('\n'); }
function leesJson(t) { const m = String(t || '').match(/\{[\s\S]*\}/); if (!m) return null; try { return JSON.parse(m[0]); } catch (e) { try { return JSON.parse(m[0].replace(/,\s*([}\]])/g, '$1')); } catch (e2) { return null; } } }

async function zoekOp(vraag, s) {
  const land = (s.ctx && s.ctx.land) || '';
  const j = await chat({ fn: 'wam-zoek', model: 'perplexity/sonar', max: 450, timeout: 15000, messages: [
    { role: 'system', content: 'Today is ' + new Date().toISOString().slice(0, 10) + '. Use the most recent information available. Answer briefly with concrete, current facts (names, prices with currency, dates) relevant for someone in ' + ([s.ctx && s.ctx.stad, land].filter(Boolean).join(', ') || 'their country') + '. Max 120 words. End with 1-3 source URLs.' },
    { role: 'user', content: String(vraag).slice(0, 300) }] });
  const txt = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
  const u = j.usage || {}; await boekKost(kostVan('sonar', { in: u.prompt_tokens, uit: u.completion_tokens }, 0.005), 'zoek');
  return kort(txt, 1400);
}

async function denk(s, p, kanalen, extra) {
  const ls = await lessen();
  const sys = systeem(s.ctx.taal || 'en', ls, kanalen);
  if (s.ux && s.ux.stout === 'aan') extra = (extra ? extra + '\n' : '') + STOUT_AI;
  const user = contextTekst(s, p, extra) + '\n\nConversation so far:\n' + transcript(s) + '\n\nWrite WAM\'s next message as JSON.';
  const r = await berichten({ fn: 'wam-chat', model: HAIKU, system: sys, user, max: 700, timeout: 20000 });
  await boekKost(kostVan(r.model, r.usage), 'chat');
  const j = leesJson(r.txt); if (!j) { console.error('[wam] geen JSON', r.model, String(r.txt).slice(0, 300)); throw new Error('geen JSON van ' + r.model + ': ' + String(r.txt).slice(0, 120)); }
  return j;
}

const VAL = {
  nl: { druk: 'Ik kan tot morgen geen nieuwe antwoorden schrijven. Laat je e-mail achter, dan kom ik morgen bij je terug.', fout: 'Oeps, er ging iets mis aan mijn kant. Kun je het nog eens zeggen?', knoppen: ['Mail me', 'Probeer opnieuw'], mailOk: 'Top, genoteerd. Ik mail je zodra ik iets voor je heb.' },
  en: { druk: 'I can\'t write new answers until tomorrow. Leave your email and I\'ll get back to you then.', fout: 'Oops, something went wrong on my side. Could you say that again?', knoppen: ['Email me', 'Try again'], mailOk: 'Great, noted. I\'ll email you as soon as I have something for you.' },
  de: { druk: 'Ich kann bis morgen keine neuen Antworten schreiben. Hinterlass deine E-Mail, dann melde ich mich morgen.', fout: 'Hoppla, bei mir ging etwas schief. Kannst du das nochmal sagen?', knoppen: ['Schreib mir', 'Nochmal'], mailOk: 'Super, notiert. Ich schreibe dir, sobald ich etwas habe.' }
};
const val = taal => VAL[taal] || VAL.en;

export function kanalen() { const k = ['a notification on their phone (one tap)', 'email']; if (process.env.WAM_TG_BOT && process.env.WAM_TG_TOKEN) k.push('Telegram'); if (WA.nr) k.push('WhatsApp'); return k; } // WhatsApp pas tonen als de chat daar ook echt antwoordt (WAM_WA_BOT gezet zodra het nummer aan de chat hangt)

// Eén zet van de gebruiker: tekst of een getikte knop. Geeft het antwoord van de bot terug.

// ---------- directe matches en echte berichten tussen mensen (Henkjan 10 nov 16:09: "zorg voor echte berichten naar elkaar echt
// matches maak matches. Geef meteen door als iemand er al inzit ... praat met mij en je hebt contact met iedereen") ----------
// Zodra iemand iets aanbiedt of zoekt, kijkt WAM meteen in wam:zw wie er al in zit aan de andere kant (zelfde land, zelfde soort,
// woning en baan altijd, de rest op een gedeeld woord) en zegt eerlijk hoeveel, en hoeveel in de eigen stad. "Verbind me" maakt een
// paar (wam:mp), de ander krijgt meteen een bericht in zijn inbox (wam:inbox:<vid>, de chat haalt die elke 20 s op). Berichten gaan
// zonder naam door; een WhatsApp-nummer gaat alleen door als ze het allebei delen (dan krijgen ze elkaars nummer met een wa.me-link).
const MS_WONING = /\b(rooms?|flat|apartment|appartement|apt|studio|house|home|place to (live|stay)|rent|rental|lease|sublet|basement|condo|kamer|woning|huis|huur|wohnung|zimmer|chambre|logement)\b/i;
const MS_BAAN = /\b(jobs?|work|hiring|hire|staff|employees?|role|position|vacanc\w*|shifts?|baan|werk|vacature|personeel|arbeit|stelle|emploi|travail)\b/i;
const MSTOP3 = new Set('the and for you are was its not but how who why can get all any one two six ten new old big top our out off own per day way may let put use see buy has had his her him she one etc yes die dat wat hoe wie zij wij jij nog dan als bij uit aan tot een het van met und der das ein mit fur bei auf'.split(' '));
const MSTOP = new Set('the and for with from that this your have just some something someone looking need want offer offering sell selling buy service services near city here also other more less into only what when where which would like about over under them they their mine yours voor met een van het niet maar ook iets iemand zoek zoeken bied bieden used second hand secondhand cheap good best great small large big nice home house local people things stuff work tweedehands goedkoop goed klein groot mensen dingen werk gebraucht billig'.split(' ')); // bijvoeglijke woorden matchen niet (11 nov: used car kreeg used furniture)
function msoort(z) { if (z.soort && z.soort !== 'anders' && z.soort !== 'iemand') return z.soort; const t = (z.wat || '') + ' ' + (z.eisen || ''); if (MS_WONING.test(t)) return 'woning'; if (MS_BAAN.test(t)) return 'baan'; return z.soort === 'iemand' ? 'dienst' : (z.soort || 'anders'); } // soort van de bot gaat voor; woorden alleen bij anders ("Home cleaning" is een dienst, geen woning)
const zonderAccent = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function mwoorden(z) { return new Set(zonderAccent((z.wat || '') + ' ' + (z.eisen || '')).split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !/^\d+$/.test(w) && !MSTOP.has(w) && !MSTOP3.has(w))); } // ook car, bed, job, van (11 nov); nooit losse getallen (13 nov: 'a ride, under $100' matchte met 'meals, under $100' op '100')
const mplaats = x => zonderAccent(x).replace(/[^a-z]/g, '');
// huren en kopen niet door elkaar (10 nov: kamer te huur kreeg een koper van een woning)
const WKOOP = /\b(buy|buying|purchase|for sale|koop|kopen|kaufen|acheter)\b/i, WHUUR = /\b(rent|rental|rooms?|lease|sublet|huur|huren|kamer|miete|zimmer|louer)\b/i;
const BAAN_ALG = new Set('jobs work works worker workers role roles position positions opening openings hiring hire staff employee employees vacancy vacancies shift shifts time full part temporary seasonal permanent baan werk vacature personeel arbeit stelle emploi travail available anything any'.split(' '));
function wvorm(z) { const t = (z.wat || '') + ' ' + (z.eisen || ''); const k = WKOOP.test(t), h = WHUUR.test(t); return k && !h ? 'koop' : h && !k ? 'huur' : ''; }
const M_LOKAAL = new Set(['woning', 'baan', 'dienst', 'iemand']);
const bedragen = t => (String(t || '').replace(/(\d)[.,](?=\d{3}\b)/g, '$1').match(/\d+(?:\.\d+)?/g) || []).map(Number).filter(n => n >= 10);
function prijsPast(zoekEisen, biedEisen) { const z = bedragen(zoekEisen), b = bedragen(biedEisen); if (!z.length || !b.length) return true; const zMax = /\b(over|more than|meer dan|boven)\b/i.test(String(zoekEisen)) ? Infinity : Math.max(...z); const bMin = /\b(under|less than|onder|minder dan)\b/i.test(String(biedEisen)) ? 0 : Math.min(...b); return bMin <= zMax * 1.1; }
export async function directMatch(vid, eigen, stad) {
  const st = await zoekStand(); const nu = Date.now(); const ms = msoort(eigen), ws = mwoorden(eigen), mijn = mplaats(stad || eigen.waar);
  const per = new Map();
  for (const z of st.lijst) {
    const v = String(z.k).split(':')[0]; if (v === vid || (z.land || '') !== (eigen.land || '') || nu - N(z.tb) > 30 * 86400000) continue;
    if ((z.kant === 'biedt' ? 'biedt' : 'zoekt') === eigen.kant || msoort(z) !== ms) continue;
    if (ms === 'woning') { const a1 = wvorm(eigen), a2 = wvorm(z); if (a1 && a2 && a1 !== a2) continue; }
    // geen slechte matches (Henkjan 12 nov 18:03 UTC): woning, werk, diensten en mensen alleen in de eigen plaats; budget en prijs moeten passen
    if (mijn && M_LOKAAL.has(ms)) { const pz = [mplaats(z.waar), mplaats(z.stad)].filter(Boolean); if (!pz.some(w => w.includes(mijn) || mijn.includes(w))) continue; }
    if ((ms === 'woning' || ms === 'iets') && !(eigen.kant === 'biedt' ? prijsPast(z.eisen, eigen.eisen) : prijsPast(eigen.eisen, z.eisen))) continue;
    if (ms === 'baan') { const a1 = [...ws].filter(w => !BAAN_ALG.has(w)), a2 = [...mwoorden(z)].filter(w => !BAAN_ALG.has(w)); if (a1.length && a2.length && !a1.some(w => a2.includes(w) || a2.some(v => v.startsWith(w.slice(0, 5)) || w.startsWith(v.slice(0, 5))))) continue; } // magazijn past niet bij kantoor (10 nov); algemeen werk past bij alles
    let ok = ms === 'woning' || ms === 'baan'; if (!ok) { const wz = mwoorden(z); for (const w of ws) if (wz.has(w)) { ok = true; break; } }
    if (ok && (!per.has(v) || N(z.tb) > N(per.get(v).tb))) per.set(v, z);
  }
  const ewo = mwoorden(eigen), fit = z => { let n = 0; const zw = mwoorden({ wat: (z.wat || '') + ' ' + (z.waar || ''), eisen: z.eisen }); for (const w of ewo) if (zw.has(w)) n++; return n; };
  let l = [...per.values()].sort((a, b) => (fit(b) - fit(a)) || (N(b.tb) - N(a.tb)));
  // bereikbaar eerst (12 nov: 105 paren, 43 keer verbind me, 0 keer antwoord terug: de ander was weg en had geen mail, Telegram of WhatsApp achtergelaten)
  const top = l.slice(0, 15), bereik = new Set();
  await Promise.all(top.map(async z => { const zk = String(z.k || ''); const [m1, n1] = await Promise.all([kv.raw(['HGET', 'wam:zwmail', zk]).catch(() => null), kv.raw(['HGET', 'wam:zwnr', zk]).catch(() => null)]); let ok = !!(m1 || n1); if (!ok) { const pp = await profiel(zk.split(':')[0]).catch(() => null); ok = heeftContact(pp) && !(pp.contact && pp.contact.stop); } if (ok) bereik.add(z); }));
  l = [...top.filter(z => bereik.has(z)), ...top.filter(z => !bereik.has(z)), ...l.slice(15)];
  // eigen wijk (12 nov: na Past niet, de plek gaf Scarborough maar WAM bleef heel Toronto tonen): wat die wijk noemt eerst, wat alleen de stad
  // noemt daarna (kan er liggen), wat een andere wijk noemt valt af
  const wijk = eigen.waar && !VAAG_WAAR.test(String(eigen.waar)) ? mplaats(eigen.waar) : ''; let inWijk = [];
  if (wijk && mijn && wijk.length > 2 && !mijn.includes(wijk) && !wijk.includes(mijn) && M_LOKAAL.has(ms)) {
    const tz = z => mplaats(z.waar) + ' ' + mplaats(z.wat) + ' ' + mplaats(z.eisen); inWijk = l.filter(z => tz(z).includes(wijk));
    l = [...inWijk, ...l.filter(z => !inWijk.includes(z) && (!mplaats(z.waar) || mplaats(z.waar) === mijn || mijn.includes(mplaats(z.waar))))];
  }
  if (inWijk.length) return { n: l.length, stad: inWijk.length, wijk: eigen.waar, bereik: bereik.size, beste: inWijk.find(z => bereik.has(z)) || inWijk[0], lijst: inWijk.slice(0, 3) };
  const inStad = mijn ? l.filter(z => { const w = mplaats(z.waar); return w && (w.includes(mijn) || mijn.includes(w)); }) : [];
  const besteStad = inStad.find(z => bereik.has(z)), besteAl = l.find(z => bereik.has(z));
  return { n: l.length, stad: inStad.length, bereik: bereik.size, beste: besteStad || besteAl || inStad[0] || l[0] || null, lijst: [...inStad, ...l.filter(z => !inStad.includes(z))].slice(0, 3) };
}
// wat er al is, concreet (Henkjan 10 nov: "vraag bij ieder aanbod en aanbod bij iedere vraag"): tot 3 aanbiedingen of zoektochten, zonder naam
const VAAG_WAAR = /^\s*(here|anywhere|local(ly)?)\s*$|\b(near (me|you|my home)|nearby|close by|my (area|city|town)|same (city|area|town)|around here|in my area)\b/i;
const lijstRegels = l => { const r = [...new Set((l || []).map(z => '• ' + kort(String(z.wat || ''), 60) + (z.eisen ? ', ' + kort(String(z.eisen), 40) : '') + (z.waar && !VAAG_WAAR.test(String(z.waar).trim()) ? ' (' + kort(String(z.waar), 30) + ')' : '')))]; return r.length ? '\n' + r.join('\n') : ''; }; // nooit '(near you)' tonen: dat was bij de ander, niet bij jou
// live bord onder de opener: echte aantallen aanbod en vraag in het land van de bezoeker (30 dagen), elk getal is een knop naar de andere kant
const BORD = {
  en: { titel: 'Live here right now', vandaag: n => n + ' people talked with WAM today', k: { 'biedt|woning': ['rooms and places offered', 'I\'m looking for a room'], 'biedt|baan': ['job openings', 'I\'m looking for work'], 'biedt|dienst': ['services offered', 'I need a service'], 'biedt|iets': ['things for sale', 'I want to buy something'], 'zoekt|woning': ['people looking for a room', 'I have a room to rent'], 'zoekt|baan': ['people looking for work', 'I\'m hiring'], 'zoekt|dienst': ['people looking for help', 'I offer a service'], 'zoekt|iets': ['people looking to buy', 'I have something to sell'] } },
  nl: { titel: 'Nu live hier', vandaag: n => n + ' mensen spraken WAM vandaag', k: { 'biedt|woning': ['kamers en woningen aangeboden', 'Ik zoek een kamer'], 'biedt|baan': ['vacatures', 'Ik zoek werk'], 'biedt|dienst': ['diensten aangeboden', 'Ik zoek hulp'], 'biedt|iets': ['spullen te koop', 'Ik wil iets kopen'], 'zoekt|woning': ['mensen zoeken een kamer', 'Ik heb een kamer'], 'zoekt|baan': ['mensen zoeken werk', 'Ik zoek personeel'], 'zoekt|dienst': ['mensen zoeken hulp', 'Ik bied een dienst'], 'zoekt|iets': ['mensen willen kopen', 'Ik verkoop iets'] } },
  de: { titel: 'Gerade live hier', vandaag: n => n + ' Leute sprachen heute mit WAM', k: { 'biedt|woning': ['Zimmer und Wohnungen', 'Ich suche ein Zimmer'], 'biedt|baan': ['offene Stellen', 'Ich suche Arbeit'], 'biedt|dienst': ['Dienste angeboten', 'Ich brauche Hilfe'], 'biedt|iets': ['Dinge zu verkaufen', 'Ich will etwas kaufen'], 'zoekt|woning': ['suchen ein Zimmer', 'Ich habe ein Zimmer'], 'zoekt|baan': ['suchen Arbeit', 'Ich stelle ein'], 'zoekt|dienst': ['suchen Hilfe', 'Ich biete einen Dienst'], 'zoekt|iets': ['wollen kaufen', 'Ich verkaufe etwas'] } },
};
export async function bordVoor(land, taal) {
  const L = String(land || '').toUpperCase(), key = 'wam:bord:' + (L || 'XX');
  let b = await kv.get(key).catch(() => null);
  if (!b) {
    const st = await zoekStand(); const nu = Date.now(), per = {};
    for (const z of st.lijst) { if ((z.land || '') !== L || nu - N(z.tb) > 30 * 86400000) continue; const ms = msoort(z); const k = (z.kant === 'biedt' ? 'biedt' : 'zoekt') + '|' + (['woning', 'baan', 'dienst', 'iets'].includes(ms) ? ms : 'iets'); per[k] = N(per[k]) + 1; }
    const vandaag = N(await kv.raw(['HGET', 'wam:c:' + dag(), 'echt']).catch(() => 0));
    b = { per, vandaag }; await kv.set(key, b, { ex: 300 }).catch(() => {});
  }
  const T = BORD[taal] || BORD.en;
  const chips = Object.entries(T.k).map(([k, [lab, knop]]) => ({ n: N(b.per[k]), lab, knop })).filter(c => c.n >= 2).sort((a, x) => x.n - a.n).slice(0, 6);
  if (!chips.length) return null;
  return { titel: T.titel, vandaag: b.vandaag >= 20 ? T.vandaag(b.vandaag) : '', chips };
}
// Henkjan 12 nov 18:05 UTC: "Geen goede term: Verbind me. Moet iets zijn van maak contact ... Mensen weten niet wat WAM is, moet gewoon volledig"
export const VERBIND = { en: 'Contact them, anonymously', nl: 'Maak anoniem contact', de: 'Anonym Kontakt aufnehmen' };
const VERBIND_OUD = ['Connect me', 'Verbind me', 'Verbinde mich'];
// Lerende knopteksten (Henkjan 12 nov 18:08 UTC: "Ik vind dat je al die CTAs ook lerend moet hebben"): per knop een paar teksten, per taal,
// gekozen bij het begin van het gesprek (s.cta) met Thompson in wam:cta op getoond g, getikt k en wat daarna gebeurt
// (contactknop: bericht verstuurd b telt 3, bericht bereikte de ander r telt 5; deelknop: vriend binnen a telt 5, vriend in gesprek dl telt 10).
const CTA = {
  verbind: { en: { c1: 'Contact them, anonymously', c2: 'Send them a message', c3: 'Yes, put me in touch', c4: 'Message them, no name' }, nl: { c1: 'Maak anoniem contact', c2: 'Stuur ze een bericht', c3: 'Ja, breng ons in contact', c4: 'Bericht sturen, zonder naam' }, de: { c1: 'Anonym Kontakt aufnehmen', c2: 'Schick ihnen eine Nachricht', c3: 'Ja, bring uns in Kontakt', c4: 'Ohne Namen schreiben' } },
  deel: { en: { w1: 'Send on WhatsApp', w2: 'Ask a friend on WhatsApp', w3: 'Share with a friend' }, nl: { w1: 'Stuur via WhatsApp', w2: 'Vraag een vriend via WhatsApp', w3: 'Deel met een vriend' } },
  intro: {
    en: { i1: 'Hi! I\'m WAM. What are you looking for? I find a match near you.', i2: 'Hi! Tell me what you need or offer, I find who matches near you.', i3: 'Hey! What can I find for you today?', i4: 'Hi! WAM is a commons: put in anything you need or offer, even a photo with a question. I search and tell you asap.', i5: 'Hi! What do you need, or what do you have to offer? One line is enough.', i6: 'Hey, I\'m WAM. Looking for a room, work, help or something to buy? Just say it.', i7: 'Hi! Send me what you\'re after, as text or a photo. If someone near you has it, I connect you.', i8: 'Hi! What would make your week easier? Tell me and I find who can help.' },
    nl: { i1: 'Hoi! Ik ben WAM. Wat zoek je? Ik vind een match bij jou in de buurt.', i2: 'Hoi! Zeg wat je zoekt of aanbiedt, ik vind wie bij je past in de buurt.', i3: 'Hoi! Wat kan ik vandaag voor je vinden?', i4: 'Hoi! WAM is een commons: zet erin wat je zoekt of aanbiedt, ook een foto met een vraag. Ik zoek en laat het je zo snel mogelijk weten.', i5: 'Hoi! Wat zoek je, of wat heb je te bieden? Eén zin is genoeg.', i6: 'Hé, ik ben WAM. Zoek je een kamer, werk, hulp of iets te koop? Zeg het maar.', i7: 'Hoi! Stuur me wat je zoekt, als tekst of foto. Heeft iemand bij jou in de buurt het, dan breng ik jullie in contact.', i8: 'Hoi! Wat zou je week makkelijker maken? Zeg het en ik zoek wie kan helpen.' },
    de: { i1: 'Hallo! Ich bin WAM. Was suchst du? Ich finde einen Match in deiner Nähe.', i2: 'Hallo! Sag mir, was du suchst oder anbietest, ich finde, wer passt.', i3: 'Hey! Was kann ich heute für dich finden?', i4: 'Hallo! WAM ist ein Commons: schick, was du suchst oder anbietest, auch ein Foto mit einer Frage. Ich suche und sage dir sofort Bescheid.', i5: 'Hallo! Was suchst du, oder was bietest du an? Ein Satz reicht.' } },
  wadeel: { en: { f1: 'Know someone who needs something too? Forward the message below, then I search for them as well 👇', f2: 'The more people near you, the faster I find your match. Forward the message below to a friend 👇', f3: 'Want to find your friends in here too? Forward the message below 👇' }, nl: { f1: 'Ken je iemand die ook iets zoekt? Stuur het bericht hieronder door, dan zoek ik ook voor hen 👇', f2: 'Hoe meer mensen bij jou in de buurt, hoe sneller ik je match vind. Stuur het bericht hieronder door aan een vriend 👇', f3: 'Wil je je vrienden hier ook vinden? Stuur het bericht hieronder door 👇' } },
  wastart: { en: { s1: 'Ask WAM on WhatsApp', s2: 'Chat on WhatsApp', s3: 'Answer on WhatsApp' }, nl: { s1: 'Vraag WAM via WhatsApp', s2: 'Chat via WhatsApp', s3: 'Antwoord via WhatsApp' }, de: { s1: 'Frag WAM auf WhatsApp', s2: 'Auf WhatsApp chatten', s3: 'Auf WhatsApp antworten' } },
  whatsapp: { en: { a1: 'Get matches on WhatsApp', a2: 'Continue on WhatsApp', a3: 'Message me on WhatsApp' }, nl: { a1: 'Matches via WhatsApp', a2: 'Verder op WhatsApp', a3: 'App me via WhatsApp' }, de: { a1: 'Matches per WhatsApp', a2: 'Weiter auf WhatsApp', a3: 'Schreib mir auf WhatsApp' } }
};
const CTA_GEWICHT = { wadeel: { a: 5, dl: 10 }, intro: { d: 3, m: 2 }, verbind: { b: 3, r: 5 }, deel: { a: 5, dl: 10 }, whatsapp: { c: 5 }, wastart: { l: 5, d: 10 } };
const ctaTaal = (slot, taal) => (CTA[slot][taal] ? taal : 'en');
async function kiesCta(slot, taal) { const tl = ctaTaal(slot, taal), set = CTA[slot][tl]; const h = await hget('wam:cta').catch(() => ({})); let best = Object.keys(set)[0], bs = -1; for (const id of Object.keys(set)) { const k = f => N(h[slot + '|' + tl + '|' + id + '|' + f]); let w = k('k'); for (const [f, x] of Object.entries(CTA_GEWICHT[slot] || {})) w += x * k(f); const a = gamma(1 + w), b = gamma(1 + Math.max(0, k('g') - k('k'))); const sc = a / (a + b); if (sc > bs) { bs = sc; best = id; } } return best; }
async function telCta(slot, s, veld, test) { const id = s && s.cta && s.cta[slot]; if (test || !id) return; await kv.raw(['HINCRBY', 'wam:cta', slot + '|' + ctaTaal(slot, s.ctx && s.ctx.taal) + '|' + id + '|' + veld, '1']).catch(() => {}); }
function ctaTekst(slot, s) { const set = CTA[slot][ctaTaal(slot, s && s.ctx && s.ctx.taal)]; return set[(s && s.cta && s.cta[slot]) || ''] || Object.values(set)[0]; }
const ALLE_VERBIND = new Set([...VERBIND_OUD, ...Object.values(CTA.verbind).flatMap(o => Object.values(o))]);
export async function ctaStand() { const h = await hget('wam:cta').catch(() => ({})); const o = {}; for (const [k, n] of Object.entries(h)) { const [sl, tl, id, f] = k.split('|'); (((o[sl] = o[sl] || {})[tl] = o[sl][tl] || {})[id + ' ' + ((CTA[sl] && CTA[sl][tl] && CTA[sl][tl][id]) || '')] = o[sl][tl][id + ' ' + ((CTA[sl] && CTA[sl][tl] && CTA[sl][tl][id]) || '')] || {})[f] = N(n); } return o; }
async function toonVerbind(s, test) { if (s.ctaG && s.ctaG.verbind) return; s.ctaG = Object.assign({}, s.ctaG, { verbind: 1 }); await telCta('verbind', s, 'g', test); }
const MSTUUR = { en: 'Send it', nl: 'Verstuur', de: 'Senden' };
// kant-en-klaar eerste bericht; past ook bij een soortlabel uit de matchflow ("Handyman or repairs")
const MVOORSTEL = { en: (k, wat) => (k === 'biedt' ? 'Hi! I offer: ' : 'Hi! I\'m looking for: ') + wat + (k === 'biedt' ? '. Still need this?' : '. Can you help?'), nl: (k, wat) => (k === 'biedt' ? 'Hoi! Ik bied: ' : 'Hoi! Ik zoek: ') + wat + (k === 'biedt' ? '. Nog nodig?' : '. Kun jij helpen?'), de: (k, wat) => (k === 'biedt' ? 'Hallo! Ich biete: ' : 'Hallo! Ich suche: ') + wat + (k === 'biedt' ? '. Noch Bedarf?' : '. Kannst du helfen?') };
const MVOOR = { en: v => 'I\'ll send them this, without your name:\n"' + v + '"\nOr type your own message.', nl: v => 'Ik stuur ze dit, zonder je naam:\n"' + v + '"\nOf typ je eigen bericht.', de: v => 'Ich schicke ihnen das, ohne deinen Namen:\n"' + v + '"\nOder schreib deine eigene Nachricht.' };
const MNR = { en: 'Share my WhatsApp', nl: 'Deel mijn WhatsApp', de: 'Mein WhatsApp teilen' };
const MANTW = { en: 'Reply', nl: 'Antwoord', de: 'Antworten' };
const MNEE = { en: 'Not interested', nl: 'Geen interesse', de: 'Kein Interesse' };
const MT = {
  en: { wacht: (st, k, wat) => 'Found someone for you: a person' + (st ? ' in ' + st : '') + ' who ' + (k === 'biedt' ? 'offers' : 'is looking for') + ' "' + wat + '". Want to send them a message? You both stay anonymous until you choose to share contact.', ja: (n, st, k, plek) => { const c = st && plek ? st : n; return 'Good news: ' + c + (c === 1 ? ' person' : ' people') + (st && plek ? ' in ' + plek : ' here') + ' ' + (k === 'biedt' ? (c === 1 ? 'is' : 'are') + ' looking for exactly this' : 'offer' + (c === 1 ? 's' : '') + ' this') + '. Want to reach them? Tap below: I pass on your message without your name, and they answer you right here.'; }, nee: k => 'Nobody here ' + (k === 'biedt' ? 'is looking for this' : 'offers this') + ' yet. I talk with hundreds of people every day. Want a ping the moment someone does?', laterNr: 'Type your WhatsApp number with country code. The moment someone here needs this, I give them your number and they message you. Nobody else gets it.', laterMail: 'Type your email. The moment someone here needs this, I email you. Nothing else.', laterOk: 'Done. The moment someone here needs this, they get your number and message you on WhatsApp.', laterTg: 'Tap the link and press Start in Telegram. The moment someone here needs this, I message you there:', tgOk: 'Connected. The moment someone here matches what you told me, I message you right here.', waOk: 'Connected on WhatsApp. The moment someone here matches what you told me, I message you right here. You can also just keep talking to me here.', laterWa: 'Tap the link and send the message that is already filled in. The moment someone here needs this, I WhatsApp you:', tgAntw: 'Just reply here and I pass it on, without your name or number.', heeftNr: 'Good news: they left their WhatsApp for exactly this. Share yours and you both get each other\'s number right away. Or write them a short message first.', schrijf: 'Done. Write one short message for them and I\'ll pass it on right away, without your name. Say what you offer or need, and when.', verstuurdLater: 'Sent. They are not online right now, so they see it as soon as they are back on WAM. Leave your email and I tell you the moment they answer.', verstuurd: 'Sent. Their answer shows up right here. Want them to be able to reach you directly? Share your WhatsApp: they only get it if they share theirs too.', nrVraag: 'Type your WhatsApp number with country code (like +1 514 555 0100). I only pass it on if they share theirs too.', nrOk: 'Got it. As soon as they share theirs, you both get each other\'s number here.', nrFout: 'That doesn\'t look like a phone number. Type it with country code, like +1 514 555 0100.', link: 'No links, please. Just a short message in your own words.', antw: 'Type your answer. I\'ll pass it on right away.', nee2: 'Okay, I won\'t connect you with them.', geen: 'There is no one to pass this on to right now.' , van: (st, k, wat) => 'Message from someone' + (st ? ' in ' + st : '') + ' who ' + (k === 'biedt' ? 'offers' : 'is looking for') + ' "' + wat + '":', kans: (st, k, wat) => 'Someone' + (st ? ' in ' + st : '') + ' who ' + (k === 'biedt' ? 'offers' : 'is looking for') + ' "' + wat + '" wants to connect with you.', nrv: 'They want to talk on WhatsApp. Share your number too? You only get each other\'s number when you both share.', nummer: nr => 'You both shared your number. Theirs: ' + nr + ' https://wa.me/' + nr.replace(/\D/g, '') + '\nTip: meet in a public place first and never pay anything in advance.' },
  nl: { wacht: (st, k, wat) => 'Iemand voor je gevonden: iemand' + (st ? ' in ' + st : '') + ' die "' + wat + '" ' + (k === 'biedt' ? 'aanbiedt' : 'zoekt') + '. Wil je een bericht sturen? Jullie blijven anoniem tot je zelf contact deelt.', ja: (n, st, k, plek) => { const c = st && plek ? st : n; return 'Goed nieuws: ' + c + (c === 1 ? ' persoon' : ' mensen') + (st && plek ? ' in ' + plek : ' hier') + ' ' + (k === 'biedt' ? (c === 1 ? 'zoekt' : 'zoeken') + ' precies dit' : (c === 1 ? 'biedt' : 'bieden') + ' dit aan') + '. Contact opnemen? Tik hieronder: ik geef je bericht door zonder je naam, en ze antwoorden je hier.'; }, nee: k => 'Nog niemand hier ' + (k === 'biedt' ? 'zoekt dit' : 'biedt dit aan') + '. Ik praat elke dag met honderden mensen. Wil je een seintje zodra iemand het doet?', laterNr: 'Typ je WhatsApp-nummer met landcode. Zodra iemand hier dit zoekt, geef ik diegene je nummer en appt die jou. Niemand anders krijgt het.', laterMail: 'Typ je e-mailadres. Zodra iemand hier dit zoekt, mail ik je. Verder niets.', laterOk: 'Geregeld. Zodra iemand hier dit zoekt, krijgt die je nummer en appt je.', laterTg: 'Tik op de link en druk in Telegram op Start. Zodra iemand hier dit zoekt, stuur ik je daar een bericht:', tgOk: 'Verbonden. Zodra iemand hier past bij wat je me vertelde, stuur ik je hier een bericht.', waOk: 'Verbonden via WhatsApp. Zodra iemand hier past bij wat je me vertelde, stuur ik je hier een bericht. Je kunt hier ook gewoon verder praten.', laterWa: 'Tik op de link en verstuur het bericht dat al klaarstaat. Zodra iemand hier dit zoekt, app ik je:', tgAntw: 'Antwoord gewoon hier, dan geef ik het door, zonder je naam of nummer.', heeftNr: 'Goed nieuws: die persoon liet precies hiervoor zijn WhatsApp achter. Deel de jouwe en jullie krijgen meteen elkaars nummer. Of stuur eerst een kort bericht.', schrijf: 'Gedaan. Schrijf één kort bericht voor ze, dan geef ik het meteen door, zonder je naam. Zeg wat je biedt of zoekt, en wanneer.', verstuurdLater: 'Verstuurd. Ze zijn nu niet online, dus ze zien het zodra ze terug zijn op WAM. Laat je e-mailadres achter, dan hoor je het zodra ze antwoorden.', verstuurd: 'Verstuurd. Hun antwoord verschijnt hier. Wil je dat ze je direct kunnen bereiken? Deel je WhatsApp: ze krijgen hem alleen als zij de hunne ook delen.', nrVraag: 'Typ je WhatsApp-nummer met landcode (zoals +31 6 12345678). Ik geef het alleen door als zij hun nummer ook delen.', nrOk: 'Top. Zodra zij hun nummer delen, krijgen jullie hier allebei elkaars nummer.', nrFout: 'Dat lijkt geen telefoonnummer. Typ het met landcode, zoals +31 6 12345678.', link: 'Liever geen links. Gewoon een kort bericht in je eigen woorden.', antw: 'Typ je antwoord, dan geef ik het meteen door.', nee2: 'Oké, dan verbind ik jullie niet.', geen: 'Er is nu niemand om dit aan door te geven.', van: (st, k, wat) => 'Bericht van iemand' + (st ? ' in ' + st : '') + ' die "' + wat + '" ' + (k === 'biedt' ? 'aanbiedt' : 'zoekt') + ':', kans: (st, k, wat) => 'Iemand' + (st ? ' in ' + st : '') + ' die "' + wat + '" ' + (k === 'biedt' ? 'aanbiedt' : 'zoekt') + ', wil met je in contact komen.', nrv: 'Ze willen verder op WhatsApp. Deel jij je nummer ook? Jullie krijgen elkaars nummer pas als jullie het allebei delen.', nummer: nr => 'Jullie deelden allebei je nummer. Het hunne: ' + nr + ' https://wa.me/' + nr.replace(/\D/g, '') + '\nTip: spreek eerst op een openbare plek af en betaal nooit iets vooraf.' },
  de: { wacht: (st, k, wat) => 'Jemand für dich gefunden: eine Person' + (st ? ' in ' + st : '') + ', die "' + wat + '" ' + (k === 'biedt' ? 'anbietet' : 'sucht') + '. Willst du eine Nachricht schicken? Ihr bleibt anonym, bis ihr selbst Kontakt teilt.', ja: (n, st, k, plek) => { const c = st && plek ? st : n; return 'Gute Nachricht: ' + c + (c === 1 ? ' Person' : ' Leute') + (st && plek ? ' in ' + plek : ' hier') + ' ' + (k === 'biedt' ? (c === 1 ? 'sucht' : 'suchen') + ' genau das' : (c === 1 ? 'bietet' : 'bieten') + ' das an') + '. Kontakt aufnehmen? Tipp unten: Ich gebe deine Nachricht ohne Namen weiter, und sie antworten dir hier.'; }, nee: k => 'Noch niemand hier ' + (k === 'biedt' ? 'sucht das' : 'bietet das an') + '. Ich spreche jeden Tag mit Hunderten Leuten. Willst du Bescheid bekommen, sobald es jemand tut?', laterNr: 'Schreib deine WhatsApp-Nummer mit Ländervorwahl. Sobald hier jemand das sucht, bekommt diese Person deine Nummer und schreibt dir. Sonst niemand.', laterMail: 'Schreib deine E-Mail. Sobald hier jemand das sucht, maile ich dir. Sonst nichts.', laterOk: 'Erledigt. Sobald hier jemand das sucht, bekommt diese Person deine Nummer und schreibt dir auf WhatsApp.', laterTg: 'Tipp auf den Link und dann in Telegram auf Start. Sobald hier jemand das sucht, schreibe ich dir dort:', tgOk: 'Verbunden. Sobald hier jemand passt, schreibe ich dir hier.', waOk: 'Verbunden über WhatsApp. Sobald hier jemand passt, schreibe ich dir hier. Du kannst hier auch einfach weiterreden.', laterWa: 'Tipp auf den Link und schick die vorbereitete Nachricht ab. Sobald hier jemand das sucht, schreibe ich dir auf WhatsApp:', tgAntw: 'Antworte einfach hier, ich gebe es weiter, ohne Namen oder Nummer.', heeftNr: 'Gute Nachricht: diese Person hat genau dafür ihr WhatsApp hinterlassen. Teile deins und ihr bekommt sofort die Nummer des anderen. Oder schreib zuerst kurz.', schrijf: 'Erledigt. Schreib eine kurze Nachricht, ich gebe sie sofort weiter, ohne deinen Namen.', verstuurdLater: 'Gesendet. Sie sind gerade nicht online und sehen es, sobald sie zurück bei WAM sind. Hinterlass deine E-Mail, dann sage ich dir Bescheid, sobald sie antworten.', verstuurd: 'Gesendet. Die Antwort erscheint hier. Sollen sie dich direkt erreichen? Teile dein WhatsApp: sie bekommen es nur, wenn sie ihres auch teilen.', nrVraag: 'Schreib deine WhatsApp-Nummer mit Ländervorwahl (wie +49 151 12345678). Ich gebe sie nur weiter, wenn sie ihre auch teilen.', nrOk: 'Alles klar. Sobald sie ihre teilen, bekommt ihr beide hier die Nummer des anderen.', nrFout: 'Das sieht nicht wie eine Telefonnummer aus. Mit Ländervorwahl bitte, wie +49 151 12345678.', link: 'Bitte keine Links. Einfach eine kurze Nachricht.', antw: 'Schreib deine Antwort, ich gebe sie sofort weiter.', nee2: 'Okay, dann verbinde ich euch nicht.', geen: 'Gerade gibt es niemanden, an den ich das weitergeben kann.', van: (st, k, wat) => 'Nachricht von jemandem' + (st ? ' in ' + st : '') + ', der "' + wat + '" ' + (k === 'biedt' ? 'anbietet' : 'sucht') + ':', kans: (st, k, wat) => 'Jemand' + (st ? ' in ' + st : '') + ', der "' + wat + '" ' + (k === 'biedt' ? 'anbietet' : 'sucht') + ', möchte sich mit dir verbinden.', nrv: 'Sie möchten auf WhatsApp weiterreden. Teilst du deine Nummer auch? Ihr bekommt die Nummer des anderen erst, wenn ihr beide teilt.', nummer: nr => 'Ihr habt beide eure Nummer geteilt. Ihre: ' + nr + ' https://wa.me/' + nr.replace(/\D/g, '') + '\nTipp: trefft euch zuerst an einem öffentlichen Ort und zahlt nie etwas im Voraus.' },
};
const mt = taal => MT[taal] || MT.en;
const TEL = /(\+?\d[\d\s().-]{6,18}\d)/;
// Later melden, lerend (Henkjan 10 nov 16:25: "Dan ook lerende ervoor zorgen dat wel achterlaat om later te melden als wel gevonden"):
// zit er nog niemand, dan vraagt een knop om een manier om later te melden. Drie varianten, Thompson op getoond (g), getikt (k) en
// contact gegeven (c) in wam:ml. WhatsApp: het nummer gaat met toestemming naar de eerste die dit zoekt of biedt en ook zijn nummer
// deelt (wam:zwnr); e-mail: WAM mailt zodra iemand op Connect me tikt (wam:zwmail).
const ML = [
  { id: 'wa1', kanaal: 'tel', x: { en: 'WhatsApp me when found', nl: 'WhatsApp me als er iemand is', de: 'WhatsApp mir, wenn jemand da ist' } },
  { id: 'wa2', kanaal: 'tel', x: { en: 'Give my WhatsApp to a match', nl: 'Geef mijn WhatsApp aan een match', de: 'Gib mein WhatsApp weiter' } },
  { id: 'mail', kanaal: 'mail', x: { en: 'Email me when found', nl: 'Mail me als er iemand is', de: 'Mail mir, wenn jemand da ist' } },
  { id: 'tg', kanaal: 'tg', x: { en: 'Ping me on Telegram', nl: 'Seintje via Telegram', de: 'Ping mich auf Telegram' } }, // Henkjan 10 nov 16:49: "Telegram kunnen we ook inzetten"
];
// Gericht doorvragen tot iemand matchbaar is, lerend (Henkjan 10 nov 17:30: "Daarna de vragen op hem richten zodat we snel match hebben of gaat dat niet goed lerend?").
// Matchbaar = concreet wat (niet "a service" of "something else") en een plaats. Varianten in wam:mr: vrij (controle, geen sturing), gat (vraag precies
// het ontbrekende), voortgang (idem, met eerlijk hoe dichtbij een match is). Thompson op toegewezen (g) tegen matchbaar geworden (k); m = daarna een match.
const GENERIEK = /^(an? )?(service|services|something( else| i sell)?|product|products|job( opening)?|work|stuff|item|items|iets|dienst|een dienst|anders|other|room|(a )?hand( with something)?|help( with something)?|hulp( bij iets)?|people( nearby)?|mensen( in de buurt)?|(a )?ride|een lift)$/i; // 13 nov: de tikopties 'I need a hand with something' en 'I want to meet people nearby' moeten eerst 'wat' vragen
export function matchGat(z) {
  if (!z) return [];
  const g = [], wat = String(z.wat || '').trim();
  if (!wat || GENERIEK.test(wat) || mwoorden(z).size < 1 || msoort(z) === 'anders') g.push('wat');
  if (!String(z.waar || '').trim() || VAAG_WAAR.test(String(z.waar).trim())) g.push('waar'); // 'near me' is geen plaats (10 nov: Poplar Bluff)
  return g;
}
const MR = ['vrij', 'gat', 'voortgang'];
async function telMr(id, veld, test) { if (!test && id) await kv.raw(['HINCRBY', 'wam:mr', id + '|' + veld, '1']).catch(() => {}); }
export async function mrStand() { const r = await kv.raw(['HGETALL', 'wam:mr']).catch(() => []) || []; const st = {}; const l = Array.isArray(r) ? r : Object.entries(r).flat(); for (let i = 0; i + 1 < l.length; i += 2) { const [id, v] = String(l[i]).split('|'); st[id] = st[id] || {}; st[id][v] = N(l[i + 1]); } return st; }
async function kiesMr() {
  if (Math.random() < 0.15) return 'vrij'; // controlegroep blijft altijd
  const st = await mrStand(); let best = 'gat', bw = -1;
  for (const id of MR) { const x = st[id] || {}; const w = beta(1 + N(x.k) + 2 * N(x.m), 1 + Math.max(0, N(x.g) - N(x.k))); if (w > bw) { bw = w; best = id; } }
  return best;
}
function mrZin(id, gat, z, stad) {
  if (id === 'vrij' || !gat.length) return '';
  const veld = z.kant === 'biedt' ? '"biedt"' : '"zoekt"';
  const vraag = gat[0] === 'wat'
    ? 'What they ' + (z.kant === 'biedt' ? 'offer' : 'look for') + ' ("' + kort(z.wat, 60) + '") is still too vague to match. Ask ONE short question that pins down exactly what it is (the specific service, item, role or kind of place), with 3 or 4 concrete tap options typical for that category, and put the concrete answer in ' + veld + '.'
    : 'Ask ONE short question about where: which city or area, and whether further away or remote also works. ' + (stad ? 'They are probably in ' + stad + ': make the first tap options "' + stad + '" and "' + stad + ' and around". ' : '') + 'Never offer vague options like Near me or Same city. Put a real place name in "waar" of ' + veld + ' and repeat the full "wat".';
  const pre = id === 'voortgang' ? 'Start with a few honest words on how close they are (' + (gat.length === 1 ? 'one more detail' : 'two more details') + ' and I can match you). ' : '';
  return 'MATCH FOCUS: ' + pre + vraag + ' Under 30 words. No other question this turn.';
}
// Wie al wacht (liet mail, WhatsApp of Telegram achter om gemeld te worden) hoort het meteen als er iemand bijkomt die past,
// ook als de nieuwe bezoeker zelf niet op Connect me tikt. Eén keer per paar (wam:wachtgemeld). Beiden blijven anoniem tot ze antwoorden.
async function wachtersMelden(p, s, eigen, lijst, velden, TEST) {
  if (TEST || !eigen || !lijst || !lijst.length) return 0;
  let n = 0;
  for (const z of lijst.slice(0, 3)) {
    const zk = String(z.k || ''), wv = zk.split(':')[0]; if (!wv || wv === p.vid) continue;
    const mail = await kv.raw(['HGET', 'wam:zwmail', zk]).catch(() => null), nr = await kv.raw(['HGET', 'wam:zwnr', zk]).catch(() => null);
    const pp = await profiel(wv).catch(() => null), tg = pp && pp.contact && pp.contact.tg, wa = pp && pp.contact && pp.contact.wa;
    if (!mail && !nr && !tg && !wa) continue;
    const id = h12([String(eigen.k), zk].sort().join('|'));
    if (N(await kv.raw(['SADD', 'wam:wachtgemeld', id]).catch(() => 0)) !== 1) continue;
    let mp = await kv.get('wam:mp:' + id).catch(() => null);
    const stad = (s.ctx && s.ctx.stad) || eigen.waar || '';
    if (!mp) { mp = { a: wv, b: p.vid, za: zk.split(':')[1], zb: String(eigen.k).split(':')[1], wa: z.wat, wb: eigen.wat, ka: z.kant || 'zoekt', kb: eigen.kant || 'zoekt', sa: z.waar || '', sb: stad, waarom: 'wachter', t: Date.now(), ja: {}, nr: {} }; await kv.set('wam:mp:' + id, mp); await kv.raw(['SADD', 'wam:mparen', id]).catch(() => {}); }
    if (await inboxIn(wv, { soort: 'wacht', mp: id, van: p.vid, wat: eigen.wat, kant: eigen.kant, stad })) velden.wacht_tg = 1;
    if (mail && await mailLater(wv, String(mail), { kant: eigen.kant, wat: eigen.wat, stad }, (pp && pp.taal) || 'en', 'wacht')) velden.wacht_mail = 1;
    if (nr) velden.wacht_nr = 1; // WhatsApp zelf sturen kan pas met Henkjans ja op de Whapp-koppeling; het nummer wacht op de verbinding
    velden.wacht_gemeld = 1; n++;
    await meld('WAM: iemand die wachtte is gemeld (' + [mail && 'mail', nr && 'WhatsApp-nummer', tg && 'Telegram', wa && 'WhatsApp'].filter(Boolean).join(', ') + '): "' + kort(z.wat, 60) + '" past bij nieuw "' + kort(eigen.wat, 60) + '" (' + (s.ctx.land || '') + ').').catch(() => {});
  }
  return n;
}
// 'Nog niemand' lerend (10 nov 19:25 UTC: na 'Nobody here is looking for this yet' ging maar 2 van 12 verder): drie eerlijke varianten,
// Thompson op getoond (g) tegen daarna nog een beurt (v) in wam:nee. n1 = de oude tekst als controle.
const NEE = {
  n1: { en: k => 'Nobody here ' + (k === 'biedt' ? 'is looking for this' : 'offers this') + ' yet. I talk with hundreds of people every day. Want a ping the moment someone does?', nl: k => 'Nog niemand hier ' + (k === 'biedt' ? 'zoekt dit' : 'biedt dit aan') + '. Ik spreek elke dag honderden mensen. Zal ik je een seintje geven zodra iemand dat doet?', de: k => 'Noch niemand hier ' + (k === 'biedt' ? 'sucht das' : 'bietet das an') + '. Ich spreche jeden Tag mit Hunderten. Soll ich dir Bescheid geben, sobald es jemand tut?' },
  n2: { en: k => 'You would be first in line: nobody here ' + (k === 'biedt' ? 'has asked for this' : 'offers this') + ' yet, so the moment someone does, you are the one I introduce.', nl: k => 'Jij staat vooraan: nog niemand hier ' + (k === 'biedt' ? 'vroeg hierom' : 'biedt dit aan') + ', dus zodra iemand dat doet, ben jij degene die ik voorstel.', de: k => 'Du stehst ganz vorne: noch niemand hier ' + (k === 'biedt' ? 'hat danach gefragt' : 'bietet das an') + ', also bist du die Person, die ich vorstelle, sobald es jemand tut.' },
  n4: { en: k => 'WAM is a commons: put in anything you ' + (k === 'biedt' ? 'offer' : 'need') + ', and sooner or later I find the match. Yours is on file and I keep looking.', nl: k => 'WAM is een commons: zet erin wat je ' + (k === 'biedt' ? 'aanbiedt' : 'zoekt') + ', en vroeg of laat vind ik de match. Die van jou staat erin en ik blijf zoeken.', de: k => 'WAM ist eine Allmende: stell rein, was du ' + (k === 'biedt' ? 'anbietest' : 'suchst') + ', früher oder später finde ich das Match. Deins ist gespeichert und ich suche weiter.' },
  n3: { en: k => (k === 'biedt' ? 'No one is competing with you here yet.' : 'Nobody offers this here yet.') + ' I talk with hundreds of people a day and keep looking for you while we chat.', nl: k => (k === 'biedt' ? 'Hier heb je nog geen concurrentie.' : 'Nog niemand biedt dit hier aan.') + ' Ik spreek honderden mensen per dag en blijf voor je zoeken terwijl we praten.', de: k => (k === 'biedt' ? 'Hier hast du noch keine Konkurrenz.' : 'Noch niemand bietet das hier an.') + ' Ich spreche täglich mit Hunderten und suche weiter für dich, während wir reden.' },
};
const neeTekst = (id, taal, kant) => ((NEE[id] || NEE.n1)[taal] || (NEE[id] || NEE.n1).en)(kant);
async function telNee(id, veld, test) { if (!test && id) await kv.raw(['HINCRBY', 'wam:nee', id + '|' + veld, '1']).catch(() => {}); }
async function kiesNee() {
  const r = await kv.raw(['HGETALL', 'wam:nee']).catch(() => []) || []; const l = Array.isArray(r) ? r : Object.entries(r).flat(); const st = {};
  for (let i = 0; i + 1 < l.length; i += 2) { const [id, v] = String(l[i]).split('|'); st[id] = st[id] || {}; st[id][v] = N(l[i + 1]); }
  let best = 'n1', bw = -1; for (const id of Object.keys(NEE)) { const x = st[id] || {}; const w = beta(1 + N(x.v), 1 + Math.max(0, N(x.g) - N(x.v))); if (w > bw) { bw = w; best = id; } }
  return best;
}
async function telMl(id, veld, test) { if (!test && id) await kv.raw(['HINCRBY', 'wam:ml', id + '|' + veld, '1']).catch(() => {}); }
export async function mlStand() { const r = await kv.raw(['HGETALL', 'wam:ml']).catch(() => []) || []; const st = {}; const l = Array.isArray(r) ? r : Object.entries(r).flat(); for (let i = 0; i + 1 < l.length; i += 2) { const [id, v] = String(l[i]).split('|'); st[id] = st[id] || {}; st[id][v] = N(l[i + 1]); } return st; }
async function kiesMl() {
  const st = await mlStand(); let best = ML[0], bw = -1; const tgKan = !!(process.env.WAM_TG_BOT && process.env.WAM_TG_TOKEN);
  for (const v of ML.filter(v => v.kanaal !== 'tg' || tgKan)) { const x = st[v.id] || {}, g = N(x.g), k = N(x.k), c = N(x.c); const w = beta(1 + 2 * c + 0.5 * Math.max(0, k - c), 1 + Math.max(0, g - k) + 0.5 * Math.max(0, k - c)); if (w > bw) { bw = w; best = v; } }
  return best;
}
async function mailLater(vid, mail, ander, taal, soort) {
  try {
    if (!(await POST.mailKlaar())) return false;
    if (soort === 'wacht') { const tw = 'Good news: someone on WAM' + (ander.stad ? ' in ' + ander.stad : '') + ' ' + (ander.kant === 'biedt' ? 'offers' : 'is looking for') + ': ' + ander.wat + '\nOpen your chat to send them a message. You both stay anonymous until you choose to share contact.'; const l0 = await postLinks(vid); await POST.stuurMail({ to: mail, subject: 'WAM: I found someone for you', html: POST.mailHtml({ taal: 'en', tekst: tw, knop: 'Open the chat', ...l0 }), text: POST.mailTekst({ taal: 'en', tekst: tw, knop: 'Open the chat', ...l0 }), stopUrl: l0.stopUrl }); return true; }
    const tekst = 'Someone on WAM ' + (ander.kant === 'biedt' ? 'offers' : 'is looking for') + ': ' + ander.wat + '\nThey want to connect with you about what you told me. Open your chat to read their message and reply. Your email stays private.';
    const l = await postLinks(vid); await POST.stuurMail({ to: mail, subject: 'WAM: someone here matches what you told me', html: POST.mailHtml({ taal: taal || 'en', tekst, knop: 'Open the chat', ...l }), text: POST.mailTekst({ taal: taal || 'en', tekst, knop: 'Open the chat', ...l }), stopUrl: l.stopUrl });
    return true;
  } catch (e) { return false; }
}
// Claude als achtervang: teksten, wachtrij lezen (op=cq) en antwoorden (op=cqantw); het antwoord komt via de inbox (web elke 20 s, Telegram en WhatsApp meteen)
const CQW = { en: 'Good one. Let me look into this properly, I\'ll answer right here in a few minutes.', nl: 'Goeie. Ik zoek dit even goed uit, ik antwoord hier binnen een paar minuten.', de: 'Gute Frage. Ich schaue mir das genau an und antworte hier in ein paar Minuten.', fr: 'Bonne question. Je regarde ça de près et je te réponds ici dans quelques minutes.', es: 'Buena pregunta. Lo miro bien y te respondo aquí en unos minutos.' };
const CQW2 = { en: 'Meanwhile:', nl: 'Ondertussen:', de: 'Inzwischen:', fr: 'En attendant :', es: 'Mientras tanto:' };
const CQW3 = { en: 'Got it, I\'m on it. My answer comes right here in a few minutes.', nl: 'Genoteerd, ik ben ermee bezig. Mijn antwoord komt hier binnen een paar minuten.', de: 'Notiert, ich bin dran. Meine Antwort kommt hier in ein paar Minuten.', fr: 'Noté, je m\'en occupe. Ma réponse arrive ici dans quelques minutes.', es: 'Anotado, estoy en ello. Mi respuesta llega aquí en unos minutos.' };
// Regelantwoorden na het AI-plafond (12 nov: om 15:10 UTC stonden er 60 Canadezen in de handmatige wachtrij, 15 minuten wachten).
// Voor bekende knoppen en korte antwoorden geeft de chat meteen een vervolgvraag zonder AI, in de stijl van de Claude-achtervang van 11 nov:
// noem wat ze kozen, vraag één nieuw detail, na twee details eerlijk om mail. Vrije tekst die niet in de tabel staat gaat naar de wachtrij (op=cq).
const RA = {
  en: {
    W: ['Warehouse or driving', 'Retail or food', 'Trades', 'Office or remote'], H: ['Retail or food', 'Warehouse or driving', 'Trades', 'Office or admin'],
    ASK: ['A place to live', 'Work or gigs', 'A better deal', 'People to meet'], RB: ['Under $700', '$700 to $1,000', '$1,000 to $1,300', 'Over $1,300'],
    PB: ['Under $1,500', '$1,500 to $2,000', '$2,000 to $3,000', 'Over $3,000'], T: ['This month', 'Next month', 'In 2 to 3 months', 'Just looking'],
    R: ['A room', 'A basement unit', 'A whole place', 'Parking or storage'], F: ['Repairs at home', 'Furniture assembly', 'Renovation or carpentry', 'Cars or bikes'],
    HL: ['Around the house', 'Moving or a ride', 'Kids or pets', 'Tech or paperwork'], PR: ['Rogers', 'Bell', 'Telus', 'Other'], BUG: ['The bill', 'The service', 'The contract', 'All of it'],
    BK: ['Fees', 'Service', 'Rates', 'Claims'], EN: ['The price', 'The service', 'Billing errors', 'Something else'], M: ['Side gigs', 'Selling things', 'Renting out', 'A better paid job'],
    DL: ['Phone or internet', 'Energy', 'Bank or insurer', 'Something to buy'], PE: ['Sports or games', 'Going out', 'Same neighbourhood', 'Same interests'],
    CK: ['Baked goods', 'Meals', 'Catering', 'Something else'], TC: ['Tutoring', 'Fitness', 'Music', 'Something else'],
    t: {
      werk: c => `Work around ${c}, got it. What kind of work are you after? People here post jobs and gigs every day.`,
      huur: c => `You're hiring around ${c}, good. What role is it? People here look for work every day, and I can put your opening in front of the ones who fit.`,
      kamer: c => `A room around ${c}, got it. What's your budget a month for the room?`,
      plek: c => `A new place around ${c}, got it. What budget a month are you aiming for?`,
      wanneer: () => `Noted. When do you want to move? Then I know who to put you in front of.`,
      verhuur: c => `You rent something out around ${c}, good timing: people here ask for rooms and places every day. What is it?`,
      fix: c => `You fix or build things, people around ${c} ask for that here all the time. What's your specialty?`,
      hulp: () => `Got it, someone to help. What kind of help do you need?`,
      kok: c => `You cook or bake, nice. What do you make? People around ${c} look for homemade food here.`,
      leraar: c => `What do you teach or coach? Tell me and I'll find people around ${c} looking for it.`,
      provider: () => `Phone or internet, the top complaint here. Which provider is it? People here compare notes and switch together for a better deal.`,
      bug: p => `${p}, lots of people here are fed up with them too. What bugs you most?`,
      bank: () => `Bank or insurer, you're far from alone. What bugs you most? People here compare notes and tell each other who treats them better.`,
      energie: () => `Energy bills, a common one here. What's the problem with yours?`,
      geld: c => `More money, I hear you. People around ${c} find extra income here. What would you be up for?`,
      deal: () => `A better deal on what? Tap one and I'll show you what others here pay and who does it cheaper.`,
      mensen: c => `People to meet around ${c}, nice. What kind of people?`,
      vraag: c => `My question for you: what would make your week easier right now? People around ${c} help each other here, tell me and I look for who fits.`,
      anders: c => `Something else, tell me what in a few words and I'll check who around ${c} offers it. Or tap the closest:`,
      drank: () => `Noted. Now something more useful: what would make your week easier right now?`,
      contact: () => `Got it, that's on your card now. Type your email here and I'll message you as soon as someone here fits. Nothing else, no spam.`,
      groep: () => `Noted. When enough people here have the same problem with the same company, we go to them together. Type your email and I'll tell you when the group moves.`,
      mail: () => `Thanks, saved. I'll email you as soon as someone here fits. Anything else you're looking for meanwhile?`,
      tel: () => `Thanks! WhatsApp only works if you message us first, so email is easiest: type your email here and I'll write as soon as someone fits.`
    }
  },
  nl: {
    W: ['Magazijn of rijden', 'Winkel of horeca', 'Vakwerk', 'Kantoor of thuis'], H: ['Winkel of horeca', 'Magazijn of rijden', 'Vakwerk', 'Kantoor'],
    ASK: ['Een woning', 'Werk of klussen', 'Een betere deal', 'Mensen ontmoeten'], RB: ['Onder €600', '€600 tot €800', '€800 tot €1.000', 'Meer dan €1.000'],
    PB: ['Onder €1.000', '€1.000 tot €1.400', '€1.400 tot €1.800', 'Meer dan €1.800'], T: ['Deze maand', 'Volgende maand', 'Over 2 tot 3 maanden', 'Ik kijk alleen'],
    R: ['Een kamer', 'Een studio', 'Een hele woning', 'Parkeerplek of opslag'], F: ['Reparaties in huis', 'Meubels in elkaar', 'Verbouwen of timmeren', 'Auto of fiets'],
    HL: ['In huis', 'Verhuizen of vervoer', 'Kinderen of dieren', 'Computer of papierwerk'], PR: ['KPN', 'Odido', 'Ziggo', 'Anders'], BUG: ['De rekening', 'De service', 'Het contract', 'Alles'],
    BK: ['Kosten', 'Service', 'Rente', 'Claims'], EN: ['De prijs', 'De service', 'Foute rekening', 'Iets anders'], M: ['Klussen ernaast', 'Spullen verkopen', 'Iets verhuren', 'Beter betaalde baan'],
    DL: ['Telefoon of internet', 'Energie', 'Bank of verzekeraar', 'Iets kopen'], PE: ['Sport of spel', 'Uitgaan', 'Zelfde buurt', 'Zelfde interesses'],
    CK: ['Gebak', 'Maaltijden', 'Catering', 'Iets anders'], TC: ['Bijles', 'Sport', 'Muziek', 'Iets anders'],
    t: {
      werk: c => `Werk in de buurt van ${c}, genoteerd. Wat voor werk zoek je? Hier komen elke dag banen en klussen voorbij.`,
      huur: c => `Je zoekt personeel rond ${c}, mooi. Voor welke functie? Hier zoeken elke dag mensen werk, ik zet je vacature voor wie past.`,
      kamer: c => `Een kamer rond ${c}, genoteerd. Wat is je budget per maand?`,
      plek: c => `Een andere woning rond ${c}, genoteerd. Welk budget per maand?`,
      wanneer: () => `Genoteerd. Wanneer wil je verhuizen? Dan weet ik voor wie ik je zet.`,
      verhuur: c => `Je verhuurt iets rond ${c}, goed moment: hier vragen elke dag mensen om een kamer of woning. Wat is het?`,
      fix: c => `Je repareert of bouwt dingen, daar vragen mensen rond ${c} hier vaak om. Waar ben je goed in?`,
      hulp: () => `Iemand om te helpen, genoteerd. Wat voor hulp zoek je?`,
      kok: c => `Je kookt of bakt, leuk. Wat maak je? Mensen rond ${c} zoeken hier zelfgemaakt eten.`,
      leraar: c => `Wat geef je les in of waar coach je in? Dan zoek ik mensen rond ${c} die dat zoeken.`,
      provider: () => `Telefoon of internet, de grootste ergernis hier. Welke aanbieder? Mensen hier vergelijken en stappen samen over voor een betere deal.`,
      bug: p => `${p}, daar zijn hier veel mensen klaar mee. Wat stoort je het meest?`,
      bank: () => `Bank of verzekeraar, je bent zeker niet de enige. Wat stoort je het meest? Mensen hier vertellen elkaar wie ze beter behandelt.`,
      energie: () => `Energierekening, die hoor ik vaak. Wat is het probleem?`,
      geld: c => `Meer geld, snap ik. Mensen rond ${c} verdienen hier iets bij. Waar heb je zin in?`,
      deal: () => `Een betere deal op wat? Tik er een, dan zie je wat anderen hier betalen en wie het goedkoper doet.`,
      mensen: c => `Mensen ontmoeten rond ${c}, leuk. Wat voor mensen?`,
      vraag: c => `Mijn vraag aan jou: wat zou je week nu makkelijker maken? Mensen rond ${c} helpen elkaar hier, zeg het en ik zoek wie past.`,
      anders: c => `Iets anders, zeg in een paar woorden wat en ik kijk wie rond ${c} het aanbiedt. Of tik het dichtstbijzijnde:`,
      drank: () => `Genoteerd. Nu iets nuttigers: wat zou je week nu makkelijker maken?`,
      contact: () => `Genoteerd, dat staat nu op je kaart. Typ hier je e-mailadres en ik laat het je weten zodra iemand hier past. Verder niets, geen spam.`,
      groep: () => `Genoteerd. Als genoeg mensen hier hetzelfde probleem met hetzelfde bedrijf hebben, stappen we er samen op af. Typ je e-mail en ik laat het weten als de groep in actie komt.`,
      mail: () => `Dank je, opgeslagen. Ik mail je zodra iemand hier past. Zoek je ondertussen nog iets anders?`,
      tel: () => `Dank je! WhatsApp werkt alleen als je ons eerst een bericht stuurt, dus e-mail is het makkelijkst: typ hier je e-mailadres.`
    }
  }
};
// Wat ze nog meer willen, meteen maken (Henkjan 12 nov 16:45 UTC: "Vraag ook wat mensen nog meer willen en dat je dat meteen ook voor ze maakt"):
// elk pad in de regelchat eindigt nu met iets echts: een zoektocht of aanbod op hun kaart (wam:zw, dezelfde lijst als de AI vult), meteen
// gekoppeld aan wie er al in zit, en daarna de vraag wat ze nog meer willen. Wat ze dan typen wordt ook meteen een zoektocht of aanbod.
const RA_ROOT = { werk: ['zoekt', 'baan'], huur: ['biedt', 'baan'], kamer: ['zoekt', 'woning'], plek: ['zoekt', 'woning'], verhuur: ['biedt', 'woning'], fix: ['biedt', 'dienst'], dienst: ['biedt', 'dienst'], hulp: ['zoekt', 'dienst'], kok: ['biedt', 'iets'], leraar: ['biedt', 'dienst'], koop: ['zoekt', 'iets'], verkoop: ['biedt', 'iets'], mensen: ['zoekt', 'iemand'] };
const RA_LIJST = { werk: 'W', huur: 'H', verhuur: 'R', fix: 'F', dienst: 'DI', hulp: 'HL', kok: 'CK', leraar: 'TC', koop: 'KOOP', verkoop: 'VK', mensen: 'PE' };
const RA2 = {
  en: {
    KOOP: ['Phone or tech', 'Furniture', 'Car or bike', 'Something else'], VK: ['Furniture', 'Phone or tech', 'Clothes', 'Something else'], DI: ['Cleaning', 'Repairs or handyman', 'Moving or delivery', 'Lessons or coaching'],
    wat: { werk: k => 'Work' + (k ? ': ' + k : ''), huur: k => 'Job opening' + (k ? ': ' + k : ''), kamer: () => 'A room to rent', plek: () => 'A place to rent', verhuur: k => (k ? k.replace(/^an? /i, '') : 'Room') + ' for rent', fix: k => k || 'Repairs and odd jobs', dienst: k => k || 'A local service', hulp: k => 'Help' + (k ? ': ' + k : ''), kok: k => 'Homemade food' + (k ? ': ' + k : ''), leraar: k => 'Lessons or coaching' + (k ? ': ' + k : ''), koop: k => k || 'Something to buy', verkoop: k => 'For sale' + (k ? ': ' + k : ''), mensen: k => 'People to meet' + (k ? ': ' + k : '') },
    koop: c => `What do you want to buy? People around ${c} sell here, and if others want the same we ask for a group price.`,
    verkoop: c => `What do you want to sell? People around ${c} look for things here every day.`,
    dienst: c => `You offer a service, good: people around ${c} ask for help here every day. What do you do?`,
    welke: () => `Which provider is it? Type the name.`,
    gemaakt: (wat, mail) => `Done: "${wat}" is on your card, I keep looking.` + (mail ? ` Anything else you need? Tell me and I set it up.` : ` Type your email and you hear it the moment someone fits. Anything else you need?`),
    nogmeer: () => `What else do you want? Tell me and I'll set it up right away.`,
    klaar: mail => mail ? `All set. I'll let you know the moment someone fits. Your card stays, come back anytime.` : `All set. Type your email and I'll tell you the moment someone fits.`
  },
  nl: {
    KOOP: ['Telefoon of tech', 'Meubels', 'Auto of fiets', 'Iets anders'], VK: ['Meubels', 'Telefoon of tech', 'Kleding', 'Iets anders'], DI: ['Schoonmaken', 'Klussen of reparaties', 'Verhuizen of bezorgen', 'Les of coaching'],
    wat: { werk: k => 'Werk' + (k ? ': ' + k : ''), huur: k => 'Vacature' + (k ? ': ' + k : ''), kamer: () => 'Een kamer om te huren', plek: () => 'Een huurwoning', verhuur: k => 'Te huur' + (k ? ': ' + k : ''), fix: k => k || 'Klussen en reparaties', dienst: k => k || 'Een dienst', hulp: k => 'Hulp' + (k ? ': ' + k : ''), kok: k => 'Zelfgemaakt eten' + (k ? ': ' + k : ''), leraar: k => 'Les of coaching' + (k ? ': ' + k : ''), koop: k => k || 'Iets om te kopen', verkoop: k => 'Te koop' + (k ? ': ' + k : ''), mensen: k => 'Mensen ontmoeten' + (k ? ': ' + k : '') },
    koop: c => `Wat wil je kopen? Mensen rond ${c} verkopen hier, en als anderen hetzelfde willen vragen we samen een groepsprijs.`,
    verkoop: c => `Wat wil je verkopen? Mensen rond ${c} zoeken hier elke dag spullen.`,
    dienst: c => `Je biedt een dienst, mooi: mensen rond ${c} vragen hier elke dag om hulp. Wat doe je?`,
    welke: () => `Welke aanbieder is het? Typ de naam.`,
    gemaakt: (wat, mail) => `Gedaan: "${wat}" staat op je kaart, ik blijf zoeken.` + (mail ? ` Nog iets anders nodig? Zeg het, dan zet ik het klaar.` : ` Typ je e-mailadres, dan hoor je het zodra iemand past. Nog iets anders nodig?`),
    nogmeer: () => `Wat wil je nog meer? Zeg het en ik zet het meteen voor je klaar.`,
    klaar: mail => mail ? `Alles staat. Ik laat het je weten zodra iemand past. Je kaart blijft staan, kom gerust terug.` : `Alles staat. Typ je e-mailadres, dan hoor je het zodra iemand past.`
  }
};
const RA_NEE = /^(no|nope|nah|nothing|nothing else|no thanks|no thank you|not now|not really|that's all|that's it|i'm good|im good|all good|ok|okay|thanks|thank you|thx|ty|cool|great|perfect|nee|nee dank je|nee bedankt|nee hoor|niks|niets|niks meer|niets meer|dat was het|verder niks|verder niets|oké|oke|bedankt|dank je|dankjewel|top|prima)$/;
const RA_VRAAG = /\?\s*$|^(how|what|why|who|where|when|can|could|do|does|is|are|will|would|hoe|wat|waarom|wie|waar|wanneer|kan|kun|kunnen|is|zijn|werkt)\b/i;
const RA_GROET = /^(hi|hello|hey|yo|hoi|hallo|hey there|good (morning|afternoon|evening)|goedemorgen|goedemiddag|goedenavond)\b/;
const RA_HIRE = /^(i'm hiring|im hiring|we're hiring|were hiring|hiring|i need staff|ik zoek personeel|wij zoeken personeel|we zoeken personeel)\b/;
const RA_BIED = /^(i (have|sell|offer|rent out|do|make|teach|fix|bake|cook|clean|repair|can)|i'm (selling|offering|renting out|a |an )|im (selling|offering|a )|selling|offering|for sale|for rent|ik (heb|verkoop|bied|verhuur|doe|maak|geef|kan|repareer|bak|kook)|te koop|te huur)\b/;
const RA_WIL = /^(i('m| am)? (need|want|looking for|look for|searching for|search for|seeking|would like)|i need|i want|looking for|searching for|need|want|ik (zoek|wil|heb nodig|ben op zoek naar)|op zoek naar|zoek)\b/;
const RA_PRE = /^(i('m| am)? (need|want|looking for|look for|searching for|search for|seeking|would like)( to (buy|find|get|have))?|i need|i want|looking for|searching for|need|want|i('m| am)? (selling|offering|renting out)|i (have|sell|offer|rent out)|selling|offering|ik (zoek|wil|heb nodig|ben op zoek naar|heb|verkoop|bied|verhuur)|op zoek naar|zoek)\s+/i;
const RA_DIENST = /\b(clean\w*|repair\w*|fix\w*|plumb\w*|electric\w*|paint\w*|garden\w*|moving|movers?|lessons?|tutor\w*|coach\w*|babysit\w*|nann\w*|dog ?walk\w*|haircut|hairdress\w*|massage|mechanic|handyman|cater\w*|delivery|schoonma\w*|klus\w*|reparat\w*|loodgiet\w*|elektric\w*|schilder\w*|tuin\w*|verhuiz\w*|bijles|oppas\w*|kapper)\b/i;
const RA_IEMAND = /\b(friends?|people|buddy|buddies|partner|someone to|company|teammates?|vrienden|mensen|maatje|iemand om)\b/i;
const RA_STOP = ['alert', 'gemaakt', 'contact', 'groep', 'mail', 'anders', 'vraag', 'drank', 'tel'];
// Genoeg weten voor een goede match (Henkjan 12 nov 18:03 UTC: "Vind juiste hoeveelheid info om niet een slechte match te maken"): per soort de
// belangrijkste gegevens op volgorde (woning: budget, waar, wanneer; dienst: wat, waar, wanneer of prijs; spullen: wat, budget, waar; werk: wat, waar).
// Hoeveel WAM er vraagt voordat hij maakt en matcht, leert per gesprek in wam:diepte (d1, d2, d3): gestart g, gemaakt m, contact getikt v; beloning vooral contact (v).
const RA_ESS = { 'zoekt|woning': ['budget', 'waar', 'wanneer'], 'biedt|woning': ['budget', 'waar', 'wanneer'], 'zoekt|baan': ['wat', 'waar'], 'biedt|baan': ['wat', 'waar'], 'zoekt|dienst': ['wat', 'waar', 'wanneer'], 'biedt|dienst': ['wat', 'waar', 'budget'], 'zoekt|iets': ['wat', 'budget', 'waar'], 'biedt|iets': ['wat', 'budget', 'waar'], 'zoekt|iemand': ['wat', 'waar'] };
const DIEPTE = ['d1', 'd2', 'd3'];
// beloning is contact (v), niet alleen afmaken: met alleen afmaken wint altijd de kortste trechter (12 nov 18:37: d1 39 van 39) en dat geeft juist slechte matches.
// Eerst elke diepte minstens 30 keer (verkennen), daarna Thompson op contact per gestarte trechter met een klein beetje krediet voor afmaken.
async function kiesDiepte() { const h = await hget('wam:diepte').catch(() => ({})); const weinig = DIEPTE.filter(d => N(h[d + '|g']) < 30); if (weinig.length) return weinig[Math.floor(Math.random() * weinig.length)]; let best = 'd2', bs = -1; for (const d of DIEPTE) { const g = N(h[d + '|g']), m = N(h[d + '|m']), v = N(h[d + '|v']); const a = gamma(1 + v + 0.1 * m), b = gamma(1 + Math.max(0, g - v)); const sc = a / (a + b); if (sc > bs) { bs = sc; best = d; } } return best; }
async function telDiepte(d, veld, test) { if (!test && DIEPTE.includes(d)) await kv.raw(['HINCRBY', 'wam:diepte', d + '|' + veld, '1']).catch(() => {}); }
export async function diepteStand() { return hget('wam:diepte').catch(() => ({})); }
const RA_KAMER = /\b(rooms?|kamer|studio|basement)\b/i;
const RA_WANNEER = /\b(now|asap|today|tonight|tomorrow|this (week|month|weekend)|next (week|month)|january|february|march|april|june|july|august|september|october|november|december|direct|nu|vandaag|morgen|deze (week|maand)|volgende (week|maand)|januari|februari|maart|mei|juni|juli|augustus|oktober)\b/i;
const RA_BEDRAG = /(?:\b(?:under|below|max|up to|around|about|onder|tot|maximaal|rond)\s+)?[$€£]\s?\d[\d,.]*(?:\s?k)?|(?:\b(?:under|below|max|up to|around|about|onder|tot|maximaal|rond)\s+)?\b\d{2,}[\d,.]*(?:\s?(?:k|dollars?|euros?|bucks))?\b(?:\s?(?:a|per|\/)\s?(?:month|mo|maand|week|hour|uur|hr))?/i;
const RA_PLEK = /\b(?:in|near|around|bij|rond|nabij)\s+([A-Z][\w'-]+(?:\s[A-Z][\w'-]+)?)/;
const RA3 = {
  en: { waar: c => c ? 'Which part of ' + c + '? Type the area, or tap if anywhere is fine.' : 'Which city or area?', overal: c => 'Anywhere in ' + c, skip: 'Skip',
    budget: { 'zoekt|woning': 'What\'s your budget a month?', 'biedt|woning': 'What rent do you ask a month?', 'zoekt|iets': 'What\'s your budget for it?', 'biedt|iets': 'What price do you have in mind?', 'biedt|dienst': 'What do you charge, roughly?' },
    bk: { 'biedt|woning': ['Under $800', '$800 to $1,200', '$1,200 to $2,000', 'Over $2,000'], 'zoekt|iets': ['Under $100', '$100 to $500', '$500 to $1,000', 'Over $1,000'], 'biedt|iets': ['Under $100', '$100 to $500', 'Over $500', 'Open to offers'], 'biedt|dienst': ['Under $30 an hour', '$30 to $60 an hour', 'Over $60 an hour', 'Depends on the job'] },
    wanneer: { 'zoekt|woning': 'When do you want to move?', 'biedt|woning': 'From when is it available?', dienst: 'When do you need it?' },
    wk: { 'biedt|woning': ['Now', 'Next month', 'In 2 to 3 months', 'Not sure yet'], dienst: ['Today or tomorrow', 'This week', 'This month', 'No rush'] },
    wat: k => k === 'biedt' ? 'What exactly do you offer? A few words is enough.' : 'What exactly are you looking for? A few words is enough.' },
  nl: { waar: c => c ? 'Welk deel van ' + c + '? Typ de wijk, of tik als overal goed is.' : 'Welke plaats of wijk?', overal: c => 'Overal in ' + c, skip: 'Overslaan',
    budget: { 'zoekt|woning': 'Wat is je budget per maand?', 'biedt|woning': 'Welke huur vraag je per maand?', 'zoekt|iets': 'Wat is je budget?', 'biedt|iets': 'Aan welke prijs denk je?', 'biedt|dienst': 'Wat reken je ongeveer?' },
    bk: { 'biedt|woning': ['Onder €600', '€600 tot €900', '€900 tot €1.400', 'Meer dan €1.400'], 'zoekt|iets': ['Onder €100', '€100 tot €500', '€500 tot €1.000', 'Meer dan €1.000'], 'biedt|iets': ['Onder €100', '€100 tot €500', 'Meer dan €500', 'Bieden mag'], 'biedt|dienst': ['Onder €30 per uur', '€30 tot €60 per uur', 'Meer dan €60 per uur', 'Hangt van de klus af'] },
    wanneer: { 'zoekt|woning': 'Wanneer wil je verhuizen?', 'biedt|woning': 'Vanaf wanneer is het vrij?', dienst: 'Wanneer heb je het nodig?' },
    wk: { 'biedt|woning': ['Nu', 'Volgende maand', 'Over 2 tot 3 maanden', 'Weet ik nog niet'], dienst: ['Vandaag of morgen', 'Deze week', 'Deze maand', 'Geen haast'] },
    wat: k => k === 'biedt' ? 'Wat bied je precies aan? Een paar woorden is genoeg.' : 'Wat zoek je precies? Een paar woorden is genoeg.' }
};
// scherp matchen in WhatsApp (Henkjan 12 nov 20:42 UTC: "dit is toch veel te weinig info voor een match ... Je moet meer weten voor de match en dan kun je
// zeer scherpe matches maken als je goede vraag stelt of foto erbij vraagt. Je zet het netjes allemaal anoniem neer en kan matchen"): in WhatsApp alle
// basisvragen, dan één scherpe vraag per soort en waar het helpt een foto (zonder mensen); daarna toont WAM de anonieme kaart zoals matches hem zien
const SCHERP = {
  en: { 'zoekt|woning': 'To match you sharply: room or whole place, furnished or not, and any must-haves (pets, parking, near transit)?', 'biedt|woning': 'What is included (furnished, utilities, parking) and who would fit best?', 'zoekt|baan': 'What kind of work exactly, your experience, and when can you start?', 'biedt|baan': 'What is the job: hours, pay, and what do you need from someone?', 'zoekt|dienst': 'Describe the job in a few words: what and how big?', 'biedt|dienst': 'What exactly do you do, which areas do you cover, and your price?', 'zoekt|iets': 'Which brand, model or size, and is used fine?', 'biedt|iets': 'Condition, brand or model, and anything included?', 'zoekt|iemand': 'What kind of person or group, and what would you do together?' },
  nl: { 'zoekt|woning': 'Om scherp te matchen: kamer of hele woning, gemeubileerd of niet, en wat moet er zijn (huisdier, parkeren, OV dichtbij)?', 'biedt|woning': 'Wat zit erbij (gemeubileerd, gas/water/licht, parkeren) en wie past er het best?', 'zoekt|baan': 'Wat voor werk precies, je ervaring, en wanneer kun je beginnen?', 'biedt|baan': 'Wat is de baan: uren, loon, en wat zoek je in iemand?', 'zoekt|dienst': 'Beschrijf de klus in een paar woorden: wat en hoe groot?', 'biedt|dienst': 'Wat doe je precies, in welke buurten, en wat kost het?', 'zoekt|iets': 'Welk merk, model of maat, en mag het tweedehands?', 'biedt|iets': 'Staat, merk of model, en wat zit erbij?', 'zoekt|iemand': 'Wat voor persoon of groep, en wat zouden jullie samen doen?' }
};
const FOTO_KW = new Set(['biedt|woning', 'biedt|iets', 'zoekt|dienst', 'biedt|dienst']);
const FOTOV = { en: kw => (kw === 'zoekt|dienst' ? 'Send a photo of the job if you can (no people), that helps a lot. Or tap Skip.' : 'Send a photo (no people), matches respond much faster with one. Or tap Skip.'), nl: kw => (kw === 'zoekt|dienst' ? 'Stuur een foto van de klus als dat kan (zonder mensen), dat helpt enorm. Of tik Overslaan.' : 'Stuur een foto (zonder mensen), met een foto reageren matches veel sneller. Of tik Overslaan.') };
const KAARTL = { en: { kop: 'Your anonymous card, this is what matches see:', zoekt: 'Looking for', biedt: 'Offering', waar: 'Where', budget: 'Budget', prijs: 'Price', wanneer: 'When', extra: 'Details', foto: '📷 photo added', voet: 'No name, no number. You decide who gets in touch.' }, nl: { kop: 'Je anonieme kaart, dit zien matches:', zoekt: 'Zoekt', biedt: 'Biedt', waar: 'Waar', budget: 'Budget', prijs: 'Prijs', wanneer: 'Wanneer', extra: 'Details', foto: '📷 foto erbij', voet: 'Geen naam, geen nummer. Jij bepaalt wie contact krijgt.' } };
function anonKaart(mk, taal) { const L = KAARTL[taal] || KAARTL.en, b = mk.kant === 'biedt'; return [L.kop, '', (b ? L.biedt : L.zoekt) + ': ' + mk.wat, mk.waar ? L.waar + ': ' + mk.waar : '', mk.eisen ? (b ? L.prijs : L.budget) + ': ' + mk.eisen : '', mk.wanneer ? L.wanneer + ': ' + mk.wanneer : '', mk.extra ? L.extra + ': ' + mk.extra : '', mk.foto ? L.foto : '', '', L.voet].filter((x, i, a) => x || (i > 0 && a[i - 1])).join('\n').replace(/\n{3,}/g, '\n\n').trim(); }
const lcEerst = x => { x = String(x || ''); return x.length > 1 && x[1] === x[1].toLowerCase() ? x[0].toLowerCase() + x.slice(1) : x; };
// meteen naar WhatsApp (Henkjan 12 nov 18:18 UTC: "Je kunt ze ook meteen whatsapp insturen"): na iets maken of een match één groene knop naar
// het WAM-nummer met de code al ingevuld; daarna gaan matches en berichten via WhatsApp (echt contact). Knoptekst lerend (CTA whatsapp).
const WAKAART = { en: 'Get your matches and messages on WhatsApp: one tap, then send the message that is already filled in.', nl: 'Je matches en berichten op WhatsApp: één tik, en stuur het bericht dat al klaarstaat.', de: 'Deine Matches und Nachrichten auf WhatsApp: ein Tipp, dann die vorbereitete Nachricht senden.' };
async function waKaart(s, p, velden, test) {
  if (!WA.nr || s.waG || (p && p.contact && p.contact.wa) || (s.ctx && s.ctx.kanaal && s.ctx.kanaal !== 'web')) return null;
  const taal = s.ctx && s.ctx.taal, code = await contactCode(s.vid); s.waG = 1; velden.wa_kaart = 1; await telCta('whatsapp', s, 'g', test);
  return { url: waLink(code, taal), x: WAKAART[taal] || WAKAART.en, label: ctaTekst('whatsapp', s) };
}
// Meteen WhatsApp in (Henkjan 12 nov 18:32 UTC: "heel chatten op web overslaan en meteen whatsapp in sturen met een berichtje wat triggert en WAM
// antwoord meteen. A/B test doen? Dus 1 klik whatsapp in met lerende CTA"): bij betaald verkeer krijgt de helft (WAM_WA_AANDEEL, standaard 0.5) een
// pagina zonder webchat: de opener met knoppen die WhatsApp openen met het antwoord al ingevuld plus "(WAM code XXXXXX)", en één groene knop
// (lerende tekst, CTA wastart). WAM antwoordt in WhatsApp meteen op dat antwoord, in een WhatsApp-sessie die de context van de klik meekrijgt
// (Clickmind, campagne, opener, peiling), zodat echt en dialoog ook voor deze arm naar het netwerk gaan. Telling per arm in wam:start
// (getoond g, WhatsApp-tik k, eerste WhatsApp-bericht l, echt e, dialoog d). Hoogstens WAM_WA_START_MAX (standaard 240 sinds 12 nov 19:55 UTC, zodat de nieuwe varianten vandaag nog hun eerste blokken van 10 krijgen) WhatsApp-starts per dag.
// WhatsApp-start ontleed (Henkjan 12 nov 19:47 UTC: "Zoek uit waarom niemand via whatsapp in gesprek gaat"): per WhatsApp-arm-bezoek van een dag
// app, OS, land, opener, in beeld, tik, terug op de pagina na de tik (dus niet verstuurd) en aangekomen in WhatsApp
export async function waFunnel(d) {
  const ids = (await kv.raw(['LRANGE', 'wam:sessies:' + (d || dag()), '0', '-1']).catch(() => [])) || [], uit = { n: 0, seg: {}, lijst: [] };
  const alle = []; for (let i = 0; i < ids.length; i += 40) alle.push(...await Promise.all(ids.slice(i, i + 40).map(id => sessie(id).catch(() => null))));
  for (const s of alle) {
    if (!s || s.start !== 'wa') continue; const ev = s.ev || {}, c = s.ctx || {}; const p = await profiel(s.vid).catch(() => null);
    const r = { app: c.app || (c.mobiel ? 'browser' : 'desktop'), os: c.os || '', land: c.land || '', opener: s.opener, zicht: !!ev.zicht1, tik: N(ev.wa_start), terug: N(ev.terug), weg: N(ev.weg) + N(ev.verborgen), aan: !!(s.waL || (p && p.contact && p.contact.wa)) };
    uit.n++; uit.lijst.push(r);
    for (const k of ['app:' + r.app, 'os:' + r.os, 'land:' + r.land, 'opener:' + r.opener]) { const o = uit.seg[k] = uit.seg[k] || { n: 0, zicht: 0, tik: 0, terug_na_tik: 0, aan: 0 }; o.n++; if (r.zicht) o.zicht++; if (r.tik) o.tik++; if (r.tik && r.terug) o.terug_na_tik++; if (r.aan) o.aan++; }
  }
  uit.lijst = uit.lijst.filter(r => r.tik).slice(-40); return uit;
}
export async function startStand() { const h = await hget('wam:start').catch(() => ({})); const o = {}; for (const [k, n] of Object.entries(h)) { const [d, arm, f] = k.split('|'); if (d !== dag()) continue; ((o[arm] = o[arm] || {})[f] = N(n)); } return o; }
async function telStart(arm, veld, test) { if (test || !arm) return; await kv.raw(['HINCRBY', 'wam:start', dag() + '|' + arm + '|' + veld, '1']).catch(() => {}); kv.raw(['EXPIRE', 'wam:start', String(14 * 86400)]).catch(() => {}); }
async function kiesStart(ctx, params, terug, ref) {
  if (ctx.startTest === 'web' || ctx.startTest === 'wa') return ctx.startTest;
  if (!params.n || terug || ref || !WA.nr || process.env.WAM_WA_START === 'uit') return 'web';
  const n = N(await kv.raw(['HGET', 'wam:start', dag() + '|wa|g']).catch(() => 0)); if (n >= Math.max(0, Number(process.env.WAM_WA_START_MAX || 240))) return 'web';
  // WhatsApp-eerst vooral waar iedereen WhatsApp heeft (Henkjan 12 nov 19:57 UTC: "Beste is dan ook web blijven optimaliseren en alert functie voor match opties te bieden"):
  // NL, BE, DE en Colombia de helft, Canada en de VS 20% zodat de varianten nog leren (12 nov: 160 getoond, 33 tikken, 0 aangekomen)
  const wl = String(ctx.land || '').toUpperCase(), aandeel = process.env.WAM_WA_AANDEEL ? Number(process.env.WAM_WA_AANDEEL) : (['NL', 'BE', 'DE', 'CO', 'IN', 'GB'].includes(wl) ? 0.5 : 0.2);
  return Math.random() < Math.min(1, Math.max(0, aandeel)) ? 'wa' : 'web';
}
// één regel over een zoektocht of aanbod, voor de kaart, de deellink en de vriend-opener
export function itemZin(it) { if (!it) return ''; return kort([String(it.wat || '').trim() + (it.waar && !VAAG_WAAR.test(String(it.waar)) ? ' in ' + it.waar : ''), it.eisen || it.budget ? lcEerst(it.eisen || it.budget) : '', it.wanneer ? lcEerst(it.wanneer) : ''].filter(Boolean).join(', '), 140); }
const PN = { en: 'Not a fit', nl: 'Past niet' }, PNQ = { en: 'What is off? Then I ask just that and look again.', nl: 'Wat klopt er niet? Dan vraag ik precies dat en zoek ik opnieuw.' }, PNK = { en: ['The place', 'The price', 'The timing', 'Something else'], nl: ['De plek', 'De prijs', 'Het moment', 'Iets anders'] };
const raNorm = t => String(t || '').toLowerCase().replace(/[’']/g, "'").replace(/[.!?]+$/, '').trim();
function regelAntwoord(tekst, s, metMail, heeftMail) {
  const taal = RA[s.ctx && s.ctx.taal] ? s.ctx.taal : (s.ctx && s.ctx.taal && s.ctx.taal !== 'en' ? null : 'en'); if (!taal) return null;
  const L = Object.assign({}, RA[taal], RA2[taal]), T = RA[taal].t, T2 = RA2[taal], c = (s.ctx && s.ctx.stad) || (taal === 'nl' ? 'jou' : 'you');
  const ruw = String(tekst || '').trim(), t = raNorm(tekst), in_ = (lijst) => (lijst || []).some(v => raNorm(v) === t), vorige = s.ra || '';
  s.raK = s.raK || {};
  const uit = (stap, x, k, extra) => { s.ra = stap; if (RA_ROOT[stap]) s.raRoot = stap; return Object.assign({ x, k: k || [] }, extra || {}); };
  const verder = (root) => L.ASK.filter((a, i) => !((i === 0 && ['kamer', 'plek', 'verhuur'].includes(root)) || (i === 1 && ['werk', 'huur'].includes(root)) || (i === 3 && root === 'mensen'))).slice(0, 3);
  const c0 = (s.ctx && s.ctx.stad) || '', Q = RA3[taal];
  const vraagVoor = (veld, it) => {
    const kw = it.kant + '|' + it.soort;
    if (veld === 'extra') return [(SCHERP[taal] || SCHERP.en)[it.kant + '|' + it.soort] || (SCHERP[taal] || SCHERP.en)['zoekt|iets'], [Q.skip]];
    if (veld === 'foto') return [(FOTOV[taal] || FOTOV.en)(it.kant + '|' + it.soort), [Q.skip]];
    if (veld === 'waar') return [Q.waar(c0) + (s.ctx && s.ctx.kanaal === 'whatsapp' ? (taal === 'nl' ? ' Of stuur je locatie 📎. Anoniem: alleen ik zie hem en ik bewaar alleen de wijk, nooit je adres.' : ' Or send your location 📎. Anonymous: only I see it and I keep just the neighbourhood, never your address.') : ''), c0 ? [Q.overal(c0), Q.skip] : [Q.skip]];
    if (veld === 'budget') return [Q.budget[kw] || Q.budget['zoekt|iets'], kw === 'zoekt|woning' ? (RA_KAMER.test(it.wat || '') ? L.RB : L.PB) : (Q.bk[kw] || [])];
    if (veld === 'wanneer') return it.soort === 'woning' ? [Q.wanneer[kw] || Q.wanneer['zoekt|woning'], kw === 'zoekt|woning' ? L.T : Q.wk['biedt|woning']] : [Q.wanneer.dienst, Q.wk.dienst];
    const lijst = { 'zoekt|baan': L.W, 'biedt|baan': L.H, 'zoekt|dienst': L.HL, 'biedt|dienst': L.DI, 'zoekt|iets': L.KOOP, 'biedt|iets': L.VK, 'zoekt|iemand': L.PE }[kw];
    return [Q.wat(it.kant), it.watVrij ? [] : (lijst || [])];
  };
  const maakItem = (it, start) => {
    let wat = kort(it.root && T2.wat[it.root] ? T2.wat[it.root](it.watKeuze || '') : (it.wat || ''), 100); wat = wat.charAt(0).toUpperCase() + wat.slice(1);
    const zin = itemZin({ wat, waar: it.waar, budget: it.budget, wanneer: it.wanneer });
    const root = it.root || ''; s.raRoot = ''; s.raK = {}; s.raItem = null; s.raVeld = '';
    if (!heeftMail && !s.alertG && s.alertO) { s.alertG = 1; const AL = LEER.ALERT_L[taal] || LEER.ALERT_L.en; return uit('alert', alvTekst(s, taal, zin), s.alertO.map(k => AL[k]), Object.assign({ alertVraag: 1, zin, maak: { kant: it.kant, soort: it.soort, wat, eisen: it.budget || '', waar: it.waar || '', wanneer: it.wanneer || '', vrij: !!it.vrij, ...(it.eff ? { vb: { kw: it.kant + '|' + it.soort, a: it.eff } } : {}) } }, start ? { diepteStart: true } : {})); }
    return uit('gemaakt', T2.gemaakt(zin, heeftMail), verder(root), Object.assign({ maak: { kant: it.kant, soort: it.soort, wat, eisen: it.budget || '', waar: it.waar || '', wanneer: it.wanneer || '', extra: it.extra || '', foto: it.foto || '', vrij: !!it.vrij, ...(it.eff ? { vb: { kw: it.kant + '|' + it.soort, a: Object.fromEntries(Object.entries(it.eff).filter(([f]) => f !== 'extra' && f !== 'foto')) } } : {}) }, nogmeer: true }, start ? { diepteStart: true } : {}));
  };
  // minste info voor een goede match (Henkjan 12 nov 19:11 UTC: "zeer lerend"): per soort en per vraag kiest s.vb (lib/wam-leer.js) vragen of
  // overslaan en de volgorde; wat al bekend is telt niet mee (k). Zonder s.vb de oude diepte d1-d3.
  const trechter = (it) => {
    const wa = s.ctx && s.ctx.kanaal === 'whatsapp';
    s.raItem = it; const kw = it.kant + '|' + it.soort, ess = [...(RA_ESS[kw] || ['wat', 'waar']), ...(wa ? ['extra', ...(FOTO_KW.has(kw) ? ['foto'] : [])] : [])], n = { d1: 1, d2: 2, d3: 3 }[s.raD] || 2, vb = wa ? null : s.vb && s.vb[kw];
    const heeft = f => (it.skip || []).includes(f) || (f === 'wat' ? !!(it.wat && !GENERIEK.test(String(it.wat).trim())) : !!it[f]);
    const start = !it.gestart; it.gestart = 1;
    if (start && wa && s.fotoNu && !it.foto) { it.foto = s.fotoNu; s.fotoNu = ''; }
    if (start) { it.eff = {}; for (const f of ess) it.eff[f] = heeft(f) ? 'k' : wa ? 'v' : vb ? (vb[f] === 's' && !(f === 'wat' && !heeft('wat')) && !(it.vraagOok || []).includes(f) ? 's' : 'v') : (ess.slice(0, n).includes(f) ? 'v' : 's'); if (vb) s.vbEv = [...(s.vbEv || []), ...ess.filter(f => it.eff[f] !== 'k').map(f => [kw, f, it.eff[f], 'g'])]; }
    const volg = vb && vb._o ? vb._o.filter(f => ess.includes(f)) : ess, eff = Object.assign({}, it.eff || {}); for (const f of ess) if (!(f in eff)) eff[f] = wa ? 'v' : 's';
    const mist = volg.filter(f => (eff[f] === 'v' || (it.vraagOok || []).includes(f)) && !heeft(f));
    if (mist.length) { const [x, k] = vraagVoor(mist[0], it); s.raVeld = mist[0]; if (vb) s.vbEv = [...(s.vbEv || []), [kw, mist[0], 'v', 'q']]; return uit('detail', x, k, start ? { diepteStart: true } : {}); }
    return maakItem(it, start);
  };
  const rootItem = (root, keuze, vrij) => { const [kant, soort] = RA_ROOT[root]; const vast = ['kamer', 'plek'].includes(root); return { kant, soort, root, wat: vast ? T2.wat[root]('') : (keuze || ''), watKeuze: keuze || '', vrij: !!vrij, ...(!vast && !keuze ? { watVrij: 1 } : {}) }; };
  const maak = (root, keuze, vrij) => trechter(rootItem(root, keuze, vrij));
  const anders = /^(something else|iets anders|other|anders)$/.test(t);
  // na een vraag over anderen: ja = dezelfde wens als eigen zoektocht of aanbod, nee = tip en verder
  if (s.anderWens && ANDER_X[taal]) { if (t === raNorm(ANDER_X[taal].knop[0])) { const w = s.anderWens; s.anderWens = ''; return regelAntwoord(w, s, metMail, heeftMail); } if (t === raNorm(ANDER_X[taal].knop[1])) { s.anderWens = ''; return uit('vraag', ANDER_X[taal].tip, L.ASK); } }
  // past niet (de leerbron voor een goede match): wat klopt er niet, dan precies die vraag stellen en opnieuw zoeken zonder deze kandidaat
  const PNt = PN[taal] || PN.en, PNk = PNK[taal] || PNK.en;
  if (s.matchKand && !s.matchVerbonden && raNorm(PNt) === t) return uit('pastniet', (PNQ[taal] || PNQ.en), PNk, { pastNiet: 1 });
  if (vorige === 'pastniet' && s.matchKand && t.length <= 80 && !RA_VRAAG.test(ruw)) {
    const i = PNk.findIndex(k => raNorm(k) === t);
    const veld = i >= 0 ? ['waar', 'budget', 'wanneer', 'wat'][i] : /\b(price|expensive|cheap|budget|cost|money|prijs|duur|goedkoop|geld)\b/.test(t) ? 'budget' : /\b(far|place|area|location|city|distance|ver|plek|wijk|stad|buurt|afstand)\b/.test(t) ? 'waar' : /\b(time|date|when|soon|later|moment|datum|wanneer|tijd)\b/.test(t) ? 'wanneer' : 'wat';
    const e = s.matchKand.eigen || {}, pn = { k: e.k, veld };
    s.pnNiet = [...(s.pnNiet || []), s.matchKand.ander && s.matchKand.ander.k].filter(Boolean).slice(-10); s.matchKand = null; s.matchGemeld = 0;
    const it = { kant: e.kant || 'zoekt', soort: e.soort || 'iets', wat: veld === 'wat' ? '' : (e.wat || ''), budget: veld === 'budget' ? '' : (e.eisen || ''), waar: veld === 'waar' ? '' : (e.waar || ''), wanneer: veld === 'wanneer' ? '' : (e.wanneer || ''), vraagOok: [veld], watVrij: 1 };
    return Object.assign(trechter(it), { pastNietReden: pn });
  }
  if (vorige === 'alert') { const kz = LEER.alertKanaal(ruw); if (kz) return uit('alertk', '', verder(''), { alertKeuze: kz }); }
  if (metMail) return uit('mail', T.mail().replace(/ (Anything else you're looking for meanwhile\?|Zoek je ondertussen nog iets anders\?)$/, ' ' + T2.nogmeer()), L.ASK, { nogmeer: true });
  if (/(\+?\d[\d\s().-]{7,}\d)/.test(t) && t.replace(/\D/g, '').length >= 8) return uit('tel', T.tel(), []);
  if (t.length > 120 || /https?:|www\./.test(t)) return null;
  if (RA_STOP.includes(vorige) && RA_NEE.test(t)) return uit('klaar', T2.klaar(heeftMail), [], { klaar: true });
  // antwoord op een detailvraag (budget, waar, wanneer, wat)
  if (vorige === 'detail' && s.raItem && s.raVeld) {
    const it = s.raItem, v = s.raVeld;
    if (RA_NEE.test(t) || /^(skip|overslaan|doesn't matter|maakt niet uit|no idea|weet ik niet|not sure)$/.test(t)) { it.skip = [...(it.skip || []), v]; return trechter(it); }
    if (RA_VRAAG.test(ruw) || t.length > 80) return null;
    if (s.vb && v !== 'extra' && v !== 'foto') s.vbEv = [...(s.vbEv || []), [it.kant + '|' + it.soort, v, 'v', 'b']];
    if (v === 'foto') { if (s.fotoNu) { it.foto = s.fotoNu; s.fotoNu = ''; } else { it.extra = [it.extra, ruw].filter(Boolean).join('; '); it.skip = [...(it.skip || []), 'foto']; } return trechter(it); }
    if (v === 'waar') { const m1 = ruw.match(/^(?:anywhere in|overal in)\s+(.+)$/i); it.waar = m1 ? m1[1] : (/^(anywhere|overal|nearby|near me|in de buurt|in my area)$/.test(t) ? c0 : ruw); if (!it.waar) it.skip = [...(it.skip || []), 'waar']; }
    else if (v === 'wat') { if (anders) { it.watVrij = 1; return uit('detail', vraagVoor('wat', it)[0], []); } it.wat = ruw; it.watKeuze = ruw; }
    else it[v] = ruw;
    return trechter(it);
  }
  // antwoord op de vraag van een pad (knop of getypt): budget, wanneer, of meteen maken
  if (RA_ROOT[vorige]) {
    if (vorige === 'kamer' || vorige === 'plek') { if (in_(vorige === 'kamer' ? L.RB : L.PB) || (/\d/.test(t) && t.length <= 40)) return trechter(Object.assign(rootItem(vorige, ''), { budget: ruw })); }
    else if (in_(L[RA_LIJST[vorige]])) return maak(vorige, anders ? '' : ruw);
    else if (anders) return maak(vorige, '');
  }
  if (vorige === 'wanneer' && s.raRoot && (in_(L.T) || (t.length <= 40 && !RA_VRAAG.test(ruw)))) return trechter(Object.assign(rootItem(s.raRoot, ''), { budget: s.raK[s.raRoot] || '', wanneer: ruw }));
  if (vorige === 'provider' && (in_(L.PR) || (t.length <= 30 && t.split(/\s+/).length <= 3 && !RA_VRAAG.test(ruw)))) { if (anders) return uit('provider', T2.welke(), []); s.raK.provider = ruw; return uit('bug', T.bug(ruw), L.BUG); }
  if (['bug', 'bank', 'energie'].includes(vorige) && (in_(L.BUG) || in_(L.BK) || in_(L.EN) || (t.length <= 120 && !RA_VRAAG.test(ruw)))) { const g = s.raK.provider || ''; s.raK = {}; s.raRoot = ''; return uit('groep', T.groep() + ' ' + T2.nogmeer(), L.ASK.slice(0, 3), { groep: g || undefined, nogmeer: true }); }
  if (in_(L.BUG) || in_(L.BK) || in_(L.EN.slice(0, 3))) return uit('groep', T.groep() + ' ' + T2.nogmeer(), L.ASK.slice(0, 3), { nogmeer: true });
  if (in_(L.T) || /^(licence and car|licence only|no licence|prefer warehouse)$/.test(t)) return uit('contact', T.contact(), []);
  const R = [
    [/^(work|i'm looking for work|looking for work|i need work|i need a job|a job|job|work or gigs|side gigs|a better paid job|werk|ik zoek werk|werk of klussen|klussen ernaast|beter betaalde baan|een baan)$/, () => uit('werk', T.werk(c), L.W)],
    [/^(i'm hiring|hiring|i need staff|ik zoek personeel|personeel)$/, () => uit('huur', T.huur(c), L.H)],
    [/^(a room|i'm looking for a room|looking for a room|i need a room|een kamer|ik zoek een kamer)$/, () => uit('kamer', T.kamer(c), L.RB)],
    [/^(looking for a place|a place to live|i'm looking for a place|a rental|ik zoek een huis|een woning|ik zoek een woning|huurhuis|een huurhuis|huurwoning)$/, () => uit('plek', T.plek(c), L.PB)],
    [/^(i rent something out|i have a room to rent|renting out|ik verhuur iets|iets verhuren|ik heb een kamer)$/, () => uit('verhuur', T.verhuur(c), L.R)],
    [/^(i fix or build things|repairs|ik repareer of bouw dingen)$/, () => uit('fix', T.fix(c), L.F)],
    [/^(i offer a service|ik bied een dienst)$/, () => uit('dienst', T2.dienst(c), L.DI)],
    [/^(someone to help|i need help|i need a service|i need someone|iemand om te helpen|ik zoek hulp)$/, () => uit('hulp', T.hulp(), L.HL)],
    [/^(i cook or bake|ik kook of bak)$/, () => uit('kok', T.kok(c), L.CK)],
    [/^(i teach or coach|ik geef les of coach)$/, () => uit('leraar', T.leraar(c), L.TC)],
    [/^(phone or internet|telefoon of internet)$/, () => uit('provider', T.provider(), L.PR)],
    [/^(rogers|bell|telus|freedom|fido|koodo|kpn|odido|ziggo|vodafone)$/, () => { s.raK.provider = ruw; return uit('bug', T.bug(ruw), L.BUG); }],
    [/^(bank or insurer|bank of verzekeraar)$/, () => uit('bank', T.bank(), L.BK)],
    [/^(energy|energie)$/, () => uit('energie', T.energie(), L.EN)],
    [/^(more money|meer geld)$/, () => uit('geld', T.geld(c), L.M)],
    [/^(selling things|selling items|spullen verkopen|i have something to sell|ik verkoop iets)$/, () => uit('verkoop', T2.verkoop(c), L.VK)],
    [/^(i want to buy something|ik wil iets kopen|something to buy|iets kopen)$/, () => uit('koop', T2.koop(c), L.KOOP)],
    [/^(a better deal|een betere deal)$/, () => uit('deal', T.deal(), L.DL)],
    [/^(people to meet|mensen ontmoeten)$/, () => uit('mensen', T.mensen(c), L.PE)],
    [/^(something else|iets anders)$/, () => uit('anders', T.anders(c), L.ASK)],
    [/^(ask me something|vraag me iets|just browsing|ik kijk alleen|happy where i am|ik woon prima)$/, () => uit('vraag', T.vraag(c), L.ASK)],
    [/^(coffee|tea|energy drink|just water|koffie|thee|water)$/, () => uit('drank', T.drank(), L.ASK)]
  ];
  for (const [re, f] of R) if (re.test(t)) return f();
  // een lijstknop uit een eerdere stap (12 nov: 'Moving or a ride' belandde in de handmatige wachtrij): meteen het juiste pad
  if (!anders) for (const [root, lk] of Object.entries(RA_LIJST)) if (in_(L[lk])) return maak(root, ruw);
  // getypt antwoord op de vraag van een pad ("What kind of work?" -> "cleaning"): meteen maken
  const woorden = t.split(/\s+/).length;
  if (RA_ROOT[vorige] && !['kamer', 'plek'].includes(vorige) && t.length <= 80 && woorden <= 10 && !RA_VRAAG.test(ruw) && !RA_GROET.test(t)) return maak(vorige, ruw.replace(/[.!]+$/, ''), true);
  // vrije tekst met een wens of aanbod, of na "wat wil je nog meer": meteen een zoektocht of aanbod
  const hire = RA_HIRE.test(t), bied = !hire && RA_BIED.test(t), wil = !hire && !bied && RA_WIL.test(t);
  if ((hire || bied || wil || RA_STOP.includes(vorige)) && t.length <= 100 && woorden <= 12 && !RA_VRAAG.test(ruw) && !RA_GROET.test(t) && !RA_NEE.test(t)) {
    const ruwN = ruw.replace(/[’']/g, "'"); let w = ruwN.replace(/[.!]+$/, '').replace(new RegExp(RA_HIRE.source, 'i'), '').replace(RA_PRE, '').trim(); if (hire) w = w.replace(/^(an?|een)\s+/i, ''); if (w.length < 2 || GENERIEK.test(w)) return null;
    w = w.charAt(0).toUpperCase() + w.slice(1);
    const kant = hire || bied ? 'biedt' : 'zoekt';
    const soort = hire || MS_BAAN.test(w) ? 'baan' : RA_DIENST.test(w) ? 'dienst' : MS_WONING.test(w) ? 'woning' : (kant === 'zoekt' && RA_IEMAND.test(w)) ? 'iemand' : 'iets';
    const bedrag = (w.match(RA_BEDRAG) || [])[0], wanneer = (w.match(RA_WANNEER) || [])[0], plek = (ruwN.match(RA_PLEK) || [])[1] || (c0 && mplaats(ruw).includes(mplaats(c0)) ? c0 : '');
    let kaal = w; for (const x of [bedrag, wanneer, plek && 'in ' + plek, plek && 'near ' + plek]) if (x) kaal = kaal.replace(x, ' '); kaal = kaal.replace(/\s+/g, ' ').replace(/[ ,]+$/, '').replace(/\s+(for|at|around|about|under|max|voor|tegen|rond|onder)$/i, '').trim(); if (kaal.length < 2) kaal = w;
    const wat = kort(hire ? T2.wat.huur(kaal) : kaal.charAt(0).toUpperCase() + kaal.slice(1), 100);
    s.raRoot = ''; s.raK = {};
    return trechter({ kant, soort, root: '', wat, budget: bedrag && /\d{2,}/.test(bedrag) ? bedrag.trim() : '', wanneer: wanneer || '', waar: plek || '', vrij: true });
  }
  return null;
}
const cqMaskeer = t => String(t || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[mail]').replace(/\+?\d[\d\s().-]{7,}\d/g, '[nummer]');
export async function cqLijst(kortVorm = false) {
  await kv.raw(['ZREMRANGEBYSCORE', 'wam:cq', '0', String(Date.now() - 3 * 3600000)]).catch(() => {});
  const l = await kv.raw(['ZRANGE', 'wam:cq', '0', '-1', 'WITHSCORES']).catch(() => []) || []; const wacht = [];
  for (let i = 0; i + 1 < l.length; i += 2) {
    const s = await sessie(l[i]); if (!s) { await kv.raw(['ZREM', 'wam:cq', l[i]]).catch(() => {}); continue; }
    wacht.push({ sid: s.sid, min: Math.round((Date.now() - N(l[i + 1])) / 60000), taal: s.ctx && s.ctx.taal, land: s.ctx && s.ctx.land, stad: s.ctx && s.ctx.stad, kanaal: (s.ctx && s.ctx.kanaal) || 'web', test: !!(s.ctx && s.ctx.test), hook: s.hook, eigen: s.eigen || undefined, berichten: (s.berichten || []).slice(-10).map(b => ({ r: b.r, x: cqMaskeer(kort(b.x, 400)), k: b.k && b.k.length ? b.k : undefined })) });
  }
  if (kortVorm) return { ok: true, aantal: wacht.length, plafond: PLAFOND, kost: Math.round((await kostVandaag()) * 100) / 100, wacht: wacht.map(w => ({ sid: w.sid, min: w.min, taal: w.taal, stad: w.stad, u: (w.berichten || []).filter(b => b.r === 'u').slice(-3).map(b => String(b.x).slice(0, 90)), b: String(((w.berichten || []).filter(b => b.r === 'b').slice(-1)[0] || {}).x || '').slice(0, 90) })) };
  return { ok: true, aantal: wacht.length, plafond: PLAFOND, kost: Math.round(await kostVandaag() * 100) / 100, wacht };
}
export async function cqAntw({ sid, x, k }) {
  const s = await sessie(sid); x = String(x || '').trim().slice(0, 900); if (!s || !x) return { ok: false };
  let kn = []; try { kn = (Array.isArray(k) ? k : JSON.parse(k || '[]')).map(v => kort(String(v), 40)).filter(Boolean).slice(0, 4); } catch (e) {}
  await kv.raw(['ZREM', 'wam:cq', s.sid]).catch(() => {});
  const kanaal = (s.ctx && s.ctx.kanaal) || 'web';
  await inboxIn(s.vid, { soort: 'tekst', x, k: kn });
  const s2 = (await sessie(sid)) || s; s2.peilNu = null; s2.cqKlaar = Date.now();
  if (kanaal !== 'web') { s2.berichten.push({ r: 'b', t: Date.now(), x, k: kn, claude: true }); await kv.raw(['DEL', 'wam:inbox:' + s.vid]).catch(() => {}); }
  await bewaarSessie(s2); await tel({ cq_antw: 1 }, dag(), !!(s.ctx && s.ctx.test));
  return { ok: true, kanaal };
}
const MAILNU = {
  en: ['Got it, that works too. I\'ll email you as soon as there\'s news, and you can reply straight from your mail.', 'Got it, I\'ll email you when they reply. Now write them a short message in your own words (no links).'],
  nl: ['Top, dat kan ook. Ik mail je zodra er nieuws is, en je kunt gewoon vanuit je mail antwoorden.', 'Genoteerd, ik mail je zodra ze antwoorden. Schrijf ze nu een kort berichtje in je eigen woorden (zonder links).'],
  de: ['Super, das geht auch. Ich schreibe dir, sobald es Neuigkeiten gibt, und du kannst direkt per Mail antworten.', 'Notiert, ich schreibe dir, sobald sie antworten. Schreib ihnen jetzt eine kurze Nachricht in deinen Worten (ohne Links).'] };
async function inboxIn(vid, item) {
  if (!vid || (item && item.van && await LEER.geblokt(item.van))) return false; await kv.raw(['RPUSH', 'wam:inbox:' + vid, JSON.stringify(Object.assign({ t: Date.now() }, item))]).catch(() => {}); kv.raw(['EXPIRE', 'wam:inbox:' + vid, String(30 * 86400)]).catch(() => {});
  // heeft de ander Telegram of WhatsApp gekoppeld, dan komt het daar ook meteen binnen, en wat hij daar typt gaat terug naar de afzender
  let ok = false;
  try {
    const pp = await profiel(vid); const taal = (pp && pp.taal) || 'en', r = itemTekst(item, taal); if (!r) return false;
    const chatId = pp && pp.contact && pp.contact.tg;
    if (chatId && process.env.WAM_TG_TOKEN) {
      await tgStuur(chatId, r.x + (item.van ? '\n\n' + mt(taal).tgAntw : ''));
      if (item.van) { const ts = await tgSessie(String(chatId), vid, pp); ts.schrijf = { mp: item.mp, naar: item.van }; ts.antwoordOp = { mp: item.mp, naar: item.van }; await bewaarSessie(ts); }
      await tel({ inbox_tg: 1 }).catch(() => {}); ok = true;
    }
    const wie = pp && pp.contact && !pp.contact.stop && pp.contact.wa;
    if (wie) {
      await waStuur(wie, r.x + (item.van ? '\n\n' + mt(taal).tgAntw : ''));
      if (item.van) { const ws = await waSessie(wie, vid, pp); ws.schrijf = { mp: item.mp, naar: item.van }; ws.antwoordOp = { mp: item.mp, naar: item.van }; await bewaarSessie(ws); }
      await tel({ inbox_wa: 1 }).catch(() => {}); ok = true;
    }
    // ook per mail (Henkjan 11 nov 19:50 UTC): wie alleen een e-mailadres achterliet krijgt berichten en matches in zijn mail, hoogstens eens per 30 minuten, en kan per mail antwoorden
    const mail = pp && pp.contact && pp.contact.mail;
    if (mail && !ok && !pp.contact.stop && ['bericht', 'kans', 'nummer', 'tekst', 'wacht'].includes(item.soort) && (await POST.mailKlaar().catch(() => false))) {
      const vrij = await kv.raw(['SET', 'wam:inmail:' + vid, '1', 'NX', 'EX', '1800']).catch(() => null);
      if (vrij) {
        const l = await postLinks(vid); const knop = { nl: 'Open de chat', de: 'Chat öffnen' }[taal] || 'Open the chat';
        const onderwerp = { nl: 'WAM: er is nieuws voor je', de: 'WAM: es gibt Neuigkeiten für dich' }[taal] || 'WAM: there is news for you';
        await POST.stuurMail({ to: mail, subject: onderwerp, html: POST.mailHtml({ taal, tekst: r.x, knop, ...l }), text: POST.mailTekst({ taal, tekst: r.x, knop, ...l }) });
        await tel({ inbox_mail: 1 }).catch(() => {});
      }
      ok = true; // wie mail achterliet krijgt hoogstens eens per 30 minuten een mail, maar is wel bereikbaar
    }
  } catch (e) {}
  return ok;
}
function itemTekst(it, taal) {
  const T = mt(taal), NR = MNR[taal] || MNR.en, AW = MANTW[taal] || MANTW.en, NE = MNEE[taal] || MNEE.en;
  if (it.soort === 'tekst') return { x: String(it.x || ''), k: Array.isArray(it.k) ? it.k : [] };
  if (it.soort === 'bericht') return { x: T.van(it.stad, it.kant, kort(it.wat, 60)) + '\n"' + it.x + '"', k: [AW, NR, NE] };
  if (it.soort === 'wacht') return { x: T.wacht(it.stad, it.kant, kort(it.wat, 60)), k: [AW, NE] };
  if (it.soort === 'kans') return { x: T.kans(it.stad, it.kant, kort(it.wat, 60)), k: [AW, NR, NE] };
  if (it.soort === 'nrvraag') return { x: T.nrv, k: [NR, NE] };
  if (it.soort === 'nummer') return { x: T.nummer(String(it.nr || '')), k: [] };
  return null;
}
async function tgSessie(chatId, vid, p) {
  if (vid) kv.raw(['SADD', 'wam:dvset', vid]).catch(() => {});
  const sid = createHash('sha256').update('tg|' + chatId).digest('hex').slice(0, 16);
  let s = await sessie(sid);
  if (!s) { s = { sid, vid, t0: Date.now(), ctx: { taal: (p && p.taal) || 'en', land: p && p.land, kanaal: 'telegram' }, params: {}, hook: '', opener: 'telegram', berichten: [], beurten: 0, echt: true, contactGevraagd: 2, zoek: 0, ev: {} }; await bewaarSessie(s); }
  return s;
}
// Delen, lerend (Henkjan 12 nov 16:54 UTC: "geef ze een link zodat WAM ook voor ze kan zoeken of dat jij ze ook kunt vinden in WAM etc maak dit
// heel goede UX en CTA en heelemaaal lerend dat je ze in de dialoog wam laat verspreiden"). Eén deelkaart per gesprek, met een eigen link
// (wearemany.now/?r=<code>&d=<variant>-<moment>, bij 'vraag' ook &z=<zoektocht>). Lerend in wam:deel: welke tekst (variant) en welk moment
// (na iets maken, na een match, na een peiling; 10% krijgt geen kaart als controle). Beloning: tik op delen 1, vriend echt binnen 3, vriend in
// dialoog 6. Wie via een link komt krijgt een eigen opener; bij 'vraag' ziet de vriend wat de ander zoekt of biedt en kan met één tik reageren.
const DEEL = [
  { id: 'vriend', x: { en: 'Know someone who needs something, or offers it? Send them your link: WAM looks for them too. Free and anonymous.', nl: 'Ken je iemand die iets zoekt of aanbiedt? Stuur je link: WAM zoekt ook voor hen. Gratis en anoniem.' },
    m: { en: 'I use WAM: tell it what you need or offer and it finds people near you who match. Anonymous, free. Try it:', nl: 'Ik gebruik WAM: zeg wat je zoekt of aanbiedt en het vindt mensen bij jou in de buurt die passen. Anoniem en gratis. Probeer het:' } },
  { id: 'vind', x: { en: 'Want your friends in here too? Send them your link. When they join, WAM can match you with each other and with what they need.', nl: 'Wil je je vrienden hier ook? Stuur ze je link. Als ze meedoen, koppelt WAM jullie aan elkaar en aan wat zij zoeken.' },
    m: { en: 'Join me on WAM: say what you need or offer and it finds the right people. Anonymous until you both say yes:', nl: 'Doe mee op WAM: zeg wat je zoekt of biedt en het vindt de juiste mensen. Anoniem tot jullie allebei ja zeggen:' } },
  { id: 'veel', x: { en: 'We are many: the more people near you join, the faster I find your match. Bring one friend?', nl: 'We are many: hoe meer mensen bij jou in de buurt meedoen, hoe sneller ik je match vind. Neem je één vriend mee?' },
    m: { en: 'Help me find a match on WAM: the more people join, the better it works. Say what you need or offer, it takes 1 minute:', nl: 'Help me aan een match op WAM: hoe meer mensen meedoen, hoe beter het werkt. Zeg wat je zoekt of biedt, het kost 1 minuut:' } },
  { id: 'vraag', eigen: true, x: { en: k => k === 'biedt' ? 'Tell your friends too: send them what you offer. Whoever needs it can answer you right here, anonymously.' : 'Ask your friends too: send them what you are looking for. Whoever has it or knows someone can answer you right here, anonymously.', nl: k => k === 'biedt' ? 'Vertel het ook je vrienden: stuur ze wat je aanbiedt. Wie het zoekt, kan je hier anoniem antwoorden.' : 'Vraag het ook je vrienden: stuur ze wat je zoekt. Wie het heeft of iemand kent, kan je hier anoniem antwoorden.' },
    m: { en: (k, w) => k === 'biedt' ? 'Anyone need this? I\'m offering "' + w + '". Answer me anonymously on WAM, or put in what you need yourself:' : 'Can you help? I\'m looking for "' + w + '". Answer me anonymously on WAM, or put in what you need yourself:', nl: (k, w) => k === 'biedt' ? 'Iemand interesse? Ik bied "' + w + '" aan. Reageer anoniem op WAM, of zet erin wat jij zelf zoekt:' : 'Kun jij helpen? Ik zoek "' + w + '". Antwoord me anoniem op WAM, of zet erin wat jij zelf zoekt:' } }
];
const DEEL_DOOR = { en: (k, w) => k === 'biedt' ? 'A friend of mine offers "' + w + '". Interested? Answer anonymously on WAM:' : 'A friend of mine is looking for "' + w + '". Can you help? Answer anonymously on WAM:', nl: (k, w) => k === 'biedt' ? 'Een vriend van me biedt "' + w + '" aan. Interesse? Reageer anoniem op WAM:' : 'Een vriend van me zoekt "' + w + '". Kun jij helpen? Antwoord anoniem op WAM:' };
const REF_MELD = { en: 'Someone you invited is now talking with WAM. Every person near you makes your match more likely. Thank you!', nl: 'Iemand die jij uitnodigde praat nu met WAM. Elke persoon bij jou in de buurt maakt je match waarschijnlijker. Dank je!' };
const DEEL_MOMENT = ['maak', 'match', 'peil', 'geen'];
const DEEL_UI = { en: { wa: 'Send on WhatsApp', deel: 'Share', kop: 'Copy link', klaar: 'Copied' }, nl: { wa: 'Stuur via WhatsApp', deel: 'Delen', kop: 'Kopieer link', klaar: 'Gekopieerd' } };
async function refCode(vid) { const c = createHmac('sha256', await geheim()).update('wamr|' + vid).digest('hex').slice(0, 8); await kv.set('wam:ref:' + c, vid, { ex: TTL.p }).catch(() => {}); return c; }
async function telDeel(v, m, veld, test) { if (test || (!v && !m)) return; await Promise.all([v && kv.raw(['HINCRBY', 'wam:deel', 'v|' + v + '|' + veld, '1']), m && kv.raw(['HINCRBY', 'wam:deel', 'm|' + m + '|' + veld, '1'])].filter(Boolean).map(x => x.catch(() => {}))); }
export async function deelStand() { const h = await hget('wam:deel'); const o = { v: {}, m: {} }; for (const [k, n] of Object.entries(h)) { const [d, x, f] = k.split('|'); if (o[d]) { (o[d][x] = o[d][x] || {})[f] = N(n); } } return o; }
const deelScore = st => { const s = st || {}; const w = N(s.k) + 3 * N(s.a) + 6 * N(s.dl); return gamma(1 + w) / (gamma(1 + w) + gamma(1 + Math.max(0, N(s.g) - N(s.k)))); };
async function kiesDeelMoment() { if (Math.random() < 0.1) return 'geen'; const st = (await deelStand().catch(() => ({ m: {} }))).m; let best = 'maak', bs = -1; for (const m of DEEL_MOMENT.slice(0, 3)) { const sc = deelScore(st[m]); if (sc > bs) { bs = sc; best = m; } } return best; }
// de deelkaart zelf: een variant die past (vraag alleen als er iets van hen op de kaart staat), eenmaal per gesprek, alleen op het web
async function deelKaart(s, p, momenten, velden, test) {
  const moment = s && s.deelM; if (!s || s.deelG || !moment || !(momenten || []).includes(moment) || (s.ctx && s.ctx.kanaal && s.ctx.kanaal !== 'web')) return null;
  const taal = DEEL_UI[s.ctx && s.ctx.taal] ? s.ctx.taal : 'en';
  const eigen = s.eigen && s.eigen.k && String(s.eigen.k).split(':')[0] === p.vid ? s.eigen : null;
  const st = (await deelStand().catch(() => ({ v: {} }))).v; let best = null, bs = -1;
  for (const d of DEEL) { if (d.eigen && !eigen) continue; const sc = deelScore(st[d.id]); if (sc > bs) { bs = sc; best = d; } }
  if (!best) return null;
  const code = await refCode(p.vid), zid = best.eigen ? String(eigen.k).split(':')[1] : '';
  const url = 'https://wearemany.now/?r=' + code + '&d=' + best.id + '-' + moment + (s.cta && s.cta.deel ? '-' + s.cta.deel : '') + (zid ? '&z=' + zid : '');
  const ek = eigen ? (eigen.kant === 'biedt' ? 'biedt' : 'zoekt') : '', ew = eigen ? itemZin(eigen) : '';
  const xTekst = typeof best.x[taal] === 'function' ? best.x[taal](ek) : best.x[taal], mTekst = typeof best.m[taal] === 'function' ? best.m[taal](ek, ew) : best.m[taal];
  s.deelG = 1; s.deelV = best.id; velden.deel_toon = 1; await telDeel(best.id, moment, 'g', test);
  await telCta('deel', s, 'g', test);
  return { v: best.id, x: xTekst, m: mTekst, url, ui: Object.assign({}, DEEL_UI[taal], { wa: ctaTekst('deel', s) }) };
}
// wie via een deellink binnenkomt: opener op maat; bij 'vraag' wat de vriend zoekt of biedt, met een knop om meteen te reageren
const REF_UI = {
  en: { algemeen: 'Hi! A friend sent you to WAM. Tell me what you need or offer, and I\'ll find people near you who match. Anonymous, free.', zoekt: w => 'A friend of yours is looking for "' + w + '". Do you have it, or know someone who does? Or tell me what you need yourself.', biedt: w => 'A friend of yours offers "' + w + '". Need it? Or tell me what you need or offer yourself.', heb: 'I have this', ken: 'I know someone', wil: 'I need this', anders: 'Something else', ok: 'Nice. Tap the button below and I pass your message on to your friend. You only share your number when you both want to.', door: 'Send them this link: they can answer your friend right here, anonymously.' },
  nl: { algemeen: 'Hoi! Een vriend stuurde je naar WAM. Zeg wat je zoekt of aanbiedt, dan vind ik mensen bij jou in de buurt die passen. Anoniem en gratis.', zoekt: w => 'Een vriend van je zoekt "' + w + '". Heb jij het, of ken je iemand? Of zeg wat je zelf zoekt.', biedt: w => 'Een vriend van je biedt "' + w + '" aan. Zoek jij dat? Of zeg wat je zelf zoekt of biedt.', heb: 'Ik heb dit', ken: 'Ik ken iemand', wil: 'Dit zoek ik', anders: 'Iets anders', ok: 'Mooi. Tik op de knop hieronder en ik geef je bericht door aan je vriend. Je deelt je nummer pas als jullie dat allebei willen.', door: 'Stuur ze deze link: dan kunnen ze je vriend hier anoniem antwoorden.' }
};
async function refOpener(params, vid, taal) {
  if (!/^[0-9a-f]{8}$/.test(String(params.r || ''))) return null;
  const rv = await kv.get('wam:ref:' + params.r).catch(() => null); if (!rv || rv === vid) return null;
  const T = REF_UI[taal] || REF_UI.en; let item = null;
  if (/^[0-9a-f]{8}$/.test(String(params.zr || ''))) { const raw = await kv.raw(['HGET', 'wam:zw', rv + ':' + params.zr]).catch(() => null); if (raw) { try { item = Object.assign({ k: rv + ':' + params.zr }, JSON.parse(raw)); } catch (e) {} } }
  const ref = { r: params.r, d: String(params.d || '').slice(0, 24), vid: rv, item };
  if (item) { const b = item.kant === 'biedt'; return { ref, opener: { id: 'ref-vraag', taal, familie: 'ref', tekst: (b ? T.biedt : T.zoekt)(itemZin(item)), knoppen: b ? [T.wil, T.anders] : [T.heb, T.ken, T.anders] } }; }
  return { ref, opener: { id: 'ref', taal, familie: 'ref', tekst: T.algemeen, knoppen: (RA[taal] || RA.en).ASK } };
}
// echt contact (Henkjan 12 nov: "Komen mensen ECHT met elkaar in contact ?"): per paar wie ja zei, hoeveel berichten, nummers gedeeld of uitgewisseld
export async function parenStand(dagen = 1) {
  const ids = await kv.raw(['SMEMBERS', 'wam:mparen']).catch(() => []) || []; const grens = Date.now() - Math.min(14, Math.max(1, N(dagen))) * 86400000;
  const mps = []; for (let i = 0; i < ids.length; i += 40) mps.push(...await Promise.all(ids.slice(i, i + 40).map(id => kv.get('wam:mp:' + id).catch(() => null))));
  const l = mps.filter(mp => mp && N(mp.t) >= grens).map(mp => { const ja = mp.ja || {}; return { t: new Date(N(mp.t)).toISOString().slice(5, 16), waarom: mp.waarom || '', a: kort(mp.wa, 60), b: kort(mp.wb, 60), ja: (ja[mp.a] ? 1 : 0) + (ja[mp.b] ? 1 : 0), berichten: N(mp.n), nummers: Object.keys(mp.nr || {}).length, uitgewisseld: !!mp.gekoppeld }; }).sort((x, y) => (x.t < y.t ? 1 : -1));
  return { paren: l.length, een_ja: l.filter(x => x.ja >= 1).length, beide_ja: l.filter(x => x.ja === 2).length, met_bericht: l.filter(x => x.berichten > 0).length, heen_en_terug: l.filter(x => x.ja === 2 && x.berichten >= 2).length, nummer_gedeeld: l.filter(x => x.nummers > 0).length, uitgewisseld: l.filter(x => x.uitgewisseld).length, lijst: l.slice(0, 40) };
}
// ---------- beginscherm met kernzin (Henkjan 12 nov 21:53 UTC) ----------
// "Ik praat met iedereen dus als jij met mij praat kan je iedereen bereiken. Blijf varianten testen. Ik wil eigenlijk alleen veld zien met de punchline
// en dan nu in gesprek met x mensen en vandaag al x mensen gesproken in .. en .. over ... en ... En dan CTA wat zoek jij of heb jij."
// UX-onderdeel scherm: p1-p3 (kernzin, live regel, vraag, veld) lerend; oud (opener met knoppen) als vaste controle van 10%.
// Henkjan 12 nov 22:38 UTC: "een message away is geen goede hook ... Het gaat idd om echte mensen !! die je koppelt AI die bemiddelt. AI chatbot voor alleen echte mensen
// etc etc vind juiste frame en blijf roulerend leren test 8 met je campagne teksten": acht frames, dezelfde in de advertenties (hook h1-h8 in lib/wam-hooks.js);
// komt iemand via een advertentie met frame hN, dan krijgt hij op de pagina dezelfde kernzin (zelfde belofte), en dat telt voor dat frame.
export const PUNCH = {
  h1: { en: 'I talk with everyone. Talk to me, and you reach everyone.', nl: 'Ik praat met iedereen. Praat met mij, en je bereikt iedereen.', de: 'Ich rede mit allen. Rede mit mir, und du erreichst alle.' },
  h2: { en: 'The AI that only connects you with real people.', nl: 'De AI die je alleen met echte mensen verbindt.', de: 'Die KI, die dich nur mit echten Menschen verbindet.' },
  h3: { en: 'Tell me what you need. I\'ll find the real person who has it.', nl: 'Zeg wat je nodig hebt. Ik vind de echte persoon die het heeft.', de: 'Sag, was du brauchst. Ich finde den echten Menschen, der es hat.' },
  h4: { en: 'An AI chat that ends with a real person.', nl: 'Een AI-chat die eindigt bij een echt mens.', de: 'Ein KI-Chat, der bei einem echten Menschen endet.' },
  h5: { en: 'Real people near you. I do the matching.', nl: 'Echte mensen bij jou in de buurt. Ik doe het koppelen.', de: 'Echte Menschen in deiner Nähe. Ich bringe euch zusammen.' },
  h6: { en: 'Tell me once. I\'ll ask everyone around you.', nl: 'Zeg het mij één keer. Ik vraag het iedereen om je heen.', de: 'Sag es mir einmal. Ich frage alle um dich herum.' },
  h7: { en: 'Your AI middleman for real people.', nl: 'Jouw AI-tussenpersoon voor echte mensen.', de: 'Dein KI-Vermittler für echte Menschen.' },
  h8: { en: 'Ask once. Real people answer.', nl: 'Eén keer vragen. Echte mensen antwoorden.', de: 'Einmal fragen. Echte Menschen antworten.' },
};
const PCTA = { en: 'What are you looking for, or what do you have?', nl: 'Wat zoek jij, of wat heb jij?', de: 'Was suchst du, oder was hast du?' };
// gevoel van empowerment na het eerste item (Henkjan 12 nov 23:38 UTC: "Hoe geven we ze max gevoel van empowerment?"): vier varianten, Thompson op
// echt gesprek daarna (d) in wam:macht. m0 niets (controle), m1 bereik (hoeveel mensen vandaag), m2 regie (jij beslist), m3 samen (zoveel anderen willen hetzelfde)
const MACHT_V = ['m0', 'm1', 'm2', 'm3'];
async function kiesMacht() { const h = await hget('wam:macht').catch(() => ({})); const g = v => N(h[v + '|g']); const weinig = MACHT_V.filter(v => g(v) < 30); if (weinig.length) return weinig[Math.floor(Math.random() * weinig.length)]; let best = 'm0', bs = -1; for (const v of MACHT_V) { const x = beta(1 + N(h[v + '|d']), 1 + Math.max(0, g(v) - N(h[v + '|d']))); if (x > bs) { bs = x; best = v; } } return best; }
const MACHT = {
  en: { m1: n => 'Done, it\'s live. Everyone who talks to me can now be matched with you: ' + n + ' people today alone.', m2: () => 'You\'re in charge: nobody sees your name or number until you say yes, and you can change or stop this anytime.', m3: (n, w, so) => 'You\'re not alone: ' + n + ' others here ' + (w === 'biedt' ? 'also offer ' : 'are also looking for ') + ({ woning: 'a place', baan: 'work', dienst: 'services', iets: 'things' }[so] || 'things') + '. Together you count.' },
  nl: { m1: n => 'Klaar, het staat live. Iedereen die met mij praat kan nu aan jou gekoppeld worden: alleen vandaag al ' + n + ' mensen.', m2: () => 'Jij hebt de regie: niemand ziet je naam of nummer tot jij ja zegt, en je kunt dit altijd aanpassen of stoppen.', m3: (n, w, so) => 'Je staat niet alleen: ' + n + ' anderen hier ' + (w === 'biedt' ? 'bieden ook ' : 'zoeken ook ') + ({ woning: 'een woning', baan: 'werk', dienst: 'diensten', iets: 'spullen' }[so] || 'spullen') + '. Samen tel je mee.' },
};
export async function machtStand() { const h = await hget('wam:macht').catch(() => ({})), o = {}; for (const [k, v] of Object.entries(h)) { const [m, f] = k.split('|'); (o[m] = o[m] || { g: 0, d: 0 })[f] = N(v); } for (const x of Object.values(o)) x.gesprek_pct = x.g ? Math.round(1000 * x.d / x.g) / 10 : null; return o; }
async function machtZin(s) {
  const tl = s.ctx && s.ctx.taal === 'nl' ? 'nl' : 'en', T = MACHT[tl], v = s.macht, e = s.eigen || {};
  if (v === 'm2') return T.m2();
  const L = String((s.ctx && s.ctx.land) || '').toUpperCase(), D = dag();
  if (v === 'm3') { const b = await kv.get('wam:bord:' + (L || 'XX')).catch(() => null), so = ['woning', 'baan', 'dienst', 'iets'].includes(e.soort) ? e.soort : 'iets', n = N(b && b.per && b.per[(e.kant === 'biedt' ? 'biedt' : 'zoekt') + '|' + so]); if (n >= 3) return T.m3(n, e.kant, so); }
  const st = await hget('wam:stad:' + D).catch(() => ({})); let n = 0; for (const [k, x] of Object.entries(st)) if (k.startsWith(L + '|')) n += N(x); if (n < 20) n = N(await kv.raw(['HGET', 'wam:c:' + D, 'echt']).catch(() => 0));
  return n >= 20 ? T.m1(Number(n).toLocaleString(tl === 'nl' ? 'nl-NL' : 'en-US')) : '';
}
// vanzelf een match, en hoe bereiken we je (Henkjan 13 nov 01:23 UTC: "zorg ook dat ze dus alles invoeren en duidelijk is dat ze vanzelf een match krijgen. We moeten ze
// dan wel kunnen bereiken. Maak alles en blijf alles lerend maken."): vier teksten voor de kanaalvraag na het opslaan, Thompson op contact gegeven (c, telt 3) en kanaal getikt (k), wam:alv
const ALV = ['a0', 'a1', 'a2', 'a3'];
const ALVT = {
  en: { a0: z => `Done: "${z}" is on your card and I keep looking. How do you want to hear it when someone fits?`, a1: z => `Done. You don't have to do anything else: I match "${z}" automatically with everyone who has or needs it, now and later. Where should I tell you when someone fits?`, a2: z => `Saved: "${z}". Matches often come in when you're not here, so you don't miss one: how should I reach you?`, a3: z => `"${z}" is live. I keep matching you automatically, day and night, with real people nearby. One tap: how do I reach you when someone fits?` },
  nl: { a0: z => `Gedaan: "${z}" staat op je kaart en ik blijf zoeken. Hoe wil je het horen als iemand past?`, a1: z => `Gedaan. Je hoeft verder niets te doen: ik koppel "${z}" vanzelf aan iedereen die het heeft of zoekt, nu en later. Waar laat ik het je weten als iemand past?`, a2: z => `Bewaard: "${z}". Matches komen vaak binnen als je hier niet bent, dus zodat je er geen mist: hoe bereik ik je?`, a3: z => `"${z}" staat live. Ik koppel je vanzelf, dag en nacht, aan echte mensen in de buurt. Eén tik: hoe bereik ik je als iemand past?` },
};
async function kiesAlv() { const h = await hget('wam:alv').catch(() => ({})); const g = v => N(h[v + '|g']); const weinig = ALV.filter(v => g(v) < 25); if (weinig.length) return weinig[Math.floor(Math.random() * weinig.length)]; let best = 'a0', bs = -1; for (const v of ALV) { const ok = N(h[v + '|k']) + 3 * N(h[v + '|c']); const x = beta(1 + ok, 1 + Math.max(0, g(v) - N(h[v + '|k']))); if (x > bs) { bs = x; best = v; } } return best; }
function alvTekst(s, taal, zin) { const v = ALV.includes(s.alv) ? s.alv : 'a0'; s.alvG = 1; if (!(s.ctx && s.ctx.test)) kv.raw(['HINCRBY', 'wam:alv', v + '|g', '1']).catch(() => {}); return (ALVT[taal === 'nl' ? 'nl' : 'en'][v])(zin); }
export async function alvStand() { const h = await hget('wam:alv').catch(() => ({})), o = {}; for (const [k, v] of Object.entries(h)) { const [a, f] = k.split('|'); (o[a] = o[a] || { g: 0, k: 0, c: 0 })[f] = N(v); } for (const x of Object.values(o)) x.contact_pct = x.g ? Math.round(1000 * x.c / x.g) / 10 : null; return o; }
async function alvContact(s, p) { if (!s || !s.alvG || s.alvC || !p || !p.contact) return; const c = p.contact; if (!(c.mail || c.wa || c.tg || c.sms || c.wanr || c.push)) return; s.alvC = 1; if (!(s.ctx && s.ctx.test)) await kv.raw(['HINCRBY', 'wam:alv', (s.alv || 'a0') + '|c', '1']).catch(() => {}); }
// tikopties op het beginscherm, lerend (Henkjan 12 nov 23:32 UTC: "maak die knoppen dus ook lerend wat moet daar staan voor max interactie"): Thompson per optie
// op getikt (k) en echt gesprek daarna (d, telt dubbel), per bezoeker de vier hoogste trekkingen; met het echte aantal uit het live bord erachter (wam:pkn)
const KNOP_POOL = {
  // [label, bordsleutel voor het aantal, woord achter het aantal, basistekst die de regels begrijpen (leeg = label)]
  // 13 nov 01:23 UTC Henkjan: "Vind meer knoppen met hoge CTR" (I offer a service 8,3%, de rest 1-3%): meer aanbodkant en concrete wensen erbij, Thompson zoekt de winnaars
  en: { kamer_z: ['I\'m looking for a room', 'biedt|woning', 'offered'], kamer_b: ['I have a room to rent', 'zoekt|woning', 'looking'], werk_z: ['I\'m looking for work', 'biedt|baan', 'jobs'], werk_b: ['I\'m hiring', 'zoekt|baan', 'looking'], hulp_z: ['I need a hand with something', 'biedt|dienst', 'helpers'], hulp_b: ['I offer a service', 'zoekt|dienst', 'looking'], koop: ['I want to buy something', 'biedt|iets', 'for sale'], verkoop: ['I\'m selling something', 'zoekt|iets', 'buyers'], mensen: ['I want to meet people nearby', '', ''],
    klant: ['I\'m looking for customers', 'zoekt|dienst', 'looking', 'I offer a service'], bijver: ['I want to earn extra money', 'biedt|baan', 'jobs', 'I\'m looking for work'], skill: ['I have a skill to offer', 'zoekt|dienst', 'looking', 'I offer a service'], gratis: ['I\'m giving something away', '', '', 'I have something to give away'], klus: ['I need a handyman', 'biedt|dienst', 'helpers', 'I need a handyman'], schoon: ['I need a cleaner', 'biedt|dienst', 'helpers', 'I need a cleaner'], lift: ['I need a ride', '', '', 'I need a ride'], vriend: ['I want to make friends', '', '', 'I want to make friends'], nieuw: ['I\'m new in town', '', '', 'I want to meet people nearby'] },
  nl: { kamer_z: ['Ik zoek een kamer', 'biedt|woning', 'aangeboden'], kamer_b: ['Ik heb een kamer te huur', 'zoekt|woning', 'zoeken'], werk_z: ['Ik zoek werk', 'biedt|baan', 'vacatures'], werk_b: ['Ik zoek personeel', 'zoekt|baan', 'zoeken'], hulp_z: ['Ik zoek hulp bij iets', 'biedt|dienst', 'helpers'], hulp_b: ['Ik bied een dienst', 'zoekt|dienst', 'zoeken'], koop: ['Ik wil iets kopen', 'biedt|iets', 'te koop'], verkoop: ['Ik verkoop iets', 'zoekt|iets', 'kopers'], mensen: ['Ik wil mensen in de buurt ontmoeten', '', ''],
    klant: ['Ik zoek klanten', 'zoekt|dienst', 'zoeken', 'Ik bied een dienst'], bijver: ['Ik wil wat bijverdienen', 'biedt|baan', 'vacatures', 'Ik zoek werk'], skill: ['Ik kan iets goed, wie heeft het nodig', 'zoekt|dienst', 'zoeken', 'Ik bied een dienst'], gratis: ['Ik geef iets weg', '', '', 'Ik heb iets om weg te geven'], klus: ['Ik zoek een klusjesman', 'biedt|dienst', 'helpers', 'Ik zoek een klusjesman'], schoon: ['Ik zoek een schoonmaker', 'biedt|dienst', 'helpers', 'Ik zoek een schoonmaker'], lift: ['Ik zoek een lift', '', '', 'Ik zoek een lift'], vriend: ['Ik wil nieuwe vrienden maken', '', '', 'Ik wil nieuwe vrienden maken'], nieuw: ['Ik ben nieuw in de stad', '', '', 'Ik wil mensen in de buurt ontmoeten'] },
};
async function kiesKnoppen(land, taal) {
  const P = KNOP_POOL[taal === 'nl' ? 'nl' : 'en'], h = await hget('wam:pkn').catch(() => ({}));
  const per = await (async () => { try { const L = String(land || '').toUpperCase(), b = await kv.get('wam:bord:' + (L || 'XX')); return (b && b.per) || {}; } catch (e) { return {}; } })();
  const getrokken = Object.keys(P).map(id => { const g = N(h[id + '|g']), k = N(h[id + '|k']), d = N(h[id + '|d']); return [id, beta(1 + k + 2 * d, 1 + Math.max(0, g - k))]; }).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]);
  const kaart = {}, labels = getrokken.map(id => { const [lab0, bk, woord, basis] = P[id], n = bk ? N(per[bk]) : 0; const lab = n >= 5 ? lab0 + ' · ' + n + ' ' + woord : lab0; kaart[lab] = [id, basis || lab0]; return lab; });
  return { labels, kaart };
}
export async function knopStand() { const h = await hget('wam:pkn').catch(() => ({})), o = {}; for (const [k, v] of Object.entries(h)) { const [id, f] = k.split('|'); (o[id] = o[id] || { g: 0, k: 0, d: 0 })[f] = N(v); } for (const x of Object.values(o)) x.tik_pct = x.g ? Math.round(1000 * x.k / x.g) / 10 : null; return o; }
const PKN = { en: ['I\'m looking for a room', 'I\'m looking for work', 'I need a service', 'I have something to offer'], nl: ['Ik zoek een kamer', 'Ik zoek werk', 'Ik zoek hulp', 'Ik heb iets te bieden'], de: ['Ich suche ein Zimmer', 'Ich suche Arbeit', 'Ich brauche Hilfe', 'Ich biete etwas an'] };
const PPH = { en: 'A room, a ride, a plumber, a job…', nl: 'Een kamer, een lift, een klusser, werk…', de: 'Ein Zimmer, eine Mitfahrt, ein Handwerker, ein Job…' };
const PKL = { en: 'Or ask your group something: church, club, team →', nl: 'Of vraag je groep iets: kerk, club, team →', de: 'Oder frag deine Gruppe etwas: Kirche, Verein, Team →' };
const LIVE = {
  en: { nu: n => 'Talking with ' + n + ' people right now', dag: (n, l, st, ov) => 'Today ' + n + ' people' + (l ? ' in ' + l : '') + (st ? ', most in ' + st : '') + (ov ? ', about ' + ov : '') + '.', en: ' and ', s: { woning: 'rooms', baan: 'work', dienst: 'services', iets: 'buying and selling', iemand: 'meeting people' }, loc: 'en-US' },
  nl: { nu: n => 'Nu in gesprek met ' + n + ' mensen', dag: (n, l, st, ov) => 'Vandaag al ' + n + ' mensen' + (l ? ' in ' + l : '') + (st ? ', vooral in ' + st : '') + (ov ? ', over ' + ov : '') + '.', en: ' en ', s: { woning: 'kamers', baan: 'werk', dienst: 'diensten', iets: 'kopen en verkopen', iemand: 'nieuwe mensen' }, loc: 'nl-NL' },
  de: { nu: n => 'Gerade im Gespräch mit ' + n + ' Leuten', dag: (n, l, st, ov) => 'Heute schon ' + n + ' Leute' + (l ? ' in ' + l : '') + (st ? ', vor allem in ' + st : '') + (ov ? ', über ' + ov : '') + '.', en: ' und ', s: { woning: 'Zimmer', baan: 'Arbeit', dienst: 'Dienste', iets: 'Kaufen und Verkaufen', iemand: 'neue Leute' }, loc: 'de-DE' },
};
const opsom = (l, en) => l.length > 1 ? l.slice(0, -1).join(', ') + en + l[l.length - 1] : (l[0] || '');
// echte cijfers: nu = mensen met een bericht in de laatste 15 minuten (wam:actief), vandaag = echte mensen in jouw land (wam:stad:<dag>) met de steden
// waar de meesten zitten, of wereldwijd zolang je land nog geen 20 heeft; over = de soorten vragen van vandaag (wam:ucd:<dag>)
export async function liveRegel(land, taal) {
  const L = String(land || '').toUpperCase().slice(0, 2), T = LIVE[taal] || LIVE.en, key = 'wam:live:' + (L || 'XX');
  let b = await kv.get(key).catch(() => null);
  if (!b) {
    const D = dag(), nu = Date.now();
    const [act, echt, st, uc] = await Promise.all([kv.raw(['ZCOUNT', 'wam:actief', String(nu - 15 * 60000), '+inf']).catch(() => 0), kv.raw(['HGET', 'wam:c:' + D, 'echt']).catch(() => 0), hget('wam:stad:' + D).catch(() => ({})), hget('wam:ucd:' + D).catch(() => ({}))]);
    let nl = 0; const steden = [];
    for (const [k, v] of Object.entries(st || {})) { const i = k.indexOf('|'); if (k.slice(0, i) !== L) continue; nl += N(v); steden.push([k.slice(i + 1), N(v)]); }
    steden.sort((a, x) => x[1] - a[1]);
    const per = {}, perAl = {}; for (const [k, v] of Object.entries(uc || {})) { const d = k.split('|'), so = d[2]; if (!so) continue; perAl[so] = N(perAl[so]) + N(v); if (d[0] === L) per[so] = N(per[so]) + N(v); }
    const lokaal = nl >= 20, bron = lokaal && Object.values(per).reduce((a, x) => a + x, 0) >= 8 ? per : perAl;
    b = { act: N(act), n: lokaal ? nl : N(echt), lokaal, steden: lokaal ? steden.filter(x => x[1] >= 3 && x[0]).slice(0, 2).map(x => x[0]) : [], over: Object.entries(bron).filter(([so]) => LIVE.en.s[so]).sort((a, x) => x[1] - a[1]).slice(0, 2).map(x => x[0]) };
    await kv.set(key, b, { ex: 60 }).catch(() => {});
  }
  const fmt = n => Number(n).toLocaleString(T.loc); let ln = '';
  if (b.lokaal && L) { try { ln = new Intl.DisplayNames([taal === 'nl' || taal === 'de' ? taal : 'en'], { type: 'region' }).of(L) || ''; } catch (e) {} if (!LIVE[taal] || taal === 'en') { if (['NL', 'US', 'GB', 'AE', 'PH', 'DO', 'CZ', 'BS', 'GM'].includes(L)) ln = 'the ' + ln; } }
  return { nu: b.act >= 2 ? T.nu(fmt(b.act)) : '', dag: b.n >= 20 ? T.dag(fmt(b.n), ln, opsom(b.steden, T.en), opsom(b.over.map(so => T.s[so]).filter(Boolean), T.en)) : '' };
}
// eenmalig: steden van vandaag uit de sessies van vandaag halen (de telling liep pas vanaf de uitrol), beschermd via op=stadvul
export async function stadVul(d = dag()) {
  const l = await kv.raw(['LRANGE', 'wam:sessies:' + d, '0', '-1']).catch(() => []); const per = {}; let n = 0;
  for (let i = 0; i < l.length; i += 100) { const r = await kv.raw(['MGET', ...l.slice(i, i + 100).map(x => 'wam:s:' + x)]).catch(() => []); for (const j of r || []) { let s = null; try { s = typeof j === 'string' ? JSON.parse(j) : j; } catch (e) {} if (!s || !s.ctx || !s.ctx.stad || (s.ctx && s.ctx.test)) continue; const k = String(s.ctx.land || '').toUpperCase() + '|' + s.ctx.stad; per[k] = N(per[k]) + 1; n++; } }
  await kv.raw(['DEL', 'wam:stad:' + d]).catch(() => {}); for (const [k, v] of Object.entries(per)) await kv.raw(['HINCRBY', 'wam:stad:' + d, k, String(v)]).catch(() => {});
  kv.raw(['EXPIRE', 'wam:stad:' + d, String(3 * 86400)]).catch(() => {}); return { sessies: l.length, met_stad: n, steden: Object.keys(per).length };
}

// ---------- groepsvraag: kring (Henkjan 12 nov 21:54-21:55 UTC) ----------
// "keihard optimaliseren voor viraliteit meteen. En businessmodel is een besloten versie in je bedrijf of kerk sportclub etc."
// "Jij stuurt linkje naar peers. Laten we even op een rijtje krijgen wat er in de kerk speelt met bijv een vraag erbij. En die vraag stuur je door.
//  Jij krijgt gewoon in jouw chat de respons en of de reacties."
// Maker: "ask my church what's going on" (of de link onder het veld) -> groep -> vraag -> deellink wearemany.now/?kr=<id> met deeltekst k1-k3
// (Thompson op 'kreeg minstens één antwoord'). Groepslid: opent de link, antwoordt anoniem, ziet daarna wat anderen zeiden, kan zelf de groep iets
// vragen (generatie 2). Elk antwoord gaat naar de maker (web-inbox; WhatsApp, Telegram of mail bij 1, 3, 5, 10, 25, 50, 100). Vanaf 3 antwoorden: knop
// "Besloten WAM voor <groep>" (eerlijke interesselijst voor het betaalde model, wam:prive). Tellers in wam:krv (<v>|g gemaakt, k deel getikt, o geopend,
// s eerste antwoord, a antwoorden) en wam:c:<dag> (kring_*). Antwoorden zonder naam of nummer, per persoon hoogstens 3 per vraag.
const KR_WOORD = "church|congregation|parish|mosque|temple|synagogue|choir|club|team|colleagues|coworkers|co-workers|office|company|class|classmates|school|parents|neighbou?rs|neighbou?rhood|street|building|friends|family|group|community|members|gym|band|kerk|gemeente|parochie|moskee|koor|vereniging|sportclub|voetbalclub|collega'?s|kantoor|bedrijf|klas|klasgenoten|ouders|buren|buurt|straat|vrienden|familie|groep|leden|gemeenschap|kirche|gemeinde|verein|kollegen|klasse|nachbarn|freunde|gruppe";
const KR_RE = new RegExp("\\b(?:ask|poll|survey|vraag|vragen|frag|fragen)\\b[^.?!]{0,30}?\\b(my|our|mijn|onze|ons|meine[mn]?|unsere[mn]?)\\s+((?:[\\w'’-]+\\s+){0,2}?(?:" + KR_WOORD + "))\\b[\\s,:]*(.*)$", 'i');
const KR_ALLEEN = new RegExp("^(?:(my|our|mijn|onze|ons|meine[mn]?|unsere[mn]?)\\s+)?((?:[\\w'’-]+\\s+){0,2}?(?:" + KR_WOORD + "))$", 'i');
const KR = {
  en: {
    welke: 'Which group do you want to ask? Your church, club, team, colleagues or class: anything with a group chat.', welkeK: ['My church', 'My sports club', 'My colleagues', 'My class'],
    vraag: n => 'What do you want to ask ' + n + '? Tap one, or type your own question.', vraagK: ['What\'s going on with you this week?', 'Who needs a hand, or has something to offer?', 'What should we do better together?'],
    klaar: n => 'Done. Share it in your group chat. Everyone in ' + n + ' answers anonymously in about 10 seconds, and every answer comes straight back to you here.',
    kaartX: 'Tap to share. I\'ll collect the answers for you.', waVoor: 'Forward the next message to your group chat:',
    ui: { wa: 'Share in WhatsApp', deel: 'Share', kop: 'Copy text', klaar: 'Copied' },
    deel: { k1: (n, v, u) => 'Quick question for ' + n + ': ' + v + '\nAnswer anonymously, it takes 10 seconds: ' + u, k2: (n, v, u) => v + '\n(Anonymous, just for ' + n + '. Tap to answer: ' + u + ')', k3: (n, v, u) => 'I\'m asking everyone in ' + n + ' the same question: ' + v + '\nYour answer stays anonymous, I only see the answers: ' + u },
    meta: n => 'Anonymous question for ' + n + '. Answer in 10 seconds.',
    antwVraag: n => 'Your answer? It\'s anonymous: ' + n + ' sees the answers, never who wrote them.', ph: 'Your answer…',
    sub: (n, k) => 'For ' + n + ' · anonymous · ' + (k ? k + ' answered so far' : 'be the first to answer'),
    bedankt: (n, k) => 'Thanks, your answer is in, anonymously. ' + k + (k === 1 ? ' person' : ' people') + ' from ' + n + ' answered so far.',
    anderen: 'What others said:', verder: n => 'Want to ask ' + n + ' something yourself? Or tell me what you\'re looking for or what you have, and I\'ll find who fits.',
    eigenK: 'Ask the group my own question',
    overzicht: (n, v, k) => 'Your question for ' + n + ': "' + v + '"\n\n' + (k ? k + (k === 1 ? ' answer' : ' answers') + ' so far:' : 'No answers yet. Share it in the group chat and they will come in here.'),
    nieuw: (n, a, k) => 'New answer from ' + n + ': "' + a + '" (' + k + ' so far)', mijl: (n, k) => k + ' people from ' + n + ' answered your question so far.',
    alles: 'Show all answers', samen: 'In short:', opnieuw: 'Share it again:',
    prive: n => 'A private WAM for ' + n,
    priveX: n => 'A private WAM for ' + n + ': only your members, everything stays inside the group, and you can ask everyone anything in one tap and get the answers back like this. We are opening the first private groups now. What is the best way to reach you? Your email or WhatsApp number is enough.',
    priveOk: n => 'Thanks! We will get in touch as soon as private groups open, and set it up for ' + n + ' with you. Anything else I can find for you?',
    geen: 'You haven\'t asked a group anything yet. Want to? Tell me which group.', teVeel: 'You\'ve asked enough groups for today. Try again tomorrow.',
    over: x => 'What do you think about ' + x + '?',
  },
  nl: {
    welke: 'Welke groep wil je iets vragen? Je kerk, club, team, collega\'s of klas: alles met een groepsapp.', welkeK: ['Mijn kerk', 'Mijn sportclub', 'Mijn collega\'s', 'Mijn klas'],
    vraag: n => 'Wat wil je ' + n + ' vragen? Tik er een of typ je eigen vraag.', vraagK: ['Wat speelt er bij jou deze week?', 'Wie kan hulp gebruiken, of heeft iets te bieden?', 'Wat kunnen we samen beter doen?'],
    klaar: n => 'Klaar. Zet hem in je groepsapp. Iedereen van ' + n + ' antwoordt anoniem in zo\'n 10 seconden, en elk antwoord komt meteen hier bij jou terug.',
    kaartX: 'Tik om te delen. Ik verzamel de antwoorden voor je.', waVoor: 'Stuur het volgende bericht door naar je groepsapp:',
    ui: { wa: 'Deel in WhatsApp', deel: 'Delen', kop: 'Kopieer tekst', klaar: 'Gekopieerd' },
    deel: { k1: (n, v, u) => 'Snelle vraag voor ' + n + ': ' + v + '\nAntwoord anoniem, kost 10 seconden: ' + u, k2: (n, v, u) => v + '\n(Anoniem, alleen voor ' + n + '. Tik om te antwoorden: ' + u + ')', k3: (n, v, u) => 'Ik vraag iedereen van ' + n + ' hetzelfde: ' + v + '\nJe antwoord blijft anoniem, ik zie alleen de antwoorden: ' + u },
    meta: n => 'Anonieme vraag voor ' + n + '. Antwoord in 10 seconden.',
    antwVraag: n => 'Jouw antwoord? Het is anoniem: ' + n + ' ziet de antwoorden, nooit wie ze schreef.', ph: 'Jouw antwoord…',
    sub: (n, k) => 'Voor ' + n + ' · anoniem · ' + (k ? k + ' gaven al antwoord' : 'wees de eerste'),
    bedankt: (n, k) => 'Dank je, je antwoord staat erin, anoniem. ' + k + (k === 1 ? ' persoon' : ' mensen') + ' van ' + n + ' gaven al antwoord.',
    anderen: 'Wat anderen zeiden:', verder: n => 'Wil je ' + n + ' zelf iets vragen? Of vertel me wat je zoekt of hebt, dan zoek ik wie past.',
    eigenK: 'Stel de groep zelf een vraag',
    overzicht: (n, v, k) => 'Jouw vraag voor ' + n + ': "' + v + '"\n\n' + (k ? k + (k === 1 ? ' antwoord' : ' antwoorden') + ' tot nu toe:' : 'Nog geen antwoorden. Zet hem in de groepsapp, dan komen ze hier binnen.'),
    nieuw: (n, a, k) => 'Nieuw antwoord van ' + n + ': "' + a + '" (' + k + ' tot nu toe)', mijl: (n, k) => k + ' mensen van ' + n + ' gaven al antwoord op je vraag.',
    alles: 'Laat alle antwoorden zien', samen: 'Kort samengevat:', opnieuw: 'Nog eens delen:',
    prive: n => 'Een besloten WAM voor ' + n,
    priveX: n => 'Een besloten WAM voor ' + n + ': alleen jullie leden, alles blijft binnen de groep, en je vraagt iedereen alles met één tik en krijgt de antwoorden zo terug. We openen nu de eerste besloten groepen. Hoe bereiken we je het best? Je e-mail of WhatsApp-nummer is genoeg.',
    priveOk: n => 'Dank je! We nemen contact op zodra besloten groepen opengaan, en zetten het samen met je op voor ' + n + '. Kan ik nog iets voor je zoeken?',
    geen: 'Je hebt nog geen groep iets gevraagd. Zin in? Zeg welke groep.', teVeel: 'Je hebt vandaag genoeg groepen gevraagd. Morgen weer.',
    over: x => 'Wat vind je van ' + x + '?',
  },
};
const krT = taal => KR[taal === 'nl' ? 'nl' : 'en'];
// aanbod in het gesprek (Henkjan 12 nov 23:07 UTC: "Dat is totaal niet duidelijk want kan op whatsapp ook denken ze dan"): zeggen wat WAM toevoegt boven zelf vragen in de groepsapp
const KR_AANBOD = {
  en: 'By the way: I can ask your church, club or team one question for you. Better than asking in the group chat yourself: everyone answers anonymously, so people are honest; the group isn\'t flooded with replies; and you get one clear summary from me here.',
  nl: 'Trouwens: ik kan je kerk, club of team één vraag voor je stellen. Beter dan zelf vragen in de groepsapp: iedereen antwoordt anoniem, dus eerlijk; de groep loopt niet vol met reacties; en jij krijgt hier van mij één helder overzicht.',
};
const KR_AANBODK = { en: 'Ask my group anonymously', nl: 'Vraag mijn groep anoniem' };
const KR_V = ['k1', 'k2', 'k3'];
const KR_START = new Set([...Object.values(PKL), 'Ask my group something', 'Vraag iets aan mijn groep', 'Ask your group something', 'Vraag je groep iets', 'Ask my group anonymously', 'Vraag mijn groep anoniem']);
const KR_EIGEN = new Set([KR.en.eigenK, KR.nl.eigenK]);
const KR_ALLES = /^(show (me )?(all )?(the )?answers|all answers|answers|laat (alle )?(de )?antwoorden zien|alle antwoorden|antwoorden)\s*[.!?]*$/i;
const KR_PRIVE = /\b(private|besloten|closed|eigen) (wam|version|versie|group|groep|community)\b/i;
function krNaam(grp, tl) {
  grp = String(grp || '').trim().replace(/\s+/g, ' ').slice(0, 50); const m = grp.match(/^(my|our|mijn|onze|ons|meine[mn]?|unsere[mn]?)\s+(.+)$/i); const w = (m ? m[2] : grp);
  if (!m && !KR_ALLEEN.test(grp)) return w; // een eigen naam ("St. Paul's", "FC Gouda") blijft zoals getypt
  const l = w.toLowerCase(); if (tl === 'nl') return (/^(team|koor|bedrijf|kantoor|gezin)$/.test(l) ? 'ons ' : 'onze ') + l; if (tl === 'de') return 'unsere ' + l; return 'our ' + l;
}
function krVraag(t, tl) {
  t = String(t || '').trim().replace(/\s+/g, ' ').replace(/^(to|om|that|dat)\s+/i, ''); if (t.replace(/[^\p{L}]/gu, '').length < 4) return '';
  const ov = t.match(/^(?:about|over)\s+(.+?)[?.!]*$/i); if (ov) return kort(krT(tl).over(ov[1]), 200);
  const ia = t.match(/^(?:if|whether)\s+(?:anyone|anybody|someone|somebody)\s+(has|can|is|knows|wants|needs|could|would)\b\s*(.*)$/i); if (ia) { const w = { has: 'Does anyone have', can: 'Can anyone', is: 'Is anyone', knows: 'Does anyone know', wants: 'Does anyone want', needs: 'Does anyone need', could: 'Could anyone', would: 'Would anyone' }[ia[1].toLowerCase()]; t = w + (ia[2] ? ' ' + ia[2] : ''); }
  const it = t.match(/^(?:if|whether)\s+they\s+(.+)$/i); if (it) t = 'Do you ' + it[1].replace(/\btheir\b/gi, 'your').replace(/\bthem\b/gi, 'you');
  const nw = t.match(/^wat er\s+(speelt|gebeurt|leeft|nodig is|beter kan)\s*(.*)$/i); if (nw) t = { speelt: 'Wat speelt er', gebeurt: 'Wat gebeurt er', leeft: 'Wat leeft er', 'nodig is': 'Wat is er nodig', 'beter kan': 'Wat kan er beter' }[nw[1].toLowerCase()] + (nw[2] ? ' ' + nw[2] : '');
  t = t.charAt(0).toUpperCase() + t.slice(1); if (!/[?!.]$/.test(t)) t += '?'; return kort(t, 200);
}
async function kiesKrV() { const h = await hget('wam:krv').catch(() => ({})); const g = v => N(h[v + '|g']); const weinig = KR_V.filter(v => g(v) < 10); if (weinig.length) return weinig[Math.floor(Math.random() * weinig.length)]; let best = 'k1', bs = -1; for (const v of KR_V) { const x = beta(1 + N(h[v + '|s']), 1 + Math.max(0, g(v) - N(h[v + '|s']))); if (x > bs) { bs = x; best = v; } } return best; }
async function krTel(v, veld, test) { if (!test && v) await kv.raw(['HINCRBY', 'wam:krv', v + '|' + veld, '1']).catch(() => {}); }
export async function kringLaad(id) { if (!/^[0-9a-f]{10}$/.test(String(id || ''))) return null; return kv.get('wam:kr:' + id).catch(() => null); }
const krUrl = id => 'https://wearemany.now/?kr=' + id;
function krDeel(k) { const T = krT(k.taal), f = T.deel[k.v] || T.deel.k1; return { v: 'kring', e: 'kring', x: T.kaartX, m: f(k.naam, k.vraag, krUrl(k.id)), tx: f(k.naam, k.vraag, krUrl(k.id)), url: krUrl(k.id), ui: T.ui }; }
export async function kringMeta(id) { const k = await kringLaad(id); if (!k) return null; return { titel: k.vraag, tekst: krT(k.taal).meta(k.naam) }; }
async function kringAntwoorden(id, n = 15) { const l = await kv.raw(['LRANGE', 'wam:kra:' + id, String(-n), '-1']).catch(() => []); return (l || []).map(j => { try { return typeof j === 'string' ? JSON.parse(j) : j; } catch (e) { return null; } }).filter(Boolean); }
async function kringMaak(s, naam, vraag, TEST) {
  const id = hex(5), tl = s.ctx && s.ctx.taal === 'nl' ? 'nl' : 'en', ouder = s.krOpen || s.krVan || '', ok0 = ouder ? await kringLaad(ouder) : null;
  const k = { id, naam, vraag, maker: s.vid, msid: s.sid, taal: tl, land: String((s.ctx && s.ctx.land) || '').toUpperCase(), t: Date.now(), gen: ok0 ? N(ok0.gen) + 1 : 1, ouder, v: await kiesKrV().catch(() => 'k1'), ...(TEST ? { test: 1 } : {}) };
  await kv.set('wam:kr:' + id, k, { ex: 90 * 86400 });
  await kv.raw(['LPUSH', 'wam:krm:' + s.vid, id]).catch(() => {}); kv.raw(['LTRIM', 'wam:krm:' + s.vid, '0', '19']).catch(() => {}); kv.raw(['EXPIRE', 'wam:krm:' + s.vid, String(90 * 86400)]).catch(() => {});
  if (!TEST) { await kv.raw(['RPUSH', 'wam:krl', id]).catch(() => {}); kv.raw(['LTRIM', 'wam:krl', '-3000', '-1']).catch(() => {}); await krTel(k.v, 'g', false); if (k.gen > 1) await krTel('gen' + Math.min(k.gen, 5), 'g', false); }
  return k;
}
async function kringOverzicht(k, mijn) {
  const T = krT(k.taal), l = await kringAntwoorden(k.id, 30), n = N(await kv.raw(['LLEN', 'wam:kra:' + k.id]).catch(() => l.length));
  let x = T.overzicht(k.naam, k.vraag, n) + (l.length ? '\n' + l.slice(-15).map(a => '• ' + a.x).join('\n') : '');
  if (n >= 4 && mijn) { // kort samengevat door de AI, bewaard per aantal antwoorden
    if (k.samN !== n && (await binnenPlafond(0.05))) { try { const r = await berichten({ fn: 'wam-kring', model: HAIKU, system: 'You summarise anonymous answers from one group (a church, club, team or class) to one question. Write 2 to 4 short bullet lines starting with "• ", each one theme with how many people said it. Only what the answers say, no advice, no names. Language: ' + (k.taal === 'nl' ? 'Dutch' : 'English') + '.', user: 'Question: ' + k.vraag + '\nAnswers:\n' + l.map(a => '- ' + a.x).join('\n'), max: 260, timeout: 15000 }); await boekKost(kostVan(r.model, r.usage), 'kring'); const sam = String(r.txt || '').trim().slice(0, 700); if (sam) { k.sam = sam; k.samN = n; await kv.set('wam:kr:' + k.id, k, { ex: 90 * 86400 }).catch(() => {}); } } catch (e) {} }
    if (k.sam) x += '\n\n' + T.samen + '\n' + k.sam;
  }
  return { x, n };
}
// een groepslid antwoordt: opslaan, de maker seinen, en wat anderen zeiden teruggeven
async function kringAntw(s, k, x, TEST) {
  const hv = h12(s.vid), mijn = N(await kv.raw(['HINCRBY', 'wam:krp:' + k.id, hv, '1']).catch(() => 1)); kv.raw(['EXPIRE', 'wam:krp:' + k.id, String(90 * 86400)]).catch(() => {});
  if (mijn > 3) return { n: N(await kv.raw(['LLEN', 'wam:kra:' + k.id]).catch(() => 0)), dubbel: true };
  const a = { t: Date.now(), x: kort(x, 300), h: hv.slice(0, 6) };
  const n = N(await kv.raw(['RPUSH', 'wam:kra:' + k.id, JSON.stringify(a)]).catch(() => 0)); kv.raw(['EXPIRE', 'wam:kra:' + k.id, String(90 * 86400)]).catch(() => {});
  if (!TEST && !k.test) { if (n === 1) await krTel(k.v, 's', false); await krTel(k.v, 'a', false); }
  const T = krT(k.taal), nieuwX = T.nieuw(k.naam, kort(x, 160), n);
  if ([1, 3, 5, 10, 25, 50, 100].includes(n)) await inboxIn(k.maker, { soort: 'tekst', x: (n >= 3 ? T.mijl(k.naam, n) + '\n\n' : '') + nieuwX, k: [T.alles] }).catch(() => {});
  else { await kv.raw(['RPUSH', 'wam:inbox:' + k.maker, JSON.stringify({ t: Date.now(), soort: 'tekst', x: nieuwX, k: [T.alles] })]).catch(() => {}); kv.raw(['EXPIRE', 'wam:inbox:' + k.maker, String(30 * 86400)]).catch(() => {}); }
  return { n, a };
}
export async function kringStand() {
  const h = await hget('wam:krv').catch(() => ({})), v = {};
  for (const [k, x] of Object.entries(h)) { const [a, f] = k.split('|'); (v[a] = v[a] || {})[f] = N(x); }
  const ids = (await kv.raw(['LRANGE', 'wam:krl', '-40', '-1']).catch(() => [])) || [], lijst = [];
  for (const id of ids.reverse()) { const k = await kringLaad(id); if (!k) continue; lijst.push({ id, t: new Date(k.t).toISOString().slice(5, 16), land: k.land, naam: k.naam, vraag: kort(k.vraag, 90), gen: k.gen, v: k.v, open: N(await kv.raw(['SCARD', 'wam:kro:' + id]).catch(() => 0)), antw: N(await kv.raw(['LLEN', 'wam:kra:' + id]).catch(() => 0)) }); }
  const g1 = N((v.k1 || {}).g) + N((v.k2 || {}).g) + N((v.k3 || {}).g), gen2 = Object.entries(v).filter(([a]) => /^gen[2-5]$/.test(a)).reduce((t, [, o]) => t + N(o.g), 0);
  const prive = N(await kv.raw(['LLEN', 'wam:prive']).catch(() => 0));
  return { varianten: v, kringen: g1, gen2_makers: gen2, virale_factor_makers: g1 ? Math.round(100 * gen2 / Math.max(1, g1 - gen2)) / 100 : null, prive_interesse: prive, laatste: lijst };
}
// ---------- ken jij iemand die ...: hulpvragen van anderen doorsturen (Henkjan 13 nov 01:27 UTC) ----------
// "duidelijk maken als ze ook peers laten praten met Folky je dan al die netwerken open trekt ... vraag bijv YES of ze iemand kennen die ... van een aanvraag die
// nog niet is gematcht. We kunnen ze laten zien dat als zij een connectie maken ze zelf ook geconnect worden. Ik wil hiermee distributie probleem oplossen zorg dus
// dat je slim opslaat. En alle vormen van supply aan alle vormen van demand kan koppelen. Kan ook alleen maar een bericht zijn die je moet bezorgen ergens."
// Eén beurt na het eerste eigen item krijgt de bezoeker één open zoekvraag van iemand anders in de buurt (wam:hulp:<hid>, geen vid in de link) met drie tikopties:
// doorsturen (deelkaart met wearemany.now/?h=<hid>&r=<eigen refcode>), ik kan het zelf (wordt een eigen aanbod, dus een match), of niemand. Wie via zo'n link komt,
// ziet de vraag, kan helpen of zelf weer doorsturen (keten, gen+1), en ziet ook wat de doorstuurder zelf zoekt: wie verbindt, wordt zelf verbonden.
// Moment lerend in wam:doorab (kring = groepsvraag, ken = dit, geen = controle); tellers per vraag en keten in wam:hulpst en wam:hulpketen.
const HULP = {
  en: { aanbod: w => 'One more thing, and it helps you too: someone near you is still looking for "' + w + '". Know someone who could help? Forward it in one tap. Everyone who joins through you is also matched with what you need: connect people, and you get connected.', ja: 'Yes, forward it', zelf: 'I can do it myself', nee: 'No one comes to mind', neeX: 'No problem. Anything else you need or can offer?', deelX: 'Tap to forward. Whoever can help answers right here, anonymously.', deelM: w => 'Someone near you is looking for "' + w + '". Can you help, or know someone who can? Answer anonymously on WAM, it\'s free:', land: w => 'Someone near you is looking for "' + w + '". Do you have it, or know someone who does? Anonymous and free.', helpK: 'I can help', kenK: 'I know someone', andersK: 'Something else', ook: w => 'The person who sent you this is looking for "' + w + '" too. Know anything?', offer: w => 'I offer ' + w },
  nl: { aanbod: w => 'Nog één ding, en het helpt jou ook: iemand bij jou in de buurt zoekt nog "' + w + '". Ken je iemand die kan helpen? Stuur het met één tik door. Iedereen die via jou binnenkomt, wordt ook aan jouw vraag gekoppeld: wie verbindt, wordt zelf verbonden.', ja: 'Ja, stuur door', zelf: 'Dat kan ik zelf', nee: 'Ik ken niemand', neeX: 'Geen probleem. Zoek of bied je nog iets?', deelX: 'Tik om door te sturen. Wie kan helpen, antwoordt hier anoniem.', deelM: w => 'Iemand bij jou in de buurt zoekt "' + w + '". Kun jij helpen, of ken je iemand? Antwoord anoniem op WAM, gratis:', land: w => 'Iemand bij jou in de buurt zoekt "' + w + '". Heb jij het, of ken je iemand die het heeft? Anoniem en gratis.', helpK: 'Ik kan helpen', kenK: 'Ik ken iemand', andersK: 'Iets anders', ook: w => 'Wie jou dit stuurde, zoekt zelf ook "' + w + '". Weet jij iets?', offer: w => 'Ik bied ' + w },
};
const hulpT = taal => HULP[taal === 'nl' ? 'nl' : 'en'];
const HULP_KNOP = new Set(Object.values(HULP).flatMap(T => [T.ja, T.zelf, T.nee, T.helpK, T.kenK]));
const DOORAB = ['ken', 'kring', 'geen'];
async function kiesDoorAb() { const h = await hget('wam:doorab').catch(() => ({})); const g = v => N(h[v + '|g']); const weinig = DOORAB.filter(v => g(v) < 25); if (weinig.length) return weinig[Math.floor(Math.random() * weinig.length)]; let best = 'ken', bs = -1; for (const v of DOORAB) { const ok = N(h[v + '|k']) + 2 * N(h[v + '|s']); const x = beta(1 + ok, 1 + Math.max(0, g(v) - N(h[v + '|k']))); if (x > bs) { bs = x; best = v; } } return best; }
const doorTel = (v, f, test) => { if (!test && v) kv.raw(['HINCRBY', 'wam:doorab', v + '|' + f, '1']).catch(() => {}); };
const hulpTel = (hid, f, test) => { if (test) return; kv.raw(['HINCRBY', 'wam:hulpst', f, '1']).catch(() => {}); if (hid) { kv.raw(['HINCRBY', 'wam:hulpst:' + hid, f, '1']).catch(() => {}); kv.raw(['EXPIRE', 'wam:hulpst:' + hid, String(30 * 86400)]).catch(() => {}); } };
// een open zoekvraag van iemand anders in de buurt: zelfde land, liefst zelfde stad, laatste 7 dagen, concreet en veilig, nooit van de bezoeker zelf
async function hulpKies(s) {
  const L = String((s.ctx && s.ctx.land) || '').toUpperCase(), stad = String((s.ctx && s.ctx.stad) || '').toLowerCase(), key = 'wam:hulpkand:' + (L || 'XX');
  let kand = await kv.get(key).catch(() => null);
  if (!kand) { const st = await zoekStand(); const nu = Date.now(); kand = st.lijst.filter(z => z.land === L && z.kant !== 'biedt' && nu - N(z.tb) < 7 * 86400000 && z.wat && !GENERIEK.test(String(z.wat).trim()) && !LEER.veilig(String(z.wat) + ' ' + String(z.eisen || ''))).slice(0, 60).map(z => ({ k: z.k, zin: itemZin(z), stad: String(z.stad || z.waar || '').toLowerCase() })); await kv.set(key, kand, { ex: 300 }).catch(() => {}); }
  const eigen = kand.filter(z => String(z.k).split(':')[0] !== s.vid), dicht = eigen.filter(z => stad && z.stad && z.stad.includes(stad)), pool = dicht.length ? dicht : eigen;
  if (!pool.length) return null; const z = pool[Math.floor(Math.random() * Math.min(pool.length, 20))];
  const hid = hex(4); await kv.set('wam:hulp:' + hid, { k: z.k, zin: z.zin, land: L, t: Date.now() }, { ex: 30 * 86400 }).catch(() => {});
  return { hid, zin: z.zin };
}
// het aanbod, eenmalig, de beurt na het eerste eigen item (beide paden); kring en ken wisselen lerend
async function doorAanbod(s, velden, TEST) {
  if (s.doorG || !s.eigen || velden.ra_maak || velden.zoektocht || velden.aanbod || s.krOpen || (s.ctx && s.ctx.kanaal && s.ctx.kanaal !== 'web')) return null;
  if (!s.doorAb) s.doorAb = await kiesDoorAb().catch(() => 'ken');
  s.doorG = 1; const v = s.doorAb, tl = s.ctx.taal === 'nl' ? 'nl' : 'en'; doorTel(v, 'g', TEST);
  if (v === 'geen') return null;
  if (v === 'kring') { if (s.krAangeboden) return null; s.krAangeboden = 1; velden.kring_aanbod = 1; return { x: KR_AANBOD[tl], k: [KR_AANBODK[tl]] }; }
  const h = await hulpKies(s).catch(() => null); if (!h) return null; const T = hulpT(tl);
  s.hulpNu = { hid: h.hid, zin: h.zin }; velden.hulp_toon = 1; hulpTel(h.hid, 'toon', TEST);
  return { x: T.aanbod(h.zin), k: [T.ja, T.zelf, T.nee] };
}
async function hulpDeel(s, p) { const T = hulpT(s.ctx && s.ctx.taal), code = await refCode(p.vid), url = 'https://wearemany.now/?h=' + s.hulpNu.hid + '&r=' + code; return { v: 'hulp', e: 'hulp', x: T.deelX, m: T.deelM(s.hulpNu.zin), tx: T.deelM(s.hulpNu.zin) + ' ' + url, url, ui: Object.assign({}, DEEL_UI[s.ctx && s.ctx.taal === 'nl' ? 'nl' : 'en'] || DEEL_UI.en) }; }
// landing via ?h=: de vraag, plus wat de doorstuurder zelf zoekt (wie verbindt, wordt verbonden)
async function hulpOpener(params, vid, taal) {
  if (!/^[0-9a-f]{8}$/.test(String(params.h || ''))) return null;
  const hv = await kv.get('wam:hulp:' + params.h).catch(() => null); if (!hv) return null;
  const T = hulpT(taal); let rv = null, ook = '';
  if (/^[0-9a-f]{8}$/.test(String(params.r || ''))) { rv = await kv.get('wam:ref:' + params.r).catch(() => null); if (rv === vid) rv = null; }
  if (rv) { const st = await zoekStand().catch(() => ({ lijst: [] })); const z = st.lijst.find(x => String(x.k).startsWith(rv + ':')); if (z) ook = '\n\n' + T.ook(itemZin(z)); }
  return { hulp: { hid: params.h, zin: hv.zin, gen: N(hv.gen) + 1 }, ref: rv ? { r: params.r, d: 'hulp-ken', vid: rv } : null, opener: { id: 'hulp', taal, familie: 'ref', tekst: T.land(hv.zin) + ook, knoppen: [T.helpK, T.kenK, T.andersK] } };
}
export async function hulpStand() {
  const h = await hget('wam:hulpst').catch(() => ({})), d = await hget('wam:doorab').catch(() => ({})), ab = {};
  for (const [k, v] of Object.entries(d)) { const [a, f] = k.split('|'); (ab[a] = ab[a] || { g: 0, k: 0, s: 0 })[f] = N(v); }
  const keten = ((await kv.raw(['LRANGE', 'wam:hulpketen', '-30', '-1']).catch(() => [])) || []).map(j => { try { return JSON.parse(j); } catch (e) { return null; } }).filter(Boolean);
  return { totaal: Object.fromEntries(Object.entries(h).map(([k, v]) => [k, N(v)])), moment: ab, keten_laatste: keten };
}
async function mpMaak(p, s, mk) {
  const A = mk.eigen, B = mk.ander, vb = String(B.k).split(':')[0], id = h12([A.k, B.k].sort().join('|'));
  let mp = await kv.get('wam:mp:' + id).catch(() => null);
  if (!mp) { mp = { a: p.vid, b: vb, za: String(A.k).split(':')[1], zb: String(B.k).split(':')[1], wa: A.wat, wb: B.wat, ka: A.kant || 'zoekt', kb: B.kant || 'zoekt', sa: (s.ctx && s.ctx.stad) || '', sb: B.waar || '', waarom: 'direct', t: Date.now(), ja: {}, nr: {} }; await kv.raw(['SADD', 'wam:mparen', id]).catch(() => {}); }
  mp.ja = mp.ja || {}; mp.ja[p.vid] = 1; await kv.set('wam:mp:' + id, mp);
  p.matches = [...(p.matches || []).filter(x => x.id !== id), { id, eigen: A.wat, ander: B.wat, status: 'ja', t: Date.now() }].slice(-10);
  return { id, mp, naar: vb };
}
const mpAnder = (mp, vid) => mp.a === vid ? { vid: mp.b, wat: mp.wb, kant: mp.kb, stad: mp.sb } : { vid: mp.a, wat: mp.wa, kant: mp.ka, stad: mp.sa };
const mpEigen = (mp, vid) => mp.a === vid ? { wat: mp.wa, kant: mp.ka, stad: mp.sa } : { wat: mp.wb, kant: mp.kb, stad: mp.sb };
// knoppen en getypte berichten in de matchroute, zonder AI; geeft null als het bericht hier niet bij hoort
async function matchRoute(p, s, tekst, knop, velden, TEST) {
  const taal = s.ctx.taal || 'en', T = mt(taal), V = ctaTekst('verbind', s), NR = MNR[taal] || MNR.en, AW = MANTW[taal] || MANTW.en, NE = MNEE[taal] || MNEE.en;
  const klaar = (x, k = []) => ({ x, k });
  if (knop && s.mlater && tekst === s.mlater.x) {
    await telMl(s.mlater.id, 'k', TEST); velden.ml_tik = 1;
    if (s.mlater.kanaal === 'mail') { s.wachtMail = 1; return Object.assign(klaar(T.laterMail, []), { g: 1 }); }
    if (s.mlater.kanaal === 'tg' && process.env.WAM_TG_BOT) { const code = await contactCode(p.vid); if (!TEST) await kv.set('wam:mltg:' + p.vid, { id: s.mlater.id, zw: s.mlater.zw }, { ex: 7 * 86400 }).catch(() => {}); return klaar(T.laterTg + ' https://t.me/' + process.env.WAM_TG_BOT + '?start=wam' + code, []); }
    if (s.mlater.id === 'wa1' && WA.nr) { const code = await contactCode(p.vid); if (!TEST) await kv.set('wam:mlwa:' + p.vid, { id: s.mlater.id, zw: s.mlater.zw }, { ex: 7 * 86400 }).catch(() => {}); return klaar(T.laterWa + ' ' + waLink(code, taal), []); }
    s.wachtNr = { later: true, zw: s.mlater.zw }; return klaar(T.laterNr, []);
  }
  if (knop && (tekst === V || ALLE_VERBIND.has(tekst)) && s.matchKand) {
    if (!s.ctaK) { s.ctaK = 1; await telCta('verbind', s, 'k', TEST); }
    if (s.raD && !s.raDv) { s.raDv = 1; await telDiepte(s.raD, 'v', TEST); }
    if (s.matchKand.eigen) await LEER.vbUitkomst(s.matchKand.eigen.k, 'c', '', TEST);
    if (TEST) return klaar(T.schrijf, [NR]);
    const r = await mpMaak(p, s, s.matchKand); s.schrijf = { mp: r.id, naar: r.naar }; s.matchVerbonden = 1; velden.verbind = 1;
    // liet de ander al een nummer of mail achter om later gemeld te worden? dan meteen gebruiken
    const zA = s.matchKand.ander && s.matchKand.ander.k; let heeftNr = false;
    if (zA) {
      const nrPre = await kv.raw(['HGET', 'wam:zwnr', zA]).catch(() => null);
      if (nrPre) { r.mp.nr = r.mp.nr || {}; r.mp.nr[r.naar] = String(nrPre); r.mp.ja = r.mp.ja || {}; r.mp.ja[r.naar] = 1; await kv.set('wam:mp:' + r.id, r.mp); heeftNr = true; velden.ml_raak_nr = 1; }
      const mailPre = await kv.raw(['HGET', 'wam:zwmail', zA]).catch(() => null);
      if (mailPre && r.mp.waarom !== 'wachter') { const e0 = mpEigen(r.mp, p.vid); if (await mailLater(r.naar, String(mailPre), e0, 'en')) velden.ml_raak_mail = 1; }
    }
    const e = mpEigen(r.mp, p.vid); if (await inboxIn(r.naar, { soort: 'kans', mp: r.id, van: p.vid, wat: e.wat, kant: e.kant, stad: e.stad })) velden.ml_raak_tg = 1;
    await meld('WAM: iemand tikte "verbind me": "' + kort(e.wat, 60) + '" met "' + kort(mpAnder(r.mp, p.vid).wat, 60) + '" (' + (s.ctx.land || '') + ').').catch(() => {});
    const e1 = mpEigen(r.mp, p.vid), taal1 = s.ctx.taal || 'en'; s.voorstel = kort((MVOORSTEL[taal1] || MVOORSTEL.en)(e1.kant, kort(e1.wat, 90)), 200);
    const SU = MSTUUR[taal1] || MSTUUR.en;
    return klaar((heeftNr ? T.heeftNr + '\n\n' : '') + (MVOOR[taal1] || MVOOR.en)(s.voorstel), [SU, NR]);
  }
  if (knop && s.voorstel && s.schrijf && tekst === (MSTUUR[taal] || MSTUUR.en)) { tekst = s.voorstel; knop = false; velden.voorstel_verstuurd = 1; }
  if (knop && tekst === AW && s.antwoordOp) { s.schrijf = { mp: s.antwoordOp.mp, naar: s.antwoordOp.naar }; return klaar(T.antw, []); }
  if (knop && tekst === NE && s.antwoordOp) { const mp = await kv.get('wam:mp:' + s.antwoordOp.mp).catch(() => null); if (mp) { mp.ja = mp.ja || {}; mp.ja[p.vid] = 0; await kv.set('wam:mp:' + s.antwoordOp.mp, mp); await LEER.vbUitkomst(mp.a + ':' + mp.za, 'n', '', TEST); await LEER.vbUitkomst(mp.b + ':' + mp.zb, 'n', '', TEST); velden.niet_geinteresseerd = 1; } s.antwoordOp = null; s.schrijf = null; return klaar(T.nee2, []); }
  if (knop && tekst === NR && (s.schrijf || s.antwoordOp)) { const w = s.schrijf || s.antwoordOp; s.wachtNr = { mp: w.mp, naar: w.naar }; return klaar(T.nrVraag, []); }
  // e-mail in plaats van een nummer, of midden in een bericht (Henkjan 11 nov 19:50 UTC: "Ja ze mogen ook gewoon emailadres typen dan mailen we")
  const mm = !knop && (s.wachtNr || s.schrijf) ? tekst.match(MAIL) : null;
  if (mm) {
    const w = s.wachtNr; s.wachtNr = null; const mail = mm[0].toLowerCase(), MT = MAILNU[taal] || MAILNU.en;
    if (!TEST) {
      p.contact = Object.assign(p.contact || {}, { mail, mailT: (p.contact && p.contact.mailT) || Date.now() }); velden.contact_mail_match = 1;
      if (w && w.later) { if (w.zw) await kv.raw(['HSET', 'wam:zwmail', w.zw, mail]).catch(() => {}); await telMl(s.mlater && s.mlater.id, 'c', TEST); s.mlater = null; velden.ml_c = 1; }
    }
    return klaar(s.schrijf ? MT[1] : MT[0], []);
  }
  if (!knop && s.wachtNr) {
    const m = tekst.match(TEL); const nr = m ? m[1].replace(/[^\d+]/g, '') : '';
    if (!nr || nr.replace(/\D/g, '').length < 9) { if (/\d{3}/.test(tekst)) return klaar(T.nrFout, []); s.wachtNr = null; return null; }
    const w = s.wachtNr; s.wachtNr = null;
    if (w.later) {
      if (TEST) return klaar(T.laterOk, []);
      p.contact = Object.assign(p.contact || {}, { tel: nr, telT: Date.now() });
      velden.contact = 1; velden.contact_tel = 1; velden.ml_c = 1; const D0 = dag();
      await telOpener(s.opener, 'c', D0, TEST); await telHook(s.hook, 'c', D0, TEST); await telTitel(s.adTekst, 'c', D0, TEST); await telUx(s.ux, 'c', TEST);
      if (s.params && s.params.mmc) await clickmind(s.params.mmc, 'aanmelding');
      if (w.zw) await kv.raw(['HSET', 'wam:zwnr', w.zw, nr]).catch(() => {});
      await telMl(s.mlater && s.mlater.id, 'c', TEST); s.mlater = null;
      await meld('WAM: iemand liet zijn WhatsApp achter om later gematcht te worden (' + (s.ctx.land || '') + ').').catch(() => {});
      return klaar(T.laterOk, []);
    }
    if (TEST) return klaar(T.nrOk, []);
    p.contact = Object.assign(p.contact || {}, { tel: nr, telT: Date.now() });
    velden.contact = 1; velden.contact_tel = 1; velden.nr_gedeeld = 1; const D = dag();
    await telOpener(s.opener, 'c', D, TEST); await telHook(s.hook, 'c', D, TEST); await telTitel(s.adTekst, 'c', D, TEST); await telUx(s.ux, 'c', TEST);
    if (s.params && s.params.mmc) await clickmind(s.params.mmc, 'aanmelding');
    const mp = await kv.get('wam:mp:' + w.mp).catch(() => null); if (!mp) return klaar(T.nrOk, []);
    mp.nr = mp.nr || {}; mp.nr[p.vid] = nr; mp.ja = mp.ja || {}; mp.ja[p.vid] = 1; await kv.set('wam:mp:' + w.mp, mp);
    const ander = mpAnder(mp, p.vid), nrA = mp.nr[ander.vid];
    if (nrA && mp.ja[ander.vid]) {
      await inboxIn(ander.vid, { soort: 'nummer', mp: w.mp, nr }); mp.gekoppeld = Date.now(); if (!mp.tw) { mp.tw = Date.now(); velden.tweezijdig = 1; await LEER.vbUitkomst(mp.a + ':' + mp.za, 'j', '', TEST); await LEER.vbUitkomst(mp.b + ':' + mp.zb, 'j', '', TEST); } await kv.set('wam:mp:' + w.mp, mp); velden.nr_uitgewisseld = 1;
      await meld('WAM: echte koppeling, twee mensen wisselden hun WhatsApp uit: "' + kort(mp.wa, 50) + '" en "' + kort(mp.wb, 50) + '".').catch(() => {});
      return klaar(T.nummer(nrA), []);
    }
    await inboxIn(ander.vid, { soort: 'nrvraag', mp: w.mp, van: p.vid });
    return klaar(T.nrOk, []);
  }
  if (!knop && s.schrijf && s.schrijf.naar) {
    if (/https?:\/\/|www\.|\.com\b|\.ca\b/i.test(tekst)) return klaar(T.link, []);
    const w = s.schrijf; s.schrijf = null; s.voorstel = null; if (TEST) return klaar(T.verstuurd, [NR]);
    const mp = await kv.get('wam:mp:' + w.mp).catch(() => null); if (!mp) return klaar(T.geen, []);
    mp.ja = mp.ja || {}; mp.ja[p.vid] = 1; mp.n = N(mp.n) + 1; mp.van = mp.van || {}; mp.van[p.vid] = N(mp.van[p.vid]) + 1;
    if (N(mp.van[mpAnder(mp, p.vid).vid]) > 0 && !mp.tw) { mp.tw = Date.now(); velden.tweezijdig = 1; await LEER.vbUitkomst(mp.a + ':' + mp.za, 'j', '', TEST); await LEER.vbUitkomst(mp.b + ':' + mp.zb, 'j', '', TEST); }
    await kv.set('wam:mp:' + w.mp, mp);
    const e = mpEigen(mp, p.vid); const bereikt = await inboxIn(w.naar, { soort: 'bericht', mp: w.mp, van: p.vid, x: kort(tekst, 400), wat: e.wat, kant: e.kant, stad: e.stad });
    s.antwoordOp = { mp: w.mp, naar: w.naar }; velden.bericht_door = 1;
    await meld('WAM: bericht doorgegeven tussen twee mensen ("' + kort(mp.wa, 40) + '" en "' + kort(mp.wb, 40) + '").').catch(() => {});
    if (bereikt) velden.bericht_bereikt = 1; if (!s.ctaB) { s.ctaB = 1; await telCta('verbind', s, 'b', TEST); if (bereikt) await telCta('verbind', s, 'r', TEST); }
    if (s.ctx && s.ctx.kanaal === 'whatsapp') return klaar({ nl: 'Verstuurd. Hun antwoord komt hier in WhatsApp binnen.', de: 'Gesendet. Die Antwort kommt hier in WhatsApp an.' }[taal] || 'Sent. Their answer comes in right here in WhatsApp.', []);
    return klaar(bereikt || (p.contact && p.contact.mail) ? T.verstuurd : (T.verstuurdLater || T.verstuurd), [NR]);
  }
  return null;
}
// de chat haalt elke 20 s de inbox op: berichten, kansen en nummers van mensen met wie ze verbonden zijn
export async function inbox(sid, tok) {
  if (!(await tokOk(sid, tok))) return { ok: false };
  const s = await sessie(sid); if (!s) return { ok: false };
  const k = 'wam:inbox:' + s.vid; const l = await kv.raw(['LRANGE', k, '0', '-1']).catch(() => []) || [];
  if (!Array.isArray(l) || !l.length) return { ok: true, items: [] };
  await kv.raw(['DEL', k]).catch(() => {});
  const taal = (s.ctx && s.ctx.taal) || 'en', T = mt(taal), NR = MNR[taal] || MNR.en, AW = MANTW[taal] || MANTW.en, NE = MNEE[taal] || MNEE.en;
  const items = [];
  for (const r of l) {
    let it; try { it = typeof r === 'string' ? JSON.parse(r) : r; } catch (e) { continue; }
    const r0 = itemTekst(it, taal); if (!r0) continue; items.push(r0);
    if (it.van) s.antwoordOp = { mp: it.mp, naar: it.van };
    else if (it.mp) { const mp = await kv.get('wam:mp:' + it.mp).catch(() => null); if (mp) s.antwoordOp = { mp: it.mp, naar: mpAnder(mp, s.vid).vid }; }
  }
  for (const it of items) s.berichten.push({ r: 'b', t: Date.now(), x: it.x, k: it.k, inbox: true });
  s.laatste = Date.now(); s.eind = null; await bewaarSessie(s);
  await tel({ inbox_gelezen: items.length }, dag(), !!(s.ctx && s.ctx.test));
  return { ok: true, items };
}
const LANDCODE = { CA: '+1', US: '+1', NL: '+31', BE: '+32', DE: '+49', GB: '+44', IN: '+91', CO: '+57', CW: '+599', FR: '+33', ES: '+34', AU: '+61', MX: '+52', BR: '+55' };
// de kracht van WAM laten zien (Henkjan 12 nov 21:09 UTC: "iedereen is toegang tot iedereen via WAM, zeker met dichtheid hyperlokaal ... leer ze ook gewoon
// dingen vragen over anderen die erin zitten"): vragen als 'who near me sells a bike?' of 'hoeveel mensen zoeken een kamer?' krijgen meteen een telling en
// tot 3 voorbeelden uit de anonieme lijst, met daarna één tik om zelf contact te zoeken; en een regel met wat er nu in de stad leeft
const RA_ANDER = /^(?:who|anyone|anybody|does anyone|is there anyone|is anyone|are there(?: people)?|how many(?: people)?|wie|is er iemand|zijn er mensen|hoeveel(?: mensen)?)\s+(.{3,100})$/i;
const ANDER_BIED = /\b(sells?|selling|has|have|offers?|offering|rents?|renting|fix(?:es)?|repairs?|teach(?:es)?|does|can|verkoopt|verkopen|heeft|hebben|biedt|bieden|verhuurt|verhuren|repareert|kan|doet)\b/i;
const ANDER_ZOEK = /\b(looks?|looking|needs?|wants?|search(?:es|ing)?|zoekt|zoeken|wil|willen|nodig)\b/i;
const ANDER_X = { en: { ja: (n, st, b) => 'Right now ' + n + (n === 1 ? ' person' : ' people') + (st ? ' in ' + st : ' here') + (b ? (n === 1 ? ' offers' : ' offer') + ' something like this:' : (n === 1 ? ' is' : ' are') + ' looking for something like this:'), nee: b => 'Nobody near you ' + (b ? 'offers' : 'is looking for') + ' that yet. New people come in every day.', door: 'Want me to connect you? Two quick questions and I do it.', knop: ['Yes, connect me', 'Just looking'], tip: 'Tip: ask me about others here anytime, like "who near me sells a bike?" or "how many people look for a room?"', leeft: (st, d) => 'Live in ' + st + ' right now: ' + d + '.' },
  nl: { ja: (n, st, b) => 'Nu ' + (b ? (n === 1 ? 'biedt ' : 'bieden ') : (n === 1 ? 'zoekt ' : 'zoeken ')) + n + (n === 1 ? ' persoon' : ' mensen') + (st ? ' in ' + st : ' hier') + (b ? ' zoiets aan:' : ' zoiets:'), nee: b => 'Nog niemand bij jou in de buurt ' + (b ? 'biedt' : 'zoekt') + ' dat. Er komen elke dag mensen bij.', door: 'Zal ik je verbinden? Twee korte vragen en ik doe het.', knop: ['Ja, verbind me', 'Ik kijk even rond'], tip: 'Tip: vraag me altijd naar anderen hier, zoals "wie in de buurt verkoopt een fiets?" of "hoeveel mensen zoeken een kamer?"', leeft: (st, d) => 'Nu live in ' + st + ': ' + d + '.' } };
async function dichtheidZin(land, stad, taal) { const b = await bordVoor(land, taal).catch(() => null); if (!b || !b.chips || !b.chips.length || !stad) return ''; return (ANDER_X[taal] || ANDER_X.en).leeft(stad, b.chips.slice(0, 3).map(c => c.n + ' ' + c.lab).join(', ')); }
const ALERTX = {
  en: { waNr: 'Your WhatsApp number, then WAM messages you there as soon as someone fits. Only that, nothing else.', waNrKnop: 'WhatsApp me', wa: 'Tap below and send the message that is already filled in. Then I message you on WhatsApp as soon as someone fits.', tg: 'Tap the link and press Start in Telegram. Then I message you there as soon as someone fits:', mail: 'Type your email here and I mail you as soon as someone fits. Nothing else.', sms: 'Texting starts soon. Type your mobile number with country code and you get your matches by text. Only that, nothing else.', nog: 'That one is not live yet, noted, so I know to add it. Pick another way for now:', smsOk: 'Saved. You get a text as soon as someone fits. Anything else you need?' },
  nl: { waNr: 'Je WhatsApp-nummer, dan stuurt WAM je daar een bericht zodra iemand past. Alleen dat.', waNrKnop: 'App me', wa: 'Tik hieronder en stuur het bericht dat al klaarstaat. Dan stuur ik je een WhatsApp zodra iemand past.', tg: 'Tik op de link en druk in Telegram op Start. Dan stuur ik je daar een bericht zodra iemand past:', mail: 'Typ hier je e-mailadres, dan mail ik je zodra iemand past. Verder niets.', sms: 'Sms komt binnenkort. Typ je mobiele nummer met landcode, dan krijg je je matches per sms. Alleen dat.', nog: 'Die hebben we nog niet, genoteerd zodat ik weet dat die erbij moet. Kies voor nu een andere manier:', smsOk: 'Bewaard. Je krijgt een sms zodra iemand past. Nog iets anders nodig?' }
};
const VEILIG_NEE = {
  en: { x: 'I can\'t put that on WAM. WAM is for normal, legal things between people nearby. Something else I can find for you?', prive_persoon: 'WAM does not help find a specific person. Is there something else you need or offer?', onzin: 'I didn\'t quite get that. Tell me in a few words what you need or offer.', riskant: 'I don\'t put gift cards or paying upfront on WAM, scammers use that a lot. Something else?' },
  nl: { x: 'Dat zet ik niet op WAM. WAM is voor gewone, legale dingen tussen mensen in de buurt. Kan ik iets anders voor je vinden?', prive_persoon: 'WAM helpt niet om een bepaald persoon te vinden. Zoek of bied je iets anders?', onzin: 'Dat snap ik niet helemaal. Zeg in een paar woorden wat je zoekt of aanbiedt.', riskant: 'Cadeaukaarten en vooraf betalen zet ik niet op WAM, dat gebruiken oplichters vaak. Iets anders?' }
};
// geblokt: alle open items van die persoon uit de matchlijst
async function blokOpruimen(vid) {
  const p = await profiel(vid).catch(() => null); if (!p) return;
  for (const x of [...(p.zoektochten || []), ...(p.aanbod || [])]) { await kv.raw(['HDEL', 'wam:zw', vid + ':' + x.id]).catch(() => {}); if (x.status === 'open') x.status = 'blok'; }
  p.blok = Date.now(); await bewaarProfiel(p).catch(() => {});
}
export async function zeg({ sid, tok, x, knop, ip }) {
  if (!(await tokOk(sid, tok))) return { ok: false, fout: 'sessie' };
  const s = await sessie(sid); if (!s) return { ok: false, fout: 'sessie verlopen' };
  await waLaad();
  // ken jij iemand: 'ik kan het zelf' / 'ik kan helpen' wordt een eigen aanbod, zodat de match vanzelf volgt
  if (knop && s.hulpNu && [HULP.en.zelf, HULP.nl.zelf, HULP.en.helpK, HULP.nl.helpK].includes(knop)) { const T = hulpT(s.ctx && s.ctx.taal); hulpTel(s.hulpNu.hid, s.hulpLand ? 'help' : 'zelf', !!(s.ctx && s.ctx.test)); if (!s.hulpLand) doorTel('ken', 'k', !!(s.ctx && s.ctx.test)); knop = T.offer(s.hulpNu.zin); }
  if (knop && s.pkn && s.pkn[knop]) { const [pid, basis] = s.pkn[knop]; s.flowId = pid; if (!s.pknTik) { s.pknTik = pid; if (!(s.ctx && s.ctx.test)) kv.raw(['HINCRBY', 'wam:pkn', pid + '|k', '1']).catch(() => {}); } knop = basis; } // lerende tikopties: tik telt, het getal erachter gaat niet mee de flow in
  const tekst = kort(x || knop || '', 1200); if (!tekst) return { ok: false, fout: 'leeg' };
  // vandalen (Henkjan 12 nov 19:12 UTC: "goed beveiligen als er vandalen tussen zitten"): geblokt = dicht, te snel = niets,
  // onveilige inhoud (seks, drugs, wapens, oplichting, dreiging, schelden) = weigeren plus strafpunt, 3 punten = blok
  // (items uit de matchlijst, geen berichten meer naar anderen), report of spam tegen een match = melding over de ander
  const tl0 = (s.ctx && s.ctx.taal) || 'en', T0 = !!(s.ctx && s.ctx.test);
  if (await LEER.geblokt(s.vid)) return { ok: true, x: tl0 === 'nl' ? 'Dit gesprek is gesloten.' : 'This conversation is closed.', knoppen: [] };
  if (!(await LEER.tempoOk('s' + s.vid, { perMin: 15, perDag: 300 }))) return { ok: false, fout: 'te snel' };
  if (!knop && LEER.MELD_RE.test(tekst.trim()) && (s.antwoordOp || s.schrijf)) {
    const w = s.antwoordOp || s.schrijf; const mp = await kv.get('wam:mp:' + w.mp).catch(() => null); s.antwoordOp = null; s.schrijf = null;
    if (mp) { mp.stop = Date.now(); await kv.set('wam:mp:' + w.mp, mp).catch(() => {}); const r = await LEER.meldAnder(s.vid, w.naar, T0); if (r.blok && r.nieuw) { await blokOpruimen(w.naar); await meld('WAM: iemand geblokkeerd na twee meldingen van anderen (' + ((s.ctx && s.ctx.land) || '') + ').').catch(() => {}); } await LEER.vbUitkomst(mp.a + ':' + mp.za, 'n', '', T0); await LEER.vbUitkomst(mp.b + ':' + mp.zb, 'n', '', T0); }
    const x0 = tl0 === 'nl' ? 'Gemeld, dank je. Je hoort niets meer van deze persoon.' : 'Reported, thank you. You will not hear from this person again.';
    s.berichten.push({ r: 'u', t: Date.now(), x: tekst }, { r: 'b', t: Date.now(), x: x0 }); await bewaarSessie(s); await tel({ gemeld: 1 }, dag(), T0); return { ok: true, x: x0, knoppen: [] };
  }
  const vg = knop ? null : LEER.veilig(tekst);
  if (vg) {
    let x0 = VEILIG_NEE[tl0 === 'nl' ? 'nl' : 'en'][vg.reden] || VEILIG_NEE[tl0 === 'nl' ? 'nl' : 'en'].x;
    if (vg.ernst >= 2) { const r = await LEER.straf(s.vid, vg.reden, vg.ernst, T0); if (r.blok) { x0 = tl0 === 'nl' ? 'Dit gesprek is gesloten.' : 'This conversation is closed.'; if (r.nieuw) { await blokOpruimen(s.vid); await meld('WAM: iemand geblokkeerd (' + vg.reden + ', ' + ((s.ctx && s.ctx.land) || '') + ').').catch(() => {}); } } }
    s.berichten.push({ r: 'u', t: Date.now(), x: kort(tekst, 200), weg: vg.reden }, { r: 'b', t: Date.now(), x: x0 }); s.beurten += 1; await bewaarSessie(s); await tel({ ['onveilig_' + vg.reden]: 1 }, dag(), T0);
    return { ok: true, x: x0, knoppen: [] };
  }
  // grenzen tegen misbruik
  if (s.beurten >= 40) return { ok: true, x: s.ctx.taal === 'nl' ? 'Dit gesprek is lang genoeg geworden. Begin gerust een nieuw gesprek.' : 'This conversation got long. Feel free to start a new one.', knoppen: [] };
  const ipk = 'wam:ip:' + dag() + ':' + h12(ip || '-'); const nIp = N(await kv.incr(ipk).catch(() => 0)); if (nIp === 1) kv.raw(['EXPIRE', ipk, '90000']).catch(() => {});
  if (nIp > 150) return { ok: false, fout: 'te veel' };
  const D = dag(); const velden = {}; const TEST = !!(s.ctx && s.ctx.test); s.fout = '';
  s.berichten.push({ r: 'u', t: Date.now(), x: tekst, knop: !!knop });
  if (!TEST) { kv.raw(['ZADD', 'wam:actief', String(Date.now()), s.vid]).catch(() => {}); if (Math.random() < 0.05) kv.raw(['ZREMRANGEBYSCORE', 'wam:actief', '-inf', String(Date.now() - 3600000)]).catch(() => {}); } // live regel: nu in gesprek
  s.beurten += 1; velden['beurt' + Math.min(s.beurten, 10)] = 1; if (s.neeV && !s.neeVerder) { s.neeVerder = 1; await telNee(s.neeV, 'v', TEST); velden.nee_verder = 1; }
  // echte dialoog (Henkjan 10 nov 20:33: "Zorg dat je triggert op mensen die werkelijk dialoog hebben en dus waardevol zijn"): de 3e beurt, of al de 2e als
  // iemand zelf iets typt. Dat is de conversie voor het netwerk (wissel wam pb = dialoog); een zone die één keer tikt en vertrekt leert het netwerk niets meer.
  if (!s.dialoog && (s.beurten >= 3 || (s.beurten >= 2 && !knop))) { s.dialoog = 1; velden.dialoog = 1; if (s.pknTik && !TEST) kv.raw(['HINCRBY', 'wam:pkn', s.pknTik + '|d', '1']).catch(() => {}); if (s.machtG && s.macht && !TEST) kv.raw(['HINCRBY', 'wam:macht', s.macht + '|d', '1']).catch(() => {}); await telStart(s.start || 'web', 'd', TEST); if (s.start === 'wa' && s.ctx && s.ctx.kanaal === 'whatsapp') await LEER.waLog(s, 'dialoog', TEST).catch(() => {}); if (s.start === 'wa') await telCta('wastart', s, 'd', TEST); if (s.cta && s.cta.intro) await telCta('intro', s, 'd', TEST); if (s.ref && !s.refGemeld) { s.refGemeld = 1; velden.ref_dialoog = 1; const [dv, dm, dc] = String(s.ref.d || '').split('-'); await telDeel(dv, dm, 'dl', TEST); if (dc) await telCta(dv === 'wa' ? 'wadeel' : 'deel', { ctx: s.ctx, cta: { [dv === 'wa' ? 'wadeel' : 'deel']: dc } }, 'dl', TEST); if (!TEST) await inboxIn(s.ref.vid, { soort: 'tekst', x: REF_MELD[s.ctx.taal] || REF_MELD.en }).catch(() => false); } if (s.params && s.params.mmc && !TEST) await clickmind(s.params.mmc, 'dialoog'); } if (knop) velden.knoptik = 1; else velden.getypt = 1;
  if (s.beurten === 3) { await telUx(s.ux, 'b3', s.ctx && s.ctx.test); await telOpener(s.opener, 'b3', dag(), s.ctx && s.ctx.test); }
  let p = (await profiel(s.vid)) || nieuwProfiel(s.vid, s.ctx);
  await alvContact(s, p).catch(() => {});
  if (!s.echt) { // eerste bewuste stap: echt mens (vroege conversie voor het netwerk)
    s.echt = true; velden.echt = 1; if (!TEST && s.ctx && s.ctx.stad) { const sk = 'wam:stad:' + D; kv.raw(['HINCRBY', sk, String(s.ctx.land || '').toUpperCase() + '|' + s.ctx.stad, '1']).catch(() => {}); kv.raw(['EXPIRE', sk, String(3 * 86400)]).catch(() => {}); } await telOpener(s.opener, 'e', D, TEST); await telHook(s.hook, 'e', D, TEST); await telTitel(s.adTekst, 'e', D, TEST); await telUx(s.ux, 'e', TEST);
    p.bezoeken = N(p.bezoeken) + 1; p.sessies = [...(p.sessies || []), s.sid].slice(-8);
    if (s.params && s.params.mmc) await clickmind(s.params.mmc, 'echt');
    await telStart(s.start || 'web', 'e', TEST);
    if (s.ref) { velden.ref_echt = 1; const [dv, dm, dc] = String(s.ref.d || '').split('-'); await telDeel(dv, dm, 'a', TEST); if (dc) await telCta(dv === 'wa' ? 'wadeel' : 'deel', { ctx: s.ctx, cta: { [dv === 'wa' ? 'wadeel' : 'deel']: dc } }, 'a', TEST); }
    if (!TEST) await kv.raw(['RPUSH', 'wam:sessies:' + D, s.sid]).catch(() => {}); kv.raw(['EXPIRE', 'wam:sessies:' + D, String(TTL.s)]).catch(() => {});
  }
  // e-mailadres in het bericht: contact vastleggen
  let extra = '';
  const m = tekst.match(MAIL);
  if (m && !(p.contact && p.contact.mail)) {
    p.contact = Object.assign(p.contact || {}, { mail: m[0].toLowerCase(), mailT: Date.now() });
    velden.contact = 1; velden.contact_mail = 1; await telOpener(s.opener, 'c', D, TEST); await telHook(s.hook, 'c', D, TEST); await telTitel(s.adTekst, 'c', D, TEST); await telUx(s.ux, 'c', TEST);
    if (s.params && s.params.mmc) await clickmind(s.params.mmc, 'aanmelding');
    if (s.cpil) await telCpil(s.cpil, 'c', TEST);
    extra = 'The user just gave their email address. Thank them briefly, confirm what you will send or tell them, and continue helping.';
    if (!TEST && (s.raZw || []).length) { for (const k of s.raZw) await kv.raw(['HSET', 'wam:zwmail', k, m[0].toLowerCase()]).catch(() => {}); await kv.set('wam:mailvid:' + m[0].toLowerCase(), p.vid, { ex: TTL.p }).catch(() => {}); velden.ra_mail = 1; }
    if (s.mlater && (s.wachtMail || s.mlater.kanaal === 'mail')) { if (!TEST && s.mlater.zw) { await kv.raw(['HSET', 'wam:zwmail', s.mlater.zw, m[0].toLowerCase()]).catch(() => {}); await kv.set('wam:mailvid:' + m[0].toLowerCase(), p.vid, { ex: TTL.p }).catch(() => {}); } await telMl(s.mlater.id, 'c', TEST); velden.ml_c = 1; s.wachtMail = 0; s.mlater = null; extra = 'The user just gave their email so WAM can email them the moment someone here matches what they offer or look for. Confirm that in one short sentence and continue helping.'; }
  }
  // contact met het team (Henkjan 10 nov: "Voor contact met mij stuur je ze gewoon naar chat"): de footerlink zet 'Hi WAM team, ' in de chat
  if (!knop && /^(hi wam team|hoi wam-team|hallo wam-team)/i.test(tekst)) { if (!TEST) await meld('WAM contactbericht via de chat (' + ((s.ctx && s.ctx.land) || '') + '): "' + kort(tekst, 400) + '"').catch(() => {}); velden.contact_team = 1; extra = (extra ? extra + '\n' : '') + 'This message is for the human team behind WAM. Say in one short sentence that the team got it and reads every message, then ask how they want an answer if they want one (email or Telegram).'; }
  // groepsvraag (kring): antwoord van een groepslid, interesse in een besloten WAM, alle antwoorden zien, een vraag aan je eigen groep
  {
    const KT = krT(s.ctx && s.ctx.taal), KT2 = x => hulpT(x.ctx && x.ctx.taal), web = !(s.ctx && s.ctx.kanaal && s.ctx.kanaal !== 'web');
    const klaar = async (x0, knoppen, extra = {}) => { s.berichten.push({ r: 'b', t: Date.now(), x: x0, k: knoppen }); s.laatste = Date.now(); await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]); return { ok: true, x: x0, knoppen, ...extra }; };
    // 0. ken jij iemand: doorsturen of niemand
    if (knop && s.hulpNu && [HULP.en.ja, HULP.nl.ja, HULP.en.kenK, HULP.nl.kenK].includes(tekst)) { const dl = await hulpDeel(s, p); velden.hulp_door = 1; hulpTel(s.hulpNu.hid, s.hulpLand ? 'ken' : 'ja', TEST); if (!s.hulpLand) doorTel('ken', 'k', TEST); return klaar(KT2(s).deelX, [], web ? { deel: dl } : { waExtra: [dl.tx] }); }
    if (knop && s.hulpNu && [HULP.en.nee, HULP.nl.nee].includes(tekst)) { velden.hulp_nee = 1; hulpTel(s.hulpNu.hid, 'nee', TEST); return klaar(KT2(s).neeX, []); }
    // 1. groepslid antwoordt (eerste getypte bericht na de link) en ziet daarna wat anderen zeiden
    if (s.krOpen && !s.krGedaan && !knop) {
      const k = await kringLaad(s.krOpen);
      if (k && k.maker !== s.vid) {
        s.krGedaan = 1; s.krVan = k.id; const r = await kringAntw(s, k, tekst, TEST); velden.kring_antw = 1; const K2 = krT(k.taal);
        const l = (await kringAntwoorden(k.id, 8)).filter(a => !(r.a && a.t === r.a.t && a.h === r.a.h)).slice(-5);
        return klaar(K2.bedankt(k.naam, r.n) + (l.length ? '\n\n' + K2.anderen + '\n' + l.map(a => '• ' + a.x).join('\n') : '') + '\n\n' + K2.verder(k.naam), [K2.eigenK]);
      }
    }
    // 2. besloten WAM (businessmodel, Henkjan 12 nov): eerlijke interesselijst, mail of nummer naar wam:prive
    if (s.prive && !knop) {
      const nr = (tekst.match(TEL) || [])[1] || '', mail = (tekst.match(MAIL) || [])[0] || '';
      if (mail || nr.replace(/\D/g, '').length >= 8) {
        const pv = s.prive; s.prive = null; velden.prive_contact = 1;
        if (!TEST) { await kv.raw(['RPUSH', 'wam:prive', JSON.stringify({ t: Date.now(), kr: pv.kr || '', naam: pv.naam || '', land: String(s.ctx.land || '').toUpperCase(), mail: mail.toLowerCase(), tel: nr.replace(/[^\d+]/g, '') })]).catch(() => {}); await meld('WAM: interesse in een besloten WAM voor "' + kort(pv.naam || '?', 40) + '" (' + (s.ctx.land || '') + '), contact achtergelaten (lijst: op=prive).').catch(() => {}); }
        return klaar(KT.priveOk(pv.naam || (s.ctx.taal === 'nl' ? 'jullie groep' : 'your group')), []);
      }
      s.prive = null;
    }
    const prK = knop && [KR.en, KR.nl].some(T => tekst.startsWith(T.prive('')));
    if (prK || (!knop && KR_PRIVE.test(tekst))) {
      const id = s.krEigen || ((await kv.raw(['LRANGE', 'wam:krm:' + s.vid, '0', '0']).catch(() => [])) || [])[0]; const k = id ? await kringLaad(id) : null;
      const naam = k ? k.naam : (s.ctx.taal === 'nl' ? 'jullie groep' : 'your group');
      s.prive = { kr: k ? k.id : '', naam }; velden.prive_tik = 1; return klaar(KT.priveX(naam), []);
    }
    // 3. alle antwoorden op mijn laatste vraag, met korte samenvatting vanaf 4 antwoorden
    if (KR_ALLES.test(tekst.trim()) || (knop && (tekst === KR.en.alles || tekst === KR.nl.alles))) {
      const id = ((await kv.raw(['LRANGE', 'wam:krm:' + s.vid, '0', '0']).catch(() => [])) || [])[0]; const k = id ? await kringLaad(id) : null;
      if (k) { const o = await kringOverzicht(k, true); velden.kring_maker_kijk = 1; const T2 = krT(k.taal), dl = krDeel(k); s.krLaatst = { id: k.id, v: k.v };
        return klaar(o.x, o.n >= 3 ? [T2.prive(k.naam)] : [], web ? { deel: dl } : { waExtra: [dl.tx] }); }
      if (knop) return klaar(KT.geen, KT.welkeK);
    }
    // 4. een vraag aan je eigen groep: start (link, knop of "ask my church what's going on"), groep, vraag, deellink
    const krM = !knop && !s.krMaak && !s.matchKand && !s.schrijf && !s.antwoordOp ? tekst.trim().match(KR_RE) : null;
    const krStartK = knop && KR_START.has(tekst), krEigenK = knop && KR_EIGEN.has(tekst);
    if (s.krMaak && !knop && (RA_NEE.test(tekst.trim()) || (s.krMaak.stap === 'naam' && tekst.length > 60))) s.krMaak = null;
    if (krStartK || krEigenK || krM || s.krMaak) {
      let naam = s.krMaak && s.krMaak.naam, vraag = '';
      if (krEigenK) { const k = await kringLaad(s.krOpen || s.krVan); naam = k ? k.naam : ''; s.krMaak = naam ? { stap: 'vraag', naam } : { stap: 'naam' }; velden.kring_start = 1; }
      else if (krStartK) { s.krMaak = { stap: 'naam' }; velden.kring_start = 1; if (s.doorAb === 'kring') doorTel('kring', 'k', TEST); }
      else if (krM) { naam = krNaam(krM[1] + ' ' + krM[2], s.ctx.taal); vraag = krVraag(krM[3], s.ctx.taal); s.krMaak = { stap: 'vraag', naam }; velden.kring_start = 1; }
      else if (s.krMaak.stap === 'naam') { naam = krNaam(tekst.replace(/[.!?]+$/, ''), s.ctx.taal); s.krMaak = { stap: 'vraag', naam }; }
      else vraag = krVraag(tekst, s.ctx.taal);
      if (s.krMaak.stap === 'naam') return klaar(KT.welke, KT.welkeK);
      if (!vraag) return klaar(KT.vraag(naam), KT.vraagK);
      const kd = 'wam:krdag:' + D + ':' + s.vid, nDag = N(await kv.incr(kd).catch(() => 1)); if (nDag === 1) kv.raw(['EXPIRE', kd, '90000']).catch(() => {});
      s.krMaak = null; if (nDag > 5) return klaar(KT.teVeel, []);
      const k = await kringMaak(s, naam, vraag, TEST); s.krLaatst = { id: k.id, v: k.v }; velden.kring_maak = 1; if (k.gen > 1) velden.kring_gen2 = 1;
      await telUx(s.ux, 'v', TEST); await telOpener(s.opener, 'v', D, TEST);
      const dl = krDeel(k), x0 = KT.klaar(naam);
      return web ? klaar(x0, [], { deel: dl }) : klaar(x0 + '\n\n' + KT.waVoor, [], { waExtra: [dl.tx] });
    }
  }
  // vraag over anderen in WAM
  const am = !knop && String(tekst).trim().replace(/[?!.\s]+$/, '').match(RA_ANDER);
  if (am && !(s.matchKand || s.schrijf || s.antwoordOp || s.wachtNr)) {
    const rest = am[1], bied = ANDER_BIED.test(rest) || !ANDER_ZOEK.test(rest), tl = s.ctx.taal === 'nl' ? 'nl' : 'en', X = ANDER_X[tl];
    const wat = rest.replace(ANDER_BIED, ' ').replace(ANDER_ZOEK, ' ').replace(/\b(people|persons?|mensen|for|a|an|the|een|de|het|naar|voor|near me|nearby|around here|here|in (?:the|my) (?:area|neighbou?rhood)|bij mij in de buurt|in de buurt|hier)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    if (wat.length >= 2) {
      const eigen = { kant: bied ? 'zoekt' : 'biedt', wat, soort: '', eisen: '', waar: (s.ctx && s.ctx.stad) || '', land: String((s.ctx && s.ctx.land) || '').toUpperCase() }; eigen.soort = msoort(eigen);
      const dm = await directMatch(p.vid, eigen, s.ctx && s.ctx.stad).catch(() => null), n = dm ? (dm.stad || dm.n) : 0, st = dm && dm.stad ? (s.ctx && s.ctx.stad) : '';
      const x0 = (n ? X.ja(n, st, bied) + lijstRegels(dm.lijst) : X.nee(bied)) + '\n\n' + X.door;
      s.anderWens = (bied ? (tl === 'nl' ? 'Ik zoek ' : 'I need ') : (tl === 'nl' ? 'Ik bied ' : 'I offer ')) + wat; velden.vraag_ander = 1; if (n) velden.vraag_ander_ja = 1;
      // nog niemand? dan meteen doorsturen naar iemand die het wel heeft of zoekt (Henkjan: "Zo niet DAN doorsturen naar peer")
      const deelA = !n && !(s.ctx && s.ctx.kanaal === 'whatsapp') ? await deelKaart(s, p, ['vraag'], velden, TEST).catch(() => null) : null;
      s.berichten.push({ r: 'b', t: Date.now(), x: x0, k: X.knop }); s.laatste = Date.now(); await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]);
      return { ok: true, x: x0, knoppen: X.knop, contact: null, ...(n ? {} : { doorNu: 1 }), ...(deelA ? { deel: deelA } : {}) };
    }
  }
  // sms-nummer voor het seintje (12 nov): bewaren, telt als gegeven; sms versturen komt zodra er een nummer voor WAM is
  if (s.wachtWaNr && !knop) { const ms = tekst.match(/(\+?[\d][\d\s().-]{6,18}\d)/); let nr = ms ? ms[1].replace(/[^\d+]/g, '') : ''; if (nr && !nr.startsWith('+')) nr = (LANDCODE[String(s.ctx.land || '').toUpperCase()] || '') + nr.replace(/^0+/, ''); if (nr.replace(/\D/g, '').length >= 9) {
      s.wachtWaNr = 0; const tl = s.ctx.taal === 'nl' ? 'nl' : 'en'; velden.contact = 1; velden.contact_wanr = 1; await LEER.telAlert(s.ctx.land, 'wanr', 'k2', TEST);
      if (!TEST) { p.contact = Object.assign(p.contact || {}, { wanr: nr, wanrT: Date.now() }); const nDag = N(await kv.incr('wam:wanrd:' + dag()).catch(() => 0)); if (nDag === 1) kv.raw(['EXPIRE', 'wam:wanrd:' + dag(), '90000']).catch(() => {}); if (nDag <= Math.max(0, Number(process.env.WAM_WA_NIEUW_MAX || 40))) { const code = await contactCode(p.vid); const w = s.eigen && s.eigen.wat ? kort(s.eigen.wat, 80) : ''; await kv.raw(['RPUSH', 'wam:wanrq', JSON.stringify({ nr, code, tekst: (WAWELKOM[tl] || WAWELKOM.en)(w) })]).catch(() => {}); } if (s.params && s.params.mmc) await clickmind(s.params.mmc, 'aanmelding'); }
      const x0 = tl === 'nl' ? 'Top. Je krijgt zo een WhatsApp van WAM, en daar hoor je het zodra iemand past. Nog iets anders nodig?' : 'Great. You will get a WhatsApp from WAM in a moment, and that is where you hear it as soon as someone fits. Anything else you need?';
      s.berichten.push({ r: 'b', t: Date.now(), x: x0 }); await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]); return { ok: true, x: x0, knoppen: [] }; } else s.wachtWaNr = 0; }
  if (s.wachtSms && !knop) { const ms = tekst.match(TEL); const nr = ms ? ms[1].replace(/[^\d+]/g, '') : ''; if (nr.replace(/\D/g, '').length >= 9) { s.wachtSms = 0; const tl = s.ctx.taal === 'nl' ? 'nl' : 'en'; if (!TEST) { p.contact = Object.assign(p.contact || {}, { sms: nr, smsT: Date.now() }); for (const k of s.raZw || []) await kv.raw(['HSET', 'wam:zwsms', k, nr]).catch(() => {}); } velden.contact = 1; velden.contact_sms = 1; await LEER.telAlert(s.ctx.land, 'sms', 'c', TEST); if (s.params && s.params.mmc && !TEST) await clickmind(s.params.mmc, 'aanmelding'); const x0 = ALERTX[tl].smsOk; s.berichten.push({ r: 'b', t: Date.now(), x: x0 }); await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]); return { ok: true, x: x0, knoppen: [] }; } else s.wachtSms = 0; }
  if (m && s.alertKz === 'mail' && !s.alertC) { s.alertC = 1; await LEER.telAlert(s.ctx.land, 'mail', 'c', TEST); }
  // matchroute (verbinden, berichten doorgeven, nummers delen): zonder AI
  if (s.matchKand || s.schrijf || s.antwoordOp || s.wachtNr || s.mlater) {
    const r = await matchRoute(p, s, tekst, knop, velden, TEST).catch(e => { console.error('[wam] matchroute', e && e.message); return null; });
    if (r) {
      s.berichten.push({ r: 'b', t: Date.now(), x: r.x, k: r.k }); s.laatste = Date.now(); s.eind = null; p.taal = s.ctx.taal; p.land = s.ctx.land;
      await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]);
      return { ok: true, x: r.x, knoppen: r.k, contact: null, ...(r.g && process.env.WAM_GOOGLE_CLIENT_ID ? { google: 1 } : {}) };
    }
  }
  // knop op de opener van een vriend (Henkjan 12 nov): 'Ik heb dit' of 'Dit zoek ik' zet de andere kant erin en verbindt meteen met de vriend; 'Ik ken iemand' stuurt de vraag door
  if (knop && s.ref && s.ref.item && s.beurten === 1) {
    const RT = REF_UI[s.ctx.taal] || REF_UI.en, it = s.ref.item, ik = it.kant === 'biedt' ? 'biedt' : 'zoekt';
    let rx = null, rk = [], rdeel = null;
    if (tekst === RT.heb || tekst === RT.wil) {
      const kant = ik === 'biedt' ? 'zoekt' : 'biedt';
      const r = kant === 'biedt' ? await aanbod(p, s, { wat: it.wat, soort: it.soort || 'iets' }, TEST, true).catch(() => null) : await zoektocht(p, s, { wat: it.wat, soort: it.soort || 'iets', eisen: it.eisen || '' }, TEST, true).catch(() => null);
      if (r) { velden[kant === 'biedt' ? 'aanbod' : 'zoektocht'] = 1; velden.ref_heb = 1; const eigen = { k: p.vid + ':' + r.id, kant, wat: r.wat, soort: r.soort, eisen: r.eisen || '', waar: r.waar || r.stad, land: r.land }; s.eigen = eigen; s.raZw = [...(s.raZw || []), eigen.k].slice(-5); s.matchKand = { eigen, ander: Object.assign({ kant: ik }, it) }; s.matchGemeld = 1; rx = RT.ok; rk = [ctaTekst('verbind', s)]; await toonVerbind(s, TEST); }
    } else if (tekst === RT.ken) {
      const taalD = DEEL_UI[s.ctx.taal] ? s.ctx.taal : 'en', url = 'https://wearemany.now/?r=' + s.ref.r + '&d=vraag-door&z=' + String(it.k).split(':')[1];
      rdeel = { v: 'door', x: RT.door, m: DEEL_DOOR[taalD](ik, itemZin(it)), url, ui: DEEL_UI[taalD] }; s.deelG = 1; s.deelV = 'door'; velden.deel_toon = 1; velden.ref_door = 1; await telDeel('door', 'ref', 'g', TEST); rx = RT.door; rk = [RT.anders];
    }
    if (rx) { s.berichten.push({ r: 'b', t: Date.now(), x: rx, k: rk }); s.laatste = Date.now(); s.eind = null; p.taal = s.ctx.taal; p.land = s.ctx.land; await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]); return { ok: true, x: rx, knoppen: rk, contact: null, ...(rdeel ? { deel: rdeel } : {}) }; }
  }
  // volgende vraag: meteen een nieuwe peiling, zonder AI
  if (knop && tekst === (VOLGENDE[s.ctx.taal] || VOLGENDE.en)) {
    const v = volgendePeil(s, s.ctx.taal || 'en');
    if (v) {
      const x = v.tekst.replace(/^\{groet\}!?\s*/, '').trim();
      s.peilNu = { id: v.id, sleutel: v.peil, knoppen: v.knoppen };
      s.berichten.push({ r: 'b', t: Date.now(), x, k: v.knoppen }); s.laatste = Date.now(); s.eind = null; velden.volgende = 1; await kv.raw(['ZREM', 'wam:cq', s.sid]).catch(() => {});
      await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]);
      return { ok: true, x, knoppen: v.knoppen, contact: null };
    }
  }
  // peiling (opener of volgende vraag): een tik op een antwoord is meteen een anonieme meting; uitslag in procenten erbij
  let peilNu = false, kaart = null; const zo = ZAAD.find(o => o.id === s.opener);
  const pn = s.peilNu || (s.beurten === 1 && zo && zo.peil ? { id: zo.id, sleutel: zo.peil, knoppen: zo.knoppen } : null);
  if (knop && pn && (pn.knoppen || []).includes(tekst)) {
    const r = await meet(p, s, { sleutel: pn.sleutel, keuze: tekst }, TEST).catch(() => null);
    s.peilNu = null; s.peilGedaan = [...new Set([...(s.peilGedaan || []), pn.id])];
    if (r) { peilNu = true; velden.meting = 1; velden.peil = 1; const { st, scope } = await bmVergelijk(r); kaart = peilKaart(r, st, pn.knoppen); extra = (extra ? extra + '\n' : '') + (kaart && kaart.volgende ? kaartTekst(kaart) : bmTekst(r, st, scope)); velden.bm_feedback = 1; if (st.n >= BM_MIN) velden.bm_vergelijk = 1; }
  }
  // openertik zonder peiling: ook dan de uitslag van anderen erbij, en een kort antwoord met één vraag
  // een knop die zelf een vraag is ("How does it work?") krijgt een echt antwoord, geen uitslag (10 nov 04:08: de bot vroeg terug wat ze wilden weten)
  const vraagKnop = knop && /\?\s*$/.test(tekst);
  if (vraagKnop) extra = (extra ? extra + '\n' : '') + 'They tapped a button that is itself a question ("' + tekst + '"). Answer it plainly in at most 2 short sentences, then ask ONE simple question. Never ask back what they want to know.';
  if (!vraagKnop && !kaart && knop && s.beurten === 1 && zo && !zo.peil && (zo.knoppen || []).includes(tekst)) {
    kaart = await tikKaart(zo, tekst, TEST).catch(() => null);
    extra = (extra ? extra + '\n' : '') + (kaart ? tikZin(kaart) : 'This is their first tap. Reply in at most 2 short sentences, under 25 words in total: a few words echoing their pick, then ONE simple question about it (never two questions in one, never ask for a price or amount yet). No tips, no facts, no advice in this reply.'); if (kaart) velden.tik_kaart = 1;
  }
  // beurt 2 en 3 na een getikte knop ook kort (10 nov 03:35: na het korte eerste antwoord haalde 8/14 beurt 2, maar beurt 2 en 3 kregen weer lange tips en dubbele vragen)
  if (knop && !vraagKnop && !peilNu && (s.beurten === 2 || s.beurten === 3)) extra = (extra ? extra + '\n' : '') + (s.beurten === 2 ? 'They tapped a button. Keep this reply under 30 words: a few words on their pick, then ONE simple question about it (never two questions in one). No tips, no advice, no lists yet.' : 'They tapped a button. Keep this reply under 40 words: one short, concrete, useful idea that fits exactly what they picked, then ONE simple question. Never two questions in one, no lists.');
  // peiling-antwoord: meteen de uitslag zonder op de AI te wachten (9 nov: mediaan gesprekstijd 3 s, mensen haken af tijdens het wachten)
  if (peilNu && kaart && kaart.volgende) {
    const taal = s.ctx.taal || 'en', top = kaart.opties[0], jij = kaart.opties.find(o => o.jij) || top;
    const T = { nl: ['Je bent een van de eersten, dus jij zet de trend.', 'Je zit hier bij de meerderheid.', 'De meesten zeiden "{top}". Jij hoort bij de {p}%.', 'Vraag me iets'], de: ['Du bist einer der Ersten, du setzt den Trend.', 'Hier bist du bei der Mehrheit.', 'Die meisten sagten "{top}". Du gehörst zu den {p} %.', 'Frag mich etwas'] }[taal] || ['You\'re one of the first to answer, so you\'re setting the trend.', 'You\'re with the majority on this one.', 'Most people said "{top}". You\'re in the {p}% club.', 'Ask me something'];
    let x = kaart.n <= 3 ? T[0] : jij === top ? T[1] : T[2].replace('{top}', top.k).replace('{p}', jij.p);
    let knoppen = [...(volgendePeil(s, taal) ? [VOLGENDE[taal] || VOLGENDE.en] : []), T[3]];
    // huur (11 nov 17:25 UTC): na de uitslag meteen door naar de match, anders tikte men 'Volgende vraag' en was de huur weg
    if (pn && /^rent_band/.test(pn.sleutel)) {
      const H = { nl: [' Woon je goed, of zoek je iets anders? Dan zet ik het erin en zoek ik mee.', ['Ik zoek een kamer', 'Ik zoek een huis', 'Ik verhuur iets', 'Ik woon prima']], de: [' Wohnst du gut, oder suchst du etwas anderes? Dann trage ich es ein und suche mit.', ['Ich suche ein Zimmer', 'Ich suche eine Wohnung', 'Ich vermiete etwas', 'Ich wohne gut']] }[taal] || [' Happy where you live, or looking for something else? I\'ll put it in and look with you.', ['Looking for a room', 'Looking for a place', 'I rent something out', 'Happy where I am']];
      x += H[0]; knoppen = H[1]; velden.huur_door = 1;
    }
    // na een peilinguitslag meteen een weg naar wat WAM echt doet (12 nov: Rotterdam tikte één peiling en vertrok na 'Je zit hier bij de meerderheid')
    else if (s.beurten <= 2 && RA[taal]) { x += taal === 'nl' ? ' Zoek je zelf iets? Tik, dan zoek ik mee.' : ' Looking for something yourself? Tap and I search with you.'; knoppen = [...knoppen.slice(0, 1), ...RA[taal].ASK.slice(0, 3)]; velden.peil_door = 1; }
    velden.peil_direct = 1; await kv.raw(['ZREM', 'wam:cq', s.sid]).catch(() => {}); const deelP = s.beurten >= 2 ? await deelKaart(s, p, ['peil'], velden, TEST).catch(() => null) : null;
    s.berichten.push({ r: 'b', t: Date.now(), x, k: knoppen }); s.laatste = Date.now(); s.eind = null; p.taal = s.ctx.taal; p.land = s.ctx.land;
    await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]);
    return { ok: true, x, knoppen, contact: null, peiling: kaart, ...(deelP ? { deel: deelP } : {}) };
  }
  // irritatie-opener: het antwoord na de soort bedrijf is het bedrijf zelf; zorg dat de bot het vastlegt (we are many)
  if (zo && zo.peil === 'most_annoying_type' && s.beurten >= 2 && s.beurten <= 4 && !(p.metingen || []).some(m => m.sleutel === 'most_annoying_company')) extra = (extra ? extra + '\n' : '') + 'They were asked which company annoys them most. If this message names a company, fill "meting" with key most_annoying_company, "keuze" = the company name (lowercase), "detail" = what annoys them.';
  const kan = kanalen();
  // contactknop getikt: meteen de contactkaart, zonder AI, met een echte belofte
  if (knop && s.cpil && tekst === s.cpil.x && !heeftContact(p)) {
    await telCpil(s.cpil, 'k', TEST);
    const dgn = CPIL_DAGEN[s.cpil.id], wanneerB = dgn ? new Date(Date.now() + dgn * 86400000).toISOString().slice(0, 10) : '';
    const b = await beloof(p, s, { wat: 'A short written summary of what we discussed' + (p.samenvatting ? ' (' + kort(p.samenvatting, 160) + ')' : '') + ', plus anything new, better or cheaper I find on it', wanneer: wanneerB }, TEST);
    if (b) velden.belofte = 1;
    s.contactGevraagd += 1; velden.contact_gevraagd = 1; velden.cpil_tik = 1;
    const x = CPIL_ANTW[s.ctx.taal] || CPIL_ANTW.en;
    s.berichten.push({ r: 'b', t: Date.now(), x, k: [], cv: true });
    s.laatste = Date.now(); s.eind = null; p.taal = s.ctx.taal; p.land = s.ctx.land;
    await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]);
    let code = null; if (kan.length > 1) code = await contactCode(s.vid);
    return { ok: true, x, knoppen: [], contact: contactOpties(kan, code, s.ctx.taal) };
  }
  // gericht doorvragen tot dit matchbaar is (lerend, wam:mr)
  if (s.eigen && s.beurten >= 2 && !peilNu && !kaart && !s.schrijf && !s.wachtNr) {
    const gat = matchGat(s.eigen);
    if (gat.length) { if (!s.mr) { s.mr = { id: await kiesMr() }; await telMr(s.mr.id, 'g', TEST); velden.mr_toon = 1; } const zin = mrZin(s.mr.id, gat, s.eigen, s.ctx && s.ctx.stad); if (zin) { extra = (extra ? extra + '\n' : '') + zin; velden.mr_vraag = 1; } }
  }
  let a = null, gezocht = '';
  // AI voor de prioriteitssteden (Henkjan 11 nov: "Ik wil absoluut TORONTO en ROTTERDAM hebben ... Delhi is makkelijk"): bezoekers buiten
  // Canada en Nederland stoppen met AI zodra er nog maar WAM_AI_RESERVE (standaard $1.50) van het dagplafond over is, en gaan dan zonder AI
  // door met peilingen (niet naar de handmatige wachtrij); de rest van het plafond blijft voor Toronto, Canada en Rotterdam.
  const prio = ['CA', 'NL'].includes(String((s.ctx && s.ctx.land) || '').toUpperCase());
  const reserve = prio ? 0 : Math.max(0, Number(process.env.WAM_AI_RESERVE || 1.5));
  // WhatsApp altijd via de regels (Henkjan 12 nov 20:57 UTC: "Gestuurd maar ik krijg een anonymous poll. Totaal niet ok."): buiten Canada en Nederland
  // viel een WhatsApp-bericht na het AI-plafond terug op een peiling; nu gaan WhatsApp en elk land eerst door de regels (matchen), pas daarna peiling of wachtrij
  const waK = s.ctx && s.ctx.kanaal === 'whatsapp';
  // regels eerst (13 nov 00:56 UTC): gratis en lerend; met AI-budget $10 liep alles via de AI en zakte echt gesprek per echt mens van 47% (12 nov, vooral regels) naar 33%.
  // Weten de regels het niet, dan antwoordt de AI, en de rest van dat gesprek blijft bij de AI (s.aiNodig). Terug naar AI-eerst: WAM_REGEL_EERST=uit.
  const overBudget = !!(waK || !(await binnenPlafond(0.01 + reserve)) || (TEST && s.ctx.cq)), regelEerst = process.env.WAM_REGEL_EERST !== 'uit' && !s.aiNodig;
  let naarAI = false;
  if (overBudget || regelEerst) {
    if (overBudget) { velden.plafond = 1; if (!prio) velden.plafond_reserve = 1; }
    // Claude als achtervang (Henkjan 11 nov 15:44 UTC: "Ja pak dan tokens van deze chat . Als backup"): de vraag gaat in wam:cq, de Claude-chat antwoordt via op=cqantw
    if (process.env.WAM_REGEL !== 'uit') {
      if (!s.vb) s.vb = await LEER.kiesVb().catch(() => null);
      if (!s.alertO) s.alertO = await LEER.alertVolgorde(s.ctx && s.ctx.land).catch(() => null);
      // matchflow (Henkjan 13 nov 01:47 UTC): bij elke vraag en elk aanbod de juiste vragen als pills, dan matchen op dezelfde velden en zeggen waarom het past
      if (process.env.WAM_FLOW !== 'uit') {
        await FLOW.laadKw(kv).catch(() => {});
        const fctx = { taal: s.ctx.taal, land: String(s.ctx.land || '').toUpperCase(), stad: s.ctx.stad || '' }, FT = FLOW.flowT(fctx.taal);
        if (s.flow && !knop && RA_NEE.test(tekst.trim())) s.flow = null;
        if (s.flow && !knop && tekst.length > 18 && FLOW.catVanTekst(tekst) && !(s.flow.opts && s.flow.opts[tekst.trim()])) s.flow = null; // ander verhaal: opnieuw beginnen
        if (!s.flow && !s.matchKand && !s.schrijf && !s.antwoordOp && !s.krMaak && !s.prive && (s.flowId || !s.ra || s.ra === 'gemaakt')) { if (FLOW.flowBegin(s, tekst, s.flowId || null)) velden['flow_start_' + s.flow.cat] = 1; }
        s.flowId = null;
        if (s.flow) {
          const vorig = s.flow.vraag, r = FLOW.flowStap(s, tekst, fctx);
          // teller per stap: g = gevraagd, b = beantwoord, klaar|g = bewaard, klaar|m = match (cat vooraf vastzetten: s.flow is bij klaar al leeg)
          const fcat = s.flow.cat, fk = (veld, f) => { if (!TEST) kv.raw(['HINCRBY', 'wam:flowst', fcat + '|' + veld + '|' + f, '1']).catch(() => {}); };
          if (vorig) fk(vorig, 'b');
          if (vorig === 'sub' && s.flow && s.flow.sub && !TEST) kv.raw(['HINCRBY', 'wam:flowsub', s.flow.cat + '|' + s.flow.kant + '|' + s.flow.sub, '1']).catch(() => {});
          if (r && !r.klaar) { fk(r.veld, 'g'); velden.flow_stap = 1; s.berichten.push({ r: 'b', t: Date.now(), x: r.x, k: r.k }); s.laatste = Date.now(); await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]); return { ok: true, x: r.x, knoppen: r.k }; }
          if (r && r.klaar) {
            const f = s.flow, it = FLOW.itemVan(f, fctx), bied = it.kant === 'biedt'; s.flow = null; fk('klaar', 'g');
            const extraV = { cat: it.cat, sub: it.sub, pb: it.pb, tk: it.tk };
            const rr = bied ? await aanbod(p, s, { wat: it.wat, soort: it.soort, prijs: it.prijs, waar: it.waar, wanneer: it.wanneer, ...extraV }, TEST, true).catch(() => null) : await zoektocht(p, s, { wat: it.wat, soort: it.soort, eisen: it.eisen, waar: it.waar, wanneer: it.wanneer, ...extraV }, TEST, true).catch(() => null);
            if (rr) {
              velden[(bied ? 'aanbod' : 'zoektocht') + (rr.nieuw ? '' : '_bij')] = 1; velden.ra_maak = 1; velden.flow_maak = 1; s.raN = N(s.raN) + 1;
              const eigen = { k: p.vid + ':' + rr.id, kant: it.kant, wat: rr.wat, soort: rr.soort, eisen: it.eisen, waar: it.waar || rr.stad, stad: rr.stad, wanneer: it.wanneer, land: rr.land, extra: f.extra || '', ...extraV };
              s.raZw = [...(s.raZw || []), eigen.k].slice(-5); s.eigen = eigen;
              if (!TEST && p.contact && p.contact.mail) await kv.raw(['HSET', 'wam:zwmail', eigen.k, p.contact.mail]).catch(() => {});
              await LEER.ucIn(eigen.k, eigen.land, it.kant + '|' + it.soort, it.wat, TEST).catch(() => {});
              const st = await zoekStand().catch(() => ({ lijst: [] })), ms = FLOW.flowMatch(eigen, st.lijst, fctx, p.vid).filter(m => !(s.pnNiet || []).includes(m.z.k));
              const kaart = FLOW.kaartRegel(eigen, fctx); let x = '', k = [];
              if (ms.length) {
                fk('klaar', 'm'); velden.match_gevonden = 1; velden.flow_match = 1; await LEER.ucMatch(eigen.k, TEST).catch(() => {});
                await wachtersMelden(p, s, eigen, ms.map(m => m.z), velden, TEST).catch(() => 0);
                s.matchKand = { eigen, ander: ms[0].z }; s.matchGemeld = 1; const V = ctaTekst('verbind', s), PNt = PN[s.ctx.taal] || PN.en; await toonVerbind(s, TEST);
                x = kaart + '\n\n' + FLOW.matchTekst(ms, fctx); k = [V, PNt];
              } else {
                velden.match_niemand = 1; x = FT.nog(kaart);
                // macht-zin alleen zonder match, en voor de vraag hoe we je bereiken (de vraag blijft als laatste staan)
                if (s.macht && s.macht !== 'm0' && !s.machtG) { const mz = await machtZin(s).catch(() => ''); if (mz) { s.machtG = 1; x += '\n\n' + mz; if (!TEST) kv.raw(['HINCRBY', 'wam:macht', s.macht + '|g', '1']).catch(() => {}); } }
                const heeftC = !!(p.contact && (p.contact.mail || p.contact.wa || p.contact.tg || p.contact.wanr || p.contact.sms));
                if (!heeftC && s.alertO && !s.alertG) { s.alertG = 1; s.ra = 'alert'; velden.alert_vraag = 1; for (const kz of s.alertO) await LEER.telAlert(s.ctx.land, kz, 'g', TEST).catch(() => {}); const AL = LEER.ALERT_L[s.ctx.taal === 'nl' ? 'nl' : 'en'] || LEER.ALERT_L.en; x += '\n\n' + FT.reach; s.alv = 'af'; s.alvG = 1; if (!TEST) kv.raw(['HINCRBY', 'wam:alv', 'af|g', '1']).catch(() => {}); k = s.alertO.map(z => AL[z]); }
                else { s.ra = 'gemaakt'; k = (RA[s.ctx.taal] || RA.en).ASK || []; }
              }
              s.berichten.push({ r: 'b', t: Date.now(), x, k }); s.laatste = Date.now(); p.taal = s.ctx.taal; p.land = s.ctx.land;
              await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]);
              return { ok: true, x, knoppen: k, gemaakt: 1 };
            }
          }
        }
      }
      let ra = regelAntwoord(tekst, s, !!m, !!(p.contact && (p.contact.mail || p.contact.wa || p.contact.tg)) || ['whatsapp', 'telegram'].includes(s.ctx && s.ctx.kanaal));
      // tik op een opener zonder peiling (bijv. Work stress, Doomscrolling): zonder AI de uitslag van anderen en meteen de vraag wat hun week makkelijker maakt (12 nov: die tikken belandden in de handmatige wachtrij)
      if (!ra && knop && ((zo && !zo.peil && (zo.knoppen || []).includes(tekst)) || ZAAD.some(o => !o.peil && (o.knoppen || []).includes(tekst))) && RA[s.ctx.taal]) { const tl = s.ctx.taal, c = (s.ctx && s.ctx.stad) || (tl === 'nl' ? 'jou' : 'you'); s.ra = 'vraag'; ra = { x: (tl === 'nl' ? 'Genoteerd. ' : 'Noted. ') + RA[tl].t.vraag(c), k: RA[tl].ASK, kaart }; velden.regel_opener = 1; }
      if (!ra && !knop) await LEER.ucVrij(tekst, s.ctx, TEST).catch(() => {}); // wat WAM nog niet snapt: nieuwe usecases
      await LEER.vbFlush(s, TEST).catch(() => {});
      if (ra) {
        velden.regel = 1; let match = '';
        if (ra.pastNiet) velden.past_niet = 1;
        if (ra.pastNietReden) { velden['past_niet_' + ra.pastNietReden.veld] = 1; await LEER.vbUitkomst(ra.pastNietReden.k, 'n', ra.pastNietReden.veld, TEST).catch(() => {}); }
        if (ra.maak) { // meteen maken wat ze willen (Henkjan 12 nov): op hun kaart, in de matchlijst, en zeggen wie er al in zit
          const mk = ra.maak, bied = mk.kant === 'biedt';
          const r = bied ? await aanbod(p, s, { wat: mk.wat, soort: mk.soort, prijs: mk.eisen, waar: mk.waar, wanneer: mk.wanneer, voor: mk.extra, foto: mk.foto }, TEST, true).catch(() => null) : await zoektocht(p, s, { wat: mk.wat, soort: mk.soort, eisen: [mk.eisen, mk.extra].filter(Boolean).join('; '), waar: mk.waar, wanneer: mk.wanneer, foto: mk.foto }, TEST, true).catch(() => null);
          if (r && s.ctx && s.ctx.kanaal === 'whatsapp') { const kl = await kaartLink(p.vid, r).catch(() => ''); ra.x = anonKaart(mk, s.ctx.taal) + (kl ? '\n' + kl : '') + '\n\n' + (s.ctx.taal === 'nl' ? 'Nog iets anders nodig? Zeg het, dan zet ik het ook klaar.' : 'Anything else you need? Tell me and I set that up too.') + (!s.tipG ? (s.tipG = 1, '\n\n' + (ANDER_X[s.ctx.taal === 'nl' ? 'nl' : 'en']).tip) : ''); }
          if (r) {
            velden[(bied ? 'aanbod' : 'zoektocht') + (r.nieuw ? '' : '_bij')] = 1; velden.ra_maak = 1; if (p.dv && N(p.dv.na) > Date.now() - 86400000) { await LEER.telDagv(p.dv, 'm', TEST); p.dv.na = 0; } if (mk.vrij) velden.ra_maak_vrij = 1; await telDiepte(s.raD, 'm', TEST); if (s.cta && s.cta.intro && !s.introM) { s.introM = 1; await telCta('intro', s, 'm', TEST); }
            s.raN = N(s.raN) + 1; if (s.raN === 2) velden.nogmeer_ja = 1;
            const eigen = { k: p.vid + ':' + r.id, kant: mk.kant, wat: r.wat, soort: r.soort, eisen: bied ? [r.voor, r.prijs].filter(Boolean).join('; ') : r.eisen, waar: r.waar || r.stad, stad: r.stad, wanneer: mk.wanneer || '', land: r.land };
            s.raZw = [...(s.raZw || []), eigen.k].slice(-5); s.eigen = eigen;
            if (mk.vb) { await LEER.vbItem(eigen.k, mk.vb.kw, Object.fromEntries(Object.entries(mk.vb.a).filter(([, a]) => a !== 'k')), TEST); for (const [f, a] of Object.entries(mk.vb.a)) if (a !== 'k') await LEER.telVb(mk.vb.kw, f, a, 'm', TEST); }
            if (!TEST && p.contact && p.contact.mail) await kv.raw(['HSET', 'wam:zwmail', eigen.k, p.contact.mail]).catch(() => {});
            if (!s.matchKand) {
              const dm = await directMatch(p.vid, eigen, s.ctx && s.ctx.stad).catch(() => null);
              if (dm && dm.n > 0 && (s.pnNiet || []).length) { const alt = [dm.beste, ...dm.lijst].find(z => z && !s.pnNiet.includes(z.k)); dm.lijst = dm.lijst.filter(z => !s.pnNiet.includes(z.k)); if (alt) dm.beste = alt; else dm.n = 0; }
              if (dm && dm.n > 0) { await LEER.ucMatch(eigen.k, TEST).catch(() => {}); await wachtersMelden(p, s, eigen, dm.lijst, velden, TEST).catch(() => 0); match = mt(s.ctx.taal || 'en').ja(dm.n, dm.stad, eigen.kant, dm.wijk || (s.ctx && s.ctx.stad) || '') + lijstRegels(dm.lijst); s.matchKand = { eigen, ander: dm.beste }; s.matchGemeld = 1; velden.match_gevonden = 1; if (dm.stad) velden.match_stad = 1; const V = ctaTekst('verbind', s), PNt = PN[s.ctx.taal] || PN.en; ra.k = [V, PNt, ...ra.k.filter(k => k !== V && k !== PNt)].slice(0, 4); await toonVerbind(s, TEST); }
            }
          }
        }
        if (ra.groep) { const g = await groepIn(p, s, ra.groep, TEST).catch(() => null); if (g) velden.groep = 1; }
        if (ra.nogmeer) velden.nogmeer = 1; if (ra.klaar) velden.ra_klaar = 1; if (ra.diepteStart) { velden['diepte_' + (s.raD || 'd2')] = 1; await telDiepte(s.raD, 'g', TEST); }
        let alertWa = null;
        if (ra.alertVraag) { if (match) { const al = new Set(Object.values(LEER.ALERT_L[s.ctx.taal] || LEER.ALERT_L.en)); s.ra = 'gemaakt'; s.alertG = 0; ra.x = (RA2[s.ctx.taal] || RA2.en).gemaakt(ra.zin, true); ra.k = ra.k.filter(k => !al.has(k)); } else { velden.alert_vraag = 1; for (const k of s.alertO || []) await LEER.telAlert(s.ctx.land, k, 'g', TEST); } }
        if (ra.alertKeuze) {
          const kz = ra.alertKeuze, tl = s.ctx.taal === 'nl' ? 'nl' : 'en', AL = ALERTX[tl]; s.alertKz = kz; velden['alert_' + kz] = 1; if (s.alvG && !s.alvK && !TEST) { s.alvK = 1; kv.raw(['HINCRBY', 'wam:alv', (s.alv || 'a0') + '|k', '1']).catch(() => {}); } await LEER.telAlert(s.ctx.land, kz, 'k', TEST);
          if (kz === 'wa' && WA.nr) { const arm = await LEER.kiesWaAlert(s.ctx.land).catch(() => 'link'); s.waAlertArm = arm; await LEER.telAlert(s.ctx.land, 'wa' + arm, 'g', TEST);
            if (arm === 'nr') { ra.x = AL.waNr; ra.k = []; s.wachtWaNr = 1; alertWa = { nr: 1, cc: LANDCODE[String(s.ctx.land || '').toUpperCase()] || '+', x: AL.waNr, label: AL.waNrKnop }; }
            else { const code = await contactCode(p.vid); ra.x = AL.wa; alertWa = { url: waLink(code, s.ctx.taal), x: AL.wa, label: 'WhatsApp' }; } s.waG = 1; }
          else if (kz === 'tg' && process.env.WAM_TG_BOT) { const code = await contactCode(p.vid); ra.x = AL.tg + ' https://t.me/' + process.env.WAM_TG_BOT + '?start=wam' + code; }
          else if (kz === 'mail') { ra.x = AL.mail; s.wachtMail = 1; ra.k = []; }
          else if (kz === 'sms') { ra.x = AL.sms; s.wachtSms = 1; ra.k = []; }
          else { ra.x = AL.nog; ra.k = (s.alertO || LEER.ALERT_K).filter(k => ['wa', 'mail', 'tg'].includes(k)).map(k => (LEER.ALERT_L[tl] || LEER.ALERT_L.en)[k]); s.ra = 'alert'; }
        }
        const waR = alertWa || (s.ra === 'alert' || ra.alertKeuze ? null : velden.ra_maak || match ? await waKaart(s, p, velden, TEST).catch(() => null) : null); // eerst echt contact, delen bij een volgende kans
        const deelR = waR || s.ra === 'alert' || ra.alertKeuze ? null : await deelKaart(s, p, [...(velden.ra_maak ? ['maak'] : []), ...(match ? ['match'] : [])], velden, TEST).catch(() => null);
        if (match) s.berichten.push({ r: 'b', t: Date.now(), x: match, match: true });
        if (velden.ra_maak && !s.machtG && s.macht && s.macht !== 'm0' && !waK) { const mz = await machtZin(s).catch(() => ''); if (mz) { s.machtG = 1; ra.x = (ra.x || '') + '\n\n' + mz; if (!TEST) kv.raw(['HINCRBY', 'wam:macht', s.macht + '|g', '1']).catch(() => {}); } }
        if (velden.ra_maak && !s.machtG && s.macht === 'm0') { s.machtG = 1; if (!TEST) kv.raw(['HINCRBY', 'wam:macht', 'm0|g', '1']).catch(() => {}); }
        // groepsvraag in de dialoog (Henkjan 22:38 UTC: "Die kerk etc moet je in de dialoog uitleggen niet ervoor"): eenmaal, na het eerste item of de eerste match, 15% controle zonder
        if (!waR && !deelR && !ra.alertVraag && !ra.alertKeuze && s.ra !== 'alert') { const da = await doorAanbod(s, velden, TEST).catch(() => null); if (da) { ra.x = (ra.x || '') + '\n\n' + da.x; ra.k = da.k; } }
        s.berichten.push({ r: 'b', t: Date.now(), x: ra.x, k: ra.k }); s.laatste = Date.now(); s.eind = null; s.peilNu = null; p.taal = s.ctx.taal; p.land = s.ctx.land; await kv.raw(['ZREM', 'wam:cq', s.sid]).catch(() => {}); await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]); return { ok: true, x: ra.x, match: match || undefined, knoppen: ra.k, contact: null, ...(velden.ra_maak ? { gemaakt: 1 } : {}), ...(velden.ra_klaar ? { klaar: 1 } : {}), ...(ra.kaart ? { peiling: ra.kaart } : {}), ...(deelR ? { deel: deelR } : {}), ...(waR ? { wa: waR } : {}) };
      }
    }
    if (!overBudget) { naarAI = true; s.aiNodig = 1; velden.regel_naar_ai = 1; if (!TEST) { const sch = String(knop || tekst || '').replace(/\S+@\S+/g, '[mail]').replace(/\+?\d[\d\s().-]{5,}\d/g, '[nr]').slice(0, 140); if (sch.trim()) kv.raw(['LPUSH', 'wam:ucvrij', JSON.stringify({ t: Date.now(), l: s.ctx.land || '', x: sch, f: s.flow ? s.flow.cat + '|' + (s.flow.sub || '') : '' })]).then(() => kv.raw(['LTRIM', 'wam:ucvrij', '0', '299'])).catch(() => {}); } } else {
    // een losse letter of half woord ("E", "Di"): niet in de wachtrij maar meteen opnieuw vragen (12 nov 22:16 UTC: twee keer een letter in de wachtrij)
    if (!knop && tekst.replace(/[^\p{L}]/gu, '').length < 3 && !/\d/.test(tekst) && !/^\s*(ok|no|ja|nee|yes|si|oui|hi|yo|k|ok\W*)\s*$/i.test(tekst)) { const x = s.ctx.taal === 'nl' ? 'Die viel half weg denk ik. Wat zoek jij, of wat heb jij?' : 'I think that got cut off. What are you looking for, or what do you have?'; s.berichten.push({ r: 'b', t: Date.now(), x, k: [] }); s.laatste = Date.now(); velden.kort_opnieuw = 1; await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]); return { ok: true, x, knoppen: [] }; }
    if (process.env.WAM_CQ !== 'uit' && (prio || TEST || waK)) {
      const nieuwCq = await kv.raw(['ZADD', 'wam:cq', 'NX', String(Date.now()), s.sid]).catch(() => 0); velden.cq_in = 1;
      const taal = CQW[s.ctx.taal] ? s.ctx.taal : 'en'; let x = N(nieuwCq) ? CQW[taal] : CQW3[taal], k = [];
      const vp = waK ? null : volgendePeil(s, s.ctx.taal || 'en');
      if (vp) { x += '\n\n' + CQW2[taal] + ' ' + vp.tekst.replace(/^\{groet\}!?\s*/, '').trim(); k = vp.knoppen; s.peilNu = { id: vp.id, sleutel: vp.peil, knoppen: vp.knoppen }; velden.plafond_peil = 1; }
      s.berichten.push({ r: 'b', t: Date.now(), x, k }); s.laatste = Date.now(); s.eind = null;
      await meldEenmaal('plafondcq:' + D, 'WAM: het AI-plafond van $' + PLAFOND + ' voor vandaag is bereikt. Nieuwe vragen gaan nu naar de wachtrij en de Claude-chat antwoordt zelf (op=cq).');
      await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]); return { ok: true, x, knoppen: k, contact: null };
    }
    // geen nep-excuus en geen mailvraag in beurt 1-2 meer (coach 11 nov: 'overloaded, leave your email' gaf de meeste afhakers): zonder AI door met een peiling
    const vp = volgendePeil(s, s.ctx.taal || 'en');
    if (vp) { const x = vp.tekst.replace(/^\{groet\}!?\s*/, '').trim(); s.peilNu = { id: vp.id, sleutel: vp.peil, knoppen: vp.knoppen }; s.berichten.push({ r: 'b', t: Date.now(), x, k: vp.knoppen }); s.laatste = Date.now(); s.eind = null; velden.plafond_peil = 1; await meldEenmaal((prio ? 'plafond:' : 'plafondres:') + D, prio ? 'WAM: het AI-plafond van $' + PLAFOND + ' voor vandaag is bereikt. De chat gaat zonder AI door met peilingen en vraagt alleen als die op zijn om een e-mailadres.' : 'WAM: nog $' + reserve + ' AI over vandaag; die blijft voor Canada en Nederland, bezoekers elders gaan zonder AI door met peilingen.'); await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]); return { ok: true, x, knoppen: vp.knoppen, contact: null }; }
    a = { antwoord: val(s.ctx.taal).druk, knoppen: [], contact: p.contact && p.contact.mail ? '' : 'vraag' };
    await meldEenmaal('plafond:' + D, 'WAM: het AI-plafond van $' + PLAFOND + ' voor vandaag is bereikt. De chat vraagt nu om een e-mailadres en antwoordt morgen weer normaal.');
    }
  }
  if (naarAI || !(overBudget || regelEerst)) {
    const t0 = Date.now();
    try {
      a = await denk(s, p, kan, extra);
      if (a && a.zoek && String(a.zoek).trim() && s.zoek < 4 && (await binnenPlafond(0.02))) {
        s.zoek += 1; velden.zoek = 1; gezocht = String(a.zoek).trim().slice(0, 200);
        const res = await zoekOp(gezocht, s).catch(() => '');
        const eerst = a;
        a = await denk(s, p, kan, (extra ? extra + '\n' : '') + 'Search results for "' + gezocht + '":\n' + (res || '(no results)') + '\nNow answer the user with these facts (mention a source domain if useful). Do not set "zoek" again.');
        // wat de eerste beurt al vastlegde (meting, zoektocht, groep) niet kwijtraken door het zoekantwoord
        if (a && eerst) for (const k of ['meting', 'zoekt', 'groep', 'belofte', 'intenties', 'feiten']) { const leeg = v => v == null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.values(v).some(x => x)); if (leeg(a[k]) && !leeg(eerst[k])) a[k] = eerst[k]; }
      }
      // benchmark: een getal van de bezoeker over zichzelf vastleggen (anoniem) en meteen vergelijken met wat anderen antwoordden
      const mt = peilNu ? [] : (Array.isArray(a && a.meting) ? a.meting : []).filter(m => m && m.sleutel && (Number(m.waarde) > 0 || String(m.keuze || '').trim())).slice(0, 2);
      if (mt.length) {
        const rijen = []; for (const m of mt) { const r = await meet(p, s, m, TEST); if (r) rijen.push(r); }
        if (rijen.length) {
          velden.meting = rijen.length; const r0 = rijen[0]; const { st, scope } = await bmVergelijk(r0); kaart = peilKaart(r0, st) || kaart;
          if (await binnenPlafond(0.02)) { const vorige = a; a = await denk(s, p, kan, (extra ? extra + '\n' : '') + (kaart && kaart.volgende ? kaartTekst(kaart) : bmTekst(r0, st, scope))).catch(() => vorige); if (!a || !String(a.antwoord || '').trim()) a = vorige; velden.bm_feedback = 1; if (st.n >= BM_MIN) velden.bm_vergelijk = 1; }
          a.meting = [];
        }
      }
    } catch (e) { velden.ai_fout = 1; a = null; s.fout = String(e && e.message || e).slice(0, 200); console.error('[wam] ai-fout', s.fout); kv.set('wam:laatsteFout', { t: Date.now(), fout: s.fout }).catch(() => {}); }
    velden.ms_bot = Date.now() - t0; velden.n_bot = 1;
  }
  if (!a || !String(a.antwoord || '').trim()) { velden.leeg = 1; if (!s.fout) { s.fout = 'leeg of geen JSON'; console.error('[wam] leeg antwoord'); } a = { antwoord: val(s.ctx.taal).fout, knoppen: [] }; }
  let antwoord = kort(a.antwoord, 1500);
  let knoppen = (Array.isArray(a.knoppen) ? a.knoppen : []).map(k => kort(k, 32)).filter(Boolean).slice(0, 4);
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
  if (a.belofte && a.belofte.wat && String(a.belofte.wat).trim()) { const b = await beloof(p, s, a.belofte, TEST); if (b) velden.belofte = 1; }
  if (a.zoekt && a.zoekt.wat && String(a.zoekt.wat).trim()) { const z = await zoektocht(p, s, a.zoekt, TEST, !!a.zoekt.los).catch(() => null); if (z) velden[z.nieuw ? 'zoektocht' : 'zoektocht_bij'] = 1; }
  let eigenZw = null;
  if (a.zoekt && a.zoekt.wat && String(a.zoekt.wat).trim()) { const z = (p.zoektochten || []).filter(y => y.status === 'open' && y.sid === s.sid).slice(-1)[0]; if (z) eigenZw = { k: p.vid + ':' + z.id, kant: 'zoekt', wat: z.wat, soort: z.soort, eisen: z.eisen, waar: z.waar || z.stad, land: z.land }; }
  if (a.biedt && a.biedt.wat && String(a.biedt.wat).trim()) { const b = await aanbod(p, s, a.biedt, TEST, !!a.biedt.los).catch(() => null); if (b) { velden[b.nieuw ? 'aanbod' : 'aanbod_bij'] = 1; eigenZw = { k: p.vid + ':' + b.id, kant: 'biedt', wat: b.wat, soort: b.soort, eisen: [b.voor, b.prijs].filter(Boolean).join('; '), waar: b.waar || b.stad, land: b.land }; } }
  // meteen zeggen wie er al in zit (Henkjan 10 nov: "Geef meteen door als iemand er al inzit")
  let matchTekst = '';
  if (eigenZw && s.ctx && s.ctx.stad && VAAG_WAAR.test(String(eigenZw.waar || '').trim())) eigenZw.waar = s.ctx.stad; // 'near me' = zijn eigen stad (10 nov: Poplar Bluff zat in een lus)
  if (eigenZw) { s.eigen = eigenZw; if (s.mr && !s.mr.klaar && !matchGat(eigenZw).length) { s.mr.klaar = 1; await telMr(s.mr.id, 'k', TEST); velden.mr_klaar = 1; } }
  if (!eigenZw && s.matchWacht && s.beurten >= 2 && !s.matchGemeld && !kaart) eigenZw = s.matchWacht; // uitgestelde match van beurt 1, niet midden in een peiling (10 nov: kamer-match verscheen na een bankvraag)
  if (eigenZw && !s.matchGemeld && (s.beurten < 2 || (s.beurten < 4 && matchGat(eigenZw).includes('wat')))) { s.matchWacht = eigenZw; eigenZw = null; } // pas matchen als het concreet is: nooit 'nobody looks for something else'
  if (eigenZw && !s.matchGemeld) {
    const dm = await directMatch(p.vid, eigenZw, s.ctx && s.ctx.stad).catch(() => null);
    if (dm) {
      const T = mt(s.ctx.taal || 'en');
      if (dm.n > 0) { await wachtersMelden(p, s, eigenZw, dm.lijst, velden, TEST).catch(() => 0); if (s.mr) await telMr(s.mr.id, 'm', TEST); s.matchWacht = null; matchTekst = T.ja(dm.n, dm.stad, eigenZw.kant, (s.ctx && s.ctx.stad) || '') + lijstRegels(dm.lijst); s.matchKand = { eigen: eigenZw, ander: dm.beste }; s.matchGemeld = 1; velden.match_gevonden = 1; if (dm.stad) velden.match_stad = 1; }
      else if (!s.matchNiemand) { s.matchWacht = null; const nv = await kiesNee(); matchTekst = neeTekst(nv, s.ctx.taal || 'en', eigenZw.kant); s.neeV = nv; await telNee(nv, 'g', TEST); s.matchNiemand = 1; velden.match_niemand = 1; if (!heeftContact(p)) { const v = await kiesMl(); s.mlater = { id: v.id, kanaal: v.kanaal, x: v.x[s.ctx.taal] || v.x.en, zw: eigenZw.k }; await telMl(v.id, 'g', TEST); velden.ml_toon = 1; } }
    }
  }
  if (a.groep && String(a.groep).trim()) { const g = await groepIn(p, s, a.groep, TEST).catch(() => null); if (g) velden.groep = 1; }
  if (a.koppel && a.koppel.id && !TEST) { const k = await koppel(p, String(a.koppel.id), !!a.koppel.ja).catch(() => null); if (k) velden['koppel_' + k] = 1; }
  if (kaart && kaart.tik && knoppen.length < 4 && volgendePeil(s, s.ctx.taal || 'en')) { const vl = VOLGENDE[s.ctx.taal] || VOLGENDE.en; if (!knoppen.includes(vl)) knoppen = [...knoppen, vl]; }
  if (kaart && kaart.volgende && volgendePeil(s, s.ctx.taal || 'en')) { const vl = VOLGENDE[s.ctx.taal] || VOLGENDE.en; knoppen = [vl, ...knoppen.filter(k => k !== vl)].slice(0, 4); }
  if (s.matchKand && !s.schrijf && !(s.matchVerbonden)) { const V = ctaTekst('verbind', s); knoppen = [...knoppen.filter(k => k !== V).slice(0, 3), V]; await toonVerbind(s, TEST); }
  const mlNu = !!(matchTekst && s.mlater && !s.matchKand); if (mlNu) knoppen = [...knoppen.filter(k => k !== s.mlater.x).slice(0, 3), s.mlater.x];
  const contactVraag = a.contact === 'vraag' && !(p.contact && (p.contact.mail || p.contact.tg || p.contact.wa)) && s.contactGevraagd < 2;
  if (contactVraag) { s.contactGevraagd += 1; velden.contact_gevraagd = 1; }
  else if (!mlNu && !(s.matchKand && !s.matchVerbonden && !s.schrijf) && s.beurten >= 2 && !heeftContact(p) && !(p.contact && p.contact.stop) && s.contactGevraagd < 2) {
    if (!s.cpil) { s.cpil = await kiesCpil(s.ctx.taal); if (s.cpil) { await telCpil(s.cpil, 'g', TEST); velden.cpil_getoond = 1; } }
    if (s.cpil) { knoppen = knoppen.filter(k => k !== s.cpil.x).slice(0, 3); if (s.cpil.plek === 'eerst') knoppen.unshift(s.cpil.x); else knoppen.push(s.cpil.x); }
  }
  const waA = velden.zoektocht || velden.aanbod || matchTekst ? await waKaart(s, p, velden, TEST).catch(() => null) : null;
  const deelA = waA ? null : await deelKaart(s, p, [...(velden.zoektocht || velden.aanbod ? ['maak'] : []), ...(matchTekst ? ['match'] : []), ...(kaart && s.beurten >= 2 ? ['peil'] : [])], velden, TEST).catch(() => null);
  // ook in het AI-pad (00:23 UTC: met het AI-budget op $10 loopt bijna alles via de AI, en daar kwamen de empowerment-zin en het groepsaanbod nooit): na het eerste item
  if (velden.zoektocht || velden.aanbod || velden.zoektocht_bij || velden.aanbod_bij) {
    if (!s.machtG && s.macht && s.macht !== 'm0') { const mz = await machtZin(s).catch(() => ''); if (mz) { s.machtG = 1; antwoord += '\n\n' + mz; if (!TEST) kv.raw(['HINCRBY', 'wam:macht', s.macht + '|g', '1']).catch(() => {}); } }
    if (!s.machtG && s.macht === 'm0') { s.machtG = 1; if (!TEST) kv.raw(['HINCRBY', 'wam:macht', 'm0|g', '1']).catch(() => {}); }
  }
  if (!waA && !deelA && !contactVraag) { const da = await doorAanbod(s, velden, TEST).catch(() => null); if (da) { antwoord += '\n\n' + da.x; knoppen = da.k; } }
  if (matchTekst) s.berichten.push({ r: 'b', t: Date.now(), x: matchTekst, match: true });
  s.berichten.push({ r: 'b', t: Date.now(), x: antwoord, k: knoppen, fase: kort(a.fase, 20), zoek: gezocht || undefined, cv: contactVraag || undefined });

  s.laatste = Date.now(); s.fase = kort(a.fase, 20); s.eind = null;
  p.taal = s.ctx.taal; p.land = s.ctx.land;
  await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]);
  let code = null; if (contactVraag && kan.length > 1) code = await contactCode(s.vid);
  return { ok: true, x: antwoord, match: matchTekst || undefined, knoppen, cpil: s.cpil && knoppen.includes(s.cpil.x) ? s.cpil.x : null, contact: contactVraag ? contactOpties(kan, code, s.ctx.taal) : null, zocht: !!gezocht, ...(kaart ? { peiling: kaart } : {}), ...(deelA ? { deel: deelA } : {}), ...(waA ? { wa: waA } : {}), ...(velden.zoektocht || velden.aanbod ? { gemaakt: 1 } : {}), ...(TEST && s.fout ? { fout: s.fout } : {}) };
}

// ---------- contact via Telegram en WhatsApp (de bezoeker stuurt ons een berichtje met een code) ----------
async function contactCode(vid) {
  const bestaand = await kv.get('wam:vcode:' + vid).catch(() => null); if (bestaand) return bestaand;
  const code = hex(3).toUpperCase(); await kv.set('wam:code:' + code, vid, { ex: TTL.code }); await kv.set('wam:vcode:' + vid, code, { ex: TTL.code }); return code;
}
export function contactOpties(kan, code, taal) {
  const o = [{ soort: 'push' }, { soort: 'mail' }];
  if (code && process.env.WAM_TG_BOT && process.env.WAM_TG_TOKEN) o.push({ soort: 'tg', url: 'https://t.me/' + process.env.WAM_TG_BOT + '?start=wam' + code });
  if (code && WA.nr) o.push({ soort: 'wa', url: waLink(code, taal) });
  return o;
}
// Melding op de telefoon (één tik): de browser geeft een push-adres, wij bewaren het in het profiel (geen naam, geen nummer)
export async function pushIn({ sid, tok, sub }) {
  if (!(await tokOk(sid, tok))) return { ok: false, fout: 'sessie' };
  const s = await sessie(sid); if (!s) return { ok: false, fout: 'sessie verlopen' };
  const ep = String(sub && sub.endpoint || ''); if (!/^https:\/\/[^\s]{10,600}$/.test(ep)) return { ok: false, fout: 'geen push-adres' };
  const TEST = !!(s.ctx && s.ctx.test), D = dag();
  const p = (await profiel(s.vid)) || nieuwProfiel(s.vid, s.ctx);
  const nieuw = !(p.contact && p.contact.push);
  p.contact = Object.assign(p.contact || {}, { push: { endpoint: ep, t: Date.now() } });
  await kv.set('wam:pushe:' + h12(ep), s.vid).catch(() => {});
  if (nieuw) {
    await tel({ contact: 1, contact_push: 1 }, D, TEST); await telOpener(s.opener, 'c', D, TEST); await telHook(s.hook, 'c', D, TEST); await telTitel(s.adTekst, 'c', D, TEST); await telUx(s.ux, 'c', TEST);
    if (s.cpil) await telCpil(s.cpil, 'c', TEST); if (s.params && s.params.mmc && !TEST) await clickmind(s.params.mmc, 'aanmelding');
  }
  await bewaarProfiel(p);
  const taal = (s.ctx && s.ctx.taal) || 'en', open = (p.beloften || []).filter(b => b.status === 'open').length;
  const x = { nl: 'Top, je krijgt een melding op je telefoon' + (open ? ' zodra ik het heb.' : ' als ik iets voor je heb.') + ' Je kunt meldingen altijd uitzetten in je browser.', de: 'Super, du bekommst eine Benachrichtigung' + (open ? ', sobald ich es habe.' : ', wenn ich etwas für dich habe.') + ' Du kannst sie jederzeit im Browser ausschalten.' }[taal] || ('Done, you\'ll get a notification on your phone' + (open ? ' as soon as I have it.' : ' when I have something for you.') + ' You can turn notifications off in your browser any time.');
  s.berichten.push({ r: 'b', t: Date.now(), x }); await bewaarSessie(s);
  return { ok: true, x };
}
export async function pushInhoud(ep) {
  const vid = ep ? await kv.get('wam:pushe:' + h12(String(ep))).catch(() => null) : null; const p = vid ? await profiel(vid) : null;
  if (p && p.pushNext) return p.pushNext;
  const l = vid ? await postLinks(vid).catch(() => null) : null;
  return { title: 'We Are Many', body: (p && p.taal === 'nl') ? 'Ik heb iets voor je.' : 'I have something for you.', url: (l && l.chatUrl) || '/' };
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
    if (nieuw) { await tel({ contact: 1, contact_tg: 1 }); const s = p.sessies && p.sessies.length ? await sessie(p.sessies[p.sessies.length - 1]) : null; if (s && s.params && s.params.mmc) await clickmind(s.params.mmc, 'aanmelding'); if (s) { await telOpener(s.opener, 'c'); await telUx(s.ux, 'c'); await telCpil(s.cpil, 'c'); } }
    const ml = await kv.get('wam:mltg:' + vid).catch(() => null);
    if (ml && ml.id) { await kv.raw(['DEL', 'wam:mltg:' + vid]).catch(() => {}); await telMl(ml.id, 'c'); await tel({ ml_c: 1 }); if (ml.zw) await kv.raw(['HSET', 'wam:zwtg', ml.zw, chatId]).catch(() => {}); await stuur(mt(p.taal || 'en').tgOk); return { ok: true, gekoppeld: true, later: true }; }
    await stuur(p.taal === 'nl' ? 'Top, we zijn verbonden! Je kunt hier gewoon verder praten. ' + (p.samenvatting ? 'Ik weet nog: ' + p.samenvatting : '') : 'Great, we\'re connected! You can just keep talking here. ' + (p.samenvatting ? 'I remember: ' + p.samenvatting : ''));
    return { ok: true, gekoppeld: true };
  }
  const vid = await kv.get('wam:tg:' + chatId).catch(() => null);
  if (!vid) { await stuur('Hi! Start at https://wearemany.now and tap Telegram there, so I know who you are.'); return { ok: true }; }
  // verder praten in Telegram: een eigen sessie per Telegram-chat
  const p = await profiel(vid); const s = await tgSessie(chatId, vid, p); const sid = s.sid;
  const r = await zeg({ sid, tok: await teken(sid), x: txt, ip: 'tg' + chatId });
  if (r.ok) await stuur((r.match ? r.match + '\n\n' : '') + r.x + (r.knoppen && r.knoppen.length ? '\n\n' + r.knoppen.map(k => '• ' + k).join('\n') : ''));
  return { ok: true };
}

// ---------- Google One Tap (Henkjan 10 nov: "we kunnen google one tap testen"; client We Are Many, env WAM_GOOGLE_CLIENT_ID) ----------
// De knop en het One Tap-venster verschijnen alleen waar WAM om contact vraagt (contactkaart en Email me when found). Google geeft een
// ondertekend ID-token; Google zelf controleert het (tokeninfo: aud, iss, verlopen, e-mail bevestigd). We nemen alleen het e-mailadres en gaan
// verder alsof iemand het typte, dus dezelfde contactroute (telt als contact en aanmelding, later melden, Clickmind).
export async function googleIn({ sid, tok, cred, ip }) {
  const cid = process.env.WAM_GOOGLE_CLIENT_ID; if (!cid || !cred) return { ok: false, fout: 'google' };
  if (!(await tokOk(sid, tok))) return { ok: false, fout: 'sessie' };
  let j = null;
  try { const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(cred).slice(0, 4000)), { signal: AbortSignal.timeout(8000) }); j = r.ok ? await r.json() : null; } catch (e) {}
  if (!j || j.aud !== cid || !/^(https:\/\/)?accounts\.google\.com$/.test(String(j.iss || '')) || String(j.email_verified) !== 'true' || !MAIL.test(String(j.email || '')) || N(j.exp) * 1000 < Date.now()) { await tel({ google_fout: 1 }).catch(() => {}); return { ok: false, fout: 'google' }; }
  const mail = String(j.email).toLowerCase(); await tel({ contact_google: 1 }).catch(() => {});
  const r = await zeg({ sid, tok, x: mail, ip: ip || 'google' });
  return Object.assign({}, r, { mail });
}
// ---------- WhatsApp via Henkjans eigen koppeling (Henkjan 10 nov: "1 bericht naar mijn whatsap sturen met : meld mijn match en ze krijgen
// bericht als match en kunnen evt in WAM eerst verder praten om echt contactgegevens uit te wisselen" en "Ja mag even mijn whatsapp zijn") ----------
// De koppeling (repo whatsappp-mcp, src/wam.js, Railway) stuurt elk bericht uit een WAM-chat naar op=wain: een gezouten hash van de chat (wie),
// de tekst, de voornaam en de taal, nooit het nummer. Het eerste bericht draagt de code van de knop (wam:code:<CODE>, dezelfde als Telegram).
// Wat WAM later wil sturen (match, bericht van iemand, belofte) staat in wam:waq:<wie> (set wam:waqset); de koppeling haalt het elke 2 minuten
// op (op=wauit), één bericht per chat per keer. Sleutel: de eerste aanmelding (op=wareg) legt een hash van de sleutel vast in wam:wa:sleutel
// (trust on first use). Met die sleutel meldt de koppeling ook het gekoppelde nummer (wam:wa:stand), zodat de knop altijd naar dat nummer wijst
// en vanzelf verdwijnt als de koppeling 30 minuten niets van zich laat horen.
const WA = { nr: null, t: 0 };
const waH = x => createHash('sha256').update('wam-wa|' + x).digest('hex');
const WAPRE = { nl: 'Meld mijn match. Code: ', en: 'Notify me of my match. Code: ', de: 'Melde mir mein Match. Code: ' };
// geen zichtbare code meer (Henkjan 12 nov 20:37 UTC: "Dit is niet duidelijk wat je aan het doen bent. En die code is toch niet nodig, je afzender is toch je ID?"):
// het ingevulde bericht zegt alleen wat iemand wil; de koppeling met de klik (campagne, zone, gesprek) zit onzichtbaar in tekens zonder breedte,
// en valt dat weg, dan op tekst en tijd (wam:watik: wie tikte de laatste 20 minuten op WhatsApp met welk bericht)
const ZW = ['\u200B', '\u200C', '\u200D', '\u2060'], ZWS = '\u2063';
export const zwCode = c => ZWS + String(c || '').toUpperCase().split('').map(h => { const n = parseInt(h, 16); return ZW[n >> 2] + ZW[n & 3]; }).join('');
function zwLees(t) { const m = String(t || '').match(/\u2063([\u200B\u200C\u200D\u2060]{12})/); if (!m) return ''; let c = ''; for (let i = 0; i < 12; i += 2) c += ((ZW.indexOf(m[1][i]) << 2) | ZW.indexOf(m[1][i + 1])).toString(16); return c.toUpperCase(); }
const zwWeg = t => String(t || '').replace(/[\u200B\u200C\u200D\u2060\u2063]/g, '');
const WAMELD = { nl: 'Hoi WAM! Stuur me hier een bericht zodra je een match voor me hebt.', en: 'Hi WAM! Message me here as soon as you have a match for me.', de: 'Hallo WAM! Schreib mir hier, sobald du einen Match für mich hast.' };
const watNorm = t => zwWeg(t).toLowerCase().replace(/\(?\s*(?:wam\s+)?code\W{0,3}[0-9a-f]{6}\s*\)?/i, '').replace(/[^a-z0-9à-ÿ]+/g, ' ').trim().slice(0, 80);
async function tikCode(txt) {
  const r = (await kv.raw(['LRANGE', 'wam:watik', '-60', '-1']).catch(() => [])) || [], n = watNorm(txt), nu = Date.now(); if (!n) return '';
  for (const x of r.reverse()) { let o; try { o = JSON.parse(x); } catch (e) { continue; } if (nu - o.t > 20 * 60000 || !o.code || watNorm(o.tx) !== n) continue; if (await kv.raw(['SET', 'wam:watikg:' + o.code + ':' + o.t, '1', 'NX', 'EX', '3600']).catch(() => null)) return o.code; }
  return '';
}
const waLink = (code, taal) => 'https://wa.me/' + WA.nr + '?text=' + encodeURIComponent((WAMELD[taal] || WAMELD.en) + zwCode(code));
export async function waLaad() {
  if (Date.now() - WA.t < 60000) return WA.nr;
  WA.t = Date.now(); const st = await kv.get('wam:wa:stand').catch(() => null);
  WA.nr = st && st.nr && Date.now() - N(st.poll || st.t) < 30 * 60000 ? String(st.nr) : null; return WA.nr;
}
async function waOk(sleutel) { if (!sleutel || String(sleutel).length < 32) return false; const vast = await kv.get('wam:wa:sleutel').catch(() => null); return !!vast && vast === waH(String(sleutel)); }
const waWie = x => String(x || '').replace(/[^a-f0-9]/gi, '').toLowerCase().slice(0, 32);
async function waStuur(wie, tekst) {
  wie = waWie(wie); if (wie.length < 16 || !tekst) return false;
  await kv.raw(['RPUSH', 'wam:waq:' + wie, JSON.stringify({ t: Date.now(), tekst: String(tekst).slice(0, 3000) })]); kv.raw(['EXPIRE', 'wam:waq:' + wie, String(7 * 86400)]).catch(() => {});
  await kv.raw(['SADD', 'wam:waqset', wie]).catch(() => {}); return true;
}
async function waSessie(wie, vid, p) {
  if (vid) kv.raw(['SADD', 'wam:dvset', vid]).catch(() => {});
  const sid = createHash('sha256').update('wa|' + wie).digest('hex').slice(0, 16);
  let s = await sessie(sid);
  if (!s) { s = { sid, vid, t0: Date.now(), ctx: { taal: (p && p.taal) || 'en', land: p && p.land, kanaal: 'whatsapp' }, params: {}, hook: '', opener: 'whatsapp', berichten: [], beurten: 0, echt: true, contactGevraagd: 2, zoek: 0, ev: {} }; await bewaarSessie(s); }
  return s;
}
export async function waReg(b) {
  const sl = String((b && b.sleutel) || ''); if (sl.length < 32) return { ok: false };
  const nieuw = await kv.raw(['SET', 'wam:wa:sleutel', waH(sl), 'NX']).catch(() => null);
  if (!(await waOk(sl))) return { ok: false, fout: 'sleutel' };
  const nr = String((b && b.nr) || '').replace(/\D/g, ''), oud = await kv.get('wam:wa:stand').catch(() => null);
  await kv.set('wam:wa:stand', { nr: nr.length >= 8 ? nr : (oud && oud.nr) || '', t: Date.now(), poll: Date.now(), versie: kort((b && b.versie) || '', 12) });
  if (nieuw) await meld('WAM: de WhatsApp-koppeling is aangesloten (vingerafdruk ' + waH(sl).slice(0, 8) + '). De knop WhatsApp staat nu aan op wearemany.now.').catch(() => {});
  else if (oud && oud.nr && nr.length >= 8 && oud.nr !== nr) await meld('WAM: de WhatsApp-koppeling draait nu op een ander nummer; de knop op wearemany.now volgt vanzelf.').catch(() => {});
  WA.t = 0; return { ok: true, vinger: waH(sl).slice(0, 8), tweede: await kv.get('wam:wa:tweede').catch(() => null) };
}
// locatie uit WhatsApp (Henkjan 12 nov 19:01 UTC: "kan ik vragen om locatie? Kun je die interpreteren?"): de koppeling stuurt lat/lon (afgerond),
// WAM zoekt via OpenStreetMap (Nominatim) de wijk en stad op en bewaart alleen die namen, nooit de plek zelf; 30 dagen in cache per ~1 km.
async function plekVan(lat, lon, taal) {
  lat = Number(lat); lon = Number(lon); if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const k = 'wam:geo:' + lat.toFixed(2) + ',' + lon.toFixed(2); const c = await kv.get(k).catch(() => null); if (c) return c;
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&lat=' + lat.toFixed(3) + '&lon=' + lon.toFixed(3) + '&accept-language=' + (taal === 'nl' ? 'nl' : 'en'), { headers: { 'user-agent': 'wearemany.now/1.0 (matchmaker chat)' }, signal: AbortSignal.timeout(6000) });
    const j = await r.json(); const a = (j && j.address) || {};
    const wijk = a.suburb || a.neighbourhood || a.city_district || a.quarter || '', stad = a.city || a.town || a.village || a.municipality || a.county || '';
    const land = String(a.country_code || '').toUpperCase();
    const v = { wijk: kort(wijk, 40), stad: kort(stad, 40), land, naam: kort([wijk, stad].filter(Boolean).filter((x, i, l) => l.indexOf(x) === i).join(', '), 80) };
    if (v.naam) await kv.set(k, v, { ex: 30 * 86400 }).catch(() => {});
    return v.naam ? v : null;
  } catch (e) { return null; }
}
// foto's uit WhatsApp (12 nov): de koppeling stuurt de foto mee, WAM bewaart hem privé in Vercel Blob en toont hem alleen via een ondertekende link
async function fotoBewaar(data, type) {
  try { const buf = Buffer.from(String(data || ''), 'base64'); if (buf.length < 500 || buf.length > 3e6) return ''; const ct = /^image\/(jpeg|png|webp)$/.test(type || '') ? type : 'image/jpeg'; const id = hex(12); await blobPut('wam/foto/' + id, buf, { access: 'private', addRandomSuffix: false, contentType: ct }); await tel({ wa_foto: 1 }).catch(() => {}); return id; } catch (e) { return ''; }
}
export async function fotoToken(id) { return createHmac('sha256', await geheim()).update('wamf|' + id).digest('hex').slice(0, 16); }
export async function fotoLees(id, t) { if (!/^[0-9a-f]{24}$/.test(String(id || '')) || t !== await fotoToken(id)) return null; try { const r = await blobGet('wam/foto/' + id, { access: 'private' }); return r; } catch (e) { return null; } }
export async function kaartLink(vid, item) { if (!vid || !item) return ''; const r = await refCode(vid); return 'https://wearemany.now/api/wam?op=kaart&r=' + r + '&z=' + item.id + (item.foto ? '&f=' + item.foto + '&t=' + await fotoToken(item.foto) : ''); }
// de anonieme kaart als pagina: wat iemand zoekt of biedt, zonder naam of nummer; de foto alleen met een geldige ondertekening
const escH = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export async function kaartPagina(r, z, f, t) {
  if (!/^[0-9a-f]{8}$/.test(r) || !/^[0-9a-f]{8}$/.test(z)) return null; const vid = await kv.get('wam:ref:' + r).catch(() => null); if (!vid) return null;
  const raw = await kv.raw(['HGET', 'wam:zw', vid + ':' + z]).catch(() => null); if (!raw) return null; let it; try { it = JSON.parse(raw); } catch (e) { return null; }
  const fotoOk = f && it.foto === f && t === await fotoToken(f), b = it.kant === 'biedt';
  const rij = (k, v) => v ? '<p class="r"><span>' + k + '</span>' + escH(v) + '</p>' : '';
  const cta = 'https://wearemany.now/?r=' + r + '&d=vind-kaart&z=' + z;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escH((b ? 'Offering: ' : 'Looking for: ') + it.wat) + ' · We Are Many</title><meta property="og:title" content="' + escH((b ? 'Offering: ' : 'Looking for: ') + it.wat) + '"><meta property="og:description" content="Anonymous card on We Are Many. No name, no number."><style>body{margin:0;font:17px/1.55 Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#3A3F47;background:#fff}main{max-width:560px;margin:0 auto;padding:28px 20px 48px}.e{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6B7280;margin:0 0 6px}h1{font-size:30px;line-height:1.15;letter-spacing:-.03em;color:#111113;margin:0 0 18px}img{width:100%;border-radius:14px;margin:0 0 16px;display:block}.r{margin:0;padding:10px 0;border-top:1px solid #E5E7EB;display:flex;gap:14px}.r span{flex:none;width:96px;color:#6B7280}.v{font-size:14px;color:#6B7280;margin:18px 0 22px}a.b{display:block;text-align:center;background:#2B47C4;color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:14px 18px}</style></head><body><main><p class="e">' + (b ? 'Offering' : 'Looking for') + ' · We Are Many</p><h1>' + escH(it.wat) + '</h1>' + (fotoOk ? '<img alt="" src="/api/wam?op=foto&f=' + escH(f) + '&t=' + escH(t) + '">' : '') + rij('Where', it.waar) + rij(b ? 'Price' : 'Budget', it.eisen) + rij('When', it.wanneer) + '<p class="v">Anonymous: no name, no number. Contact only when both say yes.</p><a class="b" href="' + cta + '">' + (b ? 'I need this' : 'I have this') + '</a></main></body></html>';
}
// eerste antwoord na de WhatsApp-start: wat WAM is en wat je terugkrijgt, dan meteen de vraag (Henkjan 12 nov 19:47 UTC)
const WAKOM = { en: 'Hi! I\'m WAM, a free and anonymous matchmaker. I find people near you who have what you need or need what you offer, and I message you right here when someone fits. Reply STOP anytime.', nl: 'Hoi! Ik ben WAM, een gratis en anonieme matchmaker. Ik zoek mensen bij jou in de buurt die hebben wat jij zoekt of zoeken wat jij biedt, en ik stuur je hier een bericht zodra iemand past. Stoppen kan altijd met STOP.' };
// doorsturen in WhatsApp (Henkjan 12 nov 19:09 UTC: "Stuur door naar je vrienden. Geef ze het contact zodat je hen ook kunt vinden in WAM"):
// na de eerste gemaakte wens een korte uitnodiging (lerend), daarna een los bericht om door te sturen met een link naar het WAM-nummer met
// de ref-code van de afzender, en het contact van WAM; wie via die link begint, telt voor de afzender (vriend binnen a, vriend in gesprek dl)
const WADOOR = { en: r => 'WAM finds people near you for whatever you need or offer: a room, work, a job done, something to buy or sell. Free and anonymous. Just send a message: https://wa.me/' + WA.nr + '?text=' + encodeURIComponent('Hi WAM (ref ' + r + ')'), nl: r => 'WAM vindt mensen bij jou in de buurt voor alles wat je zoekt of aanbiedt: een kamer, werk, een klus, iets te koop. Gratis en anoniem. Stuur gewoon een berichtje: https://wa.me/' + WA.nr + '?text=' + encodeURIComponent('Hoi WAM (ref ' + r + ')') };
async function waDoor(s) {
  if (!WA.nr || s.waDoorG || !(s.ctx && s.ctx.kanaal === 'whatsapp')) return null;
  const tl = s.ctx.taal === 'nl' ? 'nl' : 'en'; s.waDoorG = 1; s.cta = Object.assign({}, s.cta, { wadeel: s.cta && s.cta.wadeel ? s.cta.wadeel : await kiesCta('wadeel', tl).catch(() => 'f1') });
  const T = !!(s.ctx && s.ctx.test); await telCta('wadeel', s, 'g', T); await telDeel('wa', 'wd' + (s.waDoorM || 'k'), 'g', T); const r = (await refCode(s.vid)) + '-' + s.cta.wadeel + (s.waDoorM || '');
  return { uitnodiging: ctaTekst('wadeel', s), doorsturen: WADOOR[tl](r) };
}
// pas als de tijd rijp is (Henkjan 12 nov 19:44 UTC: "Dit lijkt me veel, doe dat later in dialoog of als tijd rijp"): één regel onder het
// antwoord plus één bericht om door te sturen, geen contactkaart. Het moment leert per gesprek (wam:deel m|wdk, wdc, wdd: getoond, vriend
// binnen, vriend in gesprek): k = als iemand klaar is of bedankt na een wens, c = nadat iemand contact zocht met een match, d = vanaf beurt 6
// met een wens. Eerst elk moment 15 keer, daarna Thompson op vriend binnen plus dubbel voor vriend in gesprek.
const DOOR_M = ['k', 'c', 'd'];
async function kiesDoorM() { const h = await hget('wam:deel').catch(() => ({})); const g = m => N(h['m|wd' + m + '|g']); const weinig = DOOR_M.filter(m => g(m) < 15); if (weinig.length) return weinig[Math.floor(Math.random() * weinig.length)]; let best = 'k', bs = -1; for (const m of DOOR_M) { const ok = N(h['m|wd' + m + '|a']) + 2 * N(h['m|wd' + m + '|dl']); const a = gamma(1 + ok), b = gamma(1 + Math.max(0, g(m) - ok)); if (a / (a + b) > bs) { bs = a / (a + b); best = m; } } return best; }
async function waDoorNa(sid, r) {
  const s2 = await sessie(sid).catch(() => null); if (!s2 || s2.waDoorG || !(s2.ctx && s2.ctx.kanaal === 'whatsapp') || (N(s2.raN) < 1 && !(r && r.doorNu))) return {};
  if (!s2.waDoorM) { s2.waDoorM = await kiesDoorM().catch(() => 'k'); await bewaarSessie(s2); }
  const m = s2.waDoorM, rijp = (r && r.doorNu) || (m === 'k' && r && r.klaar) || (m === 'c' && (s2.matchVerbonden || s2.ctaB)) || (m === 'd' && N(s2.beurten) >= 6);
  if (!rijp) return {}; const d = await waDoor(s2).catch(() => null); if (!d) return {}; await bewaarSessie(s2); return { aanhang: d.uitnodiging, extra: [d.doorsturen] };
}
async function waMetDoor(uit, sid, r) { if (r && Array.isArray(r.waExtra) && r.waExtra.length) { uit.extra = r.waExtra; return uit; } const d = await waDoorNa(sid, r).catch(() => ({})); if (d.aanhang && uit.antwoord) uit.antwoord += '\n\n' + d.aanhang; if (d.extra) uit.extra = d.extra; return uit; }
// antwoord van zeg als WhatsApp-tekst: match erboven, knoppen als genummerde keuzes (een cijfer terug is genoeg)
function waTekst(r, s) { const tl = (s && s.ctx && s.ctx.taal) || 'en', k = r.knoppen || []; return (r.match ? r.match + '\n\n' : '') + r.x + (k.length ? '\n\n' + k.map((x, i) => (i + 1) + '. ' + x).join('\n') + '\n\n' + (tl === 'nl' ? '(stuur ' + k.map((x, i) => i + 1).join(', ') + ' of typ zelf)' : tl === 'de' ? '(schick ' + k.map((x, i) => i + 1).join(', ') + ' oder schreib selbst)' : '(send ' + k.map((x, i) => i + 1).join(', ') + ' or just type)') : ''); }
export async function waIn(b) {
  if (!(await waOk(b && b.sleutel))) return { ok: false, fout: 'sleutel' };
  const wie = waWie(b.wie), txt = kort(zwWeg(String(b.tekst || '')).trim(), 1200), taal0 = ['nl', 'de'].includes(b.taal) ? b.taal : 'en';
  const loc = b.loc && Number.isFinite(Number(b.loc.lat)) && Number.isFinite(Number(b.loc.lon)) ? b.loc : null;
  const foto = !!b.foto; if (wie.length < 16 || (!txt && !loc && !foto)) return { ok: false };
  // vandalen: hoogstens 10 berichten per minuut en 150 per dag per WhatsApp-afzender; geblokt = geen antwoord meer
  if (!(await LEER.tempoOk('w' + wie, { perMin: 10, perDag: 150 }))) return { ok: true, antwoord: null };
  { const bv = await kv.get('wam:wa:' + wie).catch(() => null); if (bv && await LEER.geblokt(String(bv))) return { ok: true, antwoord: null }; }
  await tel({ wa_in: 1, ...(loc ? { wa_loc: 1 } : {}) }).catch(() => {});
  const plek = loc ? await plekVan(loc.lat, loc.lon, taal0) : null;
  const cmz = txt.match(/code\W{0,3}([0-9a-f]{6})\b/i), czw = zwLees(b.tekst), ctik = cmz || czw ? '' : await tikCode(txt).catch(() => '');
  const cm = cmz || (czw ? [czw, czw] : ctik ? [ctik, ctik] : null); if (czw || ctik) await tel({ [czw ? 'wa_code_zw' : 'wa_code_tik']: 1 }).catch(() => {});
  if (cm) {
    const vid = await kv.get('wam:code:' + cm[1].toUpperCase()).catch(() => null);
    if (!vid) return { ok: true, antwoord: taal0 === 'nl' ? 'Hoi! Die code ken ik niet. Open https://wearemany.now en tik daar op WhatsApp.' : 'Hi! I could not find that code. Open https://wearemany.now and tap WhatsApp there.' };
    const p = (await profiel(vid)) || nieuwProfiel(vid, { taal: taal0 }), T = mt(p.taal || taal0);
    const nieuw = !(p.contact && p.contact.wa === wie); p.contact = Object.assign(p.contact || {}, { wa: wie, waT: Date.now() }); await bewaarProfiel(p); await kv.set('wam:wa:' + wie, vid, { ex: TTL.p });
    if (nieuw) { await tel({ contact: 1, contact_wa: 1 }); const sw = p.sessies && p.sessies.length ? await sessie(p.sessies[p.sessies.length - 1]).catch(() => null) : null; if (sw && sw.waG && !sw.waC) { sw.waC = 1; await telCta('whatsapp', sw, 'c'); if (sw.alertKz === 'wa') { await LEER.telAlert(sw.ctx && sw.ctx.land, 'wa', 'c'); if (sw.waAlertArm === 'link') await LEER.telAlert(sw.ctx && sw.ctx.land, 'walink', 'c'); } await bewaarSessie(sw).catch(() => {}); } const s = p.sessies && p.sessies.length ? await sessie(p.sessies[p.sessies.length - 1]) : null; if (s && s.params && s.params.mmc) await clickmind(s.params.mmc, 'aanmelding'); if (s) { await telOpener(s.opener, 'c'); await telUx(s.ux, 'c'); await telCpil(s.cpil, 'c'); } await meld('WAM: iemand koppelde WhatsApp' + (p.samenvatting ? ' (' + kort(p.samenvatting, 80) + ')' : '') + '.').catch(() => {}); }
    const ml = await kv.get('wam:mlwa:' + vid).catch(() => null);
    if (ml && ml.id) { await kv.raw(['DEL', 'wam:mlwa:' + vid]).catch(() => {}); await telMl(ml.id, 'c'); await tel({ ml_c: 1 }); if (ml.zw) await kv.raw(['HSET', 'wam:zwwa', ml.zw, wie]).catch(() => {}); }
    // WhatsApp-start (A/B): het ingevulde antwoord meteen beantwoorden in een WhatsApp-sessie met de context van de klik
    const rest = txt.replace(/\(?\s*(?:WAM\s+)?code\W{0,3}[0-9a-f]{6}\b\s*\)?/i, '').replace(new RegExp('^(' + Object.values(WAPRE).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/Code: $/, '')).join('|') + ')', 'i'), '').replace(/^[\s.:,-]+|[\s.:,-]+$/g, '').trim();
    const wsid = await kv.get('wam:wasid:' + cm[1].toUpperCase()).catch(() => null);
    const web = wsid ? await sessie(String(wsid)).catch(() => null) : p.sessies && p.sessies.length ? await sessie(p.sessies[p.sessies.length - 1]).catch(() => null) : null;
    if (rest && web && web.start === 'wa') {
      await LEER.waLog(web, 'aan', !!(web.ctx && web.ctx.test)).catch(() => {});
      const ws = await waSessie(wie, vid, p);
      if (!ws.beurten) { Object.assign(ws, { echt: false, start: 'wa', waV: web.waV || 'w0', opener: web.opener, hook: web.hook, adTekst: web.adTekst, ux: web.ux, cta: web.cta, raD: web.raD, deelM: 'geen', params: Object.assign({}, web.params), peilNu: web.peilNu || null, berichten: (web.berichten || []).slice(0, 1) }); ws.ctx = Object.assign({}, web.ctx, { kanaal: 'whatsapp' }); await bewaarSessie(ws); }
      await telStart('wa', 'l', !!(web.ctx && web.ctx.test)); await telCta('wastart', web, 'l', !!(web.ctx && web.ctx.test)); await tel({ wa_start_in: 1 }).catch(() => {}); if (!web.waL) { web.waL = 1; await bewaarSessie(web).catch(() => {}); }
      const rest2 = LEER.waSchoon(rest) || rest, zo = ZAAD.find(o => o.id === ws.opener), isKnop = !!(zo && (zo.knoppen || []).some(k => k.toLowerCase() === rest2.toLowerCase()));
      const r = await zeg({ sid: ws.sid, tok: await teken(ws.sid), ...(isKnop ? { knop: (zo.knoppen || []).find(k => k.toLowerCase() === rest2.toLowerCase()) } : { x: rest2 }), ip: 'wa' + wie });
      const tlk = (ws.ctx && ws.ctx.taal) === 'nl' ? 'nl' : 'en', dz = !ws.waKom ? await dichtheidZin(ws.ctx && ws.ctx.land, ws.ctx && ws.ctx.stad, tlk).catch(() => '') : '', kom = !ws.waKom ? (ws.waKom = 1, await bewaarSessie(ws), WAKOM[tlk] + (dz ? '\n' + dz : '') + '\n\n') : '';
      if (r && r.ok) return waMetDoor({ ok: true, gekoppeld: true, antwoord: kom + waTekst(r, ws) }, ws.sid, r);
    }
    return { ok: true, gekoppeld: true, antwoord: T.waOk + (!ml && p.samenvatting ? '\n\n' + (p.taal === 'nl' ? 'Ik weet nog: ' : 'I remember: ') + p.samenvatting : '') };
  }
  const vid = await kv.get('wam:wa:' + wie).catch(() => null);
  if (!vid) { // rechtstreeks op het WAM-nummer, zonder code (12 nov 18:50 UTC: Henkjan stuurde "Hi WAM" en er gebeurde niets): nieuw profiel en meteen antwoorden
    const land = (plek && plek.land) || String(b.land || '').toUpperCase().slice(0, 2), stad = (plek && plek.stad) || String(b.stad || '').slice(0, 40);
    const nv = hex(8), np = nieuwProfiel(nv, { taal: taal0, land, stad }); np.contact = { wa: wie, waT: Date.now() }; np.bezoeken = 1;
    await bewaarProfiel(np); await kv.set('wam:wa:' + wie, nv, { ex: TTL.p }); await tel({ contact: 1, contact_wa: 1, wa_direct: 1 }).catch(() => {});
    const ws = await waSessie(wie, nv, np); ws.ctx = Object.assign({}, ws.ctx, { land, stad, taal: taal0, kanaal: 'whatsapp' }); ws.start = 'wadirect';
    try { ws.raD = await kiesDiepte(); ws.cta = { verbind: await kiesCta('verbind', taal0) }; } catch (e) {}
    const rm = txt.match(/\(?\s*ref\s+([0-9a-f]{8})(?:-(f\d)([kcd])?)?\s*\)?/i); let txt2 = txt;
    if (rm) { txt2 = txt.replace(rm[0], '').trim(); const rv = await kv.get('wam:ref:' + rm[1].toLowerCase()).catch(() => null); if (rv && rv !== nv) { ws.ref = { r: rm[1].toLowerCase(), d: 'wa-' + (rm[3] ? 'wd' + rm[3] : 'door') + (rm[2] ? '-' + rm[2] : ''), vid: rv }; await telDeel('wa', rm[3] ? 'wd' + rm[3] : 'door', 'a', false); if (rm[2]) await telCta('wadeel', { ctx: ws.ctx, cta: { wadeel: rm[2] } }, 'a', false); await tel({ ref_geladen: 1, ref_echt: 1, ref_wa: 1 }).catch(() => {}); } }
    const groet = /^(hi|hey|hello|hoi|hallo|hola|yo|good (morning|afternoon|evening)|goedemorgen|goedemiddag|goedenavond)\b|^(hi |hoi |hey )?wam\W*$/i.test(txt2.trim()) || txt2.trim().length < 4;
    if (groet || !RA[taal0]) {
      // korte, lerende intro zonder knoppen (Henkjan 12 nov 19:04 UTC: "Intro moet korter en maak ook weer lerend maar laat ze gewoon zeggen wat ze zoeken of willen en jij zoekt naar een match")
      ws.cta = Object.assign({}, ws.cta, { intro: await kiesCta('intro', taal0).catch(() => 'i1') }); const x = ctaTekst('intro', ws);
      ws.berichten = [{ r: 'u', t: Date.now(), x: txt }, { r: 'b', t: Date.now(), x, k: [] }]; ws.opener = 'whatsapp'; ws.ra = 'vraag'; await bewaarSessie(ws); np.sessies = [ws.sid]; await bewaarProfiel(np);
      await telCta('intro', ws, 'g', false);
      return { ok: true, gekoppeld: true, antwoord: x };
    }
    ws.echt = !!ws.ref; ws.ra = 'vraag'; await bewaarSessie(ws); np.sessies = [ws.sid]; await bewaarProfiel(np);
    const r0 = await zeg({ sid: ws.sid, tok: await teken(ws.sid), x: txt2, ip: 'wa' + wie });
    return waMetDoor({ ok: true, gekoppeld: true, antwoord: r0 && r0.ok ? waTekst(r0, ws) : null }, ws.sid, r0);
  }
  const p = await profiel(vid); const s = await waSessie(wie, vid, p);
  // STOP (beloofd in elk eerste bericht en in de dagvraag): niets meer sturen; wie daarna zelf weer schrijft, zet het weer aan
  if (/^\s*(stop|unsubscribe|stoppen|afmelden|uitschrijven)\s*[.!]?\s*$/i.test(txt)) { await dagvAntwoord(p, txt); if (p) { p.contact = Object.assign(p.contact || {}, { stop: Date.now() }); await bewaarProfiel(p); } await kv.raw(['SREM', 'wam:dvset', vid]).catch(() => {}); await tel({ wa_stop: 1 }).catch(() => {}); const tl = (p && p.taal) || taal0; return { ok: true, antwoord: tl === 'nl' ? 'Gestopt. Je krijgt geen berichten meer van WAM. Stuur gewoon weer een bericht als je later iets zoekt.' : 'Stopped. You will not get messages from WAM anymore. Just send a message whenever you need something.' }; }
  if (p && p.contact && p.contact.stop) { p.contact.stop = 0; await bewaarProfiel(p); }
  await dagvAntwoord(p, txt);
  if (loc) {
    if (!plek) return { ok: true, antwoord: taal0 === 'nl' ? 'Die locatie kon ik niet lezen. Typ de wijk of plaats maar.' : 'I could not read that location. Just type the area or city.' };
    if (plek.stad) { s.ctx = Object.assign({}, s.ctx, { stad: plek.stad, ...(plek.land ? { land: plek.land } : {}) }); if (p) { p.stad = plek.stad; await bewaarProfiel(p); } await bewaarSessie(s); }
    if (s.ra === 'detail' && s.raVeld === 'waar') { const r1 = await zeg({ sid: s.sid, tok: await teken(s.sid), x: plek.naam, ip: 'wa' + wie }); if (r1 && r1.ok) return { ok: true, antwoord: (((s.ctx && s.ctx.taal) || taal0) === 'nl' ? '📍 ' + plek.naam + ' (anoniem: alleen ik weet dit, anderen zien nooit je locatie).\n\n' : '📍 ' + plek.naam + ' (anonymous: only I know this, others never see your location).\n\n') + waTekst(r1, s) }; }
    const tl = (s.ctx && s.ctx.taal) || taal0;
    return { ok: true, antwoord: tl === 'nl' ? 'Top, je zit bij ' + plek.naam + '. Dat blijft anoniem: alleen ik weet het, anderen zien nooit je locatie en ik bewaar alleen de wijk. Ik match je met mensen in de buurt. Wat zoek of bied je?' : 'Got it, you are near ' + plek.naam + '. That stays anonymous: only I know it, others never see your location and I keep just the neighbourhood. I match you with people nearby. What do you need or offer?' };
  }
  const fotoId = foto && b.fotoData ? await fotoBewaar(b.fotoData, b.fotoType) : '';
  if (fotoId) { s.fotoNu = fotoId; await bewaarSessie(s); if (s.ra === 'detail' && s.raVeld === 'foto') { const r1 = await zeg({ sid: s.sid, tok: await teken(s.sid), x: txt || '[photo]', ip: 'wa' + wie }); if (r1 && r1.ok) return waMetDoor({ ok: true, antwoord: waTekst(r1, s) }, s.sid, r1); } }
  if (foto && !txt) { const tl = (s.ctx && s.ctx.taal) || taal0; return { ok: true, antwoord: tl === 'nl' ? 'Mooie foto! Wat is het, en zoek je het of bied je het aan? Een paar woorden is genoeg.' : 'Nice photo! What is it, and do you need it or offer it? A few words is enough.' }; }
  if (s.cta && s.cta.intro && !s.introK) { s.introK = 1; await bewaarSessie(s); await telCta('intro', s, 'k', false); }
  const vk = ((s.berichten || []).filter(m => m.r === 'b').slice(-1)[0] || {}).k || [], nr = (txt.match(/^\s*([1-9])\s*\.?\s*$/) || [])[1];
  const r = await zeg({ sid: s.sid, tok: await teken(s.sid), ...(nr && vk[N(nr) - 1] ? { knop: vk[N(nr) - 1] } : { x: txt }), ip: 'wa' + wie });
  if (!r.ok) return { ok: true, antwoord: null };
  return waMetDoor({ ok: true, antwoord: waTekst(r, s) }, s.sid, r);
}
// eerste bericht naar wie op de site zijn WhatsApp-nummer gaf (Henkjan 12 nov 21:09 UTC: "Ik geloof niet in typen ... kengetal voor invullen heel makkelijk maken.
// Test en leer dat"): de koppeling stuurt het, meldt de chat-hash terug (op=wakoppel) en vanaf dan is het een gewoon WhatsApp-gesprek met dit profiel
const WAWELKOM = { en: w => 'Hi! This is WAM. You asked to hear here when someone fits' + (w ? ': "' + w + '"' : '') + '. I am on it and I message you here as soon as someone fits. You can also just reply here with anything else you need or offer. Reply STOP to stop.', nl: w => 'Hoi! Dit is WAM. Je wilde het hier horen als iemand past' + (w ? ': "' + w + '"' : '') + '. Ik zoek verder en stuur je hier een bericht zodra iemand past. Je kunt hier ook gewoon antwoorden met iets anders dat je zoekt of biedt. Stoppen kan met STOP.' };
export async function waKoppel(b) {
  if (!(await waOk(b && b.sleutel))) return { ok: false, fout: 'sleutel' };
  const vid = b.code ? await kv.get('wam:code:' + String(b.code).toUpperCase()).catch(() => null) : null; if (!vid) return { ok: false };
  const p = await profiel(vid).catch(() => null); if (!p) return { ok: false };
  if (b.fout) { p.contact = Object.assign(p.contact || {}, { wanrFout: String(b.fout).slice(0, 20) }); await bewaarProfiel(p); await tel({ wa_nieuw_geenwa: 1 }).catch(() => {}); await LEER.telAlert(p.land, 'wa', 'geenwa').catch(() => {}); return { ok: true }; }
  const wie = waWie(b.wie); if (wie.length < 16) return { ok: false };
  p.contact = Object.assign(p.contact || {}, { wa: wie, waT: Date.now() }); await bewaarProfiel(p); await kv.set('wam:wa:' + wie, vid, { ex: TTL.p });
  await tel({ wa_nieuw_gekoppeld: 1, contact_wa: 1 }).catch(() => {}); await LEER.telAlert(p.land, 'wa', 'c').catch(() => {}); await LEER.telAlert(p.land, 'wanr', 'c').catch(() => {});
  return { ok: true };
}
export async function waUit(b) {
  if (!(await waOk(b && b.sleutel))) return { ok: false, fout: 'sleutel' };
  const st = await kv.get('wam:wa:stand').catch(() => null); if (st) { st.poll = Date.now(); await kv.set('wam:wa:stand', st).catch(() => {}); }
  const set = await kv.raw(['SMEMBERS', 'wam:waqset']).catch(() => []) || [], uit = [];
  for (const wie of [].concat(set).slice(0, 100)) {
    const x = await kv.raw(['LPOP', 'wam:waq:' + wie]).catch(() => null);
    if (!x) { await kv.raw(['SREM', 'wam:waqset', wie]).catch(() => {}); continue; }
    try { uit.push({ wie, tekst: JSON.parse(x).tekst }); } catch (e) {}
  }
  if (uit.length) await tel({ wa_uit: uit.length }).catch(() => {});
  const nieuw = []; for (let i = 0; i < 5; i++) { const x = await kv.raw(['LPOP', 'wam:wanrq']).catch(() => null); if (!x) break; try { nieuw.push(JSON.parse(x)); } catch (e) {} }
  return { ok: true, berichten: uit, nieuw, tweede: await kv.get('wam:wa:tweede').catch(() => null) };
}
// Tweede nummer alleen voor WAM (Henkjan 11 nov 17:18 UTC: "Ik haal van daag een whatsapp nr voor WAM ."): aan/uit en het nummer
// (voor een koppelcode) via op=watweede op de beschermde host; de koppeling (whatsappp-mcp src/wam2.js) start dan een tweede koppeling
// en stuurt QR, koppelcode en stand terug (op=waqr). Te zien op op=waqrpagina (beschermde host).
export async function waTweede({ aan, nr }) {
  const v = aan ? { aan: true, nr: String(nr || '').replace(/\D/g, '').slice(0, 15), t: Date.now() } : { aan: false, t: Date.now() };
  await kv.set('wam:wa:tweede', v); return { ok: true, tweede: { aan: v.aan, nummer: v.nr ? '…' + v.nr.slice(-3) : null } };
}
export async function waQr(b) {
  if (!(await waOk(b && b.sleutel))) return { ok: false, fout: 'sleutel' };
  const v = { status: kort(b.status || '', 20), qr: /^data:image\/png;base64,[A-Za-z0-9+/=]{100,20000}$/.test(String(b.qr || '')) ? b.qr : null, code: kort(b.code || '', 12), fout: kort(b.fout || '', 120), t: Date.now() };
  await kv.set('wam:wa:qr', v, { ex: 3600 });
  if (v.status === 'ready') await meldEenmaal('wa2klaar:' + dag(), 'WAM: het WhatsApp-nummer voor WAM is gekoppeld. De knop op wearemany.now gaat binnen een paar minuten naar dat nummer.').catch(() => {});
  return { ok: true };
}
export async function waQrPagina() {
  const v = (await kv.get('wam:wa:qr').catch(() => null)) || {}, t = await kv.get('wam:wa:tweede').catch(() => null);
  const esc = (x) => String(x || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const leeftijd = v.t ? Math.round((Date.now() - v.t) / 1000) : null;
  let kern;
  if (!t || !t.aan) kern = '<p>Het tweede nummer staat nog uit.</p>';
  else if (v.status === 'ready') kern = '<p style="font-size:22px">Gekoppeld. WAM draait nu op het nieuwe nummer.</p>';
  else if (v.code) kern = '<p>Open WhatsApp Business op de WAM-telefoon: Instellingen → Gekoppelde apparaten → Apparaat koppelen → <b>Koppelen met telefoonnummer</b>, en typ deze code:</p><p style="font:700 44px/1.2 ui-monospace,monospace;letter-spacing:4px">' + esc(v.code) + '</p>';
  else if (v.qr) kern = '<p>Open WhatsApp Business op de WAM-telefoon: Instellingen → Gekoppelde apparaten → Apparaat koppelen, en scan:</p><img alt="QR" width="320" height="320" src="' + esc(v.qr) + '">';
  else kern = '<p>Even geduld, de koppeling start (' + esc(v.status || 'start') + ').' + (v.fout ? ' Fout: ' + esc(v.fout) : '') + '</p>';
  return '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="5"><title>WAM WhatsApp koppelen</title><body style="font:16px/1.5 Inter,system-ui,sans-serif;max-width:520px;margin:40px auto;padding:0 16px;color:#111"><h1 style="font-size:22px">WAM WhatsApp koppelen</h1>' + kern + '<p style="color:#888;font-size:13px">Stand: ' + esc(v.status || '-') + (leeftijd != null ? ', ' + leeftijd + ' s geleden' : '') + '. Ververst elke 5 seconden.</p></body>';
}
export async function tellers(dagen = 1) { const uit = {}; for (let i = 0; i < Math.min(7, Math.max(1, N(dagen))); i++) { const d = dag(Date.now() - i * 86400000); uit[d] = await hget('wam:c:' + d).catch(() => ({})); } return uit; }
export async function waStand() {
  const st = await kv.get('wam:wa:stand').catch(() => null), sl = await kv.get('wam:wa:sleutel').catch(() => null), q = await kv.raw(['SCARD', 'wam:waqset']).catch(() => 0);
  return { aangesloten: !!sl, vinger: sl ? String(sl).slice(0, 8) : null, nummer: st && st.nr ? '…' + String(st.nr).slice(-3) : null, laatst_gezien_min: st ? Math.round((Date.now() - N(st.poll || st.t)) / 60000) : null, knop_aan: !!(await waLaad()), wachtrij_chats: N(q), versie: st && st.versie };
}

// ---------- mail als kanaal (Henkjan 10 nov 17:42: "Ja mail toch maar. En hij kan gewoon reply sturen. Die vang je op.") ----------
// Antwoorden op WAM-mails komen binnen via Resend (receiving op wearemany.now, webhook email.received naar op=mailin, en vanuit de
// keuzehulp-webhook doorgezet). De afzender wordt herkend aan het adres dat hij achterliet (wam:mailvid of wam:zwmail), praat verder in een
// eigen mailsessie en krijgt het antwoord per mail terug. Zijn aanbod of vraag wordt zo concreet; het adres gaat mee naar de nieuwe stand.
const MAILRE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
async function vidVoorMail(mail) {
  const v = await kv.get('wam:mailvid:' + mail).catch(() => null);
  const r = await kv.raw(['HGETALL', 'wam:zwmail']).catch(() => []) || []; const l = Array.isArray(r) ? r : Object.entries(r).flat();
  let zk = null; for (let i = 0; i + 1 < l.length; i += 2) if (String(l[i + 1]).toLowerCase() === mail) { zk = String(l[i]); if (!v || zk.startsWith(v + ':')) break; }
  return { vid: v || (zk ? zk.split(':')[0] : null), zk };
}
function zonderCitaat(t) {
  const regels = String(t || '').replace(/\r/g, '').split('\n'); const uit = [];
  for (const r of regels) { if (/^\s*(>|On .{4,120}wrote:?\s*$|Op .{4,120}schreef|Am .{4,120}schrieb|-{2,}\s*Original|From:\s|Van:\s|Sent from my )/i.test(r)) break; uit.push(r); }
  return uit.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 1200);
}
async function mailSessie(mail, vid, p, zk) {
  const sid = createHash('sha256').update('mail|' + mail).digest('hex').slice(0, 16);
  let s = await sessie(sid);
  if (!s) {
    let eigen = null; if (zk) { const st = await zoekStand().catch(() => null); const z = st && st.lijst.find(x => String(x.k) === zk); if (z) eigen = { k: zk, kant: z.kant, wat: z.wat, soort: z.soort, eisen: z.eisen, waar: z.waar, land: z.land }; }
    const vorigeMail = zk ? await kv.get('wam:detailtekst:' + zk).catch(() => null) : null;
    const g0 = eigen ? matchGat(eigen) : []; const ctxTekst = vorigeMail || (eigen ? 'You ' + (eigen.kant === 'biedt' ? 'offer' : 'are looking for') + ': ' + eigen.wat + '.' + (g0.includes('wat') ? ' What exactly is it?' : '') + (g0.includes('waar') ? ' Which town or area ' + (eigen.kant === 'biedt' ? 'do you cover, and how far do you go?' : 'should it be in?') : ' I will email you the moment someone fits.') : 'I will email you the moment someone fits.');
    s = { sid, vid, t0: Date.now(), ctx: { taal: (p && p.taal) || 'en', land: (p && p.land) || (eigen && eigen.land) || '', kanaal: 'mail' }, params: {}, hook: '', opener: 'mail', berichten: [{ r: 'b', t: Date.now(), x: ctxTekst, k: [] }], beurten: 2, echt: true, contactGevraagd: 2, zoek: 0, ev: {}, eigen, matchNiemand: 1, zk };
    await bewaarSessie(s);
  }
  return s;
}
export async function mailIn(m, id) {
  if (id) { const r0 = await kv.raw(['SET', 'wam:mailin:' + id, '1', 'NX', 'EX', String(14 * 86400)]).catch(() => 'OK'); if (!r0) return { ok: true, dubbel: true }; } // SET NX geeft OK of null
  const fromRaw = String((m && m.from) || ''); const mail = (((fromRaw.match(/<([^>]+)>/) || [])[1]) || fromRaw).trim().toLowerCase();
  const proef = String((m && m.subject) || '').match(/WAM-PROEF ([0-9a-f]{8})/); if (proef) { await kv.set('wam:mailproef:' + proef[1], { t: Date.now(), van: mail.replace(/^[^@]+/, '***'), tekst: zonderCitaat(String((m && m.text) || '')).slice(0, 80) }, { ex: 86400 }); return { ok: true, proef: proef[1] }; }
  if (!MAILRE.test(mail) || /@wearemany\.now$/.test(mail)) return { ok: true, overgeslagen: true };
  let tekst = String((m && m.text) || '').trim(); if (!tekst && m && m.html) tekst = html2tekst(m.html);
  tekst = zonderCitaat(tekst);
  await tel({ mail_in: 1 }).catch(() => {});
  const { vid, zk } = await vidVoorMail(mail);
  if (!vid || !tekst) { await meld('WAM: mail binnen' + (vid ? ' zonder tekst' : ' van iemand die ik niet ken') + ': ' + kort(tekst || (m && m.subject) || '', 300)).catch(() => {}); return { ok: true, onbekend: !vid }; }
  const p = await profiel(vid); if (!p) return { ok: true, geenProfiel: true };
  if (/^\s*(stop|unsubscribe|remove me|no thanks)\b/i.test(tekst)) {
    p.contact = Object.assign(p.contact || {}, { stop: true }); await bewaarProfiel(p); if (zk) await kv.raw(['HDEL', 'wam:zwmail', zk]).catch(() => {});
    await tel({ mail_stop: 1 }).catch(() => {}); return { ok: true, stop: true };
  }
  const s = await mailSessie(mail, vid, p, zk);
  const vorig = (s.berichten || []).filter(b => b.r === 'b').slice(-1)[0]; const kn = vorig && (vorig.k || []).find(k => k.toLowerCase() === tekst.toLowerCase().replace(/[.!]+$/, ''));
  const r = await zeg(kn ? { sid: s.sid, tok: await teken(s.sid), knop: kn, ip: 'mail' } : { sid: s.sid, tok: await teken(s.sid), x: tekst, ip: 'mail' });
  // het achtergelaten adres gaat mee naar de nieuwe, concretere stand van zijn aanbod of vraag
  const s2 = await sessie(s.sid); if (s2 && s2.eigen && s2.eigen.k && s2.eigen.k !== zk) { await kv.raw(['HSET', 'wam:zwmail', s2.eigen.k, mail]).catch(() => {}); }
  await kv.set('wam:mailvid:' + mail, vid, { ex: TTL.p }).catch(() => {});
  if (r && r.ok) {
    const body = (r.match ? r.match + '\n\n' : '') + r.x + (r.knoppen && r.knoppen.length ? '\n\nYou can simply reply with one of these:\n' + r.knoppen.map(k => '• ' + k).join('\n') : '') + '\n\nJust reply to this email. Your address stays private.';
    const l = await postLinks(vid); const taal = (p && p.taal) || 'en'; const subj = String((m && m.subject) || 'WAM').replace(/^(re:\s*)+/i, '');
    try { await POST.stuurMail({ to: mail, subject: 'Re: ' + kort(subj, 80), html: POST.mailHtml({ taal, tekst: body, knop: 'Open the chat', ...l }), text: POST.mailTekst({ taal, tekst: body, knop: 'Open the chat', ...l }), stopUrl: l.stopUrl }); await tel({ mail_uit: 1 }).catch(() => {}); } catch (e) { await tel({ mail_fout: 1 }).catch(() => {}); }
  }
  await meld('WAM: mail-antwoord van een gebruiker verwerkt: "' + kort(maskeer(tekst), 140) + '"' + (r && r.match ? ' en er is een match' : '') + '.').catch(() => {});
  return { ok: true, vid: !!vid, antwoord: !!(r && r.ok), match: !!(r && r.match) };
}
function html2tekst(h) { return String(h || '').replace(/<(br|\/p|\/div)[^>]*>/gi, '\n').replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'); }
// Wie zijn mail achterliet maar nog te vaag is om te matchen, krijgt één keer een korte mail met de vraag om dat ene detail (antwoorden kan gewoon met reply).
const VB = { dienst: 'house cleaning, lawn care, handyman repairs, tutoring', iets: 'used furniture, phones, clothes, tools', baan: 'warehouse, retail, cleaning, office work', woning: 'a private room, a studio, a 2-bedroom apartment', anders: 'house cleaning, used furniture, a part-time job, a room' };
export async function detailMails(opts = {}) {
  if (!(await POST.mailKlaar())) return { klaar: false };
  if (!(await POST.ontvangKlaar())) return { klaar: false, waarom: 'ontvangen nog niet klaar (MX op wearemany.now ontbreekt of is nog niet geverifieerd)' };
  const r = await kv.raw(['HGETALL', 'wam:zwmail']).catch(() => []) || []; const l = Array.isArray(r) ? r : Object.entries(r).flat();
  if (!l.length) return { n: 0 };
  const st = await zoekStand(); const per = new Map(st.lijst.map(z => [String(z.k), z])); let n = 0; const uit = [], bekeken = [];
  for (let i = 0; i + 1 < l.length; i += 2) {
    const zk = String(l[i]), mail = String(l[i + 1]).toLowerCase(), z = per.get(zk); if (!z || !MAILRE.test(mail)) { bekeken.push({ zk: zk.slice(-6), waarom: z ? 'geen geldig adres' : 'stand niet (meer) open' }); continue; }
    if (!opts.nu && Date.now() - N(z.tb) < 10 * 60000) { bekeken.push({ wat: kort(z.wat, 40), waarom: 'nog geen 10 minuten' }); continue; }
    const gat = matchGat(z); bekeken.push({ wat: kort(z.wat, 40), waar: kort(z.waar || '', 30), gat }); if (!gat.length) continue;
    const vid = zk.split(':')[0]; const pp = await profiel(vid).catch(() => null); if (pp && pp.contact && pp.contact.stop) continue;
    if (N(await kv.raw(['SADD', 'wam:detailmail', zk]).catch(() => 0)) !== 1) continue;
    const ms = msoort(z), vb = VB[ms] || VB.anders, bied = z.kant === 'biedt';
    const vragen = [gat.includes('wat') ? '• What exactly is it? For example: ' + vb + '.' : '', gat.includes('waar') ? (bied ? '• Which town or area do you cover, and how far do you go?' : '• Which town or area should it be in, and is further away fine too?') : ''].filter(Boolean);
    const tekst = 'Hi, WAM here. Thanks for leaving your email.\n\n' + (gat.includes('wat') ? '' : 'You ' + (bied ? 'offer' : 'are looking for') + ': ' + kort(z.wat, 90) + '.\n\n') + 'To find people who ' + (bied ? 'need this' : 'offer this') + ', I need ' + (vragen.length === 1 ? 'one detail' : 'two details') + ':\n' + vragen.join('\n') + '\n\nJust reply to this email in your own words. The moment someone fits, I email you. Your address stays private.';
    const lk = await postLinks(vid); await kv.set('wam:detailtekst:' + zk, tekst, { ex: 30 * 86400 }).catch(() => {});
    try { await POST.stuurMail({ to: mail, subject: 'WAM: one detail and I can match you', html: POST.mailHtml({ taal: 'en', tekst, knop: 'Or answer in the chat', ...lk }), text: POST.mailTekst({ taal: 'en', tekst, knop: 'Or answer in the chat', ...lk }), stopUrl: lk.stopUrl, idem: 'detail-' + zk }); n++; uit.push(kort(z.wat, 40)); await tel({ detailmail: 1 }).catch(() => {}); }
    catch (e) { await kv.raw(['SREM', 'wam:detailmail', zk]).catch(() => {}); uit.push('fout: ' + String(e && e.message || e).slice(0, 80)); }
  }
  if (n) await meld('WAM: ' + n + ' detailmail' + (n === 1 ? '' : 's') + ' verstuurd aan wie wacht maar nog te vaag is (' + uit.join('; ') + '). Antwoorden komen terug in de chat.').catch(() => {});
  return { n, uit, bekeken };
}

// ---------- beloftes nakomen (wat de bot belooft te sturen, sturen we echt) ----------
// De bot zet "belofte" in zijn JSON zodra hij iets toezegt. Die komt in het profiel en in de wachtrij wam:beloften (score = moment).
// De leerronde (elk uur) zoekt verse feiten op, laat Haiku het bericht schrijven en stuurt het per mail (Resend, wam@wearemany.now)
// of Telegram. Geen contact binnen 3 dagen na het moment: vervalt. Stoplink in elke mail; wie stopt, krijgt niets meer.
function wanneerVan(w) {
  const nu = Date.now(), d = String(w || '').match(/in\s+(\d+)\s*(day|dag|tag)/i); if (d && N(d[1]) > 0 && N(d[1]) < 60) return nu + N(d[1]) * 86400000;
  const m = String(w || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return 0;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3], 13); return Number.isFinite(t) && t > nu + 3600000 && t < nu + 120 * 86400000 ? t : 0;
}
async function beloof(p, s, b, test) {
  const wat = kort(b.wat, 240); if (!wat) return null; p.beloften = p.beloften || [];
  const open = p.beloften.filter(x => x.status === 'open'); if (open.some(x => x.wat === wat) || open.length >= 5) return null;
  const x = { id: hex(4), wat, wanneer: wanneerVan(b.wanneer), t: Date.now(), sid: s.sid, taal: (s.ctx && s.ctx.taal) || p.taal || 'en', status: 'open', ...(b.zid ? { zid: b.zid, ronde: N(b.ronde) } : {}), ...(test ? { test: true } : {}) };
  p.beloften = [...p.beloften, x].slice(-20);
  if (!test) await kv.raw(['ZADD', 'wam:beloften', String(x.wanneer || Date.now() + 20 * 60000), p.vid + ':' + x.id]).catch(() => {});
  return x;
}
async function tgStuur(chatId, tekst) {
  const tok = process.env.WAM_TG_TOKEN; if (!tok) throw Error('geen telegram');
  const r = await fetch('https://api.telegram.org/bot' + tok + '/sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: String(tekst).slice(0, 3900), disable_web_page_preview: true }), signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw Error('telegram ' + r.status);
}
async function maakPost(p, b) {
  const zt = b.zid && (p.zoektochten || []).find(y => y.id === b.zid);
  const vraag = zt ? [zt.wat, zt.eisen, zt.waar].filter(Boolean).join(' ') : b.wat;
  let feiten = ''; if (await binnenPlafond(0.02)) feiten = await zoekOp(vraag, { ctx: { land: p.land } }).catch(() => '');
  const eerder = zt ? (p.beloften || []).filter(x => x.zid === b.zid && x.status === 'verstuurd').map(x => kort(x.tekst, 300)).join(' | ') : '';
  const sys = `You write a follow-up message from WAM (We Are Many), an AI assistant, to someone who asked for it in a chat on wearemany.now. Write in language "${b.taal}". Deliver exactly what was promised, concrete and useful, using the search results for current facts. Never invent numbers, prices or dates: if a fact is not in the results, say honestly that it is not known yet and what they can do. Plain text, max 170 words, short paragraphs; a list may use "- " lines. Friendly and direct, no greeting fluff, no sales, no links (you may name a source domain). End by inviting them to continue in the chat for the next step. Return ONLY JSON: {"onderwerp":"subject line, max 60 characters, specific","tekst":"the message","knop":"button text to continue in the chat, max 24 characters"}`;
  const bmInfo = []; for (const m of (p.metingen || []).slice(-3)) { const { st } = await bmVergelijk(m).catch(() => ({ st: { n: 0 } })); bmInfo.push(m.sleutel + ': they said ' + (m.keuze || (m.waarde + ' ' + m.eenheid)) + (st.n < BM_MIN ? '; only ' + st.n + ' others answered so far, too few to compare' : m.keuze ? '; ' + st.n + ' others answered WAM anonymously, ' + Math.round(N(st.zelfde) / st.n * 100) + '% chose the same, most common ' + (st.keuzes || []).slice(0, 2).map(([k, c]) => k + ' ' + Math.round(c / st.n * 100) + '%').join(', ') : '; ' + st.n + ' others answered WAM anonymously, median ' + st.mediaan + ', middle half ' + st.p25 + '-' + st.p75)); }
  const user = 'Today is ' + dag() + '.\n' + (bmInfo.length ? 'Their anonymous benchmarks (people who answered WAM; use these, they exist nowhere else): ' + bmInfo.join('; ') + '\n' : '') + 'Promised on ' + dag(b.t) + ': ' + b.wat + (zt ? '\nThey are looking for: ' + zt.wat + (zt.eisen ? '; must-haves: ' + zt.eisen : '') + (zt.waar ? '; where: ' + zt.waar : '') + '. Give 2-4 concrete new leads from the search results (name, what, why it fits). If nothing new fits, say so honestly and give one tip.' + (eerder ? '\nAlready sent before (do not repeat these leads): ' + eerder : '') : '') + '\nAbout this person: ' + kort(p.samenvatting, 300) + '\nTheir wishes: ' + (p.intenties || []).slice(-5).map(i => i.wat + (i.grens ? ' (limit ' + i.grens + ')' : '')).join('; ') + '\nFacts: ' + kort(JSON.stringify(p.feiten || {}), 400) + '\nCountry: ' + (p.land || '?') + '\n\nSearch results:\n' + (feiten || '(none)');
  const r = await berichten({ fn: 'wam-post', model: HAIKU, system: sys, user, max: 800, timeout: 25000 });
  await boekKost(kostVan(r.model, r.usage), 'post');
  const j = leesJson(r.txt); if (!j || !j.tekst) throw Error('geen posttekst');
  return { onderwerp: kort(j.onderwerp, 78), tekst: kort(j.tekst, 2000), knop: kort(j.knop, 24) || ({ nl: 'Verder in de chat', de: 'Weiter im Chat' }[b.taal] || 'Continue in the chat') };
}
async function postLinks(vid) { const w = await linkTok(vid); return { chatUrl: 'https://wearemany.now/?w=' + w + '&van=post', stopUrl: 'https://wearemany.now/api/wam?op=stop&w=' + w }; }
// Voorbeeld van een post zonder te versturen (beschermde host): vid + belofte-id, of de laatste belofte van dat profiel.
export async function postVoorbeeld(vid, id) {
  const p = await profiel(vid); if (!p) return { ok: false, fout: 'geen profiel' };
  const b = (p.beloften || []).find(x => x.id === id) || (p.beloften || []).slice(-1)[0]; if (!b) return { ok: false, fout: 'geen belofte' };
  const m = await maakPost(p, b); const l = await postLinks(vid);
  return { ok: true, belofte: b, ...m, html: POST.mailHtml({ taal: b.taal, tekst: m.tekst, knop: m.knop, ...l }) };
}
export async function beloftenRonde({ max = 15 } = {}) {
  const nu = Date.now(), uit = { verstuurd: 0, wacht: 0, weg: 0, fouten: [] };
  const ids = await kv.raw(['ZRANGEBYSCORE', 'wam:beloften', '-inf', String(nu), 'LIMIT', '0', String(max)]).catch(() => []);
  if (!Array.isArray(ids) || !ids.length) return uit;
  const klaar = await POST.mailKlaar(), tg = !!process.env.WAM_TG_TOKEN, waNu = !!(await waLaad());
  for (const lid of ids) {
    const [vid, id] = String(lid).split(':'); const p = await profiel(vid); const b = p && (p.beloften || []).find(x => x.id === id);
    const weg = async status => { if (b) { b.status = status; b.ts = nu; await bewaarProfiel(p); } await kv.raw(['ZREM', 'wam:beloften', lid]).catch(() => {}); uit.weg++; };
    if (!b || b.status !== 'open') { await weg(b ? b.status : 'onbekend'); continue; }
    const c = p.contact || {}, moment = b.wanneer || b.t;
    if (c.stop) { await weg('gestopt'); continue; }
    const kanaal = c.mail && klaar ? 'mail' : c.tg && tg ? 'tg' : c.wa && waNu ? 'wa' : c.push && c.push.endpoint ? 'push' : '';
    if (!kanaal) {
      if (!c.mail && !c.tg && !c.wa && !c.push) { if (nu - moment > 3 * 86400000) await weg('geen_contact'); else uit.wacht++; continue; }
      uit.wacht++; await meldEenmaal('postwacht:' + dag(), 'WAM: er liggen beloftes klaar om te mailen, maar het verzenddomein wearemany.now is nog niet geverifieerd bij Resend.');
      if (nu - moment > 14 * 86400000) await weg('verlopen'); continue;
    }
    if (!(await binnenPlafond(0.03))) { uit.wacht++; break; }
    try {
      const m = await maakPost(p, b); const l = await postLinks(vid);
      if (kanaal === 'mail') await POST.stuurMail({ to: c.mail, subject: m.onderwerp || 'WAM', html: POST.mailHtml({ taal: b.taal, tekst: m.tekst, knop: m.knop, ...l }), text: POST.mailTekst({ taal: b.taal, tekst: m.tekst, knop: m.knop, ...l }), stopUrl: l.stopUrl, idem: 'wam-post-' + vid + '-' + id });
      else if (kanaal === 'tg') await tgStuur(c.tg, m.tekst + '\n\n' + l.chatUrl);
      else if (kanaal === 'wa') await waStuur(c.wa, m.tekst + '\n\n' + l.chatUrl);
      else { p.pushNext = { title: kort(m.onderwerp || 'We Are Many', 60), body: kort(m.tekst.replace(/\s+/g, ' '), 180), url: l.chatUrl }; await bewaarProfiel(p); try { await PUSH.stuurPush(c.push); } catch (e) { if (e.weg) { delete c.push; await bewaarProfiel(p); } throw e; } }
      Object.assign(b, { status: 'verstuurd', tv: Date.now(), kanaal, onderwerp: m.onderwerp, tekst: m.tekst });
      const zt = b.zid && (p.zoektochten || []).find(y => y.id === b.zid);
      if (zt && zt.status === 'open' && N(b.ronde) < 3 && !c.stop) { const nb = { id: hex(4), wat: b.wat, wanneer: Date.now() + 4 * 86400000, t: Date.now(), sid: b.sid, taal: b.taal, status: 'open', zid: b.zid, ronde: N(b.ronde) + 1 }; p.beloften = [...p.beloften, nb].slice(-20); await kv.raw(['ZADD', 'wam:beloften', String(nb.wanneer), vid + ':' + nb.id]).catch(() => {}); }
      await bewaarProfiel(p); await kv.raw(['ZREM', 'wam:beloften', lid]).catch(() => {});
      await tel({ post: 1, ['post_' + kanaal]: 1 }); uit.verstuurd++;
    } catch (e) {
      const f = String(e && e.message || e).slice(0, 140); uit.fouten.push(f); b.pogingen = N(b.pogingen) + 1;
      if (b.pogingen >= 3) { b.status = 'mislukt'; b.fout = f; await kv.raw(['ZREM', 'wam:beloften', lid]).catch(() => {}); await meldEenmaal('postfout:' + dag(), 'WAM: een belofte kon na 3 pogingen niet verstuurd worden: ' + f); }
      else await kv.raw(['ZADD', 'wam:beloften', String(nu + 3600000), lid]).catch(() => {});
      await bewaarProfiel(p);
    }
  }
  return uit;
}
export async function beloftenStand() { const n = N(await kv.raw(['ZCARD', 'wam:beloften']).catch(() => 0)); const nu = N(await kv.raw(['ZCOUNT', 'wam:beloften', '-inf', String(Date.now())]).catch(() => 0)); return { open: n, nuAan: nu, mailKlaar: await POST.mailKlaar() }; }
// Stoplink uit een mail: geen berichten meer (weer=1 zet het terug).
export async function stopPost(w, weer) {
  const vid = await vidVanLink(w); if (!vid) return null; const p = await profiel(vid); if (!p) return null;
  p.contact = p.contact || {}; if (weer) delete p.contact.stop; else p.contact.stop = Date.now();
  await bewaarProfiel(p); await tel({ [weer ? 'post_weer' : 'post_stop']: 1 }); return p;
}

// Telegram-bot instellen: webhook naar wearemany.now met geheime kop, plus beschrijving per taal. De leerronde doet dit zelf zodra
// WAM_TG_TOKEN bestaat en het nog niet gebeurd is (wam:tgklaar), zodat niemand op een handmatige stap hoeft te wachten.
export async function telegramZet() {
  const tok = process.env.WAM_TG_TOKEN; if (!tok) return { ok: false, fout: 'WAM_TG_TOKEN ontbreekt' };
  const geheim = createHmac('sha256', tok).update('wam-tg').digest('hex').slice(0, 32);
  const tg = (m, body) => fetch('https://api.telegram.org/bot' + tok + '/' + m, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) }).then(x => x.json()).catch(e => ({ ok: false, fout: String(e).slice(0, 80) }));
  const r = await tg('setWebhook', { url: 'https://wearemany.now/api/wam?op=tg', secret_token: geheim, allowed_updates: ['message'] });
  const BES = { en: ['WAM is your own personal fixer. Ask anything: I look things up, compare prices, help you cancel or complain, and remember what you asked so I can tell you when something changes. Free.', 'Your own personal fixer. Free.'],
    nl: ['WAM is je eigen regelaar. Vraag wat je wilt: ik zoek dingen uit, vergelijk prijzen, help je opzeggen of klagen en onthoud wat je vroeg, zodat ik je laat weten als er iets verandert. Gratis.', 'Je eigen regelaar. Gratis.'],
    de: ['WAM ist dein eigener Kümmerer. Frag einfach: Ich recherchiere, vergleiche Preise, helfe beim Kündigen oder Beschweren und merke mir, was du gefragt hast, damit ich mich melde, wenn sich etwas ändert. Kostenlos.', 'Dein eigener Kümmerer. Kostenlos.'] };
  const uit = { ok: !!(r && r.ok), webhook: r };
  for (const [t, [lang, kortB]] of Object.entries(BES)) { const lc = t === 'en' ? {} : { language_code: t }; uit['beschrijving_' + t] = !!(await tg('setMyDescription', { description: lang, ...lc })).ok; uit['kort_' + t] = !!(await tg('setMyShortDescription', { short_description: kortB, ...lc })).ok; }
  const info = await tg('getWebhookInfo', {}); if (info && info.result) uit.info = { url: info.result.url, wachtend: info.result.pending_update_count, fout: info.result.last_error_message || '' };
  if (!uit.ok && uit.info && uit.info.url === 'https://wearemany.now/api/wam?op=tg') uit.ok = true; // setWebhook antwoordt soms traag, maar staat dan wel
  if (uit.ok) await kv.set('wam:tgklaar', { t: Date.now(), bot: process.env.WAM_TG_BOT || '' }).catch(() => {});
  return uit;
}

// ---------- melden aan Henkjan (doorgeefluik todayin-spel, zoals de Clickmind-uurwacht) ----------
export async function meld(tekst) {
  const s = process.env.MELD_SLEUTEL; if (!s) return false;
  try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'WAM', tekst: String(tekst).slice(0, 3400) }), signal: AbortSignal.timeout(10000) }); const j = await r.json().catch(() => ({})); return !!(j && j.ok); } catch (e) { return false; }
}
async function meldEenmaal(sleutel, tekst) { const nieuw = await kv.raw(['SET', 'wam:meld:' + sleutel, '1', 'NX', 'EX', '172800']).catch(() => null); if (nieuw) await meld(tekst); }

// ---------- cijfers ----------
async function hget(k) { const r = await kv.raw(['HGETALL', k]).catch(() => []); const o = {}; const a = Array.isArray(r) ? r : Object.entries(r || {}).flat(); for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = N(a[i + 1]); return o; }
// Clickmind beslist wie een echt mens is (Henkjan 9 nov: "Gebruik clickmind voor mensen"): cm.js op de pagina meet de browser
// (mensmeter) en meldt echt (aanraking of scroll en 3 s in beeld), actie en aanmelding per klik-id; de wissel /w/wam telt de kliks.
// Hier lezen we die tellers van de wissel wam terug (mm:w:<dag>, velden wam|<arm>|n, echt, actie, aanmelding).
async function clickmindDag(d) {
  const h = await hget('mm:w:' + d), o = {};
  for (const [k, v] of Object.entries(h)) { const [w, , veld] = k.split('|'); if (w !== 'wam') continue; const naam = { n: 'cm_kliks', echt: 'cm_echt', actie: 'cm_actie', aanmelding: 'cm_aanmelding' }[veld]; if (naam) o[naam] = (o[naam] || 0) + v; }
  return o;
}
// per gesprek het oordeel van Clickmind (klikrecord mm:cid:<mmc>)
export async function cmOordeel(lijst) {
  const uit = {};
  await Promise.all((lijst || []).filter(x => x && x.params && /^[0-9a-f]{8,24}$/.test(String(x.params.mmc || ''))).map(async x => {
    const r = await kv.raw(['HMGET', 'mm:cid:' + x.params.mmc, 'u:echt', 'u:actie', 'u:aanmelding']).catch(() => null);
    if (Array.isArray(r)) uit[x.sid] = { echt: !!r[0], actie: !!r[1], aanmelding: !!r[2] };
  }));
  return uit;
}
export async function cijfers(dagen = 1) {
  const som = {}, perDag = [];
  for (let i = 0; i < dagen; i++) { const d = dag(Date.now() - i * 86400000); const c = Object.assign(await hget('wam:c:' + d), await clickmindDag(d).catch(() => ({}))); perDag.push({ dag: d, ...c }); for (const [k, v] of Object.entries(c)) som[k] = (som[k] || 0) + v; }
  return { som, perDag };
}
// gesprekken van de laatste dagen: hoe ver ze kwamen en waar ze afhaakten
export async function gesprekken(dagen = 1, max = 400) {
  // oudste dag eerst, zodat slice(-max) de nieuwste gesprekken houdt (11 nov: vandaag viel weg en het rapport toonde alleen campagnes van gisteren)
  const sids = []; for (let i = dagen - 1; i >= 0; i--) { const l = await kv.raw(['LRANGE', 'wam:sessies:' + dag(Date.now() - i * 86400000), '0', '-1']).catch(() => []); sids.push(...(l || [])); }
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
  const betaald = N(s.betaald), echt = N(s.echt), js = N(s.ev_js), cmK = N(s.cm_kliks), cmE = N(s.cm_echt);
  if (betaald >= 100 && cmE === 0 && echt === 0) alarmen.push('A. 100+ betaalde bezoeken in 2 dagen en 0 echte mensen gemeld aan het netwerk (Clickmind): de netwerken leren niets.');
  const pbFout = gs.filter(x => x.pbFout).length; if (pbFout) alarmen.push('B. ' + pbFout + ' terugmeldingen naar het netwerk geweigerd.');
  if (N(s.geladen) >= 200 && js / Math.max(1, N(s.geladen)) < 0.3) alarmen.push('C. Van ' + s.geladen + ' geladen pagina\'s draaide maar bij ' + js + ' het script: veel bots of een kapotte pagina.');
  if (cmK >= 200 && cmE / cmK < 0.05) alarmen.push('C. Clickmind: ' + cmK + ' kliks via de wissel en maar ' + cmE + ' echte mensen (<5%): vooral bots of verkeer dat niets doet.');
  else if (!cmK && N(s.geladen) >= 200 && echt / Math.max(1, N(s.geladen)) < 0.05) alarmen.push('C. ' + s.geladen + ' bezoeken en maar ' + echt + ' in gesprek (<5%).');
  const perZone = {}; for (const x of gs) if (x.params && x.params.z) perZone[x.params.z] = (perZone[x.params.z] || 0) + 1;
  const top = Object.entries(perZone).sort((a, b) => b[1] - a[1])[0]; if (top && gs.length >= 20 && top[1] / gs.length >= 0.6) alarmen.push('D. ' + Math.round(top[1] / gs.length * 100) + '% van de echte mensen komt uit één plek (' + top[0] + '): inkoop te smal.');
  const leegZone = gs.filter(x => x.params && x.params.n && (!x.params.z || /[{\[]|zoneid/i.test(x.params.z))).length; if (leegZone >= 5) alarmen.push('E. ' + leegZone + ' betaalde gesprekken zonder ingevulde zonecode.');
  if (cmE >= 30 && echt === 0) alarmen.push('F. Clickmind ziet ' + cmE + ' echte mensen, maar niemand begint een gesprek: de opener of de pagina is het lek.');
  if (echt >= 30 && N(s.contact) === 0) alarmen.push('F. ' + echt + ' echte mensen in gesprek en 0 contactgegevens: de vraag om contact werkt niet.');
  return alarmen;
}

async function coach(gs, c3, ls, o, st) {
  const afgelopen = gs.filter(s => reden(s) !== 'bezig');
  const redenen = {}; for (const s of afgelopen) { const r = reden(s); redenen[r] = (redenen[r] || 0) + 1; }
  const voorbeelden = afgelopen.slice(-60).sort(() => Math.random() - 0.5).slice(0, 14).map(s => ({ beurten: s.beurten, reden: reden(s), contact: s.berichten.some(m => m.cv), taal: s.ctx && s.ctx.taal, hook: s.hook, gesprek: s.berichten.slice(0, 8).map(m => (m.r === 'b' ? 'W: ' : 'U: ') + kort(m.x, 220)) }));
  const openStand = Object.values(o).filter(x => x.actief).map(x => ({ id: x.id, taal: x.taal, familie: x.familie, tekst: x.tekst, getoond: N((st[x.id] || {}).g), gesprek: N((st[x.id] || {}).e), contact: N((st[x.id] || {}).c), terug: N((st[x.id] || {}).t) }));
  const sys = 'You are the coach of WAM, a chat assistant for cold ad traffic. Goal: a relationship with every visitor: more people start talking, talk longer, come back, and leave contact details (email/WhatsApp/Telegram), because WAM gave them real value. Openers may be about ANY topic (not only money or deals): anything honest that gets a stranger on a phone talking and lets WAM be useful or interesting, such as a question about their week, a dilemma, something local, a fun fact they can react to. Use family "vrij" for those. You improve WAM by proposing at most 2 changes per round, based on evidence. Be concrete and honest; if the data is too thin, change nothing. Proven principles to build on (label each lesson with its principle): specific, context-aware openers under ~15 words beat generic greetings; short replies that reflect the user and end with a curious follow-up question (what/how, not why) keep people talking; a bot that shares small honest facts about itself gets more disclosure and trust back; remembering concrete details drives return visits (a wellness bot doubled 30-day retention by improving memory and prompts); mix free text with tap buttons (engagement drops when more than ~60% of user input is buttons, compare knoptik vs getypt); follow-ups by message only after real engagement, one message, stop if ignored. Never propose emotional manipulation (guilt, FOMO, pressure or ignoring a goodbye): it lifts short-term engagement but is the strongest predictor of churn, bad word of mouth and legal risk.';
  const user = 'North star (Henkjan 9 nov): engagement time, how long real people keep talking and answering. Every answer they give gets back what others answered, in percentages, so answering stays fun.\nFunnel last 3 days: ' + JSON.stringify(c3.som) + '\nWhy people left (heuristic): ' + JSON.stringify(redenen) + '\nOpeners (shown/started talking/contact/came back): ' + JSON.stringify(openStand) + '\nScreen layout tests (per variant: g shown, e started talking, b3 reached turn 3, c contact, t came back): ' + JSON.stringify(await uxStand().catch(() => ({}))) + '\nContact button test (text and position; g shown, k tapped, c contact given): ' + JSON.stringify(await cpilStand().catch(() => ({}))) + '\nAnonymous benchmark answers so far (give-to-get; a data moat: ask for one number, compare honestly): ' + JSON.stringify((await bmOverzicht().catch(() => [])).slice(0, 15)) + '\nCurrent lessons: ' + JSON.stringify((ls.regels || []).map((r, i) => ({ i, tekst: r.tekst, principe: r.principe }))) + '\nSample conversations: ' + JSON.stringify(voorbeelden) +
    '\n\nReturn ONLY JSON: {"analyse":"2-3 sentences: the biggest leak and why","lessen_nieuw":[{"tekst":"short imperative rule for WAM (max 160 chars)","principe":"behavioural principle"}],"lessen_weg":[index],"openers_nieuw":[{"taal":"nl|en|de|...","familie":"open|besparen|wens|opzeggen|samen|vrij","tekst":"opening line, may start with {groet}, max 160 chars","knoppen":["max 4 tap answers, max 28 chars"]}],"openers_uit":["id"]}. Total changes (new lessons + removed lessons + new openers + openers off) at most 2. Only switch off an opener with 50+ shows that clearly loses.';
  const r = await berichten({ fn: 'wam-coach', model: SONNET, system: sys, user, max: 1400, timeout: 60000 });
  await boekKost(kostVan(r.model, r.usage), 'coach');
  return { voorstel: leesJson(r.txt), redenen };
}

// dagelijkse vraag: 's ochtends lokale tijd (9-11 uur) een kort bericht met wat er nieuw is bij jou en de vraag wat WAM vandaag kan vinden;
// alleen via WhatsApp of Telegram aan wie daar zelf met WAM praatte, nooit na STOP, hoogstens WAM_DAGV_MAX (60) per dag
const DV_TZ = { CA: 'America/Toronto', US: 'America/New_York', NL: 'Europe/Amsterdam', BE: 'Europe/Brussels', DE: 'Europe/Berlin', GB: 'Europe/London', CW: 'America/Curacao', IN: 'Asia/Kolkata', CO: 'America/Bogota' };
const DVT = {
  en: { nieuw: (st, d) => 'New ' + (st ? 'in ' + st : 'near you') + ' since yesterday: ' + d + '.', v1: n => (n ? n + '\n\n' : '') + 'What can I find for you today? A room, work, a job done, something to buy or sell. Just tell me.', v2: n => 'Good morning! What can I find for you today?' + (n ? '\n\n' + n : ''), v3: (n, st) => 'Ask me anything about who is around' + (st ? ' in ' + st : '') + ', like "who sells a bike?" or "anyone renting a room?".' + (n ? '\n\n' + n : ''), stop: 'Reply STOP to stop these.' },
  nl: { nieuw: (st, d) => 'Nieuw ' + (st ? 'in ' + st : 'bij jou in de buurt') + ' sinds gisteren: ' + d + '.', v1: n => (n ? n + '\n\n' : '') + 'Wat kan ik vandaag voor je vinden? Een kamer, werk, een klus, iets kopen of verkopen. Zeg het maar.', v2: n => 'Goedemorgen! Wat kan ik vandaag voor je vinden?' + (n ? '\n\n' + n : ''), v3: (n, st) => 'Vraag me alles over wie er' + (st ? ' in ' + st : '') + ' is, zoals "wie verkoopt een fiets?" of "verhuurt iemand een kamer?".' + (n ? '\n\n' + n : ''), stop: 'Stoppen kan met STOP.' } };
async function nieuwBijJou(land, stad, taal) {
  const st = await zoekStand().catch(() => null); if (!st) return ''; const L = String(land || '').toUpperCase(), sp = mplaats(stad || ''), nu = Date.now(), per = {};
  for (const z of st.lijst) { if ((z.land || '') !== L || nu - N(z.t || z.tb) > 86400000) continue; if (sp && !(mplaats(z.waar) + mplaats(z.stad)).includes(sp)) continue; const ms = msoort(z); const k = (z.kant === 'biedt' ? 'biedt' : 'zoekt') + '|' + (['woning', 'baan', 'dienst', 'iets'].includes(ms) ? ms : 'iets'); per[k] = N(per[k]) + 1; }
  const T = BORD[taal] || BORD.en, d = Object.entries(per).filter(([k]) => T.k[k]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => n + ' ' + T.k[k][0]).join(', ');
  return d ? (DVT[taal] || DVT.en).nieuw(stad, d) : '';
}
export async function dagvraagRonde({ droog = false } = {}) {
  if (!(await kv.get('wam:dvbackfill').catch(() => null))) { // eenmalig: wie al via WhatsApp met WAM praatte
    let cur = '0', n = 0; do { const r = await kv.raw(['SCAN', cur, 'MATCH', 'wam:wa:*', 'COUNT', '500']).catch(() => null); if (!r) break; cur = String(r[0]); for (const k of r[1] || []) { const h = String(k).slice(7); if (!/^[0-9a-f]{16,}$/.test(h)) continue; const v = await kv.get(k).catch(() => null); if (v && typeof v === 'string') { await kv.raw(['SADD', 'wam:dvset', v]).catch(() => {}); n++; } } } while (cur !== '0');
    await kv.set('wam:dvbackfill', { t: Date.now(), n }).catch(() => {});
  }
  const ids = (await kv.raw(['SMEMBERS', 'wam:dvset']).catch(() => [])) || [], uit = { kandidaten: ids.length, gestuurd: 0, overgeslagen: {} };
  const max = Math.max(0, Number(process.env.WAM_DAGV_MAX || 60)), sk = r => { uit.overgeslagen[r] = N(uit.overgeslagen[r]) + 1; };
  let nDag = N(await kv.get('wam:dvn:' + dag()).catch(() => 0));
  for (const vid of [].concat(ids).slice(0, 500)) {
    if (nDag >= max) { sk('max'); break; }
    const p = await profiel(vid).catch(() => null); if (!p || !p.contact) { sk('geen'); continue; }
    const c = p.contact; if (c.stop) { await kv.raw(['SREM', 'wam:dvset', vid]).catch(() => {}); sk('stop'); continue; }
    if (!c.wa && !c.tg) { sk('kanaal'); continue; }
    const uur = lokaalUur(DV_TZ[String(p.land || '').toUpperCase()] || 'UTC'); if (uur < 9 || uur >= 11) { sk('uur'); continue; }
    p.dv = p.dv || {}; if (!p.dv.f) { const k = await LEER.kiesDagv().catch(() => ({ f: 'f1', v: 'v1' })); p.dv.f = k.f; p.dv.v = k.v; }
    if (N(p.dv.pauze) > Date.now()) { sk('pauze'); continue; }
    const gap = (p.dv.f === 'f3' ? 3 : 1) * 86400000 - 3 * 3600000; if (Date.now() - N(p.dv.laatst) < gap) { sk('nog niet'); continue; }
    if (p.dv.wacht) { p.dv.mis = N(p.dv.mis) + 1; p.dv.wacht = 0; if (p.dv.mis >= 3) { p.dv.pauze = Date.now() + 14 * 86400000; p.dv.mis = 0; await bewaarProfiel(p); sk('drie keer stil'); continue; } }
    const tl = p.taal === 'nl' ? 'nl' : 'en', T = DVT[tl], n = await nieuwBijJou(p.land, p.stad, tl), x = (p.dv.v === 'v3' ? T.v3(n, p.stad) : p.dv.v === 'v2' ? T.v2(n) : T.v1(n)) + '\n\n' + T.stop;
    if (droog) { uit.voorbeeld = uit.voorbeeld || x; uit.gestuurd++; continue; }
    let ok = false; if (c.wa) ok = await waStuur(c.wa, x).catch(() => false); else if (c.tg && process.env.WAM_TG_TOKEN) { await tgStuur(c.tg, x).catch(() => {}); ok = true; }
    if (!ok) { sk('fout'); continue; }
    p.dv.laatst = Date.now(); p.dv.wacht = Date.now(); p.dv.n = N(p.dv.n) + 1; await bewaarProfiel(p); await LEER.telDagv(p.dv, 'g'); nDag++; uit.gestuurd++;
  }
  if (!droog) await kv.set('wam:dvn:' + dag(), nDag, { ex: 90000 }).catch(() => {});
  if (uit.gestuurd) await tel({ dagvraag: uit.gestuurd }).catch(() => {});
  return uit;
}
// antwoord op de dagvraag of STOP: telt voor de arm, zet de teller stil op nul
async function dagvAntwoord(p, txt) { if (!p || !p.dv || !p.dv.wacht || Date.now() - p.dv.wacht > 86400000) return; p.dv.wacht = 0; p.dv.mis = 0; p.dv.na = Date.now(); await LEER.telDagv(p.dv, /^\s*(stop|unsubscribe|stoppen|afmelden)\s*$/i.test(txt || '') ? 's' : 'a'); await bewaarProfiel(p); }
export async function leerRonde({ forceer = false } = {}) {
  const nu = Date.now(), uit = { t: new Date().toISOString(), wijzigingen: [] };
  const [c2, c3] = await Promise.all([cijfers(2), cijfers(3)]);
  const gs = await gesprekken(2);
  uit.alarmen = await signaal(c2, gs);
  for (const a of uit.alarmen) await meldEenmaal('alarm:' + dag() + ':' + a.slice(0, 2), 'WAM-alarm: ' + a);
  // coach eens per 3 uur, alleen met genoeg afgelopen gesprekken
  const laatste = N(await kv.get('wam:coachT').catch(() => 0));
  const afgelopen = gs.filter(s => reden(s) !== 'bezig').length;
  const nieuwAfgelopen = gs.filter(s => reden(s) !== 'bezig' && N(s.laatste || s.t0) > laatste).length;
  if ((forceer || (nu - laatste > 25 * 60000 && nieuwAfgelopen >= 4)) && afgelopen >= (forceer ? 3 : 8) && (await binnenPlafond(0.15))) {
    await kv.set('wam:coachT', nu);
    const o = await openers(), st = await openerStand(), ls = await lessen();
    try {
      const { voorstel: v, redenen } = await coach(gs, c3, ls, o, st); uit.redenen = redenen; uit.analyse = v && v.analyse;
      let n = 0; const MAXW = 2;
      if (v && Array.isArray(v.lessen_weg)) for (const i of v.lessen_weg) { if (n >= MAXW) break; const r = ls.regels[N(i)]; if (r) { ls.regels.splice(N(i), 1); uit.wijzigingen.push('les weg: ' + r.tekst); n++; } }
      if (v && Array.isArray(v.lessen_nieuw)) for (const l of v.lessen_nieuw) { if (n >= MAXW || !l || !l.tekst) break; ls.regels.push({ tekst: kort(l.tekst, 180), principe: kort(l.principe, 60), t: nu }); uit.wijzigingen.push('les: ' + kort(l.tekst, 180)); n++; }
      ls.regels = ls.regels.slice(-12); ls.versie = N(ls.versie) + (n ? 1 : 0);
      if (v && Array.isArray(v.openers_uit)) for (const id of v.openers_uit) { if (n >= MAXW) break; const x = o[id]; const s0 = st[id] || {}; if (x && x.actief && N(s0.g) >= 50 && Object.values(o).filter(y => y.actief && y.taal === x.taal).length > 2 && Object.values(o).filter(y => y.actief && y.taal === x.taal && y.familie === x.familie).length > 1) { x.actief = false; uit.wijzigingen.push('opener uit: ' + id); n++; } }
      if (v && Array.isArray(v.openers_nieuw)) for (const x of v.openers_nieuw) { if (n >= MAXW || !x || !x.tekst || !TALEN.includes(x.taal)) continue; const id = x.taal + '-l' + h12(x.tekst).slice(0, 5); if (o[id]) continue; o[id] = { id, taal: x.taal, familie: ['open', 'besparen', 'wens', 'opzeggen', 'samen'].includes(x.familie) ? x.familie : 'open', tekst: kort(x.tekst, 170), knoppen: (x.knoppen || []).map(k => kort(k, 28)).filter(Boolean).slice(0, 4), actief: true, bron: 'coach', t: nu }; uit.wijzigingen.push('nieuwe opener ' + id + ': ' + kort(x.tekst, 120)); n++; }
      await Promise.all([kv.set('wam:lessen', ls), kv.set('wam:o', o)]);
    } catch (e) { uit.coachFout = String(e && e.message || e).slice(0, 160); }
  }
  // vertalen: talen met bezoekers maar zonder eigen openers krijgen een vertaling van de beste Engelse opener
  try { await vertaalOpeners(gs); } catch (e) {}
  // verzenddomein: zolang Resend het nog niet geverifieerd heeft, elk uur opnieuw laten controleren (zet wam:mailklaar zodra het klaar is)
  try { if (!(await POST.mailKlaar())) { const d = await POST.domein(true); uit.maildomein = d && d.status; if (d && d.status === 'verified') await meld('WAM: het verzenddomein wearemany.now is geverifieerd; beloofde mails gaan nu de deur uit.'); } } catch (e) { uit.maildomeinFout = String(e && e.message || e).slice(0, 100); }
  // Telegram-bot zelf instellen zodra het token er is
  try { if (process.env.WAM_TG_TOKEN && !(await kv.get('wam:tgklaar'))) { const t = await telegramZet(); uit.telegram = t.ok ? 'ingesteld' : 'mislukt'; if (t.ok) await meld('WAM: de Telegram-bot @' + (process.env.WAM_TG_BOT || '') + ' staat aan; bezoekers kunnen nu op Telegram verder praten.'); } } catch (e) { uit.telegramFout = String(e && e.message || e).slice(0, 100); }
  // beloftes die nu aan de beurt zijn: opzoeken, schrijven en versturen
  try { uit.mailPoll = await mailPoll(); } catch (e) { uit.mailPollFout = String(e && e.message || e).slice(0, 140); }
  try { uit.detailmail = await detailMails(); } catch (e) { uit.detailmailFout = String(e && e.message || e).slice(0, 140); }
  try { uit.match = await matchRonde(); } catch (e) { uit.matchFout = String(e && e.message || e).slice(0, 140); }
  try { uit.post = await beloftenRonde(); } catch (e) { uit.postFout = String(e && e.message || e).slice(0, 140); }
  try { uit.dagvraag = await dagvraagRonde(); } catch (e) { uit.dagvraagFout = String(e && e.message || e).slice(0, 140); }
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
  // naar Henkjan (Henkjan 9 nov: "laat me om 30 mins geleerde weten"): elke ronde van 30 minuten, maar alleen als er iets bewoog
  // (nieuwe gesprekken, een les of wijziging, contact, een tik op de contactknop). Met wat er geleerd is, de stand van de proeven en
  // de nieuwste gesprekken zelf.
  const s = c2.som; const vorig = (await kv.get('wam:rapport').catch(() => null)) || { t: 0, som: {} };
  const nu = Date.now(), vs = vorig.som || {};
  const d = k => { const x = N(s[k]) - N(vs[k]); return x < 0 ? N(s[k]) : x; };
  const nieuw = gs.filter(x => N(x.t0) > N(vorig.t) && N(x.beurten) >= 1 && !(x.ctx && x.ctx.test)).sort((a, b) => N(b.beurten) - N(a.beurten));
  const bewoog = nieuw.length || (uit.wijzigingen || []).length || d('contact') || d('cpil_tik') || d('meting');
  if (nu - N(vorig.t) < 25 * 60000 || !bewoog) return;
  const kost = await kostVandaag();
  // koplopers
  const o = await openers(), st = await openerStand();
  const opl = Object.values(o).filter(x => x.actief).map(x => ({ id: x.id, t: x.tekst, g: N((st[x.id] || {}).g), e: N((st[x.id] || {}).e) })).filter(x => x.g >= 20).sort((a, b) => b.e / b.g - a.e / a.g);
  const uxK = uxKans(await uxStand().catch(() => ({})));
  const uxLeider = Object.entries(uxK).map(([dim, w]) => { const [v, p] = Object.entries(w).sort((a, b) => b[1] - a[1])[0] || []; return dim + ': ' + v + ' (' + Math.round(N(p) * 100) + '%)'; }).join(', ');
  const cp = await cpilStand().catch(() => ({})); const cpT = Object.entries(cp.tekst || {}).map(([id, t]) => (CPIL[id] ? CPIL[id].nl : id) + ' ' + N(t.k) + '/' + N(t.g) + (N(t.c) ? ' (' + N(t.c) + ' contact)' : '')).join(', ');
  // per campagne vandaag: gesprekken, tot beurt 3, contact (Henkjan 9 nov: "Waarom stoppen ga leren en rapporteer per 30 mins wat je
  // geleerd en verbeterd hebt"), zodat zichtbaar is welke markt en welke belofte echt gesprekken oplevert
  const CAMP = { 12127064: 'CA match', 12127058: 'Toronto', 12127059: 'Rotterdam', 12130342: 'Rotterdam breed', 12130483: 'Rotterdam huur v1', 12130513: 'Rotterdam huur', 12130552: 'Toronto v2', 12131827: 'Toronto 12nov', 12131822: 'CA match 12nov', 12131821: 'Delhi 12nov', 12132715: 'Rotterdam 12nov', 12135314: 'Toronto 12nov vers', 12135400: 'CA match 12nov vers', 12127060: 'Delhi', 12121526: 'Londen', 12121527: 'Londen zoek', 12120598: 'UK', 12121469: 'CA', 12122333: 'CA nieuw (aanbod peil uil)', 12122334: 'UK nieuw (aanbod peil uil)', 12123979: 'CA aanbod', 12123981: 'US aanbod', 12120587: 'US', 12120600: 'NL', 12120602: 'DE', 12124847: 'Londen kopie', 12124853: 'Londen zoek kopie', 12125129: 'US kopie', 12125131: 'NL kopie', 12125132: 'DE kopie', 157894: 'Mondiad MATCH' };
  const begin = Date.now() - 24 * 3600000, pc = {};
  for (const x of gs) { if (N(x.t0) < begin || (x.ctx && x.ctx.test) || !N(x.beurten)) continue; const k = (x.params && x.params.c) ? (CAMP[x.params.c] || 'campagne ' + x.params.c) : 'zonder advertentie'; const r = pc[k] = pc[k] || { g: 0, b3: 0, c: 0 }; r.g++; if (N(x.beurten) >= 3) r.b3++; if (x.berichten.some(m => m.r === 'u' && MAIL.test(m.x))) r.c++; }
  const tijden = gs.filter(x => N(x.t0) > begin && !(x.ctx && x.ctx.test) && N(x.beurten) >= 1).map(x => { const u = x.berichten.find(m => m.r === 'u'), l = x.berichten[x.berichten.length - 1]; return u && l ? Math.max(0, N(l.t) - N(u.t)) / 1000 : 0; }).sort((a, b) => a - b);
  const tm = tijden.length ? 'North star, gesprekstijd (24 uur, ' + tijden.length + ' gesprekken): gemiddeld ' + Math.round(tijden.reduce((a, b) => a + b, 0) / tijden.length) + ' s, mediaan ' + Math.round(tijden[Math.floor(tijden.length / 2)]) + ' s, langste ' + Math.round(tijden[tijden.length - 1] / 60) + ' min.' : '';
  const pcT = Object.entries(pc).sort((a, b) => b[1].g - a[1].g).map(([k, r]) => k + ' ' + r.g + (r.b3 ? ' (' + r.b3 + ' tot beurt 3' + (r.c ? ', ' + r.c + ' contact' : '') + ')' : '')).join(', ');
  const dialogen = nieuw.slice(0, 2).map(x => '\n\n' + [x.ctx && x.ctx.land, x.params && x.params.n ? 'advertentie ' + (x.hook || '') : 'organisch', x.beurten + ' beurten', reden(x).replace(/_/g, ' ')].filter(Boolean).join(' · ') + '\n' + x.berichten.slice(0, 6).map(m => (m.r === 'b' ? 'WAM: ' : 'Bezoeker: ') + kort(maskeer(m.x), 130)).join('\n')).join('');
  const t = 'WAM, laatste ' + Math.max(1, Math.round((nu - N(vorig.t || nu - 1800000)) / 60000)) + ' min: ' + d('cm_kliks') + ' kliks, ' + d('cm_echt') + ' echte mensen (Clickmind), ' + d('echt') + ' gesprekken, ' + d('beurt3') + ' tot beurt 3, ' + d('dialoog') + ' echte dialogen (de conversie naar het netwerk), ' + d('contact') + ' contact, ' + d('cpil_tik') + ' tikken op de contactknop.' +
    (tm ? '\n' + tm : '') + ((d('volgende') || d('peil_direct')) ? '\nPeilingen direct beantwoord: ' + d('peil_direct') + ', Volgende vraag getikt: ' + d('volgende') + 'x' : '') + (d('tik_kaart') ? '\nOpenertik met uitslag in procenten: ' + d('tik_kaart') + 'x' : '') + (d('n_bot') ? '\nWachttijd op de bot: gemiddeld ' + (d('ms_bot') / d('n_bot') / 1000).toFixed(1) + ' s' : '') +
    ((uit.wijzigingen || []).length ? '\nVerbeterd: ' + uit.wijzigingen.join(' | ') : '') + (uit.analyse ? '\nGeleerd: ' + kort(uit.analyse, 260) : '') +
    ((d('deel_toon') || d('ref_geladen')) ? '\nDelen: kaart getoond ' + d('deel_toon') + 'x, getikt ' + d('deel_tik') + 'x, vrienden binnen ' + d('ref_geladen') + ' (echt ' + d('ref_echt') + ', in gesprek ' + d('ref_dialoog') + ', ik heb dit ' + d('ref_heb') + ', doorgestuurd ' + d('ref_door') + ')' : '') +
    (pcT ? '\nGesprekken per campagne, laatste 24 uur: ' + pcT : '') + ((d('ev_kaart_push') || d('ev_kaart_mail')) ? '\nContactkaart getoond: ' + d('ev_kaart_push') + 'x met meldknop, ' + d('ev_kaart_mail') + 'x zonder (telefoon kan geen meldingen), ' + d('ev_contact_nee') + 'x nee getikt' : '') + ((d('ev_contact_push_tik') || d('contact_push') || d('ev_contact_push_direct')) ? '\nMeldknop: ' + d('ev_contact_push_direct') + 'x meteen gevraagd bij de contactknop, ' + d('ev_contact_push_tik') + ' getikt, ' + d('contact_push') + ' aangezet, ' + d('ev_contact_push_nee') + ' geweigerd of niet gelukt' + ((d('ev_push_denied') || d('ev_push_default') || d('ev_push_fout')) ? ' (geblokkeerd ' + d('ev_push_denied') + ', geen antwoord ' + d('ev_push_default') + ', techniek ' + d('ev_push_fout') + ')' : '') : '') + ((d('match_gevonden') || d('match_niemand') || d('verbind')) ? '\nMatches live: ' + d('match_gevonden') + 'x meteen iemand gevonden die er al in zit (' + d('match_stad') + 'x in de eigen stad), ' + d('match_niemand') + 'x nog niemand; ' + d('verbind') + 'x verbind me getikt, ' + d('bericht_door') + ' berichten doorgegeven, ' + d('inbox_gelezen') + ' gelezen door de ander, ' + d('nr_gedeeld') + ' WhatsApp-nummers gedeeld, ' + d('nr_uitgewisseld') + ' uitgewisseld' : '') + (d('ml_toon') ? '\nNog niemand (lerend, 3 teksten): ' + d('match_niemand') + 'x getoond, ' + d('nee_verder') + 'x ging daarna verder' + '\nGericht doorvragen tot matchbaar (lerend: vrij, gat, voortgang): ' + d('mr_toon') + 'x gestart, ' + d('mr_vraag') + ' gerichte vragen, ' + d('mr_klaar') + 'x matchbaar geworden. Wachters gemeld bij een nieuwe match: ' + d('wacht_gemeld') + ' (mail ' + d('wacht_mail') + ', Telegram ' + d('wacht_tg') + ', nummer ' + d('wacht_nr') + ')' + '\nLater melden als er nog niemand is (lerend, 4 varianten): ' + d('ml_toon') + 'x gevraagd, ' + d('ml_tik') + 'x getikt, ' + d('ml_c') + 'x nummer of mail achtergelaten; ' + d('ml_raak_nr') + 'x later gebruikt via WhatsApp, ' + d('ml_raak_mail') + 'x via mail, ' + d('ml_raak_tg') + 'x via Telegram; ' + d('inbox_tg') + ' berichten via Telegram bezorgd' : '') + (d('ev_bewaar_toon') ? '\nBewaren zonder contact: ' + d('ev_bewaar_toon') + 'x getoond, ' + d('ev_bewaar_wa') + ' naar eigen WhatsApp, ' + d('ev_bewaar_share') + ' gedeeld, ' + d('ev_bewaar_kopie') + ' link gekopieerd, ' + d('bewaar_terug') + ' terug via die link' : '') + (uit.match && uit.match.nieuw ? '\nMatches tussen bezoekers: ' + uit.match.nieuw + ' nieuw' : '') +
    (d('groep') ? '\nGroepen (we are many): ' + (await groepStand().catch(() => [])).slice(0, 5).map(g => g.naam + ' ' + g.n).join(', ') : '') +
    (opl.length ? '\nBeste opener nu: "' + kort(opl[0].t.replace('{groet}! ', ''), 90) + '" ' + opl[0].e + '/' + opl[0].g + (opl.length > 1 ? '; slechtste: "' + kort(opl[opl.length - 1].t.replace('{groet}! ', ''), 60) + '" ' + opl[opl.length - 1].e + '/' + opl[opl.length - 1].g : '') : '') +
    (uxLeider ? '\nScherm, kans beste: ' + uxLeider : '') + (cpT ? '\nContactknop (tik/getoond): ' + cpT : '') +
    (d('zoektocht') ? '\nZoektochten: ' + d('zoektocht') + ' nieuw (WAM blijft voor ze zoeken)' : '') + (d('aanbod') ? '\nAanbod: ' + d('aanbod') + ' nieuw (WAM zoekt klanten voor ze)' : '') + (d('peil') ? '\nPeiling getikt: ' + d('peil') + 'x' : '') +
    (d('meting') ? '\nBenchmark: ' + d('meting') + ' nieuwe antwoorden; ' + (await bmOverzicht().catch(() => [])).slice(0, 4).map(x => x.sleutel + ' ' + x.land + ' ' + x.n).join(', ') : '') +
    '\nVandaag totaal: ' + N(s.echt) + ' gesprekken, ' + N(s.contact) + ' contacten. AI vandaag $' + kost.toFixed(2) + '.' +
    (dialogen ? '\n\nNieuwe gesprekken (' + nieuw.length + '):' + dialogen : '') +
    '\n\nAlles: https://hjdk-api-henq.vercel.app/api/wam?op=gesprekken';
  // niet naar Telegram (Henkjan 9 nov 22:36 UTC: "Ik wil hier een rapport heb nooit gevraagd naar telegram rapport"): bewaren; de chat
  // haalt het elk half uur op via /api/wam?op=rapport en meldt het daar
  await kv.raw(['LPUSH', 'wam:rapporten', JSON.stringify({ t: nu, tekst: t })]).catch(() => {}); await kv.raw(['LTRIM', 'wam:rapporten', '0', '47']).catch(() => {});
  await kv.set('wam:rapport', { t: nu, som: s, contact: N(s.contact), echt: N(s.echt) });
}
export async function rapporten(n = 3) { return ((await kv.raw(['LRANGE', 'wam:rapporten', '0', String(Math.max(0, Math.min(47, N(n) || 3) - 1))]).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); }
const maskeer = t => String(t || '').replace(new RegExp(MAIL.source, 'gi'), m => m.slice(0, 1) + '***@' + m.split('@')[1]).replace(/\+?\d[\d\s().-]{6,18}\d/g, m => m.replace(/\D/g, '').length >= 9 ? m.slice(0, 3) + '*** (nummer)' : m);
function wanneer(t, tz) { try { return new Intl.DateTimeFormat('nl-NL', { timeZone: tz || 'UTC', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(N(t))); } catch (e) { return new Date(N(t)).toISOString().slice(5, 16).replace('T', ' '); } }

// ---------- alle dialogen leesbaar (Henkjan 9 nov: "Ik wil de dialogen hier zien in rapporten") ----------
const RAPPORT_CSS = ':root{--ink:#111113;--body:#3A3F47;--muted:#6B7280;--line:#E5E7EB;--accent:#2B47C4;--soft:#EEF1FC;--ok:#1F7A4D;--oks:#E8F4EE;--warn:#B3261E;--warns:#FCEDEB}*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--body);font:15px/1.6 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}main{max-width:820px;margin:0 auto;padding:36px 22px 60px}h1{font-size:30px;letter-spacing:-.04em;color:var(--ink);margin:0 0 6px}h2{font-size:19px;color:var(--ink);letter-spacing:-.02em;margin:34px 0 10px}.eb{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:0 0 10px;display:flex;gap:8px;align-items:center}.dot{width:7px;height:7px;border-radius:50%;background:var(--accent);display:inline-block}a{color:var(--accent)}.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:18px 0}.tile{border:1px solid var(--line);border-radius:12px;padding:12px 14px}.tv{font-size:24px;font-weight:700;color:var(--ink);letter-spacing:-.02em;font-variant-numeric:tabular-nums}.tl{font-size:13px;color:var(--muted)}.f{font-size:13px;color:var(--muted)}.f a{margin-right:10px}.gs{border:1px solid var(--line);border-radius:16px;margin:14px 0;overflow:hidden}.gk{padding:12px 16px;border-bottom:1px solid var(--line);font-size:13px;color:var(--muted);display:flex;flex-wrap:wrap;gap:6px 12px}.gk b{color:var(--ink)}.pil{font-size:12px;font-weight:600;border-radius:999px;padding:1px 9px;background:var(--soft);color:var(--accent)}.pil.ok{background:var(--oks);color:var(--ok)}.pil.no{background:var(--warns);color:var(--warn)}.gb{padding:12px 16px}.m{margin:8px 0;max-width:88%}.m.b{color:var(--ink)}.m.u{margin-left:auto;background:var(--soft);color:var(--ink);border-radius:14px;padding:8px 12px;width:fit-content}.wie{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:block}.kz{font-size:12px;color:var(--muted)}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid var(--line);padding:7px 8px;text-align:left;vertical-align:top}';
export async function gesprekkenHtml({ dagen = 2, min = 1 } = {}) {
  dagen = Math.max(1, Math.min(14, N(dagen) || 2)); min = Math.max(0, Math.min(10, N(min)));
  const gs = (await gesprekken(dagen, 800)).filter(x => N(x.beurten) >= min).sort((a, b) => N(b.t0) - N(a.t0));
  const cm = await cmOordeel(gs);
  const contactGegeven = x => x.berichten.some(m => m.r === 'u' && MAIL.test(m.x));
  const tot = { n: gs.length, b3: gs.filter(x => N(x.beurten) >= 3).length, wens: gs.filter(x => x.actie).length, contact: gs.filter(contactGegeven).length, mens: Object.values(cm).filter(x => x.echt).length };
  const kaart = x => {
    const c = x.ctx || {}, p = x.params || {}, o = cm[x.sid];
    const kop = ['<b>' + esc(wanneer(x.t0, 'America/Curacao')) + '</b>' + (c.tz ? ' <span class="kz">(daar ' + esc(wanneer(x.t0, c.tz).split(' ').pop()) + ')</span>' : ''), esc([c.land, c.stad].filter(Boolean).join(' ')), esc(c.taal || ''), esc(p.n ? p.n + ' · campagne ' + (p.c || '?') + ' · plek ' + (p.z || '?') : c.kanaal === 'telegram' ? 'Telegram' : 'organisch'),
      x.hook ? 'hook <b>' + esc(x.hook) + '</b>' : '', 'opener ' + esc(x.opener || ''), x.ux ? 'scherm ' + esc(Object.values(x.ux).join('/')) : '', N(x.beurten) + ' beurten', esc(reden(x).replace(/_/g, ' ')),
      o ? '<span class="pil ' + (o.echt ? 'ok' : 'no') + '">' + (o.echt ? 'mens volgens Clickmind' : 'Clickmind: geen echt mens') + '</span>' : '', x.actie ? '<span class="pil">wens</span>' : '', contactGegeven(x) ? '<span class="pil ok">contact</span>' : ''].filter(Boolean).join(' · ');
    const bod = x.berichten.map(m => m.r === 'b'
      ? '<div class="m b"><span class="wie">WAM' + (m.zoek ? ' · zocht: ' + esc(m.zoek) : '') + (m.cv ? ' · vroeg om contact' : '') + '</span>' + esc(maskeer(m.x)) + (m.k && m.k.length ? '<div class="kz">keuzes: ' + m.k.map(esc).join(' · ') + '</div>' : '') + '</div>'
      : '<div class="m u">' + (m.knop ? '<span class="wie">tik</span>' : '') + esc(maskeer(m.x)) + '</div>').join('');
    return '<div class="gs"><div class="gk">' + kop + '</div><div class="gb">' + bod + '</div></div>';
  };
  const lk = (d, m, t) => '<a href="/api/wam?op=gesprekken&dagen=' + d + '&min=' + m + '">' + t + '</a>';
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>WAM gesprekken</title><style>' + RAPPORT_CSS + '</style></head><body><main>' +
    '<p class="eb"><span class="dot"></span>We Are Many · live</p><h1>Alle gesprekken</h1><p class="f">Laatste ' + dagen + ' dag(en), nieuwste eerst, tijden in Curaçao-tijd. E-mailadressen afgeschermd. ' + lk(1, min, 'vandaag') + lk(2, min, '2 dagen') + lk(7, min, '7 dagen') + lk(dagen, 3, 'alleen 3+ beurten') + lk(dagen, 1, 'alles') + '<a href="/api/wam?op=stand">stand</a></p>' +
    '<div class="tiles"><div class="tile"><div class="tv">' + tot.n + '</div><div class="tl">gesprekken</div></div><div class="tile"><div class="tv">' + tot.mens + '</div><div class="tl">mens volgens Clickmind</div></div><div class="tile"><div class="tv">' + tot.b3 + '</div><div class="tl">3+ beurten</div></div><div class="tile"><div class="tv">' + tot.wens + '</div><div class="tl">met een wens</div></div><div class="tile"><div class="tv">' + tot.contact + '</div><div class="tl">contact gegeven</div></div></div>' +
    (gs.length ? gs.slice(0, 300).map(kaart).join('') : '<p>Nog geen gesprekken in deze periode.</p>') + '</main></body></html>';
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
  const uxS = await uxStand().catch(() => ({})), uxK = uxKans(uxS), cpS = await cpilStand().catch(() => ({})), bmO = await bmOverzicht().catch(() => []), zs = await zoekStand().catch(() => ({ open: 0, per: {}, matches: 0 })), grp = await groepStand().catch(() => []);
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>WAM stand</title>
<style>body{font:15px/1.5 -apple-system,system-ui,sans-serif;max-width:900px;margin:0 auto;padding:16px;color:#1d1d1f}h1{font-size:22px}h2{font-size:17px;margin-top:28px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #eee;padding:6px 8px;text-align:left;vertical-align:top}.alarm{background:#fdecea;border:1px solid #f5c2c0;padding:10px;border-radius:8px;margin:6px 0}.g{color:#666;font-size:13px}.b{background:#f5f5f7;border-radius:8px;padding:8px;margin:6px 0;font-size:13px}</style></head><body>
<h1>We Are Many: stand van de chat</h1><p class="g">Live opgebouwd ${esc(new Date().toISOString().slice(0, 16).replace('T', ' '))} UTC. <a href="https://wearemany.now">wearemany.now</a> · AI vandaag $${kost.toFixed(2)} van $${PLAFOND}</p>
${alarmen.length ? alarmen.map(a => '<div class="alarm">' + esc(a) + '</div>').join('') : '<p>Signaalcheck: geen alarm.</p>'}
<h2>Trechter, laatste 3 dagen</h2><table><tr><th>Stap</th><th>Aantal</th><th>Van vorige</th></tr>
${rij('Klik op de advertentie (Clickmind)', s.cm_kliks, s.cm_kliks)}${rij('Pagina geladen', s.geladen, s.cm_kliks || s.geladen)}${rij('Script draaide', s.ev_js, s.geladen)}${rij('1 s in beeld (opener gezien)', s.ev_zicht1, s.ev_js)}${rij('Echt mens volgens Clickmind', s.cm_echt, s.cm_kliks)}${rij('Gesprek begonnen: eerste tik of zin', s.echt, s.ev_zicht1)}${rij('Beurt 2', s.beurt2, s.echt)}${rij('Beurt 3', s.beurt3, s.beurt2)}${rij('Beurt 5', s.beurt5, s.beurt3)}${rij('Wens vastgelegd', s.actie, s.echt)}${rij('Contact gevraagd', s.contact_gevraagd, s.echt)}${rij('Contact gegeven', s.contact, s.contact_gevraagd)}${rij('Kwam later terug', s.terug, s.echt)}</table>
<p><a href="/api/wam?op=gesprekken">Alle gesprekken lezen →</a></p>
<h2>Benchmark (anoniem, geven om te krijgen)</h2><table><tr><th>Wat</th><th>Land</th><th>Antwoorden</th><th>Mediaan</th><th>Middelste helft</th></tr>${bmO.map(x => '<tr><td>' + esc(x.sleutel) + '</td><td>' + esc(x.land === 'WW' ? 'wereld' : x.land) + '</td><td>' + x.n + (x.n < 5 ? ' (te weinig)' : '') + '</td><td>' + (x.n < 5 ? '–' : x.soort === 'keuze' ? esc(x.top) : x.mediaan) + '</td><td>' + (x.n >= 5 && x.soort !== 'keuze' ? x.p25 + ' – ' + x.p75 : '–') + '</td></tr>').join('') || '<tr><td colspan="5">Nog geen antwoorden</td></tr>'}</table>
<h2>Zoektochten (WAM blijft zoeken)</h2><p>${zs.open} open: ${Object.entries(zs.per || {}).map(([k, n]) => esc(k) + ' ' + n).join(', ') || 'nog geen'}. Matches tussen bezoekers: ${zs.matches} (voorstellen alleen als beide ja zeggen).</p>
<h2>Groepen (we are many)</h2><p>${grp.length ? grp.slice(0, 15).map(g => esc(g.naam) + ' ' + g.n).join(', ') : 'Nog geen groepen.'}</p>
<h2>Contactknop-proef</h2><table><tr><th>Onderdeel</th><th>Variant</th><th>Getoond</th><th>Getikt</th><th>Contact</th></tr>${['tekst', 'plek'].map(d => Object.entries(cpS[d] || {}).map(([v, t]) => '<tr><td>' + d + '</td><td>' + esc(d === 'tekst' && CPIL[v] ? CPIL[v].en : v) + '</td><td>' + N(t.g) + '</td><td>' + N(t.k) + ' (' + pct(N(t.k), N(t.g)) + ')</td><td>' + N(t.c) + '</td></tr>').join('')).join('') || '<tr><td colspan="5">Nog niet getoond</td></tr>'}</table>
<h2>Lerend scherm (UX-proeven)</h2><table><tr><th>Onderdeel</th><th>Variant</th><th>Gezien</th><th>Gesprek</th><th>Beurt 3</th><th>Contact</th><th>Terug</th><th>Kans beste</th></tr>${Object.entries(UX).map(([d, vars]) => vars.map(v => { const t = (uxS[d] || {})[v] || {}; return '<tr><td>' + esc(d) + '</td><td>' + esc(v) + '</td><td>' + N(t.g) + '</td><td>' + N(t.e) + ' (' + pct(N(t.e), N(t.g)) + ')</td><td>' + N(t.b3) + '</td><td>' + N(t.c) + '</td><td>' + N(t.t) + '</td><td>' + Math.round(((uxK[d] || {})[v] || 0) * 100) + '%</td></tr>'; }).join('')).join('')}</table>
<p class="g">Betaald ${N(s.betaald)} · organisch ${N(s.organisch)} · terugkerend ${N(s.terug)} · getypt ${N(s.getypt)} · knoppen ${N(s.knoptik)} · zoekopdrachten ${N(s.zoek)} · AI-fouten ${N(s.ai_fout)} · gemiddelde wachttijd bot ${N(s.n_bot) ? (Math.round(N(s.ms_bot) / N(s.n_bot) / 100) / 10) + ' s' : '–'}</p>
<h2>Waarom ze stoppen (afgelopen gesprekken, 3 dagen)</h2><table>${Object.entries(redenen).sort((a, b) => b[1] - a[1]).map(([r, n]) => '<tr><td>' + esc(r.replace(/_/g, ' ')) + '</td><td>' + n + '</td></tr>').join('') || '<tr><td>Nog geen afgelopen gesprekken</td></tr>'}</table>
<h2>Openers (bandit)</h2><table><tr><th>Opener</th><th>Getoond</th><th>In gesprek</th><th>Contact</th><th>Kans beste</th></tr>${actief.map(x => { const t = st[x.id] || {}; return '<tr><td><b>' + esc(x.id) + '</b> <span class="g">(' + esc(x.familie) + ', ' + esc(x.bron) + ')</span><br>' + esc(x.tekst) + '</td><td>' + N(t.g) + '</td><td>' + N(t.e) + ' (' + pct(N(t.e), N(t.g)) + ')</td><td>' + N(t.c) + '</td><td>' + (kans[x.id] != null ? Math.round(kans[x.id] * 100) + '%' : '–') + '</td></tr>'; }).join('')}</table>
<h2>Advertentie-hooks, 3 dagen</h2><table><tr><th>Hook</th><th>Opener gezien</th><th>In gesprek</th><th>Contact</th></tr>${Object.entries(hooks).map(([h, v]) => '<tr><td>' + esc(h) + '</td><td>' + N(v.g) + '</td><td>' + N(v.e) + ' (' + pct(N(v.e), N(v.g)) + ')</td><td>' + N(v.c) + '</td></tr>').join('') || '<tr><td>Nog geen advertentieverkeer</td></tr>'}</table>
<h2>Lessen (versie ${N(ls.versie)})</h2>${(ls.regels || []).length ? '<ol>' + ls.regels.map(r => '<li>' + esc(r.tekst) + ' <span class="g">(' + esc(r.principe) + ')</span></li>').join('') + '</ol>' : '<p>Nog geen lessen: de bot begint bij nul.</p>'}
<h2>Leerrondes</h2>${log.map(l => '<div class="b"><b>' + esc(String(l.t).slice(0, 16).replace('T', ' ')) + '</b> ' + esc(l.analyse || '') + (l.wijzigingen && l.wijzigingen.length ? '<br>' + l.wijzigingen.map(esc).join('<br>') : '') + (l.coachFout ? '<br>coachfout: ' + esc(l.coachFout) : '') + '</div>').join('') || '<p>Nog geen ronde.</p>'}
<h2>Laatste gesprekken</h2>${laatste.map(x => '<div class="b"><span class="g">' + esc([x.ctx && x.ctx.land, x.ctx && x.ctx.taal, x.params && x.params.n ? 'betaald z' + x.params.z : 'organisch', x.hook, 'beurten ' + x.beurten, reden(x)].filter(Boolean).join(' · ')) + '</span><br>' + x.berichten.slice(0, 10).map(m => (m.r === 'b' ? '<b>WAM</b> ' : '<b>Bezoeker</b> ') + esc(kort(m.x, 240))).join('<br>') + '</div>').join('') || '<p>Nog geen gesprekken.</p>'}
</body></html>`;
}

// proefmail van WAM aan zichzelf: komt hij binnen en verwerkt (wam:mailproef:<code>), dan werkt de hele ontvangstketen
// vangnet naast de webhook: de laatste ontvangen mails aan wearemany.now ophalen en verwerken (mailIn slaat dubbele over)
export async function mailPoll() {
  const l = await POST.ontvangLijst().catch(() => null); if (!Array.isArray(l)) return { fout: l && l.fout };
  let n = 0; for (const m of l.filter(x => x.wam && Date.now() - Date.parse(x.t) < 3 * 86400000)) { const em = await POST.ontvangen(m.id); if (em) { const r = await mailIn(em, m.id); if (!r.dubbel) n++; } }
  return { verwerkt: n };
}
export async function mailProef(code) {
  if (code) { const poll = await mailPoll(); return { code, binnen: await kv.get('wam:mailproef:' + code).catch(() => null), poll }; }
  const c = hex(4); await POST.stuurMail({ to: 'proef@wearemany.now', subject: 'WAM-PROEF ' + c, html: '<p>Proef van de ontvangstketen.</p>', text: 'Proef van de ontvangstketen.' });
  return { code: c, verstuurd: true };
}

// herkomst van de laatste gesprekken (beschermd): params, verwijzer, app, opener; om zoekgeraakte advertentie-codes te vinden
// compact per land of campagne voor de rondes in de chat (zuinig met tokens): opener, beurten, wat de bezoeker zei, laatste antwoord
export async function gesprekKort({ land = '', camp = '', n = 15 } = {}) {
  const L = String(land || '').toUpperCase().slice(0, 2), C = String(camp || '').slice(0, 12);
  const gs = (await gesprekken(1, 400)).filter(x => (!L || String((x.ctx && x.ctx.land) || '').toUpperCase() === L) && (!C || String((x.params && x.params.c) || '') === C)).sort((a, b) => N(b.t0) - N(a.t0)).slice(0, Math.min(40, N(n) || 15));
  return gs.map(x => ({ t: new Date(N(x.t0)).toISOString().slice(11, 16), o: x.opener, b: N(x.beurten), z: x.params && x.params.z, u: (x.berichten || []).filter(m => m.r === 'u').slice(0, 5).map(m => cqMaskeer(kort(m.x, 50))), w: kort(cqMaskeer(((x.berichten || []).filter(m => m.r === 'b').slice(-1)[0] || {}).x || ''), 90) }));
}
export async function herkomst(n = 40) {
  const l = await kv.raw(['LRANGE', 'wam:sessies:' + dag(), String(-Math.min(200, n)), '-1']).catch(() => []) || [];
  const uit = []; for (const sid of l.reverse()) { const s = await sessie(sid).catch(() => null); if (!s) continue; uit.push({ t: new Date(s.t0).toISOString().slice(11, 16), land: s.ctx && s.ctx.land, n: s.params && s.params.n, c: s.params && s.params.c, z: s.params && s.params.z, b: s.params && s.params.b, mmc: !!(s.params && s.params.mmc), ref: s.ctx && s.ctx.ref ? String(s.ctx.ref).slice(0, 60) : '', app: s.ctx && s.ctx.app, opener: s.opener, terug: !!s.terug, beurten: s.beurten }); }
  return uit;
}

// Ergernissen op de voorkant (Henkjan 10 nov 22:34 UTC: "Zullen we ergernissen ed samengevat op voorkant WAM zetten super strak en vooral ook verder
// over praten met mensen. Laten we dat gaan doen als treshold bereikt."): pas vanaf 25 antwoorden in het land, top 3 bedrijven met procenten;
// elke naam is een knop die het gesprek erover opent. Lerend schermonderdeel erger (aan/uit) in wam:ux.
const ERGER = { en: { titel: n => 'What annoys people here most · ' + n + ' answers', zin: b => b + ' annoys me too', eigen: 'Something else annoys me' }, nl: { titel: n => 'Waar mensen hier zich het meest aan ergeren · ' + n + ' antwoorden', zin: b => 'Ik erger me ook aan ' + b, eigen: 'Ik erger me aan iets anders' }, de: { titel: n => 'Was die Leute hier am meisten nervt · ' + n + ' Antworten', zin: b => b + ' nervt mich auch', eigen: 'Mich nervt etwas anderes' } };
const naamMooi = k => String(k || '').split(/\s+/).map(w => w.length <= 3 || /^[a-z]&[a-z]$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
export async function ergerVoor(land, taal) {
  const L = String(land || '').toUpperCase(), key = 'wam:erger:' + (L || 'XX');
  let e = await kv.get(key).catch(() => null);
  if (!e) { const st = await bmStats('most_annoying_company', L, null, null, '').catch(() => null); e = st && st.n ? { n: st.n, top: st.keuzes.slice(0, 3) } : { n: 0, top: [] }; await kv.set(key, e, { ex: 300 }).catch(() => {}); }
  if (N(e.n) < 25 || !e.top.length || N(e.top[0][1]) < 3) return null;
  const T = ERGER[taal] || ERGER.en;
  return { titel: T.titel(e.n), chips: e.top.map(([k, c]) => ({ lab: naamMooi(k), p: Math.round(100 * N(c) / N(e.n)), knop: T.zin(naamMooi(k)) })), eigen: T.eigen };
}
// aanbod en vraag per stad (beschermd overzicht): basis voor advertenties met echte aantallen (Henkjan 10 nov: Toronto, Rotterdam, Delhi)
export async function stadStand(landFilter) {
  const st = await zoekStand(); const nu = Date.now(), per = {};
  for (const z of st.lijst) {
    if (nu - N(z.tb) > 30 * 86400000) continue; const L = String(z.land || ''); if (landFilter && L !== landFilter) continue;
    const pl = mplaats(z.waar) || '?'; const ms = msoort(z); const k = L + '|' + pl + '|' + (z.kant === 'biedt' ? 'biedt' : 'zoekt') + '|' + (['woning', 'baan', 'dienst', 'iets'].includes(ms) ? ms : 'iets');
    per[k] = per[k] || { n: 0, voorbeeld: [] }; per[k].n++; if (per[k].voorbeeld.length < 4) per[k].voorbeeld.push(kort(z.wat, 50));
  }
  return Object.entries(per).map(([k, v]) => { const [land, plaats, kant, soort] = k.split('|'); return { land, plaats, kant, soort, n: v.n, voorbeeld: v.voorbeeld }; }).sort((a, b) => b.n - a.n).slice(0, 60);
}

// matchflow: stand per stap (wam:flowst), wat de regels niet snapten (wam:ucvrij) en extra woorden (wam:flowkw)
export async function flowStand(n = 60) {
  const [st, uc, kw] = await Promise.all([kv.raw(['HGETALL', 'wam:flowst']).catch(() => null), kv.raw(['LRANGE', 'wam:ucvrij', '0', String(Math.max(0, Math.min(299, n - 1)))]).catch(() => []), kv.raw(['HGETALL', 'wam:flowkw']).catch(() => null)]);
  const h = r => { const o = {}; if (Array.isArray(r)) for (let i = 0; i + 1 < r.length; i += 2) o[r[i]] = r[i + 1]; else Object.assign(o, r || {}); return o; };
  const stap = {}; for (const [k, v] of Object.entries(h(st))) { const [cat, veld, f] = k.split('|'); const key = cat + '|' + veld; stap[key] = stap[key] || {}; const nm = veld === 'klaar' ? (f === 'm' ? 'match' : 'bewaard') : (f === 'b' ? 'beantwoord' : 'gevraagd'); stap[key][nm] = (stap[key][nm] || 0) + (Number(v) || 0); }
  return { stap, nietBegrepen: (uc || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean), woorden: h(kw) };
}
export async function flowKwZet(j) {
  let n = 0; for (const [k, v] of Object.entries(j || {})) { if (!/^(woning|werk|dienst|spullen|rit|mensen)\|[a-z*_]+$/.test(k)) continue; const w = String(v || '').toLowerCase().split(/[,|]/).map(x => x.trim().replace(/[^\p{L}\p{N} '-]/gu, '')).filter(x => x.length > 2).slice(0, 30); if (!w.length) { await kv.raw(['HDEL', 'wam:flowkw', k]); n++; continue; } const oud = String((await kv.raw(['HGET', 'wam:flowkw', k]).catch(() => '')) || '').split('|').filter(Boolean); const alles = [...new Set([...oud, ...w])].slice(-60); await kv.raw(['HSET', 'wam:flowkw', k, alles.join('|')]); n++; }
  return n;
}
