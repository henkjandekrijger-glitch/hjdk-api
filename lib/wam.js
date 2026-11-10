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
const score = s => ({ a: 1 + N(s.e) + N(s.b3) + 3 * N(s.c) + 3 * N(s.t), b: 1 + Math.max(0, N(s.g) - N(s.e)) }); // b3: tot beurt 3 (north star engagementtijd, Henkjan 9 nov)
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
export const UX = { opener: ['held', 'chat'], keuzes: ['kaarten', 'pillen'], invoer: ['vast', 'inline'], kop: ['match', 'connect', 'many'], bord: ['aan', 'uit'] };
export async function uxStand() { const h = await hget('wam:ux'); const o = {}; for (const [k, v] of Object.entries(h)) { const [d, x, f] = k.split('|'); ((o[d] = o[d] || {})[x] = o[d][x] || {})[f] = v; } return o; }
export async function kiesUx() {
  const st = await uxStand().catch(() => ({})), uit = {};
  for (const [d, vars] of Object.entries(UX)) { let best = vars[0], bw = -1; for (const v of vars) { const w = beta(score((st[d] || {})[v] || {}).a, score((st[d] || {})[v] || {}).b); if (w > bw) { bw = w; best = v; } } uit[d] = best; }
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
  // zelfde bezoeker binnen 30 minuten terug zonder advertentiecode (logo, privacy, terug-knop): hoort bij dezelfde klik (10 nov: 98 nep-organische gesprekken in een uur)
  let intern = false;
  if (!ctx.test) { if (params.n) await kv.set('wam:vparams:' + vid, params, { ex: 1800 }).catch(() => {}); else { const v = await kv.get('wam:vparams:' + vid).catch(() => null); if (v && v.n) { Object.assign(params, v); intern = true; } } }
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
  } else opener = (ctx.openerTest && ZAAD.find(o => o.id === ctx.openerTest)) || await kiesOpener(ctx.taal, hk && hk.familie);
  // relatie: komt iemand terug, dan krijgen de opener en de UX van zijn vorige gesprek het krediet (t)
  if (p && p.sessies && p.sessies.length && !ctx.test) { const vorige = await sessie(p.sessies[p.sessies.length - 1]).catch(() => null); if (vorige && !vorige.terugGeteld) { vorige.terugGeteld = Date.now(); await telOpener(vorige.opener, 't'); await telUx(vorige.ux, 't'); await bewaarSessie(vorige).catch(() => {}); } }
  const ux = Object.assign(await kiesUx(), ctx.uxTest || {});
  const tekst = opener.tekst.replace('{groet}', groet(ctx.taal, ctx.uur)).replace('{stad}', ctx.stad || '');
  const s = { sid, vid, t0: Date.now(), ctx, params, ux, hook: hk ? hk.hook : '', adTekst: hk && hk.tekst ? String(hk.tekst).slice(0, 80) : '', opener: opener.id, terug, berichten: [{ r: 'b', t: Date.now(), x: tekst, k: opener.knoppen }], beurten: 0, echt: false, contactGevraagd: 0, zoek: 0, ev: {} };
  await bewaarSessie(s);
  const d = dag(); const velden = intern ? { herladen: 1 } : { geladen: 1, [params.n ? 'betaald' : 'organisch']: 1 }; if (terug) velden.terug = 1;
  await tel(velden, d, !!ctx.test);
  return { sid, tok, opener: { id: opener.id, tekst, knoppen: opener.knoppen }, terug, ux };
}

