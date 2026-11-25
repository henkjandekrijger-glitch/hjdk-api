// Geld op het dashboard (Henkjan 25 nov 2026: "zet kosten op een rij per dag van alles wat we gebruiken per project erbij en geconsolideerd
// EN opbrengsten apart en geconsolideerd. En opvallende zaken meteen daar laten zien. Zodat ik met een klik zelf kan ingrijpen.").
// Eén kasboek voor alle projecten: per dag, per project, per post een bedrag aan kosten of opbrengst (kv-hash mm:dash:geld,
// veld <dag>|<project>|<k of o>|<munt>|<post>). Wie het vult:
//   - advertentiekosten van de campagneprojecten: vanzelf, elke keer dat het dashboard geladen wordt, uit de uurwacht (mm:wachtuur:laatst, UTC-dag);
//   - vaste kosten (Henkjan 25 nov: "Nexy moet erbij breng alle kosten daarvan in kaart ook AWS verdelen we onder kadoly en Nexy 30/70"): een project heeft een lijst
//     vast [{post, perMaand, munt, bron}]; het kasboek rekent die per dag mee (perMaand maal 12 gedeeld door 365), zonder dat iemand elke dag boekt. Zetten met
//     dashboard?zet={"project":"nexyplatform","vast":[{"post":"AWS (70%)","perMaand":1360.53,"bron":"factuur oktober 2026"}]} (vervangt de lijst).
//   - al het andere: de chat of ronde die het getal ziet, met dashboard?zet={"project":"kdp","geld":{"dag":"2026-11-24","opbrengst":{"royalty":61.95},"kosten":{"Amazon Ads":18.23}}}
//     (munt standaard USD, anders "munt":"EUR"; een bedrag vervangt het vorige voor die dag en post, 0 haalt de regel weg).
// Het dashboard telt per dag en per project op, kosten en opbrengst apart en samen, en zet wat opvalt bovenaan met een knop om in te grijpen.
const GELD = 'mm:dash:geld';
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const rond = n => Math.round(n * 100) / 100;
const dagUtc = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const schoon = (s, n) => String(s == null ? '' : s).replace(/[|\n\r]/g, ' ').trim().slice(0, n);
// project in de uurwacht -> project op het dashboard
const UURWACHT = { shop: 'shop', todayin: 'curacao', mylevel: 'mylevel', wam: 'wam', spel: 'campagnes', overig: 'campagnes' };

export async function zetGeld(kv, project, g) {
  if (!g || typeof g !== 'object') return { ok: false, fout: 'geld: {"dag":"JJJJ-MM-DD","kosten":{"post":bedrag},"opbrengst":{"post":bedrag}}' };
  const dag = /^\d{4}-\d{2}-\d{2}$/.test(String(g.dag || '')) ? String(g.dag) : dagUtc(); const munt = /^[A-Z]{3}$/.test(String(g.munt || '')) ? String(g.munt) : 'USD';
  let n = 0;
  for (const [soort, k] of [['kosten', 'k'], ['opbrengst', 'o']]) {
    const o = g[soort]; if (!o || typeof o !== 'object') continue;
    for (const post of Object.keys(o).slice(0, 20)) {
      const b = Number(o[post]); const naam = schoon(post, 60); if (!naam || !Number.isFinite(b) || b < 0) return { ok: false, fout: soort + ' "' + post + '": bedrag moet een getal van 0 of meer zijn' };
      const veld = [dag, project, k, munt, naam].join('|');
      if (b === 0) await kv.raw(['HDEL', GELD, veld]); else await kv.raw(['HSET', GELD, veld, String(rond(b))]); n++;
    }
  }
  return n ? { ok: true, regels: n, dag } : { ok: false, fout: 'geen kosten of opbrengst meegegeven' };
}

// advertentiekosten van vandaag uit de uurwacht in het kasboek zetten (zelfde veld, dus altijd het laatste getal van de dag)
async function uitUurwacht(kv, uur, projecten) {
  const P = (uur && uur.eigen && uur.eigen.projecten) || {}; const per = {}, uitk = {};
  for (const k of Object.keys(P)) if (!k.includes('|')) { const id = UURWACHT[k] || 'campagnes'; per[id] = (per[id] || 0) + N(P[k].kosten); uitk[id] = (uitk[id] || 0) + N(P[k].aanmelding); }
  const dag = dagUtc();
  for (const id of Object.keys(per)) if (per[id] > 0) await kv.raw(['HSET', GELD, [dag, id, 'k', 'USD', 'advertenties (uurwacht)'].join('|'), String(rond(per[id]))]).catch(() => null);
  // geschatte waarde: aanmeldingen van vandaag maal de waarde per uitkomst die het project zelf schatte (soort w, nooit bij de opbrengst geteld)
  try { const h = (await kv.raw(['HKEYS', GELD])) || []; const oud = h.filter(f => String(f).startsWith(dag + '|') && String(f).split('|')[2] === 'w' && String(f).endsWith('(uurwacht)')); if (oud.length) await kv.raw(['HDEL', GELD, ...oud]); } catch (e) {}
  for (const p of projecten || []) if (p.waarde && p.waarde.bedrag > 0 && uitk[p.id] > 0) await kv.raw(['HSET', GELD, [dag, p.id, 'w', 'USD', uitk[p.id] + ' x ' + schoon(p.waarde.per, 30) + ' (uurwacht)'].join('|'), String(rond(uitk[p.id] * p.waarde.bedrag))]).catch(() => null);
}

