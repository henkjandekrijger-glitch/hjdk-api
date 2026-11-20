// Live tafel met de AI als gastvrouw (20 nov 2026, Henkjan: "Ik bedoel live . AI zit er altijd tussen als moderator meteen . Kunnen we dat naturel
// en organisch krijgen ?" en "Ja bouw en dan gaan we A / B testen daar"). Ontwerp: https://claude.ai/artifact/V8f6uwDLMwYgfPZSBUnAVf (deel 3).
// Bezoekers van dezelfde keuzehulp praten live met elkaar. Elk bericht gaat eerst langs de gastvrouw (Haiku): dubbel wordt een teller
// ("hetzelfde"), een scherpe toon krijgt een rustiger voorstel, telefoonnummers, mailadressen en links gaan er altijd uit (ook zonder AI).
// De gastvrouw vat samen voor wie binnenkomt, stelt mensen aan elkaar voor, beantwoordt een vraag die 60 seconden open blijft uit de pagina
// (kzChat, dezelfde kennis als de chat) en stelt een eigen tafel voor als drie berichten van twee mensen over iets anders gaan.
// Proef tafelnl/tafelus/tafelde (lib/proef.js): a = alleen de chat (controle), b = chat plus de pill naar de live tafel. De rechter is dezelfde
// als bij de chat: intentie en contact per 100 bezoekers; chatgebeurtenissen tellen in beide armen mee (window.__kxEv).
// Opslag (KV): tafel:m:<kamer> berichten (laatste 400), tafel:p:<kamer> tellers "hetzelfde", tafel:t:<kamer> tafels, tafel:s:<kamer> samenvatting,
// tafel:aw:<kamer> wie er nu is (90 s), tafel:v:<kamer> volgers (mail, alleen na hun vraag, versturen staat uit tot Henkjan: kv tafel:zend).
// Geen namen: iedereen heeft een bijnaam. Pagina's met een tafel: zie tafelAan hieronder.
import { createHash } from 'node:crypto';
import { kv } from './db.js';
import { berichten, HAIKU } from './ai.js';

// Sinds 20 nov 2026 op elke keuzehulp met de chat (Henkjan: "Ja verhoog verkeer zodat we veel data krijgen"), ook gezondheid, chirurgie en
// zorgverzekering (Henkjan: "Dat is geen probleem gewoon wel doen ... Alles is anoniem . JUIST belangrijk ."). Iedereen heeft een bijnaam;
// telefoonnummers, mailadressen en links gaan er altijd uit. Elke pagina is een eigen kamer; actieve kamers staan in tafel:kamers.
export const tafelAan = (taal, slug) => /^(nl|us|de)$/.test(String(taal)) && /^[a-z0-9-]{2,100}$/.test(String(slug || ''));
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dag = () => new Date().toISOString().slice(0, 10);
const h8 = s => createHash('sha256').update('tafel|' + s).digest('hex').slice(0, 8);
const kort = (t, n) => String(t == null ? '' : t).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const kamerOk = k => { const m = /^(nl|us|de):([a-z0-9-]{2,100})$/.exec(String(k || '')); return !!m && tafelAan(m[1], m[2]); };
const P = k => ({ m: 'tafel:m:' + k, p: 'tafel:p:' + k, t: 'tafel:t:' + k, s: 'tafel:s:' + k, aw: 'tafel:aw:' + k, v: 'tafel:v:' + k, id: 'tafel:id:' + k });
const PLAFOND = 600; // AI-aanroepen per dag voor alle tafels samen

const T = {
  nl: { pill: n => n >= 2 ? 'Praat met de ' + n + ' anderen hier' : 'Praat met anderen hierover', titel: 'Live tafel', hier: 'hier', gast: 'Gastvrouw', heeft: 'heeft het', kiest: 'kiest nog', zelfde: 'hetzelfde',
    leeg: 'Laat je vraag achter. Ik antwoord meteen. Mensen die het al hebben zien je vraag ook en kunnen later antwoorden; iedereen is hier anoniem.', achter: 'Laat een vraag achter', cAanbod: 'Wil je het ook vragen aan iemand die het al heeft? Ik laat je vraag hier achter en mail je hun antwoord.', cJa: 'Ja, vraag het een eigenaar', cOk: 'Je vraag staat op deze pagina. Naar welk mailadres mag het antwoord?', dKop: 'Dit vroegen anderen hier', lees: 'Lees het antwoord', dank: n => 'Dank je. ' + n + ' krijgt je antwoord.', ikWeet: 'Ik heb het, ik antwoord', aan: n => 'Antwoord aan ' + n, echo: n => 'Vandaag stelden ' + n + ' mensen hier een vraag. Dit vroegen ze het vaakst:', ookIk: 'Dit wil ik ook weten', iemand: n => n > 1 ? n + ' mensen vroegen' : 'Iemand vroeg', pillV: n => 'Zie wat ' + n + ' anderen hier vroegen', ph: 'Stel je vraag', jij: 'Je heet', wijzig: 'wijzig',
    ikHeb: 'Ik heb het al', ikKies: 'Ik kies nog', dubbel: n => n + ' zei dit net al. Zal ik je bij hem of haar tellen?', telMe: 'Tel me erbij', toch: 'Toch plaatsen', toon: 'Zal ik het zo zetten?', gebruik: 'Ja, zo', zoals: 'Laat het zo',
    weg: 'Telefoonnummers, mailadressen en links laat ik weg; contact gaat via de chat.', volgVraag: 'Zal ik een echt mens zoeken die het al heeft? Dan mail ik je zodra die antwoordt.', mailPh: 'je@mail.nl', volgOk: 'Doe ik. Je krijgt alleen een mail als een echt mens antwoordt, en je kunt altijd stoppen.',
    antw: 'Niemand weet het nog. Dit weet ik uit onze pagina: ', voorstel: o => 'Jullie praten over ' + o + '. Zal ik daar een eigen tafel van maken?', maak: 'Nieuwe tafel', blijf: 'Hier blijven', alle: 'Alle', sluit: 'Sluiten', nieuw: n => n + ' nieuw sinds je vorige bezoek' },
  us: { pill: n => n >= 2 ? 'Talk with the ' + n + ' others here' : 'Talk with others about this', titel: 'Live table', hier: 'here', gast: 'Host', heeft: 'owns it', kiest: 'still choosing', zelfde: 'same',
    leeg: 'Leave your question. I answer right away. People who already own it see your question too and can answer later; everyone here is anonymous.', achter: 'Leave a question', cAanbod: 'Want to ask someone who already owns it too? I leave your question here and email you their answer.', cJa: 'Yes, ask an owner', cOk: 'Your question is on this page. Which email address should the answer go to?', dKop: 'What others asked here', lees: 'Read the answer', dank: n => 'Thanks. ' + n + ' gets your answer.', ikWeet: 'I own it, I will answer', aan: n => 'Reply to ' + n, echo: n => 'Today ' + n + ' people asked something here. This is what they asked most:', ookIk: 'I want to know this too', iemand: n => n > 1 ? n + ' people asked' : 'Someone asked', pillV: n => 'See what ' + n + ' others asked here', ph: 'Ask your question', jij: 'You are', wijzig: 'change',
    ikHeb: 'I own it', ikKies: 'Still choosing', dubbel: n => n + ' just said this. Shall I count you in?', telMe: 'Count me in', toch: 'Post anyway', toon: 'Shall I put it like this?', gebruik: 'Yes, like this', zoals: 'Keep mine',
    weg: 'I leave out phone numbers, email addresses and links; contact goes through the chat.', volgVraag: 'Shall I find a real person who already owns it? I will email you as soon as they answer.', mailPh: 'you@mail.com', volgOk: 'Will do. You only get an email when a real person answers, and you can stop any time.',
    antw: 'Nobody knows yet. This is what our page says: ', voorstel: o => 'You are talking about ' + o + '. Shall I give that its own table?', maak: 'New table', blijf: 'Stay here', alle: 'All', sluit: 'Close', nieuw: n => n + ' new since your last visit' },
  de: { pill: n => n >= 2 ? 'Mit den ' + n + ' anderen hier reden' : 'Mit anderen darüber reden', titel: 'Live-Tisch', hier: 'hier', gast: 'Gastgeberin', heeft: 'hat es', kiest: 'wählt noch', zelfde: 'dasselbe',
    leeg: 'Hinterlass deine Frage. Ich antworte sofort. Leute, die es schon haben, sehen deine Frage auch und können später antworten; hier sind alle anonym.', achter: 'Frage hinterlassen', cAanbod: 'Willst du auch jemanden fragen, der es schon hat? Ich lasse deine Frage hier und maile dir die Antwort.', cJa: 'Ja, frag einen Besitzer', cOk: 'Deine Frage steht auf dieser Seite. An welche Mailadresse soll die Antwort gehen?', dKop: 'Das fragten andere hier', lees: 'Antwort lesen', dank: n => 'Danke. ' + n + ' bekommt deine Antwort.', ikWeet: 'Hab ich, ich antworte', aan: n => 'Antwort an ' + n, echo: n => 'Heute haben ' + n + ' Leute hier etwas gefragt. Das fragten sie am häufigsten:', ookIk: 'Das will ich auch wissen', iemand: n => n > 1 ? n + ' Leute fragten' : 'Jemand fragte', pillV: n => 'Sieh, was ' + n + ' andere hier fragten', ph: 'Stell deine Frage', jij: 'Du heißt', wijzig: 'ändern',
    ikHeb: 'Ich habe es schon', ikKies: 'Ich wähle noch', dubbel: n => n + ' hat das gerade gesagt. Soll ich dich dazuzählen?', telMe: 'Zähl mich dazu', toch: 'Trotzdem senden', toon: 'Soll ich es so schreiben?', gebruik: 'Ja, so', zoals: 'Lass es so',
    weg: 'Telefonnummern, Mailadressen und Links lasse ich weg; Kontakt läuft über den Chat.', volgVraag: 'Soll ich einen echten Menschen suchen, der es schon hat? Ich maile dir, sobald er antwortet.', mailPh: 'du@mail.de', volgOk: 'Mache ich. Du bekommst nur eine Mail, wenn ein echter Mensch antwortet, und kannst jederzeit aufhören.',
    antw: 'Das weiß noch niemand. Das sagt unsere Seite: ', voorstel: o => 'Ihr redet über ' + o + '. Soll ich dafür einen eigenen Tisch aufmachen?', maak: 'Neuer Tisch', blijf: 'Hier bleiben', alle: 'Alle', sluit: 'Schließen', nieuw: n => n + ' neu seit deinem letzten Besuch' },
};
const TAALNAAM = { nl: 'Dutch', us: 'English', de: 'German' };

