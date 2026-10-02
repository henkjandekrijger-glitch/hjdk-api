// KEUZEHULP — interactieve koopgidsen op een eigen domein (3 vragen -> één advies -> bol).
//   GET /keuzehulp                 overzicht (ook / op het eigen domein)
//   GET /keuzehulp/<slug>          keuzehulp-pagina (vragen + advies; server-side al gevuld voor Google)
//   GET /api/kz/advies?slug&a=0-1-2  JSON: 3 producten voor deze antwoordroute (bol-API, prijs van nu, leert op kliks)
//   GET /keuzehulp/sitemap.xml, /over, /privacy
// Teksten: data/kz.json (seed) + KV hjdk:kz:<slug> (door de cloudtaak toegevoegd). Subid per route: kz_<slug>-<route> -> /api/bol/learn ziet orders per route.
import { kv } from '../lib/db.js';
import { searchCached } from '../lib/bol.js';
import seed from '../data/kz.json' with { type: 'json' };
import seed2 from '../data/kz2.json' with { type: 'json' };
const UPDATED = '2026-10-02';

const BOL_SITE = '1229920';
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = v => '€' + Number(v).toFixed(2).replace('.', ',');
const SITE = seed.site;
const bolLink = (url, subid) => 'https://partner.bol.com/click/click?p=1&t=url&s=' + BOL_SITE + '&f=TXL&url=' + encodeURIComponent(String(url).replace(/[?#].*$/, '')) + '&subid=' + encodeURIComponent(subid);

async function allItems() {
  const extra = []; try { const idx = (await kv.get('hjdk:kz:index')) || []; const vals = idx.length ? await kv.mget(...idx.map(s => 'hjdk:kz:' + s)) : []; vals.forEach(v => { if (v && v.slug) extra.push(v); }); } catch (e) {}
  const seen = {}; const out = [];
  seed.items.concat(seed2.items, extra).forEach(it => { if (!seen[it.slug]) { seen[it.slug] = 1; out.push(it); } });
  return out;
}
async function getItem(slug) { const all = await allItems(); return all.find(i => i.slug === slug) || null; }

// antwoordroute -> filters -> 3 producten (beste, goedkoper, luxer); kliks per product leren mee
async function advise(item, route) {
  const picks = route.map((a, i) => (item.questions[i] && item.questions[i].options[a]) || null).filter(Boolean);
  let term = item.term; let must = [], min = 0, max = 0;
  picks.forEach(o => { if (o.term) term = o.term; if (o.add) term += ' ' + o.add; if (o.must) must = must.concat(o.must.map(x => x.toLowerCase())); if (o.min) min = Math.max(min, o.min); if (o.max) max = max ? Math.min(max, o.max) : o.max; });
  let products = [];
  try { const r = await searchCached(term.trim(), { country: 'NL', size: 48, sort: 'RELEVANCE' }); products = (r.products || []).filter(p => p.price != null && p.image); } catch (e) {}
  const key = 'kz_' + item.slug + '-' + route.join('');
  const hitsOf = p => { const t = String(p.title).toLowerCase(); return must.filter(m => t.indexOf(m) >= 0).length; };
  const score = p => { const hits = hitsOf(p); let s = hits * 2 + (p.rating || 3.5); if (min && p.price < min) s -= 3; if (max && p.price > max) s -= 3; if (p.strike && p.strike > p.price) s += 0.5; return s; };
  let ranked = products.map(p => Object.assign({}, p, { s: score(p), hits: hitsOf(p) })).sort((a, b) => b.s - a.s);
  const ids = ranked.slice(0, 12).map(p => 'c:hjdk6-kz-' + item.slug + '-' + p.id + '-clk');
  try { const clk = ids.length ? await kv.mget(...ids) : []; ranked.slice(0, 12).forEach((p, i) => { p.s += Math.min(3, (Number(clk[i]) || 0) / 10); }); ranked = ranked.sort((a, b) => b.s - a.s); } catch (e) {}
  const top = ranked.slice(0, 8); if (!top.length) return { key, term, products: [] };
  const best = top[0];
  const fits = p => !must.length || p.hits >= Math.max(1, best.hits - 1); /* alternatieven moeten bij de antwoorden blijven passen */
  const cheaper = top.filter(p => p.id !== best.id && fits(p) && p.price < best.price && (p.rating || 0) >= 4 && !(min && p.price < min * 0.6)).sort((a, b) => a.price - b.price)[0] || null;
  const premium = top.filter(p => p.id !== best.id && fits(p) && (!cheaper || p.id !== cheaper.id) && p.price > best.price).sort((a, b) => b.price - a.price)[0] || null;
  const out = [{ role: 'Ons advies', p: best }]; if (cheaper) out.push({ role: 'Goedkoper alternatief', p: cheaper }); if (premium) out.push({ role: 'Als je meer wilt', p: premium });
  return { key, term, products: out.map(x => ({ role: x.role, id: x.p.id, title: x.p.title, image: x.p.image, price: x.p.price, strike: x.p.strike, rating: x.p.rating, delivery: x.p.delivery, url: bolLink(x.p.url, key) })) };
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

const baseOf = req => 'https://' + String(req && req.headers && req.headers.host || 'hjdk-api.vercel.app');
const isCustom = req => !/vercel\.app$|^localhost/.test(String(req && req.headers && req.headers.host || ''));
const pathOf = (req, p) => (isCustom(req) ? p.replace(/^\/keuzehulp(?=\/|$)/, '') || '/' : p);
function shell(title, desc, body, canonical, extraHead) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">${canonical ? '<link rel="canonical" href="' + esc(canonical) + '">' : ''}<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:locale" content="nl_NL"><meta property="og:site_name" content="${esc(SITE.name)}">${extraHead || ''}<style>${CSS}</style></head><body>
<header><div class="in"><a class="logo" href="/keuzehulp">Keuze<span>hulp</span></a><nav><a href="/keuzehulp">Alle keuzehulpen</a><a href="/keuzehulp/over">Over ons</a></nav></div></header>
<main>${body}</main>
<footer>${esc(SITE.name)} is een onafhankelijke keuzehulp van ${esc(SITE.owner)} · <a href="/keuzehulp/over">Over ons</a> · <a href="/keuzehulp/privacy">Privacy</a> · <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a><br>Affiliate-vermelding: als je via onze link iets koopt bij bol, ontvangen wij een vergoeding. De prijs die je betaalt verandert daardoor niet. Prijzen en beoordelingen komen rechtstreeks van bol en worden elke 20 minuten ververst.</footer>
</body></html>`;
}

function productCard(x, i) {
  return `<div class="pr${i === 0 ? ' best' : ''}"><a href="${esc(x.url)}" target="_blank" rel="sponsored noopener nofollow" data-kz="${esc(x.id)}"><img src="${esc(x.image)}" alt="" loading="lazy"></a><div><div class="role">${esc(x.role)}</div><div class="t">${esc(String(x.title).slice(0, 90))}</div><div class="m"><b>${eur(x.price)}</b>${x.strike && x.strike > x.price ? '<s>' + eur(x.strike) + '</s>' : ''}${x.rating != null ? ' · ★ ' + Number(x.rating).toFixed(1).replace('.', ',') : ''}${x.delivery && /morgen/i.test(x.delivery) ? ' · morgen in huis' : ''}</div><a class="btn" href="${esc(x.url)}" target="_blank" rel="sponsored noopener nofollow" data-kz="${esc(x.id)}">Bekijk bij bol →</a></div></div>`;
}

function faqHtml(item) { return (item.faq || []).length ? `<div class="txt" id="faq"><h2>Veelgestelde vragen over ${esc(item.title.replace(/^Welke? |\?$/g, '').toLowerCase())}</h2>${item.faq.map(f => '<h3 style="font-size:16px;margin:12px 0 4px">' + esc(f.q) + '</h3><p style="margin:0 0 8px;color:#44403c">' + esc(f.a) + '</p>').join('')}</div>` : ''; }
function jsonld(obj) { return '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, '\\u003c') + '</script>'; }
async function page(item, res, req) {
  const all = await allItems(); const base = baseOf(req); const url = base + pathOf(req, '/keuzehulp/' + item.slug);
  const same = all.filter(i => i.cat === item.cat && i.slug !== item.slug).slice(0, 5); const other = all.filter(i => i.cat !== item.cat).sort(() => 0.5 - Math.random()).slice(0, Math.max(3, 8 - same.length)); /* altijd 6–8 interne links per pagina */
  const route0 = item.questions.map(() => 0);
  const adv = await advise(item, route0);
  const qs = item.questions.map((q, qi) => `<div class="q" data-q="${qi}"><h2>${qi + 1}. ${esc(q.q)}</h2><div class="opts">${q.options.map((o, oi) => `<button class="opt${oi === 0 ? ' on' : ''}" data-o="${oi}" type="button">${esc(o.label)}</button>`).join('')}</div></div>`).join('');
  const crumbs = `<nav aria-label="breadcrumb" style="font-size:13px;color:#78716c;margin:4px 0 0"><a href="/keuzehulp" style="color:#78716c">Keuzehulp</a> › <a href="/keuzehulp#${esc(item.cat.toLowerCase().replace(/[^a-z]+/g, '-'))}" style="color:#78716c">${esc(item.cat)}</a> › ${esc(item.title)}</nav>`;
  const kort = item.kort ? `<div class="txt" style="border-left:4px solid #0f766e"><h2 style="font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:#0f766e">In het kort</h2><p style="margin:0;font-size:17px">${esc(item.kort)}</p></div>` : '';
  const related = `<div class="txt"><h2>Ook handig om te kiezen</h2><div class="grid" style="margin:8px 0 0">${same.concat(other).map(i => `<a class="card" href="/keuzehulp/${esc(i.slug)}"><div class="cat">${esc(i.cat)}</div><h3>${esc(i.title)}</h3></a>`).join('')}</div></div>`;
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: item.h1, description: item.intro, inLanguage: 'nl', dateModified: UPDATED, author: { '@type': 'Organization', name: SITE.name }, publisher: { '@type': 'Organization', name: SITE.name }, mainEntityOfPage: url },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Keuzehulp', item: base + pathOf(req, '/keuzehulp') }, { '@type': 'ListItem', position: 2, name: item.cat }, { '@type': 'ListItem', position: 3, name: item.title, item: url }] },
    ...(item.faq && item.faq.length ? [{ '@type': 'FAQPage', mainEntity: item.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []) ] });
  const body = `<article><div class="hero">${crumbs}<div class="cat" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#78716c;margin-top:10px">${esc(item.cat)} · keuzehulp · bijgewerkt ${UPDATED}</div><h1>${esc(item.h1)}</h1><p>${esc(item.intro)}</p></div>
${kort}
${qs}
<div class="adv" id="adv"><h2 style="font-size:19px;margin:8px 0 10px">Jouw advies <span id="advn" style="color:#78716c;font-weight:400;font-size:14px"></span></h2><div id="advl">${adv.products.map(productCard).join('') || '<p>Even geduld, we halen de prijzen van vandaag op…</p>'}</div><p class="disc">Prijzen van vandaag bij bol; wij kiezen op pasvorm bij jouw antwoorden, beoordeling en prijs. Geen betaalde plaatsing.</p></div>
<div class="txt"><h2>Waar je op moet letten</h2><p>${esc(item.uitleg)}</p></div>
<div class="txt"><h2>Veelgemaakte fouten</h2><ul>${item.fouten.map(f => '<li>' + esc(f) + '</li>').join('')}</ul></div>
${faqHtml(item)}
${related}
<p class="disc">Hulp nodig bij een keuze die hier nog niet staat? Mail <a href="mailto:${esc(SITE.email)}?subject=Keuzehulp%20gevraagd:%20">${esc(SITE.email)}</a> — we maken er een keuzehulp van.</p></article>
<script>(function(){var S=${JSON.stringify(item.slug)},A='${'/api/kz/advies'}',H='https://hjdk-api.vercel.app/api/hjdk/stats/hits';var n=document.querySelectorAll('.q').length;var cur=[];for(var i=0;i<n;i++)cur.push(0);
function hit(k){try{navigator.sendBeacon(H,new Blob([JSON.stringify({hits:[[k,1]]})],{type:'text/plain'}))}catch(e){}}
function eur(v){return '€'+Number(v).toFixed(2).replace('.',',')}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function card(x,i){return '<div class="pr'+(i===0?' best':'')+'"><a href="'+esc(x.url)+'" target="_blank" rel="sponsored noopener nofollow" data-kz="'+esc(x.id)+'"><img src="'+esc(x.image)+'" alt=""></a><div><div class="role">'+esc(x.role)+'</div><div class="t">'+esc(String(x.title).slice(0,90))+'</div><div class="m"><b>'+eur(x.price)+'</b>'+(x.strike&&x.strike>x.price?'<s>'+eur(x.strike)+'</s>':'')+(x.rating!=null?' · ★ '+Number(x.rating).toFixed(1).replace('.',','):'')+(x.delivery&&/morgen/i.test(x.delivery)?' · morgen in huis':'')+'</div><a class="btn" href="'+esc(x.url)+'" target="_blank" rel="sponsored noopener nofollow" data-kz="'+esc(x.id)+'">Bekijk bij bol →</a></div></div>'}
var t=null;function load(){var r=cur.join('-');document.getElementById('advn').textContent='wordt bijgewerkt…';fetch(A+'?slug='+encodeURIComponent(S)+'&a='+r).then(function(x){return x.json()}).then(function(j){var l=document.getElementById('advl');l.innerHTML=(j.products||[]).map(card).join('')||'<p>Geen passend product gevonden met deze antwoorden. Probeer een andere combinatie.</p>';document.getElementById('advn').textContent='';hit('hjdk6-kz-'+S+'-r'+r+'-imp');(j.products||[]).forEach(function(p){hit('hjdk6-kz-'+S+'-'+p.id+'-imp')});try{history.replaceState(null,'','#a='+r)}catch(e){}}).catch(function(){document.getElementById('advn').textContent=''})}
document.querySelectorAll('.q').forEach(function(q){var qi=+q.getAttribute('data-q');q.querySelectorAll('.opt').forEach(function(b){b.addEventListener('click',function(){q.querySelectorAll('.opt').forEach(function(x){x.classList.remove('on')});b.classList.add('on');cur[qi]=+b.getAttribute('data-o');hit('hjdk6-kz-'+S+'-q'+qi+'-'+cur[qi]);clearTimeout(t);t=setTimeout(load,250);var adv=document.getElementById('adv');if(qi===n-1&&adv){adv.scrollIntoView({behavior:'smooth',block:'start'})}})})});
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-kz]');if(a){hit('hjdk6-kz-'+S+'-'+a.getAttribute('data-kz')+'-clk');hit('hjdk6-kz-'+S+'-r'+cur.join('-')+'-clk');hit('hjdk6-kz-clk')}},true);
try{var m=(location.hash||'').match(/a=([\\d-]+)/);if(m){var p=m[1].split('-');var ch=false;p.forEach(function(v,i){if(i<n){var b=document.querySelector('.q[data-q="'+i+'"] .opt[data-o="'+v+'"]');if(b){cur[i]=+v;ch=true;b.parentNode.querySelectorAll('.opt').forEach(function(x){x.classList.remove('on')});b.classList.add('on')}}});if(ch)load()}}catch(e){}
hit('hjdk6-kz-'+S+'-page');})();</script>`;
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=600');
  return res.status(200).send(shell(item.title + ' | ' + SITE.name, item.kort || item.intro, body, url, ld));
}

async function home(res, req) {
  const items = await allItems(); const cats = {}; items.forEach(i => { (cats[i.cat] = cats[i.cat] || []).push(i); }); const base = baseOf(req);
  const body = `<div class="hero"><h1>Twijfel je wat je moet kopen? ${esc(SITE.tagline.split('—')[0])}</h1><p>Beantwoord drie korte vragen en krijg één advies dat bij jóuw situatie past — met de prijs van vandaag bij bol, een goedkoper en een luxer alternatief, en de fouten die anderen al maakten.</p></div>
<p style="margin:0 0 6px"><input id="zoek" type="search" placeholder="Zoek: airfryer, matras, kinderwagen…" style="width:100%;max-width:420px;font:16px system-ui;padding:12px 14px;border:1.5px solid #d6d3d1;border-radius:12px"></p><p style="font-size:13px;color:#78716c;margin:0 0 10px">${items.length} keuzehulpen · bijgewerkt ${UPDATED}</p>
${Object.keys(cats).map(c => `<h2 id="${esc(c.toLowerCase().replace(/[^a-z]+/g, '-'))}" style="font-size:20px;margin:22px 0 4px">${esc(c)} <span style="color:#a8a29e;font-weight:400;font-size:14px">${cats[c].length}</span></h2><div class="grid">${cats[c].map(i => `<a class="card" href="/keuzehulp/${esc(i.slug)}" data-t="${esc((i.title + ' ' + i.slug + ' ' + i.cat).toLowerCase())}"><div class="cat">${esc(i.cat)}</div><h3>${esc(i.title)}</h3><p>${esc((i.kort || i.intro).slice(0, 120))}…</p></a>`).join('')}</div>`).join('')}
<script>(function(){var z=document.getElementById('zoek');if(!z)return;z.addEventListener('input',function(){var q=z.value.toLowerCase().trim();document.querySelectorAll('.card[data-t]').forEach(function(c){c.style.display=!q||c.getAttribute('data-t').indexOf(q)>=0?'':'none'});document.querySelectorAll('h2[id]').forEach(function(h){var g=h.nextElementSibling;var any=g&&[].some.call(g.querySelectorAll('.card'),function(c){return c.style.display!=='none'});h.style.display=any?'':'none';if(g)g.style.display=any?'':'none'})})})();</script>
<div class="txt"><h2>Hoe wij kiezen</h2><p>Elke keuzehulp stelt drie vragen die er echt toe doen (maat, gebruik, budget) en zoekt dan in het actuele aanbod van bol naar het product dat daarbij past. We kijken naar de pasvorm bij jouw antwoorden, de beoordeling van kopers en de prijs van vandaag. Er is geen betaalde plaatsing: merken kunnen geen plek kopen.</p></div>`;
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=600');
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite', name: SITE.name, url: base, inLanguage: 'nl', description: SITE.tagline }, { '@type': 'Organization', name: SITE.name, url: base, email: SITE.email }, { '@type': 'ItemList', itemListElement: items.map((i, n) => ({ '@type': 'ListItem', position: n + 1, name: i.title, url: base + pathOf(req, '/keuzehulp/' + i.slug) })) }] });
  return res.status(200).send(shell(SITE.name + ' — in 3 vragen naar het juiste product', SITE.tagline, body, base + pathOf(req, '/keuzehulp'), ld));
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const op = url.searchParams.get('op') || '';
  const slug = (url.searchParams.get('slug') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
  try {
    if (op === 'advies') {
      res.setHeader('cache-control', 'no-store'); res.setHeader('access-control-allow-origin', '*');
      const item = await getItem(slug); if (!item) return res.status(404).json({ ok: false, error: 'onbekend' });
      const route = String(url.searchParams.get('a') || '').split('-').map(x => Math.max(0, Math.min(9, parseInt(x, 10) || 0))).slice(0, item.questions.length); while (route.length < item.questions.length) route.push(0);
      const adv = await advise(item, route); return res.status(200).json({ ok: true, slug: item.slug, route: route.join('-'), term: adv.term, products: adv.products });
    }
    if (op === 'put') { // cloudtaak voegt nieuwe keuzehulpen toe (token verplicht)
      if (req.method !== 'POST' || !process.env.HJDK_TOKEN || url.searchParams.get('token') !== process.env.HJDK_TOKEN) return res.status(401).json({ error: 'token' });
      let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      if (!b.slug || !b.title || !Array.isArray(b.questions) || b.questions.length < 2) return res.status(400).json({ error: 'slug, title, questions[] verplicht' });
      const s = String(b.slug).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60); b.slug = s;
      await kv.set('hjdk:kz:' + s, b); const idx = (await kv.get('hjdk:kz:index')) || []; if (idx.indexOf(s) < 0) { idx.push(s); await kv.set('hjdk:kz:index', idx); }
      return res.status(200).json({ ok: true, url: '/keuzehulp/' + s, total: seed.items.length + idx.length });
    }
    if (op === 'list') { const items = await allItems(); return res.status(200).json({ ok: true, n: items.length, items: items.map(i => ({ slug: i.slug, title: i.title, cat: i.cat, pct: i.pct })) }); }
    if (op === 'sitemap') { const items = await allItems(); const base = baseOf(req); res.setHeader('content-type', 'application/xml'); res.setHeader('cache-control', 'public, max-age=3600'); return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ['/keuzehulp', '/keuzehulp/over'].concat(items.map(i => '/keuzehulp/' + i.slug)).map(p => '<url><loc>' + esc(base + pathOf(req, p)) + '</loc><lastmod>' + UPDATED + '</lastmod></url>').join('') + '</urlset>'); }
    if (op === 'robots') { const base = baseOf(req); res.setHeader('content-type', 'text/plain'); return res.status(200).send('User-agent: *\nAllow: /\nDisallow: /setup\nDisallow: /leads\nDisallow: /subs\nDisallow: /api/\n\nSitemap: ' + base + pathOf(req, '/keuzehulp/sitemap.xml') + '\n'); }
    if (op === 'llms') { // llms.txt: korte, feitelijke samenvatting per keuzehulp voor AI-assistenten
      const items = await allItems(); const base = baseOf(req); res.setHeader('content-type', 'text/plain; charset=utf-8');
      return res.status(200).send('# ' + SITE.name + '\n\n> ' + SITE.tagline + ' Onafhankelijke keuzehulpen in het Nederlands; elk advies noemt producten met de prijs van vandaag bij bol.com. Uitgave van ' + SITE.owner + '.\n\n## Keuzehulpen\n\n' + items.map(i => '- [' + i.title + '](' + base + pathOf(req, '/keuzehulp/' + i.slug) + '): ' + (i.kort || i.intro)).join('\n') + '\n\n## Over\n\n- [Over ons](' + base + pathOf(req, '/keuzehulp/over') + ')\n- Contact: ' + SITE.email + '\n'); }
    if (slug === 'over') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(shell('Over ' + SITE.name, 'Wie wij zijn en hoe wij kiezen', `<div class="hero"><h1>Over ${esc(SITE.name)}</h1></div><div class="txt"><p>${esc(SITE.name)} helpt je kiezen zonder ruis: drie vragen, één advies, de prijs van vandaag. We verdienen een kleine vergoeding van bol als je via onze link koopt; dat beïnvloedt nooit welk product we adviseren. Merken kunnen geen plek kopen.</p><p>${esc(SITE.name)} is een uitgave van ${esc(SITE.owner)}. Vragen of een fout gezien? Mail <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>.</p></div>`)); }
    if (slug === 'privacy') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(shell('Privacy — ' + SITE.name, 'Wat we wel en niet bijhouden', `<div class="hero"><h1>Privacy</h1></div><div class="txt"><p>We slaan geen persoonsgegevens op als je een keuzehulp gebruikt. We tellen anoniem welke antwoorden en producten gekozen worden om de adviezen te verbeteren (geen cookies van ons, geen profielen). Klik je door naar bol, dan gelden daar de voorwaarden en cookies van bol. Laat je een e-mailadres achter voor de deals-mail, dan gebruiken we dat alleen daarvoor; afmelden kan met één klik in elke mail. Verantwoordelijke: ${esc(SITE.owner)}, ${esc(SITE.email)}.</p></div>`)); }
    if (!slug) return home(res, req);
    const item = await getItem(slug); if (!item) { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(404).send(shell('Niet gevonden', '', '<div class="hero"><h1>Deze keuzehulp bestaat (nog) niet</h1><p><a href="/keuzehulp">Bekijk alle keuzehulpen →</a></p></div>')); }
    return page(item, res, req);
  } catch (e) { return res.status(500).json({ ok: false, error: String(e && e.message || e).slice(0, 200) }); }
}
