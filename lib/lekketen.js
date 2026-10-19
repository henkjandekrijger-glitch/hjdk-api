// Clickmind: de lekketen van advertentie tot betaling (Henkjan 19 okt 2026: "lek is vanaf ad naar betaling. Daar haken mensen af
// ieder punt waar lek zit los je op tot er geen lekken meer zijn"; "Ja gebruik vooral clickmind"; "Niet alleen clickmind kijk naar
// de leerlus skill").
//
// Eén keten per project, nu MyLevel:
//   klik (PropellerAds, afgerekend, per UTC-uur)  ->  geland -> test geladen -> vraag 1 in beeld -> aangeraakt -> antwoord 1 ->
//   antwoord 2 -> gratis deel af -> prijs gezien -> koopklik -> checkout open -> betaalmethode -> betaalpoging -> betaald
// De paginastappen telt MyLevel zelf, eenmaal per advertentiebezoeker per stap (mylevel lib/prod.js keten, elke 15 minuten
// meegestuurd met de projectoverdracht via propellerads-mcp). Ernaast meet Clickmind zelf per campagne en zone hoeveel
// advertentiebezoekers aankwamen en hoeveel echte mensen dat waren (mensmeter, mm:c; op MyLevel aan sinds 19 okt).
//
// Elke stap tegen een maatstaf (leerlus-skill, "Gezond verstand": tot er eigen cijfers zijn). Een stap is een lek zolang hij minder
// doorlaat dan zijn maatstaf; onder de helft = lek-alarm; 10+ erin en 0 door = kapot. Grootste lek = de stap die naar schatting de
// meeste verkopen kost (te veel weg ten opzichte van de maatstaf maal de kans op verkoop daarna, bij maatstaf). Beoordelen vanaf 30
// erin. "Geen lekken meer" = elke stap met 30+ erin haalt zijn maatstaf en er is geen stap die nog niet te beoordelen is.
// Alleen meten en melden; de leerlus (MyLevel: elk half uur) dicht het lek volgens de leerlus-skill.
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const pct = (a, b) => (b ? Math.round(1000 * a / b) / 10 : null);

export const MAATSTAF_VERSIE = '2026-10-19';
// [veld, naam, maatstaf: deel van de vorige stap dat doorgaat]
export const KETEN = [
  ['klik', 'advertentieklik', null],
  ['land', 'geland', 0.80],
  ['bezoek', 'test geladen', 0.90],
  ['vraag1', 'vraag 1 in beeld', 0.95],
  ['aangeraakt', 'aangeraakt', 0.60],
  ['antw1', 'antwoord 1', 0.70],
  ['antw2', 'antwoord 2', 0.60],
  ['gratis_af', 'gratis deel af', 0.50],
  ['prijs', 'prijs gezien', 0.70],
  ['koopklik', 'koopklik', 0.10],
  ['checkout', 'checkout open', 0.80],
  ['methode', 'betaalmethode', 0.50],
  ['poging', 'betaalpoging', 0.60],
  ['betaald', 'betaald', 0.70]
];
const MIN_IN = 30;
// B = MAP (Henkjan 19 okt: "Een lek kan ook zijn geen demand mindset ... max gepercipieerde value prop ... niet te technisch denken
// maar zeker ook wel in technische en mentale frictie. B = MAP."): per stap de waarschijnlijke oorzaken, zodat de lus bij het grootste
// lek eerst vaststelt of het motivatie (vraag, gepercipieerde waarde), vermogen (technische of mentale frictie) of prompt is.
export const MAP = {
  land: 'A technisch: laadtijd, doorsturen, pagina kapot; of verkeer zonder mensen (Clickmind echt mens)',
  bezoek: 'A technisch: laadtijd van de test',
  vraag1: 'A technisch: laadtijd, eerste scherm',
  aangeraakt: 'M: geen vraag nu of waarde niet meteen zichtbaar, belofte van de advertentie niet voortgezet | A mentaal: niet duidelijk wat te doen | P: geen duidelijke eerste tik',
  antw1: 'A mentaal: vraag te moeilijk of te lang | M: waarom zou ik? | P: antwoordknoppen niet als tik herkend',
  antw2: 'M: feedback en voortgang geven geen zin in meer | A mentaal: te moeilijk',
  gratis_af: 'M: waarde niet gevoeld (score, uitleg) | A: lengte, tijd',
  prijs: 'P: route naar het aanbod | A: knop niet gezien',
  koopklik: 'M: gepercipieerde waarde lager dan de prijs, risico, geen vraag nu | A mentaal: vertrouwen | P: aanbod op het verkeerde moment',
  checkout: 'A technisch: checkout laadt niet of te traag',
  methode: 'A: betaalmethode ontbreekt, vertrouwen | M: twijfel op het laatste moment',
  poging: 'A: formulier, gegevens | M: twijfel',
  betaald: 'A technisch: bank, 3D Secure, weigering'
};

