// Clickmind: terugbetalingsdossier zelf indienen (Henkjan 13 nov 2026, punt 5 van "Clickmind 10x beter": "Ja voer ze alle 7 door";
// eerder die dag "Ja, nu indienen" voor 10-12 nov). Elke ochtend na het nachtdossier (cron /api/mm/terugdag, 05:40 UTC) gaat het
// dossier van de vorige netwerkdag per mail naar PropellerAds-support, binnen de termijn van 3 kalenderdagen (voorwaarden §4.2).
// Alleen de kliks met sterk bewijs (datacenter, bot of headless, emulator, serieklik: dezelfde persoon 3+ keer binnen 10 minuten)
// als CSV-bijlage. Henkjan staat in cc en is het antwoordadres, zodat PropellerAds hem direct antwoordt. Eenmaal per netwerkdag
// (mm:terug:ingediend:<net>:<dag>). Uit te zetten met mm:instelling terugAuto=false. Alleen PropellerAds: RichAds alleen bij
// bevestigde bots, MGID via de accountmanager (andere regels).
import { dossier, naarCsv } from './terug.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const AAN = { propeller: 'support@propellerads.com' };
const HENKJAN = 'henkjandekrijger@gmail.com';
const MIN_STERK = 100; // kleinere dagen zijn de moeite van een bericht niet waard
// afzender: eerste geverifieerde Resend-domein uit deze lijst (of CLICKMIND_MAIL_FROM)
const AFZENDERS = () => [process.env.CLICKMIND_MAIL_FROM, 'Henkjan de Krijger <henkjan@todayin.email>', 'Henkjan de Krijger <henkjan@wearemany.now>', 'Henkjan de Krijger <henkjan@bzz.today>', 'Henkjan de Krijger <henkjan@moonlighter.email>'].filter(Boolean);

async function sleutel(kv) { if (process.env.RESEND_API_KEY || process.env.RESEND) return process.env.RESEND_API_KEY || process.env.RESEND; try { return ((await kv.get('hjdk:secrets')) || {}).RESEND_API_KEY || ''; } catch (e) { return ''; } }

export async function resendDomeinen(kv) {
  const k = await sleutel(kv); if (!k) return { ok: false, fout: 'geen Resend-sleutel' };
  const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: 'Bearer ' + k } }).catch(e => ({ ok: false, status: 0, json: async () => ({ fout: String(e.message || e) }) }));
  const j = await r.json().catch(() => ({}));
  return { ok: !!r.ok, status: r.status, domeinen: (j.data || []).map(d => ({ naam: d.name, status: d.status })) };
}

async function kiesAfzender(kv) {
  if (process.env.CLICKMIND_MAIL_FROM) return process.env.CLICKMIND_MAIL_FROM;
  const d = await resendDomeinen(kv).catch(() => null);
  const ok = new Set(((d && d.domeinen) || []).filter(x => x.status === 'verified').map(x => x.naam));
  for (const a of AFZENDERS()) { const dom = (String(a).match(/@([^>\s]+)/) || [])[1]; if (dom && ok.has(dom)) return a; }
  return null;
}

