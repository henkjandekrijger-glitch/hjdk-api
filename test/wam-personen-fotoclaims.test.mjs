import test from 'node:test';
import assert from 'node:assert/strict';
import { pagina, sitemapLastmod } from '../lib/wam-dossier.js';
import { PERSONEN_MEDIA, controleerFoto, personenMedia } from '../lib/wam-personen.js';
import { EIGEN_FOTOCLAIMS } from '../lib/wam-eigen-fotoclaims.js';
import { FOTOCLAIM_VERHAAL } from '../lib/wam-fotoclaims.js';
import { ACTUALITEIT, inhoudGewijzigd } from '../lib/wam-actualiteit.js';
import { WAM_INDEXNOW_URLS, wamLlms } from '../lib/wam-vindbaarheid.js';
test('geclaimde beelden en besloten mailboxstukken worden niet opnieuw ingeladen', () => {
 const h = pagina('dossier/anp', true);
 assert.ok(h.includes('id="eigen-mailzaken"'));
 assert.equal(EIGEN_FOTOCLAIMS.zaken.length, 6);
 assert.ok(h.includes('€355,06') && h.includes('€391,29') && h.includes('€412,85'));
 assert.ok(h.includes('niet volledig worden uitgelezen'));
 assert.ok(!/mycase\.|mail\.google\.com|Wachtwoord:|Pincode:|\b[A-Z]{2}\d{2}[A-Z]{4}\d{8,}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(h));
 for (const m of h.matchAll(/<img[^>]+src="([^"]+)"/g)) assert.ok(!/anpfoto|yoo\.rs|roeldijkstra|googleusercontent|linkedin|visualrights/i.test(m[1]), m[1]);
});
test('foto zonder maker, bron of toestemming wordt geweigerd; toegestane beelden houden volledige credits', () => {
 const fotos = PERSONEN_MEDIA.personen.filter(p => p.foto);
 assert.equal(fotos.length, 6);
 assert.equal(controleerFoto({ url: 'https://example.com/foto.jpg' }), false);
 for (const p of fotos) {
  assert.equal(controleerFoto(p.foto), true);
  assert.equal(controleerFoto({ ...p.foto, toestemming: '' }), false);
  const h = personenMedia(p.naam);
  assert.ok(h.includes(p.foto.maker) && h.includes(p.foto.licentieUrl));
  assert.ok(h.includes('referrerpolicy="no-referrer"'));
 }
 const hosters = pagina('dossier/hosters', true);
 assert.equal((hosters.match(/<img src="https:\/\/www.strato.nl\/hq\//g) || []).length, 4);
 assert.ok(!hosters.includes('object-fit:cover'));
});
test('gedeelde professionele profielen verschijnen op de verschillende bestaande dossiers', () => {
 assert.ok(pagina('dossier/anp', true).includes('https://nl.linkedin.com/in/marthariemsma'));
 assert.ok(pagina('dossier/hosters', true).includes('https://nl.linkedin.com/in/diongoudkuil'));
 assert.ok(pagina('dossier/blendle', true).includes('https://uk.linkedin.com/in/laurentkayser'));
 assert.ok(!personenMedia('Chris Oomen').includes('linkedin.com/in/chrisoomen'));
 assert.ok(!pagina('dossier/errezeta', true).includes('linkedin.com/in/fabiana'));
 const anp = pagina('dossier/anp', true), chris = anp.slice(anp.indexOf('<h3>Chris Oomen</h3>')).split('</article>')[0];
 assert.ok(!chris.includes('hans-de-zwart'));
 assert.equal((anp.match(/data-persoon="hans-de-zwart"/g) || []).length, 1);
 assert.ok(anp.includes('https://nl.linkedin.com/in/edouardvanarem') && anp.includes('https://nl.linkedin.com/in/jessicavanderwaal'));
});
test('werkelijke wijzigingen hebben een bronlog; controledatum overschrijft ongewijzigde brondata niet', () => {
 assert.equal(inhoudGewijzigd('/bedrijven/kpn'), '');
 assert.equal(sitemapLastmod('/bedrijven/kpn'), '2026-11-24');
 for (const [pad, data] of Object.entries(ACTUALITEIT.paginas)) {
  const h = pagina(pad.slice(1), true);
  assert.ok(h.includes('id="wijzigingen"'), pad);
  assert.ok(data.wijzigingen.every(w => w.bronnen.length > 0));
  assert.equal(sitemapLastmod(pad), data.gewijzigd);
 }
});
test('nieuw verhaal toont concrete bronstatus, tegenargument en correcte indexeerbare metadata', () => {
 const h = pagina('fotoclaims-verdienmodel', true);
 const graph = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
 const a = graph.find(x => x['@type'] === 'Article');
 assert.equal(a.headline, FOTOCLAIM_VERHAAL.titel);
 assert.equal(a.citation.length, FOTOCLAIM_VERHAAL.bronnen.length);
 assert.ok(h.includes('Thomas Wolf') && h.includes('Marco Verch') && h.includes('Richard Broekhuijzen') && h.includes('Roel Dijkstra'));
 assert.ok(h.includes('nog niet onherroepelijk') && h.includes('geen misbruik door Broekhuijzen') && h.includes('Waarom fotografen zeggen dat handhaving nodig is'));
 assert.ok(WAM_INDEXNOW_URLS.includes('https://wearemany.now/fotoclaims-verdienmodel'));
 assert.ok(wamLlms().includes('https://wearemany.now/fotoclaims-verdienmodel'));
 assert.ok(!/noindex/.test(h));
 const ids = [...h.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
 assert.equal(new Set(ids).size, ids.length);
 for (const m of h.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(m[1]), m[1]);
});
