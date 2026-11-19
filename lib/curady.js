// Curady (curady.com), high-ticket tak van Kadoly op dezelfde motor (Henkjan 18 nov 2026: "aparte tak op kadoly met aparte domeinnaam . Maar zelfde motor", naam "Yes leg vast").
// 19 nov 2026, Henkjan: "Nee ik vind t eveel risk . nog . Wil wel eerst tractie zien dus content maken we wel ." en daarna "Nee pak kadoly look en
// zet er content bij via demand radar zodat we gevonden worden . En maak keuzehulpen waar wij uit komen als supplier . Optimaliseer veel verder".
// - Look: dezelfde huisstijl als gids.kadoly.com (lookNieuw + CSS_KADOLY + CSS_GIDS uit api/gids.js), met het Kadoly-merk in zwart en wit
//   ("curady logo is cadoly maar dan zwart wit"; in donkere modus omgekeerd).
// - Inhoud: lib/curady-inhoud.js, keuzehulpen in EN (/), NL (/nl) en DE (/de) op de zoektermen uit Demand Radar (thema wellness).
// - Elke keuzehulp eindigt bij Curady: de uitkomst vult de offerteaanvraag in. Aanvragen in cy:aanvragen, tellers cy:n:<id>,
//   keuzehulpstappen cy:k:<id>:<start|klaar|cta>. Stand: /api/gids?op=cystand (met &vol=1 de aanvragen, alleen op de beschermde host).
// - Lerende chat volgt (Henkjan levert die later).
import { kv } from './db.js';
import { lookNieuw } from './look.js';
import { TALEN, UI, ONDERWERPEN, OUD, vindOnderwerp, talenVan, pad } from './curady-inhoud.js';
import { BEELD, BEELD_CSS } from './curady-beeld.js';
import { searchCached } from './bol.js';

const BASE = 'https://curady.com';
const BIJGEWERKT = '2026-11-19';
const INDEXNOW = 'c7d2a91f4e6b8035a1c9e7d4b2f60a18'; // IndexNow-sleutel van curady.com (bestand /<sleutel>.txt), voor Bing en andere IndexNow-zoekmachines
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WA = (taal, t) => 'https://wa.me/31655395630?text=' + encodeURIComponent(UI[taal].waTekst + t);
const LOC = { en: 'en', nl: 'nl-NL', de: 'de-DE' };

