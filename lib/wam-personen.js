// Gedeelde, brongebonden personen en beelden voor alle WAM-pagina's.
import fs from 'node:fs';
export const PERSONEN_MEDIA = JSON.parse(fs.readFileSync(new URL('../data/wam/personen-media.json', import.meta.url), 'utf8'));
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const veilig = u => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };
export function controleerFoto(f) {
  return !!(f && veilig(f.url) && veilig(f.bron) && veilig(f.licentieUrl) && f.maker && f.licentie && f.toestemming && f.bewerking);
}
export function personenMedia(tekst, { toonNaam = false, taal = 'nl' } = {}) {
  const hay = String(tekst || '').toLocaleLowerCase('nl');
  const lijst = PERSONEN_MEDIA.personen.filter(p => [p.naam, ...(p.aliases || [])].some(n => hay.includes(n.toLocaleLowerCase('nl'))));
  const L = ({ en: ['Professional source', 'Portrait at source', 'Photo', 'License', 'Checked'], de: ['Berufliche Quelle', 'Porträt an der Quelle', 'Foto', 'Lizenz', 'Geprüft'], it: ['Fonte professionale', 'Ritratto alla fonte', 'Foto', 'Licenza', 'Verificato'] })[taal] || ['Professionele bron', 'Portret bij de bron', 'Foto', 'Licentie', 'Gecontroleerd'];
  return lijst.length ? '<div class="persoon-profielen">' + lijst.map(p => {
    const f = controleerFoto(p.foto) ? p.foto : null;
    const links = [p.linkedin && /^https:\/\/[a-z.]*linkedin\.com\/in\//.test(p.linkedin) ? '<a href="' + e(p.linkedin) + '" target="_blank" rel="noopener noreferrer">LinkedIn<span class="sr-only"> ' + e(p.naam) + '</span></a>' : '', veilig(p.bron) ? '<a href="' + e(p.bron) + '" target="_blank" rel="noopener noreferrer">' + L[0] + '</a>' : '', !f && veilig(p.portretBron) ? '<a href="' + e(p.portretBron) + '" target="_blank" rel="noopener noreferrer">' + L[1] + '</a>' : ''].filter(Boolean).join(' · ');
    return '<div class="persoon-profiel" data-persoon="' + e(p.id) + '">' + (f ? '<figure><img src="' + e(f.url) + '" alt="' + e(f.bijschrift) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer"><figcaption>' + L[2] + ': ' + e(f.maker) + ' · <a href="' + e(f.bron) + '" target="_blank" rel="noopener noreferrer">Bron</a> · <a href="' + e(f.licentieUrl) + '" target="_blank" rel="noopener noreferrer">' + e(f.licentie) + '</a><br>' + e(f.bewerking) + '</figcaption></figure>' : '') + '<div>' + (toonNaam ? '<p><b>' + e(p.naam) + '</b></p>' : '') + '<p class="meta">' + links + '</p><p class="meta">' + L[4] + ' <time datetime="' + e(p.gecontroleerd) + '">' + e(p.gecontroleerd) + '</time></p></div></div>';
  }).join('') + '</div>' : '';
}
export const PERSONEN_CSS = '.persoon-profielen{margin:16px 0}.persoon-profiel{display:flex;gap:18px;align-items:flex-start;min-width:0;margin:16px 0}.persoon-profiel>div{min-width:0}.persoon-profiel p{margin:0 0 6px}.persoon-profiel a{overflow-wrap:anywhere;text-decoration:underline;text-underline-offset:3px}.persoon-profiel figure{flex:0 0 160px;width:160px;margin:0}.persoon-profiel img{display:block;width:100%;height:auto;max-width:100%;border-radius:0}.persoon-profiel figcaption{font-size:14px;line-height:1.5;margin-top:8px}.persoon-profiel .meta{font-size:16px}@media(max-width:480px){.persoon-profiel{display:block}.persoon-profiel figure{width:160px;margin-bottom:12px}}';
