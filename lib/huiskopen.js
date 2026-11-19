// Huis kopen en makelaars per plaats op keuzehulp.best (19 nov 2026). Aanleiding: een echte chatvraag "Ik wil een huis kopen in Gouda" en de
// chat had geen keuzehulp. Henkjan: "JA huis kopen is wel waardevol . Kijk goed naar demand radar . Zodat content erbij goed werkt . We kunnen
// makelaars vergelijken ....". Bouwt voort op de dienstengids Rotterdam (lib/rdam.js): dezelfde OpenStreetMap-aanpak, helpers, opmaak en tikken,
// nu per gemeente. Rotterdam zelf staat in lib/rdam.js (dienst makelaar, /rotterdam/makelaar).
// Regels: alle makelaars uit OpenStreetMap met bron en datum, geen scores van derden, geen verzonnen tarieven; feiten op /huis-kopen alleen met
// bron en datum (FEITEN hieronder). Zoekvraag: Demand Radar thema huiskopen (NL).
// Data: KV hk:mk:<plaats> {t, items}; ververst via /api/keuze-tools?tool=huis&op=ververs (cron, de oudste plaats per keer, Overpass is gratis).
import { kv } from './db.js';
import { kzuxBlok } from './kzux.js';
import { esc, slugify, rooster, status, statusTekst, weekRegels, telLink, telTekst, webLink, webTekst, routeLink, osmLink, compleet, afstand, datumNL, CSS as RCSS, makelaarTekst } from './rdam.js';

const HOST = 'keuzehulp.best', B = 'https://' + HOST;
const MIN = 5; // minder makelaars in OSM = nog niet compleet genoeg: noindex en niet in de sitemap
// Gemeenten (OSM-naam van de gemeentegrens, admin_level 8, en een ruim vak om de gemeente: met het vak van heel Nederland liep Overpass vast). Gouda is de echte vraag; de rest de steden met de meeste "makelaar <stad>"-vraag
// in Demand Radar (thema huiskopen, 19 nov 2026, grootste term per stad: Rotterdam, Den Haag en Amsterdam 2.400 per maand, Utrecht 1.600,
// Tilburg 1.300, Leiden en Apeldoorn 1.000; Gouda haalde de 700 grootste makelaartermen niet). Rotterdam staat in lib/rdam.js.
export const PLAATSEN = [
  { slug: 'gouda', naam: 'Gouda', osm: 'Gouda', bbox: '51.98,4.62,52.06,4.78' },
  { slug: 'amsterdam', naam: 'Amsterdam', osm: 'Amsterdam', bbox: '52.27,4.72,52.44,5.08' },
  { slug: 'utrecht', naam: 'Utrecht', osm: 'Utrecht', bbox: '52.02,4.96,52.15,5.20' },
  { slug: 'den-haag', naam: 'Den Haag', osm: 'Den Haag', bbox: '51.99,4.17,52.14,4.42' },
  { slug: 'tilburg', naam: 'Tilburg', osm: 'Tilburg', bbox: '51.49,4.93,51.65,5.22' },
  { slug: 'leiden', naam: 'Leiden', osm: 'Leiden', bbox: '52.11,4.43,52.20,4.55' },
];
const P = Object.fromEntries(PLAATSEN.map(p => [p.slug, p]));
const OSM = ['nwr[office=estate_agent]', 'naam:makelaar|makelaardij'];

