import test from 'node:test';
import assert from 'node:assert/strict';
import { VARIANTEN, mailTekst, STROOM } from '../lib/wam-volgstroom.js';
import { STROMEN } from '../lib/mailmind.js';

test('wam-volg is een Mailmind-stroom met lerende varianten, ja-links, doorsturen en afmelden', async () => {
  assert.ok(STROMEN['wam-volg']);
  assert.equal((await STROMEN['wam-volg']()).id, 'wam-volg');
  assert.ok(VARIANTEN.length >= 2 && STROOM.LIVE === true && STROOM.kanaal === 'gmail');
  for (const v of VARIANTEN) {
    const m = mailTekst({ scope: 'blendle', m: 'x@voorbeeld.nl' }, { v, tok: 'Abc123Def45' });
    assert.ok(m.tekst.includes('https://wearemany.now/v/Abc123Def45/e') && m.tekst.includes('https://wearemany.now/v/Abc123Def45/d') && m.tekst.includes('/v/Abc123Def45/x'));
    assert.ok(!/[{}]/.test(m.tekst + m.onderwerp) && !/—|–/.test(m.tekst + m.onderwerp) && m.onderwerp.length <= 60);
  }
  assert.equal(STROOM.bak({ scope: 'onzin', bron: 'modal-volg', m: 'a@gmail.com' }), 'algemeen|modal-volg|gratis');
});
