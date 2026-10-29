// lib/shopketen.js: de lekketen van de Kadoly-shop richting de kassa, per dag (Henkjan 29 okt 2026: "En zet alle lekken weer op een rij richting checkout .
// Doet dit iedere dag en zet in Nexy voor me"). Bron: de uurtellers van Clickmind (lib/shopuur.js, hash hjdk:shu:<UTC-dag>, 9 dagen),
// directe route (d...) en landingspagina (l...) samen, alle netwerken samen. Per stap: aantal, door van de vorige stap, verlies.
// De drie grootste lekken krijgen een taak. Naar Nexy gaat hij zodra er een Nexy-webhook is (NEXY_WEBHOOK_URL en NEXY_TOKEN in Vercel).
const N = v => Number(v) || 0;
export const STAPPEN = [
  ['aan', 'Aangekomen vanaf de advertentie', ['dv', 'view']],
  ['dg', 'Pagina geladen', ['dg', 'lg']],
  ['dz', 'Minstens 1 seconde in beeld', ['dz', 'lz']],
  ['t5', '5 seconden gebleven', ['dt5', 'lt5']],
  ['dm', 'Echt mens (beweegt, scrollt of tikt)', ['dm', 'lm']],
  ['t15', '15 seconden gebleven', ['dt15', 'lt15']],
  ['t60', '1 minuut gebleven', ['dt60', 'lt60']],
  ['wk', 'Tik op de winkelwagenknop', ['dwk', 'lwk']],
  ['cart', 'Winkelwagen (gemeld door de shop)', ['cart']],
  ['afreken', 'Afrekenpagina geopend', ['afreken']],
  ['betaal', 'Betaling gestart', ['betaal']],
  ['koop', 'Betaald', ['koop']],
];
// los van de keten: signalen van interesse onderweg
const NEVEN = [['s50', 'Scrollt tot de helft', ['ds50', 'ls50']], ['fk', 'Tikt op een foto', ['dfk', 'lfk']], ['p2', 'Bekijkt een tweede pagina', ['dp2', 'lp2']], ['sv', 'Bewaart', ['dsv', 'lsv']], ['dl', 'Deelt', ['ddl', 'ldl']], ['pm', 'Meldt zich aan', ['dpm', 'lpm']], ['fout', 'Betaling mislukt of afgebroken', ['fout']]];
export const TAAK = {
  dg: 'Snelheid: productpagina op de mobiel binnen 2 seconden zichtbaar. Geen omleiding meer van /product/<id> naar /product/<naam> (elke omleiding kost een rondgang), zware scripts uitstellen (defer of na het laden), foto\'s klein (WebP, juiste maat).',
  dz: 'Eerste scherm: grote productfoto, naam en één zin wat je eraan hebt, prijs en knop zonder scrollen; niets over het product heen (cookiebalk, melding, chat).',
  t5: 'Eerste 5 seconden: bovenaan direct het product en de belofte uit de advertentie, geen logo-balk of menu dat de halve schermhoogte pakt.',
  dm: 'Uitnodigen: foto\'s om door te vegen, drie korte voordelen met een icoon, "past hier ook bij" eronder.',
  t15: 'Reden om te blijven: korte video of foto in gebruik (in huis, als cadeau), het verhaal van de maker in twee zinnen.',
  t60: 'Vertrouwen: reviews of "anderen kochten ook", 14 dagen retour en veilig betalen vlak bij de knop.',
  wk: 'Koopknop: altijd zichtbaar (vast onderin het scherm), één knop "In mijn mandje", geen verplichte keuze vooraf.',
  cart: 'Mandje: als op de knop wordt getikt maar de shop geen mandje meldt, werkt de knop of de melding niet. Nalopen op de mobiel.',
  afreken: 'Na het mandje meteen "Afrekenen" tonen; geen account nodig, kosten vooraf duidelijk.',
  betaal: 'Afrekenpagina kort: iDEAL bovenaan, zo min mogelijk velden, adres automatisch aanvullen, geen verrassingskosten.',
  koop: 'Betaling: mislukte en afgebroken betalingen nalopen (fout-teller), terugkeer na iDEAL controleren.',
};
async function leesDag(kv, d8) {
  try { const a = await kv.raw(['HGETALL', 'hjdk:shu:' + d8]); const o = {}; const zet = (f, v) => { const [, , s] = String(f).split('|'); if (!s || s.includes(':')) return; o[s] = N(o[s]) + N(v); };
    if (Array.isArray(a)) { for (let i = 0; i + 1 < a.length; i += 2) zet(a[i], a[i + 1]); } else if (a && typeof a === 'object') for (const [f, v] of Object.entries(a)) zet(f, v); return o; } catch (e) { return {}; }
}
export async function lekketen(kv, dag) {
  const d = dag || new Date().toISOString().slice(0, 10); const t = await leesDag(kv, d.replace(/-/g, ''));
  const som = l => l.reduce((a, s) => a + N(t[s]), 0);
  const stappen = []; let vorige = null;
  for (const [id, naam, k] of STAPPEN) { const n = som(k); const door = vorige && vorige.n ? Math.round(1000 * n / vorige.n) / 10 : null; stappen.push({ id, naam, n, door, verlies: vorige ? Math.max(0, vorige.n - n) : 0 }); vorige = { n }; }
  const aan = stappen[0].n; for (const s of stappen) s.vanAan = aan ? Math.round(1000 * s.n / aan) / 10 : null;
  // grootste lekken: laagste doorstroom, met genoeg bezoekers om iets te zeggen (vorige stap 20 of meer)
  const lekken = stappen.slice(1).filter((s, i) => stappen[i].n >= 20 && s.door !== null).sort((a, b) => a.door - b.door).slice(0, 3).map(s => ({ id: s.id, stap: s.naam, door: s.door, verlies: s.verlies, taak: TAAK[s.id] || '' }));
  const neven = NEVEN.map(([id, naam, k]) => ({ id, naam, n: som(k) }));
  return { ok: true, dag: d, at: new Date().toISOString(), stappen, lekken, neven, omzet: Math.round(N(t.omzet)) / 100 };
}
// platte tekst voor een bericht (Nexy, mail)
export function ketenTekst(k) {
  const g = v => N(v).toLocaleString('nl-NL');
  const r = ['Kadoly lekketen ' + k.dag + ' (aankomst tot betaald)', ''];
  for (const s of k.stappen) r.push(s.naam + ': ' + g(s.n) + (s.door !== null ? ' (' + String(s.door).replace('.', ',') + '% door)' : ''));
  r.push('', 'Grootste lekken:'); k.lekken.forEach((l, i) => r.push((i + 1) + '. ' + l.stap + ': ' + String(l.door).replace('.', ',') + '% door, ' + g(l.verlies) + ' weg. ' + l.taak));
  return r.join('\n');
}
// eenmaal per dag naar Nexy (zodra NEXY_WEBHOOK_URL bestaat); de kaart is van Clickmind voor Henkjan en Babita
export async function naarNexy(kv, dag) {
  const url = process.env.NEXY_WEBHOOK_URL; if (!url) return { ok: false, reden: 'geen NEXY_WEBHOOK_URL' };
  const vk = 'hjdk:shop:lekketen:nexy:' + dag; try { if (await kv.get(vk)) return { ok: true, al: true }; } catch (e) {}
  const k = await lekketen(kv, dag);
  const kaart = { soort: 'kaart', titel: 'Kadoly: lekken richting de kassa, ' + dag, van: 'Clickmind', naar: ['Henkjan', 'Babita'], staat: 'Your turn', tekst: ketenTekst(k), stappen: k.lekken.map(l => ({ titel: l.stap, wat: l.taak, cijfer: l.door + '% door' })), link: 'https://hjdk-api-henq.vercel.app/api/shop/lekketen?dag=' + dag + '&vorm=tekst', data: k };
  try { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (process.env.NEXY_TOKEN || '') }, body: JSON.stringify(kaart), signal: AbortSignal.timeout(10000) }); if (r.ok) { try { await kv.set(vk, 1, { ex: 3 * 86400 }); } catch (e) {} } return { ok: r.ok, status: r.status }; } catch (e) { return { ok: false, reden: String(e && e.message || e).slice(0, 80) }; }
}
