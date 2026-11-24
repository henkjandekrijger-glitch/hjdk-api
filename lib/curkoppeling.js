// Bedrijf en vergelijking gebruiken dezelfde brongegevens. Alleen exacte eigen
// gidsverwijzingen; een naam of gedeelde ketenwebsite is nooit een filiaalmatch.
export const KOPPELING_SINDS = '2026-11-23';
export const BEDRIJFPAD = { nl: 'bedrijven', en: 'businesses', de: 'firmen', es: 'empresas', pt: 'empresas' };
const tekst = (x, m) => typeof x === 'string' ? x : x && x[m] || '';
const escape = x => String(x || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function bedrijfsRef(url) {
  try { const u = new URL(url); if (u.protocol !== 'https:' || u.hostname !== 'curacao.day' || u.username || u.password) return null;
    const p = u.pathname.split('/').filter(Boolean); if (p.length !== 4 || BEDRIJFPAD[p[0]] !== p[1] || !/^[a-z0-9-]+$/.test(p[2]) || !/^[a-z0-9-]+$/.test(p[3])) return null;
    return { cs: p[2], slug: p[3], key: p[2] + '/' + p[3] };
  } catch (_) { return null; }
}
export function itemRef(v) {
  const refs = [v.url, ...(v.bronnen || []), ...(v.scores || []).map(s => s.bron)].map(bedrijfsRef).filter(Boolean);
  return new Set(refs.map(r => r.key)).size === 1 ? refs[0] : null;
}
export function echteWebsite(...urls) {
  for (const s of urls) { try { const u = new URL(s); if (!/^https?:$/.test(u.protocol) || u.username || u.password || /(^|\.)(curacao\.day|keuzehulp\.best|whichtobuy\.best|kaufberater\.best)$/.test(u.hostname)) continue; return u.href; } catch (_) {} }
  return null;
}
export function lokaleBedrijfsLinks(html, m) {
  if (m === 'en' || !BEDRIJFPAD[m]) return html;
  // Alleen gewone inhoudslinks: metadata, JSON-LD en het taalmenu blijven intact.
  return String(html).replace(/<a\b[^>]*>/gi, tag => /\bhreflang\s*=|class=["'][^"']*\blang/i.test(tag) ? tag : tag.replace(/(\bhref\s*=\s*["'])https:\/\/curacao\.day\/en\/businesses\//i, '$1https://curacao.day/' + m + '/' + BEDRIJFPAD[m] + '/'));
}
export function koppelingen(onderwerpen, dataVan) {
  const byKey = new Map(), byItem = new Map();
  for (const o of onderwerpen) { if (o.id === 'autohuur' || o.id === 'allinclusive' || o.id === 'stranden-locals') continue;
    const D = dataVan(o); if (!D || !Array.isArray(D.items)) continue;
    for (const v of D.items) { const ref = itemRef(v); if (!ref) continue; const rij = { o, D, v, ref }; byItem.set(o.id + '/' + v.id, rij); if (!byKey.has(ref.key)) byKey.set(ref.key, []); byKey.get(ref.key).push(rij); }
  }
  return { byKey, byItem };
}
export function indexeerbareZaken(namen, index) {
  return new Set((namen || []).filter(r => r[5] >= 5 && index && index.cats[r[1]] && index.cats[r[1]].n >= 3).map(r => r[1] + '/' + r[2]));
}
export function hoofdUrl(m, ref, bekendeZaken) { return ref && (m === 'nl' || m === 'en') && bekendeZaken && bekendeZaken.has(ref.key) ? 'https://curacao.day/' + m + '/' + BEDRIJFPAD[m] + '/' + ref.key : null; }
const CONTACT = /^(adres|address|adresse|direcci[oó]n|endere[cç]o|telefoon|phone|telefon|tel[eé]fono|telefone|openingstijden|opening hours|[oö]ffnungszeiten|horario|hor[aá]rio)\s*[:(]/i;
export function kernData(m, relaties, vergelijkUrl) {
  const feiten = [], gezien = new Set(), bronnen = new Set(), vergelijkingen = []; let datum = '';
  for (const r of relaties || []) {
    const { o, D, v } = r; if (!tekst(v.soort, m)) continue;
    const prijs = v.prijs && Number.isFinite(v.prijs.bedrag) ? v.prijs.valuta + ' ' + v.prijs.bedrag + ' ' + tekst(v.prijs.eenheid, m) : '';
    const kandidaat = [tekst(v.soort, m) + (v.plaats ? ' · ' + v.plaats : ''), prijs, ...(v.feiten || []).map(f => tekst(f, m)), ...(Array.isArray(tekst(v.voor, m)) ? tekst(v.voor, m) : []), ...(Array.isArray(tekst(v.tegen, m)) ? tekst(v.tegen, m) : []), ...(v.scores || []).filter(s => Number(s.score) > 0 && Number(s.aantal) > 0).map(s => s.platform + ': ' + s.score + '/' + (s.max || 5) + ' (' + s.aantal + ')')];
    for (const f of kandidaat) { const s = String(f || '').replace(/\s+/g, ' ').trim(); if (!s || CONTACT.test(s) || /00:00\s*[-–]\s*00:00/.test(s) || gezien.has(s.toLowerCase())) continue; gezien.add(s.toLowerCase()); feiten.push(s); }
    for (const u of v.bronnen || []) if (echteWebsite(u)) bronnen.add(u);
    if (/^\d{4}-\d{2}-\d{2}$/.test(D.peildatum || '') && D.peildatum > datum) datum = D.peildatum;
    vergelijkingen.push({ naam: tekst(o.label, m), url: vergelijkUrl(m, o), id: o.id });
  }
  return { feiten, bronnen: [...bronnen], datum, vergelijkingen };
}
export function kernHtml(m, data) {
  if (!data || !data.feiten.length) return '';
  const t = { nl: ['In het kort', 'Vergelijk', 'Brongegevens'], en: ['At a glance', 'Compare', 'Source data'] }[m]; if (!t) return '';
  const lijst = fs => '<ul>' + fs.map(f => '<li>' + escape(f) + '</li>').join('') + '</ul>';
  return '<section data-blok="kern" class="bz-kern"><h2 class="bz-h">' + t[0] + '</h2>' + lijst(data.feiten.slice(0, 3)) + (data.feiten.length > 3 ? '<details><summary>' + (m === 'nl' ? 'Meer uit de vergelijking' : 'More from the comparison') + '</summary>' + lijst(data.feiten.slice(3)) + '</details>' : '') + '<p>' + data.vergelijkingen.map(r => '<a href="' + escape(r.url) + '">' + t[1] + ': ' + escape(r.naam) + '</a>').join(' · ') + '</p>' + (data.bronnen.length ? '<p class="bz-bron">' + t[2] + (data.datum ? ' · <time datetime="' + data.datum + '">' + data.datum + '</time>' : '') + ': ' + data.bronnen.map(u => '<a href="' + escape(u) + '" target="_blank" rel="noopener">' + escape(new URL(u).hostname.replace(/^www\./, '')) + '</a>').join(' · ') + '</p>' : '') + '</section>';
}
