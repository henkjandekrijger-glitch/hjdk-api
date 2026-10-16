// Clickmind: klikregister en mensmeter.
// MENSMETER (Henkjan 14 okt 2026): één gedeelde meting voor ALLE advertentienetwerken (propeller, mondiad, richads, mgid, clickadu).
// Per advertentieklik: zit er een echt mens achter? Tellen per zone en per campagne, en patronen (botfarms) vinden.
//   /mm.js              browserscript voor landingspagina's (api/mm.js); stuurt twee beacons ("a" na 1,5 s, "b" bij weggaan of na 15 s)
//   /api/mm/b           ontvanger: browsersignalen + serversignalen -> score 0-100 (score() hieronder) -> tellers in Redis
//   /go?u=<amazon-url>  doorverwijzer voor Amazon-verkeer (een advertentie heeft maar één link): meet op serversignalen, dan 302
//   /api/mm/zones       per zone: bezoeken, mensen, datacenter, headless ... en een oordeel (zelfde vorm als rereview /api/b/zones)
//   /api/mm/patronen    vingerafdrukken die in veel zones of netwerken opduiken (botfarms)
//   /api/mm/stand       samenvatting van vandaag per netwerk
// Score: begin 50, de regels in score(), begrensd 0-100. "Mens" = 60 of hoger EN in de browser gemeten (alleen serversignalen = nooit mens).
// Oordeel per zone: mensregels tellen alleen bezoeken die de browser echt heeft gemeten (js); /go-kliks tellen mee voor datacenter en bots.
// Opslag (alles met vervaltijd): mm:v:<vid> bezoek (3 d), mm:z:<dag> en mm:c:<dag> tellers "<net>|<zone of campagne>|<veld>" (40 d),
//   mm:fp:<dag>:<net>|<zone> en mm:ip:... unieke apparaten en IP's (HyperLogLog, 40 d), mm:fpz:<fp> zones per vingerafdruk (30 d),
//   mm:fphot:<dag> drukste vingerafdrukken (8 d), mm:fpzc:<dag> bezoeken per vingerafdruk per zone (8 d), mm:dc datacenterlijst (24 u), mm:log laatste 200.
// IP's alleen gehasht (sha256 met zout MM_ZOUT) plus het ingekorte netwerkdeel (/24 of /48), nooit het volledige adres.
// KLIKREGISTER (/go, Henkjan 14 okt 2026: "leg zo veel mogelijk vast waar we patronen mee kunnen vinden"):
//   elke klik krijgt een klik-id (cid) en een persoons-id (pid, eigen cookie mmp, 180 dagen). Beide blijven in ons eigen register: Amazon krijgt
//   alleen tag en ascsubtag per zone (Associates §2(b) verbiedt een sub-tag per bezoeker) en ziet onze site als herkomst (§6(v): niet verhullen).
//   mm:raw:<dag> elke klik en elke browsermeting als JSON-regel (45 d, hooguit RAW_MAX per dag), mm:p:<pid> en mm:pl:<pid> wat
//   die persoon eerder klikte (180 d), mm:arm:<dag> tellers per campagne, variant (js-meetpagina of 302) en tag (45 d),
//   mm:armp:<dag>:<camp>|<arm> unieke personen en mm:armfp:... unieke apparaten (HyperLogLog, 45 d).
import { createHash, randomBytes } from 'node:crypto';

const T = { bezoek: 3 * 86400, dag: 40 * 86400, fpz: 30 * 86400, hot: 8 * 86400, dc: 86400, raw: 45 * 86400, persoon: 180 * 86400 };
export const RAW_MAX = 80000;
// Herkomst van een bezoek (Henkjan 14 okt: "zoveel mogelijk de sites waar verkeer vandaan komt"): de app (Android WebView geeft het
// pakket in x-requested-with) of de site (referrer, behalve onze eigen domeinen). Pushmeldingen hebben geen site: dan "push/onbekend".
const EIGEN_HOST = /(^|\.)(whichtobuy\.best|keuzehulp\.best|kaufberater\.best|todayin\.email|moonlighter\.email|yoo\.rs|praisy\.me|mylevel\.today|outname\.now|finds\.email|nexy\.help|vercel\.app|localhost)$/i;
export function bronVan(xrw, ref) {
  const x = String(xrw || '').trim();
  if (/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(x)) return 'app:' + x.toLowerCase().slice(0, 60);
  let h = String(ref || '').trim(); try { if (/^https?:/i.test(h)) h = new URL(h).hostname; } catch (e) { h = ''; }
  h = h.toLowerCase().replace(/^www\./, '').replace(/[^a-z0-9.-]/g, '').slice(0, 60);
  if (h && h.includes('.') && !EIGEN_HOST.test(h)) return 'site:' + h;
  return 'onbekend';
}
export const VLAGGEN = ['mens', 'dc', 'hl', 'em', 'tz', 'int', 'vis3', 'fpn', 'rep', 'ow0'];
const VELDEN = ['n', 'js', 'go'].concat(VLAGGEN);
const ZOUT = () => process.env.MM_ZOUT || 'mensmeter-hjdk-zout-2026';
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
export const dag = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
export const nieuwVid = () => randomBytes(8).toString('hex');
export const ipHash = ip => (ip ? createHash('sha256').update(ZOUT() + '|' + ip).digest('hex').slice(0, 16) : '');

// ---- namen schoonmaken ----
const NET = { propeller: 'propeller', propellerads: 'propeller', propads: 'propeller', pa: 'propeller', mondiad: 'mondiad', md: 'mondiad', richads: 'richads', rich: 'richads', mgid: 'mgid', clickadu: 'clickadu' };
export function netNaam(x) { const s = String(x || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 30); return NET[s] || s || 'onbekend'; }
// zone/campagne: niet-ingevulde macro's ({zoneid}, [zoneid], ${SUBID}) tellen als '-'
export function schoon(x, max = 64) { const s = String(x == null ? '' : x).trim(); if (!s || /[{}\[\]$]/.test(s)) return '-'; return s.replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, max) || '-'; }

// ---- Amazon-doel voor /go: alleen https Amazon, nooit een open redirect ----
const AMZ = /^(www\.)?amazon\.(com|de|co\.uk|ca|com\.au|fr|it|es|nl)$/;
export function amazonDoel(u) {
  if (!u || typeof u !== 'string' || u.length > 2048) return null;
  let x; try { x = new URL(u); } catch (e) { return null; }
  if (x.protocol !== 'https:' || x.username || x.password || (x.port && x.port !== '443')) return null;
  const h = x.hostname.toLowerCase();
  return AMZ.test(h) || h === 'amzn.to' ? x.href : null;
}

// ---- tijdzone: minuten oost van UTC voor een IANA-naam (null als onbekend) ----
export function tzOffset(tz, at = new Date()) {
  try {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(at);
    const g = t => Number((p.find(x => x.type === t) || {}).value);
    const lokaal = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), g('second'));
    const o = Math.round((lokaal - Math.floor(at.getTime() / 1000) * 1000) / 60000);
    return Number.isFinite(o) ? o : null;
  } catch (e) { return null; }
}

