import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as C from '../lib/cur.js';
import * as B from '../lib/curbedrijf.js';
import { dataGelijk, gidsBedrijf } from '../lib/curconsistent.js';
import { khRang, khScores } from '../lib/curkh.js';
import { reviewScore } from '../lib/autohuur-curacao.js';
const rows = JSON.parse(fs.readFileSync(fs.existsSync('source/current-directory.json') ? 'source/current-directory.json' : 'scripts/fixtures/cur-bedrijven.json'));
const all = (rows.items || rows).map(x => gidsBedrijf(x, x.cs));
const read = async cs => all.filter(x => x.cs === cs);
for (const o of C.ONDERWERPEN.filter(o => o.data?.items?.length)) {
  const D = await dataGelijk(o, o.data, read), K = khRang(D, D._prof, C.curRang), order = [...K.rang, ...K.zonder];
  for (const x of khScores(D.items, D._prof)) if (x.q) assert.equal(x.q.gem, reviewScore(x.v).gemiddeld, o.id + ' / ' + x.v.id + ' same displayed review mean');
  if (['autohuur', 'excursies'].includes(o.id)) assert.deepEqual(order.map(x => x.v.id), C.curRang(D.items, D.vragen || [], (D.vragen || []).map(() => 0), D.reviewGewicht).map(x => x.v.id));
  if (o.id !== 'bouwmarkt') continue;
  const h = C.renderOnderwerp('nl', o, [], D, null, null, D._prof);
  assert(!/Invalid Date/.test(h));
  for (const x of order) {
    const v = x.v, P = D._prof[v.id], detail = C.renderBedrijf('nl', o, D, v, P, null);
    const expected = order.findIndex(x => x.v.id === v.id) + 1;
    assert(detail.includes('plek ' + expected) || detail.includes('Plek ' + expected), v.naam + ' matching position ' + expected);
    if (P) { const direct = C.renderGidsBedrijf('nl', { at: '2026-10-22', cats: { [P.cs]: { t_nl: 'Bouwmarkten' } } }, P.cs, all.filter(x => x.cs === P.cs), P); assert(direct.includes(P.naam)); assert(!direct.includes('00:00-00:00')); assert.equal(B.reviewIdentiteit(o.id, v.id).slug, P.slug); }
    for (const m of ['nl', 'en', 'de', 'es', 'pt']) assert(!C.renderBedrijf(m, o, D, v, P, null).includes('Invalid Date'));
  }
}
assert.equal(B.rooster({ mon: '00:00-00:00' }), null);
assert.equal(B.statusNu(B.rooster({ mon: '07:00-19:00' }), Date.parse('2026-11-22T12:00:00Z')), null); // unknown Sunday
assert.equal(B.weekRegel('nl', B.rooster({ mon: '07:00-19:00' })), 'ma 07:00-19:00');
assert.equal(B.weekRegel('nl', B.rooster({ mon: '00:00-24:00' })), 'ma 00:00-24:00');
console.log('Alle keuzehulpen: reviewgemiddelde gelijk; tourvolgorde behouden; bouwmarktkaarten, detail, talen, reviews en uren consistent.');
