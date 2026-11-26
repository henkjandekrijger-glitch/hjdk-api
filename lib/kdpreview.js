// Reviews voor de KDP-boeken, helemaal zelf (Henkjan 26 nov 2026: "Nee we doen alles zelf . Dus maak werkend mechanisme in de boeken."
// en eerder 21 nov: "Je kunt boeken bijna weggeven vr reviews", geen reviewdiensten).
// Drie onderdelen, regels van Amazon erin gebakken (KDP help G202101910 en Community Guidelines):
// 1. /r/<boek>[?p=<plek>]  QR in het boek -> reviewformulier op de Amazon van het land van de lezer (verified purchase kan alleen daar).
//    Telt per boek, plek en land (kv kdp:rev2, veld boek|plek|land|dag) en houdt de oude telling (kdp:rev, boek:dag) bij.
// 2. /x/<boek>  bonus bij het boek, zonder enige voorwaarde over een review. E-mailadres om de bonus te krijgen (niet bij Teens:
//    lezers zijn tieners, daar alleen de quiz). Opslag kdp:lz:<hash>, lijst kdp:lz:lijst (score = tijd).
// 3. Mailmind-stroom kdp-review: 12 dagen na de bonus één neutrale vraag om een eerlijke review, aan iedereen (geen selectie op tevredenheid,
//    nooit "5 sterren", niets ervoor terug). Klik op de reviewlink = ja. LIVE pas op Henkjans "verstuur".
import { kv } from './db.js';
import * as M from './mailmind.js';

export const LIVE = false; // aan op Henkjans "verstuur" (en op=mailmind&s=kdp-review&zet=1&aan=1)
const S = 'kdp-review', WTB = 'https://whichtobuy.best', KB = 'https://kaufberater.best';
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Boek: [thuismarkt, ASIN paperback, zoekterm als er nog geen ASIN is]; titel en auteur voor de pagina en de mail; bonus = soort bonus.
export const BOEKEN = {
  pitboss: { m: 'com', asin: 'B0BKRPL5JX', titel: 'PIT BOSS Wood Pellet Grill and Smoker Cookbook', kort: 'the PIT BOSS cookbook', auteur: 'Alec Poole', bonus: 'pitboss', taal: 'en' },
  lc: { m: 'com', asin: 'B0F1SM1L5J', titel: 'Lasting Change Workbook', kort: 'the Lasting Change Workbook', auteur: 'John Warrior', bonus: 'lc', taal: 'en' },
  teens: { m: 'com', asin: 'B0DJQLBM75', titel: 'Stocking Stuffers for Teens', kort: 'Stocking Stuffers for Teens', auteur: 'Elias Grant', bonus: 'quiz', taal: 'en', geenMail: true },
  adults: { m: 'com', asin: 'B0DJQS1K5Z', titel: 'White Elephant Gifts for Adults', kort: 'the book', auteur: 'Elias Grant', taal: 'en' },
  wtt: { m: 'com', asin: 'B0HRFY3TLB', titel: "Wait, That's True?!", kort: "Wait, That's True?!", auteur: 'Elias Grant', taal: 'en' },
  men: { m: 'com', asin: 'B0HRGNJ7CY', titel: 'Stocking Stuffers for Men', kort: 'the book', auteur: 'Elias Grant', taal: 'en' },
  apo: { m: 'com', asin: 'B0DDBTXC9J', titel: 'The Definitive Apocrypha', kort: 'the Apocrypha', taal: 'en' },
  apocrypha: { m: 'com', asin: 'B09YTZ72KZ', titel: 'The Complete Apocrypha', kort: 'the Apocrypha', taal: 'en' },
  enoch: { m: 'com', asin: 'B0B5KV79N1', titel: 'The Book of Enoch', kort: 'the Book of Enoch', taal: 'en' },
  advent: { m: 'de', asin: 'B0HRRCXTNV', titel: 'Adventskalender für Männer', taal: 'de' },
  echtjetzt: { m: 'de', asin: 'B0HSM3KSBN', titel: 'Echt jetzt?!', taal: 'de' },
  momentmal: { m: 'de', asin: 'B0HRY6CYMD', titel: 'Moment mal, das stimmt?!', taal: 'de' },
  buero: { m: 'de', asin: '', zoek: 'Ich tu nur so als ob David Warrior', titel: 'Ich tu nur so, als ob', taal: 'de' }
};

