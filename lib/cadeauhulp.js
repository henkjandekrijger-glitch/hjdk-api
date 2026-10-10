// Cadeau-keuzehulpen op keuzehulp.best/cadeau/<gids>, in de stijl van outname.now.
// Drie vragen, daarna de best passende producten uit de Yoors Shop. Elk antwoord wordt geteld (vraagsignaal),
// elke klik naar een product gaat via /api/shop/uit (telt de doorklik en meldt de conversie aan het advertentienetwerk).
// De pagina staat ook open voor Google en AI-assistenten (zonder advertentieparameters), met uitleg en vragen en antwoorden.

const BOL_SITE = '1547300';
const bolZoek = (q, sub) => 'https://partner.bol.com/click/click?p=1&t=url&s=' + BOL_SITE + '&f=TXL&url=' + encodeURIComponent('https://www.bol.com/nl/nl/s/?searchtext=' + q) + '&subid=' + encodeURIComponent(sub);

const tekst = it => (it.t + ' ' + it.c + ' ' + it.s + ' ' + it.b).toLowerCase();
const heeft = (it, re) => re.test(tekst(it));

// Labels per product: waar past het bij. Werkt op categorie van de shop en woorden in de titel.
function labels(it) {
  const l = new Set();
  const c = String(it.c || '').toLowerCase(), s = String(it.s || '').toLowerCase();
  if (c === 'wonen' || heeft(it, /kaars|plaid|deken|lantaarn|windlicht|mand|spiegel|kussen|vaas|tegel|poster|decor|klok|geur/)) l.add('thuis');
  if (c === 'hobby' || s === 'diy' || heeft(it, /book ?nook|boek ?nook|bouwpakket|diy|3d|puzzel|knutsel|haak|brei|teken|schilder/)) l.add('creatief');
  if (c === 'beauty' || heeft(it, /zeep|cr[eè]me|verzorg|parfum|lotion|haar|bad|scrub|lippen/)) l.add('verzorging');
  if (c === 'planten' || s === 'planten' || heeft(it, /plant|orchidee|bloempot|pot |cactus|succulent|tuin|windspinner|regenketting/)) l.add('groen');
  if (c === 'mode' || heeft(it, /tas|sokken|sieraad|ketting|armband|oorbel|sjaal|portemonnee/)) l.add('mode');
  if (c === 'tech' || heeft(it, /sleutelhanger|gadget|kabel|oplader|lamp|grappig|spel|mok/)) l.add('grappig');
  if (c === 'kinderen' || heeft(it, /kind|baby|kinderkamer|muursticker|speelgoed|mobiel/)) l.add('kind');
  if (heeft(it, /heren|man |mannen|whisky|bier|sleutelhanger|gereedschap|scheer|baard|gentleman/)) l.add('man');
  if (heeft(it, /alice|wonderland|magisch|harry|hogwarts|fantasy|bibliotheek|tover|betover|draak|sprookje|dorothy|roos|sneeuw|kerst/)) l.add('magisch');
  if (heeft(it, /straat|caf[eé]|winkel|stad|bakkerij|boekwinkel|tokyo|parijs|trein|reis|kimono|sakura|morita/)) l.add('stad');
  if (heeft(it, /tuin|bos|kas|natuur|bloem|bloesem|zon|zee|sweet dream/)) l.add('natuur');
  return [...l];
}

