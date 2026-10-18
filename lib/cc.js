// Creator Connections, dagelijks testen (Henkjan 18 okt 2026).
//
// Wat dit doet, elke ochtend in de cloud:
//   1. loopt de Creator Connections-aanbiedingen langs die we kennen (geaccepteerd of nog open);
//   2. vraagt per zoekterm de Keepa-cijfers op via Demand Radar (echte Amazon-verkopen per maand,
//      groei tegen vorig jaar, piekmaand) - dus geen gok, maar wat er werkelijk verkocht wordt;
//   3. rekent de opbrengstcheck: verwachte opbrengst per klik tegen onze klikprijs. Haalt een
//      aanbieding die niet, dan gaat hij niet live, hoe hoog de EPC ook is;
//   4. kiest de beste paar om vandaag te testen en zet ze klaar als campagnevoorstel met kant-en-
//      klare /go-link (Clickmind ertussen, eigen voorvoegsel ccus zodat remarketing en zones per
//      CC-campagne te volgen zijn);
//   5. houdt bij wat gisteren getest is en wat het opleverde, zodat de lijst zichzelf opschoont.
//
// Wat dit NIET doet: op Accept klikken. Creator Connections heeft geen API; accepteren kan alleen
// in de ingelogde pagina. De dagtaak zet daarom een accepteerwachtrij klaar (op=wachtrij) die een
// browsersessie of Henkjan zelf in een paar tikken afwerkt. Nooit stilzwijgend "automatisch
// aangemeld" melden wat niet aangemeld is.
//
// Invoer van de lijst (de browsersessie die Creator Connections leest):
//   POST /api/mm/cc?op=zet  (beschermde host)  body: { soort: 'geaccepteerd'|'open', rijen: [...] }
//   rij: { asin, merk, titel, epc, prijs, reviews, term, status }
//
// Lezen: /api/mm/cc (stand), /api/mm/cc?op=wachtrij (wat geaccepteerd moet worden),
//        /api/mm/cc?op=voorstel (de campagnes van vandaag).

import { kv } from './db.js';

const K = {
  lijst: 'mm:cc:lijst',        // alle bekende aanbiedingen, per asin
  regels: 'mm:cc:regels',      // drempels
  dag: d => 'mm:cc:dag:' + d,  // uitkomst van die dag
  keepa: (t, cc) => 'mm:cc:keepa:' + cc + ':' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
};

export const STANDAARD = {
  deel: 0.15,          // deel van onze /go-kliks dat bij het product zelf uitkomt (rest koopt iets anders: de blanket)
  klikprijs: 0.0025,   // wat een klik ons kost op PropellerAds (US in-page push)
  marge: 2,            // verwachte opbrengst moet minstens 2x de klikprijs zijn
  minVerkoop: 20000,   // Keepa: stuks per maand in die categorie
  minGroei: 1.15,      // Keepa: stuks nu tegen dezelfde maand vorig jaar
  perDag: 3,           // hoeveel CC-campagnes de dagtaak hoogstens voorstelt
  dagbudget: 10        // $ per dag per campagne (harde regel van Henkjan)
};

export async function regels() {
  const r = await kv.get(K.regels).catch(() => null);
  return Object.assign({}, STANDAARD, r && typeof r === 'object' ? r : {});
}

export async function zetRegels(p) {
  const r = await regels(), uit = {};
  for (const k of Object.keys(STANDAARD)) if (p[k] != null && Number.isFinite(Number(p[k]))) uit[k] = Number(p[k]);
  const n = Object.assign({}, r, uit); await kv.set(K.regels, n); return n;
}

// ---------- de lijst met aanbiedingen ----------

const schoonTerm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 +&'-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

