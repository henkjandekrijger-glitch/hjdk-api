// Makelaars vergelijken per plaats op keuzehulp.best (19 nov 2026). Henkjan: "Zorg dat die makelaars ABSOLUUT gevonden gaan worden want daar
// gaan we aan verkopen. Bedenk een eigen ranking methode met alle data points die we meenemen en die we kunnen uitleggen, neem mee ook de
// meningen anoniem in de chat. Altijd CTA bij ieder bedrijf. We plaatsen niet de mening maar de consensus van meerdere meningen."
//
// Bronnen (alles gratis, alles per kantoor te controleren):
// - Kantoren: OpenStreetMap (office=estate_agent en namen met makelaar), binnen de gemeentegrens (grens uit Nominatim, één keer per plaats).
//   Overpass eerst (7 spiegels); geeft die niets, dan Nominatim (zoeken op makelaar binnen het vak, 1 verzoek per seconde). Geen verzonnen kantoren.
// - Eigen website van het kantoor (scan, cron elk half uur, 30 dagen geldig): lid van NVM, VBO of Vastgoedpro (logo of tekst), een prijs
//   (vaste prijs of courtage) en links naar reviewplatforms; op die platforms lezen we het cijfer en het aantal uit hun eigen JSON-LD.
// - Meningen van bezoekers in de chat (anoniem): we tonen nooit een losse mening, alleen het gemiddelde en de rode draad vanaf 3 meningen.
// Keuzehulp-score (0 tot 100, WEGING hieronder) bepaalt de volgorde; op de pagina staat per kantoor waarom het op die plek staat.
// Aanvragen (offerte of gratis waardebepaling) komen via ons binnen en worden alleen opgeslagen en geteld; doorsturen of verkopen beslist Henkjan.
// KV: hk:mk:<plaats> kantoren, hk:grens:<plaats> grens, hk:sc:<plaats> scan per kantoor, hk:mnl:<plaats> meningen, hk:lead:<id> aanvraag (180 dagen),
// hk:leadids lijst, hk:leadn teller per kantoor, hk:tik:<plaats> en hk:tikd:<dag> tikken.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { kzuxBlok } from './kzux.js';
import { esc, slugify, rooster, status, statusTekst, weekRegels, telLink, telTekst, webLink, webTekst, routeLink, osmLink, afstand, datumNL, CSS as RCSS, makelaarTekst } from './rdam.js';

const HOST = 'keuzehulp.best', B = 'https://' + HOST;
export const MIN = 5; // minder kantoren = niet compleet genoeg: noindex en niet in de sitemap
const UA = 'keuzehulp.best/1.0 (makelaars vergelijken; +https://keuzehulp.best/makelaar)';
const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|python|curl|wget|axios|node-fetch|httpclient|monitor/i;
// Gemeenten: de grootste vraag naar "makelaar <stad>" in Demand Radar (thema huiskopen, NL, 19 nov 2026; vraag = grootste term per maand),
// plus Gouda (de echte chatvraag "Ik wil een huis kopen in Gouda"). c = middelpunt voor buursteden en als noodvak.
export const PLAATSEN = [
  { slug: 'amsterdam', naam: 'Amsterdam', osm: 'Amsterdam', vraag: 3600, c: [52.37, 4.90] },
  { slug: 'rotterdam', naam: 'Rotterdam', osm: 'Rotterdam', vraag: 2900, c: [51.92, 4.48] },
  { slug: 'den-haag', naam: 'Den Haag', osm: 'Den Haag', vraag: 2900, c: [52.08, 4.31] },
  { slug: 'utrecht', naam: 'Utrecht', osm: 'Utrecht', vraag: 2400, c: [52.09, 5.12] },
  { slug: 'groningen', naam: 'Groningen', osm: 'Groningen', vraag: 1900, c: [53.22, 6.57] },
  { slug: 'tilburg', naam: 'Tilburg', osm: 'Tilburg', vraag: 1600, c: [51.56, 5.09] },
  { slug: 'haarlem', naam: 'Haarlem', osm: 'Haarlem', vraag: 1600, c: [52.38, 4.64] },
  { slug: 'eindhoven', naam: 'Eindhoven', osm: 'Eindhoven', vraag: 1600, c: [51.44, 5.48] },
  { slug: 'maastricht', naam: 'Maastricht', osm: 'Maastricht', vraag: 1600, c: [50.85, 5.69] },
  { slug: 'apeldoorn', naam: 'Apeldoorn', osm: 'Apeldoorn', vraag: 1300, c: [52.21, 5.97] },
  { slug: 'almere', naam: 'Almere', osm: 'Almere', vraag: 1300, c: [52.37, 5.21] },
  { slug: 'nijmegen', naam: 'Nijmegen', osm: 'Nijmegen', vraag: 1300, c: [51.84, 5.86] },
  { slug: 'arnhem', naam: 'Arnhem', osm: 'Arnhem', vraag: 1300, c: [51.98, 5.91] },
  { slug: 'leiden', naam: 'Leiden', osm: 'Leiden', vraag: 1300, c: [52.16, 4.49] },
  { slug: 'hilversum', naam: 'Hilversum', osm: 'Hilversum', vraag: 1300, c: [52.22, 5.18] },
  { slug: 'enschede', naam: 'Enschede', osm: 'Enschede', vraag: 1300, c: [52.22, 6.89] },
  { slug: 'den-bosch', naam: 'Den Bosch', osm: "'s-Hertogenbosch", vraag: 1300, c: [51.69, 5.30] },
  { slug: 'gouda', naam: 'Gouda', osm: 'Gouda', vraag: 0, c: [52.01, 4.71] },
];
const P = Object.fromEntries(PLAATSEN.map(p => [p.slug, p]));
export const isPlaats = s => !!P[s];
const dagIso = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const datumKort = t => new Date(t).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' });
const komma = (n, d = 1) => (+n).toFixed(d).replace('.', ',');
const hash = s => createHash('sha256').update(String(s) + '|' + (process.env.CRON_SECRET || 'hk')).digest('hex').slice(0, 20);
const wacht = ms => new Promise(r => setTimeout(r, ms));

// ---------- de Keuzehulp-score ----------
export const WEGING = [
  { k: 'gegevens', naam: 'Gegevens compleet en te controleren', max: 20, uitleg: 'adres, telefoon, website en openingstijden staan in OpenStreetMap: 5 punten per gegeven', bron: 'OpenStreetMap' },
  { k: 'lid', naam: 'Lid van NVM, VBO of Vastgoedpro', max: 20, uitleg: 'het kantoor noemt het lidmaatschap of toont het logo op de eigen site; makelaar is sinds 2001 geen beschermde titel, de vereniging heeft gedragsregels en een klachtenregeling', bron: 'eigen website van het kantoor, met de datum van controle' },
  { k: 'prijs', naam: 'Prijs staat op de eigen site', max: 15, uitleg: 'een vaste prijs (tussen € 250 en € 15.000) of courtage (0,5% tot 3,5%) staat op de site; dan weet je vooraf waar je aan toe bent', bron: 'eigen website van het kantoor' },
  { k: 'reviews', naam: 'Reviews op andere platforms', max: 30, uitleg: 'cijfer en aantal van Klantenvertellen, Kiyoh, Feedback Company en Trustpilot, elk naar een schaal van 5; elke review telt één keer, samen met 10 denkbeeldige reviews van 4 sterren zodat een paar reviews niet alles bepalen. 3 sterren of lager is 0 punten, 5 sterren 30', bron: 'de pagina van het platform zelf, met link' },
  { k: 'meningen', naam: 'Meningen van bezoekers', max: 15, uitleg: 'het gemiddelde van de anonieme meningen in onze chat, pas vanaf 3 meningen; uitschieters tellen niet mee. 1 ster is 0 punten, 5 sterren 15', bron: 'keuzehulp.best, één mening per persoon per kantoor' },
];
const REV_PRIOR = 4, REV_M = 10;
export function punten(x, sc, mn) {
  const p = { gegevens: (x.adres ? 5 : 0) + (x.tel ? 5 : 0) + (x.web ? 5 : 0) + (rooster(x.uren) ? 5 : 0) };
  p.lid = sc && sc.lid && sc.lid.length ? 20 : 0;
  p.prijs = sc && sc.prijs && sc.prijs.length ? 15 : 0;
  const rv = (sc && sc.rev) || []; let n = 0, T = 0; rv.forEach(r => { n += r.aantal; T += r.aantal * (r.score / r.max * 5); });
  const B5 = n ? (T + REV_M * REV_PRIOR) / (n + REV_M) : null, gem5 = n ? T / n : null;
  p.reviews = B5 == null ? 0 : Math.round(30 * Math.max(0, Math.min(1, (B5 - 3) / 2)));
  p.meningen = mn ? Math.round(15 * Math.max(0, Math.min(1, (mn.gem - 1) / 4))) : 0;
  return { p, tot: p.gegevens + p.lid + p.prijs + p.reviews + p.meningen, nrev: n, gem5, B5 };
}
export function rang(items, scan, men) {
  return items.map(x => { const sc = scan[x.s] || null, mn = consensus(men[x.s] || []); return { x, sc, mn, q: punten(x, sc, mn) }; })
    .sort((a, b) => b.q.tot - a.q.tot || b.q.nrev - a.q.nrev || b.q.p.gegevens - a.q.p.gegevens || a.x.naam.localeCompare(b.x.naam, 'nl'));
}

