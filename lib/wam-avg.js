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
  kort: 'Na een datalek, bij telefoontjes van onbekende bedrijven of gewoon uit nieuwsgierigheid: elke organisatie moet je binnen een maand en gratis vertellen welke gegevens ze van je heeft. Hier staan je rechten, waarom ze ertoe doen, en wat er gebeurt als een organisatie niet antwoordt.',
  zoek: { gemeten: '2026-11-26', tegels: [
    { getal: 49500, wat: 'zoekopdrachten per maand naar ‘datalek’', sub: '+517% in een jaar' },
    { getal: 9900, wat: 'naar ‘autoriteit persoonsgegevens’' },
    { getal: 5400, wat: 'naar ‘datalek odido’' },
    { getal: 13517, wat: 'klachten en tips bij de AP in 2025', sub: '+75% op 2024', bron: 'https://www.autoriteitpersoonsgegevens.nl/en/over-de-autoriteit-persoonsgegevens/feiten-en-cijfers' }] },
  actie: {
    kop: 'Makkelijkste stap nu: stuur een inzageverzoek.',
    tekst: 'Beantwoord vijf korte vragen en de brief vult zich. Mail hem daarna naar jezelf en stuur hem door naar het privacyadres van de organisatie; dat staat in hun privacyverklaring. Vanaf de dag dat je verstuurt loopt de maand.',
    brief: '[Je naam]\n[Je adres]\n[Je e-mailadres]\n\n[Datum]\n\nAan: [naam van de organisatie]\nBetreft: inzageverzoek op grond van artikel 15 AVG\n\nGeachte heer, mevrouw,\n\nIk vraag u op grond van artikel 15 van de Algemene verordening gegevensbescherming (AVG) om inzage in de persoonsgegevens die u over mij verwerkt. Ik ontvang graag:\n1. een kopie van deze persoonsgegevens;\n2. de doeleinden waarvoor u ze verwerkt;\n3. de categorieën persoonsgegevens;\n4. aan wie u ze heeft verstrekt of verstrekt, ook buiten de EU;\n5. hoe lang u ze bewaart, of de criteria daarvoor;\n6. waar u ze vandaan heeft, als u ze niet van mij kreeg;\n7. of u ze gebruikt voor geautomatiseerde besluitvorming of profilering.\n\nMijn klantnummer of kenmerk: [klantnummer of kenmerk]\n\nVolgens artikel 12, derde lid, AVG reageert u binnen een maand na ontvangst. Dit verzoek is kosteloos (artikel 12, vijfde lid, AVG). U kunt mij antwoorden op het e-mailadres hierboven.\n\nMet vriendelijke groet,\n[Je naam]',
    knop: 'Kopieer de brief',
    velden: [
      { v: '[naam van de organisatie]', q: 'Bij welk bedrijf of welke organisatie wil je je gegevens opvragen?' },
      { v: '[Je naam]', q: 'Wat is je volledige naam?' },
      { v: '[Je adres]', q: 'Wat is je adres? Niet verplicht; het helpt de organisatie je te vinden.', skip: true, weg: '[Je adres]\n' },
      { v: '[klantnummer of kenmerk]', q: 'Heb je een klantnummer of kenmerk? Bijvoorbeeld van een factuur of van de melding over een datalek.', skip: true, weg: 'Mijn klantnummer of kenmerk: [klantnummer of kenmerk]\n\n' },
      { v: '[Je e-mailadres]', q: 'Wat is je e-mailadres? Het komt in de brief, en je kunt de brief naar jezelf mailen.', email: true }] },
  rechten: [
    { wat: 'Weten wat ze van je hebben', art: 'artikel 15, eerste lid', tekst: 'De doelen, de soorten gegevens, wie ze kreeg (ook buiten de EU), hoe lang ze bewaard worden, waar ze vandaan komen en of er geautomatiseerd over je besloten wordt.', waarom: 'Zonder dit overzicht kun je niets laten verbeteren of verwijderen, en zie je niet aan wie je gegevens zijn doorgegeven.' },
    { wat: 'Een kopie van je gegevens', art: 'artikel 15, derde lid', tekst: 'De organisatie geeft je een kopie van de persoonsgegevens die ze verwerkt. Vraag je het elektronisch, dan krijg je het elektronisch.', waarom: 'Dan heb je het zelf in handen, bijvoorbeeld om na een datalek te zien wat van jou erbij zat.' },
    { wat: 'Binnen een maand, en gratis', art: 'artikel 12, derde en vijfde lid', tekst: 'Antwoord onverwijld en uiterlijk binnen een maand. Bij ingewikkelde of veel verzoeken mag dat twee maanden langer. Het verzoek is kosteloos, tenzij het kennelijk ongegrond of buitensporig is.', waarom: 'De termijn is je houvast: na een maand zonder antwoord kun je verder naar de AP of de rechter.' },
    { wat: 'Laten verwijderen', art: 'artikel 17, eerste lid', tekst: 'Onder meer als de gegevens niet meer nodig zijn, als je je toestemming intrekt en er geen andere grond is, of als ze onrechtmatig verwerkt zijn.', waarom: 'Wat er niet meer is, kan niet meer lekken of doorverkocht worden.' },
    { wat: 'Stoppen met reclame', art: 'artikel 21, tweede en derde lid', tekst: 'Tegen gebruik voor direct marketing kun je altijd bezwaar maken. Daarna mogen je gegevens daarvoor niet meer gebruikt worden.', waarom: 'Daarmee stop je het gebruik van je gegevens voor ongevraagde telefoontjes en mails.' },
    { wat: 'Klagen bij de Autoriteit Persoonsgegevens', art: 'artikel 77', tekst: 'Iedereen mag een klacht indienen bij de toezichthouder, in Nederland de AP.', waarom: 'Zo ligt het probleem ook bij de toezichthouder, niet alleen bij de organisatie zelf.' },
    { wat: 'Naar de rechter', art: 'artikel 79; UAVG artikel 35', tekst: 'Je kunt de rechtbank vragen de organisatie te bevelen je verzoek alsnog toe te wijzen. Na een antwoord heb je daar zes weken voor. Antwoordde de organisatie niet binnen de termijn, dan geldt die zes weken niet.', waarom: 'Voor inzage en de andere rechten heeft de wet hiervoor een eigen verzoekschriftprocedure.' },
    { wat: 'Schadevergoeding', art: 'artikel 82, eerste lid', tekst: 'Wie materiële of immateriële schade lijdt door een overtreding, heeft recht op schadevergoeding van de organisatie.', waarom: 'Ook immateriële schade telt mee.' }],
  bronRechten: [
    { naam: 'Algemene verordening gegevensbescherming (AVG), officiële tekst op EUR-Lex', url: AVG, gelezen: '2026-11-26' },
    { naam: 'Gerechtshof Amsterdam, ECLI:NL:GHAMS:2022:2192, met de tekst van artikel 35 UAVG', url: 'https://uitspraken.rechtspraak.nl/details?id=ECLI%3ANL%3AGHAMS%3A2022%3A2192', gelezen: '2026-11-26' }],
  feiten: [
    { wanneer: '2026', tekst: 'Een klant van Odido vroeg op 2 maart 2026 inzage in zijn gegevens die bij de cyberaanval betrokken waren. Odido liet op 11 april weten meer tijd nodig te hebben en voldeed op 24 april. Hij vroeg ook de rechtbank Den Haag om inzage; die stelde vast dat hij de gegevens inmiddels had.', bron: { naam: 'Rechtbank Den Haag, ECLI:NL:RBDHA:2026:20161', url: 'https://uitspraken.rechtspraak.nl/details?id=ECLI%3ANL%3ARBDHA%3A2026%3A20161' } },
    { wanneer: 'juni 2026', tekst: 'De AP ontving in 2025 ruim 13.500 klachten en tips, 75 procent meer dan in 2024. Vooral het recht op inzage en het recht op verwijderen faciliteerden organisaties niet of onvoldoende. Daarna volgden klachten over onrechtmatige verwerking en datalekken.', bron: { naam: 'Autoriteit Persoonsgegevens, Rapportage klachten 2025', url: 'https://www.autoriteitpersoonsgegevens.nl/documenten/rapportage-klachten-2025' } },
    { wanneer: '2025', tekst: 'Ook over 2024 meldde de AP dat de meeste klachten gingen over privacyrechten, met name verwijderen en inzage, die organisaties vaak niet of onvoldoende faciliteerden.', bron: { naam: 'Autoriteit Persoonsgegevens, Rapportage klachten 2024', url: 'https://autoriteitpersoonsgegevens.nl/system/files?file=2025-09%2FRapportage+klachten+2024.pdf' } },
    { wanneer: '2023', tekst: 'De Hoge Raad zette uiteen dat een verzoekschrift op grond van artikel 35 UAVG binnen zes weken na het antwoord van de organisatie moet worden ingediend, en ging in op wat daarna nog mogelijk is.', bron: { naam: 'Hoge Raad, ECLI:NL:HR:2023:1216', url: 'https://uitspraken.rechtspraak.nl/details?id=ECLI%3ANL%3AHR%3A2023%3A1216' } },
    { wanneer: '2018', tekst: 'In het eerste halfjaar van de AVG ging 32 procent van de klachten bij de AP over een geschonden privacyrecht, zoals inzage en verwijdering.', bron: { naam: 'Autoriteit Persoonsgegevens, eerste halfjaarrapportage klachten', url: 'https://autoriteitpersoonsgegevens.nl/actueel/bijna-10000-mensen-dienen-privacyklacht-in-bij-autoriteit-persoonsgegevens' } }],
  helpers: [
    { wie: 'Bits of Freedom', wat: 'My Data Done Right maakt een inzage-, correctie-, verwijder- of overdrachtsverzoek, zoekt het adres van de organisatie voor je op en stuurt je een herinnering per mail of in je agenda.', url: 'https://www.mydatadoneright.eu', bron: 'https://bitsoffreedom.nl/2018/10/25/my-data-done-right-launched' },
    { wie: 'Consumentenbond', wat: 'Uitleg over het inzageverzoek, stap voor stap.', url: 'https://www.consumentenbond.nl/internet-privacy/een-inzageverzoek-doen-stap-voor-stap' },
    { wie: 'Het Juridisch Loket', wat: 'Gratis voorbeeldbrieven om je gegevens op te vragen of te laten verwijderen.', url: 'https://www.juridischloket.nl/voorbeeldbrieven/Voorbeeldbrief-opvragen-persoonsgegevens/' },
    { wie: 'Autoriteit Persoonsgegevens', wat: 'Hier dien je een klacht in als een organisatie je verzoek niet of niet goed afhandelt.', url: 'https://autoriteitpersoonsgegevens.nl/nl/zelf-doen/gebruik-uw-privacyrechten/klacht-melden-bij-de-ap' }],
  open: [
    'Welke organisaties in Nederland het vaakst niet of te laat antwoorden. De AP noemt geen namen. Daarom tellen we zelf: kreeg je na een maand geen antwoord, laat het meetellen.',
    'Hoe lang de AP nu over een klacht doet.'],
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
  const cfg = { velden: a.velden, datum, onderwerp: 'Mijn inzageverzoek (AVG)', fout: 'Dat lijkt geen e-mailadres.', klaar: 'Je brief staat klaar. Mail hem naar jezelf en stuur hem door naar het privacyadres van de organisatie. Bewaar de datum waarop je verstuurt.', gevolgd: 'Je volgt dit dossier. Kijk in je mail.', scope: 'algemeen', arm: 'avg' };
  return '<div class="intl-chat" data-chat="' + e(JSON.stringify(cfg)) + '"><p class="meta">Je antwoorden blijven op je eigen toestel. We krijgen niets, behalve als je op volgen tikt.</p><div class="intl-chat-log" aria-live="polite"></div><form class="intl-chat-form composer"><label class="sr-only" for="intl-chat-in">Vul de brief in met een paar vragen</label><input id="intl-chat-in" autocomplete="on"><button type="submit" class="primary">Volgende</button><button type="button" class="intl-chat-skip" hidden>Overslaan</button></form>' +
    '<div class="acts intl-chat-klaar" hidden><a class="btn primary intl-chat-mail" href="#">Mail hem naar mezelf</a><button type="button" class="intl-chat-volg">Volg ook dit dossier met dit adres</button></div><p class="consent-note intl-chat-consent" hidden>' + e(CONSENT) + ' <a href="/privacy">Privacy</a>.</p></div>';
}

