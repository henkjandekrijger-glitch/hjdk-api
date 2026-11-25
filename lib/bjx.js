// Bijouxmode voor Kadoly (25 nov 2026, Henkjan: "We moeten meer in de winkel brengen vandaag."). Groothandel grossiste-bijouxmode.com
// (Frankrijk, Shopify), Kadoly heeft een account, dropship EUR 2 per stuk excl. btw, Colissimo naar NL EUR 8,90 (3 tot 8 dagen).
// Bron: de openbare Shopify-JSON per product (/products/<handle>.js: prijs in centen excl. btw, voorraad, beelden, omschrijving).
// Geen API voor orders: een betaalde order komt binnen via POST op=bjxorder, wordt bewaard en gemeld; Henkjan bestelt bij Bijouxmode
// met de mandje-link uit op=bjxorders. Gravure: supplement EUR 6 per kant (product supplement-gravure), sommige stukken voorkant gratis.
// Keuze: liever 30 goede dan 300 middelmatige. BJX_KEUZE hieronder is de lijst; prijzen, voorraad en beelden komen live van Bijouxmode.
// Rekenregel (per bestelling van 1 stuk, zelfde opzet als AW): marge = prijs/1,21 - inkoop - gravure - EUR 2 per stuk dropship
//   - (8,90 - 6,95/1,21) eigen deel verzending - 0,50 betaalkosten >= 15. De klant betaalt EUR 6,95 verzending, zoals bij de rest van Kadoly.
// Prijs = laagste x,95 die de marge haalt; hooguit 1,5 x de bovenkant van hun "prix public constaté" (som van de delen) en nooit boven
// EUR 49,95. Haalt een stuk dat niet, is het uitverkocht of heeft het geen adviesprijs: weglaten, met de reden in de stand.
import { kv } from './db.js';

export const BJX_BRON = 'https://grossiste-bijouxmode.com';
export const BJX_REGEL = { BTW: 1.21, DROPSHIP: 2, VERZEND: 8.90, KLANT_VERZEND: 6.95, BETAAL: 0.50, MIN_MARGE: 15, MAX_PRIJS: 49.95, PP_FACTOR: 1.5,
  GRAVURE: 6, KETTING_PP: 15.90, LEVER_MIN: 3, LEVER_MAX: 8, CACHE_UUR: 3, OUD_UUR: 48 };