function tekst(d, sterk, perReden) {
  const n = x => Number(x).toLocaleString('en-US');
  const serie = N(perReden['serieklik: zelfde persoon 3 of meer keer binnen 10 minuten']), dc = N(perReden['datacenter']);
  const zones = new Set(sterk.map(r => r.zone)).size, camps = new Set(sterk.map(r => r.campagne)).size;
  return `Hello PropellerAds team,

Under section 4.2 of your advertiser terms I'm submitting a substantiated report on invalid clicks in my account (${HENKJAN}) for ${d.van}, EST, the same day boundaries as your statistics. Please review it and credit the cost of these clicks to my balance.

Every paid click in these campaigns passes through my own click tracker before it reaches the landing page. That lets us match each record to your click ID (the \${SUBID} macro), campaign, zone and creative.

${d.van}: ${n(sterk.length)} clicks with strong evidence in ${camps} campaigns and ${zones} zones (${n(serie)} serial clicks, ${n(dc)} from data center IP ranges). ${n(d.verdacht)} suspicious in total out of ${n(d.kliksViaOns)} clicks through our tracker.

What the categories mean:
- Serial click: the same user and device clicked our ads 3 or more times within 10 minutes. Every click was charged separately.
- Data center: the click came from a hosting or cloud ASN, not from a consumer connection.
- Smaller numbers: headless or automated browsers, emulators, bot user-agents, and click IDs that arrived several times, each time with bot signals.

The attached CSV lists every click with strong evidence: your click ID, time in UTC and EST, campaign, zone, creative, IP network (/24), ASN, country and the reasons.

This is a daily report from my tracker; you'll get one for each day that has clicks like these. If you'd like it in another format, or per zone instead of per click, just reply.

Thank you,

Henkjan de Krijger
AdsFair B.V.

Talk to me directly: https://meeting.nexy.works/a54blu
Email: ${HENKJAN}
WhatsApp: https://wa.me/31655395630 (+31 6 55395630)`;
}

// markeer een dag als ingediend (ook voor wat met de hand ging, zoals 10-12 nov via Gmail)
export async function markeerIngediend(kv, { net = 'propeller', dag, via = 'hand', sterk = null, id = null }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dag || ''))) return { ok: false, fout: 'dag' };
  const x = { t: new Date().toISOString(), via: String(via).slice(0, 40), sterk, id };
  await kv.set('mm:terug:ingediend:' + net + ':' + dag, x, { ex: 120 * 86400 });
  return { ok: true, net, dag, ...x };
}

export async function indienAuto(kv, { net = 'propeller', dag, droog = false } = {}) {
  const naar = AAN[net]; if (!naar) return { ok: false, fout: 'geen automatisch indienen voor ' + net };
  const inst = (await kv.get('mm:instelling').catch(() => null)) || {};
  if (inst.terugAuto === false) return { ok: false, overgeslagen: 'uit (mm:instelling terugAuto=false)' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dag || ''))) return { ok: false, fout: 'dag' };
  const al = await kv.get('mm:terug:ingediend:' + net + ':' + dag).catch(() => null);
  if (al) return { ok: true, overgeslagen: 'al ingediend', ...al };
  const d = await dossier(kv, { net, van: dag, tot: dag, maxRijen: 20000 });
  const sterk = d.rijen.filter(r => r.sterk);
  if (sterk.length < MIN_STERK) return { ok: true, overgeslagen: 'maar ' + sterk.length + ' kliks met sterk bewijs (minder dan ' + MIN_STERK + ')' };
  const perReden = {}; for (const r of sterk) for (const x of r.redenen) { const k = x.replace(/ \(.*$/, ''); perReden[k] = N(perReden[k]) + 1; }
  const csv = naarCsv({ ...d, rijen: sterk });
  const onderwerp = 'Invalid traffic report – advertiser ' + HENKJAN + ' – ' + dag + ' (EST)';
  const body = tekst(d, sterk, perReden);
  if (droog) return { ok: true, droog: true, naar, onderwerp, sterk: sterk.length, verdacht: d.verdacht, csvBytes: csv.length, tekst: body };
  const van = await kiesAfzender(kv);
  if (!van) return { ok: false, fout: 'geen geverifieerd Resend-domein voor de afzender (zet CLICKMIND_MAIL_FROM)' };
  const k = await sleutel(kv);
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + k, 'content-type': 'application/json' }, body: JSON.stringify({
    from: van, to: [naar], cc: [HENKJAN], reply_to: HENKJAN, subject: onderwerp, text: body,
    attachments: [{ filename: 'propellerads-invalid-clicks-' + dag + '.csv', content: Buffer.from(csv, 'utf8').toString('base64') }]
  }) }).catch(e => ({ ok: false, status: 0, json: async () => ({ message: String(e.message || e) }) }));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, fout: 'Resend ' + r.status + ': ' + String(j.message || j.error || '').slice(0, 200), van };
  return markeerIngediend(kv, { net, dag, via: 'auto ' + van, sterk: sterk.length, id: j.id || null });
}
