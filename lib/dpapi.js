// Droppery webshop-API voor Kadoly (21 nov 2026, Henkjan: "Heb je geen droppery API ?").
// Henkjan maakt in platform.droppery.io (menu API token) een token en plakt die op /api/dp?op=token (alleen de beschermde
// vercel.app-host). Opslag in KV dp:api:token; DROPPERY_API_TOKEN in Vercel werkt ook. Het token komt nooit in een antwoord.
// Basis https://platform.droppery.io/api/v1/webshop (Bearer). De productlijst geeft de producten van de leveranciers die aan de
// shop gekoppeld zijn (inkoop excl. btw, adviesprijs incl. btw, EAN, voorraad, levertijd), hooguit 100 per pagina.
// De nachtronde (cron 04:53 UTC, op=nacht) leest de hele catalogus in stukken in (dp:api:cat:<pagina>), keurt elk product
// (lib/dpkeur.js) en zet de winnaars die nog niet in de brug staan op de importlijst (dp:api:keur).
import { kv } from './db.js';
import { keurProduct, vraagIndex, categorieVan, keurStand } from './dpkeur.js';
import INKOOP from './dp-inkoop.js';

export const DP_API = 'https://platform.droppery.io/api/v1/webshop';
const K = { token: 'dp:api:token', paging: 'dp:api:paging', meta: 'dp:api:meta', cursor: 'dp:api:cursor', keur: 'dp:api:keur', idx: 'dp:vraagidx' };
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const nu = () => new Date().toISOString().replace(/\.\d+Z$/, '');

export async function dpToken() { if (process.env.DROPPERY_API_TOKEN) return process.env.DROPPERY_API_TOKEN; try { return ((await kv.get(K.token)) || {}).token || ''; } catch (e) { return ''; } }
export async function dpTokenStand() { const t = await kv.get(K.token).catch(() => null); return { klaar: !!(process.env.DROPPERY_API_TOKEN || (t && t.token)), bron: process.env.DROPPERY_API_TOKEN ? 'env' : t ? 'kv' : null, sinds: t ? t.at : null, laatsteTest: t ? t.test : null }; }