// tellingen per stap -> stappen met maatstaf, lek, verkopen gemist; plus het grootste lek en de status
export function beoordeel(tel) {
  const st = [];
  for (let i = 1; i < KETEN.length; i++) {
    const [va, vn] = KETEN[i - 1], [na, nn, maat] = KETEN[i];
    const inn = N(tel[va]), door = Math.min(inn, N(tel[na]));
    if (va === 'klik' && !inn) continue; // geen kliks bekend: de keten begint bij geland
    const nu = inn ? door / inn : null;
    const rest = KETEN.slice(i + 1).reduce((p, s) => p * (s[2] || 1), 1); // kans op betaling na deze stap, bij maatstaf
    const teVeel = inn && nu != null ? Math.max(0, maat * inn - door) : 0;
    const kapot = inn >= 10 && door === 0 && maat >= 0.1;
    const oordeel = inn < MIN_IN && !kapot ? 'te weinig' : kapot ? 'kapot' : nu < maat / 2 ? 'alarm' : nu < maat ? 'lek' : 'dicht';
    st.push({ map: MAP[na] || '', van: vn, naar: nn, veld: na, in: inn, door, weg: inn - door, pct: pct(door, inn), maatstaf: Math.round(maat * 100), teVeelWeg: Math.round(teVeel), verkopenGemist: Math.round(teVeel * rest * 1000) / 1000, oordeel });
  }
  const lekken = st.filter(s => ['kapot', 'alarm', 'lek'].includes(s.oordeel));
  const grootste = st.find(s => s.oordeel === 'kapot') || lekken.slice().sort((a, b) => b.verkopenGemist - a.verkopenGemist)[0] || null;
  const open = st.filter(s => s.oordeel === 'te weinig');
  if (!st.some(s => s.in > 0)) return { stappen: st, lekken: 0, grootste: null, status: 'nog geen advertentiebezoekers in dit venster' };
  const status = lekken.length ? lekken.length + (lekken.length === 1 ? ' lek' : ' lekken') : open.length ? 'geen lek boven de maatstaf, maar ' + open.length + ' stappen nog niet te beoordelen (minder dan ' + MIN_IN + ' erin)' : 'GEEN LEKKEN: elke stap haalt zijn maatstaf';
  return { stappen: st, lekken: lekken.length, grootste, status };
}

async function paUren(naam) {
  const s = process.env.SHOP_SLEUTEL || ''; if (!s) return { fout: 'geen SHOP_SLEUTEL' };
  const base = (process.env.PA_LUS_URL || 'https://propellerads-mcp.vercel.app').replace(/\/$/, '');
  try {
    const r = await fetch(base + '/api/statistiek', { method: 'POST', headers: { 'content-type': 'application/json', 'x-shop-sleutel': s }, body: JSON.stringify({ perUur: true, naam }), signal: AbortSignal.timeout(26000) });
    const j = await r.json().catch(() => ({})); return j && j.ok ? j : { fout: String((j && j.fout) || 'HTTP ' + r.status).slice(0, 120) };
  } catch (e) { return { fout: String(e.message || e).slice(0, 120) }; }
}
async function projectStand(project) {
  const s = process.env.SHOP_SLEUTEL; if (!s) return null;
  const base = (process.env.WACHT_CENTRAAL_URL || 'https://propellerads-mcp.vercel.app').replace(/\/$/, '');
  try { const r = await fetch(base + '/api/wachtlog?stand=1', { headers: { 'x-shop-sleutel': s }, signal: AbortSignal.timeout(9000) }); const j = r.ok ? await r.json() : null; return ((j && j.projecten) || []).find(p => p.project === project) || null; } catch (e) { return null; }
}
async function hash(kv, k) { const o = {}; try { const h = await kv.raw(['HGETALL', k]); for (let i = 0; h && i < h.length; i += 2) o[h[i]] = N(h[i + 1]); } catch (e) {} return o; }
const NET = { pa: 'propeller', md: 'mondiad', mg: 'mgid', g: 'gads' };
const campNet = c => /^md/i.test(c) ? ['mondiad', c.slice(2)] : /^mg/i.test(c) ? ['mgid', c.slice(2)] : /^g\d/i.test(c) ? ['gads', c.slice(1)] : ['propeller', c];

