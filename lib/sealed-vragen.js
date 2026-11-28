// Vraagkwaliteit: bewijs uit het gesprek, ontbrekende matchcriteria en herstel bij een slechte AI-vraag.
// Een populaire pill is geen bewijs van een goede match. Versie en uitkomst blijven bij de vraag.
import { createHash } from 'node:crypto';

export const VRAAG_VERSIE = '2026-11-28-v2';
export const VELDEN = ['situatie', 'doel', 'onderwerp', 'omvang', 'regio', 'termijn', 'budget', 'eisen', 'uitsluitingen', 'fase'];
const norm = x => String(x || '').toLowerCase().normalize('NFKD').replace(/ß/g, 'ss').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const kort = x => String(x || '').replace(/[^\s@]+@[^\s@]+\.[a-z]{2,}/gi, '[verborgen]').slice(0, 300);
const id = x => createHash('sha256').update(x).digest('hex').slice(0, 16);
export const onbekend = x => /^(weet ik (nog )?niet( precies)?|weet nog niet|niet bekend|nog (te bepalen|onbekend|uitzoeken)|not sure( yet)?|not known|i don t know|don t know( yet)?|weiss ich (noch )?nicht|nicht bekannt|unbekannt)$/.test(norm(x));
const breed = x => /^(iets inkopen of inhuren|klanten of opdrachten|een probleem oplossen|advies of een expert|een samenwerking|personeel of interim|buy or hire something|customers or work|solve a problem|advice or an expert|a partnership|staff or interim|etwas einkaufen oder beauftragen|kunden oder auftrage|ein problem losen|rat oder ein experte|eine zusammenarbeit|personal oder interim)$/.test(norm(x)) || onbekend(x);

const ALG = {
  nl: {
    situatie: ['Wat speelt er op dit moment?', ['Er loopt iets vast', 'Ik wil groeien', 'Ik wil iets regelen', 'Ik wil iets aanbieden', 'Weet ik nog niet']],
    doel: ['Wat moet er voor jou beter worden?', ['Tijd overhouden', 'Meer verdienen', 'Een risico oplossen', 'Iets mogelijk maken', 'Weet ik nog niet']],
    onderwerp: ['Waar gaat het concreet over?', ['Een dienst', 'Een product', 'Een bedrijf', 'Mensen of capaciteit', 'Anders']],
    omvang: ['Om welke omvang gaat het?', ['Eenmalig iets kleins', 'Een grotere opdracht', 'Doorlopend werk', 'Weet ik nog niet']],
    regio: ['Waar moet de partij kunnen helpen?', ['Bij mij in de buurt', 'In mijn land', 'Op afstand kan ook', 'Maakt niet uit']],
    termijn: ['Wanneer moet de eerste stap gezet zijn?', ['Deze week', 'Binnen een maand', 'Binnen drie maanden', 'Geen haast', 'Weet ik nog niet']],
    budget: ['Hoe wil je de prijs afspreken?', ['Vaste prijs vooraf', 'Eerst een prijsindicatie', 'Per resultaat', 'Budget samen bepalen']],
    eisen: ['Waar moet een passende partij zeker aan voldoen?', ['Aantoonbare ervaring', 'Een vaste prijs', 'Snel kunnen starten', 'Samen risico dragen', 'Weet ik nog niet']],
    uitsluitingen: ['Wat wil je in ieder geval voorkomen?', ['Een lang contract', 'Onverwachte kosten', 'Veel eigen werk', 'Geen harde uitsluiting']],
    fase: ['Hoe ver ben je hiermee?', ['Nog aan het verkennen', 'Al iets geprobeerd', 'Klaar voor uitvoering', 'Weet ik nog niet']]
  },
  en: {
    situatie: ['What is happening at the moment?', ['Something is stuck', 'I want to grow', 'I need something arranged', 'I have something to offer', 'Not sure yet']],
    doel: ['What needs to improve for you?', ['Save time', 'Earn more', 'Resolve a risk', 'Make something possible', 'Not sure yet']],
    onderwerp: ['What is this specifically about?', ['A service', 'A product', 'A company', 'People or capacity', 'Something else']],
    omvang: ['What scale is involved?', ['Small one-off task', 'A larger project', 'Ongoing work', 'Not sure yet']],
    regio: ['Where must the other party be able to help?', ['Near me', 'In my country', 'Remote works too', 'Anywhere']],
    termijn: ['When must the first step happen?', ['This week', 'Within a month', 'Within three months', 'No rush', 'Not sure yet']],
    budget: ['How would you like to agree the price?', ['Fixed price first', 'Get an estimate first', 'Pay for results', 'Work out a budget']],
    eisen: ['What must a suitable party offer?', ['Relevant proven experience', 'A fixed price', 'A quick start', 'Share the risk', 'Not sure yet']],
    uitsluitingen: ['What do you want to avoid?', ['A long contract', 'Unexpected costs', 'Lots of my time', 'No hard exclusions']],
    fase: ['How far along are you?', ['Just exploring', 'Already tried something', 'Ready to proceed', 'Not sure yet']]
  },
  de: {
    situatie: ['Was ist gerade los?', ['Etwas steckt fest', 'Ich will wachsen', 'Ich will etwas regeln', 'Ich habe etwas anzubieten', 'Weiß ich noch nicht']],
    doel: ['Was soll für Sie besser werden?', ['Zeit sparen', 'Mehr verdienen', 'Ein Risiko lösen', 'Etwas möglich machen', 'Weiß ich noch nicht']],
    onderwerp: ['Worum geht es konkret?', ['Eine Dienstleistung', 'Ein Produkt', 'Ein Unternehmen', 'Menschen oder Kapazität', 'Etwas anderes']],
    omvang: ['Um welchen Umfang geht es?', ['Kleine einmalige Aufgabe', 'Ein größeres Projekt', 'Laufende Arbeit', 'Weiß ich noch nicht']],
    regio: ['Wo muss die andere Seite helfen können?', ['In meiner Nähe', 'In meinem Land', 'Auch aus der Ferne', 'Überall']],
    termijn: ['Wann muss der erste Schritt erfolgen?', ['Diese Woche', 'Innerhalb eines Monats', 'In drei Monaten', 'Keine Eile', 'Weiß ich noch nicht']],
    budget: ['Wie möchten Sie den Preis vereinbaren?', ['Festpreis vorab', 'Zuerst eine Preisschätzung', 'Nach Ergebnis', 'Budget gemeinsam bestimmen']],
    eisen: ['Was muss eine passende Partei mitbringen?', ['Nachweisbare Erfahrung', 'Einen Festpreis', 'Schnell starten können', 'Risiko gemeinsam tragen', 'Weiß ich noch nicht']],
    uitsluitingen: ['Was wollen Sie unbedingt vermeiden?', ['Einen langen Vertrag', 'Unerwartete Kosten', 'Viel eigene Arbeit', 'Keine harten Ausschlüsse']],
    fase: ['Wie weit sind Sie damit?', ['Ich erkunde noch', 'Schon etwas versucht', 'Bereit zur Umsetzung', 'Weiß ich noch nicht']]
  }
};

