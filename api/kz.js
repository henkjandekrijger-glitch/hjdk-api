// KEUZEHULP — interactieve koopgidsen op een eigen domein (3 vragen -> één advies -> bol).
//   GET /keuzehulp                 overzicht (ook / op het eigen domein)
//   GET /keuzehulp/<slug>          keuzehulp-pagina (vragen + advies; server-side al gevuld voor Google)
//   GET /api/kz/advies?slug&a=0-1-2  JSON: 3 producten voor deze antwoordroute (bol-API, prijs van nu, leert op kliks)
//   GET /keuzehulp/sitemap.xml, /over, /privacy
// Teksten: data/kz.json (seed) + KV hjdk:kz:<slug> (door de cloudtaak toegevoegd). Subid per route: kz_<slug>-<route> -> /api/bol/learn ziet orders per route.
//   v27: eigen domein keuzehulp.best; elke dag één nieuwe keuzehulp (publishAt in data/kz.json); abonnees (POST /api/kz/abo, e-mail of Google One Tap) krijgen
//        direct een welkomstmail en elke ochtend de nieuwe (cron /api/kz/dag); terugmailen (reply-to) of inspreken (microfoon -> /api/kz/vraag met audio, komt als bijlage
//        in je mail); betaald verkeer (?clickid=&zoneid=&utm_source=propellerads) telt per zone/creative, meldt bol-klik én inschrijving als conversie (goal 1) en
//        orders via /api/bol/learn (goal 2); aanmeldblok en onderwerpregel leren (Thompson). Beheer: /api/kz/stats?token=
import { createHmac } from 'node:crypto';
import { kv } from '../lib/db.js';
import { searchCached } from '../lib/bol.js';
import { vapid, sendPush, subHash } from '../lib/push.js';
import seed from '../data/kz.json' with { type: 'json' };
const seed2 = { items: [] }; // alles staat nu in één bestand (data/kz.json)
const UPDATED = '2026-10-03';

const BOL_SITE = '1229920';
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = v => '€' + Number(v).toFixed(2).replace('.', ',');
const SITE = seed.site;
const DOMAIN = 'https://' + (SITE.domain || 'keuzehulp.best');
const TODAY = () => new Date().toISOString().slice(0, 10);
const LIST = 'hjdk:kz:subs';
const PA_PB = 'https://ad.propellerads.com/conversion.php?aid=3772727&pid=&tid=151850&visitor_id={clickid}&payout=0.01';
const MD_PB = 'https://postback.mondiad.com/track?uid=31070&clickid={clickid}&payout=0.01';
const RA_PB = 'https://us.ahows.co/log?action=conversion&key={clickid}'; // RichAds: macro [CLICK_ID] in de campagne-URL
const pbFor = src => /mondiad/.test(src) ? MD_PB : /richads|^ra$/.test(src) ? RA_PB : PA_PB;
const bolLink = (url, subid) => 'https://partner.bol.com/click/click?p=1&t=url&s=' + BOL_SITE + '&f=TXL&url=' + encodeURIComponent(String(url).replace(/[?#].*$/, '')) + '&subid=' + encodeURIComponent(subid);
// korte code (10 tekens) van een clickid, voor in de bol-subid (zelfde als brugpagina; /api/bol/learn koppelt orders eraan)
function shortId(s) { let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 16777619) >>> 0; h2 = Math.imul(h2 + ch, 2246822519) >>> 0; } return (h1.toString(36) + h2.toString(36)).slice(0, 10); }
function gam(k) { let s = 0; for (let i = 0; i < Math.max(1, Math.round(k)); i++) s += -Math.log(1 - Math.random()); return s * (k / Math.max(1, Math.round(k))); }
function betaSample(succ, fail) { const a = gam(succ + 1), b = gam(fail + 1); return a / (a + b); }
async function pickVariant(prefix, n, succ, fail) { // Thompson: kies variant op tellers c:<prefix>-v<i>-<succ> / -<fail>
  let counts = []; try { counts = await kv.mget(...Array.from({ length: n }, (_, i) => ['c:' + prefix + '-v' + i + '-' + fail, 'c:' + prefix + '-v' + i + '-' + succ]).flat()); } catch (e) {}
  let best = 0, bs = -1; for (let i = 0; i < n; i++) { const f = Number(counts[i * 2]) || 0, s = Number(counts[i * 2 + 1]) || 0; const x = betaSample(s, Math.max(0, f - s)); if (x > bs) { bs = x; best = i; } } return best;
}
async function secrets() { try { return (await kv.get('hjdk:secrets')) || {}; } catch (e) { return {}; } }
async function resendKey() { if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY; return (await secrets()).RESEND_API_KEY || ''; }
async function googleClientId() { if (process.env.GOOGLE_CLIENT_ID) return process.env.GOOGLE_CLIENT_ID; return (await secrets()).GOOGLE_CLIENT_ID || ''; }
async function hmacKey() { if (process.env.HJDK_TOKEN) return process.env.HJDK_TOKEN; let s = await secrets(); if (!s.NL_HMAC) { s.NL_HMAC = Math.random().toString(36).slice(2) + Date.now().toString(36); try { await kv.set('hjdk:secrets', s); } catch (e) {} } return s.NL_HMAC; }
async function sig(email) { return createHmac('sha256', await hmacKey()).update(String(email).toLowerCase()).digest('hex').slice(0, 24); }
async function emailFromCredential(cred) { // Google One Tap: bewijs bij Google controleren, alleen het e-mailadres gebruiken
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(cred)); const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.email) return null; const cid = await googleClientId(); if (cid && j.aud !== cid) return null; if (String(j.email_verified) !== 'true') return null; return String(j.email).toLowerCase();
}

const isLive = it => !it.publishAt || String(it.publishAt) <= TODAY();
async function allItems(withFuture) {
  const extra = []; try { const idx = (await kv.get('hjdk:kz:index')) || []; const vals = idx.length ? await kv.mget(...idx.map(s => 'hjdk:kz:' + s)) : []; vals.forEach(v => { if (v && v.slug) extra.push(v); }); } catch (e) {}
  const seen = {}; const out = [];
  seed.items.concat(seed2.items, extra).forEach(it => { if (!seen[it.slug] && (withFuture || isLive(it))) { seen[it.slug] = 1; out.push(it); } });
  return out;
}
async function getItem(slug, withFuture) { const all = await allItems(withFuture); return all.find(i => i.slug === slug) || null; }
// de nieuwste keuzehulp (vandaag of de laatst gepubliceerde): voor de welkomstmail en het "Nieuw vandaag"-blok
// Seizoenskalender NL: in dit venster komen deze keuzehulpen bovenaan ("Nu actueel") en krijgen ze voorrang in de dagmail
const SEASON = [
  { key: 'halloween', naam: 'Halloween', van: '10-01', tot: '10-31', slugs: ['halloween-kostuum-kind', 'halloween-kostuum-volwassene', 'halloween-decoratie', 'schmink-kind'] },
  { key: 'saldering', naam: 'Einde salderen (1 jan 2027)', van: '10-01', tot: '12-31', slugs: ['thuisbatterij'] },
  { key: 'herfst', naam: 'Herfst & winter', van: '10-01', tot: '12-31', slugs: ['winterjas-kind', 'snowboots-kind', 'donsdekbed', 'elektrische-deken', 'elektrische-kachel', 'luchtbevochtiger', 'lichtwekker', 'regenjas-kind', 'infraroodpaneel'] },
  { key: 'sinterklaas', naam: 'Sinterklaas', van: '10-15', tot: '12-05', slugs: ['schoencadeautjes', 'sinterklaas-cadeau-8-12', 'cadeau-kind-5-jaar', 'cadeau-peuter', 'sinterklaasspel', 'loopfiets', 'kinderfiets', 'tablet-kind'] },
  { key: 'blackfriday', naam: 'Black Friday', van: '11-15', tot: '12-01', slugs: ['airfryer', 'robotstofzuiger', 'koptelefoon', 'smartwatch', 'e-reader', 'soundbar', 'printer'] },
  { key: 'kerst', naam: 'Kerst & oud en nieuw', van: '11-01', tot: '12-31', slugs: ['kerstcadeau-partner', 'kerstcadeau-collega', 'kerstpakket', 'kerstservies', 'kunstkerstboom', 'kerstverlichting', 'gourmetstel', 'fondueset', 'raclette', 'adventskalender'] }];
function seasonsNow(d) { const md = (d || TODAY()).slice(5); return SEASON.filter(x => md >= x.van && md <= x.tot); }
// Google Trends NL (RSS, dagelijks via cron): welke zoekwoorden stijgen nu, en welke keuzehulpen passen daarbij
const norm = t => String(t || '').toLowerCase().replace(/[^a-z0-9àâäéèêëïîôöùûüç ]+/g, ' ').replace(/\s+/g, ' ').trim();
function matchTrend(term, items) { const t = norm(term); if (t.length < 3) return []; return items.filter(i => { const hay = norm(i.title + ' ' + i.term + ' ' + i.slug.replace(/-/g, ' ')); return t.split(' ').some(w => w.length >= 4 && hay.indexOf(w) >= 0); }).map(i => i.slug); }
async function trendsNow() { try { const t = await kv.get('hjdk:kz:trends'); return t && t.terms ? t : { at: 0, terms: [] }; } catch (e) { return { at: 0, terms: [] }; } }
function newest(items) { const dated = items.filter(i => i.publishAt).sort((a, b) => String(b.publishAt).localeCompare(String(a.publishAt))); return dated[0] || items[items.length - 1] || null; }

// Gebruik en trechter per keuzehulp uit de tellers (c:hjdk6-kz-<slug>-page / -q0 / -q1 / -q2 / -adv / -clk), 1 uur cache.
async function usage() {
  try { const c = await kv.get('hjdk:kz:usage2'); if (c && c.at && Date.now() - c.at < 3600 * 1000) return c.by; } catch (e) {}
  const by = {}; let cursor = '0';
  try { const t0 = Date.now(); for (let i = 0; i < 5000 && Date.now() - t0 < 6000; i++) { const [c, keys] = await kv.scan(cursor, { match: 'c:hjdk6-kz-*', count: 5000 }); cursor = c;
      const vals = keys.length ? await kv.mget(...keys) : [];
      keys.forEach((k, j) => { const m = k.match(/^c:hjdk6-kz-(.+)-(page|q0|q1|q2|adv|clk)$/); if (!m) return; const b = by[m[1]] || (by[m[1]] = { page: 0, q0: 0, q1: 0, q2: 0, adv: 0, clk: 0 }); b[m[2]] += Number(vals[j]) || 0; });
      if (cursor === '0') break; } } catch (e) {}
  try { await kv.set('hjdk:kz:usage2', { at: Date.now(), by }); } catch (e) {}
  return by;
}
// score voor de volgorde op de startpagina: bol-kliks wegen 5x, een afgemaakt advies 2x, een bezoek 1x; nieuwe keuzehulpen krijgen een kans (Thompson)
function popScore(u) { const b = u || { page: 0, adv: 0, clk: 0 }; const s = b.clk * 5 + b.adv * 2 + b.page; const n = b.page + 1; const sample = Math.random(); return (s + 1) / n * (0.7 + 0.6 * sample) + Math.log(s + 1); }

// antwoordroute -> filters -> 3 producten (beste, goedkoper, luxer); kliks per product leren mee
async function advise(item, route, tag) {
  const picks = route.map((a, i) => (item.questions[i] && item.questions[i].options[a]) || null).filter(Boolean);
  let term = item.term; let must = [], min = 0, max = 0;
  picks.forEach(o => { if (o.term) term = o.term; if (o.add) term += ' ' + o.add; if (o.must) must = must.concat(o.must.map(x => x.toLowerCase())); if (o.min) min = Math.max(min, o.min); if (o.max) max = max ? Math.min(max, o.max) : o.max; });
  let products = [];
  try { const r = await searchCached(term.trim(), { country: 'NL', size: 48, sort: 'RELEVANCE' }); products = (r.products || []).filter(p => p.price != null && p.image); } catch (e) {}
  const key = 'kz_' + item.slug + '-' + route.join('') + (tag || '');
  const hitsOf = p => { const t = String(p.title).toLowerCase(); return must.filter(m => t.indexOf(m) >= 0).length; };
  const score = p => { const hits = hitsOf(p); let s = hits * 2 + (p.rating || 3.5); if (min && p.price < min) s -= 3; if (max && p.price > max) s -= 3; if (p.strike && p.strike > p.price) s += 0.5; return s; };
  let ranked = products.map(p => Object.assign({}, p, { s: score(p), hits: hitsOf(p) })).sort((a, b) => b.s - a.s);
  const ids = ranked.slice(0, 12).map(p => 'c:hjdk6-kz-' + item.slug + '-' + p.id + '-clk');
  try { const clk = ids.length ? await kv.mget(...ids) : []; ranked.slice(0, 12).forEach((p, i) => { p.s += Math.min(3, (Number(clk[i]) || 0) / 10); }); ranked = ranked.sort((a, b) => b.s - a.s); } catch (e) {}
  const partner = pickPartner(item, route, key);
  const top = ranked.slice(0, 8); if (!top.length) return { key, term, products: partner ? [partner] : [] };
  const best = top[0];
  const fits = p => !must.length || p.hits >= Math.max(1, best.hits - 1); /* alternatieven moeten bij de antwoorden blijven passen */
  const cheaper = top.filter(p => p.id !== best.id && fits(p) && p.price < best.price && (p.rating || 0) >= 4 && !(min && p.price < min * 0.6)).sort((a, b) => a.price - b.price)[0] || null;
  const premium = top.filter(p => p.id !== best.id && fits(p) && (!cheaper || p.id !== cheaper.id) && p.price > best.price).sort((a, b) => b.price - a.price)[0] || null;
  const out = [{ role: 'Ons advies', p: best }]; if (cheaper) out.push({ role: 'Goedkoper alternatief', p: cheaper }); if (premium) out.push({ role: 'Als je meer wilt', p: premium });
  const list = out.map(x => ({ role: x.role, id: x.p.id, title: x.p.title, image: x.p.image, price: x.p.price, strike: x.p.strike, rating: x.p.rating, delivery: x.p.delivery, url: bolLink(x.p.url, key) }));
  if (partner) list.push(partner);
  return { key, term, products: list };
}
/* partnerproducten buiten bol (bijv. Jackery via Impact): kies het product dat het best bij de antwoorden past; prijs tonen we niet (die staat live bij de fabrikant) */
const IMPACT = { Jackery: 'https://itjackery.pxf.io/c/3526280/1762660/20686' };
function partnerLink(shop, url, key) { const b = IMPACT[shop]; return b ? b + '?subId1=' + encodeURIComponent(key) + '&u=' + encodeURIComponent(url) : url; }
function pickPartner(item, route, key) {
  if (!item.partners || !item.partners.length) return null;
  const sc = p => (p.fit || []).reduce((n, f, i) => n + (Array.isArray(f) && f.indexOf(route[i]) >= 0 ? (i === 0 ? 3 : 1) : 0), 0);
  const best = item.partners.map(p => ({ p, s: sc(p) })).filter(x => !x.p.fit || (x.p.fit[0] || []).indexOf(route[0]) >= 0).sort((a, b) => b.s - a.s)[0];
  if (!best) return null; const p = best.p;
  return { role: 'Direct bij ' + p.shop, id: p.id, title: p.title, image: p.image, price: null, shop: p.shop, url: partnerLink(p.shop, p.url, key) };
}

