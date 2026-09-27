// BRUGPAGINA v2.2 (v15: foto+prijs verplicht, onverkrijgbaar product -> leverbare variant, levertijd, sticky koopknop, PA message match) (slim tussenpad): /b/<slug>?utm_source=mondiad|propellerads&clickid=..&zoneid=..&creativeid=..
// Aanpak (zelfde als rereview.app/today, vertaald naar bol):
//  1. Eerst waarde, dan de link: productspecifieke bol-knop(pen) uit het yoo.rs-artikel zelf (24u cache). Elke cookie ontstaat alleen door een eigen klik.
//  2. Meten per ECHT mens: 'hum' telt pas bij scrollen/tikken/bewegen. Doorklik% = klik / mens (en klik / aankomst voor de netwerken).
//  3. De pagina leert zelf (Thompson sampling) tussen opbouwen: one = één grote knop, list = topproduct + alternatieven, direct = meteen door met meting.
//  4. Leert per product: alle bol-producten uit het artikel; beste klik-per-vertoning bovenaan, met wat toeval.
//  5. Message match: de advertentietekst (creativeid -> titel, of ?h=) wordt de kop; de artikeltitel de subkop.
//  6. Elke bol-klik gaat als conversie terug naar het netwerk (Mondiad of PropellerAds via utm_source) zodat het netwerk zelf de zones vindt die doorklikken.
//  7. Eigen subid per pagina+zone (br_<slug>-Z<zone>) zodat bol-opbrengst per zone zichtbaar is.
//  9. Leren op ORDERS: de bol-subid eindigt op een korte code van het clickid (KV hjdk:cid:<code>, 10 dagen). /api/bol/learn koppelt bol-orders daaraan en meldt ze aan PropellerAds als conversie goal=2 met de commissie als payout, en telt orders/commissie per pagina, zone en lay-out.
//  8. Lay-out 'duo': hetzelfde product bij bol én Amazon met beide prijzen (Amazon-prijs via PA-API, met tijdstip, zoals Amazon eist); goedkoopste bovenaan. Tellers -amzclk = kliks naar Amazon.
// Tellers: hjdk6-br-<slug>-arr/view/hum/clk, hjdk6-brz-<zone>-arr/view/hum/clk, hjdk6-brv-<slug>-<variant>-arr/hum/clk,
//          hjdk6-brp-<slug>-<productid>-imp/clk, hjdk6-brc-<creativeid>-arr/clk
import { kv } from '../lib/db.js';
import { searchCached, catalog } from '../lib/bol.js';
import { getAmzCreds, amzSearchCached, getAmzTagOnly } from '../lib/amz.js';

