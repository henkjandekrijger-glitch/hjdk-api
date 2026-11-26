import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { bronVan, bronScript, eventsPerDag } from '../lib/gids-groei.js';

test('Pinterest app zonder verwijzer: dezelfde bron in browser en server', () => {
  const landing = 'https://gids.kadoly.com/tv-meubel-breedte-berekenen?utm_source=Pinterest&utm_medium=organic_social&utm_campaign=gids-tv-20261125';
  const context = vm.createContext({ URL, location: { href: landing } });
  vm.runInContext(bronScript, context);
  assert.equal(bronVan('', landing), 'pinterest');
  assert.equal(vm.runInContext("gidsBron('')", context), 'pinterest');
  assert.equal(vm.runInContext("gidsBron('https://www.google.nl/')", context), 'pinterest');
});

test('Echte Pinterest-hosts wel, gelijkende namen en queryteksten niet', () => {
  for (const host of ['www.pinterest.com', 'nl.pinterest.com', 'pinterest.nl', 'pinterest.co.uk', 'pin.it']) {
    assert.equal(bronVan('https://' + host + '/pin/123'), 'pinterest', host);
  }
  for (const url of ['https://pinterest.com.evil.example/', 'https://notpinterest.com/', 'https://example.com/?ref=pinterest.com']) {
    assert.equal(bronVan(url), 'overig', url);
  }
  assert.equal(bronVan('', 'https://gids.kadoly.com/?utm_source=pinterest-fake'), 'direct');
  assert.equal(bronVan('', 'onjuist'), 'direct');
  assert.equal(bronVan(''), 'direct');
  assert.equal(bronVan('https://www.google.nl/search'), 'google');
  assert.equal(bronVan('', 'https://gids.kadoly.com/?utm_source=flipboard'), 'flipboard');
});

test('Pinterest-events worden geen zoekbezoek of AI-citaat', () => {
  assert.deepEqual(eventsPerDag({ 'tv-rekenhulp|v-pinterest': 3 }), {
    zoek: 0, ai: 0, perPagina: { 'tv-rekenhulp': { zoek: 0, ai: 0, overig: 3 } }
  });
});