// ---------- meningen: alleen de consensus ----------
const THEMA = [
  ['communicatie', /communic|bereikbaar|terugbel|terug gebeld|reageer|reageren|reactie|contact|op de hoogte|informeer|geinformeerd|geïnformeerd/],
  ['kennis van de buurt', /buurt|wijk|lokaal|lokale|regio|kent de markt|marktkennis/],
  ['deskundigheid', /deskundig|kundig|kennis|ervaren|ervaring|professio|vakkundig|vakman|expert/],
  ['snelheid', /snel|vlot|binnen een week|korte tijd|traag|langzaam|duurde lang/],
  ['prijs', /prijs|courtage|kosten|duur|goedkoop|tarief|betaalbaar|rekening/],
  ['onderhandelen', /onderhandel|\bbod\b|bieden|overbied|biedproces/],
  ['betrokkenheid', /vriendelijk|aardig|prettig|betrokken|persoonlijk|meedenk|meegedacht|onbeschoft|arrogant|ongeinteresseerd/],
  ['presentatie van het huis', /foto|presentatie|plattegrond|funda|video|styling/],
  ['bezichtigingen', /bezichtig/],
];
const lijstNL = l => l.length < 2 ? (l[0] || '') : l.slice(0, -1).join(', ') + ' en ' + l[l.length - 1];
export function consensus(lijst) {
  if (!lijst || lijst.length < 3) return null;
  const st = lijst.map(m => m.st).sort((a, b) => a - b), med = st[Math.floor(st.length / 2)];
  const goed = lijst.length >= 4 ? lijst.filter(m => Math.abs(m.st - med) < 3) : lijst; // uitschieters (3 sterren of meer van de mediaan) tellen niet mee
  if (goed.length < 3) return null;
  const gem = goed.reduce((a, m) => a + m.st, 0) / goed.length;
  const tel = {}; goed.forEach(m => { const t = String(m.t || '').toLowerCase(); if (!t) return; THEMA.forEach(([k, re]) => { if (re.test(t)) { tel[k] = tel[k] || { pos: 0, neg: 0 }; if (m.st >= 4) tel[k].pos++; else if (m.st <= 2) tel[k].neg++; } }); });
  const pos = Object.entries(tel).filter(([, v]) => v.pos >= 2 && v.pos > v.neg).sort((a, b) => b[1].pos - a[1].pos).map(([k]) => k).slice(0, 3);
  const neg = Object.entries(tel).filter(([, v]) => v.neg >= 2 && v.neg > v.pos).sort((a, b) => b[1].neg - a[1].neg).map(([k]) => k).slice(0, 2);
  let zin = gem >= 4 ? 'De meeste bezoekers zijn tevreden' : gem >= 2.75 ? 'De meningen zijn verdeeld' : 'De meeste bezoekers zijn niet tevreden';
  if (pos.length) zin += ', vooral over ' + lijstNL(pos); if (neg.length) zin += (pos.length ? '; minder over ' : ', vooral niet over ') + lijstNL(neg);
  return { n: goed.length, gem, zin: zin + '.' };
}
async function meningen(slug) {
  const l = await kv.raw(['LRANGE', 'hk:mnl:' + slug, '0', '4999']).catch(() => null) || [], uit = {};
  for (const r of l) { try { const m = typeof r === 'string' ? JSON.parse(r) : r; if (m && m.s) (uit[m.s] = uit[m.s] || []).push(m); } catch (e) {} }
  return uit;
}
export async function meningPost(req, b) {
  b = b || {}; const pl = String(b.pl || ''), s = String(b.s || '').replace(/[^a-z0-9-]/g, '').slice(0, 90), st = Math.round(Number(b.st)), sid = String(b.sid || '').slice(0, 60);
  const fout = { ok: false, tekst: 'Dat lukte niet. Probeer het later nog eens.' };
  if (!P[pl] || !s || !(st >= 1 && st <= 5) || b.website || !(Number(b.ms) > 4000) || !sid || BOT.test(String(req.headers['user-agent'] || ''))) return fout;
  const x0 = await data(pl); if (!x0 || !x0.items.some(i => i.s === s)) return fout;
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), ih = hash('ip:' + ip), k = pl + '/' + s;
  const a = await kv.raw(['SET', 'hk:mnip:' + k + ':' + ih, '1', 'NX', 'EX', String(365 * 86400)]).catch(() => 'OK');
  const c = await kv.raw(['SET', 'hk:mnsid:' + k + ':' + hash('sid:' + sid), '1', 'NX', 'EX', String(365 * 86400)]).catch(() => 'OK');
  if (!a || !c) return { ok: false, al: true, tekst: 'Je gaf al eerder je mening over dit kantoor. Dank je.' };
  const dk = 'hk:mndag:' + dagIso() + ':' + ih, nd = await kv.incr(dk).catch(() => 1); if (nd === 1) await kv.raw(['EXPIRE', dk, '90000']).catch(() => {}); if (nd > 10) return fout;
  const t = String(b.t || '').replace(/\S+@\S+/g, ' ').replace(/(\+?\d[\d\s().-]{6,}\d)/g, ' ').replace(/https?:\/\/\S+|www\.\S+/g, ' ').replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280);
  await kv.raw(['LPUSH', 'hk:mnl:' + pl, JSON.stringify({ s, st, t, d: dagIso(), i: ih.slice(0, 8) })]); await kv.raw(['LTRIM', 'hk:mnl:' + pl, '0', '4999']).catch(() => {});
  await kv.raw(['HINCRBY', 'hk:mnd:' + dagIso(), pl, '1']).catch(() => {});
  return { ok: true, tekst: 'Dank je. We plaatsen nooit een losse mening. Zodra er 3 of meer meningen over dit kantoor zijn, tonen we het gemiddelde en de rode draad, en telt het mee in de Keuzehulp-score.' };
}

