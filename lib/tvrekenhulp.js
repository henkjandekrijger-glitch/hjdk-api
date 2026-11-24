// Rekenhulp tv-meubel breedte op gids.kadoly.com/tv-meubel-breedte-berekenen (24 nov 2026, Henkjan: "Maak die rekenhulp max geoptimaliseerd
// voor vindbaarheid" en "op onze gids appart page ?").
// Waarom: Demand Radar (vraagkansen, NL+BE per maand): tv-meubels 384.749, "tv-meubel" 67.042, "meubels voor tv" 49.500 vaste vraag zonder
// echte vergelijkpagina in de top 10 (nichescan 23 nov). Gatscan kadoly-wonen-kansen (Perplexity, 24 nov): "Welk tv-meubel past bij een tv van
// 65 inch?" haalt alleen Amerikaanse sites aan (312interiors.com, theurbaneditions.com) en geeft geen product of prijs. Geen Nederlandse rekenhulp
// die tv-maat omzet naar meubelbreedte, met de meubels erbij die het echt aankunnen.
// Rekenregels: geometrische 16:9-beeldmaat, stylingindicatie en voorbeeld-kijkhoek.
// De velden net/mooi/ruim zijn bestaande API-veldnamen, geen passendheids- of veiligheidsnorm.
// Fysieke tv-maat, volledige voet, diepte, draagvermogen en montage moeten apart bevestigd zijn.
// Kern draait op server en in browser; test scripts/test-tvrekenhulp.mjs.

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
 const k=tvKern(65);
 return [
 {v:TV_VRAAG,a:`Het berekende 16:9-beeld is circa ${k.breedte} cm breed. ${k.mooi} cm meubelbreedte geeft ongeveer 15 cm stylingruimte per kant, gerekend vanaf het beeld. Dit bewijst geen fysieke passing. Controleer totale tv-breedte, volledige voetafmetingen, meubeldiepte, draagvermogen en montage-instructies.`},
 ...[55,75,85,43].map(m=>{const x=tvKern(m);return {v:`Hoe breed moet een tv-meubel zijn voor een ${m} inch tv?`,a:`Het berekende beeld is ${x.breedte} bij ${x.hoogte} cm. ${x.mooi} cm is een stylingindicatie met 30 cm extra breedte. De echte toestelmaat, voet en belasting bepalen of een meubel geschikt is; inch alleen is onvoldoende.`};}),
 {v:'Hoe breed is een 65 inch tv?',a:'Het berekende 16:9-beeld is circa 144 cm breed, zonder behuizing. De fysieke toestelbreedte verschilt per model. Sony noemt voor de K-65S30 bijvoorbeeld 145,2 cm, met voet 33,4 cm diep. Dat voorbeeld is geen universele maat.'},
 {v:'Hoe ver moet je van een 65 inch tv zitten?',a:`De berekende afstand voor een kijkhoek van 40 tot 30 graden is ${fmt(k.kijkMin)} tot ${fmt(k.kijkMax)} meter. Dit is een geometrisch voorbeeld; beeldresolutie, voorkeur en kamer bepalen mede wat prettig kijkt.`},
 {v:'Mag een tv breder zijn dan het tv-meubel?',a:'Volg de instructies van de tv- en meubelfabrikant. Alle poten of de volledige middenvoet moeten passend ondersteund worden. Controleer ook stabiliteit, diepte en draagvermogen. Zonder die gegevens bevestigen wij geen veilige combinatie.'},
 {v:'Hoe hoog moet een tv-meubel zijn?',a:`Met onze voorbeeldwaarden van 105 cm ooghoogte en 8 cm voet komt de berekening voor 65 inch op ongeveer ${k.meubelHoogte} cm. Meet je eigen zithoogte en de echte voet; deze vaste aannames zijn geen algemene norm.`}
 ];
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

const passTekst = (b, k) => b >= k.mooi ? ['ja', 'Stylingmarge vanaf beeld'] : b >= k.net ? ['', 'Beeldbreedte gedekt'] : ['nee', 'Smaller dan beeld'];

