// Markten van Sealed Intent (Henkjan 21 nov 2026: "Laten we meteen naar andere sealed intents kijken en generiek maken", en op het voorstel
// met de vier mails: "Ok ja gebruik die").
// Elke sealed intent is dezelfde zin: niet te koop, niet op zoek, niet van plan te wisselen, maar onder deze voorwaarden wel.
// Een markt is één blokje: wie verklaart (houder), wie betaalt (betaler), twee grove indelingen (groep en klasse), de prijs en de woorden
// voor de mails. De motor (lib/sealed-mail.js) is voor elke markt gelijk: uitnodigen, vastleggen per antwoordmail, kaart en aantallen terug,
// de AI ertussen, eerste ronde gratis, daarna VERDER, twee keer JA.
// - Een markt gaat pas open voor houders als er DREMPEL betalers in dezelfde groep staan: de eerste mail aan een houder noemt een echt getal.
// - klaar: false = de gespreksmails van die markt (lead, vraag, antwoord) zijn nog niet door Henkjan gezien; de motor weigert dan elke mail.
//   Openzetten: woorden en en de aanvullen, de mails van op=nodig&proef=1&markt=<markt> aan Henkjan laten zien, daarna klaar: true.
// - Codes van klassen zijn per markt uniek (rol-..., hotel-...), zodat een houder nooit bij een betaler uit een andere markt past.
// - Alleen wie over eigen bezit of eigen loopbaan beslist mag verklaren. Een manager over de contracten van zijn werkgever hoort hier niet
//   (geheimhouding, omkoping; zie het onderzoek van 18 nov in de overdracht).
import { SECTORS, SIZES } from './sealed-anonymous.js';

export const DREMPEL = 5;

