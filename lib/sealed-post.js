// Sealed Intent: anonieme berichten tussen een eigenaar en passende kopers (Henkjan 17 nov 2026: "En ze laten mailen met ons. Dus zij mailen
// iets en krijgen respons van de kopers totaal anoniem"). De eigenaar schrijft op zijn privépagina (geen e-mailadres: dat zou verraden wie
// hij is), wij sturen het door naar kopers met dezelfde winstklasse en sector, de koper antwoordt via een eigen link en de eigenaar leest
// dat op zijn privépagina. Niemand ziet een naam of adres van de ander. Contactgegevens in een bericht worden geweigerd tot beide ja zeggen;
// na twee keer ja krijgt Henkjan een melding en regelt hij de introductie. Koppelen: alleen inzendingen die aan staan (active).
import { createHash, randomBytes } from 'node:crypto';

const TTL = 37 * 86400, MAX_KOPERS = 10, MAX_BERICHTEN = 30;
const CONTACT = /https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[^\s@]+|(?:\+\d{1,3}[ ()-]*)\d[\d ()-]{7,}|\b(?:\d[ .()-]?){10,15}\b|linkedin/i;
const schoon = s => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600);
const tk = tid => 'si:t:' + tid;
// De sleutel van de koper is af te leiden uit het gespreksnummer en een geheim op de server: nergens opgeslagen, wel opnieuw te maken.
export const koperSleutel = tid => createHash('sha256').update((process.env.HJDK_TOKEN || 'sealed-geen-geheim') + ':post:' + tid).digest('base64url');
export const koperLink = (taal, tid) => 'https://sealedintent.com/' + (['nl', 'en', 'de'].includes(taal) ? taal : 'en') + '/gesprek#' + tid + '.' + koperSleutel(tid);

export function past(intent, koper) {
  if (!intent || !koper || !intent.size || intent.size !== koper.size) return false;
  return intent.sector === koper.sector || intent.sector === 'other' || koper.sector === 'other';
}
async function kopersVoor(kv, intent) {
  const ids = await kv.raw(['LRANGE', 'si:buyers', 0, 199]).catch(() => []); if (!ids || !ids.length) return [];
  const recs = await kv.mget(...ids.map(i => 'si:b:' + i)); return recs.filter(k => k && past(intent, k)).slice(0, MAX_KOPERS);
}
const koperBeeld = k => ({ kind: k.kind, sector: k.sector, size: k.size, offer: Array.isArray(k.offer) ? k.offer.slice(0, 6) : [] });
const intentBeeld = i => ({ type: i.type, sector: i.sector, size: i.size, terms: i.terms, plausible: i.plausible === true, active: Date.now() < Date.parse(i.expires) });
const draden = async (kv, intentId) => { const ids = await kv.raw(['LRANGE', 'si:it:' + intentId, 0, 49]).catch(() => []); if (!ids || !ids.length) return []; return (await kv.mget(...ids.map(tk))).filter(Boolean); };
async function bewaar(kv, t) { await kv.set(tk(t.tid), t, { ex: TTL }); }
function tekstOk(t, x) { if (x.length < 2) return 'leeg'; if (!(t.ja && t.ja.o && t.ja.b) && CONTACT.test(x)) return 'contact'; if ((t.msgs || []).length >= MAX_BERICHTEN) return 'vol'; return ''; }