// Land van de lezer -> Amazon waar KDP paperbacks verkoopt. Onbekend land: de thuismarkt van het boek.
const LAND = { US: 'com', PR: 'com', CA: 'ca', GB: 'co.uk', IE: 'co.uk', AU: 'com.au', NZ: 'com.au', DE: 'de', AT: 'de', CH: 'de', LU: 'de', FR: 'fr', BE: 'fr', ES: 'es', IT: 'it', NL: 'nl', SE: 'se', PL: 'pl', JP: 'co.jp' };
export const markt = (b, land) => LAND[String(land || '').toUpperCase()] || (BOEKEN[b] && BOEKEN[b].m) || 'com';
export function reviewUrl(b, land) {
  const r = BOEKEN[b], dom = 'https://www.amazon.' + markt(b, land);
  if (!r) return dom + '/';
  return r.asin ? dom + '/review/create-review?asin=' + r.asin : dom + '/s?k=' + encodeURIComponent(r.zoek || r.titel) + '&i=stripbooks';
}
const plekVan = p => String(p || 'boek').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'boek';
const landVan = l => (/^[A-Z]{2}$/.test(String(l || '').toUpperCase()) ? String(l).toUpperCase() : 'XX');
const dagUTC = () => new Date().toISOString().slice(0, 10);

// Scan of klik tellen. Mailscanners en voorvertoningen tellen niet.
const BOT = /bot|crawl|spider|preview|scan|safe|proofpoint|mimecast|barracuda|headless|python|curl|wget|facebookexternalhit|slurp/i;
export async function tel(b, plek, land, ua = '') {
  if (!BOEKEN[b] || BOT.test(String(ua))) return;
  const d = dagUTC(), pl = plekVan(plek);
  if (!pl.startsWith('x')) { try { await kv.raw(['HINCRBY', 'kdp:rev', b + ':' + d, 1]); } catch (e) {} } // x... = bezoek aan de bonuspagina, geen reviewscan
  try { await kv.raw(['HINCRBY', 'kdp:rev2', [b, pl, landVan(land), d].join('|'), 1]); } catch (e) {}
}

// Stand: per boek totaal scans, per plek, per land, aanmeldingen voor de bonus en wat Mailmind deed.
export async function stand() {
  const lees = async k => { let h = []; try { h = (await kv.raw(['HGETALL', k])) || []; } catch (e) {} const o = {}; if (Array.isArray(h)) for (let i = 0; i < h.length; i += 2) o[h[i]] = N(h[i + 1]); else Object.assign(o, h); return o; };
  const oud = await lees('kdp:rev'), nieuw = await lees('kdp:rev2'), per = {};
  for (const [k, n] of Object.entries(nieuw)) { const [b, p, l] = k.split('|'); const x = per[b] = per[b] || { scans: 0, plek: {}, land: {} }; if (String(p).startsWith('x')) { x.bonusBezoek = (x.bonusBezoek || 0) + n; continue; } x.scans += n; x.plek[p] = (x.plek[p] || 0) + n; x.land[l] = (x.land[l] || 0) + n; }
  for (const [k, n] of Object.entries(oud)) { const b = k.split(':')[0]; const x = per[b] = per[b] || { scans: 0, plek: {}, land: {} }; x.oud = (x.oud || 0) + n; }
  const lz = {}; let totaal = 0;
  try { totaal = N(await kv.raw(['ZCARD', 'kdp:lz:lijst'])); } catch (e) {}
  for (const b of Object.keys(BOEKEN)) { const n = N(await kv.get('kdp:lz:n:' + b).catch(() => 0)); if (n) lz[b] = n; }
  return { ok: true, live: LIVE, perBoek: per, bonusAanmeldingen: { totaal, perBoek: lz }, boeken: Object.fromEntries(Object.entries(BOEKEN).map(([k, v]) => [k, [v.m, v.asin || '', v.zoek || ''].filter((x, i) => i < 2 || x)])) };
}

