// Verlanglijst om door te sturen (Henkjan 27 nov 2026: "Voer alles door", voorstel 2 van de 10 organische voorstellen).
// Iemand kiest Kadoly-producten voor zijn verlanglijst (Sinterklaas tot en met 5 december, daarna Kerst) en stuurt de lijst met één tik via
// WhatsApp naar familie. Wie de lijst opent, koopt via Clickmind (op=org, k=wa, c=vl<code>) en kan aangeven dat hij iets koopt, zodat
// niemand hetzelfde cadeau dubbel koopt; de maker ziet dat niet (verrassing blijft). Onderaan: "Maak je eigen verlanglijst" (de lijst
// verspreidt zich zelf). Trend achter dit idee: YouTube-video's met Wishlist plus Christmas/Santa in de titel ruim 90 mln weergaven
// (sep-dec 2025, Google Holiday Shopping Trends Report 2026; Videomind op=trend).
// Opslag: kd:vl:<code> { naam, feest, pids, at, van, gekocht: { pid: tijd } } 120 dagen; tellers sh-vl-maak, sh-vl-view, sh-vl-koop.
// Paden: go.kadoly.com/verlanglijst (maken) en go.kadoly.com/verlanglijst/<code> (bekijken), via op=lijst in fn/shop.js.
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = x => Number(x) || 0;
const eur = n => '€ ' + num(n).toFixed(2).replace('.', ',');
export const VL_MAX = 12;
export function feestNu(t = new Date()) { return t.getUTCMonth() === 10 || (t.getUTCMonth() === 11 && t.getUTCDate() < 6) ? 'Sinterklaas' : 'Kerst'; }
export const prijsVan = i => Math.round((num(i.p) + (num(i.vk) || 0)) * 100) / 100;

