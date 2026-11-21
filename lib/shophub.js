// Inkoopwinkel achter Kadoly (21 nov 2026, Henkjan: "Nee je kan die koppeling gewoon met WOO maken . Denk even na !", "of shopify",
// en op het voorstel van een verborgen inkoopwinkel: "Ja doe dat . SLim . Shopify . We kunnen misschien nog meer van ze leren .").
//
// Een verborgen Shopify-winkel (Kadoly Inkoop, met wachtwoord, klanten zien hem nooit) waarop elke dropship-app aansluit die op
// Shopify werkt: Syncee, Gelato, Printful, Printify, Spocket, AW Dropship enz. Kadoly verkoopt; de inkoopwinkel koopt in.
//   1. Producten: de nachtronde leest alle actieve producten (Admin GraphQL), keurt ze (lib/dpkeur.js) en zet ze per leverancier
//      (vendor) in een eigen testhoek (lib/hoeken.js). Inkoop = "Cost per item" (inventoryItem.unitCost) die de apps invullen.
//   2. Orders: een betaalde Kadoly-order met hub-producten wordt een order in de inkoopwinkel (orderCreate, status betaald, geen
//      mails naar de klant); de app van de leverancier pakt hem daar op.
// Toegang: een app in het Shopify Dev Dashboard (zelfde organisatie als de winkel, geinstalleerd op de winkel). Henkjan plakt de
// winkelnaam, client ID en client secret op /api/dp?op=shtoken (beschermde host); de server haalt elke 24 uur een nieuw
// toegangstoken (client credentials grant). Geen sleutels in code, pagina's of antwoorden.
import { kv } from './db.js';
import { keurProduct, keurStand } from './dpkeur.js';
import { vraagIdx } from './dpapi.js';

export const SH_VERSIE = '2026-10';
const K = { hub: 'sh:hub', tok: 'sh:hub:tok', cat: 'sh:hub:cat', orders: 'sh:hub:orders' };
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const nu = () => new Date().toISOString().replace(/\.\d+Z$/, '');
export const slug = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const KLANT_VERZEND = 6.95; // klant betaalt verzending, zoals op de rest van Kadoly (Henkjan 17 nov)

export async function shHub() { return (await kv.get(K.hub).catch(() => null)) || null; }
export async function shStandToegang() { const h = await shHub(); return { klaar: !!(h && h.shop && h.id && h.geheim), winkel: h ? h.shop : null, sinds: h ? h.at : null, scopes: h ? h.scopes || null : null }; }
const winkelVan = s => String(s || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\.myshopify\.com.*$/, '').replace(/[^a-z0-9-]/g, '');

