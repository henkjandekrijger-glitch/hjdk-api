// todayin verzekeringen: wijzigingsmail over zorgverzekeringen (Henkjan 17 nov 2026: "todayin /verzekeringen ook maken om ze dagelijks te mailen
// over wijzigingen en updates" en "Ja bouw met bestaande code"). Zelfde motor als todayin surgery (lib/tsc-mail.js stuur via Resend, dubbele
// opt-in, afmelden met één klik, alleen mailen als er iets is). Aanmelden staat op elke pagina van keuzehulp.best/zorgverzekering; archief op
// todayin.email/verzekeringen. Wijzigingen staan in data/zorg/updates.json (elk met bron en datum, door Claude nagekeken); een item met een
// datum in de toekomst (deadline-herinnering) gaat pas op die dag mee. lib/zorgcheck.js kijkt elke ochtend of premiepagina's veranderden en
// zet signalen klaar om na te kijken; die gaan nooit ongezien de mail in.
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { kv } from './db.js';
import { stuur } from './tsc-mail.js';

const FROM = 'todayin verzekeringen <verzekeringen@todayin.email>';
const BASIS = 'https://keuzehulp.best/zorgverzekering', ARCHIEF = 'https://todayin.email/verzekeringen';
const hash = s => createHash('sha256').update(String(s)).digest('hex');
const token = () => randomBytes(24).toString('hex');
const okTok = t => /^[a-f0-9]{48}$/.test(t || '');
const dag = () => new Date().toISOString().slice(0, 10);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const okMail = e => /^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i.test(e) && e.length <= 254;
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'zorg');
export function updates() { try { return (JSON.parse(readFileSync(join(DIR, 'updates.json'), 'utf8')).items || []).filter(x => x && x.id && x.dag && x.kop).sort((a, b) => String(b.dag).localeCompare(String(a.dag))); } catch (e) { return []; } }
const zichtbaar = (d = dag()) => updates().filter(x => x.dag <= d);
const past = (it, a) => !it.labels || !it.labels.length || it.labels.includes('*') || (a.label && it.labels.includes(a.label));
async function tel(wat, n = 1) { try { const k = 'zorg:mail:d:' + dag(); await kv.raw(['HINCRBY', k, wat, String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); } catch (e) {} }

const knop = (href, t) => `<a href="${esc(href)}" style="display:inline-block;background:#2B47C4;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px">${esc(t)}</a>`;
function schil(voorkop, inhoud, voet) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#fff"><span style="display:none;max-height:0;overflow:hidden">${esc(voorkop)}</span><div style="max-width:560px;margin:0 auto;padding:28px 20px;font:17px/1.55 Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111113"><p style="margin:0 0 22px;font-weight:700;font-size:18px">todayin <span style="color:#2B47C4">verzekeringen</span></p>${inhoud}<div style="border-top:1px solid #E5E7EB;margin-top:28px;padding-top:16px;font-size:13px;color:#555">${voet}<br><br>todayin · AdsFair B.V. · Albert Plesmanplein 20, 2805 AB Gouda</div></div></body></html>`;
}
const alsTekst = html => html.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, '$2 ($1)').replace(/<span style="display:none[^>]*>[\s\S]*?<\/span>/, '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const itemHtml = it => `<div style="margin:0 0 20px"><p style="margin:0;font-size:13px;color:#6B7280">${esc(it.dag)}</p><p style="margin:2px 0 4px;font-weight:600;font-size:18px">${esc(it.kop)}</p><p style="margin:0 0 6px">${esc(it.tekst || '')}</p><p style="margin:0;font-size:14px">${it.pad ? `<a href="${esc(BASIS + it.pad + (it.pad.includes('?') ? '&' : '?') + 'bron=mail')}" style="color:#2B47C4">Lees meer</a>` : ''}${it.bron ? ` · <a href="${esc(it.bron)}" style="color:#6B7280">bron</a>` : ''}</p></div>`;
const dagenTot = (doel, d = dag()) => Math.round((Date.parse(doel + 'T00:00:00Z') - Date.parse(d + 'T00:00:00Z')) / 864e5);
function deadline(d = dag()) {
  const n = dagenTot('2026-12-31', d), m = dagenTot('2027-02-01', d);
  if (n >= 0) return `<p style="background:#EEF1FC;border-radius:14px;padding:14px 16px;margin:0 0 22px">Nog <b>${n} ${n === 1 ? 'dag' : 'dagen'}</b> om over te stappen: opzeggen kan tot en met 31 december. Je nieuwe verzekeraar zegt je oude polis voor je op.</p>`;
  if (m > 0) return `<p style="background:#EEF1FC;border-radius:14px;padding:14px 16px;margin:0 0 22px">Al opgezegd? Je hebt nog <b>${m} ${m === 1 ? 'dag' : 'dagen'}</b> om een nieuwe basisverzekering af te sluiten, met terugwerkende kracht tot 1 januari.</p>`;
  return '';
}
function mail(a, lijst, welkom) {
  const af = BASIS + '/af?t=' + a.af, lab = a.labelNaam ? ' voor ' + a.labelNaam : '';
  const kop = welkom ? 'Welkom. Dit veranderde voor 2027' + lab : 'Wat er veranderde' + lab;
  const inhoud = `<h1 style="font-size:24px;line-height:1.25;margin:0 0 16px">${esc(kop)}</h1>${deadline()}${lijst.map(itemHtml).join('')}<p style="margin:22px 0 10px">${knop(BASIS + '?bron=mail', 'Vergelijk alle polissen 2027')}</p><p style="font-size:15px;margin:0">Een vraag? <a href="${esc(BASIS + '?bron=mail#kx')}" style="color:#2B47C4">Stel hem aan de keuzehulp</a>. Ook voor je huisgenoten: <a href="https://wa.me/?text=${encodeURIComponent('Zorgverzekering 2027 vergelijken: ' + BASIS)}" style="color:#2B47C4">deel via WhatsApp</a>.</p>`;
  const voet = `Je krijgt deze mail omdat je je aanmeldde op keuzehulp.best en je adres bevestigde. Alleen op dagen dat er iets verandert of een deadline nadert. Informatie, geen advies. <a href="${esc(af)}" style="color:#555">Afmelden met één klik</a> · <a href="${ARCHIEF}" style="color:#555">Alle updates</a>`;
  const html = schil(lijst[0] ? lijst[0].kop : kop, inhoud, voet);
  return { from: FROM, subject: welkom ? 'Zorgverzekering 2027: wat er veranderde' + lab : (lijst[0] ? lijst[0].kop : 'Zorgverzekering: wat er veranderde'), html, text: alsTekst(html), headers: { 'List-Unsubscribe': '<' + af + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } };
}

export async function aanmelden(b, ip, labels) {
  const email = String(b.email || '').trim().toLowerCase(); if (!okMail(email)) return { ok: false, fout: 'email' };
  if (b.website) return { ok: true }; // honeypot
  if (b.toestemming !== true) return { ok: false, fout: 'toestemming' };
  const rk = 'zorg:rl:' + hash(ip + ':' + Math.floor(Date.now() / 60000)).slice(0, 24), n = await kv.incr(rk); if (n === 1) await kv.raw(['EXPIRE', rk, '120']); if (n > 5) return { ok: false, fout: 'druk' };
  const dn = await kv.incr('zorg:bevdag:' + dag()); if (dn === 1) await kv.raw(['EXPIRE', 'zorg:bevdag:' + dag(), '172800']); if (dn > 500) return { ok: false, fout: 'druk' };
  const l = (labels || []).find(x => x.slug === b.label) || null;
  const id = hash('zorg:' + email).slice(0, 32), bev = token();
  await kv.set('zorg:pend:' + hash(bev), { id, email, label: l ? l.slug : '', labelNaam: l ? l.label : '', pad: String(b.pad || '').replace(/[^a-z0-9/-]/g, '').slice(0, 80), at: Date.now() }, { ex: 259200 });
  const inhoud = `<h1 style="font-size:24px;margin:0 0 14px">Bevestig je aanmelding</h1><p>Klik op de knop en je krijgt een korte mail op de dagen dat er iets verandert aan zorgverzekeringen${l ? ' en aan ' + esc(l.label) : ''}: premies, vergoedingen, regels en deadlines. Elk feit met bron.</p><p style="margin:22px 0">${knop(BASIS + '/bevestig?t=' + bev, 'Ja, houd me op de hoogte')}</p><p style="font-size:15px;color:#555">Niet aangevraagd? Negeer deze mail, dan mailen we je niet.</p>`;
  const html = schil('Bevestig je aanmelding', inhoud, 'AdsFair B.V.');
  try { await stuur([{ from: FROM, to: [email], subject: 'Bevestig: updates over je zorgverzekering', html, text: alsTekst(html) }], 'zorg-bev-' + hash(bev).slice(0, 32)); }
  catch (e) { await tel('bevestigmail_fout'); return { ok: false, fout: 'mail_tijdelijk' }; }
  await tel('aanvraag'); if (l) await tel('aanvraag_' + l.slug);
  return { ok: true };
}
export async function bevestig(t) {
  if (!okTok(t)) return null; const p = await kv.get('zorg:pend:' + hash(t)); if (!p) return null;
  const oud = await kv.get('zorg:abo:' + p.id);
  if (oud && oud.actief && p.klaar) return { ...oud, al: true };
  const a = { ...(oud || {}), ...p, actief: true, bevestigd: oud?.bevestigd || Date.now(), af: oud?.af || token(), gezien: Array.isArray(oud?.gezien) ? oud.gezien : [] };
  delete a.klaar;
  await kv.set('zorg:abo:' + p.id, a); await kv.set('zorg:af:' + hash(a.af), p.id); await kv.raw(['SADD', 'zorg:abos', p.id]); await kv.set('zorg:pend:' + hash(t), { ...p, klaar: Date.now() }, { ex: 259200 });
  if (!oud?.bevestigd) { await tel('bevestigd'); if (a.label) await tel('bevestigd_' + a.label); }
  try { a.welkom = await bezorg(a, true); } catch (e) { a.welkom = false; await tel('mailfout'); }
  return a;
}
export async function afmelden(t) {
  if (!okTok(t)) return null; const id = await kv.get('zorg:af:' + hash(t)); if (!id) return null;
  const a = await kv.get('zorg:abo:' + id); if (!a) return null;
  await kv.set('zorg:abo:' + id, { ...a, actief: false, afAt: Date.now() }); await kv.raw(['SREM', 'zorg:abos', id]); await tel('af'); return a;
}
async function bezorg(a, welkom, d = dag()) {
  const lock = 'zorg:lock:' + a.id; if (!await kv.raw(['SET', lock, '1', 'NX', 'EX', '300'])) return false;
  try {
    const vers = await kv.get('zorg:abo:' + a.id); if (!vers?.actief || vers.laatst === d) return false;
    const gezien = new Set(vers.gezien || []), lijst = zichtbaar(d).filter(it => past(it, vers) && (welkom || !gezien.has(it.id))).slice(0, welkom ? 5 : 4);
    if (!lijst.length) return false;
    await stuur([{ to: [vers.email], ...mail(vers, lijst, welkom) }], 'zorg-' + vers.id + '-' + d);
    await kv.set('zorg:abo:' + a.id, { ...vers, laatst: d, gezien: [...new Set([...gezien, ...zichtbaar(d).filter(it => past(it, vers)).map(x => x.id)])].slice(-300) });
    await tel(welkom ? 'welkom' : 'verstuurd'); return true;
  } finally { await kv.raw(['DEL', lock]).catch(() => null); }
}
export async function ronde({ droog = false } = {}) {
  const ids = (await kv.raw(['SMEMBERS', 'zorg:abos'])) || [], d = dag(), out = { dag: d, abonnees: ids.length, mail: 0, niets: 0, fouten: [], droog };
  for (const id of ids) {
    try {
      const a = await kv.get('zorg:abo:' + id); if (!a?.actief || a.laatst === d) continue;
      const gezien = new Set(a.gezien || []); if (!zichtbaar(d).some(it => past(it, a) && !gezien.has(it.id))) { out.niets++; continue; }
      if (droog) { out.mail++; continue; }
      if (await bezorg(a, false, d)) out.mail++;
    } catch (e) { out.fouten.push(String(e.message || e).slice(0, 80)); }
  }
  if (!droog) await kv.set('zorg:ronde', { ...out, at: new Date().toISOString() });
  return out;
}
export async function stand() {
  const ids = (await kv.raw(['SMEMBERS', 'zorg:abos']).catch(() => [])) || [], dagen = [];
  for (let i = 0; i < 14; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); const r = await kv.raw(['HGETALL', 'zorg:mail:d:' + d]).catch(() => []); const o = Array.isArray(r) ? Object.fromEntries(Array.from({ length: r.length / 2 }, (_, j) => [r[j * 2], Number(r[j * 2 + 1])])) : (r || {}); if (Object.keys(o).length) dagen.push({ dag: d, ...o }); }
  return { abonnees: ids.length, ronde: await kv.get('zorg:ronde').catch(() => null), dagen, updates: updates().length, check: await kv.get('zorg:check').catch(() => null) };
}
// aanmeldvak op elke zorgpagina (Henkjan 17 nov: "veel cleaner en makkelijker en geen vinkje"): één veld en één knop op één regel, zoals
// het scanformulier van outname.now. Op een verzekeraarspagina gaat die verzekeraar vanzelf mee (label). Toestemming = de knop plus de
// bevestigingsmail (dubbele opt-in), de regel eronder zegt wat je krijgt.
export function formulier(labels, pad, label) {
  const l = (labels || []).find(x => x.slug === label) || null;
  return `<style>.zm{border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin:24px 0}.zm h2{font-size:20px;margin:0 0 4px}.zm p{margin:0}.zmr{display:grid;grid-template-columns:1fr auto;gap:10px;margin:14px 0 10px}.zmr input{min-width:0;min-height:48px;border:1px solid var(--line2);border-radius:999px;padding:10px 18px;font:inherit;font-size:16px;background:var(--bg);color:var(--ink)}.zmr button{min-height:48px;border:0;border-radius:999px;background:var(--acc);color:#fff;font:inherit;font-weight:600;font-size:16px;padding:10px 22px;cursor:pointer;white-space:nowrap}@media (max-width:560px){.zmr{grid-template-columns:1fr}}</style>`
    + `<section class="zm" id="zm"><h2>Mail me als er iets verandert</h2><p class="klein">${l ? 'Over ' + esc(l.label) + ' en a' : 'A'}lle premies, vergoedingen en deadlines tot 1 februari. Alleen als er iets verandert.</p><form id="zmf" novalidate><div class="zmr"><input id="zme" type="email" required autocomplete="email" inputmode="email" placeholder="Je e-mailadres" aria-label="Je e-mailadres"><button type="submit">Houd me op de hoogte</button></div><input name="website" id="zmw" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><p class="klein" id="zmu" role="status">Je krijgt eerst een mail om te bevestigen. Afmelden met één klik.</p></form></section>`
    + `<script>(function(){var f=document.getElementById("zmf");if(!f)return;f.addEventListener("submit",function(e){e.preventDefault();var u=document.getElementById("zmu"),m=document.getElementById("zme").value.trim();if(!/^\\S+@\\S+\\.\\S+$/.test(m)){u.textContent="Vul een geldig e-mailadres in.";return}u.textContent="Even geduld...";fetch("https://keuzehulp.best/api/keuze-tools?tool=zorg&op=aanmelden",{method:"POST",headers:{"content-type":"text/plain"},body:JSON.stringify({email:m,label:${JSON.stringify(l ? l.slug : '')},website:document.getElementById("zmw").value,toestemming:true,pad:${JSON.stringify(pad || '')}})}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok){f.innerHTML="<p><strong>Check je mail.</strong> Klik op de knop in de mail, dan staat het aan.</p>"}else u.textContent=j&&j.fout==="druk"?"Het is even druk, probeer het zo nog eens.":"Dat lukte niet. Probeer het nog eens."}).catch(function(){u.textContent="Dat lukte niet. Probeer het nog eens."})})})()</script>`;
}
