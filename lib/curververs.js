import { createHash } from 'node:crypto';
const vast = x => Array.isArray(x) ? x.map(vast) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k, vast(x[k])])) : x;
export const bronId = x => String(x.place_id || x.cid || (String(x.naam || '').toLowerCase() + '|' + String(x.adres || '').toLowerCase()));
export function bronHash(x) {
  const velden = ['naam', 'adres', 'plaats', 'tel', 'site', 'uren', 'score', 'aantal', 'lat', 'lng', 'prijs', 'beschrijving', 'cat', 'claimed', 'status'];
  return createHash('sha256').update(JSON.stringify(vast(Object.fromEntries(velden.map(k => [k, x[k] == null ? null : x[k]]))))).digest('hex').slice(0, 20);
}
export function verversCategorie(items, vorig, at, vorigeDatum, slugify) {
  const oud = new Map((vorig || []).map(x => [bronId(x), x])), used = new Set(), gereserveerd = new Set(items.map(x => oud.get(bronId(x))?.slug).filter(Boolean));
  let gewijzigd = 0;
  const result = items.map(v => { const x = { ...v }, o = oud.get(bronId(v)), hash = bronHash(x); let slug = o?.slug;
    if (!slug || used.has(slug)) { const base = slugify(x.naam) || 'bedrijf'; slug = base; let n = 2; while (used.has(slug) || gereserveerd.has(slug)) slug = base + '-' + n++; }
    used.add(slug); x.slug = slug; x.bronhash = hash;
    const zelfde = o && (o.bronhash || bronHash(o)) === hash;
    x.gewijzigd = zelfde ? (o.gewijzigd || vorigeDatum || at) : at;
    if (!zelfde) gewijzigd++;
    return x;
  });
  const verwijderd = (vorig || []).filter(x => !result.some(v => bronId(v) === bronId(x))).length;
  return { items: result, gewijzigd, verwijderd, zelfde: !gewijzigd && !verwijderd && (vorig || []).length === result.length };
}
export function magVerversen(state, vorig, nu, forceer) {
  if (!Number.isInteger(state.n) || state.n < 1) return false;
  return !!forceer || state.n > (vorig.n || 0) || !vorig.at || nu - Number(vorig.at) >= 23 * 3600e3;
}