// Dit zijn herstelvragen, geen vast pad. De AI kiest normaal de meest onderscheidende vraag.
const PROFIELEN = [
  { id: 'logistiek', re: /fulfil|fulfill|magazijn|warehouse|logistiek|versand|order.*verzend/, velden: ['onderwerp', 'omvang', 'regio', 'eisen', 'termijn', 'budget'],
    nl: { omvang: ['Hoeveel bestellingen gaan er per maand de deur uit?', ['Tot 100 orders', '100 tot 500', '500 tot 2.000', 'Meer dan 2.000', 'Weet ik nog niet']], eisen: ['Wat moet de partner vooral goed kunnen?', ['Dezelfde dag verzenden', 'Retouren afhandelen', 'Bijzondere producten', 'Meerdere landen', 'Weet ik nog niet']] },
    en: { omvang: ['How many orders are shipped each month?', ['Up to 100 orders', '100 to 500', '500 to 2,000', 'Over 2,000', 'Not sure yet']], eisen: ['What must the partner handle well?', ['Same-day shipping', 'Returns', 'Special products', 'Multiple countries', 'Not sure yet']] },
    de: { omvang: ['Wie viele Bestellungen versenden Sie monatlich?', ['Bis 100 Bestellungen', '100 bis 500', '500 bis 2.000', 'Mehr als 2.000', 'Weiß ich noch nicht']], eisen: ['Was muss der Partner besonders gut können?', ['Versand am selben Tag', 'Retouren', 'Besondere Produkte', 'Mehrere Länder', 'Weiß ich noch nicht']] } },
  { id: 'juridisch', re: /advocaat|juridis|rechtszaak|conflict|verjaring|lawyer|legal|litigation|anwalt|rechtsstreit/, velden: ['onderwerp', 'doel', 'fase', 'regio', 'termijn', 'budget'],
    nl: { fase: ['Wat ligt er al om op voort te bouwen?', ['Alleen mijn verhaal', 'Documenten en bewijs', 'Een eerder advies', 'Een lopende procedure', 'Weet ik nog niet']], termijn: ['Is er een bekende termijn die eerst gecontroleerd moet worden?', ['Ja, deze week', 'Ja, later', 'Niet bekend', 'Geen bekende termijn']] },
    en: { fase: ['What is already available to build on?', ['Only my account', 'Documents and evidence', 'Previous advice', 'Ongoing proceedings', 'Not sure yet']], termijn: ['Is there a known deadline to check first?', ['Yes, this week', 'Yes, later', 'Not known', 'No known deadline']] },
    de: { fase: ['Worauf lässt sich bereits aufbauen?', ['Nur meine Schilderung', 'Dokumente und Beweise', 'Ein früheres Gutachten', 'Ein laufendes Verfahren', 'Weiß ich noch nicht']], termijn: ['Muss zuerst eine bekannte Frist geprüft werden?', ['Ja, diese Woche', 'Ja, später', 'Nicht bekannt', 'Keine bekannte Frist']] } },
  { id: 'personeel', re: /personeel|interim|recruit|vacature|staff|employee|mitarbeiter|personal/, velden: ['onderwerp', 'doel', 'omvang', 'regio', 'termijn', 'eisen'],
    nl: { omvang: ['Welke inzet moet de partij kunnen leveren?', ['Een korte opdracht', 'Enkele dagen per week', 'Voltijd', 'Een heel team', 'Weet ik nog niet']] },
    en: { omvang: ['What level of support is needed?', ['A short assignment', 'A few days weekly', 'Full time', 'A whole team', 'Not sure yet']] },
    de: { omvang: ['Welcher Einsatz wird benötigt?', ['Ein kurzer Auftrag', 'Einige Tage pro Woche', 'Vollzeit', 'Ein ganzes Team', 'Weiß ich noch nicht']] } },
  { id: 'overname', re: /bedrijf.*(kopen|verkopen)|overname|acquisition|sell.*company|buy.*company|firma.*(kaufen|verkaufen)/, velden: ['onderwerp', 'doel', 'omvang', 'eisen', 'regio', 'termijn'], nl: {}, en: {}, de: {} },
  { id: 'groei', re: /omzet|klanten|leads|revenue|customers|umsatz|kunden/, velden: ['situatie', 'onderwerp', 'doel', 'fase', 'eisen', 'budget'],
    nl: { situatie: ['Waar merk je het probleem het eerst?', ['Minder aanvragen', 'Minder aankopen', 'Klanten vertrekken', 'Te weinig marge', 'Weet ik nog niet']] },
    en: { situatie: ['Where do you notice the problem first?', ['Fewer enquiries', 'Fewer purchases', 'Customers leave', 'Margins are too low', 'Not sure yet']] },
    de: { situatie: ['Wo bemerken Sie das Problem zuerst?', ['Weniger Anfragen', 'Weniger Käufe', 'Kunden gehen', 'Zu wenig Marge', 'Weiß ich noch nicht']] } }
];

