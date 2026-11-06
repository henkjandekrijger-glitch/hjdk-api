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
// winactie (Henkjan 2 nov 2026: "als je abonneert krijg 1 iemand per week een gratis product, we trekken iedere week een kandidaat ... deze persoon in de email noemen en laten reageren. Maak dit lerend en kijk met a b test of dan meer emails worden ingevoerd")
const PRIJS_MAX = 30; // euro incl. verzending; aan te passen met kv gk:nb:prijs
const PERSONEEL = /@(yoo\.rs|kadoly\.com|adsfair\.xyz)$|^henkjandekrijger@gmail\.com$/i; // medewerkers doen niet mee (spelregels)
const DRAND = 'https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971/public/latest'; // openbare toevalsgenerator (quicknet)
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

export function mailWeek(gidsen, nieuws, afUrl, klik, win) {
  const L = (x, k) => klik ? klik(x, k) : '#';
  const rij = (titel, tekst, href, knoptekst, eerste) => `<div style="${eerste ? '' : 'border-top:1px solid #D6ECFC;'}padding:${eerste ? '0' : '20px'} 0 20px"><a href="${href}" style="font-size:18px;line-height:1.3;font-weight:700;color:#0B0D12;text-decoration:none">${esc(titel)}</a><p style="margin:6px 0 10px">${esc(kortTekst(tekst))}</p><a href="${href}" style="color:#1D9BF0;font-weight:700;text-decoration:none">${esc(knoptekst)} →</a></div>`;
  let i = 0; const delen = [];
  if (gidsen.length) delen.push(`<p style="margin:0 0 14px;font-weight:700;color:#1D9BF0;font-size:13px;letter-spacing:.06em;text-transform:uppercase">${gidsen.length === 1 ? 'Nieuwe keuzehulp' : 'Nieuwe keuzehulpen'}</p>` + gidsen.map(g => rij(g.h1, g.kort, L(g.slug, 'g'), 'Lees de keuzehulp', i++ === 0)).join(''));
  if (nieuws.length) { i = 0; delen.push(`<p style="margin:${gidsen.length ? '10px' : '0'} 0 14px;font-weight:700;color:#1D9BF0;font-size:13px;letter-spacing:.06em;text-transform:uppercase">Nieuws van Kadoly</p>` + nieuws.map(n => rij(n.titel, n.tekst, L(n.id, 'n'), 'Lees meer', i++ === 0)).join('')); }
  return mailSchil({ titel: 'Nieuw bij Kadoly', voorkop: gidsen.length ? gidsen.map(g => kortNaam(g)).join(', ') : (nieuws[0] || {}).titel || '',
    inhoud: `<h1 style="font-size:26px;line-height:1.2;margin:0 0 6px">Nieuw bij Kadoly</h1><p style="margin:0 0 22px">Wat er sinds je vorige mail bij kwam. Eerlijke keuzehulpen: ook als iets níet bij je past, staat dat erin.</p>${delen.join('')}${win || ''}`,
    voet: `Je krijgt deze mail omdat je je bij Kadoly (kadoly.com of gids.kadoly.com) aanmeldde en je adres bevestigde. Hooguit één mail per week, alleen als er iets nieuws is. <a href="${afUrl}" style="color:#0B0D12;font-weight:700">Afmelden met één klik</a><br><br>${esc(BEDRIJF)}<br>Vragen? Antwoord gewoon op deze mail.` });
}
const onderwerp = (gidsen, nieuws, win) => !gidsen.length && !nieuws.length && win ? 'Winactie Kadoly: wie won er?' : gidsen.length === 1 ? 'Nieuwe keuzehulp: ' + kortNaam(gidsen[0]) : gidsen.length > 1 ? gidsen.length + ' nieuwe keuzehulpen bij Kadoly' : 'Nieuws van Kadoly: ' + ((nieuws[0] || {}).titel || '');

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

