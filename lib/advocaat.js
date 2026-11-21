// Advocaten vergelijken per gemeente op keuzehulp.best (19 nov 2026). Henkjan: "En advocaten en dergelijke ? Die moeten we echt per advocaat
// vindbaar gaan maken via LLM en dan aanbieding doen voor meer bekendheid ." en "Nee !! Alle advocaten kantoren en / of advocaten in NL !!".
// Demand Radar 19 nov: een AI zonder internet geeft bij "advocaat" geen eerste keus, alleen verenigingen en platforms. Dat gat vullen wij:
// per gemeente een gerangschikte, uitlegbare lijst kantoren, per kantoor een pagina met de advocaten die de eigen site noemt.
//
// Zelfde opzet als lib/makelaar.js (en die helpers worden hergebruikt: gemeentegrens, punt in grens, ophalen van sites, review-JSON-LD,
// consensus van meningen, opmaak en de klik- en aanvraagscripts).
// Bronnen (gratis, per kantoor te controleren):
// - Kantoren: OpenStreetMap office=lawyer binnen de gemeentegrens. Overpass (7 spiegels), dan ohsome, dan Nominatim. Geen verzonnen kantoren.
//   Notarissen, deurwaarders, het Juridisch Loket en rechtsbijstandverzekeraars vallen eruit.
// - Eigen website (scan, cron, 30 dagen geldig): rechtsgebieden, gefinancierde rechtsbijstand (toevoeging), uurtarief of vaste prijs, gratis
//   eerste gesprek, links naar reviewplatforms (cijfer en aantal alleen uit hun eigen JSON-LD) en de namen en functies van de advocaten zoals
//   de site ze toont (teampagina).
// - Meningen van bezoekers in de chat (anoniem): alleen de consensus vanaf 3 meningen.
// Plaatsen: Demand Radar thema advocaat gaf op 19 nov 22:11 UTC 503 (dagrem), dus we beginnen met de 40 grootste gemeenten op inwonertal
// (AlleCijfers.nl op basis van CBS, 1 januari 2026, gelezen 19 november 2026). Uitbreidbaar naar alle 342: zet een regel in PLAATSEN.
// KV: adv:k:<plaats> kantoren, adv:t:<plaats> laatst ververst, adv:sc:<plaats> scan per kantoor, adv:mnl:<plaats> meningen,
// adv:lead:<id> aanvraag (180 dagen), adv:leadids, adv:leadn, adv:leadp, adv:leadd:<dag>, adv:tikd:<dag>, adv:tik:<plaats>, adv:ping.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { kzuxBlok } from './kzux.js';
import { esc, slugify, rooster, telLink, telTekst, webLink, webTekst, routeLink, osmLink, afstand, datumNL, CSS as RCSS } from './rdam.js';
import { grens, binnen, SPIEGELS, haal, kaal, aggUit, consensus, MK_CSS, MKJS } from './makelaar.js';

const HOST = 'keuzehulp.best', B = 'https://' + HOST;
export const MIN = 5; // minder kantoren: noindex en niet in de sitemap
export const MIN_RG = 5; // een pagina per rechtsgebied alleen vanaf 5 kantoren (geen dunne pagina's)
const UA = 'keuzehulp.best/1.0 (advocaten vergelijken; +https://keuzehulp.best/advocaat)';
const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|python|curl|wget|axios|node-fetch|httpclient|monitor/i;
const WA = '31655395630';
// de 40 grootste gemeenten op inwonertal (AlleCijfers.nl, 1 januari 2026); c = ongeveer het centrum, voor buursteden en als noodvak
export const PLAATSEN = [
  ['amsterdam', 'Amsterdam', 'Amsterdam', 941927, 52.37, 4.90], ['rotterdam', 'Rotterdam', 'Rotterdam', 673804, 51.92, 4.48], ['den-haag', 'Den Haag', 'Den Haag', 569468, 52.08, 4.31],
  ['utrecht', 'Utrecht', 'Utrecht', 378121, 52.09, 5.12], ['eindhoven', 'Eindhoven', 'Eindhoven', 249783, 51.44, 5.48], ['groningen', 'Groningen', 'Groningen', 244427, 53.22, 6.57],
  ['almere', 'Almere', 'Almere', 232619, 52.37, 5.21], ['tilburg', 'Tilburg', 'Tilburg', 230746, 51.56, 5.09], ['breda', 'Breda', 'Breda', 190204, 51.59, 4.78],
  ['nijmegen', 'Nijmegen', 'Nijmegen', 189871, 51.84, 5.86], ['arnhem', 'Arnhem', 'Arnhem', 171822, 51.98, 5.91], ['apeldoorn', 'Apeldoorn', 'Apeldoorn', 169212, 52.21, 5.97],
  ['haarlem', 'Haarlem', 'Haarlem', 168898, 52.38, 4.64], ['haarlemmermeer', 'Haarlemmermeer', 'Haarlemmermeer', 166978, 52.30, 4.69], ['zaanstad', 'Zaanstad', 'Zaanstad', 165201, 52.44, 4.83],
  ['amersfoort', 'Amersfoort', 'Amersfoort', 163764, 52.16, 5.39], ['enschede', 'Enschede', 'Enschede', 162683, 52.22, 6.89], ['den-bosch', 'Den Bosch', "'s-Hertogenbosch", 162295, 51.69, 5.30],
  ['zwolle', 'Zwolle', 'Zwolle', 134147, 52.51, 6.09], ['zoetermeer', 'Zoetermeer', 'Zoetermeer', 130836, 52.06, 4.49], ['leiden', 'Leiden', 'Leiden', 130328, 52.16, 4.49],
  ['leeuwarden', 'Leeuwarden', 'Leeuwarden', 130162, 53.20, 5.80], ['maastricht', 'Maastricht', 'Maastricht', 126026, 50.85, 5.69], ['ede', 'Ede', 'Ede', 125331, 52.04, 5.67],
  ['dordrecht', 'Dordrecht', 'Dordrecht', 122991, 51.81, 4.67], ['westland', 'Westland', 'Westland', 118874, 51.99, 4.21], ['alphen-aan-den-rijn', 'Alphen aan den Rijn', 'Alphen aan den Rijn', 117284, 52.13, 4.66],
  ['alkmaar', 'Alkmaar', 'Alkmaar', 113196, 52.63, 4.75], ['delft', 'Delft', 'Delft', 110089, 52.01, 4.36], ['emmen', 'Emmen', 'Emmen', 109881, 52.79, 6.90],
  ['deventer', 'Deventer', 'Deventer', 105111, 52.25, 6.16], ['venlo', 'Venlo', 'Venlo', 104195, 51.37, 6.17], ['helmond', 'Helmond', 'Helmond', 96860, 51.48, 5.66],
  ['purmerend', 'Purmerend', 'Purmerend', 96182, 52.50, 4.95], ['amstelveen', 'Amstelveen', 'Amstelveen', 95840, 52.30, 4.86], ['oss', 'Oss', 'Oss', 95549, 51.77, 5.52],
  ['hilversum', 'Hilversum', 'Hilversum', 94595, 52.22, 5.18], ['land-van-cuijk', 'Land van Cuijk', 'Land van Cuijk', 93645, 51.69, 5.90], ['sittard-geleen', 'Sittard-Geleen', 'Sittard-Geleen', 92461, 51.00, 5.87],
  ['hoeksche-waard', 'Hoeksche Waard', 'Hoeksche Waard', 91445, 51.77, 4.47],
].map(([slug, naam, osm, inw, la, lo]) => ({ slug, naam, osm, inw, c: [la, lo] }));
const P = Object.fromEntries(PLAATSEN.map(p => [p.slug, p]));
export const isPlaats = s => !!P[s];
// Alle gemeenten van Nederland in één keuzehulp (20 nov 2026, Henkjan: "Voor de tigste keer ik wil ALLE kantoren uit NL in 1 keuzehulp daar
// zullen dan ook rotterdams bij zitten"). verversNL haalt in één Overpass-vraag alle gemeenten (admin_level 8, met hun grens) en per gemeente de
// advocatenkantoren op; de gemeenten buiten PLAATSEN staan in adv:gem en vullen P aan. De cron ververst daarna per gemeente op de exacte grens.
let GEMT = 0;
async function gem() { if (Date.now() - GEMT < 300000) return; GEMT = Date.now(); const l = await kv.get('adv:gem').catch(() => null); (Array.isArray(l) ? l : []).forEach(g => { if (g && g.slug && g.naam && !P[g.slug]) P[g.slug] = { slug: g.slug, naam: g.naam, osm: g.osm || g.naam, inw: g.inw || 0, c: g.c }; }); }
const alle = () => Object.values(P);
const BRON_GEM = ['AlleCijfers.nl, grootste gemeenten in inwoners (1 januari 2026, gelezen 19 november 2026)', 'https://allecijfers.nl/ranglijst/grootste-en-kleinste-gemeenten-in-inwoners-in-nederland/'];
const dagIso = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const datumKort = t => new Date(t).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' });
const komma = (n, d = 1) => (+n).toFixed(d).replace('.', ',');
const eur = v => '€ ' + Number(v).toLocaleString('nl-NL');
const hash = s => createHash('sha256').update(String(s) + '|' + (process.env.CRON_SECRET || 'adv')).digest('hex').slice(0, 20);
const wacht = ms => new Promise(r => setTimeout(r, ms));
const kortDesc = t => { t = String(t); if (t.length <= 155) return t; const k = t.slice(0, 154); return k.slice(0, k.lastIndexOf(' ')).replace(/[,.:;]$/, '') + '.'; };
const lijstNL = l => l.length < 2 ? (l[0] || '') : l.slice(0, -1).join(', ') + ' en ' + l[l.length - 1];

// ---------- feiten met bron (gelezen 19 november 2026) ----------
const BRON = {
  rb: ['Raad voor Rechtsbijstand, eigen bijdrage (bijgewerkt 18 augustus 2026)', 'https://www.rechtsbijstand.nl/mediation-rechtsbijstand/hoeveel-betalen/eigen-bijdrage'],
  jl: ['Raad voor Rechtsbijstand, gratis telefoonnummer Juridisch Loket (24 januari 2023)', 'https://www.rvr.org/@12806/nieuwe-koers-nieuw-gratis-telefoonnummer'],
  ro: ['Rijksoverheid, hulp bij een juridisch probleem of conflict (gewijzigd 9 juni 2026)', 'https://www.rijksoverheid.nl/onderwerpen/bescherming-van-consumenten/vraag-en-antwoord/waar-kan-ik-terecht-voor-hulp-bij-een-juridisch-probleem-of-conflict'],
  nova: ['Nederlandse orde van advocaten, tableau (gewijzigd 28 april 2026)', 'https://www.advocatenorde.nl/tableau'],
};
const ZOEK = 'https://zoekeenadvocaat.advocatenorde.nl/';
const bronA = k => '<a href="' + esc(BRON[k][1]) + '" target="_blank" rel="noopener nofollow">' + esc(BRON[k][0]) + '</a>';
const VAST_FAQ = {
  gratis: (pl, n) => ['Kan ik gratis juridisch advies krijgen in ' + pl + '?', 'Ja. Bij het Juridisch Loket krijg je gratis advies als je een laag inkomen en weinig spaargeld hebt (onder de grens voor gefinancierde rechtsbijstand); bellen kan gratis via 0800-8020. Volgens de Rijksoverheid krijg je in veel gevallen gratis informatie en advies.' + (n ? ' Daarnaast noemen ' + n + ' kantoren in ' + pl + ' op hun eigen site een gratis eerste gesprek.' : '') + ' Bronnen: Raad voor Rechtsbijstand (24 januari 2023) en Rijksoverheid (9 juni 2026).'],
  toev: (pl, n) => ['Hoe werkt gefinancierde rechtsbijstand (een toevoeging)?', 'De overheid betaalt dan een deel van je advocaat en jij betaalt een eigen bijdrage. Volgens de Raad voor Rechtsbijstand kan dat als je fiscaal jaarinkomen niet hoger is dan € 35.400 (alleenstaand) of € 50.000 (samen of met kinderen) en je vermogen niet hoger dan € 36.952 per persoon. De eigen bijdrage voor een advocaat is € 257 tot € 1.084, bij personen- en familierecht € 448 tot € 1.120, afhankelijk van je inkomen. Je advocaat vraagt de toevoeging aan.' + (n ? ' ' + n + ' kantoren in ' + pl + ' noemen toevoegingen op hun eigen site.' : '') + ' Bron: rechtsbijstand.nl, bijgewerkt 18 augustus 2026.'],
  check: ['Hoe kijk ik na of iemand echt advocaat is?', 'Elke advocaat staat ingeschreven op het tableau van de Nederlandse orde van advocaten (artikel 8 Advocatenwet); dat is dus geen keurmerk, en we geven er geen punten voor. Zoek de naam op in Zoek een advocaat van de Orde (zoekeenadvocaat.advocatenorde.nl). Daar staat ook op welke rechtsgebieden iemand zich heeft geregistreerd.'],
};

// ---------- rechtsgebieden (scan van de eigen site) ----------
export const RG = [
  ['arbeidsrecht', 'Arbeidsrecht', /arbeidsrecht|ontslagrecht|ontslagzaken/],
  ['familierecht', 'Familierecht', /familierecht|personen-? en familierecht|jeugdrecht|omgangsregeling|gezag en omgang/],
  ['echtscheiding', 'Echtscheiding', /echtscheiding|scheidingsadvoca|alimentatie|scheidingsbemiddeling/],
  ['strafrecht', 'Strafrecht', /strafrecht|strafzaken|strafpleit|verkeersstrafrecht/],
  ['huurrecht', 'Huurrecht', /huurrecht/],
  ['letselschade', 'Letselschade', /letselschade|personenschade|medische aansprakelijkheid/],
  ['ondernemingsrecht', 'Ondernemingsrecht', /ondernemingsrecht|vennootschapsrecht/],
  ['contractenrecht', 'Contractenrecht', /contractenrecht|verbintenissenrecht|commercial contracts/],
  ['vreemdelingenrecht', 'Vreemdelingenrecht', /vreemdelingenrecht|migratierecht|immigratierecht|asielrecht|asielzaken/],
  ['sociaal-zekerheidsrecht', 'Sociaal zekerheidsrecht', /sociaal ?zekerheidsrecht|socialezekerheidsrecht|uitkeringsrecht/],
  ['erfrecht', 'Erfrecht', /erfrecht|nalatenschap/],
  ['bestuursrecht', 'Bestuursrecht', /bestuursrecht|omgevingsrecht/],
  ['vastgoedrecht', 'Vastgoed- en bouwrecht', /vastgoedrecht|bouwrecht|aanbestedingsrecht/],
  ['insolventierecht', 'Insolventierecht', /insolventierecht|faillissementsrecht|herstructurering/],
  ['incasso', 'Incasso', /incasso(?!bureau)/],
  ['intellectueel-eigendom', 'Intellectueel eigendom', /intellectueel eigendom|merkenrecht|auteursrecht|octrooirecht/],
  ['belastingrecht', 'Belastingrecht', /belastingrecht|fiscaal recht/],
  ['consumentenrecht', 'Consumentenrecht', /consumentenrecht/],
  ['gezondheidsrecht', 'Gezondheidsrecht', /gezondheidsrecht|tuchtrecht zorg|wet zorg en dwang|psychiatrisch patiëntenrecht|patiëntenrecht/],
  ['verzekeringsrecht', 'Verzekeringsrecht', /verzekeringsrecht/],
];
const RGN = Object.fromEntries(RG.map(([s, n]) => [s, n]));
const isRg = s => !!RGN[s];
const GERESERVEERD = new Set(RG.map(r => r[0]).concat(['voor-kantoren', 'sitemap-xml']));

