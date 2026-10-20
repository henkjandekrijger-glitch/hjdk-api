import { kv } from './db.js';
import { publicationBudget, organicOpportunities } from './organic-policy.js';

export async function organicStatus(site, configured) {
  const [index, gsc, full] = await Promise.all([
    kv.get('hjdk:gsc:index:' + site).catch(() => null),
    kv.get('hjdk:gsc:' + site).catch(() => null),
    kv.get('hjdk:gsc:totalen:' + site).catch(() => null)
  ]);
  const budget = publicationBudget(site, configured, index);
  const kansen = organicOpportunities(gsc);
  return {
    dag: new Date().toISOString().slice(0, 10), site, budget,
    google: { dag: full?.dag || gsc?.dag || null, periode: full?.periode || gsc?.periode || null, totaal: full && (!gsc?.periode || full.dag >= gsc.dag) ? { imp: full.imp, clicks: full.clicks, ctr: full.ctr } : gsc?.periode ? gsc.totaal : null, basis: full ? 'Google-site-totaal zonder zoekvraagfilter (inclusief anonieme zoekvragen)' : gsc?.totaalBasis || 'Oude meting: som van zichtbare zoekvraagregels; kan anonieme zoekvragen missen.' },
    prioriteit: kansen.length ? 'Bestaande pagina’s op positie 4–20 verbeteren; dezelfde zoekintentie op één pagina beantwoorden.' : 'Ontdekking en indexering van bestaande pagina’s herstellen; nog geen gemeten positie 4–20-kansen.',
    kansen,
    indexProblemen: index?.perStaat || {},
    controle: ['Dagelijks: verse indexcontrole, echte Google-totalen en posities volgen.', 'Per wijziging: URL en beginstand vastleggen; titel- en inhoudsproeven krijgen minimaal 35 dagen voor gescheiden Google-meetvensters.', 'AI: hetzelfde vragenpanel en model vergelijken; merkvermelding en broncitaat apart tellen.', 'Succes: meer geïndexeerde URL’s, Google-kliks, gebruikte keuzehulpen, winkelkliks en toegeschreven orders; geen winnaar uit losse bezoeken.'],
    interpretatie: 'Indexering is geen garantie op verkeer. Verwijzer-tellers, Google Search Console en AI-testen meten verschillende dingen. Google-data loopt minimaal twee dagen achter; ontbrekende data is geen nul.'
  };
}
