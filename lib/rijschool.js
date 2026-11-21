// Rijschool vergelijken per plaats op keuzehulp.best (19 nov 2026). Henkjan: "Maak een keuzehulp en biedt deze aan aan Mylevel. Rijschool-leads
// als tweede verdienmodel: wie de oefentoets haalt, krijgt een rijschool in de buurt. Rijscholen betalen per lead."
// Zelfde aanpak als de makelaars (lib/makelaar.js): alle rijscholen per gemeente uit OpenStreetMap, een uitlegbare Keuzehulp-score en per pagina
// een aanvraag ("laat een rijschool bij jou in de buurt contact opnemen"). Aanvragen worden alleen opgeslagen en geteld; doorsturen en de prijs per
// aanvraag beslist Henkjan. MyLevel (mylevel.today, CBR-oefenexamen) stuurt geslaagde oefenaars hierheen met ?pc=<postcode>&src=mylevel&t=cbr-theorie.
//
// Bronnen (alles gratis, per rijschool te controleren):
// - Rijscholen: OpenStreetMap (shop=driving_school en amenity=driving_school, plus namen met rijschool), binnen de gemeentegrens (gedeeld met de
//   makelaars, hk:grens:<plaats>). Overpass eerst, dan ohsome (HeiGIT), dan Nominatim. Geen verzonnen rijscholen.
// - Eigen website van de rijschool (scan elk half uur, 30 dagen geldig): prijs per les en pakketprijs, automaat, faalangst, spoedopleiding,
//   BOVAG of KRM op de site, en links naar reviewplatforms; cijfer en aantal alleen uit de JSON-LD van het platform zelf.
// - CBR opleiderresultaten (open data, CC-BY 4.0, data.overheid.nl/dataset/cbr-opleiderresultaten): slagingspercentage per rijschool, als het
//   bestand per rijschool te koppelen is (op=cbr laadt het, op=cbrkop toont de kolommen).
// KV: rs:x:<plaats> rijscholen, rs:t:<plaats> laatste ververs, rs:sc:<plaats> scan, rs:cbr CBR per rijschool, rs:lead:<id> aanvraag (180 dagen),
// rs:leadids lijst, rs:leadp per plaats, rs:leadb per bron (mylevel apart), rs:leadd:<dag>, rs:tikd:<dag>, rs:tik:<plaats>, rs:pc:<4 cijfers>, rs:ping.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { kzuxBlok } from './kzux.js';
import { esc, slugify, rooster, status, statusTekst, weekRegels, telLink, telTekst, webLink, webTekst, routeLink, osmLink, afstand, datumNL, CSS as RCSS } from './rdam.js';
import { grens, binnen, haal, kaal, aggUit, PLATF, MK_CSS, faqBlok, faqLd, kruim, lijstNL } from './makelaar.js';

const HOST = 'keuzehulp.best', B = 'https://' + HOST;
export const MIN = 5; // minder rijscholen = niet compleet genoeg: noindex en niet in de sitemap
const UA = 'keuzehulp.best/1.0 (rijscholen vergelijken; +https://keuzehulp.best/rijschool)';
const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|python|curl|wget|axios|node-fetch|httpclient|monitor/i;
const LEES = '19 november 2026';
// De 40 grootste gemeenten op 1 januari 2026 (allecijfers.nl, ranglijst grootste gemeenten in inwoners, gelezen 19 november 2026). Uitbreidbaar:
// een regel erbij en de cron vult hem. c = ongeveer het middelpunt (noodvak als de grens niet laadt, en voor de postcodezoeker).
export const PLAATSEN = [
  ['amsterdam', 'Amsterdam', 'Amsterdam', 941927, 52.37, 4.90], ['rotterdam', 'Rotterdam', 'Rotterdam', 673804, 51.92, 4.48], ['den-haag', 'Den Haag', 'Den Haag', 569468, 52.08, 4.31],
  ['utrecht', 'Utrecht', 'Utrecht', 378121, 52.09, 5.12], ['eindhoven', 'Eindhoven', 'Eindhoven', 249783, 51.44, 5.48], ['groningen', 'Groningen', 'Groningen', 244427, 53.22, 6.57],
  ['almere', 'Almere', 'Almere', 232619, 52.37, 5.21], ['tilburg', 'Tilburg', 'Tilburg', 230746, 51.56, 5.09], ['breda', 'Breda', 'Breda', 190204, 51.59, 4.78],
  ['nijmegen', 'Nijmegen', 'Nijmegen', 189871, 51.84, 5.86], ['arnhem', 'Arnhem', 'Arnhem', 171822, 51.98, 5.91], ['apeldoorn', 'Apeldoorn', 'Apeldoorn', 169212, 52.21, 5.97],
  ['haarlem', 'Haarlem', 'Haarlem', 168898, 52.38, 4.64], ['haarlemmermeer', 'Haarlemmermeer', 'Haarlemmermeer', 166978, 52.30, 4.69], ['zaanstad', 'Zaanstad', 'Zaanstad', 165201, 52.44, 4.83],
  ['amersfoort', 'Amersfoort', 'Amersfoort', 163764, 52.16, 5.39], ['enschede', 'Enschede', 'Enschede', 162683, 52.22, 6.89], ['den-bosch', 'Den Bosch', "'s-Hertogenbosch", 162295, 51.69, 5.30],
  ['zwolle', 'Zwolle', 'Zwolle', 134147, 52.52, 6.09], ['zoetermeer', 'Zoetermeer', 'Zoetermeer', 130836, 52.06, 4.49], ['leiden', 'Leiden', 'Leiden', 130328, 52.16, 4.49],
  ['leeuwarden', 'Leeuwarden', 'Leeuwarden', 130162, 53.20, 5.80], ['maastricht', 'Maastricht', 'Maastricht', 126026, 50.85, 5.69], ['ede', 'Ede', 'Ede', 125331, 52.04, 5.67],
  ['dordrecht', 'Dordrecht', 'Dordrecht', 122991, 51.81, 4.67], ['westland', 'Westland', 'Westland', 118874, 51.99, 4.21], ['alphen-aan-den-rijn', 'Alphen aan den Rijn', 'Alphen aan den Rijn', 117284, 52.13, 4.66],
  ['alkmaar', 'Alkmaar', 'Alkmaar', 113196, 52.63, 4.75], ['delft', 'Delft', 'Delft', 110089, 52.01, 4.36], ['emmen', 'Emmen', 'Emmen', 109881, 52.79, 6.90],
  ['deventer', 'Deventer', 'Deventer', 105111, 52.25, 6.16], ['venlo', 'Venlo', 'Venlo', 104195, 51.37, 6.17], ['helmond', 'Helmond', 'Helmond', 96860, 51.48, 5.66],
  ['purmerend', 'Purmerend', 'Purmerend', 96182, 52.50, 4.95], ['amstelveen', 'Amstelveen', 'Amstelveen', 95840, 52.30, 4.86], ['oss', 'Oss', 'Oss', 95549, 51.77, 5.52],
  ['hilversum', 'Hilversum', 'Hilversum', 94595, 52.22, 5.18], ['land-van-cuijk', 'Land van Cuijk', 'Land van Cuijk', 93645, 51.68, 5.88], ['sittard-geleen', 'Sittard-Geleen', 'Sittard-Geleen', 92461, 51.00, 5.87],
  ['hoeksche-waard', 'Hoeksche Waard', 'Hoeksche Waard', 91445, 51.80, 4.45],
].map(([slug, naam, osm, inw, la, lo]) => ({ slug, naam, osm, inw, c: [la, lo] }));
const P = Object.fromEntries(PLAATSEN.map(p => [p.slug, p]));
export const isPlaats = s => !!P[s];
const dagIso = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const datumKort = t => new Date(t).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' });
const komma = (n, d = 1) => (+n).toFixed(d).replace('.', ',');
const pct = v => Math.round(v * 100) + '%';
const eur = v => '€ ' + (Math.round(v * 100) % 100 ? (+v).toFixed(2).replace('.', ',') : Math.round(v).toLocaleString('nl-NL'));
const hash = s => createHash('sha256').update(String(s) + '|' + (process.env.CRON_SECRET || 'rs')).digest('hex').slice(0, 20);
const wacht = ms => new Promise(r => setTimeout(r, ms));
const BRON = {
  rz: ['CBR Rijschoolzoeker (AutoRAI, 6 mei 2022)', 'https://autorai.nl/cbr-bezorgd-om-laag-slagingspercentage-rijexamens-introduceert-rijschoolzoeker/'],
  cbr: ['CBR opleiderresultaten, open data (CC-BY 4.0)', 'https://data.overheid.nl/dataset/cbr-opleiderresultaten'],
  kosten: ['AutoRAI: dit kost je rijbewijs halen in 2026 (21 oktober 2025)', 'https://autorai.nl/dit-kost-je-rijbewijs-halen-in-2026'],
  bovag: ['Algemene voorwaarden BOVAG Rijscholen (SER, versie november 2024)', 'https://www.ser.nl/-/media/ser/downloads/algemene-voorwaarden/bovag-rijscholen.pdf'],
  inw: ['allecijfers.nl, grootste gemeenten op 1 januari 2026', 'https://allecijfers.nl/ranglijst/grootste-en-kleinste-gemeenten-in-inwoners-in-nederland/'],
};
const bronLink = k => '<a href="' + esc(BRON[k][1]) + '" target="_blank" rel="noopener nofollow">' + esc(BRON[k][0]) + '</a>';

