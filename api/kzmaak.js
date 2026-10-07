// KZMAAK — elke dag automatisch nieuwe keuzehulpen, volledig in de cloud: Vercel-cron + Claude API + bol API + Redis.
// Geen Claude-account, geen chat en geen computer nodig. Alles (plan, stand, lessen, fouten) staat in Redis en op /api/kzmaak/status.
//
//   /api/kzmaak/signalen   cron 03:50 UTC   signalen verzamelen: Google-autocomplete NL/BE (dagelijkse meting -> eigen tijdreeks, stijgers),
//                                           Google Trends NL/BE, bol populair, zoekopdrachten op de site zonder resultaat, verzoeken, seizoenskalender,
//                                           en wat echt verdient: bol Reporting API (30 dagen kliks, orders, commissie per keuzehulp en categorie, verkochte producten)
//   /api/kzmaak/dag        cron */10 3-12   per ronde een paar stappen: plan maken (Claude kiest onderwerpen) of één keuzehulp maken -> toetsen bij bol
//                                           (elke antwoordroute moet een passend product vinden) -> publiceren -> IndexNow. Stopt bij het dagdoel.
//   /api/kzmaak/status     openbaar         stand: dagdoel, plan van vandaag, gemaakt, mislukt (met reden), signalen, tokenverbruik
//   /api/kzmaak/nu?token=HJDK_TOKEN        één stap nu (&extra=1 = boven het dagdoel, &dry=1 = maken en toetsen zonder publiceren, &onderwerp=slug)
//
// Instellingen (optioneel, env): KZ_PER_DAG (standaard 12, max 30), KZ_VERVERS_PER_DAG (standaard 3), ANTHROPIC_MODEL.
// Claude: eigen sleutel (ANTHROPIC_API_KEY in env of via /setup) of, zonder sleutel, via Vercel AI Gateway met het OIDC-token van dit project (geen sleutel nodig).
// Lerend: per gemaakte keuzehulp telt kz.js organische bezoeken (Google, Bing, ChatGPT, Perplexity, Pinterest ...) en AI-crawlers; de planner krijgt elke ochtend
// te zien welke bronnen en categorieën verkeer en orders opleveren en stuurt daarop. Seizoen, dag en maatschappij: kalender, weer (Open-Meteo), nieuws (NOS, NU.nl, VRT),
// Google Trends, schoolvakanties. Elke dag ook 'uitgelicht' (wat nu speelt, bovenaan de site, in de mail en op Pinterest) en verversing van pagina's die nu actueel zijn.
import { kv } from '../lib/db.js';
import { searchCached, catalog, getToken } from '../lib/bol.js';
import seed from '../data/kz.json' with { type: 'json' };

const DAY = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const DOMAIN = 'https://' + ((seed.site && seed.site.domain) || 'keuzehulp.best');
const INDEXNOW_KEY = '466971cbc1bbe43e6bb64a94465e4470';
const PER_DAG = () => Math.max(0, Math.min(30, Number(process.env.KZ_PER_DAG || 12)));
const VERVERS = () => Math.max(0, Math.min(10, Number(process.env.KZ_VERVERS_PER_DAG || 3)));
const MAX_CLAUDE = () => PER_DAG() * 4 + VERVERS() + 12; // plafond op Claude-aanroepen per dag (plannen + schrijven + herstel + verversen)
const MODELS = [...new Set([process.env.ANTHROPIC_MODEL, 'claude-sonnet-5-5', 'claude-sonnet-4-5'].filter(Boolean))];
const GW_MODELS = [...new Set([process.env.GATEWAY_MODEL, 'anthropic/claude-sonnet-5.5', 'anthropic/claude-sonnet-5', 'anthropic/claude-sonnet-4.5'].filter(Boolean))];
let OIDC_HDR = ''; // OIDC-token uit de request-header (Vercel zet het op elke functie-aanroep), als het niet in env staat
const K = { plan: d => 'hjdk:kz:maak:plan:' + d, log: 'hjdk:kz:maak:log', sig: 'hjdk:kz:signalen', sigDag: d => 'hjdk:kz:sig:dag:' + d, lock: 'hjdk:kz:maak:lock', tok: d => 'c:hjdk6-kzmaak-tokens-' + d, calls: d => 'c:hjdk6-kzmaak-calls-' + d, lessen: 'hjdk:kz:maak:lessen', verd: 'hjdk:kz:verdiensten', prest: 'hjdk:kz:prestaties', uit: 'hjdk:kz:uitgelicht' };
const RESERVED = new Set(['over', 'privacy', 'setup', 'leads', 'subs', 'pins', 'keuzehulp', 'categorie', 'api', 't', 'b', 'sitemap', 'robots', 'llms', 'llms-full', 'sw', 'status', 'admin']);
const catSlug = c => String(c).toLowerCase().replace(/&/g, 'en').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
const CATS = [...new Set(seed.items.map(i => i.cat))].filter(c => seed.items.filter(i => i.cat === c).length >= 2);

// Startlijst (onderzoek okt 2026: Google-jaaroverzicht, Black Friday-cijfers Tweakers/MediaMarkt 2025, Sinterklaaslijstjes, TikTok-trends, gaten in het aanbod).
// Volgorde = voorrang. 'vanaf' = niet eerder. De planner pakt deze eerst, tenzij een signaal (verzoek, zoekopdracht zonder resultaat, sterke stijger) zwaarder weegt.
const STARTLIJST = [
  { slug: 'televisie', term: 'televisie', cat: 'Elektronica', waarom: "Black Friday-topcategorie (tv's, smartphones, laptops); acties starten rond 10 november" },
  { slug: 'spelcomputer', term: 'spelcomputer', cat: 'Elektronica', waarom: 'PS5 en Switch 2 in de tech-top 10 van Black Friday en kerst 2025' },
  { slug: 'radiatorventilator', term: 'radiatorventilator', cat: 'Wonen', waarom: 'stookseizoen, energie besparen' },
  { slug: 'fietsverlichting', term: 'fietsverlichting', cat: 'Sport', waarom: 'donkere dagen, verplicht; piek oktober–november' },
  { slug: 'luisterbox-kind', term: 'luisterbox kind', cat: 'Speelgoed', waarom: 'Sinterklaas' },
  { slug: 'laptop', term: 'laptop', cat: 'Elektronica', waarom: 'Black Friday top 3' },
  { slug: 'smartphone', term: 'smartphone', cat: 'Elektronica', waarom: 'Black Friday top 3' },
  { slug: 'kindercamera', term: 'kindercamera', cat: 'Speelgoed', waarom: 'Sinterklaas, cadeau 4–10 jaar' },
  { slug: 'draadloze-oordopjes', term: 'draadloze oordopjes', cat: 'Elektronica', waarom: 'koptelefoons en oordopjes elk jaar bij de meest gezochte Black Friday-producten; eigen zoekintentie naast koptelefoon' },
  { slug: 'slimme-thermostaat', term: 'slimme thermostaat', cat: 'Wonen', waarom: 'stookseizoen, energie' },
  { slug: 'matrastopper', term: 'matrastopper', cat: 'Wonen', waarom: 'het hele jaar veel gezocht; aanvulling op matras' },
  { slug: 'videodeurbel', term: 'videodeurbel', cat: 'Elektronica', waarom: 'populaire Black Friday-deal 2025' },
  { slug: 'tablet', term: 'tablet', cat: 'Elektronica', waarom: 'Black Friday en kerst' },
  { slug: 'karaoke-set-kind', term: 'karaoke set kinderen', cat: 'Speelgoed', waarom: 'Sinterklaas (microfoon op verlanglijstjes)' },
  { slug: 'rookmelder', term: 'rookmelder', cat: 'Wonen', waarom: 'stookseizoen; verplicht in elke woning' },
  { slug: 'haarstyler', term: 'haarstyler', cat: 'Verzorging', waarom: 'beauty-apparaten trending op TikTok; kerstcadeau' },
  { slug: 'knutselset', term: 'knutselset kinderen', cat: 'Speelgoed', waarom: 'Sinterklaas, schoencadeau' },
  { slug: 'beveiligingscamera', term: 'beveiligingscamera', cat: 'Elektronica', waarom: 'Black Friday, donkere maanden' },
  { slug: 'puzzel', term: 'puzzel 1000 stukjes', cat: 'Speelgoed', waarom: 'winter, Sinterklaas en kerst' },
  { slug: 'bouwset', term: 'bouwset', cat: 'Speelgoed', waarom: 'constructiespeelgoed elk jaar top bij Sinterklaas' },
  { slug: 'kindersmartwatch', term: 'kinder smartwatch', cat: 'Speelgoed', waarom: 'Sinterklaas 6–12 jaar' },
  { slug: 'hoverboard', term: 'hoverboard', cat: 'Speelgoed', waarom: 'Sinterklaas 8–12 jaar' },
  { slug: 'staafmixer', term: 'staafmixer', cat: 'Koken', waarom: 'soepseizoen; het hele jaar veel gezocht' },
  { slug: 'koekenpan', term: 'koekenpan', cat: 'Koken', waarom: 'het hele jaar veel gezocht' },
  { slug: 'badjas', term: 'badjas', cat: 'Kleding & schoenen', waarom: 'winter, kerstcadeau' },
  { slug: 'pantoffels', term: 'pantoffels', cat: 'Kleding & schoenen', waarom: 'herfst en winter' },
  { slug: 'plaid', term: 'plaid', cat: 'Wonen', waarom: 'herfst, kerstcadeau' },
  { slug: 'baardtrimmer', term: 'baardtrimmer', cat: 'Verzorging', waarom: 'kerstcadeau man' },
  { slug: 'led-masker', term: 'led masker gezicht', cat: 'Verzorging', waarom: 'beauty-apparaten trending op TikTok' },
  { slug: 'dashcam', term: 'dashcam', cat: 'Elektronica', waarom: 'winter, Black Friday' },
  { slug: 'beamer', term: 'beamer', cat: 'Elektronica', waarom: 'winteravonden, kerst' },
  { slug: 'gaming-headset', term: 'gaming headset', cat: 'Elektronica', waarom: 'kerstcadeau tieners' },
  { slug: 'wafelijzer', term: 'wafelijzer', cat: 'Koken', waarom: 'winter, kerst' },
  { slug: 'drone', term: 'drone', cat: 'Elektronica', waarom: 'kerstcadeau' },
  { slug: 'krabpaal', term: 'krabpaal', cat: 'Dier', waarom: 'huisdierproducten trending' },
  { slug: 'gps-tracker-hond', term: 'gps tracker hond', cat: 'Dier', waarom: 'vuurwerkperiode: weggelopen honden' },
  { slug: 'loopband', term: 'loopband', cat: 'Sport', waarom: 'goede voornemens', vanaf: '2026-12-01' },
  { slug: 'roeitrainer', term: 'roeitrainer', cat: 'Sport', waarom: 'goede voornemens', vanaf: '2026-12-04' }
];