export const GIDSEN = {
  'kleine-sinterklaascadeaus': {
    titel: 'Kleine sinterklaascadeaus tot €15', kicker: 'Keuzehulp · Sinterklaas 2026',
    h1: 'Kleine sinterklaascadeaus tot €15 die echt leuk zijn',
    lead: 'Drie vragen, en je ziet welke kleine cadeaus passen. Voor de schoen, het dobbelspel of als surprise.',
    beschrijving: 'Kies een klein sinterklaascadeau tot €10 of €15 in drie vragen: budget, voor wie en waar hij of zij blij van wordt. Met de verzendkosten erbij.',
    zoek: 'sinterklaas cadeau 10 euro',
    filter: it => it.p <= 15 && !heeft(it, /kerst|elektrolyt|poeder|supplement|vitamine|halloween|skull/),
    vragen: [
      { k: 'budget', q: 'Wat is je budget per cadeau?', o: [['10', 'Tot €10'], ['15', 'Tot €15']] },
      { k: 'wie', q: 'Voor wie is het?', o: [['vrouw', 'Een vrouw'], ['man', 'Een man'], ['kind', 'Een kind'], ['iedereen', 'Iedereen (dobbelspel)']] },
      { k: 'smaak', q: 'Waar wordt hij of zij blij van?', o: [['thuis', 'Gezellig thuis'], ['creatief', 'Zelf iets maken'], ['verzorging', 'Verwennen'], ['groen', 'Planten'], ['grappig', 'Iets handigs of grappigs']] }
    ],
    tips: [
      ['Voor het dobbelspel', 'Kies cadeaus die iedereen wil hebben: iets voor op tafel, een kaars of iets kleins voor thuis. Niets wat maar bij één persoon past.'],
      ['Voor de schoen', 'Klein en verrassend. Een tegeltje met tekst of een plantenpotje doet het beter dan een kleinigheid die je nergens kwijt kunt.'],
      ['Let op de verzendkosten', 'Bij een cadeau van €10 tellen verzendkosten hard mee. Bestel liever een paar cadeaus tegelijk; met meer producten krijg je bovendien korting.'],
      ['Bestel op tijd', 'Pakjesavond is zaterdag 5 december 2026. Bestel uiterlijk eind november, dan heb je speling als iets later komt.']
    ],
    faq: [
      ['Wat is een goed sinterklaascadeau tot €10 of €15?', 'Iets kleins dat je zelf ook zou willen: een geurkaars, een tegeltje met een tekst, een plantenpot of een klein bouwpakket. Gebruik de vragen hierboven om te zien wat bij de ontvanger past.'],
      ['Wat koop je voor het sinterklaasdobbelspel?', 'Cadeaus van €3 tot €10 die bij iedereen passen. Kies bij de vraag "Voor wie" voor "Iedereen", dan zie je de cadeaus die het breedst vallen.'],
      ['Wanneer moet ik bestellen voor pakjesavond?', 'Pakjesavond is op 5 december. Reken op een paar werkdagen bezorging; bestel daarom het liefst voor eind november.']
    ]
  },
  'kerstcadeau-voor-haar': {
    titel: 'Kerstcadeau voor haar', kicker: 'Keuzehulp · Kerst 2026',
    h1: 'Een kerstcadeau voor haar, in drie vragen',
    lead: 'Voor je vriendin, moeder, zus of collega. Kies je budget en waar ze blij van wordt, dan zie je wat past.',
    beschrijving: 'Vind een kerstcadeau voor haar in drie vragen: budget, waar ze van houdt en voor wie. Met prijzen inclusief verzendkosten.',
    zoek: 'kerstcadeau vrouw',
    filter: it => it.p >= 10 && it.p <= 130 && !heeft(it, /heren|kinderkamer|baby|kinderen|halloween|skull|gothic|vleermuis|pompoen|spin |elektrolyt|poeder|supplement|vitamine|terminator|truck|tank|motor|chopper|trike|racer|vrachtwagen|belaz|cruiser|scheer|baard|gentleman|kat |kitten|leeuw|mammoth|ram |vos |schildpad|spaarpot/),
    vragen: [
      { k: 'budget', q: 'Wat wil je uitgeven?', o: [['25', 'Tot €25'], ['50', 'Tot €50'], ['130', 'Mag meer kosten']] },
      { k: 'smaak', q: 'Waar wordt ze blij van?', o: [['thuis', 'Sfeer in huis'], ['creatief', 'Zelf iets maken'], ['verzorging', 'Verwennen'], ['groen', 'Planten en tuin'], ['mode', 'Tassen en accessoires']] },
      { k: 'wie', q: 'Voor wie is het?', o: [['partner', 'Mijn vriendin of vrouw'], ['moeder', 'Mijn moeder'], ['vriendin', 'Een vriendin of zus'], ['collega', 'Een collega']] }
    ],
    tips: [
      ['Kies iets wat ze zelf niet koopt', 'De beste cadeaus zijn net iets mooier dan wat iemand voor zichzelf zou kiezen: een plaid van goede kwaliteit, een bijzondere lantaarn, een bouwpakket voor de lange avonden.'],
      ['Ervaring telt mee', 'Een bouwpakket of creatief project is ook een cadeau van tijd: iets om samen of rustig alleen te doen in de kerstvakantie.'],
      ['Voor een collega', 'Houd het algemeen en rond de €15 tot €25: iets voor op het bureau of voor thuis, geen verzorging of kleding.'],
      ['Bestel op tijd', 'Kerst valt op vrijdag 25 december 2026. Bestel voor 15 december, dan ligt het er zeker.']
    ],
    faq: [
      ['Wat is een goed kerstcadeau voor een vrouw?', 'Iets voor sfeer in huis, iets om zelf te maken of iets om zich te verwennen. Vraag je af waar ze in haar vrije tijd blij van wordt, en kies daarbinnen iets wat ze zelf niet snel koopt.'],
      ['Wat geef je je moeder met kerst?', 'Moeders waarderen vaak iets voor in huis of de tuin: een lantaarn, een plaid of een mooie plant. Kies bij de laatste vraag "Mijn moeder" om dat zwaarder te laten wegen.'],
      ['Wat is een leuk kerstcadeau voor een collega?', 'Iets kleins en algemeens tussen €10 en €25, zoals een kaars, een plantenpot of een tegeltje.']
    ]
  },
  'book-nook-kiezen': {
    titel: 'Book nook kiezen', kicker: 'Keuzehulp · Bouwpakketten',
    h1: 'Welke book nook past bij jou?',
    lead: 'Een book nook is een klein bouwpakket dat je tussen je boeken zet: een straatje, bibliotheek of sprookje met licht. Drie vragen, dan zie je welke past.',
    beschrijving: 'Book nook kiezen in drie vragen: voor wie, ervaring en stijl. Zie welke book nook of 3D-bouwpakket bij je past, met prijs inclusief verzending.',
    zoek: 'book nook',
    filter: it => heeft(it, /book ?nook|boek ?nook|boeknook|boekensteun|boekenkast|miniatuurhuis|poppenhuis|diy huis|huis kit|3d diy huis|doe-het-zelf huis|houten huis|muziekdoos|hogwarts/) && String(it.c || '').toLowerCase() !== 'wonen',
    vragen: [
      { k: 'wie', q: 'Voor wie is hij?', o: [['zelf', 'Voor mezelf'], ['cadeau', 'Cadeau voor een volwassene'], ['tiener', 'Voor een tiener (12+)']] },
      { k: 'ervaring', q: 'Heb je al eens zoiets gebouwd?', o: [['eerste', 'Nee, dit is de eerste'], ['ervaren', 'Ja, ik wil een uitdaging']] },
      { k: 'stijl', q: 'Welke sfeer spreekt je aan?', o: [['magisch', 'Magisch en sprookjesachtig'], ['stad', 'Een straatje of winkeltje'], ['natuur', 'Natuur en rust'], ['alles', 'Maakt niet uit']] }
    ],
    tips: [
      ['Kijk naar de maat', 'Meet de ruimte tussen je boeken. De meeste book nooks zijn 8 tot 12 cm breed en ongeveer 20 tot 25 cm hoog.'],
      ['Reken op tijd', 'Een eerste book nook kost al snel 4 tot 8 uur bouwen, verspreid over een paar avonden. Grotere modellen meer.'],
      ['Licht maakt het verschil', 'De meeste hebben een lampje op batterijen of USB. Kijk of dat erbij zit, dan hoef je niets extra te kopen.'],
      ['Wat je nodig hebt', 'Vaak alleen een hobbymes, lijm en een pincet. Bij sommige pakketten zit alles erbij.']
    ],
    faq: [
      ['Wat is een book nook?', 'Een book nook is een miniatuurwereldje in de vorm van een boek, dat je tussen de boeken in je kast zet. Je bouwt het zelf uit een pakket van hout of karton, vaak met een lampje erin.'],
      ['Is een book nook moeilijk om te bouwen?', 'Voor een eerste keer is het goed te doen als je geduld hebt. Kies bij de vragen "Nee, dit is de eerste", dan zie je eerst de pakketten die eenvoudiger zijn.'],
      ['Is een book nook een goed cadeau?', 'Ja, vooral voor mensen die lezen of graag iets met hun handen doen. Het is een cadeau van een paar gezellige avonden, en daarna staat het mooi in de kast.']
    ]
  }
};

