// Google Ads API rechtstreeks (zonder tussenpartij). Zelfde sleutelloze route als Search Console: Vercel OIDC -> Google WIF -> serviceaccount
// seo-leerlus@hjdk-seo, nu met scope adwords. Het serviceaccount moet als gebruiker in Google Ads staan (Beheer > Toegang en beveiliging).
// Gedeelde team-variabelen: GADS_DEV_TOKEN (ontwikkelaarstoken, minstens Basic), GADS_CUSTOMER_ID (account waaronder we meten),
// optioneel GADS_LOGIN_CID (manageraccount als het serviceaccount via de manager toegang heeft) en GADS_VERSION.
import { kv } from './db.js';
import { token } from './gsc.js';

const SCOPE = 'https://www.googleapis.com/auth/adwords';
const digits = v => String(v || '').replace(/\D/g, '');
export const cfg = () => ({ dev: process.env.GADS_DEV_TOKEN || '', cid: digits(process.env.GADS_CUSTOMER_ID), login: digits(process.env.GADS_LOGIN_CID), ver: process.env.GADS_VERSION || '' });
// land -> Google geo- en taalcode
export const LAND = { nl: { geo: 2528, taal: 1010 }, us: { geo: 2840, taal: 1000 }, uk: { geo: 2826, taal: 1000 }, gb: { geo: 2826, taal: 1000 }, de: { geo: 2276, taal: 1001 }, be: { geo: 2056, taal: 1010 }, at: { geo: 2040, taal: 1001 }, ch: { geo: 2756, taal: 1001 }, ca: { geo: 2124, taal: 1000 }, au: { geo: 2036, taal: 1000 } };
const VERSIES = ['v24', 'v23', 'v22', 'v21', 'v20'];
const DAGCAP = Number(process.env.GADS_DAGCAP || 2000); // eigen rem: maximaal aantal API-aanroepen per dag
const DAY = () => new Date().toISOString().slice(0, 10);

async function rem() { const k = 'hjdk:gads:n:' + DAY(); const n = await kv.raw(['INCR', k]).catch(() => 0); if (n === 1) kv.raw(['EXPIRE', k, 172800]).catch(() => {}); if (Number(n) > DAGCAP) throw new Error('dagplafond van ' + DAGCAP + ' aanroepen bereikt'); return Number(n) || 0; }

async function headers(oidc) {
  const c = cfg(); if (!c.dev) throw new Error('GADS_DEV_TOKEN ontbreekt');
  const h = { authorization: 'Bearer ' + await token(oidc, SCOPE), 'developer-token': c.dev, 'content-type': 'application/json' };
  if (c.login) h['login-customer-id'] = c.login; return h;
}
function fout(j, status) { const e = (j && j.error) || {}; const d = JSON.stringify(e.details || '').match(/"(errorCode|reason)":\{?"?([A-Za-z_]+)"?:?"?([A-Z_]*)/); return (status + ' ' + (e.message || '') + (d ? ' [' + (d[3] || d[2]) + ']' : '')).slice(0, 300); }

// werkende API-versie vinden en onthouden (Google zet oude versies na ongeveer een jaar uit)
async function call(method, path, body, oidc) {
  const c = cfg(); await rem(); const h = await headers(oidc);
  const known = c.ver || await kv.get('hjdk:gads:ver').catch(() => null);
  const tries = known ? [known].concat(VERSIES.filter(v => v !== known)) : VERSIES;
  let last = '';
  for (const v of tries) {
    const r = await fetch(`https://googleads.googleapis.com/${v}/${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 404 && /<html|not found/i.test(await r.clone().text().catch(() => ''))) { last = v + ' bestaat niet'; continue; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(fout(j, r.status));
    if (v !== known) kv.set('hjdk:gads:ver', v).catch(() => {});
    return j;
  }
  throw new Error('geen werkende API-versie (' + last + ')');
}

export async function toegang(oidc) { const j = await call('GET', 'customers:listAccessibleCustomers', null, oidc); return (j.resourceNames || []).map(x => x.split('/').pop()); }

const m = x => x == null ? null : Math.round(Number(x) / 1e4) / 100; // micros -> valuta met 2 decimalen
const metr = k => k ? { vol: k.avgMonthlySearches != null ? Number(k.avgMonthlySearches) : null, conc: k.competition || null, laag: m(k.lowTopOfPageBidMicros), hoog: m(k.highTopOfPageBidMicros), cpc: m(k.averageCpcMicros), maanden: (k.monthlySearchVolumes || []).map(x => [x.year + '-' + String(MONTHS.indexOf(x.month) + 1).padStart(2, '0'), Number(x.monthlySearches || 0)]) } : null;
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const loc = land => { const l = LAND[String(land || 'nl').toLowerCase()]; if (!l) throw new Error('onbekend land ' + land); return { geoTargetConstants: ['geoTargetConstants/' + l.geo], language: 'languageConstants/' + l.taal }; };

// exacte cijfers voor een vaste lijst zoektermen (ook lange vragen; tot 10.000 per keer)
export async function volumes(land, keywords, oidc) {
  const c = cfg(); if (!c.cid) throw new Error('GADS_CUSTOMER_ID ontbreekt');
  const kws = [...new Set(keywords.map(k => String(k).trim().toLowerCase()).filter(Boolean))].slice(0, 10000);
  const out = [];
  for (let i = 0; i < kws.length; i += 1000) {
    const j = await call('POST', `customers/${c.cid}:generateKeywordHistoricalMetrics`, Object.assign({ keywords: kws.slice(i, i + 1000), keywordPlanNetwork: 'GOOGLE_SEARCH', includeAdultKeywords: false }, loc(land)), oidc);
    (j.results || []).forEach(r => out.push(Object.assign({ q: r.text, varianten: r.closeVariants || [] }, metr(r.keywordMetrics))));
  }
  return out;
}

// nieuwe ideeën rond een paar startwoorden (of een pagina-adres)
export async function ideeen(land, seeds, opts, oidc) {
  const c = cfg(); if (!c.cid) throw new Error('GADS_CUSTOMER_ID ontbreekt'); opts = opts || {};
  const body = Object.assign({ keywordPlanNetwork: 'GOOGLE_SEARCH', includeAdultKeywords: false, pageSize: Math.min(Number(opts.max) || 500, 1000) }, loc(land));
  if (seeds && seeds.length && opts.url) body.keywordAndUrlSeed = { url: opts.url, keywords: seeds.slice(0, 20) };
  else if (opts.url) body.urlSeed = { url: opts.url };
  else body.keywordSeed = { keywords: seeds.slice(0, 20) };
  const j = await call('POST', `customers/${c.cid}:generateKeywordIdeas`, body, oidc);
  return (j.results || []).map(r => Object.assign({ q: r.text }, metr(r.keywordIdeaMetrics)));
}

// vragende zoektermen: wie/wat/hoe/kost/mag ... in vier talen
export const VRAAG = /^(wie|wat|hoe|hoeveel|waarom|wanneer|mag|moet|kan|welke|who|what|how|why|when|can|should|does|do|is|are|which|wer|wen|was|wie|warum|wann|muss|darf|kann|welche)\b|\b(wat te doen|wat nu|kosten|kost|cost|price|what to do|who to call|who is responsible|was tun|wer zahlt|kostet|kosten)\b/i;
