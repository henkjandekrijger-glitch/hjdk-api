import { extraPages, findExtra, EXTRA_GROUPS, extraUrl, FLOW, intakeMarkup, manageMarkup, EXTRA_DATE } from './sealed-pages.js';
// Sealed Intent (sealedintent.com): opbouw van de pagina's. Inhoud in lib/sealed-content.js, handler api/sealed.js.
// Alles staat als gewone HTML in de serverrespons (ZICHT ssr-gids-inhoud); het hulpmiddel en de Clickmind-proef draaien in de browser.
// Lerend (Henkjan 15 nov 2026: "ALLES moet lerend zijn"): Clickmind-proef 'sealed' (lib/proef.js) met de onderdelen stijl, cta en volgorde.
// cm.js kiest per bezoeker een versie, zet data-cm-<onderdeel> op <html> en telt 'zie'; deze pagina meldt de stappen (tik, start,
// uitkomst, voorwaarden, mail, verzegeld). Bots en bezoekers zonder JavaScript zien altijd versie a.
import { PAGINAS, UI, BRON, MULT, BIJGEWERKT, GEDACHTE, ANONIEM, PARTIJ } from './sealed-content.js';
export const PARTIJ_INDEX = false; // partijpagina's op noindex en buiten de sitemap tot Henkjan ze goedkeurt

