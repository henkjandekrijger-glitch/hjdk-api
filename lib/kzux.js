// Nieuwe bovenkant voor elke keuzehulp (keuzehulp.best, whichtobuy.best, kaufberater.best), lerend.
// Henkjan 15 nov 2026: "Maak UX lerend. Ik ga dan verkeer organiseren zodat je kunt leren ... Voer verbeterde UX overal door bij alle keuzehulpen"
// en "Vanaf nu gaan we dus bouwen aan de 100k intenties ." (prototype: https://claude.ai/artifact/U3EiB4kKBrq13uKpybP38R)
//
// Het blok (versie b van onderdeel 'top' in de Clickmind-proef kzuxnl, kzuxus of kzuxde, lib/proef.js):
// de 3 beste met de prijs van vandaag en de knop naar de winkel, de antwoorden van vraag 1 als pills (tik = advies voor die situatie),
// en een vraagbalk die antwoordt uit de FAQ van de pagina. Elke getypte vraag gaat naar het intentielog (lib/intentie.js).
// Versie a = de pagina zonder dit blok (zoals tot 15 nov). Zonder JavaScript (Google, AI-crawlers) staat het blok er altijd.
// Waarde per bezoeker = de sterkste stap: iets aangetikt 1, pill 2, vraag 4, klik naar de winkel 10.
// Stand: https://keuzehulp.best/api/mm/proefstand?site=kzuxnl&vorm=tekst (ook kzuxus, kzuxde).

export const RONDE = 1; // gelijk aan PROEVEN.kzux*.ronde in lib/proef.js
const ESC = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const T = {
  nl: { top: 'De 3 beste van vandaag', winkel: 'Bekijk bij', datum: 'Prijzen van vandaag', anders: 'Andere situatie? Tik wat bij jou past', vraag: 'Stel je vraag over', geen: 'Goede vraag. Die staat nu op onze lijst: het antwoord komt op deze pagina. Hieronder helpen de vragen je alvast kiezen.', zoek: 'Bekijk de prijzen', knop: 'Vraag' },
  us: { top: 'Today’s top 3', winkel: 'See on', datum: 'Prices checked today', anders: 'Different situation? Tap what fits you', vraag: 'Ask about', geen: 'Good question. It is on our list now and the answer will appear on this page. The questions below already help you choose.', zoek: 'See today’s prices', knop: 'Ask' },
  de: { top: 'Die 3 besten heute', winkel: 'Ansehen bei', datum: 'Preise von heute', anders: 'Andere Situation? Tippe, was zu dir passt', vraag: 'Frag etwas zu', geen: 'Gute Frage. Sie steht jetzt auf unserer Liste, die Antwort kommt auf diese Seite. Die Fragen unten helfen dir schon beim Auswählen.', zoek: 'Preise ansehen', knop: 'Fragen' },
};

const CSS = '.kx{margin:18px 0 22px;padding:0;border:0}.kx[hidden]{display:none!important}.kx h2.kx-h{font-size:18px;font-weight:700;margin:0 0 6px;letter-spacing:-.01em}'
  + '.kx-l{display:flex;flex-direction:column;border-top:1px solid rgba(127,127,127,.25)}'
  + 'a.kx-r{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:4px 14px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(127,127,127,.25);text-decoration:none!important;color:inherit!important}'
  + '.kx-n{min-width:0}.kx-n b{display:block;font-weight:600;font-size:16px;line-height:1.35;overflow-wrap:anywhere}.kx-n small{display:block;font-size:14px;margin-top:1px}'
  + '.kx-p{font-weight:700;font-size:16px;white-space:nowrap;font-variant-numeric:tabular-nums}.kx-k{background:#2B47C4;color:#fff;border-radius:999px;padding:7px 14px;font-size:15px;font-weight:600;white-space:nowrap}'
  + '@media (max-width:480px){a.kx-r{grid-template-columns:minmax(0,1fr) auto}.kx-k{grid-column:1/-1;justify-self:start}}'
  + '.kx-d{font-size:14px;margin:8px 0 0}.kx-s{font-size:15px;font-weight:600;margin:16px 0 8px}'
  + '.kx-ps{display:flex;flex-wrap:wrap;gap:8px}.kx-ps button{font:inherit;font-size:15px;font-weight:600;line-height:1.35;cursor:pointer;background:transparent;color:#2B47C4;border:1.5px solid #2B47C4;border-radius:999px;padding:6px 14px;text-align:left}.kx-ps button:hover{background:#EEF1FC}'
  + 'form.kx-f{display:flex;align-items:center;gap:8px;border:1.5px solid rgba(127,127,127,.45);border-radius:999px;padding:5px 5px 5px 18px;margin:16px 0 0}form.kx-f:focus-within{border-color:#2B47C4}'
  + 'form.kx-f input{flex:1;min-width:0;border:0;background:transparent;font:inherit;font-size:16px;color:inherit;padding:8px 0}form.kx-f input:focus{outline:none}'
  + 'form.kx-f button{flex:none;width:42px;height:42px;border-radius:50%;border:0;background:#2B47C4;color:#fff;font-size:19px;font-weight:700;cursor:pointer}'
  + '.kx-a{margin:12px 0 0;padding:12px 16px;border-radius:16px;background:#EEF1FC;color:#111113;font-size:16px;line-height:1.5}.kx-a b{display:block;margin:0 0 4px}'
  + '@media (prefers-color-scheme:dark){.kx-ps button{color:#93A6FF;border-color:#93A6FF}.kx-ps button:hover{background:#1B2246}.kx-k,form.kx-f button{background:#93A6FF;color:#0B1022}form.kx-f:focus-within{border-color:#93A6FF}.kx-a{background:#1B2246;color:#F2F3F5}}';

