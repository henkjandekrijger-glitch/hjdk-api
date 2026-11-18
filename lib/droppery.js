// Droppery-brug voor Kadoly (18 nov 2026, Henkjan: "Er is gewoon een api. Zoek uit en integreer").
// Droppery koppelt alleen bestaande winkelsystemen (Shopify, WooCommerce, Lightspeed ...); Kadoly is een eigen shop.
// Daarom doet deze brug zich voor als een WooCommerce-winkel op https://gids.kadoly.com (REST /wp-json/wc/v3):
//  - Droppery zet de gekozen Markets-producten hier neer (POST/PUT products, variations, categories) en leest orders.
//  - De Kadoly-shop haalt die producten op als feed (op=dpfeed, header X-Lus-Key) en meldt betaalde orders (op=dporder).
//  - Droppery haalt de orders op (GET orders), of krijgt ze via een webhook die het zelf registreert, en zet de
//    track-and-trace terug (PUT orders/{id}, notes). De shop leest die met op=dpstatus.
// Elke aanroep van Droppery komt in een logboek (dp:log, op=dplog op de beschermde host), zodat we zien welke
// WooCommerce-routes Droppery echt gebruikt. Sleutels (consumer key/secret) staan in KV dp:wc:keys; Henkjan
// neemt ze over in Droppery (Settings > API credentials) via op=dpsleutels op de beschermde host.
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { kv } from './db.js';
import INKOOP from './dp-inkoop.js';

export const DP_HOST = 'https://gids.kadoly.com';
const K = { keys: 'dp:wc:keys', seq: 'dp:seq', pids: 'dp:pids', oids: 'dp:oids', cats: 'dp:cats', hooks: 'dp:hooks', log: 'dp:log' };
const ORDER_TTL = 150 * 86400; // klantgegevens van orders: 150 dagen (retour- en garantietermijn), daarna weg
const raw = a => kv.raw(a);
const nu = () => new Date().toISOString().replace(/\.\d+Z$/, '');
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };

export async function dpSleutels(maak) {
  let k = await kv.get(K.keys);
  if (!k && maak) { k = { key: 'ck_' + randomBytes(20).toString('hex'), secret: 'cs_' + randomBytes(20).toString('hex'), at: nu() }; await kv.set(K.keys, k); }
  return k;
}
const gelijk = (a, b) => { const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || '')); return x.length === y.length && timingSafeEqual(x, y); };
async function magDroppery(req, q) {
  const k = await dpSleutels(false); if (!k) return false;
  let ck = q.get('consumer_key') || q.get('oauth_consumer_key'), cs = q.get('consumer_secret');
  const a = String(req.headers.authorization || '');
  if (/^basic /i.test(a)) { const d = Buffer.from(a.slice(6), 'base64').toString(); const i = d.indexOf(':'); ck = d.slice(0, i); cs = d.slice(i + 1); }
  if (q.get('oauth_consumer_key') && !cs) return gelijk(ck, k.key); // OAuth 1.0a over https: alleen de sleutel
  return gelijk(ck, k.key) && gelijk(cs, k.secret);
}
async function logRegel(r) { try { await raw(['LPUSH', K.log, JSON.stringify(r)]); await raw(['LTRIM', K.log, '0', '399']); } catch (e) {} }
export async function dpLog(n = 100) { try { return (await raw(['LRANGE', K.log, '0', String(Math.min(399, n - 1))])).map(x => JSON.parse(x)); } catch (e) { return []; } }