// Telefoonnummers, mailadressen en links gaan er altijd uit, ook als de AI niet bereikbaar is
export function schoon(t) {
  let weg = false;
  const s = kort(t, 500).replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, () => { weg = true; return '…'; }).replace(/\b(?:https?:\/\/|www\.)\S+/gi, () => { weg = true; return '…'; })
    .replace(/(?:\+|00)?\d[\d\s().-]{7,}\d/g, m => (m.replace(/\D/g, '').length >= 8 ? (weg = true, '…') : m));
  return { s, weg };
}
const nickVan = (pid, n) => kort(n, 24).replace(/[<>]/g, '') || 'Gast ' + (parseInt(String(pid).slice(0, 4), 16) % 9000 + 1000);
async function aiMag() { const k = 'tafel:ai:' + dag(); const n = N(await kv.raw(['INCR', k]).catch(() => PLAFOND + 1)); if (n === 1) await kv.raw(['EXPIRE', k, '172800']).catch(() => null); return n <= PLAFOND; }
async function lees(k, n = 120) { const r = await kv.raw(['LRANGE', P(k).m, '0', String(n - 1)]).catch(() => []); return (r || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean).reverse(); }
async function plaats(k, m) { const id = N(await kv.raw(['INCR', P(k).id])); m.id = id; m.t = Date.now(); await kv.raw(['LPUSH', P(k).m, JSON.stringify(m)]); await kv.raw(['LTRIM', P(k).m, '0', '399']); return m; }
const tafels = async k => { const t = await kv.get(P(k).t).catch(() => null); return Array.isArray(t) && t.length ? t : [{ id: 'a', naam: '' }]; };
const json = s => { try { const m = String(s).match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch (e) { return null; } };

// Gastvrouw: een vraag die 60 seconden open blijft, beantwoordt zij uit de pagina (zelfde kennis als de chat)
async function openVraag(k, ms, oidc) {
  const laatste = ms.filter(m => !m.gast).slice(-1)[0]; if (!laatste || !/\?\s*$/.test(laatste.tekst) || Date.now() - laatste.t < 60000 || Date.now() - laatste.t > 3600000) return null;
  if (ms.some(m => m.id > laatste.id)) return null;
  const lk = await kv.raw(['SET', 'tafel:lk:' + k + ':' + laatste.id, '1', 'NX', 'EX', '3600']).catch(() => null); if (lk !== 'OK' || !(await aiMag())) return null;
  const [taal, slug] = k.split(':'); let a = '';
  try { const { kzChat } = await import('./kzchat.js'); const r = await kzChat({ site: taal, slug, vraag: laatste.tekst, ip: 'tafel', sid: 'tafel', oidc }); a = r && r.ok && r.weet !== false ? kort(r.a, 600) : ''; } catch (e) {}
  if (!a) return null;
  return plaats(k, { gast: true, tafel: laatste.tafel || 'a', tekst: T[taal].antw + a, op: laatste.id });
}
// Nooit een lege tafel (20 nov 2026, Henkjan: "Dit moet dus niet kunnen", nadat in 24 uur niemand aan tafel praatte en 3 mensen een lege tafel openden):
// zolang er weinig aan tafel gezegd is, toont de tafel wat anderen vandaag in de chat van deze pagina vroegen (anoniem, zonder nummers, mail of links),
// gegroepeerd en geteld. Tik = de vraag gaat naar de tafel en de gastvrouw antwoordt meteen; zo bouwt elke bezoeker de tafel op voor de volgende.
const STAART = /\s*(Was empfiehlst du\?|What do you recommend\?|Wat raad je aan\?).*$/i;
const onzin = v => !/\?/.test(v) && v.split(/\s+/).length < 5; // los woord of losse pill-keuze ("Über 1.200 Euro") zegt zonder vraag niets
async function chatEcho(k) {
  const [taal, slug] = k.split(':'), vandaag = Date.parse(dag() + 'T00:00:00Z'), sinds = Date.now() - 7 * 864e5;
  const log = ((await kv.raw(['LRANGE', 'kz:chat:log', '0', '1999']).catch(() => [])) || []).map(x => { try { return typeof x === 'string' ? JSON.parse(x) : x; } catch (e) { return null; } })
    .filter(r => r && r.site === taal && r.s === slug && r.b !== 'reken' && N(r.t) >= sinds);
  const groep = {}; let mensen = new Set();
  for (const r of log) {
    const v = schoon(String(r.v || '').replace(STAART, '')).s.slice(0, 160); if (v.length < 4 || onzin(v) || r.weet === false) continue;
    if (N(r.t) >= vandaag) mensen.add(r.w || r.t);
    const key = v.toLowerCase(); const g = (groep[key] = groep[key] || { v, n: 0, t: 0, a: '' }); g.n++; if (N(r.t) >= g.t && r.a) { g.a = schoon(String(r.a)).s; if (g.a.length >= 195) g.a = g.a.replace(/\s+\S*$/, '') + '…'; } g.t = Math.max(g.t, N(r.t));
  }
  const vragen = Object.values(groep).sort((a, b) => b.n - a.n || b.t - a.t).slice(0, 5).map(x => ({ v: x.v, n: x.n, ...(x.a ? { a: x.a } : {}) }));
  return { vandaag: mensen.size, vragen };
}
// Gastvrouw antwoordt meteen als er niemand anders aan tafel is (wachten op een ander heeft geen zin)
async function meteen(k, m, hierAnders, oidc) {
  if (hierAnders > 0 || !(await aiMag())) return null;
  const [taal, slug] = k.split(':'); let a = '';
  try { const { kzChat } = await import('./kzchat.js'); const r = await kzChat({ site: taal, slug, vraag: m.tekst, ip: 'tafel', sid: 'tafel', oidc }); a = r && r.ok && r.weet !== false ? kort(r.a, 600) : ''; } catch (e) {}
  if (!a) return null;
  await kv.raw(['SET', 'tafel:lk:' + k + ':' + m.id, '1', 'NX', 'EX', '3600']).catch(() => null);
  return plaats(k, { gast: true, tafel: m.tafel || 'a', tekst: a, op: m.id });
}
// Samenvatting voor wie binnenkomt: opnieuw na elke 10 nieuwe berichten
async function samenvatting(k, ms, oidc) {
  const s = await kv.get(P(k).s).catch(() => null), mens = ms.filter(m => !m.gast), top = ms.length ? ms[ms.length - 1].id : 0;
  if (mens.length < 3) return null;
  if (s && s.txt && top - N(s.n) < 10) return s.txt;
  const lk = await kv.raw(['SET', 'tafel:slk:' + k, '1', 'NX', 'EX', '120']).catch(() => null); if (lk !== 'OK' || !(await aiMag())) return (s && s.txt) || null;
  const taal = k.split(':')[0];
  try {
    const r = await berichten({ fn: 'tafel-samen', model: HAIKU, max: 220, timeout: 15000, directKey: process.env.ANTHROPIC_API_KEY, oidc,
      system: 'You are the host of a live table on a buying-guide site. Write in ' + TAALNAAM[taal] + ', 2 or 3 short sentences, plain words, no dashes: how many people talked, what it is about, and what the group concluded, with counts ("41 of 52 say"). Mention disagreement if any. No names, no nicknames. No advice beyond what people said.',
      user: mens.slice(-60).map(m => (m.rol === 'heeft' ? '[owns it] ' : '') + m.tekst + (m.plus ? ' (+' + m.plus + ' same)' : '')).join('\n') });
    const txt = kort(r.txt, 500); if (txt) { await kv.set(P(k).s, { txt, n: top }).catch(() => {}); return txt; }
  } catch (e) {}
  return (s && s.txt) || null;
}

export async function binnen(b, oidc) {
  const k = String(b.k || ''); if (!kamerOk(k)) return { ok: false, fout: 'kamer' };
  const pid = /^[0-9a-f]{12}$/.test(String(b.pid || '')) ? b.pid : ''; const nu = Date.now();
  if (pid) { await kv.raw(['ZADD', P(k).aw, String(nu), pid]).catch(() => null); await kv.raw(['EXPIRE', P(k).aw, '86400']).catch(() => null); }
  await kv.raw(['ZREMRANGEBYSCORE', P(k).aw, '0', String(nu - 90000)]).catch(() => null);
  const hier = N(await kv.raw(['ZCARD', P(k).aw]).catch(() => 0));
  if (b.alleen === 'lijst') { // variant d: vragen van anderen onder de chat, open vragen aan tafel eerst
    const ms0 = await lees(k, 200), beantwoord = new Set(ms0.filter(m => !m.gast && m.op).map(m => m.op)), eigen0 = pid ? h8(pid) : '';
    const open = ms0.filter(m => !m.gast && /\?\s*$/.test(m.tekst) && !beantwoord.has(m.id) && m.wie !== eigen0 && Date.now() - N(m.t) < 14 * 864e5).slice(-5).reverse().map(m => ({ id: m.id, nick: m.nick, tekst: m.tekst }));
    return { ok: true, open, echo: await chatEcho(k).catch(() => null) };
  }
  if (b.alleen === 'tel') { const e = await chatEcho(k).catch(() => null); return { ok: true, hier, vragen: e ? e.vandaag : 0 }; }
  await kv.raw(['SADD', 'tafel:kamers', k]).catch(() => null);
  let ms = await lees(k);
  const extra = await openVraag(k, ms, oidc).catch(() => null); if (extra) ms = ms.concat([extra]);
  const [pl, tf, samen] = await Promise.all([kv.raw(['HGETALL', P(k).p]).catch(() => []), tafels(k), samenvatting(k, ms, oidc).catch(() => null)]);
  const weinig = ms.filter(m => !m.gast && Date.now() - N(m.t) < 7 * 864e5).length < 3, echo = weinig && !N(b.sinds) ? await chatEcho(k).catch(() => null) : null;
  const plus = {}; if (Array.isArray(pl)) for (let i = 0; i + 1 < pl.length; i += 2) plus[pl[i]] = N(pl[i + 1]); else if (pl) Object.assign(plus, pl);
  const sinds = N(b.sinds), eigen = pid ? h8(pid) : '';
  const uit = ms.filter(m => m.id > sinds).slice(-80).map(m => ({ id: m.id, t: m.t, gast: !!m.gast, nick: m.nick || '', rol: m.rol || '', tekst: m.tekst, tafel: m.tafel || 'a', plus: plus[m.id] || 0, mijn: !!eigen && m.wie === eigen, actie: m.actie || null, ...(m.opNick ? { opNick: m.opNick } : {}) }));
  return { ok: true, hier, tafels: tf, samen: samen || '', berichten: uit, plus, top: ms.length ? ms[ms.length - 1].id : 0, ...(echo && echo.vragen.length ? { echo } : {}) };
}

// Asynchroon (20 nov 2026, Henkjan: "Laat een vraag achter . Gewoon asynchroon maken . met mensen praten moeten ze wel gecontact kunnen worden .
// Zullen we een echt mens zoeken zodat je kunt vragen"): wie een vraag achterlaat krijgt meteen het antwoord van de gastvrouw en kan een mailadres
// achterlaten; antwoordt later een echt mens (knop Ik heb het, ik antwoord: veld op), dan gaat er een mail naar de vraagsteller. Elke mail staat in
// tafel:uit; versturen alleen als kv tafel:zend aan staat (Henkjans woord). Afmelden: ?tool=tafel&op=stop&k=<kamer>&w=<wie>.
const HOST = { nl: 'keuzehulp.best', us: 'whichtobuy.best', de: 'kaufberater.best' };
const MAIL = {
  nl: { ond: o => 'Een echt antwoord op je vraag over ' + o, kop: 'Je vroeg:', ant: n => n + ' heeft het al en antwoordde:', lees: 'Lees verder of reageer', stop: 'Geen mails meer over deze vraag', waarom: 'Je krijgt deze mail omdat je op de keuzehulp vroeg om een seintje als een echt mens antwoordt.' },
  us: { ond: o => 'A real answer to your question about ' + o, kop: 'You asked:', ant: n => n + ' already owns it and answered:', lees: 'Read more or reply', stop: 'No more emails about this question', waarom: 'You get this email because you asked the guide to let you know when a real person answers.' },
  de: { ond: o => 'Eine echte Antwort auf deine Frage zu ' + o, kop: 'Du hast gefragt:', ant: n => n + ' hat es schon und antwortet:', lees: 'Weiterlesen oder antworten', stop: 'Keine Mails mehr zu dieser Frage', waarom: 'Du bekommst diese Mail, weil du im Ratgeber um eine Nachricht gebeten hast, sobald ein echter Mensch antwortet.' },
};
const escH = x => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export async function mailTekst(k, vraag, antwoord, nick, wie) {
  const [taal, slug] = k.split(':'), t = MAIL[taal] || MAIL.nl; let pag = null;
  try { pag = JSON.parse((await kv.raw(['HGET', 'kz:on:naam:' + taal, slug]).catch(() => null)) || 'null'); } catch (e) {}
  const pad = pag && pag.p ? pag.p : '/' + slug, onderwerp = kort(pag && pag.n ? pag.n.split(':')[0] : slug.split('-').filter(x => !/\d/.test(x)).slice(0, 2).join(' '), 50);
  const link = 'https://' + HOST[taal] + pad + '?tafel=open', stop = 'https://' + HOST[taal] + '/api/keuze-tools?tool=tafel&op=stop&k=' + encodeURIComponent(k) + '&w=' + wie;
  const text = t.kop + '\n"' + vraag + '"\n\n' + t.ant(nick) + '\n"' + antwoord + '"\n\n' + t.lees + ': ' + link + '\n\n' + t.waarom + '\n' + t.stop + ': ' + stop;
  const html = '<div style="font:16px/1.6 Inter,Arial,sans-serif;color:#111113;max-width:560px"><p>' + t.kop + '<br><b>' + escH(vraag) + '</b></p><p>' + escH(t.ant(nick)) + '<br>' + escH(antwoord) + '</p><p><a href="' + link + '" style="color:#111113;font-weight:700">' + t.lees + '</a></p><p style="font-size:13px">' + t.waarom + ' <a href="' + stop + '" style="color:#111113">' + t.stop + '</a>.</p></div>';
  return { subject: t.ond(onderwerp), text, html };
}
async function meldAntwoord(k, vraag, m) {
  const v = await kv.raw(['HGET', P(k).v, vraag.wie]).catch(() => null); let vo = null; try { vo = JSON.parse(v || 'null'); } catch (e) {}
  if (!vo || !vo.mail || vo.uit) return false;
  const mt = await mailTekst(k, vraag.tekst, m.tekst, m.nick, vraag.wie);
  await kv.raw(['LPUSH', 'tafel:uit', JSON.stringify({ t: Date.now(), k, wie: vraag.wie, vraag: vraag.id, antwoord: m.id, onderwerp: mt.subject })]).catch(() => null); await kv.raw(['LTRIM', 'tafel:uit', '0', '499']).catch(() => null);
  await kv.raw(['HINCRBY', 'tafel:d:' + dag(), k + ':mens', '1']).catch(() => null);
  if (!(await kv.get('tafel:zend').catch(() => null))) return 'klaar'; // versturen alleen op Henkjans woord
  try { const { mail } = await import('./keuze-updates.js'); await mail({ to: vo.mail, subject: mt.subject, text: mt.text, html: mt.html }, 'tafel-' + k + '-' + m.id); return 'verstuurd'; } catch (e) { return 'fout'; }
}
export async function stop(q) {
  const k = String(q.k || ''), w = String(q.w || ''); if (!kamerOk(k) || !/^[0-9a-f]{8}$/.test(w)) return false;
  const v = await kv.raw(['HGET', P(k).v, w]).catch(() => null); let vo = null; try { vo = JSON.parse(v || 'null'); } catch (e) {}
  if (vo) await kv.raw(['HSET', P(k).v, w, JSON.stringify({ uit: true, t: Date.now() })]).catch(() => null); return true;
}
export async function zeg(b, oidc) {
  const k = String(b.k || ''); if (!kamerOk(k)) return { ok: false, fout: 'kamer' };
  const pid = String(b.pid || ''); if (!/^[0-9a-f]{12}$/.test(pid)) return { ok: false, fout: 'pid' };
  const taal = k.split(':')[0], t = T[taal], wie = h8(pid);
  const rl = 'tafel:rl:' + wie + ':' + Math.floor(Date.now() / 60000); const n = N(await kv.raw(['INCR', rl]).catch(() => 0)); await kv.raw(['EXPIRE', rl, '120']).catch(() => null); if (n > 6) return { ok: false, fout: 'te snel' };
  if (b.plus) { // "hetzelfde": één keer per persoon per bericht
    const id = String(N(b.plus)); const nieuw = N(await kv.raw(['SADD', 'tafel:pp:' + k + ':' + id, wie]).catch(() => 0));
    if (nieuw) { await kv.raw(['HINCRBY', P(k).p, id, '1']).catch(() => null); await kv.raw(['EXPIRE', 'tafel:pp:' + k + ':' + id, String(90 * 86400)]).catch(() => null); }
    return { ok: true, plus: true };
  }
  const sc = schoon(b.tekst); if (sc.s.length < 2) return { ok: false, fout: 'leeg' };
  const tafel = /^[a-z0-9]{1,8}$/.test(String(b.tafel || '')) ? b.tafel : 'a';
  const ms = await lees(k, 40); let mod = null;
  if (!b.force && await aiMag()) {
    try {
      const r = await berichten({ fn: 'tafel-mod', model: HAIKU, max: 260, timeout: 12000, directKey: process.env.ANTHROPIC_API_KEY, oidc,
        system: 'You moderate a live table where people discuss one product choice. Reply with JSON only: {"dubbel": id or null, "toon": "ok" or "scherp", "zacht": "", "onderwerp": "", "koppel": null or {"id": id, "zin": ""}}. ' +
          'dubbel: the id of a recent message that says the same thing (agreement like "me too", "same here", or the same claim or question); null if the new message adds anything. ' +
          'toon: "scherp" only if rude or insulting; then zacht is a calmer version in the same language. ' +
          'onderwerp: 1 to 4 words in ' + TAALNAAM[taal] + ' naming the topic only if it clearly differs from the main topic of the table, else "". ' +
          'koppel: if the new message asks something and an earlier person (not the same author) clearly has the same setup or the answer, give that message id and one short sentence in ' + TAALNAAM[taal] + ' introducing them by nickname, warm and plain, no dashes. Otherwise null.',
        user: 'Recent messages:\n' + ms.filter(m => !m.gast).slice(-25).map(m => m.id + ' | ' + (m.nick || '') + (m.rol === 'heeft' ? ' [owns it]' : '') + ' | ' + m.tekst).join('\n') + '\n\nNew message by ' + nickVan(pid, b.nick) + ':\n' + sc.s });
      mod = json(r.txt);
    } catch (e) { mod = null; }
  }
  if (mod && !b.force) {
    const doel = mod.dubbel != null && ms.find(m => String(m.id) === String(mod.dubbel) && !m.gast && m.wie !== wie);
    if (doel) return { ok: true, vraag: 'dubbel', doel: { id: doel.id, nick: doel.nick, tekst: doel.tekst }, zin: t.dubbel(doel.nick) };
    if (mod.toon === 'scherp' && mod.zacht) return { ok: true, vraag: 'toon', zacht: schoon(mod.zacht).s, zin: t.toon };
  }
  const tekst = b.force && b.zacht ? schoon(b.zacht).s : sc.s;
  const opId = N(b.op), vraag = opId ? (await lees(k, 400)).find(x => x.id === opId && !x.gast && x.wie !== wie) : null;
  const m = await plaats(k, { wie, nick: nickVan(pid, b.nick), rol: b.rol === 'heeft' ? 'heeft' : b.rol === 'kiest' ? 'kiest' : '', tekst, tafel, o: kort(mod && mod.onderwerp, 40), ...(vraag ? { op: vraag.id, opNick: vraag.nick } : {}) });
  if (vraag) await meldAntwoord(k, vraag, m).catch(() => null);
  await kv.raw(['SADD', 'tafel:kamers', k]).catch(() => null);
  const erbij = [];
  { const nu = Date.now(); await kv.raw(['ZREMRANGEBYSCORE', P(k).aw, '0', String(nu - 90000)]).catch(() => null); const ander = ((await kv.raw(['ZRANGE', P(k).aw, '0', '-1']).catch(() => [])) || []).filter(x => h8(x) !== wie).length; const g = vraag || b.stil ? null : await meteen(k, m, ander, oidc).catch(() => null); if (g) erbij.push(g); }
  if (mod && mod.koppel && mod.koppel.zin && ms.some(x => String(x.id) === String(mod.koppel.id) && x.wie !== wie)) erbij.push(await plaats(k, { gast: true, tafel, tekst: kort(schoon(mod.koppel.zin).s, 300) }));
  if (m.o) { // eigen tafel voorstellen: drie berichten van twee mensen over hetzelfde andere onderwerp
    const zelfde = ms.concat([m]).slice(-20).filter(x => !x.gast && x.o && x.o.toLowerCase() === m.o.toLowerCase() && (x.tafel || 'a') === tafel);
    const tf = await tafels(k);
    if (zelfde.length >= 3 && new Set(zelfde.map(x => x.wie)).size >= 2 && !tf.some(x => x.naam.toLowerCase() === m.o.toLowerCase())) {
      const vs = await kv.raw(['SET', 'tafel:vs:' + k + ':' + h8(m.o.toLowerCase()), '1', 'NX', 'EX', String(7 * 86400)]).catch(() => null);
      if (vs === 'OK') erbij.push(await plaats(k, { gast: true, tafel, tekst: t.voorstel(m.o), actie: { maak: m.o } }));
    }
  }
  await kv.raw(['HINCRBY', 'tafel:d:' + dag(), k + ':zeg', '1']).catch(() => null); await kv.raw(['EXPIRE', 'tafel:d:' + dag(), String(90 * 86400)]).catch(() => null);
  return { ok: true, geplaatst: true, id: m.id, weg: sc.weg, zin: sc.weg ? t.weg : '', erbij: erbij.length };
}

export async function maak(b) {
  const k = String(b.k || ''); if (!kamerOk(k)) return { ok: false };
  const naam = kort(schoon(b.naam).s, 40); if (naam.length < 2) return { ok: false };
  const tf = await tafels(k); let x = tf.find(t => t.naam.toLowerCase() === naam.toLowerCase());
  if (!x) { x = { id: (Date.now() % 1679616).toString(36), naam }; tf.push(x); await kv.set(P(k).t, tf.slice(0, 8)).catch(() => {}); }
  return { ok: true, tafels: tf, id: x.id };
}
export async function volg(b) {
  const k = String(b.k || ''), pid = String(b.pid || ''), mail = kort(b.mail, 120).toLowerCase();
  if (!kamerOk(k) || !/^[0-9a-f]{12}$/.test(pid) || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(mail)) return { ok: false };
  await kv.raw(['HSET', P(k).v, h8(pid), JSON.stringify({ mail, t: Date.now(), na: N(b.na) })]).catch(() => null);
  await kv.raw(['HINCRBY', 'tafel:d:' + dag(), k + ':volg', '1']).catch(() => null);
  return { ok: true };
}
export async function stand() {
  const kamers = ((await kv.raw(['SMEMBERS', 'tafel:kamers']).catch(() => [])) || []).filter(kamerOk).slice(0, 200);
  const uit = { ok: true, kamers_open: kamers.length, zend: !!(await kv.get('tafel:zend').catch(() => null)), kamers: {} };
  for (const k of kamers) { const ms = await lees(k, 400); const x = { berichten: ms.filter(m => !m.gast).length, gastvrouw: ms.filter(m => m.gast).length, mensen: new Set(ms.filter(m => !m.gast).map(m => m.wie)).size, volgers: N(await kv.raw(['HLEN', P(k).v]).catch(() => 0)), nu: N(await kv.raw(['ZCOUNT', P(k).aw, String(Date.now() - 90000), '+inf']).catch(() => 0)) }; if (x.berichten || x.nu || x.volgers) uit.kamers[k] = x; }
  uit.ai_vandaag = N(await kv.get('tafel:ai:' + dag()).catch(() => 0));
  return uit;
}

// Wie er nu is, op elke pagina met de chat en op de voorkant (20 nov 2026, Henkjan: "Laat zien meest actief en mensen online ."):
// het script van het chatbewijs (lib/chatbewijs.js) en de voorkant (lib/cadeauvinder.js LIVE_JS) melden elke 60 s zolang de tab zichtbaar is.
// kz:on:<s> gesorteerde set pid|slug op tijd (10 min), kz:on:naam:<s> slug -> {n: kop van de pagina, p: pad}. Alles anoniem (pid is een willekeurig nummer in de browser).
const SITE = s => (['nl', 'us', 'de'].includes(s) ? s : '');
export async function hier(b) {
  const s = SITE(b.s), pid = String(b.pid || ''), slug = String(b.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90), p = kort(b.p, 140);
  if (!s || !/^[0-9a-f]{12}$/.test(pid) || !slug) return { ok: false };
  const nu = Date.now(), k = 'kz:on:' + s;
  await kv.raw(['ZADD', k, String(nu), pid + '|' + slug]).catch(() => null); await kv.raw(['ZREMRANGEBYSCORE', k, '0', String(nu - 600000)]).catch(() => null); await kv.raw(['EXPIRE', k, '3600']).catch(() => null);
  const n = kort(String(b.n || '').replace(/[<>]/g, ''), 70);
  if (slug !== 'home' && n && /^\/(?!\/)[\w\/.-]*$/.test(p)) { await kv.raw(['HSET', 'kz:on:naam:' + s, slug, JSON.stringify({ n, p })]).catch(() => null); await kv.raw(['EXPIRE', 'kz:on:naam:' + s, String(30 * 86400)]).catch(() => null); }
  return { ok: true };
}
const hpaar = r => { const o = {}; if (Array.isArray(r)) { for (let i = 0; i + 1 < r.length; i += 2) o[r[i]] = r[i + 1]; } else if (r) Object.assign(o, r); return o; };
export async function actief(sIn) {
  const s = SITE(sIn) || 'nl', nu = Date.now(), d = dag();
  const leden = (await kv.raw(['ZRANGEBYSCORE', 'kz:on:' + s, String(nu - 130000), '+inf']).catch(() => [])) || [];
  const pids = new Set(), per = {};
  for (const m of leden) { const [pid, slug] = String(m).split('|'); if (!pid || !slug) continue; pids.add(pid); if (slug !== 'home') (per[slug] = per[slug] || new Set()).add(pid); }
  const vr = hpaar(await kv.raw(['HGETALL', 'kz:chat:pagd:' + s + ':' + d]).catch(() => null)), tf = hpaar(await kv.raw(['HGETALL', 'tafel:d:' + d]).catch(() => null));
  const slugs = new Set([...Object.keys(per), ...Object.keys(vr)].filter(Boolean));
  const rij = [...slugs].map(slug => ({ slug, online: per[slug] ? per[slug].size : 0, vragen: N(vr[slug]), tafel: N(tf[s + ':' + slug + ':zeg']) })).map(x => ({ ...x, w: x.online * 5 + x.vragen + x.tafel * 3 })).sort((a, b) => b.w - a.w).slice(0, 25);
  const nm = rij.length ? await kv.raw(['HMGET', 'kz:on:naam:' + s, ...rij.map(x => x.slug)]).catch(() => []) : [];
  const lijst = rij.map((x, i) => { let j = null; try { j = JSON.parse((nm || [])[i] || 'null'); } catch (e) {} return j && j.n && j.p ? { n: j.n, p: j.p, online: x.online, vragen: x.vragen, tafel: x.tafel } : null; }).filter(Boolean).slice(0, 5);
  return { ok: true, online: pids.size, lijst };
}

// Dialogen voor het halfuurrapport aan Henkjan (alleen via de beschermde vercel.app-host): tafelberichten en chatvragen met antwoord
export async function dialoog(min) {
  const sinds = Date.now() - Math.min(1440, Math.max(5, N(min) || 30)) * 60000;
  const kamers = ((await kv.raw(['SMEMBERS', 'tafel:kamers']).catch(() => [])) || []).filter(kamerOk).slice(0, 200), tafel = {};
  for (const k of kamers) { const ms = (await lees(k, 120)).filter(m => m.t >= sinds); if (ms.length) tafel[k] = ms.map(m => ({ t: new Date(m.t).toISOString().slice(11, 16), wie: m.gast ? 'gastvrouw' : (m.nick || '') + (m.rol ? ' [' + m.rol + ']' : ''), tekst: m.tekst })); }
  const log = ((await kv.raw(['LRANGE', 'kz:chat:log', '0', '599']).catch(() => [])) || []).map(x => { try { return typeof x === 'string' ? JSON.parse(x) : x; } catch (e) { return null; } }).filter(r => r && N(r.t) >= sinds && r.b !== 'reken');
  const gesprek = {}; for (const r of log.reverse()) { const g = (r.w || 'x' + r.t) + '|' + r.site + '|' + r.s; (gesprek[g] = gesprek[g] || []).push({ t: new Date(r.t).toISOString().slice(11, 16), v: r.v, a: r.a || '', weet: !!r.weet, c: r.c ? 1 : 0 }); }
  const chats = Object.entries(gesprek).map(([g, rs]) => { const [, site, slug] = g.split('|'); return { site, slug, beurten: rs.length, rs }; }).sort((a, b) => b.beurten - a.beurten);
  let door = null; try { door = await (await import('./kzchat.js')).doorStand(dag()); } catch (e) {}
  return { ok: true, sinds: new Date(sinds).toISOString(), tafel, chats_totaal: chats.length, vragen_totaal: log.length, door, chats: chats.slice(0, 40) };
}

// Leesbare weergave van de dialogen voor Henkjan (20 nov 2026: "Ik wil verloop van die dialogen zien ."), alleen op de beschermde host
export function dialoogHtml(x, min) {
  const e = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const land = { nl: 'NL', us: 'VS', de: 'DE' }, staart = /\s*(Was empfiehlst du\?|What do you recommend\?|Wat raad je aan\?).*$/i;
  const door = (x.door || []).map(d => '<li><b>' + e(d.pagina.replace(/^(\w+):/, (m, l) => (land[l] || l) + ' ')) + '</b>: ' + d.door + ' van ' + d.toon + ' antwoorden kregen een vervolgvraag (' + d.pct + '%)</li>').join('');
  const chats = (x.chats || []).slice().sort((a, b) => (b.rs[b.rs.length - 1] || {}).t > (a.rs[a.rs.length - 1] || {}).t ? 1 : -1).map(c => '<section><h2>' + e(land[c.site] || c.site) + ' · ' + e(c.slug.slice(0, 60)) + ' · ' + c.beurten + (c.beurten === 1 ? ' beurt' : ' beurten') + '</h2>' +
    c.rs.map(r => '<div class="v"><small>' + e(r.t) + ' bezoeker' + (r.c ? ' (knop)' : '') + '</small>' + e(String(r.v).replace(staart, '')) + '</div>' + (r.a ? '<div class="a"><small>chat' + (r.weet ? '' : ', wist het niet') + '</small>' + e(r.a) + '</div>' : '')).join('') + '</section>').join('');
  const tafel = Object.entries(x.tafel || {}).map(([k, ms]) => '<section><h2>Tafel ' + e(k) + '</h2>' + ms.map(m => '<div class="' + (m.wie === 'gastvrouw' ? 'a' : 'v') + '"><small>' + e(m.t + ' ' + m.wie) + '</small>' + e(m.tekst) + '</div>').join('') + '</section>').join('');
  return '<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="60"><title>Dialogen</title><style>body{margin:0;background:#fff;color:#111113;font:16px/1.5 Inter,-apple-system,Segoe UI,Arial,sans-serif}main{max-width:720px;margin:0 auto;padding:20px}h1{font-size:24px;margin:0 0 4px}h2{font-size:16px;margin:0 0 10px}p,li{font-size:16px}section{border:1px solid #D7DCE8;border-radius:16px;padding:14px;margin:12px 0}.v,.a{border-radius:14px;padding:9px 12px;margin:6px 0;max-width:88%}.v{background:#111113;color:#fff;margin-left:auto}.a{border:1px solid #111113}small{display:block;font-size:13px;font-weight:700;margin-bottom:2px}nav a{color:#111113;font-weight:700;margin-right:14px}</style><main><h1>Dialogen</h1><p>Laatste ' + Math.round(min / 60) + ' uur (UTC): ' + x.chats_totaal + ' gesprekken, ' + x.vragen_totaal + ' vragen. Ververst elke minuut.</p><nav><a href="?tool=tafel&op=dialoog&vorm=html&min=60">1 uur</a><a href="?tool=tafel&op=dialoog&vorm=html&min=360">6 uur</a><a href="?tool=tafel&op=dialoog&vorm=html&min=1440">24 uur</a></nav>' + (door ? '<h2 style="margin-top:16px">Doorpraten vandaag</h2><ul>' + door + '</ul>' : '') + tafel + chats + '</main></html>';
}

// ---------- in de browser ----------
const CSS = '.tf-rij{margin:0 0 10px}.tf-pill{font:inherit;font-size:15px;font-weight:700;line-height:1.35;cursor:pointer;background:#fff;color:#111113;border:1px solid #111113;border-radius:999px;padding:8px 14px;min-height:40px}.tf-pill i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#0F7B4A;margin-right:7px;vertical-align:middle}'
  + '.tf-bg{position:fixed;inset:0;background:rgba(17,17,19,.35);z-index:2147483000}.tf{position:fixed;z-index:2147483001;background:#fff;color:#111113;font:400 16px/1.5 Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;display:flex;flex-direction:column;border:1px solid #D7DCE8;box-shadow:0 10px 40px rgba(17,17,19,.18)}'
  + '@media(max-width:700px){.tf{left:0;right:0;bottom:0;height:88vh;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)}}@media(min-width:701px){.tf{right:24px;bottom:24px;width:420px;height:min(680px,86vh);border-radius:20px}}'
  + '.tf-kop{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #D7DCE8}.tf-kop b{flex:1;font-size:16px}.tf-kop span{font-size:13px}.tf-kop i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#0F7B4A;margin-right:6px}.tf-x{background:#fff;border:1px solid #D7DCE8;border-radius:999px;width:34px;height:34px;font-size:18px;cursor:pointer;color:#111113}'
  + '.tf-tf{display:flex;gap:6px;overflow-x:auto;padding:8px 16px 0}.tf-tf button,.tf-k button{font:inherit;font-size:14px;background:#fff;color:#111113;border:1px solid #D7DCE8;border-radius:999px;padding:6px 12px;cursor:pointer;white-space:nowrap}.tf-tf button[aria-pressed=true]{border-color:#111113;font-weight:700}'
  + '.tf-l{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px}.tf-g{border:1px solid #111113;border-radius:16px 16px 16px 4px;padding:10px 13px;font-size:15px}.tf-g small{display:block;font-size:12px;font-weight:700;margin-bottom:2px}'
  + '.tf-m{border-top:1px solid #D7DCE8;padding:8px 0;font-size:15px}.tf-m.mijn{border:0;background:#111113;color:#fff;border-radius:16px;padding:9px 13px;align-self:flex-end;max-width:85%}.tf-w{display:flex;gap:8px;align-items:baseline;font-size:13px}.tf-w b{font-size:14px}.tf-t{border:1px solid #D7DCE8;border-radius:999px;padding:0 7px;font-size:12px}.tf-t.ok{border-color:#0F7B4A;color:#0F7B4A}'
  + '.tf-p{font:inherit;font-size:13px;font-weight:600;background:none;border:0;padding:2px 0;cursor:pointer;color:#111113;text-decoration:underline}.tf-k{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.tf-k button.z{background:#111113;color:#fff;border-color:#111113;font-weight:700}'
  + '.tf-v{border-top:1px solid #D7DCE8;padding:10px 16px 12px}.tf-r{display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px;flex-wrap:wrap}.tf-r input{font:inherit;font-size:13px;border:1px solid #D7DCE8;border-radius:999px;padding:3px 10px;width:120px}.tf-r button{font:inherit;font-size:13px;background:#fff;border:1px solid #D7DCE8;border-radius:999px;padding:3px 10px;cursor:pointer;color:#111113}.tf-r button[aria-pressed=true]{border-color:#111113;font-weight:700}'
  + '.tf-f{display:flex;gap:8px;border:1px solid #D7DCE8;border-radius:999px;padding:6px 6px 6px 14px}.tf-f input{flex:1;border:0;outline:0;font:inherit;font-size:16px;background:transparent;color:#111113;min-width:0}.tf-f button{width:36px;height:36px;border-radius:50%;border:0;background:#111113;color:#fff;font-size:16px;cursor:pointer}'
  + '.tf-d{margin:4px 0 24px;border-top:1px solid #D7DCE8}.tf-d h3{font-size:16px!important;font-weight:700;margin:14px 0 2px!important}.tf-an{font-size:15px;margin:6px 0 0;padding:8px 12px;border:1px solid #D7DCE8;border-radius:12px}'
  + '.tf-mail{display:flex;gap:6px;margin-top:6px}.tf-mail input{flex:1;font:inherit;font-size:15px;border:1px solid #D7DCE8;border-radius:10px;padding:8px 10px;min-width:0}';
function tafelClient(C) {
  var d = document, kx = d.getElementById('kx'); if (!kx || navigator.webdriver || !/keuzehulp|whichtobuy|kaufberater|vercel\.app|localhost/.test(location.hostname)) return;
  var W = { tik: 1, pill: 2, vraag: 4, open: 3, plus: 5, zeg: 10, intentie: 30, contact: 45, terug: 20 }, K = 'tafel1', st = null, A = '/api/keuze-tools?tool=tafel&op=';
  try { st = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) {}
  if (!st || st.r !== C.r || !st.d || Date.now() - Date.parse(st.d) > 6 * 864e5) st = null;
  var me = null; try { me = JSON.parse(localStorage.getItem('tafelme') || 'null'); } catch (e) {}
  if (!me || !me.pid) { me = { pid: Array.from(crypto.getRandomValues(new Uint8Array(6))).map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''), nick: '', rol: '', sinds: 0, dag: '' }; }
  function bewaar() { try { localStorage.setItem('tafelme', JSON.stringify(me)); } catch (e) {} }
  function stuur(e) { if (!st || !W[e]) return; var j = JSON.stringify({ site: C.s, pid: st.pid, d: st.d, r: st.r, e: e }); try { navigator.sendBeacon('/api/mm/proefev', new Blob([j], { type: 'text/plain' })); } catch (x) {} }
  var vorige = window.__kxEv; window.__kxEv = function (e) { try { vorige && vorige(e); } catch (x) {} if (e === 'vraag' || e === 'intentie' || e === 'contact' || e === 'pill' || e === 'tik') stuur(e); };
  function post(op, b) { return fetch(A + op, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(function (r) { return r.json(); }); }
  function el(t, c, x) { var e = d.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function start(v) {
    var forceer = (location.search.match(/[?&]tafel=([abcd])/) || [])[1]; if (forceer) v = forceer;
    if (st && !st.zien) { st.zien = 1; try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) {} var j = JSON.stringify({ site: C.s, pid: st.pid, d: st.d, r: st.r, e: 'zie', c: /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'i' : /Android/.test(navigator.userAgent) ? 'a' : 'd', v: { tafel: v } }); try { navigator.sendBeacon('/api/mm/proefev', new Blob([j], { type: 'text/plain' })); } catch (e) {} }
    if (v === 'c') return varC(); if (v === 'd') return varD(); if (v !== 'b') return;
    var vandaag = new Date().toISOString().slice(0, 10); if (me.dag && me.dag !== vandaag) stuur('terug'); me.dag = me.dag || vandaag; bewaar();
    // eigen rij boven de pills van de chat (niet in .kx-ps: daar maakt de chat van elke tik een vraag)
    var rijT = el('div', 'tf-rij'), ps = kx.querySelector('.kx-ps'), kh = kx.querySelector('.kx-h'); if (ps && ps.previousElementSibling && /kx-s/.test(ps.previousElementSibling.className)) ps = ps.previousElementSibling; ps ? ps.before(rijT) : kh ? kh.after(rijT) : kx.prepend(rijT);
    var pill = el('button', 'tf-pill'); pill.type = 'button'; pill.innerHTML = '<i></i>'; var pt = el('span', '', C.T.achter); pill.appendChild(pt); rijT.appendChild(pill);
    function tel() { post('binnen', { k: C.k, pid: me.pid, alleen: 'tel' }).then(function (j) { if (!j || !j.ok) return; var a = Math.max(0, j.hier - 1); pt.textContent = a >= 1 ? C.T.pill(a) : C.T.achter; }).catch(function () {}); }
    tel(); setInterval(function () { if (!open) tel(); }, 30000);
    var antwoordOp = null, open = false, bg, p, lijst, tfBar, kopN, inp, rij, huidig = 'a', top = 0, gezien = {}, plusLokaal = {}, vroegVolg = false, laatstEigen = 0, nieuwStart = me.sinds || 0, tim;
    function sluit() { open = false; clearInterval(tim); bg && bg.remove(); p && p.remove(); }
    function gastBlok(txt, knoppen) { var g = el('div', 'tf-g'); g.appendChild(el('small', '', C.T.gast)); g.appendChild(d.createTextNode(txt)); if (knoppen) { var k = el('div', 'tf-k'); knoppen.forEach(function (x, i) { var b = el('button', i === 0 ? 'z' : '', x[0]); b.type = 'button'; b.onclick = function () { k.remove(); x[1](); }; k.appendChild(b); }); g.appendChild(k); } lijst.appendChild(g); lijst.scrollTop = lijst.scrollHeight; return g; }
    function bericht(m) {
      if (gezien[m.id]) { var pb = d.querySelector('[data-tfp="' + m.id + '"]'); if (pb && m.plus) pb.textContent = m.plus + ' ' + C.T.zelfde; return; } gezien[m.id] = 1;
      if ((m.tafel || 'a') !== huidig && !m.gast) return;
      if (m.gast) { var acts = m.actie && m.actie.maak ? [[C.T.maak, function () { post('maak', { k: C.k, naam: m.actie.maak }).then(function (j) { if (j && j.ok) { tafelsZet(j.tafels); kies(j.id); } }); }], [C.T.blijf, function () {}]] : null; gastBlok(m.tekst, acts); return; }
      var b = el('div', 'tf-m' + (m.mijn ? ' mijn' : '')); var w = el('div', 'tf-w'); w.appendChild(el('b', '', m.nick)); if (m.rol) { w.appendChild(el('span', 'tf-t' + (m.rol === 'heeft' ? ' ok' : ''), m.rol === 'heeft' ? C.T.heeft : C.T.kiest)); }
      if (m.opNick) w.appendChild(el('span', 'tf-t', C.T.aan(m.opNick))); if (!m.mijn) b.appendChild(w); else if (m.opNick) b.appendChild(el('small', '', C.T.aan(m.opNick))); b.appendChild(el('div', '', m.tekst));
      if (!m.mijn && /\?\s*$/.test(m.tekst)) { var aw = el('button', 'tf-p', C.T.ikWeet); aw.type = 'button'; aw.style.marginRight = '14px'; aw.onclick = function () { antwoordOp = { id: m.id, nick: m.nick }; me.rol = 'heeft'; bewaar(); inp.placeholder = C.T.aan(m.nick); try { inp.focus(); } catch (e) {} }; b.appendChild(aw); }
      if (!m.mijn) { var pl = el('button', 'tf-p', m.plus ? m.plus + ' ' + C.T.zelfde : '+ ' + C.T.zelfde); pl.type = 'button'; pl.setAttribute('data-tfp', m.id); pl.onclick = function () { if (plusLokaal[m.id]) return; plusLokaal[m.id] = 1; pl.textContent = ((m.plus || 0) + 1) + ' ' + C.T.zelfde; post('zeg', { k: C.k, pid: me.pid, plus: m.id }); stuur('plus'); }; b.appendChild(pl); }
      if (m.id > nieuwStart && nieuwStart && !m.mijn && !b.dataset.n) b.dataset.n = 1;
      lijst.appendChild(b);
    }
    var tafelLijst = [];
    function tafelsZet(tf) { tafelLijst = tf || tafelLijst; tfBar.innerHTML = ''; if (tafelLijst.length < 2) { tfBar.hidden = true; return; } tfBar.hidden = false; tafelLijst.forEach(function (t) { var b = el('button', '', t.naam || C.T.alle); b.type = 'button'; b.setAttribute('aria-pressed', String(t.id === huidig)); b.onclick = function () { kies(t.id); }; tfBar.appendChild(b); }); }
    function kies(id) { huidig = id; gezien = {}; lijst.innerHTML = ''; top = 0; tafelsZet(); haal(true); }
    var samenGezet = false;
    function haal(eerst) {
      post('binnen', { k: C.k, pid: me.pid, sinds: top }).then(function (j) {
        if (!j || !j.ok) return; kopN.textContent = j.hier + ' ' + C.T.hier; if (j.tafels) tafelsZet(j.tafels);
        if (eerst && !samenGezet) { samenGezet = true; var nieuw = nieuwStart ? j.berichten.filter(function (m) { return m.id > nieuwStart && !m.mijn; }).length : 0; gastBlok((j.samen || C.T.leeg) + (nieuw ? ' ' + C.T.nieuw(nieuw) + '.' : '')); if (j.echo) echoBlok(j.echo); }
        j.berichten.forEach(function (m) { if (j.plus && j.plus[m.id]) m.plus = j.plus[m.id]; bericht(m); }); if (j.berichten.length) { top = Math.max(top, j.top || 0); me.sinds = top; bewaar(); lijst.scrollTop = lijst.scrollHeight; }
      }).catch(function () {});
    }
    function echoBlok(e) {
      gastBlok(C.T.echo(Math.max(e.vandaag, 1)));
      e.vragen.forEach(function (q) { var b = el('div', 'tf-m'); var w = el('div', 'tf-w'); w.appendChild(el('b', '', C.T.iemand(q.n))); b.appendChild(w); b.appendChild(el('div', '', q.v));
        var k = el('button', 'tf-p', C.T.ookIk); k.type = 'button'; k.onclick = function () { k.remove(); stuur('plus'); verstuur(q.v, { force: 1 }); }; b.appendChild(k); lijst.appendChild(b); });
      lijst.scrollTop = lijst.scrollHeight;
    }
    function verstuur(tekst, extra) {
      var b = { k: C.k, pid: me.pid, nick: me.nick, rol: me.rol, tekst: tekst, tafel: huidig }; if (antwoordOp && !extra.force) { b.op = antwoordOp.id; antwoordOp = null; inp.placeholder = C.T.ph; } for (var x in extra) b[x] = extra[x];
      post('zeg', b).then(function (j) {
        if (!j || !j.ok) return;
        if (j.vraag === 'dubbel') { gastBlok(j.zin + ' "' + j.doel.tekst + '"', [[C.T.telMe, function () { post('zeg', { k: C.k, pid: me.pid, plus: j.doel.id }); stuur('plus'); }], [C.T.toch, function () { verstuur(tekst, { force: 1 }); }]]); return; }
        if (j.vraag === 'toon') { gastBlok(j.zin + ' "' + j.zacht + '"', [[C.T.gebruik, function () { verstuur(tekst, { force: 1, zacht: j.zacht }); }], [C.T.zoals, function () { verstuur(tekst, { force: 1 }); }]]); return; }
        if (j.geplaatst) { stuur('zeg'); laatstEigen = j.id; if (j.zin) gastBlok(j.zin); haal(); if (!vroegVolg) { vroegVolg = true; setTimeout(volgVraag, 900); } }
      }).catch(function () {});
    }
    function volgVraag() {
      var g = gastBlok(C.T.volgVraag); var f = el('form', 'tf-mail'); var m = el('input'); m.type = 'email'; m.placeholder = C.T.mailPh; m.required = true; var b = el('button', '', '↑'); b.type = 'submit'; b.className = 'tf-x'; f.appendChild(m); f.appendChild(b); g.appendChild(f);
      f.onsubmit = function (e) { e.preventDefault(); post('volg', { k: C.k, pid: me.pid, mail: m.value, na: laatstEigen }).then(function (j) { if (j && j.ok) { f.remove(); g.appendChild(d.createTextNode(' ' + C.T.volgOk)); stuur('contact'); } }); };
    }
    function opent() {
      if (open) return; open = true; stuur('open');
      bg = el('div', 'tf-bg'); bg.onclick = sluit; p = el('div', 'tf'); p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', C.T.titel);
      var kop = el('div', 'tf-kop'); kop.appendChild(el('b', '', C.titel)); var sp = el('span'); sp.innerHTML = '<i></i>'; kopN = el('span', '', ''); sp.appendChild(kopN); kop.appendChild(sp); var x = el('button', 'tf-x', '×'); x.type = 'button'; x.setAttribute('aria-label', C.T.sluit); x.onclick = sluit; kop.appendChild(x);
      tfBar = el('div', 'tf-tf'); tfBar.hidden = true; lijst = el('div', 'tf-l'); lijst.setAttribute('aria-live', 'polite');
      var v = el('div', 'tf-v'); rij = el('div', 'tf-r'); var nl = el('span', '', C.T.jij); var ni = el('input'); ni.value = me.nick || ('Gast ' + (parseInt(me.pid.slice(0, 4), 16) % 9000 + 1000)); ni.maxLength = 24; ni.setAttribute('aria-label', C.T.jij); ni.onchange = function () { me.nick = ni.value.trim().slice(0, 24); bewaar(); };
      me.nick = me.nick || ni.value; bewaar(); rij.appendChild(nl); rij.appendChild(ni);
      [['heeft', C.T.ikHeb], ['kiest', C.T.ikKies]].forEach(function (r) { var b = el('button', '', r[1]); b.type = 'button'; b.setAttribute('aria-pressed', String(me.rol === r[0])); b.onclick = function () { me.rol = me.rol === r[0] ? '' : r[0]; bewaar(); [].forEach.call(rij.querySelectorAll('button'), function (z) { z.setAttribute('aria-pressed', 'false'); }); if (me.rol) b.setAttribute('aria-pressed', 'true'); }; rij.appendChild(b); });
      var f = el('form', 'tf-f'); inp = el('input'); inp.placeholder = C.T.ph; inp.maxLength = 500; inp.setAttribute('aria-label', C.T.ph); var sb = el('button', '', '↑'); sb.type = 'submit'; sb.setAttribute('aria-label', C.T.ph); f.appendChild(inp); f.appendChild(sb);
      f.onsubmit = function (e) { e.preventDefault(); var t = inp.value.trim(); if (t.length < 2) return; inp.value = ''; verstuur(t, {}); };
      v.appendChild(rij); v.appendChild(f); p.appendChild(kop); p.appendChild(tfBar); p.appendChild(lijst); p.appendChild(v); d.body.appendChild(bg); d.body.appendChild(p);
      haal(true); tim = setInterval(haal, 4000); setTimeout(function () { try { inp.focus(); } catch (e) {} }, 200);
    }
    pill.onclick = function (e) { e.stopPropagation(); e.preventDefault(); opent(); }; if (/[?&]tafel=open/.test(location.search)) setTimeout(opent, 400); d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) sluit(); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mailVorm(X, na) { var f = el('form', 'kx-f'); var m = el('input'); m.type = 'email'; m.required = true; m.placeholder = C.T.mailPh; m.setAttribute('autocomplete', 'email'); var b = el('button', '', '↑'); b.type = 'submit'; f.appendChild(m); f.appendChild(b); f.onsubmit = function (e) { e.preventDefault(); post('volg', { k: C.k, pid: me.pid, mail: m.value, na: na }).then(function (j) { if (j && j.ok) { f.remove(); X.bubbel('kx-ant', esc(C.T.volgOk)); stuur('contact'); } }); }; return f; }
  // c: geen knop vooraf; na het eerste nuttige chatantwoord het aanbod de vraag aan eigenaars te stellen (asynchroon, antwoord per mail)
  function varC() {
    var X = window.__kx; if (!X) return setTimeout(varC, 500); var al = 0, vorige = window.__kxNa;
    window.__kxNa = function (node, j) {
      try { vorige && vorige(node, j); } catch (x) {} if (al || !j || j.weet === false) return;
      var ik = [].slice.call(d.querySelectorAll('#kxa .kx-ik')).pop(), q = ik ? ik.textContent.trim() : ''; if (q.length < 4) return; al = 1;
      setTimeout(function () { var b = X.bubbel('kx-ant', esc(C.T.cAanbod)), p = el('div', 'kx-cp'); stuur('tik');
        p.appendChild(X.knop(C.T.cJa, function () { p.remove(); X.bubbel('kx-ik', esc(C.T.cJa)); post('zeg', { k: C.k, pid: me.pid, nick: me.nick || ('Gast ' + (parseInt(me.pid.slice(0, 4), 16) % 9000 + 1000)), tekst: /\?\s*$/.test(q) ? q : q + '?', force: 1, stil: 1 }).then(function (r) { if (!r || !r.ok) return; stuur('zeg'); var a = X.bubbel('kx-ant', esc(C.T.cOk)); a.appendChild(mailVorm(X, r.id)); }).catch(function () {}); }));
        b.appendChild(p); }, 1200);
    };
  }
  // d: onder de chat wat anderen hier vroegen, met het antwoord; open vragen aan tafel eerst, eigenaars kunnen antwoorden
  function varD() {
    post('binnen', { k: C.k, pid: me.pid, alleen: 'lijst' }).then(function (j) {
      if (!j || !j.ok) return; var items = (j.open || []).map(function (m) { return { q: m.tekst, n: 1, id: m.id, nick: m.nick }; }).concat(((j.echo && j.echo.vragen) || []).map(function (x) { return { q: x.v, n: x.n, a: x.a }; })).slice(0, 5); if (!items.length) return;
      var box = el('section', 'tf-d'); box.appendChild(el('h3', '', C.T.dKop));
      items.forEach(function (it) {
        var b = el('div', 'tf-m'), w = el('div', 'tf-w'); w.appendChild(el('b', '', it.id ? it.nick : C.T.iemand(it.n))); b.appendChild(w); b.appendChild(el('div', '', it.q));
        if (it.a) { var l = el('button', 'tf-p', C.T.lees); l.type = 'button'; l.style.marginRight = '14px'; l.onclick = function () { l.remove(); b.appendChild(el('div', 'tf-an', it.a)); stuur('open'); }; b.appendChild(l); }
        else if (window.__kx) { var o = el('button', 'tf-p', C.T.ookIk); o.type = 'button'; o.style.marginRight = '14px'; o.onclick = function () { o.remove(); stuur('plus'); window.__kx.vraag(it.q); try { kx.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} }; b.appendChild(o); }
        if (it.id) { var k2 = el('button', 'tf-p', C.T.ikWeet); k2.type = 'button'; k2.onclick = function () { k2.remove(); var f = el('form', 'tf-mail'), i = el('input'); i.placeholder = C.T.aan(it.nick); i.maxLength = 500; var s2 = el('button', 'tf-x', '↑'); s2.type = 'submit'; f.appendChild(i); f.appendChild(s2); b.appendChild(f); try { i.focus(); } catch (e) {}
          f.onsubmit = function (e) { e.preventDefault(); var t = i.value.trim(); if (t.length < 2) return; post('zeg', { k: C.k, pid: me.pid, nick: me.nick || ('Gast ' + (parseInt(me.pid.slice(0, 4), 16) % 9000 + 1000)), rol: 'heeft', tekst: t, op: it.id, force: 1, stil: 1 }).then(function (r) { if (r && r.ok) { f.remove(); b.appendChild(el('div', 'tf-an', C.T.dank(it.nick))); stuur('zeg'); } }); }; }; b.appendChild(k2); }
        box.appendChild(b);
      });
      kx.after(box);
    }).catch(function () {});
  }
  if (st && st.v) return start(st.v.tafel);
  var c = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'i' : /Android/.test(navigator.userAgent) ? 'a' : 'd';
  fetch('/api/mm/proefkies?site=' + C.s + '&c=' + c, { credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (j) {
    if (j && j.ok && j.aan && j.pid && j.v) { st = { pid: j.pid, d: j.d, r: j.r, v: j.v }; try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) {} start(j.v.tafel); } else start((location.search.match(/[?&]tafel=([abcd])/) || [])[1] || 'a');
  }).catch(function () { start('a'); });
}
export function tafelJs(taal, slug, term) {
  const t = T[taal] || T.nl, k = taal + ':' + slug;
  const C = { k, s: 'tafel' + taal, r: 2, titel: kort(term, 60) || t.titel, T: Object.fromEntries(Object.entries(t).map(([a, v]) => [a, typeof v === 'function' ? '@@' + v.toString() + '@@' : v])) };
  const cfg = JSON.stringify(C).replace(/"@@(.*?)@@"/g, (m, f) => JSON.parse('"' + f + '"')).replace(/</g, '\\u003c');
  return '<style>' + CSS + '</style><script>(' + tafelClient.toString() + ')(' + cfg + ');</script>';
}
