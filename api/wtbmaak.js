// WTBMAAK — elke dag nieuwe keuzehulpen voor whichtobuy.best (VS) en kaufberater.best (DE), volledig in de cloud.
// Kern: we zoeken bewust de BLINDE VLEKKEN van AI-assistenten. Per kandidaat-onderwerp stellen we de koopvraag 'koud' aan een taalmodel
// (zonder internet) en kijken we (1) hoe zeker het is en uit welk jaar zijn kennis komt en (2) of de modellen die het noemt nu nog bij Amazon te koop zijn.
// Hoe ouder/onzekerder het antwoord en hoe meer genoemde modellen niet meer te vinden zijn, hoe groter de blinde vlek -> voorrang.
// Daar schrijven we de gids voor die het wel goed heeft (met een blok "wat AI-antwoorden hier vaak missen"), zodat zoekmachines én AI-zoekers ons citeren.
//   /api/wtbmaak/dag   cron */10 3-16 UTC : per markt plan maken (Claude + Google Trends + wat leert) of één gids maken -> toetsen bij Amazon -> publiceren -> IndexNow
//   /api/wtbmaak/nu?token=HJDK_TOKEN&m=us|de : één stap nu (&extra=1 boven het dagdoel)
import { kv } from '../lib/db.js';
import { MARKETS, K, DAY, log, items, amzSearch, amzReady, claude, json, indexnow } from '../lib/wtb.js';

