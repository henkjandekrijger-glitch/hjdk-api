import { SELECT_TERUGVAL } from './keuzelijst.js';
// Eén huisstijl voor alle sites: het design van nexy.help (rustig, smalle leeskolom, kicker, standfirst, antwoordblok, kaarten, rijen, FAQ),
// per site alleen een andere accentkleur. look({acc, acc2, accD, acc2D}, {dark}) -> CSS-tekst.
// Bevat ook de oude klassenamen (.hero, .q, .opt, .pr, .txt, .card, .grid, .disc, .box) zodat bestaande pagina's meteen meeveranderen.
export const ACCENTS = {
  keuzehulp: { acc: '#0f766e', acc2: '#e6f4f1', accD: '#5eead4', acc2D: '#0f2624' }, // groenblauw
  whichtobuy: { acc: '#c2410c', acc2: '#fff1e8', accD: '#fdba74', acc2D: '#2a1a10' }, // oranje
  kaufberater: { acc: '#6d28d9', acc2: '#f1ebff', accD: '#c4b5fd', acc2D: '#1d1630' }  // violet
};
export function look(a, o) {
  o = o || {}; const dark = o.dark !== false;
  const darkVars = `--ink:#f3f5f8;--ink-2:#c3c9d4;--ink-3:#8d95a3;--line:#262b36;--bg:#0c0e13;--bg-2:#13161d;--acc:${a.accD};--acc-2:${a.acc2D};--on-acc:#0c0e13`;
  return `:root{--ink:#10131a;--ink-2:#3c4350;--ink-3:#6b7280;--line:#e4e7ec;--bg:#ffffff;--bg-2:#f7f8fa;--acc:${a.acc};--acc-2:${a.acc2};--on-acc:#fff;--max:46rem}
${dark ? `@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${darkVars}}}:root[data-theme=dark]{${darkVars}}` : ''}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--bg);color:var(--ink);font:400 1.0625rem/1.65 ui-sans-serif,-apple-system,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif;text-rendering:optimizeLegibility}a{color:var(--acc)}
.wrap{max-width:var(--max);margin:0 auto;padding:0 16px}.topbar{border-bottom:1px solid var(--line);background:var(--bg)}.topbar .wrap{display:flex;align-items:center;gap:16px;height:60px}
.mark{font-weight:700;font-size:1.25rem;letter-spacing:-.02em;color:var(--ink);text-decoration:none}.mark em{color:var(--acc);font-style:normal}.topnav{margin-left:auto;display:flex;gap:18px;font-size:.9375rem}.topnav a{color:var(--ink-2);text-decoration:none}.topnav a:hover{color:var(--acc)}
main{padding:28px 0 8px}.crumbs,.crumbs a{color:var(--ink-3)}.crumbs{font-size:.875rem;margin:0 0 18px}.kicker{font-size:.75rem;letter-spacing:.09em;text-transform:uppercase;color:var(--acc);font-weight:600;margin:0 0 10px}
h1{font-size:clamp(1.9rem,5.2vw,2.75rem);line-height:1.12;letter-spacing:-.025em;margin:0 0 14px;font-weight:700}h2{font-size:1.375rem;line-height:1.25;letter-spacing:-.015em;margin:40px 0 12px;font-weight:650}h3{font-size:1.0625rem;margin:26px 0 8px;font-weight:600}
.standfirst,.lead{font-size:1.1875rem;color:var(--ink-2);margin:0 0 26px;line-height:1.5}.meta{font-size:.875rem;color:var(--ink-3);margin:0 0 12px}
.answer{background:var(--bg-2);border:1px solid var(--line);border-left:3px solid var(--acc);border-radius:10px;padding:18px 20px;margin:0 0 30px}.answer p{margin:0}.answer p+p{margin-top:10px}.answer strong{color:var(--ink)}
.rows{border:1px solid var(--line);border-radius:10px;overflow:hidden;margin:0 0 8px}.rows .r{display:grid;grid-template-columns:11.5rem 1fr;border-bottom:1px solid var(--line)}.rows .r:last-child{border-bottom:0}.rows .r>span:first-child{padding:12px 14px;font-weight:600;background:var(--bg-2);font-size:.9375rem}.rows .r>span:last-child{padding:12px 14px;color:var(--ink-2)}@media (max-width:560px){.rows .r{grid-template-columns:1fr}.rows .r>span:first-child{border-bottom:1px solid var(--line)}}
details.faq{border-bottom:1px solid var(--line);padding:2px 0}details.faq summary{cursor:pointer;padding:13px 0;font-weight:500;list-style:none;display:flex;gap:10px;align-items:flex-start}details.faq summary::-webkit-details-marker{display:none}details.faq summary:before{content:"+";color:var(--acc);font-weight:700;line-height:1.5}details.faq[open] summary:before{content:"\\2013"}details.faq .a{padding:0 0 15px 22px;color:var(--ink-2)}details.faq .a p{margin:0}
.rel{font-size:.9375rem;color:var(--ink-2);margin:28px 0 0}
.cards,.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));margin:18px 0 0;padding:0;list-style:none}.cards li,.card{border:1px solid var(--line);border-radius:10px;padding:14px 16px;background:var(--bg-2);display:block;text-decoration:none;color:var(--ink)}.cards a,.card h3{font-weight:600;text-decoration:none;letter-spacing:-.01em;color:var(--acc);font-size:1rem;margin:0}.card:hover{border-color:var(--acc)}.cards p,.card p{margin:6px 0 0;font-size:.9063rem;color:var(--ink-3);line-height:1.45}.card .cat,.card .c{font-size:.6875rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);margin:0 0 4px}
.pills{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 22px;padding:0;list-style:none}.pills li{font-size:.75rem;border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:var(--ink-3)}
.sub,.box,.txt,.q{border:1px solid var(--line);border-radius:12px;padding:20px;margin:16px 0 0;background:var(--bg-2)}.sub h2,.box h2,.txt h2,.q h2{margin:0 0 10px;font-size:1.0625rem;font-weight:600;letter-spacing:-.01em}.sub p{margin:0 0 14px;color:var(--ink-2);font-size:.9375rem}.box ul,.txt ul{margin:0;padding-left:20px}.box li,.txt li{margin:6px 0;color:var(--ink-2)}.box.ai{border-left:3px solid var(--acc)}
.sub form{display:flex;gap:8px;flex-wrap:wrap}.sub input[type=email],input[type=email]{flex:1 1 13rem;min-width:0;padding:11px 13px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font-size:1rem;font-family:inherit}
.btn{display:inline-block;padding:11px 16px;border-radius:8px;border:1px solid var(--acc);background:var(--acc);color:var(--on-acc);font:inherit;font-weight:600;font-size:.9375rem;cursor:pointer;text-decoration:none}.btn.ghost,.btn.sec{background:transparent;color:var(--acc)}.btn:disabled{opacity:.55;cursor:default}
.note{font-size:.8125rem;color:var(--ink-3);margin:12px 0 0}.pushrow{margin:12px 0 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.hero{padding:6px 0 0}.hero h1{margin-bottom:10px}.hero p{font-size:1.1875rem;color:var(--ink-2);margin:0 0 18px;line-height:1.5}
.opts{display:flex;flex-wrap:wrap;gap:8px}.opt{border:1px solid var(--line);background:var(--bg);border-radius:999px;padding:9px 15px;font:inherit;font-weight:400;font-size:.9375rem;cursor:pointer;color:var(--ink-2)}.opt.on{font-weight:500}.opt:hover{border-color:var(--acc)}.opt.on{background:var(--acc);border-color:var(--acc);color:var(--on-acc)}
.adv{margin:18px 0}.pr{display:grid;grid-template-columns:96px 1fr;gap:14px;background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:14px;margin:0 0 10px;align-items:center}.pr.best{border:1px solid var(--acc);box-shadow:0 0 0 3px var(--acc-2)}.pr img{width:96px;height:96px;object-fit:contain;border-radius:8px;background:#fff}.pr .role,.role{font-size:.6875rem;letter-spacing:.08em;text-transform:uppercase;color:var(--acc);font-weight:600}.pr .t,.t{font-weight:500;margin:2px 0 4px;line-height:1.3}.pr .m{color:var(--ink-3);font-size:.875rem;margin-bottom:8px}.pr .m b,.price{color:var(--ink);font-size:1.0625rem;font-weight:600}.pr .m s{color:var(--ink-3);margin-left:6px}
.disc{color:var(--ink-3);font-size:.8125rem;margin:14px 0 0}
footer{border-top:1px solid var(--line);margin:48px 0 0;padding:22px 0 44px;font-size:.875rem;color:var(--ink-3)}footer a{color:var(--ink-3)}footer .fl{display:flex;flex-wrap:wrap;gap:14px;margin:0 0 10px}
@media(max-width:600px){.pr{grid-template-columns:72px 1fr;gap:12px}.pr img{width:72px;height:72px}}`;
}