const BOL_SITE = process.env.BOL_BRIDGE_SITE || '1545836'; // Site_ID van het bij bol aangemelde kanaal voor de brug (env BOL_BRIDGE_SITE); anders Yoors
const MD_POSTBACK = 'https://postback.mondiad.com/track?uid=31070&clickid={clickid}&payout=0.01';
const PA_POSTBACK = 'https://ad.propellerads.com/conversion.php?aid=3772727&pid=&tid=151850&visitor_id={clickid}&payout=0.01';
const pbFor = (src) => /propeller|propads|^pa$/i.test(String(src || '')) ? PA_POSTBACK : MD_POSTBACK;
const CACHE_MS = 6 * 3600 * 1000; // artikel + prijzen elke 6 uur verversen
const VARIANTS = ['one', 'list', 'duo', 'direct']; // duo = bol én Amazon naast elkaar met beide prijzen (alleen als er Amazon-sleutels zijn en een passend product)
const VCODE = { one: 'o', list: 'l', duo: 'u', direct: 'd' };
// 'direct' scoort per definitie 100% kliks en mag dus niet meelopen in de kliktest; hij krijgt een vast aandeel (bol-cijfers per subid-suffix -d/-o/-l zeggen wat hij waard is)
const LEARN = ['one', 'list'];
// knopteksten (leren per pagina op klik per mens); {p} = prijs als die bekend is
const BTN = ['Bekijk bij bol →', 'Bekijk prijs en voorraad bij bol →', 'Naar bol.com →', 'Bekijk voor {p} bij bol →', 'Bestel bij bol, morgen in huis →'];
const DIRECT_SHARE = 0; // bol-voorwaarden 3.12: geen automatische doorverwijzing/cookie-dropping -> 'direct' uit (alleen nog met ?m=r voor tests)
// message match: Mondiad creative-id -> advertentietitel (uit de campagnes Afvalemmer 146184, Microvezeldoek 146180, Afwasteil 145562)
const PA_TITLES = { // PropellerAds banner_id -> advertentietitel: de kop van de brug is exact de tekst waarop geklikt is (campagne 11932839 Afvalemmer PRODUCT)
  27431644: 'Brabantia pedaalemmer 12 L', 27431645: 'Afvalemmer voor kleine keuken', 27431646: 'Past onder je aanrecht: 12 L', 27431647: 'Brabantia 12 L, onder €40', 27431648: 'Kleine keuken? Deze emmer past'
};
const CREATIVE_TITLES = {
  355724: 'Afvalemmer kiezen', 355725: 'Afvalemmer voor een klein huis', 355726: 'Past deze emmer onder jouw blad?', 355727: 'Kleine ruimte? Een afvalemmer die past',
  355728: 'Meet eerst: past de afvalemmer?', 355729: 'Brabantia NewIcon 12 L', 355730: 'Kijk of deze afvalemmer past', 355731: 'Past deze afvalemmer?',
  355692: 'Microvezeldoek kiezen', 355693: 'Microvezeldoek voor een klein huis', 355694: 'Past deze doek bij jouw kraan?', 355695: 'Kleine ruimte? Een doek die past',
  355696: 'Meet eerst: microvezeldoek', 355697: 'Vileda Actifibre Soft', 355698: 'Kijk of deze microvezeldoek past', 355699: 'Past dit microvezeldoek?',
  352926: 'Warm sop, kleine gootsteen', 352927: 'De Wash&Drain afwasteil', 352928: 'Afwassen na een lekker etentje', 352929: 'Handig voor je eerste keuken',
  352930: 'Welke teil past in je bak?', 352931: 'De teil met de afvoerplug', 352932: 'Laat het water weglopen', 352933: 'Veel pannen dit najaar'
};
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const isPlaceholder = t => !t || t.length < 4 || /^(heading|header|kop|titel|title)\s*\d*[.:]?$/i.test(t);
// linktekst als productnaam alleen als het geen oproep is ("Bekijk of deze emmer ... past →") maar een naam ("Brabantia NewIcon 12 L")
const badLinkText = t => !t || t.length < 6 || t.length > 60 || /^https?:/i.test(t) || /[→›»?!]/.test(t) || /^(bol|bol\.com|hier|klik hier|link|bekijk|kopen|bestellen|shop|website)$/i.test(t) || /^(bekijk|check|kijk|klik|lees|zie|koop|bestel|ontdek|vergelijk|past|deze|dit|hier|meer|naar)\b/i.test(t) || /\b(bij bol|op bol|bol\.com)\b/i.test(t);
const slugWords = slugpart => clean(String(slugpart || '').replace(/-/g, ' ')).split(' ').filter(w => w && !/^\d{6,}$/.test(w)).slice(0, 7).join(' ');
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
// productgegevens verrijken via de bol-API (titel, prijs, foto, sterren) op basis van de woorden uit de bol-URL; faalt stil
async function enrich(products) {
  for (const p of products) {
    let done = false;
    // 1) exact: bol-product-id -> EAN -> product + beste aanbod + beoordeling
    try {
      const te = await catalog('/products/' + encodeURIComponent(p.id) + '/to-ean', { 'country-code': 'NL' }, 'nl-NL');
      const ean = te && (te.ean || (Array.isArray(te) && te[0] && te[0].ean));
      if (ean) {
        const [pr, of, ra, me] = await Promise.all([
          catalog('/products/' + ean, { 'country-code': 'NL' }, 'nl-NL').catch(() => null),
          catalog('/products/' + ean + '/offers/best', { 'country-code': 'NL' }, 'nl-NL').catch(() => null),
          catalog('/products/' + ean + '/ratings', { 'country-code': 'NL' }, 'nl-NL').catch(() => null),
          catalog('/products/' + ean + '/media', { 'country-code': 'NL' }, 'nl-NL').catch(() => null)]);
        if (pr && pr.title) p.name = String(pr.title).replace(/\s*[|\-\u2013\u2014]\s*(bol|bol\.com).*$/i, '').slice(0, 80);
        if (of && of.price != null) { p.price = Number(of.price); p.strike = of.strikethroughPrice != null ? Number(of.strikethroughPrice) : null; p.delivery = of.deliveryDescription || ''; p.priceAt = Date.now(); }
        const rv = ra && (ra.rating != null ? ra.rating : (ra.averageRating != null ? ra.averageRating : null)); if (rv != null) p.rating = Number(rv);
        const imgs = me && (Array.isArray(me) ? me : (me.media || me.images || [])); const im = Array.isArray(imgs) ? imgs.map(x => x && (x.url || (x.image && x.image.url))).filter(Boolean) : []; if (im.length) p.image = im[0];
        done = !!(pr && pr.title);
      }
    } catch (e) {}
    // 2) foto en prijs zijn verplicht voor een koop-doorklik: zoek het product (of zijn leverbare variant) via de zoek-API
    if (done && p.image && p.price != null) continue;
    try {
      const term = (p.name && p.name.length > 8 ? p.name : slugWords(p.slugpart)).replace(/\s*-\s*[^-]{0,30}$/, '');
      const r = await searchCached(term, { country: 'NL', size: 8, sort: 'RELEVANCE' });
      const fill = (hit, swap) => { p.name = hit.title.replace(/\s*[|\-\u2013\u2014]\s*(bol|bol\.com).*$/i, '').slice(0, 80); if (hit.price != null) { p.price = hit.price; p.strike = hit.strike; p.priceAt = r.at; } if (hit.rating != null) p.rating = hit.rating; if (hit.image) p.image = hit.image; if (hit.delivery) p.delivery = hit.delivery; if (swap) { p.swappedFrom = p.id; p.id = String(hit.id); p.url = hit.url; } };
      const same = r.products.find(x => x.id && String(x.id) === String(p.id));
      if (same && (same.price != null || p.price != null)) fill(same, false);
      if (p.price == null) { // niet leverbaar: beste leverbare variant uit dezelfde familie (zelfde merk/eerste woorden), goed beoordeeld, snel geleverd
        const first = String(p.name || term).toLowerCase().split(' ').slice(0, 2).join(' ');
        const cands = r.products.filter(x => x.price != null && x.image && x.title.toLowerCase().startsWith(first));
        cands.sort((a, b) => ((/voorraad|morgen/i.test(b.delivery || '') ? 1 : 0) - (/voorraad|morgen/i.test(a.delivery || '') ? 1 : 0)) || ((b.rating || 0) - (a.rating || 0)));
        if (cands[0]) fill(cands[0], true);
      }
    } catch (e) {}
  }
}
const num = v => Number(v) || 0;
// korte code (10 tekens, base36) van een clickid, voor in de bol-subid
function shortId(s) { let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 16777619) >>> 0; h2 = Math.imul(h2 + ch, 2246822519) >>> 0; } return (h1.toString(36) + h2.toString(36)).slice(0, 10); }
// Beta(a,b)-trekking (Thompson) via som van exponentiëlen: goed genoeg voor kleine tellers
function gam(k) { let s = 0; for (let i = 0; i < Math.max(1, Math.round(k)); i++) s += -Math.log(1 - Math.random()); return s * (k / Math.max(1, Math.round(k))); }
function betaSample(succ, fail) { const a = gam(succ + 1), b = gam(fail + 1); return a / (a + b); }

