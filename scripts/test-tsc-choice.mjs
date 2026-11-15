import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as choice from '../lib/tsc-choice.js';
import { eligibility, experienceSummary, rankExperience, wilson } from '../lib/tsc-evidence.js';
import * as data from '../lib/tsc-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RANK = JSON.parse(fs.readFileSync(path.join(root, 'data/tsc-rank.json'), 'utf8'));
const ROUTES = JSON.parse(fs.readFileSync(path.join(root, 'data/tsc-routes.json'), 'utf8'));
const source = fs.readFileSync(path.join(root, 'lib/tsc.js'), 'utf8').replace(/^import .*;\n/gm, '').replace('export async function tscHandler', 'async function tscHandler');
const names = ['SITE', 'SRC', 'HOME', 'HOMES', 'PAGES', 'CHECK', 'ROUTES', 'RANK_SLUGS', 'LIJSTEN', ...Object.keys(choice)];
const slugs = Object.fromEntries(Object.entries(RANK.lijsten).flatMap(([id, l]) => Object.entries(l.slugs).map(([language, slug]) => [slug, { id, taal: language }])));
const values = [data.SITE, data.SRC, data.HOME, data.HOMES, data.PAGES, data.CHECK, ROUTES, slugs, RANK.lijsten, ...Object.values(choice)];
const renderer = new Function(...names, source + '\nreturn {home, rankPagina, pagina, llms, checkPagina};')(...values);
let checks = 0;
const test = (name, fn) => { fn(); checks++; console.log('ok', name); };
const outputs = [];

