// Verlanglijst om door te sturen (Henkjan 27 nov 2026: "Voer alles door", voorstel 2 van de 10 organische voorstellen).
// Iemand kiest Kadoly-producten voor zijn verlanglijst (Sinterklaas tot en met 5 december, daarna Kerst) en stuurt de lijst met één tik via
// WhatsApp naar familie. Wie de lijst opent, koopt via Clickmind (/o?k=wa&p=<pid>&c=vl<code>) en kan aangeven dat hij iets koopt, zodat
// niemand hetzelfde cadeau dubbel koopt; de maker ziet dat niet (verrassing blijft). Onderaan: "Maak je eigen verlanglijst" (de lijst
// verspreidt zich zelf). Trend achter dit idee: YouTube-video's met Wishlist plus Christmas/Santa in de titel ruim 90 mln weergaven
// (sep-dec 2025, Google Holiday Shopping Trends Report 2026; Videomind op=trend).
// 27 nov 2026 (Henkjan: "Ze moeten toch ook kunnen zoeken id verlanglijst zet er zoek en categorieen bij EN ook de chat natuurlijk"):
// zoekveld (eerst in de geladen producten, bij weinig treffers in de hele winkel via /api/shop/lijst?zoek=), categorieën als één rij pills,
// en de lerende chat van Kadoly (lib/kzux.js, site kadoly, slug verlanglijst) onderaan: elk product dat de chat noemt zet je met één tik op je lijst.
// Niets gevonden bij zoeken: de zoekvraag gaat met één tik naar de chat. Je keuze blijft bewaard op dit toestel tot je de lijst verstuurt.
// Opslag: kd:vl:<code> { naam, feest, pids, at, van, gekocht: { pid: tijd } } 120 dagen; tellers sh-vl-maak, sh-vl-view, sh-vl-koop, sh-vl-b-<ev>.
// Paden: go.kadoly.com/verlanglijst (maken) en go.kadoly.com/verlanglijst/<code> (bekijken), via op=lijst in fn/shop.js. Alle aanroepen vanuit de
// pagina gaan via /api/shop/lijst en /o: go.kadoly.com stuurt andere paden door naar kadoly.com (vercel.json).
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = x => Number(x) || 0;
const eur = n => '€ ' + num(n).toFixed(2).replace('.', ',');
export const VL_MAX = 12;
export function feestNu(t = new Date()) { return t.getUTCMonth() === 10 || (t.getUTCMonth() === 11 && t.getUTCDate() < 6) ? 'Sinterklaas' : 'Kerst'; }
export const prijsVan = i => Math.round((num(i.p) + (num(i.vk) || 0)) * 100) / 100;
const CATNAAM = { wonen: 'Wonen', hobby: 'Hobby', kids: 'Kinderen', tech: 'Tech', beauty: 'Beauty', mode: 'Mode', keuken: 'Keuken', cadeaus: 'Cadeaus', dieren: 'Dieren', buiten: 'Buiten en sport', eten: 'Eten en drinken', overig: 'Overig' };
export const catVan = i => { const c = String((i && i.c) || 'overig').toLowerCase().trim(); return c === 'sport' || c === 'tuin' ? 'buiten' : CATNAAM[c] ? c : 'overig'; };
const woorden = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
const basisOk = i => i && i.id && i.img && i.t && i.vr !== false;

