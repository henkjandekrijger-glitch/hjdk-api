// Verkoopteksten voor de shopadvertenties (Henkjan 29 okt 2026: "Dit zijn toch geen teksten ??? Dan wil niemand het kopen ... Maak
// regels voor je zelf voor de campagnes . En zet in campagne skill het moeten wel gezonde CTA s zijn natuurlijk dit is dodelijk .").
// Aanleiding: advertenties als "Tegeltje dikke knuffel 10x10" / "Levertijd 7 dagen · €19,44" met knop "Bekijk": een productnaam met
// maten, een nadeel (lange levertijd) en een slappe knop. Dat verkoopt niet.
// Nu: per product 10 advertenties geschreven door Claude volgens TEKSTREGELS, elk met een invalshoek (hoek) en een sterke knop (cta);
// elke advertentie gaat door de keuring tekstOk; per product 3 dagen bewaard. Mislukt het, dan de sjablonen uit lib/shopkies.js,
// die dezelfde keuring doorstaan. Dezelfde regels staan in de campagneskill (propellerads-mcp docs/campagne-skill.md).
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
export const HOEKEN = ['voordeel', 'gevoel', 'cadeau', 'moment', 'probleem', 'nieuwsgierig', 'kwaliteit', 'zekerheid', 'vraag', 'zoekterm']; // 29 okt: prijs eruit (Henkjan: "Ik denk ook geen prijzen")
export const KNOPPEN = ['Bestel nu', 'Shop nu', 'Ontdek het', 'Bekijk cadeau', 'Geef dit cadeau', 'Haal in huis', 'Ja, laat zien', 'Ontdek meer', 'Bestellen', 'Maak het knus'];
export const TEKSTREGELS = [
  'Elke advertentie verkoopt een gevoel of voordeel: wat heb je eraan, voor wie is het, wanneer geniet je ervan. Nooit alleen de productnaam.',
  'Titel hooguit 30 tekens: een haak (voordeel, emotie, moment, cadeau, nieuwsgierigheid). Tekst hooguit 40 tekens: maak het concreet.',
  'Nooit een nadeel noemen: een levertijd van 3 dagen of meer nooit (alleen een korte levertijd als voordeel, "snel in huis"), geen verzendkosten, geen maten, codes of afmetingen (zoals 10x10, 9cm, 4-Pack), geen onbekende merknaam als haak.',
  'Nooit een prijs of bedrag en geen cijfers (Henkjan 29 okt: "Ik denk ook geen prijzen"): de advertentie verkoopt het gevoel, de prijs ziet de bezoeker op de productpagina.',
  'Eerlijk: niets verzinnen dat niet in de productnaam staat, geen nep-urgentie of schaarste, geen gratis, geen korting, geen uitroeptekens, geen hoofdletterwoorden.',
  'Alleen een moment dat nu echt speelt: in oktober geen Moederdag, Valentijn of zomer. Gebruik het seizoen van vandaag (herfst, Halloween, Sinterklaas, de feestdagen).',
  'Message match: wat de advertentie belooft, ziet de bezoeker meteen op de productpagina.',
  'Elke titel en tekst is een afgeronde zin of zinsdeel, nooit halverwege afgekapt.',
  'Gewone spreektaal, warm en concreet, zoals een vriendin het zou aanraden. Lees elke tekst als klant: zou ik klikken en dit kopen? Zo niet, herschrijven.',
  'Knop (CTA): altijd ingevuld, een werkwoord dat uitnodigt tot actie en past bij de belofte (Bestel nu, Shop nu, Ontdek het, Bekijk cadeau, Geef dit cadeau, Haal in huis, Ja, laat zien). Nooit slap: niet alleen "Bekijk", "Bekijken", "Meer info" of "Klik hier".',
  'Acht advertenties per campagne, elk een andere invalshoek. De lus leert per hoek, knop en tekst op de hele keten: CTR, echte mensen, lang blijven, terugkomen, bewaren of delen, aanmelden, mandje en vooral kopen.',
];
// Momenten met hun maanden (30 okt 2026: Claude schreef in oktober "Moederdag komt eraan"); daarbuiten afgekeurd. Zelfde lijst als propellerads-mcp lib/shop.ts.
const SEIZOEN_WOORDEN = [[/moederdag/i, [4, 5]], [/vaderdag/i, [5, 6]], [/valentijn/i, [1, 2]], [/\bpasen\b|paas/i, [3, 4]], [/halloween/i, [9, 10]], [/sinterklaas|pakjesavond/i, [10, 11, 12]], [/kerst/i, [10, 11, 12]], [/zomer|strand/i, [4, 5, 6, 7, 8]]];
const seizoenFout = x => { const m = new Date().getUTCMonth() + 1; const w = SEIZOEN_WOORDEN.find(([re, mnd]) => re.test(x) && !mnd.includes(m)); return w ? 'moment speelt nu niet: ' + x : null; };
const SLAP = /^(bekijk|bekijken|bekijk het|bekijk het hier|bekijk hier|meer info|info|klik hier|klik|lees meer|kijk|kijk hier)$/i;
const VERBODEN = /levertijd|verzend|\bdagen\b|gratis|korting|aanbieding|op=op|laatste kans|nu of nooit|beperkt|uitverkocht|%|!|\b(cm|mm|ml|kg|gram|stuks|pack)\b/i;
// keuring per advertentie; geeft null (goed) of de reden terug
export function tekstFout(a, prijs) {
  const t = String(a && a.title || '').trim(), d = String(a && a.description || '').trim(), c = String(a && a.cta || '').trim();
  if (Array.from(t).length < 4 || Array.from(t).length > 30) return 'titel te kort of te lang';
  if (Array.from(d).length < 4 || Array.from(d).length > 40) return 'tekst te kort of te lang';
  if (Array.from(c).length < 3 || Array.from(c).length > 15) return 'knop ontbreekt of te lang (PropellerAds: hooguit 15 tekens)';
  if (SLAP.test(c)) return 'slappe knop';
  for (const x of [t, d, c]) { const sz = seizoenFout(x); if (sz) return sz; if (VERBODEN.test(x)) return 'verboden woord of nadeel: ' + x; if (/€|\beuro\b/i.test(x)) return 'prijs: ' + x; if (/\d/.test(x)) return 'cijfer of maat: ' + x; if (/\b[A-Z]{4,}\b/.test(x)) return 'hoofdletterwoord: ' + x; }
  if (/\d+\s?[x×]\s?\d+/.test(t + ' ' + d)) return 'afmeting';
  return null;
}
export const tekstOk = (a, prijs) => !tekstFout(a, prijs);