// ---------- aanvragen (leads) ----------
const MAIL = /^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i, TEL = /^\+?[\d\s().-]{9,16}$/;
export async function leadPost(req, b) {
  b = b || {}; const pl = String(b.pl || ''), s = String(b.s || '').replace(/[^a-z0-9-]/g, '').slice(0, 90);
  const soort = b.soort === 'kopen' ? 'kopen' : 'verkopen', contact = String(b.contact || '').trim().slice(0, 80), naam = String(b.naam || '').replace(/[<>"@\d]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const pc = String(b.pc || '').toUpperCase().replace(/\s/g, '').slice(0, 6), ua = String(req.headers['user-agent'] || '');
  if (b.website || BOT.test(ua) || !(Number(b.ms) > 2500)) return { ok: false, tekst: 'Dat lukte niet. Probeer het later nog eens.' };
  if (!P[pl]) return { ok: false, tekst: 'Kies eerst een kantoor.' };
  const x0 = await data(pl), x = x0 && x0.items.find(i => i.s === s); if (!x) return { ok: false, tekst: 'Dit kantoor staat niet (meer) in onze lijst.' };
  if (!(MAIL.test(contact) || (TEL.test(contact) && contact.replace(/\D/g, '').length >= 9))) return { ok: false, tekst: 'Vul een telefoonnummer of e-mailadres in, dan kan het kantoor je bereiken.' };
  if (!(b.ok === '1' || b.ok === true || b.ok === 'on')) return { ok: false, tekst: 'Vink aan dat we je aanvraag aan dit kantoor mogen doorgeven.' };
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), ih = hash('ip:' + ip);
  const dk = 'hk:leadip:' + dagIso() + ':' + ih, nd = await kv.incr(dk).catch(() => 1); if (nd === 1) await kv.raw(['EXPIRE', dk, '90000']).catch(() => {}); if (nd > 5) return { ok: false, tekst: 'Je hebt vandaag al een paar aanvragen gedaan. Bel het kantoor gerust zelf.' };
  const id = randomBytes(6).toString('hex'), k = pl + '/' + s;
  const fn = (String(req.headers.cookie || '').match(/(?:^|;\s*)mmp=([0-9a-f]{16})/) || [])[1] || '';
  const rec = { id, t: new Date().toISOString(), pl, plaats: P[pl].naam, s, kantoor: x.naam, kantoorTel: x.tel || '', kantoorWeb: x.web || '', soort, pc: /^\d{4}[A-Z]{0,2}$/.test(pc) ? pc : '', naam, contact, sid: hash('sid:' + String(b.sid || '')).slice(0, 10), fn: fn ? hash('fn:' + fn).slice(0, 10) : '' };
  await kv.set('hk:lead:' + id, rec, { ex: 180 * 86400 });
  await kv.raw(['LPUSH', 'hk:leadids', id]); await kv.raw(['LTRIM', 'hk:leadids', '0', '4999']).catch(() => {});
  await kv.raw(['HINCRBY', 'hk:leadn', k + ':' + soort, '1']).catch(() => {}); await kv.raw(['HINCRBY', 'hk:leadp', pl, '1']).catch(() => {});
  await kv.raw(['HINCRBY', 'hk:leadd:' + dagIso(), pl + ':' + soort, '1']).then(() => kv.raw(['EXPIRE', 'hk:leadd:' + dagIso(), String(400 * 86400)])).catch(() => {});
  try { if (fn) { const F = await import('./funnel.js'); await F.funnelStap(fn, 'lead', 'makelaar-' + pl); } } catch (e) {}
  try { const I = await import('./intentie.js'); await I.intentieLog(kv, { site: 'nl', q: (soort === 'kopen' ? 'aankoopmakelaar ' : 'waardebepaling makelaar ') + P[pl].naam, slug: 'makelaar-' + pl, bron: 'lead' }, req); } catch (e) {}
  try { const tot = await kv.raw(['HGET', 'hk:leadp', pl]); const sl = process.env.MELD_SLEUTEL; if (sl) await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': sl }, body: JSON.stringify({ bron: 'keuzehulp.best makelaars', tekst: 'Nieuwe aanvraag (' + (soort === 'kopen' ? 'aankoop' : 'waardebepaling verkoop') + ') voor ' + x.naam + ' in ' + P[pl].naam + '. ' + tot + ' aanvragen in ' + P[pl].naam + ' tot nu toe. Gegevens staan in de beschermde lijst (tool=huis op=leads).' }), signal: AbortSignal.timeout(8000) }); } catch (e) {}
  return { ok: true, tekst: 'Dank je' + (naam ? ', ' + naam : '') + '. Je aanvraag voor ' + x.naam + ' staat bij ons en we geven hem door aan het kantoor.' + (x.tel ? ' Liever meteen contact? Bel ' + telTekst(x.tel) + '.' : '') };
}
export async function leads(n = 50) {
  const ids = await kv.raw(['LRANGE', 'hk:leadids', '0', String(n - 1)]).catch(() => []) || [];
  const l = (await Promise.all(ids.map(id => kv.get('hk:lead:' + id).catch(() => null)))).filter(Boolean);
  return { ok: true, n: l.length, leads: l };
}

// ---------- tikken en bezoek ----------
export async function tik(b) {
  b = b || {}; const pl = P[b.pl] ? b.pl : b.pl === 'huis-kopen' ? 'huis-kopen' : b.pl === 'hub' ? 'hub' : '', e = ['zie', 'bel', 'route', 'web', 'offerte', 'mening'].includes(b.e) ? b.e : '', s = String(b.s || '').replace(/[^a-z0-9-]/g, '').slice(0, 90);
  if (!pl || !e) return { ok: false };
  const dk = 'hk:tikd:' + dagIso();
  if (e === 'zie') { const bron = ['google', 'bing', 'ai', 'direct', 'intern', 'overig'].includes(b.b) ? b.b : 'overig'; await kv.raw(['HINCRBY', dk, 'zie:' + pl, '1']).then(() => kv.raw(['HINCRBY', dk, 'bron:' + bron, '1'])).catch(() => {}); }
  else { await kv.raw(['HINCRBY', dk, e + ':' + pl, '1']).catch(() => {}); if (s && P[pl]) await kv.raw(['HINCRBY', 'hk:tik:' + pl, s + ':' + e, '1']).catch(() => {}); }
  await kv.raw(['EXPIRE', dk, String(400 * 86400)]).catch(() => {});
  return { ok: true };
}

// ---------- data: kantoren uit OpenStreetMap ----------
async function grens(p) {
  const k = 'hk:grens:' + p.slug, oud = await kv.get(k).catch(() => null); if (oud && oud.rings) return oud;
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&polygon_geojson=1&polygon_threshold=0.0008&countrycodes=nl&limit=10&q=' + encodeURIComponent(p.osm), { headers: { 'user-agent': UA, 'accept-language': 'nl' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { fout: 'nominatim ' + r.status };
    const l = await r.json(), poly = x => x && x.geojson && /Polygon/.test(x.geojson.type) && x.category === 'boundary' && x.type === 'administrative';
    const g = (l || []).find(x => poly(x) && x.place_rank >= 14 && x.place_rank <= 16) || (l || []).find(x => poly(x) && x.place_rank > 12);
    if (!g) return { fout: 'geen grens', n: (l || []).length };
    const rings = (g.geojson.type === 'Polygon' ? g.geojson.coordinates : g.geojson.coordinates.flat()).map(rg => rg.map(([x, y]) => [+(+x).toFixed(4), +(+y).toFixed(4)]));
    const bb = g.boundingbox.map(Number); // [zuid, noord, west, oost]
    const uit = { t: Date.now(), id: g.osm_type[0] + g.osm_id, rank: g.place_rank, bbox: [bb[0], bb[2], bb[1], bb[3]], rings };
    await kv.set(k, uit); return uit;
  } catch (e) { return { fout: String(e.name || e).slice(0, 40) }; }
}
function binnen(lat, lon, rings) { let ja = false; for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) ja = !ja; } return ja; }
const SPIEGELS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://z.overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.osm.jp/api/interpreter'];
async function overpass(bbox, st, tot) {
  const q = '[out:json][timeout:25][bbox:' + bbox.join(',') + '];(nwr["office"="estate_agent"];nwr["office"]["name"~"makelaar",i];nwr["shop"]["name"~"makelaar",i];nwr["craft"]["name"~"makelaar",i];);out center tags;';
  const t0 = Date.now(), start = Math.floor(Date.now() / 3600000) % SPIEGELS.length; // elk uur een andere spiegel eerst
  for (let i = 0; i < SPIEGELS.length; i++) { const u = SPIEGELS[(start + i) % SPIEGELS.length]; if (Date.now() - t0 > tot) break; const h = u.split('/')[2].split('.')[0];
    try { const r = await fetch(u, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(Math.min(28000, tot - (Date.now() - t0) + 1000)) });
      st.push(h + ':' + r.status); if (!r.ok) continue; const j = await r.json(); if (j && Array.isArray(j.elements) && !/error/i.test(String(j.remark || ''))) return j.elements; st.push(h + ':remark'); } catch (e) { st.push(h + ':' + String(e.name || e).slice(0, 16)); } }
  return null;
}
// ohsome (HeiGIT, Universiteit Heidelberg): dezelfde OpenStreetMap-gegevens via een andere, gratis dienst; Overpass gaf vanaf Vercel alleen time-outs (19 nov 2026)
async function ohsome(bbox, st) {
  const [s, w, n, e] = bbox;
  try { const r = await fetch('https://api.ohsome.org/v1/elements/centroid', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA }, body: new URLSearchParams({ bboxes: [w, s, e, n].join(','), filter: '(office=estate_agent or shop=estate_agent) and name=*', properties: 'tags' }).toString(), signal: AbortSignal.timeout(45000) });
    st.push('ohsome:' + r.status); if (!r.ok) return null; const j = await r.json(); if (!j || !Array.isArray(j.features)) return null;
    return j.features.map(f => { const p = f.properties || {}, [type, id] = String(p['@osmId'] || '').split('/'), c = (f.geometry && f.geometry.coordinates) || []; const tags = {}; for (const [k, v] of Object.entries(p)) if (!k.startsWith('@')) tags[k] = v; return { type: type || 'node', id, lat: c[1], lon: c[0], tags }; }).filter(x => x.id && x.lat != null);
  } catch (er) { st.push('ohsome:' + String(er.name || er).slice(0, 16)); return null; }
}
async function nominatim(bbox, st) {
  const [s, w, n, e] = bbox, uit = new Map();
  for (const q of ['makelaar', 'makelaardij', 'makelaars', 'estate agent']) {
    const excl = [];
    for (let pg = 0; pg < 4; pg++) {
      await wacht(1100); let l = null;
      try { const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&extratags=1&addressdetails=1&limit=50&bounded=1&viewbox=' + [w, n, e, s].join(',') + '&q=' + encodeURIComponent(q) + (excl.length ? '&exclude_place_ids=' + excl.join(',') : ''), { headers: { 'user-agent': UA, 'accept-language': 'nl' }, signal: AbortSignal.timeout(15000) }); st.push('nom:' + r.status); if (r.ok) l = await r.json(); } catch (er) { st.push('nom:' + String(er.name || er).slice(0, 16)); }
      if (!Array.isArray(l) || !l.length) break;
      l.forEach(x => { excl.push(x.place_id); const k = x.osm_type + x.osm_id; if (!uit.has(k)) uit.set(k, x); }); if (l.length < 50) break;
    }
  }
  return [...uit.values()].map(x => { const a = x.address || {}, et = x.extratags || {}; return { type: String(x.osm_type || 'node'), id: x.osm_id, lat: +x.lat, lon: +x.lon, tags: { ...et, name: x.name || et.name || '', [x.category]: x.type, 'addr:street': a.road || '', 'addr:housenumber': a.house_number || '', 'addr:postcode': a.postcode || '', 'addr:city': a.city || a.town || a.village || '' } }; });
}
export async function ververs(slug) {
  const p = P[slug]; if (!p) return { ok: false, fout: 'plaats' };
  const t0 = Date.now(), st = [], g = await grens(p);
  const bbox = g && g.bbox ? g.bbox : [p.c[0] - 0.07, p.c[1] - 0.11, p.c[0] + 0.07, p.c[1] + 0.11];
  let els = await overpass(bbox, st, 40000), bron = 'overpass';
  if (!els) { els = await ohsome(bbox, st); bron = 'ohsome'; if (els && !els.length) els = null; }
  if (!els) { els = await nominatim(bbox, st); bron = 'nominatim'; if (!els.length) els = null; }
  else if (bron === 'ohsome') { const nm = await nominatim(bbox, st).catch(() => []); const ids = new Set(els.map(x => String(x.type)[0] + x.id)); nm.forEach(x => { if (!ids.has(String(x.type)[0] + x.id)) els.push(x); }); } // ohsome heeft alleen office=estate_agent; Nominatim vult aan met namen als makelaardij
  if (!els) return { ok: false, fout: 'geen bron', grens: g && g.fout ? g.fout : 'ok', status: st, ms: Date.now() - t0 };
  const oud = await data(slug).catch(() => null), gezien = new Set(), slugs = new Set(), items = [];
  const nb = (lat, lon) => g && g.rings ? binnen(lat, lon, g.rings) : afstand({ lat, lon }, { lat: p.c[0], lon: p.c[1] }) < 7;
  for (const e of els) {
    const t = e.tags || {}, naam = String(t.name || '').trim(); if (!naam || t.highway || t.disused || t['disused:office'] || /^(yes|no)$/i.test(naam)) continue;
    const isMk = t.office === 'estate_agent' || (/makelaar/i.test(naam) && (t.office || t.shop || t.craft)); if (!isMk) continue;
    const lat = e.lat ?? (e.center && e.center.lat), lon = e.lon ?? (e.center && e.center.lon); if (lat == null || !nb(+lat, +lon)) continue;
    const id = String(e.type)[0] + e.id, dub = naam.toLowerCase() + '|' + String(t['addr:postcode'] || '').replace(/\s/g, '') + '|' + (t['addr:housenumber'] || ''); if (gezien.has(dub)) continue; gezien.add(dub);
    const vorig = oud && oud.items.find(i => i.id === id);
    let s = vorig ? vorig.s : (slugify(naam) || id); if (slugs.has(s)) s += '-' + (String(t['addr:postcode'] || '').replace(/\s/g, '').toLowerCase() || id); if (slugs.has(s)) s += '-' + id; slugs.add(s);
    items.push({ s, id, naam: naam.slice(0, 90), lat: +(+lat).toFixed(5), lon: +(+lon).toFixed(5), adres: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '), pc: t['addr:postcode'] || '', plaats: t['addr:city'] || p.naam,
      tel: t.phone || t['contact:phone'] || '', web: t.website || t['contact:website'] || t.url || '', uren: t.opening_hours || '', rolstoel: t.wheelchair || '' });
  }
  // Nominatim vindt niet alles: houd de kantoren van de vorige keer die nu ontbreken
  if (bron === 'nominatim' && oud) oud.items.forEach(i => { if (!items.some(x => x.id === i.id) && !slugs.has(i.s)) { slugs.add(i.s); items.push(i); } });
  if (!items.length && oud && oud.items.length) return { ok: false, fout: 'leeg, oude lijst gehouden', status: st };
  items.sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  const uit = { t: new Date().toISOString(), n: items.length, bron, items };
  await kv.set('hk:mk:' + slug, uit); await kv.set('hk:t:' + slug, String(Date.now())).catch(() => {});
  return { ok: true, plaats: slug, n: items.length, bron, grens: g && g.rings ? 'gemeentegrens' : 'noodvak', status: st, ms: Date.now() - t0 };
}
export async function data(slug) { return P[slug] ? await kv.get('hk:mk:' + slug).catch(() => null) : null; }
export async function alleData() { const v = await Promise.all(PLAATSEN.map(p => data(p.slug))); return PLAATSEN.map((p, i) => ({ p, x: v[i] })); }
export async function verversOudste() {
  const v = await kv.mget(...PLAATSEN.map(p => 'hk:t:' + p.slug)).catch(() => []);
  let best = PLAATSEN[0].slug, bt = Infinity; PLAATSEN.forEach((p, i) => { const t = Number(v[i]) || 0; if (t < bt) { bt = t; best = p.slug; } });
  const r = await ververs(best); if (!r.ok) await kv.set('hk:t:' + best, String(Date.now() - 6 * 864e5)).catch(() => {}); return r;
}

// ---------- scan van de eigen website: lidmaatschap, prijs, reviewplatforms ----------
const LID = {
  NVM: /lid van (de )?nvm\b|aangesloten bij (de )?nvm\b|\bnvm[- ]?(makelaar|lid|aangesloten|erkend|kantoor|keurmerk|logo|aankoopmakelaar|verkoopmakelaar)|<img[^>]{0,400}(src|alt|title)=["'][^"']{0,250}\bnvm\b/i,
  VBO: /lid van (de )?vbo\b|aangesloten bij (de )?vbo\b|\bvbo[- ]?(makelaar|lid|aangesloten|erkend|kantoor|keurmerk|logo)|<img[^>]{0,400}(src|alt|title)=["'][^"']{0,250}\bvbo\b/i,
  Vastgoedpro: /vastgoed\s?pro\b/i,
};
const PLATF = [[/(^|\.)klantenvertellen\.nl$/, 'Klantenvertellen', 10], [/(^|\.)kiyoh\.(com|nl)$/, 'Kiyoh', 10], [/(^|\.)feedbackcompany\.(com|nl)$/, 'Feedback Company', 10], [/(^|\.)trustpilot\.com$/, 'Trustpilot', 5]];
async function haal(u, ms = 9000) {
  try { const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; ' + UA + ')', 'accept-language': 'nl-NL,nl;q=0.9', accept: 'text/html,application/xhtml+xml' }, redirect: 'follow', signal: AbortSignal.timeout(ms) });
    const ct = String(r.headers.get('content-type') || ''); if (!r.ok || !/html/.test(ct)) return { s: r.status, u: r.url || u }; return { s: r.status, u: r.url || u, t: (await r.text()).slice(0, 700000) }; } catch (e) { return { s: 0, f: String(e.name || e).slice(0, 30) }; }
}
const kaal = h => String(h || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&euro;|&#8364;/g, '€').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const PRIJS_W = /(courtage|tarief|tarieven|vaste prijs|vast tarief|vaste vergoeding|vast bedrag|all[- ]?in|verkoopkosten|aankoopkosten|aankoopbegeleiding|verkoopbegeleiding|kosten (van de )?(verkoop|aankoop|makelaar)|verkopen voor|aankoop voor|pakket)/i;
const PRIJS_NIET = /hypothe|rente|overdrachtsbelasting|nhg|korting|vraagprijs|koopsom van|woningwaarde|k\.k\.|kosten koper|v\.o\.n|huur|per maand|p\/m|p\.m\./i;
export function prijsUit(tekst) {
  const uit = [], t = String(tekst || '');
  for (const m of t.matchAll(/€\s?(\d{1,3}(?:\.\d{3})+|\d{3,5})(?:,(?:\d{2}|-))?/g)) { const v = +m[1].replace(/\./g, ''); if (v < 250 || v > 15000) continue; const ctx = t.slice(Math.max(0, m.index - 110), m.index + m[0].length + 30), dicht = t.slice(Math.max(0, m.index - 45), m.index + m[0].length + 15); if (!PRIJS_W.test(ctx) || PRIJS_NIET.test(dicht)) continue; uit.push({ soort: /aankoop/i.test(ctx) ? 'aankoop' : 'vast', v, tekst: '€ ' + v.toLocaleString('nl-NL') }); }
  for (const m of t.matchAll(/(\d(?:[.,]\d{1,2})?)\s?%/g)) { const v = +m[1].replace(',', '.'); if (v < 0.5 || v > 3.5) continue; const ctx = t.slice(Math.max(0, m.index - 110), m.index + 40), dicht = t.slice(Math.max(0, m.index - 45), m.index + m[0].length + 12); if (!/courtage|verkoopprijs|koopsom|tarief/i.test(ctx) || /hypothe|rente|overdrachtsbelasting|nhg|korting|rendement|groei|stijg|daal|btw/i.test(dicht)) continue; uit.push({ soort: 'courtage', v, tekst: komma(v, v % 1 ? (String(v).split('.')[1] || '').length : 0) + '% courtage' }); }
  const vast = uit.filter(x => x.soort !== 'courtage').sort((a, b) => a.v - b.v)[0], ct = uit.filter(x => x.soort === 'courtage').sort((a, b) => a.v - b.v)[0];
  return [vast, ct].filter(Boolean);
}
function aggUit(html) {
  const vind = o => { if (!o || typeof o !== 'object') return null; if (o.aggregateRating) return o.aggregateRating; for (const v of Object.values(o)) { const r = vind(v); if (r) return r; } return null; };
  for (const m of String(html || '').matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) { try { const a = vind(JSON.parse(m[1].trim())); if (a) { const sc = +String(a.ratingValue).replace(',', '.'), n = +(a.reviewCount || a.ratingCount || 0), mx = +(a.bestRating || 0); if (sc > 0 && n > 0) return { score: sc, aantal: n, max: mx || null }; } } catch (e) {} }
  return null;
}
async function scanEen(x) {
  const uit = { t: Date.now(), lid: [], prijs: [], rev: [] }; const w = webLink(x.web), thuis = await haal(w);
  if (!thuis.t) { uit.fout = thuis.f || thuis.s; return uit; }
  uit.url = thuis.u; let host = ''; try { host = new URL(thuis.u).hostname.replace(/^www\./, ''); } catch (e) {}
  let html = thuis.t; const links = [...html.matchAll(/href=["']([^"'#]+)["']/gi)].map(m => { try { return new URL(m[1].replace(/&amp;/g, '&'), thuis.u); } catch (e) { return null; } }).filter(Boolean);
  const sub = links.find(u => u.hostname.replace(/^www\./, '') === host && /tarie|kosten|prijs|prijzen|courtage|diensten/i.test(u.pathname));
  if (sub) { const s2 = await haal(sub.href, 8000); if (s2.t) { html += ' ' + s2.t; uit.prijsUrl = s2.u; } }
  for (const [k, re] of Object.entries(LID)) if (re.test(html)) uit.lid.push(k);
  uit.prijs = prijsUit(kaal(html)).map(p => ({ ...p, url: uit.prijsUrl || uit.url }));
  const pl = []; for (const u of links) { const h = u.hostname.replace(/^www\./, ''); const f = PLATF.find(([re]) => re.test(h)); if (f && !pl.some(z => z.naam === f[1]) && u.pathname.length > 3) pl.push({ naam: f[1], max: f[2], url: u.href }); }
  if (!pl.some(z => z.naam === 'Trustpilot') && host) pl.push({ naam: 'Trustpilot', max: 5, url: 'https://nl.trustpilot.com/review/' + host, gok: true });
  for (const z of pl.slice(0, 3)) { const r = await haal(z.url, 8000); const a = r.t ? aggUit(r.t) : null; if (a && a.score <= (a.max || z.max)) uit.rev.push({ platform: z.naam, score: a.score, max: a.max || z.max, aantal: a.aantal, url: r.u || z.url }); }
  return uit;
}
async function scans(slug) { return (await kv.get('hk:sc:' + slug).catch(() => null)) || {}; }
export async function scanRonde(n = 30) {
  const t0 = Date.now(), d = await alleData(), todo = [];
  for (const { p, x } of d) { if (!x) continue; const sc = await scans(p.slug); x.items.forEach(i => { if (i.web && !(sc[i.s] && Date.now() - sc[i.s].t < 30 * 864e5)) todo.push({ p, i, oud: sc[i.s] ? sc[i.s].t : 0 }); }); }
  todo.sort((a, b) => a.oud - b.oud || b.p.vraag - a.p.vraag); const doe = todo.slice(0, n), per = {}; let klaar = 0;
  for (let k = 0; k < doe.length; k += 6) { if (Date.now() - t0 > 200000) break; await Promise.all(doe.slice(k, k + 6).map(async ({ p, i }) => { const r = await scanEen(i).catch(e => ({ t: Date.now(), lid: [], prijs: [], rev: [], fout: String(e.message || e).slice(0, 40) })); (per[p.slug] = per[p.slug] || {})[i.s] = r; klaar++; })); }
  for (const [sl, nw] of Object.entries(per)) { const sc = await scans(sl); Object.assign(sc, nw); await kv.set('hk:sc:' + sl, sc); }
  return { ok: true, gescand: klaar, open: todo.length - klaar, ms: Date.now() - t0 };
}

// ---------- opmaak ----------
const BRON_KB = ['Kamerbrief over regulering van de makelaardij (1 oktober 2026)', 'https://omgevingsweb.nl/wp-content/uploads/2026/10/Kamerbrief-over-regulering-makelaardij.pdf'];
const ORG = { '@type': 'Organization', '@id': B + '/#org', name: 'keuzehulp.best', url: B + '/' };
const EXTRA = 'body.mk main .lead{font-size:16px;line-height:1.6;max-width:none;margin:0 0 16px}body.mk main .lead p{margin:0 0 6px}body.mk main .answer.lead{margin:8px 0 16px}.mk-sc{display:inline-flex;align-items:baseline;gap:6px;font-weight:700;font-size:16px}.mk-sc b{font-size:18px}.mk-bd{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0}.mk-bd span{font-size:14px;border:1px solid var(--line);border-radius:999px;padding:2px 10px}'
  + '.zaken li .why{font-size:15px;margin:4px 0 0}.zaken li .why summary{cursor:pointer;font-size:15px}.why ul{margin:6px 0 0;padding-left:18px}.why li{border:0!important;padding:2px 0!important;display:list-item!important}'
  + '.top3{list-style:none;padding:0;margin:16px 0;display:grid;gap:10px}.top3 li{border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;gap:4px}.top3 .n{font-weight:700;font-size:18px}'
  + 'table.mk-w{width:100%;border-collapse:collapse;margin:12px 0}table.mk-w th,table.mk-w td{text-align:left;vertical-align:top;padding:8px 10px 8px 0;border-bottom:1px solid var(--line);font-size:15px}table.mk-w td:nth-child(2){white-space:nowrap;font-weight:700}'
  + '.mkf{display:grid;gap:12px;margin:12px 0}.mkf fieldset{border:0;padding:0;margin:0;display:grid;gap:8px}.mkf legend{font-weight:700;margin:0 0 6px}.mkf label{display:grid;gap:4px;font-size:16px}.mkf fieldset label,.mkf label.mkt{display:flex;gap:10px;align-items:flex-start}.mkf input[type=text],.mkf input:not([type]),.mkf input[type=tel]{font:inherit;font-size:16px;padding:10px 14px;border:1px solid #B9BFC7;border-radius:12px;background:transparent;color:inherit}.mkf input[type=radio],.mkf input[type=checkbox]{width:20px;height:20px;margin-top:3px;flex:none}.mkh{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}.mkf button[type=submit]{font:inherit;font-weight:700;font-size:16px;padding:12px 20px;border-radius:999px;border:0;cursor:pointer;justify-self:start}.mko{font-weight:700}'
  + 'dialog#mkd{border:0;border-radius:18px;padding:22px;max-width:480px;width:calc(100% - 32px);color:var(--ink);background:var(--bg)}dialog#mkd::backdrop{background:#111113b8}dialog#mkd h2{margin:0 0 4px;font-size:20px;padding-right:36px}.mkx{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:1px solid #D1D5DB;background:transparent;color:inherit;font-size:20px;cursor:pointer}'
  + 'html body.mk main .kn a.cta:not(.of){background:transparent!important;color:#111113!important;border:1.5px solid #B9BFC7!important}html body.mk main .kn a.of{background:#111113!important;color:#fff!important;border:1.5px solid #111113!important}.kn .mn{font-size:15px;font-weight:500;border:0;padding:6px 4px;text-decoration:underline}.bron{font-size:14px}.mk-rest .w{font-size:15px}'
  + '@media (prefers-color-scheme:dark){html body.mk{background:#0F1115!important;color:#D7DAE0!important}html body.mk header.topbar{background:#0F1115!important;border-color:#2A2F3A!important}html body.mk header.topbar .mark,html body.mk header.topbar .mark em,html body.mk header.topbar .topnav a{color:#F2F3F5!important}html body.mk .ov,html body.mk main p,html body.mk main li,html body.mk main td,html body.mk main th,html body.mk main summary,html body.mk main span,html body.mk main label,html body.mk main legend,html body.mk footer,html body.mk footer a{color:#D7DAE0!important}html body.mk h1,html body.mk h2,html body.mk h3,html body.mk main b,html body.mk main strong{color:#F2F3F5!important}html body.mk main a,html body.mk main a:visited{color:#F2F3F5!important}html body.mk main .answer,html body.mk main .kaart{background:#1A1D24!important}html body.mk main .kn a,html body.mk main .kn a.cta:not(.of){background:transparent!important;color:#F2F3F5!important;border-color:#6B7280!important}html body.mk main .kn a.of,html body.mk main .mkf button[type=submit],html body.mk main a.cta.of{background:#F2F3F5!important;color:#0F1115!important;border-color:#F2F3F5!important}html body.mk .zaken,html body.mk .zaken li,html body.mk table.mk-w td,html body.mk table.mk-w th,html body.mk .top3 li,html body.mk .mk-bd span,html body.mk details.faq,html body.mk footer.voet1{border-color:#2A2F3A!important}html body.mk dialog#mkd{background:#151821!important;color:#D7DAE0!important}html body.mk .mkf input{border-color:#6B7280!important;color:#F2F3F5!important;background:#0F1115!important}html body.mk .mkx{color:#F2F3F5!important;border-color:#6B7280!important}html body.mk .fl button{color:#F2F3F5!important;border-color:#6B7280!important;background:transparent!important}html body.mk .fl button[aria-pressed=true]{background:#F2F3F5!important;color:#0F1115!important}html body.mk .kx form.kx-f input{color:#F2F3F5!important}html body.mk .kx-mnf textarea{color:#F2F3F5!important;border-color:#6B7280!important}}';
function doc({ titel, desc, pad, body, schema, noindex, pl = '', s = '' }) {
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>' + esc(titel) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + B + pad + '">' + (noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-snippet:-1">') +
    '<link rel="icon" href="data:,"><link rel="alternate" type="text/plain" href="/llms.txt"><style>' + RCSS + EXTRA + '</style><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head><body class="mk" data-pl="' + esc(pl) + '" data-s="' + esc(s) + '"><header class="topbar"><div class="wrap"><a class="mark" href="/">keuzehulp<em>.best</em></a><nav class="topnav"><a href="/huis-kopen">Huis kopen</a><a href="/makelaar">Makelaars</a><a href="/verzekeringen">Verzekeringen</a></nav></div></header><main><div class="wrap">' + body +
    '</div></main>' + DIALOOG + '<footer><div class="wrap"><p>Makelaars uit OpenStreetMap (© OpenStreetMap-bijdragers, ODbL); de volgorde is onze eigen Keuzehulp-score. Niemand betaalt voor een plek.</p></div></footer><script>' + MKJS + '</script></body></html>';
}
function leadForm(pl, s, inline) {
  return '<form class="mkf" data-lead method="post" action="/api/keuze-tools?tool=huis&op=lead"' + (inline ? ' id="aanvraag"' : '') + '><input type="hidden" name="pl" value="' + esc(pl) + '"><input type="hidden" name="s" value="' + esc(s) + '">' +
    '<fieldset><legend>Wat wil je?</legend><label><input type="radio" name="soort" value="verkopen" checked> Ik wil verkopen: gratis waardebepaling</label><label><input type="radio" name="soort" value="kopen"> Ik wil kopen: offerte voor aankoopbegeleiding</label></fieldset>' +
    '<label>Postcode van je huis of waar je zoekt<input type="text" name="pc" maxlength="7" autocomplete="postal-code"></label><label>Voornaam<input type="text" name="naam" maxlength="40" autocomplete="given-name"></label><label>Telefoon of e-mail<input type="text" name="contact" required maxlength="80" autocomplete="email"></label>' +
    '<label class="mkt"><input type="checkbox" name="ok" value="1" required> Je mag mijn aanvraag en gegevens aan dit kantoor doorgeven</label><input class="mkh" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="ms" value="9999">' +
    '<button type="submit">Verstuur aanvraag</button><p class="bron">Gratis en vrijblijvend. We gebruiken je gegevens alleen voor deze aanvraag en wissen ze na 180 dagen.</p><p class="mko" role="status" hidden></p></form>';
}
const DIALOOG = '<dialog id="mkd" aria-labelledby="mkdh"><button type="button" class="mkx" aria-label="Sluiten">×</button><h2 id="mkdh">Aanvraag</h2>' + leadForm('', '', false) + '</dialog>';
const MKJS = '(function(){var t0=Date.now(),ua=navigator.userAgent||"",bot=navigator.webdriver||/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(ua);var r=document.referrer,h="";try{h=r?new URL(r).hostname.replace(/^www\\./,""):""}catch(x){}var Bn=!h?"direct":h===location.hostname.replace(/^www\\./,"")?"intern":/(^|\\.)google\\./.test(h)?"google":/bing\\.|duckduckgo/.test(h)?"bing":/chatgpt|openai|perplexity|copilot|gemini|claude/.test(h)?"ai":"overig";var P=document.body.getAttribute("data-pl")||"",S=document.body.getAttribute("data-s")||"";'
  + 'function sid(){try{var s=localStorage.getItem("kzsid");if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem("kzsid",s)}return s}catch(e){return ""}}'
  + 'function tik(e,pl,s){if(bot)return;try{navigator.sendBeacon("/api/keuze-tools?tool=huis&op=tik",new Blob([JSON.stringify({e:e,pl:pl,s:s,b:Bn})],{type:"text/plain"}))}catch(x){}}tik("zie",P||"hub",S);'
  + 'var D=document.getElementById("mkd");document.addEventListener("click",function(e){if(!e.target.closest)return;if(D&&(e.target===D||e.target.closest(".mkx"))){D.close();return}var a=e.target.closest("[data-t]");if(!a)return;var t=a.getAttribute("data-t"),s=a.getAttribute("data-s")||S,pl=a.getAttribute("data-pl")||P;tik(t,pl,s);'
  + 'if(t==="offerte"&&D&&D.showModal&&!document.getElementById("aanvraag")){e.preventDefault();var f=D.querySelector("form");f.elements.pl.value=pl;f.elements.s.value=s;document.getElementById("mkdh").textContent="Aanvraag bij "+(a.getAttribute("data-n")||"dit kantoor");[].forEach.call(f.querySelectorAll("fieldset,label,button[type=submit],p.bron"),function(x){x.hidden=false});f.querySelector(".mko").hidden=true;D.showModal()}else if(t==="offerte"&&document.getElementById("aanvraag")){e.preventDefault();document.getElementById("aanvraag").scrollIntoView({behavior:"smooth",block:"start"})}},true);'
  + 'document.addEventListener("submit",function(e){var f=e.target;if(!f.hasAttribute||!f.hasAttribute("data-lead"))return;e.preventDefault();var o=f.querySelector(".mko"),b=f.querySelector("button[type=submit]"),d={};[].forEach.call(f.elements,function(x){if(!x.name)return;if(x.type==="radio"&&!x.checked)return;if(x.type==="checkbox"){d[x.name]=x.checked?"1":"";return}d[x.name]=x.value});d.ms=Date.now()-t0;d.sid=sid();b.disabled=true;'
  + 'fetch("/api/keuze-tools?tool=huis&op=lead",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d)}).then(function(r){return r.json()}).then(function(j){o.hidden=false;o.textContent=j.tekst||"Dank je.";if(j.ok)[].forEach.call(f.querySelectorAll("fieldset,label,button[type=submit],p.bron"),function(x){x.hidden=true});b.disabled=false}).catch(function(){o.hidden=false;o.textContent="Dat lukte niet. Probeer het nog eens.";b.disabled=false})},true);'
  + 'var L=document.getElementById("zl"),FB=document.querySelector(".fl");if(L&&FB){var F={};FB.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var f=b.dataset.f,on=b.getAttribute("aria-pressed")!=="true";if(f==="dicht"){if(!on||!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(function(p){var c=p.coords;[].slice.call(L.children).map(function(li){var dl=li.dataset.lat-c.latitude,dn=(li.dataset.lon-c.longitude)*0.6;li._d=dl*dl+dn*dn;return li}).sort(function(x,y){return x._d-y._d}).forEach(function(li){L.appendChild(li)});b.setAttribute("aria-pressed","true")});return}b.setAttribute("aria-pressed",on?"true":"false");F[f]=on;[].forEach.call(L.children,function(li){li.hidden=(F.open&&li.dataset.open!=="1")||(F.web&&li.dataset.web!=="1")})})}'
  + '})();';
const chat = (pl, term, faq, mening) => kzuxBlok({ alleenChat: true, kop: 'Vraag het de keuzehulp', taal: 'nl', site: 'kzuxhuis', slug: 'makelaar-' + pl, term, shop: '', prods: [], opties: [], faq: faq.map(([q, a]) => ({ q, a })), mening });
const faqBlok = faq => faq.map(([q, a]) => '<details class="faq"><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('');
const faqLd = faq => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const kruim = l => ({ '@type': 'BreadcrumbList', itemListElement: l.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: B + u })) });
function knoppen(pl, x, kort) {
  const at = t => ' data-t="' + t + '" data-pl="' + esc(pl) + '" data-s="' + esc(x.s) + '"';
  return '<div class="kn"><a class="cta of" href="/makelaar/' + esc(pl) + '/' + esc(x.s) + '#aanvraag"' + at('offerte') + ' data-n="' + esc(x.naam) + '" rel="nofollow">Offerte of gratis waardebepaling</a>' + (x.tel ? '<a class="cta" href="tel:' + esc(telLink(x.tel)) + '"' + at('bel') + '>Bel ' + esc(telTekst(x.tel)) + '</a>' : '') +
    (kort === true ? '' : (x.web ? '<a class="cta" href="' + esc(webLink(x.web)) + '" target="_blank" rel="noopener nofollow"' + at('web') + '>Website</a>' : '') + '<a class="cta" href="' + esc(routeLink(x)) + '" target="_blank" rel="noopener nofollow"' + at('route') + '>Route</a>') +
    (kort ? '' : '<a class="mn" href="/makelaar/' + esc(pl) + '/' + esc(x.s) + '?mening=1" rel="nofollow"' + at('mening') + '>Ervaring? Geef je mening</a>') + '</div>';
}
const revTekst = r => r.platform + ' ' + (r.max === 5 ? komma(r.score) : komma(r.score) + '/' + r.max) + ' (' + r.aantal + ' reviews)';
function badges(r) {
  const { sc, mn } = r, b = [];
  if (sc && sc.lid && sc.lid.length) b.push('Lid ' + sc.lid.join(', '));
  if (sc && sc.prijs && sc.prijs.length) b.push('Prijs op site: ' + sc.prijs.map(p => p.tekst).join(', '));
  ((sc && sc.rev) || []).forEach(z => b.push(revTekst(z)));
  if (mn) b.push(komma(mn.gem) + ' uit ' + mn.n + ' meningen');
  return b.length ? '<div class="mk-bd">' + b.map(t => '<span>' + esc(t) + '</span>').join('') + '</div>' : '';
}
function waarom(r, plek) {
  const { x, sc, mn, q } = r, l = [], mis = [], gecheckt = sc && sc.t && !sc.fout;
  const geg = [x.adres && 'adres', x.tel && 'telefoon', x.web && 'website', rooster(x.uren) && 'openingstijden'].filter(Boolean);
  if (q.p.gegevens) l.push('Gegevens: ' + q.p.gegevens + ' van 20 (' + lijstNL(geg) + ')');
  if (q.p.lid) l.push('Lid van ' + lijstNL(sc.lid) + ' volgens de eigen site (gecontroleerd ' + datumKort(sc.t) + '): 20 van 20');
  else mis.push(gecheckt ? 'lidmaatschap van NVM, VBO of Vastgoedpro (niet op de site gevonden, ' + datumKort(sc.t) + ')' : x.web ? 'lidmaatschap (de site is nog niet nagekeken)' : 'lidmaatschap (geen website bekend)');
  if (q.p.prijs) l.push('Prijs op de eigen site (' + sc.prijs.map(p => p.tekst).join(', ') + '): 15 van 15'); else if (gecheckt) mis.push('prijs (niet op de site gevonden)');
  if (q.p.reviews || q.nrev) l.push('Reviews: ' + sc.rev.map(revTekst).join(', ') + ', samen ' + komma(q.gem5) + ' van 5: ' + q.p.reviews + ' van 30'); else if (gecheckt) mis.push('reviews (geen cijfer gevonden op Klantenvertellen, Kiyoh, Feedback Company of Trustpilot)');
  if (mn) l.push('Meningen van bezoekers: ' + komma(mn.gem) + ' uit ' + mn.n + ': ' + q.p.meningen + ' van 15');
  return '<details class="why"><summary>Waarom plek ' + plek + '? ' + q.tot + ' punten</summary><ul>' + l.map(t => '<li>' + esc(t) + '</li>').join('') + (mis.length ? '<li>' + esc('Geen punten voor ' + lijstNL(mis)) + '</li>' : '') + '</ul></details>';
}
function wegingTabel() {
  return '<table class="mk-w"><thead><tr><th>Wat we meten</th><th>Punten</th><th>Hoe en waar vandaan</th></tr></thead><tbody>' + WEGING.map(w => '<tr><td>' + esc(w.naam) + '</td><td>' + w.max + '</td><td>' + esc(w.uitleg.charAt(0).toUpperCase() + w.uitleg.slice(1) + '. Bron: ' + w.bron + '.') + '</td></tr>').join('') + '</tbody></table>' +
    '<p>Samen hoogstens 100 punten. Bij gelijke punten gaat het kantoor met de meeste reviews voor, daarna het kantoor met de meest complete gegevens. Niemand kan een plek kopen: een kantoor stijgt alleen door gegevens aan te vullen, een prijs te noemen, reviews te verzamelen of tevreden klanten. Gegevens aanpassen kan op OpenStreetMap; wij nemen het bij de volgende ronde over. De eigen websites kijken we elke 30 dagen opnieuw na.</p>';
}
async function plaatsInfo() {
  const d = await alleData();
  return d.filter(o => o.x && o.x.n >= MIN).map(o => ({ p: o.p, n: o.x.n }));
}
export async function plaatsLijst() { return (await plaatsInfo()).map(o => ({ naam: o.p.naam, href: '/makelaar/' + o.p.slug, n: o.n })).sort((a, b) => a.naam.localeCompare(b.naam, 'nl')); }
async function pakket(slug) { const [x0, sc, mn] = await Promise.all([data(slug), scans(slug), meningen(slug)]); if (!x0 || !x0.items.length) return null; return { x0, rij: rang(x0.items, sc, mn) }; }

// FAQ per plaats, alleen met antwoorden uit onze eigen gegevens (en de algemene vragen uit makelaarTekst)
function plaatsFaq(p, rij, t) {
  const mt = makelaarTekst(p.naam), f = [], top = rij.slice(0, 3);
  f.push(['Wat is de beste makelaar in ' + p.naam + '?', 'Volgens de Keuzehulp-score van ' + datumKort(t) + ': ' + top.map((r, i) => (i + 1) + '. ' + r.x.naam + ' (' + r.q.tot + ' punten)').join(', ') + '. De score telt complete gegevens, lidmaatschap van NVM, VBO of Vastgoedpro, een prijs op de eigen site, reviews op andere platforms en meningen van bezoekers. Bij elk kantoor staat waarom het op die plek staat.']);
  const vast = rij.flatMap(r => ((r.sc && r.sc.prijs) || []).filter(z => z.soort === 'vast').map(z => ({ v: z.v, n: r.x.naam }))).sort((a, b) => a.v - b.v);
  const ct = rij.flatMap(r => ((r.sc && r.sc.prijs) || []).filter(z => z.soort === 'courtage').map(z => z.v)).sort((a, b) => a - b);
  const aank = rij.flatMap(r => ((r.sc && r.sc.prijs) || []).filter(z => z.soort === 'aankoop').map(z => ({ v: z.v, n: r.x.naam }))).sort((a, b) => a.v - b.v);
  const eur = v => '€ ' + v.toLocaleString('nl-NL');
  if (vast.length >= 3 || ct.length >= 3) f.push(['Wat kost een makelaar in ' + p.naam + '?', (vast.length >= 3 ? vast.length + ' kantoren in ' + p.naam + ' noemen een vaste prijs op hun eigen site, van ' + eur(vast[0].v) + ' tot ' + eur(vast[vast.length - 1].v) + '. ' : '') + (ct.length >= 3 ? ct.length + ' kantoren noemen courtage, van ' + komma(ct[0], 2).replace(/,?0+$/, '') + '% tot ' + komma(ct[ct.length - 1], 2).replace(/,?0+$/, '') + '% van de verkoopprijs. ' : '') + 'Zo stond het op hun sites bij onze laatste controle. Vraag altijd een prijs op papier en kijk wat erbij zit.']);
  else f.push(mt.faq.find(z => /^Wat kost/.test(z[0])));
  if (aank.length >= 2) f.push(['Wat kost een aankoopmakelaar in ' + p.naam + '?', aank.length + ' kantoren noemen een prijs voor aankoopbegeleiding op hun eigen site, vanaf ' + eur(aank[0].v) + ' (' + aank[0].n + '). Vraag wat erbij zit, zoals bezichtigingen, het bod en de bouwkundige keuring.']);
  const nvm = rij.filter(r => r.sc && r.sc.lid && r.sc.lid.includes('NVM')), gecheckt = rij.filter(r => r.sc && r.sc.t && !r.sc.fout).length;
  if (nvm.length >= 2) f.push(['Welke makelaars in ' + p.naam + ' zijn lid van de NVM?', nvm.length + ' van de ' + gecheckt + ' kantoren waarvan we de site nakeken, noemen op hun eigen site dat ze lid zijn van de NVM, onder meer ' + lijstNL(nvm.slice(0, 5).map(r => r.x.naam)) + '. Controleer het lidmaatschap ook bij de NVM zelf.']);
  mt.faq.filter(z => !/^Wat kost/.test(z[0])).forEach(z => f.push(z));
  return f.filter(Boolean);
}
function buren(p, info) { return info.filter(o => o.p.slug !== p.slug).map(o => ({ o, km: afstand({ lat: p.c[0], lon: p.c[1] }, { lat: o.p.c[0], lon: o.p.c[1] }) })).sort((a, b) => a.km - b.km).slice(0, 4).map(({ o }) => '<a href="/makelaar/' + o.p.slug + '">Makelaar ' + esc(o.p.naam) + '</a>'); }
function agentLd(pl, r) {
  const { x, sc } = r, id = B + '/makelaar/' + pl + '/' + x.s + '#zaak';
  return { '@type': 'RealEstateAgent', '@id': id, name: x.naam, url: x.web ? webLink(x.web) : B + '/makelaar/' + pl + '/' + x.s, telephone: x.tel ? telLink(x.tel) : undefined,
    address: x.adres ? { '@type': 'PostalAddress', streetAddress: x.adres, postalCode: x.pc || undefined, addressLocality: x.plaats, addressCountry: 'NL' } : { '@type': 'PostalAddress', addressLocality: x.plaats, addressCountry: 'NL' },
    geo: { '@type': 'GeoCoordinates', latitude: x.lat, longitude: x.lon }, openingHours: rooster(x.uren) ? x.uren : undefined, areaServed: { '@type': 'City', name: P[pl].naam },
    memberOf: sc && sc.lid && sc.lid.length ? sc.lid.map(n => ({ '@type': 'Organization', name: n })) : undefined };
}

// ---------- /makelaar ----------
export async function hub() {
  const info = await plaatsInfo(), tops = await Promise.all(info.map(async o => { const k = await pakket(o.p.slug); return { o, r: k && k.rij[0] }; }));
  const rij = tops.sort((a, b) => b.o.p.vraag - a.o.p.vraag), tot = info.reduce((a, o) => a + o.n, 0), mt = makelaarTekst('jouw plaats');
  const faq = [['Hoe rangschikt keuzehulp.best makelaars?', 'Met de Keuzehulp-score van 0 tot 100: complete gegevens (20), lid van NVM, VBO of Vastgoedpro (20), een prijs op de eigen site (15), reviews op Klantenvertellen, Kiyoh, Feedback Company en Trustpilot (30) en de meningen van bezoekers vanaf 3 meningen (15). Niemand betaalt voor een plek.']].concat(mt.faq);
  const body = '<p class="crumbs"><a href="/">keuzehulp.best</a> › <a href="/huis-kopen">Huis kopen</a> › Makelaar</p><h1>Makelaar vergelijken: de beste makelaar per plaats</h1>' + chat('hub', 'makelaar', faq) +
    '<div class="answer"><p>We vergeleken ' + tot + ' makelaars in ' + rij.length + ' gemeenten met de Keuzehulp-score: gegevens, lidmaatschap van NVM, VBO of Vastgoedpro, prijs op de eigen site, reviews op andere platforms en meningen van bezoekers. Bij elk kantoor vraag je in één tik een offerte of gratis waardebepaling aan.</p></div>' +
    '<ul class="cards">' + rij.map(({ o, r }) => '<li><a href="/makelaar/' + o.p.slug + '">Makelaar ' + esc(o.p.naam) + '</a><span>' + o.n + ' kantoren' + (r ? ', nummer 1: ' + esc(r.x.naam) : '') + '</span></li>').join('') + '</ul>' +
    '<h2>Zo rangschikken we</h2>' + wegingTabel() + '<h2>Zo kies je een makelaar</h2><ul>' + mt.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul><p class="bron">Titel makelaar: <a href="' + esc(BRON_KB[1]) + '" target="_blank" rel="noopener nofollow">' + esc(BRON_KB[0]) + '</a>.</p><p><a href="/huis-kopen">Huis kopen: kosten koper, hypotheek en bedenktijd</a></p><h2>Vragen</h2>' + faqBlok(faq);
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'CollectionPage', name: 'Makelaar vergelijken per plaats', url: B + '/makelaar', inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] }, hasPart: rij.map(({ o }) => ({ '@type': 'WebPage', name: 'Makelaar ' + o.p.naam, url: B + '/makelaar/' + o.p.slug })) }, kruim([['keuzehulp.best', '/'], ['Huis kopen', '/huis-kopen'], ['Makelaar', '/makelaar']]), faqLd(faq)] };
  return doc({ titel: 'Makelaar vergelijken: de beste makelaar in ' + rij.length + (rij.length === 1 ? ' stad' : ' steden'), desc: ('Vergelijk ' + tot + ' makelaars in ' + rij.slice(0, 6).map(({ o }) => o.p.naam).join(', ') + ' en meer op lidmaatschap, prijs, reviews en meningen. Gratis offerte per kantoor.').slice(0, 155), pad: '/makelaar', body, schema, noindex: !rij.length, pl: 'hub' });
}

