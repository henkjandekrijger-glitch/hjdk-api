// YOORS SHOP-LUS — betaald verkeer (PropellerAds + Mondiad) naar yoo.rs/shop, volledig lerend. Draait op Vercel, los van Claude-account en laptop.
//   /shop  en  /shop/<product>   landingspagina: meet per advertentieplek, advertentie en product wie aankomt, wie een echt mens is, wie blijft en wie doorklikt
//   /api/shop/uit                doorklik naar yoo.rs/shop: telt, en meldt de conversie aan het advertentienetwerk (postback)
//   /api/shop/b                  tellers vanaf de landingspagina (echt mens, gebleven)
//   /api/shop/px                 pixel voor de shop zelf (winkelwagen / aankoop), zodat de lus op echte bestellingen leert
//   /api/shop/img                advertentiebeeld per product (icoon 192x192, Mondiad 720x360, PropellerAds 492x328)
//   /api/shop/ronde              de leerronde (cron elk uur van 07 tot 23 uur NL; ?droog=1 = alleen rekenen)
//   /api/shop/voorpa             gegevens voor de PropellerAds-lus (project propellerads-mcp): advertenties, tellers per plek en advertentie
//   /api/shop/palog              de PropellerAds-lus meldt hier wat hij deed
//   /api/shop/overzicht?k=...    leerlus-overzicht in gewone taal (alleen-lezen, deelbaar; eenmalig aanmaken met ?maak=1)
//   /api/shop/briefing?k=...     briefing voor Babita: wat de shop moet teruggeven, met de actuele stand per punt
//   /api/shop/babita?k=...       het PHP-bestand waarmee de shop winkelwagen en bestellingen terugmeldt
//   /api/shop/maakmd             (met sleutel) maakt een Mondiad-campagne voor een thema
// Wat hij leert, elk uur:
//   1. Producten: welke producten doorkliks (en straks bestellingen) geven. Die komen bovenaan de landingspagina en krijgen nieuwe advertenties; seizoen telt mee.
//   2. Advertentieplekken: nep, geen echte mensen of nooit een doorklik -> uitgesloten in alle shop-campagnes van dat netwerk.
//   3. Advertenties: zwakke teksten uit, elke dag nieuwe teksten voor de best lopende producten (Claude), prijs in de tekst klopt niet meer -> uit.
//   4. Bod en budget: te weinig verkeer bij goede kwaliteit -> bod omhoog; geld weg zonder doorkliks -> campagne stil.
import sharp from 'sharp';
import { randomBytes, createHash } from 'node:crypto';
import { kv } from '../lib/db.js';
import { md } from '../lib/mdmcp.js';
import { look } from '../lib/look.js';
import seed from '../data/shop-seed.json' with { type: 'json' };
import { SHOP_PHP } from '../lib/shopphp.js';