export async function dpApi(pad, params = {}, token) {
  const t = token || await dpToken(); if (!t) return { st: 0, fout: 'geen token' };
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '').map(([k, v]) => [k, String(v)])).toString();
  const u = DP_API + '/' + String(pad || '').replace(/^\/+/, '') + (qs ? '?' + qs : '');
  try {
    const r = await fetch(u, { redirect: 'manual', headers: { authorization: 'Bearer ' + t, accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
    const tekst = await r.text(); let data = null; try { data = JSON.parse(tekst); } catch (e) {}
    return { st: r.status, data, tekst: data ? null : tekst.slice(0, 2000) };
  } catch (e) { return { st: 0, fout: String(e.message || e).slice(0, 200) }; }
}

// paden proberen om de juiste te vinden (21 nov: /api/v1/webshop/products gaf de HTML van het portaal terug, geen JSON)
const HOST = 'https://platform.droppery.io';
export async function dpProbe(paden) {
  const t = await dpToken(); if (!t) return { fout: 'geen token' }; const uit = [];
  for (const p of paden.slice(0, 16)) {
    const pad = '/' + String(p).replace(/^\/+/, '').replace(/[^a-z0-9/_?=&.-]/gi, '').replace(/\.\./g, '');
    try {
      const r = await fetch(HOST + pad, { redirect: 'manual', headers: { authorization: 'Bearer ' + t, accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      const tekst = await r.text(); let json = null; try { json = JSON.parse(tekst); } catch (e) {}
      uit.push({ pad, st: r.status, ct: r.headers.get('content-type'), naar: r.headers.get('location'), json: !!json, sleutels: json && typeof json === 'object' ? Object.keys(json).slice(0, 12) : null, aantal: json ? lijstVan(json).length : null, totaal: json ? totaalVan(json) : null, begin: json ? JSON.stringify(json).slice(0, 700) : tekst.slice(0, 120) });
    } catch (e) { uit.push({ pad, fout: String(e.message || e).slice(0, 120) }); }
  }
  return uit;
}

// token opslaan na een echte test (1 product ophalen); geeft nooit het token terug
export async function dpTokenZet(token) {
  const t = String(token || '').trim().replace(/^bearer\s+/i, ''); if (t.length < 12 || /\s/.test(t)) return { ok: false, fout: 'Dit lijkt geen token. Kopieer hem opnieuw uit Droppery (menu API token).' };
  const r = await dpApi('product', { size: 1, start: 0 }, t); // pad is enkelvoud (probe 21 nov: /products geeft de HTML van het portaal)
  if (r.st === 401 || r.st === 403) return { ok: false, fout: 'Droppery weigert dit token (' + r.st + '). Maak een nieuw token aan en plak dat.' };
  const test = { at: nu(), st: r.st, json: r.data != null, aantal: lijstVan(r.data).length, totaal: totaalVan(r.data) };
  await kv.set(K.token, { token: t, at: nu(), test });
  const goed = r.st >= 200 && r.st < 300 && r.data != null;
  return { ok: goed, test, fout: goed ? null : 'Opgeslagen, maar Droppery gaf nog geen productlijst terug (' + (r.st || r.fout) + (r.data == null ? ', geen JSON' : '') + '). Ik zoek de juiste route.' };
}

// ---------- vorm van de antwoorden (nog niet gedocumenteerd: ruim lezen) ----------
export function lijstVan(d) {
  if (Array.isArray(d)) return d; if (!d || typeof d !== 'object') return [];
  for (const k of ['data', 'items', 'products', 'results', 'content', 'records', 'rows']) { const v = d[k]; if (Array.isArray(v)) return v; if (v && typeof v === 'object') { const w = lijstVan(v); if (w.length) return w; } }
  return [];
}
export function totaalVan(d) { if (!d || typeof d !== 'object' || Array.isArray(d)) return null; for (const k of ['total', 'totalCount', 'total_count', 'count', 'totalElements', 'recordsTotal']) if (d[k] != null && typeof d[k] !== 'object') return N(d[k]); for (const k of ['meta', 'pagination', 'paging', 'page']) if (d[k] && typeof d[k] === 'object') { const t = totaalVan(d[k]); if (t != null) return t; } return null; }
function pak(o, res, diepte = 2) {
  if (!o || typeof o !== 'object') return null;
  for (const re of res) for (const [k, v] of Object.entries(o)) if (re.test(k) && v != null && v !== '' && typeof v !== 'object') return v;
  if (diepte > 0) for (const [k, v] of Object.entries(o)) if (v && typeof v === 'object' && !Array.isArray(v) && !/brand|supplier|merk|leverancier/i.test(k)) { const r = pak(v, res, diepte - 1); if (r != null) return r; }
  return null;
}
const naamVan = v => v == null ? '' : typeof v === 'object' ? String(v.name || v.title || v.naam || '') : String(v);
// één product uit de API naar de vorm van de keuring en de feed
// velden van GET /api/v1/webshop/product (21 nov 2026): supplier_price_excl(_discounted), retail_price_incl(_discounted), tax_rate,
// delivery_timeframe ("2-5 business days", "5-10"), stock, weight (gram), width/height/length (cm), attributes (NL), categories
const getal = v => v == null || v === '' ? null : N(v);
function levertijdVan(t) { if (t == null || t === '') return null; const m = String(t).match(/\d+/g); return m ? N(m[m.length - 1]) : null; }
export function dpNorm(x) {
  if (x && x.supplier_price_excl != null) {
    const titel = String(x.name || '');
    const attr = {}; for (const a of x.attributes || []) for (const [k, v] of Object.entries(a || {})) attr[k] = v;
    const cats = (x.categories || []).filter(c => !/fees|shopify|newest|all prod|^products$/i.test(c));
    return { api_id: x.id, titel, merk: x.brand || '', leverancier: x.supplier || '', sku: x.sku || '', ean: x.ean || '', voorraad: getal(x.stock), zichtbaar: x.is_visible !== false && !x.is_paused,
      inkoop: getal(x.supplier_price_excl_discounted != null ? x.supplier_price_excl_discounted : x.supplier_price_excl), inkoop_normaal: getal(x.supplier_price_excl),
      adviesprijs: getal(x.retail_price_incl), prijs: getal(x.retail_price_incl_discounted != null ? x.retail_price_incl_discounted : x.retail_price_incl), btw: getal(x.tax_rate),
      levertijd: x.delivery_max_days != null ? N(x.delivery_max_days) : levertijdVan(x.delivery_timeframe), levertijd_tekst: x.delivery_timeframe || null,
      gewicht: x.weight ? Math.round(N(x.weight) / 100) / 10 : null, maten: [x.length, x.width, x.height].every(v => v) ? { l: N(x.length), b: N(x.width), h: N(x.height) } : null,
      kenmerken: attr, categorieen: cats, beeld: (x.images || [])[0] || '', beelden: (x.images || []).length, varianten: (x.variants || []).length,
      categorie: categorieVan(titel + ' ' + cats.join(' ')) };
  }
  const beelden = (x.images || x.pictures || x.media || []).map(i => typeof i === 'string' ? i : (i.url || i.src || i.original || '')).filter(Boolean);
  const cats = (x.categories || x.category || []); const categorieen = (Array.isArray(cats) ? cats : [cats]).map(naamVan).filter(Boolean);
  const titel = String(pak(x, [/^(name|title)$/i, /^(product_?name|naam)$/i], 0) || '');
  const p = {
    api_id: x.id != null ? x.id : (x.product_id || x.uuid || null),
    titel, merk: naamVan(x.brand || x.brand_name || x.merk), leverancier: naamVan(x.supplier || x.supplier_name || x.leverancier),
    sku: String(pak(x, [/^sku$/i, /sku|article_?number|artikel/i], 0) || ''),
    ean: String(pak(x, [/^ean$/i, /gtin|barcode|ean/i]) || ''),
    voorraad: pak(x, [/^stock$/i, /stock_?(qty|quantity|level|amount)|^quantity$|voorraad|inventory/i]),
    inkoop: pak(x, [/^purchase_?price/i, /purchase|supplier_?price|cost_?price|wholesale|inkoop|buy_?price/i]),
    adviesprijs: pak(x, [/retail_?price|advised|recommended|rrp|msrp|advies|suggested/i, /^price$/i]),
    prijs: pak(x, [/sale_?price|discount_?price|special_?price|actie/i]),
    btw: pak(x, [/vat|tax_?rate|btw/i]),
    levertijd: pak(x, [/deliver|lead_?time|levertijd|shipping_?(days|time)|dispatch|handling/i]),
    gewicht: pak(x, [/weight|gewicht/i]),
    zichtbaar: pak(x, [/visib|zichtbaar/i], 0),
    categorieen, beeld: beelden[0] || '', beelden: beelden.length, varianten: Array.isArray(x.variants || x.variations) ? (x.variants || x.variations).length : 0,
  };
  if (p.levertijd != null && typeof p.levertijd === 'string') { const m = p.levertijd.match(/\d+/g); p.levertijd = m ? N(m[m.length - 1]) : null; } // "2-4 dagen" -> 4
  if (p.prijs == null) p.prijs = p.adviesprijs;
  p.categorie = categorieVan(titel + ' ' + categorieen.join(' '));
  return p;
}

// ---------- paginering bepalen (eenmalig, daarna uit KV) ----------
async function paging() { return { p: 'start', b: 0, rij: true }; } // vastgesteld 21 nov 2026: GET /product?size=<=100&start=<rij>, antwoord {data:[...], total}

// ---------- vraag-index uit Demand Radar (24 uur bewaard) ----------
export async function vraagIdx(vers = false) {
  const k = vers ? null : await kv.get(K.idx).catch(() => null); if (k && Date.now() - N(k.at) < 36 * 3600e3) return k.idx;
  const { haalVraag } = await import('./kadoly-vraag.js'); const idx = vraagIndex(await haalVraag(false)).filter(x => x.v >= 50).map(x => ({ k: x.k, v: x.v, w: x.w }));
  try { await kv.set(K.idx, { at: Date.now(), idx }); } catch (e) {}
  return idx;
}

// ---------- catalogus inlezen: in stukken, met cursor, binnen de tijd ----------
export async function dpScan({ maxPaginas = 30, tijd = 200e3 } = {}) {
  const start = Date.now(); if (!(await dpToken())) return { ok: false, fout: 'geen token', stap: 'Henkjan plakt het token op /api/dp?op=token' };
  const s = await paging(); if (s.fout) return { ok: false, fout: s.fout };
  let c = await kv.get(K.cursor).catch(() => null); if (!c || c.klaar) c = { pagina: 0, aantal: 0, begon: nu() };
  let n = 0;
  while (n < maxPaginas && Date.now() - start < tijd) {
    const waarde = s.rij ? s.b + c.pagina * 100 : s.b + c.pagina;
    const r = await dpApi('product', { size: 100, [s.p]: waarde });
    if (r.st !== 200) { c.fout = 'pagina ' + c.pagina + ': ' + (r.st || r.fout); break; }
    const l = lijstVan(r.data).map(dpNorm); if (r.data && totaalVan(r.data) != null) c.totaal = totaalVan(r.data);
    if (l.length) await kv.set('dp:api:cat:' + c.pagina, l);
    c.aantal += l.length; c.pagina++; n++;
    if (l.length < 100 || s.enkel) { c.klaar = nu(); break; }
  }
  await kv.set(K.cursor, c);
  if (c.klaar) await kv.set(K.meta, { paginas: c.pagina, aantal: c.aantal, totaal: c.totaal || null, klaar: c.klaar, paging: s });
  return { ok: !c.fout, paginasNu: n, cursor: c };
}
export async function dpCatalogus() {
  const m = await kv.get(K.meta).catch(() => null); if (!m) return { meta: null, producten: [] };
  const keys = Array.from({ length: m.paginas }, (_, i) => 'dp:api:cat:' + i); const out = [];
  for (let i = 0; i < keys.length; i += 20) for (const l of (await kv.mget(...keys.slice(i, i + 20))) || []) if (Array.isArray(l)) out.push(...l);
  return { meta: m, producten: out };
}

// ---------- keuring van de hele catalogus; winnaars die nog niet in de brug staan = importlijst ----------
export async function dpKeurCatalogus({ inBrug = new Set(), onderdelen = new Set(), titels = new Map() } = {}) { // titels: Nederlandse naam uit de brug per sku (de API geeft Engels; Demand Radar-termen zijn Nederlands)
  const [idx, cat] = await Promise.all([vraagIdx(), dpCatalogus()]); if (!cat.meta) return { ok: false, fout: 'catalogus nog niet ingelezen' };
  const lijst = cat.producten.filter(p => p.zichtbaar !== false).map(p => { const q = Object.assign({}, p, { titel: titels.get(p.sku) || p.titel, verzend_nl: INKOOP[p.sku] ? INKOOP[p.sku].verzend_nl : p.verzend_nl }); return { p: q, keur: keurProduct(q, idx, { onderdelen, test: true }) }; });
  const winnaars = lijst.filter(x => x.keur.ok).sort((a, b) => b.keur.score - a.keur.score);
  const importeer = winnaars.filter(x => !inBrug.has(x.p.sku)).slice(0, 1000).map(x => ({ sku: x.p.sku, titel: x.p.titel, merk: x.p.merk, leverancier: x.p.leverancier, categorie: x.p.categorie, score: x.keur.score, label: x.keur.label, marge: x.keur.marge, vraag: x.keur.vraag }));
  const perLeverancier = {}; for (const x of winnaars) { const l = x.p.leverancier || x.p.merk || '?'; perLeverancier[l] = (perLeverancier[l] || 0) + 1; }
  const uit = { at: nu(), stand: keurStand(lijst), perLeverancier, importeer };
  // 21 nov (Henkjan: "hou droppery aanvragen id gaten anders vergeten we"): een leverancier die er gisteren niet was = aanvraag goedgekeurd; regel in het werklog
  try { const oud = await kv.get(K.keur).catch(() => null); const alle = new Set(cat.producten.map(p => p.leverancier || p.merk || '?')); const was = new Set((oud && oud.leveranciers) || Object.keys((oud && oud.perLeverancier) || {})); uit.leveranciers = [...alle];
    const nieuw = oud ? [...alle].filter(l => !was.has(l)) : []; if (nieuw.length) { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: new Date().toISOString(), wie: 'droppery-nacht', tekst: 'Droppery: nieuwe leverancier(s) aan Kadoly gekoppeld: ' + nieuw.join(', ') + '. Goedgekeurd door de keuring: ' + nieuw.map(l => l + ' ' + (perLeverancier[l] || 0)).join(', ') + '. Haal ze van de lijst openstaande aanvragen in OVERDRACHT-YOORS-SHOP.md (punt 12).' })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } } catch (e) {}
  try { await kv.set(K.keur, uit); } catch (e) {}
  return Object.assign({ ok: true }, uit);
}
export async function dpKeurLaatste() { return kv.get(K.keur).catch(() => null); }