// ---------- de Keuzehulp-score ----------
export const WEGING = [
  { k: 'gegevens', naam: 'Gegevens compleet en te controleren', max: 15, uitleg: 'adres, telefoon en website staan in OpenStreetMap: 5 punten per gegeven', bron: 'OpenStreetMap' },
  { k: 'rg', naam: 'Rechtsgebieden duidelijk op de eigen site', max: 15, uitleg: 'de site noemt met name in welke rechtsgebieden het kantoor werkt, zoals arbeidsrecht of familierecht; dan weet je of je aan het goede adres bent', bron: 'eigen website van het kantoor, met de datum van controle' },
  { k: 'team', naam: 'Advocaten met naam op de site', max: 5, uitleg: 'de site laat zien welke advocaten er werken, met naam en functie; dan weet je wie je zaak doet', bron: 'eigen website van het kantoor' },
  { k: 'prijs', naam: 'Prijs of tarief op de eigen site', max: 15, uitleg: 'een uurtarief of een vaste prijs staat op de site; dan weet je vooraf waar je aan toe bent', bron: 'eigen website van het kantoor' },
  { k: 'gratis', naam: 'Gratis eerste gesprek', max: 5, uitleg: 'de site noemt een gratis of kosteloos eerste gesprek of kennismaking', bron: 'eigen website van het kantoor' },
  { k: 'toev', naam: 'Gefinancierde rechtsbijstand (toevoeging)', max: 10, uitleg: 'het kantoor zegt op de site dat het zaken op toevoeging doet; dan kun je er ook terecht met een laag inkomen', bron: 'eigen website van het kantoor' },
  { k: 'reviews', naam: 'Reviews op andere platforms', max: 25, uitleg: 'cijfer en aantal van Klantenvertellen, Kiyoh, Feedback Company en Trustpilot, elk naar een schaal van 5; elke review telt één keer, samen met 10 denkbeeldige reviews van 4 sterren zodat een paar reviews niet alles bepalen. 3 sterren of lager is 0 punten, 5 sterren 25', bron: 'de pagina van het platform zelf, met link' },
  { k: 'meningen', naam: 'Meningen van bezoekers', max: 10, uitleg: 'het gemiddelde van de anonieme meningen in onze chat, pas vanaf 3 meningen; uitschieters tellen niet mee. 1 ster is 0 punten, 5 sterren 10', bron: 'keuzehulp.best, één mening per persoon per kantoor' },
];
const REV_PRIOR = 4, REV_M = 10;
const gegPunten = x => (x.adres ? 5 : 0) + (x.tel ? 5 : 0) + (x.web ? 5 : 0);
export function punten(x, sc, mn) {
  const ok = sc && sc.t && !sc.fout, p = { gegevens: gegPunten(x) };
  p.rg = ok && sc.rg && sc.rg.length ? 15 : 0;
  p.team = ok && sc.adv && sc.adv.length ? 5 : 0;
  p.prijs = ok && sc.prijs && sc.prijs.length ? 15 : 0;
  p.gratis = ok && sc.gratis ? 5 : 0;
  p.toev = ok && sc.toev === true ? 10 : 0;
  const rv = (sc && sc.rev) || []; let n = 0, T = 0; rv.forEach(r => { n += r.aantal; T += r.aantal * (r.score / r.max * 5); });
  const B5 = n ? (T + REV_M * REV_PRIOR) / (n + REV_M) : null, gem5 = n ? T / n : null;
  p.reviews = B5 == null ? 0 : Math.round(25 * Math.max(0, Math.min(1, (B5 - 3) / 2)));
  p.meningen = mn ? Math.round(10 * Math.max(0, Math.min(1, (mn.gem - 1) / 4))) : 0;
  return { p, tot: Object.values(p).reduce((a, b) => a + b, 0), nrev: n, gem5 };
}
// geen advocatenkantoor volgens de eigen site (geen woord advocaat of advocatuur): niet in de ranglijst
const geenAdv = sc => !!(sc && sc.t && !sc.fout && sc.advWoord === false);
export function rang(items, scan, men) {
  return items.filter(x => !geenAdv(scan[x.s])).map(x => { const sc = scan[x.s] || null, mn = consensus(men[x.s] || [], THEMA); return { x, sc, mn, q: punten(x, sc, mn) }; })
    .sort((a, b) => b.q.tot - a.q.tot || b.q.nrev - a.q.nrev || b.q.p.gegevens - a.q.p.gegevens || a.x.naam.localeCompare(b.x.naam, 'nl'));
}
// waarom op deze plek, in gewone woorden (voor de eerste FAQ en het korte antwoord)
function redenen(r) {
  const { sc, q, mn } = r, l = [];
  if (q.p.reviews) l.push('reviews gemiddeld ' + komma(q.gem5) + ' van 5 uit ' + q.nrev + ' reviews op ' + lijstNL(sc.rev.map(z => z.platform)));
  if (q.p.prijs) l.push('een tarief op de eigen site (' + sc.prijs.map(z => z.tekst).join(', ') + ')');
  if (q.p.toev) l.push('doet zaken op toevoeging');
  if (q.p.gratis) l.push('gratis eerste gesprek');
  if (q.p.rg) l.push('noemt ' + (sc.rg.length > 3 ? sc.rg.length + ' rechtsgebieden' : lijstNL(sc.rg.map(s => RGN[s].toLowerCase()))) + ' op de site');
  if (q.p.team) l.push(sc.adv.length + (sc.adv.length === 1 ? ' advocaat' : ' advocaten') + ' met naam op de site');
  if (mn) l.push('bezoekers geven gemiddeld ' + komma(mn.gem) + ' van 5');
  if (!l.length && q.p.gegevens) l.push('adres, telefoon en website zijn compleet');
  return l;
}

// ---------- meningen: alleen de consensus (functie uit lib/makelaar.js, met onderwerpen voor advocaten) ----------
const THEMA = [
  ['communicatie', /communic|bereikbaar|terugbel|terug gebeld|reageer|reageren|reactie|contact|op de hoogte|informeer|geinformeerd|geïnformeerd|uitleg|duidelijk/],
  ['deskundigheid', /deskundig|kundig|kennis|ervaren|ervaring|professio|vakkundig|expert|specialist/],
  ['resultaat', /gewonnen|verloren|resultaat|uitkomst|zaak|rechter|schikking|vonnis/],
  ['kosten', /prijs|kosten|duur|goedkoop|tarief|betaalbaar|rekening|declaratie|uurtarief/],
  ['snelheid', /snel|vlot|traag|langzaam|duurde lang|op tijd/],
  ['betrokkenheid', /vriendelijk|aardig|prettig|betrokken|persoonlijk|meedenk|meegedacht|empathi|luister|onbeschoft|arrogant/],
];
async function meningen(slug) {
  const l = await kv.raw(['LRANGE', 'adv:mnl:' + slug, '0', '4999']).catch(() => null) || [], uit = {};
  for (const r of l) { try { const m = typeof r === 'string' ? JSON.parse(r) : r; if (m && m.s) (uit[m.s] = uit[m.s] || []).push(m); } catch (e) {} }
  return uit;
}
export async function meningPost(req, b, o = {}) {
  await gem();
  b = b || {}; const pl = String(b.pl || ''), s = String(b.s || '').replace(/[^a-z0-9-]/g, '').slice(0, 90), st = Math.round(Number(b.st)), sid = String(b.sid || '').slice(0, 60);
  const fout = { ok: false, tekst: 'Dat lukte niet. Probeer het later nog eens.' };
  if (!P[pl] || !s || !(st >= 1 && st <= 5) || b.website || !(Number(b.ms) > 4000) || !sid || BOT.test(String(req.headers['user-agent'] || ''))) return fout;
  const x0 = await data(pl); if (!x0 || !x0.items.some(i => i.s === s)) return fout;
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), ih = hash('ip:' + ip), k = pl + '/' + s;
  if (o.test) return { ok: true, test: true, tekst: 'Test: mening goedgekeurd, niet opgeslagen.' };
  const a = await kv.raw(['SET', 'adv:mnip:' + k + ':' + ih, '1', 'NX', 'EX', String(365 * 86400)]).catch(() => 'OK');
  const c = await kv.raw(['SET', 'adv:mnsid:' + k + ':' + hash('sid:' + sid), '1', 'NX', 'EX', String(365 * 86400)]).catch(() => 'OK');
  if (!a || !c) return { ok: false, al: true, tekst: 'Je gaf al eerder je mening over dit kantoor. Dank je.' };
  const dk = 'adv:mndag:' + dagIso() + ':' + ih, nd = await kv.incr(dk).catch(() => 1); if (nd === 1) await kv.raw(['EXPIRE', dk, '90000']).catch(() => {}); if (nd > 10) return fout;
  const t = String(b.t || '').replace(/\S+@\S+/g, ' ').replace(/(\+?\d[\d\s().-]{6,}\d)/g, ' ').replace(/https?:\/\/\S+|www\.\S+/g, ' ').replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280);
  await kv.raw(['LPUSH', 'adv:mnl:' + pl, JSON.stringify({ s, st, t, d: dagIso(), i: ih.slice(0, 8) })]); await kv.raw(['LTRIM', 'adv:mnl:' + pl, '0', '4999']).catch(() => {});
  await kv.raw(['HINCRBY', 'adv:mnd:' + dagIso(), pl, '1']).catch(() => {});
  return { ok: true, tekst: 'Dank je. We plaatsen nooit een losse mening. Zodra er 3 of meer meningen over dit kantoor zijn, tonen we het gemiddelde en de rode draad, en telt het mee in de Keuzehulp-score.' };
}

