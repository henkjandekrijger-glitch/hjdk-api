// Keuzehulp chirurgie op keuzehulp.best/chirurgie, gebouwd volgens het keuzehulp-protocol (skill keuzehulp-bouw), net als alle andere
// keuzehulpen (20 nov 2026, Henkjan: "Ik wil dat het werkt zoals alle keuzehulpen ... Gebruik je protocol om op te bouwen").
// Zelfde opbouw als de lokale gidsen (lib/advocaat.js, lib/rdam.js): kruimel, bovenregel, H1, bijgewerkt, inleiding, het antwoord met één
// eerste keus, de chat van de keuzehulpen (lib/kzux.js, zonder geheugen: een ingreep is een gezondheidsgegeven), de klinieken op volgorde
// van de Keuzehulp-score met "Waarom plek N", één situatietabel, uitleg, vragen, volgende gidsen, aanmelden en een voet in één regel.
// De data en de rekenregels blijven waar ze waren: lib/tsc-rank.js (scoor, METHODE) en lib/tsc-reviewrank.js (ervaringsindex), met de
// lezersteksten per taal uit lib/tsc-provider-tekst.js. Talen: Engels zonder voorvoegsel, nl/ en de/ (dezelfde adressen als voorheen).
// Score: heeft een lijst minstens 3 klinieken met genoeg openbare data voor de volledige methode, dan rangschikken we op de Keuzehulp-score
// (kwalificaties 30, vergunning 15, ervaringen 30, openheid 15, risico tot -20). Anders op de ervaringsindex van patiënten (0 tot 5).
// Niemand betaalt voor een plek. Geen aggregateRating in de JSON-LD. Geen AI bij het openen van een pagina.
import { LIJSTEN, RANK_SLUGS, scoor, METHODE, METHODE_P } from './tsc-rank.js';
import { reviewRanking, reviewSources, REVIEW_POLICY } from './tsc-reviewrank.js';
import { PROCEDURES, procedureLabel } from './tsc-catalog.js';
import { providerEntries } from './tsc-provider.js';
import { veldTekst, conclusieTekst, waarschuwingTekst } from './tsc-provider-tekst.js';
import { countryName } from './tsc-country-picker.js';
import { PAGES } from './tsc-data.js';
import { dentalSearchQuestions, dentalClusterLinks } from './tsc-search-intent.js';
import { kzuxBlok } from './kzux.js';
import { ovRegel } from './huisstijl.js';
import { CSS as RCSS } from './rdam.js';
import { MK_CSS } from './makelaar.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BASIS = 'https://keuzehulp.best/chirurgie';
export const RENDER_UPDATED = '2026-11-20'; // actieve inhoudswijziging, los van de broncontroledatum per lijst
const canon = s => BASIS + (s ? '/' + s : '');
const link = (b, s) => b.includes('?') ? b + encodeURIComponent(s) : b + (s ? '/' + s : '');
const TALEN = ['en', 'nl', 'de'];
const LOC = { en: 'en-GB', nl: 'nl-NL', de: 'de-DE' };
const KZ = { en: 'us', nl: 'nl', de: 'de' }; // taal van de chat (lib/kzux.js, lib/kzchat.js)
const hubSlug = t => t === 'en' ? '' : t;
const num = (x, t, d = 1) => Number(x || 0).toLocaleString(LOC[t], { maximumFractionDigits: d, minimumFractionDigits: 0 });
const datum = (iso, t) => { try { return new Date(String(iso).slice(0, 10) + 'T12:00:00Z').toLocaleDateString(LOC[t], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return String(iso); } };
const lijstZin = (a, t) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ' + ({ en: 'and', nl: 'en', de: 'und' }[t]) + ' ' + a[a.length - 1];
const klein = s => /^([A-Z]{2}|Brazilian|Invisalign|All-on)/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);
const bronLink = (u, label) => u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener nofollow">' + esc(label) + '</a>' : esc(label);
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };

