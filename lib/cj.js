// CJdropshipping voor Kadoly (24 nov 2026, Henkjan: "CJ zoek uit en koppel"). Doel: sieraden met een inkoop van 20 tot 30% van de prijs
// (Orderchamp zit op ~80% met de verzending erbij), het liefst uit een EU-magazijn van CJ (DE) zodat de klant binnen een paar dagen heeft.
// API: https://developers.cjdropshipping.com/api2.0/v1 (docs: developers.cjdropshipping.com/en/api/api2/api/*.html, gelezen 24 nov 2026).
//   Token: POST authentication/getAccessToken { apiKey } -> data.accessToken (zelfde token binnen 24 uur); header CJ-Access-Token.
//   Zoeken: GET product/listV2 (keyWord, page, size, countryCode = land met voorraad). sellPrice in USD (tekst).
//   Product: GET product/query?pid= -> variants[] (vid, variantSku, variantSellPrice USD, variantWeight gram).
//   Vracht: POST logistic/freightCalculate { startCountryCode, endCountryCode, products: [{ vid, quantity }] } -> [{ logisticName, logisticPrice USD, logisticAging }].
//   Order: POST shopping/order/createOrderV2, payType 3 = alleen aanmaken (geen betaling). Betalen doet Henkjan in CJ (My CJ > Orders),
//   of hij zet zelf automatisch betalen aan in CJ. Deze code betaalt nooit.
// Sleutel: Henkjan plakt de API-sleutel op /api/dp?op=cjtoken (beschermde host) of zet CJ_API_KEY als gedeelde Vercel-variabele.
// Free-account: hoogstens 1000 aanroepen per dag (docs); daarom wacht elke aanroep 1,1 s en is een zoekronde hoogstens 10 producten.
import { kv } from './db.js';

export const CJ_API = 'https://developers.cjdropshipping.com/api2.0/v1';
// USD naar EUR: vaste koers om mee te rekenen (24 nov 2026, controleren); betaalkosten Kadoly 2,9% + 0,30; btw 21%.
export const CJ_REGEL = { EUR: 0.87, BTW: 1.21, FEE: 0.029, VAST: 0.30, PRIJZEN: [24.95, 29.95, 39.95, 49.95], MAX_ZOEK: 10 };
const K = { key: 'cj:api:key', token: 'cj:api:token', kies: 'cj:kies', orders: 'cj:orders', log: 'cj:log' };
const N = x => { const n = Number(String(x == null ? '' : x).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const r2 = v => Math.round(v * 100) / 100;
const nu = () => new Date().toISOString().replace(/\.\d+Z$/, '');
const wacht = ms => new Promise(r => setTimeout(r, ms));
export async function cjLogRegel(tekst) { try { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: new Date().toISOString(), wie: 'cj-dropshipping', tekst: String(tekst).slice(0, 900) })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } catch (e) {} }

async function apiKey() { if (process.env.CJ_API_KEY) return process.env.CJ_API_KEY; try { return ((await kv.get(K.key)) || {}).key || ''; } catch (e) { return ''; } }
export async function cjStandToegang() { const k = await kv.get(K.key).catch(() => null); const t = await kv.get(K.token).catch(() => null); return { klaar: !!(process.env.CJ_API_KEY || (k && k.key)), bron: process.env.CJ_API_KEY ? 'env' : k ? 'kv' : null, sinds: k ? k.at : null, token: t ? { tot: t.tot } : null }; }

async function token(vers = false, sleutel) {
  if (!vers && !sleutel) { const t = await kv.get(K.token).catch(() => null); if (t && t.token && Date.parse(t.tot) > Date.now() + 6e5) return t.token; }
  const k = sleutel || await apiKey(); if (!k) return '';
  const r = await fetch(CJ_API + '/authentication/getAccessToken', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey: k }), signal: AbortSignal.timeout(20000) }).catch(e => ({ ok: false, fout: e.message }));
  const j = r && r.json ? await r.json().catch(() => null) : null; const d = j && j.data;
  if (!d || !d.accessToken) return '';
  const tot = new Date(Math.min(Date.now() + 23 * 3600e3, Date.parse(d.accessTokenExpiryDate || '') || Infinity)).toISOString();
  if (!sleutel) await kv.set(K.token, { token: d.accessToken, tot }).catch(() => {});
  return d.accessToken;
}