// ---------- feiten met bron en datum (opgehaald 19 nov 2026) ----------
const BRON = {
  bd: ['Belastingdienst, startersvrijstelling (gewijzigd 6 januari 2026)', 'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/woning/overdrachtsbelasting/startersvrijstelling'],
  ro: ['Rijksoverheid, vrijstelling overdrachtsbelasting (gewijzigd 17 november 2026)', 'https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/huis-kopen/vrijstelling-overdrachtsbelasting'],
  cb: ['Consumentenbond, dit verandert er voor je hypotheek in 2027 (2 november 2026)', 'https://www.consumentenbond.nl/hypotheek/dit-verandert-er-voor-je-hypotheek-in-2027'],
  bed: ['Rijksoverheid, bedenktijd na het kopen van een woning (gewijzigd 6 augustus 2026)', 'https://www.rijksoverheid.nl/onderwerpen/huis-kopen/vraag-en-antwoord/hoeveel-bedenktijd-heb-ik-na-het-kopen-van-een-woning'],
  max: ['Rijksoverheid, maximaal bedrag lenen voor een koopwoning (gewijzigd 12 augustus 2026)', 'https://www.rijksoverheid.nl/onderwerpen/huis-kopen/vraag-en-antwoord/maximaal-bedrag-lenen-koopwoning'],
  kb: ['Kamerbrief over regulering van de makelaardij (1 oktober 2026)', 'https://omgevingsweb.nl/wp-content/uploads/2026/10/Kamerbrief-over-regulering-makelaardij.pdf'],
  hyp: ['Hypotheker, Prinsjesdag 2026: wat verandert er voor huizenkopers in 2027 (17 september 2026)', 'https://www.hypotheker.nl/actueel/nieuwsberichten/2026/prinsjesdag-2026-wat-verandert-er-voor-huizenkopers-in-2027/'],
};
const bron = k => '<a href="' + esc(BRON[k][1]) + '" target="_blank" rel="noopener nofollow">' + esc(BRON[k][0]) + '</a>';
// FAQ: de grootste vragen uit Demand Radar (huiskopen, NL), alleen met antwoorden uit de bronnen hierboven
export const FAQ = [
  ['Hoeveel overdrachtsbelasting betaal ik als ik een huis koop?', 'Ga je er zelf wonen, dan 2% van de koopsom. Ben je 18 jaar of ouder en jonger dan 35, ga je er zelf wonen en heb je de startersvrijstelling nog niet gebruikt, dan betaal je niets, zolang de woning niet meer waard is dan € 555.000 (2026) of € 615.000 (vanaf 1 januari 2027). Een huis waar je niet zelf woont: 8% in 2026; het kabinet wil dat in 2027 verlagen naar 7%.', 'ro'],
  ['Wat is de startersvrijstelling?', 'Je betaalt geen overdrachtsbelasting als je 18 jaar of ouder en jonger dan 35 bent op de dag dat je bij de notaris tekent, je er zelf langere tijd gaat wonen, je de vrijstelling nog niet eerder hebt gebruikt en de woning niet meer waard is dan € 555.000 in 2026. Vanaf 1 januari 2027 is die grens € 615.000.', 'bd'],
  ['Wat is de NHG-grens in 2027?', 'Vanaf 1 januari 2027 kun je een hypotheek met Nationale Hypotheek Garantie krijgen voor een huis tot € 500.000, of tot € 530.000 als je het extra bedrag helemaal aan energiebesparende maatregelen besteedt. In 2026 is de grens € 470.000. Je betaalt eenmalig 0,4% van je hypotheek voor de garantie.', 'cb'],
  ['Hoeveel hypotheek kan ik krijgen?', 'Dat hangt af van je inkomen, de rente, de rentevaste periode en wat je verder afbetaalt, zoals een lening of studieschuld. De grenzen voor het inkomen worden elk jaar opnieuw vastgesteld. Je kunt tot 100% van de waarde van het huis lenen; met energiebesparende maatregelen en een zuinig energielabel kan het iets meer zijn.', 'max'],
  ['Hoeveel bedenktijd heb ik na het kopen van een huis?', 'Drie dagen. De bedenktijd begint de dag nadat je het getekende koopcontract hebt ontvangen. Minstens twee van die dagen zijn geen zaterdag, zondag of feestdag; anders komt er een dag bij. In die tijd kun je zonder reden van de koop afzien.', 'bed'],
  ['Hoeveel is kosten koper?', 'Kosten koper is geen vast percentage. Het betekent dat jij de kosten van de overdracht betaalt bovenop de koopsom: de overdrachtsbelasting, de notaris voor de leveringsakte en de hypotheekakte, en de inschrijving in het Kadaster. Daarnaast heb je meestal kosten voor een taxatie, hypotheekadvies, eventueel NHG, een bouwkundige keuring en een aankoopmakelaar.', 'max'],
  ['Wat kost een aankoopmakelaar?', 'Dat spreek je met het kantoor af: een percentage van de koopsom of een vaste prijs. De bedragen verschillen per kantoor, daarom noemen we ze niet. Vraag twee of drie makelaars om een prijs op papier en vergelijk wat erbij zit, zoals bezichtigingen, het bod en de bouwkundige keuring.', ''],
  ['Heb ik een aankoopmakelaar nodig?', 'Het is niet verplicht. De makelaar van de verkoper werkt voor de verkoper; een aankoopmakelaar werkt voor jou en helpt met de waarde, het bod en de voorwaarden in het koopcontract. Sinds 2001 mag iedereen zich makelaar noemen, dus kijk of het kantoor lid is van NVM, VBO of Vastgoedpro.', 'kb'],
  ['Hoeveel hypotheekrente mag ik aftrekken in 2027?', 'In 2027 mag je de hypotheekrente aftrekken tegen hoogstens 38,16%, iets meer dan in 2026 (37,56%). Dat staat in het Belastingplan 2027, dat nog door de Tweede en Eerste Kamer moet.', 'hyp'],
];