// ---------- aanvragen: gratis eerste gesprek (opgeslagen en geteld, niet doorgestuurd: dat beslist Henkjan) ----------
const MAIL = /^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i, TEL = /^\+?[\d\s().-]{9,16}$/;
export async function leadPost(req, b, o = {}) {
  await gem();
  b = b || {}; const pl = String(b.pl || ''), s = String(b.s || '').replace(/[^a-z0-9-]/g, '').slice(0, 90);
  const rg = RGN[b.rg] ? b.rg : 'anders', contact = String(b.contact || '').trim().slice(0, 80), naam = String(b.naam || '').replace(/[<>"@\d]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const oms = String(b.oms || '').replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500), ua = String(req.headers['user-agent'] || '');
  if (b.website || BOT.test(ua) || !(Number(b.ms) > 2500)) return { ok: false, tekst: 'Dat lukte niet. Probeer het later nog eens.' };
  if (!P[pl]) return { ok: false, tekst: 'Kies eerst een kantoor.' };
  const x0 = await data(pl), x = x0 && x0.items.find(i => i.s === s); if (!x) return { ok: false, tekst: 'Dit kantoor staat niet (meer) in onze lijst.' };
  if (!(MAIL.test(contact) || (TEL.test(contact) && contact.replace(/\D/g, '').length >= 9))) return { ok: false, tekst: 'Vul een telefoonnummer of e-mailadres in, dan kan het kantoor je bereiken.' };
  if (!(b.ok === '1' || b.ok === true || b.ok === 'on')) return { ok: false, tekst: 'Vink aan dat we je aanvraag aan dit kantoor mogen doorgeven.' };
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), ih = hash('ip:' + ip);
  const dk = 'adv:leadip:' + dagIso() + ':' + ih, nd = o.test ? 1 : await kv.incr(dk).catch(() => 1); if (nd === 1) await kv.raw(['EXPIRE', dk, '90000']).catch(() => {}); if (nd > 5) return { ok: false, tekst: 'Je hebt vandaag al een paar aanvragen gedaan. Bel het kantoor gerust zelf.' };
  const id = randomBytes(6).toString('hex'), k = pl + '/' + s, test = !!o.test;
  const fn = (String(req.headers.cookie || '').match(/(?:^|;\s*)mmp=([0-9a-f]{16})/) || [])[1] || '';
  const rec = { id, t: new Date().toISOString(), pl, plaats: P[pl].naam, s, kantoor: x.naam, kantoorTel: x.tel || '', kantoorWeb: x.web || '', rg, naam, contact, oms, sid: hash('sid:' + String(b.sid || '')).slice(0, 10), fn: fn ? hash('fn:' + fn).slice(0, 10) : '' };
  if (test) { rec.test = true; await kv.set('adv:lead:' + id, rec, { ex: 3600 }); return { ok: true, test: true, id, tekst: 'Test opgeslagen (1 uur), niet geteld.' }; }
  await kv.set('adv:lead:' + id, rec, { ex: 180 * 86400 });
  await kv.raw(['LPUSH', 'adv:leadids', id]); await kv.raw(['LTRIM', 'adv:leadids', '0', '4999']).catch(() => {});
  await kv.raw(['HINCRBY', 'adv:leadn', k, '1']).catch(() => {}); await kv.raw(['HINCRBY', 'adv:leadp', pl, '1']).catch(() => {});
  await kv.raw(['HINCRBY', 'adv:leadd:' + dagIso(), pl + ':' + rg, '1']).then(() => kv.raw(['EXPIRE', 'adv:leadd:' + dagIso(), String(400 * 86400)])).catch(() => {});
  try { if (fn) { const F = await import('./funnel.js'); await F.funnelStap(fn, 'lead', 'advocaat-' + pl); } } catch (e) {}
  try { const I = await import('./intentie.js'); await I.intentieLog(kv, { site: 'nl', q: 'advocaat ' + (RGN[rg] ? RGN[rg].toLowerCase() + ' ' : '') + P[pl].naam, slug: 'advocaat-' + pl, bron: 'lead' }, req); } catch (e) {}
  try { const tot = await kv.raw(['HGET', 'adv:leadp', pl]); const sl = process.env.MELD_SLEUTEL; if (sl) await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': sl }, body: JSON.stringify({ bron: 'keuzehulp.best advocaten', tekst: 'Nieuwe aanvraag eerste gesprek (' + (RGN[rg] || 'ander rechtsgebied') + ') voor ' + x.naam + ' in ' + P[pl].naam + '. ' + tot + ' aanvragen in ' + P[pl].naam + ' tot nu toe. Niet doorgestuurd; gegevens staan in de beschermde lijst (tool=adv op=leads).' }), signal: AbortSignal.timeout(8000) }); } catch (e) {}
  return { ok: true, tekst: 'Dank je' + (naam ? ', ' + naam.split(' ')[0] : '') + '. Je aanvraag voor ' + x.naam + ' staat bij ons. We nemen contact met je op over het eerste gesprek.' + (x.tel ? ' Liever meteen contact? Bel ' + telTekst(x.tel) + '.' : '') };
}
export async function leads(n = 50) {
  const ids = await kv.raw(['LRANGE', 'adv:leadids', '0', String(n - 1)]).catch(() => []) || [];
  const l = (await Promise.all(ids.map(id => kv.get('adv:lead:' + id).catch(() => null)))).filter(Boolean);
  return { ok: true, n: l.length, leads: l };
}

// ---------- tikken en bezoek ----------
export async function tik(b) {
  await gem();
  b = b || {}; const pl = P[b.pl] ? b.pl : ['hub', 'voor-kantoren'].includes(b.pl) ? b.pl : '', e = ['zie', 'bel', 'route', 'web', 'offerte', 'mening', 'wa'].includes(b.e) ? b.e : '', s = String(b.s || '').replace(/[^a-z0-9-]/g, '').slice(0, 90);
  if (!pl || !e) return { ok: false };
  const dk = 'adv:tikd:' + dagIso();
  if (e === 'zie') { const bron = ['google', 'bing', 'ai', 'direct', 'intern', 'overig'].includes(b.b) ? b.b : 'overig'; await kv.raw(['HINCRBY', dk, 'zie:' + pl, '1']).then(() => kv.raw(['HINCRBY', dk, 'bron:' + bron, '1'])).catch(() => {}); }
  else { await kv.raw(['HINCRBY', dk, e + ':' + pl, '1']).catch(() => {}); if (s && P[pl]) await kv.raw(['HINCRBY', 'adv:tik:' + pl, s + ':' + e, '1']).catch(() => {}); }
  await kv.raw(['EXPIRE', dk, String(400 * 86400)]).catch(() => {});
  return { ok: true };
}

// ---------- kantoren uit OpenStreetMap (Overpass, ohsome, Nominatim) ----------
async function overpass(bbox, st, tot) {
  const q = '[out:json][timeout:90][bbox:' + bbox.join(',') + '];nwr["office"="lawyer"];out center tags;';
  const t0 = Date.now(), start = Math.floor(Date.now() / 3600000) % SPIEGELS.length;
  for (let i = 0; i < SPIEGELS.length; i++) { const u = SPIEGELS[(start + i) % SPIEGELS.length]; if (Date.now() - t0 > tot) break; const h = u.split('/')[2].split('.')[0];
    try { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(Math.max(5000, Math.min(60000, tot - (Date.now() - t0) + 1000))) });
      st.push(h + ':' + r.status); if (!r.ok) continue; const j = await r.json(); if (j && Array.isArray(j.elements) && !/error/i.test(String(j.remark || ''))) return j.elements; st.push(h + ':remark'); } catch (e) { st.push(h + ':' + String(e.name || e).slice(0, 16)); } }
  return null;
}
async function ohsome(bbox, st) {
  const [s, w, n, e] = bbox;
  try { const r = await fetch('https://api.ohsome.org/v1/elements/centroid', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA }, body: new URLSearchParams({ bboxes: [w, s, e, n].join(','), filter: 'office=lawyer and name=*', properties: 'tags' }).toString(), signal: AbortSignal.timeout(45000) });
    st.push('ohsome:' + r.status); if (!r.ok) return null; const j = await r.json(); if (!j || !Array.isArray(j.features)) return null;
    return j.features.map(f => { const p = f.properties || {}, [type, id] = String(p['@osmId'] || '').split('/'), c = (f.geometry && f.geometry.coordinates) || []; const tags = {}; for (const [k, v] of Object.entries(p)) if (!k.startsWith('@')) tags[k] = v; return { type: type || 'node', id, lat: c[1], lon: c[0], tags }; }).filter(x => x.id && x.lat != null);
  } catch (er) { st.push('ohsome:' + String(er.name || er).slice(0, 16)); return null; }
}
async function nominatim(bbox, st, tot = 200000) {
  const [s, w, n, e] = bbox, uit = new Map(), t0 = Date.now();
  const ny = Math.max(1, Math.ceil((n - s) / 0.05)), nx = Math.max(1, Math.ceil((e - w) / 0.075)), vakken = [];
  for (let i = 0; i < ny; i++) for (let k = 0; k < nx; k++) vakken.push([s + (n - s) * i / ny, w + (e - w) * k / nx, s + (n - s) * (i + 1) / ny, w + (e - w) * (k + 1) / nx]);
  const vraag = async (vb, q, excl) => { await wacht(1050); try { const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&extratags=1&addressdetails=1&limit=40&bounded=1&viewbox=' + vb.join(',') + '&q=' + encodeURIComponent(q) + (excl.length ? '&exclude_place_ids=' + excl.join(',') : ''), { headers: { 'user-agent': UA, 'accept-language': 'nl' }, signal: AbortSignal.timeout(15000) }); if (r.status !== 200) st.push('nom:' + r.status); return r.ok ? await r.json() : null; } catch (er) { st.push('nom:' + String(er.name || er).slice(0, 16)); return null; } };
  const loop = async (vb, q, max) => { const excl = []; for (let pg = 0; pg < max; pg++) { if (Date.now() - t0 > tot) return; const l = await vraag(vb, q, excl); if (!Array.isArray(l) || !l.length) return; l.forEach(x => { excl.push(x.place_id); const k = x.osm_type + x.osm_id; if (!uit.has(k)) uit.set(k, x); }); if (l.length < 40) return; } };
  for (const [s2, w2, n2, e2] of vakken.slice(0, 60)) await loop([w2, n2, e2, s2], '[office=lawyer]', 6);
  st.push('vakken:' + vakken.length);
  for (const q of ['advocaat', 'advocaten', 'advocatenkantoor']) await loop([w, n, e, s], q, 3);
  return [...uit.values()].map(x => { const a = x.address || {}, et = x.extratags || {}; return { type: String(x.osm_type || 'node'), id: x.osm_id, lat: +x.lat, lon: +x.lon, tags: { ...et, name: x.name || et.name || '', [x.category]: x.type, 'addr:street': a.road || '', 'addr:housenumber': a.house_number || '', 'addr:postcode': a.postcode || '', 'addr:city': a.city || a.town || a.village || '' } }; });
}
// geen advocatenkantoor: notaris, deurwaarder, Juridisch Loket, rechtswinkel, rechtsbijstandverzekeraar, mediation zonder advocaat
const NIET_ADV = /notari|notaris|deurwaard|juridisch loket|rechtswinkel|sociaal raadslie|\bdas\b|arag|achmea rechtsbijstand|rechtsbijstandverzeker|incassobureau|belastingadvies|accountant|administratiekantoor|octrooibureau|merkenbureau/i;
const isAdv = (t, naam) => (t.office === 'lawyer' || (/advoca/i.test(naam) && (t.office || t.shop || t.amenity))) && !NIET_ADV.test(naam) && !(/mediat/i.test(naam) && !/advoca/i.test(naam));
export async function ververs(slug, o = {}) {
  await gem();
  const p = P[slug]; if (!p) return { ok: false, fout: 'plaats' };
  const t0 = Date.now(), st = [], g = await grens(p);
  const bbox = g && g.bbox ? g.bbox : [p.c[0] - 0.07, p.c[1] - 0.11, p.c[0] + 0.07, p.c[1] + 0.11];
  let els = o.zonderOverpass ? null : await overpass(bbox, st, 120000), bron = 'overpass';
  if (!els) { els = await ohsome(bbox, st); bron = 'ohsome'; if (els && !els.length) els = null; }
  if (!els) { els = await nominatim(bbox, st, Math.max(30000, 270000 - (Date.now() - t0))); bron = 'nominatim'; if (!els.length) els = null; }
  if (!els) return { ok: false, fout: 'geen bron', grens: g && g.fout ? g.fout : 'ok', status: st, ms: Date.now() - t0 };
  const oud = await data(slug).catch(() => null);
  const nb = (lat, lon) => g && g.rings ? binnen(lat, lon, g.rings) : afstand({ lat, lon }, { lat: p.c[0], lon: p.c[1] }) < 7;
  const { items, slugs } = maakItems(els, oud, nb, p.naam);
  if (bron === 'nominatim' && oud) oud.items.forEach(i => { if (!items.some(x => x.id === i.id) && !slugs.has(i.s)) { slugs.add(i.s); items.push(i); } }); // Nominatim vindt niet alles
  if (!items.length && oud && oud.items.length) return { ok: false, fout: 'leeg, oude lijst gehouden', status: st };
  items.sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  const uit = { t: new Date().toISOString(), n: items.length, bron, items };
  await kv.set('adv:k:' + slug, uit); await kv.set('adv:t:' + slug, String(Date.now())).catch(() => {});
  return { ok: true, plaats: slug, n: items.length, bron, grens: g && g.rings ? 'gemeentegrens' : 'noodvak', status: st, ms: Date.now() - t0 };
}
// kantoren uit OSM-elementen (ververs per gemeente en verversNL); slugs blijven gelijk aan de vorige keer
function maakItems(els, oud, nb, plaatsNaam) {
  const gezien = new Set(), slugs = new Set(), items = [];
  for (const e of els) {
    const t = e.tags || {}, naam = String(t.name || '').trim(); if (!naam || t.highway || t.disused || t['disused:office'] || /^(yes|no)$/i.test(naam)) continue;
    if (!isAdv(t, naam)) continue;
    const lat = e.lat ?? (e.center && e.center.lat), lon = e.lon ?? (e.center && e.center.lon); if (lat == null || !nb(+lat, +lon)) continue;
    const id = String(e.type)[0] + e.id, dub = naam.toLowerCase() + '|' + String(t['addr:postcode'] || '').replace(/\s/g, '') + '|' + (t['addr:housenumber'] || ''); if (gezien.has(dub)) continue; gezien.add(dub);
    const vorig = oud && oud.items.find(i => i.id === id);
    let s = vorig ? vorig.s : (slugify(naam) || id); if (GERESERVEERD.has(s)) s += '-kantoor'; if (slugs.has(s)) s += '-' + (String(t['addr:postcode'] || '').replace(/\s/g, '').toLowerCase() || id); if (slugs.has(s)) s += '-' + id; slugs.add(s);
    items.push({ s, id, naam: naam.slice(0, 90), lat: +(+lat).toFixed(5), lon: +(+lon).toFixed(5), adres: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '), pc: t['addr:postcode'] || '', plaats: t['addr:city'] || plaatsNaam,
      tel: t.phone || t['contact:phone'] || '', web: t.website || t['contact:website'] || t.url || '', mail: t.email || t['contact:email'] || '', uren: t.opening_hours || '', rolstoel: t.wheelchair || '' });
  }
  return { items, slugs };
}
// Heel Nederland in één keer: alle gemeenten (admin_level 8) met hun middelpunt en inwonertal uit OSM, en per gemeente de kantoren binnen de
// gemeentegrens (Overpass rekent de grens zelf). Schrijft adv:gem (gemeentelijst) en adv:k:<gemeente>; een gemeente die al vanavond per
// grens ververst is, wordt alleen overschreven als de nieuwe lijst niet kleiner is.
const NL_Q = '[out:json][timeout:280];area["ISO3166-1"="NL"]["admin_level"="2"]->.nl;rel(area.nl)["boundary"="administrative"]["admin_level"="8"]->.gs;foreach.gs->.g(.g out center tags;.g map_to_area->.a;nwr(area.a)["office"="lawyer"];out center tags;);';
const GEM_SLUG = { "'s-gravenhage": 'den-haag', 'den haag': 'den-haag', "'s-hertogenbosch": 'den-bosch' };
export async function verversNL() {
  await gem(); const t0 = Date.now(), st = []; let els = null;
  for (const u of SPIEGELS) { if (Date.now() - t0 > 200000) break; const h = u.split('/')[2].split('.')[0];
    try { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA }, body: 'data=' + encodeURIComponent(NL_Q), signal: AbortSignal.timeout(Math.max(20000, 285000 - (Date.now() - t0))) });
      st.push(h + ':' + r.status); if (!r.ok) continue; const j = await r.json(); if (j && Array.isArray(j.elements) && j.elements.length && !/error|timed out/i.test(String(j.remark || ''))) { els = j.elements; break; } st.push(h + ':remark ' + String(j && j.remark || '').slice(0, 60)); } catch (e) { st.push(h + ':' + String(e.name || e).slice(0, 16)); } }
  if (!els) return { ok: false, fout: 'overpass', status: st, ms: Date.now() - t0 };
  const bijOsm = Object.fromEntries(PLAATSEN.map(p => [p.osm.toLowerCase(), p])), groep = new Map(); let cur = null;
  for (const e of els) {
    if (e.type === 'relation') { const t = e.tags || {}, naam = String(t.name || '').trim(); if (!naam) { cur = null; continue; }
      const vast = bijOsm[naam.toLowerCase()], slug = vast ? vast.slug : GEM_SLUG[naam.toLowerCase()] || slugify(naam);
      cur = { slug, naam: vast ? vast.naam : naam, osm: naam, inw: vast ? vast.inw : (parseInt(String(t.population || '').replace(/\D/g, ''), 10) || 0), c: e.center ? [+(+e.center.lat).toFixed(3), +(+e.center.lon).toFixed(3)] : vast ? vast.c : null };
      if (GERESERVEERD.has(cur.slug)) cur.slug += '-gemeente'; if (!groep.has(cur.slug)) groep.set(cur.slug, { g: cur, els: [] }); continue; }
    if (cur) groep.get(cur.slug).els.push(e);
  }
  const lijst = [...groep.values()].filter(o => o.g.c), uit = { gemeenten: lijst.length, metKantoren: 0, kantoren: 0, geschreven: 0 };
  await kv.set('adv:gem', lijst.map(o => o.g)); GEMT = 0; await gem();
  for (let k = 0; k < lijst.length; k += 15) await Promise.all(lijst.slice(k, k + 15).map(async ({ g, els: el }) => {
    const oud = await kv.get('adv:k:' + g.slug).catch(() => null), { items } = maakItems(el, oud, () => true, g.naam);
    if (items.length) { uit.metKantoren++; uit.kantoren += items.length; }
    if (oud && oud.items && oud.items.length > items.length) return; // de grens-ververs vond er meer: die houden
    if (!items.length && !oud) return;
    items.sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
    await kv.set('adv:k:' + g.slug, { t: new Date().toISOString(), n: items.length, bron: 'overpass-nl', items }); await kv.set('adv:t:' + g.slug, String(Date.now())).catch(() => {}); uit.geschreven++;
  }));
  pakketCache.clear();
  return { ok: true, ...uit, status: st, ms: Date.now() - t0 };
}
export async function data(slug) { await gem(); return P[slug] ? await kv.get('adv:k:' + slug).catch(() => null) : null; }
export async function alleData() { await gem(); const l = alle(), v = await Promise.all(l.map(p => data(p.slug))); return l.map((p, i) => ({ p, x: v[i] })); }
// de plaats die het langst niet ververst is (eerst de plaatsen zonder data, grootste eerst); mislukt het, dan over 6 dagen opnieuw aan de beurt
export async function verversOudste() {
  await gem(); const l = alle(); const v = await kv.mget(...l.map(p => 'adv:t:' + p.slug)).catch(() => []);
  let best = l[0].slug, bt = Infinity; l.forEach((p, i) => { const t = Number(v[i]) || 0; if (t < bt) { bt = t; best = p.slug; } });
  const r = await ververs(best); if (!r.ok) await kv.set('adv:t:' + best, String(Date.now() - 6 * 864e5)).catch(() => {}); return r;
}

