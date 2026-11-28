import test from 'node:test';
import assert from 'node:assert/strict';
import { gidsHerkomst } from '../lib/gids-herkomst.js';
const landing = 'https://gids.kadoly.com/tv-meubel-breedte-berekenen?utm_source=pinterest&utm_medium=organic_social&utm_campaign=gids-tv-20261125';
test('de oorspronkelijke gidspin-campagne blijft als aparte metadata beschikbaar', () => {
  assert.deepEqual(gidsHerkomst(landing), { gids_source: 'pinterest', gids_medium: 'organic_social', gids_campaign: 'gids-tv-20261125' });
});
test('ook een gidsvideo blijft herkenbaar zonder klik of koop te verzinnen', () => {
  assert.deepEqual(gidsHerkomst(landing.replace('pinterest','youtube').replace('organic_social','video')), { gids_source: 'youtube', gids_medium: 'video', gids_campaign: 'gids-tv-20261125' });
});
test('geen herkomst uit een ontbrekende of ingekorte referer afleiden', () => {
  for (const u of [undefined, '', 'ongeldig', 'https://gids.kadoly.com/', landing.replace('&utm_campaign=gids-tv-20261125','')]) assert.deepEqual(gidsHerkomst(u), {});
});
test('vreemde hosts, credentials, poorten en onbeveiligde referers weigeren', () => {
  for (const u of [landing.replace('gids.kadoly.com','gids.kadoly.com.evil.test'), landing.replace('gids.kadoly.com','evil.test'), landing.replace('https:','http:'), landing.replace('https://','https://naam@'), landing.replace('.com/','.com:8080/')]) assert.deepEqual(gidsHerkomst(u), {});
});
test('betaalde herkomst, onbekende bron en vrije tekst worden niet als organisch opgeslagen', () => {
  for (const u of [landing.replace('organic_social','cpc'), landing.replace('pinterest','google'), landing.replace('gids-tv-20261125','persoon%40mail.nl'), landing.replace('gids-tv-20261125','x'.repeat(81))]) assert.deepEqual(gidsHerkomst(u), {});
});
test('extra URL-data wordt weggegooid, inclusief email en persoons-ID', () => {
  assert.deepEqual(gidsHerkomst(landing+'&email=privaat%40example.org&mmc=abc&epik=xyz'), gidsHerkomst(landing));
});
