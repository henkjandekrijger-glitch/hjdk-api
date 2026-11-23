// we are many now, dossiersite: de delen zonder database of AI
import test from 'node:test';
import assert from 'node:assert/strict';
import { slugVan, schoonZin, leesJson, schoonMelding, pagina, PADEN, OPS } from '../lib/wam-dossier.js';

test('bedrijfsnaam wordt één sleutel', () => {
  assert.equal(slugVan('Blendle B.V.'), 'blendle');
  assert.equal(slugVan('Cafeyn'), 'blendle');
  assert.equal(slugVan('Vrienden Loterij'), 'vriendenloterij');
  assert.equal(slugVan('  KPN Nederland '), 'kpn');
  assert.equal(slugVan('<script>'), 'script');
  assert.equal(slugVan(''), '');
});
test('geen rekeningnummers, mailadressen of html in wat bewaard wordt', () => {
  const z = schoonZin('Afgeschreven van NL91 ABNA 0417 1643 00 naar iemand@voorbeeld.nl <b>x</b> 123456789');
  assert.ok(!/NL91|@|<|123456789/.test(z));
});
test('AI-antwoord: alleen bruikbare velden', () => {
  const m = schoonMelding(leesJson('Hier: {"bedrijf":"Ziggo","bedrag":"49.5","datum":"oktober 2026","soort":"hack","zin":"Opgezegd en toch afgeschreven"}'));
  assert.deepEqual(m, { slug: 'ziggo', naam: 'Ziggo', bedrag: 49.5, datum: 'oktober 2026', soort: 'klacht', zin: 'Opgezegd en toch afgeschreven' });
  assert.equal(schoonMelding(leesJson('{"bedrijf":""}')), null);
  assert.equal(schoonMelding(leesJson('geen json')), null);
});
test('elke pagina: titel, canonical, geen grijs, geen gedachtestreepje, noindex tot live', () => {
  for (const p of PADEN) {
    const h = pagina(p, false);
    assert.ok(h.includes('<title>') && h.includes('rel="canonical" href="https://wearemany.now/' + p + '"'), p);
    assert.ok(h.includes('noindex'), p + ' moet noindex zijn tot live');
    assert.ok(!pagina(p, true).includes('noindex'), p);
    assert.ok(!/—|#(8|9|a|b|c)[0-9a-f]{5}\b|gray|grey/i.test(h), p + ' grijs of gedachtestreepje');
    assert.ok(!/\b0 (melders|keer)\b/.test(h), p + ' nulteller');
  }
  assert.equal(pagina('bestaat-niet', false), null);
});
test('startpagina: script is geldig JavaScript en de ops bestaan', () => {
  const h = pagina('start', false); const js = h.match(/<script>([\s\S]*?)<\/script>/)[1];
  new Function(js); // gooit bij een syntaxfout
  for (const op of ['dmeld', 'dmail']) assert.ok(OPS.has(op) && js.includes("op:'" + op + "'"));
});
test('proefadres: links tussen de pagina\'s wijzen naar op=dpagina, op wearemany.now naar de korte paden', () => {
  const proef = pagina('nl', false, true), echt = pagina('nl', false, false);
  assert.ok(echt.includes('href="/start?b=Videoland"') && echt.includes('href="/vriendenloterij-opzeggen"'));
  assert.ok(proef.includes('href="/api/wam?op=dpagina&amp;p=start&amp;b=Videoland"') && proef.includes('href="/api/wam?op=dpagina&amp;p=vriendenloterij-opzeggen"'));
  assert.ok(!/href="\/(nl|start|achtergrond|pers|vriendenloterij-opzeggen)["?#]/.test(proef), 'geen kort pad meer op het proefadres');
  assert.ok(pagina('pers', false, true).includes('href="https://wearemany.now/#henkjan"') && proef.includes('href="https://wearemany.now/privacy"'));
});
