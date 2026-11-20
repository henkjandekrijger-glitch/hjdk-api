// Vraag-eerst cadeauvinder (18 nov 2026, Henkjan: "hoe we hier de grootste intent database van maken 100k intents voor eind dit jaar").
// Onderzoek: een chat naast de pagina haalt 1 tot 3% van de bezoekers, een eerste vraag met tikopties bovenaan 15 tot 35%. Hier IS de chat de pagina:
// de bezoeker tikt voor wie het is, de chat (lib/kzchat.js) haalt wat, voor wie, budget en wanneer eruit en wijst de keuzehulp aan die past.
// keuzehulp.best/cadeau-vinden, whichtobuy.best/gift-finder, kaufberater.best/geschenk-finden (vercel.json, api/keuze-tools.js tool=vinder).
import { kzuxBlok } from './kzux.js';
import { lookNieuw } from './look.js';
import { VK } from './vk-sjablonen.js';
import { RH_VOORKANT, rekenchats } from './rekenhulp.js';
// strak (Henkjan 19 nov 2026: "Rotzooi ."): dezelfde basisopmaak als de andere keuzehulpen (lookNieuw, smalle kolom), geen Volgen-knop, populaire keuzehulpen als rustige rijen
const VK_CSS = () => '<style>' + lookNieuw() + '.vk h1{font-size:32px;line-height:1.15;margin:28px 0 8px}.vk .lead{margin:0 0 18px}.vk .pop{margin:40px 0 0}.vk .pop h2{font-size:18px;margin:0 0 8px}.vk .pop ul{list-style:none;padding:0;margin:0;border-top:1px solid var(--line)}.vk .pop li a{display:flex;justify-content:space-between;gap:12px;padding:14px 2px;border-bottom:1px solid var(--line);text-decoration:none;font-weight:600}.vk .pop li a:after{content:"\\2192";color:var(--acc)}.vk .pop p{margin:14px 0 0;font-size:16px}</style>';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const VINDER = {
  nl: { host: 'keuzehulp.best', pad: '/cadeau-vinden', lang: 'nl',
    title: 'Cadeau vinden voor Sinterklaas en kerst: vertel voor wie', desc: 'Tik voor wie je een cadeau zoekt en wat je wilt uitgeven. De keuzehulp wijst de gids aan die past, met de prijs van vandaag.',
    h1: 'Cadeau vinden voor Sinterklaas en kerst', lead: 'Vertel voor wie het is, dan zoeken we het samen uit. Advies uit onze keuzehulpen, zonder dat een merk ervoor betaalt.',
    kop: 'Voor wie zoek je een cadeau?', tik: 'Tik wat past of typ het zelf. Antwoord door AI, alleen uit onze pagina\'s.',
    vragen: ['Cadeau voor mijn partner', 'Voor mijn moeder of vader', 'Voor een collega, tot 25 euro', 'Voor een kind', 'Voor iemand die alles heeft', 'Sinterklaascadeau tot 20 euro'] },
  us: { host: 'whichtobuy.best', pad: '/gift-finder', lang: 'en',
    title: 'Gift finder: tell us who it is for', desc: 'Tap who you are shopping for and your budget. The guide points you to the buying guide that fits, with prices checked today.',
    h1: 'Find a gift for the holidays', lead: 'Tell us who it is for and we work it out together. Advice from our buying guides, no brand pays to be listed.',
    kop: 'Who are you shopping for?', tik: 'Tap what fits or type it. Answers by AI, only from our pages.',
    vragen: ['Gift for my wife or partner', 'Gift for mom or dad', 'Coworker gift under $25', 'Gift for a kid', 'Gift for someone who has everything', 'Stocking stuffer under $20'] },
  de: { host: 'kaufberater.best', pad: '/geschenk-finden', lang: 'de',
    title: 'Geschenk finden für Weihnachten: sag uns, für wen', desc: 'Tippe, für wen du ein Geschenk suchst und was du ausgeben willst. Der Kaufberater zeigt den passenden Ratgeber mit Preisen von heute.',
    h1: 'Geschenk finden für Weihnachten', lead: 'Sag uns, für wen es ist, dann finden wir es zusammen. Rat aus unseren Kaufberatern, keine Marke bezahlt dafür.',
    kop: 'Für wen suchst du ein Geschenk?', tik: 'Tippe, was passt, oder schreib es selbst. Antworten von KI, nur aus unseren Seiten.',
    vragen: ['Geschenk für meine Partnerin oder meinen Partner', 'Für Mama oder Papa', 'Für Kollegen bis 25 Euro', 'Für ein Kind', 'Für jemanden, der alles hat', 'Wichtelgeschenk bis 20 Euro'] },
};

