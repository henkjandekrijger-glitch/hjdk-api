import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pagina } from '../lib/wam-dossier.js';
import { AVG_DOSSIER } from '../lib/wam-avg.js';
import { SITE_PADEN } from '../lib/wam-voorkant.js';
import { WAM_INDEXNOW_URLS } from '../lib/wam-vindbaarheid.js';

test('AVG-dossier: chat vult de brief, tien organisaties met bron, rechten, helpers en FAQ als uitklappers', () => {
  assert.ok(SITE_PADEN.includes('inzageverzoek'));
  assert.ok(WAM_INDEXNOW_URLS.some(u => u.endsWith('/inzageverzoek')));
  const h = pagina('inzageverzoek', true, false, []);
  assert.ok(h.includes('<h1>Wat weet een bedrijf van jou? Vraag het op.</h1>'));
  assert.ok(h.includes('class="intl-chat"') && h.includes('id="brief"') && h.includes('Mail hem naar mezelf'));
  for (const v of AVG_DOSSIER.actie.velden) assert.ok(AVG_DOSSIER.actie.brief.includes(v.v), v.v);
  for (const v of AVG_DOSSIER.actie.velden.filter(v => v.weg)) assert.ok(AVG_DOSSIER.actie.brief.includes(v.weg), v.weg);
  assert.ok(AVG_DOSSIER.actie.brief.includes('[Datum]'));
  assert.equal(AVG_DOSSIER.tien.length, 10);
  for (const t of AVG_DOSSIER.tien) { assert.match(t.bron, /^https:\/\/(www\.)?(autoriteitpersoonsgegevens\.nl|uitspraken\.rechtspraak\.nl)\//, t.naam); assert.ok(h.includes(t.naam), t.naam); }
  for (const r of AVG_DOSSIER.rechten) assert.ok(r.tekst && r.art, r.wat);
  assert.ok(h.includes('<pre class="intl-brief" id="brief" hidden>') && h.includes('class="vraag-kort"') && !h.includes('class="stand-tegel"'));
  assert.ok(h.includes('mydatadoneright.eu') && h.includes('Bits of Freedom') && h.includes('Juridisch Loket'));
  for (const u of AVG_DOSSIER.helpers.map(x => x.url)) assert.match(u, /^https:\/\//);
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  assert.ok(ld.some(x => JSON.stringify(x).includes('"FAQPage"')));
  assert.ok(!/ — | – /.test(h), 'geen gedachtestreepjes');
  const v = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.ok(v.rewrites.some(r => /inzageverzoek/.test(r.source)));
});
