// SMS voor WAM (Henkjan 13 nov 15:27 UTC: "we moeten alle alternatieven ook bedienen zoals mail sms etc").
// Henkjan 13 nov 17:30 UTC: "Kijk naar diensten als messagebird en dergelijke ipv" Twilio (registratie duurt 1-2 weken).
// Daarom werkt dit met elke aanbieder waarvan de sleutel in Vercel staat; de eerste die klaar is, verstuurt:
//   1. Bird (MessageBird): BIRD_KEY (access key), BIRD_WORKSPACE en BIRD_KANAAL (id van het sms-kanaal).
//   2. Twilio: TWILIO_ACCOUNT_SID en TWILIO_AUTH_TOKEN (afzender zoekt WAM zelf op; WAM_SMS_FROM mag hem overschrijven).
//   3. Textbelt: TEXTBELT_KEY (gedeelde nummers, geen registratie; links pas na hun witte lijst).
// WAM_SMS_VIA=bird|twilio|textbelt kiest er vast een. Nummers die mensen al achterlieten (p.contact.sms) krijgen dan vanzelf hun berichten.
// India (+91) alleen met WAM_SMS_IN=1: zonder DLT-registratie blokkeren de Indiase providers elk bericht, dus geld weg.
import { kv } from './db.js';
const N = x => Number(x) || 0, E = process.env;
const klaar = {
  bird: () => !!(E.BIRD_KEY && E.BIRD_WORKSPACE && E.BIRD_KANAAL),
  twilio: () => !!(E.TWILIO_ACCOUNT_SID && E.TWILIO_AUTH_TOKEN),
  textbelt: () => !!E.TEXTBELT_KEY,
};
export function smsVia() {
  const v = String(E.WAM_SMS_VIA || '').toLowerCase();
  if (klaar[v] && klaar[v]()) return v;
  return ['bird', 'twilio', 'textbelt'].find(k => klaar[k]()) || null;
}
export function smsKlaar() { return !!smsVia(); }
const twAuth = () => 'Basic ' + Buffer.from(E.TWILIO_ACCOUNT_SID + ':' + E.TWILIO_AUTH_TOKEN).toString('base64');
async function twAfzender() {
  if (E.WAM_SMS_FROM) return E.WAM_SMS_FROM;
  const c = await kv.raw(['GET', 'wam:smsvan']).catch(() => null); if (c) return String(c);
  const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + E.TWILIO_ACCOUNT_SID + '/IncomingPhoneNumbers.json?PageSize=20', { headers: { authorization: twAuth() }, signal: AbortSignal.timeout(8000) }).catch(() => null);
  const j = r && r.ok ? await r.json().catch(() => null) : null;
  const nr = ((j && j.incoming_phone_numbers) || []).find(x => !x.capabilities || x.capabilities.sms !== false);
  if (!nr) return null; await kv.raw(['SET', 'wam:smsvan', nr.phone_number, 'EX', '86400']).catch(() => {}); return nr.phone_number;
}
const zend = {
  async bird(nr, t) {
    const r = await fetch('https://api.bird.com/workspaces/' + E.BIRD_WORKSPACE + '/channels/' + E.BIRD_KANAAL + '/messages', { method: 'POST', headers: { authorization: 'AccessKey ' + E.BIRD_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ receiver: { contacts: [{ identifierValue: nr }] }, body: { type: 'text', text: { text: t } } }), signal: AbortSignal.timeout(10000) }).catch(() => null);
    return { ok: !!(r && r.ok), fout: r && !r.ok ? 'bird ' + r.status : (r ? '' : 'bird geen antwoord') };
  },
  async twilio(nr, t) {
    const van = await twAfzender(); if (!van) return { ok: false, fout: 'twilio geen afzender' };
    const body = new URLSearchParams({ To: nr, Body: t });
    if (/^MG[0-9a-f]{32}$/i.test(van)) body.set('MessagingServiceSid', van); else body.set('From', van);
    const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + E.TWILIO_ACCOUNT_SID + '/Messages.json', { method: 'POST', headers: { authorization: twAuth(), 'content-type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(10000) }).catch(() => null);
    return { ok: !!(r && r.ok), fout: r && !r.ok ? 'twilio ' + r.status : (r ? '' : 'twilio geen antwoord') };
  },
  async textbelt(nr, t) {
    const r = await fetch('https://textbelt.com/text', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ phone: nr, message: t, key: E.TEXTBELT_KEY }), signal: AbortSignal.timeout(10000) }).catch(() => null);
    const j = r ? await r.json().catch(() => null) : null;
    return { ok: !!(j && j.success), fout: j && !j.success ? 'textbelt ' + String(j.error || '').slice(0, 80) : (j ? '' : 'textbelt geen antwoord') };
  },
};
export async function stuurSms(nr, tekst) {
  const via = smsVia(); nr = String(nr || '');
  if (!via || !/^\+\d{8,15}$/.test(nr)) return false;
  if (nr.startsWith('+91') && E.WAM_SMS_IN !== '1') return false; // India: DLT-registratie nodig
  const dag = new Date().toISOString().slice(0, 10), max = Math.max(0, Number(E.WAM_SMS_MAX || 60));
  const n = N(await kv.raw(['INCR', 'wam:smsd:' + dag]).catch(() => 0)); if (n === 1) kv.raw(['EXPIRE', 'wam:smsd:' + dag, '90000']).catch(() => {});
  if (n > max) return false; // dagplafond tegen een dure lus
  const u = await zend[via](nr, String(tekst || '').slice(0, 600)).catch(e => ({ ok: false, fout: via + ' ' + String(e).slice(0, 60) }));
  kv.raw(['HINCRBY', 'wam:smsstat:' + dag, via + (u.ok ? '_ok' : '_fout'), '1']).catch(() => {});
  if (!u.ok && u.fout) kv.raw(['SET', 'wam:smsfout', dag + ' ' + u.fout, 'EX', '604800']).catch(() => {});
  return u.ok;
}
export async function smsStand() {
  const dag = new Date().toISOString().slice(0, 10);
  const [st, fout] = await Promise.all([kv.raw(['HGETALL', 'wam:smsstat:' + dag]).catch(() => null), kv.raw(['GET', 'wam:smsfout']).catch(() => null)]);
  const s = {}; if (Array.isArray(st)) for (let i = 0; i < st.length; i += 2) s[st[i]] = N(st[i + 1]); else if (st) Object.assign(s, st);
  return { via: smsVia(), klaar: { bird: klaar.bird(), twilio: klaar.twilio(), textbelt: klaar.textbelt() }, vandaag: s, laatste_fout: fout || null };
}