// ---------- opslag ----------
const pKey = id => 'dp:p:' + id, oKey = id => 'dp:o:' + id;
async function ids(set) { try { return (await raw(['SMEMBERS', set])).map(Number).sort((a, b) => a - b); } catch (e) { return []; } }
async function nieuwId() { return Number(await kv.incr(K.seq)) + 1000; }
const ankerProduct = (p, id) => Object.assign({ type: 'simple', status: 'publish', catalog_visibility: 'visible', stock_status: 'instock', manage_stock: false, images: [], categories: [], attributes: [], meta_data: [], variations: [] }, p, { id, permalink: DP_HOST + '/dp/p/' + id, date_created: p.date_created || nu(), date_modified: nu() });
async function maakProduct(b) {
  if (b.sku) { const bestaand = await zoekSku(b.sku); if (bestaand) return werkProductBij(bestaand.id, b); }
  const id = await nieuwId(); const p = ankerProduct(Object.assign({}, b, { _var: [] }), id);
  await kv.set(pKey(id), p); await raw(['SADD', K.pids, String(id)]); if (b.sku) await kv.set('dp:sku:' + b.sku, id);
  return toon(p);
}
async function werkProductBij(id, b) { const p = await kv.get(pKey(id)); if (!p) return null; const n = Object.assign(p, b, { id: p.id, date_modified: nu() }); await kv.set(pKey(id), n); if (b.sku) await kv.set('dp:sku:' + b.sku, p.id); return toon(n); }
async function zoekSku(sku) { const id = await kv.get('dp:sku:' + sku); return id ? kv.get(pKey(id)) : null; }
async function verwijderProduct(id) { const p = await kv.get(pKey(id)); if (!p) return null; await kv.del([pKey(id)]); await raw(['SREM', K.pids, String(id)]); if (p.sku) await kv.del(['dp:sku:' + p.sku]); return toon(p); }
const toon = p => { if (!p) return p; const { _var, ...rest } = p; return Object.assign(rest, { variations: (_var || []).map(v => v.id) }); };
async function alleProducten() { const l = await ids(K.pids); const out = []; for (let i = 0; i < l.length; i += 100) out.push(...(await kv.mget(...l.slice(i, i + 100).map(pKey))).filter(Boolean)); return out; }

async function variatie(pid, vid, b, weg) {
  const p = await kv.get(pKey(pid)); if (!p) return null; p._var = p._var || [];
  if (weg) { const v = p._var.find(x => x.id === vid); p._var = p._var.filter(x => x.id !== vid); await kv.set(pKey(pid), p); return v || null; }
  if (vid) { const v = p._var.find(x => x.id === vid); if (!v) return null; Object.assign(v, b, { id: vid, date_modified: nu() }); await kv.set(pKey(pid), p); return v; }
  if (b.sku) { const v = p._var.find(x => x.sku === b.sku); if (v) return variatie(pid, v.id, b); }
  const v = Object.assign({ status: 'publish', stock_status: 'instock', attributes: [], meta_data: [] }, b, { id: await nieuwId(), parent_id: pid, date_created: nu(), date_modified: nu() });
  p._var.push(v); await kv.set(pKey(pid), p); return v;
}
async function categorie(b, id, weg) {
  const l = (await kv.get(K.cats)) || [];
  if (weg) { const c = l.find(x => x.id === id); await kv.set(K.cats, l.filter(x => x.id !== id)); return c || null; }
  if (id) { const c = l.find(x => x.id === id); if (!c) return null; Object.assign(c, b, { id }); await kv.set(K.cats, l); return c; }
  const naam = String(b.name || '').trim(); const bestaand = l.find(x => x.name === naam && N(x.parent) === N(b.parent)); if (bestaand) return bestaand;
  const c = { id: await nieuwId(), name: naam, slug: b.slug || naam.toLowerCase().replace(/[^a-z0-9]+/g, '-'), parent: N(b.parent), description: b.description || '', count: 0 };
  l.push(c); await kv.set(K.cats, l); return c;
}

