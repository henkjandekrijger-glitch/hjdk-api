// SMS voor WAM (Henkjan 13 nov 15:27 UTC: "we moeten alle alternatieven ook bedienen zoals mail sms etc").
// Klaar en uit tot er een SMS-afzender is: Twilio-variabelen TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN en WAM_SMS_FROM (nummer of Messaging Service SID)
// in Vercel. Nummers die mensen al achterlieten (p.contact.sms) krijgen dan vanzelf hun berichten. STOP regelt Twilio zelf (VS en Canada).
import { kv } from './db.js';
const N = x => Number(x) || 0;
export function smsKlaar() { return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.WAM_SMS_FROM); }
export async function stuurSms(nr, tekst) {
  if (!smsKlaar() || !/^\+\d{8,15}$/.test(String(nr || ''))) return false;
  const dag = new Date().toISOString().slice(0, 10), max = Math.max(0, Number(process.env.WAM_SMS_MAX || 60));
  const n = N(await kv.raw(['INCR', 'wam:smsd:' + dag]).catch(() => 0)); if (n === 1) kv.raw(['EXPIRE', 'wam:smsd:' + dag, '90000']).catch(() => {});
  if (n > max) return false; // dagplafond tegen een dure lus
  const sid = process.env.TWILIO_ACCOUNT_SID, van = process.env.WAM_SMS_FROM, body = new URLSearchParams({ To: nr, Body: String(tekst || '').slice(0, 600) });
  if (/^MG[0-9a-f]{32}$/i.test(van)) body.set('MessagingServiceSid', van); else body.set('From', van);
  const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', { method: 'POST', headers: { authorization: 'Basic ' + Buffer.from(sid + ':' + process.env.TWILIO_AUTH_TOKEN).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(10000) }).catch(() => null);
  return !!(r && r.ok);
}
