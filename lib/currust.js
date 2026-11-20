// Kopie van todayin bzz/lib/cwrust.js voor de gidsen en de bedrijvengids op curacao.day (lib/cur.js curHandler); sinds 20 nov 2026 gelijk
// aan de bron (okerstreep, geen grijs, vette kale links), want lib/curdonker.js maakt nu ook hier de donkere laag. Alleen RUST_CSS heeft
// drie regels extra voor de gidsen (eyebrow, .lbl/.kicker, links in dd). Werk beide bij als de regels veranderen.
// Rust op de pagina: één typografie voor heel curacao.day (Henkjan 14 nov 2026: "hier bijv 2 letter groottes . ? Ik wil 1 . Probeer zo min
// mogelijk UX variabelen op een pagina te hebben voor de rust ." en "Voor consistentie plan door en onderhoudt het .").
// Gemeten op de homepage voor deze laag: 49 combinaties van lettermaat en dikte, 14 labelstijlen, 12 linkstijlen, 6 diktes.
// Deze laag loopt over de CSS en de style-attributen van elke pagina (api/cw.js H, vóór de donkere laag), zodat ook elk nieuw blok vanzelf
// meedoet:
//  - lettermaten naar 4 rollen: 13 (labels, bron, klein), 16 (alle gewone tekst, één maat), 18 (titels, vet), 24 (koppen en grote getallen);
//    30 px en groter blijft (paginatitel en de datumkop), net als het merk (.brand)
//  - diktes naar 2: normaal (400) en vet (700)
//  - labels (hoofdletters) één stijl: 13 px, vet, spatiëring .06em, donkerblauw (behalve op een donker vlak)
//  - tekstlinks één stijl: inkt met één okerkleurige streep eronder (Penha-oker #E3A93B), 2 px, 4 px ruimte (Henkjan 20 nov 2026, bij vijf
//    soorten strepen op /murals: "Dit is wel toevoeging voor minimalistische stijl gekleurde streepjes . Niet te veel door elkaar gebruiken !");
//    ook een streep die een module als onderrand tekent (border-bottom 2 of 3 px met text-decoration:none) wordt deze ene streep
// Bewaking: bzz/scripts/check-mobiel.mjs telt per pagina de lettermaten, labelstijlen en linkstijlen en meldt elke afwijking.
export const MATEN = [13, 16, 18, 24];
const VLAG = '#002B7F', OKER = '#E3A93B', DONKERBLAUW = '#2A3566', INKT = '#111113';
// onder 14 px is klein (labels, bron): 13; 14 tot 17 is tekst (ook plaatsnamen en uitleg): 16; tot 21,5 titel: 18; tot 30 kop: 24
export const snap = px => px < 14 ? 13 : px < 17 ? 16 : px < 21.5 ? 18 : px < 30 ? 24 : px; // gewone tekst 16, titels 18 (Henkjan 15 nov 2026: "Nee titels moeten wel in verhouding dus groter . Ik bedoel gewone tekst daar is maar 1 size niet meer 2 .")
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
const TITELSEL = /(^|[\s>+~,(])(h[1-6]|b|strong|th|dt|summary|legend)(?![\w-])|kop|titel|title|naam|name|head|\.pkh|\.kr-h|\.adn|\.nr1|\.trs|\.mgp/i;
const decls = s => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ';' && !d) { out.push(cur); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur); return out.map(x => { const i = x.indexOf(':'); return i < 0 ? null : [x.slice(0, i).trim().toLowerCase(), x.slice(i + 1).trim()]; }).filter(Boolean); };