let OIDC = '';
async function trendsRss(geo) {
  try { const r = await fetch('https://trends.google.com/trending/rss?geo=' + geo, { headers: { 'user-agent': 'Mozilla/5.0 (trendcheck)' } }); const xml = await r.text(); const out = []; const re = /<item>([\s\S]*?)<\/item>/g; let mm;
    while ((mm = re.exec(xml)) && out.length < 25) { const t = (mm[1].match(/<title>(?:<!\[CDATA\[)?([^<\]]+)/) || [])[1]; if (t) out.push(t.trim()); } return out; } catch (e) { return []; }
}
async function leer(m, all) { // wat werkt: bezoeken, starts en Amazon-kliks per gids + bronnen (Google, Bing, ChatGPT ...) + AI-crawlers
  const keys = []; all.forEach(i => ['view', 'start', 'clk'].forEach(x => keys.push('c:wtb-' + m.id + '-' + i.slug + '-' + x)));
  const vals = []; for (let i = 0; i < keys.length; i += 300) vals.push(...await kv.mget(...keys.slice(i, i + 300)));
  const per = all.map((it, i) => ({ slug: it.slug, cat: it.cat, blind: it.blind ? it.blind.score : null, view: Number(vals[i * 3]) || 0, start: Number(vals[i * 3 + 1]) || 0, clk: Number(vals[i * 3 + 2]) || 0 }));
  const src = {}; for (const s of ['google', 'bing', 'chatgpt', 'perplexity', 'copilot', 'gemini', 'duckduckgo', 'pinterest', 'reddit', 'direct', 'other']) src[s] = Number(await kv.get('c:wtb-' + m.id + '-src-' + s).catch(() => 0)) || 0;
  const bots = {}; for (const b of ['googlebot', 'bingbot', 'oai-searchbot', 'chatgpt-user', 'gptbot', 'claude', 'perplexity', 'applebot']) bots[b] = Number(await kv.get('c:wtb-' + m.id + '-bot-' + b).catch(() => 0)) || 0;
  const cats = {}; per.forEach(p => { const c = cats[p.cat] = cats[p.cat] || { gidsen: 0, view: 0, clk: 0 }; c.gidsen++; c.view += p.view; c.clk += p.clk; });
  const out = { at: Date.now(), top: per.filter(p => p.view).sort((a, b) => b.clk - a.clk || b.view - a.view).slice(0, 12), cats, src, bots };
  try { await kv.set(K.learn(m.id), out); } catch (e) {}
  return out;
}

// ---- blinde-vlektest: wat zegt een taalmodel zonder internet, en klopt dat nog met wat Amazon nu verkoopt? ----
async function blindTest(m, t) {
  const vraag = m.id === 'us' ? `I want to buy: ${t.title || t.term}. Which 3 specific models (brand + model name) would you recommend right now, and why in one line each?` : `Ich möchte kaufen: ${t.title || t.term}. Welche 3 konkreten Modelle (Marke + Modellname) würdest du jetzt empfehlen, je ein Satz warum?`;
  const r = await claude('You are a typical AI shopping assistant WITHOUT internet access. Answer from memory only. Then rate yourself honestly. Reply ONLY JSON: {"models":["brand model",...],"confidence":0-1 (how sure you are this advice is current for buyers today),"knowledgeYear":YYYY (newest year your knowledge of this product category reflects),"gaps":"one sentence: what you are unsure about or may be outdated"}', vraag, { fast: true, max: 600, oidc: OIDC });
  const j = json(r.txt); const models = (j.models || []).map(String).slice(0, 3);
  let avail = null; const gevonden = [];
  if (amzReady() && models.length) { let ok = 0, n = 0; for (const mod of models) { try { const s = await amzSearch(m, mod); n++; const toks = mod.toLowerCase().split(/\s+/).filter(w => w.length > 2); const hit = s && s.products.some(p => toks.filter(w => p.title.toLowerCase().includes(w)).length >= Math.max(2, Math.ceil(toks.length * 0.7))); if (hit) ok++; gevonden.push({ model: mod, nogTeKoop: !!hit }); } catch (e) { break; } } if (n) avail = ok / n; }
  const conf = Math.max(0, Math.min(1, Number(j.confidence) || 0.5)); const jaar = Number(j.knowledgeYear) || 2024; const oud = Math.max(0, Math.min(1, (2026 - jaar) / 3));
  const score = Math.round((avail == null ? (0.6 * (1 - conf) + 0.4 * oud) : (0.5 * (1 - avail) + 0.3 * (1 - conf) + 0.2 * oud)) * 100) / 100;
  return { models, conf, jaar, gaps: String(j.gaps || '').slice(0, 240), avail, gevonden, score };
}

async function maakPlan(m) {
  const all = await items(m); const plan0 = await kv.get(K.plan(m.id, DAY())); if (plan0) return plan0;
  const [trends, les] = await Promise.all([trendsRss(m.geo), leer(m, all)]);
  const n = m.perDay(); const cand = Math.min(30, Math.round(n * 1.8));
  const sys = `You plan buying guides for ${m.name} (${m.host}), market ${m.geo}, language ${m.lang}, monetized via Amazon (${m.amazon}). Goal: organic traffic from Google, Bing and AI assistants (ChatGPT search, Perplexity, Copilot, Gemini) that converts to Amazon purchases. Pick topics where AI assistants are BLIND: product categories that change fast (new models every year, new standards like Wi-Fi 7, Qi2, USB-C PD 3.1, Matter, OLED/mini-LED, heat pumps), new-in-2025/2026 product types, seasonal moments in the next 8 weeks (Halloween, Black Friday/Cyber Monday, holidays${m.id === 'de' ? ', Nikolaus, Weihnachten' : ', Thanksgiving, Christmas'}), and specific long-tail needs (e.g. 'for small apartments', 'for pet hair', 'under ${m.id === 'us' ? '$100' : '100 €'}'). Prefer higher order values (>${m.id === 'us' ? '$40' : '40 €'}) and categories Amazon sells well. Never duplicate an existing topic. Reply ONLY JSON.`;
  const user = `Today: ${DAY()}. Existing guides (do not repeat): ${all.map(i => i.slug).join(', ') || 'none yet'}.
Google Trends today (${m.geo}): ${trends.join(' | ') || 'n/a'}.
What performs so far (views/starts/Amazon clicks per guide; traffic sources; AI crawler visits): ${JSON.stringify({ top: les.top, cats: les.cats, src: les.src, bots: les.bots })}.
Give ${cand} candidate topics: {"topics":[{"slug":"lowercase-ascii-hyphen in ${m.lang}","term":"Amazon search keywords in ${m.lang}","title":"the buyer question in ${m.lang}, e.g. ${m.id === 'us' ? 'Which robot vacuum for pet hair?' : 'Welcher Saugroboter für Tierhaare?'}","cat":"category in ${m.lang}","demand":1-5,"why":"short: why buyers search this now and why AI answers are likely outdated or vague"}]}`;
  const r = await claude(sys, user, { max: 5000, oidc: OIDC }); const j = json(r.txt);
  const have = new Set(all.map(i => i.slug)); const seen = new Set();
  let topics = (j.topics || []).map(t => Object.assign({}, t, { slug: String(t.slug || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) })).filter(t => t.slug && t.term && !have.has(t.slug) && !seen.has(t.slug) && seen.add(t.slug));
  // blinde-vlektest per kandidaat (snel model), dan rangschikken op vraag x blinde vlek
  for (let i = 0; i < topics.length; i += 5) await Promise.all(topics.slice(i, i + 5).map(async t => { try { t.blind = await blindTest(m, t); } catch (e) { t.blind = { score: 0.3, fout: String(e.message).slice(0, 80) }; } }));
  topics = topics.sort((a, b) => (Number(b.demand) || 3) * (0.5 + b.blind.score) - (Number(a.demand) || 3) * (0.5 + a.blind.score)).slice(0, n).map(t => Object.assign(t, { status: 'todo' }));
  const plan = { dag: DAY(), at: Date.now(), topics, trends: trends.slice(0, 10) };
  await kv.set(K.plan(m.id, DAY()), plan, { ex: 4 * 86400 });
  try { const b = (await kv.get(K.blind(m.id))) || []; await kv.set(K.blind(m.id), [...topics.map(t => ({ dag: DAY(), slug: t.slug, score: t.blind.score, conf: t.blind.conf, jaar: t.blind.jaar, avail: t.blind.avail, gaps: t.blind.gaps })), ...b].slice(0, 400)); } catch (e) {}
  await log({ m: m.id, wat: 'plan', n: topics.length, blind: topics.map(t => t.slug + ':' + t.blind.score).join(', ') });
  return plan;
}

async function schrijf(m, t) {
  const b = t.blind || {};
  const sys = `You write one buying guide for ${m.name} (${m.host}) in ${m.lang === 'en' ? 'American English' : 'German (du-form, natural, not stiff)'}, for buyers in ${m.geo} shopping on ${m.amazon}. Style: direct, concrete, honest, no fluff, no hype, no fake urgency. Never claim hands-on tests or reviews we did not do; never invent prices, ratings or review counts. Name specs, standards and features that matter in 2026. Structure must let a buyer decide in 3 questions. Each answer option has "kw": extra Amazon search keywords (${m.lang}) that, appended to "term", find matching products; optional "min"/"max" price bounds in ${m.cur} when the option is a budget. Reply ONLY JSON.`;
  const user = `Topic: ${t.title} (term: ${t.term}, category: ${t.cat}). Why now: ${t.why || ''}.
Blind-spot test: a typical AI assistant without internet recommended ${JSON.stringify(b.models || [])}, confidence ${b.conf}, knowledge reflects ${b.jaar}; its own doubt: "${b.gaps || ''}". ${b.gevonden && b.gevonden.length ? 'Amazon check today: ' + b.gevonden.map(g => g.model + (g.nogTeKoop ? ' = still listed' : ' = not found as a new listing')).join('; ') + '.' : ''}
Write {"slug":"${t.slug}","term":"${t.term}","cat":"${t.cat}","title":"short buyer question","h1":"","seoTitle":"<=60 chars, include 2026","metaDesc":"<=155 chars","intro":"2 sentences","kort":"the direct answer in 2-3 sentences: which type/spec to pick for most people and when to choose differently","questions":[{"q":"","options":[{"label":"","kw":"","min":null,"max":null}]}] (exactly 3 questions x 3 options, last question = budget with min/max),"guide":"4-6 short paragraphs separated by \\n","mistakes":["3-5 items"],"aiMiss":["2-4 concrete points where generic AI answers go wrong for this topic today (outdated models/standards, missing new options, wrong assumptions). Do not name a specific product as discontinued unless the Amazon check says not found; then say 'hard to find new today'."],"faq":[{"q":"","a":""}] (5 items, real search questions)}`;
  const r = await claude(sys, user, { max: 6000, oidc: OIDC }); const it = json(r.txt);
  it.slug = t.slug; it.term = it.term || t.term; it.cat = it.cat || t.cat; it.blind = b; it.why = t.why;
  if (!Array.isArray(it.questions) || it.questions.length < 2 || !it.kort || !it.guide) throw new Error('onvolledige gids');
  it.questions = it.questions.slice(0, 3).map(q => ({ q: String(q.q || ''), options: (q.options || []).slice(0, 4).map(o => ({ label: String(o.label || ''), kw: String(o.kw || ''), min: o.min != null && o.min !== '' ? Number(o.min) : null, max: o.max != null && o.max !== '' ? Number(o.max) : null })).filter(o => o.label) })).filter(q => q.q && q.options.length >= 2);
  return it;
}
async function toets(m, it) { // elk antwoord moet bij Amazon iets passends vinden (als de API er is)
  if (!amzReady()) return { ok: true, zonderApi: true };
  let leeg = 0, fouten = 0;
  for (const q of it.questions) for (const o of q.options) {
    try { const r = await amzSearch(m, [it.term, o.kw].filter(Boolean).join(' ')); const ok = r && r.products.filter(p => p.price == null || ((o.min == null || p.price >= o.min) && (o.max == null || p.price <= o.max))); if (!ok || !ok.length) { if (o.min != null || o.max != null) { o.min = null; o.max = null; } const r2 = await amzSearch(m, it.term); if (!r2 || !r2.products.length) leeg++; } } catch (e) { fouten++; if (fouten > 3) return { ok: true, apiFout: String(e.message).slice(0, 100) }; }
  }
  return { ok: leeg === 0, leeg };
}

async function stap(m, extra) {
  if (!(await kv.get(K.plan(m.id, DAY())))) { const p = await maakPlan(m); return { m: m.id, plan: p.topics.map(t => t.slug + ' (' + (t.blind && t.blind.score) + ')') }; }
  const plan = await maakPlan(m); const todo = plan.topics.find(t => t.status === 'todo');
  const live = plan.topics.filter(t => t.status === 'live').length;
  if (!todo) return { m: m.id, klaar: true, live };
  if (!extra && live >= m.perDay()) return { m: m.id, dagdoel: true, live };
  todo.status = 'bezig'; await kv.set(K.plan(m.id, DAY()), plan, { ex: 4 * 86400 });
  try {
    const it = await schrijf(m, todo); const tt = await toets(m, it);
    if (!tt.ok) throw new Error('geen passende Amazon-producten voor ' + tt.leeg + ' antwoorden');
    it.publishAt = DAY(); it.updatedAt = DAY(); it.gemaakt = new Date().toISOString();
    await kv.set(K.item(m.id, it.slug), it);
    const idx = (await kv.get(K.index(m.id))) || []; if (!idx.includes(it.slug)) { idx.push(it.slug); await kv.set(K.index(m.id), idx); }
    const st = await indexnow(m, ['https://' + m.host + '/' + it.slug, 'https://' + m.host + '/', 'https://' + m.host + '/sitemap.xml', 'https://' + m.host + '/llms.txt']);
    todo.status = 'live'; await kv.set(K.plan(m.id, DAY()), plan, { ex: 4 * 86400 });
    await log({ m: m.id, wat: 'live', slug: it.slug, blind: todo.blind && todo.blind.score, indexnow: st, toets: tt });
    return { m: m.id, live: it.slug, blind: todo.blind && todo.blind.score };
  } catch (e) { todo.status = 'fout'; todo.fout = String(e.message).slice(0, 200); await kv.set(K.plan(m.id, DAY()), plan, { ex: 4 * 86400 }); await log({ m: m.id, wat: 'fout', slug: todo.slug, fout: todo.fout }); return { m: m.id, fout: todo.fout }; }
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x'); const op = url.searchParams.get('op') || 'dag';
  OIDC = String(req.headers['x-vercel-oidc-token'] || ''); res.setHeader('cache-control', 'no-store');
  const isCron = /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
  const tok = url.searchParams.get('token'); const mag = isCron || (process.env.HJDK_TOKEN && tok === process.env.HJDK_TOKEN);
  if (!mag) return res.status(401).json({ ok: false, fout: 'token' });
  const which = url.searchParams.get('m'); const markets = which && MARKETS[which] ? [MARKETS[which]] : Object.values(MARKETS);
  if (process.env.WTB_UIT === '1') return res.status(200).json({ ok: true, uit: true });
  const out = [];
  for (const m of markets) {
    const lk = await kv.get(K.lock(m.id)); if (lk && Date.now() - lk < 280000) { out.push({ m: m.id, overgeslagen: 'loopt al' }); continue; }
    await kv.set(K.lock(m.id), Date.now(), { ex: 300 });
    try { out.push(op === 'plan' ? { m: m.id, plan: (await maakPlan(m)).topics.map(t => ({ slug: t.slug, status: t.status, blind: t.blind && t.blind.score })) } : await stap(m, !!url.searchParams.get('extra'))); }
    catch (e) { out.push({ m: m.id, fout: String(e.message).slice(0, 200) }); await log({ m: m.id, wat: 'fout', fout: String(e.message).slice(0, 200) }); }
    finally { try { await kv.set(K.lock(m.id), 0, { ex: 5 }); } catch (e) {} }
  }
  return res.status(200).json({ ok: true, amazonApi: amzReady(), out });
}
