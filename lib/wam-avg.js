// Dossier AVG-inzage (Henkjan 26 nov 2026: "Ja maak dat dossier met demand radar en geef aan wat je rechten zijn en waarom verwijs naar bits en dergelijk").
// Zoekvraag: Demand Radar thema wam-avg (NL, gemeten 26 nov 2026). Rechten: AVG-tekst op EUR-Lex en art. 35 UAVG zoals de rechtspraak hem citeert.
// Actie: dezelfde chat als de landendossiers (INTL_JS in lib/wam-intl.js): vragen vullen de brief, daarna mailt de lezer hem naar zichzelf.
import { INTL_JS } from './wam-intl.js';

const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const AVG = 'https://eur-lex.europa.eu/legal-content/NL/TXT/HTML/?uri=CELEX:32016R0679';

export const AVG_PAD = 'inzageverzoek';
export const AVG_DOSSIER = {
  bijgewerkt: '2026-11-26',
  seo: 'Inzageverzoek AVG: vraag op wat een bedrijf van je weet, ook na een datalek | WAM',
  titel: 'Wat weet een bedrijf van jou? Vraag het op.',
  kort: 'Na een datalek, bij ongevraagde telefoontjes of gewoon omdat je het wilt weten: elke organisatie moet je binnen een maand en gratis vertellen welke gegevens ze van je heeft.',
  zoek: { gemeten: '2026-11-26', tegels: [
    { getal: 49500, wat: 'zoekopdrachten per maand naar ‘datalek’', sub: '+517% in een jaar' },
    { getal: 9900, wat: 'naar ‘autoriteit persoonsgegevens’' },
    { getal: 5400, wat: 'naar ‘datalek odido’' },
    { getal: 13517, wat: 'klachten en tips bij de AP in 2025', sub: '+75% op 2024', bron: 'https://www.autoriteitpersoonsgegevens.nl/en/over-de-autoriteit-persoonsgegevens/feiten-en-cijfers' }] },
  actie: {
    kop: 'Vraag het op',
    tekst: 'Vijf korte vragen, dan staat je brief klaar. Stuur hem naar het privacyadres uit hun privacyverklaring; vanaf die dag loopt de maand.',
    brief: '[Je naam]\n[Je adres]\n[Je e-mailadres]\n\n[Datum]\n\nAan: [naam van de organisatie]\nBetreft: inzageverzoek op grond van artikel 15 AVG\n\nGeachte heer, mevrouw,\n\nIk vraag u op grond van artikel 15 van de Algemene verordening gegevensbescherming (AVG) om inzage in de persoonsgegevens die u over mij verwerkt. Ik ontvang graag:\n1. een kopie van deze persoonsgegevens;\n2. de doeleinden waarvoor u ze verwerkt;\n3. de categorieën persoonsgegevens;\n4. aan wie u ze heeft verstrekt of verstrekt, ook buiten de EU;\n5. hoe lang u ze bewaart, of de criteria daarvoor;\n6. waar u ze vandaan heeft, als u ze niet van mij kreeg;\n7. of u ze gebruikt voor geautomatiseerde besluitvorming of profilering.\n\nMijn klantnummer of kenmerk: [klantnummer of kenmerk]\n\nVolgens artikel 12, derde lid, AVG reageert u binnen een maand na ontvangst. Dit verzoek is kosteloos (artikel 12, vijfde lid, AVG). U kunt mij antwoorden op het e-mailadres hierboven.\n\nMet vriendelijke groet,\n[Je naam]',
    knop: 'Kopieer de brief',
    velden: [
      { v: '[naam van de organisatie]', q: 'Bij welk bedrijf of welke organisatie wil je je gegevens opvragen?' },
      { v: '[Je naam]', q: 'Wat is je volledige naam?' },
      { v: '[Je adres]', q: 'Wat is je adres? Niet verplicht; het helpt de organisatie je te vinden.', skip: true, weg: '[Je adres]\n' },
      { v: '[klantnummer of kenmerk]', q: 'Heb je een klantnummer of kenmerk? Bijvoorbeeld van een factuur of van de melding over een datalek.', skip: true, weg: 'Mijn klantnummer of kenmerk: [klantnummer of kenmerk]\n\n' },
      { v: '[Je e-mailadres]', q: 'Wat is je e-mailadres? Het komt in de brief, en je kunt de brief naar jezelf mailen.', email: true }] },
  rechten: [
    { wat: 'Inzage', art: 'art. 15 lid 1', tekst: 'Je hoort welke gegevens ze hebben, waarvoor, aan wie ze die gaven en hoe lang ze die bewaren. Pas dan weet je wat je kunt laten verbeteren of verwijderen.' },
    { wat: 'Een kopie', art: 'art. 15 lid 3', tekst: 'Je krijgt de gegevens zelf, elektronisch als je het elektronisch vraagt. Na een datalek zie je zo wat van jou erbij zat.' },
    { wat: 'Binnen een maand, gratis', art: 'art. 12 lid 3 en 5', tekst: 'Bij ingewikkelde of veel verzoeken mag het twee maanden langer, maar dat moeten ze binnen de maand laten weten. Na de termijn kun je verder.' },
    { wat: 'Verwijderen', art: 'art. 17 lid 1', tekst: 'Onder meer als de gegevens niet meer nodig zijn of onrechtmatig verwerkt zijn. Wat er niet meer is, kan niet meer lekken.' },
    { wat: 'Geen reclame meer', art: 'art. 21 lid 2 en 3', tekst: 'Bezwaar tegen direct marketing kan altijd; daarna mag het niet meer.' },
    { wat: 'Klagen of naar de rechter', art: 'art. 77 en 79 AVG, art. 35 UAVG', tekst: 'Klacht bij de AP, of een verzoekschrift bij de rechtbank. Na een antwoord heb je zes weken; kwam er geen antwoord op tijd, dan geldt die termijn niet.' },
    { wat: 'Schadevergoeding', art: 'art. 82 lid 1', tekst: 'Ook voor immateriële schade.' }],
  bronRechten: [
    { naam: 'AVG op EUR-Lex', url: AVG },
    { naam: 'AP: recht op inzage', url: 'https://www.autoriteitpersoonsgegevens.nl/themas/basis-avg/privacyrechten-avg/recht-op-inzage' },
    { naam: 'art. 35 UAVG, Hof Amsterdam', url: 'https://uitspraken.rechtspraak.nl/details?id=ECLI%3ANL%3AGHAMS%3A2022%3A2192' }],
  // Henkjan 26 nov 2026: "Zet top 10 bedrijven erbij die niet reageren". Niemand publiceert wie het vaakst niet antwoordt; dit zijn de tien
  // organisaties waarbij de AP, een andere Europese toezichthouder of een Nederlandse rechter iets vaststelde over hun omgang met een AVG-verzoek. Nieuwste eerst.
  tien: [
    { naam: 'Odido', jaar: '2026', tekst: 'Een klant vroeg op 2 maart inzage na de cyberaanval. Odido meldde pas op 11 april meer tijd nodig te hebben en antwoordde op 24 april.', bron: 'https://uitspraken.rechtspraak.nl/details?id=ECLI%3ANL%3ARBDHA%3A2026%3A20161', bronNaam: 'Rechtbank Den Haag' },
    { naam: 'DPG Media', jaar: '2025', tekst: 'Eiste eerst een kopie van je identiteitsbewijs voor inzage of verwijderen. Boete van de AP, door de Raad van State op 24 september 2025 vastgesteld op €262.500.', bron: 'https://www.autoriteitpersoonsgegevens.nl/documenten/boete-dpg-media-kopie-id-bij-inzageverzoek', bronNaam: 'AP' },
    { naam: 'Risepoint (Kindred)', jaar: '2025', tekst: 'Wees inzageverzoeken af en wilde weten waarom iemand inzage vroeg. De rechter: de AVG staat niet toe dat je een motivering eist.', bron: 'https://uitspraken.rechtspraak.nl/details?id=ECLI%3ANL%3ARBROT%3A2025%3A11474', bronNaam: 'Rechtbank Rotterdam' },
    { naam: 'Stripe', jaar: '2025', tekst: 'Moest volgens de rechter inzage geven in de concrete handelaar aan wie de gegevens van de verzoeker waren verstrekt.', bron: 'https://uitspraken.rechtspraak.nl/details?id=ECLI%3ANL%3ARBGEL%3A2025%3A1815', bronNaam: 'Rechtbank Gelderland' },
    { naam: 'Netflix', jaar: '2024', tekst: 'Gaf klanten die om inzage vroegen te weinig informatie over doelen, ontvangers en bewaartermijnen. Boete van €4,75 miljoen.', bron: 'https://www.autoriteitpersoonsgegevens.nl/en/documents/fine-netflix', bronNaam: 'AP' },
    { naam: 'Clearview AI', jaar: '2024', tekst: 'Reageerde niet op twee inzageverzoeken en liet de AP weten geen inzageverzoeken van EU-burgers meer te beoordelen.', bron: 'https://www.autoriteitpersoonsgegevens.nl/system/files?file=2024-09%2FBesluit+boete+en+lasten+onder+dwangsom+Clearview.pdf', bronNaam: 'AP' },
    { naam: 'Uber', jaar: '2023', tekst: 'Het hof beval Uber, op straffe van een dwangsom, inzageverzoeken van chauffeurs alsnog toe te wijzen.', bron: 'https://uitspraken.rechtspraak.nl/details?id=ECLI%3ANL%3APHR%3A2024%3A996', bronNaam: 'Hoge Raad, conclusie' },
    { naam: 'Michael Page', jaar: '2022', tekst: 'Eiste een volledige kopie van het identiteitsbewijs voor inzage. €240.000 boete in Spanje na een Nederlandse klacht.', bron: 'https://autoriteitpersoonsgegevens.nl/nl/nieuws/spaanse-boete-voor-recruiter-na-nederlandse-klacht', bronNaam: 'AP' },
    { naam: 'Locatefamily.com', jaar: '2021', tekst: 'Publiceert adressen en telefoonnummers; gegevens laten schrappen was niet eenvoudig zonder vertegenwoordiger in de EU. Boete van €525.000.', bron: 'https://www.autoriteitpersoonsgegevens.nl/documenten/boete-locatefamilycom', bronNaam: 'AP' },
    { naam: 'Theodoor Gilissen Bankiers', jaar: '2018', tekst: 'Gaf geen gehoor aan het inzageverzoek van een klant. De AP vorderde €48.000 dwangsom in.', bron: 'https://www.autoriteitpersoonsgegevens.nl/nl/nieuws/tgb-betaalt-dwangsom-na-niet-voldoen-aan-inzageverzoek', bronNaam: 'AP' }],
  helpers: [
    { wie: 'My Data Done Right (Bits of Freedom)', url: 'https://www.mydatadoneright.eu', wat: 'maakt het verzoek en zoekt het adres' },
    { wie: 'Consumentenbond', url: 'https://www.consumentenbond.nl/internet-privacy/een-inzageverzoek-doen-stap-voor-stap', wat: 'stap voor stap' },
    { wie: 'Juridisch Loket', url: 'https://www.juridischloket.nl/voorbeeldbrieven/Voorbeeldbrief-opvragen-persoonsgegevens/', wat: 'voorbeeldbrieven' },
    { wie: 'Autoriteit Persoonsgegevens', url: 'https://autoriteitpersoonsgegevens.nl/nl/zelf-doen/gebruik-uw-privacyrechten/klacht-melden-bij-de-ap', wat: 'klacht indienen' }],
  vragen: [
    { vraag: 'Hoe vraag ik op welke gegevens een bedrijf van mij heeft?', antwoord: 'Stuur een inzageverzoek op grond van artikel 15 AVG naar het privacyadres uit de privacyverklaring van de organisatie. Je hoeft geen reden te geven. Bovenaan deze pagina vult een korte chat de brief voor je in.' },
    { vraag: 'Hoe lang mag een organisatie doen over een inzageverzoek?', antwoord: 'Uiterlijk een maand na ontvangst (artikel 12, derde lid, AVG). Bij ingewikkelde of veel verzoeken mag dat met twee maanden worden verlengd.' },
    { vraag: 'Mag een bedrijf geld vragen voor een inzageverzoek?', antwoord: 'Nee, het verzoek is kosteloos. Alleen bij een kennelijk ongegrond of buitensporig verzoek mag een redelijke vergoeding worden gevraagd (artikel 12, vijfde lid, AVG). Voor extra kopieën mogen redelijke kosten worden gerekend.' },
    { vraag: 'Wat kan ik doen als een bedrijf niet reageert op mijn inzageverzoek?', antwoord: 'Stuur een herinnering. Daarna kun je een klacht indienen bij de Autoriteit Persoonsgegevens (artikel 77 AVG) of de rechtbank vragen het bedrijf te bevelen (artikel 35 UAVG). Antwoordde het bedrijf niet binnen de termijn, dan geldt voor de rechter geen termijn van zes weken.' },
    { vraag: 'Hoe weet ik welke gegevens van mij bij een datalek zijn gelekt?', antwoord: 'Vraag het de organisatie met een inzageverzoek. Een klant van Odido deed dat in maart 2026 na de cyberaanval en kreeg op 24 april antwoord.' }]
};

