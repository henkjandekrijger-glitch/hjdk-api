// Bookstuffers (bookstuffers.com): pagina's, opmaak en teksten. Henkjan 22 nov 2026: "Ja bookstuffers doen we", "Voer je plan uit",
// "gebruik de sealedintent.com design", "Boeken wel altijd pic natuurlijk geven . Dat is dan kleur op de pagina", en een aparte pagina voor
// Lasting Change "voor mensen die helemaal geen flikker gedaan hebben en nu wel dit komend jaar willen scoren".
// Opzet (ZICHT): weinig sterke pagina's op gelegenheid en ontvanger, geen pagina per zoekvariant; het antwoord bovenaan; aantallen komen
// uit de data (nooit met de hand); alleen feiten uit de listing; wij zeggen dat wij de uitgever zijn; links recht naar Amazon zonder tag.
// Opmaak: de kleuren, het lettertype en de maten van sealedintent.com (lib/sealed.js): één tekstmaat, geen grijs, de omslagen zijn de kleur.
import { BOEKEN, LC, SOORT, PUZZELS, PRIJS_DATUM, ANDER, GROEP } from './bs-data.js';
import { meetJs } from './bsmeet.js';
import { MOPPEN, MOP_GROEP, QUIZ, KLEUR } from './bsxmas.js';

export const HOST = 'stockingbooks.com', BASE = 'https://' + HOST;
export const BIJGEWERKT = '2026-11-23'; // alleen ophogen bij een echte wijziging van inhoud (eerlijke lastmod)
export const INDEXNOW_KEY = '5abf3f017f44047e41ec98545041a2cf';
export const SLUGS = ['christmas-jokes', 'christmas-trivia', 'christmas-coloring-pages', '', 'white-elephant-rules', 'white-elephant-gifts-under-10', 'stocking-stuffers', 'free-printable-christmas-word-search', 'book-of-enoch', 'apocrypha', 'all-books', 'about', 'stocking-stuffers-for-women', 'stocking-stuffers-for-men', 'stocking-stuffers-for-teens', 'white-elephant-gift-ideas', 'secret-santa-generator'];
export const LC_URL = 'https://lastingchange.works/'; // Lasting Change heeft sinds 22 nov 2026 zijn eigen funnel (lib/lcfunnel.js); bookstuffers.com/lasting-change stuurt daarheen
const BEDRIJF = 'Stocking Books is a service of Adsfair B.V., Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands.';
const ORG = { '@type': 'Organization', name: 'Stocking Books', url: BASE + '/' };

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const usd = p => '$' + Number(p).toFixed(2);
const dag = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
export const amz = a => 'https://www.amazon.com/dp/' + a;
export const AMZ_ARROW = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const omslag = (i, w = 500) => `https://m.media-amazon.com/images/I/${i}._SL${w}_.jpg`;

// Selecties: alle tellingen op de site komen hieruit.
const WE = BOEKEN.filter(b => b.we), WE10 = WE.filter(b => b.p < 10), WE_DUUR = WE.filter(b => b.p >= 10);
const tot5 = l => l.filter(b => b.p <= 5).length;
const voor = v => BOEKEN.filter(b => [].concat(v).includes(b.v));
const soort = (l, k) => l.filter(b => b.k === k);
export const TEL = { alles: BOEKEN.length + ANDER.length + 1, boeken: BOEKEN.length, tot5: tot5(BOEKEN), we10: WE10.length, weTot5: tot5(WE10) };

export const CSS = `
:root{--ink:#111113;--line:#E5E7EB}
*,*::before,*::after{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:#fff;color:var(--ink);font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--ink);text-decoration:none}a:hover{text-decoration:underline}
a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.top-in{max-width:1040px;margin:0 auto;padding:22px 26px;display:flex;align-items:center;gap:16px}
.merk{display:flex;align-items:center;gap:10px;font-weight:700;font-size:20px;letter-spacing:-.02em}.merk:hover{text-decoration:none}.merk span span{font-weight:400}
.top-in nav{margin-left:auto}
main{max-width:680px;margin:0 auto;padding:48px 26px 0}
h1,h2,h3{margin:0;text-wrap:balance}
h1{font-size:clamp(24px,3.4vw,30px);line-height:1.15;letter-spacing:-.03em;font-weight:700}
h2{font-size:20px;line-height:1.3;letter-spacing:-.02em;font-weight:700}
h3{font-size:17px;line-height:1.4;font-weight:700}
p{margin:0}
article{display:flex;flex-direction:column;gap:44px}.kopblok{display:flex;flex-direction:column;gap:10px}
.stack{display:flex;flex-direction:column;gap:16px}
.meta,.eb{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.btn,.pill{font:inherit;border:1px solid var(--ink);border-radius:999px;padding:10px 22px;line-height:1.3;min-height:46px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;text-decoration:none}
.btn{align-self:flex-start;background:var(--ink);color:#fff;font-weight:600}.btn:hover,.pill:hover{text-decoration:none}
.pill{background:#fff;color:var(--ink)}
.amz-cta{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:56px;padding:14px 20px;border:2px solid var(--ink);border-radius:10px;background:var(--ink);color:#fff;font:inherit;font-weight:700;line-height:1.3;text-align:center;text-decoration:none}
.amz-cta svg{flex:0 0 20px}
a.amz-cta:hover,.boek:hover .amz-cta{background:#000;border-color:#000;text-decoration:none}
.amz-cta-secondary{background:#fff;color:var(--ink)}
a.amz-cta-secondary:hover{background:#fff;color:#000}
.boek .amz-cta{width:100%;margin-top:12px;font-size:17px;padding:12px 10px}
@media (max-width:560px){a.amz-cta{width:100%}}
.link{background:none;border:0;padding:0;color:var(--ink);font:inherit;font-weight:600;cursor:pointer;text-decoration:underline;text-underline-offset:3px;align-self:flex-start}
.sprong{display:flex;flex-wrap:wrap;gap:8px}
.plank{display:grid;grid-template-columns:repeat(3,1fr);gap:28px 18px}
.boek{display:flex;flex-direction:column;gap:4px;min-width:0}.boek:hover{text-decoration:none}.boek:hover b{text-decoration:underline}
.boek img{width:100%;height:auto;aspect-ratio:3/4;object-fit:contain;border:1px solid var(--line);border-radius:8px;margin-bottom:8px;background:#fff}
.boek b{font-weight:600;line-height:1.35;overflow-wrap:anywhere}.boek span{font-size:13px}.boek .prijs{font-size:17px;font-weight:700}
.tool,.kaartp{border:1px solid var(--line);border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:16px}.kaartp{border-color:var(--ink)}
label{font-weight:600}.veld{display:flex;flex-direction:column;gap:8px}
input,textarea{width:100%;font:inherit;color:var(--ink);background:#fff;border:1px solid var(--ink);border-radius:999px;padding:10px 20px;min-height:46px;line-height:1.3}textarea{border-radius:16px}
.stappen,.volgorde,ul.k{margin:0;padding-left:1.3em;display:flex;flex-direction:column;gap:8px}.stappen li::marker,.volgorde li::marker{font-weight:700}
.tabel{border-collapse:collapse;width:100%}.tabel th,.tabel td{text-align:left;padding:11px 10px 11px 0;border-bottom:1px solid var(--line);vertical-align:top}.tabel th{font-size:13px;letter-spacing:.06em;text-transform:uppercase}
.citaat{border-left:3px solid var(--ink);padding-left:16px;font-weight:600}
.faq{display:flex;flex-direction:column;gap:22px}.faq div{display:flex;flex-direction:column;gap:6px}
.held{display:grid;grid-template-columns:1fr 200px;gap:28px;align-items:start}.held img{width:100%;height:auto;border:1px solid var(--line);border-radius:8px}
.ws{border-collapse:collapse;margin:0 auto;font-weight:700;font-size:min(20px,3.9vw);line-height:1}.ws td{width:1.9em;height:1.9em;text-align:center;border:1px solid var(--line);padding:0}
.pz{display:flex;flex-direction:column;gap:16px}.pz.antw td.o{background:var(--ink);color:#fff}
.woorden{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:6px 12px;font-weight:600}
.knoppen{display:flex;flex-wrap:wrap;align-items:center;gap:14px 22px}
.meer{margin-top:28px}.meer a{display:flex;justify-content:space-between;gap:16px;border-top:1px solid var(--line);padding:16px 0;font-weight:600}.meer a:last-child{border-bottom:1px solid var(--line)}.meer a::after{content:"\\2192"}
.klein{font-size:13px}
footer{border-top:1px solid var(--line);margin-top:72px}footer div{max-width:680px;margin:0 auto;padding:18px 26px 26px;font-size:13px;display:flex;flex-direction:column;gap:6px}
#printzone{display:none}
@media (max-width:560px){.top-in,main{padding-left:20px;padding-right:20px}main{padding-top:28px}.plank{grid-template-columns:repeat(2,1fr)}.held{grid-template-columns:1fr}.held>a{order:-1}.held img{max-width:140px}.btn{align-self:stretch}article{gap:36px}}
@media print{body.pr>*:not(#printzone){display:none!important}body.pr #printzone{display:block}.np{display:none!important}.ws td{border-color:#000}}
`;

// Printen (één blok: de regelkaart of één puzzel), antwoorden tonen en de nummertrekker. Geen bibliotheken, geen netwerk.
const JS = `(function(){var D=document;D.addEventListener('click',function(e){var t=e.target.closest('[data-print],[data-antw],#trek');if(!t)return;
var id=t.getAttribute('data-print');if(id){var z=D.getElementById('printzone');z.innerHTML=D.getElementById(id).outerHTML;D.body.classList.add('pr');window.print();setTimeout(function(){D.body.classList.remove('pr');z.innerHTML=''},800);return}
id=t.getAttribute('data-antw');if(id){var s=D.getElementById(id);s.classList.toggle('antw');t.textContent=s.classList.contains('antw')?'Hide the answers':'Show the answers';return}
var namen=D.getElementById('namen').value.split('\\n').map(function(x){return x.trim()}).filter(Boolean),n=namen.length||Math.max(2,Math.min(80,parseInt(D.getElementById('spelers').value,10)||12)),a=[];
for(var i=0;i<n;i++)a.push(namen.length?namen[i]:String(i+1));
for(i=a.length-1;i>0;i--){var r=new Uint32Array(1);crypto.getRandomValues(r);var j=r[0]%(i+1),x=a[i];a[i]=a[j];a[j]=x}
var o=D.getElementById('volgorde'),u=D.getElementById('uitleg');o.innerHTML='';a.forEach(function(v){var li=D.createElement('li');li.textContent=namen.length?v:'Number '+v;o.appendChild(li)});o.hidden=false;
u.textContent=namen.length?'This is the playing order. The first name opens the first gift.':'Hand these out in this order as people arrive. Number 1 opens the first gift.';u.hidden=false;t.textContent='Draw again'})})();`;

export const LOGO = '<svg width="24" height="24" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#111113"/><path d="M10 9h8a4 4 0 0 1 4 4v10h-8a4 4 0 0 1-4-4V9Z" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>';
export const FAVICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#111113"/><g fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"><path d="M8 7h10a6 6 0 0 1 6 6v12H14a6 6 0 0 1-6-6V7Z"/><path d="M8 19a6 6 0 0 1 6-6h10"/></g></svg>';

