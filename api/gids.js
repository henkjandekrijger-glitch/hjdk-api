// gids.kadoly.com: keuzehulpen van Kadoly zelf, voor zoekers in Google en AI-assistenten (Henkjan 30 okt 2026: "We gaan Kadoly.help maken
// en daar keuzehulpen maken voor alle content van Kadoly ... de long game om te verkopen via SEO en LLM ... Dit is ons LAB ook voor Kadoly";
// op de vraag waar: "gids.kadoly.com"). Plan en werkwijze: OVERDRACHT-KADOLY-GIDS.md.
// Regels: eerst de lijst met prijs en levertijd van vandaag, de keuzehulp als knop eronder; per product een eerlijke beperking; afraden alleen
// op harde feiten (maat, onderdelen, levertijd tegenover een deadline), want we hebben de producten niet zelf vastgehad (Henkjan: nog niet
// zelf bestellen). Alles wat AI moet kunnen citeren staat in de HTML. Geen gedachtestreepjes. Prijzen live uit de shopcatalogus.
// Kliks naar de shop gaan via /naar/<pid> (api/shop.js op=gidsuit): Clickmind meet de keten tot betaald per gids.
import { kv } from '../lib/db.js';
import { look } from '../lib/look.js';
import { GIDSEN, GIDS_IDS } from '../lib/gidsen-kadoly.js';

const HOST = 'https://gids.kadoly.com';
const ACC = { acc: '#B4235A', acc2: '#FCEEF3', accD: '#F49AB9', acc2D: '#2A1520' };
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = v => '€' + N(v).toFixed(2).replace('.', ',');
const isBot = ua => /bot|crawl|spider|slurp|headless|preview|facebookexternalhit|python|curl|wget|monitor|lighthouse|pingdom/i.test(String(ua || ''));
const DAG = () => new Date().toISOString().slice(0, 10);
const INDEXNOW_KEY = '9eed19b173ae0446f4f8e9d13ef50c6d'; // IndexNow-sleutel van gids.kadoly.com (staat ook als bestand op /9eed19b173ae0446f4f8e9d13ef50c6d.txt)
const AIBOT = /(GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|Claude-User|PerplexityBot|Perplexity-User|Google-Extended|Googlebot|bingbot|Applebot|CCBot|meta-externalagent|Bytespider|DuckAssistBot|YandexBot)/i;
// lerende volgorde (30 okt, Henkjan: "maak wat je neerzet helemaal lerend"): kliks per product (gk:p:<gids>, via /naar) tegen weergaven (_v, via het baken)
async function geleerd(slug) { try { const a = await kv.raw(['HGETALL', 'gk:p:' + slug]); const o = {}; if (Array.isArray(a)) for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = N(a[i + 1]); return o; } catch (e) { return {}; } }
async function telBot(ua, waar) { const m = String(ua || '').match(AIBOT); if (!m) return; try { const k = 'gk:d:' + DAG(); await kv.raw(['HINCRBY', k, '_bot|' + m[1].toLowerCase() + '|' + waar, '1']); await kv.raw(['EXPIRE', k, String(60 * 86400)]); } catch (e) {} }

let CAT = null, CAT_AT = 0, META = '', META_AT = 0; // META: Search Console-verificatie (gk:gscmeta, gezet door /api/gsc?op=verifieer&methode=META)
async function catalogus() {
  if (CAT && Date.now() - CAT_AT < 300000) return CAT;
  let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {}
  const m = {}; for (const i of ((c && c.items) || [])) m[i.id] = i;
  CAT = m; CAT_AT = Date.now(); return m;
}
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
const leverDatum = lt => { const d = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' }) + 'T12:00:00Z'); let n = Math.max(1, N(lt) || 5); while (n > 0) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) n--; } return d; };
const nlDatum = d => d.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'long', day: 'numeric', month: 'long' });

// teller per gids per dag in één hash (klein: de database is krap)
async function tel(slug, soort) { try { const k = 'gk:d:' + DAG(); await kv.raw(['HINCRBY', k, slug + '|' + soort, '1']); await kv.raw(['EXPIRE', k, String(60 * 86400)]); } catch (e) {} }

