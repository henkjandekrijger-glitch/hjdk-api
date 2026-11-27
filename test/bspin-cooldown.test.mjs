import test from 'node:test';
import assert from 'node:assert/strict';
import { boekenInAfkoeling, pinPlan, HAKEN } from '../lib/bspin.js';
const nu = Date.parse('2026-11-26T12:00:00Z');
const alles = [...new Set(HAKEN.flatMap(h => h.boeken))];
const a = 'B0B5KV79N1';
test('een leeg kandidatenveld valt nooit terug op uitgesloten boeken', () => {
  assert.deepEqual(pinPlan({}, { gisteren: alles, nu, rnd: () => 0 }), []);
});
test('dezelfde ASIN verschijnt niet via twee haken in dezelfde batch', () => {
  const pins = pinPlan({ 'lc-jaar': { klik: 100 }, 'lc-66': { klik: 100 }, 'lc-stappen': { klik: 100 } }, { aantal: 8, nu, rnd: () => 0 });
  assert.ok(pins.length > 0);
  assert.equal(new Set(pins.map(p => p.a)).size, pins.length);
});
test('ook een product van 13 dagen geleden blijft uitgesloten', () => {
  const log = [{ a, t: '2026-11-13T12:00:00Z' }];
  assert.ok(boekenInAfkoeling(log, nu).has(a));
  assert.ok(!pinPlan({ 'enoch-wat': { klik: 99999 } }, { log, nu, rnd: () => 0 }).some(p => p.a === a));
});
test('exact 14 dagen oud is weer beschikbaar; één milliseconde jonger niet', () => {
  assert.ok(!boekenInAfkoeling([{ a, t: '2026-11-12T12:00:00Z' }], nu).has(a));
  assert.ok(boekenInAfkoeling([{ a, t: '2026-11-12T12:00:00.001Z' }], nu).has(a));
});
test('ongeldige of toekomstige registratietijd geeft geen vrije capaciteit', () => {
  for (const t of [null, '', 'onbekend', '2026-12-01T12:00:00Z']) assert.ok(boekenInAfkoeling([{ a, t }], nu).has(a));
});
test('één recente registratie houdt een product tegen ondanks oudere registratie', () => {
  assert.ok(boekenInAfkoeling([{ a, t: '2026-10-01T00:00:00Z' }, { a, t: '2026-11-25T00:00:00Z' }], nu).has(a));
});
test('alle geregistreerde producten in cooldown betekent een kleiner of leeg plan', () => {
  assert.deepEqual(pinPlan({}, { log: alles.map(a => ({ a, t: '2026-11-25T00:00:00Z' })), nu, aantal: 8, rnd: () => 0 }), []);
});
test('plan behoudt accountbestemmingen, UTM en maximaal twee pins per bord', () => {
  const pins = pinPlan({}, { aantal: 8, nu, rnd: () => 0 });
  const perBord = {};
  for (const p of pins) { assert.ok(/^https:\/\/(stockingbooks.com|lastingchange.works)\//.test(p.link)); assert.equal(new URL(p.link).searchParams.get('utm_content'), p.id); assert.ok(p.id.startsWith('20261126-')); perBord[p.bord] = (perBord[p.bord] || 0) + 1; }
  assert.ok(Object.values(perBord).every(n => n <= 2));
});
test('ongeldige historie of meettijd wordt geweigerd', () => {
  assert.throws(() => boekenInAfkoeling({}, nu), /ongeldige/);
  assert.throws(() => boekenInAfkoeling([], NaN), /ongeldige/);
});

import { readFileSync } from 'node:fs';
const handlerSource = readFileSync(new URL('../fn/bs.js', import.meta.url), 'utf8');
const route = handlerSource.slice(handlerSource.indexOf("  if (op === 'pinplan' || op === 'pinstand')"), handlerSource.indexOf("  if (op === 'pinlog' || op === 'pinuitkomst')"));
const runRoute = new Function('kv','op','stuur','res','q','PIN_ACCOUNT','HAKEN','pinPlan', 'return (async () => {' + route + '})()');
const respond = (res,status,type,body) => ({ status, body: JSON.parse(body) });
test('bestaand pinplan-eindpunt geeft 503 als historie niet leesbaar is', async () => {
  let called = false;
  const kv = { get: async key => { if (key === 'bs:pinlog') throw Error('offline'); return {}; } };
  const r = await runRoute(kv,'pinplan',respond,{},new URLSearchParams(),'account',HAKEN,() => { called = true; });
  assert.equal(r.status,503); assert.equal(called,false); assert.equal(r.body.ok,false);
});
test('bestaand pinplan-eindpunt geeft 503 voor corrupte historie', async () => {
  for (const missing of [null, {}]) {
    const kv = { get: async () => missing };
    const r = await runRoute(kv,'pinplan',respond,{},new URLSearchParams(),'account',HAKEN,() => assert.fail('geen kandidaten'));
    assert.equal(r.status,503);
  }
});
test('route geeft de volledige gedeelde historie aan de selectie en reserveert niets', async () => {
  const history = [{ a, t:'2026-11-13T12:00:00Z' }];
  const kv = { get: async key => key === 'bs:pinlog' ? history : {} };
  let passed;
  const r = await runRoute(kv,'pinplan',respond,{},new URLSearchParams('n=3'),'account',HAKEN,(stand,opts) => { passed=opts; return []; });
  assert.equal(r.status,200); assert.deepEqual(passed.log,history); assert.equal(passed.aantal,3);
  assert.equal(r.body.controle.afkoeldagen,14); assert.equal(r.body.controle.reservering,false);
});
test('schakelaar: vlag uit = plan zoals nu, vlag aan = geen boekpins meer naar het Kadoly-account', async () => {
  assert.ok(pinPlan({}, { nu, rnd: () => 0 }).length > 0);
  assert.deepEqual(pinPlan({}, { nu, rnd: () => 0, uit: false }), pinPlan({}, { nu, rnd: () => 0 }));
  assert.deepEqual(pinPlan({}, { nu, rnd: () => 0, uit: true }), []);
  const kv = { get: async key => key === 'bs:pinuit' ? { t: 'x' } : key === 'bs:pinlog' ? [] : {} };
  const r = await runRoute(kv, 'pinplan', respond, {}, new URLSearchParams(), 'account', HAKEN, (s, o) => pinPlan(s, o));
  assert.deepEqual(r.body.pins, []); assert.equal(r.body.boekpinsUit, true);
  const kv2 = { get: async key => key === 'bs:pinlog' ? [] : {} };
  const r2 = await runRoute(kv2, 'pinplan', respond, {}, new URLSearchParams(), 'account', HAKEN, (s, o) => pinPlan(s, o));
  assert.equal(r2.body.boekpinsUit, false); assert.ok(r2.body.pins.length > 0);
});
