// We Are Many (wearemany.now): de chat die meteen start (Henkjan 9 nov 2026). Logica in lib/wam.js, hooks en beelden in lib/wam-hooks.js.
//   GET  /                         (wearemany.now) de chat; de server kiest de opener en zet hem in de pagina
//   POST /api/wam?op=zeg           { sid, tok, x | knop }  -> antwoord van de bot
//   POST /api/wam?op=ev            { sid, tok, e, d }      gebeurtenis uit de browser (js, zicht1, typt, verborgen, terug, weg, contact_*)
//   GET  /api/wam?op=beeld&h=&t=&v=icon|img                 advertentiebeeld per hook
//   GET  /api/wam?op=leer          leerronde (cron, elk uur) ; ?forceer=1 op de beschermde host
//   GET  /api/wam?op=stand         eigenaarspagina (alleen op *.vercel.app, achter Vercel-inlog)
//   GET  /api/wam?op=hookzet&j=    advertentie-id -> hook vastleggen (beschermde host); j = [{"b":"123","hook":"teveel"}]
//   POST /api/wam?op=wareg|wain|wauit  WhatsApp-koppeling (sleutel van de koppeling, trust on first use); GET op=wastand (beschermde host)
//   POST /api/wam?op=tg            Telegram-webhook (als WAM_TG_TOKEN er is); GET op=tgzet zet de webhook (beschermde host)
//   GET  /privacy, /robots.txt, /llms.txt
import * as PUSH from '../lib/wam-push.js';
import { randomBytes, createHmac } from 'node:crypto';
import * as W from '../lib/wam.js';
import * as LEER from '../lib/wam-leer.js';
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
function pagina({ start, taal, kanalen, vapid, w, bord, erger, meta }) {
  // contactkaart: zodra Telegram of WhatsApp echt antwoordt, belooft de kaart dat je daar verder kunt praten (relatie, niet alleen een mail)
  const verder = (kanalen || []).filter(k => k === 'Telegram' || k === 'WhatsApp');
  const u = Object.assign({}, ui(taal), verder.length ? { via: { nl: 'Praat verder via ' + verder.join(' of ') + ', of laat je mail achter. Ik weet nog waar we waren.', de: 'Schreib mir weiter auf ' + verder.join(' oder ') + ' oder hinterlass deine E-Mail. Ich weiß noch, wo wir waren.' }[taal] || 'Keep talking on ' + verder.join(' or ') + ', or leave your email. I\'ll remember where we were.' } : {});
  const o = start ? start.opener : { tekst: taal === 'nl' ? 'Hoi! Ik ben WAM. Waar kan ik je mee helpen?' : 'Hi! I\'m WAM. What can I help you with?', knoppen: [] };
  const ux = (start && start.ux) || { opener: 'held', keuzes: 'kaarten', invoer: 'vast' };
  // beginscherm met kernzin (scherm p1-p3) en groepsvraag (kring): eigen opbouw, invoer direct onder de vraag (Henkjan 12 nov 21:53 UTC)
  const P = start && start.punch, K = start && start.kring, talk = ux.naam === 'talk';
  const kl = Object.entries(ux).map(([d, v]) => 'ux-' + d + '-' + v).join(' ') + (P || K ? ' pk-aan ux-invoer-inline' : '');
  // kop lerend (Henkjan 10 nov: "Fixer niet maar matchmaker, connection"): drie varianten, Thompson in wam:ux (onderdeel kop)
  const KOP = { match: { en: 'your matchmaker for anything', nl: 'jouw matchmaker voor alles', de: 'dein Matchmaker für alles' }, connect: { en: 'we connect who needs with who offers', nl: 'we verbinden wie zoekt met wie biedt', de: 'wir verbinden, wer sucht, mit wer bietet' }, commons: { en: 'a commons: put in anything you offer or need', nl: 'een commons: zet erin wat je biedt of zoekt', de: 'eine Allmende für alles, was du bietest oder suchst' }, many: { en: 'one chat, hundreds of people', nl: 'één chat, honderden mensen', de: 'ein Chat, Hunderte Leute' } };
  if (KOP[ux.kop]) u.sub = KOP[ux.kop][taal] || KOP[ux.kop].en;
  u.uitslag = { nl: '{n} antwoorden tot nu toe', de: '{n} Antworten bisher' }[taal] || '{n} answers so far';
  u.terms = { nl: 'Voorwaarden', de: 'Bedingungen' }[taal] || 'Terms'; u.contact = { nl: 'Contact', de: 'Kontakt' }[taal] || 'Contact';
  u.contactPre = { nl: 'Hoi WAM-team, ', de: 'Hallo WAM-Team, ' }[taal] || 'Hi WAM team, ';
  u.push = { nl: 'Meld me op mijn telefoon', de: 'Benachrichtige mich' }[taal] || 'Notify me on my phone';
  u.viaPush = { nl: 'Eén tik en je krijgt een melding op je telefoon zodra ik het heb. Geen naam, geen nummer.', de: 'Ein Tipp und du bekommst eine Nachricht aufs Handy, sobald ich es habe. Kein Name, keine Nummer.' }[taal] || 'One tap and I\'ll notify you on your phone as soon as I have it. No name, no number.';
  // Bewaren zonder contact (10 nov: 9 van 9 meldingen bij de contactknop mislukten, 0 contact): stuur jezelf de link
  u.bw = { nl: 'Dan geen melding. Bewaar dit gesprek in één tik: stuur de link naar jezelf en open hem wanneer je wilt. Ik weet nog waar we waren.', de: 'Dann keine Benachrichtigung. Speichere den Chat mit einem Tipp: schick dir den Link und öffne ihn, wann du willst. Ich weiß noch, wo wir waren.' }[taal] || 'No notification then. Save this chat in one tap: send the link to yourself and open it anytime. I\'ll remember where we were.';
  u.bwWa = { nl: 'Naar mijn WhatsApp', de: 'An mein WhatsApp' }[taal] || 'Send to my WhatsApp';
  u.bwDeel = { nl: 'Bewaar of deel', de: 'Speichern oder teilen' }[taal] || 'Save or share';
  u.bwKopie = { nl: 'Kopieer link', de: 'Link kopieren' }[taal] || 'Copy link';
  u.bwKlaar = { nl: 'Gekopieerd', de: 'Kopiert' }[taal] || 'Copied';
  u.bwTekst = { nl: 'Mijn WAM-gesprek:', de: 'Mein WAM-Chat:' }[taal] || 'My WAM chat:';
  if (P) u.ph = P.ph; if (K && !K.eigen) u.ph = K.ph;
  const data = { sid: start ? start.sid : '', tok: start ? start.tok : '', taal, ui: u, kanalen, opener: o, ux, punch: P ? { kl: P.kl || '' } : null, kring: K || null, vapid: vapid || '', w: w || '', gid: process.env.WAM_GOOGLE_CLIENT_ID || '', wa: (start && start.wa) || null };
  return `<!doctype html><html lang="${esc(taal)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content">
<title>${esc(meta ? meta.titel : (talk ? 'Talk to Many: ' : 'We Are Many: ') + u.sub)}</title><meta name="description" content="WAM is a free AI matchmaker chat: tell it what you offer or need (a room, work, a service, a better deal) and it connects you with people who match, anonymously until you both say yes.">
<meta property="og:title" content="${esc(meta ? meta.titel : (talk ? 'Talk to Many' : 'We Are Many'))}"><meta property="og:description" content="${esc(meta ? meta.tekst : u.sub)}"><meta name="theme-color" content="#FFFFFF">
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
.pu{border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin:4px 0 8px;max-width:520px;animation:in .2s ease-out}.pt{font-size:13px;color:var(--muted);margin:0 0 6px}.pr{display:grid;grid-template-columns:minmax(96px,40%) 1fr 42px;gap:10px;align-items:center;margin:7px 0;font-size:15px;color:var(--ink)}.pb{height:10px;background:var(--soft);border-radius:99px;overflow:hidden}.pb i{display:block;height:100%;background:var(--line2);border-radius:99px;transition:width .6s ease-out}.pr.jij{font-weight:700}.pr.jij .pb i{background:var(--accent)}.pp{text-align:right;font-variant-numeric:tabular-nums}
.mail{background:var(--accent);color:var(--accent-ink)}.c .push{display:block;width:100%;margin:0 0 12px;padding:14px 16px;font-size:16px;font-weight:700;background:var(--accent);color:var(--accent-ink)}.tg{background:#229ED9;color:#fff}.wa{background:#25D366;color:#06301a}.nee{background:transparent;color:var(--muted);box-shadow:inset 0 0 0 1px var(--line)}
#f{display:flex;gap:10px;align-items:center}
.ux-invoer-vast #f{position:fixed;left:0;right:0;bottom:0;z-index:4;background:var(--bg);border-top:1px solid var(--line);padding:12px max(16px,calc(50% - 360px)) calc(12px + env(safe-area-inset-bottom))}
.ux-invoer-inline #f{max-width:720px;margin:0 auto;padding:0 20px 40px}
#i{flex:1;min-width:0;font:inherit;font-size:16px;padding:13px 18px;border:1px solid var(--line2);border-radius:999px;background:var(--bg);color:var(--ink);outline:none}#i:focus{border-color:var(--accent)}
#s{flex:none;width:48px;height:48px;border:0;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:20px;font-weight:700;display:flex;align-items:center;justify-content:center}#s:disabled{opacity:.45}
.vt{position:absolute;left:-9999px}
.ft{max-width:720px;margin:0 auto;padding:4px 20px 28px;font-size:12px;color:var(--line2)}.ft a{color:inherit;text-decoration:none}.ft a:hover{color:var(--muted)}.ux-invoer-vast .ft{padding-bottom:96px}
.bord{margin:4px 0 18px;padding:14px 14px 12px;border:1px solid var(--line);border-radius:14px;background:var(--soft);animation:in .25s ease-out}.bt{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px}.bt span{letter-spacing:0;text-transform:none}.bt i{width:8px;height:8px;border-radius:50%;background:var(--ok);display:inline-block;animation:p 1.6s infinite}.bcs{display:flex;flex-wrap:wrap;gap:8px}.bc{border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:8px 14px;font-size:14px;color:var(--ink);text-align:left}.bc b{color:var(--accent);font-variant-numeric:tabular-nums}.bc:active{background:var(--soft)}@keyframes p{0%,100%{opacity:1}50%{opacity:.35}}
.pk{font-size:clamp(28px,6.6vw,42px);line-height:1.12;letter-spacing:-.035em;font-weight:700;color:var(--ink);margin:22px 0 14px;text-wrap:balance;animation:in .25s ease-out}.pk.kq{font-size:clamp(24px,5.6vw,34px)}.live{margin:0 0 22px;font-size:14px;line-height:1.45;color:var(--muted)}.live p{margin:3px 0}.ln{display:flex;align-items:center;gap:8px;color:var(--ink);font-weight:600}.ln i{width:8px;height:8px;border-radius:50%;background:var(--ok);display:inline-block;animation:p 1.6s infinite}.pk-aan .m.eerste{font-size:19px;font-weight:600;color:var(--ink);margin:0 0 12px}.klw{max-width:720px;margin:-26px auto 0;padding:0 20px 30px}.klw button{background:none;border:0;padding:6px 0;font:inherit;font-size:15px;color:var(--accent);font-weight:600;text-align:left;cursor:pointer}
@keyframes in{from{opacity:0;transform:translateY(5px)}to{opacity:1}}@keyframes d{0%,80%,100%{opacity:.25}40%{opacity:1}}
</style><script src="/cm.js" data-site="wam" async></script></head><body class="${esc(kl)}">
<header class="top"><div class="top-in"><a class="brand" href="/" id="logo">${talk ? 'Talk to' : 'We Are'} <span>Many</span></a>${P || K ? '' : '<span class="eb"><span class="dot" aria-hidden="true"></span>' + esc(u.sub) + '</span>'}</div></header>
<main id="log" aria-live="polite">${P ? '<div class="pk">' + esc(P.kop) + '</div>' + (P.live && (P.live.nu || P.live.dag) ? '<div class="live">' + (P.live.nu ? '<p class="ln"><i aria-hidden="true"></i>' + esc(P.live.nu) + '</p>' : '') + (P.live.dag ? '<p class="lv">' + esc(P.live.dag) + '</p>' : '') + '</div>' : '') : ''}${K && !K.eigen ? '<div class="pk kq">' + esc(K.vraag) + '</div><div class="live"><p class="lv">' + esc(K.sub) + '</p></div>' : ''}<div class="m b eerste">${esc(o.tekst)}</div><div class="k" id="k0">${(o.knoppen || []).map(k => '<button type="button">' + esc(k) + '</button>').join('')}</div>${bord ? '<div class="bord" id="bord"><div class="bt"><i aria-hidden="true"></i>' + esc(bord.titel) + (bord.vandaag ? '<span> · ' + esc(bord.vandaag) + '</span>' : '') + '</div><div class="bcs">' + bord.chips.map(c => '<button type="button" class="bc" data-k="' + esc(c.knop) + '"><b>' + c.n + '</b> ' + esc(c.lab) + '</button>').join('') + '</div></div>' : ''}${erger ? '<div class="bord erg" id="erger"><div class="bt">' + esc(erger.titel) + '</div><div class="bcs">' + erger.chips.map(c => '<button type="button" class="bc" data-k="' + esc(c.knop) + '">' + esc(c.lab) + ' <b>' + c.p + '%</b></button>').join('') + '<button type="button" class="bc" data-k="' + esc(erger.eigen) + '">' + esc(erger.eigen) + '</button></div></div>' : ''}</main>
<form id="f" autocomplete="off"><label class="vt" for="i">${esc(u.ph)}</label><input id="i" enterkeyhint="send" placeholder="${esc(u.ph)}"><button id="s" type="submit" aria-label="${esc(u.stuur)}">→</button></form>${P && P.kl ? '<p class="klw"><button type="button" id="kl">' + esc(P.kl) + '</button></p>' : ''}
<footer class="ft">© We Are Many · <a href="/privacy">${esc(u.privacy)}</a> · <a href="/terms">${esc(u.terms)}</a> · <a href="#" id="ct">${esc(u.contact)}</a></footer>
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
function weg(){var a=L.querySelectorAll('.k,.c,.bord');for(var i=0;i<a.length;i++)a[i].remove()}
function knoppen(k){if(!k||!k.length)return;var d=D.createElement('div');d.className='k';k.forEach(function(t){var b=D.createElement('button');b.type='button';b.textContent=t;b.onclick=function(){if(t===W.cpil){if(kanPush())meldDirect();else setTimeout(bewaarDeel,2500)}zeg(t,1)};d.appendChild(b)});L.appendChild(d);onder()}
function dots(){var d=D.createElement('div');d.className='m b dots';d.innerHTML='<i></i><i></i><i></i>';L.appendChild(d);onder();return d}
function bewaar(){try{localStorage.setItem('wam_lopend',JSON.stringify({sid:W.sid,tok:W.tok,t:Date.now(),msgs:msgs.slice(-30)}))}catch(e){}}
function esc2(t){var x=D.createElement('div');x.textContent=t;return x.innerHTML}
function uitslag(p){var d=D.createElement('div');d.className='pu';var h='<div class="pt">'+W.ui.uitslag.replace('{n}',p.n)+'</div>';p.opties.forEach(function(o){h+='<div class="pr'+(o.jij?' jij':'')+'"><span>'+esc2(o.k)+(o.jij?' ✓':'')+'</span><span class="pb"><i style="width:0" data-w="'+o.p+'"></i></span><span class="pp">'+o.p+'%</span></div>'});d.innerHTML=h;L.appendChild(d);setTimeout(function(){d.querySelectorAll('i[data-w]').forEach(function(i){i.style.width=i.getAttribute('data-w')+'%'})},30);onder()}
function b64(x){x=x.replace(/-/g,'+').replace(/_/g,'/');x+='='.repeat((4-x.length%4)%4);var r=atob(x),a=new Uint8Array(r.length);for(var i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a}
function meldMe(b){b.disabled=true;bk('contact_push_tik');navigator.serviceWorker.register('/sw.js').then(function(){return navigator.serviceWorker.ready}).then(function(reg){return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(W.vapid)})}).then(function(sub){post('push',{sid:W.sid,tok:W.tok,sub:sub.toJSON()},function(j){if(j&&j.ok){weg();bericht('b',j.x);msgs.push({r:'b',x:j.x});bewaar()}else{b.disabled=false}})}).catch(function(){b.disabled=false;bk('contact_push_nee')})}
function kanPush(){return ('serviceWorker' in navigator)&&('PushManager' in window)&&!!W.vapid}
function meldDirect(){bk('contact_push_direct');var pr;try{pr=(window.Notification&&Notification.requestPermission)?Notification.requestPermission():Promise.resolve('default')}catch(e){pr=Promise.resolve('default')}Promise.resolve(pr).then(function(){return navigator.serviceWorker.register('/sw.js')}).then(function(){return navigator.serviceWorker.ready}).then(function(reg){return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(W.vapid)})}).then(function(sub){post('push',{sid:W.sid,tok:W.tok,sub:sub.toJSON()},function(j){if(j&&j.ok){var w=function(){var c=L.querySelectorAll('.c');for(var i=0;i<c.length;i++)c[i].remove();bericht('b',j.x);msgs.push({r:'b',x:j.x});bewaar()};if(bezig)setTimeout(w,1500);else w()}})}).catch(function(x){bk('contact_push_nee');var p='';try{p=window.Notification?Notification.permission:''}catch(e){}bk(p==='denied'?'push_denied':p==='default'?'push_default':'push_fout');setTimeout(bewaarDeel,bezig?1800:300)})}
function bewaarDeel(){if(!W.w||L.querySelector('.bw'))return;var u='https://wearemany.now/?w='+W.w+'&van=bewaar',tx=W.ui.bwTekst+' '+u,d=D.createElement('div');d.className='c bw';var h='<p>'+W.ui.bw+'</p><div class="r"><a class="wa" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(tx)+'" data-e="bewaar_wa">'+W.ui.bwWa+'</a>';if(navigator.share)h+='<button class="deel" type="button">'+W.ui.bwDeel+'</button>';h+='<button class="kop" type="button">'+W.ui.bwKopie+'</button></div>';d.innerHTML=h;L.appendChild(d);onder();bk('bewaar_toon');
d.querySelectorAll('a[data-e]').forEach(function(a){a.onclick=function(){bk(a.getAttribute('data-e'))}});var sb=d.querySelector('.deel');if(sb)sb.onclick=function(){bk('bewaar_share');try{navigator.share({title:'WAM',text:W.ui.bwTekst,url:u}).catch(function(){})}catch(e){}};
d.querySelector('.kop').onclick=function(){var k=this;bk('bewaar_kopie');try{navigator.clipboard.writeText(u).then(function(){k.textContent=W.ui.bwKlaar}).catch(function(){prompt('',u)})}catch(e){prompt('',u)}}}
function waKaart(k){if(k&&k.nr&&!L.querySelector('.wnr')){var d0=D.createElement('div');d0.className='c bw wnr';d0.innerHTML='<p>'+k.x+'</p><form><input type="tel" inputmode="tel" autocomplete="tel" name="tel" value="'+(k.cc||'')+(k.cc?' ':'')+'"><button class="wa" type="submit">'+k.label+'</button></form>';L.appendChild(d0);onder();var ip=d0.querySelector('input');try{ip.focus();ip.setSelectionRange(ip.value.length,ip.value.length)}catch(e){}bk('wanr_toon');d0.querySelector('form').onsubmit=function(e){e.preventDefault();var v=ip.value.trim();if(v.replace(/\\D/g,'').length<8){ip.focus();return}bk('wanr_tik');d0.remove();zeg(v,0)};return}if(!k||!k.url||L.querySelector('.wk'))return;var d=D.createElement('div');d.className='c bw wk';d.innerHTML='<p>'+k.x+'</p><div class="r"><a class="wa" target="_blank" rel="noopener" href="'+k.url+'">'+k.label+'</a></div>';L.appendChild(d);onder();d.querySelector('a.wa').onclick=function(){bk('wa_tik')}}
function deelKaart(k){var ev=k&&k.e||'deel',cl=ev==='kring'?'kk':'dk';if(!k||!k.url||L.querySelector('.'+cl))return;var tx=k.tx||(k.m+' '+k.url),d=D.createElement('div');d.className='c bw '+cl;var h='<p>'+k.x+'</p><div class="r"><a class="wa" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(tx)+'">'+k.ui.wa+'</a>';if(navigator.share)h+='<button class="deel" type="button">'+k.ui.deel+'</button>';h+='<button class="kop" type="button">'+k.ui.kop+'</button></div>';d.innerHTML=h;L.appendChild(d);onder();
d.querySelector('a.wa').onclick=function(){bk(ev+'_wa')};var sb=d.querySelector('.deel');if(sb)sb.onclick=function(){bk(ev+'_share');try{navigator.share(k.tx?{text:k.tx}:{title:'WAM',text:k.m,url:k.url}).catch(function(){})}catch(e){}};
d.querySelector('.kop').onclick=function(){var b=this;bk(ev+'_kopie');try{navigator.clipboard.writeText(tx).then(function(){b.textContent=k.ui.klaar}).catch(function(){prompt('',tx)})}catch(e){prompt('',tx)}}}
function contact(c){var d=D.createElement('div');d.className='c';var kp=('serviceWorker' in navigator)&&('PushManager' in window)&&!!W.vapid&&c.some(function(o){return o.soort==='push'});var h='<p>'+(kp?W.ui.viaPush:W.ui.via)+'</p>'+(kp?'<button class="push" type="button">'+W.ui.push+'</button>':'')+(W.gid?'<div class="g"></div>':'')+'<form><input type="email" inputmode="email" autocomplete="email" placeholder="'+W.ui.mailPh+'"><button class="mail" type="submit">'+W.ui.mailKnop+'</button></form><div class="r">';
c.forEach(function(o){if(o.soort==='tg')h+='<a class="tg" target="_blank" rel="noopener" href="'+o.url+'" data-e="contact_tg">'+W.ui.tg+'</a>';if(o.soort==='wa')h+='<a class="wa" target="_blank" rel="noopener" href="'+o.url+'" data-e="contact_wa">'+W.ui.wa+'</a>'});
h+='<button class="nee" type="button">'+W.ui.nee+'</button></div>';d.innerHTML=h;L.appendChild(d);onder();bk(kp?'kaart_push':'kaart_mail');var gg=d.querySelector('.g');if(gg)gKnop(gg);var pb=d.querySelector('.push');if(pb)pb.onclick=function(){meldMe(pb)};
d.querySelector('form').onsubmit=function(e){e.preventDefault();var v=d.querySelector('input').value.trim();if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v)){d.querySelector('input').focus();return}ev('contact_mail');zeg(v,0)};
d.querySelectorAll('a[data-e]').forEach(function(a){a.onclick=function(){bk(a.getAttribute('data-e'))}});
d.querySelector('.nee').onclick=function(){bk('contact_nee');d.remove()}}
function zeg(t,isKnop){t=String(t||'').trim();if(!t||bezig)return;weg();var kw=D.querySelector('.klw');if(kw)kw.remove();bericht('u',t);msgs.push({r:'u',x:t});bewaar();I.value='';bezig=1;S.disabled=true;var dd=dots();
post('zeg',isKnop?{sid:W.sid,tok:W.tok,knop:t}:{sid:W.sid,tok:W.tok,x:t},function(j){dd.remove();bezig=0;S.disabled=false;setTimeout(inbox,1200);tBot=Date.now();typte=0;verwerk(j)})}
function verwerk(j){if(!j||!j.ok){bericht('b',W.ui.fout);return}if(j.cpil)W.cpil=j.cpil;if(j.peiling)uitslag(j.peiling);if(j.match){bericht('b',j.match);msgs.push({r:'b',x:j.match})}bericht('b',j.x);msgs.push({r:'b',x:j.x,k:j.knoppen});bewaar();if(j.deel)deelKaart(j.deel);if(j.wa)waKaart(j.wa);if(j.contact)contact(j.contact);if(j.google&&W.gid)gKaart();knoppen(j.knoppen)}
// Google One Tap (Henkjan 10 nov): het script laadt pas als er om contact gevraagd wordt; Google geeft een ondertekend token, de server controleert het
var GL=0,GQ=[];function gsi(f){if(!W.gid)return;if(window.google&&google.accounts&&google.accounts.id){f();return}GQ.push(f);if(GL)return;GL=1;var sc=D.createElement('script');sc.src='https://accounts.google.com/gsi/client';sc.async=true;sc.onload=function(){try{google.accounts.id.initialize({client_id:W.gid,callback:gCred,auto_select:false,cancel_on_tap_outside:true,itp_support:true,use_fedcm_for_prompt:true,context:'use'})}catch(e){}GQ.splice(0).forEach(function(x){try{x()}catch(e){}})};D.head.appendChild(sc)}
function gKnop(el){bk('google_getoond');gsi(function(){google.accounts.id.renderButton(el,{theme:'outline',size:'large',shape:'pill',text:'continue_with',logo_alignment:'left',width:Math.min(320,el.clientWidth||300)});try{google.accounts.id.prompt()}catch(e){}})}
function gKaart(){var d=D.createElement('div');d.className='c';d.innerHTML='<div class="g"></div>';L.appendChild(d);onder();gKnop(d.querySelector('.g'))}
function gCred(r){if(!r||!r.credential||bezig)return;bk('google_tik');weg();bezig=1;S.disabled=true;var dd=dots();post('google',{sid:W.sid,tok:W.tok,cred:r.credential},function(j){dd.remove();bezig=0;S.disabled=false;tBot=Date.now();if(j&&j.ok&&j.mail){bericht('u','✓ '+j.mail);msgs.push({r:'u',x:j.mail})}verwerk(j)})}
var nIn=0;function inbox(){if(!W.sid||bezig||D.visibilityState!=='visible')return;nIn++;post('inbox',{sid:W.sid,tok:W.tok},function(j){if(!j||!j.items||!j.items.length)return;weg();j.items.forEach(function(it){bericht('b',it.x);msgs.push({r:'b',x:it.x,k:it.k})});bewaar();knoppen(j.items[j.items.length-1].k)})}
setTimeout(inbox,1500);setInterval(function(){if(nIn<40||nIn%3===0)inbox();else nIn++},20000);
F.onsubmit=function(e){e.preventDefault();zeg(I.value,0)};
I.addEventListener('input',function(){if(!typte){typte=1;ev('typt')}});
var k0=D.getElementById('k0');if(W.wa&&W.wa.nr&&W.wa.code){var wz=W.wa.zw||(' (WAM code '+W.wa.code+')');var wu=function(t){return 'https://wa.me/'+W.wa.nr+'?text='+encodeURIComponent((t||'')+wz)};var naarWa=function(t){bk('wa_start',{t:t||''});var tx=(t||'')+wz,weg0=0,tw=0,vz=function(){if(D.visibilityState==='hidden'){if(!weg0){weg0=Date.now();bk('wa_open')}}else if(weg0&&!tw&&Date.now()-weg0<20000){tw=1;bk('wa_terug',{ms:Date.now()-weg0})}};D.addEventListener('visibilitychange',vz);var andr=/Android/i.test(navigator.userAgent);if(andr){location.href='intent://send/?phone='+W.wa.nr+'&text='+encodeURIComponent(tx)+'#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url='+encodeURIComponent(wu(t))+';end';setTimeout(function(){if(!weg0)bk('wa_geenapp')},2500)}else{setTimeout(function(){location.href='whatsapp://send?phone='+W.wa.nr+'&text='+encodeURIComponent(tx)},80);setTimeout(function(){if(!weg0){bk('wa_geenapp');location.href=wu(t)}},1700)}};if(W.wa.wens&&k0){var ee=D.querySelector('.eerste');if(ee)ee.textContent=W.wa.x;k0.innerHTML='';W.wa.wens.forEach(function(w){var bt=D.createElement('button');bt.textContent=w[0];bt.onclick=function(){naarWa(w[1])};k0.appendChild(bt)})}if(k0&&!W.wa.wens)k0.querySelectorAll('button').forEach(function(b){b.onclick=function(){naarWa(b.textContent)}});var wb=D.createElement('div');wb.className='c bw wk';var hi=W.wa.pre0||(W.taal==='nl'?'Hoi WAM!':W.taal==='de'?'Hallo WAM!':'Hi WAM!');var tip=W.taal==='nl'?'WhatsApp opent met je bericht al klaar: tik daar op versturen en WAM antwoordt meteen.':W.taal==='de'?'WhatsApp öffnet sich mit deiner Nachricht: tippe dort auf Senden und WAM antwortet sofort.':'WhatsApp opens with your message ready: tap send there and WAM answers right away.';wb.innerHTML='<p>'+tip+'</p><div class="r"><a class="wa" href="'+wu(hi)+'">'+W.wa.cta+'</a></div>';wb.querySelector('a').onclick=function(e){e.preventDefault();naarWa(hi)};L.appendChild(wb);if(F)F.style.display='none';var bo0=D.getElementById('bord');if(bo0)bo0.remove();var kw0=D.querySelector('.klw');if(kw0)kw0.remove()}else if(k0)k0.querySelectorAll('button').forEach(function(b){b.onclick=function(){zeg(b.textContent,1)}});
var lg=D.getElementById('logo');if(lg)lg.onclick=function(e){e.preventDefault();bk('logo_tik');try{window.scrollTo({top:0,behavior:'smooth'})}catch(x){window.scrollTo(0,0)}};
var ct=D.getElementById('ct');if(ct)ct.onclick=function(e){e.preventDefault();I.value=W.ui.contactPre;I.focus();try{I.setSelectionRange(I.value.length,I.value.length)}catch(x){}F.scrollIntoView({block:'center'})};
if(W.kring&&W.kring.deel)deelKaart(W.kring.deel);var klb=D.getElementById('kl');if(klb)klb.onclick=function(){bk('kringlink_tik');zeg(klb.textContent,1)};
var bo=D.getElementById('bord');if(bo)bo.querySelectorAll('.bc').forEach(function(b){b.onclick=function(){bk('bord_tik');zeg(b.getAttribute('data-k'),1)}});
var eg=D.getElementById('erger');if(eg)eg.querySelectorAll('.bc').forEach(function(b){b.onclick=function(){bk('erger_tik');zeg(b.getAttribute('data-k'),1)}});
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
  const t = nl ? ['Privacy bij We Are Many', 'WAM is een AI-chat van AdsFair B.V. (KvK 60126035, Gouda). We bewaren je gesprek en wat je ons vertelt (je wensen en de feiten die je deelt) zodat we je beter kunnen helpen en je herkennen als je terugkomt. Daarvoor zetten we één eigen cookie (wam_v). We vragen geen naam, adres of bankgegevens. Kies je Doorgaan met Google, dan gebruiken we van Google alleen je bevestigde e-mailadres. Getallen die je deelt (bijvoorbeeld wat je betaalt) bewaren we zonder je naam of gesprek, alleen om anoniem te vergelijken; we tonen ze alleen als gemiddelde van minstens 5 mensen.', 'Laat je je e-mail, Telegram of WhatsApp achter, dan gebruiken we die alleen om je te sturen wat je vroeg (mail via de verzenddienst Resend; voor een melding op je telefoon bewaren we alleen het meldadres dat je browser ons geeft, geen naam of nummer, en je zet het uit in je browser), en in elk bericht stop je met één klik. Wat je typt gaat via een AI-dienst (Anthropic, via Vercel) om een antwoord te maken; zoekvragen gaan naar een zoekdienst. We verkopen je gegevens niet. Cijfers die we tonen zijn anoniem en nooit naar jou te herleiden.', 'Matches: wat je aanbiedt of zoekt, staat zonder naam in onze lijst, zodat we je met iemand kunnen verbinden. Berichten tussen jullie geven we door zonder naam. Je WhatsApp-nummer geven we alleen door als je daar zelf voor kiest; normaal pas als de ander zijn nummer ook deelt, of, als je tikte op je WhatsApp aan een match te geven, aan de eerste die hetzelfde zoekt of biedt en ook zijn nummer deelt. Groepsvragen: antwoorden bewaren we zonder naam of nummer; de vraagsteller en wie dezelfde vraag beantwoordt zien de antwoorden, nooit wie ze schreef. Wie interesse toont in een besloten WAM, bewaren we met het e-mailadres of nummer dat hij daarvoor gaf, alleen om contact op te nemen. Alles laten wissen of een vraag? Zeg het gewoon in de chat op wearemany.now, of mail privacy@adsfair.xyz.']
    : ['Privacy at We Are Many', 'WAM is an AI chat by AdsFair B.V. (Dutch Chamber of Commerce 60126035, Gouda, the Netherlands). We store your conversation and what you tell us (your wishes and the facts you share) to help you better and to recognise you when you come back, using one first-party cookie (wam_v). We never ask for your name, address or bank details. If you choose Continue with Google, we only use your verified email address from Google. Numbers you share (for example what you pay) are stored without your name or conversation, only to compare anonymously, and are only ever shown as averages of at least 5 people.', 'If you leave your email, Telegram or WhatsApp, we only use it to send you what you asked for (email via our mail service Resend; for a notification on your phone we only store the push address your browser gives us, no name or number, and you turn it off in your browser), and every message has a one-click stop. What you type is processed by an AI service (Anthropic, via Vercel) to write a reply; search questions go to a search service. We do not sell your data. Numbers we show are anonymous and never traceable to you.', 'Matches: what you offer or look for is kept in our list without your name, so we can connect you with someone. Messages between you are passed on without names. We only pass on your WhatsApp number when you choose to: normally only when the other person shares theirs too, or, if you tapped to give your WhatsApp to a match, to the first person who looks for or offers the same and shares their number too. Group questions: answers are stored without a name or number; the person who asked and others who answer the same question see the answers, never who wrote them. If you show interest in a private WAM, we keep the email or number you gave for that, only to contact you. Want everything deleted, or have a question? Just say so in the chat at wearemany.now, or email privacy@adsfair.xyz.'];
  return '<!doctype html><html lang="' + (nl ? 'nl' : 'en') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + t[0] + '</title><style>body{font:16px/1.6 -apple-system,system-ui,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#1d1d1f}a{color:#0F6E56}</style></head><body><h1>' + t[0] + '</h1><p>' + t[1] + '</p><p>' + t[2] + '</p><p>' + t[3] + '</p><p><a href="/" onclick="if(document.referrer.indexOf(location.origin)===0&&history.length>1){history.back();return false}">← WAM</a></p></body></html>';
}

function voorwaarden(taal) {
  const nl = taal === 'nl';
  const t = nl ? ['Voorwaarden van We Are Many', [
      'WAM is een gratis AI-chat van AdsFair B.V. (KvK 60126035, Gouda). WAM helpt je dingen uitzoeken en verbindt mensen die iets zoeken met mensen die het aanbieden.',
      'WAM is een AI. Antwoorden kunnen fout zijn; controleer prijzen, voorwaarden en feiten zelf voordat je iets beslist. WAM geeft geen juridisch, medisch of financieel advies.',
      'Matches en berichten: we geven door wat jullie elkaar willen laten weten, zonder naam. We controleren niet wie iemand is of wat iemand aanbiedt. Spreek eerst af op een openbare plek, betaal nooit iets vooraf en deel alleen wat je zelf wilt. Afspraken die je maakt zijn tussen jou en de ander; AdsFair is daar geen partij in.',
      'Niet toegestaan: iets illegaals aanbieden of zoeken, oplichting, spam, iemand lastigvallen, volwassenencontent, gokken, leningen, crypto- of snel-rijk-plannen, wapens of medicijnen, en zoeken naar een specifiek privépersoon. We mogen berichten tegenhouden en toegang stoppen.',
      'Je kunt altijd stoppen: in elk bericht staat een stoplink, en in de chat kun je vragen alles te wissen. Hoe we met je gegevens omgaan staat bij Privacy.',
      'Vragen of contact: zeg het gewoon in de chat op wearemany.now.'] ]
    : ['Terms of We Are Many', [
      'WAM is a free AI chat by AdsFair B.V. (Dutch Chamber of Commerce 60126035, Gouda, the Netherlands). WAM helps you look things up and connects people who need something with people who offer it.',
      'WAM is an AI. Answers can be wrong; check prices, conditions and facts yourself before you decide anything. WAM does not give legal, medical or financial advice.',
      'Matches and messages: we pass on what you want to tell each other, without names. We do not verify who anyone is or what they offer. Meet in a public place first, never pay anything in advance and only share what you want to share. Any deal you make is between you and the other person; AdsFair is not a party to it.',
      'Not allowed: offering or seeking anything illegal, scams, spam, harassment, adult content, gambling, loans, crypto or get-rich schemes, weapons or medicines, and searching for a specific private person. We may block messages and stop access.',
      'You can always stop: every message has a stop link, and you can ask in the chat to delete everything. How we handle your data is in Privacy.',
      'Questions or contact: just say so in the chat at wearemany.now.'] ];
  return '<!doctype html><html lang="' + (nl ? 'nl' : 'en') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + t[0] + '</title><style>body{font:16px/1.6 -apple-system,system-ui,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#1d1d1f}a{color:#2B47C4}</style></head><body><h1>' + t[0] + '</h1>' + t[1].map(x => '<p>' + x + '</p>').join('') + '<p><a href="/" onclick="if(document.referrer.indexOf(location.origin)===0&&history.length>1){history.back();return false}">← WAM</a> · <a href="/privacy">Privacy</a></p></body></html>';
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
      // groepsvraag: de linkvoorbeeld-bot (WhatsApp, Telegram) krijgt de vraag als titel; een ophaling telt als 'echt in een chat geplakt'
      const krId = schoon(q('kr'), /^[0-9a-f]{10}$/), meta = krId ? await W.kringMeta(krId).catch(() => null) : null;
      if (W.lijktBot(ua)) { await W.tel(meta ? { bot: 1, kring_voorbeeld: 1 } : { bot: 1 }); return res.status(200).send(pagina({ start: null, taal, kanalen: k, vapid: '', meta })); }
      let vid = cookie(req, 'wam_v'); const uitPost = q('w') ? await W.vidVanLink(q('w')) : null; if (uitPost) vid = uitPost; // link uit een mail: zelfde profiel, ook op een ander toestel
      if (!/^[0-9a-f]{16}$/.test(vid)) vid = randomBytes(8).toString('hex');
      res.setHeader('set-cookie', 'wam_v=' + vid + '; Path=/; Max-Age=31536000; SameSite=Lax; Secure');
      let stad = ''; try { stad = decodeURIComponent(String(req.headers['x-vercel-ip-city'] || '')).slice(0, 40); } catch (e) {} if (q('stad') && beschermd(host)) stad = String(q('stad')).slice(0, 40);
      const tz = String(req.headers['x-vercel-ip-timezone'] || '').slice(0, 40); const app = W.apparaat(ua);
      const ctx = { test: beschermd(host) || undefined, taal: q('taal') && beschermd(host) ? q('taal') : taal, land: q('land') && beschermd(host) ? String(q('land')).toUpperCase().slice(0, 2) : land, stad, tz, uur: W.lokaalUur(tz), os: app.os, mobiel: app.mobiel, app: app.app, asn: String(req.headers['x-vercel-ip-as-number'] || '').slice(0, 10), ref: String(req.headers.referer || '').slice(0, 120) };
      // scherm-proef forceren om te testen, alleen op de beschermde host: ?ux=opener:chat,keuzes:pillen,invoer:inline
      if (beschermd(host) && q('o')) ctx.openerTest = q('o');
      if (meta) ctx.kr = krId;
      if (beschermd(host) && q('st')) ctx.startTest = q('st');
      if (beschermd(host) && q('wv')) ctx.waVTest = q('wv');
      if (beschermd(host) && q('ux')) { const t = {}; for (const x of q('ux').split(',')) { const [d, v] = x.split(':'); if (W.UX[d] && W.UX[d].includes(v)) t[d] = v; } ctx.uxTest = t; }
      const params = { n: schoon(q('n'), /^[a-z]{2,12}$/), z: schoon(q('z'), /^[\w{}\[\]-]{1,20}$/), c: schoon(q('c'), /^[\w{}\[\]-]{1,20}$/), b: schoon(q('b'), /^[\w{}\[\]-]{1,20}$/), mmc: schoon(q('mmc'), /^[0-9a-f]{8,24}$/), r: schoon(q('r'), /^[0-9a-f]{8}$/), d: schoon(q('d'), /^[a-z]{2,10}-[a-z]{2,8}(-[a-z0-9]{1,6})?$/), zr: schoon(q('z'), /^[0-9a-f]{8}$/) };
      const start = await W.startSessie({ vid, ctx, params });
      if (uitPost && q('van') === 'bewaar') await W.tel({ bewaar_terug: 1 }).catch(() => {});
      const bord = start && start.ux && start.ux.bord === 'aan' ? await W.bordVoor(ctx.land, ctx.taal).catch(() => null) : null;
      const erger = start && start.ux && start.ux.erger === 'aan' ? await W.ergerVoor(ctx.land, ctx.taal).catch(() => null) : null;
      return res.status(200).send(pagina({ start, taal: ctx.taal || taal, kanalen: k, vapid: await PUSH.publiek().catch(() => ''), w: await W.linkTok(vid).catch(() => ''), bord, erger, meta }));
    }
    if (op === 'zeg') {
      // GET alleen op de beschermde host, om te testen (?sid=&tok=&x=)
      if (req.method !== 'POST' && !beschermd(host)) return res.status(405).json({ ok: false });
      const b = req.method === 'POST' ? leesBody(req) : { sid: q('sid'), tok: q('tok'), x: q('x'), knop: q('knop') }; const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0];
      return res.status(200).json(await W.zeg({ sid: b.sid, tok: b.tok, x: b.x, knop: b.knop, ip }));
    }
    if (op === 'push') { const b = leesBody(req); return res.status(200).json(await W.pushIn({ sid: b.sid, tok: b.tok, sub: b.sub })); }
    if (op === 'google') { if (req.method !== 'POST') return res.status(405).end(); const b = leesBody(req) || {}; return res.status(200).json(await W.googleIn({ sid: b.sid, tok: b.tok, cred: b.cred, ip: String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() })); }
    if (op === 'pushinhoud') { res.setHeader('cache-control', 'no-store'); return res.status(200).json(await W.pushInhoud(q('e'))); }
    if (op === 'sw') { res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('cache-control', 'no-cache'); res.setHeader('service-worker-allowed', '/'); return res.status(200).send(PUSH.SW); }
    if (op === 'ev') { const b = leesBody(req); return res.status(200).json(await W.gebeurtenis(b.sid, b.tok, String(b.e || ''), b.d || {})); }
    if (op === 'inbox') { const b = leesBody(req); return res.status(200).json(await W.inbox(b.sid, b.tok)); }
    // testen van de chat met GET, alleen op de beschermde host en alleen voor testsessies (ctx.test)
    // nieuwe testsessie zonder HTML (alleen beschermde host): ?op=testsessie&o=<opener>&land=CA&stad=Montreal
    if (op === 'testsessie' && beschermd(host)) { const st = await W.startSessie({ vid: randomBytes(8).toString('hex'), ctx: { test: true, taal: q('taal') || 'en', land: String(q('land') || 'US').toUpperCase().slice(0, 2), stad: String(q('stad') || '').slice(0, 40), tz: '', uur: 10, os: 'android', mobiel: true, app: '', asn: '', ref: '', openerTest: q('o') || undefined, cq: q('cq') ? 1 : undefined, deelTest: q('dm') || undefined, diepteTest: q('dd') || undefined, startTest: q('st') || undefined, waVTest: q('wv') || undefined, kr: schoon(q('kr'), /^[0-9a-f]{10}$/) || undefined, uxTest: (() => { const t = {}; for (const x of String(q('ux') || '').split(',')) { const [d, v] = x.split(':'); if (W.UX[d] && W.UX[d].includes(v)) t[d] = v; } return t; })(), ...(q('kanaal') === 'whatsapp' ? { kanaal: 'whatsapp' } : {}) }, params: { r: schoon(q('r'), /^[0-9a-f]{8}$/), d: schoon(q('d'), /^[a-z]{2,10}-[a-z]{2,8}(-[a-z0-9]{1,6})?$/), zr: schoon(q('z'), /^[0-9a-f]{8}$/) } }); return res.status(200).json({ ok: true, sid: st && st.sid, tok: st && st.tok, opener: st && st.opener, wa: st && st.wa, ux: st && st.ux, punch: st && st.punch, kring: st && st.kring }); }
    if (op === 'zegtest' && beschermd(host)) { const ss = await W.sessie(q('sid')); if (!ss || !(ss.ctx && ss.ctx.test)) return res.status(404).json({ ok: false }); if (q('ctx')) return res.status(200).json({ ok: true, ctx: ss.ctx }); if (q('staat')) return res.status(200).json({ ok: true, ra: ss.ra || '', raVeld: ss.raVeld || '', alertG: ss.alertG || 0, alertO: ss.alertO || null, alertKz: ss.alertKz || '', beurten: ss.beurten }); return res.status(200).json(q('inbox') ? await W.inbox(q('sid'), q('tok')) : await W.zeg({ sid: q('sid'), tok: q('tok'), x: q('x') || undefined, knop: q('knop') || undefined, ip: 'test' })); }
    if (op === 'beeld') {
      const img = await beeld(q('h'), q('t') || 'en', q('v') === 'icon' ? 'icon' : 'img'); const buf = Buffer.from(await img.arrayBuffer());
      res.setHeader('content-type', 'image/png'); res.setHeader('cache-control', 'public, max-age=86400, s-maxage=604800'); return res.status(200).send(buf);
    }
    if (op === 'hooks') return res.status(200).json({ ok: true, hooks: Object.fromEntries(Object.entries(HOOKS).map(([h, v]) => [h, { familie: v.familie, en: v.en, nl: v.nl, de: v.de }])) });
    if (op === 'robots') { res.setHeader('content-type', 'text/plain'); return res.status(200).send('User-agent: *\nAllow: /\nDisallow: /api/\n'); }
    if (op === 'llms') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('# We Are Many (wearemany.now)\n\nWAM is a free AI chat that acts as your own personal fixer: it helps people pay less (energy, phone, internet, insurance, subscriptions), cancel subscriptions, compare deals, write complaints, and find what they want. It looks things up live and remembers what you asked, so it can tell you when something changes. People with the same wish are bundled so they get better deals together.\n\nWAM sells nothing and takes no commission on recommendations. Run by AdsFair B.V., Gouda, the Netherlands.\n'); }
    if (op === 'terms') { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(voorwaarden(W.taalVan(req.headers['accept-language'], req.headers['x-vercel-ip-country']))); }
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
    // gedeelde team-sleutel (SHOP_SLEUTEL, header x-shop-sleutel): de dagelijkse WAM-kopieën in propellerads-mcp koppelen zo hun nieuwe banners
    const metSleutel = !!process.env.SHOP_SLEUTEL && req.headers['x-shop-sleutel'] === process.env.SHOP_SLEUTEL;
    if (op === 'hookscore') { if (!beschermd(host) && !metSleutel) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, ...(await W.hookScore(Math.min(7, Number(q('dagen')) || 3))) }); }
    if (op === 'wamtitels') { if (!beschermd(host) && !metSleutel) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, titels: await W.titelHooks() }); }
    if (op === 'hookzet') {
      if (!beschermd(host) && !metSleutel) return res.status(404).send('Niet gevonden');
      let l = []; if (req.method === 'POST') { const b = leesBody(req); l = Array.isArray(b) ? b : (b.j || []); } else { try { l = JSON.parse(q('j') || '[]'); } catch (e) { return res.status(400).json({ ok: false, fout: 'j is geen JSON' }); } }
      const titels = (Array.isArray(l) && l.some(x => x && !x.hook && x.titel)) ? await W.titelHooks() : {};
      for (const x of (Array.isArray(l) ? l : [])) if (x && !x.hook && x.titel && titels[x.titel]) { x.hook = titels[x.titel].hook; x.taal = x.taal || titels[x.titel].taal; x.tekst = x.tekst || x.titel; }
      const uit = []; for (const x of (Array.isArray(l) ? l : []).slice(0, 80)) { if (!HOOKS[x.hook]) { uit.push({ b: x.b, fout: 'onbekende hook' }); continue; } const t = hookTekst(x.hook, x.taal || 'en'); const tekst = String(x.tekst || (t && t.titel) || '').slice(0, 80); uit.push({ b: x.b, ok: await W.zetHook(x.b, { hook: x.hook, familie: HOOKS[x.hook].familie, tekst, taal: x.taal || 'en', camp: x.c || '' }) }); if (x.tekst) await W.onthoudTitel(tekst, { hook: x.hook, taal: x.taal || 'en', knop: String(x.knop || (t && t.knop) || '').slice(0, 30) }); }
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
    if (op === 'mailin') { // Resend-webhook email.received: antwoorden op WAM-mails (Henkjan 10 nov: "hij kan gewoon reply sturen, die vang je op")
      if (req.method !== 'POST') return res.status(405).end(); const b = leesBody(req) || {}; const d = b.data || {};
      if (b.type && b.type !== 'email.received') return res.status(200).json({ ok: true, overgeslagen: b.type });
      const aan = [].concat(d.to || []).join(',').toLowerCase(); if (aan && !aan.includes('wearemany.now')) return res.status(200).json({ ok: true, nietVoorWam: true });
      const id = String(d.email_id || d.id || '').replace(/[^a-z0-9-]/gi, '').slice(0, 60); if (!id) return res.status(400).json({ ok: false });
      const m = await POST.ontvangen(id); if (!m) return res.status(200).json({ ok: false, waarom: 'ophalen mislukt' });
      return res.status(200).json(await W.mailIn(m, id));
    }
    if (op === 'mailontvang') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await POST.ontvangAan('https://wearemany.now/api/wam?op=mailin')); }
    // WhatsApp-koppeling (repo whatsappp-mcp, src/wam.js): aanmelden, binnenkomende berichten, wachtrij ophalen. Alles met de sleutel van de koppeling.
    if (op === 'wareg' || op === 'wain' || op === 'wauit' || op === 'wakoppel') {
      if (req.method !== 'POST') return res.status(405).end(); const b = leesBody(req) || {};
      const r = op === 'wareg' ? await W.waReg(b) : op === 'wain' ? await W.waIn(b) : op === 'wakoppel' ? await W.waKoppel(b) : await W.waUit(b);
      return res.status(r.fout === 'sleutel' ? 401 : 200).json(r);
    }
    if (op === 'cq') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); res.setHeader('cache-control', 'no-store'); return res.status(200).json(await W.cqLijst(q('kort') === '1')); }
    if (op === 'cqbatch') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); let l = []; try { l = JSON.parse(q('j') || '[]'); } catch (e) { return res.status(400).json({ ok: false, fout: 'j is geen JSON' }); } const uit = []; for (const x of (Array.isArray(l) ? l : []).slice(0, 30)) { const r = await W.cqAntw({ sid: x.sid, x: x.x, k: x.k || [] }).catch(e => ({ ok: false, fout: String(e.message || e).slice(0, 80) })); uit.push({ sid: x.sid, ok: !!(r && r.ok) }); } return res.status(200).json({ ok: true, n: uit.filter(u => u.ok).length, uit }); }
    if (op === 'cqantw') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await W.cqAntw({ sid: q('sid'), x: q('x'), k: q('k') })); }
    if (op === 'waqr') { if (req.method !== 'POST') return res.status(405).end(); const r = await W.waQr(leesBody(req) || {}); return res.status(r.ok ? 200 : 401).json(r); }
    if (op === 'watweede') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await W.waTweede({ aan: q('aan') === '1', nr: q('nr') })); }
    if (op === 'waqrpagina') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store'); return res.status(200).send(await W.waQrPagina()); }
    if (op === 'tellers') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await W.tellers(q('dagen') || 1)); }
    if (op === 'wastand') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await W.waStand()); }
    if (op === 'stadstand') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await W.stadStand(q('land') ? String(q('land')).toUpperCase() : '')); }
    // groepsvraag en beginscherm (beschermd): virale stand, interesselijst besloten WAM, live regel, steden van vandaag eenmalig vullen
    if (op === 'kost') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, dagen: await W.kostStand(Math.min(14, Number(q('dagen')) || 3)) }); }
    if (op === 'kring') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, ...(await W.kringStand()) }); }
    if (op === 'prive') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); const { kv } = await import('../lib/db.js'); const l = (await kv.raw(['LRANGE', 'wam:prive', '0', '-1']).catch(() => [])) || []; return res.status(200).json({ ok: true, n: l.length, lijst: l.map(j => { try { return typeof j === 'string' ? JSON.parse(j) : j; } catch (e) { return null; } }) }); }
    if (op === 'live') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, live: await W.liveRegel(String(q('land') || 'CA').toUpperCase(), q('taal') || 'en') }); }
    if (op === 'stadvul') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, ...(await W.stadVul(q('dag') || undefined)) }); }
    if (op === 'leerstand') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, start: await W.startStand(), cta: await W.ctaStand(), diepte: await W.diepteStand(), vraag: await LEER.vbStand(), deel: await W.deelStand(), veilig: await LEER.veiligStand() }); }
    // minste info voor een goede match, usecases en vandalen (12 nov): cijfers zonder namen of teksten; voorbeeldzinnen alleen op de beschermde host
    if (op === 'wafunnel') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, ...(await W.waFunnel(q('dag'))) }); }
    if (op === 'foto') { const r = await W.fotoLees(String(q('f') || ''), String(q('t') || '')); if (!r || !r.stream) return res.status(404).send('Niet gevonden'); res.setHeader('content-type', (r.blob && r.blob.contentType) || 'image/jpeg'); res.setHeader('cache-control', 'private, max-age=86400'); return res.status(200).send(Buffer.from(await new Response(r.stream).arrayBuffer())); }
    if (op === 'kaart') { const k = await W.kaartPagina(String(q('r') || ''), String(q('z') || ''), String(q('f') || ''), String(q('t') || '')); res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('x-robots-tag', 'noindex'); return res.status(k ? 200 : 404).send(k || 'Niet gevonden'); }
    if (op === 'dagvraag') { if (!beschermd(host) && !isCron(req)) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, stand: await LEER.dagvStand(), ...(q('droog') ? { droog: await W.dagvraagRonde({ droog: true }) } : {}) }); }
    if (op === 'alertstand') return res.status(200).json({ ok: true, ...(await LEER.alertStand()) });
    if (op === 'wastart') return res.status(200).json({ ok: true, ...(await LEER.waStand()) });
    if (op === 'vraagstand') return res.status(200).json({ ok: true, ...(await LEER.vbStand()) });
    if (op === 'usecases') return res.status(200).json({ ok: true, ...(await LEER.ucStand({ metVoorbeelden: beschermd(host) })) });
    if (op === 'veilig') return res.status(200).json({ ok: true, ...(await LEER.veiligStand()) });
    if (op === 'deelstand') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, ...(await W.deelStand()) }); }
    if (op === 'paren') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, ...(await W.parenStand(Number(q('dagen')) || 1)) }); }
    if (op === 'gesprekkort') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await W.gesprekKort({ land: q('land'), camp: q('c'), n: Number(q('n')) || 15 })); }
    if (op === 'herkomst') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await W.herkomst(Number(q('n')) || 40)); }
    if (op === 'mailproef') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await W.mailProef(q('code') || '')); }
    if (op === 'detailmail') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await W.detailMails({ nu: q('nu') === '1' })); }
    if (op === 'maildomein') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await POST.domein(q('maak') === '1')); }
    if (op === 'tg') {
      const tok = process.env.WAM_TG_TOKEN; if (!tok) return res.status(404).send('');
      const geheim = createHmac('sha256', tok).update('wam-tg').digest('hex').slice(0, 32);
      if (req.headers['x-telegram-bot-api-secret-token'] !== geheim) return res.status(401).send('');
      await W.telegramUpdate(leesBody(req)); return res.status(200).json({ ok: true });
    }
    if (op === 'rapport') { if (!beschermd(host)) return res.status(404).send('Niet gevonden'); const l = await W.rapporten(q('n') || 3); res.setHeader('content-type', 'text/plain; charset=utf-8'); res.setHeader('cache-control', 'no-store'); return res.status(200).send(l.length ? l.map(x => new Date(x.t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC\n' + x.tekst).join('\n\n---\n\n') : 'Nog geen rapport.'); }
    if (op === 'matchronde') { if (!beschermd(host)) return res.status(404).json({ ok: false }); return res.status(200).json({ ok: true, ...(await W.matchRonde({ forceer: true })), stand: await W.zoekStand().then(z => ({ open: z.open, per: z.per, matches: z.matches })) }); }
    if (op === 'tgzet') {
      if (!beschermd(host)) return res.status(404).send('Niet gevonden');
      return res.status(200).json(await W.telegramZet());
    }
    return res.status(404).json({ ok: false, fout: 'onbekende op' });
  } catch (e) {
    return res.status(500).json({ ok: false, fout: String(e && e.message || e).slice(0, 200) });
  }
}
