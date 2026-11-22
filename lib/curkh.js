// Keuzehulpen op curacao.day in het formaat van de skill keuzehulp-bouw (Henkjan 21 nov 2026: "Kijk naar de keuzehulp skill en maak alle
// curacao keuzehulpen ook daarmee . Is veel beter dan wat er nu staat . . En optimaliseer verder voor de organische groei op deze manier . SEO EN
// LLM . Laat me Resorts keuzehulp hier zien met link zodat ik meteen kan klikken geld t voor alles wat je maakt . Ik wil eerst zien voor live gaat .").
// Volgorde (skill sectie 6): kruimelpad, bovenregel, H1, bijgewerkt, inleiding, antwoord (één vette eerste keus plus hoogstens 2 zinnen en één
// zwarte knop), de chat van de site, alle zaken op onze Keuzehulp-score, één situatietabel, uitleg, FAQ, meer keuzehulpen, aanmelden, voet.
// Ranglijst: de Keuzehulp-score van 0 tot 100 (zelfde weging als lib/rdam.js WEGING): reviews 45, aantal 20, platforms 15, gegevens 10, lezers 10.
// Proefversie: alleen met ?v=kh (noindex, canonical naar de gewone pagina) tot Henkjan hem goedkeurt; curHandler in lib/cur.js kiest.
// Alles in de taal van de pagina; tekst #111113, rust en donkere laag komen van curHandler (lib/currust.js, lib/curdonker.js).

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

import { nieuwsHtml, NIEUWS_CSS } from './curnieuws.js'; // nieuws over een zaak: één neutrale regel met datum en bron, telt niet mee (22 nov 2026)
export const KT = {
  nl: { kruim: 'Keuzehulpen', boven: l => 'Keuzehulp ' + l, bij: 'Bijgewerkt', inl: (n, l, p) => n + ' ' + l + ' op Curaçao naast elkaar, op reviews van ' + p + ' platforms.', inlE: (n, l) => n + ' ' + l + ' op Curaçao naast elkaar.', eerste: x => 'De beste keus: ' + x + '.', eersteE: x => 'Begin bij ' + x + '.', score: (p, r, n) => p + ' van 100 op onze Keuzehulp-score, ' + r + ' van 5 uit ' + n + ' reviews.', sit: (a, b) => a + '; ' + b + '.', pt: p => p + ' van 100', rev: (r, n) => r + ' van 5 uit ' + n + ' reviews', op: 'op', waarom: i => 'Waarom plek ' + i, meerOver: x => 'Meer over ' + x, alle: (n, l) => 'Alle ' + n + ' ' + l + ' vergeleken', toon: n => 'Toon alle ' + n, sitKop: 'Welke past bij jou', kol: ['Jouw situatie', 'Beste keus', 'Waarom'], voordeligst: 'Zo voordelig mogelijk', vanaf: 'vanaf', uitKop: 'Zo kiezen we', uit: ['Onze eigen Keuzehulp-score van 0 tot 100.', 'Hoe goed de reviews zijn: 45 punten. We nemen alle platforms die we vinden, elk naar een schaal van 5.', 'Hoeveel mensen een review gaven: 20 punten.', 'Op hoeveel platforms: 15 punten.', 'Gegevens compleet (website, prijs, plek, tijden): 10 punten.', 'Wat lezers van curacao.day zeggen: 10 punten.', 'Niemand betaalt voor een plek.'], weten: 'Goed om te weten', bronnen: n => 'Bronnen: ' + n + ' pagina\'s, gecontroleerd op de datum hierboven.', meer: 'Meer keuzehulpen', alleK: 'Alle keuzehulpen' },
  en: { kruim: 'Guides', boven: l => 'Guide to ' + l, bij: 'Updated', inl: (n, l, p) => n + ' ' + l + ' in Curaçao side by side, on reviews from ' + p + ' platforms.', inlE: (n, l) => n + ' ' + l + ' in Curaçao side by side.', eerste: x => 'Best pick: ' + x + '.', eersteE: x => 'Start with ' + x + '.', score: (p, r, n) => p + ' out of 100 on our Guide score, ' + r + ' out of 5 from ' + n + ' reviews.', sit: (a, b) => a + '; ' + b + '.', pt: p => p + ' out of 100', rev: (r, n) => r + ' out of 5 from ' + n + ' reviews', op: 'on', waarom: i => 'Why number ' + i, meerOver: x => 'More about ' + x, alle: (n, l) => 'All ' + n + ' ' + l + ' compared', toon: n => 'Show all ' + n, sitKop: 'Which one fits you', kol: ['Your situation', 'Best pick', 'Why'], voordeligst: 'Lowest price', vanaf: 'from', uitKop: 'How we rank', uit: ['Our own Guide score from 0 to 100.', 'How good the reviews are: 45 points. We use every platform we find, each converted to a 5-point scale.', 'How many people left a review: 20 points.', 'On how many platforms: 15 points.', 'Complete details (website, price, location, hours): 10 points.', 'What curacao.day readers say: 10 points.', 'Nobody pays for a place.'], weten: 'Good to know', bronnen: n => 'Sources: ' + n + ' pages, checked on the date above.', meer: 'More guides', alleK: 'All guides' },
  de: { kruim: 'Ratgeber', boven: l => 'Ratgeber ' + l, bij: 'Aktualisiert', inl: (n, l, p) => n + ' ' + l + ' auf Curaçao im Vergleich, mit Bewertungen von ' + p + ' Plattformen.', inlE: (n, l) => n + ' ' + l + ' auf Curaçao im Vergleich.', eerste: x => 'Die beste Wahl: ' + x + '.', eersteE: x => 'Fang an mit ' + x + '.', score: (p, r, n) => p + ' von 100 in unserem Ratgeber-Score, ' + r + ' von 5 aus ' + n + ' Bewertungen.', sit: (a, b) => a + '; ' + b + '.', pt: p => p + ' von 100', rev: (r, n) => r + ' von 5 aus ' + n + ' Bewertungen', op: 'auf', waarom: i => 'Warum Platz ' + i, meerOver: x => 'Mehr über ' + x, alle: (n, l) => 'Alle ' + n + ' ' + l + ' im Vergleich', toon: n => 'Alle ' + n + ' zeigen', sitKop: 'Was passt zu dir', kol: ['Deine Situation', 'Beste Wahl', 'Warum'], voordeligst: 'Möglichst günstig', vanaf: 'ab', uitKop: 'So bewerten wir', uit: ['Unser eigener Ratgeber-Score von 0 bis 100.', 'Wie gut die Bewertungen sind: 45 Punkte. Wir nehmen alle Plattformen, die wir finden, jeweils auf eine 5er-Skala umgerechnet.', 'Wie viele Menschen bewertet haben: 20 Punkte.', 'Auf wie vielen Plattformen: 15 Punkte.', 'Vollständige Angaben (Website, Preis, Lage, Zeiten): 10 Punkte.', 'Was Leser von curacao.day sagen: 10 Punkte.', 'Niemand zahlt für einen Platz.'], weten: 'Gut zu wissen', bronnen: n => 'Quellen: ' + n + ' Seiten, geprüft am obigen Datum.', meer: 'Weitere Ratgeber', alleK: 'Alle Ratgeber' },
  es: { kruim: 'Guías', boven: l => 'Guía de ' + l, bij: 'Actualizado', inl: (n, l, p) => 'Comparamos ' + n + ' ' + l + ' en Curazao con reseñas de ' + p + ' plataformas.', inlE: (n, l) => 'Comparamos ' + n + ' ' + l + ' en Curazao.', eerste: x => 'La mejor opción: ' + x + '.', eersteE: x => 'Empieza por ' + x + '.', score: (p, r, n) => p + ' de 100 en nuestra puntuación, ' + r + ' de 5 con ' + n + ' reseñas.', sit: (a, b) => a + '; ' + b + '.', pt: p => p + ' de 100', rev: (r, n) => r + ' de 5 con ' + n + ' reseñas', op: 'en', waarom: i => 'Por qué el puesto ' + i, meerOver: x => 'Más sobre ' + x, alle: (n, l) => 'Comparamos ' + n + ' ' + l, toon: n => 'Ver la lista completa (' + n + ')', sitKop: 'Cuál te conviene', kol: ['Tu situación', 'Mejor opción', 'Por qué'], voordeligst: 'Lo más económico', vanaf: 'desde', uitKop: 'Cómo clasificamos', uit: ['Nuestra propia puntuación de 0 a 100.', 'Qué tan buenas son las reseñas: 45 puntos. Usamos todas las plataformas que encontramos, cada una en una escala de 5.', 'Cuántas personas dejaron una reseña: 20 puntos.', 'En cuántas plataformas: 15 puntos.', 'Datos completos (web, precio, ubicación, horario): 10 puntos.', 'Lo que dicen los lectores de curacao.day: 10 puntos.', 'Nadie paga por un puesto.'], weten: 'Bueno saber', bronnen: n => 'Fuentes: ' + n + ' páginas, revisadas en la fecha de arriba.', meer: 'Más guías', alleK: 'Todas las guías' },
  pt: { kruim: 'Guias', boven: l => 'Guia de ' + l, bij: 'Atualizado', inl: (n, l, p) => n + ' ' + l + ' em Curaçao lado a lado, com avaliações de ' + p + ' plataformas.', inlE: (n, l) => n + ' ' + l + ' em Curaçao lado a lado.', eerste: x => 'A melhor escolha: ' + x + '.', eersteE: x => 'Comece por ' + x + '.', score: (p, r, n) => p + ' de 100 na nossa pontuação, ' + r + ' de 5 com ' + n + ' avaliações.', sit: (a, b) => a + '; ' + b + '.', pt: p => p + ' de 100', rev: (r, n) => r + ' de 5 com ' + n + ' avaliações', op: 'em', waarom: i => 'Por que o lugar ' + i, meerOver: x => 'Mais sobre ' + x, alle: (n, l) => 'Comparamos ' + n + ' ' + l, toon: n => 'Ver a lista completa (' + n + ')', sitKop: 'Qual combina com você', kol: ['Sua situação', 'Melhor escolha', 'Por quê'], voordeligst: 'O mais barato', vanaf: 'a partir de', uitKop: 'Como classificamos', uit: ['Nossa própria pontuação de 0 a 100.', 'Quão boas são as avaliações: 45 pontos. Usamos todas as plataformas que encontramos, cada uma numa escala de 5.', 'Quantas pessoas avaliaram: 20 pontos.', 'Em quantas plataformas: 15 pontos.', 'Dados completos (site, preço, local, horário): 10 pontos.', 'O que dizem os leitores do curacao.day: 10 pontos.', 'Ninguém paga por um lugar.'], weten: 'Bom saber', bronnen: n => 'Fontes: ' + n + ' páginas, verificadas na data acima.', meer: 'Mais guias', alleK: 'Todos os guias' },
};

