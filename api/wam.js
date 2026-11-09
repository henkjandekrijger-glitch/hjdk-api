// We Are Many (wearemany.now): de chat die meteen start (Henkjan 9 nov 2026). Logica in lib/wam.js, hooks en beelden in lib/wam-hooks.js.
//   GET  /                         (wearemany.now) de chat; de server kiest de opener en zet hem in de pagina
//   POST /api/wam?op=zeg           { sid, tok, x | knop }  -> antwoord van de bot
//   POST /api/wam?op=ev            { sid, tok, e, d }      gebeurtenis uit de browser (js, zicht1, typt, verborgen, terug, weg, contact_*)
//   GET  /api/wam?op=beeld&h=&t=&v=icon|img                 advertentiebeeld per hook
//   GET  /api/wam?op=leer          leerronde (cron, elk uur) ; ?forceer=1 op de beschermde host
//   GET  /api/wam?op=stand         eigenaarspagina (alleen op *.vercel.app, achter Vercel-inlog)
//   GET  /api/wam?op=hookzet&j=    advertentie-id -> hook vastleggen (beschermde host); j = [{"b":"123","hook":"teveel"}]
//   POST /api/wam?op=tg            Telegram-webhook (als WAM_TG_TOKEN er is); GET op=tgzet zet de webhook (beschermde host)
//   GET  /privacy, /robots.txt, /llms.txt
import { randomBytes, createHmac } from 'node:crypto';
import * as W from '../lib/wam.js';
import { HOOKS, hookTekst, beeld } from '../lib/wam-hooks.js';
import * as POST from '../lib/wam-post.js';

const beschermd = host => /\.vercel\.app$/i.test(host);
const isCron = req => (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(req.headers['user-agent'] || ''));
const leesBody = req => { const b = req.body; if (!b) return {}; if (typeof b === 'object') return b; try { return JSON.parse(String(b)); } catch (e) { return {}; } };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const schoon = (v, re, n = 40) => { v = String(v || '').slice(0, n); return re.test(v) ? v : ''; };

const UI = {
  nl: { ph: 'Typ je bericht…', stuur: 'Stuur', privacy: 'Privacy', mailPh: 'jouw@email.nl', mailKnop: 'Mail me', nee: 'Liever niet', tg: 'Telegram', wa: 'WhatsApp', via: 'Hoe wil je het horen?', sub: 'jouw eigen regelaar', nieuw: 'Nieuw gesprek', fout: 'Verbinding mislukt. Probeer het nog eens.' },
  en: { ph: 'Type your message…', stuur: 'Send', privacy: 'Privacy', mailPh: 'you@email.com', mailKnop: 'Email me', nee: 'No thanks', tg: 'Telegram', wa: 'WhatsApp', via: 'How do you want to hear back?', sub: 'your own personal fixer', nieuw: 'New chat', fout: 'Connection failed. Please try again.' },
  de: { ph: 'Schreib deine Nachricht…', stuur: 'Senden', privacy: 'Datenschutz', mailPh: 'du@email.de', mailKnop: 'Schreib mir', nee: 'Lieber nicht', tg: 'Telegram', wa: 'WhatsApp', via: 'Wie möchtest du es hören?', sub: 'dein eigener Kümmerer', nieuw: 'Neuer Chat', fout: 'Verbindung fehlgeschlagen. Bitte nochmal.' },
  fr: { ph: 'Écris ton message…', stuur: 'Envoyer', privacy: 'Confidentialité', mailPh: 'toi@email.fr', mailKnop: 'Écris-moi', nee: 'Non merci', tg: 'Telegram', wa: 'WhatsApp', via: 'Comment veux-tu être recontacté ?', sub: 'ton assistant perso', nieuw: 'Nouveau chat', fout: 'Échec de connexion. Réessaie.' },
  es: { ph: 'Escribe tu mensaje…', stuur: 'Enviar', privacy: 'Privacidad', mailPh: 'tu@email.com', mailKnop: 'Escríbeme', nee: 'No, gracias', tg: 'Telegram', wa: 'WhatsApp', via: '¿Cómo quieres que te avise?', sub: 'tu gestor personal', nieuw: 'Nuevo chat', fout: 'Error de conexión. Inténtalo de nuevo.' }
};
const ui = t => UI[t] || UI.en;

