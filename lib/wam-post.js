// We Are Many: post versturen (Henkjan 9 nov 2026: "leg wel contact vast"). Alleen wat een bezoeker zelf in de chat vroeg
// (een overzicht, een herinnering, een prijscheck), nooit een nieuwsbrief. Verzenden via Resend vanaf wam@wearemany.now; het domein
// wordt hier aangemaakt en geverifieerd, de DNS-records staan bij Vercel (wearemany.now). Elke mail heeft een stoplink met één klik.
import { kv } from './db.js';

export const DOMEIN = 'wearemany.now';
const FROM = 'We Are Many <wam@wearemany.now>'; // geen 'WAM' voor mensen (Henkjan 14 nov: mensen weten niet wat WAM is)
export const BEDRIJF = 'We Are Many · AdsFair B.V. · Albert Plesmanplein 20, 2805 AB Gouda, NL · KvK 60126035';

async function sleutel() { if (process.env.RESEND_API_KEY || process.env.RESEND) return process.env.RESEND_API_KEY || process.env.RESEND; try { return ((await kv.get('hjdk:secrets')) || {}).RESEND_API_KEY || ''; } catch (e) { return ''; } }

export async function mailKlaar() { try { return !!(await kv.get('wam:mailklaar')); } catch (e) { return false; } }

// Verzenddomein bij Resend: aanmaken (maak=true), verificatie aanvragen en de DNS-records teruggeven.
export async function domein(maak) {
  const key = await sleutel(); if (!key) return { fout: 'geen mailsleutel' };
  const H = { authorization: 'Bearer ' + key, 'content-type': 'application/json' };
  const lijst = await (await fetch('https://api.resend.com/domains', { headers: H, signal: AbortSignal.timeout(8000) })).json();
  let d = (lijst.data || []).find(x => x.name === DOMEIN);
  if (!d && maak) {
    const r = await fetch('https://api.resend.com/domains', { method: 'POST', headers: H, body: JSON.stringify({ name: DOMEIN, region: 'eu-west-1' }), signal: AbortSignal.timeout(10000) });
    d = await r.json(); if (!r.ok) return { fout: 'aanmaken ' + r.status + ' ' + String(d.message || '').slice(0, 160), aantalDomeinen: (lijst.data || []).length };
  }
  if (!d) return { naam: DOMEIN, status: 'bestaat niet', aantalDomeinen: (lijst.data || []).length };
  const v = await (await fetch('https://api.resend.com/domains/' + d.id, { headers: H, signal: AbortSignal.timeout(8000) })).json();
  if (v.status !== 'verified' && maak) await fetch('https://api.resend.com/domains/' + d.id + '/verify', { method: 'POST', headers: H, signal: AbortSignal.timeout(8000) }).catch(() => null);
  // verzenden kan zodra DKIM (resend._domainkey) en SPF (TXT send) geverifieerd zijn; partially_verified betekent dan alleen dat een
  // extra record (zoals de CNAME rsend voor tracking) nog wacht (10 nov 2026: status partially_verified, DKIM, MX en SPF verified)
  const rec = v.records || [], ok = n => rec.some(r => r.name === n && r.status === 'verified');
  const klaar = v.status === 'verified' || (v.status === 'partially_verified' && ok('resend._domainkey') && rec.some(r => r.type === 'TXT' && r.name === 'send' && r.status === 'verified'));
  await kv.set('wam:mailklaar', klaar ? 1 : 0);
  return { naam: DOMEIN, afzender: FROM, status: v.status, records: (v.records || []).map(r => ({ type: r.type, naam: r.name, waarde: r.value, prioriteit: r.priority, status: r.status })) };
}