async function haalToken(h) {
  const r = await fetch('https://' + h.shop + '.myshopify.com/admin/oauth/access_token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: h.id, client_secret: h.geheim }).toString(), signal: AbortSignal.timeout(20000) });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {}
  if (!r.ok || !j || !j.access_token) return { fout: 'Shopify antwoordt ' + r.status + ' (' + String(j ? (j.error_description || j.error || JSON.stringify(j)) : t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).slice(0, 200) + ')' };
  return { token: j.access_token, scope: j.scope || '', tot: Date.now() + (N(j.expires_in) || 86399) * 1000 - 120e3 };
}
export async function shToken() {
  const h0 = await shHub(); if (h0 && h0.offline) return h0.offline; // via toestemming (authorization code grant): blijft geldig
  const c = await kv.get(K.tok).catch(() => null); if (c && c.token && c.tot > Date.now()) return c.token;
  const h = await shHub(); if (!h) return null; const t = await haalToken(h); if (!t.token) return null;
  try { await kv.set(K.tok, t, { ex: 86000 }); } catch (e) {} return t.token;
}
export async function shZet({ shop, id, geheim }) {
  const h = { shop: winkelVan(shop), id: String(id || '').trim(), geheim: String(geheim || '').trim(), at: nu() };
  if (!h.shop || h.id.length < 10 || h.geheim.length < 10) return { ok: false, fout: 'Vul de winkelnaam (naam.myshopify.com), de client ID en de client secret in.' };
  const oud = await shHub(); if (oud && oud.offline && oud.shop === h.shop && oud.id === h.id) h.offline = oud.offline;
  const t = await haalToken(h); if (!t.token) { await kv.set(K.hub, h); return { ok: false, oauth: true, fout: t.fout }; }
  h.scopes = t.scope; await kv.set(K.hub, h); try { await kv.set(K.tok, t, { ex: 86000 }); } catch (e) {}
  const s = await shGql('{ shop { name myshopifyDomain currencyCode } productsCount { count } }'); return { ok: true, scopes: t.scope, winkel: s.data && s.data.shop, producten: s.data && s.data.productsCount ? s.data.productsCount.count : null };
}
export async function shGql(query, variables = {}) {
  const h = await shHub(); const t = await shToken(); if (!h || !t) return { fout: 'geen toegang tot de inkoopwinkel (op=shtoken)' };
  try {
    const r = await fetch('https://' + h.shop + '.myshopify.com/admin/api/' + SH_VERSIE + '/graphql.json', { method: 'POST', headers: { 'content-type': 'application/json', 'x-shopify-access-token': t }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(30000) });
    const j = await r.json().catch(() => null); if (!j) return { fout: 'HTTP ' + r.status };
    return j.errors ? { fout: JSON.stringify(j.errors).slice(0, 400), data: j.data } : { data: j.data, kosten: j.extensions && j.extensions.cost };
  } catch (e) { return { fout: String(e.message || e).slice(0, 200) }; }
}

// ---------- producten ----------
const PQ = `query($n:Int!,$na:String){ products(first:$n, after:$na, query:"status:active"){ pageInfo{ hasNextPage endCursor } nodes{ id handle title vendor productType tags description
  media(first:6){ nodes{ ... on MediaImage { image { url } } } }
  variants(first:100){ nodes{ id sku barcode title price compareAtPrice inventoryQuantity selectedOptions{ name value }
    inventoryItem{ tracked unitCost{ amount currencyCode } measurement{ weight{ value unit } } } } } } } }`;
function norm(p) {
  const beelden = ((p.media && p.media.nodes) || []).map(m => m && m.image && m.image.url).filter(Boolean);
  return ((p.variants && p.variants.nodes) || []).map(v => {
    const w = v.inventoryItem && v.inventoryItem.measurement && v.inventoryItem.measurement.weight; const kg = w ? (w.unit === 'GRAMS' ? N(w.value) / 1000 : w.unit === 'POUNDS' ? N(w.value) * 0.4536 : w.unit === 'OUNCES' ? N(w.value) * 0.02835 : N(w.value)) : 0;
    const cost = v.inventoryItem && v.inventoryItem.unitCost; const naam = p.title + (v.title && v.title !== 'Default Title' ? ' – ' + v.title : '');
    return { hub_id: p.id, hub_variant: v.id, sku: 'SH-' + (v.sku || v.id.split('/').pop()), titel: naam, omschrijving: String(p.description || '').slice(0, 1500), merk: p.vendor || '', leverancier: p.vendor || '',
      hoek: slug(p.vendor || 'hub'), type: p.productType || '', tags: p.tags || [], ean: v.barcode || '', prijs: N(v.price), adviesprijs: N(v.compareAtPrice) || N(v.price),
      inkoop: cost ? N(cost.amount) : null, inkoop_valuta: cost ? cost.currencyCode : null, voorraad: v.inventoryItem && v.inventoryItem.tracked === false ? null : v.inventoryQuantity == null ? null : N(v.inventoryQuantity), /* niet bijgehouden (handgemaakt, op bestelling) = onbekend, geen afkeur */ gewicht: kg || '', beelden,
      kenmerken: (v.selectedOptions || []).filter(o => o.name !== 'Title').map(o => ({ naam: o.name, waarde: o.value })) };
  });
}
export async function shScan({ tijd = 200e3 } = {}) {
  const start = Date.now(); const uit = []; let na = null, pagina = 0;
  while (Date.now() - start < tijd) { const r = await shGql(PQ, { n: 8, na }); /* 8 producten x 100 varianten blijft onder de querykosten van Shopify */ if (r.fout) return { ok: false, fout: r.fout, gelezen: uit.length }; const ps = r.data.products; for (const p of ps.nodes) uit.push(...norm(p)); pagina++; if (!ps.pageInfo.hasNextPage) break; na = ps.pageInfo.endCursor; }
  try { await kv.set(K.cat, { at: nu(), producten: uit }); } catch (e) { return { ok: false, fout: 'opslaan: ' + String(e.message || e).slice(0, 100), gelezen: uit.length }; }
  return { ok: true, paginas: pagina, varianten: uit.length };
}
export async function shKeur() {
  const [idx, cat] = await Promise.all([vraagIdx().catch(() => []), kv.get(K.cat).catch(() => null)]); const ps = (cat && cat.producten) || [];
  // verzending betaalt de klant; per leverancier weten we de echte prijs nog niet: reken EUR 3 voor ons (geschat) tot de eerste orders het leren
  const lijst = ps.map(p => ({ p, keur: keurProduct(Object.assign({}, p, { verzend_nl: 3 }), idx, { scoreGrens: idx.length > 0 }) }));
  lijst.forEach(x => { x.keur.label = x.keur.ok ? (x.keur.label === 'dp-top' ? 'sh-top' : 'sh-mid') : 'sh-uit'; });
  const perHoek = {}; for (const x of lijst.filter(y => y.keur.ok)) { const h = perHoek[x.p.hoek] || (perHoek[x.p.hoek] = { leverancier: x.p.leverancier, n: 0, marge: 0 }); h.n++; h.marge += N(x.keur.marge); }
  return { at: nu(), catalogus: cat ? cat.at : null, stand: keurStand(lijst), perHoek, lijst };
}
export async function shFeed({ start = 0, size = 250 } = {}) {
  start = Math.max(0, N(start)); size = Math.min(500, Math.max(1, N(size) || 250));
  const k = await shKeur(); const rij = k.lijst.filter(x => x.keur.ok).sort((a, b) => b.keur.score - a.keur.score);
  const deel = rij.slice(start, start + size).map(({ p, keur }) => Object.assign({}, p, { prijs_kadoly: keur.prijs, gratis_verzending: false, verzending_klant: KLANT_VERZEND, categorie: 'Testhoek > ' + p.leverancier,
    keur: { ok: keur.ok, score: keur.score, label: keur.label, marge: keur.marge, marge_bak: keur.margeBak, vraag: keur.vraag, reden: keur.reden } }));
  return { bron: 'shopify-inkoopwinkel', totaal: rij.length, start, size, volgende: start + size < rij.length ? '/api/dp?op=shfeed&start=' + (start + size) + '&size=' + size : null,
    regel: 'elk product staat in de testhoek van zijn leverancier (veld hoek), niet tussen de rest; prijs_kadoly = verkoopprijs van de leverancier, nooit boven advies; verzending EUR 6,95; titels kunnen Engels zijn: vertaal zonder iets te verzinnen',
    bijgewerkt: nu(), producten: deel };
}

// ---------- orders: Kadoly -> inkoopwinkel ----------
// b = { order_id, klant: { naam, email, telefoon, adres1, adres2, plaats, postcode, land }, regels: [{ sku: 'SH-...', hub_variant?, aantal }] }
export async function shOrder(b) {
  const k = (b && b.klant) || {}; if (!b || !b.order_id || !Array.isArray(b.regels) || !b.regels.length || !k.adres1 || !k.postcode || !k.plaats) return { ok: false, fout: 'order_id, regels en adres zijn nodig' };
  const al = ((await kv.get(K.orders).catch(() => null)) || {})[b.order_id]; if (al) return Object.assign({ ok: true, al: true }, al);
  const cat = (await kv.get(K.cat).catch(() => null)) || {}; const per = new Map(((cat.producten) || []).map(p => [p.sku, p]));
  const lijnen = []; const mist = [];
  for (const r of b.regels) { const v = r.hub_variant || (per.get(r.sku) || {}).hub_variant; if (!v) { mist.push(r.sku); continue; } lijnen.push({ variantId: v, quantity: Math.max(1, Math.round(N(r.aantal) || 1)) }); }
  if (!lijnen.length) return { ok: false, fout: 'geen bekende regels: ' + mist.join(', ') };
  const [voor, ...rest] = String(k.naam || '').trim().split(/\s+/); const adres = { firstName: voor || '', lastName: rest.join(' ') || voor || '', address1: k.adres1, address2: k.adres2 || null, city: k.plaats, zip: k.postcode, countryCode: String(k.land || 'NL').toUpperCase().slice(0, 2), phone: k.telefoon || null };
  const M = `mutation($o:OrderCreateOrderInput!,$opt:OrderCreateOptionsInput){ orderCreate(order:$o, options:$opt){ order{ id name } userErrors{ field message } } }`;
  const r = await shGql(M, { o: { lineItems: lijnen, shippingAddress: adres, billingAddress: adres, email: k.email || null, financialStatus: 'PAID', note: 'Kadoly order ' + b.order_id, tags: ['kadoly', 'kadoly-' + b.order_id] },
    opt: { inventoryBehaviour: 'DECREMENT_OBEYING_POLICY', sendReceipt: false, sendFulfillmentReceipt: false } });
  const d = r.data && r.data.orderCreate; const fout = r.fout || (d && d.userErrors && d.userErrors.length ? d.userErrors.map(e => e.message).join('; ') : '');
  const rec = { order_id: b.order_id, hub_order: d && d.order ? d.order.name : null, hub_id: d && d.order ? d.order.id : null, mist, fout, at: nu() };
  if (rec.hub_id) { try { const m = (await kv.get(K.orders).catch(() => null)) || {}; m[b.order_id] = rec; await kv.set(K.orders, m); } catch (e) {} }
  return Object.assign({ ok: !!rec.hub_id && !mist.length }, rec);
}
export async function shOrders() { return (await kv.get(K.orders).catch(() => null)) || {}; }

// ---------- toestemmingsroute (authorization code grant), als client credentials niet mag (winkel in een andere organisatie) ----------
// Redirect-URL in de app (Dev Dashboard, Allowed redirection URLs): https://hjdk-api-henq.vercel.app/api/shauth
export const SH_SCOPES = 'read_products,read_inventory,read_orders,write_orders,read_fulfillments,read_merchant_managed_fulfillment_orders,read_assigned_fulfillment_orders,read_third_party_fulfillment_orders';
export const SH_TERUG = 'https://hjdk-api-henq.vercel.app/api/shauth';
export async function shAuthStart() {
  const h = await shHub(); if (!h || !h.id) return { fout: 'eerst winkel, client ID en secret opslaan (op=shtoken)' };
  const { randomBytes } = await import('node:crypto'); const state = randomBytes(16).toString('hex'); await kv.set('sh:hub:state', state, { ex: 900 });
  return { url: 'https://' + h.shop + '.myshopify.com/admin/oauth/authorize?' + new URLSearchParams({ client_id: h.id, scope: SH_SCOPES, redirect_uri: SH_TERUG, state }).toString() };
}
export async function shAuthTerug(params) {
  const h = await shHub(); if (!h || !h.geheim) return { ok: false, fout: 'geen app-gegevens opgeslagen' };
  const { createHmac, timingSafeEqual } = await import('node:crypto');
  const p = Object.fromEntries(params.entries()); const hmac = String(p.hmac || ''); delete p.hmac; delete p.signature; delete p.op;
  const bericht = Object.keys(p).sort().map(k => k + '=' + p[k]).join('&'); const moet = createHmac('sha256', h.geheim).update(bericht).digest('hex');
  if (hmac.length !== moet.length || !timingSafeEqual(Buffer.from(hmac), Buffer.from(moet))) return { ok: false, fout: 'handtekening van Shopify klopt niet' };
  const st = await kv.get('sh:hub:state').catch(() => null); if (!st || st !== p.state) return { ok: false, fout: 'verlopen of onbekende aanvraag; begin opnieuw' };
  if (String(p.shop || '').replace(/\.myshopify\.com$/, '') !== h.shop) return { ok: false, fout: 'andere winkel dan opgeslagen' };
  const r = await fetch('https://' + h.shop + '.myshopify.com/admin/oauth/access_token', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ client_id: h.id, client_secret: h.geheim, code: p.code }), signal: AbortSignal.timeout(20000) });
  const j = await r.json().catch(() => null); if (!r.ok || !j || !j.access_token) return { ok: false, fout: 'Shopify antwoordt ' + r.status + ' ' + String(j ? (j.error_description || j.error || JSON.stringify(j)) : '').slice(0, 200) };
  h.offline = j.access_token; h.scopes = j.scope || h.scopes; h.via = 'toestemming'; h.at = nu(); await kv.set(K.hub, h); await kv.del(['sh:hub:state']).catch(() => {});
  const s = await shGql('{ shop { name } productsCount { count } }'); return { ok: true, scopes: h.scopes, winkel: s.data && s.data.shop, producten: s.data && s.data.productsCount ? s.data.productsCount.count : null };
}
