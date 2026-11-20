// Kopie van todayin bzz/lib/cwdonker.js (20 nov 2026): de gidsen op curacao.day krijgen dezelfde automatische donkere laag als de rest van de site, nu ze de rustige kop en stijl delen. Wijzig de bron daar en kopieer hierheen.
// Donkere modus van curacao.day (Henkjan 8 nov 2026: "Moet wel in darkmode bestaan maar dan wel strak en goed dus goed contrast ed doe
// totaal asessment en voer uit en voeg ook toe aan de check lus .").
// Veel blokken hebben vaste lichte kleuren in hun eigen CSS. In plaats van elk blok apart te herschrijven maakt donkerCss() bij elke pagina
// uit alle CSS op die pagina één donkere laag (@media prefers-color-scheme:dark, met !important en een hogere specificiteit):
// - tekstkleur: blijft als hij op donker al genoeg contrast heeft (WCAG 4,5), anders lichter in dezelfde tint tot 4,5 (bijna zwart wordt
//   bijna wit, donkerblauw wordt lichtblauw, gevelkleuren worden een tikje lichter). Staat in dezelfde regel een gekleurde achtergrond
//   (gevelkleur, WhatsApp-groen), dan blijft de tekst zoals hij is.
// - achtergrond: wit en lichte tinten worden donkere vlakken in dezelfde tint; bijna zwarte knoppen worden donkergrijs zodat ze zichtbaar
//   blijven; gevelkleuren blijven.
// - randen en schaduwen: lichtgrijze lijnen worden donkere lijnen, zwarte lijnen worden licht.
// De controle (scripts/check-mobiel.mjs, donkere ronde) meet daarna op elke pagina het echte contrast en meldt teksten onder 4,5.
const REF = [26, 31, 41]; // lichtste donkere vlak (#1A1F29): tekst moet daarop ook 4,5 halen
const NAMEN = { white: '#ffffff', black: '#000000' };

function parse(s) {
  s = String(s).trim().toLowerCase(); if (NAMEN[s]) s = NAMEN[s];
  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) { let h = m[1]; if (h.length === 3 || h.length === 4) h = h.split('').map(c => c + c).join(''); if (h.length !== 6 && h.length !== 8) return null; return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 }; }
  m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) { const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(x => x.endsWith('%') ? parseFloat(x) * 2.55 : parseFloat(x)); if (p.length < 3 || p.slice(0, 3).some(isNaN)) return null; return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? (String(m[1]).includes('%') && p[3] > 1 ? p[3] / 255 : p[3]) : 1 }; }
  return null;
}
const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('') + (c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, '0') : '');
function hsl({ r, g, b }) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return { h, s, l }; }
function rgb({ h, s, l }, a = 1) { if (!s) return { r: l * 255, g: l * 255, b: l * 255, a }; const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; return { r: f(h + 1 / 3) * 255, g: f(h) * 255, b: f(h - 1 / 3) * 255, a }; }
const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const ref = { r: REF[0], g: REF[1], b: REF[2] };

