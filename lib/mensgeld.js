// Mensgeld (Henkjan 17 okt: "ga weer verder denken wat we uit een klik nog meer kunnen halen, zeker als het een mens is").
// Een advertentienetwerk rekent per klik af, maar voor Amazon telt per mens maar één cookie van 24 uur: een tweede klik van dezelfde
// persoon die dag levert weinig extra op. Daarom hier per dag (UTC) niet per klik maar per uniek mens:
//   - per netwerk en land: betaalde /go-kliks, unieke personen (eigen cookie mmp, HyperLogLog mm:armp), snelle herhaalkliks (10 min),
//     kosten, kosten per uniek mens en het geld dat ging naar kliks van mensen die we die dag al hadden ("dubbel betaald");
//   - per Amazon-tag: unieke personen naast wat Associates telt (artikelen, omzet, verdiend): verdiend per 100 mensen en per dollar;
//   - termoverlap (mm:kwp, bijgehouden in /go, lib/mensmeter.js): welke zoektermen dezelfde mensen aanklikken. Veel overlap = een
//     nieuwe campagne op die term bereikt dezelfde mensen opnieuw (les bl-bku-20 15 okt); weinig overlap = een nieuwe kopersgroep.
// Alleen meten en adviseren: nooit stoppen, nooit bod, budget, frequentie of targeting wijzigen.
// Let op: de Amazon-dag loopt in Amerikaanse tijd (US) en de kliks in UTC; per tag dus een richtgetal, geen boekhouding.
import { paPerCampagne, mdPerCampagne } from './wachtuur.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const r2 = x => Math.round(N(x) * 100) / 100;
const r4 = x => Math.round(N(x) * 10000) / 10000;
const pct = (a, b) => (b ? Math.round(1000 * a / b) / 10 : null);
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };
const COMMISSIE = { '-20': 0.03, '-21': 0.045 }; // zelfde schatting als lib/amzmeter.js, alleen als Associates geen verdiensten gaf
const dagStr = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);

// unieke personen over meerdere HyperLogLogs (vereniging). Lukt de meervoudige PFCOUNT niet, dan PFMERGE in een tijdelijke sleutel.
async function uniek(kv, keys) {
  if (!keys.length) return { n: 0, uniek: true };
  try { return { n: N(await kv.raw(['PFCOUNT', ...keys])), uniek: true }; } catch (e) {}
  try { const tmp = 'mm:tmp:pf:' + Math.random().toString(36).slice(2); await kv.raw(['PFMERGE', tmp, ...keys]); const n = N(await kv.raw(['PFCOUNT', tmp])); await kv.raw(['DEL', tmp]).catch(() => {}); return { n, uniek: true }; } catch (e) {}
  let s = 0; for (const k of keys) s += N(await kv.raw(['PFCOUNT', k]).catch(() => 0)); return { n: s, uniek: false };
}