// ---------- data uit OpenStreetMap (gratis, zelfde aanpak als lib/rdam.js) ----------
export async function ververs(slug) {
  const p = P[slug]; if (!p) return { ok: false, fout: 'plaats' };
  const flt = OSM.flatMap(f => f.startsWith('naam:') ? ['office', 'shop', 'craft'].map(k => 'nwr["' + k + '"]["name"~"' + f.slice(5) + '",i]') : [f]);
  const q = '[out:json][timeout:35];area["name"="' + p.osm + '"]["admin_level"="8"]["boundary"="administrative"]->.a;(' + flt.map(f => f + '(' + (p.bbox || '50.7,3.2,53.7,7.3') + ')(area.a);').join('') + ');out center tags 1500;';
  let j = null; const st = []; const t0 = Date.now();
  for (const u of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) { if (Date.now() - t0 > 60000) break;
    try { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'keuzehulp.best (makelaars per plaats)' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(28000) }); st.push(r.status); if (r.ok) { j = await r.json(); break; } } catch (e) { st.push(String(e.name || e).slice(0, 30)); } }
  if (!j || !Array.isArray(j.elements)) return { ok: false, fout: 'overpass', status: st };
  const gezien = new Set(), slugs = new Set(), items = [];
  for (const e of j.elements) {
    const t = e.tags || {}, naam = String(t.name || '').trim(); if (!naam || t.highway || t.disused || t['disused:office'] || /^(yes|no)$/i.test(naam)) continue;
    if (t.office && t.office !== 'estate_agent' && !/makelaar/i.test(naam)) continue;
    const lat = e.lat ?? (e.center && e.center.lat), lon = e.lon ?? (e.center && e.center.lon); if (lat == null) continue;
    const id = e.type[0] + e.id, dub = naam.toLowerCase() + '|' + (t['addr:postcode'] || '') + '|' + (t['addr:housenumber'] || ''); if (gezien.has(dub)) continue; gezien.add(dub);
    let s = slugify(naam) || id; if (slugs.has(s)) s += '-' + (String(t['addr:postcode'] || '').replace(/\s/g, '').toLowerCase() || id); if (slugs.has(s)) s += '-' + id; slugs.add(s);
    items.push({ s, id, naam: naam.slice(0, 90), lat: +(+lat).toFixed(5), lon: +(+lon).toFixed(5), adres: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '), pc: t['addr:postcode'] || '', plaats: t['addr:city'] || p.naam,
      tel: t.phone || t['contact:phone'] || '', web: t.website || t['contact:website'] || t.url || '', uren: t.opening_hours || '', rolstoel: t.wheelchair || '' });
  }
  items.sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  const uit = { t: new Date().toISOString(), n: items.length, items };
  await kv.set('hk:mk:' + slug, uit); await kv.set('hk:t:' + slug, String(Date.now())).catch(() => {});
  return { ok: true, plaats: slug, n: items.length };
}
export async function data(slug) { return P[slug] ? await kv.get('hk:mk:' + slug).catch(() => null) : null; }
async function alleData() { const v = await Promise.all(PLAATSEN.map(p => data(p.slug))); return PLAATSEN.map((p, i) => ({ p, x: v[i] })); }
export async function verversOudste() {
  const v = await kv.mget(...PLAATSEN.map(p => 'hk:t:' + p.slug)).catch(() => []);
  let best = PLAATSEN[0].slug, bt = Infinity; PLAATSEN.forEach((p, i) => { const t = Number(v[i]) || 0; if (t < bt) { bt = t; best = p.slug; } });
  const r = await ververs(best); if (!r.ok) await kv.set('hk:t:' + best, String(Date.now() - 6 * 864e5)).catch(() => {}); return r;
}
async function rotterdamN() { try { const n = await kv.get('rdam:n'); return (n && n.makelaar) || 0; } catch (e) { return 0; } }

// ---------- opmaak (de opmaak van lib/rdam.js; kop en voet komen uit lib/huisstijl.js) ----------
const ORG = { '@type': 'Organization', '@id': B + '/#org', name: 'keuzehulp.best', url: B + '/' };
const EXTRA = '.kaart{background:var(--acc2,#EEF1FC);border-radius:14px;padding:18px 20px;margin:16px 0}.kaart p:last-child{margin:0}.stap{counter-reset:s;list-style:none;padding:0}.stap li{counter-increment:s;padding:10px 0 10px 40px;position:relative;border-bottom:1px solid var(--line)}.stap li:before{content:counter(s);position:absolute;left:0;top:10px;width:26px;height:26px;border-radius:50%;background:var(--acc);color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}.bron{font-size:13px;color:var(--muted,#6B7280)}.bron a{color:inherit}';
function doc({ titel, desc, pad, body, schema, noindex }) {
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titel) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + B + pad + '">' + (noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-snippet:-1">') +
    '<link rel="icon" href="data:,"><link rel="alternate" type="text/plain" href="/llms.txt"><style>' + RCSS + EXTRA + '</style><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head><body><header class="topbar"><div class="wrap"><a class="mark" href="/">keuzehulp<em>.best</em></a><nav class="topnav"><a href="/huis-kopen">Huis kopen</a><a href="/makelaar">Makelaars</a><a href="/verzekeringen">Verzekeringen</a></nav></div></header><main><div class="wrap">' + body +
    '</div></main><footer><div class="wrap"><p>Makelaars uit OpenStreetMap (© OpenStreetMap-bijdragers, ODbL). Niemand betaalt voor een plek in deze lijst.</p></div></footer>' + TIK + '</body></html>';
}
// bezoek en tikken in dezelfde tellers als de dienstengids (lib/rdam.js tik, dienst makelaar)
const TIK = '<script>(function(){try{var u=navigator.userAgent||"";if(/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(u)||navigator.webdriver)return;var r=document.referrer||"",h="";try{h=r?new URL(r).hostname.replace(/^www\\./,""):""}catch(x){}var b=!h?"direct":h===location.hostname.replace(/^www\\./,"")?"intern":/(^|\\.)google\\./.test(h)?"google":/bing\\.|duckduckgo/.test(h)?"bing":/chatgpt|openai|perplexity|copilot|gemini|claude/.test(h)?"ai":"overig";navigator.sendBeacon("/api/keuze-tools?tool=rdam&op=tik",new Blob([JSON.stringify({e:"zie",d:"makelaar",b:b})],{type:"text/plain"}))}catch(x){}})();document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[data-t]");if(!a)return;try{navigator.sendBeacon("/api/keuze-tools?tool=rdam&op=tik",new Blob([JSON.stringify({d:"makelaar",s:a.getAttribute("data-s"),e:a.getAttribute("data-t")})],{type:"text/plain"}))}catch(x){}},true)</script>';
const chat = (slug, term, faq) => kzuxBlok({ alleenChat: true, kop: 'Vraag het de keuzehulp', taal: 'nl', site: 'kzuxhuis', slug, term, shop: '', prods: [], opties: [], faq: faq.map(([q, a]) => ({ q, a })) });
const faqBlok = faq => faq.map(([q, a, k]) => '<details class="faq"><summary>' + esc(q) + '</summary><p>' + esc(a) + (k ? ' <span class="bron">Bron: ' + bron(k) + '</span>' : '') + '</p></details>').join('');
const faqLd = faq => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const kruim = l => ({ '@type': 'BreadcrumbList', itemListElement: l.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: B + u })) });
function knoppen(pl, x) {
  const at = t => ' data-t="' + t + '" data-s="' + esc(pl + '--' + x.s) + '"';
  return '<div class="kn">' + (x.tel ? '<a class="cta h" href="tel:' + esc(telLink(x.tel)) + '"' + at('bel') + '>Bel ' + esc(telTekst(x.tel)) + '</a>' : '') + '<a class="cta" href="' + esc(routeLink(x)) + '" target="_blank" rel="noopener nofollow"' + at('route') + '>Route</a>' + (x.web ? '<a class="cta" href="' + esc(webLink(x.web)) + '" target="_blank" rel="noopener nofollow"' + at('web') + '>Website</a>' : '') + '</div>';
}
const rang = items => items.map(x => ({ x, c: compleet(x), R: rooster(x.uren) })).sort((a, b) => b.c - a.c || a.x.naam.localeCompare(b.x.naam, 'nl'));
async function plaatsLinks(behalve) {
  const l = (await alleData()).filter(o => o.x && o.x.n >= MIN && o.p.slug !== behalve).map(o => '<a href="/makelaar/' + o.p.slug + '">' + esc(o.p.naam) + '</a>');
  if (behalve !== 'rotterdam' && (await rotterdamN()) >= 8) l.push('<a href="/rotterdam/makelaar">Rotterdam</a>');
  return l;
}

