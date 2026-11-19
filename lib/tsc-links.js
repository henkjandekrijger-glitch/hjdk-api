// todayin surgery: slimme onderlinge links (Henkjan 17 nov 2026: "zorg dat alle keuzehulpen slim gelinkt worden").
// Elke pagina krijgt onderaan één blok met hooguit acht links naar wat er echt bij hoort, in de eigen taal:
// zelfde ingreep eerst (ranglijst per bestemming, ranglijst per ingreep, kostengids, vergelijking van twee klinieken, de drie
// hoogst genoteerde aanbieders), dan zelfde land (zo check je een chirurg), dan zusteringrepen uit dezelfde groep en de datapagina's.
// De linktekst is de zoekterm zelf (Demand Radar, 16 nov 2026: mensen zoeken op "<ingreep> kosten", "<ingreep> <land>",
// "<kliniek> ervaringen"), geen "lees meer". Wat al in de pagina staat komt er niet nog een keer bij. Geen links naar noindex-pagina's.
// Nieuwe paginasoort: voeg hem toe in nodes(), dan krijgt hij vanzelf links erheen en ervandaan.
import { PAGES, CHECK } from './tsc-data.js';
import { LIJSTEN, RANK_SLUGS } from './tsc-rank.js';
import { reviewRanking } from './tsc-reviewrank.js';
import { PROCEDURE_BY_ID, procedureLabel } from './tsc-catalog.js';
import { choiceTitle } from './tsc-ranking-ui.js';
import { providerEntries, COMPARE_SLUGS, DATA_SLUGS, dataPage } from './tsc-provider.js';
import { dentalSlug } from './tsc-dental.js';
import { quoteGuideSlug } from './tsc-search-intent.js';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const kort = naam => String(naam).replace(/\s*\(.*\)\s*$/, '').trim() || String(naam);
const LAND = { TR: 'turkey', MX: 'mexico', CO: 'colombia', DO: 'dominican-republic', TH: 'thailand', KR: 'south-korea' };
const TANDEN = ['dental-implants', 'all-on-4', 'veneers', 'crowns', 'whitening', 'aligners'];
const T = {
  en: { h: 'Related comparisons', ranked: n => n + ' clinics and doctors compared', exp: 'reviews, prices and who operates', check: l => 'How to check a plastic surgeon in ' + l, dental: 'Dental treatment at home and abroad', quote: 'Dental implant cost and quote check' },
  nl: { h: 'Verwante vergelijkingen', ranked: n => n + ' klinieken en artsen vergeleken', exp: 'ervaringen, prijzen en wie opereert', check: l => 'Zo controleer je een plastisch chirurg in ' + l + ' (English)', dental: 'Tandheelkunde thuis en in het buitenland', quote: 'Tandimplantaat kosten en offertecheck' },
  de: { h: 'Verwandte Vergleiche', ranked: n => n + ' Kliniken und Ärzte im Vergleich', exp: 'Erfahrungen, Preise und wer operiert', check: l => 'So prüfen Sie einen plastischen Chirurgen in ' + l + ' (English)', dental: 'Zahnbehandlung zu Hause und im Ausland', quote: 'Zahnimplantat Kosten und Angebotscheck' }
};
const groep = id => (PROCEDURE_BY_ID[id] || {}).group || '';
const aantal = l => { const c = reviewRanking(l), d = reviewRanking(l, 'doctor'); return c.ranked.length + c.unranked.length + d.ranked.length + d.unranked.length; };