// --- bouwstenen -------------------------------------------------------------------------------------------------------------------
let GO = a => '/go/' + a; // per render gezet: op het domein /go/<ASIN>, in het voorbeeld /api/bs?op=go&a=<ASIN>
function kaart(b, snel) {
  return `<a class="boek" href="${GO(b.a)}" data-bs="${b.a}" aria-label="View ${esc(b.t)} on Amazon" rel="noopener"><img src="${omslag(b.i)}" alt="${esc(b.t)}, book cover" width="375" height="500" loading="${snel ? 'eager' : 'lazy'}" decoding="async"><b>${esc(b.t)}</b><span>${b.k ? SOORT[b.k][0] + ', ' : ''}${b.n} pages${b.c >= 10 ? ` · ★ ${b.r} (${b.c} ratings)` : ''}</span><span class="prijs">${usd(b.p)} on Amazon</span><span class="amz-cta" aria-hidden="true">View on Amazon ${AMZ_ARROW}</span></a>`;
}
const plank = (lijst, snel = 0) => `<div class="plank">${lijst.map((b, i) => kaart(b, i < snel)).join('')}</div>`;
const faq = paren => `<section class="stack"><h2>Questions people ask</h2><div class="faq">${paren.map(([v, a]) => `<div><h3>${esc(v)}</h3><p>${esc(a)}</p></div>`).join('')}</div></section>`;
const faqLd = paren => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: paren.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const lijstLd = (naam, lijst) => ({ '@context': 'https://schema.org', '@type': 'ItemList', name: naam, numberOfItems: lijst.length, itemListElement: lijst.map((b, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Book', name: b.t, image: omslag(b.i), url: amz(b.a), numberOfPages: b.n, bookFormat: 'https://schema.org/Paperback', offers: { '@type': 'Offer', price: Number(b.p).toFixed(2), priceCurrency: 'USD', url: amz(b.a) } } })) });
const PRIJSREGEL = `Prices and page counts as we saw them on Amazon.com on ${dag(PRIJS_DATUM)}. The price on Amazon is the one that counts.`;

function pagina(c, o) {
  const canon = BASE + '/' + o.slug, L = c.L;
  const ld = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: o.title, description: o.desc, url: canon, dateModified: BIJGEWERKT, inLanguage: 'en-US', isPartOf: { '@type': 'WebSite', name: 'Stocking Books', url: BASE + '/' }, publisher: ORG }, ...(o.ld || [])];
  if (o.slug) ld.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Stocking Books', item: BASE + '/' }, { '@type': 'ListItem', position: 2, name: o.kruimel || o.h1, item: canon }] });
  const nav = [['christmas-coloring-pages', 'Free Christmas coloring pages'], ['christmas-jokes', 'Christmas jokes'], ['christmas-trivia', 'Christmas trivia'], ['secret-santa-generator', 'Secret Santa generator'], ['white-elephant-gift-ideas', 'White elephant gift ideas'], ['stocking-stuffers-for-women', 'Stocking stuffers for women'], ['stocking-stuffers-for-men', 'Stocking stuffers for men'], ['stocking-stuffers-for-teens', 'Stocking stuffers for teens'], ['white-elephant-rules', 'White elephant rules'], ['white-elephant-gifts-under-10', 'White elephant gifts under $10'], ['stocking-stuffers', 'Stocking stuffer books'], ['free-printable-christmas-word-search', 'Free printable word search'], ['book-of-enoch', 'What is the Book of Enoch?'], ['apocrypha', 'What is the Apocrypha?'], ['all-books', 'Every book we publish'], ['about', 'About']];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="referrer" content="no-referrer">`
    + `<title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}"><meta name="robots" content="${c.echt ? 'index,follow,max-snippet:-1,max-image-preview:large' : 'noindex,nofollow'}"><link rel="canonical" href="${canon}">`
    + `<meta property="og:type" content="website"><meta property="og:site_name" content="Stocking Books"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${omslag(o.beeld || BOEKEN[0].i)}">`
    + `<link rel="icon" type="image/svg+xml" href="${c.echt ? '/favicon.svg' : '/api/bs?op=fav'}"><meta name="theme-color" content="#111113"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://m.media-amazon.com">`
    + `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"><style>${CSS}</style>`
    + ld.map(x => `<script type="application/ld+json">${json(x)}</script>`).join('')
    + `<script src="/cm.js" data-site="bookstuffers" async></script></head><body><div class="w">`
    + `<header><div class="top-in"><a class="merk" href="${L('')}">${LOGO}<span>stocking<span>books</span></span></a>${o.slug === 'white-elephant-rules' ? '' : `<nav><a href="${L('white-elephant-rules')}">White elephant rules</a></nav>`}</div></header>`
    + `<main><article><div class="kopblok"><p class="meta">Updated <time datetime="${BIJGEWERKT}">${dag(BIJGEWERKT)}</time></p><h1>${esc(o.h1)}</h1></div>${o.body}</article>`
    + `<nav class="meer np" aria-label="More"><p class="eb">More</p>${nav.filter(([s]) => s !== o.slug).map(([s, t]) => `<a href="${L(s)}">${esc(t)}</a>`).join('')}</nav></main>`
    + `<footer class="np"><div><p>We publish every book on this shelf. Links go straight to Amazon, without affiliate tags.</p><p>${esc(PRIJSREGEL)}</p><p>© 2026 Stocking Books · ${esc(BEDRIJF)}</p></div></footer>`
    + `<div id="printzone"></div><script>${JS}${plannerJs}${o.extraJs || ''}${meetJs('bs', '/api/bs?op=tel')}</script></body></html>`;
}

// --- woordzoeker (vaste uitkomst per zaadje) ----------------------------------------------------------------------------------------
function rng(z) { return () => { z = z + 0x6D2B79F5 | 0; let t = Math.imul(z ^ z >>> 15, 1 | z); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function woordzoeker({ woorden, zaad }, N = 15) {
  const r = rng(zaad), g = Array.from({ length: N }, () => Array(N).fill('')), op = Array.from({ length: N }, () => Array(N).fill(0));
  const R = [[0, 1], [1, 0], [1, 1]]; // naar rechts, naar beneden, schuin naar beneden; nooit achterstevoren (grote letters, makkelijk)
  for (const w of [...woorden].sort((a, b) => b.length - a.length)) {
    let gezet = false;
    for (let poging = 0; poging < 500 && !gezet; poging++) {
      const [dy, dx] = R[Math.floor(r() * R.length)], y = Math.floor(r() * (N - dy * (w.length - 1))), x = Math.floor(r() * (N - dx * (w.length - 1)));
      let kan = true; for (let k = 0; k < w.length; k++) { const ch = g[y + dy * k][x + dx * k]; if (ch && ch !== w[k]) { kan = false; break; } }
      if (!kan) continue;
      for (let k = 0; k < w.length; k++) { g[y + dy * k][x + dx * k] = w[k]; op[y + dy * k][x + dx * k] = 1; }
      gezet = true;
    }
    if (!gezet) throw new Error('woord past niet: ' + w);
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!g[y][x]) g[y][x] = 'ABCDEFGHIJKLMNOPRSTUVWY'[Math.floor(r() * 23)];
  return { g, op };
}
function puzzelHtml(p) {
  const { g, op } = woordzoeker(p);
  return `<section class="pz" id="${p.id}"><h2>${esc(p.naam)}</h2><table class="ws" aria-label="${esc(p.naam)} word search grid">${g.map((rij, y) => `<tr>${rij.map((ch, x) => `<td${op[y][x] ? ' class="o"' : ''}>${ch}</td>`).join('')}</tr>`).join('')}</table><ul class="woorden">${p.woorden.map(w => `<li>${w}</li>`).join('')}</ul></section>`
    + `<p class="knoppen np"><button class="btn" type="button" data-print="${p.id}">Print this puzzle</button><button class="link" type="button" data-antw="${p.id}">Show the answers</button></p>`;
}

// --- pagina's ---------------------------------------------------------------------------------------------------------------------
const REGELS = [
  'Agree on a price limit before the party. $10, $20 and $25 are common.',
  'Everyone brings one wrapped gift and puts it in the middle.',
  'Draw numbers to set the playing order.',
  'Player 1 picks a gift and opens it.',
  'Each next player steals an open gift or opens a new one.',
  'If your gift is stolen, steal a different open gift or open a new one. You cannot take back the gift that was just taken from you.',
  'A gift is frozen after it has been stolen three times. It stays with that player.',
  'When the last gift is open, player 1 may swap with any gift that is not frozen. Then the game is over.',
];

function home(c) {
  const L = c.L, vrouwen = voor('women'), mannen = voor('men'), jong = voor(['kids', 'teens']);
  const title = 'Stocking Books: Small Gift Books From $4.99 for Stockings and Swaps';
  const desc = `${TEL.boeken} small paperbacks for a stocking or a white elephant swap: dad jokes, fact books, bathroom word search and Christmas sudoku. ${TEL.tot5} cost $5 or less.`;
  const blok = (kop, tekst, lijst, slug, anker, linktekst, snel) => `<section class="stack"><h2>${kop}</h2><p>${tekst}</p>${plank(lijst.slice(0, 6), snel)}<p><a href="${L(slug)}${anker}">${linktekst}</a></p></section>`;
  const body = `<p class="intro">${TEL.boeken} paperbacks we publish ourselves. ${TEL.tot5} of them cost $5 or less, and every one ships from Amazon.</p>`
    + `<a class="btn" href="${L('white-elephant-gift-ideas')}">See the white elephant picks</a>`
    + `<nav class="meer"><p class="eb">Christmas guides and free tools</p><a href="${L('secret-santa-generator')}">Free Secret Santa generator</a><a href="${L('stocking-stuffers-for-women')}">Stocking stuffers for women</a><a href="${L('stocking-stuffers-for-men')}">Stocking stuffers for men</a><a href="${L('stocking-stuffers-for-teens')}">Stocking stuffers for teens</a><a href="${L('white-elephant-gift-ideas')}">White elephant gift ideas</a><a href="${L('white-elephant-rules')}">White elephant rules and number picker</a><a href="${L('free-printable-christmas-word-search')}">12 free printable Christmas word searches</a></nav>`
    + blok('For a white elephant swap', 'Funny, flat to wrap and under $10.', WE10, 'white-elephant-gifts-under-10', '', `All ${WE10.length} white elephant books under $10`, 3)
    + blok('For her stocking', 'Sudoku for a quiet morning and logbooks that say it out loud.', vrouwen, 'stocking-stuffers', '#for-her', `All ${vrouwen.length} books for her`)
    + blok('For his stocking', 'Dad jokes, rare facts and a place to rate every beer.', mannen, 'stocking-stuffers', '#for-him', `All ${mannen.length} books for him`)
    + blok('For kids and teens', 'Coloring, word search and 408 facts for the back seat.', jong, 'stocking-stuffers', '#for-kids-and-teens', `All ${jong.length} books for kids and teens`)
    + `<section class="tool"><h2>Free to print</h2><p>Twelve Christmas word search puzzles in large print and twelve easy coloring pages. Print them at home, no sign-up.</p><p class="knoppen"><a class="btn" href="${L('free-printable-christmas-word-search')}">Open the free puzzles</a><a class="link" href="${L('christmas-coloring-pages')}">Free coloring pages</a></p></section>`
    + `<section class="tool"><h2>For the Christmas table</h2><p>${Object.values(MOPPEN).flat().length} clean Christmas jokes and a ${QUIZ.reduce((x, [, l]) => x + l.length, 0)}-question Christmas trivia quiz with answers.</p><p class="knoppen"><a class="btn" href="${L('christmas-jokes')}">Christmas jokes</a><a class="link" href="${L('christmas-trivia')}">Christmas trivia</a></p></section>`
    + `<section class="tool"><h2>Playing white elephant?</h2><p>The rules in 8 steps, a card to print and a free number picker for the playing order.</p><a class="link" href="${L('white-elephant-rules')}">Read the white elephant rules</a></section>`
    + `<section class="held"><div class="stack"><h2>Did nothing this year?</h2><p>The Lasting Change Workbook is 30 days, one habit and a daily check-in, for the year you stop starting over.</p><p><a href="${LC_URL}">I am not doing that again</a></p></div><a href="${LC_URL}"><img src="${omslag(LC.i)}" alt="Lasting Change Workbook, book cover" width="333" height="500" loading="lazy" decoding="async"></a></section>`;
  const restLijst = `<nav class="meer"><p class="eb">The rest of our shelf</p>${Object.entries(GROEP).map(([g, kop]) => [g, kop, ANDER.filter(b => b.g === g).length]).filter(x => x[2]).map(([g, kop, n]) => `<a href="${L('all-books')}#${g}">${esc(kop)} (${n})</a>`).join('')}</nav>`;
  return pagina(c, { slug: '', title, desc, h1: 'Small gift books that fit in a stocking', body: body + restLijst, ld: [lijstLd('White elephant books under $10', WE10.slice(0, 6))] });
}

function regels(c) {
  const L = c.L;
  const vragen = [
    ['What is a white elephant gift exchange?', 'A party game where everyone brings one wrapped gift. Players draw numbers, and on your turn you either open a new gift or steal one that is already open. The fun is in the stealing, so the best gifts change hands a few times before the game ends.'],
    ['How many times can a gift be stolen in white elephant?', 'Most groups allow three steals per gift. After the third steal the gift is frozen and stays with that player. Your group can pick another number, as long as everyone hears it before the first gift is opened.'],
    ['Is there a white elephant number generator?', 'Yes. The free number picker on this page draws a random playing order for 2 to 80 players. Add names for a list to read out, or leave the names empty and hand out the numbers.'],
    ['What is a good white elephant gift under $10?', `Something small that gets a laugh when it is opened. We publish ${WE10.length} funny paperbacks under $10 for this, from dad jokes to bathroom word search, starting at $4.99.`],
    ['How many people do you need for white elephant?', 'Six is a good minimum and it works up to 30 or more. With big groups, allow one steal per turn so everyone gets a go.'],
    ['Can you steal a gift back right away?', 'No. In standard rules you cannot take back the gift that was just stolen from you on the same turn. You steal something else or open a new gift.'],
    ['Do you have to open the gift you pick?', 'Yes. You open it right away so everyone can see what is in play.'],
    ['What is the difference between white elephant and Secret Santa?', 'In white elephant nobody knows who gets which gift: gifts are opened in turn and can be stolen. In Secret Santa each person is given one name and buys a gift for that person.'],
  ];
  const body = `<p class="intro">Everyone brings one wrapped gift and draws a number. On your turn you open a new gift or steal one that is already open. Most groups freeze a gift after its third steal, and when the last gift is open, player 1 may swap once.</p>`
    + `<section class="kaartp" id="rules-card"><h2>White elephant rules in 8 steps</h2><ol class="stappen">${REGELS.map(r => `<li>${esc(r)}</li>`).join('')}</ol><p>House rules differ. Say yours out loud before the first gift is opened.</p></section>`
    + `<p class="knoppen np"><button class="btn" type="button" data-print="rules-card">Print the rules card</button></p>`
    + `<section class="tool np" id="number-picker"><h2>Free number picker</h2><div class="veld"><label for="spelers">How many players?</label><input id="spelers" type="number" inputmode="numeric" min="2" max="80" value="12"></div><div class="veld"><label for="namen">Names, one per line (optional)</label><textarea id="namen" rows="4" placeholder="Leave empty to draw plain numbers"></textarea></div><button class="btn" type="button" id="trek">Draw the order</button><p id="uitleg" hidden></p><ol class="volgorde" id="volgorde" hidden></ol></section>`
    + `<section class="stack"><h2>Yankee Swap, Dirty Santa and other names</h2><p>Yankee Swap and Dirty Santa are regional names for the same game. Some groups limit steals to one per turn, some let player 1 go again at the end and some play with a theme. Whatever you call it, the price limit and the steal limit are the two rules to settle first.</p></section>`
    + `<section class="stack"><h2>Variations people play</h2><table class="tabel"><thead><tr><th>Variation</th><th>What changes</th></tr></thead><tbody><tr><td><b>Yankee Swap</b></td><td>The New England name. Often player 1 gets a final swap at the end.</td></tr><tr><td><b>Dirty Santa</b></td><td>The Southern name, usually with more steals allowed.</td></tr><tr><td><b>Dice white elephant</b></td><td>Everyone opens a gift first, then players roll a die: on a 1 or 2 you swap left, 3 or 4 swap right, 5 steal from anyone, 6 keep.</td></tr><tr><td><b>One steal per turn</b></td><td>A stolen player must open a new gift instead of stealing back. Faster with big groups.</td></tr><tr><td><b>Theme swap</b></td><td>Every gift fits one theme: books, regifts, made at home, or under $5.</td></tr><tr><td><b>Online swap</b></td><td>Gifts are mailed ahead and opened on camera in number order; steals work the same.</td></tr></tbody></table></section>`
    + `<section class="stack"><h2>Hosting tips</h2><ul class="k"><li>Put the price limit in the invite, and say whether gag gifts are welcome.</li><li>Draw numbers as people arrive, so late guests still get a turn.</li><li>With more than 20 players, use one steal per turn or the game drags.</li><li>Keep a few spare $5 gifts for guests who forget.</li><li>Freeze after three steals. It ends the fights and the game.</li></ul></section>`
    + `<section class="stack"><h2>What to bring for a $5 or $10 limit</h2><p>A funny paperback is the easy pick: it wraps flat and nobody can guess it from the shape. ${TEL.weTot5} of ours cost $5 or less.</p>${plank(WE10.slice(0, 6))}<p><a href="${L('white-elephant-gift-ideas')}">More white elephant gift ideas by price</a></p></section>`
    + `<section class="tool"><h2>Drawing names instead?</h2><p>For Secret Santa, our free generator draws names and sends everyone a private link.</p><a class="link" href="${L('secret-santa-generator')}">Open the Secret Santa generator</a></section>`
    + faq(vragen);
  return pagina(c, { slug: 'white-elephant-rules', title: 'White Elephant Rules: How to Play the Gift Exchange Game', desc: 'The white elephant gift exchange rules in 8 steps, a rules card to print and a free number picker that draws the playing order for your party.', h1: 'White elephant rules', body, ld: [faqLd(vragen)] });
}

function onderTien(c) {
  const L = c.L, n = WE10.length;
  const vragen = [
    ['What are good white elephant gifts under $5?', `${TEL.weTot5} of the books on this page cost $5 or less on Amazon as of ${dag(PRIJS_DATUM)}, including every single-volume bathroom word search.`],
    ['What if our limit is $15, $20 or $25?', `Pick one of the bigger fact and joke books further down this page, or wrap two of the $4.99 books together.`],
    ['Who publishes these books?', 'We do. Stocking Books is the shelf for our own paperbacks, so we earn the publisher royalty when you buy one. Links go straight to Amazon, without affiliate tags.'],
  ];
  const groepen = ['jokes', 'facts', 'bathroom', 'password', 'journal'].map(k => [SOORT[k][1], soort(WE10, k)]).filter(([, l]) => l.length);
  const body = `<p class="intro">A funny paperback is the easy pick for a $5 or $10 limit: it wraps flat and nobody can guess it from the shape. We publish all ${n} books below, and ${TEL.weTot5} of them cost $5 or less.</p>`
    + `<a class="btn" href="#${groepen[0][0].toLowerCase().replace(/[^a-z]+/g, '-')}">Show me the ${n} books</a>`
    + groepen.map(([kop, l], gi) => `<section class="stack" id="${kop.toLowerCase().replace(/[^a-z]+/g, '-')}"><h2>${esc(kop)}</h2>${plank(l, gi === 0 ? 3 : 0)}</section>`).join('')
    + `<section class="stack"><h2>Is your limit $15, $20 or $25?</h2><p>These are bigger books of facts and jokes.</p>${plank(WE_DUUR)}</section>`
    + `<section class="tool"><h2>Need the rules?</h2><p>Eight steps, a card to print and a free number picker.</p><a class="link" href="${L('white-elephant-rules')}">Read the white elephant rules</a></section>`
    + faq(vragen);
  return pagina(c, { slug: 'white-elephant-gifts-under-10', title: `White Elephant Gifts Under $10: ${n} Funny Books From $4.99`, desc: `${n} funny paperbacks for a white elephant gift exchange with a $5 or $10 limit: dad jokes, fact books, bathroom word search and password logbooks.`, h1: 'White elephant gifts under $10', body, ld: [lijstLd('White elephant gifts under $10', WE10), faqLd(vragen)] });
}

function sokken(c) {
  const L = c.L, tiener = BOEKEN.find(b => b.v === 'teens');
  const delen = [['for-her', 'For her', voor('women')], ['for-him', 'For him', voor('men')], ['for-anyone', 'For anyone', voor('anyone')], ['for-kids-and-teens', 'For kids and teens', voor(['kids', 'teens'])]];
  const vragen = [
    ['What are good stocking stuffers for adults under $5?', `${TEL.tot5} books on this shelf cost $5 or less, such as Christmas sudoku, Christmas word search and the bathroom word search books.`],
    ['What is a good stocking stuffer for a teenager?', `${tiener.t} has ${tiener.n} pages and costs ${usd(tiener.p)} on Amazon.`],
    ['What do you put in a stocking?', 'One thing to eat, one to use, one to wear, one to do and one that is silly. A small book covers something to do and often something silly too.'],
    ['How much should you spend on a stocking?', 'Most people spend $25 to $50 per stocking. The budget planner on this page splits any amount over the five slots.'],
    ['Are these books large print?', 'Some are. When a book is large print, it says so in its title, for example Christmas Around the World Large Print Word Search.'],
  ];
  const gidsen = `<nav class="meer"><p class="eb">Stocking stuffer guides</p><a href="${L('stocking-stuffers-for-women')}">Stocking stuffers for women</a><a href="${L('stocking-stuffers-for-men')}">Stocking stuffers for men</a><a href="${L('stocking-stuffers-for-teens')}">Stocking stuffers for teens</a><a href="${L('white-elephant-gift-ideas')}">White elephant gift ideas</a></nav>`;
  const body = `<p class="intro">${TEL.boeken} small paperbacks that slide into a stocking: puzzles for a quiet Christmas morning, jokes and facts to read out loud and logbooks for the year ahead. ${TEL.tot5} cost $5 or less.</p>`
    + `<p class="sprong">${delen.map(([id, kop, l]) => `<a class="pill" href="#${id}">${kop} (${l.length})</a>`).join('')}</p>`
    + gidsen
    + delen.map(([id, kop, l], i) => `<section class="stack" id="${id}"><h2>${kop}</h2>${plank(l, i === 0 ? 3 : 0)}</section>`).join('')
    + formule() + planner(L)
    + `<section class="tool"><h2>Free to print</h2><p>Twelve Christmas word search puzzles in large print, for the table on Christmas morning.</p><a class="link" href="${L('free-printable-christmas-word-search')}">Open the free puzzles</a></section>`
    + faq(vragen);
  return pagina(c, { slug: 'stocking-stuffers', title: `Stocking Stuffers: ${TEL.boeken} Small Book Ideas From $4.99`, desc: `${TEL.boeken} small paperbacks for a Christmas stocking, sorted for her, for him, for anyone and for kids and teens. ${TEL.tot5} cost $5 or less on Amazon.`, h1: 'Stocking stuffer books', kruimel: 'Stocking stuffer books', body, ld: [lijstLd('Stocking stuffer books', BOEKEN), faqLd(vragen)] });
}

function printbaar(c) {
  const L = c.L, ws = soort(BOEKEN, 'xmasws');
  const vragen = [
    ['Can I print these for a classroom or a party?', 'Yes. Print as many copies as you need for your own class, family or party.'],
    ['Is there an answer key?', 'Yes. Tap Show the answers under a puzzle and every word lights up.'],
    ['Which way do the words run?', 'Across, down and diagonally down. No word runs backwards.'],
  ];
  const body = `<p class="intro">${PUZZELS.length} Christmas word search puzzles in large print, free to print at home. No sign-up. Every puzzle has 12 words that run across, down or diagonally down, and an answer key.</p>`
    + `<p class="sprong np">${PUZZELS.map(p => `<a class="pill" href="#${p.id}">${esc(p.naam)}</a>`).join('')}</p>`
    + PUZZELS.map(puzzelHtml).join('')
    + `<section class="stack np"><h2>Want a whole book of them?</h2><p>${ws.length} Christmas word search books, each ${usd(Math.min(...ws.map(b => b.p)))} on Amazon.</p>${plank(ws)}<p><a href="${L('stocking-stuffers')}">All ${TEL.boeken} stocking stuffer books</a></p></section>`
    + faq(vragen);
  return pagina(c, { slug: 'free-printable-christmas-word-search', title: `Free Printable Christmas Word Search: ${PUZZELS.length} Large Print Puzzles`, desc: `${PUZZELS.length} free printable Christmas word search puzzles in large print, with an answer key. Print them at home for the family, a class or a party. No sign-up.`, h1: 'Free printable Christmas word search', body, beeld: ws[0].i, ld: [faqLd(vragen)] });
}

function over(c) {
  const L = c.L;
  const body = `<p class="intro">Stocking Books is the shelf for our own small gift books. We make and publish them, and Amazon prints and ships each copy.</p>`
    + `<section class="stack"><h2>What we show</h2><p>The title, the price and the page count of each book, as they were on Amazon.com on ${dag(PRIJS_DATUM)}. Prices can change, so the price on Amazon is the one that counts.</p></section>`
    + `<section class="stack"><h2>How we earn</h2><p>We get the publisher royalty when you buy one of our books. Links go straight to Amazon. There are no affiliate tags and no paid placements.</p></section>`
    + `<section class="stack"><h2>What is free</h2><p>The <a href="${L('white-elephant-rules')}">white elephant rules</a> with the number picker and the <a href="${L('free-printable-christmas-word-search')}">printable Christmas word search puzzles</a> are free, without sign-up.</p></section>`
    + `<section class="stack"><h2>Who we are</h2><p>${esc(BEDRIJF)}</p></section>`;
  return pagina(c, { slug: 'about', title: 'About Stocking Books: Who Makes These Small Gift Books', desc: 'Stocking Books is the shelf for our own small gift books. We publish them, Amazon prints and ships them, and links carry no affiliate tags.', h1: 'About Bookstuffers', body });
}

const ENOCH = ANDER.find(b => b.a === 'B0B5KV79N1'), APO = ANDER.find(b => b.a === 'B0DDBTXC9J');
const eigenBoek = (b, zin) => `<section class="held"><div class="stack"><p class="eb">Our edition</p><h2>${esc(b.t)}</h2><p>${zin}</p><p>${b.n} pages, ${usd(b.p)} on Amazon${b.c >= 10 ? `, rated ${b.r} out of 5 by ${b.c} readers` : ''}. We publish this edition.</p><a class="btn amz-cta" href="${GO(b.a)}" data-bs="${b.a}" rel="noopener">View on Amazon ${AMZ_ARROW}</a></div><a href="${GO(b.a)}" data-bs="${b.a}" rel="noopener"><img src="${omslag(b.i)}" alt="${esc(b.t)}, book cover" width="375" height="500" loading="lazy" decoding="async"></a></section>`;
const boekLd = b => ({ '@context': 'https://schema.org', '@type': 'Book', name: b.t, image: omslag(b.i), url: amz(b.a), numberOfPages: b.n, bookFormat: 'https://schema.org/Paperback', ...(b.c >= 10 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: b.r, ratingCount: b.c } } : {}), offers: { '@type': 'Offer', price: Number(b.p).toFixed(2), priceCurrency: 'USD', url: amz(b.a) } });

function enoch(c) {
  const L = c.L;
  const delen = [
    ['1 to 36', 'The Book of the Watchers', 'Two hundred angels, the Watchers, come down on Mount Hermon, take human wives and father giants. They teach people weapons, make-up, magic and astrology. The earth fills with violence, the Watchers ask Enoch to plead for them, God refuses, and Enoch is taken on journeys through heaven, the underworld and the ends of the earth.'],
    ['37 to 71', 'The Parables (Similitudes)', 'Three visions of the coming judgment, with a heavenly figure called the Son of Man, the Elect One and the Righteous One. This is the only part of 1 Enoch not found among the Dead Sea Scrolls, and the part most discussed by readers of the Gospels.'],
    ['72 to 82', 'The Astronomical Book', 'The angel Uriel shows Enoch the gates of the sun and moon and a calendar of 364 days, 52 weeks exactly, so that every feast falls on the same weekday every year.'],
    ['83 to 90', 'The Dream Visions', 'Two dreams: the flood, and the whole history of Israel told as animals. Israel are sheep, their enemies are wild beasts and birds of prey, and the story runs to the end of days.'],
    ['91 to 108', 'The Epistle of Enoch', 'Enoch’s letter to his children: woes against the rich and the unjust, the Apocalypse of Weeks that divides history into ten weeks, and at the end the strange birth of Noah.'],
  ];
  const leiders = [['Shemihazah (Semjaza)', 'their leader; enchantments and the cutting of roots'], ['Azazel', 'swords, knives, shields and armor; bracelets, ornaments and make-up'], ['Armaros', 'how to undo enchantments'], ['Baraqiel', 'astrology'], ['Kokabel', 'the constellations'], ['Ezeqeel', 'the knowledge of the clouds'], ['Araqiel', 'the signs of the earth'], ['Shamsiel', 'the signs of the sun'], ['Sariel', 'the course of the moon']];
  const plan = [['Day 1', '1 to 11: the Watchers fall'], ['Day 2', '12 to 21: Enoch pleads and sees the prisons of the angels'], ['Day 3', '22 to 36: the journeys to the ends of the earth'], ['Day 4', '37 to 50: the first parable'], ['Day 5', '51 to 63: the second parable'], ['Day 6', '64 to 71: the third parable and Enoch taken up'], ['Day 7', '72 to 82: the calendar of the sun and moon'], ['Day 8', '83 to 90: the two dream visions'], ['Day 9', '91 to 100: the letter and the Apocalypse of Weeks'], ['Day 10', '101 to 108: the last woes and the birth of Noah']];
  const vragen = [
    ['Is the Book of Enoch in the Bible?', 'Not in Jewish, Catholic or most Protestant Bibles. The Ethiopian Orthodox Tewahedo Church and the Eritrean Orthodox Church include 1 Enoch in their Bible.'],
    ['Does the Bible quote the Book of Enoch?', 'Yes. Jude 1:14-15 quotes 1 Enoch 1:9, the prophecy that the Lord comes with ten thousands of his saints to judge the ungodly.'],
    ['Who wrote the Book of Enoch?', 'It is credited to Enoch, the great-grandfather of Noah in Genesis 5, but scholars date the five parts of 1 Enoch to roughly the 3rd century BC up to the turn of the era, written by several unknown Jewish authors.'],
    ['Who are the Watchers?', 'Angels who came down to earth, took human wives and fathered giants, the Nephilim of Genesis 6. Their story fills the first 36 chapters of 1 Enoch.'],
    ['How tall were the giants in the Book of Enoch?', 'In R. H. Charles’s translation, 1 Enoch 7:2 says the giants were three thousand ells tall. Other manuscripts give different numbers.'],
    ['Was the Book of Enoch found in the Dead Sea Scrolls?', 'Yes. Aramaic fragments of eleven copies of 1 Enoch were found in Qumran Cave 4. Every part was found except the Parables, chapters 37 to 71.'],
    ['Why was the Book of Enoch removed from the Bible?', 'It was never in the Hebrew Bible. Early Christians read it widely, but by the 4th century most churches stopped treating it as scripture. Only the Ethiopian church kept it.'],
    ['What is the difference between 1, 2 and 3 Enoch?', '1 Enoch survives complete in Ge’ez, 2 Enoch only in Old Church Slavonic and 3 Enoch in Hebrew. They were written centuries apart and tell different stories about Enoch.'],
    ['How long does it take to read 1 Enoch?', 'It has 108 chapters. At about 11 chapters a day you finish in 10 days; the reading plan on this page splits it by section.'],
  ];
  const body = `<p class="intro">The Book of Enoch is an ancient Jewish book credited to Enoch, the great-grandfather of Noah. It tells how fallen angels, the Watchers, fathered giants before the flood. It is not in most Bibles, yet the letter of Jude quotes it, copies were found among the Dead Sea Scrolls, and the Ethiopian Orthodox Church reads it as scripture.</p>`
    + `<p class="sprong np"><a class="pill" href="#who">Who was Enoch</a><a class="pill" href="#chapters">Chapter by chapter</a><a class="pill" href="#watchers">The Watchers</a><a class="pill" href="#three">1, 2 and 3 Enoch</a><a class="pill" href="#plan">10-day reading plan</a></p>`
    + `<section class="stack" id="who"><h2>Who was Enoch?</h2><p>In Genesis 5, Enoch is the son of Jared and the father of Methuselah. He lived 365 years, and instead of the line “and he died” that closes every other name in the list, Genesis says something else:</p><p class="citaat">“And Enoch walked with God: and he was not; for God took him.” Genesis 5:24, King James Version</p><p>Because Enoch did not die, Jewish writers imagined that he had seen heaven, the angels and the future, and wrote it down. The Book of Enoch is that story.</p></section>`
    + `<section class="stack" id="chapters"><h2>What is in 1 Enoch, chapter by chapter</h2><p>1 Enoch has 108 chapters in five parts, written at different times and later joined together.</p><div class="faq">${delen.map(([h, k, t]) => `<div><h3>Chapters ${h}: ${k}</h3><p>${t}</p></div>`).join('')}</div></section>`
    + `<section class="stack" id="watchers"><h2>The Watchers and what they taught</h2><p>Chapter 6 names the angels who swore an oath on Mount Hermon, and chapter 8 lists what their leaders taught people. In R. H. Charles’s 1917 translation:</p><table class="tabel"><thead><tr><th>Watcher</th><th>What he taught</th></tr></thead><tbody>${leiders.map(([n, t]) => `<tr><td><b>${n}</b></td><td>${t}</td></tr>`).join('')}</tbody></table><p>Their children, the giants, ate everything people had and then turned on people themselves. That violence is the reason for the flood in Enoch’s telling, and it fills in the two strange verses about the Nephilim in Genesis 6:1-4.</p></section>`
    + `<section class="stack"><h2>The verse the Bible quotes</h2><p>The New Testament letter of Jude quotes 1 Enoch 1:9 almost word for word and calls Enoch “the seventh from Adam”:</p><p class="citaat">“Behold, the Lord cometh with ten thousands of his saints, to execute judgment upon all.” Jude 1:14-15, King James Version</p><p>That quote is the main reason Christians kept reading Enoch. Tertullian, around 200 AD, argued it belonged in scripture. Augustine and Jerome did not, and their view won in the Western churches.</p></section>`
    + `<section class="stack"><h2>How the book was lost and found</h2><ul class="k"><li><b>Before Christ:</b> written in Aramaic, parts of it by the 3rd century BC.</li><li><b>Qumran:</b> Aramaic fragments of eleven copies were found in Cave 4 of the Dead Sea Scrolls, every part except the Parables.</li><li><b>Ethiopia:</b> translated into Ge’ez and kept complete by the Ethiopian church, while the rest of the world lost it.</li><li><b>1773:</b> the Scottish traveler James Bruce brought Ethiopic copies back to Europe.</li><li><b>1821:</b> Richard Laurence published the first English translation. R. H. Charles’s translation of 1912 and 1917 is still the one most people read.</li></ul></section>`
    + `<section class="stack" id="three"><h2>1, 2 and 3 Enoch compared</h2><table class="tabel"><thead><tr><th></th><th>1 Enoch</th><th>2 Enoch</th><th>3 Enoch</th></tr></thead><tbody><tr><td><b>Also called</b></td><td>Ethiopic Enoch</td><td>Slavonic Enoch, the Book of the Secrets of Enoch</td><td>Hebrew Enoch, Sefer Hekhalot</td></tr><tr><td><b>Survives in</b></td><td>Ge’ez, with Aramaic fragments</td><td>Old Church Slavonic</td><td>Hebrew</td></tr><tr><td><b>Written</b></td><td>3rd century BC to about the turn of the era</td><td>Debated, often placed in the 1st century AD</td><td>Usually dated to the 5th or 6th century AD</td></tr><tr><td><b>Story</b></td><td>The Watchers, the giants, the flood and the judgment</td><td>Enoch travels through the heavens and teaches his sons</td><td>Enoch is turned into the angel Metatron</td></tr></tbody></table></section>`
    + `<section class="stack" id="plan"><h2>Read 1 Enoch in 10 days</h2><p>Each day is one sitting of about ten chapters, split where the sections break.</p><ol class="stappen">${plan.map(([d, t]) => `<li><b>${d}:</b> chapters ${t}</li>`).join('')}</ol><p>Read Genesis 5:18-24 and 6:1-4 and Jude 1:14-15 first. They take five minutes and make the first day click.</p></section>`
    + eigenBoek(ENOCH, 'All three books, 1, 2 and 3 Enoch, in one paperback, so you can read them side by side.')
    + `<p><a href="${L('apocrypha')}">Read next: what is the Apocrypha?</a></p>`
    + faq(vragen);
  return pagina(c, { slug: 'book-of-enoch', title: 'What Is the Book of Enoch? Watchers, Giants and a 10-Day Plan', desc: 'The Book of Enoch explained: who Enoch was, 1 Enoch chapter by chapter, the Watchers and giants, the Dead Sea Scrolls, 1 vs 2 vs 3 Enoch, a 10-day reading plan.', h1: 'What is the Book of Enoch?', body, beeld: ENOCH.i, ld: [boekLd(ENOCH), faqLd(vragen)] });
}

function apocrypha(c) {
  const L = c.L;
  const boeken = [['1 Esdras', 'Retells the return from exile from Josiah’s Passover to Ezra, with the famous contest of the three guards: is wine, the king, women or truth the strongest? Truth wins.'], ['2 Esdras', 'Seven visions in which Ezra argues with the angel Uriel about why the righteous suffer. One of the darkest and most questioning books of the period.'], ['Tobit', 'A blind, faithful Jew sends his son Tobias on a journey with a stranger who turns out to be the angel Raphael. Tobias frees Sarah from the demon Asmodeus and cures his father.'], ['Judith', 'A widow walks into the camp of the Assyrian general Holofernes, wins his trust and beheads him, saving her town. A favorite of painters for 500 years.'], ['The rest of Esther', 'Six additions to the book of Esther, including the prayers of Mordecai and Esther. The Hebrew Esther never names God; these additions do.'], ['The Wisdom of Solomon', 'Wisdom speaks as a person, and the souls of the righteous are in the hand of God. Written in Greek, probably in Alexandria.'], ['Ecclesiasticus (Sirach)', 'Proverbs and advice by Jesus ben Sira, written in Hebrew around 180 BC and translated into Greek by his grandson. Long, practical and often quoted.'], ['Baruch, with the Letter of Jeremiah', 'A confession of sin and a poem about wisdom credited to Jeremiah’s scribe, followed by a letter mocking idols of wood and gold.'], ['The Song of the Three Holy Children', 'The prayer and the hymn of the three young men in the fiery furnace of Daniel 3, inserted between verses 23 and 24.'], ['The Story of Susanna', 'Two elders falsely accuse a woman of adultery. The young Daniel questions them separately and their stories fall apart.'], ['Bel and the Dragon', 'Daniel proves that priests are eating the food offered to the idol Bel, kills a dragon, and survives a second den of lions.'], ['The Prayer of Manasseh', 'The repentance of Judah’s worst king, the prayer that 2 Chronicles 33 says he prayed but does not quote.'], ['1 Maccabees', 'The history of the Jewish revolt against Antiochus IV and the rededication of the Temple in 164 BC, the story behind Hanukkah.'], ['2 Maccabees', 'The same years told with martyrs, miracles and the prayer for the dead in 12:46, a verse at the center of the debate about purgatory.']];
  const tijd = [['About 250 to 100 BC', 'Jewish scripture is translated into Greek, the Septuagint. Several of these books travel with it.'], ['About AD 405', 'Jerome finishes the Latin Vulgate and notes that these books are not in the Hebrew Bible, but translates them anyway.'], ['1534', 'Luther’s German Bible prints them in a separate section between the testaments and calls them good to read but not equal to scripture.'], ['1546', 'The Council of Trent confirms the deuterocanonical books as scripture for Catholics.'], ['1611', 'The King James Bible prints the Apocrypha in its own section.'], ['1647', 'The Westminster Confession says they are not inspired, and Reformed churches stop treating them as scripture.'], ['1827', 'The British and Foreign Bible Society stops funding Bibles that include them. From then on most Protestant Bibles leave them out.']];
  const woorden = [['Apocrypha', 'The Protestant name for these books. The Greek word means hidden.'], ['Deuterocanonical', 'The Catholic and Orthodox name for the same books: the second canon, not lesser scripture.'], ['Pseudepigrapha', 'Books credited to ancient figures that no major church canon includes, such as 1 Enoch outside Ethiopia and Jubilees.']];
  const vragen = [
    ['Why were the Apocrypha removed from Protestant Bibles?', 'The Reformers followed the Hebrew Bible, which does not contain them. Luther printed them in a separate section in 1534, and from 1827 most Protestant Bibles left them out entirely.'],
    ['Do Catholic Bibles have the Apocrypha?', 'Yes. Catholics call Tobit, Judith, Wisdom, Sirach, Baruch, 1 and 2 Maccabees and the additions to Esther and Daniel deuterocanonical. The Council of Trent confirmed them in 1546.'],
    ['Is the Book of Enoch part of the Apocrypha?', 'Usually not. Enoch is counted among the pseudepigrapha. Only the Ethiopian and Eritrean Orthodox churches have it in their Bible.'],
    ['Was the Apocrypha in the King James Bible?', 'Yes. The 1611 King James Version printed the 14 books of the Apocrypha in their own section between the Old and the New Testament.'],
    ['Did Jesus quote the Apocrypha?', 'The New Testament never quotes an Apocrypha book by name, but some passages echo Wisdom and Sirach, and John 10:22 mentions the Feast of Dedication, Hanukkah, which is told in 1 and 2 Maccabees.'],
    ['Which Apocrypha book should I read first?', 'Start with the short stories: Susanna, Bel and the Dragon, Tobit and Judith. Each takes under an hour.'],
  ];
  const body = `<p class="intro">The Apocrypha are Jewish books from the last centuries before Christ that are in Catholic and Orthodox Bibles but not in the Hebrew Bible or most Protestant Bibles. The 1611 King James Bible printed 14 of them in their own section. They tell the story of Hanukkah, the angel Raphael and Judith and Holofernes.</p>`
    + `<p class="sprong np"><a class="pill" href="#books">The 14 books</a><a class="pill" href="#timeline">How they left the Bible</a><a class="pill" href="#words">Apocrypha or deuterocanon?</a></p>`
    + `<section class="stack" id="books"><h2>The 14 books of the King James Apocrypha, one by one</h2><div class="faq">${boeken.map(([k, t]) => `<div><h3>${esc(k)}</h3><p>${esc(t)}</p></div>`).join('')}</div></section>`
    + `<section class="stack"><h2>Which Bibles include them</h2><table class="tabel"><thead><tr><th>Bible</th><th>Apocrypha</th></tr></thead><tbody><tr><td><b>Catholic</b></td><td>Tobit, Judith, Wisdom, Sirach, Baruch, 1 and 2 Maccabees, additions to Esther and Daniel</td></tr><tr><td><b>Orthodox</b></td><td>All of those, plus books such as 1 Esdras, 3 Maccabees and the Prayer of Manasseh</td></tr><tr><td><b>Ethiopian Orthodox</b></td><td>The widest canon, including 1 Enoch and Jubilees</td></tr><tr><td><b>Protestant</b></td><td>None in most modern editions; older editions printed them in a separate section</td></tr><tr><td><b>Hebrew Bible</b></td><td>None</td></tr></tbody></table></section>`
    + `<section class="stack" id="timeline"><h2>How they left the Bible</h2><ol class="stappen">${tijd.map(([d, t]) => `<li><b>${d}:</b> ${esc(t)}</li>`).join('')}</ol></section>`
    + `<section class="stack" id="words"><h2>Apocrypha, deuterocanon or pseudepigrapha?</h2><div class="faq">${woorden.map(([k, t]) => `<div><h3>${k}</h3><p>${esc(t)}</p></div>`).join('')}</div></section>`
    + `<section class="stack"><h2>Where to start reading</h2><p>Start with the stories, then the wisdom, then the history. Susanna and Bel and the Dragon take ten minutes each. Tobit and Judith read like short novels. Sirach and Wisdom are best a chapter a day. 1 Maccabees is the one to read before Hanukkah.</p></section>`
    + eigenBoek(APO, 'The books left out of the Bible in one paperback, with a foreword and introductions by Edward Whelan.')
    + `<p><a href="${L('book-of-enoch')}">Read next: what is the Book of Enoch?</a></p>`
    + faq(vragen);
  return pagina(c, { slug: 'apocrypha', title: 'What Is the Apocrypha? The 14 Books Left Out of the Bible', desc: 'The Apocrypha explained: all 14 King James Apocrypha books one by one, which Bibles include them, how they left the Bible and where to start reading.', h1: 'What is the Apocrypha?', kruimel: 'What is the Apocrypha?', body, beeld: APO.i, ld: [boekLd(APO), faqLd(vragen)] });
}

function alleBoeken(c) {
  const L = c.L, groepen = Object.entries(GROEP).map(([g, kop]) => [g, kop, ANDER.filter(b => b.g === g)]).filter(x => x[2].length);
  const body = `<p class="intro">Every paperback we publish, ${TEL.alles} in all. The Christmas books are on the <a href="${L('stocking-stuffers')}">stocking stuffer page</a>, and the Lasting Change Workbook has <a href="${LC_URL}">its own page</a>.</p>`
    + `<p class="sprong">${groepen.map(([g, kop, l]) => `<a class="pill" href="#${g}">${esc(kop)} (${l.length})</a>`).join('')}</p>`
    + groepen.map(([g, kop, l], i) => `<section class="stack" id="${g}"><h2>${esc(kop)}</h2>${plank(l, i === 0 ? 3 : 0)}</section>`).join('');
  return pagina(c, { slug: 'all-books', title: `Every Book We Publish: ${TEL.alles} Paperbacks`, desc: `All ${TEL.alles} paperbacks we publish: Bible and Enoch, cookbooks, health and mind, large print word search, coloring books and more.`, h1: 'Every book we publish', body, ld: [lijstLd('Every book we publish', ANDER)] });
}

// --- kerstgidsen (Henkjan 22 nov 2026: "Chek alles wat te dun is ook zeker de stuffers wil daar veel verkeer pakken dieze kerst . Maak het
// minimaal 30 x beter dan nu."). Vraag uit Demand Radar (thema kdp-boeken, VS, piekmaand): white elephant gift ideas 1,22M, stocking stuffers
// for women 301k, for men/guys 201k, for teens 110k, secret santa generator 246k. Elke gids: antwoord bovenaan, eigen boeken met omslag,
// een eerlijke ideeënlijst per prijsklasse (geen merken, geen verzonnen producten), een eigen hulpmiddel en vragen.
const IDEE = {
  vrouw: { '$5 and under': ['Lip balm or a tinted lip oil', 'A travel tube of hand cream', 'Fuzzy socks', 'A claw clip or a pack of scrunchies', 'Sheet masks', 'A tea sampler', 'A good chocolate bar', 'A glass nail file', 'A bath bomb', 'A pocket notebook and a nice pen'], '$5 to $10': ['A large print Christmas sudoku or word search book', 'A password logbook (yes, she will use it)', 'A small scented candle', 'A silk-style sleep mask', 'A phone grip or ring holder', 'A travel jewelry case', 'A coffee sampler', 'A wine journal', 'Cozy slipper socks', 'Cookie cutters with a recipe card'], '$10 to $25': ['A five-minute journal for the new year', 'A good hand cream set', 'A heated eye mask', 'A mini perfume or rollerball', 'A cookbook she will actually use', 'A silk scrunchie set', 'A personalized ornament', 'A plant mister and a small succulent'] },
  man: { '$5 and under': ['A pack of hand warmers', 'Beef jerky', 'A keychain multitool', 'Lip balm for winter', 'A deck of playing cards', 'Wool socks', 'A tape measure keychain', 'A golf ball sleeve', 'Gum or mints he always buys', 'A bottle opener'], '$5 to $10': ['A book of 400 dad jokes', 'A beer tasting journal', 'A hot sauce sampler', 'A garage or tool logbook', 'A pocket flashlight', 'A phone charging cable that is long enough', 'Beard balm', 'A coffee sampler', 'Work gloves', 'A fact book for the bathroom'], '$10 to $25': ['A book of rare facts for men who have everything', 'A good pocket knife', 'A wallet card tool', 'A rechargeable lighter', 'A sports team beanie', 'A grill thermometer', 'A pellet grill cookbook'] },
  tiener: { '$5 and under': ['Lip gloss or lip balm', 'Scrunchies or hair clips', 'Candy from another country', 'Stickers for a laptop or water bottle', 'An LED keychain', 'Hand warmers', 'A fidget toy', 'Fun socks', 'A pocket card game', 'A phone wrist strap'], '$5 to $10': ['A book of 408 weird and funny facts', 'A card game for friends', 'An earbuds case', 'A phone grip', 'Face masks', 'A mini puzzle cube', 'A water bottle sticker pack', 'A cute notebook', 'A gift card for a snack place'], '$10 to $25': ['A small portable charger', 'A gift card for games or music', 'A Polaroid-style photo mini album', 'A desk LED light strip', 'A 1,000-fact trivia book for teens and adults', 'A hoodie-weather beanie'] },
  we: { 'Under $5': ['A bathroom word search book with a pun for a title', 'A password logbook called Sh*t I Can’t Remember', 'A giant chocolate bar', 'A rubber duck with a mustache', 'A pack of fortune cookies', 'Toilet paper with crossword puzzles', 'A tiny tabletop basketball game'], 'Under $10': ['A book of 400 dad jokes', 'A beer or wine tasting journal', 'A bacon-scented anything', 'A desk punching bag', 'A hot sauce sampler', 'A potato-shaped stress ball', 'A tiny desk zen garden', 'A mug that says something about meetings'], 'Under $15': ['A book of 1,000 weird facts', 'A two-book set of dad jokes and facts', 'A cheese board with funny labels', 'A heated phone hand warmer', 'An emergency dance party light'], 'Under $25': ['A board game for adults', 'A heated blanket throw', 'A book of rare facts for men plus a bottle of hot sauce', 'A cocktail kit', 'A smart plug for the holiday lights'] },
};
const telIdeeen = k => Object.values(IDEE[k]).reduce((n, l) => n + l.length, 0);
const ideeLijst = (k, kop) => `<section class="stack" id="ideas"><h2>${kop}</h2>${Object.entries(IDEE[k]).map(([prijs, l]) => `<div class="stack"><h3>${esc(prijs)}</h3><ul class="k">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</section>`;
const SLOTS = [['Something to eat', 'chocolate, jerky, candy from another country', 20], ['Something to use', 'lip balm, hand warmers, a good cable', 25], ['Something to wear', 'socks, a beanie, a scrunchie', 20], ['Something to do', 'a puzzle book, a joke book, a card game', 20], ['Something silly', 'the thing that makes them laugh first', 15]];
const formule = () => `<section class="stack" id="formula"><h2>How to fill a stocking: the five-slot rule</h2><p>A stocking feels full and thought-out when every item has a job. Pick one of each and you are done.</p><table class="tabel"><thead><tr><th>Slot</th><th>Ideas</th><th>Share of budget</th></tr></thead><tbody>${SLOTS.map(([s, i, p]) => `<tr><td><b>${s}</b></td><td>${i}</td><td>${p}%</td></tr>`).join('')}</tbody></table><p>A small book covers <b>something to do</b> and often <b>something silly</b> at the same time, which is why it is the most efficient item in a stocking.</p></section>`;
const planner = (L) => `<section class="tool np" id="planner"><h2>Stocking budget planner</h2><div class="veld"><label for="sb">Budget per stocking ($)</label><input id="sb" type="number" inputmode="numeric" min="5" max="500" value="30"></div><div class="veld"><label for="sn">How many stockings?</label><input id="sn" type="number" inputmode="numeric" min="1" max="30" value="4"></div><button class="btn" type="button" id="splan">Split my budget</button><ul class="k" id="suit" hidden></ul></section>`;
const plannerJs = `(function(){var D=document,b=D.getElementById('splan');if(!b)return;var S=${JSON.stringify(SLOTS.map(([s, , p]) => [s, p]))};b.addEventListener('click',function(){var x=Math.max(5,+D.getElementById('sb').value||30),n=Math.max(1,+D.getElementById('sn').value||1),u=D.getElementById('suit');u.innerHTML='';S.forEach(function(s){var li=D.createElement('li');li.textContent=s[0]+': about $'+(x*s[1]/100).toFixed(2);u.appendChild(li)});var t=D.createElement('li');t.style.fontWeight='700';t.textContent='Total for '+n+(n>1?' stockings':' stocking')+': $'+(x*n).toFixed(0);u.appendChild(t);u.hidden=false;b.textContent='Split again'})})();`;
const gidsLd = (naam, lijst) => lijstLd(naam, lijst);
const kopRegel = (txt) => `<p class="intro">${txt}</p>`;

function gidsOntvanger(c, o) {
  const L = c.L, boeken = o.boeken, n = telIdeeen(o.idee) + boeken.length;
  const body = kopRegel(o.antwoord)
    + `<p class="sprong np"><a class="pill" href="#books">Our books (${boeken.length})</a><a class="pill" href="#ideas">${telIdeeen(o.idee)} more ideas</a><a class="pill" href="#formula">The five-slot rule</a><a class="pill" href="#planner">Budget planner</a></p>`
    + `<section class="stack" id="books"><h2>${esc(o.boekKop)}</h2><p>${esc(o.boekZin)}</p>${plank(boeken, 3)}</section>`
    + ideeLijst(o.idee, o.ideeKop)
    + formule() + planner(L)
    + `<section class="stack"><h2>${esc(o.tipKop)}</h2><ul class="k">${o.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>`
    + `<section class="tool"><h2>Drawing names this year?</h2><p>Our free Secret Santa generator draws the names, keeps couples apart and gives everyone a private link.</p><a class="btn" href="${L('secret-santa-generator')}">Draw names for free</a></section>`
    + `<nav class="meer"><p class="eb">More stocking guides</p>${[['stocking-stuffers-for-women', 'Stocking stuffers for women'], ['stocking-stuffers-for-men', 'Stocking stuffers for men'], ['stocking-stuffers-for-teens', 'Stocking stuffers for teens'], ['stocking-stuffers', 'All stocking stuffer books']].filter(([s]) => s !== o.slug).map(([s, t]) => `<a href="${L(s)}">${t}</a>`).join('')}</nav>`
    + faq(o.vragen);
  return pagina(c, { slug: o.slug, title: o.title(n), desc: o.desc(n), h1: o.h1, body, beeld: boeken[0].i, ld: [gidsLd(o.h1, boeken), faqLd(o.vragen)] });
}

const vrouwen = c => gidsOntvanger(c, { slug: 'stocking-stuffers-for-women', idee: 'vrouw', h1: 'Stocking stuffers for women',
  boeken: [...voor('women'), ...BOEKEN.filter(b => ['B0DJQS1K5Z', 'B0HRFY3TLB', 'B0DMNK1J5T', 'B0DMQBJV59', 'B0DMZTBX4C', 'B0DMTCBGQ2'].includes(b.a))],
  title: n => `${n} Stocking Stuffers for Women: Ideas From $4.99`, desc: n => `${n} stocking stuffer ideas for women, mom and wife, sorted by price from $5 and under to $25, plus the five-slot rule and a free stocking budget planner.`,
  antwoord: 'The best stocking stuffers for women are small things she uses every day but would not buy for herself: a good lip balm, fuzzy socks, a candle, and something to do on a quiet Christmas morning, like a large print sudoku or a funny password logbook. Below are our own books first, then ideas by price.',
  boekKop: 'Books that fit in her stocking', boekZin: 'Christmas sudoku and word search for a quiet morning, logbooks that say it out loud and journals for the new year. We publish all of them.',
  ideeKop: 'More stocking stuffer ideas for women, by price', tipKop: 'What makes a stocking stuffer for her feel personal',
  tips: ['Match one item to a habit she already has: her coffee, her book club, her nail color.', 'Add one thing that makes her laugh. A logbook called Sh*t I Can’t Remember beats another candle.', 'Wrap small items in tissue so the stocking takes longer to empty.', 'Put the biggest item in first and the chocolate on top, where she finds it first.'],
  vragen: [['What do you put in a woman’s stocking?', 'One thing to eat, one to use, one to wear, one to do and one that is silly: for example chocolate, lip balm, fuzzy socks, a Christmas sudoku book and a funny password logbook.'], ['What are good stocking stuffers for women under $10?', 'Puzzle books, password logbooks, journals, fuzzy socks, a tea sampler, a sleep mask and a small candle. Most of our books for her cost $4.99 to $6.99.'], ['What are good stocking stuffers for mom?', 'Large print word search or sudoku books, a cozy pair of slipper socks, a good hand cream and a photo ornament from the kids.'], ['How much should I spend on a stocking?', 'Most people spend $25 to $50 per stocking. Use the budget planner on this page to split it over the five slots.']] });

const mannen = c => gidsOntvanger(c, { slug: 'stocking-stuffers-for-men', idee: 'man', h1: 'Stocking stuffers for men',
  boeken: [...voor('men'), ...BOEKEN.filter(b => ['B0DJQS1K5Z', 'B0HRFY3TLB', 'B0DNB1T9JT', 'B0DNCLDHD6', 'B0DNDQZ3G3', 'B0DNQ61ZJM'].includes(b.a))],
  title: n => `Stocking Stuffers for Men: ${n} Ideas He Will Actually Use`, desc: n => `${n} stocking stuffer ideas for men, dad, husband and the guy who has everything, from $5 and under to $25, plus the five-slot rule and a budget planner.`,
  antwoord: 'The best stocking stuffers for men are useful, edible or funny, and ideally all three: hand warmers, jerky, a keychain multitool and a book he will actually read in the bathroom, like 400 dad jokes or 800 rare facts. Below are our own books first, then ideas by price.',
  boekKop: 'Books that fit in his stocking', boekZin: 'Dad jokes, rare facts, bathroom word search and logbooks for the garage and the beer fridge. We publish all of them.',
  ideeKop: 'More stocking stuffer ideas for men, by price', tipKop: 'Stocking stuffers for the man who has everything',
  tips: ['He has the gadgets. Give him something to read, eat or laugh about instead.', 'Pick consumables: things that get used up never clutter his drawer.', 'A logbook for his hobby (beer, garage, grill) says you noticed what he likes.', 'One joke item per stocking. A dad joke book doubles as entertainment for the whole family.'],
  vragen: [['What do you put in a man’s stocking?', 'One thing to eat, one to use, one to wear, one to do and one that is silly: for example jerky, hand warmers, wool socks, a fact book and a book of dad jokes.'], ['What are good stocking stuffers for men under $10?', 'Dad joke and fact books, a beer tasting journal, a keychain multitool, hot sauce, a pocket flashlight and wool socks. Most of our books for him cost $4.99 to $8.99.'], ['What do you get a man who has everything for his stocking?', 'Something to read or something that gets used up: a book of 800 rare facts for men, a hot sauce sampler, good coffee or a logbook for his hobby.'], ['What are good stocking stuffers for dad?', 'Dad jokes, a garage logbook, a grill thermometer, hand warmers and his favorite snack.']] });

const tieners = c => gidsOntvanger(c, { slug: 'stocking-stuffers-for-teens', idee: 'tiener', h1: 'Stocking stuffers for teens',
  boeken: [...BOEKEN.filter(b => ['B0DJQLBM75', 'B0HRFY3TLB', 'B0DJQS1K5Z', 'B0DK3CSYXW', 'B0DMT8MB99', 'B0DNCLDHD6'].includes(b.a))],
  title: n => `${n} Stocking Stuffers for Teens They Will Actually Use`, desc: n => `${n} stocking stuffer ideas for teens, teen boys and teen girls, from $5 and under to $25, plus the five-slot rule and a free stocking budget planner.`,
  antwoord: 'The best stocking stuffers for teens are things they can use with friends or show off: candy from another country, a card game, phone accessories and a book of weird facts they will read out loud at dinner. Below are our own books first, then ideas by price.',
  boekKop: 'Books teens actually read', boekZin: '408 weird facts written for teens, 1,000 more for teens and adults, and dad jokes they will pretend to hate. We publish all of them.',
  ideeKop: 'More stocking stuffer ideas for teens, by price', tipKop: 'What works for teen boys and girls',
  tips: ['Teens like things they can share: a card game, candy to pass around, a fact book to quote.', 'Skip anything that looks like it is for kids. Plain colors and real brands of snacks win.', 'One practical item (a long charging cable, earbuds case) gets used every day.', 'A gift card is fine as the last item, not the first.'],
  vragen: [['What do you put in a teenager’s stocking?', 'Something to eat, something for the phone, something to wear, something to do and something funny: for example foreign candy, a phone grip, socks, a card game and a book of 408 weird facts.'], ['What are good stocking stuffers for teen boys?', 'Hand warmers, an LED keychain, a card game, jerky, a portable charger and a fact or joke book.'], ['What are good stocking stuffers for teen girls?', 'Lip gloss, scrunchies, stickers, face masks, a cute notebook and a fact book she can read with friends.'], ['Is a book a good stocking stuffer for a teenager?', 'Yes, if it is short and funny. A book of weird facts gets read in small bites and shared with friends.']] });

function gidsWe(c) {
  const L = c.L, n = telIdeeen('we') + WE.length;
  const steel = [['Does it get a laugh when it is opened?', 'The first two seconds decide whether anyone wants to steal it.'], ['Would most people at the party use it?', 'Funny and useless loses to funny and useful.'], ['Does it look like nothing until it is unwrapped?', 'A flat book or an odd-shaped box keeps the mystery.']];
  const vragen = [['What are good white elephant gift ideas for adults?', 'Funny but useful: a book of bad jokes or rare facts for the bathroom, a hot sauce sampler, a fancy candle, a desk toy or a good snack. Skip anything too personal, and stick to the price limit so nobody feels cheated.'], ['Is a gag gift a good white elephant gift?', 'Yes, if it is funny for a minute and still useful after. A pure joke ends up in a drawer; a gag gift someone wants to keep is the one that gets stolen.'], ['What is a good white elephant gift?', 'Something funny that most people would actually use, that stays a mystery until it is unwrapped: a bathroom word search book, 400 dad jokes, a hot sauce sampler or a desk punching bag.'], ['What are good white elephant gifts under $10?', `A funny book (ours start at $4.99), a beer tasting journal, a hot sauce sampler, a potato stress ball or a mug about meetings. We publish ${WE10.length} books under $10 for exactly this.`], ['What are good white elephant gifts for coworkers?', 'Keep it funny but safe for work: dad jokes, a fact book, a tiny desk zen garden or a mug about meetings.'], ['How do you play white elephant?', 'Everyone brings one wrapped gift, draws a number and either opens a new gift or steals one on their turn. Our rules page has all 8 steps and a free number picker.']];
  const body = kopRegel(`A great white elephant gift gets a laugh, is useful enough that people want to steal it, and stays a mystery until it is unwrapped. Below are ${n} ideas by price limit, from under $5 to under $25, starting with the funny books we publish ourselves.`)
    + `<p class="sprong np"><a class="pill" href="#books">Our funny books (${WE.length})</a><a class="pill" href="#ideas">Ideas by price</a><a class="pill" href="#steal">The steal test</a><a class="pill" href="${L('white-elephant-rules')}">Rules and number picker</a></p>`
    + `<section class="stack" id="books"><h2>Funny books for a white elephant swap</h2><p>Flat to wrap, impossible to guess, and the first gift people read out loud. We publish all of them; ${TEL.weTot5} cost $5 or less.</p>${plank(WE, 3)}</section>`
    + ideeLijst('we', 'More white elephant gift ideas by price limit')
    + `<section class="stack" id="steal"><h2>The steal test: three questions</h2><ol class="stappen">${steel.map(([v, a]) => `<li><b>${esc(v)}</b> ${esc(a)}</li>`).join('')}</ol><p>Three yeses and your gift will be stolen at least once, which is the point of the game.</p></section>`
    + `<section class="stack"><h2>Funny, but not awkward</h2><ul class="k"><li>For coworkers, stay safe for work. Bathroom humor is fine, anything personal is not.</li><li>For family, pick something three generations can laugh at: dad jokes beat inside jokes.</li><li>For friends, go bolder. That is what the logbook called Sh*t I Can’t Remember is for.</li></ul></section>`
    + `<section class="tool"><h2>Hosting the swap?</h2><p>Read the 8 rules, print the rules card and draw the playing order with our free number picker.</p><a class="btn" href="${L('white-elephant-rules')}">Open the rules and number picker</a></section>`
    + `<nav class="meer"><p class="eb">More for the party</p><a href="${L('white-elephant-gifts-under-10')}">White elephant gifts under $10</a><a href="${L('secret-santa-generator')}">Free Secret Santa generator</a><a href="${L('stocking-stuffers')}">Stocking stuffer books</a></nav>`
    + faq(vragen);
  return pagina(c, { slug: 'white-elephant-gift-ideas', title: `White Elephant Gift Ideas: ${n} Funny Picks People Steal`, desc: `${n} funny white elephant gift ideas by price limit, under $5, $10, $15 and $25, for coworkers, family and friends, plus the steal test and the rules.`, h1: 'White elephant gift ideas', body, ld: [gidsLd('Funny white elephant books', WE), faqLd(vragen)] });
}

// Secret Santa-generator: alles in de browser, niets op de server. Elke deelnemer krijgt een eigen link (#r=<versleuteld>) en ziet alleen wie hij trekt,
// met cadeau-ideeën binnen het budget (eigen boeken). Viraal: elke deelnemer opent de pagina.
function geheim(c) {
  const L = c.L, ideeen = [...BOEKEN, ...ANDER].filter(b => b.p <= 25 && (b.we || ['puzzel', 'koken', 'gezond'].includes(b.g))).map(b => ({ a: b.a, i: b.i, t: b.t, p: b.p }));
  const vragen = [['How does a Secret Santa generator work?', 'Type the names, add anyone who should not draw each other, and press Draw names. Every person gets a private link that shows only who they buy for.'], ['Can the organizer see who has who?', 'Not unless they open the links. The result is hidden inside each person’s link, so send the links without opening them and the organizer can play too.'], ['Can I keep couples from drawing each other?', 'Yes. Add each couple on its own line in the exclusions box, for example Anna, Ben.'], ['Do I need to sign up or give emails?', 'No. Nothing is stored and no emails are needed. You send each link yourself by text, WhatsApp or email.'], ['What is a good Secret Santa budget?', 'Most groups pick $15, $20 or $25. Each person’s link shows gift ideas within the budget you set.']];
  const body = `<section class="kaartp" id="onthul" hidden><p class="eb" id="o-groep">Secret Santa</p><h2 id="o-kop">Hi!</h2><p id="o-tekst"></p><p id="o-info"></p><p>Shhh. Keep it secret until the exchange.</p><div class="stack" id="o-idee"></div></section>`
    + kopRegel('Draw names for Secret Santa in a few seconds: type the names, keep couples apart, set a budget and send everyone their own private link. Free, no sign-up, no emails needed, and nobody, not even the organizer, sees the full list.')
    + `<section class="tool np" id="trekker"><h2>Secret Santa generator</h2><div class="veld"><label for="sg">Group name (optional)</label><input id="sg" type="text" placeholder="The Miller family Christmas"></div><div class="veld"><label for="sn2">Names, one per line</label><textarea id="sn2" rows="6" placeholder="Anna&#10;Ben&#10;Carla&#10;David"></textarea></div><div class="veld"><label for="sx">Who should not draw each other? One pair per line (optional)</label><textarea id="sx" rows="2" placeholder="Anna, Ben"></textarea></div><div class="veld"><label for="sbud">Budget per gift ($)</label><input id="sbud" type="number" inputmode="numeric" min="5" max="500" value="20"></div><div class="veld"><label for="sd">Exchange date (optional)</label><input id="sd" type="date"></div><button class="btn" type="button" id="strek">Draw names</button><p id="sfout" hidden></p><ol class="volgorde" id="slinks" hidden></ol></section>`
    + `<section class="stack"><h2>How it works</h2><ol class="stappen"><li>Type everyone’s name, one per line.</li><li>Add couples or housemates who should not draw each other.</li><li>Press Draw names. You get one private link per person.</li><li>Send each person their own link by text, WhatsApp or email. Do not open them yourself.</li><li>Each person sees only who they buy for, the budget, the date and gift ideas within the budget.</li></ol></section>`
    + `<section class="stack"><h2>Secret Santa rules that keep it fun</h2><ul class="k"><li><b>One budget for everyone.</b> $15, $20 or $25 keeps it fair.</li><li><b>Set the date before you draw,</b> so nobody shops too late.</li><li><b>Allow a wish line.</b> Let people tell the group one thing they like, not what they want.</li><li><b>Keep it anonymous until the exchange.</b> Then guess who had you.</li></ul></section>`
    + `<section class="stack"><h2>Gift ideas that fit every budget</h2><p>Small, funny books are the classic Secret Santa gift: they fit any budget, wrap flat and nobody can guess them. We publish all of these.</p>${plank(WE10.slice(0, 6))}<p><a href="${L('white-elephant-gift-ideas')}">More gift ideas by price</a></p></section>`
    + faq(vragen);
  const js = `(function(){var D=document,K='bookstuffers',I=${json(ideeen)};
function x(s){var o='';for(var i=0;i<s.length;i++)o+=String.fromCharCode(s.charCodeAt(i)^K.charCodeAt(i%K.length));return o}
function enc(o){return btoa(x(unescape(encodeURIComponent(JSON.stringify(o))))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'')}
function dec(t){t=t.replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(escape(x(atob(t)))))}
function el(t,txt){var e=D.createElement(t);if(txt!=null)e.textContent=txt;return e}
window.addEventListener('hashchange',function(){if(/r=/.test(location.hash))location.reload()});var h=location.hash.match(/r=([A-Za-z0-9_-]+)/);if(h){try{var o=dec(h[1]),z=D.getElementById('onthul');z.hidden=false;D.getElementById('o-groep').textContent=o.n||'Secret Santa';D.getElementById('o-kop').textContent='Hi '+o.g+'!';D.getElementById('o-tekst').textContent='You are the Secret Santa for '+o.r+'.';D.getElementById('o-info').textContent='Budget: $'+o.b+(o.d?' · Exchange: '+new Date(o.d+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}):'');
var p=I.filter(function(b){return b.p<=o.b}).sort(function(){return Math.random()-.5}).slice(0,3),w=D.getElementById('o-idee');if(p.length){w.appendChild(el('h3','Gift ideas for '+o.r+' under $'+o.b));var g=el('div');g.className='plank';p.forEach(function(b){var a=el('a');a.className='boek';a.href='/go/'+b.a;var im=el('img');im.src='https://m.media-amazon.com/images/I/'+b.i+'._SL500_.jpg';im.alt=b.t;a.appendChild(im);a.appendChild(el('b',b.t));var s=el('span','$'+b.p.toFixed(2)+' on Amazon');s.className='prijs';a.appendChild(s);g.appendChild(a)});w.appendChild(g)}z.scrollIntoView()}catch(e){}}
var k=D.getElementById('strek');if(!k)return;k.addEventListener('click',function(){var f=D.getElementById('sfout'),ul=D.getElementById('slinks');f.hidden=true;ul.innerHTML='';
var N=D.getElementById('sn2').value.split('\\n').map(function(s){return s.trim()}).filter(Boolean),seen={};N=N.filter(function(s){var l=s.toLowerCase();if(seen[l])return false;seen[l]=1;return true});
if(N.length<3){f.textContent='Add at least 3 names.';f.hidden=false;return}
var ex={};D.getElementById('sx').value.split('\\n').forEach(function(r){var p=r.split(/[,;&+\\-]| and /).map(function(s){return s.trim().toLowerCase()}).filter(Boolean);if(p.length===2){ex[p[0]+'|'+p[1]]=1;ex[p[1]+'|'+p[0]]=1}});
var R=null;for(var t=0;t<5000&&!R;t++){var a=N.slice();for(var i=a.length-1;i>0;i--){var q=new Uint32Array(1);crypto.getRandomValues(q);var j=q[0]%(i+1),y=a[i];a[i]=a[j];a[j]=y}var ok=true;for(i=0;i<N.length;i++){if(a[i]===N[i]||ex[N[i].toLowerCase()+'|'+a[i].toLowerCase()]){ok=false;break}}if(ok)R=a}
if(!R){f.textContent='These exclusions make a draw impossible. Remove one pair and try again.';f.hidden=false;return}
var b=Math.max(1,+D.getElementById('sbud').value||20),d=D.getElementById('sd').value,n=D.getElementById('sg').value.trim();
N.forEach(function(g,i){var u=location.origin+location.pathname+location.search+'#r='+enc({g:g,r:R[i],b:b,d:d,n:n}),li=el('li'),m='Hi '+g+'! Your Secret Santa match'+(n?' for '+n:'')+' is ready. Open your private link: '+u;
li.appendChild(el('b',g+' '));var c=el('button','Copy link');c.className='link';c.type='button';c.onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(u);c.textContent='Copied'};li.appendChild(c);li.appendChild(D.createTextNode(' · '));
var wa=el('a','WhatsApp');wa.href='https://wa.me/?text='+encodeURIComponent(m);wa.target='_blank';wa.rel='noopener';li.appendChild(wa);li.appendChild(D.createTextNode(' · '));var sm=el('a','Text');sm.href='sms:?&body='+encodeURIComponent(m);li.appendChild(sm);ul.appendChild(li)});
ul.hidden=false;k.textContent='Draw again';var p=el('p','Send each person only their own link. Do not open them yourself.');ul.parentNode.insertBefore(p,ul)})})();`;
  return pagina(c, { slug: 'secret-santa-generator', title: 'Free Secret Santa Generator: Draw Names, Private Links', desc: 'Free Secret Santa generator: draw names, keep couples apart, set a budget and send everyone a private link with their match and gift ideas. No sign-up.', h1: 'Free Secret Santa generator', body, extraJs: js, ld: [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Secret Santa generator', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, url: BASE + '/secret-santa-generator' }, faqLd(vragen)] });
}


// --- kerstpagina's op zoekvraag (Demand Radar 23 nov 2026, lib/bsxmas.js). Eerst concept: live na Henkjans ok (kv bs:live, fn/bs.js op=bslive).
export const NIEUW = []; // nieuwe pagina's eerst als concept; live na Henkjans ok (kv bs:live of door ze in SLUGS te zetten)
const boekenVan = l => l.map(a => [...BOEKEN, ...ANDER].find(b => b.a === a)).filter(Boolean);
function moppen(c) {
  const L = c.L, alle = MOP_GROEP.flatMap(([g]) => MOPPEN[g]), n = alle.length, boeken = boekenVan(['B0DK3CSYXW', 'B0DNB1T9JT', 'B0DJQS1K5Z', 'B0DJQLBM75']);
  const vragen = [
    ['What is the funniest Christmas joke for kids?', 'A safe favorite: What do you call a snowman with a six-pack? An abdominal snowman. Kids under ten also love the elf-abet and Sandy Claws.'],
    ['What is a good Christmas dad joke?', 'What do you call Santa when he stops moving? Santa Pause. Short, a groan guaranteed, and it works at any age.'],
    ['How do I use these jokes at a Christmas party?', 'Print the page and cut out the jokes for Christmas crackers, place cards or a lunchbox, or let everyone draw a random joke and read it out loud.'],
    ['Are these Christmas jokes clean?', `Yes. All ${n} jokes are family friendly, the adult ones too. They are classic Christmas puns you can tell at work or at the table.`],
  ];
  const body = `<p class="intro">${n} Christmas jokes that actually get a laugh, sorted for kids, dads, knock-knock fans and grown-ups. All clean and free to print.</p>`
    + `<section class="tool np"><h2>Joke of the moment</h2><p id="mop-v"><b>${esc(alle[0][0])}</b></p><p id="mop-a">${esc(alle[0][1])}</p><p class="knoppen"><button class="btn" type="button" id="mop-nog">Give me another one</button><button class="link" type="button" data-print="moppen">Print all ${n} jokes</button></p></section>`
    + `<p class="sprong np">${MOP_GROEP.map(([g, kop]) => `<a class="pill" href="#${g}">${esc({ kids: 'For kids', dad: 'Dad jokes', klop: 'Knock-knock', groot: 'For adults' }[g])}</a>`).join('')}</p>`
    + `<div id="moppen" class="stack">${MOP_GROEP.map(([g, kop]) => `<section class="stack" id="${g}"><h2>${esc(kop)}</h2><ol class="volgorde">${MOPPEN[g].map(([v, a]) => `<li><b>${esc(v)}</b> ${esc(a)}</li>`).join('')}</ol></section>`).join('')}</div>`
    + `<section class="stack np"><h2>400 more groans in one book</h2><p>Our own joke and fact books fit in a stocking and start at ${usd(Math.min(...boeken.map(b => b.p)))}.</p>${plank(boeken)}<p><a href="${L('stocking-stuffers-for-men')}">Stocking stuffers for men</a> · <a href="${L('white-elephant-gifts-under-10')}">White elephant gifts under $10</a></p></section>`
    + faq(vragen);
  const extraJs = `(function(){var A=${json(alle)},i=0,b=document.getElementById('mop-nog');if(!b)return;b.addEventListener('click',function(){var j;do{j=Math.floor(Math.random()*A.length)}while(j===i&&A.length>1);i=j;document.getElementById('mop-v').innerHTML='<b></b>';document.getElementById('mop-v').firstChild.textContent=A[j][0];document.getElementById('mop-a').textContent=A[j][1]})})();`;
  return pagina(c, { slug: 'christmas-jokes', title: `Christmas Jokes: ${n} Funny Ones for Kids and Adults`, desc: `${n} clean Christmas jokes for kids, dad jokes, knock-knock jokes and jokes for adults. Free to print for crackers, cards and the dinner table.`, h1: 'Christmas jokes', body, extraJs, ld: [faqLd(vragen), lijstLd('Christmas joke and fact books', boeken)] });
}
function quiz(c) {
  const L = c.L, n = QUIZ.reduce((x, [, l]) => x + l.length, 0), boeken = boekenVan(['B0HRFY3TLB', 'B0DJQS1K5Z', 'B0DJQLBM75', 'B0DMTCBGQ2']);
  const vragen = [
    ['What are good Christmas trivia questions?', `Questions most people half know: the first song played in space (“Jingle Bells”, 1965), the best-selling single ever (“White Christmas”) or how many gifts the Twelve Days of Christmas add up to (364). This page has ${n} with the answers.`],
    ['How do you run a Christmas trivia game?', 'Split into teams of two to four, read one round at a time, give each team a sheet for its answers, and reveal the answers after each round. Ten questions per round keeps it moving.'],
    ['Is there an easy round for kids?', `Yes. The last round has ${QUIZ[QUIZ.length - 1][1].length} easy questions, so younger kids can play along with the grown-ups.`],
    ['Can I print the questions without the answers?', 'Yes. Print the questions sheet for the players and print the version with answers for the quizmaster.'],
  ];
  let nr = 0;
  const body = `<p class="intro">${n} Christmas trivia questions with answers, in ${QUIZ.length} rounds: songs and movies, Santa and his reindeer, history and traditions, and an easy round for kids. Tap a question to see the answer.</p>`
    + `<p class="knoppen np"><button class="btn" type="button" data-print="quiz">Print the questions</button><button class="link" type="button" id="quiz-antw">Print with answers</button></p>`
    + `<div id="quiz" class="stack">${QUIZ.map(([kop, l]) => `<section class="stack"><h2>${esc(kop)}</h2><div class="faq">${l.map(([v, a, u]) => { nr++; return `<details><summary><b>${nr}.</b> ${esc(v)}</summary><p><b>${esc(a)}</b>${u ? ' ' + esc(u) : ''}</p></details>`; }).join('')}</div></section>`).join('')}</div>`
    + `<section class="stack np"><h2>For the quiz lovers on your list</h2><p>Our fact books are trivia night in a paperback, and they fit in a stocking.</p>${plank(boeken)}<p><a href="${L('christmas-jokes')}">Christmas jokes</a> · <a href="${L('free-printable-christmas-word-search')}">Free Christmas word search</a></p></section>`
    + faq(vragen);
  const extraJs = `(function(){var b=document.getElementById('quiz-antw');if(!b)return;b.addEventListener('click',function(){var d=document.querySelectorAll('#quiz details');d.forEach(function(x){x.open=true});var z=document.getElementById('printzone');z.innerHTML=document.getElementById('quiz').outerHTML;document.body.classList.add('pr');window.print();setTimeout(function(){document.body.classList.remove('pr');z.innerHTML='';d.forEach(function(x){x.open=false})},800)})})();`;
  const ld = [faqLd(vragen), { '@context': 'https://schema.org', '@type': 'Quiz', name: 'Christmas trivia', about: 'Christmas', educationalLevel: 'beginner', hasPart: QUIZ.flatMap(([, l]) => l).map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
  return pagina(c, { slug: 'christmas-trivia', title: `Christmas Trivia: ${n} Questions and Answers to Print`, desc: `${n} Christmas trivia questions with answers in ${QUIZ.length} rounds, from songs and movies to traditions, plus an easy round for kids. Free to print.`, h1: 'Christmas trivia questions and answers', body, extraJs, ld });
}
function kleuren(c) {
  const L = c.L, n = KLEUR.length, boeken = boekenVan(['B0CP2RZLL1', 'B0DMJGTJ39', 'B0DJSB43VN']);
  const vragen = [
    ['Are these Christmas coloring pages free?', `Yes. All ${n} pages are free to print at home, for your family, class or party. No sign-up.`],
    ['How do I print one coloring page?', 'Tap Print this page under the picture. Only that page prints, on one sheet of letter or A4 paper.'],
    ['Who are these coloring pages for?', 'Kids from about three years old: thick lines and big shapes that are easy to color with crayons or markers. Older kids and adults can add patterns inside the shapes.'],
    ['Do you have a whole Christmas coloring book?', `Yes. We publish ${boeken.length} Christmas coloring books, from ${usd(Math.min(...boeken.map(b => b.p)))} on Amazon. They are below the pages.`],
  ];
  const body = `<p class="intro">${n} free Christmas coloring pages to print: a tree, a snowman, a gingerbread man, a candy cane, a stocking and more. Thick lines and big shapes, made for small hands.</p>`
    + `<p class="sprong np">${KLEUR.map(k => `<a class="pill" href="#k-${k.id}">${esc(k.naam)}</a>`).join('')}</p>`
    + `<div class="kleur">${KLEUR.map(k => `<section class="kp" id="k-${k.id}"><h2>${esc(k.naam)} coloring page</h2>${k.svg}<p class="knoppen np"><button class="btn" type="button" data-print="k-${k.id}">Print this page</button></p></section>`).join('')}</div>`
    + `<section class="stack np"><h2>A whole Christmas coloring book</h2><p>Our own coloring books keep kids busy longer than one page, and they fit in a stocking.</p>${plank(boeken)}<p><a href="${L('free-printable-christmas-word-search')}">Free Christmas word search</a> · <a href="${L('christmas-jokes')}">Christmas jokes for kids</a></p></section>`
    + faq(vragen) + `<style>.kleur{display:grid;grid-template-columns:repeat(2,1fr);gap:28px 18px}.kp{display:flex;flex-direction:column;gap:10px}.kp svg{width:100%;height:auto;display:block}.kp h2{font-size:17px}@media (max-width:560px){.kleur{grid-template-columns:1fr}}@media print{#printzone .kp svg{width:100%;max-height:96vh}#printzone .kp h2{display:none}}</style>`;
  return pagina(c, { slug: 'christmas-coloring-pages', title: `Free Christmas Coloring Pages: ${n} Easy Pages to Print`, desc: `${n} free printable Christmas coloring pages for kids: tree, snowman, gingerbread man, candy cane, stocking and more. Thick lines, one page per sheet.`, h1: 'Free Christmas coloring pages', body, ld: [faqLd(vragen), lijstLd('Christmas coloring books', boeken)] });
}

