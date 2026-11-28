// Test de echte route met een lokale bronkopie en een Redis-stub: geen netwerk, sleutels of database nodig.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const projecten = ['kadoly', 'todayin', 'wam', 'kdp', 'mylevel', 'bzz', 'tk-podcast', 'overig'];
const sleutel = Symbol.for('clickmind.geld.test.kv');
let handler, map, bron, bewerkingen;
const oudeFetch = globalThis.fetch, oudeSleutel = process.env.SHOP_SLEUTEL;

function stand() {
  const dagen = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const leeg = () => Object.fromEntries(projecten.map(p => [p, {}]));
  return { at: new Date().toISOString(), duurMs: 1, dagen, paDag: dagen[0], uit: leeg(), tel: leeg(), pbbot: leeg(), campagnes: {}, uitPaDag: {}, shop: { verkopen: {}, omzetEur: {}, margeEur: {}, margeBekend: 0, metKenmerk: 0, bestellingen: [], feedAt: null }, verspild: { dubbel: {} }, clickmind: { blokgedaan: [], dossiers: [] }, fouten: [], andereNetten: {}, zonderNaam: 0 };
}
function stelIn(ruw = stand(), waarden = null) {
  bron = new Map([['mm:geld:stand', ruw], ['mm:waarde', waarden]]); bewerkingen = [];
  globalThis[sleutel] = {
    async get(k) { return bron.get(k) ?? null; },
    async set(k, v) { bewerkingen.push(['set', k]); bron.set(k, v); return 'OK'; },
    async del(ks) { bewerkingen.push(['del', ...ks]); return 1; },
    async raw(a) { if (a[0] === 'SET') return 'OK'; if (a[0] === 'EXISTS') return 0; if (a[0] === 'HGETALL') return {}; if (['LRANGE', 'SMEMBERS'].includes(a[0])) return []; throw new Error('Onverwachte Redis-opdracht: ' + a[0]); },
  };
  globalThis.fetch = async () => { throw new Error('Geen netwerk toegestaan'); };
  return ruw;
}
async function vraag(url = '/api/geld?vorm=json', host = 'hjdk-api-henq.vercel.app') {
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; }, json(v) { this.body = v; return this; }, send(v) { this.body = v; return this; }, end() {} };
  await handler({ url, headers: { host }, method: 'GET' }, res);
  return res;
}
before(async () => {
  map = await mkdtemp(join(tmpdir(), 'clickmind-geld-'));
  for (const d of ['fn', 'lib']) await mkdir(join(map, d));
  await writeFile(join(map, 'package.json'), '{"type":"module"}');
  for (const f of ['fn/geld.js', 'lib/waarde.js']) await writeFile(join(map, f), await readFile(new URL('../' + f, import.meta.url)));
  await writeFile(join(map, 'lib/db.js'), 'export const kv = new Proxy({}, { get: (_, n) => (...a) => globalThis[Symbol.for("clickmind.geld.test.kv")][n](...a) });');
  await writeFile(join(map, 'lib/mdmcp.js'), 'export async function md() { return []; }');
  handler = (await import(pathToFileURL(join(map, 'fn/geld.js')).href)).default;
});
after(async () => {
  globalThis.fetch = oudeFetch; delete globalThis[sleutel];
  if (oudeSleutel === undefined) delete process.env.SHOP_SLEUTEL; else process.env.SHOP_SLEUTEL = oudeSleutel;
  await rm(map, { recursive: true, force: true });
});

test('veel aanmeldingen geven geschatte waarde, geen betaalde omzet of rendement', async () => {
  const ruw = stelIn(), d = ruw.dagen[0];
  ruw.uit.todayin[d] = { pa: 5, md: 0, kliks: 100 }; ruw.tel.todayin[d] = { aanmelding: 100 };
  const r = await vraag(); assert.equal(r.statusCode, 200);
  assert.equal(r.body.projecten.todayin.vandaag.geschatteWaarde, 10);
  assert.equal(r.body.projecten.todayin.vandaag.waardeNaKosten, 5);
  assert.equal(r.body.totaal.vandaag.soort, 'geschatte_uitkomstwaarde');
  assert.equal(r.body.shop.status, 'onbekend'); assert.equal(r.body.shop.campagneRendement, null);
  assert.match(r.body.waardering.uitleg, /Geen gemeten omzet, winst of rendement/);
  assert.doesNotMatch(r.body.oordeel.join(' '), /winst|verlies|terug per dollar/i);
  assert.deepEqual(bewerkingen, []);
});