// ---------- orders (gemaakt door de Kadoly-shop, gelezen en bijgewerkt door Droppery) ----------
async function alleOrders() { const l = await ids(K.oids); const out = []; for (let i = 0; i < l.length; i += 100) out.push(...(await kv.mget(...l.slice(i, i + 100).map(oKey))).filter(Boolean)); return out; }
export async function dpNieuweOrder(b) {
  const ext = String(b.order_id || b.id || '').slice(0, 60); if (!ext) return { ok: false, fout: 'order_id ontbreekt' };
  const al = await kv.get('dp:ext:' + ext); if (al) return { ok: true, al: true, id: al };
  const s = b.shipping || b.adres || {}; const lijnen = [];
  for (const l of (b.lines || b.line_items || [])) {
    let p = l.product_id ? await kv.get(pKey(N(l.product_id))) : null; if (!p && l.sku) p = await zoekSku(l.sku);
    let v = null; if (p && l.variation_id) v = (p._var || []).find(x => x.id === N(l.variation_id)); if (p && !v && l.sku && p.sku !== l.sku) v = (p._var || []).find(x => x.sku === l.sku);
    if (!p) return { ok: false, fout: 'onbekend Droppery-product: ' + (l.product_id || l.sku) };
    const qty = Math.max(1, N(l.quantity) || 1), prijs = N(l.price);
    lijnen.push({ id: await nieuwId(), name: (v && v.name) || p.name, product_id: p.id, variation_id: v ? v.id : 0, quantity: qty, sku: (v && v.sku) || p.sku || '', price: prijs, subtotal: (prijs * qty).toFixed(2), total: (prijs * qty).toFixed(2), total_tax: '0.00', taxes: [], meta_data: [] });
  }
  if (!lijnen.length) return { ok: false, fout: 'geen regels' };
  const id = await nieuwId(); const adres = { first_name: s.first_name || '', last_name: s.last_name || '', company: s.company || '', address_1: s.address_1 || '', address_2: s.address_2 || '', city: s.city || '', state: '', postcode: s.postcode || '', country: s.country || 'NL', email: s.email || b.email || '', phone: s.phone || b.phone || '' };
  if (!adres.address_1 || !adres.postcode || !adres.city || !adres.last_name) return { ok: false, fout: 'adres onvolledig (first_name, last_name, address_1 met huisnummer, postcode, city, country)' };
  const totaal = lijnen.reduce((a, l) => a + N(l.total), 0) + N(b.shipping_total);
  const o = { id, parent_id: 0, number: ext, order_key: 'wc_order_' + randomBytes(6).toString('hex'), created_via: 'kadoly', version: '8.9.0', status: 'processing', currency: 'EUR', date_created: b.created_at ? String(b.created_at).replace(/\.\d+Z?$/, '').replace('Z', '') : nu(), date_modified: nu(), date_paid: b.paid_at || nu(), discount_total: '0.00', shipping_total: N(b.shipping_total).toFixed(2), total: totaal.toFixed(2), total_tax: '0.00', prices_include_tax: true, customer_id: 0, customer_note: '', billing: Object.assign({}, adres), shipping: Object.assign({}, adres, { email: undefined }), payment_method: 'kadoly', payment_method_title: 'Kadoly', transaction_id: ext, line_items: lijnen, shipping_lines: [], fee_lines: [], coupon_lines: [], meta_data: [{ key: '_kadoly_order', value: ext }], _notes: [] };
  await kv.set(oKey(id), o, { ex: ORDER_TTL }); await raw(['SADD', K.oids, String(id)]); await kv.set('dp:ext:' + ext, id, { ex: ORDER_TTL });
  const hooks = await vuurWebhooks('order.created', toonOrder(o));
  return { ok: true, id, webhooks: hooks };
}
const toonOrder = o => { if (!o) return o; const { _notes, ...rest } = o; return rest; };
export async function dpOrderStatus(ext) {
  const id = await kv.get('dp:ext:' + String(ext || '')); const o = id ? await kv.get(oKey(id)) : null; if (!o) return { ok: false, fout: 'onbekende order' };
  const meta = {}; for (const m of (o.meta_data || [])) if (/track|carrier|shipment|ship/i.test(m.key)) meta[m.key] = m.value;
  return { ok: true, id: o.id, status: o.status, tracking: meta, notities: (o._notes || []).map(n => ({ at: n.date_created, tekst: n.note })) };
}

