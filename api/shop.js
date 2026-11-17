// YOORS SHOP-LUS — betaald verkeer (PropellerAds + Mondiad) naar yoo.rs/shop, volledig lerend. Draait op Vercel, los van Claude-account en laptop.
//   /shop  en  /shop/<product>   landingspagina: meet per advertentieplek, advertentie en product wie aankomt, wie een echt mens is, wie blijft en wie doorklikt
//   /api/shop/uit                doorklik naar yoo.rs/shop: telt, en meldt de conversie aan het advertentienetwerk (postback)
//   directe route (14 okt)       een deel van de betaalde bezoekers (per persoon vast, /api/shop/direct) gaat zonder landingspagina
//                                in één keer naar de productpagina op yoo.rs, met Clickmind onzichtbaar ertussen (lib/shopdirect.js)
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
import { shopRss } from '../lib/shoprss.js';
import sharp from 'sharp';
import { randomBytes, createHash } from 'node:crypto';
import { kv } from '../lib/db.js';
import { berichten, HAIKU, SONNET } from '../lib/ai.js';
import { verkoopTeksten } from '../lib/shoptekst.js';
import { md } from '../lib/mdmcp.js';
import { look } from '../lib/look.js';
import seed from '../data/shop-seed.json' with { type: 'json' };
import { SHOP_PHP } from '../lib/shopphp.js';
import { adviesPagina } from '../lib/shopadvies.js';
import { GIDSEN, GIDS_IDS, productenVoor, hulpPagina } from '../lib/cadeauhulp.js';
import { pinCohortEntries, PB, CM_NET, MG_STAP, mgUrl, mgEvent, SOORTEN_DIRECT, GEDRAG, directInst, zetDirect, shopMeet, shopArm, landDeel, doorkliks, warmZet, isBewust, kassaDoel, ttEvent } from '../lib/shopdirect.js';
import { ttFeedCsv, ttVideo, TT_VIDEO, TT_REGEL, TT_GROEPEN, ttSleutel, ttKoppelUrl, ttRuil, ttRapport, ttAds, ttUit, ttOordeel, ttMeld, ttTekst } from '../lib/tiktok.js';
import { whEvent, whopKlaar, whopAds, whopCampagnes, whopPauze, meld as whMeld, oordeel as whOordeel, WH_REGEL, whId, WHOP_BIZ, waardenUit, roasLeer, ROAS_REGEL, whopApi, whopGroepen, whopZetBudget, verkenPlan, whopNieuweAd, whProject, whLead, WH_PROJECTEN, koppelWaid, whopAan, whopZetDoel, whFormBouw, leadForm } from '../lib/whop.js';
import { verwerkKlik, serverSignalen, laterAf, nieuwId, laadDc, dcVan } from '../lib/mensmeter.js';
import { isBotZone, botZonesVers, echteKlikId } from '../lib/shopbot.js';
import { cidKoppel } from '../lib/wissel.js';
import { K_KOST, ontvang as margeOntvang, margeStand, zetMarge } from '../lib/shopmarge.js';
import { prijsStand, prijsCsv } from '../lib/shopprijs.js';
import { testRonde, testLabels, testTekst, TT_TEST } from '../lib/tttest.js';
import { kiesBundel, bundelOpenbaar, bundelTekst, bundelCode, BUNDEL_REGEL } from '../lib/bundel.js';
import { uurTel, uurStand, lekkenPagina, uurAanvullen, uurRitme, verkoopUren } from '../lib/shopuur.js';
import { overdrachtTekst, liveRegels, overdrachtPagina } from '../lib/shopoverdracht.js';
import { lokkers, kies, KIES_REGELS, STRATEGIEEN } from '../lib/shopkies.js';
const K_STRATEGIE = 'hjdk:shop:strategie'; // strategie van de dag voor de shoptest (marge of kostprijs)
const K_MAXLEV = 'hjdk:shop:maxlev'; // B4 (12 nov): hoogste levertijd in werkdagen voor de dagkeuze; ?maxlev=<dagen> op de beschermde host, 0 = geen grens
import { demandRadar } from '../lib/demandradar.js';
const SHOP_UIT = false; // 27 okt: shop op kadoly.com; Henkjan: "Zet er 20 aan maar verander domeinnaam in kadoly.com" (ook propellerads-mcp lib/budget.ts SHOP_UIT)
const K_GETEST = 'hjdk:shop:getest'; // { product-id: eerste testdag } (shoptest, lib/shopkies.js)

