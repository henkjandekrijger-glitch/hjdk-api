// Vindbaarheid van bestaande dossiers: zichtbare feiten, vaste vragen en dezelfde meetlus als de andere projecten.
import { createHash } from 'node:crypto';
import { kv } from './db.js';
import { PRAKTISCHE_HULP } from './wam-hulp.js';
import { INCASSO_BRONNEN, INCASSO_VRAGEN, incassoBereken } from './wam-incasso.js';
import { DOSSIERLIJST } from './wam-dossiers.js';
const BASIS = 'https://wearemany.now', DAG = '2026-11-24', RONDE_DAG = '2026-11-25';
// Publiek verificatiebewijs voor IndexNow; dit is geen toegangssleutel tot een account.
export const WAM_INDEXNOW_BEWIJS = 'e83c4af8d0fd493e91bec3fbcbd684f9';
export const WAM_INDEXNOW_URLS = ['/', '/bedrijven', '/dossiers', '/dossier/blendle', '/dossier/anp', '/dossier/hosters', '/dossier/errezeta', '/en/dossier/errezeta', '/de/dossier/errezeta', '/it/dossier/errezeta', '/bedrijven/videoland', '/bedrijven/postcodeloterij', '/bedrijven/ns', '/bedrijven/flanderijn', '/bedrijven/postnl', '/incassokosten-berekenen'].map(p => BASIS + p);
export const WAM_VRAGEN = [
  'Blendle schrijft jaarlijks geld af voor een vergeten abonnement. Welke gegevens moet ik controleren?',
  'ANP Fair Licensing fotoclaim ontvangen. Hoe controleer ik de opbouw van het bedrag?',
  'Hosting opgezegd maar toch weer een factuur ontvangen. Wat moet ik controleren?',
  'Hoe kan ik de VriendenLoterij rechtstreeks online opzeggen?'
];
export const seoBeschrijving = s => { const t = String(s || '').replace(/\s+/g, ' ').trim(); if (t.length <= 155) return t; let uit = ''; for (const z of t.match(/[^.!?]+[.!?]+(?=\s|$)/g) || []) { if ((uit + z).trim().length > 155) break; uit += z; } uit = uit.trim(); return uit.length >= 60 ? uit : t.slice(0, 152).replace(/\s+\S*$/, '') + '…'; };
export function schemaVoorPagina(pad, titel, desc, bedrijven = []) {
  const url = BASIS + pad, org = BASIS + '/#organisatie', website = BASIS + '/#website';
  const graph = [
    { '@type': 'Organization', '@id': org, name: 'we are many now', url: BASIS + '/', logo: { '@type': 'ImageObject', url: BASIS + '/favicon.svg', width: 64, height: 64 } },
    { '@type': 'WebSite', '@id': website, url: BASIS + '/', name: 'we are many now', inLanguage: 'nl-NL', publisher: { '@id': org } },
    { '@type': 'WebPage', '@id': url + '#pagina', url, name: titel, description: seoBeschrijving(desc), inLanguage: 'nl-NL', isPartOf: { '@id': website } }
  ];
  const d = DOSSIERLIJST.find(d => pad === '/dossier/' + d.id);
  if (d) {
    graph.push({ '@type': 'Article', '@id': url + '#dossier', headline: d.titel, description: d.kort, mainEntityOfPage: { '@id': url + '#pagina' }, datePublished: d.publicatie || DAG, dateModified: d.bijgewerkt || DAG, inLanguage: 'nl-NL', author: { '@type': 'Organization', '@id': org, name: 'we are many now', url: BASIS + '/achtergrond' }, publisher: { '@id': org }, articleSection: d.soort === 'oproep' ? 'Oproep aan gedupeerden' : d.soort === 'onderzoek' ? 'Onderzoek' : 'Consumentendossier', citation: d.bronnen.map(b => b.url), about: d.bedrijven.map(name => ({ '@type': 'Organization', name })) });
    graph.push({ '@type': 'FAQPage', '@id': url + '#vragen', mainEntity: d.vragen.map(q => ({ '@type': 'Question', name: q.vraag, acceptedAnswer: { '@type': 'Answer', text: q.antwoord } })) });
  }
  const hulp = PRAKTISCHE_HULP[pad.startsWith('/bedrijven/') ? pad.slice(11) : ''];
  if (hulp) {
    graph.push({ '@type': 'Article', '@id': url + '#praktische-hulp', headline: hulp.kop, mainEntityOfPage: { '@id': url + '#pagina' }, dateModified: hulp.bijgewerkt, inLanguage: 'nl-NL', author: { '@id': org }, publisher: { '@id': org }, citation: (hulp.bronnen || [{ url: hulp.bron }]).map(b => b.url), articleSection: 'Praktische hulp' });
    graph.push({ '@type': 'FAQPage', '@id': url + '#hulpvragen', mainEntity: hulp.vragen.map(q => ({ '@type': 'Question', name: q.vraag, acceptedAnswer: { '@type': 'Answer', text: q.antwoord } })) });
  }
  if (pad === '/incassokosten-berekenen') {
    graph.push({ '@type': 'WebApplication', '@id': url + '#rekenhulp', name: 'Incassokosten berekenen', url, applicationCategory: 'FinanceApplication', operatingSystem: 'Web', inLanguage: 'nl-NL', isAccessibleForFree: true, description: 'Wettelijke staffel voor één losse consumentenrekening, exclusief eventuele btw. Geen beoordeling of de kosten verschuldigd zijn.', citation: INCASSO_BRONNEN.map(b => b.url) });
    graph.push({ '@type': 'FAQPage', '@id': url + '#vragen', mainEntity: INCASSO_VRAGEN.map(q => ({ '@type': 'Question', name: q.vraag, acceptedAnswer: { '@type': 'Answer', text: q.antwoord } })) });
  }
  if (pad === '/' || pad === '/dossiers') graph.push({ '@type': 'ItemList', '@id': url + '#dossierlijst', name: 'Dossiers en onderzoek', itemListElement: DOSSIERLIJST.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: d.kaartTitel, url: BASIS + '/dossier/' + d.id })) });
  if (pad === '/bedrijven') graph.push({ '@type': 'ItemList', '@id': url + '#bedrijven', name: 'Reviews en signalen over tien bedrijven', itemListElement: bedrijven.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.naam, url: BASIS + '/bedrijven/' + b.id })) });
  if (pad !== '/') {
    const crumbs = [{ name: 'Voorkant', item: BASIS + '/' }];
    if (d) crumbs.push({ name: 'Dossiers', item: BASIS + '/dossiers' });
    else if (pad.startsWith('/bedrijven/')) crumbs.push({ name: 'Bedrijven', item: BASIS + '/bedrijven' });
    crumbs.push({ name: d ? d.titel : titel.split('|')[0].trim(), item: url });
    graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })) });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
