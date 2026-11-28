import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { dagModel, decemberModel, winstModel, zetKdpData, voorspelRonde, voorspelStand, voorspelHtml, localDay } from '../lib/kdp-voorspel.js';
import { zetOversight, ovStand, ovHtml, ovTekst } from '../lib/oversight.js';
const NOW = Date.parse('2026-11-28T14:00:00Z'), DAY = 864e5;
const shift = n => new Date(Date.parse('2026-11-28T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
export function memoryKV() {
  const m = new Map(); return { m, get: async k => m.get(k) ?? null, set: async (k, v) => m.set(k, structuredClone(v)), raw: async args => {
    const [cmd, key, ...rest] = args;
    if (cmd === 'SET') { if (rest.includes('NX') && m.has(key)) return null; m.set(key, JSON.parse(rest[0])); return 'OK'; }
    if (cmd === 'HSET') { const h = m.get(key) || {}; h[rest[0]] = rest[1]; m.set(key, h); return 1; }
    if (cmd === 'HGET') return m.get(key)?.[rest[0]] ?? null;
    if (cmd === 'HGETALL') return Object.entries(m.get(key) || {}).flat();
    if (cmd === 'EXPIRE') return 1;
    if (cmd === 'SMEMBERS') return [];
    throw new Error('unexpected Redis command ' + cmd);
  } };
}
function input() {
  return { dagen: Array.from({ length: 40 }, (_, i) => ({ dag: shift(i - 40), royalty: 30 + i % 7 * 2, stuks: 10, afgesloten: true, bron: 'source', gezien: '2026-11-28T13:00:00Z', per: [{ boek: 'A', markt: 'CA', royalty: 30 + i % 7 * 2, stuks: 10 }] })), adsdagen: [{ dag: shift(-1), kosten: 10, afgesloten: true, bron: 'Ads', gezien: '2026-11-28T13:00:00Z' }] };
}
test('validation rejects missing, future and invalid input before any partial write', async () => {
  for (const bad of [{ ...input().dagen[0], royalty: null }, { ...input().dagen[0], dag: '2026-99-01' }, { ...input().dagen[0], dag: '2026-11-29' }, { ...input().dagen[0], gezien: '2026-11-29T00:00:00Z' }]) {
    const kv = memoryKV(); const r = await zetKdpData(kv, { dagen: [input().dagen[1], bad] }, NOW); assert.equal(r.ok, false); assert.equal(kv.m.size, 0);
  }
});
test('current day excluded, complete seven-day window required, currency not silently coerced', () => {
  const rows = input().dagen, original = dagModel(rows, '2026-11-28');
  assert.equal(dagModel([...rows, { dag: '2026-11-28', royalty: 1e9, afgesloten: false }], '2026-11-28').bedrag, original.bedrag);
  assert.equal(dagModel(rows.filter(r => r.dag !== shift(-2)), '2026-11-28').ok, false);
  assert.equal(localDay(Date.parse('2026-11-29T02:00:00Z')), '2026-11-28');
  assert.ok(original.proef.find(p => p.model === 'adslag1').n === 0);
});
test('compressed imports validate like ordinary imports, and native currency is rejected', async () => {
  const kv = memoryKV(); const packed = gzipSync(JSON.stringify(input())).toString('base64url'); assert.equal((await zetKdpData(kv, { gzip: packed }, NOW)).ok, true);
  assert.equal((await zetKdpData(kv, { dagen: [{ ...input().dagen[0], munt: 'CAD' }] }, NOW)).ok, false);
  assert.equal((await zetKdpData(kv, { gzip: 'broken' }, NOW)).ok, false);
});
test('original forecast and December starting forecast remain immutable; actual corrections update score', async () => {
  const kv = memoryKV(); await zetKdpData(kv, input(), NOW);
  await kv.set('ovs:kdp', { dag: '2026-11-28', bedrag: 17, t: '2026-11-28T13:00:00Z' });
  const one = await voorspelRonde(kv, NOW);
  await kv.set('ovs:kdp', { dag: '2026-11-28', bedrag: 100, t: '2026-11-28T14:00:00Z' });
  const two = await voorspelRonde(kv, NOW + 60000); assert.deepEqual(two.vandaag, one.vandaag); assert.equal(two.bijstelling.bedrag, 100);
  assert.equal(two.leren.n, 0); assert.equal(two.kostenNu, null);
  await zetKdpData(kv, { dagen: [{ dag: '2026-11-28', royalty: 70, stuks: 20, afgesloten: true, bron: 'KDP', gezien: '2026-11-29T12:00:00Z' }] }, NOW + DAY);
  const next = await voorspelRonde(kv, NOW + DAY); assert.equal(next.leren.scores[0].werkelijk, 70); assert.equal(next.leren.scores[0].voorlopig, true); assert.equal(next.leren.n, 0);
  await zetKdpData(kv, { dagen: [{ dag: '2026-11-28', royalty: 75, stuks: 21, afgesloten: true, bron: 'KDP revision', gezien: '2026-12-05T12:00:00Z' }] }, NOW + 7 * DAY);
  const later = await voorspelRonde(kv, NOW + 7 * DAY); // incomplete new days must not manufacture a fresh forecast
  assert.equal(later.status, 'data ontbreekt'); assert.deepEqual(await kv.get('kdp:voorspel:dag:2026-11-28'), one.vandaag);
  assert.equal(later.leren.n, 1); assert.equal(later.leren.scores[0].werkelijk, 75);
  assert.equal(kv.m.get('kdp:voorspel:herzieningen')['2026-11-28|2026-12-05T12:00:00.000Z'] != null, true);
});
test('retrospective model selection never sees the day being forecast, separate live scores', () => {
  const rows = input().dagen; const f = dagModel(rows, '2026-11-26');
  const leaked = rows.map(r => r.dag >= '2026-11-26' ? { ...r, royalty: 1e9 } : r);
  assert.deepEqual(dagModel(leaked, '2026-11-26'), f);
});
test('month forecast scales each book rather than restoring last year winners', () => {
  const rows = input().dagen.filter(r => r.dag.startsWith('2026-11'));
  const months = [{ maand: '2025-11', per: [{ boek: 'A', royalty: 1000 }, { boek: 'stopped', royalty: 10000 }] }, { maand: '2025-12', per: [{ boek: 'A', royalty: 2000 }, { boek: 'stopped', royalty: 20000 }] }];
  const m = decemberModel(rows, months, '2026-11-28'); assert.ok(m.bedrag > 0); assert.equal(m.per.some(p => p.boek === 'stopped'), false); assert.ok(m.laag <= m.bedrag && m.hoog >= m.bedrag);
});
test('profit never treats missing ad sources or other costs as zero and never subtracts printing twice', () => {
  const goal = { maand: '2026-12', bedrag: 10000, royaltyPlan: 18000, adsAandeelPlan: .4 };
  const royalties = [{ dag: '2026-12-01', royalty: 500, afgesloten: true }];
  const ads = [{ dag: '2026-12-01', kosten: 100, afgesloten: true }];
  const unknown = winstModel(royalties, ads, [], '2026-12-02', null, goal);
  assert.equal(unknown.werkelijk.bedrag, null); assert.equal(unknown.werkelijk.dagen, 0);
  ads[0].volledig = true;
  assert.equal(winstModel(royalties, ads, [], '2026-12-02', null, goal).werkelijk.bedrag, null);
  const complete = winstModel(royalties, ads, [{ dag: '2026-12-01', kosten: 0, volledig: true, afgesloten: true }], '2026-12-02', null, goal);
  assert.equal(complete.werkelijk.bedrag, 400); assert.equal(complete.nogNodig, 9600); assert.equal(complete.nodigPerResterendeDag, 320);
  assert.equal(complete.plan.ruimteOverigeKosten, 800);
  assert.equal(winstModel(royalties, ads, [], '2026-11-28', null, goal).werkelijk.bedrag, 0);
});
test('profit scenarios use contiguous ad days, label excluded costs and preserve the independent target', () => {
  const goal = { maand: '2026-12', bedrag: 10000 }, month = { maand: '2026-12', bedrag: 4000 };
  const ads = Array.from({ length: 7 }, (_, i) => ({ dag: shift(-i - 1), kosten: 10, afgesloten: true }));
  const w = winstModel([], ads, [], '2026-11-28', month, goal);
  assert.equal(w.bijdrageRaming.hoog, 3690); assert.equal(w.bijdrageRaming.kostendekkingBevestigd, false);
  assert.equal(w.bijdrageRaming.kloofMinimaal, 6310); assert.equal(w.vereist[1].royaltyMinimaal, 16666.67);
  assert.equal(winstModel([], ads.filter(r => r.dag !== shift(-1)), [], '2026-11-28', month, goal).bijdrageRaming, null);
});
test('Oversight integration preserves the KDP card and escapes imported text', async () => {
  const kv = memoryKV(); await zetKdpData(kv, input(), NOW);
  await kv.set('ovs:kdp', { dag: '2026-11-28', bedrag: 17, stuks: 7, t: '2026-11-28T13:00:00Z', per: [], gedaan: [], wacht: [], volgende: [] });
  const f = await voorspelRonde(kv, NOW); f.factoren.boeken[0].boek = '<script>alert(1)</script>'; await kv.set('kdp:voorspel:laatst', f);
  const st = await ovStand(kv, 14, NOW); const html = ovHtml(st, 'body{}');
  assert.match(html, /Boeken vandaag/); assert.match(html, /Voorspeld vóór/); assert.ok(!html.includes('<script>alert(1)'));
  assert.match(ovTekst(st), /KDP VOORSPELLING/); assert.match(voorspelHtml(f), /&lt;script&gt;/);
  assert.equal((await voorspelStand(kv, NOW + 2 * DAY)).oud, true);
  assert.equal((await zetOversight(kv, { kdpdata: { dagen: [] } })).ok, true);
});