// Keuze voor de maakpagina: leverbaar, met foto, marge vanaf € 5, all-in € 10 tot € 80; trendproducten eerst, dan marge; hooguit 2 per merk.
export function kiesProducten(items, trendPids = [], n = 36) {
  const trend = new Set(trendPids || []), perMerk = {};
  const ok = (items || []).filter(i => i && i.id && i.img && i.vr !== false && num(i.mg) >= 5 && prijsVan(i) >= 10 && prijsVan(i) <= 80);
  ok.sort((a, b) => (trend.has(b.id) ? 100 : 0) + num(b.mg) - (trend.has(a.id) ? 100 : 0) - num(a.mg));
  const uit = []; for (const i of ok) { const m = String(i.b || '-'); if ((perMerk[m] || 0) >= 2) continue; perMerk[m] = (perMerk[m] || 0) + 1; uit.push(i); if (uit.length >= n) break; }
  return uit;
}
export function schoonLijst(b, items) {
  const bekend = new Set((items || []).map(i => i.id)); const pids = [...new Set((Array.isArray(b && b.pids) ? b.pids : []).map(String))].filter(p => bekend.has(p)).slice(0, VL_MAX);
  const naam = String((b && b.naam) || '').replace(/[<>"]/g, '').trim().slice(0, 24);
  const van = String((b && b.van) || '').replace(/[^a-z0-9]/gi, '').slice(0, 8);
  return { pids, naam, van };
}
const CSS = `.wrap{max-width:34rem}main{padding:10px 0 96px}h1{font-size:1.75rem;line-height:1.15;margin:12px 0 8px}.uitleg{margin:0 0 14px;font-size:1.0625rem;color:#000}
.naam{font:inherit;font-size:1.0625rem;padding:13px 14px;border:2px solid #000;border-radius:12px;width:100%;box-sizing:border-box;margin:0 0 14px;color:#000;background:#fff}
.pg{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pc{position:relative;border:2px solid #000;border-radius:12px;overflow:hidden;background:#fff;text-align:left;padding:0;font:inherit;color:#000;cursor:pointer}
.pc img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;background:#fff}.pt{display:block;padding:8px 10px 0;font-size:.9375rem;font-weight:600;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pp{display:block;padding:4px 10px 10px;font-weight:800}
.pc .v{position:absolute;top:8px;right:8px;width:34px;height:34px;border-radius:50%;background:#fff;border:2px solid #000;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.25rem}.pc.aan{outline:4px solid #000}.pc.aan .v{background:#000;color:#fff}
.balk{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:2px solid #000;padding:12px 16px}.balk .wrap{display:flex;gap:10px}
.knop{display:block;flex:1;text-align:center;font:inherit;font-size:1.125rem;font-weight:800;padding:15px;border:0;border-radius:12px;background:#000;color:#fff;text-decoration:none;cursor:pointer}.knop[disabled]{opacity:.35}
.knop.wa{background:#25D366;color:#000}.rand{display:block;text-align:center;margin:12px 0 0;padding:14px;border:2px solid #000;border-radius:12px;color:#000;font-weight:800;text-decoration:none}
.rij{display:grid;grid-template-columns:96px 1fr;gap:12px;border:2px solid #000;border-radius:12px;padding:10px;margin:0 0 10px;background:#fff}.rij img{width:96px;height:96px;object-fit:cover;border-radius:8px}
.rij .t{font-weight:700;line-height:1.25;margin:0 0 4px}.rij .k{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}.rij a.koop{background:#000;color:#fff;font-weight:800;padding:10px 14px;border-radius:10px;text-decoration:none}
.rij button{font:inherit;font-weight:700;padding:10px 12px;border-radius:10px;border:2px solid #000;background:#fff;color:#000;cursor:pointer}.al{font-weight:800}[hidden]{display:none!important}.klein{font-size:.875rem;color:#000}`;
const kop = (look, titel) => `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(titel)} | Kadoly</title><style>${look}${CSS}</style><script src="/cm.js" data-site="kadolylijst" async></script></head><body><header class="topbar"><div class="wrap"><span class="mark">Kadoly</span></div></header>`;
const voet = `<footer><div class="wrap"><p class="klein">Kadoly by AdsFair B.V. · KvK 60126035 · Gouda · <a href="https://kadoly.com/shop/privacy">Privacy</a></p></div></footer>`;

export function maakPagina({ items = [], look = '', van = '', feest = feestNu(), start = [] }) {
  const kaart = i => `<button type="button" class="pc" data-p="${esc(i.id)}"><img src="${esc(i.img)}" alt="" loading="lazy" width="300" height="300"><span class="v" aria-hidden="true">+</span><span class="pt">${esc(i.t)}</span><span class="pp">${esc(eur(prijsVan(i)))}</span></button>`;
  return kop(look, 'Maak je verlanglijst voor ' + feest) + `<main class="wrap">
<h1>Maak je verlanglijst voor ${esc(feest)}</h1>
<p class="uitleg">Tik op wat je wilt hebben en stuur je lijst met één tik naar je familie. Zij zien wie wat koopt, jij niet: de verrassing blijft.</p>
<input class="naam" id="n" placeholder="Je voornaam (zo weten ze van wie de lijst is)" maxlength="24" autocomplete="given-name">
<div class="pg">${items.map(kaart).join('')}</div>
</main>
<div class="balk"><div class="wrap"><button class="knop" id="s" disabled>Kies wat je wilt</button></div></div>
<div class="balk" id="deel" hidden><div class="wrap" style="display:block"><a class="knop wa" id="wa" href="#">Stuur via WhatsApp</a><a class="rand" id="kop" href="#">Kopieer de link</a></div></div>
${voet}
<script>(function(){var gekozen=[],START=${JSON.stringify(start || [])},MAX=${VL_MAX},VAN=${JSON.stringify(van)},s=document.getElementById('s');function b(e){try{navigator.sendBeacon('/api/shop?op=lijst&b='+e,'')}catch(x){}}
function tekst(){s.disabled=!gekozen.length;s.textContent=gekozen.length?'Stuur je lijst ('+gekozen.length+')':'Kies wat je wilt'}
document.querySelectorAll('.pc').forEach(function(k){k.addEventListener('click',function(){var p=k.getAttribute('data-p'),i=gekozen.indexOf(p);if(i>=0){gekozen.splice(i,1);k.classList.remove('aan');k.querySelector('.v').textContent='+'}else{if(gekozen.length>=MAX)return;gekozen.push(p);k.classList.add('aan');k.querySelector('.v').textContent='✓'}tekst()})});
document.querySelectorAll('.pc').forEach(function(k){if(START.indexOf(k.getAttribute('data-p'))>=0)k.click()});
s.addEventListener('click',function(){if(!gekozen.length)return;s.disabled=true;s.textContent='Even geduld...';fetch('/api/shop?op=lijst',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({pids:gekozen,naam:document.getElementById('n').value,van:VAN})}).then(function(r){return r.json()}).then(function(j){if(!j||!j.ok)throw 0;try{localStorage.setItem('vl-eigen-'+j.code,'1')}catch(x){}
var url=location.origin+'/verlanglijst/'+j.code,t='Mijn verlanglijst voor '+j.feest+': '+url;document.getElementById('wa').href='https://wa.me/?text='+encodeURIComponent(t);var kp=document.getElementById('kop');kp.addEventListener('click',function(e){e.preventDefault();try{navigator.clipboard.writeText(url);kp.textContent='Gekopieerd'}catch(x){kp.textContent=url}});
s.parentNode.parentNode.hidden=true;document.getElementById('deel').hidden=false;document.querySelector('h1').textContent='Je lijst staat klaar';document.querySelector('.uitleg').textContent='Stuur hem naar je familie. Zij zien wat je wilt en wie wat koopt.'}).catch(function(){s.disabled=false;tekst()})});tekst()})();</script></body></html>`;
}

export function lijstPagina({ lijst, items = [], look = '', code = '' }) {
  const per = Object.fromEntries(items.map(i => [i.id, i])); const rijen = (lijst.pids || []).map(p => per[p]).filter(Boolean);
  const titel = 'Verlanglijst' + (lijst.naam ? ' van ' + lijst.naam : '') + ' voor ' + (lijst.feest || 'Sinterklaas');
  const rij = i => { const al = !!(lijst.gekocht && lijst.gekocht[i.id]);
    return `<div class="rij" data-p="${esc(i.id)}"><img src="${esc(i.img)}" alt="" loading="lazy" width="96" height="96"><div><p class="t">${esc(i.t)}</p><b>${esc(eur(prijsVan(i)))}</b>
<p class="al"${al ? '' : ' hidden'}>Iemand koopt dit al</p><div class="k"${al ? ' data-al="1"' : ''}><a class="koop" href="/api/shop?op=org&k=wa&p=${encodeURIComponent(i.id)}&c=vl${esc(code)}">Koop dit cadeau</a><button type="button" class="ik">Ik koop dit</button></div></div></div>`; };
  return kop(look, titel) + `<main class="wrap">
<h1>${esc(titel)}</h1>
<p class="uitleg">Kies een cadeau en tik op Ik koop dit, dan koopt niemand hetzelfde. ${esc(lijst.naam || 'De maker')} ziet niet wat er gekocht wordt.</p>
${rijen.map(rij).join('')}
<a class="rand" href="/verlanglijst?van=${esc(code)}">Maak je eigen verlanglijst</a>
</main>${voet}
<script>(function(){var C=${JSON.stringify(code)},eigen=false;try{eigen=!!localStorage.getItem('vl-eigen-'+C)}catch(x){}
if(eigen){document.querySelectorAll('.al').forEach(function(e){e.hidden=true});document.querySelectorAll('.ik').forEach(function(e){e.hidden=true});document.querySelector('.uitleg').textContent='Dit is jouw lijst. Stuur de link naar je familie; wat zij kopen zie jij niet.'}
document.querySelectorAll('.ik').forEach(function(k){k.addEventListener('click',function(){var r=k.closest('.rij'),p=r.getAttribute('data-p');k.disabled=true;fetch('/api/shop?op=lijst&l='+C+'&koop='+encodeURIComponent(p),{method:'POST'}).then(function(){r.querySelector('.al').hidden=false;k.textContent='Genoteerd'}).catch(function(){k.disabled=false})})})})();</script></body></html>`;
}