const T = {
  nl: { kruim: 'Keuzehulp', chir: 'Chirurgie', eb: 'Keuzehulp chirurgie', upd: 'Bijgewerkt', pnt: 'punten', ks: 'Keuzehulp-score', erv: 'ervaringsscore', van5: 'van 5',
    reviews: 'reviews', uit: 'uit', plek: 'plek', van: 'van', bekijk: 'Bekijk kliniek', bekijkArts: 'Bekijk arts', site: 'Website', lijst: 'Bekijk de ranglijst', waarom: n => 'Waarom plek ' + n + '?',
    alle: (n, a) => 'De ' + n + (a ? ' klinieken en artsen' : ' klinieken') + ' met een plek', ook: 'Ook bekeken, zonder plek', ookP: 'Van deze klinieken staat te weinig openbare data online voor een eerlijke plek. Ze staan op alfabet.',
    sitH: 'Welke openbare signalen wil je vergelijken?', sit: 'Openbaar signaal', keus: 'Hoogste in deze vergelijking', waaromK: 'Waarom', zo: 'Zo rangschikken we', vragen: 'Vragen', volg: 'Volgende gidsen', chatKop: 'Vraag het de keuzehulp',
    hubH1: 'Chirurgie vergelijken: klinieken en artsen, ook in het buitenland', hubTitle: 'Keuzehulp chirurgie: klinieken en artsen vergelijken',
    hubLead: 'We vergelijken klinieken voor haartransplantatie, plastische chirurgie, ogen en tanden op openbare data: kwalificaties van de arts, reviews op onafhankelijke platforms, openheid over prijs en gemelde risico\'s. Elk getal heeft een bron.',
    landH: 'Ranglijsten per land', ingrH: 'Alle ingrepen', groep: { haar: 'Haar', ogen: 'Ogen', gezicht: 'Gezicht', borst: 'Borst', lichaam: 'Lichaam', huid: 'Huid', tanden: 'Tanden' },
    nKl: (n, a) => n + (a ? ' klinieken en artsen' : ' klinieken'), sitHub: 'Wat zoek je?', rl: 'Ranglijst', medisch: 'Dit is geen medisch advies. Bespreek je behandeling met een arts.',
    cats: { kwal: 'Kwalificaties van de arts', verg: 'Vergunning en accreditatie', erv: 'Ervaringen van patiënten', open: 'Openheid over prijs en wie opereert', risico: 'Gemelde risico\'s' },
    geenP: 'Geen punten voor', genoemd: n => 'genoemd op ' + n + (n === 1 ? ' onafhankelijk forum of artsenoverzicht' : ' onafhankelijke forums of artsenoverzichten'),
    prijsOp: 'prijs op de eigen site', artsJa: 'de site zegt dat de genoemde arts zelf opereert', artsDeels: 'de genoemde arts doet volgens de site een deel zelf', nazorg: 'nazorg bevestigd met bron',
    bronnen: 'Bronnen', artsen: 'Artsen', revH: 'Reviews op onafhankelijke platforms', prijsH: 'Prijs volgens de eigen site', risH: 'Gemelde risico\'s', anderH: 'Andere klinieken in deze ranglijst',
    rij: { top: 'De hoogste score', meest: 'De meeste ervaringen van patiënten', kwal: 'Bewezen kwalificaties van de arts', arts: 'De genoemde arts opereert zelf', prijs: 'Vooraf een prijs op de site' },
    methodeEind: 'Samen hoogstens 100 punten. Een kliniek krijgt pas een plek met genoeg openbare data. Niemand kan een plek kopen. Klinieken kunnen een fout melden; we kijken elke melding na met de bron erbij.',
    ervUitleg: p => 'Deze ranglijst gebruikt de ervaringsindex van patiënten: per platform tellen hoogstens ' + p.perSourceCap + ' reviews mee, elke score wordt naar het midden van alle klinieken getrokken (alsof er ' + p.shrinkage + ' gemiddelde reviews bij komen) en een kliniek heeft minstens ' + p.minimum + ' reviews nodig. Het is geen medisch kwaliteitsoordeel.',
    ervPlat: (s, n, m) => s + ' van 5 uit ' + n + ' reviews op ' + m + (m === 1 ? ' platform' : ' platforms'),
    qBeste: (ing, land) => 'Wat is de beste kliniek voor ' + klein(ing) + (land ? ' in ' + land : '') + '?', qRang: 'Hoe rangschikken jullie de klinieken?', qMed: 'Is dit medisch advies?',
    aMed: 'Nee. De rangschikking beschrijft alleen de genoemde openbare gegevens. Zij meet geen veiligheid, geschiktheid voor jou of behandelresultaat. Controleer de actuele registratie van jouw behandelaar en bespreek de behandeling met een arts.',
    qGoed: n => 'Is ' + n + ' een goede kliniek?', qWie: n => 'Wie opereert bij ' + n + '?', qKost: n => 'Wat kost een behandeling bij ' + n + '?', qRev: n => 'Wat zeggen reviews over ' + n + '?',
    eerste: (n, w) => 'Hoogst in deze vergelijking op openbare gegevens: ' + n + (w ? ', ' + w : '') + '. Dit is geen oordeel over veiligheid, geschiktheid of behandelresultaat.', kies: (n, w) => 'In deze dataset heeft ' + n + ' ' + w + '.',
    kiesW: { meest: 'de meeste meegetelde patiëntervaringen', kwal: 'de meeste punten voor vastgelegde kwalificaties', arts: 'een bron waarin staat dat de genoemde arts zelf opereert', prijs: 'een gepubliceerde prijs op de eigen site' },
    procH1: ing => 'Klinieken voor ' + klein(ing) + ' vergeleken', landH1: (n, a) => n + ': ' + (a ? 'klinieken en artsen' : 'klinieken') + ' vergeleken', procTitle: (ing, n) => 'Klinieken ' + klein(ing) + ' vergeleken: ' + n + ' profielen', kl: 'kliniek', inLand: 'in',
    daarna: 'Daarna', ervHub: 'Ranglijsten met te weinig data voor de volledige methode gebruiken de ervaringsindex van patiënten (0 tot 5, met een rem op kleine aantallen).',
    opPlek: (p, m, l) => 'Plek ' + p + ' van ' + m + ' in ' + l, eigenaar: 'Werkt u bij deze kliniek en klopt er iets niet? Mail de bron naar henkjandekrijger@gmail.com, dan passen we het aan.' },
  en: { kruim: 'Guides', chir: 'Surgery', eb: 'Surgery guide', upd: 'Updated', pnt: 'points', ks: 'Guide score', erv: 'experience score', van5: 'out of 5',
    reviews: 'reviews', uit: 'from', plek: 'rank', van: 'of', bekijk: 'View clinic', bekijkArts: 'View doctor', site: 'Website', lijst: 'See the ranking', waarom: n => 'Why rank ' + n + '?',
    alle: (n, a) => 'The ' + n + (a ? ' ranked clinics and doctors' : ' ranked clinics'), ook: 'Also checked, without a rank', ookP: 'Too little public data is online for these clinics to give them a fair rank. They are listed alphabetically.',
    sitH: 'Which public signals do you want to compare?', sit: 'Public signal', keus: 'Highest in this comparison', waaromK: 'Why', zo: 'How we rank', vragen: 'Questions', volg: 'Next guides', chatKop: 'Ask the guide',
    hubH1: 'Compare surgery clinics and doctors at home and abroad', hubTitle: 'Surgery guide: compare clinics and doctors',
    hubLead: 'We compare clinics for hair transplants, plastic surgery, eyes and teeth on public data: the doctor\'s qualifications, reviews on independent platforms, openness about price and reported risks. Every number has a source.',
    landH: 'Rankings by country', ingrH: 'All procedures', groep: { haar: 'Hair', ogen: 'Eyes', gezicht: 'Face', borst: 'Breast', lichaam: 'Body', huid: 'Skin', tanden: 'Teeth' },
    nKl: (n, a) => n + (a ? ' clinics and doctors' : ' clinics'), sitHub: 'What are you looking for?', rl: 'Ranking', medisch: 'This is not medical advice. Discuss your treatment with a doctor.',
    cats: { kwal: 'Doctor\'s qualifications', verg: 'Licence and accreditation', erv: 'Patient reviews', open: 'Openness about price and who operates', risico: 'Reported risks' },
    geenP: 'No points for', genoemd: n => 'named in ' + n + (n === 1 ? ' independent forum or doctor directory' : ' independent forums or doctor directories'),
    prijsOp: 'price on its own site', artsJa: 'the site says the named doctor operates', artsDeels: 'the named doctor does part of the work, says the site', nazorg: 'aftercare confirmed with a source',
    bronnen: 'Sources', artsen: 'Doctors', revH: 'Reviews on independent platforms', prijsH: 'Price according to its own site', risH: 'Reported risks', anderH: 'Other clinics in this ranking',
    rij: { top: 'The highest score', meest: 'The most patient reviews', kwal: 'Proven qualifications of the doctor', arts: 'The named doctor operates', prijs: 'A price on the site up front' },
    methodeEind: 'At most 100 points in total. A clinic only gets a rank with enough public data. Nobody can buy a rank. Clinics can report a mistake; we check every report against its source.',
    ervUitleg: p => 'This ranking uses the patient experience index: per platform at most ' + p.perSourceCap + ' reviews count, each score is pulled towards the middle of all clinics (as if ' + p.shrinkage + ' average reviews were added) and a clinic needs at least ' + p.minimum + ' reviews. It is not a medical quality rating.',
    ervPlat: (s, n, m) => s + ' out of 5 from ' + n + ' reviews on ' + m + (m === 1 ? ' platform' : ' platforms'),
    qBeste: (ing, land) => 'What is the best clinic for ' + klein(ing) + (land ? ' in ' + land : '') + '?', qRang: 'How do you rank the clinics?', qMed: 'Is this medical advice?',
    aMed: 'No. The ranking only describes the stated public data. It does not measure safety, suitability for you or treatment outcomes. Check your clinician’s current registration and discuss treatment with a doctor.',
    qGoed: n => 'Is ' + n + ' a good clinic?', qWie: n => 'Who operates at ' + n + '?', qKost: n => 'How much does treatment at ' + n + ' cost?', qRev: n => 'What do reviews say about ' + n + '?',
    eerste: (n, w) => 'Highest in this comparison on public data: ' + n + (w ? ', ' + w : '') + '. This is not a judgement of safety, suitability or treatment outcome.', kies: (n, w) => 'In this dataset, ' + n + ' has ' + w + '.',
    kiesW: { meest: 'the most included patient-review evidence', kwal: 'the most points for documented qualifications', arts: 'a source stating that the named doctor operates', prijs: 'a published price on its own site' },
    procH1: ing => 'Compare clinics for ' + klein(ing), landH1: (n, a) => n + ': ' + (a ? 'clinics and doctors' : 'clinics') + ' compared', procTitle: (ing, n) => 'Compare ' + klein(ing) + ' clinics: ' + n + ' profiles', kl: 'clinic', inLand: 'in',
    daarna: 'Then', ervHub: 'Rankings with too little data for the full method use the patient experience index (0 to 5, with a brake on small numbers).',
    opPlek: (p, m, l) => 'Rank ' + p + ' of ' + m + ' in ' + l, eigenaar: 'Do you work at this clinic and is something wrong? Email the source to henkjandekrijger@gmail.com and we will correct it.' },
  de: { kruim: 'Kaufberater', chir: 'Chirurgie', eb: 'Ratgeber Chirurgie', upd: 'Aktualisiert', pnt: 'Punkte', ks: 'Ratgeber-Punkte', erv: 'Erfahrungswert', van5: 'von 5',
    reviews: 'Bewertungen', uit: 'aus', plek: 'Platz', van: 'von', bekijk: 'Klinik ansehen', bekijkArts: 'Arzt ansehen', site: 'Website', lijst: 'Rangliste ansehen', waarom: n => 'Warum Platz ' + n + '?',
    alle: (n, a) => 'Die ' + n + (a ? ' Kliniken und Ärzte' : ' Kliniken') + ' mit Platz', ook: 'Ebenfalls geprüft, ohne Platz', ookP: 'Zu diesen Kliniken stehen zu wenige öffentliche Daten online für einen fairen Platz. Sie stehen alphabetisch.',
    sitH: 'Welche öffentlichen Signale möchten Sie vergleichen?', sit: 'Öffentliches Signal', keus: 'Höchster Wert in diesem Vergleich', waaromK: 'Warum', zo: 'So ordnen wir', vragen: 'Fragen', volg: 'Weitere Ratgeber', chatKop: 'Frag den Ratgeber',
    hubH1: 'Kliniken und Ärzte für Chirurgie vergleichen, auch im Ausland', hubTitle: 'Ratgeber Chirurgie: Kliniken und Ärzte vergleichen',
    hubLead: 'Wir vergleichen Kliniken für Haartransplantation, Schönheitschirurgie, Augen und Zähne anhand öffentlicher Daten: Qualifikationen des Arztes, Bewertungen auf unabhängigen Plattformen, Offenheit über Preis und gemeldete Risiken. Jede Zahl hat eine Quelle.',
    landH: 'Ranglisten nach Land', ingrH: 'Alle Eingriffe', groep: { haar: 'Haare', ogen: 'Augen', gezicht: 'Gesicht', borst: 'Brust', lichaam: 'Körper', huid: 'Haut', tanden: 'Zähne' },
    nKl: (n, a) => n + (a ? ' Kliniken und Ärzte' : ' Kliniken'), sitHub: 'Was suchen Sie?', rl: 'Rangliste', medisch: 'Das ist keine medizinische Beratung. Besprechen Sie Ihre Behandlung mit einem Arzt.',
    cats: { kwal: 'Qualifikationen des Arztes', verg: 'Lizenz und Akkreditierung', erv: 'Patientenbewertungen', open: 'Offenheit über Preis und wer operiert', risico: 'Gemeldete Risiken' },
    geenP: 'Keine Punkte für', genoemd: n => 'genannt in ' + n + (n === 1 ? ' unabhängigen Forum oder Ärzteverzeichnis' : ' unabhängigen Foren oder Ärzteverzeichnissen'),
    prijsOp: 'Preis auf der eigenen Website', artsJa: 'laut Website operiert der genannte Arzt selbst', artsDeels: 'laut Website macht der genannte Arzt einen Teil selbst', nazorg: 'Nachsorge mit Quelle bestätigt',
    bronnen: 'Quellen', artsen: 'Ärzte', revH: 'Bewertungen auf unabhängigen Plattformen', prijsH: 'Preis laut eigener Website', risH: 'Gemeldete Risiken', anderH: 'Weitere Kliniken in dieser Rangliste',
    rij: { top: 'Die höchste Punktzahl', meest: 'Die meisten Patientenbewertungen', kwal: 'Nachgewiesene Qualifikationen des Arztes', arts: 'Der genannte Arzt operiert selbst', prijs: 'Ein Preis vorab auf der Website' },
    methodeEind: 'Zusammen höchstens 100 Punkte. Eine Klinik bekommt erst mit genug öffentlichen Daten einen Platz. Niemand kann einen Platz kaufen. Kliniken können einen Fehler melden; wir prüfen jede Meldung anhand der Quelle.',
    ervUitleg: p => 'Diese Rangliste nutzt den Erfahrungsindex der Patienten: pro Plattform zählen höchstens ' + p.perSourceCap + ' Bewertungen, jeder Wert wird zur Mitte aller Kliniken gezogen (als kämen ' + p.shrinkage + ' durchschnittliche Bewertungen hinzu) und eine Klinik braucht mindestens ' + p.minimum + ' Bewertungen. Das ist keine medizinische Qualitätsbewertung.',
    ervPlat: (s, n, m) => s + ' von 5 aus ' + n + ' Bewertungen auf ' + m + (m === 1 ? ' Plattform' : ' Plattformen'),
    qBeste: (ing, land) => 'Welche Klinik ist die beste für ' + ing + (land ? ' in ' + land : '') + '?', qRang: 'Wie ordnen Sie die Kliniken?', qMed: 'Ist das eine medizinische Beratung?',
    aMed: 'Nein. Die Rangfolge beschreibt nur die genannten öffentlichen Daten. Sie misst weder Sicherheit noch persönliche Eignung oder Behandlungsergebnis. Prüfen Sie die aktuelle Registrierung Ihres Behandlers und besprechen Sie die Behandlung mit einem Arzt.',
    qGoed: n => 'Ist ' + n + ' eine gute Klinik?', qWie: n => 'Wer operiert bei ' + n + '?', qKost: n => 'Was kostet eine Behandlung bei ' + n + '?', qRev: n => 'Was sagen Bewertungen über ' + n + '?',
    eerste: (n, w) => 'Höchster Wert in diesem Vergleich öffentlicher Daten: ' + n + (w ? ', ' + w : '') + '. Das ist kein Urteil über Sicherheit, Eignung oder Behandlungsergebnis.', kies: (n, w) => 'In diesem Datensatz hat ' + n + ' ' + w + '.',
    kiesW: { meest: 'die meisten einbezogenen Patientenbewertungen', kwal: 'die meisten Punkte für belegte Qualifikationen', arts: 'eine Quelle, laut der der genannte Arzt selbst operiert', prijs: 'einen veröffentlichten Preis auf der eigenen Website' },
    procH1: ing => 'Kliniken für ' + ing + ' im Vergleich', landH1: (n, a) => n + ': ' + (a ? 'Kliniken und Ärzte' : 'Kliniken') + ' im Vergleich', procTitle: (ing, n) => 'Kliniken ' + ing + ' vergleichen: ' + n + ' Profile', kl: 'Klinik', inLand: 'in',
    daarna: 'Danach', ervHub: 'Ranglisten mit zu wenig Daten für die volle Methode nutzen den Erfahrungsindex der Patienten (0 bis 5, mit einer Bremse bei kleinen Zahlen).',
    opPlek: (p, m, l) => 'Platz ' + p + ' von ' + m + ' in ' + l, eigenaar: 'Arbeiten Sie in dieser Klinik und stimmt etwas nicht? Mailen Sie die Quelle an henkjandekrijger@gmail.com, dann korrigieren wir es.' },
};

