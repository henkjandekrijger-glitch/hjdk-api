import test from 'node:test';
import assert from 'node:assert/strict';
import { pagina, handel } from '../lib/wam-dossier.js';
import { DOSSIERLIJST } from '../lib/wam-dossiers.js';
import { WAM_VRAGEN, wamZichtManifest, wamLlms, WAM_INDEXNOW_URLS } from '../lib/wam-vindbaarheid.js';

const grafiek = html => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
test('de voorkant opent met concrete dossiers en linkt de reviews als achtergrond', () => {
  const h = pagina('nl', true), b = pagina('bedrijven', true);
  assert.equal((h.match(/class="dossier-teaser"/g) || []).length, 4);
  const v = h.slice(h.indexOf('class="dossier-teaser"'));
  assert.ok(v.indexOf('/dossier/blendle') < v.indexOf('Vast aan een loterij?') && v.indexOf('Vast aan een loterij?') < v.indexOf('/dossier/anp') && v.indexOf('/dossier/anp') < v.indexOf('/dossier/errezeta'));
  assert.ok(h.indexOf('Blendle: abonnement gestopt') < h.indexOf('Praktische hulp en ervaringen'));
  assert.ok(h.indexOf('ANP: €391,29') < h.indexOf('Praktische hulp en ervaringen'));
  assert.ok(h.includes('href="/bedrijven"'));
  assert.equal((h.match(/class="company"/g) || []).length, 0);
  assert.equal((b.match(/class="company"/g) || []).length, 10);
  assert.equal((h.match(/data-bedrijf=/g) || []).length, 3);
  assert.equal((b.match(/data-bedrijf=/g) || []).length, 10);
  assert.equal(DOSSIERLIJST.find(d => d.id === 'hosters').uitgelicht, false);
});
test('kosten in de echte ANP-bijlage tellen op zonder subtotalen dubbel te tellen', () => {
  const d = DOSSIERLIJST.find(d => d.id === 'anp'), c = n => Math.round(n * 100);
  const posten = d.kosten.filter(k => !k.subtotaal && !k.totaal);
  const subtotaal = d.kosten.filter(k => k.subtotaal).reduce((s, k) => s + c(k.bedrag), 0);
  const totaal = d.kosten.find(k => k.totaal);
  assert.equal(posten.reduce((s, k) => s + c(k.bedrag), 0), c(totaal.bedrag));
  assert.equal(subtotaal, c(totaal.bedrag));
  assert.ok(pagina('dossier/anp', true).includes('<table class="case-table">'));
});
test('concrete tijdlijnen en bronstatus staan in HTML; privégegevens niet', () => {
  for (const d of DOSSIERLIJST) {
    const h = pagina('dossier/' + d.id, true);
    assert.ok(h.includes('id="tijdlijn"') && h.includes('id="onderbouwing"') && h.includes('id="bedrijf"'));
    for (const t of d.tijdlijn) assert.ok(h.includes('<time datetime="' + t.datum + '">'));
    assert.ok(h.includes(d.bronverantwoording));
    assert.ok(!/@gmail\.com|\bIN\d{6}\b|\b[A-Z]{2}\d{2}\s?[A-Z]{4}\s?\d{4}|Wachtwoord:|Case-ID:/i.test(h));
  }
  const b = DOSSIERLIJST.find(d => d.id === 'blendle');
  assert.equal(b.bedragen[0].waarde, '€297');
  assert.ok(b.feiten.some(x => x.includes('€396') && x.includes('€297')));
});
test('dossier-Article en FAQ volgen zichtbare titels, data en antwoorden', () => {
  for (const d of DOSSIERLIJST) {
    const h = pagina('dossier/' + d.id, true), graph = grafiek(h), a = graph.find(x => x['@type'] === 'Article'), faq = graph.find(x => x['@type'] === 'FAQPage');
    assert.equal(a.headline, d.titel); assert.equal(a.datePublished, '2026-11-24'); assert.equal(a.dateModified, '2026-11-24');
    assert.equal(a.author['@type'], 'Organization');
    assert.equal(faq.mainEntity.length, d.vragen.length);
    for (const q of faq.mainEntity) assert.ok(h.includes(q.name) && h.includes(q.acceptedAnswer.text));
    assert.ok(graph.some(x => x['@type'] === 'BreadcrumbList'));
    assert.ok(!JSON.stringify(graph).includes('aggregateRating'));
    assert.ok(d.seoTitel.length <= 60);
    assert.ok(h.match(/<meta name="description" content="([^"]*)"/)[1].length <= 155);
  }
});
test('zicht-manifest kan door de gedeelde meetlus gelezen worden en houdt het panel vast', () => {
  const m = wamZichtManifest(true);
  assert.equal(m.zicht, 1); assert.equal(m.site.land, 'NL');
  assert.deepEqual(m.site.vragen, WAM_VRAGEN); assert.equal(WAM_VRAGEN.length, 4);
  assert.ok(m.toegepast.every(x => x.les && x.dag && x.wat));
  assert.ok(m.proeven.every(x => x.id && x.urls.length && ['index', 'llm'].includes(x.metric)));
  assert.equal(m.gapscan.model, 'perplexity/sonar');
  for (const d of DOSSIERLIJST) assert.ok(wamLlms().includes('https://wearemany.now/dossier/' + d.id));
  assert.ok(WAM_INDEXNOW_URLS.every(u => new URL(u).hostname === 'wearemany.now'));
});
test('een publieke bezoeker kan geen IndexNow-taak uitvoeren', async () => {
  const res = { statusCode: 0, setHeader() {}, status(s) { this.statusCode = s; return this; }, send() { return this; } };
  await handel('dindexnow', { method: 'GET', headers: {} }, res, { beschermd: false });
  assert.equal(res.statusCode, 404);
});

