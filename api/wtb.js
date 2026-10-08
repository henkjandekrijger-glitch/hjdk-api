// WTB-pagina's: whichtobuy.best (VS) en kaufberater.best (DE). Zelfde idee als keuzehulp.best: 3 vragen, 1 eerlijke keuze, prijs van vandaag (Amazon).
// Routes (vercel.json, op host): / , /<slug>, /sitemap.xml, /robots.txt, /llms.txt, /llms-full.txt, /<indexnow-sleutel>.txt, /about, /privacy
// API: /api/wtb?op=advice&slug=..&a=0-1-2 (producten voor de antwoorden), /api/wtb?op=status (openbaar overzicht)
import { kv } from '../lib/db.js';
import { MARKETS, marketFor, K, DAY, esc, items, amzSearch, amzReady, searchLink, INDEXNOW_KEY } from '../lib/wtb.js';

const BOTS = [['googlebot', /Googlebot|Google-InspectionTool|GoogleOther/i], ['bingbot', /bingbot/i], ['oai-searchbot', /OAI-SearchBot/i], ['chatgpt-user', /ChatGPT-User/i], ['gptbot', /GPTBot/i], ['claude', /Claude-User|Claude-SearchBot|ClaudeBot|anthropic-ai/i], ['perplexity', /Perplexity/i], ['applebot', /Applebot/i], ['meta', /meta-external|facebookexternalhit/i], ['amazonbot', /Amazonbot/i], ['duckduck', /DuckDuck/i]];
const botOf = ua => { for (const [n, re] of BOTS) if (re.test(ua)) return n; return /bot|crawl|spider|slurp|preview/i.test(ua) ? 'other' : ''; };
function source(req, q) { const u = String(q.get('utm_source') || '').toLowerCase(); if (u) return u.replace(/[^a-z0-9]/g, '').slice(0, 16); const r = String(req.headers.referer || ''); if (!r) return 'direct'; let h = ''; try { h = new URL(r).hostname.replace(/^www\./, ''); } catch (e) { return 'other'; } if (/whichtobuy|kaufberater/.test(h)) return 'intern'; if (/gemini\.google/.test(h)) return 'gemini'; if (/(^|\.)google\./.test(h)) return 'google'; if (/bing\.com/.test(h)) return 'bing'; if (/chatgpt|openai/.test(h)) return 'chatgpt'; if (/perplexity/.test(h)) return 'perplexity'; if (/copilot/.test(h)) return 'copilot'; if (/duckduckgo/.test(h)) return 'duckduckgo'; if (/pinterest/.test(h)) return 'pinterest'; if (/reddit/.test(h)) return 'reddit'; return 'other'; }
async function count(m, req, q, slug) {
  const hits = []; const b = botOf(String(req.headers['user-agent'] || ''));
  if (b) hits.push(['c:wtb-' + m.id + '-bot-' + b, 1], ['c:wtb-' + m.id + '-botd-' + DAY() + '-' + b, 1]);
  else { const s = source(req, q); if (s !== 'intern') hits.push(['c:wtb-' + m.id + '-src-' + s, 1], ['c:wtb-' + m.id + '-d-' + DAY() + '-' + s, 1]); if (slug) hits.push(['c:wtb-' + m.id + '-' + slug + '-view', 1]); }
  try { if (hits.length) await kv.incrMany(hits); } catch (e) {}
}

// producten voor een route: term + zoekwoorden van de gekozen antwoorden, binnen de prijsgrenzen
async function advice(m, it, a) {
  const opts = (it.questions || []).map((q, i) => (q.options || [])[a[i] || 0] || {});
  const kws = [it.term, ...opts.map(o => o.kw).filter(Boolean)].join(' ').replace(/\s+/g, ' ').trim();
  let min = 0, max = 1e9; opts.forEach(o => { if (o.min != null) min = Math.max(min, Number(o.min)); if (o.max != null) max = Math.min(max, Number(o.max)); });
  const out = { kws, link: searchLink(m, kws), products: [], at: null, api: amzReady() };
  if (!amzReady()) return out;
  const tries = [kws, [it.term, opts[0] && opts[0].kw].filter(Boolean).join(' '), it.term];
  for (const k of [...new Set(tries)]) {
    try { const r = await amzSearch(m, k); if (!r) break; const ok = r.products.filter(p => p.image && (p.price == null || (p.price >= min && p.price <= max))); if (ok.length) { out.products = ok.slice(0, 3); out.at = r.at; if (k !== kws) out.relaxed = true; break; } } catch (e) { out.err = String(e.message).slice(0, 120); break; }
  }
  return out;
}

