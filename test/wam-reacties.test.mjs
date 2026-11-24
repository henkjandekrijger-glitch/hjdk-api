import test from 'node:test';
import assert from 'node:assert/strict';
import { bewaarReactie, modereerReactie, wisReactie, publiekeReacties, concentreerReacties, redigeerInvoer, priveGegevens, REACTIE_BEDRIJVEN } from '../lib/wam-reacties.js';
import { SITE_BEDRIJVEN, siteInhoud, moderatieInhoud } from '../lib/wam-voorkant.js';
import { pagina, handel } from '../lib/wam-dossier.js';

const geenDb = new Proxy({}, { get() { return () => { throw new Error('Onverwachte databasetoegang'); }; } });
test('geen opslag zonder toestemming, met onbekend bedrijf of bij een botveld', async () => {
  const b = { bedrijf: 'flanderijn', thema: 'contact', ervaring: 'gemengd', tekst: 'Een concrete ervaring die alleen na moderatie mag verschijnen.', akkoord: true };
  for (const wijzig of [{ akkoord: false }, { bedrijf: '__proto__' }, { thema: 'constructor' }, { ervaring: '__proto__' }, { website: 'spam' }, { tekst: 'kort' }, { tekst: 'x'.repeat(2001) }]) assert.equal((await bewaarReactie({ ...b, ...wijzig }, 'ip', geenDb)).ok, false);
  for (const b of SITE_BEDRIJVEN) assert.ok(REACTIE_BEDRIJVEN.has(b.id));
});
test('publicatie vereist de beschermde host en een apart moderatietoken', async () => {
  assert.equal((await modereerReactie({ csrf: 'a'.repeat(48) }, false, geenDb)).ok, false);
  assert.equal((await modereerReactie({ csrf: '' }, true, geenDb)).ok, false);
  assert.equal((await modereerReactie({ csrf: 'a'.repeat(48) }, true, { get: async () => null })).ok, false);
  assert.deepEqual(await publiekeReacties('__proto__', geenDb), []);
  assert.equal((await wisReactie({ id: 'onbekend', tok: 'x' }, geenDb)).ok, false);
});
test('herkenbare privégegevens worden niet in publiceerbare tekst toegelaten', () => {
  const s = redigeerInvoer('Bel 0612345678 of mail klant@example.nl, rekening NL91 ABNA 0417 1643 00. Kijk https://example.nl');
  assert.ok(!s.includes('@') && !s.includes('0612345678') && !s.includes('NL91') && !s.includes('https://'));
  assert.ok(priveGegevens('Bel 06 1234 5678 voor hulp.'));
  assert.ok(priveGegevens('Mail klant@example.nl voor dit dossier.'));
});
test('ervaringen worden per onderwerp en strekking gebundeld, zonder ruwe reacties', () => {
  const l = [
    { thema: 'contact', ervaring: 'positief', zin: 'Een medewerker gaf duidelijk uitleg over de vervolgstappen.', t: 100 },
    { thema: 'contact', ervaring: 'positief', zin: 'Een medewerker gaf duidelijk uitleg over de vervolgstappen.', t: 110 },
    { thema: 'contact', ervaring: 'negatief', zin: 'De lezer beschrijft lange wachttijden voordat een antwoord kwam.', t: 120 },
    { thema: 'contact', ervaring: 'negatief', zin: 'Mail klant@example.nl voor het hele verhaal.', t: 130 },
    { thema: '__proto__', ervaring: 'positief', zin: 'Dit is geen geldig onderwerp.', t: 140 },
    { thema: 'contact', ervaring: 'negatief', zin: '<script>alert(1)</script>', t: 150 }
  ];
  const g = concentreerReacties(l);
  assert.equal(g.length, 2); assert.equal(g[0].n, 2); assert.equal(g[0].zinnen.length, 1); assert.equal(g[1].n, 1);
});
test('publicatie lekt de inzending niet en weigert een ongecontroleerde samenvatting', async () => {
  const calls = [], record = { bedrijf: 'flanderijn', tekst: 'Dit is de oorspronkelijke tekst die besloten moet blijven.' };
  const db = { get: async k => k.includes(':csrf:') ? 1 : record, raw: async a => { calls.push(a); return 1; } };
  const b = { csrf: 'a'.repeat(48), id: 'b'.repeat(24), actie: 'publiceer', thema: 'contact', ervaring: 'gemengd', samenvatting: 'Een lezer beschrijft gemengde ervaringen met de bereikbaarheid.', gecontroleerd: true };
  assert.equal((await modereerReactie({ ...b, gecontroleerd: false }, true, db)).ok, false);
  assert.equal((await modereerReactie({ ...b, samenvatting: 'Bel 0612345678 voor deze klacht.' }, true, db)).ok, false);
  assert.equal(calls.length, 0);
  assert.equal((await modereerReactie(b, true, db)).ok, true);
  assert.equal(calls.length, 1); assert.equal(calls[0][0], 'EVAL');
  assert.ok(!JSON.stringify(calls).includes(record.tekst));
  assert.ok(JSON.stringify(calls).includes(b.samenvatting));
  assert.ok(calls[0][1].includes("redis.call('DEL',KEYS[1])"));
});
test('elk bedrijf heeft bronnen, een direct reactieformulier en een openbaar bronnenbeeld', () => {
  const h = pagina('nl', true);
  assert.equal((h.match(/data-bedrijf=/g) || []).length, 10);
  assert.equal((h.match(/Bronnen en afweging<\/summary>/g) || []).length, 10);
  assert.ok(!h.includes('meer »') && !h.includes('class="pct"'));
  assert.ok(h.includes('32% geeft één ster')); // het hoofdoordeel is geen losse score
  for (const b of SITE_BEDRIJVEN) {
    assert.ok(b.bronnen.length >= 2);
    for (const s of b.bronnen) assert.ok(/^https:\/\//.test(s.url) && s.datum === '2026-11-24');
    const p = pagina('bedrijven/' + b.id, true);
    assert.ok(p.includes('Herken je dit beeld?') && p.includes('data-bedrijf="' + b.id + '"'));
  }
});
test('moderatie escape’t de oorspronkelijke tekst en publiceert hem nooit automatisch', () => {
  const o = moderatieInhoud([{ id: 'a'.repeat(24), bedrijf: 'flanderijn', ervaring: 'gemengd', thema: 'contact', tekst: '</blockquote><script>gevaar()</script>', t: Date.now() }], 'b'.repeat(48));
  assert.ok(o.body.includes('&lt;script&gt;') && !o.body.includes('<script>gevaar'));
  assert.ok(o.body.includes('name="gecontroleerd" required') && o.body.includes('name="samenvatting"'));
  new Function(o.script);
});
test('publieke host kan moderatie niet lezen, en een externe website kan niet namens de lezer insturen', async () => {
  const response = () => ({ statusCode: 0, setHeader() {}, status(s) { this.statusCode = s; return this; }, send(x) { this.body = x; return this; }, json(x) { this.body = x; return this; } });
  const a = response(); await handel('dmoderatie', { method: 'GET', headers: {} }, a, { beschermd: false }); assert.equal(a.statusCode, 404);
  const b = response(); await handel('dreactie', { method: 'POST', headers: { host: 'wearemany.now', origin: 'https://extern.example' } }, b, { beschermd: false }); assert.equal(b.statusCode, 403);
});
test('alle nieuwe browserscripts compileren; een prototype-naam is geen pagina', () => {
  for (const p of ['nl', 'bedrijven/flanderijn', 'reactie-wissen']) for (const m of pagina(p, true).matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(m[1]);
  assert.equal(siteInhoud('constructor'), null); assert.equal(pagina('__proto__', true), null);
});
