// KZMAAK — elke dag automatisch nieuwe keuzehulpen, volledig in de cloud: Vercel-cron + Claude API + bol API + Redis.
// Geen Claude-account, geen chat en geen computer nodig. Alles (plan, stand, lessen, fouten) staat in Redis en op /api/kzmaak/status.
//
//   /api/kzmaak/signalen   cron 03:50 UTC   signalen verzamelen: Google-autocomplete NL/BE (dagelijkse meting -> eigen tijdreeks, stijgers),
//                                           Google Trends NL/BE, bol populair, zoekopdrachten op de site zonder resultaat, verzoeken, seizoenskalender,
//                                           en wat echt verdient: bol Reporting API (30 dagen kliks, orders, commissie per keuzehulp en categorie, verkochte producten)
//   /api/kzmaak/dag        cron */10 3-9    per ronde één stap: plan maken (Claude kiest onderwerpen) of één keuzehulp maken -> toetsen bij bol
//                                           (elke antwoordroute moet een passend product vinden) -> publiceren -> IndexNow. Stopt bij het dagdoel.
//   /api/kzmaak/status     openbaar         stand: dagdoel, plan van vandaag, gemaakt, mislukt (met reden), signalen, tokenverbruik
//   /api/kzmaak/nu?token=HJDK_TOKEN        één stap nu (&extra=1 = boven het dagdoel, &dry=1 = maken en toetsen zonder publiceren, &onderwerp=slug)
//
// Instellingen (optioneel, env): KZ_PER_DAG (standaard 8, max 20), ANTHROPIC_MODEL. Sleutel: ANTHROPIC_API_KEY in env of via /setup.
import { kv } from '../lib/db.js';
import { searchCached, catalog, getToken } from '../lib/bol.js';
import seed from '../data/kz.json' with { type: 'json' };

const DAY = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const DOMAIN = 'https://' + ((seed.site && seed.site.domain) || 'keuzehulp.best');
const INDEXNOW_KEY = '466971cbc1bbe43e6bb64a94465e4470';
const PER_DAG = () => Math.max(0, Math.min(20, Number(process.env.KZ_PER_DAG || 8)));
const MAX_CLAUDE = () => PER_DAG() * 4 + 6; // plafond op Claude-aanroepen per dag (plan + schrijven + herstel)
const MODELS = [...new Set([process.env.ANTHROPIC_MODEL, 'claude-sonnet-5-5', 'claude-sonnet-4-5'].filter(Boolean))];
const K = { plan: d => 'hjdk:kz:maak:plan:' + d, log: 'hjdk:kz:maak:log', sig: 'hjdk:kz:signalen', sigDag: d => 'hjdk:kz:sig:dag:' + d, lock: 'hjdk:kz:maak:lock', tok: d => 'c:hjdk6-kzmaak-tokens-' + d, calls: d => 'c:hjdk6-kzmaak-calls-' + d, lessen: 'hjdk:kz:maak:lessen', verd: 'hjdk:kz:verdiensten' };
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
function momenten(d) {
  const out = []; [Number(d.slice(0, 4)), Number(d.slice(0, 4)) + 1].forEach(y => {
    const bf = addDays(nthWeekday(y, 11, 4, 4), 1);
    [['Halloween', y + '-10-31'], ['Black Friday (acties vanaf ~10 nov)', bf], ['Sinterklaas', y + '-12-05'], ['Kerst', y + '-12-25'], ['Oud en nieuw', y + '-12-31'], ['Goede voornemens', y + '-01-02'], ['Valentijnsdag', y + '-02-14'], ['Pasen', easter(y)], ['Koningsdag', y + '-04-27'], ['Hooikoorts', y + '-04-01'], ['Moederdag', nthWeekday(y, 5, 0, 2)], ['Vaderdag', nthWeekday(y, 6, 0, 3)], ['Zomer en hitte', y + '-06-21'], ['Zomervakantie', y + '-07-10'], ['Terug naar school', y + '-08-25'], ['Stookseizoen', y + '-10-01'], ['Tuinseizoen', y + '-03-20']].forEach(([n, dt]) => { const w = Math.round((Date.parse(dt) - Date.parse(d)) / 864e5); if (w >= 7 && w <= 63) out.push({ moment: n, datum: dt, overDagen: w }); });
  });
  return out.sort((a, b) => a.overDagen - b.overDagen);
}

