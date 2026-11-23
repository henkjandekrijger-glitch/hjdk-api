import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const src = fs.readFileSync(new URL('../lib/cur.js', import.meta.url), 'utf8');
const start = src.indexOf('export function metSiteKop(html, d) {');
const end = src.indexOf("// vrije foto's", start);
assert.ok(start > 0 && end > start);
const metSiteKop = new Function('GELIJK_CSS', src.slice(start, end).replace('export function ', 'function ') + '; return metSiteKop;')('');
const meer = '<section class="card wa wa-gidsverdieping"><a href="https://curacao.day/nl/wereld/een-artikel">Uit de redactie</a></section>';
const d = { kop: '<header class="site">curacao.day</header>', css: '', meer };
const html = chat => '<html><head></head><body><header class="top">Oude kop</header><main><h1>Auto huren</h1><p>Eigen gidsinhoud.</p>' + chat + '<p>Einde gids.</p></main></body></html>';
for (const chat of [
  '<div data-cw-ama data-ond="gids.gautohuur">Chat</div>',
  '<div id="bz-chat" class="rz-ama" data-blok="chat" data-cw-ama data-ond="gids.gautohuur">Chat</div>',
  '<div class="rz-ama" data-ond="gids.gautohuur" data-cw-ama="1">Chat</div>',
  '<section id="bz-chat" data-cw-ama>Chat</section>'
]) test('redactielinks voor chat met markup ' + chat.slice(0, 60), () => {
  const out = metSiteKop(html(chat), d);
  assert.ok(out.indexOf(meer) > out.indexOf('<h1>'));
  assert.ok(out.indexOf(meer) < out.indexOf(chat));
  assert.equal(out.split(meer).length, 2);
  assert.ok(out.includes('<p>Eigen gidsinhoud.</p>'));
  assert.equal(metSiteKop(out, d), out);
});
test('zonder chat staat de redactie voor einde main', () => {
  const out = metSiteKop(html(''), d);
  assert.ok(out.indexOf(meer) > out.indexOf('<p>Einde gids.</p>'));
  assert.ok(out.indexOf(meer) < out.indexOf('</main>'));
});
test('zonder redactie-inhoud komt geen leeg blok bij de gids', () => {
  assert.ok(!metSiteKop(html(''), { ...d, meer: '' }).includes('wa-gidsverdieping'));
});
test('gelijkende attribuutnaam is geen chatanker', () => {
  const out = metSiteKop(html('<div data-cw-amazon>Ander blok</div>'), d);
  assert.ok(out.indexOf(meer) > out.indexOf('<p>Einde gids.</p>'));
});
