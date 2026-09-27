// Amazon Product Advertising API 5 (PA-API) — zoeken en ophalen met SigV4-ondertekening, zonder extra pakketten.
// Sleutels: env AMZ_ACCESS_KEY / AMZ_SECRET_KEY / AMZ_PARTNER_TAG (of via /setup in KV 'hjdk:secrets'). Marktplaats: AMZ_MARKETPLACE (standaard www.amazon.nl).
// De waarden zelf komen nooit in een antwoord terecht.
import { createHmac, createHash } from 'node:crypto';
import { kv } from './db.js';

const HOSTS = { 'www.amazon.nl': ['webservices.amazon.nl', 'eu-west-1'], 'www.amazon.de': ['webservices.amazon.de', 'eu-west-1'], 'www.amazon.com.be': ['webservices.amazon.com.be', 'eu-west-1'], 'www.amazon.com': ['webservices.amazon.com', 'us-east-1'], 'www.amazon.co.uk': ['webservices.amazon.co.uk', 'eu-west-1'], 'www.amazon.fr': ['webservices.amazon.fr', 'eu-west-1'] };
const mem = { creds: null, credsAt: 0 };

export async function getAmzCreds() {
  if (process.env.AMZ_ACCESS_KEY && process.env.AMZ_SECRET_KEY && process.env.AMZ_PARTNER_TAG) return { key: process.env.AMZ_ACCESS_KEY, secret: process.env.AMZ_SECRET_KEY, tag: process.env.AMZ_PARTNER_TAG, market: process.env.AMZ_MARKETPLACE || 'www.amazon.nl', from: 'env' };
  if (mem.creds && Date.now() - mem.credsAt < 60000) return mem.creds;
  let c = {}; try { c = (await kv.get('hjdk:secrets')) || {}; } catch (e) {}
  const out = c.AMZ_ACCESS_KEY && c.AMZ_SECRET_KEY && c.AMZ_PARTNER_TAG ? { key: c.AMZ_ACCESS_KEY, secret: c.AMZ_SECRET_KEY, tag: c.AMZ_PARTNER_TAG, market: c.AMZ_MARKETPLACE || 'www.amazon.nl', from: 'setup' } : null;
  mem.creds = out; mem.credsAt = Date.now();
  return out;
}
export function forgetAmzCreds() { mem.creds = null; mem.credsAt = 0; }
// alleen een partner-tag (nog geen PA-API): dan kan de brug wel een Amazon-zoeklink met tag tonen, zonder prijs
export async function getAmzTagOnly() {
  if (process.env.AMZ_PARTNER_TAG) return { tag: process.env.AMZ_PARTNER_TAG, market: process.env.AMZ_MARKETPLACE || 'www.amazon.nl' };
  let c = {}; try { c = (await kv.get('hjdk:secrets')) || {}; } catch (e) {}
  return c.AMZ_PARTNER_TAG ? { tag: c.AMZ_PARTNER_TAG, market: c.AMZ_MARKETPLACE || 'www.amazon.nl' } : null;
}

const sha = s => createHash('sha256').update(s, 'utf8').digest('hex');
const hmac = (k, s) => createHmac('sha256', k).update(s, 'utf8').digest();

