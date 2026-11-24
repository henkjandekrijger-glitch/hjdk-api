// Vindbaarheid van bestaande dossiers: zichtbare feiten, vaste vragen en dezelfde meetlus als de andere projecten.
import { createHash } from 'node:crypto';
import { kv } from './db.js';
import { PRAKTISCHE_HULP } from './wam-hulp.js';
import { DOSSIERLIJST } from './wam-dossiers.js';
const BASIS = 'https://wearemany.now', DAG = '2026-11-24';
// Publiek verificatiebewijs voor IndexNow; dit is geen toegangssleutel tot een account.
export const WAM_INDEXNOW_BEWIJS = 'e83c4af8d0fd493e91bec3fbcbd684f9';
export const WAM_INDEXNOW_URLS = ['/', '/bedrijven', '/dossiers', '/dossier/blendle', '/dossier/anp', '/dossier/hosters', '/bedrijven/videoland'].map(p => BASIS + p);
export const WAM_VRAGEN = [
  'Blendle schrijft jaarlijks geld af voor een vergeten abonnement. Welke gegevens moet ik controleren?',
  'ANP Fair Licensing fotoclaim ontvangen. Hoe controleer ik de opbouw van het bedrag?',
  'Hosting opgezegd maar toch weer een factuur ontvangen. Wat moet ik controleren?',
  'Hoe kan ik de VriendenLoterij rechtstreeks online opzeggen?'
];
export const seoBeschrijving = s => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length <= 155 ? t : t.slice(0, 152).replace(/\s+\S*$/, '') + '…'; };
export function schemaVoorPagina(pad, titel, desc, bedrijven = []) {
  const url = BASIS + pad, org = BASIS + '/#organisatie', website = BASIS + '/#website';
  const graph = [
    { '@type': 'Organization', '@id': org, name: 'we are many now', url: BASIS + '/', logo: { '@type': 'ImageObject', url: BASIS + '/favicon.svg', width: 64, height: 64 } },
    { '@type': 'WebSite', '@id': website, url: BASIS + '/', name: 'we are many now', inLanguage: 'nl-NL', publisher: { '@id': org } },
    { '@type': 'WebPage', '@id': url + '#pagina', url, name: titel, description: seoBeschrijving(desc), inLanguage: 'nl-NL', isPartOf: { '@id': website } }
  ];
  const d = DOSSIERLIJST.find(d => pad === '/dossier/' + d.id);
  if (d) {
    graph.push({ '@type': 'Article', '@id': url + '#dossier', headline: d.titel, description: d.kort, mainEntityOfPage: { '@id': url + '#pagina' }, datePublished: DAG, dateModified: DAG, inLanguage: 'nl-NL', author: { '@type': 'Organization', '@id': org, name: 'we are many now', url: BASIS + '/achtergrond' }, publisher: { '@id': org }, articleSection: d.soort === 'onderzoek' ? 'Onderzoek' : 'Consumentendossier', citation: d.bronnen.map(b => b.url), about: d.bedrijven.map(name => ({ '@type': 'Organization', name })) });
    graph.push({ '@type': 'FAQPage', '@id': url + '#vragen', mainEntity: d.vragen.map(q => ({ '@type': 'Question', name: q.vraag, acceptedAnswer: { '@type': 'Answer', text: q.antwoord } })) });
  }
  const hulp = PRAKTISCHE_HULP[pad.startsWith('/bedrijven/') ? pad.slice(11) : ''];
  if (hulp) {
    graph.push({ '@type': 'FAQPage', '@id': url + '#hulpvragen', mainEntity: hulp.vragen.map(q => ({ '@type': 'Question', name: q.vraag, acceptedAnswer: { '@type': 'Answer', text: q.antwoord } })) });
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
    project: 'wam', domein: 'wearemany.now', live: !!live, bijgewerkt: DAG, sitemap: BASIS + '/sitemap.xml',
    toegepast: [
      { les: 'antwoord-bovenaan', dag: DAG, wat: 'Dossiers openen met concrete stand, bedragen en bewijsstatus.' },
      { les: 'ssr-gids-inhoud', dag: DAG, wat: 'Primaire feiten, tijdlijnen, kostentabel, FAQ en bedrijfsreactie staan in de HTML.' },
      { les: 'titel-zoekterm-voorop', dag: DAG, wat: 'Bestaande dossier-URLs gericht op Blendle afschrijving, ANP fotoclaim en hosting opgezegd toch factuur.' },
      { les: 'interne-links-niet-geindexeerd', dag: DAG, wat: 'Blendle en ANP vooraan op de homepage; onderzoek en bedrijvenhub gewone HTML-links.' },
      { les: 'vraag-koppen-faq', dag: DAG, wat: 'Vier werkelijk gemeten AI-vragen krijgen controleerbare antwoorden; geen nieuwe pagina per zoekvariant.' },
      { les: 'schema-geen-ai-hefboom', dag: DAG, wat: 'Organization, WebSite, Article, Breadcrumb en FAQ beschrijven alleen zichtbare inhoud. Geen claim dat schema citaties oplevert.' },
      { les: 'lastmod-eerlijk', dag: DAG, wat: 'Vaste wijzigingsdatum bij deze inhoudelijke dossieruitbreiding; geen dagelijks vooruitgeschoven sitemapdatum.' }
    ],
    proeven: [
      { id: 'wam-dossiers-ontdekking-20261124', les: 'interne-links-niet-geindexeerd', urls: ['/dossier/blendle', '/dossier/anp', '/dossier/hosters'], controle: [], metric: 'index', na: 21, wat: 'Observationele opvolging vanaf 24 november: dossiers prominenter, primaire broninhoud en concrete vragen toegevoegd. Geen gerandomiseerde controle of causale claim; meerdere wijzigingen tegelijk. Eerste bevestigde Google/Bing-opname en latere zoekvertoningen vastleggen. Ontbrekende Search Console-toegang blijft onbekend.' },
      { id: 'wam-dossiers-ai-bronnen-20261124', les: 'ai-vast-panel-echte-citaten', urls: ['/dossier/blendle', '/dossier/anp', '/dossier/hosters', '/vriendenloterij-opzeggen'], controle: [], metric: 'llm', na: 28, wat: 'Vier vaste Nederlandse lezersvragen in site.vragen. Bronverwijzing naar WAM apart volgen van merkvermelding. De losse Perplexity-gatscan van 24 november is een diagnose en geen vergelijkbare nulmeting voor de dagelijkse meetlus. Geen gegarandeerde citaties.' }
    ],
    gapscan: { dag: DAG, model: 'perplexity/sonar', vragen: 4, gelukt: 4, bron: 'ZICHT gapscan wam-dossiers-20261124', afbakening: 'Eén AI met vier vragen; geen meting van alle LLMs of SEO-posities.' }
  };
}
export function wamLlms() {
  return '# we are many now\n\nNederlandse dossiersite van Adsfair B.V. Losse consumentenklachten worden per onderwerp gebundeld. De homepage zet concrete eigen dossiers voorop; reviews en algemene bedrijfssignalen zijn achtergrond.\n\n## Concrete dossiers en onderzoek\n\n' + DOSSIERLIJST.map(d => '- ' + d.titel + ': ' + BASIS + '/dossier/' + d.id + '\n  ' + d.status + '. ' + d.bewijsStatus + '. ' + (d.laatsteStuk ? 'Laatste gelezen stuk: ' + d.laatsteStuk + '. ' : '') + 'Redactionele controle: ' + DAG + '.').join('\n') + '\n\n## Praktische vragen\n\n- Videoland opzeggen, betaalroute en ontbrekende opzegknop: https://wearemany.now/bedrijven/videoland#opzeggen\n- VriendenLoterij rechtstreeks opzeggen: ' + BASIS + '/vriendenloterij-opzeggen\n\n## Achtergrond en meedoen\n\n- Bronnenbeeld van tien bedrijven: ' + BASIS + '/bedrijven\n- Bronnen en moderatie: ' + BASIS + '/werkwijze\n- Melding insturen: ' + BASIS + '/start\n- Privacy: ' + BASIS + '/privacy\n- Sitemap: ' + BASIS + '/sitemap.xml\n\nDe dossierpagina’s bevatten primaire feiten, zichtbare tijdlijnen, bronverantwoording, bedrijfsreacties en concrete vragen. Een meldersclaim, een bedrijfsantwoord en een bewezen oplossing blijven onderscheiden. Er zijn geen eigen juridische oordelen of reviewscores uitgerekend. Lezersreacties verschijnen alleen na moderatie, anoniem en per onderwerp gebundeld.\n';
}
export async function wamIndexNow() {
  const inhoud = createHash('sha256').update(JSON.stringify({ dossiers: DOSSIERLIJST, hulp: PRAKTISCHE_HULP })).digest('hex');
  const vorig = await kv.get('wmn:indexnow').catch(() => null);
  if (vorig?.inhoud === inhoud && [200, 202].includes(vorig.status) && Date.now() - vorig.t < 86400000) return { ok: true, hergebruikt: true, status: vorig.status, urls: WAM_INDEXNOW_URLS.length };
  const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: 'wearemany.now', key: WAM_INDEXNOW_BEWIJS, keyLocation: BASIS + '/wam-indexnow.txt', urlList: WAM_INDEXNOW_URLS }), signal: AbortSignal.timeout(15000) });
  const state = { t: Date.now(), status: r.status, inhoud, urls: WAM_INDEXNOW_URLS.length }; await kv.set('wmn:indexnow', state, { ex: 60 * 86400 });
  return { ok: r.status === 200 || r.status === 202, status: r.status, urls: WAM_INDEXNOW_URLS.length, betekenis: 'Ontvangst door IndexNow, geen bewijs van indexering of AI-citatie.' };
}
