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

let CAT = null, CAT_AT = 0;
async function catalogus() {
  if (CAT && Date.now() - CAT_AT < 300000) return CAT;
  let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {}
  const m = {}; for (const i of ((c && c.items) || [])) m[i.id] = i;
  CAT = m; CAT_AT = Date.now(); return m;
}
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
const leverDatum = lt => { const d = new Date(); let n = Math.max(1, N(lt) || 5); while (n > 0) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) n--; } return d; };
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
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)}</title><meta name="description" content="${esc(besch)}"><link rel="canonical" href="${HOST}${pad}"><meta property="og:title" content="${esc(titel)}"><meta property="og:description" content="${esc(besch)}"><meta property="og:url" content="${HOST}${pad}"><meta property="og:type" content="article"><meta property="og:locale" content="nl_NL"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23B4235A'/%3E%3Ctext x='16' y='22' font-size='17' text-anchor='middle' fill='white' font-family='Arial' font-weight='700'%3EK%3C/text%3E%3C/svg%3E">${extra || ''}<style>${look(ACC)}${CSS_EXTRA}</style></head><body><main class="wrap">`;
}
const VOET = g => `<hr style="border:0;border-top:1px solid var(--line);margin:34px 0 14px"><p class="klein">Een gids van <a href="https://kadoly.com">Kadoly</a>, de webshop met spullen en cadeaus van onafhankelijke makers. Prijzen en levertijden komen elke paar minuten uit de winkel zelf${g ? ', laatst inhoudelijk bijgewerkt op ' + esc(g.bijgewerkt) : ''}. Wij verdienen aan een bestelling in onze eigen winkel; daarom staat bij elk product ook waarvoor het niet geschikt is.</p><p class="klein"><a href="/">Alle gidsen</a></p></main></body></html>`;

function productKaart(x, slug, blok) {
  const dat = leverDatum(x.lt);
  return `<article class="kaart"><a href="/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(slug)}&b=${blok}" rel="nofollow">${x.img ? `<img src="${esc(x.img)}" width="112" height="112" alt="${esc(x.naam)}" loading="lazy" decoding="async">` : ''}</a><div>
<div class="lab2">${esc(x.label)}</div><h3>${esc(x.naam)}</h3><div><span class="prijs">${euro(x.prijs + x.verzending)}</span> <span class="klein">inclusief ${euro(x.verzending)} verzending · ${x.lt ? 'rond ' + esc(nlDatum(dat)) + ' in huis als je vandaag bestelt' : 'levertijd bij het product'}</span></div>
<p class="let">${esc(x.waarom)}</p>${x.beperking ? `<p class="let"><b>Let op:</b> ${esc(x.beperking)}</p>` : ''}<a class="knop" href="/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(slug)}&b=${blok}" rel="nofollow">Bekijk bij Kadoly</a></div></article>`;
}