// seizoenskalender: momenten waar mensen 1–9 weken van tevoren naar zoeken (SEO heeft aanlooptijd nodig)
function nthWeekday(y, m, wd, n) { const d = new Date(Date.UTC(y, m - 1, 1)); let c = 0; while (true) { if (d.getUTCDay() === wd && ++c === n) return d.toISOString().slice(0, 10); d.setUTCDate(d.getUTCDate() + 1); } }
function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return y + '-' + String(mo).padStart(2, '0') + '-' + String(da).padStart(2, '0'); }
function lastSunday(y, m) { const d = new Date(Date.UTC(y, m, 0)); while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); }
function kalender(y) { // vaste en berekende momenten in NL/BE waar mensen iets voor kopen of regelen
  const e = easter(y), bf = addDays(nthWeekday(y, 11, 4, 4), 1), kd = new Date(Date.UTC(y, 3, 27)).getUTCDay() === 0 ? y + '-04-26' : y + '-04-27';
  return [['Blue Monday en goede voornemens', nthWeekday(y, 1, 1, 3)], ['Valentijnsdag', y + '-02-14'], ['Carnaval', addDays(e, -49)], ['Zomertijd (klok vooruit)', lastSunday(y, 3)], ['Tuinseizoen', y + '-03-20'], ['Hooikoorts', y + '-04-01'], ['Pasen', e], ['Koningsdag', kd], ['Bevrijdingsdag', y + '-05-05'], ['Moederdag', nthWeekday(y, 5, 0, 2)], ['Hemelvaart', addDays(e, 39)], ['Pinksteren', addDays(e, 49)], ['Vaderdag', nthWeekday(y, 6, 0, 3)], ['Zomer en hitte', y + '-06-21'], ['Festivalseizoen', y + '-06-01'], ['Zomervakantie', y + '-07-10'], ['Terug naar school', y + '-08-25'], ['Prinsjesdag (koopkracht)', nthWeekday(y, 9, 2, 3)], ['Stookseizoen', y + '-10-01'], ['Dierendag', y + '-10-04'], ['Dag van de Leraar', y + '-10-05'], ['Wintertijd (klok terug, donkere avonden)', lastSunday(y, 10)], ['Halloween', y + '-10-31'], ['Sint-Maarten en Singles Day', y + '-11-11'], ['Black Friday (acties vanaf ~10 nov)', bf], ['Cyber Monday', addDays(bf, 3)], ['Sinterklaas', y + '-12-05'], ['Kerst', y + '-12-25'], ['Oud en nieuw', y + '-12-31']];
}
function momenten(d, van, tot) { // standaard 7–63 dagen vooruit (Google heeft aanlooptijd nodig); met van/tot ook 'nu' (0–14 dagen)
  const lo = van == null ? 7 : van, hi = tot == null ? 63 : tot; const out = [];
  [Number(d.slice(0, 4)) - 1, Number(d.slice(0, 4)), Number(d.slice(0, 4)) + 1].forEach(y => kalender(y).forEach(([n, dt]) => { const w = Math.round((Date.parse(dt) - Date.parse(d)) / 864e5); if (w >= lo && w <= hi) out.push({ moment: n, datum: dt, overDagen: w }); }));
  return out.sort((a, b) => a.overDagen - b.overDagen);
}