// ---------- bonus: aanmelden ----------
export const TOESTEMMING = { en: 'Send me the bonus and, now and then, an email from the author about this book. One click to unsubscribe.', de: 'Schick mir den Bonus und ab und zu eine E-Mail vom Autor zu diesem Buch. Abmelden mit einem Klick.' };
export async function aanmelden({ b, email, land, plek, ua }) {
  const r = BOEKEN[b]; if (!r || r.geenMail || !r.bonus) return { ok: false, fout: 'boek' };
  const m = String(email || '').trim().toLowerCase(); if (!M.MAILRE.test(m) || m.length > 120) return { ok: false, fout: 'adres' };
  if (BOT.test(String(ua || ''))) return { ok: false, fout: 'bot' };
  const h = M.hm(m), k = 'kdp:lz:' + h, al = await kv.get(k).catch(() => null);
  if (!al) {
    await kv.set(k, { m, b, t: Date.now(), land: landVan(land), plek: plekVan(plek), toestemming: TOESTEMMING[r.taal] || TOESTEMMING.en });
    await kv.raw(['ZADD', 'kdp:lz:lijst', String(Date.now()), h]).catch(() => {});
    await kv.raw(['INCR', 'kdp:lz:n:' + b]).catch(() => {});
  }
  return { ok: true, nieuw: !al, bonus: bonusPad(b) };
}
export const bonusPad = b => '/x/' + b + '/bonus';

// ---------- Mailmind-stroom ----------
const WACHT = 12 * 86400 * 1000; // 12 dagen na de bonus: genoeg tijd om het boek echt te gebruiken
export const VARIANTEN = [
  { o: 'How is {kort} working out?', t: 'Hi,\n\nA couple of weeks ago you grabbed the free bonus for {titel}. I hope it has been useful.\n\nOne small favour, if you have a minute: would you leave an honest review on Amazon? Good or bad, it helps the next reader decide, and it means a lot to a small independent publisher.\n\n{review}\n\nAnything missing or wrong in the book? Just reply to this email. I read every reply.\n\n{auteur}\n\nNo more emails about this book: {stop}' },
  { o: 'Quick question about {kort}', t: 'Hi,\n\nYou downloaded the bonus for {titel} about two weeks ago. Did it help?\n\nIf you have a minute, an honest review on Amazon helps other people find the book and tells me what to improve. One sentence is plenty:\n\n{review}\n\nOr reply and tell me directly. I read every reply.\n\n{auteur}\n\nUnsubscribe: {stop}' }
];
export function mailTekst(a, { v, tok }) {
  const r = BOEKEN[a.code] || {}, L = w => WTB + '/x/m/' + tok + '/' + w;
  const vul = s => String(s).split('{titel}').join(r.titel || 'the book').split('{kort}').join(r.kort || 'the book').split('{auteur}').join(r.auteur || 'The author')
    .split('{review}').join(L('r')).split('{stop}').join(L('x'));
  const o = vul(v.o); return { onderwerp: o.charAt(0).toUpperCase() + o.slice(1), tekst: vul(v.t), stop: L('x') };
}
// vooraf (elke uurronde van Mailmind, alleen als de stroom aan staat): wie 12 dagen of langer geleden een bonus vroeg en nog niet in de rij stond.
export async function rijVullen() {
  const tot = Date.now() - WACHT, hs = (await kv.raw(['ZRANGEBYSCORE', 'kdp:lz:lijst', '0', String(tot), 'LIMIT', '0', '200']).catch(() => [])) || [], lijst = [];
  for (const h of hs) {
    if ((await kv.raw(['SET', 'kdp:lz:mlm:' + h, '1', 'NX', 'EX', String(800 * 86400)]).catch(() => null)) !== 'OK') continue;
    const r = await kv.get('kdp:lz:' + h).catch(() => null); if (!r || !r.m || await M.geblokkeerd(r.m)) continue;
    lijst.push({ m: r.m, code: r.b, land: r.land, plek: r.plek });
  }
  return lijst.length ? M.vul(S, lijst) : { ok: true, erbij: 0 };
}
export const STROOM = {
  id: S, LIVE, kanaal: 'gmail', fromName: 'Golden Years Publishing', wie: 'kdp', taal: 'en', soort: 'klant',
  doel: 'Lezer die de bonus van een KDP-boek vroeg, schrijft een eerlijke review op Amazon (klik op de reviewlink)', std: { perDag: 40, max: 100, perUur: 8 }, uren: [14, 23],
  varianten: VARIANTEN, mail: (a, o) => mailTekst(a, o),
  bak: a => String(a.code || 'x') + '|' + String(a.plek || 'boek') + '|' + M.soortAdres(a.m),
  voorkennis: () => [1, 9], // verwachting 10%: mensen die zelf om de bonus vroegen
  vooraf: () => rijVullen(), antwoord: false, async bijJa() { return {}; }
};

