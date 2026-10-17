import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMAIN_GUIDES, extraItems } from '../lib/keuze-extra-content.js';
import { validDomain, normalizeLabel, suggestDomains, nameScore, normalizeQuotes, annualCosts, laadAdvice, renderLaadpaal, renderDomain, domainSchema, selectChargers } from '../lib/keuze-tools.js';

test('names are usable ASCII, unique, bounded and adapted to each market', () => {
  for (const market of ['nl', 'us', 'de']) for (const input of ['Linden bakery Austin', 'Müller Bäckerei Köln', 'Zonnig & Zo', '<script>alert(1)</script>']) {
    const list = suggestDomains(input, market, 1);
    assert(list.length > 0 && list.length <= 10);
    assert.equal(new Set(list.map(x => x.domain)).size, list.length);
    assert(list.every(x => validDomain(x.domain) && x.score <= 100 && x.score >= 0));
    assert(list.every((x, i) => !i || list[i - 1].score >= x.score));
  }
  assert.deepEqual(normalizeLabel('Müller Bäckerei', 'de'), ['mueller', 'baeckerei']);
  assert.deepEqual(suggestDomains('   !!!  ', 'nl'), []);
  assert(suggestDomains('linden', 'nl').some(x => x.domain === 'linden.nl'));
  assert(suggestDomains('linden', 'de').some(x => x.domain === 'linden.de'));
  assert(suggestDomains('linden', 'us').every(x => !x.domain.endsWith('.us')));
});
test('name scoring follows the disclosed arithmetic', () => {
  assert.equal(nameScore('linden.com', 'us').score, 100);
  assert.equal(nameScore('linden.nl', 'nl').score, 100);
  assert(nameScore('lin-den3.net', 'us').score < nameScore('linden.com', 'us').score);
  assert.equal(nameScore('linden.com', 'nl', true).fit, true);
});
test('domain validation prevents arbitrary upstream requests', () => {
  for (const x of ['https://example.com', 'localhost', '127.0.0.1', 'example.com/path', '-x.com', 'x-.com', 'x..com', 'x.com@localhost', 'x.COM', 'x.us', 'a'.repeat(64) + '.com']) assert.equal(validDomain(x), false, x);
  assert(validDomain('linden.com'));
});
test('lookup failures never become availability or zero-price claims', () => {
  const domains = ['linden.com', 'linden.nl', 'linden.de'];
  const result = normalizeQuotes({ domains: [{ domain: domains[0], available: true, price: 12.5, renewalPrice: 15, years: 1 }, { domain: domains[1], available: false, price: 'unknown' }] }, domains);
  assert.equal(result[0].available, true); assert.equal(result[0].price, 12.5);
  assert.equal(result[1].available, false); assert.equal(result[1].price, null);
  assert.equal(result[2].available, null); assert.equal(result[2].renewalPrice, null);
  assert.equal(normalizeQuotes({}, ['linden.com'])[0].available, null);
});
test('all 36 EV routes separate home, VvE and public advice', () => {
  for (let place = 0; place < 3; place++) for (let phase = 0; phase < 3; phase++) for (let wish = 0; wish < 4; wish++) {
    const a = laadAdvice([place, phase, wish]); assert.deepEqual(a.route, [place, phase, wish]);
    assert.equal(a.mode, ['home', 'vve', 'public'][place]);
    if (place === 2) { assert(a.cta[1].includes('laadpaalnodig')); assert(!a.title.includes('11 kW')); }
    if (place === 1) assert(a.cta[1].includes('rvo.nl'));
    if (place === 0 && phase === 0) assert(a.title.includes('eerst'));
    if (place === 0 && phase === 1) assert(a.title.includes('3,7'));
    if (place === 0 && phase === 2) assert(a.title.includes('11 kW'));
  }
  assert.deepEqual(laadAdvice(['x', -1, 999]).route, [0, 0, 0]);
});
test('cost calculator handles savings, extra cost, zero driving and invalid input', () => {
  assert(Math.abs(annualCosts([12000, 20, 0.30, 0.55, 80]).difference - 480) < 0.001);
  assert(annualCosts([12000, 20, 0.7, 0.4, 80]).difference < 0);
  assert.equal(annualCosts([0, 20, 0.3, 0.55, 80]).difference, 0);
  for (const values of [['', 20, 0.3, 0.55, 80], [-1, 20, 0.3, 0.55, 80], [12000, 0, 0.3, 0.55, 80], [12000, 20, Infinity, 0.55, 80], [12000, 20, 0.3, 0.55, 101]]) assert.equal(annualCosts(values), null);
});
test('product suggestions exclude accessories, invalid offers and non-bol URLs', () => {
  const good = { id: '1', title: 'Wallbox laadstation auto 11 kW', price: 649, url: 'https://www.bol.com/nl/nl/p/laadpaal/1/' };
  const list = selectChargers([good, { ...good }, { ...good, id: '2', title: 'Laadpaal beschermhoes' }, { ...good, id: '3', title: 'Laadkabel met houder wallbox' }, { ...good, id: '4', url: 'https://evilbol.com/a' }, { ...good, id: '5', price: null }]);
  assert.deepEqual(list.map(x => x.id), ['1']);
  assert.equal(selectChargers([{ ...good, title: 'Laadpaal 7.4kW fase 1 11kW' }]).length, 0);
  assert.equal(selectChargers([{ ...good, title: 'Laadpaal 22kW - 11kW' }]).length, 0);
  assert.equal(selectChargers([{ ...good, title: 'Laadpaal 11kw fase 3 met 6M laadkabel' }]).length, 1);
});
test('localized guides have visible answers, matching FAQ schema and canonical market identities', () => {
  for (const g of Object.values(DOMAIN_GUIDES)) {
    const html = renderDomain(g), schema = domainSchema(g);
    assert(html.includes(g.h1)); assert(html.includes(g.answer));
    assert.equal(schema['@graph'].find(x => x['@type'] === 'FAQPage').mainEntity.length, g.faq.length);
    assert(schema['@graph'].some(x => x.mainEntityOfPage === 'https://' + g.host + '/' + g.slug));
    assert(html.includes('application/json')); assert(html.includes('type="module"'));
    assert(extraItems(g.id).some(x => x.slug === g.slug));
  }
  assert(renderLaadpaal([2, 0, 0]).includes('openbaar laden'));
  assert.equal(extraItems('nl').length, 2);
});
