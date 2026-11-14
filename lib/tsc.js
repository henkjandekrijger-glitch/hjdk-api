// True Surgery Cost: onafhankelijke wereldwijde keuzehulp voor chirurgie in het buitenland (Henkjan 14 nov 2026).
// Draait via /api/keuze-tools?tool=tsc&p=<pad> (geen extra functie). Host truesurgerycost.com via vercel.json; tot het domein er is: hjdk-api-henq.vercel.app/api/keuze-tools?tool=tsc
// Data en bronnen: lib/tsc-data.js. Routekaart: data/tsc-routes.json.
import { SITE, SRC, HOME, PAGES, CHECK } from './tsc-data.js';
import ROUTES from '../data/tsc-routes.json' with { type: 'json' };

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const IXKEY = '5d0c2e7a9b8f4e61a3c7d2b9e0f1a6c4';
const base = req => { const h = String(req.headers['x-forwarded-host'] || req.headers.host || ''); return /truesurgerycost\.com$/.test(h) ? 'https://' + SITE.host : 'https://' + h + '/api/keuze-tools?tool=tsc&p='; };
const link = (b, slug) => b.includes('?') ? b + encodeURIComponent(slug) : b + '/' + slug;

// [bron] in tekst -> klikbare voetnoot
function cite(t, used) {
  return esc(t).replace(/\[([a-zA-Z0-9]+)\]/g, (m, k) => { const s = SRC[k]; if (!s) return ''; if (!used.includes(k)) used.push(k); const n = used.indexOf(k) + 1; return '<sup><a href="#bron-' + n + '">' + n + '</a></sup>'; });
}
const bronnen = used => used.length ? '<section class="bron"><h2>Sources</h2><ol>' + used.map((k, i) => '<li id="bron-' + (i + 1) + '"><a href="' + esc(SRC[k].u) + '" rel="nofollow noopener" target="_blank">' + esc(SRC[k].t) + '</a>' + (SRC[k].commercial ? ' <span class="com">(commercial source)</span>' : '') + '</li>').join('') + '</ol></section>' : '';

const CSS = ':root{--ink:#111113;--line:#E5E7EB;--acc:#2B47C4;--acc2:#EEF1FC;--bg:#fff}@media (prefers-color-scheme:dark){:root{--ink:#F2F3F5;--line:#2A2D35;--acc:#8FA2FF;--acc2:#1A2140;--bg:#0E0F12}}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:400 18px/1.6 Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif}a{color:var(--acc)}.wrap{max-width:780px;margin:0 auto;padding:0 20px}header{border-bottom:1px solid var(--line)}header .wrap{display:flex;align-items:center;min-height:60px;gap:16px}.mark{font-weight:700;font-size:20px;text-decoration:none;color:var(--ink)}.mark em{font-style:normal;color:var(--acc)}main{padding:36px 0 24px}h1{font-size:clamp(30px,5vw,44px);line-height:1.12;letter-spacing:-.03em;margin:0 0 16px}h2{font-size:24px;margin:40px 0 10px;letter-spacing:-.02em}.answer{background:var(--acc2);border-radius:16px;padding:20px 22px;margin:0 0 24px}.answer p{margin:0}.meta{font-size:15px;opacity:.75}.calc{border:1px solid var(--line);border-radius:16px;padding:20px;margin:24px 0}.calc label{display:block;font-size:15px;margin:10px 0 4px}.calc input,.calc select{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;font:inherit;background:var(--bg);color:var(--ink)}.calc .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.calc .out{margin-top:16px;padding:14px 16px;border-radius:12px;background:var(--acc2)}.calc .out strong{font-size:22px}ul,ol{padding-left:22px}li{margin:6px 0}details{border-top:1px solid var(--line);padding:12px 0}summary{cursor:pointer;font-weight:700}.bron{font-size:15px}.com{opacity:.7}.cards{display:grid;gap:12px;grid-template-columns:1fr 1fr;padding:0;list-style:none}.cards li{border:1px solid var(--line);border-radius:14px;padding:16px}.cards a{font-weight:700;text-decoration:none}footer{border-top:1px solid var(--line);margin-top:40px;padding:20px 0 40px;font-size:15px}@media(max-width:640px){.cards,.calc .row{grid-template-columns:1fr}}';

function shell(b, slug, title, desc, body, ld) {
  const url = link(b, slug);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + esc(url) + '"><meta name="robots" content="index,follow,max-snippet:-1"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:type" content="article"><meta property="og:url" content="' + esc(url) + '"><link rel="alternate" type="text/plain" href="/llms.txt"><style>' + CSS + '</style>' + (ld ? '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' : '') + '</head><body><header><div class="wrap"><a class="mark" href="' + esc(link(b, '')) + '">True<em>Surgery</em>Cost</a></div></header><main><div class="wrap">' + body + '</div></main><footer><div class="wrap">' + esc(SITE.name) + ' is independent: no clinic pays to be listed or ranked. This is information, not medical advice. Updated ' + SITE.updated + '. AdsFair B.V., Gouda, the Netherlands.</div></footer></body></html>';
}