const CSS = `*{box-sizing:border-box}body{margin:0;font:16px/1.6 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;background:#fbfaf7;color:#14213d}a{color:#0f766e}
header{background:#fff;border-bottom:1px solid #e7e5e4}header .in{max-width:960px;margin:0 auto;padding:14px 18px;display:flex;align-items:center;justify-content:space-between}
.logo{font-weight:900;font-size:20px;letter-spacing:-.02em;color:#14213d;text-decoration:none}.logo span{color:#0f766e}nav a{color:#44403c;text-decoration:none;margin-left:16px;font-size:14px}
main{max-width:960px;margin:0 auto;padding:28px 18px 60px}.hero{padding:34px 0 10px}.hero h1{font-size:34px;line-height:1.15;letter-spacing:-.02em;margin:0 0 10px}.hero p{font-size:18px;color:#44403c;max-width:640px;margin:0 0 18px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin:18px 0}.card{background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:18px;box-shadow:0 1px 2px rgba(0,0,0,.04);text-decoration:none;color:#14213d;display:block}.card:hover{border-color:#0f766e}.card .cat{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#78716c}.card h3{margin:6px 0 4px;font-size:17px;line-height:1.3}.card p{margin:0;color:#57534e;font-size:14px}
.q{background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:20px;margin:14px 0}.q h2{margin:0 0 12px;font-size:19px}.opts{display:flex;flex-wrap:wrap;gap:8px}.opt{border:1.5px solid #d6d3d1;background:#fff;border-radius:999px;padding:10px 16px;font:600 15px system-ui;cursor:pointer;color:#14213d}.opt.on{background:#0f766e;border-color:#0f766e;color:#fff}
.adv{margin:18px 0}.pr{display:grid;grid-template-columns:110px 1fr;gap:16px;background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:16px;margin:0 0 12px;align-items:center}.pr.best{border:2px solid #0f766e;box-shadow:0 8px 30px rgba(15,118,110,.12)}.pr img{width:110px;height:110px;object-fit:contain;border-radius:10px;background:#fff}.pr .role{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;font-weight:700}.pr .t{font-weight:700;margin:2px 0 4px;line-height:1.3}.pr .m{color:#57534e;font-size:14px;margin-bottom:10px}.pr .m b{color:#14213d;font-size:18px}.pr .m s{color:#a8a29e;margin-left:6px}.btn{display:inline-block;background:#0f766e;color:#fff;text-decoration:none;font-weight:800;padding:12px 18px;border-radius:12px;font-size:15px}.btn.sec{background:#f5f5f4;color:#14213d}
.txt{background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:20px;margin:14px 0}.txt h2{font-size:19px;margin:0 0 8px}.txt ul{margin:0;padding-left:20px}.txt li{margin:6px 0}
.disc{color:#78716c;font-size:13px;margin:14px 0 0}footer{border-top:1px solid #e7e5e4;color:#78716c;font-size:13px;padding:22px 18px;max-width:960px;margin:0 auto}footer a{color:#57534e}
@media(max-width:600px){.hero h1{font-size:27px}.pr{grid-template-columns:84px 1fr;gap:12px}.pr img{width:84px;height:84px}}`;

const baseOf = req => DOMAIN; /* één canonieke host: het eigen domein */
const pathOf = (req, p) => p.replace(/^\/keuzehulp(?=\/|$)/, '') || '/';
const canon = p => DOMAIN + pathOf(null, p);
function shell(title, desc, body, canonical, extraHead) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">${canonical ? '<link rel="canonical" href="' + esc(canonical) + '">' : ''}<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:locale" content="nl_NL"><meta property="og:site_name" content="${esc(SITE.name)}">${extraHead || ''}<style>${CSS}</style></head><body>
<header><div class="in"><a class="logo" href="/keuzehulp">Keuze<span>hulp</span></a><nav><a href="/keuzehulp">Alle keuzehulpen</a><a href="/keuzehulp/over">Over ons</a></nav></div></header>
<main>${body}</main>
<footer>${esc(SITE.name)} is een onafhankelijke keuzehulp van ${esc(SITE.owner)} · <a href="/keuzehulp/over">Over ons</a> · <a href="/keuzehulp/privacy">Privacy</a> · <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a><br>Affiliate-vermelding: als je via onze link iets koopt bij bol, ontvangen wij een vergoeding. De prijs die je betaalt verandert daardoor niet. Prijzen en beoordelingen komen rechtstreeks van bol en worden elke 20 minuten ververst.</footer>
</body></html>`;
}

function productCard(x, i) {
  return `<div class="pr${i === 0 ? ' best' : ''}"><a href="${esc(x.url)}" target="_blank" rel="sponsored noopener nofollow" data-kz="${esc(x.id)}"><img src="${esc(x.image)}" alt="" loading="lazy"></a><div><div class="role">${esc(x.role)}</div><div class="t">${esc(String(x.title).slice(0, 90))}</div><div class="m">${x.price == null ? 'Actuele prijs en acties bij ' + esc(x.shop || 'de winkel') : '<b>' + eur(x.price) + '</b>'}${x.strike && x.strike > x.price ? '<s>' + eur(x.strike) + '</s>' : ''}${x.rating != null ? ' · ★ ' + Number(x.rating).toFixed(1).replace('.', ',') : ''}${x.delivery && /morgen/i.test(x.delivery) ? ' · morgen in huis' : ''}</div><a class="btn" href="${esc(x.url)}" target="_blank" rel="sponsored noopener nofollow" data-kz="${esc(x.id)}">Bekijk bij ${esc(x.shop || 'bol')} →</a></div></div>`;
}

// Aanmeldblok: elke dag één nieuwe keuzehulp per mail. Drie teksten, Thompson op c:hjdk6-kz-abo-v<i>-imp / -sub. Daaronder: "mis je er een? typ of spreek in".
const ABO = [
  { h: 'Elke dag één nieuwe keuzehulp in je mail', p: 'Morgen komt er weer een bij. Wil je hem als eerste? Eén korte mail per ochtend, geen reclame, afmelden met één klik.' },
  { h: 'Mis geen enkele keuzehulp meer', p: 'We voegen elke dag een nieuwe toe. Laat je e-mail achter en je krijgt hem elke ochtend, met de prijs van die dag.' },
  { h: 'Twijfel je vaker? Dan maken we elke dag één keuze makkelijk', p: 'Elke ochtend een korte keuzehulp: drie vragen, één eerlijk advies. En je mag altijd terugmailen welke je mist.' }];
/* Meldingen per keuzehulp: prijsalarm, beter model, of (bij item.pushNote) regels die veranderen. Hooguit één melding per week per persoon. */
const PUSH = [
  { h: t => 'Prijsalarm: ' + t, p: 'Krijg een melding als de prijs van jouw advies daalt of als er een beter model is.' },
  { h: t => 'Blijf op de hoogte over ' + t, p: 'Eén melding als er iets verandert dat jouw keuze beïnvloedt: een lagere prijs of een beter model.' }
];
const PUSH_GAP = 7 * 86400 * 1000;
function pushBox(item, v) {
  const a = PUSH[v] || PUSH[0]; const t = item.term || item.title;
  return `<div class="txt" id="push" data-v="${v}" style="border:2px solid #14213d"><h2>🔔 ${esc(a.h(t))}</h2><p style="margin:0 0 12px;color:#44403c">${esc(a.p)}${item.pushNote ? ' ' + esc(item.pushNote) : ''}</p>
<button type="button" id="pushb" class="btn" style="border:0;cursor:pointer;background:#14213d">Zet meldingen aan</button>
<p id="pushst" style="font-size:14px;color:#0f766e;font-weight:700;margin:10px 0 0;display:none"></p>
<p style="font-size:13px;color:#78716c;margin:10px 0 0">Hooguit één melding per week. Geen reclame. Uitzetten kan altijd in je browser.</p></div>
<script>(function(){var S=${JSON.stringify(item.slug)},V=${v},H='/api/hjdk/stats/hits',Q=new URLSearchParams(location.search),Z=(Q.get('zoneid')||'').replace(/\\D/g,'').slice(0,12),b=document.getElementById('pushb'),st=document.getElementById('pushst');
function hit(k){try{navigator.sendBeacon(H,new Blob([JSON.stringify({hits:[[k,1]]})],{type:'text/plain'}))}catch(e){}}
function say(t){st.textContent=t;st.style.display=''}
function u8(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var r=atob(s),a=new Uint8Array(r.length);for(var i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a}
var ok=('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window);
hit('hjdk6-kz-push-imp');hit('hjdk6-kz-push-v'+V+'-imp');
var on=false;try{on=!!localStorage.getItem('kz_push_'+S)}catch(e){}
if(on&&ok&&Notification.permission==='granted'){b.style.display='none';say('Meldingen staan aan voor deze keuzehulp.');return}
if(!ok){b.textContent='Liever per mail';b.addEventListener('click',function(){hit('hjdk6-kz-push-nosupport-mail');var a=document.getElementById('abo');if(a)a.scrollIntoView({behavior:'smooth'})});hit('hjdk6-kz-push-nosupport');return}
if(Notification.permission==='denied'){b.style.display='none';say('Meldingen staan uit in je browser. Wil je toch op de hoogte blijven? Gebruik de mail hieronder.');return}
b.addEventListener('click',function(){hit('hjdk6-kz-push-click');hit('hjdk6-kz-push-v'+V+'-click');b.disabled=true;b.textContent='Even geduld…';
navigator.serviceWorker.register('/sw.js').then(function(reg){return Notification.requestPermission().then(function(p){if(p!=='granted'){hit('hjdk6-kz-push-denied');b.style.display='none';say('Geen probleem — je krijgt geen meldingen.');throw 0}
return fetch('/api/kz/vapid').then(function(r){return r.json()}).then(function(j){return navigator.serviceWorker.ready.then(function(r2){return r2.pushManager.getSubscription().then(function(s){return s||r2.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:u8(j.key)})})})})})}).then(function(s){
var r=window.__kzCur?window.__kzCur():'';return fetch('/api/kz/pushsub',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sub:s.toJSON(),slug:S,v:V,zone:Z,cid:window.__kzCID||'',r:r})}).then(function(x){return x.json()})}).then(function(j){if(!j||!j.ok)throw 1;
hit('hjdk6-kz-push-ok');hit('hjdk6-kz-push-v'+V+'-ok');hit('hjdk6-kz-push-'+S+'-ok');if(Z)hit('hjdk6-kz-paid-'+Z+'-sub');var PB=window.__kzPB;if(PB&&!window.__kzPBfired){window.__kzPBfired=1;try{fetch(PB,{mode:'no-cors',keepalive:true})}catch(e){}}
try{localStorage.setItem('kz_push_'+S,'1')}catch(e){}b.style.display='none';say('Top! Je krijgt een melding als er iets verandert. Hooguit één per week.')}).catch(function(e){if(e===0)return;hit('hjdk6-kz-push-fail');b.disabled=false;b.textContent='Zet meldingen aan';say('Dat lukte niet in deze browser. Probeer het nog eens of gebruik de mail hieronder.')})})})();</script>`;
}

function aboBox(v, slug, clientId) {
  const a = ABO[v] || ABO[0];
  return `<div class="txt abo" id="abo" data-v="${v}" style="border:2px solid #0f766e;background:#f0fdfa"><h2>${esc(a.h)}</h2><p style="margin:0 0 12px;color:#44403c">${esc(a.p)}</p>