// ---------- webhooks (als Droppery ze registreert) ----------
async function vuurWebhooks(topic, data) {
  const hooks = ((await kv.get(K.hooks)) || []).filter(h => h.status === 'active' && h.topic === topic); const uit = [];
  for (const h of hooks) {
    const body = JSON.stringify(data); const sig = createHmac('sha256', h.secret || '').update(body).digest('base64');
    try { const r = await fetch(h.delivery_url, { method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'content-type': 'application/json', 'x-wc-webhook-source': DP_HOST + '/', 'x-wc-webhook-topic': topic, 'x-wc-webhook-resource': topic.split('.')[0], 'x-wc-webhook-event': topic.split('.')[1], 'x-wc-webhook-signature': sig, 'x-wc-webhook-id': String(h.id), 'x-wc-webhook-delivery-id': String(Date.now()) }, body }); uit.push({ id: h.id, status: r.status }); }
    catch (e) { uit.push({ id: h.id, fout: String(e.message || e).slice(0, 80) }); }
  }
  await logRegel({ t: nu(), uit: 'webhook ' + topic, n: hooks.length, res: uit }); return uit;
}

// ---------- WooCommerce REST ----------
const lijst = (res, rijen, q) => { const per = Math.min(100, Math.max(1, N(q.get('per_page')) || 10)), pag = Math.max(1, N(q.get('page')) || 1); res.setHeader('x-wp-total', String(rijen.length)); res.setHeader('x-wp-totalpages', String(Math.max(1, Math.ceil(rijen.length / per)))); return res.status(200).json(rijen.slice((pag - 1) * per, pag * per)); };
const fout = (res, code, msg, st) => res.status(st).json({ code, message: msg, data: { status: st } });
const filterDatum = (rijen, q, veld) => { const na = q.get('after') || q.get('modified_after'); return na ? rijen.filter(r => String(r[veld] || r.date_created) > String(na).slice(0, 19)) : rijen; };