// ---------- rangschikking per lijst ----------
const CACHE = new Map();
export function rang(id) {
  if (CACHE.has(id)) return CACHE.get(id);
  const l = LIJSTEN[id]; if (!l) return null;
  const clinicReviews = reviewRanking(l), doctorReviews = reviewRanking(l, 'doctor');
  const reviewById = new Map([...clinicReviews.ranked, ...clinicReviews.unranked, ...doctorReviews.ranked, ...doctorReviews.unranked].map(x => [x.k.id, x.review]));
  const alle = (l.klinieken || []).map(k => {
    const e = reviewById.get(k.id) || { eligible: false, score: null, platforms: 0, source_counts: [], sources: reviewSources(k) };
    // Dezelfde opgeschoonde bronnen bepalen zowel de reviewpunten als de zichtbare reviewfeiten. Een geschorst,
    // onbeschikbaar of anders gescopeerd profiel kan zo geen score of aanbevelingszin meer verhogen.
    return { k, s: scoor({ ...k, reviews: e.sources.included }, l), e };
  });
  let modus = 'geen', rij = [], rest = alle;
  const sc = alle.filter(x => x.s.genoeg && !(x.k.risico || []).some(r => r.ernst === 'zwaar')).sort((a, b) => b.s.totaal - a.s.totaal || b.s.n - a.s.n);
  if (sc.length >= 3) { modus = 'score'; rij = sc; rest = alle.filter(x => !sc.includes(x)); }
  else { const r = clinicReviews.ranked.concat(doctorReviews.ranked.filter(x => (l.klinieken || []).some(k => k.id === x.k.id))).sort((a, b) => b.review.score - a.review.score || b.review.platforms - a.review.platforms);
    if (r.length) { modus = 'ervaring'; rij = r.map(x => ({ k: x.k, s: scoor({ ...x.k, reviews: x.review.sources.included }, l), e: x.review })); const ids = new Set(rij.map(x => x.k.id)); rest = alle.filter(x => !ids.has(x.k.id)); } }
  rest = rest.sort((a, b) => a.k.naam.localeCompare(b.k.naam));
  const uit = { l, modus, rij, rest, n: (l.klinieken || []).length, arts: (l.klinieken || []).some(k => k.kind === 'doctor') };
  CACHE.set(id, uit); return uit;
}
const NAAM = { 'plastic-thailand': { nl: 'Plastische chirurgie', en: 'Plastic surgery', de: 'Schönheitschirurgie' }, 'plastic-korea': { nl: 'Plastische chirurgie', en: 'Plastic surgery', de: 'Schönheitschirurgie' },
  'plastic-colombia': { nl: 'Plastische chirurgie', en: 'Plastic surgery', de: 'Schönheitschirurgie' }, 'bbl-dr': { nl: 'BBL en buikwandcorrectie', en: 'BBL and tummy tuck', de: 'BBL und Bauchdeckenstraffung' } };