export async function geldData(kv, uur, projecten, dagen = 7) {
  await uitUurwacht(kv, uur, projecten).catch(() => null);
  let h = []; try { h = (await kv.raw(['HGETALL', GELD])) || []; } catch (e) {}
  if (h && !Array.isArray(h)) h = Object.entries(h).flat();
  const vanaf = dagUtc(-(dagen - 1)), oud = dagUtc(-90), weg = [];
  const regels = [];
  for (let i = 0; i + 1 < h.length; i += 2) { const [dag, project, soort, munt, ...rest] = String(h[i]).split('|'); if (dag < oud) { weg.push(h[i]); continue; } if (dag >= vanaf) regels.push({ dag, project, soort, munt, post: rest.join('|'), bedrag: N(h[i + 1]) }); }
  if (weg.length) kv.raw(['HDEL', GELD, ...weg.slice(0, 200)]).catch(() => null);
  // vaste kosten per dag erbij (niet opgeslagen, elke keer uitgerekend)
  for (const p of projecten) for (const v of p.vast || []) { const perDag = rond(N(v.perMaand) * 12 / 365); if (perDag > 0) for (let i = 0; i < dagen; i++) regels.push({ dag: dagUtc(-i), project: p.id, soort: 'k', munt: v.munt || 'USD', post: v.post + ' (vast, per dag)', bedrag: perDag }); }
  const naam = id => { const p = projecten.find(x => x.id === id); return p ? p.naam : id; };
  const actief = new Set(projecten.map(p => p.id));
  const tel = (lijst, sleutel) => { const o = {}; for (const r of lijst) { const k = sleutel(r); const x = o[k] || (o[k] = { kosten: 0, opbrengst: 0, waarde: 0 }); if (r.soort === 'k') x.kosten += r.bedrag; else if (r.soort === 'w') x.waarde += r.bedrag; else x.opbrengst += r.bedrag; } for (const k of Object.keys(o)) { o[k].kosten = rond(o[k].kosten); o[k].opbrengst = rond(o[k].opbrengst); o[k].waarde = rond(o[k].waarde); o[k].saldo = rond(o[k].opbrengst - o[k].kosten); } return o; };
  const munten = [...new Set(regels.map(r => r.munt))].sort((a, b) => (a === 'USD' ? -1 : b === 'USD' ? 1 : a.localeCompare(b)));
  const perMunt = munten.map(munt => {
    const R = regels.filter(r => r.munt === munt && actief.has(r.project));
    const perDag = tel(R, r => r.dag), perProject = tel(R, r => r.project), totaal = tel(R, () => 't').t || { kosten: 0, opbrengst: 0, saldo: 0 };
    const dagenLijst = []; for (let i = 0; i < dagen; i++) { const d = dagUtc(-i); dagenLijst.push(Object.assign({ dag: d }, perDag[d] || { kosten: 0, opbrengst: 0, saldo: 0 })); }
    const proj = Object.keys(perProject).map(id => { const posten = {}; for (const r of R.filter(x => x.project === id)) { const k = (r.soort === 'k' ? 'kosten: ' : r.soort === 'w' ? 'geschat: ' : 'opbrengst: ') + r.post; posten[k] = rond((posten[k] || 0) + r.bedrag); } return Object.assign({ id, naam: naam(id), posten, vandaag: (tel(R.filter(x => x.project === id && x.dag === dagUtc()), () => 't').t || { kosten: 0 }).kosten }, perProject[id]); }).sort((a, b) => b.kosten + b.opbrengst - a.kosten - a.opbrengst);
    return { munt, dagen: dagenLijst, projecten: proj, totaal };
  });
  return { dagen, perMunt, leeg: !regels.length };
}
export function schoonVast(l) {
  if (!Array.isArray(l)) return null;
  return l.filter(x => x && x.post && Number(x.perMaand) > 0).slice(0, 30).map(x => ({ post: schoon(x.post, 60), perMaand: rond(Number(x.perMaand)), munt: /^[A-Z]{3}$/.test(String(x.munt || '')) ? String(x.munt) : 'USD', bron: schoon(x.bron, 160) }));
}