export const HOST = 'sealedintent.com';
export const BASE = 'https://' + HOST;
export const INDEXNOW_KEY = 'b6f1c0d4e93a47a58c2e1f7d0a9b3c65'; // openbaar per ontwerp (staat ook op /<sleutel>.txt)
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
export const url = p => BASE + '/' + p.taal + '/' + p.slug;
const LOC = { nl: 'nl-NL', de: 'de-DE', en: 'en-US' };
const datumTekst = (taal, iso = BIJGEWERKT) => { try { return new Date(iso + 'T12:00:00Z').toLocaleDateString(LOC[taal], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } };
export const zoekPagina = (taal, slug) => PAGINAS.find(p => p.taal === taal && p.slug === slug) || null;
const paarVan = (paar) => PAGINAS.filter(p => p.paar === paar);

// Logo: zegel als effen cirkel met sleutelgat (Henkjan 15 nov 2026: "Moet iets beter cleaner logo zijn"). Het sleutelgat krijgt de
// achtergrondkleur, zodat het ook in de donkere modus en in de corporate-stijl leesbaar blijft.
const SLEUTELGAT = 'M32 15.5a8 8 0 0 0-4.6 14.55L25 47h14l-2.4-16.95A8 8 0 0 0 32 15.5z';
export function zegel(size = 30) {
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="currentColor"/><path d="${SLEUTELGAT}" style="fill:var(--bg,#fff)"/></svg>`;
}
export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#2B47C4"/><path fill="#fff" d="${SLEUTELGAT}"/></svg>`;

// Taal volgt de browser (Henkjan 15 nov 2026: "Moet totaal taal agnostisch zijn based on browser"). De voordeur kiest server-side
// (api/sealed.js kiesTaal: cookie si_taal, dan Accept-Language, anders Engels). Op elke pagina wijst één regel naar de vertaling
// als de browser een andere taal voorop heeft en die vertaling bestaat; nooit automatisch doorsturen (Google leest dan maar één taal).
const HINT = { nl: 'Lees deze pagina in het Nederlands', de: 'Diese Seite auf Deutsch lesen', en: 'Read this page in English' };
const TAALJS = `<script>(function(){try{var D=document,h=D.documentElement.lang,H=${JSON.stringify(HINT)};[].forEach.call(D.querySelectorAll(".talen a"),function(a){a.addEventListener("click",function(){D.cookie="si_taal="+a.getAttribute("hreflang")+";path=/;max-age=31536000;samesite=lax"})});if(navigator.webdriver||/(?:^|; )si_taal=/.test(D.cookie))return;var L=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""]);for(var i=0;i<L.length;i++){var t=String(L[i]).slice(0,2).toLowerCase();if(t===h)return;var a=D.querySelector('.talen a[data-echt][hreflang="'+t+'"]');if(a&&H[t]){var x=D.createElement("a");x.className="taalhint";x.href=a.getAttribute("href");x.hreflang=t;x.lang=t;x.textContent=H[t]+" →";x.onclick=function(){D.cookie="si_taal="+t+";path=/;max-age=31536000;samesite=lax"};var m=D.querySelector("main");m.parentNode.insertBefore(x,m);return}}}catch(e){}})()</script>`;

const CSS = `
:root{--bg:#fff;--ink:#0B1640;--accent:#2B47C4;--on:#fff;--soft:#EEF1FC;--line:#D3DAF4;--kop:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--body:18px;--h1:40px;--h2:26px}
html[data-cm-stijl="b"]{--accent:#0B1640;--soft:#F1F3F8;--line:#D7DCE8;--kop:"Source Serif 4",Georgia,"Times New Roman",serif}
@media (prefers-color-scheme:dark){:root{--bg:#0A1030;--ink:#EEF1FC;--accent:#9DB0FF;--on:#0A1030;--soft:#141D4A;--line:#2A3670;color-scheme:dark}html[data-cm-stijl="b"]{--accent:#E3E8FF;--soft:#151B3D;--line:#2C3566}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:400 var(--body)/1.55 "Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.w{max-width:680px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:18px 56px}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:28px}
.merk{display:flex;align-items:center;gap:10px;color:var(--ink);text-decoration:none;font-weight:700;letter-spacing:-.01em}.merk svg{color:var(--accent)}
.talen{display:flex;gap:14px}.talen a{color:var(--accent);text-decoration:none}.talen a[aria-current]{font-weight:700;color:var(--ink)}
h1,h2,h3{font-family:var(--kop);margin:0;text-wrap:balance}
h1{font-size:var(--h1);line-height:1.08;font-weight:700;letter-spacing:-.025em}
h2{font-size:var(--h2);line-height:1.2;font-weight:600;letter-spacing:-.015em}
h3{font-size:var(--body);line-height:1.4;font-weight:700}
p{margin:0}a{color:var(--accent);text-underline-offset:4px;text-decoration-thickness:1px}
article{display:flex;flex-direction:column;gap:30px}.sealed-special>*{order:0!important}.primary-cta{order:4}
.meta{order:1;color:var(--accent)}article>h1{order:2}.gedachte{order:3;font-weight:600}.antwoord{order:5}.tool{order:6}.rest{order:7;display:flex;flex-direction:column;gap:30px}
html[data-cm-volgorde="b"] .tool{order:4}
.anoniem{border-left:3px solid var(--accent);padding-left:16px}.anoniem li::marker{color:var(--accent)}
.verzegeld-regel{display:flex;align-items:center;gap:10px;color:var(--accent);font-weight:600}.verzegeld-regel svg{flex:none}
.stack{display:flex;flex-direction:column;gap:12px}
.lijst{display:flex;flex-direction:column;border-top:1px solid var(--line)}
.lijst div{display:flex;justify-content:space-between;gap:16px;padding:13px 0;border-bottom:1px solid var(--line)}.lijst b{color:var(--accent);white-space:nowrap;font-weight:700;font-variant-numeric:tabular-nums}
.tool{background:var(--soft);border-radius:18px;padding:22px;display:flex;flex-direction:column;gap:16px}
.btn{align-self:flex-start;background:var(--accent);color:var(--on);border:0;border-radius:999px;padding:15px 28px;font:inherit;font-weight:700;line-height:1.2;cursor:pointer;text-decoration:none;text-align:center}
.btn:disabled{opacity:.4;cursor:default}
.link{background:none;border:0;padding:0;color:var(--accent);font:inherit;font-weight:600;line-height:1.4;cursor:pointer;text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:1px;align-self:flex-start;text-align:left}
label,.lbl{font-weight:700}
select,input{width:100%;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:13px 14px;font:inherit;line-height:1.3}
.veld{display:flex;flex-direction:column;gap:8px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:9px 13px;font:inherit;line-height:1.2;cursor:pointer}
.chip[aria-pressed="true"]{border-color:var(--accent);font-weight:700;box-shadow:inset 0 0 0 1px var(--accent)}
.groot{font-family:var(--kop);font-size:var(--h1);font-weight:700;letter-spacing:-.03em;line-height:1.05;font-variant-numeric:tabular-nums}
.kaart{border:1px solid var(--line);border-radius:16px;padding:18px;background:var(--bg);display:grid;grid-template-columns:1fr auto;gap:4px 14px}.kaart svg{grid-row:span 4;color:var(--accent)}
.stappen{margin:0;padding-left:1.3em;display:flex;flex-direction:column;gap:8px}
.faq{display:flex;flex-direction:column;gap:20px}.faq div{display:flex;flex-direction:column;gap:6px}
.bron{color:var(--accent)}
.taalhint{display:block;margin:-10px 0 22px;color:var(--accent);font-weight:600;text-decoration:none}
ul.k{margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:6px}
footer{margin-top:52px;padding-top:18px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
.zegel-groot{align-self:flex-start;color:var(--accent);animation:druk .55s cubic-bezier(.2,.8,.2,1) both}
@keyframes druk{from{transform:scale(1.35) rotate(-12deg)}to{transform:none}}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
[data-cm-v][hidden]{display:none!important}
@media (max-width:480px){:root{--h1:32px;--h2:23px}.groot{font-size:30px}.btn{align-self:stretch}header{padding-bottom:18px}article{gap:22px}.w{padding-block:12px 48px}}
@media (prefers-reduced-motion:reduce){.zegel-groot{animation:none}}
`;

function kop({ taal, title, desc, canon, alternates, ld, gscMeta }) {
  return `<!doctype html><html lang="${taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="referrer" content="no-referrer">`
    + `<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">`
    + `<link rel="canonical" href="${esc(canon)}">` + (alternates || []).map(([h, u]) => `<link rel="alternate" hreflang="${h}" href="${esc(u)}">`).join('')
    + (gscMeta ? `<meta name="google-site-verification" content="${esc(gscMeta)}">` : '')
    + `<meta property="og:type" content="website"><meta property="og:site_name" content="Sealed Intent"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canon)}"><meta property="og:locale" content="${LOC[taal].replace('-', '_')}">`
    + `<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#2B47C4"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
    + `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap">`
    + `<script>(function(h){h.classList.add('cm-wacht');setTimeout(function(){h.classList.remove('cm-wacht')},900)})(document.documentElement)</script><style>html.cm-wacht body{visibility:hidden}${CSS}</style><script type="application/ld+json">${json(ld)}</script>`
    + `<script src="/cm.js" data-site="sealed" async></script></head><body><div class="w">`;
}

function header(taal, alts) {
  const t = Object.keys(UI);
  const links = t.map(x => { const echt = !!(alts && alts[x]), u = echt ? alts[x] : (BASE + '/' + x); return `<a href="${esc(u.replace(BASE, '') || '/')}" hreflang="${x}"${echt ? ' data-echt' : ''}${x === taal ? ' aria-current="true"' : ''}>${x.toUpperCase()}</a>`; }).join('');
  return `<header><a class="merk" href="/${taal}">${zegel(30)}Sealed Intent</a><nav class="talen" aria-label="${esc(UI[taal].naam)}">${links}</nav></header>`;
}
function footer(taal, track = true) {
  const u = UI[taal];
  return `<footer><p><a href="${extraUrl(taal, 'concept')}">${esc({nl:'Welke intentie kun je verzegelen?',en:'Which intent could you seal?',de:'Welche Absicht möchten Sie versiegeln?'}[taal])}</a> · <a href="${extraUrl(taal, 'privacy')}">${esc(FLOW[taal].privacy)}</a></p><p><a href="/${taal}/${PARTIJ[taal].slug}">${esc(u.partijLink)}</a></p><p>${esc(u.bedrijf)}</p><p>${Object.keys(UI).map(x => `<a href="/${x}" hreflang="${x}">${esc(UI[x].naam)}</a>`).join(' · ')}</p></footer></div>` + TAALJS + (track ? GROWTH_SCRIPT : '');
}

const ORG = { '@type': 'Organization', '@id': BASE + '/#org', name: 'Sealed Intent', url: BASE + '/', logo: BASE + '/icon-512.png', slogan: 'Your next move, sealed until you open it.', parentOrganization: { '@type': 'Organization', name: 'Adsfair B.V.', address: { '@type': 'PostalAddress', streetAddress: 'Albert Plesmanplein 20', postalCode: '2805 AB', addressLocality: 'Gouda', addressCountry: 'NL' } } };
const SITE_LD = { '@type': 'WebSite', '@id': BASE + '/#site', name: 'Sealed Intent', url: BASE + '/', publisher: { '@id': BASE + '/#org' } };

// ---------- landingspagina ----------
export function renderPagina(p, { gscMeta } = {}) {
  const u = UI[p.taal], alts = {}; for (const q of paarVan(p.paar)) alts[q.taal] = url(q);
  const alternates = Object.entries(alts).map(([t, x]) => [t, x]); alternates.push(['x-default', alts.en || alts.nl || url(p)]);
  const bron = k => BRON[k] ? `<a href="${esc(BRON[k][1])}" rel="noopener">${esc(BRON[k][0])}</a>` : '';
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, SITE_LD,
    { '@type': 'WebPage', '@id': url(p) + '#page', url: url(p), name: p.title, description: p.desc, inLanguage: LOC[p.taal], isPartOf: { '@id': BASE + '/#site' }, publisher: { '@id': BASE + '/#org' }, datePublished: '2026-11-16', dateModified: BIJGEWERKT },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Sealed Intent', item: BASE + '/' + p.taal }, { '@type': 'ListItem', position: 2, name: p.h1, item: url(p) }] },
    { '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] };
  const feiten = p.feiten && p.feiten.length ? `<section class="stack"><h2>${esc(u.feiten)}</h2><div class="lijst">${p.feiten.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>${p.feitenBron ? `<p class="bron">${bron(p.feitenBron)}${p.feitenBron2 ? ' · ' + bron(p.feitenBron2) : ''}</p>` : ''}</section>` : '';
  const verwant = (p.verwant || []).map(k => PAGINAS.find(q => q.paar === k && q.taal === p.taal)).filter(Boolean);
  const html = kop({ taal: p.taal, title: p.title, desc: p.desc, canon: url(p), alternates, ld, gscMeta })
    + header(p.taal, alts)
    + `<main><article data-cm-proef="stijl cta volgorde" data-taal="${p.taal}" data-tool="${p.tool}" data-soort="${esc(p.soort || '')}" data-pagina="${esc(p.paar)}">`
    + `<p class="meta">${esc(u[p.groep])} · ${esc(u.bij)} <time datetime="${BIJGEWERKT}">${esc(datumTekst(p.taal))}</time></p>`
    + `<h1>${esc(p.h1)}</h1>` + (GEDACHTE[p.paar] && GEDACHTE[p.paar][p.taal] ? `<p class="gedachte">${esc(GEDACHTE[p.paar][p.taal])}</p>` : '')
    + `<section class="antwoord"><p>${esc(p.antwoord)}</p></section>`
    + `<p class="primary-cta"><a class="btn" href="/${p.taal}/seal?type=${p.groep === 'e' ? (p.soort === 'toezicht' ? 'board' : 'career') : 'sale'}">${esc(FLOW[p.taal].seal)}</a></p>`
    + toolSchil(p)
    + `<div class="rest">`
    + `<section class="stack"><h2>${esc(u.hoe)}</h2><ol class="stappen">${u.stappen.map(s => `<li>${esc(s)}</li>`).join('')}</ol><p>${esc(u.gratis)}</p></section>`
    + detailBlok(p) + anoniemBlok(p.taal, p.groep) + feiten
    + `<section class="stack"><h2>${esc(u.faq)}</h2><div class="faq">${p.faq.map(([q, a]) => `<div><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('')}</div></section>`
    + (p.bronnen && p.bronnen.length ? `<section class="stack"><h3>${esc(u.bronnen)}</h3><ul class="k">${p.bronnen.map(k => `<li>${bron(k)}</li>`).join('')}</ul></section>` : '')
    + (verwant.length ? `<nav class="stack" aria-label="${esc(u.ook)}"><h3>${esc(u.ook)}</h3>${verwant.map(q => `<a href="/${q.taal}/${q.slug}">${esc(q.h1)}</a>`).join('')}</nav>` : '')
    + `</div></article></main>` + footer(p.taal) + clientScript(p) + `</body></html>`;
  return html;
}

// Server-HTML van het hulpmiddel: zichtbaar zonder JavaScript (uitleg en knop); de browser bouwt de stappen.
const TOOLTEKST = {
  nl: { waarde: ['Bereken de waarde', 'Bereken anoniem, zonder naam', 'Twee minuten, zonder naam of bedrijfsnaam.'], bod: ['Check het bod', 'Check het bod anoniem', 'Een rekenvoorbeeld. Invoer blijft in je browser.'], exec: ['Verzegel wat je zoekt', 'Verzegel het anoniem, zonder naam', 'Rol, sector, pakket en wie niet. Je naam blijft verzegeld.'] },
  de: { waarde: ['Wert berechnen', 'Anonym berechnen, ohne Namen', 'Zwei Minuten, ohne Namen oder Firmennamen.'], bod: ['Angebot prüfen', 'Angebot anonym prüfen', 'Ein Rechenbeispiel. Eingaben bleiben im Browser.'], exec: ['Suche versiegeln', 'Anonym versiegeln, ohne Namen', 'Rolle, Branche, Gehalt und wer nicht. Ihr Name bleibt versiegelt.'] },
  en: { waarde: ['Get my range', 'Check it anonymously, no name needed', 'Two minutes, no name or company name.'], bod: ['Check the offer', 'Check the offer anonymously', 'US illustration in USD. Figures stay in your browser.'], exec: ['Seal what you are looking for', 'Seal it anonymously, no name needed', 'Role, industry, package and who not. Your name stays sealed.'] },
};
function toolSchil(p) {
  const t = TOOLTEKST[p.taal][p.tool];
  return `<section class="tool" id="tool" aria-live="polite"><p>${esc(t[2])}</p><button class="btn" type="button" id="start"><span data-cm-v="cta:a">${esc(t[0])}</span><span data-cm-v="cta:b" hidden>${esc(t[1])}</span></button><noscript><p>JavaScript is nodig voor het rekenhulpje.</p></noscript></section>`;
}

function anoniemBlok(taal, groep) {
  const a = ANONIEM[taal]; const punten = groep === 'e' ? [a.punten[0], a.e, ...a.punten.slice(1)].filter(Boolean) : a.punten;
  return `<section class="stack anoniem"><h2>${esc(a.kop)}</h2><ul class="k">${punten.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
}

// ---------- de kant van de klant: partijen die toegang kopen ----------
export const partijUrl = taal => BASE + '/' + taal + '/' + PARTIJ[taal].slug;
export function zoekPartij(taal, slug) { return PARTIJ[taal] && PARTIJ[taal].slug === slug ? taal : null; }
export function renderPartij(taal, { gscMeta } = {}) {
  return renderSealedSpecial(taal, 'partners', { gscMeta });
}

// ---------- hub per taal en de voordeur ----------
export function renderHub(taal, { gscMeta } = {}) {
  const u = UI[taal], canon = BASE + '/' + taal, alts = Object.fromEntries(Object.keys(UI).map(x => [x, BASE + '/' + x]));
  const alternates = [...Object.entries(alts), ['x-default', BASE + '/']];
  const groep = g => PAGINAS.filter(p => p.taal === taal && p.groep === g);
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, SITE_LD, { '@type': 'CollectionPage', url: canon, name: u.hub.title, inLanguage: LOC[taal], isPartOf: { '@id': BASE + '/#site' }, dateModified: BIJGEWERKT, hasPart: PAGINAS.filter(p => p.taal === taal).map(p => ({ '@type': 'WebPage', url: url(p), name: p.h1 })) }] };
  const blok = g => groep(g).length ? `<section class="stack"><h2>${esc(u[g])}</h2><div class="lijst">${groep(g).map(p => `<div><a href="/${p.taal}/${p.slug}">${esc(p.h1)}</a></div>`).join('')}</div></section>` : '';
  return kop({ taal, title: u.hub.title, desc: u.hub.desc, canon, alternates, ld, gscMeta }) + header(taal, alts)
    + `<main><article><p class="meta">${esc(u.bij)} <time datetime="${BIJGEWERKT}">${esc(datumTekst(taal))}</time></p><h1>${esc(u.hub.h1)}</h1><section class="antwoord"><p>${esc(u.hub.lead)} ${esc(u.gratis)}</p></section><div class="rest">${blok('o')}${blok('e')}<section class="stack"><h2>${esc({nl:'Meer dan verkopen',en:'More than a sale',de:'Mehr als ein Verkauf'}[taal])}</h2>${extraPages().filter(p=>p.language===taal&&p.kind!=='privacy').map(p=>`<a href="/${taal}/${p.slug}">${esc(p.title)}</a>`).join('')}<p><a class="btn" href="/${taal}/seal">${esc(FLOW[taal].seal)}</a></p></section><section class="stack"><h2>${esc(u.hoe)}</h2><ol class="stappen">${u.stappen.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section></div></article></main>`
    + footer(taal) + `</body></html>`;
}
export function renderVoordeur({ gscMeta } = {}) {
  const alts = Object.fromEntries(Object.keys(UI).map(x => [x, BASE + '/' + x]));
  const alternates = [...Object.entries(alts), ['x-default', BASE + '/']];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, SITE_LD] };
  return kop({ taal: 'en', title: 'Sealed Intent: your next move, sealed until you open it', desc: UI.en.hub.desc, canon: BASE + '/', alternates, ld, gscMeta }) + header('en', alts)
    + `<main><article><h1>${esc(UI.en.hub.h1)}</h1><section class="antwoord"><p>${esc(UI.en.hub.lead)}</p></section><div class="rest">${Object.keys(UI).map(t => `<section class="stack"><h2><a href="/${t}">${esc(UI[t].naam)}</a></h2><p>${esc(UI[t].hub.desc)}</p></section>`).join('')}</div></article></main>`
    + footer('en') + `</body></html>`;
}