export function profielVan(s) {
  // Browserlocatie en websitetekst bepalen nooit wat iemand zoekt.
  const eigen = (s.stappen || []).filter(x => x.wie === 'bezoeker').map(x => x.zei).join(' ');
  if (/interim|vacature|operations manager|recruit|new employee|mitarbeiter/.test(eigen.toLowerCase())) return PROFIELEN.find(p => p.id === 'personeel');
  return PROFIELEN.find(p => p.re.test(eigen.toLowerCase())) || { id: 'algemeen', velden: ['situatie', 'doel', 'onderwerp', 'omvang', 'regio', 'eisen', 'termijn', 'budget'] };
}

export function feitenBij(s, antwoord, j = {}) {
  s.feiten = s.feiten || {}; s.onbekend = s.onbekend || []; s.gevraagd = s.gevraagd || [];
  if (s.veld && VELDEN.includes(s.veld)) {
    if (onbekend(antwoord)) { s.onbekend = [...new Set([...s.onbekend, s.veld])]; delete s.feiten[s.veld]; }
    else if (antwoord && !breed(antwoord)) { s.feiten[s.veld] = { waarde: kort(antwoord), bewijs: kort(antwoord) }; s.onbekend = s.onbekend.filter(x => x !== s.veld); }
  }
  // Alleen een letterlijk citaat uit een bezoekersantwoord kan een nieuw feit onderbouwen.
  // Een gewijzigde waarde moet uit het nieuwste antwoord komen; zo kan een oude aanname niet terugkomen.
  const alle = (s.stappen || []).filter(x => x.wie === 'bezoeker').map(x => norm(x.zei));
  // Ook letterlijk onderbouwde kaartvelden terugnemen: de AI kan een citaat in de kaart zetten
  // maar het per ongeluk uit de extra feitenlijst weglaten. Dit gebruikt nooit browsergegevens.
  for (const [rij, veld] of [['waar','regio'], ['wanneer','termijn'], ['budget','budget'], ['mits','eisen'], ['niet','uitsluitingen']]) {
    const bewijs = kort(j.kaart?.[rij] || ''), n = norm(bewijs);
    if (n.length < 3 || onbekend(bewijs) || !alle.some(x => x.includes(n))) continue;
    if (s.feiten[veld] && !norm(antwoord).includes(n)) continue;
    s.feiten[veld] = { waarde: bewijs, bewijs }; s.onbekend = s.onbekend.filter(x => x !== veld);
  }
  for (const f of Array.isArray(j.feiten) ? j.feiten.slice(0, 12) : []) {
    if (!f || !VELDEN.includes(f.veld)) continue;
    const bewijs = kort(f.bewijs || ''), n = norm(bewijs);
    if (n.length < 3 || breed(bewijs) || onbekend(bewijs) || !alle.some(x => x.includes(n))) continue;
    if (s.feiten[f.veld] && !norm(antwoord).includes(n)) continue;
    s.feiten[f.veld] = { waarde: bewijs, bewijs }; s.onbekend = s.onbekend.filter(x => x !== f.veld);
  }
  for (const f of Array.isArray(j.onbekend) ? j.onbekend.slice(0, 10) : []) {
    if (!f || !VELDEN.includes(f.veld)) continue;
    const bewijs = norm(f.bewijs);
    if (bewijs.length < 3 || !norm(antwoord).includes(bewijs) || !/weet.*niet|niet.*bekend|nog niet|not.*(known|decided|sure)|don t know|undecided|noch nicht|weiss.*nicht|nicht bekannt/.test(bewijs)) continue;
    delete s.feiten[f.veld]; s.onbekend = [...new Set([...s.onbekend, f.veld])];
  }
  return s.feiten;
}