// één PA-API-aanroep: op = 'SearchItems' | 'GetItems'; geeft JSON of gooit Error
export async function paapi(op, body, creds) {
  const c = creds || await getAmzCreds(); if (!c) throw new Error('geen Amazon-sleutels');
  const [host, region] = HOSTS[c.market] || HOSTS['www.amazon.nl'];
  const path = '/paapi5/' + op.toLowerCase();
  const payload = JSON.stringify(Object.assign({ PartnerTag: c.tag, PartnerType: 'Associates', Marketplace: c.market }, body));
  const now = new Date(), amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), day = amzDate.slice(0, 8);
  const target = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.' + op;
  const headers = { 'content-encoding': 'amz-1.0', 'content-type': 'application/json; charset=utf-8', host, 'x-amz-date': amzDate, 'x-amz-target': target };
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonical = ['POST', path, '', ...Object.keys(headers).sort().map(k => k + ':' + headers[k]), '', signedHeaders, sha(payload)].join('\n');
  const scope = day + '/' + region + '/ProductAdvertisingAPI/aws4_request';
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha(canonical)].join('\n');
  const kSign = hmac(hmac(hmac(hmac('AWS4' + c.secret, day), region), 'ProductAdvertisingAPI'), 'aws4_request');
  const sig = createHmac('sha256', kSign).update(toSign, 'utf8').digest('hex');
  const auth = 'AWS4-HMAC-SHA256 Credential=' + c.key + '/' + scope + ', SignedHeaders=' + signedHeaders + ', Signature=' + sig;
  const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 5000);
  let r; try { r = await fetch('https://' + host + path, { method: 'POST', headers: Object.assign({ authorization: auth }, headers), body: payload, signal: ctrl.signal }); } finally { clearTimeout(tm); }
  const txt = await r.text();
  let j = {}; try { j = JSON.parse(txt); } catch (e) {}
  if (!r.ok) { const err = j.Errors && j.Errors[0]; throw new Error('amazon ' + r.status + (err ? ' ' + err.Code + ': ' + String(err.Message || '').slice(0, 160) : ' ' + txt.slice(0, 160))); }
  if (j.Errors && j.Errors.length && !(j.SearchResult || j.ItemsResult)) throw new Error('amazon ' + j.Errors[0].Code + ': ' + String(j.Errors[0].Message || '').slice(0, 160));
  return j;
}

const RES = ['Images.Primary.Medium', 'ItemInfo.Title', 'Offers.Listings.Price', 'Offers.Listings.SavingBasis', 'Offers.Listings.Availability.Message', 'Offers.Listings.DeliveryInfo.IsPrimeEligible'];
function norm(it) {
  const l = it.Offers && it.Offers.Listings && it.Offers.Listings[0];
  const p = l && l.Price, sb = l && l.SavingBasis;
  return { asin: it.ASIN, title: it.ItemInfo && it.ItemInfo.Title ? it.ItemInfo.Title.DisplayValue : '', url: it.DetailPageURL, image: it.Images && it.Images.Primary && it.Images.Primary.Medium ? it.Images.Primary.Medium.URL : '', price: p && p.Amount != null ? Number(p.Amount) : null, priceText: p ? p.DisplayAmount : '', strike: sb && sb.Amount != null && p && Number(sb.Amount) > Number(p.Amount) ? Number(sb.Amount) : null, prime: !!(l && l.DeliveryInfo && l.DeliveryInfo.IsPrimeEligible), availability: l && l.Availability ? l.Availability.Message : '' };
}

// zoeken met 20 min cache in KV: {at, products:[{asin,title,url,image,price,priceText,strike,prime}]}
export async function amzSearchCached(term, opts) {
  const o = Object.assign({ count: 6, sort: 'Relevance' }, opts || {});
  const c = await getAmzCreds(); if (!c) throw new Error('geen Amazon-sleutels');
  const key = 'hjdk:amzq:' + [c.market, term, o.count, o.sort].join('|').toLowerCase().slice(0, 200);
  try { const h = await kv.get(key); if (h && h.at && Date.now() - h.at < 20 * 60000) return h; } catch (e) {}
  const j = await paapi('SearchItems', { Keywords: term, ItemCount: Math.min(10, o.count), SortBy: o.sort, Resources: RES, ...(o.searchIndex ? { SearchIndex: o.searchIndex } : {}) }, c);
  const items = (j.SearchResult && j.SearchResult.Items) || [];
  const out = { at: Date.now(), products: items.map(norm).filter(p => p.title), total: j.SearchResult && j.SearchResult.TotalResultCount || items.length, market: c.market };
  try { await kv.set(key, out); } catch (e) {}
  return out;
}
