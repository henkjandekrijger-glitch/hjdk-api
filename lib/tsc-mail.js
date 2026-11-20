// Ochtendmail per route van todayin surgery (Henkjan 14 nov 2026: "Hoe kunnen we zorgen dat we ze vasthouden en op de hoogte gaan houden
// iedere dag van ontwikkelingen" en "Ja bouw daar").
// - Aanmelden op elke pagina: e-mail plus route (ingreep, bestemming, thuisland). Niets over gezondheid of lichaam. Dubbele opt-in.
// - Na bevestigen meteen een welkomstmail met de laatste ontwikkelingen voor die route.
// - Elke ochtend (cron 08:10 UTC): alleen wie iets nieuws heeft voor zijn route krijgt een mail. Nieuws komt uit data/tsc-nieuws.json, dat de
//   geplande Claude-taak elke dag aanvult met echte feiten met bron en datum. Geen nieuws = geen mail (geen lege mails).
// - Meten (noordster zoals todayin: lezers): verstuurd, geopend (pixel), doorgeklikt (/k), per dag in tsc:d:<dag>.
// Opslag: tsc:abo:<id> {email, taal, ingreep, naar, van, actief, af, gezien[]}, set tsc:abos, tsc:pend:<hash>, tsc:af:<hash>.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { SITE, SRC, PAGES } from './tsc-data.js';
import NIEUWS from '../data/tsc-nieuws.json' with { type: 'json' };

const FROM = () => process.env.TSC_MAIL_FROM || 'todayin surgery <surgery@todayin.email>';
const REPLY = 'henkjan@todayin.email';
const BEDRIJF = 'todayin · AdsFair B.V. · Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands';
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const h = s => createHash('sha256').update(String(s)).digest('hex');
const tok = () => randomBytes(24).toString('hex');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAG = () => new Date().toISOString().slice(0, 10);
const okMail = e => /^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i.test(e) && e.length <= 254;
export const INGREPEN = ['hair', 'tummy', 'eyelid', 'lipo', 'breast', 'breast-reduction', 'breast-lift', 'bbl', 'cataract', 'rhinoplasty', 'all']; // all: van een chirurg-checkpagina, krijgt alles voor die bestemming
export const NAAR = ['turkey', 'mexico', 'colombia', 'dominican-republic', 'thailand', 'south-korea', 'abroad', 'home'];
export const VAN = ['us', 'uk', 'ca', 'au', 'nl', 'de'];
const url = slug => SITE.base + (slug ? '/' + slug : '');

