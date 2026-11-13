// CLICKMIND ZONE SCORE (Henkjan 13 nov 2026, punt 7 van "Clickmind 10x beter": "Ja voer ze alle 7 door"): Clickmind als product.
// Kwaliteitsscore per advertentieplek (zone) voor wie push-, pop- en in-page-verkeer inkoopt. Gratis: één zone tegelijk (oordeel, score,
// banden). Betaald (early access, wachtlijst): de volledige lijsten beste en slechtste zones per netwerk en land.
//   Pagina:     https://whichtobuy.best/zone-score (rewrite naar /api/zonescore?op=pagina; geen /api/-pad, dus geen noindex-kop)
//   Zone-check: GET /api/zonescore?net=propeller&zone=123 (JSON; &vorm=html geeft ook het kaartje voor de pagina)
//   Wachtlijst: POST /api/zonescore?op=wacht {email, nets[], spend} -> mm:zs:wacht (lijst, nieuwste eerst) + melding aan Henkjan (todayin-spel /api/meld)
//   Gedrag:     POST /api/zonescore?op=ev (tijd op de pagina, scroll, kliks) -> mm:zs:tel:<dag>
//   Beschermd (alleen *.vercel.app): ?op=stand (tellers, checks, aantal aanmeldingen), ?op=wachtlijst, ?op=wachtweg&email= (testregel weghalen)
// NOOIT naar buiten: ruwe lijsten, campagne-ID's, uitkomsten van eigen projecten, IP's. Alleen banden, afgeronde aantallen en een oordeel.
// Data: de tellers van de mensmeter (mm:z:<dag>, 7 dagen; lib/mensmeter.js) en het oordeel oordeel() daaruit; betaald tegen aangekomen
// uit de leerronde (mm:leer:laatst, alleen PropellerAds, alleen de laagste 25 zones van vandaag).
import { oordeel, VLAGGEN, netNaam, ipHash, dag } from './mensmeter.js';

// ---- naam en aanbod op één plek ----
export const NAAM = 'Clickmind Zone Score';
export const KORT = 'Zone Score';
export const CANON = 'https://whichtobuy.best/zone-score';
export const PRIJS = { bedrag: 49, munt: 'USD', tekst: '$49 per network per month' };
export const MEET = 'https://meeting.nexy.works/a54blu';
export const WHATSAPP = 'https://wa.me/31655395630';
const DAGEN = 7, LIMIET_UUR = 30, LIMIET_WACHT = 5;

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const NETTEN = { propeller: 'PropellerAds', mondiad: 'Mondiad', richads: 'RichAds', mgid: 'MGID', clickadu: 'Clickadu' };
export const BESTEDING = { lt1k: 'Under $1k', '1k-5k': '$1k to $5k', '5k-20k': '$5k to $20k', '20k-100k': '$20k to $100k', gt100k: 'Over $100k' };
const VELDEN = ['n', 'js', 'go'].concat(VLAGGEN);
const dagLijst = n => Array.from({ length: n }, (_, i) => dag(-i));

// ---- afronden en banden ----
export function rond(n) {
  n = Math.round(N(n)); if (n < 10) return String(n);
  const p = Math.pow(10, Math.max(0, String(n).length - 2)); return (Math.round(n / p) * p).toLocaleString('en-US');
}
const rondOmlaag = n => { n = Math.round(N(n)); if (n < 10) return String(n); const p = Math.pow(10, Math.max(0, String(n).length - 2)); return (Math.floor(n / p) * p).toLocaleString('en-US'); };
const mensBand = h => h == null ? 'not measured yet' : h < 0.05 ? 'under 5%' : h < 0.10 ? '5 to 10%' : h < 0.20 ? '10 to 20%' : h < 0.40 ? '20 to 40%' : h < 0.60 ? '40 to 60%' : 'over 60%';
const niveau = r => r < 0.01 ? 'none' : r < 0.05 ? 'low' : r < 0.20 ? 'medium' : r < 0.50 ? 'high' : 'very high';
const aankomstBand = p => p < 30 ? 'under 30% of paid clicks arrived' : p < 60 ? '30 to 60% of paid clicks arrived' : p < 85 ? '60 to 85% of paid clicks arrived' : 'over 85% of paid clicks arrived';
function wanneer(d) { if (!d) return null; if (d === dag()) return 'today'; if (d === dag(-1)) return 'yesterday'; return d; }

// ---- de tellers van één zone over 7 dagen (alleen deze velden, geen hele hashes) ----
async function pfTel(kv, keys) {
  try { return N(await kv.raw(['PFCOUNT', ...keys])); }
  catch (x) { let s = 0; for (const k of keys) s += N(await kv.raw(['PFCOUNT', k]).catch(() => 0)); return s; }
}
export async function zoneTellers(kv, net, zone) {
  const D = dagLijst(DAGEN), nz = net + '|' + zone, velden = VELDEN.map(v => nz + '|' + v);
  const rs = await Promise.all(D.map(d => kv.raw(['HMGET', 'mm:z:' + d, ...velden]).catch(() => null)));
  const z = {}; for (const v of VELDEN) z[v] = 0; let laatst = null;
  rs.forEach((r, i) => { if (!Array.isArray(r)) return; VELDEN.forEach((v, j) => { z[v] += N(r[j]); }); if (!laatst && N(r[0]) > 0) laatst = D[i]; });
  z.v = z.n;
  if (z.n) { const [a, b] = await Promise.all([pfTel(kv, D.map(d => 'mm:fp:' + d + ':' + nz)), pfTel(kv, D.map(d => 'mm:ip:' + d + ':' + nz))]); z.fpUniek = a; z.ipUniek = b; }
  z.laatst = laatst; return z;
}

