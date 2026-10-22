// Public, read-only RSS 2.0 feed of real Yoors Shop product pages.
// This is a commercial catalogue, not an approved Flipboard publication.
// No campaign calls, conversion postbacks, private feed, AI calls or database writes.
import { createHash } from 'node:crypto';

const ORIGIN = 'https://yoo.rs';
const CATALOG = ORIGIN + '/shop/api/shop?lang=nl&offset=';
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const HEADERS = { 'user-agent': UA, 'accept-language': 'nl-NL,nl;q=0.9', referer: ORIGIN + '/' };
const TTL = 15 * 60 * 1000;
const MAX_ITEMS = 20;
let memory = null;
let pending = null;

export function xmlText(value) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

function plain(value) {
  return String(value ?? '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/&(?:nbsp|#160);/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ').trim();
}

export function publishedAt(item) {
  const raw = item.created_at ?? item.launched_at;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  const t = Number.isFinite(n) && n > 0 ? (n < 1e12 ? n * 1000 : n) : Date.parse(raw);
  const date = new Date(t);
  return Number.isFinite(t) && t > 0 && Number.isFinite(date.getTime()) ? date : null;
}

function publicImage(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && (!u.port || u.port === '443')
      && ['cdn.yoo.rs', 'yoo.rs', 'www.yoo.rs', 'cdn.orderchamp.com'].includes(u.hostname) ? u.href : null;
  } catch { return null; }
}

export function productSchema(html, id) {
  function find(node) {
    if (Array.isArray(node)) return node.map(find).find(Boolean);
    if (!node || typeof node !== 'object') return null;
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    if (types.includes('Product') && (!node.sku || String(node.sku) === id)) return node;
    return node['@graph'] ? find(node['@graph']) : null;
  }
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const result = find(JSON.parse(m[1])); if (result) return result; } catch { /* Skip malformed unrelated structured data. */ }
  }
  return null;
}

async function request(url, options = {}) {
  return fetch(url, { ...options, headers: { ...HEADERS, ...options.headers }, signal: AbortSignal.timeout(10000), redirect: 'error' });
}

async function mapLimited(list, parallel, work) {
  const results = new Array(list.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(parallel, list.length) }, async () => {
    for (;;) { const i = next++; if (i >= list.length) return; results[i] = await work(list[i]); }
  }));
  return results;
}

async function detail(item) {
  try {
    const url = ORIGIN + '/product/' + encodeURIComponent(item.id) + '?lang=nl';
    const r = await request(url, { headers: { accept: 'text/html' } });
    if (!r.ok) return null;
    const schema = productSchema(await r.text(), item.id);
    const description = plain(schema?.description || item.description);
    if (description.length < 300) return null; // Keep the guideline's useful excerpt length; never invent or pad product copy.
    const images = Array.isArray(schema?.image) ? schema.image : [schema?.image];
    const candidate = images.map(i => typeof i === 'string' ? i : i?.url).find(publicImage)
      || item.photos?.[0]?.src;
    const image = publicImage(candidate);
    if (!image) return null;
    const img = await request(image, { method: 'HEAD', headers: { accept: 'image/avif,image/webp,image/*,*/*;q=0.8' } });
    const type = img.headers.get('content-type')?.split(';')[0];
    const size = img.headers.get('content-length');
    if (!img.ok || !/^image\/(?:jpe?g|png|webp|gif|avif)$/i.test(type || '') || !/^\d+$/.test(size || '') || Number(size) <= 0) return null;
    return { id: item.id, title: plain(schema?.name || item.title), url, description, date: publishedAt(item),
      creator: plain(item.seller_name || 'Yoors Shop'), category: plain(schema?.category || item.shop_category),
      image: { url: image, type, bytes: Number(size) } };
  } catch { return null; }
}