// ---- de score ----
const BOT_UA = /\b(googlebot|bingbot|yandexbot|baiduspider|duckduckbot|applebot|ahrefsbot|semrushbot|mj12bot|petalbot|bytespider|gptbot|claudebot|facebookexternalhit)\b|\bbot\b|[a-z]bot\/\d|crawler|spider|slurp|curl\/|wget\/|python|aiohttp|axios\/|node-fetch|undici|go-http-client|java\/|okhttp|scrapy|httpclient|libwww|headlesschrome|phantomjs|puppeteer|playwright|selenium|lighthouse/i;
const HEADLESS = /HeadlessChrome|PhantomJS|Puppeteer|Playwright|jsdom/i;
const EMU = /SwiftShader|llvmpipe|softpipe|Mesa OffScreen|OpenGL ES Translator|Android Emulator|VirtualBox|VMware SVGA/i;
const MOBIEL = /Mobi|Android|iPhone|iPad|iPod/i;

// signalen = { c: browsergegevens van mm.js (of null bij /go), s: serversignalen { ua, al, chua, chm, tz, dc (true/false/null), relay } }
// -> { score, mens, redenen: [...], vlag: { mens, dc, hl, em, tz, int, vis3 } }
export function score(signalen) {
  const c = signalen && signalen.c, s = (signalen && signalen.s) || {};
  let p = 50, nul = false; const r = [];
  const plus = (d, why) => { p += d; r.push((d > 0 ? '+' : '') + d + ' ' + why); };
  const zero = why => { nul = true; r.push('0: ' + why); };
  const vlag = { mens: 0, dc: 0, hl: 0, em: 0, tz: 0, int: 0, vis3: 0, ow0: 0 };
  const ua = String(s.ua || '');
  // serversignalen
  if (!ua) { zero('geen user-agent'); vlag.hl = 1; }
  else if (BOT_UA.test(ua)) { zero('bot of headless in user-agent'); vlag.hl = 1; }
  if (!s.al) plus(-20, 'geen accept-language');
  const cv = Number((ua.match(/Chrome\/(\d+)/) || [])[1] || 0);
  if (cv >= 100 && !/; wv\)|CriOS|EdgiOS/.test(ua) && !s.chua) plus(-15, 'Chrome zonder client hints');
  if (s.chm === '?0' || s.chm === '?1') { const m = MOBIEL.test(ua); if ((s.chm === '?1') !== m) plus(-15, 'mobiel volgens user-agent klopt niet met client hints'); }
  if (s.relay) r.push('Apple Private Relay (geen datacenter)');
  // browsersignalen
  if (c) {
    const cua = String(c.ua || ''), glr = String(c.glr || '') + ' ' + String(c.glv || '');
    if (c.wd === 1 || c.wd === true) { zero('navigator.webdriver'); vlag.hl = 1; }
    if (HEADLESS.test(cua)) { zero('headless in browser-user-agent'); vlag.hl = 1; }
    if (EMU.test(glr)) { zero('emulator of softwarerenderer: ' + String(c.glr || c.glv).slice(0, 60)); vlag.em = 1; }
    if (N(c.np) === 1) { plus(-30, 'meldingen-toestemming tegenstrijdig (headless)'); vlag.hl = 1; }
    if (cua && ua && cua !== ua) plus(-20, 'user-agent in browser verschilt van verzoek');
    if (N(c.lg0) === 1) plus(-15, 'geen talen');
    if (N(c.ncr) === 1) plus(-15, 'Chrome zonder window.chrome');
    const mob = (c.uad && N(c.uad.m) === 1) || MOBIEL.test(cua || ua);
    if (N(c.ow0) === 1) vlag.ow0 = 1; // per zone geteld; 15 okt: 1,2% van de 0x0-bezoeken was een mens, tegen 13,6% zonder 0x0 (/api/mm/venster)
    if (N(c.ow0) === 1 && !mob) plus(-20, 'venster 0x0'); // Android Chrome meldt 0x0 vaak bij een net geopend tabblad (gemeten 14 okt): daar geen minpunt
    if (!mob && /Chrome|Firefox/.test(cua) && c.pl === 0) plus(-10, 'desktopbrowser zonder plugins');
    if (mob && !(N(c.mtp) > 0)) plus(-20, 'mobiel zonder touch');
    if (s.tz && c.tzo != null && c.tz !== s.tz) {
      const ipo = tzOffset(s.tz);
      if (ipo != null && ipo !== -N(c.tzo)) { plus(-25, 'tijdzone browser (' + String(c.tz || -N(c.tzo) / 60).slice(0, 40) + ') klopt niet met IP (' + s.tz + ')'); vlag.tz = 1; }
    }
    // gedrag
    const int = N(c.nt) > 0 || N(c.nk) > 0 || N(c.nw) > 0 || N(c.mm) >= 3;
    const ruis = N(c.mo) >= 5 && N(c.mov) > 0.001;
    if (N(c.vis) >= 3000) { plus(15, 'ruim 3 s zichtbaar'); vlag.vis3 = 1; }
    if (int) { plus(20, 'echte aanraking, scroll of toets'); vlag.int = 1; }
    if (int && N(c.sp) >= 10) plus(10, 'spreiding in aanrakingen (' + N(c.sp) + ' px)');
    if (ruis) plus(10, 'bewegingssensor met ruis');
    else if (N(c.mo) >= 20 && N(c.mov) === 0 && !int) plus(-15, 'bewegingssensor zonder ruis');
    if (N(c.nu) > 0 && !int) plus(-30, 'alleen nagemaakte events (isTrusted=false)');
    if (c.t1 != null && N(c.t1) < 100 && int) plus(-10, 'interactie binnen 100 ms');
    if (!int && !ruis) plus(-10, 'geen gedragsbewijs');
  } else {
    if (p > 50) p = 50;
    r.push('alleen serversignalen: zonder browsermeting nooit "mens"');
  }
  let sc = nul ? 0 : Math.max(0, Math.min(100, Math.round(p)));
  if (!c) sc = Math.min(sc, 50);
  if (s.dc === true) { sc = Math.min(sc, 10); vlag.dc = 1; r.push('datacenter-IP (max 10)'); }
  else if (s.dc == null) r.push('dc onbekend');
  vlag.mens = c && sc >= 60 ? 1 : 0;
  return { score: sc, mens: !!vlag.mens, redenen: r, vlag };
}

// ---- oordeel per zone (zelfde woorden als rereview: zwart / verdacht / wit / onbekend) ----
export function oordeel(z) {
  const v = N(z.v), js = N(z.js), mens = N(z.mens), pct = js ? mens / js * 100 : null;
  const p = x => Math.round(x * 10) / 10;
  if (mens >= 1 && pct >= 20) return { oordeel: 'wit', waarom: mens + ' van ' + js + ' gemeten bezoeken echt mens (' + p(pct) + '%)' };
  if (js >= 15 && mens === 0) return { oordeel: 'zwart', waarom: 'geen enkel mens in ' + js + ' gemeten bezoeken' };
  if (js >= 40 && pct < 5) return { oordeel: 'zwart', waarom: 'maar ' + p(pct) + '% mens in ' + js + ' gemeten bezoeken' };
  // Venster 0x0 (geen echt venster: verborgen of voorgeladen tabblad). Gemeten 15 okt over 9.658 bezoeken: bij 0x0 1,2% mens, zonder 13,6%;
  // alle 9 zones met een meerderheid 0x0 hadden 0 mensen. Meerderheid 0x0 en minder dan 5% mens = nep.
  if (js >= 15 && N(z.ow0) / js > 0.5 && pct < 5) return { oordeel: 'zwart', waarom: p(N(z.ow0) / js * 100) + '% van ' + js + ' gemeten bezoeken had geen echt venster (0x0), maar ' + p(pct) + '% mens' };
  if (v >= 15 && N(z.dc) / v > 0.5) return { oordeel: 'zwart', waarom: p(N(z.dc) / v * 100) + '% datacenter-IP in ' + v + ' bezoeken' };
  if (v >= 10 && N(z.rep) / v >= 0.5) return { oordeel: 'verdacht', waarom: p(N(z.rep) / v * 100) + '% van ' + v + ' kliks is dezelfde persoon die binnen 10 minuten opnieuw klikt' };
  if (N(z.fpn) >= 30 && N(z.fpUniek) / N(z.fpn) < 0.2) return { oordeel: 'verdacht', waarom: N(z.fpn) + ' bezoeken van maar ' + N(z.fpUniek) + ' apparaten (emulatorfarm?)' };
  if (v >= 5 && (N(z.hl) + N(z.em)) / v > 0.3) return { oordeel: 'verdacht', waarom: p((N(z.hl) + N(z.em)) / v * 100) + '% headless of emulator' };
  if (!js && v) return { oordeel: 'onbekend', waarom: 'alleen /go-kliks: zonder browsermeting geen mensoordeel' };
  return { oordeel: 'onbekend', waarom: js < 15 ? 'nog te weinig gemeten bezoek (' + js + ')' : 'gemengd: ' + p(pct) + '% mens' };
}