async function loadArticle(slug) {
  const key = 'hjdk:bridge3:' + slug;
  try { const c = await kv.get(key); if (c && c.at && Date.now() - c.at < CACHE_MS && c.products && c.products.length) return c; } catch (e) {}
  const url = 'https://yoo.rs/' + slug;
  const lastKey = 'hjdk:bridge3:last:' + slug; // laatste goede versie, zonder vervaltijd: de brug blijft werken als Yoors plat ligt
  let html = '', yoorsOk = false;
  try { const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; hjdk-bridge/2.0)', 'accept': 'text/html' }, redirect: 'follow', signal: ctrl.signal }); clearTimeout(tm);
    if (r.ok) { html = await r.text(); yoorsOk = /<a\b/i.test(html); } } catch (e) {}
  if (!yoorsOk) { // Yoors onbereikbaar of leeg: gebruik de laatste goede versie (prijzen mogen dan ouder zijn)
    try { const last = await kv.get(lastKey); if (last && last.products && last.products.length) { const stale = Object.assign({}, last, { at: Date.now() - CACHE_MS + 10 * 60000, stale: true }); try { await kv.set(key, stale); } catch (e) {} return stale; } } catch (e) {}
  }
  const og = (re) => { const m = html.match(re); return m ? clean(m[1]) : ''; };
  let title = og(/<h1[^>]*>([\s\S]*?)<\/h1>/i); if (isPlaceholder(title)) title = og(/property="og:title"\s+content="([^"]*)"/i) || og(/<title>([^<]*)<\/title>/i);
  title = title.replace(/\s*[|\-–—:]\s*(yoors|yoo\.rs)\s*$/i, '').slice(0, 90);
  const image = og(/property="og:image"\s+content="([^"]*)"/i);
  // alle bol-PRODUCTlinks (geen zoeklinks), met linktekst als productnaam; volgorde = volgorde in het artikel
  const products = []; const seen = {};
  const aRe = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi; let m;
  const addP = (href, text) => {
    let u = href.replace(/&amp;/g, '&');
    const pm = u.match(/partner\.bol\.com\/click\/click\?[^"'\s<]*url=([^&"'\s<]+)/i); if (pm) { try { u = decodeURIComponent(pm[1]); } catch (e) { return; } }
    const idm = u.match(/https?:\/\/(?:www\.)?bol\.com\/[a-z]{2}\/[a-z]{2}\/p\/([^/?#]+)\/(\d{8,})/i); if (!idm) return;
    const id = idm[2]; if (seen[id]) return; seen[id] = 1;
    const t = clean(text); const name = cap(badLinkText(t) ? slugWords(idm[1]).slice(0, 70) : t.slice(0, 80));
    products.push({ id, url: u.replace(/[?#].*$/, ''), name, slugpart: idm[1] });
  };
  while ((m = aRe.exec(html)) && products.length < 6) addP(m[1], m[2]);
  if (!products.length) { const m1 = html.match(/https?:\/\/(?:www\.)?bol\.com\/[a-z]{2}\/[a-z]{2}\/p\/[^"'\s<)]+\/\d{8,}\/?/i); if (m1) addP(m1[0], ''); }
  await enrich(products);
  if (!products.length) { // ook geen artikel te lezen: zoek het product bij bol op de woorden uit de slug, zodat de bezoeker nooit op een dode Yoors belandt
    try { const r = await searchCached(slugWords(slug), { country: 'NL', size: 5, sort: 'POPULARITY' }); const hit = r.products.find(p => p.price != null && p.image) || r.products[0];
      if (hit) { products.push({ id: String(hit.id || ''), url: hit.url, name: hit.title.slice(0, 80), slugpart: slug, price: hit.price, strike: hit.strike, rating: hit.rating, image: hit.image, priceAt: r.at, viaSearch: true }); if (!title) title = cap(slugWords(slug)); } } catch (e) {}
  }
  const out = { at: Date.now(), title, image, products, article: url, bol: products.length ? products[0].url : '' };
  try { if (products.length) { await kv.set(key, out); if (yoorsOk && !products[0].viaSearch) await kv.set(lastKey, out); } } catch (e) {}
  return out;
}

// Amazon-tegenhanger van het topproduct (24u cache per pagina; bij geen resultaat 1u niet opnieuw proberen). Geeft null als er geen sleutels zijn.
async function loadAmz(slug, term) {
  let creds = null; try { creds = await getAmzCreds(); } catch (e) {}
  if (!creds) { // geen PA-API (nog): met alleen een tag tonen we een Amazon-zoeklink zonder prijs ('lite')
    let t = null; try { t = await getAmzTagOnly(); } catch (e) {} if (!t) return null;
    const q = String(term || '').replace(/\s*-\s*[^-]{0,30}$/, '').slice(0, 80);
    return { lite: true, title: q, url: 'https://' + t.market + '/s?k=' + encodeURIComponent(q) + '&tag=' + encodeURIComponent(t.tag), price: null, image: '', prime: false };
  }
  const key = 'hjdk:bridge2:amz:' + slug;
  try { const c = await kv.get(key); if (c && c.at && Date.now() - c.at < (c.product ? 24 : 1) * 3600 * 1000) return c.product || null; } catch (e) {}
  let product = null;
  try { const r = await amzSearchCached(String(term || '').slice(0, 100), { count: 6 }); product = r.products.find(p => p.price != null && p.image) || null; if (product) product.priceAt = r.at; } catch (e) {}
  try { await kv.set(key, { at: Date.now(), product }); } catch (e) {}
  return product;
}

export default async function handler(req, res) {
  const q = req.query || {};
  const slug = String(q.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80);
  if (!slug) return res.status(404).send('no slug');
  const zone = String(q.zoneid || '').replace(/\D/g, '').slice(0, 8) || '0';
  const clickid = String(q.clickid || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
  const cid = String(q.creativeid || '').replace(/\D/g, '').slice(0, 12);
  const a = await loadArticle(slug);
  res.setHeader('cache-control', 'no-store');
  if (!a.products.length) {
    try { await kv.incrMany([['c:hjdk6-br-' + slug + '-arr', 1], ['c:hjdk6-br-' + slug + '-nolink', 1]]); } catch (e) {}
    return res.redirect(302, a.article + '?utm_source=' + encodeURIComponent(String(q.utm_source || 'bridge')) + '&clickid=' + encodeURIComponent(clickid) + '&zoneid=' + zone);
  }
  // --- leren: variant kiezen (klik/aankomst) en producten ordenen (klik/vertoning), Thompson sampling ---
  const keys = [];
  BTN.forEach((t, i) => keys.push('c:hjdk6-brb-' + slug + '-' + i + '-hum', 'c:hjdk6-brb-' + slug + '-' + i + '-clk'));
  ['one', 'list', 'duo'].forEach(v => keys.push('c:hjdk6-brv-' + slug + '-' + v + '-arr', 'c:hjdk6-brv-' + slug + '-' + v + '-hum', 'c:hjdk6-brv-' + slug + '-' + v + '-clk'));
  a.products.forEach(p => keys.push('c:hjdk6-brp-' + slug + '-' + p.id + '-imp', 'c:hjdk6-brp-' + slug + '-' + p.id + '-clk'));
  let vals = []; try { vals = await kv.mget(...keys); } catch (e) { vals = []; }
  const st = {}; keys.forEach((k, i) => { st[k.slice(2)] = num(vals[i]); });
  const ranked = a.products.map(p => { const imp = st['hjdk6-brp-' + slug + '-' + p.id + '-imp'], clk = st['hjdk6-brp-' + slug + '-' + p.id + '-clk']; return { p, s: betaSample(clk, Math.max(0, imp - clk)) }; }).sort((x, y) => y.s - x.s).map(x => x.p);
  const top = ranked[0];
  const amz = await loadAmz(slug, top.name || slugWords(slug)); // null zonder Amazon-sleutels of zonder passend product
  const learn = amz ? LEARN.concat('duo') : LEARN;
  let variant = VARIANTS.indexOf(String(q.v || '')) >= 0 ? String(q.v) : (String(q.m || '') === 'r' ? 'direct' : '');
  if (variant === 'duo' && !amz) variant = '';
  // leren op orders (uit /api/bol/learn, per lay-out over alle pagina's): zodra er ≥5 orders zijn, kiest de helft van de bezoekers de lay-out met de hoogste commissie per 1.000 kliks
  let orderPick = '';
  try { const L = await kv.get('hjdk:learn:v1'); const lay = L && L.layouts || {}; const codeOf = { o: 'one', l: 'list', u: 'duo' };
    const cands = Object.entries(lay).map(([c, x]) => ({ v: codeOf[c], x })).filter(e => e.v && learn.indexOf(e.v) >= 0 && e.x.clicks >= 300);
    const totalOrders = cands.reduce((n, e) => n + (e.x.orders || 0), 0);
    if (totalOrders >= 5) { cands.sort((p, q) => (q.x.commissionPer1000 || 0) - (p.x.commissionPer1000 || 0)); if (cands[0] && (cands[0].x.commissionPer1000 || 0) > 0) orderPick = cands[0].v; } } catch (e) {}
  if (!variant && orderPick && Math.random() < 0.5) variant = orderPick;
  if (!variant) {
    if (Math.random() < DIRECT_SHARE) variant = 'direct';
    else { let best = -1; learn.forEach(v => { const hum = st['hjdk6-brv-' + slug + '-' + v + '-hum'], arr = st['hjdk6-brv-' + slug + '-' + v + '-arr'], clk = st['hjdk6-brv-' + slug + '-' + v + '-clk']; const n = hum > 0 ? hum : arr; const s = betaSample(clk, Math.max(0, n - clk)); if (s > best) { best = s; variant = v; } }); }
  }
  const shown = variant === 'list' ? ranked.slice(0, 5) : [top];
  // aankomst tellen (server: telt ook bots; vergelijk met -view en -hum)
  // knoptekst kiezen (Thompson op klik per mens); variant 3 alleen als er een prijs is
  let bi = 0; { let best = -1; BTN.forEach((t, i) => { if (i === 3 && top.price == null) return; if (i === 4 && !/morgen/i.test(top.delivery || '')) return; const hum = st['hjdk6-brb-' + slug + '-' + i + '-hum'], clk = st['hjdk6-brb-' + slug + '-' + i + '-clk']; const sc = betaSample(clk, Math.max(0, hum - clk)); if (sc > best) { best = sc; bi = i; } }); }
  if (/^\d$/.test(String(q.b || ''))) bi = Math.min(BTN.length - 1, Number(q.b));
  const arrHits = [['c:hjdk6-br-' + slug + '-arr', 1], ['c:hjdk6-brz-' + zone + '-arr', 1], ['c:hjdk6-brv-' + slug + '-' + variant + '-arr', 1], ['c:hjdk6-brb-' + slug + '-' + bi + '-arr', 1]];
  shown.forEach(p => arrHits.push(['c:hjdk6-brp-' + slug + '-' + p.id + '-imp', 1])); if (cid) arrHits.push(['c:hjdk6-brc-' + cid + '-arr', 1]);
  try { await kv.incrMany(arrHits); } catch (e) {}
  const code = clickid ? shortId(clickid) : '';
  const subid = ('br_' + slug.slice(0, 24) + '-Z' + zone + '-' + (VCODE[variant] || variant[0]) + (code ? '-' + code : '')).replace(/[^A-Za-z0-9_-]/g, '');
  if (code) { try { await kv.set('hjdk:cid:' + code, { c: clickid, s: String(q.utm_source || ''), z: zone, g: slug, v: variant, at: Date.now() }, { ex: 10 * 86400 }); } catch (e) {} }
  const deep = (u) => 'https://partner.bol.com/click/click?p=1&t=url&s=' + BOL_SITE + '&f=TXL&url=' + encodeURIComponent(u) + '&subid=' + encodeURIComponent(subid);
  const postback = clickid ? pbFor(q.utm_source).replace('{clickid}', encodeURIComponent(clickid)) : '';
  if (variant === 'direct') { // meteen door, met meting en conversie
    const h = [['c:hjdk6-br-' + slug + '-clk', 1], ['c:hjdk6-brz-' + zone + '-clk', 1], ['c:hjdk6-brv-' + slug + '-direct-clk', 1], ['c:hjdk6-brp-' + slug + '-' + top.id + '-clk', 1]]; if (cid) h.push(['c:hjdk6-brc-' + cid + '-clk', 1]);
    try { await kv.incrMany(h); } catch (e) {}
    if (postback) { try { await fetch(postback).catch(() => {}); } catch (e) {} }
    return res.redirect(302, deep(top.url));
  }
  // --- pagina ---
  const adTitle = clean(String(q.h || '')).slice(0, 80) || PA_TITLES[cid] || CREATIVE_TITLES[cid] || '';
  const h1 = esc(adTitle || a.title || 'Bekijk dit product bij bol');
  const sub = adTitle && a.title && adTitle.toLowerCase() !== a.title.toLowerCase() ? '<p class="sub">' + esc(a.title) + '</p>' : '';
  const eur = v => (v == null || isNaN(v)) ? '' : '€' + Number(v).toFixed(2).replace('.', ',');
  const tijd = ts => { try { const d = new Date(ts || Date.now()); return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }); } catch (e) { return ''; } };
  const stars = r => r == null ? '' : '<span class="st">' + '★'.repeat(Math.round(r)) + '<span class="dim">' + '★'.repeat(5 - Math.round(r)) + '</span> ' + Number(r).toFixed(1).replace('.', ',') + '</span>';
  // productfoto van bol (via API) gaat voor de artikelfoto; bij geen van beide geen foto
  const imgUrl = (top.image && /^https?:\/\//.test(top.image)) ? top.image : (a.image && /^https?:\/\//.test(a.image) ? a.image : '');
  const img = imgUrl ? '<img src="' + esc(imgUrl) + '" alt="" loading="eager" decoding="async"' + (top.image ? ' class="pi"' : '') + '>' : '';
  // productregel: naam, prijs (met tijdstip zoals bol hem gaf), sterren
  const prijs = top.price != null ? '<div class="pr">' + eur(top.price) + (top.strike != null && top.strike > top.price ? ' <s>' + eur(top.strike) + '</s>' : '') + '<span class="at"> bij bol, gezien ' + tijd(top.priceAt) + '</span></div>' : '';
  const lever = top.delivery ? '<div class="lv">' + esc(String(top.delivery).replace(/^Op voorraad\.?\s*/i, 'Op voorraad · ').slice(0, 70)) + '</div>' : '';
  const prod = '<div class="pn">' + esc(top.name) + '</div>' + prijs + (top.rating != null ? '<div class="rt">' + stars(top.rating) + '</div>' : '') + lever;
  const btn = (p, big) => '<a class="' + (big ? 'b' : 'r') + '" data-p="' + esc(p.id) + '" href="' + esc(deep(p.url)) + '" rel="sponsored noopener">' + (big ? esc(BTN[bi].replace('{p}', eur(p.price))) : esc(p.name) + (p.price != null ? ' · ' + eur(p.price) : '') + ' →') + '</a>';
  const alts = shown.length > 1 ? '<div class="alt"><div class="e">Ook in dit artikel</div>' + shown.slice(1).map(p => btn(p, false)).join('') + '</div>' : '';
  // duo: hetzelfde product bij Amazon, met prijs en tijdstip; goedkoopste krijgt het label
  let duo = '';
  if (variant === 'duo' && amz) {
    const amzUrl = amz.url + (amz.url.indexOf('?') < 0 ? '?' : '&') + 'ascsubtag=' + encodeURIComponent(subid);
    const bolCheaper = top.price != null && amz.price != null && top.price < amz.price, amzCheaper = top.price != null && amz.price != null && amz.price < top.price;
    if (amz.lite) { // alleen een tweede knop, zonder Amazon-prijs (Amazon staat prijzen alleen via hun API toe)
      duo = '<div class="duo"><div class="e">Ook te vergelijken</div><a class="b a2" data-p="amz" data-s="amz" href="' + esc(amzUrl) + '" rel="sponsored noopener">Bekijk ook op Amazon.nl →</a><div class="an">Zoekt hetzelfde product bij Amazon.nl</div></div>';
    } else {
    const lbl = '<span class="lp">laagste prijs</span>';
    duo = '<div class="duo"><div class="e">Vergelijk de prijs</div>' +
      '<div class="row"><div class="rw"><div class="rn">bol' + (bolCheaper ? ' ' + lbl : '') + '</div><div class="rp">' + (top.price != null ? eur(top.price) : 'prijs bij bol') + '</div><div class="ra">' + (top.price != null ? 'gezien ' + tijd(top.priceAt) : '') + '</div></div>' +
      '<div class="rw"><div class="rn">Amazon.nl' + (amzCheaper ? ' ' + lbl : '') + '</div><div class="rp">' + (amz.price != null ? eur(amz.price) : 'prijs bij Amazon') + '</div><div class="ra">' + (amz.price != null ? 'gezien ' + tijd(amz.priceAt) : '') + '</div></div></div>' +
      '<a class="b a2" data-p="amz" data-s="amz" href="' + esc(amzUrl) + '" rel="sponsored noopener">Bekijk bij Amazon.nl →</a>' +
      '<div class="an">' + esc(amz.title.slice(0, 90)) + (amz.prime ? ' · Prime' : '') + '</div></div>';
    }
  }
  const disc = variant === 'duo' && amz ? 'Affiliate-links: yoo.rs ontvangt een vergoeding van bol en, als Amazon-partner, van in aanmerking komende aankopen bij Amazon. De prijs verandert daardoor niet. Prijzen zijn momentopnames (tijdstip vermeld) en kunnen bij de winkel afwijken.' : 'Affiliate-link: yoo.rs ontvangt een vergoeding van bol, de prijs verandert niet.';
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(a.title || adTitle)}</title>
<style>body{margin:0;font:16px/1.5 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;background:#f6f7f9;color:#111}main{max-width:560px;margin:0 auto;padding:20px 16px 40px}.c{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.05)}.e{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:8px}h1{font-size:22px;line-height:1.25;margin:0 0 6px}.sub{margin:0 0 12px;color:#6b7280;font-size:14px}img{width:100%;max-height:300px;object-fit:cover;border-radius:10px;margin:0 0 14px;background:#eee}p{margin:0 0 16px;color:#374151}.b{display:block;text-align:center;background:#0000ff;color:#fff;text-decoration:none;font-weight:700;font-size:18px;padding:16px;border-radius:12px}.b:active{opacity:.85}.alt{margin-top:16px}.r{display:block;padding:12px 14px;margin-top:8px;border:1px solid #e5e7eb;border-radius:10px;color:#111;text-decoration:none;font-weight:600;background:#fafafa}.s{display:block;text-align:center;margin-top:14px;color:#6b7280;font-size:14px}img.pi{object-fit:contain;background:#fff;max-height:260px}.pn{font-weight:700;font-size:17px;margin:0 0 4px}.pr{font-size:20px;font-weight:800;margin:0 0 4px}.pr s{color:#9ca3af;font-weight:400;font-size:15px;margin-left:6px}.at{color:#6b7280;font-weight:400;font-size:12px}.rt{margin:0 0 12px}.st{color:#f59e0b;font-size:14px}.st .dim{color:#e5e7eb}small{display:block;margin-top:18px;color:#9ca3af;font-size:12px;text-align:center}.lv{font-size:13px;color:#166534;margin:0 0 12px;font-weight:600}.s2{color:#9ca3af;text-decoration:underline}.stk{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #e5e7eb;padding:8px 12px 10px;box-shadow:0 -2px 8px rgba(0,0,0,.06);transform:translateY(110%);transition:transform .25s}.stk.on{transform:none}.stk .stp{font-size:12px;color:#374151;margin:0 0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stk .b{padding:13px;font-size:16px}body.stkon main{padding-bottom:110px}.duo{margin-top:18px;padding-top:14px;border-top:1px solid #e5e7eb}.row{display:flex;gap:10px;margin-bottom:12px}.rw{flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px;background:#fafafa}.rn{font-size:13px;font-weight:700;color:#374151}.rp{font-size:19px;font-weight:800}.ra{font-size:11px;color:#6b7280}.lp{display:inline-block;background:#dcfce7;color:#166534;font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;margin-left:4px;vertical-align:middle}.b.a2{background:#111827}.an{font-size:12px;color:#6b7280;margin-top:8px;text-align:center}</style></head>
<body><main><div class="c"><div class="e">Keuzehulp · yoo.rs</div><h1>${h1}</h1>${sub}${img}${prod}
<p>${top.price != null ? 'Bij bol: 30 dagen bedenktijd, gratis retour. Reviews en voorraad zie je daar.' : 'Prijs van vandaag, voorraad, levertijd en reviews staan bij bol. Even checken voordat je koopt:'}</p>
${btn(top, true)}${alts}${duo}
<small>${disc}<br><a class="s2" href="${esc(a.article)}?utm_source=bridge&zoneid=${zone}">Volledige keuzehulp op yoo.rs</a></small></div></main>
<div class="stk" id="stk"><div class="stp">${esc(top.name.slice(0, 40))}${top.price != null ? ' · ' + eur(top.price) : ''}</div>${btn(top, true)}</div>
<script>(function(){var A='https://hjdk-api.vercel.app/api/hjdk/stats/hits',S=${JSON.stringify(slug)},Z=${JSON.stringify(zone)},V=${JSON.stringify(variant)},B=${JSON.stringify(String(bi))},C=${JSON.stringify(cid)},PB=${JSON.stringify(postback)};
function send(hs){try{var b=JSON.stringify({hits:hs});if(navigator.sendBeacon&&navigator.sendBeacon(A,new Blob([b],{type:'text/plain'})))return;fetch(A,{method:'POST',keepalive:true,headers:{'content-type':'text/plain'},body:b});}catch(e){}}
function base(m){var h=[['hjdk6-br-'+S+'-'+m,1],['hjdk6-brz-'+Z+'-'+m,1]];if(m!=='view'){h.push(['hjdk6-brv-'+S+'-'+V+'-'+m,1]);h.push(['hjdk6-brb-'+S+'-'+B+'-'+m,1]);}return h;}
send(base('view'));
try{var mb=document.querySelector('main a.b'),sk=document.getElementById('stk');if(mb&&sk&&'IntersectionObserver' in window){new IntersectionObserver(function(es){var vis=es[0].isIntersecting;sk.classList.toggle('on',!vis);document.body.classList.toggle('stkon',!vis);}).observe(mb);}}catch(e){}
var hum=false;function onHum(){if(hum)return;hum=true;send(base('hum'));}
['scroll','touchstart','pointermove','mousemove','keydown','click'].forEach(function(ev){addEventListener(ev,onHum,{once:true,passive:true});});
var clicked=false;document.querySelectorAll('a[data-p]').forEach(function(g){['click','auxclick'].forEach(function(ev){g.addEventListener(ev,function(){if(clicked)return;clicked=true;var h=base('clk');if(g.getAttribute('data-s')==='amz'){h.push(['hjdk6-br-'+S+'-amzclk',1]);h.push(['hjdk6-brz-'+Z+'-amzclk',1]);h.push(['hjdk6-brv-'+S+'-'+V+'-amzclk',1]);}else{h.push(['hjdk6-brp-'+S+'-'+g.getAttribute('data-p')+'-clk',1]);}if(C)h.push(['hjdk6-brc-'+C+'-clk',1]);send(h);if(PB){try{fetch(PB,{mode:'no-cors',keepalive:true});}catch(e){}}});});});})();</script></body></html>`;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