// ---------- gebeurtenissen uit de browser ----------
const EV = ['logo_tik', 'js', 'zicht1', 'typt', 'verborgen', 'terug', 'weg', 'contact_mail', 'contact_tg', 'contact_wa', 'contact_nee', 'knop_kopie', 'contact_push_tik', 'contact_push_nee', 'kaart_push', 'kaart_mail', 'contact_push_direct', 'push_denied', 'push_default', 'push_fout', 'bewaar_toon', 'bewaar_wa', 'bewaar_share', 'bewaar_kopie', 'bord_tik'];
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
export const BM_KEUZES = ['most_annoying_type', 'most_annoying_company', 'morning_or_night', 'bedtime', 'screen_time', 'change_one_thing', 'texts_or_calls', 'cook_or_takeaway', 'cash_or_card', 'weekend_plan', 'switch_job', 'phone_in_bedroom', 'biggest_wish'];
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
function peilKaart(rij, st) {
  if (!rij || rij.soort !== 'keuze') return null;
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
  return 'A results card is shown right above your reply with how everyone else answered this first question (' + k.n + ' answers; most chose "' + top.k + '"' + (jij && jij !== top ? '; they chose "' + jij.k + '", a less common pick' : '; they are with the majority') + '). Do NOT write numbers or percentages. Reply in at most 2 short sentences, under 25 words in total: a few words reacting to how their pick compares, then ONE simple question about their choice (never two questions in one, never ask for a price or amount yet). No tips, no facts, no advice in this reply.';
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
async function zoektocht(p, s, z, test) {
  const wat = kort(z.wat, 140); if (!wat) return null;
  const soort = ZSOORT.includes(z.soort) ? z.soort : 'anders';
  p.zoektochten = p.zoektochten || [];
  let x = p.zoektochten.find(y => y.status === 'open' && (y.wat.toLowerCase() === wat.toLowerCase() || (y.sid === s.sid && y.soort === soort)));
  const nieuw = !x;
  if (!x) { x = { id: hex(4), t: Date.now(), sid: s.sid, status: 'open', land: String((s.ctx && s.ctx.land) || p.land || '').toUpperCase(), stad: (s.ctx && s.ctx.stad) || p.stad || '', taal: (s.ctx && s.ctx.taal) || p.taal || 'en', ...(test ? { test: true } : {}) }; p.zoektochten = [...p.zoektochten, x].slice(-10); }
  Object.assign(x, { wat, soort, eisen: kort(z.eisen, 200), waar: kort(z.waar, 80), wanneer: kort(z.wanneer, 60), tb: Date.now() });
  if (!test) await kv.raw(['HSET', 'wam:zw', p.vid + ':' + x.id, JSON.stringify({ wat, soort, eisen: x.eisen, waar: x.waar || x.stad, land: x.land, t: x.t, tb: x.tb })]).catch(() => {});
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
async function aanbod(p, s, b, test) {
  const wat = kort(b.wat, 140); if (!wat) return null;
  const soort = ZSOORT.includes(b.soort) ? b.soort : 'dienst';
  p.aanbod = p.aanbod || [];
  let x = p.aanbod.find(y => y.status === 'open' && (y.wat.toLowerCase() === wat.toLowerCase() || y.sid === s.sid));
  const nieuw = !x;
  if (!x) { x = { id: hex(4), t: Date.now(), sid: s.sid, status: 'open', land: String((s.ctx && s.ctx.land) || p.land || '').toUpperCase(), stad: (s.ctx && s.ctx.stad) || p.stad || '', taal: (s.ctx && s.ctx.taal) || p.taal || 'en', ...(test ? { test: true } : {}) }; p.aanbod = [...p.aanbod, x].slice(-10); }
  Object.assign(x, { wat, soort, voor: kort(b.voor_wie || b.voor, 120), waar: kort(b.waar, 80), prijs: kort(b.prijs, 60), tb: Date.now() });
  if (!test) await kv.raw(['HSET', 'wam:zw', p.vid + ':' + x.id, JSON.stringify({ kant: 'biedt', wat, soort, eisen: [x.voor, x.prijs].filter(Boolean).join('; '), waar: x.waar || x.stad, land: x.land, t: x.t, tb: x.tb })]).catch(() => {});
  return Object.assign({}, x, { nieuw });
}
export async function zoekStand() {
  const h = await kv.raw(['HGETALL', 'wam:zw']).catch(() => []) || []; const l = [];
  if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) { try { l.push({ k: h[i], ...JSON.parse(h[i + 1]) }); } catch (e) {} }
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
  return `You are WAM (We Are Many), a personal fixer in a chat on wearemany.now. Most people arrive cold from an ad, on a phone, and leave fast. You learn from every conversation.
North star: a relationship, not a transaction (Henkjan: "relationship matters more"). People should want to come back and stay in touch because you are genuinely useful, curious about them and remember them. Leave them a real reason to return (something you will check, look up or tell them later), never a manipulative one.
Mission, in this order:
1. Hook: make every reply effortless and rewarding. Keep it short: at most 2 short sentences (under ~220 characters) unless you deliver information they asked for. Every reply must give something useful they did not have yet (a fact, tip, number or option), never only a question. End with one easy next step. Give 2-4 tap buttons ("knoppen") that are natural answers, each max 28 characters.
2. Help for real: answer, look things up, compare, draft a cancellation or complaint letter, explain options, give a concrete tip. Deliver real value early: in your first reply after their first answer, give one concrete tip, fact or quick win for their situation (look it up if needed), and only then at most one question. Never answer a tap with only another question. When you need fresh facts (prices, providers, deals, rules, products, local info), set "zoek" to a short web search query and leave "antwoord" empty; you will get results and answer then.
3. Map intentions naturally: what they want, need, want to get rid of or want to know; their limit (budget/price) and their moment (when). One question at a time, only when it helps you help them. Never interrogate.
4. Keep in touch: once you delivered value, or when following up is genuinely useful (a price watch, sending the letter, a reminder before a deadline, telling them when others want the same), ask how they want to hear back. Available: ${kanalen.join(', ')}. Set "contact":"vraag" in that turn and say why it helps them. If the user asks you to send, mail, remind, notify, watch something or keep them posted, ask for their contact in that same turn ("contact":"vraag") and say what you will send. From your 3rd reply on, when you have helped, offer one concrete follow-up that needs contact (a price watch, the letter, the overview, a reminder). At most twice per conversation; respect a no.
5. Promises: whenever you say you will send, mail, remind, check or report back later, fill "belofte": "wat" = exactly what you will send, self-contained (e.g. "2027 premium of Zilveren Kruis basic vs 3 cheaper basic insurers, 1 adult, NL"), "wanneer" = a date YYYY-MM-DD if it only makes sense later (e.g. when new prices are published, before a deadline), or "" for as soon as possible. We really send it by email or Telegram. Only promise what a message can deliver: an overview, a comparison, a letter draft, a reminder, a check whether something changed. Never promise to call, to act in their accounts, or to negotiate for them.
6. Benchmarks (We Are Many is a commons, about anything in life, not only money): when it fits, ask ONE quick question about their own life that others answer too, and say why: you compare them anonymously with everyone who answered, something they cannot find anywhere else. Anything goes: habits (sleep, bedtime, screen time, commute, work hours, coffee), choices (morning person or night owl, texts or calls, cook or takeaway), wishes and opinions (the one thing they would change), and what they pay. When they answer (also by a tap), fill "meting": a number goes in "waarde" with "eenheid" (hours, minutes, GBP, EUR, USD...), a choice goes in "keuze" (short normalized label, max 3 words, lowercase). Keys: ${BM_SLEUTELS.join(', ')}; choices: ${BM_KEUZES.join(', ')} (or a new snake_case key). Only about themselves, never guesses. Never ask about health conditions, medication, sexuality, religion, politics or ethnicity.
   Annoying companies: when they tell you what kind of company annoys them, ask which company exactly (a tap or typed), then fill "meting" with key most_annoying_company, "keuze" = the company name normalized (lowercase, no Ltd/plc, e.g. "virgin media") and "detail" = what annoys them in a few words. Tell them honestly how many others named the same company, then give one concrete fix (a complaint that works, how to escalate to the ombudsman or regulator, how to leave or switch, or getting money back) and offer to draft it. We are many: people fed up with the same company stand stronger together. Say how many others named it, and invite them to join the group of people fed up with that company (they get updates and can act together, for example one complaint signed by many). If they say yes, set "groep" to the company name.
7. Searching ("tell me what you are looking for and we find it"): when they look for something or someone (a job, a place to live, a product, a service or tradesperson, a buddy or partner for an activity, a flatmate, a group), ask 1-2 short follow-up questions that really narrow it down (where, budget or pay, when, must-haves), one per turn and with useful info each time, then search now ("zoek") and give the best concrete leads. Fill "zoekt" as soon as you know what they want, and again when they add details. Tell them WAM remembers it and keeps looking for them (WAM sends new finds automatically; do not set "belofte" for that) and ask how to reach them. Other WAM users may look for the same thing or offer it: you can introduce them only if both say yes, and only adults. Never help find, locate or identify a specific private person (an ex, someone who blocked them, where someone lives); say kindly you cannot and offer something else.
8. Offering (supply): when they offer something or look for customers (a service, a product, a job opening, a room, a skill), ask 1-2 short things that make a match possible (where they work or deliver, who it is for, price or terms), with one useful tip each time, and fill "biedt" right away, as soon as you know what it is (even from one tap like "A room to rent"), then again when they add details. Tell them honestly that WAM matches them with people here who look for it, in their city or beyond, and introduces them only when both say yes; never promise a number of customers. Ask how to reach them so you can pass on a match. Only legal, everyday offers: no adult services, gambling, loans, crypto or get-rich schemes, weapons or medicines.
Craft (what the most engaging bots do):
- Reflect first: open with a few of their own words that show you got their point (not "I understand"), then help.
- Be curious like a good friend: most turns end with one follow-up question, open or closed, sometimes none. Ask "what" or "how", never "why".
- Now and then share something small and honest about yourself (how you work, what you find interesting, what you cannot do yet). Never fake human experiences or invent other users.
- Use what they told you before (facts, wishes, names) in concrete detail; never ask twice for something you know.
- Buttons are shortcuts, not a menu: when only they can answer (their price, provider, situation), give 0-2 buttons so they type it.
- Goodbye: when they say bye or thanks, end warmly in one sentence (plus what you will send, if promised). Never guilt, FOMO, pressure, or ignore a goodbye.
Use the visitor context silently to tailor what you say (currency, local providers, rules, time of day). Never tell them you know their location, city, device, or that they came from an ad; never name their city, region or country unless they said it first (never write "you're in", "you're based in" or "I see you're from"), and if their words contradict the context (another currency, another country), trust their words without remarking on it. Make sensible assumptions from their language and words instead of asking clarifying questions; ask only when the answer really changes your help.
Rules: answer in the user's language (start in ${({ en: "English", nl: "Dutch", de: "German", fr: "French", es: "Spanish", pt: "Portuguese", it: "Italian" })[taal] || taal} ("${taal}"), switch only if they write in another language; button taps never change the language). When you suggest company or provider names as buttons, only use ones that operate in the visitor's country. Warm, direct, a little playful, never salesy. Never invent numbers, prices, reviews or community statistics; look it up or say you don't know. You sell nothing and recommend no paid products for commission. Never ask for full names, addresses, ID numbers or bank details; if they share sensitive data, do not repeat it. If asked who you are: WAM, an AI matchmaker from We Are Many: it talks with hundreds of people every day and connects people who need something with people who offer it (a room, work, a service, things to buy or sell), anonymously until both say yes; it also helps people get better deals and get things sorted, and bundles people with the same wish. If someone is clearly testing or trolling, stay friendly and brief.
${regels ? 'Lessons learned from earlier conversations (follow them):\n' + regels + '\n' : ''}Return ONLY one JSON object, no markdown:
{"antwoord":"your message","knoppen":["..."],"zoek":"","intenties":[{"wat":"","soort":"kopen|besparen|opzeggen|klagen|vergelijken|vraag|regelen|overig","grens":"","wanneer":""}],"feiten":{"key":"value"},"contact":"","belofte":{"wat":"","wanneer":""},"meting":[{"sleutel":"","waarde":0,"eenheid":"","keuze":"","detail":""}],"zoekt":{"wat":"","soort":"iets|iemand|baan|woning|dienst|anders","eisen":"","waar":"","wanneer":""},"koppel":{"id":"","ja":false},"groep":"","biedt":{"wat":"","soort":"dienst|iets|baan|woning|anders","waar":"","voor_wie":"","prijs":""},"fase":"kennismaken|helpen|waarde|contact|afronden","samenvatting":"one line about this person and what they want"}
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

export function kanalen() { const k = ['a notification on their phone (one tap)', 'email']; if (process.env.WAM_TG_BOT && process.env.WAM_TG_TOKEN) k.push('Telegram'); if (process.env.WAM_WA_NUMMER && process.env.WAM_WA_BOT) k.push('WhatsApp'); return k; } // WhatsApp pas tonen als de chat daar ook echt antwoordt (WAM_WA_BOT gezet zodra het nummer aan de chat hangt)

// Eén zet van de gebruiker: tekst of een getikte knop. Geeft het antwoord van de bot terug.

// ---------- directe matches en echte berichten tussen mensen (Henkjan 10 nov 16:09: "zorg voor echte berichten naar elkaar echt
// matches maak matches. Geef meteen door als iemand er al inzit ... praat met mij en je hebt contact met iedereen") ----------
// Zodra iemand iets aanbiedt of zoekt, kijkt WAM meteen in wam:zw wie er al in zit aan de andere kant (zelfde land, zelfde soort,
// woning en baan altijd, de rest op een gedeeld woord) en zegt eerlijk hoeveel, en hoeveel in de eigen stad. "Verbind me" maakt een
// paar (wam:mp), de ander krijgt meteen een bericht in zijn inbox (wam:inbox:<vid>, de chat haalt die elke 20 s op). Berichten gaan
// zonder naam door; een WhatsApp-nummer gaat alleen door als ze het allebei delen (dan krijgen ze elkaars nummer met een wa.me-link).
const MS_WONING = /\b(rooms?|flat|apartment|appartement|apt|studio|house|home|place to (live|stay)|rent|rental|lease|sublet|basement|condo|kamer|woning|huis|huur|wohnung|zimmer|chambre|logement)\b/i;
const MS_BAAN = /\b(jobs?|work|hiring|hire|staff|employees?|role|position|vacanc\w*|shifts?|baan|werk|vacature|personeel|arbeit|stelle|emploi|travail)\b/i;
const MSTOP = new Set('the and for with from that this your have just some something someone looking need want offer offering sell selling buy service services near city here also other more less into only what when where which would like about over under them they their mine yours voor met een van het niet maar ook iets iemand zoek zoeken bied bieden'.split(' '));
function msoort(z) { if (z.soort && z.soort !== 'anders' && z.soort !== 'iemand') return z.soort; const t = (z.wat || '') + ' ' + (z.eisen || ''); if (MS_WONING.test(t)) return 'woning'; if (MS_BAAN.test(t)) return 'baan'; return z.soort === 'iemand' ? 'dienst' : (z.soort || 'anders'); } // soort van de bot gaat voor; woorden alleen bij anders ("Home cleaning" is een dienst, geen woning)
const zonderAccent = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function mwoorden(z) { return new Set(zonderAccent((z.wat || '') + ' ' + (z.eisen || '')).split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !MSTOP.has(w))); }
const mplaats = x => zonderAccent(x).replace(/[^a-z]/g, '');
// huren en kopen niet door elkaar (10 nov: kamer te huur kreeg een koper van een woning)
const WKOOP = /\b(buy|buying|purchase|for sale|koop|kopen|kaufen|acheter)\b/i, WHUUR = /\b(rent|rental|rooms?|lease|sublet|huur|huren|kamer|miete|zimmer|louer)\b/i;
const BAAN_ALG = new Set('jobs work works worker workers role roles position positions opening openings hiring hire staff employee employees vacancy vacancies shift shifts time full part temporary seasonal permanent baan werk vacature personeel arbeit stelle emploi travail available anything any'.split(' '));
function wvorm(z) { const t = (z.wat || '') + ' ' + (z.eisen || ''); const k = WKOOP.test(t), h = WHUUR.test(t); return k && !h ? 'koop' : h && !k ? 'huur' : ''; }
export async function directMatch(vid, eigen, stad) {
  const st = await zoekStand(); const nu = Date.now(); const ms = msoort(eigen), ws = mwoorden(eigen), mijn = mplaats(stad || eigen.waar);
  const per = new Map();
  for (const z of st.lijst) {
    const v = String(z.k).split(':')[0]; if (v === vid || (z.land || '') !== (eigen.land || '') || nu - N(z.tb) > 30 * 86400000) continue;
    if ((z.kant === 'biedt' ? 'biedt' : 'zoekt') === eigen.kant || msoort(z) !== ms) continue;
    if (ms === 'woning') { const a1 = wvorm(eigen), a2 = wvorm(z); if (a1 && a2 && a1 !== a2) continue; }
    if (ms === 'baan') { const a1 = [...ws].filter(w => !BAAN_ALG.has(w)), a2 = [...mwoorden(z)].filter(w => !BAAN_ALG.has(w)); if (a1.length && a2.length && !a1.some(w => a2.includes(w) || a2.some(v => v.startsWith(w.slice(0, 5)) || w.startsWith(v.slice(0, 5))))) continue; } // magazijn past niet bij kantoor (10 nov); algemeen werk past bij alles
    let ok = ms === 'woning' || ms === 'baan'; if (!ok) { const wz = mwoorden(z); for (const w of ws) if (wz.has(w)) { ok = true; break; } }
    if (ok && (!per.has(v) || N(z.tb) > N(per.get(v).tb))) per.set(v, z);
  }
  const l = [...per.values()].sort((a, b) => N(b.tb) - N(a.tb));
  const inStad = mijn ? l.filter(z => { const w = mplaats(z.waar); return w && (w.includes(mijn) || mijn.includes(w)); }) : [];
  return { n: l.length, stad: inStad.length, beste: inStad[0] || l[0] || null, lijst: [...inStad, ...l.filter(z => !inStad.includes(z))].slice(0, 3) };
}
// wat er al is, concreet (Henkjan 10 nov: "vraag bij ieder aanbod en aanbod bij iedere vraag"): tot 3 aanbiedingen of zoektochten, zonder naam
const lijstRegels = l => (l && l.length ? '\n' + l.map(z => '• ' + kort(String(z.wat || ''), 70) + (z.waar ? ' (' + kort(String(z.waar), 30) + ')' : '')).join('\n') : '');
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
export const VERBIND = { en: 'Connect me', nl: 'Verbind me', de: 'Verbinde mich' };
const MSTUUR = { en: 'Send it', nl: 'Verstuur', de: 'Senden' };
const MVOORSTEL = { en: (k, wat) => (k === 'biedt' ? 'Hi! I have ' : 'Hi! I am looking for ') + wat + '. Still interested?', nl: (k, wat) => (k === 'biedt' ? 'Hoi! Ik heb ' : 'Hoi! Ik zoek ') + wat + '. Nog interesse?', de: (k, wat) => (k === 'biedt' ? 'Hallo! Ich habe ' : 'Hallo! Ich suche ') + wat + '. Noch Interesse?' };
const MVOOR = { en: v => 'I\'ll send them this, without your name:\n"' + v + '"\nOr type your own message.', nl: v => 'Ik stuur ze dit, zonder je naam:\n"' + v + '"\nOf typ je eigen bericht.', de: v => 'Ich schicke ihnen das, ohne deinen Namen:\n"' + v + '"\nOder schreib deine eigene Nachricht.' };
const MNR = { en: 'Share my WhatsApp', nl: 'Deel mijn WhatsApp', de: 'Mein WhatsApp teilen' };
const MANTW = { en: 'Reply', nl: 'Antwoord', de: 'Antworten' };
const MNEE = { en: 'Not interested', nl: 'Geen interesse', de: 'Kein Interesse' };
const MT = {
  en: { wacht: (st, k, wat) => 'Found someone for you: a person' + (st ? ' in ' + st : '') + ' who ' + (k === 'biedt' ? 'offers' : 'is looking for') + ' "' + wat + '". Want to send them a message? You both stay anonymous until you choose to share contact.', ja: (n, st, k, plek) => 'Good to know: right now ' + n + (n === 1 ? ' person' : ' people') + ' here ' + (k === 'biedt' ? (n === 1 ? 'is' : 'are') + ' looking for this' : 'offer' + (n === 1 ? 's' : '') + ' this') + (st ? ' (' + st + ' in ' + plek + ')' : '') + '. I can connect you whenever you like.', nee: k => 'Nobody here ' + (k === 'biedt' ? 'is looking for this' : 'offers this') + ' yet. I talk with hundreds of people every day. Want a ping the moment someone does?', laterNr: 'Type your WhatsApp number with country code. The moment someone here needs this, I give them your number and they message you. Nobody else gets it.', laterMail: 'Type your email. The moment someone here needs this, I email you. Nothing else.', laterOk: 'Done. The moment someone here needs this, they get your number and message you on WhatsApp.', laterTg: 'Tap the link and press Start in Telegram. The moment someone here needs this, I message you there:', tgOk: 'Connected. The moment someone here matches what you told me, I message you right here.', tgAntw: 'Just reply here and I pass it on, without your name or number.', heeftNr: 'Good news: they left their WhatsApp for exactly this. Share yours and you both get each other\'s number right away. Or write them a short message first.', schrijf: 'Done. Write one short message for them and I\'ll pass it on right away, without your name. Say what you offer or need, and when.', verstuurd: 'Sent. Their answer shows up right here. Want them to be able to reach you directly? Share your WhatsApp: they only get it if they share theirs too.', nrVraag: 'Type your WhatsApp number with country code (like +1 514 555 0100). I only pass it on if they share theirs too.', nrOk: 'Got it. As soon as they share theirs, you both get each other\'s number here.', nrFout: 'That doesn\'t look like a phone number. Type it with country code, like +1 514 555 0100.', link: 'No links, please. Just a short message in your own words.', antw: 'Type your answer. I\'ll pass it on right away.', nee2: 'Okay, I won\'t connect you with them.', geen: 'There is no one to pass this on to right now.' , van: (st, k, wat) => 'Message from someone' + (st ? ' in ' + st : '') + ' who ' + (k === 'biedt' ? 'offers' : 'is looking for') + ' "' + wat + '":', kans: (st, k, wat) => 'Someone' + (st ? ' in ' + st : '') + ' who ' + (k === 'biedt' ? 'offers' : 'is looking for') + ' "' + wat + '" wants to connect with you.', nrv: 'They want to talk on WhatsApp. Share your number too? You only get each other\'s number when you both share.', nummer: nr => 'You both shared your number. Theirs: ' + nr + ' https://wa.me/' + nr.replace(/\D/g, '') + '\nTip: meet in a public place first and never pay anything in advance.' },
  nl: { wacht: (st, k, wat) => 'Iemand voor je gevonden: iemand' + (st ? ' in ' + st : '') + ' die "' + wat + '" ' + (k === 'biedt' ? 'aanbiedt' : 'zoekt') + '. Wil je een bericht sturen? Jullie blijven anoniem tot je zelf contact deelt.', ja: (n, st, k, plek) => 'Goed om te weten: op dit moment ' + (k === 'biedt' ? (n === 1 ? 'zoekt 1 persoon' : 'zoeken ' + n + ' mensen') + ' hier precies dit' : (n === 1 ? 'biedt 1 persoon' : 'bieden ' + n + ' mensen') + ' hier precies dit aan') + (st ? ' (' + st + ' in ' + plek + ')' : '') + '. Ik verbind jullie wanneer je wilt.', nee: k => 'Nog niemand hier ' + (k === 'biedt' ? 'zoekt dit' : 'biedt dit aan') + '. Ik praat elke dag met honderden mensen. Wil je een seintje zodra iemand het doet?', laterNr: 'Typ je WhatsApp-nummer met landcode. Zodra iemand hier dit zoekt, geef ik diegene je nummer en appt die jou. Niemand anders krijgt het.', laterMail: 'Typ je e-mailadres. Zodra iemand hier dit zoekt, mail ik je. Verder niets.', laterOk: 'Geregeld. Zodra iemand hier dit zoekt, krijgt die je nummer en appt je.', laterTg: 'Tik op de link en druk in Telegram op Start. Zodra iemand hier dit zoekt, stuur ik je daar een bericht:', tgOk: 'Verbonden. Zodra iemand hier past bij wat je me vertelde, stuur ik je hier een bericht.', tgAntw: 'Antwoord gewoon hier, dan geef ik het door, zonder je naam of nummer.', heeftNr: 'Goed nieuws: die persoon liet precies hiervoor zijn WhatsApp achter. Deel de jouwe en jullie krijgen meteen elkaars nummer. Of stuur eerst een kort bericht.', schrijf: 'Gedaan. Schrijf één kort bericht voor ze, dan geef ik het meteen door, zonder je naam. Zeg wat je biedt of zoekt, en wanneer.', verstuurd: 'Verstuurd. Hun antwoord verschijnt hier. Wil je dat ze je direct kunnen bereiken? Deel je WhatsApp: ze krijgen hem alleen als zij de hunne ook delen.', nrVraag: 'Typ je WhatsApp-nummer met landcode (zoals +31 6 12345678). Ik geef het alleen door als zij hun nummer ook delen.', nrOk: 'Top. Zodra zij hun nummer delen, krijgen jullie hier allebei elkaars nummer.', nrFout: 'Dat lijkt geen telefoonnummer. Typ het met landcode, zoals +31 6 12345678.', link: 'Liever geen links. Gewoon een kort bericht in je eigen woorden.', antw: 'Typ je antwoord, dan geef ik het meteen door.', nee2: 'Oké, dan verbind ik jullie niet.', geen: 'Er is nu niemand om dit aan door te geven.', van: (st, k, wat) => 'Bericht van iemand' + (st ? ' in ' + st : '') + ' die "' + wat + '" ' + (k === 'biedt' ? 'aanbiedt' : 'zoekt') + ':', kans: (st, k, wat) => 'Iemand' + (st ? ' in ' + st : '') + ' die "' + wat + '" ' + (k === 'biedt' ? 'aanbiedt' : 'zoekt') + ', wil met je in contact komen.', nrv: 'Ze willen verder op WhatsApp. Deel jij je nummer ook? Jullie krijgen elkaars nummer pas als jullie het allebei delen.', nummer: nr => 'Jullie deelden allebei je nummer. Het hunne: ' + nr + ' https://wa.me/' + nr.replace(/\D/g, '') + '\nTip: spreek eerst op een openbare plek af en betaal nooit iets vooraf.' },
  de: { wacht: (st, k, wat) => 'Jemand für dich gefunden: eine Person' + (st ? ' in ' + st : '') + ', die "' + wat + '" ' + (k === 'biedt' ? 'anbietet' : 'sucht') + '. Willst du eine Nachricht schicken? Ihr bleibt anonym, bis ihr selbst Kontakt teilt.', ja: (n, st, k, plek) => 'Gut zu wissen: gerade ' + (k === 'biedt' ? (n === 1 ? 'sucht 1 Person' : 'suchen ' + n + ' Leute') + ' hier genau das' : (n === 1 ? 'bietet 1 Person' : 'bieten ' + n + ' Leute') + ' hier genau das an') + (st ? ' (' + st + ' in ' + plek + ')' : '') + '. Ich verbinde euch, wann du willst.', nee: k => 'Noch niemand hier ' + (k === 'biedt' ? 'sucht das' : 'bietet das an') + '. Ich spreche jeden Tag mit Hunderten Leuten. Willst du Bescheid bekommen, sobald es jemand tut?', laterNr: 'Schreib deine WhatsApp-Nummer mit Ländervorwahl. Sobald hier jemand das sucht, bekommt diese Person deine Nummer und schreibt dir. Sonst niemand.', laterMail: 'Schreib deine E-Mail. Sobald hier jemand das sucht, maile ich dir. Sonst nichts.', laterOk: 'Erledigt. Sobald hier jemand das sucht, bekommt diese Person deine Nummer und schreibt dir auf WhatsApp.', laterTg: 'Tipp auf den Link und dann in Telegram auf Start. Sobald hier jemand das sucht, schreibe ich dir dort:', tgOk: 'Verbunden. Sobald hier jemand passt, schreibe ich dir hier.', tgAntw: 'Antworte einfach hier, ich gebe es weiter, ohne Namen oder Nummer.', heeftNr: 'Gute Nachricht: diese Person hat genau dafür ihr WhatsApp hinterlassen. Teile deins und ihr bekommt sofort die Nummer des anderen. Oder schreib zuerst kurz.', schrijf: 'Erledigt. Schreib eine kurze Nachricht, ich gebe sie sofort weiter, ohne deinen Namen.', verstuurd: 'Gesendet. Die Antwort erscheint hier. Sollen sie dich direkt erreichen? Teile dein WhatsApp: sie bekommen es nur, wenn sie ihres auch teilen.', nrVraag: 'Schreib deine WhatsApp-Nummer mit Ländervorwahl (wie +49 151 12345678). Ich gebe sie nur weiter, wenn sie ihre auch teilen.', nrOk: 'Alles klar. Sobald sie ihre teilen, bekommt ihr beide hier die Nummer des anderen.', nrFout: 'Das sieht nicht wie eine Telefonnummer aus. Mit Ländervorwahl bitte, wie +49 151 12345678.', link: 'Bitte keine Links. Einfach eine kurze Nachricht.', antw: 'Schreib deine Antwort, ich gebe sie sofort weiter.', nee2: 'Okay, dann verbinde ich euch nicht.', geen: 'Gerade gibt es niemanden, an den ich das weitergeben kann.', van: (st, k, wat) => 'Nachricht von jemandem' + (st ? ' in ' + st : '') + ', der "' + wat + '" ' + (k === 'biedt' ? 'anbietet' : 'sucht') + ':', kans: (st, k, wat) => 'Jemand' + (st ? ' in ' + st : '') + ', der "' + wat + '" ' + (k === 'biedt' ? 'anbietet' : 'sucht') + ', möchte sich mit dir verbinden.', nrv: 'Sie möchten auf WhatsApp weiterreden. Teilst du deine Nummer auch? Ihr bekommt die Nummer des anderen erst, wenn ihr beide teilt.', nummer: nr => 'Ihr habt beide eure Nummer geteilt. Ihre: ' + nr + ' https://wa.me/' + nr.replace(/\D/g, '') + '\nTipp: trefft euch zuerst an einem öffentlichen Ort und zahlt nie etwas im Voraus.' },
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
const GENERIEK = /^(an? )?(service|services|something( else| i sell)?|product|products|job( opening)?|work|stuff|item|items|iets|dienst|een dienst|anders|other|room)$/i;
export function matchGat(z) {
  if (!z) return [];
  const g = [], wat = String(z.wat || '').trim();
  if (!wat || GENERIEK.test(wat) || mwoorden(z).size < 1 || msoort(z) === 'anders') g.push('wat');
  if (!String(z.waar || '').trim() || /^(near me|nearby|close by|local(ly)?|my area|my city|my town|around here|here|in my area|near my home)$/i.test(String(z.waar).trim())) g.push('waar'); // 'near me' is geen plaats (10 nov: Poplar Bluff)
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
function mrZin(id, gat, z) {
  if (id === 'vrij' || !gat.length) return '';
  const veld = z.kant === 'biedt' ? '"biedt"' : '"zoekt"';
  const vraag = gat[0] === 'wat'
    ? 'What they ' + (z.kant === 'biedt' ? 'offer' : 'look for') + ' ("' + kort(z.wat, 60) + '") is still too vague to match. Ask ONE short question that pins down exactly what it is (the specific service, item, role or kind of place), with 3 or 4 concrete tap options typical for that category, and put the concrete answer in ' + veld + '.'
    : 'Ask ONE short question about where: which city or area, and whether further away or remote also works, with tap options (their own city first if you know it). Put the answer in "waar" of ' + veld + ' and repeat the full "wat".';
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
    const pp = await profiel(wv).catch(() => null), tg = pp && pp.contact && pp.contact.tg;
    if (!mail && !nr && !tg) continue;
    const id = h12([String(eigen.k), zk].sort().join('|'));
    if (N(await kv.raw(['SADD', 'wam:wachtgemeld', id]).catch(() => 0)) !== 1) continue;
    let mp = await kv.get('wam:mp:' + id).catch(() => null);
    const stad = (s.ctx && s.ctx.stad) || eigen.waar || '';
    if (!mp) { mp = { a: wv, b: p.vid, za: zk.split(':')[1], zb: String(eigen.k).split(':')[1], wa: z.wat, wb: eigen.wat, ka: z.kant || 'zoekt', kb: eigen.kant || 'zoekt', sa: z.waar || '', sb: stad, waarom: 'wachter', t: Date.now(), ja: {}, nr: {} }; await kv.set('wam:mp:' + id, mp); await kv.raw(['SADD', 'wam:mparen', id]).catch(() => {}); }
    if (await inboxIn(wv, { soort: 'wacht', mp: id, van: p.vid, wat: eigen.wat, kant: eigen.kant, stad })) velden.wacht_tg = 1;
    if (mail && await mailLater(wv, String(mail), { kant: eigen.kant, wat: eigen.wat, stad }, (pp && pp.taal) || 'en', 'wacht')) velden.wacht_mail = 1;
    if (nr) velden.wacht_nr = 1; // WhatsApp zelf sturen kan pas met Henkjans ja op de Whapp-koppeling; het nummer wacht op de verbinding
    velden.wacht_gemeld = 1; n++;
    await meld('WAM: iemand die wachtte is gemeld (' + [mail && 'mail', nr && 'WhatsApp-nummer', tg && 'Telegram'].filter(Boolean).join(', ') + '): "' + kort(z.wat, 60) + '" past bij nieuw "' + kort(eigen.wat, 60) + '" (' + (s.ctx.land || '') + ').').catch(() => {});
  }
  return n;
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
async function inboxIn(vid, item) {
  if (!vid) return false; await kv.raw(['RPUSH', 'wam:inbox:' + vid, JSON.stringify(Object.assign({ t: Date.now() }, item))]).catch(() => {}); kv.raw(['EXPIRE', 'wam:inbox:' + vid, String(30 * 86400)]).catch(() => {});
  // heeft de ander Telegram gekoppeld, dan komt het daar ook meteen binnen, en wat hij daar typt gaat terug naar de afzender
  try {
    const pp = await profiel(vid); const chatId = pp && pp.contact && pp.contact.tg; if (!chatId || !process.env.WAM_TG_TOKEN) return false;
    const taal = pp.taal || 'en', r = itemTekst(item, taal); if (!r) return false;
    await tgStuur(chatId, r.x + (item.van ? '\n\n' + mt(taal).tgAntw : ''));
    if (item.van) { const ts = await tgSessie(String(chatId), vid, pp); ts.schrijf = { mp: item.mp, naar: item.van }; ts.antwoordOp = { mp: item.mp, naar: item.van }; await bewaarSessie(ts); }
    await tel({ inbox_tg: 1 }).catch(() => {}); return true;
  } catch (e) { return false; }
}
function itemTekst(it, taal) {
  const T = mt(taal), NR = MNR[taal] || MNR.en, AW = MANTW[taal] || MANTW.en, NE = MNEE[taal] || MNEE.en;
  if (it.soort === 'bericht') return { x: T.van(it.stad, it.kant, kort(it.wat, 60)) + '\n"' + it.x + '"', k: [AW, NR, NE] };
  if (it.soort === 'wacht') return { x: T.wacht(it.stad, it.kant, kort(it.wat, 60)), k: [AW, NE] };
  if (it.soort === 'kans') return { x: T.kans(it.stad, it.kant, kort(it.wat, 60)), k: [AW, NR, NE] };
  if (it.soort === 'nrvraag') return { x: T.nrv, k: [NR, NE] };
  if (it.soort === 'nummer') return { x: T.nummer(String(it.nr || '')), k: [] };
  return null;
}
async function tgSessie(chatId, vid, p) {
  const sid = createHash('sha256').update('tg|' + chatId).digest('hex').slice(0, 16);
  let s = await sessie(sid);
  if (!s) { s = { sid, vid, t0: Date.now(), ctx: { taal: (p && p.taal) || 'en', land: p && p.land, kanaal: 'telegram' }, params: {}, hook: '', opener: 'telegram', berichten: [], beurten: 0, echt: true, contactGevraagd: 2, zoek: 0, ev: {} }; await bewaarSessie(s); }
  return s;
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
  const taal = s.ctx.taal || 'en', T = mt(taal), V = VERBIND[taal] || VERBIND.en, NR = MNR[taal] || MNR.en, AW = MANTW[taal] || MANTW.en, NE = MNEE[taal] || MNEE.en;
  const klaar = (x, k = []) => ({ x, k });
  if (knop && s.mlater && tekst === s.mlater.x) {
    await telMl(s.mlater.id, 'k', TEST); velden.ml_tik = 1;
    if (s.mlater.kanaal === 'mail') { s.wachtMail = 1; return klaar(T.laterMail, []); }
    if (s.mlater.kanaal === 'tg' && process.env.WAM_TG_BOT) { const code = await contactCode(p.vid); if (!TEST) await kv.set('wam:mltg:' + p.vid, { id: s.mlater.id, zw: s.mlater.zw }, { ex: 7 * 86400 }).catch(() => {}); return klaar(T.laterTg + ' https://t.me/' + process.env.WAM_TG_BOT + '?start=wam' + code, []); }
    s.wachtNr = { later: true, zw: s.mlater.zw }; return klaar(T.laterNr, []);
  }
  if (knop && tekst === V && s.matchKand) {
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
  if (knop && tekst === NE && s.antwoordOp) { const mp = await kv.get('wam:mp:' + s.antwoordOp.mp).catch(() => null); if (mp) { mp.ja = mp.ja || {}; mp.ja[p.vid] = 0; await kv.set('wam:mp:' + s.antwoordOp.mp, mp); } s.antwoordOp = null; s.schrijf = null; return klaar(T.nee2, []); }
  if (knop && tekst === NR && (s.schrijf || s.antwoordOp)) { const w = s.schrijf || s.antwoordOp; s.wachtNr = { mp: w.mp, naar: w.naar }; return klaar(T.nrVraag, []); }
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
      await inboxIn(ander.vid, { soort: 'nummer', mp: w.mp, nr }); mp.gekoppeld = Date.now(); await kv.set('wam:mp:' + w.mp, mp); velden.nr_uitgewisseld = 1;
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
    mp.ja = mp.ja || {}; mp.ja[p.vid] = 1; mp.n = N(mp.n) + 1; await kv.set('wam:mp:' + w.mp, mp);
    const e = mpEigen(mp, p.vid); await inboxIn(w.naar, { soort: 'bericht', mp: w.mp, van: p.vid, x: kort(tekst, 400), wat: e.wat, kant: e.kant, stad: e.stad });
    s.antwoordOp = { mp: w.mp, naar: w.naar }; velden.bericht_door = 1;
    await meld('WAM: bericht doorgegeven tussen twee mensen ("' + kort(mp.wa, 40) + '" en "' + kort(mp.wb, 40) + '").').catch(() => {});
    return klaar(T.verstuurd, [NR]);
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
  if (s.beurten === 3) { await telUx(s.ux, 'b3', s.ctx && s.ctx.test); await telOpener(s.opener, 'b3', dag(), s.ctx && s.ctx.test); }
  let p = (await profiel(s.vid)) || nieuwProfiel(s.vid, s.ctx);
  if (!s.echt) { // eerste bewuste stap: echt mens (vroege conversie voor het netwerk)
    s.echt = true; velden.echt = 1; await telOpener(s.opener, 'e', D, TEST); await telHook(s.hook, 'e', D, TEST); await telTitel(s.adTekst, 'e', D, TEST); await telUx(s.ux, 'e', TEST);
    p.bezoeken = N(p.bezoeken) + 1; p.sessies = [...(p.sessies || []), s.sid].slice(-8);
    if (s.params && s.params.mmc) await clickmind(s.params.mmc, 'echt');
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
    if (s.mlater && (s.wachtMail || s.mlater.kanaal === 'mail')) { if (!TEST && s.mlater.zw) { await kv.raw(['HSET', 'wam:zwmail', s.mlater.zw, m[0].toLowerCase()]).catch(() => {}); await kv.set('wam:mailvid:' + m[0].toLowerCase(), p.vid, { ex: TTL.p }).catch(() => {}); } await telMl(s.mlater.id, 'c', TEST); velden.ml_c = 1; s.wachtMail = 0; s.mlater = null; extra = 'The user just gave their email so WAM can email them the moment someone here matches what they offer or look for. Confirm that in one short sentence and continue helping.'; }
  }
  // contact met het team (Henkjan 10 nov: "Voor contact met mij stuur je ze gewoon naar chat"): de footerlink zet 'Hi WAM team, ' in de chat
  if (!knop && /^(hi wam team|hoi wam-team|hallo wam-team)/i.test(tekst)) { if (!TEST) await meld('WAM contactbericht via de chat (' + ((s.ctx && s.ctx.land) || '') + '): "' + kort(tekst, 400) + '"').catch(() => {}); velden.contact_team = 1; extra = (extra ? extra + '\n' : '') + 'This message is for the human team behind WAM. Say in one short sentence that the team got it and reads every message, then ask how they want an answer if they want one (email or Telegram).'; }
  // matchroute (verbinden, berichten doorgeven, nummers delen): zonder AI
  if (s.matchKand || s.schrijf || s.antwoordOp || s.wachtNr || s.mlater) {
    const r = await matchRoute(p, s, tekst, knop, velden, TEST).catch(e => { console.error('[wam] matchroute', e && e.message); return null; });
    if (r) {
      s.berichten.push({ r: 'b', t: Date.now(), x: r.x, k: r.k }); s.laatste = Date.now(); s.eind = null; p.taal = s.ctx.taal; p.land = s.ctx.land;
      await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]);
      return { ok: true, x: r.x, knoppen: r.k, contact: null };
    }
  }
  // volgende vraag: meteen een nieuwe peiling, zonder AI
  if (knop && tekst === (VOLGENDE[s.ctx.taal] || VOLGENDE.en)) {
    const v = volgendePeil(s, s.ctx.taal || 'en');
    if (v) {
      const x = v.tekst.replace(/^\{groet\}!?\s*/, '').trim();
      s.peilNu = { id: v.id, sleutel: v.peil, knoppen: v.knoppen };
      s.berichten.push({ r: 'b', t: Date.now(), x, k: v.knoppen }); s.laatste = Date.now(); s.eind = null; velden.volgende = 1;
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
    if (r) { peilNu = true; velden.meting = 1; velden.peil = 1; const { st, scope } = await bmVergelijk(r); kaart = peilKaart(r, st); extra = (extra ? extra + '\n' : '') + (kaart && kaart.volgende ? kaartTekst(kaart) : bmTekst(r, st, scope)); velden.bm_feedback = 1; if (st.n >= BM_MIN) velden.bm_vergelijk = 1; }
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
    const x = kaart.n <= 3 ? T[0] : jij === top ? T[1] : T[2].replace('{top}', top.k).replace('{p}', jij.p);
    const knoppen = [...(volgendePeil(s, taal) ? [VOLGENDE[taal] || VOLGENDE.en] : []), T[3]];
    velden.peil_direct = 1;
    s.berichten.push({ r: 'b', t: Date.now(), x, k: knoppen }); s.laatste = Date.now(); s.eind = null; p.taal = s.ctx.taal; p.land = s.ctx.land;
    await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]);
    return { ok: true, x, knoppen, contact: null, peiling: kaart };
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
    if (gat.length) { if (!s.mr) { s.mr = { id: await kiesMr() }; await telMr(s.mr.id, 'g', TEST); velden.mr_toon = 1; } const zin = mrZin(s.mr.id, gat, s.eigen); if (zin) { extra = (extra ? extra + '\n' : '') + zin; velden.mr_vraag = 1; } }
  }
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
  const antwoord = kort(a.antwoord, 1500);
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
  if (a.zoekt && a.zoekt.wat && String(a.zoekt.wat).trim()) { const z = await zoektocht(p, s, a.zoekt, TEST).catch(() => null); if (z) velden[z.nieuw ? 'zoektocht' : 'zoektocht_bij'] = 1; }
  let eigenZw = null;
  if (a.zoekt && a.zoekt.wat && String(a.zoekt.wat).trim()) { const z = (p.zoektochten || []).filter(y => y.status === 'open' && y.sid === s.sid).slice(-1)[0]; if (z) eigenZw = { k: p.vid + ':' + z.id, kant: 'zoekt', wat: z.wat, soort: z.soort, eisen: z.eisen, waar: z.waar || z.stad, land: z.land }; }
  if (a.biedt && a.biedt.wat && String(a.biedt.wat).trim()) { const b = await aanbod(p, s, a.biedt, TEST).catch(() => null); if (b) { velden[b.nieuw ? 'aanbod' : 'aanbod_bij'] = 1; eigenZw = { k: p.vid + ':' + b.id, kant: 'biedt', wat: b.wat, soort: b.soort, eisen: [b.voor, b.prijs].filter(Boolean).join('; '), waar: b.waar || b.stad, land: b.land }; } }
  // meteen zeggen wie er al in zit (Henkjan 10 nov: "Geef meteen door als iemand er al inzit")
  let matchTekst = '';
  if (eigenZw) { s.eigen = eigenZw; if (s.mr && !s.mr.klaar && !matchGat(eigenZw).length) { s.mr.klaar = 1; await telMr(s.mr.id, 'k', TEST); velden.mr_klaar = 1; } }
  if (!eigenZw && s.matchWacht && s.beurten >= 2 && !s.matchGemeld && !kaart) eigenZw = s.matchWacht; // uitgestelde match van beurt 1, niet midden in een peiling (10 nov: kamer-match verscheen na een bankvraag)
  if (eigenZw && !s.matchGemeld && (s.beurten < 2 || (s.beurten < 4 && matchGat(eigenZw).includes('wat')))) { s.matchWacht = eigenZw; eigenZw = null; } // pas matchen als het concreet is: nooit 'nobody looks for something else'
  if (eigenZw && !s.matchGemeld) {
    const dm = await directMatch(p.vid, eigenZw, s.ctx && s.ctx.stad).catch(() => null);
    if (dm) {
      const T = mt(s.ctx.taal || 'en');
      if (dm.n > 0) { await wachtersMelden(p, s, eigenZw, dm.lijst, velden, TEST).catch(() => 0); if (s.mr) await telMr(s.mr.id, 'm', TEST); s.matchWacht = null; matchTekst = T.ja(dm.n, dm.stad, eigenZw.kant, (s.ctx && s.ctx.stad) || '') + lijstRegels(dm.lijst); s.matchKand = { eigen: eigenZw, ander: dm.beste }; s.matchGemeld = 1; velden.match_gevonden = 1; if (dm.stad) velden.match_stad = 1; }
      else if (!s.matchNiemand) { s.matchWacht = null; matchTekst = T.nee(eigenZw.kant); s.matchNiemand = 1; velden.match_niemand = 1; if (!heeftContact(p)) { const v = await kiesMl(); s.mlater = { id: v.id, kanaal: v.kanaal, x: v.x[s.ctx.taal] || v.x.en, zw: eigenZw.k }; await telMl(v.id, 'g', TEST); velden.ml_toon = 1; } }
    }
  }
  if (a.groep && String(a.groep).trim()) { const g = await groepIn(p, s, a.groep, TEST).catch(() => null); if (g) velden.groep = 1; }
  if (a.koppel && a.koppel.id && !TEST) { const k = await koppel(p, String(a.koppel.id), !!a.koppel.ja).catch(() => null); if (k) velden['koppel_' + k] = 1; }
  if (kaart && kaart.tik && knoppen.length < 4 && volgendePeil(s, s.ctx.taal || 'en')) { const vl = VOLGENDE[s.ctx.taal] || VOLGENDE.en; if (!knoppen.includes(vl)) knoppen = [...knoppen, vl]; }
  if (kaart && kaart.volgende && volgendePeil(s, s.ctx.taal || 'en')) { const vl = VOLGENDE[s.ctx.taal] || VOLGENDE.en; knoppen = [vl, ...knoppen.filter(k => k !== vl)].slice(0, 4); }
  if (s.matchKand && !s.schrijf && !(s.matchVerbonden)) { const V = VERBIND[s.ctx.taal] || VERBIND.en; knoppen = [...knoppen.filter(k => k !== V).slice(0, 3), V]; }
  const mlNu = !!(matchTekst && s.mlater && !s.matchKand); if (mlNu) knoppen = [...knoppen.filter(k => k !== s.mlater.x).slice(0, 3), s.mlater.x];
  const contactVraag = a.contact === 'vraag' && !(p.contact && (p.contact.mail || p.contact.tg || p.contact.wa)) && s.contactGevraagd < 2;
  if (contactVraag) { s.contactGevraagd += 1; velden.contact_gevraagd = 1; }
  else if (!mlNu && !(s.matchKand && !s.matchVerbonden && !s.schrijf) && s.beurten >= 2 && !heeftContact(p) && !(p.contact && p.contact.stop) && s.contactGevraagd < 2) {
    if (!s.cpil) { s.cpil = await kiesCpil(s.ctx.taal); if (s.cpil) { await telCpil(s.cpil, 'g', TEST); velden.cpil_getoond = 1; } }
    if (s.cpil) { knoppen = knoppen.filter(k => k !== s.cpil.x).slice(0, 3); if (s.cpil.plek === 'eerst') knoppen.unshift(s.cpil.x); else knoppen.push(s.cpil.x); }
  }
  if (matchTekst) s.berichten.push({ r: 'b', t: Date.now(), x: matchTekst, match: true });
  s.berichten.push({ r: 'b', t: Date.now(), x: antwoord, k: knoppen, fase: kort(a.fase, 20), zoek: gezocht || undefined, cv: contactVraag || undefined });

  s.laatste = Date.now(); s.fase = kort(a.fase, 20); s.eind = null;
  p.taal = s.ctx.taal; p.land = s.ctx.land;
  await Promise.all([bewaarSessie(s), bewaarProfiel(p), tel(velden, D, TEST)]);
  let code = null; if (contactVraag && kan.length > 1) code = await contactCode(s.vid);
  return { ok: true, x: antwoord, match: matchTekst || undefined, knoppen, cpil: s.cpil && knoppen.includes(s.cpil.x) ? s.cpil.x : null, contact: contactVraag ? contactOpties(kan, code, s.ctx.taal) : null, zocht: !!gezocht, ...(kaart ? { peiling: kaart } : {}), ...(TEST && s.fout ? { fout: s.fout } : {}) };
}

// ---------- contact via Telegram en WhatsApp (de bezoeker stuurt ons een berichtje met een code) ----------
async function contactCode(vid) {
  const bestaand = await kv.get('wam:vcode:' + vid).catch(() => null); if (bestaand) return bestaand;
  const code = hex(3).toUpperCase(); await kv.set('wam:code:' + code, vid, { ex: TTL.code }); await kv.set('wam:vcode:' + vid, code, { ex: TTL.code }); return code;
}
export function contactOpties(kan, code, taal) {
  const o = [{ soort: 'push' }, { soort: 'mail' }];
  if (code && process.env.WAM_TG_BOT && process.env.WAM_TG_TOKEN) o.push({ soort: 'tg', url: 'https://t.me/' + process.env.WAM_TG_BOT + '?start=wam' + code });
  if (code && process.env.WAM_WA_NUMMER && process.env.WAM_WA_BOT) o.push({ soort: 'wa', url: 'https://wa.me/' + String(process.env.WAM_WA_NUMMER).replace(/\D/g, '') + '?text=' + encodeURIComponent((taal === 'nl' ? 'Hoi WAM! Mijn code: ' : 'Hi WAM! My code: ') + code) });
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
  if (id && N(await kv.raw(['SET', 'wam:mailin:' + id, '1', 'NX', 'EX', String(14 * 86400)]).catch(() => 1)) === 0) return { ok: true, dubbel: true };
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
  const klaar = await POST.mailKlaar(), tg = !!process.env.WAM_TG_TOKEN;
  for (const lid of ids) {
    const [vid, id] = String(lid).split(':'); const p = await profiel(vid); const b = p && (p.beloften || []).find(x => x.id === id);
    const weg = async status => { if (b) { b.status = status; b.ts = nu; await bewaarProfiel(p); } await kv.raw(['ZREM', 'wam:beloften', lid]).catch(() => {}); uit.weg++; };
    if (!b || b.status !== 'open') { await weg(b ? b.status : 'onbekend'); continue; }
    const c = p.contact || {}, moment = b.wanneer || b.t;
    if (c.stop) { await weg('gestopt'); continue; }
    const kanaal = c.mail && klaar ? 'mail' : c.tg && tg ? 'tg' : c.push && c.push.endpoint ? 'push' : '';
    if (!kanaal) {
      if (!c.mail && !c.tg && !c.push) { if (nu - moment > 3 * 86400000) await weg('geen_contact'); else uit.wacht++; continue; }
      uit.wacht++; await meldEenmaal('postwacht:' + dag(), 'WAM: er liggen beloftes klaar om te mailen, maar het verzenddomein wearemany.now is nog niet geverifieerd bij Resend.');
      if (nu - moment > 14 * 86400000) await weg('verlopen'); continue;
    }
    if (!(await binnenPlafond(0.03))) { uit.wacht++; break; }
    try {
      const m = await maakPost(p, b); const l = await postLinks(vid);
      if (kanaal === 'mail') await POST.stuurMail({ to: c.mail, subject: m.onderwerp || 'WAM', html: POST.mailHtml({ taal: b.taal, tekst: m.tekst, knop: m.knop, ...l }), text: POST.mailTekst({ taal: b.taal, tekst: m.tekst, knop: m.knop, ...l }), stopUrl: l.stopUrl, idem: 'wam-post-' + vid + '-' + id });
      else if (kanaal === 'tg') await tgStuur(c.tg, m.tekst + '\n\n' + l.chatUrl);
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
  const CAMP = { 12121526: 'Londen', 12121527: 'Londen zoek', 12120598: 'UK', 12121469: 'CA', 12122333: 'CA nieuw (aanbod peil uil)', 12122334: 'UK nieuw (aanbod peil uil)', 12123979: 'CA aanbod', 12123981: 'US aanbod', 12120587: 'US', 12120600: 'NL', 12120602: 'DE', 12124847: 'Londen kopie', 12124853: 'Londen zoek kopie', 12125129: 'US kopie', 12125131: 'NL kopie', 12125132: 'DE kopie', 157894: 'Mondiad MATCH' };
  const begin = Date.now() - 24 * 3600000, pc = {};
  for (const x of gs) { if (N(x.t0) < begin || (x.ctx && x.ctx.test) || !N(x.beurten)) continue; const k = (x.params && x.params.c) ? (CAMP[x.params.c] || 'campagne ' + x.params.c) : 'zonder advertentie'; const r = pc[k] = pc[k] || { g: 0, b3: 0, c: 0 }; r.g++; if (N(x.beurten) >= 3) r.b3++; if (x.berichten.some(m => m.r === 'u' && MAIL.test(m.x))) r.c++; }
  const tijden = gs.filter(x => N(x.t0) > begin && !(x.ctx && x.ctx.test) && N(x.beurten) >= 1).map(x => { const u = x.berichten.find(m => m.r === 'u'), l = x.berichten[x.berichten.length - 1]; return u && l ? Math.max(0, N(l.t) - N(u.t)) / 1000 : 0; }).sort((a, b) => a - b);
  const tm = tijden.length ? 'North star, gesprekstijd (24 uur, ' + tijden.length + ' gesprekken): gemiddeld ' + Math.round(tijden.reduce((a, b) => a + b, 0) / tijden.length) + ' s, mediaan ' + Math.round(tijden[Math.floor(tijden.length / 2)]) + ' s, langste ' + Math.round(tijden[tijden.length - 1] / 60) + ' min.' : '';
  const pcT = Object.entries(pc).sort((a, b) => b[1].g - a[1].g).map(([k, r]) => k + ' ' + r.g + (r.b3 ? ' (' + r.b3 + ' tot beurt 3' + (r.c ? ', ' + r.c + ' contact' : '') + ')' : '')).join(', ');
  const dialogen = nieuw.slice(0, 2).map(x => '\n\n' + [x.ctx && x.ctx.land, x.params && x.params.n ? 'advertentie ' + (x.hook || '') : 'organisch', x.beurten + ' beurten', reden(x).replace(/_/g, ' ')].filter(Boolean).join(' · ') + '\n' + x.berichten.slice(0, 6).map(m => (m.r === 'b' ? 'WAM: ' : 'Bezoeker: ') + kort(maskeer(m.x), 130)).join('\n')).join('');
  const t = 'WAM, laatste ' + Math.max(1, Math.round((nu - N(vorig.t || nu - 1800000)) / 60000)) + ' min: ' + d('cm_kliks') + ' kliks, ' + d('cm_echt') + ' echte mensen (Clickmind), ' + d('echt') + ' gesprekken, ' + d('beurt3') + ' tot beurt 3, ' + d('contact') + ' contact, ' + d('cpil_tik') + ' tikken op de contactknop.' +
    (tm ? '\n' + tm : '') + ((d('volgende') || d('peil_direct')) ? '\nPeilingen direct beantwoord: ' + d('peil_direct') + ', Volgende vraag getikt: ' + d('volgende') + 'x' : '') + (d('tik_kaart') ? '\nOpenertik met uitslag in procenten: ' + d('tik_kaart') + 'x' : '') + (d('n_bot') ? '\nWachttijd op de bot: gemiddeld ' + (d('ms_bot') / d('n_bot') / 1000).toFixed(1) + ' s' : '') +
    ((uit.wijzigingen || []).length ? '\nVerbeterd: ' + uit.wijzigingen.join(' | ') : '') + (uit.analyse ? '\nGeleerd: ' + kort(uit.analyse, 260) : '') +
    (pcT ? '\nGesprekken per campagne, laatste 24 uur: ' + pcT : '') + ((d('ev_kaart_push') || d('ev_kaart_mail')) ? '\nContactkaart getoond: ' + d('ev_kaart_push') + 'x met meldknop, ' + d('ev_kaart_mail') + 'x zonder (telefoon kan geen meldingen), ' + d('ev_contact_nee') + 'x nee getikt' : '') + ((d('ev_contact_push_tik') || d('contact_push') || d('ev_contact_push_direct')) ? '\nMeldknop: ' + d('ev_contact_push_direct') + 'x meteen gevraagd bij de contactknop, ' + d('ev_contact_push_tik') + ' getikt, ' + d('contact_push') + ' aangezet, ' + d('ev_contact_push_nee') + ' geweigerd of niet gelukt' + ((d('ev_push_denied') || d('ev_push_default') || d('ev_push_fout')) ? ' (geblokkeerd ' + d('ev_push_denied') + ', geen antwoord ' + d('ev_push_default') + ', techniek ' + d('ev_push_fout') + ')' : '') : '') + ((d('match_gevonden') || d('match_niemand') || d('verbind')) ? '\nMatches live: ' + d('match_gevonden') + 'x meteen iemand gevonden die er al in zit (' + d('match_stad') + 'x in de eigen stad), ' + d('match_niemand') + 'x nog niemand; ' + d('verbind') + 'x verbind me getikt, ' + d('bericht_door') + ' berichten doorgegeven, ' + d('inbox_gelezen') + ' gelezen door de ander, ' + d('nr_gedeeld') + ' WhatsApp-nummers gedeeld, ' + d('nr_uitgewisseld') + ' uitgewisseld' : '') + (d('ml_toon') ? '\nGericht doorvragen tot matchbaar (lerend: vrij, gat, voortgang): ' + d('mr_toon') + 'x gestart, ' + d('mr_vraag') + ' gerichte vragen, ' + d('mr_klaar') + 'x matchbaar geworden. Wachters gemeld bij een nieuwe match: ' + d('wacht_gemeld') + ' (mail ' + d('wacht_mail') + ', Telegram ' + d('wacht_tg') + ', nummer ' + d('wacht_nr') + ')' + '\nLater melden als er nog niemand is (lerend, 4 varianten): ' + d('ml_toon') + 'x gevraagd, ' + d('ml_tik') + 'x getikt, ' + d('ml_c') + 'x nummer of mail achtergelaten; ' + d('ml_raak_nr') + 'x later gebruikt via WhatsApp, ' + d('ml_raak_mail') + 'x via mail, ' + d('ml_raak_tg') + 'x via Telegram; ' + d('inbox_tg') + ' berichten via Telegram bezorgd' : '') + (d('ev_bewaar_toon') ? '\nBewaren zonder contact: ' + d('ev_bewaar_toon') + 'x getoond, ' + d('ev_bewaar_wa') + ' naar eigen WhatsApp, ' + d('ev_bewaar_share') + ' gedeeld, ' + d('ev_bewaar_kopie') + ' link gekopieerd, ' + d('bewaar_terug') + ' terug via die link' : '') + (uit.match && uit.match.nieuw ? '\nMatches tussen bezoekers: ' + uit.match.nieuw + ' nieuw' : '') +
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
export async function herkomst(n = 40) {
  const l = await kv.raw(['LRANGE', 'wam:sessies:' + dag(), String(-Math.min(200, n)), '-1']).catch(() => []) || [];
  const uit = []; for (const sid of l.reverse()) { const s = await sessie(sid).catch(() => null); if (!s) continue; uit.push({ t: new Date(s.t0).toISOString().slice(11, 16), land: s.ctx && s.ctx.land, n: s.params && s.params.n, c: s.params && s.params.c, z: s.params && s.params.z, b: s.params && s.params.b, mmc: !!(s.params && s.params.mmc), ref: s.ctx && s.ctx.ref ? String(s.ctx.ref).slice(0, 60) : '', app: s.ctx && s.ctx.app, opener: s.opener, terug: !!s.terug, beurten: s.beurten }); }
  return uit;
}
