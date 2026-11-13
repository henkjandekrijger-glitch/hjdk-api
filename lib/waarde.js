// De munt van Clickmind (Henkjan 13 nov 2026: "Ja voer ze alle 7 door", punt 1: alles in één munt, dollars).
// Per project per uitkomst wat die uitkomst waard is, in dollarcent. Zo kan het geldscherm (/api/geld) elke uitkomst naast
// de uitgaven zetten: opgeleverd = aantal uitkomsten x waarde, plus echte verkopen waar de shop ze meldt.
// Opslag: Redis mm:waarde = { waarden: { <project>: { <uitkomst>: cent } }, eurUsd, bijgewerkt }. Alleen wat Henkjan zelf
// invulde staat erin; de rest komt uit STANDAARD hieronder en heet op het scherm "schatting, zet je eigen getal".
//
// Uitkomsten: echt (echt mens), actie (keuze, tik, mandje), aanmelding (adres of contact), lezer (eerste geopende mail),
// dialoog (WAM: echte tweespraak), koop (echte marge per verkoop, niet de omzet).
// Waar de standaarden vandaan komen (13 nov 2026):
//   kadoly koop 770 = 2 verkopen 11-12 nov, €106,18 omzet, winst ~€13,34, dus ~€6,67 per verkoop x 1,155 (OVERDRACHT-YOORS-SHOP.md);
//          aanmelding 70 = lib/modal.js WAARDE aanmelding (70 cent).
//   echt en actie zijn voorlopers, geen geld: laag gehouden zodat het scherm niet mooier rekent dan het is. echt 0,1 cent
//          (een goedkope klik kost 0,1-0,3 cent), actie 0,5 cent; Kadoly 0,2 en 1 cent (7 dagen tot 13 nov: ~3.200 echte mensen en
//          ~450 acties voor 2 verkopen, dus een echt mens is daar ~0,5 cent aan verkoop waard en die verkoop telt al apart).
//   todayin aanmelding 10 = lib/eigenwacht.js DOEL_LID ($0,10 per lid, Henkjans doel); lezer 20 bovenop het adres
//          (north star "Lezers !!!", 7 nov; ongeveer een op de drie adressen leest, dus een lezer is ~3x een adres waard).
//   bzz aanmelding 1 = Henkjan 29 okt: "we moeten naar 1 cent per email dat is north star" (propellerads-mcp lib/budget.ts BZZ).
//   mylevel koop 530 = propellerads-mcp lib/budget.ts WAARDE_VERKOOP MYLEVEL 5,3 (netto per verkoop, goedkoopste product).
//   kdp koop 300 = schatting royalty per boek; Clickmind ziet KDP-verkopen niet (de klik gaat door naar Amazon).
//   wam dialoog 5 = schatting (de CPA-doelen liggen op $0,01-0,05 per dialoog; WAM heeft nog geen verdienmodel).
//   tk-podcast aanmelding 25 = schatting (adres voor de volgende aflevering van Tania).
// Alles hier is een schatting tot Henkjan zijn eigen getal zet op /api/geld.

export const K_WAARDE = 'mm:waarde';
export const K_AUTO = 'mm:waarde:auto';
export const UITKOMSTEN = ['echt', 'actie', 'aanmelding', 'lezer', 'dialoog', 'koop'];
export const UITKOMST_NAAM = { echt: 'echt mens', actie: 'actie', aanmelding: 'aanmelding', lezer: 'lezer', dialoog: 'dialoog', koop: 'verkoop (marge)' };
export const PROJECTEN = ['kadoly', 'todayin', 'wam', 'kdp', 'mylevel', 'bzz', 'tk-podcast', 'overig'];
export const PROJECT_NAAM = { kadoly: 'Kadoly', todayin: 'todayin Curaçao', wam: 'WAM', kdp: 'KDP-boeken', mylevel: 'MyLevel', bzz: 'BZZ', 'tk-podcast': 'Tania Kross podcast', overig: 'overig' };
export const EUR_USD = 1.155; // schatting koers euro naar dollar (Kadoly rekent in euro); ook in te stellen op /api/geld

