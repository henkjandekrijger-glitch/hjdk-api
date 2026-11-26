// Controle van het mobiliseerblok (lib/mobiliseer.js). Draai: node scripts/test-mobiliseer.mjs
// Bewaakt: alleen echte, gepubliceerde dossiers met "ik ook"; smalle herkenning van het bedrijf; niets op andere sites; opbouw van het script.
import assert from 'node:assert/strict';
import { MOBI, mobiAan, mobiJs, mobiEv, mobiStand, mobiMeet, mobiVraag } from '../lib/mobiliseer.js';
import { DOSSIERLIJST, IKOOK, DREMPEL } from '../lib/wam-dossiers.js';

let n = 0; const ok = (naam, f) => { f(); n++; };
const okA = async (naam, f) => { await f(); n++; };

ok('elk dossier bestaat, is geen onderzoek en heeft ik-ook', () => {
  for (const id of Object.keys(MOBI)) {
    const d = DOSSIERLIJST.find(x => x.id === id);
    assert.ok(d, id + ' staat niet in DOSSIERLIJST'); assert.notEqual(d.soort, 'onderzoek', id + ' is nog in onderzoek'); assert.ok(IKOOK[id], id + ' heeft geen ik-ook op de dossiersite');
    for (const t of ['nl', 'us', 'de']) assert.ok(MOBI[id].regel[t] && MOBI[id].regel[t].length < 140, id + ' regel ' + t);
  }
});
ok('herkenning is smal', () => {
  const re = id => new RegExp(MOBI[id].re, 'i');
  assert.ok(re('blendle').test('Losse artikelen via Blendle lezen')); assert.ok(!re('blendle').test('Een blender voor smoothies'));
  assert.ok(re('anp').test('Een brief van ANP Fair Licensing')); assert.ok(re('anp').test('fotoclaim van het ANP'));
  assert.ok(!re('anp').test('Foto: ANP')); assert.ok(!re('anp').test('volgens het ANP stijgen de prijzen'));
});
ok('alleen op de drie keuzehulpsites', () => {
  assert.ok(mobiAan({ taal: 'nl', site: 'kzuxnl' })); assert.ok(mobiAan({ taal: 'de', site: 'kzuxde' })); assert.ok(mobiAan({ taal: 'us', site: 'kzuxov' }));
  assert.ok(!mobiAan({ taal: 'us', site: 'kzuxnexy' })); assert.ok(!mobiAan({ taal: 'us', site: 'kzuxlc' })); assert.ok(!mobiAan({ taal: 'kadoly', site: 'kzuxkadoly' }));
  assert.ok(!mobiAan({ taal: 'nl', site: 'kzuxnl', geenGeheugen: true }));
  assert.equal(mobiJs({ taal: 'us', site: 'kzuxnexy' }), '');
});
ok('script is geldig en bevat geen grijs of nullen', () => {
  for (const taal of ['nl', 'us', 'de']) {
    const h = mobiJs({ taal, site: 'kzux' + taal });
    assert.match(h, /^<style>[\s\S]+<\/style><script>[\s\S]+<\/script>$/);
    const js = h.replace(/^<style>[\s\S]+?<\/style><script>/, '').replace(/<\/script>$/, ''); new Function(js); // syntaxcontrole
    assert.ok(!/#(9CA3AF|6B7280|D1D5DB|E5E7EB)/i.test(h), 'grijs in het blok'); assert.ok(!/\b0 (mensen|people|Menschen)/.test(h));
    assert.ok(h.includes('/api/wam?op=daanmelden') && h.includes('"waar":"mobi"') === false); // waar wordt in de browser gezet, niet in de config
    assert.ok(!/\bWAM\b/.test(h), 'de naam WAM mag niet in beeld'); assert.ok(!/machteloos/i.test(h));
  }
});
ok('wedervraag in de chat alleen bij een dossierbedrijf', () => {
  const v = mobiVraag('nl', 'blendle'); assert.ok(v && v.id === 'blendle' && /Blendle/.test(v.a) && v.opties.length === 3 && /\?$/.test(v.vraag));
  assert.equal(mobiVraag('nl', 'een blender voor smoothies'), null); assert.equal(mobiVraag('kadoly', 'blendle'), null);
  assert.ok(mobiVraag('de', 'Ärger mit Blendle')); assert.ok(mobiVraag('us', 'ANP Fair Licensing letter'));
});
const nepDb = () => { const h = {}; return { h, raw: async a => { if (a[0] === 'HINCRBY') { h[a[1]] = h[a[1]] || {}; h[a[1]][a[2]] = (h[a[1]][a[2]] || 0) + Number(a[3]); return h[a[1]][a[2]]; } if (a[0] === 'HGETALL') return Object.entries(h[a[1]] || {}).flat(); return 1; }, get: async k => (k.endsWith('scopeklaar') ? 1 : null), set: async () => 1 }; };
await okA('stappen tellen alleen geldige invoer, geen bots', async () => {
  const db = nepDb();
  assert.equal((await mobiEv({ id: 'blendle', stap: 'gezien', s: 'nl', b: 'pagina' }, 'Mozilla/5.0 Android', db)).ok, true);
  assert.equal((await mobiEv({ id: 'blendle', stap: 'gezien', s: 'nl' }, 'Googlebot/2.1', db)).ok, false);
  assert.equal((await mobiEv({ id: 'nep', stap: 'gezien', s: 'nl' }, 'Mozilla/5.0', db)).ok, false);
  assert.equal((await mobiEv({ id: 'blendle', stap: 'koop', s: 'nl' }, 'Mozilla/5.0', db)).ok, false);
  assert.equal((await mobiEv({ id: 'blendle', stap: 'tik', s: 'fr' }, 'Mozilla/5.0', db)).ok, false);
  const sleutels = Object.keys(db.h); assert.equal(sleutels.length, 1); assert.deepEqual(Object.keys(db.h[sleutels[0]]), ['nl|blendle|pagina|gezien']);
});
await okA('aantal pas vanaf de drempel van de dossiersite', async () => {
  const db = nepDb(); db.h['wmn:volg:scope'] = { blendle: DREMPEL.volgers - 1, anp: DREMPEL.volgers };
  const s = await mobiStand(db); assert.deepEqual(s.d.blendle, {}); assert.deepEqual(s.d.anp, { n: DREMPEL.volgers });
});
await okA('meting meldt het lek bij veel gezien zonder aanmelding', async () => {
  const db = nepDb(); for (let i = 0; i < 200; i++) await mobiEv({ id: 'blendle', stap: 'gezien', s: 'nl', b: 'pagina' }, 'Mozilla/5.0', db);
  const m = await mobiMeet(2, db); assert.equal(m.som.gezien, 200); assert.equal(m.bevestigd, 0); assert.ok(m.lek);
});
console.log('test-mobiliseer: ' + n + ' controles geslaagd');
