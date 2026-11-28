// Gidspagina in het design van kadoly.com (28 nov 2026, Henkjan: "Ik wil dat die gidsen helemaal in kadoly design komen en de stap naar koop
// veel kleiner wordt dus gewoon meteen afrekenen blok je laten zien EN ik wil dat de gids 10 x beter wordt iemand werklijk te informeren zodat
// max vertrouwen of vibe om te kopen ontstaat .").
// Eén pagina: de kop van de shop, het antwoord op de vraag, de eerste keus als koopblok zoals op kadoly.com (prijs inclusief verzending,
// bezorgdag, Nu kopen gaat meteen naar de kassa via Clickmind /naar/<pid>?a=k), keuze per situatie, elk product met koopblok, specificaties en
// eerlijke beperking, vergelijking, uitleg, vragen, alles van de soort, kopen bij Kadoly, bronnen. Onderaan op de telefoon een vaste koopbalk.
// Producten die Kadoly (nog) niet heeft: tijdelijk via bol.com (partnerlink, Site-ID van Yoors/Kadoly, subid gk_<slug>-<n>), duidelijk gemeld.
// Kleuren en vormen uit de productpagina van kadoly.com (28 nov 2026 uitgelezen): inkt #0B0D12, lijn #E6E8EB, knop #111827 rond 12 px,
// koopblok rond 16 px met schaduw, paarse band #2B124C, Inter. Geen grijze tekst.

const GK = 'https://gids.kadoly.com';
const WA = '31655395630';
export const BOL_SITE_KADOLY = '1229920'; // Site-ID van Yoors, nu Kadoly (lib/overdracht-bol.js)
export const bolLink = (url, slug, n) => 'https://partner.bol.com/click/click?p=2&t=url&s=' + BOL_SITE_KADOLY + '&f=TXL&subid=' + encodeURIComponent('gk_' + slug + '-' + n) + '&url=' + encodeURIComponent(url);

