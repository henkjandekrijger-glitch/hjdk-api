// Rekenhulp tv-meubel breedte op gids.kadoly.com/tv-meubel-breedte-berekenen (24 nov 2026, Henkjan: "Maak die rekenhulp max geoptimaliseerd
// voor vindbaarheid" en "op onze gids appart page ?").
// Waarom: Demand Radar (vraagkansen, NL+BE per maand): tv-meubels 384.749, "tv-meubel" 67.042, "meubels voor tv" 49.500 vaste vraag zonder
// echte vergelijkpagina in de top 10 (nichescan 23 nov). Gatscan kadoly-wonen-kansen (Perplexity, 24 nov): "Welk tv-meubel past bij een tv van
// 65 inch?" haalt alleen Amerikaanse sites aan (312interiors.com, theurbaneditions.com) en geeft geen product of prijs. Geen Nederlandse rekenhulp
// die tv-maat omzet naar meubelbreedte, met de meubels erbij die het echt aankunnen.
// Rekenregels (de kern draait op de server en in de browser, test: scripts/test-tvrekenhulp.mjs):
// - Beeldbreedte en -hoogte bij 16:9: diagonaal x 2,54 x 16/sqrt(337) en x 9/sqrt(337). De echte tv is 1 tot 3 cm breder door de rand.
// - Meubel: "past net" = minstens de breedte van de tv; "mooi" = tv-breedte + 30 cm (15 cm aan elke kant); "ruim" = 1,5 x tv-breedte.
//   Dit zijn vuistregels van ons, geen norm; dat staat er ook bij.
// - Kijkafstand: SMPTE (minstens 30 graden kijkhoek) en THX (ongeveer 40 graden), bron Kaleidescape-gids en Wikipedia, gelezen 24 nov 2026.
//   Afstand = beeldbreedte / (2 x tan(hoek/2)).
// - Meubelhoogte: midden van het beeld op ooghoogte zittend (vuistregel 100 tot 110 cm, wij rekenen met 105), min de voet (ongeveer 8 cm).

export const TV_PAD = '/tv-meubel-breedte-berekenen';
export const TV_TITEL = 'Tv-meubel breedte berekenen: welk meubel past bij jouw tv?';
export const TV_MATEN = [32, 40, 43, 50, 55, 58, 65, 70, 75, 77, 83, 85, 98];
export const TV_VRAAG = 'Welk tv-meubel past bij een tv van 65 inch?';
export const TV_DAG = '2026-11-24';

// pure rekenkern, ook als tekst naar de browser (tvKern.toString())
export function tvKern(inch) {
  const d = Number(inch); if (!(d >= 10 && d <= 150)) return null;
  const w = d * 2.54 * 16 / Math.sqrt(337), h = d * 2.54 * 9 / Math.sqrt(337);
  const afst = hoek => w / (2 * Math.tan(hoek * Math.PI / 360));
  const r = x => Math.round(x);
  return { inch: d, breedte: r(w), hoogte: r(h), net: Math.ceil(w), mooi: r(w + 30), ruim: r(w * 1.5), kijkMin: Math.round(afst(40) / 10) / 10, kijkMax: Math.round(afst(30) / 10) / 10, meubelHoogte: Math.max(30, r(105 - h / 2 - 8)) };
}
// grootste tv die op een meubel van b cm past (net en mooi)
export function tvVoorMeubel(b) { const f = 2.54 * 16 / Math.sqrt(337); return { net: Math.floor(b / f), mooi: Math.floor((b - 30) / f) }; }

// de tv-meubels en dressoirs uit de gids dressoir (breedte en hoogte uit de makersgegevens daar)
export const TV_MEUBELS = [
  { pid: 'dp_1022', breedte: 198, hoogte: 66, soort: 'tv-meubel' },
  { pid: 'dp_1023', breedte: 198, hoogte: 66, soort: 'tv-meubel' },
  { pid: 'dp_1028', breedte: 124, hoogte: 66, soort: 'tv-meubel' },
  { pid: 'dp_1037', breedte: 163, hoogte: 79, soort: 'dressoir' },
  { pid: 'dp_1032', breedte: 168, hoogte: 81, soort: 'dressoir' },
];

