import { koopBlok, koopMeetScript } from '../lib/koopblok.js';
// Zelfstandige dienstkeuzehulpen binnen de bestaande drie sites.
// Geen aankoop of domeinregistratie: uitsluitend een openbare beschikbaarheidsopvraag.
import { createHash } from 'node:crypto';
import { kv } from '../lib/db.js';
import { look, ACCENTS } from '../lib/look.js';
import { DOMAIN_GUIDES, LAADPAAL_ITEM, UPDATED_TOOLS } from '../lib/keuze-extra-content.js';
import { THEMA_GUIDES } from '../lib/thema-gidsen.js';
import { renderThema, themaSchema, THEME_CLIENT, portionCost, heatCost, themeAdvice } from '../lib/thema-tools.js';
import { TOOL_CLIENT } from '../lib/keuze-client.js';
import { esc, TOOL_CSS, DOMAIN_TLDS, validDomain, normalizeLabel, nameScore, suggestDomains, normalizeQuotes, annualCosts, renderDomain, domainSchema, laadAdvice, laadResult, renderLaadpaal, laadProducts, selectChargers } from '../lib/keuze-tools.js';

const RATE = new Map();
async function rateAllowed(req) {
  const network = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
  const id = createHash('sha256').update(network + ':' + Math.floor(Date.now() / 60000)).digest('hex').slice(0, 24);
  try { const k = 'tool:domain:rate:' + id, n = await kv.incr(k); if (n === 1) await kv.raw(['EXPIRE', k, '120']); return n <= 12; }
  catch { const now = Date.now(); for (const [k, v] of RATE) if (now - v.at > 120000) RATE.delete(k); if (RATE.size > 1000 && !RATE.has(id)) return false; const r = RATE.get(id) || { at: now, n: 0 }; r.n++; RATE.set(id, r); return r.n <= 12; }
}
const rules = () => 'const DOMAIN_TLDS = new Set(' + JSON.stringify([...DOMAIN_TLDS]) + ');\n' + [validDomain, normalizeLabel, nameScore, suggestDomains, annualCosts].map(fn => 'export ' + fn.toString()).join('\n');
async function chargerProducts(route) {
  const a = laadAdvice(route);
  // Alleen voor een bekende 3-fasenaansluiting. Geen modeltoezegging voor VvE, straat of onbekende aansluiting.
  if (a.mode !== 'home' || a.route[1] !== 2) return [];
  try {
    const { searchCached } = await import('../lib/bol.js');
    const wish = a.route[2], feature = ['', 'zonnestroom', 'dynamisch laden', 'MID meter'][wish];
    const result = await Promise.race([searchCached('laadpaal auto 11 kW ' + feature, { country: 'NL', size: 24, sort: 'RELEVANCE' }), new Promise(resolve => setTimeout(() => resolve({ products: [] }), 5500))]);
    const candidates = selectChargers((result.products || []).filter(p => !wish || (wish === 1 ? /zonne|solar|pv/i : wish === 2 ? /dynamisch|dynamic|tarie[fv]/i : /\bmid\b|verreken/i).test(p.title)));
    return candidates.map(p => ({ checkedAt: result.at || null, id: String(p.id).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40), title: p.title, price: p.price, url: 'https://partner.bol.com/click/click?p=1&t=url&s=1547300&f=TXL&url=' + encodeURIComponent(p.url) + '&subid=' + encodeURIComponent('kz_laadpaal-' + a.route.join('')) }));
  } catch { return []; }
}
function document(g, body, schema, tool) {
  const canonical = 'https://' + g.host + '/' + g.slug;
  const translations = THEMA_GUIDES[tool] ? Object.values(THEMA_GUIDES[tool]).map(x => '<link rel="alternate" hreflang="' + x.lang + '" href="https://' + x.host + '/' + x.slug + '">').join('') : tool === 'domain' ? Object.values(DOMAIN_GUIDES).map(x => '<link rel="alternate" hreflang="' + x.lang + '" href="https://' + x.host + '/' + x.slug + '">').join('') + '<link rel="alternate" hreflang="en" href="https://whichtobuy.best/domain-name"><link rel="alternate" hreflang="x-default" href="https://whichtobuy.best/domain-name">' : '';
  return '<!doctype html><html lang="' + g.lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"><title>' + esc(g.title) + '</title><meta name="description" content="' + esc(g.description) + '"><link rel="canonical" href="' + canonical + '">' + translations + '<meta property="og:type" content="website"><meta property="og:title" content="' + esc(g.title) + '"><meta property="og:description" content="' + esc(g.description) + '"><meta property="og:url" content="' + canonical + '"><meta property="og:locale" content="' + g.lang.replace('-', '_') + '"><meta property="og:site_name" content="' + esc(g.site) + '"><meta name="twitter:card" content="summary"><link rel="alternate" type="text/plain" href="/llms.txt"><style>' + look(g.id === 'de' ? ACCENTS.kaufberater : g.id === 'us' ? ACCENTS.whichtobuy : ACCENTS.keuzehulp, { dark: false }) + TOOL_CSS + '.table-scroll{overflow-x:auto}.guide-table{min-width:420px}section.txt{margin:32px 0}</style><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head><body><header class="topbar"><div class="wrap"><a class="mark" href="/">' + esc(g.site) + '</a><nav class="topnav" aria-label="Menu"><a href="/">' + esc(g.ui.home) + '</a></nav></div></header><main><div class="wrap">' + body + '</div></main><footer><div class="wrap">' + esc(g.site) + ' · AdsFair B.V. · <a href="https://www.linkedin.com/in/henkjandekrijger" rel="author noopener" target="_blank">Henkjan de Krijger</a> · <a href="/privacy">' + (g.id === 'de' ? 'Datenschutz' : 'Privacy') + '</a><p>' + (THEMA_GUIDES[tool] ? (g.id === 'de' ? 'Unabhängige Kaufhilfe. Partnerlinks können eine Vergütung ergeben.' : 'Onafhankelijke keuzehulp. Bij aankopen via partnerlinks kunnen wij een vergoeding ontvangen.') : tool === 'laadpaal' ? 'Vergelijk laadoplossingen en stroomkosten voor jouw situatie.' : g.id === 'nl' ? 'Onafhankelijke keuzehulp. De naamgenerator is gratis; er worden geen domeinen geregistreerd.' : g.id === 'de' ? 'Unabhängiger Ratgeber. Der Namensgenerator ist kostenlos; es werden keine Domains registriert.' : 'Independent guide. The name generator is free and does not register domains.') + '</p></div></footer>' + koopMeetScript() + '<script defer src="/api/vindbaarheid?op=tracker&v=2"></script></body></html>';
}
function laadSchema() {
  const url = 'https://keuzehulp.best/laadpaal';
  return { '@context': 'https://schema.org', '@graph': [{ '@type': 'Article', headline: LAADPAAL_ITEM.h1, description: LAADPAAL_ITEM.intro, inLanguage: 'nl-NL', datePublished: UPDATED_TOOLS, dateModified: UPDATED_TOOLS, mainEntityOfPage: url, author: { '@type': 'Person', name: 'Henkjan de Krijger', url: 'https://www.linkedin.com/in/henkjandekrijger' }, publisher: { '@type': 'Organization', name: 'Keuzehulp', url: 'https://keuzehulp.best' } }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Keuzehulp', item: 'https://keuzehulp.best/' }, { '@type': 'ListItem', position: 2, name: 'Laadpaal kiezen', item: url }] }] };
}
export default async function handler(req, res) {
  const url = new URL(req.url, 'https://keuzehulp.best'), q = url.searchParams, op = q.get('op') || '';
  res.setHeader('x-content-type-options', 'nosniff');
  if(q.get('tool')==='autohuur'){const {autohuurHandler}=await import('../lib/autohuur-curacao.js');return autohuurHandler(req,res,url,q.get('market')||'nl');}
  if(q.get('tool')==='energy'){const {energyHandler}=await import('../lib/energie-page.js');return energyHandler(req,res);}
  if(q.get('tool')==='resale'){const {resaleHandler}=await import('../lib/clothes-resale-page.js');return resaleHandler(req,res,url,q.get('market')||'nl');}
  if(q.get('tool')==='sephora'){const {sephoraHandler}=await import('../lib/sephora-page.js');return sephoraHandler(req,res);}
  if(q.get('tool')==='temu'){const {temuHandler}=await import('../lib/temu-page.js');return temuHandler(req,res);}
  if(q.get('tool')==='battery'){const {batteryHandler}=await import('../lib/stekkerbatterij-page.js');return batteryHandler(req,res);}
  if (['client','rules','theme-client','theme-rules'].includes(op)) {
    res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600'); res.setHeader('x-robots-tag', 'noindex'); return res.status(200).send(op === 'client' ? TOOL_CLIENT : op === 'theme-client' ? THEME_CLIENT : op === 'theme-rules' ? [portionCost, heatCost, themeAdvice].map(fn => 'export ' + fn.toString()).join('\n') : rules());
  }
  if (op === 'domains') {
    res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return res.status(405).json({ ok: false, error: 'POST required' }); }
    let b = req.body;
    try { if (typeof b === 'string') { if (b.length > 8192) throw new Error(); b = JSON.parse(b); } } catch { return res.status(400).json({ ok: false, error: 'Invalid JSON' }); }
    const ds = b?.domains;
    if (!Array.isArray(ds) || ds.length < 1 || ds.length > 10 || !ds.every(validDomain)) return res.status(400).json({ ok: false, error: 'Provide 1–10 valid supported domains' });
    if (!await rateAllowed(req)) return res.status(429).json({ ok: false, error: 'Please try again later' });
    if (ds.every(d => /\.(nl|de)$/.test(d))) return res.status(200).json({ ok: true, results: normalizeQuotes({}, [...new Set(ds)]), checkedAt: new Date().toISOString() });
    try {
      const response = await fetch('https://api.vercel.com/v1/registrar/domains/search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domains: [...new Set(ds)].filter(d => !/\.(nl|de)$/.test(d)) }), signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('Upstream unavailable');
      const data = await response.json(); const results = normalizeQuotes(data, [...new Set(ds)]);
      return res.status(200).json({ ok: true, results, checkedAt: new Date().toISOString() });
    } catch { return res.status(502).json({ ok: false, error: 'Availability could not be confirmed' }); }
  }
  if (op === 'laadadvies') {
    res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
    const advice = laadAdvice((q.get('a') || '').split('-')); const products = await chargerProducts(advice.route);
    return res.status(200).json({ ok: true, route: advice.route, html: laadResult(advice), productsHtml: laadProducts(products) });
  }
  if (req.method && !['GET', 'HEAD'].includes(req.method)) { res.setHeader('allow', 'GET, HEAD'); return res.status(405).send('Method not allowed'); }
  if (q.get('tool') && !['domain', 'laadpaal','acai','heat'].includes(q.get('tool'))) return res.status(404).send('Not found');
  const isLaadpaal = q.get('tool') === 'laadpaal', market = q.get('market') || 'nl', g = DOMAIN_GUIDES[market];
  if (!g || (isLaadpaal && market !== 'nl')) return res.status(404).send('Not found');
  let html, koopProducts = [];
  const theme = THEMA_GUIDES[q.get('tool')]?.[market];
  if (THEMA_GUIDES[q.get('tool')] && !theme) return res.status(404).send('Not found');
  if (theme) html = document({ ...theme, ui: { home: market === 'de' ? 'Alle Kaufhilfen' : 'Alle keuzehulpen' } }, renderThema(q.get('tool'), market), themaSchema(q.get('tool'), market), q.get('tool'));
  else if (isLaadpaal) {
    const advice = laadAdvice([q.get('q0'), q.get('q1'), q.get('q2')]); const products = await chargerProducts(advice.route); koopProducts = products;
    const evGuide = { ...g, slug: 'laadpaal', title: 'Laadpaal kiezen: thuis, VvE of openbaar laden in Nederland', description: LAADPAAL_ITEM.intro };
    html = document(evGuide, renderLaadpaal(advice.route, products), laadSchema(), 'laadpaal');
  } else html = document(g, renderDomain(g), domainSchema(g), 'domain');
  const prefix = market === 'nl' ? 'hjdk6-kz-' : 'wtb-' + market + '-';
  const slug = theme ? theme.slug : isLaadpaal ? 'laadpaal' : g.slug;
  if (!theme) html = html.replace('</div></main>', koopBlok({ market, subject: isLaadpaal ? 'een laadpaal' : 'een domeinnaam', slug, products: koopProducts, kind: isLaadpaal ? 'product' : 'domain' }) + '</div></main>');
  const ua = String(req.headers['user-agent'] || '');
  const bot = /bot|crawl|spider|ChatGPT-User|Claude-User|Perplexity-User/i.test(ua);
  if (bot) { try { await kv.incrMany([['c:' + prefix + slug + '-bot', 1]]); } catch {} }
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', isLaadpaal ? 'public, max-age=300' : 'public, max-age=600'); res.setHeader('x-robots-tag', 'index, follow');
  return res.status(200).send(html);
}