// ---------- Keuzehulp-score (lib/rdam.js WEGING, naar de gegevens van een gids op curacao.day) ----------
const norm = x => x.max && x.max !== 5 ? x.score / x.max * 5 : x.score;
const reviewsVan = v => (v.scores || []).filter(x => x && x.score && x.aantal);
function ruw(v) { const s = reviewsVan(v); if (!s.length) return null; let W = 0, T = 0, n = 0; s.forEach(x => { const w = Math.min(x.aantal, 400); W += w; T += w * norm(x); n += x.aantal; }); return { r: T / W, W, n, plat: new Set(s.map(x => String(x.platform || '').replace(/ Maps$/, ''))).size, gem: Math.round(T / W * 10) / 10 }; }
export function khScores(items, prof) {
  const rr = items.map(ruw), met = rr.filter(Boolean), C = met.length ? met.reduce((a, q) => a + q.r, 0) / met.length : 4; // gemiddelde van de gids: 30 denkbeeldige reviews erop, zodat een handvol reviews niet alles bepaalt
  return items.map((v, i) => {
    const q = rr[i], P = (prof || {})[v.id] || {};
    if (!q) return { v, q: null, tot: null };
    const o = (q.W * q.r + 30 * C) / (q.W + 30);
    const p = { reviews: Math.round(45 * Math.max(0, Math.min(1, (o - 3) / 2))), aantal: Math.round(20 * Math.min(1, Math.log10(1 + q.n) / Math.log10(501))), bronnen: Math.min(15, q.plat * 5), gegevens: Math.round(2.5 * ((v.url || v.aff || v.boek ? 1 : 0) + (v.prijs && v.prijs.bedrag > 0 ? 1 : 0) + (v.plaats ? 1 : 0) + (P.uren || P.tel ? 1 : 0))), bezoekers: 5 };
    return { v, q, p, tot: p.reviews + p.aantal + p.bronnen + p.gegevens + p.bezoekers };
  }).sort((a, b) => (b.tot ?? -1) - (a.tot ?? -1) || ((b.q && b.q.n) || 0) - ((a.q && a.q.n) || 0) || String(a.v.naam).localeCompare(String(b.v.naam)));
}
// korte naam voor in een zin ("The Rif at Mangrove Beach Corendon Curaçao All-Inclusive, Curio by Hilton" wordt "The Rif at Mangrove Beach Corendon")
export const kortNaam = v => v.kort || ((n0 => /\([^)]*$/.test(n0.split(',')[0]) ? n0.replace(/\s*\([^)]*\)/g, '') : n0)(String(v.naam))).split(',')[0].replace(/\s+(Curaçao\s+)?All[- ]Inclusive(\s+Resort)?(\s+Curaçao)?$/i, '').replace(/\s+Resort\s*&\s*Spa$/i, '').trim();

