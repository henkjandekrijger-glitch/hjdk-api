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