let NODES = null;
// één regel per indexeerbare pagina: adres, taal, soort, ingreep, land en de linktekst
export function nodes() {
  if (NODES) return NODES;
  const out = [];
  for (const [slug, pg] of Object.entries(PAGES)) out.push({ slug, taal: pg.taal, soort: 'gids', ingreep: pg.ingreep, land: LAND[String(pg.naar || '').toUpperCase()] || (pg.naar || ''), tekst: pg.h1 });
  for (const [slug, info] of Object.entries(RANK_SLUGS)) { const l = LIJSTEN[info.id]; if (!l || l.noindex) continue; const n = aantal(l);
    out.push({ slug, taal: info.taal, soort: l.land ? 'bestemming' : 'ingreep', ingreep: l.ingreep, land: LAND[l.land] || '', lijst: l.id, tekst: choiceTitle(l, info.taal).split(': ')[0] + (n ? ': ' + T[info.taal].ranked(n) : '') }); }
  const top = new Map();
  for (const l of Object.values(LIJSTEN)) { if (!l.land) continue; const c = reviewRanking(l), d = reviewRanking(l, 'doctor'); (d.ranked.length > c.ranked.length ? d : c).ranked.slice(0, 3).forEach((r, i) => top.set(l.id + '|' + String(r.k.id).replace(/-doctor-\d+$/, ''), i + 1)); }
  for (const e of providerEntries()) for (const [taal, slug] of Object.entries(e.slugs)) out.push({ slug, taal, soort: 'aanbieder', ingreep: e.list.ingreep, land: LAND[e.list.land] || '', lijst: e.list.id, plek: top.get(e.list.id + '|' + e.provider.id) || 0, tekst: kort(e.provider.naam) + ': ' + T[taal].exp });
  for (const [slug, c] of Object.entries(COMPARE_SLUGS())) { const l = c.pair.x.list; out.push({ slug, taal: c.taal, soort: 'paar', ingreep: l.ingreep, land: LAND[l.land] || '', lijst: l.id, tekst: kort(c.pair.x.provider.naam) + (c.taal === 'en' ? ' vs ' : c.taal === 'de' ? ' oder ' : ' of ') + kort(c.pair.y.provider.naam) }); }
  for (const k of Object.keys(CHECK)) out.push({ slug: 'check-surgeon-' + k, taal: 'en', soort: 'check', ingreep: '', land: k, naam: CHECK[k].land });
  for (const [slug, d] of Object.entries(DATA_SLUGS())) out.push({ slug, taal: d.taal, soort: 'data', ingreep: '', land: '', tekst: dataPage('', d.kind, d.taal).title });
  for (const taal of ['en', 'nl', 'de']) { out.push({ slug: dentalSlug(taal), taal, soort: 'tand', ingreep: '', land: '', tekst: T[taal].dental }); out.push({ slug: quoteGuideSlug(taal), taal, soort: 'gids', ingreep: 'dental-implants', land: '', tekst: T[taal].quote }); }
  return (NODES = out);
}
// punten: hoe goed past pagina k bij pagina ik
function punten(ik, k) {
  if (k.slug === ik.slug) return 0;
  if (k.soort === 'check') return ik.land && k.land === ik.land && ik.soort !== 'check' ? 70 : ik.soort === 'check' ? 8 : 0;
  if (k.taal !== ik.taal) return 0;
  const zelfde = ik.ingreep && k.ingreep === ik.ingreep, land = ik.land && k.land === ik.land, tand = TANDEN.includes(ik.ingreep) || ik.soort === 'tand';
  if (k.soort === 'bestemming') return zelfde ? 100 : land ? 60 : ik.soort === 'data' || ik.soort === 'check' ? 30 : 0;
  if (k.soort === 'ingreep') return zelfde ? 95 : groep(k.ingreep) && groep(k.ingreep) === groep(ik.ingreep) ? 35 : ik.soort === 'tand' && TANDEN.includes(k.ingreep) ? 50 : 0;
  if (k.soort === 'gids') return zelfde ? 90 : groep(k.ingreep) && groep(k.ingreep) === groep(ik.ingreep) ? 25 : 0;
  if (k.soort === 'paar') return ik.lijst && k.lijst === ik.lijst ? (ik.soort === 'paar' ? 20 : 55) : zelfde ? 40 : 0;
  if (k.soort === 'aanbieder') return ik.soort === 'aanbieder' ? 0 : k.plek && ((ik.lijst && k.lijst === ik.lijst) || zelfde || (land && ik.soort === 'check')) ? 50 - k.plek : 0;
  if (k.soort === 'tand') return tand ? 45 : 0;
  if (k.soort === 'data') return ['aanbieder', 'paar', 'bestemming', 'check', 'data'].includes(ik.soort) ? 15 : ik.soort === 'gids' && ik.land ? 15 : 0;
  return 0;
}
const MAX = { bestemming: 2, ingreep: 3, gids: 2, paar: 2, aanbieder: 3, check: 1, tand: 1, data: 2 };
// het blok onderaan een pagina; body = de pagina zelf, zodat een link die er al staat niet dubbel komt
export function relatedBlock(link, slug, taal, body) {
  const all = nodes(), ik = all.find(n => n.slug === slug); if (!ik) return '';
  const telling = {}, kies = [];
  for (const k of all.map(k => [punten(ik, k), k]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0])) {
    const n = k[1], href = link(n.slug); if ((telling[n.soort] || 0) >= MAX[n.soort] || kies.length >= 8) continue;
    if (String(body || '').includes('href="' + esc(href) + '"')) continue;
    telling[n.soort] = (telling[n.soort] || 0) + 1; kies.push('<li><a href="' + esc(href) + '">' + esc(n.soort === 'check' ? T[taal].check(n.naam) : n.tekst) + '</a></li>');
  }
  return !kies.length ? '' : '<nav class="sr-related" aria-label="' + esc(T[taal].h) + '"><h2>' + esc(T[taal].h) + '</h2><ul class="sr-links">' + kies.join('') + '</ul></nav>';
}
// paginatitel van een ranglijst: de zoekterm voorop en het aantal dat we vergeleken (hooguit 60 tekens), in plaats van het eigen woord "reviewranking"
export function rankSeoTitle(list, language) {
  const naam = choiceTitle(list, language).split(': ')[0], n = aantal(list);
  const opties = language === 'nl' ? [naam + ': ' + n + ' klinieken en artsen vergeleken', naam + ': ' + n + ' aanbieders vergeleken', naam + ': ' + n + ' vergeleken'] : language === 'de' ? [naam + ': ' + n + ' Kliniken und Ärzte im Vergleich', naam + ': ' + n + ' Anbieter im Vergleich', naam + ': ' + n + ' im Vergleich'] : [naam + ': ' + n + ' clinics and doctors compared', naam + ': ' + n + ' providers compared', naam + ': ' + n + ' compared'];
  return n >= 3 ? (opties.find(o => o.length <= 60) || opties[2]) : choiceTitle(list, language);
}
