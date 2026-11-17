// Sealed Intent: de pagina's rond de chat, in dezelfde opmaak en met de chat erin (Henkjan 17 nov 2026, na het panel: "omliggende paginas zijn
// nog niet in juiste design en zijn er teveel?" en daarna "Ja prima voer door"). Van 31 naar 18 pagina's: per taal blijven bedrijf verkopen,
// wat is mijn bedrijf waard, bod gekregen, opvolging, hoe het werkt (was: wat is een sealed intent) en privacy. De vier executive-onderwerpen,
// het oude formulier, de oude partijpagina en 'goede reactie' sturen door. Geen beweringen die niet waar zijn: geen gecontroleerde kopers,
// geen handelsregistercontrole, geen 24 uur, geen rekenhulp die er niet meer staat.
import { PAGINAS, BRON, UI, PARTIJ, BIJGEWERKT } from './sealed-content.js';
import { EXTRA_GROUPS } from './sealed-pages.js';
import { LP } from './sealed-lp.js';

export const INFO_DATUM = '2026-11-17';
const BASE = 'https://sealedintent.com';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const WA = 'https://wa.me/31655395630', MEET = 'https://meeting.nexy.works/a54blu';
const BLIJFT = p => p.groep === 'o';
export const infoPaginas = () => PAGINAS.filter(BLIJFT);
const EXTRA_BLIJFT = ['concept', 'privacy', 'succession'];

// Waar een oud adres heen gaat (301). null = geen doorsturing.
export function doorsturen(taal, slug) {
  if (!LP.owners[taal]) return null;
  if (slug === 'seal') return '/' + taal + '/' + LP.owners[taal];
  if (slug === 'partners' || (PARTIJ[taal] && PARTIJ[taal].slug === slug)) return '/' + taal + '/' + LP.buyers[taal];
  if (EXTRA_GROUPS.quality[taal] && EXTRA_GROUPS.quality[taal].slug === slug) return '/' + taal + '/' + EXTRA_GROUPS.concept[taal].slug;
  if (PAGINAS.some(p => p.taal === taal && p.slug === slug && !BLIJFT(p))) return '/' + taal;
  return null;
}

