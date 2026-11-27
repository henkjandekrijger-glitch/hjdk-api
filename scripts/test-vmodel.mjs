// test: KV_REDIS_URL=redis://127.0.0.1:<poort> node scripts/test-vmodel.mjs (voorspelmodel per klik, lib/vmodel.js)
const { kv } = await import('../lib/db.js');
const V = await import('../lib/vmodel.js');
const ok = (c, n) => { console.log((c ? 'ok   ' : 'FOUT ') + n); if (!c) process.exitCode = 1; };
await kv.raw(['FLUSHDB']);
const D = new Date().toISOString().slice(0, 10), k = 'mm:vs:' + D;
const zet = async (f, x) => { for (const [u, n] of Object.entries(x)) await kv.raw(['HINCRBY', k, 'g|' + f + '|' + u, n]); };
// 2.000 kliks naar eigen bestemmingen: iOS 30% mens, datacenter 1%, android 10%
await zet('os=ios', { n: 1000, ud: 1000, echt: 300, bot: 10 }); await zet('os=android', { n: 1000, ud: 1000, echt: 100, bot: 50 });
await zet('ipsoort=datacenter', { n: 300, ud: 300, echt: 3, bot: 290 }); await zet('ipsoort=gewoon', { n: 1700, ud: 1700, echt: 397, bot: 10 });
let r = await V.bouwModel(kv);
ok(r.ok && Math.abs(r.p0.echt - 0.2) < 0.001 && r.voorspellers.echt >= 3, 'model gebouwd: gemiddeld 20% mens, ' + r.voorspellers.echt + ' voorspeller-waarden');
const M = await kv.get('mm:model:g');
const a = V.scoor(M, { os: 'ios', ipsoort: 'gewoon' }).echt, b = V.scoor(M, { os: 'android', ipsoort: 'datacenter' }).echt;
ok(a > 0.2 && b < 0.05 && b < a, 'iPhone thuis ' + a + ' tegen android datacenter ' + b);
ok(V.emmer(0.005) === 'b0' && V.emmer(0.02) === 'b1' && V.emmer(0.5) === 'b5', 'emmers');
ok(!r.mag, 'zonder bewezen kalibratie blokkeert het model niet');
let z = await V.zoneTel(kv, { net: 'propeller', zone: '42', p: 0.004, D, model: M }); z = await V.zoneTel(kv, { net: 'propeller', zone: '42', p: 0.006, D, model: M });
ok(!((await kv.get('mm:blok:propeller')) || {}).zones, 'niet bewezen raak: zone 42 blijft open');
// kalibratie: van 400 kliks in de laagste emmers werd 2% mens (98% raak)
await zet('score=b0', { n: 300, ud: 300, echt: 5 }); await zet('score=b1', { n: 100, ud: 100, echt: 3 }); await zet('score=b4', { n: 200, ud: 200, echt: 50 });
r = await V.bouwModel(kv);
ok(r.mag && r.raak >= 0.95 && r.raakKliks === 400, 'bewezen raak: ' + r.raak + ' op ' + r.raakKliks + ' kliks');
const M2 = await kv.get('mm:model:g');
ok(!M2.w.echt['score=b0'], 'de score zelf is geen voorspeller in het model');
await V.zoneTel(kv, { net: 'propeller', zone: '43', p: 0.004, D, model: M2 }); ok(!(((await kv.get('mm:blok:propeller')) || {}).zones || []).includes('43'), 'eerste klik: nog open');
await V.zoneTel(kv, { net: 'propeller', zone: '43', p: 0.006, D, model: M2 }); ok(((await kv.get('mm:blok:propeller')) || {}).zones.includes('43'), 'tweede klik zonder kans op een mens: dicht');
await V.zoneTel(kv, { net: 'propeller', zone: '44', p: 0.30, D, model: M2 }); await V.zoneTel(kv, { net: 'propeller', zone: '44', p: 0.25, D, model: M2 });
ok(!(await kv.get('mm:blok:propeller')).zones.includes('44'), 'zone met mensen blijft open');
console.log(V.modelTekst(M2));
await kv.raw(['FLUSHDB']); process.exit(process.exitCode || 0);
