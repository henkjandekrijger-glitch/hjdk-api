// Published articles must not be replaced by a stale automated concept save.
export async function bewaarArtikel(kv, a, index, modus = 'eerst-zien') {
  const bestaand = await kv.get('lc:art:' + a.slug);
  if (bestaand?.status === 'live') return { ok: false, status: 409, fout: 'Artikel is al live; conceptopslag mag gepubliceerde inhoud niet vervangen.' };
  a.datum = a.datum || new Date().toISOString().slice(0, 10);
  a.status = modus === 'direct' ? 'live' : 'concept';
  await kv.set('lc:art:' + a.slug, a);
  const rest = index.filter(x => x.slug !== a.slug);
  rest.push({ slug: a.slug, titel: a.titel, datum: a.datum, status: a.status, zoekterm: a.zoekterm || '', volume: a.volume || 0, gerelateerd: a.gerelateerd || [] });
  await kv.set('lc:arts', rest);
  return { ok: true };
}
