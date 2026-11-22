// Bookstuffers (bookstuffers.com): pagina's, opmaak en teksten. Henkjan 22 nov 2026: "Ja bookstuffers doen we", "Voer je plan uit",
// "gebruik de sealedintent.com design", "Boeken wel altijd pic natuurlijk geven . Dat is dan kleur op de pagina", en een aparte pagina voor
// Lasting Change "voor mensen die helemaal geen flikker gedaan hebben en nu wel dit komend jaar willen scoren".
// Opzet (ZICHT): weinig sterke pagina's op gelegenheid en ontvanger, geen pagina per zoekvariant; het antwoord bovenaan; aantallen komen
// uit de data (nooit met de hand); alleen feiten uit de listing; wij zeggen dat wij de uitgever zijn; links recht naar Amazon zonder tag.
// Opmaak: de kleuren, het lettertype en de maten van sealedintent.com (lib/sealed.js): één tekstmaat, geen grijs, de omslagen zijn de kleur.
import { BOEKEN, LC, SOORT, PUZZELS, PRIJS_DATUM } from './bs-data.js';

export const HOST = 'bookstuffers.com', BASE = 'https://' + HOST;
export const BIJGEWERKT = '2026-11-22'; // alleen ophogen bij een echte wijziging van inhoud (eerlijke lastmod)
export const INDEXNOW_KEY = '5abf3f017f44047e41ec98545041a2cf';
export const SLUGS = ['', 'white-elephant-rules', 'white-elephant-gifts-under-10', 'stocking-stuffers', 'free-printable-christmas-word-search', 'lasting-change', 'about'];
const BEDRIJF = 'Bookstuffers is a service of Adsfair B.V., Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands.';
const ORG = { '@type': 'Organization', name: 'Bookstuffers', url: BASE + '/' };

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
export const TEL = { boeken: BOEKEN.length, tot5: tot5(BOEKEN), we10: WE10.length, weTot5: tot5(WE10) };

