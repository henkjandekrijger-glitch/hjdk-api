// Eén identiteit en één feitenlaag voor gids, vergelijking en bedrijfspagina.
import MAP from '../data/cur/bedrijf-koppelingen.json' with { type: 'json' };
import PROOF from '../data/cur/bedrijf-broncorrecties.json' with { type: 'json' };
import REPORT from '../data/cur/bedrijf-controle.json' with { type: 'json' };
import { normaliseerBedrijf, identiteit, bronDatum, eigenSite, naamNetjes } from './curdata.js';
export { REPORT as DATA_CONTROLE };
export const koppeling = (gids, id) => MAP.koppelingen[gids]?.[id] || null;
export const koppelingenVoor = (cs, slug) => MAP.perZaak[cs + '/' + slug] || [];
const platform = s => String(s || '').toLowerCase().replace(/ maps$/, '');
const maps = x => x.place_id ? 'https://www.google.com/maps/place/?q=place_id:' + x.place_id : x.cid ? 'https://www.google.com/maps?cid=' + x.cid : null;
export function gidsBedrijf(x, cs) {
  let y = normaliseerBedrijf(x, PROOF[identiteit(x)]);
  const g = MAP.reviews[cs + '/' + x.slug]?.google;
  if (g && g.peildatum && g.peildatum > (y.bronDatum || '')) y = { ...y, score: g.score, aantal: g.aantal, scoreDatum: g.peildatum, scoreBron: g.bron };
  return y;
}
export function scoresGelijk(v, x, cs) {
  const all = new Map();
  const add = s => { if (!(s?.score > 0 && s.aantal > 0)) return; const k = platform(s.platform), old = all.get(k); if (!old || String(s.peildatum || '') > String(old.peildatum || '') || (s.peildatum === old.peildatum && s.aantal > old.aantal)) all.set(k, s); };
  for (const s of v.scores || []) if (!(platform(s.platform) === 'google' && eigenSite(s.bron))) add(s);
  for (const s of Object.values(MAP.reviews[cs + '/' + x.slug] || {})) add(s);
  // Zelfverwijzingen worden nooit bewijs dat Google vandaag is gecontroleerd.
  add({ platform: 'Google', score: x.score, max: 5, aantal: x.aantal, peildatum: x.scoreDatum || bronDatum(x), bron: x.scoreBron || maps(x) });
  return [...all.values()];
}
export async function dataGelijk(o, D, readCat, rawProf = {}) {
  if (!D?.items) return D;
  const links = MAP.koppelingen[o.id] || {}, cats = [...new Set(Object.values(links).map(k => k.cs))];
  const vals = await Promise.all(cats.map(cs => readCat(cs).catch(() => null))), per = Object.fromEntries(cats.map((c, i) => [c, vals[i] || []]));
  const prof = {}, items = D.items.map(v => {
    const k = links[v.id], x = k && per[k.cs].find(x => (k.place_id && x.place_id === k.place_id) || (k.cid && String(x.cid) === String(k.cid)));
    if (!x) { if (rawProf[v.id] && rawProf[v.id].bron !== 'gids') prof[v.id] = normaliseerBedrijf(rawProf[v.id]); return { ...v, naam: naamNetjes(v.naam) }; }
    prof[v.id] = { ...x, dag: x.bronDatum, bron: 'gids', cs: k.cs, slug: x.slug };
    const feiten = (v.feiten || []).filter(f => !/^(Adres|Address|Adresse|Dirección|Endereço|Telefoon|Phone|Telefon|Teléfono|Telefone|Website|Sitio web|Site) \(Google\):/.test(typeof f === 'string' ? f : (f.en || f.nl || '')));
    return { ...v, naam: x.naam, plaats: x.adres || v.plaats, url: x.site || (!eigenSite(v.url) ? v.url : null), feiten, scores: scoresGelijk(v, x, k.cs), _zaak: { cs: k.cs, slug: x.slug } };
  });
  return { ...D, items, _prof: prof };
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function bronRegel(x, m = 'en') {
  const labels = { nl: ['Google-profiel: bron bijgewerkt', 'Officiële winkelgegevens gecontroleerd'], en: ['Google profile: source updated', 'Official store details checked'], de: ['Google-Profil: Quellenstand', 'Offizielle Filialdaten geprüft'], es: ['Perfil de Google: fecha de la fuente', 'Datos oficiales verificados'], pt: ['Perfil Google: data da fonte', 'Dados oficiais verificados'] }[m] || ['Source updated', 'Official details checked'];
  const b = PROOF[identiteit(x)], d = bronDatum(x), u = maps(x);
  return [d ? (u ? '<a href="' + esc(u) + '" rel="nofollow noopener" target="_blank">' + labels[0] + '</a>' : labels[0]) + ' ' + esc(d) : '', b ? '<a href="' + esc(b.url) + '" rel="nofollow noopener" target="_blank">' + labels[1] + '</a> ' + esc(b.datum) : ''].filter(Boolean).join(' · ');
}
export function controleHtml() {
  const R = REPORT, open = R.open || [];
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,follow"><title>Controle Curaçao-bedrijvengids</title><style>body{font:16px/1.6 system-ui;color:#111113;background:white;max-width:960px;margin:auto;padding:32px 20px}h1{font-size:36px;line-height:1.15}a{color:inherit}table{border-collapse:collapse;width:100%}th,td{padding:12px 8px;border-bottom:1px solid #ccc;text-align:left;vertical-align:top}details{margin:24px 0}summary{cursor:pointer;font-weight:700}</style></head><body><h1>Bedrijvengids en keuzehulpen gecontroleerd</h1><p>Controle op ' + R.datum + '. De volledige opgeslagen bronset is doorgelicht. Dat is geen nieuwe controle bij ieder bedrijf.</p><table>' + [['Bedrijven', R.totaal], ['Categorieën', R.categorieen], ['Keuzehulpen, inclusief varianten en autohuur', R.gidsen], ['Items in de keuzehulpen', R.gidsItems], ['Veilig gekoppelde items', R.gekoppeld], ['Namen opgeschoond', R.naamHersteld], ['Oude sluitingsmeldingen zonder stellige openmelding', R.sluitstatusZonderOpenmelding], ['Werkelijk opnieuw gecontroleerd via eigen site', R.officieelGecontroleerd], ['Bronrecords ouder dan 30 dagen', R.ouderDan30Dagen]].map(([a, b]) => '<tr><th>' + a + '</th><td>' + Number(b).toLocaleString('nl-NL') + '</td></tr>').join('') + '</table><p>De nieuwste Google-bron dateert van ' + R.nieuwsteBron + '. 24-uursclaims zonder bewijs verdwijnen. Vestigingen blijven afzonderlijk bestaan. Dezelfde zaak gebruikt dezelfde brongegevens en reviewberekening in beide weergaven. Canonicals en bestaande URL’s blijven behouden.</p><h2>Actuele correcties uit officiële bronnen</h2><ul>' + Object.entries(PROOF).map(([id, b]) => '<li><a href="' + esc(b.url) + '">' + esc(b.velden.adres) + '</a> · ' + b.datum + ' · ma–za ' + b.velden.uren.mon + ' · zo ' + b.velden.uren.sun + '</li>').join('') + '</ul><details><summary>Openstaande identiteitcontrole (' + open.length + ')</summary><p>Hier zitten ook algemene informatiebronnen en niet-lokale diensten tussen. Deze items zijn niet automatisch aan een lokale zaak gekoppeld.</p><table><tr><th>Gids</th><th>Item</th><th>Reden</th></tr>' + open.map(x => '<tr><td>' + esc(x.gids) + '</td><td>' + esc(x.naam) + '</td><td>' + esc(x.reden) + '</td></tr>').join('') + '</table></details><p><a href="?op=datacontrole&vorm=json">Volledige controle als JSON</a></p></body></html>';
}
