import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tijdvakken, urenNetjes, normaliseerBedrijf, vindBedrijf, stabieleSlugs, valideerInname, gegevensHash, identiteit, controleRecords } from '../lib/curdata.js';
import { bewaarGids } from '../lib/curinname.js';
import { gidsBedrijf, scoresGelijk, dataGelijk } from '../lib/curconsistent.js';
import { khScores, khRang } from '../lib/curkh.js';
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
assert.deepEqual(tijdvakken('00:00-00:00', true), []);
assert.deepEqual(tijdvakken('00:00-24:00'), []);
assert.deepEqual(tijdvakken('00:00-24:00', true), [[0, 1440]]);
assert.deepEqual(tijdvakken('21:00-02:00'), [[1260, 1560]]);
assert.deepEqual(tijdvakken('11:30 AM–9:00 PM'), [[690, 1260]]);
assert.deepEqual(tijdvakken('29:00-30:00', true), []);
assert.deepEqual(urenNetjes({ mon: '00:00-24:00' }), null);
assert.deepEqual(urenNetjes({ mon: '07:00-19:00' }), { mon: '07:00-19:00' }); // missing days are unknown
const raw = { naam: 'KFC', place_id: 'a', adres: 'A 1', site: 'javascript:alert(1)', bijgewerkt: '2026-10-01', status: 'temporarily_closed', uren: { mon: '07:00-19:00' } };
assert.equal(normaliseerBedrijf(raw).site, null);
assert.equal(normaliseerBedrijf(raw).naam, 'KFC');
assert.equal(normaliseerBedrijf(raw).uren, null);
assert.equal(normaliseerBedrijf(raw).bronDatum, '2026-10-01');
const proof = { datum: '2026-11-22', url: 'https://example.com/store', velden: { uren: { mon: '07:00-19:00' } } };
assert.equal(normaliseerBedrijf(raw, proof).uren.mon, '07:00-19:00');
assert.equal(normaliseerBedrijf(raw, proof).bronDatum, '2026-10-01');
assert.equal(normaliseerBedrijf(raw, proof).veldBron.uren.datum, '2026-11-22');
const a = { naam: 'The Flakos Grill', place_id: 'a', cs: 'fast-food-restaurant', slug: 'the-flakos-grill', lat: 12.1, lng: -68.9 }, b = { ...a, place_id: 'b', slug: 'the-flakos-grill-2', lat: 12.2, lng: -68.95 };
assert.equal(vindBedrijf({ naam: 'The Flakos Grill' }, [a, b]).zaak, null);
assert.equal(vindBedrijf({ naam: 'The Flakos' }, [a, b]).zaak, null);
assert.equal(vindBedrijf({ naam: 'The Flakos Grill', lat: 12.1, lng: -68.9 }, [a, b]).zaak.place_id, 'a');
assert.equal(vindBedrijf({ naam: 'Other', scores: [{ bron: 'https://www.google.com/maps?query_place_id=a' }] }, [a, b]).zaak.place_id, 'a');
assert.deepEqual(stabieleSlugs([b, a], [a, b], slug).map(x => x.slug), [b.slug, a.slug]);
assert.throws(() => valideerInname([{ n: 0, items: [raw] }, null], { n: 2, done: true }));
assert.throws(() => valideerInname([{ n: 0, items: [] }], { n: 1, done: true }, 100));
assert.equal(gegevensHash({ ...raw, geimporteerdOp: '2026-11-23' }), gegevensHash(raw));
const item = { id: 'x', naam: 'X', scores: [{ platform: 'Google', score: 4, aantal: 10000 }, { platform: 'Tripadvisor', score: 5, aantal: 10 }] };
assert.equal(khScores([item], {}).at(0).q.gem, 4); // every review counts once, not each platform capped at 400
const D = { items: [item], vragen: [], reviewGewicht: 0 };
assert.equal(khRang(D, {}, items => items.map(v => ({ v }))).rang[0].v.id, 'x');
// Failed stage write cannot replace the index. Same-name reorder cannot swap URLs.
const oldRows = [{ ...a, land: 'CW', aantal: 5, score: 4, cat: 'Fast food' }, { ...b, land: 'CW', aantal: 100, score: 5, cat: 'Fast food' }];
const old = { totaal: 2, at: '2026-10-22', cats: { 'fast-food-restaurant': { n: 2 } } };
const args = { pages: [{ n: 0, items: [...oldRows].reverse() }], state: { n: 1, done: true, total: 2 }, oud: old, readCat: async () => oldRows, slugify: slug, normaliseer: x => x, fingerprint: 'test', now: '2026-11-22T12:00:00Z' };
const writes = [];
await assert.rejects(bewaarGids({ ...args, put: async path => { writes.push(path); throw new Error('storage unavailable'); } }));
assert(!writes.includes('cw/gids/index.json'));
await assert.rejects(bewaarGids({ ...args, pages: [{ n: 0, items: [oldRows[0], oldRows[0]] }], put: async () => assert.fail('cannot publish a deduplication collapse') }));
const stored = new Map(); await bewaarGids({ ...args, put: async (path, value) => stored.set(path, value) });
assert.equal([...stored.keys()].at(-1), 'cw/gids/index.json');
const snapshot = [...stored.entries()].find(([key]) => key.endsWith('/cat/fast-food-restaurant.json'))[1];
assert.equal(snapshot.find(x => x.place_id === 'a').slug, a.slug);
assert.equal(snapshot.find(x => x.place_id === 'b').slug, b.slug);
assert.equal(snapshot[0].gewijzigdOp, '2026-10-22');
const changed = new Map(); await bewaarGids({ ...args, normaliseer: x => ({ ...x, adres: 'Officially corrected address' }), put: async (path, value) => changed.set(path, value) });
assert.equal([...changed.entries()].find(([key]) => key.endsWith('/cat/fast-food-restaurant.json'))[1][0].gewijzigdOp, '2026-11-22');
if (fs.existsSync('source/current-directory.json')) {
  const rows = JSON.parse(fs.readFileSync('source/current-directory.json')).items;
  const normalized = rows.map(x => gidsBedrijf(x, x.cs));
  assert.equal(normalized.length, rows.length);
  assert(!normalized.some(x => Object.values(x.uren || {}).some(t => /00:00-00:00/.test(t))));
  assert(!normalized.some(x => x.statusOnzeker && x.uren));
  const report = controleRecords(rows, '2026-11-22'); assert.equal(report.totaal, 11906);
  const proofCase = normalized.find(x => x.place_id === 'ChIJKa0ZAp2ChI4R0oOuAi0kzvc');
  assert.equal(proofCase.uren.sat, '07:00-19:00');
  const guide = JSON.parse(fs.readFileSync('data/cur/bouwmarkt.json'));
  const patched = await dataGelijk({ id: 'bouwmarkt' }, guide, async cs => normalized.filter(x => x.cs === cs));
  assert.equal(patched.items.length, guide.items.length);
  for (const v of patched.items) { assert(patched._prof[v.id]); const x = patched._prof[v.id]; assert.equal(v.naam, x.naam); assert.equal(v.scores.filter(s => /^google/i.test(s.platform)).length, 1); }
  console.log('Volledige bronset: ' + rows.length + ' bedrijven gecontroleerd; alle bouwmarkt-identiteiten en officiële uren gelijk.');
}
console.log('Gegevens, identiteit, reviewweging, datums en atomair publiceren: geslaagd.');
