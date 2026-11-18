// POST: lerende lus voor alle mail die we versturen (Henkjan 18 nov 2026: "alle mail moet altijd eerst langs iets", "ook alle andere mails die we sturen hier ook lerend maken").
// Twee stromen:
//   1. persoonlijke mail uit Gmail (concept via een Claude-chat): gemeld met meld(), de ronde ziet in Gmail zelf of hij verstuurd is en of er antwoord kwam.
//   2. automatische mail via Resend (ochtendmails, updates, bevestigingen): de ronde leest de verzendlijst van Resend en telt per stroom.
// Opens tellen nergens mee voor een oordeel (mailscanners en Apple openen zelf); antwoorden, kliks, bounces en klachten wel.
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { kv } from './db.js';

export const DAG = (d = new Date()) => new Date(d).toISOString().slice(0, 10);
export const TERUG = 'https://hjdk-api-henq.vercel.app/api/post?op=terug';
const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const SOORTEN = ['journalist', 'onderzoeker', 'organisatie', 'kliniek', 'bedrijf', 'klant', 'partner', 'anders'];
const UITKOMSTEN = ['antwoord', 'ja', 'nee', 'klik', 'bounce', 'geen'];
const kort = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n);
const mailOk = s => /^[^\s@<>"']{1,64}@[a-z0-9.-]{3,190}\.[a-z]{2,24}$/i.test(String(s || ''));
const domein = a => String(a || '').split('@')[1] || '';

export function priors() {
  for (const p of [process.cwd() + '/data/post-priors.json', new URL('../data/post-priors.json', import.meta.url).pathname]) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) {} }
  return [];
}

// ---------- melden en uitkomst ----------
export async function meld(b, open) {
  const aan = kort(b.aan, 254).toLowerCase(); if (!mailOk(aan)) return { ok: false, fout: 'geef aan=<e-mailadres van de ontvanger>' };
  const doel = kort(b.doel, 160), project = kort(b.project, 40).toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!doel || !project) return { ok: false, fout: 'geef project en doel (één zin: wat moet de ontvanger doen?)' };
  const ids = priors().map(p => p.id);
  const m = {
    id: randomBytes(6).toString('hex'), t: new Date().toISOString(), project, doel, aan,
    soort: SOORTEN.includes(b.soort) ? b.soort : 'anders', taal: kort(b.taal, 5).toLowerCase() || 'nl',
    onderwerp: kort(b.onderwerp, 140), variant: kort(b.variant, 12).toLowerCase() || 'a',
    lessen: String(Array.isArray(b.lessen) ? b.lessen.join(',') : b.lessen || '').split(/[,|\s]+/).filter(x => ids.includes(x)).slice(0, 20),
    wie: kort(b.wie, 40), status: b.status === 'verstuurd' ? 'verstuurd' : 'concept', open: !!open
  };
  if (m.status === 'verstuurd') m.verstuurd = m.t;
  const dubbel = (await lijst(400)).find(x => x.aan === aan && x.project === project && x.onderwerp === m.onderwerp && !x.uitkomst);
  if (dubbel) return { ok: true, id: dubbel.id, dubbel: true };
  await kv.set('post:mail:' + m.id, m, { ex: 180 * 86400 });
  await kv.raw(['LPUSH', 'post:ids', m.id]); await kv.raw(['LTRIM', 'post:ids', 0, 2999]);
  return { ok: true, id: m.id, status: m.status };
}

export async function lijst(n = 600) {
  const ids = await kv.raw(['LRANGE', 'post:ids', 0, n - 1]).catch(() => []);
  if (!ids || !ids.length) return [];
  return (await kv.mget(...ids.map(i => 'post:mail:' + i))).filter(Boolean);
}

export async function uitkomst(b) {
  const m = await kv.get('post:mail:' + kort(b.id, 12).replace(/[^0-9a-f]/g, '')); if (!m) return { ok: false, fout: 'onbekend id' };
  if (b.uitkomst === 'verstuurd') { if (m.status !== 'verstuurd') { m.status = 'verstuurd'; m.verstuurd = new Date().toISOString(); await kv.set('post:mail:' + m.id, m, { ex: 180 * 86400 }); } return { ok: true, id: m.id, status: m.status }; }
  if (!UITKOMSTEN.includes(b.uitkomst)) return { ok: false, fout: 'uitkomst is een van: ' + UITKOMSTEN.join(', ') };
  m.uitkomst = b.uitkomst; m.uitkomstOp = new Date().toISOString(); if (b.toelichting) m.toelichting = kort(b.toelichting, 200);
  if (!m.verstuurd && b.uitkomst !== 'geen') { m.status = 'verstuurd'; m.verstuurd = m.uitkomstOp; }
  await kv.set('post:mail:' + m.id, m, { ex: 180 * 86400 });
  return { ok: true, id: m.id, uitkomst: m.uitkomst };
}