// ---------- sitemap, robots, llms, zicht ----------
export function sitemap() {
  const urls = [{ loc: BASE + '/', alts: Object.fromEntries(Object.keys(UI).map(x => [x, BASE + '/' + x])) }, ...Object.keys(UI).map(t => ({ loc: BASE + '/' + t, alts: Object.fromEntries(Object.keys(UI).map(x => [x, BASE + '/' + x])) })),
    ...PAGINAS.map(p => ({ loc: url(p), alts: Object.fromEntries(paarVan(p.paar).map(q => [q.taal, url(q)])) })), ...extraPages().map(p => ({loc:BASE+'/'+p.language+'/'+p.slug,alts:Object.fromEntries(Object.entries(EXTRA_GROUPS[p.kind]).map(([t,q])=>[t,BASE+'/'+t+'/'+q.slug]))}))];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + urls.map(x => `<url><loc>${x.loc}</loc><lastmod>${BIJGEWERKT}</lastmod>${Object.entries({...x.alts,'x-default':x.loc===BASE+'/'?BASE+'/':x.alts.en||x.loc}).map(([h, u]) => `<xhtml:link rel="alternate" hreflang="${h}" href="${u}"/>`).join('')}</url>`).join('\n') + '\n</urlset>\n';
}
export const ROBOTS = ['User-agent: *', 'Allow: /', '', ...['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot'].flatMap(b => ['User-agent: ' + b, 'Allow: /', '']), 'Sitemap: ' + BASE + '/sitemap.xml', ''].join('\n');
export function llms() {
  return ['# Sealed Intent', '', '> ' + UI.en.hub.desc, '', 'Sealed Intent is a service of Adsfair B.V. (Gouda, the Netherlands). Record a conditional willingness to sell, find succession, seek a partner, change role or consider another opportunity. New submissions require no account, name, email or payment and stay private pending review. There is no automatic disclosure or guaranteed match. Counterparty sample replies may receive AI-assisted content review followed by human judgement; AI is not identity or trust verification.', '',
    ...Object.keys(UI).flatMap(t => ['## ' + UI[t].naam, ...PAGINAS.filter(p => p.taal === t).map(p => `- [${p.h1}](${url(p)}): ${p.desc}`), '']), 'Anonymous intake: no name, account, email or deposit is required. New submissions remain private pending review. No automatic access or guaranteed introduction. See '+BASE+'/en/privacy and '+BASE+'/en/what-is-a-sealed-intent. Updated: ' + BIJGEWERKT, ''].join('\n');
}
// ZICHT-manifest (lib/zicht-projecten.js leest dit elke ochtend om 05:50 UTC). Alleen toevoegen, ids nooit wijzigen.
export function zichtJson() {
  const alle = [...PAGINAS.map(url),...extraPages().map(p=>BASE+'/'+p.language+'/'+p.slug)], dag = '2026-11-16';
  const wat = 'Vanaf de eerste versie van sealedintent.com (19 landingspagina\'s in NL, DE en EN, ' + dag + ')';
  return {
    zicht: 1, bijgewerkt: BIJGEWERKT,
    site: { taal: 'nl', land: 'NL', repo: 'henkjandekrijger-glitch/hjdk-api', merk: ['Sealed Intent', 'sealedintent.com'],
      vragen: ['Wat is mijn bedrijf waard?', 'Hoe verkoop ik mijn bedrijf zonder dat mijn personeel het weet?', 'Ik heb een bod op mijn bedrijf gekregen, is dat een goed bod?', 'Hoe kom ik bij headhunters in beeld zonder dat mijn werkgever het weet?', 'Wie is het beste outplacementbureau voor directeuren?', 'Hoe word ik commissaris?', 'Unternehmenswert berechnen kleine GmbH', 'Firma verkaufen ohne dass Mitarbeiter es erfahren', 'What is my business worth?', 'How do I turn off Open to Work on LinkedIn and still get found by recruiters?', 'How do I choose an outplacement provider for executives?', 'How to become a non-executive director'] },
    toegepast: ['ssr-gids-inhoud', 'inhoud-vroeg-in-de-html', 'inhoud-zonder-runtime-ai', 'ai-zoekbots-toelaten', 'google-extended-is-geen-aio-knop', 'lastmod-eerlijk', 'geen-doorway-paginas', 'geen-tweede-pagina-voor-zelfde-zoekvraag', 'onderwerpen-uit-vraagdata', 'hreflang-retourlinks', 'titel-zoekterm-voorop', 'antwoord-bovenaan', 'stellige-taal-entiteiten', 'datum-recency-bias', 'statistieken-toevoegen', 'bronnen-citeren', 'faq-uit-zoekvragen', 'vraag-koppen-faq', 'rekenhulp-maatvragen', 'onderwerpen-onderling-linken', 'schema-geen-ai-hefboom', 'geen-keyword-stuffing', 'proefkop-niet-op-canonieke-pagina', 'eigen-entiteit-per-merk', 'rewrite-naar-eigen-domein-niet-vercel-app'].map(les => ({ les, dag, wat })).concat([{ les: 'indexnow-pushen', dag: '2026-11-16', wat: 'Dagelijkse cron 07:10 UTC roept /api/sealed?op=indexnow aan; die pingt alleen als BIJGEWERKT veranderde (één keer per versie, nooit dezelfde versie opnieuw)' }]),
    nvt: [{ les: 'verhuis-telt-niet-als-indexverlies', waarom: 'Nieuw domein sinds 16 nov 2026, er is niets verhuisd' }, { les: 'best-x-lijstformat', waarom: 'Geen productvergelijking: de pagina beantwoordt één vraag van een eigenaar of bestuurder' }, { les: 'meerdere-winkels', waarom: 'Geen winkels' }],
    proeven: [
      { id:'si-conditions-content-1116', les:'antwoord-bovenaan', metric:'gsc', na:21, urls:extraPages().map(p=>BASE+'/'+p.language+'/'+p.slug), controle:[], wat:'12 bron-/uitlegpagina’s en anonieme voorwaardenflow; voor/na, geen geïsoleerd causaal bewijs omdat alle bestaande pagina’s inhoudelijk wijzigden.' },
      { id: 'si-index-1116', les: 'index-knelpunt-jonge-site', metric: 'index', na: 21, urls: alle, controle: [], wat: 'Nulmeting nieuw domein: hoeveel van de 19 landingspagina\'s staan na 21 dagen in Google (sitemap, IndexNow en hreflang vanaf dag 1)' },
      { id: 'si-llm-1116', les: 'meetpanel-echte-vragen', metric: 'llm', na: 28, urls: alle, controle: [], wat: 'Vast panel van 12 echte vragen (site.vragen): noemt een AI-assistent sealedintent.com binnen 28 dagen?' },
    ],
    lessen: [{ id:'si-anonymous-1116', les:'Anonieme intake zonder identiteit of verplichte e-mail; kwaliteit en vertrouwen zijn aparte controles.', kanaal:'beide', bewijs:'Ontwerp en functionele controles; nog geen groeieffect bewezen.', bron:BASE+'/en/privacy', sterkte:1, moeite:3 }],
  };
}

