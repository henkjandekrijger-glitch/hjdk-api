// Controledata zijn gescheiden van bron- en publicatiedata; alleen materiële wijzigingen beïnvloeden lastmod.
import fs from 'node:fs';
export const ACTUALITEIT = JSON.parse(fs.readFileSync(new URL('../data/wam/actualiteit.json', import.meta.url), 'utf8'));
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const inhoudGewijzigd = pad => ACTUALITEIT.paginas[pad]?.gewijzigd || '';
export function actualiteitBlok(pad) {
  const p = ACTUALITEIT.paginas[pad];
  if (!p) return '';
  return '<section id="wijzigingen" class="wam-actualiteit"><h2>Controle en wijzigingen</h2><p class="meta">Gecontroleerd <time datetime="' + e(p.gecontroleerd) + '">' + e(p.gecontroleerd) + '</time> · volgende controle gepland <time datetime="' + e(ACTUALITEIT.volgendeControle) + '">' + e(ACTUALITEIT.volgendeControle) + '</time></p><details><summary>Wat is veranderd?</summary><ol>' + (p.wijzigingen || []).map(w => '<li><p><time datetime="' + e(w.datum) + '">' + e(w.datum) + '</time> · ' + e(w.tekst) + '</p><p class="meta">' + w.bronnen.map(b => b.url && /^(https:\/\/|\/(?!\/))/.test(b.url) ? '<a href="' + e(b.url) + '">' + e(b.naam) + '</a>' : e(b.naam)).join(' · ') + '</p></li>').join('') + '</ol></details><p class="meta">' + e(ACTUALITEIT.toelichting) + '</p></section>';
}
