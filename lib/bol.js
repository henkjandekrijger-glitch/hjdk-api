// bol.com Marketing Catalog API + Reporting API (OAuth client-credentials, token ~5 min).
// Sleutels: env BOL_CLIENT_ID/BOL_CLIENT_SECRET (marketing) en BOL_REPORT_CLIENT_ID/BOL_REPORT_CLIENT_SECRET (reporting),
// of via de invoerpagina /setup (opgeslagen in KV 'hjdk:secrets', alleen server-side leesbaar). Env gaat voor.
import { kv } from './db.js';

const TOKEN_URL = 'https://login.bol.com/token?grant_type=client_credentials';
export const CATALOG = 'https://api.bol.com/marketing/catalog/v1';
const mem = { creds: null, credsAt: 0, tok: {} };

export async function getCreds(kind) {
  const envId = kind === 'report' ? process.env.BOL_REPORT_CLIENT_ID : process.env.BOL_CLIENT_ID;
  const envSecret = kind === 'report' ? process.env.BOL_REPORT_CLIENT_SECRET : process.env.BOL_CLIENT_SECRET;
  if (envId && envSecret) return { id: envId, secret: envSecret, from: 'env' };
  if (!mem.creds || Date.now() - mem.credsAt > 60000) { try { mem.creds = (await kv.get('hjdk:secrets')) || {}; } catch (e) { mem.creds = {}; } mem.credsAt = Date.now(); }
  const c = mem.creds || {};
  const id = kind === 'report' ? c.BOL_REPORT_CLIENT_ID : c.BOL_CLIENT_ID, secret = kind === 'report' ? c.BOL_REPORT_CLIENT_SECRET : c.BOL_CLIENT_SECRET;
  return id && secret ? { id, secret, from: 'setup' } : null;
}
export function forgetCreds() { mem.creds = null; mem.credsAt = 0; mem.tok = {}; }

// token ophalen (met cache); geeft {token} of {error}
export async function getToken(kind, creds) {
  const c = creds || await getCreds(kind);
  if (!c) return { error: 'geen sleutels voor ' + (kind === 'report' ? 'reporting' : 'marketing') + ' api' };
  const t = mem.tok[kind]; if (t && t.exp > Date.now() + 15000 && t.id === c.id) return { token: t.token };
  try {
    const r = await fetch(TOKEN_URL, { method: 'POST', headers: { authorization: 'Basic ' + Buffer.from(c.id + ':' + c.secret).toString('base64'), accept: 'application/json' } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) return { error: 'bol login ' + r.status + (j.error_description ? ': ' + j.error_description : j.error ? ': ' + j.error : '') };
    mem.tok[kind] = { token: j.access_token, exp: Date.now() + (Number(j.expires_in) || 299) * 1000, id: c.id };
    return { token: j.access_token };
  } catch (e) { return { error: 'bol login mislukt: ' + String(e && e.message || e) }; }
}

// Catalog-aanroep: path bijv. '/products/search', params object; geeft JSON of gooit Error
export async function catalog(path, params, lang) {
  const t = await getToken('marketing'); if (t.error) throw new Error(t.error);
  const u = new URL(CATALOG + path);
  Object.entries(params || {}).forEach(([k, v]) => { if (v === undefined || v === null || v === '') return; if (Array.isArray(v)) v.forEach(x => u.searchParams.append(k, x)); else u.searchParams.set(k, String(v)); });
  const r = await fetch(u, { headers: { authorization: 'Bearer ' + t.token, accept: 'application/json', 'accept-language': lang || 'nl' } });
  if (!r.ok) { const txt = await r.text().catch(() => ''); throw new Error('bol catalog ' + r.status + ' ' + txt.slice(0, 200)); }
  return r.json();
}

// zoeken met 20 min cache in KV: {products:[{ean,id,title,url,image,price,strike,rating,delivery}], total}
export async function searchCached(term, opts) {
  const o = Object.assign({ country: 'NL', page: 1, size: 24, sort: 'RELEVANCE' }, opts || {});
  const key = 'hjdk:bolq:' + [term, o.country, o.page, o.size, o.sort, o.category || ''].join('|').toLowerCase().slice(0, 200);
  try { const c = await kv.get(key); if (c && c.at && Date.now() - c.at < 20 * 60000) return c; } catch (e) {}
  const path = term ? '/products/search' : '/products/lists/popular';
  const j = await catalog(path, { 'search-term': term || undefined, 'country-code': o.country, 'category-id': o.category || undefined, page: o.page, 'page-size': o.size, sort: o.sort, 'include-image': true, 'include-offer': true, 'include-rating': true }, o.country === 'BE' ? 'nl-BE' : 'nl-NL');
  const list = Array.isArray(j.results) ? j.results : (Array.isArray(j.products) ? j.products : (Array.isArray(j) ? j : []));
  const products = list.map(p => ({
    ean: p.ean || '', id: p.bolProductId || '', title: String(p.title || '').slice(0, 120), url: p.url || '',
    image: p.image && p.image.url || '', price: p.offer && p.offer.price != null ? Number(p.offer.price) : null,
    strike: p.offer && p.offer.strikethroughPrice != null ? Number(p.offer.strikethroughPrice) : null,
    rating: p.rating != null ? Number(p.rating) : null, delivery: p.offer && p.offer.deliveryDescription || ''
  })).filter(p => p.url && p.title);
  const out = { at: Date.now(), products, total: Number(j.totalResultSize || j.total || products.length) || products.length };
  try { await kv.set(key, out, { ex: 1800 }); } catch (e) {} // v41: alleen 20 min nodig; zonder vervaltijd liep de database vol
  return out;
}