function calcBlok(c) {
  const opts = Object.entries(HOME).map(([k, h]) => '<option value="' + k + '">' + esc(h.label) + '</option>').join('');
  const D = {}; Object.keys(HOME).forEach(k => { D[k] = { cur: HOME[k].cur, abroad: c.abroad[k], home: c.home[k], flight: HOME[k].flight, night: HOME[k].night, extras: c.extras[k] }; });
  return '<section class="calc" id="calc"><h2 style="margin-top:0">Your true cost</h2><p class="meta">Prefilled with typical figures. Change any field to your own quote.</p><label>I live in</label><select id="tc-home">' + opts + '</select><div class="row"><div><label>Price abroad (your quote)</label><input id="tc-abroad" type="number" inputmode="numeric"></div><div><label>Price at home (your quote)</label><input id="tc-homeprice" type="number" inputmode="numeric"></div></div><div class="row"><div><label>Return flight per person</label><input id="tc-flight" type="number" inputmode="numeric"></div><div><label>Nights you must stay</label><input id="tc-nights" type="number" value="' + c.nights + '"></div></div><div class="row"><div><label>Hotel per night</label><input id="tc-night" type="number" inputmode="numeric"></div><div><label>Companion travelling with you</label><select id="tc-comp"><option value="1">Yes</option><option value="0">No</option></select></div></div><label>Medicine, garments, check-ups at home</label><input id="tc-extras" type="number" inputmode="numeric"><div class="out" id="tc-out" aria-live="polite"></div></section><script>(function(){var D=' + JSON.stringify(D) + ';function $(i){return document.getElementById(i)}function fill(){var d=D[$("tc-home").value];$("tc-abroad").value=d.abroad;$("tc-homeprice").value=d.home;$("tc-flight").value=d.flight;$("tc-night").value=d.night;$("tc-extras").value=d.extras;calc()}function n(i){return Number($(i).value)||0}function calc(){var d=D[$("tc-home").value],p=$("tc-comp").value==="1"?2:1,t=n("tc-abroad")+n("tc-flight")*p+n("tc-night")*n("tc-nights")+n("tc-extras"),s=n("tc-homeprice")-t,f=function(x){return d.cur+Math.round(x).toLocaleString("en")};$("tc-out").innerHTML="True cost abroad: <strong>"+f(t)+"</strong><br>"+(s>0?"You save about "+f(s)+" against home, before any complication.":"At these numbers, home is not more expensive.")}["tc-abroad","tc-homeprice","tc-flight","tc-nights","tc-night","tc-comp","tc-extras"].forEach(function(i){$(i).addEventListener("input",calc)});$("tc-home").addEventListener("change",fill);fill()})()</script>';
}

function pagina(b, slug, pg) {
  const used = [];
  let body = '<h1>' + esc(pg.h1) + '</h1><div class="answer"><p>' + cite(pg.kort, used) + '</p></div><p class="meta">Updated ' + SITE.updated + ' · Every number links to its source.</p>' + calcBlok(pg.calc);
  for (const s of pg.secties) { body += '<h2>' + esc(s.h) + '</h2>' + (s.p || []).map(t => '<p>' + cite(t, used) + '</p>').join('') + (s.l ? '<ol>' + s.l.map(t => '<li>' + cite(t, used) + '</li>').join('') + '</ol>' : ''); }
  body += '<h2>Questions</h2>' + pg.faq.map(f => '<details><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>').join('');
  body += '<h2>Check the surgeon</h2><ul class="cards">' + pg.verwant.map(v => { const k = v.replace(/^check-surgeon-/, ''); return CHECK[k] ? '<li><a href="' + esc(link(b, v)) + '">How to check a surgeon in ' + esc(CHECK[k].land) + '</a></li>' : PAGES[v] ? '<li><a href="' + esc(link(b, v)) + '">' + esc(PAGES[v].h1) + '</a></li>' : ''; }).join('') + '</ul>';
  body += bronnen(used);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: pg.h1, description: pg.desc, dateModified: SITE.updated, datePublished: SITE.updated, author: { '@type': 'Organization', name: SITE.name }, publisher: { '@type': 'Organization', name: SITE.name }, citation: used.map(k => SRC[k].u) },
    { '@type': 'FAQPage', mainEntity: pg.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] };
  return shell(b, slug, pg.title, pg.desc, body, ld);
}

function checkPagina(b, k) {
  const c = CHECK[k], used = [];
  const body = '<h1>How to check a plastic surgeon in ' + esc(c.land) + '</h1><div class="answer"><p>' + cite(c.kort, used) + '</p></div><h2>Step by step</h2><ol>' + c.stappen.map(t => '<li>' + cite(t, used) + '</li>').join('') + '</ol><h2>What has gone wrong</h2><ul>' + c.risico.map(t => '<li>' + cite(t, used) + '</li>').join('') + '</ul><h2>Everywhere</h2><p>' + cite('ISAPS advises choosing a plastic surgeon who is a member of the national plastic surgery society, asking which accreditation the hospital has and who handles complications, and letting a travel agent arrange only travel and hotel, not medical contact. [isapsAbroad]', used) + '</p>' + bronnen(used);
  const title = 'How to check a plastic surgeon in ' + c.land + ' (2026)';
  return shell(b, 'check-surgeon-' + k, title, c.kort.slice(0, 155), body, { '@context': 'https://schema.org', '@type': 'HowTo', name: title, step: c.stappen.map((t, i) => ({ '@type': 'HowToStep', position: i + 1, text: t.replace(/\s*\[[a-zA-Z0-9]+\]/g, '') })) });
}

