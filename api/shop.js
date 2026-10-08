// YOORS SHOP-LUS — betaald verkeer (PropellerAds + Mondiad) naar yoo.rs/shop, volledig lerend. Draait op Vercel, los van Claude-account en laptop.
//   /shop  en  /shop/<product>   landingspagina: meet per advertentieplek, advertentie en product wie aankomt, wie een echt mens is, wie blijft en wie doorklikt
//   /api/shop/uit                doorklik naar yoo.rs/shop: telt, en meldt de conversie aan het advertentienetwerk (postback)
//   /api/shop/b                  tellers vanaf de landingspagina (echt mens, gebleven)
//   /api/shop/px                 pixel voor de shop zelf (winkelwagen / aankoop), zodat de lus op echte bestellingen leert
//   /api/shop/img                advertentiebeeld per product (icoon 192x192, Mondiad 720x360, PropellerAds 492x328)
//   /api/shop/ronde              de leerronde (cron elk uur van 07 tot 23 uur NL; ?droog=1 = alleen rekenen)
//   /api/shop/voorpa             gegevens voor de PropellerAds-lus (project propellerads-mcp): advertenties, tellers per plek en advertentie
//   /api/shop/palog              de PropellerAds-lus meldt hier wat hij deed
//   /api/shop/status?k=...       statuspagina in gewone taal
// Wat hij leert, elk uur:
//   1. Producten: welke producten doorkliks (en straks bestellingen) geven. Die komen bovenaan de landingspagina en krijgen nieuwe advertenties; seizoen telt mee.
//   2. Advertentieplekken: nep, geen echte mensen of nooit een doorklik -> uitgesloten in alle shop-campagnes van dat netwerk.
//   3. Advertenties: zwakke teksten uit, elke dag nieuwe teksten voor de best lopende producten (Claude), prijs in de tekst klopt niet meer -> uit.
//   4. Bod en budget: te weinig verkeer bij goede kwaliteit -> bod omhoog; geld weg zonder doorkliks -> campagne stil.
import sharp from 'sharp';
import { kv } from '../lib/db.js';
import { md } from '../lib/mdmcp.js';
import { look } from '../lib/look.js';
import seed from '../data/shop-seed.json' with { type: 'json' };

