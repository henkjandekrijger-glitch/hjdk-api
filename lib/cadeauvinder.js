// Vraag-eerst cadeauvinder (18 nov 2026, Henkjan: "hoe we hier de grootste intent database van maken 100k intents voor eind dit jaar").
// Onderzoek: een chat naast de pagina haalt 1 tot 3% van de bezoekers, een eerste vraag met tikopties bovenaan 15 tot 35%. Hier IS de chat de pagina:
// de bezoeker tikt voor wie het is, de chat (lib/kzchat.js) haalt wat, voor wie, budget en wanneer eruit en wijst de keuzehulp aan die past.
// keuzehulp.best/cadeau-vinden, whichtobuy.best/gift-finder, kaufberater.best/geschenk-finden (vercel.json, api/keuze-tools.js tool=vinder).
import { kzuxBlok } from './kzux.js';
import { lookNieuw } from './look.js';
import { VK } from './vk-sjablonen.js';
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

function kzuxVoorkant(markt) {
  const v = VOORKANT[markt] || VOORKANT.nl, taal = markt === 'us' || markt === 'de' ? markt : 'nl';
  return kzuxBlok({ alleenChat: true, kop: v.kop, taal, site: v.site, slug: 'vraag', term: { nl: 'je keuze', us: 'your choice', de: 'deiner Wahl' }[taal], shop: '', prods: [], opties: [], faq: [], vragen: v.vragen, terug: true, geenVolg: true, t: { tik: v.tik } });
}
// chat-opmaak en chat-script los, voor de sjablonen van de vier ontwerpen (scripts/vk-bouw.mjs, lib/vk-sjablonen.js)
export function kzuxBlokVoorkant(markt) {
  const h = kzuxVoorkant(markt), a = h.indexOf('<style>'), b = h.indexOf('</style>'), e = h.lastIndexOf('</section>');
  return { css: h.slice(a + 7, b), js: h.slice(e + 10), html: h };
}

// Voorkant als proef (19 nov 2026, Henkjan: "We gaan ze allemaal testen waar chat best converteert naar betrokken chatter die terugkomt ."):
// vier ontwerpen (a minimalist, b conversie, c mobiel en toegankelijk, d rust en typografie), per persoon vast via cookie kzvk, proef kzvk in lib/proef.js.
// o = { arm, pid, d, r, c, nieuw, meet } ; meet = HTML voor cm.js, funnel en bezoekteller (api/keuze-tools.js).
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
  const surgery = mk === 'nl' ? '<section aria-label="Ook vergelijken"><h2>Ook vergelijken</h2><p><a href="/chirurgie/nl">Medische ingrepen en tandheelkunde: kosten, klinieken en broncontrole</a></p></section>' : '';
  return sj.replace('</article>', surgery + '</article>').replace('<!--KXCSS-->', () => css).replace('<!--KXJS-->', () => vk + js).replace('<!--VKMEET-->', () => o.meet || '');
}

function voorkantOud(markt) {
  const v = VOORKANT[markt] || VOORKANT.nl; const url = 'https://' + v.host + '/'; const taal = markt === 'us' || markt === 'de' ? markt : 'nl';
  const chat = kzuxBlok({ alleenChat: true, kop: v.kop, taal, site: v.site, slug: 'vraag', term: { nl: 'je keuze', us: 'your choice', de: 'deiner Wahl' }[taal], shop: '', prods: [], opties: [], faq: [], vragen: v.vragen, terug: true, geenVolg: true, t: { tik: v.tik } });
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
