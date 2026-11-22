import { valideerInname, identiteit, stabieleSlugs, gegevensHash } from './curdata.js';
// Een mislukte download of opslag mag de laatste complete gids nooit vervangen.
export async function bewaarGids({ pages, state, oud, readCat, put, slugify, normaliseer, fingerprint, now = new Date().toISOString() }) {
  const rows = valideerInname(pages, state, oud?.totaal || 0), vorig = [], oudeCats = Object.keys(oud?.cats || {});
  for (let i = 0; i < oudeCats.length; i += 30) {
    const deel = await Promise.all(oudeCats.slice(i, i + 30).map(async cs => { const items = await readCat(cs); if (!Array.isArray(items) || items.length !== oud.cats[cs].n) throw new Error('bestaande categorie niet leesbaar: ' + cs); return items.map(x => ({ ...x, cs })); }));
    vorig.push(...deel.flat());
  }
  const perId = new Map(vorig.map(x => [identiteit(x), x])), seen = new Set(), cats = {}; let dubbel = 0;
  for (const x of rows) { const id = identiteit(x); if (seen.has(id)) { dubbel++; continue; } seen.add(id); const old = perId.get(id), cs = old?.cs || slugify(x.cat || 'Other') || 'other'; (cats[cs] ??= []).push({ ...x, cs }); }
  if ((oud?.totaal && seen.size < oud.totaal * .95) || (state.total && seen.size < state.total * .95)) throw new Error('unieke bedrijven ontbreken; vorige gids behouden');
  const dataRoot = 'cw/gids/snap/' + now.replace(/[^0-9]/g, '') + '-' + fingerprint;
  const index = { ...oud, at: now, bronHash: fingerprint, dataRoot, totaal: seen.size, cats: {} }, namen = [];
  const oldByCat = new Map(); for (const x of vorig) { if (!oldByCat.has(x.cs)) oldByCat.set(x.cs, []); oldByCat.get(x.cs).push(x); }
  const ents = Object.entries(cats);
  for (let i = 0; i < ents.length; i += 25) await Promise.all(ents.slice(i, i + 25).map(async ([cs, items]) => {
    const stable = stabieleSlugs(items, oldByCat.get(cs), slugify).map(x => {
      const y = normaliseer(x, cs), old = perId.get(identiteit(x)), hash = gegevensHash(y);
      return { ...y, inhoudHash: hash, gewijzigdOp: old && gegevensHash(normaliseer(old, cs)) === hash ? (old.gewijzigdOp || String(oud.at).slice(0, 10)) : now.slice(0, 10) };
    }).sort((a, b) => ((b.score ? (b.score * b.aantal + 40) / (b.aantal + 10) : 0) - (a.score ? (a.score * a.aantal + 40) / (a.aantal + 10) : 0)) || ((b.aantal || 0) - (a.aantal || 0)) || a.naam.localeCompare(b.naam));
    index.cats[cs] = { ...(oud?.cats?.[cs] || {}), en: oud?.cats?.[cs]?.en || stable[0].cat || 'Other', n: stable.length, metScore: stable.filter(x => x.score).length, top: stable.slice(0, 3).map(x => x.naam) };
    namen.push(...stable.map(x => [x.naam, cs, x.slug, x.plaats || '', x.score || 0, x.aantal || 0, x.gewijzigdOp]));
    await put(dataRoot + '/cat/' + cs + '.json', stable);
  }));
  await put(dataRoot + '/namen.json', namen);
  // Publicatie is één laatste pointer; geen lezer ziet een half overschreven gids.
  await put('cw/gids/index.json', index);
  return { index, dubbel, categorieen: ents.length };
}