// tekst: lichter in dezelfde tint tot hij 4,5 haalt op het lichtste donkere vlak
export function tekstKleur(c) {
  if (contrast(c, ref) >= 4.6) return null;
  const x = hsl(c); if (x.l < .22 && x.s < .2) return hex({ ...rgb({ h: x.h, s: Math.min(x.s, .1), l: .93 }), a: c.a });
  let l = Math.max(x.l, .45), s = Math.min(x.s, .75), uit = rgb({ h: x.h, s, l }, c.a);
  while (contrast(uit, ref) < 4.6 && l < .97) { l += .02; uit = rgb({ h: x.h, s, l }, c.a); }
  return hex(uit);
}
// achtergrond: licht wordt donker in dezelfde tint, bijna zwart wordt donkergrijs, kleur blijft
export function vlakKleur(c) {
  const x = hsl(c);
  if (x.l >= .86) return hex({ ...rgb({ h: x.h, s: Math.min(x.s, .5) * .45, l: .085 + (1 - x.l) * .55 }), a: c.a });
  if (x.l < .14 && x.s < .35) return hex({ ...rgb({ h: x.h, s: x.s * .5, l: .24 }), a: c.a });
  return null;
}
// lijnen: lichtgrijs wordt donkere lijn, zwart wordt licht
export function lijnKleur(c) {
  const x = hsl(c);
  if (x.l >= .68 && x.s < .4) return hex({ ...rgb({ h: x.h, s: x.s * .4, l: .2 + (1 - x.l) * .3 }), a: c.a });
  if (x.l < .2 && x.s < .3) return hex({ ...rgb({ h: x.h, s: .06, l: .78 }), a: c.a });
  return null;
}
const KLEUR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black)\b/g;
const vervang = (waarde, fn) => { let ander = false; const uit = waarde.replace(KLEUR, k => { const c = parse(k); const n = c && fn(c); if (n) { ander = true; return n; } return k; }); return ander ? uit : null; };
const gekleurdVlak = waarde => { if (/var\(--(?!bg|soft|zand|line|card)[a-z]/i.test(waarde) && !/var\(--(bg|soft|zand)/i.test(waarde)) return true; let ja = false; String(waarde).replace(KLEUR, k => { const c = parse(k); if (c && c.a > .5) { const x = hsl(c); if (x.l < .86 && !(x.l < .14 && x.s < .35)) ja = true; } return k; }); return ja; };

// ---------- CSS lezen ----------
function blokken(css) { // geeft [{pre, body}] op het hoogste niveau
  const uit = []; let i = 0, n = css.length;
  while (i < n) {
    while (i < n && /\s/.test(css[i])) i++;
    if (css.startsWith('/*', i)) { const e = css.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    const s = i; let d = 0, q = '';
    while (i < n && !(css[i] === '{' && !q)) { const c = css[i]; if (q) { if (c === q && css[i - 1] !== '\\') q = ''; } else if (c === '"' || c === "'") q = c; else if (c === ';' && !d) break; i++; }
    if (i >= n) break; if (css[i] === ';') { i++; continue; } // @import en dergelijke
    const pre = css.slice(s, i).trim(); i++; const b = i; d = 1; q = '';
    while (i < n && d) { const c = css[i]; if (q) { if (c === q && css[i - 1] !== '\\') q = ''; } else if (c === '"' || c === "'") q = c; else if (c === '{') d++; else if (c === '}') d--; i++; }
    uit.push({ pre, body: css.slice(b, i - 1) });
  }
  return uit;
}
function decls(body) { const uit = []; let d = 0, q = '', s = 0; for (let i = 0; i <= body.length; i++) { const c = body[i]; if (q) { if (c === q) q = ''; continue; } if (c === '"' || c === "'") q = c; else if (c === '(') d++; else if (c === ')') d--; else if ((c === ';' || i === body.length) && !d) { const x = body.slice(s, i).trim(); s = i + 1; const k = x.indexOf(':'); if (k > 0) uit.push([x.slice(0, k).trim().toLowerCase(), x.slice(k + 1).replace(/!important\s*$/i, '').trim()]); } } return uit; }
function selectors(pre) { const uit = []; let d = 0, s = 0; for (let i = 0; i <= pre.length; i++) { const c = pre[i]; if (c === '(') d++; else if (c === ')') d--; else if ((c === ',' || i === pre.length) && !d) { uit.push(pre.slice(s, i).trim()); s = i + 1; } } return uit.filter(Boolean); }
const hoger = sel => /^(html|:root)\b/.test(sel) ? sel : /^body\b/.test(sel) ? 'html ' + sel : 'html ' + sel;

const EIGEN = /^--(ink|body|muted|accent|accent-ink|bg|soft|line|line-strong|zand)$/; // die zet VARS zelf
let ROOT = {};
function rootVars(css) { const m = {}; for (const r of String(css).matchAll(/:root\s*\{([^}]*)\}/g)) for (const [p, v] of decls(r[1])) if (p.startsWith('--')) m[p] = v; return m; }
// color:var(--koraal) of var(--x,#fallback): de lichte waarde van de variabele lichter maken als hij op donker te weinig contrast heeft
function varTekst(v, diep = 0) { const m = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(String(v).trim()); if (!m || EIGEN.test(m[1]) || diep > 3) return null; if (ROOT[m[1]]) { const c = parse(ROOT[m[1]]); return c ? tekstKleur(c) : null; } const f = (m[2] || '').trim(); if (/^var\(/.test(f)) return varTekst(f, diep + 1); const c = parse(f); return c ? tekstKleur(c) : null; }
function regels(css, media, uit) {
  for (const { pre, body } of blokken(css)) {
    if (/^@media/i.test(pre)) { const m = pre.replace(/^@media\s*/i, '').trim(); if (/prefers-color-scheme/i.test(m)) continue; regels(body, m, uit); continue; }
    if (/^@supports/i.test(pre)) { regels(body, media, uit); continue; }
    if (pre.startsWith('@')) continue; // keyframes, font-face
    if (/^:root\b/.test(pre)) { const los = []; for (const [p, v] of decls(body)) { if (!p.startsWith('--')) continue; const rol = /(^--(ink|body|muted|navy|text|tekst|fg|kop|sub)\b)/.test(p) ? tekstKleur : /(bg|soft|zand|card|paper|vlak|achter|wit)/.test(p) ? vlakKleur : /(line|lijn|rand|border)/.test(p) ? lijnKleur : null; if (!rol) continue; const c = parse(v); const n = c && rol(c); if (n) los.push(`${p}:${n}`); } if (los.length) uit.push({ media, r: `:root{${los.join(';')}}` }); continue; } // variabelen per rol; die van de site zelf (VARS) winnen
    if (/(^|,)\s*\.(dk|tk)\b/.test(pre)) continue; // het verhaal en de tekeningen hebben eigen beelden en kleuren
    const d = decls(body), los = [];
    const vlakGekleurd = d.some(([p, v]) => /^background(-color)?$/.test(p) && gekleurdVlak(v));
    for (const [p, v] of d) {
      if (/^--(q|c|k)$/.test(p)) { const c = parse(v); if (c && contrast(c, ref) < 4.5) { const n = tekstKleur(c); if (n) los.push(`${p}:${n}!important`); } continue; }
      if (p.startsWith('--') || (/var\(/.test(v) && !KLEUR.test(v) && p !== 'color')) { KLEUR.lastIndex = 0; continue; }
      KLEUR.lastIndex = 0;
      if (p === 'color') { if (vlakGekleurd) continue; const n = varTekst(v) || vervang(v, tekstKleur); if (n) los.push(`color:${n}!important`); }
      else if (p === 'background-color') { const n = vervang(v, vlakKleur); if (n) los.push(`background-color:${n}!important`); }
      else if (p === 'background') { const n = vervang(v, vlakKleur); if (n) los.push(/gradient|url\(/i.test(v) ? `background:${n}!important` : `background-color:${n}!important`); }
      else if (/^(border(-(top|right|bottom|left))?(-color)?|outline(-color)?|box-shadow|column-rule)$/.test(p)) { const n = vervang(v, lijnKleur); if (n) los.push(`${p}:${n}!important`); }
    }
    if (!los.length) continue;
    const sel = selectors(pre).map(hoger).join(',');
    uit.push({ media, r: `${sel}{${los.join(';')}}` });
  }
}

// variabelen van de site in het donker
const VARS = ':root{color-scheme:light dark}@media (prefers-color-scheme:dark){:root:root{--bg:#0F1117;--ink:#EEF0F4;--body:#C9CDD3;--muted:#AAB6DA;--line:#262C38;--line-strong:#46505F;--soft:#1A2135;--zand:#1C1913;--accent:#7FA6FF;--accent-ink:#0B1022;color-scheme:dark}html,body{background:#0F1117;color:#EEF0F4}img{filter:none}}';

// (max-width:560px) -> (prefers-color-scheme:dark) and (max-width:560px); screen and (...) -> screen and (prefers-color-scheme:dark) and (...)
function mediaDonker(m) {
  if (!m) return '(prefers-color-scheme:dark)';
  const delen = selectors(m).map(x => { if (/^not\b/i.test(x)) return null; const t = /^(only\s+)?(screen|all|print)\b\s*(and\s*)?/i.exec(x); if (t) { const rest = x.slice(t[0].length).trim(); return `${t[2]} and (prefers-color-scheme:dark)${rest ? ' and ' + rest : ''}`; } return `(prefers-color-scheme:dark) and ${x}`; });
  return delen.some(x => !x) ? null : delen.join(',');
}
const cache = new Map();
const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i += 7) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(36) + s.length; };
const ont = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function inline(html, uit) {
  const gezien = new Set();
  for (const m of String(html).matchAll(/\sstyle="([^"]*)"/g)) {
    const st = ont(m[1]); if (gezien.has(st) || !(KLEUR.test(st) || /color:\s*var\(/.test(st))) { KLEUR.lastIndex = 0; continue; } KLEUR.lastIndex = 0; gezien.add(st);
    const d = decls(st), los = [], vlakGekleurd = d.some(([p, v]) => /^background(-color)?$/.test(p) && gekleurdVlak(v));
    for (const [p, v] of d) {
      if (p === 'color') { if (vlakGekleurd) continue; const n = varTekst(v) || vervang(v, tekstKleur); if (n) los.push(`color:${n}!important`); }
      else if (/^--(q|c|k)$/.test(p)) { const c = parse(v); if (c && contrast(c, ref) < 4.5) { const n = tekstKleur(c); if (n) los.push(`${p}:${n}!important`); } }
      else if (p === 'background-color' || p === 'background') { const n = vervang(v, vlakKleur); if (n) los.push(/gradient|url\(/i.test(v) ? `background:${n}!important` : `background-color:${n}!important`); }
      else if (/^(border(-(top|right|bottom|left))?(-color)?|outline(-color)?|box-shadow)$/.test(p)) { const n = vervang(v, lijnKleur); if (n) los.push(`${p}:${n}!important`); }
    }
    if (los.length) uit.push({ media: '', r: `[style="${st.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]{${los.join(';')}}` });
  }
}
export function donkerCss(html) {
  const css = [...String(html).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
  const stijlen = [...String(html).matchAll(/\sstyle="([^"]*)"/g)].map(m => m[1]).join('|');
  const k = fnv(css + '§' + stijlen); if (cache.has(k)) return cache.get(k);
  const uit = []; try { ROOT = rootVars(css); regels(css, '', uit); inline(html, uit); } catch (e) { /* liever geen donkere laag dan een kapotte pagina */ }
  const per = new Map(); for (const x of uit) { if (!per.has(x.media)) per.set(x.media, []); per.get(x.media).push(x.r); }
  let s = VARS; for (const [m, rs] of per) { const q = mediaDonker(m); if (q) s += `@media ${q}{${[...new Set(rs)].join('')}}`; }
  if (cache.size > 50) cache.clear(); cache.set(k, s); return s;
}
// in de pagina zetten, vlak voor </body>, zodat hij na alle andere CSS komt
export function metDonker(html) {
  if (typeof html !== 'string' || !/<\/body>/i.test(html) || !/<style/i.test(html)) return html;
  return html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `<style id="donker">${donkerCss(html)}</style></body>`);
}