const ingreepNaam = (l, t) => (NAAM[l.id] || {})[t] || procedureLabel(l.ingreep, t);
const LAND = { DO: { nl: 'de Dominicaanse Republiek', en: 'the Dominican Republic', de: 'der Dominikanischen Republik' } };
const landNaam = (l, t) => l.catalog ? '' : l.land ? ((LAND[l.land] || {})[t] || countryName(l.land, t)) : '';
function lijstNaam(l, t) { const i = ingreepNaam(l, t), d = landNaam(l, t); return d ? i + ' ' + ({ en: 'in', nl: 'in', de: 'in' }[t]) + ' ' + d : i; }
const gem = x => x.e ? x.e.score : x.s.gem;
const nRev = x => x.e ? x.e.source_counts.reduce((a, s) => a + s.count, 0) : x.s.n;
function scoreTekst(x, R, t) {
  const tt = T[t];
  if (R.modus === 'score') return num(x.s.totaal, t) + ' ' + tt.pnt;
  return tt.ervPlat(num(x.e.score, t, 2), num(nRev(x), t, 0), x.e.platforms);
}
function kortRede(x, R, t) {
  const tt = T[t], g = gem(x), n = nRev(x);
  if (R.modus === 'score') return num(x.s.totaal, t) + ' ' + tt.pnt + ' ' + tt.ks + (g != null && n ? ', ' + num(g, t, 1) + ' ' + tt.van5 + ' ' + tt.uit + ' ' + num(n, t, 0) + ' ' + tt.reviews : '');
  return tt.erv + ' ' + scoreTekst(x, R, t);
}

// ---------- paginanamen ----------
const PV = (() => { const m = new Map(); for (const e of providerEntries()) m.set(e.list.id + '|' + e.provider.id, e); return m; })();
const kliniekSlug = (l, k, t) => { const e = PV.get(l.id + '|' + k.id); return e ? e.slugs[t] : ''; };
export const PAGINA = (() => { const m = {}; for (const e of providerEntries()) for (const t of TALEN) m[e.slugs[t]] = { soort: 'kliniek', id: e.list.id, k: e.provider.id, taal: t }; return m; })();
const zichtbaar = l => !l.noindex && rang(l.id).modus !== 'geen';
const lijstSlug = (l, t) => (l.slugs || {})[t] || (l.slugs || {}).en || '';