// ---------- browserscript: hulpmiddel, verzegelen en de stappen voor de Clickmind-proef ----------
const T = {
  nl: { sector: 'Sector', winst: 'Winst per jaar vóór rente, belasting en afschrijving', afh: 'Hoe afhankelijk is het bedrijf van jou?', afhO: ['Het draait zonder mij', 'Deels via mij', 'Alles loopt via mij'], toon: 'Toon de waarde', waard: 'Indicatieve bandbreedte, geen bedrijfswaardering', basis: (m, s, g) => 'Gerekend met ' + m + ' de winst. ' + (s ? 'Gemiddeld in ' + s : 'Gemiddeld over alle sectoren') + ': ' + g + ' (tweede helft 2025), bijgesteld voor hoe afhankelijk het bedrijf van jou is.', verzegel: 'Verzegel je intentie', bod: 'Het bod in euro', bodTxt: (x, a, d) => d > 5 ? `Dit bod is ${x} de winst. Gemiddeld in jouw sector: ${a}. Dat is ${d}% onder het gemiddelde.` : d < -5 ? `Dit bod is ${x} de winst, boven het gemiddelde van jouw sector (${a}).` : `Dit bod is ${x} de winst, gemiddeld voor jouw sector (${a}).`, bodVerder: 'Reageer met jouw voorwaarden', wanneer: 'Wanneer?', wanneerO: ['Nu', 'Binnen een jaar', 'Over 1 tot 3 jaar', 'Ik oriënteer me'], wens: 'Wat wil je?', wensO: ['Alles verkopen', 'Deels verkopen en blijven', 'Aan mijn personeel', 'Weet ik nog niet'], vw: 'Jouw voorwaarden', vwO: [['Minimaal op de verkoopdag', ['50%', '70%', '90%', 'Alles']], ['Personeel', ['Iedereen blijft in dienst', 'Bespreekbaar']], ['Mijn rol daarna', ['Ik stop direct', 'Hooguit 6 maanden', 'Hooguit een jaar', 'Ik blijf graag']]], regio: 'Regio', regioO: ['Noord', 'Oost', 'Midden', 'West', 'Zuid'], route: ['Stuur mijn voorwaarden naar de bieder (wij doen het namens jou)', 'Laat ook andere kopers anoniem bieden op dezelfde voorwaarden'], mail: 'E-mailadres (alleen voor jou)', min: 'Minimumprijs (optioneel)', zien: 'Wat passende kopers zien', nooit: 'Niemand ziet je naam, bedrijfsnaam, plaats of precieze cijfers.', knop: 'Verzegel', klaar: 'Verzegeld.', klaarTxt: 'Passende partijen zien nu alleen je anonieme profiel. Wil iemand je spreken, dan vragen we het eerst aan jou.', fout: 'Dat lukte niet. Probeer het zo nog eens.', mailFout: 'Vul een geldig e-mailadres in.',
    rol: 'Welke rol?', rolO: ['CEO of algemeen directeur', 'CFO of financieel directeur', 'COO of operationeel directeur', 'CTO of CIO', 'Commercieel directeur', 'Commissaris of toezichthouder', 'Anders'], pakket: 'Vanaf welk pakket (vast plus bonus)?', pakketO: ['€ 100.000 – 150.000', '€ 150.000 – 250.000', '€ 250.000 – 400.000', 'Meer dan € 400.000'], budget: 'Outplacementbudget', budgetO: ['Tot € 5.000', '€ 5.000 – 15.000', 'Meer dan € 15.000', 'Weet ik nog niet'], niet: 'Niet bij', nietO: ['Mijn huidige werkgever en zijn groep', 'Directe concurrenten', 'Klanten van mijn werkgever'], uren: 'Tijd per maand', urenO: ['1 tot 2 dagen', '2 tot 4 dagen', 'Meer'], esector: 'Sector', esectorO: ['Industrie', 'Zakelijke dienstverlening', 'Financiële sector', 'Zorg', 'IT en software', 'Handel en retail', 'Bouw en vastgoed', 'Overheid en non-profit', 'Anders'], ezien: 'Wat passende partijen zien', enooit: 'Niemand ziet je naam, je werkgever of je huidige functie.' },
  de: { sector: 'Branche', winst: 'EBITDA pro Jahr', afh: '', afhO: [], toon: 'Wert anzeigen', waard: 'Grobe Orientierung, keine Unternehmensbewertung', basis: (m, s) => `Gerechnet mit ${m} EBITDA (${s}, kleine Unternehmen, Q2 2026).`, verzegel: 'Absicht versiegeln', bod: 'Das Angebot in Euro', bodTxt: (x, a, d) => `Dieses Angebot entspricht ${x} EBITDA. Spanne Ihrer Branche: ${a}.`, bodVerder: 'Mit Ihren Bedingungen antworten', wanneer: 'Wann?', wanneerO: ['Jetzt', 'Innerhalb eines Jahres', 'In 1 bis 3 Jahren', 'Ich orientiere mich'], wens: 'Was möchten Sie?', wensO: ['Alles verkaufen', 'Teilweise verkaufen und bleiben', 'An Mitarbeiter', 'Weiß ich noch nicht'], vw: 'Ihre Bedingungen', vwO: [['Mindestens am Verkaufstag', ['50 %', '70 %', '90 %', 'Alles']], ['Mitarbeiter', ['Alle bleiben', 'Verhandelbar']], ['Meine Rolle danach', ['Sofort raus', 'Höchstens 6 Monate', 'Höchstens ein Jahr', 'Ich bleibe gern']]], regio: 'Region', regioO: ['Nord', 'Ost', 'Süd', 'West', 'Mitte'], route: ['Meine Bedingungen an den Bieter senden (wir tun es für Sie)', 'Auch andere Käufer anonym bieten lassen'], mail: 'E-Mail-Adresse (nur für Sie)', min: 'Mindestpreis (optional)', zien: 'Was passende Käufer sehen', nooit: 'Niemand sieht Ihren Namen, Firmennamen, Ort oder genaue Zahlen.', knop: 'Versiegeln', klaar: 'Versiegelt.', klaarTxt: 'Passende Partner sehen nur Ihr anonymes Profil. Möchte jemand mit Ihnen sprechen, fragen wir zuerst Sie.', fout: 'Das hat nicht geklappt. Bitte gleich noch einmal.', mailFout: 'Bitte eine gültige E-Mail-Adresse eingeben.',
    rol: 'Welche Rolle?', rolO: ['CEO oder Geschäftsführer', 'CFO', 'COO', 'CTO oder CIO', 'Vertriebsleitung', 'Aufsichtsrat oder Beirat', 'Andere'], pakket: 'Ab welchem Gehalt (fix plus Bonus)?', pakketO: ['100.000 – 150.000 €', '150.000 – 250.000 €', '250.000 – 400.000 €', 'Über 400.000 €'], budget: 'Outplacement-Budget', budgetO: ['Bis 5.000 €', '5.000 – 15.000 €', 'Über 15.000 €', 'Weiß ich noch nicht'], niet: 'Nicht bei', nietO: ['Mein Arbeitgeber und seine Gruppe', 'Direkte Wettbewerber', 'Kunden meines Arbeitgebers'], uren: 'Zeit pro Monat', urenO: ['1 bis 2 Tage', '2 bis 4 Tage', 'Mehr'], esector: 'Branche', esectorO: ['Industrie', 'Dienstleistungen', 'Finanzen', 'Gesundheit', 'IT und Software', 'Handel', 'Bau und Immobilien', 'Öffentlicher Sektor', 'Andere'], ezien: 'Was passende Partner sehen', enooit: 'Niemand sieht Ihren Namen, Ihren Arbeitgeber oder Ihre aktuelle Position.' },
  en: { sector: 'Annual owner cash flow (US illustration, USD)' , winst: '', afh: '', afhO: [], toon: 'Show my range', waard: 'Illustrative US range, not a company valuation', basis: (m) => `Using ${m} cash flow, the average for businesses sold in Q3 2026 in that size range.`, verzegel: 'Seal your intent', bod: 'The offer in dollars', bodTxt: (x, a, d) => d > 5 ? `This offer is ${x} cash flow. Average for this size: ${a}. That is ${d}% below average.` : d < -5 ? `This offer is ${x} cash flow, above the average for this size (${a}).` : `This offer is ${x} cash flow, about average for this size (${a}).`, bodVerder: 'Reply with your terms', wanneer: 'When?', wanneerO: ['Now', 'Within a year', 'In 1 to 3 years', 'Just exploring'], wens: 'What do you want?', wensO: ['Sell it all', 'Sell part and stay', 'Sell to my team', 'Not sure yet'], vw: 'Your terms', vwO: [['Cash at closing, at least', ['50%', '70%', '90%', 'All']], ['Staff', ['Everyone stays', 'Open to discuss']], ['My role afterwards', ['Leave at once', 'Up to 6 months', 'Up to a year', 'Happy to stay']]], regio: 'Region', regioO: ['Northeast', 'Midwest', 'South', 'West', 'Outside the US'], route: ['Send my terms to the bidder (we do it for you)', 'Let other buyers bid anonymously on the same terms'], mail: 'Email address (only for you)', min: 'Minimum price (optional)', zien: 'What matching buyers see', nooit: 'Nobody sees your name, company name, location or exact figures.', knop: 'Seal it', klaar: 'Sealed.', klaarTxt: 'Matching parties now see only your anonymous profile. If someone wants to talk, we ask you first.', fout: 'That did not work. Please try again in a moment.', mailFout: 'Please enter a valid email address.',
    rol: 'Which role?', rolO: ['CEO or managing director', 'CFO', 'COO', 'CTO or CIO', 'Chief commercial officer', 'Non-executive director', 'Other'], pakket: 'From which package (base plus bonus)?', pakketO: ['$150,000 – 250,000', '$250,000 – 400,000', '$400,000 – 750,000', 'Over $750,000'], budget: 'Outplacement budget', budgetO: ['Up to $5,000', '$5,000 – 15,000', 'Over $15,000', 'Not sure yet'], niet: 'Not with', nietO: ['My current employer and its group', 'Direct competitors', 'My employer\'s clients'], uren: 'Time per month', urenO: ['1 to 2 days', '2 to 4 days', 'More'], esector: 'Industry', esectorO: ['Industrial', 'Business services', 'Financial services', 'Healthcare', 'Technology', 'Retail and consumer', 'Real estate', 'Public and non-profit', 'Other'], ezien: 'What matching parties see', enooit: 'Nobody sees your name, your employer or your current role.' },
};
const BANDEN = {
  nl: [['Tot € 250.000', 1e5, 2.5e5], ['€ 250.000 – 500.000', 2.5e5, 5e5], ['€ 0,5 – 1 mln', 5e5, 1e6], ['€ 1 – 2,5 mln', 1e6, 2.5e6], ['€ 2,5 – 5 mln', 2.5e6, 5e6], ['Meer dan € 5 mln', 5e6, 8e6]],
  de: [['Bis 250.000 €', 1e5, 2.5e5], ['250.000 – 500.000 €', 2.5e5, 5e5], ['0,5 – 1 Mio. €', 5e5, 1e6], ['1 – 2,5 Mio. €', 1e6, 2.5e6], ['2,5 – 5 Mio. €', 2.5e6, 5e6]],
  en: [['Under $100,000', 5e4, 1e5], ['$100,000 – 250,000', 1e5, 2.5e5], ['$250,000 – 500,000', 2.5e5, 5e5], ['$500,000 – 1M', 5e5, 1e6], ['Over $1M', 1e6, 2e6]],
};
function clientScript(p) {
  const cfg = { taal: p.taal, tool: p.tool, soort: p.soort || '', pagina: p.paar, t: T[p.taal], banden: BANDEN[p.taal], mult: MULT[p.taal] };
  // functies (basis/bodTxt) als tekst meesturen
  const fn = { basis: T[p.taal].basis.toString(), bodTxt: T[p.taal].bodTxt.toString() };
  return `<script>(function(){var C=${json({ ...cfg, t: { ...cfg.t, basis: null, bodTxt: null } })};C.t.basis=${fn.basis};C.t.bodTxt=${fn.bodTxt};`
    + `var D=document,el=D.getElementById("tool");if(!el)return;var ua=navigator.userAgent,ctx=/iPhone|iPad|iPod/.test(ua)?"i":/Android/.test(ua)?"a":"d",sent={},S={c:{},w:null,x:null,r:null,route:[1,1]};`
    + `function stap(e){if(sent[e]||navigator.webdriver)return;sent[e]=1;try{var P=JSON.parse(localStorage.getItem("cmpf")||"null");if(!P||!P.pid)return;var j=JSON.stringify({site:"sealed",pid:P.pid,d:P.d,r:P.r,e:e,c:ctx});if(!(navigator.sendBeacon&&navigator.sendBeacon("/api/mm/proefev",new Blob([j],{type:"text/plain"}))))fetch("/api/mm/proefev",{method:"POST",body:j,keepalive:true,headers:{"content-type":"text/plain"}})}catch(x){}}`
    + `function e(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}`
    + `function sel(id,lab,opts){return '<div class="veld"><label for="'+id+'">'+e(lab)+'</label><select id="'+id+'">'+opts.map(function(o,i){return '<option value="'+i+'">'+e(Array.isArray(o)?o[0]:o)+'</option>'}).join("")+'</select></div>'}`
    + `function chips(key,lab,opts,multi){return '<div class="stack"><span class="lbl">'+e(lab)+'</span><div class="chips" data-k="'+key+'"'+(multi?' data-m="1"':'')+'>'+opts.map(function(o,i){return '<button type="button" class="chip" data-i="'+i+'" aria-pressed="false">'+e(o)+'</button>'}).join("")+'</div></div>'}`
    + `var LOC={nl:"nl-NL",de:"de-DE",en:"en-US"}[C.taal],CUR=C.taal==="en"?"USD":"EUR";function geld(v){var m=v>=1e6;try{return m?(C.taal==="en"?"$":"€ ")+(Math.round(v/1e5)/10).toLocaleString(LOC)+(C.taal==="nl"?" mln":C.taal==="de"?" Mio.":"M"):new Intl.NumberFormat(LOC,{style:"currency",currency:CUR,maximumFractionDigits:0}).format(Math.round(v/1e4)*1e4)}catch(x){return String(Math.round(v))}}`
    + `function bereik(lo,hi){if(lo>=1e6){var s=geld(hi),u=C.taal==="nl"?" mln":C.taal==="de"?" Mio.":"M";return geld(lo).replace(u,"")+" – "+s.replace(/^(\$|€ )/,"")}if(C.taal==="de")return geld(lo).replace(/\s?€$/,"")+" – "+geld(hi);var g=geld(hi);return geld(lo)+" – "+g.replace(/^(\$|€\s?)/,"").replace(/\s?€$/,"")}function fx(v){return (Math.round(v*100)/100).toLocaleString(LOC)+"×"}`
    + `D.addEventListener("click",function(ev){var c=ev.target.closest&&ev.target.closest(".chip");if(c){var box=c.parentNode,k=box.getAttribute("data-k"),i=+c.getAttribute("data-i");if(box.getAttribute("data-m")){var a=S.c[k]||[],p=a.indexOf(i);p<0?a.push(i):a.splice(p,1);S.c[k]=a;c.setAttribute("aria-pressed",p<0)}else{S.c[k]=i;[].forEach.call(box.children,function(b){b.setAttribute("aria-pressed",b===c)})}}if(ev.target.closest&&ev.target.closest("#tool button,#tool select,#tool input"))stap("tik")},true);`
    + `D.addEventListener("change",function(ev){if(ev.target.closest&&ev.target.closest("#tool"))stap("start")},true);`
    // stap 1: per hulpmiddel
    + `function waarde(){var t=C.t,h="";if(C.taal==="nl"){h=sel("s",t.sector,C.mult.sectoren)+sel("b",t.winst,C.banden)+sel("a",t.afh,t.afhO)}else if(C.taal==="de"){h=sel("s",t.sector,C.mult.sectoren)+sel("b",t.winst,C.banden)}else{h=sel("b",t.sector,C.banden)}`
    + `el.innerHTML=h+'<button class="btn" type="button" id="toon">'+e(t.toon)+'</button>';D.getElementById("toon").onclick=uitkomst}`
    + `function uitkomst(){var t=C.t,b=C.banden[+D.getElementById("b").value],mid=(b[1]+b[2])/2,lo,hi,txt;S.band=b[0];`
    + `if(C.taal==="nl"){var s=C.mult.sectoren[+D.getElementById("s").value],adj=[0.5,0,-1][+D.getElementById("a").value],m=Math.max(1.5,s[1]+adj+(+D.getElementById("b").value===0?-0.5:0));lo=mid*m*0.85;hi=mid*m*1.15;txt=t.basis(fx(m),s[2]?null:(s[0][1]===s[0][1].toLowerCase()?s[0].toLowerCase():s[0]),fx(s[1]));S.sector=s[0]}`
    + `else if(C.taal==="de"){var s2=C.mult.sectoren[+D.getElementById("s").value];lo=mid*s2[1];hi=mid*s2[2];txt=t.basis(fx(s2[1])+"–"+fx(s2[2]),s2[0]);S.sector=s2[0]}`
    + `else{var mm=mid*C.mult.klein<1e6?C.mult.klein:C.mult.groot;lo=mid*mm*0.85;hi=mid*mm*1.15;txt=t.basis(fx(mm));S.sector=""}`
    + `el.innerHTML='<p>'+e(t.waard)+'</p><div class="groot">'+e(bereik(lo,hi))+'</div><p>'+e(txt)+'</p><button class="btn" type="button" id="verder">'+e(t.verzegel)+'</button>';stap("uitkomst");D.getElementById("verder").onclick=function(){zegelForm("bedrijf")}}`
    + `function bod(){var t=C.t,h=(C.taal!=="en"?sel("s",t.sector,C.mult.sectoren):"")+sel("b",C.taal==="en"?t.sector:t.winst,C.banden)+'<div class="veld"><label for="bod">'+e(t.bod)+'</label><input id="bod" inputmode="numeric" autocomplete="off"></div>';`
    + `el.innerHTML=h+'<button class="btn" type="button" id="chk">'+e(({nl:"Check het bod",de:"Angebot prüfen",en:"Check the offer"})[C.taal])+'</button>';D.getElementById("chk").onclick=function(){var b=C.banden[+D.getElementById("b").value],mid=(b[1]+b[2])/2,amt=+String(D.getElementById("bod").value).replace(/[^0-9]/g,"")||0;if(!amt)return;var x=amt/mid,avg,txt;S.band=b[0];S.bod=amt;`
    + `if(C.taal==="nl"){var s=C.mult.sectoren[+D.getElementById("s").value];avg=s[1];S.sector=s[0];txt=t.bodTxt(fx(x),fx(avg),Math.round((1-x/avg)*100))}else if(C.taal==="de"){var s3=C.mult.sectoren[+D.getElementById("s").value];S.sector=s3[0];txt=t.bodTxt(fx(x),fx(s3[1])+"–"+fx(s3[2]),0)}else{avg=mid*C.mult.klein<1e6?C.mult.klein:C.mult.groot;txt=t.bodTxt(fx(x),fx(avg),Math.round((1-x/avg)*100))}`
    + `el.innerHTML='<div class="groot">'+e(fx(x))+'</div><p>'+e(txt)+'</p><button class="btn" type="button" id="verder">'+e(t.bodVerder)+'</button>';stap("uitkomst");D.getElementById("verder").onclick=function(){zegelForm("bod")}}}`
    + `function exec(){zegelForm("exec")}`
    // Calculations stay in the browser; only an enum is passed to the anonymous intake.
    + `function zegelForm(soort){location.href="/"+C.taal+"/seal?type="+(soort==="exec"?(C.soort==="toezicht"?"board":"career"):"sale")}`
    + `D.getElementById("start").onclick=function(){stap("start");({waarde:waarde,bod:bod,exec:exec})[C.tool]()};`
    + `})();</script>`;
}