// ---------- /makelaar/<plaats> ----------
export async function plaatsPagina(slug) {
  const p = P[slug]; if (!p) return null; const k = await pakket(slug); if (!k) return null; const { x0, rij } = k;
  const nu = new Date(), info = await plaatsInfo(), gecheckt = rij.filter(r => r.sc && r.sc.t).length, faq = plaatsFaq(p, rij, x0.t), top = rij.slice(0, 3);
  const h1 = 'Beste makelaar in ' + p.naam + ': ' + rij.length + ' kantoren vergeleken';
  const open = r => { const s = status(rooster(r.x.uren), nu); return s; };
  const groot = (r, i) => { const s = open(r), x = r.x; return '<li data-open="' + (s && s.open ? 1 : 0) + '" data-web="' + (x.web ? 1 : 0) + '" data-lat="' + x.lat + '" data-lon="' + x.lon + '"><span class="n">' + (i + 1) + '. <a href="/makelaar/' + slug + '/' + esc(x.s) + '">' + esc(x.naam) + '</a></span><span class="mk-sc"><b>' + r.q.tot + '</b> punten Keuzehulp-score</span>' + badges(r) + (x.adres ? '<span class="w">' + esc(x.adres + (x.pc ? ', ' + x.pc : '')) + '</span>' : '') + (s ? '<span class="nu' + (s.open ? '' : ' dicht') + '"><i></i>' + esc(statusTekst(s)) + '</span>' : '') + knoppen(slug, x) + waarom(r, i + 1) + '</li>'; };
  const klein = (r, i) => { const s = open(r), x = r.x; return '<li class="mk-rest" data-open="' + (s && s.open ? 1 : 0) + '" data-web="' + (x.web ? 1 : 0) + '" data-lat="' + x.lat + '" data-lon="' + x.lon + '"><span class="n">' + (i + 1) + '. <a href="/makelaar/' + slug + '/' + esc(x.s) + '">' + esc(x.naam) + '</a> · ' + r.q.tot + ' punten</span>' + (x.adres ? '<span class="w">' + esc(x.adres) + '</span>' : '') + knoppen(slug, x, true) + '</li>'; };
  const li = rij.map((r, i) => i < 30 ? groot(r, i) : klein(r, i)).join('');
  const filter = '<div class="fl"><button type="button" data-f="open" aria-pressed="false">Nu open</button><button type="button" data-f="web" aria-pressed="false">Met website</button><button type="button" data-f="dicht" aria-pressed="false">Dichtbij mij</button></div>';
  const ander = buren(p, info), alle = info.filter(o => o.p.slug !== slug).map(o => '<a href="/makelaar/' + o.p.slug + '">' + esc(o.p.naam) + '</a>');
  const body = '<p class="crumbs"><a href="/huis-kopen">Huis kopen</a> › <a href="/makelaar">Makelaar</a> › ' + esc(p.naam) + '</p><h1>' + esc(h1) + '</h1>' +
    '<div class="answer lead"><p><strong>Top 3 makelaars in ' + esc(p.naam) + '</strong> volgens de Keuzehulp-score (' + esc(datumKort(x0.t)) + '): ' + top.map((r, i) => (i + 1) + '. ' + esc(r.x.naam) + ' (' + r.q.tot + ' punten)').join(', ') + '. We vergeleken alle ' + rij.length + ' kantoren in de gemeente op gegevens, lidmaatschap van NVM, VBO of Vastgoedpro, prijs op de eigen site, reviews op andere platforms en meningen van bezoekers' + (gecheckt < rij.length ? '; van ' + gecheckt + ' kantoren is de eigen site al nagekeken' : '') + '.</p></div>' +
    '<ol class="top3 lead">' + top.map((r, i) => '<li><span class="n">' + (i + 1) + '. <a href="/makelaar/' + slug + '/' + esc(r.x.s) + '">' + esc(r.x.naam) + '</a></span><span class="mk-sc"><b>' + r.q.tot + '</b> punten</span>' + badges(r) + knoppen(slug, r.x, true) + '</li>').join('') + '</ol>' +
    chat(slug, 'makelaar ' + p.naam, faq) +
    '<h2>Alle ' + rij.length + ' makelaars in ' + esc(p.naam) + ' op volgorde</h2>' + filter + '<ul class="zaken" id="zl">' + li + '</ul>' +
    '<h2>Zo rangschikken we: de Keuzehulp-score</h2>' + wegingTabel() +
    '<h2>Zo kies je een makelaar in ' + esc(p.naam) + '</h2><ul>' + makelaarTekst(p.naam).tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul><p class="bron">Titel makelaar: <a href="' + esc(BRON_KB[1]) + '" target="_blank" rel="noopener nofollow">' + esc(BRON_KB[0]) + '</a>.</p>' +
    '<h2>Huis kopen in ' + esc(p.naam) + '?</h2><p>Wat je betaalt bovenop de koopsom, de startersvrijstelling, NHG en de bedenktijd: <a href="/huis-kopen">huis kopen in 7 stappen</a>. Wat je kunt lenen: <a href="/hypotheek-berekenen">hypotheek berekenen</a> en de <a href="/hypotheekrente">hypotheekrente van nu</a>. Na de koop: <a href="/verzekeringen">opstal- en inboedelverzekering</a> en <a href="/energieleverancier-vergelijken">energieleverancier</a>.</p>' +
    '<h2>Vragen over makelaars in ' + esc(p.naam) + '</h2>' + faqBlok(faq) + (ander.length ? '<p class="rel">In de buurt: ' + ander.join(' · ') + '</p>' : '') + (alle.length ? '<p class="rel">Alle steden: ' + alle.join(', ') + '</p>' : '') +
    '<p class="bron">Kantoren uit OpenStreetMap, bijgewerkt <time datetime="' + x0.t.slice(0, 10) + '">' + esc(datumNL(x0.t)) + '</time>.</p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG,
    { '@type': 'WebPage', '@id': B + '/makelaar/' + slug, url: B + '/makelaar/' + slug, name: h1, inLanguage: 'nl-NL', dateModified: x0.t, publisher: { '@id': ORG['@id'] }, mainEntity: { '@id': B + '/makelaar/' + slug + '#lijst' } },
    { '@type': 'ItemList', '@id': B + '/makelaar/' + slug + '#lijst', name: 'Beste makelaars in ' + p.naam + ' volgens de Keuzehulp-score', itemListOrder: 'https://schema.org/ItemListOrderDescending', numberOfItems: rij.length, itemListElement: rij.slice(0, 50).map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: B + '/makelaar/' + slug + '/' + r.x.s, item: agentLd(slug, r) })) },
    kruim([['Huis kopen', '/huis-kopen'], ['Makelaar', '/makelaar'], [p.naam, '/makelaar/' + slug]]), faqLd(faq)] };
  const t1 = 'Makelaar ' + p.naam + ': de beste van ' + rij.length + ' kantoren vergeleken';
  return doc({ titel: t1.length <= 60 ? t1 : 'Makelaar ' + p.naam + ': ' + rij.length + ' kantoren vergeleken', desc: ('Beste makelaar in ' + p.naam + ': ' + top.map(r => r.x.naam).join(', ') + '. Alle ' + rij.length + ' kantoren op lidmaatschap, prijs en reviews. Gratis offerte of waardebepaling.').slice(0, 155), pad: '/makelaar/' + slug, body, schema, noindex: rij.length < MIN, pl: slug });
}