export async function lekketen(kv, { project = 'mylevel', vers = false } = {}) {
  const ck = 'mm:lekketen:' + project;
  if (!vers) { try { const c = await kv.get(ck); if (c && Date.now() - Date.parse(c.bijgewerkt) < 5 * 60e3) return c; } catch (e) {} }
  if (project !== 'mylevel') return { ok: false, fout: 'alleen mylevel heeft nog een lekketen' };
  const nu = new Date(), d = nu.toISOString().slice(0, 10), uurNu = nu.toISOString().slice(11, 13);
  const [p, pa, cm] = await Promise.all([projectStand(project), paUren('MYLEVEL'), hash(kv, 'mm:c:' + d)]);
  let K = p && p.keten && p.keten.vandaag && p.keten.vandaag.dag === d ? p.keten.vandaag : null;
  const uit = { ok: true, project, bijgewerkt: nu.toISOString(), dag: d, maatstafVersie: MAATSTAF_VERSIE, bron: { pagina: p ? 'MyLevel keten via de projectoverdracht (' + String(p.ontvangen || '').slice(0, 16) + ' UTC)' : 'MyLevel-stand niet bereikbaar', kliks: pa.fout ? 'PropellerAds per uur: ' + pa.fout : 'PropellerAds per uur (' + (pa.campagnes || 0) + ' campagnes)', mens: 'Clickmind mensmeter (mm:c)' } };
  if (!K) { uit.ok = false; uit.fout = 'MyLevel heeft vandaag nog geen keten gestuurd'; return uit; }

  // venster: hele UTC-uren vanaf het eerste hele uur na de start van de meting tot het lopende uur (kliks lopen achter: lopend uur
  // telt niet). Nog geen heel uur vandaag (net na middernacht of net gestart)? Dan gisteren, als die er is.
  const venster = (Kd, dag, eind) => {
    const t0 = Kd.t0 ? new Date(Kd.t0) : new Date(dag + 'T00:00:00Z');
    if (!Kd.t0) return { dag, uren: [], tel: { klik: 0, kosten: 0 }, t0 }; // geen meting die dag: geen venster (anders lijken alle kliks verloren)
    const start = t0.toISOString().slice(0, 10) < dag ? 0 : t0.getUTCHours() + (t0.getUTCMinutes() > 0 ? 1 : 0);
    const uren = []; for (let h = start; h < eind; h++) uren.push(String(h).padStart(2, '0'));
    const tel = { klik: 0, kosten: 0 };
    for (const h of uren) { for (const [f, v] of Object.entries((Kd.uren || {})[h + ':pa'] || {})) tel[f] = N(tel[f]) + N(v); const x = (pa.uren || {})[dag + 'T' + h]; if (x) { tel.klik += N(x.kliks); tel.kosten += N(x.kosten); } }
    tel.kosten = Math.round(tel.kosten * 100) / 100;
    return { dag, uren, tel, t0 };
  };
  let V = venster(K, d, N(uurNu));
  const G = p.keten.gisteren;
  if (!V.uren.length && G && G.dag) { const vg = venster(G, G.dag, 24); if (vg.uren.length) V = vg; }
  const t0 = V.t0;
  uit.venster = V.uren.length ? { dag: V.dag, van: V.uren[0] + ':00', tot: String(N(V.uren[V.uren.length - 1]) + 1).padStart(2, '0') + ':00', uren: V.uren.length } : null;
  uit.pa = { telling: V.tel, ...beoordeel(V.uren.length && !pa.fout ? V.tel : Object.assign({}, V.tel, { klik: 0 })) };
  // hele dag (alle netwerken, zonder kliks): alle advertentiebezoekers sinds de start van de meting
  uit.dag_alle = { sinds: (K.t0 ? new Date(K.t0) : t0).toISOString().slice(11, 16), telling: K.totaal || {}, ...beoordeel(Object.assign({}, K.totaal || {}, { klik: 0 })) };
  // Clickmind ernaast: per campagne gemeten en echt mens (mensmeter), naast de paginastappen van die campagne
  const camps = [];
  let cmN = 0, cmMens = 0;
  for (const [c, t] of Object.entries(K.campagnes || {})) {
    const [net, id] = campNet(c), k = net + '|' + id;
    const n = N(cm[k + '|n']), mens = N(cm[k + '|mens']); cmN += n; cmMens += mens;
    camps.push({ campagne: c, net, land: N(t.land), vraag1: N(t.vraag1), aangeraakt: N(t.aangeraakt), antw1: N(t.antw1), prijs: N(t.prijs), betaald: N(t.betaald), cmGemeten: n, cmEchtMens: mens, cmMensPct: pct(mens, n) });
  }
  camps.sort((a, b) => b.land - a.land);
  uit.campagnes = camps.slice(0, 25);
  uit.clickmind = { gemeten: cmN, echtMens: cmMens, mensPct: pct(cmMens, cmN) };
  uit.tekst = tekst(uit);
  try { await kv.set(ck, uit, { ex: 3600 }); } catch (e) {}
  return uit;
}

