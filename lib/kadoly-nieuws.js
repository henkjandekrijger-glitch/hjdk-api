// Nieuwsbrief en browsermeldingen van gids.kadoly.com (Henkjan 2 nov 2026: "Maak er een email vanger en push vanger op voor als er nieuwe
// keuze hulpen of ander nieuws is van kadoly. Moet heel erg strak en goed zijn en maak er vooral allerlei trust signals in.")
// - Mail: dubbele opt-in, hooguit één mail per week (vrijdag), alleen als er iets nieuws is (nieuwe keuzehulp of nieuws van Kadoly).
// - Meldingen: zonder e-mailadres, hooguit één per dag, alleen bij een nieuwe keuzehulp of nieuws. Lege push, de service worker haalt de tekst op.
// - Alles telt in gk:d:<dag> (nb|... en <pagina>|nb-...). Nieuws zetten: /api/gids?op=nbnieuws&titel=..&tekst=..&url=.. (alleen beschermde host).
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { vapid, sendPush, subHash } from './push.js';
import { GIDSEN, GIDS_IDS } from './gidsen-kadoly.js';

const HOST = 'https://gids.kadoly.com';
const DOMEIN = process.env.KADOLY_NIEUWS_DOMEIN || 'post.kadoly.com'; // eigen verzenddomein bij Resend; kadoly.com zelf blijft ongemoeid (DNS bij AWS Route 53)
const FROM = () => process.env.KADOLY_NIEUWS_FROM || 'Kadoly <nieuws@' + DOMEIN + '>';
const REPLY = 'henkjan@yoo.rs';
const BEDRIJF = 'Kadoly Shop · ADSFAIR B.V. · Albert Plesmanplein 20, 2805 AB Gouda · KVK 60126035';
const LOGO = 'https://cdn.kadoly.com/icon/shop/apple-180.png?v=1';
const MAX_BEVESTIG_PER_DAG = 300;
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const h = s => createHash('sha256').update(String(s)).digest('hex');
const tok = () => randomBytes(24).toString('hex');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAG = () => new Date().toISOString().slice(0, 10);
const okMail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
const datumNl = d => { try { return new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return String(d); } };
const kortNaam = g => String(g.h1 || g.titel || g.slug).split(':')[0].trim();
const kortTekst = (s, n = 220) => { s = String(s || '').trim(); if (s.length <= n) return s; const k = s.slice(0, n); const p = k.lastIndexOf('. '); return (p > 80 ? k.slice(0, p + 1) : k.slice(0, k.lastIndexOf(' ')) + '…'); };

async function tel(wat, waar) { try { const k = 'gk:d:' + DAG(); await kv.raw(['HINCRBY', k, 'nb|' + wat, '1']); if (waar) await kv.raw(['HINCRBY', k, waar + '|nb-' + wat, '1']); await kv.raw(['EXPIRE', k, String(60 * 86400)]); } catch (e) {} }
async function mailSleutel() { if (process.env.RESEND_API_KEY || process.env.RESEND) return process.env.RESEND_API_KEY || process.env.RESEND; try { return ((await kv.get('hjdk:secrets')) || {}).RESEND_API_KEY || ''; } catch (e) { return ''; } }
function goedeEndpoint(v) { try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password && !u.port && v.length <= 1000 && (['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'].includes(u.hostname) || u.hostname.endsWith('.push.services.mozilla.com') || u.hostname.endsWith('.notify.windows.com')); } catch (e) { return false; } }

// gidsen van nieuw naar oud (op datum van de laatste inhoudelijke versie)
export function gidsenNieuw() { return GIDS_IDS.map(id => GIDSEN[id]).filter(Boolean).sort((a, b) => String(b.bijgewerkt).localeCompare(String(a.bijgewerkt))); }
export async function nieuwsItems() { try { const l = await kv.get('gk:nb:nieuws'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }

// ---------- mail ----------
function mailSchil({ titel, voorkop, inhoud, voet }) {
  const F = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif';
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(titel)}</title></head><body style="margin:0;padding:0;background:#E8F4FD"><span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(voorkop)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E8F4FD"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;border:1px solid #D6ECFC">
<tr><td style="padding:24px 28px 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td><img src="${LOGO}" width="32" height="32" alt="" style="display:block;border-radius:8px"></td><td style="padding-left:10px;font:700 18px/1 ${F};color:#0B0D12">Kadoly</td></tr></table></td></tr>
<tr><td style="padding:18px 28px 28px;font:16px/1.55 ${F};color:#0B0D12">${inhoud}</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="padding:18px 28px 6px;font:13px/1.55 ${F};color:#0B0D12">${voet}</td></tr></table>
</td></tr></table></body></html>`;
}
const knop = (href, tekst) => `<a href="${href}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:999px">${esc(tekst)}</a>`;

export function mailBevestig(url) {
  return mailSchil({ titel: 'Bevestig je aanmelding bij Kadoly', voorkop: 'Eén klik en je krijgt de nieuwe keuzehulpen van Kadoly.',
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Bevestig je aanmelding</h1><p style="margin:0 0 20px">Klik op de knop en je krijgt voortaan op vrijdag de nieuwe keuzehulpen en het nieuws van Kadoly. Hooguit één mail per week, en alleen als er echt iets nieuws is.</p><p style="margin:0 0 22px">${knop(url, 'Ja, meld me aan')}</p><p style="margin:0;font-size:14px">Heb je je niet aangemeld? Dan hoef je niets te doen. Zonder bevestiging krijg je niets van ons en vervalt deze aanvraag na twee dagen.</p>`,
    voet: `${esc(BEDRIJF)}<br>Vragen? Antwoord gewoon op deze mail.` });
}

