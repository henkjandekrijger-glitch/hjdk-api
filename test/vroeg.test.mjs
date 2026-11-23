// Test van de vroege voorspeller (lib/vroeg.js): synthetische bezoeken, een slechte advertentie moet uit, de andere niet. node test/vroeg.test.mjs
import { ronde, kenmerk, train, auc, kans, uitLijst, tekst } from '../lib/vroeg.js';
// nep-kv
const store = new Map();
const kv = { get: async k => store.has(k) ? JSON.parse(store.get(k)) : null, set: async (k, v) => { store.set(k, JSON.stringify(v)); return 'OK'; }, raw: async c => (c[0] === 'EXISTS' ? (store.has(c[1]) ? 1 : 0) : 1) };
// synthetische data: 3 advertenties, 1 slecht (geen aanraking), mensen die aanraken en scrollen melden zich vaker aan
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const nu = Date.now(), klik = new Map(), uit = new Map(), bezoek = new Map();
for (let i = 0; i < 9000; i++) {
  const cid = i.toString(16).padStart(12, '0'), vid = (i * 7919).toString(16).padStart(16, '0'), cr = ['111', '222', '333'][i % 3];
  const t0 = nu - rnd() * 8 * 864e5;
  const goed = cr === '333' ? rnd() < 0.08 : rnd() < 0.5;
  const c = { t: goed ? 20000 : 3000, nt: goed ? 4 : 0, sc: goed ? 6 : 0, sd: goed ? 40 : 0, t1: goed ? 2000 : null, sp: goed ? 40 : 0, mem: 4 };
  const row = { t: t0 + 2000, vlag: { mens: goed ? 1 : 0, int: goed ? 1 : 0, vis3: 1 }, ua: 'iPhone', land: 'us', al: 'en-US', tz: 'America/New_York', score: goed ? 90 : 30, c };
  klik.set(cid, { cr, net: 'propeller', camp: '999', zone: String(100 + (i % 40)), w: '' });
  bezoek.set(vid, { vid, site: 'whichtobuy.best', pad: '/x', mmc: cid, net: 'propeller', camp: '999', zone: String(100 + (i % 40)), cr: '', t0, m: [{ t: t0 + 2000, x: kenmerk(row) }] });
  if (goed && rnd() < 0.12) uit.set('c:' + cid, { aanmelding: t0 + 3600e3 });
  else if (!goed && rnd() < 0.005) uit.set('c:' + cid, { aanmelding: t0 + 3600e3 });
}
const r = await ronde(kv, { nu, leesFn: async () => ({ klik, uit, bezoek, volledig: true, rijen: 1, dagen: ['x'] }) });
const s = r.sites['whichtobuy.best'];
console.log(JSON.stringify({ doel: s.doel, model: { auc: s.model.auc, leer: s.model.leer, toetsPos: s.model.toetsPos }, betrouwbaar: s.betrouwbaar, recent: s.recent, ads: s.advertenties }, null, 0));
console.log(JSON.stringify(await uitLijst(kv, { net: 'propeller' })));
console.log(tekst(r));
if (!(s.betrouwbaar && s.advertenties.find(a => a.k.endsWith('|333')).oordeel === 'uit' && s.advertenties.filter(a => a.oordeel === 'uit').length === 1)) { console.log('TEST FAALT'); process.exit(1); }
console.log('TEST OK');
