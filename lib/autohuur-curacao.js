// Keuzehulp autohuur Curaçao (NL keuzehulp.best/auto-huren-curacao, US whichtobuy.best/curacao-car-rental, DE kaufberater.best/mietwagen-curacao).
// Vergelijkt alle verhuurders die we vonden: voorwaarden, prijsindicatie, reviewscores per platform en voor- en nadelen uit bestaande reviews.
// Data: data/autohuur-curacao.json (onderzoek met bronnen) plus live reviewupdates uit kv (autohuur:rev:<id>, bijgewerkt door /api/keuze-tools?tool=autohuur&op=reviews).
import data from '../data/autohuur-curacao.json' with { type: 'json' };
import { look, ACCENTS } from './look.js';
import { kv } from './db.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const AUTOHUUR = {
  nl: { host: 'keuzehulp.best', slug: 'auto-huren-curacao', lang: 'nl', brand: 'Keuzehulp', accent: 'keuzehulp' },
  us: { host: 'whichtobuy.best', slug: 'curacao-car-rental', lang: 'en', brand: 'Which To Buy', accent: 'whichtobuy' },
  de: { host: 'kaufberater.best', slug: 'mietwagen-curacao', lang: 'de', brand: 'Kaufberater', accent: 'kaufberater' }
};
const T = {
  nl: {
    brokerKop: 'Boeken via een tussenpartij', brokerTekst: "Deze partijen verhuren zelf geen auto's maar boeken bij een verhuurder op het eiland. Reviews gaan dan vooral over die verhuurder; vraag dus vooraf bij welke partij je uitkomt.",
    title: n => 'Auto huren op Curaçao: alle ' + n + ' verhuurders vergeleken (reviews, borg, prijs)',
    desc: n => 'Onafhankelijke vergelijking van ' + n + ' autoverhuurders op Curaçao: reviewscores, voor- en nadelen uit echte reviews, borg, verzekering, vliegveld of hotel. Kies in 4 vragen.',
    h1: 'Auto huren op Curaçao: welke verhuurder past bij jou?',
    kort: (n, d) => 'We vergeleken ' + n + ' verhuurders op Curaçao op reviews, borg, verzekering en ophalen. Beantwoord vier vragen en je ziet welke drie het best bij je reis passen. Peildatum ' + d + '.',
    q: ['Waar wil je de auto ophalen?', 'Wat voor auto heb je nodig?', 'Wat vind je het belangrijkst?', 'Hoe oud is de jongste bestuurder?'],
    o: [['Op het vliegveld (Hato)', 'Bezorgd bij mijn hotel of appartement', 'Maakt niet uit'], ['Kleine auto voor 1 tot 3 personen', 'Gezinsauto of SUV voor 4 tot 5 personen', 'Jeep of 4x4 voor de ruige westkant', '7 personen of meer'], ['Zo goedkoop mogelijk', 'De beste reviews', 'Zo min mogelijk gedoe met borg en schade'], ['25 jaar of ouder', '21 tot 24 jaar', 'Jonger dan 21']],
    jouw: 'Jouw top 3', alle: 'Alle verhuurders vergeleken', naam: 'Verhuurder', reviews: 'Reviews', ophalen: 'Ophalen', prijs: 'Vanaf per dag', borg: 'Borg', voor: 'Voordelen uit reviews', tegen: 'Nadelen uit reviews', bekijk: 'Naar de verhuurder', bron: 'Bronnen', onbekend: 'onbekend',
    oph: { balie: 'balie op het vliegveld', shuttle: 'shuttle vanaf het vliegveld', vliegveld: 'overdracht op het vliegveld', aflevering: 'bezorging op adres', kantoor: 'kantoor bij het vliegveld' }, er: 'eigen risico', geenRev: 'geen reviews gevonden', leeftijd: 'vanaf', jaar: 'jaar', prijsNoot: 'Prijzen zijn de laagste dagprijs voor een kleine auto die we op de genoemde datum bij een vergelijkingssite of de verhuurder zagen. Ze verschillen per seizoen en huurduur.', nietBev: 'Ook genoemd, maar niet als actief te bevestigen:',
    lokaal: 'lokaal', inter: 'internationaal', waarom: 'Waarom deze', geen: 'Geen verhuurder past bij al je antwoorden; dit komt het dichtst in de buurt.',
    tipsKop: 'Wat je moet weten voordat je huurt', faqKop: 'Veelgestelde vragen', methode: 'Hoe we vergelijken', methodeTekst: 'We zochten alle verhuurders op Curaçao op via Google Maps, Tripadvisor, Trustpilot, reisfora en de sites van de verhuurders zelf. Per verhuurder tonen we de score en het aantal reviews per platform, en vatten we samen wat in reviews steeds terugkomt, in eigen woorden. Prijzen zijn indicaties van de genoemde bron en datum; de echte prijs hangt af van seizoen en huurduur. We krijgen geen geld van verhuurders voor een plek in deze lijst.',
    peil: 'Peildatum', mis: 'Mist er een verhuurder of klopt er iets niet? Mail', klik: 'Kies je antwoorden; de top 3 en de volgorde van de tabel passen zich direct aan.', score: 'score', uit: 'uit', perdag: 'per dag', alleen: 'alleen', nb: 'n.b.'
  },
  us: {
    brokerKop: 'Booking through a middleman', brokerTekst: "These companies don't rent out cars themselves but book with a company on the island. Reviews then mostly reflect that company, so ask up front who you will end up with.",
    title: n => 'Curaçao Car Rental: All ' + n + ' Companies Compared (Reviews, Deposit, Price)',
    desc: n => 'Independent comparison of ' + n + ' car rental companies in Curaçao: review scores, pros and cons from real reviews, deposit, insurance, airport or hotel delivery. Pick in 4 questions.',
    h1: 'Curaçao car rental: which company fits your trip?',
    kort: (n, d) => 'We compared ' + n + ' car rental companies in Curaçao on reviews, deposit, insurance and pick-up. Answer four questions to see the three that fit your trip best. Checked ' + d + '.',
    q: ['Where do you want to pick up the car?', 'What kind of car do you need?', 'What matters most to you?', 'How old is the youngest driver?'],
    o: [['At the airport (Hato, CUR)', 'Delivered to my hotel or rental', 'No preference'], ['Small car for 1 to 3 people', 'Family car or SUV for 4 to 5', 'Jeep or 4x4 for the rugged west', '7 seats or more'], ['Lowest price', 'Best reviews', 'Least hassle with deposit and damage'], ['25 or older', '21 to 24', 'Under 21']],
    jouw: 'Your top 3', alle: 'All companies compared', naam: 'Company', reviews: 'Reviews', ophalen: 'Pick-up', prijs: 'From per day', borg: 'Deposit', voor: 'Pros from reviews', tegen: 'Cons from reviews', bekijk: 'Visit company', bron: 'Sources', onbekend: 'unknown',
    oph: { balie: 'airport desk', shuttle: 'airport shuttle', vliegveld: 'airport meet & greet', aflevering: 'delivery to your address', kantoor: 'office near the airport' }, er: 'excess', geenRev: 'no reviews found', leeftijd: 'from age', jaar: '', prijsNoot: 'Prices are the lowest daily rate for a small car we saw on a comparison site or the company site on the stated date. They vary by season and rental length.', nietBev: 'Also mentioned, but not confirmed as active:',
    lokaal: 'local', inter: 'international', waarom: 'Why this one', geen: 'No company matches every answer; these come closest.',
    tipsKop: 'Know this before you rent', faqKop: 'Frequently asked questions', methode: 'How we compare', methodeTekst: 'We looked up every rental company in Curaçao we could find on Google Maps, Tripadvisor, Trustpilot, travel forums and the companies’ own sites. For each we show the score and number of reviews per platform and summarize, in our own words, what keeps coming back in reviews. Prices are indications from the stated source and date; the real price depends on season and rental length. Companies do not pay for a place in this list.',
    peil: 'Checked', mis: 'Missing a company or spotted an error? Email', klik: 'Pick your answers; the top 3 and the table order update instantly.', score: 'score', uit: 'out of', perdag: 'per day', alleen: 'only', nb: 'n/a'
  },
  de: {
    brokerKop: 'Buchen über einen Vermittler', brokerTekst: 'Diese Anbieter vermieten selbst keine Autos, sondern buchen bei einem Vermieter auf der Insel. Bewertungen betreffen dann vor allem diesen Vermieter; frag also vorher, bei wem du landest.',
    title: n => 'Mietwagen Curaçao: alle ' + n + ' Vermieter im Vergleich (Bewertungen, Kaution, Preis)',
    desc: n => 'Unabhängiger Vergleich von ' + n + ' Autovermietungen auf Curaçao: Bewertungen, Vor- und Nachteile aus echten Rezensionen, Kaution, Versicherung, Flughafen oder Hotelzustellung. In 4 Fragen zum passenden Anbieter.',
    h1: 'Mietwagen auf Curaçao: welcher Vermieter passt zu dir?',
    kort: (n, d) => 'Wir haben ' + n + ' Vermieter auf Curaçao nach Bewertungen, Kaution, Versicherung und Übergabe verglichen. Beantworte vier Fragen und du siehst die drei passendsten. Stand ' + d + '.',
    q: ['Wo möchtest du das Auto abholen?', 'Was für ein Auto brauchst du?', 'Was ist dir am wichtigsten?', 'Wie alt ist der jüngste Fahrer?'],
    o: [['Am Flughafen (Hato)', 'Zustellung ans Hotel oder Apartment', 'Egal'], ['Kleinwagen für 1 bis 3 Personen', 'Familienauto oder SUV für 4 bis 5', 'Jeep oder 4x4 für den rauen Westen', '7 Sitze oder mehr'], ['Möglichst günstig', 'Die besten Bewertungen', 'Möglichst wenig Ärger mit Kaution und Schäden'], ['25 oder älter', '21 bis 24', 'Unter 21']],
    jouw: 'Deine Top 3', alle: 'Alle Vermieter im Vergleich', naam: 'Vermieter', reviews: 'Bewertungen', ophalen: 'Übergabe', prijs: 'Ab pro Tag', borg: 'Kaution', voor: 'Vorteile laut Bewertungen', tegen: 'Nachteile laut Bewertungen', bekijk: 'Zum Vermieter', bron: 'Quellen', onbekend: 'unbekannt',
    oph: { balie: 'Schalter am Flughafen', shuttle: 'Shuttle ab Flughafen', vliegveld: 'Übergabe am Flughafen', aflevering: 'Zustellung an deine Adresse', kantoor: 'Büro am Flughafen' }, er: 'Selbstbeteiligung', geenRev: 'keine Bewertungen gefunden', leeftijd: 'ab', jaar: 'Jahren', prijsNoot: 'Preise sind der niedrigste Tagespreis für einen Kleinwagen, den wir am genannten Datum auf einem Vergleichsportal oder beim Vermieter gesehen haben. Sie schwanken nach Saison und Mietdauer.', nietBev: 'Ebenfalls genannt, aber nicht als aktiv bestätigt:',
    lokaal: 'lokal', inter: 'international', waarom: 'Warum dieser', geen: 'Kein Vermieter passt zu allen Antworten; diese kommen am nächsten.',
    tipsKop: 'Das solltest du vor der Miete wissen', faqKop: 'Häufige Fragen', methode: 'So vergleichen wir', methodeTekst: 'Wir haben alle Vermieter auf Curaçao gesucht, die wir über Google Maps, Tripadvisor, Trustpilot, Reiseforen und die Websites der Vermieter finden konnten. Pro Vermieter zeigen wir Note und Anzahl der Bewertungen je Plattform und fassen in eigenen Worten zusammen, was in Bewertungen immer wieder vorkommt. Preise sind Richtwerte der genannten Quelle und des Datums. Vermieter bezahlen nicht für einen Platz in dieser Liste.',
    peil: 'Stand', mis: 'Fehlt ein Vermieter oder stimmt etwas nicht? Mail an', klik: 'Wähle deine Antworten; Top 3 und Tabelle passen sich sofort an.', score: 'Note', uit: 'von', perdag: 'pro Tag', alleen: 'nur', nb: 'k.A.'
  }
};
const L = m => (m === 'nl' ? 'nl' : m === 'de' ? 'de' : 'en');
const tx = (v, m) => (v && typeof v === 'object' && !Array.isArray(v)) ? (v[L(m)] ?? v.en ?? v.nl ?? '') : (v ?? '');
const DATUM = (d, m) => { const x = new Date(d + 'T12:00:00Z'); return x.toLocaleDateString(m === 'nl' ? 'nl-NL' : m === 'de' ? 'de-DE' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };

// ---------- reviewscore: gewogen over platforms, gecorrigeerd voor weinig reviews ----------
export function reviewScore(v) {
  const s = (v.scores || []).filter(x => x && x.score && x.aantal); if (!s.length) return null;
  const norm = x => x.max && x.max !== 5 ? x.score / x.max * 5 : x.score;
  const n = s.reduce((t, x) => t + x.aantal, 0), som = s.reduce((t, x) => t + norm(x) * x.aantal, 0);
  return { gemiddeld: Math.round(som / n * 10) / 10, aantal: n, gewogen: (som + 4.0 * 25) / (n + 25) };
}
// ---------- keuze: scoor elke verhuurder op de antwoorden ----------
export function rangschik(lijst, route) {
  const [a0, a1, a2, a3] = route; const prijzen = lijst.map(v => v.prijsVanaf).filter(x => x > 0); const pmin = Math.min(...prijzen), pmax = Math.max(...prijzen);
  return lijst.map(v => {
    const r = reviewScore(v); const oph = v.ophalen || []; let s = r ? (r.gewogen - 3.5) * 2 : -0.5; let past = true; if (r && r.gemiddeld < 3.5) s -= 2.5;
    if (a0 === 0) s += oph.includes('balie') ? 2 : oph.includes('vliegveld') ? 1.8 : oph.includes('shuttle') ? 1.3 : oph.includes('kantoor') ? 0.8 : oph.includes('aflevering') ? 0.5 : 0;
    if (a0 === 1) { if (oph.includes('aflevering')) s += 2; else { s -= 1; past = false; } }
    if (a1 === 2) { if (v.jeep) s += 2; else { s -= 2; past = false; } }
    if (a1 === 3) { if (v.zevenPersoons) s += 2; else { s -= 3; past = false; } }
    if (a1 === 1 && v.suv) s += 0.5;
    if (a2 === 0) s += v.prijsVanaf > 0 && pmax > pmin ? 3 * (pmax - v.prijsVanaf) / (pmax - pmin) : 0;
    if (a2 === 1) s += r ? (r.gewogen - 3.5) * 3 : -1;
    if (a2 === 2) { if (v.borgLaag) s += 1.5; if (v.volledigVerzekerd) s += 1.5; if (v.schadeKlachten) s -= 2; }
    const min = v.minLeeftijd || 21; if (a3 === 1 && min > 21) { s -= 5; past = false; } if (a3 === 2 && min > 18) { s -= 6; past = false; }
    return { v, s: Math.round(s * 100) / 100, past, r };
  }).sort((x, y) => y.s - x.s);
}
const ster = r => r ? r.gemiddeld.toFixed(1).replace('.', ',') + '★ (' + r.aantal + ')' : '';
async function liveReviews() { // nieuwere reviewdata uit de dagelijkse ronde
  try { const ids = data.verhuurders.map(v => 'autohuur:rev:' + v.id); const vals = await kv.mget(...ids); const uit = {}; data.verhuurders.forEach((v, i) => { if (vals[i]) uit[v.id] = vals[i]; }); return uit; } catch (e) { return {}; }
}
export async function verhuurders() {
  const live = await liveReviews();
  return data.verhuurders.map(v => { const l = live[v.id]; if (!l) return v; const scores = (v.scores || []).filter(x => !(l.scores || []).some(y => y.platform === x.platform)).concat(l.scores || []); return Object.assign({}, v, { scores, voor: l.voor || v.voor, tegen: l.tegen || v.tegen, reviewsBijgewerkt: l.dag }); });
}

export function render(market, lijst, route) {
  const M = AUTOHUUR[market], t = T[market], url = 'https://' + M.host + '/' + M.slug, n = lijst.length, d = DATUM(data.peildatum, market);
  const rang = rangschik(lijst, route); const top = rang.slice(0, 3);
  const getal = (n, d) => Number(n).toLocaleString(market === 'us' ? 'en-US' : market === 'de' ? 'de-DE' : 'nl-NL', { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 2 : d });
  const scoresTxt = v => (v.scores || []).filter(x => x.score).map(x => esc(x.platform) + ' ' + getal(x.score, 1) + (x.max && x.max !== 5 ? '/' + x.max : '') + (x.aantal ? ' (' + getal(x.aantal, 0) + ')' : '')).join(' · ') || t.geenRev;
  const geld = (valuta, b) => (valuta === 'EUR' ? '€' : '$') + getal(b, b % 1 ? 2 : 0);
  const borgTxt = v => [tx(v.borg, market), v.eigenRisico ? t.er + ' ' + geld(v.eigenRisico.valuta, v.eigenRisico.bedrag) : ''].filter(Boolean).join(' · ') || t.onbekend;
  const ophTxt = v => (v.ophalen || []).map(o => t.oph[o] || o).join(', ') || t.onbekend;
  const prijsTxt = v => v.prijs ? geld(v.prijs.valuta, v.prijs.bedrag) : t.nb;
  const lijstje = a => (Array.isArray(a) ? a : []).map(x => '<li>' + esc(x) + '</li>').join('');
  const kaart = (x, i) => { const v = x.v; return '<div class="ah-kaart" data-id="' + esc(v.id) + '"><p class="kicker">' + (i + 1) + '. ' + esc(v.type === 'internationaal' ? t.inter : t.lokaal) + '</p><h3>' + esc(v.naam) + ' <span class="ah-ster">' + ster(x.r) + '</span></h3><p class="ah-meta">' + esc(ophTxt(v)) + ' · ' + t.prijs.toLowerCase() + ' ' + prijsTxt(v) + ' · ' + t.borg.toLowerCase() + ' ' + esc(borgTxt(v)) + (v.minLeeftijd ? ' · ' + t.leeftijd + ' ' + v.minLeeftijd + (t.jaar ? ' ' + t.jaar : '') : '') + '</p><div class="ah-vt"><div><b>' + t.voor + '</b><ul>' + lijstje(tx(v.voor, market)) + '</ul></div><div><b>' + t.tegen + '</b><ul>' + lijstje(tx(v.tegen, market)) + '</ul></div></div>' + (v.url ? '<a class="btn" href="' + esc(v.url) + '" target="_blank" rel="noopener nofollow" data-ah-out="' + esc(v.id) + '">' + t.bekijk + '</a>' : '') + '</div>'; };
  const vragen = t.q.map((q, qi) => '<label>' + esc(q) + '<select id="ah-q' + qi + '" name="q' + qi + '">' + t.o[qi].map((o, oi) => '<option value="' + oi + '"' + (route[qi] === oi ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select></label>').join('');
  const rij = x => { const v = x.v; return '<tr data-id="' + esc(v.id) + '"><td><b>' + (v.url ? '<a href="' + esc(v.url) + '" target="_blank" rel="noopener nofollow" data-ah-out="' + esc(v.id) + '">' + esc(v.naam) + '</a>' : esc(v.naam)) + '</b><br><span class="ah-klein">' + esc(v.type === 'internationaal' ? t.inter : t.lokaal) + '</span></td><td>' + scoresTxt(v) + '</td><td>' + esc(ophTxt(v)) + '</td><td>' + prijsTxt(v) + '</td><td>' + esc(borgTxt(v)) + '</td><td><ul>' + lijstje((tx(v.voor, market) || []).slice(0, 3)) + '</ul></td><td><ul>' + lijstje((tx(v.tegen, market) || []).slice(0, 3)) + '</ul></td></tr>'; };
  const faq = (data.faq || []).map(f => [tx(f.q, market), tx(f.a, market)]).filter(f => f[0] && f[1]);
  const tips = (data.tips || []).map(x => tx(x, market)).filter(Boolean);
  const bronnen = [...new Set(lijst.flatMap(v => v.bronnen || []))].slice(0, 80);
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: t.h1, description: t.desc(n), inLanguage: M.lang, datePublished: data.gepubliceerd || data.peildatum, dateModified: data.peildatum, mainEntityOfPage: url, author: { '@type': 'Person', name: 'Henkjan de Krijger', url: 'https://www.linkedin.com/in/henkjandekrijger' }, publisher: { '@type': 'Organization', name: M.brand } },
    { '@type': 'ItemList', name: t.alle, numberOfItems: n, itemListElement: rang.map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'AutoRental', name: x.v.naam, url: x.v.url || undefined, address: { '@type': 'PostalAddress', addressCountry: 'CW' } } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: M.brand, item: 'https://' + M.host + '/' }, { '@type': 'ListItem', position: 2, name: t.h1, item: url }] },
    ...(faq.length ? [{ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [])] };
  const css = look(ACCENTS[M.accent], { dark: false }) + '.ah main{max-width:1060px;margin:auto;padding:24px 18px 60px}.ah .vr{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:14px 0}.ah label{display:block;font-weight:600;font-size:15px}.ah select{display:block;width:100%;font:inherit;margin:6px 0 0;padding:10px;border:1px solid #bbb;border-radius:8px;background:#fff}.ah-top{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}.ah-kaart{border:1px solid #e4e7ec;border-radius:14px;padding:16px;background:#fff}.ah-kaart h3{margin:2px 0 6px}.ah-ster{font-size:14px;color:#a16207;font-weight:600;white-space:nowrap}.ah-meta{font-size:14px;color:#555;margin:0 0 8px}.ah-vt{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:14px}.ah-vt ul,.ah td ul{margin:4px 0;padding-left:18px}.ah-scroll{overflow:auto;border:1px solid #e4e7ec;border-radius:12px}.ah table{border-collapse:collapse;width:100%;min-width:980px;font-size:14px}.ah th,.ah td{text-align:left;vertical-align:top;border-bottom:1px solid #eee;padding:10px}.ah th{background:#f7f8fa;position:sticky;top:0}.ah-klein{font-size:12px;color:#777}.ah details{border-bottom:1px solid #eee;padding:10px 0}.ah summary{cursor:pointer;font-weight:600}@media(max-width:640px){.ah-vt{grid-template-columns:1fr}}';
  const client = '(function(){var D=' + JSON.stringify(lijst.map(v => ({ id: v.id, ophalen: v.ophalen, jeep: !!v.jeep, zevenPersoons: !!v.zevenPersoons, suv: !!v.suv, prijsVanaf: v.prijsVanaf || 0, borgLaag: !!v.borgLaag, volledigVerzekerd: !!v.volledigVerzekerd, schadeKlachten: !!v.schadeKlachten, minLeeftijd: v.minLeeftijd || 21, scores: v.scores || [] }))) + ';' + reviewScore.toString() + ';' + rangschik.toString() + ';var top=document.getElementById("ah-top"),body=document.getElementById("ah-body"),kaarten={},rijen={};top.querySelectorAll(".ah-kaart").forEach(function(k){kaarten[k.dataset.id]=k});document.querySelectorAll("#ah-store .ah-kaart").forEach(function(k){kaarten[k.dataset.id]=k});body.querySelectorAll("tr").forEach(function(r){rijen[r.dataset.id]=r});function hit(k){try{var d=new Date().toISOString().slice(0,10).replace(/-/g,"");navigator.sendBeacon("/api/hjdk/stats/hits",new Blob([JSON.stringify({hits:[["ah-' + market + '-"+d+"-"+k,1]]})],{type:"text/plain"}))}catch(e){}}function go(){var r=[0,1,2,3].map(function(i){return +document.getElementById("ah-q"+i).value});var x=rangschik(D,r);var st=document.getElementById("ah-store");top.querySelectorAll(".ah-kaart").forEach(function(k){st.appendChild(k)});x.slice(0,3).forEach(function(y,i){var k=kaarten[y.v.id];if(k){k.querySelector(".kicker").textContent=(i+1)+". "+k.querySelector(".kicker").textContent.replace(/^\\d+\\. /,"");top.appendChild(k)}});x.forEach(function(y){var rr=rijen[y.v.id];if(rr)body.appendChild(rr)});document.getElementById("ah-geen").hidden=!!(x[0]&&x[0].past);hit("route-"+r.join(""))}[0,1,2,3].forEach(function(i){document.getElementById("ah-q"+i).addEventListener("change",go)});document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-ah-out]");if(a)hit("out-"+a.dataset.ahOut)});hit("view")})();';
  const store = rang.slice(3).map((x, i) => kaart(x, i + 3)).join('');
  return '<!doctype html><html lang="' + M.lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(t.title(n)) + '</title><meta name="description" content="' + esc(t.desc(n)) + '"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"><link rel="canonical" href="' + url + '">' + Object.values(AUTOHUUR).map(x => '<link rel="alternate" hreflang="' + x.lang + '" href="https://' + x.host + '/' + x.slug + '">').join('') + '<meta property="og:title" content="' + esc(t.title(n)) + '"><meta property="og:description" content="' + esc(t.desc(n)) + '"><meta property="og:url" content="' + url + '"><meta property="og:type" content="article"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script><style>' + css + '</style></head><body class="ah"><header class="topbar"><div class="wrap"><a class="mark" href="/">' + esc(M.brand) + '</a></div></header><main>'
    + '<p class="kicker">' + t.peil + ' ' + d + '</p><h1>' + esc(t.h1) + '</h1><div class="answer"><p><b>' + esc(t.kort(n, d)) + '</b></p></div>'
    + '<form id="ah-form" class="vr" method="get" action="/' + M.slug + '" onsubmit="return false">' + vragen + '</form><p class="note">' + esc(t.klik) + '</p>'
    + '<h2>' + t.jouw + '</h2><p id="ah-geen" class="note"' + (top[0] && top[0].past ? ' hidden' : '') + '>' + esc(t.geen) + '</p><div id="ah-top" class="ah-top">' + top.map(kaart).join('') + '</div><div id="ah-store" hidden>' + store + '</div>'
    + '<h2>' + t.alle + ' (' + n + ')</h2><div class="ah-scroll"><table><thead><tr><th>' + t.naam + '</th><th>' + t.reviews + '</th><th>' + t.ophalen + '</th><th>' + t.prijs + '</th><th>' + t.borg + '</th><th>' + t.voor + '</th><th>' + t.tegen + '</th></tr></thead><tbody id="ah-body">' + rang.map(rij).join('') + '</tbody></table></div><p class="note">' + esc(t.prijsNoot) + '</p>' + ((data.nietBevestigd || []).length ? '<p class="note">' + esc(t.nietBev) + ' ' + esc(data.nietBevestigd.join(', ')) + '.</p>' : '')
    + ((data.brokers || []).length ? '<h2>' + t.brokerKop + '</h2><p>' + esc(t.brokerTekst) + '</p><ul>' + data.brokers.map(b => '<li><b>' + esc(b.naam) + '</b>' + ((b.scores || []).length ? ' (' + scoresTxt(b) + ')' : '') + ((tx(b.tegen, market) || []).length ? ': ' + esc(tx(b.tegen, market).slice(0, 2).join(' ')) : '') + '</li>').join('') + '</ul>' : '')
    + (tips.length ? '<h2>' + t.tipsKop + '</h2><ul>' + tips.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '')
    + (faq.length ? '<h2>' + t.faqKop + '</h2>' + faq.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') : '')
    + '<h2>' + t.methode + '</h2><p>' + esc(t.methodeTekst) + '</p><details><summary>' + t.bron + ' (' + bronnen.length + ')</summary><ul>' + bronnen.map(b => '<li><a href="' + esc(b) + '" rel="nofollow noopener" target="_blank">' + esc(b.replace(/^https?:\/\/(www\.)?/, '').slice(0, 90)) + '</a></li>').join('') + '</ul></details>'
    + '<p class="note">' + t.mis + ' <a href="mailto:henkjan@keuzehulp.best">henkjan@keuzehulp.best</a>. Henkjan de Krijger, ' + d + '.</p>'
    + '</main><script>' + client + '</script></body></html>';
}

export async function autohuurHandler(req, res, url, market) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) return res.status(405).send('Method not allowed');
  if (!AUTOHUUR[market] || !data.verhuurders.length) return res.status(404).send('Not found');
  if (url.searchParams.get('op') === 'reviews') { // dagelijkse cron; zonder token hooguit 4 rondes per dag
    const k = 'autohuur:revrun:' + new Date().toISOString().slice(0, 10); const n = await kv.incr(k).catch(() => 1); if (n === 1) await kv.raw(['EXPIRE', k, 2 * 86400]).catch(() => {});
    if (n > 4) return res.status(429).json({ error: 'al 4 rondes vandaag' });
    return res.status(200).json(await reviewRonde());
  }
  if (url.searchParams.get('op') === 'reviewlog') return res.status(200).json((await kv.get('autohuur:revlog').catch(() => null)) || {});
  const q = url.searchParams; const route = [0, 1, 2, 3].map(i => Math.max(0, Math.min(T[market].o[i].length - 1, parseInt(q.get('q' + i) || '0', 10) || 0)));
  const lijst = await verhuurders();
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=600');
  return res.status(200).send(render(market, lijst, route));
}