// Wat opvalt, met wat Claude er meteen aan moet doen als Henkjan op de knop tikt.
export function opvallend(d, geld) {
  const uit = []; const teken = m => (m === 'USD' ? '$' : m === 'EUR' ? '€' : m + ' '); const f = n => rond(n).toFixed(2).replace('.', ',');
  for (const m of geld.perMunt) for (const p of m.projecten) {
    const t = teken(m.munt);
    if (p.kosten >= 5 && p.opbrengst === 0 && p.waarde >= p.kosten) { /* geen omzet, maar de geschatte waarde dekt de kosten */ }
    else if (p.kosten >= 5 && p.opbrengst === 0 && p.waarde > 0) uit.push({ id: p.id, naam: p.naam, zwaar: p.kosten - p.waarde, tekst: t + f(p.kosten) + ' kosten in ' + geld.dagen + ' dagen tegen ' + t + f(p.waarde) + ' geschatte waarde en geen omzet.', opdracht: 'Dit project kostte ' + t + f(p.kosten) + ' in ' + geld.dagen + ' dagen; de geschatte waarde van wat het opleverde is ' + t + f(p.waarde) + ' en er is geen omzet. Zeg me in 4 regels wat je adviseert: goedkoper inkopen, de uitkomst meer waard maken of stoppen. Stoppen of budget wijzigen pas op mijn ja.' });
    else if (p.kosten >= 5 && p.opbrengst === 0) uit.push({ id: p.id, naam: p.naam, zwaar: p.kosten, tekst: t + f(p.kosten) + ' kosten in ' + geld.dagen + ' dagen en geen opbrengst geboekt.', opdracht: 'Dit project kostte ' + t + f(p.kosten) + ' in ' + geld.dagen + ' dagen en er staat geen opbrengst tegenover. Zoek uit of de opbrengst niet geboekt is of er niet is; levert het project lezers of aanmeldingen op, schat dan de waarde per uitkomst en zet die op het dashboard. Zeg me in 4 regels wat je adviseert: doorgaan, bijsturen of stoppen. Stoppen of budget wijzigen doe je pas op mijn ja.' });
    else if (p.kosten >= 5 && p.opbrengst < p.kosten) uit.push({ id: p.id, naam: p.naam, zwaar: p.kosten - p.opbrengst, tekst: 'Kost meer dan het oplevert: ' + t + f(p.kosten) + ' tegen ' + t + f(p.opbrengst) + ' in ' + geld.dagen + ' dagen.', opdracht: 'Dit project kostte ' + t + f(p.kosten) + ' en bracht ' + t + f(p.opbrengst) + ' op in ' + geld.dagen + ' dagen. Zoek de post die het meeste weglekt en zeg me in 4 regels wat je adviseert. Stoppen of budget wijzigen pas op mijn ja.' });
    const rest = (p.kosten - p.vandaag) / Math.max(1, geld.dagen - 1);
    if (p.vandaag >= 3 && rest > 0 && p.vandaag > 2 * rest) uit.push({ id: p.id, naam: p.naam, zwaar: p.vandaag, tekst: 'Vandaag ' + t + f(p.vandaag) + ' kosten, meer dan twee keer het gemiddelde van ' + t + f(rond(rest)) + ' per dag.', opdracht: 'De kosten van vandaag (' + t + f(p.vandaag) + ') zijn meer dan twee keer het gemiddelde (' + t + f(rond(rest)) + ' per dag). Zoek de oorzaak en zeg wat je eraan doet. Stoppen of budget wijzigen pas op mijn ja.' });
  }
  for (const p of d.projecten) {
    if (p.telaat) uit.push({ id: p.id, naam: p.naam, zwaar: 2 + p.telaat, tekst: p.telaat + (p.telaat === 1 ? ' planregel is' : ' planregels zijn') + ' te laat: ' + p.open.filter(r => r.d && r.d < d.vandaag).map(r => r.t).slice(0, 2).join(' | '), opdracht: 'Er ' + (p.telaat === 1 ? 'is een planregel' : 'zijn planregels') + ' te laat. Doe de bovenste nu, of zeg waarom hij niet meer hoeft en haal hem dan weg.' });
    if (p.doel && p.doelgetal && p.nu == null) uit.push({ id: p.id, naam: p.naam, zwaar: 1, tekst: 'Er is een doel maar geen meting.', opdracht: 'Dit project heeft een doel maar geen meting. Bouw de meting zo dat hij vanzelf loopt en zet het getal van nu op het dashboard.' });
  }
  return uit.sort((a, b) => b.zwaar - a.zwaar).slice(0, 12);
}
