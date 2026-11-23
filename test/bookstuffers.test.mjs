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
  assert.match(render('stocking-stuffers', echt), new RegExp(`<title>Stocking Stuffers: ${TEL.boeken} `));
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
  assert.match(llms(), /# Stocking Books/);
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

test('LC-artikel: keuring weigert dun en accepteert een volledig stuk dat door de paginakeuring komt', async () => {
  const LCF = await import('../lib/lcfunnel.js');
  assert.ok(LCF.checkArtikel({ slug: 'x', titel: 'kort' }).length > 3);
  const zin = 'Start with one habit so small that a busy day is not an excuse, and check in every evening for thirty days. ';
  const a = { slug: 'how-to-stop-procrastinating', titel: 'How to Stop Procrastinating: 7 Steps That Work in 2027', desc: 'Why you procrastinate and seven steps that work: start tiny, plan the bad day, check in daily and give a new habit 66 days to stick.', h1: 'How to stop procrastinating', antwoord: zin.repeat(3), secties: [1, 2, 3, 4].map(i => ({ kop: 'Step ' + i, alineas: [zin.repeat(4), zin.repeat(3)], lijst: ['One', 'Two'] })), faq: [['Why do I procrastinate?', zin], ['How long does it take?', zin], ['Does a workbook help?', zin]], bronnen: [{ naam: 'Lally et al. 2010', url: 'https://doi.org/10.1002/ejsp.674' }], datum: '2026-11-23', status: 'live' };
  assert.deepEqual(LCF.checkArtikel(a), []);
  const h = LCF.renderArtikel({ echt: true, pdf: false, L: x => '/' + x, go: x => '/go/' + x }, a, [{ slug: 'other-guide', titel: 'Other guide' }]);
  assert.deepEqual(keur(h, 'lc:artikel'), []);
  assert.match(h, /href="\/other-guide"/); assert.match(h, /href="\/guides"/);
  assert.deepEqual(keur(LCF.renderGidsen({ echt: true, pdf: true, L: x => '/' + x, go: x => '/go/' + x }, [a]), 'lc:gidsen'), []);
});

test('LC-check: keuzehulpchat met de zeven redenen, concept noindex, kennis in de catalogus', async () => {
  const W = await import('../lib/lcwaarom.js');
  const c = { echt: true, pdf: false, L: s => '/' + s, go: a => '/go/' + a, waaromLive: false };
  const h = W.renderWaarom(c);
  assert.match(h, /noindex/); assert.match(h, /id="kx"/); assert.match(h, /keuze-tools\?tool=intentie&op=chat/); assert.match(h, /What stopped you, honestly\?/);
  for (const r of W.REDENEN) { assert.ok(r[1].length <= 40, r[0]); assert.ok(h.includes(r[1]), r[0]); }
  const it = W.chatItems()[0]; assert.equal(it.slug, W.CHAT_SLUG); assert.match(it.pad, /^https:\/\/lastingchange\.works\//); assert.ok(it.uitleg.length < 2600, 'uitleg ' + it.uitleg.length);
  assert.doesNotMatch(JSON.stringify(W.REDENEN) + it.kort + it.uitleg, /[—–]/);
  assert.match(W.renderWaarom({ ...c, waaromLive: true }), /index,follow/);
});

test('kerstpagina\'s: moppen, quiz en kleurplaten renderen en zijn gekeurd', async () => {
  const B = await import('../lib/bs.js'), X = await import('../lib/bsxmas.js');
  for (const s of B.NIEUW) { const h = B.render(s, echt); assert.ok(h, s); assert.deepEqual(B.keur(h, s), [], s); assert.ok(!B.SLUGS.includes(s), s + ' pas na ok in de sitemap'); }
  const n = Object.values(X.MOPPEN).flat().length; assert.match(B.render('christmas-jokes', echt), new RegExp(`<title>Christmas Jokes: ${n} `));
  assert.ok(X.KLEUR.length >= 10); for (const k of X.KLEUR) assert.match(k.svg, /^<svg[\s\S]*<\/svg>$/);
  assert.doesNotMatch(JSON.stringify([X.MOPPEN, X.QUIZ]), /[—–]/);
  assert.match(B.sitemap(['christmas-jokes']), /christmas-jokes/);
});