export async function wcRoute(req, res, pad, q) {
  const m = req.method, b = typeof req.body === 'object' && req.body ? req.body : (() => { try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; } })();
  const d = pad.replace(/^\/+|\/+$/g, '').split('/'); // bv. ['wc','v3','products','12']
  const regel = { t: nu(), m, pad: '/' + d.join('/'), q: [...q.keys()].filter(k => !/consumer|oauth|wc$/.test(k)).join(','), body: b && Object.keys(b).length ? Object.keys(b).slice(0, 12).join(',') : '', ua: String(req.headers['user-agent'] || '').slice(0, 60) };
  if (!d[0] || d[0] !== 'wc') { await logRegel(Object.assign(regel, { st: 200 })); return res.status(200).json({ name: 'Kadoly', description: 'Kadoly', url: DP_HOST, home: DP_HOST, gmt_offset: 1, timezone_string: 'Europe/Amsterdam', namespaces: ['wc/v3', 'wc/v2', 'wc/v1'], authentication: {}, routes: {} }); }
  if (!(await magDroppery(req, q))) { await logRegel(Object.assign(regel, { st: 401 })); return fout(res, 'woocommerce_rest_cannot_view', 'Sorry, you cannot list resources.', 401); }
  const r = d.slice(2), wat = r[0] || '', id = N(r[1]); let st = 200;
  try {
    if (!wat) return res.status(200).json({ namespace: d.slice(0, 2).join('/'), routes: {} });
    if (wat === 'system_status') return res.status(200).json({ environment: { home_url: DP_HOST, site_url: DP_HOST, version: '8.9.0', wp_version: '6.6', language: 'nl_NL', default_timezone: 'Europe/Amsterdam', secure_connection: true }, settings: { currency: 'EUR', currency_symbol: '€', currency_position: 'left', thousand_separator: '.', decimal_separator: ',', number_of_decimals: 2, api_enabled: true }, active_plugins: [{ plugin: 'woocommerce/woocommerce.php', name: 'WooCommerce', version: '8.9.0' }] });
    if (wat === 'settings') return res.status(200).json(r[1] === 'general' ? [{ id: 'woocommerce_currency', value: 'EUR' }, { id: 'woocommerce_default_country', value: 'NL' }, { id: 'woocommerce_prices_include_tax', value: 'yes' }] : [{ id: 'general', label: 'General' }]);
    if (wat === 'data') return res.status(200).json(r[1] === 'currencies' ? { code: 'EUR', name: 'Euro', symbol: '€' } : []);
    if (wat === 'taxes' || wat === 'shipping_methods' || wat === 'payment_gateways' || wat === 'customers' || wat === 'coupons' || wat === 'reports') return lijst(res, [], q);
    if (wat === 'webhooks') {
      const l = (await kv.get(K.hooks)) || [];
      if (m === 'GET') return id ? res.status(200).json(l.find(h => h.id === id) || {}) : lijst(res, l, q);
      if (m === 'POST' && !id) { const h = { id: await nieuwId(), name: b.name || '', status: b.status || 'active', topic: b.topic || '', delivery_url: b.delivery_url || '', secret: b.secret || '', date_created: nu() }; l.push(h); await kv.set(K.hooks, l); st = 201; return res.status(201).json(h); }
      if (m === 'DELETE') { await kv.set(K.hooks, l.filter(h => h.id !== id)); return res.status(200).json({ id }); }
      if (m === 'PUT' || m === 'POST') { const h = l.find(x => x.id === id); if (h) Object.assign(h, b, { id }); await kv.set(K.hooks, l); return res.status(200).json(h || {}); }
    }
    if (wat === 'products') {
      const sub = r[1];
      if (sub === 'categories') {
        const cid = N(r[2]);
        if (r[2] === 'batch') { const out = { create: [], update: [], delete: [] }; for (const c of b.create || []) out.create.push(await categorie(c)); for (const c of b.update || []) out.update.push(await categorie(c, N(c.id))); for (const x of b.delete || []) out.delete.push(await categorie({}, N(x), true)); return res.status(200).json(out); }
        if (m === 'GET') { const l = (await kv.get(K.cats)) || []; if (cid) return res.status(200).json(l.find(c => c.id === cid) || {}); const s = q.get('search'); return lijst(res, s ? l.filter(c => c.name.toLowerCase().includes(s.toLowerCase())) : l, q); }
        if (m === 'POST' && !cid) { st = 201; return res.status(201).json(await categorie(b)); }
        if (m === 'DELETE') return res.status(200).json(await categorie({}, cid, true) || {});
        return res.status(200).json(await categorie(b, cid) || {});
      }
      if (sub === 'attributes' || sub === 'tags' || sub === 'shipping_classes') { if (m === 'POST') { st = 201; return res.status(201).json(Object.assign({ id: await nieuwId() }, b)); } return lijst(res, [], q); }
      if (sub === 'batch') { const out = { create: [], update: [], delete: [] }; for (const p of b.create || []) out.create.push(await maakProduct(p)); for (const p of b.update || []) out.update.push(await werkProductBij(N(p.id), p) || { id: p.id, error: { code: 'woocommerce_rest_product_invalid_id', message: 'Invalid ID.' } }); for (const x of b.delete || []) out.delete.push(await verwijderProduct(N(x)) || { id: x }); return res.status(200).json(out); }
      if (id && r[2] === 'variations') {
        const vid = N(r[3]); const p = await kv.get(pKey(id)); if (!p) { st = 404; return fout(res, 'woocommerce_rest_product_invalid_id', 'Invalid ID.', 404); }
        if (r[3] === 'batch') { const out = { create: [], update: [], delete: [] }; for (const v of b.create || []) out.create.push(await variatie(id, 0, v)); for (const v of b.update || []) out.update.push(await variatie(id, N(v.id), v)); for (const x of b.delete || []) out.delete.push(await variatie(id, N(x), {}, true)); return res.status(200).json(out); }
        if (m === 'GET') return vid ? res.status(200).json((p._var || []).find(v => v.id === vid) || {}) : lijst(res, p._var || [], q);
        if (m === 'POST' && !vid) { st = 201; return res.status(201).json(await variatie(id, 0, b)); }
        if (m === 'DELETE') return res.status(200).json(await variatie(id, vid, {}, true) || {});
        return res.status(200).json(await variatie(id, vid, b) || {});
      }
      if (m === 'GET' && id) { const p = await kv.get(pKey(id)); if (!p) { st = 404; return fout(res, 'woocommerce_rest_product_invalid_id', 'Invalid ID.', 404); } return res.status(200).json(toon(p)); }
      if (m === 'GET') { let l = (await alleProducten()).map(toon); const sku = q.get('sku'), s = q.get('search'), inc = q.get('include'); if (sku) l = l.filter(p => sku.split(',').includes(p.sku)); if (s) l = l.filter(p => String(p.name || '').toLowerCase().includes(s.toLowerCase())); if (inc) { const set = new Set(inc.split(',').map(Number)); l = l.filter(p => set.has(p.id)); } return lijst(res, l, q); }
      if (m === 'POST' && !id) { st = 201; return res.status(201).json(await maakProduct(b)); }
      if (m === 'DELETE') return res.status(200).json(await verwijderProduct(id) || {});
      const p = await werkProductBij(id, b); if (!p) { st = 404; return fout(res, 'woocommerce_rest_product_invalid_id', 'Invalid ID.', 404); } return res.status(200).json(p);
    }
    if (wat === 'orders') {
      if (id && r[2] === 'notes') {
        const o = await kv.get(oKey(id)); if (!o) { st = 404; return fout(res, 'woocommerce_rest_shop_order_invalid_id', 'Invalid ID.', 404); }
        if (m === 'POST') { const n = { id: await nieuwId(), author: 'Droppery', date_created: nu(), note: String(b.note || ''), customer_note: !!b.customer_note }; o._notes = (o._notes || []).concat(n); await kv.set(oKey(id), o, { ex: ORDER_TTL }); st = 201; return res.status(201).json(n); }
        return lijst(res, o._notes || [], q);
      }
      if (id && r[2] === 'refunds') return lijst(res, [], q);
      if (r[1] === 'batch') { const out = { update: [] }; for (const u of b.update || []) { const o = await kv.get(oKey(N(u.id))); if (o) { Object.assign(o, u, { id: o.id, date_modified: nu() }); await kv.set(oKey(o.id), o, { ex: ORDER_TTL }); out.update.push(toonOrder(o)); } } return res.status(200).json(out); }
      if (m === 'GET' && id) { const o = await kv.get(oKey(id)); if (!o) { st = 404; return fout(res, 'woocommerce_rest_shop_order_invalid_id', 'Invalid ID.', 404); } return res.status(200).json(toonOrder(o)); }
      if (m === 'GET') { let l = (await alleOrders()).map(toonOrder).sort((a, b2) => b2.id - a.id); const sts = q.get('status'); if (sts && sts !== 'any') l = l.filter(o => sts.split(',').includes(o.status)); l = filterDatum(l, q, q.get('modified_after') ? 'date_modified' : 'date_created'); const inc = q.get('include'); if (inc) { const set = new Set(inc.split(',').map(Number)); l = l.filter(o => set.has(o.id)); } return lijst(res, l, q); }
      if ((m === 'PUT' || m === 'POST' || m === 'PATCH') && id) {
        const o = await kv.get(oKey(id)); if (!o) { st = 404; return fout(res, 'woocommerce_rest_shop_order_invalid_id', 'Invalid ID.', 404); }
        const meta = o.meta_data || []; for (const x of b.meta_data || []) { const i = meta.findIndex(y => y.key === x.key); if (i >= 0) meta[i] = Object.assign(meta[i], x); else meta.push(Object.assign({ id: await nieuwId() }, x)); }
        const { meta_data, line_items, ...rest } = b; Object.assign(o, rest, { meta_data: meta, id: o.id, date_modified: nu() }); if (rest.status === 'completed' && !o.date_completed) o.date_completed = nu();
        await kv.set(oKey(id), o, { ex: ORDER_TTL }); if (rest.status) await vuurWebhooks('order.updated', toonOrder(o)); return res.status(200).json(toonOrder(o));
      }
      if (m === 'POST') { st = 400; return fout(res, 'kadoly_orders_readonly', 'Orders are created by the Kadoly shop.', 400); }
    }
    st = 200; return lijst(res, [], q);
  } finally { await logRegel(Object.assign(regel, { st, wat })); }
}