// Ontvangen op wearemany.now (Henkjan 10 nov 17:42: "Ja mail toch maar. En hij kan gewoon reply sturen. Die vang je op."):
// zet receiving aan bij Resend, geeft het MX-record terug dat in de DNS moet, en zorgt dat er een webhook voor email.received is.
export async function ontvangAan(webhookUrl) {
  const key = await sleutel(); if (!key) return { fout: 'geen mailsleutel' };
  const H = { authorization: 'Bearer ' + key, 'content-type': 'application/json' };
  const lijst = await (await fetch('https://api.resend.com/domains', { headers: H, signal: AbortSignal.timeout(8000) })).json();
  const d = (lijst.data || []).find(x => x.name === DOMEIN); if (!d) return { fout: 'domein niet gevonden' };
  const up = await fetch('https://api.resend.com/domains/' + d.id, { method: 'PATCH', headers: H, body: JSON.stringify({ capabilities: { sending: 'enabled', receiving: 'enabled' } }), signal: AbortSignal.timeout(8000) });
  const upj = await up.json().catch(() => ({}));
  await fetch('https://api.resend.com/domains/' + d.id + '/verify', { method: 'POST', headers: H, signal: AbortSignal.timeout(8000) }).catch(() => null);
  const v = await (await fetch('https://api.resend.com/domains/' + d.id, { headers: H, signal: AbortSignal.timeout(8000) })).json();
  let hooks = null, gemaakt = null;
  try {
    const wr = await fetch('https://api.resend.com/webhooks', { headers: H, signal: AbortSignal.timeout(8000) }); const wj = await wr.json().catch(() => ({}));
    hooks = (wj.data || []).map(w => ({ id: w.id, endpoint: w.endpoint, events: w.events, status: w.status }));
    if (wr.ok && webhookUrl && !hooks.some(w => String(w.endpoint || '').includes('op=mailin'))) {
      const cr = await fetch('https://api.resend.com/webhooks', { method: 'POST', headers: H, body: JSON.stringify({ endpoint: webhookUrl, events: ['email.received'] }), signal: AbortSignal.timeout(8000) });
      const cj = await cr.json().catch(() => ({})); gemaakt = cr.ok ? { id: cj.id } : { fout: cr.status + ' ' + String(cj.message || '').slice(0, 120) };
    } else if (!wr.ok) hooks = { fout: wr.status + ' ' + String(wj.message || '').slice(0, 120) };
  } catch (e) { hooks = { fout: String(e && e.message || e).slice(0, 120) }; }
  return { patch: up.ok ? 'ok' : (up.status + ' ' + String(upj.message || '').slice(0, 160)), capabilities: v.capabilities, status: v.status, records: (v.records || []).map(r => ({ record: r.record, type: r.type, naam: r.name, waarde: r.value, prioriteit: r.priority, status: r.status })), webhooks: hooks, webhookGemaakt: gemaakt };
}
// is ontvangen klaar (MX van Resend receiving geverifieerd)? Pas dan vragen we mensen om te antwoorden; anders zou hun antwoord terugkaatsen.
export async function ontvangKlaar() {
  try { if (await kv.get('wam:ontvangklaar')) return true; } catch (e) {}
  const key = await sleutel(); if (!key) return false; const H = { authorization: 'Bearer ' + key };
  try {
    const lijst = await (await fetch('https://api.resend.com/domains', { headers: H, signal: AbortSignal.timeout(8000) })).json(); const d = (lijst.data || []).find(x => x.name === DOMEIN); if (!d) return false;
    const v = await (await fetch('https://api.resend.com/domains/' + d.id, { headers: H, signal: AbortSignal.timeout(8000) })).json();
    if (!(v.records || []).some(r => r.record === 'Receiving' && r.status === 'verified')) { await fetch('https://api.resend.com/domains/' + d.id + '/verify', { method: 'POST', headers: H, signal: AbortSignal.timeout(8000) }).catch(() => null); return false; }
    await kv.set('wam:ontvangklaar', 1); return true;
  } catch (e) { return false; }
}
// laatste ontvangen mails (alleen wie, wanneer en onderwerp, adressen gemaskeerd): voor de proef van de ontvangstketen
export async function ontvangLijst() {
  const key = await sleutel(); if (!key) return null;
  const r = await fetch('https://api.resend.com/emails/receiving?limit=10', { headers: { authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(8000) });
  const j = await r.json().catch(() => ({})); if (!r.ok) return { fout: r.status + ' ' + String(j.message || '').slice(0, 120) };
  const mk = a => String(a || '').replace(/^[^@<]+@/, '***@');
  return (j.data || []).slice(0, 10).map(m => ({ id: m.id, t: m.created_at, aan: [].concat(m.to || []).map(mk), wam: [].concat(m.to || []).some(a => /wearemany\.now/i.test(String(a))), van: mk(m.from), onderwerp: String(m.subject || '').slice(0, 60) }));
}
// een ontvangen mail ophalen (Receiving API)
export async function ontvangen(id) {
  const key = await sleutel(); if (!key || !id) return null;
  const r = await fetch('https://api.resend.com/emails/receiving/' + encodeURIComponent(id), { headers: { authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(8000) });
  return r.ok ? r.json() : null;
}

export async function stuurMail({ to, subject, html, text, stopUrl, idem }) {
  const key = await sleutel(); if (!key) throw Error('geen mailsleutel');
  const body = { from: FROM, to: [to], subject, html, text, headers: stopUrl ? { 'List-Unsubscribe': '<' + stopUrl + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined };
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json', ...(idem ? { 'idempotency-key': idem } : {}) }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({})); if (!r.ok || !j.id) throw Error('mail ' + r.status + ' ' + String(j.message || j.name || '').slice(0, 120)); return j.id;
}

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const VOET = {
  nl: (stop) => `Je krijgt dit bericht omdat je het in de chat op wearemany.now vroeg. Geen berichten meer? <a href="${stop}" style="color:#5f6368">Stop met één klik</a>.`,
  de: (stop) => `Du bekommst diese Nachricht, weil du sie im Chat auf wearemany.now angefragt hast. Keine Nachrichten mehr? <a href="${stop}" style="color:#5f6368">Mit einem Klick stoppen</a>.`,
  en: (stop) => `You get this message because you asked for it in the chat on wearemany.now. No more messages? <a href="${stop}" style="color:#5f6368">Stop with one click</a>.`
};
const VOET_T = { nl: 'Je krijgt dit bericht omdat je het in de chat op wearemany.now vroeg. Stoppen: ', de: 'Du bekommst diese Nachricht, weil du sie im Chat auf wearemany.now angefragt hast. Stoppen: ', en: 'You get this message because you asked for it in the chat on wearemany.now. Stop: ' };

// Eenvoudige, leesbare mail: tekst in alinea's, één knop terug naar de chat, voettekst met afzender en stoplink.
export function mailHtml({ taal, tekst, knop, chatUrl, stopUrl }) {
  const alineas = String(tekst || '').split(/\n{2,}/).map(a => a.trim()).filter(Boolean).map(a => {
    const regels = a.split('\n');
    if (regels.every(r => /^\s*[-•*]\s+/.test(r))) return '<ul style="margin:0 0 14px;padding-left:20px">' + regels.map(r => '<li style="margin:0 0 6px">' + esc(r.replace(/^\s*[-•*]\s+/, '')) + '</li>').join('') + '</ul>';
    return '<p style="margin:0 0 14px">' + regels.map(esc).join('<br>') + '</p>';
  }).join('');
  const voet = (VOET[taal] || VOET.en)(esc(stopUrl));
  return `<!doctype html><html><body style="margin:0;background:#f4f5f2"><div style="max-width:560px;margin:0 auto;padding:24px 18px;font:16px/1.55 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f">`
    + `<div style="font-weight:800;font-size:18px;color:#0F6E56;margin:0 0 16px">We Are Many</div>`
    + `<div style="background:#fff;border-radius:16px;padding:22px 20px">${alineas}<p style="margin:18px 0 0"><a href="${esc(chatUrl)}" style="display:inline-block;background:#0F6E56;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">${esc(knop)}</a></p></div>`
    + `<p style="font-size:12px;line-height:1.5;color:#5f6368;margin:16px 4px 0">${voet}<br>${esc(BEDRIJF)}</p></div></body></html>`;
}
export function mailTekst({ taal, tekst, knop, chatUrl, stopUrl }) { return String(tekst || '') + '\n\n' + knop + ': ' + chatUrl + '\n\n--\n' + (VOET_T[taal] || VOET_T.en) + stopUrl + '\n' + BEDRIJF; }