const SEIZOEN = { halloween: 'Halloween', herfst: 'de herfst', sint: 'Sinterklaas', kerst: 'de feestdagen', cadeau: 'een cadeau', tuin: 'de tuin', planten: 'groen in huis', hobby: 'zelf maken' };
function prompt(p, lessen) {
  const lt = N(p.levertijd);
  const L = lessen && (lessen.best || []).length ? '\nWat bij echte kopers en lezers het best werkte (leer van de toon en de invalshoek, kopieer niet): ' + lessen.best.filter(x => tekstOk(x)).slice(0, 8).map(x => '"' + x.title + ' / ' + x.description + ' / ' + x.cta + '" (' + x.hoek + ')').join('; ') + (lessen.slecht && lessen.slecht.length ? '. Wat slecht werkte: ' + lessen.slecht.slice(0, 5).map(x => '"' + x.title + ' / ' + x.description + '"').join('; ') : '') + '.' : '';
  return 'Je bent een ervaren Nederlandse copywriter voor push-advertenties (In-Page Push op de mobiel) van Kadoly, een webshop met cadeaus en woonspullen (verzonden vanuit Europa, 14 dagen retour).\n' +
    'Product: "' + p.titel + '"' + (p.merk ? ' van ' + p.merk : '') + (p.categorie ? ', categorie ' + p.categorie : '') + '.' +
    (p.thema ? ' Moment of seizoen: ' + (SEIZOEN[p.thema] || p.thema) + '.' : '') + (p.vraag && p.vraag.term ? ' Mensen zoeken nu op: "' + p.vraag.term + '".' : '') +
    (lt && lt <= 2 ? ' Het wordt snel geleverd: "snel in huis" mag je als voordeel gebruiken (zonder cijfer).' : ' Noem de levertijd nooit: die is te lang en dat is een nadeel.') + ' Vandaag is het ' + new Date().toISOString().slice(0, 10) + '.\n' +
    'Schrijf 12 advertenties, verdeeld over deze invalshoeken: ' + HOEKEN.join(', ') + '.\nHarde lengte: titel MAXIMAAL 28 tekens, tekst MAXIMAAL 38 tekens, knop MAXIMAAL 15 tekens (harde grens van PropellerAds). Tel de tekens; liever korter.\nNoem geen inhoud, maat of aantal (zoals 500ml, 9cm, 4-pack), ook niet als het in de productnaam staat.\nRegels:\n- ' + TEKSTREGELS.join('\n- ') + '\n' +
    'Knop: kies per advertentie de best passende uit ' + KNOPPEN.join(', ') + ' (of een vergelijkbaar actief werkwoord, hooguit 15 tekens).\n' +
    L + '\nAntwoord alleen JSON: {"advertenties":[{"hoek":"","title":"","description":"","cta":""}]}';
}
// 10 verkoopteksten voor een product (bewaard per product en prijs, 3 dagen); claudeJson = de AI-aanroep van api/shop.js
export async function verkoopTeksten(kv, p, claudeJson, model, lessen) {
  const k = 'hjdk:shop:advai:' + p.pid + ':' + Math.round(N(p.thuis) * 100);
  try { const c = await kv.get(k); const goed = Array.isArray(c) ? c.filter(a => tekstOk(a, p.thuis)) : []; if (goed.length >= 8) return goed; } catch (e) {} // bewaarde teksten opnieuw gekeurd (regels kunnen strenger zijn geworden)
  const gezien = new Set(), lijst = [];
  const neem = j => { for (const x of (j && Array.isArray(j.advertenties) ? j.advertenties : [])) { const a = { hoek: String(x.hoek || '').toLowerCase().trim() || 'voordeel', title: String(x.title || '').trim(), description: String(x.description || x.desc || '').trim(), cta: String(x.cta || '').trim(), bron: 'claude' }; const s = (a.title + '|' + a.description).toLowerCase(); if (gezien.has(s) || !tekstOk(a, p.thuis)) continue; gezien.add(s); lijst.push(a); } };
  let j = await claudeJson(prompt(p, lessen), { fn: 'shop-verkooptekst', max: 1200, model, cacheTtl: 3 * 86400 }); neem(j);
  // tweede poging met strakkere lengte als er te weinig door de keuring kwamen (vaak: tekst net te lang)
  if (lijst.length < 8) { const j2 = await claudeJson(prompt(p, lessen) + '\nTweede poging: de vorige waren te lang. Titel hooguit 24 tekens, tekst hooguit 32 tekens. Korte, krachtige zinnen.', { fn: 'shop-verkooptekst', max: 1200, model, cacheTtl: 3 * 86400 }); neem(j2); if (!j) j = j2; }
  if (lijst.length >= 8) { try { await kv.set(k, lijst, { ex: 3 * 86400 }); } catch (e) {} return lijst; }
  // waarom het niet lukte, voor de controle (op=teksten)
  try { const ruw = j && Array.isArray(j.advertenties) ? j.advertenties : []; await kv.set('hjdk:shop:advai:laatst', { at: new Date().toISOString(), pid: p.pid, titel: p.titel, ruw: ruw.length, goed: lijst.length, afgekeurd: ruw.map(x => ({ t: x.title, d: x.description || x.desc, c: x.cta, fout: tekstFout({ title: x.title, description: x.description || x.desc, cta: x.cta }, p.thuis) })).filter(x => x.fout).slice(0, 10) }, { ex: 86400 }); } catch (e) {}
  return null;
}