// ---------- scan van de eigen website ----------
const PLATF = [[/(^|\.)klantenvertellen\.nl$/, 'Klantenvertellen', 10], [/(^|\.)kiyoh\.(com|nl)$/, 'Kiyoh', 10], [/(^|\.)feedbackcompany\.(com|nl)$/, 'Feedback Company', 10], [/(^|\.)trustpilot\.com$/, 'Trustpilot', 5]];
const TOEV = /toevoeging|gefinancierde rechtsbijstand|gesubsidieerde rechtsbijstand|raad voor rechtsbijstand|pro deo|op basis van een toevoeging/i;
const TOEV_NIET = /(geen|niet|uitsluitend geen)\s+(zaken\s+)?(op\s+)?(basis\s+van\s+)?(een\s+)?(toevoeging|gefinancierde|gesubsidieerde|pro deo)|(toevoeging|pro deo|gefinancierde rechtsbijstand)[^.]{0,40}(niet mogelijk|doen wij niet|bieden wij niet|niet aan)/i;
const GRATIS = /(gratis|kosteloos|kosteloze|vrijblijvend(?:e)? en gratis)\s+(eerste\s+|oriënterend\s+|orienterend\s+|kennismakings?\s*|telefonisch\s+|intake\s*)?(gesprek|consult|adviesgesprek|kennismaking|intake|advies)|eerste (gesprek|consult|kennismaking|kennismakingsgesprek|half uur)[^.]{0,40}(is |zijn )?(gratis|kosteloos)/i;
export function prijsUit(t) {
  t = String(t || ''); const uit = [];
  for (const m of t.matchAll(/€\s?(\d{1,3}(?:\.\d{3})+|\d{2,5})(?:,(?:\d{2}|-))?/g)) {
    const v = +m[1].replace(/\./g, ''), voor = t.slice(Math.max(0, m.index - 100), m.index), na = t.slice(m.index + m[0].length, m.index + m[0].length + 45), dicht = t.slice(Math.max(0, m.index - 45), m.index + m[0].length + 12);
    if (/eigen bijdrage|griffie|toevoeging|rechtsbijstand|boete|schadevergoeding|vergoeding van|alimentatie|transitievergoeding|vordering|salaris|loon|omzet|ton|miljoen/i.test(dicht)) continue;
    if (/^\s*(excl\.?|exclusief|incl\.?|inclusief)?\s*(btw\s*)?(per uur|p\/u|\/uur|per\s+gewerkt uur)|^[^.]{0,25}(per uur|uurtarief)/i.test(na) || /uurtarief[^.€]{0,40}$/i.test(voor)) { if (v >= 60 && v <= 800) uit.push({ soort: 'uur', v, tekst: eur(v) + ' per uur' }); continue; }
    if (/(vaste prijs|vast tarief|vast bedrag|vaste vergoeding|fixed fee|all[- ]?in|pakketprijs)[^.€]{0,60}$/i.test(voor) && v >= 95 && v <= 25000) uit.push({ soort: 'vast', v, tekst: 'vaste prijs vanaf ' + eur(v) });
  }
  const laagst = k => uit.filter(x => x.soort === k).sort((a, b) => a.v - b.v)[0];
  return [laagst('uur'), laagst('vast')].filter(Boolean);
}
// namen van advocaten zoals de site ze toont: "mr. J. de Vries", of een naam met direct erna een functie (advocaat, partner, advocaat-stagiaire)
const TV = "(?:van|de|der|den|ten|ter|te|het|la|le|du|von|'t|in|op|el|al|da|dos|di|van der|van den|van de|in 't)";
const NM = "[A-ZÀ-Ý][a-zà-ÿ'’-]+";
const NAAM_RE = new RegExp('(?:(?:[A-Z]\\.\\s?){1,4}|' + NM + '\\s)(?:' + TV + '\\s)*' + NM + '(?:-' + NM + ')?', 'g');
const FUNCTIE = /^[\s,|:\u00b7\u2022\u2013-]{0,6}(advocaat[- ]stagiaire|advocaat[- ]partner|advocaat en partner|senior advocaat|medior advocaat|junior advocaat|advocaat|partner|of counsel|kantoorgenoot|lawyer|attorney)/i;
const NIET_NAAM = /^(Neem|Contact|Over|Ons|Onze|Lees|Meer|Bel|Mail|Home|Team|Advocaat|Advocaten|Partner|Rechtsgebied|Privacy|Cookie|Nieuws|Blog|Vacature|Kantoor|Welkom|Specialisatie|Familierecht|Arbeidsrecht|Strafrecht|Huurrecht|Letselschade|Bekijk|Volg|Maak|Afspraak|Direct|Wij|Uw|Mr|Mevrouw|De|Het|Een|Wat|Hoe|Waarom|Wie|Juridisch|Gratis|Tarieven|Algemene|Klachten|Route|Telefoon|Email|Adres|Openingstijden|Ma|Di|Wo|Do|Vr|Za|Zo)\b/;
const GEEN_NAAMDEEL = /\b(Advocat\w*|Kantoor|Legal|Law|Lawyers|Rechtsgebied\w*|Team|Partners|Juristen|Mediation|Bureau|Groep|Recht|Contact|Nieuws)\b/;
export const mrNaam = a => (a.mr ? 'mr. ' : '') + a.n;
export function advocatenUit(html) {
  const uit = new Map(), h = String(html || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#039;|&#39;|&rsquo;/g, "'");
  const zet = (n, f, mr) => { n = n.replace(/\s+/g, ' ').trim(); if (n.length < 5 || n.length > 42 || NIET_NAAM.test(n) || GEEN_NAAMDEEL.test(n) || /\d/.test(n)) return; const k = n.toLowerCase(); const o = uit.get(k); if (!o) uit.set(k, { n, f: f.charAt(0).toUpperCase() + f.slice(1).toLowerCase(), mr: !!mr }); else if (mr) o.mr = true; };
  // 1. mr. + naam (in de tekst)
  const tekst = h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const m of tekst.matchAll(new RegExp('\\b[Mm]r\\.?\\s+(?:(?:drs|dr|ir|ing)\\.?\\s+)*((?:[A-Z]\\.\\s?){0,4}(?:' + NM + '\\s)?(?:' + TV + '\\s)*' + NM + '(?:-' + NM + ')?)', 'g'))) { const na = tekst.slice(m.index + m[0].length, m.index + m[0].length + 60).match(FUNCTIE); zet(m[1], na ? na[1] : 'advocaat', true); }
  // 2. naam als kop, link of vet, met direct erna een functie
  for (const m of h.matchAll(/<(h[1-6]|strong|b|a|span|p|div)[^>]*>\s*([^<]{5,48})\s*<\/\1>/gi)) {
    const n = m[2].trim(); if (!new RegExp('^' + NAAM_RE.source + '$').test(n)) continue;
    const na = h.slice(m.index + m[0].length, m.index + m[0].length + 220).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').match(FUNCTIE); if (na) zet(n, na[1]);
  }
  // 3. JSON-LD Person met een functie
  for (const m of String(html || '').matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) { try { const loop = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(loop); if (o['@type'] === 'Person' && o.name && /advoca|partner|counsel|lawyer|attorney/i.test(String(o.jobTitle || ''))) zet(String(o.name), String(o.jobTitle)); Object.values(o).forEach(loop); }; loop(JSON.parse(m[1].trim())); } catch (e) {} }
  return [...uit.values()].slice(0, 40);
}
const SCAN_V = 1;
async function scanEen(x) {
  const uit = { t: Date.now(), v: SCAN_V, rg: [], prijs: [], rev: [], adv: [], toev: null, gratis: '' }; const thuis = await haal(webLink(x.web));
  if (!thuis.t) { uit.fout = thuis.f || thuis.s; return uit; }
  uit.url = thuis.u; let host = ''; try { host = new URL(thuis.u).hostname.replace(/^www\./, ''); } catch (e) {}
  const links = [...thuis.t.matchAll(/href=["']([^"'#]+)["']/gi)].map(m => { try { return new URL(m[1].replace(/&amp;/g, '&'), thuis.u); } catch (e) { return null; } }).filter(Boolean);
  const eigen = links.filter(u => u.hostname.replace(/^www\./, '') === host);
  const kies = re => eigen.find(u => re.test(u.pathname));
  const subs = [['rgUrl', /rechtsgebied|expertise|specialisatie|praktijkgebied|diensten|werkgebied/i], ['prijsUrl', /tarie|kosten|prijs|prijzen|honorari|toevoeging|financi/i], ['teamUrl', /\/(team|ons-team|advocaten|mensen|medewerkers|wie-zijn-wij|over-ons|people|professionals|kantoorgenoten)(\/|$)/i]];
  let html = thuis.t, teamHtml = thuis.t; const gehaald = new Set([thuis.u]);
  for (const [k, re] of subs) { const u = kies(re); if (!u || gehaald.has(u.href)) continue; gehaald.add(u.href); const r = await haal(u.href, 8000); if (r.t) { html += ' ' + r.t; uit[k] = r.u; if (k === 'teamUrl') teamHtml += ' ' + r.t; } }
  const tk = kaal(html), tl = tk.toLowerCase();
  uit.advWoord = /advoca/.test(tl);
  uit.rg = RG.filter(([, , re]) => re.test(tl)).map(([s]) => s);
  uit.toev = TOEV_NIET.test(tk) ? false : TOEV.test(tk) ? true : null;
  const g = tk.match(GRATIS); uit.gratis = g ? g[0].slice(0, 80) : '';
  uit.prijs = prijsUit(tk).map(p => ({ ...p, url: uit.prijsUrl || uit.url }));
  uit.adv = advocatenUit(teamHtml);
  const pl = []; for (const u of links) { const h = u.hostname.replace(/^www\./, ''); const f = PLATF.find(([re]) => re.test(h)); if (f && !pl.some(z => z.naam === f[1]) && u.pathname.length > 3) pl.push({ naam: f[1], max: f[2], url: u.href }); }
  if (!pl.some(z => z.naam === 'Trustpilot') && host) pl.push({ naam: 'Trustpilot', max: 5, url: 'https://nl.trustpilot.com/review/' + host, gok: true });
  for (const z of pl.slice(0, 3)) { const r = await haal(z.url, 8000); const a = r.t ? aggUit(r.t) : null; if (a && a.score <= (a.max || z.max)) uit.rev.push({ platform: z.naam, score: a.score, max: a.max || z.max, aantal: a.aantal, url: r.u || z.url }); }
  return uit;
}
async function scans(slug) { return (await kv.get('adv:sc:' + slug).catch(() => null)) || {}; }
export async function scanInfo(slug) { const [x0, sc] = await Promise.all([data(slug), scans(slug)]); return { ok: true, plaats: slug, kantoren: ((x0 && x0.items) || []).map(i => ({ s: i.s, naam: i.naam, web: i.web, scan: sc[i.s] || null })) }; }
export async function scanRonde(n = 30) {
  const t0 = Date.now(), d = await alleData(), todo = [];
  for (const { p, x } of d) { if (!x) continue; const sc = await scans(p.slug); x.items.forEach(i => { if (i.web && !(sc[i.s] && sc[i.s].v === SCAN_V && Date.now() - sc[i.s].t < 30 * 864e5)) todo.push({ p, i, oud: sc[i.s] ? sc[i.s].t : 0 }); }); }
  todo.sort((a, b) => a.oud - b.oud || b.p.inw - a.p.inw); const doe = todo.slice(0, n), per = {}; let klaar = 0;
  for (let k = 0; k < doe.length; k += 6) { if (Date.now() - t0 > 200000) break; await Promise.all(doe.slice(k, k + 6).map(async ({ p, i }) => { const r = await scanEen(i).catch(e => ({ t: Date.now(), v: SCAN_V, rg: [], prijs: [], rev: [], adv: [], fout: String(e.message || e).slice(0, 40) })); (per[p.slug] = per[p.slug] || {})[i.s] = r; klaar++; })); }
  for (const [sl, nw] of Object.entries(per)) { const sc = await scans(sl); Object.assign(sc, nw); await kv.set('adv:sc:' + sl, sc); }
  return { ok: true, gescand: klaar, open: todo.length - klaar, ms: Date.now() - t0 };
}

// ---------- opmaak (opmaak en scripts van lib/makelaar.js, body class mk) ----------
const ORG = { '@type': 'Organization', '@id': B + '/#org', name: 'keuzehulp.best', url: B + '/' };
const AD_CSS = '.adv-rg{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}.adv-rg span{font-size:14px;border:1px solid var(--line);border-radius:999px;padding:2px 10px}.adv-team{list-style:none;padding:0;margin:8px 0 16px}.adv-team li{padding:8px 0;border-bottom:1px solid var(--line)}.adv-team li:target{background:#FFF8D6}'
  + '.flrg{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}.flrg button{font:inherit;font-size:16px;font-weight:700;border:1.5px solid #111113;background:transparent;color:#111113;border-radius:999px;padding:6px 14px;cursor:pointer}.flrg button[aria-pressed=true]{background:#111113;color:#fff}'
  + '.mkf .rgk{display:flex;flex-wrap:wrap;gap:8px}.mkf .rgk label{display:inline-flex!important;align-items:center;gap:0;border:1.5px solid #B9BFC7;border-radius:999px;padding:6px 14px;font-size:16px;cursor:pointer}.mkf .rgk input{position:absolute;opacity:0;width:1px;height:1px}.mkf .rgk label:has(input:checked){background:#111113;color:#fff;border-color:#111113}.mkf textarea{font:inherit;font-size:16px;padding:10px 14px;border:1px solid #B9BFC7;border-radius:12px;background:transparent;color:inherit;min-height:84px}'
  + '.vk-kaart{border:1px solid var(--line);border-radius:14px;padding:16px;margin:12px 0}'
  + '@media (prefers-color-scheme:dark){html body.mk .flrg button{color:#F2F3F5!important;border-color:#6B7280!important;background:transparent!important}html body.mk .flrg button[aria-pressed=true]{background:#F2F3F5!important;color:#0F1115!important}html body.mk .mkf .rgk label{border-color:#6B7280!important}html body.mk .mkf .rgk label:has(input:checked){background:#F2F3F5!important;color:#0F1115!important}html body.mk .mkf textarea{border-color:#6B7280!important;color:#F2F3F5!important;background:#0F1115!important}html body.mk .adv-rg span,html body.mk .adv-team li,html body.mk .vk-kaart{border-color:#2A2F3A!important}html body.mk .adv-team li:target{background:#2A2F3A!important}}';
