// Kadoly-video's: welke producten vannacht een korte video krijgen (17 nov 2026, Henkjan: "moet hele NL dag niet om 1730 de hele dag
// natuurlijk . al via clickmind en lerend wat het doet" en "Zet dit door"). Hier alleen de keuze uit de shopcatalogus (marge, voorraad,
// levertijd); het renderen gebeurt in het aparte Vercel-project kadoly-video (map kadoly-video/), zodat de shop geen videosoftware draagt.
// Soorten: kleurkeuze (zelfde product in 2 of 3 kleuren), set (3 van hetzelfde merk), finds (3 uit dezelfde categorie, minstens 2 merken).
// Teksten alleen uit de data (titel, merk, kleurwoord uit de titel, categorie): geen prijs, geen levertijd, niets verzonnen.
export const VIDEO_REGEL = { MIN_MARGE: 5, MAX_LEVERTIJD: 8, MAX_PRIJS: 300, NIET_HERHALEN_DAGEN: 21, PER_NACHT: 3, SOORTEN: ['kleurkeuze', 'set', 'finds'] };

const num = x => Number(x) || 0;
const KLEUREN = ['zand', 'sand', 'taupe', 'zwart', 'zwarte', 'wit', 'witte', 'rood', 'rode', 'goud', 'gouden', 'zilver', 'zilveren', 'blauw', 'blauwe', 'groen', 'groene', 'grijs', 'grijze', 'beige', 'roze', 'geel', 'gele', 'oranje', 'paars', 'paarse', 'bruin', 'bruine', 'lichtbruin', 'lichtbruine', 'donkerbruin', 'donkerbruine', 'creme', 'crème', 'ecru', 'naturel', 'mint', 'mintgroen', 'oker', 'camel', 'antraciet', 'cappuccino', 'terracotta', 'lila', 'koper', 'koperen', 'brons', 'bronzen', 'alabaster', 'jadegroen', 'donkergroen', 'donkergroene', 'lichtblauw', 'lichtblauwe', 'olijf', 'flamingo'];
const NETJES = { sand: 'zand', zwarte: 'zwart', witte: 'wit', rode: 'rood', gouden: 'goud', zilveren: 'zilver', blauwe: 'blauw', groene: 'groen', grijze: 'grijs', gele: 'geel', paarse: 'paars', bruine: 'bruin', lichtbruine: 'lichtbruin', donkerbruine: 'donkerbruin', creme: 'crème', koperen: 'koper', bronzen: 'brons', donkergroene: 'donkergroen', lichtblauwe: 'lichtblauw' };
const STOP = new Set(['voor', 'met', 'van', 'door', 'de', 'het', 'een', 'en', 'in', 'op', 'by', '&', '-', '–']);
// bijvoeglijke woorden die vooraan een titel staan: het eerste woord daarna is het product (tafelhaard, lamp, vaas), zo komen kleurvarianten bij elkaar
const BIJV = new Set(['rond', 'ronde', 'grote', 'groot', 'kleine', 'klein', 'elegante', 'elegant', 'stijlvolle', 'stijlvol', 'unieke', 'uniek', 'moderne', 'modern', 'handgemaakte', 'handgemaakt', 'zachte', 'zacht', 'warme', 'warm', 'luxe', 'mooie', 'decoratieve', 'decoratief', 'keramische', 'keramisch', 'glazen', 'houten', 'metalen', 'oplaadbare', 'oplaadbaar', 'draadloze', 'draadloos', 'nieuwe', 'natuurlijke', 'rustieke', 'rustiek', 'vintage', 'leuke', 'speelse', 'gezellige', 'feestelijke', 'trendy', 'chique', 'geweven', 'gevlochten', 'extra', 'mini', 'stevige', 'duurzame', 'duurzaam']);
const WOORD = { planten: 'je planten', decoratie: 'in huis', muur: 'je muur', textiel: 'op de bank', kaarsen: 'gezellige avonden', verlichting: 'meer sfeer', opbergen: 'een opgeruimd huis', servies: 'een mooie tafel', glazen: 'de borrel', 'koffie-thee': 'koffieliefhebbers', tafel: 'een mooie tafel', koken: 'in de keuken', baby: 'de babykamer', kinderkamer: 'de kinderkamer', speelgoed: 'kleine kinderen', sieraden: 'jezelf', tassen: 'onderweg', haar: 'je haar', bad: 'een avond in bad', tuin: 'de tuin', geuren: 'een geurig huis', giftsets: 'een cadeau', opladen: 'je bureau', audio: 'muziekliefhebbers' };
const WOORD_CAT = { wonen: 'in huis', keuken: 'in de keuken', kids: 'de kinderen', mode: 'jezelf', beauty: 'jezelf', cadeaus: 'een cadeau', tech: 'je bureau', hobby: 'creatieve mensen', sport: 'buiten', dieren: 'je huisdier', overig: 'in huis' };
const TAGS_CAT = { wonen: ['#wooninspiratie', '#interieur', '#homedecor'], keuken: ['#tafelstyling', '#keuken', '#homedecor'], kids: ['#kinderkamer', '#babykamer', '#kids'], mode: ['#musthave', '#fashion', '#ootd'], beauty: ['#selfcare', '#beauty', '#cadeautip'], cadeaus: ['#cadeautip', '#cadeau', '#kerstcadeau'], tech: ['#bureau', '#interieur', '#gadgets'] };
const TAGS_SUB = { planten: '#plantenliefde', kaarsen: '#kaarsen', verlichting: '#verlichting', textiel: '#cozy', servies: '#servies', muur: '#wanddecoratie', opbergen: '#opbergen' };

