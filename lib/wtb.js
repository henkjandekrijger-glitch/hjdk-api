// WTB — de internationale keuzehulpmotor (zelfde concept als keuzehulp.best): whichtobuy.best (VS, Amazon.com) en kaufberater.best (DE, Amazon.de).
// Eén motor, per land eigen taal, eigen producten, eigen tag. Alles in Redis, alles in de cloud (Vercel), los van een Claude-account of computer.
// Producten: officiële Amazon Creators API (AMAZON_CREATORS_ID + AMAZON_CREATORS_SECRET). Zonder die sleutels: een Amazon-zoeklink met tag (geen prijzen).
import { kv } from './db.js';

export const INDEXNOW_KEY = '7c1e4b9a2f6d48e3a05b9c71d2e8f4a6';
const S = {
  en: { home: 'All buying guides', q: 'Answer 3 quick questions', pick: 'Our pick for you', alt: 'Also good', see: 'See price on Amazon', seeAll: 'See current options on Amazon', fallback: 'Live Amazon results for your answers', mistakes: 'Common mistakes', guide: 'What actually matters', aimiss: 'What AI answers often get wrong here', faq: 'Questions people ask', related: 'More buying guides', updated: 'Updated', disc: 'As an Amazon Associate we earn from qualifying purchases. This never changes the price you pay.', priceNote: 'Prices and availability as of', priceNote2: 'are subject to change; the price on Amazon at the time of purchase applies.', why: 'Why this guide', noPrice: 'Check today\'s price on Amazon', none: 'No exact match for this combination yet. Here are live Amazon results instead.', about: 'About', hero: 'Not sure which one to buy?', heroP: 'Three questions, one honest pick, today\'s Amazon price. Written for 2026, not copied from a 2023 list.', all: 'All guides', cat: 'Category', by: 'By', wait: 'Loading today\'s picks…', start: 'Start' },
  de: { home: 'Alle Kaufberater', q: 'Beantworte 3 kurze Fragen', pick: 'Unsere Empfehlung für dich', alt: 'Auch gut', see: 'Preis bei Amazon ansehen', seeAll: 'Aktuelle Angebote bei Amazon ansehen', fallback: 'Live-Ergebnisse bei Amazon für deine Antworten', mistakes: 'Häufige Fehler', guide: 'Worauf es wirklich ankommt', aimiss: 'Was KI-Antworten hier oft falsch machen', faq: 'Häufige Fragen', related: 'Weitere Kaufberater', updated: 'Aktualisiert', disc: 'Als Amazon-Partner verdienen wir an qualifizierten Verkäufen. Der Preis für dich ändert sich dadurch nicht.', priceNote: 'Preise und Verfügbarkeit Stand', priceNote2: 'können sich ändern; maßgeblich ist der Preis bei Amazon zum Zeitpunkt des Kaufs.', why: 'Warum dieser Ratgeber', noPrice: 'Heutigen Preis bei Amazon prüfen', none: 'Für diese Kombination noch kein exakter Treffer. Hier die Live-Ergebnisse bei Amazon.', about: 'Über uns', hero: 'Du weißt nicht, welches du kaufen sollst?', heroP: 'Drei Fragen, eine ehrliche Empfehlung, der heutige Amazon-Preis. Für 2026 geschrieben, nicht aus einer alten Liste kopiert.', all: 'Alle Ratgeber', cat: 'Kategorie', by: 'Von', wait: 'Aktuelle Empfehlungen werden geladen…', start: 'Start' }
};
export const MARKETS = {
  us: { id: 'us', host: 'whichtobuy.best', lang: 'en', locale: 'en-US', name: 'Which To Buy', amazon: 'www.amazon.com', region: 'NA', tag: () => process.env.WTB_TAG_US || 'bl-t15-20', cur: 'USD', geo: 'US', hl: 'en', perDay: () => num(process.env.WTB_PER_DAG_US, 10), s: S.en, money: v => '$' + Number(v).toFixed(2) },
  de: { id: 'de', host: 'kaufberater.best', lang: 'de', locale: 'de-DE', name: 'Kaufberater', amazon: 'www.amazon.de', region: 'EU', tag: () => process.env.WTB_TAG_DE || 'bl-de10-21', cur: 'EUR', geo: 'DE', hl: 'de', perDay: () => num(process.env.WTB_PER_DAG_DE, 10), s: S.de, money: v => Number(v).toFixed(2).replace('.', ',') + ' €' }
};
function num(v, d) { const n = Number(v); return Number.isFinite(n) && v !== undefined && v !== '' ? Math.max(0, Math.min(30, n)) : d; }
export function marketFor(req) {
  const u = new URL(req.url, 'http://x'); const q = u.searchParams.get('m'); if (q && MARKETS[q]) return MARKETS[q];
  const h = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase().replace(/^www\./, '').replace(/:\d+$/, '');
  return Object.values(MARKETS).find(m => m.host === h) || null;
}
export const K = {
  item: (m, s) => 'hjdk:wtb:' + m + ':item:' + s, index: m => 'hjdk:wtb:' + m + ':index', plan: (m, d) => 'hjdk:wtb:' + m + ':plan:' + d,
  log: 'hjdk:wtb:log', lock: m => 'hjdk:wtb:' + m + ':lock', calls: d => 'c:wtb-claude-calls-' + d, tok: d => 'c:wtb-claude-tok-' + d, blind: m => 'hjdk:wtb:' + m + ':blind', learn: m => 'hjdk:wtb:' + m + ':learn'
};
export const DAY = () => new Date().toISOString().slice(0, 10);
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function log(e) { try { const l = (await kv.get(K.log)) || []; l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set(K.log, l.slice(0, 300)); } catch (x) {} }
export async function items(m) { const idx = (await kv.get(K.index(m.id))) || []; if (!idx.length) return []; const vals = []; for (let i = 0; i < idx.length; i += 200) vals.push(...await kv.mget(...idx.slice(i, i + 200).map(s => K.item(m.id, s)))); return vals.filter(v => v && v.slug && (!v.publishAt || v.publishAt <= DAY())); }