// Klik in de mail: /x/m/<tok>/<r|x>. r = naar het reviewformulier (land van de aanmelding), x = afmelden.
export async function mailKlik(tok, w, ua = '', methode = 'GET') {
  const a = await M.adres(tok).catch(() => null); if (!a) return { naar: WTB + '/' };
  if (w === 'x') { await M.zegStop(S, a, STROOM).catch(() => {}); return { afgemeld: true }; }
  if (!BOT.test(String(ua))) { await M.zegJa(S, a, 'review', STROOM).catch(() => {}); await tel(a.code, 'mail', a.land, ua); }
  return { naar: reviewUrl(a.code, a.land) };
}

// ---------- pagina's ----------
const CSS = '*{box-sizing:border-box}body{margin:0;font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#000;background:#fff}main{max-width:640px;margin:0 auto;padding:24px 18px 48px}h1{font-size:28px;line-height:1.2;margin:8px 0 12px}h2{font-size:18px;margin:28px 0 8px}p{margin:0 0 12px}.knop{display:block;width:100%;padding:14px 16px;border:0;border-radius:10px;background:#000;color:#fff;font-weight:700;font-size:16px;line-height:1.2;font-family:inherit;text-align:center;text-decoration:none;cursor:pointer}input[type=email]{width:100%;padding:14px;border:2px solid #000;border-radius:10px;font-size:16px;font-family:inherit;margin:0 0 10px}.klein{font-size:13px}.vak{border:2px solid #000;border-radius:12px;padding:16px;margin:16px 0}table{width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:14px}th,td{border:1px solid #000;padding:6px 8px;text-align:left;vertical-align:top}th{background:#000;color:#fff}.hp{position:absolute;left:-5000px}@media print{.geenprint{display:none}main{max-width:none;padding:0}.breek{break-before:page}}@media (prefers-color-scheme:dark){body{background:#000;color:#fff}.knop{background:#fff;color:#000}input[type=email]{background:#000;color:#fff;border-color:#fff}.vak,th,td{border-color:#fff}th{background:#fff;color:#000}}';
const kader = (titel, body, taal = 'en') => '<!doctype html><html lang="' + taal + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' + esc(titel) + '</title><style>' + CSS + '</style></head><body><main>' + body + '</main></body></html>';
const reviewVak = (b, plek, taal = 'en') => '<div class="vak geenprint"><p><b>' + (taal === 'de' ? 'Hat dir das Buch gefallen oder nicht?' : 'Liked the book, or not?') + '</b> ' + (taal === 'de' ? 'Eine kurze, ehrliche Rezension auf Amazon hilft dem nächsten Leser bei der Entscheidung. Ein Satz reicht.' : 'A short, honest review on Amazon helps the next reader decide. One sentence is enough.') + '</p><a class="knop" href="/r/' + b + '?p=' + plek + '">' + (taal === 'de' ? 'Rezension schreiben' : 'Write a review') + '</a></div>';

