// Koopkracht Nederland per PC4 (Henkjan 28 nov 2026, taak xwo1wj, vervolg van l9144w): bevolkingsgewogen vijfden van het gemiddelde
// huishoudinkomen per viercijferige postcode, opgehaald op Vercel bij PDOK (CBS Kerncijfers per postcode 2023, CC BY 4.0).
// Vanuit de cloudwerkplek is pdok.nl niet bereikbaar, dus dit draait alleen op Vercel (op=kknl in fn/mm.js, en de dagelijkse ronde op=bronnen&run=1).
// Aanroep: https://api.pdok.nl/cbs/postcode4/ogc/v1/collections/postcode4/items?f=json&limit=250&filter=jaarcode=2023 AND postcode>=a AND postcode<b
//   (OGC API Features; uit de OpenAPI-beschrijving: limit hoogstens 1000, filter in CQL2 tekst, doorbladeren met de cursor uit de link rel=next;
//   een parameter om de geometrie weg te laten bestaat niet, dus kleine pagina's en blokken van 500 postcodes, een paar tegelijk).
// Opslag: mm:kk:nl (9000 tekens, index = PC4 - 1000, '0' onbekend, '1'..'5' laag naar hoog) en mm:kk:nl:meta (json), zonder verloop.
// Nooit schatten of opvullen uit buren: een PC4 zonder bekend inkomen of zonder inwoners is '0'.
export const KK = { basis: 'https://api.pdok.nl/cbs/postcode4/ogc/v1', jaar: 2023, minBekend: 3500, pagina: 250, blok: 500, tegelijk: 6, oudDagen: 180, geheugen: 6 * 3600 * 1000, tijd: 150000,
  bron: 'CBS, Kerncijfers per postcode (PC4) 2023, via PDOK, CC BY 4.0' };
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };

// pure rekenkern: rijen { postcode, inwoners, inkomen } in, { tabel, meta } uit
export function vijfden(rijen, jaar = KK.jaar) {
  const bekend = [], onbekend = new Set(), gezien = new Set();
  for (const r of rijen || []) {
    const pc = Math.round(N(r && r.postcode)); if (pc < 1000 || pc > 9999 || gezien.has(pc)) continue; gezien.add(pc);
    const ink = r.inkomen == null ? NaN : Number(r.inkomen), inw = N(r.inwoners);
    if (Number.isFinite(ink) && ink > 0 && inw > 0) bekend.push({ pc, inw, ink }); else onbekend.add(pc);
  }
  bekend.sort((a, b) => a.ink - b.ink || a.pc - b.pc);
  const totaal = bekend.reduce((s, x) => s + x.inw, 0), t = new Array(9000).fill('0'), grenzen = [], per = [0, 0, 0, 0, 0], inw5 = [0, 0, 0, 0, 0];
  let som = 0, k = 1;
  for (const x of bekend) {
    som += x.inw; // een PC4 hoort bij het vijfde waarin zijn middelpunt (cumulatief aantal inwoners min de helft van zichzelf) valt
    const e = Math.min(5, Math.floor(((som - x.inw / 2) / totaal) * 5) + 1);
    if (e !== k) { grenzen.push(Math.round(x.ink)); k = e; }
    t[x.pc - 1000] = String(e); per[e - 1]++; inw5[e - 1] += x.inw;
  }
  return { tabel: t.join(''), meta: { jaar, bron: KK.bron, gevuld: bekend.length, onbekend: onbekend.size, gezien: gezien.size, inwoners: totaal, grenzen, perVijfde: per, inwonersPerVijfde: inw5 } };
}
export const geloofwaardig = (m, jaarcodes) => !!m && m.gevuld >= KK.minBekend && jaarcodes.length > 0 && jaarcodes.every(j => j === KK.jaar);

// ---- ophalen bij PDOK ----
const rijVan = f => { const p = (f && f.properties) || {}; return { postcode: p.postcode, inwoners: p.aantal_inwoners, inkomen: p.gemiddeld_inkomen_huishouden, jaarcode: p.jaarcode }; };
export const itemsUrl = (extra) => KK.basis + '/collections/postcode4/items?f=json&limit=' + KK.pagina + (extra ? '&' + extra : '');
const nextVan = j => { const l = ((j && j.links) || []).find(x => x && x.rel === 'next'); return l && l.href ? String(l.href) : ''; };