for (const language of ['en', 'nl', 'de']) {
  test('home SSR, CSS, language and canonical ' + language, () => {
    const html = renderer.home(data.SITE.base, language);
    assert.match(html, /class="choice-wide"/);
    assert.match(html, /\.sc-provider\{/);
    assert.ok(html.includes('lang="' + language + '"'));
    assert.ok(html.includes('rel="canonical"'));
    assert.ok(!html.includes('Where people go'));
    assert.ok(!html.includes('van ~198'));
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    outputs.push({ slug: language === 'en' ? '' : language, html });
  });
  for (const [id, list] of Object.entries(RANK.lijsten)) test('comparison SSR and script ' + id + '/' + language, () => {
    const slug = list.slugs[language];
    if (!slug) return;
    const html = renderer.rankPagina(data.SITE.base, slug, { id, taal: language }, {});
    assert.ok(html.includes('id="sc-table"'));
    assert.ok(html.includes('id="sc-more"'));
    assert.ok(html.includes('class="sc-context"'));
    assert.ok(!html.includes('<!--sc-help-->'));
    assert.ok(!html.includes('score op 100'));
    assert.ok(!html.includes('The highest score goes to'));
    const faqSchema = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    for (const ld of faqSchema) for (const node of ld['@graph'] || []) if (node['@type'] === 'FAQPage') assert.deepEqual(node.mainEntity.map(q => q.name), choice.choiceCopy(language).qs);
    assert.equal((html.match(/data-provider=/g) || []).length, list.klinieken.length);
    for (const [, attributes, text] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (attributes.includes('application/ld+json')) {
        const ld = JSON.parse(text); const itemList = ld['@graph']?.find(x => x['@type'] === 'ItemList');
        if (itemList) { assert.equal(itemList.numberOfItems, list.klinieken.length); assert.ok(!JSON.stringify(itemList).includes('aggregateRating')); }
      } else new vm.Script(text);
    }
    assert.ok(html.match(/<title>([^<]{1,60})<\/title>/));
    outputs.push({ slug, html });
  });
}

test('future routes retain their own name', () => {
  const list = { id: 'another-route', tekst: { en: { h1: 'A different procedure and destination' } } };
  assert.equal(choice.choiceTitle(list, 'en'), 'Compare doctors and clinics');
});
test('accreditation does not count as legal permission', () => {
  const list = { klinieken: [{ id: 'x', naam: 'Example', signalen: { jci: true, jci_bron: 'https://example.org/jci', acc: 'ja', acc_bron: 'https://example.org/acc' } }] };
  assert.equal(choice.choiceRows(list)[0].permission, '');
});
test('negative guarantee free text does not count as aftercare verification', () => {
  const row = choice.choiceRows({ klinieken: [{ naam: 'Example', openheid: { garantie: 'Geen garantie genoemd' } }] })[0];
  assert.equal(row.aftercare, ''); assert.equal(row.coverage, 0);
});
test('payment and reviews cannot buy evidence coverage', () => {
  const a = { id: 'a', naam: 'A', partner_fee: 0 };
  const b = { id: 'b', naam: 'B', partner_fee: 999999, reviews: [{ score: 5, aantal: 1000000 }] };
  assert.deepEqual(choice.choiceRows({ klinieken: [b, a] }).map(r => r.k.id), ['a', 'b']);
});
test('unknown and expired checks block recommendation eligibility', () => {
  assert.equal(eligibility({}).status, 'incomplete');
  const checks = Object.fromEntries(['identity', 'registration', 'procedure_scope', 'facility_permission', 'operator_roles', 'restrictions'].map(k => [k, { status: 'verified', source_url: 'https://example.org/register', verified_at: '2026-11-01', valid_until: '2026-12-01' }]));
  assert.equal(eligibility({ checks }, '2026-11-15').status, 'eligible');
  checks.registration.valid_until = '2026-11-14'; assert.equal(eligibility({ checks }, '2026-11-15').status, 'incomplete');
  checks.registration.status = 'failed'; assert.equal(eligibility({ checks }, '2026-11-15').status, 'held_for_review');
});
test('one patient episode per wave, latest revision, same doctor/procedure only', () => {
  const review = { review_id: 'r1', source_type: 'own', relationship_verified: true, moderation_status: 'published', episode_id: 'private-1', followup_wave: '3m', doctor_id: 'a', procedure_id: 'p', facility_id: 'f', communication: 5, published_at: '2026-11-01' };
  const summary = experienceSummary([review, { ...review, review_id: 'r2', communication: 1, published_at: '2026-11-02' }, { ...review, episode_id: 'private-2', doctor_id: 'other' }, { ...review, episode_id: 'private-3', source_type: 'external' }], { doctor_id: 'a', procedure_id: 'p', facility_id: 'f', followup_wave: '3m' });
  assert.equal(summary.unique_episodes, 1); assert.equal(summary.dimensions.communication.favourable, 0);
});
test('sampling uncertainty and invalid review denominator', () => {
  assert.equal(wilson(1, 0), null); assert.equal(wilson(21, 20), null);
  assert.ok(wilson(18, 20).low < 0.9); assert.ok(wilson(900, 1000).low > wilson(18, 20).low);
  assert.equal(rankExperience([{ id: 'x', experience: { dimensions: { aftercare: { answered: 9999, low: 0.99, high: 1 } } } }], 'aftercare').ordered.length, 0);
});

// The actual generated client code is exercised with a minimal DOM contract, without a browser.
class Element {
  constructor(tag = 'div') { this.tagName = tag; this.children = []; this.listeners = {}; this.dataset = {}; this.hidden = false; this.checked = false; this.value = ''; this.textContent = ''; }
  appendChild(el) { this.children.push(el); return el; }
  replaceChildren() { this.children = []; }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  focus() { this.focused = true; }
  scrollIntoView() { this.scrolled = true; }
}
test('generated compare UI: first three, maximum three, search and clear', () => {
  const list = RANK.lijsten['hair-turkey'], rows = choice.choiceRows(list);
  const html = choice.choiceRanking(list, 'nl', data.SITE.base);
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
  const ids = Object.fromEntries(['sc-bar', 'sc-comparison', 'sc-feedback', 'sc-count', 'sc-show', 'sc-table', 'sc-close', 'sc-clear', 'sc-search', 'sc-match', 'sc-more'].map(id => [id, new Element()]));
  const boxes = rows.map((r, i) => { const b = new Element('input'); b.dataset.compare = String(i); return b; });
  const cards = rows.map(r => { const c = new Element('article'); c.dataset.name = (r.k.naam + ' ' + r.doctors.map(a => a.naam).join(', ')).toLocaleLowerCase('nl'); return c; });
  const document = { getElementById: id => { assert.ok(ids[id], id); return ids[id]; }, createElement: tag => new Element(tag), querySelectorAll: selector => selector === '[data-compare]' ? boxes : selector === '[data-provider]' ? cards : [] };
  vm.runInNewContext(script, { document, matchMedia: () => ({ matches: true }) });
  assert.equal(cards.filter(c => !c.hidden).length, 3);
  for (let i = 0; i < 4; i++) { boxes[i].checked = true; boxes[i].listeners.change(); }
  assert.equal(boxes[3].checked, false); assert.ok(ids['sc-feedback'].textContent.includes('maximaal'));
  assert.equal(ids['sc-show'].disabled, false); ids['sc-show'].onclick(); assert.equal(ids['sc-comparison'].hidden, false);
  assert.equal(ids['sc-table'].children[0].children[0].children.length, 4);
  ids['sc-search'].value = rows[4].k.naam.toLowerCase(); ids['sc-search'].listeners.input.call(ids['sc-search']); assert.ok(!cards[4].hidden);
  ids['sc-clear'].onclick(); assert.ok(boxes.every(b => !b.checked)); assert.equal(ids['sc-comparison'].hidden, true);
});
test('untrusted profile text is escaped in markup and inline script', () => {
  const list = { id: 'x', gecontroleerd: '2026-11-15', tekst: { en: { h1: 'Example' } }, klinieken: [{ id: 'x', naam: '</script><img src=x onerror=alert(1)>', site: 'javascript:alert(1)', reviews: [] }] };
  const html = choice.choiceRanking(list, 'en', data.SITE.base);
  assert.ok(!html.includes('<img src=x')); assert.ok(!html.includes('href="javascript:'));
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1]; new vm.Script(script);
});
test('guides keep working and llms matches the new comparison', () => {
  for (const [slug, pg] of Object.entries(data.PAGES)) {
    const html = renderer.pagina(data.SITE.base, slug, pg, {}); assert.ok(html.includes('<h1>')); assert.ok(html.includes('application/ld+json'));
  }
  assert.ok(renderer.llms().includes('Profiles are ordered by documented fields'));
  assert.ok(!renderer.llms().includes('Smile Hair Clinic, HLC Hairline Clinic and Asmed score highest'));
});
if (process.env.SURGERY_RENDER_DIR) {
  fs.mkdirSync(process.env.SURGERY_RENDER_DIR, { recursive: true });
  for (const out of outputs) fs.writeFileSync(path.join(process.env.SURGERY_RENDER_DIR, (out.slug || 'home').replaceAll('/', '_') + '.html'), out.html);
}
console.log(checks + ' checks passed; ' + outputs.length + ' pages rendered.');