const CSS = `
.kh{max-width:760px}
.kh a{color:#111113}
.kh .kh-pad{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px;font-size:16px}.kh .kh-pad a{text-decoration:none}.kh .kh-pad span{color:#111113}
.kh .kh-bov{margin:0 0 6px;font-size:13px;font-weight:700;color:#111113;letter-spacing:0;text-transform:none}
.kh h1{font-size:clamp(38px,8vw,54px)!important;line-height:1.08!important;letter-spacing:-.035em;margin:0 0 10px!important;color:#111113}
.kh .kh-bij{margin:0 0 10px;font-size:16px;color:#111113}
.kh .kh-inl{margin:0 0 12px;font-size:16px;line-height:1.55;color:#111113;max-width:68ch}
.kh .kh-ant{border:1px solid #D7DCE8;border-radius:16px;padding:16px 16px 14px;margin:0 0 18px;background:#fff}
.kh .kh-ant p{margin:0 0 6px;font-size:16px;line-height:1.55;color:#111113}.kh .kh-ant p b{font-size:18px}
.kh .kh-knop{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px 22px;margin:6px 0 0;border-radius:999px;background:#111113;color:#fff!important;font-size:16px;font-weight:700;text-decoration:none!important;line-height:1.2}
.kh .kh-knop:hover{background:#000}
html body main.kh section>h2.kh-h2:not(.lbl){font-size:24px!important;line-height:1.25!important;margin:40px 0 14px!important;color:#111113!important;letter-spacing:-.02em!important;text-transform:none!important;font-weight:700!important}
html body main.kh>section{padding:0!important}
html body main.kh details>summary{color:#111113!important}
.kh .kh-k{border:1px solid #D7DCE8;border-radius:16px;padding:16px 18px;margin:0 0 12px;background:#fff}
.kh .kh-k h3{display:flex;gap:10px;align-items:baseline;margin:0 0 6px;font-size:18px;line-height:1.3;font-weight:700}.kh .kh-k h3 a{text-decoration:none}
.kh .kh-nr{flex:none;display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:999px;border:2px solid #111113;font-size:13px;font-weight:700}
.kh .kh-sc{margin:0 0 4px;font-size:16px;color:#111113}.kh .kh-sc b{font-weight:700}
.kh .kh-f{margin:0 0 8px;font-size:16px;color:#111113}
.kh .kh-pm{list-style:none;margin:0 0 12px;padding:0;font-size:16px;line-height:1.5}.kh .kh-pm li{position:relative;padding-left:20px;margin:3px 0}.kh .kh-pm li::before{position:absolute;left:0;font-weight:700}.kh .kh-pm .p::before{content:"+"}.kh .kh-pm .m::before{content:"−"}
.kh .kh-act{display:flex;flex-wrap:wrap;align-items:center;gap:8px 18px}.kh .kh-act .kh-knop{margin:0}.kh .kh-tl{font-size:14px}
.kh details.kh-meer>summary{display:inline-flex;align-items:center;min-height:44px;padding:10px 20px;border:2px solid #111113;border-radius:999px;font-size:16px;font-weight:700;cursor:pointer;list-style:none}.kh details.kh-meer>summary::-webkit-details-marker{display:none}.kh details.kh-meer[open]>summary{margin-bottom:12px}
.kh .kh-t{width:100%;border:1px solid #D7DCE8;border-collapse:separate;border-spacing:0;border-radius:16px;overflow:hidden;font-size:16px}
.kh .kh-t th,.kh .kh-t td{text-align:left;vertical-align:top;padding:14px 18px;border-bottom:1px solid #D7DCE8;color:#111113;background:#fff}
.kh .kh-t thead th{font-size:13px;font-weight:700;border-bottom:2px solid #111113}.kh .kh-t tbody tr:last-child>*{border-bottom:0}.kh .kh-t tbody th{font-weight:700}
@media(max-width:560px){.kh .kh-t,.kh .kh-t tbody,.kh .kh-t tr,.kh .kh-t td,.kh .kh-t th{display:block;width:auto}.kh .kh-t thead{display:none}.kh .kh-t tr{padding:12px 16px;border-bottom:1px solid #D7DCE8}.kh .kh-t tbody tr:last-child{border-bottom:0}.kh .kh-t td,.kh .kh-t tbody th{border:0;padding:2px 0}.kh .kh-t td[data-l]::before{content:attr(data-l);display:block;font-size:13px;font-weight:700;margin-top:6px}}
.kh .kh-ul{margin:0 0 8px;padding-left:20px;font-size:16px;line-height:1.6}.kh .kh-ul li{margin:0 0 6px}
.kh .kh-bron{font-size:13px;margin:8px 0 0}
.kh details.kh-faq{border:0;border-top:1px solid #D7DCE8;padding:14px 0;margin:0}.kh details.kh-faq:last-of-type{border-bottom:1px solid #D7DCE8}.kh details.kh-faq summary{font-size:16px;font-weight:700;cursor:pointer;color:#111113}.kh details.kh-faq p{margin:8px 0 0;font-size:16px;line-height:1.6;color:#111113}
.kh .kh-volg{list-style:none;margin:0;padding:0;border:1px solid #D7DCE8;border-radius:16px;overflow:hidden}.kh .kh-volg li{border-top:1px solid #D7DCE8}.kh .kh-volg li:first-child{border-top:0}.kh .kh-volg a{display:flex;justify-content:space-between;gap:12px;padding:14px 18px;font-size:16px;font-weight:700;text-decoration:none}
html body .kh #bz-chat.rz-ama{margin:0 0 8px}
html body .kh #bz-chat .ama{background:#fff!important;color:#111113!important;border:1px solid #D7DCE8!important;border-radius:16px!important;padding:18px!important;box-shadow:none!important}
html body .kh #bz-chat .ama .ama-n{color:#111113!important;font-size:18px!important;font-weight:700!important}
html body .kh #bz-chat .ama-vb{display:flex!important;flex-direction:column;gap:8px;margin:14px 0 0!important}
html body .kh #bz-chat .ama-vb li{border:0!important}
html body .kh #bz-chat .ama-vb a{display:inline-flex!important;justify-content:flex-start!important;padding:10px 18px!important;border:2px solid #111113!important;border-radius:999px!important;background:#fff!important;color:#111113!important;font-size:16px!important;font-weight:400!important;line-height:1.35}
html body .kh #bz-chat .ama-vb a i{display:none}
html body main.kh #bz-chat.rz-ama .ama-vb a,html body main.kh #bz-chat.rz-ama .ama-vb a *{color:#111113!important}
html body .kh #bz-chat .ama-f{border:2px solid #111113!important;border-radius:999px!important;background:#fff!important;padding:4px 4px 4px 18px!important}
html body .kh #bz-chat .ama-f button{border-radius:999px!important;background:#111113!important;color:#fff!important}
html body main.kh section.cwa{background:#fff!important;border:1px solid #D7DCE8!important;border-radius:16px!important;padding:18px!important;margin:40px 0 0!important}
html body main.kh section.cwa,html body main.kh section.cwa *{color:#111113!important}
html body main.kh .cwa button[type=submit]{background:#111113!important;color:#fff!important;border-radius:999px!important}
html body main.kh .cwa input[type=email]{border:2px solid #111113!important;border-radius:999px!important;background:#fff!important}
`;

