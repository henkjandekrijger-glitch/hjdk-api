// AW Dropship EU voor Kadoly (21 nov 2026, Henkjan: "Ja eerst AW ... Maak AW in orde en maken we aparte spiriutuele hoek of hebben
// we die categorie al in Kadoly ?"). Ancient Wisdom s.r.o. (Slowakije), account Adsfair BV, verkoopkanaal "Kadoly (Manual/API)".
//
// Catalogus: de openbare feed https://www.aw-dropship.eu/data-feed.csv (34 kolommen, Engels, ~19 MB, elke dag bijgewerkt).
//   Unit price = inkoop excl. btw per stuk (Adsfair koopt B2B met btw-nummer), Unit RRP = adviesprijs incl. btw, Available Quantity =
//   voorraad, Package weight shipping = kg, Barcode = EAN. Alleen Status Active, For sale Yes, Units per outer 1 (packs laten we weg).
// Verzending naar NL: EUR 6,70 tot 2 kg, 4 werkdagen (21 nov). Zwaarder: de keuring rekent met 15 (geschat) tot de echte prijs bekend is.
// Keuring: lib/dpkeur.js, dezelfde vier punten en grenzen als Droppery. De titels zijn Engels en de vraag uit Demand Radar is
// Nederlands, dus de keuring leest de titel met Nederlandse woorden erbij (NL hieronder).
// Hoek: alles wat de keuring haalt komt in de eigen hoek "Rust & ritueel" met subcategorieen (HOEK), niet tussen de rest
// (Henkjan 21 nov: "we verstoppen het anders gewoon van de rest . en draaien experiment").
// Orders: API https://api.aiku.io (Bearer-token van het verkoopkanaal). Henkjan plakt het token op /api/dp?op=awtoken (beschermde
// host). Een order wordt een mandje bij AW; betalen (submit) gaat van het AW-saldo en gebeurt alleen als kv aw:order:auto = "ja"
// (Henkjans woord), anders staat het mandje klaar en komt er een regel in het werklog.
import { kv } from './db.js';
import { keurProduct, keurStand } from './dpkeur.js';
import { vraagIdx } from './dpapi.js';

export const AW_FEED = 'https://www.aw-dropship.eu/data-feed.csv';
export const AW_API = 'https://api.aiku.io';
// Verzending betaalt de klant (Henkjan 17 nov: "Gratis verzending doen we niet meer"): EUR 6,95 per bestelling tot 2 kg; voor ons blijft
// 6,70 - 6,95/1,21 = 0,96 over. Zwaarder: 15 - 6,95/1,21 = 9,26 (geschat).
export const AW_REGEL = { VERZEND_2KG: 6.70, KLANT_VERZEND: 6.95, LEVERTIJD: 4, MERK: 'Ancient Wisdom', LABEL: 'aw', HOEKNAAM: 'Rust & ritueel' };
const ZELF = kg => Math.round(((kg && kg <= 2 ? AW_REGEL.VERZEND_2KG : 15) - AW_REGEL.KLANT_VERZEND / 1.21) * 100) / 100;
const K = { token: 'aw:api:token', keur: 'aw:keur', auto: 'aw:order:auto', orders: 'aw:orders', portfolio: 'aw:portfolio', client: 'aw:client:' };
const N = x => { const n = Number(String(x == null ? '' : x).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const nu = () => new Date().toISOString().replace(/\.\d+Z$/, '');
export async function logRegel(tekst) { try { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: new Date().toISOString(), wie: 'aw-dropship', tekst: String(tekst).slice(0, 900) })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } catch (e) {} }