export async function mensgeld(kv, { dag, pa: paIn, mo: moIn } = {}) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(dag || '')) ? dag : dagStr();
  const [armH, amzH, pa, mo] = await Promise.all([
    kv.raw(['HGETALL', 'mm:arm:' + d]).catch(() => null), kv.raw(['HGETALL', 'mm:amz:' + d]).catch(() => null),
    paIn || paPerCampagne(d), moIn || mdPerCampagne(d)
  ]);
  // per net|camp|arm: tellers, tag en land
  const C = {};
  for (const [f, v] of paren(armH)) {
    const p = f.split('|'); if (p.length < 5) continue; const [net, camp, arm, tag] = p, veld = p.slice(4).join('|');
    if (net === 'test' || net === 'onbekend') continue;
    const k = net + '|' + camp + '|' + arm, x = C[k] || (C[k] = { net, camp, arm, tag, n: 0, rep: 0, landen: {} });
    if (veld === 'n') x.n += N(v); else if (veld === 'rep') x.rep += N(v); else if (veld.startsWith('land_')) x.landen[veld.slice(5)] = N(x.landen[veld.slice(5)]) + N(v);
  }
  const kost = {}; for (const r of pa.rijen || []) kost['propeller|' + r.camp] = { kliks: N(r.kliks), kosten: N(r.kosten) }; for (const r of mo.rijen || []) kost['mondiad|' + r.camp] = { kliks: N(r.kliks), kosten: N(r.kosten) };
  // kliks per campagne over alle varianten (voor het verdelen van de campagnekosten over js en 302)
  const perCamp = {}; for (const x of Object.values(C)) perCamp[x.net + '|' + x.camp] = N(perCamp[x.net + '|' + x.camp]) + x.n;
  const groep = {}, tagG = {};
  for (const [k, x] of Object.entries(C)) {
    const land = Object.entries(x.landen).sort((a, b) => b[1] - a[1])[0]; const l = land ? land[0] : '?';
    const kc = kost[x.net + '|' + x.camp]; const kosten = kc && perCamp[x.net + '|' + x.camp] ? kc.kosten * x.n / perCamp[x.net + '|' + x.camp] : 0;
    const hk = 'mm:armp:' + d + ':' + k;
    for (const [sl, doel] of [[x.net + '|' + l, groep], [x.tag || '-', tagG]]) {
      const g = doel[sl] || (doel[sl] = { kliks: 0, rep: 0, kosten: 0, campagnes: new Set(), hll: [], metKosten: 0 });
      g.kliks += x.n; g.rep += x.rep; g.kosten += kosten; g.campagnes.add(x.net + '|' + x.camp); g.hll.push(hk); if (kc) g.metKosten += x.n;
      if (doel === tagG) { g.netten = g.netten || new Set(); g.netten.add(x.net); g.land = g.land || l; }
    }
  }
  const amz = {}; for (const [tag, v] of paren(amzH)) { try { amz[tag] = typeof v === 'string' ? JSON.parse(v) : v; } catch (e) {} }
  const maak = async (sl, g) => {
    const u = await uniek(kv, g.hll); const pers = u.n;
    const o = { kliks: g.kliks, personen: pers, kliksPerMens: pers ? Math.round(100 * g.kliks / pers) / 100 : null, herhaal10min: g.rep, herhaalPct: pct(g.rep, g.kliks), campagnes: g.campagnes.size,
      kosten: r2(g.kosten), kostenGedekt: pct(g.metKosten, g.kliks), kostenPerMens: pers ? r4(g.kosten / pers) : null,
      dubbelPct: pers && g.kliks > pers ? pct(g.kliks - pers, g.kliks) : 0, dubbelGeld: pers && g.kliks > pers ? r2(g.kosten * (g.kliks - pers) / g.kliks) : 0, vereniging: u.uniek };
    return [sl, o];
  };
  const netLand = Object.fromEntries(await Promise.all(Object.entries(groep).map(([sl, g]) => maak(sl, g))));
  const tags = [];
  for (const [tag, g] of Object.entries(tagG)) {
    if (tag === '-' || g.kliks < 50) continue; const [, o] = await maak(tag, g); const a = amz[tag] || null;
    if (a) { const tarief = COMMISSIE[tag.slice(-3)] || 0.03; const verdiend = N(a.verdiend) || N(a.omzet) * tarief; o.amazon = { kliks: N(a.kliks), artikelen: N(a.artikelen), omzet: r2(a.omzet), verdiend: r2(verdiend), verdiendGeschat: !N(a.verdiend) };
      o.artikelenPer100Mensen = o.personen ? Math.round(1000 * N(a.artikelen) / o.personen) / 10 : null; o.verdiendPerMens = o.personen ? r4(verdiend / o.personen) : null; o.winst = r2(verdiend - o.kosten); o.terugPerDollar = o.kosten ? Math.round(100 * verdiend / o.kosten) / 100 : null; }
    tags.push(Object.assign({ tag, netwerken: [...(g.netten || [])], land: g.land }, o));
  }
  tags.sort((a, b) => b.kosten - a.kosten);
  const tot = Object.values(netLand).reduce((s, x) => ({ kliks: s.kliks + x.kliks, kosten: s.kosten + x.kosten, dubbelGeld: s.dubbelGeld + x.dubbelGeld, rep: s.rep + x.herhaal10min }), { kliks: 0, kosten: 0, dubbelGeld: 0, rep: 0 });
  const zinnen = [];
  for (const [sl, x] of Object.entries(netLand).sort((a, b) => b[1].dubbelGeld - a[1].dubbelGeld)) {
    if (x.kliks < 300 || !x.dubbelGeld) continue; const [net, land] = sl.split('|');
    zinnen.push(net + ' ' + land.toUpperCase() + ': ' + x.kliks + ' kliks van ' + x.personen + ' mensen (' + x.kliksPerMens + ' per mens), ' + x.herhaalPct + '% binnen 10 minuten opnieuw. $' + x.dubbelGeld + ' van $' + x.kosten + ' ging naar mensen die we die dag al hadden; $' + x.kostenPerMens + ' per uniek mens.');
  }
  return { ok: true, dag: d, bijgewerkt: new Date().toISOString(), uitleg: 'Per uniek mens in plaats van per klik (Amazon: één cookie van 24 uur per mens). Kosten per campagne naar rato van de /go-kliks over de varianten; Amazon-dag in Amerikaanse tijd, kliks in UTC: per tag een richtgetal.',
    totaal: { kliks: tot.kliks, kosten: r2(tot.kosten), dubbelGeld: r2(tot.dubbelGeld), herhaal10min: tot.rep }, zinnen, netLand, tags: tags.slice(0, 40), kostenFout: { propeller: pa.fout || null, mondiad: mo.fout || null } };
}