export const GIDS_IDS = Object.keys(GIDSEN);

// Producten voor een gids, met labels en een volgorde op populariteit.
export function productenVoor(slug, items) {
  const g = GIDSEN[slug]; if (!g) return [];
  return items.filter(it => it.img && it.vr !== false && it.p > 0 && g.filter(it))
    .map(it => ({ id: it.id, t: it.t, p: it.p, pf: !!it.pf, vk: it.vk, lt: it.lt, img: it.img, b: it.b, l: labels(it), pop: (it.v || 0) + 5 * (it.f || 0) + 3 * (it.sc || 0) }))
    .map(x => (slug === 'book-nook-kiezen' && /book ?nook|boek ?nook|boeknook/i.test(x.t)) ? Object.assign(x, { pop: x.pop + 1000 }) : x)
    .sort((a, b) => b.pop - a.pop).slice(0, 60);
}

const CSS = `:root{--bg:#FFFFFF;--panel:#FFFFFF;--ink:#111113;--body:#3A3F47;--muted:#6B7280;--line:#E5E7EB;--line-strong:#B9BFC7;--accent:#2B47C4;--accent-ink:#FFFFFF;--accent-soft:#EEF1FC;--ok:#1F7A4D;--ok-soft:#E8F4EE;--radius:14px;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#0F1116;--panel:#161922;--ink:#F2F3F5;--body:#C9CDD3;--muted:#8B929B;--line:#272C37;--line-strong:#4A5260;--accent:#93A6FF;--accent-ink:#0B1022;--accent-soft:#1B2246;--ok:#71CF9E;--ok-soft:#16301F;color-scheme:dark}}
*,*::before,*::after{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--body);font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--accent)}button{font:inherit;color:inherit;cursor:pointer}button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.top{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line)}.top-in{max-width:1080px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;gap:12px}
.brand{font-weight:700;letter-spacing:-.02em;font-size:20px;color:var(--ink);text-decoration:none}.brand span{color:var(--accent)}.top .pilot{margin-left:auto;font-size:13px;color:var(--accent);border:1.5px solid var(--accent);border-radius:999px;padding:3px 11px;white-space:nowrap}
main{max-width:800px;margin:0 auto;padding:24px 20px 48px}
.eyebrow{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}
h1{font-size:clamp(28px,5.4vw,42px);line-height:1.12;letter-spacing:-.03em;color:var(--ink);margin:6px 0 12px;text-wrap:balance;font-weight:700}
h2{font-size:23px;font-weight:700;color:var(--ink);margin:38px 0 10px;letter-spacing:-.02em}h3{font-size:17px;color:var(--ink);margin:0 0 4px;font-weight:600}p{margin:0 0 14px}
.lead{font-size:19px;max-width:62ch}
.strip{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 16px}.strip img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;background:#F3F4F6;display:block}
.quiz{background:var(--accent-soft);border-radius:var(--radius);padding:18px 20px;margin:18px 0 8px}
.qn{font-size:13px;font-weight:600;color:var(--accent);letter-spacing:.04em;text-transform:uppercase;margin:0 0 4px}.qq{font-size:20px;font-weight:700;color:var(--ink);margin:0 0 12px;letter-spacing:-.01em}
.opts{display:flex;flex-wrap:wrap;gap:10px}.opt{border:0;background:var(--panel);color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--line-strong);border-radius:999px;padding:12px 18px;font-weight:600;font-size:16px;min-height:48px}
.opt:hover,.opt[aria-pressed=true]{box-shadow:inset 0 0 0 2px var(--accent);color:var(--accent)}
.done{display:none}.quiz.klaar .stap{display:none}.quiz.klaar .done{display:block}.done p{margin:0;color:var(--ink)}.again{background:none;border:0;padding:0;color:var(--accent);font-weight:600;text-decoration:underline;margin-top:6px}
.dots{display:flex;gap:6px;margin:14px 0 0}.dots i{width:28px;height:4px;border-radius:2px;background:var(--line-strong)}.dots i.on{background:var(--accent)}
.grid,.res-h{scroll-margin-top:72px}.res-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:30px 0 12px}.res-h h2{margin:0}.res-h span{font-size:14px;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}@media (min-width:640px){.grid{grid-template-columns:repeat(3,1fr)}}
.pc{display:flex;flex-direction:column;text-decoration:none;color:var(--ink);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:var(--panel)}
.pc img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;background:#F3F4F6}.pc .in{padding:10px 12px 12px;display:flex;flex-direction:column;gap:4px;flex:1}
.pc .t{font-size:15px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pc .p{font-size:18px;font-weight:700;letter-spacing:-.01em}.pc .v{font-size:13px;color:var(--muted)}.pc .w{font-size:13px;color:var(--ok);font-weight:600}
.pc .b{margin-top:auto;text-align:center;background:var(--accent);color:var(--accent-ink);border-radius:999px;padding:9px 12px;font-weight:600;font-size:15px}
.cta{display:inline-block;border:0;background:var(--accent);color:var(--accent-ink);border-radius:999px;padding:13px 24px;font-weight:600;font-size:17px;text-decoration:none}.cta.ghost{background:transparent;color:var(--accent);box-shadow:inset 0 0 0 1.5px var(--accent)}
.more{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 0}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:12px 0}.tile{border:1px solid var(--line);border-radius:12px;padding:14px 16px}.tile p{margin:0;font-size:15px}
.fine{font-size:14px;color:var(--muted);line-height:1.5}
details{border-top:1px solid var(--line);padding:12px 0}details:last-of-type{border-bottom:1px solid var(--line)}summary{cursor:pointer;color:var(--ink);font-weight:600}details p{margin:8px 0 0}
footer{border-top:1px solid var(--line);margin-top:24px}footer .in{max-width:800px;margin:0 auto;padding:22px 20px 40px;font-size:14px;color:var(--muted)}footer a{color:var(--muted)}footer nav{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px}`;