// Titel en omschrijving zonder de oude beloftes (rekenhulp, gecontroleerde kopers, "of anderen meer bieden").
const KOP = {
  waarde: {
    nl: ['Wat is mijn bedrijf waard? De cijfers per sector', 'Een mkb-bedrijf bracht eind 2025 gemiddeld 5,0 keer de winst op, software 7,5 keer. De cijfers per sector, en hoe je zonder naam vastlegt onder welke voorwaarden je zou verkopen.'],
    en: ['What is my business worth? Recent sale multiples', 'Small businesses sold for an average 2.30x cash flow under $1M and 3.73x above (Q3 2026). See the figures, and set down without a name the terms on which you would sell.'],
    de: ['Unternehmenswert: aktuelle Multiples für kleine Firmen', 'EBITDA-Multiples für kleine Unternehmen (DUB, Q2 2026): Software 6,3–8,0, Maschinenbau 3,5–4,5. Halten Sie ohne Namen fest, zu welchen Bedingungen Sie verkaufen würden.'] },
  bod: {
    nl: ['Bod op je bedrijf gekregen? Zo vergelijk je het', 'Een bod op je bedrijf gekregen? Vergelijk wat zeker wordt betaald, wat later volgt en wat jij nog moet doen. Leg zonder naam vast onder welke voorwaarden je zou verkopen.'],
    en: ['Got an offer for your business? How to compare it', 'Got an offer for your business? Compare what is paid for certain, what follows later and what you still owe the buyer. Set down without a name the terms on which you would sell.'],
    de: ['Kaufangebot für Ihre Firma? So vergleichen Sie es', 'Ein Kaufangebot erhalten? Vergleichen Sie, was sicher gezahlt wird, was später folgt und was Sie noch leisten müssen. Halten Sie ohne Namen fest, zu welchen Bedingungen Sie verkaufen würden.'] },
  verkopen: {
    nl: [null, 'Verkoop je bedrijf zonder advertentie. Leg zonder naam vast onder welke voorwaarden je zou verkopen. Niemand ziet wie je bent tot jij per koper ja zegt.'],
    en: [null, 'Sell your business without a listing. Set down, without a name, the terms on which you would sell. Nobody sees who you are until you say yes, buyer by buyer.'],
    de: [null, 'Firma verkaufen ohne Inserat. Halten Sie ohne Namen fest, zu welchen Bedingungen Sie verkaufen würden. Niemand sieht, wer Sie sind, bis Sie Käufer für Käufer zustimmen.'] },
};
const OUD = /rekenhulp|calculator|rechner|this tool|the tool|valuation example|werkzeug|das tool|hilfsmittel|beispielrechnung|rechenhilfe|bewertungsbeispiel|zij kan niet bepalen|it cannot determine|kann sie nicht entscheiden/i, OUDVRAAG = /rekenhulp|calculator|rechner|uitkomst|indicatie|estimate|the range|the result|ergebnis|schätzung|e-mailadres of borg|email( address)? or (a )?deposit|e-mail(-adresse)? oder (eine )?kaution|wacht op beoordeling|awaits? review|wartet auf prüfung|sehen partner|zien partijen|counterparties see|illustration|ist das eine bewertung|is this a valuation/i;
const zonderOud = t => String(t || '').split(/(?<=[.!?])\s+/).filter(z => !OUD.test(z)).join(' ');
const W = {
  nl: { faq: 'Vragen', feiten: 'In cijfers', data: 'Marktdata', bron: 'Bron', bronnen: 'Bronnen', meer: 'Lees meer', bij: 'Bijgewerkt', v1: ['Moet ik mijn naam of e-mailadres geven?', 'Nee. Eigenaren beantwoorden zes korte vragen zonder naam en zonder e-mailadres. Je krijgt een privélink waarmee je alles bekijkt of verwijdert.'], v2: ['Wie ziet mijn voorwaarden?', 'Wij. Een koper ziet ze pas als ze bij zijn criteria passen, zonder je naam of bedrijfsnaam. Een introductie volgt alleen als jij per koper ja zegt. We zijn net begonnen; een match is niet gegarandeerd.'], v3: ['Waarom verloopt het na een week?', 'We weten simpelweg niet wie je bent: geen naam, geen e-mail, geen account. Je hoeft ons dus niet te vertrouwen met je identiteit, want we hebben haar niet. Daardoor kunnen we je ook niet vragen of je voorwaarden nog kloppen. Daarom staat een inzending een week aan. Met je privélink zet je hem opnieuw aan. Doe je dat 30 dagen niet, dan verwijderen we hem.'] },
  en: { faq: 'Questions', feiten: 'In numbers', data: 'Market data', bron: 'Source', bronnen: 'Sources', meer: 'Read more', bij: 'Updated', v1: ['Do I have to give my name or email address?', 'No. Owners answer six short questions without a name and without an email address. You get a private link to view or delete everything.'], v2: ['Who sees my terms?', 'We do. A buyer sees them only when they fit his criteria, without your name or company name. An introduction follows only when you say yes, buyer by buyer. We have just started; a match is not guaranteed.'], v3: ['Why does it expire after a week?', 'We simply do not know who you are: no name, no email, no account. You do not have to trust us with your identity, because we do not have it. That also means we cannot ask you whether your terms still hold. So a submission stays active for a week. With your private link you switch it on again. If you do not for 30 days, we delete it.'] },
  de: { faq: 'Fragen', feiten: 'In Zahlen', data: 'Marktdaten', bron: 'Quelle', bronnen: 'Quellen', meer: 'Mehr lesen', bij: 'Aktualisiert', v1: ['Muss ich Namen oder E-Mail-Adresse angeben?', 'Nein. Inhaber beantworten sechs kurze Fragen ohne Namen und ohne E-Mail-Adresse. Sie erhalten einen privaten Link, mit dem Sie alles ansehen oder löschen.'], v2: ['Wer sieht meine Bedingungen?', 'Wir. Ein Käufer sieht sie erst, wenn sie zu seinen Kriterien passen, ohne Ihren Namen oder Firmennamen. Eine Vorstellung folgt nur, wenn Sie Käufer für Käufer zustimmen. Wir haben gerade begonnen; ein passender Käufer ist nicht garantiert.'], v3: ['Warum läuft es nach einer Woche ab?', 'Wir wissen schlicht nicht, wer Sie sind: kein Name, keine E-Mail, kein Konto. Sie müssen uns Ihre Identität nicht anvertrauen, denn wir haben sie nicht. Deshalb können wir Sie auch nicht fragen, ob Ihre Bedingungen noch gelten. Darum bleibt eine Eingabe eine Woche aktiv. Mit Ihrem privaten Link schalten Sie sie wieder ein. Tun Sie das 30 Tage nicht, löschen wir sie.'] },
};