// ---- datacenterlijst (X4BNet), 24 uur in Redis en in het geheugen; binary search ----
const DC_URL = process.env.MM_DC_URL || 'https://raw.githubusercontent.com/X4BNet/lists_vpn/main/output/datacenter/ipv4.txt';
const RELAY = [['172.224.0.0', 12]]; // Apple iCloud Private Relay (Akamai): echte iPhone-gebruikers, staat wel in de lijst
const DC = { r: null, at: 0, n: 0, bron: '', fout: '', laden: null, volgende: 0 };
export function ipInt(ip) {
  const m = /^(?:::ffff:)?(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i.exec(String(ip || '').trim()); if (!m) return null;
  const a = m.slice(1, 5).map(Number); if (a.some(x => x > 255)) return null;
  return ((a[0] * 256 + a[1]) * 256 + a[2]) * 256 + a[3];
}
export function cidrNaarRanges(text) {
  const p = [];
  for (const l of String(text || '').split('\n')) {
    const m = /^\s*(\d+\.\d+\.\d+\.\d+)(?:\/(\d+))?\s*$/.exec(l); if (!m) continue;
    const x = ipInt(m[1]), n = m[2] == null ? 32 : Number(m[2]); if (x == null || n > 32) continue;
    const size = 2 ** (32 - n), s = Math.floor(x / size) * size; p.push([s, s + size - 1]);
  }
  p.sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of p) { const k = out.length; if (k && s <= out[k - 1] + 1) { if (e > out[k - 1]) out[k - 1] = e; } else out.push(s, e); }
  return Uint32Array.from(out);
}
export function inRanges(r, x) {
  let lo = 0, hi = r.length / 2 - 1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (r[2 * m] > x) hi = m - 1; else if (r[2 * m + 1] < x) lo = m + 1; else return true; }
  return false;
}
const RELAY_R = cidrNaarRanges(RELAY.map(x => x.join('/')).join('\n'));
function zetDc(r, at, bron) { DC.r = r; DC.n = r.length / 2; DC.at = at; DC.bron = bron; }
const enc = r => Buffer.from(r.buffer, r.byteOffset, r.byteLength).toString('base64');
const dec = b => { const buf = Buffer.from(String(b), 'base64'); const ab = new ArrayBuffer(buf.length - (buf.length % 4)); new Uint8Array(ab).set(buf.subarray(0, ab.byteLength)); return new Uint32Array(ab); };
export function zetDcVoorTest(text) { zetDc(cidrNaarRanges(text), Date.now(), 'test'); }
// dc: true/false, of null als onbekend (lijst niet geladen of geen IPv4)
export function dcCheck(ip) {
  const x = ipInt(ip); if (x == null) return { dc: null, relay: false };
  if (inRanges(RELAY_R, x)) return { dc: false, relay: true };
  if (!DC.r || !DC.n) return { dc: null, relay: false };
  return { dc: inRanges(DC.r, x), relay: false };
}
export function dcStand() { return { geladen: DC.n > 0, ranges: DC.n, bijgewerkt: DC.at ? new Date(DC.at).toISOString() : null, bron: DC.bron || null, fout: DC.fout || null }; }
export async function laadDc(kv) {
  if (DC.r && DC.n && Date.now() - DC.at < 864e5) return DC;
  if (Date.now() < DC.volgende) return DC;
  if (!DC.laden) DC.laden = laadDcEcht(kv).catch(() => DC).finally(() => { DC.laden = null; });
  return DC.laden;
}
async function laadDcEcht(kv) {
  try { const o = await kv.get('mm:dc'); if (o && o.b && Date.now() - N(o.at) < 864e5) { const r = dec(o.b); if (r.length > 2) { zetDc(r, N(o.at), 'redis'); return DC; } } } catch (e) {}
  let mag = true; try { mag = String(await kv.raw(['SET', 'mm:dc:slot', '1', 'NX', 'EX', '30'])) === 'OK'; } catch (e) {}
  if (!mag) { DC.volgende = Date.now() + 15000; return DC; } // een andere functie haalt hem al op
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 3000);
  try {
    const res = await fetch(DC_URL, { signal: ac.signal }); if (!res.ok) throw new Error('HTTP ' + res.status);
    const r = cidrNaarRanges(await res.text()); if (r.length < 2000) throw new Error('lijst te kort (' + r.length / 2 + ' ranges)');
    zetDc(r, Date.now(), 'github'); DC.fout = '';
    try { await kv.set('mm:dc', { at: DC.at, n: DC.n, b: enc(r) }, { ex: T.dc }); } catch (e) {}
  } catch (e) {
    DC.fout = String(e && e.name === 'AbortError' ? 'time-out (3 s)' : (e && e.message) || e).slice(0, 120); DC.volgende = Date.now() + 600000;
    if (!DC.r) { DC.r = new Uint32Array(0); DC.n = 0; }
  } finally { clearTimeout(t); }
  return DC;
}

