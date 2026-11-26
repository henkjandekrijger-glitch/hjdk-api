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
  assert.match(leeg, /<b>17<\/b><span>dagen na de klacht<\/span><span class="stand-sub">nog geen terugbetaling/);
  assert.match(leeg, /Nog 6 dagen/);
  assert.doesNotMatch(leeg, /gelezen|ik ook|volg/);
  const vol = standBlok(d, { bekeken: { blendle: DREMPEL.gelezen }, ikook: { blendle: '1' }, volgers: { blendle: 2 }, gedeeld: { blendle: 0 } }, nu);
  assert.match(vol, /<b>10<\/b><span>keer gelezen<\/span><\/div>/);
  assert.match(standBlok(d, { bekeken: { blendle: 40 }, vandaag: { blendle: 7 } }, nu), /<b>40<\/b><span>keer gelezen<\/span><span class="stand-sub">7 vandaag/);
  assert.match(vol, /1<\/b> zei: ik ook/);
  assert.match(vol, /2<\/b> volgen dit dossier/);
  assert.doesNotMatch(vol, /gedeeld/);
  assert.match(standBlok(d, { gedeeld: { blendle: 4 } }, nu), /<b>4<\/b><span>keer gedeeld/);
  assert.match(standBlok({ ...d, bereik: { regels: [{ waar: 'AI', tekst: 'noemt dit nog niet', bron: 'x' }] } }, {}, nu), /<li><b>AI<\/b> noemt dit nog niet/);
  assert.match(standBlok(d, {}, new Date('2026-12-03T12:00:00Z')), /termijn van 2 december is verstreken/);
  assert.equal(standBlok({ id: 'x', naam: 'X' }, {}, nu), '');
});
