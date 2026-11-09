import assert from 'node:assert/strict';
import {GIDSEN} from '../lib/gidsen-kadoly.js';
import {BRONNEN,bronnenHtml} from '../lib/gids-onderzoek.js';
const g=GIDSEN['houten-legpuzzel-volwassenen'],s=JSON.stringify(g);
assert.equal(g.keuze.length,6);assert.ok(!s.includes('tenzij een volwassene'));assert.ok(!s.includes('snel mee klaar'));assert.ok(s.includes('puzzeltijd is niet opgegeven'));
assert.ok(s.includes('100 gezonde volwassenen'));assert.ok(s.includes('1.293'));assert.ok(s.includes('Ravensburger'));assert.ok(s.includes('niet zelf getest'));
for(const id of g.bronnen)assert.ok(BRONNEN[id]?.url.startsWith('https://'));
const b=bronnenHtml(g.bronnen,g.bronnenControle);assert.ok(b.includes('Gecontroleerd 2026-11-09'));assert.ok(b.includes('39842256'));assert.ok(b.includes('Financiering niet vastgesteld'));
console.log('Legpuzzel: 6 modellen, leeftijd, tijdsonzekerheid, bronbalans en financiering geslaagd.');
