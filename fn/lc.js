// Lasting Change (eigen boek van Henkjan) — leads uit de exit-modal op Yoors (US) en de gratis hoofdstukken.
//   POST /api/lc/lead {email, page, v, h, src}   -> adres opslaan (ontdubbeld) en meteen de gratis hoofdstukken mailen (Resend; env RESEND_API_KEY, LC_FROM, LC_PREVIEW_URL)
//   GET  /leads?token=<HJDK_TOKEN>              -> overzicht + CSV-export (nooit zonder token)
//   GET  /api/lc/status                          -> alleen aantallen en of mail is ingesteld (geen adressen)
import { kv } from '../lib/db.js';

const LIST = 'hjdk:lc:leads';
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PREVIEW = () => process.env.LC_PREVIEW_URL || 'https://hjdk-api.vercel.app/lasting-change-free-chapters.pdf';
const AMAZON = () => process.env.LC_AMAZON_URL || 'https://www.amazon.com/dp/B0F1SM1L5J';

async function resendKey() { if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY; try { const c = (await kv.get('hjdk:secrets')) || {}; return c.RESEND_API_KEY || ''; } catch (e) { return ''; } }
async function sendPreview(email) {
  const key = await resendKey(); if (!key) return { sent: false, why: 'RESEND_API_KEY ontbreekt' };
  const from = process.env.LC_FROM || 'Lasting Change <john@lastingchange.works>';
  const html = `<div style="font:16px/1.55 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:#111;max-width:560px;margin:0 auto;padding:24px 16px">
<p>Hi,</p>
<p>Here are your two free chapters of <b>The Lasting Change Workbook</b> — the part most readers say made the difference: how to pick the one change that sticks, and the first 7-day plan.</p>
<p style="margin:24px 0"><a href="${esc(PREVIEW())}" style="background:#111;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700;display:inline-block">Open the free chapters (PDF)</a></p>
<p>If it clicks, the full workbook is on Amazon: <a href="${esc(AMAZON())}">The Lasting Change Workbook</a>.</p>
<p>No newsletter, no sequence. You'll only hear from me again if something about the book changes (a price drop or a new edition).</p>
<p>— Henkjan<br><span style="color:#6b7280;font-size:13px">You asked for these chapters on a Yoors page. Don't want anything else? Just ignore this mail; nothing more comes automatically.</span></p></div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify({ from, to: [email], subject: 'Your free chapters: The Lasting Change Workbook', html }) });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { sent: true, id: j.id } : { sent: false, why: 'resend ' + r.status + ' ' + String(j.message || j.name || '').slice(0, 120) };
  } catch (e) { return { sent: false, why: String(e && e.message || e).slice(0, 120) }; }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.setHeader('cache-control', 'no-store');
  const url = new URL(req.url, 'http://x');
  const op = url.searchParams.get('op') || url.pathname.replace(/^\/api\/lc\/?/, '').split('/')[0];
  try {
    if (op === 'lead') {
      if (req.method !== 'POST') return res.status(405).end();
      let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return res.status(400).json({ ok: false, error: 'invalid email' });
      const lead = { email, at: Date.now(), page: String(b.page || '').slice(0, 80), v: String(b.v || '').slice(0, 8), h: String(b.h || '').slice(0, 8), src: String(b.src || '').slice(0, 20) };
      const dupKey = 'hjdk:lc:lead:' + email;
      const dup = await kv.get(dupKey);
      let mail = { sent: false, why: 'al eerder verstuurd' };
      if (!dup) {
        mail = await sendPreview(email);
        lead.mail = mail.sent ? 'sent' : 'pending:' + mail.why;
        const list = (await kv.get(LIST)) || []; list.unshift(lead); await kv.set(LIST, list.slice(0, 5000));
        await kv.set(dupKey, { at: lead.at, mail: lead.mail });
        try { await kv.incrMany([['c:hjdk6-lc-lead-' + (lead.v || 'x') + '-' + (lead.h || 'x'), 1], ['c:hjdk6-lc-leads', 1], ['c:hjdk6-lc-mail-' + (mail.sent ? 'ok' : 'fail'), 1]]); } catch (e) {}
      }
      return res.status(200).json({ ok: true, sent: mail.sent, again: !!dup });
    }
    if (op === 'status') {
      const list = (await kv.get(LIST)) || [];
      const pending = list.filter(l => /^pending/.test(l.mail || '')).length;
      return res.status(200).json({ leads: list.length, pending, mail: (await resendKey()) ? 'resend ingesteld' : 'RESEND_API_KEY ontbreekt (leads worden bewaard, mail volgt zodra de sleutel op /setup staat)', preview: PREVIEW(), amazon: AMAZON() });
    }
    if (op === 'resend') { // nog niet verstuurde mails alsnog sturen (na het zetten van de sleutel); token verplicht
      if (!process.env.HJDK_TOKEN || url.searchParams.get('token') !== process.env.HJDK_TOKEN) return res.status(401).json({ error: 'token' });
      const list = (await kv.get(LIST)) || []; let n = 0;
      for (const l of list) { if (!/^pending/.test(l.mail || '')) continue; const m = await sendPreview(l.email); if (m.sent) { l.mail = 'sent'; n++; try { await kv.set('hjdk:lc:lead:' + l.email, { at: l.at, mail: 'sent' }); } catch (e) {} } if (n >= 50) break; }
      await kv.set(LIST, list);
      return res.status(200).json({ ok: true, verstuurd: n });
    }
    if (op === 'leads' || op === '') {
      if (!process.env.HJDK_TOKEN || url.searchParams.get('token') !== process.env.HJDK_TOKEN) { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(401).send('<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;padding:30px"><form><p>HJDK-token: <input name="token" type="password"> <button>Bekijk leads</button></p></form></body>'); }
      const list = (await kv.get(LIST)) || [];
      if (url.searchParams.get('csv')) { res.setHeader('content-type', 'text/csv; charset=utf-8'); res.setHeader('content-disposition', 'attachment; filename="lasting-change-leads.csv"'); return res.status(200).send('email,datum,pagina,modal,kop,bron,mail\n' + list.map(l => [l.email, new Date(l.at).toISOString(), l.page, l.v, l.h, l.src, l.mail].map(x => '"' + String(x || '').replace(/"/g, '""') + '"').join(',')).join('\n')); }
      const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Lasting Change leads</title><style>body{font:15px system-ui;padding:20px;color:#111}table{border-collapse:collapse}td,th{border-bottom:1px solid #e5e7eb;padding:6px 10px;text-align:left;font-size:14px}</style></head><body><h2>Lasting Change — ${list.length} adressen</h2><p><a href="/leads?token=${esc(url.searchParams.get('token'))}&csv=1">Download CSV</a> · nog te mailen: ${list.filter(l => /^pending/.test(l.mail || '')).length}</p><table><tr><th>E-mail</th><th>Datum</th><th>Pagina</th><th>Modal</th><th>Kop</th><th>Mail</th></tr>${list.slice(0, 500).map(l => '<tr><td>' + esc(l.email) + '</td><td>' + new Date(l.at).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }) + '</td><td>' + esc(l.page) + '</td><td>' + esc(l.v) + '</td><td>' + esc(l.h) + '</td><td>' + esc(l.mail) + '</td></tr>').join('')}</table></body></html>`;
      res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(html);
    }
    return res.status(400).json({ error: 'bad op', op });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e && e.message || e).slice(0, 200) }); }
}