const WAT = {
  pitboss: { kop: 'Your free Pellet Grill Cheat Sheet', tekst: 'A printable one-page guide to keep next to your grill: smoke times and target temperatures for 13 popular cuts, which pellets go with what, and quick fixes for the problems everyone runs into.' },
  lc: { kop: 'Your free printable restart kit', tekst: 'Fresh copies of the habit tracker, a weekly reset sheet and a one-page habit plan, ready to print. Use them for your next habit, or to restart after a bad week.' }
};
export function extraPagina(b) {
  const r = BOEKEN[b];
  if (!r) return null;
  if (r.bonus === 'quiz') return quizPagina(b);
  const w = WAT[r.bonus]; if (!w) return kader(r.titel, '<p class="klein">' + esc(r.titel) + '</p><h1>Thanks for reading</h1>' + reviewVak(b, 'extra', r.taal), r.taal);
  return kader(w.kop, '<p class="klein">' + esc(r.titel) + '</p><h1>' + esc(w.kop) + '</h1><p>' + esc(w.tekst) + '</p>'
    + '<form id="f" method="post" action="/x/' + b + '"><input type="email" name="email" required autocomplete="email" placeholder="Your email address" aria-label="Your email address"><input class="hp" name="naam" tabindex="-1" autocomplete="off"><button class="knop" type="submit">Send me the bonus</button><p class="klein" style="margin-top:10px">' + esc(TOESTEMMING.en) + ' You get the bonus right away on this page.</p></form>'
    + '<p id="ok" hidden><a class="knop" id="naar" href="' + bonusPad(b) + '">Open your bonus</a></p>'
    + '<script>(function(){var f=document.getElementById("f");f.onsubmit=function(e){e.preventDefault();var d=new FormData(f);fetch(f.action,{method:"POST",headers:{"content-type":"application/json","accept":"application/json"},body:JSON.stringify({email:d.get("email"),naam:d.get("naam"),p:new URLSearchParams(location.search).get("p")||"boek"})}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok){location.href=j.bonus}else{alert("Please check your email address.")}}).catch(function(){f.submit()})}})();</script>', r.taal);
}

export function bonusPagina(b) {
  const r = BOEKEN[b]; if (!r) return null;
  if (r.bonus === 'pitboss') return kader('Pellet Grill Cheat Sheet', PITBOSS + reviewVak(b, 'bonus'));
  if (r.bonus === 'lc') return kader('Lasting Change restart kit', LC + reviewVak(b, 'bonus'));
  if (r.bonus === 'quiz') return quizPagina(b);
  return null;
}

