// Test van de titelproef gratis vermeldingen Kadoly (lib/gmctitel.js, data/kadoly-gmc-titels.json). node scripts/test-gmctitel.mjs
import assert from 'node:assert/strict';
const G = await import('../lib/gmctitel.js');
const t = G.titels(), c = G.controle();
assert.ok(Object.keys(t).length > 0, 'geen titels');
for (const [id, x] of Object.entries(t)) { assert.equal(G.arm(id), 'b', id + ' hoort in arm b'); assert.ok(G.titelOk(x), id + ' titel niet goed: ' + x); assert.ok(!c.includes(id), id + ' staat ook in de controle'); }
for (const id of c) assert.equal(G.arm(id), 'a', id + ' in de controle hoort in arm a');
const { tekst, rijen } = G.csv([]); assert.ok(tekst.startsWith('id,title\n')); assert.equal(rijen, Object.keys(t).length);
assert.equal(G.csv(['bestaat-niet']).rijen, 0, 'ids buiten de feed horen er niet in');
for (const bad of ['Gratis tafelhaard', 'Tafelhaard — rond', 'TAFELHAARD ROND ZAND', 'Kort', 'Tafelhaard € 69']) assert.equal(G.titelOk(bad), false, bad);
const s = G.stand({ [Object.keys(t)[0]]: { gv: 10, gk: 1, bv: 0, bk: 0 } }); assert.equal(s.nieuw.gratisVert, 10); assert.equal(s.controle.gratisVert, 0);
console.log('gmctitel ok:', Object.keys(t).length, 'titels,', c.length, 'controle');