export async function cjApi(pad, { methode = 'GET', params = {}, body = null } = {}) {
  let t = await token(); if (!t) return { ok: false, st: 0, fout: 'geen CJ-sleutel; Henkjan plakt hem op /api/dp?op=cjtoken' };
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '').map(([k, v]) => [k, String(v)])).toString();
  const u = CJ_API + '/' + String(pad || '').replace(/^\/+/, '') + (qs ? '?' + qs : '');
  for (let poging = 0; poging < 2; poging++) {
    try {
      const r = await fetch(u, { method: methode, headers: Object.assign({ 'CJ-Access-Token': t, accept: 'application/json' }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(25000) });
      const j = await r.json().catch(() => null);
      if (j && (j.code === 1600001 || j.code === 1600003) && poging === 0) { t = await token(true); continue; } // token verlopen of ongeldig: één keer vernieuwen
      return { ok: !!(j && j.result !== false && (j.code === 200 || j.code === 0)), st: r.status, code: j && j.code, data: j ? j.data : null, fout: j && j.result === false ? j.message : undefined };
    } catch (e) { return { ok: false, st: 0, fout: String(e.message || e).slice(0, 200) }; }
  }
  return { ok: false, st: 0, fout: 'token' };
}

// Sleutel plakken: eerst proberen, dan bewaren.
export async function cjSleutelZet(sleutel) {
  sleutel = String(sleutel || '').trim(); if (sleutel.length < 20) return { ok: false, fout: 'Dat lijkt geen API-sleutel (te kort). Kopieer de hele sleutel bij My CJ > Apps > API.' };
  const t = await token(true, sleutel); if (!t) return { ok: false, fout: 'CJ geeft geen token met deze sleutel. Kopieer de volledige sleutel (met @api@ erin).' };
  await kv.set(K.key, { key: sleutel, at: nu() }); await kv.del([K.token]).catch(() => {});
  await cjLogRegel('CJ-sleutel gezet; koppeling actief (zoeken, vracht, orders aanmaken zonder betalen).');
  return { ok: true };
}

// Rekensom per verkoopprijs (incl. btw): marge = prijs/1,21 - inkoop - vracht - betaalkosten. Inkoop en vracht in euro.
export function cjMarge(prijs, inkoopEur, vrachtEur) { return r2(prijs / CJ_REGEL.BTW - inkoopEur - vrachtEur - (CJ_REGEL.FEE * prijs + CJ_REGEL.VAST)); }