function ldJson(g, items) {
  const org = { '@type': 'Organization', '@id': HOST + '/#org', name: 'Kadoly', url: 'https://kadoly.com' };
  const lijst = { '@type': 'ItemList', name: g.h1, itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: x.naam, image: x.img || undefined, brand: x.merk ? { '@type': 'Brand', name: x.merk } : undefined, description: x.waarom, offers: { '@type': 'Offer', price: N(x.prijs).toFixed(2), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: 'https://kadoly.com/product/' + x.pid, shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: N(x.verzending).toFixed(2), currency: 'EUR' }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NL' } } } } })) };
  const faq = g.faq && g.faq.length ? { '@type': 'FAQPage', mainEntity: g.faq.map(f => ({ '@type': 'Question', name: f.v, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
  const kruim = { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kadoly gids', item: HOST + '/' }, { '@type': 'ListItem', position: 2, name: g.h1, item: HOST + '/' + g.slug }] };
  const art = { '@type': 'Article', headline: g.h1, dateModified: g.bijgewerkt, author: { '@id': HOST + '/#org' }, publisher: { '@id': HOST + '/#org' }, mainEntityOfPage: HOST + '/' + g.slug };
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, art, kruim, lijst, faq].filter(Boolean) }).replace(/</g, '\\u003c');
}

const CSS_EXTRA = `.wrap{max-width:46rem}.kaart{display:grid;grid-template-columns:112px 1fr;gap:14px;border:1px solid var(--line);border-radius:14px;padding:14px;margin:0 0 12px;background:var(--bg)}
.kaart img{width:112px;height:112px;object-fit:cover;border-radius:10px;background:var(--acc-2)}.kaart h3{margin:2px 0 4px;font-size:1.0625rem;line-height:1.3}.lab2{font-size:.75rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--acc)}
.prijs{font-weight:750}.klein{font-size:.875rem;color:var(--ink-2)}.let{font-size:.875rem;margin:6px 0 0}.knop{display:inline-block;margin:10px 0 0;background:var(--acc);color:var(--on-acc,#fff);padding:9px 14px;border-radius:10px;font-weight:650;text-decoration:none}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px;margin:0 0 14px}table{border-collapse:collapse;width:100%;font-size:.9375rem}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}tr:last-child td{border-bottom:0}
.check{border:1px solid var(--acc);border-radius:14px;padding:16px;margin:0 0 18px;background:var(--acc-2)}.check fieldset{border:0;padding:0;margin:0 0 12px}.check legend{font-weight:650;margin:0 0 6px}.check label{display:block;margin:0 0 6px}.uitkomst{margin:10px 0 0;font-size:1rem}
details{border-bottom:1px solid var(--line);padding:10px 0}summary{cursor:pointer;font-weight:650}@media (max-width:520px){.kaart{grid-template-columns:84px 1fr}.kaart img{width:84px;height:84px}}`;

function kop(titel, besch, pad, extra) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)}</title><meta name="description" content="${esc(besch)}"><link rel="canonical" href="${HOST}${pad}">${META ? `<meta name="google-site-verification" content="${esc(META)}">` : ''}<meta property="og:title" content="${esc(titel)}"><meta property="og:description" content="${esc(besch)}"><meta property="og:url" content="${HOST}${pad}"><meta property="og:type" content="article"><meta property="og:locale" content="nl_NL"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23B4235A'/%3E%3Ctext x='16' y='22' font-size='17' text-anchor='middle' fill='white' font-family='Arial' font-weight='700'%3EK%3C/text%3E%3C/svg%3E">${extra || ''}<style>${look(ACC)}${CSS_EXTRA}</style></head><body><main class="wrap">`;
}
const VOET = g => `<hr style="border:0;border-top:1px solid var(--line);margin:34px 0 14px"><p class="klein">Een gids van <a href="https://kadoly.com">Kadoly</a>, de webshop met spullen en cadeaus van onafhankelijke makers. Prijzen en levertijden komen elke paar minuten uit de winkel zelf${g ? ', laatst inhoudelijk bijgewerkt op ' + esc(g.bijgewerkt) : ''}. Wij verdienen aan een bestelling in onze eigen winkel; daarom staat bij elk product ook waarvoor het niet geschikt is.</p><p class="klein"><a href="/">Alle gidsen</a></p></main></body></html>`;

