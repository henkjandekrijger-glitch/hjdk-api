// Meetregels voor organische groei. Drempels zijn een werkafspraak, geen Google-regel.
const DAY_MS = 864e5;
export function gscWindow(days = 28, now = Date.now()) {
  const end = new Date(now - 2 * DAY_MS).toISOString().slice(0, 10);
  const start = new Date(Date.parse(end + 'T12:00:00Z') - (days - 1) * DAY_MS).toISOString().slice(0, 10);
  return { startDate: start, endDate: end };
}
export function contentDate(item) {
  return [item?.updatedAt, item?.publishAt].filter(x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(x) && Number.isFinite(Date.parse(x))).sort().pop() || null;
}
export function publicationBudget(site, configured, index, now = Date.now()) {
  const requested = Number(configured);
  const normaal = Number.isFinite(requested) ? Math.max(0, Math.floor(requested)) : 0;
  const rem = site === 'kz' ? 2 : 1;
  const age = index?.dag ? (now - Date.parse(index.dag + 'T00:00:00Z')) / DAY_MS : Infinity;
  const bekend = Number(index?.bekeken) || 0, totaal = Number(index?.inSitemap) || 0, inGoogle = Number(index?.geindexeerd) || 0;
  const betrouwbaar = age >= 0 && age < 3 && totaal >= 50 && bekend / totaal >= 0.8;
  const achterstand = betrouwbaar && inGoogle / Math.max(1, bekend) < 0.5;
  const onzeker = !betrouwbaar;
  const perDag = achterstand || onzeker ? Math.min(normaal, rem) : normaal;
  return { ingesteld: normaal, perDag, begrensd: perDag < normaal, reden: achterstand ? 'Minder dan de helft van de gecontroleerde URL’s staat in Google: bestaande pagina’s verbeteren krijgt voorrang.' : onzeker ? 'Geen recente, voldoende volledige indexcontrole: nieuwbouw blijft beperkt tot de meting hersteld is.' : 'Indexcontrole is recent en minstens de helft van de gecontroleerde URL’s staat in Google.', indexDag: index?.dag || null, inGoogle, gecontroleerd: bekend, inSitemap: totaal, dekking: totaal ? Math.round(bekend / totaal * 100) : null, regel: 'Tijdelijke werkafspraak: bij achterstand maximaal 2 NL, 1 US, 1 DE per UTC-dag; geen bewezen SEO-drempel.' };
}
export function organicOpportunities(gsc) {
  const per = new Map();
  for (const q of gsc?.kansen || []) {
    if (!q.slug || !q.q || q.pos < 4 || q.pos > 20 || q.imp < 2) continue;
    const p = per.get(q.slug) || { slug: q.slug, vertoningen: 0, vragen: [], score: 0 };
    p.vertoningen += q.imp; p.score += q.imp / Math.sqrt(q.pos); p.vragen.push({ vraag: q.q, vertoningen: q.imp, positie: q.pos }); per.set(q.slug, p);
  }
  return [...per.values()].sort((a, b) => b.score - a.score).slice(0, 6).map(({ score, ...p }) => p);
}
export function indexEvidence(proef, index, now = Date.now()) {
  const fresh = (now - Date.parse((index?.dag || '') + 'T00:00:00Z')) / DAY_MS < 3;
  const map = new Map((index?.alles || []).map(x => [x.url.replace(/\/$/, ''), x]));
  const count = urls => {
    const all = [...new Set(urls || [])];
    const rows = all.map(u => map.get(u.replace(/\/$/, ''))).filter(x => x && x.dag >= proef.klaar);
    return { gepland: all.length, gemeten: rows.length, inGoogle: rows.filter(x => x.verdict === 'PASS').length };
  };
  const test = count(proef.urls), control = count(proef.controle);
  const genoeg = fresh && test.gemeten >= 10 && control.gemeten >= 10 && test.gemeten / test.gepland >= 0.8 && control.gemeten / control.gepland >= 0.8;
  const effect = genoeg ? test.inGoogle / test.gemeten - control.inGoogle / control.gemeten : null;
  // Twee onafhankelijke URL-cohorten: benadering met standaardfout; bij schaarse aantallen geen winnaar.
  const rt = test.inGoogle / Math.max(1, test.gemeten), rc = control.inGoogle / Math.max(1, control.gemeten);
  const se = Math.sqrt(rt * (1 - rt) / Math.max(1, test.gemeten) + rc * (1 - rc) / Math.max(1, control.gemeten));
  const onderscheid = genoeg && test.inGoogle >= 5 && control.inGoogle >= 5 && test.gemeten - test.inGoogle >= 5 && control.gemeten - control.inGoogle >= 5 && Math.abs(effect) > 1.96 * se;
  return { uitkomst: onderscheid ? (effect > 0 ? 'beter' : 'slechter') : 'te-weinig', effect, test, control, toel: `Indexproef: getest ${test.inGoogle}/${test.gemeten} (${test.gepland} gepland), controle ${control.inGoogle}/${control.gemeten} (${control.gepland} gepland). Alleen metingen vanaf de uitslagdatum; zonder voldoende verse controle geen winnaar.` };
}
export function gscEvidence(proef, na) {
  const sum = (st, urls) => [...new Set(urls || [])].reduce((n, url) => n + (st?.paginas?.[new URL(url).pathname.replace(/\/$/, '') || '/']?.imp || 0), 0);
  const voor = proef.voor;
  const t0 = sum(voor, proef.urls), t1 = sum(na, proef.urls), c0 = sum(voor, proef.controle), c1 = sum(na, proef.controle);
  const vergelijkbaar = voor?.meetversie === 'gsc-page-v2' && na?.meetversie === voor.meetversie && voor.periode?.endDate < na.periode?.startDate;
  const genoeg = vergelijkbaar && Math.min(t0, t1, c0, c1) >= 30;
  const ratio = ((t1 + 1) / (t0 + 1)) / ((c1 + 1) / (c0 + 1));
  const effect = genoeg ? ratio - 1 : null;
  const marge = 1.96 * Math.sqrt(1 / Math.max(1, t0) + 1 / Math.max(1, t1) + 1 / Math.max(1, c0) + 1 / Math.max(1, c1));
  const duidelijk = genoeg && Math.abs(Math.log(ratio)) > marge && Math.abs(effect) > 0.15;
  return { uitkomst: duidelijk ? effect > 0 ? 'beter' : 'slechter' : 'te-weinig', effect, toel: `Vertoningen getest ${t0} -> ${t1}; controle ${c0} -> ${c1}. Alleen vergelijkbare paginatotalen, gescheiden meetvensters en voldoende waarnemingen krijgen bewijsgewicht. Een gecontroleerd signaal bewijst geen gegarandeerd oorzakelijk SEO-effect.`, signaal: t1 > t0 ? 'stijging' : t1 < t0 ? 'daling' : 'stabiel' };
}
