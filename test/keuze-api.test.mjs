import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/keuze-tools.js';
import { TOOL_CLIENT } from '../lib/keuze-client.js';
import fs from 'node:fs/promises';

async function request(url, body, method = 'GET') {
  const headers = {}; let status = 200, data;
  const res = { setHeader(k, v) { headers[k.toLowerCase()] = v; }, status(n) { status = n; return this; }, json(v) { data = v; return this; }, send(v) { data = v; return this; }, end() { return this; } };
  await handler({ url, body, method, headers: { host: 'keuzehulp.best', 'user-agent': 'Keuzehulpen test' } }, res);
  return { status, headers, data };
}
test('real page endpoint returns localized crawlable pages with reciprocal canonical references', async () => {
  for (const [market, lang, url] of [['nl', 'nl-NL', 'https://keuzehulp.best/domeinnaam-kiezen'], ['us', 'en-US', 'https://whichtobuy.best/domain-name'], ['de', 'de-DE', 'https://kaufberater.best/domain-finden']]) {
    const r = await request('/api/keuze-tools?tool=domain&market=' + market);
    assert.equal(r.status, 200); assert.equal(r.headers['x-robots-tag'], 'index, follow');
    assert(r.data.includes('<html lang="' + lang + '">'));
    assert(r.data.includes('<link rel="canonical" href="' + url + '">'));
    assert.equal((r.data.match(/<h1>/g) || []).length, 1);
    for (const code of ['nl-NL', 'en-US', 'de-DE', 'x-default']) assert(r.data.includes('hreflang="' + code + '"'));
    const ld = JSON.parse(r.data.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert(ld['@graph'].some(x => x['@type'] === 'WebApplication'));
    await fs.mkdir(new URL('../../previews/', import.meta.url), { recursive: true });
    await fs.writeFile(new URL('../../previews/domain-' + market + '.html', import.meta.url), r.data);
  }
});
test('home, VvE and street are rendered by the real advice endpoint', async () => {
  for (const [route, word] of [['0-0-0', 'aansluiting'], ['1-2-3', 'VvE'], ['2-2-0', 'openbaar']]) {
    const r = await request('/api/keuze-tools?op=laadadvies&a=' + route);
    assert.equal(r.status, 200); assert(r.data.ok); assert(r.data.html.includes(word));
    if (route[0] !== '0') assert.equal(r.data.productsHtml, '');
  }
  const p = await request('/api/keuze-tools?tool=laadpaal&market=nl&q0=2&q1=2&q2=3');
  assert(p.data.includes('Begin met openbaar laden')); assert(p.data.includes('cost-form'));
  await fs.writeFile(new URL('../../previews/laadpaal.html', import.meta.url), p.data);
});
test('domain lookup validates before contacting the provider and preserves unknown prices', async () => {
  const original = globalThis.fetch; const requests = [];
  globalThis.fetch = async (url, options) => { requests.push({ url, options }); return Response.json({ domains: [{ domain: 'linden.com', available: true, years: 1, price: 12.5, renewalPrice: 16 }, { domain: 'linden.nl', available: false }] }); };
  try {
    const bad = await request('/api/keuze-tools?op=domains', { domains: ['https://127.0.0.1'] }, 'POST'); assert.equal(bad.status, 400); assert.equal(requests.length, 0);
    const wrong = await request('/api/keuze-tools?op=domains'); assert.equal(wrong.status, 405);
    const good = await request('/api/keuze-tools?op=domains', { domains: ['linden.com', 'linden.nl'] }, 'POST');
    assert.equal(good.status, 200); assert.equal(requests.length, 1); assert.equal(good.data.results[0].price, 12.5); assert.equal(good.data.results[1].price, null);
    assert.equal(requests[0].url, 'https://api.vercel.com/v1/registrar/domains/search');
    globalThis.fetch = async () => new Response('no', { status: 503 });
    const failure = await request('/api/keuze-tools?op=domains', { domains: ['linden.com'] }, 'POST'); assert.equal(failure.status, 502); assert.equal(failure.data.ok, false);
  } finally { globalThis.fetch = original; }
});
test('the same tested rules are delivered to the browser as a valid module', async () => {
  const r = await request('/api/keuze-tools?op=rules'); const module = await import('data:text/javascript,' + encodeURIComponent(r.data));
  assert(module.suggestDomains('Linden', 'us').some(x => x.domain === 'linden.com'));
  await fs.writeFile(new URL('../../previews/rules.js', import.meta.url), r.data);
  await fs.writeFile(new URL('../../previews/client.js', import.meta.url), TOOL_CLIENT);
});