function regel(s) { return s.van + ' -> ' + s.naar + ': ' + s.door + '/' + s.in + ' (' + (s.pct == null ? '-' : s.pct + '%') + ', maatstaf ' + s.maatstaf + '%' + (s.oordeel === 'dicht' ? ', dicht' : s.oordeel === 'te weinig' ? ', te weinig' : ', ' + s.oordeel.toUpperCase() + ', ' + s.teVeelWeg + ' te veel weg') + ')'; }
export function tekst(u, { openbaar = false } = {}) {
  if (!u || !u.ok) return ['Lekketen ' + ((u && u.project) || '') + ': ' + ((u && u.fout) || 'niet beschikbaar')];
  const r = [];
  const g = u.pa && u.pa.grootste;
  r.push('Lekketen MyLevel (PropellerAds, ' + (u.venster ? u.venster.dag + ' ' + u.venster.van + '-' + u.venster.tot + ' UTC, ' + u.venster.uren + ' hele uren' : 'nog geen heel uur gemeten') + ', $' + u.pa.telling.kosten + '): ' + u.pa.status + (g ? '. GROOTSTE LEK: ' + regel(g) + ', kost naar schatting ' + g.verkopenGemist + ' verkopen. B = MAP, stel eerst vast welke: ' + g.map : '') + '.');
  r.push('Stappen: ' + u.pa.stappen.map(regel).join(' | '));
  const gd = u.dag_alle.grootste;
  r.push('Hele dag, alle netwerken (advertentiebezoekers sinds ' + u.dag_alle.sinds + ' UTC): ' + u.dag_alle.status + (gd ? '; grootste lek ' + regel(gd) + '; B = MAP: ' + gd.map : '') + '.');
  if (openbaar) r.push('Clickmind (mensmeter, vandaag): ' + u.clickmind.gemeten + ' advertentiebezoekers gemeten, ' + u.clickmind.echtMens + ' echt mens' + (u.clickmind.mensPct == null ? '' : ' (' + u.clickmind.mensPct + '%)') + '. Per campagne: de beschermde host.');
  else r.push('Clickmind (mensmeter, vandaag): ' + u.clickmind.gemeten + ' advertentiebezoekers gemeten, ' + u.clickmind.echtMens + ' echt mens' + (u.clickmind.mensPct == null ? '' : ' (' + u.clickmind.mensPct + '%)') + '. Per campagne geland/vraag 1/aangeraakt/antwoord 1/prijs/betaald | Clickmind gemeten/echt: ' + (u.campagnes.slice(0, 8).map(c => c.campagne + ' ' + [c.land, c.vraag1, c.aangeraakt, c.antw1, c.prijs, c.betaald].join('/') + ' | ' + c.cmGemeten + '/' + c.cmEchtMens).join(' · ') || '-') + '.');
  r.push('Regel: de leerlus dicht elke ronde het grootste lek op deze keten, tot er geen lekken meer zijn (leerlus-skill: eerst vaststellen of het motivatie/vraag, technische of mentale frictie of prompt is (B = MAP); eerst de pagina, dan het verkeer; een experiment per stap; panel met psycholoog, verkoopexpert en gedragseconoom naast de techniek).');
  return r;
}