const PAGINA = { 'christmas-jokes': moppen, 'christmas-trivia': quiz, 'christmas-coloring-pages': kleuren, '': home, 'white-elephant-rules': regels, 'white-elephant-gifts-under-10': onderTien, 'stocking-stuffers': sokken, 'free-printable-christmas-word-search': printbaar, 'book-of-enoch': enoch, apocrypha, 'all-books': alleBoeken, about: over, 'stocking-stuffers-for-women': vrouwen, 'stocking-stuffers-for-men': mannen, 'stocking-stuffers-for-teens': tieners, 'white-elephant-gift-ideas': gidsWe, 'secret-santa-generator': geheim };
// c = { L: slug -> href, echt: draait op bookstuffers.com }. Geeft null bij een onbekende pagina.
export function render(slug, c) { const f = PAGINA[slug]; if (!f) return null; GO = c.echt ? (a => '/go/' + a) : (a => '/api/bs?op=go&a=' + a); return f(c); }
export const BOEK_ASIN = new Set([...BOEKEN.map(b => b.a), ...ANDER.map(b => b.a), LC.a, LC.hc.a]);

// Dezelfde controles als test/bookstuffers.test.mjs, op de echte uitvoer.
export function keur(html, slug) {
  const f = [];
  const h1 = (html.match(/<h1[\s>]/g) || []).length; if (h1 !== 1) f.push(`${slug}: ${h1} keer h1`);
  const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || ''; if (t.length < 25 || t.length > 70) f.push(`${slug}: titel ${t.length} tekens`);
  const d = (html.match(/name="description" content="([^"]*)"/) || [])[1] || ''; if (d.length < 70 || d.length > 165) f.push(`${slug}: omschrijving ${d.length} tekens`);
  if (/[—–]/.test(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ''))) f.push(`${slug}: gedachtestreepje`);
  if (/[?&]tag=/.test(html)) f.push(`${slug}: Amazon-tag in een link`);
  if (/\b(0 books|0 cost|nog geen|undefined|NaN|null)\b/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) f.push(`${slug}: nul of lege waarde in de tekst`);
  for (const m of html.matchAll(/<a class="boek"[\s\S]*?<\/a>/g)) if (!/<img src="https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+"/.test(m[0]) || !/href="(\/go\/|\/api\/bs\?op=go&a=)[A-Z0-9]{10}"/.test(m[0])) f.push(`${slug}: boekkaart zonder omslag of Amazon-link`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { f.push(`${slug}: JSON-LD ongeldig`); } }
  for (const m of html.matchAll(/(\d+) (?:funny )?(?:small )?(?:paperbacks|books)\b/g)) { const n = +m[1]; if (n > 400) f.push(`${slug}: vreemd aantal ${n}`); }
  return f;
}