// ---- opslag ----
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };
// Bezoek bijwerken, atomair (Lua): eerste beacon telt n; latere beacon geeft per vlag het verschil (HINCRBY-correctie).
// Een late "a" na een "b" wordt genegeerd (rang 1 < 2).
const LUA = `local k=KEYS[1] local r=tonumber(ARGV[2]) local e=redis.call('HSETNX',k,'r',0) local o=tonumber(redis.call('HGET',k,'r'))
if e==0 and r<o then return {0,1} end
redis.call('HSET',k,'r',r,'s',ARGV[3]) local u={e,0}
for i=4,#ARGV,2 do local f=ARGV[i] local v=tonumber(ARGV[i+1]) local w=tonumber(redis.call('HGET',k,f) or '0') if v~=w then redis.call('HSET',k,f,v) end u[#u+1]=v-w end
redis.call('EXPIRE',k,tonumber(ARGV[1])) return u`;
let LUA_UIT = false;
async function bezoekBijwerken(kv, k, rang, vlag, sc) {
  if (!LUA_UIT) {
    try {
      const args = ['EVAL', LUA, '1', k, T.bezoek, rang, sc]; for (const v of VLAGGEN) args.push(v, vlag[v] ? 1 : 0);
      const u = (await kv.raw(args)).map(Number);
      if (u[1] === 1) return { overslaan: true };
      const diff = {}; VLAGGEN.forEach((v, i) => { diff[v] = u[2 + i] || 0; });
      return { eerste: u[0] === 1, diff };
    } catch (e) { if (/unknown command|not allowed|NOSCRIPT|disabled|ERR.*(eval|script)/i.test(String(e && e.message))) LUA_UIT = true; else throw e; }
  }
  // zonder Lua: lezen en schrijven (kleine kans op dubbel tellen als a en b tegelijk binnenkomen)
  const h = Object.fromEntries(paren(await kv.raw(['HGETALL', k])));
  const eerste = h.r === undefined;
  if (!eerste && rang < N(h.r)) return { overslaan: true };
  const diff = {}, set = ['HSET', k, 'r', rang, 's', sc];
  for (const v of VLAGGEN) { const n = vlag[v] ? 1 : 0; diff[v] = n - N(h[v]); set.push(v, n); }
  await Promise.all([kv.raw(set), kv.raw(['EXPIRE', k, T.bezoek])]);
  return { eerste, diff };
}
// b = { soort: 'js'|'go', bezoek: true (beacon) | false (/go), vid, rang, net, zone, camp, fp, iph, vlag, score, log }
export async function bewaar(kv, b) {
  const D = dag(), nz = b.net + '|' + b.zone, nc = b.net + '|' + b.camp;
  let eerste = true, diff = b.vlag;
  if (b.bezoek) { const r = await bezoekBijwerken(kv, 'mm:v:' + b.vid, b.rang, b.vlag, b.score); if (r.overslaan) return { overgeslagen: true }; eerste = r.eerste; diff = r.diff; }
  const cmd = [], zk = 'mm:z:' + D, ck = 'mm:c:' + D, metCamp = b.camp && b.camp !== '-';
  const tel = (veld, n) => { if (!n) return; cmd.push(['HINCRBY', zk, nz + '|' + veld, n]); if (metCamp) cmd.push(['HINCRBY', ck, nc + '|' + veld, n]); };
  if (eerste && !b.geenN) { tel('n', 1); tel(b.soort === 'go' ? 'go' : 'js', 1); }
  for (const v of VLAGGEN) tel(v, N(diff[v]));
  if (b.bron && b.zone && b.zone !== '-') { const bk = 'mm:bron:' + D, pre = nz + '|' + b.bron + '|'; if (eerste && !b.geenN) cmd.push(['HINCRBY', bk, pre + 'n', 1]); if (N(diff && diff.mens)) cmd.push(['HINCRBY', bk, pre + 'm', N(diff.mens)]); cmd.push(['EXPIRE', bk, T.dag]); }
  if (cmd.length) { cmd.push(['EXPIRE', zk, T.dag]); if (metCamp) cmd.push(['EXPIRE', ck, T.dag]); }
  if (eerste && b.iph) { const k = 'mm:ip:' + D + ':' + nz; cmd.push(['PFADD', k, b.iph], ['EXPIRE', k, T.dag]); }
  if (b.fp && N(diff.fpn) === 1) {
    const k = 'mm:fp:' + D + ':' + nz, z = 'mm:fpz:' + b.fp, hot = 'mm:fphot:' + D, zc = 'mm:fpzc:' + D;
    cmd.push(['PFADD', k, b.fp], ['EXPIRE', k, T.dag], ['SADD', z, nz], ['EXPIRE', z, T.fpz], ['ZINCRBY', hot, 1, b.fp], ['EXPIRE', hot, T.hot], ['HINCRBY', zc, b.fp + '|' + nz, 1], ['EXPIRE', zc, T.hot]);
  }
  if (b.log) cmd.push(['LPUSH', 'mm:log', JSON.stringify(b.log)], ['LTRIM', 'mm:log', 0, 199], ['EXPIRE', 'mm:log', T.bezoek]);
  await Promise.all(cmd.map(c => kv.raw(c)));
  return { eerste, diff };
}

// beacon van mm.js of van de /go-meetpagina verwerken. c = JSON uit de browser, srv = serversignalen van hetzelfde verzoek
export async function verwerkBeacon(kv, c, srv) {
  const vid = String((c && c.vid) || ''); if (!/^[0-9a-f]{8,24}$/.test(vid)) return null;
  const via = c.via === 'go' ? 'go' : 'js';
  if (via === 'go' && !DC.n) laterAf(laadDc(kv).catch(() => {})); else await laadDc(kv).catch(() => {});
  const d = dcVan(srv), s = Object.assign({}, srv, d);
  const uit = score({ c, s });
  const vlag = Object.assign({}, uit.vlag);
  const fp = /^[0-9a-f]{16}$/.test(String(c.fp || '')) ? String(c.fp) : '';
  vlag.fpn = fp ? 1 : 0;
  const net = netNaam(c.net), zone = schoon(c.zone), camp = schoon(c.camp);
  const log = { t: new Date().toISOString(), soort: via, f: c.f === 'b' ? 'b' : 'a', net, zone, camp, score: uit.score, mens: 0, land: srv.land || '', redenen: uit.redenen.slice(0, 6) };
  if (via === 'go') {
    // /go-meetpagina: 150 ms is te kort voor een mensoordeel (mens blijft 0, telt niet als js-bezoek); datacenter telde de klik al
    vlag.mens = 0; vlag.dc = 0; vlag.int = 0; vlag.vis3 = 0;
    const r = await bewaar(kv, { soort: 'gob', geenN: true, bezoek: true, vid, rang: 1, net, zone, camp, fp, iph: ipHash(srv.ip), vlag, score: uit.score, log });
    if (r.overgeslagen) return Object.assign({ vid, net, zone, camp }, uit, { opgeslagen: r });
    const arm = schoon(c.arm, 8), tag = schoon(c.tag, 40), pid = /^[0-9a-f]{16}$/.test(String(c.pid || '')) ? String(c.pid) : '';
    const D = dag(), ak = 'mm:arm:' + D, pre = net + '|' + camp + '|' + arm + '|' + tag + '|', cmd = [];
    const tel = (veld, n = 1) => cmd.push(['HINCRBY', ak, pre + veld, n]);
    if (r.eerste) { tel('js'); for (const v of ['hl', 'em', 'tz']) if (vlag[v]) tel(v); if (N(c.wd) === 1) tel('wd'); }
    if (fp) { const k = 'mm:armfp:' + D + ':' + net + '|' + camp + '|' + arm; cmd.push(['PFADD', k, fp], ['EXPIRE', k, T.raw]); }
    cmd.push(['EXPIRE', ak, T.raw]);
    const ip = ipInfo(srv.ip);
    const rij = { ty: 'b', t: Date.now(), cid: vid, pid, net, camp, zone, arm, tag, score: uit.score, redenen: uit.redenen, vlag,
      ip: { v: ip.v, net: ip.net, h: ip.h, asn: srv.asn || '', dc: d.dc, dcVia: d.via, relay: d.relay }, land: srv.land || '', ja4: srv.ja4 || '', c: knip(c) };
    await Promise.all(cmd.map(x => kv.raw(x))).catch(() => {});
    await rawBij(kv, D, rij);
    return Object.assign({ vid, net, zone, camp }, uit, { opgeslagen: r });
  }
  vlag.mens = uit.vlag.mens; log.mens = vlag.mens;
  const bron = bronVan(srv.xrw, c.ref);
  const r = await bewaar(kv, { soort: via, bezoek: true, vid, rang: c.f === 'b' ? 2 : 1, net, zone, camp, fp, iph: ipHash(srv.ip), vlag, score: uit.score, log, bron });
  // ALLE data (Henkjan 14 okt): elk paginabezoek ook als ruwe regel, compact (zonder de volledige koppen), 30 dagen. Export: /api/mm/export?soort=pagina
  if (r && !r.overgeslagen) { try { const D = dag(), ip = ipInfo(srv.ip), k = 'mm:rawp:' + D; const n = N(await kv.raw(['RPUSH', k, JSON.stringify({ ty: 'p', t: Date.now(), vid, f: c.f === 'b' ? 'b' : 'a', net, zone, camp, sub: schoon(c.sub, 80), cr: schoon(c.cr), pg: String(c.pg || '').slice(0, 120), ref: String(c.ref || '').slice(0, 80), bron, score: uit.score, mens: vlag.mens ? 1 : 0, redenen: uit.redenen.slice(0, 6), vlag, fp, land: srv.land || '', regio: srv.regio || '', stad: srv.stad || '', tz: srv.tz || '', asn: srv.asn || '', dc: d.dc === true, ipnet: ip.net, iph: ip.h, ua: String(srv.ua || '').slice(0, 220), xrw: srv.xrw || '', ja4: srv.ja4 || '', al: String(srv.al || '').slice(0, 60), c: knip(c) })])); if (n === 1 || n % 500 === 0) await kv.raw(['EXPIRE', k, 30 * 86400]); if (n > RAW_MAX) await kv.raw(['LTRIM', k, 0, RAW_MAX - 1]); } catch (e) {} }
  if (r && r.eerste && zone !== '-') await Promise.all(kenmerkCmd(net, zone, srv).map(x => kv.raw(x))).catch(() => {});
  return Object.assign({ vid, net, zone, camp }, uit, { opgeslagen: r });
}


