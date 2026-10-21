// Keuzehulp autohuur Curaçao (NL keuzehulp.best/auto-huren-curacao, US whichtobuy.best/curacao-car-rental, DE kaufberater.best/mietwagen-curacao).
// Vergelijkt alle verhuurders die we vonden: voorwaarden, prijsindicatie, reviewscores per platform en voor- en nadelen uit bestaande reviews.
// Data: data/autohuur-curacao.json (onderzoek met bronnen) plus live reviewupdates uit kv (autohuur:rev:<id>, bijgewerkt door /api/keuze-tools?tool=autohuur&op=reviews).
import data from '../data/autohuur-curacao.json' with { type: 'json' };
import { SELECT_TERUGVAL } from './keuzelijst.js';
import { look, ACCENTS } from './look.js';
import { kv } from './db.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// ES en PT draaien in de Curaçao-motor (lib/cur.js); hier alleen hun adressen voor hreflang en de taalbalk (geen import: cur.js importeert dit bestand)
const AH_EXTRA = [['es', 'https://whichtobuy.best/es/curazao/alquiler-de-autos'], ['pt', 'https://whichtobuy.best/pt/curacao/aluguel-de-carro']];
export const AUTOHUUR = {
  nl: { host: 'keuzehulp.best', slug: 'auto-huren-curacao', lang: 'nl', brand: 'Keuzehulp', accent: 'keuzehulp' },
  us: { host: 'whichtobuy.best', slug: 'curacao-car-rental', lang: 'en', brand: 'Which To Buy', accent: 'whichtobuy' },
  de: { host: 'kaufberater.best', slug: 'mietwagen-curacao', lang: 'de', brand: 'Kaufberater', accent: 'kaufberater' }
};
const T = {
  nl: {
    ophK: { balie: 'balie vliegveld', shuttle: 'shuttle', vliegveld: 'op het vliegveld', aflevering: 'bezorgen', kantoor: 'kantoor bij vliegveld' }, metRev: 'Met reviews', zonderRev: 'Nog geen reviews gevonden', reviewsW: 'reviews', meer: 'Alle voor- en nadelen en scores per platform', perdagK: '/dag', geenBorgChip: 'geen borg', leeftijdChip: n => n + '+ jaar',
    brokerKop: 'Boeken via een tussenpartij', brokerTekst: "Deze partijen verhuren zelf geen auto's maar boeken bij een verhuurder op het eiland. Reviews gaan dan vooral over die verhuurder; vraag dus vooraf bij welke partij je uitkomt.",
    title: n => 'Auto huren op Curaçao: ' + n + ' verhuurders vergeleken',
    desc: n => 'Vergelijk ' + n + ' autoverhuurders op Curaçao op reviews, borg, verzekering en ophalen op het vliegveld of bij je hotel. Kies in 4 vragen.',
    h1: 'Auto huren op Curaçao: welke verhuurder past bij jou?',
    kort: (n, d) => 'We vergeleken ' + n + ' verhuurders op Curaçao op reviews, borg, verzekering en ophalen. Beantwoord vier vragen en je ziet welke drie het best bij je reis passen. Peildatum ' + d + '.',
    q: ['Waar wil je de auto ophalen?', 'Wat voor auto heb je nodig?', 'Wat vind je het belangrijkst?', 'Hoe oud is de jongste bestuurder?'],
    o: [['Op het vliegveld (Hato)', 'Bezorgd bij mijn hotel of appartement', 'Maakt niet uit'], ['Kleine auto voor 1 tot 3 personen', 'Gezinsauto of SUV voor 4 tot 5 personen', 'Jeep of 4x4 voor de ruige westkant', '7 personen of meer'], ['Zo goedkoop mogelijk', 'De beste reviews', 'Zo min mogelijk gedoe met borg en schade'], ['25 jaar of ouder', '21 tot 24 jaar', 'Jonger dan 21']],
    jouw: 'Jouw top 3', alle: 'Alle verhuurders vergeleken', naam: 'Verhuurder', reviews: 'Reviews', ophalen: 'Ophalen', prijs: 'Vanaf per dag', borg: 'Borg', voor: 'Voordelen uit reviews', tegen: 'Nadelen uit reviews', bekijk: 'Naar de verhuurder', bron: 'Bronnen', onbekend: 'onbekend',
    oph: { balie: 'balie op het vliegveld', shuttle: 'shuttle vanaf het vliegveld', vliegveld: 'overdracht op het vliegveld', aflevering: 'bezorging op adres', kantoor: 'kantoor bij het vliegveld' }, er: 'eigen risico', geenRev: 'geen reviews gevonden', leeftijd: 'vanaf', jaar: 'jaar', prijsNoot: 'Prijzen zijn de laagste dagprijs voor een kleine auto die we op de genoemde datum bij een vergelijkingssite of de verhuurder zagen. Ze verschillen per seizoen en huurduur.', nietBev: 'Ook genoemd, maar niet als actief te bevestigen:',
    lokaal: 'lokaal', inter: 'internationaal', waarom: 'Waarom deze', geen: 'Geen verhuurder past bij al je antwoorden; dit komt het dichtst in de buurt.',
    tipsKop: 'Wat je moet weten voordat je huurt', faqKop: 'Veelgestelde vragen', methode: 'Hoe we vergelijken', methodeTekst: 'We zochten alle verhuurders op Curaçao op via Google Maps, Tripadvisor, Trustpilot, reisfora en de sites van de verhuurders zelf. Per verhuurder tonen we de score en het aantal reviews per platform, en vatten we samen wat in reviews steeds terugkomt, in eigen woorden. Prijzen zijn indicaties van de genoemde bron en datum; de echte prijs hangt af van seizoen en huurduur. We krijgen geen geld van verhuurders voor een plek in deze lijst.',
    peil: 'Peildatum', mis: 'Mist er een verhuurder of klopt er iets niet?', wa: 'App de redactie via WhatsApp', klik: 'Kies je antwoorden; de top 3 en de volgorde van de tabel passen zich direct aan.', score: 'score', uit: 'uit', perdag: 'per dag', alleen: 'alleen', nb: 'n.b.'
  },
  us: {
    ophK: { balie: 'airport desk', shuttle: 'shuttle', vliegveld: 'airport meet', aflevering: 'delivery', kantoor: 'office near airport' }, metRev: 'With reviews', zonderRev: 'No reviews found yet', reviewsW: 'reviews', meer: 'All pros, cons and scores per platform', perdagK: '/day', geenBorgChip: 'no deposit', leeftijdChip: n => 'age ' + n + '+',
    brokerKop: 'Booking through a middleman', brokerTekst: "These companies don't rent out cars themselves but book with a company on the island. Reviews then mostly reflect that company, so ask up front who you will end up with.",
    title: n => 'Curaçao Car Rental: ' + n + ' Companies Compared',
    desc: n => 'Compare ' + n + ' car rental companies in Curaçao on reviews, deposit, insurance and airport or hotel pickup. Pick in 4 questions.',
    h1: 'Curaçao car rental: which company fits your trip?',
    kort: (n, d) => 'We compared ' + n + ' car rental companies in Curaçao on reviews, deposit, insurance and pick-up. Answer four questions to see the three that fit your trip best. Checked ' + d + '.',
    q: ['Where do you want to pick up the car?', 'What kind of car do you need?', 'What matters most to you?', 'How old is the youngest driver?'],
    o: [['At the airport (Hato, CUR)', 'Delivered to my hotel or rental', 'No preference'], ['Small car for 1 to 3 people', 'Family car or SUV for 4 to 5', 'Jeep or 4x4 for the rugged west', '7 seats or more'], ['Lowest price', 'Best reviews', 'Least hassle with deposit and damage'], ['25 or older', '21 to 24', 'Under 21']],
    jouw: 'Your top 3', alle: 'All companies compared', naam: 'Company', reviews: 'Reviews', ophalen: 'Pick-up', prijs: 'From per day', borg: 'Deposit', voor: 'Pros from reviews', tegen: 'Cons from reviews', bekijk: 'Visit company', bron: 'Sources', onbekend: 'unknown',
    oph: { balie: 'airport desk', shuttle: 'airport shuttle', vliegveld: 'airport meet & greet', aflevering: 'delivery to your address', kantoor: 'office near the airport' }, er: 'excess', geenRev: 'no reviews found', leeftijd: 'from age', jaar: '', prijsNoot: 'Prices are the lowest daily rate for a small car we saw on a comparison site or the company site on the stated date. They vary by season and rental length.', nietBev: 'Also mentioned, but not confirmed as active:',
    lokaal: 'local', inter: 'international', waarom: 'Why this one', geen: 'No company matches every answer; these come closest.',
    tipsKop: 'Know this before you rent', faqKop: 'Frequently asked questions', methode: 'How we compare', methodeTekst: 'We looked up every rental company in Curaçao we could find on Google Maps, Tripadvisor, Trustpilot, travel forums and the companies’ own sites. For each we show the score and number of reviews per platform and summarize, in our own words, what keeps coming back in reviews. Prices are indications from the stated source and date; the real price depends on season and rental length. Companies do not pay for a place in this list.',
    peil: 'Checked', mis: 'Missing a company or spotted an error?', wa: 'Message the editors on WhatsApp', klik: 'Pick your answers; the top 3 and the table order update instantly.', score: 'score', uit: 'out of', perdag: 'per day', alleen: 'only', nb: 'n/a'
  },
  de: {
    ophK: { balie: 'Flughafenschalter', shuttle: 'Shuttle', vliegveld: 'Übergabe Flughafen', aflevering: 'Zustellung', kantoor: 'Büro am Flughafen' }, metRev: 'Mit Bewertungen', zonderRev: 'Noch keine Bewertungen gefunden', reviewsW: 'Bewertungen', meer: 'Alle Vor- und Nachteile und Noten je Plattform', perdagK: '/Tag', geenBorgChip: 'keine Kaution', leeftijdChip: n => 'ab ' + n,
    brokerKop: 'Buchen über einen Vermittler', brokerTekst: 'Diese Anbieter vermieten selbst keine Autos, sondern buchen bei einem Vermieter auf der Insel. Bewertungen betreffen dann vor allem diesen Vermieter; frag also vorher, bei wem du landest.',
    title: n => 'Mietwagen Curaçao: ' + n + ' Vermieter im Vergleich',
    desc: n => 'Vergleiche ' + n + ' Autovermietungen auf Curaçao nach Bewertungen, Kaution, Versicherung und Abholung am Flughafen oder Hotel.',
    h1: 'Mietwagen auf Curaçao: welcher Vermieter passt zu dir?',
    kort: (n, d) => 'Wir haben ' + n + ' Vermieter auf Curaçao nach Bewertungen, Kaution, Versicherung und Übergabe verglichen. Beantworte vier Fragen und du siehst die drei passendsten. Stand ' + d + '.',
    q: ['Wo möchtest du das Auto abholen?', 'Was für ein Auto brauchst du?', 'Was ist dir am wichtigsten?', 'Wie alt ist der jüngste Fahrer?'],
    o: [['Am Flughafen (Hato)', 'Zustellung ans Hotel oder Apartment', 'Egal'], ['Kleinwagen für 1 bis 3 Personen', 'Familienauto oder SUV für 4 bis 5', 'Jeep oder 4x4 für den rauen Westen', '7 Sitze oder mehr'], ['Möglichst günstig', 'Die besten Bewertungen', 'Möglichst wenig Ärger mit Kaution und Schäden'], ['25 oder älter', '21 bis 24', 'Unter 21']],
    jouw: 'Deine Top 3', alle: 'Alle Vermieter im Vergleich', naam: 'Vermieter', reviews: 'Bewertungen', ophalen: 'Übergabe', prijs: 'Ab pro Tag', borg: 'Kaution', voor: 'Vorteile laut Bewertungen', tegen: 'Nachteile laut Bewertungen', bekijk: 'Zum Vermieter', bron: 'Quellen', onbekend: 'unbekannt',
    oph: { balie: 'Schalter am Flughafen', shuttle: 'Shuttle ab Flughafen', vliegveld: 'Übergabe am Flughafen', aflevering: 'Zustellung an deine Adresse', kantoor: 'Büro am Flughafen' }, er: 'Selbstbeteiligung', geenRev: 'keine Bewertungen gefunden', leeftijd: 'ab', jaar: 'Jahren', prijsNoot: 'Preise sind der niedrigste Tagespreis für einen Kleinwagen, den wir am genannten Datum auf einem Vergleichsportal oder beim Vermieter gesehen haben. Sie schwanken nach Saison und Mietdauer.', nietBev: 'Ebenfalls genannt, aber nicht als aktiv bestätigt:',
    lokaal: 'lokal', inter: 'international', waarom: 'Warum dieser', geen: 'Kein Vermieter passt zu allen Antworten; diese kommen am nächsten.',
    tipsKop: 'Das solltest du vor der Miete wissen', faqKop: 'Häufige Fragen', methode: 'So vergleichen wir', methodeTekst: 'Wir haben alle Vermieter auf Curaçao gesucht, die wir über Google Maps, Tripadvisor, Trustpilot, Reiseforen und die Websites der Vermieter finden konnten. Pro Vermieter zeigen wir Note und Anzahl der Bewertungen je Plattform und fassen in eigenen Worten zusammen, was in Bewertungen immer wieder vorkommt. Preise sind Richtwerte der genannten Quelle und des Datums. Vermieter bezahlen nicht für einen Platz in dieser Liste.',
    peil: 'Stand', mis: 'Fehlt ein Vermieter oder stimmt etwas nicht?', wa: 'Schreib der Redaktion per WhatsApp', klik: 'Wähle deine Antworten; Top 3 und Tabelle passen sich sofort an.', score: 'Note', uit: 'von', perdag: 'pro Tag', alleen: 'nur', nb: 'k.A.'
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
const kies = (nieuw, oud) => { if (!nieuw) return oud; const uit = {}; for (const t of ['nl', 'en', 'de']) uit[t] = (nieuw[t] || []).length ? nieuw[t] : ((oud || {})[t] || []); return uit; };
export async function verhuurders() {
  const live = await liveReviews();
  return data.verhuurders.map(v => { const l = live[v.id]; if (!l) return v; const nieuwG = (l.scores || []).some(y => /^google/i.test(y.platform)); const scores = (v.scores || []).filter(x => !(l.scores || []).some(y => y.platform === x.platform) && !(nieuwG && /^google/i.test(x.platform))).concat(l.scores || []); return Object.assign({}, v, { scores, voor: kies(l.voor, v.voor), tegen: kies(l.tegen, v.tegen), reviewsBijgewerkt: l.dag }); });
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
  const borgChip = v => { const b = tx(v.borg, market); if (!b) return ''; return /^(geen|no |keine|lage|low|niedrige|creditcard|credit|kreditkarte)/i.test(b) ? b : t.borg.toLowerCase() + ' ' + b; };
  const chips = v => [...(v.ophalen || []).map(o => t.ophK[o] || o), v.prijs ? t.prijs.split(' ')[0].toLowerCase() + ' ' + prijsTxt(v) + t.perdagK : '', borgChip(v), v.eigenRisico ? t.er + ' ' + geld(v.eigenRisico.valuta, v.eigenRisico.bedrag) : '', v.minLeeftijd ? t.leeftijdChip(v.minLeeftijd) : ''].filter(Boolean).map(c => '<span class="ah-chip">' + esc(c) + '</span>').join('');
  const badge = r => r ? '<span class="ah-score"><b>' + getal(r.gemiddeld, 1) + ' ★</b> ' + getal(r.aantal, 0) + ' ' + t.reviewsW + '</span>' : '<span class="ah-score ah-leeg">' + t.geenRev + '</span>';
  const naamLink = v => v.url ? '<a href="' + esc(v.url) + '" target="_blank" rel="noopener nofollow" data-ah-out="' + esc(v.id) + '" data-out="' + esc(v.id) + '">' + esc(v.naam) + '</a>' : esc(v.naam);
  const kort = v => [...(v.ophalen || []).filter((o, _, a) => !(o === 'kantoor' && a.length > 1)).map(o => t.ophK[o] || o), v.prijs ? t.prijs.split(' ')[0].toLowerCase() + ' ' + prijsTxt(v) + t.perdagK : '', borgChip(v), v.eigenRisico ? t.er + ' ' + geld(v.eigenRisico.valuta, v.eigenRisico.bedrag) : '', v.minLeeftijd ? t.leeftijdChip(v.minLeeftijd) : ''].filter(Boolean).map(esc).join(' · ');
  const kleur = r => !r ? 'b-leeg' : r.gemiddeld >= 4.5 ? 'b-goed' : r.gemiddeld >= 3.5 ? 'b-mid' : 'b-slecht';
  const typ = v => esc(v.type === 'internationaal' ? t.inter : t.lokaal);
  const kaart = (x, i) => { const v = x.v; const vo = tx(v.voor, market) || [], te = tx(v.tegen, market) || []; return '<article class="kaart ah-kaart" data-id="' + esc(v.id) + '"><p class="eyebrow"><span class="kicker">' + (i + 1) + '. ' + typ(v) + '</span></p><h3>' + esc(v.naam) + '</h3>' + (x.r ? '<p class="score">' + getal(x.r.gemiddeld, 1) + '<small>★ · ' + getal(x.r.aantal, 0) + ' ' + t.reviewsW + '</small></p>' : '<p class="score leeg">' + t.geenRev + '</p>') + '<p class="feiten">' + kort(v) + '</p><ul class="pm">' + vo.slice(0, 2).map(a => '<li class="p">' + esc(a) + '</li>').join('') + te.slice(0, 1).map(a => '<li class="m">' + esc(a) + '</li>').join('') + '</ul>' + (v.url ? '<a class="cta ghost" href="' + esc(v.url) + '" target="_blank" rel="noopener nofollow" data-ah-out="' + esc(v.id) + '" data-out="' + esc(v.id) + '">' + t.bekijk + ' →</a>' : '') + '</article>'; };
  const vragen = t.q.map((q, qi) => '<div class="field"><label for="ah-q' + qi + '">' + esc(q) + '</label><select id="ah-q' + qi + '" name="q' + qi + '">' + t.o[qi].map((o, oi) => '<option value="' + oi + '"' + (route[qi] === oi ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select></div>').join('');
  const rij = (x, i) => { const v = x.v; const vo = tx(v.voor, market) || [], te = tx(v.tegen, market) || []; const veel = vo.length > 1 || te.length > 1 || (v.scores || []).length > 1; return '<article class="line ah-r" data-id="' + esc(v.id) + '"><div class="line-top"><div><h3 class="lname">' + naamLink(v) + '</h3><div class="lsub">' + typ(v) + (kort(v) ? ' · ' + kort(v) : '') + '</div></div><span class="badge ' + kleur(x.r) + '">' + (x.r ? getal(x.r.gemiddeld, 1) + ' ★ <small>' + getal(x.r.aantal, 0) + '</small>' : '–') + '</span></div>' + (vo[0] || te[0] ? '<ul class="pm">' + (vo[0] ? '<li class="p">' + esc(vo[0]) + '</li>' : '') + (te[0] ? '<li class="m">' + esc(te[0]) + '</li>' : '') + '</ul>' : '') + (veel ? '<details class="mini"><summary>' + t.meer + '</summary><ul class="pm">' + vo.slice(1).map(a => '<li class="p">' + esc(a) + '</li>').join('') + te.slice(1).map(a => '<li class="m">' + esc(a) + '</li>').join('') + '</ul><p class="fine">' + scoresTxt(v) + '</p></details>' : '') + '</article>'; };
  const faq = (data.faq || []).map(f => [tx(f.q, market), tx(f.a, market)]).filter(f => f[0] && f[1]);
  const tips = (data.tips || []).map(x => tx(x, market)).filter(Boolean);
  const bronnen = [...new Set(lijst.flatMap(v => v.bronnen || []))].slice(0, 80);
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: t.h1, description: t.desc(n), inLanguage: M.lang, datePublished: data.gepubliceerd || data.peildatum, dateModified: data.peildatum, mainEntityOfPage: url, author: { '@type': 'Organization', name: M.brand }, publisher: { '@type': 'Organization', name: M.brand } },
    { '@type': 'ItemList', name: t.alle, numberOfItems: n, itemListElement: rang.map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'AutoRental', name: x.v.naam, url: x.v.url || undefined, address: { '@type': 'PostalAddress', addressCountry: 'CW' } } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: M.brand, item: 'https://' + M.host + '/' }, { '@type': 'ListItem', position: 2, name: t.h1, item: url }] },
    ...(faq.length ? [{ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [])] };
  const css = ':root{--bg:#fff;--panel:#fff;--ink:#111113;--body:#3A3F47;--muted:#6B7280;--line:#E5E7EB;--line-strong:#B9BFC7;--accent:#2B47C4;--accent-ink:#fff;--accent-soft:#EEF1FC;--warn:#B3261E;--warn-soft:#FCEDEB;--mid:#8A6410;--mid-soft:#FBF2DC;--ok:#1F7A4D;--ok-soft:#E8F4EE;color-scheme:light}@media (prefers-color-scheme:dark){:root{--bg:#0F1116;--panel:#161922;--ink:#F2F3F5;--body:#C9CDD3;--muted:#8B929B;--line:#272C37;--line-strong:#4A5260;--accent:#93A6FF;--accent-ink:#0B1022;--accent-soft:#1B2246;--warn:#F08A7E;--warn-soft:#3A1D1A;--mid:#E3C168;--mid-soft:#33290F;--ok:#71CF9E;--ok-soft:#16301F;color-scheme:dark}}*,*::before,*::after{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:18px;line-height:1.65;-webkit-font-smoothing:antialiased}a{color:var(--ink);text-decoration:underline;text-decoration-color:var(--line-strong,#B9BFC7);text-decoration-thickness:1px;text-underline-offset:4px}main a:not(.btn):not(.card):not(.opt):not(.cta):not(.tegel):not(.mark):not(.brand):not([class*=btn]):not([style*=background]){color:var(--ink)!important}a:hover{text-decoration-color:currentColor}a:hover{color:var(--accent)}.top{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line)}.top-in{max-width:1040px;margin:0 auto;padding:18px 26px;display:flex;align-items:center;gap:20px}.brand{font-weight:700;letter-spacing:-.02em;font-size:18px;color:var(--ink);text-decoration:none}.brand span{color:var(--accent)}.kruim{font-size:16px;color:var(--ink);text-decoration:none}.langs{margin-left:auto;display:flex;gap:2px;font-size:16px;font-weight:600}.langs a{color:var(--ink);text-decoration:none;padding:4px 6px;border-radius:6px}.langs a[aria-current]{color:var(--accent)}main{max-width:820px;margin:0 auto;padding:56px 26px 30px}.eyebrow{font-size:16px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:var(--ink);margin:0 0 8px;display:flex;align-items:center;gap:9px}.live-dot{width:7px;height:7px;background:var(--accent);border-radius:50%;display:inline-block}h1{font-size:clamp(34px,6vw,54px);line-height:1.09;letter-spacing:-.04em;color:var(--ink);margin:16px 0 20px;font-weight:700;text-wrap:balance}h2{font-size:30px;line-height:1.22;letter-spacing:-.03em;color:var(--ink);margin:8px 0 14px;font-weight:700;text-wrap:balance}h3{color:var(--ink);font-weight:600;margin:0}p{margin:0 0 14px}.lead{font-size:18px;line-height:1.7;max-width:650px;margin-bottom:28px}.vragen{display:grid;grid-template-columns:1fr 1fr;gap:14px 16px;border:1px solid var(--line);border-radius:16px;box-shadow:0 5px 22px #15214b08;padding:22px;margin:0 0 12px}.field label{display:block;font-size:16px;font-weight:600;color:var(--ink);margin:0 0 7px}.field select{width:100%;min-height:48px;border:1px solid var(--line-strong);border-radius:9px;background:var(--bg);color:var(--ink);font:inherit;font-size:18px;padding:10px 12px}.micro,.fine{font-size:16px;color:var(--ink);line-height:1.6}section{padding:56px 0 0}.top3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin:22px 0 0}.kaart{border:1px solid var(--line);border-radius:14px;padding:22px 20px;display:flex;flex-direction:column;background:var(--panel)}#ah-top .kaart:first-child{border-color:var(--accent)}.kaart h3{font-size:20px;line-height:1.3;margin:4px 0 10px}.score{font-size:32px;font-weight:700;letter-spacing:-1px;color:var(--ink);margin:0 0 6px;line-height:1.1}.score small{font-size:16px;font-weight:400;letter-spacing:0;color:var(--ink);margin-left:6px}.score.leeg{font-size:18px;font-weight:400;color:var(--ink);letter-spacing:0}.feiten{font-size:16px;color:var(--ink);line-height:1.6;margin:0 0 14px}.pm{list-style:none;padding:0;margin:0 0 16px;font-size:18px;line-height:1.6}.pm li{position:relative;padding-left:18px;margin:5px 0}.pm li::before{position:absolute;left:0;font-weight:700}.pm .p::before{content:"+";color:var(--ok)}.pm .m::before{content:"−";color:var(--warn)}.kaart .pm{flex:1}.cta{display:inline-block;border:0;background:var(--accent);color:var(--accent-ink);border-radius:9px;padding:11px 16px;font-weight:600;font-size:16px;text-decoration:none;text-align:center}.cta.ghost{background:transparent;color:var(--accent);box-shadow:inset 0 0 0 1.5px var(--accent)}.lijst{margin-top:18px;border-top:1px solid var(--line)}.line{padding:18px 0;border-bottom:1px solid var(--line)}.line-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.lname{font-size:20px;line-height:1.35}.lname a{color:var(--ink);text-decoration:none}.lname a:hover{color:var(--accent)}.lsub{font-size:16px;color:var(--ink);line-height:1.6;margin-top:3px}.badge{font-size:16px;font-weight:600;border-radius:999px;padding:4px 11px;white-space:nowrap;font-variant-numeric:tabular-nums}.badge small{font-weight:400;margin-left:2px}.b-goed{background:var(--ok-soft);color:var(--ok)}.b-mid{background:var(--mid-soft);color:var(--mid)}.b-slecht{background:var(--warn-soft);color:var(--warn)}.b-leeg{background:var(--line);color:var(--ink)}.line .pm{margin:10px 0 0}details{border-top:1px solid var(--line);padding:14px 0}details:last-of-type{border-bottom:1px solid var(--line)}summary{cursor:pointer;color:var(--ink);font-weight:600;font-size:18px}details p{font-size:18px;line-height:1.8;color:var(--ink);margin:8px 0 0}details.mini{border:0;padding:6px 0 0}details.mini summary{font-size:16px;font-weight:500;color:var(--ink)}details.mini .pm{margin-top:6px}.zonder{margin-top:10px}.zonder .line:last-child{border-bottom:0}.vak{background:var(--accent-soft);border-radius:16px;padding:28px 30px}.vak ul{margin:0;padding-left:18px;font-size:18px;line-height:1.8}.vak li{margin:0 0 8px}.makel li{font-size:16px;line-height:1.8;margin:0 0 8px}.bronnen li{font-size:16px}footer{border-top:1px solid var(--line);margin-top:40px}footer .in{max-width:820px;margin:0 auto;padding:22px 26px 40px;font-size:16px;color:var(--ink)}footer a{color:var(--ink)}@media(max-width:760px){.top3{grid-template-columns:1fr}}@media(max-width:640px){.top-in{padding:16px 20px}main{padding:36px 20px 20px}.vragen{grid-template-columns:1fr;padding:18px}h2{font-size:26px}.vak{padding:22px}section{padding-top:44px}}' + SELECT_TERUGVAL;
  const client = '(function(){var D=' + JSON.stringify(lijst.map(v => ({ id: v.id, ophalen: v.ophalen, jeep: !!v.jeep, zevenPersoons: !!v.zevenPersoons, suv: !!v.suv, prijsVanaf: v.prijsVanaf || 0, borgLaag: !!v.borgLaag, volledigVerzekerd: !!v.volledigVerzekerd, schadeKlachten: !!v.schadeKlachten, minLeeftijd: v.minLeeftijd || 21, scores: v.scores || [] }))) + ';' + reviewScore.toString() + ';' + rangschik.toString() + ';var top=document.getElementById("ah-top"),body=document.getElementById("ah-body"),kaarten={},rijen={};top.querySelectorAll(".ah-kaart").forEach(function(k){kaarten[k.dataset.id]=k});document.querySelectorAll("#ah-store .ah-kaart").forEach(function(k){kaarten[k.dataset.id]=k});document.querySelectorAll(".ah-r").forEach(function(r){rijen[r.dataset.id]=r});function hit(k){try{var d=new Date().toISOString().slice(0,10).replace(/-/g,"");navigator.sendBeacon("/api/hjdk/stats/hits",new Blob([JSON.stringify({hits:[["ah-' + market + '-"+d+"-"+k,1]]})],{type:"text/plain"}))}catch(e){}}function go(){var r=[0,1,2,3].map(function(i){return +document.getElementById("ah-q"+i).value});var x=rangschik(D,r);var st=document.getElementById("ah-store");top.querySelectorAll(".ah-kaart").forEach(function(k){st.appendChild(k)});x.slice(0,3).forEach(function(y,i){var k=kaarten[y.v.id];if(k){k.querySelector(".kicker").textContent=(i+1)+". "+k.querySelector(".kicker").textContent.replace(/^\\d+\\. /,"");top.appendChild(k)}});x.forEach(function(y){var rr=rijen[y.v.id];if(rr)rr.parentNode.appendChild(rr)});document.getElementById("ah-geen").hidden=!!(x[0]&&x[0].past);hit("route-"+r.join(""))}[0,1,2,3].forEach(function(i){document.getElementById("ah-q"+i).addEventListener("change",go)});document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-ah-out]");if(a)hit("out-"+a.dataset.ahOut)});hit("view")})();';
  const store = rang.slice(3).map((x, i) => kaart(x, i + 3)).join('');
  const brand = M.brand === 'Keuzehulp' ? 'Keuze<span>hulp</span>' : M.brand === 'Kaufberater' ? 'Kauf<span>berater</span>' : 'Which to <span>buy</span>';
  const talen = Object.entries(AUTOHUUR).map(([k, x]) => '<a href="https://' + x.host + '/' + x.slug + '" hreflang="' + x.lang + '"' + (k === market ? ' aria-current="true"' : '') + '>' + x.lang.toUpperCase() + '</a>').join('') + AH_EXTRA.map(([l, u]) => '<a href="' + u + '" hreflang="' + l + '">' + l.toUpperCase() + '</a>').join('');
  const zonder = rang.filter(x => !x.r);
  return '<!doctype html><html lang="' + M.lang + '"><head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2064%2064%27%3E%3Crect%20width%3D%2764%27%20height%3D%2764%27%20rx%3D%2714%27%20fill%3D%27%232B47C4%27%2F%3E%3Cpath%20d%3D%27M18%2033l9%209%2019-20%27%20fill%3D%27none%27%20stroke%3D%27%23fff%27%20stroke-width%3D%277%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(t.title(n)) + '</title><meta name="description" content="' + esc(t.desc(n)) + '"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"><link rel="canonical" href="' + url + '">' + Object.values(AUTOHUUR).map(x => '<link rel="alternate" hreflang="' + x.lang + '" href="https://' + x.host + '/' + x.slug + '">').join('') + AH_EXTRA.map(([l, u]) => '<link rel="alternate" hreflang="' + l + '" href="' + u + '">').join('') + '<link rel="alternate" hreflang="x-default" href="https://whichtobuy.best/curacao-car-rental">' + '<meta property="og:title" content="' + esc(t.title(n)) + '"><meta property="og:description" content="' + esc(t.desc(n)) + '"><meta property="og:url" content="' + url + '"><meta property="og:type" content="article"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script><style>' + css + '</style></head><body><header class="top"><div class="top-in"><a class="brand" href="/">' + brand + '</a><a class="kruim" href="/curacao">← Curaçao</a><nav class="langs">' + talen + '</nav></div></header><main>'
    + '<p class="eyebrow"><span class="live-dot"></span>' + esc(t.peil) + ' ' + esc(d) + ' · ' + n + ' ' + esc(t.alle.split(' ')[1] || '') + '</p><h1>' + esc(t.h1) + '</h1><p class="lead">' + esc(t.kort(n, d)) + '</p>'
    + '<form id="ah-form" class="vragen" method="get" action="/' + M.slug + '" onsubmit="return false">' + vragen + '</form><p class="micro">' + esc(t.klik) + '</p>'
    + '<section><p class="eyebrow">' + esc(t.jouw) + '</p><p id="ah-geen" class="micro"' + (top[0] && top[0].past ? ' hidden' : '') + '>' + esc(t.geen) + '</p><div id="ah-top" class="top3">' + top.map(kaart).join('') + '</div><div id="ah-store" hidden>' + store + '</div></section>'
    + '<section><h2>' + esc(t.alle) + '</h2><div id="ah-body" class="lijst">' + rang.filter(x => x.r).map(rij).join('') + '</div>' + (zonder.length ? '<details class="zonder"><summary>' + esc(t.zonderRev) + ' (' + zonder.length + ')</summary><div id="ah-body2">' + zonder.map(rij).join('') + '</div></details>' : '') + '<p class="fine" style="margin-top:16px">' + esc(t.prijsNoot) + ((data.nietBevestigd || []).length ? ' ' + esc(t.nietBev) + ' ' + esc(data.nietBevestigd.join(', ')) + '.' : '') + '</p></section>'
    + ((data.brokers || []).length ? '<section><h2>' + esc(t.brokerKop) + '</h2><p class="fine">' + esc(t.brokerTekst) + '</p><div class="lijst">' + data.brokers.map(b => '<div class="line"><h3 class="lname">' + esc(b.naam) + '</h3>' + ((tx(b.tegen, market) || []).length ? '<ul class="pm">' + tx(b.tegen, market).slice(0, 2).map(a => '<li class="m">' + esc(a) + '</li>').join('') + '</ul>' : '') + '</div>').join('') + '</div></section>' : '')
    + (tips.length ? '<section><div class="vak"><p class="eyebrow">' + esc(t.tipsKop) + '</p><ul>' + tips.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div></section>' : '')
    + (faq.length ? '<section><h2>' + esc(t.faqKop) + '</h2>' + faq.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</section>' : '')
    + '<section><h2>' + esc(t.methode) + '</h2><p class="fine">' + esc(t.methodeTekst) + '</p><details><summary>' + esc(t.bron) + ' (' + bronnen.length + ')</summary><ul class="bronnen">' + bronnen.map(b => '<li><a href="' + esc(b) + '" rel="nofollow noopener" target="_blank">' + esc(b.replace(/^https?:\/\/(www\.)?/, '').slice(0, 90)) + '</a></li>').join('') + '</ul></details></section>'
    + '</main><footer><div class="in">' + esc(t.mis) + ' <a href="https://wa.me/31655395630" rel="nofollow">' + esc(t.wa) + '</a> · ' + esc(d) + '<br>' + esc(M.brand) + ' · AdsFair B.V., Gouda · KvK 60126035 · <a href="/">' + esc(M.host) + '</a> · <a href="/privacy">Privacy</a></div></footer><script defer src="/api/keuze-updates?op=deel" data-deel="1"></script><script defer src="/api/keuze-updates?op=lijst" data-lijst="1"></script><script>' + client + '</script></body></html>';
}


// IndexNow (Bing, Yandex; Bing voedt ook ChatGPT-zoeken en Copilot) voor de drie pagina's; hooguit eens per dag
export async function pingIndex(force) {
  const dag = new Date().toISOString().slice(0, 10); const k = 'autohuur:ping:' + dag;
  if (!force && await kv.get(k).catch(() => null)) return { overgeslagen: true };
  const sleutels = { nl: '466971cbc1bbe43e6bb64a94465e4470', us: '7c1e4b9a2f6d48e3a05b9c71d2e8f4a6', de: '7c1e4b9a2f6d48e3a05b9c71d2e8f4a6' }; const uit = {};
  for (const [m, M] of Object.entries(AUTOHUUR)) {
    const base = 'https://' + M.host;
    try { const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: M.host, key: sleutels[m], keyLocation: base + '/' + sleutels[m] + '.txt', urlList: [base + '/' + M.slug, base + '/sitemap.xml', base + '/llms.txt'] }) }); uit[m] = r.status; } catch (e) { uit[m] = String(e.message || e).slice(0, 60); }
  }
  await kv.set(k, uit, { ex: 2 * 86400 }).catch(() => {});
  return uit;
}