// Hoe het werkt, wie erachter zit en wat het kost (op het adres van 'wat is een sealed intent').
const HOE = {
  nl: { title: 'Hoe Sealed Intent werkt, wie erachter zit en wat het kost', desc: 'Eigenaren leggen zonder naam vast onder welke voorwaarden ze zouden verkopen. Kopers leggen vast wat ze zoeken. Zo werkt het, dit kost het en dit is wie erachter zit.', h1: 'Hoe het werkt, wie erachter zit en wat het kost', top: 'Een eigenaar legt zonder naam vast onder welke voorwaarden hij zou verkopen. Een koper legt vast wat hij zoekt. Past het, dan vragen we beide kanten om akkoord. Pas na twee keer ja volgt een introductie.',
    s: [['Voor eigenaren', 'Je bedrijf hoeft niet te koop te staan. Je beantwoordt zes korte vragen, zonder naam en zonder e-mailadres: staat het te koop, welke sector, wanneer, onder welke voorwaarden en wat niet bespreekbaar is. Je krijgt een privélink waarmee je alles bekijkt of verwijdert. Het kost je niets.'],
      ['We weten niet wie je bent', 'Geen naam, geen e-mail, geen account: je hoeft ons niet te vertrouwen met je identiteit, want we hebben haar niet. Daardoor kunnen we je ook niet herinneren. Je inzending staat een week aan. Daarna kom je terug met je privélink om hem opnieuw te activeren. Zo staat er alleen iets wat nog klopt.'],
      ['Voor kopers', 'Je legt in vier stappen vast wat je zoekt: sector, omvang, wie je bent en een e-mailadres. Eigenaren zien je criteria, niet je naam of adres.'],
      ['Wat het kost', 'Voor eigenaren niets. Voor kopers is vastleggen gratis en de eerste introductie ook. Daarna spreken we de prijs vooraf met je af. Je betaalt alleen voor een introductie die de eigenaar zelf heeft goedgekeurd.'],
      ['Wie erachter zit', 'Sealed Intent is van Henkjan de Krijger, oprichter van Mijndomein.nl (daar niet meer bij betrokken), en valt onder Adsfair B.V. in Gouda. Vragen? App hem op +31 6 55395630. Anoniem blijven kan ook.', 'contact'],
      ['Waar we nu staan', 'We zijn net begonnen. Er ligt nog geen stapel eigenaren of kopers klaar en een match is niet gegarandeerd. Introducties regelen we in deze fase met de hand. Wie nu meedoet, is een van de eersten.']] },
  en: { title: 'How Sealed Intent works, who is behind it and what it costs', desc: 'Owners set down, without a name, the terms on which they would sell. Buyers set down what they are looking for. How it works, what it costs and who is behind it.', h1: 'How it works, who is behind it and what it costs', top: 'An owner sets down, without a name, the terms on which he would sell. A buyer sets down what he is looking for. When the two fit, we ask both sides to agree. An introduction follows only after two yeses.',
    s: [['For owners', 'Your business does not have to be for sale. You answer six short questions, without a name and without an email address: is it for sale, which sector, when, on what terms and what is off the table. You get a private link to view or delete everything. It costs you nothing.'],
      ['We do not know who you are', 'No name, no email, no account: you do not have to trust us with your identity, because we do not have it. That also means we cannot remind you. Your submission stays active for a week. After that you come back with your private link to reactivate it. So only what still holds stays up.'],
      ['For buyers', 'You set down what you are looking for in four steps: sector, size, who you are and an email address. Owners see your criteria, not your name or address.'],
      ['What it costs', 'Nothing for owners. For buyers, setting it down is free and so is the first introduction. After that we agree the price with you up front. You pay only for an introduction the owner has approved.'],
      ['Who is behind it', 'Sealed Intent is run by Henkjan de Krijger, founder of Mijndomein.nl (no longer involved there), and is part of Adsfair B.V. in Gouda, the Netherlands. Questions? Message him on WhatsApp at +31 6 55395630. Staying anonymous is fine too.', 'contact'],
      ['Where we are now', 'We have just started. There is no stack of owners or buyers waiting yet and a match is not guaranteed. At this stage we arrange introductions by hand. Whoever joins now is one of the first.']] },
  de: { title: 'Wie Sealed Intent funktioniert, wer dahintersteht und was es kostet', desc: 'Inhaber halten ohne Namen fest, zu welchen Bedingungen sie verkaufen würden. Käufer halten fest, was sie suchen. So funktioniert es, das kostet es, und wer dahintersteht.', h1: 'Wie es funktioniert, wer dahintersteht und was es kostet', top: 'Ein Inhaber hält ohne Namen fest, zu welchen Bedingungen er verkaufen würde. Ein Käufer hält fest, was er sucht. Passt es, bitten wir beide Seiten um Zustimmung. Erst nach zweimal Ja folgt eine Vorstellung.',
    s: [['Für Inhaber', 'Ihre Firma muss nicht zum Verkauf stehen. Sie beantworten sechs kurze Fragen, ohne Namen und ohne E-Mail-Adresse: Steht sie zum Verkauf, welche Branche, wann, zu welchen Bedingungen und was nicht verhandelbar ist. Sie erhalten einen privaten Link, mit dem Sie alles ansehen oder löschen. Es kostet Sie nichts.'],
      ['Wir wissen nicht, wer Sie sind', 'Kein Name, keine E-Mail, kein Konto: Sie müssen uns Ihre Identität nicht anvertrauen, denn wir haben sie nicht. Deshalb können wir Sie auch nicht erinnern. Ihre Eingabe bleibt eine Woche aktiv. Danach kommen Sie mit Ihrem privaten Link zurück, um sie erneut zu aktivieren. So steht dort nur, was noch gilt.'],
      ['Für Käufer', 'Sie halten in vier Schritten fest, was Sie suchen: Branche, Größe, wer Sie sind und eine E-Mail-Adresse. Inhaber sehen Ihre Kriterien, nicht Ihren Namen oder Ihre Adresse.'],
      ['Was es kostet', 'Für Inhaber nichts. Für Käufer ist das Festhalten kostenlos, die erste Vorstellung auch. Danach vereinbaren wir den Preis vorab mit Ihnen. Sie zahlen nur für eine Vorstellung, der der Inhaber selbst zugestimmt hat.'],
      ['Wer dahintersteht', 'Sealed Intent ist von Henkjan de Krijger, Gründer von Mijndomein.nl (dort nicht mehr beteiligt), und gehört zur Adsfair B.V. in Gouda, Niederlande. Fragen? Schreiben Sie ihm per WhatsApp unter +31 6 55395630. Anonym bleiben geht auch.', 'contact'],
      ['Wo wir jetzt stehen', 'Wir haben gerade begonnen. Es wartet noch kein Stapel von Inhabern oder Käufern, und ein passender Kontakt ist nicht garantiert. Vorstellungen organisieren wir in dieser Phase von Hand. Wer jetzt mitmacht, gehört zu den Ersten.']] },
};
const PRIV = {
  nl: { title: 'Privacy: wat we bewaren en wat niet', desc: 'Eigenaren geven geen naam en geen e-mailadres. Wat we wel bewaren, hoe lang, en hoe je het in één tik verwijdert.', h1: 'Privacy: wat we bewaren en wat niet', top: 'Eigenaren geven geen naam en geen e-mailadres. Kopers geven een e-mailadres dat eigenaren niet zien. Hieronder staat precies wat we bewaren en hoe lang.',
    s: [['Eigenaren', 'We vragen geen naam, bedrijfsnaam of e-mailadres. We bewaren je antwoorden: of je bedrijf te koop staat, de sector, de termijn en je voorwaarden. Een inzending staat een week aan. Daarna staat ze uit tot je haar met je privélink opnieuw activeert; doe je dat 30 dagen niet, dan verwijderen we haar. We kunnen je daar niet aan herinneren, want we weten niet wie je bent.'],
      ['Je privélink', 'Na het vastleggen krijg je een privélink. Daarmee bekijk, verleng en verwijder je je inzending. Wij bewaren alleen een afgeleide code van die link, niet de link zelf. We kunnen hem dus niet opnieuw sturen.'],
      ['Een seintje per mail', 'Alleen als je er zelf om vraagt bewaren we een e-mailadres voor een seintje. Het staat los van je voorwaarden, kopers zien het niet, en het verdwijnt als je je inzending verwijdert.'],
      ['Kopers', 'Kopers geven een e-mailadres en hun koopcriteria. Dat bewaren we maximaal 180 dagen. Eigenaren zien de criteria, niet de naam of het adres. Eén mail of appje en we verwijderen het.'],
      ['Wat je typt', 'Typ geen namen, telefoonnummers of adressen in de chat; bij eigenaren weigeren we tekst met contactgegevens. Een unieke combinatie van details kan je ook zonder naam herkenbaar maken, dus houd het breed. Korte getypte antwoorden gebruiken we, zonder contactgegevens, om de vragen te verbeteren.'],
      ['Meten', 'We tellen per dag hoeveel mensen een stap zien en beantwoorden en uit wat voor bron ze kwamen (zoeken, mail, advertentie). Daarbij bewaren we geen profiel, IP-adres of bezoekers-ID. Tegen misbruik gebruiken we kort een onomkeerbare code van het IP-adres. Onze hostingpartij houdt technische logs bij.'],
      ['Vragen of verwijderen', 'App Henkjan op +31 6 55395630. Sealed Intent is een dienst van Adsfair B.V., Gouda.', 'contact']] },
  en: { title: 'Privacy: what we keep and what we do not', desc: 'Owners give no name and no email address. What we do keep, for how long, and how you delete it in one tap.', h1: 'Privacy: what we keep and what we do not', top: 'Owners give no name and no email address. Buyers give an email address that owners do not see. Below is exactly what we keep and for how long.',
    s: [['Owners', 'We ask for no name, company name or email address. We keep your answers: whether your business is for sale, the sector, the timing and your terms. A submission stays active for a week. After that it is off until you reactivate it with your private link; if you do not for 30 days, we delete it. We cannot remind you, because we do not know who you are.'],
      ['Your private link', 'After you set it down you get a private link. With it you view, renew and delete your submission. We keep only a derived code of that link, not the link itself. So we cannot send it again.'],
      ['A heads-up by email', 'Only if you ask for it do we keep an email address for a heads-up. It is stored apart from your terms, buyers do not see it, and it is removed when you delete your submission.'],
      ['Buyers', 'Buyers give an email address and their acquisition criteria. We keep that for up to 180 days. Owners see the criteria, not the name or address. One email or WhatsApp message and we delete it.'],
      ['What you type', 'Do not type names, phone numbers or addresses in the chat; for owners we refuse text with contact details. A unique combination of details can identify you even without a name, so keep it broad. We use short typed answers, without contact details, to improve the questions.'],
      ['Measuring', 'We count per day how many people see and answer a step and what kind of source they came from (search, email, advertising). We keep no profile, IP address or visitor ID for that. Against abuse we briefly use an irreversible code of the IP address. Our hosting provider keeps technical logs.'],
      ['Questions or deletion', 'Message Henkjan on WhatsApp at +31 6 55395630. Sealed Intent is a service of Adsfair B.V., Gouda, the Netherlands.', 'contact']] },
  de: { title: 'Datenschutz: was wir speichern und was nicht', desc: 'Inhaber geben weder Namen noch E-Mail-Adresse an. Was wir speichern, wie lange, und wie Sie es mit einem Tipp löschen.', h1: 'Datenschutz: was wir speichern und was nicht', top: 'Inhaber geben weder Namen noch E-Mail-Adresse an. Käufer geben eine E-Mail-Adresse an, die Inhaber nicht sehen. Unten steht genau, was wir speichern und wie lange.',
    s: [['Inhaber', 'Wir fragen weder Namen noch Firmennamen noch E-Mail-Adresse. Wir speichern Ihre Antworten: ob Ihre Firma zum Verkauf steht, die Branche, den Zeitrahmen und Ihre Bedingungen. Eine Eingabe bleibt eine Woche aktiv. Danach ist sie aus, bis Sie sie mit Ihrem privaten Link erneut aktivieren; tun Sie das 30 Tage nicht, löschen wir sie. Wir können Sie nicht daran erinnern, denn wir wissen nicht, wer Sie sind.'],
      ['Ihr privater Link', 'Nach dem Festhalten erhalten Sie einen privaten Link. Damit sehen, verlängern und löschen Sie Ihre Eingabe. Wir speichern nur einen abgeleiteten Code dieses Links, nicht den Link selbst. Wir können ihn also nicht erneut senden.'],
      ['Ein Hinweis per E-Mail', 'Nur wenn Sie es selbst wünschen, speichern wir eine E-Mail-Adresse für einen Hinweis. Sie liegt getrennt von Ihren Bedingungen, Käufer sehen sie nicht, und sie verschwindet, wenn Sie Ihre Eingabe löschen.'],
      ['Käufer', 'Käufer geben eine E-Mail-Adresse und ihre Kaufkriterien an. Das speichern wir höchstens 180 Tage. Inhaber sehen die Kriterien, nicht den Namen oder die Adresse. Eine E-Mail oder WhatsApp-Nachricht, und wir löschen es.'],
      ['Was Sie eintippen', 'Tippen Sie keine Namen, Telefonnummern oder Adressen in den Chat; bei Inhabern lehnen wir Text mit Kontaktdaten ab. Eine einzigartige Kombination von Details kann Sie auch ohne Namen erkennbar machen, bleiben Sie also allgemein. Kurze getippte Antworten nutzen wir ohne Kontaktdaten, um die Fragen zu verbessern.'],
      ['Messen', 'Wir zählen pro Tag, wie viele Menschen einen Schritt sehen und beantworten und aus welcher Art Quelle sie kamen (Suche, E-Mail, Anzeige). Dabei speichern wir kein Profil, keine IP-Adresse und keine Besucher-ID. Gegen Missbrauch nutzen wir kurzzeitig einen nicht umkehrbaren Code der IP-Adresse. Unser Hosting-Anbieter führt technische Protokolle.'],
      ['Fragen oder Löschung', 'Schreiben Sie Henkjan per WhatsApp unter +31 6 55395630. Sealed Intent ist ein Dienst der Adsfair B.V., Gouda, Niederlande.', 'contact']] },
};
const NIEUW = { concept: HOE, privacy: PRIV };
const CONTACT = { nl: ['App Henkjan', 'Praat direct met Henkjan'], en: ['Message Henkjan on WhatsApp', 'Talk to Henkjan now'], de: ['Henkjan per WhatsApp schreiben', 'Jetzt mit Henkjan sprechen'] };

