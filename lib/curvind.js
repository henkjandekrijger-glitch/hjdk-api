// Vindbaarheid van de bedrijfspagina's en keuzehulpen op curacao.day, elke nacht beter (Henkjan 14 nov 2026: "En zorg dat ze iedere dag beter
// gevonden worden met de nacht lus voor bedrijfs keuzehulpen ."). Twee delen:
// 1. Titelproef op de 11.900 bedrijfspagina's: de helft (vaste helft per zaak, uit de slug) krijgt titel b, de andere helft blijft a (controle).
//    Search Console telt vertoningen en kliks per helft sinds de start; wint b met 95% zekerheid (vanaf 1.500 vertoningen per helft), dan
//    maakt de nachtronde b de standaard en zet de volgende titel uit data/cur/ux-uitdagers.json (titels) erbij.
// 2. Meting en kansen (GET /api/gsc?op=curvind, beschermde host): per soort pagina vertoningen en kliks deze 7 dagen tegen de 7 daarvoor,
//    hoeveel pagina's Google vertoont, zoekvragen op plek 4 tot 15 en pagina's met veel vertoningen en weinig kliks. De nachtronde werkt elke
//    nacht de bovenste kansen af (CLAUDE.md, sectie Vindbaarheid).

export const TITEL_PROEF = {
  sinds: '2026-11-15', // eerste volle dag met de twee titels
  a: 'Naam Curaçao: openingstijden, telefoon en reviews (zoals het was)',
  b: 'Naam (straat) Curaçao: openingstijden en telefoon; de straat onderscheidt filialen en sluit aan op zoeken met plaats',
};
const TA = { nl: n => n + ': openingstijden, telefoon en reviews', en: n => n + ': hours, phone and reviews', de: n => n + ': Öffnungszeiten, Telefon und Bewertungen', es: n => n + ': horario, teléfono y opiniones', pt: n => n + ': horário, telefone e avaliações' };
const TB = { nl: 'openingstijden en telefoon', en: 'hours and phone', de: 'Öffnungszeiten und Telefon', es: 'horario y teléfono', pt: 'horário e telefone' };
const PLEK = { nl: 'Curaçao', en: 'Curaçao', de: 'Curaçao', es: 'Curazao', pt: 'Curaçao' };