function productKaart(x, slug, blok, eerste) {
  const dat = leverDatum(x.lt);
  return `<article class="kaart"><a href="/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(slug)}&b=${blok}" rel="nofollow">${x.img ? `<img src="${esc(x.img)}" width="112" height="112" alt="${esc(x.naam)}" ${eerste ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : ''}</a><div>
<div class="lab2">${esc(x.label)}${x.meest ? ' · meest gekozen door lezers' : ''}</div><h3>${esc(x.naam)}</h3><div><span class="prijs">${euro(x.prijs + x.verzending)}</span> <span class="klein">inclusief ${euro(x.verzending)} verzending · ${x.lt ? 'rond ' + esc(nlDatum(dat)) + ' in huis als je vandaag bestelt' : 'levertijd bij het product'}</span></div>
<p class="let">${esc(x.waarom)}</p>${x.beperking ? `<p class="let"><b>Let op:</b> ${esc(x.beperking)}</p>` : ''}<a class="knop" href="/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(slug)}&b=${blok}" rel="nofollow">Bekijk bij Kadoly</a></div></article>`;
}

// baken: telt echte lezers in de browser (zodat de pagina aan de rand van Vercel bewaard kan worden): weergave met herkomst, 15 en 60 seconden, scrollen
function baken(slug) {
  return `<script>(function(){var g=${JSON.stringify(slug)},s={};function t(x){if(s[x])return;s[x]=1;try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(g)+'&s='+x)}catch(e){}}var r=document.referrer||'',b=/google\./.test(r)?'google':/bing\./.test(r)?'bing':/chatgpt|openai/.test(r)?'chatgpt':/perplexity/.test(r)?'perplexity':/copilot|edgeservices/.test(r)?'copilot':/gemini\.google/.test(r)?'gemini':/claude\.ai/.test(r)?'claude':/duckduckgo/.test(r)?'duckduckgo':/kadoly\.com/.test(r)?'kadoly':r?'overig':'direct';t('v-'+b);setTimeout(function(){if(!document.hidden)t('t15')},15000);setTimeout(function(){if(!document.hidden)t('t60')},60000);addEventListener('scroll',function(){var h=document.documentElement,p=(h.scrollTop+innerHeight)/h.scrollHeight;if(p>.5)t('s50');if(p>.9)t('s90')},{passive:true});})();</script>`;
}
async function gidsPagina(g) {
  const cat = await catalogus();
  const items = g.keuze.map(k => { const i = cat[k.pid]; if (!i || i.vr === false) return null; return Object.assign({}, k, { naam: k.naam || i.t, prijs: N(i.p), verzending: i.fs ? 0 : N(i.vk), lt: N(i.lt) || 0, img: i.img || '', merk: i.b || '' }); }).filter(Boolean);
  const perPid = {}; items.forEach(x => { perPid[x.pid] = x; });
  // volgorde leert van de lezers: na 60 weergaven telt de klikkans per product (met voorkennis voor de redactievolgorde), daarvoor de redactievolgorde
  const L = await geleerd(g.slug); const vw = N(L._v);
  if (vw >= 60) { items.forEach((x, i) => { x._s = (N(L[x.pid]) + Math.max(0.2, 1.5 - i * 0.2)) / (vw + 30); }); items.sort((a, b) => b._s - a._s); }
  const top = items.reduce((m, x) => (N(L[x.pid]) > N(L[m && m.pid])) ? x : m, null); if (top && N(L[top.pid]) >= 10) top.meest = true;
  const rijen = (g.tabel || []).map(r => { const x = perPid[r.pid]; return `<tr><td>${esc(r.situatie)}</td><td>${esc(r.advies)}${x ? `<br><a href="/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(g.slug)}&b=tabel" rel="nofollow">${esc(x.naam)}</a>, ${euro(x.prijs + x.verzending)}` : ''}</td></tr>`; }).join('');
  const checkData = JSON.stringify({ vragen: g.check ? g.check.vragen : [], regels: g.check ? g.check.regels : [], producten: Object.fromEntries(items.map(x => [x.pid, { naam: x.naam, prijs: euro(x.prijs + x.verzending), lt: x.lt }])), slug: g.slug }).replace(/</g, '\\u003c');
  const check = g.check ? `<section class="check" id="check"><h2 style="margin:0 0 6px">Past het bij jou? Snelle check</h2><p class="klein" style="margin:0 0 12px">Twee of drie vragen. De uitkomst kan ook zijn dat je het beter niet koopt.</p><form id="gf">${g.check.vragen.map(v => `<fieldset><legend>${esc(v.vraag)}</legend>${v.opties.map(o => `<label><input type="radio" name="${esc(v.k)}" value="${esc(o[0])}"> ${esc(o[1])}</label>`).join('')}</fieldset>`).join('')}<button class="knop" type="submit" style="border:0;cursor:pointer">Laat zien wat past</button></form><div class="uitkomst" id="gu" aria-live="polite"></div></section>