const T = {
  en: { bevS: 'Confirm your morning mail from todayin surgery', bevH: 'Confirm your morning mail', bevP: 'Click the button and you get a short email on the mornings when something changes for your route: prices, rules, warnings and answers to real questions. Every fact with its source.', bevK: 'Yes, send me the morning mail', bevN: 'Did not ask for this? Then ignore this email; we will not mail you.', welS: 'Your route: what changed recently', welH: 'Welcome. This is what changed recently for your route', dagS: 'What changed for your route', dagH: 'What changed for your route', geen: 'Nothing new for your route yet. From now on you get a mail on the mornings when something changes.', lees: 'Read more', bron: 'Source', vraag: 'Ask the chat anything about your route', door: 'Forward to someone who is deciding with you', af: 'Unsubscribe in one click', voet: 'You get this email because you signed up on todayin.email/surgery and confirmed your address. Only on days when something changes. Information, not medical advice.' },
  nl: { bevS: 'Bevestig je ochtendmail van todayin surgery', bevH: 'Bevestig je ochtendmail', bevP: 'Klik op de knop en je krijgt een korte mail op de ochtenden dat er iets verandert voor jouw route: prijzen, regels, waarschuwingen en antwoorden op echte vragen. Elk feit met bron.', bevK: 'Ja, stuur me de ochtendmail', bevN: 'Niet aangevraagd? Negeer deze mail, dan mailen we je niet.', welS: 'Jouw route: wat er onlangs veranderde', welH: 'Welkom. Dit veranderde onlangs voor jouw route', dagS: 'Wat er veranderde voor jouw route', dagH: 'Wat er veranderde voor jouw route', geen: 'Nog niets nieuws voor jouw route. Vanaf nu krijg je een mail op de ochtenden dat er iets verandert.', lees: 'Lees meer', bron: 'Bron', vraag: 'Stel de chat een vraag over jouw route', door: 'Stuur door naar wie met je meebeslist', af: 'Afmelden met één klik', voet: 'Je krijgt deze mail omdat je je aanmeldde op todayin.email/surgery en je adres bevestigde. Alleen op dagen dat er iets verandert. Informatie, geen medisch advies.' },
  de: { bevS: 'Bestätigen Sie Ihre Morgenmail von todayin surgery', bevH: 'Bestätigen Sie Ihre Morgenmail', bevP: 'Klicken Sie auf den Knopf, dann bekommen Sie eine kurze Mail an den Morgen, an denen sich für Ihre Route etwas ändert: Preise, Regeln, Warnungen und Antworten auf echte Fragen. Jede Angabe mit Quelle.', bevK: 'Ja, Morgenmail schicken', bevN: 'Nicht angefordert? Dann ignorieren Sie diese Mail.', welS: 'Ihre Route: was sich zuletzt geändert hat', welH: 'Willkommen. Das hat sich zuletzt für Ihre Route geändert', dagS: 'Was sich für Ihre Route geändert hat', dagH: 'Was sich für Ihre Route geändert hat', geen: 'Noch nichts Neues für Ihre Route. Ab jetzt bekommen Sie eine Mail, wenn sich etwas ändert.', lees: 'Weiterlesen', bron: 'Quelle', vraag: 'Fragen Sie den Chat zu Ihrer Route', door: 'An jemanden weiterleiten, der mitentscheidet', af: 'Mit einem Klick abmelden', voet: 'Sie bekommen diese Mail, weil Sie sich auf todayin.email/surgery angemeldet und Ihre Adresse bestätigt haben. Nur an Tagen, an denen sich etwas ändert. Information, keine medizinische Beratung.' }
};

