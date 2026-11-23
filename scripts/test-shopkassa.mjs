import test from 'node:test';
import assert from 'node:assert/strict';
import { kassaTeller, kassaBestellingen } from '../lib/shopkassa.js';

const nu = Date.parse('2026-11-23T14:00:00Z');
const order = (id, at, status = 'paid', extra = {}) => ({ order: id, at, status, methode: 'ideal', net: 'tt', test: false, ...extra });

test('checkoutlanding en lang vertrek blijven aparte tellers, in beide routes', () => {
  for (const arm of ['d', 'l']) {
    const rec = { arm, ka: true };
    assert.equal(kassaTeller(rec, 'kpag', 'kp'), arm + 'k0');
    assert.equal(kassaTeller(rec, 'kweglang', 'kl'), arm + 'k9');
    assert.equal(kassaTeller({ arm, ka: false }, 'kpag', 'kp'), arm + 'kp');
    assert.equal(kassaTeller(rec, 'kpay', 'kb'), arm + 'kb');
  }
});

test('7 dagen neemt oude PayPal-orders niet mee; dezelfde feed met 28 dagen wel', () => {
  const rows = [order('oud', '2026-11-03T12:00:00Z', 'expired', { methode: 'paypal', net: 'pa' }), order('nieuw', '2026-11-19T21:00:00Z')];
  const week = kassaBestellingen(rows, { dagen: 7, nu });
  assert.equal(week.totaal, 1);
  assert.equal(week.uitgesloten.buitenPeriode, 1);
  assert.equal(week.perMethode.ideal.betaald, 1);
  assert.equal(week.perMethode.paypal, undefined);
  assert.equal(kassaBestellingen(rows, { dagen: 28, nu }).totaal, 2);
});

test('UTC-kalendergrens is gelijk aan de dagtellers', () => {
  const r = kassaBestellingen([order('voor', '2026-11-16T23:59:59Z'), order('op', '2026-11-17T00:00:00Z')], { dagen: 7, nu });
  assert.equal(r.periode.van, '2026-11-17T00:00:00.000Z');
  assert.deepEqual(r.lijst.map(x => x.order), ['op']);
});

test('testorders, dubbele regels, ontbrekende datums en toekomst tellen niet als klanten', () => {
  const rows = [order('een', '2026-11-20T10:00:00Z'), order('een', '2026-11-20T10:00:00Z'), order('test', '2026-11-20T10:00:00Z', 'paid', { test: true }), order('geen-datum', ''), order('toekomst', '2026-11-24T00:00:00Z'), order('onbekend', '2026-11-20T11:00:00Z', 'paid', { test: null })];
  const r = kassaBestellingen(rows, { nu });
  assert.equal(r.totaal, 2);
  assert.deepEqual(r.uitgesloten, { buitenPeriode: 0, datumOntbreekt: 1, toekomst: 1, test: 1, dubbel: 1 });
  assert.equal(r.teststatusOnbekend, 1);
});

test('unpaid en pending_payment worden nooit door substringmatching betaald', () => {
  const r = kassaBestellingen(['paid', 'unpaid', 'pending_payment', 'expired', 'refunded'].map((s, i) => order(String(i), '2026-11-20T10:00:00Z', s)), { nu });
  assert.equal(r.perNet.tt.betaald, 1);
  assert.equal(r.perNet.tt.verlopen, 1);
  assert.equal(r.perNet.tt.anders, 3);
  assert.equal(r.perDag['2026-11-20'].bestellingen, 5);
});

test('geen feeddata geeft geen verzonnen succespercentage', () => {
  const r = kassaBestellingen([], { nu, feedFout: 'HTTP 503' });
  assert.equal(r.totaal, 0);
  assert.equal(r.feedFout, 'HTTP 503');
  assert.deepEqual(r.perNet, {});
  assert.match(r.meetdefinitie, /Geen bevestigde providerstarts/);
});
