// Keuring van Droppery-producten voor de Kadoly-winkel en Google Shopping (21 nov 2026, Henkjan: "Ja 1 - 3 gaan we doen",
// op het voorstel: "Elk product dat binnenkomt krijgt een score op vier punten: niet te vergelijken, marge, levertijd en vraag
// volgens Demand Radar. Alleen de winnaars gaan naar de shop en naar Google Shopping, met een eigen label om op te bieden.").
// Puur rekenwerk, geen opslag: gebruikt door lib/droppery.js (dpFeed) en lib/dpapi.js (catalogus via de webshop-API).

export const KEUR_REGEL = {
  MIN_MARGE: 15,        // euro per verkoop na btw, inkoop, verzending en betaalkosten (zelfde grens als de pakketten)
  MAX_LEVERTIJD: 14,    // werkdagen; langer verkoopt niet als cadeau
  MIN_SCORE: 40,        // daaronder niet in de winkel
  TOP: 65,              // label dp-top (hoogste bod in Shopping)
  GEWICHT: { uniek: 0.30, marge: 0.30, levertijd: 0.15, vraag: 0.25 },
};

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const klem = x => Math.max(0, Math.min(1, x));

// verkoopprijs: de Droppery-prijs (kortingsprijs als die er is), nooit boven de adviesprijs (21 nov: de shop rekende sommige meubels boven advies)
export function verkoopPrijs(p) {
  const adv = N(p.adviesprijs), pr = N(p.prijs) || adv;
  return adv ? Math.min(pr, adv) : pr;
}
// verzending naar NL als de leverancier die niet meegeeft: Modus Furniture per gewicht (lib/dp-inkoop.js), anders 15
export function verzendSchat(p) {
  if (p.verzend_nl != null && p.verzend_nl !== '') return { eur: N(p.verzend_nl), geschat: false };
  const kg = N(p.gewicht);
  if (kg > 100) return { eur: 85, geschat: true }; if (kg > 50) return { eur: 70, geschat: true }; if (kg > 32) return { eur: 65, geschat: true }; if (kg > 20) return { eur: 40, geschat: true };
  if (kg) return { eur: 15, geschat: true };
  const c = categorieVan(p.titel); // geen gewicht bekend: meubels als zwaar rekenen, zodat de marge niet te mooi uitvalt
  return { eur: c === 'Eettafels' || c === 'Kasten' || c === 'Bedden' ? 70 : c === 'Tafels' ? 40 : c === 'Tuin en barbecue' ? 59 : 15, geschat: true };
}
export function marge(prijs, inkoopEx, verzend) { return prijs / 1.21 - inkoopEx - verzend - (0.029 * prijs + 0.30); }

// ---------- vraag uit Demand Radar (lib/kadoly-vraag.js haalVraag) ----------
const SYN = [[/\bhangers?\b/g, ' hanglamp '], [/\b(mediaconsole|mediameubel|tv-meubel|tvmeubel)\b/g, ' tv meubel '], [/\bplatformbed\b/g, ' bed '], [/\bcommode\b/g, ' ladekast '], [/\bkoraal\b/g, ' coral ']];
const STOP = new Set(['de', 'het', 'een', 'en', 'van', 'met', 'in', 'voor', 'op', 'te', 'kopen', 'goedkoop', 'online', 'bestellen', 'kado', 'cadeau']);
const stam = w => (w.length > 5 && /en$/.test(w)) ? w.slice(0, -2) : (w.length > 4 && /s$/.test(w)) ? w.slice(0, -1) : w;
export function woorden(t) {
  let s = ' ' + String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + ' ';
  for (const [re, nw] of SYN) s = s.replace(re, nw);
  return s.split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w)).map(stam);
}
// index: [{w:[woorden], v, k}] uit alle thema's en markten, per zoekterm het hoogste maandvolume
export function vraagIndex(vraag) {
  const m = new Map();
  for (const d of Object.values(vraag || {})) for (const x of (d && d.termen) || []) {
    const k = String(x.k || '').toLowerCase(); const v = N(x.v); if (!k || !v) continue;
    if (!m.has(k) || m.get(k).v < v) m.set(k, { k, v, w: [...new Set(woorden(k))] });
  }
  return [...m.values()].filter(x => x.w.length && !x.w.every(w => ALGEMEEN.has(w)));
}
// zoektermen die na de stopwoorden alleen een kleur of maat zijn, zeggen niets over vraag naar het product (21 nov: "orange cadeau" telde 720 voor elk oranje AW-product)
const ALGEMEEN = new Set(['orange', 'oranje', 'red', 'rood', 'rode', 'blue', 'blauw', 'blauwe', 'green', 'groen', 'groene', 'black', 'zwart', 'zwarte', 'white', 'wit', 'witte', 'gold', 'goud', 'gouden', 'silver', 'zilver', 'pink', 'roze', 'purple', 'paar', 'paars', 'brown', 'bruin', 'grey', 'gray', 'grijs', 'yellow', 'geel', 'large', 'groot', 'grote', 'small', 'klein', 'kleine', 'mini', 'xl', 'set', 'sets', 'nieuw', 'mooi', 'mooie', 'leuk', 'leuke', 'beste', 'top', 'heren', 'dame', 'man', 'vrouw', 'kind', 'kinderen']);
// beste zoekterm waarvan alle woorden in de titel staan (langste term wint bij gelijk volume: specifieker)
export function vraagVan(titel, idx) {
  const t = new Set(woorden(titel)); let best = null;
  for (const x of idx || []) if (x.w.every(w => t.has(w))) { if (!best || x.v > best.v || (x.v === best.v && x.w.length > best.w.length)) best = x; }
  return best ? { term: best.k, perMaand: best.v } : { term: '', perMaand: 0 };
}

