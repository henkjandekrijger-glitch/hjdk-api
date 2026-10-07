// Yoors DEALS-ALERT (NL/BE) — mailinglijst uit de deals-modal op Yoors, met Google One Tap of e-mailveld.
//   POST /api/nl/lead {email | credential, page, slug, v, p:{id,title,price,image,url}}  -> inschrijven (ontdubbeld) + direct de welkomstmail met de deal van die pagina + lezersfavorieten
//   GET  /api/nl/daily        (cron elke 15 min 05:30–08:45 UTC)      -> dagelijkse deals-mail, per ronde max 100 adressen (Resend batch), onderwerpregel leert (Thompson op kliks)
//   GET  /api/nl/go?u=&m=&s=&p=&e=   -> klik uit een mail meten en doorsturen naar bol (partnerlink, subid nl_<mail>_s<onderwerp>)
//   GET  /api/nl/o?m=&s=&e=          -> open-pixel
//   GET  /api/nl/unsub?e=&t=         -> afmelden (HMAC-token; staat in elke mail)
//   GET  /api/nl/status               -> aantallen (geen adressen)   GET /subs?token=<HJDK_TOKEN>[&csv=1] -> lijst   GET /api/nl/resend?token= -> wachtende welkomstmails alsnog sturen
// bol-voorwaarden: de modal bevat GEEN affiliate-link (3.12h); de links zitten in de mail. Meld "Yoors nieuwsbrief (e-mail)" aan als kanaal in het bol-partneraccount (3.12d).
import { createHmac } from 'node:crypto';
import { kv } from '../lib/db.js';
import { searchCached } from '../lib/bol.js';

const LIST = 'hjdk:nl:subs', BOL_SITE = '1229920';
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = v => '€' + Number(v).toFixed(2).replace('.', ',');
const day = d => new Date(d || Date.now()).toISOString().slice(0, 10);
const BASE = () => process.env.HJDK_BASE || 'https://hjdk-api.vercel.app';
const FROM = () => process.env.NL_FROM || 'Yoors deals <deals@yoo.rs>';
const SUBJECTS = ['De 12 beste bol-deals van vandaag (lezers kochten deze het vaakst)', 'Vandaag scherp geprijsd bij bol — voordat het weer omhoog gaat', 'Jouw deals-alert: dit kopen Yoors-lezers nu', 'Nieuwe prijzen bij bol vanochtend — de 12 die eruit springen'];