// ---------- tellen ----------
const GOED = m => ['antwoord', 'ja', 'klik'].includes(m.uitkomst);
function tel(ms, sleutel) {
  const uit = {};
  for (const m of ms) for (const k of [].concat(sleutel(m))) {
    const r = uit[k] = uit[k] || { concept: 0, verstuurd: 0, antwoord: 0, ja: 0, klik: 0, bounce: 0 };
    if (m.status === 'verstuurd') r.verstuurd++; else r.concept++;
    if (['antwoord', 'ja', 'nee'].includes(m.uitkomst)) r.antwoord++;
    if (m.uitkomst === 'ja') r.ja++; if (m.uitkomst === 'klik') r.klik++; if (m.uitkomst === 'bounce') r.bounce++;
  }
  return uit;
}

// lessen op volgorde: voorkennis (sterkte 1-4) als 8 denkbeeldige mails, daarna tellen echte mails mee
export async function regels() {
  const ms = (await lijst()).filter(m => m.status === 'verstuurd');
  return priors().map(p => {
    const met = ms.filter(m => m.lessen.includes(p.id)), goed = met.filter(GOED).length;
    const score = Math.round(100 * (goed + 8 * p.sterkte / 10) / (met.length + 8));
    return { ...p, verstuurd: met.length, goed, score };
  }).sort((a, b) => (b.vast ? 1 : 0) - (a.vast ? 1 : 0) || b.score - a.score);
}

export async function stand() {
  const ms = await lijst(), nu = Date.now();
  const liggen = ms.filter(m => m.status === 'concept' && nu - Date.parse(m.t) > 2 * 86400000);
  const g = await kv.get('post:gmail'), auto = await kv.get('post:resend:stand');
  return {
    ok: true, dag: DAG(),
    gmail: g && g.refresh ? { gekoppeld: true, sinds: g.at, laatsteRonde: g.ronde || null, fout: g.fout || null } : { gekoppeld: false, koppel: 'https://hjdk-api-henq.vercel.app/api/post?op=koppel' },
    persoonlijk: {
      totaal: tel(ms, () => 'alle').alle || {},
      perProject: tel(ms, m => m.project), perSoort: tel(ms, m => m.soort),
      perVariant: tel(ms, m => m.project + '|' + m.doel.slice(0, 40) + '|' + m.variant),
      conceptenDieLiggen: liggen.length,
      laatste: ms.slice(0, 25).map(m => ({ id: m.id, dag: m.t.slice(0, 10), project: m.project, soort: m.soort, aan: '…@' + domein(m.aan), onderwerp: m.onderwerp, variant: m.variant, status: m.status, uitkomst: m.uitkomst || null }))
    },
    automatisch: auto || { uitleg: 'nog geen ronde gedraaid' }
  };
}

// ---------- Gmail (alleen lezen) ----------
async function app() { const s = (await kv.get('hjdk:secrets').catch(() => null)) || {}; const id = process.env.GMAIL_CLIENT_ID || s.GMAIL_CLIENT_ID, secret = process.env.GMAIL_CLIENT_SECRET || s.GMAIL_CLIENT_SECRET; return id && secret ? { id, secret } : null; }
const eigenaar = () => String(process.env.GMAIL_ACCOUNT || 'henkjandekrijger@gmail.com').toLowerCase().split(',').map(x => x.trim());

export async function koppelUrl() {
  const a = await app(); if (!a) return { ok: false, fout: 'GMAIL_CLIENT_ID en GMAIL_CLIENT_SECRET ontbreken (team-variabelen in Vercel)' };
  const state = randomBytes(20).toString('hex'); await kv.set('post:state:' + state, 1, { ex: 900 });
  return { ok: true, url: 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: a.id, redirect_uri: TERUG, response_type: 'code', scope: SCOPE, access_type: 'offline', prompt: 'consent', state }) };
}

