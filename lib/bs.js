// Bookstuffers (bookstuffers.com): pagina's, opmaak en teksten. Henkjan 22 nov 2026: "Ja bookstuffers doen we", "Voer je plan uit",
// "gebruik de sealedintent.com design", "Boeken wel altijd pic natuurlijk geven . Dat is dan kleur op de pagina", en een aparte pagina voor
// Lasting Change "voor mensen die helemaal geen flikker gedaan hebben en nu wel dit komend jaar willen scoren".
// Opzet (ZICHT): weinig sterke pagina's op gelegenheid en ontvanger, geen pagina per zoekvariant; het antwoord bovenaan; aantallen komen
// uit de data (nooit met de hand); alleen feiten uit de listing; wij zeggen dat wij de uitgever zijn; links recht naar Amazon zonder tag.
// Opmaak: de kleuren, het lettertype en de maten van sealedintent.com (lib/sealed.js): één tekstmaat, geen grijs, de omslagen zijn de kleur.
import { BOEKEN, LC, SOORT, PUZZELS, PRIJS_DATUM, ANDER, GROEP } from './bs-data.js';

export const HOST = 'bookstuffers.com', BASE = 'https://' + HOST;
export const BIJGEWERKT = '2026-11-22'; // alleen ophogen bij een echte wijziging van inhoud (eerlijke lastmod)
export const INDEXNOW_KEY = '5abf3f017f44047e41ec98545041a2cf';
export const SLUGS = ['', 'white-elephant-rules', 'white-elephant-gifts-under-10', 'stocking-stuffers', 'free-printable-christmas-word-search', 'book-of-enoch', 'apocrypha', 'all-books', 'about'];
export const LC_URL = 'https://lastingchange.works/'; // Lasting Change heeft sinds 22 nov 2026 zijn eigen funnel (lib/lcfunnel.js); bookstuffers.com/lasting-change stuurt daarheen
const BEDRIJF = 'Bookstuffers is a service of Adsfair B.V., Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands.';
const ORG = { '@type': 'Organization', name: 'Bookstuffers', url: BASE + '/' };

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const usd = p => '$' + Number(p).toFixed(2);
const dag = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
export const amz = a => 'https://www.amazon.com/dp/' + a;
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
  return `<a class="boek" href="${GO(b.a)}" data-bs="${b.a}" rel="noopener"><img src="${omslag(b.i)}" alt="${esc(b.t)}, book cover" width="375" height="500" loading="${snel ? 'eager' : 'lazy'}" decoding="async"><b>${esc(b.t)}</b><span>${b.k ? SOORT[b.k][0] + ', ' : ''}${b.n} pages${b.c >= 10 ? ` · ★ ${b.r} (${b.c} ratings)` : ''}</span><span class="prijs">${usd(b.p)} on Amazon</span></a>`;
}
const plank = (lijst, snel = 0) => `<div class="plank">${lijst.map((b, i) => kaart(b, i < snel)).join('')}</div>`;
const faq = paren => `<section class="stack"><h2>Questions people ask</h2><div class="faq">${paren.map(([v, a]) => `<div><h3>${esc(v)}</h3><p>${esc(a)}</p></div>`).join('')}</div></section>`;
const faqLd = paren => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: paren.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const lijstLd = (naam, lijst) => ({ '@context': 'https://schema.org', '@type': 'ItemList', name: naam, numberOfItems: lijst.length, itemListElement: lijst.map((b, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Book', name: b.t, image: omslag(b.i), url: amz(b.a), numberOfPages: b.n, bookFormat: 'https://schema.org/Paperback', offers: { '@type': 'Offer', price: Number(b.p).toFixed(2), priceCurrency: 'USD', url: amz(b.a) } } })) });
const PRIJSREGEL = `Prices and page counts as we saw them on Amazon.com on ${dag(PRIJS_DATUM)}. The price on Amazon is the one that counts.`;

function pagina(c, o) {
  const canon = BASE + '/' + o.slug, L = c.L;
  const ld = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: o.title, description: o.desc, url: canon, dateModified: BIJGEWERKT, inLanguage: 'en-US', isPartOf: { '@type': 'WebSite', name: 'Bookstuffers', url: BASE + '/' }, publisher: ORG }, ...(o.ld || [])];
  if (o.slug) ld.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Bookstuffers', item: BASE + '/' }, { '@type': 'ListItem', position: 2, name: o.kruimel || o.h1, item: canon }] });
  const nav = [['white-elephant-rules', 'White elephant rules'], ['white-elephant-gifts-under-10', 'White elephant gifts under $10'], ['stocking-stuffers', 'Stocking stuffer books'], ['free-printable-christmas-word-search', 'Free printable word search'], ['book-of-enoch', 'What is the Book of Enoch?'], ['apocrypha', 'What is the Apocrypha?'], ['all-books', 'Every book we publish'], ['about', 'About']];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="referrer" content="no-referrer">`
    + `<title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}"><meta name="robots" content="${c.echt ? 'index,follow,max-snippet:-1,max-image-preview:large' : 'noindex,nofollow'}"><link rel="canonical" href="${canon}">`
    + `<meta property="og:type" content="website"><meta property="og:site_name" content="Bookstuffers"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${omslag(o.beeld || BOEKEN[0].i)}">`
    + `<link rel="icon" type="image/svg+xml" href="${c.echt ? '/favicon.svg' : '/api/bs?op=fav'}"><meta name="theme-color" content="#111113"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://m.media-amazon.com">`
    + `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"><style>${CSS}</style>`
    + ld.map(x => `<script type="application/ld+json">${json(x)}</script>`).join('')
    + `<script src="/cm.js" data-site="bookstuffers" async></script></head><body><div class="w">`
    + `<header><div class="top-in"><a class="merk" href="${L('')}">${LOGO}<span>book<span>stuffers</span></span></a>${o.slug === 'white-elephant-rules' ? '' : `<nav><a href="${L('white-elephant-rules')}">White elephant rules</a></nav>`}</div></header>`
    + `<main><article><div class="kopblok"><p class="meta">Updated <time datetime="${BIJGEWERKT}">${dag(BIJGEWERKT)}</time></p><h1>${esc(o.h1)}</h1></div>${o.body}</article>`
    + `<nav class="meer np" aria-label="More"><p class="eb">More</p>${nav.filter(([s]) => s !== o.slug).map(([s, t]) => `<a href="${L(s)}">${esc(t)}</a>`).join('')}</nav></main>`
    + `<footer class="np"><div><p>We publish every book on this shelf. Links go straight to Amazon, without affiliate tags.</p><p>${esc(PRIJSREGEL)}</p><p>© 2026 Bookstuffers · ${esc(BEDRIJF)}</p></div></footer>`
    + `<div id="printzone"></div><script>${JS}</script></body></html>`;
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
  const title = 'Bookstuffers: Small Gift Books From $4.99 for Stockings and Swaps';
  const desc = `${TEL.boeken} small paperbacks for a stocking or a white elephant swap: dad jokes, fact books, bathroom word search and Christmas sudoku. ${TEL.tot5} cost $5 or less.`;
  const blok = (kop, tekst, lijst, slug, anker, linktekst, snel) => `<section class="stack"><h2>${kop}</h2><p>${tekst}</p>${plank(lijst.slice(0, 6), snel)}<p><a href="${L(slug)}${anker}">${linktekst}</a></p></section>`;
  const body = `<p class="intro">${TEL.boeken} paperbacks we publish ourselves. ${TEL.tot5} of them cost $5 or less, and every one ships from Amazon.</p>`
    + `<a class="btn" href="${L('white-elephant-gifts-under-10')}">See the white elephant picks</a>`
    + blok('For a white elephant swap', 'Funny, flat to wrap and under $10.', WE10, 'white-elephant-gifts-under-10', '', `All ${WE10.length} white elephant books under $10`, 3)
    + blok('For her stocking', 'Sudoku for a quiet morning and logbooks that say it out loud.', vrouwen, 'stocking-stuffers', '#for-her', `All ${vrouwen.length} books for her`)
    + blok('For his stocking', 'Dad jokes, rare facts and a place to rate every beer.', mannen, 'stocking-stuffers', '#for-him', `All ${mannen.length} books for him`)
    + blok('For kids and teens', 'Coloring, word search and 408 facts for the back seat.', jong, 'stocking-stuffers', '#for-kids-and-teens', `All ${jong.length} books for kids and teens`)
    + `<section class="tool"><h2>Free to print</h2><p>Three Christmas word search puzzles in large print. Print them at home, no sign-up.</p><a class="btn" href="${L('free-printable-christmas-word-search')}">Open the free puzzles</a></section>`
    + `<section class="tool"><h2>Playing white elephant?</h2><p>The rules in 8 steps, a card to print and a free number picker for the playing order.</p><a class="link" href="${L('white-elephant-rules')}">Read the white elephant rules</a></section>`
    + `<section class="held"><div class="stack"><h2>Did nothing this year?</h2><p>The Lasting Change Workbook is 30 days, one habit and a daily check-in, for the year you stop starting over.</p><p><a href="${LC_URL}">I am not doing that again</a></p></div><a href="${LC_URL}"><img src="${omslag(LC.i)}" alt="Lasting Change Workbook, book cover" width="333" height="500" loading="lazy" decoding="async"></a></section>`;
  const restLijst = `<nav class="meer"><p class="eb">The rest of our shelf</p>${Object.entries(GROEP).map(([g, kop]) => [g, kop, ANDER.filter(b => b.g === g).length]).filter(x => x[2]).map(([g, kop, n]) => `<a href="${L('all-books')}#${g}">${esc(kop)} (${n})</a>`).join('')}</nav>`;
  return pagina(c, { slug: '', title, desc, h1: 'Small gift books that fit in a stocking', body: body + restLijst, ld: [lijstLd('White elephant books under $10', WE10.slice(0, 6))] });
}

function regels(c) {
  const L = c.L;
  const vragen = [
    ['How many times can a gift be stolen in white elephant?', 'Most groups allow three steals per gift. After the third steal the gift is frozen and stays with that player. Your group can pick another number, as long as everyone hears it before the first gift is opened.'],
    ['Is there a white elephant number generator?', 'Yes. The free number picker on this page draws a random playing order for 2 to 80 players. Add names for a list to read out, or leave the names empty and hand out the numbers.'],
    ['What is a good white elephant gift under $10?', `Something small that gets a laugh when it is opened. We publish ${WE10.length} funny paperbacks under $10 for this, from dad jokes to bathroom word search, starting at $4.99.`],
    ['What is the difference between white elephant and Secret Santa?', 'In white elephant nobody knows who gets which gift: gifts are opened in turn and can be stolen. In Secret Santa each person is given one name and buys a gift for that person.'],
  ];
  const body = `<p class="intro">Everyone brings one wrapped gift and draws a number. On your turn you open a new gift or steal one that is already open. Most groups freeze a gift after its third steal, and when the last gift is open, player 1 may swap once.</p>`
    + `<section class="kaartp" id="rules-card"><h2>White elephant rules in 8 steps</h2><ol class="stappen">${REGELS.map(r => `<li>${esc(r)}</li>`).join('')}</ol><p>House rules differ. Say yours out loud before the first gift is opened.</p></section>`
    + `<p class="knoppen np"><button class="btn" type="button" data-print="rules-card">Print the rules card</button></p>`
    + `<section class="tool np" id="number-picker"><h2>Free number picker</h2><div class="veld"><label for="spelers">How many players?</label><input id="spelers" type="number" inputmode="numeric" min="2" max="80" value="12"></div><div class="veld"><label for="namen">Names, one per line (optional)</label><textarea id="namen" rows="4" placeholder="Leave empty to draw plain numbers"></textarea></div><button class="btn" type="button" id="trek">Draw the order</button><p id="uitleg" hidden></p><ol class="volgorde" id="volgorde" hidden></ol></section>`
    + `<section class="stack"><h2>Yankee Swap, Dirty Santa and other names</h2><p>Yankee Swap and Dirty Santa are regional names for the same game. Some groups limit steals to one per turn, some let player 1 go again at the end and some play with a theme. Whatever you call it, the price limit and the steal limit are the two rules to settle first.</p></section>`
    + `<section class="stack"><h2>What to bring for a $5 or $10 limit</h2><p>A funny paperback is the easy pick: it wraps flat and nobody can guess it from the shape. ${TEL.weTot5} of ours cost $5 or less.</p>${plank(WE10.slice(0, 6))}<p><a href="${L('white-elephant-gifts-under-10')}">All ${WE10.length} white elephant books under $10</a></p></section>`
    + faq(vragen);
  return pagina(c, { slug: 'white-elephant-rules', title: 'White Elephant Rules: How to Play, Plus a Free Number Picker', desc: 'The white elephant gift exchange rules in 8 steps, a rules card to print and a free number picker that draws the playing order for your party.', h1: 'White elephant rules', body, ld: [faqLd(vragen)] });
}

function onderTien(c) {
  const L = c.L, n = WE10.length;
  const vragen = [
    ['What are good white elephant gifts under $5?', `${TEL.weTot5} of the books on this page cost $5 or less on Amazon as of ${dag(PRIJS_DATUM)}, including every single-volume bathroom word search.`],
    ['What if our limit is $15, $20 or $25?', `Pick one of the bigger fact and joke books further down this page, or wrap two of the $4.99 books together.`],
    ['Who publishes these books?', 'We do. Bookstuffers is the shelf for our own paperbacks, so we earn the publisher royalty when you buy one. Links go straight to Amazon, without affiliate tags.'],
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
    ['Are these books large print?', 'Some are. When a book is large print, it says so in its title, for example Christmas Around the World Large Print Word Search.'],
  ];
  const body = `<p class="intro">${TEL.boeken} small paperbacks that slide into a stocking: puzzles for a quiet Christmas morning, jokes and facts to read out loud and logbooks for the year ahead. ${TEL.tot5} cost $5 or less.</p>`
    + `<p class="sprong">${delen.map(([id, kop, l]) => `<a class="pill" href="#${id}">${kop} (${l.length})</a>`).join('')}</p>`
    + delen.map(([id, kop, l], i) => `<section class="stack" id="${id}"><h2>${kop}</h2>${plank(l, i === 0 ? 3 : 0)}</section>`).join('')
    + `<section class="tool"><h2>Free to print</h2><p>Three Christmas word search puzzles in large print, for the table on Christmas morning.</p><a class="link" href="${L('free-printable-christmas-word-search')}">Open the free puzzles</a></section>`
    + faq(vragen);
  return pagina(c, { slug: 'stocking-stuffers', title: `Stocking Stuffer Books: ${TEL.boeken} Paperbacks From $4.99`, desc: `${TEL.boeken} small paperbacks for a Christmas stocking, sorted for her, for him, for anyone and for kids and teens. ${TEL.tot5} cost $5 or less on Amazon.`, h1: 'Stocking stuffer books', kruimel: 'Stocking stuffer books', body, ld: [lijstLd('Stocking stuffer books', BOEKEN), faqLd(vragen)] });
}

function printbaar(c) {
  const L = c.L, ws = soort(BOEKEN, 'xmasws');
  const vragen = [
    ['Can I print these for a classroom or a party?', 'Yes. Print as many copies as you need for your own class, family or party.'],
    ['Is there an answer key?', 'Yes. Tap Show the answers under a puzzle and every word lights up.'],
    ['Which way do the words run?', 'Across, down and diagonally down. No word runs backwards.'],
  ];
  const body = `<p class="intro">Three Christmas word search puzzles in large print, free to print at home. No sign-up. Every puzzle has 12 words that run across, down or diagonally down.</p>`
    + `<p class="sprong np">${PUZZELS.map(p => `<a class="pill" href="#${p.id}">${esc(p.naam)}</a>`).join('')}</p>`
    + PUZZELS.map(puzzelHtml).join('')
    + `<section class="stack np"><h2>Want a whole book of them?</h2><p>${ws.length} Christmas word search books, each ${usd(Math.min(...ws.map(b => b.p)))} on Amazon.</p>${plank(ws)}<p><a href="${L('stocking-stuffers')}">All ${TEL.boeken} stocking stuffer books</a></p></section>`
    + faq(vragen);
  return pagina(c, { slug: 'free-printable-christmas-word-search', title: 'Free Printable Christmas Word Search: 3 Large Print Puzzles', desc: 'Three free printable Christmas word search puzzles in large print, with an answer key. Print them at home for the family, a class or a party. No sign-up.', h1: 'Free printable Christmas word search', body, beeld: ws[0].i, ld: [faqLd(vragen)] });
}

function over(c) {
  const L = c.L;
  const body = `<p class="intro">Bookstuffers is the shelf for our own small gift books. We make and publish them, and Amazon prints and ships each copy.</p>`
    + `<section class="stack"><h2>What we show</h2><p>The title, the price and the page count of each book, as they were on Amazon.com on ${dag(PRIJS_DATUM)}. Prices can change, so the price on Amazon is the one that counts.</p></section>`
    + `<section class="stack"><h2>How we earn</h2><p>We get the publisher royalty when you buy one of our books. Links go straight to Amazon. There are no affiliate tags and no paid placements.</p></section>`
    + `<section class="stack"><h2>What is free</h2><p>The <a href="${L('white-elephant-rules')}">white elephant rules</a> with the number picker and the <a href="${L('free-printable-christmas-word-search')}">printable Christmas word search puzzles</a> are free, without sign-up.</p></section>`
    + `<section class="stack"><h2>Who we are</h2><p>${esc(BEDRIJF)}</p></section>`;
  return pagina(c, { slug: 'about', title: 'About Bookstuffers: Who Makes These Small Gift Books', desc: 'Bookstuffers is the shelf for our own small gift books. We publish them, Amazon prints and ships them, and links carry no affiliate tags.', h1: 'About Bookstuffers', body });
}

const ENOCH = ANDER.find(b => b.a === 'B0B5KV79N1'), APO = ANDER.find(b => b.a === 'B0DDBTXC9J');
const eigenBoek = (b, zin) => `<section class="held"><div class="stack"><p class="eb">Our edition</p><h2>${esc(b.t)}</h2><p>${zin}</p><p>${b.n} pages, ${usd(b.p)} on Amazon${b.c >= 10 ? `, rated ${b.r} out of 5 by ${b.c} readers` : ''}. We publish this edition.</p><a class="btn" href="${GO(b.a)}" data-bs="${b.a}" rel="noopener">See the book</a></div><a href="${GO(b.a)}" data-bs="${b.a}" rel="noopener"><img src="${omslag(b.i)}" alt="${esc(b.t)}, book cover" width="375" height="500" loading="lazy" decoding="async"></a></section>`;
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
  const boeken = ['1 Esdras', '2 Esdras', 'Tobit', 'Judith', 'The rest of Esther', 'The Wisdom of Solomon', 'Ecclesiasticus (Sirach)', 'Baruch, with the Letter of Jeremiah', 'The Song of the Three Holy Children', 'The Story of Susanna', 'Bel and the Dragon', 'The Prayer of Manasseh', '1 Maccabees', '2 Maccabees'];
  const vragen = [
    ['Why were the Apocrypha removed from Protestant Bibles?', 'The Reformers followed the Hebrew Bible, which does not contain them. Luther printed them in a separate section in 1534, and from the 1800s most Protestant Bibles left them out to save cost.'],
    ['Do Catholic Bibles have the Apocrypha?', 'Yes. Catholics call seven of these books and the additions to Esther and Daniel deuterocanonical, and the Council of Trent confirmed them in 1546.'],
    ['Is the Book of Enoch part of the Apocrypha?', 'Usually not. Enoch is counted among the pseudepigrapha, books credited to ancient figures. Only the Ethiopian and Eritrean Orthodox churches have it in their Bible.'],
    ['Was the Apocrypha in the King James Bible?', 'Yes. The 1611 King James Version printed the 14 books of the Apocrypha in their own section between the Old and the New Testament.'],
  ];
  const body = `<p class="intro">The Apocrypha are Jewish books from the last centuries before Christ. They are in Catholic and Orthodox Bibles, but not in the Hebrew Bible or most Protestant Bibles. The 1611 King James Bible printed them in their own section.</p>`
    + `<section class="stack"><h2>The 14 books of the King James Apocrypha</h2><ol class="stappen">${boeken.map(b => `<li>${esc(b)}</li>`).join('')}</ol></section>`
    + `<section class="stack"><h2>Which Bibles include them</h2><ul class="k"><li><b>Catholic Bibles</b> include Tobit, Judith, Wisdom, Sirach, Baruch, 1 and 2 Maccabees and the additions to Esther and Daniel. Catholics call them deuterocanonical.</li><li><b>Orthodox Bibles</b> include those and more, such as 1 Esdras and 3 Maccabees.</li><li><b>Protestant Bibles</b> follow the Hebrew Bible. Older editions printed the Apocrypha in a separate section; most modern ones leave them out.</li></ul></section>`
    + `<section class="stack"><h2>Why people read them now</h2><p>They fill the 400 years between the Old and the New Testament: the Maccabean revolt behind Hanukkah, the wisdom of Sirach, and stories like Tobit and Judith that painters and composers kept returning to.</p></section>`
    + eigenBoek(APO, 'The books left out of the Bible in one paperback, with a foreword and introductions by Edward Whelan.')
    + `<p><a href="${L('book-of-enoch')}">Read next: what is the Book of Enoch?</a></p>`
    + faq(vragen);
  return pagina(c, { slug: 'apocrypha', title: 'What Is the Apocrypha? The Books Left Out of the Bible', desc: 'What the Apocrypha are, the 14 books of the King James Apocrypha, which Bibles include them and why Protestant Bibles left them out.', h1: 'What is the Apocrypha?', kruimel: 'What is the Apocrypha?', body, beeld: APO.i, ld: [boekLd(APO), faqLd(vragen)] });
}