<form class="abo-f" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center" onsubmit="return window.__kzAbo(this)"><input type="email" name="email" required placeholder="jouw@email.nl" autocomplete="email" style="flex:1 1 220px;font:16px system-ui;padding:12px;border:1.5px solid #d6d3d1;border-radius:10px"><button class="btn" type="submit" style="border:0;cursor:pointer">Ja, stuur me elke dag één</button></form>
${clientId ? '<div id="g_id_onload" data-client_id="' + esc(clientId) + '" data-callback="__kzGoogle" data-auto_select="false" data-context="signup" data-itp_support="true"></div><div style="margin:10px 0 0"><div class="g_id_signin" data-type="standard" data-size="large" data-text="continue_with" data-shape="pill" data-locale="nl"></div></div><script src="https://accounts.google.com/gsi/client" async defer></script>' : ''}
<p id="abook" style="display:none;color:#0f766e;font-weight:700;margin:10px 0 0">Je zit erbij. Je eerste mail komt er nu aan; morgen de volgende.</p>
<p style="font-size:13px;color:#78716c;margin:10px 0 0">Mis je een keuzehulp? <a href="#vraag" style="color:#0f766e">Typ hem of spreek hem in</a> — dan maken we hem.</p></div>
<div class="txt" id="vraag"><h2>Welke keuzehulp mis je?</h2><p style="margin:0 0 10px;color:#44403c">Typ het, of houd de microfoon ingedrukt en spreek het in. We maken er een keuzehulp van en mailen je als hij er staat.</p>
<form class="vr-f" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center" onsubmit="return window.__kzVraag(this)"><input name="q" maxlength="120" placeholder="Bijv. welke e-bike voor woon-werk" style="flex:1 1 200px;font:16px system-ui;padding:12px;border:1.5px solid #d6d3d1;border-radius:10px"><input type="email" name="email" placeholder="e-mail (mag)" style="flex:1 1 160px;font:16px system-ui;padding:12px;border:1.5px solid #d6d3d1;border-radius:10px"><button type="button" id="mic" class="btn sec" style="border:0;cursor:pointer" title="Spreek in">🎤 Inspreken</button><button class="btn" type="submit" style="border:0;cursor:pointer">Verstuur</button></form>
<p id="vrst" style="font-size:13px;color:#78716c;margin:8px 0 0"></p><p id="vrok" style="display:none;color:#0f766e;font-weight:700;margin:8px 0 0">Dank je — hij staat op de lijst.</p></div>
<script>(function(){var S=${JSON.stringify(slug || '')},V=${v},H='/api/hjdk/stats/hits',Q=new URLSearchParams(location.search),Z=(Q.get('zoneid')||'').replace(/\\D/g,'').slice(0,12),PB=window.__kzPB||'';
function hit(k){try{navigator.sendBeacon(H,new Blob([JSON.stringify({hits:[[k,1]]})],{type:'text/plain'}))}catch(e){}}
hit('hjdk6-kz-abo-v'+V+'-imp');hit('hjdk6-kz-abo-imp');
function done(src){document.querySelectorAll('.abo-f,.g_id_signin').forEach(function(f){f.style.display='none'});document.getElementById('abook').style.display='';hit('hjdk6-kz-abo-v'+V+'-sub');hit('hjdk6-kz-abo-src-'+src);if(Z)hit('hjdk6-kz-paid-'+Z+'-sub');if(PB){try{fetch(PB,{mode:'no-cors',keepalive:true})}catch(e){}}try{localStorage.setItem('kz_abo','1')}catch(e){}}
function post(b,src){b.slug=S;b.v=V;b.zone=Z;b.cid=window.__kzCID||'';fetch('/api/kz/abo',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok)done(src);else alert(j&&j.error||'Dat lukte niet, probeer het nog eens.')}).catch(function(){alert('Dat lukte niet, probeer het nog eens.')})}
window.__kzAbo=function(f){var e=(f.email.value||'').trim();if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(e))return false;post({email:e},'email');return false};
window.__kzGoogle=function(r){if(r&&r.credential)post({credential:r.credential},'google')};
try{if(localStorage.getItem('kz_abo')){document.querySelectorAll('.abo-f,.g_id_signin').forEach(function(f){f.style.display='none'});var ok=document.getElementById('abook');ok.textContent='Je bent al aangemeld — morgen komt de volgende.';ok.style.display=''}}catch(e){}
var rec=null,chunks=[],blob=null,mic=document.getElementById('mic'),st=document.getElementById('vrst');
function b64(b,cb){var r=new FileReader();r.onload=function(){cb(String(r.result).split(',')[1]||'')};r.readAsDataURL(b)}
if(mic){if(!(navigator.mediaDevices&&window.MediaRecorder)){mic.style.display='none'}else{mic.addEventListener('click',function(){if(rec&&rec.state==='recording'){rec.stop();return}navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){chunks=[];rec=new MediaRecorder(s);rec.ondataavailable=function(e){chunks.push(e.data)};rec.onstop=function(){s.getTracks().forEach(function(t){t.stop()});blob=new Blob(chunks,{type:rec.mimeType||'audio/webm'});mic.textContent='🎤 Opgenomen ✓ (opnieuw?)';st.textContent='Je opname staat klaar. Klik op Verstuur.'};rec.start();mic.textContent='⏹ Stop opname';st.textContent='Opname loopt… (max 60 s)';setTimeout(function(){if(rec&&rec.state==='recording')rec.stop()},60000)}).catch(function(){st.textContent='Microfoon niet beschikbaar; typ je vraag hierboven.'})})}}
window.__kzVraag=function(f){var q=(f.q.value||'').trim(),e=(f.email&&f.email.value||'').trim();if(!q&&!blob)return false;var b={q:q,email:e,slug:S};var go=function(){fetch('/api/kz/vraag',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(function(){f.style.display='none';st.textContent='';document.getElementById('vrok').style.display='';var mo=document.getElementById('misok');if(mo&&f.className.indexOf('nl-f')>=0)mo.style.display='';hit('hjdk6-kz-vraag'+(b.audio?'-audio':'-tekst'))}).catch(function(){})};if(blob&&blob.size<700000){b64(blob,function(a){b.audio=a;b.mime=blob.type;go()})}else go();return false};})();</script>`;
}
function faqHtml(item) { return (item.faq || []).length ? `<div class="txt" id="faq"><h2>Veelgestelde vragen over ${esc(item.title.replace(/^Welke? |\?$/g, '').toLowerCase())}</h2>${item.faq.map(f => '<h3 style="font-size:16px;margin:12px 0 4px">' + esc(f.q) + '</h3><p style="margin:0 0 8px;color:#44403c">' + esc(f.a) + '</p>').join('')}</div>` : ''; }
function jsonld(obj) { return '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, '\\u003c') + '</script>'; }
async function page(item, res, req) {
  const all = await allItems(); const base = baseOf(req); const url = base + pathOf(req, '/keuzehulp/' + item.slug);
  // betaald verkeer (?utm_source=propellerads&zoneid=&clickid=&creativeid=) en mail (?utm_source=mail&m=&s=): bron bewaren voor conversies en tellers
  const q = new URL(req.url, 'http://x').searchParams; const src = String(q.get('utm_source') || '').toLowerCase().slice(0, 20);
  const clickid = String(q.get('clickid') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80); const zone = String(q.get('zoneid') || '').replace(/\D/g, '').slice(0, 12); const creative = String(q.get('creativeid') || '').replace(/\D/g, '').slice(0, 12);
  const code = clickid ? shortId(clickid) : ''; const tag = (zone ? '-Z' + zone : '') + (code ? '-' + code : '');
  const hits = [];
  if (code) { try { await kv.set('hjdk:cid:' + code, { c: clickid, s: src || 'propellerads', z: zone, g: 'kz:' + item.slug, v: 'k', at: Date.now() }, { ex: 10 * 86400 }); } catch (e) {} }
  if (zone || clickid) { hits.push(['c:hjdk6-kz-paid-view', 1], ['c:hjdk6-kz-paid-' + (zone || '0') + '-view', 1], ['c:hjdk6-kz-paid-' + (zone || '0') + '-' + item.slug + '-view', 1]); if (creative) hits.push(['c:hjdk6-kzc-' + creative + '-view', 1]); }
  if (src === 'mail') { const m = String(q.get('m') || '').replace(/[^a-z0-9]/gi, '').slice(0, 12), si = String(q.get('s') || '').replace(/\D/g, '').slice(0, 2); hits.push(['c:hjdk6-kz-mail-clk', 1]); if (m) hits.push(['c:hjdk6-kz-mail-' + m + '-clk', 1]); if (si) hits.push(['c:hjdk6-kz-ms-v' + si + '-clk', 1]); }
  if (src === 'push') { const m = String(q.get('m') || '').replace(/[^a-z0-9]/gi, '').slice(0, 16); hits.push(['c:hjdk6-kz-push-clk', 1]); if (m) hits.push(['c:hjdk6-kz-pm-' + m + '-clk', 1]); }
  if (hits.length) { try { await kv.incrMany(hits); } catch (e) {} }
  const postback = clickid ? pbFor(src).replace('{clickid}', encodeURIComponent(clickid)) : '';
  const same = all.filter(i => i.cat === item.cat && i.slug !== item.slug).slice(0, 5); const other = all.filter(i => i.cat !== item.cat).sort(() => 0.5 - Math.random()).slice(0, Math.max(3, 8 - same.length)); /* altijd 6–8 interne links per pagina */
  const route0 = item.questions.map(() => 0);
  const [adv, aboV, clientId, pushV] = await Promise.all([advise(item, route0, tag), pickVariant('hjdk6-kz-abo', ABO.length, 'sub', 'imp'), googleClientId(), pickVariant('hjdk6-kz-push', PUSH.length, 'ok', 'imp')]);
  const nieuw = newest(all); const nieuwHtml = nieuw && nieuw.slug !== item.slug && nieuw.publishAt === TODAY() ? `<p style="margin:0 0 10px;font-size:14px"><span style="background:#0f766e;color:#fff;font-size:11px;letter-spacing:.06em;padding:3px 8px;border-radius:999px;font-weight:700">NIEUW VANDAAG</span> <a href="/keuzehulp/${esc(nieuw.slug)}">${esc(nieuw.title)}</a></p>` : '';
  const paid = !!(zone || clickid);
  const qs = item.questions.map((q, qi) => `<div class="q" data-q="${qi}"><h2>${qi + 1}. ${esc(q.q)}</h2><div class="opts">${q.options.map((o, oi) => `<button class="opt${oi === 0 && !paid ? ' on' : ''}" data-o="${oi}" type="button">${esc(o.label)}</button>`).join('')}</div></div>`).join('');
  const crumbs = `<nav aria-label="breadcrumb" style="font-size:13px;color:#78716c;margin:4px 0 0"><a href="/keuzehulp" style="color:#78716c">Keuzehulp</a> › <a href="/keuzehulp#${esc(item.cat.toLowerCase().replace(/[^a-z]+/g, '-'))}" style="color:#78716c">${esc(item.cat)}</a> › ${esc(item.title)}</nav>`;
  const kort = item.kort ? `<div class="txt" style="border-left:4px solid #0f766e"><h2 style="font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:#0f766e">In het kort</h2><p style="margin:0;font-size:17px">${esc(item.kort)}</p></div>` : '';
  const related = `<div class="txt"><h2>Ook handig om te kiezen</h2><div class="grid" style="margin:8px 0 0">${same.concat(other).map(i => `<a class="card" href="/keuzehulp/${esc(i.slug)}"><div class="cat">${esc(i.cat)}</div><h3>${esc(i.title)}</h3></a>`).join('')}</div></div>`;
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: item.h1, description: item.intro, inLanguage: 'nl', dateModified: UPDATED, author: { '@type': 'Organization', name: SITE.name }, publisher: { '@type': 'Organization', name: SITE.name }, mainEntityOfPage: url },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Keuzehulp', item: base + pathOf(req, '/keuzehulp') }, { '@type': 'ListItem', position: 2, name: item.cat }, { '@type': 'ListItem', position: 3, name: item.title, item: url }] },
    ...(item.faq && item.faq.length ? [{ '@type': 'FAQPage', mainEntity: item.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []) ] });
  const body = `<script>window.__kzPB=${JSON.stringify(postback)};window.__kzCID=${JSON.stringify(code)};</script><article>${paid ? `<div class="hero" style="padding-bottom:6px"><h1 style="margin-bottom:6px">${esc(item.h1)}</h1><p style="margin:0;color:#0f766e;font-weight:700">Tik je antwoorden — ${item.questions.length} vragen, klaar in 20 seconden. Je advies verschijnt direct.</p></div>\n${qs}\n${kort}` : `<div class="hero">${nieuwHtml}${crumbs}<div class="cat" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#78716c;margin-top:10px">${esc(item.cat)} · keuzehulp · bijgewerkt ${UPDATED}</div><h1>${esc(item.h1)}</h1><p>${esc(item.intro)}</p></div>\n${kort}\n${qs}`}