export const ROBOTS = `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`;
export const sitemap = (extra = []) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...SLUGS, ...extra].map(s => `<url><loc>${BASE}/${s}</loc><lastmod>${BIJGEWERKT}</lastmod></url>`).join('\n')}\n</urlset>\n`;
export const llms = () => `# Stocking Books\n\n> Stocking Books (stockingbooks.com) is the shelf of a small publisher: ${TEL.boeken} small gift paperbacks for Christmas stockings and white elephant gift exchanges. ${TEL.tot5} cost $5 or less on Amazon.com (checked ${PRIJS_DATUM}). We publish every book listed. Links go to Amazon without affiliate tags.\n\n## Pages\n- [Free Secret Santa generator](${BASE}/secret-santa-generator): draw names, keep couples apart, set a budget, private link per person with gift ideas. No sign-up, nothing stored.\n- [White elephant gift ideas](${BASE}/white-elephant-gift-ideas): ideas by price limit (under $5, $10, $15, $25), the steal test, funny books from $4.99.\n- [Stocking stuffers for women](${BASE}/stocking-stuffers-for-women), [for men](${BASE}/stocking-stuffers-for-men) and [for teens](${BASE}/stocking-stuffers-for-teens): ideas by price, the five-slot rule and a stocking budget planner.\n- [White elephant rules](${BASE}/white-elephant-rules): the game in 8 steps, a printable rules card and a free number picker for the playing order.\n- [White elephant gifts under $10](${BASE}/white-elephant-gifts-under-10): ${TEL.we10} funny paperbacks under $10 with price and page count (dad jokes, fact books, bathroom word search, password logbooks).\n- [Stocking stuffer books](${BASE}/stocking-stuffers): all ${TEL.boeken} books sorted for her, for him, for anyone and for kids and teens.\n- [Free printable Christmas word search](${BASE}/free-printable-christmas-word-search): ${PUZZELS.length} large print puzzles with answer key, free, no sign-up.\n- [What is the Book of Enoch?](${BASE}/book-of-enoch): 1, 2 and 3 Enoch explained, 1 Enoch chapter by chapter, why it is not in the Bible, Jude 1:14-15.\n- [What is the Apocrypha?](${BASE}/apocrypha): the 14 books of the King James Apocrypha and which Bibles include them.\n- [Every book we publish](${BASE}/all-books): all ${TEL.alles} paperbacks, sorted by subject.\n- [Lasting Change Workbook](${LC_URL}): a 30-day habit workbook for people who did nothing this year and want next year to be different.\n- [About](${BASE}/about): who publishes the books and how the site earns.\n`;
// ZICHT-manifest (alleen toevoegen, een id nooit wijzigen). Proeven komen erbij zodra de site op het domein staat.
export const zichtJson = () => ({ site: 'bookstuffers', host: HOST, bijgewerkt: BIJGEWERKT,
  toegepast: [
    { les: 'geen-doorway-paginas', dag: '2026-11-22', wat: 'Zes pagina\'s op gelegenheid en ontvanger; prijsgrenzen en ontvangers zijn ankers en blokken op één pagina, geen pagina per variant.' },
    { les: 'schema-geen-ai-hefboom', dag: '2026-11-22', wat: 'ItemList, Book, FAQPage en BreadcrumbList volgen woord voor woord de zichtbare tekst; prijzen en pagina\'s uit dezelfde data.' },
    { les: 'rewrite-naar-eigen-domein-niet-vercel-app', dag: '2026-11-22', wat: 'Canonical altijd bookstuffers.com, sinds 23 nov 2026 stockingbooks.com; buiten dat domein noindex (kop en meta).' },
  ], proeven: [
    { id: 'bs-kerst-gratis-1123', les: 'pagina-op-grootste-zoekvraag', metric: 'gsc', na: 21, urls: [BASE + '/christmas-jokes', BASE + '/christmas-trivia', BASE + '/christmas-coloring-pages'], controle: [BASE + '/free-printable-christmas-word-search', BASE + '/white-elephant-rules'], wat: 'Drie gratis kerstpagina\'s op Demand Radar-vraag (US, 23 nov 2026): christmas jokes 40.500/mnd (piek 368.000), christmas trivia 27.100 (piek 301.000), christmas coloring pages 135.000 (piek 1,2 mln). Eigen inhoud (50 moppen, 40 quizvragen met feiten, 12 eigen SVG-kleurplaten), titel met zoekterm voorop, FAQ en Quiz-schema; controle: bestaande gratis pagina\'s.' },
  ], lessen: [
    { id: 'bs-naam-telt-1123', les: 'Een merknaam die in de branche een scheldwoord is (book stuffers = KDP-bedrog) laat AI-antwoorden de site wegzetten', kanaal: 'llm', bewijs: 'Google AI-antwoord op bookstuffers.com (23 nov 2026): geen bekende site, en de eerste link was een rechtszaak van Amazon tegen book stuffers. Hernoemd naar stockingbooks.com met 308.', bron: 'Henkjan, schermafbeelding Google', sterkte: 'middel', moeite: 'laag' },
  ], nvt: [] });