// ---------- CBR opleiderresultaten (open data) ----------
const CBR_URL = 'https://www.cbr.nl/web/file?uuid=191d04ef-02d9-4948-b691-4e3766dfa844&owner=d214f7b5-5ce0-48dc-a521-4ef537c9d232&contentid=8120';
function csvRijen(t, d) {
  const uit = []; let rij = [], v = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { v += '"'; i++; } else q = false; } else v += c; continue; }
    if (c === '"') q = true; else if (c === d) { rij.push(v); v = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; rij.push(v); v = ''; if (rij.length > 1 || rij[0]) uit.push(rij); rij = []; } else v += c; }
  if (v || rij.length) { rij.push(v); uit.push(rij); }
  return uit;
}
const normNaam = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' en ').replace(/\b(auto)?rij(school|opleiding(en)?|scholen|les(sen)?)\b|\bverkeersschool\b|\bvof\b|\bv\.o\.f\.?|\bb\.?v\.?\b|\bbv\b|\bcv\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
// kolommen herkennen op naam: het bestand is van het CBR en kan van vorm veranderen; op=cbrkop laat de kolommen en een paar regels zien
function kolommen(kop) {
  const k = kop.map(x => String(x || '').toLowerCase().trim()), vind = (re, niet) => k.findIndex(x => re.test(x) && !(niet && niet.test(x)));
  return { naam: vind(/naam/, /examen|locatie|product|plaats/), code: vind(/code|nummer|kvk/, /post|examen|product|locatie/), pc: vind(/postcode/, /locatie|examen/), plaats: vind(/plaats/, /locatie|examen/),
    product: vind(/product|categorie|soort/), trans: vind(/transmissie|schakel|automaat/), vold: vind(/voldoende|geslaagd/, /onvoldoende/), onv: vind(/onvoldoende|gezakt/), tot: vind(/totaal|aantal/, /voldoende|geslaagd|onvoldoende|gezakt/), eerste: vind(/eerste|herexamen|soort examen/), per: vind(/periode|jaar|maand|datum/) };
}
export async function cbrLaad() {
  const t0 = Date.now(); let r, tekst;
  try { r = await fetch(CBR_URL, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; ' + UA + ')', accept: 'text/csv,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(90000) }); tekst = await r.text(); }
  catch (e) { return { ok: false, fout: String(e.name || e).slice(0, 40) }; }
  if (!r.ok || !tekst) return { ok: false, status: r.status };
  if (tekst.charCodeAt(0) === 0xfeff) tekst = tekst.slice(1);
  const eerste = tekst.slice(0, tekst.indexOf('\n') > 0 ? tekst.indexOf('\n') : 500), d = (eerste.match(/;/g) || []).length >= (eerste.match(/,/g) || []).length ? ';' : ',';
  const rijen = csvRijen(tekst, d), kop = rijen[0] || [], K = kolommen(kop);
  const probe = { t: new Date().toISOString(), status: r.status, ct: String(r.headers.get('content-type') || ''), bytes: tekst.length, rijen: rijen.length, scheiding: d, kop, kolommen: K, voorbeeld: rijen.slice(1, 6) };
  await kv.set('rs:cbrkop', probe).catch(() => {});
  if (K.naam < 0 || (K.vold < 0 && K.tot < 0)) return { ok: false, fout: 'kolommen niet herkend', ...probe };
  const per = {}, getal = x => +String(x || '0').replace(/\./g, '').replace(',', '.') || 0; let n = 0;
  for (const rij of rijen.slice(1)) {
    const prod = K.product >= 0 ? String(rij[K.product] || '') : '';
    if (prod && (!(/\bB\b|personenauto|\bauto\b/i.test(prod)) || /theorie|aanhang|\bBE\b(?!.*\bB\b)/i.test(prod))) continue; // alleen praktijkexamen rijbewijs B
    if (K.eerste >= 0 && /her|tweede/i.test(String(rij[K.eerste] || '')) && !/eerste/i.test(String(rij[K.eerste] || ''))) continue;
    const naam = String(rij[K.naam] || '').trim(); if (!naam) continue;
    const pc = K.pc >= 0 ? String(rij[K.pc] || '').toUpperCase().replace(/\s/g, '') : '', sl = (K.code >= 0 ? String(rij[K.code] || '') : '') || normNaam(naam) + '|' + pc;
    const vold = K.vold >= 0 ? getal(rij[K.vold]) : 0, onv = K.onv >= 0 ? getal(rij[K.onv]) : 0, tot = K.tot >= 0 ? getal(rij[K.tot]) : vold + onv;
    const o = per[sl] = per[sl] || { naam, pc, plaats: K.plaats >= 0 ? String(rij[K.plaats] || '') : '', ok: 0, n: 0 };
    o.ok += vold; o.n += tot || vold + onv; n++;
    if (K.per >= 0) { const pv = String(rij[K.per] || ''); if (pv) { o.van = !o.van || pv < o.van ? pv : o.van; o.tot = !o.tot || pv > o.tot ? pv : o.tot; } }
  }
  const lijst = Object.values(per).filter(o => o.n > 0 && o.ok <= o.n).map(o => [o.naam.slice(0, 80), o.pc.slice(0, 6), o.ok, o.n, o.plaats.slice(0, 40)]);
  if (!lijst.length) return { ok: false, fout: 'geen rijen voor rijbewijs B', ...probe };
  const tot = lijst.reduce((a, x) => a + x[3], 0), ok = lijst.reduce((a, x) => a + x[2], 0);
  const per2 = Object.values(per).filter(o => o.van), periode = per2.length ? per2.reduce((a, o) => ({ van: !a.van || o.van < a.van ? o.van : a.van, tot: !a.tot || o.tot > a.tot ? o.tot : a.tot }), {}) : null;
  await kv.set('rs:cbr', { t: new Date().toISOString(), bron: CBR_URL, landelijk: ok / tot, examens: tot, periode, lijst });
  return { ok: true, rijscholen: lijst.length, rijen: n, landelijk: ok / tot, periode, ms: Date.now() - t0 };
}
let CBR = null, CBRT = 0;
async function cbr() { if (CBR && Date.now() - CBRT < 300000) return CBR; CBR = await kv.get('rs:cbr').catch(() => null); CBRT = Date.now(); if (CBR && CBR.lijst) { CBR.idx = {}; CBR.lijst.forEach(x => { const k = x[1].slice(0, 4); (CBR.idx[k] = CBR.idx[k] || []).push(x); }); } return CBR; }
// koppelen: dezelfde postcode (4 cijfers) en dezelfde naam zonder 'rijschool', 'b.v.' en dergelijke, of de ene naam zit in de andere
export function cbrMatch(x, C) {
  if (!C || !C.idx) return null; const pc = String(x.pc || '').toUpperCase().replace(/\s/g, ''), nn = normNaam(x.naam); if (!nn || nn.length < 3) return null;
  const kand = pc.length >= 4 ? C.idx[pc.slice(0, 4)] || [] : [];
  let best = null;
  for (const c of kand) { const cn = normNaam(c[0]); if (!cn) continue; const z = cn === nn ? 3 : (cn.length >= 4 && nn.length >= 4 && (cn.includes(nn) || nn.includes(cn))) ? 2 : 0; if (!z) continue; const sc = z + (c[1] && pc && c[1] === pc ? 1 : 0); if (!best || sc > best.sc || (sc === best.sc && c[3] > best.c[3])) best = { sc, c }; }
  return best ? { naam: best.c[0], ok: best.c[2], n: best.c[3], pct: best.c[2] / best.c[3] } : null;
}

// ---------- de Keuzehulp-score ----------
export const WEGING = [
  { k: 'cbr', naam: 'Slagingspercentage bij het CBR', max: 30, uitleg: 'het aandeel geslaagde praktijkexamens rijbewijs B van leerlingen van deze rijschool volgens de open data van het CBR, samen met 20 denkbeeldige examens op het landelijke gemiddelde zodat een paar examens niet alles bepalen; 35% of lager is 0 punten, 75% of hoger 30', bron: 'CBR opleiderresultaten (open data), met de periode erbij' },
  { k: 'reviews', naam: 'Reviews op andere platforms', max: 25, uitleg: 'cijfer en aantal van Klantenvertellen, Kiyoh, Feedback Company en Trustpilot, elk naar een schaal van 5; elke review telt één keer, samen met 10 denkbeeldige reviews van 4 sterren. 3 sterren of lager is 0 punten, 5 sterren 25', bron: 'de pagina van het platform zelf, met link' },
  { k: 'prijs', naam: 'Prijs staat op de eigen site', max: 15, uitleg: 'een prijs per rijles (tussen € 35 en € 120) of een pakketprijs (tussen € 500 en € 6.000) staat op de eigen site; dan weet je vooraf waar je aan toe bent', bron: 'eigen website van de rijschool, met de datum van controle' },
  { k: 'gegevens', naam: 'Gegevens compleet', max: 15, uitleg: 'adres, telefoon, website en openingstijden staan in OpenStreetMap: 4 punten voor adres, telefoon en website, 3 voor openingstijden', bron: 'OpenStreetMap' },
  { k: 'aanbod', naam: 'Aanbod voor jouw situatie', max: 10, uitleg: 'de eigen site noemt lessen in een automaat (4 punten), begeleiding bij faalangst of een faalangstexamen (3) en een spoedopleiding (3)', bron: 'eigen website van de rijschool' },
  { k: 'keurmerk', naam: 'BOVAG of KRM', max: 5, uitleg: 'de rijschool noemt op de eigen site dat ze lid is van BOVAG of een KRM-keurmerk heeft. BOVAG-rijscholen werken met algemene voorwaarden die met de ANWB zijn afgesproken, met een geschillencommissie', bron: 'eigen website van de rijschool; voorwaarden: SER' },
];
const REV_PRIOR = 4, REV_M = 10, CBR_M = 20;
export function punten(x, sc, cb, land) {
  const p = { gegevens: (x.adres ? 4 : 0) + (x.tel ? 4 : 0) + (x.web ? 4 : 0) + (rooster(x.uren) ? 3 : 0) };
  const L = land || 0.5, Bc = cb ? (cb.ok + CBR_M * L) / (cb.n + CBR_M) : null;
  p.cbr = Bc == null ? 0 : Math.round(30 * Math.max(0, Math.min(1, (Bc - 0.35) / 0.4)));
  const rv = (sc && sc.rev) || []; let n = 0, T = 0; rv.forEach(r => { n += r.aantal; T += r.aantal * (r.score / r.max * 5); });
  const B5 = n ? (T + REV_M * REV_PRIOR) / (n + REV_M) : null, gem5 = n ? T / n : null;
  p.reviews = B5 == null ? 0 : Math.round(25 * Math.max(0, Math.min(1, (B5 - 3) / 2)));
  p.prijs = sc && sc.prijs && sc.prijs.length ? 15 : 0;
  p.aanbod = sc ? (sc.auto ? 4 : 0) + (sc.faal ? 3 : 0) + (sc.spoed ? 3 : 0) : 0;
  p.keurmerk = sc && sc.lid && sc.lid.length ? 5 : 0;
  return { p, tot: p.cbr + p.reviews + p.prijs + p.gegevens + p.aanbod + p.keurmerk, nrev: n, gem5, Bc };
}
export function rang(items, scan, C) {
  return items.map(x => { const sc = scan[x.s] || null, cb = cbrMatch(x, C); return { x, sc, cb, q: punten(x, sc, cb, C && C.landelijk) }; })
    .sort((a, b) => b.q.tot - a.q.tot || (b.cb ? b.cb.n : 0) - (a.cb ? a.cb.n : 0) || b.q.nrev - a.q.nrev || b.q.p.gegevens - a.q.p.gegevens || a.x.naam.localeCompare(b.x.naam, 'nl'));
}

