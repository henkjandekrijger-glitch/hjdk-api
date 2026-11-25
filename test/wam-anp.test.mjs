import test from 'node:test';
import assert from 'node:assert/strict';
import { pagina, sitemapLastmod } from '../lib/wam-dossier.js';
import { DOSSIERLIJST } from '../lib/wam-dossiers.js';
import { wamLlms } from '../lib/wam-vindbaarheid.js';


test('ANP-onderzoek blijft naast de eigen claim staan, met volledige primaire bronnen en eerlijke datums', async () => {
  const d = DOSSIERLIJST.find(d => d.id === 'anp'), h = pagina('dossier/anp', true);
  assert.equal(d.laatsteStuk, '2025-04-03');
  assert.equal(d.bijgewerkt, '2026-11-25');
  assert.equal(d.onderzoek.rechtspraak.length, 8);
  assert.equal(sitemapLastmod('/dossier/anp'), '2026-11-25');
  assert.equal(sitemapLastmod('/dossier/hosters'), '2026-11-24');
  assert.ok(h.includes('De tijdlijn van de eigen claim') && h.includes('id="openbare-ontwikkelingen"'));
  const body = h.slice(h.indexOf('<body>'));
  for (const c of d.onderzoek.rechtspraak) {
    assert.ok(body.includes(c.ecli) && body.includes(c.uitkomst));
    assert.equal(new URL(d.bronnen[c.bron].tekstUrl).hostname, 'data.rechtspraak.nl');
  }
  for (const m of body.matchAll(/href="#(anp-bron-\\d+)"/g)) assert.ok(body.includes('id="' + m[1] + '"'), m[1]);
  for (const c of ['controle', 'werkwijze', 'rechtspraak', 'historisch', 'eigen-claim', 'vragen']) assert.ok(body.includes('id="' + c + '"'), c);
  assert.ok(d.onderzoek.rechtspraak.find(c => c.ecli.endsWith('8151')).uitkomst.includes('niet-ontvankelijk'));
  assert.ok(d.onderzoek.rechtspraak.find(c => c.ecli.endsWith('7694')).grens.includes('geen verband'));
  assert.ok(wamLlms().includes('Redactionele controle: 2026-11-25'));
});