// ---------- de hoek: AW-afdeling (en subafdeling) naar een subcategorie van Rust & ritueel ----------
const HOEK = [
  ['Klankschalen en trommels', r => /Singing Bowl|Tingsha/i.test(r.sub) || r.afd === 'Musical Instruments'],
  ['Tarot en pendels', r => /tarot|pendulum|oracle|rune/i.test(r.sub + ' ' + r.titel)],
  ['Edelstenen en kristallen', r => r.afd === 'Crystals & Esoterics'],
  ['Wierook en salie', r => r.afd === 'Incense and Burners'],
  ['Aromatherapie', r => r.afd === 'Aromatherapy' || r.afd === 'Fragrance'],
  ['Kaarsen', r => r.afd === 'Candles & Holders'],
  ['Bad en lichaam', r => r.afd === 'Bath & Body'],
  ['Thee', r => r.afd === 'Artisan Tea'],
  ['Sieraden met edelsteen', r => r.afd === 'Jewellery'],
  ['Tassen en kleding', r => r.afd === 'Bags & Accessories' || r.afd === 'Clothing'],
  ['Beelden en decoratie', r => r.afd === 'Home & Garden'],
];
const NIET_AFD = new Set(['Packaging', 'Pet Accessories']);
// groothandelsverpakkingen zijn geen cadeau (21 nov, eerste keuring: "10x 10ml Myrrh Essential Oil Unlabelled", "Pack of 24 Rock Crystal", "500ml (Pure) FO")
const GROOT = /unlabel|\bpack of\b|^\d+\s?x\s|\bbulk\b|wholesale|\bFO\b|\b\d+(\.\d+)?\s?(kg|litre|liter)\b|\b(250|500|1000)\s?ml\b|\b(250|500)\s?g(m|r)?\b|\bdisplay\b|\btester|\bset of ([1-9]\d|[6-9])\b|\b\d{2,}\s?pieces\b/i;
const MAX_KG = 10; // zwaarder (beelden van 1 tot 2 meter, gongs op standaard): verzendprijs onbekend, eerst navragen bij AW
export const hoekVan = r => (HOEK.find(([, f]) => f(r)) || ['Beelden en decoratie'])[0];