<script>(function(){var D=${checkData};var f=document.getElementById('gf'),u=document.getElementById('gu');f.addEventListener('submit',function(e){e.preventDefault();var a={};D.vragen.forEach(function(v){var x=f.querySelector('input[name="'+v.k+'"]:checked');if(x)a[v.k]=x.value;});if(Object.keys(a).length<D.vragen.length){u.innerHTML='Kies bij elke vraag een antwoord.';return;}var r=null;for(var i=0;i<D.regels.length;i++){var R=D.regels[i],ok=true;for(var k in R.als){if(R.als[k].indexOf(a[k])<0){ok=false;break;}}if(ok){r=R;break;}}if(!r){u.innerHTML='Kies bij elke vraag een antwoord.';return;}var h='<p><b>'+r.kop+'</b></p><p>'+r.tekst+'</p>';if(r.pid&&D.producten[r.pid]){var p=D.producten[r.pid];h+='<p><a class="knop" href="/naar/'+encodeURIComponent(r.pid)+'?g='+encodeURIComponent(D.slug)+'&b=check" rel="nofollow">'+p.naam+', '+p.prijs+'</a></p>';}u.innerHTML=h;try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(D.slug)+'&s=check-'+(r.id||'x'));}catch(x){}});})();</script>` : '';
  const delen = 'https://wa.me/?text=' + encodeURIComponent(g.h1 + ' ' + HOST + '/' + g.slug);
  const ogImg = items[0] && items[0].img ? `<meta property="og:image" content="${esc(items[0].img)}"><meta name="twitter:card" content="summary_large_image">` : '';
  const andere = GIDS_IDS.filter(id => id !== g.slug).map(id => GIDSEN[id]);
  return kop(g.titel, g.beschrijving, '/' + g.slug, ogImg + `<script type="application/ld+json">${ldJson(g, items)}</script>`) +
    `<nav class="klein" aria-label="Kruimelpad" style="margin:0 0 14px"><a href="/">Kadoly gids</a> › ${esc(g.h1)}</nav><p class="kicker">${esc(g.kicker)}</p><h1>${esc(g.h1)}</h1><div class="answer"><p><strong>In het kort.</strong> ${esc(g.kort)}</p></div>
