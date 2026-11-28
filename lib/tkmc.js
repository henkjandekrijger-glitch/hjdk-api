// Mailmind-stroom tk-mailchimp (motor: lib/mailmind.js). Oude Mailchimp-lijst van Tania Kross opnieuw vragen (Henkjan 25 nov 2026: "vind lijst van mailchimp in mijn email en stuur per dag een aantal met
// vraag of ze nog op lijst willen blijven lang niets gehoord van Tania zorg wel dat de mail super is . En fokking lerend dus iedere 20 wordt ie beter .
// Je kan in mijn inbox replies laten landen of vanaf mij Laten sturen . Wat slimste is.").
//
// Waarom zo:
// - Bron: de export members_export_839147311c.zip die Henkjan op 9 nov 2020 aan zichzelf mailde (lijst "Tania Kross", account Adsfair BV). De import
//   leest hem zelf uit zijn Gmail via Zernio (bijlage downloaden, zip uitpakken), alleen subscribed_members, MEMBER_RATING 3 tot 5 (13.724 van 19.197).
//   Adressen staan alleen in de database (Mailmind-bakken mlm:tk-mailchimp:b:<bak>, verstuurd in mlm:a), nooit in code.
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
// Bakken (welke adressen het best scoren): Mailchimp-score | soort adres (gratis, provider, eigen, algemeen) | jaar van aanmelden.
// Motor, poort, leren, post lezen en stand: lib/mailmind.js (/api/post?op=mailmind&s=tk-mailchimp). Deze module: varianten, mail, ja-gevolg, import, pagina's.
// Uit tot Henkjans woord: LIVE hieronder én /api/post?op=mailmind&s=tk-mailchimp&zet=1&aan=1 op de beschermde host.
import { inflateRawSync } from 'node:zlib';
import { kv } from './db.js';
import * as M from './mailmind.js';


