// Controle van bookstuffers.com (lib/bs.js, fn/bs.js). Draai voor elke push: node --test test/bookstuffers.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { render, SLUGS, sitemap, llms, zichtJson, TEL, woordzoeker, keur } from '../lib/bs.js';
import { BOEKEN, LC, PUZZELS } from '../lib/bs-data.js';

const echt = { echt: true, L: s => '/' + s }, voorbeeld = { echt: false, L: s => '/api/bs?p=' + s };

test('elke pagina rendert zonder fouten volgens de keuring', () => {
  for (const s of SLUGS) assert.deepEqual(keur(render(s, echt), s || 'home'), [], s || 'home');
});

test('elk boek heeft een geldige ASIN, omslag, prijs en paginatal, en geen dubbelen', () => {
  const gezien = new Set();
  for (const b of [...BOEKEN, LC]) {
    assert.match(b.a, /^B0[A-Z0-9]{8}$/, b.t); assert.ok(!gezien.has(b.a), 'dubbel ' + b.a); gezien.add(b.a);
    assert.match(b.i, /^[A-Za-z0-9+-]{8,}$/, 'omslag ' + b.a); assert.ok(b.p > 0 && b.n > 0, 'prijs/pagina ' + b.a);
    assert.ok(!/[—–]/.test(b.t), 'gedachtestreepje in ' + b.a); assert.ok(!/2024|2025|Knowladge|Prirnt/.test(b.t), 'oude of foute titel ' + b.a);
  }
});

test('elk boek staat op de stocking stuffers-pagina, met omslag', () => {
  const html = render('stocking-stuffers', echt);
  for (const b of BOEKEN) assert.ok(html.includes(`data-bs="${b.a}"`), 'mist ' + b.a);
});

test('interne links wijzen naar bestaande pagina\'s', () => {
  for (const s of SLUGS) for (const m of render(s, echt).matchAll(/href="\/([a-z0-9-]*)(#[a-z0-9-]+)?"/g)) assert.ok(SLUGS.includes(m[1]), `${s}: link naar /${m[1]}`);
});

test('ankers op de pagina bestaan', () => {
  for (const s of SLUGS) { const h = render(s, echt); for (const m of h.matchAll(/href="(?:\/[a-z0-9-]*)?#([a-z0-9-]+)"/g)) { const doel = m[0].includes('/') ? render(m[0].match(/\/([a-z0-9-]*)#/)[1], echt) : h; assert.ok(doel.includes(`id="${m[1]}"`), `${s}: anker #${m[1]}`); } }
});

test('voorbeeld buiten het domein is noindex en linkt binnen het voorbeeld', () => {
  const h = render('white-elephant-rules', voorbeeld);
  assert.match(h, /name="robots" content="noindex,nofollow"/); assert.match(h, /href="\/api\/bs\?p=white-elephant-gifts-under-10"/); assert.match(h, /href="\/api\/bs\?op=go&a=B0/);
  assert.match(render('', echt), /name="robots" content="index,follow/);
});

test('tellingen in titels komen uit de data', () => {
  assert.match(render('white-elephant-gifts-under-10', echt), new RegExp(`<title>White Elephant Gifts Under \\$10: ${TEL.we10} `));
  assert.match(render('stocking-stuffers', echt), new RegExp(`<title>Stocking Stuffer Books: ${TEL.boeken} `));
  assert.ok(TEL.we10 > 5 && TEL.tot5 > 5);
});

test('woordzoekers: elk woord staat erin, vaste uitkomst per zaadje', () => {
  for (const p of PUZZELS) {
    const { g } = woordzoeker(p), N = g.length, lijnen = [];
    for (let y = 0; y < N; y++) lijnen.push(g[y].join(''));
    for (let x = 0; x < N; x++) lijnen.push(g.map(r => r[x]).join(''));
    for (let k = -N + 1; k < N; k++) { let s = ''; for (let y = 0; y < N; y++) { const x = y + k; if (x >= 0 && x < N) s += g[y][x]; } lijnen.push(s); }
    for (const w of p.woorden) assert.ok(lijnen.some(l => l.includes(w)), `${p.id}: ${w}`);
    assert.deepEqual(woordzoeker(p).g, g);
  }
});

test('sitemap, llms.txt en zicht.json', () => {
  assert.equal((sitemap().match(/<loc>/g) || []).length, SLUGS.length);
  assert.match(llms(), /# Bookstuffers/);
  assert.ok(Array.isArray(zichtJson().toegepast));
});

test('Lasting Change-funnel: alle pagina\'s door de keuring, PDF-knop alleen met sleutel, download alleen met geldige handtekening', async () => {
  const LCF = await import('../lib/lcfunnel.js');
  for (const pdf of [true, false]) for (const s of LCF.SLUGS) {
    const h = LCF.renderLc(s, { echt: true, pdf, L: x => '/' + x });
    assert.deepEqual(keur(h, 'lc:' + s), [], 'lc:' + s);
    assert.equal(h.includes('data-koop='), pdf && s !== 'refund', 'koopknop ' + s + ' pdf=' + pdf);
  }
  const q = new URLSearchParams(LCF.tekenDownload('txn_01abcdefghij1234567890'));
  assert.ok(LCF.checkDownload(q)); q.set('s', 'x'.repeat(32)); assert.ok(!LCF.checkDownload(q));
  assert.equal((await LCF.checkTransactie({ get: async () => ({}) }, 'nep')).ok, false);
});
