/* Keuzelijsten in de outname.now-look (Henkjan 20 okt 2026: "lijsten moeten ook strak getrokken worden, overall").
   Elke gewone <select> op een keuzehulp krijgt een eigen knop met een strakke lijst eronder (op de telefoon een paneel van onderen).
   De echte <select> blijft onzichtbaar bestaan: formulieren, bestaande change-luisteraars, meting en validatie werken ongewijzigd.
   Uitzetten per lijst: data-native op de select of een omhullend element. Geladen via /api/keuze-updates?op=lijst
   (door de tracker van vindbaarheid en door de voet van de Curaçao-pagina's). */
const ACC = 'var(--acc,var(--accent,#2B47C4))';
const ZACHT = 'var(--acc-2,var(--accent-soft,#EEF1FC))';
const PANEEL = 'var(--panel,var(--bg,#fff))';
const INKT = 'var(--ink,#111113)';
const LIJN = 'var(--line,#E5E7EB)';

export const LIJST_CSS = `.kl{position:relative;display:block;width:100%;min-width:0}
.kl-native{position:absolute!important;left:0!important;top:0!important;width:100%!important;height:100%!important;opacity:0!important;pointer-events:none!important;margin:0!important}
.kl-knop{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;min-height:50px;padding:11px 14px 11px 16px;border:1px solid var(--line-strong,#B9BFC7);border-radius:9px;background:${PANEEL};color:${INKT};font-family:inherit;font-size:18px;line-height:1.35;font-weight:400;text-align:left;cursor:pointer;transition:border-color .15s,box-shadow .15s;-webkit-tap-highlight-color:transparent}
.kl-waarde{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kl-knop svg{flex:none;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s ease}
.kl-knop:hover{border-color:${ACC}}
.kl-knop:focus-visible,.kl-knop[aria-expanded=true]{border-color:${ACC};box-shadow:0 0 0 3px ${ZACHT}}
.kl-knop[aria-expanded=true] svg{transform:rotate(180deg)}
.kl-knop:disabled{opacity:.5;cursor:default}
.kl-leeg .kl-waarde{opacity:.6}
.field:has(>.kl){display:flex;flex-direction:column}.field>.kl{margin-top:auto}
.kl-paneel{position:absolute;z-index:1000;box-sizing:border-box;background:${PANEEL};color:${INKT};border:1px solid ${LIJN};border-radius:14px;box-shadow:0 14px 36px rgba(17,17,19,.14),0 2px 6px rgba(17,17,19,.06);padding:6px;max-height:min(360px,60vh);overflow-y:auto;overscroll-behavior:contain;font-size:18px;line-height:1.35;outline:none;animation:kl-in .14s ease}
.kl-optie{display:flex;align-items:center;gap:12px;min-height:46px;padding:10px 12px;border-radius:8px;cursor:pointer;box-sizing:border-box}
.kl-optie span{flex:1;min-width:0}
.kl-optie svg{flex:none;width:18px;height:18px;fill:none;stroke:${ACC};stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;visibility:hidden}
.kl-optie[aria-selected=true]{font-weight:600}
.kl-optie[aria-selected=true] svg{visibility:visible}
.kl-optie.is-actief{background:${ZACHT}}
.kl-optie[aria-disabled=true]{opacity:.45;cursor:default;background:none}
.kl-groep{padding:12px 12px 4px;font-size:16px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.7}
.kl-kop{margin:0 0 4px;padding:6px 12px 12px;font-size:16px;font-weight:600;border-bottom:1px solid ${LIJN}}
.kl-blad{position:fixed;left:0;right:0;bottom:0;top:auto!important;width:auto!important;max-height:72vh;border-radius:18px 18px 0 0;border-bottom:0;padding:10px 10px calc(14px + env(safe-area-inset-bottom));animation:kl-op .2s ease}
.kl-blad:before{content:"";display:block;width:40px;height:4px;border-radius:2px;background:${LIJN};margin:0 auto 10px}
.kl-blad .kl-optie{min-height:52px}
.kl-achter{position:fixed;inset:0;z-index:999;background:rgba(17,17,19,.32);animation:kl-vaag .2s ease}
@keyframes kl-in{from{opacity:0;transform:translateY(-4px)}}
@keyframes kl-op{from{transform:translateY(100%)}}
@keyframes kl-vaag{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.kl-paneel,.kl-achter,.kl-knop svg{animation:none;transition:none}}`;

/* Terugval zonder script (en vóór het script draait): de gewone select al in dezelfde vorm, met een eigen pijltje. */
export const SELECT_TERUGVAL = `select:not([multiple]):not([size]){-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23111113' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;background-size:18px;padding-right:44px!important}`;