export const LIVE = true; // Henkjan 25 nov 2026 13:49 UTC: "Verstuur en zorg voor updates hier en in dashboard ."
const SITE = 'https://taniakross.media';
const N = M.N, MAILRE = M.MAILRE;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- de mail ----------
// Velden: {aanhef} "Hoi Marieke," of "Hoi,", {jaar} jaar van aanmelden, {laatste} laatste podcastgast, {drie} volgende gasten, {ja} {stop} de links.
// Alles wat erin staat komt van taniakross.media (podcastblok via /api/lijst?a=stand) of uit de export (voornaam, jaar).
const ONDER = '\n\nHenkjan de Krijger\nIk produceerde jarenlang de voorstellingen van Tania en doe nu haar site.\nAntwoorden op deze mail kan gewoon, of bel of app 06 55395630.';
// 25 nov 2026 (Henkjan: "Wil je nog mail van Tania kross vind ik geen goed onderwerp" en "Jij kiest en leert beste onderwerp"): nieuwe onderwerpen;
// Mailmind leert op ja plus kliks (lib/mailmind.js succes).
export const VARIANTEN = [
  { o: 'Tania Kross in gesprek met {laatste}', t: '{aanhef}\n\nJe meldde je in {jaar} aan voor de mail van Tania Kross. Daarna is het lang stil geweest. Dat ligt aan ons.\n\nTania heeft nu een eigen podcast, A Kross …{podcast}\n\nWil je op de lijst blijven? Eén klik:\n{ja}\n\nLiever niet? Dan haal ik je eraf:\n{stop}\n\nDoe je niets, dan mailen we je niet meer.' + ONDER },
  { o: 'Barcelona van Tania Kross en Tommie Christiaan', t: '{aanhef}\n\nJe meldde je in {jaar} aan voor de mail van Tania Kross. Daarna is het lang stil geweest. Dat ligt aan ons.\n\nZeg je ja, dan krijg je meteen Barcelona in je mail, het duet van Tania en Tommie Christiaan. Daarna hoor je het als er een nieuwe aflevering is van haar podcast A Kross ….{kijk}\n\nJa, ik blijf op de lijst:\n{ja}\n\nLiever niet? Dan haal ik je eraf:\n{stop}\n\nDoe je niets, dan mailen we je niet meer.' + ONDER, gift: 'g1' },
  { o: 'Lang niets van Tania Kross gehoord', t: '{aanhef}\n\nJe staat sinds {jaar} op de lijst van Tania Kross, maar je hebt lang niets van ons gehoord. Voor we je weer mailen, vraag ik het eerst.\n\nTania heeft nu een eigen podcast, A Kross …{podcast}\n\nBlijf je op de lijst?\n{ja}\n\nNee, haal me eraf:\n{stop}' + ONDER },
  { o: 'Tania Kross heeft nu een eigen podcast', t: '{aanhef}\n\nTania Kross heeft nu een eigen podcast, A Kross …{podcast}\n\nJe meldde je in {jaar} aan voor haar mail. Daarna is het lang stil geweest. Wil je het weer horen als er een nieuwe aflevering is?\n\nJa, houd me op de hoogte:\n{ja}\n\nNee, haal me eraf:\n{stop}\n\nDoe je niets, dan mailen we je niet meer.' + ONDER },
  { o: 'Nieuw van Tania Kross: haar podcast A Kross …', t: '{aanhef}\n\nKorte vraag. Je meldde je in {jaar} aan voor de mail van Tania Kross. Wil je die nog krijgen? Er is nu een podcast, A Kross …, en Tania mailt alleen als er echt iets is.{kijk}\n\nJa:\n{ja}\n\nNee:\n{stop}' + ONDER },
  { o: 'Van Tania Kross: Barcelona en haar podcast', t: '{aanhef}\n\nJe meldde je in {jaar} aan voor de mail van Tania Kross. We ruimen de lijst op en mailen alleen nog wie dat wil.\n\nZeg je ja, dan krijg je meteen Barcelona in je mail, het duet van Tania en Tommie Christiaan, en daarna elke nieuwe aflevering van haar podcast A Kross ….{kijk}\n\nJa, ik blijf:\n{ja}\n\nNee, haal me eraf:\n{stop}' + ONDER, gift: 'g1' }
];
async function podcast() { // live van taniakross.media, zodat de mail altijd de echte gasten noemt
  try { const j = await (await fetch(SITE + '/api/lijst?a=stand', { signal: AbortSignal.timeout(8000) })).json(); const p = j.podcast || {}; return { laatste: String(p.laatste || ''), drie: String(p.drie || '') }; } catch (e) { return {}; }
}
export function mailTekst(a, { v = VARIANTEN[0], tok = 'xxxx', ctx = {} } = {}) {
  // 25 nov 2026 (Henkjan: "Zet de link naar de site erin met francis podcast in beeld en laat ze ook zien dat ze welkom zijn met welkom terug"):
  // elke mail heeft een link naar de welkompagina op taniakross.media met de nieuwste aflevering in beeld ({kijk}, of binnen {podcast}).
  const pod = ctx || {}, L = SITE + '/blijf/' + tok + '?l=1';
  const zl = pod.laatste && pod.kijk;
  const pz = zl ? ` Kijk de nieuwste aflevering, met ${pod.laatste}:\n${L}${pod.drie ? `\n\nBinnenkort volgen ${pod.drie}.` : ''}` : pod.laatste ? ` De laatste aflevering is met ${pod.laatste}.${pod.drie ? ` Binnenkort volgen ${pod.drie}.` : ''}` : (pod.drie ? ` Binnenkort volgen ${pod.drie}.` : '');
  const kijk = zl ? `\n\nKijk alvast de nieuwste aflevering, met ${pod.laatste}:\n${L}` : '';
  const vn = voornaam(a);
  const aanhef = vn ? 'Hoi ' + vn + ',' : 'Hoi,';
  const t = (v.t + (/Henkjan de Krijger/.test(v.t) ? '' : ONDER)).replace('{aanhef}', aanhef).replace(/\{jaar\}/g, String(a.j || '2018')).replace('{podcast}', pz).replace('{kijk}', kijk).replace('{ja}', SITE + '/blijf/' + tok).replace('{stop}', SITE + '/stop/' + tok).replace(/\{voornaam\}/g, vn || '');
  return { onderwerp: v.o.replace('{laatste}', pod.laatste || '').replace(/ met $/, '').replace(/^Tania Kross in gesprek$/, 'Tania Kross heeft nu een eigen podcast').replace(/\{voornaam\}/g, vn || '').replace(/^,\s*/, ''), tekst: pod.ander ? metAnder(t) : t, stop: SITE + '/stop/' + tok, gift: v.gift || '' };
}
function voornaam(a) { const vn = String(a && a.n || '').trim().split(/\s+/)[0]; return vn && /^[A-Za-zÀ-ÿ'-]{2,20}$/.test(vn) ? vn.charAt(0).toUpperCase() + vn.slice(1).toLowerCase() : ''; }

// ---------- antwoorden op replies (Henkjan 28 nov 2026: "Beantwoord iedereen die echt reageert in mijn email met een kort bericht maak dat ook lerend
// zit veel informatie in", en bij een automatisch antwoord over herstel na een fietsongeval: "Hier moet dan iets vriendelijks heen") ----------
// De motor (lib/mailmind.js beantwoord) kiest: automatisch antwoord met een reden -> afwezigTekst (één keer); ander adres genoemd -> dat adres op de lijst
// en anderTekst; een vraag -> AI-antwoord uit kennis(); geen vraag (ja, groet, herinnering) -> bedankTekst. Stop -> eraf, geen mail.
const GROET = '\n\nHartelijke groet,\nHenkjan';
const aanhefVan = a => { const vn = voornaam(a); return vn ? 'Hoi ' + vn + ',' : 'Hoi,'; };
export function afwezigTekst(a, t) {
  const s = String(t || '').toLowerCase(); let wens = '';
  if (/herstel|ziek|ongeval|ongeluk|operatie|revalid|blessure|gebroken|ziekenhuis|beterschap/.test(s)) wens = 'Veel beterschap.';
  else if (/vakantie|holiday|vacation|op reis/.test(s)) wens = 'Fijne vakantie.';
  if (!wens) return null; // afwezig zonder reden: geen mail terug, dat is geen echte reactie
  return aanhefVan(a) + '\n\nDank voor je bericht. ' + wens + ' Geen haast met mijn mail over Tania, die loopt niet weg. Wil je op haar lijst blijven, dan kan dat wanneer het je uitkomt:\n' + SITE + '/blijf/' + a.tok + GROET;
}
export function bedankTekst(a, soort, gift) {
  if (a.ja || soort === 'ja') return aanhefVan(a) + '\n\nDank je wel! Je staat weer op de lijst van Tania.' + (gift ? ' Barcelona komt zo in je mail.' : ' Je krijgt zo een mail van haar lijst.') + GROET;
  return aanhefVan(a) + '\n\nDank je wel voor je bericht, leuk om te lezen. Wil je op de lijst van Tania blijven? Eén klik:\n' + SITE + '/blijf/' + a.tok + GROET;
}
export function anderTekst(a, nieuw, r) { if (!nieuw || (r && (r.fout || /^fout/.test(String(r.lijst || ''))))) return ''; return aanhefVan(a) + '\n\nDank je! Ik heb ' + nieuw + ' op de lijst van Tania gezet. Daar komt zo een mail van haar lijst.' + GROET; }
export async function kennis(a) {
  const p = await podcast().catch(() => ({}));
  return [
    'Afzender: Henkjan de Krijger. Hij produceerde jarenlang de voorstellingen van Tania Kross en doet nu haar site taniakross.media.',
    'De ontvanger meldde zich ooit aan voor de mail van Tania Kross (de oude Mailchimp-lijst). Deze mail vroeg of hij of zij op de lijst wil blijven.',
    'Op de lijst blijven: één klik op ' + SITE + '/blijf/' + a.tok + ' of "ja" terugmailen. Eraf: ' + SITE + '/stop/' + a.tok + '. Niets doen betekent: geen mail meer.',
    'Wie op de lijst staat krijgt een mail als er een nieuwe aflevering is van de podcast A Kross … van Tania (om de week een nieuw gesprek) en als er concerten of voorstellingen bekend zijn.',
    p.laatste ? 'Nieuwste aflevering: Tania met ' + p.laatste + ', te zien op ' + SITE + '/podcast.' : '',
    p.drie ? 'Binnenkort in de podcast: ' + p.drie + '.' : '',
    'Liever mail op een ander adres? Noem dat adres in je antwoord, dan zet Henkjan het op de lijst.',
    'Concerten en voorstellingen: ' + SITE + '/optredens. Tania boeken voor een optreden, als dagvoorzitter of voor een masterclass: via Dorien Scholtens van Theaterbureau de Mannen, zie ' + SITE + '/#boeken.',
  ].filter(Boolean).join('\n');
}
// De zin over een ander adres in de mail zelf (Henkjan 28 nov 2026: "moeten we mensen niet aanbieden ander adres op te geven uit de mailchimp database"):
// staat aan met kv tkmc:ander (op zijn ja: /api/post?op=tkmc&ander=1 op de beschermde host). Voorbeeld: ?op=tkmc&voorbeeld=1&ander=1.
export const ANDER_ZIN = 'Liever mail op een ander adres? Zet het in je antwoord, dan zet ik dat op de lijst.';
const metAnder = t => t.replace('\n\nHenkjan de Krijger\n', '\n\n' + ANDER_ZIN + '\n\nHenkjan de Krijger\n');

// ---------- de nieuwste aflevering, live van de site (6 uur bewaard) ----------
const slug = n => String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ont = x => String(x || '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&middot;/g, '·').replace(/<[^>]+>/g, '').trim();
export async function aflevering(vers) {
  const c = vers ? null : await kv.get('tkmc:afl').catch(() => null); if (c && c.a && Date.now() - N(c.t) < 6 * 3600000) return c.a;
  const p = await podcast(); if (!p.laatste) return null;
  const a = { naam: p.laatste, pad: '/podcast/' + slug(p.laatste), drie: p.drie || '' };
  try { const h = await (await fetch(SITE + a.pad, { signal: AbortSignal.timeout(8000) })).text(), g = re => ont((h.match(re) || [])[1]);
    Object.assign(a, { yt: g(/data-v="([A-Za-z0-9_-]{6,20})"/), sp: g(/href="(https:\/\/open\.spotify\.com\/episode\/[^"]+)"/), ap: g(/href="(https:\/\/podcasts\.apple\.com\/[^"]+)"/), lede: g(/<p class="lede">([\s\S]{10,400}?)<\/p>/), meta: g(/<p class="tk-meta">([\s\S]{5,160}?)<\/p>/) });
  } catch (e) {}
  await kv.set('tkmc:afl', { t: Date.now(), a }).catch(() => {}); return a;
}

// ---------- de stroom voor Mailmind ----------
export const STROOM = {
  id: 'tk-mailchimp', LIVE, kanaal: 'gmail', fromName: 'Henkjan de Krijger', wie: 'tk', taal: 'nl', soort: 'klant',
  doel: 'Oude lezer van Tania Kross zegt ja tegen haar mail', std: { perDag: 40, max: 180, perUur: 8 }, uren: [9, 21],
  stopIsAntwoord: true, // Henkjan 27 nov 2026 "akkoord": deze mail vraagt ja of stop, dus een stop remt het tempo niet (bounces wel); zie volumeBesluit in lib/mailmind.js

  varianten: VARIANTEN, context: async () => ({ ...(await podcast()), kijk: !!(await kv.get('tkmc:kijk').catch(() => null)), ander: !!(await kv.get('tkmc:ander').catch(() => null)) }), mail: (a, o) => mailTekst(a, o),
  // antwoordmotor (Henkjan 28 nov 2026, zie afwezigTekst hierboven); een echte vraag krijgt een AI-antwoord uit kennis(), met "AI-antwoord" erboven
  antwoord: true, anderAdres: true, jaUitAi: true, kennis: a => kennis(a), afwezig: (a, t) => afwezigTekst(a, t), anderBevestig: (a, nieuw, r) => anderTekst(a, nieuw, r),
  async bedank(a, soort) { const v = M.pool(STROOM, await M.regels('tk-mailchimp'))[N(String(a.v || 'o0').slice(1))] || {}; return bedankTekst(a, soort, v.gift); },
  dash: async () => { const j = await (await fetch(SITE + '/api/lijst?a=stand', { signal: AbortSignal.timeout(8000) })).json(); return { project: 'tk', nu: N(j.leden) }; }, // leden op de lijst van Tania naar het dashboard
  bak: a => 'r' + (a.r || 0) + '|' + M.soortAdres(a.m) + '|' + (a.j || 'x'),
  // voorkennis per bak: Mailchimp-score 5 verwacht 8% ja, 4 5%, 3 3% (gewicht 10 mails); daarna beslissen de echte cijfers
  // 25 nov eerste ronde: 3 van 7 mails gingen naar info@-achtige adressen (kleine bakken met weinig kans); algemene adressen krijgen daarom een derde van de verwachting
  voorkennis: b => { const r = N(String(b).slice(1, 2)); let p = r >= 5 ? 0.08 : r === 4 ? 0.05 : 0.03; if (/\|algemeen\|/.test(b)) p = p / 3; return [10 * p, 10 * (1 - p)]; },
  async bijJa(a) { // op Tania's lijst: daar volgt de gewone welkomstmail (bij een Barcelona-variant meteen Barcelona)
    const v = M.pool(STROOM, await M.regels('tk-mailchimp'))[N(String(a.v || 'o0').slice(1))] || {};
    const r = await fetch(SITE + '/api/lijst?a=aan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: a.m, v: v.gift || '', p: 'mailchimp-' + (a.v || 'o0'), lang: 'nl' }), signal: AbortSignal.timeout(15000) });
    const j = await r.json().catch(() => ({})); return { lijst: j.al ? 'stond er al' : r.ok ? 'erop' : 'fout ' + r.status };
  }
};

// ---------- import uit Henkjans Gmail (via Zernio) ----------
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
  if (await kv.get('tkmc:import').catch(() => null)) return { ok: false, fout: 'al geïmporteerd', import: await kv.get('tkmc:import').catch(() => null) };
  const acc = await M.zAccount(); if (!acc) return { ok: false, fout: 'geen mailbox in Zernio' };
  const s = await M.zApi('/email/messages?accountId=' + encodeURIComponent(acc) + '&limit=5&searchQueryNative=' + encodeURIComponent('subject:"Adressen Tania Kross" has:attachment'));
  const msg = M.lijstVan(s.j)[0]; if (!msg) return { ok: false, fout: 'mail met de export niet gevonden', status: s.status };
  let bij = msg.attachments; if (!bij || !bij.length) { const r = await M.zApi('/email/messages/' + encodeURIComponent(M.idVan(msg)) + '?accountId=' + encodeURIComponent(acc)); const x = r.j.message || r.j.data || r.j || {}; bij = x.attachments || []; }
  const z = (bij || []).find(b => /members_export.*\.zip$/i.test(String(b.filename || b.name || ''))); if (!z) return { ok: false, fout: 'zip niet in de mail' };
  const r = await M.zApi('/email/attachments/' + encodeURIComponent(z.id || z.attachmentId) + '?accountId=' + encodeURIComponent(acc) + '&messageId=' + encodeURIComponent(M.idVan(msg)), { raw: true });
  if (!r.ok) return { ok: false, fout: 'bijlage ' + r.status };
  const rows = csv(unzip(Buffer.from(await r.arrayBuffer()), /^subscribed_members/i)), sel = selecteer(rows), v = await M.vul('tk-mailchimp', sel);
  const info = { at: Date.now(), bestand: z.filename || z.name, inExport: rows.length, inRij: sel.length, bakken: v.bakken }; await kv.set('tkmc:import', info); return { ok: true, ...info };
}
// De eerste import (25 nov) zette de adressen in tkmc:rij; die gaan eenmalig naar de Mailmind-bakken.
async function naarBakken() {
  let n = 0; const bak = {};
  for (;;) { const l = ((await kv.raw(['LRANGE', 'tkmc:rij', '0', '999']).catch(() => [])) || []); if (!l.length) break;
    const r = await M.vul('tk-mailchimp', l.map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean)); for (const [b, k] of Object.entries(r.bakken)) bak[b] = N(bak[b]) + k; n += r.erbij;
    await kv.raw(['LTRIM', 'tkmc:rij', String(l.length), '-1']); }
  await kv.del(['tkmc:rij']); return { ok: true, verplaatst: n, bakken: bak };
}

// ---------- pagina's (op taniakross.media/blijf/<tok> en /stop/<tok>, doorgestuurd vanuit simpele-site) ----------
// Welkompagina in de stijl van taniakross.media (aubergine, goud, Bodoni Moda en Manrope), met de nieuwste aflevering van A Kross … in beeld.
//   /blijf/<tok>        de ja-link uit de mail: bevestigt met JavaScript (linkscanners doen niets) en zegt welkom terug.
//   /blijf/<tok>?l=1    de kijklink uit de mail: welkom terug, de aflevering, en een knop om op de lijst te blijven (pas ja na een tik).
//   /blijf/voorbeeld[?l=1]  hetzelfde met een voorbeeldnaam, zonder iets op te slaan (om te bekijken).
const STIJL = `:root{--paper:#2A1330;--deep:#1B0C20;--ink:#120814;--text:#F0E4D2;--dim:#CDB8C6;--gold:#E6A93F;--gold-hi:#F2BC5B;--mag:#E0528A;--line:rgba(240,228,210,.16)}
*{box-sizing:border-box}body{margin:0;background:var(--deep);color:var(--text);font:400 17px/1.6 Manrope,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}.kop{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--line)}
.mark{font:italic 400 26px/1 'Bodoni Moda',Georgia,serif;text-decoration:none}.kop nav a{font:500 13px/1 'IBM Plex Mono',monospace;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;margin-left:18px}
main{max-width:620px;margin:0 auto;padding:26px 20px 56px}.chy{display:flex;align-items:center;gap:10px;margin:0 0 12px;font:500 13px/1.3 'IBM Plex Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}
.chy:before{content:"";width:26px;height:2px;background:currentColor;flex:none}.chy.m{color:var(--mag)}
h1{font:400 42px/1.05 'Bodoni Moda',Georgia,serif;letter-spacing:-.01em;margin:0 0 12px}h1 em{color:var(--gold)}
.lede{color:var(--dim);font-size:18px;margin:0 0 18px}h2{font:400 26px/1.15 'Bodoni Moda',Georgia,serif;margin:16px 0 6px}h2 em{color:var(--gold);font-style:italic}
.afl p{margin:0 0 14px}.yt{display:block;position:relative;width:100%;padding:0;border:0;border-radius:14px;overflow:hidden;background:#000;cursor:pointer;aspect-ratio:16/9}
.yt img,.yt iframe{width:100%;height:100%;object-fit:cover;display:block;border:0}.yt .pl{position:absolute;left:50%;top:50%;width:72px;height:72px;margin:-36px 0 0 -36px;border-radius:50%;background:var(--gold)}
.yt .pl:after{content:"";position:absolute;left:29px;top:22px;border-style:solid;border-width:14px 0 14px 22px;border-color:transparent transparent transparent var(--ink)}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:0 24px;border-radius:999px;border:1px solid var(--gold);background:var(--gold);color:var(--ink);font:600 16px/1 Manrope,system-ui,sans-serif;text-decoration:none;cursor:pointer}
.btn.g{background:transparent;color:var(--text);border-color:rgba(240,228,210,.45)}.rij{display:flex;flex-wrap:wrap;gap:10px;margin:4px 0 14px}
.ja{margin:12px 0 18px;padding:20px;border:1px solid var(--line);border-radius:16px;background:var(--paper)}.ja .btn{width:100%}.ja p{margin:0 0 12px}
.ok{margin:0 0 22px;padding:14px 16px;border-left:3px solid var(--gold);background:var(--paper);border-radius:0 12px 12px 0}
.klein{font-size:16px;color:var(--dim)}footer{margin-top:30px;padding-top:18px;border-top:1px solid var(--line);font-size:16px;color:var(--dim)}`;
const PAG = (titel, inhoud) => `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(titel)}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400&family=Manrope:wght@400;600&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet"><link rel="icon" href="/favicon.ico?v=3"><style>${STIJL}</style></head><body><header class="kop"><a href="/" class="mark">Tania</a><nav><a href="/podcast">Podcast</a></nav></header><main>${inhoud}<footer>Vragen? Antwoord gewoon op de mail, of bel of app Henkjan: <a href="tel:+31655395630">06 55395630</a>.</footer></main></body></html>`;
function aflBlok(f, tussen = '') {
  if (!f) return tussen + `<p><a class="btn" href="${SITE}/podcast">Luister naar A Kross …</a></p>`;
  const beeld = f.yt ? `<button type="button" class="yt" data-v="${esc(f.yt)}" aria-label="Speel de aflevering met ${esc(f.naam)} af"><img src="https://i.ytimg.com/vi/${esc(f.yt)}/hqdefault.jpg" alt="Tania Kross in gesprek met ${esc(f.naam)}" width="480" height="360"><span class="pl" aria-hidden="true"></span></button>` : '';
  return `<section class="afl"><p class="chy m">${esc(f.meta ? f.meta.replace(/\s*·\s*\d{1,2} \w+ \d{4}/, '') : 'Nieuwste aflevering')}</p>${beeld}<h2><em>A Kross</em> ${esc(f.naam)}</h2>${tussen}${f.lede ? `<p>${esc(f.lede)}</p>` : ''}`
    + `<div class="rij">${f.sp ? `<a class="btn g" href="${esc(f.sp)}" target="_blank" rel="noopener">Spotify</a>` : ''}${f.ap ? `<a class="btn g" href="${esc(f.ap)}" target="_blank" rel="noopener">Apple Podcasts</a>` : ''}<a class="btn g" href="${SITE}${esc(f.pad)}">Meer over deze aflevering</a></div></section>`
    + `<script>document.querySelectorAll('.yt').forEach(function(b){b.addEventListener('click',function(){b.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+b.dataset.v+'?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="A Kross"></iframe>'})})</script>`;
}
function welkom({ a, f, kijk, gift }) {
  const vn = voornaam(a), naam = vn ? `, <em>${esc(vn)}</em>` : '', drie = f && f.drie ? `<p class="klein">Binnenkort in A Kross …: ${esc(f.drie)}.</p>` : '';
  const bev = gift ? 'Je staat weer op de lijst. Kijk zo in je mail: Tania stuurt je Barcelona, haar duet met Tommie Christiaan.' : 'Je staat weer op de lijst. Je hoort het als er een nieuwe aflevering is.';
  const ok = `<p class="ok">${bev}</p>`;
  const doe = `<script>function tkJa(){var k=document.getElementById('jk');if(k)k.disabled=true;fetch(location.pathname+location.search,{method:'POST'}).then(function(r){if(r.ok){document.getElementById('d').hidden=false;var f=document.getElementById('f');if(f)f.hidden=true}})}</script>`;
  if (kijk) { // kijklink: eerst welkom en de aflevering, ja pas na een tik
    const ja = a.ja ? ok : `<div id="f" class="ja"><p><b>Blijf je op de lijst?</b> Dan hoor je het bij elke nieuwe aflevering. Tania mailt alleen als er echt iets is.</p><form method="post" onsubmit="tkJa();return false"><button id="jk" class="btn" type="submit">Ja, houd me op de hoogte</button></form><p class="klein" style="margin:12px 0 0"><a href="${SITE}/stop/${esc(a.tok)}">Liever geen mail meer</a></p></div><div id="d" hidden>${ok}</div>${doe}`;
    return `<p class="chy">Fijn dat je er weer bent</p><h1>Welkom terug${naam}.</h1><p class="lede">Tania heeft nu een eigen podcast. Dit is de nieuwste aflevering.</p>${aflBlok(f, ja)}${drie}`;
  }
  // ja-link: bevestigt zelf met JavaScript; zonder JavaScript een knop
  const ja = a.ja ? ok : `<div id="f" class="ja"><p>Nog één tik en je staat weer op de lijst.</p><form method="post"><button id="jk" class="btn" type="submit">Ja, ik blijf</button></form></div><div id="d" hidden>${ok}</div>${doe}<script>tkJa()</script>`;
  return `<p class="chy">Fijn dat je er weer bent</p><h1>Welkom terug${naam}.</h1>${ja}<p class="lede">Luister alvast naar de nieuwste aflevering van A Kross …, de podcast van Tania.</p>${aflBlok(f)}${drie}`;
}
export async function tkmcOp({ req, res, q }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || ''), beschermd = /\.vercel\.app$/i.test(host), ua = String(req.headers['user-agent'] || '');
  const html = (t, x, code = 200) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(code).send(PAG(t, x)); };
  const tok = String(q.get('t') || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16), w = q.get('w'), S = 'tk-mailchimp';
  if (tok && (w === 'ja' || w === 'stop')) {
    const proef = tok === 'voorbeeld', kijk = q.get('l') === '1';
    const a = proef ? { tok, s: S, n: 'Marieke', v: q.get('v') || 'o0' } : await M.adres(tok);
    if (!a || a.s !== S) return html('Niet gevonden', '<h1>Deze link werkt niet</h1><p class="lede">Misschien is hij afgebroken in je mail. Meld je anders aan op <a href="' + SITE + '">taniakross.media</a>.</p>', 404);
    if (req.method === 'POST') { if (!proef) { if (w === 'ja') await M.zegJa(S, a, kijk ? 'kijk' : 'knop', STROOM); else await M.zegStop(S, a); } else a[w] = Date.now(); if (!/text\/html/.test(String(req.headers.accept || ''))) return res.status(200).json({ ok: true }); }
    if (!proef && !/bot|crawl|spider|preview|scan|safe|proofpoint|mimecast|barracuda/i.test(ua)) await M.zie(S, a);
    if (w === 'ja') { const f = await aflevering().catch(() => null), gift = (VARIANTEN[N(String(a.v || 'o0').slice(1))] || {}).gift || ''; return html(kijk ? 'Welkom terug' : 'Welkom terug bij Tania Kross', welkom({ a, f, kijk, gift })); }
    const doe = `<script>fetch(location.pathname+location.search,{method:'POST'}).then(function(r){if(r.ok){document.getElementById('d').hidden=false;document.getElementById('f').hidden=true}})</script>`;
    return html('Afgemeld', a.stop ? '<h1>Je staat er niet meer op</h1><p class="lede">Je krijgt geen mail meer van ons.</p>'
      : `<div id="f"><h1>Wil je geen mail meer?</h1><form method="post"><button class="btn" type="submit">Haal me eraf</button></form></div><div id="d" hidden><h1>Je staat er niet meer op</h1><p class="lede">Je krijgt geen mail meer van ons.</p></div>${doe}`);
  }
  if (!beschermd) return res.status(404).send('Niet gevonden');
  if (q.get('kijk') === '1' || q.get('kijk') === '0') { if (q.get('kijk') === '1') await kv.set('tkmc:kijk', 1); else await kv.del(['tkmc:kijk']); return res.status(200).json({ ok: true, kijklinkInMail: q.get('kijk') === '1' }); } // kijklink in de mail aan of uit
  if (q.get('import') === '1') return res.status(200).json(await importeer());
  if (q.get('naarbakken') === '1') return res.status(200).json(await naarBakken());
  if (q.get('ander') === '1' || q.get('ander') === '0') { if (q.get('ander') === '1') await kv.set('tkmc:ander', 1); else await kv.del(['tkmc:ander']); return res.status(200).json({ ok: true, anderAdresZinInMail: q.get('ander') === '1', zin: ANDER_ZIN }); }
  if (q.get('voorbeeld') === '1') { const R = await M.regels(S), ctx = { ...(await podcast()), ander: q.get('ander') === '1' || !!(await kv.get('tkmc:ander').catch(() => null)) }, B = await M.bakken(S), l = [];
    for (const b of Object.keys(B).sort().reverse().slice(0, 2)) { const x = ((await kv.raw(['LRANGE', 'mlm:' + S + ':b:' + b, '0', '0']).catch(() => [])) || [])[0]; if (x) l.push(JSON.parse(x)); } if (!l.length) l.push({ n: 'Marieke', j: '2018', m: 'x@voorbeeld.nl', b: '-' });
    let x = '<h1>Zo gaat de mail de deur uit</h1>'; for (const a of l) for (const i of R.armen) { const m = mailTekst(a, { v: M.pool(STROOM, R)[i], tok: 'VOORBEELD', ctx }); x += `<p><b>Variant o${i}</b> · aan …@${esc(String(a.m || '').split('@')[1] || '')} · bak ${esc(a.b || '')}<br><b>Onderwerp:</b> ${esc(m.onderwerp)}</p><pre style="white-space:pre-wrap;border:1px solid var(--line);border-radius:12px;padding:14px;font:15px/1.5 inherit">${esc(m.tekst)}</pre>`; }
    // de korte antwoorden op replies (Henkjan 28 nov 2026), zodat hij ze ziet voor ze de deur uit gaan
    const v0 = { ...l[0], tok: 'VOORBEELD' }, pre = t => `<pre style="white-space:pre-wrap;border:1px solid var(--line);border-radius:12px;padding:14px;font:15px/1.5 inherit">${esc(t)}</pre>`;
    x += '<h1>Zo antwoorden we op een reply</h1>'
      + '<p><b>Automatisch antwoord met een reden</b> (bijv. herstel na een ongeval), één keer:</p>' + pre(afwezigTekst(v0, 'herstel na een ongeval'))
      + '<p><b>Automatisch antwoord over vakantie</b>, één keer:</p>' + pre(afwezigTekst(v0, 'met vakantie'))
      + '<p><b>Ja terugmailen</b>:</p>' + pre(bedankTekst(v0, 'ja', 'g1'))
      + '<p><b>Een groet of herinnering zonder vraag</b>:</p>' + pre(bedankTekst(v0, 'anders'))
      + '<p><b>Ander adres genoemd</b>: dat adres gaat op de lijst, en:</p>' + pre(anderTekst(v0, 'nieuw@voorbeeld.nl', { lijst: 'erop' }))
      + '<p><b>Een echte vraag</b>: AI-antwoord uit wat we weten, met "AI-antwoord" erboven en de vraag om nog een keer te antwoorden als Henkjan zelf moet reageren. Een tweede reply gaat naar Henkjan. Afmelden: eraf, geen mail. Afwezig zonder reden: geen mail.</p>';
    return html('Voorbeeld', x); }
  res.setHeader('location', '/api/post?op=mailmind&s=' + S); return res.status(302).end();
}
export const welkomHtml = o => PAG('Welkom terug', welkom(o)); // voor de proef in scripts/ (zonder database)
