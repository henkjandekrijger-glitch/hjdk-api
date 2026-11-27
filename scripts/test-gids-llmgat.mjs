// Test AI-gaten cadeauvragen (taak o9w904): met de schakelaar uit is elke gids gelijk; aan: vraag eerst in FAQ en opening zichtbaar; ontbrekend product: gids ongewijzigd.
import assert from 'node:assert/strict';
import { GATEN, toepas, vul, pidsVan, VLAG } from '../lib/gids-llmgat.js';
import { GIDSEN } from '../lib/gidsen-kadoly.js';
const N = v => Number(v) || 0, euro = v => '€' + N(v).toFixed(2).replace('.', ','), thuis = i => N(i.p) + (i.fs ? 0 : N(i.vk));
const bad = /[\u2013\u2014]|\bnog geen\b|niet kunnen vinden|could not find/i;
assert.equal(GATEN.length, 5); assert.equal(VLAG, 'gk:llmgat:aan');
const cat = {};
for (const d of GATEN) { const g = GIDSEN[d.slug]; assert.ok(g, 'gids bestaat ' + d.slug);
  for (const pid of pidsVan(d.opening + d.antwoord)) { assert.ok((g.keuze || []).some(k => k.pid === pid), d.slug + ' noemt ' + pid + ' die niet in de gids staat'); cat[pid] = { id: pid, t: pid, p: 20, vk: 0, fs: 1 }; }
  assert.ok(!bad.test(d.vraag + d.opening + d.antwoord), 'tekstregel ' + d.slug); assert.ok(d.meting.genoemd.length && d.meting.eersteKeus === false); }
for (const d of GATEN) { const g = GIDSEN[d.slug];
  assert.equal(toepas(g, { aan: false, cat, thuis, euro }), g, 'uit = zelfde object ' + d.slug);
  assert.equal(toepas(g, { aan: undefined, cat, thuis, euro }), g);
  const h = toepas(g, { aan: true, cat, thuis, euro });
  assert.equal(h.faq[0].v, d.vraag, 'vraag is eerste FAQ ' + d.slug); assert.ok(h.faq[0].a.includes('€20,00') && !/\{p:/.test(h.faq[0].a));
  assert.equal(h.faq.filter(f => f.v === d.vraag).length, 1, 'geen dubbele vraag'); assert.equal(h.faq.length, g.faq.length + (g.faq.some(f => d.vervangt.includes(f.v) && f.v !== d.vraag) || g.faq.some(f => f.v === d.vraag) ? 0 : 1), 'aantal FAQ ' + d.slug);
  assert.ok(h.llmOpening.startsWith(d.opening.slice(0, 20)) && h.llmOpening.includes('€20,00') && !/\{p:/.test(h.llmOpening));
  assert.equal(g.llmOpening, undefined, 'origineel niet aangeraakt');
  const k = { ...cat }; delete k[pidsVan(d.opening)[0]]; assert.equal(toepas(g, { aan: true, cat: k, thuis, euro }), g, 'product weg = ongewijzigd ' + d.slug);
  const k2 = { ...cat, [pidsVan(d.opening)[0]]: { ...cat[pidsVan(d.opening)[0]], vr: false } }; assert.equal(toepas(g, { aan: true, cat: k2, thuis, euro }), g, 'niet leverbaar = ongewijzigd');
}
assert.equal(vul('x {p:nee}', {}, thuis, euro), null);
assert.equal(toepas(GIDSEN['eettafel'], { aan: true, cat, thuis, euro }), GIDSEN['eettafel'], 'gids zonder gat ongewijzigd');
console.log('ok: 5 gaten, uit = ongewijzigd, aan = vraag eerste FAQ en opening, ontbrekend product = ongewijzigd');