export const LIJST_JS = String.raw`(()=>{if(window.__kl)return;window.__kl=1;
const ST=${JSON.stringify(LIJST_CSS)};
const CHEV='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const VINK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const mq=window.matchMedia('(max-width:640px)');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let n=0,open=null,zoek='',zoekT=0;
function stijl(){if(document.getElementById('kl-css'))return;const s=document.createElement('style');s.id='kl-css';s.textContent=ST;document.head.append(s)}
function labelVan(sel){let l=null;if(sel.id){try{l=document.querySelector('label[for="'+CSS.escape(sel.id)+'"]')}catch(e){}}return l||sel.closest('label')}
function tekst(o){return o?(o.label||o.text||''):''}
function sync(k){const o=k.sel.options[k.sel.selectedIndex];k.v.textContent=tekst(o);k.wrap.classList.toggle('kl-leeg',!o||o.disabled||o.hidden);k.b.disabled=k.sel.disabled}
function kies(k,o){if(o&&!o.selected){k.sel.selectedIndex=o.index;k.sel.dispatchEvent(new Event('input',{bubbles:true}));k.sel.dispatchEvent(new Event('change',{bubbles:true}))}sync(k)}
function sluit(focus){if(!open)return;const k=open;open=null;k.p.remove();if(k.a)k.a.remove();k.b.setAttribute('aria-expanded','false');k.b.removeAttribute('aria-controls');if(focus)k.b.focus({preventScroll:true})}
function plaats(k){const p=k.p;if(p.classList.contains('kl-blad'))return;const r=k.b.getBoundingClientRect(),vw=document.documentElement.clientWidth;const w=Math.min(Math.max(r.width,220),vw-16);p.style.width=w+'px';
let x=r.left;if(x+w>vw-8)x=Math.max(8,vw-8-w);p.style.left=(x+window.scrollX)+'px';const h=p.offsetHeight,onder=window.innerHeight-r.bottom,boven=r.top;
p.style.top=((onder<h+12&&boven>onder)?(r.top+window.scrollY-h-6):(r.bottom+window.scrollY+6))+'px'}
function actief(k,d){k.items.forEach(x=>x.classList.toggle('is-actief',x===d));if(d){k.p.setAttribute('aria-activedescendant',d.id);d.scrollIntoView({block:'nearest'})}}
function bruikbaar(k){return k.items.filter(d=>d.getAttribute('aria-disabled')!=='true')}
function opent(k){if(open===k){sluit(true);return}sluit(false);if(k.sel.disabled)return;
const blad=mq.matches,p=document.createElement('div');p.className='kl-paneel'+(blad?' kl-blad':'');p.id=k.id+'-lijst';p.tabIndex=-1;p.setAttribute('role','listbox');if(k.lab)p.setAttribute('aria-labelledby',k.lab.id);
let html='';if(blad&&k.lab)html+='<p class="kl-kop">'+esc(k.lab.textContent.trim())+'</p>';
const items=[];let i=0;const voeg=(o,gd)=>{if(o.hidden)return;const id=k.id+'-o'+(i++);html+='<div class="kl-optie" role="option" id="'+id+'" data-i="'+o.index+'" aria-selected="'+(o.selected?'true':'false')+'"'+((o.disabled||gd)?' aria-disabled="true"':'')+'><span>'+esc(tekst(o))+'</span>'+VINK+'</div>'};
for(const el of k.sel.children){if(el.tagName==='OPTGROUP'){html+='<div class="kl-groep" role="presentation">'+esc(el.label)+'</div>';for(const o of el.children)if(o.tagName==='OPTION')voeg(o,el.disabled)}else if(el.tagName==='OPTION')voeg(el,false)}
p.innerHTML=html;k.p=p;k.items=[...p.querySelectorAll('.kl-optie')];
if(blad){const a=document.createElement('div');a.className='kl-achter';a.addEventListener('click',()=>sluit(true));document.body.append(a);k.a=a}else k.a=null;
document.body.append(p);open=k;k.b.setAttribute('aria-expanded','true');k.b.setAttribute('aria-controls',p.id);plaats(k);
actief(k,k.items.find(d=>d.getAttribute('aria-selected')==='true')||bruikbaar(k)[0]);p.focus({preventScroll:true});
p.addEventListener('click',e=>{const d=e.target.closest('.kl-optie');if(!d||d.getAttribute('aria-disabled')==='true')return;kies(k,k.sel.options[+d.dataset.i]);sluit(true)});
p.addEventListener('mousemove',e=>{const d=e.target.closest('.kl-optie');if(d&&!d.classList.contains('is-actief')&&d.getAttribute('aria-disabled')!=='true')actief(k,d)});
p.addEventListener('keydown',e=>{const lijst=bruikbaar(k),nu=lijst.indexOf(k.items.find(d=>d.classList.contains('is-actief')));
if(e.key==='ArrowDown'){e.preventDefault();actief(k,lijst[Math.min(lijst.length-1,nu+1)])}
else if(e.key==='ArrowUp'){e.preventDefault();actief(k,lijst[Math.max(0,nu-1)])}
else if(e.key==='Home'||e.key==='PageUp'){e.preventDefault();actief(k,lijst[0])}
else if(e.key==='End'||e.key==='PageDown'){e.preventDefault();actief(k,lijst[lijst.length-1])}
else if(e.key==='Enter'||e.key===' '){e.preventDefault();const d=lijst[nu];if(d)kies(k,k.sel.options[+d.dataset.i]);sluit(true)}
else if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();sluit(true)}
else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){clearTimeout(zoekT);zoek+=e.key.toLowerCase();zoekT=setTimeout(()=>zoek='',700);const start=zoek.length===1?nu+1:nu;const rij=lijst.slice(start).concat(lijst.slice(0,start));const d=rij.find(x=>x.textContent.trim().toLowerCase().startsWith(zoek));if(d)actief(k,d)}})}
function maak(sel){if(sel.__k||sel.multiple||sel.size>1||sel.closest('[data-native]'))return;
const k={sel,id:'kl'+(++n)};sel.__k=k;const cs=sel.offsetParent?sel.getBoundingClientRect():null,ouder=sel.parentNode;
const wrap=document.createElement('div');wrap.className='kl';const b=document.createElement('button');b.type='button';b.className='kl-knop';b.setAttribute('aria-haspopup','listbox');b.setAttribute('aria-expanded','false');
b.innerHTML='<span class="kl-waarde" id="'+k.id+'-w"></span>'+CHEV;k.v=b.firstChild;k.b=b;k.wrap=wrap;
const lab=labelVan(sel);if(lab){if(!lab.id)lab.id=k.id+'-l';k.lab=lab;b.setAttribute('aria-labelledby',lab.id+' '+k.id+'-w')}else if(sel.getAttribute('aria-label'))b.setAttribute('aria-label',sel.getAttribute('aria-label'));
if(cs&&ouder.clientWidth&&cs.width<ouder.clientWidth*.85&&getComputedStyle(sel).display.indexOf('inline')===0){wrap.style.display='inline-block';wrap.style.width='auto';wrap.style.minWidth=Math.round(cs.width)+'px';wrap.style.maxWidth='100%';wrap.style.verticalAlign='middle'}
if(sel.style.flex)wrap.style.flex=sel.style.flex;if(sel.style.maxWidth)wrap.style.maxWidth=sel.style.maxWidth;
ouder.insertBefore(wrap,sel);wrap.append(sel,b);sel.classList.add('kl-native');sel.tabIndex=-1;sel.setAttribute('aria-hidden','true');
['value','selectedIndex'].forEach(pr=>{const d=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,pr);if(!d||!d.set)return;try{Object.defineProperty(sel,pr,{configurable:true,get(){return d.get.call(this)},set(x){d.set.call(this,x);sync(k)}})}catch(e){}});
sel.addEventListener('change',()=>sync(k));if(sel.form)sel.form.addEventListener('reset',()=>setTimeout(()=>sync(k)));
new MutationObserver(()=>{sync(k);if(open===k)sluit(false)}).observe(sel,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','label']});
b.addEventListener('click',()=>opent(k));
b.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'||(e.key===' '&&open!==k)||(e.key==='Enter'&&open!==k)){e.preventDefault();opent(k)}});
sync(k)}
function alles(root){if(root.matches&&root.matches('select'))maak(root);else if(root.querySelectorAll)root.querySelectorAll('select').forEach(maak)}
function start(){stijl();alles(document);
new MutationObserver(m=>{for(const r of m)for(const nd of r.addedNodes)if(nd.nodeType===1&&!(nd.classList&&(nd.classList.contains('kl')||nd.classList.contains('kl-paneel'))))alles(nd)}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('pointerdown',e=>{if(open&&!open.p.contains(e.target)&&!open.b.contains(e.target)&&!(open.a&&open.a.contains(e.target)))sluit(false)},true);
document.addEventListener('click',e=>{const l=e.target.closest&&e.target.closest('label[for]');if(!l)return;const s=document.getElementById(l.htmlFor);if(s&&s.__k){e.preventDefault();s.__k.b.focus()}});
window.addEventListener('resize',()=>{if(open)plaats(open)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start()})();`;