const CSS = `
:root{--bg:#fff;--ink:#0B1640;--accent:#2B47C4;--on:#fff;--soft:#EEF1FC;--line:#D3DAF4;--kop:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--body:18px;--h1:40px;--h2:26px}
@media (prefers-color-scheme:dark){:root{--bg:#0A1030;--ink:#EEF1FC;--accent:#9DB0FF;--on:#0A1030;--soft:#141D4A;--line:#2A3670;color-scheme:dark}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:400 var(--body)/1.55 "Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.w{max-width:680px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:18px 56px}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:28px}
.merk{display:flex;align-items:center;gap:10px;color:var(--ink);text-decoration:none;font-weight:700;letter-spacing:-.01em}.merk svg{color:var(--accent)}
h1,h2,h3{font-family:var(--kop);margin:0;text-wrap:balance}
h1{font-size:var(--h1);line-height:1.08;font-weight:700;letter-spacing:-.025em}
h2{font-size:var(--h2);line-height:1.2;font-weight:600;letter-spacing:-.015em}
h3{font-size:var(--body);line-height:1.4;font-weight:700}
p{margin:0}a{color:var(--accent);text-underline-offset:4px;text-decoration-thickness:1px}
article,.stack{display:flex;flex-direction:column}article{gap:30px}.stack{gap:14px}
.meta{color:var(--accent)}.gedachte{font-weight:600}
.btn{align-self:flex-start;background:var(--accent);color:var(--on);border:0;border-radius:999px;padding:15px 28px;font:inherit;font-weight:700;line-height:1.2;cursor:pointer;text-decoration:none;text-align:center}
.link{background:none;border:0;padding:0;color:var(--accent);font:inherit;font-weight:600;line-height:1.4;cursor:pointer;text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:1px;align-self:flex-start;text-align:left}
.plank{display:grid;grid-template-columns:repeat(3,1fr);gap:26px 16px}
.boek{display:flex;flex-direction:column;gap:6px;color:var(--ink);text-decoration:none;min-width:0}
.boek img{width:100%;height:auto;aspect-ratio:3/4;object-fit:contain;background:var(--soft);border-radius:12px;padding:8px}
.boek b{font-weight:700;line-height:1.3;overflow-wrap:anywhere}.boek .prijs{color:var(--accent);font-weight:700}
.tool{background:var(--soft);border-radius:18px;padding:22px;display:flex;flex-direction:column;gap:16px}
label{font-weight:700}.veld{display:flex;flex-direction:column;gap:8px}
input,textarea{width:100%;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:13px 14px;font:inherit;line-height:1.3}
.stappen,.volgorde,ul.k{margin:0;padding-left:1.3em;display:flex;flex-direction:column;gap:8px}.stappen li::marker,.volgorde li::marker,ul.k li::marker{color:var(--accent);font-weight:700}
.sprong{display:flex;flex-wrap:wrap;gap:8px 18px}
.faq{display:flex;flex-direction:column;gap:20px}.faq div{display:flex;flex-direction:column;gap:6px}
.kaartp{border:2px solid var(--accent);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:12px}
.held{display:grid;grid-template-columns:1fr 210px;gap:26px;align-items:start}.held img{width:100%;height:auto;border-radius:12px;background:var(--soft)}
.ws{border-collapse:collapse;margin:0 auto;font-weight:700;font-size:min(20px,3.9vw);line-height:1}.ws td{width:1.9em;height:1.9em;text-align:center;border:1px solid var(--line);padding:0}
.pz{display:flex;flex-direction:column;gap:16px}.pz.antw td.o{background:var(--accent);color:var(--on)}
.woorden{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:6px 12px;font-weight:600}
.knoppen{display:flex;flex-wrap:wrap;align-items:center;gap:14px 22px}
footer{margin-top:52px;padding-top:18px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:10px}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
#printzone{display:none}
@media (max-width:480px){:root{--h1:32px;--h2:23px}.btn{align-self:stretch}header{padding-bottom:18px}article{gap:24px}.w{padding-block:12px 48px}.plank{grid-template-columns:repeat(2,1fr)}.held{grid-template-columns:1fr}.held>a{order:-1}.held img{max-width:130px}}
@media print{body.pr>*:not(#printzone){display:none!important}body.pr #printzone{display:block;color:#000}.np{display:none!important}.ws td{border-color:#000}.kaartp{border-color:#000}}
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

const LOGO = '<svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true"><path d="M6 5h14a6 6 0 0 1 6 6v16H12a6 6 0 0 1-6-6V5Z"/><path d="M6 21a6 6 0 0 1 6-6h14"/><path d="M12 5v10"/></svg>';
export const FAVICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#2B47C4"/><g fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"><path d="M8 7h10a6 6 0 0 1 6 6v12H14a6 6 0 0 1-6-6V7Z"/><path d="M8 19a6 6 0 0 1 6-6h10"/></g></svg>';

// --- bouwstenen -------------------------------------------------------------------------------------------------------------------
function kaart(b, snel) {
  return `<a class="boek" href="${amz(b.a)}" data-bs="${b.a}" rel="noopener"><img src="${omslag(b.i)}" alt="${esc(b.t)}, book cover" width="375" height="500" loading="${snel ? 'eager' : 'lazy'}" decoding="async"><b>${esc(b.t)}</b><span>${SOORT[b.k][0]}, ${b.n} pages</span><span class="prijs">${usd(b.p)} on Amazon</span></a>`;
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
  const nav = [['white-elephant-rules', 'White elephant rules'], ['white-elephant-gifts-under-10', 'White elephant gifts under $10'], ['stocking-stuffers', 'Stocking stuffer books'], ['free-printable-christmas-word-search', 'Free printable word search'], ['lasting-change', 'Lasting Change'], ['about', 'About']];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="referrer" content="no-referrer">`
    + `<title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}"><meta name="robots" content="${c.echt ? 'index,follow,max-snippet:-1,max-image-preview:large' : 'noindex,nofollow'}"><link rel="canonical" href="${canon}">`
    + `<meta property="og:type" content="website"><meta property="og:site_name" content="Bookstuffers"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${omslag(o.beeld || BOEKEN[0].i)}">`
    + `<link rel="icon" type="image/svg+xml" href="${c.echt ? '/favicon.svg' : '/api/bs?op=fav'}"><meta name="theme-color" content="#2B47C4"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://m.media-amazon.com">`
    + `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"><style>${CSS}</style>`
    + ld.map(x => `<script type="application/ld+json">${json(x)}</script>`).join('')
    + `<script src="/cm.js" data-site="bookstuffers" async></script></head><body><div class="w">`
    + `<header><a class="merk" href="${L('')}">${LOGO}<span>Bookstuffers</span></a>${o.slug === 'white-elephant-rules' ? '' : `<a href="${L('white-elephant-rules')}">White elephant rules</a>`}</header>`
    + `<main><article><p class="meta">Updated <time datetime="${BIJGEWERKT}">${dag(BIJGEWERKT)}</time></p><h1>${esc(o.h1)}</h1>${o.body}</article></main>`
    + `<footer class="np"><p>${nav.filter(([s]) => s !== o.slug).map(([s, t]) => `<a href="${L(s)}">${esc(t)}</a>`).join(' · ')}</p><p>We publish every book on this shelf. Links go straight to Amazon, without affiliate tags.</p><p>${esc(PRIJSREGEL)}</p><p>${esc(BEDRIJF)}</p></footer>`
    + `</div><div id="printzone"></div><script>${JS}</script></body></html>`;
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
  const body = `<p class="gedachte">${TEL.boeken} paperbacks we publish ourselves. ${TEL.tot5} of them cost $5 or less, and every one ships from Amazon.</p>`
    + `<a class="btn" href="${L('white-elephant-gifts-under-10')}">See the white elephant picks</a>`
    + blok('For a white elephant swap', 'Funny, flat to wrap and under $10.', WE10, 'white-elephant-gifts-under-10', '', `All ${WE10.length} white elephant books under $10`, 3)
    + blok('For her stocking', 'Sudoku for a quiet morning and logbooks that say it out loud.', vrouwen, 'stocking-stuffers', '#for-her', `All ${vrouwen.length} books for her`)
    + blok('For his stocking', 'Dad jokes, rare facts and a place to rate every beer.', mannen, 'stocking-stuffers', '#for-him', `All ${mannen.length} books for him`)
    + blok('For kids and teens', 'Coloring, word search and 408 facts for the back seat.', jong, 'stocking-stuffers', '#for-kids-and-teens', `All ${jong.length} books for kids and teens`)
    + `<section class="tool"><h2>Free to print</h2><p>Three Christmas word search puzzles in large print. Print them at home, no sign-up.</p><a class="btn" href="${L('free-printable-christmas-word-search')}">Open the free puzzles</a></section>`
    + `<section class="tool"><h2>Playing white elephant?</h2><p>The rules in 8 steps, a card to print and a free number picker for the playing order.</p><a class="link" href="${L('white-elephant-rules')}">Read the white elephant rules</a></section>`
    + `<section class="held"><div class="stack"><h2>Did nothing this year?</h2><p>The Lasting Change Workbook is 30 days, one habit and a daily check-in, for the year you stop starting over.</p><p><a href="${L('lasting-change')}">I am not doing that again</a></p></div><a href="${L('lasting-change')}"><img src="${omslag(LC.i)}" alt="Lasting Change Workbook, book cover" width="333" height="500" loading="lazy" decoding="async"></a></section>`;
  return pagina(c, { slug: '', title, desc, h1: 'Small gift books that fit in a stocking', body, ld: [lijstLd('White elephant books under $10', WE10.slice(0, 6))] });
}

