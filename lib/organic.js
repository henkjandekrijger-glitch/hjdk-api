import { kv } from './db.js';
import { publicationBudget, organicOpportunities } from './organic-policy.js';

// Googlebot-leesbeurten per dag (zelfde sleutels en drempel als crawlTrend in lib/zicht.js; hier los om een kringimport te vermijden).
async function crawlStand(site) {
  if (!['kz', 'us', 'de'].includes(site)) return null;
  const dagen = Array.from({ length: 28 }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const keys = dagen.map(d => site === 'kz' ? 'c:hjdk6-kz-botd-' + d.replace(/-/g, '') + '-googlebot' : 'c:wtb-' + site + '-botd-' + d + '-googlebot');
  const v = (await kv.mget(...keys).catch(() => [])).map(x => Number(x) || 0); if (!v.length) return null;
  const g7 = v.slice(0, 7).reduce((a, b) => a + b, 0), voor = v.slice(7, 28).reduce((a, b) => a + b, 0) / 3;
  const vr = v.slice(7, 28).sort((a, b) => a - b), med = vr[Math.floor(vr.length / 2)] * 7;
  const nu = voor >= 10 && g7 < voor * 0.25 && g7 < med * 0.5;
  // Grendel (11 nov 2026): de vergelijking met de drie weken ervoor zakt mee met een lange instorting. keuzehulp.best stond op 9 nov op 2 tegen 33,
  // op 11 nov op 8 tegen 26 met mediaan 7: de stop ging vanzelf uit en kzmaak bouwde weer, terwijl Googlebot nog steeds ~1 keer per dag las.
  // Daarom onthouden we het niveau van vóór de instorting en heffen de stop pas op als Googlebot weer minstens de helft daarvan leest.
  const key = 'zicht:crawlstop:' + site; let st = await kv.get(key).catch(() => null);
  if (!st && CRAWLSTOP_START[site]) st = CRAWLSTOP_START[site];
  if (st && st.hersteld) st = null;
  if (nu) { if (!st || Math.round(voor) > st.voorheen) { st = { sinds: (st && st.sinds) || new Date().toISOString().slice(0, 10), voorheen: Math.max(Math.round(voor), (st && st.voorheen) || 0) }; await kv.set(key, st).catch(() => {}); } return { googlebot7d: g7, voorheen: st.voorheen, ingestort: true, sinds: st.sinds }; }
  if (st && st.voorheen) { if (g7 < st.voorheen * 0.5) return { googlebot7d: g7, voorheen: st.voorheen, ingestort: true, sinds: st.sinds, grendel: true }; await kv.set(key, { hersteld: new Date().toISOString().slice(0, 10), was: st }).catch(() => {}); }
  return { googlebot7d: g7, voorheen: Math.round(voor), ingestort: false };
}
// Beginstand voor de grendel: de instorting die op 9 nov 2026 de crawlstop aanzette (proef kz-crawlstop-1109, gemiddeld 33 per 7 dagen daarvoor).
const CRAWLSTOP_START = { kz: { sinds: '2026-11-09', voorheen: 33 } };

export async function organicStatus(site, configured) {
  const [index, gsc, full] = await Promise.all([
    kv.get('hjdk:gsc:index:' + site).catch(() => null),
    kv.get('hjdk:gsc:' + site).catch(() => null),
    kv.get('hjdk:gsc:totalen:' + site).catch(() => null)
  ]);
  const crawl = await crawlStand(site).catch(() => null);
  const budget = publicationBudget(site, configured, index, Date.now(), crawl);
  const kansen = organicOpportunities(gsc);
  const useFull = full?.periode && (!gsc?.periode || full.periode.endDate >= gsc.periode.endDate);
  const google = useFull ? { dag: full.dag, periode: full.periode, totaal: { imp: full.imp, clicks: full.clicks, ctr: full.ctr }, basis: 'Google-site-totaal zonder zoekvraagfilter (inclusief anonieme zoekvragen)', eigen: full.eigen || null, verhuisd: full.verhuisd || null } : { dag: gsc?.dag || null, periode: gsc?.periode || null, totaal: gsc?.periode ? gsc.totaal : null, basis: gsc?.totaalBasis || 'Oude meting: som van zichtbare zoekvraagregels; kan anonieme zoekvragen missen.', eigen: gsc?.eigen || null, verhuisd: gsc?.verhuisd || null };
  return {
    dag: new Date().toISOString().slice(0, 10), site, budget,
    google,
    prioriteit: kansen.length ? 'Bestaande pagina’s op positie 4–20 verbeteren; dezelfde zoekintentie op één pagina beantwoorden.' : 'Ontdekking en indexering van bestaande pagina’s herstellen; nog geen gemeten positie 4–20-kansen.',
    kansen,
    indexProblemen: index?.perStaat || {},
    controle: ['Dagelijks: verse indexcontrole, echte Google-totalen en posities volgen.', 'Per wijziging: URL en beginstand vastleggen; titel- en inhoudsproeven krijgen minimaal 35 dagen voor gescheiden Google-meetvensters.', 'AI: hetzelfde vragenpanel en model vergelijken; merkvermelding en broncitaat apart tellen.', 'Succes: meer geïndexeerde URL’s, Google-kliks, gebruikte keuzehulpen, winkelkliks en toegeschreven orders; geen winnaar uit losse bezoeken.'],
    interpretatie: 'Indexering is geen garantie op verkeer. Verwijzer-tellers, Google Search Console en AI-testen meten verschillende dingen. Google-data loopt minimaal twee dagen achter; ontbrekende data is geen nul.'
  };
}
