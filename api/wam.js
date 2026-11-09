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

function pagina({ start, taal, kanalen }) {
  const u = ui(taal); const o = start ? start.opener : { tekst: taal === 'nl' ? 'Hoi! Ik ben WAM. Waar kan ik je mee helpen?' : 'Hi! I\'m WAM. What can I help you with?', knoppen: [] };
  const data = { sid: start ? start.sid : '', tok: start ? start.tok : '', taal, ui: u, kanalen, opener: o };
  return `<!doctype html><html lang="${esc(taal)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content">
<title>We Are Many: ${esc(u.sub)}</title><meta name="description" content="WAM is a free AI chat that helps you pay less, cancel subscriptions, compare deals and get things sorted, and bundles people with the same wish.">
<meta property="og:title" content="We Are Many"><meta property="og:description" content="${esc(u.sub)}"><meta name="theme-color" content="#0F6E56">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230F6E56'/%3E%3Ctext x='32' y='42' font-size='26' font-family='Arial' font-weight='700' fill='white' text-anchor='middle'%3EW%3C/text%3E%3C/svg%3E">
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%}body{font:16px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f4f4f1;color:#1d1d1f;display:flex;flex-direction:column;height:100dvh}
#top{flex:0 0 auto;padding:8px 14px;font-size:13px;color:#5f5e5a;display:flex;justify-content:space-between;align-items:center}#top b{color:#0F6E56;font-size:14px}#top a{color:#5f5e5a;text-decoration:none}
#log{flex:1 1 auto;overflow-y:auto;padding:6px 12px 12px;-webkit-overflow-scrolling:touch}
.m{max-width:86%;margin:6px 0;padding:10px 13px;border-radius:18px;white-space:pre-wrap;word-wrap:break-word;animation:in .18s ease-out}
.b{background:#fff;border:1px solid #e6e5df;border-bottom-left-radius:6px}.u{background:#0F6E56;color:#fff;margin-left:auto;border-bottom-right-radius:6px}
.b a{color:#0F6E56}.k{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px}.k button{font:inherit;font-size:15px;border:1.5px solid #0F6E56;color:#0F6E56;background:#fff;border-radius:999px;padding:8px 14px;cursor:pointer}
.k button:active{background:#e1f5ee}.dots{display:inline-flex;gap:4px;padding:14px 16px}.dots i{width:7px;height:7px;border-radius:50%;background:#b4b2a9;animation:d 1s infinite}.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
.c{background:#fff;border:1px solid #e6e5df;border-radius:16px;padding:12px;margin:6px 0 10px;max-width:92%}.c p{margin:0 0 8px;font-size:14px;color:#5f5e5a}.c form{display:flex;gap:8px}.c input{flex:1;font:inherit;padding:10px 12px;border:1px solid #d3d1c7;border-radius:12px;min-width:0}
.c .r{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.c a,.c button{font:inherit;font-size:15px;border-radius:12px;padding:10px 14px;border:0;cursor:pointer;text-decoration:none;text-align:center}
.mail{background:#0F6E56;color:#fff}.tg{background:#229ED9;color:#fff}.wa{background:#25D366;color:#fff}.nee{background:#f1efe8;color:#5f5e5a}
#f{flex:0 0 auto;display:flex;gap:8px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:#f4f4f1;border-top:1px solid #e6e5df}
#i{flex:1;font:inherit;padding:11px 14px;border:1px solid #d3d1c7;border-radius:22px;background:#fff;min-width:0;outline:none}#i:focus{border-color:#0F6E56}
#s{font:inherit;border:0;background:#0F6E56;color:#fff;border-radius:22px;padding:0 18px;cursor:pointer}#s:disabled{opacity:.5}
@keyframes in{from{opacity:0;transform:translateY(4px)}to{opacity:1}}@keyframes d{0%,80%,100%{opacity:.3}40%{opacity:1}}
</style></head><body>
<div id="top"><span><b>We Are Many</b> · ${esc(u.sub)}</span><a href="/privacy">${esc(u.privacy)}</a></div>
<div id="log" aria-live="polite"><div class="m b">${esc(o.tekst)}</div><div class="k" id="k0">${(o.knoppen || []).map(k => '<button type="button">' + esc(k) + '</button>').join('')}</div></div>
<form id="f" autocomplete="off"><input id="i" enterkeyhint="send" placeholder="${esc(u.ph)}" aria-label="${esc(u.ph)}"><button id="s" type="submit">${esc(u.stuur)}</button></form>
<noscript><p style="padding:12px">WAM is a chat. Please enable JavaScript.</p></noscript>
<script>window.WAM=${JSON.stringify(data).replace(/</g, '\\u003c')};</script>
<script>(function(){var W=window.WAM,D=document,L=D.getElementById('log'),F=D.getElementById('f'),I=D.getElementById('i'),S=D.getElementById('s');
var bezig=0,typte=0,tBot=Date.now(),msgs=[{r:'b',x:W.opener.tekst,k:W.opener.knoppen}];
function post(op,b,cb){try{fetch('/api/wam?op='+op,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b),keepalive:op==='ev'}).then(function(r){return r.json()}).then(function(j){cb&&cb(j)}).catch(function(){cb&&cb(null)})}catch(e){cb&&cb(null)}}
function bk(e,d){var b=JSON.stringify({sid:W.sid,tok:W.tok,e:e,d:d||{}});try{if(!(navigator.sendBeacon&&navigator.sendBeacon('/api/wam?op=ev',new Blob([b],{type:'text/plain'}))))post('ev',JSON.parse(b))}catch(x){}}
function ev(e,d){if(W.sid)post('ev',{sid:W.sid,tok:W.tok,e:e,d:d||{}})}
function onder(){L.scrollTop=L.scrollHeight}
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
try{var o=JSON.parse(localStorage.getItem('wam_lopend')||'null');if(o&&o.sid&&Date.now()-o.t<18e5&&o.msgs&&o.msgs.some(function(m){return m.r==='u'})){W.sid=o.sid;W.tok=o.tok;msgs=o.msgs;L.innerHTML='';msgs.forEach(function(m){bericht(m.r,m.x)});var lm=msgs[msgs.length-1];if(lm&&lm.r==='b')knoppen(lm.k)}}catch(e){}
var dz=new Date();ev('js',{tz:(Intl.DateTimeFormat().resolvedOptions().timeZone||''),uur:dz.getHours(),scherm:screen.width+'x'+screen.height,aanraak:('ontouchstart' in window)||navigator.maxTouchPoints>0,taal:navigator.language||'',donker:matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches});
var zt=null;function zicht(){if(D.visibilityState==='visible'&&!zt)zt=setTimeout(function(){ev('zicht1')},1000)}zicht();
D.addEventListener('visibilitychange',function(){if(D.visibilityState==='hidden'){bk('verborgen',{wacht:bezig,typte:typte,ms:Date.now()-tBot})}else{zicht();bk('terug')}});
addEventListener('pagehide',function(){bk('weg',{wacht:bezig,typte:typte,ms:Date.now()-tBot})});
})();</script></body></html>`;
}