// ---------- /makelaar/<plaats>/<kantoor> ----------
export async function zaakPagina(slug, s) {
  const p = P[slug]; if (!p) return null; const k = await pakket(slug); if (!k) return null; const { x0, rij } = k;
  const plek = rij.findIndex(r => r.x.s === s); if (plek < 0) return null; const r = rij[plek], x = r.x;
  const R = rooster(x.uren), st = status(R), dicht = rij.filter(z => z.x.s !== s).map(z => ({ z, km: afstand(x, z.x) })).sort((a, b) => a.km - b.km).slice(0, 4), mt = makelaarTekst(p.naam);
  const feiten = [x.adres ? 'Adres: ' + x.adres + (x.pc ? ', ' + x.pc : '') + ' ' + x.plaats : '', x.tel ? 'Telefoon: ' + telTekst(x.tel) : '', x.web ? 'Website: ' + webTekst(x.web) : '', x.rolstoel === 'yes' ? 'Rolstoeltoegankelijk' : ''].filter(Boolean);
  const faq = [['Hoe goed is ' + x.naam + ' in ' + p.naam + '?', x.naam + ' staat op plek ' + (plek + 1) + ' van ' + rij.length + ' makelaars in ' + p.naam + ' met ' + r.q.tot + ' van 100 punten in de Keuzehulp-score.' + (r.sc && r.sc.lid && r.sc.lid.length ? ' Volgens de eigen site is het kantoor lid van ' + lijstNL(r.sc.lid) + '.' : '') + (r.q.nrev ? ' Reviews: ' + r.sc.rev.map(revTekst).join(', ') + '.' : '') + (r.mn ? ' Bezoekers geven gemiddeld ' + komma(r.mn.gem) + ' van 5 (' + r.mn.n + ' meningen). ' + r.mn.zin : '')]]
    .concat(r.sc && r.sc.prijs && r.sc.prijs.length ? [['Wat kost ' + x.naam + '?', 'Op de eigen site noemde het kantoor bij onze controle van ' + datumKort(r.sc.t) + ': ' + r.sc.prijs.map(z => z.tekst).join(' en ') + '. Vraag de prijs op papier en wat erbij zit.']] : [])
    .concat(mt.faq.slice(0, 2));
  const mening = { u: '/api/keuze-tools?tool=huis&op=mening', pl: slug, s, label: 'Ervaring met ' + x.naam.slice(0, 40) + '? ★★★★★' };
  const wieZegt = (r.sc && r.sc.rev && r.sc.rev.length ? '<h2>Reviews op andere platforms</h2><ul>' + r.sc.rev.map(z => '<li><a href="' + esc(z.url) + '" target="_blank" rel="noopener nofollow">' + esc(z.platform) + '</a>: ' + esc((z.max === 5 ? komma(z.score) : komma(z.score) + '/' + z.max) + ' uit ' + z.aantal + ' reviews') + ' (gelezen ' + esc(datumKort(r.sc.t)) + ')</li>').join('') + '</ul>' : '') +
    (r.mn ? '<h2>Wat bezoekers vinden</h2><p><strong>' + komma(r.mn.gem) + ' van 5</strong> uit ' + r.mn.n + ' meningen in onze chat. ' + esc(r.mn.zin) + ' We tonen alleen de rode draad van alle meningen samen, nooit een losse mening.</p>' : '');
  const body = '<p class="crumbs"><a href="/makelaar">Makelaar</a> › <a href="/makelaar/' + slug + '">' + esc(p.naam) + '</a></p><h1>' + esc(x.naam) + '</h1><div class="lead mk-kop"><p>Makelaar in ' + esc(p.naam) + ' · plek ' + (plek + 1) + ' van ' + rij.length + '</p>' +
    '<p class="mk-sc"><b>' + r.q.tot + '</b> punten Keuzehulp-score</p>' + badges(r) + (st ? '<p class="nu' + (st.open ? '' : ' dicht') + '"><i></i>' + esc(statusTekst(st)) + '</p>' : '') + knoppen(slug, x, 'zaak') + '</div>' +
    chat(slug, 'makelaar ' + p.naam, faq, mening) +
    '<h2>Offerte of gratis waardebepaling bij ' + esc(x.naam) + '</h2>' + leadForm(slug, s, true) +
    '<h2>Waarom plek ' + (plek + 1) + '?</h2>' + waarom(r, plek + 1).replace('<details class="why">', '<details class="why" open>') + wieZegt +
    '<h2>Gegevens</h2><ul class="feit">' + feiten.map(f => '<li>' + esc(f) + '</li>').join('') + (R ? '<li>' + weekRegels(R).map(esc).join('<br>') + '</li>' : x.uren ? '<li>Openingstijden: ' + esc(x.uren) + '</li>' : '') + '</ul>' +
    '<h2>Vraag dit voor je kiest</h2><ul>' + mt.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
    (dicht.length ? '<h2>Andere makelaars dichtbij</h2><ul class="zaken">' + dicht.map(({ z, km }) => '<li><span class="n"><a href="/makelaar/' + slug + '/' + esc(z.x.s) + '">' + esc(z.x.naam) + '</a> · ' + z.q.tot + ' punten</span><span class="w">' + (km < 1 ? Math.round(km * 1000) + ' m' : komma(km)) + (km < 1 ? '' : ' km') + (z.x.adres ? ' · ' + esc(z.x.adres) : '') + '</span>' + knoppen(slug, z.x, true) + '</li>').join('') + '</ul>' : '') +
    '<h2>Vragen over ' + esc(x.naam) + '</h2>' + faqBlok(faq) +
    '<p class="rel"><a href="/makelaar/' + slug + '">Alle ' + rij.length + ' makelaars in ' + esc(p.naam) + ' op volgorde</a> · <a href="/huis-kopen">Huis kopen in 7 stappen</a> · <a href="' + esc(osmLink(x)) + '" rel="nofollow">Gegevens aanpassen op OpenStreetMap</a></p>';
  const lb = agentLd(slug, r);
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: B + '/makelaar/' + slug + '/' + s, name: x.naam, dateModified: x0.t, inLanguage: 'nl-NL', publisher: { '@id': ORG['@id'] }, about: { '@id': lb['@id'] } }, lb, kruim([['Makelaar', '/makelaar'], [p.naam, '/makelaar/' + slug], [x.naam, '/makelaar/' + slug + '/' + s]]), faqLd(faq)] };
  const t1 = x.naam + ': makelaar ' + p.naam + ', score en offerte';
  return doc({ titel: t1.length <= 60 ? t1 : x.naam.slice(0, 38) + ', makelaar ' + p.naam, desc: (x.naam + ' in ' + p.naam + ': plek ' + (plek + 1) + ' van ' + rij.length + ' met ' + r.q.tot + ' punten. ' + (x.adres ? x.adres + ', ' : '') + 'telefoon, tijden en gratis offerte of waardebepaling.').slice(0, 155), pad: '/makelaar/' + slug + '/' + s, body, schema, noindex: r.q.p.gegevens < 10 || x0.items.length < MIN, pl: slug, s });
}