// Vorm van outname.now (Henkjan 17 nov 2026 bij de eerste versie van deze pagina's: "Dit IS NIET outname.now design"): gelezen uit
// outname.now/styles.css en reply-flow.css. Secties als rijen met een lijn (.line), cijfers in de kaart met balk en kleine bronregel
// (.sample-mail), vragen als uitklaprijen (details/summary), klein kopje in hoofdletters boven een grote kop (.eyebrow + h2), links als rijen
// met een pijl. Geen opsommingstekens met onderstreepte links, geen losse kopjes met alinea's.
const sectie = (taal, [h, tekst, extra]) => `<div class="line"><h3>${esc(h)}</h3><p>${esc(tekst)}</p>` + (Array.isArray(extra) ? `<ul>${extra.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : extra === 'contact' ? `<p class="knop"><a class="pill" href="${WA}" target="_blank" rel="noopener">${esc(CONTACT[taal][0])} →</a></p>` : '') + '</div>';
const bron = k => BRON[k] ? `<a href="${esc(BRON[k][1])}" rel="noopener">${esc(BRON[k][0])}</a>` : '';
const vragen = (w, faq) => `<section><p class="eb">${esc(w.faq)}</p>` + faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('') + '</section>';

// Alle blijvende pagina's van een taal als links (voor de voordeur en onder elke pagina).
export function infoLinks(taal, behalve = '') {
  const uit = [];
  for (const p of infoPaginas().filter(p => p.taal === taal)) uit.push({ href: '/' + taal + '/' + p.slug, tekst: p.h1, slug: p.slug });
  for (const k of EXTRA_BLIJFT) { const g = EXTRA_GROUPS[k][taal]; if (g) uit.push({ href: '/' + taal + '/' + g.slug, tekst: NIEUW[k] ? NIEUW[k][taal].h1 : g.title, slug: g.slug }); }
  return uit.filter(l => l.slug !== behalve);
}
export function infoUrls() {
  const uit = [];
  for (const p of infoPaginas()) uit.push({ loc: BASE + '/' + p.taal + '/' + p.slug, alts: Object.fromEntries(infoPaginas().filter(q => q.paar === p.paar).map(q => [q.taal, BASE + '/' + q.taal + '/' + q.slug])) });
  for (const k of EXTRA_BLIJFT) for (const [t, g] of Object.entries(EXTRA_GROUPS[k])) uit.push({ loc: BASE + '/' + t + '/' + g.slug, alts: Object.fromEntries(Object.entries(EXTRA_GROUPS[k]).map(([x, q]) => [x, BASE + '/' + x + '/' + q.slug])) });
  for (const k of Object.keys(LP)) for (const t of Object.keys(LP[k])) uit.push({ loc: BASE + '/' + t + '/' + LP[k][t], alts: Object.fromEntries(Object.keys(LP[k]).map(x => [x, BASE + '/' + x + '/' + LP[k][x]])) });
  return uit;
}

// Geeft de pagina voor renderChatPage: { title, desc, h1, top, rest (HTML), canon, alts, rol, ld } of null.
export function infoPagina(taal, slug) {
  const w = W[taal]; if (!w) return null;
  const p = infoPaginas().find(x => x.taal === taal && x.slug === slug);
  if (p) {
    const k = (KOP[p.paar] || {})[taal] || [], title = k[0] || p.title, desc = k[1] || p.desc, canon = BASE + '/' + taal + '/' + slug;
    const alts = Object.fromEntries(infoPaginas().filter(q => q.paar === p.paar).map(q => [q.taal, BASE + '/' + q.taal + '/' + q.slug]));
    const faq = [...p.faq.filter(([q, a]) => !OUDVRAAG.test(q + ' ' + a)).map(([q, a]) => [q, zonderOud(a)]), w.v1, w.v3, w.v2];
    const bronnen = (p.bronnen || []).map(bron).filter(Boolean);
    const rest = (p.feiten && p.feiten.length ? `<section><div class="kaart"><div class="kt"><b>${esc(w.feiten)}</b><span class="kl">${esc(w.data)}</span></div>${p.feiten.map(([a, b]) => `<div class="kr kg"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}${bronnen.length ? `<p class="kf">${esc(bronnen.length > 1 ? w.bronnen : w.bron)}: ${bronnen.join(' · ')}</p>` : ''}</div></section>` : '')
      + vragen(w, faq);
    const ld = [{ '@type': 'WebPage', '@id': canon + '#page', url: canon, name: title, description: desc, inLanguage: taal, isPartOf: { '@id': BASE + '/#site' }, datePublished: '2026-11-16', dateModified: INFO_DATUM },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
    return { title, desc, h1: p.h1, top: zonderOud(p.antwoord), rest, canon, alts, rol: 'owners', ld };
  }
  for (const kind of EXTRA_BLIJFT) { const g = EXTRA_GROUPS[kind][taal]; if (!g || g.slug !== slug) continue;
    const canon = BASE + '/' + taal + '/' + slug, alts = Object.fromEntries(Object.entries(EXTRA_GROUPS[kind]).map(([t, q]) => [t, BASE + '/' + t + '/' + q.slug]));
    const n = NIEUW[kind] && NIEUW[kind][taal], title = n ? n.title : g.title, desc = n ? n.desc : g.desc, secties = n ? n.s : g.sections;
    const rest = '<section>' + secties.map(s => sectie(taal, s)).join('') + (!n && g.sources ? `<p class="kf">${esc(w.bronnen)}: ${g.sources.map(([naam, u]) => `<a href="${esc(u)}" rel="noopener">${esc(naam)}</a>`).join(' · ')}</p>` : '') + '</section>';
    const ld = [{ '@type': 'WebPage', '@id': canon + '#page', url: canon, name: title, description: desc, inLanguage: taal, isPartOf: { '@id': BASE + '/#site' }, dateModified: INFO_DATUM }];
    return { title, desc, h1: n ? n.h1 : g.title, top: n ? n.top : g.desc, rest, canon, alts, rol: kind === 'succession' ? 'owners' : '', ld };
  }
  return null;
}