export const MARKT = {
  bedrijf: {
    klaar: true, prijs: 250, type: 'sale', groepen: SECTORS, klassen: SIZES, intake: ['kopers', 'buyers', 'kaeufer', 'henkjan'],
    ai: { wat: 'a business', doen: 'sell it', klasse: 'yearly profit or EBITDA of the business' },
    w: {
      nl: { betaler: 'koper', betalers: 'kopers', houder: 'eigenaar', houders: 'eigenaren', zoekOnderwerp: 'Welke bedrijven zoek je?', zouden: 'zouden verkopen', ookAls: 'ook als hun bedrijf nergens te koop staat', zoekVoorbeeld: 'installatietechniek, 1 tot 3 miljoen winst',
        ding: 'een bedrijf als het jouwe', zoek: (s, g) => (s || 'een bedrijf in de sector ' + g) + ' zoeken', jouwDing: 'jouw bedrijf', weten: 'Het staat niet te koop, dat weten we.', vraag: 'onder welke voorwaarden zou je wél verkopen?', voorbeeld: 'Alleen als het team blijft en ik nog twee jaar meedraai.', jeDing: 'je bedrijf',
        klasseVraag: ['Nog één ding: hoe groot is het bedrijf?', 'hoeveel winst maakt het bedrijf ongeveer per jaar? Antwoord in één regel, bijvoorbeeld: "1 tot 3 miljoen".'] },
      en: { betaler: 'buyer', betalers: 'buyers', houder: 'owner', houders: 'owners', zoekOnderwerp: 'Which businesses are you looking for?', zouden: 'would sell', ookAls: 'even when their business is not for sale anywhere', zoekVoorbeeld: 'building services, 1 to 3 million profit',
        ding: 'a business like yours', zoek: (s, g) => s || 'a business in ' + g, jouwDing: 'your business', weten: 'It is not for sale, we know that.', vraag: 'on what terms would you sell after all?', voorbeeld: 'Only if the team stays and I remain involved for two more years.', jeDing: 'your business',
        klasseVraag: ['One more thing: how large is the business?', 'roughly how much profit does the business make per year? Reply in one line, for example: "1 to 3 million".'] },
      de: { betaler: 'Käufer', betalers: 'Käufer', houder: 'Inhaber', houders: 'Inhaber', zoekOnderwerp: 'Welche Firmen suchen Sie?', zouden: 'verkaufen würden', ookAls: 'auch wenn ihre Firma nirgends zum Verkauf steht', zoekVoorbeeld: 'Gebäudetechnik, 1 bis 3 Millionen Gewinn',
        ding: 'eine Firma wie Ihre', zoek: (s, g) => s || 'eine Firma in der Branche ' + g, jouwDing: 'Ihre Firma', weten: 'Sie steht nicht zum Verkauf, das wissen wir.', vraag: 'Zu welchen Bedingungen würden Sie doch verkaufen?', voorbeeld: 'Nur wenn das Team bleibt und ich noch zwei Jahre dabei bin.', jeDing: 'Ihre Firma',
        klasseVraag: ['Noch eine Sache: Wie groß ist die Firma?', 'wie viel Gewinn macht die Firma ungefähr pro Jahr? Antworten Sie in einer Zeile, zum Beispiel: "1 bis 3 Millionen".'] },
    },
  },
  // Rol: bestuurder, partner met eigen klanten of medisch specialist die niet op zoek is, maar bij het juiste aanbod wel zou overstappen.
  rol: {
    klaar: false, prijs: 250, type: 'career', intake: ['kantoren', 'firms', 'kanzleien'],
    groepen: ['rol-recht', 'rol-fiscaal', 'rol-accountancy', 'rol-advies', 'rol-zorg', 'other'], klassen: ['rol-250k', 'rol-1m', 'rol-3m', 'rol-3m-plus'],
    ai: { wat: 'a senior position with their own clients', doen: 'move to another firm', klasse: 'yearly revenue from their own clients' },
    lab: { nl: { kop: ['Vakgebied', 'Omzet eigen praktijk per jaar', 'Voorwaarden'], groep: ['Advocatuur en notariaat', 'Fiscaal', 'Accountancy', 'Advies en consultancy', 'Medisch specialist', 'Anders'], klasse: ['tot € 250.000', '€ 250.000 tot 1 miljoen', '€ 1 tot 3 miljoen', 'meer dan € 3 miljoen'] } },
    w: {
      nl: { betaler: 'kantoor', betalers: 'kantoren', houder: 'partner', houders: 'partners', zoekOnderwerp: 'Welke partners zoeken jullie?', zouden: 'zouden overstappen', ookAls: 'ook als ze nergens op zoek zijn', zoekVoorbeeld: 'ondernemingsrecht, praktijk van 1 tot 3 miljoen',
        ding: 'een partner als jij', zoek: (s, g) => (s || 'een partner in ' + g) + ' zoeken', jouwDing: 'jouw praktijk', weten: 'Je bent niet op zoek, dat weten we.', vraag: 'onder welke voorwaarden zou je wél overstappen?', voorbeeld: 'Alleen als mijn team meekomt en ik mijn eigen klanten houd.', jeDing: 'je kantoor',
        klasseVraag: ['Nog één ding: hoe groot is je praktijk?', 'hoeveel omzet maak je ongeveer per jaar met je eigen klanten? Antwoord in één regel, bijvoorbeeld: "1 tot 3 miljoen".'] },
    },
  },
  // Hotel: eigenaar die niet van plan is te wisselen, maar onder voorwaarden wel van keten of formule zou veranderen.
  hotel: {
    klaar: false, prijs: 250, type: 'purchase', intake: ['ketens', 'chains', 'ketten'],
    groepen: ['hotel-benelux', 'hotel-dach', 'hotel-zuid', 'hotel-uk', 'hotel-amerika', 'other'], klassen: ['hotel-50', 'hotel-150', 'hotel-300', 'hotel-300-plus'],
    ai: { wat: 'a hotel', doen: 'switch to another hotel chain or brand', klasse: 'number of rooms' },
    lab: { nl: { kop: ['Regio', 'Aantal kamers', 'Voorwaarden'], groep: ['Benelux', 'Duitsland, Oostenrijk en Zwitserland', 'Zuid-Europa', 'Verenigd Koninkrijk en Ierland', 'Noord- en Zuid-Amerika', 'Anders'], klasse: ['tot 50 kamers', '50 tot 150 kamers', '150 tot 300 kamers', 'meer dan 300 kamers'] } },
    w: {
      nl: { betaler: 'keten', betalers: 'ketens', houder: 'hoteleigenaar', houders: 'hoteleigenaren', zoekOnderwerp: 'Welke hotels zoeken jullie?', zouden: 'van keten of formule zouden wisselen', ookAls: 'ook als ze niet van plan zijn te wisselen', zoekVoorbeeld: 'Benelux, 50 tot 150 kamers',
        ding: 'een hotel als het jouwe', zoek: (s, g) => (s || 'een hotel in ' + g) + ' zoeken', jouwDing: 'jouw hotel', weten: 'Je bent niet van plan te wisselen, dat weten we.', vraag: 'onder welke voorwaarden zou je wél van keten wisselen?', voorbeeld: 'Alleen als de naam van het hotel blijft en de afdracht onder de 5 procent ligt.', jeDing: 'je hotel',
        klasseVraag: ['Nog één ding: hoe groot is het hotel?', 'hoeveel kamers heeft het hotel? Antwoord in één regel, bijvoorbeeld: "80 kamers".'] },
    },
  },
};

export const marktVan = rec => (rec && MARKT[rec.markt] ? rec.markt : 'bedrijf');
export const woorden = (markt, taal) => { const M = MARKT[markt] || MARKT.bedrijf; return M.w[taal] || M.w.nl; };
// Het label van een groep of klasse in een markt zonder eigen vertaaltabel in sealed-lp.js (alles behalve bedrijf).
export function marktLabel(markt, taal, soort, v) {
  const M = MARKT[markt]; if (!M || !M.lab) return null; const L = M.lab[taal] || M.lab.nl, i = (soort === 'groep' ? M.groepen : M.klassen).indexOf(v);
  return i < 0 ? v : (soort === 'groep' ? L.groep : L.klasse)[i];
}
export const marktBijIntake = lokaal => Object.keys(MARKT).find(m => MARKT[m].intake.includes(lokaal)) || null;