export function renderRss(items, selfUrl) {
  const newest = items.reduce((last, item) => !last || item.date > last ? item.date : last, null);
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">\n<channel>\n'
    + '<title>Yoors Shop — nieuwe producten</title>\n<link>https://yoo.rs/shop</link>\n'
    + '<description>Producten uit de Yoors Shop, met de bestaande productbeschrijving, foto en oorspronkelijke publicatiedatum. Commerciële productcatalogus.</description>\n'
    + '<language>nl-NL</language>\n<ttl>15</ttl>\n'
    + '<atom:link href="' + xmlText(selfUrl) + '" rel="self" type="application/rss+xml"/>\n'
    + (newest ? '<lastBuildDate>' + newest.toUTCString() + '</lastBuildDate>\n' : '')
    + items.map(item => '<item>\n<title>' + xmlText(item.title) + '</title>\n<link>' + xmlText(item.url) + '</link>\n'
      + '<guid isPermaLink="false">yoors-shop:' + xmlText(item.id) + '</guid>\n'
      + '<pubDate>' + item.date.toUTCString() + '</pubDate>\n'
      + '<dc:creator>' + xmlText(item.creator) + '</dc:creator>\n'
      + '<description>' + xmlText(item.description) + '</description>\n'
      + (item.category ? '<category>' + xmlText(item.category) + '</category>\n' : '')
      + '<enclosure url="' + xmlText(item.image.url) + '" length="' + item.image.bytes + '" type="' + xmlText(item.image.type) + '"/>\n'
      + '<media:content url="' + xmlText(item.image.url) + '" medium="image" type="' + xmlText(item.image.type) + '"/>\n'
      + '</item>').join('\n') + '\n</channel>\n</rss>\n';
}

export async function buildShopRss(selfUrl = 'https://keuzehulp.best/api/shop/rss', sourceItems = null) {
  const candidates = [], seen = new Set();
  let offset = 0;
  const now = Date.now();
  function collect(list) {
    for (const item of list) {
      if (!/^[A-Za-z0-9_-]{3,64}$/.test(String(item.id || '')) || seen.has(item.id) || !item.title || item.in_stock === false || item.in_stock === 0 || item.in_stock === '0' || item.in_stock === 'false') continue;
      const date = publishedAt(item);
      if (!date || date.getTime() > now || now - date.getTime() > 90 * 86400000) continue;
      seen.add(item.id); candidates.push(item);
    }
  }
  if (Array.isArray(sourceItems) && sourceItems.length) collect(sourceItems);
  for (let page = 0; !Array.isArray(sourceItems) && page < 3 && candidates.length < 32; page++) {
    const r = await request(CATALOG + offset, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error('Productcatalogus tijdelijk niet beschikbaar');
    const data = await r.json();
    if (!Array.isArray(data.items)) throw new Error('Productcatalogus heeft geen productlijst');
    collect(data.items);
    if (data.next == null || !data.items.length || Number(data.next) <= offset) break;
    offset = Number(data.next);
  }
  candidates.sort((a, b) => publishedAt(b) - publishedAt(a));
  const items = [];
  for (let at = 0; at < Math.min(candidates.length, 72) && items.length < MAX_ITEMS; at += 24) {
    items.push(...(await mapLimited(candidates.slice(at, at + 24), 4, detail)).filter(Boolean));
  }
  const selected = items.slice(0, MAX_ITEMS);
  if (selected.length < MAX_ITEMS) throw new Error('Minder dan twintig recente producten met controleerbare beschrijving en afbeelding');
  const xml = renderRss(selected, selfUrl);
  return { xml, count: selected.length, etag: '"' + createHash('sha256').update(xml).digest('hex') + '"',
    shortDescriptions: selected.filter(i => i.description.length < 300).length };
}

export async function shopRss(req, res, selfUrl = 'https://keuzehulp.best/api/shop/rss', loadCatalog = null) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('allow', 'GET, HEAD'); return res.status(405).end();
  }
  if (!memory || memory.selfUrl !== selfUrl || Date.now() - memory.at >= TTL) {
    if (!pending) pending = Promise.resolve().then(() => loadCatalog ? loadCatalog() : null)
      .then(items => buildShopRss(selfUrl, items)).then(result => {
      memory = { ...result, at: Date.now(), selfUrl }; return memory;
    }).finally(() => { pending = null; });
    try { await pending; } catch {
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.setHeader('retry-after', '300');
      return res.status(503).send('De Yoors Shop-feed is tijdelijk niet beschikbaar. Probeer het later opnieuw.');
    }
  }
  res.setHeader('content-type', 'application/rss+xml; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=300, s-maxage=900');
  res.setHeader('etag', memory.etag);
  res.setHeader('x-yoors-rss-items', String(memory.count));
  if (req.headers['if-none-match'] === memory.etag) return res.status(304).end();
  return req.method === 'HEAD' ? res.status(200).end() : res.status(200).send(memory.xml);
}