// ---------- Nederlandse woorden bij de Engelse titel (voor de vraag uit Demand Radar) ----------
const NL = [[/singing bowl/i, 'klankschaal klankschalen tibetaanse klankschaal'], [/tingsha/i, 'tingsha klankschaal'], [/crystal|gemstone|tumble|tumbled|geode|chip stone/i, 'edelsteen edelstenen kristal'],
  [/amethyst/i, 'amethist edelsteen'], [/rose quartz/i, 'rozenkwarts edelsteen'], [/clear quartz|quartz/i, 'bergkristal kwarts edelsteen'], [/citrine/i, 'citrien edelsteen'], [/selenite/i, 'seleniet'],
  [/labradorite/i, 'labradoriet edelsteen'], [/tiger'?s? eye/i, 'tijgeroog edelsteen'], [/obsidian/i, 'obsidiaan edelsteen'], [/agate/i, 'agaat edelsteen'], [/jade/i, 'jade edelsteen'],
  [/incense/i, 'wierook'], [/white sage|black sage|blue sage|sage smudge|smudge/i, 'salie witte salie smudge'], [/palo santo/i, 'palo santo'], [/backflow/i, 'backflow wierookbrander'], [/burner|holder/i, 'houder brander'],
  [/essential oil/i, 'etherische olie etherische olien'], [/fragrance oil/i, 'geurolie'], [/diffuser/i, 'diffuser aroma diffuser'], [/reed diffuser/i, 'geurstokjes'], [/oil burner/i, 'oliebrander'],
  [/salt lamp|himalayan salt/i, 'zoutlamp himalaya zoutlamp'], [/lamp/i, 'lamp'], [/buddha/i, 'boeddha boeddhabeeld boeddha beeld'], [/ganesh/i, 'ganesha beeld'], [/statue|figurine/i, 'beeld beeldje'],
  [/dream ?catcher/i, 'dromenvanger'], [/wind ?chime/i, 'windgong'], [/tarot/i, 'tarot tarotkaarten'], [/pendulum/i, 'pendel'], [/chakra/i, 'chakra'], [/mala/i, 'mala'], [/drum/i, 'trommel'], [/gong/i, 'gong'],
  [/candle/i, 'kaars kaarsen geurkaars'], [/soap/i, 'zeep'], [/bath bomb/i, 'bruisbal'], [/bath salt/i, 'badzout'], [/tea\b/i, 'thee'], [/bracelet/i, 'armband'], [/necklace|pendant/i, 'ketting hanger'],
  [/earring/i, 'oorbellen'], [/\bring\b/i, 'ring'], [/bag\b|backpack/i, 'tas'], [/scarf|shawl/i, 'sjaal'], [/meditation/i, 'meditatie'], [/yoga/i, 'yoga'], [/angel/i, 'engel'], [/feng shui/i, 'feng shui']];
export const nlWoorden = t => NL.filter(([re]) => re.test(t)).map(([, w]) => w).join(' ');

// ---------- feed lezen ----------
export function leesCsv(s) { // RFC 4180: velden tussen aanhalingstekens mogen komma's en regeleinden bevatten
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
export function awNorm(r, H) {
  const g = k => (H[k] == null ? '' : String(r[H[k]] || '').trim());
  const titel = g('Unit Name'), afd = g('Department'), sub = g('Subdepartment'), kg = N(g('Package weight (shipping)')) || N(g('Unit net weight'));
  const p = { sku: g('Product code'), titel, merk: AW_REGEL.MERK, leverancier: 'AW Dropship EU', afd, sub, familie: g('Family'), ean: g('Barcode'), eenheid: g('Unit label'),
    inkoop: N(g('Unit price')) || null, inkoop_btw: 'excl', adviesprijs: N(g('Unit RRP')), prijs: N(g('Unit RRP')), voorraad: N(g('Available Quantity')), voorraad_stand: g('Stock'),
    actief: g('Status') === 'Active' && g('For sale') === 'Yes', per_outer: N(g('Units per outer')), gewicht: kg || '', maten: g('Unit dimensions'), materiaal: g('Materials/Ingredients'),
    herkomst: g('Country of origin'), omschrijving: g('Webpage description (plain text)').slice(0, 1500), beelden: g('Images').split(/,\s*/).filter(u => /^https:\/\//.test(u)).slice(0, 6),
    levertijd: AW_REGEL.LEVERTIJD, bijgewerkt: g('Data updated') };
  p.verzend_nl = ZELF(kg); p.verzend_geschat = !(kg && kg <= 2); // wat er na de verzendkosten van de klant voor ons overblijft
  p.hoek = hoekVan(p); p.categorie = AW_REGEL.HOEKNAAM + ' > ' + p.hoek;
  return p;
}
let CACHE = null; // warme instantie: de feed hooguit eens per 30 minuten ophalen
export async function awCatalogus({ vers = false } = {}) {
  if (!vers && CACHE && Date.now() - CACHE.at < 30 * 60e3) return CACHE;
  const r = await fetch(AW_FEED, { signal: AbortSignal.timeout(60000), headers: { 'user-agent': 'Kadoly/1.0 (+https://kadoly.com)' } });
  if (!r.ok) throw new Error('AW-feed HTTP ' + r.status);
  const rows = leesCsv(await r.text()); const kop = rows.shift() || []; const H = {}; kop.forEach((h, i) => { H[h.trim()] = i; });
  if (H['Product code'] == null || H['Unit price'] == null) throw new Error('AW-feed: kolommen veranderd (' + kop.slice(0, 8).join('|') + ')');
  const alle = rows.filter(x => x.length > 10).map(x => awNorm(x, H));
  const producten = alle.filter(p => p.sku && p.actief && p.per_outer === 1 && !NIET_AFD.has(p.afd) && !GROOT.test(p.titel) && !(N(p.gewicht) > MAX_KG));
  CACHE = { at: Date.now(), totaal: alle.length, producten }; return CACHE;
}

// ---------- keuring: alle producten, winnaars naar de hoek ----------
export async function awKeur({ vers = false, scoreGrens = true } = {}) {
  const [idx, cat] = await Promise.all([vraagIdx(vers).catch(() => []), awCatalogus({ vers })]);
  const lijst = cat.producten.map(p => ({ p, keur: keurProduct(Object.assign({}, p, { titel: p.titel + ' ' + nlWoorden(p.titel) }), idx, { scoreGrens: scoreGrens && idx.length > 0 }) }));
  lijst.forEach(x => { x.keur.label = x.keur.ok ? (x.keur.label === 'dp-top' ? 'aw-top' : 'aw-mid') : 'aw-uit'; });
  const ok = lijst.filter(x => x.keur.ok).sort((a, b) => b.keur.score - a.keur.score);
  const perHoek = {}; for (const x of ok) perHoek[x.p.hoek] = (perHoek[x.p.hoek] || 0) + 1;
  const bijna = lijst.filter(x => !x.keur.ok && x.keur.reden.length === 1 && /^score/.test(x.keur.reden[0])).length;
  const uit = { at: nu(), feedRegels: cat.totaal, inAanmerking: lijst.length, stand: keurStand(lijst), perHoek, alleenScoreTeLaag: bijna, vraagdata: idx.length > 0,
    top: ok.slice(0, 25).map(x => ({ sku: x.p.sku, titel: x.p.titel, hoek: x.p.hoek, prijs: x.keur.prijs, marge: x.keur.marge, score: x.keur.score, vraag: x.keur.vraag })) };
  try { await kv.set(K.keur, Object.assign({}, uit, { skus: ok.map(x => x.p.sku) }), { ex: 4 * 86400 }); } catch (e) {}
  return Object.assign({ ok: true, lijst }, uit);
}
export async function awKeurLaatste() { const k = await kv.get(K.keur).catch(() => null); if (k) delete k.skus; return k; }

// ---------- feed voor de Kadoly-shop (TAAK A in lib/shopprompt.js) ----------
export async function awFeed({ start = 0, size = 250, alles = false } = {}) {
  start = Math.max(0, Number(start) || 0); size = Math.min(500, Math.max(1, Number(size) || 250));
  const k = await awKeur({}); const pakketten = (await awPakketten().catch(() => [])).filter(x => x.ok);
  const inPakket = new Set(pakketten.flatMap(x => x.regels.map(r => r.aw_sku)));
  // onderdelen: zitten in een pakket maar halen los de keuring niet; de shop zet ze verborgen in de winkel (alleen in het pakket te koop)
  const rij = (alles ? k.lijst : k.lijst.filter(x => x.keur.ok || inPakket.has(x.p.sku))).sort((a, b) => (b.keur.ok - a.keur.ok) || (b.keur.score - a.keur.score));
  const deel = rij.slice(start, start + size).map(({ p, keur }) => ({ aw_sku: p.sku, sku: 'AW-' + p.sku, titel_en: p.titel, omschrijving_en: p.omschrijving, merk: p.merk, leverancier: p.leverancier,
    rol: keur.ok ? 'product' : 'onderdeel', ean: p.ean, inkoop: p.inkoop, inkoop_btw: 'excl', adviesprijs: p.adviesprijs, prijs_kadoly: keur.prijs, gratis_verzending: false, verzending_klant: AW_REGEL.KLANT_VERZEND, verzend_geschat: p.verzend_geschat,
    voorraad: p.voorraad, op_voorraad: p.voorraad > 0, levertijd: p.levertijd, levertijd_tekst: p.levertijd + ' werkdagen', gewicht: p.gewicht, eenheid: p.eenheid, maten: p.maten, materiaal: p.materiaal, herkomst: p.herkomst,
    beelden: p.beelden, categorie: p.categorie, hoek: AW_REGEL.HOEKNAAM, subcategorie: p.hoek, aw_afdeling: p.afd, aw_subafdeling: p.sub,
    keur: { ok: keur.ok, score: keur.score, label: keur.label, marge: keur.marge, marge_bak: keur.margeBak, vraag: keur.vraag, reden: keur.reden } }));
  return { bron: 'aw-dropship', totaal: rij.length, start, size, volgende: start + size < rij.length ? '/api/dp?op=awfeed&start=' + (start + size) + '&size=' + size : null,
    regel: 'prijs_kadoly = adviesprijs van AW (incl. btw); verzending EUR ' + AW_REGEL.KLANT_VERZEND.toFixed(2).replace('.', ',') + ' per bestelling; rol product zichtbaar, rol onderdeel alleen in een pakket; alles in de eigen hoek "' + AW_REGEL.HOEKNAAM + '", niet tussen de rest; titel en omschrijving zijn Engels: vertaal naar het Nederlands zonder iets te verzinnen',
    vraagdata: k.vraagdata, aantal: deel.length, bijgewerkt: nu(), producten: deel, pakketten: start === 0 ? pakketten.map(x => ({ slug: x.slug, naam: x.naam, voor: x.voor, verhaal: x.verhaal, vraag: x.vraag, link: x.link, prijs: x.prijs, los: x.los, besparing: x.besparing, verzending_klant: AW_REGEL.KLANT_VERZEND, levertijd: AW_REGEL.LEVERTIJD, regels: x.regels.map(r => ({ sku: r.sku, naam: r.naam, aantal: r.aantal, los: r.los, beeld: r.beeld })) })) : undefined };
}

// ---------- zoeken (verkennen op de beschermde host: op=awzoek&q=<regex>&min=&max=) ----------
export async function awZoek({ q = '', min = 0, max = 1e9, n = 40 } = {}) {
  const re = new RegExp(String(q || '.').slice(0, 200), 'i'); const cat = await awCatalogus({});
  return cat.producten.filter(p => re.test(p.titel + ' ' + p.sub + ' ' + p.familie) && p.adviesprijs >= N(min) && p.adviesprijs <= N(max) && p.voorraad > 0).sort((a, b) => b.voorraad - a.voorraad).slice(0, Math.min(200, N(n) || 40))
    .map(p => ({ sku: p.sku, titel: p.titel, sub: p.sub, rrp: p.adviesprijs, inkoop: p.inkoop, kg: p.gewicht, voorraad: p.voorraad, beeld: p.beelden[0] || null }));
}

// ---------- pakketten (Henkjan 21 nov: "gaan we pakketten maken") ----------
// AW verkoopt tegen ongeveer 1,75 keer de inkoop (excl. btw): een los ding van EUR 11 laat EUR 4 over. Een pakket van 5 dingen rond
// EUR 70 haalt de EUR 15. Rekenregel: prijs = som van de adviesprijzen min 10%, naar het cadeaubudget (24,95/49,95/74,95/99,95) als de
// marge minstens EUR 15 blijft; marge = prijs/1,21 - inkoop - eigen deel van de zending (0,96 tot 2 kg) - betaalkosten. De klant
// betaalt EUR 6,95 verzending, zoals bij de rest van Kadoly. Vaste sets (kern: [sku, aantal], 21 nov uit de AW-feed gekozen op
// voorraad en marge); valt een product weg (voorraad onder 5) of zakt de marge onder 15, dan is het pakket die dag niet te koop.
export const AW_PAKKETTEN = [
  { id: 'rookritueel', slug: 'rookritueel-set', naam: 'Rookritueel set', voor: 'Voor wie thuis wil opschonen met rook', vraag: 'wierook 38.859 per maand (NL en BE), palo santo, salie',
    verhaal: 'Een houten offerschaal, palo santo, harsen op een stokje, een houder voor palo santo en een bundel salie: alles voor een rookritueel in één doos.',
    kern: [['RBowl-12', 1], ['PSanto-03', 1], ['RitRinc-DS-ST-01', 1], ['PSMH-03', 1], ['MSage-18', 1]],
    namen: { 'RBowl-12': 'Houten offerschaal Drie Manen (14 x 7 cm)', 'PSanto-03': 'Palo santo, 100 gram (10 tot 15 stokjes)', 'RitRinc-DS-ST-01': 'Harsen op een stokje, startset', 'PSMH-03': 'Houder voor palo santo en salie, mandala', 'MSage-18': 'Salie-bundel, witte en blauwe salie (10 cm)' } },
  { id: 'edelstenen', slug: 'edelstenen-set', naam: 'Edelstenen set', voor: 'Cadeau voor wie van edelstenen houdt', vraag: 'edelstenen 213.517 per maand (NL en BE)',
    verhaal: 'Een obelisk van rozenkwarts, een pendel van amethist, een lampje met citrien, een hanger met de zeven chakrastenen en een rollerflesje met amethist.',
    kern: [['GemPt-27', 1], ['SpecMP-59', 1], ['GEL-03', 1], ['HCSP-02', 1], ['CGRB-05', 1]],
    namen: { 'GemPt-27': 'Obelisk van rozenkwarts (ongeveer 11 cm)', 'SpecMP-59': 'Pendel van amethist', 'GEL-03': 'Lampje met citrien', 'HCSP-02': 'Hanger met de zeven chakrastenen', 'CGRB-05': 'Rollerflesje met amethist (leeg)' } },
  { id: 'meditatie', slug: 'meditatie-set-klankschaal', naam: 'Meditatie set met klankschaal', voor: 'Voor wie tot rust wil komen', vraag: 'klankschaal 9.398 per maand (NL en BE)',
    verhaal: 'Een zwarte klankschaalset van 15 cm, palo santo, een houten offerschaal en twee harsen op een stokje (wierook en lavendel).',
    kern: [['TIB-150', 1], ['PSanto-02', 1], ['RBowl-02', 1], ['RitRinc-06', 1], ['RitRinc-13', 1]],
    namen: { 'TIB-150': 'Zwarte klankschaalset True North (15 cm)', 'PSanto-02': 'Palo santo, 50 gram (5 tot 8 stokjes)', 'RBowl-02': 'Houten offerschaal Boeddha (12 x 7 cm)', 'RitRinc-06': 'Hars op een stokje, wierook (frankincense)', 'RitRinc-13': 'Hars op een stokje, lavendel' } },
];
const BUDGET = [24.95, 49.95, 74.95, 99.95, 149.95];
export function awPakketReken(set) { // set: [{ p, n }]
  const los = Math.round(set.reduce((a, x) => a + x.p.adviesprijs * x.n, 0) * 100) / 100, ink = set.reduce((a, x) => a + x.p.inkoop * x.n, 0), kg = set.reduce((a, x) => a + N(x.p.gewicht) * x.n, 0);
  const zending = ZELF(kg); let prijs = Math.floor(los * 0.9) + 0.95; if (prijs > los) prijs = Math.round(los * 100) / 100;
  const m = pr => Math.round((pr / 1.21 - ink - zending - (0.029 * pr + 0.30)) * 100) / 100;
  const grens = [...BUDGET].reverse().find(b => prijs > b && prijs - b <= 10); if (grens && m(grens) >= 15) prijs = grens;
  return { prijs, los, besparing: Math.round((los - prijs) * 100) / 100, marge: m(prijs), kg: Math.round(kg * 100) / 100, zending };
}
export async function awPakketten({ kandidaten = null } = {}) {
  const cat = await awCatalogus({}); const per = new Map(cat.producten.map(p => [p.sku, p]));
  return (kandidaten || AW_PAKKETTEN).map(s => {
    const set = s.kern.map(([sku, n]) => ({ p: per.get(sku), n: n || 1, sku }));
    const mist = set.filter(x => !x.p || x.p.voorraad < 5 * x.n).map(x => x.sku);
    if (mist.length) return { id: s.id, slug: s.slug, naam: s.naam, ok: false, reden: 'niet leverbaar: ' + mist.join(', ') };
    const r = awPakketReken(set); const ok = r.marge >= 15;
    return Object.assign({ id: s.id, slug: s.slug, naam: s.naam, voor: s.voor, verhaal: s.verhaal, vraag: s.vraag, let: s.let || '', ok, reden: ok ? '' : 'marge ' + r.marge + ' onder 15', link: 'https://kadoly.com/pakket/' + s.slug,
      regels: set.map(x => ({ sku: 'AW-' + x.p.sku, aw_sku: x.p.sku, titel_en: x.p.titel, naam: (s.namen && s.namen[x.p.sku]) || x.p.titel, aantal: x.n, los: x.p.adviesprijs, beeld: x.p.beelden[0] || null })) }, r);
  });
}

// ---------- API (orders) ----------
export async function awToken() { if (process.env.AW_API_TOKEN) return process.env.AW_API_TOKEN; try { return ((await kv.get(K.token)) || {}).token || ''; } catch (e) { return ''; } }
export async function awTokenStand() { const t = await kv.get(K.token).catch(() => null); return { klaar: !!(process.env.AW_API_TOKEN || (t && t.token)), bron: process.env.AW_API_TOKEN ? 'env' : t ? 'kv' : null, sinds: t ? t.at : null, profiel: t ? t.profiel || null : null }; }
export async function awApi(pad, { methode = 'GET', params = {}, body = null, token } = {}) {
  const t = token || await awToken(); if (!t) return { st: 0, fout: 'geen token' };
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '').map(([k, v]) => [k, String(v)])).toString();
  const u = AW_API + '/' + String(pad || '').replace(/^\/+/, '') + (qs ? '?' + qs : '');
  try {
    const r = await fetch(u, { method: methode, redirect: 'manual', headers: Object.assign({ authorization: 'Bearer ' + t, accept: 'application/json' }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(25000) });
    const tekst = await r.text(); let data = null; try { data = JSON.parse(tekst); } catch (e) {}
    return { st: r.status, data, tekst: data ? null : tekst.slice(0, 1500) };
  } catch (e) { return { st: 0, fout: String(e.message || e).slice(0, 200) }; }
}
export async function awTokenZet(token) {
  token = String(token || '').trim(); if (token.length < 20) return { ok: false, fout: 'Dat lijkt geen token (te kort).' };
  const r = await awApi('user-profile', { token });
  if (r.st !== 200 || !r.data) return { ok: false, fout: 'AW antwoordt ' + (r.st || r.fout) + '. Kopieer het hele token uit de popup (niet het korte label uit de lijst).' };
  const d = r.data.data || r.data; const profiel = { naam: d.contact_name || d.name || null, klant: d.reference || d.slug || null };
  await kv.set(K.token, { token, at: nu(), profiel });
  return { ok: true, profiel };
}

// Order van Kadoly: { order_id, klant: { naam, email, telefoon, adres1, adres2, plaats, postcode, land }, regels: [{ sku: 'AW-<code>' of '<code>', aantal }] }
const id = x => (x && (x.data ? x.data.id : x.id)) || null;
async function portfolioVan(code) {
  const kaart = (await kv.get(K.portfolio).catch(() => null)) || {}; if (kaart[code]) return kaart[code];
  const z = await awApi('dropshipping/products', { params: { search: code, per_page: 20 } }); const lijst = (z.data && (z.data.data || z.data)) || [];
  let prod = Array.isArray(lijst) ? lijst.find(x => String(x.code || '').toLowerCase() === code.toLowerCase()) : null;
  if (!prod) { const m = await awApi('dropshipping/products/my-products', { params: { search: code, per_page: 20 } }); const ml = (m.data && (m.data.data || m.data)) || []; const al = Array.isArray(ml) ? ml.find(x => String(x.code || (x.product && x.product.code) || '').toLowerCase() === code.toLowerCase()) : null; if (al) { kaart[code] = al.id; await kv.set(K.portfolio, kaart).catch(() => {}); return al.id; } return null; }
  const s = await awApi('dropshipping/products/my-products/' + prod.id + '/store', { methode: 'POST' }); const pid = id(s.data); if (!pid) return null;
  kaart[code] = pid; await kv.set(K.portfolio, kaart).catch(() => {}); return pid;
}
export async function awNieuweOrder(b) {
  if (!(await awToken())) return { ok: false, fout: 'geen AW-token; Henkjan plakt hem op /api/dp?op=awtoken' };
  const k = b && b.klant || {}; const regels = (b && b.regels || []).map(r => ({ code: String(r.sku || '').replace(/^AW-/i, ''), aantal: Math.max(1, Math.round(N(r.aantal) || 1)) })).filter(r => r.code);
  if (!b || !b.order_id || !regels.length || !k.adres1 || !k.postcode || !k.plaats) return { ok: false, fout: 'order_id, regels en adres (adres1, postcode, plaats) zijn nodig' };
  const al = ((await kv.get(K.orders).catch(() => null)) || {})[b.order_id]; if (al) return Object.assign({ ok: true, al: true }, al);
  const land = String(k.land || 'NL').toUpperCase().slice(0, 3);
  const cl = await awApi('dropshipping/clients', { methode: 'POST', body: { reference: 'KADOLY-' + b.order_id, contact_name: k.naam || '', email: k.email || undefined, phone: k.telefoon && String(k.telefoon).length >= 6 ? k.telefoon : undefined, address: { address_line_1: k.adres1, address_line_2: k.adres2 || undefined, locality: k.plaats, postal_code: k.postcode, country_code: land } } });
  const clientId = id(cl.data); if (!clientId) return { ok: false, stap: 'klant', st: cl.st, fout: (cl.data && (cl.data.message || JSON.stringify(cl.data.errors || '').slice(0, 300))) || cl.tekst || cl.fout };
  const o = await awApi('dropshipping/order/client/' + clientId + '/store', { methode: 'POST' }); const orderId = id(o.data); if (!orderId) return { ok: false, stap: 'mandje', st: o.st, fout: (o.data && o.data.message) || o.tekst || o.fout };
  const fout = [];
  for (const r of regels) { const pid = await portfolioVan(r.code); if (!pid) { fout.push(r.code + ': niet gevonden bij AW'); continue; } const t = await awApi('dropshipping/order/' + orderId + '/portfolio/' + pid + '/store', { methode: 'POST', body: { quantity_ordered: r.aantal } }); if (t.st >= 300) fout.push(r.code + ': ' + ((t.data && t.data.message) || t.st)); }
  let betaald = false, status = 'mandje klaar (niet betaald)';
  if (!fout.length && (await kv.get(K.auto).catch(() => null)) === 'ja') { const s = await awApi('dropshipping/order/' + orderId + '/submit', { methode: 'PATCH' }); const d = (s.data && (s.data.data || s.data)) || {}; betaald = d.pay_status === 'paid'; status = (d.state || 'onbekend') + ' / ' + (d.pay_status || s.st); }
  const rec = { order_id: b.order_id, aw_order: orderId, aw_client: clientId, regels, fout, betaald, status, at: nu() };
  try { const m = (await kv.get(K.orders).catch(() => null)) || {}; m[b.order_id] = rec; await kv.set(K.orders, m); } catch (e) {}
  await logRegel('AW-order ' + b.order_id + ': mandje ' + orderId + ' bij AW, ' + status + (fout.length ? '; fout: ' + fout.join('; ') : '') + (betaald ? '' : '. Betalen: aw-dropship.eu, My Orders (of kv aw:order:auto = ja na Henkjans woord)'));
  return Object.assign({ ok: !fout.length }, rec);
}
export async function awOrders() { return (await kv.get(K.orders).catch(() => null)) || {}; }

// 26 nov 2026 (Henkjan: "Done ja auto"): AW-orders worden direct van het AW-saldo betaald als kv aw:order:auto = ja. Zetten via op=awauto&zet=ja|nee (beschermde host).
export async function awAuto(zet) { if (zet === 'ja' || zet === 'nee') await kv.set(K.auto, zet); return (await kv.get(K.auto).catch(() => null)) === 'ja'; }
