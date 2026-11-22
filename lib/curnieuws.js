// Nieuws over een zaak in de Curaçao-gidsen (Henkjan 22 nov 2026 bij de kaart van Sandals: "Hier is wel nieuws over hoe zetten we dat erbij ?
// Dat ze niet zo goed zijn voor hun personeel ??", akkoord op het voorstel: "JA"). Data: data/cur/bedrijfnieuws.json. Eén neutrale regel
// "In het nieuws" met datum en bron op de kaart in elke gids (lib/curkh.js) en op de bedrijfspagina (lib/cur.js renderBedrijf), en in de context
// van de chat op die pagina. Telt niet mee in de score: het gaat vaak om beschuldigingen, geen uitspraak. Verdwijnt na `tot` (standaard 90 dagen).
// live false = alleen te zien met ?v=nieuws (eerst laten zien, dan live).
import NW from '../data/cur/bedrijfnieuws.json' with { type: 'json' };

const LBL = { nl: 'In het nieuws', en: 'In the news', es: 'En las noticias', pt: 'Nas notícias', de: 'In den Nachrichten' };
const BRON = { nl: 'Bron', en: 'Source', es: 'Fuente', pt: 'Fonte', de: 'Quelle' };
const LOC = { nl: 'nl-NL', en: 'en-GB', es: 'es-ES', pt: 'pt-BR', de: 'de-DE' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plus90 = d => new Date(Date.parse(d + 'T12:00:00Z') + 90 * 864e5).toISOString().slice(0, 10);

// het nieuws bij een zaak (item-id), nieuwste eerst; toon = ?v=nieuws (ook wat nog niet live staat)
export function nieuwsVoor(id, toon = false, vandaag = new Date().toISOString().slice(0, 10)) {
  return (NW.items || []).filter(x => (x.match || []).includes(id) && (x.live || toon) && x.dag <= vandaag && (x.tot || plus90(x.dag)) >= vandaag && x.tekst && (x.bronnen || []).length)
    .sort((a, b) => String(b.dag).localeCompare(String(a.dag)));
}
const datum = (d, m) => new Date(d + 'T12:00:00Z').toLocaleDateString(LOC[m] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).replace(/\.$/, '');
const tekst = (x, m) => x.tekst[m] || x.tekst.en || x.tekst.nl || '';

export const NIEUWS_CSS = '.cur-nw{margin:10px 0;padding:10px 0 10px 12px;border-left:3px solid currentColor;font-size:16px;line-height:1.5}.cur-nw b{font-weight:700}.cur-nw .cur-nwb{display:block;font-size:13px;margin-top:4px}.cur-nw a{color:inherit;text-decoration:underline;text-underline-offset:3px}';

// één blok met de regel(s), of '' als er niets is
export function nieuwsHtml(id, m, toon = false) {
  const l = nieuwsVoor(id, toon); if (!l.length) return '';
  return l.slice(0, 2).map(x => '<p class="cur-nw" data-nieuws="' + esc(x.id) + '"><b>' + esc(LBL[m] || LBL.en) + '</b> (<time datetime="' + esc(x.dag) + '">' + esc(datum(x.dag, m)) + '</time>): ' + esc(tekst(x, m))
    + '<span class="cur-nwb">' + esc(BRON[m] || BRON.en) + ': ' + x.bronnen.map(b => '<a href="' + esc(b.url) + '" target="_blank" rel="nofollow noopener">' + esc(b.naam) + '</a>').join(' · ') + '</span></p>').join('');
}

// voor de context van de chat: dezelfde feiten als tekst
export function nieuwsTekst(id, m, toon = false) {
  return nieuwsVoor(id, toon).slice(0, 2).map(x => (LBL[m] || LBL.en) + ' (' + datum(x.dag, m) + '): ' + tekst(x, m) + ' ' + (BRON[m] || BRON.en) + ': ' + x.bronnen.map(b => b.naam).join(', ')).join(' ');
}