// ---- termoverlap: welke zoektermen klikken dezelfde mensen aan? ----
export async function termOverlap(kv, { dagen = 3, min = 5 } = {}) {
  dagen = Math.max(1, Math.min(14, Math.round(N(dagen)) || 3));
  const D = Array.from({ length: dagen }, (_, i) => dagStr(-i));
  const hs = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:kwp:' + d]).catch(() => null)));
  const pers = {}, paar = {};
  for (const h of hs) for (const [f, v] of paren(h)) { if (f[0] === '#') pers[f.slice(1)] = N(pers[f.slice(1)]) + N(v); else { const i = f.indexOf('>'); if (i < 1) continue; const a = f.slice(0, i), b = f.slice(i + 1), key = a < b ? a + '>' + b : b + '>' + a; paar[key] = N(paar[key]) + N(v); } }
  const totaal = Object.values(pers).reduce((s, x) => s + x, 0);
  const paren2 = [];
  for (const [key, n] of Object.entries(paar)) {
    if (n < min) continue; const [a, b] = key.split('>'); const na = N(pers[a]), nb = N(pers[b]); if (!na || !nb) continue;
    const overlap = n / Math.min(na, nb); // deel van de kleinste groep dat ook de andere term aanklikte
    paren2.push({ a, b, samen: n, mensenA: na, mensenB: nb, overlapPct: pct(n, Math.min(na, nb)), lift: totaal ? Math.round(100 * n * totaal / (na * nb)) / 100 : null,
      zin: '"' + a + '" en "' + b + '": ' + n + ' mensen klikten beide (' + Math.round(overlap * 100) + '% van de kleinste groep).' });
  }
  paren2.sort((x, y) => y.samen - x.samen);
  // per term: hoeveel van zijn mensen klikten ook op een andere term van ons (hoge waarde = vooral dezelfde mensen)
  const deel = {}; for (const p of paren2) { deel[p.a] = N(deel[p.a]) + p.samen; deel[p.b] = N(deel[p.b]) + p.samen; }
  const termen = Object.entries(pers).filter(([, n]) => n >= 30).map(([kw, n]) => ({ term: kw, mensen: n, ookAndereTerm: N(deel[kw]), gedeeldPct: pct(Math.min(N(deel[kw]), n), n) })).sort((a, b) => b.mensen - a.mensen);
  return { ok: true, dagen: D, start: await kv.get('mm:kwp:start').catch(() => null), uitleg: 'Per zoekterm de mensen die hem voor het eerst die dag aanklikten, en per paar hoeveel mensen binnen 24 uur beide termen aanklikten. Veel overlap: een kopie of nieuwe term op die zones bereikt dezelfde mensen opnieuw. Weinig overlap: een eigen kopersgroep.', mensen: totaal, paren: paren2.slice(0, 40), termen: termen.slice(0, 60) };
}