// ---------- voor de Kadoly-shop ----------
export async function dpFeed() {
  const l = await alleProducten(); const out = [];
  for (const p of l) {
    // Droppery zet nieuwe producten soms als concept; de Kadoly-shop beslist zelf over tonen (prijs, marge), dus alleen prullenbak overslaan
    if (p.status === 'trash') continue;
    const ink = (p.meta_data || []).find(m => /purchase|cost|inkoop|supplier_price/i.test(m.key));
    const basis = { dp_id: p.id, dp_status: p.status || 'publish', inkoop: ink ? N(ink.value) : (INKOOP[p.sku] ? INKOOP[p.sku].inkoop : null), inkoop_bron: ink ? 'droppery' : (INKOOP[p.sku] ? 'catalogus' : null), inkoop_btw: 'excl', verzend_nl: INKOOP[p.sku] ? INKOOP[p.sku].verzend_nl : null, fitting_sku: INKOOP[p.sku] && INKOOP[p.sku].fitting_sku || null, sku: p.sku || '', titel: p.name || '', omschrijving: p.description || p.short_description || '', prijs: N(p.sale_price || p.regular_price || p.price), adviesprijs: N(p.regular_price), voorraad: p.manage_stock ? N(p.stock_quantity) : (p.stock_status === 'outofstock' ? 0 : null), op_voorraad: p.stock_status !== 'outofstock', beelden: (p.images || []).map(i => i.src).filter(Boolean), categorieen: (p.categories || []).map(c => c.name || c.id), merk: ((p.attributes || []).find(a => /merk|brand/i.test(a.name || '')) || {}).options || [], ean: ((p.meta_data || []).find(m => /ean|gtin|barcode/i.test(m.key)) || {}).value || '', gewicht: p.weight || '', meta: (p.meta_data || []).filter(m => /price|prijs|cost|inkoop|supplier|leverancier|ship|verzend|deliver/i.test(m.key)).map(m => ({ key: m.key, value: m.value })) };
    basis.varianten = (p._var || []).map(v => ({ dp_variation_id: v.id, sku: v.sku || '', prijs: N(v.sale_price || v.regular_price || v.price), op_voorraad: v.stock_status !== 'outofstock', voorraad: v.manage_stock ? N(v.stock_quantity) : null, kenmerken: (v.attributes || []).map(a => ({ naam: a.name, waarde: a.option })), beeld: (v.image || {}).src || '' }));
    out.push(basis);
  }
  return { bron: 'droppery', aantal: out.length, bijgewerkt: nu(), producten: out };
}
export async function dpStand() {
  const k = await dpSleutels(false); const log = await dpLog(400); const [pn, on] = await Promise.all([ids(K.pids), ids(K.oids)]);
  const routes = {}; for (const r of log) { const key = (r.m || '') + ' ' + String(r.pad || r.uit || '').replace(/\/\d+/g, '/{id}'); routes[key] = (routes[key] || 0) + 1; }
  const ps = (await alleProducten()); const statussen = {}; for (const p of ps) { const s = p.status || 'publish'; statussen[s] = (statussen[s] || 0) + 1; }
  const zonder = { omschrijving: ps.filter(p => !(p.description || p.short_description)).length, beelden: ps.filter(p => !(p.images || []).length).length, categorie: ps.filter(p => !(p.categories || []).length).length };
  return { sleutelsKlaar: !!k, winkelUrl: DP_HOST, producten: pn.length, statussen, zonder, orders: on.length, webhooks: ((await kv.get(K.hooks)) || []).map(h => ({ id: h.id, topic: h.topic, status: h.status })), routes, laatste: log.slice(0, 15) };
}