const ADJS = MKJS.replace(/tool=huis/g, 'tool=adv')
  + '(function(){var L=document.getElementById("zl"),F=document.querySelector(".flrg");if(!L||!F)return;F.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var on=b.getAttribute("aria-pressed")!=="true";[].forEach.call(F.querySelectorAll("button"),function(x){x.setAttribute("aria-pressed","false")});var f=on?b.getAttribute("data-f"):"";if(on)b.setAttribute("aria-pressed","true");var n=0;[].forEach.call(L.children,function(li){var k=!f||(" "+(li.getAttribute("data-rg")||"")+" ").indexOf(" "+f+" ")>=0;li.hidden=!k;if(k)n++});var m=document.getElementById("fln");if(m)m.textContent=f?n+" kantoren":""})})();';
function doc({ titel, desc, pad, body, schema, noindex, pl = '', s = '' }) {
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>' + esc(titel) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + B + pad + '">' + (noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-snippet:-1">') +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="alternate" type="text/plain" href="/llms.txt"><style>' + RCSS + MK_CSS + AD_CSS + '</style><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head><body class="mk" data-pl="' + esc(pl) + '" data-s="' + esc(s) + '"><header class="topbar"><div class="wrap"><a class="mark" href="/">keuzehulp<em>.best</em></a><nav class="topnav"><a href="/advocaat">Advocaten</a><a href="/makelaar">Makelaars</a><a href="/verzekeringen">Verzekeringen</a></nav></div></header><main><div class="wrap">' + body +
    '</div></main>' + DIALOOG + '<footer><div class="wrap"><p>Advocatenkantoren uit OpenStreetMap (© OpenStreetMap-bijdragers, ODbL); de volgorde is onze eigen Keuzehulp-score. Niemand betaalt voor een plek. <a href="/advocaat/voor-kantoren">Voor kantoren</a></p></div></footer><script>' + ADJS + '</script></body></html>';
}
function leadForm(pl, s, inline, rgs) {
  const keuze = (rgs && rgs.length ? rgs : ['arbeidsrecht', 'familierecht', 'echtscheiding', 'strafrecht', 'huurrecht', 'letselschade']).slice(0, 8);
  return '<form class="mkf" data-lead method="post" action="/api/keuze-tools?tool=adv&op=lead"' + (inline ? ' id="aanvraag"' : '') + '><input type="hidden" name="pl" value="' + esc(pl) + '"><input type="hidden" name="s" value="' + esc(s) + '">' +
    '<fieldset><legend>Waar gaat het over?</legend><div class="rgk">' + keuze.map((k, i) => '<label><input type="radio" name="rg" value="' + esc(k) + '"' + (i ? '' : ' checked') + '> ' + esc(RGN[k]) + '</label>').join('') + '<label><input type="radio" name="rg" value="anders"> Iets anders</label></div></fieldset>' +
    '<label>Kort waar het om gaat (een paar woorden)<textarea name="oms" maxlength="500" rows="3"></textarea></label><label>Naam<input type="text" name="naam" maxlength="60" autocomplete="name"></label><label>Telefoon of e-mail<input type="text" name="contact" required maxlength="80" autocomplete="email"></label>' +
    '<label class="mkt"><input type="checkbox" name="ok" value="1" required> Je mag mijn aanvraag en gegevens aan dit kantoor doorgeven</label><input class="mkh" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="ms" value="9999">' +
    '<button type="submit">Vraag een gratis eerste gesprek aan</button><p class="bron">Gratis en vrijblijvend. Schrijf geen gevoelige details op; die bespreek je met de advocaat. We gebruiken je gegevens alleen voor deze aanvraag en wissen ze na 180 dagen.</p><p class="mko" role="status" hidden></p></form>';
}
const DIALOOG = '<dialog id="mkd" aria-labelledby="mkdh"><button type="button" class="mkx" aria-label="Sluiten">×</button><h2 id="mkdh">Aanvraag</h2>' + leadForm('', '', false) + '</dialog>';
const chat = (slug, term, faq, mening) => kzuxBlok({ alleenChat: true, kop: 'Vraag het de keuzehulp', taal: 'nl', site: 'kzuxadv', slug, term, shop: '', prods: [], opties: [], faq: faq.map(([q, a]) => ({ q, a })), mening });
const faqBlok = faq => faq.map(([q, a]) => '<details class="faq"><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('');
const faqLd = faq => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const kruim = l => ({ '@type': 'BreadcrumbList', itemListElement: l.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: B + u })) });
const pad = (pl, s) => '/advocaat/' + pl + (s ? '/' + s : '');
function knoppen(pl, x, kort) {
  const at = t => ' data-t="' + t + '" data-pl="' + esc(pl) + '" data-s="' + esc(x.s) + '"';
  return '<div class="kn"><a class="cta of" href="' + pad(pl, x.s) + '#aanvraag"' + at('offerte') + ' data-n="' + esc(x.naam) + '" rel="nofollow">Gratis eerste gesprek aanvragen</a>' + (x.tel ? '<a class="cta" href="tel:' + esc(telLink(x.tel)) + '"' + at('bel') + '>Bel ' + esc(telTekst(x.tel)) + '</a>' : '') +
    (kort === true ? '' : (x.web ? '<a class="cta" href="' + esc(webLink(x.web)) + '" target="_blank" rel="noopener nofollow"' + at('web') + '>Website</a>' : '') + '<a class="cta" href="' + esc(routeLink(x)) + '" target="_blank" rel="noopener nofollow"' + at('route') + '>Route</a>') +
    (kort ? '' : '<a class="mn" href="' + pad(pl, x.s) + '?mening=1" rel="nofollow"' + at('mening') + '>Ervaring? Geef je mening</a>') + '</div>';
}
const revTekst = r => r.platform + ' ' + (r.max === 5 ? komma(r.score) : komma(r.score) + '/' + r.max) + ' (' + r.aantal + ' reviews)';
function badges(r) {
  const { sc, mn } = r, b = [];
  if (sc && sc.prijs && sc.prijs.length) b.push(sc.prijs.map(p => p.tekst).join(', '));
  if (sc && sc.toev === true) b.push('Toevoeging');
  if (sc && sc.gratis) b.push('Gratis eerste gesprek');
  ((sc && sc.rev) || []).forEach(z => b.push(revTekst(z)));
  if (mn) b.push(komma(mn.gem) + ' uit ' + mn.n + ' meningen');
  return b.length ? '<div class="mk-bd">' + b.map(t => '<span>' + esc(t) + '</span>').join('') + '</div>' : '';
}
const rgRegel = r => r.sc && r.sc.rg && r.sc.rg.length ? '<span class="w">' + esc(r.sc.rg.slice(0, 6).map(s => RGN[s]).join(', ') + (r.sc.rg.length > 6 ? ' en meer' : '')) + '</span>' : '';
function waarom(r, plek) {
  const { x, sc, mn, q } = r, l = [], mis = [], gecheckt = sc && sc.t && !sc.fout;
  const geg = [x.adres && 'adres', x.tel && 'telefoon', x.web && 'website'].filter(Boolean);
  if (q.p.gegevens) l.push('Gegevens: ' + q.p.gegevens + ' van 15 (' + lijstNL(geg) + ')');
  if (q.p.rg) l.push('Rechtsgebieden op de eigen site (' + sc.rg.map(s => RGN[s].toLowerCase()).join(', ') + ', gecontroleerd ' + datumKort(sc.t) + '): 15 van 15'); else mis.push(gecheckt ? 'rechtsgebieden (niet op de site gevonden, ' + datumKort(sc.t) + ')' : x.web ? 'rechtsgebieden (de site is nog niet nagekeken)' : 'rechtsgebieden (geen website bekend)');
  if (q.p.team) l.push(sc.adv.length + (sc.adv.length === 1 ? ' advocaat' : ' advocaten') + ' met naam op de site: 5 van 5'); else if (gecheckt) mis.push('namen van de advocaten (niet op de site gevonden)');
  if (q.p.prijs) l.push('Tarief op de eigen site (' + sc.prijs.map(p => p.tekst).join(', ') + '): 15 van 15'); else if (gecheckt) mis.push('tarief (niet op de site gevonden)');
  if (q.p.gratis) l.push('Gratis eerste gesprek volgens de site: 5 van 5'); else if (gecheckt) mis.push('gratis eerste gesprek (niet op de site gevonden)');
  if (q.p.toev) l.push('Doet zaken op toevoeging volgens de site: 10 van 10'); else if (gecheckt) mis.push(sc.toev === false ? 'toevoeging (de site zegt dat het kantoor die niet doet)' : 'toevoeging (niet op de site gevonden)');
  if (q.p.reviews || q.nrev) l.push('Reviews: ' + sc.rev.map(revTekst).join(', ') + ', samen ' + komma(q.gem5) + ' van 5: ' + q.p.reviews + ' van 25'); else if (gecheckt) mis.push('reviews (geen cijfer gevonden op Klantenvertellen, Kiyoh, Feedback Company of Trustpilot)');
  if (mn) l.push('Meningen van bezoekers: ' + komma(mn.gem) + ' uit ' + mn.n + ': ' + q.p.meningen + ' van 10');
  return '<details class="why"><summary>Waarom plek ' + plek + '? ' + q.tot + ' punten</summary><ul>' + l.map(t => '<li>' + esc(t) + '</li>').join('') + (mis.length ? '<li>' + esc('Geen punten voor ' + lijstNL(mis)) + '</li>' : '') + '</ul></details>';
}
function wegingTabel() {
  return '<table class="mk-w"><thead><tr><th>Wat we meten</th><th>Punten</th><th>Hoe en waar vandaan</th></tr></thead><tbody>' + WEGING.map(w => '<tr><td>' + esc(w.naam) + '</td><td>' + w.max + '</td><td>' + esc(w.uitleg.charAt(0).toUpperCase() + w.uitleg.slice(1) + '. Bron: ' + w.bron + '.') + '</td></tr>').join('') + '</tbody></table>' +
    '<p>Samen hoogstens 100 punten. Bij gelijke punten gaat het kantoor met de meeste reviews voor, daarna het kantoor met de meest complete gegevens. Inschrijving bij de Nederlandse orde van advocaten levert geen punten op: elke advocaat staat op het tableau. Niemand kan een plek kopen. Een kantoor stijgt door gegevens aan te vullen in OpenStreetMap, rechtsgebieden, tarief en advocaten op de eigen site te zetten en reviews te verzamelen. De eigen websites kijken we elke 30 dagen opnieuw na.</p>';
}
async function plaatsInfo() { const d = await alleData(); return d.filter(o => o.x && o.x.n >= MIN).map(o => ({ p: o.p, n: o.x.n })); }
const pakketCache = new Map();
async function pakket(slug) {
  const c = pakketCache.get(slug); if (c && Date.now() - c.at < 60000) return c.v;
  const [x0, sc, mn] = await Promise.all([data(slug), scans(slug), meningen(slug)]); const v = !x0 || !x0.items.length ? null : { x0, rij: rang(x0.items, sc, mn) };
  pakketCache.set(slug, { at: Date.now(), v }); return v;
}
// rechtsgebieden met minstens MIN_RG kantoren in de plaats
const rgTelling = rij => { const t = {}; rij.forEach(r => ((r.sc && r.sc.rg) || []).forEach(s => { t[s] = (t[s] || 0) + 1; })); return RG.map(([s]) => ({ s, n: t[s] || 0 })).filter(o => o.n).sort((a, b) => b.n - a.n); };

