import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pagina, sitemapLastmod } from '../lib/wam-dossier.js';
import { DOSSIERLIJST } from '../lib/wam-dossiers.js';
import { onderzoekBronnen } from '../lib/wam-onderzoek.js';
const d = DOSSIERLIJST.find(d => d.id === 'anp');
const html = pagina('dossier/anp', true);
test('de oorspronkelijke claim en zijn tijdlijn blijven gescheiden van openbare procedures', () => {
  const basis = JSON.parse(fs.readFileSync(new URL('../data/wam/dossier-anp-2026-11-25.json', import.meta.url), 'utf8'));
  for (const k of ['kosten', 'feiten', 'tijdlijn', 'bedragen', 'laatsteStuk']) assert.deepEqual(d[k], basis[k], k);
  assert.ok(html.indexOf('id="rechtszaken"') < html.indexOf('id="eigen-claim"'));
  assert.equal(d.onderzoek.rechtspraak.length, 8);
});
test('ieder onderzoeksfeit heeft een geldige bronverwijzing; broncatalogus en ankers zijn volledig', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'dubbele HTML-id');
  for (const m of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(m[1]), m[1]);
  assert.equal(new Set(d.bronnen.map(b => b.id)).size, d.bronnen.length);
  for (const b of d.bronnen) { assert.equal(new URL(b.url).protocol, 'https:'); assert.equal(b.datum || b.geraadpleegd, '2026-11-25'); assert.ok(html.includes(b.naam.replace(/&/g, '&amp;').replace(/'/g, '&#39;'))); }
  assert.throws(() => onderzoekBronnen(d, ['bestaat-niet']), /Ontbrekende onderzoeksbron/);
  const cases = d.verdieping.find(s => s.id === 'rechtszaken').items;
  assert.equal(cases.length, 2);
  for (const c of cases) assert.ok(c.bronIds.some(id => /^v\d/.test(id)));
});
test('twee fondsen en de hangende processtand worden als afzonderlijke zaken weergegeven', () => {
  const fondsen = d.verdieping.find(s => s.id === 'crowdfunding');
  assert.ok(fondsen.items[0].bronIds.includes('crowd-bakx'));
  assert.ok(fondsen.items[1].bronIds.includes('crowd-kaviaar'));
  assert.notEqual(d.bronnen.find(b => b.id === 'crowd-bakx').url, d.bronnen.find(b => b.id === 'crowd-kaviaar').url);
  assert.ok(d.vragen.find(q => q.vraag.includes('al gewonnen')).antwoord.includes('geen eindvonnis'));
  assert.ok(d.verdieping.find(s => s.id === 'openbare-tijdlijn').items.some(i => i.kop.includes('2027') && i.alineas.join(' ').includes('planning kan wijzigen')));
});
test('zichtbare datum, Article, sitemap en FAQ blijven gelijk; scripts parsen', () => {
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.equal(graph.find(x => x['@type'] === 'Article').dateModified, '2026-11-25');
  assert.equal(sitemapLastmod('/dossier/anp'), '2026-11-25');
  assert.ok(html.includes('bijgewerkt <time datetime="2026-11-25">'));
  const faq = graph.find(x => x['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, d.vragen.length);
  for (const q of faq.mainEntity) assert.ok(html.includes(q.name.replace(/&/g, '&amp;')));
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(m[1]);
});
test('openbaar brononderzoek houdt ANP en makers zichtbaar en bevat geen privécontactgegevens', () => {
  assert.equal(d.verdieping.find(s => s.id === 'perspectieven').items.length, 10);
  assert.ok(d.verdieping.find(s => s.id === 'perspectieven').items.some(i => i.kop === 'De fotograaf'));
  assert.ok(d.onderzoek.rechtspraak.some(i => i.uitkomst.includes('toegewezen')));
  assert.ok(!/\b(?:Case-ID|Pincode|Wachtwoord):|[\w.+-]+@[\w.-]+\.[a-z]{2,}|—/.test(JSON.stringify(d)));
});