// ---------- sitemap, chat, llms.txt, stand ----------
export async function sitemapUrls() {
  const urls = [], d = await alleData(); if (d.some(o => o.x && o.x.n >= MIN)) urls.push(B + '/makelaar');
  for (const { p, x } of d) { if (!x || x.n < MIN) continue; urls.push(B + '/makelaar/' + p.slug); x.items.forEach(i => { if ((i.adres ? 5 : 0) + (i.tel ? 5 : 0) + (i.web ? 5 : 0) + (rooster(i.uren) ? 5 : 0) >= 10) urls.push(B + '/makelaar/' + p.slug + '/' + i.s); }); }
  return urls;
}
export async function chatItems() {
  const info = await plaatsInfo(), nu = new Date(), mtA = makelaarTekst('jouw plaats'), uit = [];
  const lijst = info.map(o => 'makelaar-' + o.p.slug + ' (' + o.p.naam + ', ' + o.n + ' makelaars)').join(', ');
  uit.push({ slug: 'makelaar', pad: '/makelaar', term: 'makelaar', title: 'Makelaar vergelijken per plaats', kort: 'Makelaars per plaats op volgorde van de Keuzehulp-score, met gratis offerte of waardebepaling per kantoor.', uitleg: 'Keuzehulp-score: ' + WEGING.map(w => w.naam + ' ' + w.max + ' punten (' + w.uitleg + ')').join('; ') + '. ' + mtA.tips.join(' ') + ' Plaatsen (slug): ' + lijst + '.', faq: mtA.faq.map(([q, a]) => ({ q, a })) });
  for (const o of info) { const k = await pakket(o.p.slug); if (!k) continue; const f = plaatsFaq(o.p, k.rij, k.x0.t);
    uit.push({ slug: 'makelaar-' + o.p.slug, pad: '/makelaar/' + o.p.slug, term: 'makelaar ' + o.p.naam.toLowerCase(), title: 'Beste makelaar in ' + o.p.naam,
      kort: 'Alle ' + k.rij.length + ' makelaars in ' + o.p.naam + ' op volgorde van de Keuzehulp-score (gegevens, NVM/VBO/Vastgoedpro, prijs op de site, reviews, meningen van bezoekers). Bij elk kantoor een knop voor een gratis offerte of waardebepaling.',
      uitleg: 'Ranglijst (plek, naam, punten, wat telt, adres, telefoon, nu): ' + k.rij.slice(0, 40).map((r, i) => { const s = status(rooster(r.x.uren), nu), b = []; if (r.sc && r.sc.lid && r.sc.lid.length) b.push('lid ' + r.sc.lid.join('/')); if (r.sc && r.sc.prijs && r.sc.prijs.length) b.push('prijs ' + r.sc.prijs.map(z => z.tekst).join(', ')); ((r.sc && r.sc.rev) || []).forEach(z => b.push(revTekst(z))); if (r.mn) b.push('bezoekers ' + komma(r.mn.gem) + '/5 uit ' + r.mn.n + ': ' + r.mn.zin); return (i + 1) + '. ' + r.x.naam + ' (' + r.q.tot + ' punten' + (b.length ? '; ' + b.join('; ') : '') + ')' + (r.x.adres ? ', ' + r.x.adres : '') + (r.x.tel ? ', tel ' + telTekst(r.x.tel) : '') + (s ? ', ' + statusTekst(s) : ''); }).join(' | ') + '. Wil de bezoeker een offerte of waardebepaling, wijs dan de knop bij het kantoor op deze pagina aan. Voor kosten koper, hypotheek en bedenktijd: huis-kopen.',
      faq: f.map(([q, a]) => ({ q, a })) }); }
  return uit;
}
export async function llmsDeel() {
  const info = await plaatsInfo(); if (!info.length) return '';
  return '\n- [Makelaar vergelijken per plaats](' + B + '/makelaar): makelaars op volgorde van de Keuzehulp-score (gegevens 20, lid NVM/VBO/Vastgoedpro 20, prijs op de eigen site 15, reviews op Klantenvertellen, Kiyoh, Feedback Company en Trustpilot 30, meningen van bezoekers 15), met per kantoor waarom het op die plek staat.\n' +
    info.sort((a, b) => b.p.vraag - a.p.vraag).map(o => '- [Beste makelaar in ' + o.p.naam + '](' + B + '/makelaar/' + o.p.slug + '): alle ' + o.n + ' makelaars in de gemeente ' + o.p.naam + ' vergeleken, met de top 3, kosten en gratis offerte per kantoor.').join('\n');
}
export async function stand() {
  const d = await alleData(), lp = await kv.raw(['HGETALL', 'hk:leadp']).catch(() => []) || [], ln = await kv.raw(['HGETALL', 'hk:leadn']).catch(() => []) || [];
  const paar = h => { if (!Array.isArray(h)) return h || {}; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[h[i]] = Number(h[i + 1]) || 0; return o; };
  const LP = paar(lp), LN = paar(ln), dagen = [];
  for (let i = 0; i < 7; i++) { const dg = dagIso(Date.now() - i * 864e5); dagen.push({ dag: dg, ...paar(await kv.raw(['HGETALL', 'hk:tikd:' + dg]).catch(() => [])), leads: paar(await kv.raw(['HGETALL', 'hk:leadd:' + dg]).catch(() => [])), meningen: paar(await kv.raw(['HGETALL', 'hk:mnd:' + dg]).catch(() => [])) }); }
  const plaatsen = [];
  for (const { p, x } of d) { const sc = x ? await scans(p.slug) : {}, mn = x ? await meningen(p.slug) : {}, w = x ? x.items.filter(i => i.web) : [];
    plaatsen.push({ plaats: p.slug, vraag: p.vraag, n: x ? x.n : 0, bron: x ? x.bron || 'overpass' : null, bijgewerkt: x ? x.t : null, metWebsite: w.length, gescand: w.filter(i => sc[i.s]).length, lid: Object.values(sc).filter(z => z.lid && z.lid.length).length, prijs: Object.values(sc).filter(z => z.prijs && z.prijs.length).length, reviews: Object.values(sc).filter(z => z.rev && z.rev.length).length, meningen: Object.values(mn).reduce((a, l) => a + l.length, 0), metConsensus: Object.values(mn).filter(l => consensus(l)).length, leads: LP[p.slug] || 0 }); }
  const perKantoor = Object.entries(LN).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, n]) => ({ kantoor: k, n }));
  return { ok: true, uitleg: 'Makelaars per plaats (lib/makelaar.js): kantoren uit OpenStreetMap, Keuzehulp-score (gegevens 20, lid 20, prijs 15, reviews 30, meningen 15), aanvragen per kantoor (alleen tellers; gegevens op de beschermde host met op=leads).', plaatsen, leads: { totaal: Object.values(LP).reduce((a, b) => a + b, 0), perPlaats: LP, perKantoor }, dagen };
}