// Eigenaar. intent: de record die bij zijn geldige privésleutel hoort (door api/sealed.js gecontroleerd). stuurMail(koper, draad) is optioneel.
export async function eigenaarPost(kv, intent, b, { stuurMail, meld } = {}) {
  const a = b.a || 'lijst', actief = Date.now() < Date.parse(intent.expires);
  let lijst = await draden(kv, intent.id);
  if (a === 'stuur') {
    const x = schoon(b.tekst); if (!actief) return { ok: false, error: 'verlopen' };
    if (b.tid) { const t = lijst.find(d => d.tid === b.tid); if (!t) return { ok: false, error: 'onbekend' }; const f = tekstOk(t, x); if (f) return { ok: false, error: f };
      t.msgs.push({ w: 'o', x, at: new Date().toISOString() }); await bewaar(kv, t); if (stuurMail) { const k = await kv.get('si:b:' + t.buyer).catch(() => null); if (k) t.verstuurd = (await stuurMail(k, t).catch(() => false)) || t.verstuurd || false, await bewaar(kv, t); } }
    else { if (x.length < 2) return { ok: false, error: 'leeg' }; if (CONTACT.test(x)) return { ok: false, error: 'contact' };
      const dk = 'si:post-dag:' + intent.id + ':' + new Date().toISOString().slice(0, 10), n = +(await kv.incr(dk).catch(() => 9)); if (n === 1) kv.raw(['EXPIRE', dk, 90000]).catch(() => {}); if (n > 3) return { ok: false, error: 'rem' };
      const kopers = await kopersVoor(kv, intent); let nieuw = 0, gemaild = 0;
      for (const k of kopers) { let t = lijst.find(d => d.buyer === k.id);
        if (!t) { t = { tid: randomBytes(12).toString('hex'), intent: intent.id, buyer: k.id, taal: k.language || 'en', created: new Date().toISOString(), msgs: [], ja: { o: false, b: false } }; await kv.raw(['LPUSH', 'si:it:' + intent.id, t.tid]).catch(() => {}); kv.raw(['EXPIRE', 'si:it:' + intent.id, TTL]).catch(() => {}); await kv.raw(['LPUSH', 'si:threads', t.tid]).catch(() => {}); kv.raw(['LTRIM', 'si:threads', 0, 499]).catch(() => {}); lijst.push(t); nieuw++; }
        if (tekstOk(t, x)) continue; t.msgs.push({ w: 'o', x, at: new Date().toISOString() });
        if (stuurMail) { const ok = await stuurMail(k, t).catch(() => false); if (ok) { t.verstuurd = true; gemaild++; } }
        await bewaar(kv, t); }
      if (meld && kopers.length) { try { await meld(`Een eigenaar stuurde een anoniem bericht aan ${kopers.length} passende koper(s); per mail verstuurd: ${gemaild}. ${gemaild < kopers.length ? 'De rest wacht: links staan bij op=kopers (gesprekken).' : ''}`); } catch { /* melding is extra */ } }
      if (!kopers.length) { await kv.set('si:wacht:' + intent.id, { x, at: new Date().toISOString() }, { ex: TTL }).catch(() => {}); } }
    lijst = await draden(kv, intent.id);
  }
  if (a === 'ja') { const t = lijst.find(d => d.tid === b.tid); if (!t) return { ok: false, error: 'onbekend' }; t.ja.o = true; await bewaar(kv, t); if (t.ja.b && meld) { try { await meld('Twee keer ja: eigenaar en koper willen een introductie. Gesprek ' + t.tid + ' (op=kopers).'); } catch { /* extra */ } } }
  const wacht = await kv.get('si:wacht:' + intent.id).catch(() => null);
  const kopers = lijst.length ? [] : await kopersVoor(kv, intent);
  return { ok: true, actief, heeftOmvang: !!intent.size, passend: lijst.length || kopers.length, wacht: wacht && !lijst.length ? wacht.x : '',
    gesprekken: await Promise.all(lijst.map(async t => { const k = await kv.get('si:b:' + t.buyer).catch(() => null); return { tid: t.tid, koper: k ? koperBeeld(k) : null, msgs: t.msgs, ja: t.ja }; })) };
}

// Een nieuwe koper: bezorg berichten van eigenaren die al wachtten op een passende koper.
export async function bezorgWachtend(kv, koper, opts = {}) {
  const ids = await kv.raw(['LRANGE', 'si:list', 0, 99]).catch(() => []); let n = 0;
  for (const id of ids || []) { const w = await kv.get('si:wacht:' + id).catch(() => null); if (!w) continue; const intent = await kv.get('si:i:' + id).catch(() => null);
    if (!intent || intent.mode === 'partner' || Date.now() >= Date.parse(intent.expires) || !past(intent, koper)) continue;
    const r = await eigenaarPost(kv, intent, { a: 'stuur', tekst: w.x }, opts); if (r.ok && r.gesprekken.length) { await kv.del('si:wacht:' + id).catch(() => {}); n++; } }
  return n;
}