// h = { esc, euro, cat, thuis, leverTekst } ; inch = gekozen maat (server), standaard 65
export function tvPagina(h, inch = 65) {
  const { esc } = h; const x = tvKern(inch) || tvKern(65);
  const uitHtml = k => `<div class="tv-tegels"><div class="tv-tegel"><span>Beeldbreedte, afgerond omhoog</span><b>${k.net} cm</b></div><div class="tv-tegel licht"><span>Stylingindicatie</span><b>${k.mooi} cm</b></div></div><ul class="tv-feit"><li>Beeld <b>${k.breedte} x ${k.hoogte} cm</b></li><li>Kijkafstand <b>${fmt(k.kijkMin)} tot ${fmt(k.kijkMax)} m</b></li><li>Meubel ongeveer <b>${k.meubelHoogte} cm</b> hoog</li></ul>`;
  const meubels = TV_MEUBELS.map(m => ({ m, i: h.cat[m.pid] })).filter(y => y.i && y.i.vr !== false);
  const meubelHtml = k => meubels.length ? meubels.map(({ m, i }) => { const [kl, past] = passTekst(m.breedte, k); const v = tvVoorMeubel(m.breedte);
    return `<div class="tv-m" data-b="${m.breedte}">${i.img ? `<img src="${esc(i.img)}" alt="${esc(i.t)}" width="72" height="72" loading="lazy">` : '<span></span>'}<div><span class="tv-past ${kl}" data-past>${past} bij ${k.inch} inch</span><h3><a href="/naar/${encodeURIComponent(m.pid)}?g=tv-rekenhulp&amp;b=reken" rel="nofollow">${esc(i.t)}</a></h3><p>${m.breedte} cm breed, ${m.hoogte} cm hoog${m.soort === 'dressoir' ? ', een dressoir (hoger dan een tv-meubel)' : ''}. Rekenindicatie: stylingmarge tot ${v.mooi} inch, beeldbreedte tot ${v.net} inch. Geen bevestigd maximumformaat; controleer voet, diepte en draagvermogen.</p><p><b>${esc(h.euro(h.thuis(i)))}</b> inclusief btw en verzending, ${esc(h.leverTekst(i))}.</p></div></div>`; }).join('') : '<p>Op dit moment hebben we geen tv-meubel op voorraad. De maten hierboven gelden voor elk meubel.</p>';
  const rijen = TV_MATEN.map(m => { const k = tvKern(m); return `<tr><td>${m} inch</td><td>${k.breedte} x ${k.hoogte} cm</td><td>${k.net} cm</td><td>${k.mooi} cm</td><td>${fmt(k.kijkMin)} tot ${fmt(k.kijkMax)} m</td></tr>`; }).join('');
  const faq = tvFaq();
  const kern = `${tvKern.toString()}`;
  return CSS + `<article><nav class="crumbs" aria-label="Kruimelpad"><a href="/">Kadoly gids</a> › Tv-meubel breedte berekenen</nav><p class="kicker"><span class="live-dot"></span>Rekenhulp · tv-meubel</p><h1>${esc(TV_TITEL)}</h1>
<p class="meta kz-meta">Door de redactie van Kadoly · bijgewerkt <time datetime="${TV_DAG}">24 november 2026</time></p>
<section id="reken" aria-labelledby="reken-kop"><h2 id="reken-kop">Hoe groot is je tv?</h2><div class="tv-pills" role="group" aria-label="Tv-maat in inch">${[43, 50, 55, 65, 75, 85].map(m => `<a class="tv-p" href="?inch=${m}#reken" data-inch="${m}"${m === x.inch ? ' aria-current="true"' : ''}>${m} inch</a>`).join('')}</div>
<form class="tv-ander" action="${TV_PAD}#reken" method="get"><label for="tvi">Andere maat</label><input id="tvi" name="inch" type="number" inputmode="numeric" min="10" max="150" value="${x.inch}"><button type="submit">Bereken</button></form>
<div class="tv-uit" id="tv-uit" aria-live="polite">${uitHtml(x)}</div>
<p><strong>Geen bevestigde passing:</strong> de getallen rekenen met het beeld. Controleer de echte toestelmaat, volledige voet, diepte, draagvermogen en montage vóór aankoop; ook bij een middenvoet.</p><div id="tv-meubels">${meubelHtml(x)}</div></section>
<div class="answer lead"><p><b>Kort antwoord:</b> inch rekent de beeldmaat uit, niet of een tv veilig op een meubel past. Voor 65 inch is het beeld circa ${tvKern(65).breedte} cm breed; ${tvKern(65).mooi} cm is een stylingindicatie. Bevestig vóór aankoop de totale toestelmaat, volledige voet, beschikbare diepte en het draagvermogen. Bij ontbrekende gegevens is passing onbekend.</p></div>
<h2 id="tabel">Tv-maat en meubelbreedte in één tabel</h2><p>Beeldmaten bij 16:9, zonder de rand van de tv. De afstand is berekend voor een kijkhoek van 40 tot 30 graden, geen persoonlijke aanbeveling.</p><div style="overflow-x:auto"><table class="tv-tab"><thead><tr><th>Tv</th><th>Beeld</th><th>Beeldbreedte omhoog afgerond</th><th>Stylingindicatie meubel</th><th>Kijkafstand</th></tr></thead><tbody>${rijen}</tbody></table></div>
<h2 id="uitleg">Zo rekenen we</h2>
<p>Een tv-maat in inch is de diagonaal van het beeld. Eén inch is 2,54 cm. Bij een gewone tv (16:9) is het beeld 0,87 keer zo breed als de diagonaal: een 65 inch tv heeft een beeld van ${tvKern(65).breedte} cm breed. Behuizing en voet verschillen per model; raadpleeg de modelspecificatie.</p>
<p>De getallen vergelijken de meubelbreedte alleen met de berekende beeldbreedte. De stylingindicatie telt 30 cm op; de ruime variant neemt anderhalf keer de beeldbreedte. Dit zijn onze ontwerpvuistregels, geen veiligheidsnorm of bewijs dat jouw tv past.</p>
<h2>Let op de poten van je tv</h2><p>Veel tv's staan op twee poten aan de buitenkant. Dan moet het meubel minstens zo breed zijn als de afstand tussen de poten, en ook diep genoeg. Meet de poten of kijk in de handleiding. Ook bij één middenvoet tellen de volledige breedte én diepte van die voet, het draagvermogen en de montage-instructies. Een middenvoet maakt beeldbreedte niet voldoende als passendheidscheck.</p>
<h2>Kijkafstand en hoogte: rekenvoorbeelden</h2><p>De afstand volgt uit beeldbreedte gedeeld door tweemaal de tangens van de halve kijkhoek. We tonen 30 tot 40 graden als voorbeeld. Voor de hoogte nemen we 105 cm ooghoogte en een voet van 8 cm aan. Meet je eigen zitpositie en echte voet; deze aannames zijn geen norm.</p>
<h2>Modelgegevens gaan vóór inch</h2><p>De <a href="https://www.sony.com/electronics/support/televisions-projectors-lcd-tvs-android-/k-65s30/specifications" rel="noopener">Sony K-65S30-specificatie</a> noemt 145,2 cm toestelbreedte, 33,4 cm diepte met voet, 117,5 cm standbreedte en 21,7 kg met voet. Gecontroleerd 24 november 2026. Dit zijn commerciële fabrikantgegevens van één model, geen onafhankelijke test en geen universele 65-inch-maten.</p><p>Voor de getoonde Tanner-meubels is het draagvermogen van het blad niet vastgesteld. Het eigen meubelgewicht van 67 kg bij dp_1022 is geen draagvermogen. Vraag de toegestane belasting, bruikbare bladdiepte en montage-instructies op vóór je de combinatie kiest; wij bevestigen geen veilige passing zonder die gegevens.</p>
<p>Meer keus in kasten en dressoirs: <a href="/dressoir">Dressoir, tv-meubel of ladekast: welke past bij jouw muur?</a></p>
<h2 id="vragen">Veelgestelde vragen</h2>${faq.map(f => `<details class="faq"><summary>${esc(f.v)}</summary><div class="a"><p>${esc(f.a)}</p></div></details>`).join('')}
</article>
<script>(function(){var K=${kern};function f(n){return String(n).replace('.',',')}
function toon(d){var k=K(d);if(!k)return;var u=document.getElementById('tv-uit');u.innerHTML='<div class="tv-tegels"><div class="tv-tegel"><span>Beeldbreedte, afgerond omhoog</span><b>'+k.net+' cm</b></div><div class="tv-tegel licht"><span>Stylingindicatie</span><b>'+k.mooi+' cm</b></div></div><ul class="tv-feit"><li>Beeld <b>'+k.breedte+' x '+k.hoogte+' cm</b></li><li>Kijkafstand <b>'+f(k.kijkMin)+' tot '+f(k.kijkMax)+' m</b></li><li>Meubel ongeveer <b>'+k.meubelHoogte+' cm</b> hoog</li></ul>';
document.querySelectorAll('#tv-meubels .tv-m').forEach(function(el){var b=+el.getAttribute('data-b');var p=el.querySelector('[data-past]');if(!p)return;var c=b>=k.mooi?['ja','Stylingmarge vanaf beeld']:b>=k.net?['','Beeldbreedte gedekt']:['nee','Smaller dan beeld'];p.className='tv-past '+c[0];p.textContent=c[1]+' bij '+k.inch+' inch';});
document.querySelectorAll('.tv-pills a.tv-p').forEach(function(a){if(+a.getAttribute('data-inch')===k.inch)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
var i=document.getElementById('tvi');if(i)i.value=k.inch;try{history.replaceState(null,'','#'+k.inch)}catch(e){}
try{navigator.sendBeacon&&navigator.sendBeacon('/gidstel?g=tv-rekenhulp&s=inch-'+k.inch)}catch(e){}}
document.querySelectorAll('.tv-pills a.tv-p').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();toon(+a.getAttribute('data-inch'))})});
var fm=document.querySelector('.tv-ander');if(fm)fm.addEventListener('submit',function(e){e.preventDefault();toon(+document.getElementById('tvi').value)});
var hsh=+String(location.hash).replace('#','');if(hsh>=10&&hsh<=150)toon(hsh);})();</script>`;
}

export function tvLlms(HOST) {
  const k = tvKern(65);
  return `## Rekenhulp: tv-meubel breedte berekenen\n\n- ${TV_TITEL}: ${HOST}${TV_PAD}\n- Regel: 16:9-beeldbreedte = diagonaal x 2,214 cm. Stylingindicatie = beeldbreedte + 30 cm; geen fysieke passendheids- of veiligheidscheck. Voorbeeld 65 inch: beeld ${k.breedte} cm, stylingindicatie ${k.mooi} cm, geometrische afstand ${fmt(k.kijkMin)} tot ${fmt(k.kijkMax)} m. Controleer exacte toestelmaat, volledige voet, diepte en draagvermogen; onbekende belasting is geen bevestigde combinatie.\n`;
}