// Voorkant van de keuzehulpen (Henkjan 18 nov 2026: "Voorkant van keuzehulpen heeft alleen maar een chat en eronder een aantal van de populaire keuze hulpen .
// De chat vraag ook wat ze missen . De chat moet echt heel intelligent zijn en zeer lerend per persoon ."): de chat (slug vraag) en daaronder de populaire keuzehulpen.
// Lerend per persoon: kzuxBlok met terug (wat iemand eerder zocht staat alleen in zijn eigen browser, kzik) en de proeffactoren opener en blijf.
export const VOORKANT = {
  nl: { host: 'keuzehulp.best', pad: '/', lang: 'nl', site: 'kzuxhome',
    title: 'Keuzehulp: vraag het en kies eerlijk', desc: 'Vertel wat je wilt kiezen of regelen. De keuzehulp zoekt het met je uit, met de prijs van vandaag en zonder dat een merk ervoor betaalt.',
    h1: 'Waar wil je hulp bij kiezen?', lead: 'Vertel het de chat. Bestaat er nog geen keuzehulp voor, dan maken we er een.', kop: 'Waar twijfel je over?', tik: 'Tik wat past of typ het zelf. Antwoord door AI, alleen uit onze pagina\'s.',
    vragen: ['Een cadeau vinden', 'Zorgverzekering 2027 kiezen', 'Energiecontract vergelijken', 'Thuisbatterij met stekker', 'Ik zoek iets anders', 'Ik mis een keuzehulp'],
    popKop: 'Populaire keuzehulpen', alle: ['/keuzehulp', 'Alle keuzehulpen'],
    pop: [['/zorgverzekering', 'Zorgverzekering 2027 vergelijken'], ['/cadeau-vinden', 'Cadeau vinden voor Sint en kerst'], ['/stekkerbatterij', 'Thuisbatterij met stekker'], ['/energieleverancier-vergelijken', 'Energieleverancier vergelijken'], ['/verzekeringen', 'Verzekeringen vergelijken'], ['/chirurgie/nl', 'Kosten van een ingreep, ook in het buitenland'], ['/rotterdam', 'Diensten in Rotterdam vergelijken'], ['/fietsmaat', 'Welke fietsmaat heb ik nodig?']] },
  us: { host: 'whichtobuy.best', pad: '/', lang: 'en', site: 'kzuxhomeus',
    title: 'Which To Buy: ask and choose with confidence', desc: 'Tell us what you want to buy or sort out. The guide works it out with you, with prices checked today and no brand paying to be listed.',
    h1: 'What do you need help choosing?', lead: 'Tell the chat. If we do not have a guide for it yet, we will make one.', kop: 'What are you trying to decide?', tik: 'Tap what fits or type it. Answers by AI, only from our pages.',
    vragen: ['Find a gift', 'Pick a kitchen appliance', 'Laptop or phone', 'Home energy and batteries', 'Something else', 'I miss a guide'],
    popKop: 'Popular guides', alle: ['/all', 'All guides'],
    pop: [['/gift-finder', 'Gift finder for the holidays'], ['/stocking-stuffers-for-teens', 'Stocking stuffers for teens'], ['/funny-stocking-stuffers-for-adults', 'Funny stocking stuffers for adults'], ['/glass-air-fryer', 'Glass air fryer'], ['https://keuzehulp.best/chirurgie', 'Surgery cost at home and abroad']] },
  de: { host: 'kaufberater.best', pad: '/', lang: 'de', site: 'kzuxhomede',
    title: 'Kaufberater: frag und wähle ehrlich', desc: 'Sag uns, was du kaufen oder regeln willst. Der Kaufberater klärt es mit dir, mit Preisen von heute und ohne bezahlte Plätze.',
    h1: 'Wobei willst du Hilfe beim Auswählen?', lead: 'Sag es dem Chat. Gibt es noch keinen Ratgeber dafür, bauen wir einen.', kop: 'Wobei bist du unsicher?', tik: 'Tippe, was passt, oder schreib es selbst. Antworten von KI, nur aus unseren Seiten.',
    vragen: ['Geschenk finden', 'Küchengerät wählen', 'Laptop oder Handy', 'Stromspeicher und Energie', 'Etwas anderes', 'Mir fehlt ein Ratgeber'],
    popKop: 'Beliebte Kaufberater', alle: ['/all', 'Alle Kaufberater'],
    pop: [['/geschenk-finden', 'Geschenk finden für Weihnachten'], ['/adventskalender-fuer-maenner', 'Adventskalender für Männer'], ['/powerstation-kaufen-2026-test-anker-ecoflow-jackery-bluetti', 'Powerstation kaufen'], ['/stromspeicher-batteriespeicher-photovoltaik-kosten-2026', 'Stromspeicher: was er kostet'], ['/kaffeebohnen-vollautomat-2026-crema-saeurearm-kaufen', 'Kaffeebohnen für den Vollautomaten'], ['/kategorie/geschenke', 'Alle Geschenkideen']] },
};