// ---------- FAQ per plaats, alleen met antwoorden uit onze gegevens en de bronnen hierboven ----------
function eersteKeus(p, rij, rgNaam) {
  const top = rij.slice(0, 3); if (!top.length) return '';
  const w = redenen(top[0]).slice(0, 3), toev = rij.find((r, i) => i && r.sc && r.sc.toev === true), gr = rij.find((r, i) => i && r.sc && r.sc.gratis);
  return 'Onze eerste keus' + (rgNaam ? ' voor ' + rgNaam.toLowerCase() : '') + ' in ' + p.naam + ' is ' + top[0].x.naam + ' (' + top[0].q.tot + ' van 100 punten in de Keuzehulp-score)' + (w.length ? ': ' + lijstNL(w) + '.' : '.') +
    (top.length > 1 ? ' Daarna ' + top.slice(1).map(r => r.x.naam + ' (' + r.q.tot + ')').join(' en ') + '.' : '') +
    (toev ? ' Weinig inkomen? ' + toev.x.naam + ' doet volgens de eigen site zaken op toevoeging.' : '') + (gr && gr !== toev ? ' Eerst kosteloos praten? ' + gr.x.naam + ' noemt een gratis eerste gesprek.' : '');
}
function kortKeus(p, rij, rgNaam) { const r = rij[0]; if (!r) return ''; const w = redenen(r); return 'Onze eerste keus' + (rgNaam ? ' voor ' + rgNaam.toLowerCase() : '') + ' in ' + p.naam + ': ' + r.x.naam + ' (' + r.q.tot + ' punten)' + (w.length ? ', ' + w[0] : '') + '.'; }
function plaatsFaq(p, rij, t) {
  const f = [], toevN = rij.filter(r => r.sc && r.sc.toev === true).length, gratisN = rij.filter(r => r.sc && r.sc.gratis).length;
  f.push(['Wat is de beste advocaat in ' + p.naam + '?', eersteKeus(p, rij) + ' De score van ' + datumKort(t) + ' telt complete gegevens, rechtsgebieden, advocaten en tarief op de eigen site, gratis eerste gesprek, toevoegingen, reviews op andere platforms en meningen van bezoekers. Bij elk kantoor staat waarom het op die plek staat.']);
  rgTelling(rij).filter(o => o.n >= 3).slice(0, 3).forEach(o => { const l = rij.filter(r => r.sc && r.sc.rg && r.sc.rg.includes(o.s)).slice(0, 3); f.push(['Welke advocaat in ' + p.naam + ' doet ' + RGN[o.s].toLowerCase() + '?', o.n + ' kantoren in ' + p.naam + ' noemen ' + RGN[o.s].toLowerCase() + ' op hun eigen site. De hoogste in de Keuzehulp-score: ' + l.map(r => r.x.naam + ' (' + r.q.tot + ' punten)').join(', ') + '.']); });
  const uur = rij.flatMap(r => ((r.sc && r.sc.prijs) || []).filter(z => z.soort === 'uur').map(z => z.v)).sort((a, b) => a - b);
  f.push(['Wat kost een advocaat in ' + p.naam + '?', (uur.length >= 3 ? uur.length + ' kantoren in ' + p.naam + ' noemen een uurtarief op hun eigen site, van ' + eur(uur[0]) + ' tot ' + eur(uur[uur.length - 1]) + ' per uur (zoals het er stond, soms zonder btw). ' : 'Dat spreek je met het kantoor af: een uurtarief of een vaste prijs. We noemen pas bedragen als genoeg kantoren in ' + p.naam + ' een prijs op hun eigen site zetten. ') + 'Vraag het tarief vooraf op papier. Met een laag inkomen betaal je met een toevoeging alleen een eigen bijdrage, voor een advocaat € 257 tot € 1.084 (rechtsbijstand.nl, bijgewerkt 18 augustus 2026).']);
  f.push(VAST_FAQ.gratis(p.naam, gratisN)); f.push(VAST_FAQ.toev(p.naam, toevN)); f.push(VAST_FAQ.check);
  return f;
}
function buren(p, info) { return info.filter(o => o.p.slug !== p.slug).map(o => ({ o, km: afstand({ lat: p.c[0], lon: p.c[1] }, { lat: o.p.c[0], lon: o.p.c[1] }) })).sort((a, b) => a.km - b.km).slice(0, 4).map(({ o }) => '<a href="/advocaat/' + o.p.slug + '">Advocaat ' + esc(o.p.naam) + '</a>'); }
function kantoorLd(pl, r, metTeam) {
  const { x, sc } = r, id = B + pad(pl, x.s) + '#kantoor';
  return { '@type': 'LegalService', '@id': id, name: x.naam, url: x.web ? webLink(x.web) : B + pad(pl, x.s), telephone: x.tel ? telLink(x.tel) : undefined,
    address: { '@type': 'PostalAddress', streetAddress: x.adres || undefined, postalCode: x.pc || undefined, addressLocality: x.plaats, addressCountry: 'NL' },
    geo: { '@type': 'GeoCoordinates', latitude: x.lat, longitude: x.lon }, areaServed: { '@type': 'City', name: P[pl].naam },
    knowsAbout: sc && sc.rg && sc.rg.length ? sc.rg.map(s => RGN[s]) : undefined,
    employee: metTeam && sc && sc.adv && sc.adv.length ? sc.adv.map(a => ({ '@type': 'Person', '@id': B + pad(pl, x.s) + '#' + ankerVan(a.n), name: mrNaam(a), jobTitle: a.f, worksFor: { '@id': id } })) : undefined };
}
const ankerVan = n => 'mr-' + slugify(n);

// ---------- /advocaat ----------
export async function hub() {
  // Eén keuzehulp voor heel Nederland (20 nov 2026, Henkjan: "ik wil ALLE kantoren uit NL in 1 keuzehulp"): alle gemeenten met kantoren staan erin,
  // zoeken op gemeente bovenaan; de grote gemeenten als kaart met hun nummer 1, de beste score van het land in het eerste antwoord.
  const d = await alleData(), met = d.filter(o => o.x && o.x.n >= 1), info = met.filter(o => o.x.n >= MIN).map(o => ({ p: o.p, n: o.x.n }));
  const tops = await Promise.all(info.map(async o => { const k = await pakket(o.p.slug); return { o, r: k && k.rij[0] }; }));
  const rij = tops.sort((a, b) => b.o.p.inw - a.o.p.inw), tot = met.reduce((a, o) => a + o.x.n, 0);
  const best = tops.filter(t => t.r && t.r.q).sort((a, b) => b.r.q.tot - a.r.q.tot)[0];
  const faq = [['Wat is de beste advocaat in Nederland?', 'Dat hangt af van je rechtsgebied en waar je woont, daarom staat er per gemeente een ranglijst. ' + (best ? 'Over heel Nederland heeft ' + best.r.x.naam + ' in ' + best.o.p.naam + ' nu de hoogste Keuzehulp-score: ' + best.r.q.tot + ' van 100 punten. ' : '') + 'Kies je gemeente hieronder; bij elk kantoor staat waarom het op die plek staat.'],
    ['Hoe vind ik de beste advocaat bij mij in de buurt?', 'Zoek je gemeente hieronder. Per gemeente staan alle advocatenkantoren uit OpenStreetMap op volgorde van de Keuzehulp-score, met per kantoor waarom het op die plek staat, de rechtsgebieden en de advocaten die de eigen site noemt.'],
    ['Hoe rangschikt keuzehulp.best advocaten?', 'Met de Keuzehulp-score van 0 tot 100: gegevens compleet (15), rechtsgebieden op de eigen site (15), advocaten met naam (5), tarief op de site (15), gratis eerste gesprek (5), toevoegingen (10), reviews op Klantenvertellen, Kiyoh, Feedback Company en Trustpilot (25) en meningen van bezoekers vanaf 3 meningen (10). Niemand betaalt voor een plek.'],
    VAST_FAQ.gratis('Nederland', 0), VAST_FAQ.toev('Nederland', 0), VAST_FAQ.check];
  const alleL = met.slice().sort((a, b) => a.p.naam.localeCompare(b.p.naam, 'nl'));
  const zoek = alleL.length ? '<h2 id="gemeenten">Alle ' + alleL.length + ' gemeenten</h2><label for="advz" class="small">Zoek je gemeente</label><input id="advz" type="search" autocomplete="off" placeholder="Bijvoorbeeld Gouda" style="width:100%;font:inherit;font-size:16px;padding:11px 14px;border:1px solid #111113;border-radius:12px;margin:4px 0 12px;box-sizing:border-box;color:#111113;background:#fff">' +
    '<ul class="adv-alle" id="advl" style="columns:2 220px;padding-left:18px;margin:0 0 16px">' + alleL.map(o => '<li><a href="/advocaat/' + o.p.slug + '">' + esc(o.p.naam) + '</a> (' + o.x.n + ')</li>').join('') + '</ul>' +
    '<script>(function(){var i=document.getElementById("advz"),l=document.getElementById("advl");if(!i||!l)return;i.addEventListener("input",function(){var q=i.value.toLowerCase().trim();[].forEach.call(l.children,function(li){li.hidden=q&&li.textContent.toLowerCase().indexOf(q)<0})})})();</script>' : '';
  const body = '<p class="crumbs"><a href="/">keuzehulp.best</a> › Advocaat</p><h1>Advocaat vergelijken: alle advocatenkantoren in Nederland</h1>' +
    '<div class="answer"><p>' + (tot ? 'We vergeleken ' + tot + ' advocatenkantoren in ' + alleL.length + ' gemeenten in heel Nederland' : 'We vergelijken alle advocatenkantoren in Nederland') + ' met de Keuzehulp-score: rechtsgebieden, tarief en advocaten op de eigen site, toevoegingen, gratis eerste gesprek, reviews op andere platforms en meningen van bezoekers.' + (best ? ' Hoogste score van het land: ' + esc(best.r.x.naam) + ' in ' + esc(best.o.p.naam) + ' (' + best.r.q.tot + ' punten).' : '') + ' Bij elk kantoor vraag je in één tik een gratis eerste gesprek aan.</p><p><a href="#gemeenten">Zoek je gemeente</a></p></div>' +
    chat('advocaat', 'advocaat', faq) +
    (rij.length ? '<h2>Grootste gemeenten</h2><ul class="cards">' + rij.slice(0, 12).map(({ o, r }) => '<li><a href="/advocaat/' + o.p.slug + '">Advocaat ' + esc(o.p.naam) + '</a><span>' + o.n + ' kantoren' + (r ? ', nummer 1: ' + esc(r.x.naam) : '') + '</span></li>').join('') + '</ul>' : '') +
    zoek +
    '<h2>Zo rangschikken we</h2>' + wegingTabel() +
    '<h2>Zo kies je een advocaat</h2><ul><li>Kies een advocaat die werkt in jouw rechtsgebied, zoals arbeidsrecht, familierecht, huurrecht of strafrecht.</li><li>Vraag vooraf hoe het kantoor rekent: een uurtarief of een vaste prijs, en zet dat op papier. Heb je een rechtsbijstandverzekering, meld je zaak dan eerst daar.</li><li>Weinig inkomen? Kies een kantoor dat zaken op toevoeging doet; dan betaal je alleen een eigen bijdrage.</li><li>Kijk in <a href="' + ZOEK + '" target="_blank" rel="noopener nofollow">Zoek een advocaat</a> van de Orde of iemand ingeschreven staat.</li></ul>' +
    '<p class="bron">Bronnen: ' + bronA('rb') + ', ' + bronA('jl') + ', ' + bronA('ro') + ', ' + bronA('nova') + '. Kantoren en gemeentegrenzen: OpenStreetMap.</p>' +
    '<h2>Vragen</h2>' + faqBlok(faq) + '<p class="rel"><a href="/advocaat/voor-kantoren">Advocatenkantoor? Zo staat u er goed in</a> · <a href="/verzekeringen">Rechtsbijstandverzekering vergelijken</a></p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'CollectionPage', name: 'Advocaat vergelijken: alle advocatenkantoren in Nederland', url: B + '/advocaat', inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] }, hasPart: rij.map(({ o }) => ({ '@type': 'WebPage', name: 'Advocaat ' + o.p.naam, url: B + '/advocaat/' + o.p.slug })) }, kruim([['keuzehulp.best', '/'], ['Advocaat', '/advocaat']]), faqLd(faq)] };
  return doc({ titel: 'Advocaat vergelijken: alle advocatenkantoren in Nederland', desc: kortDesc('Vergelijk ' + (tot ? 'alle ' + tot : 'alle') + ' advocatenkantoren in ' + (alleL.length || 'alle') + ' gemeenten op rechtsgebied, tarief, toevoeging en reviews. Gratis eerste gesprek.'), pad: '/advocaat', body, schema, noindex: !rij.length, pl: 'hub' });
}

// ---------- lijst (plaats of rechtsgebied) ----------
function lijst(slug, rij, nu) {
  const groot = (r, i) => { const x = r.x; return '<li data-rg="' + esc(((r.sc && r.sc.rg) || []).join(' ') + (r.sc && r.sc.toev === true ? ' toev' : '') + (r.sc && r.sc.gratis ? ' gratis' : '')) + '" data-lat="' + x.lat + '" data-lon="' + x.lon + '"><span class="n">' + (i + 1) + '. <a href="' + pad(slug, x.s) + '">' + esc(x.naam) + '</a></span><span class="mk-sc"><b>' + r.q.tot + '</b> punten Keuzehulp-score</span>' + rgRegel(r) + badges(r) + (x.adres ? '<span class="w">' + esc(x.adres + (x.pc ? ', ' + x.pc : '')) + '</span>' : '') + knoppen(slug, x) + waarom(r, i + 1) + '</li>'; };
  const klein = (r, i) => { const x = r.x; return '<li class="mk-rest" data-rg="' + esc(((r.sc && r.sc.rg) || []).join(' ') + (r.sc && r.sc.toev === true ? ' toev' : '') + (r.sc && r.sc.gratis ? ' gratis' : '')) + '"><span class="n">' + (i + 1) + '. <a href="' + pad(slug, x.s) + '">' + esc(x.naam) + '</a> · ' + r.q.tot + ' punten</span>' + rgRegel(r) + (x.adres ? '<span class="w">' + esc(x.adres) + '</span>' : '') + knoppen(slug, x, true) + '</li>'; };
  return '<ul class="zaken" id="zl">' + rij.map((r, i) => i < 20 ? groot(r, i) : klein(r, i)).join('') + '</ul>';
}

// ---------- /advocaat/<plaats> ----------
export async function plaatsPagina(slug) {
  await gem();
  const p = P[slug]; if (!p) return null; const k = await pakket(slug); if (!k) return null; const { x0, rij } = k;
  const info = await plaatsInfo(), faq = plaatsFaq(p, rij, x0.t), top = rij.slice(0, 3), rgs = rgTelling(rij), metWeb = rij.filter(r => r.x.web).length, gecheckt = rij.filter(r => r.x.web && r.sc && r.sc.t).length;
  const h1 = 'Advocaat in ' + p.naam + ': de beste kantoren';
  const filter = (rgs.length || rij.some(r => r.sc && r.sc.toev === true)) ? '<div class="flrg" aria-label="Filter op rechtsgebied">' + rgs.slice(0, 10).map(o => '<button type="button" data-f="' + o.s + '" aria-pressed="false">' + esc(RGN[o.s]) + '</button>').join('') + (rij.some(r => r.sc && r.sc.toev === true) ? '<button type="button" data-f="toev" aria-pressed="false">Toevoeging</button>' : '') + (rij.some(r => r.sc && r.sc.gratis) ? '<button type="button" data-f="gratis" aria-pressed="false">Gratis eerste gesprek</button>' : '') + '</div><p class="bron" id="fln" role="status"></p>' : '';
  const rgPag = rgs.filter(o => o.n >= MIN_RG);
  const ander = buren(p, info);
  const body = '<p class="crumbs"><a href="/advocaat">Advocaat</a> › ' + esc(p.naam) + '</p><h1>' + esc(h1) + '</h1>' +
    '<div class="lead mk-antw"><p><strong>' + esc(kortKeus(p, rij)) + '</strong> ' + rij.length + ' kantoren vergeleken op ' + esc(datumKort(x0.t)) + '.</p></div>' +
    '<ol class="top3 lead">' + top.map((r, i) => '<li><span class="n">' + (i + 1) + '. <a href="' + pad(slug, r.x.s) + '">' + esc(r.x.naam) + '</a> · ' + r.q.tot + ' punten</span>' + rgRegel(r) + knoppen(slug, r.x, true) + badges(r) + '</li>').join('') + '</ol>' +
    chat('advocaat-' + slug, 'advocaat ' + p.naam, faq) +
    '<p>We vergeleken alle ' + rij.length + ' advocatenkantoren in de gemeente ' + esc(p.naam) + ' die in OpenStreetMap staan' + (metWeb ? (gecheckt < metWeb ? '; van ' + gecheckt + ' van de ' + metWeb + ' kantoren met een website is de site al nagekeken' : '; de sites van alle ' + metWeb + ' kantoren met een website zijn nagekeken') : '') + '. <a href="#zo-rangschikken-we">Zo rangschikken we</a>.</p>' +
    (rgPag.length ? '<p>Per rechtsgebied: ' + rgPag.map(o => '<a href="' + pad(slug, o.s) + '">advocaat ' + esc(RGN[o.s].toLowerCase()) + ' ' + esc(p.naam) + '</a> (' + o.n + ')').join(', ') + '.</p>' : '') +
    '<h2>Alle ' + rij.length + ' advocatenkantoren in ' + esc(p.naam) + ' op volgorde</h2>' + filter + lijst(slug, rij) +
    '<h2 id="zo-rangschikken-we">Zo rangschikken we: de Keuzehulp-score</h2>' + wegingTabel() +
    '<h2>Vragen over advocaten in ' + esc(p.naam) + '</h2>' + faqBlok(faq) + '<p class="bron">Bronnen: ' + bronA('rb') + ', ' + bronA('jl') + ', ' + bronA('ro') + ', ' + bronA('nova') + '.</p>' +
    (ander.length ? '<p class="rel">In de buurt: ' + ander.join(' · ') + '</p>' : '') + '<p class="rel"><a href="/advocaat">Alle gemeenten</a> · <a href="/advocaat/voor-kantoren">Voor kantoren</a></p>' +
    '<p class="bron">Kantoren uit OpenStreetMap, bijgewerkt <time datetime="' + x0.t.slice(0, 10) + '">' + esc(datumNL(x0.t)) + '</time>.</p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG,
    { '@type': 'WebPage', '@id': B + pad(slug), url: B + pad(slug), name: h1, inLanguage: 'nl-NL', dateModified: x0.t, publisher: { '@id': ORG['@id'] }, mainEntity: { '@id': B + pad(slug) + '#lijst' } },
    { '@type': 'ItemList', '@id': B + pad(slug) + '#lijst', name: 'Beste advocaten in ' + p.naam + ' volgens de Keuzehulp-score', itemListOrder: 'https://schema.org/ItemListOrderDescending', numberOfItems: rij.length, itemListElement: rij.slice(0, 50).map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: B + pad(slug, r.x.s), item: kantoorLd(slug, r) })) },
    kruim([['Advocaat', '/advocaat'], [p.naam, pad(slug)]]), faqLd(faq)] };
  const t1 = 'Advocaat ' + p.naam + ': de beste van ' + rij.length + ' kantoren';
  return doc({ titel: t1.length <= 60 ? t1 : 'Advocaat ' + p.naam + ': ' + rij.length + ' kantoren', desc: kortDesc('Beste advocaat in ' + p.naam + ': ' + top.map(r => r.x.naam).join(', ') + '. Alle ' + rij.length + ' kantoren op rechtsgebied, tarief en reviews.'), pad: pad(slug), body, schema, noindex: rij.length < MIN, pl: slug });
}