const woorden = t => String(t || '').toLowerCase().replace(/[^a-z0-9à-ÿ&\- ]/gi, ' ').split(/\s+/).filter(Boolean);
const kleurVan = t => { for (const w of woorden(t)) if (KLEUREN.includes(w)) return NETJES[w] || w; return null; };
const merkNet = b => { const s = String(b || '').trim(); return s && s === s.toLowerCase() ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
const isKerst = items => items.every(i => /kerst/i.test(i.t));
function tags(items) {
  const c = items[0].c || 'overig', s = items[0].s || '';
  const t = ['#kadoly']; if (isKerst(items)) t.push('#kerstdecoratie'); if (TAGS_SUB[s]) t.push(TAGS_SUB[s]);
  for (const x of (TAGS_CAT[c] || ['#wooninspiratie', '#homedecor', '#cadeautip'])) if (!t.includes(x)) t.push(x);
  return [...new Set(t)].slice(0, 5);
}
function lijstTekst(items, extra) { return items.map((i, k) => (k + 1) + '. ' + String(i.t).trim() + (extra && extra[k] ? ' (' + extra[k] + ')' : '')).join('\n'); }
const foto = id => 'https://keuzehulp.best/api/shop?op=img&t=ig&p=' + id;

// kandidaten: op voorraad, met foto, marge, levertijd en prijs binnen de regel, niet recent al in een video
function pool(items, gebruikt, dag) {
  const grens = new Date(Date.parse(dag + 'T00:00:00Z') - VIDEO_REGEL.NIET_HERHALEN_DAGEN * 864e5).toISOString().slice(0, 10);
  return items.filter(i => i && i.id && i.img && i.vr !== false && num(i.mg) >= VIDEO_REGEL.MIN_MARGE && (i.lt == null || num(i.lt) <= VIDEO_REGEL.MAX_LEVERTIJD)
    && (num(i.p) + (i.fs ? 0 : num(i.vk))) <= VIDEO_REGEL.MAX_PRIJS && !(gebruikt[i.id] && gebruikt[i.id] >= grens)).sort((a, b) => num(b.mg) - num(a.mg));
}

function groepKleur(p) {
  const g = new Map();
  for (const i of p) { const k = kleurVan(i.t); if (!k) continue; const merk = woorden(i.b); const sleutel = (i.b || '') + '|' + (i.c || '') + '|' + (woorden(i.t).find(w => w.length >= 4 && !KLEUREN.includes(w) && !STOP.has(w) && !BIJV.has(w) && !merk.includes(w) && !/\d/.test(w)) || '');
    if (!g.has(sleutel)) g.set(sleutel, new Map()); const m = g.get(sleutel); if (!m.has(k)) m.set(k, i); }
  return [...g.values()].filter(m => m.size >= 2).map(m => [...m.entries()].slice(0, 3)).map(e => ({ items: e.map(x => x[1]), kleuren: e.map(x => x[0]), score: e.reduce((s, x) => s + num(x[1].mg), 0) })).sort((a, b) => b.score - a.score);
}
function groepSet(p) {
  const g = new Map(); for (const i of p) { if (!i.b) continue; const k = i.b + '|' + (i.c || ''); (g.get(k) || g.set(k, []).get(k)).push(i); }
  return [...g.values()].filter(a => a.length >= 3).map(a => ({ items: a.slice(0, 3), score: a.slice(0, 3).reduce((s, x) => s + num(x.mg), 0) })).sort((a, b) => b.score - a.score);
}
function groepFinds(p) {
  const g = new Map(); for (const i of p) { const k = (i.c || 'overig') + '>' + (i.s || ''); (g.get(k) || g.set(k, []).get(k)).push(i); }
  const uit = []; for (const a of g.values()) { const gekozen = []; const merken = new Set(); for (const i of a) { if (gekozen.length >= 3) break; if (gekozen.length === 2 && merken.size < 2 && merken.has(i.b || '')) continue; gekozen.push(i); merken.add(i.b || ''); } if (gekozen.length === 3 && merken.size >= 2) uit.push({ items: gekozen, score: gekozen.reduce((s, x) => s + num(x.mg), 0) }); }
  return uit.sort((a, b) => b.score - a.score);
}

function spec(soort, grp, id) {
  const it = grp.items, n = it.length, pids = it.map(i => i.id), tg = tags(it).join(' ');
  if (soort === 'kleurkeuze') {
    const k = grp.kleuren, regels = k.map((x, j) => j === 0 ? 'Welke kleur kies jij? 1. ' + x : j === n - 1 ? (j + 1) + '. ' + x + '. Zet je nummer in de reacties' : (j + 1) + '. ' + x);
    const zoek = merkNet(it[0].b) || 'Kadoly';
    return { id, soort, pids, regels, fotos: pids.map(foto),
      tekst: 'Welke kleur kies jij?\n' + lijstTekst(it, k) + '\nZet je nummer in de reacties.\n\nLink in bio, zoek op ' + zoek + '.\n\n' + tg,
      tiktok_tekst: 'Welke kleur kies jij: ' + k.join(', ').replace(/, ([^,]*)$/, ' of $1') + '? Link in bio. ' + tg };
  }
  if (soort === 'set') {
    const merk = merkNet(it[0].b);
    return { id, soort, pids, regels: ['3 favorieten van ' + merk + '. Nummer 1', 'Nummer 2', 'Nummer 3. Welke kies jij?'], fotos: pids.map(foto),
      tekst: '3 favorieten van ' + merk + ':\n' + lijstTekst(it) + '\nWelke kies jij?\n\nLink in bio, zoek op ' + merk + '.\n\n' + tg,
      tiktok_tekst: '3 favorieten van ' + merk + '. Welke kies jij? Link in bio. ' + tg };
  }
  const w = isKerst(it) ? 'de kerst' : (WOORD[it[0].s] || WOORD_CAT[it[0].c] || 'in huis');
  return { id, soort: 'finds', pids, regels: ['3 finds voor ' + w + '. Nummer 1', 'Nummer 2', 'Nummer 3. Welke kies jij?'], fotos: pids.map(foto),
    tekst: '3 finds voor ' + w + ':\n' + lijstTekst(it) + '\nWelke kies jij?\n\nLink in bio, zoek op ' + (merkNet(it[0].b) || 'Kadoly') + '.\n\n' + tg,
    tiktok_tekst: '3 finds voor ' + w + '. Welke kies jij? Link in bio. ' + tg };
}

// volgorde van de soorten: zolang er per soort minder dan 3 gemeten video's zijn om de beurt (per dag doorgeschoven),
// daarna twee van de beste en één van de tweede (lerend: maat per soort uit kadoly/reels.json > lerend > soorten, gezet door de dagtaak social)
export function soortVolgorde(lerend, n, dag) {
  const S = VIDEO_REGEL.SOORTEN, m = (lerend && lerend.soorten) || {};
  const gemeten = S.filter(s => m[s] && num(m[s].n) >= 3);
  if (gemeten.length >= 2) { const r = gemeten.sort((a, b) => num(m[b].maat) - num(m[a].maat)); const uit = []; while (uit.length < n) uit.push(uit.length % 3 === 2 ? (r[1] || r[0]) : r[0]); return uit; }
  const d = Math.floor(Date.parse(dag + 'T00:00:00Z') / 864e5); return Array.from({ length: n }, (_, k) => S[(d + k) % S.length]);
}

export function videoPlan(items, gebruikt, lerend, n, dag) {
  const p = pool(items || [], gebruikt || {}, dag), bezet = new Set(), plan = [];
  const groepen = { kleurkeuze: groepKleur(p), set: groepSet(p), finds: groepFinds(p) };
  const vrij = g => g.items.every(i => !bezet.has(i.id)) && g.items.every(i => !bezet.has('m:' + (i.b || '')) || !i.b);
  for (const soort of soortVolgorde(lerend, n, dag)) {
    let g = groepen[soort].find(vrij), s = soort;
    if (!g) for (const alt of VIDEO_REGEL.SOORTEN) { g = groepen[alt].find(vrij); if (g) { s = alt; break; } }
    if (!g) break;
    for (const i of g.items) { bezet.add(i.id); if (i.b) bezet.add('m:' + i.b); }
    plan.push(spec(s, g, 'n' + dag.replace(/-/g, '').slice(2) + String.fromCharCode(97 + plan.length)));
  }
  return plan;
}