function cookie(req, naam) { const m = String(req.headers.cookie || '').match(new RegExp('(?:^|; )' + naam + '=([^;]+)')); return m ? decodeURIComponent(m[1]) : ''; }

// Scherm in de stijl van outname.now (Henkjan 9 nov: "UX is volkomen kut ... Pak ux van outname.now en maak de hele UX ook lerend"):
// wit, rustig, één smalle kolom in het midden, grote eerste vraag, keuzes als duidelijke kaarten. Drie onderdelen zijn proeven die
// zichzelf sturen (lib/wam.js UX): opener (held = grote kop, chat = kaartje), keuzes (kaarten of pillen), invoer (vast onderin of
// meteen onder de keuzes). De server kiest per bezoeker en zet ux-<onderdeel>-<variant> op body.
function pagina({ start, taal, kanalen }) {
  // contactkaart: zodra Telegram of WhatsApp echt antwoordt, belooft de kaart dat je daar verder kunt praten (relatie, niet alleen een mail)
  const verder = (kanalen || []).filter(k => k === 'Telegram' || k === 'WhatsApp');
  const u = Object.assign({}, ui(taal), verder.length ? { via: { nl: 'Praat verder via ' + verder.join(' of ') + ', of laat je mail achter. Ik weet nog waar we waren.', de: 'Schreib mir weiter auf ' + verder.join(' oder ') + ' oder hinterlass deine E-Mail. Ich weiß noch, wo wir waren.' }[taal] || 'Keep talking on ' + verder.join(' or ') + ', or leave your email. I\'ll remember where we were.' } : {});
  const o = start ? start.opener : { tekst: taal === 'nl' ? 'Hoi! Ik ben WAM. Waar kan ik je mee helpen?' : 'Hi! I\'m WAM. What can I help you with?', knoppen: [] };
  const ux = (start && start.ux) || { opener: 'held', keuzes: 'kaarten', invoer: 'vast' };
  const kl = Object.entries(ux).map(([d, v]) => 'ux-' + d + '-' + v).join(' ');
  const data = { sid: start ? start.sid : '', tok: start ? start.tok : '', taal, ui: u, kanalen, opener: o, ux };
  return `<!doctype html><html lang="${esc(taal)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content">
<title>We Are Many: ${esc(u.sub)}</title><meta name="description" content="WAM is a free AI chat that helps you pay less, cancel subscriptions, compare deals and get things sorted, and bundles people with the same wish.">
<meta property="og:title" content="We Are Many"><meta property="og:description" content="${esc(u.sub)}"><meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%232B47C4'/%3E%3Ctext x='32' y='42' font-size='26' font-family='Arial' font-weight='700' fill='white' text-anchor='middle'%3EW%3C/text%3E%3C/svg%3E">
<style>
:root{--bg:#FFFFFF;--panel:#FFFFFF;--ink:#111113;--body:#3A3F47;--muted:#6B7280;--line:#E5E7EB;--line2:#B9BFC7;--accent:#2B47C4;--accent-ink:#FFFFFF;--soft:#EEF1FC;--ok:#1F7A4D;--warn:#B3261E;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#0F1116;--panel:#161922;--ink:#F2F3F5;--body:#C9CDD3;--muted:#8B929B;--line:#272C37;--line2:#4A5260;--accent:#93A6FF;--accent-ink:#0B1022;--soft:#1B2246;--ok:#71CF9E;--warn:#F08A7E;color-scheme:dark}}
*,*::before,*::after{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--body);font:17px/1.6 "Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
button{font:inherit;color:inherit;cursor:pointer}button:focus-visible,input:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
.top{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line)}
.top-in{max-width:760px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;gap:12px}
.brand{font-weight:700;letter-spacing:-.02em;font-size:18px;color:var(--ink);text-decoration:none;white-space:nowrap}.brand span{color:var(--accent)}
.eb{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dot{width:7px;height:7px;border-radius:50%;background:var(--accent);display:inline-block;flex:none}
.pr{margin-left:auto;font-size:13px;color:var(--muted);text-decoration:none}
@media (max-width:440px){.eb{display:none}}
#log{max-width:720px;margin:0 auto;padding:22px 20px 24px;display:flex;flex-direction:column}
.ux-invoer-vast #log{padding-bottom:120px}
.m{margin:10px 0;max-width:62ch;white-space:pre-wrap;word-wrap:break-word;animation:in .2s ease-out}
.m.b{color:var(--ink)}.m.b a{color:var(--accent)}
.m.u{align-self:flex-end;background:var(--soft);color:var(--ink);border-radius:18px 18px 6px 18px;padding:10px 15px;max-width:82%}
.ux-opener-held .m.eerste{font-size:clamp(27px,6.4vw,40px);line-height:1.14;letter-spacing:-.035em;font-weight:700;margin:18px 0 26px;text-wrap:balance}
.ux-opener-chat .m.b{background:var(--panel);border:1px solid var(--line);border-radius:6px 18px 18px 18px;padding:12px 16px;box-shadow:0 5px 22px #15214b08}
.k{margin:2px 0 14px;animation:in .2s ease-out}
.ux-keuzes-kaarten .k{display:grid;grid-template-columns:1fr;gap:10px}
@media (min-width:600px){.ux-keuzes-kaarten .k{grid-template-columns:1fr 1fr}}
.ux-keuzes-kaarten .k button{display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:15px 16px;font-size:16px;font-weight:600;color:var(--ink);transition:border-color .15s,transform .15s}
.ux-keuzes-kaarten .k button::after{content:"→";color:var(--accent);font-weight:700}
.ux-keuzes-kaarten .k button:hover{border-color:var(--accent);transform:translateY(-1px)}.ux-keuzes-kaarten .k button:active{background:var(--soft)}
.ux-keuzes-pillen .k{display:flex;flex-wrap:wrap;gap:10px}
.ux-keuzes-pillen .k button{border:1.5px solid var(--accent);color:var(--accent);background:transparent;border-radius:999px;padding:9px 16px;font-size:15px;font-weight:600}
.ux-keuzes-pillen .k button:active{background:var(--soft)}
.dots{display:inline-flex;gap:5px;padding:12px 2px}.dots i{width:8px;height:8px;border-radius:50%;background:var(--accent);opacity:.3;animation:d 1s infinite}.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
.c{border:1px solid var(--line);border-radius:16px;padding:16px;margin:6px 0 16px;box-shadow:0 5px 22px #15214b06;max-width:520px}
.c p{margin:0 0 10px;font-size:14px;color:var(--muted)}.c form{display:flex;gap:8px}
.c input{flex:1;min-width:0;font:inherit;font-size:16px;padding:11px 14px;border:1px solid var(--line2);border-radius:9px;background:var(--bg);color:var(--ink)}
.c .r{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.c a,.c button{font-size:15px;font-weight:600;border-radius:9px;padding:11px 16px;border:0;text-decoration:none;text-align:center}
.mail{background:var(--accent);color:var(--accent-ink)}.tg{background:#229ED9;color:#fff}.wa{background:#25D366;color:#06301a}.nee{background:transparent;color:var(--muted);box-shadow:inset 0 0 0 1px var(--line)}
#f{display:flex;gap:10px;align-items:center}
.ux-invoer-vast #f{position:fixed;left:0;right:0;bottom:0;z-index:4;background:var(--bg);border-top:1px solid var(--line);padding:12px max(16px,calc(50% - 360px)) calc(12px + env(safe-area-inset-bottom))}
.ux-invoer-inline #f{max-width:720px;margin:0 auto;padding:0 20px 40px}
#i{flex:1;min-width:0;font:inherit;font-size:16px;padding:13px 18px;border:1px solid var(--line2);border-radius:999px;background:var(--bg);color:var(--ink);outline:none}#i:focus{border-color:var(--accent)}
#s{flex:none;width:48px;height:48px;border:0;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:20px;font-weight:700;display:flex;align-items:center;justify-content:center}#s:disabled{opacity:.45}
.vt{position:absolute;left:-9999px}
@keyframes in{from{opacity:0;transform:translateY(5px)}to{opacity:1}}@keyframes d{0%,80%,100%{opacity:.25}40%{opacity:1}}
</style><script src="/cm.js" data-site="wam" async></script></head><body class="${esc(kl)}">
<header class="top"><div class="top-in"><a class="brand" href="/">We Are <span>Many</span></a><span class="eb"><span class="dot" aria-hidden="true"></span>${esc(u.sub)}</span><a class="pr" href="/privacy">${esc(u.privacy)}</a></div></header>
<main id="log" aria-live="polite"><div class="m b eerste">${esc(o.tekst)}</div><div class="k" id="k0">${(o.knoppen || []).map(k => '<button type="button">' + esc(k) + '</button>').join('')}</div></main>
<form id="f" autocomplete="off"><label class="vt" for="i">${esc(u.ph)}</label><input id="i" enterkeyhint="send" placeholder="${esc(u.ph)}"><button id="s" type="submit" aria-label="${esc(u.stuur)}">→</button></form>
<noscript><p style="padding:12px">WAM is a chat. Please enable JavaScript.</p></noscript>
<script>window.WAM=${JSON.stringify(data).replace(/</g, '\\u003c')};</script>
<script>(function(){var W=window.WAM,D=document,L=D.getElementById('log'),F=D.getElementById('f'),I=D.getElementById('i'),S=D.getElementById('s');
var bezig=0,typte=0,tBot=Date.now(),msgs=[{r:'b',x:W.opener.tekst,k:W.opener.knoppen}];
function post(op,b,cb){try{fetch('/api/wam?op='+op,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b),keepalive:op==='ev'}).then(function(r){return r.json()}).then(function(j){cb&&cb(j)}).catch(function(){cb&&cb(null)})}catch(e){cb&&cb(null)}}
function bk(e,d){var b=JSON.stringify({sid:W.sid,tok:W.tok,e:e,d:d||{}});try{if(!(navigator.sendBeacon&&navigator.sendBeacon('/api/wam?op=ev',new Blob([b],{type:'text/plain'}))))post('ev',JSON.parse(b))}catch(x){}}
function ev(e,d){if(W.sid)post('ev',{sid:W.sid,tok:W.tok,e:e,d:d||{}})}
function onder(){try{var z=L.lastElementChild;if(z&&z.scrollIntoView)z.scrollIntoView({block:'end',behavior:'smooth'});else window.scrollTo(0,D.body.scrollHeight)}catch(e){window.scrollTo(0,D.body.scrollHeight)}}
function link(t){var d=D.createElement('div');d.textContent=t;return d.innerHTML.replace(/(https?:\\/\\/[^\\s<)]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>')}
function bericht(r,x){var m=D.createElement('div');m.className='m '+r;if(r==='b')m.innerHTML=link(x);else m.textContent=x;L.appendChild(m);onder();return m}
function weg(){var a=L.querySelectorAll('.k,.c');for(var i=0;i<a.length;i++)a[i].remove()}
function knoppen(k){if(!k||!k.length)return;var d=D.createElement('div');d.className='k';k.forEach(function(t){var b=D.createElement('button');b.type='button';b.textContent=t;b.onclick=function(){zeg(t,1)};d.appendChild(b)});L.appendChild(d);onder()}
function dots(){var d=D.createElement('div');d.className='m b dots';d.innerHTML='<i></i><i></i><i></i>';L.appendChild(d);onder();return d}
function bewaar(){try{localStorage.setItem('wam_lopend',JSON.stringify({sid:W.sid,tok:W.tok,t:Date.now(),msgs:msgs.slice(-30)}))}catch(e){}}
function contact(c){var d=D.createElement('div');d.className='c';var h='<p>'+W.ui.via+'</p><form><input type="email" inputmode="email" autocomplete="email" placeholder="'+W.ui.mailPh+'"><button class="mail" type="submit">'+W.ui.mailKnop+'</button></form><div class="r">';
c.forEach(function(o){if(o.soort==='tg')h+='<a class="tg" target="_blank" rel="noopener" href="'+o.url+'" data-e="contact_tg">'+W.ui.tg+'</a>';if(o.soort==='wa')h+='<a class="wa" target="_blank" rel="noopener" href="'+o.url+'" data-e="contact_wa">'+W.ui.wa+'</a>'});
h+='<button class="nee" type="button">'+W.ui.nee+'</button></div>';d.innerHTML=h;L.appendChild(d);onder();
d.querySelector('form').onsubmit=function(e){e.preventDefault();var v=d.querySelector('input').value.trim();if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v)){d.querySelector('input').focus();return}ev('contact_mail');zeg(v,0)};
d.querySelectorAll('a[data-e]').forEach(function(a){a.onclick=function(){bk(a.getAttribute('data-e'))}});
d.querySelector('.nee').onclick=function(){bk('contact_nee');d.remove()}}
function zeg(t,isKnop){t=String(t||'').trim();if(!t||bezig)return;weg();bericht('u',t);msgs.push({r:'u',x:t});bewaar();I.value='';bezig=1;S.disabled=true;var dd=dots();
post('zeg',isKnop?{sid:W.sid,tok:W.tok,knop:t}:{sid:W.sid,tok:W.tok,x:t},function(j){dd.remove();bezig=0;S.disabled=false;tBot=Date.now();typte=0;
if(!j||!j.ok){bericht('b',W.ui.fout);return}bericht('b',j.x);msgs.push({r:'b',x:j.x,k:j.knoppen});bewaar();if(j.contact)contact(j.contact);knoppen(j.knoppen)})}
F.onsubmit=function(e){e.preventDefault();zeg(I.value,0)};
I.addEventListener('input',function(){if(!typte){typte=1;ev('typt')}});
var k0=D.getElementById('k0');if(k0)k0.querySelectorAll('button').forEach(function(b){b.onclick=function(){zeg(b.textContent,1)}});
/* lopend gesprek na herladen terugzetten (30 min) */
try{var o=JSON.parse(localStorage.getItem('wam_lopend')||'null');if(o&&o.sid&&Date.now()-o.t<18e5&&o.msgs&&o.msgs.some(function(m){return m.r==='u'})){W.sid=o.sid;W.tok=o.tok;msgs=o.msgs;L.innerHTML='';msgs.forEach(function(m,i){var x=bericht(m.r,m.x);if(i===0)x.className+=' eerste'});var lm=msgs[msgs.length-1];if(lm&&lm.r==='b')knoppen(lm.k)}}catch(e){}
var dz=new Date();ev('js',{tz:(Intl.DateTimeFormat().resolvedOptions().timeZone||''),uur:dz.getHours(),scherm:screen.width+'x'+screen.height,aanraak:('ontouchstart' in window)||navigator.maxTouchPoints>0,taal:navigator.language||'',donker:matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches});
var zt=null;function zicht(){if(D.visibilityState==='visible'&&!zt)zt=setTimeout(function(){ev('zicht1')},1000)}zicht();
D.addEventListener('visibilitychange',function(){if(D.visibilityState==='hidden'){bk('verborgen',{wacht:bezig,typte:typte,ms:Date.now()-tBot})}else{zicht();bk('terug')}});
addEventListener('pagehide',function(){bk('weg',{wacht:bezig,typte:typte,ms:Date.now()-tBot})});
})();</script></body></html>`;
}

