// Kopie van todayin bzz/lib/cwrust.js voor de gidsen en de bedrijvengids op curacao.day (lib/cur.js curHandler), met CSS-variabelen
// zodat de donkere modus van de gidsen klopt (hier is geen donkere laag zoals in bzz). Werk beide bij als de regels veranderen.
// Rust op de pagina: één typografie voor heel curacao.day (Henkjan 14 nov 2026: "hier bijv 2 letter groottes . ? Ik wil 1 . Probeer zo min
// mogelijk UX variabelen op een pagina te hebben voor de rust ." en "Voor consistentie plan door en onderhoudt het .").
// Gemeten op de homepage voor deze laag: 49 combinaties van lettermaat en dikte, 14 labelstijlen, 12 linkstijlen, 6 diktes.
// Deze laag loopt over de CSS en de style-attributen van elke pagina (api/cw.js H, vóór de donkere laag), zodat ook elk nieuw blok vanzelf
// meedoet:
//  - lettermaten naar 4 rollen: 13 (labels, bron, klein), 16 (alle tekst), 18 (titels en tijden), 24 (koppen en grote getallen);
//    30 px en groter blijft (paginatitel en de datumkop), net als het merk (.brand)
//  - diktes naar 2: normaal (400) en vet (700)
//  - labels (hoofdletters) één stijl: 13 px, vet, spatiëring .06em, donkerblauw (behalve op een donker vlak)
//  - tekstlinks één stijl: inkt met vlagblauwe streep eronder, 2 px, 4 px ruimte (de stijl die al het meest voorkwam)
// Bewaking: bzz/scripts/check-mobiel.mjs telt per pagina de lettermaten, labelstijlen en linkstijlen en meldt elke afwijking.
export const MATEN = [13, 16, 18, 24];
const VLAG = 'var(--rust-streep,#002B7F)', DONKERBLAUW = 'var(--rust-lbl,#2A3566)', INKT = 'var(--ink,#111113)';
// onder 14 px is klein (labels, bron): 13; 14 tot 17 is tekst (ook plaatsnamen en uitleg): 16; tot 21,5 titel: 18; tot 30 kop: 24
export const snap = px => px < 14 ? 13 : px < 17 ? 16 : px < 21.5 ? 18 : px < 30 ? 24 : px;
const snapMaat = snap;
const maatWaarde = v => {
  const s = String(v).trim();
  let m = s.match(/^([\d.]+)px$/); if (m) return snapMaat(+m[1]) + 'px';
  m = s.match(/^([\d.]+)r?em$/); if (m) return snapMaat(16 * +m[1]) + 'px';
  m = s.match(/^clamp\(\s*([\d.]+)px\s*,[^,]+,\s*([\d.]+)px\s*\)$/); if (m) return +m[1] >= 24 ? s : snapMaat(+m[2]) + 'px';
  return s; // inherit, %, var(), smaller: laten staan
};
const dikte = v => { const s = String(v).trim(); if (/^(bold|bolder)$/.test(s)) return '700'; const n = +s; if (!n) return s; return n >= 600 ? '700' : '400'; };
// font-shorthand: [style] [weight] size[/lh] family
const fontKort = v => String(v).replace(/(^|\s)(\d{3}|bold)(?=\s)/, (m, a, w) => a + dikte(w)).replace(/(^|\s)([\d.]+(?:px|r?em))(?=[\s/])/, (m, a, z) => a + maatWaarde(z));

// helderheid van een kleur (0 donker, 1 licht); var() en onbekend tellen als donker, behalve namen die licht zijn
function helder(c) {
  const s = String(c || '').trim().toLowerCase();
  if (!s) return null;
  if (/^var\(--(wit|white|licht|bg|paper|papier|on)/.test(s) || /^(#fff\b|#ffffff|white)/.test(s)) return 1;
  let r, g, b, m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})\b/);
  if (m) { const h = m[1].length === 3 ? m[1].split('').map(x => x + x).join('') : m[1]; r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16); }
  else if ((m = s.match(/^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/))) { r = +m[1]; g = +m[2]; b = +m[3]; }
  else return 0;
  const L = x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; };
  return .2126 * L(r) + .7152 * L(g) + .0722 * L(b);
}
const TITELSEL = /(^|[\s>+~,(])(h[1-6]|b|strong|th|dt|summary|legend)(?![\w-])|kop|titel|title|naam|name|head|\.pkh|\.adn|\.nr1|\.trs|\.mgp/i;
const decls = s => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ';' && !d) { out.push(cur); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur); return out.map(x => { const i = x.indexOf(':'); return i < 0 ? null : [x.slice(0, i).trim().toLowerCase(), x.slice(i + 1).trim()]; }).filter(Boolean); };