const MERK = s => `<svg class="cy-mk" width="${s}" height="${s}" viewBox="0 0 34 34" aria-hidden="true" focusable="false"><rect width="34" height="34" rx="9"/><path class="a1" d="M9 13h14M19 9l4 4-4 4" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path class="a2" d="M25 21H11M15 25l-4-4 4-4" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const FAVICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34"><rect width="34" height="34" rx="9" fill="#0B0D12"/><path d="M9 13h14M19 9l4 4-4 4" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M25 21H11M15 25l-4-4 4-4" stroke="#C9CED6" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

const CY_CSS = `.cy-mk rect{fill:var(--ink)}.cy-mk .a1{stroke:var(--bg)}.cy-mk .a2{stroke:#8B929C}
.cy-nav{display:flex;gap:16px;margin-left:auto;overflow-x:auto;white-space:nowrap;scrollbar-width:none}.cy-nav::-webkit-scrollbar{display:none}.cy-nav a{color:var(--ink);text-decoration:none;font-weight:600;font-size:.9375rem}.cy-nav a:hover,.cy-nav a[aria-current]{color:var(--acc)}
.cy-taal{display:flex;gap:4px;flex:none}.cy-taal a{font-size:.8125rem;font-weight:600;color:var(--ink);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:3px 8px}.cy-taal a[aria-current]{background:var(--prim);color:var(--on-prim);border-color:var(--prim)}
@media(max-width:760px){.kn-in{flex-wrap:wrap}.cy-nav{order:3;flex-basis:100%;margin-left:0;padding-bottom:2px}.cy-taal{margin-left:auto}}
.kh{border:1px solid var(--line);border-radius:16px;padding:22px;margin:8px 0 0}.kh fieldset{border:0;padding:0;margin:0 0 18px}.kh legend{font-weight:600;margin:0 0 10px;padding:0;font-size:18px}.kh .opts{gap:8px}
.kh .pk{display:block;margin:6px 0 0;border-color:var(--ink)}.kh .pk[hidden]{display:none}.kh .pk h3{margin:0 0 8px}.kh .pk ul{margin:0 0 14px;padding-left:20px}.kh .pk li{margin:4px 0}.kh .spec{font-size:16px;color:#6B7280;margin:0 0 12px}
.cy-link{background:none;border:0;color:var(--acc);font:inherit;font-size:16px;cursor:pointer;padding:0;margin-left:14px}
form.cyq label{display:block;font-weight:600;margin:14px 0 6px;font-size:16px}form.cyq textarea{width:100%;min-height:96px}form.cyq input{width:100%}form.cyq .rij{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:560px){form.cyq .rij{grid-template-columns:1fr}}
form.cyq .klein{font-size:15px;color:#6B7280;margin:14px 0}.cy-ok{font-weight:600}.cy-wa{margin-left:14px;font-weight:600}
.cards a.card p,.cards a.card h3{font-weight:400}.cards a.card h3{font-weight:600}.box ul{list-style:none;padding:0}.box li{padding-left:26px;position:relative}.box li::before{content:"+";position:absolute;left:4px;font-weight:700}`;

const SHOP_CSS = `.cy-shop{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0 6px}@media(max-width:820px){.cy-shop{grid-template-columns:repeat(2,minmax(0,1fr))}}
.cy-p{display:flex;flex-direction:column;gap:6px;border:1px solid var(--line);border-radius:14px;padding:12px;text-decoration:none!important;color:var(--ink)!important;background:var(--bg);min-width:0}.cy-p:hover{border-color:var(--acc)}
.cy-p img{width:100%;aspect-ratio:1;object-fit:contain;background:#fff;border-radius:10px}.cy-p .cy-bl{aspect-ratio:1;height:auto}.cy-p b{font-size:18px}.cy-p .n{font-size:16px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cy-p .l{font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;color:#6B7280}.cy-p .k{margin-top:auto;font-weight:600;font-size:15px;color:var(--acc)!important}.cy-p .n,.cy-p b{color:var(--ink)}.cy-p.eigen{border-color:var(--ink)}.cy-noot{font-size:14px;color:#6B7280;margin:4px 0 0}
.cards a.card .cy-bl{margin:0 0 10px;border-radius:12px}`;
let CSS_CACHE = null;
async function css() {
  if (CSS_CACHE) return CSS_CACHE;
  const g = await import('../api/gids.js');
  CSS_CACHE = lookNieuw(g.ACC) + g.CSS_KADOLY + g.CSS_GIDS + CY_CSS + BEELD_CSS + SHOP_CSS;
  return CSS_CACHE;
}

const lijst = taal => ONDERWERPEN.filter(o => o.slug[taal]);

function kopbalk(taal, actief, alt) {
  const nav = lijst(taal).map(o => `<a href="${pad(taal, o.slug[taal])}"${o.id === actief ? ' aria-current="page"' : ''}>${esc(o.t[taal].kort)}</a>`).join('');
  const tl = TALEN.map(t => alt[t] ? `<a href="${alt[t]}" hreflang="${t}"${t === taal ? ' aria-current="true"' : ''}>${t.toUpperCase()}</a>` : '').join('');
  return `<header class="kn"><div class="kn-in"><a class="kn-merk" href="${pad(taal, '')}" aria-label="Curady">${MERK(30)}<span>Curady</span></a><nav class="cy-nav" aria-label="${esc(UI[taal].alle)}">${nav}</nav><div class="cy-taal">${tl}</div></div></header>`;
}

async function pagina({ taal, titel, desc, eigen, alt, actief, ld, body }) {
  const hl = Object.entries(alt).map(([t, u]) => `<link rel="alternate" hreflang="${LOC[t]}" href="${BASE}${u}">`).join('') + (alt.en ? `<link rel="alternate" hreflang="x-default" href="${BASE}${alt.en}">` : '');
  return `<!doctype html><html lang="${taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titel)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${BASE}${eigen}">${hl}
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"><meta property="og:title" content="${esc(titel)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${BASE}${eigen}"><meta property="og:type" content="article"><meta property="og:site_name" content="Curady"><meta property="og:locale" content="${LOC[taal].replace('-', '_')}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="alternate" type="text/plain" href="/llms.txt"><meta name="theme-color" content="#ffffff">
<style>${await css()}</style>${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}
<script src="https://whichtobuy.best/cm.js" data-site="curady" data-modal="geen" async></script></head><body>${kopbalk(taal, actief, alt)}<main class="wrap">${body}</main>
<footer class="kv"><div class="kv-in"><div class="kv-merk">${MERK(24)}Curady</div><p style="margin:10px 0 0">${esc(UI[taal].voet)} ${esc(UI[taal].bij)} ${BIJGEWERKT}.</p></div></footer></body></html>`;
}

function offerteForm(taal, actief) {
  const u = UI[taal];
  const opties = lijst(taal).map(o => `<option value="${o.id}"${o.id === actief ? ' selected' : ''}>${esc(o.t[taal].kort)}</option>`).join('');
  const sel = (n, l) => `<select id="q-${n}" name="${n}"><option value="">${esc(u.nietZeker)}</option>${l.map(x => `<option>${esc(x)}</option>`).join('')}</select>`;
  const onderwerp = actief ? ONDERWERPEN.find(o => o.id === actief).t[taal].kort.toLowerCase() : 'Curady';
  return `<section class="q" id="offerte"><h2>${esc(u.offerte)}</h2><p>${esc(u.offerteTekst)}</p>
<form class="cyq" id="cyq" method="post" action="/quote"><input type="hidden" name="taal" value="${taal}">
<label for="q-p">${esc(u.product)}</label><select id="q-p" name="product">${opties}</select>
<label for="q-w">${esc(u.wens)}</label><textarea id="q-w" name="wens" maxlength="1200" placeholder="${esc(u.wensPh)}"></textarea>
<div class="rij"><div><label for="q-budget">${esc(u.budget)}</label>${sel('budget', u.budgetOpt)}</div><div><label for="q-wanneer">${esc(u.wanneer)}</label>${sel('wanneer', u.wanneerOpt)}</div></div>
<div class="rij"><div><label for="q-n">${esc(u.naam)}</label><input id="q-n" name="naam" maxlength="100" autocomplete="name"></div><div><label for="q-l">${esc(u.land)}</label><input id="q-l" name="land" maxlength="60" placeholder="${esc(u.landPh)}" autocomplete="country-name"></div></div>
<label for="q-e">${esc(u.email)}</label><input id="q-e" name="email" type="email" maxlength="160" autocomplete="email" required>
<input type="text" name="web" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
<p class="klein">${esc(u.privacy)}</p><button class="btn knop" type="submit">${esc(u.stuur)}</button><a class="cy-wa" href="${WA(taal, onderwerp)}">${esc(u.wa)}</a>
<p class="cy-ok" id="cyok" hidden>${esc(u.dank)}</p></form></section>`;
}

// winkelrij: Curady op maat (eigen tekening) en in NL de modellen die nu bij bol.com te koop zijn (foto, prijs, score), eerlijk gelabeld.
// bol-links via het keuzehulp.best-kanaal met subid curady-<id>, tot curady.com een eigen kanaal (Site-ID) heeft.
const BOL = { sauna: ['barrelsauna', 900], hottub: ['hottub houtgestookt', 600], massage: ['massagestoel', 400], infrarood: ['infraroodsauna', 500], ijsbad: ['ijsbad', 80] };
const SHOP_T = {
  en: { eigen: 'Curady made to fit', prijs: 'Price on request', sub: 'Quote within one working day', knop: 'Choose and get a quote', nu: 'For sale today', noot: 'Prices of today at bol.com. If you buy there, Curady earns a small commission.', bol: 'View at bol.com' },
  nl: { eigen: 'Curady op maat', prijs: 'Prijs op aanvraag', sub: 'Offerte binnen één werkdag', knop: 'Kies en vraag je prijs', nu: 'Nu te koop', noot: 'Prijzen van vandaag bij bol.com. Koop je daar, dan krijgt Curady een kleine vergoeding.', bol: 'Bekijk bij bol.com' },
  de: { eigen: 'Curady nach Maß', prijs: 'Preis auf Anfrage', sub: 'Angebot innerhalb eines Werktags', knop: 'Wählen und Preis anfragen', nu: 'Heute erhältlich', noot: '', bol: '' },
};
const bolUrl = (u, id) => 'https://partner.bol.com/click/click?p=1&t=url&s=1547300&f=TXL&url=' + encodeURIComponent(u) + '&subid=' + encodeURIComponent('curady-' + id) + '&name=curady';
async function winkelRij(o, taal) {
  const st = SHOP_T[taal], t = o.t[taal];
  const eigen = `<a class="cy-p cybtn eigen" href="#kies">${BEELD[o.id] ? BEELD[o.id](t.kort) : ''}<span class="l">${esc(st.eigen)}</span><span class="n">${esc(t.kort)}</span><b>${esc(st.prijs)}</b><span class="cy-noot" style="margin:0">${esc(st.sub)}</span><span class="k">${esc(st.knop)}</span></a>`;
  let bol = [];
  if (taal === 'nl' && BOL[o.id]) {
    try {
      const [term, min] = BOL[o.id];
      const r = await Promise.race([searchCached(term, { size: 24 }), new Promise(res => setTimeout(() => res(null), 2500))]);
      const zien = new Set();
      bol = ((r && r.products) || []).filter(p => p.image && p.price >= min).sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)).filter(p => { const k = String(p.title).toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').slice(0, 4).join(' '); if (zien.has(k) || zien.has(p.image)) return false; zien.add(k); zien.add(p.image); return true; }).slice(0, 3);
    } catch (e) {}
  }
  const kaarten = bol.map(p => `<a class="cy-p cybtn" href="${esc(bolUrl(p.url, o.id))}" rel="sponsored nofollow noopener" target="_blank"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" width="200" height="200"><span class="l">bol.com</span><span class="n">${esc(p.title)}</span><b>€ ${Number(p.price).toFixed(2).replace('.', ',')}</b>${p.rating ? `<span class="cy-noot" style="margin:0">★ ${Number(p.rating).toFixed(1).replace('.', ',')}</span>` : ''}<span class="k">${esc(st.bol)}</span></a>`).join('');
  return `<section id="winkel"><h2>${esc(st.nu)}</h2><div class="cy-shop">${eigen}${kaarten}</div>${bol.length && st.noot ? `<p class="cy-noot">${esc(st.noot)}</p>` : ''}</section>`;
}

// keuzehulp: knoppen per vraag; met alle antwoorden verschijnt het advies met een knop die de offerte invult
function keuzehulp(o, taal) {
  const t = o.t[taal], u = UI[taal];
  const fs = t.vragen.map((v, i) => `<fieldset><legend>${i + 1}. ${esc(v.v)}</legend><div class="opts">${v.o.map(([k, l]) => `<button type="button" class="opt" data-v="${i}" data-k="${esc(k)}">${esc(l)}</button>`).join('')}</div></fieldset>`).join('');
  const data = t.vragen.map(v => Object.fromEntries(v.o.map(([k, , zin, spec]) => [k, [zin, spec]])));
  return `<section class="kh" id="kies" data-id="${o.id}"><h2 style="margin-top:0">${esc(u.kies)}</h2>${fs}
<div class="pk" id="uit" hidden><h3>${esc(u.uitkomst)}</h3><ul id="uitl"></ul><p class="spec" id="uits"></p><a class="btn knop" href="#offerte" id="uitc">${esc(u.vraagPrijs)}</a><button type="button" class="cy-link" id="uitr">${esc(u.opnieuw)}</button></div>
<noscript><p>${esc(u.offerteTekst)}</p></noscript></section>
<script>(function(){var D=${JSON.stringify(data).replace(/</g, '\\u003c')},N=${t.vragen.length},id=${JSON.stringify(o.id)},taal=${JSON.stringify(taal)},A={},start=0;
function t(e){try{navigator.sendBeacon('/t',new Blob([JSON.stringify({s:id,e:e,taal:taal})],{type:'text/plain'}))}catch(x){}}
var k=document.getElementById('kies'),u=document.getElementById('uit');
k.addEventListener('click',function(e){var b=e.target.closest('.opt');if(!b)return;var v=b.getAttribute('data-v');A[v]=b.getAttribute('data-k');[].forEach.call(k.querySelectorAll('.opt[data-v="'+v+'"]'),function(x){x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});if(!start){start=1;t('start')}
if(Object.keys(A).length===N){var l='',s=[];for(var i=0;i<N;i++){var r=D[i][A[i]];l+='<li>'+r[0].replace(/[<>&]/g,'')+'</li>';s.push(r[1])}document.getElementById('uitl').innerHTML=l;document.getElementById('uits').textContent=s.join(', ');u.hidden=false;u.dataset.spec=s.join(', ');if(!u.dataset.t){u.dataset.t=1;t('klaar')}u.scrollIntoView({behavior:'smooth',block:'nearest'})}});
document.getElementById('uitc').addEventListener('click',function(){var w=document.getElementById('q-w'),p=document.getElementById('q-p');if(w&&!w.value)w.value=u.dataset.spec||'';if(p)p.value=id;t('cta');setTimeout(function(){var e=document.getElementById('q-e');e&&e.focus()},400)});
document.getElementById('uitr').addEventListener('click',function(){A={};u.hidden=true;[].forEach.call(k.querySelectorAll('.opt'),function(x){x.classList.remove('on')});k.scrollIntoView({behavior:'smooth'})});})();</script>`;
}

const FORM_JS = taal => `<script>(function(){var f=document.getElementById('cyq');if(!f||!window.fetch)return;f.addEventListener('submit',function(e){e.preventDefault();var d={};new FormData(f).forEach(function(v,k){d[k]=v});d.pad=location.pathname;d.ref=document.referrer||'';d.qs=location.search||'';var b=f.querySelector('button');b.disabled=true;fetch('/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok){[].forEach.call(f.children,function(x){if(x.id!=='cyok')x.style.display='none'});document.getElementById('cyok').hidden=false;try{window.cmEvent&&window.cmEvent('aanvraag')}catch(e){}}else{b.disabled=false;alert(${JSON.stringify(UI[taal].fout)})}}).catch(function(){b.disabled=false})})})()</script>`;

const ORG = { '@type': 'Organization', '@id': BASE + '/#org', name: 'Curady', url: BASE, logo: BASE + '/favicon.svg', telephone: '+31655395630', parentOrganization: { '@type': 'Organization', name: 'Kadoly', url: 'https://kadoly.com' }, address: { '@type': 'PostalAddress', streetAddress: 'Albert Plesmanplein 20', postalCode: '2805 AB', addressLocality: 'Gouda', addressCountry: 'NL' } };

async function home(taal, q) {
  const u = UI[taal];
  const alt = Object.fromEntries(TALEN.map(t => [t, pad(t, '')]));
  const kaarten = lijst(taal).map(o => `<a class="card" href="${pad(taal, o.slug[taal])}">${BEELD[o.id] ? BEELD[o.id](o.t[taal].kort) : ''}<span class="cat">${esc(u.gids)}</span><h3>${esc(o.t[taal].kort)}</h3><p>${esc(o.t[taal].desc)}</p></a>`).join('');
  const dank = q.get('quote') === 'ok' ? `<p class="answer"><strong>${esc(u.dank)}</strong></p>` : '';
  return pagina({ taal, titel: 'Curady | ' + u.home, desc: u.homeDesc, eigen: pad(taal, ''), alt, actief: '', ld: { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebSite', name: 'Curady', url: BASE, inLanguage: taal }] },
    body: `${dank}<p class="kicker">Curady</p><h1>${esc(u.homeH1)}</h1><p class="lead">${esc(u.homeLede)}</p><div class="cards">${kaarten}</div>
<div class="box"><h2>${esc(u.waarom)}</h2><ul>${u.waaromL.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>${offerteForm(taal, '')}${FORM_JS(taal)}` });
}

async function gids(o, taal) {
  const t = o.t[taal], u = UI[taal];
  const alt = Object.fromEntries(talenVan(o).map(x => [x, pad(x, o.slug[x])]));
  const eigen = pad(taal, o.slug[taal]);
  const delen = t.delen.map(([h, x]) => `<h2>${esc(h)}</h2><p>${esc(x)}</p>`).join('');
  const faq = t.faq.map(([v, a]) => `<details class="faq"><summary>${esc(v)}</summary><div class="a"><p>${esc(a)}</p></div></details>`).join('');
  const ander = lijst(taal).filter(x => x.id !== o.id).map(x => `<a class="card" href="${pad(taal, x.slug[taal])}">${BEELD[x.id] ? BEELD[x.id](x.t[taal].kort) : ''}<span class="cat">${esc(u.gids)}</span><h3>${esc(x.t[taal].kort)}</h3></a>`).join('');
  const ld = { '@context': 'https://schema.org', '@graph': [ORG,
    { '@type': 'Article', headline: t.titel, description: t.desc, inLanguage: taal, dateModified: BIJGEWERKT, author: { '@id': BASE + '/#org' }, publisher: { '@id': BASE + '/#org' }, mainEntityOfPage: BASE + eigen },
    { '@type': 'FAQPage', mainEntity: t.faq.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Curady', item: BASE + pad(taal, '') }, { '@type': 'ListItem', position: 2, name: t.kort, item: BASE + eigen }] }] };
  return pagina({ taal, titel: t.titel + ' | Curady', desc: t.desc, eigen, alt, actief: o.id, ld,
    body: `<nav class="crumbs" aria-label="breadcrumb"><a href="${pad(taal, '')}">Curady</a> / ${esc(t.kort)}</nav><p class="kicker">${esc(u.gids)} · ${esc(t.kort)}</p><h1>${esc(t.titel)}</h1>
<div class="answer"><p>${esc(t.lede)}</p></div>${await winkelRij(o, taal)}${keuzehulp(o, taal)}${delen}<h2>${esc(u.vragen)}</h2>${faq}${offerteForm(taal, o.id)}${FORM_JS(taal)}
<h2>${esc(u.alle)}</h2><div class="cards">${ander}</div>` });
}

function sitemap() {
  const urls = [];
  const blok = (alt, eigen) => `<url><loc>${BASE}${eigen}</loc><lastmod>${BIJGEWERKT}</lastmod>${Object.entries(alt).map(([t, u]) => `<xhtml:link rel="alternate" hreflang="${LOC[t]}" href="${BASE}${u}"/>`).join('')}</url>`;
  const altH = Object.fromEntries(TALEN.map(t => [t, pad(t, '')]));
  for (const t of TALEN) urls.push(blok(altH, pad(t, '')));
  for (const o of ONDERWERPEN) { const alt = Object.fromEntries(talenVan(o).map(x => [x, pad(x, o.slug[x])])); for (const t of talenVan(o)) urls.push(blok(alt, pad(t, o.slug[t]))); }
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`;
}
function llms() {
  const r = [`# Curady\n\nCurady (curady.com) helps people in the Netherlands, Belgium and Germany choose and buy outdoor saunas, hot tubs, massage chairs, infrared saunas, ice baths and kamado grills, with honest advice and a personal quote delivered to the door. Part of Kadoly, run by AdsFair B.V., Gouda, the Netherlands. Contact: +31 6 55395630 (phone or WhatsApp).\n`];
  for (const t of TALEN) { r.push(`\n## ${UI[t].alle} (${UI[t].taal})\n`); for (const o of lijst(t)) r.push(`- [${o.t[t].titel}](${BASE}${pad(t, o.slug[t])}): ${o.t[t].lede}`); }
  return r.join('\n') + '\n';
}

async function leesBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let s = typeof req.body === 'string' ? req.body : '';
  if (!s) { try { for await (const c of req) { s += c; if (s.length > 20000) break; } } catch (e) {} }
  try { return JSON.parse(s); } catch (e) { return Object.fromEntries(new URLSearchParams(s)); }
}
const kap = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const IDS = ONDERWERPEN.map(o => o.id);

async function aanvraag(req, res) {
  const b = await leesBody(req);
  const email = kap(b.email, 160).toLowerCase();
  const taal = TALEN.includes(b.taal) ? b.taal : 'en';
  const isForm = !String(req.headers['content-type'] || '').includes('json');
  const klaar = ok => isForm ? res.status(303).setHeader('location', pad(taal, '') + '?quote=' + (ok ? 'ok' : 'fout')).end() : res.status(ok ? 200 : 400).json({ ok });
  if (kap(b.web, 50)) return klaar(true); // honingpot: bots krijgen een ok maar worden niet bewaard
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return klaar(false);
  const product = IDS.includes(b.product) ? b.product : 'onbekend';
  const r = { t: new Date().toISOString(), product, taal, wens: kap(b.wens, 1200), budget: kap(b.budget, 40), wanneer: kap(b.wanneer, 40), land: kap(b.land, 60), naam: kap(b.naam, 100), email, pad: kap(b.pad, 80), ref: kap(b.ref, 200), qs: kap(b.qs, 200) };
  await kv.raw(['LPUSH', 'cy:aanvragen', JSON.stringify(r)]);
  await kv.raw(['LTRIM', 'cy:aanvragen', '0', '1999']);
  await kv.incrMany([['cy:n:' + product, 1], ['cy:n:totaal', 1], ['cy:n:taal:' + taal, 1]]);
  return klaar(true);
}

async function tik(req, res) {
  const b = await leesBody(req);
  if (IDS.includes(b.s) && ['start', 'klaar', 'cta'].includes(b.e)) { try { await kv.incrMany([['cy:k:' + b.s + ':' + b.e, 1], ['cy:k:' + b.s + ':' + b.e + ':' + (TALEN.includes(b.taal) ? b.taal : 'en'), 1]]); } catch (e) {} }
  return res.status(204).end();
}

async function stand(q, host, res) {
  const sl = ['totaal', ...IDS, ...TALEN.map(t => 'taal:' + t)];
  const tel = await kv.mget(...sl.map(s => 'cy:n:' + s));
  const kh = await kv.mget(...IDS.flatMap(id => ['start', 'klaar', 'cta'].map(e => 'cy:k:' + id + ':' + e)));
  const uit = { bijgewerkt: new Date().toISOString(), aanvragen: {}, keuzehulp: {} };
  sl.forEach((s, i) => { uit.aanvragen[s] = Number(tel[i]) || 0; });
  IDS.forEach((id, i) => { uit.keuzehulp[id] = { start: Number(kh[i * 3]) || 0, klaar: Number(kh[i * 3 + 1]) || 0, naarOfferte: Number(kh[i * 3 + 2]) || 0 }; });
  if (q.get('vol') === '1' && /\.vercel\.app$/i.test(host)) {
    uit.laatste = ((await kv.raw(['LRANGE', 'cy:aanvragen', '0', '99'])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
  }
  res.setHeader('cache-control', 'no-store');
  return res.status(200).json(uit);
}

export async function cyOp(op, { req, res, q, host }) {
  if (op === 'cyrobots') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(`User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`); }
  if (op === 'cysitemap') { res.setHeader('content-type', 'application/xml; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600'); return res.status(200).send(sitemap()); }
  if (op === 'cyllms') { res.setHeader('content-type', 'text/plain; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600'); return res.status(200).send(llms()); }
  if (op === 'cyfav') { res.setHeader('content-type', 'image/svg+xml'); res.setHeader('cache-control', 'public, max-age=86400'); return res.status(200).send(FAVICON); }
  if (op === 'cyquote') { if (req.method !== 'POST') return res.status(405).send('POST only'); return aanvraag(req, res); }
  if (op === 'cytik') { if (req.method !== 'POST') return res.status(405).send('POST only'); return tik(req, res); }
  if (op === 'cystand') return stand(q, host, res);
  if (op === 'cykey') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(INDEXNOW); }
  if (op === 'cyping') { // alle pagina's aan IndexNow melden (Bing, Yandex, Seznam); alleen op de beschermde host
    if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
    const urlList = sitemap().match(/<loc>[^<]+<\/loc>/g).map(x => x.slice(5, -6));
    const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: 'curady.com', key: INDEXNOW, keyLocation: BASE + '/' + INDEXNOW + '.txt', urlList }) }).catch(e => ({ status: 0, statusText: String(e) }));
    return res.status(200).json({ status: r.status, urls: urlList.length });
  }
  const taal = TALEN.includes(q.get('t')) ? q.get('t') : 'en';
  const s = String(q.get('s') || '');
  if (op === 'cygids' && taal === 'en' && OUD[s]) { res.setHeader('location', pad('en', OUD[s])); return res.status(301).end(); }
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=300');
  if (op === 'cygids') {
    const o = vindOnderwerp(taal, s);
    if (!o) return res.status(404).send(await pagina({ taal, titel: 'Curady', desc: 'Curady', eigen: pad(taal, ''), alt: { [taal]: pad(taal, '') }, actief: '', body: `<h1>404</h1><p><a href="${pad(taal, '')}">Curady</a></p>` }));
    return res.status(200).send(await gids(o, taal));
  }
  return res.status(200).send(await home(taal, q));
}