<div class="adv" id="adv"><h2 style="font-size:19px;margin:8px 0 10px">Jouw advies <span id="advn" style="color:#78716c;font-weight:400;font-size:14px"></span></h2><div id="advl">${adv.products.map(productCard).join('') || '<p>Even geduld, we halen de prijzen van vandaag op…</p>'}</div><p class="disc">Prijzen van vandaag bij bol; wij kiezen op pasvorm bij jouw antwoorden, beoordeling en prijs. Geen betaalde plaatsing.${item.partners && item.partners.length ? ' Links naar ' + esc([...new Set(item.partners.map(p => p.shop))].join(', ')) + ' zijn ook partnerlinks: wij krijgen een vergoeding als je daar koopt, jij betaalt niets extra.' : ''}</p></div>
${pushBox(item, pushV)}
<div class="txt"><h2>Waar je op moet letten</h2><p>${esc(item.uitleg)}</p></div>
<div class="txt"><h2>Veelgemaakte fouten</h2><ul>${item.fouten.map(f => '<li>' + esc(f) + '</li>').join('')}</ul></div>
${aboBox(aboV, item.slug, clientId)}
${faqHtml(item)}
${related}
<p class="disc">Liever mailen? <a href="mailto:${esc(SITE.email)}?subject=Keuzehulp%20gevraagd:%20">${esc(SITE.email)}</a> — we maken er een keuzehulp van.</p></article>
<script>(function(){var S=${JSON.stringify(item.slug)},A='${'/api/kz/advies'}',H='/api/hjdk/stats/hits',Z=${JSON.stringify(zone)},CR=${JSON.stringify(creative)},C=${JSON.stringify(code)},PB=${JSON.stringify(postback)},pbDone=false;var n=document.querySelectorAll('.q').length;var cur=[];for(var i=0;i<n;i++)cur.push(0);window.__kzCur=function(){return cur.join('-')};
function hit(k){try{navigator.sendBeacon(H,new Blob([JSON.stringify({hits:[[k,1]]})],{type:'text/plain'}))}catch(e){}}
function eur(v){return '€'+Number(v).toFixed(2).replace('.',',')}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function card(x,i){return '<div class="pr'+(i===0?' best':'')+'"><a href="'+esc(x.url)+'" target="_blank" rel="sponsored noopener nofollow" data-kz="'+esc(x.id)+'"><img src="'+esc(x.image)+'" alt=""></a><div><div class="role">'+esc(x.role)+'</div><div class="t">'+esc(String(x.title).slice(0,90))+'</div><div class="m">'+(x.price==null?'Actuele prijs en acties bij '+esc(x.shop||'de winkel'):'<b>'+eur(x.price)+'</b>')+(x.strike&&x.strike>x.price?'<s>'+eur(x.strike)+'</s>':'')+(x.rating!=null?' · ★ '+Number(x.rating).toFixed(1).replace('.',','):'')+(x.delivery&&/morgen/i.test(x.delivery)?' · morgen in huis':'')+'</div><a class="btn" href="'+esc(x.url)+'" target="_blank" rel="sponsored noopener nofollow" data-kz="'+esc(x.id)+'">Bekijk bij '+esc(x.shop||'bol')+' →</a></div></div>'}
var t=null;function load(){var r=cur.join('-');document.getElementById('advn').textContent='wordt bijgewerkt…';fetch(A+'?slug='+encodeURIComponent(S)+'&a='+r+(Z?'&z='+Z:'')+(C?'&c='+C:'')).then(function(x){return x.json()}).then(function(j){var l=document.getElementById('advl');l.innerHTML=(j.products||[]).map(card).join('')||'<p>Geen passend product gevonden met deze antwoorden. Probeer een andere combinatie.</p>';document.getElementById('advn').textContent='';hit('hjdk6-kz-'+S+'-r'+r+'-imp');if(!done.adv){done.adv=1;hit('hjdk6-kz-'+S+'-adv')}(j.products||[]).forEach(function(p){hit('hjdk6-kz-'+S+'-'+p.id+'-imp')});try{history.replaceState(null,'','#a='+r)}catch(e){}}).catch(function(){document.getElementById('advn').textContent=''})}
var done={};document.querySelectorAll('.q').forEach(function(q){var qi=+q.getAttribute('data-q');q.querySelectorAll('.opt').forEach(function(b){b.addEventListener('click',function(){q.querySelectorAll('.opt').forEach(function(x){x.classList.remove('on')});b.classList.add('on');cur[qi]=+b.getAttribute('data-o');hit('hjdk6-kz-'+S+'-q'+qi+'-'+cur[qi]);if(!done['q'+qi]){done['q'+qi]=1;hit('hjdk6-kz-'+S+'-q'+qi);if(!done.start){done.start=1;if(Z||C){hit('hjdk6-kz-paid-start');hit('hjdk6-kz-paid-'+(Z||'0')+'-start');if(CR)hit('hjdk6-kzc-'+CR+'-start')}if(PB&&!pbDone){pbDone=true;try{fetch(PB,{mode:'no-cors',keepalive:true})}catch(e2){}}}}clearTimeout(t);t=setTimeout(load,250);var adv=document.getElementById('adv');if(qi===n-1&&adv){adv.scrollIntoView({behavior:'smooth',block:'start'})}})})});
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-kz]');if(a){hit('hjdk6-kz-'+S+'-'+a.getAttribute('data-kz')+'-clk');hit('hjdk6-kz-'+S+'-r'+cur.join('-')+'-clk');hit('hjdk6-kz-'+S+'-clk');hit('hjdk6-kz-clk');if(Z||C){hit('hjdk6-kz-paid-clk');hit('hjdk6-kz-paid-'+(Z||'0')+'-clk');hit('hjdk6-kz-paid-'+(Z||'0')+'-'+S+'-clk');if(CR)hit('hjdk6-kzc-'+CR+'-clk')}if(PB&&!pbDone){pbDone=true;try{fetch(PB,{mode:'no-cors',keepalive:true})}catch(e2){}}}},true);
try{var m=(location.hash||'').match(/a=([\\d-]+)/);if(m){var p=m[1].split('-');var ch=false;p.forEach(function(v,i){if(i<n){var b=document.querySelector('.q[data-q="'+i+'"] .opt[data-o="'+v+'"]');if(b){cur[i]=+v;ch=true;b.parentNode.querySelectorAll('.opt').forEach(function(x){x.classList.remove('on')});b.classList.add('on')}}});if(ch)load()}}catch(e){}
hit('hjdk6-kz-'+S+'-page');})();</script>`;
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', clickid || src ? 'no-store' : 'public, max-age=600');
  return res.status(200).send(shell(item.title + ' | ' + SITE.name, item.kort || item.intro, body, url, ld));
}

async function home(res, req) {
  const items0 = await allItems(); const base = baseOf(req); const [U, aboV, clientId] = await Promise.all([usage(), pickVariant('hjdk6-kz-abo', ABO.length, 'sub', 'imp'), googleClientId()]);
  const nieuw = newest(items0);
  const TR = await trendsNow(); const trendSlugs = []; TR.terms.slice(0, 20).forEach(t => matchTrend(t.t, items0).forEach(sl => { if (trendSlugs.indexOf(sl) < 0) trendSlugs.push(sl); })); const trendItems = trendSlugs.slice(0, 6).map(sl => items0.find(i => i.slug === sl)).filter(Boolean);
  // algemene campagne landt hier: clickid/zone vastleggen, doorgeven aan elke keuzehulp-link, en de eerste klik op een keuzehulp telt als conversie (goal 1)
  const q = new URL(req.url, 'http://x').searchParams; const src = String(q.get('utm_source') || '').toLowerCase().slice(0, 20);
  const clickid = String(q.get('clickid') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80); const zone = String(q.get('zoneid') || '').replace(/\D/g, '').slice(0, 12); const creative = String(q.get('creativeid') || '').replace(/\D/g, '').slice(0, 12);
  const code = clickid ? shortId(clickid) : '';
  if (code) { try { await kv.set('hjdk:cid:' + code, { c: clickid, s: src || 'propellerads', z: zone, g: 'kz:home', v: 'h', at: Date.now() }, { ex: 10 * 86400 }); } catch (e) {} }
  if (zone || clickid) { try { await kv.incrMany([['c:hjdk6-kz-paid-view', 1], ['c:hjdk6-kz-paid-' + (zone || '0') + '-view', 1], ['c:hjdk6-kz-paid-' + (zone || '0') + '-home-view', 1]].concat(creative ? [['c:hjdk6-kzc-' + creative + '-view', 1]] : [])); } catch (e) {} }
  const postback = clickid ? pbFor(src).replace('{clickid}', encodeURIComponent(clickid)) : '';
  const pq = clickid || zone ? '?' + new URLSearchParams(Object.assign({ utm_source: src || 'propellerads' }, clickid ? { clickid } : {}, zone ? { zoneid: zone } : {}, creative ? { creativeid: creative } : {})).toString() : '';
  const items = items0.map(i => Object.assign({}, i, { _u: U[i.slug] || null, _s: popScore(U[i.slug]) })).sort((a, b) => b._s - a._s);
  const cats = {}; items.forEach(i => { (cats[i.cat] = cats[i.cat] || []).push(i); });
  const top = items.filter(i => i._u && (i._u.clk > 0 || i._u.adv > 2)).sort((a, b) => ((b._u.clk * 5 + b._u.adv * 2 + b._u.page) - (a._u.clk * 5 + a._u.adv * 2 + a._u.page))).slice(0, 6);
  const catNav = Object.keys(cats).map(c => `<a href="#${esc(c.toLowerCase().replace(/[^a-z]+/g, '-'))}" class="opt" style="text-decoration:none;font-size:14px;padding:8px 13px">${esc(c)} <span style="color:#a8a29e">${cats[c].length}</span></a>`).join('');
  const body = `<script>window.__kzPB=${JSON.stringify(postback)};window.__kzCID=${JSON.stringify(code)};(function(){var Z=${JSON.stringify(zone)},CR=${JSON.stringify(creative)},PB=${JSON.stringify(postback)},d=false;if(!(Z||PB))return;function hit(k){try{navigator.sendBeacon('/api/hjdk/stats/hits',new Blob([JSON.stringify({hits:[[k,1]]})],{type:'text/plain'}))}catch(e){}}document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.card');if(!a||d)return;d=true;hit('hjdk6-kz-paid-start');hit('hjdk6-kz-paid-'+(Z||'0')+'-start');hit('hjdk6-kz-paid-'+(Z||'0')+'-home-start');if(CR)hit('hjdk6-kzc-'+CR+'-start');if(PB){try{fetch(PB,{mode:'no-cors',keepalive:true})}catch(e2){}}},true)})();</script><div class="hero"><h1>Twijfel je wat je moet kopen? ${esc(SITE.tagline.split('—')[0])}</h1><p>Beantwoord drie korte vragen en krijg één advies dat bij jóuw situatie past — met de prijs van vandaag bij bol, een goedkoper en een luxer alternatief, en de fouten die anderen al maakten.</p></div>
<p style="margin:0 0 6px"><input id="zoek" type="search" placeholder="Zoek: airfryer, matras, kinderwagen…" style="width:100%;max-width:420px;font:16px system-ui;padding:12px 14px;border:1.5px solid #d6d3d1;border-radius:12px"></p><p style="font-size:13px;color:#78716c;margin:0 0 10px">${items.length} keuzehulpen · bijgewerkt ${UPDATED}</p>
<div class="opts" style="margin:0 0 18px">${catNav}</div>
${seasonsNow().map(sz => { const its = sz.slugs.map(sl => items0.find(i => i.slug === sl)).filter(Boolean); return its.length ? `<h2 style="font-size:20px;margin:22px 0 4px">Nu actueel: ${esc(sz.naam)}</h2><div class="grid">${its.map(i => `<a class="card" href="/keuzehulp/${esc(i.slug)}${esc(pq)}" data-t="${esc((i.title + ' ' + i.slug + ' ' + i.cat).toLowerCase())}"><div class="cat">${esc(i.cat)} · ${esc(sz.naam.toLowerCase())}</div><h3>${esc(i.title)}</h3><p>${esc((i.kort || i.intro).slice(0, 120))}…</p></a>`).join('')}</div>` : ''; }).join('')}
${trendItems.length ? `<h2 style="font-size:20px;margin:22px 0 4px">Nu veel gezocht <span style="color:#a8a29e;font-weight:400;font-size:14px">Google Trends Nederland, vandaag</span></h2><div class="grid">${trendItems.map(i => `<a class="card" href="/keuzehulp/${esc(i.slug)}${esc(pq)}" data-t="${esc((i.title + ' ' + i.slug + ' ' + i.cat).toLowerCase())}"><div class="cat">${esc(i.cat)} · trending</div><h3>${esc(i.title)}</h3><p>${esc((i.kort || i.intro).slice(0, 120))}…</p></a>`).join('')}</div>` : ''}
${nieuw ? `<h2 style="font-size:20px;margin:22px 0 4px">Nieuw ${nieuw.publishAt === TODAY() ? 'vandaag' : 'toegevoegd'} <span style="color:#a8a29e;font-weight:400;font-size:14px">elke dag één erbij</span></h2><div class="grid"><a class="card" href="/keuzehulp/${esc(nieuw.slug)}${esc(pq)}" data-t="${esc((nieuw.title + ' ' + nieuw.slug + ' ' + nieuw.cat).toLowerCase())}" style="border-color:#0f766e"><div class="cat">${esc(nieuw.cat)} · nieuw</div><h3>${esc(nieuw.title)}</h3><p>${esc((nieuw.kort || nieuw.intro).slice(0, 120))}…</p></a></div>` : ''}
${top.length ? `<h2 style="font-size:20px;margin:22px 0 4px">Meest gebruikt</h2><div class="grid">${top.map(i => `<a class="card" href="/keuzehulp/${esc(i.slug)}${esc(pq)}" data-t="${esc((i.title + ' ' + i.slug + ' ' + i.cat).toLowerCase())}"><div class="cat">${esc(i.cat)} · populair</div><h3>${esc(i.title)}</h3><p>${esc((i.kort || i.intro).slice(0, 120))}…</p></a>`).join('')}</div>` : ''}
${Object.keys(cats).map(c => `<h2 id="${esc(c.toLowerCase().replace(/[^a-z]+/g, '-'))}" style="font-size:20px;margin:22px 0 4px">${esc(c)} <span style="color:#a8a29e;font-weight:400;font-size:14px">${cats[c].length}</span></h2><div class="grid">${cats[c].map(i => `<a class="card" href="/keuzehulp/${esc(i.slug)}${esc(pq)}" data-t="${esc((i.title + ' ' + i.slug + ' ' + i.cat).toLowerCase())}"><div class="cat">${esc(i.cat)}</div><h3>${esc(i.title)}</h3><p>${esc((i.kort || i.intro).slice(0, 120))}…</p></a>`).join('')}</div>`).join('')}
<div class="txt" id="mis" style="display:none"><h2>Niet gevonden?</h2><p style="margin:0 0 10px">We maken er een keuzehulp van. Laat weten waar je hulp bij wilt:</p><form class="nl-f" style="display:flex;gap:8px;flex-wrap:wrap" onsubmit="return window.__kzVraag(this)"><input name="q" required maxlength="80" placeholder="Bijv. welke e-bike voor woon-werk" style="flex:1 1 220px;font:16px system-ui;padding:12px;border:1.5px solid #d6d3d1;border-radius:10px"><button class="btn" type="submit" style="border:0;cursor:pointer">Vraag aan</button></form><p id="misok" style="display:none;color:#0f766e;font-weight:700;margin:8px 0 0">Dank je — we zetten hem op de lijst.</p></div>
${aboBox(aboV, '', clientId)}
<script>(function(){var z=document.getElementById('zoek');if(!z)return;var t=null;function log(q,n){try{fetch('/api/kz/zoek',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({q:q,n:n}),keepalive:true})}catch(e){}}
z.addEventListener('input',function(){var q=z.value.toLowerCase().trim();var n=0;document.querySelectorAll('.card[data-t]').forEach(function(c){var on=!q||c.getAttribute('data-t').indexOf(q)>=0;c.style.display=on?'':'none';if(on)n++});document.querySelectorAll('h2[id]').forEach(function(h){var g=h.nextElementSibling;var any=g&&[].some.call(g.querySelectorAll('.card'),function(c){return c.style.display!=='none'});h.style.display=any?'':'none';if(g)g.style.display=any?'':'none'});var mis=document.getElementById('mis');if(mis){mis.style.display=(q.length>=3&&n===0)?'':'none';var inp=mis.querySelector('input');if(inp&&q.length>=3&&n===0)inp.value=q}clearTimeout(t);if(q.length>=3)t=setTimeout(function(){log(q,n)},900)});
})();</script>
<div class="txt"><h2>Hoe wij kiezen</h2><p>Elke keuzehulp stelt drie vragen die er echt toe doen (maat, gebruik, budget) en zoekt dan in het actuele aanbod van bol naar het product dat daarbij past. We kijken naar de pasvorm bij jouw antwoorden, de beoordeling van kopers en de prijs van vandaag. Er is geen betaalde plaatsing: merken kunnen geen plek kopen.</p></div>`;
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', clickid || src ? 'no-store' : 'public, max-age=600');
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite', name: SITE.name, url: base, inLanguage: 'nl', description: SITE.tagline }, { '@type': 'Organization', name: SITE.name, url: base, email: SITE.email }, { '@type': 'ItemList', itemListElement: items.map((i, n) => ({ '@type': 'ListItem', position: n + 1, name: i.title, url: base + pathOf(req, '/keuzehulp/' + i.slug) })) }] });
  return res.status(200).send(shell(SITE.name + ' — in 3 vragen naar het juiste product', SITE.tagline, body, base + pathOf(req, '/keuzehulp'), ld));
}

// ---------- mail (Resend): welkomstmail direct, elke ochtend de nieuwe keuzehulp ----------
// afzender: nieuw@keuzehulp.best zodra het domein in Resend geverifieerd is; tot die tijd automatisch het al geverifieerde domein (NL_FROM_FALLBACK)
const FROM = () => process.env.KZ_FROM || ('Keuzehulp <nieuw@' + (SITE.domain || 'keuzehulp.best') + '>');
const FALLBACK = () => process.env.NL_FROM_FALLBACK || 'Keuzehulp <deals@lastingchange.works>';
const domainErr = (status, j) => status === 403 || /domain|verif|not allowed/i.test(String(j && (j.message || j.name) || ''));
async function fromAddr() { try { const c = await kv.get('hjdk:kz:from'); if (c && c.from && Date.now() - c.at < 6 * 3600 * 1000) return c.from; } catch (e) {} return FROM(); }
let domainSeen = false;
async function domainOk() { try { return !!(await kv.get('hjdk:kz:domainok')); } catch (e) { return false; } }
async function mailBase() { return (await domainOk()) ? DOMAIN : 'https://hjdk-api.vercel.app/keuzehulp'; }
const linkTo = (base, slug, qs) => base + '/' + slug + (qs ? '?' + qs : '');
const apiTo = base => base.replace(/\/keuzehulp$/, '') + '/api/kz';
const MS = [t => 'Nieuw vandaag: ' + t, t => t + ' — in 3 vragen naar het juiste', t => 'Je dagelijkse keuzehulp: ' + t.replace(/\?$/, '')];
function mailCard(i, href, badge) { return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;margin:0 0 12px"><tr><td style="padding:14px;font:15px/1.45 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:#111">' + (badge ? '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;font-weight:700;margin-bottom:4px">' + esc(badge) + '</div>' : '') + '<a href="' + esc(href) + '" style="color:#111;text-decoration:none;font-weight:700;font-size:17px">' + esc(i.title) + '</a><div style="color:#374151;margin:6px 0 10px">' + esc(i.kort || i.intro) + '</div><a href="' + esc(href) + '" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:9px;font-size:14px">Doe de keuzehulp →</a></td></tr></table>'; }
async function wrapMail(base, email, m, headline, intro, cards) {
  const t = await sig(email); const api = apiTo(base); const unsub = api + '/unsub?e=' + encodeURIComponent(email) + '&t=' + t; const px = api + '/o?m=' + encodeURIComponent(m) + '&e=' + encodeURIComponent(email);
  return '<div style="font:16px/1.5 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:#111;max-width:560px;margin:0 auto;padding:20px 16px"><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:6px">' + esc(SITE.name) + ' · elke dag één nieuwe</div><h1 style="font-size:22px;line-height:1.2;margin:0 0 8px">' + esc(headline) + '</h1><p style="color:#374151;margin:0 0 18px">' + esc(intro) + '</p>' + cards + '<p style="color:#374151;font-size:14px;margin:18px 0 0;border-top:1px solid #e5e7eb;padding-top:12px"><b>Mis je een keuzehulp?</b> Antwoord gewoon op deze mail, of spreek hem in op <a href="' + esc(base) + '#vraag" style="color:#0f766e">' + esc(base.replace(/^https?:\/\//, '')) + '</a>. We maken hem.</p><p style="color:#6b7280;font-size:12px;margin:12px 0 0">Adviezen noemen producten met de prijs van die dag bij bol; links naar bol zijn partnerlinks (wij krijgen een kleine vergoeding, jij betaalt niets extra). ' + esc(SITE.owner) + '. <a href="' + esc(unsub) + '" style="color:#6b7280">Afmelden</a> kan altijd met één klik.</p><img src="' + esc(px) + '" width="1" height="1" alt="" style="display:block"></div>';
}
async function sendMail(key, to, subject, html, extra) {
  let from = await fromAddr();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ from, to: [to], subject, html, reply_to: SITE.email }, extra || {})) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { try { await kv.set('hjdk:kz:from', { from, at: Date.now() }); } catch (e) {} return { sent: true, id: j.id, from }; }
      if (attempt === 0 && from !== FALLBACK() && domainErr(r.status, j)) { from = FALLBACK(); continue; }
      return { sent: false, why: 'resend ' + r.status + ' ' + String(j.message || j.name || '').slice(0, 120) };
    } catch (e) { return { sent: false, why: String(e && e.message || e).slice(0, 120) }; }
  }
  return { sent: false, why: 'resend' };
}
async function kzWelcome(sub) {
  const key = await resendKey(); if (!key) return { sent: false, why: 'RESEND_API_KEY ontbreekt' };
  const items = await allItems(); const base = await mailBase(); const U = await usage(); const m = 'welkom';
  const nieuw = newest(items); const here = sub.slug ? items.find(i => i.slug === sub.slug) : null;
  const pop = items.filter(i => i.slug !== (nieuw && nieuw.slug) && i.slug !== (here && here.slug)).map(i => Object.assign({}, i, { _s: U[i.slug] ? U[i.slug].clk * 5 + U[i.slug].adv * 2 + U[i.slug].page : 0 })).sort((a, b) => b._s - a._s).slice(0, 3);
  let cards = '';
  if (nieuw) cards += mailCard(nieuw, linkTo(base, nieuw.slug, 'utm_source=mail&m=' + m), nieuw.publishAt === TODAY() ? 'Nieuw vandaag' : 'De nieuwste');
  if (here && here.slug !== (nieuw && nieuw.slug)) cards += mailCard(here, linkTo(base, here.slug, 'utm_source=mail&m=' + m), 'Waar je net was');
  if (pop.length) cards += '<div style="font-weight:700;margin:14px 0 8px">Meest gebruikt deze week:</div>' + pop.map(i => mailCard(i, linkTo(base, i.slug, 'utm_source=mail&m=' + m))).join('');
  const html = await wrapMail(base, sub.email, m, 'Je zit erbij. Dit is je eerste keuzehulp.', 'Elke ochtend krijg je één nieuwe keuzehulp: drie vragen, één eerlijk advies, de prijs van die dag bij bol. Vandaag alvast deze.', cards);
  return sendMail(key, sub.email, 'Je eerste keuzehulp — en morgen de volgende', html);
}
// melding aan jou bij een verzoek (tekst of ingesproken; audio als bijlage)
async function notifyVraag(v, audioB64, mime) {
  const key = await resendKey(); if (!key) return { sent: false };
  const html = '<div style="font:15px system-ui"><p><b>Nieuw verzoek voor een keuzehulp</b></p><p>' + esc(v.q || '(ingesproken, zie bijlage)') + '</p><p style="color:#6b7280">van: ' + esc(v.email || 'anoniem') + ' · pagina: ' + esc(v.slug || 'start') + '</p></div>';
  const extra = audioB64 ? { attachments: [{ filename: 'verzoek.' + (/ogg/.test(mime || '') ? 'ogg' : /mp4|m4a/.test(mime || '') ? 'm4a' : 'webm'), content: audioB64 }] } : {};
  if (v.email) extra.reply_to = v.email;
  return sendMail(key, SITE.email, 'Keuzehulp gevraagd: ' + String(v.q || 'ingesproken').slice(0, 60), html, extra);
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const op = url.searchParams.get('op') || '';
  if (req.method === 'OPTIONS') return res.status(204).end();
  try { const host = String(req.headers.host || ''); if (SITE.domain && host === SITE.domain && !domainSeen) { domainSeen = true; await kv.set('hjdk:kz:domainok', { at: Date.now() }); } } catch (e) {} /* eigen domein gezien -> mails linken ernaar */
  const slug = (url.searchParams.get('slug') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
  try {
    if (op === 'advies') {
      res.setHeader('cache-control', 'no-store'); res.setHeader('access-control-allow-origin', '*');
      const item = await getItem(slug); if (!item) return res.status(404).json({ ok: false, error: 'onbekend' });
      const route = String(url.searchParams.get('a') || '').split('-').map(x => Math.max(0, Math.min(9, parseInt(x, 10) || 0))).slice(0, item.questions.length); while (route.length < item.questions.length) route.push(0);
      const z = String(url.searchParams.get('z') || '').replace(/\D/g, '').slice(0, 12), c = String(url.searchParams.get('c') || '').replace(/[^a-z0-9]/g, '').slice(0, 10);
      const adv = await advise(item, route, (z ? '-Z' + z : '') + (c ? '-' + c : '')); return res.status(200).json({ ok: true, slug: item.slug, route: route.join('-'), term: adv.term, products: adv.products });
    }
    /* ---------- meldingen (web push) ---------- */
    if (op === 'sw') { // service worker op /sw.js: haalt bij elke push zelf de tekst op en opent bij een klik de juiste keuzehulp
      res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('service-worker-allowed', '/'); res.setHeader('cache-control', 'no-cache');
      return res.status(200).send(`self.addEventListener('install',function(e){self.skipWaiting()});self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('push',function(e){e.waitUntil(self.registration.pushManager.getSubscription().then(function(s){return fetch('/api/kz/pushmsg',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({e:s&&s.endpoint})})}).then(function(r){return r.json()}).catch(function(){return null}).then(function(m){if(!m||!m.title)m={title:'Keuzehulp',body:'Er is nieuws over een keuzehulp die je volgt.',url:'/keuzehulp?utm_source=push'};return self.registration.showNotification(m.title,{body:m.body,icon:'/img/kz-teal.png',badge:'/img/kz-teal.png',tag:m.tag||'kz',data:{url:m.url}})}))});
