import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { productFacts, returnPolicy, returnAnswer, widthCheck, chosenVariant, KOOPCHECK_JS } from '../lib/kadolykoopcheck.js';

const dressoir = { id: 'dp_1037', title: 'Tanner Vierdeurs Dressoir in Vlaskleur', type: 'physical', seller_id: 0,
  description_source: 'De Tanner-collectie. Afmetingen: 79 H x 163 B x 46 D cm. Gewicht: 71 kg. Volumemaat: 0,86 m³.' };

test('supplier axes give the dressoir width, never the first number', () => {
  assert.deepEqual(productFacts(dressoir).dimensions, { width: 163, height: 79, depth: 46 });
  assert.deepEqual(productFacts(dressoir).evidence, ['79 H x 163 B x 46 D cm']);
});
test('155 cm fails; 180 cm gives 17 cm, scoped to width', () => {
  assert.deepEqual(widthCheck(163, 155), { status: 'too_wide', spare: -8 });
  assert.deepEqual(widthCheck(163, 180), { status: 'fits_width', spare: 17 });
  assert.deepEqual(widthCheck(163, 163), { status: 'fits_width', spare: 0 });
});
test('own weight is never treated as a load limit', () => {
  const f = productFacts(dressoir); assert.equal(f.ownWeightKg, 71); assert.equal(f.topLoadKg, null);
});
test('missing, unlabelled, packaging and conflicting measurements stay unknown', () => {
  for (const description of ['', '163 x 79 x 46 cm', 'Verpakking: 79 H x 163 B x 46 D cm', 'Packaging dimensions: 79 H x 163 B x 46 D cm']) {
    assert.equal(productFacts({ description }).dimensions.width, null);
  }
  assert.equal(productFacts({ description: '79 H x 163 B x 46 D cm. 79 H x 170 B x 46 D cm.' }).dimensions.width, null);
});
test('millimetres, metres, decimal commas and English W axes are explicit', () => {
  assert.deepEqual(productFacts({ description: '790 H × 1630 W × 460 D mm' }).dimensions, productFacts(dressoir).dimensions);
  assert.equal(productFacts({ description: '0,79 H x 1,63 B x 0,46 D m' }).dimensions.width, 163);
});
test('invalid and missing inputs never create a green result', () => {
  for (const v of ['', ' ', null, undefined, {}, [], 0, -3, Infinity, '180cm', '0x100', '1e3', '1.2.3']) assert.equal(widthCheck(163, v).status, 'invalid');
  assert.equal(widthCheck(null, 180).status, 'unknown');
  assert.deepEqual(widthCheck(163, '180,5'), { status: 'fits_width', spare: 17.5 });
});
test('Droppery costs stay with buyer, regular own catalogue returns free, unknown not guessed', () => {
  assert.equal(returnPolicy(dressoir).cost, 'buyer');
  assert.equal(returnPolicy({ id: 'oc_4251973869322241', seller_id: 0 }).cost, 'free');
  assert.equal(returnPolicy({ id: 'unknown' }).cost, 'unknown');
  assert.equal(returnPolicy({ id: 'dp_1', type: 'digital' }).cost, 'digital');
  assert.equal(returnPolicy({ seller_id: 12 }).cost, 'buyer');
});
test('bracelet material alternatives without variants remain explicitly unconfirmed', () => {
  const description_source = 'A special bracelet.\nMaterials: Choose between sterlingsilver or 14 carat goldplated sterlingsilver\nLenght: 18 cm.';
  assert.equal(productFacts({ description_source }).unconfirmedMaterial, true);
  assert.equal(productFacts({ description_source, variants: [{ id: 'silver' }, { id: 'gold' }] }).unconfirmedMaterial, false);
  assert.equal(productFacts(dressoir).unconfirmedMaterial, false);
});
test('chosen variant follows explicit URL, then cheapest available, even when requested variant sold out', () => {
  const listing = { variants: [{ id: 'gold', title: 'Gold', available: false, retail_price: 40 }, { id: 'silver', title: 'Silver', available: true, retail_price: 50 }] };
  assert.equal(chosenVariant(listing).id, 'silver');
  assert.equal(chosenVariant(listing, 'gold').id, 'gold');
  assert.equal(chosenVariant({}), null);
});
test('browser bundle is valid JS and leaves unrelated sites alone', () => {
  new vm.Script(KOOPCHECK_JS);
  const window = {}, document = {};
  vm.runInNewContext(KOOPCHECK_JS, { window, document, location: { hostname: 'example.com' } });
  assert.equal(window.__kadolyKoopcheck, undefined);
});

