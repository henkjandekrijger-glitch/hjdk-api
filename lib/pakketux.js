// Pakketten in de winkel (21 nov 2026, Henkjan: "deze pakketten mogen ook best een plek op de winkel zelf hebben . Geef daar goede Ux voor aan code").
// Wij leveren de HTML (server-side, goed voor Google), de shop (PHP) zet hem op zijn plek: /pakket/<slug>, /pakketten, de homepage,
// de productpagina en de winkelwagen. Zo kunnen wij de UX verbeteren zonder dat de shop opnieuw moet bouwen.
// Regels (beconomics, zie lib/pakket.js): één verhaal per pakket, gratis boven korting, twee budgetten naast elkaar, wat op de foto
// staat maar er niet bij zit staat erbij, een echte deadline uit de levertijd, geen "één keer verzendkosten" (die toont de shop niet).
// Kleuren alleen met contrast 4,5 of meer, nooit grijs (Henkjan). Eén tekstgrootte voor gewone tekst (16), titels groter.
const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = v => '€' + Number(v).toFixed(2).replace('.', ',');
const datumNL = d => new Date(d + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const GROEPEN = [['', 'Alles'], ['haar', 'Voor haar'], ['hem', 'Voor hem'], ['kerst', 'Kerst'], ['wonen', 'Wonen']];
const BUDGET = [[0, 'Elk budget'], [49.95, 'Onder €50'], [74.95, 'Onder €75'], [99.95, 'Onder €100']];
const MOMENTEN = [['12-05', 'Sinterklaas'], ['12-25', 'Kerst']];

// Echte deadline: moment min (levertijd + 3 dagen speling). Alleen als het moment binnen 21 dagen valt en de deadline niet voorbij is.
export function deadline(dag, levertijd) {
  const lt = Number(levertijd) || 5, jaar = dag.slice(0, 4);
  for (const [md, naam] of MOMENTEN) { const m = jaar + '-' + md; const dl = new Date(Date.parse(m) - (lt + 3) * 864e5).toISOString().slice(0, 10); const dagenTot = (Date.parse(m) - Date.parse(dag)) / 864e5; if (dl >= dag && dagenTot <= 21) return { dl, naam, tekst: 'Bestel uiterlijk ' + datumNL(dl) + ', op tijd voor ' + naam }; }
  return null;
}

export const PAKKET_CSS = `.kp{--kp-ink:#0b1620;--kp-blauw:#169def;--kp-zacht:#eaf6fe;--kp-groen:#0a7a3d;--kp-groenbg:#e3f6ea;--kp-let:#8a3500;--kp-letbg:#fff1e0;color:var(--kp-ink);font-size:16px;line-height:1.45}
.kp *{box-sizing:border-box}.kp a{color:inherit}.kp img{display:block;max-width:100%}
.kp-kop{font-size:24px;line-height:1.2;font-weight:800;margin:0 0 4px}.kp-sub{margin:0 0 12px}
.kp-chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0 6px;margin:0 0 10px;scrollbar-width:none}
.kp-chip{flex:0 0 auto;border:2px solid var(--kp-ink);background:#fff;color:var(--kp-ink);border-radius:999px;padding:8px 14px;font-size:15px;font-weight:700;line-height:1;cursor:pointer;font-family:inherit}
.kp-chip[aria-pressed="true"]{background:var(--kp-ink);color:#fff}.kp-chip:focus-visible,.kp-knop:focus-visible,.kp-kaart:focus-visible{outline:3px solid var(--kp-blauw);outline-offset:2px}
.kp-rij{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px}.kp-rij .kp-kaart{flex:0 0 76%;max-width:290px;scroll-snap-align:start}
.kp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}@media(min-width:760px){.kp-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(min-width:1100px){.kp-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.kp-kaart{display:flex;flex-direction:column;gap:6px;border:1px solid var(--kp-ink);border-radius:14px;overflow:hidden;text-decoration:none;background:#fff;padding-bottom:12px;min-width:0}
.kp-moz{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:2px;aspect-ratio:3/2;background:#fff}.kp-moz img{width:100%;height:100%;object-fit:cover}.kp-moz img:first-child{grid-row:span 2}
.kp-moz.kp-2{grid-template-columns:1fr 1fr;grid-template-rows:1fr}.kp-moz.kp-2 img:first-child{grid-row:auto}
.kp-voor{font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:0 12px}.kp-naam{font-size:17px;font-weight:800;line-height:1.25;padding:0 12px;margin:0}
.kp-prijs{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;padding:0 12px}.kp-prijs b{font-size:20px;font-weight:800}.kp-prijs s{font-size:14px;font-weight:600}
.kp-tag{display:inline-block;font-size:12px;font-weight:800;line-height:1;padding:5px 9px;border-radius:999px;background:var(--kp-groenbg);color:var(--kp-groen);margin:0 12px;align-self:flex-start}
.kp-dl{font-size:14px;font-weight:700;background:var(--kp-zacht);border-radius:10px;padding:8px 12px;margin:0 0 12px}
.kp-det{display:grid;gap:14px}@media(min-width:900px){.kp-det{grid-template-columns:1.1fr 1fr;align-items:start;gap:32px}}
.kp-det .kp-moz{aspect-ratio:4/3;border-radius:14px;overflow:hidden;border:1px solid var(--kp-ink)}
.kp-info{display:flex;flex-direction:column;gap:12px}.kp-label{font-size:13px;font-weight:800;background:var(--kp-zacht);padding:5px 10px;border-radius:999px;align-self:flex-start}
.kp-h1{font-size:30px;line-height:1.15;font-weight:800;margin:0}.kp-gratis{background:var(--kp-groenbg);color:var(--kp-groen);font-weight:800;padding:10px 12px;border-radius:10px}
.kp-groot{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.kp-groot b{font-size:32px;font-weight:800}.kp-groot s{font-weight:600}
.kp-knop{display:block;width:100%;text-align:center;background:var(--kp-ink);color:#fff!important;font-size:17px;font-weight:800;padding:16px;border-radius:999px;text-decoration:none;border:0;font-family:inherit;cursor:pointer}
.kp-knop.kp-blauw{background:var(--kp-blauw);color:var(--kp-ink)!important}
.kp-keuze{display:flex;gap:8px;flex-wrap:wrap}.kp-budget{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.kp-budget a{border:2px solid var(--kp-ink);border-radius:12px;padding:10px;text-decoration:none;font-weight:700;font-size:14px;display:flex;flex-direction:column;gap:2px}.kp-budget a[aria-current="page"]{border-color:var(--kp-blauw);background:var(--kp-zacht)}
.kp-regel{display:grid;grid-template-columns:64px 1fr;gap:12px;align-items:center}.kp-regel img{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--kp-ink)}
.kp-regel small{display:block;font-size:14px;font-weight:700}.kp-let{background:var(--kp-letbg);color:var(--kp-let);font-weight:700;font-size:14px;padding:8px 12px;border-radius:10px}
.kp-vink{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-weight:600}.kp-vink li::before{content:"✓";color:var(--kp-groen);font-weight:800;margin-right:8px}
.kp-faq details{border-top:1px solid var(--kp-ink);padding:10px 0}.kp-faq summary{font-weight:800;cursor:pointer}
.kp-balk{position:sticky;bottom:0;background:#fff;border-top:2px solid var(--kp-ink);padding:10px 0;display:flex;gap:12px;align-items:center;z-index:5}.kp-balk b{font-size:20px;font-weight:800;white-space:nowrap}.kp-balk .kp-knop{padding:13px}
@media(min-width:900px){.kp-balk{display:none}}
.kp-blok{border:2px solid var(--kp-blauw);background:var(--kp-zacht);border-radius:14px;padding:14px;display:grid;gap:10px}.kp-duim{display:flex;gap:6px}.kp-duim img{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--kp-ink);background:#fff}
.kp-verborgen{display:none!important}`;

const JS = `<script>(function(){if(window.__kp)return;window.__kp=1;document.addEventListener('click',function(ev){var c=ev.target.closest('[data-kp-f]');if(c){var w=c.closest('[data-kp-wrap]');var t=c.getAttribute('data-kp-f');w.querySelectorAll('[data-kp-f^="'+t.split(':')[0]+':"]').forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false')});var g=(w.querySelector('[data-kp-f^="g:"][aria-pressed="true"]')||{}).getAttribute?w.querySelector('[data-kp-f^="g:"][aria-pressed="true"]').getAttribute('data-kp-f').slice(2):'';var bEl=w.querySelector('[data-kp-f^="b:"][aria-pressed="true"]');var b=bEl?Number(bEl.getAttribute('data-kp-f').slice(2)):0;w.querySelectorAll('[data-kp-kaart]').forEach(function(k){var ok=(!g||k.getAttribute('data-groep')===g)&&(!b||Number(k.getAttribute('data-prijs'))<=b);k.classList.toggle('kp-verborgen',!ok)});return}var o=ev.target.closest('[data-kp-optie]');if(o){var d=o.closest('[data-kp-detail]');d.querySelectorAll('[data-kp-optie]').forEach(function(x){x.setAttribute('aria-pressed',x===o?'true':'false')});var id=o.getAttribute('data-kp-optie');d.querySelectorAll('[data-kp-koop]').forEach(function(a){a.href=a.getAttribute('data-kp-koop')+'?keuze='+encodeURIComponent(id)});var n=d.querySelector('[data-kp-keuzenaam]');if(n)n.textContent=o.textContent}})})();<\/script>`;

const moz = (regels, n) => `<div class="kp-moz${regels.length === 2 ? ' kp-2' : ''}">${regels.slice(0, 3).map((r, i) => `<img src="${e(r.img)}" alt="${e(r.kort)}" loading="${n > 2 ? 'lazy' : 'eager'}" width="400" height="400">`).join('')}</div>`;
const kaart = (p, i) => `<a class="kp-kaart" href="/pakket/${e(p.slug)}" data-kp-kaart data-groep="${e(p.groep)}" data-prijs="${p.totaal}">${moz(p.regels, i)}<span class="kp-voor">${e(p.voor)}</span><h3 class="kp-naam">${e(p.naam)}</h3>${p.gratis ? `<span class="kp-tag">${e(p.gratis.titel)} gratis</span>` : ''}<span class="kp-prijs"><b>${eur(p.totaal)}</b><s>los ${eur(p.losBijOns)}</s></span></a>`;
const chips = (lijst) => { const groepen = GROEPEN.filter(([g]) => !g || lijst.some(p => p.groep === g)); return `<div class="kp-chips" role="group" aria-label="Voor wie">${groepen.map(([g, t], i) => `<button type="button" class="kp-chip" data-kp-f="g:${g}" aria-pressed="${i ? 'false' : 'true'}">${t}</button>`).join('')}</div><div class="kp-chips" role="group" aria-label="Budget">${BUDGET.map(([b, t], i) => `<button type="button" class="kp-chip" data-kp-f="b:${b}" aria-pressed="${i ? 'false' : 'true'}">${t}</button>`).join('')}</div>`; };
const stijl = () => `<style>${PAKKET_CSS}</style>`;

// Homepage: rij kaarten onder het eerste blok.
export function htmlStrip(lijst, dag) {
  if (!lijst.length) return ''; const dl = deadline(dag, Math.max(...lijst.map(p => p.levertijd || 5)));
  return `${stijl()}<section class="kp" data-kp-wrap aria-label="Kant-en-klare cadeaus"><h2 class="kp-kop">Kant-en-klare cadeaus</h2><p class="kp-sub">Sets van één merk die bij elkaar passen, samen voordeliger dan los.</p>${dl ? `<p class="kp-dl">${e(dl.tekst)}</p>` : ''}<div class="kp-chips" role="group" aria-label="Budget">${BUDGET.map(([b, t], i) => `<button type="button" class="kp-chip" data-kp-f="b:${b}" aria-pressed="${i ? 'false' : 'true'}">${t}</button>`).join('')}</div><div class="kp-rij">${lijst.map(kaart).join('')}</div><p style="margin:10px 0 0"><a href="/pakketten" style="font-weight:800">Alle cadeaupakketten</a></p></section>${JS}`;
}
// /pakketten
export function htmlLijst(lijst, dag) {
  const dl = deadline(dag, Math.max(...lijst.map(p => p.levertijd || 5)));
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Cadeaupakketten', itemListElement: lijst.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: p.link, name: p.naam })) };
  return `${stijl()}<section class="kp" data-kp-wrap><h1 class="kp-h1">Cadeaupakketten</h1><p class="kp-sub" style="margin-top:8px">Kant-en-klare cadeaus: sets van één merk die bij elkaar passen, samen voordeliger dan los. Pakketprijs tot en met ${e(datumNL(lijst.reduce((a, p) => p.geldigTot < a ? p.geldigTot : a, '9999-12-31')))}.</p>${dl ? `<p class="kp-dl">${e(dl.tekst)}</p>` : ''}${chips(lijst)}<div class="kp-grid">${lijst.map(kaart).join('')}</div>
<div class="kp-faq" style="margin-top:20px"><details><summary>Wat is een cadeaupakket?</summary><p>Twee of drie producten van hetzelfde merk die bij elkaar passen. Samen betaal je minder dan los.</p></details><details><summary>Kan ik ook één product los kopen?</summary><p>Ja, op de pakketpagina staat bij elk product een link naar de losse versie.</p></details></div></section><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>${JS}`;
}
// /pakket/<slug>
export function htmlDetail(p, lijst, dag) {
  if (!p) return ''; const dl = deadline(dag, p.levertijd || 5), koop = '/pakket/' + p.slug + '/koop';
  const andere = lijst.filter(x => x.groep === p.groep && x.slug !== p.slug).slice(0, 1); const budget = andere.length ? [...andere, p].sort((a, b) => a.totaal - b.totaal) : [];
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.naam, description: p.verhaal + ' ' + p.regels.map(r => r.kort).join(', ') + '.', image: p.regels.map(r => r.img), brand: { '@type': 'Brand', name: p.merk }, sku: p.code,
    offers: { '@type': 'Offer', price: p.totaal.toFixed(2), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: p.link, priceValidUntil: p.geldigTot } };
  const keuzeHtml = p.keuze ? `<div><p style="margin:0 0 6px;font-weight:800">${e(p.keuze.vraag)}: <span data-kp-keuzenaam>${e(p.keuze.opties[0].label)}</span></p><div class="kp-keuze">${p.keuze.opties.map((o, i) => `<button type="button" class="kp-chip" data-kp-optie="${e(o.id)}" aria-pressed="${i ? 'false' : 'true'}">${e(o.label)}</button>`).join('')}</div></div>` : '';
  const href = koop + (p.keuze ? '?keuze=' + encodeURIComponent(p.keuze.opties[0].id) : '');
  return `${stijl()}<article class="kp" data-kp-detail><p style="margin:0 0 10px;font-size:14px;font-weight:700"><a href="/pakketten">Cadeaupakketten</a> › ${e(p.naam)}</p><div class="kp-det">${moz(p.regels, 0)}<div class="kp-info">
<span class="kp-label">${e(p.voor)} · ${e(p.merk)} · ${p.regels.length} producten</span><h1 class="kp-h1">${e(p.naam)}</h1><p style="margin:0">${e(p.verhaal)}</p>
${p.gratis ? `<div class="kp-gratis">${e(p.gratis.titel)} gratis: de rest kost los al ${eur(p.gratis.los)}</div>` : ''}
<div class="kp-groot"><b>${eur(p.totaal)}</b><s>los ${eur(p.losBijOns)}</s></div>${dl ? `<p class="kp-dl" style="margin:0">${e(dl.tekst)}</p>` : ''}${keuzeHtml}
<a class="kp-knop" href="${e(href)}" data-kp-koop="${e(koop)}" data-kp-stap="pakket">Pakket in mandje</a>
${budget.length ? `<div><p style="margin:0 0 6px;font-weight:800">Kies je budget</p><div class="kp-budget">${budget.map(x => `<a href="/pakket/${e(x.slug)}"${x.slug === p.slug ? ' aria-current="page"' : ''}>${e(x.naam)}<span>${eur(x.totaal)}</span></a>`).join('')}</div></div>` : ''}
<h2 style="font-size:20px;margin:6px 0 0">Wat zit erin</h2>${p.regels.map(r => `<div class="kp-regel"><img src="${e(r.img)}" alt="" loading="lazy" width="64" height="64"><div>${e(r.kort)}${p.gratis && p.gratis.id === r.id ? ' <b style="color:var(--kp-groen)">gratis</b>' : ''}<small><a href="/product/${e(r.id)}">Bekijk los, ${eur(r.los)}</a></small></div></div>`).join('')}
${p.let ? `<div class="kp-let">${e(p.let)}.</div>` : ''}<ul class="kp-vink"><li>Kant-en-klaar cadeau, niets meer zoeken</li><li>Alles van ${e(p.merk)}, past bij elkaar</li><li>Pakketprijs tot en met ${e(datumNL(p.geldigTot))}</li></ul>
<div class="kp-faq"><details><summary>Kan ik een product ook los kopen?</summary><p>Ja, via "Bekijk los" bij elk product. Samen in dit pakket betaal je ${eur(p.besparing)} minder.</p></details><details><summary>Hoe lang geldt de pakketprijs?</summary><p>Tot en met ${e(datumNL(p.geldigTot))}.</p></details>${dl ? `<details><summary>Is het op tijd voor ${e(dl.naam)}?</summary><p>${e(dl.tekst)}.</p></details>` : ''}</div>
</div></div><div class="kp-balk"><b>${eur(p.totaal)}</b><a class="kp-knop" href="${e(href)}" data-kp-koop="${e(koop)}" data-kp-stap="pakket">Pakket in mandje</a></div></article><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>${JS}`;
}
// Productpagina, onder de koopknop: alleen als dit product in een pakket zit.
export function htmlProduct(lijst, pid) {
  const p = lijst.find(x => x.regels.some(r => r.id === pid) || (x.keuze && x.keuze.opties.some(o => o.id === pid))); if (!p) return '';
  const rest = p.regels.filter(r => r.id !== pid).map(r => r.kort.toLowerCase());
  return `${stijl()}<aside class="kp kp-blok" aria-label="Ook in een pakket"><h2 style="font-size:18px;margin:0">Ook in de ${e(p.naam)}</h2><div class="kp-duim">${p.regels.map(r => `<img src="${e(r.img)}" alt="" loading="lazy" width="64" height="64">`).join('')}</div><p style="margin:0">Met ${e(rest.join(' en '))} erbij${p.gratis ? '. ' + e(p.gratis.titel) + ' gratis' : ''}.</p><div class="kp-groot"><b style="font-size:24px">${eur(p.totaal)}</b><s>los ${eur(p.losBijOns)}</s></div><a class="kp-knop kp-blauw" href="/pakket/${e(p.slug)}" data-kp-stap="pakket-bekijk">Bekijk het pakket</a></aside>`;
}
// Winkelwagen: ligt er een deel van een pakket in, laat zien wat de rest erbij kost.
export function htmlMand(lijst, pids) {
  const set = new Set(pids); let best = null;
  for (const p of lijst) { const in_ = p.regels.filter(r => set.has(r.id)); if (!in_.length || in_.length === p.regels.length) continue; const al = in_.reduce((a, r) => a + r.los, 0), extra = Math.round((p.totaal - al) * 100) / 100, mis = p.regels.filter(r => !set.has(r.id)); const losMis = mis.reduce((a, r) => a + r.los, 0); if (extra <= 0 || extra >= losMis) continue; const winst = losMis - extra; if (!best || winst > best.winst) best = { p, extra, mis, losMis, winst }; }
  if (!best) return ''; const { p, extra, mis, losMis } = best;
  return `${stijl()}<aside class="kp kp-blok" aria-label="Maak er een pakket van"><h2 style="font-size:18px;margin:0">Maak er de ${e(p.naam)} van</h2><div class="kp-duim">${mis.map(r => `<img src="${e(r.img)}" alt="" loading="lazy" width="64" height="64">`).join('')}</div><p style="margin:0">Voor ${eur(extra)} extra krijg je ook ${e(mis.map(r => r.kort.toLowerCase()).join(' en '))}. Los kost dat ${eur(losMis)}.</p><a class="kp-knop kp-blauw" href="/pakket/${e(p.slug)}/koop?vervang=1" data-kp-stap="pakket-mand">Maak er een pakket van</a></aside>`;
}
export function metaVan(p) {
  if (!p) return null;
  return { title: (p.seo || p.naam + ': ' + p.regels.map(r => r.kort.toLowerCase()).join(', ')) + ' | Kadoly', description: (p.gratis ? p.gratis.titel + ' gratis. ' : '') + p.verhaal + ' Kant-en-klaar cadeau van ' + p.merk + ', samen voordeliger dan los.', canonical: p.link, image: p.regels[0] ? p.regels[0].img : null };
}