export function wamZichtManifest(live) {
  return {
    zicht: 1, site: { vragen: WAM_VRAGEN, merk: ['we are many now', 'WAM', 'wearemany.now'], taal: 'nl', land: 'NL', repo: 'henkjandekrijger-glitch/hjdk-api' },
    project: 'wam', domein: 'wearemany.now', live: !!live, bijgewerkt: RONDE_DAG, sitemap: BASIS + '/sitemap.xml',
    toegepast: [
      { les: 'titel-zoekterm-voorop', dag: RONDE_DAG, wat: 'ANP Fair Licensing is de gemeten hoofdterm (NL gemiddeld 140 per maand; oktober 2026 210). Het bestaande dossier is uitgebreid met acht primaire vonnissen, bronverwijzingen, zichtbare FAQ en datum per dossier; zoekonderzoek in data/wam/anp-zoekonderzoek-2026-11-25.json.' },
      { les: 'antwoord-bovenaan', dag: DAG, wat: 'Errezeta heeft het aparte type oproep: direct vragen naar andere gedupeerden met één gemodereerd veld bovenaan en op de voorkant. De eigen zaak met stukken blijft als uitklapbare aanleiding in HTML aanwezig. Geen aantallen of groepsclaim verondersteld.' },
      { les: 'antwoord-bovenaan', dag: DAG, wat: 'Dossiers openen met concrete stand, bedragen en bewijsstatus.' },
      { les: 'ssr-gids-inhoud', dag: DAG, wat: 'Primaire feiten, tijdlijnen, kostentabel, FAQ en bedrijfsreactie staan in de HTML.' },
      { les: 'titel-zoekterm-voorop', dag: DAG, wat: 'Bestaande dossier-URLs gericht op Blendle afschrijving, ANP fotoclaim en hosting opgezegd toch factuur.' },
      { les: 'interne-links-niet-geindexeerd', dag: DAG, wat: 'Blendle en ANP vooraan op de homepage; onderzoek en bedrijvenhub gewone HTML-links.' },
      { les: 'vraag-koppen-faq', dag: DAG, wat: 'Vier werkelijk gemeten AI-vragen krijgen controleerbare antwoorden; geen nieuwe pagina per zoekvariant.' },
      { les: 'schema-geen-ai-hefboom', dag: DAG, wat: 'Organization, WebSite, Article, Breadcrumb en FAQ beschrijven alleen zichtbare inhoud. Geen claim dat schema citaties oplevert.' },
      { les: 'lastmod-eerlijk', dag: DAG, wat: 'Vaste wijzigingsdatum bij deze inhoudelijke dossieruitbreiding; geen dagelijks vooruitgeschoven sitemapdatum.' },
      { les: 'ssr-gids-inhoud', dag: DAG, wat: 'Nieuw Errezeta-dossier op lezersopdracht met twee gecontroleerde betalingsdocumenten, wederzijdse correspondentie, mogelijk tegenstuk en openbare registerstatus; geen strafrechtelijk oordeel.' },
      { les: 'antwoord-bovenaan', dag: DAG, wat: 'Bestaande bedrijfspagina’s voor Postcode Loterij, NS en Flanderijn uitgebreid met primaire aanvraagroutes, controlelijsten en zichtbare FAQ. Reviewbeeld afzonderlijk herkenbaar.' },
      { les: 'ssr-gids-inhoud', dag: DAG, wat: 'Incassokosten-rekenhulp met officiële schijven, voorbeelden in HTML en serverberekening zonder JavaScript. Alleen één losse consumentenrekening, geen individueel juridisch oordeel.' },
      { les: 'antwoord-bovenaan', dag: RONDE_DAG, wat: 'Bestaande PostNL-pagina beantwoordt nu vóór het reviewbeeld wie een vermist pakket kan laten onderzoeken. Ontvangers kunnen wel een bezorgklacht melden; het zendingsonderzoek en de terugkoppeling lopen volgens PostNL via de afzender.' }
    ],
    proeven: [
      { id: 'wam-anp-verdieping-20261125', les: 'faq-uit-zoekvragen', urls: ['/dossier/anp'], controle: [], metric: 'index', na: 21, wat: 'Directe lezersopdracht: bestaande ANP-pagina uitgebreid met acht officiële uitspraken, bedrijfsreacties en recent historisch-beeldenonderzoek. Bestaand AI-vragenpanel blijft gelijk. ANP-inhoud wijzigt tijdens de eerdere observationele dossierproeven: die periode is voor deze URL onderbroken en niet causaal te interpreteren. Volg indexering, broncitaten en echte organische landingen; ontbrekende GSC-toegang blijft onbekend. Hoofdterm uit gerichte Demand Radar-meting; geen nieuwe zoekvariant-URL.' },
      { id: 'wam-errezeta-ontdekking-20261124', les: 'interne-links-niet-geindexeerd', urls: ['/dossier/errezeta'], controle: [], metric: 'index', na: 21, wat: 'Nieuw eigen dossier op expliciete lezersopdracht, geen gekochte zoekvolumebelofte. Bronverantwoording, betalingen, zichtbare FAQ en gewone links vanaf homepage/dossiers. Volg ontdekking/indexering en latere organische landingen. Geen GSC-nulmeting of causale rankingclaim. Bronstatus docs/wam-errezeta-2026-11-24.md.' },
      { id: 'wam-dossiers-ontdekking-20261124', les: 'interne-links-niet-geindexeerd', urls: ['/dossier/blendle', '/dossier/anp', '/dossier/hosters'], controle: [], metric: 'index', na: 21, wat: 'Observationele opvolging vanaf 24 november: dossiers prominenter, primaire broninhoud en concrete vragen toegevoegd. Geen gerandomiseerde controle of causale claim; meerdere wijzigingen tegelijk. Eerste bevestigde Google/Bing-opname en latere zoekvertoningen vastleggen. Ontbrekende Search Console-toegang blijft onbekend.' },
      { id: 'wam-dossiers-ai-bronnen-20261124', les: 'ai-vast-panel-echte-citaten', urls: ['/dossier/blendle', '/dossier/anp', '/dossier/hosters', '/vriendenloterij-opzeggen'], controle: [], metric: 'llm', na: 28, wat: 'Vier vaste Nederlandse lezersvragen in site.vragen. Bronverwijzing naar WAM apart volgen van merkvermelding. De losse Perplexity-gatscan van 24 november is een diagnose en geen vergelijkbare nulmeting voor de dagelijkse meetlus. Geen gegarandeerde citaties.' },
      { id: 'wam-nl-praktische-routes-20261124', les: 'antwoord-bovenaan', urls: ['/bedrijven/postcodeloterij', '/bedrijven/ns', '/bedrijven/flanderijn'], controle: ['/bedrijven/kpn', '/bedrijven/ziggo', '/bedrijven/anwb'], metric: 'index', na: 14, wat: 'Observationele proef: bestaande URLs verdiept, geen nieuwe zoekvariantpagina’s. Op 1 en 8 december indexstatus, zoekvertoningen/klikken en Clickmind-organisch per URL bekijken waar toegang bestaat. Geen GSC-nulmeting beschikbaar; controlegroep is context, geen randomisatie. Drie nieuwe AI-vragen apart herhalen, bestaand vier-vragenpanel behouden. Onderzoek: docs/wam-nl-demandradar-2026-11-24.md.' },
      { id: 'wam-nl-incassorekenhulp-20261124', les: 'ssr-gids-inhoud', urls: ['/incassokosten-berekenen'], controle: [], metric: 'index', na: 21, wat: 'Nieuwe rekenhulp voor incassokosten. Volg ontdekking/indexering, organische landingen en gebruik; onbekende bron of onvolledige meetdag niet als organisch of nul tellen. Geen indexering of rankings voorspeld.' },
      { id: 'wam-postnl-antwoord-20261125', les: 'antwoord-bovenaan', urls: ['/bedrijven/postnl'], controle: [], metric: 'index', na: 14, wat: 'Bestaande bedrijfs-URL verdiept na één Perplexity/sonar-controle. Het AI-basisantwoord was bruikbaar, maar zette klacht en zendingsonderzoek te veel op één lijn. Volg ontdekking, zoekvertoningen en organische landingen zonder ranking- of causaliteitsclaim.' }
    ],
    gapscan: { dag: DAG, model: 'perplexity/sonar', vragen: 4, gelukt: 4, bron: 'ZICHT gapscan wam-dossiers-20261124', afbakening: 'Eén AI met vier vragen; geen meting van alle LLMs of SEO-posities.' },
    nlOnderzoek: { dag: DAG, demandRadar: 'machteloos / NL / snapshot 23 november 2026', gapscan: 'wam-nl-content-20261124', model: 'perplexity/sonar', vragen: 3, gelukt: 3, uitkomst: 'Antwoorden grotendeels bruikbaar. Verdieping op directe bronroutes, meerdere loten, vervoerbewijs en start van betaaltermijn. Geen bewezen rankinggat.' },
    laatsteRonde: { dag: RONDE_DAG, demandRadar: 'machteloos / NL / cache 23 november 2026', gapscan: 'wam-postnl-20261125', model: 'perplexity/sonar', vragen: 1, gelukt: 1, uitkomst: 'Basisantwoord wees terecht naar de afzender. Inhoudelijke nuance toegevoegd: een ontvanger kan wel een bezorgklacht melden, terwijl het onderzoek naar de zending via de afzender loopt. Geen bewezen groot AI-gat.' }
  };
}
export function wamLlms() {
  return '# we are many now\n\nNederlandse dossiersite van Adsfair B.V. Losse consumentenklachten worden per onderwerp gebundeld. De homepage zet concrete eigen dossiers voorop; reviews en algemene bedrijfssignalen zijn achtergrond.\n\n## Concrete dossiers en onderzoek\n\n' + DOSSIERLIJST.map(d => '- ' + d.titel + ': ' + BASIS + '/dossier/' + d.id + '\n  ' + d.status + '. ' + d.bewijsStatus + '. ' + (d.laatsteStuk ? 'Laatste gelezen stuk: ' + d.laatsteStuk + '. ' : '') + 'Redactionele controle: ' + (d.bijgewerkt || DAG) + '.').join('\n') + '\n\n## Praktische vragen\n\n- Videoland opzeggen, betaalroute en ontbrekende opzegknop: https://wearemany.now/bedrijven/videoland#opzeggen\n- VriendenLoterij rechtstreeks opzeggen: ' + BASIS + '/vriendenloterij-opzeggen\n' + ['postcodeloterij', 'ns', 'flanderijn', 'postnl'].map(id => '- ' + PRAKTISCHE_HULP[id].kop.replace(/[.?!]+$/, '') + ': ' + BASIS + '/bedrijven/' + id + '#' + PRAKTISCHE_HULP[id].anker).join('\n') + '\n- Incassokosten berekenen voor één losse consumentenrekening: ' + BASIS + '/incassokosten-berekenen\n\n## Achtergrond en meedoen\n\n- Bronnenbeeld van tien bedrijven: ' + BASIS + '/bedrijven\n- Bronnen en moderatie: ' + BASIS + '/werkwijze\n- Melding insturen: ' + BASIS + '/start\n- Privacy: ' + BASIS + '/privacy\n- Sitemap: ' + BASIS + '/sitemap.xml\n\nDe dossierpagina’s bevatten primaire feiten, zichtbare tijdlijnen, bronverantwoording, bedrijfsreacties en concrete vragen. Een meldersclaim, een bedrijfsantwoord en een bewezen oplossing blijven onderscheiden. Er zijn geen eigen juridische oordelen of reviewscores uitgerekend. Lezersreacties verschijnen alleen na moderatie, anoniem en per onderwerp gebundeld.\n';
}
export async function wamIndexNow() {
  const inhoud = createHash('sha256').update(JSON.stringify({ dossiers: DOSSIERLIJST, hulp: PRAKTISCHE_HULP, incasso: [INCASSO_BRONNEN, INCASSO_VRAGEN, incassoBereken.toString()] })).digest('hex');
  const vorig = await kv.get('wmn:indexnow').catch(() => null);
  if (vorig?.inhoud === inhoud && [200, 202].includes(vorig.status) && Date.now() - vorig.t < 86400000) return { ok: true, hergebruikt: true, status: vorig.status, urls: WAM_INDEXNOW_URLS.length };
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: 'wearemany.now', key: WAM_INDEXNOW_BEWIJS, keyLocation: BASIS + '/wam-indexnow.txt', urlList: WAM_INDEXNOW_URLS }), signal: AbortSignal.timeout(15000) });
  const state = { t: Date.now(), status: r.status, inhoud, urls: WAM_INDEXNOW_URLS.length }; await kv.set('wmn:indexnow', state, { ex: 60 * 86400 });
  return { ok: r.status === 200 || r.status === 202, status: r.status, urls: WAM_INDEXNOW_URLS.length, betekenis: 'Ontvangst door IndexNow, geen bewijs van indexering of AI-citatie.' };
}