// ---------- bouwstenen ----------
function situaties(R, t) {
  const tt = T[t], top = R.rij.slice(0, 20); if (top.length < 2) return [];
  const eerste = top[0], rows = [['top', eerste]];
  const kies = (k, f) => { const x = top.find(f); if (x && x !== eerste && !rows.some(r => r[1] === x)) rows.push([k, x]); };
  const meest = top.filter(x => x.e && x.e.eligible).sort((a, b) => nRev(b) - nRev(a))[0]; if (meest && nRev(meest) > nRev(eerste) && meest !== eerste) rows.push(['meest', meest]);
  const kw = top.slice().sort((a, b) => b.s.kwal - a.s.kwal)[0]; if (kw && kw.s.kwal > eerste.s.kwal && !rows.some(r => r[1] === kw)) rows.push(['kwal', kw]);
  kies('arts', x => (x.k.openheid || {}).arts_opereert === 'ja');
  kies('prijs', x => !!(x.k.openheid || {}).prijs);
  return rows.length > 1 ? rows : [];
}
function waaromRegels(x, R, t) {
  const tt = T[t], s = x.s, k = x.k, sig = k.signalen || {}, o = k.openheid || {}, reg = R.l.registers || {}, l = [], geen = [], br = [];
  const add = (u, lbl) => { if (u && lbl && !br.some(b => b[0] === u || b[1] === lbl)) br.push([u, lbl]); };
  if (R.modus === 'ervaring') {
    for (const r of x.e.sources.included) { l.push(r.platform + ' ' + num(r.normalized, t, 2) + ' ' + tt.van5 + ' ' + tt.uit + ' ' + num(r.aantal, t, 0) + ' ' + tt.reviews); add(r.bron, r.platform); }
    return { l, geen, br };
  }
  const plast = R.l.methode === 'plastisch';
  const kw = plast ? [sig.board && (reg.board || 'board'), sig.vereniging && reg.vereniging, sig.regionaal && reg.regionaal, sig.asps && 'ASPS', sig.isaps && 'ISAPS'].filter(Boolean)
    : [sig.ishrs && 'ISHRS ' + sig.ishrs, sig.iahrs && 'IAHRS ' + sig.iahrs, sig.abhrs && 'ABHRS', sig.specialist && String(sig.specialist)].filter(Boolean);
  const LB = { board: reg.board || 'board', vereniging: reg.vereniging || '', regionaal: reg.regionaal || '', specialist: host(sig.specialist_bron) };
  ['ishrs', 'iahrs', 'abhrs', 'specialist', 'board', 'vereniging', 'regionaal', 'asps', 'isaps'].forEach(z => sig[z] && add(sig[z + '_bron'], LB[z] != null ? LB[z] : z.toUpperCase()));
  if (s.kwal) l.push(tt.cats.kwal + ': ' + num(s.kwal, t) + ' ' + tt.van + ' ' + METHODE.kwal + ' (' + kw.join(', ') + ')'); else geen.push(klein(tt.cats.kwal));
  const vg = plast ? [sig.acc === 'ja' && reg.acc, sig.jci && 'JCI'].filter(Boolean) : [sig.healthturkiye === 'ja' && 'HealthTurkiye', sig.jci && 'JCI'].filter(Boolean);
  ['acc', 'jci', 'healthturkiye'].forEach(z => sig[z] && add(sig[z + '_bron'], z === 'acc' ? (reg.acc || 'acc') : z.toUpperCase()));
  if (s.verg) l.push(tt.cats.verg + ': ' + num(s.verg, t) + ' ' + tt.van + ' ' + METHODE.verg + ' (' + vg.join(', ') + ')'); else geen.push(klein(tt.cats.verg));
  const rv = x.e && x.e.sources ? x.e.sources.included : [];
  rv.forEach(r => add(r.bron, r.platform));
  const vm = (k.vermeld || []).length; (k.vermeld || []).forEach(u => add(u, host(u)));
  if (s.erv) l.push(tt.cats.erv + ': ' + num(s.erv, t) + ' ' + tt.van + ' ' + METHODE.erv + ' (' + [rv.map(r => r.platform + ' ' + num(Number(String(r.score).replace(',', '.')), t, 1) + ' ' + tt.uit + ' ' + num(r.aantal, t, 0)).join(', '), vm ? tt.genoemd(vm) : ''].filter(Boolean).join('; ') + ')'); else geen.push(klein(tt.cats.erv));
  const op = [o.prijs && tt.prijsOp, o.arts_opereert === 'ja' ? tt.artsJa : o.arts_opereert === 'deels' ? tt.artsDeels : '', o.nazorg_status === 'verified' && o.nazorg_bron ? tt.nazorg : ''].filter(Boolean);
  add(o.prijs_bron, host(o.prijs_bron)); add(o.arts_bron, host(o.arts_bron));
  if (s.open) l.push(tt.cats.open + ': ' + num(s.open, t) + ' ' + tt.van + ' ' + METHODE.open + ' (' + op.join(', ') + ')'); else geen.push(klein(tt.cats.open));
  if (s.risico) { l.push(tt.cats.risico + ': ' + num(s.risico, t)); (k.risico || []).forEach(r => add(r.bron, host(r.bron))); }
  return { l, geen, br };
}
function waaromBlok(x, R, t, plek, open) {
  const tt = T[t], w = waaromRegels(x, R, t);
  return '<details class="why"' + (open ? ' open' : '') + '><summary>' + (open ? '' : esc(tt.waarom(plek)) + ' ') + esc(scoreTekst(x, R, t)) + '</summary><ul>' + w.l.map(z => '<li>' + esc(z) + '</li>').join('') + (w.geen.length ? '<li>' + esc(tt.geenP + ' ' + lijstZin(w.geen, t)) + '</li>' : '') + '</ul>' +
    (w.br.length ? '<p class="bron">' + esc(tt.bronnen) + ': ' + w.br.slice(0, 10).map(([u, lb]) => bronLink(u, lb)).join(', ') + '</p>' : '') + '</details>';
}
function badges(x, R, t) {
  const tt = T[t], b = [];
  const rv = (x.e && x.e.sources ? x.e.sources.included : []).map(r => r.platform + ' ' + num(r.normalized, t, 1) + ' (' + num(r.aantal, t, 0) + ')');
  b.push(...rv.slice(0, 3));
  if ((x.k.openheid || {}).arts_opereert === 'ja') b.push(tt.rij.arts);
  return b.length ? '<div class="mk-bd">' + b.map(z => '<span>' + esc(z) + '</span>').join('') + '</div>' : '';
}
function knoppen(b, R, x, t, opKliniek) {
  const tt = T[t], s = kliniekSlug(R.l, x.k, t), at = w => ' data-t="' + w + '" data-s="' + esc(R.l.id + '|' + x.k.id) + '"';
  const pg = !opKliniek && s ? '<a class="cta of" href="' + esc(link(b, s)) + '"' + at('kliniek') + '>' + esc(x.k.kind === 'doctor' ? tt.bekijkArts : tt.bekijk) + '</a>' : '';
  const web = x.k.site ? '<a class="cta' + (pg ? '' : ' of') + '" href="' + esc(x.k.site) + '" target="_blank" rel="noopener nofollow"' + at('web') + '>' + esc(tt.site) + ' ' + esc(host(x.k.site)) + '</a>' : '';
  return pg || web ? '<div class="kn">' + pg + web + '</div>' : '';
}
const isLand = (st, c) => !st || (c && TALEN.some(tl => countryName(c, tl) === st)) || /^(Nederland|United Kingdom|Verenigd Koninkrijk|UK)$/i.test(st);
const stadVan = x => isLand(x.k.stad, x.k.land) ? '' : x.k.stad;
const plaatsVan = (x, t) => [stadVan(x), x.k.land ? countryName(x.k.land, t) : ''].filter(Boolean).join(', ');
function lijstHtml(b, R, t) {
  const tt = T[t];
  const li = (x, i) => { const s = kliniekSlug(R.l, x.k, t), naam = s ? '<a href="' + esc(link(b, s)) + '">' + esc(x.k.naam) + '</a>' : esc(x.k.naam), c = conclusieTekst(R.l.id, x.k, t);
    return '<li id="k-' + esc(x.k.id) + '"' + (i >= 20 ? ' class="mk-rest"' : '') + '><span class="n">' + (i + 1) + '. ' + naam + '</span><span class="mk-sc"><b>' + esc(R.modus === 'score' ? num(x.s.totaal, t) : num(x.e.score, t, 2)) + '</b> ' + esc(R.modus === 'score' ? tt.pnt + ' ' + tt.ks : tt.van5 + ' ' + tt.erv) + '</span>' +
      (plaatsVan(x, t) ? '<span class="w">' + esc(plaatsVan(x, t)) + '</span>' : '') + badges(x, R, t) + (i < 20 && c ? '<span class="w">' + esc(c) + '</span>' : '') + knoppen(b, R, x, t) + waaromBlok(x, R, t, i + 1) + '</li>'; };
  return '<ul class="zaken" id="zl">' + R.rij.map(li).join('') + '</ul>';
}
function antwoord(R, t) {
  const tt = T[t], x = R.rij[0]; if (!x) return null;
  const st = stadVan(x), zin = tt.eerste(x.k.naam + (st ? ' ' + tt.inLand + ' ' + st : ''), kortRede(x, R, t));
  const sit = situaties(R, t).slice(1, 3).map(([k, y]) => tt.kies(y.k.naam, tt.kiesW[k])).join(' ');
  return { zin, na: sit, kort: zin + (sit ? ' ' + sit : '') };
}
function methodeHtml(R, t) {
  const tt = T[t];
  if (R.modus === 'ervaring') return '<p>' + esc(tt.ervUitleg(REVIEW_POLICY)) + '</p>';
  const rows = [[tt.cats.kwal, METHODE.kwal], [tt.cats.verg, METHODE.verg], [tt.cats.erv, METHODE.erv], [tt.cats.open, METHODE.open], [tt.cats.risico, METHODE.risico]];
  return '<table class="wt"><thead><tr><th>' + esc({ en: 'What we measure', nl: 'Wat we meten', de: 'Was wir messen' }[t]) + '</th><th>' + esc(tt.pnt) + '</th></tr></thead><tbody>' + rows.map(([a, p]) => '<tr><td>' + esc(a) + '</td><td>' + esc(num(p, t)) + '</td></tr>').join('') + '</tbody></table><p>' + esc(tt.methodeEind) + '</p>';
}
function faqLijst(R, t) {
  const tt = T[t], l = R.l, a = antwoord(R, t), f = [], tx = (l.tekst || {})[t] || {};
  for (const q of dentalSearchQuestions(l.ingreep, t)) f.push(q);
  if (a) f.push({ q: tt.qBeste(ingreepNaam(l, t), landNaam(l, t)), a: a.kort + (R.rij.length > 1 ? ' ' + tt.daarna + ': ' + lijstZin(R.rij.slice(1, 4).map(x => x.k.naam), t) + '.' : '') });
  for (const q of (tx.faq || [])) if (q && q.q && q.a && !/^(wat is de beste|what is the best|welche klinik ist die beste|was ist die beste)/i.test(q.q)) f.push({ q: q.q, a: q.a });
  if (!f.some(x => /rangschik|rank|ordnen|gerangschikt/i.test(x.q))) f.push({ q: tt.qRang, a: R.modus === 'score' ? tt.methodeEind.replace(/^[^.]*\.\s*/, '') + ' ' + [tt.cats.kwal, tt.cats.verg, tt.cats.erv, tt.cats.open].map((c, i) => c + ' ' + [METHODE.kwal, METHODE.verg, METHODE.erv, METHODE.open][i]).join(', ') + ', ' + tt.cats.risico + ' ' + METHODE.risico + '.' : tt.ervUitleg(REVIEW_POLICY) });
  f.push({ q: tt.qMed, a: tt.aMed });
  return f.filter((x, i, s) => s.findIndex(y => y.q === x.q) === i).slice(0, 10);
}
const faqHtml = (f, t) => f.map(x => '<details class="faq"><summary>' + esc(x.q) + '</summary><p>' + esc(x.a) + (x.source ? ' <a href="' + esc(x.source) + '" target="_blank" rel="noopener nofollow">' + esc({ en: 'Source', nl: 'Bron', de: 'Quelle' }[t]) + '</a>' : '') + '</p></details>').join('');
const faqLd = f => ({ '@type': 'FAQPage', mainEntity: f.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) });
function volgende(b, t, nietId, groep) {
  const tt = T[t], ls = Object.values(LIJSTEN).filter(l => l.id !== nietId && zichtbaar(l));
  const g = id => (PROCEDURES.find(p => p.id === LIJSTEN[id].ingreep) || {}).group;
  ls.sort((a, b2) => (g(b2.id) === groep) - (g(a.id) === groep) || (!!a.catalog - !!b2.catalog) || rang(b2.id).rij.length - rang(a.id).rij.length);
  const items = ls.slice(0, 8).map(l => ovRegel(link(b, lijstSlug(l, t)), titelVan(l, t)));
  return items.length >= 3 ? '<h2>' + esc(tt.volg) + '</h2><nav class="ov-rs" aria-label="' + esc(tt.volg) + '">' + items.join('') + '</nav>' : '';
}
function titelVan(l, t) { const R = rang(l.id); return T[t].procTitle(lijstNaam(l, t), R.n).replace(/ 2026:.*$/, ''); }
function chat(t, slug, term, faq) { return kzuxBlok({ alleenChat: true, kop: T[t].chatKop, taal: KZ[t], site: 'kzux' + KZ[t], slug, term, shop: '', prods: [], opties: [], faq, geenGeheugen: true }); }
const ORG = { '@type': 'Organization', '@id': 'https://keuzehulp.best/#org', name: 'keuzehulp.best', url: 'https://keuzehulp.best/' };
const kruimLd = l => ({ '@type': 'BreadcrumbList', itemListElement: l.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u })) });
const CH_CSS = '.ov-eb{display:block;margin:18px 0 6px!important}.meta{font-size:16px;margin:0 0 12px}.answer{padding:12px 16px!important;margin:12px 0 16px!important}.kz-meta .kx-vb{margin-left:10px}.answer p{margin:0 0 6px;font-size:18px;line-height:1.55}.answer p+p{font-size:16px}.ov-rs{display:grid;gap:8px;margin:8px 0 20px}.zaken li.mk-rest .why{display:none}.talen{display:flex;gap:10px}.talen a[aria-current]{font-weight:700;text-decoration:none}.ingr{columns:2 220px;padding-left:18px}.ingr li{break-inside:avoid;margin:0 0 4px}.ook li{margin:0 0 6px}';
function doc({ taal, slug, titel, desc, body, ld, alts, noindex, tel }) {
  const hl = alts && alts.length > 1 ? alts.map(([s, tl]) => '<link rel="alternate" hreflang="' + tl + '" href="' + esc(canon(s)) + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + esc(canon((alts.find(a => a[1] === 'en') || alts[0])[0])) + '">' : '';
  const talen = TALEN.map(tl => { const a = (alts || []).find(x => x[1] === tl), s = a ? a[0] : hubSlug(tl); return '<a href="' + esc(canon(s)) + '" hreflang="' + tl + '"' + (tl === taal ? ' aria-current="page"' : '') + '>' + tl.toUpperCase() + '</a>'; }).join('');
  return '<!doctype html><html lang="' + taal + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>' + esc(titel) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + esc(canon(slug)) + '">' + hl +
    (noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-snippet:-1">') + '<link rel="icon" href="data:,"><style>' + RCSS + MK_CSS + CH_CSS + '</style><script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script></head><body class="mk">' +
    '<header class="topbar"><div class="wrap"><a class="mark" href="https://keuzehulp.best/">keuzehulp</a><nav class="topnav"><a href="' + esc(canon(hubSlug(taal))) + '">' + esc(T[taal].chir) + '</a>' + talen + '</nav></div></header><main><div class="wrap">' + body + '</div></main><footer></footer>' + (tel || '') + '</body></html>';
}
const bijgewerkt = (iso, t) => '<p class="kz-meta meta">' + esc(T[t].upd) + ' <time datetime="' + esc(String(iso).slice(0, 10)) + '">' + esc(datum(iso, t)) + '</time></p>';
const kruimHtml = (t, l) => '<p class="crumbs"><a href="' + (t === 'nl' ? 'https://keuzehulp.best/keuzehulp' : 'https://keuzehulp.best/') + '">' + esc(T[t].kruim) + '</a> › ' + l.map(([n, u], i) => i === l.length - 1 ? esc(n) : '<a href="' + esc(u) + '">' + esc(n) + '</a>').join(' › ') + '</p>';
const kort = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s\S*$/, '') + '…'; };

