// Venster 0x0 per zone (Henkjan 14 okt: "check wat je nog beter kunt doen"). Alleen meten.
// Een browser die outerWidth en outerHeight 0 meldt, heeft geen echt venster: vaak een verborgen of voorgeladen tabblad
// (bot of pop-under), maar Android Chrome meldt het ook bij een net geopend tabblad. Daarom eerst bewijs per zone:
// hoe vaak komt 0x0 voor, op mobiel en desktop, en hoe vaak is zo'n bezoek volgens de andere signalen toch een mens.
// Pas als een zone vooral 0x0 levert en die bezoeken bijna nooit mens zijn, kan het een nepsignaal in het zone-oordeel worden.
// Bron: mm:raw:<dag> (meetpagina van /go, regels ty=b) en mm:rawp:<dag> (paginabezoek met cm.js, regels ty=p).
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const MOBIEL = /Mobi|Android|iPhone|iPad|iPod/i;

export async function vensterPerZone(kv, { dag, tijd = 8000, min = 10 } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dag || ''))) return { ok: false, fout: 'dag JJJJ-MM-DD' };
  const t0 = Date.now(), Z = {}, tot = { n: 0, ow0: 0, ow0Mob: 0, ow0Desk: 0, mens: 0, mensOw0: 0 }, gescand = {};
  for (const lijst of ['mm:raw:' + dag, 'mm:rawp:' + dag]) {
    const len = N(await kv.raw(['LLEN', lijst]).catch(() => 0)); let van = 0; gescand[lijst] = { totaal: len, gelezen: 0 };
    while (van < len && Date.now() - t0 < tijd) {
      const rijen = (await kv.raw(['LRANGE', lijst, van, van + 399]).catch(() => [])) || []; if (!rijen.length) break; van += rijen.length; gescand[lijst].gelezen = van;
      for (const x of rijen) {
        if (typeof x !== 'string' || !(x.startsWith('{"ty":"b"') || x.startsWith('{"ty":"p"'))) continue;
        let r; try { r = JSON.parse(x); } catch (e) { continue; }
        const c = r.c; if (!c || typeof c !== 'object' || c.te_groot) continue;
        const k = (r.net || '?') + '|' + (r.zone || '?'), z = Z[k] || (Z[k] = { net: r.net || '', zone: r.zone || '', n: 0, ow0: 0, ow0Mob: 0, ow0Desk: 0, mob: 0, mens: 0, mensOw0: 0 });
        const mob = (c.uad && N(c.uad.m) === 1) || MOBIEL.test(String(c.ua || r.ua || '')), o = N(c.ow0) === 1, m = N(r.mens) === 1 || N(r.vlag && r.vlag.mens) === 1;
        z.n++; tot.n++; if (mob) z.mob++; if (m) { z.mens++; tot.mens++; }
        if (o) { z.ow0++; tot.ow0++; if (mob) { z.ow0Mob++; tot.ow0Mob++; } else { z.ow0Desk++; tot.ow0Desk++; } if (m) { z.mensOw0++; tot.mensOw0++; } }
      }
    }
  }
  const pct = (a, b) => (b ? Math.round(1000 * a / b) / 10 : null);
  const zones = Object.values(Z).filter(z => z.n >= min).map(z => ({ ...z, pctOw0: pct(z.ow0, z.n), pctMens: pct(z.mens, z.n), pctMensBijOw0: pct(z.mensOw0, z.ow0), meerderheidOw0: z.ow0 / z.n > 0.5 })).sort((a, b) => b.pctOw0 - a.pctOw0 || b.n - a.n);
  return {
    ok: true, dag, regel: 'alleen meten; 0x0 wordt pas een nepsignaal in het zone-oordeel als het bewijs dat draagt', volledig: Object.values(gescand).every(g => g.gelezen >= g.totaal), gescand,
    totaal: { ...tot, pctOw0: pct(tot.ow0, tot.n), pctMensBijOw0: pct(tot.mensOw0, tot.ow0), pctMensZonderOw0: pct(tot.mens - tot.mensOw0, tot.n - tot.ow0) },
    zonesMeerderheidOw0: zones.filter(z => z.meerderheidOw0).length, zones: zones.slice(0, 150),
  };
}
