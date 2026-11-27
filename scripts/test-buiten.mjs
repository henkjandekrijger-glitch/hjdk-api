// Controle (27 nov 2026, taak hdg2ux): Kadoly leest klachten uit de Nederlandse App Store, de andere projecten uit de Amerikaanse.
import assert from 'node:assert/strict';
const { PROJECTEN, klachtUrls } = await import('../lib/buiten.js');
assert.equal(PROJECTEN.kadoly.land, 'nl'); assert.ok(PROJECTEN.kadoly.apps.length >= 4);
const nl = klachtUrls('bol', 'nl', 123), us = klachtUrls('Google Voice', undefined, 9), fout = klachtUrls('x', 'NL/..', 1);
assert.ok(nl.zoek.endsWith('&country=nl') && nl.feed.includes('itunes.apple.com/nl/rss/customerreviews/id=123/'));
assert.ok(us.zoek.endsWith('&country=us') && us.feed.includes('itunes.apple.com/us/rss/customerreviews/id=9/'));
assert.ok(fout.zoek.endsWith('&country=us'));
for (const [id, p] of Object.entries(PROJECTEN)) if (id !== 'kadoly') assert.equal(p.land, undefined, id + ' blijft VS');
console.log('ok: buiten, Kadoly op de Nederlandse App Store (' + PROJECTEN.kadoly.apps.join(', ') + ')');