// dollarcent per uitkomst (mag een halve cent zijn)
export const STANDAARD = {
  kadoly: { echt: 0.2, actie: 1, aanmelding: 70, lezer: 0, dialoog: 2, koop: 770 },
  todayin: { echt: 0.1, actie: 0.5, aanmelding: 10, lezer: 20, dialoog: 0, koop: 0 },
  wam: { echt: 0.1, actie: 0.5, aanmelding: 25, lezer: 0, dialoog: 5, koop: 0 },
  kdp: { echt: 0.1, actie: 0.5, aanmelding: 0, lezer: 0, dialoog: 0, koop: 300 },
  mylevel: { echt: 0.1, actie: 0.5, aanmelding: 20, lezer: 0, dialoog: 0, koop: 530 },
  bzz: { echt: 0.1, actie: 0.5, aanmelding: 1, lezer: 0, dialoog: 0, koop: 0 },
  'tk-podcast': { echt: 0.1, actie: 0.5, aanmelding: 25, lezer: 0, dialoog: 0, koop: 0 },
  overig: { echt: 0.1, actie: 0.5, aanmelding: 10, lezer: 0, dialoog: 0, koop: 100 },
};

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };

// Campagnenaam (PropellerAds of Mondiad) naar project. Volgorde telt: KDP eerst (boeken), dan Kadoly (SHOP-LUS, ook de oude YOORS).
export function projectVan(naam) {
  const s = String(naam || '');
  if (/^KDP\b|\bKDP\b/i.test(s)) return 'kdp';
  if (/SHOP-LUS|^\[In-Page\] SHOP|\bYOORS\b|\bKADOLY\b/i.test(s)) return 'kadoly';
  if (/TODAYIN|\bCURACAO\b|FOR-YOU/i.test(s)) return 'todayin';
  if (/^WAM\b|\bWAM\b/i.test(s)) return 'wam';
  if (/MYLEVEL/i.test(s)) return 'mylevel';
  if (/^BZZ\b|\bBZZ\b/i.test(s)) return 'bzz';
  if (/PODCAST|KROSS|\bTK\b|tk-podcast/i.test(s)) return 'tk-podcast';
  return 'overig';
}

// Leest de munt: standaard plus wat Henkjan zelf zette. bron per cel: 'eigen' of 'schatting'.
export async function leesWaarde(kv) {
  let s = null; try { s = await kv.get(K_WAARDE); } catch (e) {}
  s = s && typeof s === 'object' ? s : {};
  const eigen = s.waarden && typeof s.waarden === 'object' ? s.waarden : {};
  let auto = null; try { auto = await kv.get(K_AUTO); } catch (e) {}
  const cent = {}, bron = {};
  for (const p of PROJECTEN) {
    cent[p] = {}; bron[p] = {};
    for (const u of UITKOMSTEN) {
      const e = eigen[p] && eigen[p][u];
      const a = auto && auto.cent && auto.cent[p] && auto.cent[p][u];
      if (e != null && Number.isFinite(Number(e))) { cent[p][u] = Number(e); bron[p][u] = 'eigen'; }
      else if (a != null && Number.isFinite(Number(a))) { cent[p][u] = Number(a); bron[p][u] = 'clickmind'; }
      else { cent[p][u] = STANDAARD[p][u]; bron[p][u] = 'schatting'; }
    }
  }
  const eurUsd = Number(s.eurUsd) > 0 ? Number(s.eurUsd) : EUR_USD;
  return { cent, bron, eurUsd, eurUsdBron: Number(s.eurUsd) > 0 ? 'eigen' : 'schatting', bijgewerkt: s.bijgewerkt || null };
}