function regels(c) {
  const L = c.L;
  const vragen = [
    ['How many times can a gift be stolen in white elephant?', 'Most groups allow three steals per gift. After the third steal the gift is frozen and stays with that player. Your group can pick another number, as long as everyone hears it before the first gift is opened.'],
    ['Is there a white elephant number generator?', 'Yes. The free number picker on this page draws a random playing order for 2 to 80 players. Add names for a list to read out, or leave the names empty and hand out the numbers.'],
    ['What is a good white elephant gift under $10?', `Something small that gets a laugh when it is opened. We publish ${WE10.length} funny paperbacks under $10 for this, from dad jokes to bathroom word search, starting at $4.99.`],
    ['What is the difference between white elephant and Secret Santa?', 'In white elephant nobody knows who gets which gift: gifts are opened in turn and can be stolen. In Secret Santa each person is given one name and buys a gift for that person.'],
  ];
  const body = `<p class="gedachte">Everyone brings one wrapped gift and draws a number. On your turn you open a new gift or steal one that is already open. Most groups freeze a gift after its third steal, and when the last gift is open, player 1 may swap once.</p>`
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
  const body = `<p class="gedachte">A funny paperback is the easy pick for a $5 or $10 limit: it wraps flat and nobody can guess it from the shape. We publish all ${n} books below, and ${TEL.weTot5} of them cost $5 or less.</p>`
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
  const body = `<p class="gedachte">${TEL.boeken} small paperbacks that slide into a stocking: puzzles for a quiet Christmas morning, jokes and facts to read out loud and logbooks for the year ahead. ${TEL.tot5} cost $5 or less.</p>`
    + `<p class="sprong">${delen.map(([id, kop, l]) => `<a href="#${id}">${kop} (${l.length})</a>`).join('')}</p>`
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
  const body = `<p class="gedachte">Three Christmas word search puzzles in large print, free to print at home. No sign-up. Every puzzle has 12 words that run across, down or diagonally down.</p>`
    + `<p class="sprong np">${PUZZELS.map(p => `<a href="#${p.id}">${esc(p.naam)}</a>`).join('')}</p>`
    + PUZZELS.map(puzzelHtml).join('')
    + `<section class="stack np"><h2>Want a whole book of them?</h2><p>${ws.length} Christmas word search books, each ${usd(Math.min(...ws.map(b => b.p)))} on Amazon.</p>${plank(ws)}<p><a href="${L('stocking-stuffers')}">All ${TEL.boeken} stocking stuffer books</a></p></section>`
    + faq(vragen);
  return pagina(c, { slug: 'free-printable-christmas-word-search', title: 'Free Printable Christmas Word Search: 3 Large Print Puzzles', desc: 'Three free printable Christmas word search puzzles in large print, with an answer key. Print them at home for the family, a class or a party. No sign-up.', h1: 'Free printable Christmas word search', body, beeld: ws[0].i, ld: [faqLd(vragen)] });
}

