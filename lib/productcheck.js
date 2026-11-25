// Productcheck Kadoly (25 nov 2026, Henkjan: "doe 2" op het advies "kloppende productgegevens, elke nacht gecontroleerd").
// Loopt over de hele catalogus en zoekt tegenstrijdigheden die vertrouwen kosten, met per product een kant-en-klaar voorstel:
// - waarborg: "18k goud", "gouden" of "goud" bij verguld zilver, vermeil, plated, staal of messing (Waarborgwet: alleen echt goud heet goud)
// - uitvoering: de titel noemt twee materialen of kleuren ("zilver of goud") terwijl er niets te kiezen is
// - vulwoorden: Elegante, Stijlvolle, Delicate, "voor tijdloze stijl": catalogustaal zonder informatie
// - merk: merknaam achter in de titel (het merk staat al apart op de pagina)
// - engels: Engelse woorden in een Nederlandse titel
// - categorie: planten en bloemen bij beauty of verzorging
// - lang: titel langer dan 70 tekens na opschonen
// Geen AI nodig: vaste regels, dus elke nacht gratis en voorspelbaar. Het voorstel past de winkel toe (TAAK F in lib/shopprompt.js).
const VUL = ['elegante?', 'stijlvolle?', 'delica(?:te|at)', 'prachtige?', 'mooie?', 'luxe', 'luxueuze?', 'gezellige?', 'moderne?', 'tijdloze?', 'unieke?', 'klassieke?', 'schattige?', 'charmante?', 'verfijnde?', 'exclusieve?', 'sierlijke?', 'trendy', 'chique', 'fijne?', 'dromerige?', 'perfecte?', 'speelse?', 'opvallende?', 'betoverende?'];
const VUL_RE = new RegExp('^(?:(?:' + VUL.join('|') + ')\\s+)+', 'i');
const VUL_STAART = /\s+(?:voor|for)\s+(?:een\s+)?(?:tijdloze|moderne|elegante|stijlvolle|elke|iedere|dagelijkse|speciale)\s+(?:stijl|look|gelegenheid|dag|momenten|style|occasion)\b.*$/i;
const PLATED = /\b(vermeil|verguld|vergulde|plated|geplateerd|geplateerde|geplakt|geplakte|gold[- ]?filled|rvs|roestvrij|roestvrijstaal|roestvrijstalen|staal|stalen|stainless|messing|brass|edelstaal|titanium|925|sterling|zilver|zilveren|silver)\b/i;
const ECHT_GOUD = /\b(massief|massieve|solid|585|750|375)\b/i;
const EN = { earrings: 'oorbellen', earring: 'oorbel', necklace: 'ketting', bracelet: 'armband', ring: 'ring', stud: 'stud', studs: 'studs', pendant: 'hanger', with: 'met', and: 'en', by: 'van', silver: 'zilver', gold: 'goud', pearl: 'parel', pearls: 'parels', heart: 'hart', star: 'ster' };
const EN_WOORD = /\b(earrings?|necklace|bracelet|pendant|with|by|silver|gold|pearls?|heart|star|stainless)\b/i;
const PLANT = /\b(orchidee|orchideeen|orchideeën|kamerplant|plant|planten|bloemen|boeket|vetplant|cactus)\b/i;
const BEAUTY = /beauty|verzorging|make-?up|cosmetica|parfum|huidverzorging/i;
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const schoon = s => String(s).replace(/\s{2,}/g, ' ').replace(/\s+([,.)])/g, '$1').replace(/^[\s,;:\-–—]+|[\s,;:\-–—]+$/g, '').trim();
const hoofd = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