// Zoekterm uit een producttitel: de eerste betekenisvolle woorden, zonder merk en zonder ruis.
// Beter is een term die de browsersessie zelf meegeeft (veld term); dit is de terugval.
const RUIS = new Set(['the', 'for', 'and', 'with', 'new', 'pack', 'count', 'ct', 'oz', 'fl', 'size', 'set', 'of', 'free', 'pcs']);
export function termUitTitel(titel, merk) {
  const m = String(merk || '').toLowerCase();
  const w = String(titel || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter(x => x && !RUIS.has(x) && !/^\d+$/.test(x) && !m.split(/\s+/).includes(x));
  return schoonTerm(w.slice(0, 4).join(' '));
}

export async function lees() {
  const l = await kv.get(K.lijst).catch(() => null);
  return l && typeof l === 'object' ? l : {};
}

export async function zet(soort, rijen) {
  const l = await lees(), nu = new Date().toISOString();
  let nieuw = 0, bij = 0;
  for (const r of Array.isArray(rijen) ? rijen : []) {
    const asin = String(r.asin || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    if (!asin) continue;
    const bestond = l[asin];
    l[asin] = Object.assign({}, bestond, {
      asin,
      merk: String(r.merk || (bestond && bestond.merk) || '').slice(0, 60),
      titel: String(r.titel || (bestond && bestond.titel) || '').slice(0, 200),
      epc: Number(r.epc) || (bestond && bestond.epc) || 0,
      prijs: Number(r.prijs) || (bestond && bestond.prijs) || 0,
      reviews: Number(r.reviews) || (bestond && bestond.reviews) || 0,
      soort: soort === 'geaccepteerd' ? 'geaccepteerd' : 'open',
      term: schoonTerm(r.term) || (bestond && bestond.term) || termUitTitel(r.titel || (bestond && bestond.titel), r.merk || (bestond && bestond.merk)),
      gezien: nu
    });
    if (bestond) bij++; else nieuw++;
  }
  await kv.set(K.lijst, l);
  return { nieuw, bij, totaal: Object.keys(l).length };
}

// ---------- Keepa via Demand Radar ----------
// Demand Radar heeft de Keepa-koppeling al (lib/keepa.js daar). Wij vragen alleen het resultaat op,
// zodat de tokens op één plek geteld worden. Uitkomst wordt een dag bewaard.

export async function keepa(term, cc = 'US') {
  const t = schoonTerm(term); if (!t) return null;
  const sl = K.keepa(t, cc);
  const c = await kv.get(sl).catch(() => null);
  if (c && c.at && c.at.slice(0, 10) === new Date().toISOString().slice(0, 10)) return c;
  const basis = process.env.DR_URL || 'https://demandradar-ivory.vercel.app';
  const sleutel = process.env.DR_KEY || '';
  if (!sleutel) return { fout: 'DR_KEY ontbreekt' };
  const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 20000);
  try {
    const r = await fetch(basis + '/api/early?op=keepa&q=' + encodeURIComponent(t) + '&cc=' + encodeURIComponent(cc) + '&key=' + encodeURIComponent(sleutel), { signal: ac.signal });
    const j = await r.json().catch(() => null);
    if (!j || !j.sold) return { fout: 'geen Keepa-cijfers', at: new Date().toISOString() };
    const maanden = Object.keys(j.sold).sort();
    const laatste = maanden[maanden.length - 1], nu = Number(j.sold[laatste]) || 0;
    const jaar = maanden.find(m => m === vorigJaar(laatste));
    const toen = jaar ? Number(j.sold[jaar]) || 0 : 0;
    const dec = maanden.filter(m => m.endsWith('-12')).map(m => Number(j.sold[m]) || 0);
    const uit = {
      term: t, cc, maand: laatste, verkocht: nu, vorigJaar: toen,
      groei: toen > 0 ? Math.round((nu / toen) * 100) / 100 : null,
      piekDecember: dec.length ? Math.max(...dec) : null,
      top: (j.top || []).slice(0, 3).map(x => ({ asin: x.asin, titel: String(x.titel || '').slice(0, 80) })),
      at: new Date().toISOString()
    };
    await kv.set(sl, uit, { ex: 60 * 60 * 36 });
    return uit;
  } catch (e) {
    return { fout: String(e && e.message || e).slice(0, 80), at: new Date().toISOString() };
  } finally { clearTimeout(tm); }
}

const vorigJaar = m => { const [j, mm] = String(m).split('-'); return (Number(j) - 1) + '-' + mm; };

// ---------- de opbrengstcheck ----------
// Verwachte opbrengst per klik = EPC van de aanbieding x het deel van onze kliks dat bij het product
// uitkomt. Die moet minstens `marge` keer de klikprijs zijn. Zo komt een mooie EPC op een categorie
// die niemand koopt er niet doorheen, en een goedkope categorie die veel verkoopt wel.

export function opbrengst(aanbod, keep, r) {
  const epc = Number(aanbod.epc) || 0;
  const perKlik = epc * r.deel;
  const keer = r.klikprijs > 0 ? perKlik / r.klikprijs : 0;
  const verkocht = keep && Number(keep.verkocht) || 0;
  const groei = keep && keep.groei != null ? Number(keep.groei) : null;
  const redenen = [];
  if (!epc) redenen.push('geen EPC bekend');
  if (keer < r.marge) redenen.push('opbrengst per klik $' + rond(perKlik, 4) + ' is maar ' + rond(keer, 1) + 'x de klikprijs (nodig ' + r.marge + 'x)');
  if (keep && keep.fout) redenen.push('Keepa: ' + keep.fout);
  else {
    if (verkocht < r.minVerkoop) redenen.push('Keepa: ' + verkocht + ' stuks per maand, onder de ' + r.minVerkoop);
    if (groei != null && groei < r.minGroei) redenen.push('Keepa: groei ' + groei + 'x, onder de ' + r.minGroei + 'x');
  }
  // rangschikken op opbrengst x groei: wat verkoopt EN stijgt gaat voor
  const score = Math.round(perKlik * 10000 * (groei && groei > 0 ? Math.min(groei, 5) : 1)) / 100;
  return { perKlik: rond(perKlik, 4), keer: rond(keer, 1), verkocht, groei, score, goed: redenen.length === 0, redenen };
}

const rond = (x, n) => Math.round(Number(x) * Math.pow(10, n)) / Math.pow(10, n);

// ---------- de dagronde ----------

export function goLink(term, tag, p = 'ccus', markt = 'com') {
  const q = ['n=propeller', 'c={campaignid}', 'z={zoneid}', 's=${SUBID}', 'b={bannerid}',
    'k=' + encodeURIComponent(term).replace(/%20/g, '+'), markt === 'com' ? '' : 'm=' + markt,
    'tag=' + tag, 'p=' + p].filter(Boolean);
  return 'https://whichtobuy.best/go?' + q.join('&');
}

export async function dagronde(opties = {}) {
  const r = await regels(), l = await lees();
  const dag = String(opties.dag || new Date().toISOString().slice(0, 10));
  const tag = String(opties.tag || process.env.CC_TAG || 'bl-t14-20');
  const alles = Object.values(l);
  const beoordeeld = [];
  for (const a of alles) {
    if (!a.term) { beoordeeld.push({ asin: a.asin, merk: a.merk, term: '', soort: a.soort, oordeel: { goed: false, redenen: ['geen zoekterm'] } }); continue; }
    const keep = await keepa(a.term, opties.cc || 'US');
    beoordeeld.push({ asin: a.asin, merk: a.merk, titel: a.titel, term: a.term, soort: a.soort, epc: a.epc, keepa: keep, oordeel: opbrengst(a, keep, r) });
  }
  beoordeeld.sort((x, y) => (y.oordeel.score || 0) - (x.oordeel.score || 0));

  const geslaagd = beoordeeld.filter(b => b.oordeel.goed);
  const gekozen = geslaagd.filter(b => b.soort === 'geaccepteerd').slice(0, r.perDag).map(b => ({
    asin: b.asin, merk: b.merk, term: b.term, epc: b.epc, score: b.oordeel.score,
    naam: 'AMZ ' + kort(dag) + '-cc | ' + b.term + ' | ' + tag,
    link: goLink(b.term, tag),
    dagbudget: r.dagbudget, totaal: r.dagbudget, bod: 0.01,
    waarom: 'EPC $' + b.epc + ' x ' + Math.round(r.deel * 100) + '% = $' + b.oordeel.perKlik + ' per klik (' + b.oordeel.keer + 'x de klikprijs); Keepa ' + b.oordeel.verkocht + ' stuks/maand' + (b.oordeel.groei ? ', ' + b.oordeel.groei + 'x vorig jaar' : '')
  }));
  // nog niet geaccepteerd, maar wel door de check: dat is de accepteerwachtrij voor de browser
  const wachtrij = geslaagd.filter(b => b.soort !== 'geaccepteerd').slice(0, 10).map(b => ({
    asin: b.asin, merk: b.merk, titel: b.titel, epc: b.epc, term: b.term, score: b.oordeel.score,
    waarom: b.oordeel.verkocht + ' stuks/maand' + (b.oordeel.groei ? ', ' + b.oordeel.groei + 'x vorig jaar' : '') + ', $' + b.oordeel.perKlik + ' per klik'
  }));
  const afgewezen = beoordeeld.filter(b => !b.oordeel.goed).slice(0, 20).map(b => ({ asin: b.asin, merk: b.merk, term: b.term, redenen: b.oordeel.redenen }));

  const uit = { dag, tag, regels: r, gekozen, wachtrij, afgewezen, bekeken: beoordeeld.length, at: new Date().toISOString() };
  await kv.set(K.dag(dag), uit, { ex: 60 * 60 * 24 * 30 });
  await kv.set('mm:cc:laatste', uit, { ex: 60 * 60 * 24 * 7 });
  return uit;
}

const kort = d => { const [, m, dd] = String(d).split('-'); const mn = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][Number(m) - 1] || m; return Number(dd) + mn; };

export async function stand(dag) {
  const d = dag ? await kv.get(K.dag(dag)) : await kv.get('mm:cc:laatste');
  const l = await lees();
  return {
    aanbiedingen: Object.keys(l).length,
    geaccepteerd: Object.values(l).filter(x => x.soort === 'geaccepteerd').length,
    open: Object.values(l).filter(x => x.soort !== 'geaccepteerd').length,
    laatsteRonde: d || null
  };
}