test('chat never promises free returns without matching product facts', () => {
  assert.match(returnAnswer({ listingId: 'dp_1037' }), /retourkosten bij bedenken voor jou/);
  assert.match(returnAnswer({ url: '/product/dp_1037' }), /retourkosten bij bedenken voor jou/);
  assert.match(returnAnswer({ listingId: 'oc_4251973869322241' }), /retourneren bij bedenken gratis/);
  assert.match(returnAnswer({}), /niet bevestigen dat de retour gratis is/);
  assert.match(returnAnswer({ listingId: 'dp_1037' }), /nog 14 dagen/);
});

function checkoutHarness(rows) {
  let changes = 0;
  const text = { _value: 'Totaal €1304,10 · gratis retourneren · iDEAL', get nodeValue() { return this._value; }, set nodeValue(v) { changes++; this._value = v; } };
  const sure = { nodes: [text] }, inserted = [], observers = [];
  const document = {
    documentElement: { lang: 'nl' }, readyState: 'complete', head: { appendChild() {} },
    createElement: () => ({ textContent: '', innerHTML: '' }),
    querySelector: () => null,
    querySelectorAll: selector => selector.includes('co-trust-line') ? [sure] : [],
    getElementById: id => id === 'co-s1-sure' ? sure : id === 'pay-btn' ? { insertAdjacentElement: (_, node) => inserted.push(node) } : null,
    createTreeWalker: node => { let i = 0; return { nextNode: () => (node.nodes || [])[i++] || null }; },
  };
  const window = rows.length === 1 ? { CO_DATA: { listing: rows[0] } } : { YCartLines: () => rows };
  vm.runInNewContext(KOOPCHECK_JS, { window, document, location: { hostname: 'kadoly.com', pathname: '/checkout/dp_1037' },
    MutationObserver: class { constructor(callback) { this.callback = callback; } observe() { observers.push(this.callback); } } });
  return { text, inserted, observers, changes: () => changes };
}
test('first checkout step replaces its old free-return promise and follows later rerenders without looping', () => {
  const h = checkoutHarness([dressoir]);
  assert.match(h.text.nodeValue, /Retour op eigen kosten/);
  h.text.nodeValue = 'Nieuwe totaalprijs · gratis retourneren';
  h.observers[0]();
  assert.match(h.text.nodeValue, /Retour op eigen kosten/);
  const before = h.changes(); h.observers[0](); assert.equal(h.changes(), before);
});
test('mixed checkout preserves the separate return condition for each item', () => {
  const h = checkoutHarness([dressoir, { id: 'oc_123', title: 'Armband' }]);
  assert.equal(h.inserted.length, 1);
  assert.match(h.inserted[0].innerHTML, /Retour op eigen kosten/);
  assert.match(h.inserted[0].innerHTML, /Gratis retourneren/);
  assert.match(h.text.nodeValue, /Retourvoorwaarden per product/);
});
test('free-return checkout is not incorrectly changed to customer-paid returns', () => {
  const h = checkoutHarness([{ id: 'oc_123' }]);
  assert.match(h.text.nodeValue, /gratis retourneren/);
  assert.equal(h.inserted.length, 0);
});