// ---------- rijscholen uit OpenStreetMap ----------
const SPIEGELS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://z.overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
async function overpass(bbox, st, tot) {
  const q = '[out:json][timeout:60][bbox:' + bbox.join(',') + '];(nwr["shop"="driving_school"];nwr["amenity"="driving_school"];nwr["office"]["name"~"rijschool|rijopleiding",i];nwr["shop"]["name"~"rijschool",i];);out center tags;';
  const t0 = Date.now(), start = Math.floor(Date.now() / 3600000) % SPIEGELS.length;
  for (let i = 0; i < SPIEGELS.length; i++) { const u = SPIEGELS[(start + i) % SPIEGELS.length]; if (Date.now() - t0 > tot) break; const h = u.split('/')[2].split('.')[0];
    try { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(Math.max(5000, Math.min(45000, tot - (Date.now() - t0)))) });
      st.push(h + ':' + r.status); if (!r.ok) continue; const j = await r.json(); if (j && Array.isArray(j.elements) && !/error/i.test(String(j.remark || ''))) return j.elements; st.push(h + ':remark'); } catch (e) { st.push(h + ':' + String(e.name || e).slice(0, 16)); } }
  return null;
}
async function ohsome(bbox, st) {
  const [s, w, n, e] = bbox;
  try { const r = await fetch('https://api.ohsome.org/v1/elements/centroid', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA }, body: new URLSearchParams({ bboxes: [w, s, e, n].join(','), filter: '(shop=driving_school or amenity=driving_school) and name=*', properties: 'tags' }).toString(), signal: AbortSignal.timeout(45000) });
    st.push('ohsome:' + r.status); if (!r.ok) return null; const j = await r.json(); if (!j || !Array.isArray(j.features)) return null;
    return j.features.map(f => { const p = f.properties || {}, [type, id] = String(p['@osmId'] || '').split('/'), c = (f.geometry && f.geometry.coordinates) || []; const tags = {}; for (const [k, v] of Object.entries(p)) if (!k.startsWith('@')) tags[k] = v; return { type: type || 'node', id, lat: c[1], lon: c[0], tags }; }).filter(x => x.id && x.lat != null);
  } catch (er) { st.push('ohsome:' + String(er.name || er).slice(0, 16)); return null; }
}
async function nominatim(bbox, st, tot) {
  const [s, w, n, e] = bbox, uit = new Map(), t0 = Date.now();
  const ny = Math.max(1, Math.ceil((n - s) / 0.07)), nx = Math.max(1, Math.ceil((e - w) / 0.1)), vakken = [];
  for (let i = 0; i < ny; i++) for (let k = 0; k < nx; k++) vakken.push([s + (n - s) * i / ny, w + (e - w) * k / nx, s + (n - s) * (i + 1) / ny, w + (e - w) * (k + 1) / nx]);
  const vraag = async (vb, q, pagina) => { const excl = []; for (let pg = 0; pg < pagina; pg++) { if (Date.now() - t0 > tot) return; await wacht(1050); let l = null;
    try { const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&extratags=1&addressdetails=1&limit=40&bounded=1&viewbox=' + vb.join(',') + '&q=' + encodeURIComponent(q) + (excl.length ? '&exclude_place_ids=' + excl.join(',') : ''), { headers: { 'user-agent': UA, 'accept-language': 'nl' }, signal: AbortSignal.timeout(15000) }); if (r.status !== 200) st.push('nom:' + r.status); if (r.ok) l = await r.json(); } catch (er) { st.push('nom:' + String(er.name || er).slice(0, 16)); }
    if (!Array.isArray(l) || !l.length) return; l.forEach(x => { excl.push(x.place_id); const k = x.osm_type + x.osm_id; if (!uit.has(k)) uit.set(k, x); }); if (l.length < 40) return; } };
  for (const [s2, w2, n2, e2] of vakken.slice(0, 30)) await vraag([w2, n2, e2, s2], '[shop=driving_school]', 3);
  for (const q of ['[amenity=driving_school]', 'rijschool', 'autorijschool']) await vraag([w, n, e, s], q, 2);
  st.push('vakken:' + vakken.length);
  return [...uit.values()].map(x => { const a = x.address || {}, et = x.extratags || {}; return { type: String(x.osm_type || 'node'), id: x.osm_id, lat: +x.lat, lon: +x.lon, tags: { ...et, name: x.name || et.name || '', [x.category]: x.type, 'addr:street': a.road || '', 'addr:housenumber': a.house_number || '', 'addr:postcode': a.postcode || '', 'addr:city': a.city || a.town || a.village || '' } }; });
}
const NIET_RS = /\b(cbr|examencentrum|examenlocatie|verkeersplein|parkeer|fietsschool|vaarschool|zeilschool|vliegschool)\b/i;
export async function ververs(slug, o = {}) {
  const p = P[slug]; if (!p) return { ok: false, fout: 'plaats' };
  const t0 = Date.now(), st = [], g = await grens(p);
  const bbox = g && g.bbox ? g.bbox : [p.c[0] - 0.07, p.c[1] - 0.11, p.c[0] + 0.07, p.c[1] + 0.11];
  let els = o.bron === 'nominatim' || o.bron === 'ohsome' ? null : await overpass(bbox, st, 90000), bron = 'overpass';
  if (!els && o.bron !== 'nominatim') { els = await ohsome(bbox, st); bron = 'ohsome'; if (els && !els.length) els = null; }
  if (!els) { els = await nominatim(bbox, st, 150000); bron = 'nominatim'; if (!els.length) els = null; }
  else if (bron === 'ohsome') { const nm = await nominatim(bbox, st, 120000).catch(() => []); const ids = new Set(els.map(x => String(x.type)[0] + x.id)); nm.forEach(x => { if (!ids.has(String(x.type)[0] + x.id)) els.push(x); }); }
  if (!els) return { ok: false, fout: 'geen bron', grens: g && g.fout ? g.fout : 'ok', status: st, ms: Date.now() - t0 };
  const oud = await data(slug).catch(() => null), gezien = new Set(), slugs = new Set(), items = [];
  const nb = (lat, lon) => g && g.rings ? binnen(lat, lon, g.rings) : afstand({ lat, lon }, { lat: p.c[0], lon: p.c[1] }) < 7;
  for (const e of els) {
    const t = e.tags || {}, naam = String(t.name || '').trim(); if (!naam || t.highway || t.disused || t['disused:shop'] || t['disused:amenity'] || /^(yes|no)$/i.test(naam)) continue;
    const isRs = t.shop === 'driving_school' || t.amenity === 'driving_school' || (/rijschool|rijopleiding/i.test(naam) && (t.office || t.shop || t.craft)); if (!isRs || NIET_RS.test(naam)) continue;
    const lat = e.lat ?? (e.center && e.center.lat), lon = e.lon ?? (e.center && e.center.lon); if (lat == null || !nb(+lat, +lon)) continue;
    const id = String(e.type)[0] + e.id, dub = naam.toLowerCase() + '|' + String(t['addr:postcode'] || '').replace(/\s/g, '') + '|' + (t['addr:housenumber'] || ''); if (gezien.has(dub)) continue; gezien.add(dub);
    const vorig = oud && oud.items.find(i => i.id === id);
    let s = vorig ? vorig.s : (slugify(naam) || id); if (slugs.has(s)) s += '-' + (String(t['addr:postcode'] || '').replace(/\s/g, '').toLowerCase() || id); if (slugs.has(s)) s += '-' + id; slugs.add(s);
    items.push({ s, id, naam: naam.slice(0, 90), lat: +(+lat).toFixed(5), lon: +(+lon).toFixed(5), adres: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '), pc: t['addr:postcode'] || '', plaats: t['addr:city'] || p.naam,
      tel: t.phone || t['contact:phone'] || '', web: t.website || t['contact:website'] || t.url || '', uren: t.opening_hours || '' });
  }
  if (bron === 'nominatim' && oud) oud.items.forEach(i => { if (!items.some(x => x.id === i.id) && !slugs.has(i.s)) { slugs.add(i.s); items.push(i); } });
  if (!items.length && oud && oud.items.length) return { ok: false, fout: 'leeg, oude lijst gehouden', status: st };
  items.sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  await kv.set('rs:x:' + slug, { t: new Date().toISOString(), n: items.length, bron, items }); await kv.set('rs:t:' + slug, String(Date.now())).catch(() => {});
  return { ok: true, plaats: slug, n: items.length, bron, grens: g && g.rings ? 'gemeentegrens' : 'noodvak', status: st, ms: Date.now() - t0 };
}
export async function data(slug) { return P[slug] ? await kv.get('rs:x:' + slug).catch(() => null) : null; }
export async function alleData() { const v = await Promise.all(PLAATSEN.map(p => data(p.slug))); return PLAATSEN.map((p, i) => ({ p, x: v[i] })); }
export async function verversOudste() {
  const v = await kv.mget(...PLAATSEN.map(p => 'rs:t:' + p.slug)).catch(() => []);
  let best = null, bt = Infinity; PLAATSEN.forEach((p, i) => { const t = Number(v[i]) || 0; if (t < bt) { bt = t; best = p.slug; } });
  if (Date.now() - bt < 7 * 864e5) return { ok: true, niets: 'alles jonger dan 7 dagen' };
  const r = await ververs(best); if (!r.ok) await kv.set('rs:t:' + best, String(Date.now() - 6 * 864e5)).catch(() => {}); return r;
}

// ---------- scan van de eigen website ----------
const LID = { BOVAG: /bovag/i, KRM: /\bKRM\b|kwaliteitsregister rij/ };
const LES_W = /rijles|per les|lesuur|les van \d|lesprijs|losse les|prijs per les|lessen? \(?\d{2,3} ?min|60 minuten|90 minuten|minuten les/i;
const NIET_LES = /pakket|examen|cbr|theorie|motor|aanhang|bromfiets|scooter|vrachtwagen|\bbe\b|tussentijdse|ttt|faalangst|herexamen|inschrijf|administratie|leermiddelen|boek|cursus|opfris|korting/i;
export function prijsUit(tekst) {
  const uit = [], t = String(tekst || '');
  for (const m of t.matchAll(/€\s?(\d{1,3}(?:\.\d{3})+|\d{2,5})(?:,(\d{2}|-))?/g)) {
    const v = +m[1].replace(/\./g, '') + (m[2] && /\d\d/.test(m[2]) ? +m[2] / 100 : 0), voor = t.slice(Math.max(0, m.index - 90), m.index), na = t.slice(m.index + m[0].length, m.index + m[0].length + 40), zin = s => s.split(/[.;|!?€]\s/), dicht = zin(t.slice(Math.max(0, m.index - 45), m.index)).pop() + m[0] + zin(na.slice(0, 25))[0];
    if (v >= 35 && v <= 120 && LES_W.test(voor + na) && !NIET_LES.test(dicht) && !/motor|vrachtwagen|aanhang|bromfiets/i.test(voor)) uit.push({ soort: 'les', v, tekst: eur(v) + ' per les', auto: /automaat/i.test(dicht) });
    else if (v >= 500 && v <= 6000 && /pakket/i.test(voor + na) && !/motor|vrachtwagen|aanhang|bromfiets|scooter|\bAM\b|\bBE\b/i.test(dicht)) uit.push({ soort: 'pakket', v, tekst: 'pakket vanaf ' + eur(v) });
  }
  const laagst = k => uit.filter(x => x.soort === k).sort((a, b) => a.v - b.v)[0];
  return [laagst('les'), laagst('pakket')].filter(Boolean);
}
export function aanbodUit(tekst) {
  const t = String(tekst || '');
  return { auto: /automaat|automatic|automaatles|e-auto|elektrische auto/i.test(t), schakel: /schakel/i.test(t), faal: /faalangst/i.test(t), spoed: /spoedopleiding|spoedcursus|intensieve (rij)?opleiding|in (één|een|1) week rijbewijs|in 10 dagen|crashcursus/i.test(t) };
}
const SCAN_V = 1;
async function scanEen(x) {
  const uit = { t: Date.now(), v: SCAN_V, lid: [], prijs: [], rev: [] }; const w = webLink(x.web), thuis = await haal(w);
  if (!thuis.t) { uit.fout = thuis.f || thuis.s; return uit; }
  uit.url = thuis.u; let host = ''; try { host = new URL(thuis.u).hostname.replace(/^www\./, ''); } catch (e) {}
  let html = thuis.t; const links = [...html.matchAll(/href=["']([^"'#]+)["']/gi)].map(m => { try { return new URL(m[1].replace(/&amp;/g, '&'), thuis.u); } catch (e) { return null; } }).filter(Boolean);
  const sub = links.filter(u => u.hostname.replace(/^www\./, '') === host && /tarie|prijs|prijzen|pakket|kosten|rijles/i.test(u.pathname)).map(u => u.href).filter((u, i, a) => a.indexOf(u) === i).slice(0, 2);
  for (const su of sub) { const s2 = await haal(su, 8000); if (s2.t) { html += ' ' + s2.t; uit.prijsUrl = uit.prijsUrl || s2.u; } }
  const tekst = kaal(html);
  for (const [k, re] of Object.entries(LID)) if (re.test(k === 'BOVAG' ? html : tekst)) uit.lid.push(k);
  uit.prijs = prijsUit(tekst).map(p => ({ ...p, url: uit.prijsUrl || uit.url }));
  Object.assign(uit, aanbodUit(tekst));
  const pl = []; for (const u of links) { const h = u.hostname.replace(/^www\./, ''); const f = PLATF.find(([re]) => re.test(h)); if (f && !pl.some(z => z.naam === f[1]) && u.pathname.length > 3) pl.push({ naam: f[1], max: f[2], url: u.href }); }
  if (!pl.some(z => z.naam === 'Trustpilot') && host) pl.push({ naam: 'Trustpilot', max: 5, url: 'https://nl.trustpilot.com/review/' + host });
  for (const z of pl.slice(0, 3)) { const r = await haal(z.url, 8000); const a = r.t ? aggUit(r.t) : null; if (a && a.score <= (a.max || z.max)) uit.rev.push({ platform: z.naam, score: a.score, max: a.max || z.max, aantal: a.aantal, url: r.u || z.url }); }
  return uit;
}
async function scans(slug) { return (await kv.get('rs:sc:' + slug).catch(() => null)) || {}; }
export async function scanRonde(n = 30, tot = 200000) {
  const t0 = Date.now(), d = await alleData(), todo = [];
  for (const { p, x } of d) { if (!x) continue; const sc = await scans(p.slug); x.items.forEach(i => { if (i.web && !(sc[i.s] && sc[i.s].v === SCAN_V && Date.now() - sc[i.s].t < 30 * 864e5)) todo.push({ p, i, oud: sc[i.s] ? sc[i.s].t : 0 }); }); }
  todo.sort((a, b) => a.oud - b.oud || b.p.inw - a.p.inw); const doe = todo.slice(0, n), per = {}; let klaar = 0;
  for (let k = 0; k < doe.length; k += 6) { if (Date.now() - t0 > tot) break; await Promise.all(doe.slice(k, k + 6).map(async ({ p, i }) => { const r = await scanEen(i).catch(e => ({ t: Date.now(), lid: [], prijs: [], rev: [], fout: String(e.message || e).slice(0, 40) })); (per[p.slug] = per[p.slug] || {})[i.s] = r; klaar++; })); }
  for (const [sl, nw] of Object.entries(per)) { const sc = await scans(sl); Object.assign(sc, nw); await kv.set('rs:sc:' + sl, sc); }
  return { ok: true, gescand: klaar, open: todo.length - klaar, ms: Date.now() - t0 };
}
// cron: eerst de oudste plaats verversen (eens per 7 dagen per plaats), de CBR-data eens per 7 dagen, de rest van de tijd websites nakijken
export async function ronde() {
  const t0 = Date.now(), uit = {};
  const c = await kv.get('rs:cbr').catch(() => null), ck = await kv.get('rs:cbrpoging').catch(() => null);
  if ((!c || Date.now() - Date.parse(c.t) > 7 * 864e5) && !ck) { await kv.set('rs:cbrpoging', '1', { ex: 86400 }).catch(() => {}); uit.cbr = await cbrLaad().catch(e => ({ ok: false, fout: String(e.message || e).slice(0, 60) })); if (uit.cbr && uit.cbr.kop) uit.cbr = { ok: uit.cbr.ok, fout: uit.cbr.fout, rijen: uit.cbr.rijen }; }
  uit.ververs = await verversOudste().catch(e => ({ ok: false, fout: String(e.message || e).slice(0, 60) }));
  if (uit.ververs && uit.ververs.n) uit.indexnow = await meldNieuw().catch(e => ({ fout: String(e.message || e).slice(0, 60) }));
  const rest = 250000 - (Date.now() - t0); if (rest > 40000) uit.scan = await scanRonde(36, rest - 30000);
  return { ok: true, ...uit, ms: Date.now() - t0 };
}

// ---------- postcode naar plaats (Nominatim, 4 cijfers, gecachet) ----------
export async function postcode(pc0) {
  const pc = String(pc0 || '').replace(/\D/g, '').slice(0, 4); if (!/^[1-9]\d{3}$/.test(pc)) return { ok: false, tekst: 'Vul de 4 cijfers van je postcode in.' };
  let ll = await kv.get('rs:pc:' + pc).catch(() => null);
  if (!ll) { try { const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=nl&postalcode=' + pc, { headers: { 'user-agent': UA, 'accept-language': 'nl' }, signal: AbortSignal.timeout(10000) }); const l = r.ok ? await r.json() : []; if (l && l[0]) { ll = { lat: +l[0].lat, lon: +l[0].lon }; await kv.set('rs:pc:' + pc, ll, { ex: 180 * 86400 }).catch(() => {}); } } catch (e) {} }
  if (!ll) return { ok: false, pc, tekst: 'Die postcode vonden we niet. Kies hieronder je plaats.' };
  const info = await plaatsInfo(), mog = (info.length ? info.map(o => o.p) : PLAATSEN).map(p => ({ p, km: afstand(ll, { lat: p.c[0], lon: p.c[1] }) })).sort((a, b) => a.km - b.km);
  const b = mog[0]; const k = await pakket(b.p.slug);
  return { ok: true, pc, plaats: { slug: b.p.slug, naam: b.p.naam, km: Math.round(b.km) }, dichtbij: b.km <= 25, top: k ? k.rij.slice(0, 3).map(r => ({ naam: r.x.naam, s: r.x.s, punten: r.q.tot })) : [] };
}

// ---------- aanvragen (leads) ----------
const MAIL = /^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i, TEL = /^\+?[\d\s().-]{9,16}$/;
const START = { nu: 'zo snel mogelijk', maand: 'binnen een maand', drie: 'binnen 3 maanden', later: 'later' };
export async function leadPost(req, b, o = {}) {
  b = b || {}; const pl = P[b.pl] ? String(b.pl) : '', s = String(b.s || '').replace(/[^a-z0-9-]/g, '').slice(0, 90), ua = String(req.headers['user-agent'] || '');
  const contact = String(b.contact || '').trim().slice(0, 80), naam = String(b.naam || '').replace(/[<>"@\d]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const pc = String(b.pc || '').toUpperCase().replace(/\s/g, '').slice(0, 6), src = b.src === 'mylevel' ? 'mylevel' : String(b.src || '').replace(/[^a-z0-9-]/g, '').slice(0, 20) || 'site';
  const trans = ['schakel', 'automaat', 'weet-niet'].includes(b.trans) ? b.trans : 'weet-niet', theorie = ['ja', 'bezig', 'nee'].includes(b.theorie) ? b.theorie : 'nee', start = START[b.start] ? b.start : 'nu';
  if (b.website || BOT.test(ua) || !(Number(b.ms) > 2500)) return { ok: false, tekst: 'Dat lukte niet. Probeer het later nog eens.' };
  if (!/^[1-9]\d{3}([A-Z]{2})?$/.test(pc)) return { ok: false, tekst: 'Vul je postcode in, dan zoeken we rijscholen bij jou in de buurt.' };
  if (!(MAIL.test(contact) || (TEL.test(contact) && contact.replace(/\D/g, '').length >= 9))) return { ok: false, tekst: 'Vul een telefoonnummer of e-mailadres in, dan kan een rijschool je bereiken.' };
  if (!(b.ok === '1' || b.ok === true || b.ok === 'on')) return { ok: false, tekst: 'Vink aan dat we je aanvraag aan hoogstens 3 rijscholen bij jou in de buurt mogen doorgeven.' };
  let x = null; if (pl && s) { const x0 = await data(pl); x = x0 && x0.items.find(i => i.s === s) || null; }
  let plaats = pl; if (!plaats) { const r = await postcode(pc).catch(() => null); if (r && r.ok && r.dichtbij) plaats = r.plaats.slug; }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), ih = hash('ip:' + ip), test = !!o.test;
  const dk = 'rs:leadip:' + dagIso() + ':' + ih, nd = test ? 1 : await kv.incr(dk).catch(() => 1); if (nd === 1) await kv.raw(['EXPIRE', dk, '90000']).catch(() => {}); if (nd > 5) return { ok: false, tekst: 'Je hebt vandaag al een paar aanvragen gedaan. Bel een rijschool gerust zelf.' };
  const id = randomBytes(6).toString('hex'), fn = (String(req.headers.cookie || '').match(/(?:^|;\s*)mmp=([0-9a-f]{16})/) || [])[1] || '';
  const rec = { id, t: new Date().toISOString(), pl: plaats, plaats: plaats ? P[plaats].naam : '', pc, naam, contact, trans, theorie, start, src, test: String(b.t || '').replace(/[^a-z0-9-]/g, '').slice(0, 30), voorkeur: x ? { s: x.s, naam: x.naam, tel: x.tel || '', web: x.web || '' } : null, sid: hash('sid:' + String(b.sid || '')).slice(0, 10), fn: fn ? hash('fn:' + fn).slice(0, 10) : '' };
  if (test) { rec.isTest = true; await kv.set('rs:lead:' + id, rec, { ex: 3600 }); return { ok: true, test: true, id, plaats: rec.plaats, tekst: 'Test opgeslagen (1 uur), niet geteld.' }; }
  await kv.set('rs:lead:' + id, rec, { ex: 180 * 86400 });
  await kv.raw(['LPUSH', 'rs:leadids', id]); await kv.raw(['LTRIM', 'rs:leadids', '0', '4999']).catch(() => {});
  await kv.raw(['HINCRBY', 'rs:leadp', plaats || 'onbekend', '1']).catch(() => {}); await kv.raw(['HINCRBY', 'rs:leadb', src, '1']).catch(() => {});
  await kv.raw(['HINCRBY', 'rs:leadd:' + dagIso(), (plaats || 'onbekend') + ':' + src, '1']).then(() => kv.raw(['EXPIRE', 'rs:leadd:' + dagIso(), String(400 * 86400)])).catch(() => {});
  try { if (fn) { const F = await import('./funnel.js'); await F.funnelStap(fn, 'lead', 'rijschool-' + (plaats || 'hub')); } } catch (e) {}
  try { const I = await import('./intentie.js'); await I.intentieLog(kv, { site: 'nl', q: 'rijschool ' + (plaats ? P[plaats].naam : pc.slice(0, 4)), slug: 'rijschool-' + (plaats || 'hub'), bron: 'lead' }, req); } catch (e) {}
  try { const tot = await kv.raw(['HGET', 'rs:leadp', plaats || 'onbekend']); const sl = process.env.MELD_SLEUTEL; if (sl) await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': sl }, body: JSON.stringify({ bron: 'keuzehulp.best rijscholen', tekst: 'Nieuwe rijschoolaanvraag' + (src === 'mylevel' ? ' via MyLevel (oefenexamen gehaald)' : '') + ' in ' + (plaats ? P[plaats].naam : 'postcode ' + pc.slice(0, 4)) + ': ' + (trans === 'automaat' ? 'automaat' : trans === 'schakel' ? 'schakel' : 'schakel of automaat nog open') + ', theorie ' + (theorie === 'ja' ? 'gehaald' : theorie === 'bezig' ? 'bezig' : 'nog niet') + ', start ' + START[start] + '. ' + tot + ' aanvragen in die plaats tot nu toe. Gegevens staan in de beschermde lijst (tool=rijschool op=leads).' }), signal: AbortSignal.timeout(8000) }); } catch (e) {}
  return { ok: true, tekst: 'Dank je' + (naam ? ', ' + naam : '') + '. Je aanvraag staat bij ons. We geven hem door aan hoogstens 3 rijscholen bij jou in de buurt' + (x ? ', met ' + x.naam + ' als eerste keus' : '') + '.' + (x && x.tel ? ' Liever meteen contact? Bel ' + telTekst(x.tel) + '.' : '') };
}
export async function leads(n = 50) {
  const ids = await kv.raw(['LRANGE', 'rs:leadids', '0', String(n - 1)]).catch(() => []) || [];
  const l = (await Promise.all(ids.map(id => kv.get('rs:lead:' + id).catch(() => null)))).filter(Boolean);
  return { ok: true, n: l.length, leads: l };
}

// ---------- tikken ----------
export async function tik(b) {
  b = b || {}; const pl = P[b.pl] ? b.pl : ['hub', 'voor-rijscholen'].includes(b.pl) ? b.pl : '', e = ['zie', 'bel', 'route', 'web', 'aanvraag', 'pc', 'wa'].includes(b.e) ? b.e : '', s = String(b.s || '').replace(/[^a-z0-9-]/g, '').slice(0, 90);
  if (!pl || !e) return { ok: false };
  const dk = 'rs:tikd:' + dagIso(), src = b.src === 'mylevel' ? 'mylevel' : '';
  if (e === 'zie') { const bron = src || (['google', 'bing', 'ai', 'direct', 'intern', 'overig'].includes(b.b) ? b.b : 'overig'); await kv.raw(['HINCRBY', dk, 'zie:' + pl, '1']).then(() => kv.raw(['HINCRBY', dk, 'bron:' + bron, '1'])).catch(() => {}); }
  else { await kv.raw(['HINCRBY', dk, e + ':' + pl, '1']).catch(() => {}); if (src) await kv.raw(['HINCRBY', dk, e + ':mylevel', '1']).catch(() => {}); if (s && P[pl]) await kv.raw(['HINCRBY', 'rs:tik:' + pl, s + ':' + e, '1']).catch(() => {}); }
  await kv.raw(['EXPIRE', dk, String(400 * 86400)]).catch(() => {});
  return { ok: true };
}

// ---------- opmaak ----------
const ORG = { '@type': 'Organization', '@id': B + '/#org', name: 'keuzehulp.best', url: B + '/' };
const EXTRA = '.rsf select{font:inherit;font-size:16px;padding:10px 14px;border:1px solid #6B7280;border-radius:12px;background:transparent;color:inherit}.rsf input[type=text]{border-color:#6B7280!important}.rs-pc{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}.rs-pc input{font:inherit;font-size:16px;padding:10px 14px;border:1px solid #6B7280;border-radius:12px;width:9em;background:transparent;color:inherit}.rs-pc button{font:inherit;font-weight:700;font-size:16px;padding:10px 18px;border-radius:999px;border:0;cursor:pointer;background:#111113;color:#fff}#pcres{margin:8px 0 0}.rs-ml{border:2px solid #111113;border-radius:14px;padding:14px 16px;margin:12px 0}html body.mk main .mkf button[type=submit]{background:#111113;color:#fff}html body.mk.rs main .kn a.cta:not(.of){border-color:#6B7280!important}.rsf input[type=radio],.rsf input[type=checkbox]{accent-color:#111113}'
  + '@media (prefers-color-scheme:dark){html body.mk .rsf select,html body.mk .rs-pc input{border-color:#6B7280!important;color:#F2F3F5!important;background:#0F1115!important}html body.mk .rs-pc button{background:#F2F3F5!important;color:#0F1115!important}html body.mk .rs-ml{border-color:#F2F3F5!important}html body.mk.rs main .crumbs a:not(.btn):not(.card):not(.opt):not(.cta):not(.tegel):not(.mark):not(.brand):not([class*=btn]):not([style*=background]){color:#F2F3F5!important}}';
function doc({ titel, desc, pad, body, schema, noindex, pl = '', s = '' }) {
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>' + esc(titel) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + B + pad + '">' + (noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-snippet:-1">') +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="alternate" type="text/plain" href="/llms.txt"><style>' + RCSS + MK_CSS + EXTRA + '</style><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head><body class="mk rs" data-pl="' + esc(pl) + '" data-s="' + esc(s) + '"><header class="topbar"><div class="wrap"><a class="mark" href="/">keuzehulp<em>.best</em></a><nav class="topnav"><a href="/rijschool">Rijscholen</a><a href="/makelaar">Makelaars</a><a href="/verzekeringen">Verzekeringen</a></nav></div></header><main><div class="wrap">' + body +
    '</div></main><footer><div class="wrap"><p>Rijscholen uit OpenStreetMap (© OpenStreetMap-bijdragers, ODbL); slagingspercentages uit de open data van het CBR (CC-BY 4.0); de volgorde is onze eigen Keuzehulp-score. Niemand betaalt voor een plek.</p></div></footer><script>' + RSJS + '</script></body></html>';
}
function leadForm(pl, s, kop) {
  const r = (n, v, t, c) => '<label><input type="radio" name="' + n + '" value="' + v + '"' + (c ? ' checked' : '') + '> ' + t + '</label>';
  return '<form class="mkf rsf" data-lead method="post" action="/api/keuze-tools?tool=rijschool&op=lead" id="aanvraag"><input type="hidden" name="pl" value="' + esc(pl) + '"><input type="hidden" name="s" value="' + esc(s) + '"><input type="hidden" name="src" value=""><input type="hidden" name="t" value="">' +
    '<p class="rs-ml" id="rsml" hidden><strong>Geslaagd voor je oefentoets.</strong> Vul hieronder in wanneer je wilt beginnen, dan nemen rijscholen bij jou in de buurt contact op.</p>' +
    '<label>Postcode<input type="text" name="pc" maxlength="7" autocomplete="postal-code" inputmode="text" required></label><label>Voornaam<input type="text" name="naam" maxlength="40" autocomplete="given-name"></label><label>Telefoon of e-mail<input type="text" name="contact" required maxlength="80" autocomplete="email"></label>' +
    '<fieldset><legend>Schakel of automaat?</legend>' + r('trans', 'schakel', 'Schakel', true) + r('trans', 'automaat', 'Automaat') + r('trans', 'weet-niet', 'Weet ik nog niet') + '</fieldset>' +
    '<fieldset><legend>Theorie al gehaald?</legend>' + r('theorie', 'ja', 'Ja') + r('theorie', 'bezig', 'Ik ben bezig', true) + r('theorie', 'nee', 'Nee') + '</fieldset>' +
    '<label>Wanneer wil je beginnen?<select name="start"><option value="nu">Zo snel mogelijk</option><option value="maand">Binnen een maand</option><option value="drie">Binnen 3 maanden</option><option value="later">Later</option></select></label>' +
    '<label class="mkt"><input type="checkbox" name="ok" value="1" required> Je mag mijn aanvraag en gegevens aan hoogstens 3 rijscholen bij mij in de buurt doorgeven</label><input class="mkh" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="ms" value="9999">' +
    '<button type="submit">' + esc(kop || 'Laat rijscholen contact opnemen') + '</button><p class="bron">Gratis en vrijblijvend. We gebruiken je gegevens alleen voor deze aanvraag en wissen ze na 180 dagen.</p><p class="mko" role="status" hidden></p></form>';
}
const leadBlok = (pl, s, sub) => '<h2 id="contact">Laat een rijschool bij jou in de buurt contact opnemen</h2><p>' + esc(sub || 'Vul één keer in wat je zoekt. We geven je aanvraag aan hoogstens 3 rijscholen bij jou in de buurt, die bellen of mailen je.') + '</p>' + leadForm(pl, s);
const RSJS = '(function(){var t0=Date.now(),ua=navigator.userAgent||"",bot=navigator.webdriver||/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(ua);var r=document.referrer,h="";try{h=r?new URL(r).hostname.replace(/^www\\./,""):""}catch(x){}var Bn=!h?"direct":h===location.hostname.replace(/^www\\./,"")?"intern":/(^|\\.)google\\./.test(h)?"google":/bing\\.|duckduckgo/.test(h)?"bing":/chatgpt|openai|perplexity|copilot|gemini|claude/.test(h)?"ai":"overig";var P=document.body.getAttribute("data-pl")||"",S=document.body.getAttribute("data-s")||"";'
  + 'var Q=new URLSearchParams(location.search),SRC="",TT="",PC=(Q.get("pc")||"").replace(/[^0-9a-zA-Z]/g,"").slice(0,6);try{if(Q.get("src"))sessionStorage.setItem("rssrc",Q.get("src").replace(/[^a-z0-9-]/g,"").slice(0,20));if(Q.get("t"))sessionStorage.setItem("rst",Q.get("t").replace(/[^a-z0-9-]/g,"").slice(0,30));if(PC)sessionStorage.setItem("rspc",PC);SRC=sessionStorage.getItem("rssrc")||"";TT=sessionStorage.getItem("rst")||"";PC=PC||sessionStorage.getItem("rspc")||""}catch(x){SRC=Q.get("src")||""}'
  + 'function sid(){try{var s=localStorage.getItem("kzsid");if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem("kzsid",s)}return s}catch(e){return ""}}'
  + 'function tik(e,pl,s){if(bot)return;try{navigator.sendBeacon("/api/keuze-tools?tool=rijschool&op=tik",new Blob([JSON.stringify({e:e,pl:pl,s:s,b:Bn,src:SRC})],{type:"text/plain"}))}catch(x){}}tik("zie",P||"hub",S);'
  + 'var F=document.getElementById("aanvraag");if(F){F.elements.src.value=SRC;F.elements.t.value=TT;if(PC&&!F.elements.pc.value)F.elements.pc.value=PC;if(SRC==="mylevel"){var th=F.querySelector("input[name=theorie][value=ja]");if(th)th.checked=true;var ml=document.getElementById("rsml");if(ml)ml.hidden=false}}'
  + 'document.addEventListener("click",function(e){if(!e.target.closest)return;var a=e.target.closest("[data-t]");if(!a)return;var t=a.getAttribute("data-t");tik(t,a.getAttribute("data-pl")||P||"hub",a.getAttribute("data-s")||S);if(t==="aanvraag"&&F){e.preventDefault();F.scrollIntoView({behavior:"smooth",block:"start"})}},true);'
  + 'document.addEventListener("submit",function(e){var f=e.target;if(f.id==="pcf"){e.preventDefault();zoek(f.elements.pc.value);return}if(!f.hasAttribute||!f.hasAttribute("data-lead"))return;e.preventDefault();var o=f.querySelector(".mko"),b=f.querySelector("button[type=submit]"),d={};[].forEach.call(f.elements,function(x){if(!x.name)return;if(x.type==="radio"&&!x.checked)return;if(x.type==="checkbox"){d[x.name]=x.checked?"1":"";return}d[x.name]=x.value});d.ms=Date.now()-t0;d.sid=sid();b.disabled=true;'
  + 'fetch("/api/keuze-tools?tool=rijschool&op=lead",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d)}).then(function(r){return r.json()}).then(function(j){o.hidden=false;o.textContent=j.tekst||"Dank je.";if(j.ok)[].forEach.call(f.querySelectorAll("fieldset,label,button[type=submit],p.bron"),function(x){x.hidden=true});b.disabled=false}).catch(function(){o.hidden=false;o.textContent="Dat lukte niet. Probeer het nog eens.";b.disabled=false})},true);'
  + 'function zoek(pc){var R=document.getElementById("pcres");if(!R)return;tik("pc","hub","");R.textContent="Even zoeken…";fetch("/api/keuze-tools?tool=rijschool&op=pc&pc="+encodeURIComponent(pc)).then(function(r){return r.json()}).then(function(j){if(!j.ok){R.textContent=j.tekst||"Die postcode vonden we niet.";return}var u="/rijschool/"+j.plaats.slug;R.innerHTML="";var p=document.createElement("p");p.innerHTML="<strong>Dichtstbij: <a href=\\""+u+"\\"></a></strong>"+(j.dichtbij?"":" (we hebben nog geen plaats dichter bij jou; laat je aanvraag gerust achter, we zoeken een rijschool in de buurt)");p.querySelector("a").textContent="rijscholen in "+j.plaats.naam;R.appendChild(p);if(j.top&&j.top.length){var o=document.createElement("ol");j.top.forEach(function(x){var li=document.createElement("li"),a=document.createElement("a");a.href=u+"/"+x.s;a.textContent=x.naam;li.appendChild(a);li.appendChild(document.createTextNode(" · "+x.punten+" punten"));o.appendChild(li)});R.appendChild(o)}if(F){F.elements.pc.value=j.pc;if(j.dichtbij)F.elements.pl.value=j.plaats.slug}}).catch(function(){R.textContent="Dat lukte niet. Probeer het nog eens."})}'
  + 'var PF=document.getElementById("pcf");if(PF&&PC){PF.elements.pc.value=PC.slice(0,4);zoek(PC.slice(0,4))}'
  + 'var L=document.getElementById("zl"),FB=document.querySelector(".fl");if(L&&FB){var FL={};FB.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var f=b.dataset.f,on=b.getAttribute("aria-pressed")!=="true";b.setAttribute("aria-pressed",on?"true":"false");FL[f]=on;[].forEach.call(L.children,function(li){li.hidden=(FL.auto&&li.dataset.auto!=="1")||(FL.faal&&li.dataset.faal!=="1")||(FL.prijs&&li.dataset.prijs!=="1")})})}'
  + '})();';
const chat = (pl, term, faq) => kzuxBlok({ alleenChat: true, kop: 'Vraag het de keuzehulp', taal: 'nl', site: 'kzuxrs', slug: 'rijschool-' + pl, term, shop: '', prods: [], opties: [], faq: faq.map(([q, a]) => ({ q, a })) });
function knoppen(pl, x, kort) {
  const at = t => ' data-t="' + t + '" data-pl="' + esc(pl) + '" data-s="' + esc(x.s) + '"';
  return '<div class="kn"><a class="cta of" href="/rijschool/' + esc(pl) + '/' + esc(x.s) + '#aanvraag"' + at('aanvraag') + ' rel="nofollow">Laat contact opnemen</a>' + (x.tel ? '<a class="cta" href="tel:' + esc(telLink(x.tel)) + '"' + at('bel') + '>Bel ' + esc(telTekst(x.tel)) + '</a>' : '') +
    (kort ? '' : (x.web ? '<a class="cta" href="' + esc(webLink(x.web)) + '" target="_blank" rel="noopener nofollow"' + at('web') + '>Website</a>' : '') + '<a class="cta" href="' + esc(routeLink(x)) + '" target="_blank" rel="noopener nofollow"' + at('route') + '>Route</a>') + '</div>';
}
const revTekst = r => r.platform + ' ' + (r.max === 5 ? komma(r.score) : komma(r.score) + '/' + r.max) + ' (' + r.aantal + ' reviews)';
const cbrTekst = cb => 'CBR ' + pct(cb.pct) + ' geslaagd (' + cb.ok + ' van ' + cb.n + ' examens)';
function badges(r) {
  const { sc, cb } = r, b = [];
  if (cb) b.push(cbrTekst(cb));
  if (sc && sc.prijs && sc.prijs.length) b.push(sc.prijs.map(p => p.tekst).join(', '));
  if (sc && sc.auto) b.push('Automaat'); if (sc && sc.faal) b.push('Faalangst'); if (sc && sc.spoed) b.push('Spoedopleiding');
  if (sc && sc.lid && sc.lid.length) b.push(sc.lid.join(', '));
  ((sc && sc.rev) || []).forEach(z => b.push(revTekst(z)));
  return b.length ? '<div class="mk-bd">' + b.map(t => '<span>' + esc(t) + '</span>').join('') + '</div>' : '';
}
function waarom(r, plek, C) {
  const { x, sc, cb, q } = r, l = [], mis = [], gecheckt = sc && sc.t && !sc.fout;
  const geg = [x.adres && 'adres', x.tel && 'telefoon', x.web && 'website', rooster(x.uren) && 'openingstijden'].filter(Boolean);
  if (q.p.cbr || cb) l.push('CBR: ' + cb.ok + ' van ' + cb.n + ' praktijkexamens geslaagd (' + pct(cb.pct) + (C && C.landelijk ? ', landelijk ' + pct(C.landelijk) : '') + '): ' + q.p.cbr + ' van 30');
  else mis.push(C ? 'slagingspercentage (geen rijschool met deze naam en postcode in de CBR-data)' : 'slagingspercentage (CBR-data nog niet geladen)');
  if (q.p.reviews || q.nrev) l.push('Reviews: ' + sc.rev.map(revTekst).join(', ') + ', samen ' + komma(q.gem5) + ' van 5: ' + q.p.reviews + ' van 25'); else if (gecheckt) mis.push('reviews (geen cijfer op Klantenvertellen, Kiyoh, Feedback Company of Trustpilot)');
  if (q.p.prijs) l.push('Prijs op de eigen site (' + sc.prijs.map(p => p.tekst).join(', ') + ', gelezen ' + datumKort(sc.t) + '): 15 van 15'); else mis.push(gecheckt ? 'prijs (niet op de site gevonden, ' + datumKort(sc.t) + ')' : x.web ? 'prijs (de site is nog niet nagekeken)' : 'prijs (geen website bekend)');
  if (q.p.gegevens) l.push('Gegevens: ' + q.p.gegevens + ' van 15 (' + lijstNL(geg) + ')');
  if (q.p.aanbod) l.push('Aanbod: ' + lijstNL([sc.auto && 'automaat', sc.faal && 'faalangst', sc.spoed && 'spoedopleiding'].filter(Boolean)) + ': ' + q.p.aanbod + ' van 10');
  if (q.p.keurmerk) l.push(lijstNL(sc.lid) + ' volgens de eigen site: 5 van 5');
  return '<details class="why"><summary>Waarom plek ' + plek + '? ' + q.tot + ' punten</summary><ul>' + l.map(t => '<li>' + esc(t) + '</li>').join('') + (mis.length ? '<li>' + esc('Geen punten voor ' + lijstNL(mis)) + '</li>' : '') + '</ul></details>';
}
function wegingTabel(C) {
  return '<table class="mk-w"><thead><tr><th>Wat we meten</th><th>Punten</th><th>Hoe en waar vandaan</th></tr></thead><tbody>' + WEGING.map(w => '<tr><td>' + esc(w.naam) + '</td><td>' + w.max + '</td><td>' + esc(w.uitleg.charAt(0).toUpperCase() + w.uitleg.slice(1) + '. Bron: ' + w.bron + '.') + '</td></tr>').join('') + '</tbody></table>' +
    '<p>Samen hoogstens 100 punten. Bij gelijke punten gaat de rijschool met de meeste CBR-examens voor, daarna die met de meeste reviews. Niemand kan een plek kopen: een rijschool stijgt alleen door betere examenuitslagen, een prijs op de site, reviews en complete gegevens. Gegevens aanpassen kan op OpenStreetMap; wij nemen het bij de volgende ronde over.</p>' +
    '<p class="bron">' + (C ? 'Slagingspercentages: ' + bronLink('cbr') + ', ingelezen ' + esc(datumKort(C.t)) + (C.periode && C.periode.van ? ', periode ' + esc(C.periode.van) + ' tot ' + esc(C.periode.tot) : '') + '.' : 'Het CBR publiceert slagingspercentages per rijschool in de Rijschoolzoeker en als open data (' + bronLink('cbr') + '). Zodra we die per rijschool kunnen koppelen, tellen ze mee.') + '</p>';
}
async function plaatsInfo() { const d = await alleData(); return d.filter(o => o.x && o.x.n >= MIN).map(o => ({ p: o.p, n: o.x.n })); }
export async function plaatsLijst() { return (await plaatsInfo()).map(o => ({ naam: o.p.naam, href: '/rijschool/' + o.p.slug, n: o.n })).sort((a, b) => a.naam.localeCompare(b.naam, 'nl')); }
async function pakket(slug) { const [x0, sc, C] = await Promise.all([data(slug), scans(slug), cbr()]); if (!x0 || !x0.items.length) return null; return { x0, C, rij: rang(x0.items, sc, C) }; }

// FAQ: de eerste vraag letterlijk zoals mensen hem aan een AI stellen, met één eerste keus en de reden
const ALG = [
  ['Wat kost een rijbewijs in 2026?', 'Het CBR rekent in 2026 € 50,50 voor het theorie-examen en € 143,50 voor het praktijkexamen auto; het faalangstexamen kost € 202. Met de rijlessen erbij kost een rijbewijs volgens AutoRAI al snel minimaal € 2.500 en gemiddeld zo\'n € 3.000.', 'kosten'],
  ['Wat als ik een rijles afzeg?', 'Bij een BOVAG-rijschool betaal je de volle lesprijs als je binnen 72 uur voor de les afzegt; zaterdag, zondag en feestdagen tellen niet mee. Bij een dringende reden, zoals ernstige ziekte, hoef je niet te betalen. Andere rijscholen hebben eigen voorwaarden: vraag ze vooraf.', 'bovag'],
  ['Hoe zie ik het slagingspercentage van een rijschool?', 'Het CBR zet per rijschool het slagingspercentage en het aantal examens in de Rijschoolzoeker op cbr.nl en publiceert de cijfers als open data. Kijk naar het aantal examens: een percentage uit een handvol examens zegt weinig. Landelijk slaagde in 2022 50,2% voor het praktijkexamen.', 'rz'],
];
const algFaq = () => ALG.map(([q, a]) => [q, a]);
function plaatsFaq(p, rij, t, C) {
  const f = [], top = rij[0], tekst = r => r.x.naam + ' (' + r.q.tot + ' punten' + (r.cb ? ', ' + pct(r.cb.pct) + ' geslaagd bij het CBR uit ' + r.cb.n + ' examens' : '') + (r.sc && r.sc.prijs && r.sc.prijs[0] ? ', ' + r.sc.prijs[0].tekst : '') + ')';
  const alt = [], auto = rij.find(r => r !== top && r.sc && r.sc.auto), faal = rij.find(r => r !== top && r.sc && r.sc.faal), les = rij.filter(r => r.sc && r.sc.prijs && r.sc.prijs.some(z => z.soort === 'les')).map(r => ({ r, v: r.sc.prijs.find(z => z.soort === 'les').v })).sort((a, b) => a.v - b.v)[0];
  if (auto) alt.push('Wil je in een automaat leren rijden, kies dan ' + auto.x.naam + ' (' + auto.q.tot + ' punten)');
  if (faal) alt.push('Heb je last van faalangst, kijk dan naar ' + faal.x.naam + ', die begeleiding bij faalangst noemt');
  if (les && les.r !== top) alt.push('De laagste prijs per les op een eigen site: ' + les.r.x.naam + ' (' + eur(les.v) + ')');
  f.push(['Wat is de beste rijschool in ' + p.naam + '?', 'Onze eerste keus in ' + p.naam + ' is ' + tekst(top) + ', volgens de Keuzehulp-score van ' + datumKort(t) + '. ' + (top.cb ? 'De reden: het slagingspercentage bij het CBR weegt het zwaarst, en daar scoort ' + top.x.naam + ' goed. ' : 'De score telt het slagingspercentage bij het CBR, reviews, een prijs op de eigen site, complete gegevens en het aanbod. ') + (alt.length ? alt.join('. ') + '. ' : '') + 'Daarna: ' + rij.slice(1, 3).map(r => r.x.naam + ' (' + r.q.tot + ')').join(' en ') + '.']);
  const metCbr = rij.filter(r => r.cb && r.cb.n >= 20).sort((a, b) => b.cb.pct - a.cb.pct);
  if (metCbr.length >= 3) f.push(['Welke rijschool in ' + p.naam + ' heeft het hoogste slagingspercentage?', 'Van de rijscholen met minstens 20 examens: ' + metCbr.slice(0, 3).map(r => r.x.naam + ' ' + pct(r.cb.pct) + ' (' + r.cb.n + ' examens)').join(', ') + '. Bron: CBR opleiderresultaten' + (C && C.periode && C.periode.van ? ', ' + C.periode.van + ' tot ' + C.periode.tot : '') + '.']);
  const lp = rij.flatMap(r => ((r.sc && r.sc.prijs) || []).filter(z => z.soort === 'les').map(z => z.v)).sort((a, b) => a - b), pk = rij.flatMap(r => ((r.sc && r.sc.prijs) || []).filter(z => z.soort === 'pakket').map(z => z.v)).sort((a, b) => a - b);
  if (lp.length >= 3 || pk.length >= 3) f.push(['Wat kost een rijles in ' + p.naam + '?', (lp.length >= 3 ? lp.length + ' rijscholen in ' + p.naam + ' noemen een prijs per les op hun eigen site, van ' + eur(lp[0]) + ' tot ' + eur(lp[lp.length - 1]) + '. ' : '') + (pk.length >= 3 ? pk.length + ' rijscholen noemen een pakketprijs, vanaf ' + eur(pk[0]) + '. ' : '') + 'Zo stond het op hun sites bij onze laatste controle. Vraag wat een les duurt en wat er in een pakket zit, zoals het examen.']);
  const au = rij.filter(r => r.sc && r.sc.auto);
  if (au.length >= 2) f.push(['Welke rijscholen in ' + p.naam + ' geven les in een automaat?', au.length + ' rijscholen noemen lessen in een automaat op hun eigen site, onder meer ' + lijstNL(au.slice(0, 4).map(r => r.x.naam)) + '. Met een rijbewijs voor automaat mag je alleen automaat rijden.']);
  return f.concat(algFaq());
}
const bronRegel = () => '<p class="bron">Bronnen: ' + ['kosten', 'bovag', 'rz'].map(bronLink).join(' · ') + ' (gelezen ' + LEES + ').</p>';
function buren(p, info) { return info.filter(o => o.p.slug !== p.slug).map(o => ({ o, km: afstand({ lat: p.c[0], lon: p.c[1] }, { lat: o.p.c[0], lon: o.p.c[1] }) })).sort((a, b) => a.km - b.km).slice(0, 4).map(({ o }) => '<a href="/rijschool/' + o.p.slug + '">Rijschool ' + esc(o.p.naam) + '</a>'); }
function zaakLd(pl, r) {
  const { x } = r, id = B + '/rijschool/' + pl + '/' + x.s + '#zaak';
  return { '@type': 'DrivingSchool', '@id': id, name: x.naam, url: x.web ? webLink(x.web) : B + '/rijschool/' + pl + '/' + x.s, telephone: x.tel ? telLink(x.tel) : undefined,
    address: x.adres ? { '@type': 'PostalAddress', streetAddress: x.adres, postalCode: x.pc || undefined, addressLocality: x.plaats, addressCountry: 'NL' } : { '@type': 'PostalAddress', addressLocality: x.plaats, addressCountry: 'NL' },
    geo: { '@type': 'GeoCoordinates', latitude: x.lat, longitude: x.lon }, openingHours: rooster(x.uren) ? x.uren : undefined, areaServed: { '@type': 'City', name: P[pl].naam } };
}
const pcZoek = '<form class="rs-pc" id="pcf" action="/rijschool" method="get"><label for="rspc"><strong>Jouw postcode</strong></label><input id="rspc" type="text" name="pc" maxlength="7" inputmode="numeric" autocomplete="postal-code" placeholder="1234"><button type="submit">Zoek rijscholen</button></form><div id="pcres" aria-live="polite"></div>';

// ---------- /rijschool ----------
export async function hub() {
  const info = await plaatsInfo(), tops = await Promise.all(info.map(async o => { const k = await pakket(o.p.slug); return { o, r: k && k.rij[0], alle: (k && k.rij) || [] }; })), C = await cbr();
  const rij = tops.sort((a, b) => b.o.p.inw - a.o.p.inw), tot = info.reduce((a, o) => a + o.n, 0);
  const lp = tops.flatMap(t => t.alle.flatMap(r => ((r.sc && r.sc.prijs) || []).filter(z => z.soort === 'les').map(z => z.v))).sort((a, b) => a - b);
  const top3 = rij.slice(0, 5).filter(t => t.r);
  const faq = [['Wat is de beste rijschool bij mij in de buurt?', top3.length ? 'Dat hangt af van je plaats. Onze eerste keus per grote stad volgens de Keuzehulp-score: ' + top3.map(t => t.o.p.naam + ': ' + t.r.x.naam + ' (' + t.r.q.tot + ' punten)').join('; ') + '. Vul je postcode in voor de rijscholen bij jou in de buurt.' : 'Vul je postcode in voor de rijscholen bij jou in de buurt, op volgorde van de Keuzehulp-score.'],
    ['Hoe rangschikt keuzehulp.best rijscholen?', 'Met de Keuzehulp-score van 0 tot 100: slagingspercentage bij het CBR (30), reviews op andere platforms (25), een prijs op de eigen site (15), complete gegevens (15), aanbod zoals automaat, faalangst en spoedopleiding (10) en BOVAG of KRM (5). Niemand betaalt voor een plek.']]
    .concat(lp.length >= 5 ? [['Wat kost een rijles?', lp.length + ' rijscholen in deze steden noemen een prijs per les op hun eigen site, van ' + eur(lp[0]) + ' tot ' + eur(lp[lp.length - 1]) + '. Zo stond het op hun sites bij onze laatste controle. De prijs per rijschool staat op de pagina van je stad.']] : [], algFaq());
  const body = '<p class="crumbs"><a href="/">keuzehulp.best</a> › Rijschool</p><h1>Rijschool vergelijken: de beste rijschool bij jou in de buurt</h1>' +
    '<div class="answer lead"><p>' + (tot ? 'We vergeleken ' + tot + ' rijscholen in ' + rij.length + ' gemeenten op slagingspercentage bij het CBR, reviews, prijs op de eigen site en aanbod.' : 'We vergelijken rijscholen per gemeente op slagingspercentage bij het CBR, reviews, prijs op de eigen site en aanbod.') + ' Vul je postcode in.</p>' + pcZoek + '</div>' +
    leadBlok('', '') + chat('hub', 'rijschool', faq) +
    (rij.length ? '<h2>Rijschool per plaats</h2><ul class="cards">' + rij.map(({ o, r }) => '<li><a href="/rijschool/' + o.p.slug + '">Rijschool ' + esc(o.p.naam) + '</a><span>' + o.n + ' rijscholen' + (r ? ', nummer 1: ' + esc(r.x.naam) : '') + '</span></li>').join('') + '</ul>' : '') +
    '<h2>Zo rangschikken we</h2>' + wegingTabel(C) + '<h2>Vragen</h2>' + faqBlok(faq) + bronRegel() +
    '<p class="rel">Heb je een rijschool? <a href="/rijschool/voor-rijscholen">Zo staat je rijschool erbij</a> · Theorie oefenen: <a href="https://mylevel.today/nl/theorie-examen-oefenen" rel="noopener">CBR-oefenexamen op MyLevel</a></p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'CollectionPage', name: 'Rijschool vergelijken per plaats', url: B + '/rijschool', inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] }, hasPart: rij.map(({ o }) => ({ '@type': 'WebPage', name: 'Rijschool ' + o.p.naam, url: B + '/rijschool/' + o.p.slug })) }, kruim([['keuzehulp.best', '/'], ['Rijschool', '/rijschool']]), faqLd(faq)] };
  const t1 = 'Rijschool vergelijken: de beste rijschool in ' + rij.length + (rij.length === 1 ? ' stad' : ' steden');
  return doc({ titel: rij.length ? (t1.length <= 60 ? t1 : 'Rijschool vergelijken in ' + rij.length + ' steden') : 'Rijschool vergelijken: de beste rijschool bij jou', desc: (tot ? 'Vergelijk ' + tot + ' rijscholen in ' + rij.slice(0, 4).map(({ o }) => o.p.naam).join(', ') + ' en meer op slagingspercentage, prijs en reviews. Gratis aanvraag.' : 'Vergelijk rijscholen per plaats op slagingspercentage bij het CBR, prijs per les en reviews. Gratis aanvraag bij 3 rijscholen.').slice(0, 155), pad: '/rijschool', body, schema, noindex: !rij.length, pl: 'hub' });
}

// ---------- /rijschool/<plaats> ----------
export async function plaatsPagina(slug) {
  const p = P[slug]; if (!p) return null; const k = await pakket(slug); if (!k) return null; const { x0, rij, C } = k;
  const nu = new Date(), info = await plaatsInfo(), faq = plaatsFaq(p, rij, x0.t, C), top = rij.slice(0, 3);
  const h1 = 'Rijschool ' + p.naam + ': de beste rijscholen vergeleken';
  const li = rij.map((r, i) => { const x = r.x, s = status(rooster(x.uren), nu), sc = r.sc || {}; return '<li data-auto="' + (sc.auto ? 1 : 0) + '" data-faal="' + (sc.faal ? 1 : 0) + '" data-prijs="' + (sc.prijs && sc.prijs.length ? 1 : 0) + '"><span class="n">' + (i + 1) + '. <a href="/rijschool/' + slug + '/' + esc(x.s) + '">' + esc(x.naam) + '</a></span><span class="mk-sc"><b>' + r.q.tot + '</b> punten Keuzehulp-score</span>' + badges(r) + (x.adres ? '<span class="w">' + esc(x.adres + (x.pc ? ', ' + x.pc : '')) + '</span>' : '') + (s ? '<span class="nu' + (s.open ? '' : ' dicht') + '"><i></i>' + esc(statusTekst(s)) + '</span>' : '') + knoppen(slug, x, i >= 20) + (i < 30 ? waarom(r, i + 1, C) : '') + '</li>'; }).join('');
  const filter = '<div class="fl"><button type="button" data-f="auto" aria-pressed="false">Automaat</button><button type="button" data-f="faal" aria-pressed="false">Faalangst</button><button type="button" data-f="prijs" aria-pressed="false">Prijs op site</button></div>';
  const ander = buren(p, info), alle = info.filter(o => o.p.slug !== slug).map(o => '<a href="/rijschool/' + o.p.slug + '">' + esc(o.p.naam) + '</a>');
  const body = '<p class="crumbs"><a href="/rijschool">Rijschool</a> › ' + esc(p.naam) + '</p><h1>' + esc(h1) + '</h1>' +
    '<div class="lead mk-antw"><p>' + rij.length + ' rijscholen vergeleken. <strong>Onze eerste keus: ' + esc(top[0].x.naam) + '</strong> (' + top[0].q.tot + ' punten' + (top[0].cb ? ', ' + pct(top[0].cb.pct) + ' geslaagd bij het CBR' : '') + '). Daarna ' + top.slice(1).map(r => esc(r.x.naam) + ' (' + r.q.tot + ')').join(' en ') + '.</p></div>' +
    '<ol class="top3 lead">' + top.map((r, i) => '<li><span class="n">' + (i + 1) + '. <a href="/rijschool/' + slug + '/' + esc(r.x.s) + '">' + esc(r.x.naam) + '</a> · ' + r.q.tot + ' punten</span>' + knoppen(slug, r.x, true) + badges(r) + '</li>').join('') + '</ol>' +
    chat(slug, 'rijschool ' + p.naam, faq) + leadBlok(slug, '') +
    '<h2>Alle ' + rij.length + ' rijscholen in ' + esc(p.naam) + ' op volgorde</h2>' + filter + '<ul class="zaken" id="zl">' + li + '</ul>' +
    '<h2 id="zo-rangschikken-we">Zo rangschikken we: de Keuzehulp-score</h2>' + wegingTabel(C) +
    '<h2>Vragen over rijscholen in ' + esc(p.naam) + '</h2>' + faqBlok(faq) + bronRegel() + (ander.length ? '<p class="rel">In de buurt: ' + ander.join(' · ') + '</p>' : '') + (alle.length ? '<p class="rel">Alle steden: ' + alle.join(', ') + '</p>' : '') +
    '<p class="rel">Theorie oefenen: <a href="https://mylevel.today/nl/theorie-examen-oefenen" rel="noopener">CBR-oefenexamen op MyLevel</a> · Heb je een rijschool in ' + esc(p.naam) + '? <a href="/rijschool/voor-rijscholen">Zo staat je rijschool erbij</a></p>' +
    '<p class="bron">Rijscholen uit OpenStreetMap, bijgewerkt <time datetime="' + x0.t.slice(0, 10) + '">' + esc(datumNL(x0.t)) + '</time>.</p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG,
    { '@type': 'WebPage', '@id': B + '/rijschool/' + slug, url: B + '/rijschool/' + slug, name: h1, inLanguage: 'nl-NL', dateModified: x0.t, publisher: { '@id': ORG['@id'] }, mainEntity: { '@id': B + '/rijschool/' + slug + '#lijst' } },
    { '@type': 'ItemList', '@id': B + '/rijschool/' + slug + '#lijst', name: 'Beste rijscholen in ' + p.naam + ' volgens de Keuzehulp-score', itemListOrder: 'https://schema.org/ItemListOrderDescending', numberOfItems: rij.length, itemListElement: rij.slice(0, 50).map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: B + '/rijschool/' + slug + '/' + r.x.s, item: zaakLd(slug, r) })) },
    kruim([['Rijschool', '/rijschool'], [p.naam, '/rijschool/' + slug]]), faqLd(faq)] };
  const t1 = 'Rijschool ' + p.naam + ': de beste van ' + rij.length + ' rijscholen';
  return doc({ titel: t1.length <= 60 ? t1 : 'Rijschool ' + p.naam + ': ' + rij.length + ' vergeleken', desc: ('Beste rijschool in ' + p.naam + ': ' + top.map(r => r.x.naam).join(', ') + '. Alle ' + rij.length + ' rijscholen op slagingspercentage, prijs en reviews.').slice(0, 155), pad: '/rijschool/' + slug, body, schema, noindex: rij.length < MIN, pl: slug });
}

// ---------- /rijschool/<plaats>/<rijschool> ----------
export async function zaakPagina(slug, s) {
  const p = P[slug]; if (!p) return null; const k = await pakket(slug); if (!k) return null; const { x0, rij, C } = k;
  const plek = rij.findIndex(r => r.x.s === s); if (plek < 0) return null; const r = rij[plek], x = r.x, sc = r.sc || {};
  const R = rooster(x.uren), st = status(R), dicht = rij.filter(z => z.x.s !== s).map(z => ({ z, km: afstand(x, z.x) })).sort((a, b) => a.km - b.km).slice(0, 4);
  const feiten = [x.adres ? 'Adres: ' + x.adres + (x.pc ? ', ' + x.pc : '') + ' ' + x.plaats : '', x.tel ? 'Telefoon: ' + telTekst(x.tel) : '', x.web ? 'Website: ' + webTekst(x.web) : ''].filter(Boolean);
  const faq = [['Is ' + x.naam + ' in ' + p.naam + ' een goede rijschool?', x.naam + ' staat op plek ' + (plek + 1) + ' van ' + rij.length + ' rijscholen in ' + p.naam + ' met ' + r.q.tot + ' van 100 punten in de Keuzehulp-score.' + (r.cb ? ' Bij het CBR slaagde ' + pct(r.cb.pct) + ' van ' + r.cb.n + ' praktijkexamens' + (C && C.landelijk ? ' (landelijk ' + pct(C.landelijk) + ')' : '') + '.' : '') + (r.q.nrev ? ' Reviews: ' + sc.rev.map(revTekst).join(', ') + '.' : '')]]
    .concat(sc.prijs && sc.prijs.length ? [['Wat kost een rijles bij ' + x.naam + '?', 'Op de eigen site stond bij onze controle van ' + datumKort(sc.t) + ': ' + sc.prijs.map(z => z.tekst).join(' en ') + ' (' + (sc.prijs[0].url || sc.url || '') + '). Vraag wat een les duurt en wat er in een pakket zit.']] : [])
    .concat(sc.t && !sc.fout ? [['Kan ik bij ' + x.naam + ' in een automaat leren rijden?', sc.auto ? 'Ja, de eigen site noemt lessen in een automaat (gelezen ' + datumKort(sc.t) + ').' : 'Op de eigen site vonden we geen lessen in een automaat (gelezen ' + datumKort(sc.t) + '). Vraag het de rijschool.']] : [])
    .concat(algFaq().slice(0, 2));
  const wieZegt = sc.rev && sc.rev.length ? '<h2>Reviews op andere platforms</h2><ul>' + sc.rev.map(z => '<li><a href="' + esc(z.url) + '" target="_blank" rel="noopener nofollow">' + esc(z.platform) + '</a>: ' + esc((z.max === 5 ? komma(z.score) : komma(z.score) + '/' + z.max) + ' uit ' + z.aantal + ' reviews') + ' (gelezen ' + esc(datumKort(sc.t)) + ')</li>').join('') + '</ul>' : '';
  const body = '<p class="crumbs"><a href="/rijschool">Rijschool</a> › <a href="/rijschool/' + slug + '">' + esc(p.naam) + '</a></p><h1>' + esc(x.naam) + '</h1><div class="lead mk-kop"><p>Rijschool in ' + esc(p.naam) + ' · plek ' + (plek + 1) + ' van ' + rij.length + '</p>' +
    '<p class="mk-sc"><b>' + r.q.tot + '</b> punten Keuzehulp-score</p>' + badges(r) + (st ? '<p class="nu' + (st.open ? '' : ' dicht') + '"><i></i>' + esc(statusTekst(st)) + '</p>' : '') + knoppen(slug, x) + '</div>' +
    chat(slug, 'rijschool ' + p.naam, faq) + leadBlok(slug, s, 'Vul één keer in wat je zoekt. We geven je aanvraag door aan ' + x.naam + ' en hoogstens 2 andere rijscholen bij jou in de buurt.') +
    '<h2>Waarom plek ' + (plek + 1) + '?</h2>' + waarom(r, plek + 1, C).replace('<details class="why">', '<details class="why" open>') + wieZegt +
    '<h2>Gegevens</h2><ul class="feit">' + feiten.map(f => '<li>' + esc(f) + '</li>').join('') + (R ? '<li>' + weekRegels(R).map(esc).join('<br>') + '</li>' : x.uren ? '<li>Openingstijden: ' + esc(x.uren) + '</li>' : '') + '</ul>' +
    (dicht.length ? '<h2>Andere rijscholen dichtbij</h2><ul class="zaken">' + dicht.map(({ z, km }) => '<li><span class="n"><a href="/rijschool/' + slug + '/' + esc(z.x.s) + '">' + esc(z.x.naam) + '</a> · ' + z.q.tot + ' punten</span><span class="w">' + (km < 1 ? Math.round(km * 1000) + ' m' : komma(km) + ' km') + (z.x.adres ? ' · ' + esc(z.x.adres) : '') + '</span></li>').join('') + '</ul>' : '') +
    '<h2>Vragen over ' + esc(x.naam) + '</h2>' + faqBlok(faq) + bronRegel() +
    '<p class="rel"><a href="/rijschool/' + slug + '">Alle ' + rij.length + ' rijscholen in ' + esc(p.naam) + ' op volgorde</a> · <a href="' + esc(osmLink(x)) + '" rel="nofollow">Gegevens aanpassen op OpenStreetMap</a> · Eigenaar? <a href="/rijschool/voor-rijscholen?plaats=' + slug + '&amp;rs=' + esc(x.s) + '" rel="nofollow">Zo komt je rijschool hoger</a></p>';
  const lb = zaakLd(slug, r);
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: B + '/rijschool/' + slug + '/' + s, name: x.naam, dateModified: x0.t, inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] }, about: { '@id': lb['@id'] } }, lb, kruim([['Rijschool', '/rijschool'], [p.naam, '/rijschool/' + slug], [x.naam, '/rijschool/' + slug + '/' + s]]), faqLd(faq)] };
  const t1 = x.naam + ': rijschool ' + p.naam + ', score en prijs';
  return doc({ titel: t1.length <= 60 ? t1 : x.naam.slice(0, 38) + ', rijschool ' + p.naam, desc: (x.naam + ' in ' + p.naam + ': plek ' + (plek + 1) + ' van ' + rij.length + ' met ' + r.q.tot + ' punten. ' + (r.cb ? pct(r.cb.pct) + ' geslaagd bij het CBR. ' : '') + 'Telefoon, prijs en gratis aanvraag.').slice(0, 155), pad: '/rijschool/' + slug + '/' + s, body, schema, noindex: r.q.p.gegevens < 8 || x0.items.length < MIN, pl: slug, s });
}