// ---------- hulpjes ----------
async function secrets() { try { return (await kv.get('hjdk:secrets')) || {}; } catch (e) { return {}; } }
async function anthropicKey() { return process.env.ANTHROPIC_API_KEY || (await secrets()).ANTHROPIC_API_KEY || ''; }
async function claudeRoute() { // welke weg naar Claude: eigen sleutel, AI Gateway-sleutel, of AI Gateway via het OIDC-token van dit Vercel-project
  const k = await anthropicKey(); if (k) return { kind: 'anthropic', key: k, label: process.env.ANTHROPIC_API_KEY ? 'eigen sleutel (env)' : 'eigen sleutel (setup)' };
  if (process.env.AI_GATEWAY_API_KEY) return { kind: 'gateway', key: process.env.AI_GATEWAY_API_KEY, label: 'Vercel AI Gateway (sleutel)' };
  const o = process.env.VERCEL_OIDC_TOKEN || OIDC_HDR; if (o) return { kind: 'gateway', key: o, label: 'Vercel AI Gateway (OIDC, geen sleutel nodig)' };
  return null;
}
async function pool(list, n, fn) { const out = new Array(list.length); let i = 0; await Promise.all(Array.from({ length: Math.max(1, Math.min(n, list.length)) }, async () => { while (i < list.length) { const k = i++; try { out[k] = await fn(list[k], k); } catch (e) { out[k] = null; } } })); return out; }
async function log(e) { try { const l = (await kv.get(K.log)) || []; l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set(K.log, l.slice(0, 300)); } catch (x) {} }
const median = a => { const s = a.filter(x => typeof x === 'number').sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 4; };
const pctFor = cat => median(seed.items.filter(i => i.cat === cat).map(i => i.pct));
function jsonUit(txt) { const s = String(txt || '').replace(/```(?:json)?/g, ''); const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a < 0 || b < a) throw new Error('geen JSON in het antwoord: ' + s.slice(0, 160).replace(/\s+/g, ' ')); try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { throw new Error('JSON niet leesbaar (' + String(e.message).slice(0, 60) + '): ' + s.slice(a, a + 120).replace(/\s+/g, ' ')); } }

async function claude(system, user, maxTokens) {
  const d = DAY(); const n = Number(await kv.get(K.calls(d)).catch(() => 0)) || 0;
  if (n >= MAX_CLAUDE()) throw new Error('daglimiet Claude-aanroepen bereikt (' + MAX_CLAUDE() + ')');
  const rt = await claudeRoute(); if (!rt) throw new Error('geen toegang tot Claude: geen ANTHROPIC_API_KEY en geen Vercel OIDC-token');
  let last = ''; const gw = rt.kind === 'gateway'; let think = true;
  for (const model of (gw ? GW_MODELS : MODELS)) for (let poging = 0; poging < 2; poging++) {
    const r = await fetch(gw ? 'https://ai-gateway.vercel.sh/v1/messages' : 'https://api.anthropic.com/v1/messages', { method: 'POST', headers: Object.assign({ 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, gw ? { authorization: 'Bearer ' + rt.key } : { 'x-api-key': rt.key }), body: JSON.stringify(Object.assign({ model, max_tokens: maxTokens || 4000, system, messages: [{ role: 'user', content: user }] }, think ? { thinking: { type: 'disabled' } } : {})) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      const txt = (Array.isArray(j.content) ? j.content : []).filter(c => c.type === 'text').map(c => c.text).join('') || (typeof j.content === 'string' ? j.content : '');
      try { await kv.incrMany([[K.calls(d), 1], [K.tok(d), ((j.usage && j.usage.input_tokens) || 0) + ((j.usage && j.usage.output_tokens) || 0)]]); } catch (e) {}
      if (!txt.trim()) throw new Error('leeg antwoord van ' + model + ' (stop: ' + j.stop_reason + ', blokken: ' + (Array.isArray(j.content) ? j.content.map(c => c.type).join(',') : typeof j.content) + ')');
      return { txt, model, stop: j.stop_reason };
    }
    last = r.status + ' ' + ((j.error && j.error.message) || JSON.stringify(j).slice(0, 120));
    if (think && r.status === 400 && /thinking/i.test(last)) { think = false; continue; } // model kent 'thinking: disabled' niet: zonder opnieuw
    if (!(r.status === 404 || ((r.status === 400 || r.status === 422) && /model/i.test(last)))) throw new Error('Claude ' + (gw ? 'via AI Gateway' : 'API') + ': ' + last.slice(0, 200)); // alleen bij een onbekend model het volgende proberen
    break;
  }
  throw new Error('Claude API: ' + last.slice(0, 200));
}

async function bestaande() { // alles wat er is of al ingepland staat (seed + Redis), ook toekomstige publicaties
  const out = seed.items.map(i => ({ slug: i.slug, title: i.title, term: i.term, cat: i.cat }));
  try { const idx = (await kv.get('hjdk:kz:index')) || []; const vals = idx.length ? await kv.mget(...idx.map(s => 'hjdk:kz:' + s)) : []; vals.forEach(v => { if (v && v.slug && !out.some(o => o.slug === v.slug)) out.push({ slug: v.slug, title: v.title, term: v.term, cat: v.cat, publishAt: v.publishAt, gemaakt: v.gemaakt, bron: v.bron }); }); } catch (e) {}
  return out;
}

// ---------- signalen ----------
async function suggest(q, gl) {
  try {
    const r = await fetch('https://suggestqueries.google.com/complete/search?client=firefox&hl=nl&gl=' + gl + '&q=' + encodeURIComponent(q), { headers: { 'user-agent': 'Mozilla/5.0 (keuzehulp.best trendcheck)' } });
    if (!r.ok) return [];
    const buf = Buffer.from(await r.arrayBuffer()); let t = buf.toString('utf8'); if (t.indexOf('\uFFFD') >= 0) t = buf.toString('latin1');
    const j = JSON.parse(t); return Array.isArray(j[1]) ? j[1].map(String) : [];
  } catch (e) { return []; }
}
const STOP = /\b(kopen|kiezen|nodig|test|testen|getest|review|reviews|consumentenbond|aanbieding|aanbiedingen|korting|goedkoop|goedkope|beste|welke|wat|voor|is|de|het|een|kan|ik|je|moet|bij|van|met|in|op|2024|2025|2026|2027|bol|coolblue|mediamarkt|action|kruidvat|lidl|aldi|hema|ikea|amazon|black|friday)\b/g;
function kern(s, prefix) { let t = String(s).toLowerCase(); if (prefix && t.startsWith(prefix)) t = t.slice(prefix.length); t = t.replace(/bol\.com/g, ' ').replace(STOP, ' ').replace(/[^a-z0-9à-ÿ\- ]/g, ' ').replace(/\s+/g, ' ').trim(); return t.split(' ').slice(0, 4).join(' '); }
async function trendsRss(geo) {
  try {
    const r = await fetch('https://trends.google.com/trending/rss?geo=' + geo, { headers: { 'user-agent': 'Mozilla/5.0 (keuzehulp.best trendcheck)' } }); const xml = await r.text(); const out = []; const re = /<item>([\s\S]*?)<\/item>/g; let m;
    while ((m = re.exec(xml)) && out.length < 25) { const it = m[1]; const t = (it.match(/<title>(?:<!\[CDATA\[)?([^<\]]+)/) || [])[1]; const tr = (it.match(/<ht:approx_traffic>([^<]+)/) || [])[1]; const nw = (it.match(/<ht:news_item_title>(?:<!\[CDATA\[)?([^<\]]+)/) || [])[1]; if (t) out.push({ t: t.trim(), verkeer: String(tr || '').trim(), nieuws: String(nw || '').trim().slice(0, 100) }); }
    return out;
  } catch (e) { return []; }
}
async function bolPopulair() {
  try { const j = await catalog('/products/lists/popular', { 'country-code': 'NL', page: 1, 'page-size': 50 }, 'nl-NL'); const list = Array.isArray(j.results) ? j.results : (Array.isArray(j.products) ? j.products : []); return list.map(p => String(p.title || '').slice(0, 90)).filter(Boolean); } catch (e) { return []; }
}
async function zonderResultaat() {
  let cur = '0', keys = [];
  try { for (let i = 0; i < 150; i++) { const [c, ks] = await kv.scan(cur, { match: 'c:hjdk6-kzq0-*', count: 1000 }); keys = keys.concat(ks); cur = c; if (c === '0' || keys.length > 2000) break; } } catch (e) {}
  if (!keys.length) return [];
  const vals = await kv.mget(...keys.slice(0, 1000)).catch(() => []);
  return keys.slice(0, 1000).map((k, i) => ({ q: k.replace('c:hjdk6-kzq0-', '').replace(/_/g, ' '), n: Number(vals[i]) || 0 })).sort((a, b) => b.n - a.n).slice(0, 40);
}
// wat echt geld oplevert: bol Reporting API v2, laatste 30 dagen. Keuzehulp-subids: kz_<slug>-<route>[-Z<zone>][-<code>].
// Alle orders tellen mee als koopsignaal (ook via Yoors/brugpagina's): welke producttypes kopen jouw bezoekers echt?
const REP = 'https://api.bol.com/marketing/affiliate/reports/v2';
async function verdiensten(best) {
  const d = DAY(), from = addDays(d, -29); const t = await getToken('report'); if (t.error) return { ok: false, fout: t.error };
  const pull = async path => { const r = await fetch(REP + path + '?startDate=' + from + '&endDate=' + d, { headers: { authorization: 'Bearer ' + t.token, accept: 'application/json' } }); const txt = await r.text(); if (!r.ok) throw new Error('bol report ' + r.status + ' ' + txt.slice(0, 120)); const j = JSON.parse(txt); return Array.isArray(j) ? j : (j.results || j.items || j.data || j.rows || []); };
  let orders = [], promo = []; try { [orders, promo] = await Promise.all([pull('/order-report'), pull('/promotion-report')]); } catch (e) { return { ok: false, fout: String(e.message || e).slice(0, 160) }; }
  const num = v => Number(v) || 0; const slugOf = s => { const m = String(s || '').match(/^kz_([a-z0-9-]+?)-\d+/i); return m ? m[1].toLowerCase() : null; };
  const catOf = {}; best.forEach(b => { catOf[b.slug] = b.cat; });
  const mk = () => ({ kliks: 0, orders: 0, commissie: 0, omzet: 0 }); const kz = {}, cat = {}, prod = {}, pct = {}; const tot = { orders: 0, commissie: 0, kzKliks: 0, kzOrders: 0, kzCommissie: 0 };
  const add = (o, k, f, v) => { if (!k) return; const x = o[k] || (o[k] = mk()); x[f] += v; };
  promo.forEach(r => { const s = slugOf(r.subId); if (!s) return; const c = num(r.clicks); tot.kzKliks += c; add(kz, s, 'kliks', c); add(cat, catOf[s], 'kliks', c); });
  orders.forEach(r => { const com = num(r.commission != null ? r.commission : r.commissionOriginal), rev = num(r.priceExclVat != null ? r.priceExclVat : r.revenueExclVat); const s = slugOf(r.subId); tot.orders++; tot.commissie += com;
    if (s) { tot.kzOrders++; tot.kzCommissie += com; add(kz, s, 'orders', 1); add(kz, s, 'commissie', com); add(kz, s, 'omzet', rev); add(cat, catOf[s], 'orders', 1); add(cat, catOf[s], 'commissie', com); }
    if (r.productTitle) { const k = String(r.productTitle).slice(0, 80) + (r.commissionPercentage != null ? ' [' + r.commissionPercentage + '%]' : ''); add(prod, k, 'orders', 1); add(prod, k, 'commissie', com); add(prod, k, 'omzet', rev); prod[k].via = s ? 'keuzehulp ' + s : 'andere site'; }
    if (r.commissionPercentage != null) { add(pct, r.commissionPercentage + '%', 'orders', 1); add(pct, r.commissionPercentage + '%', 'commissie', com); } });
  const lijst = o => Object.entries(o).map(([k, x]) => Object.assign({ k, kliks: x.kliks, orders: x.orders, commissie: Math.round(x.commissie * 100) / 100, per1000kliks: x.kliks >= 50 ? Math.round(x.commissie / x.kliks * 1000 * 100) / 100 : null }, x.via ? { via: x.via, omzet: Math.round(x.omzet) } : {}));
  const kzL = lijst(kz), catL = lijst(cat);
  return { ok: true, periode: from + ' t/m ' + d, totaal: { orders: tot.orders, commissie: Math.round(tot.commissie * 100) / 100, keuzehulpKliks: tot.kzKliks, keuzehulpOrders: tot.kzOrders, keuzehulpCommissie: Math.round(tot.kzCommissie * 100) / 100 },
    besteKeuzehulpen: kzL.filter(x => x.orders > 0).sort((a, b) => b.commissie - a.commissie).slice(0, 25),
    categorieen: catL.sort((a, b) => (b.per1000kliks || 0) - (a.per1000kliks || 0) || b.commissie - a.commissie),
    veelKliksGeenOrders: kzL.filter(x => x.kliks >= 100 && !x.orders).sort((a, b) => b.kliks - a.kliks).slice(0, 15).map(x => x.k + ' (' + x.kliks + ' kliks)'),
    verkochteProducten: lijst(prod).sort((a, b) => b.commissie - a.commissie).slice(0, 40), commissiePercentages: lijst(pct) };
}
// ---------- dag en maatschappij: weer, nieuws, schoolvakanties ----------
async function getText(url, ms) { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 8000); try { const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (keuzehulp.best; dagelijkse signalen)' }, signal: c.signal }); clearTimeout(t); return r.ok ? await r.text() : ''; } catch (e) { clearTimeout(t); return ''; } }
async function weer() { // Open-Meteo (gratis, geen sleutel): 8 dagen voor De Bilt en Brussel, vertaald naar koopmomenten
  const plekken = [['Nederland (De Bilt)', 52.10, 5.18], ['België (Brussel)', 50.85, 4.35]]; const out = [];
  await pool(plekken, 2, async ([naam, la, lo]) => {
    const t = await getText('https://api.open-meteo.com/v1/forecast?latitude=' + la + '&longitude=' + lo + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_gusts_10m_max&timezone=Europe%2FAmsterdam&forecast_days=8'); if (!t) return;
    let j; try { j = JSON.parse(t).daily; } catch (e) { return; } if (!j || !j.time) return;
    const mx = j.temperature_2m_max, mn = j.temperature_2m_min, rn = j.precipitation_sum, sn = j.snowfall_sum, wi = j.wind_gusts_10m_max; const ev = [];
    if (mn.some(x => x < 0)) ev.push('nachtvorst op komst (min ' + Math.min(...mn).toFixed(0) + ' °C)'); if (mx.filter(x => x < 5).length >= 3) ev.push('koude dagen (max onder 5 °C)');
    if (mx.filter(x => x >= 27).length >= 3) ev.push('hittegolf (max ' + Math.max(...mx).toFixed(0) + ' °C)'); else if (mx.some(x => x >= 25)) ev.push('zomerse dag(en)');
    if (sn.some(x => x > 0.5)) ev.push('sneeuw verwacht'); if (wi.some(x => x >= 75)) ev.push('storm (windstoten ' + Math.max(...wi).toFixed(0) + ' km/u)'); if (rn.reduce((a, b) => a + b, 0) > 35) ev.push('natte week (' + rn.reduce((a, b) => a + b, 0).toFixed(0) + ' mm)');
    out.push({ waar: naam, komendeWeek: 'max ' + Math.min(...mx).toFixed(0) + '–' + Math.max(...mx).toFixed(0) + ' °C, min ' + Math.min(...mn).toFixed(0) + ' °C, regen ' + rn.reduce((a, b) => a + b, 0).toFixed(0) + ' mm', opvallend: ev });
  });
  return out;
}
const FEEDS = [['NOS', 'https://feeds.nos.nl/nosnieuwsalgemeen'], ['NOS economie', 'https://feeds.nos.nl/nosnieuwseconomie'], ['NU.nl', 'https://www.nu.nl/rss/Algemeen'], ['NU.nl economie', 'https://www.nu.nl/rss/Economie'], ['VRT NWS', 'https://www.vrt.be/vrtnws/nl.rss.articles.xml']];
async function nieuws() { // koppen van vandaag: wat speelt er in de maatschappij (energie, koopkracht, weer, veiligheid, gezondheid ...)
  const out = []; await pool(FEEDS, 5, async ([bron, url]) => { const x = await getText(url); const re = /<(?:item|entry)\b[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/g; let m, n = 0; while ((m = re.exec(x)) && n < 12) { const t = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#039;|&apos;/g, "'").replace(/&quot;/g, '"').trim(); if (t) { out.push(bron + ': ' + t.slice(0, 140)); n++; } } });
  return out.slice(0, 50);
}
async function schoolvakanties(d) { // rijksoverheid open data; als dat niet lukt, valt dit signaal weg
  const t = await getText('https://opendata.rijksoverheid.nl/v1/sources/rijksoverheid/infotypes/schoolholidays?output=json', 9000); if (!t) return [];
  let j; try { j = JSON.parse(t); } catch (e) { return []; } const out = [];
  (Array.isArray(j) ? j : [j]).forEach(doc => ((doc && doc.content) || []).forEach(c => (c.vacations || []).forEach(v => (v.regions || []).forEach(r => { const st = String(r.startdate || '').slice(0, 10); if (!st) return; const w = Math.round((Date.parse(st) - Date.parse(d)) / 864e5); if (w >= -3 && w <= 63) out.push({ vakantie: String(v.type || '').trim(), regio: r.region, start: st, eind: String(r.enddate || '').slice(0, 10), overDagen: w }); }))));
  const seen = new Set(); return out.filter(x => { const k = x.vakantie + x.start; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.overDagen - b.overDagen).slice(0, 8);
}
// ---------- zelflerend: wat leveren de keuzehulpen op (organisch bezoek, AI-crawlers, bol-kliks, orders) ----------
const BOTS = ['googlebot', 'bingbot', 'gptbot', 'oai-searchbot', 'chatgpt-user', 'claudebot', 'claude-user', 'perplexitybot', 'perplexity-user', 'applebot', 'duckduckbot', 'meta', 'amazonbot'];
const AI_BOTS = new Set(['gptbot', 'oai-searchbot', 'chatgpt-user', 'claudebot', 'claude-user', 'perplexitybot', 'perplexity-user', 'applebot', 'meta', 'amazonbot']);
async function prestaties(best, vd) {
  const live = best.filter(b => !b.publishAt || b.publishAt <= DAY()); const keys = [];
  live.forEach(b => { keys.push('c:hjdk6-kz-org-' + b.slug, 'c:hjdk6-kz-' + b.slug + '-clk'); BOTS.forEach(x => keys.push('c:hjdk6-kz-bot-' + x + '-' + b.slug)); });
  const vals = []; for (let i = 0; i < keys.length; i += 800) { try { (await kv.mget(...keys.slice(i, i + 800))).forEach(v => vals.push(Number(v) || 0)); } catch (e) { keys.slice(i, i + 800).forEach(() => vals.push(0)); } }
  const per = 2 + BOTS.length; const orders = {}; ((vd && vd.besteKeuzehulpen) || []).forEach(x => { orders[x.k] = x; });
  const rows = live.map((b, i) => { const o = i * per; const bots = {}; let ai = 0, zoek = 0; BOTS.forEach((x, k) => { const n = vals[o + 2 + k]; if (n) bots[x] = n; if (AI_BOTS.has(x)) ai += n; else zoek += n; }); return { slug: b.slug, cat: b.cat, bron: b.bron || (b.gemaakt === 'kzmaak' ? '?' : 'handmatig'), gemaakt: b.gemaakt === 'kzmaak', dag: b.publishAt || '', org: vals[o], bolKliks: vals[o + 1], aiCrawls: ai, zoekCrawls: zoek, orders: (orders[b.slug] || {}).orders || 0, commissie: (orders[b.slug] || {}).commissie || 0 }; });
  const groep = f => { const g = {}; rows.forEach(r => { const k = f(r); if (!k) return; const x = g[k] || (g[k] = { paginas: 0, org: 0, aiCrawls: 0, orders: 0, commissie: 0 }); x.paginas++; x.org += r.org; x.aiCrawls += r.aiCrawls; x.orders += r.orders; x.commissie = Math.round((x.commissie + r.commissie) * 100) / 100; }); return Object.entries(g).map(([k, x]) => Object.assign({ k, orgPerPagina: Math.round(x.org / x.paginas * 10) / 10 }, x)).sort((a, b) => b.orgPerPagina - a.orgPerPagina); };
  let totOrg = {}, totBot = {}; try { const ks = ['google', 'bing', 'duckduckgo', 'chatgpt', 'perplexity', 'copilot', 'gemini', 'claude', 'pinterest', 'social', 'direct', 'overig']; const v1 = await kv.mget(...ks.map(k => 'c:hjdk6-kz-org-src-' + k)); ks.forEach((k, i) => { if (Number(v1[i])) totOrg[k] = Number(v1[i]); }); const v2 = await kv.mget(...BOTS.map(k => 'c:hjdk6-kz-bott-' + k)); BOTS.forEach((k, i) => { if (Number(v2[i])) totBot[k] = Number(v2[i]); }); } catch (e) {}
  const oud = rows.filter(r => r.gemaakt && r.dag && r.dag <= addDays(DAY(), -14));
  return { organischPerBron: totOrg, crawlersTotaal: totBot, perBron: groep(r => r.gemaakt ? r.bron : null), perCategorie: groep(r => r.cat), besteOrganisch: rows.filter(r => r.org || r.aiCrawls).sort((a, b) => (b.org * 3 + b.aiCrawls) - (a.org * 3 + a.aiCrawls)).slice(0, 25), zonderBereikNa14Dagen: oud.filter(r => !r.org && !r.aiCrawls && !r.zoekCrawls).map(r => r.slug).slice(0, 30), gemaakteAantal: rows.filter(r => r.gemaakt).length };
}
async function signalen() {
  const d = DAY(); const t0 = Date.now();
  const letters = 'abcdefghijklmnoprstuvwz'.split(''); const jobs = [];
  ['welke ', 'beste ', 'goedkope ', 'wat voor '].forEach(p => letters.forEach(l => jobs.push([p, p + l, 'nl'])));
  letters.forEach(l => jobs.push(['welke ', 'welke ' + l, 'be']));
  ['cadeau ', 'cadeau voor ', 'sinterklaas cadeau ', 'kerstcadeau '].forEach(p => jobs.push([p, p, 'nl']));
  const res = await pool(jobs, 8, async ([p, q, gl]) => ({ p, s: await suggest(q, gl) }));
  const score = {}, vb = {}; let ruw = 0;
  res.forEach(x => ((x && x.s) || []).forEach((s, i) => { ruw++; const k = kern(s, x.p); if (k.length < 3) return; score[k] = (score[k] || 0) + (10 - Math.min(9, i)); if (!vb[k]) vb[k] = s; }));
  const top = Object.entries(score).sort((a, b) => b[1] - a[1]).slice(0, 600);
  try { await kv.set(K.sigDag(d), Object.fromEntries(top), { ex: 40 * 86400 }); } catch (e) {}
  const prev = (await kv.mget(...Array.from({ length: 14 }, (_, i) => K.sigDag(addDays(d, -(i + 1))))).catch(() => [])).filter(Boolean);
  const rij = top.map(([k, nu]) => { const gem = prev.length ? prev.reduce((a, p) => a + (Number(p[k]) || 0), 0) / prev.length : 0; return { k, nu, gem: Math.round(gem * 10) / 10, nieuw: prev.length >= 3 && prev.every(p => !p[k]), vb: vb[k] }; });
  const stijgers = prev.length ? rij.filter(r => r.nu - r.gem >= 4).sort((a, b) => (b.nu - b.gem) - (a.nu - a.gem)).slice(0, 40) : [];
  const nieuw = rij.filter(r => r.nieuw).sort((a, b) => b.nu - a.nu).slice(0, 25);
  const best0 = await bestaande(); const [nl, be, bol, zr, vd, wr, nw, sv] = await Promise.all([trendsRss('NL'), trendsRss('BE'), bolPopulair(), zonderResultaat(), verdiensten(best0).catch(e => ({ ok: false, fout: String(e.message || e).slice(0, 160) })), weer().catch(() => []), nieuws().catch(() => []), schoolvakanties(d).catch(() => [])]);
  try { await kv.set(K.verd, Object.assign({ dag: d }, vd)); } catch (e) {}
  let pr = null; try { pr = await prestaties(best0, vd.ok ? vd : null); await kv.set(K.prest, Object.assign({ dag: d }, pr)); } catch (e) {}
  let verzoeken = []; try { verzoeken = ((await kv.get('hjdk:kz:vragen')) || []).filter(v => v.q && Date.now() - v.at < 60 * 864e5).map(v => v.q).slice(0, 40); } catch (e) {}
  const out = { dag: d, metingen: { autocompleteVragen: jobs.length, suggesties: ruw, dagenHistorie: prev.length }, topVraag: rij.slice(0, 40).map(r => r.vb), stijgers, nieuw, trends: { nl, be }, bolPopulair: bol.slice(0, 40), zonderResultaat: zr, verzoeken, momenten: momenten(d), nu: momenten(d, -1, 14), weer: wr, nieuws: nw, schoolvakanties: sv, prestaties: pr ? { organischPerBron: pr.organischPerBron, perBron: pr.perBron, perCategorie: pr.perCategorie.slice(0, 15), besteOrganisch: pr.besteOrganisch.slice(0, 15), zonderBereikNa14Dagen: pr.zonderBereikNa14Dagen } : null, verdiensten: vd.ok ? { totaal: vd.totaal, categorieen: vd.categorieen.slice(0, 12), besteKeuzehulpen: vd.besteKeuzehulpen.slice(0, 15), veelKliksGeenOrders: vd.veelKliksGeenOrders, verkochteProducten: vd.verkochteProducten.slice(0, 30) } : { fout: vd.fout }, ms: Date.now() - t0 };
  await kv.set(K.sig, out);
  await log({ stap: 'signalen', ok: true, suggesties: ruw, stijgers: stijgers.length, nieuw: nieuw.length, weer: wr.map(w => w.opvallend.join(', ') || 'rustig').join(' | '), nieuwskoppen: nw.length, vakanties: sv.length, organisch: pr ? Object.values(pr.organischPerBron).reduce((a, b) => a + b, 0) : 0, bolOrders30d: vd.ok ? vd.totaal.orders : 'fout: ' + vd.fout, ms: out.ms });
  return out;
}

// ---------- plan: welke onderwerpen vandaag ----------
async function maakPlan(d, extraUitsluiten) {
  const sig = (await kv.get(K.sig)) || {}; const best = await bestaande(); const have = new Set(best.map(b => b.slug).concat(extraUitsluiten || []));
  const lessen = (await kv.get(K.lessen)) || [];
  const start = STARTLIJST.filter(x => (!x.vanaf || x.vanaf <= d) && !have.has(x.slug)).slice(0, 14);
  const system = 'Je bent de hoofdredacteur van keuzehulp.best: onafhankelijke Nederlandse keuzehulpen (3 vragen -> 1 passend product bij bol.com met de prijs van vandaag). Je kiest welke nieuwe keuzehulpen er vandaag bij komen. Een goed onderwerp: (1) een producttype dat mensen in Nederland en België echt zoeken met koopintentie ("welke X kopen", "beste X"), (2) waar verkeerd kiezen echt kan (minstens twee keuzes die ertoe doen: maat, type, gebruik, budget), (3) breed verkrijgbaar bij bol.com, bij voorkeur vanaf zo\'n 25 euro, (4) geen dubbel van een bestaande keuzehulp (een andere zoekintentie mag wel: oordopjes naast koptelefoon), (5) geen medicijnen, supplementen, wapens, vapes, vuurwerk, erotiek, alcohol of tabak, en geen losse merken of modellen. Voorrang: verzoeken van bezoekers en zoekopdrachten op de site zonder resultaat; dan wat echt geld oplevert (zie verdiensten: producttypes die via de sites al verkocht worden maar nog geen eigen keuzehulp hebben, en onderwerpen in categorieen met de meeste commissie per 1.000 bol-kliks; hoe meer orders er zijn, hoe zwaarder dit weegt; maak geen extra onderwerpen in de buurt van keuzehulpen met veel kliks en geen orders); dan onderwerpen waarvan de piek over 2 tot 9 weken valt (Google heeft aanlooptijd nodig); dan sterke stijgers in de zoekdata; dan de startlijst. Een duur product bij een hoog commissiepercentage weegt zwaarder dan een goedkoop product. Bouw de site breed uit: vul ook gaten in categorieen met weinig keuzehulpen, en kies onderwerpen die logisch naast bestaande keuzehulpen staan (wie een kinderwagen zoekt, zoekt ook een autostoel), zodat ze naar elkaar kunnen linken. Speel in op seizoen, dag en maatschappij: het weer van de komende week (vorst, storm, hitte), het nieuws (energieprijzen, koopkracht, veiligheid, gezondheid, nieuwe regels), schoolvakanties en momenten die over 0 tot 9 weken vallen; nieuws en Google Trends zijn alleen bruikbaar als er een duidelijke koopvraag achter zit. Leer van de resultaten (prestaties): kies meer onderwerpen uit bronnen en categorieen die organisch bezoek, AI-crawlers en orders opleveren, en minder uit bronnen waarvan pagina\'s na 14 dagen nog geen bereik hebben. Geef daarnaast (1) "uitgelicht": 2 tot 4 blokken met bestaande keuzehulpen die vandaag het meest actueel zijn (moment, weer of nieuws van nu), en (2) "ververs": bestaande slugs die nu actueel zijn en een actuele tekst verdienen. Antwoord alleen met JSON.';
  const user = JSON.stringify({
    datum: d, aantalNodig: Math.max(8, PER_DAG() * 2), toegestaneCategorieen: CATS, aantalPerCategorie: Object.fromEntries(CATS.map(c => [c, best.filter(b => b.cat === c).length])),
    bestaandeSlugs: best.map(b => b.slug).join(', '),
    signalen: { verzoekenVanBezoekers: sig.verzoeken || [], zoekopdrachtenZonderResultaat: sig.zonderResultaat || [], stijgersInGoogleZoekvragen: (sig.stijgers || []).map(s => s.vb || s.k), nieuwInGoogleZoekvragen: (sig.nieuw || []).map(s => s.vb || s.k), veelGezochtNu: sig.topVraag || [], googleTrendsNL: (sig.trends && sig.trends.nl || []).map(t => t.t), googleTrendsBE: (sig.trends && sig.trends.be || []).map(t => t.t), bolPopulairNu: sig.bolPopulair || [], komendeMomenten: momenten(d), momentenNu: momenten(d, -1, 14), weerKomendeWeek: sig.weer || [], nieuwsVandaag: sig.nieuws || [], schoolvakanties: sig.schoolvakanties || [], prestaties: sig.prestaties || null, verdiensten: sig.verdiensten || null, commissiePercentagePerCategorie: Object.fromEntries(CATS.map(c => [c, pctFor(c) + '%'])) },
    startlijst: start, lessenUitEerdereRondes: lessen.slice(0, 12),
    formaat: { plan: [{ slug: 'kleine-letters-met-streepjes', term: 'het gewone zoekwoord waarmee bol de juiste producten toont', cat: 'een van de toegestane categorieen', waarom: 'korte reden met het signaal', bron: 'verzoek | zonder-resultaat | geld | seizoen | dag | weer | nieuws | stijger | startlijst | trend' }], uitgelicht: [{ naam: 'korte kop, bv. Eerste nachtvorst of Sinterklaas over 3 weken', waarom: 'een zin', slugs: ['3 tot 8 bestaande slugs'] }], ververs: ['bestaande slugs, hooguit ' + VERVERS()] }
  });
  let j = {}; try { const a = await claude(system, user, 8000); j = jsonUit(a.txt); } catch (e) { await log({ stap: 'plan', ok: false, waarom: 'planner: ' + String(e.message || e).slice(0, 220) + ' — vangnet: startlijst' }); }
  const plan = [];
  try { const ok = new Set(best.map(b => b.slug)); const blokken = (j.uitgelicht || []).map(u => ({ naam: String(u.naam || '').slice(0, 60), waarom: String(u.waarom || '').slice(0, 160), slugs: (u.slugs || []).map(String).filter(x => ok.has(x)).slice(0, 8) })).filter(u => u.naam && u.slugs.length >= 2).slice(0, 4); if (blokken.length) await kv.set(K.uit, { dag: d, blokken }); plan.ververs = (j.ververs || []).map(String).filter(x => ok.has(x)).slice(0, VERVERS()); } catch (e) {}
  (j.plan || []).forEach(p => {
    const slug = String(p.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
    if (!slug || have.has(slug) || RESERVED.has(slug) || plan.some(x => x.slug === slug)) return;
    plan.push({ slug, term: String(p.term || slug.replace(/-/g, ' ')).slice(0, 60), cat: CATS.includes(p.cat) ? p.cat : (start.find(s => s.slug === slug) || {}).cat || 'Wonen', waarom: String(p.waarom || '').slice(0, 200), bron: String(p.bron || '').slice(0, 30) });
  });
  start.forEach(s => { if (plan.length < Math.max(8, PER_DAG() * 2) && !plan.some(x => x.slug === s.slug)) plan.push(Object.assign({ bron: 'startlijst' }, s)); }); // vangnet
  return { lijst: plan, ververs: plan.ververs || [] };
}

// ---------- toetsen: vindt elke antwoordroute een passend product bij bol? (zelfde logica als advise() in kz.js) ----------
function routesOf(item) { let r = [[]]; item.questions.forEach(q => { const n = []; r.forEach(x => q.options.forEach((_, i) => n.push(x.concat(i)))); r = n; }); return r; }
function filtersOf(item, route) { let term = item.term, must = [], min = 0, max = 0; route.map((a, i) => item.questions[i].options[a]).forEach(o => { if (o.term) term = o.term; if (o.add) term += ' ' + o.add; if (o.must) must = must.concat(o.must.map(x => String(x).toLowerCase())); if (o.min) min = Math.max(min, o.min); if (o.max) max = max ? Math.min(max, o.max) : o.max; }); return { term: term.trim(), must, min, max }; }
async function toets(item) {
  const routes = routesOf(item); const fs = routes.map(r => filtersOf(item, r)); const terms = [...new Set(fs.map(f => f.term))]; const res = {};
  await pool(terms, 5, async t => { try { const r = await searchCached(t, { country: 'NL', size: 48, sort: 'RELEVANCE' }); res[t] = (r.products || []).filter(p => p.price != null && p.image); } catch (e) { res[t] = []; } });
  const uit = routes.map((route, i) => {
    const f = fs[i]; const prods = res[f.term] || []; const hits = p => f.must.filter(m => String(p.title).toLowerCase().indexOf(m) >= 0).length;
    const ranked = prods.map(p => { const h = hits(p); let s = h * 2 + (p.rating || 3.5); if (f.min && p.price < f.min) s -= 3; if (f.max && p.price > f.max) s -= 3; return { p, h, s }; }).sort((a, b) => b.s - a.s);
    const b = ranked[0]; const ok = !!b && (!f.must.length || b.h >= 1) && (!f.min || b.p.price >= f.min * 0.85) && (!f.max || b.p.price <= f.max * 1.15);
    return { route: route.join('-'), term: f.term, must: f.must, min: f.min || null, max: f.max || null, ok, n: prods.length, best: b ? { titel: b.p.title.slice(0, 80), prijs: b.p.price, treffers: b.h } : null, voorbeeld: prods.slice(0, 8).map(p => p.title.slice(0, 70) + ' — €' + p.price) };
  });
  const okN = uit.filter(x => x.ok).length; const eersteOk = item.questions[0].options.every((_, oi) => uit.some(x => x.ok && x.route.split('-')[0] === String(oi)));
  return { routes: uit.length, ok: okN, pct: Math.round(okN / uit.length * 100), eersteVraagGedekt: eersteOk, geslaagd: okN / uit.length >= 0.85 && eersteOk, fout: uit.filter(x => !x.ok) };
}
function schemaFouten(it) {
  const f = []; if (!it || typeof it !== 'object') return ['geen object'];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(it.slug || '')) f.push('slug');
  ['title', 'h1', 'intro', 'uitleg', 'kort', 'term', 'cat'].forEach(k => { if (!it[k] || typeof it[k] !== 'string') f.push(k + ' ontbreekt'); });
  if (!Array.isArray(it.questions) || it.questions.length !== 3) f.push('precies 3 vragen nodig');
  else it.questions.forEach((q, qi) => { if (!q || !q.q) f.push('vraag ' + (qi + 1) + ' zonder tekst'); if (!q || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) f.push('vraag ' + (qi + 1) + ': 2–4 opties'); else q.options.forEach((o, oi) => { if (!o.label) f.push('optie ' + (qi + 1) + '.' + (oi + 1) + ' zonder label'); if (o.must && !Array.isArray(o.must)) f.push('must ' + (qi + 1) + '.' + (oi + 1)); ['min', 'max'].forEach(k => { if (o[k] != null && !(typeof o[k] === 'number' && o[k] >= 0)) f.push(k + ' ' + (qi + 1) + '.' + (oi + 1)); }); }); });
  if (!Array.isArray(it.fouten) || it.fouten.length < 3) f.push('minstens 3 fouten');
  if (!Array.isArray(it.faq) || it.faq.length < 3 || it.faq.some(x => !x || !x.q || !x.a)) f.push('minstens 3 faq met q en a');
  return f;
}
function netjes(it, cand, slugs) {
  const s = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  const out = { slug: cand.slug, cat: CATS.includes(it.cat) ? it.cat : cand.cat, pct: pctFor(CATS.includes(it.cat) ? it.cat : cand.cat), term: s(it.term || cand.term).toLowerCase(), title: s(it.title), h1: s(it.h1), intro: s(it.intro),
    questions: (it.questions || []).map(q => ({ q: s(q.q), options: (q.options || []).map(o => { const x = { label: s(o.label) }; if (Array.isArray(o.must) && o.must.length) x.must = [...new Set(o.must.map(m => s(m).toLowerCase()).filter(Boolean))].slice(0, 10); if (o.add) x.add = s(o.add).toLowerCase(); if (o.term) x.term = s(o.term).toLowerCase(); if (typeof o.min === 'number' && o.min > 0) x.min = Math.round(o.min); if (typeof o.max === 'number' && o.max > 0) x.max = Math.round(o.max); return x; }) })),
    uitleg: s(it.uitleg), fouten: (it.fouten || []).map(s).filter(Boolean).slice(0, 5), kort: s(it.kort), faq: (it.faq || []).filter(x => x && x.q && x.a).map(x => ({ q: s(x.q), a: s(x.a) })).slice(0, 7) };
  if (it.seoTitle) out.seoTitle = s(it.seoTitle).slice(0, 65); if (it.metaDesc) out.metaDesc = s(it.metaDesc).slice(0, 160);
  if (Array.isArray(it.verwant) && slugs) out.verwant = [...new Set(it.verwant.map(x => s(x).toLowerCase()))].filter(x => x !== cand.slug && slugs.has(x)).slice(0, 8);
  return out;
}

// ---------- één keuzehulp maken ----------
const VB1 = seed.items.find(i => i.slug === 'airfryer') || seed.items[0];
const VB2 = seed.items.find(i => i.slug === 'koptelefoon') || seed.items.find(i => i.questions.some(q => q.options.some(o => o.term))) || seed.items[1];
const SCHRIJF = `Je schrijft keuzehulpen voor keuzehulp.best: onafhankelijke Nederlandse koopgidsen. Een bezoeker beantwoordt 3 vragen en krijgt één passend product bij bol.com met de prijs van vandaag, plus een goedkoper en een luxer alternatief.
Zo werkt de productkeuze: de site zoekt bij bol met 'term' (een optie kan 'term' vervangen, of met 'add' een woord toevoegen), en rangschikt de resultaten op 'must' (korte stukjes tekst die in de producttitel staan), 'min'/'max' (prijs in euro) en beoordeling.
Regels:
- Gewoon, direct Nederlands (je/jij). Geen hype, geen uitroeptekens, geen verzonnen testresultaten, percentages of bronnen, geen merkvoorkeur zonder reden, geen medische of financiële beloftes.
- Precies 3 vragen. Vraag 1 is de grootste splitsing (type, maat of gebruik). De laatste vraag is meestal het budget. 2–4 opties per vraag, die elkaar uitsluiten en samen iedereen dekken.
- 'must': kleine letters, korte stukjes die letterlijk in de echte bol-titels hieronder voorkomen; geef 3–6 varianten (bijv. "55 inch", "55\\"", "139 cm"). Laat 'must' weg bij een optie die niet filtert.
- 'add' alleen als het zoekwoord daarna nog genoeg resultaten geeft; 'term' op een optie alleen als dat type bij bol anders heet.
- Prijsgrenzen haal je uit de echte prijzen hieronder; budgetopties overlappen een beetje.
- 'kort': 1–2 zinnen, maximaal 45 woorden: het directe antwoord op "welke X moet ik kopen". Dit is wat AI-assistenten en Google citeren, dus concreet en zelfstandig leesbaar.
- 'uitleg': 70–130 woorden over de 2–4 dingen die echt het verschil maken, met maten, eenheden en vuistregels.
- 'fouten': 3 concrete misstappen.
- 'faq': 4–6 vragen, zoveel mogelijk de echte zoekvragen hieronder (netjes geformuleerd), elk antwoord 1–2 zinnen, feitelijk, zonder prijzen die veranderen.
- 'title': "Welke X past bij jou?". 'h1': "X kiezen: …?" met het zoekwoord. 'seoTitle': maximaal 60 tekens, met "X kopen" of "welke X", eindigt op "| Keuzehulp". 'metaDesc': maximaal 155 tekens, noemt "3 vragen" en "prijs van vandaag bij bol". 'intro': 2–3 zinnen over wat er misgaat als je verkeerd kiest en wat je hier krijgt.
- 'term': het gewone zoekwoord (enkelvoud) waarmee bol de juiste producten laat zien.
- 'verwant': 4–8 slugs uit de lijst bestaande keuzehulpen die een koper van dit product er ook bij nodig heeft of ernaast vergelijkt (alleen echte verbanden, geen opvulling). De site linkt deze pagina's aan elkaar.
- Noem in 'uitleg', 'fouten' of 'faq', alleen waar het de lezer echt helpt, 1–3 van die verwante producten bij hun gewone naam (bijvoorbeeld "een topper op je matras"); de site maakt daar automatisch een link van naar hun keuzehulp.
Antwoord alleen met één JSON-object met precies de velden van de voorbeelden plus seoTitle, metaDesc en verwant.`;
async function maakItem(cand, d) {
  const best = await bestaande(); const slugs = new Set(best.map(b => b.slug));
  const r = await searchCached(cand.term, { country: 'NL', size: 48, sort: 'RELEVANCE' }).catch(() => ({ products: [] }));
  const prods = (r.products || []).filter(p => p.price != null && p.image);
  if (prods.length < 12) return { ok: false, waarom: 'te weinig aanbod bij bol voor "' + cand.term + '" (' + prods.length + ')' };
  const qs = ['welke ' + cand.term + ' ', cand.term + ' ', 'hoeveel ' + cand.term, 'beste ' + cand.term + ' ', cand.term + ' of '];
  const sug = [...new Set((await pool(qs, 5, q => suggest(q, 'nl'))).flat().filter(Boolean))].slice(0, 30);
  const user = 'Onderwerp: ' + cand.term + ' (slug ' + cand.slug + ', categorie ' + cand.cat + '). Waarom nu: ' + (cand.waarom || '-') + '. Datum: ' + d + '.\n\nEchte producten bij bol voor "' + cand.term + '" (titel — prijs):\n' + prods.slice(0, 40).map(p => '- ' + p.title.slice(0, 100) + ' — €' + p.price).join('\n') + '\n\nEchte zoekvragen van Nederlanders (Google):\n' + (sug.length ? sug.map(s => '- ' + s).join('\n') : '- (geen)') + '\n\nBestaande keuzehulpen (slugs) om uit te kiezen voor \'verwant\':\n' + best.filter(b => b.slug !== cand.slug).map(b => b.slug).join(', ') + '\n\nVoorbeeld 1:\n' + JSON.stringify(VB1) + '\n\nVoorbeeld 2:\n' + JSON.stringify(VB2);
  let item, fouten, check, model;
  try { const a = await claude(SCHRIJF, user, 4500); model = a.model; item = netjes(jsonUit(a.txt), cand, slugs); } catch (e) { return { ok: false, waarom: 'schrijven mislukt: ' + String(e.message || e).slice(0, 160) }; }
  fouten = schemaFouten(item);
  if (!fouten.length) check = await toets(item);
  if (fouten.length || !check.geslaagd) { // één herstelronde met de echte bol-resultaten van de routes die niets passends vonden
    const probleem = fouten.length ? 'Opbouwfouten: ' + fouten.join('; ') : 'Bij ' + check.fout.length + ' van de ' + check.routes + ' antwoordroutes vindt de site geen passend product. Per route de zoekterm, de filters en wat bol teruggeeft:\n' + JSON.stringify(check.fout.slice(0, 12).map(x => ({ route: x.route, term: x.term, must: x.must, min: x.min, max: x.max, besteGevonden: x.best, bolGeeft: x.voorbeeld })));
    try { const a = await claude(SCHRIJF, user + '\n\nJouw eerste versie:\n' + JSON.stringify(item) + '\n\n' + probleem + '\n\nPas must, add, term, min, max en zo nodig de opties aan zodat elke route een passend product vindt. Geef het complete, gecorrigeerde JSON-object terug.', 4500); item = netjes(jsonUit(a.txt), cand, slugs); } catch (e) { return { ok: false, waarom: 'herstel mislukt: ' + String(e.message || e).slice(0, 160) }; }
    fouten = schemaFouten(item); if (fouten.length) return { ok: false, waarom: 'opbouw klopt niet: ' + fouten.join('; ') };
    check = await toets(item);
  }
  if (!check.geslaagd) return { ok: false, waarom: 'bol-toets: ' + check.ok + ' van ' + check.routes + ' routes passend' + (check.eersteVraagGedekt ? '' : ', niet elke keuze bij vraag 1 gedekt'), toets: { pct: check.pct, fout: check.fout.slice(0, 5).map(x => x.route + ' ' + x.term) }, item };
  return { ok: true, item, toets: { routes: check.routes, ok: check.ok, pct: check.pct }, model, zoekvragen: sug.length };
}
async function indexnow(urls) { try { const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: DOMAIN.replace(/^https?:\/\//, ''), key: INDEXNOW_KEY, keyLocation: DOMAIN + '/' + INDEXNOW_KEY + '.txt', urlList: urls }) }); return r.status; } catch (e) { return 0; } }
async function publiceer(item, cand, d) {
  const it = Object.assign({}, item, { publishAt: d, updatedAt: d, gemaakt: 'kzmaak', bron: cand.bron || '', waarom: cand.waarom || '' });
  await kv.set('hjdk:kz:' + it.slug, it); const idx = (await kv.get('hjdk:kz:index')) || []; if (idx.indexOf(it.slug) < 0) { idx.push(it.slug); await kv.set('hjdk:kz:index', idx); }
  const st = await indexnow([DOMAIN + '/' + it.slug, DOMAIN + '/', DOMAIN + '/categorie/' + catSlug(it.cat), DOMAIN + '/llms.txt', DOMAIN + '/llms-full.txt'].concat((it.verwant || []).map(v => DOMAIN + '/' + v)));
  return { url: DOMAIN + '/' + it.slug, indexnow: st };
}

// ---------- verversen: bestaande keuzehulpen die nu actueel zijn een actuele tekst geven (vragen en productkeuze blijven gelijk) ----------
const VERVERS_SYS = `Je werkt een bestaande keuzehulp van keuzehulp.best bij zodat hij aansluit op wat nu speelt (seizoen, moment, weer of nieuws), voor Google en AI-assistenten.
Regels: gewoon, direct Nederlands (je/jij), geen hype, geen uitroeptekens, geen verzonnen cijfers of tests, niets dat over een paar weken onwaar is zonder datum.
Je verandert de vragen en opties NIET. Je herschrijft alleen: seoTitle (max 60 tekens, eindigt op "| Keuzehulp"), metaDesc (max 155 tekens, noemt "3 vragen" en "prijs van vandaag bij bol"), intro (2–3 zinnen), kort (1–2 zinnen, max 45 woorden, het directe antwoord), uitleg (70–130 woorden), fouten (3), faq (4–6, echte zoekvragen, antwoorden 1–2 zinnen), en actueel: één zin die zegt waarom dit nu speelt (bijv. "Sinterklaas valt op 5 december: bestel uiterlijk eind november."), plus actueelTot (datum JJJJ-MM-DD waarna die zin niet meer klopt).
Antwoord alleen met één JSON-object met precies die velden.`;
async function volledigItem(slug) { try { const v = await kv.get('hjdk:kz:' + slug); if (v && v.slug && !v.override) return v; const s0 = seed.items.find(i => i.slug === slug); return s0 ? Object.assign({}, s0, v && v.override ? v : {}) : (v || null); } catch (e) { return seed.items.find(i => i.slug === slug) || null; } }
async function verversItem(slug, d, plan) {
  const it = await volledigItem(slug); if (!it) return { ok: false, waarom: 'onbekende keuzehulp' };
  const sig = (await kv.get(K.sig)) || {}; const r = await searchCached(it.term, { country: 'NL', size: 24, sort: 'RELEVANCE' }).catch(() => ({ products: [] }));
  const ctx = { datum: d, momentenNu: momenten(d, -1, 21), weer: sig.weer || [], nieuws: (sig.nieuws || []).slice(0, 25), uitgelicht: ((await kv.get(K.uit)) || {}).blokken || [] };
  const user = 'Keuzehulp (huidige versie):\n' + JSON.stringify({ slug: it.slug, title: it.title, h1: it.h1, term: it.term, cat: it.cat, intro: it.intro, kort: it.kort, uitleg: it.uitleg, fouten: it.fouten, faq: it.faq, vragen: it.questions.map(q => q.q + ' [' + q.options.map(o => o.label).join(' | ') + ']') }) + '\n\nWat nu speelt:\n' + JSON.stringify(ctx) + '\n\nEchte producten bij bol nu (titel — prijs):\n' + (r.products || []).slice(0, 20).map(p => '- ' + String(p.title).slice(0, 90) + ' — €' + p.price).join('\n');
  let j; try { j = jsonUit((await claude(VERVERS_SYS, user, 3000)).txt); } catch (e) { return { ok: false, waarom: 'verversen mislukt: ' + String(e.message || e).slice(0, 140) }; }
  const s1 = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); const upd = {};
  ['seoTitle', 'metaDesc', 'intro', 'kort', 'uitleg', 'actueel'].forEach(k => { if (s1(j[k]).length > 10) upd[k] = s1(j[k]); });
  if (upd.seoTitle) upd.seoTitle = upd.seoTitle.slice(0, 65); if (upd.metaDesc) upd.metaDesc = upd.metaDesc.slice(0, 160); if (upd.actueel) upd.actueel = upd.actueel.slice(0, 220);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s1(j.actueelTot))) upd.actueelTot = s1(j.actueelTot); else if (upd.actueel) upd.actueelTot = addDays(d, 21);
  if (Array.isArray(j.fouten) && j.fouten.length >= 3) upd.fouten = j.fouten.map(s1).filter(Boolean).slice(0, 5);
  if (Array.isArray(j.faq) && j.faq.length >= 3) upd.faq = j.faq.filter(x => x && x.q && x.a).map(x => ({ q: s1(x.q), a: s1(x.a) })).slice(0, 7);
  if (Object.keys(upd).length < 4) return { ok: false, waarom: 'te weinig bruikbare velden terug' };
  const isSeed = seed.items.some(i => i.slug === slug); const cur = (await kv.get('hjdk:kz:' + slug)) || {};
  const next = isSeed ? Object.assign({}, cur && cur.override ? cur : {}, upd, { slug, override: true, updatedAt: d, ververst: d }) : Object.assign({}, it, upd, { updatedAt: d, ververst: d });
  await kv.set('hjdk:kz:' + slug, next); const idx = (await kv.get('hjdk:kz:index')) || []; if (idx.indexOf(slug) < 0) { idx.push(slug); await kv.set('hjdk:kz:index', idx); }
  const st = await indexnow([DOMAIN + '/' + slug, DOMAIN + '/', DOMAIN + '/categorie/' + catSlug(it.cat)]);
  return { ok: true, actueel: upd.actueel || '', indexnow: st };
}

// ---------- één stap van de dagronde ----------
async function stap(opts) {
  const d = DAY(); const o = opts || {}; let plan = (await kv.get(K.plan(d))) || null;
  if (!plan) { const p = await maakPlan(d); plan = { dag: d, at: new Date().toISOString(), lijst: p.lijst, ververs: p.ververs, verversKlaar: [], klaar: [], mislukt: [], plannen: 1 }; await kv.set(K.plan(d), plan, { ex: 20 * 86400 }); await log({ stap: 'plan', ok: true, onderwerpen: p.lijst.map(x => x.slug), ververs: p.ververs }); return { gedaan: 'plan', plan: p.lijst, ververs: p.ververs }; }
  if (!o.extra && !o.dry && !o.onderwerp && plan.klaar.length >= PER_DAG()) {
    const vk = plan.verversKlaar || []; const v = (plan.ververs || []).find(x => vk.indexOf(x) < 0);
    if (v && vk.length < VERVERS()) { const t0 = Date.now(); const r = await verversItem(v, d, plan); plan.verversKlaar = vk.concat(v); await kv.set(K.plan(d), plan, { ex: 20 * 86400 }); await log({ stap: 'ververs', ok: r.ok, slug: v, actueel: r.actueel, waarom: r.waarom, ms: Date.now() - t0 }); return { gedaan: r.ok ? 'ververst' : 'ververs-mislukt', onderwerp: v, waarom: r.waarom }; }
    return { gedaan: 'niets', reden: 'dagdoel gehaald (' + plan.klaar.length + '/' + PER_DAG() + ')' };
  }
  const have = new Set((await bestaande()).map(b => b.slug));
  let cand = o.onderwerp ? (plan.lijst.find(x => x.slug === o.onderwerp) || STARTLIJST.find(x => x.slug === o.onderwerp) || { slug: o.onderwerp, term: o.onderwerp.replace(/-/g, ' '), cat: 'Wonen', bron: 'handmatig' }) : plan.lijst.find(x => !have.has(x.slug) && !plan.mislukt.some(m => m.slug === x.slug));
  if (!cand && (plan.plannen || 1) < 4) { const p = (await maakPlan(d, plan.mislukt.map(m => m.slug))).lijst; plan.lijst = plan.lijst.concat(p.filter(x => !plan.lijst.some(y => y.slug === x.slug))); plan.plannen = (plan.plannen || 1) + 1; await kv.set(K.plan(d), plan, { ex: 20 * 86400 }); cand = plan.lijst.find(x => !have.has(x.slug) && !plan.mislukt.some(m => m.slug === x.slug)); }
  if (!cand) return { gedaan: 'niets', reden: 'geen onderwerpen meer in het plan van vandaag' };
  const t0 = Date.now(); const r = await maakItem(cand, d);
  if (o.dry) return { gedaan: 'proef', onderwerp: cand, resultaat: r, ms: Date.now() - t0 };
  if (!r.ok) {
    plan.mislukt.push({ slug: cand.slug, waarom: r.waarom }); await kv.set(K.plan(d), plan, { ex: 20 * 86400 });
    await log({ stap: 'maak', ok: false, slug: cand.slug, waarom: r.waarom, ms: Date.now() - t0 });
    try { const les = (await kv.get(K.lessen)) || []; les.unshift(cand.slug + ' (' + cand.term + '): ' + r.waarom); await kv.set(K.lessen, les.slice(0, 40)); } catch (e) {}
    return { gedaan: 'mislukt', onderwerp: cand.slug, waarom: r.waarom };
  }
  const p = await publiceer(r.item, cand, d);
  plan.klaar.push({ slug: cand.slug, url: p.url, routesOk: r.toets.pct, bron: cand.bron }); await kv.set(K.plan(d), plan, { ex: 20 * 86400 });
  await log({ stap: 'maak', ok: true, slug: cand.slug, url: p.url, bron: cand.bron, routesOk: r.toets.pct + '%', model: r.model, indexnow: p.indexnow, ms: Date.now() - t0 });
  return { gedaan: 'gepubliceerd', onderwerp: cand.slug, url: p.url, toets: r.toets };
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store'); OIDC_HDR = String(req.headers['x-vercel-oidc-token'] || '');
  const url = new URL(req.url, 'http://x'); const op = url.searchParams.get('op') || 'status';
  const tok = url.searchParams.get('token') || req.headers['x-hjdk-token'] || '';
  const isToken = !!process.env.HJDK_TOKEN && tok === process.env.HJDK_TOKEN;
  const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
  try {
    if (op === 'status') {
      const d = DAY(); const [plan, lg, sig, tk, calls, best, pr, uit, rt] = await Promise.all([kv.get(K.plan(d)), kv.get(K.log), kv.get(K.sig), kv.get(K.tok(d)), kv.get(K.calls(d)), bestaande(), kv.get(K.prest), kv.get(K.uit), claudeRoute()]);
      const gemaakt = best.filter(b => b.gemaakt === 'kzmaak').sort((a, b) => String(b.publishAt).localeCompare(String(a.publishAt))).map(b => ({ slug: b.slug, dag: b.publishAt, bron: b.bron || '', url: DOMAIN + '/' + b.slug }));
      return res.status(200).json({ ok: true, nu: new Date().toISOString(), instellingen: { perDag: PER_DAG(), verversPerDag: VERVERS(), claude: rt ? rt.label : 'ontbreekt', maxClaudeAanroepenPerDag: MAX_CLAUDE() },
        vandaag: plan ? { klaar: plan.klaar, mislukt: plan.mislukt, ververst: plan.verversKlaar || [], nogInPlan: plan.lijst.filter(x => !plan.klaar.some(k => k.slug === x.slug) && !plan.mislukt.some(m => m.slug === x.slug)).map(x => x.slug + ' — ' + (x.bron || '') + ': ' + (x.waarom || '')) } : null,
        claudeVandaag: { aanroepen: Number(calls) || 0, tokens: Number(tk) || 0 }, totaalKeuzehulpen: best.length, doorDezeRondeGemaakt: gemaakt.length, gemaakt: gemaakt.slice(0, 60),
        uitgelichtVandaag: uit || null,
        geleerd: pr ? { dag: pr.dag, organischBezoekPerBron: pr.organischPerBron, crawlersTotaal: pr.crawlersTotaal, perBron: pr.perBron, perCategorie: (pr.perCategorie || []).slice(0, 12), besteOrganisch: (pr.besteOrganisch || []).slice(0, 12), zonderBereikNa14Dagen: pr.zonderBereikNa14Dagen } : null,
        signalen: sig ? { dag: sig.dag, metingen: sig.metingen, momentenNu: sig.nu, komendeMomenten: sig.momenten, weer: sig.weer, schoolvakanties: sig.schoolvakanties, nieuwskoppen: (sig.nieuws || []).slice(0, 12), stijgers: (sig.stijgers || []).slice(0, 15).map(s => s.vb || s.k), zonderResultaat: (sig.zonderResultaat || []).slice(0, 10), verzoeken: (sig.verzoeken || []).slice(0, 10) } : null,
        startlijstNogTeGaan: STARTLIJST.filter(x => !best.some(b => b.slug === x.slug)).map(x => x.slug + (x.vanaf ? ' (vanaf ' + x.vanaf + ')' : '')),
        verdiensten30Dagen: await kv.get(K.verd).then(v => v ? (v.ok ? { periode: v.periode, totaal: v.totaal, categorieen: (v.categorieen || []).slice(0, 10), besteKeuzehulpen: (v.besteKeuzehulpen || []).slice(0, 10), veelKliksGeenOrders: v.veelKliksGeenOrders, verkochteProducten: (v.verkochteProducten || []).slice(0, 15) } : { fout: v.fout }) : null).catch(() => null),
        laatsteRondes: (lg || []).slice(0, 40), lessen: ((await kv.get(K.lessen)) || []).slice(0, 15) });
    }
    if (op === 'signalen') { if (!isCron && !isToken) return res.status(401).json({ error: 'alleen cron of token' }); const s = await signalen(); return res.status(200).json({ ok: true, dag: s.dag, metingen: s.metingen, weer: s.weer, nieuws: (s.nieuws || []).length, stijgers: s.stijgers.slice(0, 10), ms: s.ms }); }
    if (op === 'dag' || op === 'nu') {
      if (op === 'dag' && !isCron && !isToken) return res.status(401).json({ error: 'alleen cron of token' });
      if (op === 'nu' && !isToken) return res.status(401).json({ error: 'token' });
      const lock = await kv.raw(['SET', K.lock, String(Date.now()), 'NX', 'EX', '295']).catch(() => 'OK');
      if (lock !== 'OK') return res.status(200).json({ ok: true, gedaan: 'niets', reden: 'er draait al een ronde' });
      const t0 = Date.now(); const stappen = [];
      try {
        if (!(await kv.get(K.sig).then(s => s && s.dag === DAY() && s.weer).catch(() => false))) { try { await signalen(); } catch (e) { await log({ stap: 'signalen', ok: false, waarom: String(e.message || e).slice(0, 160) }); } }
        const o = { extra: url.searchParams.get('extra') === '1', dry: url.searchParams.get('dry') === '1', onderwerp: String(url.searchParams.get('onderwerp') || '').replace(/[^a-z0-9-]/g, '') || null };
        // meerdere stappen per aanroep zolang er tijd is (elke stap ~30–90 s), zodat 10+ keuzehulpen per ochtend ruim lukt
        for (let n = 0; n < 6; n++) { const r = await stap(o); stappen.push(r); if (o.dry || o.onderwerp || r.gedaan === 'niets' || Date.now() - t0 > 150000) break; }
        return res.status(200).json({ ok: true, stappen, ms: Date.now() - t0 });
      } finally { try { await kv.del([K.lock]); } catch (e) {} }
    }
    return res.status(404).json({ error: 'onbekende op' });
  } catch (e) { await log({ stap: op, ok: false, waarom: String(e && e.message || e).slice(0, 200) }); return res.status(200).json({ ok: false, error: String(e && e.message || e).slice(0, 300) }); }
}