const LAND = () => (process.env.SHOP_LAND || 'https://keuzehulp.best').replace(/\/$/, '');
const SHOP = 'https://yoo.rs/shop';
const PB = { pa: 'https://ad.propellerads.com/conversion.php?aid=3772727&pid=&tid=151850&visitor_id={clickid}', md: 'https://postback.mondiad.com/track?uid=31070&clickid={clickid}', ra: 'https://us.ahows.co/log?action=conversion&key={clickid}' };
// Clickadu: de terugmeldlink staat per account in Clickadu (Tracking). Zet hem in SHOP_PB_CLICKADU met {clickid} op de plek van de klik-id.
if (/^https:\/\/\S+\{clickid\}/.test(process.env.SHOP_PB_CLICKADU || '')) PB.ca = process.env.SHOP_PB_CLICKADU.trim();
const NETTEN = { md: 'Mondiad', pa: 'PropellerAds', ra: 'RichAds', ca: 'Clickadu', x: 'Overig' };
const netVan = src => /mondiad/.test(src) ? 'md' : /propeller/.test(src) ? 'pa' : /richads/.test(src) ? 'ra' : /clickadu/.test(src) ? 'ca' : 'x';
const plekId = s => { s = String(s || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase().slice(0, 40); return /^(zoneid|siteid|publisherid|sourceid)$/.test(s) ? '' : s; }; // Mondiad en PropellerAds: cijfers; RichAds: site-id van 32 tekens
const NAAM = 'SHOP-LUS'; // elke campagne met dit in de naam hoort bij de lus
const ACC = { acc: '#1e3a8a', acc2: '#e8edfb', accD: '#a5b4fc', acc2D: '#161b33' };
const E = (k, d) => { const v = Number(process.env[k]); return Number.isFinite(v) && v > 0 ? v : d; };
const MD_MAX_BOD = () => E('SHOP_MD_MAX_BOD', 0.05), MD_BIJVUL = () => E('SHOP_MD_BIJVUL', 10), MIN_SALDO = () => E('SHOP_MIN_SALDO', 5), NIEUWE_ADS_PER_DAG = () => E('SHOP_NIEUWE_ADS', 2), MAX_ADS_PER_CAMPAGNE = () => E('SHOP_MAX_ADS', 10), LEK = () => E('SHOP_LEK', 2);
const K = { cat: 'hjdk:shop:cat', ads: 'hjdk:shop:ads', top: 'hjdk:shop:top', crmap: 'hjdk:shop:crmap', log: 'hjdk:shop:log', palog: 'hjdk:shop:palog', ralog: 'hjdk:shop:ralog', calog: 'hjdk:shop:calog', laatste: 'hjdk:shop:laatste', lessen: 'hjdk:shop:lessen', zwart: n => 'hjdk:shop:zwart:' + n, lock: 'hjdk:shop:lock', dag: d => 'hjdk:shop:dag:' + d, snap: d => 'hjdk:shop:snap:' + d, rec: c => 'hjdk:shc:' + c, sleutel: 'hjdk:shop:sleutel', statuskey: 'hjdk:shop:statuskey', set: (s, n) => 'hjdk:shop:set:' + s + (n ? ':' + n : ''), hll: (n, z) => 'hjdk:shop:hll:' + n + ':' + z };
const DAY = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const D8 = () => DAY().replace(/-/g, '');
const nlUur = t => { try { return String(new Date(t || Date.now()).toLocaleString('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hour12: false })).slice(0, 2).padStart(2, '0'); } catch (e) { return String(new Date().getUTCHours()).padStart(2, '0'); } };
const num = v => Number(v) || 0;
const r4 = x => Math.round(x * 10000) / 10000;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = v => '€' + (Number.isInteger(Number(v)) ? String(Number(v)) : Number(v).toFixed(2).replace('.', ','));
const rows = r => Array.isArray(r) ? r : (r && (r.data || r.items || r.rows)) || [];
const pidOk = s => { s = String(s || ''); return /^[A-Za-z0-9_-]{3,64}$/.test(s) ? s : ''; };
const pk = pid => String(pid).toLowerCase().replace(/[^a-z0-9]/g, ''); // product-id als tellersleutel
const digits = (s, n = 14) => String(s || '').replace(/\D/g, '').slice(0, n);
const isBot = ua => /bot|crawl|spider|slurp|headless|preview|facebookexternalhit|python|curl|wget|monitor|lighthouse|pingdom/i.test(String(ua || ''));
function shortId(s) { let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 16777619) >>> 0; h2 = Math.imul(h2 + ch, 2246822519) >>> 0; } return (h1.toString(36) + h2.toString(36)).slice(0, 12); }
const inc = async keys => { try { if (keys.length) await kv.incrMany(keys.map(k => ['c:' + k, 1])); } catch (e) {} };
const sadd = async (key, ...members) => { const m = members.filter(Boolean).map(String); if (!m.length) return; try { await kv.raw(['SADD', key, ...m]); } catch (e) {} };
const smembers = async key => { try { return (await kv.raw(['SMEMBERS', key])) || []; } catch (e) { return []; } };
async function log(e) { try { const l = (await kv.get(K.log)) || []; l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set(K.log, l.slice(0, 500)); } catch (x) {} }
let OIDC = '';

// ---------------- catalogus ----------------
let CAT = null, CAT_AT = 0;
const compactBasis = x => ({ id: String(x.id), t: String(x.title || '').trim(), p: num(x.price), pf: !!x.price_from, op: x.original_price ? num(x.original_price) : 0, b: String(x.brand || '').trim(), c: String(x.shop_category || ''), s: String(x.shop_sub || ''), img: String(((x.photos || [])[0] || {}).src || '').split('?')[0], v: num(x.views), f: num(x.favourites), sc: num(x.score), l: num(x.launched_at), r: num(x.rating), rc: num(x.rating_count), fs: !!x.free_shipping });
// Velden die de shop er op verzoek bij levert (zie /api/shop/briefing). Ontbreekt een veld, dan blijft het weg en rekent de lus zonder.
// Openbaar: in_stock, delivery_days, shipping_cost. Afgeschermd (alleen met header X-Lus-Key): sold_7d, sold_30d, cart_7d, margin of cost_price.
const VELDEN = [['vr', 'in_stock'], ['lt', 'delivery_days'], ['vk', 'shipping_cost'], ['so7', 'sold_7d'], ['so30', 'sold_30d'], ['ca7', 'cart_7d'], ['mg', 'margin']];
const compact = x => { const o = compactBasis(x); if (x.in_stock != null) o.vr = !(x.in_stock === false || x.in_stock === 0 || x.in_stock === '0' || x.in_stock === 'false'); if (x.delivery_days != null) o.lt = num(x.delivery_days); if (x.shipping_cost != null) o.vk = num(x.shipping_cost); if (x.sold_7d != null) o.so7 = num(x.sold_7d); if (x.sold_30d != null) o.so30 = num(x.sold_30d); if (x.cart_7d != null) o.ca7 = num(x.cart_7d); const mg = x.margin != null ? num(x.margin) : x.cost_price != null ? num(x.price) - num(x.cost_price) : null; if (mg != null) o.mg = Math.round(mg * 100) / 100; return o; };
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const shopKop = () => Object.assign({ 'user-agent': UA, accept: 'application/json', 'accept-language': 'nl-NL,nl;q=0.9' }, process.env.SHOP_FEED_KEY ? { 'x-lus-key': process.env.SHOP_FEED_KEY } : {});
async function catalog(vers) {
  if (!vers && CAT && Date.now() - CAT_AT < 300000) return CAT;
  let c = null; try { c = await kv.get(K.cat); } catch (e) {}
  if (!c || !Array.isArray(c.items) || !c.items.length) c = { at: 0, items: seed.items.map(i => Object.assign({ v: 0, f: 0, sc: 0, l: 0 }, i)), terugval: true };
  CAT = c; CAT_AT = Date.now(); return c;
}
async function bewaarCatalogus(items, bron, extra) {
  const c = Object.assign({ at: Date.now(), bron, items }, extra || {}); await kv.set(K.cat, c); CAT = c; CAT_AT = Date.now();
  try { if (!(await kv.get(K.snap(DAY())))) { const s = {}; items.forEach(i => { if (i.v || i.f) s[i.id] = [i.v, i.f]; }); await kv.set(K.snap(DAY()), s, { ex: 40 * 86400 }); } } catch (e) {}
  return c;
}
async function sync() { // de shop zelf vertelt wat er te koop is, wat het kost en wat bekeken/bewaard wordt
  const items = []; let off = 0;
  for (let i = 0; i < 80; i++) {
    const r = await fetch(SHOP + '/api/shop?lang=nl&offset=' + off, { headers: shopKop() });
    if (!r.ok) throw new Error('shop gaf HTTP ' + r.status);
    const j = await r.json(); const l = j.items || []; l.forEach(x => items.push(compact(x)));
    if (j.next == null || !l.length) break; off = j.next;
  }
  if (items.length < 10) throw new Error('shop gaf maar ' + items.length + ' producten');
  // wat staat er al van de briefing? (voor de vinkjes op /api/shop/briefing)
  const velden = {}; for (const [k, n] of VELDEN) velden[n] = items.filter(i => i[k] !== undefined).length;
  let devKnop = null; try { const h = await (await fetch(SHOP, { headers: { 'user-agent': UA, 'accept-language': 'nl-NL,nl;q=0.9' } })).text(); devKnop = h.includes('sh-dev-add'); } catch (e) {}
  let zoek = null; try { const r = await fetch(SHOP + '/api/search-terms?days=7', { headers: shopKop() }); if (r.ok) { const j = await r.json(); const l = Array.isArray(j) ? j : (j.items || j.terms || []); zoek = l.map(x => ({ t: String(x.term || x.q || '').toLowerCase().trim().slice(0, 60), n: num(x.count), r: x.results == null ? null : num(x.results) })).filter(x => x.t).slice(0, 50); } } catch (e) {}
  return bewaarCatalogus(items, 'shop', { velden, devKnop, zoek, engels: items.filter(i => engels(i.t)).length });
}
async function geheim() { let s = process.env.SHOP_SLEUTEL || ''; if (!s) { try { s = (await kv.get(K.sleutel)) || ''; } catch (e) {} } return String(s || ''); }

// ---------------- thema's en rangorde ----------------
const mmdd = () => new Date().toISOString().slice(5, 10);
const inSeizoen = t => { const n = mmdd(); return t.van <= t.tot ? n >= t.van && n <= t.tot : n >= t.van || n <= t.tot; };
function themaVan(it) { const s = (it.t + ' ' + it.s + ' ' + it.c).toLowerCase(); for (const [naam, t] of Object.entries(seed.themas)) if (t.woorden.some(w => s.includes(w))) return naam; return it.c || 'overig'; }
function seizoen(it) { const s = (it.t + ' ' + it.s).toLowerCase(); let f = 1; for (const t of Object.values(seed.themas)) if (t.woorden.some(w => s.includes(w))) f = Math.max(f, inSeizoen(t) ? t.extra : (t.extra > 1.4 ? 0.4 : 1)); return f; } // buiten het seizoen zakt een seizoensproduct weg
const engels = t => / (for|with|by|and|the|of|from) /i.test(' ' + t + ' ') && !/ (voor|met|van|en|de|het|op|uit|om) /i.test(' ' + t + ' '); // een deel van de shop is nog niet vertaald; die producten zetten we niet vooraan op een Nederlandse pagina
function gam(k) { let s = 0; const n = Math.max(1, Math.round(k)); for (let i = 0; i < n; i++) s += -Math.log(1 - Math.random()); return s * (k / n); }
const beta = (a, b) => { const x = gam(a), y = gam(b); return x / (x + y); };
async function productTellers(pids) { const KS = ['himp', 'hklik', 'imp', 'klik', 'cart', 'koop']; const out = {}; if (!pids.length) return out; const keys = []; pids.forEach(p => KS.forEach(s => keys.push('c:sh-p-' + pk(p) + '-' + s))); const vals = []; for (let i = 0; i < keys.length; i += 480) vals.push(...await kv.mget(...keys.slice(i, i + 480))); pids.forEach((p, i) => { const o = {}; KS.forEach((s, j) => { o[s] = num(vals[i * KS.length + j]); }); out[p] = o; }); return out; }
// Rangorde: eigen doorkliks (Thompson, zodat nieuwe producten ook een kans krijgen) x seizoen x wat de shop zelf ziet (bekeken, bewaard, verkocht) x marge x waar bezoekers op zoeken x startset.
async function rangorde(cat, vast) {
  const start = new Set(seed.ads.map(a => a.pid)); let gisteren = {}; try { gisteren = (await kv.get(K.snap(DAY(-1)))) || {}; } catch (e) {}
  const kand = cat.items.filter(i => i.img && i.p >= 8 && i.p <= 150 && i.vr !== false); // uitverkocht komt niet vooraan
  const zoek = (cat.zoek || []).filter(z => z.t.length >= 4 && z.n >= 2).slice(0, 25).map(z => z.t);
  const gezien = new Set(await smembers(K.set('p'))); const tel = await productTellers(kand.filter(i => gezien.has(i.id)).map(i => i.id));
  return kand.map(i => { const u = tel[i.id] || { himp: 0, hklik: 0, imp: 0, klik: 0, cart: 0, koop: 0 }; const g = gisteren[i.id] || [i.v, i.f];
    const n = u.himp + 0.3 * u.imp, k = u.hklik + u.klik + 3 * u.cart + 12 * u.koop;
    const ctr = vast ? (k + 2) / (n + 26) : beta(k + 2, Math.max(0, n - Math.min(n, u.hklik + u.klik)) + 24); // voorkennis: ~8% klikt door; pas met echte bezoekers verschuift de volgorde
    const shop = 1 + 0.25 * Math.min(8, i.f) + 0.03 * Math.min(40, i.v) + 0.4 * Math.max(0, i.f - g[1]) + 0.05 * Math.max(0, i.v - g[0]) + 0.6 * Math.min(8, num(i.so7)) + 0.1 * Math.min(20, num(i.so30)) + 0.15 * Math.min(12, num(i.ca7)); // wat de shop zelf ziet: bewaard, bekeken, verkocht, in winkelwagen
    const marge = i.mg == null ? 1 : Math.max(0.4, Math.min(2, i.mg / 8)); const tl = i.t.toLowerCase(); const gezocht = zoek.some(z => tl.includes(z));
    const sz = seizoen(i), en = engels(i.t); return { id: i.id, score: ctr * sz * shop * marge * (gezocht ? 1.3 : 1) * (start.has(i.id) ? 1.6 : 1) * (i.p <= 50 ? 1.15 : 1) * (en ? 0.35 : 1), n: Math.round(n), k, thema: themaVan(i), reden: !en && (sz > 1 || i.f > 0 || k > 0 || num(i.so7) > 0 || gezocht) }; }).sort((a, b) => b.score - a.score);
}

// ---------------- Claude voor advertentieteksten (Vercel AI Gateway met het OIDC-token van dit project; anders eigen sleutel; anders sjabloon) ----------------
async function claudeJson(prompt) {
  const oidc = process.env.VERCEL_OIDC_TOKEN || OIDC; const key = process.env.ANTHROPIC_API_KEY;
  const tries = oidc ? ['anthropic/claude-sonnet-5.5', 'anthropic/claude-sonnet-5', 'anthropic/claude-sonnet-4.5'].map(m => ({ url: 'https://ai-gateway.vercel.sh/v1/messages', h: { authorization: 'Bearer ' + oidc }, m })) : key ? [{ url: 'https://api.anthropic.com/v1/messages', h: { 'x-api-key': key }, m: 'claude-sonnet-4-5' }] : [];
  for (const t of tries) { try { const r = await fetch(t.url, { method: 'POST', headers: Object.assign({ 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, t.h), body: JSON.stringify({ model: t.m, max_tokens: 900, thinking: { type: 'disabled' }, messages: [{ role: 'user', content: prompt }] }) }); const j = await r.json().catch(() => ({})); if (r.ok) { const s = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join(''); const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a >= 0) return JSON.parse(s.slice(a, b + 1)); } } catch (e) {} }
  return null;
}
const kortTitel = it => { let t = it.t.replace(/\s+(van|by|door)\s+[A-Z][\w .&-]+$/, '').replace(/\s+(Art Bizniz|Mica Decorations|Soeji|Housevitamin|Label2X)\b.*$/i, '').replace(/\s+\d+([.,]\d+)?\s?x\s?\d+.*$/i, '').trim(); if (t.length > 30) t = t.slice(0, 31).replace(/\s+\S*$/, ''); return t; };
async function nieuweTekst(it, beste, bestaand) {
  const j = await claudeJson(`Schrijf 3 Nederlandse push-advertenties voor dit product uit de Yoors Shop (webshop, verzonden vanuit Europa, 14 dagen retour): "${it.t}" van ${it.b || 'onbekend merk'}, ${eur(it.p)}${it.pf ? ' (vanaf-prijs)' : ''}, categorie ${it.c}/${it.s}. Vandaag is het ${DAY()}.
Wat tot nu toe het meest doorklikte naar de shop: ${beste.length ? beste.map(b => '"' + b.title + '" / "' + b.desc + '"').join('; ') : 'nog niets bekend'}.
Regels: titel hooguit 30 tekens, tekst hooguit 40 tekens. Eerlijk: verzin geen eigenschappen die niet in de productnaam staan, geen nep-urgentie, geen 'gratis', geen korting noemen. Noem de prijs alleen exact zoals hierboven. Concreet en nieuwsgierig makend, elke variant een andere invalshoek (cadeau, seizoen of moment, zelf doen, sfeer in huis). Gewone spreektaal, geen uitroeptekens. Antwoord alleen JSON: {"varianten":[{"title":"","desc":""}]}`);
  const al = new Set(bestaand.map(a => a.title.toLowerCase()));
  const v = (j && Array.isArray(j.varianten) ? j.varianten : []).map(x => ({ title: String(x.title || '').trim(), desc: String(x.desc || x.description || '').trim() })).filter(x => x.title && x.desc && x.title.length <= 30 && x.desc.length <= 40 && !al.has(x.title.toLowerCase()));
  if (v.length) return Object.assign({ bron: 'claude' }, v[0]);
  const t = kortTitel(it); return al.has(t.toLowerCase()) ? null : { title: t, desc: ('Nu in de Yoors Shop voor ' + eur(it.p)).slice(0, 40), bron: 'sjabloon' };
}
async function advertenties() { let a = null; try { a = await kv.get(K.ads); } catch (e) {} if (!Array.isArray(a) || !a.length) { a = seed.ads.map(x => Object.assign({ at: Date.now(), bron: 'start' }, x)); try { await kv.set(K.ads, a); } catch (e) {} }
  let ver = false; for (const s of seed.ads) { const x = a.find(q => q.pid === s.pid && q.title === s.title); if (!x) { a.push(Object.assign({ at: Date.now(), bron: 'start' }, s)); ver = true; } else if (x.bron === 'start' && x.desc !== s.desc) { x.desc = s.desc; ver = true; } } // startteksten volgen het bestand (PropellerAds: tekst hooguit 40 tekens)
  if (ver) { try { await kv.set(K.ads, a); } catch (e) {} } return a; }
const prijsInTekst = a => { const m = (a.title + ' ' + a.desc).match(/€\s?(\d+(?:[.,]\d{1,2})?)/); return m ? Number(m[1].replace(',', '.')) : null; };
const beeld = (pid, t) => LAND() + '/api/shop/img?p=' + encodeURIComponent(pid) + '&t=' + t;

// ---------------- tellers per netwerk ----------------
const SOORTEN = ['view', 'mens', 'eng', 'klik', 'conv', 'cart', 'koop', 'omzet'];
async function tellers(net, soort, ids) { const out = {}; if (!ids.length) return out; const keys = []; ids.forEach(z => SOORTEN.forEach(s => keys.push('c:sh-' + net + '-' + soort + z + '-' + s))); const vals = []; for (let i = 0; i < keys.length; i += 490) vals.push(...await kv.mget(...keys.slice(i, i + 490))); ids.forEach((z, i) => { const o = {}; SOORTEN.forEach((s, j) => { o[s] = num(vals[i * SOORTEN.length + j]); }); out[z] = o; }); return out; }
// Aantal verschillende apparaten per plek (alleen voor plekken met genoeg bezoekers). Zet het in o.uniek.
async function metUniek(net, zones) { for (const [z, o] of Object.entries(zones)) { if (num(o.view) < 20) continue; try { const n = num(await kv.raw(['PFCOUNT', K.hll(net, z)])); if (n > 0) { o.uniek = n; o.uniekVan = num(await kv.get('c:sh-' + net + '-z' + z + '-hv')) || 0; } } catch (e) {} } return zones; }
async function dagTotaal(dag) { const nets = ['md', 'pa', 'ra', 'ca', 'x']; const keys = []; nets.forEach(n => SOORTEN.forEach(s => keys.push('c:sh-d' + dag.replace(/-/g, '') + '-' + n + '-' + s))); const v = await kv.mget(...keys); const out = {}; nets.forEach((n, i) => { out[n] = {}; SOORTEN.forEach((s, j) => { out[n][s] = num(v[i * SOORTEN.length + j]); }); }); return out; }
// Oordeel over een advertentieplek. netKliks = kliks volgens het netwerk, o = onze eigen tellers.
function plekOordeel(netKliks, o, gemKlik) {
  if (netKliks >= 15 && o.view < 0.4 * netKliks) return { uit: `nep: ${netKliks} kliks volgens het netwerk, maar ${o.view} kwamen aan` };
  if (o.view >= 12 && o.mens < 0.25 * o.view) return { uit: `geen echte mensen: van ${o.view} bezoekers bewogen er maar ${o.mens}` };
  if (o.view >= 6 && o.mens === 0) return { uit: `geen echte mensen: ${o.view} bezoekers en niemand bewoog of tikte` };
  if (num(o.uniekVan) >= 30 && num(o.uniek) > 0 && o.uniek < 0.34 * o.uniekVan) return { uit: `steeds dezelfde apparaten: ${o.uniekVan} bezoeken vanaf ${o.uniek} apparaten` };
  if (o.view >= 40 && o.klik === 0 && o.eng <= 1) return { uit: `${o.view} bezoekers, niemand bleef en niemand klikte door naar de shop` };
  if (o.view >= 120 && o.klik === 0) return { uit: `${o.view} bezoekers en geen enkele doorklik` };
  const rate = o.view ? o.klik / o.view : 0;
  if (o.koop > 0) return { goed: 2 }; if (o.view >= 25 && o.klik >= 3 && rate >= 1.5 * gemKlik) return { goed: 1.5 }; if (o.view >= 25 && o.mens >= 0.6 * o.view && o.eng >= 0.3 * o.view) return { goed: 1.25 };
  return {};
}

// ---------------- de leerronde ----------------
async function ronde(droog) {
  const besluiten = []; const B = (soort, wat, waarom) => besluiten.push({ soort, wat, waarom });
  // 1. catalogus verversen
  let cat; try { cat = droog ? await catalog(true) : await sync(); } catch (e) { cat = await catalog(true); const oud = cat.at ? Math.round((Date.now() - cat.at) / 36e5) : null; if (oud === null || oud >= 6) B('let op', 'shop-catalogus niet ververst', String(e.message).slice(0, 120) + (oud === null ? ' (ik werk met de startset)' : ` (laatste versie is ${oud} uur oud)`)); }
  const perId = {}; cat.items.forEach(i => { perId[i.id] = i; });
  const vandaag = (await kv.get(K.dag(DAY()))) || { nieuweAds: 0, mdAds: {}, bod: {}, vul: {} };
  // 2. advertenties: prijs of product veranderd -> uit; rangorde; nieuwe teksten voor de beste producten
  let ads = await advertenties(); let adsVer = false;
  for (const a of ads) { if (a.uit) continue; const it = perId[a.pid]; const pr = prijsInTekst(a);
    if (!it && !cat.terugval) { a.uit = 'product niet meer in de shop'; adsVer = true; B('advertentie uit', a.title, a.uit); }
    else if (it && pr != null && Math.abs(pr - it.p) > 0.005) { a.uit = `prijs is nu ${eur(it.p)}, in de tekst staat ${eur(pr)}`; adsVer = true; B('advertentie uit', a.title, a.uit); } }
  const rang = await rangorde(cat, false); const vastRang = await rangorde(cat, true);
  const top = rang.slice(0, 40).map(r => r.id);
  const metAd = new Set(ads.filter(a => !a.uit).map(a => a.pid));
  const crPa = await tellers('pa', 'a', await smembers(K.set('a', 'pa'))), crMd = await tellers('md', 'a', await smembers(K.set('a', 'md'))), crRa = await tellers('ra', 'a', await smembers(K.set('a', 'ra'))), crCa = await tellers('ca', 'a', await smembers(K.set('a', 'ca')));
  const crmap = (await kv.get(K.crmap)) || {};
  const adScore = a => { let v = 0, k = 0; for (const [key, pid] of Object.entries(crmap)) { if (pid !== a.pid || key.startsWith('t:')) continue; const [n, id] = key.split(':'); const o = (n === 'pa' ? crPa : n === 'ra' ? crRa : n === 'ca' ? crCa : crMd)[id]; if (o && crmap['t:' + key] === a.title) { v += o.view; k += o.klik; } } return { v, k, r: (k + 0.5) / (v + 10) }; };
  const besteAds = ads.filter(a => !a.uit).map(a => Object.assign({}, a, adScore(a))).filter(a => a.v >= 20).sort((a, b) => b.r - a.r).slice(0, 3);
  if (!cat.terugval) { let ruimte = NIEUWE_ADS_PER_DAG() - num(vandaag.nieuweAds);
    // eerst: een tweede tekst voor het product dat het best doorklikt; dan: het beste product dat nog geen advertentie heeft
    const kand = []; const besteMetData = vastRang.find(r => r.k >= 3 && metAd.has(r.id) && ads.filter(a => a.pid === r.id && !a.uit).length < 3); if (besteMetData) kand.push(besteMetData.id);
    rang.filter(r => !metAd.has(r.id) && r.reden).slice(0, 4).forEach(r => kand.push(r.id)); // alleen producten met een reden: in het seizoen, bewaard in de shop of al doorkliks
    for (const pid of kand) { if (ruimte <= 0) break; const it = perId[pid]; const t = droog ? { title: kortTitel(it), desc: 'Nu in de Yoors Shop voor ' + eur(it.p), bron: 'droog' } : await nieuweTekst(it, besteAds, ads); if (!t) continue;
      ads.push({ pid, title: t.title, desc: t.desc, at: Date.now(), bron: t.bron }); metAd.add(pid); adsVer = true; ruimte--; vandaag.nieuweAds = num(vandaag.nieuweAds) + 1; B('nieuwe advertentie', it.t.slice(0, 60), `"${t.title}" / "${t.desc}"`); } }
  if (adsVer && !droog) await kv.set(K.ads, ads.slice(-200));
  if (!droog) await kv.set(K.top, { at: Date.now(), ids: top, thema: Object.fromEntries(rang.slice(0, 120).map(r => [r.id, r.thema])) });
  // 3. Mondiad
  let saldo = null, mdCamps = [], mdFout = '';
  try {
    const acc = await md('mondiad_get_current_account', {}); saldo = num(acc && acc.account && acc.account.accountBalance);
    mdCamps = rows(await md('mondiad_list_campaigns', { name: NAAM, size: 100, excludeStatuses: ['ARCHIVED', 'ARCHIVED_COMPLETED'], responseFields: ['ID', 'NAME', 'STATUS', 'BID', 'BID_TYPE', 'DAILY_BUDGET', 'BUDGET', 'REMAINING', 'URL', 'CLICKS', 'SPENT', 'CONVERSIONS', 'IMPRESSIONS'] })).filter(c => String(c.name || '').includes(NAAM));
    const zMd = {}, per = {}; const van = DAY(-6), tot = DAY();
    for (const c of mdCamps) { const pc = per[c.id] = { c, zones: {}, cr: {}, kliks: 0, kosten: 0, vandaag: { kliks: 0, kosten: 0 } };
      try { for (const r of rows(await md('mondiad_campaign_report', { startDate: van, endDate: tot, breakdown: 'ZONE_ID', campaignId: c.id, size: 500 }))) { const z = String(r.zoneId); const x = pc.zones[z] || (pc.zones[z] = { kliks: 0, vert: 0, kosten: 0 }); x.kliks += num(r.clicks); x.vert += num(r.impressions); x.kosten += num(r.spent); pc.kliks += num(r.clicks); pc.kosten += num(r.spent); const g = zMd[z] || (zMd[z] = { kliks: 0, vert: 0, kosten: 0 }); g.kliks += num(r.clicks); g.vert += num(r.impressions); g.kosten += num(r.spent); } } catch (e) { B('fout', 'Mondiad zones ' + c.id, String(e.message).slice(0, 120)); }
      try { for (const r of rows(await md('mondiad_campaign_report', { startDate: van, endDate: tot, breakdown: 'CREATIVE_ID', campaignId: c.id, size: 100 }))) { const id = String(r.creativeId || ''); if (id) pc.cr[id] = { kliks: num(r.clicks), vert: num(r.impressions) }; } } catch (e) {}
      try { for (const r of rows(await md('mondiad_campaign_report', { startDate: tot, endDate: tot, breakdown: 'DATE', campaignId: c.id, size: 5 }))) { pc.vandaag.kliks += num(r.clicks); pc.vandaag.kosten += num(r.spent); } } catch (e) {} }
    const zs = [...new Set([...Object.keys(zMd), ...await smembers(K.set('z', 'md'))])]; const eigen = await metUniek('md', await tellers('md', 'z', zs));
    let tv = 0, tk = 0; zs.forEach(z => { tv += eigen[z].view; tk += eigen[z].klik; }); const gem = tv >= 30 ? tk / tv : 0.08;
    const zwart = new Set(((await kv.get(K.zwart('md'))) || []).map(String)); const goed = {}; let nieuwZwart = 0;
    for (const z of zs) { if (zwart.has(z)) continue; const o = plekOordeel((zMd[z] || {}).kliks || 0, eigen[z], gem); if (o.uit) { zwart.add(z); nieuwZwart++; B('plek uit (Mondiad)', z, o.uit); } else if (o.goed) goed[z] = o.goed; }
    const campTel = await tellers('md', 'k', mdCamps.map(c => String(c.id))); const loopt = (await kv.get('hjdk:shop:loopt')) || {};
    for (const pc of Object.values(per)) { const c = pc.c; let det = null; try { det = (rows(await md('mondiad_get_campaign_details', { ids: [String(c.id)] })) || [])[0]; } catch (e) {} if (!det) continue;
      const crs = det.creatives || []; for (const x of crs) { const a = ads.find(q => q.title === x.title && q.desc === x.description) || ads.find(q => q.title === x.title); if (a) { crmap['md:' + x.id] = a.pid; crmap['t:md:' + x.id] = a.title; } }
      if (/PAUSED|REJECTED|ARCHIVED|DRAFT/i.test(c.status)) continue;
      const eigenC = campTel[String(c.id)] || {}; const isCpa = String(c.bidType || det.bidType || '').toUpperCase() === 'CPA'; const bod = num(det.bid);
      // lek: vandaag geld uit, niemand klikt door naar de shop -> stilzetten
      if ((pc.vandaag.kosten >= LEK() && !num(eigenC.klik)) || (pc.kosten >= 3 * LEK() && pc.kosten / Math.max(1, num(eigenC.klik)) > 0.6)) { B('campagne stil (Mondiad)', c.id + ' ' + c.name.slice(0, 50), `$${pc.kosten.toFixed(2)} uitgegeven (vandaag $${pc.vandaag.kosten.toFixed(2)}) tegen ${num(eigenC.klik)} doorkliks naar de shop`); if (!droog) { try { await md('mondiad_update_campaign', { json: JSON.stringify({ id: c.id, status: 'PAUSED' }) }); } catch (e) { B('fout', 'stilzetten ' + c.id, String(e.message).slice(0, 120)); } } continue; }
      const upd = { id: c.id };
      const cur = new Set((det.zoneIdList || []).map(String)); const voeg = [...zwart].filter(z => !cur.has(z));
      if (!/white/i.test(det.zoneIdListMode || '') && voeg.length) { upd.zoneIdList = [...cur, ...voeg].map(Number).filter(Boolean); upd.zoneIdListMode = 'BLACK_LIST'; B('zwarte lijst (Mondiad)', String(c.id), '+' + voeg.length + ' plekken'); }
      if (!isCpa) { const zb = {}; (det.zoneCustomBids || []).forEach(x => { zb[String(x.zoneId)] = num(x.bid); }); let ver = false; for (const [z, f] of Object.entries(goed)) { if (!pc.zones[z]) continue; const nb = r4(Math.min(MD_MAX_BOD(), bod * f)); if (!zb[z] || zb[z] < nb) { zb[z] = nb; ver = true; B('goede plek hoger bod (Mondiad)', z, 'x' + f + ' -> $' + nb); } } for (const z of zwart) if (zb[z] != null) { delete zb[z]; ver = true; } if (ver) upd.zoneCustomBids = Object.entries(zb).map(([zoneId, b]) => ({ zoneId: Number(zoneId), bid: b })); }
      // te weinig verkeer: bod stap voor stap omhoog (hooguit 1x per dag), zolang wat binnenkomt echte mensen zijn
      if (/RUNNING/i.test(c.status) && !loopt[c.id]) loopt[c.id] = Date.now(); const uurLoopt = loopt[c.id] ? (Date.now() - loopt[c.id]) / 36e5 : 0; const kwaliteitOk = !eigenC.view || eigenC.view < 15 || eigenC.mens >= 0.4 * eigenC.view; // pas als hij 6 uur echt loopt en nog steeds bijna geen verkeer krijgt
      if (/RUNNING/i.test(c.status) && uurLoopt >= 6 && pc.vandaag.kliks < 15 && kwaliteitOk && bod < MD_MAX_BOD() && !vandaag.bod['md' + c.id] && new Date().getUTCHours() >= 9) { upd.bid = r4(Math.min(MD_MAX_BOD(), bod < 0.02 ? bod + 0.005 : bod * 1.25)); vandaag.bod['md' + c.id] = 1; B('bod omhoog (Mondiad)', String(c.id), `maar ${pc.vandaag.kliks} kliks vandaag; $${bod} -> $${upd.bid}`); }
      if (Object.keys(upd).length > 1 && !droog) { try { await md('mondiad_update_campaign', { json: JSON.stringify(upd) }); } catch (e) { B('fout', 'Mondiad bijwerken ' + c.id, String(e.message).slice(0, 160)); } }
      // advertenties: prijs klopt niet meer of zwak -> uit; nieuwe erbij uit de bibliotheek
      const actief = crs.filter(x => x.status === 'ACTIVE' || x.status === 'PENDING'); let n = actief.length;
      const stat = actief.map(x => { const s = pc.cr[String(x.id)] || { kliks: 0, vert: 0 }; const o = crMd[String(x.id)] || { view: 0, klik: 0 }; return Object.assign({}, x, s, { ctr: s.vert ? s.kliks / s.vert : 0, view: o.view, door: o.klik }); });
      for (const x of stat) { const a = ads.find(q => q.title === x.title); if (a && a.uit && n > 1) { n--; B('advertentie uit (Mondiad)', x.title, a.uit); if (!droog) { try { await md('mondiad_update_creative', { creative: JSON.stringify({ id: x.id, status: 'PAUSED' }) }); } catch (e) {} } } }
      const metVert = stat.filter(x => x.vert >= 1500).sort((a, b) => b.ctr - a.ctr); const besteDoor = Math.max(0, ...stat.filter(x => x.view >= 30).map(x => x.door / x.view));
      const zwak = stat.find(x => (metVert.length >= 3 && x.vert >= 4000 && x.ctr < 0.4 * metVert[0].ctr) || (x.view >= 60 && x.door === 0 && besteDoor >= 0.05));
      if (zwak && n > 3) { n--; B('zwakke advertentie uit (Mondiad)', zwak.title, zwak.view >= 60 && zwak.door === 0 ? `${zwak.view} bezoekers, niemand klikte door` : `weinig kliks: ${(zwak.ctr * 100).toFixed(2)}% tegen ${(metVert[0].ctr * 100).toFixed(2)}%`); if (!droog) { try { await md('mondiad_update_creative', { creative: JSON.stringify({ id: zwak.id, status: 'PAUSED' }) }); } catch (e) {} } }
      const th = (String(c.name).match(/thema=([a-z]+)/) || [])[1]; // campagne met thema=... in de naam krijgt alleen advertenties van dat thema
      const heeft = new Set(crs.map(x => x.title)); const nieuw = ads.filter(a => !a.uit && !heeft.has(a.title) && perId[a.pid] && !!perId[a.pid].img && (!th || themaVan(perId[a.pid]) === th)).sort((a, b) => top.indexOf(a.pid) - top.indexOf(b.pid)).filter(a => top.includes(a.pid));
      for (const a of nieuw) { if (n >= MAX_ADS_PER_CAMPAGNE() || num(vandaag.mdAds[c.id]) >= 2) break; B('advertentie erbij (Mondiad)', String(c.id), `"${a.title}" / "${a.desc}"`); n++; vandaag.mdAds[c.id] = num(vandaag.mdAds[c.id]) + 1;
        if (!droog) { try { const icon = findFile(await md('mondiad_upload_resource_from_url', { resourceType: 'ICON', sourceUrl: beeld(a.pid, 'icon'), fileName: 'sh-' + pk(a.pid).slice(-10) + '-i.jpg' })); const image = findFile(await md('mondiad_upload_resource_from_url', { resourceType: 'IMAGE', sourceUrl: beeld(a.pid, 'md'), fileName: 'sh-' + pk(a.pid).slice(-10) + '-b.jpg' })); if (!icon || !image) throw new Error('beeld uploaden mislukt'); await md('mondiad_create_creative', { creative: { campaignId: c.id, title: a.title, description: a.desc, icon, image, tag: 'sh-' + pk(a.pid).slice(-12), status: 'PENDING' } }); } catch (e) { B('fout', 'advertentie erbij ' + c.id, String(e.message).slice(0, 160)); } } }
    }
    // budget op bij een campagne die goed doorklikt: bijvullen (1x per dag)
    for (const pc of Object.values(per)) { const c = pc.c; if (!/FINISHED/i.test(c.status) || vandaag.vul['md' + c.id]) continue; const o = campTel[String(c.id)] || {}; if (o.view >= 30 && o.klik / o.view >= Math.max(0.04, 0.8 * gem) && saldo >= MIN_SALDO()) { const nb = Math.round((num(c.budget) + MD_BIJVUL()) * 100) / 100; B('budget bijgevuld (Mondiad)', String(c.id), `${o.klik} doorkliks op ${o.view} bezoekers; totaalbudget $${c.budget} -> $${nb}`); vandaag.vul['md' + c.id] = 1; if (!droog) { try { await md('mondiad_update_campaign', { json: JSON.stringify({ id: c.id, budget: nb }) }); } catch (e) { B('fout', 'bijvullen ' + c.id, String(e.message).slice(0, 120)); } } } }
    if (saldo != null && saldo < MIN_SALDO()) B('let op', 'Mondiad-saldo $' + saldo.toFixed(2), 'bijna op; bijstorten bij Mondiad');
    if (!droog) { await kv.set(K.zwart('md'), [...zwart]); await kv.set('hjdk:shop:loopt', loopt); }
    var mdSamen = { saldo, zwarteLijst: zwart.size, nieuwZwart, gemDoorklik: r4(gem), campagnes: Object.values(per).map(pc => ({ id: pc.c.id, naam: pc.c.name, status: pc.c.status, bod: pc.c.bid, soort: pc.c.bidType, kliks7d: pc.kliks, kosten7d: r4(pc.kosten), kliksVandaag: pc.vandaag.kliks, kostenVandaag: r4(pc.vandaag.kosten), eigen: campTel[String(pc.c.id)] || {} })) };
  } catch (e) { mdFout = String(e.message || e).slice(0, 200); B('fout', 'Mondiad', mdFout); }
  if (!droog) { await kv.set(K.crmap, crmap); await kv.set(K.dag(DAY()), vandaag, { ex: 3 * 86400 }); }
  let inz = null, les = null; try { inz = await inzichten(cat, ads, crmap); les = await lessen(inz, DAY(), droog); } catch (e) { B('fout', 'inzichten', String(e.message).slice(0, 120)); }
  const samen = { at: new Date().toISOString(), droog: !!droog, inzicht: inz, lessen: les ? les.lessen : [], catalogus: { producten: cat.items.length, ververst: cat.at ? new Date(cat.at).toISOString() : null, terugval: !!cat.terugval }, top: vastRang.slice(0, 12).map(r => ({ id: r.id, titel: (perId[r.id] || {}).t, prijs: (perId[r.id] || {}).p, getoond: r.n, doorkliks: r.k, thema: r.thema })), advertenties: ads.filter(a => !a.uit).length, mondiad: mdSamen || { fout: mdFout }, besluiten };
  if (!droog) { await kv.set(K.laatste, samen); for (const b of besluiten) await log(b); }
  return samen;
}
const findFile = o => { let hit = ''; const walk = x => { if (hit || x == null) return; if (typeof x === 'string') { if (/\.(png|jpe?g|webp|gif)$/i.test(x) && !/^https?:/i.test(x)) hit = x; return; } if (typeof x === 'object') for (const k of Object.keys(x)) walk(x[k]); }; walk(o); return hit; };


// ---------------- wat de lus leert (voor het overzicht) ----------------
async function inzichten(cat, ads, crmap) {
  const perId = {}; cat.items.forEach(i => { perId[i.id] = i; });
  const gezien = (await smembers(K.set('p'))).filter(id => perId[id]); const tel = await productTellers(gezien);
  const th = {}; const producten = [];
  for (const [id, u] of Object.entries(tel)) { const t = themaVan(perId[id]); const o = th[t] || (th[t] = { thema: t, naam: (seed.labels || {})[t] || t, bezoekers: 0, doorkliks: 0, winkelwagen: 0, bestellingen: 0 }); o.bezoekers += u.himp; o.doorkliks += u.hklik; o.winkelwagen += u.cart; o.bestellingen += u.koop;
    if (u.himp + u.imp > 0) producten.push({ id, titel: perId[id].t, prijs: perId[id].p, vooraan: u.himp, doorVooraan: u.hklik, inLijst: u.imp, doorLijst: u.klik, bestellingen: u.koop }); }
  const nets = ['md', 'pa', 'ra', 'ca']; const cr = {}; for (const n of nets) cr[n] = await tellers(n, 'a', await smembers(K.set('a', n)));
  const perAd = {}; for (const [key, titel] of Object.entries(crmap)) { if (!key.startsWith('t:')) continue; const [, n, id] = key.split(':'); const o = (cr[n] || {})[id]; if (!o) continue; const a = perAd[titel] || (perAd[titel] = { titel, tekst: (ads.find(q => q.title === titel) || {}).desc || '', bezoekers: 0, mensen: 0, bleven: 0, doorkliks: 0, bestellingen: 0, netwerken: {} }); a.bezoekers += o.view; a.mensen += o.mens; a.bleven += o.eng; a.doorkliks += o.klik; a.bestellingen += o.koop; if (o.view) a.netwerken[NETTEN[n]] = (a.netwerken[NETTEN[n]] || 0) + o.view; }
  const uk = []; for (let u = 0; u < 24; u++) { const hh = String(u).padStart(2, '0'); uk.push('c:sh-u' + hh + '-view', 'c:sh-u' + hh + '-klik'); } const uv = await kv.mget(...uk);
  const uren = []; for (let u = 0; u < 24; u++) if (num(uv[u * 2])) uren.push({ uur: u, bezoekers: num(uv[u * 2]), doorkliks: num(uv[u * 2 + 1]) });
  const plekken = {}; for (const n of nets) { const z = await tellers(n, 'z', await smembers(K.set('z', n))); plekken[n] = Object.entries(z).map(([plek, o]) => ({ plek, bezoekers: o.view, mensen: o.mens, bleven: o.eng, doorkliks: o.klik, bestellingen: o.koop })).filter(x => x.bezoekers >= 3).sort((a, b) => b.doorkliks - a.doorkliks || b.bezoekers - a.bezoekers).slice(0, 12); }
  const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : null;
  return { themas: Object.values(th).map(o => Object.assign(o, { doorklikPct: pct(o.doorkliks, o.bezoekers) })).sort((a, b) => b.doorkliks - a.doorkliks || b.bezoekers - a.bezoekers),
    advertenties: Object.values(perAd).map(a => Object.assign(a, { doorklikPct: pct(a.doorkliks, a.bezoekers), echtPct: pct(a.mensen, a.bezoekers) })).sort((a, b) => b.doorkliks - a.doorkliks || b.bezoekers - a.bezoekers).slice(0, 40),
    producten: producten.sort((a, b) => (b.doorVooraan + b.doorLijst) - (a.doorVooraan + a.doorLijst) || b.vooraan - a.vooraan).slice(0, 25), uren, plekken };
}
// Eens per dag: de cijfers in een paar zinnen gewone taal (Claude). Zonder genoeg bezoekers geen conclusies.
async function lessen(inz, dag, droog) {
  let oud = null; try { oud = await kv.get(K.lessen); } catch (e) {}
  const bezoekers = inz.themas.reduce((a, t) => a + t.bezoekers, 0);
  // Opnieuw schrijven zodra het beeld echt veranderd is (anderhalf keer zoveel bezoekers of doorkliks), en altijd nog een keer in de laatste ronde van de dag.
  const doorkliks = inz.themas.reduce((a, t) => a + t.doorkliks, 0);
  const slot = new Date().getUTCHours() >= 21 && oud && Date.now() - Date.parse(oud.at) > 45 * 60000;
  if (droog || bezoekers < 40 || (oud && oud.dag === DAY() && !slot && bezoekers < 1.5 * num(oud.bezoekers) && doorkliks < 1.5 * num(oud.doorkliks) + 5)) return oud;
  const plekTop = Object.entries(inz.plekken || {}).flatMap(([n, l]) => l.slice(0, 4).map(z => ({ netwerk: NETTEN[n], plek: z.plek, bezoekers: z.bezoekers, echteMensen: z.mensen, doorkliks: z.doorkliks })));
  const j = await claudeJson(`Je bent mediabuyer voor de Yoors Shop (Nederlandse webshop). Hieronder de cijfers van betaald push-verkeer via een landingspagina: per thema, per advertentie, per uur en per netwerk. "doorklik" = de bezoeker klikte door naar de productpagina in de shop. Schrijf hooguit 6 lessen in gewoon Nederlands, elk een zin van hooguit 25 woorden, concreet en met het getal erbij. Alleen wat de cijfers echt laten zien; bij minder dan 30 bezoekers op een regel trek je geen conclusie. Geen jargon, geen opsommingstekens, geen gedachtestreepjes. Komt het grootste deel van de doorkliks van een enkele advertentieplek, zeg dat dan eerlijk in een van de lessen: de cijfers per advertentie zijn dan minder betrouwbaar. Sluit af met een les over wat we hierna het best kunnen testen.
Cijfers: ${JSON.stringify({ vandaag: dag, totaalDoorkliks: doorkliks, plekken: plekTop, themas: inz.themas, advertenties: inz.advertenties.slice(0, 20).map(a => ({ titel: a.titel, tekst: a.tekst, bezoekers: a.bezoekers, echtPct: a.echtPct, doorkliks: a.doorkliks, bestellingen: a.bestellingen })), uren: inz.uren }).slice(0, 9000)}
Antwoord alleen JSON: {"lessen":["..."]}`);
  const l = (j && Array.isArray(j.lessen) ? j.lessen : []).map(x => String(x).trim()).filter(Boolean).slice(0, 6);
  if (!l.length) return oud; const nieuw = { dag: DAY(), at: new Date().toISOString(), bezoekers, doorkliks, lessen: l, eerder: [...(oud && oud.dag !== DAY() ? [{ dag: oud.dag, lessen: oud.lessen }] : []), ...((oud && oud.eerder) || [])].slice(0, 14) };
  try { await kv.set(K.lessen, nieuw); } catch (e) {} return nieuw;
}

// ---------------- een Mondiad-campagne maken voor een thema (de lus beheert hem daarna zelf) ----------------
const MD_UREN = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
async function maakMondiad(thema, formaat) {
  const push = formaat === 'push'; const cat = await catalog(true); const perId = {}; cat.items.forEach(i => { perId[i.id] = i; });
  const ads = (await advertenties()).filter(a => !a.uit && perId[a.pid] && perId[a.pid].img && themaVan(perId[a.pid]) === thema).slice(0, 6);
  if (ads.length < 2) throw new Error('te weinig advertenties voor thema ' + thema + ' (' + ads.length + ')');
  const naam = `${NAAM} thema=${thema} | ${(seed.labels || {})[thema] || thema} | NL mobiel | ${push ? 'Push' : 'IPP'} CPA 0.01 | ${new Date().getUTCDate()}${['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][new Date().getUTCMonth()]}`;
  const bestaand = rows(await md('mondiad_list_campaigns', { name: NAAM, size: 100, excludeStatuses: ['ARCHIVED', 'ARCHIVED_COMPLETED'], responseFields: ['ID', 'NAME', 'STATUS', 'AD_TYPE'] })).find(c => String(c.name).includes('thema=' + thema + ' ') && String(c.adType || '').includes(push ? 'CLASSIC_PUSH' : 'IN_PAGE_PUSH'));
  if (bestaand) return { bestaatAl: bestaand.id, naam: bestaand.name };
  const zwart = ((await kv.get(K.zwart('md'))) || []).map(Number).filter(Boolean); const start = [480, 896, 1953, 646, 583, 556, 270, 431, 751, 850, 1812, 277, 437, 533, 1977, 571, 733]; // plekken die bij eerdere yoo.rs-campagnes al afvielen
  const creatives = []; for (const a of ads) { const icon = findFile(await md('mondiad_upload_resource_from_url', { resourceType: 'ICON', sourceUrl: beeld(a.pid, 'icon'), fileName: 'sh-' + pk(a.pid).slice(-10) + '-i.jpg' })); const image = findFile(await md('mondiad_upload_resource_from_url', { resourceType: 'IMAGE', sourceUrl: beeld(a.pid, 'md'), fileName: 'sh-' + pk(a.pid).slice(-10) + '-b.jpg' })); if (icon && image) creatives.push({ title: a.title, description: a.desc, icon, image, tag: 'sh-' + pk(a.pid).slice(-14), status: 'PENDING' }); }
  if (creatives.length < 2) throw new Error('beelden uploaden mislukt');
  const dp = {}; ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(d => { dp[d] = MD_UREN; });
  const r = await md('mondiad_create_campaign', { campaign: { name: naam, adType: [push ? 'CLASSIC_PUSH' : 'IN_PAGE_PUSH'], bidType: 'CPA', bid: 0.01, cpaGoal: 0.01, budget: 15, dailyBudget: 10, zoneIdDailyBudget: 2, status: 'Pending', runAfterModeration: true,
    url: LAND() + '/shop?utm_source=mondiad&utm_medium=' + (push ? 'push' : 'ipp') + '&utm_campaign=shoplus-' + thema + '&clickid=[clickid]&zoneid=[zoneid]&campaignid=[campaignid]&creativeid=[creativeid]',
    countryTargeting: ['NL'], countryTargetingMode: 'WHITE_LIST', deviceTargeting: [4], deviceTargetingMode: 'WHITE_LIST', languageTargeting: [137], languageTargetingMode: 'WHITE_LIST', browserTargeting: [33, 36, 39, 15], browserTargetingMode: 'BLACK_LIST', browserTargetingMap: {}, trafficType: ['MAINSTREAM'], landingPageType: 'MAINSTREAM', connectionType: 'ALL',
    frequencyCap: { frequency: 1, duration: 24, actionType: 'IMPRESSION', actionScope: 'CAMPAIGN' }, dayPartingTimezone: 'Europe/Amsterdam', dayParting: dp, zoneIdListMode: 'BLACK_LIST', zoneIdList: [...new Set([...start, ...zwart])], hideReferrer: false, creatives } });
  const id = r && (r.id || (r.data && r.data.id)); await log({ soort: 'campagne gemaakt (Mondiad)', wat: naam, waarom: creatives.length + ' advertenties, wacht op goedkeuring' });
  return { id, naam, advertenties: creatives.length, status: r && r.status };
}

// ---------------- landingspagina ----------------
// Korte, niet-herleidbare vingerafdruk van het apparaat (adres + browser), alleen om te zien of dezelfde bezoeker steeds terugkomt.
const apparaat = req => { try { return createHash('sha1').update(String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() + '|' + String(req.headers['user-agent'] || '')).digest('hex').slice(0, 8); } catch (e) { return ''; } };
async function land(req, res, url) {
  const q = url.searchParams; const ua = req.headers['user-agent'] || ''; const bot = isBot(ua);
  const src = String(q.get('utm_source') || '').toLowerCase(); const net = netVan(src);
  let clickid = String(q.get('clickid') || '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 120); if (/^(subid|clickid|click_id|visitor_id)$/i.test(clickid)) clickid = '';
  const zone = plekId(q.get('zoneid')), cr = digits(q.get('creativeid')), camp = digits(q.get('campaignid'));
  const cat = await catalog(); const perId = {}; cat.items.forEach(i => { perId[i.id] = i; });
  let top = null; try { top = await kv.get(K.top); } catch (e) {} const topIds = (top && top.ids && top.ids.length ? top.ids : seed.ads.map(a => a.pid)).filter(id => perId[id] && perId[id].vr !== false);
  let pid = pidOk(q.get('p')); if (pid && (!perId[pid] || perId[pid].vr === false)) pid = '';
  if (!pid && cr && net !== 'x') { try { const m = (await kv.get(K.crmap)) || {}; if (perId[m[net + ':' + cr]] && perId[m[net + ':' + cr]].vr !== false) pid = m[net + ':' + cr]; } catch (e) {} }
  if (!pid) pid = topIds[0] || cat.items[0].id;
  const held = perId[pid]; const thema = (top && top.thema && top.thema[pid]) || themaVan(held);
  const zelfde = topIds.filter(id => id !== pid && ((top && top.thema && top.thema[id]) || themaVan(perId[id])) === thema).slice(0, 3);
  const meer = [...zelfde, ...topIds.filter(id => id !== pid && !zelfde.includes(id))].slice(0, 8).map(id => perId[id]);
  const code = clickid && net !== 'x' ? shortId(net + ':' + clickid) : '';
  if (!bot) {
    let nieuw = true; if (code) { try { nieuw = !(await kv.get(K.rec(code))); if (nieuw) await kv.set(K.rec(code), { c: clickid, s: net, z: zone, a: cr, k: camp, p: pid, at: Date.now(), h: apparaat(req) }, { ex: 7 * 86400 }); } catch (e) {} }
    if (nieuw) { const keys = ['sh-' + net + '-view', 'sh-d' + D8() + '-' + net + '-view', 'sh-u' + nlUur() + '-view', 'sh-p-' + pk(pid) + '-himp'].concat(meer.map(m => 'sh-p-' + pk(m.id) + '-imp'));
      if (zone) keys.push('sh-' + net + '-z' + zone + '-view'); if (cr) keys.push('sh-' + net + '-a' + cr + '-view'); if (camp) keys.push('sh-' + net + '-k' + camp + '-view');
      if (zone) { keys.push('sh-' + net + '-z' + zone + '-hv'); try { await kv.raw(['PFADD', K.hll(net, zone), apparaat(req)]); await kv.raw(['EXPIRE', K.hll(net, zone), String(30 * 86400)]); } catch (e) {} }
      await inc(keys); await sadd(K.set('p'), pid, ...meer.map(m => m.id)); if (zone) await sadd(K.set('z', net), zone); if (cr) await sadd(K.set('a', net), cr); if (camp) await sadd(K.set('k', net), camp); }
  }
  const uit = (id, pos) => '/api/shop/uit?p=' + encodeURIComponent(id) + (code ? '&c=' + code : '') + '&pos=' + pos;
  const kaart = (it, i) => `<a class="pc" href="${esc(uit(it.id, 'g' + (i + 1)))}"><img src="${esc(it.img)}" alt="" loading="lazy" width="460" height="460"><span class="pt">${esc(it.t)}</span><span class="pp">${it.pf ? 'vanaf ' : ''}${esc(eur(it.p))}</span></a>`;
  const titel = held.t + ' | Yoors Shop';
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(titel)}</title><link rel="preconnect" href="https://cdn.orderchamp.com">
<style>${look(ACC, { dark: false })}
.wrap{max-width:34rem}.topbar .wrap{height:54px}.tb{margin-left:auto;font-size:.875rem;color:var(--ink-3)}main{padding:14px 0 4px}
.hero-img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:14px;background:#f3f4f6}
.brand{font-size:.8125rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);font-weight:650;margin:16px 0 4px}
h1{font-size:1.5rem;line-height:1.2;margin:0 0 8px;letter-spacing:-.015em}.prijs{font-size:1.75rem;font-weight:750;margin:0 0 14px}.prijs small{font-size:1rem;font-weight:500;color:var(--ink-3)}
.koop{display:block;text-align:center;background:var(--ink);color:#fff;font-weight:700;font-size:1.125rem;padding:16px 18px;border-radius:12px;text-decoration:none}
.zeker{display:grid;gap:8px;margin:16px 0 0;padding:0;list-style:none;font-size:1rem;color:var(--ink-2)}.zeker li:before{content:"✓";color:#15803d;font-weight:800;margin-right:8px}
h2{font-size:1.25rem;margin:34px 0 12px}.pg{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pc{display:block;text-decoration:none;color:var(--ink);border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}.pc img{display:block;width:100%;height:auto;aspect-ratio:1/1;object-fit:cover;background:#f3f4f6}
.pt{display:block;padding:10px 12px 0;font-size:1rem;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pp{display:block;padding:4px 12px 12px;font-weight:750;font-size:1.0625rem}
.alles{display:block;text-align:center;margin:18px 0 0;padding:14px;border:1.5px solid var(--ink);border-radius:12px;color:var(--ink);font-weight:700;text-decoration:none}
footer{margin-top:34px}</style></head><body>
<header class="topbar"><div class="wrap"><a class="mark" href="${esc(uit(pid, 'logo'))}">Yoors <em>Shop</em></a><span class="tb">Verzonden vanuit Europa</span></div></header>
<main class="wrap">
<a href="${esc(uit(pid, 'h'))}"><img class="hero-img" src="${esc(held.img)}" alt="${esc(held.t)}" width="460" height="460"></a>
${held.b ? `<p class="brand">${esc(held.b)}</p>` : '<p class="brand">Yoors Shop</p>'}
<h1>${esc(held.t)}</h1>
<p class="prijs">${held.pf ? '<small>vanaf </small>' : ''}${esc(eur(held.p))}</p>
<a class="koop" href="${esc(uit(pid, 'h'))}">Bekijk in de shop</a>
<ul class="zeker"><li>14 dagen retourneren: niet tevreden, geld terug</li><li>Veilig betalen via PayPal</li><li>Verzonden vanuit Europa, met track &amp; trace</li>${held.lt ? `<li>Bezorgd in ${held.lt} ${held.lt === 1 ? 'werkdag' : 'werkdagen'}</li>` : ''}${held.vk === 0 ? '<li>Gratis verzending</li>' : held.vk ? `<li>Verzending ${esc(eur(held.vk))}</li>` : ''}</ul>
${meer.length ? `<h2>Ook populair vandaag</h2><div class="pg">${meer.map(kaart).join('')}</div>` : ''}
<a class="alles" href="${esc('/api/shop/uit?p=alles' + (code ? '&c=' + code : '') + '&pos=alles')}">Bekijk alle ${cat.items.length >= 100 ? cat.items.length + ' ' : ''}producten</a>
</main>
<footer><div class="wrap"><p>Dit is een selectie uit de Yoors Shop. Je bestelt en betaalt op yoo.rs/shop.</p><div class="fl"><a href="https://yoo.rs/shop/privacy">Privacy</a><a href="https://yoo.rs/shop/terms">Voorwaarden</a><a href="https://yoo.rs/shop/returns">Retourneren</a></div><p>Yoors Shop by AdsFair B.V. · KVK 60126035 · Gouda</p></div></footer>
<script>(function(){var C=${JSON.stringify(code)},t0=Date.now(),mens=false,eng=false,s=0;function b(e){try{navigator.sendBeacon('/api/shop/b',new Blob([JSON.stringify({c:C,e:e})],{type:'text/plain'}))}catch(x){}}
['scroll','touchstart','pointerdown','keydown','pointermove'].forEach(function(ev){addEventListener(ev,function(){if(!mens){mens=true;b('mens')}},{passive:true})});
var iv=setInterval(function(){if(document.visibilityState==='visible')s++;if(s>=15&&mens&&!eng){eng=true;clearInterval(iv);b('eng')}},1000);
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="/api/shop/uit"]');if(!a||a.dataset.k)return;a.dataset.k=1;a.href=a.getAttribute('href')+'&h='+(mens?1:0)+'&ms='+(Date.now()-t0)},true)})();</script>
</body></html>`;
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex, nofollow');
  return res.status(200).send(html);
}

async function uitgang(req, res, url) {
  const q = url.searchParams; const p = String(q.get('p') || ''); const code = String(q.get('c') || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); const pos = String(q.get('pos') || '').replace(/[^a-z0-9]/gi, '').slice(0, 6);
  const cat = await catalog(); const it = p === 'alles' ? null : cat.items.find(i => i.id === pidOk(p));
  let rec = null; if (code) { try { rec = await kv.get(K.rec(code)); } catch (e) {} } const net = rec ? rec.s : 'x';
  const mens = (rec && rec.m) || (q.get('h') === '1' && num(q.get('ms')) >= 600); const bot = isBot(req.headers['user-agent']);
  if (mens && !bot) { const keys = ['sh-' + net + '-klik', 'sh-d' + D8() + '-' + net + '-klik', 'sh-u' + nlUur() + '-klik']; if (it) keys.push('sh-p-' + pk(it.id) + (pos === 'h' || pos === 'logo' ? '-hklik' : '-klik'));
    if (rec && !rec.kl) { if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-klik'); if (rec.a) keys.push('sh-' + net + '-a' + rec.a + '-klik'); if (rec.k) keys.push('sh-' + net + '-k' + rec.k + '-klik'); rec.kl = Date.now(); }
    if (rec && rec.c && !rec.conv && PB[net]) { let st = 0; try { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 2500); const r = await fetch(PB[net].replace('{clickid}', encodeURIComponent(rec.c)), { signal: ctl.signal }); clearTimeout(tm); st = r.status; } catch (e) {} rec.conv = Date.now(); rec.pb = st; keys.push('sh-' + net + '-conv', 'sh-d' + D8() + '-' + net + '-conv', 'sh-' + net + '-pb' + (st || 0)); if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-conv'); }
    await inc(keys); if (rec) { try { await kv.set(K.rec(code), rec, { ex: 7 * 86400 }); } catch (e) {} } }
  const utm = 'utm_source=' + (net === 'x' ? 'shoplus' : NETTEN[net].toLowerCase()) + '&utm_medium=push&utm_campaign=shoplus' + (it ? '&utm_content=' + encodeURIComponent(pk(it.id)) : '') + (code ? '&hj=' + code : '');
  res.statusCode = 302; res.setHeader('location', (it ? SHOP + '/product/' + encodeURIComponent(it.id) : SHOP) + '?' + utm); res.setHeader('cache-control', 'no-store'); return res.end();
}

async function baken(req, res) {
  let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
  const code = String(b.c || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); const e = b.e === 'mens' ? 'mens' : b.e === 'eng' ? 'eng' : '';
  if (!e || isBot(req.headers['user-agent'])) return res.status(204).end();
  if (!code) { await inc(['sh-x-' + e, 'sh-d' + D8() + '-x-' + e]); return res.status(204).end(); }
  let rec = null; try { rec = await kv.get(K.rec(code)); } catch (x) {} const veld = e === 'mens' ? 'm' : 'e'; if (!rec || rec[veld]) return res.status(204).end();
  rec[veld] = 1; const net = rec.s; const keys = ['sh-' + net + '-' + e, 'sh-d' + D8() + '-' + net + '-' + e]; if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-' + e); if (rec.a) keys.push('sh-' + net + '-a' + rec.a + '-' + e); if (rec.k) keys.push('sh-' + net + '-k' + rec.k + '-' + e);
  await inc(keys); try { await kv.set(K.rec(code), rec, { ex: 7 * 86400 }); } catch (x) {}
  return res.status(204).end();
}

// Pixel voor de shop (zie lib/shopphp.js): /api/shop/px?c=<hj>&w=cart  en  /api/shop/px?c=<hj>&w=koop&v=<bedrag>&o=<ordernummer>
// Een bestelling telt per plek, advertentie en product, en gaat met het bedrag door naar het netwerk van die klik.
async function pixel(req, res, url) {
  const q = url.searchParams; const code = String(q.get('c') || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); const w = q.get('w') === 'koop' ? 'koop' : 'cart';
  const v = Math.max(0, Math.min(100000, num(q.get('v')))); const order = String(q.get('o') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  try { await kv.set('hjdk:shop:pxlaatst:' + w, { at: Date.now(), test: /^test/i.test(code), bedrag: v, order: !!order }); } catch (e) {}
  if (code) { try { const rec = await kv.get(K.rec(code)); const merk = w + (w === 'koop' && order ? ':' + order : '');
    if (rec && !(rec.px && rec.px[merk])) { rec.px = rec.px || {}; rec.px[merk] = Date.now(); const net = rec.s; const keys = ['sh-' + net + '-' + w, 'sh-d' + D8() + '-' + net + '-' + w]; if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-' + w); if (rec.a) keys.push('sh-' + net + '-a' + rec.a + '-' + w); if (rec.k) keys.push('sh-' + net + '-k' + rec.k + '-' + w); if (rec.p) keys.push('sh-p-' + pk(rec.p) + '-' + w);
      await inc(keys);
      if (w === 'koop') { let st = 0; if (v > 0) { try { await kv.incrMany([['c:sh-' + net + '-omzet', Math.round(v * 100)], ['c:sh-d' + D8() + '-' + net + '-omzet', Math.round(v * 100)]]); } catch (e) {} }
        if (rec.c && PB[net] && (net !== 'ra' || !rec.conv)) { try { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 2500); const r = await fetch(PB[net].replace('{clickid}', encodeURIComponent(rec.c)) + (net === 'ra' ? '' : '&payout=' + v.toFixed(2)) + (net === 'pa' ? '&goal=2' : ''), { signal: ctl.signal }); clearTimeout(tm); st = r.status; } catch (e) {} rec.conv = rec.conv || Date.now(); }
        await log({ soort: 'bestelling', wat: (v ? eur(v) + ' ' : '') + 'via ' + (net === 'x' ? 'eigen verkeer' : NETTEN[net]), waarom: 'plek ' + (rec.z || '?') + ', advertentie ' + (rec.a || '?') + (rec.c && PB[net] ? ', gemeld aan het netwerk (HTTP ' + st + ')' : '') }); }
      await kv.set(K.rec(code), rec, { ex: 30 * 86400 }); } } catch (e) {} }
  res.setHeader('content-type', 'image/gif'); res.setHeader('cache-control', 'no-store'); return res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
}

// ---------------- advertentiebeeld ----------------
// De productfoto zelf, op maat gesneden als JPEG (klein bestand, ook als de bron webp of png is). icon = 192x192, md = 720x360 (Mondiad), pa = 492x328 (PropellerAds), ca = 360x240 (Clickadu, breder dan 362 mag daar niet).
const MATEN = { icon: [192, 192, 'cover'], md: [720, 360, 'contain'], pa: [492, 328, 'contain'], ca: [360, 240, 'contain'] };
async function plaatje(req, res, url) {
  const cat = await catalog(); const it = cat.items.find(i => i.id === pidOk(url.searchParams.get('p'))); const m = MATEN[String(url.searchParams.get('t') || 'icon')] || MATEN.icon;
  if (!it || !it.img) { res.statusCode = 404; return res.end('onbekend product'); }
  try {
    const r = await fetch(it.img); if (!r.ok) throw new Error('foto ' + r.status);
    const out = await sharp(Buffer.from(await r.arrayBuffer())).flatten({ background: '#ffffff' }).resize(m[0], m[1], { fit: m[2], background: '#ffffff', position: 'centre' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    res.setHeader('content-type', 'image/jpeg'); res.setHeader('cache-control', 'public, max-age=86400, s-maxage=86400'); return res.end(out);
  } catch (e) { res.statusCode = 500; return res.end('beeld mislukt: ' + String(e && e.message || e).slice(0, 120)); }
}

// ---------------- gegevens voor de PropellerAds-lus ----------------
async function voorNet(net) {
  const cat = await catalog(); const perId = {}; cat.items.forEach(i => { perId[i.id] = i; }); const ads = await advertenties(); let top = null; try { top = await kv.get(K.top); } catch (e) {}
  const volg = (top && top.ids) || seed.ads.map(a => a.pid);
  const zones = await metUniek(net, await tellers(net, 'z', await smembers(K.set('z', net)))), cr = await tellers(net, 'a', await smembers(K.set('a', net))), camp = await tellers(net, 'k', await smembers(K.set('k', net)));
  return { at: new Date().toISOString(), net, naam: NAAM, land: LAND() + '/shop', vandaag: (await dagTotaal(DAY()))[net],
    ads: ads.filter(a => perId[a.pid] && !!perId[a.pid].img).map(a => ({ pid: a.pid, title: a.title, desc: a.desc, uit: a.uit || null, rang: volg.indexOf(a.pid), thema: themaVan(perId[a.pid]), icon: beeld(a.pid, 'icon'), image: beeld(a.pid, net === 'ra' ? 'md' : net === 'ca' ? 'ca' : 'pa') })),
    zones, creatives: cr, campagnes: camp, staat: (await kv.get('hjdk:shop:' + net + 'staat:' + DAY())) || {} };
}

// ---------------- statuspagina ----------------
const nlTijd = iso => { try { return new Date(iso).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } };
const STATUS_NL = { RUNNING: 'loopt', PENDING: 'wacht op goedkeuring', PAUSED: 'stil', FINISHED: 'budget op', DAILY_LIMIT_REACHED: 'dagbudget op', REJECTED: 'afgekeurd', NO_ACTIVE_CREATIVES: 'geen advertentie actief', OFF_ACCOUNT_BUDGET: 'saldo op', OFF_SCHEDULE: 'buiten de uren', WAITING_START_DATE: 'start later', DRAFT: 'concept' };
async function statusPagina(sk) {
  const laatste = (await kv.get(K.laatste)) || null; const palog = ((await kv.get(K.palog)) || []); const ralog = ((await kv.get(K.ralog)) || []); const calog = ((await kv.get(K.calog)) || []); const logl = ((await kv.get(K.log)) || []).slice(0, 80); const d = await dagTotaal(DAY()), g = await dagTotaal(DAY(-1));
  let les = null; try { les = await kv.get(K.lessen); } catch (e) {}
  const pa = palog[0] || null, ra = ralog[0] || null, ca = calog[0] || null; const usd = v => '$' + num(v).toFixed(2).replace('.', ','); const pc = v => v == null ? '-' : String(v).replace('.', ',') + '%';
  const som = (o, s) => num(o.md[s]) + num(o.pa[s]) + num(o.ra[s]) + num((o.ca || {})[s]) + num(o.x[s]);
  const kaart = (t, v, sub) => `<div class="k"><div class="kt">${esc(t)}</div><div class="kv">${v}</div>${sub ? `<div class="ks">${sub}</div>` : ''}</div>`;
  const netRij = (naam, o, kosten) => `<tr><td>${naam}</td><td class="n">${o.view}</td><td class="n">${o.mens}</td><td class="n">${o.eng}</td><td class="n">${o.klik}</td><td class="n">${o.cart}</td><td class="n">${o.koop}</td><td class="n">${kosten == null ? '?' : usd(kosten)}</td><td class="n">${kosten != null && o.klik ? usd(kosten / o.klik) : '-'}</td></tr>`;
  const mdC = (laatste && laatste.mondiad && laatste.mondiad.campagnes) || [], paC = (pa && pa.campagnes) || [], raC = (ra && ra.campagnes) || [], caC = (ca && ca.campagnes) || [];
  const mdKosten = mdC.reduce((a, c) => a + num(c.kostenVandaag), 0), paKosten = paC.reduce((a, c) => a + num(c.kostenVandaag), 0), raKosten = raC.reduce((a, c) => a + num(c.kostenVandaag), 0), caKosten = caC.reduce((a, c) => a + num(c.kostenVandaag), 0);
  const cNaam = c => String(c.naam || '').replace(/\[In-Page\]\s*/, '').replace(NAAM, '').replace(/thema=[a-z]+\s*\|?/, '').replace(/^[\s|·-]+/, '').slice(0, 52);
  const cRij = (net, c) => `<tr><td>${net}</td><td>${esc(cNaam(c))}</td><td>${esc(STATUS_NL[String(c.status).toUpperCase()] || String(c.status).toLowerCase())}</td><td class="n">${c.bod == null ? '-' : '$' + num(c.bod).toFixed(3).replace('.', ',')}</td><td class="n">${num(c.kliksVandaag)}</td><td class="n">${usd(c.kostenVandaag)}</td><td class="n">${num((c.eigen || {}).view)}</td><td class="n">${num((c.eigen || {}).klik)}</td></tr>`;
  const besl = [...logl, ...palog.slice(0, 12).flatMap(l => (l.besluiten || []).map(b => Object.assign({ at: l.at }, b))), ...ralog.slice(0, 24).flatMap(l => (l.besluiten || []).map(b => Object.assign({ at: l.at }, b))), ...calog.slice(0, 24).flatMap(l => (l.besluiten || []).map(b => Object.assign({ at: l.at }, b)))].sort((a, b) => String(b.at).localeCompare(String(a.at))).filter((b, i, a) => a.findIndex(x => x.at === b.at && x.soort === b.soort && x.wat === b.wat) === i).slice(0, 50).map(b => `<li><span class="t">${esc(nlTijd(b.at))}</span> <b>${esc(b.soort)}</b>: ${esc(String(b.wat || '').slice(0, 90))}${b.waarom ? ' — ' + esc(String(b.waarom).slice(0, 170)) : ''}</li>`).join('');
  const inz = (laatste && laatste.inzicht) || { themas: [], advertenties: [], producten: [], uren: [], plekken: {} };
  const thRij = inz.themas.map(t => `<tr><td>${esc(t.naam)}</td><td class="n">${t.bezoekers}</td><td class="n">${t.doorkliks}</td><td class="n">${pc(t.doorklikPct)}</td><td class="n">${t.winkelwagen}</td><td class="n">${t.bestellingen}</td></tr>`).join('');
  const adRij = inz.advertenties.map(a => `<tr><td><b>${esc(a.titel)}</b><br><span class="t">${esc(a.tekst)}</span></td><td class="n">${a.bezoekers}</td><td class="n">${pc(a.echtPct)}</td><td class="n">${a.doorkliks}</td><td class="n">${pc(a.doorklikPct)}</td><td class="n">${a.bestellingen}</td><td>${esc(Object.keys(a.netwerken).join(', '))}</td></tr>`).join('');
  const prRij = inz.producten.map(t => `<tr><td><a href="${SHOP}/product/${esc(t.id)}">${esc(String(t.titel || t.id).slice(0, 60))}</a></td><td class="n">${esc(eur(t.prijs))}</td><td class="n">${t.vooraan}</td><td class="n">${t.doorVooraan}</td><td class="n">${t.inLijst}</td><td class="n">${t.doorLijst}</td><td class="n">${t.bestellingen}</td></tr>`).join('');
  const maxU = Math.max(1, ...inz.uren.map(u => u.bezoekers)); const uurRij = inz.uren.map(u => `<tr><td>${String(u.uur).padStart(2, '0')}:00</td><td class="n">${u.bezoekers}</td><td class="n">${u.doorkliks}</td><td><span class="bar" style="width:${Math.round(160 * u.bezoekers / maxU)}px"></span></td></tr>`).join('');
  const plRij = Object.entries(inz.plekken || {}).flatMap(([n, l]) => l.slice(0, 8).map(z => `<tr><td>${NETTEN[n]}</td><td>${esc(z.plek)}</td><td class="n">${z.bezoekers}</td><td class="n">${z.mensen}</td><td class="n">${z.bleven}</td><td class="n">${z.doorkliks}</td><td class="n">${z.bestellingen}</td></tr>`)).join('');
  const uitRij = [...logl, ...palog.slice(0, 30).flatMap(l => (l.besluiten || []).map(b => Object.assign({ at: l.at }, b))), ...ralog.slice(0, 60).flatMap(l => (l.besluiten || []).map(b => Object.assign({ at: l.at }, b))), ...calog.slice(0, 60).flatMap(l => (l.besluiten || []).map(b => Object.assign({ at: l.at }, b)))].filter(b => /^plek uit/.test(String(b.soort))).filter((b, i, a) => a.findIndex(x => x.soort === b.soort && x.wat === b.wat) === i).slice(0, 30).map(b => `<tr><td>${esc(String(b.soort).replace(/plek uit \(|\)/g, ''))}</td><td>${esc(b.wat)}</td><td>${esc(String(b.waarom || '').slice(0, 110))}</td></tr>`).join('');
  const lesBlok = les && les.lessen && les.lessen.length ? `<div class="answer">${les.lessen.map(l => `<p>${esc(l)}</p>`).join('')}<p class="t">Bijgewerkt ${esc(nlTijd(les.at))}, op ${les.bezoekers} gemeten bezoekers.</p></div>${(les.eerder || []).length ? `<details class="faq"><summary>Lessen van eerdere dagen</summary><div class="a">${les.eerder.map(e => `<p><b>${esc(e.dag)}</b><br>${e.lessen.map(esc).join('<br>')}</p>`).join('')}</div></details>` : ''}` : '<div class="answer"><p>Nog te weinig bezoekers om iets te concluderen. Zodra er 40 bezoekers gemeten zijn, staan hier elke dag de lessen in gewone taal.</p></div>';
  const tabel = (kop, rijen, leeg, n) => `<div class="tw"><table><tr>${kop}</tr>${rijen || `<tr><td colspan="${n}">${leeg}</td></tr>`}</table></div>`;
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>Shop-leerlus: overzicht</title>
<style>${look(ACC)}.wrap{max-width:66rem}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.k{background:var(--bg-2);border:1px solid var(--line);border-radius:12px;padding:12px 14px}.kt{font-size:.875rem;color:var(--ink-3)}.kv{font-size:1.75rem;font-weight:750}.ks{font-size:.875rem;color:var(--ink-3)}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px}table{border-collapse:collapse;width:100%;font-size:.9375rem}th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);white-space:nowrap;vertical-align:top}th{color:var(--ink-3);font-weight:650}td.n,th.n{text-align:right}tr:last-child td{border-bottom:0}
ul.b{padding-left:18px}ul.b li{margin:0 0 8px}.t{color:var(--ink-3);font-size:.8125rem}h1{font-size:1.875rem}.bar{display:inline-block;height:10px;border-radius:5px;background:var(--acc)}.uitleg{color:var(--ink-2);font-size:.9375rem;margin:0 0 10px}
pre{background:var(--bg-2);border:1px solid var(--line);border-radius:10px;padding:14px;overflow-x:auto;font-size:.875rem;line-height:1.5}ol.st{padding-left:20px}ol.st li{margin:0 0 10px}</style></head><body><main class="wrap">
<p class="kicker">Yoors Shop · betaald verkeer</p><h1>Shop-leerlus: overzicht</h1>
<p class="standfirst">Advertenties bij Mondiad, PropellerAds, RichAds en Clickadu sturen Nederlandse bezoekers via een landingspagina naar de Yoors Shop. Elk uur tussen 07 en 23 uur kijkt de lus wat werkt en stuurt hij bij. Deze pagina laat zien wat hij weet en wat hij deed.</p>
<p class="meta">Bijgewerkt ${esc(nlTijd(new Date().toISOString()))} (Nederlandse tijd). Laatste ronde Mondiad en producten: ${laatste ? esc(nlTijd(laatste.at)) : 'nog niet'} · PropellerAds: ${pa ? esc(nlTijd(pa.at)) : 'nog niet'} · RichAds: ${ra ? esc(nlTijd(ra.at)) : 'nog niet'} · Clickadu: ${ca ? esc(nlTijd(ca.at)) : 'nog niet'}.</p>
<h2>Wat we tot nu toe leren</h2>${lesBlok}
<h2>Vandaag</h2><div class="g">${kaart('Bezoekers', som(d, 'view'), 'gisteren ' + som(g, 'view'))}${kaart('Echte mensen', som(d, 'mens'), 'bewogen of tikten')}${kaart('Door naar de shop', som(d, 'klik'), 'gisteren ' + som(g, 'klik'))}${kaart('In winkelwagen', som(d, 'cart'), 'zodra de shop het doorgeeft')}${kaart('Bestellingen', som(d, 'koop'), som(d, 'omzet') ? 'omzet ' + eur(som(d, 'omzet') / 100) : 'zodra de shop het doorgeeft')}${kaart('Kosten', usd(mdKosten + paKosten + raKosten + caKosten), 'Mondiad ' + usd(mdKosten) + ' · PropellerAds ' + usd(paKosten) + ' · RichAds ' + usd(raKosten) + ' · Clickadu ' + usd(caKosten))}</div>
<h2>Per netwerk (vandaag)</h2>${tabel('<th>Netwerk</th><th class="n">Bezoekers</th><th class="n">Echte mensen</th><th class="n">Bleven 15 sec</th><th class="n">Naar de shop</th><th class="n">Winkelwagen</th><th class="n">Bestellingen</th><th class="n">Kosten</th><th class="n">Per doorklik</th>', netRij('Mondiad', d.md, mdKosten) + netRij('PropellerAds', d.pa, paKosten) + netRij('RichAds', d.ra, raKosten) + netRij('Clickadu', d.ca, caKosten) + netRij('Overig', d.x, 0), '', 9)}
<h2>Campagnes</h2><p class="uitleg">Bij Mondiad en PropellerAds betalen we per resultaat (een bezoeker die doorklikt naar de shop). Bij RichAds en Clickadu stopt de lus een campagne zodra het daglimiet van de test bereikt is.</p>${tabel('<th>Netwerk</th><th>Campagne</th><th>Status</th><th class="n">Bod</th><th class="n">Kliks vandaag</th><th class="n">Kosten vandaag</th><th class="n">Bezoekers (totaal)</th><th class="n">Naar de shop (totaal)</th>', mdC.map(c => cRij('Mondiad', c)).join('') + paC.map(c => cRij('PropellerAds', c)).join('') + raC.map(c => cRij('RichAds', c)).join('') + caC.map(c => cRij('Clickadu', c)).join(''), 'Nog geen campagnes gevonden', 8)}
<h2>Welke thema's werken</h2><p class="uitleg">Per thema: hoeveel bezoekers het product vooraan zagen en hoeveel doorklikten naar de shop.</p>${tabel('<th>Thema</th><th class="n">Bezoekers</th><th class="n">Naar de shop</th><th class="n">Doorklik</th><th class="n">Winkelwagen</th><th class="n">Bestellingen</th>', thRij, 'Nog geen bezoekers', 6)}
<h2>Welke advertenties werken</h2>${tabel('<th>Advertentie</th><th class="n">Bezoekers</th><th class="n">Echte mensen</th><th class="n">Naar de shop</th><th class="n">Doorklik</th><th class="n">Bestellingen</th><th>Netwerk</th>', adRij, 'Nog geen bezoekers', 7)}
<h2>Welke producten werken</h2><p class="uitleg">Vooraan = het product waar de advertentie over ging. In lijst = getoond onder "Ook populair vandaag".</p>${tabel('<th>Product</th><th class="n">Prijs</th><th class="n">Vooraan</th><th class="n">Doorkliks</th><th class="n">In lijst</th><th class="n">Doorkliks</th><th class="n">Bestellingen</th>', prRij, 'Nog geen bezoekers', 7)}
<h2>Op welk uur</h2>${tabel('<th>Uur (NL)</th><th class="n">Bezoekers</th><th class="n">Naar de shop</th><th></th>', uurRij, 'Nog geen bezoekers', 4)}
<h2>Advertentieplekken</h2><p class="uitleg">De beste plekken per netwerk. Plekken zonder echte mensen of zonder doorkliks sluit de lus zelf uit.</p>${tabel('<th>Netwerk</th><th>Plek</th><th class="n">Bezoekers</th><th class="n">Echte mensen</th><th class="n">Bleven</th><th class="n">Naar de shop</th><th class="n">Bestellingen</th>', plRij, 'Nog geen bezoekers', 7)}
${uitRij ? `<h3>Uitgesloten plekken</h3>${tabel('<th>Netwerk</th><th>Plek</th><th>Waarom</th>', uitRij, '', 3)}` : ''}
<h2>Wat de lus besloot</h2><ul class="b">${besl || '<li>Nog niets.</li>'}</ul>
<h2 id="babita">Voor Babita</h2>
<p class="uitleg">Nu weet de lus alleen wie doorklikt naar de shop. Wat de shop moet teruggeven om op bestellingen en marge te sturen, staat met voorbeelden en de actuele stand in de briefing.</p>
<p><a class="btn" href="/api/shop/briefing?k=${esc(sk)}">Open de briefing voor Babita</a> &nbsp; <a class="btn ghost" href="/api/shop/babita?k=${esc(sk)}">Download yoors-shop-conversies.php</a></p>
<p class="note">Uitgesloten plekken: Mondiad ${laatste && laatste.mondiad ? num(laatste.mondiad.zwarteLijst) : 0}, PropellerAds ${pa ? num(pa.zwarteLijst) : 0}, RichAds ${ra ? num(ra.zwarteLijst) : 0}, Clickadu ${ca ? num(ca.zwarteLijst) : 0}. Advertenties in de bibliotheek: ${laatste ? num(laatste.advertenties) : 0}. Catalogus: ${laatste ? num(laatste.catalogus.producten) + ' producten' + (laatste.catalogus.terugval ? ' (startset; de shop was niet bereikbaar)' : '') : '?'}. Deze pagina is alleen-lezen: er staan geen sleutels op en je kunt er niets mee wijzigen.</p></main></body></html>`;
}

// ---------------- briefing voor Babita: wat de shop moet teruggeven, met de actuele stand ----------------
async function briefingPagina(sk) {
  const cat = await catalog(true); const n = cat.items.length; const v = cat.velden || {}; const px = {}; for (const w of ['cart', 'koop']) { try { px[w] = await kv.get('hjdk:shop:pxlaatst:' + w); } catch (e) {} }
  const en = cat.items.filter(i => engels(i.t));
  const ok = t => `<span class="ok">✓ ${esc(t)}</span>`, nee = t => `<span class="nee">○ ${esc(t)}</span>`, half = t => `<span class="half">• ${esc(t)}</span>`;
  const veld = (namen) => { const c = namen.map(x => num(v[x])); const min = Math.min(...c), max = Math.max(...c); return !max ? nee('staat er nog niet') : min >= 0.9 * n ? ok('staat erin bij ' + min + ' van ' + n + ' producten') : half(namen.map((x, i) => x + ' ' + c[i]).join(', ') + ' van ' + n + ' producten'); };
  const pxStand = !px.cart && !px.koop ? nee('nog geen aanroep gezien') : (px.koop ? (px.koop.test ? half : ok)('betaald: laatste aanroep ' + nlTijd(new Date(px.koop.at).toISOString()) + (px.koop.test ? ' (test)' : '') + (px.koop.order ? '' : ', zonder ordernummer') + (px.koop.bedrag ? '' : ', zonder bedrag')) : nee('betaald: nog niet gezien')) + '<br>' + (px.cart ? ok('winkelwagen: laatste aanroep ' + nlTijd(new Date(px.cart.at).toISOString())) : nee('winkelwagen: nog niet gezien'));
  const stand = [
    ['1', 'Winkelwagen en betaalde bestelling terugmelden', pxStand],
    ['2', 'Voorraad, levertijd en verzendkosten in de productlijst', veld(['in_stock', 'delivery_days', 'shipping_cost'])],
    ['3', 'Verkocht, winkelwagen en marge (afgeschermd)', veld(['sold_7d', 'sold_30d', 'cart_7d', 'margin'])],
    ['4', 'Zoekwoorden van bezoekers', cat.zoek ? ok(cat.zoek.length + ' zoekwoorden ontvangen') : nee('adres bestaat nog niet')],
    ['5', 'Nederlandse titels', en.length ? half('nog ' + en.length + ' van ' + n + ' producten met een Engelse titel') : ok('alles vertaald')],
    ['6', 'Ontwikkelaarsknop verbergen voor bezoekers', cat.devKnop === false ? ok('niet meer zichtbaar') : cat.devKnop === true ? nee('nog zichtbaar zonder inloggen') : half('niet kunnen controleren')]
  ].map(r => `<tr><td class="nr">${r[0]}</td><td>${esc(r[1])}</td><td>${r[2]}</td></tr>`).join('');
  const vt = rijen => `<div class="tw"><table><tr><th>Veld</th><th>Type</th><th>Voorbeeld</th><th>Betekenis</th></tr>${rijen.map(r => `<tr><td><code>${r[0]}</code></td><td>${r[1]}</td><td><code>${r[2]}</code></td><td class="wrap2">${r[3]}</td></tr>`).join('')}</table></div>`;
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>Briefing voor Babita: Yoors Shop en de leerlus</title>
<style>${look(ACC)}.wrap{max-width:52rem}.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px;margin:0 0 14px}table{border-collapse:collapse;width:100%;font-size:.9375rem}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--ink-3);font-weight:650}tr:last-child td{border-bottom:0}td.nr{font-weight:700;width:2rem}td.wrap2{min-width:15rem}
.ok{color:#15803d;font-weight:650}.nee{color:#b91c1c;font-weight:650}.half{color:#b45309;font-weight:650}@media (prefers-color-scheme:dark){.ok{color:#4ade80}.nee{color:#f87171}.half{color:#fbbf24}}
pre{background:var(--bg-2);border:1px solid var(--line);border-radius:10px;padding:14px;overflow-x:auto;font-size:.875rem;line-height:1.5;margin:0 0 14px}code{font-size:.9em}ol.st{padding-left:20px;margin:0 0 14px}ol.st li{margin:0 0 10px}h1{font-size:1.875rem}h2{margin-top:44px}.klaar{border-left:3px solid var(--acc);padding:2px 0 2px 14px;color:var(--ink-2);margin:0 0 14px}.t{color:var(--ink-3);font-size:.8125rem}</style></head><body><main class="wrap">
<p class="kicker">Yoors Shop · voor Babita</p><h1>Briefing: wat de shop moet teruggeven</h1>
<p class="standfirst">Er lopen betaalde campagnes naar de Yoors Shop via Mondiad, PropellerAds en RichAds. Een lus in de cloud stuurt ze elk uur bij, maar ziet nu alleen wie doorklikt naar de shop. Met de zes punten hieronder ziet hij ook wat er verkocht wordt en wat het oplevert. De volgorde is de volgorde van belang: punt 1 levert het meeste op.</p>
<p class="meta">Stand van ${esc(nlTijd(new Date().toISOString()))} (Nederlandse tijd). De lus kijkt elk uur zelf of iets er staat; je hoeft niets af te melden. <a href="/api/shop/overzicht?k=${esc(sk)}">Naar het leerlus-overzicht</a></p>
<h2 style="margin-top:28px">Stand</h2><div class="tw"><table><tr><th></th><th>Punt</th><th>Stand</th></tr>${stand}</table></div>

<h2>1. Winkelwagen en betaalde bestelling terugmelden</h2>
<p>Elke bezoeker uit een campagne komt binnen met een kenmerk in de URL, bijvoorbeeld <code>yoo.rs/shop/product/oc_123?utm_source=mondiad&amp;hj=abc123</code>. De shop onthoudt dat kenmerk en meldt terug als die bezoeker iets in de winkelwagen legt en als hij betaald heeft. De lus zoekt er de klik bij en geeft de bestelling door aan het juiste advertentienetwerk. Voor Mondiad en RichAds zit dat nog niet in Yoors; dit ene bestand regelt het voor alle netwerken.</p>
<ol class="st"><li><a href="/api/shop/babita?k=${esc(sk)}"><b>Download yoors-shop-conversies.php</b></a> en zet het in de shop-code.</li>
<li>Op elke shop-pagina, voordat er uitvoer is: <code>ShopConversies::onthoud($_GET);</code></li>
<li>Als iets in de winkelwagen gaat: <code>ShopConversies::winkelwagen();</code></li>
<li>Bij het starten van de betaling, bewaar bij de order: <code>$kenmerk = ShopConversies::voorOrder();</code></li>
<li>Zodra de betaling binnen is (PayPal bevestigd), een keer per order: <code>ShopConversies::betaald($orderId, $bedragInEuro, $kenmerk);</code></li></ol>
<p>Stap 4 en 5 zijn zo gemaakt dat het ook werkt als PayPal de bevestiging via een webhook stuurt; dan is er geen cookie, maar het kenmerk staat bij de order. Een aanroep die mislukt houdt de shop nooit op: het bestand wacht hooguit 3 seconden en vangt elke fout af.</p>
<p class="klaar"><b>Klaar als:</b> je <code>yoo.rs/shop/?hj=test123</code> opent, iets in de winkelwagen legt en afrekent, en hierboven bij punt 1 twee keer "laatste aanroep" met de tijd van je test staat.</p>

<h2>2. Voorraad, levertijd en verzendkosten in de productlijst</h2>
<p>De lus haalt elk uur <code>GET /shop/api/shop?lang=nl&amp;offset=0</code> op. Per product staan daar al <code>id</code>, <code>title</code>, <code>price</code>, <code>views</code> en <code>favourites</code>. Voeg per product deze drie velden toe. Ze mogen openbaar zijn; ze staan ook op de productpagina.</p>
${vt([['in_stock', 'true of false', 'true', 'Nu te bestellen. Bij <code>false</code> zet de lus het product niet meer vooraan.'], ['delivery_days', 'getal', '3', 'Werkdagen tot bezorging in Nederland. Komt op de landingspagina te staan.'], ['shipping_cost', 'getal, in euro', '4.95', 'Verzendkosten naar Nederland. <code>0</code> betekent gratis verzending.']])}
<p class="klaar"><b>Klaar als:</b> bij punt 2 hierboven staat dat de velden er bij (bijna) alle producten in zitten.</p>

<h2>3. Verkocht, winkelwagen en marge (afgeschermd)</h2>
<p>Dezelfde productlijst, maar deze vier velden alleen meesturen als de aanvraag de header <code>X-Lus-Key</code> met de juiste sleutel heeft. De sleutel krijg je van Henkjan; hij staat bewust niet op deze pagina. Zonder sleutel of met een verkeerde sleutel: de velden weglaten en verder gewoon antwoorden, geen foutmelding.</p>
${vt([['sold_7d', 'getal', '4', 'Stuks verkocht in de laatste 7 dagen.'], ['sold_30d', 'getal', '11', 'Stuks verkocht in de laatste 30 dagen.'], ['cart_7d', 'getal', '9', 'Keer in een winkelwagen gelegd in de laatste 7 dagen.'], ['margin', 'getal, in euro', '8.40', 'Wat er per stuk overblijft: verkoopprijs min inkoop min de verzending die wij betalen. Heb je alleen de inkoopprijs, stuur dan <code>cost_price</code>; dan rekent de lus het zelf uit.']])}
<pre>{
  "id": "oc_4174003627704321",
  "title": "Cortenstaal Skull Lantaarn voor Gothic Decor",
  "price": 25,
  "views": 31,
  "favourites": 2,
  "in_stock": true,
  "delivery_days": 3,
  "shipping_cost": 4.95,
  "sold_7d": 4,
  "sold_30d": 11,
  "cart_7d": 9,
  "margin": 8.40
}</pre>
<p class="klaar"><b>Klaar als:</b> bij punt 3 hierboven staat dat de velden erin zitten. De lus stuurt dan op wat verkoopt en wat geld oplevert, in plaats van op wat veel kliks trekt.</p>

<h2>4. Zoekwoorden van bezoekers</h2>
<p>Nieuw adres: <code>GET /shop/api/search-terms?days=7</code>, ook alleen met de header <code>X-Lus-Key</code>. Het geeft de 50 meest gebruikte zoekopdrachten in de shop over die dagen. Als de shop zoekopdrachten nog niet bewaart, is dat het eerste stuk: bij elke zoekactie op <code>/shop/search?q=...</code> het zoekwoord, de datum en het aantal gevonden producten opslaan.</p>
<pre>{
  "items": [
    { "term": "book nook", "count": 14, "results": 9 },
    { "term": "kerstballen", "count": 6, "results": 2 },
    { "term": "adventskalender", "count": 5, "results": 0 }
  ]
}</pre>
<p><code>results: 0</code> is juist waardevol: daar zocht iemand iets wat de shop niet heeft.</p>
<p class="klaar"><b>Klaar als:</b> bij punt 4 hierboven staat hoeveel zoekwoorden er ontvangen zijn.</p>

<h2>5. Nederlandse titels</h2>
<p>Met <code>?lang=nl</code> hebben ${en.length} van de ${n} producten nog een Engelse titel. Die adverteert de lus niet, en op een Nederlandse pagina zet hij ze niet vooraan. Het gaat om deze producten:</p>
<details class="faq"><summary>Lijst van ${en.length} producten met een Engelse titel</summary><div class="a"><div class="tw"><table><tr><th>Id</th><th>Titel nu</th></tr>${en.map(i => `<tr><td><a href="${SHOP}/product/${esc(i.id)}"><code>${esc(i.id)}</code></a></td><td>${esc(i.t)}</td></tr>`).join('')}</table></div></div></details>
<p class="klaar"><b>Klaar als:</b> bij punt 5 hierboven "alles vertaald" staat. De telling is een schatting op woorden als "for", "with" en "by"; een enkele merknaam kan blijven hangen.</p>

<h2>6. Ontwikkelaarsknop verbergen</h2>
<p>Op <code>yoo.rs/shop</code> staat als eerste kaart "Populair product toevoegen, alleen voor ontwikkelaars". Die is ook zichtbaar voor bezoekers die niet zijn ingelogd; een betaalde bezoeker ziet hem dus als eerste product. Alleen tonen aan ingelogde ontwikkelaars.</p>
<p class="klaar"><b>Klaar als:</b> bij punt 6 hierboven "niet meer zichtbaar" staat.</p>

<h2>Wat je niet hoeft te doen</h2>
<ul><li><b>PropellerAds</b> zit al in Yoors en blijft zoals het is. Bezoekers via de leerlus hebben geen PropellerAds-kenmerk in de URL, dus de bestaande melding gaat voor hen niet af en er wordt niets dubbel geteld.</li>
<li><b>Google Analytics</b>: geen werk nodig. De links uit de campagnes hebben wel <code>utm_source</code>, <code>utm_campaign</code> en <code>utm_content</code>, dus in GA zijn ze terug te vinden.</li>
<li><b>Campagnes, biedingen en advertenties</b>: dat doet de lus zelf.</li></ul>

<h2>Vragen</h2>
<p>Via Henkjan. Loopt iets anders dan hier staat, bijvoorbeeld andere veldnamen die al bestaan: geef ze door, dan past de lus zich aan in plaats van de shop.</p>
<p class="note">Deze pagina is alleen-lezen: er staan geen sleutels op en je kunt er niets mee wijzigen.</p></main></body></html>`;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  const url = new URL(req.url, 'http://x'); const op = (url.searchParams.get('op') || 'status').toLowerCase();
  OIDC = String(req.headers['x-vercel-oidc-token'] || '');
  try {
    if (op === 'land') return await land(req, res, url);
    if (op === 'uit') return await uitgang(req, res, url);
    if (op === 'b') return await baken(req, res);
    if (op === 'px') return await pixel(req, res, url);
    if (op === 'img') return await plaatje(req, res, url);
    res.setHeader('cache-control', 'no-store');
    if (op === 'voorpa') return res.status(200).json(Object.assign({ ok: true }, await voorNet(['ra', 'ca'].includes(url.searchParams.get('net')) ? url.searchParams.get('net') : 'pa')));
    if (op === 'ronde') {
      const droog = !!url.searchParams.get('droog');
      if (!droog) { const lk = await kv.get(K.lock); if (lk && Date.now() - lk < 240000) return res.status(200).json({ ok: true, overgeslagen: 'ronde loopt al' }); await kv.set(K.lock, Date.now(), { ex: 300 }); }
      try { return res.status(200).json(Object.assign({ ok: true }, await ronde(droog))); }
      catch (e) { await log({ soort: 'fout', wat: 'ronde', waarom: String(e.message).slice(0, 200) }); return res.status(200).json({ ok: false, fout: String(e.message) }); }
      finally { if (!droog) { try { await kv.set(K.lock, 0, { ex: 5 }); } catch (e) {} } }
    }
    if (op === 'palog' || op === 'catalogus' || op === 'adweg' || op === 'maakmd' || op === 'mdbod') { // schrijven: alleen met de gedeelde sleutel
      let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      const s = await geheim(); const k = String(req.headers['x-shop-sleutel'] || b.k || ''); if (!s || k !== s) return res.status(401).json({ ok: false, fout: 'sleutel' });
      if (op === 'catalogus') { const items = (Array.isArray(b.items) ? b.items : []).map(compact).filter(i => pidOk(i.id) && i.t && i.p > 0); if (items.length < 10) return res.status(400).json({ ok: false, fout: 'te weinig producten' }); await bewaarCatalogus(items, 'aangeleverd'); return res.status(200).json({ ok: true, producten: items.length }); }
      if (op === 'maakmd') { const thema = String(b.thema || '').replace(/[^a-z]/g, ''); if (!thema) return res.status(400).json({ ok: false, fout: 'thema ontbreekt' }); try { return res.status(200).json(Object.assign({ ok: true }, await maakMondiad(thema, b.formaat === 'push' ? 'push' : 'ipp'))); } catch (e) { return res.status(200).json({ ok: false, fout: String(e.message).slice(0, 300) }); } }
      if (op === 'mdbod') { const bid = Number(b.bid); if (!(bid >= 0.001 && bid <= MD_MAX_BOD())) return res.status(400).json({ ok: false, fout: 'bod tussen 0.001 en ' + MD_MAX_BOD() }); const cs = rows(await md('mondiad_list_campaigns', { name: NAAM, size: 100, excludeStatuses: ['ARCHIVED', 'ARCHIVED_COMPLETED'], responseFields: ['ID', 'NAME', 'BID'] })).filter(c => String(c.name || '').includes(NAAM)); let n = 0; for (const c of cs) { if (num(c.bid) !== bid) { try { await md('mondiad_update_campaign', { json: JSON.stringify({ id: c.id, bid }) }); n++; } catch (e) {} } } await log({ soort: 'bod gezet (Mondiad)', wat: n + ' campagnes', waarom: 'alle shop-campagnes naar $' + bid }); return res.status(200).json({ ok: true, aangepast: n, van: cs.length }); }
      if (op === 'adweg') { const ads = await advertenties(); let n = 0; for (const a of ads) if (!a.uit && a.title === String(b.title || '')) { a.uit = String(b.waarom || 'handmatig uitgezet'); n++; } if (n) await kv.set(K.ads, ads); return res.status(200).json({ ok: true, uitgezet: n }); }
      const net = ['ra', 'ca'].includes(b.net) ? b.net : 'pa'; const LK = net === 'ra' ? K.ralog : net === 'ca' ? K.calog : K.palog;
      const l = (await kv.get(LK)) || []; const e = b.log || {}; l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set(LK, l.slice(0, 120));
      if (b.staat && typeof b.staat === 'object') await kv.set('hjdk:shop:' + net + 'staat:' + DAY(), b.staat, { ex: 3 * 86400 });
      if (b.map && typeof b.map === 'object') { const m = (await kv.get(K.crmap)) || {}; for (const [id, v] of Object.entries(b.map)) { if (/^\d+$/.test(id) && v && pidOk(v.pid)) { m[net + ':' + id] = v.pid; m['t:' + net + ':' + id] = String(v.title || '').slice(0, 60); } } await kv.set(K.crmap, m); }
      return res.status(200).json({ ok: true });
    }
    // status: alleen met de geheime link (?k=...). Eenmalig aanmaken met ?maak=1 zolang er nog geen is.
    let sk = process.env.SHOP_STATUS_KEY || await kv.get(K.statuskey);
    if (!sk && url.searchParams.get('maak')) { sk = randomBytes(15).toString('hex'); await kv.set(K.statuskey, sk); return res.status(200).json({ ok: true, link: LAND() + '/api/shop/overzicht?k=' + sk }); }
    if (!sk || url.searchParams.get('k') !== sk) { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(403).send('<p style="font:16px system-ui;padding:24px">Deze pagina is privé.</p>'); }
    if (url.searchParams.get('json')) return res.status(200).json({ ok: true, laatste: await kv.get(K.laatste), pa: ((await kv.get(K.palog)) || []).slice(0, 5), ra: ((await kv.get(K.ralog)) || []).slice(0, 5), ca: ((await kv.get(K.calog)) || []).slice(0, 5), logboek: ((await kv.get(K.log)) || []).slice(0, 80), vandaag: await dagTotaal(DAY()) });
    if (op === 'plek') { // controle van een advertentieplek: hoe snel klikken bezoekers door, zijn het steeds dezelfde apparaten
      const n = String(url.searchParams.get('net') || 'pa').replace(/[^a-z]/g, ''); const z = plekId(url.searchParams.get('z'));
      const o = { net: n, plek: z, bezoeken: 0, mens: 0, doorklik: 0, gemeld: 0, secTotKlik: [], producten: {}, uren: {}, apparaten: {} }; let cur = '0', gezien = 0;
      do { const [c, keys] = await kv.scan(cur, { match: 'hjdk:shc:*', count: 1000 }); cur = c;
        for (let i = 0; i < keys.length; i += 200) { const vals = await kv.mget(...keys.slice(i, i + 200)); gezien += vals.length;
          for (const r of vals) { if (!r || r.s !== n || (z && String(r.z) !== z)) continue; o.bezoeken++; if (r.m) o.mens++; if (r.conv) o.gemeld++;
            if (r.kl) { o.doorklik++; o.secTotKlik.push(Math.round((r.kl - r.at) / 100) / 10); } o.producten[r.p] = (o.producten[r.p] || 0) + 1;
            const u = nlUur(r.at); o.uren[u] = (o.uren[u] || 0) + 1; if (r.h) o.apparaten[r.h] = (o.apparaten[r.h] || 0) + 1; } }
      } while (cur !== '0' && gezien < 30000);
      o.secTotKlik.sort((a, b) => a - b); o.verschillendeApparaten = Object.keys(o.apparaten).length; o.vaakstTerug = Math.max(0, ...Object.values(o.apparaten)); delete o.apparaten;
      return res.status(200).json(Object.assign({ ok: true }, o)); }
    if (op === 'briefing') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(await briefingPagina(sk)); }
    if (op === 'babita') { res.setHeader('content-type', 'application/x-php; charset=utf-8'); res.setHeader('content-disposition', 'attachment; filename="yoors-shop-conversies.php"'); return res.status(200).send(SHOP_PHP); }
    res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(await statusPagina(sk));
  } catch (e) { return res.status(200).json({ ok: false, fout: String(e && e.message || e) }); }
}