const MERK = s => `<svg width="${s}" height="${s}" viewBox="0 0 34 34" aria-hidden="true" focusable="false"><rect width="34" height="34" rx="9" fill="#1D9BF0"/><path d="M9 13h14M19 9l4 4-4 4" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M25 21H11M15 25l-4-4 4-4" stroke="#D6ECFC" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const V = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#12B76A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export const SHOP_CSS = `:root{--ink:#0B0D12;--line:#E6E8EB;--knop:#111827;--band:#2B124C;--groen:#12B76A;--blauw:#1D9BF0}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:#fff;color:var(--ink);font:400 16px/1.55 Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
a{color:var(--ink)}img{max-width:100%;display:block}h1,h2,h3{margin:0;line-height:1.2;font-weight:700}
.band{background:var(--band);color:#fff;font-size:13px;font-weight:700;text-align:center;padding:9px 16px}
.nav{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid var(--line)}
.nav-in{max-width:1080px;margin:0 auto;display:flex;align-items:center;gap:10px;padding:12px 16px}
.logo{display:flex;align-items:center;gap:8px;text-decoration:none;font-weight:700;font-size:18px}
.gids{font-size:13px;font-weight:700;border:1.5px solid var(--ink);border-radius:999px;padding:2px 10px}
.nav-shop{margin-left:auto;font-weight:700;text-decoration:none;border:1.5px solid var(--knop);border-radius:12px;padding:8px 14px;font-size:16px}
.wrap{max-width:1080px;margin:0 auto;padding:0 16px 120px}
.crumb{font-size:13px;padding:14px 0 0}.crumb a{text-decoration:none}
.top{padding:10px 0 6px}.top h1{font-size:30px;letter-spacing:-.01em;max-width:24ch}
.by{font-size:13px;margin:10px 0 0}
.lead{font-size:18px;line-height:1.55;margin:18px 0 0;max-width:68ch}
.l{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin:0 0 6px}
.kb{display:grid;grid-template-columns:1fr;gap:0;border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 28px -10px rgba(16,24,40,.22),0 2px 6px rgba(16,24,40,.06);overflow:hidden;background:#fff;margin:22px 0}
.kb-img{background:#fff;aspect-ratio:1/1;overflow:hidden;border-bottom:1px solid var(--line)}.kb-img img{width:100%;height:100%;object-fit:cover}
.kb-in{padding:20px}
.kb-merk{font-size:13px;font-weight:700;margin:0 0 4px}
.kb-t{font-size:22px}
.kb-p{font-size:30px;font-weight:700;margin:14px 0 0;line-height:1}.kb-p small{display:block;font-size:13px;font-weight:400;margin-top:6px}
.kb-dot{list-style:none;padding:0;margin:14px 0 0;font-size:16px}.kb-dot li{display:flex;align-items:center;gap:8px;margin:2px 0}.kb-dot li:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--groen);flex:none}
.kb-buy{display:flex;align-items:center;justify-content:center;gap:8px;height:52px;border-radius:12px;background:var(--knop);color:#fff;font-weight:700;font-size:16px;text-decoration:none;margin:18px 0 0}
.kb-alt{display:flex;align-items:center;justify-content:center;height:48px;border-radius:12px;border:1.5px solid var(--knop);font-weight:700;text-decoration:none;margin:10px 0 0}
.kb-tr{list-style:none;padding:14px 0 0;margin:16px 0 0;border-top:1px solid var(--line);font-size:13px}.kb-tr li{display:flex;gap:8px;align-items:center;margin:4px 0}
.kb-bol{font-size:13px;margin:10px 0 0}
.eerste{font-size:13px;font-weight:700;display:inline-block;background:var(--ink);color:#fff;border-radius:999px;padding:4px 12px;margin:0 0 10px}
.wv h3{font-size:16px;margin:18px 0 4px}.wv p{margin:0}
.spec{margin:16px 0 0;border:1px solid var(--line);border-radius:12px;overflow:hidden}.spec div{display:grid;grid-template-columns:40% 60%;border-top:1px solid var(--line)}.spec div:first-child{border-top:0}.spec dt,.spec dd{margin:0;padding:10px 12px;font-size:16px}.spec dt{font-weight:700}
.let{margin:14px 0 0;border-left:3px solid var(--ink);padding:2px 0 2px 12px}
h2{font-size:22px;margin:40px 0 12px}
.kort{list-style:none;padding:0;margin:0}.kort li{display:flex;gap:10px;align-items:flex-start;margin:8px 0}.kort svg{flex:none;margin-top:4px}
.sit{border:1px solid var(--line);border-radius:16px;overflow:hidden}.sit a{display:grid;grid-template-columns:64px 1fr;gap:12px;align-items:center;padding:12px;border-top:1px solid var(--line);text-decoration:none}.sit a:first-child{border-top:0}
.sit img{width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid var(--line)}.sit b{display:block}.sit span{display:block;font-size:13px}
.num{font-size:13px;font-weight:700}
.vg{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:16px;overflow:hidden;font-size:16px}.vg th,.vg td{text-align:left;padding:12px;border-top:1px solid var(--line);vertical-align:top}.vg tr:first-child th{border-top:0;font-size:13px}.vg td:last-child,.vg th:last-child{white-space:nowrap;font-weight:700}
.ui p{max-width:68ch}
.faq{border-top:1px solid var(--line)}.faq:last-of-type{border-bottom:1px solid var(--line)}.faq summary{cursor:pointer;font-weight:700;padding:16px 0;list-style:none;display:flex;justify-content:space-between;gap:12px}.faq summary::after{content:"+";font-weight:700}.faq[open] summary::after{content:"−"}.faq p{margin:0 0 16px;max-width:68ch}
.alle{display:grid;grid-template-columns:1fr 1fr;gap:12px}.alle a{display:block;border:1px solid var(--line);border-radius:14px;overflow:hidden;text-decoration:none}.alle img{width:100%;aspect-ratio:1/1;object-fit:cover;border-bottom:1px solid var(--line)}.alle span{display:block;padding:8px 10px 0;font-size:13px;font-weight:700;line-height:1.35}.alle b{display:block;padding:4px 10px 10px}
.meer{display:inline-flex;margin:14px 0 0;font-weight:700}
.kk{border:1px solid var(--line);border-radius:16px;padding:18px}.kk dl{margin:0}.kk div{display:grid;grid-template-columns:34% 66%;gap:8px;padding:10px 0;border-top:1px solid var(--line)}.kk div:first-child{border-top:0;padding-top:0}.kk dt{font-weight:700}.kk dd{margin:0}
.wa{display:flex;align-items:center;justify-content:center;height:48px;border-radius:12px;background:#25D366;color:#0B0D12;font-weight:700;text-decoration:none;margin:14px 0 0}
.bron{font-size:13px}.bron li{margin:6px 0}
.sb{position:fixed;left:0;right:0;bottom:0;z-index:9;background:#fff;border-top:1px solid var(--line);box-shadow:0 -8px 24px -12px rgba(16,24,40,.25);padding:10px 16px calc(10px + env(safe-area-inset-bottom))}
.sb-in{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:48px 1fr auto;gap:12px;align-items:center}.sb img{width:48px;height:48px;object-fit:cover;border-radius:10px;border:1px solid var(--line)}.sb b{display:block;font-size:13px;line-height:1.3}.sb span{font-weight:700}
.sb .kb-buy{margin:0;height:46px;padding:0 18px}
.voet{border-top:1px solid var(--line);margin-top:48px;padding:24px 16px 120px;font-size:13px}.voet div{max-width:1080px;margin:0 auto}.voet a{margin-right:12px}
.vb{background:#fff;border:2px solid var(--ink);border-radius:12px;padding:10px 14px;margin:14px 0 0;font-size:13px}
@media(min-width:820px){.top h1{font-size:40px}.kb{grid-template-columns:1fr 1fr}.kb-img{border-bottom:0;border-right:1px solid var(--line)}.kb-in{padding:28px}.alle{grid-template-columns:repeat(4,1fr)}.sb{display:none}.wrap{padding-bottom:40px}.voet{padding-bottom:24px}}`;

// items: { soort:'k'|'b', id, naam, label, waarom, beperking, specs, prijs, img, merk, lt, rating, delivery, url }
export function shopGidsHtml(g, ctx) {
  const { esc, euro, leverDatum, nlDatum, voorbeeld } = ctx;
  const items = ctx.items || [];
  const slug = g.slug;
  const koop = (x, plek) => x.soort === 'b' ? bolLink(x.url, slug, plek) : `${GK}/naar/${encodeURIComponent(x.id)}?g=${encodeURIComponent(slug)}&b=${plek}&a=k`;
  const details = (x, plek) => `${GK}/naar/${encodeURIComponent(x.id)}?g=${encodeURIComponent(slug)}&b=${plek}&a=p`;
  const rel = x => x.soort === 'b' ? 'sponsored nofollow noopener' : 'nofollow';
  const doel = x => x.soort === 'b' ? ' target="_blank"' : '';
  const dag = x => x.soort === 'b' ? (x.delivery || '') : (x.lt ? 'In huis ' + nlDatum(leverDatum(x.lt)) : '');
  const koopblok = (x, plek, eerste) => `<article class="kb" id="p-${esc(x.id)}">
<div class="kb-img">${x.img ? `<img src="${esc(x.img)}" alt="${esc(x.naam)}" loading="${eerste ? 'eager' : 'lazy'}" width="600" height="600">` : ''}</div>
<div class="kb-in">${eerste ? '<span class="eerste">Onze eerste keus</span>' : `<p class="l">${esc(x.label)}</p>`}
<p class="kb-merk">${x.soort === 'b' ? 'Bij bol.com · Kadoly verkoopt dit nog niet' : esc(x.merk || 'Kadoly')}</p>
<h3 class="kb-t">${esc(x.naam)}</h3>
<p class="kb-p">${euro(x.prijs)}<small>${x.soort === 'b' ? 'prijs bij bol.com vandaag' : 'inclusief verzending en btw'}</small></p>
<ul class="kb-dot">${dag(x) ? `<li>${esc(dag(x))}</li>` : ''}${x.soort === 'b' ? (x.rating > 0 ? `<li>${String(x.rating).replace('.', ',')} van 5 sterren bij bol.com</li>` : '') : '<li>Op voorraad</li>'}</ul>
<a class="kb-buy" href="${esc(koop(x, plek))}" rel="${rel(x)}"${doel(x)}>${x.soort === 'b' ? 'Bekijk bij bol.com' : 'Nu kopen'} <span aria-hidden="true">→</span></a>
${x.soort === 'b' ? '<p class="kb-bol">Je koopt bij bol.com. Koop je via deze link, dan krijgt Kadoly een kleine vergoeding.</p>' : `<a class="kb-alt" href="${esc(details(x, plek))}" rel="nofollow">Alle foto’s en details</a>
<ul class="kb-tr"><li>${V}Veilig betalen: iDEAL · PayPal · Apple Pay · Klarna</li><li>${V}14 dagen bedenktijd</li><li>${V}Gekeurd door WebwinkelKeur</li></ul>`}
<div class="wv"><h3>Waarom deze</h3><p>${esc(x.waarom)}</p></div>
${(x.specs || []).length ? `<dl class="spec">${x.specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
${x.beperking ? `<p class="let"><b>Goed om te weten.</b> ${esc(x.beperking)}</p>` : ''}
</div></article>`;
  const hero = items[0];
  const perId = Object.fromEntries(items.map(x => [x.id, x]));
  const sit = (g.tabel || []).map(r => ({ r, x: perId[r.pid || r.bid] })).filter(o => o.x);
  const metSpecs = items.filter(x => (x.specs || []).length >= 2);
  const kortLijst = (g.inHetKort || []).length ? g.inHetKort : String(g.kort || '').split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9])/).slice(0, 3);
  const alle = ctx.alle || [];
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: g.h1, description: g.beschrijving, dateModified: g.bijgewerkt, author: { '@type': 'Organization', name: 'Redactie Kadoly' }, publisher: { '@type': 'Organization', name: 'Kadoly', url: 'https://kadoly.com' } },
    { '@type': 'ItemList', name: g.h1, itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: x.naam, image: x.img || undefined, offers: { '@type': 'Offer', price: x.prijs, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: x.soort === 'b' ? 'bol.com' : 'Kadoly' } } } })) },
    { '@type': 'FAQPage', mainEntity: (g.faq || []).map(f => ({ '@type': 'Question', name: f.v, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ] };
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(g.titel)}</title><meta name="description" content="${esc(g.beschrijving)}">${voorbeeld ? '<meta name="robots" content="noindex,nofollow">' : `<link rel="canonical" href="${GK}/${esc(slug)}"><meta name="robots" content="index,follow,max-image-preview:large">`}<meta property="og:title" content="${esc(g.titel)}"><meta property="og:description" content="${esc(g.beschrijving)}">${hero && hero.img ? `<meta property="og:image" content="${esc(hero.img)}">` : ''}<link rel="icon" type="image/svg+xml" href="https://cdn.kadoly.com/icon/shop/shop-mark.svg?v=1"><meta name="theme-color" content="#2B124C"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet"><style>${SHOP_CSS}</style><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script></head><body>
<div class="band">Prijzen inclusief verzending en btw · 14 dagen bedenktijd · Gekeurd door WebwinkelKeur</div>
<header class="nav"><div class="nav-in"><a class="logo" href="https://kadoly.com/?utm_source=kadoly-gids&amp;utm_medium=gids&amp;utm_campaign=${esc(slug)}">${MERK(30)}Kadoly</a><span class="gids">Gids</span><a class="nav-shop" href="https://kadoly.com/shop?utm_source=kadoly-gids&amp;utm_medium=gids&amp;utm_campaign=${esc(slug)}">Shop</a></div></header>
<main class="wrap">${voorbeeld ? `<p class="vb"><b>Voorbeeld, nog niet live.</b> ${esc(voorbeeld)} <a href="/api/gids?op=zoekgids">Terug naar het voorstel</a></p>` : ''}
<nav class="crumb" aria-label="Kruimelpad"><a href="${GK}/">Kadoly gids</a> › ${esc(g.kicker ? g.kicker.replace(/^Keuzehulp · /, '') : g.h1)}</nav>
<div class="top"><h1>${esc(g.h1)}</h1><p class="by">Door de redactie van Kadoly · bijgewerkt ${esc(ctx.datum || g.bijgewerkt)} · prijzen van vandaag</p>
<p class="lead">${esc(g.llmOpening || g.kort)}</p></div>
${hero ? koopblok(hero, 'eerste', true) : ''}
<h2>In het kort</h2><ul class="kort">${kortLijst.map(z => `<li>${V}<span>${esc(z)}</span></li>`).join('')}</ul>
${sit.length ? `<h2>${esc(g.tabelKop || 'Welke past bij jou?')}</h2><div class="sit">${sit.map(({ r, x }) => `<a href="#p-${esc(x.id)}">${x.img ? `<img src="${esc(x.img)}" alt="" loading="lazy" width="64" height="64">` : '<span></span>'}<div><b>${esc(r.situatie)}</b><span>${esc(r.advies)} ${esc(x.naam)}, ${euro(x.prijs)}</span></div></a>`).join('')}</div>` : ''}
${items.length > 1 ? `<h2>Alle keuzes, met wat de maker zegt</h2>${items.slice(1).map((x, i) => koopblok(x, 'keuze' + (i + 2), false)).join('')}` : ''}
${metSpecs.length >= 3 ? `<h2>Naast elkaar</h2><table class="vg"><tr><th>Product</th><th>Belangrijkste</th><th>Prijs</th></tr>${metSpecs.map(x => `<tr><td><a href="#p-${esc(x.id)}">${esc(x.naam)}</a></td><td>${esc(x.specs.slice(0, 2).map(s => s[1]).join(', '))}</td><td>${euro(x.prijs)}</td></tr>`).join('')}</table>` : ''}
<div class="ui">${(g.uitleg || []).map(b => `<h2>${esc(b.kop)}</h2>${b.alineas.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}</div>
${(g.faq || []).length ? `<h2>Veelgestelde vragen</h2>${g.faq.map((f, i) => `<details class="faq"${i === 0 ? ' open' : ''}><summary>${esc(f.v)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : ''}
${alle.length ? `<h2>${esc(ctx.alleKop || 'Meer bij Kadoly')} (${alle.length})</h2><div class="alle">${alle.slice(0, 12).map(p => `<a href="${GK}/naar/${encodeURIComponent(p.pid)}?g=${encodeURIComponent(slug)}&amp;b=alle&amp;a=k" rel="nofollow">${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" width="300" height="300">` : ''}<span>${esc(p.naam)}</span><b>${euro(p.prijs)}</b></a>`).join('')}</div>${alle.length > 12 ? `<a class="meer" href="${GK}/zoek?q=${encodeURIComponent(ctx.alleZoek || g.h1.split(':')[0])}">Bekijk alle ${alle.length} →</a>` : ''}` : ''}
<h2>Kopen bij Kadoly</h2><div class="kk"><dl>
<div><dt>Verkoper</dt><dd>Kadoly, ADSFAIR B.V., Albert Plesmanplein 20, Gouda · KVK 60126035</dd></div>
<div><dt>Prijs</dt><dd>Inclusief verzending en btw, met track &amp; trace</dd></div>
<div><dt>Betalen</dt><dd>iDEAL, PayPal, Apple Pay of Klarna</dd></div>
<div><dt>Bedenktijd</dt><dd>14 dagen. <a href="https://kadoly.com/returns">Zo werkt retourneren</a></dd></div>
<div><dt>Keurmerk</dt><dd>Gekeurd door WebwinkelKeur</dd></div>
<div><dt>Vragen</dt><dd>Henkjan van Kadoly antwoordt zelf, ook op WhatsApp</dd></div>
</dl><a class="wa" href="https://wa.me/${WA}" rel="nofollow noopener" target="_blank">App Henkjan van Kadoly</a></div>
<h2>Zo kozen we</h2><p>${esc(g.zoKozenWe || '')}</p>
${ctx.bronnenHtml || ''}
</main>
<footer class="voet"><div>© ${new Date().getFullYear()} Kadoly · ADSFAIR B.V. · KVK 60126035 · <a href="https://kadoly.com/shipping">Verzending</a><a href="https://kadoly.com/returns">Retour</a><a href="https://kadoly.com/privacy">Privacy</a></div></footer>
${hero ? `<div class="sb"><div class="sb-in">${hero.img ? `<img src="${esc(hero.img)}" alt="" width="48" height="48">` : '<span></span>'}<div><b>${esc(hero.naam)}</b><span>${euro(hero.prijs)}</span></div><a class="kb-buy" href="${esc(koop(hero, 'balk'))}" rel="${rel(hero)}"${doel(hero)}>${hero.soort === 'b' ? 'Naar bol.com' : 'Nu kopen'}</a></div></div>` : ''}
${voorbeeld ? '' : `<script>(function(){var g=${JSON.stringify(slug)};function t(s){try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(g)+'&s='+s)}catch(e){}}t('v');document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(!a)return;var h=a.getAttribute('href')||'';if(/partner\\.bol\\.com/.test(h))t('bol');else if(/a=k/.test(h))t('koop');else if(/a=p/.test(h))t('details')},true)})();</script><script src="https://go.kadoly.com/cm.js" data-site="kadolygids" data-modal="kadolygids" data-pt="gids" async></script>`}
</body></html>`;
}
