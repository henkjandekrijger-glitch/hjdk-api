import { rankUsage, usageDays, dailyUsage } from '../lib/guide-usage.js';
import { guideAnswers, guideDecision } from '../lib/us-demand-guides.js';
import { decisionHtml, guideSections } from '../lib/us-demand-view.js';
import { koopBlok, koopMeetScript } from '../lib/koopblok.js';
// WTB-pagina's: whichtobuy.best (VS) en kaufberater.best (DE). Zelfde idee als keuzehulp.best: 3 vragen, 1 eerlijke keuze, prijs van vandaag (Amazon).
// Routes (vercel.json, op host): / , /<slug>, /sitemap.xml, /robots.txt, /llms.txt, /llms-full.txt, /<indexnow-sleutel>.txt, /about, /privacy
// API: /api/wtb?op=advice&slug=..&a=0-1-2 (producten voor de antwoorden), /api/wtb?op=status (openbaar overzicht)
import { kv } from '../lib/db.js';
import { organicStatus } from '../lib/organic.js';
import { contentDate } from '../lib/organic-policy.js';
import { lookNieuw } from '../lib/look.js';
import { colourTag, colourReport, measureTag } from '../lib/kleur.js';
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
  if(it.decisionKind){const decision=guideDecision(it,a);return {subject:it.term,slug:it.slug,kws:decision.query,link:searchLink(m,decision.query),products:[],at:null,api:false,decision};}
  const opts = (it.questions || []).map((q, i) => (q.options || [])[a[i] || 0] || {});
  const kws = [it.term, ...opts.map(o => o.kw).filter(Boolean)].join(' ').replace(/\s+/g, ' ').trim();
  let min = 0, max = 1e9; opts.forEach(o => { if (o.min != null) min = Math.max(min, Number(o.min)); if (o.max != null) max = Math.min(max, Number(o.max)); });
  const out = { kws, subject: it.term || it.title, slug: it.slug, link: searchLink(m, kws), products: [], at: null, api: amzReady() };
  if (!amzReady()) return out;
  const tries = [kws, [it.term, opts[0] && opts[0].kw].filter(Boolean).join(' '), it.term];
  for (const k of [...new Set(tries)]) {
    try { const r = await amzSearch(m, k); if (!r) break; const ok = r.products.filter(p => p.image && (p.price == null || (p.price >= min && p.price <= max))); if (ok.length) { out.products = ok.slice(0, 3); out.at = r.at; if (k !== kws) out.relaxed = true; break; } } catch (e) { out.err = String(e.message).slice(0, 120); break; }
  }
  return out;
}