// Een NIET-werkend domein bij Resend weghalen om plek te maken (Resend Pro = 10 domeinen). Alleen op Henkjans woord, alleen met de exacte
// naam, en nooit een geverifieerd domein (dat verstuurt nog mail).
export async function domeinWeg(naam) {
  const key = await mailSleutel(); if (!key) return { ok: false, fout: 'geen mailsleutel' }; const H = { authorization: 'Bearer ' + key, 'content-type': 'application/json' };
  const lijst = await (await fetch('https://api.resend.com/domains', { headers: H, signal: AbortSignal.timeout(8000) })).json(); const d = (lijst.data || []).find(x => x.name === String(naam || ''));
  if (!d) return { ok: false, fout: 'domein niet gevonden: ' + naam };
  if (d.status === 'verified') return { ok: false, fout: d.name + ' is geverifieerd en verstuurt mail: wordt niet weggehaald' };
  const r = await fetch('https://api.resend.com/domains/' + d.id, { method: 'DELETE', headers: H, signal: AbortSignal.timeout(8000) });
  return { ok: r.ok, weg: d.name, status: d.status, http: r.status };
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
  const arm = b.arm === 'w' ? 'w' : 'c'; const t = tok(); const mid = /^[0-9a-f]{12}$/.test(String(b.mid || '')) ? String(b.mid) : undefined; // mid: beslissing van de lerende modal (lib/modal.js), die leert dan ook op bevestigd
  await kv.set('gk:nb:pending:' + h(t), { id, email, at: Date.now(), arm, waar: String(b.waar || '').slice(0, 40) || undefined, mid }, { ex: 2 * 86400 });
  await stuur([{ to: [email], subject: 'Bevestig je aanmelding bij Kadoly', html: mailBevestig(HOST + '/nieuws/bevestig?t=' + t) }], 'kd-nb-bevestig-' + h(t).slice(0, 32));
  await tel('aanvraag', b.waar); await tel('aanvraag-' + arm); return { ok: true };
}
export async function bevestigOpen(t) { if (!/^[a-f0-9]{48}$/.test(t || '')) return null; return await kv.get('gk:nb:pending:' + h(t)); }
export async function bevestig(t) {
  const p = await bevestigOpen(t); if (!p) return null; const oud = await kv.get('gk:nb:e:' + p.id); if (p.klaar || (oud && oud.actief)) return { ...(oud || { email: p.email }), al: true };
  const af = (oud && oud.af) || tok(); const s = { email: p.email, actief: true, arm: p.arm || 'c', at: (oud && oud.at) || p.at, bevestigd: Date.now(), af, gezien: GIDS_IDS.slice(), nieuwsAt: Date.now() };
  await kv.set('gk:nb:e:' + p.id, s); await kv.set('gk:nb:af:' + h(af), p.id); await kv.raw(['SADD', 'gk:nb:emails', p.id]); await kv.set('gk:nb:pending:' + h(t), { ...p, klaar: Date.now() }, { ex: 2 * 86400 }); // tweede klik op de link: "je was al aangemeld"
  await tel('bevestigd'); await tel('bevestigd-' + (p.arm || 'c'));
  if (p.mid) { try { const M = await import('./modal.js'); await M.modalUitkomst(kv, p.mid, 'bevestigd'); } catch (e) {} }
  return s;
}
export async function afmelden(t, weer) {
  if (!/^[a-f0-9]{48}$/.test(t || '')) return null; const id = await kv.get('gk:nb:af:' + h(t)); if (!id) return null; const s = await kv.get('gk:nb:e:' + id); if (!s) return null;
  if (weer) { if (!s.actief) { s.actief = true; s.weer = Date.now(); await kv.set('gk:nb:e:' + id, s); await kv.raw(['SADD', 'gk:nb:emails', id]); await tel('weer'); } return s; }
  if (s.actief) { s.actief = false; s.afAt = Date.now(); await kv.set('gk:nb:e:' + id, s); await kv.raw(['SREM', 'gk:nb:emails', id]); await tel('af'); await tel('af-' + (s.arm || 'c')); } return s;
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
    // winactie: verlopen prijzen en reactievragen (elke dag)
    try { uit.winactie = await winDagelijks(droog); } catch (e) { uit.fouten.push('winactie ' + String(e.message || e).slice(0, 80)); }
    // mail: op vrijdag, één per week per abonnee, alleen met iets nieuws; eerst de trekking
    if (A.wd === 'Fri' || mailNu) { const wk = week(A.dag); let rij = [];
      if (await mailKlaar()) { try { uit.trekking = await trekking(wk, droog); } catch (e) { uit.fouten.push('trekking ' + String(e.message || e).slice(0, 80)); } }
      const WI = await winInfo(wk), max = await prijsMax(), winH = winHtml(WI, max), winNieuws = !!((WI.vorige && !WI.vorige.genoemd) || WI.reactie);
      const verstuur = async () => { if (!rij.length) return; const r = rij; rij = []; if (droog) { uit.mail += r.length; return; } try { await stuur(r.map(x => x.m), 'kd-nb-' + wk + '-' + h(r.map(x => x.id).join(',')).slice(0, 24)); for (const x of r) { x.s.gezien = GIDS_IDS.slice(); x.s.nieuwsAt = Date.now(); x.s.laatsteMail = Date.now(); await kv.set('gk:nb:e:' + x.id, x.s); await tel('mail'); } uit.mail += r.length; } catch (e) { uit.fouten.push(String(e.message || e).slice(0, 120)); for (const x of r) await kv.raw(['DEL', 'gk:nb:wk:' + x.id + ':' + wk]); } };
      for (const id of ((await kv.raw(['SMEMBERS', 'gk:nb:emails'])) || [])) { if (Date.now() - start > 50000) break; try {
        const s = await kv.get('gk:nb:e:' + id); if (!s || !s.actief) continue;
        const g = gidsenNieuw().filter(x => !(s.gezien || []).includes(x.slug)).slice(0, 6); const n = items.filter(x => N(x.at) > N(s.nieuwsAt)).slice(-3).reverse();
        if (!g.length && !n.length && !winNieuws) { uit.mailGeen++; continue; }
        if (!droog && !(await kv.raw(['SET', 'gk:nb:wk:' + id + ':' + wk, '1', 'NX', 'EX', String(8 * 86400)]))) continue;
        const af = HOST + '/nieuws/af?t=' + s.af;
        rij.push({ id, s, m: { to: [s.email], subject: onderwerp(g, n, winNieuws), html: mailWeek(g, n, af, k => klikUrl(k, 'm'), winH), headers: { 'List-Unsubscribe': '<' + af + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } });
        if (rij.length >= 50) await verstuur();
      } catch (e) { uit.fouten.push(String(e.message || e).slice(0, 80)); } }
      await verstuur();
      if (!droog && uit.mail) { if (WI.vorige && !WI.vorige.genoemd) { WI.vorige.genoemd = Date.now(); await kv.set('gk:nb:trek:' + WI.vorige.wk, WI.vorige); } if (WI.reactie) { WI.reactie.reactieGenoemd = Date.now(); await kv.set('gk:nb:trek:' + WI.reactie.wk, WI.reactie); } } }
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
  const ab = await armStand(28); const uit = { mailAbonnees: N(e), meldingAbonnees: N(p), abProef: { armen: { c: 'zonder winactie', w: 'met winactie' }, stand28d: ab, kansWinactieBeter: (ab.c.zie + ab.w.zie) ? Math.round(kansBeter(ab) * 1000) / 1000 : null, verkeerNaarWinactie: await nbKans() }, trekkingen: await trekkingen(), laatsteRonde: await kv.get('gk:nb:laatste').catch(() => null), nieuws: await nieuwsItems() };
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
.nb [data-a]{display:none}.nb:not([data-arm]) span[data-a=c],.nb[data-arm=c] span[data-a=c],.nb[data-arm=w] span[data-a=w]{display:inline}.nb:not([data-arm]) ul[data-a=c],.nb[data-arm=c] ul[data-a=c],.nb[data-arm=w] ul[data-a=w]{display:grid}
@media(max-width:560px){.nb{padding:22px 18px 18px;border-radius:18px}.nb-tr{grid-template-columns:1fr}.nb-f button{flex:1 1 100%}}`;
const VINK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9BF0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const BEL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';

export function blok(G, { alleenPush = false, mail = true, info = {} } = {}) {
  const nieuw = gidsenNieuw()[0]; const aantal = GIDS_IDS.length;
  const groot = alleenPush || !mail; const push = `<button type="button" class="${groot ? 'nb-pk' : 'nb-p'}" id="nbp" hidden>${BEL}<span>${groot ? 'Zet meldingen aan' : 'Liever een melding in je browser, zonder e-mailadres'}</span></button><p class="nb-pz" id="nbz" hidden>${VINK} Meldingen staan aan: hooguit één per dag. <button type="button" id="nbu">Zet uit</button></p><p class="nb-o" id="nbo" role="status" aria-live="polite"></p>`;
  if (!mail && !alleenPush) return `<section class="nb" id="nb" data-g="${esc(G)}" data-alleen="1" aria-labelledby="nb-h"><p class="nb-kick"><i></i>Kadoly-nieuws</p><h2 id="nb-h">Zie een nieuwe keuzehulp meteen</h2><p class="nb-sub">Er komt bijna elke dag een eerlijke keuzehulp bij. Zet meldingen aan en je ziet hem de dag dat hij verschijnt, samen met het nieuws van Kadoly.</p>${push}
<ul class="nb-tr"><li>${VINK}<span>Geen e-mailadres nodig</span></li><li>${VINK}<span>Hooguit één melding per dag</span></li><li>${VINK}<span>Uitzetten met één klik</span></li><li>${VINK}<span>Geen reclame van anderen</span></li></ul>
<p class="nb-voet">${nieuw ? `Nieuwste keuzehulp: <a href="/${esc(nieuw.slug)}">${esc(kortNaam(nieuw))}</a>, ${esc(datumNl(nieuw.bijgewerkt))} · ${aantal} keuzehulpen<br>` : ''}Van Kadoly Shop, ADSFAIR B.V., KVK 60126035, Gouda · <a href="https://kadoly.com/privacy">Privacybeleid</a></p></section>`;
  if (alleenPush) return `<section class="nb" id="nb" data-g="${esc(G)}" aria-labelledby="nb-h"><p class="nb-kick"><i></i>Ook handig</p><h2 id="nb-h">Liever meteen een seintje?</h2><p class="nb-sub">Zet meldingen aan en je ziet een nieuwe keuzehulp de dag dat hij verschijnt. Hooguit één per dag, uitzetten kan altijd.</p>${push}</section>`;
  const ab = (c, w) => `<span data-a="c">${c}</span><span data-a="w">${w}</span>`; const mx = N(info.max) || PRIJS_MAX;
  const winRegel = info.vorige ? 'Vorige winnaar: ' + esc(info.vorige) : 'Eerste trekking: ' + esc(info.eerste || 'de eerste vrijdag met aanmelders');
  const TR = l => l.map(x => `<li>${VINK}<span>${x}</span></li>`).join('');
  return `<section class="nb" id="nb" data-g="${esc(G)}" data-kans="${N(info.kans) || 0.5}" aria-labelledby="nb-h"><p class="nb-kick"><i></i>${ab('Kadoly-nieuws', 'Kadoly-nieuws · winactie')}</p><h2 id="nb-h">${ab('Nieuwe keuzehulpen in je mailbox', 'Elke week kans op een gratis product')}</h2><p class="nb-sub">${ab('Er komt bijna elke dag een eerlijke keuzehulp bij. Op vrijdag krijg je ze gebundeld, samen met het nieuws van Kadoly. Is er niets nieuws, dan sturen we niets.', `Meld je aan voor de nieuwe keuzehulpen van Kadoly. Elke vrijdag loten we onder alle aanmelders één winnaar, die zelf een product kiest uit onze keuzehulpen, tot €${mx}, gratis thuisbezorgd. In de mail lees je wie er won en wat diegene ervan vindt.`)}</p>
<form class="nb-f" id="nbf" novalidate><label class="vh" for="nbe">Je e-mailadres</label><input id="nbe" type="email" name="email" autocomplete="email" inputmode="email" placeholder="jouw@e-mailadres.nl" maxlength="254" required><input type="text" name="website" class="nb-hp" tabindex="-1" autocomplete="off" aria-hidden="true"><button type="submit">${ab('Aanmelden', 'Aanmelden en meedoen')}</button></form>${push}
<ul class="nb-tr" data-a="c">${TR(['Eerst bevestigen, dan pas mail', 'Hooguit één mail per week', 'Afmelden met één klik, in elke mail', 'Alleen je e-mailadres, geen naam', 'We delen of verkopen je adres nooit', 'Geen reclame van anderen'])}</ul><ul class="nb-tr" data-a="w">${TR(['Eerlijk geloot met een openbare toevalsgenerator', 'Elke week opnieuw kans zolang je aangemeld bent', 'Winnaar alleen met toestemming genoemd', 'Hooguit één mail per week', 'Afmelden met één klik, in elke mail', 'We delen of verkopen je adres nooit'])}</ul>
<p class="nb-voet"><span data-a="w">${winRegel} · <a href="/nieuws/spelregels">Spelregels</a> · <a href="/nieuws/winnaars">Alle trekkingen</a><br></span>${nieuw ? `Nieuwste keuzehulp: <a href="/${esc(nieuw.slug)}">${esc(kortNaam(nieuw))}</a>, ${esc(datumNl(nieuw.bijgewerkt))} · ${aantal} keuzehulpen · ` : ''}<a href="/nieuws?voorbeeld=1">Bekijk een voorbeeldmail</a><br>Van Kadoly Shop, ADSFAIR B.V., KVK 60126035, Gouda · <a href="https://kadoly.com/privacy">Privacybeleid</a></p></section>`;
}

export const NB_SCRIPT = `<script>(function(){var S=document.getElementById('nb');if(!S)return;var G=S.getAttribute('data-g'),f=document.getElementById('nbf'),e=document.getElementById('nbe'),o=document.getElementById('nbo'),pb=document.getElementById('nbp'),pz=document.getElementById('nbz'),pu=document.getElementById('nbu'),T0=Date.now(),z={};
function t(x){if(z[x])return;z[x]=1;try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(G)+'&s='+x)}catch(y){}}
var W=(location.pathname.replace(/^\\/+|\\/+$/g,'').replace(/\\//g,'-').replace(/[^a-z0-9-]/g,'')||'home').slice(0,40);
var A;try{A=localStorage.getItem('kg_nb_arm')}catch(y){}if(f){if(A!=='c'&&A!=='w'){A=Math.random()<(Number(S.getAttribute('data-kans'))||.5)?'w':'c';try{localStorage.setItem('kg_nb_arm',A)}catch(y){}}S.setAttribute('data-arm',A)}
try{new IntersectionObserver(function(l){l.forEach(function(x){if(x.isIntersecting){t('nb-zie');if(f)t('nb-zie-'+A)}})},{threshold:.5}).observe(S)}catch(y){}
function zeg(m,fout){o.textContent=m;o.className='nb-o'+(fout?' nb-fout':'')}
function post(u,b){return fetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(function(r){return r.json()})}
if(f){e.addEventListener('focus',function(){t('nb-focus');t('nb-focus-'+A)});f.addEventListener('submit',function(x){x.preventDefault();var v=e.value.trim();if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v)){zeg('Dat lijkt geen geldig e-mailadres.',1);e.focus();return}
var b=f.querySelector('button');b.disabled=true;post('/nieuws',{email:v,website:f.website.value,waar:W,arm:A,ms:Date.now()-T0}).then(function(d){if(!d.ok)throw d;f.hidden=true;S.classList.add('nb-klaar');t('nb-aanvraag');t('nb-aanvraag-'+A);zeg('Bijna klaar. We stuurden een mail naar '+v+'. Klik op de knop in die mail om te bevestigen'+(A==='w'?', dan doe je vanaf deze vrijdag mee met de trekking':'')+'. Niet binnen? Kijk even bij spam of ongewenst.')}).catch(function(d){b.disabled=false;zeg(d&&d.fout==='email'?'Dat lijkt geen geldig e-mailadres.':'Dat lukte nu niet. Probeer het zo nog eens.',1)})})}
var kan='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
function k8(s){s=(s+'===='.slice((s.length+3)%4)).replace(/-/g,'+').replace(/_/g,'/');var r=atob(s),a=new Uint8Array(r.length);for(var i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a}
function aan(){pb.hidden=true;pz.hidden=false}
if(!f&&S.getAttribute('data-alleen')&&!(kan&&Notification.permission!=='denied')){S.hidden=true;return}
if(kan&&Notification.permission!=='denied'){pb.hidden=false;navigator.serviceWorker.getRegistration('/').then(function(r){return r&&r.pushManager.getSubscription()}).then(function(s){if(s)aan()}).catch(function(){})}
pb.addEventListener('click',function(){t('nb-push-klik');pb.disabled=true;var reg;navigator.serviceWorker.register('/kadoly-sw.js',{scope:'/'}).then(function(r){reg=r;return navigator.serviceWorker.ready}).then(function(){return fetch('/nieuws/push').then(function(r){return r.json()})}).then(function(d){return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:k8(d.vapid)})}).then(function(s){return post('/nieuws/push',{endpoint:s.endpoint,waar:W})}).then(function(d){if(!d.ok)throw 0;aan();zeg('');t('nb-push-aan')}).catch(function(){pb.disabled=false;if(Notification.permission==='denied'){pb.hidden=true;zeg('Je browser blokkeert meldingen van deze site. Dat kun je in de instellingen van je browser veranderen.',1)}else zeg('Meldingen aanzetten lukte niet in deze browser.',1)})});
pu.addEventListener('click',function(){navigator.serviceWorker.getRegistration('/').then(function(r){return r&&r.pushManager.getSubscription()}).then(function(s){if(!s)return;post('/nieuws/push',{endpoint:s.endpoint,uit:1}).catch(function(){});return s.unsubscribe()}).then(function(){pz.hidden=true;pb.hidden=false;pb.disabled=false;zeg('Meldingen staan uit.')}).catch(function(){})});})();</script>`;

// ---------- winactie en A/B-proef ----------
// Arm c = zonder winactie, arm w = met winactie (elke vrijdag één winnaar onder alle aanmelders, product naar keuze tot PRIJS_MAX).
// Maat: bevestigde aanmeldingen per keer dat het blok gezien is (nb-zie-<arm>); aanvragen en afmeldingen per arm als bewaking.
// Lerend: bij 200 keer gezien per arm en 10 bevestigingen samen schuift het verkeer naar 90% voor de arm die met 95% zekerheid beter is.
export async function prijsMax() { try { return N(await kv.get('gk:nb:prijs')) || PRIJS_MAX; } catch (e) { return PRIJS_MAX; } }
function gamma(k) { if (k < 1) return gamma(k + 1) * Math.pow(Math.random(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random()); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
export async function armStand(dagen = 28) {
  const s = { c: { zie: 0, focus: 0, aanvraag: 0, bevestigd: 0, af: 0 }, w: { zie: 0, focus: 0, aanvraag: 0, bevestigd: 0, af: 0 } };
  for (let i = 0; i < dagen; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); let a = null; try { a = await kv.raw(['HGETALL', 'gk:d:' + d]); } catch (e) {} if (!Array.isArray(a)) continue;
    for (let j = 0; j + 1 < a.length; j += 2) { const k = String(a[j]), v = N(a[j + 1]); let m; if ((m = k.match(/\|nb-(zie|focus)-([cw])$/))) s[m[2]][m[1]] += v; else if ((m = k.match(/^nb\|(aanvraag|bevestigd|af)-([cw])$/))) s[m[2]][m[1]] += v; } }
  return s;
}
export function kansBeter(s, n = 4000) { let w = 0; for (let i = 0; i < n; i++) { const pc = beta(s.c.bevestigd + 1, Math.max(0, s.c.zie - s.c.bevestigd) + 1), pw = beta(s.w.bevestigd + 1, Math.max(0, s.w.zie - s.w.bevestigd) + 1); if (pw > pc) w++; } return w / n; }
let KANS = null, KANS_AT = 0;
export async function nbKans() {
  if (KANS !== null && Date.now() - KANS_AT < 600000) return KANS; let k = 0.5;
  try { const s = await armStand(28); if (s.c.zie >= 200 && s.w.zie >= 200 && s.c.bevestigd + s.w.bevestigd >= 10) { const p = kansBeter(s); if (p > 0.95) k = 0.9; else if (p < 0.05) k = 0.1; } } catch (e) {}
  KANS = k; KANS_AT = Date.now(); return k;
}
const vrijdagNa = () => { const d = new Date(); for (let i = 0; i < 8; i++) { const x = new Date(d.getTime() + i * 864e5); if (new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Amsterdam', weekday: 'short' }).format(x) === 'Fri') return x.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'long', day: 'numeric', month: 'long' }); } return 'vrijdag'; };
const winNaam = t => t && t.toestemming && t.voornaam ? t.voornaam + (t.plaats ? ' uit ' + t.plaats : '') : '';
let INFO = null, INFO_AT = 0;
export async function blokInfo() { // voor het blok op de pagina's: kans voor arm w, vorige winnaar (alleen met toestemming), eerste trekking, prijs
  if (INFO && Date.now() - INFO_AT < 300000) return INFO; let lw = null; try { lw = await kv.get('gk:nb:laatstewinnaar'); } catch (e) {}
  INFO = { kans: await nbKans(), max: await prijsMax(), vorige: lw ? (lw.naam ? lw.naam + ' koos de ' + lw.product : 'een lezer die anoniem blijft koos de ' + lw.product) : '', eerste: vrijdagNa() }; INFO_AT = Date.now(); return INFO;
}
async function toeval() { try { const r = await fetch(DRAND, { signal: AbortSignal.timeout(5000) }); const j = await r.json(); if (j && j.randomness) return { bron: 'drand', ronde: j.round, waarde: String(j.randomness) }; } catch (e) {} return { bron: 'toevalsgenerator van de server', ronde: null, waarde: randomBytes(32).toString('hex') }; }
export async function trekking(wk, droog) {
  const key = 'gk:nb:trek:' + wk; const oud = await kv.get(key); if (oud) return { wk, al: true, deelnemers: oud.deelnemers };
  const ids = (((await kv.raw(['SMEMBERS', 'gk:nb:emails'])) || []).map(String)).sort(); const mee = [];
  for (const id of ids) { const s = await kv.get('gk:nb:e:' + id); if (s && s.actief && !PERSONEEL.test(s.email)) mee.push(id); }
  if (!mee.length) return { wk, deelnemers: 0 };
  const r = await toeval(); const lijst = h(mee.join(',')); const nr = Number(BigInt('0x' + h(r.waarde + ':' + wk + ':' + lijst)) % BigInt(mee.length));
  const t = { wk, at: Date.now(), deelnemers: mee.length, bron: r.bron, ronde: r.ronde, lijst, nr, id: mee[nr], token: tok(), status: 'getrokken' };
  if (droog) return { wk, deelnemers: mee.length, bron: r.bron, ronde: r.ronde, droog: true };
  await kv.set(key, t); await kv.set('gk:nb:win:' + h(t.token), wk, { ex: 120 * 86400 }); const L = (await kv.get('gk:nb:trekkingen')) || []; if (!L.includes(wk)) { L.push(wk); await kv.set('gk:nb:trekkingen', L.slice(-104)); }
  const s = await kv.get('gk:nb:e:' + t.id); await stuur([{ to: [s.email], subject: 'Je hebt gewonnen bij Kadoly', html: mailWinnaar(HOST + '/nieuws/winnaar?t=' + t.token, await prijsMax()) }], 'kd-nb-win-' + wk);
  await tel('trekking'); return { wk, deelnemers: mee.length, bron: r.bron, ronde: r.ronde };
}
async function winDagelijks(droog) {
  const uit = { verlopen: 0, reactieGevraagd: 0 }; if (!(await mailKlaar())) return uit;
  for (const wk of ((await kv.get('gk:nb:trekkingen')) || [])) { const t = await kv.get('gk:nb:trek:' + wk); if (!t) continue;
    if (t.status === 'getrokken' && Date.now() - t.at > 14 * 864e5) { uit.verlopen++; if (!droog) { t.status = 'verlopen'; await kv.set('gk:nb:trek:' + wk, t); } continue; }
    if (t.status === 'gekozen' && !t.reactieGevraagd && Date.now() - N(t.gekozenAt) > 10 * 864e5) { uit.reactieGevraagd++; if (droog) continue; const s = await kv.get('gk:nb:e:' + t.id);
      if (s) await stuur([{ to: [s.email], subject: 'Hoe bevalt je ' + t.keuze.naam + '?', html: mailReactie(HOST + '/nieuws/winnaar?t=' + t.token + '&reactie=1', t.keuze.naam) }], 'kd-nb-reactie-' + wk);
      t.reactieGevraagd = Date.now(); await kv.set('gk:nb:trek:' + wk, t); } }
  return uit;
}
async function winInfo(wk) {
  const T = []; for (const w of ((await kv.get('gk:nb:trekkingen')) || []).slice(-8)) { const t = await kv.get('gk:nb:trek:' + w); if (t) T.push(t); }
  return { nu: T.find(t => t.wk === wk) || null, vorige: T.filter(t => t.wk !== wk && t.status === 'gekozen').slice(-1)[0] || null, reactie: T.filter(t => t.reactie && t.reactie.toestemming && !t.reactieGenoemd).slice(-1)[0] || null };
}
function winHtml(i, max) {
  const r = []; if (i.nu && i.nu.deelnemers) r.push(`Vanavond lootten we uit ${i.nu.deelnemers} ${i.nu.deelnemers === 1 ? 'aanmelder' : 'aanmelders'}. De winnaar heeft net een mail gekregen en kiest zelf een product tot €${max}.`);
  if (i.vorige && !i.vorige.genoemd) r.push(winNaam(i.vorige) ? `<b>${esc(winNaam(i.vorige))}</b> won eerder en koos de ${esc(i.vorige.keuze.naam)}.` : `De vorige winnaar blijft liever anoniem en koos de ${esc(i.vorige.keuze.naam)}.`);
  if (i.reactie) r.push(`<b>${esc(winNaam(i.reactie) || 'De winnaar')}</b> over de ${esc(i.reactie.keuze.naam)}: “${esc(i.reactie.reactie.tekst)}”`);
  r.push(`Volgende vrijdag loten we weer. Jij doet automatisch mee zolang je bent aangemeld. <a href="${HOST}/nieuws/spelregels" style="color:#0B0D12">Spelregels</a> · <a href="${HOST}/nieuws/winnaars" style="color:#0B0D12">Alle trekkingen</a>`);
  return `<div style="margin:10px 0 0;padding:18px 20px;background:#E8F4FD;border-radius:14px"><p style="margin:0 0 10px;font-weight:700;color:#1D9BF0;font-size:13px;letter-spacing:.06em;text-transform:uppercase">Winactie</p>${r.map(x => `<p style="margin:0 0 8px">${x}</p>`).join('')}</div>`;
}
export function mailWinnaar(url, max) {
  return mailSchil({ titel: 'Je hebt gewonnen bij Kadoly', voorkop: 'Kies zelf een product, wij sturen het gratis op.',
    inhoud: `<h1 style="font-size:26px;line-height:1.2;margin:0 0 12px">Gefeliciteerd, je hebt gewonnen</h1><p style="margin:0 0 18px">Je bent deze week getrokken uit alle aanmelders van Kadoly-nieuws. Kies zelf een product uit onze keuzehulpen, tot €${max} inclusief verzending, en we sturen het gratis naar je toe.</p><p style="margin:0 0 22px">${knop(url, 'Kies je product')}</p><p style="margin:0 0 8px">Je hebt 14 dagen om te kiezen.</p><p style="margin:0;font-size:14px">Je betaalt niets en we vragen nooit om bankgegevens of een wachtwoord. Twijfel je of deze mail echt is? Antwoord gewoon, dan krijg je antwoord van een mens.</p>`,
    voet: `${esc(BEDRIJF)}<br><a href="${HOST}/nieuws/spelregels" style="color:#0B0D12">Spelregels</a>` });
}
export function mailReactie(url, product) {
  return mailSchil({ titel: 'Hoe bevalt het?', voorkop: 'Eén zin is genoeg.',
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Hoe bevalt je ${esc(product)}?</h1><p style="margin:0 0 20px">Vertel het in één zin, eerlijk, ook als het tegenvalt. Vind je het goed, dan zetten we je reactie met je voornaam in de volgende mail.</p><p style="margin:0 0 8px">${knop(url, 'Geef je reactie')}</p>`,
    voet: esc(BEDRIJF) });
}
export async function winnaarLees(t) { if (!/^[a-f0-9]{48}$/.test(t || '')) return null; const wk = await kv.get('gk:nb:win:' + h(t)); if (!wk) return null; const w = await kv.get('gk:nb:trek:' + wk); return w && w.token === t ? w : null; }
const schoon = (v, n) => String(v || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
export async function winnaarKies(t, b, opties) {
  const w = await winnaarLees(t); if (!w) return { fout: 'link' }; if (w.status !== 'getrokken') return { fout: w.status };
  const keuze = (opties || []).find(o => o.pid === String(b.pid || '')); if (!keuze) return { fout: 'product' };
  const a = { voornaam: schoon(b.voornaam, 40), achternaam: schoon(b.achternaam, 60), adres: schoon(b.adres, 100), postcode: schoon(b.postcode, 10).toUpperCase(), plaats: schoon(b.plaats, 60) };
  if (!a.voornaam || !a.achternaam || !a.adres || !/^[1-9][0-9]{3} ?[A-Z]{2}$/.test(a.postcode) || !a.plaats) return { fout: 'adres' };
  w.status = 'gekozen'; w.gekozenAt = Date.now(); w.keuze = { pid: keuze.pid, naam: keuze.naam, prijs: keuze.prijs }; w.toestemming = b.toestemming === '1' || b.toestemming === true; w.voornaam = a.voornaam; w.plaats = a.plaats;
  await kv.set('gk:nb:adres:' + w.wk, a, { ex: 60 * 86400 }); await kv.set('gk:nb:trek:' + w.wk, w);
  await kv.set('gk:nb:laatstewinnaar', { naam: w.toestemming ? winNaam(w) : '', product: keuze.naam, wk: w.wk, at: Date.now() }); INFO = null; await tel('win-gekozen');
  const s = await kv.get('gk:nb:e:' + w.id);
  try { await stuur([{ to: [REPLY], subject: 'Winactie Kadoly: bestel ' + keuze.naam + ' voor ' + a.voornaam, html: mailSchil({ titel: 'Winactie: bestellen', voorkop: keuze.naam, inhoud: `<h1 style="font-size:22px;margin:0 0 12px">Winnaar ${esc(w.wk)}: graag bestellen</h1><p style="margin:0 0 6px"><b>Product:</b> ${esc(keuze.naam)} (€${keuze.prijs.toFixed(2).replace('.', ',')} incl. verzending)<br><a href="https://kadoly.com/product/${encodeURIComponent(keuze.pid)}">kadoly.com/product/${esc(keuze.pid)}</a></p><p style="margin:12px 0 0"><b>Sturen naar:</b><br>${esc(a.voornaam)} ${esc(a.achternaam)}<br>${esc(a.adres)}<br>${esc(a.postcode)} ${esc(a.plaats)}<br>${esc(s ? s.email : '')}</p><p style="margin:12px 0 0">Naam noemen in de mail: ${w.toestemming ? 'ja' : 'nee'}. Het adres wordt na 60 dagen gewist.</p>`, voet: 'Automatisch bericht van de winactie op gids.kadoly.com' }) }], 'kd-nb-order-' + w.wk); } catch (e) { console.error('winactie bestelmail', String(e.message || e).slice(0, 120)); }
  return { ok: true, w };
}
export async function winnaarReactie(t, b) {
  const w = await winnaarLees(t); if (!w || w.status !== 'gekozen') return { fout: 'link' }; const tekst = schoon(b.tekst, 300); if (tekst.length < 3) return { fout: 'tekst' };
  w.reactie = { tekst, toestemming: b.toestemming === '1' || b.toestemming === true, at: Date.now() }; await kv.set('gk:nb:trek:' + w.wk, w); await tel('win-reactie'); return { ok: true, w };
}
export async function trekkingen() { const T = []; for (const wk of ((await kv.get('gk:nb:trekkingen')) || []).slice().reverse()) { const t = await kv.get('gk:nb:trek:' + wk); if (t) T.push({ wk, at: t.at, deelnemers: t.deelnemers, bron: t.bron, ronde: t.ronde, status: t.status, naam: winNaam(t), product: t.keuze ? t.keuze.naam : '', reactie: t.reactie && t.reactie.toestemming ? t.reactie.tekst : '' }); } return T; }
export const SPELREGELS = (max) => `<p class="kicker">Kadoly-nieuws · winactie</p><h1>Spelregels winactie</h1><dl class="rows">
<div class="r"><dt>Organisator</dt><dd>ADSFAIR B.V. (Kadoly Shop), Albert Plesmanplein 20, 2805 AB Gouda, KVK 60126035.</dd></div>
<div class="r"><dt>Meedoen</dt><dd>Gratis. Iedereen van 18 jaar of ouder met een woonadres in Nederland die is aangemeld voor Kadoly-nieuws en zijn e-mailadres heeft bevestigd, doet elke week automatisch mee, met één kans per e-mailadres. Medewerkers van Kadoly en ADSFAIR B.V. doen niet mee.</dd></div>
<div class="r"><dt>Trekking</dt><dd>Elke vrijdag rond 18:45 uur (Nederlandse tijd) loten we één winnaar uit alle deelnemers van dat moment. Het lot komt uit drand, een openbare toevalsgenerator die niemand kan sturen. Per trekking staan het aantal deelnemers en de drand-ronde op <a href="/nieuws/winnaars">Alle trekkingen</a>.</dd></div>
<div class="r"><dt>Prijs</dt><dd>Eén product naar keuze uit de keuzehulpen op gids.kadoly.com met een prijs tot €${max} inclusief verzending, gratis thuisbezorgd in Nederland. De prijs is niet in te wisselen voor geld. Eventuele kansspelbelasting betaalt Kadoly.</dd></div>
<div class="r"><dt>Winnaar</dt><dd>Krijgt dezelfde avond een mail en kiest binnen 14 dagen een product en het bezorgadres. Daarna vervalt de prijs. We vragen nooit om bankgegevens of een betaling.</dd></div>
<div class="r"><dt>Naam en reactie</dt><dd>We noemen de winnaar alleen met toestemming, met voornaam en woonplaats, in de mail en bij Alle trekkingen. Een reactie op het product plaatsen we alleen als de winnaar die zelf geeft en er toestemming voor geeft.</dd></div>
<div class="r"><dt>Privacy</dt><dd>Het bezorgadres gebruiken we alleen om de prijs te versturen en we wissen het binnen 60 dagen. Zie ook het <a href="https://kadoly.com/privacy">privacybeleid</a>.</dd></div>
<div class="r"><dt>Verder</dt><dd>We volgen de Gedragscode Promotionele Kansspelen. Kadoly mag de actie aanpassen of stoppen; dat staat dan in de mail en op deze pagina. Vragen of klachten: <a href="mailto:henkjan@yoo.rs">henkjan@yoo.rs</a>.</dd></div></dl><p class="meta">Deze spelregels gelden vanaf 2 november 2026.</p>`;
