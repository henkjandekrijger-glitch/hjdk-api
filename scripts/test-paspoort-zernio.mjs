// Controle zonder Redis of netwerk: de platformimport mag het opgegeven doel niet vervangen door zijn klikmeting.
import test from 'node:test';
import assert from 'node:assert/strict';
import { schoon, stukUitZernio } from '../lib/paspoort.js';

const post = (extra = {}) => ({
  _id: 'kadoly-pin', status: 'published', platform: 'pinterest', mediaType: 'image',
  content: 'Welke breedte past?\nBereken het op https://gids.kadoly.com/tv-meubel-breedte-berekenen',
  publishedAt: '2026-11-26T18:45:58.163Z',
  platforms: [{ platform: 'pinterest', accountUsername: 'kadolyshop' }],
  analytics: { impressions: 123, clicks: 4, saves: 2 }, ...extra
});
const maker = doel => schoon({ id: 'pin:z-kadolypin', medium: 'pinterest', project: 'kadoly', doel,
  doelgetal: 1, doelop: '2026-12-03', titel: 'Welke breedte past?' }).stuk;

test('een import behoudt het expliciete koopdoel en de oordeeldatum', () => {
  const r = schoon(stukUitZernio(post()), maker('koop'));
  assert.equal(r.ok, true);
  assert.deepEqual(r.stuk.doel, { soort: 'koop', getal: 1, op: '2026-12-03', afgeleid: false });
  assert.equal(r.stuk.cijfers.kliks, 4);
  assert.equal(Object.hasOwn(r.stuk.cijfers, 'koop'), false);
});
test('een bewust gekozen klikdoel blijft een klikdoel', () => {
  assert.equal(schoon(stukUitZernio(post()), maker('klik')).stuk.doel.soort, 'klik');
});
test('zonder verklaring is Kadoly koop een afgeleid doel, geen opgegeven doel', () => {
  const r = schoon(stukUitZernio(post()));
  assert.equal(r.stuk.doel.soort, 'koop');
  assert.equal(r.stuk.doel.afgeleid, true);
});
test('ook bij herhaald inlezen blijven id en expliciet doel gelijk', () => {
  const eerste = schoon(stukUitZernio(post()), maker('aanmelding')).stuk;
  const tweede = schoon(stukUitZernio(post({ analytics: { impressions: 150, clicks: 5 } })), eerste).stuk;
  assert.equal(tweede.id, eerste.id);
  assert.deepEqual(tweede.doel, eerste.doel);
  assert.equal(tweede.cijfers.kliks, 5);
});
test('een nieuw Nexy-stuk krijgt zijn projectdoel en geen universeel klikdoel', () => {
  const r = schoon(stukUitZernio(post({ content: 'Nexy helpt', platforms: [{ accountUsername: 'nexy' }] })));
  assert.equal(r.stuk.doel.soort, 'store');
  assert.equal(r.stuk.doel.afgeleid, true);
});
test('geplande posts en reeds bij Videomind gemelde posts worden niet extra ingevoerd', () => {
  assert.equal(stukUitZernio(post({ status: 'scheduled' })), null);
  assert.equal(stukUitZernio(post(), new Set(['kadoly-pin'])), null);
});