// ---------- ranglijst ----------
export function lijstPagina(b, id, t, o = {}) {
  const R = rang(id); if (!R) return null; const l = R.l, tt = T[t], slug = lijstSlug(l, t), a = antwoord(R, t), faq = faqLijst(R, t), tx = (l.tekst || {})[t] || {};
  const naam = lijstNaam(l, t), h1 = l.catalog ? tt.procH1(naam) : tt.landH1(naam, R.arts), groep = (PROCEDURES.find(p => p.id === l.ingreep) || {}).group;
  const sit = situaties(R, t), top = R.rij.slice(0, 3);
  const lead = l.catalog ? tt.hubLead.replace(/^[^:]*:/, (tt.nKl(R.n, R.arts) + ' ' + ({ en: 'compared on public data:', nl: 'vergeleken op openbare data:', de: 'anhand öffentlicher Daten verglichen:' }[t]))) : (tx.desc || tt.hubLead);
  let body = kruimHtml(t, [[tt.chir, canon(hubSlug(t))], [naam, canon(slug)]]) + '<span class="ov-eb">' + esc(tt.eb) + '</span><h1>' + esc(h1) + '</h1>' + bijgewerkt([l.gecontroleerd, RENDER_UPDATED].sort().at(-1), t) + '<p class="lead">' + esc(lead) + '</p>';
  body += dentalClusterLinks(l.ingreep, t, b);
  if (a) body += '<div class="answer lead"><p><strong>' + esc(a.zin) + '</strong></p>' + (a.na ? '<p>' + esc(a.na) + '</p>' : '') + '</div>';
  if (top.length) body += '<ol class="top3 lead">' + top.map((x, i) => { const s = kliniekSlug(l, x.k, t); return '<li><span class="n">' + (i + 1) + '. ' + (s ? '<a href="' + esc(link(b, s)) + '">' + esc(x.k.naam) + '</a>' : esc(x.k.naam)) + '</span><span class="mk-sc"><b>' + esc(R.modus === 'score' ? num(x.s.totaal, t) : num(x.e.score, t, 2)) + '</b> ' + esc(R.modus === 'score' ? tt.pnt : tt.van5) + '</span>' + badges(x, R, t) + knoppen(b, R, x, t) + '</li>'; }).join('') + '</ol>';
  body += chat(t, 'chirurgie-' + id, naam, faq);
  if (R.rij.length) body += '<h2>' + esc(tt.alle(R.rij.length, R.arts)) + '</h2>' + lijstHtml(b, R, t);
  if (sit.length) body += '<h2>' + esc(tt.sitH) + '</h2><table class="wt"><thead><tr><th>' + esc(tt.sit) + '</th><th>' + esc(tt.keus) + '</th><th>' + esc(tt.waaromK) + '</th></tr></thead><tbody>' + sit.map(([k, x]) => '<tr><td>' + esc(tt.rij[k]) + '</td><td><a href="#k-' + esc(x.k.id) + '">' + esc(x.k.naam) + '</a></td><td>' + esc(kortRede(x, R, t)) + '</td></tr>').join('') + '</tbody></table>';
  if (R.rest.length) body += '<h2>' + esc(tt.ook) + '</h2><p>' + esc(tt.ookP) + '</p><ul class="ook">' + R.rest.map(x => { const s = kliniekSlug(l, x.k, t); return '<li id="k-' + esc(x.k.id) + '">' + (s ? '<a href="' + esc(link(b, s)) + '">' + esc(x.k.naam) + '</a>' : esc(x.k.naam)) + (plaatsVan(x, t) ? ', ' + esc(plaatsVan(x, t)) : '') + '</li>'; }).join('') + '</ul>';
  body += '<h2 id="methode">' + esc(tt.zo) + '</h2>' + methodeHtml(R, t) + '<p>' + esc(tt.medisch) + '</p>';
  body += '<h2>' + esc(tt.vragen) + '</h2>' + faqHtml(faq, t) + volgende(b, t, id, groep) + (o.aanmeld || '');
  const alts = Object.entries(l.slugs || {}).map(([tl, s]) => [s, tl]);
  const ld = { '@context': 'https://schema.org', '@graph': [ORG,
    { '@type': 'CollectionPage', '@id': canon(slug), url: canon(slug), name: h1, inLanguage: t, dateModified: [l.gecontroleerd, RENDER_UPDATED].sort().at(-1), publisher: { '@id': ORG['@id'] } },
    { '@type': 'ItemList', name: h1, itemListOrder: 'https://schema.org/ItemListOrderDescending', numberOfItems: R.rij.length, itemListElement: R.rij.slice(0, 50).map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': x.k.kind === 'doctor' ? 'Physician' : 'MedicalClinic', name: x.k.naam, ...(x.k.site ? { url: x.k.site } : {}), ...(x.k.stad || x.k.land ? { address: { '@type': 'PostalAddress', ...(x.k.stad && x.k.stad !== 'Nederland' ? { addressLocality: x.k.stad } : {}), ...(x.k.land || l.land ? { addressCountry: x.k.land || l.land } : {}) } } : {}) } })) },
    kruimLd([[tt.chir, canon(hubSlug(t))], [naam, canon(slug)]]), faqLd(faq)] };
  const titel = tt.procTitle(naam, R.n);
  const desc = kort(a ? a.zin + ' ' + tt.nKl(R.n, R.arts) + ', ' + ({ en: 'every number with a source.', nl: 'elk getal met bron.', de: 'jede Zahl mit Quelle.' }[t]) : lead, 155);
  return doc({ taal: t, slug, titel: kort(titel, 62), desc, body, ld, alts, noindex: !zichtbaar(l), tel: o.tel });
}

// ---------- kliniek ----------
export function kliniekPagina(b, info, o = {}) {
  const t = info.taal, tt = T[t], R = rang(info.id); if (!R) return null; const l = R.l;
  const i = R.rij.findIndex(x => x.k.id === info.k), x = i >= 0 ? R.rij[i] : R.rest.find(z => z.k.id === info.k); if (!x) return null;
  const k = x.k, slug = kliniekSlug(l, k, t), naam = lijstNaam(l, t), ls = lijstSlug(l, t), plek = i + 1, c = conclusieTekst(l.id, k, t), p = plaatsVan(x, t);
  const prijs = veldTekst(l.id, k.id, 'prijs', t), wie = veldTekst(l.id, k.id, 'arts', t), gar = veldTekst(l.id, k.id, 'gar', t);
  const faq = [];
  faq.push({ q: tt.qGoed(k.naam), a: (i >= 0 ? tt.opPlek(plek, R.rij.length, naam) + ', ' + kortRede(x, R, t) + '. ' : '') + (c || '') });
  if (wie || (k.artsen || []).length) faq.push({ q: tt.qWie(k.naam), a: [wie, (k.artsen || []).length ? tt.artsen + ': ' + k.artsen.map(z => (/^dr\b/i.test(z.titel || '') && !/^dr\b/i.test(z.naam) ? 'Dr. ' : '') + z.naam).join(', ') + '.' : ''].filter(Boolean).join(' ') });
  if (prijs) faq.push({ q: tt.qKost(k.naam), a: prijs });
  const rv = x.e && x.e.sources ? x.e.sources.included : [];
  if (rv.length) faq.push({ q: tt.qRev(k.naam), a: rv.map(r => r.platform + ' ' + num(Number(String(r.score).replace(',', '.')), t, 1) + (Number(r.max) && Number(r.max) !== 5 ? '/' + r.max : ' ' + tt.van5) + ' ' + tt.uit + ' ' + num(r.aantal, t, 0) + ' ' + tt.reviews + (r.datum ? ' (' + datum(r.datum, t) + ')' : '')).join(', ') + '.' });
  faq.push({ q: tt.qMed, a: tt.aMed });
  let body = kruimHtml(t, [[tt.chir, canon(hubSlug(t))], [naam, canon(ls)], [k.naam, canon(slug)]]) + '<span class="ov-eb">' + esc(tt.eb) + '</span><h1>' + esc(k.naam) + '</h1>' + bijgewerkt([k.checked_at || '', l.gecontroleerd || '', RENDER_UPDATED].sort().at(-1), t) +
    '<div class="lead mk-kop">' + (p ? '<p>' + esc(p) + '</p>' : '') + (i >= 0 ? '<p class="mk-sc"><b>' + esc(R.modus === 'score' ? num(x.s.totaal, t) : num(x.e.score, t, 2)) + '</b> ' + esc(R.modus === 'score' ? tt.pnt + ' ' + tt.ks : tt.van5 + ' ' + tt.erv) + '</p>' : '') + (i >= 0 ? badges(x, R, t) : '') + knoppen(b, R, x, t, true) + '</div>';
  if (i >= 0 || c) body += '<div class="answer lead">' + (i >= 0 ? '<p><strong>' + esc(tt.opPlek(plek, R.rij.length, naam) + ', ' + kortRede(x, R, t) + '.') + '</strong></p>' : '') + (c ? '<p>' + esc(c) + '</p>' : '') + '</div>';
  body += chat(t, 'chirurgie-' + l.id + '-' + k.id, k.naam, faq);
  if (i >= 0) body += '<h2>' + esc(tt.waarom(plek)) + '</h2>' + waaromBlok(x, R, t, plek, true);
  if ((k.artsen || []).length) body += '<h2>' + esc(tt.artsen) + '</h2><ul class="feit">' + k.artsen.map(z => '<li>' + bronLink(z.bron, (/^dr\b/i.test(z.titel || '') && !/^dr\b/i.test(z.naam) ? 'Dr. ' : '') + z.naam) + '</li>').join('') + '</ul>' + (wie ? '<p>' + esc(wie) + '</p>' : '');
  if (rv.length) body += '<h2>' + esc(tt.revH) + '</h2><ul class="feit">' + rv.map(r => '<li>' + bronLink(r.bron, r.platform) + ': ' + esc(num(Number(String(r.score).replace(',', '.')), t, 1) + (Number(r.max) && Number(r.max) !== 5 ? '/' + r.max : ' ' + tt.van5) + ' ' + tt.uit + ' ' + num(r.aantal, t, 0) + ' ' + tt.reviews + (waarschuwingTekst(r.waarschuwing, t) ? '. ' + waarschuwingTekst(r.waarschuwing, t) : '')) + '</li>').join('') + '</ul>';
  if (prijs) body += '<h2>' + esc(tt.prijsH) + '</h2><p>' + esc(prijs) + '</p>' + ((k.openheid || {}).prijs_bron ? '<p class="bron">' + esc(tt.bronnen) + ': ' + bronLink(k.openheid.prijs_bron, host(k.openheid.prijs_bron)) + '</p>' : '');
  if (gar) body += '<p>' + esc(gar) + '</p>';
  const ris = (k.risico || []).map((r, j) => ({ r, w: veldTekst(l.id, k.id, 'risico:' + j, t) })).filter(z => z.w);
  if (ris.length) body += '<h2>' + esc(tt.risH) + '</h2><ul class="feit">' + ris.map(z => '<li>' + esc(z.w) + (z.r.datum ? ' (' + esc(datum(z.r.datum, t)) + ')' : '') + ' ' + bronLink(z.r.bron, host(z.r.bron)) + '</li>').join('') + '</ul>';
  const buren = i >= 0 ? R.rij.filter(z => z !== x).map((z, j) => ({ z, d: Math.abs(R.rij.indexOf(z) - i) })).sort((a2, b2) => a2.d - b2.d).slice(0, 4).sort((a2, b2) => R.rij.indexOf(a2.z) - R.rij.indexOf(b2.z)) : R.rij.slice(0, 4).map(z => ({ z }));
  if (buren.length) body += '<h2>' + esc(tt.anderH) + '</h2><ul class="zaken">' + buren.map(({ z }) => { const s = kliniekSlug(l, z.k, t); return '<li><span class="n">' + (R.rij.indexOf(z) + 1) + '. ' + (s ? '<a href="' + esc(link(b, s)) + '">' + esc(z.k.naam) + '</a>' : esc(z.k.naam)) + '</span><span class="w">' + esc(kortRede(z, R, t)) + '</span></li>'; }).join('') + '</ul><p class="rel"><a href="' + esc(link(b, ls)) + '">' + esc(tt.alle(R.rij.length, R.arts)) + '</a></p>';
  body += '<h2>' + esc(tt.vragen) + '</h2>' + faqHtml(faq, t) + '<p class="rel">' + esc(tt.eigenaar) + '</p>' + volgende(b, t, '', (PROCEDURES.find(z => z.id === l.ingreep) || {}).group) + (o.aanmeld || '');
  const e = PV.get(l.id + '|' + k.id), alts = e ? TALEN.map(tl => [e.slugs[tl], tl]) : null;
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: canon(slug), name: k.naam, inLanguage: t, dateModified: [k.checked_at || '', l.gecontroleerd || '', RENDER_UPDATED].sort().at(-1), publisher: { '@id': ORG['@id'] } },
    { '@type': k.kind === 'doctor' ? 'Physician' : 'MedicalClinic', name: k.naam, ...(k.site ? { url: k.site } : {}), ...(k.land || l.land ? { address: { '@type': 'PostalAddress', ...(k.stad && k.stad !== 'Nederland' ? { addressLocality: k.stad } : {}), addressCountry: k.land || l.land } } : {}) },
    kruimLd([[tt.chir, canon(hubSlug(t))], [naam, canon(ls)], [k.naam, canon(slug)]]), faqLd(faq)] };
  const titel = kort(k.naam + (i >= 0 ? ', ' + tt.opPlek(plek, R.rij.length, '').replace(/ (in|van|von|of)\s*$/, '').toLowerCase() : '') + ' | ' + ingreepNaam(l, t), 66);
  return doc({ taal: t, slug, titel, desc: kort((i >= 0 ? tt.opPlek(plek, R.rij.length, naam) + ', ' + kortRede(x, R, t) + '. ' : '') + (c || ''), 155), body, ld, alts, noindex: l.noindex, tel: o.tel });
}

