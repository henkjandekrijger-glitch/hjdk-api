const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const policy = fs.readFile(path.join(__dirname, '../lib/organic-policy.js'), 'utf8').then(s => import('data:text/javascript;base64,' + Buffer.from(s).toString('base64')));
const now = Date.parse('2026-10-20T12:00:00Z');
const index = { dag: '2026-10-20', bekeken: 466, inSitemap: 466, geindexeerd: 113 };
test('groeiende ongeïndexeerde voorraad begrenst ieder lokaal dagdoel', async () => {
  const { publicationBudget } = await policy;
  assert.equal(publicationBudget('kz', 12, index, now).perDag, 2);
  assert.equal(publicationBudget('us', 10, { ...index, bekeken: 123, inSitemap: 123, geindexeerd: 6 }, now).perDag, 1);
  assert.equal(publicationBudget('de', 10, { ...index, bekeken: 95, inSitemap: 95, geindexeerd: 1 }, now).perDag, 1);
});
test('uitgeschakelde of lagere instellingen worden nooit omhoog gezet', async () => {
  const { publicationBudget } = await policy;
  assert.equal(publicationBudget('kz', 0, index, now).perDag, 0);
  assert.equal(publicationBudget('kz', 1, index, now).perDag, 1);
  assert.equal(publicationBudget('us', NaN, index, now).perDag, 0);
});
test('volledige verse gezonde indexering herstelt het ingestelde doel', async () => {
  const { publicationBudget } = await policy;
  assert.equal(publicationBudget('kz', 12, { ...index, geindexeerd: 300 }, now).perDag, 12);
});
test('ontbrekende, oude, onvolledige of toekomstige meting geeft geen groeiverlof', async () => {
  const { publicationBudget } = await policy;
  for (const sample of [null, { ...index, dag: '2026-10-16', geindexeerd: 300 }, { ...index, bekeken: 30, geindexeerd: 29 }, { ...index, dag: '2026-10-22', geindexeerd: 300 }]) {
    assert.equal(publicationBudget('kz', 12, sample, now).perDag, 2);
  }
});
test('28 dagen is exact 28 inclusieve dagen, over maandgrenzen heen', async () => {
  const { gscWindow } = await policy;
  const w = gscWindow(28, now);
  assert.deepEqual(w, { startDate: '2026-09-21', endDate: '2026-10-18' });
  assert.equal((Date.parse(w.endDate) - Date.parse(w.startDate)) / 864e5 + 1, 28);
});
test('onbekende versdatum wordt weggelaten, werkelijke recentste datum behouden', async () => {
  const { contentDate } = await policy;
  assert.equal(contentDate({}), null);
  assert.equal(contentDate({ updatedAt: 'ongeldig' }), null);
  assert.equal(contentDate({ publishAt: '2026-10-01', updatedAt: '2026-10-17' }), '2026-10-17');
});
test('focus groepeert echte zoekvragen per bestaande URL en sluit positie 23 uit', async () => {
  const { organicOpportunities } = await policy;
  const p = organicOpportunities({ kansen: [{ slug: 'printer', q: 'printer keuzehulp', pos: 23, imp: 27 }, { slug: 'kinderfiets', q: 'kinderfiets maat bepalen', pos: 6, imp: 5 }, { slug: 'kinderfiets', q: 'hoogte kinderfiets bepalen', pos: 17.5, imp: 8 }, { slug: 'strijkplank', q: 'afmetingen strijkplank', pos: 14.3, imp: 7 }, {slug: 'boxspring', q:'ayla matrassen', pos:10, imp:10}] });
  assert.equal(p[0].slug, 'kinderfiets'); assert.equal(p[0].vragen.length, 2); assert.equal(p.length, 2);
});
const urls = (kind, n) => Array.from({ length: n }, (_, i) => `https://keuzehulp.best/${kind}-${i}`);
test('indexproef met één succes of zonder controle kan geen winnaar worden', async () => {
  const { indexEvidence } = await policy;
  const p = { urls: urls('test', 1), controle: [], klaar: '2026-10-20' };
  const ix = { dag: '2026-10-20', alles: p.urls.map(url => ({ url, dag: '2026-10-20', verdict: 'PASS' })) };
  assert.equal(indexEvidence(p, ix, now).uitkomst, 'te-weinig');
});
test('oude individuele inspecties geven geen bewijs, ook al is de samenvatting vers', async () => {
  const { indexEvidence } = await policy;
  const p = { urls: urls('test', 20), controle: urls('control', 20), klaar: '2026-10-20' };
  const ix = { dag: '2026-10-20', alles: [...p.urls, ...p.controle].map(url => ({ url, dag: '2026-10-18', verdict: 'PASS' })) };
  const result = indexEvidence(p, ix, now); assert.equal(result.uitkomst, 'te-weinig'); assert.equal(result.test.gemeten, 0);
});
test('voldoende verse gecontroleerde indexwaarnemingen kunnen wel leren', async () => {
  const { indexEvidence } = await policy;
  const p = { urls: urls('test', 100), controle: urls('control', 100), klaar: '2026-10-20' };
  const ix = { dag: '2026-10-20', alles: [...p.urls.map((url, i) => ({ url, dag: '2026-10-20', verdict: i < 80 ? 'PASS' : 'FAIL' })), ...p.controle.map((url, i) => ({ url, dag: '2026-10-20', verdict: i < 30 ? 'PASS' : 'FAIL' }))] };
  assert.equal(indexEvidence(p, ix, now).uitkomst, 'beter');
});
const baseline = { meetversie: 'gsc-page-v2', periode: { startDate: '2026-08-01', endDate: '2026-08-28' }, paginas: { '/test': { imp: 300 }, '/control': { imp: 300 } } };
const after = { meetversie: 'gsc-page-v2', periode: { startDate: '2026-09-01', endDate: '2026-09-28' }, paginas: { '/test': { imp: 900 }, '/control': { imp: 300 } } };
test('SEO-bewijs vereist gescheiden meetvensters en hetzelfde paginatotaal', async () => {
  const { gscEvidence } = await policy; const p = { urls: ['https://x/test'], controle: ['https://x/control'], voor: baseline };
  assert.equal(gscEvidence(p, after).uitkomst, 'beter');
  assert.equal(gscEvidence(p, { ...after, periode: { startDate: '2026-08-20' } }).uitkomst, 'te-weinig');
  assert.equal(gscEvidence({ ...p, voor: { ...baseline, meetversie: undefined } }, after).uitkomst, 'te-weinig');
  assert.equal(gscEvidence({ ...p, controle: [] }, after).uitkomst, 'te-weinig');
});
test('gelijkmatige sitegroei mag niet als behandelingswinst worden geboekt', async () => {
  const { gscEvidence } = await policy;
  const na = { ...after, paginas: { '/test': { imp: 900 }, '/control': { imp: 900 } } };
  const result = gscEvidence({ urls: ['https://x/test'], controle: ['https://x/control'], voor: baseline }, na);
  assert.equal(result.uitkomst, 'te-weinig'); assert.equal(result.effect, 0);
});
test('Google-totalen gebruiken geen zoekvraagdimensie en vallen bij API-fouten niet terug op nul', async () => {
  const gsc = await fs.readFile(path.join(__dirname, '../lib/gsc.js'), 'utf8');
  const pure = await fs.readFile(path.join(__dirname, '../lib/organic-policy.js'), 'utf8');
  const source = gsc.replace("import { kv } from './db.js';", "const kv = {get: async () => ({ t: 'test-only', exp: Date.now() + 900000 })};").replace("'./organic-policy.js'", JSON.stringify('data:text/javascript;base64,' + Buffer.from(pure).toString('base64')));
  const api = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const realFetch = global.fetch;
  const calls = [];
  try {
    global.fetch = async (url, opts) => { calls.push({ url, body: JSON.parse(opts.body) }); return { ok: true, json: async () => ({ rows: [{ impressions: 1234, clicks: 7, ctr: 7/1234, position: 18 }] }) }; };
    const result = await api.totals('https://keuzehulp.best/', 28);
    assert.equal(result.clicks, 7); assert.equal(result.imp, 1234); assert.deepEqual(calls[0].body.dimensions, []);
    assert.ok(calls[0].url.endsWith('/searchAnalytics/query'));
    global.fetch = async () => ({ ok: false, status: 403, json: async () => ({ error: {} }) });
    await assert.rejects(() => api.totals('https://keuzehulp.best/', 28), /niet beschikbaar/);
  } finally { global.fetch = realFetch; }
});
test('verwante woorden mogen een pagina voor een ander product niet overschrijven', async () => {
  const { queryMatchesGuide } = await policy;
  assert.equal(queryMatchesGuide('wasdroger keuzehulp', 'wasmachine'), false);
  assert.equal(queryMatchesGuide('ayla matrassen', 'boxspring'), false);
  assert.equal(queryMatchesGuide('strijkplank afmetingen', 'strijkplank'), true);
  assert.equal(queryMatchesGuide('sapcentrifuge of slow juicer', 'slowjuicer'), true);
  assert.equal(queryMatchesGuide('welke tv past bij mij', 'tv'), true);
});
test('AI-lus leert alleen uit gepaarde vragen over meerdere vergelijkbare meetdagen', async () => {
  const { llmEvidence } = await policy;
  const history = [];
  const add = (dag, yes, panel = 'same') => history.push({ dag, llmCitatie: { panel, model: 'same-model', perVraag: Array.from({ length: 8 }, (_, i) => ({ id: 'q' + i, geciteerd: yes })) } });
  for (let d = 1; d <= 5; d++) add('2026-10-0' + d, false);
  for (let d = 14; d <= 18; d++) add('2026-10-' + d, true);
  const p = { start: '2026-10-07' };
  const result = llmEvidence(p, history, now);
  assert.equal(result.uitkomst, 'beter'); assert.equal(result.vragen, 8);
  assert.equal(llmEvidence(p, history.slice(-2), now).uitkomst, 'te-weinig');
  assert.equal(llmEvidence(p, history.map(x => x.dag > p.start ? { ...x, llmCitatie: { ...x.llmCitatie, panel: 'changed' } } : x), now).uitkomst, 'te-weinig');
  assert.equal(llmEvidence(p, [...history.slice(0, 5), ...Array(5).fill(history[5])], now).uitkomst, 'te-weinig');
});
