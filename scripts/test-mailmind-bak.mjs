// Controle van de bakkeuze van Mailmind (lib/mailmind-bak.js). Draai: node scripts/test-mailmind-bak.mjs
// Henkjan 27 nov 2026: "zorg dat mail mind slimmer wordt en mijn account gmail niet gekilld".
// De cijfers hieronder zijn de echte stand van tk-mailchimp op 27 nov 2026 (94 mails), zonder adressen.
import assert from 'node:assert/strict';
import { kenmerken, bank, opDeBank, verwachting, kiesBak, kenmerkStand, dagRem, PRIOR } from '../lib/mailmind-bak.js';

// vaste loting, zodat de test elke keer hetzelfde doet
let zaad = 20261127; const rnd = () => { zaad = (zaad * 1664525 + 1013904223) % 4294967296; return (zaad + 0.5) / 4294967296; };
const normaal = () => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
function gamma(k) { if (k < 1) return gamma(k + 1) * Math.pow(rnd(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = normaal(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = rnd(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };

const S = (rij, verstuurd = 0, ja = 0, stop = 0, bounce = 0) => ({ rij, verstuurd, ja, stop, bounce });
const TK = {
  'r3|algemeen|2017': S(1, 1, 0, 0, 1), 'r3|algemeen|2018': S(20, 1), 'r3|algemeen|2019': S(7, 1), 'r3|algemeen|2020': S(22),
  'r3|eigen|2017': S(34), 'r3|eigen|2018': S(89, 3, 0, 0, 1), 'r3|eigen|2019': S(74), 'r3|eigen|2020': S(172, 1),
  'r3|gratis|2017': S(194, 2), 'r3|gratis|2018': S(919), 'r3|gratis|2019': S(730), 'r3|gratis|2020': S(1925, 3),
  'r3|provider|2017': S(76, 1, 0, 0, 1), 'r3|provider|2018': S(488, 3), 'r3|provider|2019': S(279, 1), 'r3|provider|2020': S(535, 1),
  'r4|algemeen|2017': S(0, 7, 2, 0, 1), 'r4|algemeen|2018': S(42, 1), 'r4|algemeen|2019': S(16), 'r4|algemeen|2020': S(20),
  'r4|eigen|2017': S(38, 4, 1, 2), 'r4|eigen|2018': S(183, 1), 'r4|eigen|2019': S(122, 1), 'r4|eigen|2020': S(123, 10, 3, 6),
  'r4|gratis|2017': S(388, 4), 'r4|gratis|2018': S(1764, 1), 'r4|gratis|2019': S(1016), 'r4|gratis|2020': S(1085, 1),
  'r4|provider|2017': S(171, 3), 'r4|provider|2018': S(884, 3), 'r4|provider|2019': S(429, 1, 0, 1), 'r4|provider|2020': S(501, 2, 0, 1, 1),
  'r5|algemeen|2017': S(5), 'r5|algemeen|2018': S(10, 1, 0, 1),
  'r5|eigen|2017': S(26, 4, 0, 2), 'r5|eigen|2018': S(53, 2, 0, 0, 1), 'r5|eigen|2019': S(6, 3),
  'r5|gratis|2017': S(240, 10, 4), 'r5|gratis|2018': S(544, 4), 'r5|gratis|2019': S(58, 5, 1, 1),
  'r5|provider|2017': S(91, 2, 0, 1), 'r5|provider|2018': S(230, 2), 'r5|provider|2019': S(17, 4),
};
// voorkennis van tk-mailchimp (lib/tkmc.js)
const voorkennis = b => { const r = Number(String(b).slice(1, 2)) || 0; let p = r >= 5 ? 0.08 : r === 4 ? 0.05 : 0.03; if (/\|algemeen\|/.test(b)) p = p / 3; return [10 * p, 10 * (1 - p)]; };

// 1. kenmerken tellen goed op
const K = kenmerken(TK);
assert.deepEqual(K['1:gratis'], { verstuurd: 30, ja: 5, stop: 1, bounce: 0 });
assert.deepEqual(K['1:eigen'], { verstuurd: 29, ja: 4, stop: 10, bounce: 2 });
assert.deepEqual(K['0:r3'], { verstuurd: 18, ja: 0, stop: 0, bounce: 3 });
assert.equal(Object.values(K).filter((x, i) => Object.keys(K)[i].startsWith('0:')).reduce((a, x) => a + x.verstuurd, 0), 94);

// 2. score 3 staat op de bank (3 bounces op 18), de rest niet
assert.deepEqual(bank(K), ['0:r3']);
assert.equal(opDeBank('r3|gratis|2020', K), true);
assert.equal(opDeBank('r4|gratis|2018', K), false);

// 3. een gmail-bak waar nog niets heen ging leert van de andere gmail-bakken: verwachting ja hoger en bounce lager dan een provider-bak
const g = verwachting('r4|gratis|2019', TK, K, voorkennis), p = verwachting('r4|provider|2018', TK, K, voorkennis);
assert.ok(g.ja[0] / (g.ja[0] + g.ja[1]) > 2 * p.ja[0] / (p.ja[0] + p.ja[1]), 'gratis moet meer ja verwachten dan provider');
assert.ok(g.bounce < p.bounce / 2, 'gratis moet minder bounces verwachten dan provider');
const e = verwachting('r4|eigen|2020', TK, K, voorkennis);
assert.ok(e.stop > 0.3, 'eigen domein 2020 verwacht veel stops');

// 4. de keuze over 4000 mails: bijna alles naar gmail en hotmail met score 4 en 5, niets naar score 3, bijna niets naar provider
const kansen = Object.keys(TK).filter(b => TK[b].rij > 0), tel = {}; const n = 4000;
for (let i = 0; i < n; i++) { const b = kiesBak(TK, kansen, voorkennis, beta); tel[b] = (tel[b] || 0) + 1; }
const deel = f => Object.entries(tel).filter(([b]) => f(b)).reduce((a, [, x]) => a + x, 0) / n;
const gratis = deel(b => /\|gratis\|/.test(b)), r3 = deel(b => b.startsWith('r3')), prov = deel(b => /\|provider\|/.test(b)), eigen = deel(b => /\|eigen\|/.test(b)), alg = deel(b => /\|algemeen\|/.test(b));
console.log('keuze over ' + n + ': gratis ' + (100 * gratis).toFixed(1) + '%, eigen ' + (100 * eigen).toFixed(1) + '%, provider ' + (100 * prov).toFixed(1) + '%, algemeen ' + (100 * alg).toFixed(1) + '%, score 3 ' + (100 * r3).toFixed(1) + '%');
console.log('top 6:', Object.entries(tel).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([b, x]) => b + ' ' + (100 * x / n).toFixed(1) + '%').join(', '));
assert.equal(r3, 0, 'score 3 staat op de bank');
assert.ok(gratis >= 0.85, 'minstens 85% naar gratis adressen, was ' + gratis);
assert.ok(prov <= 0.05, 'hooguit 5% naar provider, was ' + prov);
assert.ok(eigen <= 0.12, 'hooguit 12% naar eigen domeinen, was ' + eigen);

// 5. is alleen de bank nog over, dan gaat het daar gewoon verder (de rij loopt niet vast)
const alleenR3 = kansen.filter(b => b.startsWith('r3'));
assert.ok(alleenR3.includes(kiesBak(TK, alleenR3, voorkennis, beta)));
assert.equal(kiesBak(TK, [], voorkennis, beta), null);

// 6. een stroom met bakken van één kenmerk en nog geen cijfers: gelijk aan de oude regel (voorkennis plus eigen ja's)
const oud = verwachting('nieuw', { nieuw: S(10, 6, 2) }, kenmerken({ nieuw: S(10, 6, 2) }));
assert.deepEqual(oud.ja.map(x => Math.round(x * 1000) / 1000), [PRIOR[0] + 2, PRIOR[1] + 4]);

// 7. de stand noemt de bank en de procenten
const st = kenmerkStand(TK);
assert.deepEqual(st.bank, ['0:r3']);
assert.equal(st.perKenmerk['1:gratis'].jaPct, 16.7);
assert.equal(st.perKenmerk['0:r3'].bank, true);

// 8. dagrem op bounces
assert.equal(dagRem(3, 10), false);   // 3 bounces: te weinig om op te oordelen
assert.equal(dagRem(4, 0), true);     // 4 bounces en nog (bijna) niets verstuurd: vandaag stil
assert.equal(dagRem(4, 80), false);   // 5% van 80: door
assert.equal(dagRem(5, 80), true);    // 6,25%: stil
assert.equal(dagRem(8, 150), false);  // 5,3%: door
assert.equal(dagRem(9, 150), true);   // 6%: stil

console.log('test-mailmind-bak: ok');