const CSS = `*{box-sizing:border-box}body{margin:0;font:17px/1.6 -apple-system,system-ui,"Segoe UI",Roboto,sans-serif;background:#fbfaf6;color:#1b1f2a}a{color:#1d4ed8}
header{background:#fff;border-bottom:1px solid #e8e5dc}header .in{max-width:880px;margin:0 auto;padding:14px 18px;display:flex;justify-content:space-between;align-items:center}.logo{font-weight:900;font-size:20px;color:#1b1f2a;text-decoration:none;letter-spacing:-.02em}.logo b{color:#c2410c}nav a{color:#4b5563;text-decoration:none;font-size:14px;margin-left:14px}
main{max-width:880px;margin:0 auto;padding:22px 18px 60px}h1{font-size:32px;line-height:1.15;letter-spacing:-.02em;margin:10px 0 8px}.lead{font-size:18px;color:#3f4652;margin:0 0 14px}.meta{font-size:13px;color:#6b7280}
.answer{background:#fff7ed;border-left:4px solid #c2410c;border-radius:12px;padding:14px 16px;margin:14px 0;font-size:17px}
.q{background:#fff;border:1px solid #e8e5dc;border-radius:16px;padding:18px;margin:12px 0}.q h2{font-size:18px;margin:0 0 10px}.opts{display:flex;flex-wrap:wrap;gap:8px}.opt{border:1.5px solid #d6d3cb;background:#fff;border-radius:999px;padding:10px 15px;font:600 15px system-ui;cursor:pointer;color:#1b1f2a}.opt.on{background:#1b1f2a;border-color:#1b1f2a;color:#fff}
.pr{display:grid;grid-template-columns:110px 1fr;gap:14px;background:#fff;border:1px solid #e8e5dc;border-radius:16px;padding:14px;margin:0 0 10px;align-items:center}.pr.best{border:2px solid #c2410c;box-shadow:0 8px 28px rgba(194,65,12,.12)}.pr img{width:110px;height:110px;object-fit:contain}.role{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#c2410c;font-weight:800}.t{font-weight:700;line-height:1.3;margin:2px 0 6px}.price{font-size:18px;font-weight:800}
.btn{display:inline-block;background:#c2410c;color:#fff;text-decoration:none;font-weight:800;padding:11px 16px;border-radius:12px;font-size:15px;margin-top:6px}.btn.sec{background:#1b1f2a}
.box{background:#fff;border:1px solid #e8e5dc;border-radius:16px;padding:18px;margin:14px 0}.box h2{font-size:19px;margin:0 0 8px}.box ul{margin:0;padding-left:20px}.box li{margin:6px 0}.ai{border-left:4px solid #1d4ed8}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}.card{display:block;background:#fff;border:1px solid #e8e5dc;border-radius:14px;padding:14px;text-decoration:none;color:#1b1f2a}.card:hover{border-color:#c2410c}.card .c{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280}.card h3{font-size:16px;margin:4px 0 0;line-height:1.3}
.disc{font-size:12.5px;color:#6b7280;margin:10px 0 0}footer{max-width:880px;margin:0 auto;padding:22px 18px;color:#6b7280;font-size:13px;border-top:1px solid #e8e5dc}
@media(max-width:600px){h1{font-size:26px}.pr{grid-template-columns:80px 1fr}.pr img{width:80px;height:80px}}`;
function shell(m, o) {
  const base = 'https://' + m.host;
  return `<!doctype html><html lang="${m.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}"><link rel="canonical" href="${base}${o.path}"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"><link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:type" content="${o.og || 'website'}"><meta property="og:url" content="${base}${o.path}">${o.image ? `<meta property="og:image" content="${esc(o.image)}">` : ''}${o.ld ? `<script type="application/ld+json">${JSON.stringify(o.ld).replace(/</g, '\\u003c')}</script>` : ''}<style>${CSS}</style></head><body>
<header><div class="in"><a class="logo" href="/">${m.id === 'us' ? 'Which<b>To</b>Buy' : 'Kauf<b>berater</b>'}</a><nav><a href="/">${m.s.all}</a><a href="/about">${m.s.about}</a></nav></div></header><main>${o.body}</main>
<footer>${esc(m.s.disc)} · <a href="/about">${m.s.about}</a> · <a href="/privacy">Privacy</a><br>${m.id === 'de' ? 'Impressum: AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, Niederlande · KvK 60126035' : 'AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, Netherlands'} · ${m.name} by Henkjan de Krijger</footer>
<script>window.__h=function(k){try{navigator.sendBeacon('/api/hjdk/stats/hits',new Blob([JSON.stringify({hits:[[k,1]]})],{type:'text/plain'}))}catch(e){}};</script></body></html>`;
}
function card(m, p, i) {
  const role = i === 0 ? m.s.pick : m.s.alt;
  return `<div class="pr${i === 0 ? ' best' : ''}"><a href="${esc(p.url)}" rel="sponsored nofollow noopener" target="_blank" data-amz="${esc(p.asin)}"><img src="${esc(p.image)}" alt="${esc(p.title.slice(0, 80))}" loading="lazy"></a><div><div class="role">${esc(role)}</div><div class="t">${esc(p.title.slice(0, 110))}</div>${p.price != null ? `<div class="price">${esc(p.priceText || m.money(p.price))}</div>` : ''}<a class="btn" href="${esc(p.url)}" rel="sponsored nofollow noopener" target="_blank" data-amz="${esc(p.asin)}">${esc(p.price != null ? m.s.see : m.s.noPrice)} →</a></div></div>`;
}
function adviceHtml(m, adv) {
  if (adv.products.length) return adv.products.map((p, i) => card(m, p, i)).join('') + `<p class="disc">${esc(m.s.priceNote)} ${esc(new Date(adv.at || Date.now()).toLocaleString(m.locale, { timeZone: m.id === 'us' ? 'America/New_York' : 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' }))}; ${esc(m.s.priceNote2)}</p>`;
  return `<div class="pr best" style="grid-template-columns:1fr"><div><div class="role">${esc(m.s.fallback)}</div><div class="t">${esc(adv.kws)}</div><a class="btn" href="${esc(adv.link)}" rel="sponsored nofollow noopener" target="_blank" data-amz="search">${esc(m.s.seeAll)} →</a></div></div>`;
}