// item voor sitemap, llms.txt en overzichten (extraItems)
export function autohuurItem(market) {
  if (!data.verhuurders.length || !AUTOHUUR[market]) return null;
  const M = AUTOHUUR[market], t = T[market], n = data.verhuurders.length;
  return { slug: M.slug, title: t.h1, h1: t.h1, seoTitle: t.title(n), metaDesc: t.desc(n), cat: market === 'nl' ? 'Reizen' : market === 'de' ? 'Reisen' : 'Travel', term: market === 'nl' ? 'auto huren curacao' : market === 'de' ? 'Mietwagen Curaçao' : 'Curaçao car rental', intro: t.kort(n, DATUM(data.peildatum, market)), kort: t.kort(n, DATUM(data.peildatum, market)), questions: t.q.map((q, i) => ({ q, options: t.o[i].map(label => ({ label })) })), uitleg: (data.tips || []).map(x => tx(x, market)).join('\n\n'), guide: (data.tips || []).map(x => tx(x, market)).join('\n\n'), fouten: [], faq: (data.faq || []).map(f => ({ q: tx(f.q, market), a: tx(f.a, market) })), publishAt: data.gepubliceerd || data.peildatum, updatedAt: data.peildatum, tool: true, priority: 97 };
}
export { data as AUTOHUUR_DATA };