// ---------- /huis-kopen ----------
export async function huisKopen() {
  const d = await alleData(), rn = await rotterdamN();
  const pl = d.filter(o => o.x && o.x.n >= MIN).map(o => ({ naam: o.p.naam, href: '/makelaar/' + o.p.slug, n: o.x.n })).concat(rn >= 8 ? [{ naam: 'Rotterdam', href: '/rotterdam/makelaar', n: rn }] : []).sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  const h1 = 'Huis kopen: kosten koper, hypotheek en makelaar';
  const body = '<p class="crumbs"><a href="/">keuzehulp.best</a> › Huis kopen</p><h1>' + esc(h1) + '</h1>' + chat('huis-kopen', 'huis kopen', FAQ) +
    '<div class="kaart"><p><strong>Kort:</strong> ga je er zelf wonen, dan betaal je 2% overdrachtsbelasting; ben je 18 tot 35 jaar en heb je de startersvrijstelling nog niet gebruikt, dan niets tot een woningwaarde van € 555.000 in 2026 en € 615.000 vanaf 1 januari 2027. Een hypotheek met NHG kan in 2027 tot € 500.000. Na het tekenen van het koopcontract heb je 3 dagen bedenktijd. Je leent hoogstens 100% van de woningwaarde, dus de kosten koper betaal je meestal zelf.</p><p class="bron">Bronnen: ' + bron('bd') + ', ' + bron('ro') + ', ' + bron('cb') + ', ' + bron('bed') + ', ' + bron('max') + '.</p></div>' +
    '<h2>Zo koop je een huis in 7 stappen</h2><ol class="stap">' + [
      '<strong>Weet wat je kunt lenen.</strong> Je maximale hypotheek hangt af van je inkomen, de rente, de rentevaste periode en wat je verder afbetaalt (ook studieschuld). Een hypotheekadviseur rekent het voor je uit; doe dat voordat je gaat bieden.',
      '<strong>Zoek en bezichtig.</strong> Kijk ook naar het energielabel: met een zuinig label mag je in 2027 iets meer lenen, en voor verduurzamen kun je extra lenen tot hoogstens 106% van de woningwaarde.',
      '<strong>Kies of je een aankoopmakelaar neemt.</strong> De makelaar van de verkoper werkt voor de verkoper. Een eigen aankoopmakelaar helpt met de waarde en het bod. Vraag vooraf de prijs op papier. <a href="/makelaar">Makelaars per plaats</a>.',
      '<strong>Bied met voorwaarden.</strong> Spreek ontbindende voorwaarden af, bijvoorbeeld voor de financiering en een bouwkundige keuring. Zonder die voorwaarden zit je vast aan de koop als je hypotheek niet doorgaat.',
      '<strong>Teken het koopcontract.</strong> Daarna heb je 3 dagen bedenktijd. In het contract staat ook of je een waarborgsom of bankgarantie moet regelen.',
      '<strong>Regel taxatie en hypotheek.</strong> De bank wil weten wat het huis waard is; een taxateur bepaalt die waarde. Kies of je NHG wilt (in 2027 tot € 500.000, eenmalig 0,4%).',
      '<strong>Ga naar de notaris.</strong> Je tekent de leveringsakte en de hypotheekakte; de notaris schrijft het huis op jouw naam in bij het Kadaster. Meestal krijg je die dag de sleutel.'].map(t => '<li>' + t + '</li>').join('') + '</ol>' +
    '<h2>Kosten koper: wat betaal je bovenop de koopsom?</h2><ul class="feit">' + [
      'Overdrachtsbelasting: 2% als je er zelf gaat wonen, 0% met de startersvrijstelling, 8% (2026) als je er niet zelf woont; het kabinet wil dat in 2027 naar 7% verlagen.',
      'Notaris: de leveringsakte en de hypotheekakte, met de inschrijving in het Kadaster.',
      'Taxatie van het huis voor de bank.',
      'Hypotheekadvies en de afsluitkosten van de hypotheek.',
      'NHG: eenmalig 0,4% van je hypotheek, als je die garantie neemt.',
      'Bouwkundige keuring en, als je die neemt, een aankoopmakelaar.'].map(t => '<li>' + esc(t) + '</li>').join('') + '</ul><p>Vraag voor elke post een prijs vooraf; de bedragen verschillen per kantoor en per huis, daarom noemen we ze niet.</p>' +
    '<h2>Makelaar per plaats</h2><p>Alle makelaars in de gemeente, uit OpenStreetMap, met wie nu open is en bellen, route en website in één tik. Geen scores, niemand betaalt voor een plek.</p>' + (pl.length ? '<ul class="cards">' + pl.map(x => '<li><a href="' + x.href + '">Makelaar ' + esc(x.naam) + '</a><span>' + x.n + ' makelaars</span></li>').join('') + '</ul>' : '<p><a href="/makelaar">Makelaars per plaats</a></p>') +
    '<h2>Na de koop</h2><ul><li><a href="/verzekeringen">Opstal- en inboedelverzekering vergelijken</a>: de bank vraagt meestal een opstalverzekering vanaf de dag van de overdracht.</li><li><a href="/energieleverancier-vergelijken">Energieleverancier kiezen</a> voor je nieuwe adres.</li><li><a href="/thuisbatterij">Thuisbatterij</a> en <a href="/zorgverzekering">zorgverzekering 2027</a>.</li></ul><p>Een huis op Curaçao kopen gaat volgens andere regels, met eigen notarissen en makelaars: <a href="https://curacao.day/nl/huis-kopen">huis kopen op Curaçao</a>.</p>' +
    '<h2>Vragen over huis kopen</h2>' + faqBlok(FAQ) + '<p class="bron">Alle bedragen met bron en datum; gecontroleerd op 19 november 2026. Voor 2027 staan sommige plannen in het Belastingplan 2027, dat nog door de Eerste Kamer moet.</p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', '@id': B + '/huis-kopen', url: B + '/huis-kopen', name: h1, inLanguage: 'nl-NL', dateModified: '2026-11-19', publisher: { '@id': ORG['@id'] }, citation: Object.values(BRON).map(b => b[1]) }, kruim([['keuzehulp.best', '/'], ['Huis kopen', '/huis-kopen']]), faqLd(FAQ)] };
  return doc({ titel: 'Huis kopen 2027: kosten koper, hypotheek en makelaar', desc: 'Huis kopen in 7 stappen: overdrachtsbelasting 2% of 0% voor starters tot € 615.000 in 2027, NHG tot € 500.000, 3 dagen bedenktijd en makelaars per plaats.', pad: '/huis-kopen', body, schema });
}