test('tijdlijn nieuwste boven, echte bekeken-teller pas vanaf honderd, deelknoppen meetbaar, geen oprichtersvermelding', async () => {
  const { bekekenRegel, DEEL_KANALEN } = await import('../lib/wam-dossiers.js');
  const h = pagina('dossier/blendle', true, false, [], { bekeken: { blendle: 347 } });
  const data = [...h.matchAll(/<li><p class="meta"><time datetime="([^"]+)"/g)].map(m => m[1]);
  assert.ok(data.length >= 10 && data[0] === '2026-11-25');
  assert.ok(h.includes('<summary>Zie correspondentie</summary>') && h.includes('Melding van de melder aan ACM ConsuWijzer') && !/Beste Liele|Beste Martin|6 55395630/.test(h));
  assert.deepEqual(data, [...data].sort().reverse());
  assert.equal(bekekenRegel(99), ''); assert.equal(bekekenRegel(0), ''); assert.ok(bekekenRegel(347).includes('Ruim 300 keer bekeken'));
  assert.ok(h.includes('Ruim 300 keer bekeken') && !pagina('dossier/anp', true, false, [], { bekeken: { anp: 99 } }).includes('keer bekeken'));
  for (const k of Object.keys(DEEL_KANALEN)) assert.ok(h.includes('data-deel="' + k + '"'), k);
  assert.ok(h.includes("op=ddeel") && h.includes('wamMeetActie') && h.includes('dossier%2Fblendle%3Fd%3Dwa'));
  for (const p of ['dossier/blendle', 'dossier/errezeta', 'nl', 'achtergrond']) assert.ok(!/WAM-oprichter|melder,? (is )?Henkjan|zaak van Henkjan|zijn eigen afschrijving/.test(pagina(p, true)), p);
  const pers = pagina('pers', true); assert.ok(!pers.includes('175%') && !pers.includes('14.800'));
  for (const p of ['nl', 'dossier/blendle', 'bedrijven/ns']) assert.ok(!/name="description" content="[^"]*…"/.test(pagina(p, true)), p);
});

test('modal volgt het dossier, teller alleen na echte-lezersbaken, mailstroom uit', async () => {
  const h = pagina('dossier/blendle', true);
  assert.ok(h.includes('data-volg="Hoor het als Blendle reageert"') && !pagina('bedrijven/ns', true).includes('data-volg='));
  assert.ok(h.includes("op=dbekeken") && h.includes('8000'));
  const VM = await import('../lib/wam-volgmail.js');
  assert.equal(VM.LIVE, false);
  const r = { scope: 'blendle', mtok: 'a'.repeat(40), email: 'x@voorbeeld.nl' }, w = VM.welkomMail('b'.repeat(24), r);
  assert.ok(w.onderwerp === 'Je volgt het Blendle-dossier' && w.html.includes('/afmelden#' + 'b'.repeat(24) + '.' + 'a'.repeat(40)) && !/#5f6368|gray|grey/i.test(w.html));
  const { DOSSIERLIJST } = await import('../lib/wam-dossiers.js'), d = DOSSIERLIJST.find(x => x.id === 'blendle');
  assert.equal(VM.nieuwsteRegel(d).datum, '2026-11-25');
});

test('Errezeta staat er in het Engels, Duits en Italiaans met hreflang en een eigen formulier', () => {
  for (const t of ['en', 'de', 'it']) {
    const h = pagina(t + '/dossier/errezeta', true);
    assert.ok(h.startsWith('<!doctype html><html lang="' + t + '">'), t);
    assert.ok(h.includes('hreflang="nl" href="https://wearemany.now/dossier/errezeta"') && h.includes('hreflang="x-default"'), t);
    assert.ok(h.includes('data-bedrijf="errezeta"') && h.includes('data-dank='), t);
    assert.ok(!h.includes('data-modal="wmn"'), t + ' geen Nederlandse modal');
    assert.ok(h.includes('id="zicht"'), t + ' zichtblok');
    assert.ok(!/Siegfried|Köln|50678/.test(h), t + ' geen privéadres');
  }
  const nl = pagina('dossier/errezeta', true);
  assert.ok(nl.includes('hreflang="it"') && nl.includes('taalregel') && nl.includes('Wat Google en AI-assistenten nu zeggen'));
  assert.ok(nl.includes('RZ Business Ltd'));
});