<h2>Onze keuze</h2>${items.map((x, i) => productKaart(x, g.slug, 'keuze', i === 0)).join('')}
${rijen ? `<h2>${esc(g.tabelKop || 'Welke past bij jouw situatie?')}</h2><div class="tw"><table><tr><th>Jouw situatie</th><th>Ons advies</th></tr>${rijen}</table></div>` : ''}
${check}
${(g.uitleg || []).map(b => `<h2>${esc(b.kop)}</h2>${b.alineas.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
<h2>Zo kozen we</h2><p>${esc(g.zoKozenWe)}</p>
<h2>Zo werkt een bestelling bij Kadoly</h2><ul><li>Je koopt bij Kadoly (ADSFAIR B.V.) en betaalt met iDEAL, PayPal of creditcard.</li><li>Het merk verstuurt het pakket rechtstreeks naar jou, met track en trace. Bij je eerste bestelling is de verzending gratis.</li><li>Valt het tegen? Je hebt 14 dagen na ontvangst: je krijgt een retourlabel en het hele bedrag terug.</li><li>Neem je meer producten, dan krijg je bundelkorting: 5% op 2 tot 20% op 6 producten.</li></ul>
${g.faq && g.faq.length ? `<h2>Veelgestelde vragen</h2>${g.faq.map(f => `<details><summary>${esc(f.v)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : ''}
<p style="margin:22px 0 0"><a class="knop" href="${esc(delen)}" rel="nofollow noopener">Deel deze gids via WhatsApp</a></p>
${andere.length ? `<h2>Andere gidsen van Kadoly</h2><ul>${andere.map(a => `<li><a href="/${esc(a.slug)}">${esc(a.h1)}</a></li>`).join('')}</ul>` : ''}
${baken(g.slug)}` + VOET(g);
}

function home() {
  const lijst = GIDS_IDS.map(id => GIDSEN[id]).map(g => `<article class="kaart" style="grid-template-columns:1fr"><div><div class="lab2">${esc(g.kicker)}</div><h3><a href="/${esc(g.slug)}">${esc(g.h1)}</a></h3><p class="let">${esc(g.beschrijving)}</p></div></article>`).join('');
  return kop('Kadoly gids: eerlijk kiezen voor cadeaus en wonen', 'Keuzehulpen van Kadoly: welk cadeau of woonproduct past bij jou, met prijs en levertijd van vandaag en waarvoor het niet geschikt is.', '/', '') +
    `<p class="kicker">Kadoly gids</p><h1>Eerlijk kiezen, ook als het antwoord niet kopen is</h1><div class="answer"><p><strong>Wat dit is.</strong> Korte gidsen van Kadoly bij de producten uit onze winkel: wat past bij welke situatie, wat het vandaag kost inclusief verzending, wanneer het in huis is en waarvoor je het beter niet kunt kopen.</p></div>${lijst}${baken('_home')}` + VOET(null);
}

async function sitemap() {
  const cat = await catalogus();
  const u = [{ loc: HOST + '/', lm: GIDS_IDS.map(id => GIDSEN[id].bijgewerkt).sort().pop(), img: [] }].concat(GIDS_IDS.map(id => ({ loc: HOST + '/' + id, lm: GIDSEN[id].bijgewerkt, img: GIDSEN[id].keuze.map(k => cat[k.pid]).filter(i => i && i.img && i.vr !== false).map(i => i.img) })));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + u.map(x => `<url><loc>${x.loc}</loc><lastmod>${x.lm}</lastmod>${x.img.map(i => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`).join('')}</url>`).join('') + '</urlset>';
}
// alles wat AI moet kunnen citeren in platte tekst (llms-full.txt)
async function llmsVol() {
  const cat = await catalogus(); let t = '# Kadoly gids: volledige tekst\n\nKeuzehulpen van Kadoly (kadoly.com, ADSFAIR B.V.). Prijzen inclusief verzending en levertijden komen live uit de winkel. Bij elk product staat waarvoor het niet geschikt is.\n\n';
  for (const id of GIDS_IDS) { const g = GIDSEN[id]; t += '## ' + g.h1 + '\n\n' + HOST + '/' + id + '\n\n' + g.kort + '\n\n### Onze keuze\n\n';
    for (const k of g.keuze) { const i = cat[k.pid]; if (!i || i.vr === false) continue; t += '- ' + k.label + ': ' + (k.naam || i.t) + ', ' + euro(thuis(i)) + ' inclusief verzending, https://kadoly.com/product/' + k.pid + '. ' + k.waarom + (k.beperking ? ' Let op: ' + k.beperking : '') + '\n'; }
    if (g.tabel && g.tabel.length) { t += '\n### ' + (g.tabelKop || 'Welke past bij jouw situatie?') + '\n\n'; for (const r of g.tabel) t += '- ' + r.situatie + ': ' + r.advies + '\n'; }
    for (const b of (g.uitleg || [])) t += '\n### ' + b.kop + '\n\n' + b.alineas.join('\n\n') + '\n';
    t += '\n### Zo kozen we\n\n' + g.zoKozenWe + '\n\n### Veelgestelde vragen\n\n' + (g.faq || []).map(f => '**' + f.v + '**\n' + f.a).join('\n\n') + '\n\n'; }
  return t;
}
// zicht.json: het manifest voor de ZICHT-lus (lib/zicht-projecten.js), met eigen meting van lezers en AI-bots
async function zichtJson() {
  const vragen = []; for (const id of GIDS_IDS) { const g = GIDSEN[id]; vragen.push(g.h1.replace(/\?$/, '')); for (const f of (g.faq || [])) vragen.push(f.v); }
  const per = { google: 0, bing: 0, chatgpt: 0, perplexity: 0, copilot: 0, gemini: 0, claude: 0, duckduckgo: 0 }, bots = {};
  for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); try { const a = await kv.raw(['HGETALL', 'gk:d:' + d]); if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) { const f = a[j], n = N(a[j + 1]); const m = f.match(/\|v-([a-z]+)$/); if (m && per[m[1]] !== undefined) per[m[1]] += n; const b = f.match(/^_bot\|([a-z-]+)\|/); if (b) bots[b[1]] = N(bots[b[1]]) + n; } } catch (e) {} }
  const zoek = per.google + per.bing + per.duckduckgo, ai = per.chatgpt + per.perplexity + per.copilot + per.gemini + per.claude;
  return { zicht: 1, site: { vragen: vragen.slice(0, 30), merk: ['Kadoly', 'kadoly.com', 'gids.kadoly.com', 'Kadoly gids'], taal: 'nl', land: 'NL', repo: 'henkjandekrijger-glitch/hjdk-api' }, toegepast: [{ les: 'antwoord-bovenaan', dag: '2026-10-30', wat: 'kort antwoord bovenaan elke gids' }, { les: 'ssr-gids-inhoud', dag: '2026-10-30', wat: 'alle inhoud in de HTML, ook de check' }, { les: 'beelden-vindbaar', dag: '2026-10-30', wat: 'image:image in de sitemap' }], nvt: [], proeven: [], lessen: [], meting: { bezoek7d: { zoek, ai, perBron: per }, aiBots7d: bots } };
}
async function llms() {
  const cat = await catalogus();
  let t = '# Kadoly gids\n\n> Keuzehulpen van Kadoly (kadoly.com), een Nederlandse webshop met cadeaus en woonspullen van onafhankelijke makers. Per gids: korte keuze, prijs inclusief verzending en levertijd van vandaag, waarvoor een product niet geschikt is, en antwoorden op veelgestelde vragen.\n\n';
  for (const id of GIDS_IDS) { const g = GIDSEN[id]; t += '## ' + g.h1 + '\n\n' + HOST + '/' + id + '\n\n' + g.kort + '\n\n'; for (const k of g.keuze) { const i = cat[k.pid]; if (!i || i.vr === false) continue; t += '- ' + k.label + ': ' + (k.naam || i.t) + ', ' + euro(thuis(i)) + ' inclusief verzending. ' + k.waarom + (k.beperking ? ' Let op: ' + k.beperking : '') + '\n'; } t += '\n'; }
  return t;
}

// productfeiten van kadoly.com voor het schrijven van gidsen (alleen via de beschermde vercel.app-host)
async function feiten(pid) {
  let u = 'https://kadoly.com/product/' + encodeURIComponent(pid) + '?lang=nl', html = '';
  for (let i = 0; i < 4; i++) { const r = await fetch(u, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'accept-language': 'nl-NL,nl;q=0.9' }, signal: AbortSignal.timeout(12000) }); if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { u = new URL(r.headers.get('location'), u).href; continue; } html = await r.text(); break; }
  const ld = []; for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) { try { ld.push(JSON.parse(m[1])); } catch (e) {} }
  const tekst = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const prod = ld.flatMap(x => (x['@graph'] || [x])).find(x => x && /Product/.test(String(x['@type']))) || null;
  const s = tekst.search(/Omschrijving|Beschrijving|Over dit product|Productinformatie/i);
  return { pid, url: u, product: prod ? { naam: prod.name, omschrijving: String(prod.description || '').slice(0, 2500), afbeeldingen: [].concat(prod.image || []).slice(0, 4) } : null, tekst: (s >= 0 ? tekst.slice(s, s + 2500) : tekst.slice(0, 2500)) };
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://gids.kadoly.com'); const q = url.searchParams; const op = q.get('op') || ''; const ua = req.headers['user-agent'] || '';
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0];
  if (Date.now() - META_AT > 300000) { META_AT = Date.now(); try { META = String((await kv.get('gk:gscmeta')) || ''); } catch (e) {} }
  try {
    if (op === 'ixkey') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(INDEXNOW_KEY); }
    if (op === 'llmsfull') { await telBot(ua, 'llmsfull'); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(await llmsVol()); }
    if (op === 'zicht') { res.setHeader('content-type', 'application/json; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=0, s-maxage=3600'); return res.status(200).json(await zichtJson()); }
    if (op === 'indexnow') { // dagelijks (cron): nieuwe en gewijzigde gidsen melden bij Bing en de andere IndexNow-zoekmachines; Bing voedt ook ChatGPT-zoeken en Copilot
      const urls = [HOST + '/'].concat(GIDS_IDS.map(id => HOST + '/' + id)); const stand = GIDS_IDS.map(id => id + '@' + GIDSEN[id].bijgewerkt).join(',');
      let oud = null; try { oud = await kv.get('gk:indexnow'); } catch (e) {} if (oud && oud.stand === stand && q.get('alles') !== '1') return res.status(200).json({ ok: true, niets: true });
      let status = 0; try { const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: 'gids.kadoly.com', key: INDEXNOW_KEY, keyLocation: HOST + '/' + INDEXNOW_KEY + '.txt', urlList: urls }), signal: AbortSignal.timeout(15000) }); status = r.status; } catch (e) {}
      if (status >= 200 && status < 300) { try { await kv.set('gk:indexnow', { at: Date.now(), stand }); } catch (e) {} }
      return res.status(200).json({ ok: status >= 200 && status < 300, status, gemeld: urls.length }); }
    if (op === 'robots') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('User-agent: *\nAllow: /\nDisallow: /naar/\n\n# Voor AI-assistenten: ' + HOST + '/llms.txt en ' + HOST + '/llms-full.txt\nSitemap: ' + HOST + '/sitemap.xml\n'); }
    if (op === 'sitemap') { await telBot(ua, 'sitemap'); res.setHeader('content-type', 'application/xml; charset=utf-8'); return res.status(200).send(await sitemap()); }
    if (op === 'llms') { await telBot(ua, 'llms'); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(await llms()); }
    if (op === 'tel') { const g = String(q.get('g') || ''); const s = String(q.get('s') || '').replace(/[^a-z0-9-]/g, '').slice(0, 30); if ((GIDSEN[g] || g === '_home') && s && !isBot(ua)) { await tel(g, s); if (/^v-/.test(s) && GIDSEN[g]) { try { await kv.raw(['HINCRBY', 'gk:p:' + g, '_v', '1']); await kv.raw(['EXPIRE', 'gk:p:' + g, String(120 * 86400)]); } catch (e) {} } } return res.status(204).end(); }
    if (op === 'feiten') { if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden'); const pids = String(q.get('p') || '').split(',').filter(x => /^oc_\d+$/.test(x)).slice(0, 8); const uit = []; for (const p of pids) { try { uit.push(await feiten(p)); } catch (e) { uit.push({ pid: p, fout: String(e.message || e) }); } } return res.status(200).json({ ok: true, feiten: uit }); }
    if (op === 'pagina') { // een pagina van kadoly.com zoals een NL-telefoon hem krijgt (alleen lezen, beschermde vercel.app-host): voor het kassalek
      if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const pad = String(q.get('u') || '/'); if (!/^\/[\w\/\-?=&.%]*$/.test(pad)) return res.status(400).json({ ok: false });
      let u = 'https://kadoly.com' + pad, r, html = ''; const hops = [];
      for (let i = 0; i < 4; i++) { r = await fetch(u, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'accept-language': 'nl-NL,nl;q=0.9' }, signal: AbortSignal.timeout(12000) }); hops.push(r.status + ' ' + u.replace('https://kadoly.com', '')); if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { u = new URL(r.headers.get('location'), u).href; continue; } html = await r.text(); break; }
      const velden = [...html.matchAll(/<(input|select|textarea|button)\b[^>]*>/gi)].map(m => m[0].replace(/\s+/g, ' ').slice(0, 200)).slice(0, 60);
      const scripts = [...html.matchAll(/<script[^>]*src=["']([^"']+)/gi)].map(m => m[1]).slice(0, 30);
      const formulieren = [...html.matchAll(/<form\b[^>]*>/gi)].map(m => m[0].slice(0, 200));
      const tekst = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      const van = N(q.get('van'));
      return res.status(200).json({ ok: true, hops, status: r && r.status, bytes: html.length, formulieren, velden, scripts, tekst: tekst.slice(van, van + 6000) }); }
    if (op === 'stijl') { // de look van kadoly.com uitlezen (alleen lezen, beschermde vercel.app-host): kleuren, letters, logo, kop en voet, om de gids er gelijk aan te maken
      if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const KOPS = { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'accept-language': 'nl-NL,nl;q=0.9' };
      let u = 'https://kadoly.com' + (String(q.get('u') || '/').replace(/[^\w\/\-?=&.%]/g, '')), html = '';
      for (let i = 0; i < 4; i++) { const r = await fetch(u, { redirect: 'manual', headers: KOPS, signal: AbortSignal.timeout(12000) }); if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { u = new URL(r.headers.get('location'), u).href; continue; } html = await r.text(); break; }
      const css = [...html.matchAll(/<link\b[^>]*rel=["']?[^"'>]*stylesheet[^>]*>/gi)].map(m => (m[0].match(/href=["']([^"']+)/i) || [])[1]).filter(Boolean).map(h => new URL(h, u).href);
      let alle = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
      for (const h of css.slice(0, 8)) { try { const r = await fetch(h, { headers: KOPS, signal: AbortSignal.timeout(10000) }); alle += '\n' + await r.text(); } catch (e) {} }
      const tel2 = (re, f) => { const o = {}; for (const m of alle.matchAll(re)) { const k = f(m); o[k] = (o[k] || 0) + 1; } return Object.entries(o).sort((a, b) => b[1] - a[1]); };
      const vars = [...alle.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => m[1] + ': ' + m[2].trim()).filter((x, i, l) => l.indexOf(x) === i).slice(0, 120);
      const fonts = tel2(/font-family\s*:\s*([^;}]+)/gi, m => m[1].trim()).slice(0, 12);
      const fontface = [...alle.matchAll(/@font-face\s*{[^}]*}/gi)].map(m => m[0].replace(/\s+/g, ' ').slice(0, 300)).slice(0, 10);
      const kleuren = tel2(/#[0-9a-f]{3,8}\b|rgba?\([^)]+\)/gi, m => m[0].toLowerCase()).slice(0, 40);
      const radius = tel2(/border-radius\s*:\s*([^;}]+)/gi, m => m[1].trim()).slice(0, 8);
      const knoppen = [...alle.matchAll(/([^{}]*\b(btn|button)[^{}]*){([^}]*)}/gi)].map(m => (m[1].trim().slice(-80) + ' {' + m[3].trim().slice(0, 260) + '}')).slice(0, 14);
      const kopHtml = (html.match(/<header\b[\s\S]*?<\/header>/i) || [''])[0].replace(/\s+/g, ' ').slice(0, 5000);
      const voetHtml = (html.match(/<footer\b[\s\S]*?<\/footer>/i) || [''])[0].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\s+/g, ' ').slice(0, 5000);
      const logo = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]).filter(t => /logo|kadoly/i.test(t)).slice(0, 4);
      const iconen = [...html.matchAll(/<link\b[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi)].map(m => m[0]).slice(0, 6);
      const theme = (html.match(/<meta\b[^>]*name=["']theme-color["'][^>]*>/i) || [''])[0];
      const bodyKlas = (html.match(/<body\b[^>]*>/i) || [''])[0];
      return res.status(200).json({ ok: true, url: u, css, bytesCss: alle.length, theme, bodyKlas, iconen, logo, fonts, fontface, vars, kleuren, radius, knoppen, kopHtml, voetHtml }); }
    if (op === 'stand') { const dagen = Math.min(28, Math.max(1, N(q.get('dagen')) || 7)); const uit = {}; for (let i = 0; i < dagen; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); try { const a = await kv.raw(['HGETALL', 'gk:d:' + d]); const o = {}; if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) o[a[j]] = N(a[j + 1]); uit[d] = o; } catch (e) {} } const geleerdPer = {}; for (const id of GIDS_IDS) geleerdPer[id] = await geleerd(id); return res.status(200).json({ ok: true, gidsen: GIDS_IDS, perDag: uit, kliksPerProduct: geleerdPer }); }
    res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    const slug = String(q.get('slug') || '');
    if (!slug) return res.status(200).send(home());
    const g = GIDSEN[slug]; if (!g) { res.setHeader('cache-control', 'no-store'); return res.status(404).send(kop('Niet gevonden', 'Deze gids bestaat niet.', '/', '') + '<h1>Deze gids bestaat (nog) niet</h1><p><a href="/">Naar alle gidsen</a></p>' + VOET(null)); }
    await telBot(ua, slug);
    return res.status(200).send(await gidsPagina(g));
  } catch (e) { res.setHeader('cache-control', 'no-store'); return res.status(500).send('Er ging iets mis: ' + esc(String(e && e.message || e).slice(0, 120))); }
}
