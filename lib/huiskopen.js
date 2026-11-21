// Huis kopen en makelaars per plaats op keuzehulp.best (19 nov 2026). Aanleiding: een echte chatvraag "Ik wil een huis kopen in Gouda" en de
// chat had geen keuzehulp. Henkjan: "JA huis kopen is wel waardevol . Kijk goed naar demand radar . Zodat content erbij goed werkt . We kunnen
// makelaars vergelijken ....". Bouwt voort op de dienstengids Rotterdam (lib/rdam.js): dezelfde OpenStreetMap-aanpak, helpers, opmaak en tikken,
// nu per gemeente. De makelaars (ook Rotterdam, /makelaar/rotterdam) staan sinds 19 nov 2026 in lib/makelaar.js.
// Regels: feiten op /huis-kopen alleen met bron en datum (BRON en FAQ hieronder). Zoekvraag: Demand Radar thema huiskopen (NL).
import { kv } from './db.js';
import { kzuxBlok } from './kzux.js';
import { esc, CSS as RCSS } from './rdam.js';
import * as MK from './makelaar.js'; // makelaars per plaats, Keuzehulp-score, meningen en aanvragen (19 nov 2026)

const HOST = 'keuzehulp.best', B = 'https://' + HOST;
// ---------- feiten met bron en datum (opgehaald 19 nov 2026) ----------
const BRON = {
  bd: ['Belastingdienst, startersvrijstelling (gewijzigd 6 januari 2026)', 'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/woning/overdrachtsbelasting/startersvrijstelling'],
  ro: ['Rijksoverheid, vrijstelling overdrachtsbelasting (gewijzigd 17 november 2026)', 'https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/huis-kopen/vrijstelling-overdrachtsbelasting'],
  cb: ['Consumentenbond, dit verandert er voor je hypotheek in 2027 (2 november 2026)', 'https://www.consumentenbond.nl/hypotheek/dit-verandert-er-voor-je-hypotheek-in-2027'],
  bed: ['Rijksoverheid, bedenktijd na het kopen van een woning (gewijzigd 6 augustus 2026)', 'https://www.rijksoverheid.nl/onderwerpen/huis-kopen/vraag-en-antwoord/hoeveel-bedenktijd-heb-ik-na-het-kopen-van-een-woning'],
  max: ['Rijksoverheid, maximaal bedrag lenen voor een koopwoning (gewijzigd 12 augustus 2026)', 'https://www.rijksoverheid.nl/onderwerpen/huis-kopen/vraag-en-antwoord/maximaal-bedrag-lenen-koopwoning'],
  kb: ['Kamerbrief over regulering van de makelaardij (1 oktober 2026)', 'https://omgevingsweb.nl/wp-content/uploads/2026/10/Kamerbrief-over-regulering-makelaardij.pdf'],
  hyp: ['Hypotheker, Prinsjesdag 2026: wat verandert er voor huizenkopers in 2027 (17 september 2026)', 'https://www.hypotheker.nl/actueel/nieuwsberichten/2026/prinsjesdag-2026-wat-verandert-er-voor-huizenkopers-in-2027/'],
  abn: ['ABN AMRO, bijkomende kosten huis kopen (4 februari 2025)', 'https://www.abnamro.nl/nl/prive/hypotheken/wonen/bijkomende-kosten.html'],
  unive: ['Univé, onderzoeksplicht koper (geraadpleegd 19 november 2026)', 'https://www.unive.nl/hypotheek/huis-kopen/onderzoeksplicht-koper'],
};
const bron = k => '<a href="' + esc(BRON[k][1]) + '" target="_blank" rel="noopener nofollow">' + esc(BRON[k][0]) + '</a>';
// FAQ: de grootste vragen uit Demand Radar (huiskopen, NL), alleen met antwoorden uit de bronnen hierboven
export const FAQ = [
  ['Hoeveel overdrachtsbelasting betaal ik als ik een huis koop?', 'Ga je er zelf wonen, dan 2% van de koopsom. Ben je 18 jaar of ouder en jonger dan 35, ga je er zelf wonen en heb je de startersvrijstelling nog niet gebruikt, dan betaal je niets, zolang de woning niet meer waard is dan € 555.000 (2026) of € 615.000 (vanaf 1 januari 2027). Een huis waar je niet zelf woont: 8% in 2026; het kabinet wil dat in 2027 verlagen naar 7%.', 'ro'],
  ['Wat is de startersvrijstelling?', 'Je betaalt geen overdrachtsbelasting als je 18 jaar of ouder en jonger dan 35 bent op de dag dat je bij de notaris tekent, je er zelf langere tijd gaat wonen, je de vrijstelling nog niet eerder hebt gebruikt en de woning niet meer waard is dan € 555.000 in 2026. Vanaf 1 januari 2027 is die grens € 615.000.', 'bd'],
  ['Wat is de NHG-grens in 2027?', 'Vanaf 1 januari 2027 kun je een hypotheek met Nationale Hypotheek Garantie krijgen voor een huis tot € 500.000, of tot € 530.000 als je het extra bedrag helemaal aan energiebesparende maatregelen besteedt. In 2026 is de grens € 470.000. Je betaalt eenmalig 0,4% van je hypotheek voor de garantie.', 'cb'],
  ['Hoeveel hypotheek kan ik krijgen?', 'Dat hangt af van je inkomen, de rente, de rentevaste periode en wat je verder afbetaalt, zoals een lening of studieschuld. De grenzen voor het inkomen worden elk jaar opnieuw vastgesteld. Je kunt tot 100% van de waarde van het huis lenen; met energiebesparende maatregelen en een zuinig energielabel kan het iets meer zijn. Reken het uit met je eigen inkomen op keuzehulp.best/hypotheek-berekenen.', 'max'],
  ['Hoeveel bedenktijd heb ik na het kopen van een huis?', 'Drie dagen. De bedenktijd begint de dag nadat je het getekende koopcontract hebt ontvangen. Minstens twee van die dagen zijn geen zaterdag, zondag of feestdag; anders komt er een dag bij. In die tijd kun je zonder reden van de koop afzien.', 'bed'],
  ['Hoeveel is kosten koper?', 'Kosten koper is geen vast percentage. Het betekent dat jij de kosten van de overdracht betaalt bovenop de koopsom: de overdrachtsbelasting, de notaris voor de leveringsakte en de hypotheekakte, en de inschrijving in het Kadaster. Daarnaast heb je meestal kosten voor een taxatie, hypotheekadvies, eventueel NHG, een bouwkundige keuring en een aankoopmakelaar. ABN AMRO rekent als vuistregel met 5 tot 6% van de koopsom, inclusief 2% overdrachtsbelasting. Kosten koper berekenen voor jouw koopsom kan op keuzehulp.best/hypotheek-berekenen.', 'abn'],
  ['Is een bouwkundige keuring verplicht?', 'Nee, een bouwkundige keuring is niet verplicht. Als koper heb je wel een onderzoeksplicht: je moet zelf redelijke moeite doen om belangrijke informatie over het huis te controleren, door vragen te stellen, documenten te bekijken en bij twijfel extra onderzoek te laten doen. De verkoper moet gebreken melden die hij kent (mededelingsplicht). Wil je een keuring, spreek dan in het koopcontract een ontbindende voorwaarde voor de bouwkundige keuring af en vraag vooraf de prijs op.', 'unive'],
  ['Wat kost een aankoopmakelaar?', 'Dat spreek je met het kantoor af: een percentage van de koopsom of een vaste prijs. De bedragen verschillen per kantoor, daarom noemen we ze niet. Vraag twee of drie makelaars om een prijs op papier en vergelijk wat erbij zit, zoals bezichtigingen, het bod en de bouwkundige keuring.', ''],
  ['Heb ik een aankoopmakelaar nodig?', 'Het is niet verplicht. De makelaar van de verkoper werkt voor de verkoper; een aankoopmakelaar werkt voor jou en helpt met de waarde, het bod en de voorwaarden in het koopcontract. Sinds 2001 mag iedereen zich makelaar noemen, dus kijk of het kantoor lid is van NVM, VBO of Vastgoedpro.', 'kb'],
  ['Hoeveel hypotheekrente mag ik aftrekken in 2027?', 'In 2027 mag je de hypotheekrente aftrekken tegen hoogstens 38,16%, iets meer dan in 2026 (37,56%). Dat staat in het Belastingplan 2027, dat nog door de Tweede en Eerste Kamer moet.', 'hyp'],
];

