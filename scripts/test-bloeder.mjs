// Test van de bloederregel (lib/bloeder.js) en de TikTok-beslissing (ttOordeel): leertijd, klikratio, geen mens, geen afrekenstap, verkoop, minimum aan.
import assert from 'node:assert/strict';
import { bloeder } from '../lib/bloeder.js';
const { ttOordeel } = await import('../lib/tiktok.js');
assert.equal(bloeder({ vert: 900, kliks: 0, spend: 1.4 }, 'tt'), null, 'leertijd');
assert.equal(bloeder({ vert: 3030, kliks: 8, spend: 0.63 }, 'tt').soort, 'ctr');
assert.equal(bloeder({ vert: 1520, kliks: 6, spend: 0.17 }, 'tt'), null, 'klikratio 0,39% blijft');
assert.equal(bloeder({ vert: 500, kliks: 3, spend: 2.6, echt: 0 }, 'tt').soort, 'mens');
assert.equal(bloeder({ vert: 500, kliks: 3, spend: 2.6 }, 'wh'), null, 'zonder Clickmind per ad geen mensregel');
assert.equal(bloeder({ vert: 900, kliks: 9, spend: 4.1, echt: 2, stap: 0 }, 'tt').soort, 'stap');
assert.equal(bloeder({ vert: 5000, kliks: 1, spend: 9, koop: 1 }, 'tt'), null, 'verkoop gaat nooit uit');
const rij = (id, x) => Object.assign({ id, naam: id, groep: 'g', aan: true, spend: 0, vert: 0, kliks: 0, aanCm: 0, echt: 1, stap: 0 }, x);
const { uit, tegen } = ttOordeel([rij('a', { vert: 3000, kliks: 3, spend: 1 }), rij('b', { vert: 3000, kliks: 2, spend: 0.9 }), rij('c', { vert: 100, spend: 0.1 }), rij('d', { vert: 100, spend: 0.1 }), rij('e', { vert: 100, spend: 0.1 })]);
assert.deepEqual(uit.map(x => x.id), ['a', 'b']); assert.equal(tegen.length, 0);
const r2 = ttOordeel([rij('a', { vert: 3000, kliks: 3, spend: 1 }), rij('c', { vert: 100 }), rij('d', { vert: 100 })]);
assert.deepEqual(r2.uit, []); assert.equal(r2.tegen.length, 1, 'minimum 3 aan per groep');
console.log('bloeder: alle tests geslaagd');
