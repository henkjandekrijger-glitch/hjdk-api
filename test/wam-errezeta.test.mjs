import test from 'node:test';
import assert from 'node:assert/strict';
import { DOSSIERLIJST } from '../lib/wam-dossiers.js';
import { pagina, PADEN, slugVan, paginaBijBedrijf } from '../lib/wam-dossier.js';
import { REACTIE_BEDRIJVEN, bewaarReactie } from '../lib/wam-reacties.js';
import { aanmelden, volgScope } from '../lib/wam-aanmelden.js';
import { WAM_INDEXNOW_URLS, wamLlms, schemaVoorPagina } from '../lib/wam-vindbaarheid.js';

const d = DOSSIERLIJST.find(d => d.id === 'errezeta');
test('Errezeta toont alleen de twee gecontroleerde betalingen en het gecorrigeerde bedrag', () => {
  assert.deepEqual(d.betalingen.map(p => [p.datum,p.bedrag]), [['2023-12-22',40000],['2024-02-01',10000]]);
  assert.equal(d.betalingen.reduce((s,p)=>s+p.bedrag,0),50000);
  const h = pagina('dossier/errezeta', true);
  assert.ok(h.includes('id="betalingen"') && h.includes('€50.000,00'));
  assert.ok(h.includes('€60.000 naar €50.000') && h.includes('2026-06-22'));
  assert.ok(h.includes('contractprijs tellen we niet op'));
});
test('dossier neemt herstel en mogelijk tegenstuk mee zonder oplichting als feit vast te stellen', () => {
  const h = pagina('dossier/errezeta', true);
  for (const t of ['herstelvoorstellen','afwikkelingstekst','Verzending, ondertekening','WAM heeft daarmee zelf een belang','Een actuele inhoudelijke reactie','geen strafrechtelijk vonnis']) assert.ok(h.includes(t),t);
  assert.ok(!h.includes('zijn oplichters') && !h.includes('geen diensten geleverd'));
  assert.ok(d.documenten.length && d.leiding[0].naam === 'Fabiana D’Amiano');
});
test('privébronnen en herleidbare gegevens worden niet in de dossierpublicatie opgenomen', () => {
  const s=JSON.stringify(d), h=pagina('dossier/errezeta',true);
  for(const x of [s,h]) assert.ok(!/docs\.google\.com|drive\.google\.com|mail\.google\.com|sdmntpr|IBAN|@gmail|@yoo|\b[A-Z]{2}\d{2}\s?[A-Z0-9]{10}|Siegfried|Filichito|September 2001|Password:|Username:|attachment_id/i.test(x));
  assert.ok(d.bronnen.every(b=>new URL(b.url).hostname==='find-and-update.company-information.service.gov.uk'));
  assert.ok(h.includes('privégegevens') && h.includes('gebundeld'));
});
test('nieuw dossier is vindbaar en de FAQ beschrijft dezelfde zichtbare inhoud', () => {
  const h=pagina('dossier/errezeta',true), home=pagina('nl',true), idx=pagina('dossiers',true);
  assert.ok(PADEN.includes('dossier/errezeta'));
  assert.ok(home.includes('href="/dossier/errezeta"') && idx.includes('href="/dossier/errezeta"'));
  assert.ok(home.indexOf(d.kaartTitel) < home.indexOf('Praktische hulp en ervaringen'));
  assert.ok(WAM_INDEXNOW_URLS.includes('https://wearemany.now/dossier/errezeta'));
  assert.ok(wamLlms().includes('https://wearemany.now/dossier/errezeta'));
  assert.ok(h.includes('rel="canonical" href="https://wearemany.now/dossier/errezeta"'));
  const g=schemaVoorPagina('/dossier/errezeta',d.seoTitel,d.kort)['@graph'];
  assert.equal(g.find(x=>x['@type']==='Article').headline,d.titel);
  for(const q of g.find(x=>x['@type']==='FAQPage').mainEntity) assert.ok(h.includes(q.name)&&h.includes(q.acceptedAnswer.text));
});
test('ervaring insturen en het juiste dossier volgen zijn ook voor Errezeta toegestaan', async () => {
  assert.ok(REACTIE_BEDRIJVEN.has('errezeta'));
  assert.equal(slugVan('Errezeta Publishing Ltd'),'errezeta');
  assert.equal(slugVan('Errezeta Publishing'),'errezeta');
  assert.equal(paginaBijBedrijf(slugVan('Errezeta Publishing Ltd')),'/dossier/errezeta');
  assert.equal(paginaBijBedrijf('__proto__'),'');
  assert.equal(paginaBijBedrijf('constructor'),'');
  for(const d of DOSSIERLIJST) assert.ok(PADEN.includes(paginaBijBedrijf(d.id).slice(1)));
  assert.notEqual(slugVan('Errezeta Service SRL'),'errezeta');
  assert.equal(volgScope('/dossier/errezeta'),'errezeta');
  const h=pagina('dossier/errezeta',true);
  assert.ok(h.includes('data-bedrijf="errezeta"') && h.includes('data-scope="errezeta"'));
  assert.ok(h.includes('data-volg>Volg deze oproep'));
  assert.ok(h.includes('placeholder="Wat is er bij jou gebeurd?"'));
  const calls=[], db={incr:async()=>1, raw:async a=>{calls.push(a);return a[0]==='EVAL'?'OK':1;}};
  const r=await bewaarReactie({bedrijf:'errezeta',thema:'uitvoering',ervaring:'aanvulling',tekst:'Een concrete ervaring die eerst door de redactie wordt gecontroleerd.',akkoord:true},'proef',db);
  assert.ok(r.ok && r.status==='wacht-op-moderatie');
  assert.ok(calls.some(a=>a[0]==='EVAL'));
  const a=await aanmelden({email:'lezer@example.invalid',scope:'errezeta',toestemming:true},'proef',{incr:async()=>1,raw:async()=>1});
  assert.ok(a.ok && a.nieuw);
});
test('oproep zoekt andere gedupeerden met één veld vooraan; eigen bewijs blijft uitklapbaar aanwezig', () => {
  const h=pagina('dossier/errezeta',true), home=pagina('nl',true);
  assert.equal(d.soort,'oproep');
  assert.ok(h.includes('<h1>Ook gedupeerd door Errezeta Publishing?</h1>'));
  assert.equal((h.match(/id="reageren"/g)||[]).length,1);
  assert.equal((h.match(/data-bedrijf="errezeta"/g)||[]).length,1);
  assert.ok(h.indexOf('id="reageren"') < h.indexOf('id="eigen-dossier"'));
  assert.ok(h.includes('<details class="sources" id="eigen-dossier">'));
  for(const t of ['De betalingen in de bankdocumenten','€40.000,00','€10.000,00','2026-06-22','afwikkelingstekst','gaat eerst naar de redactie']) assert.ok(h.includes(t),t);
  assert.ok(h.includes('Volg deze oproep.</h2>'));
  assert.ok(home.includes('Oproep aan andere gedupeerden') && home.includes('Wat is er bij jou gebeurd?'));
  const graph=schemaVoorPagina('/dossier/errezeta',d.seoTitel,d.kort)['@graph'];
  assert.equal(graph.find(x=>x['@type']==='Article').articleSection,'Oproep aan gedupeerden');
});