// ---------- /makelaar ----------
export async function hub() {
  const d = await alleData(), rn = await rotterdamN();
  const rij = d.filter(o => o.x && o.x.n >= MIN).map(o => ({ naam: o.p.naam, href: '/makelaar/' + o.p.slug, n: o.x.n })).concat(rn >= 8 ? [{ naam: 'Rotterdam', href: '/rotterdam/makelaar', n: rn }] : []).sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  const tot = rij.reduce((a, x) => a + x.n, 0), mt = makelaarTekst('jouw plaats');
  const body = '<p class="crumbs"><a href="/">keuzehulp.best</a> › <a href="/huis-kopen">Huis kopen</a> › Makelaar</p><h1>Makelaar kiezen: alle makelaars per plaats</h1>' + chat('makelaar', 'makelaar', mt.faq) +
    '<div class="answer"><p>Alle ' + tot + ' makelaars in ' + rij.length + ' gemeenten, uit OpenStreetMap, met wie nu open is en bellen, route en website in één tik. Geen scores van derden; niemand betaalt voor een plek.</p></div><ul class="cards">' + rij.map(x => '<li><a href="' + x.href + '">Makelaar ' + esc(x.naam) + '</a><span>' + x.n + ' makelaars</span></li>').join('') + '</ul>' +
    '<h2>Zo kies je een makelaar</h2><ul>' + mt.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul><p class="bron">Titel makelaar: ' + bron('kb') + '.</p><p><a href="/huis-kopen">Huis kopen: kosten koper, hypotheek en bedenktijd</a></p><h2>Vragen</h2>' + faqBlok(mt.faq);
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'CollectionPage', name: 'Makelaar kiezen per plaats', url: B + '/makelaar', inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] }, hasPart: rij.map(x => ({ '@type': 'WebPage', name: 'Makelaar ' + x.naam, url: B + x.href })) }, kruim([['keuzehulp.best', '/'], ['Huis kopen', '/huis-kopen'], ['Makelaar', '/makelaar']]), faqLd(mt.faq)] };
  return doc({ titel: 'Makelaar kiezen: alle ' + tot + ' makelaars per plaats', desc: ('Makelaars in ' + rij.map(x => x.naam).join(', ') + ': alle kantoren uit OpenStreetMap met tijden, telefoon en route. Zonder scores.').slice(0, 155), pad: '/makelaar', body, schema, noindex: !rij.length });
}