// KETTING_PP: een losse ketting zonder eigen adviesprijs telt voor de bovengrens mee met EUR 15,90, de laagste adviesprijs van een stalen ketting bij Bijouxmode.
export const BJX_HOEK = { naam: { id: 'met-naam-gravure', naam: 'Met naam (gravure)' }, staal: { id: 'stalen-sieraden', naam: 'Stalen sieraden' } };
const K = { cat: 'bjx:cat', stand: 'bjx:stand', orders: 'bjx:orders' };
const N = x => { const n = Number(String(x == null ? '' : x).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const r2 = v => Math.round(v * 100) / 100;
const nu = () => new Date().toISOString().replace(/\.\d+Z$/, '');

// Kettingen bij de hangers (roestvrij staal 316L, gourmetteschakel 2 mm)
const KET = { z50: 'chaine-acier-316-maille-gourmette-couleur-argent-50-cm-2-mm', g50: 'chaine-acier-316-maille-gourmette-couleur-or-50-cm-2-mm',
  z55: 'chaine-acier-316-maille-gourmette-couleur-argent-55-cm-2-mm', g55: 'chaine-acier-316-maille-gourmette-couleur-or-55-cm-2-mm' };
const KET_TEKST = { z50: 'zilverkleurige gourmetteketting, 50 cm, 2 mm', g50: 'goudkleurige gourmetteketting, 50 cm, 2 mm', z55: 'zilverkleurige gourmetteketting, 55 cm, 2 mm', g55: 'goudkleurige gourmetteketting, 55 cm, 2 mm' };
const ZK = 'zilverkleurig staal', GK = 'goudkleurig staal';
const hanger = (id, handle, ket, titel, kleur, max, extra = {}) => Object.assign({ id, hoek: 'naam', soort: 'ketting', sub: 'Kettingen met naam', titel, kleur, delen: [{ handle, rol: 'hanger' }, { handle: KET[ket], rol: 'ketting', tekst: KET_TEKST[ket] }], gravure: { max, gratis: false } }, extra);

// De keuze. titel = Nederlands, kort en eerlijk; nooit "goud" of "18k" bij goudkleurig staal (Waarborgwet).
export const BJX_KEUZE = [
  hanger('naam-rond-z', 'pendentif-acier-a-personnaliser-rond-argente-24-20-2-mm', 'z50', 'Ketting met naam, ronde hanger, zilverkleurig staal', ZK, 20),
  hanger('naam-rond-g', 'pendentif-acier-a-personnaliser-rond-or-24-20-2-mm', 'g50', 'Ketting met naam, ronde hanger, goudkleurig staal', GK, 20),
  hanger('naam-hart-z', 'pendentif-acier-a-personnaliser-coeur-argente', 'z50', 'Ketting met naam, hartje, zilverkleurig staal', ZK, 16),
  hanger('naam-hart-g', 'pendentif-acier-a-personnaliser-coeur-or', 'g50', 'Ketting met naam, hartje, goudkleurig staal', GK, 16),
  hanger('naam-dubbelhart-z', 'pendentif-acier-a-personnaliser-double-coeur-argente', 'z50', 'Ketting met twee namen, dubbel hart, zilverkleurig staal', ZK, 16),
  hanger('naam-dubbelhart-g', 'pendentif-acier-a-personnaliser-double-coeur-or', 'g50', 'Ketting met twee namen, dubbel hart, goudkleurig staal', GK, 16),
  hanger('naam-ovaal-z', 'pendentif-acier-a-personnaliser-ovale-argente-30-20-3-mm', 'z50', 'Ketting met naam, ovale hanger, zilverkleurig staal', ZK, 20),
  hanger('naam-plaatje-z', 'pendentif-acier-a-personnaliser-plaque-militaire-argente-50-30-mm', 'z55', 'Ketting met graveerplaatje (dog tag), zilverkleurig staal', ZK, 24, { voor: 'hem' }),
  hanger('naam-plaatje-g', 'pendentif-acier-a-personnaliser-plaque-militaire-or-35-25-1-5-mm', 'g55', 'Ketting met graveerplaatje (dog tag), goudkleurig staal', GK, 20, { voor: 'hem' }),
  hanger('naam-hartmotief-z', 'pendentif-acier-a-personnaliser-rond-argente-theme-coeur', 'z50', 'Ketting met naam, ronde hanger met hartmotief, zilverkleurig staal', ZK, 20, { gravure: { max: 20, gratis: true } }),
  hanger('naam-levensboom-z', 'pendentif-acier-a-personnaliser-rond-argente-35-30-2-mm-copie', 'z50', 'Ketting met naam, ronde hanger met levensboom, zilverkleurig staal', ZK, 20, { gravure: { max: 20, gratis: true } }),
  hanger('naam-jongen-g', 'pendentif-breloque-acier-dore-a-personnaliser-petit-garcon-gravure-offerte', 'g50', 'Mama-ketting met naam, bedel jongetje, goudkleurig staal', GK, 10, { gravure: { max: 10, gratis: true } }),
  hanger('naam-meisje-g', 'pendentif-breloque-acier-dore-a-personnaliser-petite-fille-gravure-offerte', 'g50', 'Mama-ketting met naam, bedel meisje, goudkleurig staal', GK, 10, { gravure: { max: 10, gratis: true } }),
  hanger('naam-kleinhart-z', 'pendentif-acier-a-personnaliser-petit-coeur-argente', 'z50', 'Ketting met initialen, klein hartje, zilverkleurig staal', ZK, 6),
  hanger('naam-munt-z', 'pendentif-breloque-acier-inoxydable-a-personnaliser-rond-argente-16-1-mm', 'z50', 'Ketting met naam, rond muntje 16 mm, zilverkleurig staal', ZK, 10),
  hanger('naam-munt-g', 'pendentif-breloque-acier-inoxydable-a-personnaliser-rond-dore-16-1-mm', 'g50', 'Ketting met naam, rond muntje 16 mm, goudkleurig staal', GK, 10),
  { id: 'naam-armband-plaat', hoek: 'naam', soort: 'armband', sub: 'Armbanden met naam', titel: 'Schakelarmband met naam, graveerplaatje, zilverkleurig staal', kleur: ZK, delen: [{ handle: 'bracelet-gourmette-acier-inoxydable-plaque-a-graver-2', rol: 'armband' }], gravure: { max: 20, gratis: false } },
  { id: 'naam-armband-byz', hoek: 'naam', soort: 'armband', sub: 'Armbanden met naam', titel: 'Armband met naam, byzantijnse schakel, zilverkleurig staal', kleur: ZK, delen: [{ handle: 'bracelet-gourmette-acier-inoxydable-chaine-byzantine-plaque-a-graver', rol: 'armband' }], gravure: { max: 20, gratis: false } },
  // natuursteen (merk Lily-côtémode bij Bijouxmode; maten uit hun omschrijving)
  ...[['steen-ster-turkoois', 'collier-pour-femme-acier-etoile-breloques-pierre-naturelle-turquoise-dafrique', 'Afrikaanse turkoois'],
    ['steen-ster-howliet', 'collier-pour-femme-acier-etoile-breloques-pierre-naturelle-howlite', 'howliet'],
    ['steen-ster-jaspis', 'collier-pour-femme-acier-etoile-breloques-pierre-naturelle-jaspe-paysage', 'landschapsjaspis'],
    ['steen-ster-agaat', 'collier-pour-femme-acier-etoile-breloques-pierre-naturelle-agate-rouge', 'rode agaat']]
    .map(([id, handle, steen]) => ({ id, hoek: 'staal', soort: 'ketting', sub: 'Kettingen met natuursteen', titel: 'Ketting met sterretje en ' + steen + ', roestvrij staal', steen, delen: [{ handle, rol: 'ketting' }] })),
  ...[['steen-bedels-rhodoniet', 'collier-pour-femme-pierre-naturelle-acier-breloques-rhodonite', 'rhodoniet'],
    ['steen-bedels-amazoniet', 'collier-pour-femme-pierre-naturelle-acier-breloques-amazonite', 'amazoniet'],
    ['steen-bedels-maansteen', 'collier-pour-femme-pierre-naturelle-acier-breloques-pierre-de-lune', 'maansteen']]
    .map(([id, handle, steen]) => ({ id, hoek: 'staal', soort: 'ketting', sub: 'Kettingen met natuursteen', titel: 'Bedelketting met ' + steen + ', roestvrij staal', steen, delen: [{ handle, rol: 'ketting' }] })),
  ...[['steen-goud-agaat', 'collier-pour-femme-acier-pierre-naturelle-breloques-agate-rouge', 'rode agaat'],
    ['steen-goud-howliet', 'collier-pour-femme-acier-pierre-naturelle-breloques-howlite', 'howliet']]
    .map(([id, handle, steen]) => ({ id, hoek: 'staal', soort: 'ketting', sub: 'Kettingen met natuursteen', titel: 'Bedelketting met ' + steen + ', goudkleurig staal', kleur: GK, steen, delen: [{ handle, rol: 'ketting' }] })),
  ...[['steen-trio-sneeuwvlok', 'collier-pour-femme-acier-316-trio-de-rond-pierre-naturelle-flocon-de-neige', 'sneeuwvlokobsidiaan'],
    ['steen-trio-lapis', 'collier-pour-femme-acier-316-trio-de-rond-pierre-naturelle-lapis-lazuli', 'lapis lazuli']]
    .map(([id, handle, steen]) => ({ id, hoek: 'staal', soort: 'ketting', sub: 'Kettingen met natuursteen', titel: 'Ketting met drie rondjes ' + steen + ', staal 316L', steen, delen: [{ handle, rol: 'ketting' }] })),
  ...[['steen-ketting-agaat', 'collier-pour-femme-acier-316-inoxydable-pierre-avec-chaine-agate-rouge', 'rode agaat'],
    ['steen-ketting-rhodoniet', 'collier-pour-femme-acier-316-inoxydable-pierre-avec-chaine-rhodonite', 'rhodoniet']]
    .map(([id, handle, steen]) => ({ id, hoek: 'staal', soort: 'ketting', sub: 'Kettingen met natuursteen', titel: 'Ketting met ' + steen + ', staal 316L', steen, delen: [{ handle, rol: 'ketting' }] })),
  { id: 'steen-armband-trio', hoek: 'staal', soort: 'armband', sub: 'Armbanden met natuursteen', titel: 'Armband met drie rondjes sneeuwvlokobsidiaan, staal 316L', steen: 'sneeuwvlokobsidiaan', delen: [{ handle: 'bracelet-pour-femme-acier-316-trio-de-rond-pierre-naturelle-flocon-de-neige', rol: 'armband' }] },
  { id: 'steen-armband-rhodoniet', hoek: 'staal', soort: 'armband', sub: 'Armbanden met natuursteen', titel: 'Dubbele armband met rhodoniet, staal 316L', steen: 'rhodoniet', delen: [{ handle: 'bracelet-femme-double-rangs-acier-inoxydable-pierre-carre-rhodonite', rol: 'armband' }] },
  { id: 'steen-armband-agaat', hoek: 'staal', soort: 'armband', sub: 'Armbanden met natuursteen', titel: 'Dubbele armband met agaat, staal 316L', steen: 'agaat', delen: [{ handle: 'bracelet-femme-double-rangs-acier-inoxydable-pierre-carre-agate', rol: 'armband' }] },
  // sets
  ...[['set-koffieboon-7-z', 'parure-pour-homme-grain-de-cafe-7mm-couleur-argente', '7 mm, zilverkleurig'], ['set-koffieboon-7-g', 'parure-pour-homme-grain-de-cafe-7mm-couleur-dore', '7 mm, goudkleurig'],
    ['set-koffieboon-7-a', 'parure-pour-homme-grain-de-cafe-7mm-couleur-anthracite', '7 mm, antraciet'], ['set-koffieboon-11-z', 'parure-pour-homme-grain-de-cafe-11mm-couleur-argente', '11 mm, zilverkleurig']]
    .map(([id, handle, w]) => ({ id, hoek: 'staal', soort: 'set', sub: 'Sets', voor: 'hem', titel: 'Herenset ketting en armband, koffieboonschakel ' + w + ' staal 316L', delen: [{ handle, rol: 'set' }] })),
  { id: 'set-zirkonia-z', hoek: 'staal', soort: 'set', sub: 'Sets', titel: 'Set ketting, oorbellen en armband met zwarte zirkonia, zilverkleurig staal', kleur: ZK, delen: [{ handle: 'parure-collier-boucles-doreilles-et-bracelet-acier-inoxydable-argente-zirconium-noir', rol: 'set' }] },
];

// ---------- rekenen ----------
export const opX95 = m => { const p = Math.ceil(r2(m) - 0.95) + 0.95; return r2(p < m ? p + 1 : p); };
export const eigenVerzend = () => r2(BJX_REGEL.VERZEND - BJX_REGEL.KLANT_VERZEND / BJX_REGEL.BTW);
export function bjxMarge(prijs, inkoop) { return r2(prijs / BJX_REGEL.BTW - inkoop - eigenVerzend() - BJX_REGEL.BETAAL); }
// inkoop = som van de delen + gravure (als die niet gratis is) + dropship per stuk; pp = som van de bovenkant van de adviesprijzen
export function bjxReken({ delen, gravure }) {
  const stuks = delen.length, gravureKost = gravure && !gravure.gratis ? BJX_REGEL.GRAVURE : 0;
  const inkoop = r2(delen.reduce((a, d) => a + d.prijs, 0) + gravureKost + stuks * BJX_REGEL.DROPSHIP);
  const minPrijs = (inkoop + eigenVerzend() + BJX_REGEL.BETAAL + BJX_REGEL.MIN_MARGE) * BJX_REGEL.BTW;
  const prijs = opX95(minPrijs);
  const pp = delen.reduce((a, d) => a + (d.pp || (d.rol === 'ketting' && delen.length > 1 ? BJX_REGEL.KETTING_PP : 0)), 0);
  const hoofdPp = delen.every(d => d.pp || (d.rol === 'ketting' && delen.length > 1));
  const grens = hoofdPp && pp > 0 ? r2(Math.min(BJX_REGEL.MAX_PRIJS, BJX_REGEL.PP_FACTOR * pp)) : null;
  const reden = [];
  if (!hoofdPp) reden.push('geen adviesprijs (prix public constaté) bij Bijouxmode');
  else if (prijs > grens) reden.push('prijs ' + prijs.toFixed(2) + ' boven de grens ' + grens.toFixed(2) + ' (1,5 x adviesprijs ' + r2(pp).toFixed(2) + ', max ' + BJX_REGEL.MAX_PRIJS + ')');
  return { inkoop, gravureKost, dropship: stuks * BJX_REGEL.DROPSHIP, prijs, marge: bjxMarge(prijs, inkoop), adviesprijs: hoofdPp ? r2(pp) : null, grens, ok: !reden.length, reden };
}

// Waarborgwet: geen goud, gouden, 18k of karaat bij staal (goudkleurig mag)
export const WAARBORG = /(^|[^a-zà-ÿ])(goud|gouden|vergulde?|18 ?k|14 ?k|karaat|vermeil)([^a-zà-ÿ]|$)/i;

// ---------- Bijouxmode lezen ----------
const tekst = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim();
export function leesPp(beschrijving) { const m = tekst(beschrijving).match(/Prix public constat[ée]e?\s*:?\s*([\d]+(?:[.,]\d+)?)\s*€?\s*(?:à|-|–)?\s*([\d]+(?:[.,]\d+)?)?/i); if (!m) return null; return { van: N(m[1]), tot: N(m[2] || m[1]) }; }
export function leesMaat(beschrijving) { const t = tekst(beschrijving); const m = t.match(/(?:Dimensions?|Pendentif|Taille)\s*:?\s*([0-9][0-9.,]*\s*(?:cm|mm)?\s*(?:[*x×]\s*[0-9.,]+\s*(?:cm|mm)?)*(?:\s*\+\s*[0-9.,]+\s*cm[^.]*?r[ée]glable)?)/i); return m ? m[1].replace(/\s*[*×]\s*/g, ' x ').replace(/chainette/i, 'verlengketting').replace(/r[ée]glable/i, '').replace(/\s+/g, ' ').trim() : null; }
export function bjxNorm(p) {
  const v = (p.variants || []).find(x => x.available) || (p.variants || [])[0] || {};
  const beelden = (p.images || []).map(u => (String(u).startsWith('//') ? 'https:' : '') + String(u).split('?')[0]).filter(Boolean);
  return { handle: p.handle, titel_fr: p.title, prijs: r2(N(v.price) / 100), variant: v.id || null, beschikbaar: !!(p.available && v.available), gewicht: N(v.weight) || null,
    pp: leesPp(p.description), maat: leesMaat(p.description), beelden, tags: p.tags || [], materiaal_ok: /acier|inox|316/i.test(p.title + ' ' + (p.tags || []).join(' ') + ' ' + tekst(p.description).slice(0, 400)) && !/plaqué|plaquee?s? (or|argent)\b/i.test(p.title), url: BJX_BRON + '/products/' + p.handle };
}
async function haalProduct(handle) {
  const r = await fetch(BJX_BRON + '/products/' + encodeURIComponent(handle) + '.js', { headers: { 'user-agent': 'Mozilla/5.0 (compatible; Kadoly/1.0; +https://kadoly.com)', accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
  if (r.status === 404) return { weg: true };
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return bjxNorm(await r.json());
}
// Catalogus van alleen de gekozen stukken (plus de kettingen en het gravuresupplement), 3 uur bewaard; bij een storing de laatste goede versie (tot 48 uur).
export async function bjxCatalogus({ vers = false } = {}) {
  const oud = await kv.get(K.cat).catch(() => null);
  if (!vers && oud && Date.now() - Date.parse(oud.at + 'Z') < BJX_REGEL.CACHE_UUR * 3600e3) return oud;
  const handles = [...new Set(BJX_KEUZE.flatMap(k => k.delen.map(d => d.handle)).concat('supplement-gravure'))];
  const producten = {}, fouten = {}; let i = 0;
  await Promise.all(Array.from({ length: 8 }, async () => { while (i < handles.length) { const h = handles[i++]; try { producten[h] = await haalProduct(h); } catch (e) { fouten[h] = String(e.message || e).slice(0, 80); const o = oud && oud.producten && oud.producten[h]; if (o && Date.now() - Date.parse(oud.at + 'Z') < BJX_REGEL.OUD_UUR * 3600e3) producten[h] = Object.assign({}, o, { oud: true }); } } }));
  const cat = { at: nu(), producten, fouten };
  if (Object.keys(producten).length) await kv.set(K.cat, cat, { ex: 7 * 86400 }).catch(() => {});
  return cat;
}

// ---------- de feed ----------
function omschrijving(k, delen) {
  const r = [];
  if (k.soort === 'ketting' && k.hoek === 'naam') { const h = delen.find(d => d.rol === 'hanger'); r.push('Hanger van roestvrij staal' + (h && h.maat ? ' (' + h.maat + ')' : '') + ' aan een ' + (delen.find(d => d.rol === 'ketting') || {}).tekst + '.'); }
  else if (k.soort === 'armband' && k.hoek === 'naam') r.push('Schakelarmband van roestvrij staal met een plaatje om te graveren' + (delen[0].maat ? ' (' + delen[0].maat + ')' : '') + '.');
  else if (k.steen) r.push((k.soort === 'armband' ? 'Armband' : 'Ketting') + ' van ' + (k.kleur || 'roestvrij staal') + ' met ' + k.steen + ' (natuursteen; elke steen is net anders van kleur en tekening)' + (delen[0].maat ? '. Maat: ' + delen[0].maat : '') + '.');
  else if (/koffieboon/.test(k.titel)) r.push('Ketting en bijpassende armband van roestvrij staal 316L met koffieboonschakel' + (delen[0].maat ? '. Maten: ' + delen[0].maat.replace(/collier/i, 'ketting').replace(/bracelet/i, 'armband') : '') + '.');
  else r.push('Ketting, oorbellen en armband van zilverkleurig roestvrij staal met zwarte zirkonia, als set.');
  if (k.gravure) r.push('Wij laten de voorkant graveren met jouw tekst (hooguit ' + k.gravure.max + ' tekens); de gravure zit in de prijs.');
  r.push('Roestvrij staal verkleurt niet en kan tegen water. Levertijd ' + BJX_REGEL.LEVER_MIN + ' tot ' + BJX_REGEL.LEVER_MAX + ' werkdagen.');
  return r.join(' ');
}

export async function bjxBouw({ vers = false } = {}) {
  const cat = await bjxCatalogus({ vers }); const P = cat.producten || {};
  const sup = P['supplement-gravure'] || null; const producten = [], weg = [];
  for (const k of BJX_KEUZE) {
    const delen = k.delen.map(d => Object.assign({}, d, P[d.handle] || { ontbreekt: true }));
    const reden = [];
    for (const d of delen) {
      if (d.ontbreekt) reden.push(d.handle + ': niet gevonden bij Bijouxmode' + (cat.fouten && cat.fouten[d.handle] ? ' (' + cat.fouten[d.handle] + ')' : ''));
      else if (d.weg) reden.push(d.handle + ': bestaat niet meer');
      else { if (!d.beschikbaar) reden.push(d.handle + ': uitverkocht'); if (!d.materiaal_ok) reden.push(d.handle + ': materiaal niet duidelijk staal'); }
    }
    if (WAARBORG.test(k.titel)) reden.push('titel botst met de Waarborgwet');
    if (reden.length) { weg.push({ id: k.id, titel: k.titel, reden }); continue; }
    const rk = bjxReken({ delen: delen.map(d => ({ prijs: d.prijs, pp: d.pp ? d.pp.tot : null, rol: d.rol })), gravure: k.gravure });
    if (!rk.ok) { weg.push({ id: k.id, titel: k.titel, reden: rk.reden, inkoop: rk.inkoop, prijs: rk.prijs }); continue; }
    if (rk.marge < BJX_REGEL.MIN_MARGE) { weg.push({ id: k.id, titel: k.titel, reden: ['marge ' + rk.marge + ' onder ' + BJX_REGEL.MIN_MARGE] }); continue; }
    const hoek = BJX_HOEK[k.hoek]; const oms = omschrijving(k, delen);
    producten.push({ sku: 'BJX-' + k.id, id: k.id, titel: k.titel, omschrijving: oms, merk: 'Kadoly', leverancier: 'Bijouxmode',
      hoek: hoek.id, hoeknaam: hoek.naam, categorie: 'Sieraden > ' + k.sub, subcategorie: k.sub, soort: k.soort, voor: k.voor || 'haar',
      materiaal: k.kleur ? 'roestvrij staal (' + k.kleur.replace(' staal', '') + ')' : /316L/.test(k.titel) ? 'roestvrij staal 316L' : 'roestvrij staal', steen: k.steen || null,
      maten: delen.map(d => d.maat).filter(Boolean),
      inkoop: rk.inkoop, inkoop_btw: 'excl', inkoop_regels: { delen: r2(delen.reduce((a, d) => a + d.prijs, 0)), gravure: rk.gravureKost, dropship: rk.dropship, eigen_verzending: eigenVerzend(), betaalkosten: BJX_REGEL.BETAAL },
      adviesprijs: rk.adviesprijs, prijs_kadoly: rk.prijs, gratis_verzending: false, verzending_klant: BJX_REGEL.KLANT_VERZEND,
      levertijd: { min: BJX_REGEL.LEVER_MIN, max: BJX_REGEL.LEVER_MAX }, levertijd_tekst: BJX_REGEL.LEVER_MIN + ' tot ' + BJX_REGEL.LEVER_MAX + ' werkdagen', op_voorraad: true,
      beelden: [...new Set(delen.flatMap(d => d.rol === 'ketting' && delen.length > 1 ? [] : d.beelden).concat(delen.length > 1 ? (delen.find(d => d.rol === 'ketting') || {}).beelden || [] : []))].slice(0, 6),
      gravure: k.gravure ? { ja: true, verplicht: true, kant: 'voorkant', tekst_max: k.gravure.max, inbegrepen: true, veld: 'Naam of tekst voor de gravure (hooguit ' + k.gravure.max + ' tekens)', gratis_bij_leverancier: !!k.gravure.gratis } : null,
      bjx: { delen: delen.map(d => ({ handle: d.handle, rol: d.rol, variant: d.variant, prijs: d.prijs, url: d.url, oud: !!d.oud })), gravure_variant: k.gravure && !k.gravure.gratis && sup ? sup.variant : null },
      keur: { ok: true, marge: rk.marge, grens: rk.grens, label: 'bjx', marge_bak: rk.marge >= 20 ? '20+' : '15-20' } });
  }
  const stand = { at: nu(), catalogus: cat.at, gekozen: BJX_KEUZE.length, inFeed: producten.length, perHoek: producten.reduce((a, p) => (a[p.hoek] = (a[p.hoek] || 0) + 1, a), {}), weggelaten: weg.length, weg, fouten: cat.fouten || {} };
  await kv.set(K.stand, Object.assign({}, stand, { weg: weg.map(w => ({ id: w.id, reden: w.reden })) }), { ex: 7 * 86400 }).catch(() => {});
  return { producten, weg, stand };
}

export async function bjxFeed({ start = 0, size = 250, vers = false } = {}) {
  start = Math.max(0, Number(start) || 0); size = Math.min(500, Math.max(1, Number(size) || 250));
  const { producten, stand } = await bjxBouw({ vers });
  return { bron: 'bijouxmode', totaal: producten.length, start, size, volgende: start + size < producten.length ? '/api/dp?op=bjxfeed&start=' + (start + size) + '&size=' + size : null,
    regel: 'prijs_kadoly incl. btw, verzending EUR ' + BJX_REGEL.KLANT_VERZEND.toFixed(2).replace('.', ',') + ' per bestelling; elk product alleen in zijn hoek (' + Object.values(BJX_HOEK).map(h => h.id).join(', ') + '), niet tussen de rest; gravure: een verplicht tekstveld met tekst_max tekens, mee in de order als gravure_tekst; niet meer in de feed = offline',
    aantal: Math.min(size, Math.max(0, producten.length - start)), bijgewerkt: stand.at, catalogus: stand.catalogus, producten: producten.slice(start, start + size) };
}
export async function bjxStand() { const s = await kv.get(K.stand).catch(() => null); const o = (await kv.get(K.orders).catch(() => null)) || {}; return Object.assign({ ok: !!s }, s || { fout: 'nog geen feed gebouwd: open /api/dp?op=bjxfeed' }, { orders: Object.keys(o).length, open: Object.values(o).filter(x => !x.besteld).length }); }

// ---------- orders (geen API bij Bijouxmode: bewaren, melden, Henkjan bestelt met de mandje-link) ----------
async function logRegel(t) { try { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: new Date().toISOString(), wie: 'bijouxmode', tekst: String(t).slice(0, 900) })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } catch (e) {} }
async function meld(t) { const s = process.env.MELD_SLEUTEL; if (!s) return false; try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'Kadoly Bijouxmode', tekst: t.slice(0, 3800) }), signal: AbortSignal.timeout(8000) }); return r.ok; } catch (e) { return false; } }
export function mandjeLink(regels) { const m = {}; for (const r of regels) for (const [v, n] of r.varianten) if (v) m[v] = (m[v] || 0) + n; return BJX_BRON + '/cart/' + Object.entries(m).map(([v, n]) => v + ':' + n).join(','); }
// b = { order_id, klant: { naam, email, telefoon, adres1, adres2, plaats, postcode, land }, regels: [{ sku: 'BJX-<id>', aantal, gravure_tekst }] }
export async function bjxNieuweOrder(b) {
  const k = (b && b.klant) || {}; if (!b || !b.order_id || !Array.isArray(b.regels) || !b.regels.length || !k.naam || !k.adres1 || !k.postcode || !k.plaats) return { ok: false, fout: 'order_id, regels, naam en adres (adres1, postcode, plaats) zijn nodig' };
  const alle = (await kv.get(K.orders).catch(() => null)) || {}; if (alle[b.order_id]) return Object.assign({ ok: true, al: true }, alle[b.order_id]);
  const { producten } = await bjxBouw({}); const per = new Map(producten.map(p => [p.sku, p])); const regels = [], fout = [];
  for (const r of b.regels) {
    const p = per.get(String(r.sku || '')); const n = Math.max(1, Math.round(N(r.aantal) || 1)); if (!p) { fout.push(r.sku + ' staat niet (meer) in de feed'); continue; }
    const g = String(r.gravure_tekst || '').trim(); if (p.gravure && !g) fout.push(r.sku + ': gravure_tekst ontbreekt'); if (p.gravure && g.length > p.gravure.tekst_max) fout.push(r.sku + ': gravure_tekst langer dan ' + p.gravure.tekst_max);
    regels.push({ sku: p.sku, titel: p.titel, aantal: n, gravure_tekst: g || null, delen: p.bjx.delen.map(d => ({ handle: d.handle, url: d.url, variant: d.variant })), varianten: p.bjx.delen.map(d => [d.variant, n]).concat(p.gravure && p.bjx.gravure_variant ? [[p.bjx.gravure_variant, n]] : []) });
  }
  if (fout.length) return { ok: false, fout: fout.join('; ') };
  const rec = { order_id: b.order_id, at: nu(), klant: { naam: k.naam, adres1: k.adres1, adres2: k.adres2 || '', postcode: k.postcode, plaats: k.plaats, land: String(k.land || 'NL').toUpperCase().slice(0, 2), telefoon: k.telefoon || '', email: k.email || '' },
    regels: regels.map(r => ({ sku: r.sku, titel: r.titel, aantal: r.aantal, gravure_tekst: r.gravure_tekst, delen: r.delen })), mandje: mandjeLink(regels), besteld: false,
    let_op: 'Bestellen als dropship (EUR 2 per stuk), verzending Colissimo naar het adres van de klant. Hanger aan de ketting laten zetten; gravure op de voorkant met de tekst per regel.' };
  alle[b.order_id] = rec; await kv.set(K.orders, alle, { ex: 120 * 86400 }).catch(() => {});
  const regelsTekst = rec.regels.map(r => r.aantal + 'x ' + r.titel + (r.gravure_tekst ? ' (gravure: "' + r.gravure_tekst + '")' : '')).join('; ');
  await logRegel('Bijouxmode-order ' + b.order_id + ' binnen: ' + regelsTekst + '. Bestellen met de mandje-link uit /api/dp?op=bjxorders (beschermde host).');
  rec.gemeld = await meld('Nieuwe Kadoly-order voor Bijouxmode ' + b.order_id + ': ' + regelsTekst + '. Mandje en adres: https://hjdk-api-henq.vercel.app/api/dp?op=bjxorders');
  return Object.assign({ ok: true }, rec);
}
export async function bjxOrders() { return (await kv.get(K.orders).catch(() => null)) || {}; }
export async function bjxBesteld(id, ref) { const alle = await bjxOrders(); if (!alle[id]) return { ok: false, fout: 'order onbekend' }; alle[id].besteld = nu(); alle[id].bjx_ref = String(ref || '').slice(0, 60) || null; await kv.set(K.orders, alle, { ex: 120 * 86400 }); await logRegel('Bijouxmode-order ' + id + ' besteld' + (ref ? ' (' + ref + ')' : '')); return { ok: true, order: alle[id] }; }