const getal = n => Number(n).toLocaleString('nl-NL');
const dag = d => new Date(d + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const CONSENT = 'WAM mag mij per e-mail informeren: elke week een open overzicht van wat er bereikt is, en bij nieuwe dossiers en bevestigde ontwikkelingen. Afmelden kan altijd.';

function chat(a, datum) {
  const cfg = { velden: a.velden, datum, onderwerp: 'Mijn inzageverzoek (AVG)', fout: 'Dat lijkt geen e-mailadres.', klaar: 'Je brief staat klaar. Mail hem naar jezelf en stuur hem door.', gevolgd: 'Je volgt dit dossier.', scope: 'algemeen', arm: 'avg' };
  return '<div class="intl-chat" data-chat="' + e(JSON.stringify(cfg)) + '"><div class="intl-chat-log" aria-live="polite"></div><form class="intl-chat-form composer"><label class="sr-only" for="intl-chat-in">Vul de brief in</label><input id="intl-chat-in" autocomplete="on"><button type="submit" class="primary">Volgende</button><button type="button" class="intl-chat-skip" hidden>Overslaan</button></form>' +
    '<pre class="intl-brief" id="brief" hidden>' + e(a.brief) + '</pre>' +
    '<div class="acts intl-chat-klaar" hidden><a class="btn primary intl-chat-mail" href="#">Mail hem naar mezelf</a><button type="button" data-kopieer="brief" data-ok="Gekopieerd">Kopieer</button><button type="button" class="intl-chat-volg">Volg dit dossier</button></div><p class="consent-note intl-chat-consent" hidden>' + e(CONSENT) + ' <a href="/privacy">Privacy</a>.</p><p class="meta">Je antwoorden blijven op je toestel.</p></div>';
}

export function avgPagina() {
  const D = AVG_DOSSIER, a = D.actie, url = 'https://wearemany.now/' + AVG_PAD, T = D.zoek.tegels;
  const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Curacao' });
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': url + '#dossier', headline: D.titel, description: D.kort, inLanguage: 'nl-NL', dateModified: D.bijgewerkt, author: { '@type': 'Organization', name: 'we are many now', url: 'https://wearemany.now/' }, citation: [...D.bronRechten.map(b => b.url), ...D.tien.map(t => t.bron)] },
    { '@type': 'ItemList', '@id': url + '#tien', name: 'Tien organisaties aangesproken op een AVG-verzoek', itemListElement: D.tien.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.naam, url: t.bron })) },
    { '@type': 'FAQPage', '@id': url + '#vragen', inLanguage: 'nl-NL', mainEntity: D.vragen.map(q => ({ '@type': 'Question', name: q.vraag, acceptedAnswer: { '@type': 'Answer', text: q.antwoord } })) }] };
  const body = '<main id="inhoud" class="strak"><p class="eyebrow">Dossier AVG · ' + e(dag(D.bijgewerkt)) + '</p><h1>' + e(D.titel) + '</h1><p>' + e(D.kort) + '</p>' +
    '<p class="meta">' + getal(T[0].getal) + ' mensen zoeken elke maand op ‘datalek’. De AP kreeg in 2025 ' + getal(T[3].getal) + ' klachten, de meeste over inzage en verwijderen (<a href="' + e(T[3].bron) + '" rel="noopener">AP</a>, Demand Radar).</p>' +
    '<section class="ikook" id="actie"><h2>' + e(a.kop) + '</h2><p>' + e(a.tekst) + '</p>' + chat(a, datum) + '</section>' +
    '<section id="tien"><h2>Tien organisaties die werden aangesproken</h2><p class="meta">Door de AP, een andere Europese toezichthouder of een rechter. Wie het vaakst niet antwoordt, publiceert niemand; nieuwste eerst.</p><ol class="kort-lijst">' + D.tien.map(t => '<li><b>' + e(t.naam) + '</b> · ' + e(t.jaar) + '. ' + e(t.tekst) + ' <a class="meta" href="' + e(t.bron) + '" rel="noopener">' + e(t.bronNaam) + '</a></li>').join('') + '</ol><p><a class="text-link" href="/start">Liet een organisatie jou wachten? Laat het meetellen</a></p></section>' +
    '<section id="rechten"><h2>Je rechten</h2><ul class="kort-lijst">' + D.rechten.map(r => '<li><b>' + e(r.wat) + '.</b> ' + e(r.tekst) + ' <span class="meta">' + e(r.art) + '</span></li>').join('') + '</ul><p class="meta">' + D.bronRechten.map(b => '<a href="' + e(b.url) + '" rel="noopener">' + e(b.naam) + '</a>').join(' · ') + '</p></section>' +
    '<section id="niet-reageren"><h2>Geen antwoord na een maand</h2><ol class="kort-lijst"><li>Stuur een herinnering.</li><li>Dien een klacht in bij de <a href="' + e(D.helpers[3].url) + '" rel="noopener">AP</a>.</li><li>Of vraag de rechtbank om een bevel (art. 35 UAVG).</li></ol><p class="meta">Hulp: ' + D.helpers.slice(0, 3).map(h => '<a href="' + e(h.url) + '" rel="noopener">' + e(h.wie) + '</a> ' + e(h.wat)).join(' · ') + '.</p></section>' +
    '<section id="vragen"><h2>Vragen</h2>' + D.vragen.map(q => '<details class="vraag-kort"><summary>' + e(q.vraag) + '</summary><p>' + e(q.antwoord) + '</p></details>').join('') + '</section>' +
    '<section class="volg" id="volgen"><h2>Volg dit dossier</h2><form class="intl-volg" data-scope="algemeen" data-arm="avg" data-ok="Je volgt dit dossier."><label class="sr-only" for="intl-email">E-mailadres</label><div class="composer"><input id="intl-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" placeholder="E-mailadres"><button type="submit" class="primary">Volg</button></div><label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="consent-note">' + e(CONSENT) + ' <a href="/privacy">Privacy</a>.</p></form><p class="msg" role="status"></p></section>' +
    '<p class="meta">we are many now is geen advocaat en geeft geen juridisch advies.</p>' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script></main>';
  return { pad: '/' + AVG_PAD, titel: D.seo, desc: 'Vraag binnen een maand en gratis op welke gegevens een organisatie van je heeft, ook na een datalek. Een brief die zich invult, je rechten, en tien organisaties die werden aangesproken op een AVG-verzoek.', body, script: INTL_JS, geenVolg: true };
}