const GSC_FILES = ['googleed5fc2c42fb5c26d.html']; // Search Console-verificatiebestanden (henkjandekrijger@gmail.com)
const CSS = () => lookNieuw() + 'details.card>summary{list-style:none;cursor:pointer}details.card>summary::-webkit-details-marker{display:none}details.card ul{margin:12px 0 0;padding-left:20px}details.card li{margin:6px 0}details.card[open]{grid-column:1/-1}'; // nieuwe huisstijl (outname-look), zelfde voor alle keuzehulpen (Henkjan 20 okt)
function shell(m, o) {
  const base = 'https://' + m.host;
  return `<!doctype html><html lang="${m.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}"><link rel="canonical" href="${base}${o.path}"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"><link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:type" content="${o.og || 'website'}"><meta property="og:url" content="${base}${o.path}">${o.image ? `<meta property="og:image" content="${esc(o.image)}">` : ''}${o.ld ? `<script type="application/ld+json">${JSON.stringify(o.ld).replace(/</g, '\\u003c')}</script>` : ''}<style>${CSS()}</style></head><body>
<header class="topbar"><div class="wrap"><a class="mark" href="/">${m.id === 'us' ? 'which<em>to</em>buy' : 'kauf<em>berater</em>'}</a><nav class="topnav" aria-label="Menu"><a href="/">${m.s.all}</a><a href="/about">${m.s.about}</a></nav></div></header><main><div class="wrap">${o.body}</div></main>
<footer><div class="wrap"><div class="fl"><a href="/">${m.name}</a><a href="/about">${m.s.about}</a><a href="/privacy">Privacy</a>${m.id === 'us' ? '<a href="/privacy#opt-out">Do Not Sell or Share My Personal Information</a>' : ''}<a href="/llms.txt">llms.txt</a><a href="/sitemap.xml">Sitemap</a></div><div>${esc(m.s.disc)} · <a href="/about">${m.s.about}</a> · <a href="/privacy">Privacy</a><br>${m.id === 'de' ? 'Impressum: AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, Niederlande · KvK 60126035' : 'AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, Netherlands'} · ${m.name} by Henkjan de Krijger<br>${m.id === 'de' ? 'Auch für Käufer in den USA: <a href="https://whichtobuy.best/" hreflang="en" lang="en">whichtobuy.best</a> · in den Niederlanden: <a href="https://keuzehulp.best/" hreflang="nl" lang="nl">keuzehulp.best</a>' : 'Also for shoppers in Germany: <a href="https://kaufberater.best/" hreflang="de" lang="de">kaufberater.best</a> · in the Netherlands: <a href="https://keuzehulp.best/" hreflang="nl" lang="nl">keuzehulp.best</a>'}</div></div></footer>
<script>window.__h=function(k){try{navigator.sendBeacon('/api/hjdk/stats/hits',new Blob([JSON.stringify({hits:[[k,1]]})],{type:'text/plain'}))}catch(e){}};</script>${koopMeetScript()}<script defer src="/api/vindbaarheid?op=tracker&v=2"></script></body></html>`;
}
function card(m, p, i) {
  const role = i === 0 ? m.s.pick : m.s.alt;
  return `<div class="pr${i === 0 ? ' best' : ''}"><a href="${esc(p.url)}" rel="sponsored nofollow noopener" target="_blank" data-amz="${esc(p.asin)}"><img src="${esc(p.image)}" alt="${esc(p.title.slice(0, 80))}" loading="lazy"></a><div><div class="role">${esc(role)}</div><div class="t">${esc(p.title.slice(0, 110))}</div>${p.price != null ? `<div class="price">${esc(p.priceText || m.money(p.price))}</div>` : ''}<a class="btn" href="${esc(p.url)}" rel="sponsored nofollow noopener" target="_blank" data-amz="${esc(p.asin)}">${esc(p.price != null ? m.s.see : m.s.noPrice)} →</a></div></div>`;
}
function adviceHtml(m, adv) {
  if(adv.decision)return decisionHtml(adv.decision,adv.link,esc);
  const buy = koopBlok({ market: m.id, subject: adv.subject || adv.kws, slug: adv.slug || '', products: adv.products, at: adv.at, fallback: adv.link });
  if (adv.products.length) return adv.products.map((p, i) => card(m, p, i)).join('') + `<p class="disc">${esc(m.s.priceNote)} ${esc(new Date(adv.at || Date.now()).toLocaleString(m.locale, { timeZone: m.id === 'us' ? 'America/New_York' : 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' }))}; ${esc(m.s.priceNote2)}</p>` + buy;
  return `<div class="pr best" style="grid-template-columns:1fr"><div><div class="role">${esc(m.s.fallback)}</div><div class="t">${esc(adv.kws)}</div><a class="btn" href="${esc(adv.link)}" rel="sponsored nofollow noopener" target="_blank" data-amz="search">${esc(m.s.seeAll)} →</a></div></div>` + buy;
}