async function mailSleutel() { if (process.env.RESEND_API_KEY || process.env.RESEND) return process.env.RESEND_API_KEY || process.env.RESEND; try { return ((await kv.get('hjdk:secrets')) || {}).RESEND_API_KEY || ''; } catch (e) { return ''; } }
export async function stuur(mails, idem) {
  const key = await mailSleutel(); if (!key) throw Error('geen mailsleutel');
  const body = mails.map(m => ({ from: FROM(), reply_to: REPLY, ...m }));
  const r = await fetch('https://api.resend.com/emails' + (body.length > 1 ? '/batch' : ''), { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000), headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json', ...(idem ? { 'idempotency-key': idem } : {}) }, body: JSON.stringify(body.length > 1 ? body : body[0]) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw Error('mail ' + r.status + ' ' + String(j.message || j.name || '').slice(0, 120)); return j;
}
export async function tel(wat, n = 1, d = DAG()) { try { const k = 'tsc:d:' + d; await kv.raw(['HINCRBY', k, wat, String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); } catch (e) {} }

const knop = (href, t) => `<a href="${href}" style="display:inline-block;background:#0F7B5F;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px">${esc(t)}</a>`;
function schil({ taal, voorkop, inhoud, voet }) {
  return `<!doctype html><html lang="${taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#fff"><span style="display:none;max-height:0;overflow:hidden">${esc(voorkop || '')}</span><div style="max-width:560px;margin:0 auto;padding:28px 20px;font:17px/1.55 Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111113"><p style="margin:0 0 22px;font-weight:700;font-size:18px">todayin <span style="color:#0F7B5F">surgery</span></p>${inhoud}<div style="border-top:1px solid #E5E7EB;margin-top:28px;padding-top:16px;font-size:13px;color:#555">${voet}<br><br>${esc(BEDRIJF)}</div></div></body></html>`;
}

// past een nieuwsitem bij deze abonnee?
export function past(it, a) {
  const tl = it.taal === '*' || it.taal === a.taal;
  const ig = a.ingreep === 'all' || (it.ingreep || ['*']).some(x => x === '*' || x === a.ingreep);
  const nr = (it.naar || ['*']).some(x => x === '*' || x === a.naar || (x === 'abroad' && a.naar !== 'home'));
  return tl && ig && nr;
}
const items = () => (NIEUWS.items || []).slice().sort((x, y) => String(y.dag).localeCompare(String(x.dag)));

function itemHtml(it, a, t, eerste, d) {
  const k = (w) => url('k') + '?a=' + a.id.slice(0, 12) + '&i=' + encodeURIComponent(it.id) + '&w=' + w + '&d=' + d;
  const bron = SRC[it.bron];
  return `<div style="${eerste ? '' : 'border-top:1px solid #E5E7EB;'}padding:${eerste ? '0' : '18px'} 0 18px"><p style="margin:0 0 4px;font-size:13px;color:#555"><time datetime="${esc(it.dag)}">${esc(it.dag)}</time></p><a href="${k('p')}" style="font-size:19px;line-height:1.3;font-weight:700;color:#111113;text-decoration:none">${esc(it.kop)}</a><p style="margin:6px 0 8px">${esc(it.tekst)}</p><p style="margin:0;font-size:15px"><a href="${k('p')}" style="color:#0F7B5F;font-weight:700">${esc(t.lees)}</a>${bron ? ` · ${esc(t.bron)}: <a href="${k('b')}" style="color:#0F7B5F">${esc(bron.t)}</a>` : ''}</p></div>`;
}
function routeMail(a, lijst, welkom) {
  const t = T[a.taal] || T.en, d = DAG();
  const pg = Object.entries(PAGES).find(([, p]) => p.taal === a.taal && p.ingreep === a.ingreep) || Object.entries(PAGES).find(([, p]) => p.ingreep === a.ingreep) || [''];
  const deel = encodeURIComponent(url(pg[0]));
  const inhoud = `<h1 style="font-size:24px;line-height:1.25;margin:0 0 18px">${esc(welkom ? t.welH : t.dagH)}</h1>${lijst.length ? lijst.map((it, i) => itemHtml(it, a, t, i === 0, d)).join('') : `<p>${esc(t.geen)}</p>`}<p style="margin:24px 0 10px">${knop(url(pg[0]) + '#vraag', t.vraag)}</p><p style="margin:0;font-size:15px">${esc(t.door)}: <a href="https://wa.me/?text=${deel}" style="color:#0F7B5F">WhatsApp</a> · <a href="mailto:?body=${deel}" style="color:#0F7B5F">Mail</a></p><img src="${url('o')}?a=${a.id.slice(0, 12)}&d=${d}" width="1" height="1" alt="" style="display:block;border:0">`;
  return { subject: welkom ? t.welS : (lijst[0] ? lijst[0].kop : t.dagS), html: schil({ taal: a.taal, voorkop: lijst.map(x => x.kop).join(' · '), inhoud, voet: `${esc(t.voet)} <a href="${url('af')}?t=${a.af}" style="color:#111113;font-weight:700">${esc(t.af)}</a>` }), headers: { 'List-Unsubscribe': '<' + url('af') + '?t=' + a.af + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } };
}

export async function aanmelden(b, ip) {
  const email = String(b.email || '').trim().toLowerCase(); if (!okMail(email)) return { ok: false, fout: 'email' };
  if (b.website || N(b.ms) < 1500) return { ok: true }; // honingpot of te snel
  const taal = T[b.taal] ? b.taal : 'en', ingreep = INGREPEN.includes(b.ingreep) ? b.ingreep : 'hair', naar = NAAR.includes(b.naar) ? b.naar : 'abroad', van = VAN.includes(b.van) ? b.van : (taal === 'nl' ? 'nl' : taal === 'de' ? 'de' : 'us');
  const rk = 'tsc:rl:' + h(ip + ':' + Math.floor(Date.now() / 60000)).slice(0, 24); const n = await kv.incr(rk); if (n === 1) await kv.raw(['EXPIRE', rk, '120']); if (n > 6) return { ok: false, fout: 'druk' };
  const id = h('tsc:' + email).slice(0, 32); const s = await kv.get('tsc:abo:' + id); if (s && s.actief && s.ingreep === ingreep && s.naar === naar) return { ok: true };
  if (!(await kv.raw(['SET', 'tsc:er:' + id, '1', 'NX', 'EX', '600']))) return { ok: true };
  const dk = 'tsc:bevdag:' + DAG(); const dn = await kv.incr(dk); if (dn === 1) await kv.raw(['EXPIRE', dk, '172800']); if (dn > 400) return { ok: false, fout: 'druk' };
  const t = tok(), pad = String(b.pad || '').replace(/[^a-z0-9/-]/g, '').slice(0, 80);
  await kv.set('tsc:pend:' + h(t), { id, email, taal, ingreep, naar, van, pad, at: Date.now() }, { ex: 3 * 86400 });
  const L = T[taal];
  await stuur([{ to: [email], subject: L.bevS, html: schil({ taal, voorkop: L.bevP, inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">${esc(L.bevH)}</h1><p style="margin:0 0 22px">${esc(L.bevP)}</p><p style="margin:0 0 22px">${knop(url('bevestig') + '?t=' + t, L.bevK)}</p><p style="margin:0;font-size:14px">${esc(L.bevN)}</p>`, voet: esc(L.voet.split('.')[0]) + '.' }) }], 'tsc-bev-' + h(t).slice(0, 32));
  await tel('aanvraag'); await tel('aanvraag_' + taal); if (pad) await tel('aanvraag|' + pad);
  return { ok: true };
}

export async function bevestig(t) {
  if (!/^[a-f0-9]{48}$/.test(t || '')) return null; const p = await kv.get('tsc:pend:' + h(t)); if (!p) return null;
  const oud = await kv.get('tsc:abo:' + p.id); if (p.klaar) return { ...(oud || p), al: true };
  const af = (oud && oud.af) || tok();
  const a = { id: p.id, email: p.email, taal: p.taal, ingreep: p.ingreep, naar: p.naar, van: p.van, pad: p.pad, actief: true, at: (oud && oud.at) || p.at, bevestigd: Date.now(), af, gezien: (oud && oud.gezien) || [] };
  const lijst = items().filter(it => past(it, a)).slice(0, 3);
  a.gezien = [...new Set([...a.gezien, ...lijst.map(x => x.id)])].slice(-300);
  await kv.set('tsc:abo:' + p.id, a); await kv.set('tsc:af:' + h(af), p.id); await kv.raw(['SADD', 'tsc:abos', p.id]); await kv.set('tsc:pend:' + h(t), { ...p, klaar: Date.now() }, { ex: 3 * 86400 });
  await tel('bevestigd'); await tel('bevestigd_' + a.taal); if (p.pad) await tel('bevestigd|' + p.pad);
  try { const m = routeMail(a, lijst, true); await stuur([{ to: [a.email], ...m }], 'tsc-wel-' + p.id + '-' + DAG()); await tel('verstuurd'); } catch (e) { await tel('mailfout'); }
  return a;
}

export async function afmelden(t) {
  if (!/^[a-f0-9]{48}$/.test(t || '')) return null; const id = await kv.get('tsc:af:' + h(t)); if (!id) return null; const a = await kv.get('tsc:abo:' + id); if (!a) return null;
  if (a.actief) { a.actief = false; a.afAt = Date.now(); await kv.set('tsc:abo:' + id, a); await kv.raw(['SREM', 'tsc:abos', id]); await tel('af'); }
  return a;
}

// ochtendronde: alleen wie iets nieuws heeft voor zijn route
export async function ronde({ droog = false } = {}) {
  const ids = (await kv.raw(['SMEMBERS', 'tsc:abos']).catch(() => [])) || [];
  const alle = items(), uit = { dag: DAG(), abonnees: ids.length, mail: 0, geenNieuws: 0, fouten: [], droog };
  const batch = [];
  for (const id of ids) {
    const a = await kv.get('tsc:abo:' + id).catch(() => null); if (!a || !a.actief) continue;
    const zag = new Set(a.gezien || []), lijst = alle.filter(it => past(it, a) && !zag.has(it.id)).slice(0, 4);
    if (!lijst.length) { uit.geenNieuws++; continue; }
    batch.push({ a, lijst });
  }
  for (let i = 0; i < batch.length; i += 90) {
    const deel = batch.slice(i, i + 90);
    if (!droog) {
      try { await stuur(deel.map(({ a, lijst }) => ({ to: [a.email], ...routeMail(a, lijst, false) })), 'tsc-dag-' + uit.dag + '-' + i);
        for (const { a, lijst } of deel) { a.gezien = [...new Set([...(a.gezien || []), ...lijst.map(x => x.id)])].slice(-300); a.laatst = uit.dag; await kv.set('tsc:abo:' + a.id, a); }
        uit.mail += deel.length; await tel('verstuurd', deel.length);
      } catch (e) { uit.fouten.push(String(e.message || e).slice(0, 100)); }
    } else uit.mail += deel.length;
  }
  await kv.set('tsc:ronde', { ...uit, at: new Date().toISOString() }).catch(() => {});
  return uit;
}

// open- en klikmeting uit de mail
export async function geopend(a, d) { const dg = /^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d : DAG(); const id = String(a || '').replace(/[^a-f0-9]/g, '').slice(0, 12); if (!id) return; if (await kv.raw(['SADD', 'tsc:open:' + dg, id]).catch(() => 0)) { await tel('geopend', 1, dg); await kv.raw(['EXPIRE', 'tsc:open:' + dg, String(120 * 86400)]).catch(() => null); } }
export async function klik(q) {
  const it = (NIEUWS.items || []).find(x => x.id === q.get('i')), w = q.get('w') === 'b' ? 'b' : 'p', dg = /^\d{4}-\d{2}-\d{2}$/.test(q.get('d') || '') ? q.get('d') : DAG();
  const id = String(q.get('a') || '').replace(/[^a-f0-9]/g, '').slice(0, 12);
  if (id && await kv.raw(['SADD', 'tsc:klik:' + dg, id]).catch(() => 0)) { await tel('klikker', 1, dg); await kv.raw(['EXPIRE', 'tsc:klik:' + dg, String(120 * 86400)]).catch(() => null); }
  await tel('klik_' + w, 1, dg);
  if (!it) return url('');
  return w === 'b' && SRC[it.bron] ? SRC[it.bron].u : url(it.pagina || '') + '?bron=mail';
}

export async function stand() {
  const n = N(await kv.raw(['SCARD', 'tsc:abos']).catch(() => 0));
  const dagen = [];
  for (let i = 0; i < 14; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); let hh = []; try { hh = await kv.raw(['HGETALL', 'tsc:d:' + d]); } catch (e) {} const o = {}; if (Array.isArray(hh)) for (let j = 0; j + 1 < hh.length; j += 2) o[hh[j]] = N(hh[j + 1]); else Object.assign(o, hh || {}); if (Object.keys(o).length) dagen.push({ dag: d, ...o }); }
  return { abonnees: n, laatsteRonde: await kv.get('tsc:ronde').catch(() => null), nieuwsItems: (NIEUWS.items || []).length, nieuwsste: (items()[0] || {}).dag || null, dagen };
}