// ---- oordeel in gewone woorden, score 0-100 en banden ----
const KLASSE = {
  real_people: { label: 'Real people', min: 60, max: 100, kleur: 'g' },
  mixed: { label: 'Mixed', min: 30, max: 65, kleur: 'o' },
  suspicious: { label: 'Suspicious', min: 10, max: 40, kleur: 'o' },
  bots: { label: 'Bots', min: 0, max: 15, kleur: 'r' },
  not_enough_data: { label: 'Not enough data yet', kleur: '' },
  not_seen: { label: 'Not seen yet', kleur: '' }
};
function waaromTekst(o, z) {
  const w = String(o.waarom || '');
  if (o.oordeel === 'wit') return 'A solid share of the clicks we checked in a real browser came from a real person.';
  if (o.oordeel === 'zwart') {
    if (/datacenter/.test(w)) return 'Most clicks come from datacenter IPs: servers, not phones.';
    if (/geen enkel mens/.test(w)) return 'Not one real person in the visits we checked in a browser.';
    if (/0x0/.test(w)) return 'Most visits had no real browser window and almost no real people.';
    return 'Almost no real people in the visits we checked in a browser.';
  }
  if (o.oordeel === 'verdacht') {
    if (/dezelfde persoon/.test(w)) return 'Most clicks are the same person clicking again within 10 minutes. You pay for each one.';
    if (/apparaten/.test(w)) return 'Many clicks from very few devices. That looks like a device farm.';
    if (/headless|emulator/.test(w)) return 'Many clicks from headless browsers or emulators.';
    return 'Too many signs of automated or repeated clicks.';
  }
  if (/gemengd/.test(w)) return 'Some real people, but a lot of the clicks are not.';
  if (/te weinig gemeten voor wit/.test(w)) return 'Early signs of real people, but we need more clicks to be sure.';
  if (/alleen \/go/.test(w)) return 'We only have server side signals for this zone so far, no browser check yet.';
  return 'We have not seen enough clicks from this zone yet to judge it.';
}
export function beoordeel(z, aankomst) {
  const v = N(z.v), js = N(z.js);
  if (!v) return { verdict: 'not_seen', label: KLASSE.not_seen.label, kleur: '', score: null, why: 'We have not bought traffic from this zone in the last ' + DAGEN + ' days.', bands: null, sample: { clicks: '0', browserChecked: '0', window: 'last ' + DAGEN + ' days' }, lastMeasured: null, confidence: null };
  const o = oordeel(z);
  const h = js >= 10 ? N(z.mens) / js : null, dcR = N(z.dc) / v, botR = (N(z.hl) + N(z.em)) / v, go = N(z.go);
  const repR = go >= 10 ? N(z.rep) / go : null, farm = N(z.fpn) >= 30 ? N(z.fpUniek) / N(z.fpn) : null;
  let k = 'not_enough_data';
  if (o.oordeel === 'wit') k = 'real_people'; else if (o.oordeel === 'zwart') k = 'bots'; else if (o.oordeel === 'verdacht') k = 'suspicious';
  else if (/gemengd/.test(String(o.waarom)) && js >= 15) k = 'mixed';
  let score = null;
  if (KLASSE[k].min != null) {
    const basis = h == null ? 50 : 100 * Math.sqrt(Math.min(h, 0.6) / 0.6);
    let s = basis * (1 - dcR) * (1 - Math.min(1, botR)) * (1 - 0.7 * Math.min(1, N(z.rep) / v)) * (farm != null && farm < 0.5 ? 0.5 + farm : 1);
    score = Math.round(Math.max(KLASSE[k].min, Math.min(KLASSE[k].max, s)));
  }
  const telBasis = js >= 10 ? js : v;
  const bands = {
    realPeople: mensBand(h),
    datacenter: niveau(dcR),
    headlessOrEmulator: niveau(botR),
    repeatClicks: repR == null ? 'not measured' : niveau(repR),
    deviceSpread: farm == null ? 'not measured' : farm < 0.2 ? 'very few devices (farm-like)' : farm < 0.5 ? 'low' : 'normal'
  };
  if (aankomst != null) bands.paidVsArrived = aankomstBand(aankomst);
  return {
    verdict: k, label: KLASSE[k].label, kleur: KLASSE[k].kleur || '', score, why: waaromTekst(o, z), bands,
    sample: { clicks: (v < 10 ? '' : 'about ') + rond(v), browserChecked: (js < 10 ? '' : 'about ') + rond(js), window: 'last ' + DAGEN + ' days' },
    lastMeasured: wanneer(z.laatst), confidence: score == null ? null : telBasis >= 200 ? 'high' : telBasis >= 40 ? 'medium' : 'low'
  };
}
async function aankomstVan(kv, net, zone) {
  if (net !== 'propeller') return null;
  try { const l = await kv.get('mm:leer:laatst'); const a = ((l && l.aankomst && l.aankomst.laagste) || []).find(x => String(x.zone) === zone); return a ? N(a.pct) : null; } catch (x) { return null; }
}