// ---------- /makelaar/<plaats> ----------
export async function plaatsPagina(slug) {
  const p = P[slug]; if (!p) return null; const x0 = await data(slug); if (!x0 || !x0.items.length) return null;
  const rij = rang(x0.items), nu = new Date(), open = rij.filter(r => { const s = status(r.R, nu); return s && s.open; }).length, mt = makelaarTekst(p.naam);
  const h1 = 'Makelaar in ' + p.naam + ' kiezen';
  const li = rij.map(({ x, R }) => { const s = status(R, nu); return '<li data-open="' + (s && s.open ? 1 : 0) + '" data-web="' + (x.web ? 1 : 0) + '" data-lat="' + x.lat + '" data-lon="' + x.lon + '"><span class="n"><a href="/makelaar/' + slug + '/' + esc(x.s) + '">' + esc(x.naam) + '</a></span>' + (x.adres ? '<span class="w">' + esc(x.adres + (x.pc ? ', ' + x.pc : '')) + '</span>' : '') + (s ? '<span class="nu' + (s.open ? '' : ' dicht') + '"><i></i>' + esc(statusTekst(s)) + '</span>' : '') + knoppen(slug, x) + '</li>'; }).join('');
  const filter = '<div class="fl"><button type="button" data-f="open" aria-pressed="false">Nu open</button><button type="button" data-f="web" aria-pressed="false">Met website</button><button type="button" data-f="dicht" aria-pressed="false">Dichtbij mij</button></div>';
  const fjs = '<script>(function(){var L=document.getElementById("zl"),F={};function zet(){[].forEach.call(L.children,function(li){li.hidden=(F.open&&li.dataset.open!=="1")||(F.web&&li.dataset.web!=="1")})}document.querySelector(".fl").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var f=b.dataset.f,on=b.getAttribute("aria-pressed")!=="true";if(f==="dicht"){if(!on||!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(function(p){var a=p.coords;[].slice.call(L.children).map(function(li){var dl=li.dataset.lat-a.latitude,dn=(li.dataset.lon-a.longitude)*0.6;li._d=dl*dl+dn*dn;return li}).sort(function(x,y){return x._d-y._d}).forEach(function(li){L.appendChild(li)});b.setAttribute("aria-pressed","true")});return}b.setAttribute("aria-pressed",on?"true":"false");F[f]=on;zet()})})()</script>';
  const ander = await plaatsLinks(slug);
  const body = '<p class="crumbs"><a href="/huis-kopen">Huis kopen</a> › <a href="/makelaar">Makelaar</a> › ' + esc(p.naam) + '</p><h1>' + esc(h1) + '</h1>' + chat('makelaar-' + slug, 'makelaar ' + p.naam, mt.faq) +
    '<div class="answer"><p>Alle ' + rij.length + ' makelaars in de gemeente ' + esc(p.naam) + ' volgens OpenStreetMap' + (open ? ', ' + open + ' nu open' : '') + '. Bovenaan staan de kantoren met de meest complete gegevens (telefoon, tijden, adres, website). We tonen geen scores van andere sites en niemand betaalt voor een plek.</p><p><time datetime="' + x0.t.slice(0, 10) + '">Bijgewerkt ' + esc(datumNL(x0.t)) + '</time>, bron: OpenStreetMap.</p></div>' +
    '<h2>Zo kies je een makelaar in ' + esc(p.naam) + '</h2><ul>' + mt.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul><p class="bron">Titel makelaar: ' + bron('kb') + '.</p>' +
    '<h2>Alle ' + rij.length + ' makelaars in ' + esc(p.naam) + '</h2>' + filter + '<ul class="zaken" id="zl">' + li + '</ul>' + fjs +
    '<h2>Huis kopen in ' + esc(p.naam) + '?</h2><p>Wat je betaalt bovenop de koopsom, de startersvrijstelling, NHG en de bedenktijd: <a href="/huis-kopen">huis kopen in 7 stappen</a>. Na de koop: <a href="/verzekeringen">opstal- en inboedelverzekering</a> en <a href="/energieleverancier-vergelijken">energieleverancier</a>.</p>' +
    '<h2>Vragen over makelaars in ' + esc(p.naam) + '</h2>' + faqBlok(mt.faq) + (ander.length ? '<p class="rel">Makelaars in andere plaatsen: ' + ander.join(', ') + '</p>' : '');
  const schema = { '@context': 'https://schema.org', '@graph': [ORG,
    { '@type': 'WebPage', '@id': B + '/makelaar/' + slug, url: B + '/makelaar/' + slug, name: h1, inLanguage: 'nl-NL', dateModified: x0.t, publisher: { '@id': ORG['@id'] }, mainEntity: { '@id': B + '/makelaar/' + slug + '#lijst' } },
    { '@type': 'ItemList', '@id': B + '/makelaar/' + slug + '#lijst', name: 'Makelaars in ' + p.naam, numberOfItems: rij.length, itemListElement: rij.slice(0, 100).map(({ x }, i) => ({ '@type': 'ListItem', position: i + 1, url: B + '/makelaar/' + slug + '/' + x.s, name: x.naam })) },
    kruim([['Huis kopen', '/huis-kopen'], ['Makelaar', '/makelaar'], [p.naam, '/makelaar/' + slug]]), faqLd(mt.faq)] };
  const t1 = 'Makelaar ' + p.naam + ': alle ' + rij.length + ' makelaars, nu open en bellen';
  return doc({ titel: t1.length <= 60 ? t1 : 'Makelaar ' + p.naam + ': alle ' + rij.length + ' makelaars', desc: ('Alle ' + rij.length + ' makelaars in ' + p.naam + ' met tijden, telefoon en route, uit OpenStreetMap. Aankoopmakelaar of verkoopmakelaar: zo kies je, zonder scores.').slice(0, 155), pad: '/makelaar/' + slug, body, schema, noindex: rij.length < MIN });
}

