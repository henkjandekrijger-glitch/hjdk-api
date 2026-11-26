import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { standBlok, DREMPEL } from '../lib/wam-dossiers.js';

test('dossier-ops krijgen een body die een belofte is (c.body().catch mag niet gooien)', () => {
  const s = readFileSync(new URL('../fn/wam.js', import.meta.url), 'utf8');
  assert.match(s, /body: async \(\) => leesBody\(req\)/);
});

test('standblok: dagen, termijn en alleen echte tellers', () => {
  const d = { id: 'blendle', naam: 'Blendle', wacht: { klacht: '2026-11-09', open: 'nog geen terugbetaling', bedrijf: 'Blendle', tot: '2026-12-02' } };
  const nu = new Date('2026-11-26T15:00:00Z');
  const leeg = standBlok(d, {}, nu);
  assert.match(leeg, /17 dagen<\/b> na de eerste klacht/);
  assert.match(leeg, /Nog 6 dagen/);
  assert.doesNotMatch(leeg, /gelezen|ik ook|volg/);
  const vol = standBlok(d, { bekeken: { blendle: DREMPEL.gelezen }, ikook: { blendle: '1' }, volgers: { blendle: 2 }, gedeeld: { blendle: 0 } }, nu);
  assert.match(vol, /10<\/b> keer gelezen/);
  assert.match(vol, /1<\/b> zei: ik ook/);
  assert.match(vol, /2<\/b> volgen dit dossier/);
  assert.doesNotMatch(vol, /gedeeld/);
  assert.match(standBlok(d, {}, new Date('2026-12-03T12:00:00Z')), /termijn van 2 december is verstreken/);
  assert.equal(standBlok({ id: 'x', naam: 'X' }, {}, nu), '');
});