const eur = v => '€' + (Number.isInteger(Number(v)) ? String(Number(v)) : Number(v).toFixed(2).replace('.', ','));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// o: { slug, producten, code, land (basis-URL), andere: [[slug, titel]] }
export function hulpPagina(o) {
  const g = GIDSEN[o.slug]; const P = o.producten; const code = o.code || '';
  const url = o.land + '/cadeau/' + o.slug;
  const uit = (id, pos) => '/api/shop/uit?p=' + encodeURIComponent(id) + (code ? '&c=' + code : '') + '&pos=' + pos + '&g=' + o.slug;
  const kaart = (it, i) => `<a class="pc" data-i="${i}" href="${esc(uit(it.id, 'k' + (i + 1)))}"><img src="${esc(it.img)}" alt="${esc(it.t)}" loading="${i < 3 ? 'eager' : 'lazy'}" width="400" height="400"><span class="in"><span class="t">${esc(it.t)}</span><span class="p">${it.pf ? 'vanaf ' : ''}${esc(eur(it.p))}</span><span class="v">${it.vk === 0 ? 'Gratis verzending' : it.vk ? '+ ' + esc(eur(it.vk)) + ' verzending' : 'Verzending bij afrekenen'}</span><span class="w"></span><span class="b">Bekijk</span></span></a>`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'ItemList', name: g.titel, itemListElement: P.slice(0, 10).map((it, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: it.t, image: it.img, url: 'https://yoo.rs/product/' + it.id, offers: { '@type': 'Offer', priceCurrency: 'EUR', price: it.p, availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'Yoors Shop' } } } })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: g.faq.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) }];
  const data = { g: o.slug, c: code, v: g.vragen.map(v => ({ k: v.k, q: v.q, o: v.o })), p: P.map(it => ({ p: it.p, l: it.l })) };
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(g.titel)}: keuzehulp in 3 vragen | keuzehulp.best</title><meta name="description" content="${esc(g.beschrijving)}"><link rel="canonical" href="${esc(url)}">
<meta property="og:title" content="${esc(g.h1)}"><meta property="og:description" content="${esc(g.beschrijving)}"><meta property="og:type" content="website"><meta property="og:url" content="${esc(url)}">${P[0] ? `<meta property="og:image" content="${esc(P[0].img)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="preconnect" href="https://cdn.orderchamp.com">
<style>${CSS}</style><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script></head><body>
<div class="top"><div class="top-in"><a class="brand" href="/keuzehulp">keuzehulp<span>.best</span></a><span class="pilot">${esc(g.kicker.split('·')[1] || 'Keuzehulp').trim()}</span></div></div>
<main>
<div class="eyebrow">${esc(g.kicker)}</div>
<h1>${esc(g.h1)}</h1>
<p class="lead">${esc(g.lead)}</p>
<div class="strip">${P.slice(0, 3).map(it => `<img src="${esc(it.img)}" alt="${esc(it.t)}" width="240" height="240">`).join('')}</div>
<section class="quiz" id="quiz" aria-label="Keuzehulp">
<div class="stap"><p class="qn" id="qn">Vraag 1 van ${g.vragen.length}</p><p class="qq" id="qq">${esc(g.vragen[0].q)}</p><div class="opts" id="opts">${g.vragen[0].o.map(x => `<button type="button" class="opt" data-v="${esc(x[0])}">${esc(x[1])}</button>`).join('')}</div><div class="dots">${g.vragen.map((_, i) => `<i${i === 0 ? ' class="on"' : ''}></i>`).join('')}</div></div>
<div class="done"><p><b id="samen">Dit past het best.</b></p><button type="button" class="again" id="again">Opnieuw kiezen</button></div>
</section>
<div class="res-h"><h2 id="resh">Populair in deze keuzehulp</h2><span id="resn">${Math.min(P.length, 9)} van ${P.length}</span></div>
<div class="grid" id="grid">${P.map(kaart).join('')}</div>
<div class="more"><a class="cta ghost" id="meer" href="#" hidden>Toon meer</a><a class="cta ghost" href="${esc(bolZoek(g.zoek, 'cadeau-' + o.slug))}" rel="sponsored noopener">Meer keus bij bol.com</a></div>
<h2>Waar let je op?</h2>
<div class="tiles">${g.tips.map(t => `<div class="tile"><h3>${esc(t[0])}</h3><p>${esc(t[1])}</p></div>`).join('')}</div>
<h2>Vragen</h2>
${g.faq.map(f => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('')}
${o.andere && o.andere.length ? `<h2>Andere keuzehulpen</h2><div class="more">${o.andere.map(a => `<a class="cta ghost" href="/cadeau/${esc(a[0])}">${esc(a[1])}</a>`).join('')}</div>` : ''}
<p class="fine" style="margin-top:28px">De producten in deze keuzehulp komen uit de Yoors Shop, onze eigen winkel: je bestelt en betaalt daar, met iDEAL, PayPal of kaart, en kunt 14 dagen gratis retourneren. Prijzen zijn inclusief btw; de verzendkosten staan bij elk product. Koop je via de knop naar bol.com, dan krijgen wij daar een kleine vergoeding voor. Prijzen gecontroleerd op ${new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' })}.</p>
</main>
<footer><div class="in">keuzehulp.best is een dienst van AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda · KvK 60126035<nav><a href="/keuzehulp">Alle keuzehulpen</a><a href="https://yoo.rs/shop/privacy">Privacy</a><a href="https://yoo.rs/shop/returns">Retourneren</a></nav></div></footer>
<script id="hd" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<script>(function(){var D=JSON.parse(document.getElementById('hd').textContent),C=D.c,G=D.g,t0=Date.now(),mens=false,eng=false,s=0,A={},stap=0,toon=9;
function b(u,o){try{navigator.sendBeacon(u,new Blob([JSON.stringify(o)],{type:'text/plain'}))}catch(x){}}
['scroll','touchstart','pointerdown','keydown'].forEach(function(ev){addEventListener(ev,function(){if(!mens){mens=true;b('/api/shop/b',{c:C,e:'mens'})}},{passive:true})});
var iv=setInterval(function(){if(document.visibilityState==='visible')s++;if(s>=15&&mens&&!eng){eng=true;clearInterval(iv);b('/api/shop/b',{c:C,e:'eng'})}},1000);
var grid=document.getElementById('grid'),cards=[].slice.call(grid.children),meer=document.getElementById('meer');
var W={thuis:'gezellig thuis',creatief:'zelf maken',verzorging:'verwennen',groen:'planten',mode:'mode',grappig:'handig en grappig',kind:'kinderen',man:'mannen',magisch:'magisch',stad:'straatje',natuur:'natuur'};
function score(i){var p=D.p[i],sc=0,w=[];var bud=+(A.budget||1e9);if(p.p>bud)return -1;
 if(A.smaak&&p.l.indexOf(A.smaak)>=0){sc+=3;w.push(W[A.smaak])}
 if(A.stijl&&A.stijl!=='alles'&&p.l.indexOf(A.stijl)>=0){sc+=3;w.push(W[A.stijl])}
 if(A.wie==='kind'){if(p.l.indexOf('kind')>=0){sc+=3;w.push('kinderen')}else sc-=1}
 else if(A.wie==='man'){if(p.l.indexOf('man')>=0||p.l.indexOf('grappig')>=0||p.l.indexOf('creatief')>=0)sc+=1.5;if(p.l.indexOf('verzorging')>=0)sc-=1}
 else if(A.wie==='vrouw'||A.wie==='partner'||A.wie==='vriendin'){if(p.l.indexOf('kind')>=0)sc-=2;if(p.l.indexOf('verzorging')>=0||p.l.indexOf('thuis')>=0)sc+=.5}
 else if(A.wie==='moeder'){if(p.l.indexOf('thuis')>=0||p.l.indexOf('groen')>=0)sc+=1.5}
 else if(A.wie==='collega'){if(p.p<=25)sc+=1;if(p.l.indexOf('verzorging')>=0||p.l.indexOf('mode')>=0)sc-=1}
 else if(A.wie==='iedereen'){if(p.l.indexOf('thuis')>=0||p.l.indexOf('grappig')>=0)sc+=1;if(p.l.indexOf('kind')>=0)sc-=1}
 if(A.ervaring==='eerste')sc+=(p.p<=35?1.5:0);if(A.ervaring==='ervaren')sc+=(p.p>=40?1.5:0);
 if(A.wie==='tiener')sc+=(p.p<=40?1:0);
 if(A.budget)sc+=.3*(p.p/bud);
 return {s:sc,w:w}}
function teken(){var lijst=cards.map(function(c,i){var r=Object.keys(A).length?score(i):{s:0,w:[]};return {c:c,i:i,r:r}}).filter(function(x){return x.r!==-1});
 if(Object.keys(A).length)lijst.sort(function(a,b){return b.r.s-a.r.s||a.i-b.i});
 cards.forEach(function(c){c.style.display='none'});lijst.forEach(function(x,n){grid.appendChild(x.c);x.c.style.display=n<toon?'':'none';var w=x.c.querySelector('.w');w.textContent=x.r.w&&x.r.w.length&&Object.keys(A).length?'Past bij: '+x.r.w.join(', '):''});
 document.getElementById('resn').textContent=Math.min(lijst.length,toon)+' van '+lijst.length;meer.hidden=lijst.length<=toon}
meer.addEventListener('click',function(e){e.preventDefault();toon+=9;teken()});
var opts=document.getElementById('opts'),qq=document.getElementById('qq'),qn=document.getElementById('qn'),dots=[].slice.call(document.querySelectorAll('.dots i'));
function vraag(){var v=D.v[stap];qn.textContent='Vraag '+(stap+1)+' van '+D.v.length;qq.textContent=v.q;opts.innerHTML='';v.o.forEach(function(x){var e=document.createElement('button');e.type='button';e.className='opt';e.dataset.v=x[0];e.textContent=x[1];opts.appendChild(e)});dots.forEach(function(d,i){d.className=i<=stap?'on':''})}
opts.addEventListener('click',function(e){var t=e.target.closest('.opt');if(!t)return;var v=D.v[stap];A[v.k]=t.dataset.v;b('/api/shop/hb',{c:C,g:G,k:v.k,v:t.dataset.v,n:stap});if(!mens){mens=true;b('/api/shop/b',{c:C,e:'mens'})}
 stap++;teken();if(stap<D.v.length){vraag()}else{document.getElementById('quiz').className='quiz klaar';document.getElementById('resh').textContent='Dit past het best';b('/api/shop/hb',{c:C,g:G,k:'klaar',v:'1'});document.querySelector('.res-h').scrollIntoView({behavior:'smooth',block:'start'})}});
document.getElementById('again').addEventListener('click',function(){A={};stap=0;document.getElementById('quiz').className='quiz';document.getElementById('resh').textContent='Populair in deze keuzehulp';vraag();teken()});
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="/api/shop/uit"]');if(!a||a.dataset.k)return;a.dataset.k=1;a.href=a.getAttribute('href')+'&h='+(mens?1:0)+'&ms='+(Date.now()-t0)+'&q='+Object.keys(A).length},true);
teken()})();</script>
</body></html>`;
}