test('eigen en geleerde waarden blijven ook in HTML schattingen', async () => {
  const ruw = stelIn(stand(), { waarden: { todayin: { aanmelding: 100000 } } }), d = ruw.dagen[0];
  ruw.uit.todayin[d] = { pa: 5, md: 0, kliks: 100 }; ruw.tel.todayin[d] = { aanmelding: 100 };
  bron.set('mm:waarde:auto', { cent: { todayin: { lezer: 200000 } } }); ruw.tel.todayin[d].lezer = 10;
  const r = await vraag('/api/geld'); assert.equal(r.statusCode, 200);
  assert.match(r.body, /Geschatte waarde per project/);
  assert.match(r.body, /geschatte waarde per \$1/);
  assert.doesNotMatch(r.body, /(?:winst|verlies)\s+[−$€\d]|terug per dollar|class="goed"/i);
  assert.match(r.body, /Ook jouw eigen getal blijft een waardeschatting/);
});

test('betaalde Kadoly-omzet staat apart en wordt niet bij de waardeschatting opgeteld', async () => {
  const ruw = stelIn(), d = ruw.dagen[0];
  ruw.tel.kadoly[d] = { koop: 1 }; Object.assign(ruw.shop, { verkopen: { [d]: 1 }, omzetEur: { [d]: 69.95 }, margeEur: { [d]: 27.58 }, margeBekend: 1, metKenmerk: 0, feedAt: ruw.at });
  const r = await vraag(); assert.equal(r.statusCode, 200);
  assert.equal(r.body.shop.omzetEur7, 69.95); assert.equal(r.body.shop.margeEur7, 27.58);
  assert.equal(r.body.totaal.week.geschatteWaarde, 7.7); assert.equal(r.body.shop.metKenmerk, 0);
  assert.equal(r.body.shop.campagneRendement, null);
  const h = await vraag('/api/geld'); assert.match(h.body, /0 van 1 bestellingen hebben een advertentiekenmerk/);
  assert.match(h.body, /Berekende marge/); assert.match(h.body, /Deze omzet wordt niet bij de geschatte waarde opgeteld/);
});

test('geen shopfeed wordt onbekend, niet nul betaalde bestellingen', async () => {
  stelIn(); const j = await vraag();
  assert.equal(j.body.shop.omzetEur7, null); assert.equal(j.body.shop.verkopen7, null); assert.equal(j.body.shop.margeEur7, null);
  const r = await vraag('/api/geld');
  assert.match(r.body, /Betaalde omzet onbekend/);
  assert.doesNotMatch(r.body, /Kadoly, zeven dagen: 0 betaalde bestellingen/);
});

test('oude JSON-velden blijven expliciete schattingsaliassen; geen uitgaven geeft geen oneindige ratio', async () => {
  const ruw = stelIn(), d = ruw.dagen[0]; ruw.tel.todayin[d] = { aanmelding: 2 };
  const r = await vraag();
  for (const s of ['vandaag', 'gisteren', 'week']) {
    const v = r.body.totaal[s]; assert.equal(v.waard, v.geschatteWaarde); assert.equal(v.verschil, v.waardeNaKosten); assert.equal(v.terugPerDollar, v.geschatteWaardePerDollar); assert.equal(v.geschatteWaardePerDollar, null);
  }
  assert.equal(r.body.waardering.oudeVelden.waard, 'geschatteWaarde');
});

test('verse berekening telt paid en betaald, nooit unpaid, refunded of testorders', async () => {
  const ruw = stelIn(), d = ruw.dagen[0]; bron.delete('mm:geld:stand');
  bron.set('hjdk:shop:lusfeed', { at: ruw.at, orders: ['paid', 'betaald', 'unpaid', 'not paid', 'refunded', ''].map((s, i) => ({ s, at: d, v: 10, n: 1, p: 'p' + i })).concat([{ s: 'paid', at: d, v: 999, hj: 'test-order' }]) });
  process.env.SHOP_SLEUTEL = 'lokale-testwaarde';
  globalThis.fetch = async (url, opt) => { assert.equal(new URL(url).pathname, '/api/statistiek'); assert.equal(JSON.parse(opt.body).perCampagne, true); return { json: async () => ({ ok: true, rijen: [] }) }; };
  const r = await vraag('/api/geld?vorm=json&vers=1'); assert.equal(r.statusCode, 200);
  assert.equal(r.body.shop.verkopen7, 2); assert.equal(r.body.shop.omzetEur7, 20);
  assert.equal(r.body.shop.status, 'gemeten'); assert.equal(r.body.shop.margeBekend, 0);
  assert.equal(r.body.shop.margeEur7, null);
  assert.equal(r.body.totaal.week.geschatteWaarde, 15.4);
});

test('beschermde host en ontsmette meldingen blijven werken', async () => {
  stelIn(); const denied = await vraag('/api/geld?vorm=json', 'keuzehulp.best'); assert.equal(denied.statusCode, 403);
  const r = await vraag('/api/geld?m=%3Cscript%3Ealert(1)%3C%2Fscript%3E'); assert.equal(r.statusCode, 200);
  assert.match(r.body, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/); assert.doesNotMatch(r.body, /<script>alert/);
  assert.match(r.headers['x-robots-tag'], /noindex/); assert.deepEqual(bewerkingen, []);
});