// ---------- de keuring zelf ----------
// p: { titel, sku, ean, prijs, adviesprijs, inkoop (excl. btw), verzend_nl?, gewicht?, levertijd? (werkdagen), voorraad?, op_voorraad? }
export function keurProduct(p, idx, { onderdelen = new Set(), scoreGrens = true } = {}) { // scoreGrens false: vraagdata ontbreekt even, dan geen afkeur op score
  const R = KEUR_REGEL, reden = [];
  const prijs = verkoopPrijs(p); const vz = verzendSchat(p); const ink = p.inkoop == null || p.inkoop === '' ? null : N(p.inkoop);
  const m = ink == null ? null : Math.round(marge(prijs, ink, vz.eur) * 100) / 100;
  const lt = p.levertijd == null || p.levertijd === '' ? null : N(p.levertijd);
  const ean = String(p.ean || '').replace(/\D/g, '');
  const vr = vraagVan(p.titel, idx);
  // vier punten, elk 0 tot 1
  const punten = {
    uniek: ean.length >= 8 ? 0.35 : 1, // zonder EAN zet Google het niet naast andere winkels
    marge: m == null ? 0 : klem((Math.log(Math.max(m, 1)) - Math.log(R.MIN_MARGE)) / (Math.log(400) - Math.log(R.MIN_MARGE))),
    levertijd: lt == null ? 0.5 : lt <= 2 ? 1 : lt <= 4 ? 0.8 : lt <= 7 ? 0.5 : lt <= R.MAX_LEVERTIJD ? 0.2 : 0,
    vraag: vr.perMaand ? klem(Math.log10(vr.perMaand) / 5) : 0,
  };
  const G = R.GEWICHT; const score = Math.round(100 * (G.uniek * punten.uniek + G.marge * punten.marge + G.levertijd * punten.levertijd + G.vraag * punten.vraag));
  // harde grenzen
  let rol = 'product';
  if (p.sku && onderdelen.has(p.sku)) { rol = 'onderdeel'; reden.push('alleen als onderdeel bij een hanglamp (fitting)'); }
  if (m == null) reden.push('inkoopprijs onbekend');
  else if (m < R.MIN_MARGE) reden.push('marge ' + m.toFixed(2) + ' onder ' + R.MIN_MARGE);
  if (lt != null && lt > R.MAX_LEVERTIJD) reden.push('levertijd ' + lt + ' werkdagen');
  if (p.op_voorraad === false || (p.voorraad != null && p.voorraad !== '' && N(p.voorraad) <= 0)) reden.push('niet op voorraad');
  if (scoreGrens && !reden.length && score < R.MIN_SCORE) reden.push('score ' + score + ' onder ' + R.MIN_SCORE);
  const ok = !reden.length;
  const label = !ok ? 'dp-uit' : score >= R.TOP ? 'dp-top' : 'dp-mid';
  const margeBak = m == null ? 'onbekend' : m >= 250 ? '250+' : m >= 100 ? '100-250' : m >= 40 ? '40-100' : '15-40';
  return { ok, score, label, rol, punten, prijs, marge: m, margeBak, verzend: vz.eur, verzendGeschat: vz.geschat, levertijd: lt, vraag: vr, reden };
}

// categorie voor de winkel en Google (product_type), uit de titel
const CAT = [['Verlichting', /hanglamp|hanger|lamp|fitting|verlichting|pendant|lighting/], ['Eettafels', /eettafel|dining table/], ['Tafels', /consoletafel|salontafel|bijzettafel|tafel|console table|coffee table|side table/], ['Kasten', /dressoir|ladekast|commode|mediaconsole|mediameubel|tv-?meubel|kast|sideboard|dresser|chest|media console|cabinet/], ['Bedden', /platformbed|\bbed\b/], ['Tuin en barbecue', /kamado|barbecue|bbq/], ['Keuken', /fondue|theeset|thee|keuken|mes(sen)?\b|glas|brulee|brûlée|servies|pan\b/]];
export function categorieVan(titel) { const t = String(titel || '').toLowerCase(); const c = CAT.find(([, re]) => re.test(t)); return c ? c[0] : 'Wonen'; }

// samenvatting voor de stand en het verslag
export function keurStand(lijst) {
  const ok = lijst.filter(x => x.keur.ok); const reden = {};
  for (const x of lijst) for (const r of x.keur.reden) { const k = r.replace(/[\d.,]+/g, '#'); reden[k] = (reden[k] || 0) + 1; }
  return { producten: lijst.length, inWinkel: ok.length, top: ok.filter(x => x.keur.label === 'dp-top').length, afgekeurd: lijst.length - ok.length, redenen: reden, margeInWinkel: Math.round(ok.reduce((s, x) => s + N(x.keur.marge), 0)) };
}