// ---------- hulpjes ----------
async function secrets() { try { return (await kv.get('hjdk:secrets')) || {}; } catch (e) { return {}; } }
async function anthropicKey() { return process.env.ANTHROPIC_API_KEY || (await secrets()).ANTHROPIC_API_KEY || ''; }
async function pool(list, n, fn) { const out = new Array(list.length); let i = 0; await Promise.all(Array.from({ length: Math.max(1, Math.min(n, list.length)) }, async () => { while (i < list.length) { const k = i++; try { out[k] = await fn(list[k], k); } catch (e) { out[k] = null; } } })); return out; }
async function log(e) { try { const l = (await kv.get(K.log)) || []; l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set(K.log, l.slice(0, 300)); } catch (x) {} }
const median = a => { const s = a.filter(x => typeof x === 'number').sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 4; };
const pctFor = cat => median(seed.items.filter(i => i.cat === cat).map(i => i.pct));
function jsonUit(txt) { const s = String(txt || '').replace(/```(?:json)?/g, ''); const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a < 0 || b < a) throw new Error('geen JSON in het antwoord'); return JSON.parse(s.slice(a, b + 1)); }

async function claude(system, user, maxTokens) {
  const d = DAY(); const n = Number(await kv.get(K.calls(d)).catch(() => 0)) || 0;
  if (n >= MAX_CLAUDE()) throw new Error('daglimiet Claude-aanroepen bereikt (' + MAX_CLAUDE() + ')');
  const key = await anthropicKey(); if (!key) throw new Error('ANTHROPIC_API_KEY ontbreekt: zet hem op /setup (of in Vercel)');
  let last = '';
  for (const model of MODELS) {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model, max_tokens: maxTokens || 4000, system, messages: [{ role: 'user', content: user }] }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      const txt = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
      try { await kv.incrMany([[K.calls(d), 1], [K.tok(d), ((j.usage && j.usage.input_tokens) || 0) + ((j.usage && j.usage.output_tokens) || 0)]]); } catch (e) {}
      return { txt, model };
    }
    last = r.status + ' ' + ((j.error && j.error.message) || '');
    if (!(r.status === 404 || (r.status === 400 && /model/i.test(last)))) break; // alleen bij een onbekend model het volgende proberen
  }
  throw new Error('Claude API: ' + last.slice(0, 200));
}

async function bestaande() { // alles wat er is of al ingepland staat (seed + Redis), ook toekomstige publicaties
  const out = seed.items.map(i => ({ slug: i.slug, title: i.title, term: i.term, cat: i.cat }));
  try { const idx = (await kv.get('hjdk:kz:index')) || []; const vals = idx.length ? await kv.mget(...idx.map(s => 'hjdk:kz:' + s)) : []; vals.forEach(v => { if (v && v.slug && !out.some(o => o.slug === v.slug)) out.push({ slug: v.slug, title: v.title, term: v.term, cat: v.cat, publishAt: v.publishAt, gemaakt: v.gemaakt }); }); } catch (e) {}
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
  const [nl, be, bol, zr, vd] = await Promise.all([trendsRss('NL'), trendsRss('BE'), bolPopulair(), zonderResultaat(), bestaande().then(verdiensten).catch(e => ({ ok: false, fout: String(e.message || e).slice(0, 160) }))]);
  try { await kv.set(K.verd, Object.assign({ dag: d }, vd)); } catch (e) {}
  let verzoeken = []; try { verzoeken = ((await kv.get('hjdk:kz:vragen')) || []).filter(v => v.q && Date.now() - v.at < 60 * 864e5).map(v => v.q).slice(0, 40); } catch (e) {}
  const out = { dag: d, metingen: { autocompleteVragen: jobs.length, suggesties: ruw, dagenHistorie: prev.length }, topVraag: rij.slice(0, 40).map(r => r.vb), stijgers, nieuw, trends: { nl, be }, bolPopulair: bol.slice(0, 40), zonderResultaat: zr, verzoeken, momenten: momenten(d), verdiensten: vd.ok ? { totaal: vd.totaal, categorieen: vd.categorieen.slice(0, 12), besteKeuzehulpen: vd.besteKeuzehulpen.slice(0, 15), veelKliksGeenOrders: vd.veelKliksGeenOrders, verkochteProducten: vd.verkochteProducten.slice(0, 30) } : { fout: vd.fout }, ms: Date.now() - t0 };
  await kv.set(K.sig, out);
  await log({ stap: 'signalen', ok: true, suggesties: ruw, stijgers: stijgers.length, nieuw: nieuw.length, bolOrders30d: vd.ok ? vd.totaal.orders : 'fout: ' + vd.fout, ms: out.ms });
  return out;
}

// ---------- plan: welke onderwerpen vandaag ----------
async function maakPlan(d, extraUitsluiten) {
  const sig = (await kv.get(K.sig)) || {}; const best = await bestaande(); const have = new Set(best.map(b => b.slug).concat(extraUitsluiten || []));
  const lessen = (await kv.get(K.lessen)) || [];
  const start = STARTLIJST.filter(x => (!x.vanaf || x.vanaf <= d) && !have.has(x.slug)).slice(0, 14);
  const system = 'Je bent de hoofdredacteur van keuzehulp.best: onafhankelijke Nederlandse keuzehulpen (3 vragen -> 1 passend product bij bol.com met de prijs van vandaag). Je kiest welke nieuwe keuzehulpen er vandaag bij komen. Een goed onderwerp: (1) een producttype dat mensen in Nederland en België echt zoeken met koopintentie ("welke X kopen", "beste X"), (2) waar verkeerd kiezen echt kan (minstens twee keuzes die ertoe doen: maat, type, gebruik, budget), (3) breed verkrijgbaar bij bol.com, bij voorkeur vanaf zo\'n 25 euro, (4) geen dubbel van een bestaande keuzehulp (een andere zoekintentie mag wel: oordopjes naast koptelefoon), (5) geen medicijnen, supplementen, wapens, vapes, vuurwerk, erotiek, alcohol of tabak, en geen losse merken of modellen. Voorrang: verzoeken van bezoekers en zoekopdrachten op de site zonder resultaat; dan wat echt geld oplevert (zie verdiensten: producttypes die via de sites al verkocht worden maar nog geen eigen keuzehulp hebben, en onderwerpen in categorieen met de meeste commissie per 1.000 bol-kliks; hoe meer orders er zijn, hoe zwaarder dit weegt; maak geen extra onderwerpen in de buurt van keuzehulpen met veel kliks en geen orders); dan onderwerpen waarvan de piek over 2 tot 9 weken valt (Google heeft aanlooptijd nodig); dan sterke stijgers in de zoekdata; dan de startlijst. Een duur product bij een hoog commissiepercentage weegt zwaarder dan een goedkoop product. Bouw de site breed uit: vul ook gaten in categorieen met weinig keuzehulpen, en kies onderwerpen die logisch naast bestaande keuzehulpen staan (wie een kinderwagen zoekt, zoekt ook een autostoel), zodat ze naar elkaar kunnen linken. Nieuwsonderwerpen uit Google Trends zijn alleen bruikbaar als er een duidelijke koopvraag achter zit. Antwoord alleen met JSON.';
  const user = JSON.stringify({
    datum: d, aantalNodig: Math.max(8, PER_DAG() * 2), toegestaneCategorieen: CATS, aantalPerCategorie: Object.fromEntries(CATS.map(c => [c, best.filter(b => b.cat === c).length])),
    bestaandeSlugs: best.map(b => b.slug).join(', '),
    signalen: { verzoekenVanBezoekers: sig.verzoeken || [], zoekopdrachtenZonderResultaat: sig.zonderResultaat || [], stijgersInGoogleZoekvragen: (sig.stijgers || []).map(s => s.vb || s.k), nieuwInGoogleZoekvragen: (sig.nieuw || []).map(s => s.vb || s.k), veelGezochtNu: sig.topVraag || [], googleTrendsNL: (sig.trends && sig.trends.nl || []).map(t => t.t), googleTrendsBE: (sig.trends && sig.trends.be || []).map(t => t.t), bolPopulairNu: sig.bolPopulair || [], komendeMomenten: momenten(d), verdiensten: sig.verdiensten || null, commissiePercentagePerCategorie: Object.fromEntries(CATS.map(c => [c, pctFor(c) + '%'])) },
    startlijst: start, lessenUitEerdereRondes: lessen.slice(0, 12),
    formaat: { plan: [{ slug: 'kleine-letters-met-streepjes', term: 'het gewone zoekwoord waarmee bol de juiste producten toont', cat: 'een van de toegestane categorieen', waarom: 'korte reden met het signaal', bron: 'verzoek | zonder-resultaat | seizoen | stijger | startlijst | trend' }] }
  });
  const { txt } = await claude(system, user, 2500);
  const j = jsonUit(txt); const plan = [];
  (j.plan || []).forEach(p => {
    const slug = String(p.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
    if (!slug || have.has(slug) || RESERVED.has(slug) || plan.some(x => x.slug === slug)) return;
    plan.push({ slug, term: String(p.term || slug.replace(/-/g, ' ')).slice(0, 60), cat: CATS.includes(p.cat) ? p.cat : (start.find(s => s.slug === slug) || {}).cat || 'Wonen', waarom: String(p.waarom || '').slice(0, 200), bron: String(p.bron || '').slice(0, 30) });
  });
  start.forEach(s => { if (plan.length < Math.max(8, PER_DAG() * 2) && !plan.some(x => x.slug === s.slug)) plan.push(Object.assign({ bron: 'startlijst' }, s)); }); // vangnet
  return plan;
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
  const user = 'Onderwerp: ' + cand.term + ' (slug ' + cand.slug + ', categorie ' + cand.cat + '). Waarom nu: ' + (cand.waarom || '-') + '. Datum: ' + d + '.\n\nEchte producten bij bol voor "' + cand.term + '" (titel — prijs):\n' + prods.slice(0, 40).map(p => '- ' + p.title.slice(0, 100) + ' — €' + p.price).join('\n') + '\n\nEchte zoekvragen van Nederlanders (Google):\n' + (sug.length ? sug.map(s => '- ' + s).join('\n') : '- (geen)') + '\n\nBestaande keuzehulpen (slug: titel) voor \'verwant\':\n' + best.filter(b => b.slug !== cand.slug).map(b => b.slug + ': ' + (b.title || '')).join('\n') + '\n\nVoorbeeld 1:\n' + JSON.stringify(VB1) + '\n\nVoorbeeld 2:\n' + JSON.stringify(VB2);
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

// ---------- één stap van de dagronde ----------
async function stap(opts) {
  const d = DAY(); const o = opts || {}; let plan = (await kv.get(K.plan(d))) || null;
  if (!plan) { const p = await maakPlan(d); plan = { dag: d, at: new Date().toISOString(), lijst: p, klaar: [], mislukt: [], plannen: 1 }; await kv.set(K.plan(d), plan, { ex: 20 * 86400 }); await log({ stap: 'plan', ok: true, onderwerpen: p.map(x => x.slug) }); return { gedaan: 'plan', plan: p }; }
  if (!o.extra && !o.dry && plan.klaar.length >= PER_DAG()) return { gedaan: 'niets', reden: 'dagdoel gehaald (' + plan.klaar.length + '/' + PER_DAG() + ')' };
  const have = new Set((await bestaande()).map(b => b.slug));
  let cand = o.onderwerp ? (plan.lijst.find(x => x.slug === o.onderwerp) || STARTLIJST.find(x => x.slug === o.onderwerp) || { slug: o.onderwerp, term: o.onderwerp.replace(/-/g, ' '), cat: 'Wonen', bron: 'handmatig' }) : plan.lijst.find(x => !have.has(x.slug) && !plan.mislukt.some(m => m.slug === x.slug));
  if (!cand && (plan.plannen || 1) < 4) { const p = await maakPlan(d, plan.mislukt.map(m => m.slug)); plan.lijst = plan.lijst.concat(p.filter(x => !plan.lijst.some(y => y.slug === x.slug))); plan.plannen = (plan.plannen || 1) + 1; await kv.set(K.plan(d), plan, { ex: 20 * 86400 }); cand = plan.lijst.find(x => !have.has(x.slug) && !plan.mislukt.some(m => m.slug === x.slug)); }
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
  res.setHeader('cache-control', 'no-store');
  const url = new URL(req.url, 'http://x'); const op = url.searchParams.get('op') || 'status';
  const tok = url.searchParams.get('token') || req.headers['x-hjdk-token'] || '';
  const isToken = !!process.env.HJDK_TOKEN && tok === process.env.HJDK_TOKEN;
  const isCron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
  try {
    if (op === 'status') {
      const d = DAY(); const [plan, lg, sig, tk, calls, best] = await Promise.all([kv.get(K.plan(d)), kv.get(K.log), kv.get(K.sig), kv.get(K.tok(d)), kv.get(K.calls(d)), bestaande()]);
      const sleutel = process.env.ANTHROPIC_API_KEY ? 'env' : ((await secrets()).ANTHROPIC_API_KEY ? 'setup' : 'ontbreekt');
      const gemaakt = best.filter(b => b.gemaakt === 'kzmaak').sort((a, b) => String(b.publishAt).localeCompare(String(a.publishAt))).map(b => ({ slug: b.slug, dag: b.publishAt, url: DOMAIN + '/' + b.slug }));
      return res.status(200).json({ ok: true, nu: new Date().toISOString(), instellingen: { perDag: PER_DAG(), modellen: MODELS, claudeSleutel: sleutel, maxClaudeAanroepenPerDag: MAX_CLAUDE() }, vandaag: plan ? { klaar: plan.klaar, mislukt: plan.mislukt, nogInPlan: plan.lijst.filter(x => !plan.klaar.some(k => k.slug === x.slug) && !plan.mislukt.some(m => m.slug === x.slug)).map(x => x.slug + ' — ' + (x.waarom || '')) } : null, claudeVandaag: { aanroepen: Number(calls) || 0, tokens: Number(tk) || 0 }, totaalKeuzehulpen: best.length, doorDezeRondeGemaakt: gemaakt.length, gemaakt: gemaakt.slice(0, 60), startlijstNogTeGaan: STARTLIJST.filter(x => !best.some(b => b.slug === x.slug)).map(x => x.slug + (x.vanaf ? ' (vanaf ' + x.vanaf + ')' : '')), signalen: sig ? { dag: sig.dag, metingen: sig.metingen, stijgers: (sig.stijgers || []).slice(0, 15).map(s => s.vb || s.k), nieuw: (sig.nieuw || []).slice(0, 10).map(s => s.vb || s.k), zonderResultaat: (sig.zonderResultaat || []).slice(0, 10), verzoeken: (sig.verzoeken || []).slice(0, 10), momenten: sig.momenten } : null, verdiensten30Dagen: await kv.get(K.verd).then(v => v ? (v.ok ? { periode: v.periode, totaal: v.totaal, categorieen: (v.categorieen || []).slice(0, 10), besteKeuzehulpen: (v.besteKeuzehulpen || []).slice(0, 10), veelKliksGeenOrders: v.veelKliksGeenOrders, verkochteProducten: (v.verkochteProducten || []).slice(0, 15) } : { fout: v.fout }) : null).catch(() => null), laatsteRondes: (lg || []).slice(0, 30), lessen: ((await kv.get(K.lessen)) || []).slice(0, 15) });
    }
    if (op === 'signalen') { if (!isCron && !isToken) return res.status(401).json({ error: 'alleen cron of token' }); const s = await signalen(); return res.status(200).json({ ok: true, dag: s.dag, metingen: s.metingen, stijgers: s.stijgers.slice(0, 10), nieuw: s.nieuw.slice(0, 10), ms: s.ms }); }
    if (op === 'dag' || op === 'nu') {
      if (op === 'dag' && !isCron && !isToken) return res.status(401).json({ error: 'alleen cron of token' });
      if (op === 'nu' && !isToken) return res.status(401).json({ error: 'token' });
      const lock = await kv.raw(['SET', K.lock, String(Date.now()), 'NX', 'EX', '290']).catch(() => 'OK');
      if (lock !== 'OK') return res.status(200).json({ ok: true, gedaan: 'niets', reden: 'er draait al een ronde' });
      try {
        if (!(await kv.get(K.sig).then(s => s && s.dag === DAY()).catch(() => false))) { try { await signalen(); } catch (e) { await log({ stap: 'signalen', ok: false, waarom: String(e.message || e).slice(0, 160) }); } }
        const o = { extra: url.searchParams.get('extra') === '1', dry: url.searchParams.get('dry') === '1', onderwerp: String(url.searchParams.get('onderwerp') || '').replace(/[^a-z0-9-]/g, '') || null };
        let r = await stap(o); if (op === 'nu' && r.gedaan === 'plan') r = Object.assign({ plan: r.plan.map(x => x.slug) }, await stap(o)); // handmatig: plan én eerste keuzehulp in één klik
        return res.status(200).json(Object.assign({ ok: true }, r));
      } finally { try { await kv.del([K.lock]); } catch (e) {} }
    }
    return res.status(404).json({ error: 'onbekende op' });
  } catch (e) { await log({ stap: op, ok: false, waarom: String(e && e.message || e).slice(0, 200) }); return res.status(200).json({ ok: false, error: String(e && e.message || e).slice(0, 300) }); }
}