// ---------- /makelaar/<plaats>/<zaak> ----------
export async function zaakPagina(slug, s) {
  const p = P[slug]; if (!p) return null; const x0 = await data(slug); const x = x0 && x0.items.find(i => i.s === s); if (!x) return null;
  const R = rooster(x.uren), st = status(R), dicht = x0.items.filter(i => i.s !== s).map(i => ({ i, km: afstand(x, i) })).sort((a, b) => a.km - b.km).slice(0, 4), mt = makelaarTekst(p.naam);
  const feiten = [x.adres ? 'Adres: ' + x.adres + (x.pc ? ', ' + x.pc : '') + ' ' + x.plaats : '', x.tel ? 'Telefoon: ' + telTekst(x.tel) : '', x.web ? 'Website: ' + webTekst(x.web) : '', x.rolstoel === 'yes' ? 'Rolstoeltoegankelijk' : ''].filter(Boolean);
  const body = '<p class="crumbs"><a href="/makelaar">Makelaar</a> › <a href="/makelaar/' + slug + '">' + esc(p.naam) + '</a></p><h1>' + esc(x.naam) + '</h1><p>Makelaar in ' + esc(p.naam) + '</p>' +
    (st ? '<p class="nu' + (st.open ? '' : ' dicht') + '"><i></i>' + esc(statusTekst(st)) + '</p>' : '') + knoppen(slug, x) + chat('makelaar-' + slug, 'makelaar ' + p.naam, mt.faq) +
    '<ul class="feit">' + feiten.map(f => '<li>' + esc(f) + '</li>').join('') + (R ? '<li>' + weekRegels(R).map(esc).join('<br>') + '</li>' : x.uren ? '<li>Openingstijden: ' + esc(x.uren) + '</li>' : '') + '</ul>' +
    '<h2>Vraag dit voor je kiest</h2><ul>' + mt.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
    (dicht.length ? '<h2>Andere makelaars dichtbij</h2><ul class="zaken">' + dicht.map(({ i, km }) => '<li><span class="n"><a href="/makelaar/' + slug + '/' + esc(i.s) + '">' + esc(i.naam) + '</a></span><span class="w">' + (km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1).replace('.', ',') + ' km') + (i.adres ? ' · ' + esc(i.adres) : '') + '</span></li>').join('') + '</ul>' : '') +
    '<p class="rel"><a href="/makelaar/' + slug + '">Alle ' + x0.items.length + ' makelaars in ' + esc(p.naam) + '</a> · <a href="/huis-kopen">Huis kopen in 7 stappen</a> · <a href="' + esc(osmLink(x)) + '" rel="nofollow">Gegevens aanpassen op OpenStreetMap</a></p>';
  const lb = { '@type': 'RealEstateAgent', '@id': B + '/makelaar/' + slug + '/' + s + '#zaak', name: x.naam, url: x.web ? webLink(x.web) : undefined, telephone: x.tel ? telLink(x.tel) : undefined, geo: { '@type': 'GeoCoordinates', latitude: x.lat, longitude: x.lon },
    address: x.adres ? { '@type': 'PostalAddress', streetAddress: x.adres, postalCode: x.pc || undefined, addressLocality: x.plaats, addressCountry: 'NL' } : undefined, openingHours: R && x.uren ? x.uren : undefined };
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: B + '/makelaar/' + slug + '/' + s, name: x.naam, dateModified: x0.t, inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] }, about: { '@id': lb['@id'] } }, lb] };
  const t1 = x.naam + ': makelaar ' + p.naam + ', tijden en telefoon';
  return doc({ titel: t1.length <= 60 ? t1 : x.naam.slice(0, 40) + ', makelaar ' + p.naam, desc: (x.naam + (x.adres ? ', ' + x.adres : '') + ' in ' + p.naam + ': ' + (R ? 'openingstijden, ' : '') + (x.tel ? 'telefoon, ' : '') + 'route en makelaars in de buurt.').slice(0, 155), pad: '/makelaar/' + slug + '/' + s, body, schema, noindex: compleet(x) < 3 || x0.items.length < MIN });
}