const DETAILS = {
 nl: {
  waarde: ['Waar een waardering nog van afhangt', ['Welke winst is genormaliseerd en welke kosten horen bij jou als eigenaar?', 'Wat gebeurt met schuld, kasmiddelen en normaal werkkapitaal?', 'Hoeveel omzet is terugkerend en hoe afhankelijk is die van jou?', 'Welke betaling is zeker en welk deel blijft afhankelijk van toekomstige resultaten?']],
  verkopen: ['Leg deze voorwaarden eerst vast', ['Gehele of gedeeltelijke verkoop en het moment waarop je zou bewegen.', 'Wat er voor personeel, klanten en continuïteit moet blijven.', 'Jouw rol, tijdsbeslag en verantwoordelijkheid na de overdracht.', 'Betaling, financiering en wat je eerst van een koper wilt weten.']],
  bod: ['Vier vragen voordat je een bod vergelijkt', ['Welk bedrag krijg ik zeker, wanneer, en onder welke voorwaarden?', 'Welke cijfers bepalen een latere betaling en wie kan die beïnvloeden?', 'Zijn schuld, cash en werkkapitaal in de genoemde prijs verwerkt?', 'Welke informatie en afspraken ontbreken nog om twee biedingen te vergelijken?']],
  outplacement: ['Vragen voor een bureau', ['Wat verandert er concreet in de eerste maand?', 'Welke ervaring is relevant voor mijn gewenste volgende rol?', 'Wat valt binnen de prijs en wat wordt extra gefactureerd?', 'Hoe blijft mijn oriëntatie vertrouwelijk en wie krijgt welke gegevens?']],
  opentowork: ['Open to Work uitzetten', ['Open je LinkedIn-profiel en het Open to Work-vak.', 'Kies het potlood om het vak te bewerken.', 'Kies Verwijderen om de functie uit te zetten. Alleen zichtbaarheid veranderen zet haar niet uit.', 'Bepaal daarna welke voorwaarden een vertrouwelijke volgende stap waard zijn.']],
  headhunter: ['Een bruikbare eerste reactie', ['Het mandaat en de gewenste bijdrage worden uitgelegd.', 'De headhunter benoemt welke voorwaarden wel en niet passen.', 'Er wordt alleen om informatie gevraagd die voor die fase nodig is.', 'Voor voorstellen aan een opdrachtgever volgt afzonderlijk jouw toestemming.']],
  toezicht: ['Toets het mandaat', ['Expertise en bijdrage die de organisatie daadwerkelijk nodig heeft.', 'Beschikbare tijd, verantwoordelijkheid en informatievoorziening.', 'Onafhankelijkheid en potentiële belangenconflicten.', 'Wat je wilt weten voordat je je naam aan het proces verbindt.']]
 },
 en: {
  waarde: ['What a valuation still needs', ['A consistent profit measure and owner-specific adjustments.', 'Treatment of debt, cash and normal working capital.', 'Recurring revenue, concentration and dependence on the owner.', 'Separation of certain proceeds from future conditional consideration.']],
  verkopen: ['Set the conditions first', ['Full or partial transfer and the timing you would consider.', 'What should continue for staff, customers and operations.', 'Your role, time commitment and responsibilities after closing.', 'Payment, financing and what you need to understand about a buyer.']],
  bod: ['Four questions before comparing offers', ['What amount is certain, when is it paid, and what conditions apply?', 'What determines deferred payments and who can influence those measures?', 'How are debt, cash and working capital treated?', 'What information is still missing to compare two offers meaningfully?']],
  outplacement: ['Questions for a provider', ['What specifically changes in the first month?', 'What experience is relevant to the next role I want?', 'What is included in the price and what costs extra?', 'How is exploration kept confidential and who receives which information?']],
  opentowork: ['Turn off Open to Work', ['Open your LinkedIn profile and the Open to Work box.', 'Use the pencil to edit that box.', 'Choose Delete to disable the feature. Changing visibility alone does not turn it off.', 'Then define the conditions for a confidential next step.']],
  headhunter: ['A useful first response', ['The mandate and the contribution required are explained.', 'The headhunter identifies which conditions fit and which do not.', 'Requests for information are proportionate to the current step.', 'Any presentation to a client requires your separate consent.']],
  toezicht: ['Assess the mandate', ['The expertise and contribution the organisation actually needs.', 'Available time, responsibilities and access to information.', 'Independence and potential conflicts of interest.', 'What you need to know before joining the process by name.']]
 },
 de: {
  waarde: ['Was eine Bewertung noch benötigt', ['Konsistente Gewinnbasis und inhaberspezifische Anpassungen.', 'Behandlung von Schulden, Barmitteln und Betriebskapital.', 'Wiederkehrende Erlöse und Abhängigkeit vom Inhaber.', 'Sichere Erlöse getrennt von späteren bedingten Zahlungen.']],
  verkopen: ['Bedingungen zuerst festlegen', ['Gesamt- oder Teilverkauf und möglicher Zeitpunkt.', 'Kontinuität für Mitarbeiter, Kunden und Betrieb.', 'Eigene Rolle und Verantwortung nach der Übergabe.', 'Zahlung, Finanzierung und offene Fragen an einen Käufer.']],
  bod: ['Vier Fragen zum Kaufangebot', ['Welcher Betrag ist sicher und wann wird er gezahlt?', 'Was bestimmt spätere Zahlungen und wer beeinflusst diese Werte?', 'Wie werden Schulden, Barmittel und Betriebskapital behandelt?', 'Welche Angaben fehlen noch für einen sinnvollen Vergleich?']],
  outplacement: ['Fragen an einen Anbieter', ['Was verbessert sich konkret im ersten Monat?', 'Welche Erfahrung passt zu meiner nächsten Rolle?', 'Was ist im Preis enthalten und was kostet extra?', 'Wie bleibt die Orientierung vertraulich und wer erhält welche Daten?']],
  headhunter: ['Eine brauchbare erste Antwort', ['Mandat und erwarteter Beitrag werden erklärt.', 'Passende und unpassende Bedingungen werden benannt.', 'Angaben werden nur für den aktuellen Schritt angefragt.', 'Eine Vorstellung beim Auftraggeber erfordert gesonderte Zustimmung.']]
 }
};
function detailBlok(p) { const d=DETAILS[p.taal]?.[p.paar];return d?`<section class="stack"><h2>${esc(d[0])}</h2><ul class="k">${d[1].map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${p.paar==='opentowork'?'<p><a href="https://www.linkedin.com/help/linkedin/answer/a507508" rel="noopener noreferrer">LinkedIn Help: Open to Work</a></p>':''}<p><a href="${extraUrl(p.taal,'succession')}">${esc(EXTRA_GROUPS.succession[p.taal].title)}</a> · <a href="${extraUrl(p.taal,'quality')}">${esc(FLOW[p.taal].quality)}</a></p></section>`:''; }
export function renderSealedSpecial(taal, slug, { gscMeta } = {}) {
 const p=findExtra(taal,slug), C=FLOW[taal], privatePage=['seal','manage','partners'].includes(slug);
 if(!p&&!privatePage)return null;
 const title=p?.title||(slug==='manage'?C.privateTitle:slug==='partners'?C.partnerTitle:C.seal);
 const desc=p?.desc||C.intro, alts=p?Object.fromEntries(Object.entries(EXTRA_GROUPS[p.kind]).map(([t,x])=>[t,BASE+'/'+t+'/'+x.slug])):{};
 const canon=BASE+'/'+taal+'/'+(slug==='partners'?PARTIJ[taal].slug:slug);
 const ld={'@context':'https://schema.org','@graph':[ORG,SITE_LD,{'@type':'WebPage',url:canon,name:title,description:desc,inLanguage:LOC[taal],dateModified:EXTRA_DATE}]};
 let html=kop({taal,title,desc,canon,alternates:[...Object.entries(alts),['x-default',alts.en||canon]],ld,gscMeta});
 // These pages have no variant allocation; render them immediately without the marketing flicker guard.
 html=html.replace(/<script>\(function\(h\)\{h\.classList\.add\('cm-wacht'\);[\s\S]*?document\.documentElement\)<\/script>/,'');
 if(privatePage)html=html.replace('content="index,follow,max-snippet:-1,max-image-preview:large"','content="noindex,follow"').replace('<script src="/cm.js" data-site="sealed" async></script>','');
 let body;
 if(slug==='manage')body=manageMarkup(taal);
 else if(slug==='seal'||slug==='partners')body=`<h1>${esc(title)}</h1>`+intakeMarkup(taal,slug==='partners');
 else body=`<p class="meta"><time datetime="${EXTRA_DATE}">${esc(datumTekst(taal))}</time></p><h1>${esc(title)}</h1><p class="gedachte">${esc(desc)}</p>`+p.sections.map(([h,text,items])=>`<section class="stack"><h2>${esc(h)}</h2><p>${esc(text)}</p>${items?`<ul class="k">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</section>`).join('')+(p.sources?`<section class="stack"><h2>${esc(UI[taal].bronnen)}</h2><ul class="k">${p.sources.map(([name,u])=>`<li><a href="${esc(u)}" rel="noopener noreferrer">${esc(name)}</a></li>`).join('')}</ul></section>`:'')+`<p><a class="btn" href="/${taal}/seal${p.kind==='succession'?'?type=succession':''}">${esc(C.seal)}</a></p>`;
 body+=`<nav class="stack">${Object.keys(EXTRA_GROUPS).filter(k=>k!==p?.kind).map(k=>`<a href="${extraUrl(taal,k)}">${esc(EXTRA_GROUPS[k][taal].title)}</a>`).join('')}<a href="/${taal}">${esc(UI[taal].naam)}</a></nav>`;
 return html+header(taal,alts)+`<main><article class="sealed-special">${body}</article></main>`+footer(taal,!privatePage)+`</body></html>`;
}

// Aggregate browser signals only. No profile, IP, query string, referrer URL or visitor ID is sent.
const GROWTH_SCRIPT = `<script>(function(){try{if(navigator.webdriver||/bot|crawler|spider|headless/i.test(navigator.userAgent))return;var q=new URLSearchParams(location.search),r='';try{r=new URL(document.referrer).hostname}catch(e){}var source=q.get('utm_medium')||'',c=/cpc|ppc|paid|display/i.test(source)||q.has('gclid')||q.has('msclkid')?'paid':/email/i.test(source)||/outreach/i.test(q.get('utm_source')||'')?'email':/(^|\\.)(chatgpt\\.com|chat\\.openai\\.com|perplexity\\.ai|claude\\.ai|gemini\\.google\\.com|copilot\\.microsoft\\.com)$/.test(r)?'ai':/(^|\\.)(google\\.[a-z.]+|bing\\.com|duckduckgo\\.com|search\\.yahoo\\.com)$/.test(r)?'search':'direct-unknown';if(c==='direct-unknown')c=sessionStorage.getItem('si_source_v2')||c;sessionStorage.setItem('si_source_v2',c);var k='si_visit_v2:'+new Date().toISOString().slice(0,10);if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1');fetch('/api/sealed?op=visit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({channel:c}),keepalive:true}).catch(function(){})}catch(e){}})()</script>`;