export async function koppelTerug(code, state) {
  const a = await app(); if (!a) return { ok: false, fout: 'app ontbreekt' };
  if (!/^[0-9a-f]{40}$/.test(String(state || '')) || !(await kv.get('post:state:' + state))) return { ok: false, fout: 'verlopen: begin opnieuw' };
  await kv.del(['post:state:' + state]);
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', signal: AbortSignal.timeout(12000), headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: String(code || ''), client_id: a.id, client_secret: a.secret, redirect_uri: TERUG, grant_type: 'authorization_code' }) });
  const j = await r.json().catch(() => ({})); if (!r.ok || !j.refresh_token) return { ok: false, fout: 'Google gaf geen blijvende toegang (' + kort(j.error || r.status, 60) + ')' };
  const p = await (await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: { authorization: 'Bearer ' + j.access_token }, signal: AbortSignal.timeout(12000) })).json().catch(() => ({}));
  const adres = String(p.emailAddress || '').toLowerCase();
  if (!eigenaar().includes(adres)) return { ok: false, fout: 'dit is niet het Gmail-account van Henkjan; er is niets opgeslagen' };
  await kv.set('post:gmail', { refresh: j.refresh_token, adres, at: new Date().toISOString() });
  return { ok: true, adres: adres.replace(/^(.).*(@.*)$/, '$1…$2') };
}

async function gmailToken() {
  const a = await app(), g = await kv.get('post:gmail'); if (!a || !g || !g.refresh) return null;
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', signal: AbortSignal.timeout(12000), headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: a.id, client_secret: a.secret, refresh_token: g.refresh, grant_type: 'refresh_token' }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) { g.fout = 'toegang geweigerd (' + kort(j.error || r.status, 40) + '): koppel opnieuw'; await kv.set('post:gmail', g); return null; }
  return j.access_token;
}
async function zoek(tok, q) {
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1&q=' + encodeURIComponent(q), { headers: { authorization: 'Bearer ' + tok }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error('gmail ' + r.status); const j = await r.json(); return (j.messages || [])[0] || null;
}

// per gemelde mail: staat hij in Verzonden, kwam er antwoord, kwam hij terug
export async function gmailRonde(max = 60) {
  const tok = await gmailToken(); if (!tok) return { gekoppeld: false };
  const nu = Date.now(), ms = (await lijst()).filter(m => !m.uitkomst && nu - Date.parse(m.t) < 45 * 86400000).slice(0, max);
  const uit = { gekoppeld: true, bekeken: ms.length, verstuurd: 0, antwoord: 0, bounce: 0, fouten: 0 };
  for (const m of ms) {
    try {
      const sinds = Math.floor(Date.parse(m.t) / 1000) - 3600; let wijzig = false;
      if (m.status !== 'verstuurd' && await zoek(tok, 'in:sent to:' + m.aan + ' after:' + sinds)) { m.status = 'verstuurd'; m.verstuurd = new Date().toISOString(); uit.verstuurd++; wijzig = true; }
      if (m.status === 'verstuurd') {
        if (await zoek(tok, 'from:' + m.aan + ' after:' + sinds)) { m.uitkomst = 'antwoord'; m.uitkomstOp = new Date().toISOString(); uit.antwoord++; wijzig = true; }
        else if (await zoek(tok, 'from:mailer-daemon "' + m.aan + '" after:' + sinds)) { m.uitkomst = 'bounce'; m.uitkomstOp = new Date().toISOString(); uit.bounce++; wijzig = true; }
        else if (nu - Date.parse(m.verstuurd) > 30 * 86400000) { m.uitkomst = 'geen'; m.uitkomstOp = new Date().toISOString(); wijzig = true; }
      }
      if (wijzig) await kv.set('post:mail:' + m.id, m, { ex: 180 * 86400 });
    } catch (e) { uit.fouten++; if (uit.fouten > 3) break; }
  }
  const g = await kv.get('post:gmail'); if (g) { g.ronde = new Date().toISOString(); if (!uit.fouten) delete g.fout; await kv.set('post:gmail', g); }
  return uit;
}