export async function autohuurHandler(req, res, url, market) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) return res.status(405).send('Method not allowed');
  if (!AUTOHUUR[market] || !data.verhuurders.length) return res.status(404).send('Not found');
  if (url.searchParams.get('op') === 'reviews') { // dagelijkse cron; zonder token hooguit 4 rondes per dag
    const k = 'autohuur:revrun:' + new Date().toISOString().slice(0, 10); const n = await kv.incr(k).catch(() => 1); if (n === 1) await kv.raw(['EXPIRE', k, 2 * 86400]).catch(() => {});
    if (n > 6) return res.status(429).json({ error: 'al 6 rondes vandaag' });
    return res.status(200).json(await reviewRonde({ oidc: String(req.headers['x-vercel-oidc-token'] || '') }));
  }
  if (url.searchParams.get('op') === 'ping') return res.status(200).json(await pingIndex(false));
  if (url.searchParams.get('op') === 'reviewlog') return res.status(200).json((await kv.get('autohuur:revlog').catch(() => null)) || {});
  const q = url.searchParams; const route = [0, 1, 2, 3].map(i => Math.max(0, Math.min(T[market].o[i].length - 1, parseInt(q.get('q' + i) || '0', 10) || 0)));
  const lijst = await verhuurders();
  const cm = market === 'us' ? 'en' : market; const { telBot, meetJs, meerBlok } = await import('./cur.js'); await telBot(req, cm, 'autohuur');
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=600');
  return res.status(200).send(render(market, lijst, route).replace('</main><footer>', meerBlok(cm, 'autohuur') + '</main><footer>').replace('</body></html>', '<script>' + meetJs(cm, 'autohuur') + '</script></body></html>'));
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
const SYS_REV = 'Je vat echte klantreviews van een autoverhuurder op Curaçao samen. Noem alleen punten die in meerdere reviews terugkomen, in gewone woorden, zonder overdrijving en zonder reviewers te citeren of te noemen. Geef per taal 3 tot 4 korte voordelen en 2 tot 4 korte nadelen (elk hooguit 12 woorden), concreet (borg, schade-afhandeling, wachttijd, staat van de auto, ophalen, prijs). Nadelen: noem de kritiekpunten die echt in de reviews staan (ook als ze maar af en toe voorkomen, zoals wachttijd, volgeboekt, oudere auto, borgafhandeling). Staat er geen enkel kritiekpunt in, geef dan een lege lijst. Schrijf nooit meta-opmerkingen over reviewplatforms of het aantal reviews. Antwoord alleen met JSON: {"voor":{"nl":[],"en":[],"de":[]},"tegen":{"nl":[],"en":[],"de":[]}}';
async function verwerkRev(w, r, dag, log) {
  const teksten = (r.reviews || []).filter(x => x.text && x.text.length > 30).slice(0, 60); if (teksten.length < 5) log.push(w.id + ': ' + teksten.length + ' reviews met tekst van ' + (r.reviews || []).length);
  const uit = { dag, n: teksten.length, scores: r.rating ? [{ platform: 'Google', score: Math.round(r.rating * 10) / 10, aantal: r.total || 0, peildatum: dag, bron: 'Google Maps via DataForSEO' }] : [] };
  if (teksten.length >= 5) {
    try {
      const { claude } = await import('./wtb.js');
      const j = await claude(SYS_REV, 'Verhuurder: ' + w.naam + '\nGemiddelde Google-score: ' + r.rating + ' uit ' + r.total + ' reviews.\n\nReviews (nieuwste eerst, score en tekst):\n' + teksten.map(x => '- ' + (x.rating ?? '?') + '/5: ' + x.text.replace(/\s+/g, ' ').slice(0, 500)).join('\n'), { max: 3000, oidc: w.oidc, fn: 'autohuur-reviews' });
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
    const r = await reviewsRadar('get', 'google', '', 'CW', '&id=' + encodeURIComponent(w.task));
    if (r.status === 'pending' && Date.now() - w.at < 2 * 864e5) { rest.push(w); log.push(w.id + ': nog bezig'); continue; }
    if (r.status !== 'ready') { log.push(w.id + ': ' + (r.status || r.error || r.fout || 'mislukt')); await kv.set('autohuur:revtry2:' + w.id, dag, { ex: 30 * 86400 }).catch(() => {}); continue; }
    await verwerkRev(Object.assign({}, w, { oidc: o.oidc }), r, dag, log);
  }
  // nieuwe taken: verhuurders zonder of met de oudste live data
  const ids = data.verhuurders.map(v => v.id); const vals = await kv.mget(...ids.map(i => 'autohuur:rev:' + i)).catch(() => []); const tries = await kv.mget(...ids.map(i => 'autohuur:revtry2:' + i)).catch(() => []);
  const kand = data.verhuurders.map((v, i) => ({ v, dag: (vals[i] && vals[i].dag && (vals[i].voor || (vals[i].n || 0) < 5)) ? vals[i].dag : '0000', tried: tries[i] })).filter(x => x.v.googleQ !== false && !x.tried && !rest.some(w => w.id === x.v.id) && x.dag < new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)).sort((a, b) => a.dag.localeCompare(b.dag));
  for (const x of kand.slice(0, Math.max(0, (o.n || 2) - rest.length))) {
    const q = x.v.googleQ || (x.v.naam + ' Curaçao');
    const r = await reviewsRadar('post', 'google', q, 'CW', '&n=100');
    if (r.id) { rest.push({ id: x.v.id, naam: x.v.naam, task: r.id, at: Date.now() }); log.push(x.v.id + ': taak gestart'); }
    else if (r.cached) await verwerkRev({ id: x.v.id, naam: x.v.naam, oidc: o.oidc }, r, dag, log);
    else { log.push(x.v.id + ': ' + (r.error || r.fout || 'post mislukt')); if (/limit|budget/i.test(r.error || '')) break; }
  }
  await kv.set('autohuur:revq', rest.filter(w => w.task));
  if (log.some(x => /voor\/tegen bijgewerkt/.test(x))) log.push('indexnow ' + JSON.stringify(await pingIndex(false)));
  await kv.set('autohuur:revlog', { at: new Date().toISOString(), log }).catch(() => {});
  return { ok: true, log, wacht: rest.length };
}