self.addEventListener('notificationclick',function(e){e.notification.close();var u=(e.notification.data&&e.notification.data.url)||'/keuzehulp';e.waitUntil(self.clients.openWindow(u))});`);
    }
    if (op === 'vapid') { res.setHeader('cache-control', 'public, max-age=3600'); const v = await vapid(); return res.status(200).json({ key: v.pub }); }
    if (op === 'pushsub') { // aanmelden voor meldingen bij één keuzehulp (met de antwoordroute, zodat het prijsalarm over jouw advies gaat)
      if (req.method !== 'POST') return res.status(405).end(); res.setHeader('cache-control', 'no-store'); let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      const ep = String(b.sub && b.sub.endpoint || ''); if (!/^https:\/\//.test(ep) || ep.length > 800) return res.status(400).json({ ok: false, error: 'ongeldig' });
      const sl = String(b.slug || '').replace(/[^a-z0-9-]/g, '').slice(0, 60); const item = sl ? await getItem(sl) : null; if (!item) return res.status(400).json({ ok: false, error: 'onbekende keuzehulp' });
      const r = String(b.r || '').replace(/[^0-9-]/g, '').slice(0, 20); const h = subHash(ep);
      const cur = (await kv.get('hjdk:kz:ps:' + h)) || { e: ep, at: Date.now(), slugs: {}, last: 0, zone: String(b.zone || '').replace(/\D/g, '').slice(0, 12), v: parseInt(b.v, 10) || 0 };
      const nieuwSlug = !cur.slugs[sl]; cur.slugs[sl] = r || cur.slugs[sl] || ''; cur.e = ep; await kv.set('hjdk:kz:ps:' + h, cur);
      if (nieuwSlug) { const lk = 'hjdk:kz:pslug:' + sl; const l = (await kv.get(lk)) || []; if (l.indexOf(h) < 0) { l.push(h); await kv.set(lk, l.slice(-20000)); } const all = (await kv.get('hjdk:kz:pall')) || []; if (all.indexOf(h) < 0) { all.push(h); await kv.set('hjdk:kz:pall', all.slice(-50000)); } }
      try { await kv.incrMany([['c:hjdk6-kz-push-subs', nieuwSlug ? 1 : 0]].filter(x => x[1])); } catch (e) {}
      return res.status(200).json({ ok: true, nieuw: nieuwSlug });
    }
    if (op === 'pushmsg') { // de service worker vraagt de tekst van de melding op
      res.setHeader('cache-control', 'no-store'); let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      const ep = String(b.e || ''); const h = ep ? subHash(ep) : ''; let m = null;
      if (h) { const q = (await kv.get('hjdk:kz:pq:' + h)) || []; m = q.shift() || null; await kv.set('hjdk:kz:pq:' + h, q, { ex: 14 * 86400 }); }
      if (m) { try { await kv.incrMany([['c:hjdk6-kz-push-shown', 1], ['c:hjdk6-kz-pm-' + m.id + '-shown', 1]]); } catch (e) {} }
      return res.status(200).json(m || {});
    }
    if (op === 'notify' || op === 'pushwatch') { // notify (sleutel): eigen bericht naar volgers van een keuzehulp; pushwatch (cron): prijsalarm en beter model per gevolgde antwoordroute
      res.setHeader('cache-control', 'no-store');
      const wk = process.env.KZ_WRITE_KEY || (await secrets()).KZ_WRITE_KEY || ''; const tok = url.searchParams.get('token') || req.headers['x-hjdk-token'] || '';
      if (op === 'notify' && !((process.env.HJDK_TOKEN && tok === process.env.HJDK_TOKEN) || (wk && tok === wk))) return res.status(401).json({ error: 'token' });
      let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      const P = k => String(b[k] != null ? b[k] : (url.searchParams.get(k) || ''));
      const base = await mailBase(); const now = Date.now(); const out = { ok: true, verstuurd: 0, overgeslagen_week: 0, weg: 0, fout: 0, berichten: [] };
      // berichten bepalen: [{slug, route|null, title, body}]
      const msgs = [];
      if (op === 'notify') { const sl = P('slug').replace(/[^a-z0-9-]/g, ''); const t = P('title').slice(0, 60), bd = P('body').slice(0, 160); if (!sl || !t || !bd) return res.status(400).json({ ok: false, error: 'slug, title en body nodig' }); if (!(await getItem(sl))) return res.status(400).json({ ok: false, error: 'onbekende keuzehulp' }); msgs.push({ slug: sl, route: null, title: t, body: bd }); }
      else { // per keuzehulp met volgers: per gevolgde route het beste advies vergelijken met vorige keer
        const items = await allItems(); for (const it of items) { const l = (await kv.get('hjdk:kz:pslug:' + it.slug)) || []; if (!l.length) continue;
          const subs = (await kv.mget(...l.slice(0, 500).map(h => 'hjdk:kz:ps:' + h))).filter(Boolean); const routes = new Set(subs.map(x => (x.slugs && x.slugs[it.slug]) || '').map(r => r || it.questions.map(() => 0).join('-')));
          for (const r of routes) { const route = r.split('-').map(x => parseInt(x, 10) || 0); const adv = await advise(it, route, '-push'); const best = (adv.products || []).find(p => p.price != null); if (!best) continue;
            const wkey = 'hjdk:kz:pw:' + it.slug + ':' + r; const prev = await kv.get(wkey); await kv.set(wkey, { id: best.id, price: best.price, title: best.title, at: now });
            if (!prev) continue; const kort = String(best.title).split(/[,(|]/)[0].slice(0, 70);
            if (prev.id === best.id && best.price <= prev.price * 0.92) msgs.push({ slug: it.slug, route: r, def: it.questions.map(() => 0).join('-'), title: 'Prijsdaling: ' + (it.term || it.title).slice(0, 40), body: kort + ' nu ' + eur(best.price) + ' (was ' + eur(prev.price) + ').' });
            else if (prev.id !== best.id && prev.at < now - 2 * 86400 * 1000) msgs.push({ slug: it.slug, route: r, def: it.questions.map(() => 0).join('-'), title: 'Nieuw advies: ' + (it.term || it.title).slice(0, 40), body: 'Voor jouw antwoorden is nu dit de beste keus: ' + kort + ' (' + eur(best.price) + ').' }); } } }
      for (const m of msgs) { const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); const l = (await kv.get('hjdk:kz:pslug:' + m.slug)) || []; let sent = 0;
        const murl = base + '/keuzehulp/' + m.slug + '?utm_source=push&m=' + id + (m.route ? '#a=' + m.route : '');
        for (let i = 0; i < l.length; i += 25) { const chunk = l.slice(i, i + 25); const subs = await kv.mget(...chunk.map(h => 'hjdk:kz:ps:' + h));
          await Promise.all(chunk.map(async (h, j) => { const sb = subs[j]; if (!sb || !sb.e) return; if (m.route && ((sb.slugs && sb.slugs[m.slug]) || m.def) !== m.route) return; if (!sb.slugs || !(m.slug in sb.slugs)) return; if (sb.last && now - sb.last < PUSH_GAP) { out.overgeslagen_week++; return; }
            const q = (await kv.get('hjdk:kz:pq:' + h)) || []; q.push({ id, title: m.title, body: m.body, url: murl, tag: 'kz-' + m.slug }); await kv.set('hjdk:kz:pq:' + h, q.slice(-3), { ex: 14 * 86400 });
            const r = await sendPush(sb.e); if (r.ok) { sent++; sb.last = now; await kv.set('hjdk:kz:ps:' + h, sb); } else if (r.gone) { out.weg++; await kv.set('hjdk:kz:ps:' + h, { dood: now }, { ex: 60 }); } else out.fout++; })); }
        out.verstuurd += sent; const log = (await kv.get('hjdk:kz:pmsgs')) || []; log.unshift({ id, slug: m.slug, route: m.route, title: m.title, body: m.body, at: now, verstuurd: sent }); await kv.set('hjdk:kz:pmsgs', log.slice(0, 100)); out.berichten.push({ id, slug: m.slug, title: m.title, verstuurd: sent });
        try { await kv.incrMany([['c:hjdk6-kz-push-sent', sent || 0], ['c:hjdk6-kz-pm-' + id + '-sent', sent || 0]].filter(x => x[1])); } catch (e) {} }
      return res.status(200).json(out);
    }
    if (op === 'trends') { // cron (dagelijks): Google Trends NL ophalen en bewaren; koppelen aan keuzehulpen
      res.setHeader('cache-control', 'no-store'); let terms = [];
      try { const r = await fetch('https://trends.google.com/trending/rss?geo=NL', { headers: { 'user-agent': 'Mozilla/5.0 (keuzehulp.best trendcheck)' } }); const xml = await r.text();
        const re = /<item>([\s\S]*?)<\/item>/g; let m; while ((m = re.exec(xml)) && terms.length < 40) { const it = m[1]; const t = (it.match(/<title>(?:<!\[CDATA\[)?([^<\]]+)/) || [])[1]; const tr = (it.match(/<ht:approx_traffic>([^<]+)/) || [])[1]; const news = (it.match(/<ht:news_item_title>(?:<!\[CDATA\[)?([^<\]]+)/) || [])[1]; if (t) terms.push({ t: t.trim(), traffic: String(tr || '').trim(), nieuws: String(news || '').trim().slice(0, 120) }); } } catch (e) { return res.status(200).json({ ok: false, why: String(e && e.message || e).slice(0, 120) }); }
      const items = await allItems(); terms.forEach(x => { x.keuzehulpen = matchTrend(x.t, items).slice(0, 5); });
      try { await kv.set('hjdk:kz:trends', { at: Date.now(), dag: TODAY(), terms }); const hist = (await kv.get('hjdk:kz:trends:log')) || []; hist.unshift({ dag: TODAY(), terms: terms.slice(0, 20).map(x => x.t) }); await kv.set('hjdk:kz:trends:log', hist.slice(0, 60)); } catch (e) {}
      return res.status(200).json({ ok: true, n: terms.length, metKeuzehulp: terms.filter(x => x.keuzehulpen.length).length, terms });
    }
    if (op === 'put') { // cloudtaak voegt nieuwe keuzehulpen toe (HJDK_TOKEN of KZ_WRITE_KEY van /setup)
      const wk = process.env.KZ_WRITE_KEY || (await secrets()).KZ_WRITE_KEY || ''; const tok = url.searchParams.get('token') || '';
      if (req.method !== 'POST' || !tok || !((process.env.HJDK_TOKEN && tok === process.env.HJDK_TOKEN) || (wk && tok === wk))) return res.status(401).json({ error: 'token' });
      let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      if (!b.slug || !b.title || !Array.isArray(b.questions) || b.questions.length < 2) return res.status(400).json({ error: 'slug, title, questions[] verplicht' });
      const s = String(b.slug).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60); b.slug = s;
      await kv.set('hjdk:kz:' + s, b); const idx = (await kv.get('hjdk:kz:index')) || []; if (idx.indexOf(s) < 0) { idx.push(s); await kv.set('hjdk:kz:index', idx); }
      return res.status(200).json({ ok: true, url: '/keuzehulp/' + s, total: seed.items.length + idx.length });
    }
    if (op === 'zoek') { // zoekopdrachten op de startpagina bewaren: welke onderwerpen missen we?
      if (req.method !== 'POST') return res.status(405).end(); let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      const q = String(b.q || '').toLowerCase().replace(/[^a-z0-9 \-]/g, '').trim().slice(0, 60); const n = Number(b.n) || 0; if (q.length < 3) return res.status(200).json({ ok: false });
      try { await kv.incrMany([['c:hjdk6-kzq-' + q.replace(/\s+/g, '_'), 1], [n === 0 ? 'c:hjdk6-kzq0-' + q.replace(/\s+/g, '_') : 'c:hjdk6-kzq-hits', 1]]); } catch (e) {}
      return res.status(200).json({ ok: true });
    }
    if (op === 'vraag') { // verzoek: "maak een keuzehulp voor ..." — getypt of ingesproken (audio base64, max ~700 KB, 60 dagen bewaard, ook als bijlage naar jou gemaild)
      if (req.method !== 'POST') return res.status(405).end(); let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      const q = String(b.q || '').trim().slice(0, 120); const email = String(b.email || '').trim().toLowerCase().slice(0, 120); const audio = typeof b.audio === 'string' && b.audio.length > 100 && b.audio.length < 1000000 ? b.audio : '';
      if (q.length < 3 && !audio) return res.status(400).json({ ok: false });
      const v = { q, email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : '', slug: String(b.slug || '').replace(/[^a-z0-9-]/g, '').slice(0, 60), at: Date.now(), audio: audio ? 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) : '' };
      try { if (audio) await kv.set('hjdk:kz:audio:' + v.audio, { mime: String(b.mime || 'audio/webm').slice(0, 40), b64: audio }, { ex: 60 * 86400 }); const list = (await kv.get('hjdk:kz:vragen')) || []; list.unshift(v); await kv.set('hjdk:kz:vragen', list.slice(0, 2000)); await kv.incr('c:hjdk6-kz-vraag'); } catch (e) {}
      let mail = null; try { mail = await notifyVraag(v, audio, b.mime); } catch (e) {}
      return res.status(200).json({ ok: true, mail: mail && mail.sent });
    }
    if (op === 'audio') { // ingesproken verzoek terugluisteren (token)
      if (!process.env.HJDK_TOKEN || url.searchParams.get('token') !== process.env.HJDK_TOKEN) return res.status(401).json({ error: 'token' });
      const a = await kv.get('hjdk:kz:audio:' + String(url.searchParams.get('id') || '').replace(/[^a-z0-9]/g, '')); if (!a) return res.status(404).end();
      res.setHeader('content-type', a.mime || 'audio/webm'); return res.status(200).send(Buffer.from(a.b64, 'base64'));
    }
    if (op === 'abo') { // inschrijven: e-mail of Google One Tap; ontdubbeld; direct welkomstmail; inschrijving telt als conversie voor betaald verkeer
      if (req.method !== 'POST') return res.status(405).end(); res.setHeader('cache-control', 'no-store'); let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      let email = '', src = 'email'; if (b.credential) { email = await emailFromCredential(String(b.credential)) || ''; src = 'google'; if (!email) return res.status(400).json({ ok: false, error: 'Google-aanmelding niet geldig' }); }
      else email = String(b.email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 120) return res.status(400).json({ ok: false, error: 'Dat lijkt geen e-mailadres' });
      const slug = String(b.slug || '').replace(/[^a-z0-9-]/g, '').slice(0, 60), v = Math.max(0, Math.min(ABO.length - 1, parseInt(b.v, 10) || 0)), zone = String(b.zone || '').replace(/\D/g, '').slice(0, 12), cid = String(b.cid || '').replace(/[^a-z0-9]/g, '').slice(0, 10);
      const sub = { email, at: Date.now(), slug, src, v, zone, cid };
      const existed = await kv.get('hjdk:kz:sub:' + email);
      if (!existed) { await kv.set('hjdk:kz:sub:' + email, sub); const list = (await kv.get(LIST)) || []; list.push(sub); await kv.set(LIST, list.slice(-20000)); try { await kv.incrMany([['c:hjdk6-kz-subs', 1], ['c:hjdk6-kz-abo-src-' + src, 1], ['c:hjdk6-kz-abo-v' + v + '-ok', 1]].concat(zone ? [['c:hjdk6-kz-paid-' + zone + '-sub', 1], ['c:hjdk6-kz-paid-sub', 1]] : [])); } catch (e) {} }
      let mail = { sent: false, why: 'bestond al' };
      if (!existed) { try { mail = await kzWelcome(sub); } catch (e) { mail = { sent: false, why: String(e && e.message || e).slice(0, 100) }; } if (!mail.sent) { try { const pend = (await kv.get('hjdk:kz:pending')) || []; pend.push(sub); await kv.set('hjdk:kz:pending', pend.slice(-5000)); } catch (e) {} } try { await kv.incr('c:hjdk6-kz-welkom-' + (mail.sent ? 'ok' : 'fail')); } catch (e) {} }
      return res.status(200).json({ ok: true, nieuw: !existed, mail: mail.sent });
    }
    if (op === 'dag') { // cron (elke 15 min, 06:00–08:45 UTC): de keuzehulp van vandaag naar alle abonnees, per ronde 100 (Resend batch); eerst wachtende welkomstmails
      res.setHeader('cache-control', 'no-store'); const key = await resendKey(); if (!key) return res.status(200).json({ ok: false, why: 'RESEND_API_KEY ontbreekt' });
      const out = { ok: true, welkomAlsnog: 0 };
      try { const pend = (await kv.get('hjdk:kz:pending')) || []; const rest = []; for (const sub of pend.slice(0, 50)) { const r = await kzWelcome(sub); if (r.sent) out.welkomAlsnog++; else rest.push(sub); } await kv.set('hjdk:kz:pending', rest.concat(pend.slice(50))); } catch (e) {}
      const items = await allItems(); const d = TODAY(); const today = items.find(i => i.publishAt === d);
      if (!today) return res.status(200).json(Object.assign(out, { vandaag: null, why: 'geen keuzehulp met publishAt ' + d }));
      const ck = 'hjdk:kz:camp:' + d; let camp = await kv.get(ck);
      if (!camp) { camp = { slug: today.slug, cursor: 0, sent: 0, fail: 0, s: await pickVariant('hjdk6-kz-ms', MS.length, 'clk', 'sent') }; await kv.set(ck, camp, { ex: 3 * 86400 }); }
      const list = (await kv.get(LIST)) || []; const unsubs = new Set(((await kv.get('hjdk:kz:unsubs')) || []));
      const batch = list.slice(camp.cursor, camp.cursor + 100).filter(s => !unsubs.has(s.email)); const m = 'd' + d.replace(/-/g, '').slice(2); const base = await mailBase(); const subject = MS[camp.s](today.title);
      if (!list.slice(camp.cursor, camp.cursor + 100).length) return res.status(200).json(Object.assign(out, { vandaag: today.slug, klaar: true, verstuurd: camp.sent, abonnees: list.length }));
      const U = await usage(); const szNow = seasonsNow(); const szItem = szNow.length ? szNow[0].slugs.map(sl => items.find(i => i.slug === sl && i.slug !== today.slug)).filter(Boolean)[Math.floor(Math.random() * 3)] : null;
      const pop = items.filter(i => i.slug !== today.slug && (!szItem || i.slug !== szItem.slug)).map(i => Object.assign({}, i, { _s: U[i.slug] ? U[i.slug].clk * 5 + U[i.slug].adv * 2 + U[i.slug].page : 0 })).sort((a, b) => b._s - a._s).slice(0, szItem ? 1 : 2); if (szItem) pop.unshift(Object.assign({}, szItem, { _sz: szNow[0].naam }));
      const emails = []; let from = await fromAddr();
      for (const sub of batch) { const cards = mailCard(today, linkTo(base, today.slug, 'utm_source=mail&m=' + m + '&s=' + camp.s), 'Nieuw vandaag') + (pop.length ? '<div style="font-weight:700;margin:14px 0 8px">Ook nu:</div>' + pop.map(i => mailCard(i, linkTo(base, i.slug, 'utm_source=mail&m=' + m + '&s=' + camp.s), i._sz ? 'Nu actueel: ' + i._sz : '')).join('') : '');
        emails.push({ from, to: [sub.email], subject, reply_to: SITE.email, html: await wrapMail(base, sub.email, m, today.h1 || today.title, today.kort || today.intro, cards) }); }
      let r = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify(emails) }); let j = await r.json().catch(() => ({}));
      if (!r.ok && from !== FALLBACK() && domainErr(r.status, j)) { from = FALLBACK(); emails.forEach(e => { e.from = from; }); r = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify(emails) }); j = await r.json().catch(() => ({})); }
      if (r.ok) { camp.sent += emails.length; try { await kv.set('hjdk:kz:from', { from, at: Date.now() }); await kv.incrMany([['c:hjdk6-kz-ms-v' + camp.s + '-sent', emails.length], ['c:hjdk6-kz-mail-' + m + '-sent', emails.length]]); } catch (e) {} } else camp.fail += emails.length;
      camp.cursor += 100; await kv.set(ck, camp, { ex: 3 * 86400 });
      return res.status(200).json(Object.assign(out, { vandaag: today.slug, onderwerp: subject, ronde: emails.length, verstuurd: camp.sent, mislukt: camp.fail, abonnees: list.length, resend: r.ok ? 'ok' : String(j.message || r.status).slice(0, 100) }));
    }
    if (op === 'inbound') { // Resend-webhook (email.received): mail aan @keuzehulp.best ophalen en doorsturen naar jouw Gmail, met reply-to = afzender
      if (req.method !== 'POST') return res.status(405).end(); res.setHeader('cache-control', 'no-store'); let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      const d = b.data || {}; const id = String(d.email_id || d.id || '').replace(/[^a-z0-9-]/gi, '').slice(0, 60);
      if (b.type && b.type !== 'email.received') return res.status(200).json({ ok: true, skipped: b.type });
      if (!id) return res.status(400).json({ ok: false, error: 'email_id ontbreekt' });
      const key = await resendKey(); if (!key) return res.status(200).json({ ok: false, why: 'RESEND_API_KEY ontbreekt' });
      try { if (await kv.get('hjdk:kz:in:' + id)) return res.status(200).json({ ok: true, dup: true }); } catch (e) {}
      const H = { authorization: 'Bearer ' + key };
      const r = await fetch('https://api.resend.com/emails/receiving/' + id, { headers: H }); const m = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(200).json({ ok: false, why: 'ophalen ' + r.status + ' ' + String(m.message || '').slice(0, 100) });
      const from = String(m.from || d.from || ''); const to = [].concat(m.to || d.to || []).join(', '); const subject = String(m.subject || d.subject || '(geen onderwerp)');
      const attachments = []; try { const ar = await fetch('https://api.resend.com/emails/receiving/' + id + '/attachments', { headers: H }); const aj = await ar.json().catch(() => ({})); let total = 0;
        for (const a of (aj.data || aj.attachments || [])) { const u = a.download_url || a.url; if (!u || total > 8e6) continue; const f = await fetch(u); if (!f.ok) continue; const buf = Buffer.from(await f.arrayBuffer()); total += buf.length; attachments.push({ filename: a.filename || a.name || 'bijlage', content: buf.toString('base64') }); } } catch (e) {}
      const fwd = process.env.KZ_FORWARD_TO || SITE.forward || 'henkjandekrijger@gmail.com';
      const head = '<div style="font:13px system-ui;color:#6b7280;border-bottom:1px solid #e5e7eb;padding:0 0 8px;margin:0 0 12px">Doorgestuurd van ' + esc(SITE.name) + ' · van: <b>' + esc(from) + '</b> · aan: ' + esc(to) + ' · beantwoorden gaat rechtstreeks naar de afzender</div>';
      const html = head + (m.html || ('<pre style="font:15px system-ui;white-space:pre-wrap">' + esc(m.text || '') + '</pre>'));
      const fm = from.match(/<([^>]+)>/); const replyTo = (fm ? fm[1] : from).trim();
      let sent = { sent: false }; try { sent = await sendMail(key, fwd, 'Fwd: ' + subject, html, Object.assign({ reply_to: /^[^@\s]+@[^@\s]+$/.test(replyTo) ? replyTo : SITE.email }, attachments.length ? { attachments } : {})); } catch (e) { sent = { sent: false, why: String(e && e.message || e).slice(0, 100) }; }
      try { await kv.set('hjdk:kz:in:' + id, { at: Date.now(), from, subject, ok: sent.sent }, { ex: 14 * 86400 }); await kv.incr('c:hjdk6-kz-inbound-' + (sent.sent ? 'ok' : 'fail')); const log = (await kv.get('hjdk:kz:inbox')) || []; log.unshift({ id, at: Date.now(), from, subject, ok: sent.sent }); await kv.set('hjdk:kz:inbox', log.slice(0, 300)); } catch (e) {}
      return res.status(200).json({ ok: true, forwarded: sent.sent, to: fwd, why: sent.why });
    }
    if (op === 'o') { res.setHeader('cache-control', 'no-store'); const m = String(url.searchParams.get('m') || '').replace(/[^a-z0-9]/gi, '').slice(0, 12); try { await kv.incrMany([['c:hjdk6-kz-mail-open', 1]].concat(m ? [['c:hjdk6-kz-mail-' + m + '-open', 1]] : [])); } catch (e) {} res.setHeader('content-type', 'image/gif'); return res.status(200).send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')); }
    if (op === 'unsub') { const e = String(url.searchParams.get('e') || '').toLowerCase(), t = String(url.searchParams.get('t') || ''); res.setHeader('content-type', 'text/html; charset=utf-8');
      if (!e || t !== await sig(e)) return res.status(400).send(shell('Afmelden', '', '<div class="hero"><h1>Deze afmeldlink klopt niet</h1><p>Mail ' + esc(SITE.email) + ' en we halen je er direct af.</p></div>'));
      try { const u = (await kv.get('hjdk:kz:unsubs')) || []; if (u.indexOf(e) < 0) { u.push(e); await kv.set('hjdk:kz:unsubs', u); } const list = (await kv.get(LIST)) || []; await kv.set(LIST, list.filter(s => s.email !== e)); await kv.incr('c:hjdk6-kz-unsub'); } catch (x) {}
      return res.status(200).send(shell('Afgemeld', '', '<div class="hero"><h1>Je bent afgemeld</h1><p>Je krijgt geen mails meer van ' + esc(SITE.name) + '. De keuzehulpen blijven gewoon gratis te gebruiken: <a href="/keuzehulp">alle keuzehulpen →</a></p></div>')); }
    if (op === 'subs') { if (!process.env.HJDK_TOKEN || url.searchParams.get('token') !== process.env.HJDK_TOKEN) return res.status(401).json({ error: 'token' }); const list = (await kv.get(LIST)) || []; if (url.searchParams.get('csv')) { res.setHeader('content-type', 'text/csv'); return res.status(200).send('email,datum,pagina,bron\n' + list.map(s => s.email + ',' + new Date(s.at).toISOString().slice(0, 10) + ',' + (s.slug || '') + ',' + (s.src || '')).join('\n')); } return res.status(200).json({ ok: true, n: list.length, subs: list }); }
    if (op === 'gezocht' || op === 'stats' || op === 'status') { // beheer (token): alles; status (zonder token): alleen aantallen, geen adressen/verzoeken — voor de cloudbewaker
      const openbaar = op === 'status'; res.setHeader('cache-control', 'no-store');
      if (!openbaar && (!process.env.HJDK_TOKEN || url.searchParams.get('token') !== process.env.HJDK_TOKEN)) return res.status(401).json({ error: 'token' });
      const miss = {}, all = {}; let cursor = '0';
      try { const t1 = Date.now(); for (let i = 0; i < 5000 && Date.now() - t1 < 5000; i++) { const [c, keys] = await kv.scan(cursor, { match: 'c:hjdk6-kzq*', count: 5000 }); cursor = c; const vals = keys.length ? await kv.mget(...keys) : []; keys.forEach((k, j) => { const v = Number(vals[j]) || 0; if (k.startsWith('c:hjdk6-kzq0-')) miss[k.slice(13).replace(/_/g, ' ')] = v; else if (k.startsWith('c:hjdk6-kzq-') && k !== 'c:hjdk6-kzq-hits') all[k.slice(12).replace(/_/g, ' ')] = v; }); if (cursor === '0') break; } } catch (e) {}
      const vragen = (await kv.get('hjdk:kz:vragen')) || []; const items = await allItems(); const have = new Set(items.map(i => i.slug));
      const U = await usage(); const funnel = Object.keys(U).filter(s => have.has(s)).map(s => { const b = U[s]; return { slug: s, bezoeken: b.page, vraag1: b.q0, vraag2: b.q1, vraag3: b.q2, advies: b.adv, bolKliks: b.clk, afgehaakt_voor_vraag1: Math.max(0, b.page - b.q0), afgehaakt_voor_advies: Math.max(0, b.q0 - b.adv), klik_pct: b.adv ? Math.round(b.clk / b.adv * 1000) / 10 : null }; }).sort((a, b) => b.bezoeken - a.bezoeken);
      const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 100).map(([q, n]) => ({ q, n }));
      // abonnees, mails, aanmeldblok-varianten, betaald verkeer per zone/creative, en de wachtrij (publishAt in de toekomst)
      const cnt = {}; const diag = { scans: 0, sleutels: 0, fout: null }; cursor = '0'; try { const t2 = Date.now(); for (let i = 0; i < 5000 && Date.now() - t2 < 8000; i++) { const [c, keys] = await kv.scan(cursor, { match: 'c:hjdk6-kz*', count: 5000 }); cursor = String(c); diag.scans++; diag.sleutels += keys.length; const vals = keys.length ? await kv.mget(...keys) : []; keys.forEach((k, j) => { if (/^c:hjdk6-kz-(abo|subs|welkom|mail|ms|paid|unsub|vraag|push|pm-)|^c:hjdk6-kzc-/.test(k)) cnt[k.slice(2)] = Number(vals[j]) || 0; }); if (cursor === '0') break; } } catch (e) { diag.fout = String(e && e.message || e).slice(0, 200); }
      try { const dv = await kv.mget('c:hjdk6-kz-paid-view', 'c:hjdk6-kz-thuisbatterij-page', 'c:hjdk6-kz-push-imp', 'c:hjdk6-kz-abo-imp'); diag.direct = { paidView: dv[0], thuisbatterijPage: dv[1], pushImp: dv[2], aboImp: dv[3] }; diag.redisIngesteld = !!(process.env.KV_REDIS_URL || process.env.REDIS_URL); } catch (e) { diag.directFout = String(e && e.message || e).slice(0, 200); }
      const g = k => cnt[k] || 0; const zones = {}, creatives = {};
      Object.keys(cnt).forEach(k => { let m = k.match(/^hjdk6-kz-paid-(\d+)-(view|start|clk|sub)$/); if (m) { const z = zones[m[1]] || (zones[m[1]] = { zone: m[1], bezoeken: 0, gestart: 0, bolKliks: 0, inschrijvingen: 0 }); z[m[2] === 'view' ? 'bezoeken' : m[2] === 'start' ? 'gestart' : m[2] === 'clk' ? 'bolKliks' : 'inschrijvingen'] = cnt[k]; } m = k.match(/^hjdk6-kzc-(\d+)-(view|start|clk)$/); if (m) { const c = creatives[m[1]] || (creatives[m[1]] = { creative: m[1], bezoeken: 0, gestart: 0, bolKliks: 0 }); c[m[2] === 'view' ? 'bezoeken' : m[2] === 'start' ? 'gestart' : 'bolKliks'] = cnt[k]; } });
      const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : null;
      const allF = await allItems(true); const wachtrij = allF.filter(i => i.publishAt && i.publishAt > TODAY()).map(i => ({ slug: i.slug, publishAt: i.publishAt })).sort((a, b) => a.publishAt.localeCompare(b.publishAt));
      const subsList = (await kv.get(LIST)) || [];
      const pmsgs = (await kv.get('hjdk:kz:pmsgs')) || []; const perSlug = Object.keys(cnt).filter(k => /^hjdk6-kz-push-[a-z0-9-]+-ok$/.test(k) && !/^hjdk6-kz-push-v\d+-ok$/.test(k)).map(k => ({ slug: k.slice(14, -3), aangezet: cnt[k] })).sort((a, b) => b.aangezet - a.aangezet);
      const meldingen = { aangezet: g('hjdk6-kz-push-ok'), blokGetoond: g('hjdk6-kz-push-imp'), knopGeklikt: g('hjdk6-kz-push-click'), geweigerd: g('hjdk6-kz-push-denied'), nietOndersteund: g('hjdk6-kz-push-nosupport'), mislukt: g('hjdk6-kz-push-fail'), aanmeld_pct: pct(g('hjdk6-kz-push-ok'), g('hjdk6-kz-push-imp')),
        varianten: PUSH.map((a, i) => ({ v: i, kop: a.h('…'), getoond: g('hjdk6-kz-push-v' + i + '-imp'), aangezet: g('hjdk6-kz-push-v' + i + '-ok'), pct: pct(g('hjdk6-kz-push-v' + i + '-ok'), g('hjdk6-kz-push-v' + i + '-imp')) })), perKeuzehulp: perSlug.slice(0, 30),
        verstuurd: g('hjdk6-kz-push-sent'), getoondOpToestel: g('hjdk6-kz-push-shown'), geklikt: g('hjdk6-kz-push-clk'), laatsteBerichten: pmsgs.slice(0, 10).map(m => ({ id: m.id, slug: m.slug, titel: m.title, at: new Date(m.at).toISOString().slice(0, 16), verstuurd: m.verstuurd, getoond: g('hjdk6-kz-pm-' + m.id + '-shown'), geklikt: g('hjdk6-kz-pm-' + m.id + '-clk') })) };
      const TR = await trendsNow(); const trendsOut = { dag: TR.dag || null, metKeuzehulp: TR.terms.filter(x => x.keuzehulpen && x.keuzehulpen.length).map(x => ({ zoekwoord: x.t, verkeer: x.traffic, keuzehulpen: x.keuzehulpen })), zonderKeuzehulp: TR.terms.filter(x => !(x.keuzehulpen && x.keuzehulpen.length)).map(x => ({ zoekwoord: x.t, verkeer: x.traffic, nieuws: x.nieuws })) }; const seizoen = seasonsNow().map(x => ({ naam: x.naam, tot: x.tot, keuzehulpen: x.slugs.filter(sl => items.some(i => i.slug === sl)), ontbreekt: x.slugs.filter(sl => !items.some(i => i.slug === sl)) }));
      if (openbaar) return res.status(200).json({ ok: true, totaalKeuzehulpen: items.length, wachtrij: wachtrij.length, seizoen, trends: trendsOut, vandaag: (items.find(i => i.publishAt === TODAY()) || {}).slug || null, abonnees: subsList.length, aanmeldblokGetoond: g('hjdk6-kz-abo-imp'), afgemeld: g('hjdk6-kz-unsub'), mailVerstuurd: Object.keys(cnt).filter(k => /^hjdk6-kz-mail-d\d+-sent$/.test(k)).reduce((a, k) => a + cnt[k], 0), mailKliks: g('hjdk6-kz-mail-clk'), verzoeken: vragen.length,
        betaald: { bezoeken: g('hjdk6-kz-paid-view'), gestart: g('hjdk6-kz-paid-start'), bolKliks: g('hjdk6-kz-paid-clk'), inschrijvingen: g('hjdk6-kz-paid-sub'), klik_pct: pct(g('hjdk6-kz-paid-clk'), g('hjdk6-kz-paid-view')), zones: Object.values(zones).sort((a, b) => b.bezoeken - a.bezoeken).slice(0, 40), creatives: Object.values(creatives).sort((a, b) => b.bezoeken - a.bezoeken) },
        trechterTop: funnel.slice(0, 15), zonderResultaat: top(miss).slice(0, 25), meldingen, diag });
      return res.status(200).json({ ok: true, totaalKeuzehulpen: items.length, wachtrij, seizoen, trends: trendsOut, vandaag: (items.find(i => i.publishAt === TODAY()) || {}).slug || null,
        inbox: { doorgestuurd: g('hjdk6-kz-inbound-ok'), mislukt: g('hjdk6-kz-inbound-fail'), laatste: ((await kv.get('hjdk:kz:inbox')) || []).slice(0, 20) }, abonnees: { totaal: subsList.length, viaGoogle: g('hjdk6-kz-abo-src-google'), viaEmail: g('hjdk6-kz-abo-src-email'), afgemeld: g('hjdk6-kz-unsub'), welkomstmailOk: g('hjdk6-kz-welkom-ok'), welkomstmailMislukt: g('hjdk6-kz-welkom-fail'), aanmeldblokGetoond: g('hjdk6-kz-abo-imp'), aanmeld_pct: pct(subsList.length, g('hjdk6-kz-abo-imp')),
          varianten: ABO.map((a, i) => ({ v: i, kop: a.h, getoond: g('hjdk6-kz-abo-v' + i + '-imp'), inschrijvingen: g('hjdk6-kz-abo-v' + i + '-sub'), pct: pct(g('hjdk6-kz-abo-v' + i + '-sub'), g('hjdk6-kz-abo-v' + i + '-imp')) })) },
        mail: { verstuurd: Object.keys(cnt).filter(k => /^hjdk6-kz-mail-d\d+-sent$/.test(k)).reduce((a, k) => a + cnt[k], 0), geopend: g('hjdk6-kz-mail-open'), kliksNaarSite: g('hjdk6-kz-mail-clk'), onderwerpen: MS.map((f, i) => ({ s: i, voorbeeld: f('Welke airfryer past bij jou?'), verstuurd: g('hjdk6-kz-ms-v' + i + '-sent'), kliks: g('hjdk6-kz-ms-v' + i + '-clk') })) },
        betaald: { bezoeken: g('hjdk6-kz-paid-view'), gestart: g('hjdk6-kz-paid-start'), bolKliks: g('hjdk6-kz-paid-clk'), inschrijvingen: g('hjdk6-kz-paid-sub'), klik_pct: pct(g('hjdk6-kz-paid-clk'), g('hjdk6-kz-paid-view')), zones: Object.values(zones).sort((a, b) => b.bezoeken - a.bezoeken), creatives: Object.values(creatives).sort((a, b) => b.bezoeken - a.bezoeken) },
        verzoeken: vragen.slice(0, 200).map(v => Object.assign({}, v, v.audio ? { luister: '/api/kz/audio?id=' + v.audio + '&token=…' } : {})), zonderResultaat: top(miss), alleZoekopdrachten: top(all), trechter: funnel, meldingen });
    }
    if (op === 'list') { const items = await allItems(); return res.status(200).json({ ok: true, n: items.length, items: items.map(i => ({ slug: i.slug, title: i.title, cat: i.cat, pct: i.pct })) }); }
    if (op === 'sitemap') { const items = await allItems(); const base = baseOf(req); res.setHeader('content-type', 'application/xml'); res.setHeader('cache-control', 'public, max-age=3600'); return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ['/keuzehulp', '/keuzehulp/over'].concat(items.map(i => '/keuzehulp/' + i.slug)).map(p => '<url><loc>' + esc(base + pathOf(req, p)) + '</loc><lastmod>' + UPDATED + '</lastmod></url>').join('') + '</urlset>'); }
    if (op === 'robots') { const base = baseOf(req); res.setHeader('content-type', 'text/plain'); return res.status(200).send('User-agent: *\nAllow: /\nDisallow: /setup\nDisallow: /leads\nDisallow: /subs\n\nSitemap: ' + base + pathOf(req, '/keuzehulp/sitemap.xml') + '\n'); }
    if (op === 'llms') { // llms.txt: korte, feitelijke samenvatting per keuzehulp voor AI-assistenten
      const items = await allItems(); const base = baseOf(req); res.setHeader('content-type', 'text/plain; charset=utf-8');
      return res.status(200).send('# ' + SITE.name + '\n\n> ' + SITE.tagline + ' Onafhankelijke keuzehulpen in het Nederlands; elk advies noemt producten met de prijs van vandaag bij bol.com. Uitgave van ' + SITE.owner + '.\n\n## Keuzehulpen\n\n' + items.map(i => '- [' + i.title + '](' + base + pathOf(req, '/keuzehulp/' + i.slug) + '): ' + (i.kort || i.intro)).join('\n') + '\n\n## Over\n\n- [Over ons](' + base + pathOf(req, '/keuzehulp/over') + ')\n- Contact: ' + SITE.email + '\n'); }
    if (slug === 'over') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(shell('Over ' + SITE.name, 'Wie wij zijn en hoe wij kiezen', `<div class="hero"><h1>Over ${esc(SITE.name)}</h1></div><div class="txt"><p>${esc(SITE.name)} helpt je kiezen zonder ruis: drie vragen, één advies, de prijs van vandaag. We verdienen een kleine vergoeding van bol als je via onze link koopt; dat beïnvloedt nooit welk product we adviseren. Merken kunnen geen plek kopen.</p><p>${esc(SITE.name)} is een uitgave van ${esc(SITE.owner)}. Vragen of een fout gezien? Mail <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>.</p></div>`)); }
    if (slug === 'privacy') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(shell('Privacy — ' + SITE.name, 'Wat we wel en niet bijhouden', `<div class="hero"><h1>Privacy</h1></div><div class="txt"><p>We slaan geen persoonsgegevens op als je een keuzehulp gebruikt. We tellen anoniem welke antwoorden en producten gekozen worden om de adviezen te verbeteren (geen cookies van ons, geen profielen). Klik je door naar bol, dan gelden daar de voorwaarden en cookies van bol. Laat je een e-mailadres achter voor de dagelijkse keuzehulp-mail, dan gebruiken we dat alleen daarvoor; afmelden kan met één klik in elke mail. Spreek je een verzoek in, dan bewaren we die opname maximaal 60 dagen om er een keuzehulp van te maken. Kom je via een advertentie, dan tellen we anoniem per advertentie of je de keuzehulp gebruikt. Zet je meldingen aan, dan bewaren we alleen het technische meldingsadres van je browser en welke keuzehulp (en antwoorden) je volgt, om je hooguit één keer per week te laten weten dat de prijs is gedaald, er een beter model is of de regels zijn veranderd. Uitzetten kan altijd in je browser; daarna verwijderen we het adres zodra een melding niet meer aankomt. Verantwoordelijke: ${esc(SITE.owner)}, ${esc(SITE.email)}.</p></div>`)); }
    if (!slug) return home(res, req);
    const item = await getItem(slug, !!process.env.HJDK_TOKEN && url.searchParams.get('preview') === process.env.HJDK_TOKEN); if (!item) { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(404).send(shell('Niet gevonden', '', '<div class="hero"><h1>Deze keuzehulp bestaat (nog) niet</h1><p><a href="/keuzehulp">Bekijk alle keuzehulpen →</a></p></div>')); }
    return page(item, res, req);
  } catch (e) { return res.status(500).json({ ok: false, error: String(e && e.message || e).slice(0, 200) }); }
}
