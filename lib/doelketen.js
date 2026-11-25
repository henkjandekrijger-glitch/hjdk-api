// Doelketen van Clickmind (dagronde 25 nov 2026). Het doel is één getal: uitkomsten (aanmelding of verkoop) per 100 betaalde kliks over
// alle campagnes samen. Dat ene getal zegt niet waar het weglekt. Deze module zet de campagnes van de uurwacht (lib/eigenwacht.js) per lijn
// (campagnefamilie) op een rij: kliks -> bezoek -> mens -> actie -> uitkomst, hoeveel uitkomsten de lijn te weinig levert voor het doel en
// in welke stap het wegvalt. De lijn met het grootste tekort is het grootste lek. Alleen meten: verandert niets aan campagnes.
// Controle in de meting zelf: acties zonder één gemeten mens is geen nul maar een meetgat, en dat staat er dan bij.
// De uurwacht bewaart elk uur de dagstand (mm:doel:dagen), zodat het dashboard het getal van gisteren kent.
export const DOEL = 5;
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const r1 = x => Math.round(N(x) * 10) / 10;

// lijn = eerste deel van de campagnenaam tot de eerste streep, zonder [In-Page]; alle SHOP-LUS-producten samen één lijn
export function lijnVan(naam) {
  let s = String(naam || '').replace(/^\s*\[[^\]]*\]\s*/, '').split('|')[0].replace(/\s+/g, ' ').trim();
  if (/^SHOP-LUS/i.test(s)) s = 'SHOP-LUS';
  return s.slice(0, 48) || 'onbekend';
}

function stap(l) {
  if (l.kliks >= 50 && l.bezoek < 0.7 * l.kliks) return 'aankomst: ' + Math.round(100 * l.bezoek / l.kliks) + '% van de kliks komt aan';
  if (l.mens === 0 && l.bezoek >= 50 && l.actie >= 0.1 * l.bezoek) return 'meetgat: ' + l.actie + ' acties maar geen enkel mens gemeten';
  if (l.mens === 0 && l.bezoek >= 50) return 'geen enkel echt mens gemeten op ' + l.bezoek + ' bezoeken (bots of meetgat)';
  if (!l.uit) return l.actie ? 'actie zonder uitkomst: ' + l.actie + ' acties, geen aanmelding of verkoop' : 'geen actie en geen uitkomst';
  return 'van mens naar uitkomst: ' + l.uit + ' uitkomsten' + (l.mens ? ' op ' + l.mens + ' echte mensen' : '');
}

export function doelKeten(camps, doel = DOEL) {
  const L = {};
  for (const c of camps || []) {
    if (!c || !N(c.kliks)) continue;
    const k = lijnVan(c.naam), l = L[k] || (L[k] = { lijn: k, project: c.project || '', campagnes: 0, kliks: 0, kosten: 0, bezoek: 0, mens: null, actie: 0, uit: 0 });
    l.campagnes++; l.kliks += N(c.kliks); l.kosten += N(c.kosten); l.bezoek += N(c.bezoek); l.actie += N(c.actie); l.uit += N(c.aanmelding) + N(c.koop);
    if (c.mens != null) l.mens = N(l.mens) + N(c.mens);
  }
  const lijnen = Object.values(L);
  let kliks = 0, uit = 0, kliksZonder = 0;
  for (const l of lijnen) {
    l.kosten = Math.round(l.kosten * 100) / 100; l.per100 = r1(100 * l.uit / l.kliks); l.tekort = Math.max(0, r1(l.kliks * doel / 100 - l.uit)); l.stap = stap(l);
    l.meetgat = /^meetgat|bots of meetgat/.test(l.stap);
    kliks += l.kliks; uit += l.uit; if (!l.uit) kliksZonder += l.kliks;
  }
  lijnen.sort((a, b) => b.tekort - a.tekort || b.kliks - a.kliks);
  const g = lijnen.find(l => l.kliks >= 50 && l.tekort > 0) || null;
  return { doel, kliks, uit, nu: kliks ? r1(100 * uit / kliks) : null, kliksZonderUitkomst: kliksZonder, pctZonderUitkomst: kliks ? Math.round(100 * kliksZonder / kliks) : null,
    grootste: g ? g.lijn : null, meetgaten: lijnen.filter(l => l.meetgat).map(l => l.lijn), lijnen: lijnen.slice(0, 20) };
}

export function ketenTekst(k, n = 8) {
  if (!k || !k.kliks) return [];
  const r = ['Keten per lijn (vandaag UTC, grootste tekort eerst; tekort = uitkomsten te weinig voor ' + k.doel + ' per 100 kliks):'];
  for (const l of k.lijnen.slice(0, n)) r.push('- ' + l.lijn + ': ' + l.kliks + ' kliks, ' + l.bezoek + ' bezoeken, ' + (l.mens == null ? 'mens niet per campagne gemeten' : l.mens + ' mensen') + ', ' + l.actie + ' acties, ' + l.uit + ' uitkomsten = ' + String(l.per100).replace('.', ',') + ' per 100, tekort ' + String(l.tekort).replace('.', ',') + '. ' + l.stap);
  const g = k.lijnen.find(l => l.lijn === k.grootste);
  if (g) r.push('Grootste lek: ' + g.lijn + ' (' + g.stap + ').');
  if (k.pctZonderUitkomst) r.push(k.pctZonderUitkomst + '% van de kliks (' + k.kliksZonderUitkomst + ') zit in lijnen zonder één uitkomst.');
  if (k.meetgaten.length) r.push('Meetgat, eerst repareren voor je oordeelt: ' + k.meetgaten.join(', ') + '.');
  return r;
}

// dagstand bewaren (uurwacht, elk uur; de laatste van de dag blijft staan) en teruglezen
export async function doelBewaar(kv, dag, k) {
  if (!k || N(k.kliks) < 100) return false;
  await kv.raw(['HSET', 'mm:doel:dagen', dag, JSON.stringify({ kliks: k.kliks, uit: k.uit, nu: k.nu, grootste: k.grootste, t: new Date().toISOString() })]);
  return true;
}
export async function doelDag(kv, dag) { try { const s = await kv.raw(['HGET', 'mm:doel:dagen', dag]); return s ? (typeof s === 'string' ? JSON.parse(s) : s) : null; } catch (e) { return null; } }
