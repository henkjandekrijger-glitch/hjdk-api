// Rekenhulpen voor maatvragen (SEO-gat: "welke maat fiets", "framemaat berekenen", "maat kinderfiets", "maat fietshelm").
// Eén sterke pagina per echte vraag: rekenhulp bovenaan, daaronder de tabellen (zonder klikken leesbaar), meetuitleg, vragen als kopjes
// en per maat een product bij bol met de prijs van vandaag.
import { kv } from './db.js';
import { searchCached } from './bol.js';

const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = v => '€' + Number(v).toFixed(2).replace('.', ',');
const DAG = () => new Date().toISOString().slice(0, 10);
const DATUM = d => { const m = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']; const x = new Date(d + 'T12:00:00Z'); return x.getUTCDate() + ' ' + m[x.getUTCMonth()] + ' ' + x.getUTCFullYear(); };
const kort = t => String(t || '').split(/\s[-–|]\s|,|\(/)[0].replace(/\s+/g, ' ').trim().slice(0, 70);
const TD = 'style="border-bottom:1px solid #f5f5f4;padding:6px 4px"', TH = 'style="text-align:left;border-bottom:1px solid #e7e5e4;padding:6px 4px"';
const tabel = (kop, rijen) => `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0 14px"><thead><tr>${kop.map(k => `<th ${TH}>${k}</th>`).join('')}</tr></thead><tbody>${rijen.map(r => `<tr>${r.map(c => `<td ${TD}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

// ---------- vaste rekenregels ----------
export const KIND = [ // wielmaat in inch, lichaamslengte, binnenbeen, leeftijd (richtlijn)
  { inch: 12, lengte: [85, 100], been: [35, 42], leeftijd: '2,5 tot 4 jaar' },
  { inch: 14, lengte: [95, 110], been: [40, 47], leeftijd: '3 tot 5 jaar' },
  { inch: 16, lengte: [105, 120], been: [45, 52], leeftijd: '4 tot 6 jaar' },
  { inch: 18, lengte: [115, 125], been: [50, 56], leeftijd: '5 tot 7 jaar' },
  { inch: 20, lengte: [120, 135], been: [53, 60], leeftijd: '6 tot 8 jaar' },
  { inch: 24, lengte: [130, 150], been: [60, 68], leeftijd: '8 tot 11 jaar' },
  { inch: 26, lengte: [145, 165], been: [66, 76], leeftijd: 'vanaf 11 jaar' }
];
export const STAD = [ // lichaamslengte -> framemaat stadsfiets / e-bike in cm (binnenbeen x 0,66)
  { lengte: 'tot 1,60 m', frame: '46 tot 49 cm' }, { lengte: '1,60 tot 1,65 m', frame: '49 tot 51 cm' }, { lengte: '1,65 tot 1,70 m', frame: '51 tot 53 cm' },
  { lengte: '1,70 tot 1,75 m', frame: '53 tot 55 cm' }, { lengte: '1,75 tot 1,80 m', frame: '55 tot 57 cm' }, { lengte: '1,80 tot 1,85 m', frame: '57 tot 59 cm' },
  { lengte: '1,85 tot 1,90 m', frame: '59 tot 61 cm' }, { lengte: '1,90 tot 1,95 m', frame: '61 tot 63 cm' }, { lengte: 'vanaf 1,95 m', frame: '63 cm of groter' }
];
export const RACE = [{ lengte: 'tot 1,60 m', frame: '47 tot 49 cm (XS)' }, { lengte: '1,60 tot 1,70 m', frame: '50 tot 52 cm (S)' }, { lengte: '1,70 tot 1,80 m', frame: '53 tot 55 cm (M)' }, { lengte: '1,80 tot 1,90 m', frame: '56 tot 58 cm (L)' }, { lengte: 'vanaf 1,90 m', frame: '59 tot 61 cm (XL)' }];
export const MTB = [{ lengte: 'tot 1,65 m', frame: 'S (ongeveer 15 tot 16 inch)' }, { lengte: '1,65 tot 1,78 m', frame: 'M (ongeveer 17 tot 18 inch)' }, { lengte: '1,78 tot 1,88 m', frame: 'L (ongeveer 19 tot 20 inch)' }, { lengte: 'vanaf 1,88 m', frame: 'XL (21 inch of groter)' }];
export const HELM = [{ maat: 'XS', omtrek: '46 tot 51 cm', wie: 'peuter, ongeveer 1 tot 3 jaar' }, { maat: 'S', omtrek: '51 tot 55 cm', wie: 'kind, ongeveer 3 tot 8 jaar' }, { maat: 'M', omtrek: '54 tot 58 cm', wie: 'oudere kinderen, tieners en kleinere volwassenen' }, { maat: 'L', omtrek: '58 tot 62 cm', wie: 'de meeste volwassen mannen' }, { maat: 'XL', omtrek: '61 tot 64 cm', wie: 'grote hoofdomtrek' }];

const NIET = /\b(mand|fietsmand|rek|fietsenrek|slot|tas|drager|zadel|binnenband|buitenband|band|bel|standaard|spatbord|hoes|zijwieltjes|steunwielen|stoeltje|bagage|spiegel|lamp|verlichting|pomp|sticker)\b/i;
// ---------- producten per maat (bol, prijs van vandaag, één keer per dag opgehaald) ----------
async function perMaat(naam, zoek, link) { // zoek: [{label, term, moet}]
  const k = 'hjdk:kz:reken2:' + naam; try { const c = await kv.get(k); if (c && c.dag === DAG()) return c; } catch (e) {}
  const rijen = await Promise.all(zoek.map(async z => { try { const r = await searchCached(z.term, { country: 'NL', size: 24, sort: 'RELEVANCE' }); const ps = (r.products || []).filter(p => p.price != null && (!z.moet || z.moet.test(p.title)) && (!z.ook || z.ook.test(p.title)) && !NIET.test(p.title));
    const p = ps.sort((a, b) => (b.rating || 3.5) - (a.rating || 3.5) || a.price - b.price)[0]; return p ? { label: z.label, product: kort(p.title), prijs: p.price, rating: p.rating, url: link(p.url, 'kz_reken-' + naam) } : null; } catch (e) { return null; } }));
  const uit = { dag: DAG(), rijen: rijen.filter(Boolean) }; if (uit.rijen.length) { try { await kv.set(k, uit, { ex: 3 * 86400 }); } catch (e) {} } return uit;
}
const productTabel = (t, kolom) => !t || !t.rijen.length ? '' : tabel([kolom, 'Een goede keus bij bol', 'Prijs op ' + DATUM(t.dag)], t.rijen.map(r => [esc(r.label), `<a href="${esc(r.url)}" target="_blank" rel="sponsored noopener nofollow" data-kz="reken">${esc(r.product)}</a>${r.rating ? ' <span style="color:#78716c">(' + String(r.rating).replace('.', ',') + '/5)</span>' : ''}`, eur(r.prijs)]));
const VORM = 'style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));align-items:end;margin:8px 0"';
const IN = 'style="width:100%;padding:9px;border:1px solid #d6d3d1;border-radius:8px;font-size:16px"';
const UIT = 'style="margin:10px 0 0;padding:12px 14px;border-radius:10px;background:#f5f5f4;font-size:16px;min-height:22px"';

// ---------- kinderfiets: blok voor de bestaande keuzehulpen kinderfiets en kinderfiets-maat-bepalen ----------
export async function kinderfietsBlok(link) {
  const t = await perMaat('kinderfiets', KIND.map(k => ({ label: k.inch + ' inch (' + k.leeftijd + ')', term: 'kinderfiets ' + k.inch + ' inch', ook: /fiets/i, moet: new RegExp('\\b' + k.inch + '\\s?(inch|")', 'i') })), link);
  return `<div class="txt" id="rekenhulp"><h2>Welke maat kinderfiets? Reken het uit</h2><p>Meet de binnenbeenlengte als het kan; dat is nauwkeuriger dan leeftijd of lengte.</p>
<div ${VORM}><label>Binnenbeen in cm<input id="kb" type="number" inputmode="numeric" min="25" max="90" ${IN}></label><label>of lengte in cm<input id="kl" type="number" inputmode="numeric" min="70" max="180" ${IN}></label><label>of leeftijd in jaren<input id="ka" type="number" inputmode="decimal" min="1" max="15" step="0.5" ${IN}></label></div><p id="kuit" ${UIT}>Vul één van de drie in.</p>
<h3 id="maattabel">Maattabel kinderfiets</h3>${tabel(['Wielmaat', 'Lengte kind', 'Binnenbeen', 'Leeftijd (richtlijn)'], KIND.map(k => [k.inch + ' inch', k.lengte[0] + ' tot ' + k.lengte[1] + ' cm', k.been[0] + ' tot ' + k.been[1] + ' cm', k.leeftijd]))}
<h3>Zo meet je de binnenbeenlengte</h3><ol><li>Laat je kind op blote voeten met de rug tegen de muur staan, voeten iets uit elkaar.</li><li>Schuif een boek met de rug omhoog stevig tussen de benen, zoals een zadel.</li><li>Meet van de bovenkant van het boek tot de grond.</li></ol>
<p><b>Twijfel tussen twee maten?</b> Kies de kleinste als je kind nog onzeker fietst of net zonder zijwieltjes begint; met beide voeten op de grond durft het meer. Kies de grootste als het al zeker fietst; met het zadel laag heeft het dan een jaar of twee groeiruimte.</p>
${t.rijen.length ? `<h3 id="kopen">Kinderfietsen per maat bij bol</h3>${productTabel(t, 'Maat')}` : ''}</div>
<script>(function(){var M=${JSON.stringify(KIND.map(k => ({ i: k.inch, l: k.lengte, b: k.been, a: k.leeftijd })))};function kies(v,s){for(var j=0;j<M.length;j++){var r=M[j][s];if(v<=r[1])return M[j]}return M[M.length-1]}function z(){var b=+document.getElementById('kb').value,l=+document.getElementById('kl').value,a=+document.getElementById('ka').value,u=document.getElementById('kuit'),m=null,w='';if(b){m=kies(b,'b');w='binnenbeen '+b+' cm'}else if(l){m=kies(l,'l');w='lengte '+l+' cm'}else if(a){var g=[3.5,4.5,6,7,8.5,11,99];for(var j=0;j<g.length;j++)if(a<g[j]){m=M[j];break}w='leeftijd '+a+' jaar'}if(!m){u.textContent='Vul één van de drie in.';return}u.innerHTML='Bij '+w+' past een <b>'+m.i+' inch kinderfiets</b> (richtlijn: lengte '+m.l[0]+' tot '+m.l[1]+' cm, binnenbeen '+m.b[0]+' tot '+m.b[1]+' cm). <a href="#kopen">Bekijk '+m.i+' inch fietsen</a>.';try{navigator.sendBeacon('/api/hjdk/stats/hits',new Blob([JSON.stringify({hits:[['hjdk6-kz-reken-kinderfiets-'+m.i,1]]})],{type:'text/plain'}))}catch(e){}}['kb','kl','ka'].forEach(function(i){document.getElementById(i).addEventListener('input',z)})})();</script>`;
}

// ---------- fietshelm: blok voor fietshelm-kind en fietshelm-volwassenen ----------
export async function helmBlok(link, kind) {
  const maten = kind ? HELM.slice(0, 3) : HELM.slice(2);
  const t = await perMaat(kind ? 'helmkind' : 'helmvolw', maten.map(h => ({ label: 'Maat ' + h.maat + ' (' + h.omtrek + ')', term: (kind ? 'fietshelm kind ' : 'fietshelm ') + h.maat, ook: /helm/i, moet: new RegExp('\\b' + h.maat + '\\b|' + h.omtrek.split(' ')[0], 'i') })), link);
  return `<div class="txt" id="rekenhulp"><h2>Welke maat fietshelm? Reken het uit</h2><p>Meet de hoofdomtrek met een meetlint, ongeveer 1 cm boven de wenkbrauwen en over het breedste deel van het achterhoofd.</p>
<div ${VORM}><label>Hoofdomtrek in cm<input id="ho" type="number" inputmode="numeric" min="40" max="70" ${IN}></label></div><p id="huit" ${UIT}>Vul de hoofdomtrek in.</p>
<h3>Maattabel fietshelm</h3>${tabel(['Maat', 'Hoofdomtrek', 'Meestal voor'], HELM.map(h => [h.maat, h.omtrek, h.wie]))}
<p><b>Valt je meting precies tussen twee maten?</b> Kies de maat waarin je omtrek in het midden valt; de meeste helmen hebben een draaiknop achterin om een paar centimeter bij te stellen. Een goede helm zit recht op het hoofd, twee vingers boven de wenkbrauwen, en schuift niet als je je hoofd schudt.</p>
${t.rijen.length ? `<h3 id="kopen">Helmen per maat bij bol</h3>${productTabel(t, 'Maat')}` : ''}</div>
<script>(function(){var H=${JSON.stringify(HELM.map(h => ({ m: h.maat, o: h.omtrek })))};document.getElementById('ho').addEventListener('input',function(){var v=+this.value,u=document.getElementById('huit');if(!v){u.textContent='Vul de hoofdomtrek in.';return}var r=v<51?'XS':v<55?'S':v<58?'M':v<61.5?'L':'XL';var h=H.filter(function(x){return x.m===r})[0];u.innerHTML='Bij '+v+' cm hoofdomtrek past <b>maat '+r+'</b> ('+h.o+').';try{navigator.sendBeacon('/api/hjdk/stats/hits',new Blob([JSON.stringify({hits:[['hjdk6-kz-reken-helm-'+r,1]]})],{type:'text/plain'}))}catch(e){}})})();</script>`;
}

// ---------- framemaat volwassenen: eigen pagina /fietsmaat ----------
export const FIETSMAAT_FAQ = [
  ['Welke framemaat heb ik bij 1,80 meter?', 'Bij 1,80 m past meestal een stadsfiets of e-bike van 57 cm, een racefiets van 56 cm (L) en een mountainbike in maat L. Met je binnenbeenlengte reken je het preciezer uit: binnenbeen keer 0,66 voor een stadsfiets.'],
  ['Hoe bereken ik mijn framemaat?', 'Meet je binnenbeenlengte in centimeters en vermenigvuldig die met 0,66 voor een stadsfiets of e-bike, met 0,67 voor een racefiets en met 0,57 voor een mountainbike. Bij een binnenbeen van 85 cm is dat 56 cm voor een stadsfiets.'],
  ['Framemaat 56: welke lengte hoort daarbij?', 'Een stadsfiets van 56 cm past meestal bij een lengte van ongeveer 1,75 tot 1,82 m en een binnenbeen rond 85 cm. Bij een racefiets past 56 cm bij ongeveer 1,80 tot 1,86 m.'],
  ['Wat als ik tussen twee framematen in zit?', 'Kies de kleinere maat als je rechtop en ontspannen wilt zitten of vaak op- en afstapt; kies de grotere als je lange afstanden rijdt en meer gestrekt zit. Bij een e-bike met lage instap mag je gerust de kleinere nemen.'],
  ['Welke maat e-bike heb ik nodig?', 'Een e-bike reken je hetzelfde uit als een stadsfiets: binnenbeen keer 0,66. Merken meten soms anders (van trapas tot bovenkant buis of tot het midden), dus vergelijk altijd met de maattabel van het merk.']
];
export async function fietsmaatPagina(link) {
  const t = await perMaat('fietsmaat', [
    { label: 'Herenfiets 53 cm', term: 'herenfiets 53 cm', moet: /\b53\s?cm/i, ook: /fiets/i }, { label: 'Herenfiets 57 cm', term: 'herenfiets 57 cm', moet: /\b57\s?cm/i, ook: /fiets/i }, { label: 'Herenfiets 61 cm', term: 'herenfiets 61 cm', moet: /\b61\s?cm/i, ook: /fiets/i },
    { label: 'Damesfiets 50 cm', term: 'damesfiets 50 cm', moet: /\b50\s?cm/i, ook: /fiets/i }, { label: 'Damesfiets 53 cm', term: 'damesfiets 53 cm', moet: /\b53\s?cm/i, ook: /fiets/i }, { label: 'Damesfiets 57 cm', term: 'damesfiets 57 cm', moet: /\b57\s?cm/i, ook: /fiets/i },
    { label: 'Elektrische fiets 53 cm', term: 'elektrische fiets 53 cm', moet: /\b53\s?cm/i, ook: /(e-bike|elektrische fiets|ebike)/i }, { label: 'Elektrische fiets 57 cm', term: 'elektrische fiets 57 cm', moet: /\b57\s?cm/i, ook: /(e-bike|elektrische fiets|ebike)/i }
  ], link);
  const omgekeerd = [[50, '1,60 tot 1,67 m', '76 cm'], [53, '1,67 tot 1,74 m', '80 cm'], [55, '1,72 tot 1,79 m', '83 cm'], [56, '1,75 tot 1,82 m', '85 cm'], [57, '1,77 tot 1,84 m', '86 cm'], [59, '1,82 tot 1,89 m', '89 cm'], [61, '1,86 tot 1,93 m', '92 cm']];
  const body = `<div class="hero"><p class="kicker">Rekenhulp</p><h1>Welke maat fiets heb ik nodig? Framemaat berekenen</h1></div>
<div class="answer"><p class="kicker" style="margin:0 0 6px">In het kort</p><p><b>Framemaat stadsfiets of e-bike = binnenbeenlengte × 0,66.</b> Bij 1,80 m en een binnenbeen van 86 cm is dat 57 cm. Voor een racefiets reken je × 0,67, voor een mountainbike × 0,57 (of maat L bij 1,80 m).</p></div>
<div class="txt" id="rekenhulp"><h2>Reken je framemaat uit</h2>
<div ${VORM}><label>Soort fiets<select id="ft" ${IN}><option value="stad">Stadsfiets of e-bike</option><option value="race">Racefiets of gravelfiets</option><option value="mtb">Mountainbike</option></select></label><label>Binnenbeen in cm<input id="fb" type="number" inputmode="numeric" min="55" max="105" ${IN}></label><label>of lengte in cm<input id="fl" type="number" inputmode="numeric" min="140" max="210" ${IN}></label></div><p id="fuit" ${UIT}>Vul je binnenbeen of je lengte in.</p></div>
<div class="txt"><h2>Hoe meet je je binnenbeenlengte?</h2><ol><li>Ga op blote voeten met je rug tegen een muur staan, voeten zo'n 15 cm uit elkaar.</li><li>Klem een boek met de rug omhoog stevig tussen je benen, zoals een zadel.</li><li>Laat iemand meten van de bovenkant van het boek tot de grond, in centimeters.</li></ol><p>Je lengte alleen is minder precies: twee mensen van 1,80 m kunnen 5 cm in beenlengte schelen, en dat is een hele framemaat.</p></div>
<div class="txt"><h2>Framemaat stadsfiets en e-bike bij jouw lengte</h2>${tabel(['Jouw lengte', 'Framemaat'], STAD.map(r => [r.lengte, r.frame]))}</div>
<div class="txt"><h2>Welke maat racefiets heb ik nodig?</h2>${tabel(['Jouw lengte', 'Framemaat racefiets'], RACE.map(r => [r.lengte, r.frame]))}<p>Racefietsmerken gebruiken vaak S, M en L naast centimeters. Kijk naar de 'stack' en 'reach' in de maattabel als je tussen twee maten zit.</p></div>
<div class="txt"><h2>Welke maat mountainbike heb ik nodig?</h2>${tabel(['Jouw lengte', 'Maat mountainbike'], MTB.map(r => [r.lengte, r.frame]))}<p>Kinderen tot ongeveer 1,50 m rijden op een mountainbike met 24 inch wielen, daarboven 26 of 27,5 inch. Voor kinderfietsen staat een aparte <a href="/kinderfiets-maat-bepalen#rekenhulp">rekenhulp kinderfietsmaat</a>.</p></div>
<div class="txt"><h2>Framemaat omrekenen naar lengte</h2><p>Heb je een fiets op het oog en wil je weten of hij past? Dit zijn de richtlijnen voor een stadsfiets:</p>${tabel(['Framemaat', 'Lengte', 'Binnenbeen rond'], omgekeerd.map(r => [r[0] + ' cm', r[1], r[2]]))}</div>
${t.rijen.length ? `<div class="txt" id="kopen"><h2>Fietsen in deze maten bij bol</h2>${productTabel(t, 'Soort en maat')}</div>` : ''}
<div class="txt"><h2>Vragen over fietsmaat</h2>${FIETSMAAT_FAQ.map(f => `<h3>${esc(f[0])}</h3><p>${esc(f[1])}</p>`).join('')}</div>
<div class="txt"><h2>Verder kiezen</h2><p><a href="/e-bike">Keuzehulp e-bike</a> · <a href="/elektrische-fiets-kiezen">Elektrische fiets kiezen</a> · <a href="/kinderfiets-maat-bepalen">Maat kinderfiets</a> · <a href="/fietshelm-volwassenen">Fietshelm en maat</a> · <a href="/fietsverlichting">Fietsverlichting</a></p></div>
<script>(function(){var F={stad:0.66,race:0.67,mtb:0.57};function mtb(l){return l<165?'S':l<178?'M':l<188?'L':'XL'}function z(){var s=document.getElementById('ft').value,b=+document.getElementById('fb').value,l=+document.getElementById('fl').value,u=document.getElementById('fuit');if(!b&&l)b=Math.round(l*0.475);if(!b){u.textContent='Vul je binnenbeen of je lengte in.';return}var cm=Math.round(b*F[s]);var t=s==='mtb'?'een mountainbike in maat <b>'+(l?mtb(l):(cm<41?'S':cm<46?'M':cm<50?'L':'XL'))+'</b> (ongeveer '+Math.round(b*0.226)+' inch)':'een '+(s==='race'?'racefiets':'stadsfiets of e-bike')+' met framemaat <b>'+cm+' cm</b>';u.innerHTML='Bij '+(document.getElementById('fb').value?'een binnenbeen van '+b+' cm':'een lengte van '+l+' cm (binnenbeen geschat op '+b+' cm)')+' past '+t+'. Twijfel je, kies dan de kleinere maat voor een rechtopzit en de grotere voor lange ritten.';try{navigator.sendBeacon('/api/hjdk/stats/hits',new Blob([JSON.stringify({hits:[['hjdk6-kz-reken-fietsmaat-'+s,1]]})],{type:'text/plain'}))}catch(e){}}['ft','fb','fl'].forEach(function(i){document.getElementById(i).addEventListener('input',z)})})();</script>`;
  return { titel: 'Welke maat fiets heb ik nodig? Framemaat berekenen (met tabel)', beschrijving: 'Reken je framemaat uit met je binnenbeen of lengte: stadsfiets, e-bike, racefiets en mountainbike. Met maattabellen, meetuitleg en fietsen per maat bij bol.', body, faq: FIETSMAAT_FAQ };
}