// ---- invoer ----
export function leesInvoer(netIn, zoneIn) {
  const net = netNaam(netIn);
  if (!NETTEN[net]) return { fout: 'Pick a network: ' + Object.values(NETTEN).join(', ') + '.' };
  const zone = String(zoneIn == null ? '' : zoneIn).trim();
  if (!/^[A-Za-z0-9_.:-]{1,40}$/.test(zone) || zone === '-') return { fout: 'Enter a zone ID, for example 10813458.' };
  return { net, zone };
}
// limiet per IP (gehasht, nooit het adres zelf): 30 checks per uur
export async function limiet(kv, ip, soort = 'c', max = LIMIET_UUR) {
  const uur = Math.floor(Date.now() / 3600000), k = 'mm:zs:rl:' + soort + ':' + (ipHash(ip) || 'x') + ':' + uur;
  try { const n = N(await kv.raw(['INCR', k])); if (n === 1) await kv.raw(['EXPIRE', k, 3700]); return { ok: n <= max, over: Math.max(0, max - n), wacht: 3600 - Math.floor(Date.now() / 1000) % 3600 }; }
  catch (x) { return { ok: true, over: null }; }
}
export async function tel(kv, velden) {
  const k = 'mm:zs:tel:' + dag();
  try { await Promise.all(Object.entries(velden).filter(([, n]) => n).map(([f, n]) => kv.raw(['HINCRBY', k, f, n]))); await kv.raw(['EXPIRE', k, 90 * 86400]); } catch (x) {}
}

export async function check(kv, { net, zone, land = '' }) {
  const [z, ak] = await Promise.all([zoneTellers(kv, net, zone), aankomstVan(kv, net, zone)]);
  const b = beoordeel(z, ak);
  const uit = { ok: true, product: NAAM, network: NETTEN[net], networkId: net, zone, ...b, fullLists: { what: 'Best and worst zones per network and country, updated daily, ready to import', price: 'from ' + PRIJS.tekst, earlyAccess: CANON + '#lists' } };
  // wat kopers checken (zonder IP), om te leren welke zones en netwerken ze bezig houden
  try { await kv.raw(['LPUSH', 'mm:zs:checks', JSON.stringify({ t: new Date().toISOString(), net, zone, verdict: b.verdict, land: String(land || '').slice(0, 2) })]); await kv.raw(['LTRIM', 'mm:zs:checks', 0, 1999]); await kv.raw(['EXPIRE', 'mm:zs:checks', 90 * 86400]); } catch (x) {}
  await tel(kv, { check: 1, ['check_' + net]: 1, ['uit_' + b.verdict]: 1 });
  return uit;
}

// ---- bewijs: live cijfers uit de mensmeter, afgerond, 6 uur bewaard ----
let BEWIJS = null;
export async function bewijs(kv) {
  if (BEWIJS && Date.now() - BEWIJS.at < 3600000) return BEWIJS.b;
  try { const c = await kv.get('mm:zs:bewijs'); if (c && c.at && Date.now() - c.at < 6 * 3600000) { BEWIJS = { at: Date.now(), b: c }; return c; } } catch (x) {}
  const D = dagLijst(DAGEN), s = { n: 0, js: 0, mens: 0, go: 0, rep: 0, dc: 0 }, zones = new Set(), nets = new Set();
  for (const d of D) {
    let h = null; try { h = await kv.raw(['HGETALL', 'mm:z:' + d]); } catch (x) {}
    if (!Array.isArray(h)) continue;
    for (let i = 0; i + 1 < h.length; i += 2) {
      const f = String(h[i]), a = f.lastIndexOf('|'), b = f.indexOf('|'); if (a < 0 || b < 0 || a === b) continue;
      const net = f.slice(0, b), veld = f.slice(a + 1), zone = f.slice(b + 1, a); if (!NETTEN[net] || !(veld in s)) continue;
      const n = N(h[i + 1]); s[veld] += n; if (veld === 'n' && n > 0) { nets.add(net); if (zone !== '-') zones.add(net + '|' + zone); }
    }
  }
  const b = { at: Date.now(), dagen: DAGEN, clicks: rondOmlaag(s.n) + '+', zones: rondOmlaag(zones.size) + '+', networks: [...nets].map(n => NETTEN[n]),
    humanPct: s.js ? Math.round(100 * s.mens / s.js) : null, repeatPct: s.go >= 100 ? Math.round(100 * s.rep / s.go) : null, datacenterPct: s.n ? Math.round(100 * s.dc / s.n) : null };
  try { await kv.set('mm:zs:bewijs', b, { ex: 6 * 3600 }); } catch (x) {}
  BEWIJS = { at: Date.now(), b }; return b;
}