// ---- kenmerken per zone voor de leerronde (besturingssysteem, uur bij de bezoeker, app, terugkomer) ----
export function osVan(ua) { ua = String(ua || ''); if (/Android/.test(ua)) return 'android'; if (/iPhone|iPad|iPod/.test(ua)) return 'ios'; if (/Windows/.test(ua)) return 'windows'; if (/Mac OS X|Macintosh/.test(ua)) return 'mac'; if (/CrOS|Linux/.test(ua)) return 'linux'; return 'ander'; }
export function uurBlok(tz, at = new Date()) {
  let u = at.getUTCHours(); try { if (tz) u = Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(at)) % 24; } catch (e) {}
  return u < 6 ? 'nacht' : u < 12 ? 'ochtend' : u < 18 ? 'middag' : 'avond';
}
function kenmerkCmd(net, zone, srv, extra = {}) {
  const k = 'mm:zf:' + dag(), pre = net + '|' + zone + '|', ua = String(srv.ua || '');
  const c = [['HINCRBY', k, pre + 'os_' + osVan(ua), 1], ['HINCRBY', k, pre + 'uur_' + uurBlok(srv.tz), 1]];
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) c.push(['HINCRBY', k, pre + 'mob', 1]);
  if (srv.xrw || /FBAN|FBAV|FB_IAB|Instagram|Line\/|; wv\)|GSA\/|Snapchat|musical_ly|TikTok|Pinterest|Twitter/i.test(ua)) c.push(['HINCRBY', k, pre + 'inapp', 1]);
  if (extra.terug) c.push(['HINCRBY', k, pre + 'terug', 1]);
  c.push(['EXPIRE', k, T.dag]); return c;
}
// ================= KLIKREGISTER (/go) =================
// Datacenter via het netwerk (ASN, van Vercel) naast de IP-lijst. Bewust niet: Cloudflare 13335 (WARP-gebruikers) en Apple Private Relay.
const DC_ASN = new Set([14618, 16509, 8987, 15169, 396982, 19527, 8075, 14061, 16276, 35540, 24940, 213230, 63949, 20473, 9009, 60068, 212238, 31898, 45102, 37963, 132203, 45090, 51167, 60781, 28753, 12876, 200019, 47583, 136907, 55990, 135377, 202425, 209605, 53667, 62240, 40021, 395954, 174, 3223, 46562, 32613, 22612, 397423, 7979, 36352, 54290, 30633, 25369, 29802, 49505, 216071, 39572, 42831, 50673, 34971, 211252, 64425, 14956, 398324, 19318, 23033, 11878, 393406, 400304]);
export function dcVan(srv) {
  const d = dcCheck(srv.ip); const asn = Number(srv.asn) || 0;
  if (!d.relay && d.dc !== true && asn && DC_ASN.has(asn)) return { dc: true, relay: false, via: 'asn' };
  return Object.assign({ via: d.dc === true ? 'lijst' : '' }, d);
}