async function page(m, it, all, req) {
  const s = m.s; const base = 'https://' + m.host; const a0 = (it.questions || []).map(() => 0);
  const adv = await advice(m, it, a0);
  const rel = all.filter(x => x.slug !== it.slug).sort((x, y) => (y.cat === it.cat) - (x.cat === it.cat)).slice(0, 8);
  const qs = (it.questions || []).map((q, qi) => `<div class="q" data-q="${qi}"><h2>${qi + 1}. ${esc(q.q)}</h2><div class="opts">${(q.options || []).map((o, oi) => `<button class="opt" type="button" data-o="${oi}">${esc(o.label)}</button>`).join('')}</div></div>`).join('');
  const upd = it.updatedAt || it.publishAt || DAY();
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: it.h1, description: it.metaDesc, inLanguage: m.locale, datePublished: it.publishAt || upd, dateModified: upd, author: { '@type': 'Person', name: 'Henkjan de Krijger', url: 'https://www.linkedin.com/in/henkjandekrijger' }, publisher: { '@type': 'Organization', name: m.name, url: base }, mainEntityOfPage: base + '/' + it.slug, about: { '@type': 'Thing', name: it.term } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: m.name, item: base + '/' }, { '@type': 'ListItem', position: 2, name: it.title, item: base + '/' + it.slug }] },
    ...((it.faq || []).length ? [{ '@type': 'FAQPage', mainEntity: it.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
    ...(adv.products.length ? [{ '@type': 'ItemList', name: it.title, itemListElement: adv.products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title.slice(0, 110), url: p.url })) }] : []) ] };
  const body = `<p class="meta">${esc(it.cat)} · ${esc(s.updated)} <time datetime="${esc(upd)}">${esc(upd)}</time> · ${esc(s.by)} Henkjan de Krijger</p><h1>${esc(it.h1)}</h1><p class="lead">${esc(it.intro)}</p>
<div class="answer">${esc(it.kort)}</div>
<h2 style="font-size:20px;margin:22px 0 4px">${esc(s.q)}</h2>${qs}
<div id="adv" style="margin:14px 0">${adviceHtml(m, adv)}</div>
${(it.aiMiss || []).length ? `<div class="box ai"><h2>${esc(s.aimiss)}</h2><ul>${it.aiMiss.map(x => '<li>' + esc(x) + '</li>').join('')}</ul></div>` : ''}
<div class="box"><h2>${esc(s.guide)}</h2>${String(it.guide || '').split(/\n+/).filter(Boolean).map(p => '<p>' + esc(p) + '</p>').join('')}</div>
${(it.mistakes || []).length ? `<div class="box"><h2>${esc(s.mistakes)}</h2><ul>${it.mistakes.map(x => '<li>' + esc(x) + '</li>').join('')}</ul></div>` : ''}
${(it.faq || []).length ? `<div class="box"><h2>${esc(s.faq)}</h2>${it.faq.map(f => `<h3 style="font-size:16px;margin:12px 0 4px">${esc(f.q)}</h3><p style="margin:0">${esc(f.a)}</p>`).join('')}</div>` : ''}
${rel.length ? `<div class="box"><h2>${esc(s.related)}</h2><div class="grid">${rel.map(r => `<a class="card" href="/${esc(r.slug)}"><div class="c">${esc(r.cat)}</div><h3>${esc(r.title)}</h3></a>`).join('')}</div></div>` : ''}
<p class="disc">${esc(s.disc)}</p>
<script>(function(){var S=${JSON.stringify(it.slug)},M=${JSON.stringify(m.id)},n=document.querySelectorAll('.q').length,cur=[],t=null,st=0;for(var i=0;i<n;i++)cur.push(0);var h=window.__h||function(){};
function load(){fetch('/api/wtb?op=advice&m='+M+'&slug='+encodeURIComponent(S)+'&a='+cur.join('-')+'&html=1').then(function(r){return r.json()}).then(function(j){if(j&&j.html)document.getElementById('adv').innerHTML=j.html;h('wtb-'+M+'-'+S+'-adv')}).catch(function(){})}
document.querySelectorAll('.q').forEach(function(q){var qi=+q.getAttribute('data-q');q.querySelectorAll('.opt').forEach(function(b){b.addEventListener('click',function(){q.querySelectorAll('.opt').forEach(function(x){x.classList.remove('on')});b.classList.add('on');cur[qi]=+b.getAttribute('data-o');if(!st){st=1;h('wtb-'+M+'-'+S+'-start');h('wtb-'+M+'-start')}clearTimeout(t);t=setTimeout(load,200);if(qi===n-1)document.getElementById('adv').scrollIntoView({behavior:'smooth',block:'start'})})})});
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-amz]');if(a){h('wtb-'+M+'-'+S+'-clk');h('wtb-'+M+'-clk');h('wtb-'+M+'-clkd-'+new Date().toISOString().slice(0,10))}},true);})();</script>`;
  return shell(m, { title: it.seoTitle || it.h1, desc: it.metaDesc || it.intro, path: '/' + it.slug, og: 'article', image: adv.products[0] && adv.products[0].image, ld, body });
}
function home(m, all) {
  const s = m.s; const cats = {}; all.forEach(i => { (cats[i.cat] = cats[i.cat] || []).push(i); });
  const newest = all.slice().sort((a, b) => String(b.publishAt || '').localeCompare(String(a.publishAt || ''))).slice(0, 12);
  const body = `<h1>${esc(s.hero)}</h1><p class="lead">${esc(s.heroP)}</p>${newest.length ? `<div class="grid">${newest.map(r => `<a class="card" href="/${esc(r.slug)}"><div class="c">${esc(r.cat)}</div><h3>${esc(r.title)}</h3></a>`).join('')}</div>` : `<p class="meta">${esc(s.wait)}</p>`}
${Object.keys(cats).sort().map(c => `<div class="box"><h2>${esc(c)}</h2><ul>${cats[c].map(i => `<li><a href="/${esc(i.slug)}">${esc(i.title)}</a></li>`).join('')}</ul></div>`).join('')}<p class="disc">${esc(s.disc)}</p>`;
  const base = 'https://' + m.host;
  return shell(m, { title: m.name + (m.id === 'us' ? ' — Buying guides that ask 3 questions' : ' — Kaufberatung in 3 Fragen'), desc: s.heroP, path: '/', body, ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite', name: m.name, url: base, inLanguage: m.locale }, { '@type': 'Organization', name: m.name, url: base, founder: { '@type': 'Person', name: 'Henkjan de Krijger' } }] } });
}
function about(m) {
  const t = m.id === 'us' ? `<h1>About ${m.name}</h1><p>${m.name} helps you pick the right product in three questions. Each guide is written for the products on sale now, linked to live Amazon results, and updated when the market changes. Many AI chat answers still recommend models from two or three years ago; we flag that where it matters.</p><p>Made by Henkjan de Krijger (AdsFair B.V., Gouda, Netherlands), 25+ years building consumer internet products. Contact: henkjan@keuzehulp.best</p><p>${esc(m.s.disc)}</p>`
    : `<h1>Über ${m.name}</h1><p>${m.name} hilft dir, in drei Fragen das passende Produkt zu finden. Jeder Ratgeber ist für die Produkte geschrieben, die heute verkauft werden, ist mit aktuellen Amazon-Ergebnissen verlinkt und wird aktualisiert, wenn sich der Markt ändert. Viele KI-Antworten empfehlen noch Modelle von vor zwei, drei Jahren; darauf weisen wir hin, wo es wichtig ist.</p><p>Gemacht von Henkjan de Krijger (AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, Niederlande, KvK 60126035). Kontakt: henkjan@keuzehulp.best</p><p>${esc(m.s.disc)}</p>`;
  return shell(m, { title: m.s.about + ' — ' + m.name, desc: m.name, path: '/about', body: t });
}
function privacy(m) { return shell(m, { title: 'Privacy — ' + m.name, desc: 'Privacy', path: '/privacy', body: m.id === 'us' ? '<h1>Privacy</h1><p>We do not use advertising cookies or sell data. We count anonymous page views and clicks (no personal data). Links to Amazon are affiliate links; Amazon sets its own cookies when you visit Amazon.</p>' : '<h1>Datenschutz</h1><p>Wir verwenden keine Werbe-Cookies und verkaufen keine Daten. Wir zählen anonym Seitenaufrufe und Klicks (keine personenbezogenen Daten). Links zu Amazon sind Partnerlinks; Amazon setzt beim Besuch von Amazon eigene Cookies.</p>' }); }

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x'); const q = url.searchParams; const op = q.get('op') || 'page';
  if (op === 'status') { // openbaar overzicht, beide markten
    const out = { ok: true, amazonApi: amzReady(), markten: {} };
    for (const m of Object.values(MARKETS)) { const all = await items(m); const plan = await kv.get(K.plan(m.id, DAY())).catch(() => null); out.markten[m.id] = { site: 'https://' + m.host, tag: m.tag(), gidsen: all.length, vandaag: plan ? { gepland: (plan.topics || []).length, gemaakt: (plan.topics || []).filter(t => t.status === 'live').length, mislukt: (plan.topics || []).filter(t => t.status === 'fout').length } : null, nieuwste: all.slice(-5).map(i => ({ slug: i.slug, blindspot: i.blind && i.blind.score })) }; }
    out.log = ((await kv.get(K.log)) || []).slice(0, 30);
    res.setHeader('cache-control', 'no-store'); return res.status(200).json(out);
  }
  const m = marketFor(req); if (!m) return res.status(404).send('unknown site');
  const path = '/' + String(q.get('slug') || '');
  if (op === 'robots') { res.setHeader('content-type', 'text/plain'); return res.status(200).send(`# Buying guides may be read and cited by search engines and AI assistants. Summary: https://${m.host}/llms.txt\nUser-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: https://${m.host}/sitemap.xml\n`); }
  if (op === 'ixkey') { res.setHeader('content-type', 'text/plain'); return res.status(200).send(INDEXNOW_KEY); }
  const all = await items(m);
  if (op === 'sitemap') { res.setHeader('content-type', 'application/xml; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600'); return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${m.host}/</loc><lastmod>${DAY()}</lastmod></url><url><loc>https://${m.host}/about</loc></url>${all.map(i => `<url><loc>https://${m.host}/${i.slug}</loc><lastmod>${esc(i.updatedAt || i.publishAt || DAY())}</lastmod></url>`).join('')}</urlset>`); }
  if (op === 'llms' || op === 'llmsfull') {
    res.setHeader('content-type', 'text/plain; charset=utf-8'); const full = op === 'llmsfull';
    const head = m.id === 'us' ? `# ${m.name}\n\n> Buying guides for the US market, written for products on sale now (2026) and linked to live Amazon results. Each guide asks 3 questions and gives one pick. Guides list what AI answers often get wrong (outdated models, old standards).\n\n` : `# ${m.name}\n\n> Kaufberater für Deutschland, geschrieben für Produkte, die heute verkauft werden (2026), verlinkt mit aktuellen Amazon-Ergebnissen. Jeder Ratgeber stellt 3 Fragen und gibt eine Empfehlung. Ratgeber nennen, was KI-Antworten oft falsch machen (veraltete Modelle, alte Standards).\n\n`;
    return res.status(200).send(head + all.map(i => full ? `## ${i.title}\nURL: https://${m.host}/${i.slug}\nUpdated: ${i.updatedAt || i.publishAt}\n${i.kort}\n${(i.aiMiss || []).map(x => '- ' + x).join('\n')}\n${String(i.guide || '').slice(0, 1500)}\n` : `- [${i.title}](https://${m.host}/${i.slug}): ${i.kort}`).join('\n') + '\n');
  }
  if (op === 'advice') {
    const it = await kv.get(K.item(m.id, String(q.get('slug') || ''))); if (!it) return res.status(404).json({ ok: false });
    const a = String(q.get('a') || '').split('-').map(x => Math.max(0, Math.min(5, Number(x) || 0)));
    const adv = await advice(m, it, a); res.setHeader('cache-control', 'public, max-age=600');
    try { await kv.incrMany([['c:wtb-' + m.id + '-' + it.slug + '-r' + a.join('') + '-imp', 1]]); } catch (e) {}
    return res.status(200).json(Object.assign({ ok: true }, q.get('html') ? { html: adviceHtml(m, adv) } : adv));
  }
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=0, must-revalidate');
  if (op === 'about') return res.status(200).send(about(m));
  if (op === 'privacy') return res.status(200).send(privacy(m));
  if (op === 'home' || path === '/') { await count(m, req, q, ''); return res.status(200).send(home(m, all)); }
  const it = all.find(i => i.slug === path.slice(1));
  if (!it) { res.setHeader('cache-control', 'no-store'); return res.status(404).send(shell(m, { title: '404 — ' + m.name, desc: '', path: '/', body: `<h1>404</h1><p><a href="/">${esc(m.s.home)}</a></p>` })); }
  await count(m, req, q, it.slug);
  return res.status(200).send(await page(m, it, all, req));
}