// ---- wachtlijst ----
const melden = async tekst => {
  const s = process.env.MELD_SLEUTEL; if (!s) return false;
  try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'Clickmind', tekst: tekst.slice(0, 3400) }), signal: AbortSignal.timeout(10000) }); const j = await r.json().catch(() => ({})); return !!(j && j.ok); } catch (x) { return false; }
};
export async function wacht(kv, b, { land = '', bron = '' } = {}) {
  b = b || {};
  if (String(b.website || '').trim()) return { ok: true }; // honingpot: bots stil laten denken dat het lukte
  const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return { ok: false, fout: 'Enter a valid email address.' };
  const nets = [...new Set((Array.isArray(b.nets) ? b.nets : String(b.nets || '').split(',')).map(x => netNaam(x)).filter(x => NETTEN[x]))];
  if (!nets.length) return { ok: false, fout: 'Pick at least one network.' };
  const spend = BESTEDING[b.spend] ? b.spend : '';
  if (!spend) return { ok: false, fout: 'Pick your monthly spend.' };
  const al = N(await kv.raw(['SISMEMBER', 'mm:zs:wachtmail', email]).catch(() => 0));
  const rij = { t: new Date().toISOString(), email, nets, spend, land: String(land || '').slice(0, 2), bron: String(bron || '').slice(0, 30), zone: b.zone ? String(b.zone).replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 40) : '' };
  await kv.raw(['LPUSH', 'mm:zs:wacht', JSON.stringify(rij)]); await kv.raw(['LTRIM', 'mm:zs:wacht', 0, 9999]); await kv.raw(['SADD', 'mm:zs:wachtmail', email]);
  await tel(kv, { wacht: 1, ['wacht_' + spend]: 1 });
  const gemeld = await melden((al ? 'Zone Score: zelfde adres meldde zich opnieuw' : 'Zone Score: nieuwe aanmelding voor de volledige lijsten') + '\n' + email + '\nNetwerken: ' + nets.map(n => NETTEN[n]).join(', ') + '\nBesteding per maand: ' + BESTEDING[spend] + '\nLand: ' + (rij.land || '?') + (rij.zone ? '\nLaatst gecheckte zone: ' + rij.zone : '') + '\nAanbod op de pagina: ' + PRIJS.tekst + ' (early access). Lijst: https://hjdk-api-henq.vercel.app/api/zonescore?op=wachtlijst');
  return { ok: true, al: !!al, gemeld };
}
export async function wachtlijst(kv) { try { return ((await kv.raw(['LRANGE', 'mm:zs:wacht', 0, 999])) || []).map(x => { try { return JSON.parse(x); } catch (y) { return null; } }).filter(Boolean); } catch (x) { return []; } }
export async function wachtWeg(kv, email) {
  email = String(email || '').trim().toLowerCase(); if (!email) return { ok: false, fout: 'email' };
  const ruw = (await kv.raw(['LRANGE', 'mm:zs:wacht', 0, -1])) || []; let weg = 0;
  for (const x of ruw) { let j = null; try { j = JSON.parse(x); } catch (y) {} if (j && j.email === email) weg += N(await kv.raw(['LREM', 'mm:zs:wacht', 0, x])); }
  await kv.raw(['SREM', 'mm:zs:wachtmail', email]).catch(() => 0);
  return { ok: true, weg };
}

// ---- gedrag op de pagina (geen cookies): tijd zichtbaar, scroll, waarop geklikt ----
const KLIK = new Set(['check', 'lists', 'wacht', 'faq', 'meet', 'wa', 'privacy', 'terms', 'cookies', 'about', 'cta']);
export async function ev(kv, b) {
  b = b || {}; const sec = N(b.sec), sc = N(b.scroll), v = { ev: 1 };
  v['sec_' + (sec < 10 ? '0-10' : sec < 30 ? '10-30' : sec < 60 ? '30-60' : sec < 180 ? '60-180' : '180+')] = 1;
  v['scroll_' + (sc < 25 ? '0-25' : sc < 50 ? '25-50' : sc < 75 ? '50-75' : '75-100')] = 1;
  v.sec_tot = Math.min(1800, Math.round(sec));
  for (const k of (Array.isArray(b.k) ? b.k : []).slice(0, 20)) if (KLIK.has(String(k))) v['klik_' + k] = N(v['klik_' + k]) + 1;
  await tel(kv, v); return { ok: true };
}
export async function stand(kv) {
  const D = dagLijst(14), hs = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:zs:tel:' + d]).catch(() => null)));
  const perDag = {}; hs.forEach((h, i) => { if (!Array.isArray(h) || !h.length) return; const o = {}; for (let j = 0; j + 1 < h.length; j += 2) o[h[j]] = N(h[j + 1]); perDag[D[i]] = o; });
  const [n, checks] = await Promise.all([kv.raw(['LLEN', 'mm:zs:wacht']).catch(() => 0), kv.raw(['LRANGE', 'mm:zs:checks', 0, 29]).catch(() => [])]);
  return { product: NAAM, pagina: CANON, aanmeldingen: N(n), perDag, laatsteChecks: (checks || []).map(x => { try { return JSON.parse(x); } catch (y) { return x; } }), uitleg: 'view = paginaweergave (zonder bots), view_<bron> = herkomst, check = zone-checks, uit_<oordeel>, wacht = aanmeldingen, ev = gedragsmetingen, sec_* = seconden zichtbaar, scroll_* = hoe ver gescrold, klik_* = waarop geklikt, sec_tot = totaal seconden.' };
}
export function bronVanRef(ref) {
  let h = ''; try { h = new URL(String(ref || '')).hostname.toLowerCase(); } catch (x) {}
  if (!h) return 'direct';
  if (/google\./.test(h)) return 'google'; if (/bing\.com|duckduckgo|yahoo\.|ecosia|brave/.test(h)) return 'search';
  if (/chatgpt|openai|perplexity|claude\.ai|copilot|gemini/.test(h)) return 'ai';
  if (/whichtobuy|keuzehulp|kaufberater|vercel\.app/.test(h)) return 'eigen';
  return 'other';
}

