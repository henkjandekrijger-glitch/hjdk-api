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
  return { googlebot7d: g7, voorheen: Math.round(voor), ingestort: voor >= 10 && g7 < voor * 0.25 && g7 < med * 0.5 };
}

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
  const google = useFull ? { dag: full.dag, periode: full.periode, totaal: { imp: full.imp, clicks: full.clicks, ctr: full.ctr }, basis: 'Google-site-totaal zonder zoekvraagfilter (inclusief anonieme zoekvragen)' } : { dag: gsc?.dag || null, periode: gsc?.periode || null, totaal: gsc?.periode ? gsc.totaal : null, basis: gsc?.totaalBasis || 'Oude meting: som van zichtbare zoekvraagregels; kan anonieme zoekvragen missen.' };
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