// Zoeken met vracht naar NL en marge. land = voorraadland (DE = EU-magazijn, CN = China). Hoogstens 10 producten per ronde.
export async function cjZoek({ q = 'stainless steel necklace', land = 'DE', n = 8, naar = 'NL' } = {}) {
  n = Math.max(1, Math.min(CJ_REGEL.MAX_ZOEK, Number(n) || 8)); land = String(land || 'DE').toUpperCase().slice(0, 2);
  const l = await cjApi('product/listV2', { params: { keyWord: q, page: 1, size: n, countryCode: land } });
  if (!l.ok) return { ok: false, stap: 'zoeken', fout: l.fout || l.code };
  const dd = l.data || {}; const c0 = Array.isArray(dd.content) ? dd.content : [];
  // listV2 geeft content[0].productList; oudere vormen: data.list of content als lijst producten
  const lijst = (c0[0] && c0[0].productList) || dd.list || (c0.length && c0[0] && (c0[0].id || c0[0].pid) ? c0 : []) || [];
  if (!lijst.length) return { ok: true, q, land, naar, gevonden: 0, items: [], vorm: JSON.stringify(dd).slice(0, 700) };
  const uit = [];
  for (const p of lijst.slice(0, n)) {
    await wacht(1100);
    const d = await cjApi('product/query', { params: { pid: p.id || p.pid, countryCode: land } }); const v = d.ok && d.data && (d.data.variants || [])[0];
    if (!v) { uit.push({ pid: p.id, titel: p.nameEn, fout: 'geen variant met voorraad in ' + land }); continue; }
    await wacht(1100);
    const f = await cjApi('logistic/freightCalculate', { methode: 'POST', body: { startCountryCode: land, endCountryCode: naar, products: [{ vid: v.vid, quantity: 1 }] } });
    const opties = (f.ok && Array.isArray(f.data) ? f.data : []).map(x => ({ naam: x.logisticName, usd: N(x.totalPostageFee) || N(x.logisticPrice), dagen: x.logisticAging })).filter(x => x.usd > 0).sort((a, b) => a.usd - b.usd);
    const vracht = opties[0] || null; const inkoop = r2(N(v.variantSellPrice) * CJ_REGEL.EUR), vEur = vracht ? r2(vracht.usd * CJ_REGEL.EUR) : null;
    uit.push({ pid: p.id, vid: v.vid, sku: v.variantSku, titel: p.nameEn, beeld: p.bigImage, gewicht: v.variantWeight, varianten: (d.data.variants || []).length, inkoopUsd: N(v.variantSellPrice), inkoop, vracht: vracht ? { naam: vracht.naam, eur: vEur, dagen: vracht.dagen } : null, snelste: opties.slice().sort((a, b) => parseInt(a.dagen) - parseInt(b.dagen))[0] || null,
      marge: vEur == null ? null : Object.fromEntries(CJ_REGEL.PRIJZEN.map(pr => [pr, cjMarge(pr, inkoop, vEur)])) });
  }
  return { ok: true, q, land, naar, koers: CJ_REGEL.EUR, gevonden: lijst.length, items: uit };
}

// Gekozen producten voor de winkel (Henkjan of de chat kiest; de shop haalt ze op via op=cjfeed). x = { vid, prijs, titel_nl, categorie }
export async function cjKies(x) {
  if (!x || !x.vid || !(N(x.prijs) > 0)) return { ok: false, fout: 'vid en prijs zijn nodig' };
  const lijst = (await kv.get(K.kies).catch(() => null)) || {};
  if (x.weg) { delete lijst[x.vid]; await kv.set(K.kies, lijst); return { ok: true, weg: x.vid }; }
  const v = await cjApi('product/variant/queryByVid', { params: { vid: x.vid } }); const d = v.ok ? v.data : null;
  lijst[x.vid] = { vid: x.vid, pid: d && d.pid || x.pid || null, sku: d && d.variantSku || null, titel_en: d && d.variantNameEn || x.titel_en || null, titel_nl: x.titel_nl || null, beeld: d && d.variantImage || x.beeld || null,
    inkoopUsd: d ? N(d.variantSellPrice) : N(x.inkoopUsd), gewicht: d ? N(d.variantWeight) : null, prijs: N(x.prijs), categorie: x.categorie || 'Sieraden', land: String(x.land || 'DE').toUpperCase().slice(0, 2), at: nu() };
  await kv.set(K.kies, lijst); return { ok: true, product: lijst[x.vid] };
}
export async function cjFeed() {
  const lijst = Object.values((await kv.get(K.kies).catch(() => null)) || {});
  return { ok: true, aantal: lijst.length, producten: lijst.map(p => ({ sku: 'CJ-' + p.vid, vid: p.vid, titel: p.titel_nl || p.titel_en, titel_en: p.titel_en, beeld: p.beeld, prijs_kadoly: p.prijs, categorie: p.categorie, merk: 'Kadoly', verzendland: p.land, gewicht_gram: p.gewicht })) };
}