// zoekvak op de voorpagina: elke zoekvraag (bij Enter of als het veld verlaten wordt) gaat naar het intentielog, met of er een keuzehulp bij was
export const zoekLogJs = site => `<script>(function(){var s={};document.querySelectorAll('input[type=search]').forEach(function(i){i.addEventListener('change',function(){var q=(i.value||'').trim().toLowerCase();if(q.length<3||s[q])return;s[q]=1;var r=document.getElementById('zres');try{fetch('/api/keuze-tools?tool=intentie',{method:'POST',keepalive:true,headers:{'content-type':'text/plain'},body:JSON.stringify({q:q,site:${JSON.stringify(site)},bron:'zoek',m:r&&!r.hidden?1:0})})}catch(e){}})})})();</script>`;

// o: { taal: 'nl'|'us'|'de', site: 'kzuxnl'|'kzuxus'|'kzuxde', slug, term, prods: [{naam, rol, prijs, url}], shop, link, opties: [{qi, oi, label}], faq: [{q, a}] }
export function kzuxBlok(o) {
  const t = T[o.taal] || T.nl; const prods = (o.prods || []).filter(p => p && p.naam && p.url).slice(0, 3);
  const rows = prods.length
    ? prods.map(p => `<a class="kx-r" href="${ESC(p.url)}" target="_blank" rel="sponsored nofollow noopener" data-kx="winkel"><span class="kx-n"><b>${ESC(p.naam)}</b>${p.rol ? `<small>${ESC(p.rol)}</small>` : ''}</span><span class="kx-p">${ESC(p.prijs || '')}</span><span class="kx-k">${ESC(t.winkel + ' ' + (o.shop || 'bol'))}</span></a>`).join('')
    : (o.link ? `<a class="kx-r" href="${ESC(o.link)}" target="_blank" rel="sponsored nofollow noopener" data-kx="winkel"><span class="kx-n"><b>${ESC(o.term || '')}</b></span><span class="kx-p"></span><span class="kx-k">${ESC(t.zoek)}</span></a>` : '');
  if (!rows) return '';
  const opts = (o.opties || []).filter(x => x && x.label).slice(0, 5);
  const faq = (o.faq || []).filter(f => f && f.q && f.a).slice(0, 12).map(f => [String(f.q).slice(0, 200), String(f.a).slice(0, 600)]);
  const cfg = JSON.stringify({ s: o.site, r: RONDE, slug: o.slug || '', taal: o.taal, faq, geen: t.geen }).replace(/</g, '\\u003c');
  return `<style>${CSS}</style><section class="kx" id="kx" aria-label="${ESC(t.top)}"><h2 class="kx-h">${ESC(t.top)}</h2><div class="kx-l">${rows}</div>${prods.length ? `<p class="kx-d">${ESC(t.datum)}</p>` : ''}`
    + (opts.length ? `<p class="kx-s">${ESC(t.anders)}</p><div class="kx-ps">${opts.map(x => `<button type="button" data-q="${x.qi}" data-o="${x.oi}">${ESC(x.label)}</button>`).join('')}</div>` : '')
    + `<form class="kx-f" id="kxf"><input id="kxq" name="q" maxlength="160" autocomplete="off" placeholder="${ESC(t.vraag + ' ' + (o.term || ''))}"><button type="submit" aria-label="${ESC(t.knop)}">&#8593;</button></form><div class="kx-a" id="kxa" hidden></div></section>`
    + `<script>(function(){var C=${cfg},el=document.getElementById("kx");if(!el)return;var K="kzux1",st=null,ua=navigator.userAgent,c=/iPhone|iPad|iPod/.test(ua)?"i":/Android/.test(ua)?"a":"d",bot=navigator.webdriver===true;`
    + 'try{st=JSON.parse(localStorage.getItem(K)||"null")}catch(e){}if(st&&(st.s!==C.s||st.r!==C.r||!st.d||!st.v||Date.now()-Date.parse(st.d)>6*864e5))st=null;'
    + 'function stuur(o){if(!st)return;o.site=C.s;o.pid=st.pid;o.d=st.d;o.r=st.r;var j=JSON.stringify(o);try{if(!(navigator.sendBeacon&&navigator.sendBeacon("/api/mm/proefev",new Blob([j],{type:"text/plain"}))))fetch("/api/mm/proefev",{method:"POST",body:j,keepalive:true,headers:{"content-type":"text/plain"}})}catch(e){}}'
    + 'function adv(f){var a=document.getElementById("adv");if(a)a.hidden=!f}'
    + 'var V="b";function zet(){V=st.v&&st.v.top||"a";el.style.visibility="";if(V==="a")el.hidden=true;else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){if(!window.__kxOpen)adv(false)});else if(!window.__kxOpen)adv(false);stuur({e:"zie",c:c,v:{top:V}})}'
    + 'if(!bot){if(st)zet();else if(window.fetch){el.style.visibility="hidden";var to=setTimeout(function(){el.style.visibility=""},1500);fetch("/api/mm/proefkies?site="+C.s+"&c="+c,{credentials:"omit"}).then(function(r){return r.json()}).then(function(j){clearTimeout(to);if(j&&j.ok&&j.aan&&j.pid&&j.r===C.r){st={s:C.s,pid:j.pid,d:j.d,r:j.r,v:j.v};try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}zet()}else el.style.visibility=""}).catch(function(){clearTimeout(to);el.style.visibility=""})}}'
    + 'function open(){window.__kxOpen=1;adv(true)}'
    + 'document.addEventListener("click",function(e){if(!e.target.closest)return;var a=e.target.closest("a[href]");if(a){var h=a.getAttribute("href")||"";if(a.hasAttribute("data-kx")||a.hasAttribute("data-kz")||a.hasAttribute("data-amz")||/partner\\.bol\\.com|amazon\\.|amzn\\.to/.test(h)){stuur({e:"winkel"});return}}'
    + 'var p=e.target.closest(".kx-ps button");if(p){var b=document.querySelector(".q[data-q=\\""+p.getAttribute("data-q")+"\\"] .opt[data-o=\\""+p.getAttribute("data-o")+"\\"]");open();if(b)b.click();var d=document.getElementById("adv");if(d)setTimeout(function(){d.scrollIntoView({behavior:"smooth",block:"start"})},60);stuur({e:"pill"});return}'
    + 'if(e.target.closest(".opt")){open();stuur({e:"tik"});return}if(e.target.closest("button,summary,input"))stuur({e:"tik"})},true);'
    + 'var STOP=/^(de|het|een|en|of|voor|met|van|in|op|je|jij|bij|wat|hoe|welke|welk|is|are|the|a|an|and|or|for|with|of|to|what|which|how|do|does|der|die|das|ein|eine|und|oder|f\\u00fcr|mit|von|zu|was|wie|welche|ist|ich|my|mijn|mein)$/;'
    + 'function w(s){return String(s).toLowerCase().replace(/[^a-z0-9\\u00c0-\\u024f ]/g," ").split(/\\s+/).filter(function(x){return x.length>2&&!STOP.test(x)})}'
    + 'function esc(s){return String(s).replace(/[&<>"]/g,function(x){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[x]})}'
    + 'document.getElementById("kxf").addEventListener("submit",function(e){e.preventDefault();var i=document.getElementById("kxq"),q=(i.value||"").trim();if(q.length<3)return;var qw=w(q),best=null,bs=0;C.faq.forEach(function(f){var fw=w(f[0]+" "+f[1]),s=0;qw.forEach(function(x){if(fw.indexOf(x)>=0)s+=(w(f[0]).indexOf(x)>=0?2:1)});if(s>bs){bs=s;best=f}});'
    + 'var o=document.getElementById("kxa"),hit=best&&bs>=2;o.innerHTML=hit?"<b>"+esc(best[0])+"</b>"+esc(best[1]):esc(C.geen);o.hidden=false;if(!hit)open();'
    + 'try{fetch("/api/keuze-tools?tool=intentie",{method:"POST",keepalive:true,headers:{"content-type":"text/plain"},body:JSON.stringify({q:q,site:C.taal,slug:C.slug,m:hit?1:0,v:V})})}catch(x){}stuur({e:"vraag"});i.value=""});'
    + '})();</script>';
}
