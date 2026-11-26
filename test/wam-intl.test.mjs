import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pagina } from '../lib/wam-dossier.js';
import { INTL, intlItem } from '../lib/wam-intl.js';

test('landenpagina\'s: top 10 per markt, gesorteerd, met methode, hreflang en Me too', () => {
  for (const [m, M] of Object.entries(INTL.markten)) {
    assert.equal(M.items.length, 10, m);
    assert.deepEqual(M.items.map(x => x.v), [...M.items.map(x => x.v)].sort((a, b) => b - a), m);
    const h = pagina(m, true, false, [], { metoo: { [m + '|' + M.items[0].id]: 2 } });
    assert.ok(h.includes('<html lang="' + (M.taal === 'de' ? 'de' : 'en') + '"'), m);
    for (const t of ['en-US', 'en-GB', 'en-CA', 'de-DE']) assert.ok(h.includes('hreflang="' + t + '"'), m + t);
    assert.ok(h.includes('"@type":"ItemList"') && h.includes('"@type":"Dataset"') && h.includes('data-metoo="' + m + '|'), m);
    assert.ok(!/Naar de inhoud|Bronnen en moderatie|Volg WAM/.test(h), m);
    assert.ok(/2 (people said me too|Personen sagen: ich auch)/.test(h), m);
  }
  assert.ok(intlItem('us', 'planet-fitness') && !intlItem('us', 'bestaat-niet') && !intlItem('xx', 'netflix'));
  const v = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.ok(v.rewrites.some(r => r.source === '/:p(us|uk|ca|de)' && r.destination === '/api/wam?op=dpagina&p=:p'));
});