// ---- HTML ----
export function kaartHtml(r) {
  if (!r || !r.ok) return '<div class="res"><p>' + e((r && r.fout) || 'Something went wrong. Try again.') + '</p></div>';
  const rij = (a, b) => '<div class="row"><span>' + e(a) + '</span><b>' + e(b) + '</b></div>';
  let h = '<div class="res"><div class="top"><span class="pill ' + e(r.kleur) + '">' + e(r.label) + '</span><span class="zid">' + e(r.network) + ' zone ' + e(r.zone) + '</span></div>';
  if (r.score != null) h += '<p class="score"><b>' + r.score + '</b>/100</p>';
  h += '<p>' + e(r.why) + '</p>';
  if (r.bands) {
    h += '<div class="rows">' + rij('Real people (browser check)', r.bands.realPeople) + rij('Datacenter IPs', r.bands.datacenter) + rij('Headless or emulator', r.bands.headlessOrEmulator)
      + rij('Same person again within 10 min', r.bands.repeatClicks) + rij('Device spread', r.bands.deviceSpread) + (r.bands.paidVsArrived ? rij('Paid vs arrived', r.bands.paidVsArrived) : '')
      + rij('Clicks seen, ' + r.sample.window, r.sample.clicks + (N(String(r.sample.browserChecked).replace(/\D/g, '')) ? ' (' + String(r.sample.browserChecked).replace('about ', '') + ' in a browser)' : ''))
      + rij('Last measured', r.lastMeasured || '-') + (r.confidence ? rij('Confidence', r.confidence) : '') + '</div>';
  }
  h += '<p class="cta">Want every bad and good zone on ' + e(r.network) + ' in one list, updated daily? <a href="#lists" class="btn" data-k="cta">Get the full list</a></p></div>';
  return h;
}

const FAQ = [
  ['How do I know if a push or pop zone is sending bots?', 'Look at what happens after the click, not at the click itself. A real person touches or scrolls, has a normal screen and graphics chip, and a timezone that fits the IP. Bots come from datacenter IPs, run headless browsers or emulators, or never open a real window. Zone Score checks this for every click we buy and adds it up per zone.'],
  ['What is a zone ID and where do I find it?', 'It is the ID of the site or app slot where your ad was shown. Every network shows it in the campaign stats, sometimes called zone, source, site or widget. Put the zone macro of your network in your tracking link and you get it with every click.'],
  ['Why do I pay for the same person more than once?', 'Push and in-page ads keep showing on the same phone. Some people tap two or three times within a few minutes and the network bills every tap. In some zones more than half of all clicks are repeats. If you sell something once, only the first tap is worth money.'],
  ['Should I blacklist every zone that has some bots?', 'No. Almost every zone has some junk. Block the zones that are mostly bots, keep the zones where a solid share are real people, and judge the rest on what you pay per real person. A cheap zone with 25% real people can beat an expensive one with 50%.'],
  ['Which networks and ad formats do you cover?', 'PropellerAds, Mondiad, RichAds, MGID and Clickadu, for push, pop (onclick) and in-page push. We have the most data on PropellerAds. A zone we have not bought in the last 7 days shows as not seen yet.'],
  ['How is this different from click fraud tools like ClickCease?', 'Most click fraud tools protect Google and Meta ads by blocking IPs on your own site. On push and pop networks you cannot block an IP, you can only exclude a zone, and you usually find out after the money is gone. Zone Score tells you which zones to exclude before you start, based on clicks we already paid for.'],
  ['Where does the data come from?', 'From our own campaigns. We buy push and pop traffic every day and check every click on our own landing pages. We never show which campaigns, offers or sites the data came from.']
];