// Kleurtest: per site een paar accentkleuren; de bezoeker krijgt er één (Thompson op klik-naar-winkel per paginaweergave), blijft die houden (localStorage),
// en de winnaar krijgt vanzelf steeds meer bezoekers. Variant 0 = de huidige kleur. Tellers: c:<prefix>-v<i>-imp en -clk.
const P = {
  teal: { naam: 'groenblauw', acc: '#0f766e', acc2: '#e6f4f1', accD: '#5eead4', acc2D: '#0f2624' },
  blue: { naam: 'blauw', acc: '#1d4ed8', acc2: '#e8effd', accD: '#93b4fb', acc2D: '#111a33' },
  green: { naam: 'groen', acc: '#15803d', acc2: '#e8f5ec', accD: '#86efac', acc2D: '#0f2417' },
  orange: { naam: 'oranje', acc: '#c2410c', acc2: '#fff1e8', accD: '#fdba74', acc2D: '#2a1a10' },
  violet: { naam: 'violet', acc: '#6d28d9', acc2: '#f1ebff', accD: '#c4b5fd', acc2D: '#1d1630' },
  rose: { naam: 'rood', acc: '#be123c', acc2: '#fdecef', accD: '#fda4af', acc2D: '#2a1218' }
};
export const PALETTES = {
  keuzehulp: [P.teal, P.blue, P.orange, P.rose],
  whichtobuy: [P.orange, P.blue, P.teal, P.green],
  kaufberater: [P.violet, P.blue, P.teal, P.orange]
};
// Kopscript (in <head>, vóór het tekenen): kiest en onthoudt de kleur, zet de CSS-variabelen, telt weergave en winkelklik.
// counts = [[imp, clk], ...] uit de tellers; clickSel = CSS-selector van winkellinks.
export function colourHead(prefix, pal, counts, clickSel, dark) {
  const v = pal.map((p, i) => [p.acc, p.acc2, p.accD, p.acc2D, (counts[i] && counts[i][0]) || 0, (counts[i] && counts[i][1]) || 0]);
  return `<script>(function(){try{var V=${JSON.stringify(v)},K=${JSON.stringify('col-' + prefix)},D=${dark ? 1 : 0},ua=navigator.userAgent||'';if(/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(ua)||navigator.webdriver)return;
var i=-1;try{i=+localStorage.getItem(K);if(!(i>=0&&i<V.length)||localStorage.getItem(K)===null)i=-1}catch(e){}
function g(k){var s=0;for(var j=0;j<Math.max(1,Math.round(k));j++)s-=Math.log(1-Math.random());return s*(k/Math.max(1,Math.round(k)))}
if(i<0){var b=-1;for(var j=0;j<V.length;j++){var a=g(V[j][5]+1),c=g(Math.max(0,V[j][4]-V[j][5])+1),x=a/(a+c);if(x>b){b=x;i=j}}try{localStorage.setItem(K,i)}catch(e){}}
var p=V[i],st=document.createElement('style');st.textContent=':root{--acc:'+p[0]+';--acc-2:'+p[1]+'}'+(D?'@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--acc:'+p[2]+';--acc-2:'+p[3]+'}}:root[data-theme=dark]{--acc:'+p[2]+';--acc-2:'+p[3]+'}':'');document.head.appendChild(st);
function h(k){try{navigator.sendBeacon('/api/hjdk/stats/hits',new Blob([JSON.stringify({hits:[[k,1]]})],{type:'text/plain'}))}catch(e){}}
h(K+'-v'+i+'-imp');var done=0;document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest(${JSON.stringify(clickSel)});if(t&&!done){done=1;h(K+'-v'+i+'-clk')}},true);}catch(e){}})();</script>`;
}