async function pagina(url, haal, eind) {
  const r = await haal(url, { headers: { accept: 'application/geo+json, application/json' }, signal: AbortSignal.timeout(Math.max(5000, Math.min(40000, eind - Date.now()))) });
  if (!r.ok) throw new Error('PDOK http ' + r.status);
  return r.json();
}
// alle pagina's van één blok, via de next-link
async function blok(van, tot, haal, eind) {
  const filter = encodeURIComponent('jaarcode=' + KK.jaar + ' AND postcode>=' + van + ' AND postcode<' + tot);
  let url = itemsUrl('filter=' + filter), rijen = [], n = 0;
  while (url && n++ < 20) {
    if (Date.now() > eind) throw new Error('tijd op');
    const j = await pagina(url, haal, eind);
    for (const f of j.features || []) rijen.push(rijVan(f));
    url = (j.features || []).length ? nextVan(j) : '';
  }
  return rijen;
}
// ruwe vorm van de eerste pagina (diagnose, bewaart niets)
export async function proef(haal = fetch, van = 1011) {
  van = Math.max(1000, Math.min(9990, Math.round(N(van)) || 1011)); const url = itemsUrl('filter=' + encodeURIComponent('jaarcode=' + KK.jaar + ' AND postcode>=' + van + ' AND postcode<' + (van + 10))), t = Date.now();
  const j = await pagina(url, haal, Date.now() + 40000);
  const fs = j.features || [];
  return { ok: true, url, ms: Date.now() - t, aantal: fs.length, totaal: j.numberMatched, volgende: nextVan(j), eersteEigenschappen: fs[0] && fs[0].properties, inkomens: fs.map(f => [f.properties.postcode, f.properties.aantal_inwoners, f.properties.gemiddeld_inkomen_huishouden]), eersteRij: fs[0] && rijVan(fs[0]), sleutels: Object.keys(j), geometrieType: fs[0] && fs[0].geometry && fs[0].geometry.type };
}
// alles ophalen en rekenen; geeft { ok, tabel, meta } of { ok:false, fout }
export async function haalNL(haal = fetch, { tijd = KK.tijd } = {}) {
  const eind = Date.now() + tijd, blokken = []; for (let v = 1000; v < 10000; v += KK.blok) blokken.push([v, v + KK.blok]);
  const rijen = []; let i = 0, fout = '';
  const werker = async () => { while (!fout) { const b = blokken[i++]; if (!b) return; try { rijen.push(...await blok(b[0], b[1], haal, eind)); } catch (e) { fout = 'blok ' + b[0] + ': ' + String(e && e.message || e).slice(0, 120); } } };
  await Promise.all(Array.from({ length: KK.tegelijk }, werker));
  if (fout) return { ok: false, fout };
  const codes = [...new Set(rijen.map(r => N(r.jaarcode)))], { tabel, meta } = vijfden(rijen);
  if (!geloofwaardig(meta, codes)) return { ok: false, fout: 'niet geloofwaardig: ' + meta.gevuld + ' PC4 met inkomen (minimaal ' + KK.minBekend + '), jaarcodes ' + JSON.stringify(codes), meta };
  meta.gehaald = new Date().toISOString();
  return { ok: true, tabel, meta };
}

// ---- opslag en lezen ----
export async function bewaar(kv, r) {
  if (!r.ok) { await kv.raw(['SET', 'mm:kk:nl:fout', JSON.stringify({ t: new Date().toISOString(), fout: r.fout })]).catch(() => {}); return r; }
  await kv.raw(['SET', 'mm:kk:nl', r.tabel]); await kv.raw(['SET', 'mm:kk:nl:meta', JSON.stringify(r.meta)]); await kv.raw(['DEL', 'mm:kk:nl:fout']).catch(() => {});
  return r;
}
export async function stand(kv) {
  const [m, f] = await Promise.all([kv.raw(['GET', 'mm:kk:nl:meta']).catch(() => null), kv.raw(['GET', 'mm:kk:nl:fout']).catch(() => null)]);
  let meta = null, fout = null; try { meta = m ? JSON.parse(m) : null; } catch (e) {} try { fout = f ? JSON.parse(f) : null; } catch (e) {}
  const dagen = meta && meta.gehaald ? Math.floor((Date.now() - Date.parse(meta.gehaald)) / 864e5) : null;
  return { gevuld: meta ? meta.gevuld : 0, jaar: meta ? meta.jaar : null, leeftijdDagen: dagen, oud: dagen == null || dagen > KK.oudDagen, meta, laatsteFout: fout };
}
// late lader voor koopkracht(): houdt de tabel 6 uur in het geheugen van de functie; nooit in het klikpad, nooit een fout naar buiten
let GEH = { t: 0, tabel: '' };
export async function laadNL(kv) {
  if (GEH.tabel && Date.now() - GEH.t < KK.geheugen) return GEH.tabel;
  try { const t = await kv.raw(['GET', 'mm:kk:nl']); if (typeof t === 'string' && t.length === 9000) { GEH = { t: Date.now(), tabel: t }; return t; } } catch (e) {}
  return GEH.tabel || '';
}
export const zetGeheugen = (tabel) => { GEH = { t: Date.now(), tabel: tabel || '' }; };
// de dagelijkse ronde: ophalen als de tabel ontbreekt of ouder is dan 180 dagen; eigen tijdslimiet, laat nooit de ronde vallen
export async function zorgNL(kv, haal = fetch, { tijd = 120000 } = {}) {
  try {
    const s = await stand(kv); if (!s.oud) return { ok: true, overgeslagen: true, gevuld: s.gevuld, leeftijdDagen: s.leeftijdDagen };
    if (s.laatsteFout && Date.now() - Date.parse(s.laatsteFout.t) < 20 * 3600 * 1000) return { ok: false, overgeslagen: true, fout: 'laatste poging mislukte minder dan 20 uur geleden: ' + s.laatsteFout.fout };
    const r = await bewaar(kv, await haalNL(haal, { tijd })); if (r.ok) zetGeheugen(r.tabel);
    return { ok: r.ok, fout: r.fout, gevuld: r.meta && r.meta.gevuld };
  } catch (e) { return { ok: false, fout: String(e && e.message || e).slice(0, 120) }; }
}
export function standTekst(s) {
  if (!s || !s.gevuld) return 'Koopkracht NL: LEEG (' + (s && s.laatsteFout ? 'laatste poging: ' + s.laatsteFout.fout : 'nog niet opgehaald') + '); ophalen: /api/mm?op=kknl&run=1';
  return 'Koopkracht NL: ' + s.gevuld + ' PC4 gevuld (jaar ' + s.jaar + ', ' + s.leeftijdDagen + ' dagen oud' + (s.oud ? ', TE OUD' : '') + ')' + (s.laatsteFout ? ', laatste fout ' + s.laatsteFout.fout : '');
}