export function vraagPlan(s) {
  const p = profielVan(s), bekend = Object.keys(s.feiten || {}), gevraagd = s.gevraagd || [];
  const ontbreekt = p.velden.filter(f => !bekend.includes(f) && !(s.kaart?.richting === 'heeft' && f === 'budget'));
  const vers = ontbreekt.filter(f => !gevraagd.includes(f));
  return { versie: VRAAG_VERSIE, profiel: p.id, bekend: s.feiten || {}, onbekend: s.onbekend || [], niet_opnieuw: [...new Set([...bekend, ...gevraagd])], nog_nodig: vers,
    regel: 'Kies de ontbrekende informatie die ongeschikte partijen het beste uitsluit. Een browserlocatie is geen gewenste werkregio. Weet ik niet is geen voorkeur en geen harde eis.' };
}

export function herstelVraag(s, taal = 'nl') {
  const p = profielVan(s), plan = vraagPlan(s), f = plan.nog_nodig[0];
  if (!f) return null;
  const [vraag, pills] = p[taal]?.[f] || ALG[taal]?.[f] || ALG.nl[f];
  return { vraag, pills, sleutel: f, veld: f, meer: false, klaar: false,
    waarom: ({ nl: 'Dit helpt ons bepalen welke partij echt past.', en: 'This helps identify which party fits.', de: 'So lässt sich eine passende Partei finden.' })[taal] || '' };
}

export function keurVraag(a, s, taal) {
  const veld = VELDEN.includes(a.veld) ? a.veld : VELDEN.includes(a.sleutel) ? a.sleutel : '';
  const pills = [...new Set((a.pills || []).map(x => String(x).trim()).filter(Boolean))];
  const mist = kaartKwaliteit(s).mist;
  const moetEerst = s.n >= 4 && mist.length && !mist.includes(veld);
  const fout = moetEerst || (s.kaart?.richting === 'heeft' && veld === 'budget') || !veld || (s.gevraagd || []).includes(veld) || !!s.feiten?.[veld] || !a.vraag?.includes('?') || pills.length < 2 || pills.length > 6 || pills.some(x => x.length > 52 || x.split(/\s+/).length > 7);
  const h = fout ? herstelVraag(s, taal) : null;
  return h ? { ...a, ...h, hersteld: true } : fout ? { ...a, klaar: true, vraag: '', pills: [] } : { ...a, veld, pills, sleutel: veld };
}