// ---------- opmaak (de opmaak van lib/rdam.js; kop en voet komen uit lib/huisstijl.js) ----------
const ORG = { '@type': 'Organization', '@id': B + '/#org', name: 'keuzehulp.best', url: B + '/' };
const EXTRA = '.kaart{background:var(--acc2,#EEF1FC);border-radius:14px;padding:18px 20px;margin:16px 0}.kaart p:last-child{margin:0}.stap{counter-reset:s;list-style:none;padding:0}.stap li{counter-increment:s;padding:10px 0 10px 40px;position:relative;border-bottom:1px solid var(--line)}.stap li:before{content:counter(s);position:absolute;left:0;top:10px;width:26px;height:26px;border-radius:50%;background:var(--acc);color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}.bron{font-size:13px;color:var(--muted,#6B7280)}.bron a{color:inherit}';
function doc({ titel, desc, pad, body, schema, noindex }) {
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titel) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + B + pad + '">' + (noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-snippet:-1">') +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="alternate" type="text/plain" href="/llms.txt"><style>' + RCSS + EXTRA + '</style><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head><body><header class="topbar"><div class="wrap"><a class="mark" href="/">keuzehulp<em>.best</em></a><nav class="topnav"><a href="/huis-kopen">Huis kopen</a><a href="/makelaar">Makelaars</a><a href="/verzekeringen">Verzekeringen</a></nav></div></header><main><div class="wrap">' + body +
    '</div></main><footer><div class="wrap"><p>Makelaars uit OpenStreetMap (© OpenStreetMap-bijdragers, ODbL). Niemand betaalt voor een plek in deze lijst.</p></div></footer>' + TIK + '</body></html>';
}
// bezoek en tikken in dezelfde tellers als de dienstengids (lib/rdam.js tik, dienst makelaar)
const TIK = '<script>(function(){try{var u=navigator.userAgent||"";if(/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(u)||navigator.webdriver)return;var r=document.referrer||"",h="";try{h=r?new URL(r).hostname.replace(/^www\\./,""):""}catch(x){}var b=!h?"direct":h===location.hostname.replace(/^www\\./,"")?"intern":/(^|\\.)google\\./.test(h)?"google":/bing\\.|duckduckgo/.test(h)?"bing":/chatgpt|openai|perplexity|copilot|gemini|claude/.test(h)?"ai":"overig";navigator.sendBeacon("/api/keuze-tools?tool=huis&op=tik",new Blob([JSON.stringify({e:"zie",pl:"huis-kopen",b:b})],{type:"text/plain"}))}catch(x){}})();document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[data-t]");if(!a)return;try{navigator.sendBeacon("/api/keuze-tools?tool=huis&op=tik",new Blob([JSON.stringify({pl:"huis-kopen",e:a.getAttribute("data-t")})],{type:"text/plain"}))}catch(x){}},true)</script>';
const chat = (slug, term, faq) => kzuxBlok({ alleenChat: true, kop: 'Vraag het de keuzehulp', taal: 'nl', site: 'kzuxhuis', slug, term, shop: '', prods: [], opties: [], faq: faq.map(([q, a]) => ({ q, a })) });
const faqBlok = faq => faq.map(([q, a, k]) => '<details class="faq"><summary>' + esc(q) + '</summary><p>' + esc(a) + (k ? ' <span class="bron">Bron: ' + bron(k) + '</span>' : '') + '</p></details>').join('');
const faqLd = faq => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const kruim = l => ({ '@type': 'BreadcrumbList', itemListElement: l.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: B + u })) });
// ---------- /huis-kopen ----------
export async function huisKopen() {
  const pl = await MK.plaatsLijst();
  const h1 = 'Huis kopen: kosten koper, hypotheek en makelaar';
  const body = '<p class="crumbs"><a href="/">keuzehulp.best</a> › Huis kopen</p><h1>' + esc(h1) + '</h1>' + chat('huis-kopen', 'huis kopen', FAQ) +
    '<div class="kaart"><p><strong>Kort:</strong> ga je er zelf wonen, dan betaal je 2% overdrachtsbelasting; ben je 18 tot 35 jaar en heb je de startersvrijstelling nog niet gebruikt, dan niets tot een woningwaarde van € 555.000 in 2026 en € 615.000 vanaf 1 januari 2027. Een hypotheek met NHG kan in 2027 tot € 500.000. Na het tekenen van het koopcontract heb je 3 dagen bedenktijd. Je leent hoogstens 100% van de woningwaarde, dus de kosten koper betaal je meestal zelf.</p><p class="bron">Bronnen: ' + bron('bd') + ', ' + bron('ro') + ', ' + bron('cb') + ', ' + bron('bed') + ', ' + bron('max') + '.</p></div>' +
    '<h2>Zo koop je een huis in 7 stappen</h2><ol class="stap">' + [
      '<strong>Weet wat je kunt lenen.</strong> Je maximale hypotheek hangt af van je inkomen, de rente, de rentevaste periode en wat je verder afbetaalt (ook studieschuld). <a href="/hypotheek-berekenen">Bereken je maximale hypotheek</a> met de leennormen van 2027, en laat het voor je bod nakijken door een hypotheekadviseur. De rente van nu: <a href="/hypotheekrente">hypotheekrente per rentevaste periode</a>.',
      '<strong>Zoek en bezichtig.</strong> Kijk ook naar het energielabel: met een zuinig label mag je in 2027 iets meer lenen, en voor verduurzamen kun je extra lenen tot hoogstens 106% van de woningwaarde.',
      '<strong>Kies of je een aankoopmakelaar neemt.</strong> De makelaar van de verkoper werkt voor de verkoper. Een eigen aankoopmakelaar helpt met de waarde en het bod. Vraag vooraf de prijs op papier. <a href="/makelaar">Makelaars per plaats</a>.',
      '<strong>Bied met voorwaarden.</strong> Spreek ontbindende voorwaarden af, bijvoorbeeld voor de financiering en een bouwkundige keuring. Zonder die voorwaarden zit je vast aan de koop als je hypotheek niet doorgaat.',
      '<strong>Teken het koopcontract.</strong> Daarna heb je 3 dagen bedenktijd. In het contract staat ook of je een waarborgsom of bankgarantie moet regelen.',
      '<strong>Regel taxatie en hypotheek.</strong> De bank wil weten wat het huis waard is; een taxateur bepaalt die waarde. Kies of je NHG wilt (in 2027 tot € 500.000, eenmalig 0,4%).',
      '<strong>Ga naar de notaris.</strong> Je tekent de leveringsakte en de hypotheekakte; de notaris schrijft het huis op jouw naam in bij het Kadaster. Meestal krijg je die dag de sleutel.'].map(t => '<li>' + t + '</li>').join('') + '</ol>' +
    '<h2>Kosten koper berekenen: wat betaal je bovenop de koopsom?</h2><ul class="feit">' + [
      'Overdrachtsbelasting: 2% als je er zelf gaat wonen, 0% met de startersvrijstelling, 8% (2026) als je er niet zelf woont; het kabinet wil dat in 2027 naar 7% verlagen.',
      'Notaris: de leveringsakte en de hypotheekakte, met de inschrijving in het Kadaster.',
      'Taxatie van het huis voor de bank.',
      'Hypotheekadvies en de afsluitkosten van de hypotheek.',
      'NHG: eenmalig 0,4% van je hypotheek, als je die garantie neemt.',
      'Bouwkundige keuring en, als je die neemt, een aankoopmakelaar.'].map(t => '<li>' + esc(t) + '</li>').join('') + '</ul><p>Vraag voor elke post een prijs vooraf; de bedragen verschillen per kantoor en per huis, daarom noemen we ze niet. ABN AMRO rekent als vuistregel met 5 tot 6% van de koopsom, inclusief 2% overdrachtsbelasting (' + bron('abn') + '). <a href="/hypotheek-berekenen">Kosten koper berekenen</a> voor jouw koopsom, met het eigen geld dat je nodig hebt.</p>' +
    '<h2>Makelaar per plaats</h2><p>Alle makelaars in de gemeente op volgorde van de Keuzehulp-score: complete gegevens, lid van NVM, VBO of Vastgoedpro, prijs op de eigen site, reviews op andere platforms en meningen van bezoekers. Bij elk kantoor vraag je in één tik een offerte of gratis waardebepaling aan. Niemand betaalt voor een plek.</p>' + (pl.length ? '<ul class="cards">' + pl.map(x => '<li><a href="' + x.href + '">Beste makelaar in ' + esc(x.naam) + '</a><span>' + x.n + ' kantoren vergeleken</span></li>').join('') + '</ul>' : '<p><a href="/makelaar">Makelaars per plaats</a></p>') +
    '<h2>Na de koop</h2><ul><li><a href="/verzekeringen">Opstal- en inboedelverzekering vergelijken</a>: de bank vraagt meestal een opstalverzekering vanaf de dag van de overdracht.</li><li><a href="/energieleverancier-vergelijken">Energieleverancier kiezen</a> voor je nieuwe adres.</li><li><a href="/thuisbatterij">Thuisbatterij</a> en <a href="/zorgverzekering">zorgverzekering 2027</a>.</li></ul><p>Een huis op Curaçao kopen gaat volgens andere regels, met eigen notarissen en makelaars: <a href="https://curacao.day/nl/huis-kopen">huis kopen op Curaçao</a>.</p>' +
    '<h2>Vragen over huis kopen</h2>' + faqBlok(FAQ) + '<p class="bron">Alle bedragen met bron en datum; gecontroleerd op 19 november 2026. Voor 2027 staan sommige plannen in het Belastingplan 2027, dat nog door de Eerste Kamer moet.</p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', '@id': B + '/huis-kopen', url: B + '/huis-kopen', name: h1, inLanguage: 'nl-NL', dateModified: '2026-11-19', publisher: { '@id': ORG['@id'] }, citation: Object.values(BRON).map(b => b[1]) }, kruim([['keuzehulp.best', '/'], ['Huis kopen', '/huis-kopen']]), faqLd(FAQ)] };
  return doc({ titel: 'Huis kopen 2027: kosten koper, hypotheek en makelaar', desc: 'Huis kopen in 7 stappen: overdrachtsbelasting 2% of 0% voor starters tot € 615.000 in 2027, NHG tot € 500.000, 3 dagen bedenktijd en makelaars per plaats.', pad: '/huis-kopen', body, schema });
}

