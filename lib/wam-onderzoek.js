// Openbaar brononderzoek blijft apart van de oorspronkelijke eigen claim.
import { personenMedia } from './wam-personen.js';
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function onderzoekBronnen(d, ids = []) {
  if (!ids.length) return '';
  const links = ids.map(id => { const s = d.bronnen.find(s => s.id === id); if (!s) throw new Error('Ontbrekende onderzoeksbron: ' + id); if (!/^https:\/\//.test(s.url)) throw new Error('Ongeldige bron-URL: ' + id); return '<a href="' + e(s.url) + '" target="_blank" rel="noopener noreferrer">' + e(s.naam) + '</a>'; });
  return '<p class="meta">Bronnen: ' + links.join(' · ') + '</p>';
}
export function onderzoekNavigatie(d) {
  return '<nav class="meta dossier-sprong" aria-label="In dit dossier">' + (d.verdieping || []).filter(s => ['kern', 'martine-bakx', 'crowdfunding', 'rechtszaken', 'spelers', 'perspectieven', 'bewijsdiscussies'].includes(s.id)).map(s => '<a href="#' + e(s.id) + '">' + e(({ kern: 'Kern', 'martine-bakx': 'Martine Bakx', crowdfunding: 'Crowdfunding', rechtszaken: 'Rechtszaken', spelers: 'Spelers', perspectieven: 'Perspectieven', bewijsdiscussies: 'Bewijs' })[s.id]) + '</a>').concat(['<a href="#eigenzaak">Eigen claim</a>', '<a href="#onderbouwing">Alle bronnen</a>', '<a href="#reageren">Jouw ervaring</a>']).join(' · ') + '</nav>';
}
export function onderzoekBlok(d) {
  return (d.verdieping || []).map(s => '<section id="' + e(s.id) + '"><h2>' + e(s.kop) + '</h2>' + s.alineas.map(p => '<p>' + e(p) + '</p>').join('') + (s.items || []).map(i => '<article class="dossier-vraag"><h3>' + e(i.kop) + '</h3>' + i.alineas.map(p => '<p>' + e(p) + '</p>').join('') + (s.id === 'spelers' ? personenMedia(i.kop + ' ' + i.alineas.join(' '), { toonNaam: true }) : '') + onderzoekBronnen(d, i.bronIds) + '</article>').join('') + '</section>').join('');
}
