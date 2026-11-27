// test: KV_REDIS_URL=redis://127.0.0.1:<poort> node scripts/test-pxcheck.mjs (databronnen van Clickmind, lib/pxcheck.js)
const { kv } = await import('../lib/db.js');
const P = await import('../lib/pxcheck.js');
const ok = (c, n) => { console.log((c ? 'ok   ' : 'FOUT ') + n); if (!c) process.exitCode = 1; };
await kv.raw(['FLUSHDB']);
ok((await P.pxSteekproef(kv, { net: 'propeller', zone: '123', ip: '1.2.3.4' })) === null, 'zonder sleutel geen check');
process.env.PROXYCHECK_KEY = 'test';
let n = 0; const haal = async (url) => { n++; return { ok: true, json: async () => ({ status: 'ok', '1.2.3.4': { network: { asn: 'AS9009', type: 'Hosting' }, detections: { proxy: n % 2 === 1, vpn: false, hosting: true } } }) }; };
for (let i = 0; i < 5; i++) await P.pxSteekproef(kv, { net: 'propeller', zone: '123', ip: '1.2.3.4' }, haal);
ok(n === 3, 'hoogstens 3 checks per zone per dag (' + n + ')');
const z = await P.pxZones(kv, 1);
ok(z.length === 1 && z[0].n === 3 && z[0].proxy === 2 && z[0].oordeel === 'proxy' && z[0].soort.hosting === 3, 'zone-oordeel uit de steekproef: ' + JSON.stringify(z[0]));
process.env.CLOUDFLARE_RADAR_TOKEN = 't';
const r = await P.radarRonde(kv, {}, async () => ({ ok: true, json: async () => ({ result: { summary_0: { bot: '71.2', human: '28.8' } } }) }));
ok(r.ok && r.providers === 1, 'Radar: botaandeel per provider uit de steekproef');
const st = await P.bronnenStand(kv); ok(st.find(b => b.id === 'proxycheck').aan && st.find(b => b.id === 'radar').providers === 1, 'stand van de bronnen');
console.log(P.bronnenTekst(st, z).split('\n').slice(0, 4).join('\n'));
await kv.raw(['FLUSHDB']); process.exit(process.exitCode || 0);
