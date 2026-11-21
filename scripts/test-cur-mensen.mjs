// Echte Chromium-bezoeken, serverfilters, schone tellingen en een echte Redis-race.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { createClient } from 'redis';
import { chromium } from 'playwright';
import { BOTS, botUa, mensJs, mensVerzoek, curProefEv, proefSite, mensPrefix } from '../lib/curmens.js';
import { uxJs, uxStand, sealedVoorbeeld } from '../lib/curux.js';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const date = new Date().toISOString().slice(0, 10), ronde = Date.now();
const client = createClient({ url: process.env.CUR_REDIS_URL }); await client.connect();
const site = proefSite('curbedrijf'), hk = 'mm:pfm:' + site + ':' + date, tk = 'mm:pf:' + site + ':' + ronde;
const kv = { raw: x => client.sendCommand(x.map(String)), get: async () => null };
const cfg = { ronde, waarde: { bel: 10 }, factoren: [{ id: 'knop', varianten: [{ id: 'a' }, { id: 'b' }] }] };
const b = { pid: '000000000001', d: date, c: 'i', v: { knop: 'a' } };
const bewijs = { v: 1, webdriver: false, zichtbaar: true, signaal: 'tik', ms: 1 };
let browser;
try {
  for (const ua of ['Googlebot/2.1', 'OAI-SearchBot/1.0', 'Applebot/0.1', 'bingbot/2.0', 'Claude-SearchBot/1.0', 'HeadlessChrome/130', 'Playwright', 'curl/8.0']) {
    assert(botUa(ua)); assert(!mensVerzoek({ headers: { 'user-agent': ua } }, { mens: bewijs }));
  }
  assert.equal(BOTS.length, 10);
  for (const mens of [null, { ...bewijs, webdriver: true }, { ...bewijs, zichtbaar: false }, { ...bewijs, signaal: 'zichtbaar', ms: 2999 }]) {
    assert(!mensVerzoek({ headers: { 'user-agent': UA } }, { mens }));
  }
  assert(mensVerzoek({ headers: { 'user-agent': UA } }, { mens: bewijs }));
  console.log('OK serverfilters: bekende bots, webdriver, zichtbaarheid en bewijs');

  const cur = readFileSync(new URL('../lib/cur.js', import.meta.url), 'utf8');
  const hitSource = cur.slice(cur.indexOf('async function hit(req, res)'), cur.indexOf('export async function curStand'));
  const writes = [], mock = { incrMany: async x => writes.push(...x), raw: async x => writes.push(x) };
  const hit = vm.runInNewContext(hitSource + ';hit', {
    kv: mock, mensVerzoek, meetPrefix: () => 'cur:voorbeeld:', mensPrefix, VOORBEELD: true,
    CUR_MARKT: { nl: true }, DAG: () => date, GV: { telBezoek: async () => writes.push('gv') }
  });
  const res = { status() { return this; }, end() {} };
  for (const [ua, mens] of [['Googlebot/2.1', bewijs], [UA, null], [UA, { ...bewijs, webdriver: true }]]) {
    await hit({ headers: { 'user-agent': ua }, body: { m: 'nl', p: 'gids', k: 'bz-view', mens } }, res);
  }
  assert.equal(writes.length, 0);
  await hit({ headers: { 'user-agent': UA }, body: { m: 'nl', p: 'gids', k: 'bz-view', mens: bewijs } }, res);
  assert(writes.some(x => x[0] === mensPrefix() + date + ':bz-view'));
  console.log('OK server hit: afgewezen bezoeken schrijven niets');

  const pfSource = readFileSync(new URL('../lib/proef.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace(/export /g, '');
  const pf = vm.runInNewContext(pfSource + '\n;({proefEv});', {
    modalAlias: async () => '', mensVerzoek, proefSite, curProefEv, crypto: webcrypto, Uint8Array, Date, Math, Map, Set
  });
  let geweigerd = 0;
  const refuseKv = { get: async () => null, raw: async () => { geweigerd++; return null; } };
  await pf.proefEv(refuseKv, { site: 'curbedrijf', mens: bewijs }, { headers: { 'user-agent': 'Googlebot/2.1' } });
  assert.equal(geweigerd, 0);
  console.log('OK server proefev: crawler schrijft niets');

  await Promise.all([curProefEv(kv, { ...b, e: 'bel' }, cfg), curProefEv(kv, { ...b, e: 'zie' }, cfg)]);
  await curProefEv(kv, { ...b, e: 'bel' }, cfg);
  assert.equal(Number(await client.hGet(tk, 'knop|a|i|n')), 1);
  assert.equal(Number(await client.hGet(tk, 'knop|a|i|s')), 10);
  assert.equal(Number(await client.hGet(tk, 'knop|a|*|bel')), 1);
  console.log('OK echte Redis: eerste actie behouden, exposure en waarde eenmaal');

  const stand = await uxStand({ mget: async (...ks) => {
    assert(ks.every(k => k.startsWith(mensPrefix())));
    return ks.map(k => k.endsWith(':bz-view') ? 100 : k.endsWith(':bz-chat') ? 5 : 0);
  } }, 2);
  assert.equal(stand.totaal.view, 200); assert.equal(stand.per100.chat, 5); assert.equal(stand.controle.drempelBezoeken, 200);
  assert(sealedVoorbeeld('<head></head><body>Feiten</body>').endsWith('<body>Feiten</body>'));
  console.log('OK schone uxstand, beslisdrempel en inhoud ongewijzigd in ontwerpvariant');

  const meet = vm.runInNewContext('(' + cur.match(/export const meetJs = ([^\n]+)/)[1].replace(/;$/, '') + ')', { mensJs, API: '' });
  const html = '<!doctype html><html><main><div class="tik" data-uxf="knop" data-blok="knoppen"><a data-out="g-test-tel" href="#bel">Bellen</a></div><div data-ux="buurt:a"></div><div data-ux="buurt:b"></div></main><script>' + meet('nl', 'gids') + '</script><script>' + uxJs('') + '</script></html>';
  browser = await chromium.launch();
  for (const mode of ['googlebot', 'webdriver', 'mens-zichtbaar', 'mens-tik', 'mens-scroll']) {
    const context = await browser.newContext({ userAgent: mode === 'googlebot' ? 'Googlebot/2.1' : UA });
    if (mode !== 'webdriver') await context.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
    const page = await context.newPage(), events = [], fouten = [];
    page.on('pageerror', e => fouten.push(e.message));
    await page.route('**/*', async route => {
      const req = route.request(), u = new URL(req.url());
      if (u.pathname === '/') return route.fulfill({ status: 200, contentType: 'text/html', body: html });
      if (u.pathname === '/api/mm/proefkies') return route.fulfill({ json: { ok: true, aan: true, pid: 'abcdef123456', d: date, r: 5, v: { knop: 'a', buurt: 'a' } } });
      if (req.method() === 'POST') events.push(JSON.parse(req.postData()));
      return route.fulfill({ status: 204 });
    });
    await page.goto('https://meetproef.invalid/');
    if (mode === 'mens-tik') { await page.getByRole('link', { name: 'Bellen' }).click(); await page.waitForTimeout(400); }
    else if (mode === 'mens-scroll') { await page.evaluate(() => { document.body.style.height = '3000px'; }); await page.mouse.wheel(0, 300); await page.waitForTimeout(400); }
    else await page.waitForTimeout(3300);
    assert.deepEqual(fouten, [], mode);
    if (mode === 'googlebot' || mode === 'webdriver') assert.equal(events.length, 0, mode);
    else {
      assert.equal(events.filter(x => x.k === 'view-direct').length, 1, mode);
      assert.equal(events.filter(x => x.k === 'bz-view').length, 1, mode);
      assert.equal(events.filter(x => x.e === 'zie').length, 1, mode);
      if (mode === 'mens-tik') { const act = events.find(x => x.e === 'bel'); assert(act); assert.equal(act.v.knop, 'a'); }
    }
    console.log('OK echte Chromium: ' + mode);
    await context.close();
  }
  // Ontwerpcontrole van de echte gerenderde pagina, wanneer een preview is opgegeven.
  if (process.env.CUR_PREVIEW_HTML) {
    const html = readFileSync(process.env.CUR_PREVIEW_HTML, 'utf8');
    const context = await browser.newContext({ viewport: { width: 390, height: 800 }, userAgent: UA, colorScheme: 'light' });
    await context.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
    const page = await context.newPage(), fouten = [];
    page.on('pageerror', e => fouten.push(e.message));
    await page.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.pathname === '/nl/bedrijven/pizza-restaurant/pizzarroni') return route.fulfill({ status: 200, contentType: 'text/html', body: html });
      if (url.pathname === '/api/cw' && url.searchParams.get('w') === 'chatjs') return route.continue();
      if (request.method() !== 'GET' || url.pathname.startsWith('/api/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return route.continue();
    });
    await page.goto('https://curacao.day/nl/bedrijven/pizza-restaurant/pizzarroni');
    await page.locator('#bedrijf-sealed-voorbeeld').waitFor({ state: 'attached' });
    await page.locator('#bz-chat .ama').waitFor({ state: 'visible', timeout: 15000 });
    assert.equal(await page.locator('h1').innerText(), 'Pizzarroni');
    assert(await page.locator('main .tik').evaluate(el => el.getBoundingClientRect().bottom <= 800), 'knoppen in eerste mobiele scherm');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'geen horizontaal scrollen');
    await page.screenshot({ path: 'curacao-mobiel.png', fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'desktop zonder horizontaal scrollen');
    await page.screenshot({ path: 'curacao-desktop.png', fullPage: true });
    console.log('OK volledige gerenderde preview op 390 en 1280 px; screenshots opgeslagen');
    console.log('Paginafouten bij externe scripts: ' + JSON.stringify(fouten));
    await context.close();
  }
} finally {
  if (browser) await browser.close();
  await client.hDel(hk, b.pid); await client.del(tk); await client.quit();
}