// ---------- /rijschool/voor-rijscholen ----------
const WA = t => 'https://wa.me/31655395630?text=' + encodeURIComponent(t);
export async function voorRijscholen(pl, s) {
  let mijn = null, plek = 0, tot = 0, C = null;
  if (P[pl]) { const k = await pakket(pl); if (k) { C = k.C; plek = k.rij.findIndex(r => r.x.s === s) + 1; tot = k.rij.length; mijn = plek ? k.rij[plek - 1] : null; } }
  const x = mijn && mijn.x, sc = (mijn && mijn.sc) || {};
  const beter = mijn ? [!mijn.cb && 'We vonden je rijschool niet in de CBR-data op naam en postcode. Staat je rijschool daar onder een andere naam of postcode? Stuur ons je CBR-gegevens, dan koppelen we ze (tot 30 punten).', !(sc.prijs && sc.prijs.length) && 'Zet je prijs per les of je pakketprijs op je eigen site (15 punten).', !(sc.rev && sc.rev.length) && 'Laat leerlingen een review geven op Klantenvertellen, Kiyoh, Feedback Company of Trustpilot en link ernaar vanaf je site (tot 25 punten).', !x.tel && 'Zet je telefoonnummer in OpenStreetMap (4 punten).', !x.web && 'Zet je website in OpenStreetMap (4 punten).', !rooster(x.uren) && 'Zet je openingstijden in OpenStreetMap (3 punten).', !sc.auto && 'Geef je les in een automaat? Zet het op je site (4 punten).', !sc.faal && 'Begeleid je bij faalangst? Zet het op je site (3 punten).'].filter(Boolean) : [];
  const body = '<p class="crumbs"><a href="/rijschool">Rijschool</a> › Voor rijscholen</p><h1>Je rijschool op keuzehulp.best</h1>' +
    '<div class="answer"><p>Leerlingen zoeken hier een rijschool bij hen in de buurt, ook leerlingen die net hun oefenexamen theorie haalden. Elke rijschool in de 40 grootste gemeenten staat erbij, gratis, op volgorde van de Keuzehulp-score.</p><p><strong>Je plek koop je niet:</strong> die komt uit de score. Wel kun je je gegevens gratis aanvullen.</p></div>' +
    (mijn ? '<h2>' + esc(x.naam) + ' nu</h2><p>Plek ' + plek + ' van ' + tot + ' rijscholen in ' + esc(P[pl].naam) + ', <strong>' + mijn.q.tot + '</strong> punten. <a href="/rijschool/' + pl + '/' + esc(x.s) + '">Bekijk je pagina</a>.</p>' + waarom(mijn, plek, C).replace('<details class="why">', '<details class="why" open>') + (beter.length ? '<h2>Zo kom je hoger</h2><ul>' + beter.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul><p>Gegevens aanpassen kan gratis op <a href="' + esc(osmLink(x)) + '" rel="nofollow">OpenStreetMap</a>; wij nemen ze bij de volgende ronde over.</p>' : '') : '<h2>Hoe je hoger komt</h2><ul><li>Een goed slagingspercentage bij het CBR weegt het zwaarst (30 punten).</li><li>Een prijs per les of een pakketprijs op je eigen site (15 punten).</li><li>Reviews op Klantenvertellen, Kiyoh, Feedback Company of Trustpilot (25 punten).</li><li>Complete gegevens in OpenStreetMap: adres, telefoon, website, openingstijden (15 punten).</li><li>Automaat, faalangst en spoedopleiding op je site (10 punten), BOVAG of KRM (5 punten).</li></ul><p>Zoek je rijschool op de pagina van je plaats: <a href="/rijschool">alle plaatsen</a>.</p>') +
    '<h2>Gratis: gegevens aanvullen</h2><p>Kloppen je tijden, telefoon, website, prijzen of je CBR-gegevens niet? Stuur ze ons, dan zetten we ze erin.</p><p><a class="cta of" data-t="wa" data-pl="voor-rijscholen" data-s="' + esc(s || '') + '" href="' + esc(WA('Gegevens aanvullen voor ' + (x ? x.naam : 'mijn rijschool') + ' op keuzehulp.best/rijschool')) + '" target="_blank" rel="noopener">Gegevens sturen via WhatsApp</a></p>' +
    '<h2>Aanvragen van leerlingen bij jou in de buurt</h2><p>Leerlingen laten via keuzehulp.best weten dat ze willen beginnen: postcode, schakel of automaat, theorie gehaald of niet, en wanneer. We geven elke aanvraag aan hoogstens 3 rijscholen in de buurt. Je betaalt alleen per aanvraag, geen abonnement. Vraag de prijs via WhatsApp.</p><p><a class="cta of" data-t="wa" data-pl="voor-rijscholen" data-s="' + esc(s || '') + '" href="' + esc(WA('Ik wil aanvragen van leerlingen ontvangen voor ' + (x ? x.naam : 'mijn rijschool') + '. Wat kost een aanvraag?')) + '" target="_blank" rel="noopener">Vraag de prijs via WhatsApp</a></p><p>Aanvragen kopen verandert niets aan je plek in de ranglijst.</p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: B + '/rijschool/voor-rijscholen', name: 'Je rijschool op keuzehulp.best', inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] } }] };
  return doc({ titel: 'Voor rijscholen: gratis vermelding en leerlingaanvragen', desc: 'Je rijschool staat gratis op keuzehulp.best in de 40 grootste gemeenten. Zie je plek in de Keuzehulp-score van 0 tot 100 en hoe je hoger komt.', pad: '/rijschool/voor-rijscholen', body, schema, noindex: !!(pl || s), pl: 'voor-rijscholen', s: s || '' });
}

// ---------- sitemap, IndexNow, chat, llms.txt, stand ----------
export async function sitemapUrls() {
  const urls = [], d = await alleData(); if (d.some(o => o.x && o.x.n >= MIN)) urls.push(B + '/rijschool', B + '/rijschool/voor-rijscholen');
  for (const { p, x } of d) { if (!x || x.n < MIN) continue; urls.push(B + '/rijschool/' + p.slug); x.items.forEach(i => { if ((i.adres ? 4 : 0) + (i.tel ? 4 : 0) + (i.web ? 4 : 0) + (rooster(i.uren) ? 3 : 0) >= 8) urls.push(B + '/rijschool/' + p.slug + '/' + i.s); }); }
  return urls;
}
export async function sitemap() { const urls = await sitemapUrls(); return { urls, xml: '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(u => '<url><loc>' + esc(u) + '</loc></url>').join('') + '</urlset>' }; }
const IKEY = '466971cbc1bbe43e6bb64a94465e4470';
export async function meldNieuw() {
  const hk = u => createHash('sha1').update(u).digest('hex').slice(0, 10), gezien = new Set((await kv.get('rs:ping').catch(() => null)) || []), urls = await sitemapUrls(), nieuw = urls.filter(u => !gezien.has(hk(u))); if (!nieuw.length) return { nieuw: 0 };
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key: IKEY, keyLocation: B + '/' + IKEY + '.txt', urlList: nieuw.slice(0, 9000) }), signal: AbortSignal.timeout(20000) }).catch(() => null);
  if (r && r.status < 300) { nieuw.forEach(u => gezien.add(hk(u))); await kv.set('rs:ping', [...gezien]).catch(() => {}); }
  return { nieuw: nieuw.length, status: r ? r.status : 'fout' };
}
export async function ping() {
  const urlList = (await sitemapUrls()).filter(u => /\/rijschool(\/[a-z-]+)?$/.test(u));
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key: IKEY, keyLocation: B + '/' + IKEY + '.txt', urlList }), signal: AbortSignal.timeout(20000) }).catch(() => null);
  return { n: urlList.length, status: r ? r.status : 'fout' };
}
export async function chatItems() {
  const info = await plaatsInfo(), nu = new Date(), uit = [], lijst = info.map(o => 'rijschool-' + o.p.slug + ' (' + o.p.naam + ', ' + o.n + ' rijscholen)').join(', ');
  uit.push({ slug: 'rijschool-hub', pad: '/rijschool', term: 'rijschool', title: 'Rijschool vergelijken per plaats', kort: 'Rijscholen per plaats op volgorde van de Keuzehulp-score, met een gratis aanvraag bij hoogstens 3 rijscholen in de buurt.', uitleg: 'Keuzehulp-score: ' + WEGING.map(w => w.naam + ' ' + w.max + ' punten (' + w.uitleg + ')').join('; ') + '. Plaatsen (slug): ' + lijst + '. Noemt de bezoeker een plaats uit die lijst, wijs dan die pagina aan. Wil de bezoeker dat een rijschool contact opneemt, wijs dan het formulier op de pagina aan.', faq: algFaq().map(([q, a]) => ({ q, a })) });
  for (const o of info) { const k = await pakket(o.p.slug); if (!k) continue; const f = plaatsFaq(o.p, k.rij, k.x0.t, k.C);
    uit.push({ slug: 'rijschool-' + o.p.slug, pad: '/rijschool/' + o.p.slug, term: 'rijschool ' + o.p.naam.toLowerCase(), title: 'Beste rijschool in ' + o.p.naam,
      kort: 'Alle ' + k.rij.length + ' rijscholen in ' + o.p.naam + ' op volgorde van de Keuzehulp-score (CBR-slagingspercentage, reviews, prijs op de site, gegevens, aanbod, BOVAG/KRM).',
      uitleg: 'Ranglijst (plek, naam, punten, wat telt, adres, telefoon, nu): ' + k.rij.slice(0, 40).map((r, i) => { const s = status(rooster(r.x.uren), nu), b = []; if (r.cb) b.push(cbrTekst(r.cb)); if (r.sc && r.sc.prijs && r.sc.prijs.length) b.push(r.sc.prijs.map(z => z.tekst).join(', ')); if (r.sc && r.sc.auto) b.push('automaat'); if (r.sc && r.sc.faal) b.push('faalangst'); if (r.sc && r.sc.spoed) b.push('spoedopleiding'); ((r.sc && r.sc.rev) || []).forEach(z => b.push(revTekst(z))); return (i + 1) + '. ' + r.x.naam + ' (' + r.q.tot + ' punten' + (b.length ? '; ' + b.join('; ') : '') + ')' + (r.x.adres ? ', ' + r.x.adres : '') + (r.x.tel ? ', tel ' + telTekst(r.x.tel) : '') + (s ? ', ' + statusTekst(s) : ''); }).join(' | ') + '. Wil de bezoeker dat een rijschool contact opneemt, wijs dan het formulier op deze pagina aan.',
      faq: f.map(([q, a]) => ({ q, a })) }); }
  return uit;
}
export async function llmsDeel() {
  const info = await plaatsInfo(); if (!info.length) return '';
  const regels = [];
  for (const o of info.sort((a, b) => b.p.inw - a.p.inw)) { const k = await pakket(o.p.slug); const t3 = k ? k.rij.slice(0, 3).map(r => r.x.naam + ' (' + r.q.tot + ')').join(', ') : ''; regels.push('- [Beste rijschool in ' + o.p.naam + '](' + B + '/rijschool/' + o.p.slug + '): alle ' + o.n + ' rijscholen vergeleken' + (t3 ? '; top 3: ' + t3 : '') + '.'); }
  return '\n\n## Rijscholen ([rijschool vergelijken](' + B + '/rijschool))\n\n- [Rijschool vergelijken per plaats](' + B + '/rijschool): rijscholen op volgorde van de Keuzehulp-score (CBR-slagingspercentage 30, reviews 25, prijs op de eigen site 15, gegevens 15, aanbod 10, BOVAG of KRM 5), met per rijschool waarom hij op die plek staat en een gratis aanvraag.\n' + regels.join('\n');
}
export async function stand() {
  const d = await alleData(), C = await cbr(), paar = h => { if (!Array.isArray(h)) return h || {}; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[h[i]] = Number(h[i + 1]) || 0; return o; };
  const LP = paar(await kv.raw(['HGETALL', 'rs:leadp']).catch(() => [])), LB = paar(await kv.raw(['HGETALL', 'rs:leadb']).catch(() => [])), dagen = [];
  for (let i = 0; i < 7; i++) { const dg = dagIso(Date.now() - i * 864e5); dagen.push({ dag: dg, ...paar(await kv.raw(['HGETALL', 'rs:tikd:' + dg]).catch(() => [])), leads: paar(await kv.raw(['HGETALL', 'rs:leadd:' + dg]).catch(() => [])) }); }
  const plaatsen = [];
  for (const { p, x } of d) { const sc = x ? await scans(p.slug) : {}, w = x ? x.items.filter(i => i.web) : [];
    plaatsen.push({ plaats: p.slug, n: x ? x.n : 0, bron: x ? x.bron : null, bijgewerkt: x ? x.t : null, metWebsite: w.length, gescand: w.filter(i => sc[i.s]).length, prijs: Object.values(sc).filter(z => z.prijs && z.prijs.length).length, reviews: Object.values(sc).filter(z => z.rev && z.rev.length).length, automaat: Object.values(sc).filter(z => z.auto).length, cbr: x && C ? x.items.filter(i => cbrMatch(i, C)).length : 0, leads: LP[p.slug] || 0 }); }
  return { ok: true, uitleg: 'Rijscholen per plaats (lib/rijschool.js): OpenStreetMap, websitescan, CBR open data; aanvragen alleen opgeslagen en geteld (gegevens op de beschermde host met op=leads). Bron mylevel = via de MyLevel-kaart na een geslaagd oefenexamen.', cbr: C ? { t: C.t, rijscholen: C.lijst.length, landelijk: C.landelijk, periode: C.periode } : null, plaatsen, leads: { totaal: Object.values(LP).reduce((a, b) => a + b, 0), perPlaats: LP, perBron: LB }, dagen };
}
export async function cbrKop() { return (await kv.get('rs:cbrkop').catch(() => null)) || { ok: false, tekst: 'nog niet geladen: op=cbr' }; }