export function pagina({ bew = null, uitslag = null, net = 'propeller', zone = '' } = {}) {
  const titel = 'Zone Score: check push and pop zones for bots | Clickmind';
  const besch = 'Paste a PropellerAds, Mondiad, RichAds, MGID or Clickadu zone ID and see if real people click it, or bots and repeat clickers. Free check.';
  const org = { '@type': 'Organization', '@id': 'https://whichtobuy.best/#adsfair', name: 'AdsFair B.V.', url: CANON, address: { '@type': 'PostalAddress', addressLocality: 'Gouda', addressCountry: 'NL' } };
  const ld = [
    { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: NAAM, url: CANON, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: besch, publisher: org,
      offers: [{ '@type': 'Offer', name: 'Zone check', price: '0', priceCurrency: 'USD' }, { '@type': 'Offer', name: 'Full zone lists, per network per month (early access)', price: String(PRIJS.bedrag), priceCurrency: PRIJS.munt }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ];
  const b = bew || {};
  const bewijsRij = [b.clicks ? [b.clicks, 'ad clicks checked in the last ' + (b.dagen || DAGEN) + ' days'] : null, b.zones ? [b.zones, 'zones scored'] : null,
    b.humanPct != null ? [b.humanPct + '%', 'of browser-checked clicks were a real person'] : null, b.repeatPct != null ? [b.repeatPct + '%', 'of clicks were the same person again within 10 minutes'] : null].filter(Boolean);
  const opt = Object.entries(NETTEN).map(([k, v]) => '<option value="' + k + '"' + (k === net ? ' selected' : '') + '>' + v + '</option>').join('');
  const vink = Object.entries(NETTEN).map(([k, v]) => '<label class="chk"><input type="checkbox" name="nets" value="' + k + '"' + (k === net ? ' checked' : '') + '> ' + v + '</label>').join('');
  const sp = '<option value="">Monthly spend</option>' + Object.entries(BESTEDING).map(([k, v]) => '<option value="' + k + '">' + v + '</option>').join('');
  const modal = (id, kop, tekst) => '<dialog id="m-' + id + '"><form method="dialog"><button class="x" aria-label="Close">×</button></form><h2>' + kop + '</h2>' + tekst + '</dialog>';
  const jaar = new Date().getFullYear();
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + e(titel) + '</title><meta name="description" content="' + e(besch) + '"><meta name="robots" content="index,follow,max-snippet:-1"><link rel="canonical" href="' + CANON + '">'
    + '<meta property="og:type" content="website"><meta property="og:title" content="' + e(KORT + ': is this zone worth your money?') + '"><meta property="og:description" content="' + e(besch) + '"><meta property="og:url" content="' + CANON + '"><meta property="og:site_name" content="' + e(NAAM) + '"><meta name="twitter:card" content="summary">'
    + '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2714%27 fill=%27%232B47C4%27/%3E%3Ccircle cx=%2732%27 cy=%2732%27 r=%2714%27 fill=%27none%27 stroke=%27white%27 stroke-width=%276%27/%3E%3C/svg%3E">'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">'
    + '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>'
    + '<style>:root{--a:#2B47C4;--z:#EEF1FC;--l:#d6dcf2}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#fff;color:#000;font:18px/1.55 Inter,system-ui,-apple-system,sans-serif}'
    + 'main{max-width:760px;margin:0 auto;padding:40px 20px 24px}h1{font-size:44px;line-height:1.1;letter-spacing:-.03em;margin:0 0 16px;font-weight:800}h2{font-size:26px;letter-spacing:-.02em;margin:56px 0 12px;font-weight:800}p{margin:10px 0}'
    + '.lead{font-size:22px}.form{display:flex;gap:10px;flex-wrap:wrap;margin:26px 0 8px}select,input[type=text],input[type=email]{font:inherit;color:#000;border:2px solid #000;border-radius:14px;padding:13px 14px;background:#fff;min-width:0}'
    + '.form select{flex:0 0 auto}.form input{flex:1 1 200px}.btn,button.go{display:inline-block;font:inherit;font-weight:600;background:var(--a);color:#fff;border:0;border-radius:14px;padding:13px 22px;cursor:pointer;text-decoration:none}.btn:hover,button.go:hover{filter:brightness(1.1)}'
    + '.res{border:2px solid #000;border-radius:20px;padding:20px 22px;margin:18px 0}.top{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.zid{font-weight:600}.pill{display:inline-block;border-radius:99px;padding:5px 14px;font-weight:800;background:var(--z)}.pill.g{background:#c9f0d4}.pill.r{background:#ffd0cc}.pill.o{background:#ffe2b0}'
    + '.score{margin:12px 0 0}.score b{font-size:44px;font-weight:800;letter-spacing:-.03em}.rows{margin:14px 0 4px;border-top:1px solid var(--l)}.row{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid var(--l)}.row b{text-align:right}'
    + '.cta{margin-top:16px}.cta .btn{margin-left:4px;padding:9px 16px}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin:28px 0 0}.stats div{background:var(--z);border-radius:18px;padding:16px}.stats b{display:block;font-size:26px;font-weight:800;letter-spacing:-.02em}'
    + 'ul{padding-left:22px}li{margin:6px 0}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:16px;align-items:start}.card{border:2px solid #000;border-radius:20px;padding:20px}.card.a{border-color:var(--a)}.card h3{font-size:22px;margin:0 0 4px}.card .p{font-weight:800}'
    + '.chk{display:inline-flex;gap:6px;align-items:center;border:1.5px solid var(--a);border-radius:99px;padding:6px 12px;margin:4px 6px 4px 0;cursor:pointer}.wf{display:grid;gap:10px;margin-top:14px}.wf .hp{position:absolute;left:-9999px}'
    + 'details{border-bottom:1px solid var(--l);padding:12px 0}summary{font-weight:600;cursor:pointer}.pills a{display:inline-block;border:1.5px solid var(--a);color:var(--a);border-radius:99px;padding:9px 18px;margin:6px 8px 0 0;text-decoration:none;font-weight:600}'
    + 'footer{max-width:760px;margin:40px auto 0;padding:24px 20px 40px;border-top:1px solid var(--l);font-size:16px}footer a,footer button.l{font:inherit;color:#000;text-decoration:none;background:none;border:0;padding:0;cursor:pointer}footer a:hover,footer button.l:hover{text-decoration:underline}footer p{margin:6px 0}'
    + 'dialog{max-width:640px;width:calc(100% - 32px);border:0;border-radius:20px;padding:24px 26px;color:#000}dialog::backdrop{background:rgba(0,0,0,.45)}dialog h2{margin-top:0}.x{float:right;font-size:28px;background:none;border:0;cursor:pointer;color:#000}'
    + '::placeholder{color:#000;opacity:.6}@media(max-width:600px){h1{font-size:34px}.lead{font-size:20px}.form select,.form input,.form .go{flex:1 1 100%;width:100%}.row{flex-direction:column;gap:0}.row b{text-align:left}}</style></head><body><main>'
    + '<h1>Check a zone before you pay for it</h1>'
    + '<p class="lead">Paste a zone ID. We tell you if real people sit behind its clicks, or bots and the same person tapping your ad three times.</p>'
    + '<p>For push, pop and in-page buyers on PropellerAds, Mondiad, RichAds, MGID and Clickadu.</p>'
    + '<form class="form" id="f" action="" method="get"><select name="net" aria-label="Network">' + opt + '</select><input type="text" name="zone" inputmode="text" autocomplete="off" placeholder="Zone ID, e.g. 10813458" aria-label="Zone ID" value="' + e(zone) + '" required><button class="go" type="submit" data-k="check">Check zone</button></form>'
    + '<div id="uit">' + (uitslag ? kaartHtml(uitslag) : '') + '</div>'
    + (bewijsRij.length ? '<div class="stats">' + bewijsRij.map(([a, t]) => '<div><b>' + e(a) + '</b>' + e(t) + '</div>').join('') + '</div>' : '')
    + '<h2>Why this exists</h2><p>We buy push and pop traffic ourselves. When we started checking every click in a real browser, most of it turned out not to be a person: datacenter IPs, headless browsers, emulator farms, and real people tapping the same ad two or three times in a few minutes. The network bills every one of those clicks.</p>'
    + '<p>Search and social ads have click fraud tools. Push and pop buyers mostly get a blacklist from a forum. On these networks you cannot block an IP, only a zone. So we score zones.</p>'
    + '<h2>What we look at</h2><ul><li><b>Real person or not:</b> touch, scroll, screen, graphics chip and timezone against IP, checked in the browser on the landing page.</li><li><b>Datacenter IPs:</b> clicks from servers instead of phones.</li><li><b>Headless browsers and emulators.</b></li><li><b>Repeat clicks:</b> the same person clicking again within 10 minutes.</li><li><b>Device spread:</b> lots of clicks from a handful of devices.</li><li><b>Paid against arrived:</b> clicks the network bills against clicks that actually load the page.</li></ul>'
    + '<p>Each zone gets a verdict (real people, mixed, suspicious, bots or not enough data) and a score from 0 to 100. Higher means more real people for every click you pay for.</p>'
    + '<h2 id="lists">Free check, paid lists</h2><div class="cards"><div class="card"><h3>Zone check</h3><p class="p">Free</p><p>One zone at a time. Verdict, score and the bands behind it. 30 checks an hour.</p></div>'
    + '<div class="card a"><h3>Full zone lists</h3><p class="p">' + e(PRIJS.tekst) + ' · early access</p><p>The best and worst zones per network and country, updated every day, ready to paste into the blacklist or whitelist of your campaigns.</p>'
    + '<form class="wf" id="w"><input type="email" name="email" placeholder="Your email" aria-label="Email" required><div>' + vink + '</div><select name="spend" aria-label="Monthly spend" required>' + sp + '</select><input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="go" type="submit" data-k="wacht">Get early access</button><p id="wok" role="status"></p></form></div></div>'
    + '<h2>Questions</h2>' + FAQ.map(([q, a]) => '<details data-k="faq"><summary>' + e(q) + '</summary><p>' + e(a) + '</p></details>').join('')
    + '<h2>Talk to us</h2><p>Start a video call right now, no booking needed, or send a WhatsApp message.</p><p class="pills"><a href="' + MEET + '" target="_blank" rel="noopener" data-k="meet">Start a video call</a><a href="' + WHATSAPP + '" target="_blank" rel="noopener" data-k="wa">WhatsApp +31 6 55395630</a></p>'
    + '</main><footer><p><b>' + e(NAAM) + '</b> by AdsFair B.V.</p><p><a href="' + CANON + '">' + e(CANON.replace('https://', '')) + '</a> · <button class="l" data-m="privacy" data-k="privacy">Privacy Policy</button> · <button class="l" data-m="terms" data-k="terms">Terms &amp; Conditions</button> · <button class="l" data-m="cookies" data-k="cookies">Cookie Policy</button> · <button class="l" data-m="about" data-k="about">About AdsFair</button></p>'
    + '<p>AdsFair B.V. · KVK 60126035 · BTW NL853775485B01 · Gouda, Netherlands · Curaçao</p><p>© ' + jaar + ' AdsFair B.V.</p></footer>'
    + modal('privacy', 'Privacy Policy', '<p>' + e(NAAM) + ' is run by AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands (KVK 60126035).</p><p><b>Zone checks.</b> We store the network, the zone ID, the verdict, the time and the country of your IP address. To limit checks to 30 an hour we keep a one-way hash of your IP address for one hour. We never store the address itself.</p><p><b>Early access list.</b> If you sign up we store your email address, the networks and spend you picked, the country of your IP and the time. We use it only to contact you about ' + e(KORT) + '. Ask us and we delete it.</p><p><b>Page use.</b> We count how long the page is visible, how far you scroll and which buttons you use, without cookies and without linking it to you.</p><p><b>Fonts.</b> The page loads the Inter font from Google Fonts, which sees your IP address.</p><p>Questions or a request to see or delete your data: start a video call at ' + e(MEET.replace('https://', '')) + ' or WhatsApp +31 6 55395630. You can also complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).</p>')
    + modal('terms', 'Terms &amp; Conditions', '<p>The zone check is free and shows our own estimate, based on clicks we bought and measured ourselves in the last ' + DAGEN + ' days. Networks and zones change all the time, so a score is no promise about future traffic. Use it as one input for your own decisions; AdsFair B.V. is not liable for what you spend.</p><p>Fair use: up to 30 checks an hour per person. Automated scraping of the checker is not allowed.</p><p>Paid lists are in early access. Signing up costs nothing and commits you to nothing; we will send the terms and price before anything is billed. Dutch law applies.</p>')
    + modal('cookies', 'Cookie Policy', '<p>This page sets no cookies and uses no tracking pixels. We count page use (time visible, scroll depth, buttons used) with a small script that stores nothing on your device. The Inter font is loaded from Google Fonts.</p>')
    + modal('about', 'About AdsFair', '<p>AdsFair B.V. builds and runs online products from Gouda, the Netherlands, and Curaçao. Since 2013 we buy, build and sell digital products and run our own traffic for them.</p><p>Clickmind is the system we built to check every ad click we pay for. ' + e(KORT) + ' is the part of it we now open up to other media buyers.</p>')
    + '<script>(function(){var d=document,f=d.getElementById("f"),u=d.getElementById("uit"),w=d.getElementById("w"),wok=d.getElementById("wok"),t0=Date.now(),vis=0,last=Date.now(),sc=0,ks=[],sent=0;'
    + 'function ms(){if(d.visibilityState==="visible"){vis+=Date.now()-last}last=Date.now()}d.addEventListener("visibilitychange",function(){ms();if(d.visibilityState==="hidden")send()});addEventListener("pagehide",send);'
    + 'addEventListener("scroll",function(){var h=d.documentElement,p=Math.round(100*(h.scrollTop+innerHeight)/h.scrollHeight);if(p>sc)sc=p},{passive:true});'
    + 'd.addEventListener("click",function(ev){var el=ev.target.closest&&ev.target.closest("[data-k]");if(el)ks.push(el.getAttribute("data-k"));var m=ev.target.closest&&ev.target.closest("[data-m]");if(m){var g=d.getElementById("m-"+m.getAttribute("data-m"));if(g&&g.showModal)g.showModal()}});'
    + 'function send(){if(sent)return;ms();sent=1;try{navigator.sendBeacon("/api/zonescore?op=ev",JSON.stringify({sec:Math.round(vis/1000),scroll:Math.min(100,sc),k:ks}))}catch(e){}}'
    + 'f.addEventListener("submit",function(ev){ev.preventDefault();var n=f.net.value,z=f.zone.value.trim();if(!z)return;u.innerHTML="<div class=\\"res\\"><p>Checking zone "+z.replace(/[<>&"]/g,"")+"…</p></div>";'
    + 'fetch("/api/zonescore?vorm=html&net="+encodeURIComponent(n)+"&zone="+encodeURIComponent(z)).then(function(r){return r.json()}).then(function(j){u.innerHTML=j.html||("<div class=\\"res\\"><p>"+(j.fout||"Something went wrong.")+"</p></div>");try{history.replaceState(null,"",location.pathname+"?net="+encodeURIComponent(n)+"&zone="+encodeURIComponent(z))}catch(e){}var c=w.querySelector("input[value=\\""+n+"\\"]");if(c)c.checked=true;w.dataset.zone=z}).catch(function(){u.innerHTML="<div class=\\"res\\"><p>Could not reach the checker. Try again.</p></div>"})});'
    + 'w.addEventListener("submit",function(ev){ev.preventDefault();var nets=[].slice.call(w.querySelectorAll("input[name=nets]:checked")).map(function(x){return x.value});'
    + 'wok.textContent="Sending…";fetch("/api/zonescore?op=wacht",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:w.email.value,nets:nets,spend:w.spend.value,website:w.website.value,zone:w.dataset.zone||"",ms:Date.now()-t0})}).then(function(r){return r.json()}).then(function(j){if(j.ok){wok.textContent="Thanks. You are on the early access list. We will email you when your lists are ready.";w.reset()}else{wok.textContent=j.fout||"That did not work. Try again."}}).catch(function(){wok.textContent="That did not work. Try again."})});'
    + '})();</script></body></html>';
}
