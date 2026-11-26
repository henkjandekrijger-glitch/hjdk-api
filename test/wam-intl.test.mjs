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

test('aanmelden op een landenpagina: eigen toestemming en taal, Engelse of Duitse welkomstmail, geen Nederlandse weekupdate', async () => {
  const { aanmelden, TOESTEMMING_TAAL } = await import('../lib/wam-aanmelden.js');
  const opslag = new Map(), db = { incr: async () => 1, raw: async (c) => { if (c[0] === 'EVAL') { if (/ZADD/.test(c[1])) { opslag.set(c[3], c[8]); return 1; } return 1; } return 1; }, get: async k => null };
  const r = await aanmelden({ email: 'x@voorbeeld.com', scope: 'us', toestemming: true }, '1.2.3.4', db, Date.now(), 'test:');
  assert.ok(r.ok && r.nieuw);
  const rec = JSON.parse([...opslag.values()][0]); assert.equal(rec.taal, 'en'); assert.equal(rec.toestemming, TOESTEMMING_TAAL.en);
  const fout = await aanmelden({ email: 'geen', scope: 'de', toestemming: true }, '1.2.3.4', db, Date.now(), 'test:'); assert.match(fout.fout, /gültige/);
  const V = await import('../lib/wam-volgstroom.js');
  for (const [st, sc] of [[V.STROOM_EN, 'uk'], [V.STROOM_DE, 'de']]) for (const v of st.varianten) {
    const m = st.mail({ scope: sc }, { v, tok: 'a'.repeat(30) });
    assert.ok(m.tekst.includes('/v/' + 'a'.repeat(30) + '/x') && m.tekst.includes('/v/' + 'a'.repeat(30) + '/d') && !/ — | – |Hoi|dossier/.test(m.tekst), st.id);
  }
  const M = await import('../lib/mailmind.js'); assert.ok(M.STROMEN['wam-volg-en'] && M.STROMEN['wam-volg-de']);
  const h = pagina('de', true, false, [], {}); assert.ok(h.includes('class="intl-volg" data-scope="de"') && h.includes('Anleitung schicken'));
  const wk = readFileSync(new URL('../lib/wam-week.js', import.meta.url), 'utf8'); assert.ok(/r\.taal !== 'nl'/.test(wk));
});

test('dossier per bedrijf: makkelijkste actie bovenaan, alleen feiten met bron, link vanaf de lijst', async () => {
  const { INTL_DOSSIERS } = await import('../lib/wam-intl.js');
  for (const [p, D] of Object.entries(INTL_DOSSIERS)) {
    const h = pagina(p, true, false, [], {});
    assert.ok(h.indexOf('id="actie"') > 0 && h.indexOf('id="actie"') < h.indexOf('id="opzeggen"'), p);
    for (const f of D.feiten) assert.ok(/^https:\/\//.test(f.bron.url) && /^\d{4}-\d{2}-\d{2}$/.test(f.datum), p);
    assert.ok(/^https:\/\//.test(D.bronRoute.url) && D.vragen.length >= 2 && D.open.length >= 1, p);
    assert.ok(h.includes('data-arm="' + p.split('/')[1] + '"') && h.includes('"@type":"Article"') && !/ — | – /.test(h.replace(/<[^>]+>/g, '')), p);
    assert.ok(pagina(p.split('/')[0], true, false, [], {}).includes('href="/' + p + '"'), p);
  }
  const v = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.ok(v.rewrites.some(r => r.source === '/:m(us|uk|ca|de)/:bedrijf'));
});
