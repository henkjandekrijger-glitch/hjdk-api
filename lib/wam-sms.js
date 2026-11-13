// SMS voor WAM (Henkjan 13 nov 15:27 UTC: "we moeten alle alternatieven ook bedienen zoals mail sms etc").
// Klaar en uit tot Twilio gekoppeld is: TWILIO_ACCOUNT_SID en TWILIO_AUTH_TOKEN in Vercel (de Twilio-koppeling in de Vercel Marketplace zet ze zelf).
// Het afzendnummer zoekt WAM zelf op in het Twilio-account (eerste nummer dat sms kan); WAM_SMS_FROM mag het overschrijven (nummer of Messaging Service SID).
// Nummers die mensen al achterlieten (p.contact.sms) krijgen dan vanzelf hun berichten. STOP regelt Twilio zelf (VS en Canada).
import { kv } from './db.js';
const N = x => Number(x) || 0;
export function smsKlaar() { return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN); }
const auth = () => 'Basic ' + Buffer.from(process.env.TWILIO_ACCOUNT_SID + ':' + process.env.TWILIO_AUTH_TOKEN).toString('base64');
async function afzender() {
  if (process.env.WAM_SMS_FROM) return process.env.WAM_SMS_FROM;
  const c = await kv.raw(['GET', 'wam:smsvan']).catch(() => null); if (c) return String(c);
  const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + process.env.TWILIO_ACCOUNT_SID + '/IncomingPhoneNumbers.json?PageSize=20', { headers: { authorization: auth() }, signal: AbortSignal.timeout(8000) }).catch(() => null);
  const j = r && r.ok ? await r.json().catch(() => null) : null;
  const nr = ((j && j.incoming_phone_numbers) || []).find(x => !x.capabilities || x.capabilities.sms !== false);
  if (!nr) return null; await kv.raw(['SET', 'wam:smsvan', nr.phone_number, 'EX', '86400']).catch(() => {}); return nr.phone_number;
}
export async function stuurSms(nr, tekst) {
  if (!smsKlaar() || !/^\+\d{8,15}$/.test(String(nr || ''))) return false;
  const dag = new Date().toISOString().slice(0, 10), max = Math.max(0, Number(process.env.WAM_SMS_MAX || 60));
  const n = N(await kv.raw(['INCR', 'wam:smsd:' + dag]).catch(() => 0)); if (n === 1) kv.raw(['EXPIRE', 'wam:smsd:' + dag, '90000']).catch(() => {});
  if (n > max) return false; // dagplafond tegen een dure lus
  const sid = process.env.TWILIO_ACCOUNT_SID, van = await afzender(); if (!van) return false; const body = new URLSearchParams({ To: nr, Body: String(tekst || '').slice(0, 600) });
  if (/^MG[0-9a-f]{32}$/i.test(van)) body.set('MessagingServiceSid', van); else body.set('From', van);
  const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', { method: 'POST', headers: { authorization: auth(), 'content-type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(10000) }).catch(() => null);
  return !!(r && r.ok);
}