// 19 nov 2026 (chat keuzehulp-pillfix): op keuzehulp.best is een rekenhulp in stap 1 van de pill-flow (Fietsmaat, Hypotheek, Zorgverzekering) geen
// "voor wie" en "budget" meer: fietsmaat, kinderfietsmaat en helmmaat rekenen meteen in de chat (lib/rekenhulp.js rekenchats), de rest is één tik naar de rekenhulp
const rekenVoorkant = taal => taal === 'nl' ? { rh: RH_VOORKANT, rekens: rekenchats() } : {};
function kzuxVoorkant(markt) {
  const v = VOORKANT[markt] || VOORKANT.nl, taal = markt === 'us' || markt === 'de' ? markt : 'nl';
  return kzuxBlok({ alleenChat: true, kop: v.kop, taal, site: v.site, slug: 'vraag', term: { nl: 'je keuze', us: 'your choice', de: 'deiner Wahl' }[taal], shop: '', prods: [], opties: [], faq: [], vragen: v.vragen, terug: true, geenVolg: true, t: { tik: v.tik }, ...rekenVoorkant(taal) });
}
// chat-opmaak en chat-script los, voor de sjablonen van de vier ontwerpen (scripts/vk-bouw.mjs, lib/vk-sjablonen.js)
export function kzuxBlokVoorkant(markt) {
  const h = kzuxVoorkant(markt), a = h.indexOf('<style>'), b = h.indexOf('</style>'), e = h.lastIndexOf('</section>');
  return { css: h.slice(a + 7, b), js: h.slice(e + 10), html: h };
}

// Henkjan 19 nov 2026 (bij een schermafdruk van de voorkant): "Altijd ronde pills en rest vd ux met dat blauw opruimen". Geldt voor alle vier de
// ontwerpen: geen blauwe accentkleur meer (links, pijlen, logo, taal, vlakken volgen de tekstkleur of een neutraal grijs) en elke pill helemaal rond.
const VK_RUST = '<style>html[data-vk]{--accent:var(--ink);--acc:var(--ink);--soft:#F3F4F6;--acc-2:#F3F4F6;--line:#E3E5EA}html[data-vk] #vk,html[data-vk] .vk-w,html[data-vk] body{--vk-acc:var(--vk-ink);--vk-soft:#F3F4F6;--vk-line:#E3E5EA;--vk-rand:#9AA0AE}'
  + '@media (prefers-color-scheme:dark){html[data-vk]{--bg:#111318;--ink:#F2F3F5;--mute:#A6ABB6;--mut:#A6ABB6;--muted:#A6ABB6;--knop:#F2F3F5;--opknop:#111318;--knop-on:#111318;--on:#111318;--soft:#1C1F26;--acc-2:#1C1F26;--line:#2E323B;--rand:#4A4F5A}html[data-vk] #vk,html[data-vk] .vk-w,html[data-vk] body{--vk-bg:#111318;--vk-ink:#F2F3F5;--vk-mut:#A6ABB6;--vk-on:#111318;--vk-soft:#1C1F26;--vk-line:#2E323B;--vk-rand:#4A4F5A}}'
  + 'html[data-vk] .talen a:not([aria-current]),html[data-vk] nav a:not([aria-current]){opacity:.62}'
  + 'html[data-vk] .pop li a:after{opacity:.45}'
  + 'html[data-vk] #kx button:not([type=submit]),html[data-vk] .kx button:not([type=submit]),html[data-vk] .kx a.kx-k,html[data-vk] .kx-act a{border-radius:999px!important}'
  + 'html[data-vk] .kx-ps button[data-mis],html[data-vk] .mis button{color:inherit!important}'
  + 'html[data-vk] #kxf button[type=submit]{background:var(--ink,var(--vk-ink))!important;color:var(--bg,var(--vk-bg))!important;border-color:transparent!important}html[data-vk] #vk #kxf button[type=submit]{background:var(--vk-ink)!important;color:var(--vk-bg)!important}</style>';

