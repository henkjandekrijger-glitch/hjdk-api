// Vraag-eerst cadeauvinder (18 nov 2026, Henkjan: "hoe we hier de grootste intent database van maken 100k intents voor eind dit jaar").
// Onderzoek: een chat naast de pagina haalt 1 tot 3% van de bezoekers, een eerste vraag met tikopties bovenaan 15 tot 35%. Hier IS de chat de pagina:
// de bezoeker tikt voor wie het is, de chat (lib/kzchat.js) haalt wat, voor wie, budget en wanneer eruit en wijst de keuzehulp aan die past.
// keuzehulp.best/cadeau-vinden, whichtobuy.best/gift-finder, kaufberater.best/geschenk-finden (vercel.json, api/keuze-tools.js tool=vinder).
import { kzuxBlok } from './kzux.js';

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

export function vinderPagina(markt) {
  const v = VINDER[markt] || VINDER.nl; const url = 'https://' + v.host + v.pad;
  const chat = kzuxBlok({ alleenChat: true, kop: v.kop, taal: markt === 'us' || markt === 'de' ? markt : 'nl', site: 'kzuxvinder' + (markt === 'nl' ? '' : markt), slug: 'cadeau-vinden', term: { nl: 'cadeaus', us: 'gifts', de: 'Geschenke' }[markt] || 'cadeaus', shop: '', prods: [], opties: [], faq: [], vragen: v.vragen, t: { tik: v.tik } });
  const ld = { '@context': 'https://schema.org', '@type': 'WebPage', name: v.title, description: v.desc, url, inLanguage: v.lang };
  return '<!doctype html><html lang="' + v.lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(v.title) + '</title><meta name="description" content="' + esc(v.desc) + '"><link rel="canonical" href="' + esc(url) + '"><meta name="robots" content="index,follow"><script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script></head><body><header class="topbar"><nav></nav></header><main><article class="wrap"><h1>' + esc(v.h1) + '</h1><p class="lead">' + esc(v.lead) + '</p>' + chat + '</article></main></body></html>';
}
