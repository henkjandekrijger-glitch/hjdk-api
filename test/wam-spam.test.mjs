import test from 'node:test';
import assert from 'node:assert/strict';
import { spamTekst, nepNaam, ruimSpam } from '../lib/wam-spam.js';
import { bewaarReactie } from '../lib/wam-reacties.js';

const ECHT = ['Ziggo', 'KPN', 'NS', 'PostNL', 'Intrum', 'ANWB', 'Blendle', 'ANP', 'Hosters', 'Errezeta Publishing Ltd', 'VriendenLoterij', 'Nationale Postcode Loterij', 'Videoland', 'Flanderijn', 'T-Mobile', 'Odido', 'Tele2', 'Bol.com', 'H&M', 'Albert Heijn', 'CJIB', 'Basic-Fit', "McDonald's", 'bunq', 'kpn', 'nmbs', "Gemeente 's-Hertogenbosch", 'Q8', '3M', 'Lynx', 'ABN AMRO', 'Riverty', 'Studio 100', 'Mehrwert GmbH', 'Stichting 111', 'Planet Fitness', 'Disney+', 'NLziet', 'VGZ', 'DSW'];
const NEP = ['Fvdg', 'Ygicuc7', 'asdf', 'qwerty', 'Ничего', 'aaaa', 'Zxcvbn', 'x', 'Fvdg BV'];
test('bedrijfsnamen: echte namen door, onzin eruit', () => {
  for (const n of ECHT) assert.equal(nepNaam(n), false, n);
  for (const n of NEP) assert.equal(nepNaam(n), true, n);
});
test('lezersreacties: gewone zinnen in vier talen door, spam eruit', () => {
  for (const t of ['Blendle schreef twee jaar lang 109 euro af zonder dat ik een herinnering kreeg.', 'I paid for five books and never received the royalties they promised me.', 'Die Kündigung wurde nie bestätigt und sie buchen weiter ab.', 'Ho pagato ma non ho mai ricevuto i libri promessi.', 'De slechtste service ooit, ze reageren niet op mijn mails.', 'Sinds de herfststorm geen internet en KPN zegt niets.'])
    assert.equal(spamTekst(t), '', t);
  assert.equal(spamTekst('Ничего ничего и ничего'), 'schrift');
  for (const t of ['asdf asdf asdf asdf asdf asdf', 'test test test test test test test', 'hhhhhhhhhhhhhhhhhhhhhhhhh', 'sdkjfh sdkjfh kjsdhf kjhsdf']) assert.ok(spamTekst(t), t);
});
test('spam bereikt de database niet', async () => {
  const geenDb = new Proxy({}, { get() { return () => { throw new Error('Onverwachte databasetoegang'); }; } });
  const r = await bewaarReactie({ bedrijf: 'blendle', thema: 'contact', ervaring: 'negatief', tekst: 'Ничего ничего и ничего, совсем ничего', akkoord: true }, 'ip', geenDb);
  assert.equal(r.ok, false); assert.equal(r.spam, 'schrift');
});
test('opruimronde: wijst spam af, laat echte reacties en namen staan', async () => {
  const kv = { 'wmn:r:a': { bedrijf: 'blendle', tekst: 'Ничего ничего и ничего' }, 'wmn:r:b': { bedrijf: 'anp', tekst: 'ANP stuurde een claim van 850 euro voor mijn eigen foto.' } };
  const wacht = ['a', 'b'], naam = { fvdg: 'Fvdg', ziggo: 'Ziggo', ygicuc7: 'Ygicuc7' }, tel = { fvdg: '1', ziggo: '4', ygicuc7: '1' };
  const db = {
    mget: async (...k) => k.map(x => kv[x] || null),
    raw: async ([c, ...a]) => {
      if (c === 'ZRANGE') return [...wacht];
      if (c === 'HGETALL') return Object.entries(a[0] === 'wmn:naam' ? naam : tel).flat();
      if (c === 'HDEL') { delete (a[0] === 'wmn:naam' ? naam : tel)[a[1]]; return 1; }
      if (c === 'EVAL') { delete kv[a[2]]; wacht.splice(wacht.indexOf(a[4]), 1); return 1; }
      throw new Error('onverwacht ' + c);
    },
  };
  const droog = await ruimSpam(db, false);
  assert.deepEqual(droog.reacties.map(r => r.id), ['a']); assert.deepEqual(droog.namen.map(n => n.naam).sort(), ['Fvdg', 'Ygicuc7']); assert.equal(wacht.length, 2);
  await ruimSpam(db, true);
  assert.deepEqual(wacht, ['b']); assert.deepEqual(Object.keys(naam), ['ziggo']); assert.deepEqual(Object.keys(tel), ['ziggo']);
});