// ---------- Resend: alle automatische mail ----------
async function resendKey() { if (process.env.RESEND_API_KEY || process.env.RESEND) return process.env.RESEND_API_KEY || process.env.RESEND; return ((await kv.get('hjdk:secrets').catch(() => null)) || {}).RESEND_API_KEY || ''; }
// één stroom = afzender + onderwerp zonder cijfers, datums en namen tussen aanhalingstekens
export const stroomVan = e => { const van = (String(e.from || '').match(/<([^>]+)>/) || [0, String(e.from || '')])[1].toLowerCase(); return van + ' | ' + String(e.subject || '').replace(/\d+([.,:]\d+)*/g, '#').replace(/\s+/g, ' ').trim().slice(0, 70); };

export function telResend(emails, dagen = 7, nu = Date.now()) {
  const str = {};
  for (const e of emails) {
    const t = Date.parse(e.created_at); if (!(nu - t < dagen * 86400000)) continue;
    const s = str[stroomVan(e)] = str[stroomVan(e)] || { n: 0, bezorgd: 0, geopend: 0, klik: 0, bounce: 0, klacht: 0 };
    const ev = String(e.last_event || ''); s.n++;
    if (['delivered', 'opened', 'clicked'].includes(ev)) s.bezorgd++; if (ev === 'opened' || ev === 'clicked') s.geopend++; if (ev === 'clicked') s.klik++;
    if (ev === 'bounced' || ev === 'failed') s.bounce++; if (ev === 'complained') s.klacht++;
  }
  const stromen = Object.entries(str).map(([stroom, s]) => ({ stroom, ...s })).sort((a, b) => b.n - a.n);
  const werk = [];
  // kliks tellen alleen voor afzenders waar Resend kliks meet (anders is 0 kliks een meetgat, geen uitkomst)
  const meet = new Set(stromen.filter(s => s.klik).map(s => s.stroom.split(' | ')[0]));
  for (const s of stromen) {
    if (s.n >= 20 && s.bounce / s.n > 0.05) werk.push(s.stroom + ': ' + s.bounce + ' van ' + s.n + ' komt terug. Adressen controleren bij aanmelden.');
    if (s.klacht) werk.push(s.stroom + ': ' + s.klacht + ' spamklacht(en). Afmeldlink en verwachting bij aanmelden nakijken.');
    if (meet.has(s.stroom.split(' | ')[0]) && s.n >= 50 && s.klik / s.n < 0.01) werk.push(s.stroom + ': ' + s.klik + ' kliks op ' + s.n + ' mails. Onderwerp en eerste link zijn de eerste proef.');
  }
  const alle = [...new Set(stromen.map(s => s.stroom.split(' | ')[0]))];
  return { dagen, mails: stromen.reduce((a, s) => a + s.n, 0), kliksGemeten: [...meet], kliksNietGemeten: alle.filter(x => !meet.has(x)), stromen: stromen.slice(0, 40), werk };
}

export async function resendRonde(paginas = 30) {
  const key = await resendKey(); if (!key) return { fout: 'geen mailsleutel' };
  const alle = []; let na = '';
  for (let i = 0; i < paginas; i++) {
    const r = await fetch('https://api.resend.com/emails?limit=100' + (na ? '&after=' + na : ''), { headers: { authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) { if (!alle.length) return { fout: 'resend ' + r.status }; break; }
    const j = await r.json().catch(() => ({})); const d = j.data || []; alle.push(...d);
    if (!j.has_more || !d.length || Date.now() - Date.parse(d[d.length - 1].created_at) > 7 * 86400000) break; na = d[d.length - 1].id;
  }
  const s = { ...telResend(alle), at: new Date().toISOString(), uitleg: 'laatste 7 dagen uit de verzendlijst van Resend (hooguit ' + paginas * 100 + ' mails); geopend is alleen een aanwijzing' };
  await kv.set('post:resend:stand', s); await kv.set('post:resend:' + DAG(), s, { ex: 120 * 86400 });
  return s;
}

export async function ronde() {
  const gmail = await gmailRonde().catch(e => ({ fout: String(e && e.message || e).slice(0, 80) }));
  const resend = await resendRonde().catch(e => ({ fout: String(e && e.message || e).slice(0, 80) }));
  await kv.set('post:ronde', { at: new Date().toISOString(), gmail, resend: { mails: resend.mails, werk: (resend.werk || []).length, fout: resend.fout } });
  return { ok: true, gmail, resend: { mails: resend.mails, stromen: (resend.stromen || []).length, werk: resend.werk, fout: resend.fout } };
}

export const adresHash = a => createHash('sha256').update(String(a).toLowerCase()).digest('hex').slice(0, 12);
