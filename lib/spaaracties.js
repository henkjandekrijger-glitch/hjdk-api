// Spaaracties van deze week op gids.kadoly.com (Henkjan 22 nov 2026: "Ja maak toch die spaaracties van deze week vast inderdaad als
// content marketing en organische motor en laat me zien !"). Demand Radar thema kadoly-sparen (22 nov): albert heijn spaaracties ±4.400,
// jumbo spaaracties ±4.400 (seizoenspiek), poiesz spaaractie ±4.400, plus spaaractie ±1.900, delhaize spaaracties (BE) ±1.900 per maand.
// - Elke actie komt van de site van de supermarkt zelf, met leesdatum en bron. Een actie na haar einddatum verdwijnt vanzelf van de pagina.
// - Eigen hoek: wat een spaaractie oplevert per €100 boodschappen, eerlijk uitgerekend. Onderaan Samen sparen bij Kadoly.
// - Concept tot LIVE = true: alleen op de beschermde host (Henkjan 21 nov: "Ik wil eerst zien voor live gaat").
// - Controle: /api/gids?op=spaar&stand=1 (beschermd) meldt verlopen acties en een pagina die ouder is dan 8 dagen.
export const LIVE = false;
export const PAD = 'spaaracties';
const GELEZEN = '2026-11-22';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dagNL = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
const datum = d => new Date(d + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' });

// tot = laatste spaardag (JJJJ-MM-DD) of '' als de actie doorloopt; per100 = wat €100 aan boodschappen oplevert
export const ACTIES = [
  { id: 'jumbo-spellen', winkel: 'Jumbo', naam: 'Spaar voor 50% korting op spellen', van: '2026-11-04', tot: '2026-12-29', inleveren: '2027-01-05',
    hoe: 'Eén zegel per €10 aan boodschappen, in de app of op een papieren kaart. Je eerste digitale zegel is gratis.',
    vol: '5 zegels geven 50% korting op één spel of puzzel.', per100: '2 keer een spel voor de halve prijs',
    let: 'Online alleen bij een bestelling vanaf €50, en dan voor één spel.', bron: 'https://www.jumbo.com/acties/spellen' },
  { id: 'ah-winterdorp', winkel: 'Albert Heijn', naam: 'Winterdorp', van: '2026-11-16', tot: '2026-12-20', inleveren: '2026-12-20',
    hoe: 'Eén digitale zegel per €10 aan boodschappen, in de AH-app.',
    vol: '3 zegels plus €0,49 geven een houten mini. Er zijn er 20.', per100: '3 minis, je betaalt €1,47',
    let: 'Alleen in de winkel en zolang de voorraad strekt.', bron: 'https://ah.nl/winterdorp' },
  { id: 'plus-punten', winkel: 'PLUS', naam: 'PLUSpunten in de app', van: '', tot: '', inleveren: '',
    hoe: 'Eén PLUSpunt per €1 aan boodschappen, in de app.',
    vol: 'Een volle kaart van 200 punten is €6 korting: €4 uit je punten en €2 van PLUS.', per100: '€3 korting',
    let: 'Hooguit 10 volle kaarten per dag. Geen punten op onder meer alcohol, tabak en cadeaukaarten.', bron: 'https://www.plus.nl/organisatie/faq-sparen-met-de-app' },
  { id: 'poiesz-spaarkaart', winkel: 'Poiesz', naam: 'Spaarkaart met spaarcadeaus', van: '', tot: '', inleveren: '',
    hoe: 'Eén spaarzegel per €2,50 aan boodschappen, zonder statiegeld en slijterij.',
    vol: 'Een volle kaart van 100 zegels geeft een cadeau uit de spaarcatalogus of €2,50 contant. Speelgoed kost 2 tot 13 kaarten.', per100: '€1 contant, of sparen voor een cadeau',
    let: 'Cadeaus haal je na 5 werkdagen op in je eigen Poiesz.', bron: 'https://www.poiesz-supermarkten.nl/spaarcadeaus/speelgoed' },
  { id: 'ah-koopzegels', winkel: 'Albert Heijn', naam: 'Koopzegels', van: '', tot: '', inleveren: '',
    hoe: 'Sinds 7 september 2026 één koopzegel van €0,10 per €2 aan boodschappen.',
    vol: 'Een vol boekje van 490 zegels kost je €49 en geeft €52 terug. Daarvoor doe je €980 aan boodschappen.', per100: '€5 inleg geeft €5,31 terug',
    let: 'Het duurt sinds september twee keer zo lang om een boekje vol te sparen.', bron: 'https://www.consumentenbond.nl/acties-claims/nieuws/2026/koopzegels-ah' },
];
const lopend = () => { const d = dagNL(); return ACTIES.filter(a => !a.tot || a.tot >= d); };
export const FAQ = () => [
  ['Welke spaaracties lopen er nu?', lopend().map(a => a.winkel + ': ' + a.naam + (a.tot ? ' (tot en met ' + datum(a.tot) + ')' : ' (loopt door)')).join('; ') + '.'],
  ['Welke spaaractie levert het meest op?', 'Wil je toch een spel kopen, dan Jumbo: elke €50 aan boodschappen geeft 50% korting op een spel. Zonder spel spaar je bij PLUS het meest: €3 korting per €100 aan boodschappen.'],
  ['Hoeveel zegels krijg je bij Albert Heijn?', 'Voor Winterdorp één digitale zegel per €10. Voor koopzegels sinds 7 september 2026 één zegel van €0,10 per €2.'],
  ['Zijn AH-koopzegels nog de moeite waard?', 'Je krijgt nog steeds 6,1% terug op wat je in een boekje stopt: €49 erin, €52 eruit. Alleen duurt het voller sparen nu twee keer zo lang, want je hebt €980 aan boodschappen nodig voor één boekje.'],
  ['Tot wanneer loopt de spaaractie van Jumbo?', 'Zegels sparen kan tot en met 29 december 2026. Volle kaarten lever je in tot en met 5 januari 2027.'],
];

const CSS = `<style>.sp-t{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #D7DCE8;border-radius:16px;overflow:hidden;margin:0 0 18px}.sp-t th,.sp-t td{text-align:left;padding:14px 18px;border-bottom:1px solid #D7DCE8;vertical-align:top}.sp-t tr:last-child td{border-bottom:0}.sp-t th{font-size:13px;border-bottom:2px solid #111113}.sp-k{border:1px solid #D7DCE8;border-radius:16px;padding:16px 18px;margin:0 0 12px}.sp-k h3{margin:0 0 6px;font-size:18px}.sp-k p{margin:0 0 6px}.sp-l{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0 0 4px}.sp-bron{font-size:13px}.sp-samen{border:2px solid #111113;border-radius:16px;padding:18px;margin:28px 0 0}.sp-samen h2{margin:0 0 8px;font-size:22px}@media(max-width:560px){.sp-t th:nth-child(3),.sp-t td:nth-child(3){display:none}}</style>`;

export async function spaarOp({ req, res, q, host, ua, kaal, schil, isBot, viaPad, telBot }) {
  res.setHeader('cache-control', 'no-store');
  const beschermd = /\.vercel\.app$/i.test(host);
  if (!beschermd && !LIVE) return res.status(404).send('Niet gevonden');
  if (q.get('stand') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden'); const d = dagNL(); const L = [];
    for (const a of ACTIES) if (a.tot && a.tot < d) L.push({ lek: 'verlopen actie', actie: a.winkel + ' ' + a.naam, tot: a.tot, wat: 'nieuwe actie van deze winkel opzoeken op de eigen site en invullen in lib/spaaracties.js' });
    const oud = Math.round((Date.now() - Date.parse(GELEZEN + 'T12:00:00Z')) / 864e5); if (oud > 8) L.push({ lek: 'pagina niet ververst', dagen: oud, wat: 'alle acties opnieuw lezen op de sites van de supermarkten' });
    return res.status(200).json({ ok: true, live: LIVE, gelezen: GELEZEN, lopend: lopend().map(a => a.id), lekken: L }); }
  if (!isBot(ua) && telBot) { try { await telBot(ua, 'spaaracties'); } catch (e) {} }
  const L = lopend();
  const titel = 'Spaaracties deze week: AH, Jumbo, PLUS en Poiesz';
  const besch = 'Alle spaaracties van deze week naast elkaar: wat je spaart, tot wanneer, en wat het oplevert per €100 boodschappen. Bijgewerkt ' + datum(GELEZEN) + '.';
  let x = `<nav class="crumbs" aria-label="breadcrumb"><a href="/">Gidsen</a> › Spaaracties</nav><p class="kicker">Spaaracties</p><h1>Spaaracties van deze week: wat levert sparen op?</h1><p class="meta">Bijgewerkt ${datum(GELEZEN)}</p>`;
  x += `<div class="answer"><p><b>Wil je toch een spel kopen, dan levert Jumbo nu het meest op: elke €50 aan boodschappen geeft 50% korting op een spel, tot en met 29 december.</b> Zonder spel spaar je bij PLUS het meest: €3 korting per €100 aan boodschappen.</p></div>`;
  x += `<h2>Alle spaaracties naast elkaar</h2><table class="sp-t"><tr><th>Supermarkt</th><th>Per €100 boodschappen</th><th>Tot wanneer</th></tr>${L.map(a => `<tr><td><b>${esc(a.winkel)}</b><br>${esc(a.naam)}</td><td>${esc(a.per100)}</td><td>${a.tot ? 'Tot en met ' + esc(datum(a.tot)) : 'Loopt door'}</td></tr>`).join('')}</table>`;
  x += `<h2>Zo werkt elke actie</h2>${L.map(a => `<div class="sp-k" id="${a.id}"><p class="sp-l">${esc(a.winkel)}</p><h3>${esc(a.naam)}</h3><p>${esc(a.hoe)}</p><p>${esc(a.vol)}</p>${a.tot ? `<p>Sparen tot en met ${esc(datum(a.tot))}${a.inleveren && a.inleveren !== a.tot ? `, inleveren tot en met ${esc(datum(a.inleveren))}` : ''}.</p>` : ''}<p>Let op: ${esc(a.let)}</p><p class="sp-bron">Bron: <a href="${esc(a.bron)}" rel="nofollow noopener">${esc(new URL(a.bron).hostname.replace(/^www\./, ''))}</a>, gelezen op ${esc(datum(GELEZEN))}</p></div>`).join('')}`;
  x += `<div class="sp-samen"><h2>Samen sparen bij Kadoly</h2><p>Bij de supermarkt spaar je alleen. Bij Kadoly spaar je samen met familie of vrienden: elke bestelling in je groep is €1 voor iedereen. Een volle kaart is je product gratis, ook de verzending.</p><p><a class="btn knop" href="${beschermd ? '/api/gids?op=ss' : '/samen-sparen'}">Spaar mee</a></p><p class="meta">Geen voorwaarden. Je hoeft zelf niets te kopen.</p></div>`;
  x += `<h2>Vragen</h2>${FAQ().map(([v, a]) => `<details class="faq"><summary>${esc(v)}</summary><div class="a"><p>${esc(a)}</p></div></details>`).join('')}`;
  x += `<p class="meta">We lezen elke actie op de site van de supermarkt zelf. Klopt er iets niet? App Henkjan van Kadoly: 06 55395630.</p>`;
  if (!LIVE) x = `<div class="sp-k"><p><b>Concept.</b> Deze pagina staat nog niet op gids.kadoly.com; alleen jij ziet hem hier.</p></div>` + x;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  if (beschermd || !schil) { res.setHeader('x-robots-tag', 'noindex'); return res.status(200).send(kaal(titel, CSS + x)); }
  const url = 'https://gids.kadoly.com/' + PAD;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Gidsen', item: 'https://gids.kadoly.com/' }, { '@type': 'ListItem', position: 2, name: 'Spaaracties', item: url }] },
    { '@type': 'Article', headline: 'Spaaracties van deze week: wat levert sparen op?', description: besch, dateModified: GELEZEN, inLanguage: 'nl-NL', mainEntityOfPage: url, publisher: { '@type': 'Organization', name: 'Kadoly', url: 'https://kadoly.com' } },
    { '@type': 'FAQPage', mainEntity: FAQ().map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) }] };
  return res.status(200).send(schil(titel + ' | Kadoly', besch, '/' + PAD, '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + CSS, x, ''));
}
