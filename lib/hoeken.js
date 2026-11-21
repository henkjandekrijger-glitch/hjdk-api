// Testhoeken van Kadoly (21 nov 2026, Henkjan over de aparte hoek Rust & ritueel: "Slim ! Dat gaan we met veel meer tests doen ." en
// "JA doe dat . En vind nog meer leveranciers we gaan ze allemaal testen .").
// Werkwijze: elke nieuwe leverancier of niche krijgt een eigen verborgen hoek (eigen categoriepagina /categorie/<id>, niet in het
// hoofdmenu, niet op de homepage, niet tussen de rest; wel in Google Shopping met custom_label_2 = <id>, in de zoekresultaten, op de
// gidsen en als link onderaan de site). De shop zet op elke pagina van een hoek data-hoek="<id>", zodat Clickmind de hoek apart telt.
// Oordeel na OORDEEL_DAGEN dagen of OORDEEL_BEZOEK bezoekers (wat eerst komt):
//   menu: winst per bezoeker hoger dan de rest van Kadoly  -> de hoek gaat het hoofdmenu in (Henkjans woord vragen);
//   uit:  geen verkoop na OORDEEL_BEZOEK bezoekers, of verlies op de advertenties -> offline (niet verwijderen);
//   anders: doorlopen tot het volgende oordeel. In elke hoek blijft de keuring gelden: EUR 15 marge per verkoop, of in een pakket.
// Dit bestand is de bron: een nieuwe hoek = één regel in HOEKEN; leveranciers van Droppery koppel je met LEVERANCIER_HOEK.
import { kv } from './db.js';

export const HOEK_REGEL = { OORDEEL_DAGEN: 14, OORDEEL_BEZOEK: 500, MIN_MARGE: 15 };

// status: gebouwd (staat in de feed), wacht (op account, goedkeuring of de shop), idee (nog onderzoeken)
export const HOEKEN = [
  { id: 'rust-ritueel', naam: 'Rust & ritueel', bron: 'AW Dropship EU', status: 'gebouwd', sinds: '2026-11-21', feed: '/api/dp?op=awfeed', vraag: 'edelstenen 213.517, diffusers 123.288, wierook 38.859, klankschaal 9.398 per maand',
    wacht: 'shop: TAAK A' },
  { id: 'kinderkamer', naam: 'Kinderkamer', bron: 'Droppery: KidsDepot', status: 'gebouwd', sinds: '2026-11-21', feed: '/api/dp?op=feed (veld hoek)', wacht: 'shop: TAAK D punt 8' },
  { id: 'kerstverlichting', naam: 'Kerstverlichting', bron: 'Droppery: Winterhome', status: 'gebouwd', sinds: '2026-11-21', feed: '/api/dp?op=feed (veld hoek)', wacht: 'shop: TAAK D punt 8' },
  { id: 'verlichting-design', naam: 'Designverlichting', bron: 'Droppery: Emibig lighting', status: 'gebouwd', sinds: '2026-11-21', feed: '/api/dp?op=feed (veld hoek)', wacht: 'shop: TAAK D punt 8' },
  { id: 'met-naam', naam: 'Met naam', bron: 'Gelato (reserve: Prodigi)', status: 'wacht', vraag: 'gepersonaliseerde cadeaus 102.009 per maand (NL en BE)',
    wacht: 'Henkjan: account bij Gelato (gratis plan, API-sleutel); daarna bouw ik naamposter, sterrenkaart en mok met naam en de bestanden per order' },
  { id: 'geborduurd', naam: 'Geborduurd met naam', bron: 'Printful (Letland en Spanje)', status: 'idee', wacht: 'na Met naam: badjas, hoodie en babydekentje met geborduurde naam' },
  { id: 'merken-eu', naam: 'Kleine Europese merken', bron: 'Syncee (account bestaat al)', status: 'idee', wacht: 'nagaan of Syncee een feed of API voor een eigen winkel geeft' },
];

// Droppery-leverancier -> hoek (nieuwe leveranciers zijn eerst een test; Modus Furniture en Bazar Bizar staan al gewoon in de winkel)
export const LEVERANCIER_HOEK = { 'KidsDepot': 'kinderkamer', 'Winterhome': 'kerstverlichting', 'Emibig lighting': 'verlichting-design' };
export const hoekVanLeverancier = l => LEVERANCIER_HOEK[String(l || '').trim()] || null;

// Controle: per hoek wat er in de feed staat (uit de laatste keuringen), wat er nog wacht en wanneer het oordeel valt.
export async function hoekenStand() {
  const [aw, dp] = await Promise.all([kv.get('aw:keur').catch(() => null), kv.get('dp:api:keur').catch(() => null)]);
  const perLev = (dp && dp.perLeverancier) || {};
  const plus = (d, n) => new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);
  return HOEKEN.map(h => {
    let inFeed = null;
    if (h.id === 'rust-ritueel' && aw) inFeed = (aw.stand && aw.stand.inWinkel) || 0;
    const levs = Object.entries(LEVERANCIER_HOEK).filter(([, id]) => id === h.id).map(([l]) => l);
    if (levs.length) inFeed = levs.reduce((s, l) => s + (perLev[l] || 0), 0);
    return Object.assign({}, h, { inFeed, oordeel: h.sinds ? plus(h.sinds, HOEK_REGEL.OORDEEL_DAGEN) + ' of na ' + HOEK_REGEL.OORDEEL_BEZOEK + ' bezoekers' : null,
      meting: 'Clickmind telt de hoek zodra de shop data-hoek="' + h.id + '" op de pagina zet' });
  });
}