// één declaratieblok (zonder accolades) en de selector ervoor
export function blok(inhoud, sel = '') {
  if (!/font|text-transform|text-decoration/i.test(inhoud)) return inhoud;
  if (/\.brand\b/.test(sel)) return inhoud;
  const imp = v => /!important\s*$/i.test(v), kaal = v => v.replace(/\s*!important\s*$/i, '');
  // gewone tekst is altijd 16 (Henkjan: "Ik wil 1"); 18 en 24 zijn voor titels en koppen: vet, of een kop-selector
  const ruw = decls(inhoud), dk = ruw.find(([p]) => p === 'font-weight'), fk = ruw.find(([p]) => p === 'font'), dikW = dk ? dikte(kaal(dk[1])) : fk && /(^|\s)(bold|[6-9]00)(\s|$)/.test(kaal(fk[1])) ? '700' : null;
  const titel = dikW === '700' || (dikW == null && TITELSEL.test(sel));
  const naarTekst = m => (titel || m === '13px' || !/^(18|24)px$/.test(m)) ? m : '16px';
  const d = ruw.map(([p, v]) => {
    const i = imp(v) ? ' !important' : '', w = kaal(v);
    if (p === 'font-size') return [p, naarTekst(maatWaarde(w)) + i];
    if (p === 'font' && /\d/.test(w)) { const n = fontKort(w), m = (n.match(/(^|\s)(\d+px)(?=[\s/])/) || [])[2]; return [p, (m ? n.replace(m, naarTekst(m)) : n) + i]; }
    if (p === 'font-weight') return [p, dikte(w) + i];
    return [p, v];
  });
  const get = p => { const x = d.find(([q]) => q === p); return x ? kaal(x[1]) : null; };
  const kleur = get('color'), licht = kleur != null && helder(kleur) > .5, extra = [];
  // labels: alles in hoofdletters, één stijl
  if (/uppercase/i.test(get('text-transform') || '')) {
    extra.push('font-size:13px', 'font-weight:700', 'letter-spacing:.06em');
    if (!licht && kleur != null) extra.push('color:' + DONKERBLAUW);
  }
  // tekstlinks: één stijl (inkt, vlagblauwe streep); op een donker vlak (lichte tekst) blijft de eigen kleur
  const deco = (get('text-decoration') || '') + ' ' + (get('text-decoration-line') || '');
  if (/underline/i.test(deco) && !licht) {
    extra.push('text-decoration-color:' + VLAG, 'text-decoration-thickness:2px', 'text-underline-offset:4px');
    if (kleur != null && !/^var\(--(q|c)\b/.test(kleur)) extra.push('color:' + INKT);
  }
  const uit = d.map(([p, v]) => p + ':' + v).join(';');
  return extra.length ? uit + ';' + extra.join(';') : uit;
}

// wat de regels hierboven niet vanzelf vangen (kleur of streep komt uit een andere regel dan de maat): met naam, na alle andere CSS.
// Onderhoud: meldt de mobiele controle een tweede label- of linkstijl, zet de selector hier (of los het op in de module zelf).
const LINK = 'font-size:16px!important;font-weight:700!important;color:var(--ink,#111113)!important;text-decoration:underline!important;text-decoration-color:var(--rust-streep,#002B7F)!important;text-decoration-thickness:2px!important;text-underline-offset:4px!important';
const BRON = 'font-size:13px!important;font-weight:400!important;color:var(--rust-lbl,#2A3566)!important;text-decoration:none!important';
export const RUST_CSS = [
  ':root{--rust-streep:#002B7F;--rust-lbl:#2A3566}@media (prefers-color-scheme:dark){:root{--rust-streep:#93A6FF;--rust-lbl:#C9D3F5}}',
  // tekstlinks in lopende tekst en de vaste linkregels per blok
  `html body main p a:not([class]),html body main.mag>section.card>p>a:not([class]),html body #natuur .nt-s a,html body #toen .toen-b a,html body #nummers p>a,html body .evl a,html body .gv-f a,html body section.card div.li>span>a:not([class]),html body main ul ul li>a:not([class]),html body main dd a{${LINK}}`,
  `html body main p.eyebrow,html body main p.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow>a{font-size:13px!important;font-weight:700!important;letter-spacing:.06em!important;color:${DONKERBLAUW}!important;text-decoration:none!important}`,
  // op een donker vlak (Ask me anything, live cam) blijft de eigen lichte kleur
  `html body #ama a,html body .ama a,html body .cam a,html body .camv a{color:inherit!important;text-decoration-color:currentColor!important}`,
  // bronvermelding is klein en zonder streep (zoals de fotobron)
  `html body a.bron,html body .hh-b a{${BRON}}`,
  `html body main .lbl,html body main .kicker{color:${DONKERBLAUW}!important}`,
].join('');

// alle CSS in <style> en alle style-attributen; scripts blijven onaangeroerd
export function css(t) { return String(t).replace(/([^{}]*)\{([^{}]*)\}/g, (m, sel, inh) => sel + '{' + blok(inh, sel) + '}'); }
export function metRust(html) {
  if (typeof html !== 'string' || !/<style|style="/i.test(html)) return html;
  try {
    const delen = html.split(/(<script\b[^>]*>[\s\S]*?<\/script>)/i);
    for (let i = 0; i < delen.length; i += 2) {
      delen[i] = delen[i]
        .replace(/(<style(?:\s[^>]*)?>)([\s\S]*?)(<\/style>)/gi, (m, a, c, b) => a + css(c) + b)
        .replace(/(\sstyle=")([^"]*)(")/g, (m, a, s, b) => a + blok(s) + b);
    }
    // de vaste laag vlak voor </body>, zodat hij na alle andere CSS komt (de donkere laag komt daar weer na)
    return delen.join('').replace(/<\/body>(?![\s\S]*<\/body>)/i, `<style id="rust">${RUST_CSS}</style></body>`);
  } catch (e) { return html; } // liever de oude opmaak dan een kapotte pagina
}