// ---------- /advocaat/<plaats>/<rechtsgebied> (alleen vanaf MIN_RG kantoren) ----------
export async function rgPagina(slug, rg) {
  await gem();
  const p = P[slug]; if (!p || !RGN[rg]) return null; const k = await pakket(slug); if (!k) return null; const { x0 } = k;
  const rij = k.rij.filter(r => r.sc && r.sc.rg && r.sc.rg.includes(rg)); if (rij.length < MIN_RG) return null;
  const naam = RGN[rg], nl = naam.toLowerCase(), top = rij.slice(0, 3);
  const faq = [['Wat is de beste advocaat ' + nl + ' in ' + p.naam + '?', eersteKeus(p, rij, naam) + ' Alle ' + rij.length + ' kantoren hieronder noemen ' + nl + ' op hun eigen site.'], VAST_FAQ.gratis(p.naam, rij.filter(r => r.sc.gratis).length), VAST_FAQ.toev(p.naam, rij.filter(r => r.sc.toev === true).length), VAST_FAQ.check];
  const h1 = 'Advocaat ' + nl + ' in ' + p.naam + ': de beste kantoren';
  const body = '<p class="crumbs"><a href="/advocaat">Advocaat</a> › <a href="' + pad(slug) + '">' + esc(p.naam) + '</a> › ' + esc(naam) + '</p><h1>' + esc(h1) + '</h1>' +
    '<div class="lead mk-antw"><p><strong>' + esc(kortKeus(p, rij, naam)) + '</strong></p></div>' +
    '<ol class="top3 lead">' + top.map((r, i) => '<li><span class="n">' + (i + 1) + '. <a href="' + pad(slug, r.x.s) + '">' + esc(r.x.naam) + '</a> · ' + r.q.tot + ' punten</span>' + knoppen(slug, r.x, true) + badges(r) + '</li>').join('') + '</ol>' +
    chat('advocaat-' + slug, 'advocaat ' + nl + ' ' + p.naam, faq) +
    '<h2>Alle ' + rij.length + ' kantoren voor ' + esc(nl) + ' in ' + esc(p.naam) + '</h2><p>Deze ' + rij.length + ' kantoren in ' + esc(p.naam) + ' noemen ' + esc(nl) + ' op hun eigen site, op volgorde van de Keuzehulp-score.</p>' + lijst(slug, rij) +
    '<h2>Zo rangschikken we</h2>' + wegingTabel() + '<h2>Vragen</h2>' + faqBlok(faq) + '<p class="bron">Bronnen: ' + bronA('rb') + ', ' + bronA('jl') + ', ' + bronA('ro') + ', ' + bronA('nova') + '.</p>' +
    '<p class="rel"><a href="' + pad(slug) + '">Alle advocaten in ' + esc(p.naam) + '</a> · <a href="/advocaat">Alle gemeenten</a></p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: B + pad(slug, rg), name: h1, inLanguage: 'nl-NL', dateModified: x0.t, publisher: { '@id': ORG['@id'] } },
    { '@type': 'ItemList', name: 'Beste advocaten ' + nl + ' in ' + p.naam, itemListOrder: 'https://schema.org/ItemListOrderDescending', numberOfItems: rij.length, itemListElement: rij.slice(0, 50).map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: B + pad(slug, r.x.s), item: kantoorLd(slug, r) })) },
    kruim([['Advocaat', '/advocaat'], [p.naam, pad(slug)], [naam, pad(slug, rg)]]), faqLd(faq)] };
  const t1 = 'Advocaat ' + nl + ' ' + p.naam + ': ' + rij.length + ' kantoren vergeleken';
  return doc({ titel: t1.length <= 60 ? t1 : 'Advocaat ' + nl + ' ' + p.naam, desc: kortDesc('Beste advocaat ' + nl + ' in ' + p.naam + ': ' + top.map(r => r.x.naam).join(', ') + '. ' + rij.length + ' kantoren op tarief, toevoeging en reviews.'), pad: pad(slug, rg), body, schema, pl: slug });
}

// ---------- /advocaat/<plaats>/<kantoor> ----------
export async function kantoorPagina(slug, s) {
  await gem();
  if (isRg(s)) return rgPagina(slug, s);
  const p = P[slug]; if (!p) return null; const k = await pakket(slug); if (!k) return null; const { x0, rij } = k;
  const plek = rij.findIndex(r => r.x.s === s); if (plek < 0) return null; const r = rij[plek], x = r.x, sc = r.sc || {};
  const dicht = rij.filter(z => z.x.s !== s).map(z => ({ z, km: afstand(x, z.x) })).sort((a, b) => a.km - b.km).slice(0, 4), team = sc.adv || [], rgs = sc.rg || [];
  const feiten = [x.adres ? 'Adres: ' + x.adres + (x.pc ? ', ' + x.pc : '') + ' ' + x.plaats : '', x.tel ? 'Telefoon: ' + telTekst(x.tel) : '', x.web ? 'Website: ' + webTekst(x.web) : '', x.rolstoel === 'yes' ? 'Rolstoeltoegankelijk' : ''].filter(Boolean);
  const w = redenen(r), faq = [['Is ' + x.naam + ' een goede advocaat?', x.naam + ' staat op plek ' + (plek + 1) + ' van ' + rij.length + ' advocatenkantoren in ' + p.naam + ' met ' + r.q.tot + ' van 100 punten in de Keuzehulp-score' + (w.length ? ': ' + lijstNL(w) + '.' : '.') + (r.mn ? ' Bezoekers geven gemiddeld ' + komma(r.mn.gem) + ' van 5 (' + r.mn.n + ' meningen). ' + r.mn.zin : '')]];
  if (rgs.length) faq.push(['Welke rechtsgebieden doet ' + x.naam + '?', 'Volgens de eigen site (gecontroleerd ' + datumKort(sc.t) + '): ' + lijstNL(rgs.map(z => RGN[z].toLowerCase())) + '.']);
  if (team.length) faq.push(['Welke advocaten werken bij ' + x.naam + '?', 'De eigen site noemt ' + (team.length > 12 ? team.length + ' mensen, onder wie ' : '') + team.slice(0, 12).map(a => mrNaam(a) + ' (' + a.f.toLowerCase() + ')').join(', ') + '. Ingeschreven als advocaat? Zoek de naam op in Zoek een advocaat van de Orde.']);
  if (sc.toev != null) faq.push(['Doet ' + x.naam + ' zaken op toevoeging?', sc.toev ? 'Ja, volgens de eigen site doet het kantoor zaken op basis van gefinancierde rechtsbijstand (toevoeging). Je betaalt dan een eigen bijdrage, voor een advocaat € 257 tot € 1.084 (rechtsbijstand.nl, bijgewerkt 18 augustus 2026).' : 'Volgens de eigen site doet het kantoor geen zaken op toevoeging.']);
  if (sc.prijs && sc.prijs.length) faq.push(['Wat kost ' + x.naam + '?', 'Op de eigen site stond bij onze controle van ' + datumKort(sc.t) + ': ' + sc.prijs.map(z => z.tekst).join(' en ') + ' (' + (sc.prijs[0].url || sc.url || '') + '). Vraag het tarief op papier en of het met of zonder btw is.']);
  if (x.tel) faq.push(['Wat is het telefoonnummer van ' + x.naam + '?', telTekst(x.tel) + '.']);
  if (x.adres) faq.push(['Waar zit ' + x.naam + '?', x.adres + (x.pc ? ', ' + x.pc : '') + ' ' + x.plaats + '.']);
  if (sc.rev && sc.rev.length) faq.push(['Wat zeggen reviews over ' + x.naam + '?', sc.rev.map(revTekst).join(', ') + ' (gelezen ' + datumKort(sc.t) + ').']);
  const mening = { u: '/api/keuze-tools?tool=adv&op=mening', pl: slug, s, label: 'Ervaring met ' + x.naam.slice(0, 40) + '? ★★★★★' };
  const teamBlok = team.length ? '<h2>Advocaten van ' + esc(x.naam) + '</h2><ul class="adv-team">' + team.map(a => '<li id="' + ankerVan(a.n) + '"><strong>' + esc(mrNaam(a)) + '</strong>, ' + esc(a.f.toLowerCase()) + ' bij ' + esc(x.naam) + ' in ' + esc(p.naam) + '</li>').join('') + '</ul><p class="bron">Namen en functies zoals de eigen site ze toont' + (sc.teamUrl ? ' (<a href="' + esc(sc.teamUrl) + '" target="_blank" rel="noopener nofollow">teampagina</a>)' : '') + ', gelezen ' + esc(datumKort(sc.t)) + '. Inschrijving nakijken: <a href="' + ZOEK + '" target="_blank" rel="noopener nofollow">Zoek een advocaat</a>.</p>' : '';
  const body = '<p class="crumbs"><a href="/advocaat">Advocaat</a> › <a href="' + pad(slug) + '">' + esc(p.naam) + '</a></p><h1>' + esc(x.naam) + '</h1><div class="lead mk-kop"><p>Advocatenkantoor in ' + esc(p.naam) + ' · plek ' + (plek + 1) + ' van ' + rij.length + '</p>' +
    '<p class="mk-sc"><b>' + r.q.tot + '</b> punten Keuzehulp-score</p>' + badges(r) + knoppen(slug, x, 'zaak') + '</div>' +
    (rgs.length ? '<div class="adv-rg">' + rgs.map(z => '<span>' + esc(RGN[z]) + '</span>').join('') + '</div>' : '') +
    chat('advocaat-' + slug, 'advocaat ' + p.naam, faq, mening) +
    '<h2>Waarom plek ' + (plek + 1) + '?</h2>' + waarom(r, plek + 1).replace('<details class="why">', '<details class="why" open>') + teamBlok +
    (sc.rev && sc.rev.length ? '<h2>Reviews op andere platforms</h2><ul>' + sc.rev.map(z => '<li><a href="' + esc(z.url) + '" target="_blank" rel="noopener nofollow">' + esc(z.platform) + '</a>: ' + esc((z.max === 5 ? komma(z.score) : komma(z.score) + '/' + z.max) + ' uit ' + z.aantal + ' reviews') + '</li>').join('') + '</ul>' : '') +
    (r.mn ? '<h2>Wat bezoekers vinden</h2><p><strong>' + komma(r.mn.gem) + ' van 5</strong> uit ' + r.mn.n + ' meningen in onze chat. ' + esc(r.mn.zin) + ' We tonen alleen de rode draad, nooit een losse mening.</p>' : '') +
    '<h2>Gratis eerste gesprek bij ' + esc(x.naam) + '</h2>' + leadForm(slug, s, true, rgs) +
    '<h2>Gegevens</h2><ul class="feit">' + feiten.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' +
    (dicht.length ? '<h2>Andere advocaten dichtbij</h2><ul class="zaken">' + dicht.map(({ z, km }) => '<li><span class="n"><a href="' + pad(slug, z.x.s) + '">' + esc(z.x.naam) + '</a> · ' + z.q.tot + ' punten</span><span class="w">' + (km < 1 ? Math.round(km * 1000) + ' m' : komma(km) + ' km') + (z.x.adres ? ' · ' + esc(z.x.adres) : '') + '</span>' + knoppen(slug, z.x, true) + '</li>').join('') + '</ul>' : '') +
    '<h2>Vragen over ' + esc(x.naam) + '</h2>' + faqBlok(faq) +
    '<p class="rel"><a href="' + pad(slug) + '">Alle ' + rij.length + ' advocaten in ' + esc(p.naam) + ' op volgorde</a> · <a href="' + esc(osmLink(x)) + '" rel="nofollow">Gegevens aanpassen op OpenStreetMap</a></p>' +
    '<p class="rel">Werkt u bij dit kantoor? <a href="/advocaat/voor-kantoren?pl=' + esc(slug) + '&amp;s=' + esc(s) + '" rel="nofollow">Zo komt ' + esc(x.naam) + ' hoger en beter in ChatGPT</a>.</p>';
  const lb = kantoorLd(slug, r, true);
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: B + pad(slug, s), name: x.naam, dateModified: x0.t, inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] }, about: { '@id': lb['@id'] } }, lb, kruim([['Advocaat', '/advocaat'], [p.naam, pad(slug)], [x.naam, pad(slug, s)]]), faqLd(faq)] };
  const t1 = x.naam + ': advocaat ' + p.naam + ', score en contact';
  return doc({ titel: t1.length <= 60 ? t1 : x.naam.slice(0, 40) + ', advocaat ' + p.naam, desc: kortDesc(x.naam + ', advocaat in ' + p.naam + ': plek ' + (plek + 1) + ' van ' + rij.length + ' met ' + r.q.tot + ' punten. ' + (rgs.length ? lijstNL(rgs.slice(0, 3).map(z => RGN[z].toLowerCase())) + '. ' : '') + 'Telefoon, adres en gratis eerste gesprek.'), pad: pad(slug, s), body, schema, noindex: gegPunten(x) < 10 || x0.items.length < MIN, pl: slug, s });
}

