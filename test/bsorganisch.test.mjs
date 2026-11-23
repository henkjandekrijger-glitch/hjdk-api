import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Alleen Telegram is vervangen. De echte aggregatie en rapporttekst draaien op een vaste dagfixture.
const meetUrl = new URL('../lib/bsmeet.js', import.meta.url).href;
const source = (await readFile(new URL('../lib/bsorganisch.js', import.meta.url), 'utf8'))
  .replace("import { telegram } from './dagoverzicht.js';", 'const telegram = async () => { throw new Error("geen verzending in deze test"); };')
  .replace("'./bsmeet.js'", JSON.stringify(meetUrl));
const { dagCijfers, rapportTekst } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const day = '2026-11-22';
function fixture(bs = 7, lc = 13, clicks = 208) {
  const hashes = {
    ['bs:tel:' + day]: { 'bs|direct': bs, 'lc|direct': lc, 'bs|p|/': bs, 'lc|p|/': lc },
    ['bs:klik:' + day]: { BOOK: clicks },
    ['bs:gosrc:' + day]: { 'bs|pinterest': 3, 'lc|direct': 5, 'google': 2 }
  };
  return { raw: async ([op, key]) => op === 'HGETALL' ? Object.entries(hashes[key] || {}).flat() : null };
}
test('Amazonbronregels blijven per site, onbekende historische site wordt niet geraden', async () => {
  const x = await dagCijfers(fixture(), day);
  assert.equal(x.amazon, 208);
  assert.deepEqual(x.amazonPerSite, { bs: 3, lc: 5, onbekend: 2 });
  assert.equal(x.site.bs.totaal, 7); assert.equal(x.site.lc.totaal, 13);
});
test('208 redirects naast 20 pagina-openingen worden niet als unieke kliks of groei gepresenteerd', async () => {
  const { tekst } = await rapportTekst(fixture(), day);
  assert.match(tekst, /Amazonverzoeken: 208 \(ruwe redirects, geen unieke personen\)/);
  assert.match(tekst, /stockingbooks.com 3, lastingchange.works 5/);
  assert.match(tekst, /stockingbooks.com\/ 7/);
  assert.match(tekst, /lastingchange.works\/ 13/);
  assert.doesNotMatch(tekst, /Naar Amazon:|208 kliks|\(\+208\)|klikten er/);
  assert.match(tekst, /Nog geen betrouwbaar doorklikpercentage/);
});
test('LC-verzoeken kunnen geen Stocking Books-conversielek wegdrukken of creëren', async () => {
  for (const clicks of [1, 208]) {
    const { tekst } = await rapportTekst(fixture(50, 100, clicks), day);
    assert.doesNotMatch(tekst, /van 50 bezoeken|boekkeuze hoger/);
    assert.match(tekst, /eerst meten, dan een inhoudsproef kiezen/);
  }
});