export function checkProduct(it) {
  const t0 = String(it.t || ''), merk = String(it.b || '').trim(), cat = (String(it.c || '') + ' ' + String(it.s || '')).trim();
  const issues = []; let t = t0;
  // merk achteraan of na een komma
  if (merk && merk.length >= 3) {
    const kort = merk.replace(/\s+(jewels made with love|jewellery|jewelry|sieraden|bv|b\.v\.)$/i, '').trim();
    const namen = [...new Set([merk, kort].filter(x => x.length >= 3))].map(esc).join('|');
    const re = new RegExp('(?:\\s*[,\\-–|]\\s*|\\s+(?:van|door|by|from)\\s+|\\s+)(?:' + namen + ')(?:\\s+(?:jewels made with love|jewellery|jewelry|sieraden))?\\s*$', 'i');
    if (re.test(t)) { t = t.replace(re, ''); issues.push('merk'); }
  }
  t = t.replace(/\s*,\s*[A-Z][A-Z &]{2,}$/, ''); // ", GLAM & GLORY" en dergelijke in hoofdletters
  // uitvoering: twee materialen in de titel; het voorstel laat het materiaal weg tot de uitvoering vaststaat
  const twee = /,?\s*(?:\b925\s+)?(?:sterling\s+)?\b(?:zilver|silver|zilveren)\s*(?:of|or|\/)\s*(?:goud|gold|gouden|goudkleurig\w*|verguld\w*)\b/i;
  const tweeOm = /,?\s*(?:in\s+)?(?:\d{2}\s?k(?:arat|t)?\s+)?\b(?:goud|gold|gouden)\s*(?:of|or|\/)\s*(?:zilver|silver|zilveren)\b(?:\s+afwerking)?/i;
  const tweeIn = /,?\s*\bin\s+(?:zilver|silver)\s*(?:of|or|\/)\s*(?:goud|gold)\b/i;
  if (tweeIn.test(t)) t = t.replace(tweeIn, ''); if (twee.test(t)) t = t.replace(twee, ''); if (tweeOm.test(t)) t = t.replace(tweeOm, '');
  // samengestelde woorden en karaat bij verguld werk: "14K Goudvergulde" en "18k Verguld" zijn geen goud
  if (/\bgoud(?:verguld|vergulde|geplateerd|geplateerde|geplakt|geplakte)\b/i.test(t) || (/\b\d{2}\s?k(?:arat|t)?\b/i.test(t) && PLATED.test(t0 + ' ' + cat) && !ECHT_GOUD.test(t0))) {
    if (!issues.includes('waarborg')) issues.push('waarborg');
    t = t.replace(/\bgoud(?:verguld|vergulde|geplateerd|geplateerde|geplakt|geplakte)\b/ig, 'verguld').replace(/\b\d{2}\s?k(?:arat|t)?\b\s*(?=(?:verguld|vergulde|geplateerd|plated|vermeil))/ig, '');
  }
  // waarborg
  const goudWoord = /\b(\d{2}\s?k(?:arat|t)?\s*)?(goud|gouden|gold|golden)\b/i;
  if (goudWoord.test(t) && PLATED.test(t0 + ' ' + cat) && !ECHT_GOUD.test(t0)) {
    if (!issues.includes('waarborg')) issues.push('waarborg');
    t = t.replace(/\b\d{2}\s?k(?:arat|t)?\s*(?:goud|gold)\s*(?:vermeil)\b/ig, 'verguld zilver')
      .replace(/\b(?:\d{2}\s?k(?:arat|t)?\s*)?(?:goud|gold)\s*(?:verguld|vergulde|geplateerd|geplateerde|geplakt|geplakte|plated)\b/ig, 'verguld')
      .replace(/\b(?:verguld|vergulde|geplateerd|geplateerde)\s+\d{2}\s?k(?:arat|t)?\b/ig, 'verguld')
      .replace(/\b(?:gouden|gold)\s+(?:vermeil|vergulde?|geplateerde?|plated)\b/ig, 'verguld')
      .replace(/\b(?:goud|gold)\s+vermeil\b/ig, 'verguld zilver')
      .replace(/\bvermeil\b/ig, 'verguld zilver')
      .replace(/\b\d{2}\s?k(?:arat|t)?\b\s*/ig, '')
      .replace(/\bgouden\b/ig, 'goudkleurige').replace(/\bgolden\b/ig, 'goudkleurig')
      .replace(/\b(?:goud|gold)\b(?!kleur)/ig, 'goudkleurig');
    t = t.replace(/\bverguld\s+verguld\b/ig, 'verguld').replace(/\bgoudkleurige?\s+verguld/ig, 'verguld').replace(/\bverguld zilver(en)?\s+(?:925\s+)?(?:sterling\s+)?zilver(en)?\b/ig, 'verguld zilver').replace(/\bverguld(e)?\s+sterling\s+zilveren\b/ig, 'verguld zilveren');
  }
  // uitvoering: twee materialen of kleuren in één titel zonder keuze
  if (/\b(zilver|silver|zilveren)\s*(?:of|or|\/)\s*(goud|gold|gouden|goudkleurig\w*|verguld\w*)\b/i.test(t0) || /\b(goud|gold|gouden)\s*(?:of|or|\/)\s*(zilver|silver)\b/i.test(t0)) issues.push('uitvoering');
  // vulwoorden
  const voor = t; t = t.replace(VUL_RE, '').replace(VUL_STAART, ''); if (t !== voor) issues.push('vulwoorden');
  // engels
  if (EN_WOORD.test(t)) { issues.push('engels'); t = t.replace(/\bstainless\s+steel\b/ig, 'roestvrij staal').replace(/\b[A-Za-z]+\b/g, w => EN[w.toLowerCase()] || w); }
  // categorie
  let categorie = null; if (PLANT.test(t0) && BEAUTY.test(cat)) { issues.push('categorie'); categorie = 'Wonen > Planten en bloemen'; }
  t = hoofd(schoon(t));
  if (t.length > 70) issues.push('lang');
  const nieuw = t && t !== t0 ? t : null;
  return { id: it.id, titel: t0, voorstel: nieuw, issues, categorie, merk: merk || undefined, cat: cat || undefined };
}

export function checkCatalogus(items) {
  const rijen = (items || []).filter(i => i && i.vr !== false).map(checkProduct).filter(r => r.issues.length);
  const per = {}; rijen.forEach(r => r.issues.forEach(x => { per[x] = (per[x] || 0) + 1; }));
  const volg = ['uitvoering', 'waarborg', 'categorie', 'engels', 'merk', 'vulwoorden', 'lang'];
  rijen.sort((a, b) => Math.min(...a.issues.map(x => volg.indexOf(x))) - Math.min(...b.issues.map(x => volg.indexOf(x))));
  return { producten: (items || []).length, metIssue: rijen.length, perSoort: per, rijen };
}

export function checkTekst(r, max = 40) {
  const L = ['Productcheck Kadoly: ' + r.metIssue + ' van ' + r.producten + ' producten met iets om te verbeteren.', 'Per soort: ' + Object.entries(r.perSoort).map(([k, v]) => k + ' ' + v).join(', ') + '.', ''];
  for (const x of r.rijen.slice(0, max)) L.push('- ' + x.id + ' [' + x.issues.join(', ') + '] ' + x.titel + (x.voorstel ? '\n    wordt: ' + x.voorstel : '') + (x.categorie ? '\n    categorie: ' + x.categorie : '') + (x.issues.includes('uitvoering') ? '\n    uitvoering bevestigen bij de leverancier en één kiezen, of een keuze in de winkel' : ''));
  if (r.rijen.length > max) L.push('... en ' + (r.rijen.length - max) + ' meer (vorm=json).');
  return L.join('\n');
}
