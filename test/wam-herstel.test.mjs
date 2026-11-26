import test from 'node:test';
import assert from 'node:assert/strict';
import { herstelTelling, HERSTEL_TOT } from '../lib/wam-groei.js';
test('herstel telt unieke echte lezers per dag en dossier, zonder bots en alleen voor de reparatie', () => {
  const t = Date.parse('2026-11-25T12:00:00Z'), r = (o) => ({ ty: 'p', pg: 'wearemany.now/dossier/blendle?z=1', t, mens: true, vid: 'v1', ...o });
  const uit = herstelTelling([r({}), r({ vid: 'v1' }), r({ vid: 'v2' }), r({ vid: 'v3', mens: false }), r({ vid: 'v4', ua: 'Googlebot' }), r({ vid: 'v5', pg: 'wearemany.now/' }), r({ vid: 'v6', t: HERSTEL_TOT + 1 }), r({ vid: 'v7', pg: 'wearemany.now/en/dossier/errezeta' }), r({ fp: 'abcdef0123456789', vid: 'v8' }), r({ fp: 'abcdef0123456789', vid: 'v9' })]);
  assert.deepEqual(uit, { '2026-11-25': { blendle: 3, errezeta: 1 } });
});