// ---------- Amazon ----------
export const searchLink = (m, kw) => 'https://' + m.amazon + '/s?k=' + encodeURIComponent(kw) + '&tag=' + encodeURIComponent(m.tag());
export const amzReady = () => !!(process.env.AMAZON_CREATORS_ID && process.env.AMAZON_CREATORS_SECRET);
const TOKEN_URL = { NA: 'https://api.amazon.com/auth/o2/token', EU: 'https://api.amazon.co.uk/auth/o2/token', FE: 'https://api.amazon.co.jp/auth/o2/token' };
async function amzToken(region) {
  const ck = 'hjdk:wtb:amztok:' + region; try { const t = await kv.get(ck); if (t) return t; } catch (e) {}
  const ids = String(process.env.AMAZON_CREATORS_ID || '').split(',').map(x => x.trim()).filter(Boolean); const sec = process.env.AMAZON_CREATORS_SECRET || '';
  let last = '';
  for (const url of [TOKEN_URL[region], ...Object.values(TOKEN_URL).filter(u => u !== TOKEN_URL[region])]) for (const id of ids) {
    try { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: sec, scope: 'creatorsapi::default' }), signal: AbortSignal.timeout(8000) }); const j = await r.json().catch(() => ({}));
      if (r.ok && j.access_token) { try { await kv.set(ck, j.access_token, { ex: Math.max(60, (Number(j.expires_in) || 3600) - 120) }); } catch (e) {} return j.access_token; } last = r.status + ' ' + JSON.stringify(j).slice(0, 120); } catch (e) { last = String(e.message); }
  }
  throw new Error('Amazon-token mislukt: ' + last);
}
const pick = (o, path) => path.split('.').reduce((a, k) => a == null ? a : a[k], o);
function normItem(m, it) {
  const l = (pick(it, 'offersV2.listings') || [])[0] || {}; const money = pick(l, 'price.money') || {};
  const asin = it.asin || it.ASIN; const url = it.detailPageURL || it.detailPageUrl || ('https://' + m.amazon + '/dp/' + asin);
  return { asin, title: pick(it, 'itemInfo.title.displayValue') || '', image: pick(it, 'images.primary.medium.url') || pick(it, 'images.primary.large.url') || '', price: money.amount != null ? Number(money.amount) : null, priceText: money.displayAmount || '', url: url.indexOf('tag=') > 0 ? url : url + (url.indexOf('?') > 0 ? '&' : '?') + 'tag=' + encodeURIComponent(m.tag()) };
}
// zoeken met 6 uur cache (Amazon staat 24 uur toe); geeft {at, products} of null als de API niet beschikbaar is
export async function amzSearch(m, keywords, opts) {
  if (!amzReady()) return null;
  const o = Object.assign({ count: 10 }, opts || {}); const key = 'hjdk:wtb:q:' + m.id + ':' + String(keywords).toLowerCase().slice(0, 150);
  try { const h = await kv.get(key); if (h && h.at && Date.now() - h.at < 6 * 3600e3) return h; } catch (e) {}
  const tok = await amzToken(m.region);
  const r = await fetch('https://creatorsapi.amazon/catalog/v1/searchItems', { method: 'POST', headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json', 'x-marketplace': m.amazon }, body: JSON.stringify({ keywords, searchIndex: 'All', itemCount: Math.min(10, o.count), partnerTag: m.tag(), marketplace: m.amazon, resources: ['images.primary.medium', 'itemInfo.title', 'offersV2.listings.price'] }), signal: AbortSignal.timeout(9000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401) { try { await kv.del(['hjdk:wtb:amztok:' + m.region]); } catch (e) {} } throw new Error('Amazon ' + r.status + ' ' + JSON.stringify(j).slice(0, 160)); }
  const list = pick(j, 'searchResult.items') || pick(j, 'SearchResult.Items') || [];
  const out = { at: Date.now(), products: list.map(it => normItem(m, it)).filter(p => p.asin && p.title) };
  try { await kv.set(key, out, { ex: 24 * 3600 }); } catch (e) {}
  return out;
}

// ---------- Claude (eigen sleutel, of Vercel AI Gateway via het OIDC-token van het project) ----------
const GW = [process.env.GATEWAY_MODEL, 'anthropic/claude-sonnet-5.5', 'anthropic/claude-sonnet-5', 'anthropic/claude-sonnet-4.5'].filter(Boolean);
const GW_FAST = ['anthropic/claude-haiku-4.5', 'anthropic/claude-sonnet-4.5'];
const DIRECT = [process.env.ANTHROPIC_MODEL, 'claude-sonnet-5-5', 'claude-sonnet-4-5'].filter(Boolean);
export const MAX_CALLS = () => Number(process.env.WTB_MAX_CLAUDE || 200);
export async function claude(system, user, o) {
  o = o || {}; const d = DAY(); const n = Number(await kv.get(K.calls(d)).catch(() => 0)) || 0; if (n >= MAX_CALLS()) throw new Error('daglimiet Claude bereikt');
  let secrets = {}; try { secrets = (await kv.get('hjdk:secrets')) || {}; } catch (e) {}
  const key = process.env.ANTHROPIC_API_KEY || secrets.ANTHROPIC_API_KEY; const oidc = process.env.VERCEL_OIDC_TOKEN || o.oidc || '';
  const gw = !key; if (gw && !oidc && !process.env.AI_GATEWAY_API_KEY) throw new Error('geen toegang tot Claude');
  const models = gw ? (o.fast ? GW_FAST : GW) : (o.fast ? ['claude-haiku-4-5', ...DIRECT] : DIRECT); let last = '';
  for (const model of models) {
    const r = await fetch(gw ? 'https://ai-gateway.vercel.sh/v1/messages' : 'https://api.anthropic.com/v1/messages', { method: 'POST', headers: Object.assign({ 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, gw ? { authorization: 'Bearer ' + (process.env.AI_GATEWAY_API_KEY || oidc) } : { 'x-api-key': key }), body: JSON.stringify({ model, max_tokens: o.max || 4000, system, messages: [{ role: 'user', content: user }] }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { const txt = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join(''); try { await kv.incrMany([[K.calls(d), 1], [K.tok(d), ((j.usage && j.usage.input_tokens) || 0) + ((j.usage && j.usage.output_tokens) || 0)]]); } catch (e) {} if (txt.trim()) return { txt, model }; last = 'leeg antwoord'; continue; }
    last = r.status + ' ' + ((j.error && j.error.message) || JSON.stringify(j).slice(0, 120));
    if (!(r.status === 404 || /model/i.test(last))) break;
  }
  throw new Error('Claude: ' + last.slice(0, 200));
}
export function json(txt) { const s = String(txt || '').replace(/```(?:json)?/g, ''); const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a < 0) throw new Error('geen JSON'); return JSON.parse(s.slice(a, b + 1)); }
export async function indexnow(m, urls) { try { const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: m.host, key: INDEXNOW_KEY, keyLocation: 'https://' + m.host + '/' + INDEXNOW_KEY + '.txt', urlList: urls.slice(0, 10000) }) }); return r.status; } catch (e) { return 0; } }
