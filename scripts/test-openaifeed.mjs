// Test van de ChatGPT-productfeed (lib/openaifeed.js): negen verplichte velden, prijs met verzending, JPEG-foto, geen HTML, uitverkocht blijft erin.
import assert from 'node:assert/strict';
import { openaiFeed, gidsPerPid, gidsenPerPid } from '../lib/openaifeed.js';
import { GIDSEN } from '../lib/gidsen-kadoly.js';
const items = [
  { id: 'oc_4174003724075009', t: 'Bouclé plaid Paris ivoor', p: 49.29, vk: 4.95, b: 'Mica Decorations', c: 'wonen', s: 'textiel', img: 'https://cdn.kadoly.com/a.webp', lt: 4, vr: true },
  { id: 'oc_2', t: 'Vaas <b>groen</b>', p: 20, vk: 0, fs: true, img: 'https://cdn.kadoly.com/b.jpg', vr: false },
  { id: 'oc_3', t: 'Zonder foto', p: 10 },
  { id: 'oc_4', t: 'Gratis', p: 0, img: 'x' },
];
const f = openaiFeed(items, gidsPerPid(GIDSEN));
const rijen = f.jsonl.trim().split('\n').map(l => JSON.parse(l));
assert.equal(rijen.length, 2); assert.equal(f.tel.overgeslagen, 2);
for (const r of rijen) for (const k of ['item_id', 'title', 'description', 'url', 'brand', 'seller_name', 'image_url', 'availability', 'price']) assert.ok(r[k], k + ' ontbreekt');
assert.equal(rijen[0].price, '54.24 EUR'); assert.equal(rijen[0].availability, 'in_stock'); assert.ok(rijen[0].image_url.endsWith('.jpg'));
assert.ok(rijen[0].description.includes('Goed om te weten'), 'feiten uit de gids'); assert.equal(f.tel.metGids, 1);
assert.equal(rijen[1].availability, 'out_of_stock'); assert.equal(rijen[1].price, '20.00 EUR'); assert.ok(!/[<>]/.test(rijen[1].title)); assert.equal(rijen[1].brand, 'Kadoly');
assert.ok(rijen.every(r => !/[–—]/.test(JSON.stringify(r))));
const m = gidsenPerPid(GIDSEN); assert.ok(m['oc_4174003724075009'].some(x => x.url === 'https://gids.kadoly.com/wollen-deken'));
console.log('ChatGPT-feed: velden, prijs, foto, gidsfeiten, uitverkocht en gidslinks geslaagd.');