async function gidsPagina(g) {
  const cat = await catalogus();
  const items = g.keuze.map(k => { const i = cat[k.pid]; if (!i || i.vr === false) return null; return Object.assign({}, k, { naam: k.naam || i.t, prijs: N(i.p), verzending: i.fs ? 0 : N(i.vk), lt: N(i.lt) || 0, img: i.img || '', merk: i.b || '' }); }).filter(Boolean);
  const perPid = {}; items.forEach(x => { perPid[x.pid] = x; });
  const rijen = (g.tabel || []).map(r => { const x = perPid[r.pid]; return `<tr><td>${esc(r.situatie)}</td><td>${esc(r.advies)}${x ? `<br><a href="/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(g.slug)}&b=tabel" rel="nofollow">${esc(x.naam)}</a>, ${euro(x.prijs + x.verzending)}` : ''}</td></tr>`; }).join('');
  const checkData = JSON.stringify({ vragen: g.check ? g.check.vragen : [], regels: g.check ? g.check.regels : [], producten: Object.fromEntries(items.map(x => [x.pid, { naam: x.naam, prijs: euro(x.prijs + x.verzending), lt: x.lt }])), slug: g.slug }).replace(/</g, '\\u003c');
  const check = g.check ? `<section class="check" id="check"><h2 style="margin:0 0 6px">Past het bij jou? Snelle check</h2><p class="klein" style="margin:0 0 12px">Twee of drie vragen. De uitkomst kan ook zijn dat je het beter niet koopt.</p><form id="gf">${g.check.vragen.map(v => `<fieldset><legend>${esc(v.vraag)}</legend>${v.opties.map(o => `<label><input type="radio" name="${esc(v.k)}" value="${esc(o[0])}"> ${esc(o[1])}</label>`).join('')}</fieldset>`).join('')}<button class="knop" type="submit" style="border:0;cursor:pointer">Laat zien wat past</button></form><div class="uitkomst" id="gu" aria-live="polite"></div></section>
<script>(function(){var D=${checkData};var f=document.getElementById('gf'),u=document.getElementById('gu');f.addEventListener('submit',function(e){e.preventDefault();var a={};D.vragen.forEach(function(v){var x=f.querySelector('input[name="'+v.k+'"]:checked');if(x)a[v.k]=x.value;});var r=null;for(var i=0;i<D.regels.length;i++){var R=D.regels[i],ok=true;for(var k in R.als){if(R.als[k].indexOf(a[k])<0){ok=false;break;}}if(ok){r=R;break;}}if(!r){u.innerHTML='Kies bij elke vraag een antwoord.';return;}var h='<p><b>'+r.kop+'</b></p><p>'+r.tekst+'</p>';if(r.pid&&D.producten[r.pid]){var p=D.producten[r.pid];h+='<p><a class="knop" href="/naar/'+encodeURIComponent(r.pid)+'?g='+encodeURIComponent(D.slug)+'&b=check" rel="nofollow">'+p.naam+', '+p.prijs+'</a></p>';}u.innerHTML=h;try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(D.slug)+'&s=check-'+(r.id||'x'));}catch(x){}});})();</script>` : '';
  const delen = 'https://wa.me/?text=' + encodeURIComponent(g.h1 + ' ' + HOST + '/' + g.slug);
  return kop(g.titel, g.beschrijving, '/' + g.slug, `<script type="application/ld+json">${ldJson(g, items)}</script>`) +
    `<p class="kicker">${esc(g.kicker)}</p><h1>${esc(g.h1)}</h1><div class="answer"><p><strong>In het kort.</strong> ${esc(g.kort)}</p></div>
<h2>Onze keuze</h2>${items.map(x => productKaart(x, g.slug, 'keuze')).join('')}
${rijen ? `<h2>${esc(g.tabelKop || 'Welke past bij jouw situatie?')}</h2><div class="tw"><table><tr><th>Jouw situatie</th><th>Ons advies</th></tr>${rijen}</table></div>` : ''}
${check}
${(g.uitleg || []).map(b => `<h2>${esc(b.kop)}</h2>${b.alineas.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
<h2>Zo kozen we</h2><p>${esc(g.zoKozenWe)}</p>
<h2>Zekerheid bij Kadoly</h2><p>Je betaalt met iDEAL of een andere bekende betaalmethode en je hebt 14 dagen om van gedachten te veranderen. Twijfel je over de maat of de levertijd, kijk dan op de productpagina: daar staat per product wat er in de doos zit en wanneer het verstuurd wordt.</p>
${g.faq && g.faq.length ? `<h2>Veelgestelde vragen</h2>${g.faq.map(f => `<details><summary>${esc(f.v)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : ''}
<p style="margin:22px 0 0"><a class="knop" href="${esc(delen)}" rel="nofollow noopener">Deel deze gids via WhatsApp</a></p>` + VOET(g);
}

function home() {
  const lijst = GIDS_IDS.map(id => GIDSEN[id]).map(g => `<article class="kaart" style="grid-template-columns:1fr"><div><div class="lab2">${esc(g.kicker)}</div><h3><a href="/${esc(g.slug)}">${esc(g.h1)}</a></h3><p class="let">${esc(g.beschrijving)}</p></div></article>`).join('');
  return kop('Kadoly gids: eerlijk kiezen voor cadeaus en wonen', 'Keuzehulpen van Kadoly: welk cadeau of woonproduct past bij jou, met prijs en levertijd van vandaag en waarvoor het niet geschikt is.', '/', '') +
    `<p class="kicker">Kadoly gids</p><h1>Eerlijk kiezen, ook als het antwoord niet kopen is</h1><div class="answer"><p><strong>Wat dit is.</strong> Korte gidsen van Kadoly bij de producten uit onze winkel: wat past bij welke situatie, wat het vandaag kost inclusief verzending, wanneer het in huis is en waarvoor je het beter niet kunt kopen.</p></div>${lijst}` + VOET(null);
}

function sitemap() {
  const u = [{ loc: HOST + '/', lm: GIDS_IDS.map(id => GIDSEN[id].bijgewerkt).sort().pop() }].concat(GIDS_IDS.map(id => ({ loc: HOST + '/' + id, lm: GIDSEN[id].bijgewerkt })));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + u.map(x => `<url><loc>${x.loc}</loc><lastmod>${x.lm}</lastmod></url>`).join('') + '</urlset>';
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
  try {
    if (op === 'robots') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('User-agent: *\nAllow: /\nDisallow: /naar/\n\nSitemap: ' + HOST + '/sitemap.xml\n'); }
    if (op === 'sitemap') { res.setHeader('content-type', 'application/xml; charset=utf-8'); return res.status(200).send(sitemap()); }
    if (op === 'llms') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(await llms()); }
    if (op === 'tel') { const g = String(q.get('g') || ''); const s = String(q.get('s') || '').replace(/[^a-z0-9-]/g, '').slice(0, 30); if (GIDSEN[g] && s && !isBot(ua)) await tel(g, s); return res.status(204).end(); }
    if (op === 'feiten') { if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden'); const pids = String(q.get('p') || '').split(',').filter(x => /^oc_\d+$/.test(x)).slice(0, 8); const uit = []; for (const p of pids) { try { uit.push(await feiten(p)); } catch (e) { uit.push({ pid: p, fout: String(e.message || e) }); } } return res.status(200).json({ ok: true, feiten: uit }); }
    if (op === 'stand') { const dagen = Math.min(28, Math.max(1, N(q.get('dagen')) || 7)); const uit = {}; for (let i = 0; i < dagen; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); try { const a = await kv.raw(['HGETALL', 'gk:d:' + d]); const o = {}; if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) o[a[j]] = N(a[j + 1]); uit[d] = o; } catch (e) {} } return res.status(200).json({ ok: true, gidsen: GIDS_IDS, perDag: uit }); }
    res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    const slug = String(q.get('slug') || '');
    if (!slug) return res.status(200).send(home());
    const g = GIDSEN[slug]; if (!g) { res.setHeader('cache-control', 'no-store'); return res.status(404).send(kop('Niet gevonden', 'Deze gids bestaat niet.', '/', '') + '<h1>Deze gids bestaat (nog) niet</h1><p><a href="/">Naar alle gidsen</a></p>' + VOET(null)); }
    if (!isBot(ua)) await tel(slug, 'v');
    return res.status(200).send(await gidsPagina(g));
  } catch (e) { res.setHeader('cache-control', 'no-store'); return res.status(500).send('Er ging iets mis: ' + esc(String(e && e.message || e).slice(0, 120))); }
}