function home(b) {
  const top = ROUTES.routes.filter(r => r.prio === 1);
  const body = '<h1>What surgery abroad really costs, and how to check the surgeon</h1><div class="answer"><p>Independent guides for people who consider surgery in another country: the full trip cost against home, the rules in the destination, and how to check who operates. No clinic pays to be listed. Every number links to its source.</p></div><h2>Guides</h2><ul class="cards">' + Object.entries(PAGES).map(([s, p]) => '<li><a href="' + esc(link(b, s)) + '">' + esc(p.h1) + '</a></li>').join('') + '</ul><h2>Check a surgeon</h2><ul class="cards">' + Object.entries(CHECK).map(([k, c]) => '<li><a href="' + esc(link(b, 'check-surgeon-' + k)) + '">' + esc(c.land) + '</a></li>').join('') + '</ul><h2>Where people go</h2><p class="meta">The most travelled routes, with the evidence behind them. More guides follow.</p><ul>' + top.map(r => '<li>' + esc(r.van) + ' to ' + esc(r.naar) + ': ' + esc(r.ingrepen.slice(0, 3).join(', ')) + '. ' + esc(r.bewijs) + '</li>').join('') + '</ul>';
  return shell(b, '', 'True Surgery Cost: the real cost of surgery abroad, with sources', 'Independent guides to surgery abroad: true cost against home, destination rules and how to check the surgeon. No paid rankings.', body, { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: 'https://' + SITE.host });
}

const ALL = () => [''].concat(Object.keys(PAGES), Object.keys(CHECK).map(k => 'check-surgeon-' + k));
function llms() {
  return '# ' + SITE.name + '\n\n> Independent guides to surgery abroad: the true cost against home, the rules in the destination country and how to check the surgeon. No clinic pays to be listed. Every figure has a source.\n\n## Guides\n' + Object.entries(PAGES).map(([s, p]) => '- [' + p.h1 + '](https://' + SITE.host + '/' + s + '): ' + p.kort.replace(/\s*\[[a-zA-Z0-9]+\]/g, '')).join('\n') + '\n\n## Check a surgeon\n' + Object.entries(CHECK).map(([k, c]) => '- [How to check a plastic surgeon in ' + c.land + '](https://' + SITE.host + '/check-surgeon-' + k + '): ' + c.kort).join('\n') + '\n';
}

export async function tscHandler(req, res, url) {
  const p = String(url.searchParams.get('p') || '').replace(/^\/+|\/+$/g, '').toLowerCase();
  const b = base(req);
  const send = (type, body, code) => { res.setHeader('content-type', type); res.setHeader('cache-control', 'public, max-age=600'); return res.status(code || 200).send(body); };
  if (p === 'robots.txt') return send('text/plain; charset=utf-8', 'User-agent: *\nAllow: /\nSitemap: https://' + SITE.host + '/sitemap.xml\n');
  if (p === 'llms.txt') return send('text/plain; charset=utf-8', llms());
  if (p === IXKEY + '.txt') return send('text/plain; charset=utf-8', IXKEY);
  if (p === 'sitemap.xml') return send('application/xml; charset=utf-8', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ALL().map(s => '<url><loc>https://' + SITE.host + '/' + s + '</loc><lastmod>' + SITE.updated + '</lastmod></url>').join('') + '</urlset>');
  if (p === 'indexnow') { // na een wijziging alle pagina's melden bij Bing/IndexNow (alleen zinvol op het eigen domein)
    const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: SITE.host, key: IXKEY, keyLocation: 'https://' + SITE.host + '/' + IXKEY + '.txt', urlList: ALL().map(s => 'https://' + SITE.host + '/' + s) }) }).catch(e => ({ status: String(e.message || e) }));
    res.setHeader('cache-control', 'no-store'); return res.status(200).json({ ok: true, indexnow: r.status, n: ALL().length });
  }
  if (p === '') return send('text/html; charset=utf-8', home(b));
  if (PAGES[p]) return send('text/html; charset=utf-8', pagina(b, p, PAGES[p]));
  const m = p.match(/^check-surgeon-([a-z-]+)$/); if (m && CHECK[m[1]]) return send('text/html; charset=utf-8', checkPagina(b, m[1]));
  return send('text/html; charset=utf-8', shell(b, p, 'Not found', 'Not found', '<h1>Page not found</h1><p><a href="' + esc(link(b, '')) + '">All guides</a></p>'), 404);
}