// Soortproef (15 nov 2026, Henkjan: "Voer alles uit", analyse punt B): de soortpagina's van de bedrijvengids (/<taal>/businesses/<soort>) kregen
// 2.510 vertoningen in 7 dagen en noemden zichzelf "alle n op een rij", terwijl mensen "beste restaurants curacao" zoeken (Demand Radar, CA 720,
// best restaurants 390). Vaste helft per soort (andere hash dan de zaken): b krijgt titel en h1 op "beste ... op Curaçao" met maand en jaar en
// een lead die met het antwoord begint (de 3 best beoordeelde); a blijft zoals het was. Alleen als er 3 zaken met een score zijn, anders a.
export const SOORT_PROEF = {
  sinds: '2026-11-16',
  a: 'Soort op Curaçao: alle n op een rij; lead begint met alle n, best beoordeeld achteraan (zoals het was)',
  b: 'Beste soort op Curaçao (maand jaar): top 3 van n; lead begint met de 3 best beoordeelde (antwoord eerst)',
};
const SB = {
  nl: { t: (c, n, mj) => 'Beste ' + c.toLowerCase() + ' op Curaçao (' + mj + '): top 3 van ' + n, h: c => 'De beste ' + c.toLowerCase() + ' op Curaçao', l: (c, n, top) => 'Best beoordeeld: ' + top + '. Daaronder alle ' + n + ' ' + c.toLowerCase() + ' op Curaçao op volgorde van beoordeling, met telefoon, adres en Google-score.' },
  en: { t: (c, n, mj) => 'Best ' + c.toLowerCase() + ' in Curaçao (' + mj + '): top 3 of ' + n, h: c => 'The best ' + c.toLowerCase() + ' in Curaçao', l: (c, n, top) => 'Top rated: ' + top + '. Below, all ' + n + ' ' + c.toLowerCase() + ' in Curaçao ranked by rating, with phone, address and Google rating.' },
  de: { t: (c, n, mj) => 'Beste ' + c + ' auf Curaçao (' + mj + '): Top 3 von ' + n, h: c => 'Die besten ' + c + ' auf Curaçao', l: (c, n, top) => 'Am besten bewertet: ' + top + '. Darunter alle ' + n + ' ' + c + ' auf Curaçao nach Bewertung sortiert, mit Telefon, Adresse und Google-Bewertung.' },
  es: { t: (c, n, mj) => c + ' en Curazao: top 3 de ' + n + ' (' + mj + ')', h: c => c + ' en Curazao: el top 3', l: (c, n, top) => 'Con mejor puntuación: ' + top + '. Debajo, los ' + n + ' ' + c.toLowerCase() + ' de Curazao por puntuación, con teléfono, dirección y puntuación de Google.' },
  pt: { t: (c, n, mj) => c + ' em Curaçao: top 3 de ' + n + ' (' + mj + ')', h: c => c + ' em Curaçao: o top 3', l: (c, n, top) => 'Com melhor nota: ' + top + '. Abaixo, todos os ' + n + ' ' + c.toLowerCase() + ' de Curaçao por nota, com telefone, endereço e nota do Google.' },
};
export const soortArm = cs => arm('soort:' + cs);
// tekst voor versie b, of null (versie a, of te weinig zaken met een score); top = de 3 best beoordeelde als tekst, locale voor maand en jaar
export function soortTekst(m, cs, naam, n, top, at, locale) {
  if (soortArm(cs) !== 'b' || !top || (top.match(/★/g) || []).length < 3) return null;
  const X = SB[m] || SB.en, mj = new Date(String(at || '').slice(0, 10) + 'T12:00:00Z').toLocaleDateString(locale || 'en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { titel: X.t(naam, n, mj), h1: X.h(naam), lead: X.l(naam, n, top) };
}

// vaste helft per zaak (FNV-1a over de slug): 'b' of 'a'
export function arm(slug) { let h = 2166136261; for (const c of String(slug || '')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h % 2 ? 'b' : 'a'; }
function straat(x, adresKort) {
  const s = String(adresKort(x) || '').split(',')[0].trim();
  if (!s || s.length > 28 || /^willemstad$/i.test(s) || String(x.naam || '').toLowerCase().includes(s.toLowerCase())) return '';
  return s;
}
export function titel(m, x, adresKort) {
  const naam = String(x.naam || ''), plek = PLEK[m] || 'Curaçao', n = /cura[cç]ao|curazao|willemstad/i.test(naam) ? naam : naam + ' ' + plek;
  if (arm(x.slug) === 'b') { const st = straat(x, adresKort); if (st) return naam + ' (' + st + ') ' + plek + ': ' + (TB[m] || TB.en); }
  return (TA[m] || TA.en)(n);
}

// soort pagina uit het adres
export function soort(u, padG, slugO) {
  let s; try { s = new URL(u).pathname.split('/').filter(Boolean); } catch (e) { return null; }
  if (s.length >= 4 && padG.has(s[s.length - 3])) return { t: 'zaak', slug: s[s.length - 1] };
  if (s.length >= 3 && padG.has(s[s.length - 2])) return { t: 'soort', slug: s[s.length - 1] };
  if (s.length >= 3 && slugO[s[s.length - 2]]) return { t: 'kzaak' };
  if (s.length >= 2 && slugO[s[s.length - 1]]) return { t: 'keuzehulp' };
  return null;
}
const z2 = (k1, n1, k2, n2) => { if (!n1 || !n2) return 0; const p = (k1 + k2) / (n1 + n2), se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2)); return se ? ((k2 / n2) - (k1 / n1)) / se : 0; };