export function mailWeek(gidsen, nieuws, afUrl, klik) {
  const L = (x, k) => klik ? klik(x, k) : '#';
  const rij = (titel, tekst, href, knoptekst, eerste) => `<div style="${eerste ? '' : 'border-top:1px solid #D6ECFC;'}padding:${eerste ? '0' : '20px'} 0 20px"><a href="${href}" style="font-size:18px;line-height:1.3;font-weight:700;color:#0B0D12;text-decoration:none">${esc(titel)}</a><p style="margin:6px 0 10px">${esc(kortTekst(tekst))}</p><a href="${href}" style="color:#1D9BF0;font-weight:700;text-decoration:none">${esc(knoptekst)} →</a></div>`;
  let i = 0; const delen = [];
  if (gidsen.length) delen.push(`<p style="margin:0 0 14px;font-weight:700;color:#1D9BF0;font-size:13px;letter-spacing:.06em;text-transform:uppercase">${gidsen.length === 1 ? 'Nieuwe keuzehulp' : 'Nieuwe keuzehulpen'}</p>` + gidsen.map(g => rij(g.h1, g.kort, L(g.slug, 'g'), 'Lees de keuzehulp', i++ === 0)).join(''));
  if (nieuws.length) { i = 0; delen.push(`<p style="margin:${gidsen.length ? '10px' : '0'} 0 14px;font-weight:700;color:#1D9BF0;font-size:13px;letter-spacing:.06em;text-transform:uppercase">Nieuws van Kadoly</p>` + nieuws.map(n => rij(n.titel, n.tekst, L(n.id, 'n'), 'Lees meer', i++ === 0)).join('')); }
  return mailSchil({ titel: 'Nieuw bij Kadoly', voorkop: gidsen.length ? gidsen.map(g => kortNaam(g)).join(', ') : (nieuws[0] || {}).titel || '',
    inhoud: `<h1 style="font-size:26px;line-height:1.2;margin:0 0 6px">Nieuw bij Kadoly</h1><p style="margin:0 0 22px">Wat er sinds je vorige mail bij kwam. Eerlijke keuzehulpen: ook als iets níet bij je past, staat dat erin.</p>${delen.join('')}`,
    voet: `Je krijgt deze mail omdat je je op gids.kadoly.com aanmeldde en je adres bevestigde. Hooguit één mail per week, alleen als er iets nieuws is. <a href="${afUrl}" style="color:#0B0D12;font-weight:700">Afmelden met één klik</a><br><br>${esc(BEDRIJF)}<br>Vragen? Antwoord gewoon op deze mail.` });
}
const onderwerp = (gidsen, nieuws) => gidsen.length === 1 ? 'Nieuwe keuzehulp: ' + kortNaam(gidsen[0]) : gidsen.length > 1 ? gidsen.length + ' nieuwe keuzehulpen bij Kadoly' : 'Nieuws van Kadoly: ' + ((nieuws[0] || {}).titel || '');