export function kaartKwaliteit(s) {
  const f = s.feiten || {}, mist = [];
  if (!f.onderwerp || breed(f.onderwerp.waarde) || /^(een dienst|een product|een bedrijf|mensen of capaciteit|a service|a product|a company|people or capacity|eine dienstleistung|ein produkt|ein unternehmen)$/.test(norm(f.onderwerp.waarde))) mist.push('onderwerp');
  if (!f.doel && !f.situatie) mist.push('doel');
  const nodig = ({ logistiek: ['omvang', 'regio', 'eisen'], juridisch: ['fase', 'regio'], personeel: ['omvang', 'regio', 'termijn'], overname: ['omvang', 'eisen'] })[profielVan(s).id] || [];
  for (const veld of nodig) if (!f[veld] && !(s.onbekend || []).includes(veld)) mist.push(veld);
  return { versie: VRAAG_VERSIE, gereed: mist.length === 0, mist, onbekend: s.onbekend || [], bevestigd: !!s.bevestigd, profiel: profielVan(s).id };
}

export function vraagSpoor(a, s) {
  const q = [VRAAG_VERSIE, profielVan(s).id, a.veld || a.sleutel, a.vraag, ...(a.pills || [])].join('|');
  return { id: id(q), groep: id([VRAAG_VERSIE, profielVan(s).id, a.veld || a.sleutel].join('|')), tip: a.zeg ? id(VRAAG_VERSIE + '|' + a.zeg) : '', veld: a.veld || a.sleutel, vraag: a.vraag, pills: a.pills || [], zeg: a.zeg || '', versie: VRAAG_VERSIE };
}

export async function telVraag(kv, spoor, gebeurtenis) {
  if (!spoor?.id || !/^[a-z_]+$/.test(gebeurtenis)) return;
  try { for (const k of ['gw:q:' + spoor.id, ...(spoor.groep ? ['gw:qgroep:' + spoor.groep] : []), ...(spoor.tip ? ['gw:tip:' + spoor.tip] : [])]) { await kv.raw(['HINCRBY', k, gebeurtenis, 1]); await kv.raw(['EXPIRE', k, 120 * 86400]); } } catch {}
}

export function criteriaKaart(s) {
  const f = s.feiten || {}, k = { ...s.kaart };
  if (f.onderwerp) { const veld = k.richting === 'heeft' ? 'biedt' : 'zoekt'; if (!k[veld]) k[veld] = f.onderwerp.waarde; }
  k.doel = f.doel?.waarde || f.situatie?.waarde || '';
  // Deze velden werden eerder soms ingevuld uit de browser of uit een AI-aanname.
  for (const [veld, rij] of [['regio', 'waar'], ['termijn', 'wanneer'], ['budget', 'budget'], ['eisen', 'mits'], ['uitsluitingen', 'niet']]) k[rij] = f[veld]?.waarde || '';
  const rest = [f.omvang?.waarde, f.fase?.waarde].filter(Boolean).join('. ');
  if (rest) k.mits = [k.mits, rest].filter(Boolean).join('. ').slice(0, 400);
  return k;
}

export async function uitkomstLessen(kv, profiel) {
  try {
    const lessen = [];
    const tellingen = await Promise.all(VELDEN.map(veld => kv.raw(['HGETALL', 'gw:qgroep:' + id([VRAAG_VERSIE, profiel, veld].join('|'))])));
    for (let v = 0; v < VELDEN.length; v++) {
      const veld = VELDEN[v], r = tellingen[v], n = {}; for (let i = 0; i < r.length; i += 2) n[r[i]] = Number(r[i + 1]) || 0;
      if ((n.antwoord || 0) < 20) continue;
      // Geen tekst of feiten van een ander gesprek meegeven aan de volgende bezoeker.
      lessen.push({ veld, getoond: n.getoond || 0, beantwoord: n.antwoord || 0, onbekend: n.onbekend || 0, kaart_bevestigd: n.kaart_bevestigd || 0, match_bevestigd: n.match_bevestigd || 0, niet_passend: n.niet_passend || 0 });
    }
    return { lessen, regel: 'Dit zijn waarnemingen, geen causaal bewijs. Gebruik ze alleen bij een inhoudelijk passende ontbrekende vraag. Geen winnaar bij minder dan 30 bevestigde kaarten en 10 beoordeelde uitkomsten.' };
  } catch { return { lessen: [], regel: 'Nog onvoldoende eigen uitkomsten.' }; }
}