// Voorkant als proef (19 nov 2026, Henkjan: "We gaan ze allemaal testen waar chat best converteert naar betrokken chatter die terugkomt ."):
// vier ontwerpen (a minimalist, b conversie, c mobiel en toegankelijk, d rust en typografie), per persoon vast via cookie kzvk, proef kzvk in lib/proef.js.
// o = { arm, pid, d, r, c, nieuw, meet } ; meet = HTML voor cm.js, funnel en bezoekteller (api/keuze-tools.js).
// Nu actief en mensen online op de voorkant (20 nov 2026, Henkjan: "Laat zien meest actief en mensen online ."): boven de lijst populair een blok in
// dezelfde opmaak (class pop), uit /api/keuze-tools?tool=tafel&op=actief (lib/tafel.js actief): wie er de laatste 2 minuten was, per keuzehulp
// online en vragen vandaag. Alleen echte cijfers; mensen online pas vanaf 2, een keuzehulp alleen met iemand online of een vraag vandaag.
const LIVE_T = {
  nl: { kop: 'Nu actief', on: 'mensen online', online: 'online', vr: ['vraag vandaag', 'vragen vandaag'], tf: ['bericht aan tafel', 'berichten aan tafel'] },
  us: { kop: 'Active now', on: 'people online', online: 'online', vr: ['question today', 'questions today'], tf: ['table message', 'table messages'] },
  de: { kop: 'Gerade aktiv', on: 'Personen online', online: 'online', vr: ['Frage heute', 'Fragen heute'], tf: ['Nachricht am Tisch', 'Nachrichten am Tisch'] },
};
function liveClient(T, s) {
  try {
    var D = document, N = navigator; if (N.webdriver || /bot|crawl|spider|preview|lighthouse|headless/i.test(N.userAgent || '')) return;
    var me = null; try { me = JSON.parse(localStorage.getItem('tafelme') || 'null'); } catch (e) {}
    if (!me || !/^[0-9a-f]{12}$/.test(me.pid || '')) { me = { pid: Array.from(crypto.getRandomValues(new Uint8Array(6))).map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''), nick: '', rol: '', sinds: 0, dag: '' }; try { localStorage.setItem('tafelme', JSON.stringify(me)); } catch (e) {} }
    var ping = function () { if (D.hidden) return; try { fetch('/api/keuze-tools?tool=tafel&op=hier', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ s: s, slug: 'home', pid: me.pid, p: '/' }) }).catch(function () {}); } catch (e) {} };
    var sec = null;
    function el(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
    function zet(j) {
      var pop = D.querySelector('section.pop:not(.vk-live),section.vk-pop:not(.vk-live)'); if (!pop || !j || !j.ok) return; var ac = (pop.querySelector('li a') || {}).className || '';
      var lijst = (j.lijst || []).filter(function (x) { return x.online > 0 || x.vragen > 0; });
      if (j.online < 2 && !lijst.length) { if (sec) { sec.remove(); sec = null; } return; }
      var nieuw = el('section', pop.className.split(' ')[0] + ' vk-live'); nieuw.setAttribute('aria-live', 'polite');
      var h = el('h2'); h.appendChild(el('i', 'vk-dot')); h.appendChild(D.createTextNode(T.kop)); if (j.online >= 2) h.appendChild(el('small', 'vk-on', j.online + ' ' + T.on)); nieuw.appendChild(h);
      if (lijst.length) { var ul = el('ul'); lijst.forEach(function (x) { var li = el('li'), a = el('a', ac); a.href = x.p; var sp = el('span'); sp.appendChild(D.createTextNode(x.n)); var d = [];
          if (x.online > 0) d.push(x.online + ' ' + T.online); if (x.vragen > 0) d.push(x.vragen + ' ' + T.vr[x.vragen === 1 ? 0 : 1]); if (x.tafel > 0) d.push(x.tafel + ' ' + T.tf[x.tafel === 1 ? 0 : 1]);
          if (d.length) sp.appendChild(el('small', 'vk-st', d.join(', '))); a.appendChild(sp);
          a.addEventListener('click', function () { try { window.__kxEv && window.__kxEv('tik'); } catch (e) {} }); li.appendChild(a); ul.appendChild(li); }); nieuw.appendChild(ul); }
      if (sec) sec.replaceWith(nieuw); else pop.before(nieuw); sec = nieuw;
    }
    function haal() { if (D.hidden) return; fetch('/api/keuze-tools?tool=tafel&op=actief&s=' + s).then(function (r) { return r.json(); }).then(zet).catch(function () {}); }
    var css = el('style'); css.textContent = '.vk-live h2{color:#111113!important;display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px}.vk-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#0F7B4A}.vk-on{font-size:14px;font-weight:600;color:#0F7B4A}.vk-st{display:block;font-size:14px;font-weight:400;margin-top:2px}html.hs-dk .vk-live h2{color:#fff!important}html.hs-dk .vk-on{color:#6FCF97}html.hs-dk .vk-dot{background:#6FCF97}@media(prefers-color-scheme:dark){html:not(.hs-lt) .vk-live h2{color:#fff!important}html:not(.hs-lt) .vk-on{color:#6FCF97}html:not(.hs-lt) .vk-dot{background:#6FCF97}}';
    (D.head || D.documentElement).appendChild(css);
    var go = function () { ping(); haal(); setInterval(function () { ping(); haal(); }, 60000); D.addEventListener('visibilitychange', function () { if (!D.hidden) { ping(); haal(); } }); };
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', go); else go();
  } catch (e) {}
}
const LIVE_JS = mk => '<script>(' + liveClient.toString() + ')(' + JSON.stringify(LIVE_T[mk] || LIVE_T.nl) + ',' + JSON.stringify(mk) + ');</script>';
export function voorkantPagina(markt, o) {
  o = o || {}; const mk = VOORKANT[markt] ? markt : 'nl', arm = /^[abcd]$/.test(o.arm || '') ? o.arm : 'a', sj = VK[arm + '-' + mk];
  if (!sj) return voorkantOud(mk);
  const { css, js } = kzuxBlokVoorkant(mk);
  const P = { s: 'kzvk', pid: /^[0-9a-f]{12}$/.test(o.pid || '') ? o.pid : '', d: o.d || '', r: o.r || 1, v: arm, c: o.c || 'd', n: o.nieuw ? 1 : 0 };
  const vk = P.pid ? '<script>(function(){var P=' + JSON.stringify(P).replace(/</g, '\\u003c') + ';if(navigator.webdriver)return;'
    + 'function z(o){o.site=P.s;o.pid=P.pid;o.d=P.d;o.r=P.r;var j=JSON.stringify(o);try{if(!(navigator.sendBeacon&&navigator.sendBeacon("/api/mm/proefev",new Blob([j],{type:"text/plain"}))))fetch("/api/mm/proefev",{method:"POST",body:j,keepalive:true,headers:{"content-type":"text/plain"}})}catch(e){}}'
    + 'var terug=P.d<new Date().toISOString().slice(0,10),n=0,t=0;if(P.n)z({e:"zie",c:P.c,v:{vorm:P.v}});'
    + 'window.__kxEv=function(e){if(e==="zie"||e==="winkel")return;if(terug&&!t){t=1;z({e:"terug"})}if(e==="vraag"){n++;z({e:n>1?"gesprek":"vraag"})}else if(e==="blijf")z({e:"blijf"});else z({e:"tik"})};'
    + '})();</script>' : '';
  // chirurgie als gewone rij in de lijst populair (Henkjan 19 nov 2026: "rest vd ux met dat blauw opruimen"; eerst een los blok "Ook vergelijken")
  let h = sj;
  { const li = '<li><a href="' + ({ nl: '/chirurgie/nl', us: '/surgery', de: '/chirurgie/de' })[mk] + '">' + ({ nl: 'Kosten van een ingreep, ook in het buitenland', us: 'Surgery costs at home and abroad', de: 'Kosten einer OP, auch im Ausland' })[mk] + '</a></li>', p = h.indexOf('class="pop"'), alle = p < 0 ? -1 : h.indexOf('<li class="alle"', p), ul = p < 0 ? -1 : h.indexOf('</ul>', p);
    const at = alle > 0 && (ul < 0 || alle < ul) ? alle : ul; if (at > 0) h = h.slice(0, at) + li + h.slice(at); }
  return h.replace('<!--KXCSS-->', () => css).replace('<!--KXJS-->', () => vk + js + LIVE_JS(mk)).replace('<!--VKMEET-->', () => VK_RUST + (o.meet || ''));
}