// Order van Kadoly: { order_id, klant: { naam, email, telefoon, adres1, adres2, plaats, postcode, provincie, land }, regels: [{ sku: 'CJ-<vid>', aantal }] }
// Maakt de order bij CJ aan met payType 3 (niet betalen). Vervoerder: de goedkoopste uit freightCalculate voor dit pakket.
export async function cjNieuweOrder(b) {
  const k = b && b.klant || {}; const regels = (b && b.regels || []).map(r => ({ vid: String(r.sku || r.vid || '').replace(/^CJ-/i, ''), quantity: Math.max(1, Math.round(N(r.aantal) || 1)) })).filter(r => r.vid);
  if (!b || !b.order_id || !regels.length || !k.adres1 || !k.postcode || !k.plaats || !k.naam) return { ok: false, fout: 'order_id, regels, naam en adres (adres1, postcode, plaats) zijn nodig' };
  const al = ((await kv.get(K.orders).catch(() => null)) || {})[b.order_id]; if (al) return Object.assign({ ok: true, al: true }, al);
  const kies = (await kv.get(K.kies).catch(() => null)) || {}; const van = (kies[regels[0].vid] && kies[regels[0].vid].land) || 'DE';
  const land = String(k.land || 'NL').toUpperCase().slice(0, 2);
  const f = await cjApi('logistic/freightCalculate', { methode: 'POST', body: { startCountryCode: van, endCountryCode: land, zip: k.postcode, products: regels } });
  const vervoer = (f.ok && Array.isArray(f.data) ? f.data : []).sort((a, b2) => N(a.logisticPrice) - N(b2.logisticPrice))[0];
  if (!vervoer) return { ok: false, stap: 'vracht', fout: f.fout || 'geen vervoerder van ' + van + ' naar ' + land };
  const LANDEN = { NL: 'Netherlands', BE: 'Belgium', DE: 'Germany' };
  const body = { orderNumber: 'KADOLY-' + b.order_id, shippingCountryCode: land, shippingCountry: LANDEN[land] || land, shippingProvince: k.provincie || k.plaats, shippingCity: k.plaats, shippingZip: k.postcode,
    shippingAddress: k.adres1, shippingAddress2: k.adres2 || undefined, shippingCustomerName: k.naam, shippingPhone: k.telefoon || undefined, email: k.email || undefined, logisticName: vervoer.logisticName, fromCountryCode: van, payType: 3, shopLogisticsType: 2, products: regels };
  const o = await cjApi('shopping/order/createOrderV2', { methode: 'POST', body });
  const rec = { order_id: b.order_id, cj_order: o.data && (o.data.orderId || o.data.orderNum) || null, vervoer: vervoer.logisticName, vrachtUsd: N(vervoer.logisticPrice), regels, ok: o.ok, fout: o.ok ? undefined : (o.fout || o.code), betaald: false, at: nu() };
  try { const m = (await kv.get(K.orders).catch(() => null)) || {}; m[b.order_id] = rec; await kv.set(K.orders, m); } catch (e) {}
  await cjLogRegel('CJ-order ' + b.order_id + ': ' + (o.ok ? 'aangemaakt bij CJ (' + rec.cj_order + ', ' + vervoer.logisticName + '), nog niet betaald. Betalen: cjdropshipping.com, My CJ > Orders.' : 'mislukt: ' + rec.fout));
  return rec;
}
export async function cjOrders() { return (await kv.get(K.orders).catch(() => null)) || {}; }
export async function cjOrderInfo(cjOrder) { return cjApi('shopping/order/getOrderDetail', { params: { orderId: cjOrder } }); }
export async function cjStand() { const kies = (await kv.get(K.kies).catch(() => null)) || {}; return { toegang: await cjStandToegang(), gekozen: Object.keys(kies).length, orders: Object.keys(await cjOrders()).length }; }