function privacy(taal) {
  const nl = taal === 'nl';
  const t = nl ? ['Privacy bij We Are Many', 'WAM is een AI-chat van AdsFair B.V. (KvK 60126035, Gouda). We bewaren je gesprek en wat je ons vertelt (je wensen en de feiten die je deelt) zodat we je beter kunnen helpen en je herkennen als je terugkomt. Daarvoor zetten we één eigen cookie (wam_v). We vragen geen naam, adres of bankgegevens.', 'Laat je je e-mail, Telegram of WhatsApp achter, dan gebruiken we die alleen om je te laten weten wat je vroeg. Wat je typt gaat via een AI-dienst (Anthropic, via Vercel) om een antwoord te maken; zoekvragen gaan naar een zoekdienst. We verkopen je gegevens niet. Cijfers die we tonen zijn anoniem en nooit naar jou te herleiden.', 'Alles laten wissen of een vraag? Mail privacy@adsfair.xyz of zeg het gewoon in de chat.']
    : ['Privacy at We Are Many', 'WAM is an AI chat by AdsFair B.V. (Dutch Chamber of Commerce 60126035, Gouda, the Netherlands). We store your conversation and what you tell us (your wishes and the facts you share) to help you better and to recognise you when you come back, using one first-party cookie (wam_v). We never ask for your name, address or bank details.', 'If you leave your email, Telegram or WhatsApp, we only use it to tell you what you asked for. What you type is processed by an AI service (Anthropic, via Vercel) to write a reply; search questions go to a search service. We do not sell your data. Numbers we show are anonymous and never traceable to you.', 'Want everything deleted, or have a question? Email privacy@adsfair.xyz or just say so in the chat.'];
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
      let vid = cookie(req, 'wam_v'); if (!/^[0-9a-f]{16}$/.test(vid)) vid = randomBytes(8).toString('hex');
      res.setHeader('set-cookie', 'wam_v=' + vid + '; Path=/; Max-Age=31536000; SameSite=Lax; Secure');
      let stad = ''; try { stad = decodeURIComponent(String(req.headers['x-vercel-ip-city'] || '')).slice(0, 40); } catch (e) {}
      const tz = String(req.headers['x-vercel-ip-timezone'] || '').slice(0, 40); const app = W.apparaat(ua);
      const ctx = { test: beschermd(host) || undefined, taal: q('taal') && beschermd(host) ? q('taal') : taal, land, stad, tz, uur: W.lokaalUur(tz), os: app.os, mobiel: app.mobiel, app: app.app, asn: String(req.headers['x-vercel-ip-as-number'] || '').slice(0, 10), ref: String(req.headers.referer || '').slice(0, 120) };
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