function lastingChange(c) {
  const vragen = [
    ['Is it too late to change if I wasted this year?', 'No. The workbook starts with one small habit and a Day 0, so the only thing you need is today.'],
    ['What if I miss a day?', 'There is a bad-day card in the back of the workbook for exactly that day. Then you do the next check-in.'],
    ['Is this a book to read or a book to do?', `A book to do. Each day is a spread with one exercise and a check-in, in a 6 x 9 inch paperback of ${LC.n} pages.`],
    ['Who publishes the Lasting Change Workbook?', `We do. The author on the cover is ${LC.auteur}. The link goes straight to Amazon, without an affiliate tag.`],
  ];
  const krijg = ['A 30-day card, so I always see where I am.', 'One habit to pick, a Day 0 to set it up and a contract with myself.', 'Four weeks: Start tiny, Make it easy on hard days, Make it stick, Make it me.', 'Every day one exercise, a short Why it works with a real source and the same daily check-in.', 'Weekly reviews on days 7, 14, 21 and 28, and a certificate on day 30.', 'Then days 31 to 66, one page a day, and a tracker up to day 120.', 'A bad-day card for the day I want to quit.', 'A QR code to message the author with my question.'];
  const knop = `<a class="btn" href="${amz(LC.a)}" data-bs="${LC.a}" rel="noopener">I choose this year</a>`;
  const body = `<section class="held"><div class="stack"><p class="gedachte">Another year went by, and my plan from last January is still a plan.</p><p>I am not lazy and I am not broken. I never had a way to keep going after day three. Motivation showed up, and then it left.</p><p>So this time I am not waiting to feel ready. I pick one habit. I start so small it is almost silly. I check in every day for 30 days.</p>${knop}<p>Lasting Change Workbook, paperback, ${LC.n} pages, ${usd(LC.p)} on Amazon.</p></div><a href="${amz(LC.a)}" data-bs="${LC.a}" rel="noopener"><img src="${omslag(LC.i)}" alt="Lasting Change Workbook, book cover" width="333" height="500" loading="eager" decoding="async"></a></section>`
    + `<section class="stack"><h2>What I get in the workbook</h2><ul class="k">${krijg.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>`
    + `<section class="stack"><h2>Why it runs to day 66</h2><p>In a 2010 study by Phillippa Lally and colleagues, a new habit took a median of 66 days to feel automatic. That is why the workbook does not stop at day 30.</p></section>`
    + `<section class="tool"><h2>If I start on January 1</h2><p>Day 30 is January 30. Day 66 is March 7. And I do not have to wait for January: Day 0 can be today.</p>${knop}<p>Also in hardcover for ${usd(LC.hc.p)}.</p></section>`
    + faq(vragen);
  return pagina(c, { slug: 'lasting-change', title: 'Did Nothing This Year? Lasting Change Workbook for 2027', desc: 'Another year gone and the plan is still a plan. The Lasting Change Workbook is 30 days, one habit and a daily check-in, so next year is not a repeat.', h1: 'I did nothing this year. I am not doing that again.', kruimel: 'Lasting Change Workbook', body, beeld: LC.i, ld: [{ '@context': 'https://schema.org', '@type': 'Book', name: LC.t, author: { '@type': 'Person', name: LC.auteur }, image: omslag(LC.i), url: amz(LC.a), numberOfPages: LC.n, bookFormat: 'https://schema.org/Paperback', offers: { '@type': 'Offer', price: Number(LC.p).toFixed(2), priceCurrency: 'USD', url: amz(LC.a) } }, faqLd(vragen)] });
}