const LAND = () => (process.env.SHOP_LAND || 'https://keuzehulp.best').replace(/\/$/, '');
const SHOP = 'https://kadoly.com/shop';
// Terugmeldlinks per netwerk (PB) staan in lib/shopdirect.js. Clickadu: zet de link in SHOP_PB_CLICKADU met {clickid} op de plek van de klik-id.
const KAN_ORG = { fb: 'facebook', ig: 'instagram', pin: 'pinterest', tt: 'tiktok', th: 'threads', x: 'x', li: 'linkedin', yt: 'youtube', tg: 'telegram', wa: 'whatsapp', gbp: 'google-business', nb: 'nieuwsbrief', bs: 'bluesky', rd: 'reddit' }; // organische kanalen (op=org, 16 nov)
const NETTEN = { md: 'Mondiad', pa: 'PropellerAds', ra: 'RichAds', ca: 'Clickadu', mg: 'MGID', tt: 'TikTok', wh: 'Whop', pi: 'Pinterest', bi: 'Bing', x: 'Overig' }; // bi: Microsoft Advertising (16 nov 2026, Henkjan: "clickmind ertussen !!") // wh: Meta via Whop Ads (16 nov 2026, Henkjan: "Zet cadoly campagne op met 20 te testen ads") // mg: MGID native (4 nov 2026, Henkjan: "Zet voor morgen MGID op voor 10 kansrijke producten")
const netVan = src => /mondiad/.test(src) ? 'md' : /propeller/.test(src) ? 'pa' : /richads/.test(src) ? 'ra' : /clickadu/.test(src) ? 'ca' : /mgid/.test(src) ? 'mg' : /tiktok/.test(src) ? 'tt' : /^pinterest$/.test(src) ? 'pi' : /whop|facebook|instagram|^meta$|^fb$/.test(src) ? 'wh' : /^(bing|microsoft|msads)$/.test(src) ? 'bi' : 'x'; // tt: TikTok (16 nov 2026, Henkjan: "Ik wil vandaag Tiktok advertentie starten")
const plekId = s => { s = String(s || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase().slice(0, 40); return /^(zoneid|siteid|publisherid|sourceid)$/.test(s) ? '' : s; }; // Mondiad en PropellerAds: cijfers; RichAds: site-id van 32 tekens
const NAAM = 'SHOP-LUS'; // elke campagne met dit in de naam hoort bij de lus
const ACC = { acc: '#1e3a8a', acc2: '#e8edfb', accD: '#a5b4fc', acc2D: '#161b33' };
const E = (k, d) => { const v = Number(process.env[k]); return Number.isFinite(v) && v > 0 ? v : d; };
const MD_MAX_BOD = () => E('SHOP_MD_MAX_BOD', 0.05), MD_BIJVUL = () => E('SHOP_MD_BIJVUL', 10), MIN_SALDO = () => E('SHOP_MIN_SALDO', 5), NIEUWE_ADS_PER_DAG = () => E('SHOP_NIEUWE_ADS', 2), MAX_ADS_PER_CAMPAGNE = () => E('SHOP_MAX_ADS', 10), LEK = () => E('SHOP_LEK', 2);
const K = { babitakey: 'hjdk:shop:babitakey', cat: 'hjdk:shop:cat', ads: 'hjdk:shop:ads', top: 'hjdk:shop:top', crmap: 'hjdk:shop:crmap', log: 'hjdk:shop:log', palog: 'hjdk:shop:palog', ralog: 'hjdk:shop:ralog', calog: 'hjdk:shop:calog', laatste: 'hjdk:shop:laatste', lessen: 'hjdk:shop:lessen', zwart: n => 'hjdk:shop:zwart:' + n, lock: 'hjdk:shop:lock', dag: d => 'hjdk:shop:dag:' + d, snap: d => 'hjdk:shop:snap:' + d, rec: c => 'hjdk:shc:' + c, sleutel: 'hjdk:shop:sleutel', statuskey: 'hjdk:shop:statuskey', set: (s, n) => 'hjdk:shop:set:' + s + (n ? ':' + n : ''), hll: (n, z) => 'hjdk:shop:hll:' + n + ':' + z };
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
const inc = async (keys, rec) => { try { if (rec && rec.s === 'tt' && rec.p && !rec.vk) { const pre = 'sh-p-' + pk(rec.p) + '-'; keys = keys.concat(keys.filter(k => k.startsWith(pre)).map(k => 'sh-tt-p' + pk(rec.p) + '-' + k.slice(pre.length))); } if (keys.length) await kv.incrMany(pinCohortEntries(rec, keys.map(k => ['c:' + k, 1]))); } catch (e) {} }; // 17 nov: TikTok ook per product apart (sh-tt-p<pid>-*), voor de dagelijkse producttest
const sadd = async (key, ...members) => { const m = members.filter(Boolean).map(String); if (!m.length) return; try { await kv.raw(['SADD', key, ...m]); } catch (e) {} };
const smembers = async key => { try { return (await kv.raw(['SMEMBERS', key])) || []; } catch (e) { return []; } };
async function log(e) { try { const l = (await kv.get(K.log)) || []; l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set(K.log, l.slice(0, 500)); } catch (x) {} }
let OIDC = '';

// ---------------- catalogus ----------------
let CAT = null, CAT_AT = 0;
const tijdMs = v => { if (v == null || v === '') return 0; if (typeof v === 'number' || /^\d+(\.\d+)?$/.test(String(v))) { const n = Number(v); return n > 1e12 ? n : n > 1e9 ? n * 1000 : 0; } const t = Date.parse(String(v)); return Number.isFinite(t) ? t : 0; }; // launched_at of created_at van de shop, als milliseconden (4 nov: voor Nieuw bij Kadoly op de gids)
const compactBasis = x => ({ id: String(x.id), t: String(x.title || '').trim(), p: num(x.price), pf: !!x.price_from, op: x.original_price ? num(x.original_price) : 0, b: String(x.brand || '').trim(), c: String(x.shop_category || ''), s: String(x.shop_sub || ''), img: String(((x.photos || [])[0] || {}).src || '').split('?')[0], v: num(x.views), f: num(x.favourites), sc: num(x.score), l: tijdMs(x.launched_at) || tijdMs(x.created_at), r: num(x.rating), rc: num(x.rating_count), fs: !!x.free_shipping });
// Velden die de shop er op verzoek bij levert (zie /api/shop/briefing). Ontbreekt een veld, dan blijft het weg en rekent de lus zonder.
// Openbaar: in_stock, delivery_days, shipping_cost. Afgeschermd (alleen met header X-Lus-Key): sold_7d, sold_30d, cart_7d, margin of cost_price.
const VELDEN = [['vr', 'in_stock'], ['lt', 'delivery_days'], ['vk', 'shipping_cost'], ['so7', 'sold_7d'], ['so30', 'sold_30d'], ['ca7', 'cart_7d'], ['mg', 'margin']];
const compact = x => { const o = compactBasis(x); if (x.in_stock != null) o.vr = !(x.in_stock === false || x.in_stock === 0 || x.in_stock === '0' || x.in_stock === 'false'); if (x.delivery_days != null) o.lt = num(x.delivery_days); if (x.shipping_cost != null) o.vk = num(x.shipping_cost); if (x.sold_7d != null) o.so7 = num(x.sold_7d); if (x.sold_30d != null) o.so30 = num(x.sold_30d); if (x.cart_7d != null) o.ca7 = num(x.cart_7d); const mg = x.margin != null ? num(x.margin) : x.cost_price != null ? num(x.price) - num(x.cost_price) : null; if (mg != null) o.mg = Math.round(mg * 100) / 100; return o; };
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const shopKop = () => Object.assign({ 'user-agent': UA, accept: 'application/json', 'accept-language': 'nl-NL,nl;q=0.9' }, process.env.SHOP_FEED_KEY ? { 'x-lus-key': process.env.SHOP_FEED_KEY } : {});
const K_UIT = 'hjdk:shop:uitverkocht';
async function catalog(vers) {
  if (!vers && CAT && Date.now() - CAT_AT < 300000) return CAT;
  let c = null; try { c = await kv.get(K.cat); } catch (e) {}
  if (!c || !Array.isArray(c.items) || !c.items.length) c = { at: 0, items: seed.items.map(i => Object.assign({ v: 0, f: 0, sc: 0, l: 0 }, i)), terugval: true };
  try { zetMarge(c.items, await kv.get(K_KOST)); } catch (e) {} // marge uit de inkoopprijzen die de shop doorgeeft (lib/shopmarge.js), met de live prijs
  // 12 nov (Henkjan: "Zoek uit wat hier mis gaat"): de catalogus zegt voorraad, maar Orderchamp weigert bij het plaatsen ("This item just
  // sold out"). Clickmind meldt dat vanaf de afrekenpagina (op=uitverkocht); zo'n product telt 2 dagen als uitverkocht voor campagnes, dagkeuze en gids.
  try { const m = await kv.get(K_UIT); const nu = Date.now(); if (m) for (const it of c.items) if (m[it.id] && nu - m[it.id] < 2 * 864e5) { it.vr = false; it.uit = m[it.id]; } } catch (e) {}
  CAT = c; CAT_AT = Date.now(); return c;
}
async function bewaarCatalogus(items, bron, extra) {
  const c = Object.assign({ at: Date.now(), bron, items }, extra || {}); await kv.set(K.cat, c); CAT = c; CAT_AT = Date.now();
  try { if (!(await kv.get(K.snap(DAY())))) { const s = {}; items.forEach(i => { if (i.v || i.f) s[i.id] = [i.v, i.f]; }); await kv.set(K.snap(DAY()), s, { ex: 40 * 86400 }); } } catch (e) {}
  return c;
}
async function haalFeed() {
  // datapagina van de shop (briefing bovenaan Babita's pagina): inkoop per product en de bestellingen met kenmerk
  try { const r = await fetch(SHOP + '/api/lus-feed', { headers: shopKop() }); const st = { at: Date.now(), status: r.status, metSleutel: !!process.env.SHOP_FEED_KEY, sleutelLengte: String(process.env.SHOP_FEED_KEY || '').length, vingerafdruk: process.env.SHOP_FEED_KEY ? createHash('sha256').update(String(process.env.SHOP_FEED_KEY)).digest('hex').slice(0, 8) : null };
    if (!r.ok) { try { st.antwoord = (await r.text()).replace(/\s+/g, ' ').slice(0, 160); } catch (e) {} }
    if (r.ok) { const j = await r.json(); const prod = Array.isArray(j.products) ? j.products : Array.isArray(j.items) ? j.items : []; const orders = Array.isArray(j.orders) ? j.orders : [];
      const mk = await margeOntvang(kv, { items: prod.filter(x => x && (x.cost_price != null || x.margin != null)) }); st.producten = prod.length; st.metInkoop = mk.opgeslagen;
      st.orders = orders.slice(0, 500).map(o => ({ id: String(o.order_id || o.id || '').slice(0, 40), at: String(o.created_at || o.date || '').slice(0, 25), p: String(o.product_id || '').slice(0, 30), n: num(o.quantity || 1), v: num(o.amount), hj: String(o.hj || '').replace(/[^a-z0-9]/gi, '').slice(0, 14), s: String(o.status || '').slice(0, 20), m: String(o.payment_method || '').slice(0, 16) }));
      st.sleutels = Object.keys(j).slice(0, 20); st.prodVelden = prod[0] ? Object.keys(prod[0]).slice(0, 40) : []; st.orderVelden = orders[0] ? Object.keys(orders[0]).slice(0, 40) : [];
      st.betaald = st.orders.filter(o => /paid|betaald/i.test(o.s)).length; st.metHj = st.orders.filter(o => o.hj).length;
      // controle achteraf: elke betaalde bestelling met kenmerk telt, ook als de directe melding vanuit de shop niet afging (hooguit 9 dagen terug)
      let nagemeld = 0; for (const o of orders.slice(0, 500)) { const hj = String(o.hj || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); if (!hj || !/paid|betaald/i.test(String(o.status || ''))) continue; const at = Date.parse(o.paid_at || o.created_at || '') || 0; if (at && Date.now() - at > 9 * 864e5) continue;
        try { const r = await pxVerwerk(hj, 'koop', num(o.amount), String(o.order_id || o.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'feed', o.payment_method || o.methode, 'feed', at || undefined); if (r && !r.dubbel) nagemeld++; } catch (e) {} }
      st.nagemeld = nagemeld; }
    await kv.set('hjdk:shop:lusfeed', st); } catch (e) { try { await kv.set('hjdk:shop:lusfeed', { at: Date.now(), fout: String(e.message || e).slice(0, 120) }); } catch (x) {} }
  try { return await kv.get('hjdk:shop:lusfeed'); } catch (e) { return null; }
}
async function sync() { // de shop zelf vertelt wat er te koop is, wat het kost en wat bekeken/bewaard wordt
  const items = []; let off = 0, totaal = null; const t0 = Date.now();
  // 10 nov 2026: grens van 200 naar 600 pagina's (24 per pagina, dus tot 14.400 producten): bij 200 pagina's viel alles boven 4.800 weg.
  // Te traag of afgekapt: niets opslaan, de vorige catalogus blijft staan (anders verdwijnen producten ten onrechte).
  for (let i = 0; i < 600; i++) {
    if (Date.now() - t0 > 270e3) throw new Error('shop-sync te traag na ' + items.length + ' producten');
    const r = await fetch(SHOP + '/api/shop?lang=nl&offset=' + off, { headers: shopKop() });
    if (!r.ok) throw new Error('shop gaf HTTP ' + r.status);
    const j = await r.json(); const l = j.items || []; l.forEach(x => items.push(compact(x))); if (j.total != null) totaal = Number(j.total);
    if (j.next == null || !l.length) break; off = j.next;
  }
  if (totaal && items.length < totaal * 0.9) throw new Error('shop-sync onvolledig: ' + items.length + ' van ' + totaal);
  if (items.length < 10) throw new Error('shop gaf maar ' + items.length + ' producten');
  // wat staat er al van de briefing? (voor de vinkjes op /api/shop/briefing)
  const velden = {}; for (const [k, n] of VELDEN) velden[n] = items.filter(i => i[k] !== undefined).length;
  let devKnop = null; try { const h = await (await fetch(SHOP, { headers: { 'user-agent': UA, 'accept-language': 'nl-NL,nl;q=0.9' } })).text(); devKnop = h.includes('sh-dev-add'); } catch (e) {}
  let zoek = null; try { const r = await fetch(SHOP + '/api/search-terms?days=7', { headers: shopKop() }); if (r.ok) { const j = await r.json(); const l = Array.isArray(j) ? j : (j.items || j.terms || []); zoek = l.map(x => ({ t: String(x.term || x.q || '').toLowerCase().trim().slice(0, 60), n: num(x.count), r: x.results == null ? null : num(x.results) })).filter(x => x.t).slice(0, 50); } } catch (e) {}
  await haalFeed();
  return bewaarCatalogus(items, 'shop', { velden, devKnop, zoek, engels: items.filter(i => engels(i.t)).length });
}
async function geheim() { let s = process.env.SHOP_SLEUTEL || ''; if (!s) { try { s = (await kv.get(K.sleutel)) || ''; } catch (e) {} } return String(s || ''); }

// ---------------- thema's en rangorde ----------------
const mmdd = () => new Date().toISOString().slice(5, 10);
const inSeizoen = t => { const n = mmdd(); return t.van <= t.tot ? n >= t.van && n <= t.tot : n >= t.van || n <= t.tot; };
// vaste producten in de dagkeuze (10 nov, Henkjan: "Teveel kerst halveer en maak andere helft allemaal sinterklaas . VINDT DEMAND !"; Demand Radar NL:
// sinterklaas cadeautjes 40.500 per maand, surprise knutselen 5.400). De shoptest in propellerads-mcp kiest daaruit met NIEUWKEUZE.
const VAST_DAG = { '2026-11-16': ['oc_4174005832564737', 'oc_4174005817786369', 'oc_4174005947219969', 'oc_4174005845344257', 'oc_4174005947613185', 'oc_4174005817131010', 'oc_4174004461895681', 'oc_4174003462815745'], /* 16 nov (Henkjan: "Zet campagne aan en doe vooral juwelen achtige dingen met een mix van meeste winkelmandjes doe 20 slots met dus 8 ads ." en "50% NL rest andere landen"): NL = 6 sieraden van Vivi + de 2 producten met de meeste mandjes in 14 dagen (muursticker 6, Doppio 5) + 2 remarketing; 10 buitenland in propellerads-mcp lib/buitenland.ts */ '2026-11-13': ['oc_4174004537769985', 'oc_4174003416580097', 'oc_4173957649006593', 'oc_4174004650409987', 'oc_4174004477607938', 'oc_4174003462815745', 'oc_4173959354744833', 'oc_4173959369080833', 'oc_4173959229243393', 'oc_4173958884671489', 'oc_4174004527562753'], /* 13 nov (Henkjan 12 nov: "Ja start buitenland en nieuw NL en neem geleerde vooral mee ."): de 10 NL-producten van propellerads-mcp PRECIES */ '2026-11-12': ['oc_4174004537769985', 'oc_4174004527562753', 'oc_4174004519092225', 'oc_4173957649006593', 'oc_4174003416580097', 'oc_4174002184486913', 'oc_4174004650409987', 'oc_4174004571406337', 'oc_4174004519501825', 'oc_4174004654489602'], '2026-11-11': ['oc_4174004527562753', 'oc_4174004652687361', 'oc_4174004537769985', 'oc_4174004519092225', 'oc_4174003416580097', 'oc_4173958884671489', 'oc_4174002184486913', 'oc_4173957649006593', 'oc_4174004320108545', 'oc_4174004650409987'], '2026-11-10': ['oc_4174004652687361', 'oc_4174004537769985', 'oc_4174004527562753', 'oc_4174004519092225'] }; // 11 nov (Henkjan: "Ga voor 20"): de 10 van vandaag, ook als ze al veelbelovend zijn, zodat ze eerst hun verkoopteksten krijgen
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
// Haiku voor korte advertentieteksten (env SHOP_TEKST_MODEL); Sonnet alleen voor de lessen uit de cijfers (redeneren over data; env SHOP_LES_MODEL).
// Zelfde vraag met dezelfde invoer binnen de bewaartijd: antwoord uit Redis, geen nieuwe aanroep.
function jsonUitTekst(s) { const a = s.indexOf('{'); if (a < 0) return null; let d = 0, q = false, e = false, eind = -1; for (let i = a; i < s.length; i++) { const ch = s[i]; if (q) { if (e) e = false; else if (ch === '\\') e = true; else if (ch === '"') q = false; continue; } if (ch === '"') q = true; else if (ch === '{') d++; else if (ch === '}') { d--; if (d === 0) { eind = i; break; } } } return JSON.parse(s.slice(a, (eind > 0 ? eind : s.lastIndexOf('}')) + 1)); }
// Verkoopteksten voor de gekozen producten (Henkjan 29 okt: "Dit zijn toch geen teksten ??? Dan wil niemand het kopen ..."): per product
// 10 advertenties van Claude volgens de tekstregels (lib/shoptekst.js), 3 dagen bewaard; hooguit 40 seconden per aanroep (150 bij een verse dagkeuze), de rest
// houdt de sjablonen tot de volgende aanroep. Model: SHOP_VERKOOP_MODEL, anders Haiku (29 okt: tokens sparen; de keuring en de lessen uit de cijfers houden de kwaliteit).
async function metVerkoop(lijst, budget = 40000) {
  const t0 = Date.now(), alle = (lijst || []).filter(p => p && p.pid), vn = VAST_DAG[DAY()] || [], eerst = p => p.hoe === 'vast' || vn.includes(p.pid), todo = alle.filter(eerst).concat(alle.filter(p => !eerst(p))).slice(0, 90); let ai = 0; // 10 nov: vaste producten eerst, anders vielen ze buiten de 90
  const lessen = await kv.get('hjdk:shop:tekstlessen').catch(() => null); // beste en slechtste teksten van de PropellerAds-lus (lib/tekstleer.ts)
  for (let i = 0; i < todo.length && Date.now() - t0 < budget; i += 12) await Promise.all(todo.slice(i, i + 12).map(async p => { try { const a = await verkoopTeksten(kv, p, claudeJson, process.env.SHOP_VERKOOP_MODEL || HAIKU, lessen); if (a) { p.advertenties = a; ai++; } } catch (e) {} }));
  return ai;
}
async function claudeJson(prompt, o) {
  o = o || {}; const model = o.model || process.env.SHOP_TEKST_MODEL || HAIKU;
  try { const r = await berichten({ fn: o.fn || 'shop', model, user: prompt, max: o.max || 900, cacheTtl: o.cacheTtl, check: t => jsonUitTekst(t), oidc: OIDC, directKey: process.env.ANTHROPIC_API_KEY });
    return jsonUitTekst(r.txt); }
  catch (e) { try { await kv.set('hjdk:shop:claudefout', { at: new Date().toISOString(), model, status: e.status || 0, fout: String(e.message || e).slice(0, 300) }, { ex: 7 * 86400 }); } catch (x) {} }
  return null;
}
const kortTitel = it => { let t = it.t.replace(/\s+(van|by|door)\s+[A-Z][\w .&-]+$/, '').replace(/\s+(Art Bizniz|Mica Decorations|Soeji|Housevitamin|Label2X)\b.*$/i, '').replace(/\s+\d+([.,]\d+)?\s?x\s?\d+.*$/i, '').trim(); if (t.length > 30) t = t.slice(0, 31).replace(/\s+\S*$/, ''); return t; };
async function nieuweTekst(it, beste, bestaand) {
  const j = await claudeJson(`Schrijf 3 Nederlandse push-advertenties voor dit product van Kadoly (webshop, verzonden vanuit Europa, 14 dagen retour): "${it.t}" van ${it.b || 'onbekend merk'}, ${eur(it.p)}${it.pf ? ' (vanaf-prijs)' : ''}, categorie ${it.c}/${it.s}. Vandaag is het ${DAY()}.
Wat tot nu toe het meest doorklikte naar de shop: ${beste.length ? beste.map(b => '"' + b.title + '" / "' + b.desc + '"').join('; ') : 'nog niets bekend'}.
Regels: titel hooguit 30 tekens, tekst hooguit 40 tekens. Eerlijk: verzin geen eigenschappen die niet in de productnaam staan, geen nep-urgentie, geen 'gratis', geen korting noemen. Noem de prijs alleen exact zoals hierboven. Concreet en nieuwsgierig makend, elke variant een andere invalshoek (cadeau, seizoen of moment, zelf doen, sfeer in huis). Gewone spreektaal, geen uitroeptekens. Antwoord alleen JSON: {"varianten":[{"title":"","desc":""}]}`, { fn: 'shop-advertentietekst', max: 400, cacheTtl: 3 * 86400 });
  const al = new Set(bestaand.map(a => a.title.toLowerCase()));
  const v = (j && Array.isArray(j.varianten) ? j.varianten : []).map(x => ({ title: String(x.title || '').trim(), desc: String(x.desc || x.description || '').trim() })).filter(x => x.title && x.desc && x.title.length <= 30 && x.desc.length <= 40 && !al.has(x.title.toLowerCase()));
  if (v.length) return Object.assign({ bron: 'claude' }, v[0]);
  const t = kortTitel(it); return al.has(t.toLowerCase()) ? null : { title: t, desc: ('Nu bij Kadoly voor ' + eur(it.p)).slice(0, 40), bron: 'sjabloon' };
}
async function advertenties() { let a = null; try { a = await kv.get(K.ads); } catch (e) {} if (!Array.isArray(a) || !a.length) { a = seed.ads.map(x => Object.assign({ at: Date.now(), bron: 'start' }, x)); try { await kv.set(K.ads, a); } catch (e) {} }
  let ver = false; for (const s of seed.ads) { const x = a.find(q => q.pid === s.pid && q.title === s.title); if (!x) { a.push(Object.assign({ at: Date.now(), bron: 'start' }, s)); ver = true; } else if (x.bron === 'start' && x.desc !== s.desc) { x.desc = s.desc; ver = true; } } // startteksten volgen het bestand (PropellerAds: tekst hooguit 40 tekens)
  if (ver) { try { await kv.set(K.ads, a); } catch (e) {} } return a; }
// Zelfde tekst, met de prijs vervangen door de actuele prijs. Alleen als de tekst binnen de maten blijft (titel 30, tekst 40 tekens).
const metNieuwePrijs = (a, p) => { const re = /€\s?\d+(?:[.,]\d{1,2})?/; const t = String(a.title).replace(re, eur(p)), d = String(a.desc).replace(re, eur(p)); return (t !== a.title || d !== a.desc) && t.length <= 30 && d.length <= 40 ? { title: t, desc: d } : null; };
const prijsInTekst = a => { const m = (a.title + ' ' + a.desc).match(/€\s?(\d+(?:[.,]\d{1,2})?)/); return m ? Number(m[1].replace(',', '.')) : null; };
const beeld = (pid, t) => LAND() + '/api/shop/img?p=' + encodeURIComponent(pid) + '&t=' + t;

// ---------------- tellers per netwerk ----------------
const SOORTEN = ['view', 'mens', 'eng', 'klik', 'conv', 'cart', 'koop', 'omzet', ...SOORTEN_DIRECT]; // view/mens/eng/klik = alleen de landingspagina; dv = aangekomen via de directe route
async function tellers(net, soort, ids) { const out = {}; if (!ids.length) return out; const keys = []; ids.forEach(z => SOORTEN.forEach(s => keys.push('c:sh-' + net + '-' + soort + z + '-' + s))); const vals = []; for (let i = 0; i < keys.length; i += 490) vals.push(...await kv.mget(...keys.slice(i, i + 490))); ids.forEach((z, i) => { const o = {}; SOORTEN.forEach((s, j) => { o[s] = num(vals[i * SOORTEN.length + j]); }); out[z] = o; }); return out; }
// Aantal verschillende apparaten per plek (alleen voor plekken met genoeg bezoekers). Zet het in o.uniek.
async function metUniek(net, zones) { for (const [z, o] of Object.entries(zones)) { if (num(o.view) < 20) continue; try { const n = num(await kv.raw(['PFCOUNT', K.hll(net, z)])); if (n > 0) { o.uniek = n; o.uniekVan = num(await kv.get('c:sh-' + net + '-z' + z + '-hv')) || 0; } } catch (e) {} } return zones; }
// Hoe de productpagina en de afrekenpagina er nu bij staan, gemeten als Nederlandse telefoon zonder account. Hooguit eens per uur opgehaald.
async function shopStand(pid) {
  const key = 'hjdk:shop:stand2:' + pid; try { const c = await kv.get(key); if (c && Date.now() - c.at < 36e5) return c; } catch (e) {}
  const kop = { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'accept-language': 'nl-NL,nl;q=0.9' };
  const haal = async pad => { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 6000); try { const r = await fetch('https://kadoly.com' + pad, { headers: kop, signal: ac.signal }); return r.ok ? await r.text() : ''; } catch (e) { return ''; } finally { clearTimeout(t); } };
  const [p, c] = await Promise.all([haal('/product/' + pid + '?lang=nl'), haal('/shop/checkout/' + pid + '?lang=nl')]);
  if (!p || !c) return null;
  const has = (h, x) => h.includes(x); const fotos = (p.match(/"photos":\[(.*?)\],"/) || [])[1]; const ship = (p.match(/"ship_days":"([^"]*)"/) || [])[1] || null;
  const o = { at: Date.now(), gast: has(c, 'Geen account nodig'), afrekenNl: has(c, 'Totaal te betalen') && !has(c, 'Total to pay'), geenFee: has(p, '"buyer_protection":false') || has(c, '"buyer_protection":false'),
    koopblokBoven: has(p, '.pdp > .buybox{order:2}'), balkVanafStart: has(p, 'from the start, except while'), bundelLeeg: has(p, "row(self, 'is-this', true, true) + opts.map((p) => row(p, '', false, false))"),
    thuisbezorgd: has(p, 'Thuisbezorgd'), idealBijKnop: has(p, 'Betalen met iDEAL'), geldTerug: has(p, 'Niet goed? Geld terug'), verkoper: has(p, 'Verkocht door Yoors Shop'), adres: has(p, '2805 AB Gouda'),
    affiliate: has(p, 'Maak content over dit product'), registreren: has(p, '>Registreren<') || has(p, 'Registreren</a>'), sportBuiten: /"category":"Sports (&|\\u0026|&amp;) outdoors"/.test(p) || /class="crumb"[\s\S]{0,600}Sport (&amp;|&) buiten/.test(p), motorUitleg: has(p, 'batterijmotor') && !/niet meegeleverd|zit er niet bij/i.test(p),
    fotos: fotos ? (fotos.match(/"src"/g) || []).length : null, shipDays: ship, afrekenDagen: (c.match(/Thuisbezorgd, ([0-9–-]+ werkdagen)/) || [])[1] || null, shippingCost: (p.match(/"shipping_cost":([^,]*),/) || [])[1] || null };
  try { await kv.set(key, o, { ex: 6 * 3600 }); } catch (e) {} return o;
}
async function dagTotaal(dag) { const nets = ['md', 'pa', 'ra', 'ca', 'mg', 'tt', 'wh', 'pi', 'x']; const keys = []; nets.forEach(n => SOORTEN.forEach(s => keys.push('c:sh-d' + dag.replace(/-/g, '') + '-' + n + '-' + s))); const v = await kv.mget(...keys); const out = {}; nets.forEach((n, i) => { out[n] = {}; SOORTEN.forEach((s, j) => { out[n][s] = num(v[i * SOORTEN.length + j]); }); }); return out; }
async function netTotaal() { const nets = ['md', 'pa', 'ra', 'ca', 'mg', 'tt', 'wh', 'pi', 'x']; const keys = []; nets.forEach(n => SOORTEN.forEach(s => keys.push('c:sh-' + n + '-' + s))); const v = await kv.mget(...keys); const out = {}; nets.forEach((n, i) => { out[n] = {}; SOORTEN.forEach((s, j) => { out[n][s] = num(v[i * SOORTEN.length + j]); }); }); return out; }
// Oordeel over een advertentieplek. netKliks = kliks volgens het netwerk, o = onze eigen tellers.
// Directe route (lib/shopdirect.js): aangekomen = view (landingspagina) + dv (direct). Zodra cm.js op yoo.rs meet (meet), tellen dm (echt mens
// op de shop) en da (eerste tik op de shop) mee als mens en doorklik; daarvoor oordelen we over mensen en doorkliks alleen op de landingspagina.
function plekOordeel(netKliks, o, gemKlik, meet = false) {
  const dv = num(o.dv), aan = o.view + dv, V = o.view + (meet ? dv : 0), M = o.mens + (meet ? num(o.dm) : 0), K = o.klik + (meet ? num(o.da) : 0), E = o.eng + (meet ? num(o.dm) : 0);
  if (netKliks >= 15 && aan < 0.4 * netKliks) return { uit: `nep: ${netKliks} kliks volgens het netwerk, maar ${aan} kwamen aan` };
  if (V >= 12 && M < 0.25 * V) return { uit: `geen echte mensen: van ${V} bezoekers bewogen er maar ${M}` };
  if (V >= 6 && M === 0) return { uit: `geen echte mensen: ${V} bezoekers en niemand bewoog of tikte` };
  if (o.view >= 50 && o.klik >= 0.5 * o.view && !num(o.koop)) return { uit: `onnatuurlijk: ${o.klik} van ${o.view} bezoekers klikten door, geen verkoop` };
  if (num(o.uniekVan) >= 30 && num(o.uniek) > 0 && o.uniek < 0.34 * o.uniekVan) return { uit: `steeds dezelfde apparaten: ${o.uniekVan} bezoeken vanaf ${o.uniek} apparaten` };
  if (V >= 40 && K === 0 && E <= 1) return { uit: `${V} bezoekers, niemand bleef en niemand klikte door naar de shop` };
  if (V >= 120 && K === 0) return { uit: `${V} bezoekers en geen enkele doorklik` };
  const rate = V ? K / V : 0;
  if (o.koop > 0) return { goed: 2 }; if (V >= 25 && K >= 3 && rate >= 1.5 * gemKlik) return { goed: 1.5 }; if (V >= 25 && M >= 0.6 * V && E >= 0.3 * V) return { goed: 1.25 };
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
  for (const a of ads) { if (a.uit) { const it0 = perId[a.pid]; const nw0 = it0 && /^prijs is nu/.test(a.uit) ? metNieuwePrijs(a, it0.p) : null; // eerder uitgezet om de prijs: alsnog een bijgewerkte tekst
      if (nw0 && !ads.some(x => x.pid === a.pid && x.title === nw0.title && x.desc === nw0.desc)) { ads.push({ pid: a.pid, title: nw0.title, desc: nw0.desc, at: Date.now(), bron: 'prijs bijgewerkt' }); adsVer = true; B('advertentie bijgewerkt', nw0.title, `"${nw0.title}" / "${nw0.desc}"`); }
      continue; }
    const it = perId[a.pid]; const pr = prijsInTekst(a);
    if (!it && !cat.terugval) { a.uit = 'product niet meer in de shop'; adsVer = true; B('advertentie uit', a.title, a.uit); }
    else if (it && pr != null && Math.abs(pr - it.p) > 0.005) { a.uit = `prijs is nu ${eur(it.p)}, in de tekst staat ${eur(pr)}`; adsVer = true; B('advertentie uit', a.title, a.uit);
      // dezelfde tekst met de nieuwe prijs komt ervoor in de plaats, zodat een advertentie die werkt niet verdwijnt
      const nw = metNieuwePrijs(a, it.p); if (nw && !ads.some(x => x.pid === a.pid && x.title === nw.title && x.desc === nw.desc)) { ads.push({ pid: a.pid, title: nw.title, desc: nw.desc, at: Date.now(), bron: 'prijs bijgewerkt' }); B('advertentie bijgewerkt', nw.title, `"${nw.title}" / "${nw.desc}"`); } } }
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
    for (const pid of kand) { if (ruimte <= 0) break; const it = perId[pid]; const t = droog ? { title: kortTitel(it), desc: 'Nu bij Kadoly voor ' + eur(it.p), bron: 'droog' } : await nieuweTekst(it, besteAds, ads); if (!t) continue;
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
    const zs = [...new Set([...Object.keys(zMd), ...await smembers(K.set('z', 'md'))])]; const eigen = await metUniek('md', await tellers('md', 'z', zs)); const meetShop = (await shopMeet(kv)).aan;
    let tv = 0, tk = 0; zs.forEach(z => { tv += eigen[z].view; tk += eigen[z].klik; }); const gem = tv >= 30 ? tk / tv : 0.08;
    const zwart = new Set(((await kv.get(K.zwart('md'))) || []).map(String)); const goed = {}; let nieuwZwart = 0;
    for (const z of zs) { if (zwart.has(z)) continue; const o = plekOordeel((zMd[z] || {}).kliks || 0, eigen[z], gem, meetShop); if (o.uit) { zwart.add(z); nieuwZwart++; B('plek uit (Mondiad)', z, o.uit); } else if (o.goed) goed[z] = o.goed; }
    const campTel = await tellers('md', 'k', mdCamps.map(c => String(c.id))); const loopt = (await kv.get('hjdk:shop:loopt')) || {};
    for (const pc of Object.values(per)) { const c = pc.c; let det = null; try { det = (rows(await md('mondiad_get_campaign_details', { ids: [String(c.id)] })) || [])[0]; } catch (e) {} if (!det) continue;
      const crs = det.creatives || []; for (const x of crs) { const a = ads.find(q => q.title === x.title && q.desc === x.description) || ads.find(q => q.title === x.title); if (a) { crmap['md:' + x.id] = a.pid; crmap['t:md:' + x.id] = a.title; } }
      if (/PAUSED|REJECTED|ARCHIVED|DRAFT/i.test(c.status)) continue;
      const eigenC = campTel[String(c.id)] || {}; const isCpa = String(c.bidType || det.bidType || '').toUpperCase() === 'CPA'; const bod = num(det.bid);
      // lek: vandaag geld uit, niemand klikt door naar de shop -> stilzetten. Met de directe route telt alleen het deel van het geld dat bij de landingspagina hoort,
      // tot cm.js op yoo.rs meet; daarna telt de eerste tik op de productpagina (da) mee als doorklik.
      const deelL = landDeel(eigenC, meetShop), doorC = doorkliks(eigenC, meetShop), kL = pc.kosten * deelL, kLv = pc.vandaag.kosten * deelL;
      if ((kLv >= LEK() && !doorC) || (kL >= 3 * LEK() && kL / Math.max(1, doorC) > 0.6)) { B('campagne stil (Mondiad)', c.id + ' ' + c.name.slice(0, 50), `$${pc.kosten.toFixed(2)} uitgegeven (vandaag $${pc.vandaag.kosten.toFixed(2)}${deelL < 1 ? ', waarvan ' + Math.round(deelL * 100) + '% via de landingspagina' : ''}) tegen ${doorC} doorkliks naar de shop`); if (!droog) { try { await md('mondiad_update_campaign', { json: JSON.stringify({ id: c.id, status: 'PAUSED' }) }); } catch (e) { B('fout', 'stilzetten ' + c.id, String(e.message).slice(0, 120)); } } continue; }
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
  const nets = ['md', 'pa', 'ra', 'ca', 'mg']; const cr = {}; for (const n of nets) cr[n] = await tellers(n, 'a', await smembers(K.set('a', n)));
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
  const rommel = l => /\.\.\.|…|niet precies/i.test(l); const slecht = oud && (oud.lessen || []).some(rommel);
  if (droog || bezoekers < 40 || (oud && oud.dag === DAY() && !slot && !slecht && bezoekers < 1.5 * num(oud.bezoekers) && doorkliks < 1.5 * num(oud.doorkliks) + 5)) return oud;
  let meetKoop = false; try { meetKoop = !!(await kv.get('hjdk:shop:pxlaatst:koop')) || !!(await kv.get('hjdk:shop:pxlaatst:cart')); } catch (e) {}
  const plekTop = Object.entries(inz.plekken || {}).flatMap(([n, l]) => l.slice(0, 4).map(z => ({ netwerk: NETTEN[n], plek: z.plek, bezoekers: z.bezoekers, echteMensen: z.mensen, doorkliks: z.doorkliks })));
  const j = await claudeJson(`Je bent mediabuyer voor Kadoly (Nederlandse webshop). Hieronder de cijfers van betaald push-verkeer via een landingspagina: per thema, per advertentie, per uur en per netwerk. "doorklik" = de bezoeker klikte door naar de productpagina in de shop. Schrijf hooguit 6 lessen in gewoon Nederlands, elk een zin van hooguit 25 woorden, concreet en met het getal erbij. Alleen wat de cijfers echt laten zien; bij minder dan 30 bezoekers op een regel trek je geen conclusie. Geen jargon, geen opsommingstekens, geen gedachtestreepjes. Komt het grootste deel van de doorkliks van een enkele advertentieplek, zeg dat dan eerlijk in een van de lessen: de cijfers per advertentie zijn dan minder betrouwbaar. ${meetKoop ? '' : 'Let op: de shop geeft winkelwagen en bestellingen nog niet door, dus die staan op 0 omdat ze niet gemeten worden. Trek daar geen conclusie uit en schrijf niet dat het na de doorklik misgaat; noem hooguit dat aankopen nog niet meetbaar zijn. '}Sluit af met een les over wat we hierna het best kunnen testen.
Cijfers: ${JSON.stringify({ vandaag: dag, totaalDoorkliks: doorkliks, plekken: plekTop, themas: inz.themas, advertenties: inz.advertenties.slice(0, 20).map(a => ({ titel: a.titel, tekst: a.tekst, bezoekers: a.bezoekers, echtPct: a.echtPct, doorkliks: a.doorkliks, bestellingen: a.bestellingen })), uren: inz.uren }).slice(0, 9000)}
Antwoord alleen JSON: {"lessen":["..."]}`, { fn: 'shop-lessen', model: process.env.SHOP_LES_MODEL || SONNET, max: 700 });
  const l = (j && Array.isArray(j.lessen) ? j.lessen : []).map(x => String(x).trim()).filter(x => x && !rommel(x)).slice(0, 6);
  if (!l.length) return oud; const nieuw = { dag: DAY(), at: new Date().toISOString(), bezoekers, doorkliks, lessen: l, eerder: [...(oud && oud.dag !== DAY() ? [{ dag: oud.dag, lessen: oud.lessen }] : []), ...((oud && oud.eerder) || [])].slice(0, 14) };
  try { await kv.set(K.lessen, nieuw); } catch (e) {} return nieuw;
}

// ---------------- een Mondiad-campagne maken voor een thema (de lus beheert hem daarna zelf) ----------------
const MD_UREN = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
// Mondiad per product (Henkjan 20 okt: "we starten helemaal overnieuw"): zelfde opzet als de PropellerAds-shoptest, een campagne per
// product uit de dagkeuze (presterend en veelbelovend eerst), direct naar de productpagina met Clickmind ertussen (p=, arm=d).
// 3 nov 2026 (Henkjan: "Ok test mondiad nu . Go en test ook meerdere vormen daar ."): per product en per vorm een campagne, 8 advertenties
const MD_VORM = { IN_PAGE_PUSH: 'IPP', CLASSIC_PUSH: 'PUSH', NATIVE: 'NATIVE', POP: 'POP' };
const MD_CPC = 0.02, MD_POP_CPM = 1; // NL: zoals de BZZ-push in NL (CPC 0,02); pop per 1000 vertoningen
async function maakMondiadProduct(p, vorm = 'IN_PAGE_PUSH', dagBudget = 5) {
  if (!MD_VORM[vorm]) throw new Error('onbekende vorm ' + vorm);
  const dag = DAY(); const naam = `${NAAM} TEST ${dag} p=${p.pid} | ${String(p.titel || '').slice(0, 40)} | thuis ${num(p.thuis).toFixed(2)} | NL mobiel | ${MD_VORM[vorm]} ${vorm === 'POP' ? 'CPM ' + MD_POP_CPM : 'CPC ' + MD_CPC} | ${p.hoe || ''}`.slice(0, 250);
  const bestaand = rows(await md('mondiad_list_campaigns', { name: 'p=' + p.pid, size: 50, excludeStatuses: ['ARCHIVED', 'ARCHIVED_COMPLETED', 'PAUSED', 'REJECTED', 'FINISHED'], responseFields: ['ID', 'NAME', 'STATUS'] })).find(c => String(c.name).includes('p=' + p.pid) && String(c.name).includes('| ' + MD_VORM[vorm] + ' '));
  if (bestaand) return { bestaatAl: bestaand.id, status: bestaand.status, pid: p.pid };
  const zwart = ((await kv.get(K.zwart('md'))) || []).map(Number).filter(Boolean);
  let creatives = [];
  if (vorm !== 'POP') { // pop heeft geen advertentie: de bezoeker komt meteen op de productpagina
    const icon = vorm === 'NATIVE' ? null : findFile(await md('mondiad_upload_resource_from_url', { resourceType: 'ICON', sourceUrl: beeld(p.pid, 'icon'), fileName: 'sh-' + pk(p.pid).slice(-10) + '-i.jpg' }));
    const image = findFile(await md('mondiad_upload_resource_from_url', { resourceType: 'IMAGE', sourceUrl: beeld(p.pid, 'md'), fileName: 'sh-' + pk(p.pid).slice(-10) + '-b.jpg' }));
    if ((vorm !== 'NATIVE' && !icon) || !image) throw new Error('beelden uploaden mislukt voor ' + p.pid);
    creatives = (p.advertenties || []).slice(0, 8).map((a, i) => ({ title: a.title, description: a.description, icon: icon || null, image, tag: 'sh-' + pk(p.pid).slice(-12) + '-' + MD_VORM[vorm].toLowerCase() + '-' + i, status: 'PENDING', bannerFormat: 'FORMAT_300_250', campaignId: 0 })); // de MCP laat null weg en eist het veld; bannerFormat telt alleen voor banners
    if (creatives.length < 8) throw new Error('minder dan 8 advertenties voor ' + p.pid + ' (Henkjan: overal 8)');
  }
  const dp = {}; ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(d => { dp[d] = MD_UREN; });
  const r = await md('mondiad_create_campaign', { campaign: { name: naam, adType: [vorm], bidType: vorm === 'POP' ? 'CPM' : 'CPC', bid: vorm === 'POP' ? MD_POP_CPM : MD_CPC, cpaGoal: MD_MAX_BOD(), /* de Mondiad-API kent alleen nog CPC en CPM (3 nov); cpaGoal = doel per echt mens */ budget: 20, dailyBudget: dagBudget, zoneIdDailyBudget: 1, status: 'PENDING', runAfterModeration: true,
    url: LAND() + '/shop?utm_source=mondiad&utm_medium=' + MD_VORM[vorm].toLowerCase() + '&utm_campaign=test-' + p.pid.replace(/^oc_/, '').slice(-8) + '&clickid=[clickid]&zoneid=[zoneid]&campaignid=[campaignid]&creativeid=[creativeid]&p=' + encodeURIComponent(p.pid) + '&arm=d',
    countryTargeting: ['NL'], countryTargetingMode: 'WHITE_LIST', deviceTargeting: [4], deviceTargetingMode: 'WHITE_LIST', languageTargeting: [137], languageTargetingMode: 'WHITE_LIST', browserTargeting: [33, 36, 39, 15], browserTargetingMode: 'BLACK_LIST', browserTargetingMap: {}, trafficType: ['MAINSTREAM'], landingPageType: 'MAINSTREAM', connectionType: 'ALL',
    frequencyCap: { frequency: 1, duration: 24, actionType: 'IMPRESSION', actionScope: 'CAMPAIGN' }, dayPartingTimezone: 'Europe/Amsterdam', dayParting: dp, zoneIdListMode: 'BLACK_LIST', zoneIdList: [...new Set([480, 896, 1953, 646, 583, 556, 270, 431, 751, 850, 1812, 277, 437, 533, 1977, 571, 733, ...zwart])], hideReferrer: false, creatives,
    // de Mondiad-MCP eist sinds november elk veld (ook de lege)
    carrierTargeting: [0], carrierTargetingMode: 'WHITE_LIST', countryCustomBids: [], domainList: [], domainListMode: 'BLACK_LIST', endDate: '2027-12-31', geoObjectTargeting: [0], geoObjectTargetingMode: 'WHITE_LIST', ipAddressTargeting: [], ipAddressTargetingMode: 'BLACK_LIST', ispTargeting: [0], ispTargetingMode: 'WHITE_LIST', keywordTargeting: [], keywordTargetingMode: 'WHITE_LIST', maxAge: 0, minAge: 0, offerTypes: [], osTargeting: [0], osTargetingMode: 'WHITE_LIST', osVersionTargeting: [0], startDate: DAY(), subIdCustomBids: [], subIdList: [], subIdListMode: 'BLACK_LIST', subscriptionAgeTargeting: [], zoneCustomBids: [] } });
  const id = r && (r.id || (r.data && r.data.id)); await log({ soort: 'campagne gemaakt (Mondiad, per product, ' + MD_VORM[vorm] + ')', wat: naam, waarom: (vorm === 'POP' ? 'pop zonder advertentie' : creatives.length + ' advertenties') + ', wacht op goedkeuring' });
  return { id, pid: p.pid, vorm: MD_VORM[vorm], naam, status: r && r.status };
}
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
const leesCookie = (req, naam) => { const m = new RegExp('(?:^|;\\s*)' + naam + '=([^;]+)').exec(String(req.headers.cookie || '')); return m ? decodeURIComponent(m[1]) : ''; };
// Directe route: Clickmind logt de klik (server: netwerk, datacenter, TLS-vingerafdruk; bewijs voor terugbetaling) en stuurt in één keer door
// naar de productpagina, met hj (winkelwagen en betaling via de shop) en mmc (Clickmind; cm.js op yoo.rs meldt echt en actie).
// database vol (OOM): meteen de databasewacht, hooguit eens per 5 minuten per instantie (lib/dbwacht.js, 29 okt)
let DB_NOOD = 0;
function dbNood() { if (Date.now() - DB_NOOD < 300000) return; DB_NOOD = Date.now(); laterAf(import('../lib/dbwacht.js').then(m => m.dbWacht(kv, { tijd: 40000 })).catch(() => {})); }
// 17 nov (Henkjan: "Los 1 -5 op"): kadoly.com stuurt /product/<id> met een 301 door naar /product/<naam>; dat kost een laadronde. De naam wordt
// eenmaal opgehaald (op de achtergrond) en 7 dagen bewaard; tot die tijd gaat de bezoeker via het oude adres.
async function slugVan(pid) {
  const k = 'hjdk:shop:slug:' + pid; let sl = null; try { sl = await kv.get(k); } catch (e) {}
  if (sl) return sl === '-' ? '' : String(sl);
  laterAf((async () => { try { const r = await fetch('https://kadoly.com/product/' + encodeURIComponent(pid) + '?lang=nl', { redirect: 'manual', headers: { 'user-agent': UA, 'accept-language': 'nl-NL,nl;q=0.9' }, signal: AbortSignal.timeout(4000) }); const loc = String(r.headers.get('location') || ''); const m = loc.match(/\/product\/([a-z0-9-]{3,140})(?:[?#]|$)/i); if (m && m[1] !== pid) await kv.set(k, m[1], { ex: 7 * 86400 }); else if (r.status === 200) await kv.set(k, '-', { ex: 86400 }); } catch (e) {} })());
  return '';
}
async function direct(req, res, x) {
  const { net, clickid, zone, cr, camp, pid, code, bot } = x; const test = /^test/i.test(clickid);
  // Clickmind weert bots voor de doorstuur (Henkjan 28 okt: "Zorg dat clikmind echt bots blijft killen en filteren en volgende keer
  // niet doorlate"): wie zich als bot meldt, verkeer uit een datacenter en kliks van een botplek (lib/shopbot.js: plek met veel
  // aankomsten en geen echte mensen op kadoly.com) krijgen 403 en komen nooit op de shop. Echte mensen gaan altijd in een keer door
  // (nooit een tussenpagina). Een controle van het netwerk zonder klik-id (moderatie, voorbeeld) wordt niet als datacenter geweerd.
  let weiger = bot ? 'bot' : '';
  if (!weiger && !test && !x.vrij && net !== 'pi' && echteKlikId(clickid) && !/^(ttx|bix)/.test(clickid)) { // 16 nov: TikTok-keuring (geen ttclid, niet betaald) nooit weren, anders keurt TikTok de advertentie af // gidsbezoekers (x.vrij) komen uit Google en kunnen een VPN of kantoornetwerk hebben: alleen zelfverklaarde bots weren
    try { await Promise.race([laadDc(kv), new Promise(r => setTimeout(r, 250))]); } catch (e) {}
    try { if (dcVan(serverSignalen(req)).dc === true) weiger = 'datacenter'; } catch (e) {}
    if (!weiger) { try { if (await isBotZone(kv, net, zone)) weiger = 'botplek'; } catch (e) {} }
  }
  const prefetch = /prefetch|prerender/i.test(String(req.headers['sec-purpose'] || req.headers.purpose || ''));
  let mmp = leesCookie(req, 'mmp'); const nieuwP = !/^[0-9a-f]{16}$/.test(mmp); if (nieuwP) mmp = nieuwId(8);
  let rec = null; try { rec = await kv.get(K.rec(code)); } catch (e) {}
  const cid = (rec && rec.mmc) || nieuwId(6);
  if (!x.voorkant && !x.kassa && !x.bundel && pid) { try { x.slug = await slugVan(pid); } catch (e) {} } // 17 nov: meteen naar /product/<naam>, zonder de omleiding van /product/<id>
  const doel = 'https://kadoly.com/' + (x.voorkant ? '' : x.bundel ? 'bundel/' + x.bundel : x.kassa ? 'checkout/' + encodeURIComponent(pid) : 'product/' + (x.slug || encodeURIComponent(pid))) + '?utm_source=' + (x.bron ? (x.bron.source || 'kadoly-gids') : NETTEN[net].toLowerCase()) + '&utm_medium=' + (x.bron ? x.bron.medium : (x.vorm || 'push')) + '&utm_campaign=' + (x.bron ? encodeURIComponent(x.bron.campaign) : 'shoplus') + '&utm_content=' + (x.voorkant ? 'voorkant' : encodeURIComponent(pk(pid))) + '&hj=' + code + '&mmc=' + cid + '&lang=' + (/^(nl|de|es|en)$/.test(x.taal || '') ? x.taal : 'nl') + (net === 'pi' && x.epik ? '&epik=' + encodeURIComponent(x.epik) : '') + (net === 'pi' ? '&pin_traffic=' + (rec && rec.pc || x.pinClass || 'unknown') + (x.pinClass === 'paid' ? '&pp=0' : x.pinClass === 'earned' ? '&pp=1' : '') : ''); // 16 nov: buitenlandse campagnes landen in de taal van hun land (shoptest geeft &lang= mee)
  // Link previews get the same offer without a visitor record, measurement id or cookie.
  if (net === 'pi' && bot) {
    const preview = new URL(doel); preview.searchParams.delete('hj'); preview.searchParams.delete('mmc');
    res.statusCode = 302; res.setHeader('location', preview.href); res.setHeader('cache-control', 'no-store');
    return res.end();
  }
  if (!weiger && !prefetch && (!rec || !rec.mmc)) {
    const eerst = !rec; rec = rec || { c: clickid, s: net, z: zone, a: cr, k: camp, p: pid, at: Date.now(), h: apparaat(req), arm: 'd' }; if (net === 'pi' && eerst) rec.pc = x.pinClass || 'unknown'; rec.mmc = cid; rec.mp = mmp; if (x.wh) { rec.w = x.wh; rec.ua = String(req.headers['user-agent'] || '').slice(0, 200); } if (x.rt) rec.rt = x.rt; if (x.voorkant) rec.vk = 1; if (x.kassa && net === 'tt') rec.ka = 1; if (x.bundel) rec.bu = x.bundel; if (test) rec.t = 1; if (eerst && x.extra && Object.keys(x.extra).length) rec.q = x.extra; /* 5 nov: wat het netwerk meegeeft (MGID src, srcid, cat, cpc, geo) blijft bij de klik */
    try { await Promise.all([kv.set(K.rec(code), rec, { ex: 7 * 86400 }), cidKoppel(kv, { cid, pid: mmp, arm: rec.arm === 'd' ? 'direct' : 'pagina', tag: 'yoors-shop', net: test ? 'test' : CM_NET[net], zone: zone || '-', camp: camp || '-', shop: code })]); } catch (e) {}
    if (eerst && !test) {
      const keys = ['sh-' + net + '-dv', 'sh-d' + D8() + '-' + net + '-dv', 'sh-u' + nlUur() + '-dv', x.voorkant ? 'sh-vk-dv' : 'sh-p-' + pk(pid) + '-dv']; if (net === 'tt' && !x.voorkant && pid && !x.bundel) keys.push('sh-tt-arm' + (x.kassa ? 'k' : 'p') + '-dv'); if (x.bundel) keys.push('sh-bu-' + x.bundel + '-dv', 'sh-bu-' + net + '-dv');
      if (zone) keys.push('sh-' + net + '-z' + zone + '-dv', 'sh-' + net + '-z' + zone + '-hv'); if (cr) keys.push('sh-' + net + '-a' + cr + '-dv'); if (camp) keys.push('sh-' + net + '-k' + camp + '-dv');
      const werk = laterAf(Promise.all([
        inc(keys, rec), uurTel(kv, net, 'dv'), sadd(K.set('p'), pid), zone ? sadd(K.set('z', net), zone) : null, cr ? sadd(K.set('a', net), cr) : null, camp ? sadd(K.set('k', net), camp) : null,
        zone ? kv.raw(['PFADD', K.hll(net, zone), apparaat(req)]).then(() => kv.raw(['EXPIRE', K.hll(net, zone), String(30 * 86400)])).catch(() => {}) : null,
        verwerkKlik(kv, { cid, pid: mmp, nieuw: nieuwP, arm: '302', tag: 'yoors-shop', net: CM_NET[net], camp, zone, sub: clickid, cr, kw: pid, doel, p: 'shop', vorm: x.vorm, q: x.extra }, serverSignalen(req))
      ]).catch(e => { const m = String(e && e.message || e); console.log('shop direct fout', m); if (/OOM/.test(m)) dbNood(); }));
      await Promise.race([werk, new Promise(r => setTimeout(r, 350))]);
    }
  }
  if (weiger) { if (!test) laterAf(inc(['sh-' + net + '-bk', 'sh-d' + D8() + '-' + net + '-bk', 'sh-d' + D8() + '-' + net + '-bk-' + weiger].concat(zone ? ['sh-' + net + '-z' + zone + '-bk'] : []))); res.statusCode = 403; res.setHeader('x-robots-tag', 'noindex, nofollow'); res.setHeader('cache-control', 'no-store'); return res.end('Niet beschikbaar'); } // 28 okt: geen bots naar kadoly.com (Henkjan), alleen wie zich als bot of crawler meldt; plekken met veel nep weert Clickmind via de zonelijst
  res.statusCode = 302; res.setHeader('location', doel); res.setHeader('cache-control', 'no-store, private'); res.setHeader('referrer-policy', 'origin'); res.setHeader('x-robots-tag', 'noindex, nofollow');
  if (nieuwP) res.setHeader('set-cookie', 'mmp=' + mmp + '; Max-Age=15552000; Path=/; Secure; HttpOnly; SameSite=Lax');
  return res.end();
}
async function land(req, res, url) {
  const q = url.searchParams; const ua = req.headers['user-agent'] || '';
  // Bing: de keuring van Microsoft (AdIdxBot, BingPreview) moet de doorstuur naar kadoly.com zien, anders keurt Microsoft de advertentie af (16 nov 2026)
  const msKeur = /^(bing|microsoft|msads)$/.test(String(q.get('utm_source') || '').toLowerCase()) && /adidxbot|bingpreview/i.test(ua); const bot = isBot(ua) && !msKeur;
  const src = String(q.get('utm_source') || '').toLowerCase(); const rawNet = q.get('wacid') ? 'wh' : netVan(src); const net = rawNet === 'pi' && !/^(paid_social|paid-social|cpc|paid)$/.test(String(q.get('utm_medium') || '').toLowerCase()) ? 'x' : rawNet; // Whop zet zelf utm_source (facebook, instagram, ...) en utm_medium=paid_social; wacid is altijd van Whop
  let clickid = String(q.get('clickid') || '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 120); if (/^(subid|clickid|click_id|visitor_id)$/i.test(clickid) || /^__[A-Z_]+__$/.test(String(q.get('clickid') || ''))) clickid = '';
  // Pinterest has a separate paid cohort; a missing epik gets a local request id, not a fabricated Pinterest click id.
  const pinClass = q.get('pp') === '0' ? 'paid' : q.get('pp') === '1' ? 'earned' : 'unknown';
  const rawEpik = net === 'pi' ? String(q.get('epik') || '') : '';
  const pinEpik = rawEpik && !/[{}]|^__[A-Z_]+__$/.test(rawEpik) ? rawEpik.replace(/[^A-Za-z0-9_.~+\/=\-]/g, '').slice(0, 600) : '';
  if (net === 'pi' && !clickid) clickid = pinEpik || 'pix' + randomBytes(6).toString('hex');
  if (net === 'tt' && !clickid) clickid = String(q.get('ttclid') || '').replace(/[^A-Za-z0-9_.~+\/=-]/g, '').slice(0, 600); if (net === 'tt' && !clickid && !bot) clickid = 'ttx' + randomBytes(6).toString('hex'); // geen ttclid meegekregen: toch via Clickmind en de directe route (geen tussenpagina), alleen zonder koppeling aan de TikTok-klik // TikTok zet zelf ttclid achter de link (lang, ongewijzigd bewaren: de Events API koppelt er de conversie mee)
  if (net === 'bi' && !clickid) clickid = String(q.get('msclkid') || '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 120); if (net === 'bi' && !clickid && !bot) clickid = 'bix' + randomBytes(6).toString('hex'); // Bing: msclkid via {msclkid}; keuring en voorbeelden zonder klik-id gaan als bix door (zoals ttx)
  const ttZonder = (net === 'tt' && /^ttx/.test(clickid)) || (net === 'bi' && /^bix/.test(clickid)); // 16 nov: TikTok-keuring en voorbeelden komen zonder ttclid; die tellen niet mee per advertentie (plek 'ttx')
  if (net === 'wh' && !clickid) clickid = String(q.get('fbclid') || '').replace(/[^A-Za-z0-9_.~+\/=-]/g, '').slice(0, 600); if (net === 'wh' && !clickid && !bot) clickid = 'whx' + randomBytes(6).toString('hex'); // Whop/Meta: Meta zet fbclid achter de link; zonder fbclid toch via Clickmind (eigen klik-id), de Events API koppelt dan via wacid/waid
  const wh = net === 'wh'; // Whop zet wacid (campagne), wasid (advertentiegroep) en waid (advertentie) achter de link
  const zone = wh ? plekId(q.get('wasid') || q.get('zoneid')) : ttZonder ? (net === 'bi' ? 'bix' : 'ttx') : plekId(q.get('zoneid')), cr = wh ? whId(q.get('waid') || q.get('creativeid')) : ttZonder ? '' : digits(q.get('creativeid'), net === 'tt' ? 20 : 14), camp = wh ? whId(q.get('wacid') || q.get('campaignid')) : ttZonder ? '' : digits(q.get('campaignid'), net === 'tt' ? 20 : 14); // TikTok-id's zijn 16 cijfers
  const whp = wh ? Object.fromEntries(['wacid', 'wasid', 'waid', 'fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'wa'].map(k => [k, String(q.get(k) || '').slice(0, k === 'fbclid' ? 600 : 80)]).filter(([, v]) => v)) : null;
  // Clickmind neemt alles mee wat het netwerk in de link zet (Henkjan 3 nov: "Zorg dat je alles meeneemt in clickmind ook van mondiads . OS VPN etc
  // zodat we patronen kunnen vinden"): de vorm (utm_medium: ipp, push, native, pop) en elke andere parameter (os, browser, carrier, subid, ...),
  // ook macro's die het netwerk niet invulde (dan staat er [os]: zo zien we welke macro's werken).
  const vorm = String(q.get('utm_medium') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 12);
  const extra = {}; let nx = 0; for (const [k0, v0] of q.entries()) { const k1 = String(k0).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20); if (!k1 || /^(utm_source|utm_medium|utm_campaign|clickid|zoneid|creativeid|campaignid|p|arm|naar|fbclid)$/.test(k1) || nx >= 16) continue; extra[k1] = String(v0).slice(0, 60); nx++; }
  const cat = await catalog(); const perId = {}; cat.items.forEach(i => { perId[i.id] = i; });
  // Do not silently send an unavailable advertised product to an unrelated fallback offer.
  const pinPid = pidOk(q.get('p'));
  if (net === 'pi' && q.get('naar') !== 'voorkant' && (!pinPid || !perId[pinPid] || perId[pinPid].vr === false)) {
    res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex, nofollow');
    return res.status(404).send('Dit product is niet beschikbaar.');
  }
  let top = null; try { top = await kv.get(K.top); } catch (e) {} const topIds = (top && top.ids && top.ids.length ? top.ids : seed.ads.map(a => a.pid)).filter(id => perId[id] && perId[id].vr !== false);
  const biLp = net === 'bi' ? String(q.get('lp') || '') : ''; const biPid = (biLp.match(/kadoly\.com\/product\/([^?&#\/]+)/) || [])[1] || ''; // Bing: Microsoft zet de landingspagina met {lpurl} in lp; een productpagina wordt p, anders de voorkant
  let pid = pidOk(q.get('p') || (biPid ? (() => { try { return decodeURIComponent(biPid); } catch (e) { return biPid; } })() : '')); if (pid && (!perId[pid] || perId[pid].vr === false)) pid = '';
  if (!pid && cr && net !== 'x') { try { const m = (await kv.get(K.crmap)) || {}; if (perId[m[net + ':' + cr]] && perId[m[net + ':' + cr]].vr !== false) pid = m[net + ':' + cr]; } catch (e) {} }
  if (!pid) pid = topIds[0] || cat.items[0].id;
  let rt = ''; if (q.get('rt') === '1') { rt = 'mis'; const mp = leesCookie(req, 'mmp'); if (/^[0-9a-f]{16}$/.test(mp)) { try { const w = await kv.get('hjdk:warm:' + mp); if (w && w.p && perId[w.p] && perId[w.p].vr !== false) { pid = w.p; rt = w.stap; } } catch (e) {} } laterAf(inc(['sh-rt-' + (rt === 'mis' ? 'mis' : 'raak'), 'sh-d' + D8() + '-rt-' + (rt === 'mis' ? 'mis' : 'raak')])); } // remarketing: naar het eigen mandjeproduct
  const held = perId[pid]; const thema = (top && top.thema && top.thema[pid]) || themaVan(held);
  const zelfde = topIds.filter(id => id !== pid && ((top && top.thema && top.thema[id]) || themaVan(perId[id])) === thema).slice(0, 3);
  const meer = [...zelfde, ...topIds.filter(id => id !== pid && !zelfde.includes(id))].slice(0, 8).map(id => perId[id]);
  const code = clickid && net !== 'x' ? shortId(net + ':' + clickid + (net === 'pi' ? ':' + pinClass : '')) : '';
  // directe route (lib/shopdirect.js): per persoon vast naar deze landingspagina (l) of in één keer naar de productpagina op yoo.rs (d).
  // Alleen betaald verkeer met een klik-id. Iedereen krijgt dezelfde behandeling, ook wat op een bot lijkt (geen cloaking).
  // NOOIT een tussenpagina (Henkjan 28 okt: "Haal tussenpagina voor altijd weg !!!!!! Bot meet je op clickmind niet een tusspagina met een klik").
  // Betaald verkeer met een klik-id gaat altijd in één keer via Clickmind (302) naar de productpagina op kadoly.com, ook met arm=l in de link.
  // Bots meet Clickmind (cm.js op de shop: echt mens of niet, per plek) en de zonelijst weert slechte plekken; wie zich als bot meldt gaat niet door (direct()).
  const taal = (() => { const l = String(q.get('lang') || '').toLowerCase(); if (/^(nl|de|es|en)$/.test(l)) return l; const lc = String(q.get('utm_campaign') || '').slice(0, 3).toLowerCase(); return ({ 'de-': 'de', 'at-': 'de', 'lu-': 'de', 'es-': 'es', 'ie-': 'en', 'mt-': 'en' })[lc] || 'nl'; })(); // 16 nov: taal van de landingspagina per land
  const voorkant = q.get('naar') === 'voorkant' || (net === 'bi' && !q.get('p') && !biPid); // 16 nov (Henkjan): een algemene advertentie landt op de voorkant van kadoly.com, met Clickmind ertussen
  if (net === 'wh') { const pf = [req.headers['sec-purpose'], req.headers['purpose'], req.headers['x-purpose'], req.headers['x-moz']].map(v => String(v || '').toLowerCase()).join(' '); if (/prefetch|preview|prerender/.test(pf)) laterAf(inc(['sh-wh-pf', 'sh-d' + D8() + '-wh-pf'])); } // 17 nov: Meta laadt de landingspagina soms vooraf (zonder klik); tellen om aankomsten zonder klik te verklaren
  if (net === 'wh' && cr && pid && !bot) { laterAf(kv.raw(['HSETNX', 'hjdk:whop:waidp', cr, pid]).catch(() => {})); if (whp && whp.wa) laterAf(kv.raw(['HSETNX', 'hjdk:whop:waidwa', cr, whId(whp.wa)]).catch(() => {})); } // 17 nov: Whop zet in waid een eigen nummer, niet de ad-id van de API; de ronde koppelt het via product (p) of onze eigen wa
  const ttKassa = net === 'tt' && !voorkant && !!pid && !/^ttx/.test(clickid) && parseInt(createHash('sha1').update(String(clickid)).digest('hex').slice(0, 2), 16) % 2 === 1; // 17 nov (Henkjan: "Los 1 -5 op"): 0 van 153 echte TikTok-bezoekers tikte op de koopknop; de helft (vast per klik) gaat direct naar de afrekenpagina
  let bundel = ''; if (/^b20\d{6}$/.test(String(q.get('bundel') || ''))) { try { const bu = await kv.get('hjdk:shop:bundel:' + q.get('bundel')); if (bu && bu.items && bu.items[0]) { bundel = bu.code; pid = bu.items[0].id; } } catch (e) {} } // 17 nov: advertentie voor de bundel van de dag landt op kadoly.com/bundel/<code>
  if (code) return await direct(req, res, { net, clickid, zone, cr, camp, pid, code, bot, vorm, extra, rt, taal, voorkant, bundel, kassa: ttKassa && !bundel, epik: pinEpik, pinClass, bron: net === 'pi' ? { source: 'pinterest', medium: pinClass === 'earned' ? 'organic_social' : 'paid_social', campaign: camp || 'pinterest-test' } : undefined, wh: whp ? Object.assign({ pr: held && Number(held.p) > 0 ? Number(held.p) : undefined }, whp) : null });
  if (!bot) {
    let nieuw = true; if (code) { try { nieuw = !(await kv.get(K.rec(code))); if (nieuw) await kv.set(K.rec(code), { c: clickid, s: net, z: zone, a: cr, k: camp, p: pid, at: Date.now(), h: apparaat(req), arm: 'l' }, { ex: 7 * 86400 }); } catch (e) {} }
    if (nieuw) { const keys = ['sh-' + net + '-view', 'sh-d' + D8() + '-' + net + '-view', 'sh-u' + nlUur() + '-view', 'sh-p-' + pk(pid) + '-himp'].concat(meer.map(m => 'sh-p-' + pk(m.id) + '-imp'));
      if (zone) keys.push('sh-' + net + '-z' + zone + '-view'); if (cr) keys.push('sh-' + net + '-a' + cr + '-view'); if (camp) keys.push('sh-' + net + '-k' + camp + '-view');
      if (zone) { keys.push('sh-' + net + '-z' + zone + '-hv'); try { await kv.raw(['PFADD', K.hll(net, zone), apparaat(req)]); await kv.raw(['EXPIRE', K.hll(net, zone), String(30 * 86400)]); } catch (e) {} }
      await inc(keys); await uurTel(kv, net, 'view'); await sadd(K.set('p'), pid, ...meer.map(m => m.id)); if (zone) await sadd(K.set('z', net), zone); if (cr) await sadd(K.set('a', net), cr); if (camp) await sadd(K.set('k', net), camp); }
  }
  const uit = (id, pos) => '/api/shop/uit?p=' + encodeURIComponent(id) + (code ? '&c=' + code : '') + '&pos=' + pos;
  const kaart = (it, i) => `<a class="pc" href="${esc(uit(it.id, 'g' + (i + 1)))}"><img src="${esc(it.img)}" alt="" loading="lazy" width="460" height="460"><span class="pt">${esc(it.t)}</span><span class="pp">${it.pf ? 'vanaf ' : ''}${esc(eur(it.p))}</span></a>`;
  const titel = held.t + ' | Kadoly';
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
footer{margin-top:34px}</style><script src="/cm.js" data-site="shop" async></script></head><body>
<header class="topbar"><div class="wrap"><a class="mark" href="${esc(uit(pid, 'logo'))}">Kadoly</a><span class="tb">Verzonden vanuit Europa</span></div></header>
<main class="wrap">
<a href="${esc(uit(pid, 'h'))}"><img class="hero-img" src="${esc(held.img)}" alt="${esc(held.t)}" width="460" height="460"></a>
${held.b ? `<p class="brand">${esc(held.b)}</p>` : '<p class="brand">Kadoly</p>'}
<h1>${esc(held.t)}</h1>
<p class="prijs">${held.pf ? '<small>vanaf </small>' : ''}${esc(eur(held.p))}</p>
<a class="koop" href="${esc(uit(pid, 'h'))}">Bekijk in de shop</a>
<ul class="zeker"><li>14 dagen retourneren: niet tevreden, geld terug</li><li>Betalen met iDEAL, PayPal of creditcard</li><li>Verzonden vanuit Europa, met track &amp; trace</li>${held.lt ? `<li>Bezorgd in ${held.lt} ${held.lt === 1 ? 'werkdag' : 'werkdagen'}</li>` : ''}${held.vk === 0 ? '<li>Gratis verzending</li>' : held.vk ? `<li>Verzending ${esc(eur(held.vk))}</li>` : ''}</ul>
${meer.length ? `<h2>Ook populair vandaag</h2><div class="pg">${meer.map(kaart).join('')}</div>` : ''}
<a class="alles" href="${esc('/api/shop/uit?p=alles' + (code ? '&c=' + code : '') + '&pos=alles')}">Bekijk alle ${cat.items.length >= 100 ? cat.items.length + ' ' : ''}producten</a>
</main>
<footer><div class="wrap"><p>Dit is een selectie uit Kadoly. Je bestelt en betaalt op kadoly.com.</p><div class="fl"><a href="https://kadoly.com/shop/privacy">Privacy</a><a href="https://kadoly.com/shop/terms">Voorwaarden</a><a href="https://kadoly.com/shop/returns">Retourneren</a></div><p>Kadoly by AdsFair B.V. · KVK 60126035 · Gouda</p></div></footer>
<script>(function(){var C=${JSON.stringify(code)},weg=false,t0=Date.now(),mens=false,eng=false,s=0;function b(e){try{navigator.sendBeacon('/api/shop/b',new Blob([JSON.stringify({c:C,e:e})],{type:'text/plain'}))}catch(x){}}
['scroll','touchstart','pointerdown','keydown','pointermove'].forEach(function(ev){addEventListener(ev,function(){if(!mens){mens=true;b('mens')}if(!weg&&ev!=='pointermove'&&ev!=='keydown'&&C){weg=true;setTimeout(function(){var k=document.querySelector('a.koop');if(k&&!window.__kk)location.href=k.getAttribute('href').replace('pos=h','pos=auto')+'&h=1&ms='+(Date.now()-t0)},Math.max(250,800-(Date.now()-t0)))}},{passive:true})});
var iv=setInterval(function(){if(document.visibilityState==='visible')s++;if(s>=15&&mens&&!eng){eng=true;clearInterval(iv);b('eng')}},1000);
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="/api/shop/uit"]');if(!a||a.dataset.k)return;a.dataset.k=1;window.__kk=1;a.href=a.getAttribute('href')+'&h='+(mens?1:0)+'&ms='+(Date.now()-t0)},true)})();</script>
</body></html>`;
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex, nofollow');
  return res.status(200).send(html);
}

// ---------------- cadeau-keuzehulpen (keuzehulp.best/cadeau/<gids>) ----------------
async function hulp(req, res, url) {
  const q = url.searchParams; const slug = String(q.get('g') || '');
  if (!GIDSEN[slug]) { res.statusCode = 302; res.setHeader('location', '/cadeau/' + GIDS_IDS[0]); return res.end(); }
  const ua = req.headers['user-agent'] || ''; const bot = isBot(ua); const src = String(q.get('utm_source') || '').toLowerCase(); const net = netVan(src);
  let clickid = String(q.get('clickid') || '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 120); if (/^(subid|clickid|click_id|visitor_id)$/i.test(clickid) || /[{}$\[\]]/.test(String(q.get('clickid') || ''))) clickid = '';
  const zone = plekId(q.get('zoneid')), cr = digits(q.get('creativeid')), camp = digits(q.get('campaignid'));
  const cat = await catalog(); const P = productenVoor(slug, cat.items);
  const code = clickid && net !== 'x' ? shortId(net + ':' + clickid) : '';
  if (!bot) {
    let nieuw = true; if (code) { try { nieuw = !(await kv.get(K.rec(code))); if (nieuw) await kv.set(K.rec(code), { c: clickid, s: net, z: zone, a: cr, k: camp, p: '', g: slug, at: Date.now(), h: apparaat(req) }, { ex: 7 * 86400 }); } catch (e) {} }
    if (nieuw) { const keys = ['sh-' + net + '-view', 'sh-d' + D8() + '-' + net + '-view', 'sh-u' + nlUur() + '-view', 'sh-h-' + slug + '-view', 'sh-h-' + slug + '-' + net + '-view', 'sh-hd' + D8() + '-' + slug + '-view'];
      if (zone) keys.push('sh-' + net + '-z' + zone + '-view', 'sh-' + net + '-z' + zone + '-hv'); if (cr) keys.push('sh-' + net + '-a' + cr + '-view'); if (camp) keys.push('sh-' + net + '-k' + camp + '-view');
      if (zone) { try { await kv.raw(['PFADD', K.hll(net, zone), apparaat(req)]); await kv.raw(['EXPIRE', K.hll(net, zone), String(30 * 86400)]); } catch (e) {} }
      await inc(keys); if (zone) await sadd(K.set('z', net), zone); if (cr) await sadd(K.set('a', net), cr); if (camp) await sadd(K.set('k', net), camp); }
  }
  const html = hulpPagina({ slug, producten: P, code, land: LAND(), andere: GIDS_IDS.filter(x => x !== slug).map(x => [x, GIDSEN[x].titel]) });
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', code || q.toString().length > 2 + slug.length + 3 ? 'no-store' : 'public, max-age=0, s-maxage=600');
  return res.status(200).send(html);
}
async function hulpBaken(req, res) {
  let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
  const g = String(b.g || ''); const gids = GIDSEN[g]; if (!gids || isBot(req.headers['user-agent'])) return res.status(204).end();
  const k = String(b.k || ''); const v = String(b.v || '').replace(/[^a-z0-9]/gi, '').slice(0, 12).toLowerCase();
  if (!(k === 'klaar' || gids.vragen.some(x => x.k === k && x.o.some(o => o[0] === v)))) return res.status(204).end();
  const code = String(b.c || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); let rec = null, net = 'x';
  if (code) { try { rec = await kv.get(K.rec(code)); if (rec) net = rec.s; } catch (e) {} }
  if (rec) { rec.hq = rec.hq || {}; if (rec.hq[k]) return res.status(204).end(); rec.hq[k] = v; try { await kv.set(K.rec(code), rec, { ex: 7 * 86400 }); } catch (e) {} }
  const keys = k === 'klaar' ? ['sh-h-' + g + '-klaar', 'sh-h-' + g + '-' + net + '-klaar'] : ['sh-h-' + g + '-q-' + k + '-' + v, 'sh-h-' + g + '-' + net + '-q-' + k + '-' + v];
  if (num(b.n) === 0 && k !== 'klaar') keys.push('sh-h-' + g + '-start', 'sh-h-' + g + '-' + net + '-start');
  await inc(keys); return res.status(204).end();
}
async function hulpStand() {
  const nets = ['x', 'md', 'pa', 'ra', 'ca', 'mg']; const out = {};
  for (const g of GIDS_IDS) { const gids = GIDSEN[g]; const keys = []; const namen = [];
    for (const s of ['view', 'start', 'klaar', 'klik', 'klikq']) { keys.push('c:sh-h-' + g + '-' + s); namen.push(['tot', s]); }
    for (const n of nets) for (const s of ['view', 'start', 'klaar', 'klik']) { keys.push('c:sh-h-' + g + '-' + n + '-' + s); namen.push([n, s]); }
    for (const v of gids.vragen) for (const o of v.o) { keys.push('c:sh-h-' + g + '-q-' + v.k + '-' + o[0]); namen.push(['q', v.k + ':' + o[1]]); }
    const vals = await kv.mget(...keys); const o = { totaal: {}, per_netwerk: {}, antwoorden: {} };
    namen.forEach(([a, s], i) => { const n = num(vals[i]); if (a === 'tot') o.totaal[s] = n; else if (a === 'q') o.antwoorden[s] = n; else if (n) { (o.per_netwerk[a] = o.per_netwerk[a] || {})[s] = n; } });
    out[g] = o; }
  return out;
}

async function uitgang(req, res, url) {
  const q = url.searchParams; const p = String(q.get('p') || ''); const code = String(q.get('c') || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); const pos = String(q.get('pos') || '').replace(/[^a-z0-9]/gi, '').slice(0, 6);
  const cat = await catalog(); const it = p === 'alles' ? null : cat.items.find(i => i.id === pidOk(p));
  let rec = null; if (code) { try { rec = await kv.get(K.rec(code)); } catch (e) {} } const net = rec ? rec.s : 'x';
  const mens = (rec && rec.m) || (q.get('h') === '1' && num(q.get('ms')) >= 600); const bot = isBot(req.headers['user-agent']);
  // Clickmind-klik-id mee naar de shop, zodat cm.js op yoo.rs ook voor bezoekers via de landingspagina echt en actie meet (vergelijking met de directe route)
  let mmcNieuw = false; if (rec && !bot && !rec.mmc) { rec.mmc = nieuwId(6); rec.arm = rec.arm || 'l'; mmcNieuw = true; try { await cidKoppel(kv, { cid: rec.mmc, pid: (String(rec.h || '') + '0000000000000000').slice(0, 16), arm: 'pagina', tag: 'yoors-shop', net: CM_NET[net] || 'onbekend', zone: rec.z || '-', camp: rec.k || '-', shop: code }); } catch (e) {} }
  if (mens && !bot) { const keys = ['sh-' + net + '-klik', 'sh-d' + D8() + '-' + net + '-klik', 'sh-u' + nlUur() + '-klik']; if (it) keys.push('sh-p-' + pk(it.id) + (pos === 'h' || pos === 'logo' ? '-hklik' : '-klik'));
    const gg = String(q.get('g') || ''); if (GIDSEN[gg]) { keys.push('sh-h-' + gg + '-klik', 'sh-h-' + gg + '-' + net + '-klik', 'sh-hd' + D8() + '-' + gg + '-klik'); if (num(q.get('q')) > 0) keys.push('sh-h-' + gg + '-klikq'); }
    if (rec && !rec.kl) { if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-klik'); if (rec.a) keys.push('sh-' + net + '-a' + rec.a + '-klik'); if (rec.k) keys.push('sh-' + net + '-k' + rec.k + '-klik'); rec.kl = Date.now(); }
    if (rec && rec.c && !rec.conv && PB[net]) { let st = 0; try { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 2500); const r = await fetch(PB[net].replace('{clickid}', encodeURIComponent(rec.c)), { signal: ctl.signal }); clearTimeout(tm); st = r.status; } catch (e) {} rec.conv = Date.now(); rec.pb = st; keys.push('sh-' + net + '-conv', 'sh-d' + D8() + '-' + net + '-conv', 'sh-' + net + '-pb' + (st || 0)); if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-conv'); }
    await inc(keys); if (rec) { try { await kv.set(K.rec(code), rec, { ex: 7 * 86400 }); } catch (e) {} } }
  else if (mmcNieuw) { try { await kv.set(K.rec(code), rec, { ex: 7 * 86400 }); } catch (e) {} }
  const utm = 'utm_source=' + (net === 'x' ? 'shoplus' : NETTEN[net].toLowerCase()) + '&utm_medium=push&utm_campaign=shoplus' + (it ? '&utm_content=' + encodeURIComponent(pk(it.id)) : '') + (code ? '&hj=' + code : '') + (rec && rec.mmc ? '&mmc=' + rec.mmc : '') + '&lang=nl'; // de shop kiest anders de taal van de telefoon; de afrekenpagina is nog Engels
  if (bot || (rec && !mens)) { res.statusCode = 403; res.setHeader('x-robots-tag', 'noindex, nofollow'); res.setHeader('cache-control', 'no-store'); return res.end('Niet beschikbaar'); } // 28 okt: geen bots naar kadoly.com; betaald verkeer alleen na een echte aanraking of tik
  res.statusCode = 302; res.setHeader('location', (it ? 'https://kadoly.com/product/' + encodeURIComponent(it.id) : SHOP) + '?' + utm); res.setHeader('cache-control', 'no-store'); return res.end();
}

async function baken(req, res) {
  let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
  const code = String(b.c || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); const e = b.e === 'mens' ? 'mens' : b.e === 'eng' ? 'eng' : '';
  if (!e || isBot(req.headers['user-agent'])) return res.status(204).end();
  if (!code) { await inc(['sh-x-' + e, 'sh-d' + D8() + '-x-' + e]); return res.status(204).end(); }
  let rec = null; try { rec = await kv.get(K.rec(code)); } catch (x) {} const veld = e === 'mens' ? 'm' : 'e'; if (!rec || rec[veld]) return res.status(204).end();
  rec[veld] = 1; const net = rec.s; const keys = ['sh-' + net + '-' + e, 'sh-d' + D8() + '-' + net + '-' + e]; if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-' + e); if (rec.a) keys.push('sh-' + net + '-a' + rec.a + '-' + e); if (rec.k) keys.push('sh-' + net + '-k' + rec.k + '-' + e);
  // 28 okt (Henkjan: "Ja 50 vandaag ik zie nu nog geen verkeer"): sinds de Clickmind-poort ging de conversie pas bij de tik naar de shop,
  // te weinig om het netwerk te laten inkopen. Nu meldt de eerste echte aanraking of scroll op onze pagina de conversie (zoals 23 okt
  // "echt mens" op de shop). Bots raken de shop nog steeds niet: doorsturen vraagt een echte tik (zie uitgang).
  if (e === 'mens' && rec.c && !rec.conv && !rec.t && PB[net]) { let st = 0; try { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 2500); const r = await fetch(PB[net].replace('{clickid}', encodeURIComponent(rec.c)) + (net === 'md' ? '&payout=0' : ''), { signal: ctl.signal }); clearTimeout(tm); st = r.status; } catch (x) {} rec.conv = Date.now(); rec.pb = st; keys.push('sh-' + net + '-conv', 'sh-d' + D8() + '-' + net + '-conv'); if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-conv'); }
  await inc(keys); try { await kv.set(K.rec(code), rec, { ex: 7 * 86400 }); } catch (x) {}
  return res.status(204).end();
}

// Pixel voor de shop (zie lib/shopphp.js): /api/shop/px?c=<hj>&w=cart  en  /api/shop/px?c=<hj>&w=koop&v=<bedrag>&o=<ordernummer>
// Een bestelling telt per plek, advertentie en product, en gaat met het bedrag door naar het netwerk van die klik.
// Gebeurtenis uit de shop (winkelwagen, afrekenen, betaling gestart, mislukt, betaald). Ook gebruikt voor de controle achteraf
// met de bestellingen uit de datapagina van de shop (bron feed), zodat een betaling nooit wegvalt als de directe melding niet afging.
const PX_SOORT = { koop: 'koop', cart: 'cart', afreken: 'afreken', betaal: 'betaal', fout: 'fout' };
// warm publiek: warmZet staat in lib/shopdirect.js (4 nov)
async function pxVerwerk(code, wRuw, v, order, methode, bron, t) {
  const w = PX_SOORT[wRuw] || 'cart'; const oud = w === 'koop' ? 'koop' : (w === 'cart' || w === 'afreken') ? 'cart' : null; // oud = de tellers van voor 17 okt
  const m = String(methode || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
  if (bron !== 'feed') { const laatst = { at: Date.now(), test: /^test/i.test(code), bedrag: v, order: !!order, methode: m || null, bron: bron || 'shop' }; try { await kv.set('hjdk:shop:pxlaatst:' + w, laatst); if (m) await kv.set('hjdk:shop:pxlaatst:' + w + ':' + m, laatst, { ex: 60 * 86400 }); } catch (e) {} }
  if (!code) { await uurTel(kv, '?', [w].concat(m ? [w + ':' + m] : []), t); if (w === 'koop' && v > 0) await uurTel(kv, '?', 'omzet', t, Math.round(v * 100)); return { ok: true, zonderKenmerk: true }; }
  let rec = null; try { rec = await kv.get(K.rec(code)); } catch (e) {}
  if (rec && rec.s === 'pi' && rec.t) return { ok: true, test: true }; // Pinterest QA must not enter cart/order cohorts.
  if (rec && rec.mp && !rec.t) await warmZet(kv, rec.mp, rec.p, w === 'koop' || w === 'betaal' || isBewust(rec) ? w : 'bekeken'); // 5 nov: een snelle tik op de koopbalk is geen warm publiek
  const merk = w + (order ? ':' + order : '');
  if (!rec) { // kenmerk onbekend (bijv. de database was vol toen de klik binnenkwam): wel per uur tellen, zodat het lek zichtbaar blijft
    const k = 'hjdk:shop:pxonbekend:' + code + ':' + merk; let al = null; try { al = await kv.get(k); } catch (e) {}
    if (!al && !/^test/i.test(code)) { try { await kv.set(k, 1, { ex: 30 * 86400 }); } catch (e) {} await uurTel(kv, '?', [w].concat(m ? [w + ':' + m] : []), t); if (w === 'koop' && v > 0) await uurTel(kv, '?', 'omzet', t, Math.round(v * 100)); }
    if (w === 'koop') await log({ soort: 'bestelling', wat: (v ? eur(v) + ' ' : '') + 'met onbekend kenmerk ' + code, waarom: 'klik niet terug te vinden' + (bron === 'feed' ? ' (uit de datapagina van de shop)' : '') });
    return { ok: true, onbekend: true };
  }
  if (rec.px && rec.px[merk]) return { ok: true, dubbel: true };
  rec.px = rec.px || {}; rec.px[merk] = Date.now(); const net = rec.s;
  if (!rec.t && rec.mmc && (w === 'cart' || w === 'afreken' || w === 'koop')) { try { const vid = await kv.raw(['GET', 'mm:vfc:' + rec.mmc]); if (vid) { const { paginaUitkomst } = await import('../lib/mensmeter.js'); await paginaUitkomst(kv, { vid: String(vid), soort: w === 'koop' ? 'koop' : 'actie' }); } } catch (e) {} } // Clickmind-profiel van wie afrekent of koopt op kadoly.com (1 nov, Henkjan: "Regel dit ook voor kadoly verkeer")
  if (!rec.t && /^gids-/.test(String(rec.c || ''))) { const gm = String(rec.c).match(/^gids-(.+?)(?:-([kp]))?-[0-9a-f]{12}$/); if (gm) { const dk = 'gk:d:' + DAY(); try { await kv.raw(['HINCRBY', dk, gm[1] + '|px-' + w + '-' + (gm[2] || 'p'), '1']); if (w === 'koop' && v > 0) await kv.raw(['HINCRBY', dk, gm[1] + '|omzet-' + (gm[2] || 'p'), String(Math.round(v * 100))]); await kv.raw(['EXPIRE', dk, String(60 * 86400)]); } catch (e) {} } } // gids.kadoly.com: keten tot betaald per gids en per arm (productpagina p, meteen afrekenen k)
  if (!rec.t) await uurTel(kv, net, [w].concat(m ? [w + ':' + m] : []), t);
  if (w === 'betaal') { try { await kassaDoel(kv, rec); } catch (e) {} } // betaling gestart is altijd bewust (5 nov)
  if (oud && !(oud === 'cart' && (rec.px.cartTeld || (w === 'afreken' && rec.px.cart)))) { if (oud === 'cart') rec.px.cartTeld = Date.now();
    const keys = ['sh-' + net + '-' + oud, 'sh-d' + D8() + '-' + net + '-' + oud]; if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-' + oud); if (rec.a) keys.push('sh-' + net + '-a' + rec.a + '-' + oud); if (rec.k) keys.push('sh-' + net + '-k' + rec.k + '-' + oud); if (rec.p) keys.push('sh-p-' + pk(rec.p) + '-' + oud);
    await inc(keys, rec);
    // PropellerAds kent drie doelen: 1 = doorklik naar de shop (meldt de uitgang zelf), 2 = afrekenpagina geopend, 3 = betaald (met bedrag)
    // Directe route (arm d): zolang cm.js op yoo.rs de eerste tik niet meldt, is de afrekenpagina (of de betaling) het hoofddoel,
    // anders leren PropellerAds en Mondiad op CPA niets. Eenmaal per klik (rec.conv), nooit voor testkliks.
    if (w === 'cart' || w === 'afreken' || w === 'betaal') { try { await kassaDoel(kv, rec); } catch (e) {} } // 5 nov: kassadoelen (PropellerAds doel 2 en terugval-hoofdconversie, MGID decision) alleen bij bewust afrekenen (lib/shopdirect.js isBewust); anders later, zodra cm.js een bewuste stap meldt
    if (oud === 'koop') { let st = 0; if (v > 0) { try { await kv.incrMany(pinCohortEntries(rec, [['c:sh-' + net + '-omzet', Math.round(v * 100)], ['c:sh-d' + D8() + '-' + net + '-omzet', Math.round(v * 100)]].concat(net === 'pi' && rec.a ? [['c:sh-pi-a' + rec.a + '-omzet', Math.round(v * 100)]] : []))); } catch (e) {} if (!rec.t) await uurTel(kv, net, 'omzet', t, Math.round(v * 100)); }
      if (net === 'tt' && rec.c && !rec.t && !rec.tk) { rec.tk = Date.now(); st = await ttEvent(rec, 'CompletePayment', v); rec.conv = rec.conv || Date.now(); } // TikTok: betaald met bedrag via de Events API
      if (net === 'wh' && rec.c && !rec.t && !rec.wk) { rec.wk = Date.now(); st = await whEvent(rec, 'purchase', v); rec.conv = rec.conv || Date.now(); } // Whop (Meta): betaald met bedrag via de Events API van Whop
      if (rec.c && PB[net] && (net !== 'ra' || !rec.conv) && !rec.t) { try { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 2500); const r = await fetch(net === 'mg' ? mgUrl(rec.c, mgEvent(MG_STAP.koop, rec.k), v) : PB[net].replace('{clickid}', encodeURIComponent(rec.c)) + (net === 'ra' ? '' : '&payout=' + v.toFixed(2)) + (net === 'pa' ? '&goal=3' : ''), { signal: ctl.signal }); clearTimeout(tm); st = r.status; } catch (e) {} rec.conv = rec.conv || Date.now(); }
      await log({ soort: 'bestelling', wat: (v ? eur(v) + ' ' : '') + 'via ' + (net === 'x' ? 'eigen verkeer' : NETTEN[net]) + (m ? ' (' + m + ')' : ''), waarom: 'plek ' + (rec.z || '?') + ', advertentie ' + (rec.a || '?') + (rec.c && (PB[net] || net === 'tt' || net === 'wh') ? ', gemeld aan het netwerk (HTTP ' + st + ')' : '') + (bron === 'feed' ? ', gevonden in de datapagina van de shop' : '') }); } }
  try { await kv.set(K.rec(code), rec, { ex: 30 * 86400 }); } catch (e) {}
  return { ok: true };
}
async function pixel(req, res, url) {
  const q = url.searchParams; const code = String(q.get('c') || '').replace(/[^a-z0-9]/gi, '').slice(0, 14);
  const v = Math.max(0, Math.min(100000, num(q.get('v')))); const order = String(q.get('o') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  try { await pxVerwerk(code, String(q.get('w') || ''), v, order, q.get('m'), 'shop'); } catch (e) {}
  // 5 nov (panel): de reden van een mislukte betaling niet meer weggooien (per methode), zodat het lek tussen betaling gestart en betaald zichtbaar is
  if (String(q.get('w') || '') === 'fout' || q.get('r')) { try { await kv.raw(['LPUSH', 'hjdk:shop:betaalfout', JSON.stringify({ at: Date.now(), c: code, w: String(q.get('w') || '').slice(0, 12), m: String(q.get('m') || '').slice(0, 20), r: String(q.get('r') || '').slice(0, 200), v })]); await kv.raw(['LTRIM', 'hjdk:shop:betaalfout', '0', '499']); await kv.raw(['EXPIRE', 'hjdk:shop:betaalfout', String(90 * 86400)]); } catch (e) {} }
  res.setHeader('content-type', 'image/gif'); res.setHeader('cache-control', 'no-store'); return res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
}

// ---------------- advertentiebeeld ----------------
// De productfoto zelf, op maat gesneden als JPEG (klein bestand, ook als de bron webp of png is). icon = 192x192, md = 720x360 (Mondiad), pa = 492x328 (PropellerAds), ca = 360x180 (Clickadu staat hooguit 362x182 toe).
const MATEN = { icon: [192, 192, 'cover'], md: [720, 360, 'contain'], pa: [492, 328, 'contain'], ca: [360, 180, 'contain'], mg: [984, 656, 'contain'], ig: [1080, 1350, 'contain'], sq: [1080, 1080, 'contain'] }; // mg: MGID 3:2, minstens 492x328; ig: Instagram/Facebook 4:5, sq: vierkant (16 nov, Kadoly sociale posts)
async function plaatje(req, res, url) {
  const cat = await catalog(); const it = cat.items.find(i => i.id === pidOk(url.searchParams.get('p'))); const m = MATEN[String(url.searchParams.get('t') || 'icon').replace(/\.(jpe?g|png|webp)$/i, '')] || MATEN.icon; // /api/shop/beeld/<pid>/<t>.jpg: MGID wil een link die op .jpg eindigt
  if (!it || !it.img) { res.statusCode = 404; return res.end('onbekend product'); }
  try {
    // cdn.yoo.rs weigert sinds 22 okt kale server-verzoeken (403): vraag de foto op zoals een browser die op yoo.rs zit, en probeer anders zonder verwijzer
    const H = [{ 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8', referer: 'https://kadoly.com/' }, { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', accept: 'image/*,*/*;q=0.8' }, {}];
    let r = null; for (const h of H) { r = await fetch(it.img, { headers: h, signal: AbortSignal.timeout(8000) }).catch(() => null); if (r && r.ok) break; }
    if (!r || !r.ok) { // foto staat niet meer op die plek (catalogus achter): haal de huidige eerste foto van de productpagina
      const eerst = r ? r.status : 'geen antwoord'; let nu = null;
      try { const h = await (await fetch('https://kadoly.com/product/' + encodeURIComponent(it.id) + '?lang=nl', { headers: H[1], signal: AbortSignal.timeout(10000) })).text(); const m = h.match(/"(?:serverUrl|src)":"(https:[^"]+?\.(?:webp|jpe?g|png)[^"]*)"/i); if (m) nu = m[1].replace(/\\\//g, '/'); } catch (e) {}
      if (nu && nu !== it.img) for (const hh of H) { r = await fetch(nu, { headers: hh, signal: AbortSignal.timeout(8000) }).catch(() => null); if (r && r.ok) break; }
      if (!r || !r.ok) throw new Error('foto ' + eerst + ' (' + String(it.img).replace(/^https?:\/\//, '').slice(0, 70) + ')' + (nu ? ', pagina-foto ' + (r ? r.status : '-') : ', geen foto op de pagina'));
    }
    const out = await sharp(Buffer.from(await r.arrayBuffer())).flatten({ background: '#ffffff' }).resize(m[0], m[1], { fit: m[2], background: '#ffffff', position: 'centre' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    res.setHeader('content-type', 'image/jpeg'); res.setHeader('cache-control', 'public, max-age=86400, s-maxage=86400'); return res.end(out);
  } catch (e) { res.statusCode = 500; return res.end('beeld mislukt: ' + String(e && e.message || e).slice(0, 120)); }
}

// ---------------- gegevens voor de PropellerAds-lus ----------------
async function voorNet(net) {
  const cat = await catalog(); const perId = {}; cat.items.forEach(i => { perId[i.id] = i; }); const ads = await advertenties(); let top = null; try { top = await kv.get(K.top); } catch (e) {}
  const volg = (top && top.ids) || seed.ads.map(a => a.pid);
  const zones = await metUniek(net, await tellers(net, 'z', await smembers(K.set('z', net)))), cr = await tellers(net, 'a', await smembers(K.set('a', net))), camp = await tellers(net, 'k', await smembers(K.set('k', net)));
  return { at: new Date().toISOString(), net, naam: NAAM, land: LAND() + '/shop', vandaag: (await dagTotaal(DAY()))[net], direct: Object.assign(await directInst(kv), { meet: (await shopMeet(kv)).aan }), // dmeet: cm.js meet op yoo.rs; zie lib/shopdirect.js voor landDeel en doorkliks
    ads: ads.filter(a => perId[a.pid] && !!perId[a.pid].img).map(a => ({ pid: a.pid, title: a.title, desc: a.desc, uit: a.uit || null, rang: volg.indexOf(a.pid), thema: themaVan(perId[a.pid]), icon: beeld(a.pid, 'icon'), image: beeld(a.pid, net === 'ra' ? 'md' : net === 'ca' ? 'ca' : 'pa') })),
    zones, botZones: await (async () => { try { const b = await botZonesVers(kv); return { zones: (b.zones || {})[net] || [], redenen: Object.fromEntries(Object.entries(b.redenen || {}).filter(([k]) => k.startsWith(net + ':')).map(([k, w]) => [k.slice(net.length + 1), w])), gem: (b.gem || {})[net] || 0, at: b.at || 0 }; } catch (e) { return { zones: [], redenen: {}, fout: String(e && e.message || e).slice(0, 120) }; } })(), creatives: cr, campagnes: camp, staat: (await kv.get('hjdk:shop:' + net + 'staat:' + DAY())) || {}, staatGisteren: (await kv.get('hjdk:shop:' + net + 'staat:' + DAY(-1))) || {} };
}

// ---------------- statuspagina ----------------
const nlTijd = iso => { try { return new Date(iso).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } };
const STATUS_NL = { RUNNING: 'loopt', PENDING: 'wacht op goedkeuring', PAUSED: 'stil', FINISHED: 'budget op', DAILY_LIMIT_REACHED: 'dagbudget op', REJECTED: 'afgekeurd', NO_ACTIVE_CREATIVES: 'geen advertentie actief', OFF_ACCOUNT_BUDGET: 'saldo op', OFF_SCHEDULE: 'buiten de uren', WAITING_START_DATE: 'start later', DRAFT: 'concept' };
async function statusPagina(sk) {
  const laatste = (await kv.get(K.laatste)) || null; const palog = ((await kv.get(K.palog)) || []); const ralog = ((await kv.get(K.ralog)) || []); const calog = ((await kv.get(K.calog)) || []); const logl = ((await kv.get(K.log)) || []).slice(0, 80); const d = await dagTotaal(DAY()), g = await dagTotaal(DAY(-1));
  let les = null; try { les = await kv.get(K.lessen); } catch (e) {}
  // Google Shopping: stand van de productfeed in Merchant Center (Demand Radar bouwt hem elke dag; Google haalt hem om 00:00 op)
  let mc = null; try { const r = await fetch('https://demandradar-ivory.vercel.app/api/feed?shop=yoors&cc=NL&status=1', { signal: AbortSignal.timeout(5000) }); if (r.ok) mc = await r.json(); } catch (e) {}
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
${mc && mc.products ? `<h2>Google Shopping (Merchant Center)</h2><div class="g">${kaart('Producten in Google', Number(mc.products).toLocaleString('nl-NL'), 'account ' + esc(mc.merchant || 'Yoors'))}${kaart('Titels met zoektermen', Number(mc.titles || 0).toLocaleString('nl-NL'), 'van ' + Number(mc.products).toLocaleString('nl-NL') + ', elk uur meer')}${kaart('Feed ververst', esc(nlTijd(mc.at)), 'Google haalt hem elke dag om 00:00 op')}</div>` : ''}
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
<p><a class="btn" href="/api/shop/advies?k=${esc(sk)}">Wat de campagnes leren en wat de verkoop tegenhoudt</a></p>
<p><a class="btn ghost" href="/api/shop/briefing?k=${esc(sk)}">Wat de shop moet teruggeven</a> &nbsp; <a class="btn ghost" href="/api/shop/babita?k=${esc(sk)}">Download yoors-shop-conversies.php</a></p>
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
    if (op === 'catsync') { // catalogus nu verversen, zonder de rest van de ronde (alleen via de beschermde vercel.app-host, hooguit eens per 10 minuten); 4 nov, voor Nieuw bij Kadoly
      const h = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(h)) return res.status(404).json({ ok: false });
      const lk = await kv.get('hjdk:shop:catsynclock'); if (lk && Date.now() - lk < 600000) return res.status(200).json({ ok: true, overgeslagen: 'net gedaan' }); await kv.set('hjdk:shop:catsynclock', Date.now(), { ex: 600 });
      const c = await sync(); return res.status(200).json({ ok: true, producten: c.items.length, metDatum: c.items.filter(i => i.l > 0).length }); }
    if (op === 'rss') return await shopRss(req, res, LAND() + '/api/shop/rss');
    if (op === 'land') return await land(req, res, url);
    if (op === 'uit') return await uitgang(req, res, url);
    if (op === 'b') return await baken(req, res);
    if (op === 'hb') return await hulpBaken(req, res);
    if (op === 'hulp') return await hulp(req, res, url);
    if (op === 'px') return await pixel(req, res, url);
    if (op === 'img') return await plaatje(req, res, url);
    res.setHeader('cache-control', 'no-store');
    if (op === 'voorpa') return res.status(200).json(Object.assign({ ok: true }, await voorNet(['ra', 'ca'].includes(url.searchParams.get('net')) ? url.searchParams.get('net') : 'pa')));
    if (op === 'sitemap') { // openbare sitemap van alle shopproducten op yoo.rs (20 okt: yoo.rs/sitemap.xml werkt niet); ingediend bij Google en Bing voor yoo.rs
      const items = (await catalog(true)).items || []; const nu = new Date().toISOString().slice(0, 10);
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>https://kadoly.com/shop</loc><lastmod>' + nu + '</lastmod></url>\n' + items.map(i => '<url><loc>https://kadoly.com/product/' + encodeURIComponent(i.id) + '?lang=nl</loc><lastmod>' + nu + '</lastmod></url>').join('\n') + '\n</urlset>';
      res.setHeader('content-type', 'application/xml; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600'); return res.status(200).send(xml);
    }
    if (op === 'prompt') { // kant-en-klare opdracht voor Babita's Claude Code (lib/shopprompt.js), live cijfers; met haar eigen link of via de beschermde host
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; const bk = await kv.get(K.babitakey).catch(() => null); const k = url.searchParams.get('k');
      if (!/\.vercel\.app$/i.test(host) && !(bk && k === bk)) return res.status(404).send('Niet gevonden');
      const { shopPrompt } = await import('../lib/shopprompt.js'); let tot = {}; try { tot = (await uurStand(kv, 24)).totaal || {}; } catch (e) {}
      res.setHeader('content-type', 'text/plain; charset=utf-8'); res.setHeader('cache-control', 'no-store');
      return res.status(200).send(shopPrompt({ tot, lekLink: bk ? 'https://keuzehulp.best/api/shop/lekken?k=' + bk : '', datum: new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) }));
    }
    if (op === 'lokker') { // lokkerproduct onder de kostprijs (lib/shopkies.js lokkers); inkoop staat erin, dus alleen via de beschermde vercel.app-host
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; const bkL = await kv.get(K.babitakey).catch(() => null); const metLink = !!(bkL && url.searchParams.get('k') === bkL); // ook met Babita's eigen link (zij levert de inkoop zelf aan)
      if (!/\.vercel\.app$/i.test(host) && !metLink) return res.status(404).send('Niet gevonden');
      const items = (await catalog(true)).items, kaart = (await kv.get(K_KOST).catch(() => null)) || {};
      let markt = {}; try { const r = await fetch('https://demandradar-ivory.vercel.app/api/feed?shop=yoors&cc=NL&prices=1', { signal: AbortSignal.timeout(8000) }); if (r.ok) markt = ((await r.json()) || {}).items || {}; } catch (e) {}
      const termen = await demandRadar('NL').catch(() => []);
      const L = lokkers({ items, kaart, markt, termen, n: Math.min(30, Number(url.searchParams.get('n')) || 10) });
      if (url.searchParams.get('vorm') === 'json') return res.status(200).json({ ok: true, at: new Date().toISOString(), marktprijzen: Object.keys(markt).length, lokkers: L });
      const e2 = v => '€' + Number(v || 0).toFixed(2).replace('.', ',');
      const rij = (x, i) => `<tr${i === 0 ? ' class="top"' : ''}><td>${i + 1}</td><td><a href="${esc(x.link)}">${esc(x.titel)}</a><br><span class="k">${esc(x.merk || '')}${x.vraag ? ' · vraag: ' + esc(x.vraag.term) : ''}</span></td><td>${e2(x.nuPrijs)} + ${e2(x.verzending)}</td><td>${e2(x.inkoopMetBtw)}</td><td><b>${e2(x.lokkerPrijs)}</b><br><span class="k">thuis ${e2(x.lokkerThuis)}</span></td><td>${e2(x.elders)}<br><span class="k">${x.eldersZelfde ? 'zelfde product' : 'vergelijkbaar'}</span></td><td>${x.korting}%</td><td>${x.verliesPerVerkoop > 0 ? '<span class="r">−' + e2(x.verliesPerVerkoop) + '</span>' : '+' + e2(-x.verliesPerVerkoop)}</td><td>${x.bundel}</td></tr>`;
      res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
      return res.status(200).send(`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>Lokker voor de Yoors Shop</title><style>${look(ACC)}.wrap{max-width:62rem}.tw{overflow-x:auto;border:1px solid var(--line);border-radius:10px}table{border-collapse:collapse;width:100%;font-size:.9rem}th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{color:var(--ink-3)}tr.top td{background:var(--acc-2)}.k{color:var(--ink-3);font-size:.8rem}.r{color:#b91c1c;font-weight:650}</style></head><body><main class="wrap">
<p class="kicker">Yoors Shop · lokker</p><h1>Welk product zetten we onder de kostprijs neer?</h1>
<p class="standfirst">Een lokker verkopen we onder de inkoopprijs, zodat hij opvalt naast bol en Amazon. De winst moet komen van wat de koper er van hetzelfde merk bij bestelt, in dezelfde zending. Bovenaan staat de beste kandidaat.</p>
<p><b>Hoe gekozen:</b> vraag uit Demand Radar, hoeveel goedkoper dan elders (all-in, met verzending), wat het per verkoop kost, en hoeveel andere producten van hetzelfde merk mee kunnen. Lokkerprijs = de hoogste x,95 onder de inkoopprijs met btw. Voorwaarden: op voorraad, Nederlandse titel, levertijd hooguit 5 dagen, verzending hooguit €10, minstens 35% goedkoper dan elders.</p>
<div class="tw"><table><tr><th>#</th><th>Product</th><th>Nu (prijs + verzending)</th><th>Inkoop met btw</th><th>Lokkerprijs</th><th>Elders</th><th>Korting</th><th>Per verkoop</th><th>Mee te bundelen</th></tr>${L.map(rij).join('')}</table></div>
<p class="meta">"Per verkoop" is wat we overhouden (+) of verliezen (−) op de lokker zelf, na inkoop, onze verzending en betaalkosten. Live opgebouwd ${esc(new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }))} uit de datapagina van de shop en Demand Radar (${Object.keys(markt).length} marktprijzen).</p>
<p class="meta">Voorstel Henkjan en Claude (20 okt): de 3D Houten Uil Spaarpot op €9,95 (thuis €16,40 tegen €35,50 elders). Lokkercampagne loopt sinds 20 okt (PropellerAds 12032438) met de prijs die nu in de shop staat; gaat de prijs omlaag, dan passen we de advertenties aan.</p>
</main></body></html>`); }
    if (op === 'ttfeed' || op === 'ttfeed.csv') { // 17 nov: productcatalogus voor TikTok (CSV, dagelijks opgehaald); ?vorm=stand geeft alleen de telling
      const cat = await catalog(true), kaart = (await kv.get(K_KOST).catch(() => null)) || {}; const f = ttFeedCsv(cat.items, kaart, testLabels(await kv.get('hjdk:tt:test').catch(() => null))); res.setHeader('cache-control', 'public, max-age=900');
      if (url.searchParams.get('vorm') === 'stand') return res.status(200).json(Object.assign({ ok: true }, f.tel));
      res.setHeader('content-type', 'text/csv; charset=utf-8'); res.setHeader('content-disposition', 'inline; filename="kadoly-tiktok.csv"'); return res.status(200).send(f.csv); }
    if (op === 'ttproef') { // 17 nov (Henkjan: "iedere dag een aantal testen of toevoegen aan lopende testen om de winnaars te vinden"): dagelijkse producttest op TikTok (lib/tttest.js)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0], ua = String(req.headers['user-agent'] || ''), beschermd = /\.vercel\.app$/i.test(host);
      const st0 = await kv.get('hjdk:tt:test').catch(() => null); const cat = await catalog(true); const perId = {}; cat.items.forEach(i => { perId[i.id] = i; });
      const ids = Object.keys((st0 && st0.items) || {}); const telP = async lijst => { const t = await tellers('tt', 'p', lijst.map(pk)); return t; };
      const mag = /vercel-cron/i.test(ua) || beschermd || (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET); if (!mag) return res.status(404).send('Niet gevonden'); // marges: alleen intern
      if (url.searchParams.get('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); res.setHeader('cache-control', 'no-store'); return res.status(200).send(testTekst(st0, await telP(ids), perId)); }
      const droog = !!url.searchParams.get('droog'), dagNL = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());
      if (!droog && !url.searchParams.get('opnieuw') && st0 && st0.dag === dagNL) return res.status(200).json({ ok: true, al: true, tekst: testTekst(st0, await telP(ids), perId) });
      const kaart = (await kv.get(K_KOST).catch(() => null)) || {}; const r = testRonde(JSON.parse(JSON.stringify(st0 || { items: {} })), cat.items, kaart, await telP(ids), dagNL, { perDag: Number(url.searchParams.get('n')) || undefined });
      const tekst = 'TikTok producttest ' + dagNL + ': ' + r.nieuw.length + ' erbij, ' + r.lopend + ' lopend, ' + r.kandidaten + ' kandidaten met marge >= EUR ' + TT_TEST.MIN_MARGE + (r.gedaan.length ? '; ' + r.gedaan.map(g => g.uitslag + ': ' + String(g.t).slice(0, 40) + ' (' + g.reden + ')').join('; ') : '');
      if (!droog) { try { await kv.set('hjdk:tt:test', r.state, { ex: 120 * 86400 }); } catch (e) {} if (r.nieuw.length || r.gedaan.length) { try { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: new Date().toISOString(), wie: 'tiktok-test', tekst })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } catch (e) {} } }
      return res.status(200).json({ ok: true, droog, tekst, nieuw: r.nieuw, gedaan: r.gedaan, lopend: r.lopend, kandidaten: r.kandidaten }); }
    if (op === 'prijslijst') { // 17 nov (Henkjan: "Ja zet concurrerende lijst klaar"): nieuwe prijzen voor de shop (lib/shopprijs.js advies), zonder inkoop of marge; per stap hooguit 50% omhoog
      const cat = await catalog(true); const st = await prijsStand(kv, cat.items); const nu = new Date().toISOString();
      const rijen = st.rows.filter(r => (r.stand === 'omhoog' || r.stand === 'omlaag') && r.nieuwP != null).map(r => { let nieuwP = r.nieuwP, stap = false; if (nieuwP > r.p * 1.5) { nieuwP = Math.max(r.p, Math.floor(r.p * 1.5 - 0.95) + 0.95); stap = true; } return { id: r.id, titel: r.t, prijs_nu: r.p, prijs_nieuw: Math.round(nieuwP * 100) / 100, verzending: r.vk, totaal_nieuw: Math.round((nieuwP + r.vk) * 100) / 100, richting: nieuwP > r.p ? 'omhoog' : 'omlaag', zelfde_product_elders: !!r.zeker, waarom: r.waarom + (stap ? ' (eerste stap, hooguit 50% omhoog per keer)' : '') }; }).filter(x => Math.abs(x.prijs_nieuw - x.prijs_nu) >= 0.5);
      res.setHeader('cache-control', 'no-store'); res.setHeader('access-control-allow-origin', '*');
      if (url.searchParams.get('vorm') === 'csv') { const q = v => { const s2 = String(v == null ? '' : v); return /[",\n]/.test(s2) ? '"' + s2.replace(/"/g, '""') + '"' : s2; }; res.setHeader('content-type', 'text/csv; charset=utf-8'); return res.status(200).send(['id,titel,prijs_nu,prijs_nieuw,verzending,totaal_nieuw,richting,zelfde_product_elders,waarom', ...rijen.map(x => [x.id, x.titel, x.prijs_nu, x.prijs_nieuw, x.verzending, x.totaal_nieuw, x.richting, x.zelfde_product_elders ? 'ja' : 'nee', x.waarom].map(q).join(','))].join('\n') + '\n'); }
      return res.status(200).json({ ok: true, at: nu, marktprijzenVan: st.at || null, aantal: rijen.length, omhoog: rijen.filter(x => x.richting === 'omhoog').length, omlaag: rijen.filter(x => x.richting === 'omlaag').length, uitleg: 'prijs_nieuw is de productprijs zonder verzending. Nooit boven de goedkoopste aanbieder van hetzelfde product; vergelijkbare producten: hooguit 25% omhoog of 15% omlaag per keer; per stap hooguit 50% omhoog. Elke dag opnieuw berekend uit Demand Radar.', rijen }); }
    if (op === 'ttvideo') { // 17 nov: video uit de TikTok-advertentie per product, voor bovenaan de productpagina (shop, bij utm_source=tiktok); zonder p de hele lijst
      res.setHeader('cache-control', 'public, max-age=600'); res.setHeader('access-control-allow-origin', '*'); const p = String(url.searchParams.get('p') || '').slice(0, 40);
      if (!p) return res.status(200).json({ ok: true, videos: Object.fromEntries(Object.keys(TT_VIDEO).map(k => [k, ttVideo(k)])) });
      const v = ttVideo(p); return v ? res.status(200).json(Object.assign({ ok: true, p }, v)) : res.status(404).json({ ok: false, p, fout: 'geen video voor dit product' }); }
    if (op === 'bundel' || op === 'bundelronde') { // 17 nov (Henkjan: "experimenteer met een bundel die kunnen we klaar zetten iedere dag"): elke dag een set van hetzelfde merk met één verzending (lib/bundel.js)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0], ua = String(req.headers['user-agent'] || ''), beschermd = /\.vercel\.app$/i.test(host);
      const s = await geheim(), sk = String(req.headers['x-shop-sleutel'] || req.headers['x-lus-key'] || ''); const intern = beschermd || (s && sk === s) || (process.env.SHOP_FEED_KEY && sk === process.env.SHOP_FEED_KEY);
      const dagNL = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());
      if (op === 'bundel') { // openbaar voor de shop (kadoly.com/bundel/<code>): producten, regelprijzen en totaal; inkoop en marge alleen intern
        const code = String(url.searchParams.get('code') || '').replace(/[^a-z0-9]/g, '').slice(0, 20) || (await kv.get('hjdk:shop:bundel:nu').catch(() => null)) || bundelCode(dagNL);
        const b = await kv.get('hjdk:shop:bundel:' + code).catch(() => null); res.setHeader('cache-control', 'no-store'); res.setHeader('access-control-allow-origin', '*');
        if (url.searchParams.get('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(intern ? bundelTekst(b) : (b ? bundelOpenbaar(b).titel : 'Geen bundel')); }
        if (!b) return res.status(404).json({ ok: false, fout: 'geen bundel met code ' + code });
        const geldig = !b.geldigTot || b.geldigTot >= dagNL; return res.status(200).json(Object.assign({ ok: true, geldig }, bundelOpenbaar(b), intern ? { marge: b.marge, besparingPct: b.besparingPct, losMarkt: b.losMarkt, inkoop: b.items.map(x => x.c) } : {})); }
      const mag = /vercel-cron/i.test(ua) || beschermd || (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET); if (!mag) return res.status(404).send('Niet gevonden');
      const droog = !!url.searchParams.get('droog'), code = bundelCode(dagNL);
      if (!droog && !url.searchParams.get('opnieuw')) { const al = await kv.get('hjdk:shop:bundel:' + code).catch(() => null); if (al) return res.status(200).json({ ok: true, al: true, tekst: bundelTekst(al) }); }
      const cat = await catalog(true), kaart = (await kv.get(K_KOST).catch(() => null)) || {}; let markt = {}; try { const r = await fetch('https://demandradar-ivory.vercel.app/api/feed?shop=yoors&cc=NL&prices=1', { signal: AbortSignal.timeout(9000) }); if (r.ok) markt = ((await r.json()) || {}).items || {}; } catch (e) {}
      let hist = []; try { hist = ((await kv.raw(['LRANGE', 'hjdk:shop:bundel:hist', '0', '59'])) || []).map(x => { try { return typeof x === 'string' ? JSON.parse(x) : x; } catch (e) { return null; } }).filter(Boolean); } catch (e) {}
      const grens = new Date(Date.now() - BUNDEL_REGEL.NIET_HERHALEN_DAGEN * 864e5).toISOString().slice(0, 10);
      let thema; try { const t = await kv.get('hjdk:shop:bundel:thema'); if (t && Array.isArray(t.woorden) && (!t.tot || t.tot >= dagNL)) thema = t.woorden; } catch (e) {}
      const k = kiesBundel(cat.items, kaart, markt, { dag: dagNL, thema, recent: hist.filter(h => h.dag >= grens).flatMap(h => h.ids || []), sets: hist.map(h => (h.ids || []).slice().sort().join(',')), maxTotaal: Number(url.searchParams.get('max')) || undefined });
      let b = null; if (k.beste) { const x = k.beste; b = { code, dag: dagNL, geldigTot: new Date(Date.parse(dagNL) + 6 * 864e5).toISOString().slice(0, 10), merk: x.merk, titel: x.items.length + ' x ' + x.merk + ': ' + x.items.map(i => String(i.t).split(/[,(|-]/)[0].trim()).join(' + '), items: x.items.map(i => ({ id: i.id, t: i.t, img: i.img, nu: i.nu, los: i.los, deel: i.deel, vk: i.vk, c: i.c, same: i.same })), totaal: x.totaal, verzending: x.verzending, losOns: x.losOns, losMarkt: x.losMarkt, besparing: x.besparing, besparingPct: x.besparingPct, marge: x.marge, score: x.score, at: new Date().toISOString() }; }
      const info = { kandidaten: k.kandidaten, merken: k.merken, bekeken: k.bekeken, voldoen: k.voldoen, thema: k.thema, marktprijzen: Object.keys(markt).length };
      if (!droog && !b) { try { await kv.del(['hjdk:shop:bundel:' + code, 'hjdk:shop:bundel:nu']); } catch (e) {} } // geen set die de regels haalt: ook geen oude set van vandaag laten staan
      if (!droog && b) { try { await Promise.all([kv.set('hjdk:shop:bundel:' + code, b, { ex: 60 * 86400 }), kv.set('hjdk:shop:bundel:nu', code, { ex: 8 * 86400 })]); await kv.raw(['LPUSH', 'hjdk:shop:bundel:hist', JSON.stringify({ dag: dagNL, code, ids: b.items.map(i => i.id), totaal: b.totaal, marge: b.marge })]); await kv.raw(['LTRIM', 'hjdk:shop:bundel:hist', '0', '119']); } catch (e) {}
        try { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: new Date().toISOString(), wie: 'bundel-ronde', tekst: 'Kadoly bundel ' + code + ': ' + b.titel + ', EUR ' + b.totaal.toFixed(2) + ' (bespaart EUR ' + b.besparing.toFixed(2) + '), marge EUR ' + b.marge.toFixed(2) })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } catch (e) {} }
      return res.status(200).json({ ok: true, droog, info, tekst: bundelTekst(b, info), bundel: b }); }
    if (op === 'prijsadvies') { // 17 nov (Henkjan: "Adviseer gezonde marge die wel concurreert"): prijsadvies met marktprijzen (Demand Radar) en inkoop per product, compact; alleen via de beschermde vercel.app-host. ?q=termen (komma) of leeg voor alles
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const q = String(url.searchParams.get('q') || '').toLowerCase().split(/[,|]/).map(x => x.trim()).filter(Boolean).slice(0, 30);
      const cat = await catalog(true); const items = q.length ? cat.items.filter(i => { const t = (i.t + ' ' + (i.b || '') + ' ' + (i.c || '') + ' ' + (i.s || '')).toLowerCase(); return q.some(w => t.includes(w)); }) : cat.items;
      const st = await prijsStand(kv, items); const kaart = (await kv.get(K_KOST).catch(() => null)) || {};
      const mk = r => { const m = r.markt || {}, s2 = m.same || {}, sm = m.similar || {}; const p = k => (s2[k] ? s2[k].p : null); const ms = k => (sm[k] ? sm[k].median : null); return { bol: p('bol'), amzNl: p('amzNl'), amzDe: p('amzDe'), lowSame: m.lowSame ?? null, medSim: m.medSimilar ?? null, simBol: ms('bol'), simAmz: ms('amzNl') }; };
      const rows = st.rows.map(r => { const k = kaart[r.id] || {}; return [r.id, String(r.t).slice(0, 60), r.nu, r.vk, k.c ?? null, k.z ?? null, r.marge, r.stand, r.nieuw ?? null, r.margeNieuw ?? null, r.min ?? null, mk(r)]; });
      return res.status(200).json({ ok: true, at: st.at, catalogus: cat.items.length, gevraagd: items.length, metMarkt: st.metMarkt, telling: { omhoog: st.omhoog, omlaag: st.omlaag, goed: st.goed, nietAdverteren: st.nietAdverteren, controleren: st.controleren, geen: st.geen, zelfde: st.zelfde }, kop: ['id', 'titel', 'totaalNu', 'verzendingKlant', 'inkoop', 'onzeVerzending', 'margeNu', 'stand', 'adviesTotaal', 'margeAdvies', 'minTotaal', 'markt'], rows }); }
    if (op === 'catoverzicht') { // 17 nov (Henkjan: "Vindt de meta ads library en match op onze producten"): categorieën met aantal, prijs, marge en voorbeelden; alleen via de beschermde host
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const cat = await catalog(true), g = {}; for (const i of cat.items) { if (i.vr === false) continue; const k = (i.c || '-') + ' > ' + (i.s || '-'); const x = (g[k] = g[k] || { n: 0, p: [], mg: [], vb: [] }); x.n++; x.p.push(num(i.p) + (i.fs ? 0 : num(i.vk))); if (i.mg != null) x.mg.push(num(i.mg)); if (x.vb.length < 6) x.vb.push(String(i.t).slice(0, 60)); }
      const med = a => { if (!a.length) return null; const b = a.slice().sort((m, n) => m - n); return Math.round(b[Math.floor(b.length / 2)] * 100) / 100; };
      return res.status(200).json({ ok: true, producten: cat.items.length, groepen: Object.entries(g).sort((a, b) => b[1].n - a[1].n).map(([k, x]) => [k, x.n, med(x.p), med(x.mg), x.vb]) }); }
    if (op === 'zoek') { // zoeken in de shopcatalogus (titel, merk, categorie), met prijs, verzending en marge; alleen via de beschermde vercel.app-host
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const q = String(url.searchParams.get('q') || '').toLowerCase().split(/[,|]/).map(x => x.trim()).filter(Boolean).slice(0, 30); if (!q.length) return res.status(400).json({ ok: false, fout: 'q ontbreekt (meerdere termen met komma)' });
      const cat = await catalog(true), kaart = (await kv.get(K_KOST).catch(() => null)) || {};
      const minM = Number(url.searchParams.get('minmarge')) || 0; let hit = cat.items.filter(i => { const t = (i.id + ' ' + i.t + ' ' + (i.b || '') + ' ' + (i.c || '') + ' ' + (i.s || '')).toLowerCase(); return q.some(w => t.includes(w)); }); if (minM) hit = hit.filter(i => num(i.mg) >= minM && i.vr !== false).sort((a, b) => num(b.mg) - num(a.mg)); // 17 nov: minmarge = alleen producten met die marge en voorraad, hoogste marge eerst
      if (url.searchParams.get('kort') === '1') return res.status(200).json({ ok: true, gevonden: hit.length, items: hit.slice(0, 200).map(i => [i.id, String(i.t).slice(0, 70), Math.round((num(i.p) + (i.fs ? 0 : num(i.vk))) * 100) / 100, i.lt ?? null, i.vr === false ? 'uit' : '', i.mg ?? null]) }); // kort: id, titel, thuisprijs, levertijd, voorraad, marge
      return res.status(200).json({ ok: true, catalogusVan: cat.at ? new Date(cat.at).toISOString() : null, producten: cat.items.length, gevonden: hit.length, items: hit.slice(0, 200).map(i => { const k = kaart[i.id] || {}; const vk = i.fs ? 0 : num(i.vk); return { id: i.id, titel: i.t, merk: i.b || null, cat: i.c || null, sub: i.s || null, prijs: i.p, verzending: vk, thuis: Math.round((num(i.p) + vk) * 100) / 100, inkoop: k.c ?? null, onzeVerzending: k.z ?? null, marge: i.mg ?? null, voorraad: i.vr ?? null, levertijd: i.lt ?? null, img: !!i.img, link: 'https://kadoly.com/product/' + i.id + '?lang=nl' }; }) }); }
    if (op === 'kies' || op === 'getest') { // shoptest (Henkjan 19 okt): elke dag 20 producten lerend testen; lib/shopkies.js. Marges staan erin: alleen met de gedeelde sleutel of via de beschermde vercel.app-host
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; const s = await geheim(); const k = String(req.headers['x-shop-sleutel'] || '');
      if (!/\.vercel\.app$/i.test(host) && !(s && k === s)) return res.status(404).send('Niet gevonden');
      if (op === 'getest') { // de PropellerAds-lus meldt welke producten vandaag een campagne kregen (POST {pids})
        let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
        const g = (await kv.get(K_GETEST)) || {}; let nieuw = 0; for (const p of (Array.isArray(b.pids) ? b.pids : [])) { const id = pidOk(p); if (id && !g[id]) { g[id] = DAY(); nieuw++; } }
        if (nieuw) await kv.set(K_GETEST, g); return res.status(200).json({ ok: true, nieuw, totaal: Object.keys(g).length }); }
      if (/^\d{1,2}$/.test(url.searchParams.get('maxlev') || '') && /\.vercel\.app$/i.test(host)) await kv.set(K_MAXLEV, Math.min(30, Number(url.searchParams.get('maxlev')))).catch(() => {}); // levertijdgrens vastzetten; geldt vanaf de volgende verse keuze
      if (STRATEGIEEN.includes(url.searchParams.get('strategie')) && /\.vercel\.app$/i.test(host)) await kv.set(K_STRATEGIE, url.searchParams.get('strategie')).catch(() => {}); // strategie vastzetten (alleen via de beschermde host); geldt vanaf de volgende keuze
      const dag = DAY(), ck = 'hjdk:shop:kies:' + dag, n = Math.max(1, Math.min(80, Number(url.searchParams.get('n')) || KIES_REGELS.n)); // tot 80 (Henkjan 26 okt: "Morgen 50 producten testen")
      let cache = null; if (!url.searchParams.get('vers')) { const c = await kv.get(ck).catch(() => null); if (c && c.n >= n) cache = c; }
      const items = (await catalog(true)).items, kaart = (await kv.get(K_KOST).catch(() => null)) || {}, getest = (await kv.get(K_GETEST).catch(() => null)) || {};
      let markt = {}; try { const r = await fetch('https://demandradar-ivory.vercel.app/api/feed?shop=yoors&cc=NL&prices=1', { signal: AbortSignal.timeout(8000) }); if (r.ok) markt = ((await r.json()) || {}).items || {}; } catch (e) {}
      const termen = await demandRadar('NL').catch(() => []);
      const SRT = ['dv', 'dm', 'da', 'cart', 'koop', 'himp', 'lm', 'la'], keys = []; items.forEach(i => SRT.forEach(x => keys.push('c:sh-p-' + pk(i.id) + '-' + x)));
      const vals = []; for (let i = 0; i < keys.length; i += 480) vals.push(...await kv.mget(...keys.slice(i, i + 480)));
      const tellers = {}; items.forEach((it, i) => { const o = {}; let iets = 0; SRT.forEach((x, j) => { o[x] = num(vals[i * SRT.length + j]); iets += o[x]; }); o.dv += o.himp; o.dm += o.lm; o.da += o.la; if (iets) tellers[it.id] = o; }); // 28 okt: route via onze pagina (himp/lm/la) telt mee
      const strategie = STRATEGIEEN.includes(url.searchParams.get('strategie')) ? url.searchParams.get('strategie') : ((await kv.get(K_STRATEGIE).catch(() => null)) || 'auto');
      const ml0 = await kv.get(K_MAXLEV).catch(() => null), maxLev = ml0 != null && ml0 !== '' ? Number(ml0) : KIES_REGELS.maxLevertijd;
      const uit = kies({ strategie, items, kaart, markt, termen, tellers, getest, seizoen, thema: themaVan, vandaag: dag, n, vast: VAST_DAG[dag] || [], maxLev, plaatje: pid => ({ icon: beeld(pid, 'icon'), image: beeld(pid, 'pa'), link: 'https://kadoly.com/product/' + pid + '?lang=nl' }) });
      kv.set('hjdk:shop:duurder', uit.duurderDanElders || {}, { ex: 3 * 86400 }).catch(() => {}); // 13 nov: de verlanglijst (api/w.js) toont nooit wat elders goedkoper is
      uit.bronnen = { catalogus: items.length, metInkoop: Object.keys(kaart).length, marktprijzen: Object.keys(markt).length, vraagtermen: termen.length, metVerkeer: Object.keys(tellers).length, alGetest: Object.keys(getest).length };
      if (url.searchParams.get('kort') === '1') { // compact voor de dagelijkse gidsronde (gids.kadoly.com, 30 okt): welke producten tractie hebben, met titel en categorie
        const dd = uit.duurderDanElders || {}; const perId = {}; items.forEach(i => { perId[i.id] = i; }); const lijst = (uit.presterend || []).concat(uit.veelbelovend || []).filter(x => !dd[x.pid] && perId[x.pid] && perId[x.pid].vr !== false).slice(0, 40).map(x => { const i = perId[x.pid] || {}; return { pid: x.pid, titel: i.t, merk: i.b || null, cat: i.c, sub: i.s, thuis: Math.round((num(i.p) + (i.fs ? 0 : num(i.vk))) * 100) / 100, waarom: x.waarom, beeld: i.img ? beeld(x.pid, 'ig') : null }; }); // 16 nov: nooit wat elders goedkoper is of uitverkocht; beeld = 1080x1350 voor de Kadoly-posts (kadoly/taak-social.md)
        return res.status(200).json({ ok: true, dag, tractie: lijst }); }
      if (cache) { // dagkeuze blijft die van vanochtend; oordelen en de vaste plekken voor presterend en veelbelovend zijn altijd vers
        const dd = uit.duurderDanElders || {}; const vast = (cache.gekozen || []).filter(x => x.hoe !== 'presterend' && x.hoe !== 'veelbelovend' && !dd[x.pid]); // 13 nov: nooit wat elders goedkoper is
        const extra = (uit.gekozen || []).filter(x => (x.hoe === 'presterend' || x.hoe === 'veelbelovend' || x.hoe === 'vast') && !vast.some(v => v.pid === x.pid));
        const gk = vast.concat(extra); const ai = await metVerkoop(gk);
        return res.status(200).json(Object.assign({ ok: true, uitCache: true, verkoopteksten: ai }, cache, { gekozen: gk, duurderDanElders: uit.duurderDanElders, presterend: uit.presterend, veelbelovend: uit.veelbelovend, af: uit.af, onbeslist: uit.onbeslist, gemiddeldeTikratio: uit.gemiddeldeTikratio })); }
      uit.verkoopteksten = await metVerkoop(uit.gekozen, 150000); // verse dagkeuze (ochtend, opgewarmd om 04:25 UTC): ruim de tijd
      await kv.set(ck, uit, { ex: 3 * 86400 }).catch(() => {});
      return res.status(200).json(Object.assign({ ok: true }, uit)); }
    if (op === 'tekstlessen') { // POST van de PropellerAds-lus (propellerads-mcp lib/tekstleer.ts): beste en slechtste teksten op de hele keten tot kopen; GET leest ze
      if (req.method === 'POST') { const s0 = await geheim(); if (!s0 || String(req.headers['x-shop-sleutel'] || '') !== s0) return res.status(403).json({ ok: false }); let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
        const kort = x => ({ hoek: String(x.hoek || '').slice(0, 20), title: String(x.title || '').slice(0, 40), description: String(x.description || '').slice(0, 50), cta: String(x.cta || '').slice(0, 20), score: num(x.score), vert: num(x.vert) });
        const v = { at: new Date().toISOString(), best: (Array.isArray(b.best) ? b.best : []).slice(0, 12).map(kort), slecht: (Array.isArray(b.slecht) ? b.slecht : []).slice(0, 8).map(kort) };
        await kv.set('hjdk:shop:tekstlessen', v, { ex: 30 * 86400 }); return res.status(200).json({ ok: true, best: v.best.length, slecht: v.slecht.length }); }
      return res.status(200).json({ ok: true, lessen: await kv.get('hjdk:shop:tekstlessen').catch(() => null) }); }
    if (op === 'teksten') { // verkoopteksten van de dagkeuze laten schrijven en een paar laten zien (alleen beschermde host); ?n=3
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const c = await kv.get('hjdk:shop:kies:' + DAY()).catch(() => null); if (!c || !Array.isArray(c.gekozen)) return res.status(200).json({ ok: false, fout: 'nog geen dagkeuze vandaag' });
      const ai = await metVerkoop(c.gekozen, 120000); const n = Math.max(1, Math.min(10, Number(url.searchParams.get('n')) || 3));
      const laatst = await kv.get('hjdk:shop:advai:laatst').catch(() => null), aifout = await kv.get('hjdk:shop:claudefout').catch(() => null);
      return res.status(200).json({ ok: true, producten: c.gekozen.length, metVerkoopteksten: ai, laatsteAfkeur: laatst, aiFout: aifout, voorbeeld: c.gekozen.slice(0, n).map(p => ({ titel: p.titel, thuis: p.thuis, advertenties: (p.advertenties || []).map(a => [a.hoek, a.title, a.description, a.cta].join(' | ')) })) }); }
    if (op === 'keten') { // openbaar, alleen totalen: de lekketen van de shop richting de kassa per dag (?dag=JJJJ-MM-DD, ?vorm=tekst)
      const { lekketen, ketenTekst } = await import('../lib/shopketen.js'); const dg = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('dag') || '') ? url.searchParams.get('dag') : DAY(); const kt = await lekketen(kv, dg);
      res.setHeader('cache-control', 'no-store'); if (url.searchParams.get('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(ketenTekst(kt)); } return res.status(200).json(kt); }
    if (op === 'org') { // 16 nov (Henkjan: "zorg dat alles via clickmind loopt"): organische kanalen (k = fb, ig, pin, tt, th, x, li, yt, tg, wa, gbp, nb) naar een product via Clickmind, zodat de keten tot betaald per kanaal (org:d:<dag>) en per post (c, org:p:<post>) gemeten wordt. Linkvoorbeelden (Facebook, WhatsApp, Pinterest ...) gaan door zonder klik te tellen, anders geen titel en foto in de post.
      const KAN = KAN_ORG;
      const k = KAN[url.searchParams.get('k')] ? url.searchParams.get('k') : 'x'; const pid = pidOk(url.searchParams.get('p')); const post = String(url.searchParams.get('c') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40); const ua = String(req.headers['user-agent'] || '');
      const tel = veld => laterAf(Promise.all([kv.raw(['HINCRBY', 'org:d:' + DAY(), k + '|' + veld, '1']), kv.raw(['EXPIRE', 'org:d:' + DAY(), String(120 * 86400)])]).catch(() => {}));
      const kaal = 'https://kadoly.com/' + (pid ? 'product/' + encodeURIComponent(pid) + '?lang=nl&' : '?') + 'utm_source=' + KAN[k] + '&utm_medium=social&utm_campaign=' + encodeURIComponent(post || 'profiel');
      if (/facebookexternalhit|facebot|twitterbot|pinterest|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|redditbot|embedly|skypeuripreview|applebot|bytespider|tiktok/i.test(ua) && !/mobile safari|instagram|fban|fbav/i.test(ua)) { tel('voorbeeld'); res.statusCode = 302; res.setHeader('location', kaal); res.setHeader('cache-control', 'no-store'); return res.end(); }
      const bot = isBot(ua); if (!bot) { tel(pid ? 'uit' : 'profiel'); if (post && pid) laterAf(Promise.all([kv.raw(['HINCRBY', 'org:p:' + post, pid, '1']), kv.raw(['EXPIRE', 'org:p:' + post, String(180 * 86400)]), kv.raw(['SADD', 'org:posts', post])]).catch(() => {})); }
      if (!pid) { res.statusCode = 302; res.setHeader('location', kaal); res.setHeader('cache-control', 'no-store'); return res.end(); }
      const clickid = 'org-' + k + '-' + (post || 'x') + '-' + randomBytes(6).toString('hex');
      return await direct(req, res, { net: 'x', clickid, zone: 'o' + k, cr: '', camp: post, pid, code: shortId('x:' + clickid), bot, vrij: true, bron: { source: KAN[k], medium: 'social', campaign: post || KAN[k] } }); } // zone = kanaal, camp = post: Clickmind telt de hele keten (klik, echt mens, actie, mandje, koop) per kanaal en per post (sh-x-zo<k>-<stap>, sh-x-k<post>-<stap>)
    if (op === 'orgstand') { // openbaar, alleen totalen: kliks per organisch kanaal per dag (?dagen=7)
      const n = Math.min(30, Math.max(1, Number(url.searchParams.get('dagen')) || 7)); const uit = {}; for (let i = 0; i < n; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); const h = await kv.raw(['HGETALL', 'org:d:' + d]).catch(() => null); if (h && h.length) { const o = {}; for (let j = 0; j < h.length; j += 2) o[h[j]] = Number(h[j + 1]); uit[d] = o; } }
      const ST = ['dv', 'dm', 'da', 'cart', 'koop']; const NAAM = { dv: 'kliks', dm: 'echt', da: 'actie', cart: 'mandje', koop: 'koop' };
      const reeks = async pre => { const v = await kv.mget(...ST.map(x => pre + '-' + x)).catch(() => []); const o = {}; ST.forEach((x, i) => { const n = Number(v[i]) || 0; if (n) o[NAAM[x]] = n; }); return o; };
      const kanalen = {}; for (const k of Object.keys(KAN_ORG)) { const o = await reeks('c:sh-x-zo' + k); if (Object.keys(o).length) kanalen[KAN_ORG[k]] = o; }
      const posts = {}; let lijst = []; try { lijst = ((await kv.raw(['SMEMBERS', 'org:posts'])) || []).slice(0, 300); } catch (e) {} for (const p of lijst) { const o = await reeks('c:sh-x-k' + p); if (Object.keys(o).length) posts[p] = o; }
      return res.status(200).json({ ok: true, uitleg: 'kliks per dag (org:d), keten per kanaal en per post via Clickmind (kliks, echt mens, actie, mandje, koop; sinds 16 nov 23:00 UTC)', dagen: uit, kanalen, posts }); }
    if (op === 'gidsuit') { // klik vanuit gids.kadoly.com naar een product: via Clickmind (direct), zodat de keten tot betaald per gids gemeten wordt (30 okt)
      const pid = pidOk(url.searchParams.get('p')); const g = String(url.searchParams.get('g') || '').replace(/[^a-z0-9-]/g, '').slice(0, 60); const b = String(url.searchParams.get('b') || '').replace(/[^a-z]/g, '').slice(0, 12);
      if (!pid) { res.statusCode = 302; res.setHeader('location', 'https://kadoly.com/'); return res.end(); }
      const bot = isBot(req.headers['user-agent'] || ''); const arm = url.searchParams.get('a') === 'k' ? 'k' : 'p'; const clickid = 'gids-' + (g || 'x') + '-' + arm + '-' + randomBytes(6).toString('hex'); const zh = String(url.searchParams.get('h') || '').replace(/[^0-9a-f]/g, '').slice(0, 12); // arm k: meteen naar afrekenen (30 okt, Henkjan: "Bekijk maar ook direct naar reken af"); h: zoekvraag waarop geklikt is (de zoekbalk leert ervan)
      if (!bot) { try { await kv.raw(['HINCRBY', 'gk:d:' + DAY(), (g || 'x') + '|uit-' + (b || 'x'), '1']); await kv.raw(['HINCRBY', 'gk:d:' + DAY(), (g || 'x') + '|uitarm-' + arm, '1']); if (zh.length === 12) { await kv.raw(['HINCRBY', 'gk:zk:' + zh, pid, '1']); await kv.raw(['EXPIRE', 'gk:zk:' + zh, String(180 * 86400)]); } await kv.raw(['EXPIRE', 'gk:d:' + DAY(), String(60 * 86400)]); if (g) { await kv.raw(['HINCRBY', 'gk:p:' + g, pid, '1']); await kv.raw(['EXPIRE', 'gk:p:' + g, String(120 * 86400)]); } } catch (e) {} } // gk:p: kliks per product per gids: de gids leert er zijn volgorde van
      return await direct(req, res, { net: 'x', clickid, zone: '', cr: '', camp: '', pid, code: shortId('x:' + clickid), bot, vrij: true, kassa: arm === 'k', bron: { medium: 'gids', campaign: g || 'gids' } }); }
    if (op === 'snelheid') { // openbaar, alleen lezen: hoe zwaar de productpagina is voor een NL-telefoon (omleidingen, scripts, css, beelden); 6 uur bewaard
      const { snelheid } = await import('../lib/shopsnelheid.js'); const pid = pidOk(url.searchParams.get('p')) || 'oc_4174004347453441';
      res.setHeader('cache-control', 'no-store'); return res.status(200).json(await snelheid(kv, pid, !!url.searchParams.get('vers'))); }
    if (op === 'warm') { // warm publiek (4 nov): hoeveel Clickmind-personen een mandjespoor hebben, en of de remarketing-link ze vond. ?vul=1 op de beschermde host: eenmalig aanvullen uit de klikrecords van de laatste 7 dagen
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; let gevuld = null;
      if (url.searchParams.get('vul') === '1') { if (!/\.vercel\.app$/i.test(host)) return res.status(403).json({ ok: false });
        gevuld = { gezien: 0, warm: 0, zonderPersoon: 0 }; let cur = '0';
        do { const [cc, keys] = await kv.scan(cur, { match: 'hjdk:shc:*', count: 1000 }); cur = cc;
          for (let i = 0; i < keys.length; i += 200) { const vals = await kv.mget(...keys.slice(i, i + 200));
            for (const r of vals) { if (!r || r.t || !r.px || !r.p) continue; gevuld.gezien++; const px = r.px; if (Object.keys(px).some(k => k.startsWith('koop'))) continue;
              const stap = px.betaal ? 'betaal' : px.afreken ? 'afreken' : px.cart ? 'cart' : ''; if (!stap) continue;
              let mp = r.mp || ''; if (!mp && r.mmc) { try { mp = String((await kv.raw(['HGET', 'mm:cid:' + r.mmc, 'pid'])) || ''); } catch (e) {} }
              if (!/^[0-9a-f]{16}$/.test(mp)) { gevuld.zonderPersoon++; continue; } await warmZet(kv, mp, r.p, stap); gevuld.warm++; } }
        } while (cur !== '0'); }
      const tel = { bekeken: 0, cart: 0, afreken: 0, betaal: 0 }; let cur = '0', n = 0;
      do { const [cc, keys] = await kv.scan(cur, { match: 'hjdk:warm:*', count: 1000 }); cur = cc; n += keys.length;
        for (let i = 0; i < keys.length; i += 200) { const vals = await kv.mget(...keys.slice(i, i + 200)); for (const w of vals) if (w && tel[w.stap] !== undefined) tel[w.stap]++; } } while (cur !== '0');
      const rk = await kv.mget('c:sh-rt-raak', 'c:sh-rt-mis', 'c:sh-d' + D8() + '-rt-raak', 'c:sh-d' + D8() + '-rt-mis');
      return res.status(200).json({ ok: true, personen: n, perStap: tel, remarketing: { gevonden: num(rk[0]), nietGevonden: num(rk[1]), vandaagGevonden: num(rk[2]), vandaagNiet: num(rk[3]) }, gevuld }); }
    if (op === 'netdetail') { // openbaar, alleen totalen (4 nov, Henkjan: "Wat doet MGID verkeer tot nu toe"): per netwerk (?net=mg) de keten per product, advertentie en plek, vandaag (of ?uren=)
      const net = String(url.searchParams.get('net') || 'mg').replace(/[^a-z]/g, '').slice(0, 3); const sinds = Date.now() - Math.max(1, Math.min(72, Number(url.searchParams.get('uren')) || ((Date.now() - new Date(DAY() + 'T00:00:00Z').getTime()) / 36e5))) * 36e5;
      const leeg = () => ({ kwam: 0, geladen: 0, mens: 0, tik: 0, s15: 0, s60: 0, scroll50: 0, pag2: 0, mandjeKlik: 0, nuKopen: 0, afrekenpagina: 0, winkelmand: 0, afrekenen: 0, betaald: 0 });
      const tel = (x, r) => { x.kwam++; if (r.yg) x.geladen++; if (r.ym) x.mens++; if (r.ya) x.tik++; if (r.yt15) x.s15++; if (r.yt60) x.s60++; if (r.ys50) x.scroll50++; if (r.yp2) x.pag2++; if (r.ywk) x.mandjeKlik++; if (r.ykk) x.nuKopen++; if (r.ykp) x.afrekenpagina++; const px = r.px || {}; if (px.cart) x.winkelmand++; if (px.afreken) x.afrekenen++; if (Object.keys(px).some(k => k.startsWith('koop'))) x.betaald++; };
      const tot = leeg(), per = { product: {}, advertentie: {}, plek: {}, campagne: {} }; let cur = '0', gezien = 0; const T0 = Date.now(); // 5 nov: geen telgrens meer (er staan >60.000 records; een telgrens sloeg willekeurig records over), alleen een tijdgrens
      do { const [cc, keys] = await kv.scan(cur, { match: 'hjdk:shc:*', count: 1000 }); cur = cc;
        for (let i = 0; i < keys.length; i += 200) { const vals = await kv.mget(...keys.slice(i, i + 200)); gezien += vals.length;
          for (const r of vals) { if (!r || r.t || r.s !== net || num(r.at) < sinds) continue; tel(tot, r);
            for (const [m, k] of [[per.product, r.p || '-'], [per.advertentie, r.a || '-'], [per.plek, r.z || '-'], [per.campagne, r.k || '-']]) tel(m[k] || (m[k] = leeg()), r); } }
      } while (cur !== '0' && Date.now() - T0 < 40000);
      const cat = await catalog(); const naam = {}; cat.items.forEach(i => { naam[i.id] = i.t; });
      const top = (m, n, f) => Object.entries(m).sort((x, y) => y[1].mens - x[1].mens || y[1].kwam - x[1].kwam).slice(0, n).map(([k, v]) => ({ [f]: k, ...(f === 'product' ? { titel: String(naam[k] || '').slice(0, 60) } : {}), ...v, mensPct: v.kwam ? Math.round(100 * v.mens / v.kwam) : 0 }));
      return res.status(200).json({ ok: true, at: new Date().toISOString(), netwerk: NETTEN[net] || net, sinds: new Date(sinds).toISOString(), totaal: { ...tot, mensPct: tot.kwam ? Math.round(100 * tot.mens / tot.kwam) : 0 }, perCampagne: top(per.campagne, 10, 'campagne'), perProduct: top(per.product, 25, 'product'), perAdvertentie: top(per.advertentie, 30, 'advertentie'), perPlek: top(per.plek, 25, 'plek') }); }
    if (op === 'kassasessies') { // openbaar, zonder persoonsgegevens: per bezoeker (kort kenmerk) wat er op de weg naar en op de afrekenpagina gebeurde (3 nov)
      const ruw = await kv.raw(['LRANGE', 'hjdk:shop:kassalog', '0', '2999']).catch(() => []); const per = {};
      for (const x of (Array.isArray(ruw) ? ruw : [])) { let o = null; try { o = typeof x === 'string' ? JSON.parse(x) : x; } catch (e) {} if (!o || !o.c) continue; const v = per[o.c] || (per[o.c] = { net: o.s, p: o.p, zone: o.z, aan: o.at, ev: {} }); v.ev[o.soort] = { t: o.t, w: o.w }; }
      const rijen = Object.values(per).filter(v => v.ev.kpag).sort((a, b) => b.ev.kpag.t - a.ev.kpag.t).slice(0, 60).map(v => { const e = v.ev, kp = e.kpag.t; return { net: v.net, product: v.p, zone: v.zone, uur: new Date(kp).toISOString().slice(11, 16), minTotAfrekenen: v.aan ? Math.round((kp - v.aan) / 6e4 * 10) / 10 : null, secOpAfrekenpagina: e.kweg ? Math.round((e.kweg.t - kp) / 1000) : null, prijs: e.kprijs ? e.kprijs.w : null, kopersbescherming: e.kfee ? e.kfee.w : null, deed: ['kt5', 'kscroll', 'kterug', 'kknop', 'kmail', 'kadres', 'kmeth', 'kpp', 'kpay', 'kfout', 'kt20', 'kt60', 'kweg', 'kweg5', 'kweg20', 'kweglang'].filter(k => e[k]) }; });
      if (url.searchParams.get('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('Kadoly afrekenpagina per bezoeker (nieuwste eerst)\n' + rijen.map(r => `${r.uur} ${r.net} ${r.product} | ${r.minTotAfrekenen ?? '?'} min tot afrekenen | ${r.secOpAfrekenpagina ?? '?'} s op de pagina | prijs ${r.prijs ?? '?'} | kopersbescherming ${r.kopersbescherming ?? '-'} | ${r.deed.join(', ') || 'niets'}`).join('\n')); }
      return res.status(200).json({ ok: true, bezoekers: rijen }); }
    if (op === 'pinads') { // pi is the Pinterest family; only pp=0 is confirmed paid delivery.
      const ids = await smembers(K.set('a', 'pi'));
      const fields = v => ({ aan: num(v.dv), echt: num(v.dm), actie: num(v.da), t15: num(v.dt15), t60: num(v.dt60), scroll50: num(v.ds50), tik: num(v.dwk), kassa: num(v.dkp), cart: num(v.cart), koop: num(v.koop), omzet: num(v.omzet) / 100 });
      const cohorten = {};
      for (const c of ['paid', 'earned', 'unknown']) {
        const net = 'pi-' + c, t = await tellers(net, 'a', ids), ads = {};
        for (const [id, v] of Object.entries(t)) ads[id] = fields(v);
        const vals = await kv.mget(...SOORTEN.map(k => 'c:sh-d' + D8() + '-' + net + '-' + k));
        cohorten[c] = { vandaag: fields(Object.fromEntries(SOORTEN.map((k, i) => [k, vals[i]]))), ads };
      }
      return res.status(200).json({ ok: true, netwerk: 'pinterest', at: new Date().toISOString(), meetversie: '2026-11-17-pinterest-pp', vandaag: cohorten.paid.vandaag, ads: cohorten.paid.ads, cohorten, allePinterest: fields((await dagTotaal(DAY())).pi), uitleg: 'paid=pp0; earned=pp1; unknown=pp ontbreekt/ongeldig; geen historische herindeling; aan=requests; echt=interactiesignaal, geen unieke mensen; cart=geslaagde winkelwagenmelding; koop=betaalde order; eigen tests uitgesloten' });
    }
    if (op === 'ttads') { // 16 nov (Henkjan: "Yes start en ga leren . Zet clikmind er tussen ."): per TikTok-advertentie (ad-id uit __CID__) wat Clickmind zag, voor de leerronde; alleen tellingen
      const ids = await smembers(K.set('a', 'tt')); const t = await tellers('tt', 'a', ids); const ads = {};
      for (const [id, v] of Object.entries(t)) ads[id] = { aan: v.dv, echt: v.dm, actie: v.da, tik: v.dwk, blad: v.dbo, verder: v.dbn, kassa: v.dkp, cart: v.cart, koop: v.koop, omzet: Math.round((v.omzet || 0)) / 100 };
      const d = (await dagTotaal(DAY())).tt; const ar = await tellers('tt', 'arm', ['p', 'k']); const proef = {}; for (const [k, v] of Object.entries(ar)) proef[k === 'k' ? 'afrekenpagina' : 'productpagina'] = { aan: v.dv, echt: v.dm, tik: v.dwk, kassa: v.dkp, cart: v.cart, koop: v.koop }; return res.status(200).json({ ok: true, at: new Date().toISOString(), vandaag: { aan: d.dv, echt: d.dm, tik: d.dwk, kassa: d.dkp, cart: d.cart, koop: d.koop }, proef, ads }); }
    if (op === 'mandjes') { // 14 nov (Henkjan: "Zoek dit nu uit ... waarom 16 van de 19 mandjes niet doorgingen naar de afrekenpagina. Ik kijk per bezoeker wat er tussen mandje en afrekenen gebeurt"): openbaar, zonder persoonsgegevens; per bezoeker met een tik op de koopknop (wklik) van ?dag= (standaard vandaag) alles wat Clickmind daarna van hem zag, in seconden na de tik
      const dg = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('dag') || '') ? url.searchParams.get('dag') : DAY();
      const ruw = await kv.raw(['LRANGE', 'hjdk:shop:kassalog', '0', '2999']).catch(() => []); const tik = {};
      for (const x of (Array.isArray(ruw) ? ruw : [])) { let o = null; try { o = typeof x === 'string' ? JSON.parse(x) : x; } catch (e) {} if (o && o.c && o.soort === 'wklik' && new Date(o.t).toISOString().slice(0, 10) === dg && !tik[o.c]) tik[o.c] = o; }
      const NAAM = { m: 'echt', a: 'actie', g: 'geladen', z: 'zicht1' }; for (const [k, v] of Object.entries(GEDRAG)) NAAM[v] = k;
      const codes = Object.keys(tik).slice(0, 80); const recs = await Promise.all(codes.map(c => kv.get(K.rec(c)).catch(() => null)));
      const rijen = codes.map((c, i) => { const r = recs[i] || {}, t0 = tik[c].t, voor = [], na = [];
        for (const [k, v] of Object.entries(r)) { if (!/^y[a-z0-9]{1,3}$/.test(k) || !Number(v)) continue; const n = NAAM[k.slice(1)] || k.slice(1); if (n === 'wklik') continue; const s = Math.round((Number(v) - t0) / 1000); (s < 0 ? voor : na).push([n, s]); }
        na.sort((a, b) => a[1] - b[1]); const heeft = n => na.some(x => x[0] === n);
        const uitkomst = heeft('kpag') ? 'afrekenpagina' : heeft('bsverder') ? 'Verder naar betalen getikt, geen afrekenpagina' : heeft('bsmail') || heeft('bsadres') ? 'blad ingevuld, niet verder' : heeft('bsdicht') ? 'blad dichtgedaan' : heeft('bsopen') ? 'blad open, weg' : heeft('wkwag') ? 'in winkelwagen gelegd' : na.length ? 'bleef op het product, geen afrekenpagina' : 'direct weg na de tik';
        return { uur: new Date(t0).toISOString().slice(11, 16), net: r.s || tik[c].s, product: r.p || tik[c].p, zone: r.z || tik[c].z, campagne: r.k || '', secTotTik: r.at ? Math.round((t0 - r.at) / 1000) : null, voor: voor.map(x => x[0]), na: na.map(x => x[0] + ' +' + x[1] + 's'), winkel: r.px ? Object.keys(r.px).filter(k => ['cart', 'afreken', 'betaal'].includes(k)) : [], doel1: r.conv ? Math.round((r.conv - t0) / 1000) : null, uitkomst }; }).sort((a, b) => b.uur.localeCompare(a.uur));
      const tel = {}; rijen.forEach(r => { tel[r.uitkomst] = (tel[r.uitkomst] || 0) + 1; });
      if (url.searchParams.get('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('Kadoly: wat er gebeurde na een tik op de koopknop, ' + dg + ' (' + rijen.length + ' bezoekers)\n' + Object.entries(tel).sort((a, b) => b[1] - a[1]).map(([k, v]) => v + ' x ' + k).join('\n') + '\n\nPer bezoeker (nieuwste eerst)\n' + rijen.map(r => `${r.uur} ${r.net} ${r.product} zone ${r.zone || '-'} | tik na ${r.secTotTik ?? '?'} s | ${r.uitkomst} | daarna: ${r.na.join(', ') || 'niets'}${r.winkel.length ? ' | winkel: ' + r.winkel.join(', ') : ''} | doel 1 naar het netwerk: ${r.doel1 == null ? 'nee' : '+' + r.doel1 + 's'}`).join('\n')); }
      return res.status(200).json({ ok: true, dag: dg, aantal: rijen.length, uitkomsten: tel, bezoekers: rijen }); }
    if (op === 'fotob64') { // 16 nov: productfoto's als base64 voor het maken van advertentievideo's (alleen via de beschermde vercel.app-host); ?p=pid,pid&t=ig
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const t = /^(ig|sq|md|mg)$/.test(url.searchParams.get('t') || '') ? url.searchParams.get('t') : 'ig'; const out = {};
      if (url.searchParams.get('alle')) { // alle foto's van de productpagina (window.YP.listing.photos), hoogstens 5 per product
        for (const p of String(url.searchParams.get('p') || '').split(',').map(pidOk).filter(Boolean).slice(0, 3)) { try { const h = await (await fetch('https://kadoly.com/product/' + p + '?lang=nl', { headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' }, signal: AbortSignal.timeout(15000) })).text(); const m = h.match(/listing:\s*(\{[\s\S]*?\})\s*,\s*\n/); let fotos = []; try { fotos = (JSON.parse(m[1]).photos || []).map(f => f.src).filter(Boolean); } catch (e) { fotos = [...new Set((h.match(/https:\\?\/\\?\/cdn\.kadoly\.com\\?\/uploads\\?\/products[^"\s]+?\.(?:webp|jpe?g|png)/g) || []).map(x => x.replace(/\\\//g, '/')))]; } out[p] = []; for (const f of fotos.slice(0, 5)) { try { const r = await fetch(f, { headers: { referer: 'https://kadoly.com/', 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) }); if (r.ok) out[p].push(Buffer.from(await r.arrayBuffer()).toString('base64')); } catch (e) {} } } catch (e) { out[p] = 'fout'; } }
        return res.status(200).json(out); }
      for (const p of String(url.searchParams.get('p') || '').split(',').map(pidOk).filter(Boolean).slice(0, 6)) { try { const r = await fetch('https://keuzehulp.best/api/shop?op=img&t=' + t + '&p=' + p, { signal: AbortSignal.timeout(15000) }); out[p] = r.ok ? Buffer.from(await r.arrayBuffer()).toString('base64') : 'fout' + r.status; } catch (e) { out[p] = 'fout'; } }
      return res.status(200).json(out); }
    if (op === 'whads') { // 16 nov: per Whop/Meta-advertentie (waid) wat Clickmind zag; alleen tellingen
      const ids = await smembers(K.set('a', 'wh')); const t = await tellers('wh', 'a', ids); const ads = {};
      for (const [id, v] of Object.entries(t)) ads[id] = { aan: v.dv, echt: v.dm, actie: v.da, tik: v.dwk, kassa: v.dkp, cart: v.cart, koop: v.koop, omzet: Math.round((v.omzet || 0)) / 100 };
      const d = (await dagTotaal(DAY())).wh; let pf = [0, 0]; try { pf = (await kv.mget('c:sh-wh-pf', 'c:sh-d' + D8() + '-wh-pf')).map(num); } catch (e) {} let waidmap = {}; try { waidmap = (await kv.get('hjdk:whop:waidmap')) || {}; } catch (e) {} return res.status(200).json({ ok: true, at: new Date().toISOString(), vandaag: { aan: d.dv, echt: d.dm, tik: d.dwk, kassa: d.dkp, cart: d.cart, koop: d.koop, vooraf: pf[1] }, voorafTotaal: pf[0], waidmap, ads }); }
    if (op === 'whtest') { // 16 nov: testgebeurtenis naar de Events API van Whop (alleen via de beschermde vercel.app-host)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const st = await whEvent({ c: 'test-' + Date.now().toString(36), p: 'oc_4174003416580097', w: { utm_source: 'whop', utm_campaign: 'test' } }, String(url.searchParams.get('ev') || 'view_content').replace(/[^a-z_]/g, '').slice(0, 30), Number(url.searchParams.get('v')) || 0);
      return res.status(200).json({ ok: st === 200, status: st, sleutel: whopKlaar(), account: WHOP_BIZ }); }
    if (op === 'kassalek') { // 16 nov (Henkjan: "Ja zoek maar uit maar ik denk dat het verkeersbron is ."): waar strandt het betalen, per verkeersbron. Alleen tellingen en bestellingen zonder persoonsgegevens, alleen via de beschermde vercel.app-host
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const dagen = Math.max(1, Math.min(60, Number(url.searchParams.get('dagen')) || 28));
      const STAPN = { dv: 'aangekomen', dm: 'echt mens', dwk: 'tik koopknop', dkp: 'afrekenpagina', dke: 'e-mail', dka: 'adres', dkm: 'betaalmethode', dkz: 'betaalknop', dkb: 'naar betalen', dkq: 'paypal', dkf: 'fout', dkr: 'prijs', dkg: 'kosten', dkw: 'weg', dkx: 'weg <5s', dky: 'weg <20s', dkl: 'weg lang', dku: 'uit', koop: 'betaald', omzet: 'omzet (cent)' };
      const perNet = {}; for (let i = 0; i < dagen; i++) { let t = null; try { t = await dagTotaal(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)); } catch (e) {} if (!t) continue; for (const [n, o] of Object.entries(t)) { const pn = perNet[n] = perNet[n] || {}; for (const k of Object.keys(STAPN)) pn[STAPN[k]] = (pn[STAPN[k]] || 0) + num(o[k]); } }
      for (const n of Object.keys(perNet)) if (!perNet[n].aangekomen && !perNet[n]['afrekenpagina'] && !perNet[n].betaald) delete perNet[n];
      const LET = { m: 'echt', a: 'actie', g: 'geladen', z: 'zicht1' }; for (const [k, v] of Object.entries(GEDRAG)) LET[v] = k;
      let orders = [], feedFout = null; try { const r = await fetch(SHOP + '/api/lus-feed', { headers: shopKop(), signal: AbortSignal.timeout(20000) }); if (r.ok) { const j = await r.json(); orders = Array.isArray(j.orders) ? j.orders : []; } else feedFout = 'HTTP ' + r.status; } catch (e) { feedFout = String(e.message || e).slice(0, 80); }
      const best = []; for (const o of orders.slice(0, 200)) { const hj = String(o.hj || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); let rec = null; if (hj) { try { rec = await kv.get(K.rec(hj)); } catch (e) {} }
        const at = Date.parse(o.created_at || '') || null;
        best.push({ at: o.created_at || null, betaaldOm: o.paid_at || null, status: String(o.status || ''), shop: String(o.shop_status || ''), methode: String(o.payment_method || ''), bedrag: num(o.amount), verzend: o.shipping != null ? num(o.shipping) : null, product: String(o.product_id || '').slice(0, 30), stuks: num(o.quantity || 1),
          kenmerk: !!hj, gevonden: !!rec, net: rec ? rec.s : (o.ad_network || (hj ? '?' : 'geen')), plek: rec ? rec.z || null : null, toestel: rec ? rec.h || null : null, minNaKlik: rec && at && rec.at ? Math.round((at - rec.at) / 60000) : null, test: rec ? !!rec.t : null,
          stappen: rec ? Object.keys(rec).filter(k => /^y[a-z0-9]{1,2}$/.test(k)).map(k => LET[k.slice(1)] || k).slice(0, 40) : null }); }
      const samen = {}; for (const b of best) { const k = b.net || '?'; const o = samen[k] = samen[k] || { bestellingen: 0, betaald: 0, verlopen: 0, anders: 0, methodes: {} }; o.bestellingen++; if (/paid|betaald/i.test(b.status)) o.betaald++; else if (/expir|verlop/i.test(b.status)) o.verlopen++; else o.anders++; o.methodes[(b.methode || '-') + ':' + b.status] = (o.methodes[(b.methode || '-') + ':' + b.status] || 0) + 1; }
      res.setHeader('cache-control', 'no-store'); return res.status(200).json({ ok: true, dagen, perNet, bestellingen: { totaal: best.length, perNet: samen, feedFout, lijst: best } }); }
    if (op === 'whlead') { // 16 nov: aanmelding na een Meta-klik via Whop (Curacao.day, later Sealed Intent): eenmaal per aanmelding een 'lead' naar de Events API van het Whop-bedrijf van dat project
      res.setHeader('access-control-allow-origin', '*'); res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
      const sp = url.searchParams, p = String(sp.get('p') || '').replace(/[^a-z]/g, '').slice(0, 12), pr = whProject(p);
      const rauw = k => String(sp.get(k) || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60); // Whop-id's ongewijzigd laten (hoofdletters en _ tellen mee voor de koppeling)
      const wacid = rauw('wacid'), eid = String(sp.get('eid') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40), ev = String(sp.get('ev') || 'lead').replace(/[^a-z_]/g, '').slice(0, 30);
      const leeg = () => { res.setHeader('content-type', 'image/gif'); return res.status(200).send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')); };
      if (!pr || !wacid || eid.length < 6 || isBot(String(req.headers['user-agent'] || ''))) return leeg();
      const ipk = createHash('sha256').update(String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() + '|whl').digest('hex').slice(0, 16);
      try { const n = num(await kv.raw(['INCR', 'hjdk:whl:ip:' + ipk])); if (n === 1) await kv.raw(['EXPIRE', 'hjdk:whl:ip:' + ipk, '3600']); if (n > 5) return leeg(); } catch (e) {}
      let nieuw = false; try { nieuw = (await kv.raw(['SET', 'hjdk:whl:' + p + ':' + ev + ':' + eid, '1', 'NX', 'EX', String(30 * 86400)])) === 'OK'; } catch (e) {}
      if (!nieuw) return leeg();
      const st = await whLead(pr, { ev, eid, wacid, wasid: rauw('wasid'), waid: rauw('waid'), fbclid: String(sp.get('fbclid') || '').replace(/[^A-Za-z0-9_.~+\/=-]/g, '').slice(0, 600), u: String(sp.get('u') || '').slice(0, 300), ua: String(req.headers['user-agent'] || '').slice(0, 200) });
      try { await kv.raw(['HINCRBY', 'hjdk:whl:tel:' + p, DAY() + '|' + ev + '|' + st, '1']); await kv.raw(['EXPIRE', 'hjdk:whl:tel:' + p, String(90 * 86400)]); await kv.raw(['HINCRBY', 'hjdk:whl:tel:' + p, DAY() + '|' + ev + '|' + st + '|ad:' + (rauw('waid') || '-'), '1']); } catch (e) {}
      return leeg(); }
    if (op === 'whspec') { // 17 nov: Whop-spec lezen voor lead ads (instant forms); alleen via de beschermde host, geen sleutel nodig
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      if (url.searchParams.get('yml')) { // tekstzoeker in de uitgebreide (beta) spec van Whop
        const q2 = String(url.searchParams.get('q') || 'lead_form'), n = Math.min(400, Number(url.searchParams.get('n')) || 160), max = Math.min(6, Number(url.searchParams.get('k')) || 2), uit2 = [], fout2 = [];
        const eigenU = String(url.searchParams.get('u') || ''); for (const u of (/^https:\/\/docs\.whop\.com\/[A-Za-z0-9_\/.-]+$/.test(eigenU) ? [eigenU] : ['https://app.stainless.com/api/spec/documented/whopsdk/openapi.documented.yml', 'https://docs.whop.com/openapi/api-v1-beta.json', 'https://docs.whop.com/openapi.json'])) { try { const r = await fetch(u, { signal: AbortSignal.timeout(20000) }); if (!r.ok) { fout2.push(u + ' ' + r.status); continue; } const t = await r.text(); const L = t.split('\n'); let k = 0; for (let i = 0; i < L.length && k < max; i++) if (L[i].includes(q2)) { uit2.push({ u, regel: i, tekst: L.slice(i, i + n).join('\n').slice(0, 20000) }); k++; i += n; } if (uit2.length) break; fout2.push(u + ' geen ' + q2 + ' (' + L.length + ' regels)'); } catch (e) { fout2.push(u + ' ' + String(e.message || e).slice(0, 60)); } }
        return res.status(200).json({ ok: uit2.length > 0, uit: uit2, fouten: fout2 }); }
      const bronnen = ['https://api.whop.com/api/v1/openapi.json', 'https://docs.whop.com/openapi/api-v1-stable.json']; let spec = null, van = '', fouten = [];
      for (const u of bronnen) { try { const r = await fetch(u, { signal: AbortSignal.timeout(15000) }); if (!r.ok) { fouten.push(u + ' ' + r.status); continue; } spec = await r.json(); van = u; break; } catch (e) { fouten.push(u + ' ' + String(e.message || e).slice(0, 60)); } }
      if (!spec) return res.status(200).json({ ok: false, fouten });
      const q = String(url.searchParams.get('q') || 'lead').toLowerCase(), schemas = (spec.components && spec.components.schemas) || {};
      const los = (x, d = 0) => { if (!x || typeof x !== 'object' || d > 6) return x; if (x.$ref) { const n = String(x.$ref).split('/').pop(); return d > 5 ? { ref: n } : los(schemas[n], d + 1); } if (Array.isArray(x)) return x.map(y => los(y, d + 1)); const o = {}; for (const [k, v] of Object.entries(x)) o[k] = k === 'description' ? String(v).slice(0, 160) : los(v, d + 1); return o; };
      const paden = Object.entries(spec.paths || {}).filter(([p]) => p.toLowerCase().includes(q) || /people|social_accounts|lead/.test(p)).map(([p, m]) => p + ' ' + Object.keys(m).filter(k => /get|post|patch|put|delete/.test(k)).map(k => k.toUpperCase() + ':' + String(m[k].summary || '').slice(0, 60)).join(' | '));
      const velden = {}; const zoek = (x, pad, d = 0) => { if (!x || typeof x !== 'object' || d > 9) return; if (x.properties) for (const [k, v] of Object.entries(x.properties)) { if (k.toLowerCase().includes(q) && !velden[k + '@' + pad]) velden[k + '@' + pad] = los(v); zoek(v, pad + '.' + k, d + 1); } for (const k of ['items', 'allOf', 'anyOf', 'oneOf']) if (x[k]) (Array.isArray(x[k]) ? x[k] : [x[k]]).forEach(y => zoek(y, pad, d + 1)); };
      for (const [p, m] of Object.entries(spec.paths || {})) for (const [k, op2] of Object.entries(m)) { const b = op2 && op2.requestBody && op2.requestBody.content && op2.requestBody.content['application/json']; if (b && b.schema) zoek(los(b.schema), k.toUpperCase() + ' ' + p); }
      const pp = String(url.searchParams.get('p') || ''); if (pp) { const m = (spec.paths || {})[pp] || {}; const uit = {}; for (const [k, o2] of Object.entries(m)) { if (!o2 || typeof o2 !== 'object') continue; const b = o2.requestBody && o2.requestBody.content && o2.requestBody.content['application/json']; const r200 = o2.responses && (o2.responses['200'] || o2.responses['201']); const rs = r200 && r200.content && r200.content['application/json']; uit[k] = { params: (o2.parameters || []).map(x => (los(x) || {}).name), body: b ? los(b.schema) : null, antwoord: url.searchParams.get('antw') ? (rs ? los(rs.schema) : null) : undefined }; } const t2 = JSON.stringify({ ok: true, pad: pp, uit }); return res.status(200).send(t2.slice(0, 90000)); }
      if (url.searchParams.get('alle')) return res.status(200).json({ ok: true, van, n: Object.keys(spec.paths || {}).length, paden: Object.keys(spec.paths || {}).filter(x => /ad|lead|form|people|event|webhook/.test(x)) });
      const tekst = JSON.stringify({ ok: true, van, paden, velden }); return res.status(200).json(JSON.parse(tekst.length > 60000 ? JSON.stringify({ ok: true, van, paden, velden: Object.keys(velden), afgekapt: true }) : tekst)); }
    if (op === 'whprobe') { // 17 nov: kent Whop instant forms? Proef zonder gevolgen: verzoeken met een niet-bestaande campagne/groep, alleen de foutmelding telt
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const lf = { name: 'probe', form_type: 'more_volume', questions: [{ type: 'email' }], privacy_policy: { url: 'https://curacao.day/nl/privacy' } };
      const p1 = await whopApi('/ad_groups', { method: 'POST', body: { ad_campaign_id: 'adcamp_xxxxxxxxxxxxxx', title: 'probe', status: 'paused', conversion_location: 'instant_forms' } });
      const adBody = { ad_group_id: 'adgrp_xxxxxxxxxxxxxx', title: 'probe', call_to_action: 'sign_up', lead_form: lf, primary_texts: [{ text: 'x' }], headlines: [{ text: 'x' }] };
      const p2 = await whopApi('/ads', { method: 'POST', body: adBody });
      const versies = {}; for (const v of ['2026-10-06', '2026-11-01', '2026-11-10', '2026-11-16-2', '2026-12-01']) { const r = await whopApi('/ads', { method: 'POST', body: adBody, versie: v }); versies[v] = r.status + ' ' + (r.fout || ''); }
      const p3 = await whopApi('/ad_groups', { method: 'POST', body: { ad_campaign_id: 'adcamp_xxxxxxxxxxxxxx', title: 'probe', status: 'paused', bestaatniet_veld: 1 } });
      const sa = await whopApi('/social_accounts?account_id=' + WHOP_BIZ); const said = sa.ok && sa.j && Array.isArray(sa.j.data) && sa.j.data[0] ? sa.j.data[0].id : '';
      const p4 = said ? await whopApi('/social_accounts/' + said + '/lead_forms?account_id=' + WHOP_BIZ) : { status: 0, fout: 'geen social account' };
      const kort = r => ({ status: r.status, fout: r.fout || null, sleutels: r.j && typeof r.j === 'object' ? Object.keys(r.j).slice(0, 8) : null });
      const routes = {}; const V = String(url.searchParams.get('v') || '2026-10-06').replace(/[^0-9-]/g, '');
      for (const pad of ['/leads?company_id=' + WHOP_BIZ, '/leads?account_id=' + WHOP_BIZ, '/ad_leads?account_id=' + WHOP_BIZ, '/lead_form_submissions?account_id=' + WHOP_BIZ, '/lead_submissions?account_id=' + WHOP_BIZ, '/lead_forms?account_id=' + WHOP_BIZ, '/people?account_id=' + WHOP_BIZ + '&first=1', '/events?account_id=' + WHOP_BIZ + '&first=1', '/external_accounts?account_id=' + WHOP_BIZ]) { const r = await whopApi(pad, { versie: V }); routes[pad.split('?')[0]] = r.status + ' ' + (r.fout || '') + (r.ok && r.j ? ' velden:' + Object.keys((Array.isArray(r.j.data) && r.j.data[0]) || r.j).slice(0, 25).join(',') : ''); }
      const pg = await whopApi('/ad_groups', { method: 'POST', body: { ad_campaign_id: 'adcamp_xxxxxxxxxxxxxx', title: 'probe', status: 'paused', conversion_location: 'instant_forms' }, versie: V });
      routes['POST /ad_groups conversion_location @' + V] = pg.status + ' ' + (pg.fout || '');
      return res.status(200).json({ ok: true, routes, groep_met_conversion_location: kort(p1), ad_met_lead_form: kort(p2), versies, controle_onbekend_veld: kort(p3), social_accounts: { status: sa.status, n: sa.j && Array.isArray(sa.j.data) ? sa.j.data.length : null, velden: sa.j && Array.isArray(sa.j.data) && sa.j.data[0] ? Object.keys(sa.j.data[0]) : null }, lead_forms: kort(p4) }); }
    if (op === 'whform') { // 17 nov (Henkjan: "Ik wil dat je email form ad van fb gebruikt"): Curacao-campagne naar Facebook-formulieren; standaard alleen het plan
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      if (url.searchParams.get('voorbeeld')) return res.status(200).json({ ok: true, nl_vandaag: leadForm('nl', 'vandaag'), nl_strand: leadForm('nl', 'strand'), de_fernweh: leadForm('de', 'fernweh'), ca_vandaag: leadForm('ca', 'vandaag') });
      const pr = whProject('curacao'); if (!pr.klaar) return res.status(200).json({ ok: false, mist: [!pr.key && 'WHOP_API_KEY_CURACAO in Vercel', !pr.biz && 'bedrijf'].filter(Boolean) });
      const cid = String(url.searchParams.get('c') || 'adcamp_fWuShwnhuwl').replace(/[^A-Za-z0-9_]/g, '');
      const r = await whFormBouw(pr, cid, url.searchParams.get('uitvoeren') === '1');
      if (r.uitgevoerd) try { await kv.raw(['LPUSH', 'hjdk:whop:log', JSON.stringify({ at: new Date().toISOString(), wat: 'Curacao naar Facebook-formulieren (Henkjan 17 nov): ' + (r.log || []).map(x => x.groep + ' ' + (x.id ? x.ads.filter(a => a.id).length + '/' + x.ads.length + ' ads' : 'mislukt: ' + x.fout)).join(', ') })]); } catch (e) {}
      return res.status(200).json(r); }
    if (op === 'whget') { // 17 nov: alleen-lezen diagnose bij Whop (levering per advertentie, problemen); beschermde host, alleen GET op advertentiepaden
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const pad = String(url.searchParams.get('pad') || ''); if (!/^\/(ad_issues|ads|ad_groups|ad_campaigns|ad_stats)(\/[A-Za-z0-9_]+)?(\?[A-Za-z0-9_=&:.,-]*)?$/.test(pad)) return res.status(400).json({ ok: false, fout: 'pad' });
      const pr = url.searchParams.get('p') ? whProject(String(url.searchParams.get('p'))) : null; const vv = String(url.searchParams.get('v') || '').replace(/[^0-9-]/g, ''); const r = await whopApi(pad, Object.assign(pr && pr.key ? { key: pr.key } : {}, vv ? { versie: vv } : {})); if (url.searchParams.get('vol')) return res.status(200).json({ ok: r.ok, status: r.status, fout: r.fout || null, data: r.j });
      const kort = x => x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).filter(([k]) => /^(id|title|status|delivery_status|issues|impressions|spend|link_clicks|clicks|content_review|learning_progress|reason|message|severity|code|ad|ad_group|ad_campaign|created_at|description)$/.test(k))) : x;
      return res.status(200).json({ ok: r.ok, status: r.status, fout: r.fout || null, data: r.j && Array.isArray(r.j.data) ? r.j.data.map(kort) : kort(r.j) }); }
    if (op === 'whleadstand') { // tellingen per project per dag (alleen aantallen)
      const out = {}; for (const p of Object.keys(WH_PROJECTEN)) { const pr = whProject(p); let t = {}; try { const h = await kv.raw(['HGETALL', 'hjdk:whl:tel:' + p]); if (Array.isArray(h)) for (let i = 0; i + 1 < h.length; i += 2) t[h[i]] = num(h[i + 1]); else t = h || {}; } catch (e) {} out[p] = { klaar: pr.klaar, sleutel: !!pr.key, bedrijf: !!pr.biz, tellingen: t }; }
      return res.status(200).json({ ok: true, projecten: out }); }
    if (op === 'whdoel') { // 17 nov: waar Meta op stuurt (Henkjan: "Ja doen ." op view_content), alleen via de beschermde host
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const ev = String(url.searchParams.get('ev') || ''); const camp = await whopCampagnes(); const cid = camp.ok && camp.campagnes[0] ? camp.campagnes[0].id : null; const g = cid ? await whopGroepen(cid) : { groepen: [] };
      const uit = []; for (const x of g.groepen) uit.push(Object.assign({ groep: x.id, was: x.conversion_event }, await whopZetDoel(x.id, ev)));
      try { await kv.raw(['LPUSH', 'hjdk:whop:log', JSON.stringify({ at: new Date().toISOString(), wat: 'Meta stuurt nu op ' + ev + ' (Henkjan 17 nov: "Ja doen ."): ' + uit.map(u => u.groep + ' ' + (u.ok ? 'gelukt' : 'mislukt')).join(', ') })]); } catch (e) {}
      return res.status(200).json({ ok: uit.length > 0 && uit.every(u => u.ok), uit }); }
    if (op === 'whaan') { // 17 nov: een advertentie weer aan die de ronde onterecht uitzette (oude regel: $1,50 zonder echt mens, ook zonder één klik bij Meta)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const id = String(url.searchParams.get('id') || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 40); if (!/^ad_/.test(id)) return res.status(400).json({ ok: false, fout: 'id' });
      const r = await whopAan(id); try { await kv.raw(['LPUSH', 'hjdk:whop:log', JSON.stringify({ at: new Date().toISOString(), wat: 'weer aan: ' + id + ' (' + (r.ok ? 'gelukt' : r.fout) + ')' })]); } catch (e) {} return res.status(200).json({ ok: r.ok, status: r.status, fout: r.fout || null }); }
    if (op === 'whdiag' || op === 'whbudget') { // 16 nov: opbouw van de Whop-campagne zien (groepen, budget, doel, creatives) en het budget zetten op Henkjans woord (hoogstens WH_BUDGET_MAX)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const camp = await whopCampagnes(); const cid = camp.ok && camp.campagnes[0] ? camp.campagnes[0].id : null; if (!cid) return res.status(200).json({ ok: false, fout: 'geen campagne', camp });
      if (op === 'whbudget') { const b = Number(url.searchParams.get('bedrag')); const r = await whopZetBudget(cid, b); try { await kv.raw(['LPUSH', 'hjdk:whop:log', JSON.stringify({ at: new Date().toISOString(), wat: 'budget naar $' + b + ' per dag (Henkjan 16 nov: "Ja" op PropellerAds-shop uit en Meta naar $20): ' + (r.ok ? 'gelukt' : 'mislukt') })]); } catch (e) {} return res.status(200).json(r); }
      const g = await whopGroepen(cid); const c = await whopApi('/ad_campaigns/' + cid); const a = await whopApi('/ads?account_id=' + WHOP_BIZ + '&first=2'); const ad = a.j && a.j.data && a.j.data[0];
      const kort = o => o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).filter(([k, v]) => !/spend|cost|click|impress|reach|freq|purchase|lead|result|roas|return|schedul|regist|contact|applic|viewed|cart|unique/.test(k)).map(([k, v]) => [k, typeof v === 'object' && v !== null ? JSON.stringify(v).slice(0, 300) : v])) : o;
      return res.status(200).json({ ok: true, campagne: kort(c.j), groepenPad: g.pad, groepen: g.groepen.map(kort), advertentie: kort(ad), advVelden: ad ? Object.keys(ad) : [] }); }
    if (op === 'whopronde' || op === 'whopstand') { // 16 nov (Henkjan: "Ik wil dat je per 30 mins monitort en leert"): elke 30 minuten de Whop/Meta-advertenties van Kadoly naast Clickmind
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0], ua = String(req.headers['user-agent'] || '');
      const mag = /vercel-cron/i.test(ua) || /\.vercel\.app$/i.test(host) || (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET);
      if (op === 'whopstand') { let st = null, lg = []; try { st = await kv.get('hjdk:whop:stand'); lg = ((await kv.raw(['LRANGE', 'hjdk:whop:log', '0', '19'])) || []).map(x => { try { return typeof x === 'string' ? JSON.parse(x) : x; } catch (e) { return null; } }).filter(Boolean); } catch (e) {}
        if (url.searchParams.get('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); const r = st || {}; return res.status(200).send(!st ? 'Nog geen ronde (WHOP_API_KEY ' + (whopKlaar() ? 'staat' : 'ontbreekt') + ')' : `Kadoly Meta via Whop, stand ${r.at}\n` + (r.campagnes || []).map(c => c.fout ? c.fout : `Campagne ${c.titel || c.id}: ${c.status || '?'}${c.levering ? ' (' + c.levering + ')' : ''}${c.budget != null ? ', budget ' + c.budget : ''}`).join('\n') + `\nVandaag: $${(r.dagSpend || 0).toFixed(2)} uitgegeven, ${r.dag ? r.dag.aan + ' aangekomen, ' + r.dag.echt + ' echte mensen, ' + r.dag.tik + ' tikken op de koopknop, ' + r.dag.kassa + ' op de afrekenpagina, ' + r.dag.koop + ' bestellingen' : ''}\n` + (r.pool ? `ROAS: echt ${r.pool.spend > 0 ? (r.pool.omzet * r.pool.eurUsd / r.pool.spend).toFixed(2) : '-'} (EUR ${r.pool.omzet} omzet op $${r.pool.spend}), verwacht ${r.pool.poolRoas ?? '-'} (diepste stap per bezoeker x waarde per stap)\nWaarde per stap (28 dagen, ${r.waarden && r.waarden.bron || 'alle netten'}): bestelling EUR ${r.waarden ? r.waarden.aov : '-'}, afrekenen naar koop ${r.waarden ? Math.round(r.waarden.kassaKoop * 100) : '-'}%, tik naar afrekenen ${r.waarden ? Math.round(r.waarden.tikKassa * 100) : '-'}%, echt naar tik ${r.waarden ? Math.round(r.waarden.echtTik * 100) : '-'}%\nProducten (verwachte ROAS): ${(r.pool.producten || []).slice(0, 10).map(p => p.naam + ' ' + (p.roasVerw ?? '-')).join(', ')}\nInvalshoeken: ${(r.pool.invalshoeken || []).slice(0, 10).map(p => p.naam + ' ' + (p.roasVerw ?? '-')).join(', ')}\n` : '') + `Advertenties (totaal sinds start, beste verwachte ROAS eerst):\n` + (r.rijen || []).map(x => `${x.status === 'active' ? 'aan' : x.status} | ${String(x.titel || x.id).slice(0, 40)} | $${x.spend.toFixed(2)} | ${x.vert || 0} vertoningen | ${x.kliks} kliks (Whop)${x.vert ? ' (' + (x.kliks / x.vert * 100).toFixed(2) + '%)' : ''} | ${x.aan} aangekomen | ${x.echt} echt | ${x.tik} tik | ${x.kassa} kassa | ${x.koop} koop | ROAS ${x.roas ?? '-'} verwacht ${x.roasVerw ?? '-'}${x.kansBeste != null ? ' | kans beste ' + Math.round(x.kansBeste * 100) + '%' : ''}`).join('\n') + '\n\nRondes:\n' + lg.map(l => `${l.at} ${l.wat}`).join('\n')); }
        return res.status(200).json({ ok: true, stand: st, log: lg }); }
      if (!mag) return res.status(404).send('Niet gevonden');
      if (!whopKlaar()) return res.status(200).json({ ok: true, overgeslagen: 'geen WHOP_API_KEY' });
      const droog = !!url.searchParams.get('droog'), nu = new Date(), dagNL = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(nu);
      const uurNLv = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: 'numeric', hourCycle: 'h23' }).format(nu));
      const lg = async (wat, extra) => { try { await kv.raw(['LPUSH', 'hjdk:whop:log', JSON.stringify(Object.assign({ at: nu.toISOString(), wat }, extra || {}))]); await kv.raw(['LTRIM', 'hjdk:whop:log', '0', '499']); } catch (e) {} };
      const eenmaal = async (k, tekst) => { try { const kk = 'hjdk:whop:alarm:' + k + ':' + dagNL; if (await kv.get(kk)) return; await kv.set(kk, 1, { ex: 2 * 86400 }); } catch (e) {} await whMeld(tekst); };
      const [alle, dag, camp] = await Promise.all([whopAds(), whopAds(dagNL + 'T00:00:00', nu.toISOString()), whopCampagnes()]);
      if (!alle.ok) { await lg('fout bij ophalen: ' + alle.fout); if (alle.status === 401 || alle.status === 403) await eenmaal('sleutel', 'Kadoly Meta (Whop): de API-sleutel werkt niet (' + alle.fout + '). Controleer WHOP_API_KEY in Vercel (rechten ads lezen, pauzeren en events).'); return res.status(200).json({ ok: false, fout: alle.fout }); }
      const perDag = {}; (dag.ads || []).forEach(a => { perDag[a.id] = Number(a.spend) || 0; }); const dagSpend = Object.values(perDag).reduce((a, b) => a + b, 0);
      const hget = async k => { const o = {}; try { const a = await kv.raw(['HGETALL', k]); if (Array.isArray(a)) for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = a[i + 1]; else if (a && typeof a === 'object') Object.assign(o, a); } catch (e) {} return o; };
      let wmap = {}; try { wmap = (await kv.get('hjdk:whop:waidmap')) || {}; } catch (e) {} const wk = koppelWaid(alle.ads, await hget('hjdk:whop:waidp'), await hget('hjdk:whop:waidwa'), wmap); if (wk.nieuw && !droog) { try { await kv.set('hjdk:whop:waidmap', wk.vast, { ex: 90 * 86400 }); } catch (e) {} }
      const cmW = await tellers('wh', 'a', Object.keys(wk.vast)); const cm = {}; for (const [w, id] of Object.entries(wk.vast)) { const o = cm[whId(id)] = cm[whId(id)] || {}; for (const [k, v] of Object.entries(cmW[w] || {})) o[k] = (o[k] || 0) + num(v); }
      const rijen = alle.ads.map(a => { const c = cm[whId(a.id)] || {}; return { id: a.id, titel: a.title, status: a.status, levering: a.delivery_status, spend: Number(a.spend) || 0, vandaag: perDag[a.id] || 0, kliks: Number(a.link_clicks) || 0, aan: num(c.dv), echt: num(c.dm), tik: num(c.dwk), kassa: num(c.dkp), cart: num(c.cart), koop: num(c.koop), omzet: num(c.omzet) / 100, vert: Number(a.impressions) || 0, whKoop: Number(a.purchases) || 0, whWaarde: Number(a.purchase_value) || 0, whRoas: a.return_on_ad_spend != null ? Number(a.return_on_ad_spend) : null, issues: (a.issues || []).map(i => String(i.message || i).slice(0, 120)) }; });
      let W = null; try { W = await kv.get('hjdk:whop:waarden'); } catch (e) {} // waarde per stap, eens per dag geleerd uit 28 dagen Kadoly over alle netten
      if (!W || !W.at || !W.bron || Date.now() - Date.parse(W.at) > 20 * 3600e3) { const tot = { dm: 0, dwk: 0, dkp: 0, koop: 0, omzet: 0 }, totWh = { dm: 0, dwk: 0, dkp: 0, koop: 0, omzet: 0 }; for (let i = 0; i <= 28; i++) { try { const t = await dagTotaal(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)); for (const n of Object.keys(t)) for (const k of Object.keys(tot)) { if (i > 0) tot[k] += num(t[n][k]); if (n === 'wh') totWh[k] += num(t[n][k]); } } catch (e) {} } W = waardenUit(tot, totWh); if (!droog) { try { await kv.set('hjdk:whop:waarden', W, { ex: 3 * 86400 }); } catch (e) {} } }
      const pool = roasLeer(rijen, W);
      const d = (await dagTotaal(DAY())).wh; const dagCm = { aan: d.dv, echt: d.dm, tik: d.dwk, kassa: d.dkp, koop: d.koop };
      const { uit, besteTik } = whOordeel(rijen, pool); const gedaan = [];
      for (const u of uit) { if (droog) { gedaan.push(Object.assign({ droog: true }, u)); continue; } const r = await whopPauze(u.id); gedaan.push(Object.assign({ ok: r.ok, fout: r.ok ? undefined : r.fout }, u)); }
      for (const x of rijen) { if (x.status === 'rejected' || x.issues.length) await eenmaal('afgekeurd:' + x.id, `Kadoly Meta (Whop): advertentie "${String(x.titel || x.id).slice(0, 60)}" ${x.status === 'rejected' ? 'afgekeurd' : 'heeft een probleem'}: ${x.issues.join('; ') || x.levering}`); }
      const kl = rijen.reduce((a, x) => a + x.kliks, 0), aanT = rijen.reduce((a, x) => a + x.aan, 0);
      if (kl >= WH_REGEL.minKliksAankomst && aanT / kl < WH_REGEL.aankomstAlarm) await eenmaal('aankomst', `Kadoly Meta (Whop): ALARM, maar ${Math.round(aanT / kl * 100)}% komt aan (${aanT} van ${kl} kliks). Landingspagina of meting kapot?`);
      if (dagSpend > WH_REGEL.dagMax) await eenmaal('budget', `Kadoly Meta (Whop): vandaag al $${dagSpend.toFixed(2)} uitgegeven, boven de grens van $${WH_REGEL.dagMax}.`);
      if (gedaan.some(g => g.ok)) await whMeld('Kadoly Meta (Whop): ' + gedaan.filter(g => g.ok).length + ' advertentie(s) uitgezet. ' + gedaan.filter(g => g.ok).map(g => g.reden).join(' | '));
      let verkend = []; if (!droog && uurNLv() >= 9) { try { const vk = 'hjdk:whop:verkend:' + dagNL; const al = num(await kv.get(vk)); const uitNu = new Set(gedaan.filter(g => g.ok).map(g => g.id)); const rijenNa = rijen.map(x => uitNu.has(x.id) ? Object.assign({}, x, { status: 'paused' }) : x); const vp = verkenPlan(alle.ads, rijenNa, pool, al); for (const x of vp.plan) { const r = await whopNieuweAd(x); verkend.push({ titel: x.titel, ok: r.ok, waarom: x.waarom, fout: r.ok ? undefined : r.fout }); if (r.ok) await kv.set(vk, al + verkend.filter(v => v.ok).length, { ex: 2 * 86400 }); else break; } if (verkend.some(v => v.ok)) await whMeld('Kadoly Meta (Whop): ' + verkend.filter(v => v.ok).length + ' nieuwe advertentie(s) erbij: ' + verkend.filter(v => v.ok).map(v => v.titel + ' (' + v.waarom + ')').join(' | ')); if (verkend.some(v => !v.ok)) await lg('nieuwe advertentie mislukt: ' + verkend.filter(v => !v.ok).map(v => v.fout).join('; ')); } catch (e) { await lg('verkennen fout: ' + String(e.message || e).slice(0, 120)); } }
      const campagnes = camp.ok ? camp.campagnes.map(({ velden, ...c }) => droog ? Object.assign({ velden }, c) : c) : [{ fout: 'campagnes niet op te halen: ' + (camp.fout || camp.status) }];
      const stand = { at: nu.toISOString(), campagnes, dagSpend, dag: dagCm, besteTik, pool, verkend, waarden: { bron: W.bron, aov: W.aov, kassaKoop: W.kassaKoop, tikKassa: W.tikKassa, echtTik: W.echtTik, basis: W.basis, at: W.at }, rijen: rijen.sort((a, b) => (b.roasVerw ?? -1) - (a.roasVerw ?? -1) || b.spend - a.spend), uitgezet: gedaan };
      const uurNL = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: 'numeric', hourCycle: 'h23' }).format(nu));
      if (!droog && uurNL >= 8 && pool.spend > 0) { try { const lk = 'hjdk:whop:les:' + dagNL; if (!(await kv.get(lk))) { await kv.set(lk, 1, { ex: 3 * 86400 }); const ak = rijen.filter(x => x.spend > 0); const b = ak[0], z = ak[ak.length - 1]; const tekst = `Kadoly Meta (Whop) les ${dagNL}: $${pool.spend} uitgegeven, EUR ${pool.omzet} omzet, verwachte ROAS ${pool.poolRoas}. Beste advertentie ${b ? '"' + b.titel + '" (verwacht ' + b.roasVerw + ', kans beste ' + Math.round((b.kansBeste || 0) * 100) + '%)' : '-'}, slechtste ${z && z !== b ? '"' + z.titel + '" (' + z.roasVerw + ')' : '-'}. Beste product ${pool.producten[0] ? pool.producten[0].naam + ' (' + pool.producten[0].roasVerw + ')' : '-'}, beste invalshoek ${pool.invalshoeken[0] ? pool.invalshoeken[0].naam + ' (' + pool.invalshoeken[0].roasVerw + ')' : '-'}. Waarde per stap: bestelling EUR ${W.aov}, afrekenen naar koop ${Math.round(W.kassaKoop * 100)}%, tik naar afrekenen ${Math.round(W.tikKassa * 100)}%, echt naar tik ${Math.round(W.echtTik * 100)}%.`; await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: nu.toISOString(), wie: 'whop-ronde', tekst })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } } catch (e) {} }
      if (!droog) { try { await kv.set('hjdk:whop:stand', stand, { ex: 30 * 86400 }); } catch (e) {} await lg(`$${dagSpend.toFixed(2)} vandaag, ${rijen.filter(x => x.status === 'active').length} aan, ${dagCm.aan} aangekomen, ${dagCm.echt} echt, ${dagCm.tik} tik, ${dagCm.koop} koop` + (gedaan.length ? ', uit: ' + gedaan.map(g => String(g.id)).join(' ') : ''), { uit: gedaan.length }); }
      return res.status(200).json({ ok: true, droog, ...stand }); }
    if (op === 'ttronde' || op === 'ttstand' || op === 'ttkoppel' || op === 'ttcb') { // 16 nov (Henkjan: "Laat uurtaak op vercel draaien . Onafh comput of account ."): elk uur TikTok per advertentie naast Clickmind, EUR 5-regel, rapport op op=ttstand (lib/tiktok.js)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0], ua = String(req.headers['user-agent'] || ''), beschermd = /\.vercel\.app$/i.test(host);
      const mag = /vercel-cron/i.test(ua) || beschermd || (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET);
      const leesLog = async n => { try { return ((await kv.raw(['LRANGE', 'hjdk:tt:log', '0', String(n - 1)])) || []).map(x => { try { return typeof x === 'string' ? JSON.parse(x) : x; } catch (e) { return null; } }).filter(Boolean); } catch (e) { return []; } };
      if (op === 'ttstand') { let st = null; try { st = await kv.get('hjdk:tt:stand'); } catch (e) {} const lg = await leesLog(24);
        if (url.searchParams.get('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); res.setHeader('cache-control', 'no-store'); return res.status(200).send(ttTekst(st) + (lg.length ? '\nLaatste rondes:\n' + lg.map(l => l.at.slice(5, 16).replace('T', ' ') + ' UTC  ' + l.wat).join('\n') : '')); }
        return res.status(200).json({ ok: true, stand: st, log: lg }); }
      if (!mag) return res.status(404).send('Niet gevonden');
      const TERUG = 'https://hjdk-api-henq.vercel.app/api/shop/ttcb';
      if (op === 'ttkoppel') { if (!beschermd) return res.status(404).send('Niet gevonden'); const state = randomBytes(12).toString('hex'); try { await kv.set('hjdk:tt:state:' + state, 1, { ex: 1800 }); } catch (e) {} const u = ttKoppelUrl(TERUG, state); res.setHeader('content-type', 'text/plain; charset=utf-8'); if (!u) return res.status(200).send('TIKTOK_APP_ID ontbreekt nog als gedeelde team-variabele in Vercel.'); res.setHeader('location', u); return res.status(302).end(); }
      if (op === 'ttcb') { if (!beschermd) return res.status(404).send('Niet gevonden'); res.setHeader('content-type', 'text/plain; charset=utf-8'); const state = String(url.searchParams.get('state') || ''); let geldig = false; try { geldig = !!(state && await kv.get('hjdk:tt:state:' + state)); } catch (e) {} if (!geldig) return res.status(400).send('Koppeling verlopen. Open /api/shop/ttkoppel opnieuw.'); const r = await ttRuil(String(url.searchParams.get('auth_code') || url.searchParams.get('code') || '')); try { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: new Date().toISOString(), wie: 'tiktok-ronde', tekst: r.ok ? 'TikTok gekoppeld: de uurwacht leest vanaf nu uitgave per advertentie (accounts ' + r.adv.join(', ') + ')' : 'TikTok koppelen mislukt: ' + r.fout })]); } catch (e) {} return res.status(200).send(r.ok ? 'Gekoppeld. De TikTok-uurwacht leest vanaf de volgende ronde uitgave per advertentie. Stand: https://hjdk-api-henq.vercel.app/api/shop?op=ttstand&vorm=tekst' : 'Koppelen mislukt: ' + r.fout); }
      const droog = !!url.searchParams.get('droog'), nu = new Date(), dagNL = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(nu), uurNL = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: 'numeric', hourCycle: 'h23' }).format(nu));
      const lg = async (wat, extra) => { if (droog) return; try { await kv.raw(['LPUSH', 'hjdk:tt:log', JSON.stringify(Object.assign({ at: nu.toISOString(), wat }, extra || {}))]); await kv.raw(['LTRIM', 'hjdk:tt:log', '0', '499']); } catch (e) {} };
      const hand = async tekst => { if (droog) return; try { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: nu.toISOString(), wie: 'tiktok-ronde', tekst })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } catch (e) {} };
      const eenmaal = async (k, tekst) => { if (droog) return; try { const kk = 'hjdk:tt:alarm:' + k + ':' + dagNL; if (await kv.get(kk)) return; await kv.set(kk, 1, { ex: 2 * 86400 }); } catch (e) {} await ttMeld(tekst); await hand(tekst); };
      const d = (await dagTotaal(DAY())).tt; const dagCm = { aan: d.dv, echt: d.dm, tik: d.dwk, kassa: d.dkp, cart: d.cart, koop: d.koop };
      const [lev, dag, ads] = await Promise.all([ttRapport(''), ttRapport(dagNL), ttAds()]);
      if (!lev.ok) { const wacht = lev.geenSleutel ? 'nog niet gekoppeld (eenmalig: app in het TikTok developer portal, TIKTOK_APP_ID en TIKTOK_APP_SECRET in Vercel, dan /api/shop/ttkoppel openen)' : lev.fout; const stand = { at: nu.toISOString(), wacht, dag: dagCm };
        if (!droog) { try { await kv.set('hjdk:tt:stand', stand, { ex: 30 * 86400 }); } catch (e) {} } await lg('TikTok niet te lezen: ' + wacht + '; Clickmind vandaag ' + dagCm.aan + ' aan, ' + dagCm.echt + ' echt, ' + dagCm.tik + ' tik, ' + dagCm.koop + ' koop');
        if (!lev.geenSleutel) await eenmaal('sleutel', 'Kadoly TikTok: de uurwacht kan TikTok niet lezen (' + lev.fout + '). Koppel opnieuw via https://hjdk-api-henq.vercel.app/api/shop/ttkoppel'); return res.status(200).json({ ok: false, ...stand }); }
      const perDag = {}; (dag.ok ? dag.rijen : []).forEach(x => { perDag[x.id] = x.spend; });
      const stat = new Map((ads.ok ? ads.ads : []).map(a => [a.id, a])); const cm = await tellers('tt', 'a', lev.rijen.map(x => x.id));
      const rijen = lev.rijen.map(x => { const c = cm[x.id] || {}, a = stat.get(x.id), tik = num(c.dwk), kassa = num(c.dkp), cart = num(c.cart); return Object.assign({}, x, { vandaag: perDag[x.id] || 0, aan: !!(a && a.aan), status: a ? a.status : '', aanCm: num(c.dv), echt: num(c.dm), tik, kassa, cart, koop: num(c.koop), omzet: num(c.omzet) / 100, stap: tik + kassa + cart }); }).sort((a, b) => b.spend - a.spend || b.kliks - a.kliks);
      const { uit, tegen } = ads.ok ? ttOordeel(rijen) : { uit: [], tegen: [] }; const gedaan = [];
      if (uit.length) { if (droog) uit.forEach(u => gedaan.push(Object.assign({ droog: true }, u))); else { const r = await ttUit(uit.map(u => u.id)); uit.forEach(u => gedaan.push(Object.assign({ ok: r.ok, fout: r.ok ? undefined : r.fout }, u))); if (r.ok) uit.forEach(u => { const x = rijen.find(y => y.id === u.id); if (x) x.aan = false; }); } }
      const groepen = {}; rijen.forEach(x => { const g = groepen[x.groep] = groepen[x.groep] || { spend: 0, vandaag: 0, vert: 0, kliks: 0, aan: 0, stap: 0, koop: 0 }; g.spend += x.spend; g.vandaag += x.vandaag; g.vert += x.vert; g.kliks += x.kliks; g.stap += x.stap; g.koop += x.koop; if (x.aan) g.aan++; });
      for (const x of rijen) if (/NOT_APPROVED|REJECT/i.test(x.status)) await eenmaal('afgekeurd:' + x.id, 'Kadoly TikTok: advertentie ' + x.naam + ' afgekeurd (' + x.status + ').');
      const kl = rijen.reduce((a, x) => a + x.kliks, 0), aanT = rijen.reduce((a, x) => a + x.aanCm, 0), dagSpend = rijen.reduce((a, x) => a + x.vandaag, 0);
      if (kl >= TT_REGEL.minKliksAankomst && aanT / kl < TT_REGEL.aankomstAlarm) await eenmaal('aankomst', `Kadoly TikTok: ALARM, maar ${Math.round(aanT / kl * 100)}% van de kliks komt aan in Clickmind (${aanT} van ${kl}). Landingspagina of meting kapot?`);
      if (dagSpend > TT_REGEL.dagMax) await eenmaal('budget', `Kadoly TikTok: vandaag al EUR ${dagSpend.toFixed(2)} uitgegeven, boven de grens van EUR ${TT_REGEL.dagMax}.`);
      if (tegen.length) await eenmaal('minaan', 'Kadoly TikTok: ' + tegen.map(x => x.naam).join(', ') + ' halen de regel niet (EUR ' + TT_REGEL.uitgave + ' zonder afrekenstap), maar blijven aan omdat er anders minder dan ' + TT_REGEL.minAan + ' over zijn in de groep. Henkjan beslist.');
      const ok = gedaan.filter(g => g.ok); if (ok.length) { const t = 'Kadoly TikTok: ' + ok.length + ' advertentie(s) uit (EUR ' + TT_REGEL.uitgave + ' zonder afrekenstap). ' + ok.map(g => g.reden).join(' | '); await ttMeld(t); await hand(t); }
      const stand = { at: nu.toISOString(), dag: dagCm, dagSpend, groepen, rijen, uitgezet: gedaan, tegen: tegen.map(x => ({ id: x.id, naam: x.naam })), adsFout: ads.ok ? undefined : ads.fout };
      if (!droog) { try { await kv.set('hjdk:tt:stand', stand, { ex: 30 * 86400 }); } catch (e) {}
        await lg(`EUR ${dagSpend.toFixed(2)} vandaag, ${rijen.filter(x => x.aan).length} aan, ${kl} kliks, ${aanT} aangekomen, ${rijen.reduce((a, x) => a + x.echt, 0)} echt, ${rijen.reduce((a, x) => a + x.stap, 0)} afrekenstappen, ${rijen.reduce((a, x) => a + x.koop, 0)} betaald` + (ok.length ? ', uit: ' + ok.map(g => g.naam).join(' ') : ''));
        if (uurNL >= 8) { try { const lk = 'hjdk:tt:les:' + dagNL; if (!(await kv.get(lk))) { await kv.set(lk, 1, { ex: 3 * 86400 }); const best = rijen.filter(x => x.stap > 0).sort((a, b) => b.stap - a.stap)[0]; await hand(`Kadoly TikTok dag ${dagNL}: totaal EUR ${rijen.reduce((a, x) => a + x.spend, 0).toFixed(2)} uitgegeven, ${kl} kliks, ${aanT} aangekomen, ${rijen.reduce((a, x) => a + x.stap, 0)} afrekenstappen, ${rijen.reduce((a, x) => a + x.koop, 0)} betaald; ${rijen.filter(x => x.aan).length} advertenties aan.` + (best ? ` Beste advertentie: ${best.naam} (${best.stap} afrekenstappen op EUR ${best.spend.toFixed(2)}).` : '')); } } catch (e) {} } }
      return res.status(200).json({ ok: true, droog, ...stand }); }
    if (op === 'tttest') { // 16 nov: testgebeurtenis naar de TikTok Events API (alleen via de beschermde vercel.app-host), met de testcode uit Events Manager > Test events; zonder code een gewone ViewContent met een nep-ttclid
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const st = await ttEvent({ c: 'test-' + Date.now().toString(36), p: 'oc_4174003416580097' }, String(url.searchParams.get('ev') || 'ViewContent').replace(/[^A-Za-z]/g, '').slice(0, 30), 0, url.searchParams.get('code') || 'TEST');
      return res.status(200).json({ ok: st === 200, status: st, pixel: !!(process.env.TIKTOK_PIXEL || process.env.TIKTOK_PIXEL_ID), token: !!(process.env.TIKTOK_TOKEN || process.env.TIKTOK_EVENTS_TOKEN) }); }
    if (op === 'uitverkocht') { // 12 nov: Clickmind (cm.js) meldt "Bestelling niet geplaatst: This item just sold out" op kadoly.com/checkout/<pid>; zonder p: overzicht
      const p = pidOk(url.searchParams.get('p')), nu = Date.now(); let m = {}; try { m = (await kv.get(K_UIT)) || {}; } catch (e) {}
      if (p) { const cat = await catalog(); if (cat.items.some(i => i.id === p)) { m[p] = nu; for (const k of Object.keys(m)) if (nu - m[k] > 2 * 864e5) delete m[k]; try { await kv.set(K_UIT, m, { ex: 3 * 86400 }); await kv.raw(['LPUSH', 'hjdk:shop:uitlog', JSON.stringify({ p, at: nu })]); await kv.raw(['LTRIM', 'hjdk:shop:uitlog', '0', '499']); await kv.raw(['EXPIRE', 'hjdk:shop:uitlog', String(30 * 86400)]); } catch (e) {} CAT_AT = 0; } return res.status(200).json({ ok: true }); }
      const cat = await catalog(); let log = []; try { log = ((await kv.raw(['LRANGE', 'hjdk:shop:uitlog', '0', '99'])) || []).map(x => { try { return typeof x === 'string' ? JSON.parse(x) : x; } catch (e) { return null; } }).filter(Boolean); } catch (e) {}
      const titel = id => { const it = cat.items.find(i => i.id === id); return it ? String(it.t).slice(0, 70) : id; };
      return res.status(200).json({ ok: true, nuUitverkocht: Object.keys(m).filter(k => nu - m[k] < 2 * 864e5).map(k => ({ product: k, titel: titel(k), sinds: new Date(m[k]).toISOString() })), meldingen: log.map(x => ({ product: x.p, titel: titel(x.p), at: new Date(x.at).toISOString() })) }); }
    if (op === 'kassa') { // openbaar, alleen totalen: wat bezoekers op de afrekenpagina doen (3 nov, Clickmind op de kassa), vandaag of ?dag=
      const dg = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('dag') || '') ? url.searchParams.get('dag') : DAY(); const t = await dagTotaal(dg);
      const STAP = [['dwk', 'tik op een koopknop (mandje)'], ['dww', '  waarvan In winkelwagen'], ['dwn', 'winkelwagen-icoon bovenin (telt niet als mandje)'], ['dbo', 'koopblad geopend (mobiel: Nu kopen)'], ['dbm', 'e-mail in het koopblad aangetikt'], ['dba', 'adresveld in het koopblad aangetikt'], ['dbg', 'Doorgaan met Google in het koopblad'], ['dbn', 'Verder naar betalen getikt'], ['dbv', '  waarvan na 4 s nog in het blad (fout of traag)'], ['dbd', 'koopblad dichtgedaan'], ['dbw', 'weg met het koopblad open'], ['dku', 'uitverkocht bij het plaatsen (bestelling niet geplaatst)'], ['dkp', 'afrekenpagina geopend (Clickmind)'], ['dk5', '5 seconden op de afrekenpagina'], ['dk2', '20 seconden op de afrekenpagina'], ['dk6', '1 minuut op de afrekenpagina'], ['dks', 'helft van de afrekenpagina gezien (gescrold)'], ['dke', 'e-mailveld aangetikt'], ['dka', 'adresveld aangetikt'], ['dkm', 'betaalmethode gekozen'], ['dkz', 'betaalknop in beeld'], ['dkq', 'PayPal-venster aangetikt'], ['dkf', 'formulierfout'], ['dkb', 'op Betalen gedrukt'], ['dkt', 'terug naar het product getikt'], ['dkw', 'weg zonder te betalen'], ['dkx', '  waarvan binnen 5 seconden'], ['dky', '  waarvan tussen 5 en 20 seconden'], ['dkl', '  waarvan na 20 seconden']];
      const perNet = {}, tot = {}; for (const [n, x] of Object.entries(t)) { perNet[n] = {}; for (const [k] of STAP) { perNet[n][k] = num(x[k]); tot[k] = num(tot[k]) + num(x[k]); } }
      const tekst = 'Kadoly afrekenpagina ' + dg + ' (Clickmind, alle netwerken)\n' + STAP.map(([k, l]) => l + ': ' + num(tot[k])).join('\n');
      if (url.searchParams.get('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(tekst); }
      return res.status(200).json({ ok: true, dag: dg, totaal: tot, perNet, stappen: Object.fromEntries(STAP) }); }
    if (op === 'koopcheck') { // openbaar, alleen lezen: hoe een NL-telefoon de productpagina en de afrekenpagina van yoo.rs nu krijgt (geen sleutels, geen bezoekersdata)
      const pid = pidOk(url.searchParams.get('p')) || 'oc_4174004347453441';
      const ck = 'hjdk:shop:koopcheck:' + pid; try { const c = await kv.get(ck); if (c && Date.now() - c.at < 6e5 && !url.searchParams.get('vers')) return res.status(200).json(c); } catch (e) {}
      const kop = { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'accept-language': 'nl-NL,nl;q=0.9' };
      const haal = async pad => { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 25000); const t0 = Date.now(); try { const r = await fetch('https://kadoly.com' + pad, { headers: kop, signal: ac.signal, redirect: url.searchParams.get('volg') ? 'follow' : 'manual' }); const h = await r.text(); const tekst = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); const zk = url.searchParams.getAll('zoek').slice(0, 6).map(z => String(z).slice(0, 40)).filter(Boolean); const stukken = {}; for (const z of zk) { const l = []; let i = -1; while (l.length < 3 && (i = h.toLowerCase().indexOf(z.toLowerCase(), i + 1)) >= 0) l.push(h.slice(Math.max(0, i - 300), i + 400)); stukken[z] = { aantal: h.toLowerCase().split(z.toLowerCase()).length - 1, stukken: l }; } return { pad, eindUrl: r.url, stukken, knoppen: [...h.matchAll(/<(button|a|input)[^>]*>([^<]{0,60})/gi)].map(m => (m[2] || '').trim()).filter(x => x && x.length > 2).slice(0, 40), betaal: (h.match(/iDEAL|PayPal|Mollie|Stripe|Klarna|Bancontact|creditcard|Apple Pay|Google Pay/gi) || []).filter((x, i, a) => a.indexOf(x) === i), status: r.status, ms: Date.now() - t0, location: r.headers.get('location'), bytes: h.length, titel: (h.match(/<title>([^<]*)<\/title>/) || [])[1] || null, tekst: tekst.slice(0, 2500), ideal: /iDEAL/i.test(h), engels: /Add to cart|Buy now|Checkout|Total to pay/.test(tekst), registreer: /Registreren|Sign up|Log in/i.test(tekst) }; } catch (e) { return { pad, fout: String(e.message || e).slice(0, 120), ms: Date.now() - t0 }; } finally { clearTimeout(t); } };
      const eigenPad = String(url.searchParams.get('pad') || '').replace(/[^A-Za-z0-9_\/?=&.-]/g, '').slice(0, 200); // 3 nov: elke kadoly-pagina na te lopen (?pad=/checkout/oc_...&volg=1)
      if (url.searchParams.get('px')) { const l = {}; for (const w of ['cart', 'afreken', 'betaal', 'fout', 'koop']) { try { l[w] = await kv.get('hjdk:shop:pxlaatst:' + w); } catch (e) { l[w] = null; } } let fouten = []; try { fouten = ((await kv.raw(['LRANGE', 'hjdk:shop:betaalfout', '0', '19'])) || []).map(x => { try { const o = typeof x === 'string' ? JSON.parse(x) : x; return { at: new Date(o.at).toISOString(), wat: o.w, methode: o.m, reden: o.r }; } catch (e) { return null; } }).filter(Boolean); } catch (e) {} return res.status(200).json({ ok: true, laatst: l, fouten }); } // 11 nov: ook de laatste 20 mislukte betalingen met de reden die de shop meegeeft (geen persoonsgegevens) // 3 nov: wanneer meldde de shop elke stap het laatst (geen bezoekersdata)
      if (eigenPad.startsWith('/')) { const x = await haal(eigenPad); return res.status(200).json({ ok: true, at: Date.now(), pagina: x }); }
      const [p, c, s] = await Promise.all([haal('/product/' + pid + '?lang=nl'), haal('/checkout/' + pid + '?lang=nl'), haal('/')]);
      const o = { ok: true, at: Date.now(), pid, product: p, checkout: c, home: Object.assign({}, s, { tekst: (s.tekst || '').slice(0, 800) }) };
      try { await kv.set(ck, o, { ex: 3600 }); } catch (e) {} return res.status(200).json(o); }
    if (op === 'direct') { // directe route: welk deel van de betaalde bezoekers zonder landingspagina naar de shop gaat. Lezen mag iedereen; zetten alleen via de beschermde vercel.app-host (?pct=0..100)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; const pct = url.searchParams.get('pct');
      if (pct != null && pct !== '') { if (!/\.vercel\.app$/i.test(host)) return res.status(403).json({ ok: false, fout: 'zetten alleen via de beschermde vercel.app-host' }); const c = await zetDirect(kv, pct, url.searchParams.get('door') || 'beheer'); await log({ soort: 'directe route', wat: c.pct + '% direct naar de productpagina', waarom: 'ingesteld door ' + c.door }); }
      return res.status(200).json({ ok: true, direct: await directInst(kv), meetOpYoors: await shopMeet(kv), uitleg: 'pct = deel van de betaalde bezoekers (per persoon vast) dat in één keer naar de productpagina op yoo.rs gaat; de rest ziet de landingspagina. meetOpYoors = cm.js op yoo.rs meldt echt en actie.' }); }
    if (op === 'overdracht') { // levende overdracht voor collega's en andere chats: live stand + OVERDRACHT-YOORS-SHOP.md (alleen op de beschermde vercel.app-host)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const live = { nu: Date.now() }; const veilig = async f => { try { return await f(); } catch (e) { return null; } };
      live.uren = await veilig(() => uurStand(kv, 24)); live.sinds = await veilig(() => netTotaal()); live.feed = await veilig(() => kv.get('hjdk:shop:lusfeed'));
      live.laatst = {}; for (const w of ['cart', 'afreken', 'betaal', 'fout', 'koop', 'koop:ideal', 'koop:paypal']) live.laatst[w] = await veilig(() => kv.get('hjdk:shop:pxlaatst:' + w));
      live.mc = await veilig(async () => { const r = await fetch('https://demandradar-ivory.vercel.app/api/feed?shop=yoors&cc=NL&status=1', { signal: AbortSignal.timeout(5000) }); return r.ok ? r.json() : null; });
      live.direct = await veilig(() => directInst(kv)); live.meet = await veilig(() => shopMeet(kv));
      live.pa = await veilig(async () => ((await kv.get(K.palog)) || [])[0] || null); live.md = await veilig(async () => { const l = await kv.get(K.laatste); return l && l.mondiad ? Object.assign({ at: l.at }, l.mondiad) : null; });
      live.catalogus = await veilig(async () => (await catalog()).items.length); live.marge = await veilig(async () => Object.keys((await kv.get(K_KOST)) || {}).length);
      live.geheugen = await veilig(async () => (String(await kv.raw(['INFO', 'memory'])).match(/used_memory_human:(\S+)/) || [])[1] || null);
      const md = overdrachtTekst(), lv = liveRegels(live); res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
      if (url.searchParams.get('vorm') === 'tekst') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(md.replace(/\n## /, '\n' + lv + '\n## ')); }
      res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(overdrachtPagina(lv, md, esc)); }
    if (op === 'feedcheck') { // openbaar, alleen tellingen: haalt de datapagina van de shop nu op (zonder de sleutel te tonen)
      const lk = await kv.get('hjdk:shop:feedlock'); if (lk) { const f = await kv.get('hjdk:shop:lusfeed'); return res.status(200).json({ ok: true, wacht: true, stand: f ? { at: f.at, status: f.status, fout: f.fout || null, producten: f.producten, metInkoop: f.metInkoop, bestellingen: (f.orders || []).length, betaald: f.betaald, metHj: f.metHj, nagemeld: f.nagemeld } : null }); }
      await kv.set('hjdk:shop:feedlock', 1, { ex: 60 }); const f = await haalFeed();
      return res.status(200).json({ ok: true, stand: f ? { at: f.at, status: f.status, metSleutel: f.metSleutel, sleutelLengte: f.sleutelLengte, vingerafdruk: f.vingerafdruk, antwoord: f.antwoord || null, fout: f.fout || null, producten: f.producten, metInkoop: f.metInkoop, bestellingen: (f.orders || []).length, betaald: f.betaald, metHj: f.metHj, nagemeld: f.nagemeld, sleutels: f.sleutels, prodVelden: f.prodVelden, orderVelden: f.orderVelden, statussen: [...new Set((f.orders || []).map(o => o.s))].slice(0, 10) } : null }); }
    if (op === 'verkoopuren') { const v = await verkoopUren(kv); return res.status(200).json(Object.assign({ ok: true }, url.searchParams.get('kort') === '1' ? { at: v.at, nlUur: v.nlUur, standNu: v.standNu, redenNu: v.redenNu, uit: v.uit, zwak: v.zwak, piek: v.piek } : v)); } // openbaar, alleen tellers per uur (4 nov, Henkjan: "uit in de nacht en push naar verkoop uren")
    if (op === 'uurritme') return res.status(200).json(Object.assign({ ok: true }, await uurRitme(kv, ['ra', 'ca', 'md'].includes(url.searchParams.get('net')) ? url.searchParams.get('net') : 'pa'))); // openbaar, alleen tellers per uur: welk uur koopt minder in (Henkjan 28 okt: minder inkopen als mensen eten)
    if (op === 'nietgeladen') { // 5 nov (Henkjan: "Ja iedere bot of hoe dan ook waardeloos moet er uit ."): wie komt maar de shop nooit laadt, per kenmerk; alleen op de beschermde host (zware scan)
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]; if (!/\.vercel\.app$/i.test(host)) return res.status(403).json({ ok: false });
      const { nietGeladen } = await import('../lib/shopniet.js'); res.setHeader('cache-control', 'no-store');
      return res.status(200).json(await nietGeladen(kv, { uren: Number(url.searchParams.get('uren')) || 24, bewaar: url.searchParams.get('bewaar') === '1' })); }
    if (op === 'botzones') { const b = await botZonesVers(kv); return res.status(200).json({ ok: true, at: new Date(b.at || 0).toISOString(), uitleg: 'botplek (7 dagen; sinds 5 nov ook statistisch: 0 echte mensen waar er 4 te verwachten waren, of mensaandeel of laadaandeel zeker onder een derde van het gemiddelde) = 0 echte mensen terwijl er bij een gewone plek minstens 3 te verwachten waren, of minder dan een kwart van het gemiddelde aandeel echte mensen terwijl er minstens 6 te verwachten waren; blijft 30 dagen; Clickmind stuurt niet door en PropellerAds zet hem op de zwarte lijst', gem: b.gem || {}, aantal: Object.fromEntries(Object.entries(b.zones || {}).map(([n, z]) => [n, z.length])), redenen: b.redenen || {} }); }
    if (op === 'trechter') { // openbaar, alleen totalen: van bezoek naar doorklik per netwerk, per dag en per product; geen apparaten, geen kliknummers
      const dagen = [0, 1, 2, 3, 4].map(i => DAY(-i)); const perDag = {}; for (const d of dagen) perDag[d] = await dagTotaal(d);
      if (url.searchParams.get('kort') === '1') { const t = perDag[dagen[0]] || {}; const pick = x => x ? { dv: x.dv, geladen: x.dg, inBeeld1s: x.dz, dm: x.dm, da: x.da, t15: x.dt15, t60: x.dt60, scroll50: x.ds50, p2: x.dp2, conv: x.conv, cart: x.cart, koop: x.koop, omzet: x.omzet } : null; const d8 = dagen[0].replace(/-/g, ''); const bkv = await kv.mget(...['', '-bot', '-datacenter', '-botplek'].map(w => 'c:sh-d' + d8 + '-pa-bk' + w)); return res.status(200).json({ ok: true, at: new Date().toISOString(), dag: dagen[0], pa: pick(t.pa), geweigerdPa: { totaal: num(bkv[0]), bot: num(bkv[1]), datacenter: num(bkv[2]), botplek: num(bkv[3]) }, md: pick(t.md), ra: pick(t.ra), mg: pick(t.mg), gisteren: pick((perDag[dagen[1]] || {}).pa) }); } // klein: alleen de dag van vandaag (en gisteren) per netwerk
      const per = { net: {}, product: {}, zone: {} }; const perArm = {}; let cur = '0', gezien = 0; const T0 = Date.now(); // 5 nov: geen telgrens meer (er staan >60.000 records; een telgrens sloeg willekeurig records over), alleen een tijdgrens
      do { const [cc, keys] = await kv.scan(cur, { match: 'hjdk:shc:*', count: 1000 }); cur = cc;
        for (let i = 0; i < keys.length; i += 200) { const vals = await kv.mget(...keys.slice(i, i + 200)); gezien += vals.length;
          for (const r of vals) { if (!r) continue; const zk = r.s + ':' + (r.z || '-');
            if (r.arm && !r.t) { const ak = r.arm + ':' + r.s; const a = perArm[ak] || (perArm[ak] = { route: r.arm === 'd' ? 'direct naar de productpagina' : 'via de landingspagina', netwerk: NETTEN[r.s] || r.s, aangekomen: 0, doorNaarShop: 0, echtOpShop: 0, tikOpShop: 0, afrekenen: 0, betaald: 0 });
              a.aangekomen++; if (r.arm === 'd' || r.kl) a.doorNaarShop++; if (r.ym) a.echtOpShop++; if (r.ya) a.tikOpShop++; if (r.px && r.px.cart) a.afrekenen++; if (r.px && Object.keys(r.px).some(k => k.startsWith('koop'))) a.betaald++; }
            for (const [m, k] of [[per.net, r.s], [per.product, r.p || '-'], [per.zone, zk]]) { const x = m[k] || (m[k] = { bezoek: 0, mens: 0, door: 0, snel: 0, sec: [] }); x.bezoek++; if (r.m) x.mens++; if (r.kl) { x.door++; const sec = (r.kl - r.at) / 1000; x.sec.push(sec); if (sec < 3) x.snel++; } } } }
      } while (cur !== '0' && Date.now() - T0 < 40000);
      const kort = m => Object.fromEntries(Object.entries(m).map(([k, x]) => { x.sec.sort((a, b) => a - b); const med = x.sec.length ? Math.round(x.sec[Math.floor(x.sec.length / 2)] * 10) / 10 : null; delete x.sec; x.medSecTotKlik = med; return [k, x]; }));
      const zones = Object.entries(kort(per.zone)).sort((a, b) => b[1].door - a[1].door).slice(0, 25);
      return res.status(200).json({ ok: true, at: new Date().toISOString(), records: gezien, direct: await directInst(kv), meetOpYoors: await shopMeet(kv), perRoute: Object.values(perArm).sort((a, b) => b.aangekomen - a.aangekomen), totaal: await netTotaal(), perDag, perNet: kort(per.net), perProduct: kort(per.product), topZones: Object.fromEntries(zones), px: { koop: !!(await kv.get('hjdk:shop:pxlaatst:koop')), cart: !!(await kv.get('hjdk:shop:pxlaatst:cart')) } }); }
    if (SHOP_UIT && ['ronde', 'mdtest', 'maakmd', 'mdbod'].includes(op)) return res.status(200).json({ ok: true, uit: true, waarom: 'Yoors offline (Henkjan 26 okt: "Zet alle campagnes yoors uit yoors gaat offline vandag"): geen shoprondes en geen Mondiad-shopcampagnes meer' });
    if (op === 'ronde') {
      const droog = !!url.searchParams.get('droog');
      if (!droog) { const lk = await kv.get(K.lock); if (lk && Date.now() - lk < 240000) return res.status(200).json({ ok: true, overgeslagen: 'ronde loopt al' }); await kv.set(K.lock, Date.now(), { ex: 300 }); }
      try { return res.status(200).json(Object.assign({ ok: true }, await ronde(droog))); }
      catch (e) { await log({ soort: 'fout', wat: 'ronde', waarom: String(e.message).slice(0, 200) }); return res.status(200).json({ ok: false, fout: String(e.message) }); }
      finally { if (!droog) { try { await kv.set(K.lock, 0, { ex: 5 }); } catch (e) {} } }
    }
    if (op === 'palog' || op === 'catalogus' || op === 'adweg' || op === 'maakmd' || op === 'mdtest' || op === 'mdbod') {
      if (op === 'mdtest' && /\.vercel\.app$/i.test(String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0])) { req.headers['x-shop-sleutel'] = await geheim(); req.body = { max: url.searchParams.get('max'), droog: url.searchParams.get('droog') === '1', vormen: url.searchParams.get('vormen'), producten: url.searchParams.get('producten'), dagbudget: url.searchParams.get('dagbudget'), vanaf: url.searchParams.get('vanaf') }; } // via de beschermde host mag het zonder sleutel in de aanvraag // schrijven: alleen met de gedeelde sleutel
      let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      const s = await geheim(); const k = String(req.headers['x-shop-sleutel'] || b.k || ''); if (!s || k !== s) return res.status(401).json({ ok: false, fout: 'sleutel' });
      if (op === 'catalogus') { const items = (Array.isArray(b.items) ? b.items : []).map(compact).filter(i => pidOk(i.id) && i.t && i.p > 0); if (items.length < 10) return res.status(400).json({ ok: false, fout: 'te weinig producten' }); await bewaarCatalogus(items, 'aangeleverd'); return res.status(200).json({ ok: true, producten: items.length }); }
      if (op === 'mdtest') { // Mondiad per product uit de dagkeuze (presterend en veelbelovend eerst), hoogstens b.max per keer
        const kr = await fetch(LAND() + '/api/shop/kies?n=20', { headers: { 'x-shop-sleutel': s } }); const K0 = await kr.json(); if (!K0 || !K0.ok) return res.status(200).json({ ok: false, fout: 'geen dagkeuze' });
        const volg = { presterend: 0, veelbelovend: 1 }; const lijst = (K0.gekozen || []).slice().sort((a, b) => (volg[a.hoe] ?? 2) - (volg[b.hoe] ?? 2)); const max = Math.max(1, Math.min(10, Number(b.max) || 5)); const uit = [];
        const vormen = String(b.vormen || 'IN_PAGE_PUSH').split(',').map(x => x.trim().toUpperCase()).filter(x => MD_VORM[x]); const nP = Math.max(1, Math.min(20, Number(b.producten) || 20)); const vanaf = Math.max(0, Number(b.vanaf) || 0); const db = Math.max(1, Math.min(5, Number(b.dagbudget) || 5));
        const t0 = Date.now();
        for (const p of lijst.slice(vanaf, vanaf + nP)) for (const v of vormen) { if (uit.filter(x => x.id).length >= max || Date.now() - t0 > 45000) break; if (b.droog) { uit.push({ pid: p.pid, vorm: v, hoe: p.hoe, zou: true }); continue; } try { uit.push(await maakMondiadProduct(p, v, db)); } catch (e) { uit.push({ pid: p.pid, vorm: v, fout: String(e.message).slice(0, 900) }); } }
        return res.status(200).json({ ok: true, uit }); }
      if (op === 'maakmd') { const thema = String(b.thema || '').replace(/[^a-z]/g, ''); if (!thema) return res.status(400).json({ ok: false, fout: 'thema ontbreekt' }); try { return res.status(200).json(Object.assign({ ok: true }, await maakMondiad(thema, b.formaat === 'push' ? 'push' : 'ipp'))); } catch (e) { return res.status(200).json({ ok: false, fout: String(e.message).slice(0, 300) }); } }
      if (op === 'mdbod') { const bid = Number(b.bid); if (!(bid >= 0.001 && bid <= MD_MAX_BOD())) return res.status(400).json({ ok: false, fout: 'bod tussen 0.001 en ' + MD_MAX_BOD() }); const cs = rows(await md('mondiad_list_campaigns', { name: NAAM, size: 100, excludeStatuses: ['ARCHIVED', 'ARCHIVED_COMPLETED'], responseFields: ['ID', 'NAME', 'BID'] })).filter(c => String(c.name || '').includes(NAAM)); let n = 0; for (const c of cs) { if (num(c.bid) !== bid) { try { await md('mondiad_update_campaign', { json: JSON.stringify({ id: c.id, bid }) }); n++; } catch (e) {} } } await log({ soort: 'bod gezet (Mondiad)', wat: n + ' campagnes', waarom: 'alle shop-campagnes naar $' + bid }); return res.status(200).json({ ok: true, aangepast: n, van: cs.length }); }
      if (op === 'adweg') { const ads = await advertenties(); let n = 0; for (const a of ads) if (!a.uit && a.title === String(b.title || '')) { a.uit = String(b.waarom || 'handmatig uitgezet'); n++; } if (n) await kv.set(K.ads, ads); return res.status(200).json({ ok: true, uitgezet: n }); }
      const net = ['ra', 'ca'].includes(b.net) ? b.net : 'pa'; const LK = net === 'ra' ? K.ralog : net === 'ca' ? K.calog : K.palog;
      const l = (await kv.get(LK)) || []; const e = Object.assign({}, b.log || {}); for (const [k, v] of Object.entries(e)) if (Array.isArray(v) && v.length > 40) e[k] = v.slice(0, 40).concat([{ soort: 'ingekort', wat: (v.length - 40) + ' regels weggelaten' }]); l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set(LK, l.slice(0, 48)); // 29 okt: 48 rondes met ingekorte lijsten (was 120 volledige, 5 MB)
      if (b.staat && typeof b.staat === 'object') await kv.set('hjdk:shop:' + net + 'staat:' + DAY(), b.staat, { ex: 3 * 86400 });
      if (b.map && typeof b.map === 'object') { const m = (await kv.get(K.crmap)) || {}; for (const [id, v] of Object.entries(b.map)) { if (/^\d+$/.test(id) && v && pidOk(v.pid)) { m[net + ':' + id] = v.pid; m['t:' + net + ':' + id] = String(v.title || '').slice(0, 60); } } await kv.set(K.crmap, m); }
      return res.status(200).json({ ok: true });
    }
    // status: alleen met de geheime link (?k=...). Eenmalig aanmaken met ?maak=1 zolang er nog geen is.
    let sk = process.env.SHOP_STATUS_KEY || await kv.get(K.statuskey);
    if (!sk && url.searchParams.get('maak')) { sk = randomBytes(15).toString('hex'); await kv.set(K.statuskey, sk); return res.status(200).json({ ok: true, link: LAND() + '/api/shop/overzicht?k=' + sk }); }
    // Eigen deellink voor Babita: alleen lezen, los van de statussleutel. Eenmalig aangemaakt; de link wordt maar één keer getoond.
    if (op === 'babitalink') { if (await kv.get(K.babitakey)) return res.status(409).json({ ok: false, fout: 'bestaat al' }); const bk = randomBytes(18).toString('hex'); await kv.set(K.babitakey, bk); return res.status(200).json({ ok: true, link: LAND() + '/api/shop/advies?k=' + bk }); }
    { const kk = url.searchParams.get('k'); if (kk && sk && kk !== sk) { const bk = await kv.get(K.babitakey); if (bk && kk === bk && !url.searchParams.get('json')) sk = bk; } }
    if (!sk || url.searchParams.get('k') !== sk) { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(403).send('<p style="font:16px system-ui;padding:24px">Deze pagina is privé.</p>'); }
    if (op === 'ideeen') { // leesbare pagina met de zes bezoekersblokken (Babita-taken 10 tot 15) en hun live meting, voor Henkjan en Babita
      const { ideeenPagina } = await import('../lib/shopideeen.js'); let tot = {}; try { tot = (await uurStand(kv, 24)).totaal || {}; } catch (e) {}
      res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store');
      return res.status(200).send(ideeenPagina(tot, { esc, k: url.searchParams.get('k') || '', datum: new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) })); }
    if (op === 'lekken') { // per uur de trechter van de shop, rood waar het lekt (alleen totalen, voor Babita en Henkjan)
      try { await uurAanvullen(kv); } catch (e) {}
      const st = await uurStand(kv, Math.max(6, Math.min(72, num(url.searchParams.get('uren')) || 36)));
      if (url.searchParams.get('vorm') === 'json') return res.status(200).json(Object.assign({ ok: true }, st));
      res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store');
      return res.status(200).send(lekkenPagina(st, { esc, link: '/api/shop/advies?k=' + encodeURIComponent(url.searchParams.get('k') || '') })); }
    if (op === 'marge') { // de shop geeft per product inkoop en eigen verzendkosten door (POST); GET toont wat er nu staat, met de live marge
      if (req.method === 'POST') { const r = await margeOntvang(kv, req.body); CAT_AT = 0; return res.status(200).json(r); }
      const st = await margeStand(kv, (await catalog(true)).items); return res.status(200).json(Object.assign({ ok: true }, st, { lijst: st.lijst.slice(0, 200) })); }
    if (url.searchParams.get('json') === 'kort') { // korte stand per netwerk (voor een snelle tussenstand)
      const l = await kv.get(K.laatste); const eerste = async k => ((await kv.get(k)) || [])[0] || null;
      const kortNet = x => x ? { at: x.at, samenvatting: x.samenvatting, saldo: x.saldo, campagnes: (x.campagnes || []).map(c => ({ id: c.id, thema: (String(c.naam).match(/thema=([a-z]+)/) || [])[1], status: c.status, bod: c.bod, kliks: num(c.kliksVandaag), kosten: num(c.kostenVandaag), bezoekers: num((c.eigen || {}).view), doorkliks: num((c.eigen || {}).klik) })), besluiten: (x.besluiten || []).slice(0, 12) } : null;
      const les = (await kv.get(K.lessen)) || {};
      return res.status(200).json({ ok: true, vandaag: await dagTotaal(DAY()), mondiad: l && l.mondiad ? kortNet(Object.assign({ at: l.at, besluiten: l.besluiten }, l.mondiad)) : null, pa: kortNet(await eerste(K.palog)), ra: kortNet(await eerste(K.ralog)), ca: kortNet(await eerste(K.calog)), lessen: { at: les.at, regels: les.lessen || [] }, claudefout: await kv.get('hjdk:shop:claudefout') }); }
    if (url.searchParams.get('json')) return res.status(200).json({ ok: true, laatste: await kv.get(K.laatste), pa: ((await kv.get(K.palog)) || []).slice(0, 5), ra: ((await kv.get(K.ralog)) || []).slice(0, 5), ca: ((await kv.get(K.calog)) || []).slice(0, 5), logboek: ((await kv.get(K.log)) || []).slice(0, 80), vandaag: await dagTotaal(DAY()) });
    if (op === 'hulpstand') return res.status(200).json({ ok: true, at: new Date().toISOString(), gidsen: await hulpStand() });
    if (op === 'plek') { // controle van een advertentieplek: hoe snel klikken bezoekers door, zijn het steeds dezelfde apparaten
      const n = String(url.searchParams.get('net') || 'pa').replace(/[^a-z]/g, ''); const z = plekId(url.searchParams.get('z'));
      const o = { net: n, plek: z, bezoeken: 0, mens: 0, doorklik: 0, gemeld: 0, secTotKlik: [], producten: {}, uren: {}, apparaten: {} }; let cur = '0', gezien = 0; const T0 = Date.now(); // 5 nov: geen telgrens meer (er staan >60.000 records; een telgrens sloeg willekeurig records over), alleen een tijdgrens
      do { const [c, keys] = await kv.scan(cur, { match: 'hjdk:shc:*', count: 1000 }); cur = c;
        for (let i = 0; i < keys.length; i += 200) { const vals = await kv.mget(...keys.slice(i, i + 200)); gezien += vals.length;
          for (const r of vals) { if (!r || r.s !== n || (z && String(r.z) !== z)) continue; o.bezoeken++; if (r.m) o.mens++; if (r.conv) o.gemeld++;
            if (r.kl) { o.doorklik++; o.secTotKlik.push(Math.round((r.kl - r.at) / 100) / 10); } o.producten[r.p] = (o.producten[r.p] || 0) + 1;
            const u = nlUur(r.at); o.uren[u] = (o.uren[u] || 0) + 1; if (r.h) o.apparaten[r.h] = (o.apparaten[r.h] || 0) + 1; } }
      } while (cur !== '0' && Date.now() - T0 < 40000);
      o.secTotKlik.sort((a, b) => a - b); o.verschillendeApparaten = Object.keys(o.apparaten).length; o.vaakstTerug = Math.max(0, ...Object.values(o.apparaten)); delete o.apparaten;
      return res.status(200).json(Object.assign({ ok: true }, o)); }
    if (op === 'advies') { // briefing voor Babita: wat de campagnes leren (live) en wat de verkoop in de shop tegenhoudt
      const l = (await kv.get(K.laatste)) || {}; const eerste = async k => ((await kv.get(k)) || [])[0] || {}; const somK = x => ((x && x.campagnes) || []).reduce((a, c) => a + num(c.kostenVandaag), 0);
      let px = false, pxTijd = {}; try { const pk1 = await kv.get('hjdk:shop:pxlaatst:koop'), pc1 = await kv.get('hjdk:shop:pxlaatst:cart'); px = !!pk1 || !!pc1; pxTijd = { koop: pk1 && pk1.at ? nlTijd(new Date(pk1.at).toISOString()) : null, cart: pc1 && pc1.at ? nlTijd(new Date(pc1.at).toISOString()) : null }; } catch (e) {}
      const les = (await kv.get(K.lessen)) || {};
      const tt = await netTotaal(); const carts = Object.values(tt).reduce((a, x) => a + num(x.cart), 0), koop = Object.values(tt).reduce((a, x) => a + num(x.koop), 0);
      let feed = null; try { feed = await kv.get('hjdk:shop:lusfeed'); } catch (e) {}
      let prio = null; try { // prioriteitenlijst voor Babita (Henkjan 20 okt: "check wat is gedaan en vink af en zet dit er bij"), elke stap live gecontroleerd
        const M = await import('../lib/merchant.js'); const { token } = await import('../lib/gsc.js'); const oidc = String(req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN || '');
        const mc = await M.merchantKort(kv, () => token(oidc, 'https://www.googleapis.com/auth/content')).catch(() => null);
        const uil = ((await catalog()).items || []).find(i => i.id === 'oc_4174004451622913');
        let sm = await kv.get('hjdk:shop:smcheck').catch(() => null);
        if (!sm || Date.now() - sm.at > 3600e3) { sm = { at: Date.now(), robots: false, xml: false }; try { const r = await fetch('https://kadoly.com/robots.txt', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(4000) }); if (r.ok) sm.robots = /^\s*sitemap:/im.test(await r.text()); } catch (e) {} try { const r = await fetch('https://kadoly.com/sitemap.xml', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(4000) }); if (r.ok) sm.xml = /<(urlset|sitemapindex)/i.test((await r.text()).slice(0, 3000)); } catch (e) {} await kv.set('hjdk:shop:smcheck', sm, { ex: 7200 }).catch(() => {}); }
        prio = { mc, uilPrijs: uil ? num(uil.p) : null, sm, prompt: '/api/shop/prompt?k=' + encodeURIComponent(url.searchParams.get('k') || '') };
      } catch (e) {}
      let lek = null; try { const st = await uurStand(kv, 24); const laatst = {}; for (const w of ['cart', 'afreken', 'betaal', 'fout', 'koop', 'koop:ideal', 'koop:paypal']) { try { laatst[w] = await kv.get('hjdk:shop:pxlaatst:' + w); } catch (e) {} }
        lek = { tot: st.totaal, pa: st.pa, laatst, link: '/api/shop/lekken?k=' + encodeURIComponent(url.searchParams.get('k') || ''), php: '/api/shop/babita?k=' + encodeURIComponent(url.searchParams.get('k') || ''), sinds: await netTotaal() }; } catch (e) {}
      const marge = await margeStand(kv, (await catalog()).items, carts >= 10 ? Math.min(1, koop / carts) : 0.3).catch(() => null); if (marge) { marge.link = LAND() + '/api/shop/marge?k=' + url.searchParams.get('k'); marge.carts = carts; marge.koop = koop; }
      res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send(adviesPagina({ sk, css: look(ACC), esc, vandaag: await dagTotaal(DAY()), gisteren: await dagTotaal(DAY(-1)), totaal: await netTotaal(), kosten: { md: somK(l.mondiad), pa: somK(await eerste(K.palog)), ra: somK(await eerste(K.ralog)), ca: somK(await eerste(K.calog)) }, inz: l.inzicht || null, lessen: les.lessen || [], bijgewerkt: nlTijd(new Date().toISOString()), pxGezien: px, pxTijd, marge, feed, lek, prio, stand: await shopStand('oc_4174004347453441').catch(() => null), keten: await import('../lib/shopketen.js').then(async m => { const a = await m.lekketen(kv, DAY()); return a.stappen[0].n >= 500 ? a : m.lekketen(kv, DAY(-1)); }).catch(() => null), snel: await import('../lib/shopsnelheid.js').then(m => m.snelheid(kv, 'oc_4174004347453441', false)).catch(() => null), nlTijd, direct: await directInst(kv), meet: await shopMeet(kv), k: url.searchParams.get('k') || '',
        prijs: await prijsStand(kv, (await catalog()).items).catch(() => null),
        radar: await fetch('https://demandradar-ivory.vercel.app/api/mine?id=mfiz7lshdw', { signal: AbortSignal.timeout(8000) }).then(r => (r.ok ? r.json() : null)).catch(() => null) })); }
    if (op === 'prijzen') { // prijsadvies als CSV voor Babita (zelfde sleutel als de briefing)
      res.setHeader('content-type', 'text/csv; charset=utf-8'); res.setHeader('content-disposition', 'attachment; filename="yoors-prijsadvies.csv"');
      return res.status(200).send(prijsCsv(await prijsStand(kv, (await catalog()).items))); }
    if (op === 'bron') { // controle: haalt een pagina van yoo.rs op zoals een Nederlandse telefoon die ziet (alleen yoo.rs, alleen lezen)
      const pad = String(url.searchParams.get('u') || '/shop/'); if (!/^\/[\w\/\-?=&.%]*$/.test(pad)) return res.status(400).json({ ok: false });
      const r = await fetch('https://kadoly.com' + pad, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'accept-language': url.searchParams.get('taal') || 'nl-NL,nl;q=0.9' } });
      const html = await r.text(); const tekst = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const zoek = url.searchParams.getAll('zoek'); if (zoek.length) { const uit = {}; for (const z of zoek) { const l = []; let i = -1; while (l.length < 4 && (i = html.indexOf(z, i + 1)) >= 0) l.push({ op: i, html: html.slice(Math.max(0, i - 350), i + 450) }); uit[z] = { aantal: html.split(z).length - 1, stukken: l }; } return res.status(200).json({ ok: true, status: r.status, lengte: html.length, uit }); }
      const van = Number(url.searchParams.get('van') || 0);
      return res.status(200).json({ ok: true, status: r.status, location: r.headers.get('location'), lengte: html.length, tekst: tekst.slice(van, van + 12000) }); }
    if (op === 'briefing') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(await briefingPagina(sk)); }
    if (op === 'babita') { res.setHeader('content-type', 'application/x-php; charset=utf-8'); res.setHeader('content-disposition', 'attachment; filename="yoors-shop-conversies.php"'); return res.status(200).send(SHOP_PHP); }
    res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(await statusPagina(sk));
  } catch (e) { return res.status(200).json({ ok: false, fout: String(e && e.message || e) }); }
}
