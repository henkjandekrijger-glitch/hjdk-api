// Rekenhulp tv-meubel (lib/tvrekenhulp.js): kern tegen met de hand gerekende waarden, kijkafstand tegen SMPTE/THX, FAQ en schema.
import assert from 'node:assert/strict';
import { tvKern, tvVoorMeubel, tvFaq, tvLd, tvPagina, tvLlms, TV_VRAAG, TV_MATEN } from '../lib/tvrekenhulp.js';
const k = tvKern(65);
assert.equal(k.breedte, 144); assert.equal(k.hoogte, 81); assert.equal(k.net, 144); assert.equal(k.mooi, 174); assert.equal(k.ruim, 216);
// SMPTE 30 graden ~ 1,63 x diagonaal, THX 40 graden ~ 1,2 x diagonaal (Kaleidescape/Wikipedia)
assert.ok(Math.abs(k.kijkMax - 65 * 2.54 * 1.63 / 100) < 0.06); assert.ok(Math.abs(k.kijkMin - 65 * 2.54 * 1.2 / 100) < 0.06);
assert.deepEqual(tvVoorMeubel(198), { net: 89, mooi: 75 }); assert.deepEqual(tvVoorMeubel(124), { net: 56, mooi: 42 });
assert.equal(tvKern(5), null); assert.equal(tvKern('abc'), null);
for (const m of TV_MATEN) { const x = tvKern(m); assert.ok(x.net >= x.breedte && x.mooi > x.net && x.ruim > x.mooi && x.kijkMax > x.kijkMin, 'oplopend ' + m); }
const f = tvFaq(); assert.equal(f[0].v, TV_VRAAG); assert.ok(f.every(x => !/[–—]/.test(x.v + x.a)));
const ld = JSON.parse(tvLd('https://gids.kadoly.com', { '@type': 'Organization', name: 'Kadoly' })); assert.ok(ld['@graph'].some(x => x['@type'] === 'WebApplication')); assert.equal(ld['@graph'].find(x => x['@type'] === 'FAQPage').mainEntity[0].name, TV_VRAAG);
console.log('Rekenhulp tv-meubel: kern, kijkafstand, meubels, FAQ en schema geslaagd.');


// Een geometrische grens mag ook op server/browser/schema/LLM geen veiligheidsclaim worden.
const html=tvPagina({esc:String,euro:String,cat:{dp_1022:{vr:true,t:'Tanner',p:100}},thuis:i=>i.p,leverTekst:()=> 'geschat'},65);
assert.ok(html.includes('Geen bevestigde passing'));
assert.ok(html.indexOf('Geen bevestigde passing')<html.indexOf('id="tv-meubels"'));
for(const verboden of ['Past net','Past mooi','dan telt alleen de breedte','<th>Meubel minstens'])assert.ok(!html.includes(verboden),verboden);
assert.ok(html.includes('145,2 cm'));assert.ok(html.includes('33,4 cm'));
assert.ok(tvLlms('https://gids.kadoly.com').includes('geen fysieke passendheids- of veiligheidscheck'));
assert.ok(f.every(x=>!x.a.includes('minstens')));
assert.ok(JSON.stringify(ld).includes('fysieke passing'));
console.log('24nov: geometrie blijft gelijk, passing onbekend tot model/voet/draagkracht bevestigd zijn in SSR, browsertekst, FAQ/schema en LLM.');