async function secrets() { try { return (await kv.get('hjdk:secrets')) || {}; } catch (e) { return {}; } }
async function resendKey() { if (process.env.RESEND_API_KEY || process.env.RESEND) return process.env.RESEND_API_KEY || process.env.RESEND; return (await secrets()).RESEND_API_KEY || ''; }
async function googleClientId() { if (process.env.GOOGLE_CLIENT_ID) return process.env.GOOGLE_CLIENT_ID; return (await secrets()).GOOGLE_CLIENT_ID || ''; }
async function hmacKey() { if (process.env.HJDK_TOKEN) return process.env.HJDK_TOKEN; let s = await secrets(); if (!s.NL_HMAC) { s.NL_HMAC = Math.random().toString(36).slice(2) + Date.now().toString(36); try { await kv.set('hjdk:secrets', s); } catch (e) {} } return s.NL_HMAC; }
async function sig(email) { return createHmac('sha256', await hmacKey()).update(String(email).toLowerCase()).digest('hex').slice(0, 24); }
const bolLink = (url, subid) => 'https://partner.bol.com/click/click?p=1&t=url&s=' + BOL_SITE + '&f=TXL&url=' + encodeURIComponent(String(url).replace(/[?#].*$/, '')) + '&subid=' + encodeURIComponent(subid);
const go = (url, m, s, p, e) => BASE() + '/api/nl/go?u=' + encodeURIComponent(url) + '&m=' + encodeURIComponent(m) + '&s=' + s + '&p=' + encodeURIComponent(p || '') + '&e=' + encodeURIComponent(e || '');

// Google One Tap: ondertekend bewijs bij Google controleren; alleen het e-mailadres eruit halen. Geen sleutels nodig.
async function emailFromCredential(cred) {
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(cred)); const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.email) return null;
  const cid = await googleClientId(); if (cid && j.aud !== cid) return null;
  if (String(j.email_verified) !== 'true') return null;
  return String(j.email).toLowerCase();
}

async function popular() { try { const c = await kv.get('hjdk:popular:v1'); return c && c.products || []; } catch (e) { return []; } }
// deals van vandaag: bol-populairlijst (met doorstreepprijs = echte korting) + eigen lezersfavorieten; volgorde leert op kliks
async function todaysDeals() {
  const ck = 'hjdk:nl:deals:' + day(); try { const c = await kv.get(ck); if (c && c.length) return c; } catch (e) {}
  let items = [];
  try { const j = await searchCached('', { size: 48 }); items = (j.products || []).filter(p => p.image && p.price != null); } catch (e) {}
  const fav = await popular();
  const seen = {}; const all = [];
  fav.forEach(p => { if (!seen[p.id]) { seen[p.id] = 1; all.push({ id: p.id, title: p.title, url: p.url, image: p.image, price: p.price, strike: null, rating: p.rating, fav: true }); } });
  items.forEach(p => { if (!seen[p.id]) { seen[p.id] = 1; all.push({ id: p.id, title: p.title, url: p.url, image: p.image, price: p.price, strike: p.strike, rating: p.rating, fav: false }); } });
  const ck2 = all.map(p => 'c:hjdk6-nl-p-' + p.id + '-clk'); const clicks = ck2.length ? await kv.mget(...ck2) : [];
  all.forEach((p, i) => { p.clk = Number(clicks[i]) || 0; p.score = p.clk * 3 + (p.strike && p.strike > p.price ? (p.strike - p.price) / p.strike * 10 : 0) + (p.fav ? 2 : 0) + Math.random(); });
  const out = all.sort((a, b) => b.score - a.score).slice(0, 12);
  try { await kv.set(ck, out, { ex: 36 * 3600 }); } catch (e) {}
  return out;
}

function card(p, href) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;margin:0 0 12px"><tr><td width="110" style="padding:12px"><a href="' + esc(href) + '"><img src="' + esc(p.image) + '" width="96" style="display:block;border-radius:8px" alt=""></a></td><td style="padding:12px 12px 12px 0;font:15px/1.4 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:#111"><a href="' + esc(href) + '" style="color:#111;text-decoration:none;font-weight:700">' + esc(String(p.title).slice(0, 80)) + '</a><div style="margin:6px 0 8px;font-weight:800;font-size:17px">' + (p.price != null ? eur(p.price) : '') + (p.strike && p.strike > p.price ? ' <span style="color:#6b7280;font-weight:400;font-size:13px;text-decoration:line-through">' + eur(p.strike) + '</span>' : '') + (p.rating != null ? ' <span style="color:#6b7280;font-weight:400;font-size:13px">★ ' + Number(p.rating).toFixed(1).replace('.', ',') + '</span>' : '') + '</div><a href="' + esc(href) + '" style="display:inline-block;background:#0a6dff;color:#fff;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:9px;font-size:14px">Bekijk bij bol →</a></td></tr></table>';
}
async function wrap(email, m, s, headline, intro, cardsHtml) {
  const t = await sig(email); const unsub = BASE() + '/api/nl/unsub?e=' + encodeURIComponent(email) + '&t=' + t;
  const px = BASE() + '/api/nl/o?m=' + encodeURIComponent(m) + '&s=' + s + '&e=' + encodeURIComponent(email);
  return '<div style="font:16px/1.5 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:#111;max-width:560px;margin:0 auto;padding:20px 16px"><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:6px">Yoors deals-alert</div><h1 style="font-size:22px;line-height:1.2;margin:0 0 8px">' + esc(headline) + '</h1><p style="color:#374151;margin:0 0 18px">' + esc(intro) + '</p>' + cardsHtml + '<p style="color:#6b7280;font-size:12px;margin:18px 0 0">Prijzen zoals bol ze vanochtend toonde; ze kunnen veranderen. Links naar bol zijn partnerlinks: Yoors krijgt een kleine vergoeding als je iets koopt, jij betaalt niets extra. <a href="' + esc(unsub) + '" style="color:#6b7280">Afmelden</a> kan altijd met één klik.</p><img src="' + esc(px) + '" width="1" height="1" alt="" style="display:block"></div>';
}
// afzender: deals@yoo.rs zodra yoo.rs in Resend geverifieerd is; tot die tijd valt hij automatisch terug op het al geverifieerde domein (NL_FROM_FALLBACK)
const FALLBACK = () => process.env.NL_FROM_FALLBACK || 'Yoors deals <deals@lastingchange.works>';
async function fromAddr() { try { const c = await kv.get('hjdk:nl:from'); if (c && c.from && Date.now() - c.at < 6 * 3600 * 1000) return c.from; } catch (e) {} return FROM(); }
async function rememberFrom(from) { try { await kv.set('hjdk:nl:from', { from, at: Date.now() }); } catch (e) {} }
const domainErr = (status, j) => status === 403 || /domain|verif|not allowed/i.test(String(j && (j.message || j.name) || ''));
async function send(key, to, subject, html) {
  let from = await fromAddr();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify({ from, to: [to], subject, html }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { await rememberFrom(from); return { sent: true, id: j.id, from }; }
      if (attempt === 0 && from !== FALLBACK() && domainErr(r.status, j)) { from = FALLBACK(); continue; }
      return { sent: false, why: 'resend ' + r.status + ' ' + String(j.message || j.name || '').slice(0, 120) };
    } catch (e) { return { sent: false, why: String(e && e.message || e).slice(0, 120) }; }
  }
  return { sent: false, why: 'resend' };
}
async function welcome(sub) {
  const key = await resendKey(); if (!key) return { sent: false, why: 'RESEND_API_KEY ontbreekt' };
  const m = 'welkom'; const p = sub.p && sub.p.url ? sub.p : null; const fav = (await popular()).filter(x => !p || x.id !== p.id).slice(0, 3);
  let cards = '';
  if (p) cards += '<div style="font-weight:700;margin:0 0 8px">Waar je net naar keek:</div>' + card(p, go(bolLink(p.url, 'nl_welkom_' + (sub.page || 'x').slice(0, 24)), m, 0, p.id, sub.email));
  if (fav.length) cards += '<div style="font-weight:700;margin:14px 0 8px">Wat Yoors-lezers het vaakst kopen:</div>' + fav.map(x => card(x, go(bolLink(x.url, 'nl_welkom_fav'), m, 0, x.id, sub.email))).join('');
  if (!cards) cards = '<p>Je eerste deals-mail komt morgenochtend om 8 uur.</p>';
  const html = await wrap(sub.email, m, 0, 'Je zit erbij. Dit is je eerste deal.', 'Elke ochtend rond 8 uur krijg je de 12 beste bol-deals die Yoors-lezers echt kopen. Vandaag alvast deze, met de prijs van nu.', cards);
  return send(key, sub.email, 'Je eerste bol-deal van Yoors — met de prijs van nu', html);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.setHeader('cache-control', 'no-store');
  const url = new URL(req.url, 'http://x');
  const op = url.searchParams.get('op') || url.pathname.replace(/^\/api\/nl\/?/, '').split('/')[0];
  try {
    if (op === 'lead') {
      if (req.method !== 'POST') return res.status(405).end();
      let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      let email = '', src = 'email';
      if (b.credential) { email = (await emailFromCredential(String(b.credential))) || ''; src = 'google'; if (!email) return res.status(400).json({ ok: false, error: 'google credential ongeldig' }); }
      else email = String(b.email || '').trim().toLowerCase().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return res.status(400).json({ ok: false, error: 'invalid email' });
      const p = b.p && typeof b.p === 'object' && b.p.url ? { id: String(b.p.id || '').slice(0, 30), title: String(b.p.title || '').slice(0, 120), price: b.p.price != null ? Number(b.p.price) : null, image: /^https?:\/\//.test(String(b.p.image || '')) ? String(b.p.image).slice(0, 300) : '', url: /^https?:\/\/(www\.)?bol\.com\//.test(String(b.p.url || '')) ? String(b.p.url).slice(0, 300) : '' } : null;
      const sub = { email, at: Date.now(), page: String(b.page || '').slice(0, 80), v: String(b.v || '').slice(0, 24), src, p: p && p.url ? p : null };
      const dupKey = 'hjdk:nl:sub:' + email; const dup = await kv.get(dupKey);
      let mail = { sent: false, why: 'al ingeschreven' };
      if (!dup || dup.off) {
        mail = await welcome(sub); sub.mail = mail.sent ? 'sent' : 'pending:' + mail.why;
        const list = (await kv.get(LIST)) || []; if (!list.some(x => x.email === email)) list.unshift(sub); await kv.set(LIST, list.slice(0, 20000));
        await kv.set(dupKey, { at: sub.at, mail: sub.mail, src });
        try { await kv.incrMany([['c:hjdk6-nl-leads', 1], ['c:hjdk6-nl-src-' + src, 1], ['c:hjdk6-nl-mail-' + (mail.sent ? 'ok' : 'fail'), 1], ['c:hjdk6-nl-lead-' + (sub.v || 'x').replace(/[^a-z0-9]/gi, '') , 1]]); } catch (e) {}
      }
      return res.status(200).json({ ok: true, sent: mail.sent, again: !!(dup && !dup.off), src });
    }
    if (op === 'go') {
      const u = url.searchParams.get('u') || ''; if (!/^https:\/\/partner\.bol\.com\//.test(u)) return res.status(400).send('bad url');
      const m = (url.searchParams.get('m') || 'x').replace(/[^a-z0-9_-]/gi, '').slice(0, 20), s = (url.searchParams.get('s') || '0').replace(/\D/g, '').slice(0, 2), p = (url.searchParams.get('p') || '').replace(/\D/g, '').slice(0, 20);
      const pairs = [['c:hjdk6-nl-m-' + m + '-clk', 1], ['c:hjdk6-nl-s-' + s + '-clk', 1]]; if (p) pairs.push(['c:hjdk6-nl-p-' + p + '-clk', 1]);
      try { await kv.incrMany(pairs); } catch (e) {}
      res.setHeader('location', u); return res.status(302).end();
    }
    if (op === 'o') {
      const m = (url.searchParams.get('m') || 'x').replace(/[^a-z0-9_-]/gi, '').slice(0, 20), s = (url.searchParams.get('s') || '0').replace(/\D/g, '').slice(0, 2);
      try { await kv.incrMany([['c:hjdk6-nl-m-' + m + '-open', 1], ['c:hjdk6-nl-s-' + s + '-open', 1]]); } catch (e) {}
      res.setHeader('content-type', 'image/gif'); return res.status(200).send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    }
    if (op === 'unsub') {
      const e = String(url.searchParams.get('e') || '').toLowerCase(), t = url.searchParams.get('t') || '';
      res.setHeader('content-type', 'text/html; charset=utf-8');
      if (!e || t !== await sig(e)) return res.status(400).send('<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;padding:30px">Deze afmeldlink is niet geldig.</body>');
      const list = (await kv.get(LIST)) || []; await kv.set(LIST, list.filter(x => x.email !== e));
      await kv.set('hjdk:nl:sub:' + e, { off: 1, at: Date.now() }); try { await kv.incr('c:hjdk6-nl-unsub'); } catch (x) {}
      return res.status(200).send('<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;padding:30px">Je bent afgemeld. Je krijgt geen deals-mails meer van Yoors.</body>');
    }
    if (op === 'daily') {
      // dagcampagne: één keer per dag samengesteld; per ronde max 100 adressen via Resend batch; cursor in KV zodat elke cron-ronde verder gaat
      const key = await resendKey(); if (!key) return res.status(200).json({ ok: false, why: 'RESEND_API_KEY ontbreekt' });
      const d = day(), ck = 'hjdk:nl:camp:' + d; let camp = await kv.get(ck);
      const list = (await kv.get(LIST)) || [];
      if (!camp) { const deals = await todaysDeals(); if (!deals.length) return res.status(200).json({ ok: false, why: 'geen deals' });
        // onderwerpregel: Thompson op kliks per verstuurde mail (c:hjdk6-nl-s-<i>-sent / -clk)
        const ks = []; SUBJECTS.forEach((_, i) => ks.push('c:hjdk6-nl-s-' + i + '-sent', 'c:hjdk6-nl-s-' + i + '-clk')); const v = await kv.mget(...ks);
        let best = 0, bs = -1; SUBJECTS.forEach((_, i) => { const sent = Number(v[i * 2]) || 0, clk = Number(v[i * 2 + 1]) || 0; const a = clk + 1, bb = Math.max(0, sent - clk) + 1; const x = a / (a + bb) + (Math.random() - 0.5) * (1 / Math.sqrt(sent + 1)); if (x > bs) { bs = x; best = i; } });
        camp = { d, deals, s: best, cursor: 0, sent: 0, total: list.length }; await kv.set(ck, camp, { ex: 3 * 86400 }); }
      if (camp.cursor >= list.length) return res.status(200).json({ ok: true, done: true, sent: camp.sent, total: list.length, subject: camp.s });
      const batch = list.slice(camp.cursor, camp.cursor + 100); const m = 'd' + d.replace(/-/g, '').slice(2);
      const emails = []; let from = await fromAddr();
      for (const sub of batch) {
        const cards = camp.deals.map(p => card(p, go(bolLink(p.url, 'nl_' + m + '_s' + camp.s), m, camp.s, p.id, sub.email))).join('');
        emails.push({ from, to: [sub.email], subject: SUBJECTS[camp.s], html: await wrap(sub.email, m, camp.s, 'De 12 beste bol-deals van vandaag', 'Vers uit de prijzen van vanochtend, gesorteerd op wat Yoors-lezers het vaakst kopen.', cards) });
      }
      let r = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify(emails) });
      let j = await r.json().catch(() => ({}));
      if (!r.ok && from !== FALLBACK() && domainErr(r.status, j)) { from = FALLBACK(); emails.forEach(e => { e.from = from; }); r = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify(emails) }); j = await r.json().catch(() => ({})); }
      const ok = r.ok; if (ok) await rememberFrom(from);
      camp.cursor += batch.length; if (ok) camp.sent += batch.length; await kv.set(ck, camp, { ex: 3 * 86400 });
      if (ok) { try { await kv.incrMany([['c:hjdk6-nl-s-' + camp.s + '-sent', batch.length], ['c:hjdk6-nl-m-' + m + '-sent', batch.length]]); } catch (e) {} }
      return res.status(200).json({ ok, sentNow: ok ? batch.length : 0, cursor: camp.cursor, total: list.length, subject: camp.s, error: ok ? undefined : String(j.message || j.name || r.status).slice(0, 160) });
    }
    if (op === 'cfg') { // openbare instellingen voor de modal (de Google client-ID staat toch in elke pagina)
      res.setHeader('cache-control', 'public, max-age=300'); return res.status(200).json({ clientId: await googleClientId() });
    }
    if (op === 'status') {
      const list = (await kv.get(LIST)) || []; const pending = list.filter(l => /^pending/.test(l.mail || '')).length;
      const camp = await kv.get('hjdk:nl:camp:' + day());
      return res.status(200).json({ subs: list.length, pending, google: list.filter(l => l.src === 'google').length, mail: (await resendKey()) ? 'resend ingesteld' : 'RESEND_API_KEY ontbreekt (inschrijvingen worden bewaard, mail volgt zodra de sleutel op /setup staat)', googleClientId: (await googleClientId()) ? 'ingesteld' : 'ontbreekt (alleen e-mailveld, geen One Tap)', from: await fromAddr(), fallback: FALLBACK(), vandaag: camp ? { verstuurd: camp.sent, van: camp.total, onderwerp: camp.s } : null });
    }
    if (op === 'resend') {
      if (!process.env.HJDK_TOKEN || url.searchParams.get('token') !== process.env.HJDK_TOKEN) return res.status(401).json({ error: 'token' });
      const list = (await kv.get(LIST)) || []; let n = 0;
      for (const l of list) { if (!/^pending/.test(l.mail || '')) continue; const m = await welcome(l); if (m.sent) { l.mail = 'sent'; n++; try { await kv.set('hjdk:nl:sub:' + l.email, { at: l.at, mail: 'sent', src: l.src }); } catch (e) {} } if (n >= 50) break; }
      await kv.set(LIST, list); return res.status(200).json({ ok: true, verstuurd: n });
    }
    if (op === 'subs' || op === '') {
      if (!process.env.HJDK_TOKEN || url.searchParams.get('token') !== process.env.HJDK_TOKEN) { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(401).send('<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;padding:30px"><form><p>HJDK-token: <input name="token" type="password"> <button>Bekijk inschrijvingen</button></p></form></body>'); }
      const list = (await kv.get(LIST)) || [];
      if (url.searchParams.get('csv')) { res.setHeader('content-type', 'text/csv; charset=utf-8'); res.setHeader('content-disposition', 'attachment; filename="yoors-deals-subs.csv"'); return res.status(200).send('email,datum,pagina,variant,bron,mail\n' + list.map(l => [l.email, new Date(l.at).toISOString(), l.page, l.v, l.src, l.mail].map(x => '"' + String(x || '').replace(/"/g, '""') + '"').join(',')).join('\n')); }
      res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send('<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Yoors deals-alert</title><style>body{font:15px system-ui;padding:20px;color:#111}table{border-collapse:collapse}td,th{border-bottom:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:14px}</style></head><body><h2>Yoors deals-alert — ' + list.length + ' adressen</h2><p><a href="/subs?token=' + esc(url.searchParams.get('token')) + '&csv=1">Download CSV</a> · via Google: ' + list.filter(l => l.src === 'google').length + ' · nog te mailen: ' + list.filter(l => /^pending/.test(l.mail || '')).length + '</p><table><tr><th>E-mail</th><th>Datum</th><th>Pagina</th><th>Variant</th><th>Bron</th><th>Mail</th></tr>' + list.slice(0, 500).map(l => '<tr><td>' + esc(l.email) + '</td><td>' + new Date(l.at).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }) + '</td><td>' + esc(l.page) + '</td><td>' + esc(l.v) + '</td><td>' + esc(l.src) + '</td><td>' + esc(l.mail) + '</td></tr>').join('') + '</table></body></html>');
    }
    return res.status(400).json({ error: 'bad op', op });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e && e.message || e).slice(0, 200) }); }
}