// Nieuwe huisstijl (Henkjan 20 okt 2026: "de outname.now-look, veel cleaner; altijd gewoon zwarte tekst; zo min mogelijk verschillende groottes").
// Zelfde klassenamen als look(), zodat alle bestaande pagina's meeveranderen. Tekstgroottes: 16 / 18 / 20 plus koppen.
export const WA_REDACTIE = 'https://wa.me/31655395630'; // contact via WhatsApp (Henkjan 20 okt: geen naam, geen nummer in beeld)
export const ACCENT_NIEUW = { acc: '#2B47C4', acc2: '#EEF1FC', accD: '#93A6FF', acc2D: '#1B2246' };
export function lookNieuw(a) {
  a = a || ACCENT_NIEUW;
  return `:root{--ink:#111113;--ink-2:#111113;--ink-3:#111113;--line:#E5E7EB;--line-strong:#B9BFC7;--bg:#ffffff;--bg-2:#ffffff;--acc:${a.acc};--acc-2:${a.acc2};--on-acc:#fff;--ok:#1F7A4D;--warn:#B3261E;--max:820px;color-scheme:light}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--bg);color:var(--ink);font:400 18px/1.65 "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}a{color:var(--ink);text-decoration:underline;text-decoration-color:var(--line-strong,#B9BFC7);text-decoration-thickness:1px;text-underline-offset:4px}main a:not(.btn):not(.card):not(.opt):not(.cta):not(.tegel):not(.mark):not(.brand):not([class*=btn]):not([style*=background]){color:var(--ink)!important}a:hover{text-decoration-color:currentColor}a:hover{color:var(--acc)}img{max-width:100%}
.wrap{max-width:var(--max);margin:0 auto;padding:0 26px}.topbar{position:sticky;top:0;z-index:5;border-bottom:1px solid var(--line);background:var(--bg)}.topbar .wrap{max-width:1040px;display:flex;align-items:center;gap:18px;min-height:64px;flex-wrap:wrap}
.mark{font-weight:700;font-size:20px;letter-spacing:-.02em;color:var(--ink);text-decoration:none}.mark em{color:var(--acc);font-style:normal}.topnav{margin-left:auto;display:flex;gap:18px;font-size:16px}.topnav a{color:var(--ink);text-decoration:none}.topnav a:hover{color:var(--acc)}
main{padding:52px 0 20px}.crumbs,.crumbs a{color:var(--ink)}.crumbs{font-size:16px;margin:0 0 18px}.kicker,.eyebrow{font-size:16px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink);font-weight:600;margin:0 0 10px;display:flex;align-items:center;gap:9px}
h1{font-size:clamp(34px,6vw,54px);line-height:1.09;letter-spacing:-.04em;margin:12px 0 20px;font-weight:700;text-wrap:balance;overflow-wrap:break-word}h2{font-size:30px;line-height:1.22;letter-spacing:-.03em;margin:52px 0 14px;font-weight:700;text-wrap:balance}h3{font-size:20px;line-height:1.3;margin:24px 0 8px;font-weight:600}
p{margin:0 0 14px}.standfirst,.lead,.hero p{font-size:20px;color:var(--ink);margin:0 0 28px;line-height:1.6;max-width:660px}.meta,.note,.disc{font-size:16px;color:var(--ink);opacity:.75;margin:12px 0 0}
.answer{background:var(--acc-2);border:0;border-radius:16px;padding:24px 26px;margin:0 0 32px}.answer p{margin:0}.answer p+p{margin-top:10px}.answer strong{color:var(--ink)}
.rows{border-top:1px solid var(--line);margin:0 0 8px}.rows .r{display:grid;grid-template-columns:12rem 1fr;border-bottom:1px solid var(--line)}.rows .r>span:first-child{padding:14px 0;font-weight:600;font-size:18px}.rows .r>span:last-child{padding:14px 0 14px 14px}@media (max-width:560px){.rows .r{grid-template-columns:1fr}.rows .r>span:last-child{padding:0 0 14px}}
details,details.faq{border-top:1px solid var(--line);padding:14px 0}details:last-of-type{border-bottom:1px solid var(--line)}details summary,details.faq summary{cursor:pointer;font-weight:600;font-size:18px;list-style:none}details.faq summary::-webkit-details-marker{display:none}details .a,details p{margin:8px 0 0}
.rel{font-size:18px;margin:28px 0 0}
.cards,.grid{display:grid;gap:14px;grid-template-columns:repeat(2,minmax(0,1fr));margin:20px 0 0;padding:0;list-style:none}.cards li,.card{border:1px solid var(--line);border-radius:14px;padding:20px;background:var(--bg);display:flex;flex-direction:column;gap:6px;text-decoration:none;color:var(--ink);transition:border-color .15s;min-width:0}.cards li:hover,.card:hover{border-color:var(--acc)}.cards a{font-weight:600;font-size:20px;text-decoration:none;color:var(--ink)}.card h3{margin:0;font-size:20px;color:var(--ink)}.card p{margin:0;font-size:18px;color:var(--ink)}.card .cat{font-size:16px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink);opacity:.7}.card .meer{margin-top:auto;padding-top:6px;font-size:16px;font-weight:600;color:var(--acc)}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px;padding:0;list-style:none}.pills li{font-size:16px;border:1px solid var(--line);border-radius:9px;padding:6px 12px;color:var(--ink)}
.sub,.box,.txt,.q{border:1px solid var(--line);border-radius:16px;padding:24px;margin:20px 0 0;background:var(--bg);box-shadow:0 5px 22px #15214b08}.sub h2,.box h2,.txt h2,.q h2{margin:0 0 12px;font-size:20px;font-weight:600;letter-spacing:-.01em}.sub p{margin:0 0 14px;font-size:18px}.box ul,.txt ul{margin:0;padding-left:20px}.box li,.txt li{margin:6px 0}
.sub form{display:flex;gap:10px;flex-wrap:wrap}input[type=email],input[type=search],input[type=text]{flex:1 1 13rem;min-width:0;min-height:50px;padding:10px 14px;border:1px solid var(--line-strong);border-radius:9px;background:var(--bg);color:var(--ink);font:inherit;font-size:18px}
.btn{display:inline-block;padding:12px 18px;border-radius:9px;border:1px solid var(--acc);background:var(--acc);color:var(--on-acc);font:inherit;font-weight:600;font-size:16px;cursor:pointer;text-decoration:none;text-align:center}.btn.ghost,.btn.sec{background:transparent;color:var(--acc)}.btn:disabled{opacity:.55;cursor:default}
.pushrow{margin:12px 0 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.hero{padding:0}.hero h1{margin-bottom:20px}
.opts{display:flex;flex-wrap:wrap;gap:10px}.opt{border:1px solid var(--line-strong);background:var(--bg);border-radius:9px;padding:11px 16px;min-height:48px;font:inherit;font-size:18px;cursor:pointer;color:var(--ink)}.opt:hover{border-color:var(--acc)}.opt.on{background:var(--acc);border-color:var(--acc);color:var(--on-acc);font-weight:600}
.adv{margin:20px 0}.pr{display:grid;grid-template-columns:110px 1fr;gap:18px;background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:18px;margin:0 0 12px;align-items:center}.pr.best{border-color:var(--acc)}.pr img{width:110px;height:110px;object-fit:contain;border-radius:9px;background:#fff}.pr .role,.role{font-size:16px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;color:var(--ink);opacity:.7}.pr .t{font-size:20px;font-weight:600;line-height:1.3;margin:2px 0 4px}.pr .m{font-size:18px;margin:0 0 10px}.pr .m s{opacity:.6;margin-left:6px}
footer{border-top:1px solid var(--line);margin:48px 0 0;padding:24px 0 44px;font-size:16px;color:var(--ink)}footer a{color:var(--ink)}footer .fl{display:flex;flex-wrap:wrap;gap:14px;margin:0 0 10px}
.zoekvak{border:1px solid var(--line);border-radius:16px;box-shadow:0 5px 22px #15214b08;padding:22px;margin:0 0 12px}.zoekvak input{width:100%;display:block}.tegels{display:grid;gap:14px;grid-template-columns:repeat(2,minmax(0,1fr));margin:20px 0 0}.live-dot{width:7px;height:7px;background:var(--acc);border-radius:50%;display:inline-block;flex:none}
main [style*="font-size:11px"],main [style*="font-size:12px"],main [style*="font-size:13px"],main [style*="font-size:14px"],main [style*="font-size:15px"],main [style*="font-size:.8"],main [style*="font-size:.7"],main [style*="font-size:.9"],main table{font-size:16px!important}main [style*="font-size:17px"],main [style*="font-size:19px"]{font-size:18px!important}main [style*="color:#6"],main [style*="color:#7"],main [style*="color:#8"],main [style*="color:#9"],main [style*="color:#a"],main [style*="color:#5"],main [style*="color:#4"]{color:var(--ink)!important}main table{border-collapse:collapse;width:100%}main th,main td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:top}
select{width:100%;min-height:50px;border:1px solid var(--line-strong);border-radius:9px;background-color:var(--bg);color:var(--ink);font:inherit;font-size:18px;padding:10px 14px}${SELECT_TERUGVAL}
@media(max-width:760px){.cards,.grid,.tegels{grid-template-columns:1fr}}
@media(max-width:640px){.wrap{padding:0 18px}main{padding:34px 0 20px}h2{font-size:26px}.standfirst,.lead,.hero p{font-size:18px}.pr{grid-template-columns:80px 1fr;gap:14px;padding:14px}.pr img{width:80px;height:80px}.topnav{gap:12px}.zoekvak{padding:16px}}
/* formulieren in outname-stijl (21 okt, Henkjan: lelijk invoerveld): rustige velden, ronde knoppen; overschrijft oude inline stijlen */
.btn,.cta{border-radius:999px!important}
main form input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]),main form textarea{border:1px solid var(--line-strong)!important;border-radius:12px!important;padding:13px 16px!important;font:inherit!important;font-size:17px!important;line-height:1.3!important;min-height:52px!important;background:var(--bg)!important;color:var(--ink)!important;outline:0;-webkit-appearance:none;appearance:none;box-shadow:none}
main form input:focus,main form textarea:focus{border-color:var(--acc)!important;box-shadow:0 0 0 3px var(--acc-2)!important}
main form input::placeholder,main form textarea::placeholder{color:var(--ink);opacity:.45}
main form button{border-radius:999px!important;min-height:52px;padding:0 22px!important;font:inherit;font-weight:600;font-size:17px}
main form.nl-f{display:flex!important;flex-wrap:nowrap!important;gap:6px!important;align-items:center;border:1px solid var(--line-strong);border-radius:16px;padding:6px 6px 6px 16px;background:var(--bg);max-width:620px}
main form.nl-f:focus-within{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-2)}
main form.nl-f input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]){border:0!important;box-shadow:none!important;padding:8px 0!important;min-height:44px!important;flex:1 1 auto!important;min-width:0!important;width:auto!important;border-radius:0!important}
main form.nl-f button{min-height:44px;white-space:nowrap}
main section#vraag form input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]){border:0!important;box-shadow:none!important;padding:10px 0!important;min-height:0!important;border-radius:0!important}main section#vraag form button{min-height:44px}`;
}