// ---------- dagelijkse reviewronde: verse Google-reviews per verhuurder via demandradar, voor- en nadelen samengevat door Claude ----------
// Per ronde hooguit 2 nieuwe taken (demandradar heeft 10 per dag voor alles samen). Een taak is na een paar minuten klaar; de volgende ronde haalt hem op.
// Opslag: autohuur:rev:<id> = { dag, scores:[{platform:'Google', score, aantal, peildatum}], voor:{nl,en,de}, tegen:{nl,en,de}, n }
const SYS_REV = 'Je vat echte klantreviews van een autoverhuurder op Curaçao samen. Noem alleen punten die in meerdere reviews terugkomen, in gewone woorden, zonder overdrijving en zonder reviewers te citeren of te noemen. Geef per taal 3 tot 4 korte voordelen en 2 tot 4 korte nadelen (elk hooguit 12 woorden), concreet (borg, schade-afhandeling, wachttijd, staat van de auto, ophalen, prijs). Als een nadeel zelden voorkomt, laat het weg. Antwoord alleen met JSON: {"voor":{"nl":[],"en":[],"de":[]},"tegen":{"nl":[],"en":[],"de":[]}}';
async function verwerkRev(w, r, dag, log) {
  const teksten = (r.reviews || []).filter(x => x.text && x.text.length > 30).slice(0, 60);
  const uit = { dag, n: teksten.length, scores: r.rating ? [{ platform: 'Google', score: Math.round(r.rating * 10) / 10, aantal: r.total || 0, peildatum: dag, bron: 'Google Maps via DataForSEO' }] : [] };
  if (teksten.length >= 8) {
    try {
      const { claude } = await import('./wtb.js');
      const j = await claude(SYS_REV, 'Verhuurder: ' + w.naam + '\nGemiddelde Google-score: ' + r.rating + ' uit ' + r.total + ' reviews.\n\nReviews (nieuwste eerst, score en tekst):\n' + teksten.map(x => '- ' + (x.rating ?? '?') + '/5: ' + x.text.replace(/\s+/g, ' ').slice(0, 500)).join('\n'), { fast: true, max: 1200 });
      const m = String(j.txt || '').match(/\{[\s\S]*\}/); const p = m ? JSON.parse(m[0]) : null;
      if (p && p.voor && p.tegen && (p.voor.nl || []).length) { uit.voor = p.voor; uit.tegen = p.tegen; }
    } catch (e) { log.push(w.id + ': samenvatten mislukt ' + String(e.message || e).slice(0, 60)); }
  }
  const oud = (await kv.get('autohuur:rev:' + w.id).catch(() => null)) || {};
  await kv.set('autohuur:rev:' + w.id, Object.assign({}, oud, uit, uit.voor ? {} : { voor: oud.voor, tegen: oud.tegen }));
  log.push(w.id + ': ' + (r.rating || '?') + ' (' + (r.total || 0) + ') ' + (uit.voor ? 'voor/tegen bijgewerkt' : 'alleen score'));
}
export async function reviewRonde(o) {
  o = o || {}; const { reviewsRadar } = await import('./demandradar.js'); const dag = new Date().toISOString().slice(0, 10); const log = [];
  const wacht = (await kv.get('autohuur:revq').catch(() => null)) || [];
  const rest = [];
  for (const w of wacht) {
    const r = await reviewsRadar('get', 'google', '', 'NL', '&id=' + encodeURIComponent(w.task));
    if (r.status === 'pending' && Date.now() - w.at < 2 * 864e5) { rest.push(w); log.push(w.id + ': nog bezig'); continue; }
    if (r.status !== 'ready') { log.push(w.id + ': ' + (r.status || r.error || r.fout || 'mislukt')); await kv.set('autohuur:revtry:' + w.id, dag, { ex: 30 * 86400 }).catch(() => {}); continue; }
    await verwerkRev(w, r, dag, log);
  }
  // nieuwe taken: verhuurders zonder of met de oudste live data
  const ids = data.verhuurders.map(v => v.id); const vals = await kv.mget(...ids.map(i => 'autohuur:rev:' + i)).catch(() => []); const tries = await kv.mget(...ids.map(i => 'autohuur:revtry:' + i)).catch(() => []);
  const kand = data.verhuurders.map((v, i) => ({ v, dag: (vals[i] && vals[i].dag) || '0000', tried: tries[i] })).filter(x => x.v.googleQ !== false && !x.tried && !rest.some(w => w.id === x.v.id) && x.dag < new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)).sort((a, b) => a.dag.localeCompare(b.dag));
  for (const x of kand.slice(0, Math.max(0, (o.n || 2) - rest.length))) {
    const q = x.v.googleQ || (x.v.naam + ' Curaçao');
    const r = await reviewsRadar('post', 'google', q, 'NL', '&n=100');
    if (r.id) { rest.push({ id: x.v.id, naam: x.v.naam, task: r.id, at: Date.now() }); log.push(x.v.id + ': taak gestart'); }
    else if (r.cached) await verwerkRev({ id: x.v.id, naam: x.v.naam }, r, dag, log);
    else { log.push(x.v.id + ': ' + (r.error || r.fout || 'post mislukt')); if (/limit|budget/i.test(r.error || '')) break; }
  }
  await kv.set('autohuur:revq', rest.filter(w => w.task));
  await kv.set('autohuur:revlog', { at: new Date().toISOString(), log }).catch(() => {});
  return { ok: true, log, wacht: rest.length };
}