// Zet de munt. obj = { waarden: { project: { uitkomst: dollars } }, eurUsd } (dollars, zoals op het scherm) of met
// { eenheid: 'cent' } in cent. Alleen geldige projecten, uitkomsten en bedragen van 0 tot $10.000; de rest wordt geweigerd.
// Een cel wordt pas 'eigen' als hij afwijkt van wat er nu geldt, of al eigen was (zo blijft een onaangeroerde schatting een schatting).
export async function zetWaarde(kv, obj) {
  if (!obj || typeof obj !== 'object') return { ok: false, fout: 'geen gegevens' };
  const inCent = obj.eenheid === 'cent';
  const nu = await leesWaarde(kv);
  let oud = null; try { oud = await kv.get(K_WAARDE); } catch (e) {}
  const waarden = oud && oud.waarden && typeof oud.waarden === 'object' ? JSON.parse(JSON.stringify(oud.waarden)) : {};
  const fouten = []; let gewijzigd = 0;
  const w = obj.waarden && typeof obj.waarden === 'object' ? obj.waarden : {};
  for (const [p, rij] of Object.entries(w)) {
    if (!PROJECTEN.includes(p)) { fouten.push('onbekend project ' + String(p).slice(0, 30)); continue; }
    if (!rij || typeof rij !== 'object') continue;
    for (const [u, v] of Object.entries(rij)) {
      if (!UITKOMSTEN.includes(u)) { fouten.push('onbekende uitkomst ' + String(u).slice(0, 30)); continue; }
      if (v === '' || v == null) continue;
      const getal = Number(String(v).trim().replace(/^\$/, '').replace(',', '.'));
      if (!Number.isFinite(getal) || getal < 0 || getal > (inCent ? 1e6 : 1e4)) { fouten.push(p + ' ' + u + ': ' + String(v).slice(0, 20) + ' is geen bedrag tussen 0 en 10.000 dollar'); continue; }
      const c = Math.round((inCent ? getal : getal * 100) * 100) / 100; // cent, tot op een honderdste cent
      const was = nu.cent[p][u];
      if (nu.bron[p][u] === 'eigen' || Math.abs(c - was) > 1e-9) { if (!waarden[p]) waarden[p] = {}; if (waarden[p][u] !== c) gewijzigd++; waarden[p][u] = c; }
    }
  }
  let eurUsd = oud && Number(oud.eurUsd) > 0 ? Number(oud.eurUsd) : null;
  if (obj.eurUsd != null && obj.eurUsd !== '') {
    const k = Number(String(obj.eurUsd).replace(',', '.'));
    if (!Number.isFinite(k) || k < 0.5 || k > 2) fouten.push('koers euro naar dollar moet tussen 0,5 en 2 liggen');
    else if (Math.abs(k - nu.eurUsd) > 1e-9 || nu.eurUsdBron === 'eigen') { if (eurUsd !== k) gewijzigd++; eurUsd = k; }
  }
  if (fouten.length) return { ok: false, fout: fouten.slice(0, 10).join('; ') };
  const nieuw = { waarden, bijgewerkt: new Date().toISOString() }; if (eurUsd) nieuw.eurUsd = eurUsd;
  await kv.set(K_WAARDE, nieuw);
  return { ok: true, gewijzigd, munt: await leesWaarde(kv) };
}

// Wat een set uitkomsten waard is voor een project, in dollar (met de uitsplitsing per uitkomst)
export function waardeVan(munt, project, tellers) {
  const p = PROJECTEN.includes(project) ? project : 'overig';
  let tot = 0; const per = {};
  for (const u of UITKOMSTEN) { const n = N(tellers && tellers[u]); if (!n) continue; const d = n * N(munt.cent[p][u]) / 100; per[u] = { n, dollar: d }; tot += d; }
  return { dollar: tot, per };
}

// Clickmind rekent de munt zelf (Henkjan 13 nov 2026: "Waarom doe jij dit niet"): een voorloper (echt, actie, aanmelding, dialoog)
// is waard wat hij aan geld oplevert = kans dat hij uitloopt op een verkoop x de marge per verkoop. Gemeten over de laatste 7 dagen
// per project (uit de geldstand van /api/geld, mm:geld:stand). Alleen bij minstens 2 verkopen; met een zachte ondergrens (prior):
// (verkopen + 1) / (voorlopers + 1/basiskans) zodat 2 toevallige verkopen niets opblazen; nooit meer dan de helft van een verkoop.
// Projecten zonder verkoop (todayin, WAM, BZZ) houden hun doelwaarde: hun noordster is het adres, de lezer of de dialoog zelf.
// Henkjans eigen getal gaat altijd voor. Draait elk uur in de leerronde.
export async function ijkWaarde(kv) {
  let st = null; try { st = await kv.get('mm:geld:stand'); } catch (e) {}
  if (!st || !st.projecten) return { ok: false, fout: 'geen geldstand (open /api/geld een keer)' };
  const munt = await leesWaarde(kv), uit = { at: new Date().toISOString(), cent: {}, basis: {} };
  for (const p of PROJECTEN) {
    const w = st.projecten[p] && st.projecten[p].week && st.projecten[p].week.uitkomsten; if (!w) continue;
    const koop = N(w.koop), vk = munt.bron[p].koop === 'eigen' ? munt.cent[p].koop : STANDAARD[p].koop;
    if (koop < 2 || !(vk > 0)) continue;
    uit.cent[p] = {}; uit.basis[p] = { verkopen: koop, margeCent: vk };
    for (const u of ['echt', 'actie', 'aanmelding', 'dialoog']) {
      const n = N(w[u]); if (n < 20) continue;
      const basis = STANDAARD[p][u] > 0 ? Math.min(0.5, STANDAARD[p][u] / vk) : 0.001; // prior uit de standaard
      const kans = (koop + 1) / (n + 1 / basis);
      uit.cent[p][u] = Math.round(Math.min(vk / 2, kans * vk) * 100) / 100;
      uit.basis[p][u] = { n, kans: Math.round(kans * 1e5) / 1e5 };
    }
  }
  await kv.set(K_AUTO, uit, { ex: 3 * 86400 });
  return { ok: true, ...uit };
}
