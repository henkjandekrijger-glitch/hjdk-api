// Controle van het Mailmind-tempo (lib/mailmind.js volumeBesluit). Draai: node scripts/test-mailmind-volume.mjs
// Henkjan 27 nov 2026 "akkoord": bij een toestemmingsmail (stopIsAntwoord) remt een stop het tempo niet, een bounce wel.
// De regel staat hier als bron uit het bestand gelezen, zodat de test geen database of sleutels nodig heeft.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const bron = await fs.readFile(new URL('../lib/mailmind.js', import.meta.url), 'utf8');
const m = bron.match(/export function volumeBesluit\([\s\S]*?\n}\n/);
assert.ok(m, 'volumeBesluit niet gevonden in lib/mailmind.js');
const N = x => Number(x) || 0;
const volumeBesluit = new Function('N', m[0].replace('export function', 'return function'))(N);
const DAG = 86400000, nu = Date.parse('2026-11-28T08:23:00Z');
const basis = { perDag: 80, max: 150, stap: 25, stapDagen: 1, knopAt: nu - 2 * DAG, nu };

// 1. De stand van 27 nov 2026: 15 stops en 5 bounces op 86. Gewone stroom: halveren op stops.
assert.deepEqual(volumeBesluit({ ...basis, V: 86, B: 5, A: 15 }), { perDag: 40, waarom: 'stops' });
// 2. Zelfde cijfers bij de toestemmingsmail: stops remmen niet; 5,8% bounces = gelijk blijven (niet groeien, niet halveren).
assert.deepEqual(volumeBesluit({ ...basis, V: 86, B: 5, A: 15, stopIsAntwoord: true }), { perDag: 80, waarom: 'gelijk' });
// 3. Toestemmingsmail met weinig bounces groeit, ook met veel stops.
assert.deepEqual(volumeBesluit({ ...basis, V: 174, B: 6, A: 30, stopIsAntwoord: true }), { perDag: 105, waarom: 'groei' });
// 4. De rem op bounces blijft, ook bij de toestemmingsmail.
assert.deepEqual(volumeBesluit({ ...basis, V: 100, B: 8, A: 0, stopIsAntwoord: true }), { perDag: 40, waarom: 'bounces' });
// 5. Nooit boven het maximum, nooit onder 10, en niet twee keer groeien binnen de stap.
assert.equal(volumeBesluit({ ...basis, perDag: 140, V: 400, B: 4, A: 80, stopIsAntwoord: true }).perDag, 150);
assert.equal(volumeBesluit({ ...basis, perDag: 12, V: 100, B: 20, A: 0 }).perDag, 10);
assert.equal(volumeBesluit({ ...basis, knopAt: nu - 3600000, V: 174, B: 6, A: 0, stopIsAntwoord: true }).perDag, 80);
// 6. Onder 40 mails geen oordeel.
assert.equal(volumeBesluit({ ...basis, V: 39, B: 10, A: 10 }).waarom, 'te weinig mails');
// 7. De Tania-stroom heeft de vlag, en de ronde geeft de stroom door aan volume().
const tk = await fs.readFile(new URL('../lib/tkmc.js', import.meta.url), 'utf8');
assert.ok(/stopIsAntwoord:\s*true/.test(tk), 'tk-mailchimp mist stopIsAntwoord');
assert.ok(bron.includes('await volume(s, R, D)'), 'de ronde geeft de stroom niet door aan volume()');
console.log('mailmind-volume: 10 controles goed');
