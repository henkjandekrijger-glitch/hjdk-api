// Kosten per uitkomst per plek, voor ELKE campagne (Henkjan 28 nov 2026: "Zorg dat clikmind dit doet schandalig dat het nog niet gebeurd",
// na TK: 11 plekken namen 64% van het geld zonder één adres, en Kadoly: ruim 900 plekken kostten 52% zonder adres, in losse centen per dag).
// De oude regels rekenden in vaste dollars per plek per dag ($0,10 zonder adres) en in klikaantallen (300 kliks): bij campagnes van een
// paar dimes per dag haalde geen plek die grens ooit. Deze regel rekent relatief, over 3 dagen samen, per campagne:
//   doel  = het doel per uitkomst van de campagne als een chat het zette (mm:instelling.doelPerAdres), anders wat een uitkomst op de
//           plekken mét uitkomst van die campagne kostte (kosten van die plekken / hun uitkomsten), nooit lager dan PK.vloer;
//   een plek zonder uitkomst gaat eruit zodra hij in 3 dagen het doel heeft gekost, of 40% van het doel met een klikprijs van 2x het
//   midden van de campagne of meer. Kostte hij 2x het doel, dan is het sterk bewijs (ook de grootste bron van een campagne).
// Uitkomst = conversie bij het netwerk (het CPA-doel van de campagne) of een aanmelding, koop of lezer bij Clickmind op die plek.
// Een campagne zonder één uitkomst in 3 dagen krijgt geen plekoordeel (er is niets om tegen te meten): die valt onder het campagne-oordeel.
export const PK = { dagen: 3, vloer: 0.01, duurDeel: 0.4, duurFactor: 2, sterkFactor: 2 };
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const r3 = x => Math.round(N(x) * 1000) / 1000;

// rijen: [{camp, zone, kliks, kosten, conv}] over de periode; beschermd: Set van zones met een uitkomst bij Clickmind of op Henkjans woord;
// live: Set van campagnes die vandaag geld uitgaven (alleen daar heeft blokkeren zin), of null voor alle
export function plekOordeel(rijen, { doelGezet = {}, beschermd = new Set(), live = null, namen = {} } = {}) {
  const C = {};
  for (const r of rijen || []) {
    const c = String(r.camp || ''), z = String(r.zone || ''); if (!c || !z) continue;
    (C[c] || (C[c] = [])).push({ zone: z, kliks: N(r.kliks), kosten: N(r.kosten), conv: N(r.conv) });
  }
  const campagnes = [], blok = [];
  for (const [camp, zs] of Object.entries(C)) {
    if (live && !live.has(camp)) continue;
    const kosten = zs.reduce((s, z) => s + z.kosten, 0); if (!(kosten > 0)) continue;
    const goed = zs.filter(z => z.conv > 0 || beschermd.has(z.zone)), conv = zs.reduce((s, z) => s + z.conv, 0);
    const kostGoed = zs.filter(z => z.conv > 0).reduce((s, z) => s + z.kosten, 0);
    const auto = conv > 0 ? Math.max(PK.vloer, kostGoed / conv) : null, gezet = N(doelGezet[camp]) > 0 ? N(doelGezet[camp]) : null;
    const doel = gezet || auto, bron = gezet ? 'doel gezet' : auto ? 'wat een uitkomst op de goede plekken kost' : null;
    const zonder = zs.filter(z => !(z.conv > 0) && !beschermd.has(z.zone)), verspild = zonder.reduce((s, z) => s + z.kosten, 0);
    const c = { camp, naam: namen[camp] || '', kosten: r3(kosten), uitkomsten: conv, plekkenMetUitkomst: goed.length, doel: doel ? r3(doel) : null, bron,
      perUitkomst: conv ? r3(kosten / conv) : null, perUitkomstGoed: conv ? r3(kostGoed / conv) : null, verspild: r3(verspild), pctVerspild: Math.round(100 * verspild / kosten), blok: 0, blokKosten: 0 };
    campagnes.push(c);
    if (!doel) { c.reden = 'nog geen uitkomst in ' + PK.dagen + ' dagen: valt onder het campagne-oordeel'; continue; }
    const cpcs = zs.filter(z => z.kliks > 0 && z.kosten > 0).map(z => z.kosten / z.kliks).sort((a, b) => a - b), mid = cpcs.length ? cpcs[Math.floor(cpcs.length / 2)] : 0;
    for (const z of zonder) {
      const cpc = z.kosten / Math.max(1, z.kliks);
      let waarom = null;
      if (z.kosten >= doel) waarom = `$${z.kosten.toFixed(3)} in ${PK.dagen} dagen in campagne ${camp} zonder uitkomst (een uitkomst kost hier $${doel.toFixed(3)}, ${bron})`;
      else if (z.kosten >= PK.duurDeel * doel && mid && cpc >= PK.duurFactor * mid) waarom = `dure kliks: $${cpc.toFixed(4)} per klik (${(cpc / mid).toFixed(1)}x het midden), $${z.kosten.toFixed(3)} in ${PK.dagen} dagen zonder uitkomst (doel $${doel.toFixed(3)})`;
      if (!waarom) continue;
      blok.push({ camp, zone: z.zone, kliks: z.kliks, kosten: r3(z.kosten), doel: r3(doel), waarom, sterk: z.kosten >= PK.sterkFactor * doel });
      c.blok++; c.blokKosten = r3(c.blokKosten + z.kosten);
    }
  }
  blok.sort((a, b) => b.kosten - a.kosten);
  campagnes.sort((a, b) => b.verspild - a.verspild);
  return { campagnes, blok };
}

export function plekTekst(o, n = 8) {
  if (!o || !o.campagnes || !o.campagnes.length) return [];
  const r = ['Kosten per uitkomst per plek (' + PK.dagen + ' dagen, per campagne; plekken zonder uitkomst die het doel kostten gaan eruit):'];
  for (const c of o.campagnes.slice(0, n)) r.push('- ' + (c.naam ? c.naam.slice(0, 50) : c.camp) + ': $' + c.kosten + ', ' + c.uitkomsten + ' uitkomsten' + (c.perUitkomst != null ? ' ($' + c.perUitkomst + ' per uitkomst, op de goede plekken $' + c.perUitkomstGoed + ')' : '') + ', ' + c.pctVerspild + '% op plekken zonder uitkomst' + (c.blok ? '; ' + c.blok + ' plekken eruit ($' + c.blokKosten + ')' : '') + (c.reden ? '; ' + c.reden : ''));
  return r;
}
