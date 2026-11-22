import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const source = readFileSync(new URL('../fn/shop.js', import.meta.url), 'utf8');
const directSource = readFileSync(new URL('../lib/shopdirect.js', import.meta.url), 'utf8');
const line = prefix => source.split('\n').find(l => l.startsWith(prefix));
function fn(name) {
  const at = source.indexOf('async function ' + name + '(');
  assert.ok(at >= 0, 'actual function exists: ' + name);
  const end = source.indexOf('\nasync function ', at + 1);
  return source.slice(at, end < 0 ? source.length : end);
}
function harness() {
  const calls = [], records = new Map(), counters = new Map();
  const item = { id: 'oc_4173959354744833', t: 'Scheerolie 30 ml', p: 8.19, vr: true };
  const unavailable = { id: 'oc_unavailable', t: 'Niet leverbaar', p: 10, vr: false };
  const kv = {
    get: async k => records.get(k) ?? null,
    set: async (k, v) => { records.set(k, v); calls.push(['set', k]); },
    mget: async (...keys) => keys.map(k => counters.get(k) ?? 0),
    incrMany: async entries => entries.forEach(([k, n]) => counters.set(k, (counters.get(k) || 0) + n)),
    raw: async () => []
  };
  const context = vm.createContext({
    URL, Date, Buffer, console, setTimeout, clearTimeout, kv,
    K: { rec: c => 'rec:' + c, top: 'top', crmap: 'map', set: (s, n) => s + ':' + n, hll: () => 'hll' },
    catalog: async () => ({ items: [item, unavailable] }),
    seed: { ads: [{ pid: item.id }] },
    randomBytes: () => Buffer.from('112233445566', 'hex'),
    shortId: s => createHash('sha256').update(s).digest('hex').slice(0, 12),
    nieuwId: () => 'abcdef012345',
    leesCookie: () => '',
    num: v => Number(v) || 0,
    pidOk: v => /^[A-Za-z0-9_-]{3,64}$/.test(String(v || '')) ? String(v) : '',
    isBot: ua => /bot|crawl|spider|headless|preview|python|curl|wget/i.test(String(ua || '')),
    themaVan: () => 'beauty',
    plekId: s => String(s || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase().slice(0, 40),
    digits: (s, n = 14) => String(s || '').replace(/\D/g, '').slice(0, n),
    whId: s => String(s || ''),
    pk: s => String(s).toLowerCase().replace(/[^a-z0-9]/g, ''),
    laterAf: p => p,
    inc: async (keys, rec) => kv.incrMany(context.api.pinCohortEntries(rec, keys.map(k => ['c:' + k, 1]))),
    uurTel: async (...a) => calls.push(['hour', ...a.slice(1)]),
    sadd: async (...a) => calls.push(['setMembers', ...a]),
    cidKoppel: async (_, x) => calls.push(['cid', x]),
    verwerkKlik: async (_, x) => calls.push(['click', x]),
    serverSignalen: () => ({}),
    apparaat: () => 'unit-device',
    echteKlikId: () => true,
    laadDc: async () => {},
    dcVan: () => ({ dc: false }),
    isBotZone: async () => false,
    nlUur: () => '12',
    D8: () => '20261116',
    DAY: () => '2026-11-16',
    PX_SOORT: { cart: 'cart', koop: 'koop', afreken: 'afreken' }, PB: {},
    warmZet: async () => {}, isBewust: () => false, kassaDoel: async () => false, log: async () => {},
    SOORTEN: ['view', 'dv', 'dm', 'da', 'dt15', 'ds50', 'dwk', 'cart', 'koop', 'omzet'],
    look: () => '', ACC: {}, esc: s => String(s ?? ''), eur: n => String(n),
  });
  const cm = directSource.split('\n').find(l => l.startsWith('export const CM_NET ='));
  vm.runInContext(line('const NETTEN =') + '\n' + line('const netVan =') + '\n' +
    directSource.split('\n').find(l => l.startsWith('export function pinCohortEntries')).replace('export ', '') + '\n' + cm.replace('export const', 'const') + '\n' + fn('direct') + '\n' + fn('land') + '\n' + fn('pxVerwerk') +
    '\n' + line('async function dagTotaal(') + '\n' + line('async function netTotaal(') +
    '\nthis.api = { pinCohortEntries, land, direct, netVan, dagTotaal, netTotaal, pxVerwerk, CM_NET };', context);
  function response() {
    return {
      statusCode: 200, headers: {}, body: null,
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      status(n) { this.statusCode = n; return this; },
      send(v) { this.body = v; return this; },
      json(v) { this.body = v; return this; },
      end(v = '') { this.body = v; return this; }
    };
  }
  return { ...context.api, context, response, item, calls, records, counters };
}
async function visit(h, query = {}, ua = 'Mozilla/5.0 Mobile Safari/604.1') {
  const q = new URLSearchParams({ p: h.item.id, utm_source: 'pinterest', utm_medium: 'paid_social', campaignid: '626760328323', pp: '0', creativeid: '687000000001', zoneid: '268000000001', ...query });
  const res = h.response();
  await h.land({ headers: { 'user-agent': ua } }, res, new URL('https://keuzehulp.best/shop?' + q));
  return res;
}
test('Pinterest has its own source while other networks retain their identities', () => {
  const h = harness();
  assert.equal(h.netVan('pinterest'), 'pi');
  assert.equal(h.CM_NET.pi, 'pinterest');
  for (const [src, net] of [['propeller', 'pa'], ['tiktok', 'tt'], ['whop', 'wh'], ['unrelated', 'x']]) assert.equal(h.netVan(src), net);
});
test('paid landing without epik redirects directly and keeps ad/campaign attribution', async () => {
  const h = harness(), r = await visit(h);
  assert.equal(r.statusCode, 302);
  const target = new URL(r.headers.location);
  assert.equal(target.hostname, 'kadoly.com');
  assert.equal(target.pathname, '/product/' + h.item.id);
  assert.equal(target.searchParams.get('utm_source'), 'pinterest');
  assert.equal(target.searchParams.get('utm_medium'), 'paid_social');
  assert.equal(target.searchParams.get('utm_campaign'), '626760328323');
  assert.ok(target.searchParams.get('hj'));
  assert.ok(target.searchParams.get('mmc'));
  assert.equal(target.searchParams.has('epik'), false);
  const rec = [...h.records.values()][0];
  assert.equal(rec.s, 'pi'); assert.equal(rec.a, '687000000001'); assert.equal(rec.k, '626760328323');
  assert.match(rec.c, /^pix/);
  assert.equal(h.counters.get('c:sh-pi-dv'), 1);
  assert.equal(h.counters.get('c:sh-x-dv'), undefined);
  assert.equal(h.calls.find(x => x[0] === 'click')[1].net, 'pinterest');
});
test('real epik survives redirect and duplicate requests reuse the same visitor record', async () => {
  const h = harness(), a = await visit(h, { epik: 'epik-real_123' }), b = await visit(h, { epik: 'epik-real_123' });
  assert.equal(new URL(a.headers.location).searchParams.get('epik'), 'epik-real_123');
  assert.equal(new URL(a.headers.location).searchParams.get('hj'), new URL(b.headers.location).searchParams.get('hj'));
  assert.equal(h.records.size, 1);
  assert.equal(h.counters.get('c:sh-pi-dv'), 1);
});
test('link preview sees the same offer without cookie, visitor record or measurement', async () => {
  const h = harness(), r = await visit(h, {}, 'Pinterestbot/1.0');
  assert.equal(r.statusCode, 302);
  const target = new URL(r.headers.location);
  assert.equal(target.pathname, '/product/' + h.item.id);
  assert.equal(target.searchParams.get('utm_medium'), 'paid_social');
  assert.equal(target.searchParams.has('hj'), false); assert.equal(target.searchParams.has('mmc'), false);
  assert.equal(r.headers['set-cookie'], undefined);
  assert.equal(h.records.size, 0); assert.equal(h.counters.size, 0);
  assert.equal(h.calls.some(x => x[0] === 'click'), false);
});
test('unavailable and unknown advertised products never become another offer', async () => {
  for (const p of ['oc_unavailable', 'oc_unknown']) {
    const h = harness(), r = await visit(h, { p });
    assert.equal(r.statusCode, 404);
    assert.equal(r.headers.location, undefined);
    assert.equal(h.records.size, 0);
  }
});
test('own QA click is excluded from performance counters and ad membership', async () => {
  const h = harness(), r = await visit(h, { clickid: 'test-pinterest-qa' });
  assert.equal(r.statusCode, 302);
  assert.equal([...h.records.values()][0].t, 1);
  assert.equal(h.counters.size, 0);
  assert.equal(h.calls.some(x => x[0] === 'setMembers' || x[0] === 'click'), false);
});
test('organic Pinterest medium does not enter the paid cohort', async () => {
  const h = harness(), r = await visit(h, { utm_medium: 'organic_social' });
  assert.equal(r.statusCode, 200);
  assert.equal(h.counters.get('c:sh-pi-dv'), undefined);
  assert.equal(h.records.size, 0);
});
test('unexpanded epik macro is not presented as a Pinterest click identifier', async () => {
  const h = harness(), r = await visit(h, { epik: '{epik}' });
  assert.equal(new URL(r.headers.location).searchParams.has('epik'), false);
  assert.match([...h.records.values()][0].c, /^pix/);
});
test('existing TikTok fallback remains a separate source', async () => {
  const h = harness(), r = await visit(h, { utm_source: 'tiktok' });
  assert.equal(r.statusCode, 302);
  assert.equal([...h.records.values()][0].s, 'tt');
  assert.equal(h.counters.get('c:sh-pi-dv'), undefined);
});
test('daily and all-time totals include Pinterest without changing other sources', async () => {
  const h = harness();
  h.counters.set('c:sh-d20261116-pi-dv', 7); h.counters.set('c:sh-pi-dv', 12);
  h.counters.set('c:sh-d20261116-tt-dv', 2);
  assert.equal((await h.dagTotaal('2026-11-16')).pi.dv, 7);
  assert.equal((await h.netTotaal()).pi.dv, 12);
  assert.equal((await h.dagTotaal('2026-11-16')).tt.dv, 2);
});
test('read-only paid report keeps successful cart and paid-order counts distinct', async () => {
  const h = harness();
  h.context.smembers = async () => ['687000000001'];
  h.context.num = v => Number(v) || 0; h.context.D8 = () => '20261116';
  h.context.tellers = async () => ({ '687000000001': { dv: 10, dm: 3, cart: 1, koop: 0, omzet: 0 } });
  const start = source.indexOf("    if (op === 'pinads') {"), end = source.indexOf("    if (op === 'ttads') {", start);
  assert.ok(start > 0 && end > start);
  const reader = vm.runInContext('(async function(res) { const op="pinads";' + source.slice(start, end) + '})', h.context);
  const r = h.response(); await reader(r);
  assert.equal(r.statusCode, 200); assert.equal(r.body.netwerk, 'pinterest');
  assert.equal(r.body.ads['687000000001'].cart, 1);
  assert.equal(r.body.ads['687000000001'].koop, 0);
  assert.match(r.body.uitleg, /geen unieke mensen/);
});

test('Pinterest QA cart and order signals do not pollute paid cohorts', async () => {
  const h = harness(), r = await visit(h, { clickid: 'test-pinterest-qa' });
  const code = new URL(r.headers.location).searchParams.get('hj');
  assert.equal((await h.pxVerwerk(code, 'cart', 0, '', '', 'unit')).test, true);
  assert.equal((await h.pxVerwerk(code, 'koop', 20, 'unit-order', '', 'unit')).test, true);
  assert.equal(h.counters.size, 0);
});
test('real paid cart and order stay attributed to Pinterest and duplicate orders are ignored', async () => {
  const h = harness(), r = await visit(h);
  const code = new URL(r.headers.location).searchParams.get('hj');
  await h.pxVerwerk(code, 'cart', 0, '', '', 'unit');
  await h.pxVerwerk(code, 'koop', 20, 'unit-order', '', 'unit');
  await h.pxVerwerk(code, 'koop', 20, 'unit-order', '', 'unit');
  assert.equal(h.counters.get('c:sh-pi-cart'), 1);
  assert.equal(h.counters.get('c:sh-pi-koop'), 1);
  assert.equal(h.counters.get('c:sh-pi-omzet'), 2000);
  assert.equal(h.counters.get('c:sh-x-koop'), undefined);
});

test('pp0, pp1 and missing or invalid pp retain separate attribution through late orders', async () => {
  for (const [pp, cohort, medium] of [['0', 'paid', 'paid_social'], ['1', 'earned', 'organic_social'], ['', 'unknown', 'paid_social'], ['bogus', 'unknown', 'paid_social']]) {
    const h = harness(), r = await visit(h, { pp });
    const target = new URL(r.headers.location), code = target.searchParams.get('hj');
    assert.equal(target.searchParams.get('pin_traffic'), cohort);
    assert.equal(target.searchParams.get('utm_medium'), medium);
    assert.equal(target.searchParams.get('pp'), /^[01]$/.test(pp) ? pp : null);
    assert.equal([...h.records.values()][0].pc, cohort);
    assert.equal(h.counters.get('c:sh-pi-' + cohort + '-dv'), 1);
    await h.pxVerwerk(code, 'cart', 0, '', '', 'unit');
    await h.pxVerwerk(code, 'koop', 19.95, 'order-' + cohort, '', 'unit');
    await h.pxVerwerk(code, 'koop', 19.95, 'order-' + cohort, '', 'unit');
    assert.equal(h.counters.get('c:sh-pi-' + cohort + '-cart'), 1);
    assert.equal(h.counters.get('c:sh-pi-' + cohort + '-koop'), 1);
    assert.equal(h.counters.get('c:sh-pi-' + cohort + '-omzet'), 1995);
    assert.equal(h.counters.get('c:sh-pi-' + cohort + '-a687000000001-omzet'), 1995);
    for (const other of ['paid', 'earned', 'unknown'].filter(c => c !== cohort)) assert.equal(h.counters.get('c:sh-pi-' + other + '-koop'), undefined);
  }
});
test('saved-ad and paid clicks sharing an epik do not merge cohorts', async () => {
  const h = harness();
  const a = await visit(h, { epik: 'same-epik', pp: '0' }), b = await visit(h, { epik: 'same-epik', pp: '1' });
  assert.notEqual(new URL(a.headers.location).searchParams.get('hj'), new URL(b.headers.location).searchParams.get('hj'));
  assert.equal(h.records.size, 2);
});
test('unknown historical record is not retrospectively labelled paid', () => {
  const h = harness();
  const entries = h.pinCohortEntries({s: 'pi'}, [['c:sh-pi-koop', 1]]);
  assert.ok(entries.some(([k]) => k === 'c:sh-pi-unknown-koop'));
  assert.ok(!entries.some(([k]) => k === 'c:sh-pi-paid-koop'));
});
test('cohort helper leaves other networks and tests unchanged', () => {
  const h = harness(), e = [['c:sh-tt-cart', 1], ['c:sh-pi-cart', 1]];
  assert.equal(h.pinCohortEntries({s: 'tt'}, e), e);
  assert.equal(h.pinCohortEntries({s: 'pi', t: 1}, e), e);
});
test('earned previews and own QA cannot pollute any cohort', async () => {
  for (const pp of ['0', '1', '']) {
    const h = harness();
    await visit(h, { pp }, 'Pinterestbot/1.0');
    assert.equal(h.counters.size, 0);
    const r = await visit(h, { pp, clickid: 'test-pinterest-pp-' + pp });
    await h.pxVerwerk(new URL(r.headers.location).searchParams.get('hj'), 'koop', 20, 'qa-order', '', 'unit');
    assert.equal(h.counters.size, 0);
  }
});
test('actual shop interaction handler mirrors the retained cohort', async () => {
  const h = harness(), r = await visit(h, { pp: '1' });
  const code = new URL(r.headers.location).searchParams.get('hj'), rec = h.records.get('rec:' + code);
  h.records.set('hjdk:shc:' + code, rec);
  Object.assign(h.context, { GEDRAG: { t15: 't15' }, BEWUST: [], KASSALOG: new Set(), PA_TIK_MIN: 10000, K_MEET: 'test-meet' });
  const at = directSource.indexOf('export async function shopUitkomst(');
  const handler = vm.runInContext('(' + directSource.slice(at).replace('export ', '') + ')', h.context);
  await handler(h.context.kv, code, 'echt');
  await handler(h.context.kv, code, 't15');
  await handler(h.context.kv, code, 'echt');
  assert.equal(h.counters.get('c:sh-pi-earned-dm'), 1);
  assert.equal(h.counters.get('c:sh-pi-earned-dt15'), 1);
  assert.equal(h.counters.get('c:sh-pi-paid-dm'), undefined);
});
test('public report excludes earned and unknown from top-level paid totals', async () => {
  const h = harness();
  await visit(h, { pp: '1' });
  await visit(h, { pp: '' });
  h.context.smembers = async () => ['687000000001'];
  h.context.tellers = vm.runInContext('(' + fn('tellers') + '\n)', h.context);
  const start = source.indexOf("    if (op === 'pinads') {"), end = source.indexOf("    if (op === 'ttads') {", start);
  const reader = vm.runInContext('(async function(res) { const op="pinads";' + source.slice(start, end) + '})', h.context);
  const r = h.response(); await reader(r);
  assert.equal(r.body.vandaag.aan, 0);
  assert.equal(r.body.ads['687000000001'].aan, 0);
  assert.equal(r.body.cohorten.earned.vandaag.aan, 1);
  assert.equal(r.body.cohorten.unknown.vandaag.aan, 1);
  assert.equal(r.body.allePinterest.aan, 2);
});