const fmt = n => String(n).replace('.', ',');
export function tvFaq() {
  const k = m => tvKern(m);
  const f = [];
  const k65 = k(65);
  f.push({ v: TV_VRAAG, a: `Een meubel van minstens ${k65.net} cm breed, want zo breed is het beeld van een 65 inch tv. Mooi wordt het vanaf ${k65.mooi} cm, met 15 cm aan elke kant. De Tanner mediaconsole van 198 cm past daar ruim bij.` });
  for (const m of [55, 75, 85, 43]) { const x = k(m); f.push({ v: `Hoe breed moet een tv-meubel zijn voor een ${m} inch tv?`, a: `Minstens ${x.net} cm, mooi vanaf ${x.mooi} cm. Het beeld van een ${m} inch tv is ${x.breedte} cm breed en ${x.hoogte} cm hoog; de rand van de tv komt daar 1 tot 3 cm bij.` }); }
  f.push({ v: 'Hoe breed is een 65 inch tv?', a: `Het beeld is ${k65.breedte} cm breed en ${k65.hoogte} cm hoog. Met de rand erbij meestal 145 tot 147 cm; kijk voor de precieze maat in de handleiding van je tv.` });
  f.push({ v: 'Hoe ver moet je van een 65 inch tv zitten?', a: `Tussen ${fmt(k65.kijkMin)} en ${fmt(k65.kijkMax)} meter. Dichterbij is een kijkhoek van 40 graden (THX), verder weg 30 graden (SMPTE).` });
  f.push({ v: 'Mag een tv breder zijn dan het tv-meubel?', a: 'Liever niet. Steekt de tv uit, dan kan hij er bij een stoot of met kinderen in huis af. Staan de poten aan de buitenkant van de tv, dan moet het meubel minstens zo breed zijn als de afstand tussen de poten.' });
  f.push({ v: 'Hoe hoog moet een tv-meubel zijn?', a: `Zo dat het midden van het beeld ongeveer op ooghoogte zit als je zit, meestal 100 tot 110 cm. Bij een 65 inch tv komt dat neer op een meubel van ongeveer ${k65.meubelHoogte} cm hoog.` });
  return f;
}

export function tvLd(HOST, ORG) {
  const faq = tvFaq();
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', name: 'Tv-meubel breedte berekenen', url: HOST + TV_PAD, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Alle', inLanguage: 'nl-NL', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, description: 'Reken je tv-maat in inch om naar de breedte van het tv-meubel, de kijkafstand en de hoogte van het meubel.', publisher: ORG, dateModified: TV_DAG },
    { '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.v, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kadoly gids', item: HOST + '/' }, { '@type': 'ListItem', position: 2, name: 'Tv-meubel breedte berekenen', item: HOST + TV_PAD }] },
  ] }).replace(/</g, '\\u003c');
}