function voorkantOud(markt) {
  const v = VOORKANT[markt] || VOORKANT.nl; const url = 'https://' + v.host + '/'; const taal = markt === 'us' || markt === 'de' ? markt : 'nl';
  const chat = kzuxBlok({ alleenChat: true, kop: v.kop, taal, site: v.site, slug: 'vraag', term: { nl: 'je keuze', us: 'your choice', de: 'deiner Wahl' }[taal], shop: '', prods: [], opties: [], faq: [], vragen: v.vragen, terug: true, geenVolg: true, t: { tik: v.tik }, ...rekenVoorkant(taal) });
  const pop = '<section class="pop"><h2>' + esc(v.popKop) + '</h2><ul>' + v.pop.map(([h, t]) => '<li><a href="' + esc(h) + '">' + esc(t) + '</a></li>').join('') + '</ul><p><a href="' + esc(v.alle[0]) + '">' + esc(v.alle[1]) + '</a></p></section>';
  const ld = { '@context': 'https://schema.org', '@type': 'WebSite', name: v.title, url, inLanguage: v.lang, description: v.desc };
  return '<!doctype html><html lang="' + v.lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(v.title) + '</title><meta name="description" content="' + esc(v.desc) + '"><link rel="canonical" href="' + esc(url) + '"><meta name="robots" content="index,follow"><link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt"><script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + VK_CSS() + '</head><body><header class="topbar"><nav></nav></header><main><article class="wrap vk"><h1>' + esc(v.h1) + '</h1><p class="lead">' + esc(v.lead) + '</p>' + chat + pop + '</article></main></body></html>';
}

export function vinderPagina(markt) {
  const v = VINDER[markt] || VINDER.nl; const url = 'https://' + v.host + v.pad;
  const chat = kzuxBlok({ alleenChat: true, kop: v.kop, taal: markt === 'us' || markt === 'de' ? markt : 'nl', site: 'kzuxvinder' + (markt === 'nl' ? '' : markt), slug: 'cadeau-vinden', term: { nl: 'cadeaus', us: 'gifts', de: 'Geschenke' }[markt] || 'cadeaus', shop: '', prods: [], opties: [], faq: [], vragen: v.vragen, terug: true, geenVolg: true, t: { tik: v.tik } });
  const ld = { '@context': 'https://schema.org', '@type': 'WebPage', name: v.title, description: v.desc, url, inLanguage: v.lang };
  return '<!doctype html><html lang="' + v.lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(v.title) + '</title><meta name="description" content="' + esc(v.desc) + '"><link rel="canonical" href="' + esc(url) + '"><meta name="robots" content="index,follow"><script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + VK_CSS() + '</head><body><header class="topbar"><nav></nav></header><main><article class="wrap vk"><h1>' + esc(v.h1) + '</h1><p class="lead">' + esc(v.lead) + '</p>' + chat + '</article></main></body></html>';
}