export function avgPagina() {
  const D = AVG_DOSSIER, a = D.actie, url = 'https://wearemany.now/' + AVG_PAD;
  const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Curacao' });
  const citaties = [...D.bronRechten.map(b => b.url), ...D.feiten.map(f => f.bron.url)];
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': url + '#dossier', headline: D.titel, description: D.kort, inLanguage: 'nl-NL', dateModified: D.bijgewerkt, author: { '@type': 'Organization', name: 'we are many now', url: 'https://wearemany.now/' }, citation: citaties },
    { '@type': 'FAQPage', '@id': url + '#vragen', inLanguage: 'nl-NL', mainEntity: D.vragen.map(q => ({ '@type': 'Question', name: q.vraag, acceptedAnswer: { '@type': 'Answer', text: q.antwoord } })) }] };
  const body = '<main id="inhoud"><p class="meta"><a href="/dossiers">Alle dossiers</a></p><p class="eyebrow">Dossier · AVG en je gegevens · bijgewerkt ' + e(dag(D.bijgewerkt)) + '</p><h1>' + e(D.titel) + '</h1><p>' + e(D.kort) + '</p>' +
    '<div class="stand-blok"><div class="stand-tegels">' + D.zoek.tegels.map(t => '<div class="stand-tegel"><b>' + getal(t.getal) + '</b><span>' + e(t.wat) + '</span>' + (t.sub ? '<span class="stand-sub">' + e(t.sub) + '</span>' : '') + '</div>').join('') + '</div><p class="meta">Zoekopdrachten: Demand Radar, Google-schattingen voor Nederland, gemeten ' + e(dag(D.zoek.gemeten)) + '. Klachten: <a href="' + e(D.zoek.tegels[3].bron) + '" rel="noopener">AP, feiten en cijfers</a>.</p></div>' +
    '<section class="ikook" id="actie"><p class="ikook-vraag"><b>' + e(a.kop) + '</b></p><p>' + e(a.tekst) + '</p>' + chat(a, datum) + '<pre class="intl-brief" id="brief">' + e(a.brief) + '</pre><div class="acts"><button type="button" class="primary" data-kopieer="brief" data-ok="Gekopieerd. Vul de haken in.">' + e(a.knop) + '</button></div></section>' +
    '<section id="rechten"><h2>Je rechten, en waarom ze ertoe doen</h2><div class="rows">' + D.rechten.map(r => '<div class="row"><b>' + e(r.wat) + '</b><p>' + e(r.tekst) + '</p><p><b>Waarom:</b> ' + e(r.waarom) + '</p><p class="meta">AVG ' + e(r.art) + '</p></div>').join('') + '</div><p class="meta">Bron: ' + D.bronRechten.map(b => '<a href="' + e(b.url) + '" rel="noopener">' + e(b.naam) + '</a>').join(' · ') + ', gelezen op ' + e(dag(D.bronRechten[0].gelezen)) + '.</p></section>' +
    '<section id="niet-reageren"><h2>Geen antwoord na een maand?</h2><ol><li>Stuur een herinnering met de datum van je eerste verzoek.</li><li>Dien een klacht in bij de <a href="' + e(D.helpers[3].url) + '" rel="noopener">Autoriteit Persoonsgegevens</a>.</li><li>Of vraag de rechtbank de organisatie te bevelen (artikel 35 UAVG). Zonder tijdig antwoord geldt de termijn van zes weken niet.</li><li><a href="/start">Laat meetellen</a> welke organisatie je liet wachten. Zo komt zij in dit dossier.</li></ol></section>' +
    '<section id="record"><h2>Op de publieke record</h2><ol class="dossier-tijdlijn">' + D.feiten.map(f => '<li><p class="meta">' + e(f.wanneer) + '</p><p>' + e(f.tekst) + '</p><p class="meta">Bron: <a href="' + e(f.bron.url) + '" rel="noopener">' + e(f.bron.naam) + '</a></p></li>').join('') + '</ol></section>' +
    '<section id="hulp"><h2>Wie je verder helpt</h2><div class="rows">' + D.helpers.map(h => '<div class="row"><b><a href="' + e(h.url) + '" rel="noopener">' + e(h.wie) + '</a></b><p>' + e(h.wat) + '</p></div>').join('') + '</div></section>' +
    '<section id="open"><h2>Nog niet bekend</h2><ul>' + D.open.map(t => '<li>' + e(t) + '</li>').join('') + '</ul></section>' +
    '<section class="volg" id="volgen"><h2>Volg dit dossier</h2><p>Je hoort van ons als er een organisatie in dit dossier komt of als er iets verandert. Verder niets.</p><form class="intl-volg" data-scope="algemeen" data-arm="avg" data-ok="Je volgt dit dossier. Kijk in je mail."><label class="sr-only" for="intl-email">E-mailadres</label><div class="composer"><input id="intl-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" placeholder="E-mailadres"><button type="submit" class="primary">Volg dit dossier <span aria-hidden="true">→</span></button></div><label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="consent-note">' + e(CONSENT) + ' <a href="/privacy">Privacy</a>.</p></form><p class="msg" role="status"></p></section>' +
    '<section id="vragen"><h2>Vragen</h2>' + D.vragen.map(q => '<div class="dossier-vraag"><h3>' + e(q.vraag) + '</h3><p>' + e(q.antwoord) + '</p></div>').join('') + '</section>' +
    '<p class="meta">we are many now is geen advocaat en geeft geen juridisch advies. Dit dossier bevat alleen wat in de genoemde bronnen staat.</p>' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script></main>';
  return { pad: '/' + AVG_PAD, titel: D.seo, desc: 'Vraag binnen een maand en gratis op welke gegevens een organisatie van je heeft, ook na een datalek. Je rechten uit de AVG, waarom ze ertoe doen, een brief die zich invult, en wat je doet als er geen antwoord komt.', body, script: INTL_JS, geenVolg: true };
}