function alleBoeken(c) {
  const L = c.L, groepen = Object.entries(GROEP).map(([g, kop]) => [g, kop, ANDER.filter(b => b.g === g)]).filter(x => x[2].length);
  const body = `<p class="intro">Every paperback we publish, ${TEL.alles} in all. The Christmas books are on the <a href="${L('stocking-stuffers')}">stocking stuffer page</a>, and the Lasting Change Workbook has <a href="${LC_URL}">its own page</a>.</p>`
    + `<p class="sprong">${groepen.map(([g, kop, l]) => `<a class="pill" href="#${g}">${esc(kop)} (${l.length})</a>`).join('')}</p>`
    + groepen.map(([g, kop, l], i) => `<section class="stack" id="${g}"><h2>${esc(kop)}</h2>${plank(l, i === 0 ? 3 : 0)}</section>`).join('');
  return pagina(c, { slug: 'all-books', title: `Every Book We Publish: ${TEL.alles} Paperbacks`, desc: `All ${TEL.alles} paperbacks we publish: Bible and Enoch, cookbooks, health and mind, large print word search, coloring books and more.`, h1: 'Every book we publish', body, ld: [lijstLd('Every book we publish', ANDER)] });
}

const PAGINA = { '': home, 'white-elephant-rules': regels, 'white-elephant-gifts-under-10': onderTien, 'stocking-stuffers': sokken, 'free-printable-christmas-word-search': printbaar, 'book-of-enoch': enoch, apocrypha, 'all-books': alleBoeken, about: over };
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
export const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SLUGS.map(s => `<url><loc>${BASE}/${s}</loc><lastmod>${BIJGEWERKT}</lastmod></url>`).join('\n')}\n</urlset>\n`;
export const llms = () => `# Bookstuffers\n\n> Bookstuffers (bookstuffers.com) is the shelf of a small publisher: ${TEL.boeken} small gift paperbacks for Christmas stockings and white elephant gift exchanges. ${TEL.tot5} cost $5 or less on Amazon.com (checked ${PRIJS_DATUM}). We publish every book listed. Links go to Amazon without affiliate tags.\n\n## Pages\n- [White elephant rules](${BASE}/white-elephant-rules): the game in 8 steps, a printable rules card and a free number picker for the playing order.\n- [White elephant gifts under $10](${BASE}/white-elephant-gifts-under-10): ${TEL.we10} funny paperbacks under $10 with price and page count (dad jokes, fact books, bathroom word search, password logbooks).\n- [Stocking stuffer books](${BASE}/stocking-stuffers): all ${TEL.boeken} books sorted for her, for him, for anyone and for kids and teens.\n- [Free printable Christmas word search](${BASE}/free-printable-christmas-word-search): 3 large print puzzles with answer key, free, no sign-up.\n- [What is the Book of Enoch?](${BASE}/book-of-enoch): 1, 2 and 3 Enoch explained, 1 Enoch chapter by chapter, why it is not in the Bible, Jude 1:14-15.\n- [What is the Apocrypha?](${BASE}/apocrypha): the 14 books of the King James Apocrypha and which Bibles include them.\n- [Every book we publish](${BASE}/all-books): all ${TEL.alles} paperbacks, sorted by subject.\n- [Lasting Change Workbook](${LC_URL}): a 30-day habit workbook for people who did nothing this year and want next year to be different.\n- [About](${BASE}/about): who publishes the books and how the site earns.\n`;
// ZICHT-manifest (alleen toevoegen, een id nooit wijzigen). Proeven komen erbij zodra de site op het domein staat.
export const zichtJson = () => ({ site: 'bookstuffers', host: HOST, bijgewerkt: BIJGEWERKT,
  toegepast: [
    { les: 'geen-doorway-paginas', dag: '2026-11-22', wat: 'Zes pagina\'s op gelegenheid en ontvanger; prijsgrenzen en ontvangers zijn ankers en blokken op één pagina, geen pagina per variant.' },
    { les: 'schema-geen-ai-hefboom', dag: '2026-11-22', wat: 'ItemList, Book, FAQPage en BreadcrumbList volgen woord voor woord de zichtbare tekst; prijzen en pagina\'s uit dezelfde data.' },
    { les: 'rewrite-naar-eigen-domein-niet-vercel-app', dag: '2026-11-22', wat: 'Canonical altijd bookstuffers.com; buiten dat domein noindex (kop en meta).' },
  ], proeven: [], lessen: [], nvt: [] });

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