export async function curVind({ pageRows, rows, prop, oidc, GIDS_PAD, ONDERWERPEN }) {
  const padG = new Set(Object.values(GIDS_PAD)), slugO = {}; for (const o of ONDERWERPEN) for (const s of Object.values(o.slug || {})) slugO[s] = o.id;
  const dSinds = Math.max(0, Math.floor((Date.now() - Date.parse(TITEL_PROEF.sinds + 'T00:00:00Z')) / 864e5));
  const dSoort = Math.max(0, Math.floor((Date.now() - Date.parse(SOORT_PROEF.sinds + 'T00:00:00Z')) / 864e5));
  const [p7, p14, q28, pT, pS] = await Promise.all([pageRows(prop, 7, oidc), pageRows(prop, 14, oidc), rows(prop, 28, oidc).catch(() => []), dSinds >= 3 ? pageRows(prop, Math.min(90, dSinds), oidc).catch(() => []) : Promise.resolve([]), dSoort >= 3 ? pageRows(prop, Math.min(90, dSoort), oidc).catch(() => []) : Promise.resolve([])]);
  const som = rs => { const o = {}; for (const r of rs) { const k = soort(r.page, padG, slugO); if (!k) continue; const x = o[k.t] = o[k.t] || { imp: 0, kl: 0, paginas: 0 }; x.imp += r.imp || 0; x.kl += r.clicks || 0; if (r.imp) x.paginas++; } return o; };
  const a7 = som(p7), a14 = som(p14), perSoort = {};
  for (const t of ['zaak', 'kzaak', 'keuzehulp', 'soort']) { const n = a7[t] || { imp: 0, kl: 0, paginas: 0 }, v = a14[t] || { imp: 0, kl: 0 }; perSoort[t] = { vertoningen_7d: n.imp, vorige_7d: Math.max(0, v.imp - n.imp), kliks_7d: n.kl, kliks_vorige_7d: Math.max(0, v.kl - n.kl), paginas_in_google_7d: n.paginas }; }
  // titelproef
  const arms = { a: { imp: 0, kl: 0, pw: 0, paginas: 0 }, b: { imp: 0, kl: 0, pw: 0, paginas: 0 } };
  for (const r of pT) { const k = soort(r.page, padG, slugO); if (!k || k.t !== 'zaak') continue; const x = arms[arm(k.slug)]; x.imp += r.imp || 0; x.kl += r.clicks || 0; x.pw += (r.pos || 0) * (r.imp || 0); if (r.imp) x.paginas++; }
  const z = z2(arms.a.kl, arms.a.imp, arms.b.kl, arms.b.imp), genoeg = arms.a.imp >= 1500 && arms.b.imp >= 1500;
  const titelproef = { sinds: TITEL_PROEF.sinds, dagen: dSinds, a: TITEL_PROEF.a, b: TITEL_PROEF.b,
    per_versie: Object.fromEntries(Object.entries(arms).map(([k, x]) => [k, { vertoningen: x.imp, kliks: x.kl, ctr_pct: x.imp ? Math.round(1000 * x.kl / x.imp) / 10 : null, positie: x.imp ? Math.round(10 * x.pw / x.imp) / 10 : null, paginas: x.paginas }])),
    z: Math.round(z * 100) / 100, oordeel: !genoeg ? 'nog te weinig (elke helft 1.500 vertoningen)' : z >= 1.96 ? 'winnaar: b' : z <= -1.96 ? 'winnaar: a' : 'nog geen verschil' };
  // soortproef: zelfde rekensom op de soortpagina's
  const sArms = { a: { imp: 0, kl: 0, pw: 0, paginas: 0 }, b: { imp: 0, kl: 0, pw: 0, paginas: 0 } };
  for (const r of pS) { const k = soort(r.page, padG, slugO); if (!k || k.t !== 'soort' || !k.slug) continue; const x = sArms[soortArm(k.slug)]; x.imp += r.imp || 0; x.kl += r.clicks || 0; x.pw += (r.pos || 0) * (r.imp || 0); if (r.imp) x.paginas++; }
  const zS = z2(sArms.a.kl, sArms.a.imp, sArms.b.kl, sArms.b.imp), genoegS = sArms.a.imp >= 1500 && sArms.b.imp >= 1500;
  const soortproef = { sinds: SOORT_PROEF.sinds, dagen: dSoort, a: SOORT_PROEF.a, b: SOORT_PROEF.b,
    per_versie: Object.fromEntries(Object.entries(sArms).map(([k, x]) => [k, { vertoningen: x.imp, kliks: x.kl, ctr_pct: x.imp ? Math.round(1000 * x.kl / x.imp) / 10 : null, positie: x.imp ? Math.round(10 * x.pw / x.imp) / 10 : null, paginas: x.paginas }])),
    z: Math.round(zS * 100) / 100, oordeel: !genoegS ? 'nog te weinig (elke helft 1.500 vertoningen)' : zS >= 1.96 ? 'winnaar: b' : zS <= -1.96 ? 'winnaar: a' : 'nog geen verschil',
    let_op: 'Soorten met minder dan 3 beoordeelde zaken tonen ook in helft b de oude tekst; kijk naast CTR ook naar positie (b mikt op de zoekvraag beste ...).' };
  // kansen
  const vragen = q28.filter(x => soort(x.page, padG, slugO));
  const plek415 = vragen.filter(x => x.imp >= 3 && x.pos >= 4 && x.pos <= 15).sort((a, b) => b.imp - a.imp).slice(0, 25).map(x => ({ q: x.q, page: x.page, soort: soort(x.page, padG, slugO).t, imp: x.imp, pos: Math.round(x.pos * 10) / 10, kliks: x.clicks }));
  const pag28 = {}; for (const x of vragen) { const o = pag28[x.page] = pag28[x.page] || { imp: 0, kl: 0 }; o.imp += x.imp; o.kl += x.clicks; }
  const weinigKliks = Object.entries(pag28).filter(([, o]) => o.imp >= 20 && o.kl / o.imp < 0.02).sort((a, b) => b[1].imp - a[1].imp).slice(0, 20).map(([page, o]) => ({ page, soort: soort(page, padG, slugO).t, imp: o.imp, kliks: o.kl }));
  return { uitleg: 'Vindbaarheid van bedrijfspagina\'s (zaak), keuzehulp-bedrijven (kzaak), keuzehulpen en soorten in Google. Vergelijk deze 7 dagen met de 7 daarvoor; de titelproef loopt op de bedrijfspagina\'s.', per_soort: perSoort, titelproef, soortproef, kansen: { plek_4_tot_15: plek415, veel_vertoningen_weinig_kliks: weinigKliks } };
}