const CSS = `<style>
#reken{margin:6px 0 28px}
#reken h2{font-size:18px;font-weight:700;margin:0 0 10px}
.tv-pills{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}
#reken .tv-pills a.tv-p{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:76px;padding:0 14px;border:1.5px solid #111113;border-radius:999px;background:#fff!important;color:#111113!important;font-size:16px;font-weight:400;text-decoration:none!important;box-sizing:border-box}
#reken .tv-pills a.tv-p[aria-current]{background:#111113!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-weight:700}
.tv-ander{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 16px}
.tv-ander label{font-size:16px}
.tv-ander input{width:84px;height:44px;box-sizing:border-box;font:inherit;font-size:16px;padding:0 12px;border:1.5px solid #111113;border-radius:12px;color:#111113;background:#fff}
.tv-ander button{height:44px;padding:0 18px;border:0;border-radius:999px;background:#111113;color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer}
.tv-uit{border:2px solid #111113;border-radius:16px;padding:16px;margin:0 0 14px}
.tv-tegels{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tv-tegel{border-radius:12px;background:#111113;color:#fff;padding:12px 14px}
.tv-tegel.licht{background:#fff;color:#111113;border:1.5px solid #111113}
.tv-tegel span{display:block;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.tv-tegel b{display:block;font-size:24px;font-weight:700;line-height:1.2;margin-top:2px}
.tv-feit{display:flex;flex-wrap:wrap;gap:6px 18px;margin:12px 0 0;padding:0;list-style:none;font-size:16px}
.tv-feit li{margin:0}
.tv-feit b{font-weight:700}
.tv-m{display:grid;grid-template-columns:72px 1fr;gap:12px;align-items:start;padding:12px 0;border-top:1.5px solid #e7e5e4}
.tv-m img{width:72px;height:72px;object-fit:cover;border-radius:10px}
.tv-m h3{font-size:16px;font-weight:700;margin:4px 0 2px;line-height:1.35}
#reken .tv-m h3 a{color:#111113!important}
.tv-m p{margin:0;font-size:16px}
.tv-past{display:inline-block;font-size:13px;font-weight:700;border-radius:999px;padding:2px 10px;border:1.5px solid #111113}
.tv-past.ja{background:#111113;color:#fff}
.tv-past.nee{text-decoration:line-through}
.tv-tab{width:100%;border-collapse:collapse;font-size:16px}.tv-tab th,.tv-tab td{text-align:left;padding:8px 6px;border-bottom:1px solid #d6d3d1}.tv-tab th{font-weight:700}
@media(max-width:420px){#reken .tv-pills a.tv-p{min-width:0;flex:1 0 28%}.tv-tegel b{font-size:24px}}
</style>`;

const passTekst = (b, k) => b >= k.mooi ? ['ja', 'Past mooi'] : b >= k.net ? ['', 'Past net'] : ['nee', 'Te smal'];

