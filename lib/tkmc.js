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


export const LIVE = false;
const SITE = 'https://taniakross.media';
const N = M.N, MAILRE = M.MAILRE;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
async function podcast() { // live van taniakross.media, zodat de mail altijd de echte gasten noemt
  try { const j = await (await fetch(SITE + '/api/lijst?a=stand', { signal: AbortSignal.timeout(8000) })).json(); const p = j.podcast || {}; return { laatste: String(p.laatste || ''), drie: String(p.drie || '') }; } catch (e) { return {}; }
}
export function mailTekst(a, { v = VARIANTEN[0], tok = 'xxxx', ctx = {} } = {}) {
  const pod = ctx || {}, pz = pod.laatste ? ` De laatste aflevering is met ${pod.laatste}.${pod.drie ? ` Binnenkort volgen ${pod.drie}.` : ''}` : (pod.drie ? ` Binnenkort volgen ${pod.drie}.` : '');
  const vn = String(a.n || '').trim().split(/\s+/)[0];
  const aanhef = vn && /^[A-Za-zÀ-ÿ'-]{2,20}$/.test(vn) ? 'Hoi ' + vn.charAt(0).toUpperCase() + vn.slice(1).toLowerCase() + ',' : 'Hoi,';
  const t = (v.t + (/Henkjan de Krijger/.test(v.t) ? '' : ONDER)).replace('{aanhef}', aanhef).replace(/\{jaar\}/g, String(a.j || '2018')).replace('{podcast}', pz).replace('{ja}', SITE + '/blijf/' + tok).replace('{stop}', SITE + '/stop/' + tok).replace(/\{voornaam\}/g, vn || '');
  return { onderwerp: v.o.replace(/\{voornaam\}/g, vn || '').replace(/^,\s*/, ''), tekst: t, stop: SITE + '/stop/' + tok, gift: v.gift || '' };
}

// ---------- de stroom voor Mailmind ----------
export const STROOM = {
  id: 'tk-mailchimp', LIVE, kanaal: 'gmail', fromName: 'Henkjan de Krijger', wie: 'tk', taal: 'nl', soort: 'klant',
  doel: 'Oude lezer van Tania Kross zegt ja tegen haar mail', std: { perDag: 40, max: 180, perUur: 8 }, uren: [9, 21],
  varianten: VARIANTEN, context: podcast, mail: (a, o) => mailTekst(a, o),
  bak: a => 'r' + (a.r || 0) + '|' + M.soortAdres(a.m) + '|' + (a.j || 'x'),
  // voorkennis per bak: Mailchimp-score 5 verwacht 8% ja, 4 5%, 3 3% (gewicht 10 mails); daarna beslissen de echte cijfers
  voorkennis: b => { const r = N(String(b).slice(1, 2)); const p = r >= 5 ? 0.08 : r === 4 ? 0.05 : 0.03; return [10 * p, 10 * (1 - p)]; },
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
const PAG = (titel, inhoud) => `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(titel)}</title><style>:root{--bg:#fff;--ink:#111113;--line:#E5E7EB}@media(prefers-color-scheme:dark){:root{--bg:#111113;--ink:#F3F4F6;--line:#2E2E33}}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}main{max-width:560px;margin:0 auto;padding:48px 18px}h1{font-size:28px;line-height:1.25;margin:0 0 14px}p{margin:0 0 16px}a{color:var(--ink)}button{min-height:52px;padding:0 26px;border:0;border-radius:999px;background:var(--ink);color:var(--bg);font:600 17px/1 inherit;cursor:pointer}.k{font-size:13px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px}</style></head><body><main><p class="k">Tania Kross</p>${inhoud}</main></body></html>`;
export async function tkmcOp({ req, res, q }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || ''), beschermd = /\.vercel\.app$/i.test(host), ua = String(req.headers['user-agent'] || '');
  const html = (t, x, code = 200) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(code).send(PAG(t, x)); };
  const tok = String(q.get('t') || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16), w = q.get('w'), S = 'tk-mailchimp';
  if (tok && (w === 'ja' || w === 'stop')) {
    const a = await M.adres(tok); if (!a || a.s !== S) return html('Niet gevonden', '<h1>Deze link werkt niet</h1><p>Misschien is hij afgebroken in je mail. Meld je anders aan op <a href="' + SITE + '">taniakross.media</a>.</p>', 404);
    if (req.method === 'POST') { if (w === 'ja') await M.zegJa(S, a, 'knop', STROOM); else await M.zegStop(S, a); if (!/text\/html/.test(String(req.headers.accept || ''))) return res.status(200).json({ ok: true }); }
    if (!/bot|crawl|spider|preview|scan|safe|proofpoint|mimecast|barracuda/i.test(ua)) await M.zie(S, a);
    const doe = `<script>fetch(location.pathname+location.search,{method:'POST'}).then(function(r){if(r.ok){document.getElementById('d').hidden=false;document.getElementById('f').hidden=true}})</script>`;
    if (w === 'ja') return html('Je blijft op de lijst', a.ja ? '<h1>Je staat op de lijst</h1><p>Je hoort het als er een nieuwe aflevering van A Kross … is. Kijk alvast op <a href="' + SITE + '/podcast">taniakross.media/podcast</a>.</p>'
      : `<div id="f"><h1>Blijf je op de lijst van Tania Kross?</h1><form method="post"><button type="submit">Ja, ik blijf</button></form></div><div id="d" hidden><h1>Fijn, je blijft op de lijst</h1><p>Kijk in je mail: je krijgt meteen een bericht van Tania. Daarna hoor je het als er een nieuwe aflevering van A Kross … is.</p><p><a href="${SITE}/podcast">Luister alvast naar de podcast</a></p></div>${doe}`);
    return html('Afgemeld', a.stop ? '<h1>Je staat er niet meer op</h1><p>Je krijgt geen mail meer van ons. Vragen? Bel of app Henkjan: 06 55395630.</p>'
      : `<div id="f"><h1>Wil je geen mail meer?</h1><form method="post"><button type="submit">Haal me eraf</button></form></div><div id="d" hidden><h1>Je staat er niet meer op</h1><p>Je krijgt geen mail meer van ons. Vragen? Bel of app Henkjan: 06 55395630.</p></div>${doe}`);
  }
  if (!beschermd) return res.status(404).send('Niet gevonden');
  if (q.get('import') === '1') return res.status(200).json(await importeer());
  if (q.get('naarbakken') === '1') return res.status(200).json(await naarBakken());
  if (q.get('voorbeeld') === '1') { const R = await M.regels(S), ctx = await podcast(), B = await M.bakken(S), l = [];
    for (const b of Object.keys(B).sort().reverse().slice(0, 2)) { const x = ((await kv.raw(['LRANGE', 'mlm:' + S + ':b:' + b, '0', '0']).catch(() => [])) || [])[0]; if (x) l.push(JSON.parse(x)); } if (!l.length) l.push({ n: 'Marieke', j: '2018', m: 'x@voorbeeld.nl', b: '-' });
    let x = '<h1>Zo gaat de mail de deur uit</h1>'; for (const a of l) for (const i of R.armen) { const m = mailTekst(a, { v: M.pool(STROOM, R)[i], tok: 'VOORBEELD', ctx }); x += `<p><b>Variant o${i}</b> · aan …@${esc(String(a.m || '').split('@')[1] || '')} · bak ${esc(a.b || '')}<br><b>Onderwerp:</b> ${esc(m.onderwerp)}</p><pre style="white-space:pre-wrap;border:1px solid var(--line);border-radius:12px;padding:14px;font:15px/1.5 inherit">${esc(m.tekst)}</pre>`; }
    return html('Voorbeeld', x); }
  res.setHeader('location', '/api/post?op=mailmind&s=' + S); return res.status(302).end();
}