const PRINT = '<p class="geenprint"><button class="knop" onclick="window.print()">Print or save as PDF</button></p>';
const PITBOSS = '<h1>Pellet Grill Cheat Sheet</h1>' + PRINT
  + '<h2>Safe internal temperatures (USDA)</h2><table><tr><th>Food</th><th>Minimum</th></tr><tr><td>Chicken and turkey, whole or pieces</td><td>165°F (74°C)</td></tr><tr><td>Ground beef, pork, lamb</td><td>160°F (71°C)</td></tr><tr><td>Beef, pork, lamb steaks, roasts and chops</td><td>145°F (63°C), then rest 3 minutes</td></tr><tr><td>Fish</td><td>145°F (63°C)</td></tr></table>'
  + '<p class="klein">Low-and-slow cuts like brisket and pork butt are safe long before they are tender. You cook them higher so the connective tissue melts.</p>'
  + '<h2>Smoke times and targets</h2><p class="klein">Times are a starting point. Every grill, cut and day is different: cook to temperature and tenderness, not to the clock.</p><table><tr><th>Cut</th><th>Grill</th><th>About</th><th>Done at</th></tr>'
  + [['Beef brisket (whole packer)', '225 to 250°F', '1 to 1.5 h per lb', '200 to 205°F, probe slides in like butter'], ['Pork butt (pulled pork)', '225 to 250°F', '1.5 to 2 h per lb', '195 to 205°F'], ['Pork spare ribs', '225 to 250°F', '5 to 6 h', 'about 195 to 203°F, bends and cracks when lifted'], ['Baby back ribs', '225 to 250°F', '4 to 5 h', 'about 195 to 203°F, bend test'], ['Beef short ribs', '250 to 275°F', '6 to 8 h', '200 to 205°F'], ['Whole chicken', '325 to 350°F', '1.5 to 2 h', '165°F in the thickest part of the breast'], ['Chicken wings', '375 to 400°F', '45 to 60 min', '165°F, crispier at 175 to 185°F'], ['Bone-in chicken thighs', '350 to 375°F', '45 to 75 min', '165°F, most cooks prefer 175 to 185°F'], ['Turkey breast', '325°F', '2 to 3 h', '165°F'], ['Pork tenderloin', '275°F', '1 to 1.5 h', '145°F, rest 3 min'], ['Tri-tip, reverse sear', '225°F, then sear at 450°F or hotter', 'about 1 h, then a few minutes per side', '145°F per USDA; many cooks pull earlier for medium-rare'], ['Salmon fillet', '225°F', '1 to 1.5 h', '145°F'], ['Meatloaf', '325°F', '1 to 1.5 h', '160°F']].map(x => '<tr><td>' + x.map(esc).join('</td><td>') + '</td></tr>').join('') + '</table>'
  + '<h2>Which pellets with what</h2><table><tr><th>Pellet</th><th>Flavor</th><th>Best with</th></tr>'
  + [['Hickory', 'bold, classic barbecue', 'pork, ribs, beef'], ['Oak', 'medium, steady, all-purpose', 'brisket, beef, anything'], ['Mesquite', 'strong and earthy, use for short cooks', 'beef, steaks'], ['Apple', 'mild and sweet', 'pork, chicken'], ['Cherry', 'mild, sweet, gives a deep red color', 'pork, poultry, ribs'], ['Pecan', 'nutty, softer than hickory', 'poultry, pork'], ['Maple', 'light and sweet', 'poultry, vegetables, cheese'], ['Alder', 'delicate', 'fish, especially salmon']].map(x => '<tr><td>' + x.map(esc).join('</td><td>') + '</td></tr>').join('') + '</table>'
  + '<h2>Quick fixes</h2><table><tr><th>Problem</th><th>What to do</th></tr>'
  + [['Temperature keeps swinging', 'Keep the lid closed (every peek costs heat), check the pellet level, and clean the ash out of the fire pot.'], ['Bitter or sooty taste', 'Let the grill reach temperature before the food goes on. Thin, blue smoke is good; thick white smoke is not.'], ['The stall: meat stuck around 150 to 170°F for hours', 'Normal. Moisture evaporating from the surface cools the meat. Wait it out, or wrap in butcher paper or foil to push through.'], ['Auger jams or the fire goes out', 'Pellets got damp. Store them in a sealed bin; swollen or crumbly pellets should be thrown out.'], ['Cold or windy day', 'Expect a longer cook and more pellets. Keep the grill out of the wind.']].map(x => '<tr><td>' + x.map(esc).join('</td><td>') + '</td></tr>').join('') + '</table>';

const LC = '<h1>Lasting Change restart kit</h1>' + PRINT
  + '<h2>30-day habit tracker</h2><p>My habit, in one line: ______________________________</p><p>The tiny version for bad days: ______________________________</p>'
  + '<table>' + [0, 1, 2, 3, 4].map(r => '<tr>' + [1, 2, 3, 4, 5, 6].map(k => '<td style="height:52px;width:16.6%">Day ' + (r * 6 + k) + '</td>').join('') + '</tr>').join('') + '</table>'
  + '<p class="klein">Tick the day when you did it, even the tiny version. Missed one? Never miss two in a row.</p>'
  + '<h2 class="breek">Weekly reset</h2><table>' + ['What went well this week?', 'What got in the way?', 'What is the one thing I will change next week?', 'When and where exactly will I do my habit?'].map(q => '<tr><td style="height:96px"><b>' + esc(q) + '</b></td></tr>').join('') + '</table>'
  + '<h2 class="breek">One-page habit plan</h2><table>' + ['The habit (what, exactly)', 'After I ... (the moment it hooks onto)', 'Where', 'The 2-minute version', 'The bad-day version', 'How I will make it easy (what I set out the night before)', 'How I will notice I did it', 'Who I will tell'].map(q => '<tr><td style="height:64px;width:42%"><b>' + esc(q) + '</b></td><td></td></tr>').join('') + '</table>';

