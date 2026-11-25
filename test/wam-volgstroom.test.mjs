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

test('elke mail heeft een reply-CTA; updates per dossierstap; antwoordmotor met AI-antwoord en tweede reply naar Henkjan', async () => {
  const V = await import('../lib/wam-volgstroom.js'), M = await import('../lib/mailmind.js');
  assert.ok(M.STROMEN['wam-update'] && V.UPDATE.antwoord && V.STROOM.antwoord && typeof V.UPDATE.vooraf === 'function');
  for (const v of V.VARIANTEN) assert.ok(V.mailTekst({ scope: 'anp', m: 'x@y.nl' }, { v, tok: 'Abc123Def45' }).tekst.includes('Antwoord gewoon op deze mail'));
  for (const v of V.UPDATE_VARIANTEN) { const m = V.updateTekst({ m: 'x@y.nl', d: 'blendle', scope: 'algemeen', dt: '2026-11-25', k: 'Stap', tx: 'Tekst.' }, { v, tok: 'Abc123Def45' });
    assert.ok(m.tekst.includes('Antwoord gewoon op deze mail') && m.tekst.includes('25 november 2026') && !/[{}]/.test(m.tekst + m.onderwerp)); }
  const k = V.kennis({ scope: 'blendle' }); assert.ok(k.includes('DOSSIER Blendle') && k.includes('#reageren') && k.length < 14001);
  assert.ok(M.aiMail({ zeker: true, antwoord: 'Hoi,\n\nJa.' }).startsWith('AI-antwoord') && M.aiMail({ zeker: false }).includes('nog een keer op deze mail'));
  assert.equal(M.soortAntwoord('nee, ik heb geen abonnement, klopt dat?', true), 'anders');
  assert.equal(M.soortAntwoord('graag afmelden', true), 'stop');
});