// ---------- sitemap, IndexNow, chat, llms.txt (de makelaars komen uit lib/makelaar.js) ----------
export const { hub, plaatsPagina, zaakPagina, ververs, verversOudste, scanRonde, meningPost, leadPost, leads, tik, isPlaats } = MK;
export async function sitemap() {
  const urls = [B + '/huis-kopen'].concat(await MK.sitemapUrls());
  return { urls, xml: '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(u => '<url><loc>' + esc(u) + '</loc></url>').join('') + '</urlset>' };
}
export async function meldNieuw() {
  const { createHash } = await import('node:crypto'); const hk = u => createHash('sha1').update(u).digest('hex').slice(0, 10);
  const gezien = new Set((await kv.get('hk:ping').catch(() => null)) || []); const { urls } = await sitemap(); const nieuw = urls.filter(u => !gezien.has(hk(u))); if (!nieuw.length) return { nieuw: 0 };
  const key = '466971cbc1bbe43e6bb64a94465e4470';
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key, keyLocation: B + '/' + key + '.txt', urlList: nieuw.slice(0, 9000) }), signal: AbortSignal.timeout(20000) }).catch(() => null);
  if (r && r.status < 300) { nieuw.forEach(u => gezien.add(hk(u))); await kv.set('hk:ping', [...gezien]).catch(() => {}); }
  return { nieuw: nieuw.length, status: r ? r.status : 'fout' };
}
// gewijzigde pagina's opnieuw melden: /huis-kopen, /makelaar en de stadspagina's (niet de kantoorpagina's)
export async function ping() {
  const { urls } = await sitemap(), urlList = urls.filter(u => /\/(huis-kopen|makelaar)(\/[a-z-]+)?$/.test(u)), key = '466971cbc1bbe43e6bb64a94465e4470';
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key, keyLocation: B + '/' + key + '.txt', urlList }), signal: AbortSignal.timeout(20000) }).catch(() => null);
  return { n: urlList.length, status: r ? r.status : 'fout' };
}
// voor de chat (lib/kzchat.js): huis kopen als keuzehulp met de feiten, en de makelaars per plaats met hun ranglijst
export async function chatItems() {
  const pl = await MK.plaatsLijst(), lijst = pl.map(o => o.href.replace('/makelaar/', 'makelaar-') + ' (' + o.naam + ', ' + o.n + ' makelaars)').join(', ');
  const feiten = FAQ.map(([q, a]) => q + ' ' + a).join(' ');
  return [{ slug: 'huis-kopen', pad: '/huis-kopen', term: 'huis kopen', title: 'Huis kopen 2027: kosten koper, hypotheek en makelaar',
    kort: 'Huis kopen in 7 stappen: wat je kunt lenen, bieden met voorbehoud, 3 dagen bedenktijd, taxatie, NHG en notaris. Overdrachtsbelasting 2% of 0% voor starters.',
    uitleg: feiten + ' Makelaars per plaats op deze site (slug): ' + lijst + '. Noemt de bezoeker een plaats uit die lijst, wijs dan die makelaarspagina aan (zet de slug in pagina). Staat de plaats er niet in, zeg dat eerlijk en wijs deze pagina of /makelaar aan.',
    faq: FAQ.map(([q, a]) => ({ q, a })) }].concat(await MK.chatItems());
}
export async function llmsDeel() {
  return '\n\n## Huis kopen en makelaars ([huis kopen](' + B + '/huis-kopen))\n\n- [Huis kopen 2027: kosten koper, hypotheek en makelaar](' + B + '/huis-kopen): 7 stappen, overdrachtsbelasting en startersvrijstelling (tot € 615.000 vanaf 2027), NHG tot € 500.000 in 2027, 3 dagen bedenktijd; elk bedrag met bron en datum.' + await MK.llmsDeel();
}
export async function stand() { return MK.stand(); }