function over(c) {
  const L = c.L;
  const body = `<p class="gedachte">Bookstuffers is the shelf for our own small gift books. We make and publish them, and Amazon prints and ships each copy.</p>`
    + `<section class="stack"><h2>What we show</h2><p>The title, the price and the page count of each book, as they were on Amazon.com on ${dag(PRIJS_DATUM)}. Prices can change, so the price on Amazon is the one that counts.</p></section>`
    + `<section class="stack"><h2>How we earn</h2><p>We get the publisher royalty when you buy one of our books. Links go straight to Amazon. There are no affiliate tags and no paid placements.</p></section>`
    + `<section class="stack"><h2>What is free</h2><p>The <a href="${L('white-elephant-rules')}">white elephant rules</a> with the number picker and the <a href="${L('free-printable-christmas-word-search')}">printable Christmas word search puzzles</a> are free, without sign-up.</p></section>`
    + `<section class="stack"><h2>Who we are</h2><p>${esc(BEDRIJF)}</p></section>`;
  return pagina(c, { slug: 'about', title: 'About Bookstuffers: Who Makes These Small Gift Books', desc: 'Bookstuffers is the shelf for our own small gift books. We publish them, Amazon prints and ships them, and links carry no affiliate tags.', h1: 'About Bookstuffers', body });
}

const PAGINA = { '': home, 'white-elephant-rules': regels, 'white-elephant-gifts-under-10': onderTien, 'stocking-stuffers': sokken, 'free-printable-christmas-word-search': printbaar, 'lasting-change': lastingChange, about: over };
// c = { L: slug -> href, echt: draait op bookstuffers.com }. Geeft null bij een onbekende pagina.
export function render(slug, c) { const f = PAGINA[slug]; return f ? f(c) : null; }

// Dezelfde controles als test/bookstuffers.test.mjs, op de echte uitvoer.
export function keur(html, slug) {
  const f = [];
  const h1 = (html.match(/<h1[\s>]/g) || []).length; if (h1 !== 1) f.push(`${slug}: ${h1} keer h1`);
  const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || ''; if (t.length < 25 || t.length > 70) f.push(`${slug}: titel ${t.length} tekens`);
  const d = (html.match(/name="description" content="([^"]*)"/) || [])[1] || ''; if (d.length < 70 || d.length > 165) f.push(`${slug}: omschrijving ${d.length} tekens`);
  if (/[—–]/.test(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ''))) f.push(`${slug}: gedachtestreepje`);
  if (/[?&]tag=/.test(html)) f.push(`${slug}: Amazon-tag in een link`);
  if (/\b(0 books|0 cost|nog geen|undefined|NaN|null)\b/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) f.push(`${slug}: nul of lege waarde in de tekst`);
  for (const m of html.matchAll(/<a class="boek"[\s\S]*?<\/a>/g)) if (!/<img src="https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+"/.test(m[0]) || !/href="https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}"/.test(m[0])) f.push(`${slug}: boekkaart zonder omslag of Amazon-link`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { f.push(`${slug}: JSON-LD ongeldig`); } }
  for (const m of html.matchAll(/(\d+) (?:funny )?(?:small )?(?:paperbacks|books)\b/g)) { const n = +m[1]; if (n > 400) f.push(`${slug}: vreemd aantal ${n}`); }
  return f;
}

export const ROBOTS = `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`;
export const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SLUGS.map(s => `<url><loc>${BASE}/${s}</loc><lastmod>${BIJGEWERKT}</lastmod></url>`).join('\n')}\n</urlset>\n`;
export const llms = () => `# Bookstuffers\n\n> Bookstuffers (bookstuffers.com) is the shelf of a small publisher: ${TEL.boeken} small gift paperbacks for Christmas stockings and white elephant gift exchanges. ${TEL.tot5} cost $5 or less on Amazon.com (checked ${PRIJS_DATUM}). We publish every book listed. Links go to Amazon without affiliate tags.\n\n## Pages\n- [White elephant rules](${BASE}/white-elephant-rules): the game in 8 steps, a printable rules card and a free number picker for the playing order.\n- [White elephant gifts under $10](${BASE}/white-elephant-gifts-under-10): ${TEL.we10} funny paperbacks under $10 with price and page count (dad jokes, fact books, bathroom word search, password logbooks).\n- [Stocking stuffer books](${BASE}/stocking-stuffers): all ${TEL.boeken} books sorted for her, for him, for anyone and for kids and teens.\n- [Free printable Christmas word search](${BASE}/free-printable-christmas-word-search): 3 large print puzzles with answer key, free, no sign-up.\n- [Lasting Change Workbook](${BASE}/lasting-change): a 30-day habit workbook (${LC.n} pages, ${usd(LC.p)}) for people who did nothing this year and want next year to be different.\n- [About](${BASE}/about): who publishes the books and how the site earns.\n`;
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