// ---------- startpagina ----------
export function hubPagina(b, t, o = {}) {
  const tt = T[t], slug = hubSlug(t), land = Object.values(LIJSTEN).filter(l => !l.catalog && zichtbaar(l)), proc = Object.values(LIJSTEN).filter(l => l.catalog);
  const tops = land.map(l => ({ l, R: rang(l.id) })).filter(z => z.R.rij.length).sort((a, b2) => (b2.l.id === 'hair-turkey') - (a.l.id === 'hair-turkey') || b2.R.n - a.R.n);
  const hoofd = tops[0], a = hoofd ? antwoord(hoofd.R, t) : null, laatst = [...Object.values(LIJSTEN).map(l => l.gecontroleerd || ''), RENDER_UPDATED].sort().pop();
  const totKl = new Set(Object.values(LIJSTEN).flatMap(l => (l.klinieken || []).filter(k => k.kind !== 'doctor').map(k => k.naam))).size;
  const faq = [];
  if (a) faq.push({ q: tt.qBeste(ingreepNaam(hoofd.l, t), landNaam(hoofd.l, t)), a: a.kort });
  for (const z of tops.slice(1)) { const a2 = antwoord(z.R, t); if (a2) faq.push({ q: tt.qBeste(ingreepNaam(z.l, t), landNaam(z.l, t)), a: a2.zin }); }
  faq.push({ q: tt.qRang, a: [tt.cats.kwal, tt.cats.verg, tt.cats.erv, tt.cats.open].map((c, i) => c + ' ' + [METHODE.kwal, METHODE.verg, METHODE.erv, METHODE.open][i]).join(', ') + ', ' + tt.cats.risico + ' ' + METHODE.risico + '. ' + tt.methodeEind });
  faq.push({ q: tt.qMed, a: tt.aMed });
  let body = kruimHtml(t, [[tt.chir, canon(slug)]]) + '<span class="ov-eb">' + esc(tt.eb) + '</span><h1>' + esc(tt.hubH1) + '</h1>' + bijgewerkt(laatst, t) + '<p class="lead">' + esc(tt.hubLead) + '</p>';
  if (a) body += '<div class="answer lead"><p><strong>' + esc(lijstNaam(hoofd.l, t) + '? ' + a.zin) + '</strong></p>' + (a.na ? '<p>' + esc(a.na) + '</p>' : '') + '<p><a href="' + esc(link(b, lijstSlug(hoofd.l, t))) + '">' + esc(tt.lijst) + '</a></p></div>';
  body += chat(t, 'chirurgie', ({ en: 'surgery', nl: 'chirurgie', de: 'Chirurgie' }[t]), faq.slice(0, 6));
  body += '<h2>' + esc(tt.landH) + '</h2><ul class="zaken">' + tops.map(({ l, R }) => { const x = R.rij[0]; return '<li><span class="n"><a href="' + esc(link(b, lijstSlug(l, t))) + '">' + esc(lijstNaam(l, t)) + '</a></span><span class="w">' + esc(tt.nKl(R.n, R.arts)) + ' · ' + esc(tt.keus) + ': ' + esc(x.k.naam) + ', ' + esc(kortRede(x, R, t)) + '</span><div class="kn"><a class="cta of" href="' + esc(link(b, lijstSlug(l, t))) + '">' + esc(tt.lijst) + '</a></div></li>'; }).join('') + '</ul>';
  const groepen = [...new Set(PROCEDURES.map(p => p.group))];
  body += '<h2 id="ingrepen">' + esc(tt.ingrH) + '</h2>' + groepen.map(g => { const ps = proc.filter(l => (PROCEDURES.find(p => p.id === l.ingreep) || {}).group === g && zichtbaar(l)); return ps.length ? '<h3>' + esc(tt.groep[g] || g) + '</h3><ul class="ingr">' + ps.map(l => '<li><a href="' + esc(link(b, lijstSlug(l, t))) + '">' + esc(ingreepNaam(l, t)) + '</a> (' + esc(tt.nKl(rang(l.id).n, rang(l.id).arts)) + ')</li>').join('') + '</ul>' : ''; }).join('');
  body += '<h2 id="methode">' + esc(tt.zo) + '</h2>' + methodeHtml({ modus: 'score' }, t) + '<p>' + esc(tt.ervHub) + '</p><p>' + esc(tt.medisch) + '</p>';
  body += '<h2>' + esc(tt.vragen) + '</h2>' + faqHtml(faq, t) + (o.meer || '') + (t === 'nl' ? '<h2>' + esc(tt.volg) + '</h2><nav class="ov-rs">' + [['https://keuzehulp.best/zorgverzekering', 'Zorgverzekering kiezen'], ['https://keuzehulp.best/rotterdam/tandarts', 'Tandarts in Rotterdam'], ['https://keuzehulp.best/rotterdam/fysiotherapeut', 'Fysiotherapeut in Rotterdam'], ['https://keuzehulp.best/advocaat', 'Advocaat kiezen']].map(([u, n]) => ovRegel(u, n)).join('') + '</nav>' : '') + (o.aanmeld || '');
  const alts = TALEN.map(tl => [hubSlug(tl), tl]);
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'CollectionPage', url: canon(slug), name: tt.hubH1, inLanguage: t, dateModified: laatst, publisher: { '@id': ORG['@id'] } }, kruimLd([[tt.chir, canon(slug)]]), faqLd(faq)] };
  return doc({ taal: t, slug, titel: tt.hubTitle, desc: kort(tt.nKl(totKl, true) + '. ' + (a ? lijstNaam(hoofd.l, t) + '? ' + a.zin : tt.hubLead), 155), body, ld, alts, tel: o.tel });
}

