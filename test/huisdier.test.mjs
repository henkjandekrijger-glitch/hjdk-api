import test from 'node:test';
import assert from 'node:assert/strict';
const H = await import('../lib/huisdier.js');

test('huisdierenverzekering: elk feit heeft een bekende bron, pagina is indexeerbaar met geldige JSON-LD', () => {
  for (const a of H.DIER_AANBIEDERS) for (const [k, [t, b]] of Object.entries(a.v)) { assert.ok(t && t.length > 3, a.id + ' ' + k); assert.ok(H.DIER_BRONNEN[b], a.id + ' ' + k + ' bron ' + b); }
  for (const [, u] of Object.values(H.DIER_BRONNEN)) assert.match(u, /^https:\/\//);
  const html = H.renderHuisdier('');
  assert.match(html, /<meta name="robots" content="index,follow/);
  assert.match(html, /<link rel="canonical" href="https:\/\/keuzehulp\.best\/huisdierenverzekering">/);
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(ld['@graph'].map(x => x['@type']), ['Article', 'BreadcrumbList', 'ItemList', 'FAQPage']);
  assert.equal(ld['@graph'][3].mainEntity.length, H.DIER_FAQ.length);
  assert.match(html, /id="kx"/);
  assert.ok(H.DIER_TITEL.length <= 60 && H.DIER_DESC.length <= 155);
  const zicht = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  assert.doesNotMatch(zicht, /[–—]/, 'geen gedachtestreepjes');
  assert.doesNotMatch(zicht, /niet gevonden|konden we niet|onbekend/i);
});

test('chat rekent per dier, leeftijd en wens, en laat aanbieders boven hun leeftijdsgrens weg', () => {
  globalThis.D = { a: H.DIER_AANBIEDERS };
  const R = H._test.REKEN;
  for (const d of ['hond', 'kat']) for (const l of [5, 6, 7, 8, 9, 10]) for (const w of ['max', 'pct', 'prev', 'cast', 'prijs']) { const r = R({ d, l: String(l), w }, ''); assert.ok(r && r.h, d + l + w); }
  assert.match(R({ d: 'hond', l: '7', w: 'max' }, '').h, /3 van de 6 aanbieders/); // Figo, PetSecur, Univé
  assert.match(R({ d: 'kat', l: '9', w: 'max' }, '').h, /2 van de 6 aanbieders/); // Figo, Univé
  assert.match(R({ d: 'hond', l: '10', w: 'max' }, '').h, /alleen Ongevallen/);
  const t = R({ d: 'hond', l: '5', b: '6000' }, 'terug').h;
  assert.match(t, /Figo Pet<\/b>: € 5\.400/); assert.match(t, /a\.s\.r\.<\/b>: € 2\.500 terug bij 75%, want het maximum/);
  const cfg = H._test.rekenCfg(); assert.equal(cfg.st.length, 3); assert.ok(cfg.js.startsWith('var REKEN='));
});