// Keuze voor de maakpagina: leverbaar, met foto, marge vanaf € 5, all-in € 10 tot € 80; trendproducten eerst, dan marge; hooguit 2 per merk.
export function kiesProducten(items, trendPids = [], n = 120) {
  const trend = new Set(trendPids || []), perMerk = {};
  const ok = (items || []).filter(i => basisOk(i) && num(i.mg) >= 5 && prijsVan(i) >= 10 && prijsVan(i) <= 80);
  ok.sort((a, b) => (trend.has(b.id) ? 100 : 0) + num(b.mg) - (trend.has(a.id) ? 100 : 0) - num(a.mg));
  const uit = []; for (const i of ok) { const m = String(i.b || '-'); if ((perMerk[m] || 0) >= 2) continue; perMerk[m] = (perMerk[m] || 0) + 1; uit.push(i); if (uit.length >= n) break; }
  return uit;
}
// Zoeken in de hele winkel: elk zoekwoord moet in titel, merk of soort staan; titel telt zwaarder. Prijs all-in € 5 tot € 250.
export function zoekProducten(items, q, n = 24) {
  const qw = woorden(q).slice(0, 6); if (!qw.length) return [];
  const uit = [];
  for (const i of items || []) {
    if (!basisOk(i)) continue; const pr = prijsVan(i); if (pr < 5 || pr > 250) continue;
    const tw = woorden(i.t), rest = woorden([i.b, i.c, i.s].filter(Boolean).join(' ')), past = x => w => x === w || (w.length >= 4 && x.includes(w)); let s = 0, alle = true;
    for (const w of qw) { const inT = tw.some(x => past(x)(w)), inR = rest.some(x => past(x)(w)); if (inT) s += 3; else if (inR) s += 1; else alle = false; }
    if (alle && s) uit.push({ i, s });
  }
  uit.sort((a, b) => b.s - a.s || num(b.i.mg) - num(a.i.mg));
  return uit.slice(0, n).map(x => kaartData(x.i));
}
export const kaartData = i => ({ id: i.id, t: i.t, img: i.img, p: prijsVan(i), c: catVan(i) });
export function schoonLijst(b, items) {
  const bekend = new Set((items || []).map(i => i.id)); const pids = [...new Set((Array.isArray(b && b.pids) ? b.pids : []).map(String))].filter(p => bekend.has(p)).slice(0, VL_MAX);
  const naam = String((b && b.naam) || '').replace(/[<>"]/g, '').trim().slice(0, 24);
  const van = String((b && b.van) || '').replace(/[^a-z0-9]/gi, '').slice(0, 8);
  return { pids, naam, van };
}
const CSS = `.wrap{max-width:34rem}.vl{padding:10px 0 110px}h1{font-size:1.75rem;line-height:1.15;margin:12px 0 8px}.uitleg{margin:0 0 14px;font-size:1.0625rem;color:#000}
.naam,.zk{font:inherit;font-size:1.0625rem;padding:13px 14px;border:2px solid #000;border-radius:12px;width:100%;box-sizing:border-box;margin:0 0 12px;color:#000;background:#fff}
.zk{margin:0 0 10px;-webkit-appearance:none;appearance:none}
.cats{display:flex;gap:8px;overflow-x:auto;padding:2px 0 12px;margin:0 0 4px;scrollbar-width:none}.cats::-webkit-scrollbar{display:none}
.cats button{flex:0 0 auto;font:inherit;font-size:.9375rem;font-weight:700;padding:9px 14px;border-radius:999px;border:2px solid #000;background:#fff;color:#000;cursor:pointer;white-space:nowrap}.cats button.aan{background:#000;color:#fff}
.pg{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pc{position:relative;border:2px solid #000;border-radius:12px;overflow:hidden;background:#fff;text-align:left;padding:0;font:inherit;color:#000;cursor:pointer}
.pc img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;background:#fff}.pt{display:block;padding:8px 10px 0;font-size:.9375rem;font-weight:600;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pp{display:block;padding:4px 10px 10px;font-weight:800}
.pc .v{position:absolute;top:8px;right:8px;width:34px;height:34px;border-radius:50%;background:#fff;border:2px solid #000;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.25rem}.pc.aan{outline:4px solid #000}.pc.aan .v{background:#000;color:#fff}
.leeg{border:2px solid #000;border-radius:12px;padding:14px;margin:0 0 12px}.leeg p{margin:0 0 10px;font-weight:700}
.vchat{margin:22px 0 0}.vchat .kx{margin:0}
.kx-pk.vl-add{font:inherit;width:100%;text-align:left;cursor:pointer;background:#fff;border:0;border-top:1px solid #111113}.kx-pk.vl-add:first-child{border-top:0}.kx-pk.vl-add i{font-style:normal;font-weight:800;font-size:1.25rem}.kx-pk.vl-add.aan{background:#000;color:#fff!important}.kx-pk.vl-add.aan small{color:#fff}
.balk{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:2px solid #000;padding:12px 16px;padding-bottom:max(12px,env(safe-area-inset-bottom,0px))}.balk .wrap{display:flex;gap:10px}
.knop{display:block;flex:1;text-align:center;font:inherit;font-size:1.125rem;font-weight:800;padding:15px;border:0;border-radius:12px;background:#000;color:#fff;text-decoration:none;cursor:pointer}.knop[disabled]{background:#fff;color:#000;box-shadow:inset 0 0 0 2px #000;cursor:default}
.knop.wa{background:#25D366;color:#000}.rand{display:block;text-align:center;margin:12px 0 0;padding:14px;border:2px solid #000;border-radius:12px;color:#000;font-weight:800;text-decoration:none;background:#fff;font-size:1rem;width:100%;box-sizing:border-box;cursor:pointer}
.rij{display:grid;grid-template-columns:96px 1fr;gap:12px;border:2px solid #000;border-radius:12px;padding:10px;margin:0 0 10px;background:#fff}.rij img{width:96px;height:96px;object-fit:cover;border-radius:8px}
.rij .t{font-weight:700;line-height:1.25;margin:0 0 4px}.rij .k{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}.rij a.koop{background:#000;color:#fff;font-weight:800;padding:10px 14px;border-radius:10px;text-decoration:none}
.k[data-al]{display:none}.rij button{font:inherit;font-weight:700;padding:10px 12px;border-radius:10px;border:2px solid #000;background:#fff;color:#000;cursor:pointer}.al{font-weight:800}.stand{font-weight:800;margin:0 0 12px}[hidden]{display:none!important}.klein{font-size:.875rem;color:#000}`;
const kop = (look, titel) => `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>${esc(titel)} | Kadoly</title><style>${look}${CSS}</style><script src="/cm.js" data-site="kadolylijst" async></script></head><body><header class="topbar"><div class="wrap"><span class="mark">Kadoly</span></div></header>`;
const voet = `<footer><div class="wrap"><p class="klein">Kadoly by AdsFair B.V. · KvK 60126035 · Gouda · <a href="https://kadoly.com/shop/privacy">Privacy</a></p></div></footer>`;

// chat: HTML van kzuxBlok (lib/kzux.js) met site kadoly; de pagina zet de productkaarten uit de chat om in "op mijn lijst"-knoppen
export function maakPagina({ items = [], look = '', van = '', feest = feestNu(), start = [], chat = '' }) {
  const kaart = i => `<button type="button" class="pc" data-p="${esc(i.id)}" data-c="${esc(catVan(i))}" data-z="${esc(woorden([i.t, i.b, i.c, i.s].filter(Boolean).join(' ')).join(' '))}"><img src="${esc(i.img)}" alt="" loading="lazy" width="300" height="300"><span class="v" aria-hidden="true">+</span><span class="pt">${esc(i.t)}</span><span class="pp">${esc(eur(prijsVan(i)))}</span></button>`;
  const tel = {}; for (const i of items) { const c = catVan(i); tel[c] = (tel[c] || 0) + 1; }
  const cats = Object.entries(tel).filter(([c, n]) => n >= 3 && c !== 'overig').sort((a, b) => b[1] - a[1]).map(([c]) => c);
  return kop(look, 'Maak je verlanglijst voor ' + feest) + `<div class="wrap vl" role="main">
<h1>Maak je verlanglijst voor ${esc(feest)}</h1>
<p class="uitleg">Tik op wat je graag wilt en stuur je lijst met één tik naar je familie. Zij zien wie wat koopt, jij niet: de verrassing blijft.</p>
<input class="naam" id="n" placeholder="Je voornaam (zo weten ze van wie de lijst is)" maxlength="24" autocomplete="given-name">
<input class="zk" id="zk" type="search" enterkeyhint="search" placeholder="Zoek, bijvoorbeeld kaars, lamp of koken" maxlength="60" autocomplete="off" aria-label="Zoek in de winkel">
${cats.length ? `<div class="cats" id="cats"><button type="button" class="aan" data-c="">Alles</button>${cats.map(c => `<button type="button" data-c="${esc(c)}">${esc(CATNAAM[c])}</button>`).join('')}</div>` : ''}
<div class="leeg" id="leeg" hidden><p id="leegt"></p><button type="button" class="knop" id="vraagk">Vraag het Kadoly</button></div>
<div class="pg" id="pg">${items.map(kaart).join('')}</div>
${chat ? `<div class="vchat" id="vchat">${chat}</div>` : ''}
</div>
<div class="balk" id="kies"><div class="wrap"><button class="knop" id="s" disabled>Kies wat je wilt</button></div></div>
<div class="balk" id="deel" hidden><div class="wrap" style="display:block"><a class="knop wa" id="wa" href="#">Stuur via WhatsApp</a><button type="button" class="rand" id="kop">Kopieer de link</button></div></div>
${voet}
<script>(function(){var gekozen=[],START=${JSON.stringify(start || [])},MAX=${VL_MAX},VAN=${JSON.stringify(van)},s=document.getElementById('s'),pg=document.getElementById('pg'),zk=document.getElementById('zk'),leeg=document.getElementById('leeg'),CAT='',DK='vl-concept',zt=0,zq='';
function b(e){try{navigator.sendBeacon('/api/shop/lijst?b='+e,'')}catch(x){}}
function esc(t){return String(t).replace(/[&<>"]/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]})}
function eur(n){return '€ '+Number(n||0).toFixed(2).replace('.',',')}
function w(t){return String(t||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').split(/\\s+/).filter(function(x){return x.length>=2})}
function bewaar(){try{localStorage.setItem(DK,JSON.stringify({p:gekozen,n:document.getElementById('n').value,t:Date.now()}))}catch(x){}}
function tekst(){s.disabled=!gekozen.length;s.textContent=gekozen.length?'Stuur je lijst ('+gekozen.length+')':'Kies wat je wilt';[].forEach.call(document.querySelectorAll('.vl-add'),function(k){var on=gekozen.indexOf(k.getAttribute('data-p'))>=0;k.classList.toggle('aan',on);var i=k.querySelector('i');if(i)i.textContent=on?'✓':'+'});bewaar()}
function zetKaart(k,on){k.classList.toggle('aan',on);k.querySelector('.v').textContent=on?'✓':'+'}
function wissel(p,aan){var i=gekozen.indexOf(p),k=pg.querySelector('.pc[data-p="'+p+'"]');if(i>=0&&aan!==true){gekozen.splice(i,1);if(k)zetKaart(k,false)}else if(i<0&&aan!==false){if(gekozen.length>=MAX){s.textContent='Hooguit '+MAX+' cadeaus';setTimeout(tekst,1500);return false}gekozen.push(p);if(k)zetKaart(k,true)}tekst();return true}
function kaart(x,voor){var k=document.createElement('button');k.type='button';k.className='pc';k.setAttribute('data-p',x.id);k.setAttribute('data-c',x.c||'');k.setAttribute('data-z',w(x.t).join(' '));k.innerHTML='<img src="'+esc(x.img)+'" alt="" loading="lazy" width="300" height="300"><span class="v" aria-hidden="true">+</span><span class="pt">'+esc(x.t)+'</span><span class="pp">'+esc(x.pt||eur(x.p))+'</span>';if(voor)pg.insertBefore(k,pg.firstChild);else pg.appendChild(k);if(gekozen.indexOf(x.id)>=0)zetKaart(k,true);return k}
pg.addEventListener('click',function(e){var k=e.target.closest('.pc');if(k)wissel(k.getAttribute('data-p'))});
function filter(){var qw=w(zk.value),n=0;[].forEach.call(pg.querySelectorAll('.pc'),function(k){var z=k.getAttribute('data-z')||'',ok=(!CAT||k.getAttribute('data-c')===CAT)&&qw.every(function(x){return x.length>=4?z.indexOf(x)>=0:(' '+z).indexOf(' '+x)>=0});k.hidden=!ok;if(ok)n++});return n}
function toonLeeg(n){var q=zk.value.trim();leeg.hidden=!(n===0&&q.length>=2);if(!leeg.hidden)document.getElementById('leegt').textContent='Niets gevonden voor "'+q+'". Vraag het Kadoly, die zoekt mee.'}
function zoek(){var q=zk.value.trim(),n=filter();toonLeeg(n);clearTimeout(zt);if(q.length<3||n>=4||q===zq)return;zt=setTimeout(function(){zq=q;b('zoek');fetch('/api/shop/lijst?zoek='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(j){if(!j||!j.ok||zk.value.trim()!==q)return;(j.items||[]).forEach(function(x){if(!pg.querySelector('.pc[data-p="'+x.id+'"]'))kaart(x)});toonLeeg(filter())}).catch(function(){})},350)}
zk.addEventListener('input',zoek);zk.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();zk.blur()}});
var cats=document.getElementById('cats');if(cats)cats.addEventListener('click',function(e){var c=e.target.closest('button');if(!c)return;CAT=c.getAttribute('data-c')||'';[].forEach.call(cats.children,function(x){x.classList.toggle('aan',x===c)});b('cat');toonLeeg(filter())});
document.getElementById('vraagk').addEventListener('click',function(){var q=zk.value.trim(),ch=document.getElementById('vchat');b('chat');if(ch)ch.scrollIntoView({behavior:'smooth',block:'start'});try{if(window.__kx&&q)window.__kx.vraag('Ik zoek '+q+' voor mijn verlanglijst')}catch(x){}});
window.__kxNa=function(el,j){[].forEach.call(el.querySelectorAll('a.kx-pk'),function(a){var m=(a.getAttribute('href')||'').match(/\\/naar\\/([^?&#]+)/);if(!m)return;var p=decodeURIComponent(m[1]),x=(j.producten||[]).filter(function(y){return y.u===a.getAttribute('href')})[0]||{};var k=document.createElement('button');k.type='button';k.className='kx-pk vl-add';k.setAttribute('data-p',p);k.innerHTML=a.innerHTML;var i=k.querySelector('i');if(i){i.textContent='+';i.setAttribute('aria-label','Op mijn lijst')}k.addEventListener('click',function(){if(!pg.querySelector('.pc[data-p="'+p+'"]'))kaart({id:p,t:x.n||'',img:x.i||'',pt:String(x.p||'').split(' incl')[0],c:''},true);if(wissel(p)!==false)b('chatadd')});a.parentNode.replaceChild(k,a)});tekst()};
s.addEventListener('click',function(){if(!gekozen.length)return;s.disabled=true;s.textContent='Even geduld...';fetch('/api/shop/lijst',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({pids:gekozen,naam:document.getElementById('n').value,van:VAN})}).then(function(r){return r.json()}).then(function(j){if(!j||!j.ok)throw 0;try{localStorage.setItem('vl-eigen-'+j.code,'1');localStorage.removeItem(DK)}catch(x){}
var url=location.origin+'/verlanglijst/'+j.code,t='Mijn verlanglijst voor '+j.feest+': '+url;document.getElementById('wa').href='https://wa.me/?text='+encodeURIComponent(t);var kp=document.getElementById('kop');kp.addEventListener('click',function(){try{navigator.clipboard.writeText(url).then(function(){kp.textContent='Gekopieerd'},function(){kp.textContent=url})}catch(x){kp.textContent=url}});
document.getElementById('kies').hidden=true;document.getElementById('deel').hidden=false;document.querySelector('h1').textContent='Je lijst staat klaar';document.querySelector('.uitleg').textContent='Stuur hem naar je familie. Zij zien wat je wilt en wie wat koopt.';window.scrollTo({top:0,behavior:'smooth'})}).catch(function(){s.disabled=false;tekst()})});
var oud=null;try{oud=JSON.parse(localStorage.getItem(DK)||'null')}catch(x){}if(oud&&Date.now()-oud.t<14*864e5){if(oud.n)document.getElementById('n').value=oud.n;(oud.p||[]).forEach(function(p){if(pg.querySelector('.pc[data-p="'+p+'"]'))wissel(p,true)})}
START.forEach(function(p){wissel(p,true)});document.getElementById('n').addEventListener('input',bewaar);tekst()})();</script></body></html>`;
}

export function lijstPagina({ lijst, items = [], look = '', code = '' }) {
  const per = Object.fromEntries(items.map(i => [i.id, i])); const rijen = (lijst.pids || []).map(p => per[p]).filter(Boolean);
  const titel = 'Verlanglijst' + (lijst.naam ? ' van ' + lijst.naam : '') + ' voor ' + (lijst.feest || 'Sinterklaas');
  const nGekocht = rijen.filter(i => lijst.gekocht && lijst.gekocht[i.id]).length;
  const rij = i => { const al = !!(lijst.gekocht && lijst.gekocht[i.id]);
    return `<div class="rij" data-p="${esc(i.id)}"><img src="${esc(i.img)}" alt="" loading="lazy" width="96" height="96"><div><p class="t">${esc(i.t)}</p><b>${esc(eur(prijsVan(i)))}</b>
<p class="al"${al ? '' : ' hidden'}>Iemand koopt dit al</p><div class="k"${al ? ' data-al="1"' : ''}><a class="koop" href="/o?k=wa&amp;p=${encodeURIComponent(i.id)}&amp;c=vl${esc(code)}">Koop dit cadeau</a><button type="button" class="ik">Ik koop dit</button></div></div></div>`; };
  return kop(look, titel) + `<div class="wrap vl" role="main">
<h1>${esc(titel)}</h1>
<p class="uitleg">Kies een cadeau en tik op Ik koop dit, dan koopt niemand hetzelfde. ${esc(lijst.naam || 'De maker')} ziet niet wat er gekocht wordt.</p>
<p class="stand" id="stand"${nGekocht ? '' : ' hidden'}>${nGekocht} van ${rijen.length} ${rijen.length === 1 ? 'cadeau is' : 'cadeaus zijn'} al gekozen</p>
<div id="eigen" hidden><a class="knop wa" id="wa" href="#">Stuur je lijst via WhatsApp</a><button type="button" class="rand" id="kop">Kopieer de link</button><p></p></div>
${rijen.map(rij).join('')}
<a class="rand" href="/verlanglijst?van=${esc(code)}">Maak je eigen verlanglijst</a>
</div>${voet}
<script>(function(){var C=${JSON.stringify(code)},eigen=false;try{eigen=!!localStorage.getItem('vl-eigen-'+C)}catch(x){}
if(eigen){document.querySelectorAll('.al').forEach(function(e){e.hidden=true});document.querySelectorAll('.ik').forEach(function(e){e.hidden=true});document.getElementById('stand').hidden=true;document.querySelector('.uitleg').textContent='Dit is jouw lijst. Stuur de link naar je familie; wat zij kopen zie jij niet.';
var url=location.origin+location.pathname,e=document.getElementById('eigen');e.hidden=false;document.getElementById('wa').href='https://wa.me/?text='+encodeURIComponent('Mijn verlanglijst: '+url);var kp=document.getElementById('kop');kp.addEventListener('click',function(){try{navigator.clipboard.writeText(url).then(function(){kp.textContent='Gekopieerd'},function(){kp.textContent=url})}catch(x){kp.textContent=url}})}
document.querySelectorAll('.ik').forEach(function(k){k.addEventListener('click',function(){var r=k.closest('.rij'),p=r.getAttribute('data-p');k.disabled=true;fetch('/api/shop/lijst?l='+C+'&koop='+encodeURIComponent(p),{method:'POST'}).then(function(){r.querySelector('.al').hidden=false;k.textContent='Genoteerd'}).catch(function(){k.disabled=false})})})})();</script></body></html>`;
}