// ---------- /advocaat/voor-kantoren ----------
export async function voorKantoren(pl, s) {
  await gem();
  let r = null, plek = 0, tot = 0;
  if (P[pl] && s) { const k = await pakket(pl); if (k) { plek = k.rij.findIndex(z => z.x.s === s) + 1; tot = k.rij.length; r = plek ? k.rij[plek - 1] : null; } }
  const x = r && r.x, sc = (r && r.sc) || {}, wa = t => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t);
  const beter = r ? [!x.tel && 'Zet uw telefoonnummer in OpenStreetMap (5 punten).', !x.web && 'Zet uw website in OpenStreetMap (5 punten).', !x.adres && 'Zet uw adres in OpenStreetMap (5 punten).', !r.q.p.rg && 'Noem uw rechtsgebieden met name op uw site, bijvoorbeeld op een pagina Rechtsgebieden (15 punten).', !r.q.p.team && 'Zet uw advocaten met naam en functie op een teampagina (5 punten). Dan vindt ook wie op uw naam zoekt deze pagina.', !r.q.p.prijs && 'Zet uw uurtarief of een vaste prijs op uw site (15 punten).', !r.q.p.gratis && 'Biedt u een gratis eerste gesprek? Zeg het op uw site (5 punten).', !r.q.p.toev && sc.toev !== false && 'Doet u zaken op toevoeging? Zeg het op uw site (10 punten).', r.q.p.reviews < 20 && 'Vraag tevreden cliënten om een review op Klantenvertellen, Kiyoh, Feedback Company of Trustpilot en link vanaf uw site naar die pagina (tot 25 punten).'].filter(Boolean) : [];
  const body = '<p class="crumbs"><a href="/advocaat">Advocaat</a> › Voor kantoren</p><h1>Uw advocatenkantoor beter gevonden in ChatGPT en Google</h1>' +
    '<div class="answer"><p>Mensen vragen ChatGPT, Gemini of Google steeds vaker welke advocaat ze moeten nemen. Een AI zonder internet noemt dan vooral verenigingen en platforms, geen kantoor. keuzehulp.best zet alle advocatenkantoren in de 40 grootste gemeenten op een rij, met per kantoor een pagina, de advocaten met naam en de Keuzehulp-score.</p><p>Uw plek is niet te koop: die komt alleen uit de score.</p></div>' +
    (r ? '<h2>' + esc(x.naam) + ' nu</h2><div class="vk-kaart"><p>Plek ' + plek + ' van ' + tot + ' advocatenkantoren in ' + esc(P[pl].naam) + ', <strong>' + r.q.tot + '</strong> van 100 punten. <a href="' + pad(pl, s) + '">Bekijk uw pagina</a>.</p>' + waarom(r, plek) + '</div>' + (beter.length ? '<h2>Zo komt u hoger</h2><ul>' + beter.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul><p>Gegevens aanpassen kan gratis op <a href="' + esc(osmLink(x)) + '" rel="nofollow">OpenStreetMap</a>; uw eigen site kijken we elke 30 dagen opnieuw na.</p>' : '') : '<p>Zoek uw kantoor op via <a href="/advocaat">uw gemeente</a> en tik onderaan uw pagina op de regel voor kantoren; dan ziet u hier uw stand.</p>') +
    '<h2>Gratis: gegevens aanvullen</h2><p>Kloppen uw telefoon, adres, website, rechtsgebieden of advocaten niet? Stuur ze ons, dan zetten we ze erin.</p><div class="kn"><a class="cta of" data-t="wa" data-pl="voor-kantoren" href="' + esc(wa('Gegevens aanvullen voor ' + (x ? x.naam : 'mijn advocatenkantoor') + ' op keuzehulp.best')) + '" target="_blank" rel="noopener">Gegevens sturen via WhatsApp</a></div>' +
    '<h2>Meer bekendheid</h2><ul><li>We laten zien wat ChatGPT, Perplexity en Google nu antwoorden op vragen als "beste advocaat arbeidsrecht in ' + esc(r ? P[pl].naam : 'uw plaats') + '", en of uw kantoor en uw advocaten genoemd worden.</li><li>Uw pagina en de pagina\'s van uw advocaten krijgen de antwoorden op de vragen die cliënten stellen, met uw eigen gegevens en bronnen.</li><li>U ziet elke maand hoe vaak mensen via ons bellen, de route openen, uw website bezoeken of een eerste gesprek aanvragen.</li></ul><div class="kn"><a class="cta of" data-t="wa" data-pl="voor-kantoren" href="' + esc(wa('Ik wil een voorstel voor meer bekendheid voor ' + (x ? x.naam : 'mijn advocatenkantoor') + ' via keuzehulp.best')) + '" target="_blank" rel="noopener">Vraag het voorstel aan via WhatsApp</a></div>' +
    '<h2>Zo rangschikken we</h2>' + wegingTabel();
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: B + '/advocaat/voor-kantoren', name: 'Advocatenkantoor beter gevonden in ChatGPT en Google', inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] } }] };
  return doc({ titel: 'Advocatenkantoor beter vindbaar in ChatGPT en Google', desc: 'Uw advocatenkantoor beter gevonden in ChatGPT en Google: zie uw plek in de Keuzehulp-score van 0 tot 100, vul gratis uw gegevens aan.', pad: '/advocaat/voor-kantoren', body, schema, noindex: !!s, pl: 'voor-kantoren' });
}

// ---------- sitemap, IndexNow, chat, llms.txt, stand ----------
export async function sitemapUrls() {
  const urls = [], d = await alleData(); if (d.some(o => o.x && o.x.n >= MIN)) urls.push(B + '/advocaat', B + '/advocaat/voor-kantoren');
  for (const { p, x } of d) { if (!x || x.n < MIN) continue; urls.push(B + pad(p.slug)); const k = await pakket(p.slug); if (!k) continue;
    rgTelling(k.rij).filter(o => o.n >= MIN_RG).forEach(o => urls.push(B + pad(p.slug, o.s)));
    k.rij.forEach(r => { if (gegPunten(r.x) >= 10) urls.push(B + pad(p.slug, r.x.s)); }); }
  return urls;
}
export async function sitemap() { const urls = await sitemapUrls(); return { urls, xml: '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(u => '<url><loc>' + esc(u) + '</loc></url>').join('') + '</urlset>' }; }
const INDEXNOW = '466971cbc1bbe43e6bb64a94465e4470';
// nieuwe pagina's melden (na elke verversing), en met ping de hub, de plaatsen en de rechtsgebieden opnieuw (na een wijziging in de tekst)
export async function meldNieuw() {
  const hk = u => createHash('sha1').update(u).digest('hex').slice(0, 10);
  const gezien = new Set((await kv.get('adv:ping').catch(() => null)) || []); const { urls } = await sitemap(); const nieuw = urls.filter(u => !gezien.has(hk(u))); if (!nieuw.length) return { nieuw: 0 };
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key: INDEXNOW, keyLocation: B + '/' + INDEXNOW + '.txt', urlList: nieuw.slice(0, 9000) }), signal: AbortSignal.timeout(20000) }).catch(() => null);
  if (r && r.status < 300) { nieuw.forEach(u => gezien.add(hk(u))); await kv.set('adv:ping', [...gezien]).catch(() => {}); }
  return { nieuw: nieuw.length, status: r ? r.status : 'fout' };
}
export async function ping() {
  const { urls } = await sitemap(), urlList = urls.filter(u => /\/advocaat(\/[a-z-]+)?$/.test(u) || RG.some(([s]) => u.endsWith('/' + s)));
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key: INDEXNOW, keyLocation: B + '/' + INDEXNOW + '.txt', urlList }), signal: AbortSignal.timeout(20000) }).catch(() => null);
  return { n: urlList.length, status: r ? r.status : 'fout' };
}
export async function plaatsLijst() { return (await plaatsInfo()).map(o => ({ naam: o.p.naam, href: '/advocaat/' + o.p.slug, n: o.n })).sort((a, b) => a.naam.localeCompare(b.naam, 'nl')); }
export async function chatItems() {
  const info = await plaatsInfo(), uit = [];
  uit.push({ slug: 'advocaat', pad: '/advocaat', term: 'advocaat', title: 'Advocaat vergelijken per gemeente', kort: 'Advocatenkantoren per gemeente op volgorde van de Keuzehulp-score, met rechtsgebieden, advocaten met naam en een gratis eerste gesprek per kantoor.',
    uitleg: 'Keuzehulp-score: ' + WEGING.map(w => w.naam + ' ' + w.max + ' punten').join('; ') + '. Gemeenten (slug): ' + info.map(o => 'advocaat-' + o.p.slug + ' (' + o.p.naam + ', ' + o.n + ' kantoren)').join(', ') + '. Noemt de bezoeker een gemeente uit die lijst, wijs die pagina aan. Gratis advies bij laag inkomen: Juridisch Loket 0800-8020.', faq: [VAST_FAQ.gratis('Nederland', 0), VAST_FAQ.toev('Nederland', 0), VAST_FAQ.check].map(([q, a]) => ({ q, a })) });
  for (const o of info) { const k = await pakket(o.p.slug); if (!k) continue; const f = plaatsFaq(o.p, k.rij, k.x0.t);
    uit.push({ slug: 'advocaat-' + o.p.slug, pad: pad(o.p.slug), term: 'advocaat ' + o.p.naam.toLowerCase(), title: 'Beste advocaat in ' + o.p.naam,
      kort: 'Alle ' + k.rij.length + ' advocatenkantoren in ' + o.p.naam + ' op volgorde van de Keuzehulp-score. Bij elk kantoor een knop voor een gratis eerste gesprek.',
      uitleg: 'Ranglijst (plek, naam, punten, rechtsgebieden, wat telt, adres, telefoon): ' + k.rij.slice(0, 40).map((r, i) => { const b = []; if (r.sc && r.sc.rg && r.sc.rg.length) b.push(r.sc.rg.map(s => RGN[s].toLowerCase()).join('/')); if (r.sc && r.sc.prijs && r.sc.prijs.length) b.push(r.sc.prijs.map(z => z.tekst).join(', ')); if (r.sc && r.sc.toev === true) b.push('toevoeging'); if (r.sc && r.sc.gratis) b.push('gratis eerste gesprek'); ((r.sc && r.sc.rev) || []).forEach(z => b.push(revTekst(z))); return (i + 1) + '. ' + r.x.naam + ' (' + r.q.tot + ' punten' + (b.length ? '; ' + b.join('; ') : '') + ')' + (r.x.adres ? ', ' + r.x.adres : '') + (r.x.tel ? ', tel ' + telTekst(r.x.tel) : ''); }).join(' | ') + '. Wil de bezoeker een eerste gesprek, wijs dan de knop bij het kantoor op deze pagina aan.',
      faq: f.map(([q, a]) => ({ q, a })) }); }
  return uit;
}
export async function llmsDeel() {
  const info = await plaatsInfo(); if (!info.length) return '';
  const regels = [];
  for (const o of info.sort((a, b) => b.p.inw - a.p.inw)) { const k = await pakket(o.p.slug); const top = k ? k.rij.slice(0, 3) : []; regels.push('- [Beste advocaat in ' + o.p.naam + '](' + B + pad(o.p.slug) + '): alle ' + o.n + ' advocatenkantoren vergeleken.' + (top.length ? ' Top 3: ' + top.map((r, i) => (i + 1) + '. ' + r.x.naam + ' (' + r.q.tot + ' punten)').join(', ') + '.' : '')); }
  return '\n\n## Advocaten per gemeente ([alle](' + B + '/advocaat))\n\n- [Advocaat vergelijken per gemeente](' + B + '/advocaat): advocatenkantoren op volgorde van de Keuzehulp-score (gegevens 15, rechtsgebieden op de eigen site 15, advocaten met naam 5, tarief 15, gratis eerste gesprek 5, toevoeging 10, reviews 25, meningen van bezoekers 10), met per kantoor waarom het op die plek staat en de advocaten die de eigen site noemt.\n' + regels.join('\n');
}
export async function stand() {
  const d = await alleData(), lp = await kv.raw(['HGETALL', 'adv:leadp']).catch(() => []) || [];
  const paar = h => { if (!Array.isArray(h)) return h || {}; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[h[i]] = Number(h[i + 1]) || 0; return o; };
  const LP = paar(lp), dagen = [];
  for (let i = 0; i < 7; i++) { const dg = dagIso(Date.now() - i * 864e5); dagen.push({ dag: dg, ...paar(await kv.raw(['HGETALL', 'adv:tikd:' + dg]).catch(() => [])), leads: paar(await kv.raw(['HGETALL', 'adv:leadd:' + dg]).catch(() => [])) }); }
  const plaatsen = [];
  for (const { p, x } of d) { const sc = x ? await scans(p.slug) : {}, w = x ? x.items.filter(i => i.web) : [], v = Object.values(sc);
    plaatsen.push({ plaats: p.slug, inw: p.inw, n: x ? x.n : 0, bron: x ? x.bron : null, bijgewerkt: x ? x.t : null, metWebsite: w.length, gescand: w.filter(i => sc[i.s]).length, geenAdv: v.filter(z => z.advWoord === false).length, rg: v.filter(z => z.rg && z.rg.length).length, advocatenMetNaam: v.reduce((a, z) => a + ((z.adv && z.adv.length) || 0), 0), prijs: v.filter(z => z.prijs && z.prijs.length).length, toev: v.filter(z => z.toev === true).length, gratis: v.filter(z => z.gratis).length, reviews: v.filter(z => z.rev && z.rev.length).length, leads: LP[p.slug] || 0 }); }
  const tot = k => plaatsen.reduce((a, o) => a + (o[k] || 0), 0);
  return { ok: true, uitleg: 'Advocaten per gemeente (lib/advocaat.js): kantoren uit OpenStreetMap, scan van de eigen site, Keuzehulp-score (gegevens 15, rechtsgebieden 15, advocaten met naam 5, tarief 15, gratis eerste gesprek 5, toevoeging 10, reviews 25, meningen 10), aanvragen eerste gesprek (alleen tellers; gegevens op de beschermde host met op=leads).', totaal: { plaatsenGevuld: plaatsen.filter(o => o.n).length, kantoren: tot('n'), gescand: tot('gescand'), advocatenMetNaam: tot('advocatenMetNaam'), leads: tot('leads') }, plaatsen, dagen };
}