// ---------- router: geeft HTML of null (dan doet lib/tsc.js de pagina) ----------
export const PROC_INDEX = { procedures: 'en', 'nl/ingrepen': 'nl', 'de/behandlungen': 'de' };
export function pagina(b, p, o = {}) {
  if (p === '' || p === 'nl' || p === 'de') return hubPagina(b, p || 'en', o);
  if (RANK_SLUGS[p]) return lijstPagina(b, RANK_SLUGS[p].id, RANK_SLUGS[p].taal, o);
  if (PAGINA[p]) return kliniekPagina(b, PAGINA[p], o);
  return null;
}
export const urls = () => TALEN.map(hubSlug).concat(Object.keys(RANK_SLUGS).filter(s => zichtbaar(LIJSTEN[RANK_SLUGS[s].id])), Object.keys(PAGINA).filter(s => !LIJSTEN[PAGINA[s].id].noindex));

// ---------- kennis voor de chat (lib/kzchat.js alle): elke ranglijst en kliniek als item, per site ----------
export function chatItems(site) {
  const t = site === 'us' ? 'en' : site === 'de' ? 'de' : 'nl', tt = T[t], uit = [];
  for (const l of Object.values(LIJSTEN)) { const R = rang(l.id); if (!R || !zichtbaar(l)) continue;
    const a = antwoord(R, t), naam = lijstNaam(l, t);
    uit.push({ slug: 'chirurgie-' + l.id, pad: canon(lijstSlug(l, t)), term: naam, title: titelVan(l, t), kort: a ? a.kort : '', uitleg: R.rij.slice(0, 15).map((x, i) => (i + 1) + '. ' + x.k.naam + (plaatsVan(x, t) ? ' (' + plaatsVan(x, t) + ')' : '') + ': ' + kortRede(x, R, t) + (conclusieTekst(l.id, x.k, t) ? '. ' + conclusieTekst(l.id, x.k, t) : '')).join(' | ') + ' | ' + (R.modus === 'score' ? tt.methodeEind : tt.ervUitleg(REVIEW_POLICY)), faq: faqLijst(R, t) });
    for (const x of R.rij) { const s = kliniekSlug(l, x.k, t); if (!s) continue; const c = conclusieTekst(l.id, x.k, t), prijs = veldTekst(l.id, x.k.id, 'prijs', t), wie = veldTekst(l.id, x.k.id, 'arts', t);
      uit.push({ slug: 'chirurgie-' + l.id + '-' + x.k.id, pad: canon(s), term: x.k.naam, title: x.k.naam, kort: tt.opPlek(R.rij.indexOf(x) + 1, R.rij.length, naam) + ', ' + kortRede(x, R, t) + '. ' + c, uitleg: [waaromRegels(x, R, t).l.join('; '), prijs, wie].filter(Boolean).join(' | '), faq: [] }); }
  }
  const zb = x => String(x || '').replace(/\s*\[[a-zA-Z0-9]+\]/g, '');
  for (const [s, pg] of Object.entries(PAGES)) if ((pg.taal || 'en') === t) uit.push({ slug: chatSlug(s), pad: canon(s), term: pg.h1, title: pg.h1, kort: zb(pg.kort), uitleg: (pg.secties || []).map(x => x.h + ': ' + (x.p || []).concat(x.l || []).map(zb).join(' ')).join(' | ').slice(0, 2600), faq: pg.faq || [] });
  const tops = Object.values(LIJSTEN).filter(l => !l.catalog && zichtbaar(l));
  uit.push({ slug: 'chirurgie', pad: canon(hubSlug(t)), term: { en: 'surgery', nl: 'chirurgie', de: 'Chirurgie' }[t], title: tt.hubTitle, kort: tt.hubLead, uitleg: tops.map(l => { const a = antwoord(rang(l.id), t); return lijstNaam(l, t) + ': ' + (a ? a.zin : ''); }).join(' | '), faq: [] });
  return uit;
}

export const chatSlug = p => 'chirurgie-pg-' + String(p || 'start').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
// De chat op de overige pagina's van chirurgie (artikelen, tandartsgids, controle van een chirurg): dezelfde chat als op alle keuzehulpen.
export function chatVoor(p, taal, term, faq) { const t = TALEN.includes(taal) ? taal : 'en'; return chat(t, chatSlug(p), term || T[t].chir.toLowerCase(), (faq || []).filter(f => f && f.q && f.a).map(f => ({ q: f.q, a: f.a }))); }