async function stuur(mails, idem) { // mails: [{to, subject, html, headers}] (1 = los, meer = batch)
  const key = await mailSleutel(); if (!key) throw Error('geen mailsleutel');
  const body = mails.map(m => ({ from: FROM(), reply_to: REPLY, ...m }));
  const r = await fetch('https://api.resend.com/emails' + (body.length > 1 ? '/batch' : ''), { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json', ...(idem ? { 'idempotency-key': idem } : {}) }, body: JSON.stringify(body.length > 1 ? body : body[0]) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw Error('mail ' + r.status + ' ' + String(j.message || j.name || '').slice(0, 120)); return j;
}

// verzenddomein: aanmaken bij Resend en de DNS-records teruggeven; pas als het domein geverifieerd is, staat het mailformulier aan
export async function mailKlaar() { try { return !!(await kv.get('gk:nb:mailklaar')); } catch (e) { return false; } }
export async function domein(maak) {
  const key = await mailSleutel(); if (!key) return { fout: 'geen mailsleutel' }; const H = { authorization: 'Bearer ' + key, 'content-type': 'application/json' };
  const lijst = await (await fetch('https://api.resend.com/domains', { headers: H, signal: AbortSignal.timeout(8000) })).json(); let d = (lijst.data || []).find(x => x.name === DOMEIN);
  if (!d && maak) { const r = await fetch('https://api.resend.com/domains', { method: 'POST', headers: H, body: JSON.stringify({ name: DOMEIN, region: 'eu-west-1' }), signal: AbortSignal.timeout(10000) }); d = await r.json(); if (!r.ok) return { fout: 'aanmaken ' + r.status + ' ' + String(d.message || '').slice(0, 120) }; }
  if (!d) return { naam: DOMEIN, status: 'bestaat niet' };
  let v = await (await fetch('https://api.resend.com/domains/' + d.id, { headers: H, signal: AbortSignal.timeout(8000) })).json();
  if (v.status !== 'verified' && maak) { await fetch('https://api.resend.com/domains/' + d.id + '/verify', { method: 'POST', headers: H, signal: AbortSignal.timeout(8000) }).catch(() => null); }
  const klaar = v.status === 'verified'; await kv.set('gk:nb:mailklaar', klaar ? 1 : 0);
  return { naam: DOMEIN, afzender: FROM(), status: v.status, records: (v.records || []).map(r => ({ type: r.type, naam: r.name, waarde: r.value, prioriteit: r.priority, ttl: r.ttl, status: r.status })) };
}

// ---------- aanmelden, bevestigen, afmelden ----------
export async function aanmelden(b, ip) {
  const email = String(b.email || '').trim().toLowerCase(); if (!okMail(email)) return { ok: false, fout: 'email' };
  if (!(await mailKlaar())) return { ok: false, fout: 'nogniet' };
  if (b.website || N(b.ms) < 1200) return { ok: true }; // honingpot of te snel: stil negeren
  const rk = 'gk:nb:rl:' + h(ip + ':' + Math.floor(Date.now() / 60000)).slice(0, 24); const n = await kv.incr(rk); if (n === 1) await kv.raw(['EXPIRE', rk, '120']); if (n > 6) return { ok: false, fout: 'druk' };
  const id = h('kd:' + email).slice(0, 32); const s = await kv.get('gk:nb:e:' + id); if (s && s.actief) return { ok: true }; // al aangemeld: zelfde antwoord, geen mail
  if (!(await kv.raw(['SET', 'gk:nb:er:' + id, '1', 'NX', 'EX', '600']))) return { ok: true }; // hooguit één bevestigingsmail per 10 minuten per adres
  const dk = 'gk:nb:dag:' + DAG(); const d = await kv.incr(dk); if (d === 1) await kv.raw(['EXPIRE', dk, '172800']); if (d > MAX_BEVESTIG_PER_DAG) return { ok: false, fout: 'druk' };
  const t = tok(); await kv.set('gk:nb:pending:' + h(t), { id, email, at: Date.now() }, { ex: 2 * 86400 });
  await stuur([{ to: [email], subject: 'Bevestig je aanmelding bij Kadoly', html: mailBevestig(HOST + '/nieuws/bevestig?t=' + t) }], 'kd-nb-bevestig-' + h(t).slice(0, 32));
  await tel('aanvraag', b.waar); return { ok: true };
}
export async function bevestigOpen(t) { if (!/^[a-f0-9]{48}$/.test(t || '')) return null; return await kv.get('gk:nb:pending:' + h(t)); }
export async function bevestig(t) {
  const p = await bevestigOpen(t); if (!p) return null; const oud = await kv.get('gk:nb:e:' + p.id); if (p.klaar || (oud && oud.actief)) return { ...(oud || { email: p.email }), al: true };
  const af = (oud && oud.af) || tok(); const s = { email: p.email, actief: true, at: (oud && oud.at) || p.at, bevestigd: Date.now(), af, gezien: GIDS_IDS.slice(), nieuwsAt: Date.now() };
  await kv.set('gk:nb:e:' + p.id, s); await kv.set('gk:nb:af:' + h(af), p.id); await kv.raw(['SADD', 'gk:nb:emails', p.id]); await kv.set('gk:nb:pending:' + h(t), { ...p, klaar: Date.now() }, { ex: 2 * 86400 }); // tweede klik op de link: "je was al aangemeld"
  await tel('bevestigd'); return s;
}
export async function afmelden(t, weer) {
  if (!/^[a-f0-9]{48}$/.test(t || '')) return null; const id = await kv.get('gk:nb:af:' + h(t)); if (!id) return null; const s = await kv.get('gk:nb:e:' + id); if (!s) return null;
  if (weer) { if (!s.actief) { s.actief = true; s.weer = Date.now(); await kv.set('gk:nb:e:' + id, s); await kv.raw(['SADD', 'gk:nb:emails', id]); await tel('weer'); } return s; }
  if (s.actief) { s.actief = false; s.afAt = Date.now(); await kv.set('gk:nb:e:' + id, s); await kv.raw(['SREM', 'gk:nb:emails', id]); await tel('af'); } return s;
}

// ---------- meldingen ----------
export async function pushAan(b) {
  const endpoint = String(b.endpoint || ''); if (!goedeEndpoint(endpoint)) return { ok: false };
  const id = subHash(endpoint); const oud = await kv.get('gk:nb:p:' + id);
  if (b.uit) { if (oud && oud.actief) { oud.actief = false; oud.uitAt = Date.now(); await kv.set('gk:nb:p:' + id, oud); await kv.raw(['SREM', 'gk:nb:push', id]); await tel('push-uit'); } return { ok: true }; }
  if (oud && oud.actief) return { ok: true };
  await kv.set('gk:nb:p:' + id, { endpoint, actief: true, at: Date.now(), gezien: GIDS_IDS.slice(), nieuwsAt: Date.now() }); await kv.raw(['SADD', 'gk:nb:push', id]); await tel('push', b.waar); return { ok: true };
}
export async function bericht(b) {
  const endpoint = String(b.endpoint || ''); const m = goedeEndpoint(endpoint) ? await kv.get('gk:nb:bericht:' + subHash(endpoint)) : null;
  return m || { title: 'Nieuw bij Kadoly', body: 'Bekijk de nieuwste keuzehulp', url: HOST + '/' };
}
export async function vapidPub() { return (await vapid()).pub; }
export const SW = `self.addEventListener('install',function(e){self.skipWaiting()});self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('push',function(e){e.waitUntil(self.registration.pushManager.getSubscription().then(function(s){return fetch('/nieuws/bericht',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({endpoint:s&&s.endpoint})}).then(function(r){return r.json()})}).catch(function(){return {}}).then(function(m){if(!m||!m.title)m={title:'Nieuw bij Kadoly',body:'Bekijk de nieuwste keuzehulp',url:'/'};return self.registration.showNotification(m.title,{body:m.body,icon:'${LOGO}',badge:'https://cdn.kadoly.com/icon/shop/icon-32.png?v=1',tag:'kadoly-nieuws',data:{url:m.url}})}))});
self.addEventListener('notificationclick',function(e){e.notification.close();e.waitUntil(self.clients.openWindow((e.notification.data&&e.notification.data.url)||'/'))});`;

// ---------- ronde: elke dag meldingen, op vrijdag de mail ----------
const amsterdam = () => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).formatToParts(new Date()).map(x => [x.type, x.value])); return { dag: p.year + '-' + p.month + '-' + p.day, wd: p.weekday }; };
const week = d => { const t = new Date(d + 'T12:00:00Z'); const j = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-w' + Math.ceil(((t - j) / 864e5 + j.getUTCDay() + 1) / 7); };
const klikUrl = (k, kanaal) => HOST + '/nieuws/klik?k=' + kanaal + '&' + (/^n-/.test(k) ? 'n=' : 'g=') + encodeURIComponent(k);

export async function ronde({ droog = false, test = '', mailNu = false } = {}) {
  try { await domein(false); } catch (e) {} // houdt gk:nb:mailklaar bij
  const start = Date.now(); const A = amsterdam(); const items = await nieuwsItems(); const uit = { dag: A.dag, droog, push: 0, pushGeen: 0, pushWeg: 0, mail: 0, mailGeen: 0, fouten: [] };
  if (test) { // testmail naar één adres (alleen via de beschermde host): de nieuwste drie gidsen en het nieuws
    const g = gidsenNieuw().slice(0, 3); await stuur([{ to: [test], subject: '[test] ' + onderwerp(g, items), html: mailWeek(g, items.slice(-3).reverse(), HOST + '/nieuws/af?t=test', k => klikUrl(k, 'm')) }]); return { ...uit, test };
  }
  if (!droog && !(await kv.raw(['SET', 'gk:nb:lock', '1', 'NX', 'EX', '240']))) return { ...uit, bezig: true };
  try {
    // meldingen: hooguit één per dag per abonnee
    for (const id of ((await kv.raw(['SMEMBERS', 'gk:nb:push'])) || [])) { if (Date.now() - start > 40000) break; try {
      const p = await kv.get('gk:nb:p:' + id); if (!p || !p.actief) continue; if (p.dag === A.dag) continue;
      const g = gidsenNieuw().find(x => !(p.gezien || []).includes(x.slug)); const n = g ? null : items.filter(x => N(x.at) > N(p.nieuwsAt)).slice(-1)[0];
      if (!g && !n) { uit.pushGeen++; continue; } if (droog) { uit.push++; continue; }
      await kv.set('gk:nb:bericht:' + id, g ? { title: 'Nieuwe keuzehulp bij Kadoly', body: g.h1, url: klikUrl(g.slug, 'p') } : { title: 'Nieuws van Kadoly', body: n.titel, url: klikUrl(n.id, 'p') }, { ex: 2 * 86400 });
      p.dag = A.dag; await kv.set('gk:nb:p:' + id, p); const r = await sendPush(p.endpoint, 'mailto:' + REPLY);
      if (r.ok) { if (g) p.gezien = GIDS_IDS.slice(); else p.nieuwsAt = n.at; await kv.set('gk:nb:p:' + id, p); uit.push++; await tel('push-verstuurd'); }
      else if (r.gone) { p.actief = false; await kv.set('gk:nb:p:' + id, p); await kv.raw(['SREM', 'gk:nb:push', id]); uit.pushWeg++; }
      else uit.fouten.push('push ' + r.status);
    } catch (e) { uit.fouten.push(String(e.message || e).slice(0, 80)); } }
    // mail: op vrijdag, één per week per abonnee, alleen met iets nieuws
    if (A.wd === 'Fri' || mailNu) { const wk = week(A.dag); let rij = [];
      const verstuur = async () => { if (!rij.length) return; const r = rij; rij = []; if (droog) { uit.mail += r.length; return; } try { await stuur(r.map(x => x.m), 'kd-nb-' + wk + '-' + h(r.map(x => x.id).join(',')).slice(0, 24)); for (const x of r) { x.s.gezien = GIDS_IDS.slice(); x.s.nieuwsAt = Date.now(); x.s.laatsteMail = Date.now(); await kv.set('gk:nb:e:' + x.id, x.s); await tel('mail'); } uit.mail += r.length; } catch (e) { uit.fouten.push(String(e.message || e).slice(0, 120)); for (const x of r) await kv.raw(['DEL', 'gk:nb:wk:' + x.id + ':' + wk]); } };
      for (const id of ((await kv.raw(['SMEMBERS', 'gk:nb:emails'])) || [])) { if (Date.now() - start > 50000) break; try {
        const s = await kv.get('gk:nb:e:' + id); if (!s || !s.actief) continue;
        const g = gidsenNieuw().filter(x => !(s.gezien || []).includes(x.slug)).slice(0, 6); const n = items.filter(x => N(x.at) > N(s.nieuwsAt)).slice(-3).reverse();
        if (!g.length && !n.length) { uit.mailGeen++; continue; }
        if (!droog && !(await kv.raw(['SET', 'gk:nb:wk:' + id + ':' + wk, '1', 'NX', 'EX', String(8 * 86400)]))) continue;
        const af = HOST + '/nieuws/af?t=' + s.af;
        rij.push({ id, s, m: { to: [s.email], subject: onderwerp(g, n), html: mailWeek(g, n, af, k => klikUrl(k, 'm')), headers: { 'List-Unsubscribe': '<' + af + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } });
        if (rij.length >= 50) await verstuur();
      } catch (e) { uit.fouten.push(String(e.message || e).slice(0, 80)); } }
      await verstuur(); }
  } finally { if (!droog) await kv.raw(['DEL', 'gk:nb:lock']); }
  if (!droog) await kv.set('gk:nb:laatste', { ...uit, at: new Date().toISOString() });
  return uit;
}

export async function klik(q) {
  const k = q.get('k') === 'p' ? 'p' : 'm'; const g = String(q.get('g') || ''); const n = String(q.get('n') || '');
  await tel('klik-' + k); const bron = k === 'p' ? 'push' : 'nieuwsbrief';
  if (GIDSEN[g]) return HOST + '/' + g + '?utm_source=' + bron + '&utm_medium=owned&utm_campaign=kadoly-nieuws';
  if (n) { const it = (await nieuwsItems()).find(x => x.id === n); if (it && /^https:\/\/([a-z0-9-]+\.)*kadoly\.com(\/|$)/i.test(it.url || '')) { const u = new URL(it.url); u.searchParams.set('utm_source', bron); u.searchParams.set('utm_medium', 'owned'); u.searchParams.set('utm_campaign', 'kadoly-nieuws'); return u.toString(); } }
  return HOST + '/';
}

export async function nieuwsZet(q) { // alleen via de beschermde vercel.app-host
  let l = await nieuwsItems(); const weg = q.get('weg');
  if (weg) { l = l.filter(x => x.id !== weg); await kv.set('gk:nb:nieuws', l); return { ok: true, nieuws: l }; }
  const titel = String(q.get('titel') || '').trim().slice(0, 90), tekst = String(q.get('tekst') || '').trim().slice(0, 300), url = String(q.get('url') || '').trim();
  if (!titel) return { ok: true, nieuws: l };
  if (!/^https:\/\/([a-z0-9-]+\.)*kadoly\.com(\/|$)/i.test(url)) return { ok: false, fout: 'url moet een kadoly.com-adres zijn' };
  const it = { id: 'n-' + Date.now().toString(36), at: Date.now(), titel, tekst, url }; l.push(it); l = l.slice(-30); await kv.set('gk:nb:nieuws', l); return { ok: true, nieuw: it, nieuws: l };
}

export async function stand(beschermd) {
  const [e, p] = await Promise.all([kv.raw(['SCARD', 'gk:nb:emails']), kv.raw(['SCARD', 'gk:nb:push'])]);
  const uit = { mailAbonnees: N(e), meldingAbonnees: N(p), laatsteRonde: await kv.get('gk:nb:laatste').catch(() => null), nieuws: await nieuwsItems() };
  if (beschermd) { try { const key = await mailSleutel(); const r = await fetch('https://api.resend.com/domains', { headers: { authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(8000) }); const j = await r.json(); uit.maildomeinen = (j.data || []).map(d => ({ naam: d.name, status: d.status })); uit.afzender = FROM(); } catch (x) { uit.maildomeinen = 'onbekend'; } }
  return uit;
}

// ---------- het blok op de pagina's ----------
export const NB_CSS = `.nb{margin:44px 0 0;border:1px solid var(--line);border-radius:22px;background:var(--acc2);padding:26px 24px 20px;color:var(--ink)}
.nb-kick{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0 0 10px}.nb-kick i{width:8px;height:8px;border-radius:50%;background:var(--acc);display:inline-block}
.nb h2{font-size:clamp(22px,4.6vw,28px);line-height:1.2;margin:0 0 8px;letter-spacing:-.01em}.nb-sub{margin:0 0 18px;font-size:17px;line-height:1.5}
.nb-f{display:flex;gap:8px;flex-wrap:wrap}.nb-f input[type=email]{flex:1 1 220px;min-width:0;height:50px;border:1px solid var(--line-strong);border-radius:14px;background:var(--bg);color:var(--ink);font:inherit;font-size:17px;padding:0 14px}
.nb-f input[type=email]:focus{outline:2px solid var(--acc);outline-offset:1px;border-color:var(--acc)}.nb-f button{height:50px;border:0;border-radius:14px;background:var(--prim);color:var(--on-prim);font:inherit;font-size:17px;font-weight:700;padding:0 22px;cursor:pointer}.nb-f button:disabled{opacity:.6}
.nb-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;opacity:0}.vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.nb-p{display:inline-flex;align-items:center;justify-content:flex-start;text-align:left;width:auto;min-height:0;height:auto;border-radius:0;box-shadow:none;gap:8px;margin:12px 0 0;padding:0;border:0;background:none;color:var(--ink);font:inherit;font-size:16px;font-weight:600;cursor:pointer;text-decoration:underline;text-underline-offset:3px}.nb-p svg{flex:none}.nb-p:disabled{opacity:.6}
.nb-pk{display:inline-flex;align-items:center;gap:10px;height:50px;border:0;border-radius:999px;background:var(--prim);color:var(--on-prim);font:inherit;font-size:17px;font-weight:700;padding:0 24px;cursor:pointer;margin:2px 0 0}.nb-pk:disabled{opacity:.6}
.nb-pz{margin:12px 0 0;font-size:16px}.nb-pz button{border:0;background:none;padding:0;font:inherit;color:var(--ink);text-decoration:underline;cursor:pointer}
.nb-o{margin:12px 0 0;font-size:16px;font-weight:600}.nb-o:empty{display:none}.nb-fout{color:#B42318}.nb-klaar .nb-o{background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:14px 16px;font-weight:500}
.nb-tr{list-style:none;margin:18px 0 0;padding:16px 0 0;border-top:1px solid var(--line);display:grid;grid-template-columns:1fr 1fr;gap:8px 18px;font-size:15px}.nb-tr li{display:flex;gap:8px;align-items:flex-start;margin:0}.nb-tr svg{flex:none;margin-top:3px}
.nb-voet{margin:14px 0 0;font-size:14px;line-height:1.5}.nb-voet a{color:var(--ink)}
@media(max-width:560px){.nb{padding:22px 18px 18px;border-radius:18px}.nb-tr{grid-template-columns:1fr}.nb-f button{flex:1 1 100%}}`;
const VINK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9BF0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const BEL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';

export function blok(G, { alleenPush = false, mail = true } = {}) {
  const nieuw = gidsenNieuw()[0]; const aantal = GIDS_IDS.length;
  const groot = alleenPush || !mail; const push = `<button type="button" class="${groot ? 'nb-pk' : 'nb-p'}" id="nbp" hidden>${BEL}<span>${groot ? 'Zet meldingen aan' : 'Liever een melding in je browser, zonder e-mailadres'}</span></button><p class="nb-pz" id="nbz" hidden>${VINK} Meldingen staan aan: hooguit één per dag. <button type="button" id="nbu">Zet uit</button></p><p class="nb-o" id="nbo" role="status" aria-live="polite"></p>`;
  if (!mail && !alleenPush) return `<section class="nb" id="nb" data-g="${esc(G)}" data-alleen="1" aria-labelledby="nb-h"><p class="nb-kick"><i></i>Kadoly-nieuws</p><h2 id="nb-h">Zie een nieuwe keuzehulp meteen</h2><p class="nb-sub">Er komt bijna elke dag een eerlijke keuzehulp bij. Zet meldingen aan en je ziet hem de dag dat hij verschijnt, samen met het nieuws van Kadoly.</p>${push}
<ul class="nb-tr"><li>${VINK}<span>Geen e-mailadres nodig</span></li><li>${VINK}<span>Hooguit één melding per dag</span></li><li>${VINK}<span>Uitzetten met één klik</span></li><li>${VINK}<span>Geen reclame van anderen</span></li></ul>
<p class="nb-voet">${nieuw ? `Nieuwste keuzehulp: <a href="/${esc(nieuw.slug)}">${esc(kortNaam(nieuw))}</a>, ${esc(datumNl(nieuw.bijgewerkt))} · ${aantal} keuzehulpen<br>` : ''}Van Kadoly Shop, ADSFAIR B.V., KVK 60126035, Gouda · <a href="https://kadoly.com/privacy">Privacybeleid</a></p></section>`;
  if (alleenPush) return `<section class="nb" id="nb" data-g="${esc(G)}" aria-labelledby="nb-h"><p class="nb-kick"><i></i>Ook handig</p><h2 id="nb-h">Liever meteen een seintje?</h2><p class="nb-sub">Zet meldingen aan en je ziet een nieuwe keuzehulp de dag dat hij verschijnt. Hooguit één per dag, uitzetten kan altijd.</p>${push}</section>`;
  return `<section class="nb" id="nb" data-g="${esc(G)}" aria-labelledby="nb-h"><p class="nb-kick"><i></i>Kadoly-nieuws</p><h2 id="nb-h">Nieuwe keuzehulpen in je mailbox</h2><p class="nb-sub">Er komt bijna elke dag een eerlijke keuzehulp bij. Op vrijdag krijg je ze gebundeld, samen met het nieuws van Kadoly. Is er niets nieuws, dan sturen we niets.</p>
<form class="nb-f" id="nbf" novalidate><label class="vh" for="nbe">Je e-mailadres</label><input id="nbe" type="email" name="email" autocomplete="email" inputmode="email" placeholder="jouw@e-mailadres.nl" maxlength="254" required><input type="text" name="website" class="nb-hp" tabindex="-1" autocomplete="off" aria-hidden="true"><button type="submit">Aanmelden</button></form>${push}
<ul class="nb-tr"><li>${VINK}<span>Eerst bevestigen, dan pas mail</span></li><li>${VINK}<span>Hooguit één mail per week</span></li><li>${VINK}<span>Afmelden met één klik, in elke mail</span></li><li>${VINK}<span>Alleen je e-mailadres, geen naam</span></li><li>${VINK}<span>We delen of verkopen je adres nooit</span></li><li>${VINK}<span>Geen reclame van anderen</span></li></ul>
<p class="nb-voet">${nieuw ? `Nieuwste keuzehulp: <a href="/${esc(nieuw.slug)}">${esc(kortNaam(nieuw))}</a>, ${esc(datumNl(nieuw.bijgewerkt))} · ${aantal} keuzehulpen · ` : ''}<a href="/nieuws?voorbeeld=1">Bekijk een voorbeeldmail</a><br>Van Kadoly Shop, ADSFAIR B.V., KVK 60126035, Gouda · <a href="https://kadoly.com/privacy">Privacybeleid</a></p></section>`;
}

export const NB_SCRIPT = `<script>(function(){var S=document.getElementById('nb');if(!S)return;var G=S.getAttribute('data-g'),f=document.getElementById('nbf'),e=document.getElementById('nbe'),o=document.getElementById('nbo'),pb=document.getElementById('nbp'),pz=document.getElementById('nbz'),pu=document.getElementById('nbu'),T0=Date.now(),z={};
function t(x){if(z[x])return;z[x]=1;try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(G)+'&s='+x)}catch(y){}}
var W=(location.pathname.replace(/^\\/+|\\/+$/g,'').replace(/\\//g,'-').replace(/[^a-z0-9-]/g,'')||'home').slice(0,40);
try{new IntersectionObserver(function(l){l.forEach(function(x){if(x.isIntersecting)t('nb-zie')})},{threshold:.5}).observe(S)}catch(y){}
function zeg(m,fout){o.textContent=m;o.className='nb-o'+(fout?' nb-fout':'')}
function post(u,b){return fetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(function(r){return r.json()})}
if(f){e.addEventListener('focus',function(){t('nb-focus')});f.addEventListener('submit',function(x){x.preventDefault();var v=e.value.trim();if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v)){zeg('Dat lijkt geen geldig e-mailadres.',1);e.focus();return}
var b=f.querySelector('button');b.disabled=true;post('/nieuws',{email:v,website:f.website.value,waar:W,ms:Date.now()-T0}).then(function(d){if(!d.ok)throw d;f.hidden=true;S.classList.add('nb-klaar');t('nb-aanvraag');zeg('Bijna klaar. We stuurden een mail naar '+v+'. Klik op de knop in die mail om te bevestigen. Niet binnen? Kijk even bij spam of ongewenst.')}).catch(function(d){b.disabled=false;zeg(d&&d.fout==='email'?'Dat lijkt geen geldig e-mailadres.':'Dat lukte nu niet. Probeer het zo nog eens.',1)})})}
var kan='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
function k8(s){s=(s+'===='.slice((s.length+3)%4)).replace(/-/g,'+').replace(/_/g,'/');var r=atob(s),a=new Uint8Array(r.length);for(var i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a}
function aan(){pb.hidden=true;pz.hidden=false}
if(!f&&S.getAttribute('data-alleen')&&!(kan&&Notification.permission!=='denied')){S.hidden=true;return}
if(kan&&Notification.permission!=='denied'){pb.hidden=false;navigator.serviceWorker.getRegistration('/').then(function(r){return r&&r.pushManager.getSubscription()}).then(function(s){if(s)aan()}).catch(function(){})}
pb.addEventListener('click',function(){t('nb-push-klik');pb.disabled=true;var reg;navigator.serviceWorker.register('/kadoly-sw.js',{scope:'/'}).then(function(r){reg=r;return navigator.serviceWorker.ready}).then(function(){return fetch('/nieuws/push').then(function(r){return r.json()})}).then(function(d){return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:k8(d.vapid)})}).then(function(s){return post('/nieuws/push',{endpoint:s.endpoint,waar:W})}).then(function(d){if(!d.ok)throw 0;aan();zeg('');t('nb-push-aan')}).catch(function(){pb.disabled=false;if(Notification.permission==='denied'){pb.hidden=true;zeg('Je browser blokkeert meldingen van deze site. Dat kun je in de instellingen van je browser veranderen.',1)}else zeg('Meldingen aanzetten lukte niet in deze browser.',1)})});
pu.addEventListener('click',function(){navigator.serviceWorker.getRegistration('/').then(function(r){return r&&r.pushManager.getSubscription()}).then(function(s){if(!s)return;post('/nieuws/push',{endpoint:s.endpoint,uit:1}).catch(function(){});return s.unsubscribe()}).then(function(){pz.hidden=true;pb.hidden=false;pb.disabled=false;zeg('Meldingen staan uit.')}).catch(function(){})});})();</script>`;
