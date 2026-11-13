// Link uitlezen (elke winkel), winkellinks met partnercode, zoek- en vergelijklinks, en de Kadoly-catalogus.
// Alleen gewone pagina's ophalen, geen betaalde diensten (Henkjan: "geen betaalde opvragingen zonder mijn woord").
import { kv } from '../db.js';
import { berichten, HAIKU } from '../ai.js';
import { getAmzTagOnly } from '../amz.js';

const UA = 'Mozilla/5.0 (compatible; KadolyLijst/1.0; +https://gids.kadoly.com/w)'; // eerlijk als link-voorvertoning; wie ons weert, weert ons (dan vult de gebruiker zelf de naam in)
export const BOL_SITE = process.env.BOL_BRIDGE_SITE || '1545836';
const num = v => { if (v == null) return null; if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
  let s = String(v).replace(/[^\d.,]/g, ''); if (!s) return null;
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, '');
  const n = Number(s); return Number.isFinite(n) && n > 0 && n < 1e6 ? Math.round(n * 100) / 100 : null; };
const ent = s => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d))).replace(/\s+/g, ' ').trim();

// alleen gewone webadressen, nooit interne
export function schoon(ruw) {
  let s = String(ruw || '').trim(); const m = /https?:\/\/[^\s<>"']+/i.exec(s); if (m) s = m[0]; else if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(s)) s = 'https://' + s; else return null;
  let u; try { u = new URL(s); } catch (e) { return null; }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
  const h = u.hostname.toLowerCase();
  if (h === 'localhost' || /\.(local|internal|localhost|lan|home)$/.test(h) || !/\./.test(h) || /^\[/.test(h)) return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return null; // geen kale IP-adressen
  return u;
}
const WINKELS = { 'bol.com': 'bol', 'amazon.nl': 'Amazon', 'amazon.de': 'Amazon', 'amazon.com': 'Amazon', 'amazon.co.uk': 'Amazon', 'amazon.fr': 'Amazon', 'amazon.es': 'Amazon', 'amazon.com.be': 'Amazon',
  'coolblue.nl': 'Coolblue', 'coolblue.be': 'Coolblue', 'kadoly.com': 'Kadoly', 'zalando.nl': 'Zalando', 'zalando.de': 'Zalando', 'ikea.com': 'IKEA', 'hema.nl': 'HEMA', 'mediamarkt.nl': 'MediaMarkt',
  'intertoys.nl': 'Intertoys', 'bijenkorf.nl': 'de Bijenkorf', 'decathlon.nl': 'Decathlon', 'action.com': 'Action', 'etsy.com': 'Etsy', 'otto.de': 'OTTO', 'lego.com': 'LEGO', 'apple.com': 'Apple' };
export function winkelNaam(host) {
  const h = String(host || '').toLowerCase().replace(/^(www|m|nl|de|fr|es|shop)\./, '');
  if (WINKELS[h]) return WINKELS[h]; for (const k in WINKELS) if (h.endsWith('.' + k)) return WINKELS[k];
  const d = h.split('.'); const b = d.length > 2 && d[d.length - 2].length <= 3 ? d[d.length - 3] : d[d.length - 2] || h; return b ? b.charAt(0).toUpperCase() + b.slice(1) : h;
}
function metas(html) {
  const o = {}; const re = /<meta\b[^>]*>/gi; let m;
  while ((m = re.exec(html))) { const t = m[0]; const k = /(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i.exec(t); const c = /content\s*=\s*["']([^"']*)["']/i.exec(t); if (k && c && !(k[1].toLowerCase() in o)) o[k[1].toLowerCase()] = ent(c[1]); }
  const ip = /itemprop=["']price["'][^>]*content=["']([^"']+)["']/i.exec(html); if (ip && !o.price) o.price = ip[1];
  return o;
}
function product(html) {
  const re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi; let m; const nodes = [];
  const loop = x => { if (!x || typeof x !== 'object') return; if (Array.isArray(x)) return x.forEach(loop); nodes.push(x); if (x['@graph']) loop(x['@graph']); if (x.mainEntity) loop(x.mainEntity); if (x.hasVariant) loop(x.hasVariant); };
  while ((m = re.exec(html))) { try { loop(JSON.parse(m[1].trim())); } catch (e) {} }
  const isP = n => { const t = [].concat(n['@type'] || []).map(String); return t.some(x => /^(Product|ProductGroup|IndividualProduct|Book|Vehicle)$/i.test(x)); };
  const p = nodes.find(isP); if (!p) return null;
  let offers = [].concat(p.offers || []).flatMap(o => o && o.offers ? [].concat(o.offers) : [o]).filter(Boolean);
  if (!offers.length && p.hasVariant) offers = [].concat(p.hasVariant).flatMap(v => [].concat(v.offers || []));
  const o = offers[0] || {}; const ps = o.priceSpecification ? [].concat(o.priceSpecification)[0] : null;
  let img = p.image; if (Array.isArray(img)) img = img[0]; if (img && typeof img === 'object') img = img.url || img.contentUrl;
  const brand = p.brand ? (typeof p.brand === 'string' ? p.brand : p.brand.name) : null;
  return { t: ent(p.name || ''), p: num(o.price ?? o.lowPrice ?? (ps && ps.price)), m: o.priceCurrency || (ps && ps.priceCurrency) || null, img: img ? String(img) : null, b: brand ? ent(brand) : null,
    ean: String(p.gtin13 || p.gtin || p.gtin12 || p.gtin14 || p.gtin8 || o.gtin13 || o.gtin || '').replace(/\D/g, '') || null };
}
function tekstVan(html) { return ent(html.replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).slice(0, 5000); }
function slugTitel(u) {
  const delen = u.pathname.split('/').map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } }).filter(Boolean);
  const kand = delen.filter(x => /[a-z]{3,}/i.test(x) && !/^(p|dp|product|products|nl|de|en|fr|es|be|s|item|artikel|gp|shop|c)$/i.test(x) && !/^\d+$/.test(x) && !/^[A-Z0-9]{10}$/.test(x)).map(x => x.replace(/\.(html?|aspx|php)$/i, ''));
  const s = (kand.sort((a, b) => b.length - a.length)[0] || '').replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim();
  return s ? (s.charAt(0).toUpperCase() + s.slice(1)).slice(0, 120) : '';
}
const asin = u => { const m = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i.exec(u.pathname); return m ? m[1].toUpperCase() : null; };
const absoluut = (x, basis) => { try { return x ? new URL(x, basis).href : null; } catch (e) { return null; } };
function knipTitel(t, winkel) { let s = String(t || ''); const w = String(winkel || '').toLowerCase(); s = s.replace(/\s*[|–—-]\s*([^|–—-]{2,40})$/, (m, x) => (x.toLowerCase().includes(w) || /\.(com|nl|de|fr|es|be)\b/i.test(x)) ? '' : m); return s.slice(0, 140); }

// Kadoly-catalogus (5 min in het geheugen)
let CAT = null, CAT_AT = 0, DUUR = {};
export async function catalogus() {
  if (CAT && Date.now() - CAT_AT < 300000) return CAT;
  let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {}
  try { DUUR = (await kv.get('hjdk:shop:duurder')) || {}; } catch (e) { DUUR = {}; }
  CAT = ((c && c.items) || []).filter(i => i && i.id && i.t && Number(i.p) > 0 && !DUUR[i.id]); CAT_AT = Date.now(); return CAT;
}
export const kdThuis = i => Math.round((Number(i.p) + (i.fs ? 0 : Number(i.vk) || 0)) * 100) / 100;
export function kdKaart(i) { return { pid: i.id, t: i.t, p: Number(i.p), img: i.img || null, b: i.b || null }; }

// Haalt titel, prijs, foto, merk en EAN van een productpagina. Zonder toegang: titel uit het adres.
export async function haalLink(ruw, o = {}) {
  const u = schoon(ruw); if (!u) return null;
  const host = u.hostname.replace(/^www\./, ''); const winkel = winkelNaam(host);
  // Kadoly zelf: rechtstreeks uit de catalogus
  const kp = /kadoly\.com$/.test(host) && /\/product\/([a-z0-9_]+)/i.exec(u.pathname);
  if (kp) { const cat = await catalogus(); const i = cat.find(x => x.id === kp[1]); if (i) return { u: u.href, w: 'Kadoly', t: i.t, p: Number(i.p), m: 'EUR', img: i.img || null, b: i.b || null, kd: i.id, bron: 'kadoly' }; }
  let html = '', eind = u, status = 0;
  try {
    const r = await fetch(u.href, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8', 'accept-language': (o.taal || 'nl') + ',en;q=0.7' }, redirect: 'follow', signal: AbortSignal.timeout(8000) });
    status = r.status; const e2 = schoon(r.url); if (e2) eind = e2;
    if (r.ok && /html/i.test(r.headers.get('content-type') || '') && e2) {
      const rd = r.body.getReader(); const dec = new TextDecoder(); let n = 0;
      while (n < 1600000) { const { done, value } = await rd.read(); if (done) break; n += value.length; html += dec.decode(value, { stream: true }); }
      try { rd.cancel(); } catch (e) {}
    }
  } catch (e) {}
  const it = { u: eind.href, w: winkelNaam(eind.hostname), t: '', p: null, m: 'EUR', img: null, b: null, ean: null, bron: 'pagina' };
  const geblokt = !html || /captcha|robot check|access denied|are you a human|cf-chl|just a moment/i.test(html.slice(0, 20000)) && !/application\/ld\+json/i.test(html);
  if (!geblokt) {
    const ld = product(html) || {}; const mt = metas(html); const tt = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    it.t = knipTitel(ld.t || mt['og:title'] || mt['twitter:title'] || (tt ? ent(tt[1]) : ''), it.w);
    it.p = ld.p || num(mt['product:price:amount'] || mt['og:price:amount'] || mt.price || mt['twitter:data1']);
    it.m = String(ld.m || mt['product:price:currency'] || mt['og:price:currency'] || mt.pricecurrency || 'EUR').toUpperCase().slice(0, 3);
    it.img = absoluut(ld.img || mt['og:image'] || mt['og:image:secure_url'] || mt['twitter:image'], eind.href);
    it.b = ld.b || mt['product:brand'] || mt['og:brand'] || null; it.ean = ld.ean || (mt['product:ean'] || mt['gtin13'] || '').replace(/\D/g, '') || null;
    // geen titel of prijs gevonden: laat Haiku de pagina lezen (kleine, goedkope vraag)
    if ((!it.t || !it.p) && o.ai !== false) {
      try {
        const r = await berichten({ fn: 'wl-link', model: HAIKU, max: 200, timeout: 15000, cacheTtl: 86400,
          system: 'You read a product web page and return only JSON: {"titel":string,"prijs":number|null,"valuta":string,"merk":string|null}. titel = short product name as the shop calls it (max 80 chars, no shop name). prijs = current selling price of this product, null if unsure.',
          user: 'URL: ' + eind.href + '\nTITLE: ' + (it.t || '') + '\nTEXT: ' + tekstVan(html) });
        const j = JSON.parse((/\{[\s\S]*\}/.exec(r.txt) || ['{}'])[0]);
        if (!it.t && j.titel) it.t = kortT(j.titel); if (!it.p && num(j.prijs)) { it.p = num(j.prijs); if (j.valuta) it.m = String(j.valuta).toUpperCase().slice(0, 3); } if (!it.b && j.merk) it.b = String(j.merk).slice(0, 60);
        it.bron = 'ai';
      } catch (e) {}
    }
  }
  if (!it.t) { it.t = slugTitel(eind) || slugTitel(u) || it.w; it.half = 1; it.bron = 'adres'; }
  if (!it.img) { const a = asin(eind) || asin(u); if (a) it.img = 'https://m.media-amazon.com/images/P/' + a + '.01._SCLZZZZZZZ_SX500_.jpg'; }
  if (!/^[A-Z]{3}$/.test(it.m)) it.m = 'EUR';
  it.status = status;
  return it;
}
const kortT = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 120);

// winkellink met partnercode: bol (partnerprogramma), Amazon (alleen in de eigen markt), Kadoly (utm). Andere winkels ongewijzigd.
export async function koopUrl(href, lijstId) {
  let x; try { x = new URL(href); } catch (e) { return null; }
  const h = x.hostname.replace(/^www\./, '').toLowerCase();
  if (/(^|\.)bol\.com$/.test(h)) return 'https://partner.bol.com/click/click?p=1&t=url&s=' + BOL_SITE + '&f=TXL&url=' + encodeURIComponent(x.href) + '&subid=' + encodeURIComponent('wl-' + lijstId);
  if (/(^|\.)kadoly\.com$/.test(h)) { x.searchParams.set('utm_source', 'verlanglijst'); x.searchParams.set('utm_medium', 'lijst'); x.searchParams.set('utm_campaign', 'wl-' + lijstId); return x.href; }
  if (/^amazon\./.test(h)) { try { const { tag, market } = await getAmzTagOnly(); if (tag && String(market).replace(/^www\./, '') === h) x.searchParams.set('tag', tag); } catch (e) {} return x.href; }
  return x.href;
}

// zoek- en vergelijklinks per taal; z = bol | amz | g | idealo | kd
const AMZ = { nl: 'www.amazon.nl', de: 'www.amazon.de', fr: 'www.amazon.fr', es: 'www.amazon.es', en: 'www.amazon.co.uk' };
export function vergelijkBronnen(taal) {
  if (taal === 'nl') return ['bol', 'amz', 'g'];
  if (taal === 'de') return ['idealo', 'amz', 'g'];
  if (taal === 'fr') return ['amz', 'idealo', 'g'];
  return ['amz', 'g'];
}
export const BRONNAAM = { bol: 'bol', amz: 'Amazon', g: 'Google Shopping', idealo: 'idealo' };
export async function zoekUrl(z, q, taal, lijstId) {
  const e = encodeURIComponent(String(q || '').slice(0, 120));
  if (z === 'bol') return 'https://partner.bol.com/click/click?p=1&t=url&s=' + BOL_SITE + '&f=TXL&url=' + encodeURIComponent('https://www.bol.com/nl/nl/s/?searchtext=' + e) + '&subid=' + encodeURIComponent('wl-' + (lijstId || 'zoek'));
  if (z === 'amz') { const mk = AMZ[taal] || AMZ.en; let tag = ''; try { const a = await getAmzTagOnly(); if (a.tag && a.market === mk) tag = '&tag=' + encodeURIComponent(a.tag); } catch (x) {} return 'https://' + mk + '/s?k=' + e + tag; }
  if (z === 'idealo') return taal === 'fr' ? 'https://www.idealo.fr/prechcat.html?q=' + e : 'https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=' + e;
  if (z === 'g') return 'https://www.google.com/search?tbm=shop&q=' + e + '&hl=' + (taal || 'en');
  return null;
}