// ---------- sitemap, IndexNow, chat, llms.txt ----------
export async function sitemap() {
  const urls = [B + '/huis-kopen'], d = await alleData(); if (d.some(o => o.x && o.x.n >= MIN)) urls.push(B + '/makelaar');
  for (const { p, x } of d) { if (!x || x.n < MIN) continue; urls.push(B + '/makelaar/' + p.slug); x.items.forEach(i => { if (compleet(i) >= 3) urls.push(B + '/makelaar/' + p.slug + '/' + i.s); }); }
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
// voor de chat (lib/kzchat.js): huis kopen als keuzehulp met de feiten, en per plaats de makelaars (naam, adres, telefoon, nu open)
export async function chatItems() {
  const d = await alleData(), nu = new Date(), rn = await rotterdamN();
  const plaatsen = d.filter(o => o.x && o.x.n >= MIN);
  const lijst = plaatsen.map(o => 'makelaar-' + o.p.slug + ' (' + o.p.naam + ', ' + o.x.n + ' makelaars)').concat(rn >= 8 ? ['rotterdam-makelaar (Rotterdam, ' + rn + ' makelaars)'] : []).join(', ');
  const feiten = FAQ.map(([q, a]) => q + ' ' + a).join(' ');
  const uit = [{ slug: 'huis-kopen', pad: '/huis-kopen', term: 'huis kopen', title: 'Huis kopen 2027: kosten koper, hypotheek en makelaar',
    kort: 'Huis kopen in 7 stappen: wat je kunt lenen, bieden met voorbehoud, 3 dagen bedenktijd, taxatie, NHG en notaris. Overdrachtsbelasting 2% of 0% voor starters.',
    uitleg: feiten + ' Makelaars per plaats op deze site (slug): ' + lijst + '. Noemt de bezoeker een plaats uit die lijst, wijs dan die makelaarspagina aan (zet de slug in pagina). Staat de plaats er niet in, zeg dat eerlijk en wijs deze pagina of /makelaar aan.',
    faq: FAQ.map(([q, a]) => ({ q, a })) }];
  const mtA = makelaarTekst('jouw plaats');
  uit.push({ slug: 'makelaar', pad: '/makelaar', term: 'makelaar', title: 'Makelaar kiezen per plaats', kort: 'Alle makelaars per plaats uit OpenStreetMap, zonder scores.', uitleg: mtA.tips.join(' ') + ' Plaatsen (slug): ' + lijst + '.', faq: mtA.faq.map(([q, a]) => ({ q, a })) });
  for (const { p, x } of plaatsen) { const mt = makelaarTekst(p.naam);
    uit.push({ slug: 'makelaar-' + p.slug, pad: '/makelaar/' + p.slug, term: 'makelaar ' + p.naam.toLowerCase(), title: 'Makelaar in ' + p.naam + ' kiezen',
      kort: 'Alle ' + x.n + ' makelaars in ' + p.naam + ' met tijden, telefoon en route (OpenStreetMap, bijgewerkt ' + x.t.slice(0, 10) + '). Geen scores of tarieven: vraag de prijs vooraf op papier.',
      uitleg: mt.tips.join(' ') + ' Makelaars in ' + p.naam + ' (naam, adres, telefoon, nu): ' + rang(x.items).slice(0, 60).map(({ x: z, R }) => { const s = status(R, nu); return z.naam + (z.adres ? ', ' + z.adres : '') + (z.tel ? ', tel ' + telTekst(z.tel) : '') + (s ? ', ' + statusTekst(s) : ''); }).join('; ') + '. Voor kosten koper, hypotheek en bedenktijd: huis-kopen.',
      faq: mt.faq.map(([q, a]) => ({ q, a })) }); }
  return uit;
}
export async function llmsDeel() {
  const d = (await alleData()).filter(o => o.x && o.x.n >= MIN), rn = await rotterdamN();
  return '\n\n## Huis kopen en makelaars ([huis kopen](' + B + '/huis-kopen))\n\n- [Huis kopen 2027: kosten koper, hypotheek en makelaar](' + B + '/huis-kopen): 7 stappen, overdrachtsbelasting en startersvrijstelling (tot € 615.000 vanaf 2027), NHG tot € 500.000 in 2027, 3 dagen bedenktijd; elk bedrag met bron en datum.' +
    (d.length ? '\n- [Makelaar kiezen per plaats](' + B + '/makelaar): alle makelaars uit OpenStreetMap, zonder scores.\n' + d.map(o => '- [Makelaar ' + o.p.naam + '](' + B + '/makelaar/' + o.p.slug + '): alle ' + o.x.n + ' makelaars in de gemeente ' + o.p.naam + ' met tijden, telefoon en route.').join('\n') : '') + (rn >= 8 ? '\n- [Makelaar Rotterdam](' + B + '/rotterdam/makelaar): alle ' + rn + ' makelaars in de gemeente Rotterdam.' : '');
}
export async function stand() { const d = await alleData(); return { ok: true, uitleg: 'Huis kopen en makelaars per plaats (lib/huiskopen.js): makelaars uit OpenStreetMap per gemeente; Rotterdam via lib/rdam.js.', plaatsen: d.map(({ p, x }) => ({ plaats: p.slug, n: x ? x.n : 0, bijgewerkt: x ? x.t : null, metTel: x ? x.items.filter(z => z.tel).length : 0, metTijden: x ? x.items.filter(z => rooster(z.uren)).length : 0, geindexeerd: x ? x.items.filter(z => compleet(z) >= 3).length : 0 })), rotterdam: await rotterdamN() }; }