// één declaratieblok (zonder accolades) en de selector ervoor
export function blok(inhoud, sel = '') {
  if (!/font|text-transform|text-decoration/i.test(inhoud)) return inhoud;
  if (/\.brand\b/.test(sel)) return inhoud;
  const imp = v => /!important\s*$/i.test(v), kaal = v => v.replace(/\s*!important\s*$/i, '');
  // gewone tekst is altijd 16 (één maat); 18 en 24 zijn voor titels en koppen: vet, of een kop-selector
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
  // tekstlinks: één stijl (inkt, okerstreep); op een donker vlak (lichte tekst) blijft de eigen tekstkleur, de streep is daar ook oker
  const deco = (get('text-decoration') || '') + ' ' + (get('text-decoration-line') || '');
  // een streep als onderrand (border-bottom 2-3 px, text-decoration:none) is ook een link: die wordt dezelfde onderstreping
  const rand = get('border-bottom'), alsRand = /^none\b/i.test(get('text-decoration') || '') && rand && /^[23](\.\d+)?px\s+solid\s+(?!transparent)/i.test(rand) && !get('background') && !get('background-color');
  let dd = d;
  if (alsRand) dd = d.map(([p, v]) => p === 'border-bottom' ? [p, '0'] : p === 'text-decoration' ? [p, 'underline' + (imp(v) ? ' !important' : '')] : [p, v]);
  // een eigen streepkleur zonder underline in dezelfde regel (bv. .dl-a .dl-cta) wordt ook oker; currentColor blijft
  const dkl = get('text-decoration-color');
  if (dkl && !/currentcolor|^var\(/i.test(dkl) && !/underline/i.test(deco) && !alsRand) extra.push('text-decoration-color:' + OKER);
  if (/underline/i.test(deco) || alsRand) {
    extra.push('text-decoration-color:' + OKER, 'text-decoration-thickness:2px', 'text-underline-offset:4px');
    if (!licht && kleur != null && !/^var\(--(q|c)\b/.test(kleur)) extra.push('color:' + INKT);
  }
  const uit = dd.map(([p, v]) => p + ':' + v).join(';');
  // stond de eigen waarde op !important (bv. .dl-b a), dan de vaste stijl ook, anders wint de oude kleur
  const xs = extra.map(x => { const p = x.slice(0, x.indexOf(':')); return d.some(([q, v]) => q === p && imp(v)) ? x + '!important' : x; });
  return xs.length ? uit + ';' + xs.join(';') : uit;
}

// wat de regels hierboven niet vanzelf vangen (kleur of streep komt uit een andere regel dan de maat): met naam, na alle andere CSS.
// Onderhoud: meldt de mobiele controle een tweede label- of linkstijl, zet de selector hier (of los het op in de module zelf).
const LINK = 'font-size:16px!important;font-weight:700!important;color:#111113!important;text-decoration:underline!important;text-decoration-color:#E3A93B!important;text-decoration-thickness:2px!important;text-underline-offset:4px!important';
const BRON = 'font-size:13px!important;font-weight:400!important;color:#2A3566!important;text-decoration:none!important';
export const RUST_CSS = [
  // tekstlinks in lopende tekst en de vaste linkregels per blok
  `html body main p a:not([class]),html body main.mag>section.card>p>a:not([class]),html body #natuur .nt-s a,html body #toen .toen-b a,html body #nummers p>a,html body .evl a,html body .gv-f a,html body section.card div.li>span>a:not([class]),html body main ul ul li>a:not([class]){${LINK}}`,
  // een kale link zonder class (de standaard a{color:var(--accent)}) is ook inkt met okerstreep; vet staat in RUST_BEGIN (Henkjan 20 nov 2026:
  // "Ja alles gelijk trekken"); :where houdt dit zo zwak als die standaard, elke eigen regel wint
  `:where(main) a:where(:not([class])){color:${INKT};text-decoration-color:${OKER};text-decoration-thickness:2px;text-underline-offset:4px}`,
  // op een donker vlak (Ask me anything, live cam) blijft de eigen lichte kleur
  `html body #ama a,html body .ama a,html body .cam a,html body .camv a{color:inherit!important;text-decoration-color:currentColor!important}`,
  // bronvermelding is klein en zonder streep (zoals de fotobron)
  `html body a.bron,html body .hh-b a{${BRON}}`,
  `html body .wn-lb{color:${DONKERBLAUW}!important}`,
  // titels in lijsten in verhouding groter dan de tekst (15 nov 2026)
  `html body #opeiland .mge span{font-size:18px!important;font-weight:700!important}`,
  // alleen op de gidsen: kicker boven de titel, labels en links in een lijst met termen
  `html body main p.eyebrow,html body main p.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow.eyebrow>a{font-size:13px!important;font-weight:400!important;letter-spacing:0!important;text-transform:none!important;color:${DONKERBLAUW}!important;text-decoration:none!important}`, // kicker zoals op de site (UX-panel 20 nov 2026): geen hoofdletters, normaal
  `html body main .lbl,html body main .kicker{color:${DONKERBLAUW}!important}`,
  `html body main dd a{${LINK}}`,
].join('');

// kale tekstlinks vet (Henkjan 20 nov 2026: "Ja alles gelijk trekken"): zonder gewicht (specificiteit 0) en vóór alle andere CSS, zodat elke
// eigen regel wint. Een regel die links in een blok de streep afneemt (.kn-l a{text-decoration:none}) maakt rijen, geen tekstlinks: css()
// zet daar direct achter :where(<selector>){font-weight:inherit}, ook gewicht 0 maar later, dus die rijen houden hun eigen dikte.
export const RUST_BEGIN = ':where(main a:not([class])){font-weight:700}';
const rij = (sel, inh) => {
  const x = String(sel).replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!x || x[0] === '@' || /::|:(hover|focus|active|visited)/.test(x) || !/text-decoration\s*:\s*none/i.test(inh) || /font-weight|(^|;)\s*font\s*:/i.test(inh)) return '';
  return x.split(',').some(d => /(^|[\s>+~])a(?![\w-])[^\s>+~]*$/.test(d.trim())) ? `:where(${x}){font-weight:inherit}` : '';
};
// alle CSS in <style> en alle style-attributen; scripts blijven onaangeroerd
export function css(t) { return String(t).replace(/([^{}]*)\{([^{}]*)\}/g, (m, sel, inh) => sel + '{' + blok(inh, sel) + '}' + rij(sel, inh)); }
// Geen grijze tekst meer (Henkjan 19 nov 2026: "Ik wil nergens meer grijs tinten gewoon zwart of donkerblauw. Veel beter leesbaar ."):
// elke tekstkleur die een middengrijs is (weinig kleur, helderheid 0,03 tot 0,40, of zwart met doorzichtigheid) wordt #111. Dat geldt
// voor color: en voor kleurvariabelen (--muted en dergelijke); niet voor achtergrond of lijnen, en niet binnen de donkere modus (die laag
// maakt lib/cwdonker.js daarna zelf uit de lichte kleuren, dus #111 wordt daar vanzelf licht).
const grijsTekst = v => {
  const s = String(v || '').trim().toLowerCase(); let r, g, b, a = 1, m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) { const h = m[1].length === 3 ? m[1].split('').map(x => x + x).join('') : m[1]; r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16); }
  else if ((m = s.match(/^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+%?))?\s*\)$/))) { r = +m[1]; g = +m[2]; b = +m[3]; if (m[4] != null) a = /%$/.test(m[4]) ? parseFloat(m[4]) / 100 : +m[4]; }
  else return false;
  if (a < 1) return Math.max(r, g, b) < 60; // zwart of donker met doorzichtigheid is grijs op wit
  const L = x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }, lum = .2126 * L(r) + .7152 * L(g) + .0722 * L(b);
  return Math.max(r, g, b) - Math.min(r, g, b) < 50 && lum >= .03 && lum <= .4;
};
export function zonderGrijs(css) {
  const t = String(css), donker = [];
  for (const m of t.matchAll(/@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{/gi)) { let d = 1, i = m.index + m[0].length; for (; i < t.length && d; i++) { if (t[i] === '{') d++; else if (t[i] === '}') d--; } donker.push([m.index, i]); }
  const inDonker = i => donker.some(([a, b]) => i >= a && i < b);
  return t.replace(/((?:^|[;{\s"])(?:color|--[\w-]*(?:muted|grijs|grey|gray|sub|zacht|dim|mute|meta|ink2|secondary|body)[\w-]*)\s*:\s*)(#[0-9a-fA-F]{3,6}\b|rgba?\([^)]*\))/g, (m, k, v, i) => (inDonker(i) || !grijsTekst(v) ? m : k + '#111113'));
}
export function metRust(html) {
  if (typeof html !== 'string' || !/<style|style="/i.test(html)) return html;
  try {
    const delen = html.split(/(<script\b[^>]*>[\s\S]*?<\/script>)/i);
    for (let i = 0; i < delen.length; i += 2) {
      delen[i] = delen[i]
        .replace(/(<style(?:\s[^>]*)?>)([\s\S]*?)(<\/style>)/gi, (m, a, c, b) => a + zonderGrijs(css(c)) + b)
        .replace(/(\sstyle=")([^"]*)(")/g, (m, a, s, b) => a + zonderGrijs(blok(s)) + b);
    }
    // de vaste laag vlak voor </body>, zodat hij na alle andere CSS komt (de donkere laag komt daar weer na)
    return delen.join('').replace(/<head>/i, `<head><style id="rust0">${RUST_BEGIN}</style>`).replace(/<\/body>(?![\s\S]*<\/body>)/i, `<style id="rust">${RUST_CSS}</style></body>`);
  } catch (e) { return html; } // liever de oude opmaak dan een kapotte pagina
}