// Teens: de lezer is meestal een tiener, dus geen e-mailadres; alleen de quiz en een regel voor wie het boek gaf.
const QUIZ = [
  ['An octopus has three hearts.', 1, 'Two pump blood through the gills, one through the rest of the body.'],
  ['The Great Wall of China is visible to the naked eye from the Moon.', 0, 'It is long but very narrow; no astronaut has seen it with the naked eye from the Moon.'],
  ['A day on Venus is longer than a year on Venus.', 1, 'Venus spins once in about 243 Earth days but goes around the Sun in about 225.'],
  ['Bananas are berries, but strawberries are not.', 1, 'In botany a berry grows from one flower with one ovary. Bananas qualify, strawberries do not.'],
  ['Sharks have been around longer than trees.', 1, 'Sharks appear in the fossil record about 450 million years ago, trees about 385 million.'],
  ['Lightning never strikes the same place twice.', 0, 'Tall buildings get hit again and again. The Empire State Building is struck about 20 to 25 times a year.'],
  ['Goldfish only remember things for three seconds.', 0, 'Experiments show goldfish can remember things for months.'],
  ['Wombat poop is cube-shaped.', 1, 'The shape comes from how their intestines stretch. Cubes do not roll away from the spot they mark.'],
  ['The Eiffel Tower can be taller in summer than in winter.', 1, 'The iron expands in the heat, adding up to about 15 centimeters.'],
  ['Mount Everest is the tallest mountain from base to peak.', 0, 'Everest is the highest above sea level. Measured from its base on the ocean floor, Mauna Kea in Hawaii is taller.'],
  ['A group of flamingos is called a flamboyance.', 1, 'Yes, really.'],
  ['Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.', 1, 'The Great Pyramid is about 4,500 years old; Cleopatra died about 2,000 years ago.'],
  ['Bats are blind.', 0, 'All bats can see, and many see well. Some also use echoes to find their way in the dark.'],
  ['Peanuts are not nuts.', 1, 'They are legumes, in the same family as beans and peas, and grow underground.'],
  ['Polar bears have black skin under their fur.', 1, 'The black skin soaks up heat; the fur is actually see-through, not white.'],
  ['Venus is the hottest planet in the solar system, even though Mercury is closer to the Sun.', 1, 'Its thick atmosphere traps heat: the surface is about 465°C (870°F).']
];
export function quizPagina(b) {
  const r = BOEKEN[b] || BOEKEN.teens;
  return kader('Bonus quiz: True or False?', '<p class="klein">Bonus for ' + esc(r.titel) + '</p><h1>True or false? 16 bonus questions</h1><p>Not in the book. Tap your answer, then see if you were right. Keep score and challenge whoever gave you the book.</p><div id="q"></div><div id="eind" hidden class="vak"><p><b id="score"></b></p><p>Did someone give you this book? Show them your score, and tell them what you thought of it. If they bought it on Amazon, a short honest review from them helps other people pick a gift.</p><a class="knop" href="/r/' + b + '?p=quiz">Leave a review</a></div>'
    + '<script>(function(){var Q=' + JSON.stringify(QUIZ) + ',i=0,g=0,el=document.getElementById("q");function toon(){if(i>=Q.length){el.innerHTML="";document.getElementById("score").textContent="You got "+g+" out of "+Q.length+" right.";document.getElementById("eind").hidden=false;return}var q=Q[i];el.innerHTML="<div class=vak><p class=klein>Question "+(i+1)+" of "+Q.length+"</p><p><b>"+q[0]+"</b></p><p><button class=knop id=t>True</button></p><p><button class=knop id=f>False</button></p><p id=u hidden></p></div>";function kies(a){var ok=(a===q[1]);if(ok)g++;var u=document.getElementById("u");u.hidden=false;u.innerHTML="<b>"+(ok?"Right!":"Not quite.")+"</b> "+(q[1]?"True. ":"False. ")+q[2]+"<br><br><button class=knop id=n>Next</button>";document.getElementById("t").disabled=true;document.getElementById("f").disabled=true;document.getElementById("n").onclick=function(){i++;toon()}}document.getElementById("t").onclick=function(){kies(1)};document.getElementById("f").onclick=function(){kies(0)}}toon()})();</script>');
}
export const afgemeldPagina = () => kader('Unsubscribed', '<h1>You are unsubscribed</h1><p>You will not get any more emails about this book. Thanks for reading.</p>');