// Vercel laat de functie na het antwoord doorwerken als waitUntil beschikbaar is (zelfde haak als @vercel/functions)
export function laterAf(p) { try { const ctx = globalThis[Symbol.for('@vercel/request-context')]; const w = ctx && ctx.get && ctx.get(); if (w && typeof w.waitUntil === 'function') w.waitUntil(p); } catch (e) {} return p; }
export const nieuwId = (bytes = 8) => randomBytes(bytes).toString('hex');
// browserdata inkorten: hooguit 8 kB, geen geneste rommel
function knip(c) { try { const s = JSON.stringify(c); if (s.length <= 8000) return c; return { te_groot: s.length, ua: String(c.ua || '').slice(0, 300), fp: c.fp }; } catch (e) { return {}; } }
// IP: versie, netwerkdeel (/24 bij IPv4, /48 bij IPv6) en een gezouten hash. Nooit het volledige adres.
export function ipInfo(ip) {
  ip = String(ip || '').trim().replace(/^::ffff:/i, '');
  if (!ip) return { v: 0, net: '', h: '' };
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/.exec(ip);
  if (m) return { v: 4, net: m[1] + '.' + m[2] + '.' + m[3] + '.0/24', h: ipHash(ip) };
  if (ip.includes(':')) {
    let g = ip.split('::'), a = g[0] ? g[0].split(':') : [], b = g.length > 1 && g[1] ? g[1].split(':') : [];
    const vol = a.concat(Array(Math.max(0, 8 - a.length - b.length)).fill('0'), b).slice(0, 8);
    return { v: 6, net: vol.slice(0, 3).map(x => (x || '0').toLowerCase()).join(':') + '::/48', h: ipHash(ip) };
  }
  return { v: 0, net: '', h: ipHash(ip) };
}
// Alles wat de server per verzoek gratis ziet. Nooit: cookies, autorisatie, IP-adressen in koppen, Vercel-geheimen.
const GEHEIM = /^(cookie|authorization|proxy-authorization|forwarded|x-forwarded-for|x-real-ip|x-client-ip|cf-connecting-ip|true-client-ip|x-vercel-forwarded-for|x-vercel-proxied-for|x-vercel-oidc-token|x-vercel-proxy-signature.*|x-vercel-sc-.*|x-vercel-internal.*|x-vercel-deployment-url|x-vercel-protection-bypass|x-vercel-set-bypass-cookie|x-middleware-.*)$/i;
export function serverSignalen(req) {
  const h = req.headers || {}; const one = k => String(Array.isArray(h[k]) ? h[k][0] : (h[k] || ''));
  let stad = one('x-vercel-ip-city'); try { stad = decodeURIComponent(stad); } catch (e) {}
  const kop = {}; let n = 0;
  for (const [k, v] of Object.entries(h)) { if (GEHEIM.test(k) || n >= 45) continue; kop[k] = String(Array.isArray(v) ? v.join(',') : v).slice(0, 300); n++; }
  const raw = Array.isArray(req.rawHeaders) ? req.rawHeaders : [];
  const volgorde = []; for (let i = 0; i < raw.length; i += 2) volgorde.push(String(raw[i]).toLowerCase());
  return {
    ip: (one('x-forwarded-for') || one('x-real-ip')).split(',')[0].trim(), land: one('x-vercel-ip-country'), regio: one('x-vercel-ip-country-region'), stad,
    tz: one('x-vercel-ip-timezone'), ua: one('user-agent'), chua: one('sec-ch-ua'), chm: one('sec-ch-ua-mobile'), chp: one('sec-ch-ua-platform'),
    al: one('accept-language'), ja4: one('x-vercel-ja4-digest'), asn: one('x-vercel-ip-as-number'), xrw: one('x-requested-with'), ref: one('referer'), edge: one('x-vercel-id').split('::')[0],
    kop, volgorde: volgorde.filter(k => !GEHEIM.test(k)).join(',').slice(0, 900)
  };
}
// Amazon-doel bouwen: zoekterm (k), ASIN (a) of een volledige Amazon-URL (u). Tag en ascsubtag worden altijd door ons gezet.
const MARKT = { com: 'www.amazon.com', de: 'www.amazon.de', 'co.uk': 'www.amazon.co.uk', uk: 'www.amazon.co.uk', ca: 'www.amazon.ca', fr: 'www.amazon.fr', it: 'www.amazon.it', es: 'www.amazon.es', nl: 'www.amazon.nl', 'com.au': 'www.amazon.com.au', au: 'www.amazon.com.au' };
export const tagOk = t => /^[a-z0-9][a-z0-9-]{1,48}-2[0-2]$/i.test(String(t || ''));
// Tags die op campagnes staan maar NIET in Associates bestaan (gecontroleerd 15 okt 2026 op Manage Your Tracking IDs en het
// 30-dagenrapport): kliks daarop leveren niets op. Via /go en /w gaan ze naar een geregistreerde, ongebruikte tag.
export const TAG_ALIAS = { 'bl-mh13-20': 'bl-lr01-20', 'bl-ls13-20': 'bl-lr02-20', 'bl-gh13-20': 'bl-lr03-20', 'bl-af13-20': 'bl-lr04-20', 'bl-fd13-20': 'bl-lr05-20', 'bl-lm13-20': 'bl-lr06-20', 'bl-sc13-20': 'bl-lr07-20', 'bl-hw13-20': 'bl-lr08-20' };
export const echteTag = t => TAG_ALIAS[String(t || '').toLowerCase()] || t;
export function amazonBouw({ k, a, u, m, tag, sub }) {
  const host = MARKT[String(m || 'com').toLowerCase()]; tag = echteTag(tag); if (!host || !tagOk(tag)) return null;
  sub = String(sub || '').replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 64);
  const zet = x => { x.searchParams.set('tag', tag); if (sub) x.searchParams.set('ascsubtag', sub); return x.href; };
  if (k) { const kw = String(k).trim().slice(0, 150); if (!kw) return null; const x = new URL('https://' + host + '/s'); x.searchParams.set('k', kw); return zet(x); }
  if (a) { const asin = String(a).toUpperCase(); if (!/^[A-Z0-9]{10}$/.test(asin)) return null; return zet(new URL('https://' + host + '/dp/' + asin)); }
  if (u) { const d = amazonDoel(u); if (!d) return null; const x = new URL(d); if (x.hostname === 'amzn.to') return d; return zet(x); }
  return null;
}
// variant per persoon, vast: dezelfde persoon krijgt altijd dezelfde variant. split = % naar de 302-variant.
export function armVoor(pid, split) {
  const p = Math.max(0, Math.min(100, Math.round(N(split)))); if (!p) return 'js'; if (p >= 100) return '302';
  const h = createHash('sha256').update('arm|' + pid).digest(); return (h.readUInt16BE(0) % 100) < p ? '302' : 'js';
}
const MOB = /Mobi|Android|iPhone|iPad|iPod/i, INAPP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|; wv\)|GSA\/|Snapchat|musical_ly|TikTok|Pinterest|Twitter/i;
async function rawBij(kv, D, rij) {
  try {
    const k = 'mm:raw:' + D; const n = N(await kv.raw(['RPUSH', k, JSON.stringify(rij)]));
    if (n === 1 || n % 500 === 0) await kv.raw(['EXPIRE', k, T.raw]);
    if (n > RAW_MAX) await kv.raw(['LTRIM', k, 0, RAW_MAX - 1]);
  } catch (e) {}
}
// Eén klik via /go vastleggen. k = { cid, pid, nieuw, arm, tag, net, camp, zone, sub, cr, kw, doel, p }, srv = serverSignalen
export async function verwerkKlik(kv, k, srv) {
  if (!DC.n) laterAf(laadDc(kv).catch(() => {}));
  const d = dcVan(srv), s = Object.assign({}, srv, d);
  const uit = score({ c: null, s }); const vlag = Object.assign({}, uit.vlag, { mens: 0, fpn: 0, rep: 0 });
  const net = netNaam(k.net), zone = schoon(k.zone), camp = schoon(k.camp), arm = k.arm === '302' ? '302' : 'js', tag = schoon(k.tag, 40);
  const ip = ipInfo(srv.ip), t = Date.now(), D = dag();
  // wat deed deze persoon eerder?
  let vorig = null;
  try { const h = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:p:' + k.pid]))); if (h.n) vorig = { n: N(h.n), eerst: N(h.eerst), laatst: N(h.laatst), zone: h.zone || '', camp: h.camp || '', net: h.net || '', arm: h.arm || '' }; } catch (e) {}
  // snelle herhaalklik: dezelfde persoon klikte binnen 10 minuten al eerder (14 okt: 21% van de kliks, vooral 3 zones met 1 persoon die 9-10 keer klikt).
  // Voor Amazon levert zo'n klik niets extra op: het cookie staat al.
  const rep = !!(vorig && t - vorig.laatst < 600000); if (rep) { vlag.rep = 1; uit.redenen.push('herhaalklik binnen 10 min (' + Math.round((t - vorig.laatst) / 1000) + ' s na de vorige)'); }
  const cmd = [], pk = 'mm:p:' + k.pid, pl = 'mm:pl:' + k.pid;
  cmd.push(['HINCRBY', pk, 'n', 1], ['HSETNX', pk, 'eerst', t], ['HSET', pk, 'laatst', t, 'zone', zone, 'camp', camp, 'net', net, 'arm', arm, 'tag', tag], ['EXPIRE', pk, T.persoon]);
  if (/^https:\/\/(www\.)?amazon\.|^https:\/\/amzn\.to\//.test(String(k.doel || ''))) cmd.push(['HSET', pk, 'amzLaatst', t]); // voor de regel amazon24 in de wissel
  cmd.push(['LPUSH', pl, [t, net, camp, zone, schoon(k.cr), arm, tag, String(k.kw || '').slice(0, 60), k.cid].join('|')], ['LTRIM', pl, 0, 99], ['EXPIRE', pl, T.persoon]);
  const ak = 'mm:arm:' + D, pre = net + '|' + camp + '|' + arm + '|' + tag + '|';
  const tel = (veld, n = 1) => cmd.push(['HINCRBY', ak, pre + veld, n]);
  tel('n'); tel(vorig ? 'terug' : 'nieuw'); if (rep) tel('rep');
  if (vlag.hl) tel('bot'); if (d.dc === true) tel('dc'); if (MOB.test(srv.ua)) tel('mob'); if (srv.xrw || INAPP.test(srv.ua)) tel('inapp');
  if (srv.land) tel('land_' + String(srv.land).toLowerCase().replace(/[^a-z]/g, '').slice(0, 2));
  cmd.push(['EXPIRE', ak, T.raw]);
  if (zone !== '-') cmd.push(...kenmerkCmd(net, zone, srv, { terug: !!vorig && !rep }));
  const hp = 'mm:armp:' + D + ':' + net + '|' + camp + '|' + arm; cmd.push(['PFADD', hp, k.pid], ['EXPIRE', hp, T.raw]);
  const rij = { ty: 'go', t, cid: k.cid, pid: k.pid, nieuw: !vorig, rep, vorig, arm, tag, net, camp, zone, sub: schoon(k.sub, 80), cr: schoon(k.cr), kw: String(k.kw || '').slice(0, 150), p: k.p || '',
    doel: String(k.doel || '').slice(0, 400), score: uit.score, redenen: uit.redenen, ip: { v: ip.v, net: ip.net, h: ip.h, asn: srv.asn || '', dc: d.dc, dcVia: d.via, relay: d.relay },
    geo: { land: srv.land, regio: srv.regio, stad: srv.stad, tz: srv.tz }, ja4: srv.ja4, edge: srv.edge, xrw: srv.xrw, ref: srv.ref, kop: srv.kop, volgorde: srv.volgorde };
  await Promise.all([
    Promise.all(cmd.map(x => kv.raw(x))).catch(() => {}),
    bewaar(kv, { soort: 'go', bezoek: false, vid: k.cid, rang: 1, net, zone, camp, fp: '', iph: ip.h, vlag, score: uit.score, bron: bronVan(srv.xrw, srv.ref),
      log: { t: new Date(t).toISOString(), soort: 'go', arm, tag, net, zone, camp, score: uit.score, mens: 0, land: srv.land || '', terug: !!vorig, redenen: uit.redenen.slice(0, 4) } }).catch(() => {}),
    rawBij(kv, D, rij)
  ]);
  return { net, zone, camp, arm, tag, score: uit.score, vorig };
}

// ---- uitlezen ----
const leeg = (netwerk, zone) => { const z = { zone, netwerk }; for (const v of VELDEN) z[v] = 0; return z; };
async function pfTel(kv, keys) {
  try { return N(await kv.raw(['PFCOUNT', ...keys])); }
  catch (e) { let s = 0; for (const k of keys) s += N(await kv.raw(['PFCOUNT', k]).catch(() => 0)); return s; } // multi-key niet toegestaan: per dag optellen
}
const dagLijst = n => Array.from({ length: n }, (_, i) => dag(-i));
const dagenUit = (x, d) => Math.max(1, Math.min(7, Math.round(N(x)) || d));
export async function zones(kv, { net = '', dagen = 3 } = {}) {
  dagen = dagenUit(dagen, 3); const netF = net ? netNaam(net) : '', D = dagLijst(dagen);
  const hs = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:z:' + d]).catch(() => null)));
  const Z = {};
  for (const h of hs) for (const [f, v] of paren(h)) {
    const i = f.lastIndexOf('|'), nz = f.slice(0, i), veld = f.slice(i + 1), j = nz.indexOf('|'); if (i < 0 || j < 0) continue;
    const n = nz.slice(0, j); if (netF && n !== netF) continue;
    const z = Z[nz] || (Z[nz] = leeg(n, nz.slice(j + 1))); z[veld] = N(z[veld]) + N(v);
  }
  const lijst = Object.values(Z);
  await Promise.all(lijst.map(async z => { const nz = z.netwerk + '|' + z.zone; const [a, b] = await Promise.all([pfTel(kv, D.map(d => 'mm:fp:' + d + ':' + nz)), pfTel(kv, D.map(d => 'mm:ip:' + d + ':' + nz))]); z.fpUniek = a; z.ipUniek = b; }));
  const rijen = lijst.map(z => { const o = oordeel(Object.assign({ v: z.n }, z)); return { zone: z.zone, netwerk: z.netwerk, v: z.n, js: z.js, go: z.go, mens: z.mens, dc: z.dc, hl: z.hl, em: z.em, tz: z.tz, int: z.int, vis3: z.vis3, rep: z.rep, fpn: z.fpn, fpUniek: z.fpUniek, ipUniek: z.ipUniek, mensPct: z.js ? Math.round(z.mens / z.js * 1000) / 10 : null, h: z.mens, e: 0, oordeel: o.oordeel, waarom: o.waarom }; })
    .sort((a, b) => b.v - a.v);
  const naam = r => (netF ? r.zone : r.netwerk + '|' + r.zone);
  const aantal = { zwart: 0, verdacht: 0, wit: 0, onbekend: 0 }; rijen.forEach(r => { aantal[r.oordeel]++; });
  return {
    uitleg: 'Mensmeter (mm.js + /go). v = bezoeken, js = in de browser gemeten, go = Amazon-kliks via /go, mens = score 60+ in de browser. wit = minstens 1 mens en 20%+ van de gemeten bezoeken; zwart = 15+ gemeten zonder mens, 40+ gemeten met minder dan 5% mens, of meer dan de helft datacenter (15+ bezoeken); verdacht = 30+ vingerafdrukken van minder dan 20% unieke apparaten, of meer dan 30% headless/emulator; onbekend = te weinig gezien. h = mens (zelfde veld als rereview).',
    bijgewerkt: new Date().toISOString(), dagen, netwerk: netF || 'alle', aantal,
    zwart: rijen.filter(r => r.oordeel === 'zwart').map(naam), wit: rijen.filter(r => r.oordeel === 'wit').map(naam), verdacht: rijen.filter(r => r.oordeel === 'verdacht').map(naam), zones: rijen
  };
}

export async function patronen(kv, { dagen = 1 } = {}) {
  dagen = dagenUit(dagen, 1); const D = dagLijst(dagen);
  const tops = await Promise.all(D.map(d => kv.raw(['ZREVRANGE', 'mm:fphot:' + d, 0, 199, 'WITHSCORES']).catch(() => [])));
  const tel = {}; for (const t of tops) for (let i = 0; i + 1 < (t || []).length; i += 2) tel[t[i]] = N(tel[t[i]]) + N(t[i + 1]);
  const top = Object.entries(tel).sort((a, b) => b[1] - a[1]).slice(0, 50);
  const alleZones = {};
  const rijen = await Promise.all(top.map(async ([fp, n]) => {
    const zs = ((await kv.raw(['SMEMBERS', 'mm:fpz:' + fp]).catch(() => [])) || []).map(String).sort(); alleZones[fp] = zs;
    const nets = [...new Set(zs.map(z => z.split('|')[0]))];
    return { fp, bezoeken: n, zones: zs.length, netwerken: nets, botfarm: n >= 10 && (zs.length >= 3 || nets.length >= 2), voorbeeldZones: zs.slice(0, 20) };
  }));
  const farm = rijen.filter(r => r.botfarm), perZone = {};
  await Promise.all(farm.map(async r => {
    const zs = alleZones[r.fp]; if (!zs.length) return;
    for (const d of D) { const v = await kv.raw(['HMGET', 'mm:fpzc:' + d, ...zs.map(z => r.fp + '|' + z)]).catch(() => []); zs.forEach((z, i) => { const x = N(v && v[i]); if (x) perZone[z] = N(perZone[z]) + x; }); }
  }));
  const zk = Object.keys(perZone), tot = {};
  for (const d of D) { if (!zk.length) break; const v = await kv.raw(['HMGET', 'mm:z:' + d, ...zk.map(z => z + '|n')]).catch(() => []); zk.forEach((z, i) => { tot[z] = N(tot[z]) + N(v && v[i]); }); }
  const zonesUit = zk.map(z => { const [netwerk, zone] = [z.slice(0, z.indexOf('|')), z.slice(z.indexOf('|') + 1)]; return { netwerk, zone, bezoeken: tot[z], botfarmBezoeken: perZone[z], aandeelPct: tot[z] ? Math.round(perZone[z] / tot[z] * 1000) / 10 : null }; })
    .sort((a, b) => b.botfarmBezoeken - a.botfarmBezoeken);
  return { bijgewerkt: new Date().toISOString(), dagen, regel: 'botfarm = een vingerafdruk met 10+ bezoeken in 3+ zones of 2+ netwerken', botfarms: farm.length, vingerafdrukken: rijen, zones: zonesUit };
}

export async function stand(kv) {
  await laadDc(kv).catch(() => {});
  const z = await zones(kv, { dagen: 1 });
  const per = {};
  for (const r of z.zones) { const p = per[r.netwerk] || (per[r.netwerk] = { bezoeken: 0, js: 0, go: 0, mens: 0, dc: 0, hl: 0, em: 0, tz: 0, zones: 0 }); p.zones++; for (const k of ['js', 'go', 'mens', 'dc', 'hl', 'em', 'tz']) p[k] += r[k]; p.bezoeken += r.v; }
  const pct = (a, b) => (b ? Math.round(a / b * 1000) / 10 : null);
  const netwerken = Object.fromEntries(Object.entries(per).map(([n, p]) => [n, { bezoeken: p.bezoeken, gemeten: p.js, viaGo: p.go, zones: p.zones, mensPct: pct(p.mens, p.js), datacenterPct: pct(p.dc, p.bezoeken), headlessPct: pct(p.hl, p.bezoeken), emulatorPct: pct(p.em, p.bezoeken), tijdzonePct: pct(p.tz, p.bezoeken) }]));
  const rang = { zwart: 0, verdacht: 1, onbekend: 2, wit: 3 };
  const slechtste = z.zones.filter(r => r.oordeel !== 'wit').sort((a, b) => rang[a.oordeel] - rang[b.oordeel] || b.v - a.v).slice(0, 10).map(r => ({ netwerk: r.netwerk, zone: r.zone, v: r.v, mensPct: r.mensPct, oordeel: r.oordeel, waarom: r.waarom }));
  let geheugen = null; try { const info = String(await kv.raw(['INFO', 'memory'])); const pick = k => ((info.match(new RegExp('^' + k + ':(.*)$', 'm')) || [])[1] || '').trim(); geheugen = { gebruikt: pick('used_memory_human'), max: pick('maxmemory_human') }; } catch (e) {}
  let laatste = []; try { laatste = ((await kv.raw(['LRANGE', 'mm:log', 0, 9])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return x; } }); } catch (e) {}
  return { bijgewerkt: new Date().toISOString(), dag: dag(), netwerken, oordelen: z.aantal, slechtste, datacenterlijst: dcStand(), geheugen, laatste };
}

// ---- de /go-proef uitlezen: per campagne, variant en tag ----
// n = kliks via /go, nieuw/terug = eerste of herhaalde klik van die persoon, rep = herhaalklik binnen 10 minuten, js = meetpagina gaf een browsermeting,
// bot = bot of headless volgens de server, dc = datacenter-IP, hl/em/tz/wd = headless, emulator, tijdzone klopt niet, webdriver (browser),
// mob = mobiel, inapp = in een app-browser, land_xx = per land, personen/apparaten = unieke pid's en vingerafdrukken.
export async function proef(kv, { dagen = 1, camp = '' } = {}) {
  dagen = dagenUit(dagen, 1); const D = dagLijst(dagen), R = {};
  const hs = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:arm:' + d]).catch(() => null)));
  for (const h of hs) for (const [f, v] of paren(h)) {
    const p = f.split('|'); if (p.length < 5) continue; const [net, c, arm, tag] = p, veld = p.slice(4).join('|');
    if (camp && c !== camp) continue;
    const k = net + '|' + c + '|' + arm + '|' + tag, r = R[k] || (R[k] = { netwerk: net, campagne: c, variant: arm, tag, n: 0, nieuw: 0, terug: 0, rep: 0, js: 0, bot: 0, dc: 0, hl: 0, em: 0, tz: 0, wd: 0, mob: 0, inapp: 0, landen: {} });
    if (veld.startsWith('land_')) r.landen[veld.slice(5)] = N(r.landen[veld.slice(5)]) + N(v); else r[veld] = N(r[veld]) + N(v);
  }
  const pct = (a, b) => (b ? Math.round(a / b * 1000) / 10 : null);
  const rijen = await Promise.all(Object.values(R).map(async r => {
    const k = r.netwerk + '|' + r.campagne + '|' + r.variant;
    r.personen = await pfTel(kv, D.map(d => 'mm:armp:' + d + ':' + k)); r.apparaten = await pfTel(kv, D.map(d => 'mm:armfp:' + d + ':' + k));
    r.pct = { js: r.variant === 'js' ? pct(r.js, r.n) : null, terug: pct(r.terug, r.n), herhaalklik10min: pct(r.rep, r.n), bot: pct(r.bot, r.n), dc: pct(r.dc, r.n), headless: pct(r.hl, r.js), emulator: pct(r.em, r.js), tijdzone: pct(r.tz, r.js), mobiel: pct(r.mob, r.n), inapp: pct(r.inapp, r.n), us: pct(N(r.landen.us), r.n) };
    return r;
  }));
  rijen.sort((a, b) => a.campagne.localeCompare(b.campagne) || a.variant.localeCompare(b.variant));
  return { bijgewerkt: new Date().toISOString(), dagen: D, uitleg: 'Kliks via whichtobuy.best/go per campagne, variant (js = meetpagina van ~150 ms, 302 = directe doorverwijzing) en Amazon-tag. Vergelijk per tag met de Amazon-kliks en bestellingen in Associates (hele dagen).', rijen };
}
// ruwe regels van één dag (alleen via de beschermde vercel.app-host)
export async function exporteer(kv, { d, van = 0, n = 2000, soort = '' } = {}) {
  d = /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) ? d : dag(); van = Math.max(0, Math.round(N(van))); n = Math.max(1, Math.min(5000, Math.round(N(n)) || 2000));
  // sinds 16 okt staat het oudste deel in Vercel Blob (lib/ruwarchief.js); dit leest Blob en Redis als één reeks
  const { leesRuwBereik } = await import('./ruwarchief.js');
  const r = await leesRuwBereik(kv, soort === 'pagina' ? 'rawp' : 'raw', d, van, n), rijen = r.rijen || [];
  return { dag: d, totaal: N(r.totaal), inBlob: N(r.inBlob), van, n: rijen.length, volgende: van + rijen.length < N(r.totaal) ? van + rijen.length : null, rijen: rijen.map(x => { try { return JSON.parse(x); } catch (e) { return x; } }) };
}
export async function persoon(kv, pid) {
  if (!/^[0-9a-f]{16}$/.test(String(pid || ''))) return null;
  const [h, l] = await Promise.all([kv.raw(['HGETALL', 'mm:p:' + pid]), kv.raw(['LRANGE', 'mm:pl:' + pid, 0, 99])]);
  return { pid, stand: Object.fromEntries(paren(h)), kliks: (l || []).map(x => { const [t, net, camp, zone, cr, arm, tag, kw, cid] = String(x).split('|'); return { t: new Date(N(t)).toISOString(), net, camp, zone, cr, arm, tag, kw, cid }; }) };
}