const LAND = () => (process.env.SHOP_LAND || 'https://keuzehulp.best').replace(/\/$/, '');
const SHOP = 'https://yoo.rs/shop';
const PB = { pa: 'https://ad.propellerads.com/conversion.php?aid=3772727&pid=&tid=151850&visitor_id={clickid}', md: 'https://postback.mondiad.com/track?uid=31070&clickid={clickid}' };
const NAAM = 'SHOP-LUS'; // elke campagne met dit in de naam hoort bij de lus
const ACC = { acc: '#1e3a8a', acc2: '#e8edfb', accD: '#a5b4fc', acc2D: '#161b33' };
const E = (k, d) => { const v = Number(process.env[k]); return Number.isFinite(v) && v > 0 ? v : d; };
const MD_MAX_BOD = () => E('SHOP_MD_MAX_BOD', 0.05), MD_BIJVUL = () => E('SHOP_MD_BIJVUL', 10), MIN_SALDO = () => E('SHOP_MIN_SALDO', 5), NIEUWE_ADS_PER_DAG = () => E('SHOP_NIEUWE_ADS', 2), MAX_ADS_PER_CAMPAGNE = () => E('SHOP_MAX_ADS', 10), LEK = () => E('SHOP_LEK', 2);
const K = { cat: 'hjdk:shop:cat', ads: 'hjdk:shop:ads', top: 'hjdk:shop:top', crmap: 'hjdk:shop:crmap', log: 'hjdk:shop:log', palog: 'hjdk:shop:palog', laatste: 'hjdk:shop:laatste', zwart: n => 'hjdk:shop:zwart:' + n, lock: 'hjdk:shop:lock', dag: d => 'hjdk:shop:dag:' + d, snap: d => 'hjdk:shop:snap:' + d, rec: c => 'hjdk:shc:' + c, sleutel: 'hjdk:shop:sleutel', statuskey: 'hjdk:shop:statuskey', set: (s, n) => 'hjdk:shop:set:' + s + (n ? ':' + n : '') };
const DAY = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const D8 = () => DAY().replace(/-/g, '');
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
const compact = x => ({ id: String(x.id), t: String(x.title || '').trim(), p: num(x.price), pf: !!x.price_from, op: x.original_price ? num(x.original_price) : 0, b: String(x.brand || '').trim(), c: String(x.shop_category || ''), s: String(x.shop_sub || ''), img: String(((x.photos || [])[0] || {}).src || '').split('?')[0], v: num(x.views), f: num(x.favourites), sc: num(x.score), l: num(x.launched_at), r: num(x.rating), rc: num(x.rating_count), fs: !!x.free_shipping });
async function catalog(vers) {
  if (!vers && CAT && Date.now() - CAT_AT < 300000) return CAT;
  let c = null; try { c = await kv.get(K.cat); } catch (e) {}
  if (!c || !Array.isArray(c.items) || !c.items.length) c = { at: 0, items: seed.items.map(i => Object.assign({ v: 0, f: 0, sc: 0, l: 0 }, i)), terugval: true };
  CAT = c; CAT_AT = Date.now(); return c;
}
async function bewaarCatalogus(items, bron) {
  const c = { at: Date.now(), bron, items }; await kv.set(K.cat, c); CAT = c; CAT_AT = Date.now();
  try { if (!(await kv.get(K.snap(DAY())))) { const s = {}; items.forEach(i => { if (i.v || i.f) s[i.id] = [i.v, i.f]; }); await kv.set(K.snap(DAY()), s, { ex: 40 * 86400 }); } } catch (e) {}
  return c;
}
async function sync() { // de shop zelf vertelt wat er te koop is, wat het kost en wat bekeken/bewaard wordt
  const items = []; let off = 0;
  for (let i = 0; i < 80; i++) {
    const r = await fetch(SHOP + '/api/shop?lang=nl&offset=' + off, { headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36', accept: 'application/json', 'accept-language': 'nl-NL,nl;q=0.9' } });
    if (!r.ok) throw new Error('shop gaf HTTP ' + r.status);
    const j = await r.json(); const l = j.items || []; l.forEach(x => items.push(compact(x)));
    if (j.next == null || !l.length) break; off = j.next;
  }
  if (items.length < 10) throw new Error('shop gaf maar ' + items.length + ' producten');
  return bewaarCatalogus(items, 'shop');
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
// Rangorde: eigen doorkliks (Thompson, zodat nieuwe producten ook een kans krijgen) x seizoen x wat de shop zelf ziet (bekeken, bewaard) x startset.
async function rangorde(cat, vast) {
  const start = new Set(seed.ads.map(a => a.pid)); let gisteren = {}; try { gisteren = (await kv.get(K.snap(DAY(-1)))) || {}; } catch (e) {}
  const kand = cat.items.filter(i => i.img && i.p >= 8 && i.p <= 150);
  const gezien = new Set(await smembers(K.set('p'))); const tel = await productTellers(kand.filter(i => gezien.has(i.id)).map(i => i.id));
  return kand.map(i => { const u = tel[i.id] || { himp: 0, hklik: 0, imp: 0, klik: 0, cart: 0, koop: 0 }; const g = gisteren[i.id] || [i.v, i.f];
    const n = u.himp + 0.3 * u.imp, k = u.hklik + u.klik + 3 * u.cart + 12 * u.koop;
    const ctr = vast ? (k + 2) / (n + 26) : beta(k + 2, Math.max(0, n - Math.min(n, u.hklik + u.klik)) + 24); // voorkennis: ~8% klikt door; pas met echte bezoekers verschuift de volgorde
    const shop = 1 + 0.25 * Math.min(8, i.f) + 0.03 * Math.min(40, i.v) + 0.4 * Math.max(0, i.f - g[1]) + 0.05 * Math.max(0, i.v - g[0]);
    const sz = seizoen(i), en = engels(i.t); return { id: i.id, score: ctr * sz * shop * (start.has(i.id) ? 1.6 : 1) * (i.p <= 50 ? 1.15 : 1) * (en ? 0.35 : 1), n: Math.round(n), k, thema: themaVan(i), reden: !en && (sz > 1 || i.f > 0 || k > 0) }; }).sort((a, b) => b.score - a.score);
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
Regels: titel hooguit 30 tekens, tekst hooguit 45 tekens. Eerlijk: verzin geen eigenschappen die niet in de productnaam staan, geen nep-urgentie, geen 'gratis', geen korting noemen. Noem de prijs alleen exact zoals hierboven. Concreet en nieuwsgierig makend, elke variant een andere invalshoek (cadeau, seizoen of moment, zelf doen, sfeer in huis). Gewone spreektaal, geen uitroeptekens. Antwoord alleen JSON: {"varianten":[{"title":"","desc":""}]}`);
  const al = new Set(bestaand.map(a => a.title.toLowerCase()));
  const v = (j && Array.isArray(j.varianten) ? j.varianten : []).map(x => ({ title: String(x.title || '').trim(), desc: String(x.desc || x.description || '').trim() })).filter(x => x.title && x.desc && x.title.length <= 30 && x.desc.length <= 45 && !al.has(x.title.toLowerCase()));
  if (v.length) return Object.assign({ bron: 'claude' }, v[0]);
  const t = kortTitel(it); return al.has(t.toLowerCase()) ? null : { title: t, desc: ('Nu in de Yoors Shop voor ' + eur(it.p)).slice(0, 45), bron: 'sjabloon' };
}
async function advertenties() { let a = null; try { a = await kv.get(K.ads); } catch (e) {} if (!Array.isArray(a) || !a.length) { a = seed.ads.map(x => Object.assign({ at: Date.now(), bron: 'start' }, x)); try { await kv.set(K.ads, a); } catch (e) {} } return a; }
const prijsInTekst = a => { const m = (a.title + ' ' + a.desc).match(/€\s?(\d+(?:[.,]\d{1,2})?)/); return m ? Number(m[1].replace(',', '.')) : null; };
const beeld = (pid, t) => LAND() + '/api/shop/img?p=' + encodeURIComponent(pid) + '&t=' + t;

// ---------------- tellers per netwerk ----------------
const SOORTEN = ['view', 'mens', 'eng', 'klik', 'conv', 'cart', 'koop'];
async function tellers(net, soort, ids) { const out = {}; if (!ids.length) return out; const keys = []; ids.forEach(z => SOORTEN.forEach(s => keys.push('c:sh-' + net + '-' + soort + z + '-' + s))); const vals = []; for (let i = 0; i < keys.length; i += 490) vals.push(...await kv.mget(...keys.slice(i, i + 490))); ids.forEach((z, i) => { const o = {}; SOORTEN.forEach((s, j) => { o[s] = num(vals[i * SOORTEN.length + j]); }); out[z] = o; }); return out; }
async function dagTotaal(dag) { const nets = ['md', 'pa', 'x']; const keys = []; nets.forEach(n => SOORTEN.forEach(s => keys.push('c:sh-d' + dag.replace(/-/g, '') + '-' + n + '-' + s))); const v = await kv.mget(...keys); const out = {}; nets.forEach((n, i) => { out[n] = {}; SOORTEN.forEach((s, j) => { out[n][s] = num(v[i * SOORTEN.length + j]); }); }); return out; }
// Oordeel over een advertentieplek. netKliks = kliks volgens het netwerk, o = onze eigen tellers.
function plekOordeel(netKliks, o, gemKlik) {
  if (netKliks >= 15 && o.view < 0.4 * netKliks) return { uit: `nep: ${netKliks} kliks volgens het netwerk, maar ${o.view} kwamen aan` };
  if (o.view >= 12 && o.mens < 0.25 * o.view) return { uit: `geen echte mensen: van ${o.view} bezoekers bewogen er maar ${o.mens}` };
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
  const crPa = await tellers('pa', 'a', await smembers(K.set('a', 'pa'))), crMd = await tellers('md', 'a', await smembers(K.set('a', 'md')));
  const crmap = (await kv.get(K.crmap)) || {};
  const adScore = a => { let v = 0, k = 0; for (const [key, pid] of Object.entries(crmap)) { if (pid !== a.pid) continue; const [n, id] = key.split(':'); const o = (n === 'pa' ? crPa : crMd)[id]; if (o && crmap['t:' + key] === a.title) { v += o.view; k += o.klik; } } return { v, k, r: (k + 0.5) / (v + 10) }; };
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
    const zs = [...new Set([...Object.keys(zMd), ...await smembers(K.set('z', 'md'))])]; const eigen = await tellers('md', 'z', zs);
    let tv = 0, tk = 0; zs.forEach(z => { tv += eigen[z].view; tk += eigen[z].klik; }); const gem = tv >= 30 ? tk / tv : 0.08;
    const zwart = new Set(((await kv.get(K.zwart('md'))) || []).map(String)); const goed = {}; let nieuwZwart = 0;
    for (const z of zs) { if (zwart.has(z)) continue; const o = plekOordeel((zMd[z] || {}).kliks || 0, eigen[z], gem); if (o.uit) { zwart.add(z); nieuwZwart++; B('plek uit (Mondiad)', z, o.uit); } else if (o.goed) goed[z] = o.goed; }
    const campTel = await tellers('md', 'k', mdCamps.map(c => String(c.id)));
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
      const dagen = Math.max(0.2, (Date.now() - new Date(det.createdDate || Date.now()).getTime()) / 864e5); const kwaliteitOk = !eigenC.view || eigenC.view < 15 || eigenC.mens >= 0.4 * eigenC.view;
      if (dagen >= 0.25 && pc.vandaag.kliks < 15 && kwaliteitOk && bod < MD_MAX_BOD() && !vandaag.bod['md' + c.id] && new Date().getUTCHours() >= 9) { upd.bid = r4(Math.min(MD_MAX_BOD(), bod < 0.02 ? bod + 0.005 : bod * 1.25)); vandaag.bod['md' + c.id] = 1; B('bod omhoog (Mondiad)', String(c.id), `maar ${pc.vandaag.kliks} kliks vandaag; $${bod} -> $${upd.bid}`); }
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
    if (!droog) await kv.set(K.zwart('md'), [...zwart]);
    var mdSamen = { saldo, zwarteLijst: zwart.size, nieuwZwart, gemDoorklik: r4(gem), campagnes: Object.values(per).map(pc => ({ id: pc.c.id, naam: pc.c.name, status: pc.c.status, bod: pc.c.bid, soort: pc.c.bidType, kliks7d: pc.kliks, kosten7d: r4(pc.kosten), kliksVandaag: pc.vandaag.kliks, kostenVandaag: r4(pc.vandaag.kosten), eigen: campTel[String(pc.c.id)] || {} })) };
  } catch (e) { mdFout = String(e.message || e).slice(0, 200); B('fout', 'Mondiad', mdFout); }
  if (!droog) { await kv.set(K.crmap, crmap); await kv.set(K.dag(DAY()), vandaag, { ex: 3 * 86400 }); }
  const samen = { at: new Date().toISOString(), droog: !!droog, catalogus: { producten: cat.items.length, ververst: cat.at ? new Date(cat.at).toISOString() : null, terugval: !!cat.terugval }, top: vastRang.slice(0, 12).map(r => ({ id: r.id, titel: (perId[r.id] || {}).t, prijs: (perId[r.id] || {}).p, getoond: r.n, doorkliks: r.k, thema: r.thema })), advertenties: ads.filter(a => !a.uit).length, mondiad: mdSamen || { fout: mdFout }, besluiten };
  if (!droog) { await kv.set(K.laatste, samen); for (const b of besluiten) await log(b); }
  return samen;
}
const findFile = o => { let hit = ''; const walk = x => { if (hit || x == null) return; if (typeof x === 'string') { if (/\.(png|jpe?g|webp|gif)$/i.test(x) && !/^https?:/i.test(x)) hit = x; return; } if (typeof x === 'object') for (const k of Object.keys(x)) walk(x[k]); }; walk(o); return hit; };

// ---------------- landingspagina ----------------
async function land(req, res, url) {
  const q = url.searchParams; const ua = req.headers['user-agent'] || ''; const bot = isBot(ua);
  const src = String(q.get('utm_source') || '').toLowerCase(); const net = /mondiad/.test(src) ? 'md' : /propeller/.test(src) ? 'pa' : 'x';
  let clickid = String(q.get('clickid') || '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 120); if (/^(subid|clickid|visitor_id)$/i.test(clickid)) clickid = '';
  const zone = digits(q.get('zoneid')), cr = digits(q.get('creativeid')), camp = digits(q.get('campaignid'));
  const cat = await catalog(); const perId = {}; cat.items.forEach(i => { perId[i.id] = i; });
  let top = null; try { top = await kv.get(K.top); } catch (e) {} const topIds = (top && top.ids && top.ids.length ? top.ids : seed.ads.map(a => a.pid)).filter(id => perId[id]);
  let pid = pidOk(q.get('p')); if (pid && !perId[pid]) pid = '';
  if (!pid && cr && net !== 'x') { try { const m = (await kv.get(K.crmap)) || {}; if (perId[m[net + ':' + cr]]) pid = m[net + ':' + cr]; } catch (e) {} }
  if (!pid) pid = topIds[0] || cat.items[0].id;
  const held = perId[pid]; const thema = (top && top.thema && top.thema[pid]) || themaVan(held);
  const zelfde = topIds.filter(id => id !== pid && ((top && top.thema && top.thema[id]) || themaVan(perId[id])) === thema).slice(0, 3);
  const meer = [...zelfde, ...topIds.filter(id => id !== pid && !zelfde.includes(id))].slice(0, 8).map(id => perId[id]);
  const code = clickid && net !== 'x' ? shortId(net + ':' + clickid) : '';
  if (!bot) {
    let nieuw = true; if (code) { try { nieuw = !(await kv.get(K.rec(code))); if (nieuw) await kv.set(K.rec(code), { c: clickid, s: net, z: zone, a: cr, k: camp, p: pid, at: Date.now() }, { ex: 4 * 86400 }); } catch (e) {} }
    if (nieuw) { const keys = ['sh-' + net + '-view', 'sh-d' + D8() + '-' + net + '-view', 'sh-p-' + pk(pid) + '-himp'].concat(meer.map(m => 'sh-p-' + pk(m.id) + '-imp'));
      if (zone) keys.push('sh-' + net + '-z' + zone + '-view'); if (cr) keys.push('sh-' + net + '-a' + cr + '-view'); if (camp) keys.push('sh-' + net + '-k' + camp + '-view');
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
<ul class="zeker"><li>14 dagen retourneren: niet tevreden, geld terug</li><li>Veilig betalen via PayPal</li><li>Verzonden vanuit Europa, met track &amp; trace</li></ul>
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
  if (mens && !bot) { const keys = ['sh-' + net + '-klik', 'sh-d' + D8() + '-' + net + '-klik']; if (it) keys.push('sh-p-' + pk(it.id) + (pos === 'h' || pos === 'logo' ? '-hklik' : '-klik'));
    if (rec && !rec.kl) { if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-klik'); if (rec.a) keys.push('sh-' + net + '-a' + rec.a + '-klik'); if (rec.k) keys.push('sh-' + net + '-k' + rec.k + '-klik'); rec.kl = Date.now(); }
    if (rec && rec.c && !rec.conv && PB[net]) { let st = 0; try { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 2500); const r = await fetch(PB[net].replace('{clickid}', encodeURIComponent(rec.c)), { signal: ctl.signal }); clearTimeout(tm); st = r.status; } catch (e) {} rec.conv = Date.now(); rec.pb = st; keys.push('sh-' + net + '-conv', 'sh-d' + D8() + '-' + net + '-conv', 'sh-' + net + '-pb' + (st || 0)); if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-conv'); }
    await inc(keys); if (rec) { try { await kv.set(K.rec(code), rec, { ex: 4 * 86400 }); } catch (e) {} } }
  const utm = 'utm_source=' + (net === 'md' ? 'mondiad' : net === 'pa' ? 'propellerads' : 'shoplus') + '&utm_medium=push&utm_campaign=shoplus' + (it ? '&utm_content=' + encodeURIComponent(pk(it.id)) : '') + (code ? '&hj=' + code : '');
  res.statusCode = 302; res.setHeader('location', (it ? SHOP + '/product/' + encodeURIComponent(it.id) : SHOP) + '?' + utm); res.setHeader('cache-control', 'no-store'); return res.end();
}

async function baken(req, res) {
  let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
  const code = String(b.c || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); const e = b.e === 'mens' ? 'mens' : b.e === 'eng' ? 'eng' : '';
  if (!e || isBot(req.headers['user-agent'])) return res.status(204).end();
  if (!code) { await inc(['sh-x-' + e, 'sh-d' + D8() + '-x-' + e]); return res.status(204).end(); }
  let rec = null; try { rec = await kv.get(K.rec(code)); } catch (x) {} const veld = e === 'mens' ? 'm' : 'e'; if (!rec || rec[veld]) return res.status(204).end();
  rec[veld] = 1; const net = rec.s; const keys = ['sh-' + net + '-' + e, 'sh-d' + D8() + '-' + net + '-' + e]; if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-' + e); if (rec.a) keys.push('sh-' + net + '-a' + rec.a + '-' + e); if (rec.k) keys.push('sh-' + net + '-k' + rec.k + '-' + e);
  await inc(keys); try { await kv.set(K.rec(code), rec, { ex: 4 * 86400 }); } catch (x) {}
  return res.status(204).end();
}

// Pixel voor de shop: <img src="https://keuzehulp.best/api/shop/px?c={hj}&w=cart|koop"> met de hj-waarde uit de landings-URL.
async function pixel(req, res, url) {
  const code = String(url.searchParams.get('c') || '').replace(/[^a-z0-9]/gi, '').slice(0, 14); const w = url.searchParams.get('w') === 'koop' ? 'koop' : 'cart';
  if (code) { try { const rec = await kv.get(K.rec(code)); if (rec && !rec['x' + w]) { rec['x' + w] = Date.now(); const net = rec.s; const keys = ['sh-' + net + '-' + w, 'sh-d' + D8() + '-' + net + '-' + w]; if (rec.z) keys.push('sh-' + net + '-z' + rec.z + '-' + w); if (rec.a) keys.push('sh-' + net + '-a' + rec.a + '-' + w); if (rec.k) keys.push('sh-' + net + '-k' + rec.k + '-' + w); if (rec.p) keys.push('sh-p-' + pk(rec.p) + '-' + w); await inc(keys); await kv.set(K.rec(code), rec, { ex: 30 * 86400 }); if (w === 'koop') await log({ soort: 'bestelling', wat: 'via ' + (net === 'md' ? 'Mondiad' : net === 'pa' ? 'PropellerAds' : 'eigen verkeer'), waarom: 'plek ' + (rec.z || '?') + ', advertentie ' + (rec.a || '?') }); } } catch (e) {} }
  res.setHeader('content-type', 'image/gif'); res.setHeader('cache-control', 'no-store'); return res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
}

// ---------------- advertentiebeeld ----------------
// De productfoto zelf, op maat gesneden als JPEG (klein bestand, ook als de bron webp of png is). icon = 192x192, md = 720x360 (Mondiad), pa = 492x328 (PropellerAds).
const MATEN = { icon: [192, 192, 'cover'], md: [720, 360, 'contain'], pa: [492, 328, 'contain'] };
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
async function voorPa() {
  const cat = await catalog(); const perId = {}; cat.items.forEach(i => { perId[i.id] = i; }); const ads = await advertenties(); let top = null; try { top = await kv.get(K.top); } catch (e) {}
  const volg = (top && top.ids) || seed.ads.map(a => a.pid);
  const zones = await tellers('pa', 'z', await smembers(K.set('z', 'pa'))), cr = await tellers('pa', 'a', await smembers(K.set('a', 'pa'))), camp = await tellers('pa', 'k', await smembers(K.set('k', 'pa')));
  return { at: new Date().toISOString(), naam: NAAM, land: LAND() + '/shop', vandaag: (await dagTotaal(DAY())).pa,
    ads: ads.filter(a => perId[a.pid] && !!perId[a.pid].img).map(a => ({ pid: a.pid, title: a.title, desc: a.desc, uit: a.uit || null, rang: volg.indexOf(a.pid), thema: themaVan(perId[a.pid]), icon: beeld(a.pid, 'icon'), image: beeld(a.pid, 'pa') })),
    zones, creatives: cr, campagnes: camp, staat: (await kv.get('hjdk:shop:pastaat:' + DAY())) || {} };
}

// ---------------- statuspagina ----------------
const nlTijd = iso => { try { return new Date(iso).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } };
const STATUS_NL = { RUNNING: 'loopt', PENDING: 'wacht op goedkeuring', PAUSED: 'stil', FINISHED: 'budget op', DAILY_LIMIT_REACHED: 'dagbudget op', REJECTED: 'afgekeurd', NO_ACTIVE_CREATIVES: 'geen advertentie actief', OFF_ACCOUNT_BUDGET: 'saldo op', OFF_SCHEDULE: 'buiten de uren', WAITING_START_DATE: 'start later', DRAFT: 'concept' };
async function statusPagina() {
  const laatste = (await kv.get(K.laatste)) || null; const palog = ((await kv.get(K.palog)) || []); const logl = ((await kv.get(K.log)) || []).slice(0, 60); const d = await dagTotaal(DAY()), g = await dagTotaal(DAY(-1));
  const pa = palog[0] || null; const usd = v => '$' + num(v).toFixed(2).replace('.', ',');
  const som = (o, s) => num(o.md[s]) + num(o.pa[s]) + num(o.x[s]);
  const kaart = (t, v, sub) => `<div class="k"><div class="kt">${esc(t)}</div><div class="kv">${v}</div>${sub ? `<div class="ks">${sub}</div>` : ''}</div>`;
  const netRij = (naam, o, kosten) => `<tr><td>${naam}</td><td class="n">${o.view}</td><td class="n">${o.mens}</td><td class="n">${o.eng}</td><td class="n">${o.klik}</td><td class="n">${o.koop}</td><td class="n">${kosten == null ? '?' : usd(kosten)}</td><td class="n">${kosten != null && o.klik ? usd(kosten / o.klik) : '-'}</td></tr>`;
  const mdC = (laatste && laatste.mondiad && laatste.mondiad.campagnes) || []; const paC = (pa && pa.campagnes) || [];
  const mdKosten = mdC.reduce((a, c) => a + num(c.kostenVandaag), 0), paKosten = paC.reduce((a, c) => a + num(c.kostenVandaag), 0);
  const cRij = (net, c) => `<tr><td>${net}</td><td>${esc(String(c.naam || '').replace(NAAM, '').replace(/^[\s|·-]+/, '').slice(0, 44))}</td><td>${esc(STATUS_NL[String(c.status).toUpperCase()] || String(c.status).toLowerCase())}</td><td class="n">$${num(c.bod).toFixed(3).replace('.', ',')}</td><td class="n">${num(c.kliksVandaag)}</td><td class="n">${usd(c.kostenVandaag)}</td><td class="n">${num((c.eigen || {}).klik)}</td></tr>`;
  const besl = [...logl.map(b => Object.assign({ net: '' }, b)), ...palog.slice(0, 12).flatMap(l => (l.besluiten || []).map(b => Object.assign({ at: l.at }, b)))].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 40).map(b => `<li><span class="t">${esc(nlTijd(b.at))}</span> <b>${esc(b.soort)}</b>: ${esc(String(b.wat || '').slice(0, 90))}${b.waarom ? ' — ' + esc(String(b.waarom).slice(0, 170)) : ''}</li>`).join('');
  const topRij = ((laatste && laatste.top) || []).map(t => `<tr><td><a href="${SHOP}/product/${esc(t.id)}">${esc(String(t.titel || t.id).slice(0, 58))}</a></td><td class="n">${esc(eur(t.prijs))}</td><td class="n">${t.getoond}</td><td class="n">${t.doorkliks}</td></tr>`).join('');
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Shop-campagnes: hoe staat het?</title>
<style>${look(ACC)}.wrap{max-width:60rem}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.k{background:var(--bg-2);border:1px solid var(--line);border-radius:12px;padding:12px 14px}.kt{font-size:.875rem;color:var(--ink-3)}.kv{font-size:1.75rem;font-weight:750}.ks{font-size:.875rem;color:var(--ink-3)}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px}table{border-collapse:collapse;width:100%;font-size:.9375rem}th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);white-space:nowrap}th{color:var(--ink-3);font-weight:650}td.n,th.n{text-align:right}ul.b{padding-left:18px}ul.b li{margin:0 0 8px}.t{color:var(--ink-3);font-size:.8125rem}h1{font-size:1.75rem}</style></head><body><main class="wrap">
<h1>Shop-campagnes: hoe staat het?</h1><p class="meta">Bijgewerkt ${esc(nlTijd(new Date().toISOString()))} (Nederlandse tijd). De lus leert elk uur tussen 07 en 23 uur. Laatste ronde: ${laatste ? esc(nlTijd(laatste.at)) : 'nog niet gedraaid'}${pa ? ' · PropellerAds: ' + esc(nlTijd(pa.at)) : ' · PropellerAds: nog niet gedraaid'}.</p>
<h2>Vandaag</h2><div class="g">${kaart('Bezoekers', som(d, 'view'), 'gisteren ' + som(g, 'view'))}${kaart('Echte mensen', som(d, 'mens'), 'bewogen of tikten')}${kaart('Door naar de shop', som(d, 'klik'), 'gisteren ' + som(g, 'klik'))}${kaart('Bestellingen', som(d, 'koop'), 'telt zodra de shop het doorgeeft')}${kaart('Kosten', usd(mdKosten + paKosten), 'Mondiad ' + usd(mdKosten) + ' · PropellerAds ' + usd(paKosten))}${kaart('Mondiad-saldo', laatste && laatste.mondiad && laatste.mondiad.saldo != null ? usd(laatste.mondiad.saldo) : '?', pa && pa.saldo != null ? 'PropellerAds ' + usd(pa.saldo) : '')}</div>
<h2>Per netwerk (vandaag)</h2><div class="tw"><table><tr><th>Netwerk</th><th class="n">Bezoekers</th><th class="n">Echte mensen</th><th class="n">Bleven 15 sec</th><th class="n">Naar de shop</th><th class="n">Bestellingen</th><th class="n">Kosten</th><th class="n">Per doorklik</th></tr>${netRij('Mondiad', d.md, mdKosten)}${netRij('PropellerAds', d.pa, paKosten)}${netRij('Overig', d.x, 0)}</table></div>
<h2>Campagnes</h2><div class="tw"><table><tr><th>Netwerk</th><th>Campagne</th><th>Status</th><th class="n">Bod</th><th class="n">Kliks vandaag</th><th class="n">Kosten vandaag</th><th class="n">Naar de shop (totaal)</th></tr>${mdC.map(c => cRij('Mondiad', c)).join('') + paC.map(c => cRij('PropellerAds', c)).join('') || '<tr><td colspan="7">Nog geen campagnes gevonden</td></tr>'}</table></div>
<h2>Producten die nu vooraan staan</h2><div class="tw"><table><tr><th>Product</th><th class="n">Prijs</th><th class="n">Getoond</th><th class="n">Doorkliks</th></tr>${topRij || '<tr><td colspan="4">Nog geen gegevens</td></tr>'}</table></div>
<h2>Wat de lus besloot</h2><ul class="b">${besl || '<li>Nog niets.</li>'}</ul>
<p class="note">Uitgesloten advertentieplekken: Mondiad ${laatste && laatste.mondiad ? num(laatste.mondiad.zwarteLijst) : 0}, PropellerAds ${pa ? num(pa.zwarteLijst) : 0}. Advertenties in de bibliotheek: ${laatste ? num(laatste.advertenties) : 0}. Catalogus: ${laatste ? num(laatste.catalogus.producten) + ' producten' + (laatste.catalogus.terugval ? ' (startset; de shop was niet bereikbaar)' : '') : '?'}.</p></main></body></html>`;
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
    if (op === 'voorpa') return res.status(200).json(Object.assign({ ok: true }, await voorPa()));
    if (op === 'ronde') {
      const droog = !!url.searchParams.get('droog');
      if (!droog) { const lk = await kv.get(K.lock); if (lk && Date.now() - lk < 240000) return res.status(200).json({ ok: true, overgeslagen: 'ronde loopt al' }); await kv.set(K.lock, Date.now(), { ex: 300 }); }
      try { return res.status(200).json(Object.assign({ ok: true }, await ronde(droog))); }
      catch (e) { await log({ soort: 'fout', wat: 'ronde', waarom: String(e.message).slice(0, 200) }); return res.status(200).json({ ok: false, fout: String(e.message) }); }
      finally { if (!droog) { try { await kv.set(K.lock, 0, { ex: 5 }); } catch (e) {} } }
    }
    if (op === 'palog' || op === 'catalogus' || op === 'adweg') { // schrijven: alleen met de gedeelde sleutel
      let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      const s = await geheim(); const k = String(req.headers['x-shop-sleutel'] || b.k || ''); if (!s || k !== s) return res.status(401).json({ ok: false, fout: 'sleutel' });
      if (op === 'catalogus') { const items = (Array.isArray(b.items) ? b.items : []).map(compact).filter(i => pidOk(i.id) && i.t && i.p > 0); if (items.length < 10) return res.status(400).json({ ok: false, fout: 'te weinig producten' }); await bewaarCatalogus(items, 'aangeleverd'); return res.status(200).json({ ok: true, producten: items.length }); }
      if (op === 'adweg') { const ads = await advertenties(); let n = 0; for (const a of ads) if (!a.uit && a.title === String(b.title || '')) { a.uit = String(b.waarom || 'handmatig uitgezet'); n++; } if (n) await kv.set(K.ads, ads); return res.status(200).json({ ok: true, uitgezet: n }); }
      const l = (await kv.get(K.palog)) || []; const e = b.log || {}; l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set(K.palog, l.slice(0, 120));
      if (b.staat && typeof b.staat === 'object') await kv.set('hjdk:shop:pastaat:' + DAY(), b.staat, { ex: 3 * 86400 });
      if (b.map && typeof b.map === 'object') { const m = (await kv.get(K.crmap)) || {}; for (const [id, v] of Object.entries(b.map)) { if (/^\d+$/.test(id) && v && pidOk(v.pid)) { m['pa:' + id] = v.pid; m['t:pa:' + id] = String(v.title || '').slice(0, 60); } } await kv.set(K.crmap, m); }
      return res.status(200).json({ ok: true });
    }
    // status: alleen met de geheime link (?k=...). Eenmalig aanmaken met ?maak=1 zolang er nog geen is.
    let sk = process.env.SHOP_STATUS_KEY || await kv.get(K.statuskey);
    if (!sk && url.searchParams.get('maak')) { sk = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 8); await kv.set(K.statuskey, sk); return res.status(200).json({ ok: true, link: LAND() + '/api/shop/status?k=' + sk }); }
    if (!sk || url.searchParams.get('k') !== sk) { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(403).send('<p style="font:16px system-ui;padding:24px">Deze pagina is privé.</p>'); }
    if (url.searchParams.get('json')) return res.status(200).json({ ok: true, laatste: await kv.get(K.laatste), pa: ((await kv.get(K.palog)) || []).slice(0, 5), logboek: ((await kv.get(K.log)) || []).slice(0, 80), vandaag: await dagTotaal(DAY()) });
    res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(await statusPagina());
  } catch (e) { return res.status(200).json({ ok: false, fout: String(e && e.message || e) }); }
}