// h = { esc, euro, cat, thuis, leverTekst } ; inch = gekozen maat (server), standaard 65
export function tvPagina(h, inch = 65) {
  const { esc } = h; const x = tvKern(inch) || tvKern(65);
  const uitHtml = k => `<div class="tv-tegels"><div class="tv-tegel"><span>Minstens</span><b>${k.net} cm</b></div><div class="tv-tegel licht"><span>Mooi vanaf</span><b>${k.mooi} cm</b></div></div><ul class="tv-feit"><li>Beeld <b>${k.breedte} x ${k.hoogte} cm</b></li><li>Kijkafstand <b>${fmt(k.kijkMin)} tot ${fmt(k.kijkMax)} m</b></li><li>Meubel ongeveer <b>${k.meubelHoogte} cm</b> hoog</li></ul>`;
  const meubels = TV_MEUBELS.map(m => ({ m, i: h.cat[m.pid] })).filter(y => y.i && y.i.vr !== false);
  const meubelHtml = k => meubels.length ? meubels.map(({ m, i }) => { const [kl, past] = passTekst(m.breedte, k); const v = tvVoorMeubel(m.breedte);
    return `<div class="tv-m" data-b="${m.breedte}">${i.img ? `<img src="${esc(i.img)}" alt="${esc(i.t)}" width="72" height="72" loading="lazy">` : '<span></span>'}<div><span class="tv-past ${kl}" data-past>${past} bij ${k.inch} inch</span><h3><a href="/naar/${encodeURIComponent(m.pid)}?g=tv-rekenhulp&amp;b=reken" rel="nofollow">${esc(i.t)}</a></h3><p>${m.breedte} cm breed, ${m.hoogte} cm hoog${m.soort === 'dressoir' ? ', een dressoir (hoger dan een tv-meubel)' : ''}. Mooi tot ${v.mooi} inch, net tot ${v.net} inch.</p><p><b>${esc(h.euro(h.thuis(i)))}</b> inclusief btw en verzending, ${esc(h.leverTekst(i))}.</p></div></div>`; }).join('') : '<p>Op dit moment hebben we geen tv-meubel op voorraad. De maten hierboven gelden voor elk meubel.</p>';
  const rijen = TV_MATEN.map(m => { const k = tvKern(m); return `<tr><td>${m} inch</td><td>${k.breedte} x ${k.hoogte} cm</td><td>${k.net} cm</td><td>${k.mooi} cm</td><td>${fmt(k.kijkMin)} tot ${fmt(k.kijkMax)} m</td></tr>`; }).join('');
  const faq = tvFaq();
  const kern = `${tvKern.toString()}`;
  return CSS + `<article><nav class="crumbs" aria-label="Kruimelpad"><a href="/">Kadoly gids</a> › Tv-meubel breedte berekenen</nav><p class="kicker"><span class="live-dot"></span>Rekenhulp · tv-meubel</p><h1>${esc(TV_TITEL)}</h1>
<p class="meta kz-meta">Door de redactie van Kadoly · bijgewerkt <time datetime="${TV_DAG}">24 november 2026</time></p>
<section id="reken" aria-labelledby="reken-kop"><h2 id="reken-kop">Hoe groot is je tv?</h2><div class="tv-pills" role="group" aria-label="Tv-maat in inch">${[43, 50, 55, 65, 75, 85].map(m => `<a class="tv-p" href="?inch=${m}#reken" data-inch="${m}"${m === x.inch ? ' aria-current="true"' : ''}>${m} inch</a>`).join('')}</div>
<form class="tv-ander" action="${TV_PAD}#reken" method="get"><label for="tvi">Andere maat</label><input id="tvi" name="inch" type="number" inputmode="numeric" min="10" max="150" value="${x.inch}"><button type="submit">Bereken</button></form>
<div class="tv-uit" id="tv-uit" aria-live="polite">${uitHtml(x)}</div>
<div id="tv-meubels">${meubelHtml(x)}</div></section>
<div class="answer lead"><p><b>Kort antwoord:</b> een tv-meubel moet minstens zo breed zijn als het beeld van je tv, en oogt mooi met 15 cm extra aan elke kant. Voor 65 inch is dat minstens ${tvKern(65).net} cm en mooi vanaf ${tvKern(65).mooi} cm; voor 55 inch minstens ${tvKern(55).net} en mooi vanaf ${tvKern(55).mooi} cm.</p></div>
<h2 id="tabel">Tv-maat en meubelbreedte in één tabel</h2><p>Beeldmaten bij 16:9, zonder de rand van de tv. Kijkafstand van 40 graden (THX) tot 30 graden (SMPTE).</p><div style="overflow-x:auto"><table class="tv-tab"><thead><tr><th>Tv</th><th>Beeld</th><th>Meubel minstens</th><th>Meubel mooi</th><th>Kijkafstand</th></tr></thead><tbody>${rijen}</tbody></table></div>
<h2 id="uitleg">Zo rekenen we</h2>
<p>Een tv-maat in inch is de diagonaal van het beeld. Eén inch is 2,54 cm. Bij een gewone tv (16:9) is het beeld 0,87 keer zo breed als de diagonaal: een 65 inch tv heeft een beeld van ${tvKern(65).breedte} cm breed. De rand van de tv maakt hem 1 tot 3 cm breder.</p>
<p>Voor het meubel gebruiken we drie stappen. Minstens zo breed als de tv, zodat niets uitsteekt. Mooi met 15 cm extra aan elke kant: dat oogt rustig en er is plek voor een lamp of plant. Ruim met anderhalf keer de breedte van de tv. Dit zijn onze vuistregels, geen officiële norm.</p>
<h2>Let op de poten van je tv</h2><p>Veel tv's staan op twee poten aan de buitenkant. Dan moet het meubel minstens zo breed zijn als de afstand tussen de poten, en ook diep genoeg. Meet de poten of kijk in de handleiding. Heeft je tv één voet in het midden, dan telt alleen de breedte van het beeld.</p>
<h2>Kijkafstand</h2><p>De SMPTE (de vereniging van film- en tv-ingenieurs) raadt een kijkhoek van minstens 30 graden aan, THX ongeveer 40 graden voor een bioscoopgevoel. Voor een 65 inch tv is dat ${fmt(tvKern(65).kijkMin)} tot ${fmt(tvKern(65).kijkMax)} meter van de bank. Bron: <a href="https://www.kaleidescape.com/home-theater-guide/screen-size/" rel="noopener">Kaleidescape over schermgrootte en kijkafstand</a> en <a href="https://en.wikipedia.org/wiki/Optimum_HDTV_viewing_distance" rel="noopener">Wikipedia</a>, gelezen 24 november 2026.</p>
<h2>Hoogte en gewicht</h2><p>Het midden van het beeld hoort ongeveer op ooghoogte te zitten als je zit, meestal 100 tot 110 cm. Een lager meubel kan, als je de tv iets kantelt of aan de muur hangt. Kijk ook naar het draagvermogen: een 65 inch tv weegt vaak 20 tot 30 kilo. Bij onze Tanner tv-meubels noemt de maker het draagvermogen van het blad niet; vraag het na als je tv zwaar is.</p>
<p>Meer keus in kasten en dressoirs: <a href="/dressoir">Dressoir, tv-meubel of ladekast: welke past bij jouw muur?</a></p>
<h2 id="vragen">Veelgestelde vragen</h2>${faq.map(f => `<details class="faq"><summary>${esc(f.v)}</summary><div class="a"><p>${esc(f.a)}</p></div></details>`).join('')}
</article>
<script>(function(){var K=${kern};function f(n){return String(n).replace('.',',')}
function toon(d){var k=K(d);if(!k)return;var u=document.getElementById('tv-uit');u.innerHTML='<div class="tv-tegels"><div class="tv-tegel"><span>Minstens</span><b>'+k.net+' cm</b></div><div class="tv-tegel licht"><span>Mooi vanaf</span><b>'+k.mooi+' cm</b></div></div><ul class="tv-feit"><li>Beeld <b>'+k.breedte+' x '+k.hoogte+' cm</b></li><li>Kijkafstand <b>'+f(k.kijkMin)+' tot '+f(k.kijkMax)+' m</b></li><li>Meubel ongeveer <b>'+k.meubelHoogte+' cm</b> hoog</li></ul>';
document.querySelectorAll('#tv-meubels .tv-m').forEach(function(el){var b=+el.getAttribute('data-b');var p=el.querySelector('[data-past]');if(!p)return;var c=b>=k.mooi?['ja','Past mooi']:b>=k.net?['','Past net']:['nee','Te smal'];p.className='tv-past '+c[0];p.textContent=c[1]+' bij '+k.inch+' inch';});
document.querySelectorAll('.tv-pills a.tv-p').forEach(function(a){if(+a.getAttribute('data-inch')===k.inch)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
var i=document.getElementById('tvi');if(i)i.value=k.inch;try{history.replaceState(null,'','#'+k.inch)}catch(e){}
try{navigator.sendBeacon&&navigator.sendBeacon('/gidstel?g=tv-rekenhulp&s=inch-'+k.inch)}catch(e){}}
document.querySelectorAll('.tv-pills a.tv-p').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();toon(+a.getAttribute('data-inch'))})});
var fm=document.querySelector('.tv-ander');if(fm)fm.addEventListener('submit',function(e){e.preventDefault();toon(+document.getElementById('tvi').value)});
var hsh=+String(location.hash).replace('#','');if(hsh>=10&&hsh<=150)toon(hsh);})();</script>`;
}

export function tvLlms(HOST) {
  const k = tvKern(65);
  return `## Rekenhulp: tv-meubel breedte berekenen\n\n- ${TV_TITEL}: ${HOST}${TV_PAD}\n- Regel: minstens de breedte van het beeld (16:9: diagonaal x 2,214 cm), mooi met 30 cm extra, ruim 1,5 x. Voorbeeld 65 inch: beeld ${k.breedte} cm, meubel minstens ${k.net} cm, mooi ${k.mooi} cm, kijkafstand ${fmt(k.kijkMin)} tot ${fmt(k.kijkMax)} m.\n`;
}