function privacy(taal) {
  const nl = taal === 'nl';
  const t = nl ? ['Privacy bij We Are Many', 'WAM is een AI-chat van AdsFair B.V. (KvK 60126035, Gouda). We bewaren je gesprek en wat je ons vertelt (je wensen en de feiten die je deelt) zodat we je beter kunnen helpen en je herkennen als je terugkomt. Daarvoor zetten we één eigen cookie (wam_v). We vragen geen naam, adres of bankgegevens.', 'Laat je je e-mail, Telegram of WhatsApp achter, dan gebruiken we die alleen om je te sturen wat je vroeg (mail via de verzenddienst Resend), en in elk bericht stop je met één klik. Wat je typt gaat via een AI-dienst (Anthropic, via Vercel) om een antwoord te maken; zoekvragen gaan naar een zoekdienst. We verkopen je gegevens niet. Cijfers die we tonen zijn anoniem en nooit naar jou te herleiden.', 'Alles laten wissen of een vraag? Mail privacy@adsfair.xyz of zeg het gewoon in de chat.']
    : ['Privacy at We Are Many', 'WAM is an AI chat by AdsFair B.V. (Dutch Chamber of Commerce 60126035, Gouda, the Netherlands). We store your conversation and what you tell us (your wishes and the facts you share) to help you better and to recognise you when you come back, using one first-party cookie (wam_v). We never ask for your name, address or bank details.', 'If you leave your email, Telegram or WhatsApp, we only use it to send you what you asked for (email via our mail service Resend), and every message has a one-click stop. What you type is processed by an AI service (Anthropic, via Vercel) to write a reply; search questions go to a search service. We do not sell your data. Numbers we show are anonymous and never traceable to you.', 'Want everything deleted, or have a question? Email privacy@adsfair.xyz or just say so in the chat.'];
  return '<!doctype html><html lang="' + (nl ? 'nl' : 'en') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + t[0] + '</title><style>body{font:16px/1.6 -apple-system,system-ui,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#1d1d1f}a{color:#0F6E56}</style></head><body><h1>' + t[0] + '</h1><p>' + t[1] + '</p><p>' + t[2] + '</p><p>' + t[3] + '</p><p><a href="/">← WAM</a></p></body></html>';
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x'); const q = k => url.searchParams.get(k) || '';
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const op = q('op') || 'pagina';
  // AI Gateway via OIDC: Vercel geeft het token per verzoek in een kop (lib/ai.js leest VERCEL_OIDC_TOKEN)
  const oidc = req.headers['x-vercel-oidc-token']; if (oidc) process.env.VERCEL_OIDC_TOKEN = String(oidc);
  try {
    if (op === 'pagina') {
      const ua = String(req.headers['user-agent'] || ''); const land = String(req.headers['x-vercel-ip-country'] || '').toUpperCase().slice(0, 2);
      const taal = W.taalVan(req.headers['accept-language'], land); const k = W.kanalen();
      res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'index, follow');
      if (W.lijktBot(ua)) { await W.tel({ bot: 1 }); return res.status(200).send(pagina({ start: null, taal, kanalen: k })); }
      let vid = cookie(req, 'wam_v'); const uitPost = q('w') ? await W.vidVanLink(q('w')) : null; if (uitPost) vid = uitPost; // link uit een mail: zelfde profiel, ook op een ander toestel
      if (!/^[0-9a-f]{16}$/.test(vid)) vid = randomBytes(8).toString('hex');
      res.setHeader('set-cookie', 'wam_v=' + vid + '; Path=/; Max-Age=31536000; SameSite=Lax; Secure');
      let stad = ''; try { stad = decodeURIComponent(String(req.headers['x-vercel-ip-city'] || '')).slice(0, 40); } catch (e) {}
      const tz = String(req.headers['x-vercel-ip-timezone'] || '').slice(0, 40); const app = W.apparaat(ua);
      const ctx = { test: beschermd(host) || undefined, taal: q('taal') && beschermd(host) ? q('taal') : taal, land, stad, tz, uur: W.lokaalUur(tz), os: app.os, mobiel: app.mobiel, app: app.app, asn: String(req.headers['x-vercel-ip-as-number'] || '').slice(0, 10), ref: String(req.headers.referer || '').slice(0, 120) };
      // scherm-proef forceren om te testen, alleen op de beschermde host: ?ux=opener:chat,keuzes:pillen,invoer:inline
      if (beschermd(host) && q('ux')) { const t = {}; for (const x of q('ux').split(',')) { const [d, v] = x.split(':'); if (W.UX[d] && W.UX[d].includes(v)) t[d] = v; } ctx.uxTest = t; }
      const params = { n: schoon(q('n'), /^[a-z]{2,12}$/), z: schoon(q('z'), /^[\w{}\[\]-]{1,20}$/), c: schoon(q('c'), /^[\w{}\[\]-]{1,20}$/), b: schoon(q('b'), /^[\w{}\[\]-]{1,20}$/), mmc: schoon(q('mmc'), /^[0-9a-f]{8,24}$/) };
      const start = await W.startSessie({ vid, ctx, params });
      return res.status(200).send(pagina({ start, taal, kanalen: k }));
    }
    if (op === 'zeg') {
      // GET alleen op de beschermde host, om te testen (?sid=&tok=&x=)
      if (req.method !== 'POST' && !beschermd(host)) return res.status(405).json({ ok: false });
      const b = req.method === 'POST' ? leesBody(req) : { sid: q('sid'), tok: q('tok'), x: q('x'), knop: q('knop') }; const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0];
      return res.status(200).json(await W.zeg({ sid: b.sid, tok: b.tok, x: b.x, knop: b.knop, ip }));
    }
    if (op === 'ev') { const b = leesBody(req); return res.status(200).json(await W.gebeurtenis(b.sid, b.tok, String(b.e || ''), b.d || {})); }
    if (op === 'beeld') {
      const img = await beeld(q('h'), q('t') || 'en', q('v') === 'icon' ? 'icon' : 'img'); const buf = Buffer.from(await img.arrayBuffer());
      res.setHeader('content-type', 'image/png'); res.setHeader('cache-control', 'public, max-age=86400, s-maxage=604800'); return res.status(200).send(buf);
    }
    if (op === 'hooks') return res.status(200).json({ ok: true, hooks: Object.fromEntries(Object.entries(HOOKS).map(([h, v]) => [h, { familie: v.familie, en: v.en, nl: v.nl, de: v.de }])) });
    if (op === 'robots') { res.setHeader('content-type', 'text/plain'); return res.status(200).send('User-agent: *\nAllow: /\nDisallow: /api/\n'); }
    if (op === 'llms') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('# We Are Many (wearemany.now)\n\nWAM is a free AI chat that acts as your own personal fixer: it helps people pay less (energy, phone, internet, insurance, subscriptions), cancel subscriptions, compare deals, write complaints, and find what they want. It looks things up live and remembers what you asked, so it can tell you when something changes. People with the same wish are bundled so they get better deals together.\n\nWAM sells nothing and takes no commission on recommendations. Run by AdsFair B.V., Gouda, the Netherlands.\n'); }
    if (op === 'privacy') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(privacy(W.taalVan(req.headers['accept-language'], req.headers['x-vercel-ip-country']))); }
    if (op === 'leer') {
      if (!isCron(req) && !beschermd(host)) return res.status(404).send('Niet gevonden');
      return res.status(200).json(await W.leerRonde({ forceer: beschermd(host) && q('forceer') === '1' }));
    }
    if (op === 'stand') {
      if (!beschermd(host)) return res.status(404).send('Niet gevonden');
      res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store'); return res.status(200).send(await W.standHtml());
    }
    if (op === 'cijfers') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, ...(await W.cijfers(Math.min(14, Number(q('dagen')) || 3))), kostVandaag: await W.kostVandaag() }); }
    if (op === 'hookzet') {
      if (!beschermd(host)) return res.status(404).send('Niet gevonden');
      let l = []; try { l = JSON.parse(q('j') || '[]'); } catch (e) { return res.status(400).json({ ok: false, fout: 'j is geen JSON' }); }
      const uit = []; for (const x of (Array.isArray(l) ? l : []).slice(0, 80)) { if (!HOOKS[x.hook]) { uit.push({ b: x.b, fout: 'onbekende hook' }); continue; } const t = hookTekst(x.hook, x.taal || 'en'); uit.push({ b: x.b, ok: await W.zetHook(x.b, { hook: x.hook, familie: HOOKS[x.hook].familie, tekst: t && t.titel, taal: x.taal || 'en', camp: x.c || '' }) }); }
      return res.status(200).json({ ok: true, uit });
    }
    if (op === 'gesprekken') {
      if (!beschermd(host)) return res.status(404).send('Niet gevonden');
      res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store'); return res.status(200).send(await W.gesprekkenHtml({ dagen: q('dagen'), min: q('min') === '' ? 1 : q('min') }));
    }
    if (op === 'stop') { // stoplink uit een mail (GET via de link, POST via List-Unsubscribe one-click)
      const weer = q('weer') === '1'; const p = await W.stopPost(q('w'), weer); if (req.method === 'POST') return res.status(200).json({ ok: !!p });
      const nl = p && p.taal === 'nl', de = p && p.taal === 'de'; res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('x-robots-tag', 'noindex');
      const t = !p ? 'Link niet (meer) geldig / link not valid.' : weer ? (nl ? 'Je krijgt weer berichten als je iets vraagt.' : de ? 'Du bekommst wieder Nachrichten, wenn du etwas anfragst.' : 'You will get messages again when you ask for something.') : (nl ? 'Klaar: je krijgt geen berichten meer van WAM.' : de ? 'Erledigt: du bekommst keine Nachrichten mehr von WAM.' : 'Done: you will not get any more messages from WAM.');
      const terug = p && !weer ? '<p><a href="/api/wam?op=stop&w=' + encodeURIComponent(q('w')) + '&weer=1">' + (nl ? 'Toch weer aanzetten' : de ? 'Doch wieder einschalten' : 'Turn back on') + '</a></p>' : '';
      return res.status(200).send('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WAM</title><style>body{font:17px/1.6 -apple-system,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:28px 20px;color:#1d1d1f}a{color:#0F6E56}</style></head><body><p><b>WAM</b></p><p>' + t + '</p>' + terug + '<p><a href="/">wearemany.now</a></p></body></html>');
    }
    if (op === 'post') { if (!isCron(req) && !beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, ...(await W.beloftenRonde()), stand: await W.beloftenStand() }); }
    if (op === 'postvoorbeeld') {
      if (!beschermd(host)) return res.status(404).send('Niet gevonden'); const r = await W.postVoorbeeld(q('vid'), q('id'));
      if (q('html') === '1' && r.ok) { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(r.html); } return res.status(200).json(r);
    }
    if (op === 'maildomein') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await POST.domein(q('maak') === '1')); }
    if (op === 'tg') {
      const tok = process.env.WAM_TG_TOKEN; if (!tok) return res.status(404).send('');
      const geheim = createHmac('sha256', tok).update('wam-tg').digest('hex').slice(0, 32);
      if (req.headers['x-telegram-bot-api-secret-token'] !== geheim) return res.status(401).send('');
      await W.telegramUpdate(leesBody(req)); return res.status(200).json({ ok: true });
    }
    if (op === 'tgzet') {
      if (!beschermd(host)) return res.status(404).send('Niet gevonden'); const tok = process.env.WAM_TG_TOKEN; if (!tok) return res.status(400).json({ ok: false, fout: 'WAM_TG_TOKEN ontbreekt' });
      const geheim = createHmac('sha256', tok).update('wam-tg').digest('hex').slice(0, 32);
      const r = await fetch('https://api.telegram.org/bot' + tok + '/setWebhook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://wearemany.now/api/wam?op=tg', secret_token: geheim, allowed_updates: ['message'] }) });
      return res.status(200).json({ ok: r.ok, telegram: await r.json().catch(() => null) });
    }
    return res.status(404).json({ ok: false, fout: 'onbekende op' });
  } catch (e) {
    return res.status(500).json({ ok: false, fout: String(e && e.message || e).slice(0, 200) });
  }
}