// antwoordblok zoals nexy.help: alleen de eerste zin vet
function firstBold(t) { t = String(t || ''); const x = t.match(/^([\s\S]+?[.!?])(\s+[\s\S]+)$/); return x ? '<strong>' + esc(x[1]) + '</strong>' + esc(x[2]) : '<strong>' + esc(t) + '</strong>'; }
async function page(m, it, all, req) {
  const s = m.s; const base = 'https://' + m.host; const a0 = guideAnswers(it, new URL(req.url,'http://x').searchParams.get('answers'));
  const adv = await advice(m, it, a0);
  const boost = new Set((await kv.get('hjdk:gsc:' + m.id + ':boost').catch(() => null)) || []); const sc = x => (x.cat === it.cat ? 2 : 0) + (boost.has(x.slug) ? 1 : 0) + ((it.verwant || []).includes(x.slug) || (x.verwant || []).includes(it.slug) ? 20 : 0);
  const rel = all.filter(x => x.slug !== it.slug).sort((x, y) => sc(y) - sc(x)).slice(0, 8);
  const qs = (it.questions || []).map((q, qi) => `<div class="q" data-q="${qi}" role="group" aria-labelledby="question-${qi}"><h2 id="question-${qi}">${qi + 1}. ${esc(q.q)}</h2><div class="opts">${(q.options || []).map((o, oi) => `<button class="opt${a0[qi] === oi ? ' on' : ''}" type="button" data-o="${oi}" aria-pressed="${a0[qi] === oi}">${esc(o.label)}</button>`).join('')}</div></div>`).join('');
  const upd = contentDate(it);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: it.h1, description: it.metaDesc, inLanguage: m.locale, ...(it.publishAt ? { datePublished: it.publishAt } : {}), ...(upd ? { dateModified: upd } : {}), author: { '@type': 'Person', name: 'Henkjan de Krijger', url: 'https://www.linkedin.com/in/henkjandekrijger' }, publisher: { '@type': 'Organization', name: m.name, url: base }, mainEntityOfPage: base + '/' + it.slug, about: { '@type': 'Thing', name: it.term } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: m.name, item: base + '/' }, { '@type': 'ListItem', position: 2, name: it.title, item: base + '/' + it.slug }] },
    ...((it.faq || []).length ? [{ '@type': 'FAQPage', mainEntity: it.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
    ...(adv.products.length ? [{ '@type': 'ItemList', name: it.title, itemListElement: adv.products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title.slice(0, 110), url: p.url })) }] : []) ] };
  const body = `<p class="crumbs"><a href="/">${esc(m.name)}</a> › ${esc(it.cat)}</p><p class="kicker">${esc(it.cat)}</p><h1>${esc(it.h1)}</h1><p class="standfirst">${esc(it.intro)}</p>
<div class="answer"><p>${firstBold(it.kort)}</p></div><p class="meta">${upd ? `${esc(s.updated)}&nbsp;<time datetime="${esc(upd)}">${esc(upd)}</time> · ` : ""}${esc(s.by)} Henkjan de Krijger</p>
<h2>${esc(s.q)}</h2>${qs}
<div class="guide-actions"><button type="button" id="share-guide">Copy this result</button><span id="share-status" role="status"></span></div><p id="advice-status" role="status"></p><div id="adv" aria-live="polite" aria-atomic="true" style="margin:14px 0">${adviceHtml(m, adv)}</div>
${guideSections(it,esc)}
${(it.aiMiss || []).length ? `<div class="box ai"><h2>${esc(s.aimiss)}</h2><ul>${it.aiMiss.map(x => '<li>' + esc(x) + '</li>').join('')}</ul></div>` : ''}
<div class="box"><h2>${esc(s.guide)}</h2>${String(it.guide || '').split(/\n+/).filter(Boolean).map(p => '<p>' + esc(p) + '</p>').join('')}</div>
${(it.mistakes || []).length ? `<div class="box"><h2>${esc(s.mistakes)}</h2><ul>${it.mistakes.map(x => '<li>' + esc(x) + '</li>').join('')}</ul></div>` : ''}
${(it.faq || []).length ? `<h2>${esc(s.faq)}</h2>${it.faq.map(f => `<details class="faq"><summary>${esc(f.q)}</summary><div class="a"><p>${esc(f.a)}</p></div></details>`).join('')}` : ''}
${rel.length ? `<h2>${esc(s.related)}</h2><ul class="cards">${rel.map(r => `<li><a href="/${esc(r.slug)}">${esc(r.title)}</a><p>${esc(String(r.kort || '').slice(0, 140))}</p></li>`).join('')}</ul>` : ''}
<p class="disc">${esc(s.disc)}</p>
<script>(function(){var S=${JSON.stringify(it.slug)},M=${JSON.stringify(m.id)},cur=${JSON.stringify(a0)},t=null,st=0,seq=0;
var h=function(k){if(window.__h)window.__h(k)},status=document.getElementById('advice-status');
function load(){var id=++seq;status.textContent='Updating your recommendation…';document.getElementById('adv').setAttribute('aria-busy','true');fetch('/api/wtb?op=advice&m='+M+'&slug='+encodeURIComponent(S)+'&a='+cur.join('-')+'&html=1').then(function(r){if(!r.ok)throw Error('advice');return r.json()}).then(function(j){if(id!==seq)return;if(!j||!j.html)throw Error('advice');document.getElementById('adv').innerHTML=j.html;document.getElementById('adv').setAttribute('aria-busy','false');status.textContent='Recommendation updated.';h('wtb-'+M+'-'+S+'-adv')}).catch(function(){if(id!==seq)return;document.getElementById('adv').setAttribute('aria-busy','false');status.textContent='Could not update. Reload this page to use your selected answers.';document.getElementById('adv').innerHTML='<p>Your previous result is out of date. Please reload to get a recommendation for your current answers.</p>'})}
document.querySelectorAll('.q').forEach(function(q){var qi=+q.getAttribute('data-q');q.querySelectorAll('.opt').forEach(function(b){b.addEventListener('click',function(){seq++;q.querySelectorAll('.opt').forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false')});b.classList.add('on');b.setAttribute('aria-pressed','true');cur[qi]=+b.getAttribute('data-o');var u=new URL(location.href);u.searchParams.set('answers',cur.join('-'));history.replaceState(null,'',u);if(!st){st=1;h('wtb-'+M+'-'+S+'-start');h('wtb-'+M+'-start')}clearTimeout(t);status.textContent='Updating your recommendation…';document.getElementById('adv').setAttribute('aria-busy','true');t=setTimeout(load,200)})})});
document.getElementById('share-guide').addEventListener('click',function(){var u=new URL('https://${m.host}/'+S);u.searchParams.set('answers',cur.join('-'));var out=document.getElementById('share-status');if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u.href).then(function(){out.textContent='Link copied with your answers.'},function(){out.textContent='Copy the address from your browser to share this result.'});else out.textContent='Copy the address from your browser to share this result.';h('wtb-'+M+'-'+S+'-share')});
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-amz]');if(a){h('wtb-'+M+'-'+S+'-clk');h('wtb-'+M+'-clk');h('wtb-'+M+'-clkd-'+new Date().toISOString().slice(0,10))}},true);})();</script>`;
  return shell(m, { title: it.seoTitle || it.h1, desc: it.metaDesc || it.intro, path: '/' + it.slug, og: 'article', image: adv.products[0] && adv.products[0].image, ld, body });
}
async function home(m, all) {
  const s = m.s; const us = m.id === 'us'; const cats = {}; all.forEach(i => { (cats[i.cat] = cats[i.cat] || []).push(i); });
  const kort = i => esc(String(i.kort || i.intro || '').replace(/\s+/g, ' ').slice(0, 110).replace(/\s\S*$/, '')) + '…';
  const tegel = i => `<a class="card" href="/${esc(i.slug)}"><div class="cat">${esc(i.cat)}</div><h3>${esc(i.title)}</h3><p>${kort(i)}</p></a>`;
  const newest = all.slice().sort((a, b) => String(b.publishAt || '').localeCompare(String(a.publishAt || '')) || (b.priority || 0) - (a.priority || 0)).slice(0, 6);
  let pop = []; try { pop = rankUsage(await Promise.all(usageDays().map(d => dailyUsage(m.id, d))), all); } catch (e) {}
  if (pop.length < 4) pop = pop.concat(all.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0)).filter(i => !pop.some(x => x.slug === i.slug) && !newest.some(x => x.slug === i.slug)).slice(0, 6 - pop.length));
  const catsS = Object.keys(cats).sort((a, b) => cats[b].length - cats[a].length);
  const T = us ? { eyebrow: all.length + ' buying guides · new ones every day', zoek: 'Search: air fryer, mattress, stroller…', geen: 'No guide for this yet.', pop: 'Popular this week', nieuw: 'Recently added', cur: 'Traveling to or living in Curaçao', curH: 'Everything compared for your trip or move', curP: '24 guides: car rental, hotels, beaches, diving, restaurants, buying a house and more.', meer: 'View →', alle: 'All categories', n: 'guides', how: 'How we pick', howP: 'Each guide asks three questions that really matter (size, use, budget) and then looks at what is on sale today on Amazon for the product that fits. We weigh how well it fits your answers, buyer ratings and today\'s price. Brands cannot buy a spot.' }
    : { eyebrow: all.length + ' Kaufberater · jeden Tag neue', zoek: 'Suche: Heißluftfritteuse, Matratze, Kinderwagen…', geen: 'Dazu gibt es noch keinen Ratgeber.', pop: 'Beliebt diese Woche', nieuw: 'Neu dazugekommen', cur: 'Reise oder Leben auf Curaçao', curH: 'Alles verglichen für deine Reise oder deinen Umzug', curP: '24 Ratgeber: Mietwagen, Hotels, Strände, Tauchen, Restaurants, Hauskauf und mehr.', meer: 'Ansehen →', alle: 'Alle Kategorien', n: 'Ratgeber', how: 'So wählen wir', howP: 'Jeder Ratgeber stellt drei Fragen, die wirklich zählen (Größe, Nutzung, Budget), und sucht dann im heutigen Amazon-Angebot das passende Produkt. Wir achten darauf, wie gut es zu deinen Antworten passt, auf Käuferbewertungen und den Preis von heute. Marken können keinen Platz kaufen.' };
  const idx = JSON.stringify(all.map(i => [i.slug, i.title, i.cat, String(i.kort || i.intro || '').replace(/\s+/g, ' ').slice(0, 110)])).replace(/</g, '\\u003c');
  const body = `<p class="eyebrow"><span class="live-dot"></span>${esc(T.eyebrow)}</p><h1>${esc(s.hero)}</h1><p class="lead">${esc(s.heroP)}</p>
<div class="zoekvak"><input id="zoek2" type="search" placeholder="${esc(T.zoek)}" aria-label="${esc(T.zoek)}"></div><div id="zres" class="grid" hidden></div><p id="zgeen" class="meta" hidden>${esc(T.geen)}</p>
${pop.length ? `<h2>${esc(T.pop)}</h2><div class="grid">${pop.slice(0, 6).map(tegel).join('')}</div>` : ''}
${newest.length ? `<h2>${esc(T.nieuw)}</h2><div class="grid">${newest.map(tegel).join('')}</div>` : `<p class="meta">${esc(s.wait)}</p>`}
<h2>${esc(T.cur)}</h2><div class="grid"><a class="card" href="/curacao"><div class="cat">Curaçao</div><h3>${esc(T.curH)}</h3><p>${esc(T.curP)}</p><span class="meer">${esc(T.meer)}</span></a></div>
<h2>${esc(T.alle)}</h2><div class="grid">${catsS.map(c => `<details class="card"><summary><h3>${esc(c)}</h3><p>${cats[c].slice(0, 3).map(i => esc(i.title)).join(', ')}</p><span class="meer">${cats[c].length} ${esc(T.n)} →</span></summary><ul>${cats[c].map(i => `<li><a href="/${esc(i.slug)}">${esc(i.title)}</a></li>`).join('')}</ul></details>`).join('')}</div>
<div class="txt"><h2>${esc(T.how)}</h2><p>${esc(T.howP)}</p></div><p class="disc">${esc(s.disc)}</p>
<script>(function(){var I=${idx},z=document.getElementById('zoek2'),r=document.getElementById('zres'),g=document.getElementById('zgeen');function e(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}z.addEventListener('input',function(){var q=z.value.toLowerCase().trim();if(q.length<2){r.hidden=true;g.hidden=true;return}var m=I.filter(function(i){return (i[0]+' '+i[1]+' '+i[2]).toLowerCase().indexOf(q)>=0}).slice(0,12);r.innerHTML=m.map(function(i){return '<a class="card" href="/'+e(i[0])+'"><div class="cat">'+e(i[2])+'</div><h3>'+e(i[1])+'</h3><p>'+e(i[3])+'…</p></a>'}).join('');r.hidden=!m.length;g.hidden=!!m.length})})();</script>`;
  const base = 'https://' + m.host;
  return shell(m, { title: m.name + (us ? ' — Buying guides that ask 3 questions' : ' — Kaufberatung in 3 Fragen'), desc: s.heroP, path: '/', body, ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite', name: m.name, url: base, inLanguage: m.locale }, { '@type': 'Organization', name: m.name, url: base, founder: { '@type': 'Person', name: 'Henkjan de Krijger' } }, { '@type': 'ItemList', itemListElement: all.map((i, n) => ({ '@type': 'ListItem', position: n + 1, name: i.title, url: base + '/' + i.slug })) }] } });
}
function about(m) {
  const t = m.id === 'us' ? `<h1>About ${m.name}</h1><p>${m.name} helps you pick the right product in three questions. Each guide is written for the products on sale now, linked to live Amazon results, and updated when the market changes. Many AI chat answers still recommend models from two or three years ago; we flag that where it matters.</p><p>Made by Henkjan de Krijger (AdsFair B.V., Gouda, Netherlands), 25+ years building consumer internet products. Contact: henkjan@keuzehulp.best</p><p>${esc(m.s.disc)}</p>`
    : `<h1>Über ${m.name}</h1><p>${m.name} hilft dir, in drei Fragen das passende Produkt zu finden. Jeder Ratgeber ist für die Produkte geschrieben, die heute verkauft werden, ist mit aktuellen Amazon-Ergebnissen verlinkt und wird aktualisiert, wenn sich der Markt ändert. Viele KI-Antworten empfehlen noch Modelle von vor zwei, drei Jahren; darauf weisen wir hin, wo es wichtig ist.</p><p>Gemacht von Henkjan de Krijger (AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, Niederlande, KvK 60126035). Kontakt: henkjan@keuzehulp.best</p><p>${esc(m.s.disc)}</p>`;
  return shell(m, { title: m.s.about + ' — ' + m.name, desc: m.name, path: '/about', body: t });
}
function privacy(m) { return shell(m, { title: 'Privacy — ' + m.name, desc: 'Privacy', path: '/privacy', body: m.id === 'us' ? '<h1>Privacy</h1><p>We do not sell data for money. We count page views and clicks. When you reach Amazon through one of our ads, our links (/go and /w) briefly check technical details of the click to tell real people from bots and fake clicks: browser and device type, screen, language, time zone, a hashed device fingerprint, the shortened network part of your IP address (never the full address) and the ad that was clicked. A first-party cookie (mmp, 6 months) recognizes repeat clicks. This data is used only to measure our ads and stop fraud, is kept for at most 6 months and is never sold. Sometimes we show a short box with another of our sites or an offer to get our emails; whether you see it, close it or sign up is counted per visit to learn which box helps. If you enter your email there, you sign up for todayin.email, our free daily news email (same company, AdsFair B.V.): we pass your email, the town that belongs to your IP address and the topic of the page you were reading, so your first email is about your town and that topic. We use it only for the emails you asked for; every email has an unsubscribe link and you can ask us to delete it. Links to Amazon are affiliate links; Amazon sets its own cookies when you visit Amazon.</p><h2 id="opt-out">Ad audiences and your choice</h2><p>If you are in the United States, you really used one of our pages (or did so before) and your browser does not send a Global Privacy Control or Do Not Track signal, we may let the ad networks we advertise with (such as PropellerAds) add your browser to an audience, so they can show you our ads again later. The network uses its own cookie or device ID for that; we pass no name, no email and nothing about what you did on Amazon. Under California and other US state laws this can count as &ldquo;sharing&rdquo; personal information for cross-context behavioral advertising. You can opt out at any time with the button below, or by turning on Global Privacy Control in your browser; we honor that signal automatically. Visitors in the EU, the UK and Switzerland are never added to an ad audience.</p><p><button type="button" id="cm-optout" style="font:inherit;padding:10px 16px;border-radius:999px;border:1px solid #2B47C4;background:#fff;color:#2B47C4;cursor:pointer">Do not sell or share my personal information</button> <span id="cm-optout-ok" hidden>Done. You are opted out on this browser.</span></p><script>(function(){var b=document.getElementById(\'cm-optout\'),k=document.getElementById(\'cm-optout-ok\');function af(){try{localStorage.setItem(\'cmRtUit\',\'1\')}catch(e){}k.hidden=false;b.disabled=true}try{if(localStorage.getItem(\'cmRtUit\')===\'1\'||/(?:^|; )mmrt=uit/.test(document.cookie)){af()}}catch(e){}b.onclick=function(){af();try{fetch(\'/api/mm/rtuit\',{credentials:\'include\'})}catch(e){}}})();</script>' : '<h1>Datenschutz</h1><p>Wir verwenden keine Werbe-Cookies und verkaufen keine Daten. Wir zählen Seitenaufrufe und Klicks. Wer über eine unserer Anzeigen zu Amazon gelangt, durchläuft kurz unsere Links (/go oder /w), die technische Merkmale des Klicks prüfen, um echte Menschen von Bots und Fake-Klicks zu unterscheiden: Browser- und Gerätetyp, Bildschirm, Sprache, Zeitzone, ein gehashter Geräte-Fingerabdruck, der gekürzte Netzwerkteil der IP-Adresse (nie die vollständige Adresse) und die angeklickte Anzeige. Ein eigenes Cookie (mmp, 6 Monate) erkennt wiederholte Klicks. Diese Daten dienen nur der Messung unserer Anzeigen und der Betrugsabwehr, werden höchstens 6 Monate gespeichert und nie verkauft. Manchmal zeigen wir ein kurzes Fenster mit einer anderen unserer Seiten oder einem Angebot für unsere E-Mails; ob Sie es sehen, schließen oder sich eintragen, zählen wir pro Besuch, um zu lernen, welches Angebot hilft. Wenn Sie Ihre E-Mail-Adresse eingeben, speichern wir sie mit dem Text, dem Sie zugestimmt haben, und nutzen sie nur für die gewünschten E-Mails, erst nach Bestätigung per Link; jede E-Mail enthält einen Abmeldelink, und Sie können die Löschung verlangen. Links zu Amazon sind Partnerlinks; Amazon setzt beim Besuch von Amazon eigene Cookies.</p>' }); }

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x'); const q = url.searchParams; const op = q.get('op') || 'page';
  if (op === 'status') { // openbaar overzicht, beide markten
    const out = { ok: true, amazonApi: amzReady(), markten: {} };
    for (const m of Object.values(MARKETS)) { const all = await items(m); const plan = await kv.get(K.plan(m.id, DAY())).catch(() => null); out.markten[m.id] = { site: 'https://' + m.host, tag: m.tag(), gidsen: all.length, organisch: await organicStatus(m.id, m.perDay()), vandaag: plan ? { gepland: (plan.topics || []).length, gemaakt: (plan.topics || []).filter(t => t.status === 'live').length, mislukt: (plan.topics || []).filter(t => t.status === 'fout').length } : null, nieuwste: all.slice(-5).map(i => ({ slug: i.slug, blindspot: i.blind && i.blind.score })) }; }
    out.kleurtest = { keuzehulp: await colourReport('keuzehulp', 'kz'), whichtobuy: await colourReport('whichtobuy', 'wtbus'), kaufberater: await colourReport('kaufberater', 'wtbde') };
    out.log = ((await kv.get(K.log)) || []).slice(0, 30);
    res.setHeader('cache-control', 'no-store'); return res.status(200).json(out);
  }
  const m = marketFor(req); if (!m) return res.status(404).send('unknown site');
  const path = '/' + String(q.get('slug') || '');
  if (GSC_FILES.includes(path.slice(1))) { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send('google-site-verification: ' + path.slice(1)); } // eigendomsbewijs Search Console
  if (op === 'robots') { res.setHeader('content-type', 'text/plain'); return res.status(200).send(`# Buying guides may be read and cited by search engines and AI assistants. Summary: https://${m.host}/llms.txt\nUser-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: https://${m.host}/sitemap.xml\n`); }
  if (op === 'ixkey') { res.setHeader('content-type', 'text/plain'); return res.status(200).send(INDEXNOW_KEY); }
  const all = await items(m);
  if (op === 'sitemap') { res.setHeader('content-type', 'application/xml; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600'); return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${m.host}/</loc></url><url><loc>https://${m.host}/about</loc></url>${all.map(i => `<url><loc>https://${m.host}/${i.slug}</loc>${contentDate(i) ? `<lastmod>${esc(contentDate(i))}</lastmod>` : ""}</url>`).join('')}</urlset>`); }
  if (op === 'llms' || op === 'llmsfull') {
    res.setHeader('content-type', 'text/plain; charset=utf-8'); const full = op === 'llmsfull';
    const head = m.id === 'us' ? `# ${m.name}\n\n> Buying guides for the US market, written for products on sale now (2026) and linked to live Amazon results. Each guide asks 3 questions and gives one pick. Guides list what AI answers often get wrong (outdated models, old standards).\n\n` : `# ${m.name}\n\n> Kaufberater für Deutschland, geschrieben für Produkte, die heute verkauft werden (2026), verlinkt mit aktuellen Amazon-Ergebnissen. Jeder Ratgeber stellt 3 Fragen und gibt eine Empfehlung. Ratgeber nennen, was KI-Antworten oft falsch machen (veraltete Modelle, alte Standards).\n\n`;
    return res.status(200).send(head + all.map(i => full ? `## ${i.title}\nURL: https://${m.host}/${i.slug}\nUpdated: ${i.updatedAt || i.publishAt}\n${i.kort}\n${(i.aiMiss || []).map(x => '- ' + x).join('\n')}\n${String(i.guide || '').slice(0, 1500)}\n` : `- [${i.title}](https://${m.host}/${i.slug}): ${i.kort}`).join('\n') + '\n');
  }
  if (op === 'advice') {
    const it = all.find(i => i.slug === String(q.get('slug') || '')); if (!it) return res.status(404).json({ ok: false });
    const a = guideAnswers(it,q.get('a'));
    const adv = await advice(m, it, a); res.setHeader('cache-control', 'public, max-age=600');
    try { await kv.incrMany([['c:wtb-' + m.id + '-' + it.slug + '-r' + a.join('') + '-imp', 1]]); } catch (e) {}
    return res.status(200).json(Object.assign({ ok: true }, q.get('html') ? { html: adviceHtml(m, adv) } : adv));
  }
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=0, must-revalidate');
  const tag = (await colourTag(m.id === 'us' ? 'whichtobuy' : 'kaufberater', 'wtb' + m.id, 'a[data-amz]', true, m.id)) + measureTag('wtb' + m.id, 'a[data-amz]', '.opt') + '<script src="/cm.js" data-site="' + (m.id === 'us' ? 'whichtobuy' : 'kaufberater') + '"__KW__ async></script>'; /* lerende modal (lib/modal.js); data-interest = onderwerp van de gids, de modal vult dat in bij het todayin-aanbod */ const send = (h, kw) => res.status(200).send(String(h).replace('</head>', tag.replace('__KW__', kw ? ' data-interest="' + esc(String(kw).slice(0, 60)) + '"' : '') + '</head>'));
  if (op === 'about') return send(about(m));
  if (op === 'privacy') return send(privacy(m));
  if (op === 'home' || path === '/') { await count(m, req, q, ''); return send(await home(m, all)); }
  const it = all.find(i => i.slug === path.slice(1));
  if (!it) { res.setHeader('cache-control', 'no-store'); return res.status(404).send(shell(m, { title: '404 — ' + m.name, desc: '', path: '/', body: `<h1>404</h1><p><a href="/">${esc(m.s.home)}</a></p>` })); }
  if (it.tool) { res.setHeader('location', 'https://' + m.host + '/' + it.slug); return res.status(308).end(); }
  await count(m, req, q, it.slug);
  return send(await page(m, it, all, req), it.term);
}