// Koper, met het gespreksnummer en de sleutel uit zijn link.
export async function koperPost(kv, b, { meld, seintje } = {}) {
  const tid = String(b.tid || ''), sleutel = String(b.sleutel || ''); if (!/^[a-f0-9]{24}$/.test(tid) || sleutel !== koperSleutel(tid)) return { ok: false, error: 'onbekend' };
  const t = await kv.get(tk(tid)).catch(() => null); if (!t) return { ok: false, error: 'onbekend' };
  const intent = await kv.get('si:i:' + t.intent).catch(() => null); if (!intent) return { ok: false, error: 'weg' };
  if (b.a === 'stuur') { const x = schoon(b.tekst), f = tekstOk(t, x); if (f) return { ok: false, error: f }; t.msgs.push({ w: 'b', x, at: new Date().toISOString() }); await bewaar(kv, t); if (seintje) await seintje(t.intent).catch(() => {}); }
  if (b.a === 'ja') { t.ja.b = true; await bewaar(kv, t); if (t.ja.o && meld) { try { await meld('Twee keer ja: eigenaar en koper willen een introductie. Gesprek ' + t.tid + ' (op=kopers).'); } catch { /* extra */ } } }
  return { ok: true, eigenaar: intentBeeld(intent), msgs: t.msgs, ja: t.ja };
}

// Voor Henkjan (op=kopers): welke gesprekken er zijn en welke kopers hun link nog niet per mail kregen.
export async function gesprekkenLijst(kv) {
  const ids = await kv.raw(['LRANGE', 'si:threads', 0, 49]).catch(() => []); if (!ids || !ids.length) return [];
  const ts = (await kv.mget(...ids.map(tk))).filter(Boolean);
  return Promise.all(ts.map(async t => { const k = await kv.get('si:b:' + t.buyer).catch(() => null); return { tid: t.tid, sinds: t.created, berichten: t.msgs.length, ja: t.ja, verstuurd: !!t.verstuurd, koperMail: k ? k.mail : null, link: koperLink(t.taal, t.tid) }; }));
}

// Mail aan de koper: alleen als er een geverifieerd afzenderadres is ingesteld (SEALED_MAIL_FROM), anders blijft het gesprek wachten.
const M = {
  nl: ['Een eigenaar die bij je criteria past heeft een bericht voor je', 'Een eigenaar die past bij wat je zoekt heeft je via Sealed Intent een bericht gestuurd. Je ziet geen naam en de eigenaar ziet de jouwe niet.', 'Lees en antwoord', 'Je krijgt dit omdat je koopcriteria vastlegde op sealedintent.com. Niet meer ontvangen? Antwoord met STOP. Vragen: app Henkjan de Krijger op +31 6 55395630.'],
  en: ['An owner who fits your criteria has a message for you', 'An owner who fits what you are looking for sent you a message through Sealed Intent. You see no name and the owner does not see yours.', 'Read and reply', 'You get this because you set down acquisition criteria on sealedintent.com. No more of these? Reply STOP. Questions: message Henkjan de Krijger on WhatsApp at +31 6 55395630.'],
  de: ['Ein Inhaber, der zu Ihren Kriterien passt, hat eine Nachricht für Sie', 'Ein Inhaber, der zu Ihrer Suche passt, hat Ihnen über Sealed Intent eine Nachricht geschickt. Sie sehen keinen Namen, und der Inhaber sieht Ihren nicht.', 'Lesen und antworten', 'Sie erhalten dies, weil Sie Kaufkriterien auf sealedintent.com festgehalten haben. Nicht mehr erhalten? Antworten Sie mit STOP. Fragen: Henkjan de Krijger per WhatsApp unter +31 6 55395630.'],
};
export function maakMailer(kv) {
  const van = process.env.SEALED_MAIL_FROM || ''; if (!van) return null;
  const sleutel = async () => process.env.RESEND_API_KEY || process.env.RESEND || ((await kv.get('hjdk:secrets').catch(() => null)) || {}).RESEND_API_KEY || '';
  const stuur = async (aan, onderwerp, tekst) => { const s = await sleutel(); if (!s || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(aan || '')) return false;
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { authorization: 'Bearer ' + s, 'content-type': 'application/json' }, body: JSON.stringify({ from: van, to: [aan], subject: onderwerp, text: tekst }) }); return r.ok; };
  return {
    koper: (k, t) => { const m = M[t.taal] || M.en, laatste = [...t.msgs].reverse().find(x => x.w === 'o'); return stuur(k.mail, m[0], m[1] + '\n\n"' + (laatste ? laatste.x : '') + '"\n\n' + m[2] + ': ' + koperLink(t.taal, t.tid) + '\n\n' + m[3]); },
    eigenaar: async intentId => { const n = await kv.get('si:notify:' + intentId).catch(() => null); if (!n || !n.mail) return false; return stuur(n.mail, 'Sealed Intent: er is een reactie', 'Een koper heeft gereageerd. Open je privélink om het te lezen. / A buyer replied. Open your private link to read it.\n\nsealedintent.com'); },
  };
}