// Per gids een korte H1 met de zoekvraag en het meervoud van wat we vergelijken (Henkjan 21 nov 2026, akkoord: "Ja zet alle keuzehulpen om").
const L5 = (nl, en, de, es, pt) => ({ nl, en, de, es, pt });
export const KH_GIDS = {
  vluchten: [L5('Vluchten naar Curaçao', 'Flights to Curaçao', 'Flüge nach Curaçao', 'Vuelos a Curazao', 'Voos para Curaçao'), L5('vluchten', 'flights', 'Flüge', 'vuelos', 'voos')],
  hotels: [L5('Beste hotels op Curaçao', 'Best hotels in Curaçao', 'Die besten Hotels auf Curaçao', 'Mejores hoteles en Curazao', 'Melhores hotéis em Curaçao'), L5('hotels en resorts', 'hotels and resorts', 'Hotels und Resorts', 'hoteles y resorts', 'hotéis e resorts')],
  allinclusive: [L5('Beste all-inclusive resort op Curaçao', 'Best all-inclusive resort in Curaçao', 'Bestes All-inclusive-Resort auf Curaçao', 'Mejor resort todo incluido en Curazao', 'Melhor resort all inclusive em Curaçao'), L5('all-inclusive resorts', 'all-inclusive resorts', 'All-inclusive-Resorts', 'resorts todo incluido', 'resorts all inclusive')],
  stranden: [L5('Mooiste stranden van Curaçao', 'Best beaches in Curaçao', 'Die schönsten Strände auf Curaçao', 'Mejores playas de Curazao', 'Melhores praias de Curaçao'), L5('stranden', 'beaches', 'Strände', 'playas', 'praias')],
  'stranden-locals': [L5('Stranden voor locals op Curaçao', 'Beaches for locals in Curaçao', 'Strände für Einheimische auf Curaçao', 'Playas para locales en Curazao', 'Praias para locais em Curaçao'), L5('stranden', 'beaches', 'Strände', 'playas', 'praias')],
  duiken: [L5('Beste duikscholen op Curaçao', 'Best dive shops in Curaçao', 'Die besten Tauchschulen auf Curaçao', 'Mejores centros de buceo en Curazao', 'Melhores escolas de mergulho em Curaçao'), L5('duikscholen', 'dive shops', 'Tauchschulen', 'centros de buceo', 'escolas de mergulho')],
  vakantiehuis: [L5('Beste vakantiehuizen op Curaçao', 'Best vacation rentals in Curaçao', 'Die besten Ferienhäuser auf Curaçao', 'Mejores casas vacacionales en Curazao', 'Melhores casas de temporada em Curaçao'), L5('vakantiehuizen', 'vacation rentals', 'Ferienhäuser', 'casas vacacionales', 'casas de temporada')],
  esim: [L5('Beste eSIM voor Curaçao', 'Best eSIM for Curaçao', 'Die beste eSIM für Curaçao', 'Mejor eSIM para Curazao', 'Melhor eSIM para Curaçao'), L5('eSIM\'s en simkaarten', 'eSIMs and SIM cards', 'eSIMs und SIM-Karten', 'eSIM y tarjetas SIM', 'eSIMs e chips')],
  restaurants: [L5('Beste restaurants op Curaçao', 'Best restaurants in Curaçao', 'Die besten Restaurants auf Curaçao', 'Mejores restaurantes en Curazao', 'Melhores restaurantes em Curaçao'), L5('restaurants', 'restaurants', 'Restaurants', 'restaurantes', 'restaurantes')],
  uitgaan: [L5('Beste bars en beachclubs op Curaçao', 'Best bars and beach clubs in Curaçao', 'Die besten Bars und Beachclubs auf Curaçao', 'Mejores bares y beach clubs en Curazao', 'Melhores bares e beach clubs em Curaçao'), L5('bars, beachclubs en clubs', 'bars, beach clubs and clubs', 'Bars, Beachclubs und Clubs', 'bares, beach clubs y discotecas', 'bares, beach clubs e baladas')],
  duikplekken: [L5('Beste duik- en snorkelplekken op Curaçao', 'Best dive and snorkel spots in Curaçao', 'Die besten Tauch- und Schnorchelplätze auf Curaçao', 'Mejores lugares de buceo y snorkel en Curazao', 'Melhores pontos de mergulho e snorkel em Curaçao'), L5('duik- en snorkelplekken', 'dive and snorkel spots', 'Tauch- und Schnorchelplätze', 'lugares de buceo y snorkel', 'pontos de mergulho e snorkel')],
  natuur: [L5('Mooiste natuur op Curaçao', 'Best nature spots in Curaçao', 'Die schönste Natur auf Curaçao', 'Mejores lugares de naturaleza en Curazao', 'Melhores lugares de natureza em Curaçao'), L5('natuurplekken', 'nature spots', 'Naturorte', 'lugares naturales', 'lugares de natureza')],
  watersport: [L5('Beste watersport op Curaçao', 'Best water sports in Curaçao', 'Die besten Wassersportanbieter auf Curaçao', 'Mejores deportes acuáticos en Curazao', 'Melhores esportes aquáticos em Curaçao'), L5('watersportaanbieders', 'water sports providers', 'Wassersportanbieter', 'proveedores de deportes acuáticos', 'empresas de esportes aquáticos')],
  kunst: [L5('Kunst op Curaçao: galeries en musea', 'Art in Curaçao: galleries and museums', 'Kunst auf Curaçao: Galerien und Museen', 'Arte en Curazao: galerías y museos', 'Arte em Curaçao: galerias e museus'), L5('galeries, musea en street art', 'galleries, museums and street art', 'Galerien, Museen und Street Art', 'galerías, museos y arte urbano', 'galerias, museus e arte de rua')],
  kleding: [L5('Kleding kopen op Curaçao', 'Clothes shopping in Curaçao', 'Kleidung kaufen auf Curaçao', 'Comprar ropa en Curazao', 'Comprar roupas em Curaçao'), L5('kledingwinkels', 'clothing stores', 'Bekleidungsgeschäfte', 'tiendas de ropa', 'lojas de roupa')],
  fastfood: [L5('Beste fast food op Curaçao', 'Best fast food in Curaçao', 'Das beste Fast Food auf Curaçao', 'Mejor comida rápida en Curazao', 'Melhor fast food em Curaçao'), L5('fastfoodzaken', 'fast food places', 'Fast-Food-Läden', 'locales de comida rápida', 'lanchonetes')],
  bouwmarkt: [L5('Bouwmarkten op Curaçao', 'Hardware stores in Curaçao', 'Baumärkte auf Curaçao', 'Ferreterías en Curazao', 'Lojas de construção em Curaçao'), L5('bouwmarkten', 'hardware stores', 'Baumärkte', 'ferreterías', 'lojas de construção')],
  pizza: [L5('Beste pizza op Curaçao', 'Best pizza in Curaçao', 'Die beste Pizza auf Curaçao', 'Mejor pizza en Curazao', 'Melhor pizza em Curaçao'), L5('pizzeria\'s', 'pizzerias', 'Pizzerien', 'pizzerías', 'pizzarias')],
  evenementen: [L5('Evenementen op Curaçao', 'Events in Curaçao', 'Events auf Curaçao', 'Eventos en Curazao', 'Eventos em Curaçao'), L5('evenementen', 'events', 'Events', 'eventos', 'eventos')],
  kinderen: [L5('Curaçao met kinderen', 'Curaçao with kids', 'Curaçao mit Kindern', 'Curazao con niños', 'Curaçao com crianças'), L5('uitjes voor kinderen', 'things to do with kids', 'Ausflüge mit Kindern', 'planes con niños', 'passeios com crianças')],
  nieuws: [L5('Nieuws op Curaçao: kranten en zenders', 'Curaçao news: papers and stations', 'Nachrichten auf Curaçao: Zeitungen und Sender', 'Noticias de Curazao: diarios y emisoras', 'Notícias de Curaçao: jornais e emissoras'), L5('kranten, sites en zenders', 'papers, sites and stations', 'Zeitungen, Seiten und Sender', 'diarios, sitios y emisoras', 'jornais, sites e emissoras')],
  trouwen: [L5('Trouwen op Curaçao', 'Getting married in Curaçao', 'Heiraten auf Curaçao', 'Casarse en Curazao', 'Casar em Curaçao'), L5('trouwlocaties en weddingplanners', 'wedding venues and planners', 'Hochzeitslocations und Planer', 'lugares y organizadores de bodas', 'locais e cerimonialistas')],
  werk: [L5('Werken op Curaçao: vacatures en bureaus', 'Jobs in Curaçao: sites and agencies', 'Arbeiten auf Curaçao: Jobs und Agenturen', 'Trabajo en Curazao: portales y agencias', 'Trabalho em Curaçao: sites e agências'), L5('vacaturesites en bureaus', 'job sites and agencies', 'Jobportale und Agenturen', 'portales de empleo y agencias', 'sites de emprego e agências')],
  zorg: [L5('Ziek of gewond op Curaçao', 'Sick or injured in Curaçao', 'Krank oder verletzt auf Curaçao', 'Enfermo o herido en Curazao', 'Doente ou ferido em Curaçao'), L5('plekken voor zorg', 'places for care', 'Anlaufstellen', 'centros de atención', 'locais de atendimento')],
  huiskopen: [L5('Beste makelaars op Curaçao', 'Best real estate agents in Curaçao', 'Die besten Makler auf Curaçao', 'Mejores inmobiliarias en Curazao', 'Melhores imobiliárias em Curaçao'), L5('makelaars', 'real estate agents', 'Makler', 'inmobiliarias', 'imobiliárias')],
  huishuren: [L5('Huis huren op Curaçao', 'Renting a house in Curaçao', 'Haus mieten auf Curaçao', 'Alquilar casa en Curazao', 'Alugar casa em Curaçao'), L5('verhuurders en makelaars', 'rental agents', 'Vermieter und Makler', 'agencias de alquiler', 'imobiliárias de aluguel')],
  emigreren: [L5('Emigreren naar Curaçao', 'Moving to Curaçao', 'Auswandern nach Curaçao', 'Mudarse a Curazao', 'Mudar para Curaçao'), L5('verzekeraars, banken en verhuizers', 'insurers, banks and movers', 'Versicherer, Banken und Umzugsfirmen', 'aseguradoras, bancos y mudanzas', 'seguradoras, bancos e mudanças')],
  internet: [L5('Beste internet op Curaçao', 'Best internet in Curaçao', 'Das beste Internet auf Curaçao', 'Mejor internet en Curazao', 'Melhor internet em Curaçao'), L5('internetaanbieders', 'internet providers', 'Internetanbieter', 'proveedores de internet', 'provedores de internet')],
  autokopen: [L5('Auto kopen op Curaçao', 'Buying a car in Curaçao', 'Auto kaufen auf Curaçao', 'Comprar auto en Curazao', 'Comprar carro em Curaçao'), L5('autodealers', 'car dealers', 'Autohändler', 'concesionarios', 'concessionárias')],
};
export const khH1 = (id, m) => { const g = KH_GIDS[id]; return g ? (g[0][m] || g[0].en) : ''; };
const groot = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// H: hulpjes uit lib/cur.js (geen kringimport)
export function renderKh(H, m, o, D, prof, opt = {}) {
  const { CUR_MARKT, T, tx, DATUM, curUrl, hubUrl, bedrijfUrl, kop, balk, talenNav, voet, meetJs, UX, actiefIn, ONDERWERPEN, siteOrg, LD_TYPE, curRang } = H;
  const M = CUR_MARKT[m], t = T[m], K = KT[m] || KT.en, items = D.items || [], n = items.length, url = curUrl(m, o), lbl = tx(o.label, m), d = DATUM(D.peildatum, m);
  const G = KH_GIDS[o.id], ding = G ? (G[1][m] || G[1].en) : lbl, naamG = groot(ding);
  const getal = (x, dd) => Number(x).toLocaleString(M.locale, { minimumFractionDigits: dd || 0, maximumFractionDigits: dd == null ? 2 : dd });
  const geld = p => (p.valuta === 'EUR' ? '€' : p.valuta === 'XCG' || p.valuta === 'ANG' ? 'XCG ' : '$') + getal(p.bedrag, p.bedrag % 1 ? 2 : 0) + (p.eenheid ? ' ' + tx(p.eenheid, m) : '');
  const S = khScores(items, prof), metS = S.filter(x => x.tot != null), GW = D.reviewGewicht == null ? 1 : D.reviewGewicht;
  // Keuzehulp-score waar reviews de maat zijn; bij gidsen waar dat niet zo is (vluchten, nieuws, zorg, evenementen, werk: reviewGewicht onder 1,
  // of minder dan de helft met reviews) de eigen volgorde van de gids (curRang op de eerste antwoorden, zoals de oude pagina), zonder punten
  const SCORE = GW >= 1 && metS.length >= Math.max(3, Math.ceil(n * 0.5));
  let rang, zonder;
  if (SCORE) { rang = metS; zonder = S.filter(x => x.tot == null); }
  else { const vr = D.vragen || [], neutraal = vr.map(() => 0), per = new Map(S.map(x => [x.v.id, x])); rang = curRang(items, vr, neutraal, GW).map(y => ({ ...per.get(y.v.id), tot: null })); zonder = []; }
  const platfAlle = new Set(items.flatMap(v => reviewsVan(v).map(x => String(x.platform || '').replace(/ Maps$/, '')))).size;
  const inl = SCORE && platfAlle >= 2 ? K.inl(n, ding, platfAlle) : K.inlE(n, ding);
  const uit = v => v.aff || v.url || v.boek || '';
  const plats = v => [...new Set(reviewsVan(v).map(x => String(x.platform || '').replace(/ Maps$/, '')))].slice(0, 3).join(', ');
  const feit = v => [tx(v.soort, m), v.plaats, v.prijs && v.prijs.bedrag > 0 ? K.vanaf + ' ' + geld(v.prijs) : ''].filter(Boolean).join(' · ');
  const lijst = v => [tx(v.voor, m) || [], tx(v.tegen, m) || []].map(a => Array.isArray(a) ? a : []);
  // situaties uit de keuzevragen van de gids: per antwoord de eerste in onze volgorde onder de zaken die erbij passen
  const rijen = [], gezien = new Set();
  (D.vragen || []).forEach(q => (q.opties || []).forEach(op => {
    const plus = op.plus || [], min = op.min || []; if (!plus.length && !op.vereist) return; const lab = tx(op.label, m); if (!lab || gezien.has(lab)) return;
    const k = rang.filter(x => { const tg = x.v.tags || []; return (!op.vereist || tg.includes(op.vereist)) && plus.some(p => tg.includes(p)) && !min.some(p => tg.includes(p)); });
    const b = plus.includes('budget') ? k.filter(x => x.v.prijs && x.v.prijs.bedrag > 0).sort((p, q2) => p.v.prijs.bedrag - q2.v.prijs.bedrag)[0] || k[0] : k[0];
    if (b) { gezien.add(lab); rijen.push({ lab, x: b, budget: plus.includes('budget') }); }
  }));
  const metPrijs = rang.filter(x => x.v.prijs && x.v.prijs.bedrag > 0), munt = metPrijs.length ? metPrijs[0].v.prijs.valuta : '';
  const goedkoop = metPrijs.filter(x => x.v.prijs.valuta === munt && JSON.stringify(x.v.prijs.eenheid || '') === JSON.stringify(metPrijs[0].v.prijs.eenheid || '')).sort((p, q2) => p.v.prijs.bedrag - q2.v.prijs.bedrag);
  if (!rijen.some(r => r.budget) && goedkoop.length >= 2) rijen.push({ lab: K.voordeligst, x: goedkoop[0], budget: true });
  const uniek = new Set(), voorop = rijen.filter(r => !uniek.has(r.x.v.id) && uniek.add(r.x.v.id)), sitRijen = [...voorop, ...rijen.filter(r => !voorop.includes(r))].slice(0, Math.max(4, Math.min(6, voorop.length + 1))).sort((p, q2) => rijen.indexOf(p) - rijen.indexOf(q2)), eenAntwoord = new Set(sitRijen.map(r => r.x.v.id)).size < 2; // een tabel waarin elke rij hetzelfde antwoord geeft gaat eruit
  const top = rang[0];
  const sterren = x => x.q ? getal(x.q.gem, 1) + ' ★' : '';
  const waaromCel = r => r.budget && r.x.v.prijs ? K.vanaf + ' ' + geld(r.x.v.prijs) : r.x.tot != null ? K.pt(r.x.tot) + (r.x.q ? ', ' + sterren(r.x) : '') : (sterren(r.x) || (lijst(r.x.v)[0][0] || '').slice(0, 120) || feit(r.x.v));
  // het antwoord: één vette eerste keus, één zin met de score, één zin met twee situaties die een ander antwoord geven
  const anders = sitRijen.filter(r => top && r.x.v.id !== top.v.id).slice(0, 2);
  const zin2 = !top ? '' : top.tot != null ? K.score(top.tot, getal(top.q.gem, 1), getal(top.q.n, 0)) : top.q ? groot(K.rev(getal(top.q.gem, 1), getal(top.q.n, 0))) + '.' : (lijst(top.v)[0][0] ? lijst(top.v)[0][0].replace(/[.!]?$/, '.') : '');
  const antwoord = top ? '<div class="kh-ant"><p><b>' + esc((SCORE ? K.eerste : K.eersteE)(kortNaam(top.v))) + '</b> ' + esc(zin2) + '</p>' + (anders.length === 2 ? '<p>' + esc(K.sit(anders[0].lab + ': ' + kortNaam(anders[0].x.v), anders[1].lab.charAt(0).toLowerCase() + anders[1].lab.slice(1) + ': ' + kortNaam(anders[1].x.v))) + '</p>' : anders.length === 1 ? '<p>' + esc(anders[0].lab + ': ' + kortNaam(anders[0].x.v) + '.') + '</p>' : '')
    + (uit(top.v) ? '<a class="kh-knop cta" href="' + esc(uit(top.v)) + '" target="_blank" rel="' + (top.v.aff ? 'sponsored noopener' : 'noopener nofollow') + '" data-out="' + esc(top.v.id) + '">' + esc(t.bekijk) + ' →</a>' : '<a class="kh-knop cta" href="' + bedrijfUrl(m, o, top.v) + '">' + esc(K.meerOver(kortNaam(top.v))) + ' →</a>') + '</div>' : '';
  // de chat van de site (curacao.day), met hoogstens 4 vragen die een antwoord uit de gegevens hebben
  const U = UX.UXT[m] || UX.UXT.en, faq = (D.faq || []).map((f, i) => [tx(f.q, m), tx((D.khFaq || {})[i] || f.a, m)]).filter(f => f[0] && f[1]); // khFaq: antwoorden die bij de Keuzehulp-score passen
  const vb = [SCORE && rang.length >= 3 ? { q: 1, v: U.qBeste, a: rang.slice(0, 3).map(x => x.v.naam + ' (' + K.pt(x.tot) + ', ' + sterren(x) + ')').join(', ') + '.' } : null,
    goedkoop.length >= 2 ? { q: 1, v: U.qGoedkoop, a: goedkoop.slice(0, 3).map(x => x.v.naam + ' (' + geld(x.v.prijs) + ')').join(', ') + '.' } : null,
    ...faq.filter(([q]) => !(SCORE && /best|beste|mejor|melhor/i.test(q)) && !(goedkoop.length >= 2 && /goedkoopst|cheapest|günstig|barat|económic/i.test(q))).filter(([, a]) => !UX.geenAntw(a)).slice(0, 3).map(([q, a]) => ({ q: 1, v: q, a: UX.kortAntw(a, 320) }))].filter(Boolean).slice(0, 4);
  const ctx = [naamG + ' (' + n + ')', rang.slice(0, 8).map(x => x.v.naam + (x.tot != null ? ' ' + K.pt(x.tot) : x.q ? ' ' + sterren(x) : '') + (x.v.prijs && x.v.prijs.bedrag > 0 ? ' ' + geld(x.v.prijs) : '')).join(', ')].join('. ');
  const chat = UX.chatBlok({ ond: 'gids.g' + o.id, ondk: lbl, kop: U.gKop(ding), ph: U.chatPh, ctx, vb });
  const kaart = (x, i, nr) => { const v = x.v, [vo, te] = lijst(v), u = uit(v), det = bedrijfUrl(m, o, v), wl = nr ? K.waarom(i + 1) : K.meerOver(kortNaam(v));
    return '<article class="kh-k" data-id="' + esc(v.id) + '"><h3>' + (nr ? '<span class="kh-nr">' + (i + 1) + '</span>' : '') + '<a href="' + det + '">' + esc(v.naam) + '</a></h3>'
      + (x.tot != null ? '<p class="kh-sc"><b>' + esc(K.pt(x.tot)) + '</b> · ' + esc(K.rev(getal(x.q.gem, 1), getal(x.q.n, 0))) + (plats(v) ? ' ' + esc(K.op) + ' ' + esc(plats(v)) : '') + '</p>' : x.q ? '<p class="kh-sc">' + esc(groot(K.rev(getal(x.q.gem, 1), getal(x.q.n, 0)))) + (plats(v) ? ' ' + esc(K.op) + ' ' + esc(plats(v)) : '') + '</p>' : '')
      + nieuwsHtml(v.id, m, !!D.toonNieuws)
      + (feit(v) ? '<p class="kh-f">' + esc(feit(v)) + '</p>' : '')
      + (vo.length || te.length ? '<ul class="kh-pm">' + vo.slice(0, 2).map(a => '<li class="p">' + esc(a) + '</li>').join('') + te.slice(0, 1).map(a => '<li class="m">' + esc(a) + '</li>').join('') + '</ul>' : '')
      + '<div class="kh-act">' + (u ? '<a class="kh-knop cta" href="' + esc(u) + '" target="_blank" rel="' + (v.aff ? 'sponsored noopener' : 'noopener nofollow') + '" data-out="' + esc(v.id) + '">' + esc(t.bekijk) + ' →</a><a class="kh-tl" href="' + det + '">' + esc(wl) + '</a>' : '<a class="kh-knop cta" href="' + det + '">' + esc(wl) + ' →</a>') + '</div></article>'; };
  const alle = rang.map((x, i) => kaart(x, i, true)), eerst = alle.slice(0, 20).join(''), rest = alle.slice(20).join('');
  const zaken = '<section><h2 class="kh-h2">' + esc(K.alle(n, ding)) + '</h2>' + eerst + (rest ? '<details class="kh-meer"><summary>' + esc(K.toon(rang.length)) + '</summary>' + rest + '</details>' : '')
    + (zonder.length ? '<h2 class="kh-h2">' + esc(t.zonderRev) + '</h2>' + zonder.map((x, i) => kaart(x, i, false)).join('') : '') + '</section>';
  const tabel = sitRijen.length >= 2 && !eenAntwoord ? '<section><h2 class="kh-h2">' + esc(K.sitKop) + '</h2><table class="kh-t"><thead><tr>' + K.kol.map(k => '<th scope="col">' + esc(k) + '</th>').join('') + '</tr></thead><tbody>'
    + sitRijen.map(r => '<tr><th scope="row">' + esc(r.lab) + '</th><td data-l="' + esc(K.kol[1]) + '"><a href="' + bedrijfUrl(m, o, r.x.v) + '">' + esc(kortNaam(r.x.v)) + '</a></td><td data-l="' + esc(K.kol[2]) + '">' + esc(waaromCel(r)) + '</td></tr>').join('') + '</tbody></table></section>' : '';
  const tp = (D.tussenpartijen || []).filter(b => b && b.naam), tussen = tp.length ? '<section><h2 class="kh-h2">' + esc(t.tussen) + '</h2><ul class="kh-ul">' + tp.map(b => { const u2 = tx(b.uitleg, m), z = Array.isArray(u2) ? u2.slice(0, 2).join(' ') : u2; return '<li>' + (b.url ? '<a href="' + esc(b.url) + '" target="_blank" rel="noopener nofollow" data-out="tp-' + esc(String(b.naam).toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '"><b>' + esc(b.naam) + '</b></a>' : '<b>' + esc(b.naam) + '</b>') + (z ? ': ' + esc(z) : '') + '</li>'; }).join('') + '</ul></section>' : '';
  const tips = (D.tips || []).map(x => tx(x, m)).filter(Boolean), bronL = [...new Set(items.flatMap(v => [...(v.bronnen || []), ...reviewsVan(v).map(x => x.bron).filter(Boolean)]))].filter(b => /^https?:\/\//.test(b));
  const uitleg = '<section><h2 class="kh-h2">' + esc(K.uitKop) + '</h2><ul class="kh-ul">' + (SCORE ? K.uit : [t.methodeTekst]).map(z => '<li>' + esc(z) + '</li>').join('') + '</ul>' + (tips.length ? '<h2 class="kh-h2">' + esc(K.weten) + '</h2><ul class="kh-ul">' + tips.map(z => '<li>' + esc(z) + '</li>').join('') + '</ul>' : '')
    + (bronL.length ? '<details class="kh-faq"><summary>' + esc(K.bronnen(bronL.length)) + '</summary><ul class="kh-ul kh-br">' + bronL.slice(0, 120).map(b => '<li><a href="' + esc(b) + '" rel="nofollow noopener" target="_blank">' + esc(String(b).replace(/^https?:\/\/(www\.)?/, '').slice(0, 80)) + '</a></li>').join('') + '</ul></details>' : '') + '</section>';
  const faqH = faq.length ? '<section><h2 class="kh-h2">' + esc(t.faq) + '</h2>' + faq.map(([q, a]) => '<details class="kh-faq"><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</section>' : '';
  const zelf = ONDERWERPEN.find(x => x.id === o.id), kand = ONDERWERPEN.filter(x => x.id !== o.id && actiefIn(x, m)), volg = [...kand.filter(x => zelf && x.groep === zelf.groep), ...kand.filter(x => !zelf || x.groep !== zelf.groep)].slice(0, 6);
  const meer = volg.length ? '<section><h2 class="kh-h2">' + esc(K.meer) + '</h2><ul class="kh-volg">' + volg.map(x => '<li><a href="' + curUrl(m, x) + '">' + esc(khH1(x.id, m) || tx(x.label, m)) + '<span aria-hidden="true">→</span></a></li>').join('') + '<li><a href="' + hubUrl(m) + '">' + esc(K.alleK) + '<span aria-hidden="true">→</span></a></li></ul></section>' : '';
  let boven = K.boven(ding); if (boven.length > 40) boven = K.boven(ding.split(/,| and | en | und | y | e | of | or | oder | o | ou /)[0]); if (boven.length > 40) boven = boven.slice(0, 40).replace(/\s+\S*$/, ''); // bovenregel hoogstens 40 tekens, nooit midden in een woord
  const h1 = tx(D.khH1, m) || khH1(o.id, m) || tx(D.h1, m) || lbl, titel = String(tx(D.titel, m) || lbl).replace(/\{n\}/g, n), desc = top ? (SCORE ? K.eerste : K.eersteE)(kortNaam(top.v)) + ' ' + zin2 + ' ' + inl : String(tx(D.metaDesc, m) || '').replace(/\{n\}/g, n);
  const alts = Object.keys(CUR_MARKT).filter(k => actiefIn(o, k)).map(k => [k, curUrl(k, o)]);
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', headline: h1, description: desc, inLanguage: M.lang, datePublished: D.gepubliceerd || '2026-10-20', dateModified: D.peildatum, mainEntityOfPage: url, author: siteOrg(M), publisher: siteOrg(M), about: { '@type': 'Place', name: 'Curaçao' } },
    { '@type': 'ItemList', name: K.alle(n, ding), numberOfItems: rang.length, itemListOrder: 'https://schema.org/ItemListOrderDescending', itemListElement: rang.map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': LD_TYPE[o.id] || 'LocalBusiness', name: x.v.naam, url: bedrijfUrl(m, o, x.v), address: { '@type': 'PostalAddress', addressCountry: 'CW', ...(x.v.plaats ? { addressLocality: String(x.v.plaats).split(/[,(]/)[0].trim() } : {}) } } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: M.naam, item: 'https://' + M.host + '/' }, { '@type': 'ListItem', position: 2, name: K.kruim, item: hubUrl(m) }, { '@type': 'ListItem', position: 3, name: naamG, item: url }] },
    ...(faq.length ? [{ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [])] };
  let html = kop(m, M, titel, desc, url, alts, schema) + balk(m, [[hubUrl(m), t.home], ['', naamG]], talenNav(m, k => actiefIn(o, k) ? curUrl(k, o) : hubUrl(k)))
    + '<style>' + CSS + UX.UX_CSS + NIEUWS_CSS + '</style><main class="kh">'
    + '<nav class="kh-pad" aria-label="Breadcrumb"><a href="' + hubUrl(m) + '">' + esc(K.kruim) + '</a><span aria-hidden="true">›</span><span aria-current="page">' + esc(naamG) + '</span></nav>'
    + '<p class="kh-bov">' + esc(boven) + '</p><h1>' + esc(h1) + '</h1><p class="kh-bij">' + esc(K.bij) + ' <time datetime="' + esc(D.peildatum || '') + '">' + esc(d) + '</time></p>'
    + '<p class="kh-inl">' + esc(inl) + '</p>' + antwoord + chat + '<!--khfoto-->' + zaken + tabel + tussen + uitleg + faqH + meer + '<!--cwa-->'
    + voet(m, '') + '<script>' + meetJs(m, o.id) + '</script></body></html>';
  if (opt.proef) html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex,follow">').replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, '');
  return html;
}