export const OVERDRACHT = `BOOKSTUFFERS (bookstuffers.com) · overdracht

Wat het is
De eigen boekenplank van Henkjan met kleine cadeauboeken (KDP): stocking stuffers en white elephant, plus een eigen pagina voor het
Lasting Change Workbook. Doel: organisch verkeer uit Google, Bing en AI-assistenten in de VS, elk jaar sterker op dezelfde adressen.
Henkjan 22 nov 2026: "Ja bookstuffers doen we", "Voer je plan uit", "gebruik de sealedintent.com design", "Boeken wel altijd pic".

Waar de code staat (repo hjdk-api)
- lib/bs-data.js: de boeken (ASIN, omslag, titel, soort, prijs, pagina's, voor wie), Lasting Change en de woorden van de gratis puzzels.
- lib/bs.js: opmaak (kleuren en maten van sealedintent.com), teksten en de pagina's, sitemap, llms.txt, zicht.json en dit document.
- fn/bs.js: het eindpunt. Op bookstuffers.com via rewrites in vercel.json; overal anders als /api/bs?p=<pagina> (noindex).
- test/bookstuffers.test.mjs: de controle (zie onder). Draai hem voor elke push.

Regels
- Alleen feiten uit de Amazon-listing; niets verzinnen over de inhoud; geen reviews of quotes verzinnen; geen gedachtestreepjes.
- Elk boek altijd met omslag. Geen grijs, één tekstmaat. Nooit nullen of lege tellers tonen: aantallen komen uit de data.
- Links recht naar Amazon zonder tag (Associates-account is dicht). Wij zeggen dat wij de uitgever zijn.
- Geen pagina per zoekvariant; een nieuwe pagina alleen bij gemeten vraag uit Demand Radar (thema's bookstuffers en jaar-reset).
- Eerst aan Henkjan laten zien (link), dan pas live. Prijs gewijzigd in KDP: lib/bs-data.js en PRIJS_DATUM bijwerken.

Controle
- node --test test/bookstuffers.test.mjs: elke pagina rendert, één h1, titel en omschrijving op lengte, elk boek met omslag en Amazon-link,
  geen tag, geen gedachtestreepjes, tellingen in titels kloppen met de plank, interne links bestaan, JSON-LD is geldig.
- Live: /api/bs?op=gezond (zelfde controles) en &omslagen=1 (vraagt elke omslag op; een omslag die weg is staat in fouten).

Stand en open punten
Zie het levende deel hieronder (fn/bs.js zet de tellingen erbij).
`;
