// Test Videomind (lib/videomind.js) tegen een lokale Redis: KV_REDIS_URL=redis://127.0.0.1:6391 node scripts/test-videomind.mjs
// Zernio wordt nagebootst (fetch), Clickmind-tellers worden in mm:z en mm:zu gezet zoals lib/mensmeter.js en lib/wissel.js dat doen.
if (!/127\.0\.0\.1|localhost/.test(String(process.env.KV_REDIS_URL || ''))) { console.log('overgeslagen: alleen tegen een lokale Redis (KV_REDIS_URL=redis://127.0.0.1:...)'); process.exit(0); }
const { kv } = await import('../lib/db.js'); await kv.raw(['FLUSHDB']);
const V = await import('../lib/videomind.js');
const ok = (c, n) => { if (!c) { console.log('FOUT', n); process.exitCode = 1; } else console.log('ok  ', n); };
const H = 3600e3, nu = Date.now(), iso = t => new Date(t).toISOString(), dag = t => iso(t).slice(0, 10);
process.env.ZERNIO_API_KEY = 'test';
const views = { z1: 40, z2: 12, z3: 35, z4: 9, z5: 50, z6: 10 };
globalThis.fetch = async u => { const id = decodeURIComponent(String(u).split('postId=')[1] || String(u).split('/posts/')[1] || '');
  if (/\/posts\//.test(u)) return { ok: true, status: 200, json: async () => ({ post: { title: 'Titel van ' + id + ': can you answer this? #shorts', content: 'x https://a.b/p?utm_source=youtube&utm_content=' + id } }) };
  return { ok: true, status: 200, json: async () => ({ status: 'published', platformPostUrl: 'https://youtu.be/' + id, analytics: { views: views[id], likes: 2, comments: 1, videoDurationSeconds: 15 }, platformAnalytics: [{ platformPostId: 'yt' + id }] }) }; };
// register
ok(!(await V.zet({ id: 'x', project: 'p', platform: 'youtube' })).ok, 'te kort id geweigerd');
ok(!(await V.zet({ id: 'aa', project: 'p', platform: 'myspace' })).ok, 'onbekend platform geweigerd');
const L = [];
for (let i = 1; i <= 6; i++) L.push({ id: 'v' + i, project: 'mylevel', platform: 'youtube', vorm: 'short', zid: 'z' + i, at: iso(nu - (50 + i) * H), titel: i % 2 ? 'CDL: can you answer this? #shorts' : 'CDL: how far behind a truck should you stay?', onderwerp: i < 4 ? 'cdl' : 'cna', link: 'https://mylevel.today/cdl?utm_source=youtube&utm_content=v' + i });
L.push({ id: 'v7', project: 'mylevel', platform: 'youtube', vorm: 'long', zid: 'z7', at: iso(nu + 24 * H), titel: 'DMV: 20 Questions with Answers' });
L.push({ id: 'v8', project: 'kadoly', platform: 'tiktok', at: iso(nu - 3 * H) });
const r = await V.zetVeel(L); ok(r.gezet === 8 && r.nieuw === 8, 'acht video\'s gezet');
ok(!(await V.zet({ id: 'v1', project: 'kadoly', platform: 'youtube' })).ok, 'id van een ander project geweigerd');
ok((await V.video('v1')).haak === 'uitdaging' && (await V.video('v2')).haak === 'vraag' && (await V.video('v7')).haak === 'n-vragen', 'haak afgeleid uit de titel');
// Clickmind-tellers zoals de mensmeter ze schrijft
await kv.raw(['HSET', 'mm:z:' + dag(nu), 'youtube|v1|n', '5', 'youtube|v1|mens', '3', 'youtube|v3|n', '2', 'tiktok|v8|n', '4', 'youtube|vreemd|n', '9']);
await kv.raw(['HSET', 'mm:z:' + dag(nu - 24 * H), 'youtube|v1|n', '1']);
await kv.raw(['HSET', 'mm:zu:' + dag(nu), 'youtube|v1|koop', '1']);
// ronde
const u = await V.ronde(); ok(u.zernio.gemeten === 6, 'Zernio: zes geplaatste video\'s met zid gemeten (geplande en zonder zid niet) ' + JSON.stringify(u.zernio));
ok(u.clickmind.bezoeken === 12, 'Clickmind-bezoeken van onze zones geteld ' + JSON.stringify(u.clickmind));
const v1 = await V.video('v1'); ok(v1.m48 && v1.m48.weergaven === 40, '48 uur-meting vastgelegd');
ok(v1.url === 'https://youtu.be/z1' && v1.lengte === 15, 'url en lengte uit Zernio');
const u2 = await V.ronde(); ok(u2.zernio.gemeten === 0, 'tweede ronde meet niet opnieuw binnen het interval');
const s = await V.stand({ project: 'mylevel' }); const r1 = s.videos.find(x => x.id === 'v1');
ok(r1.weergaven === 40 && r1.bezoeken === 6 && r1.mens === 3 && r1.koop === 1, 'stand v1: weergaven, bezoeken, mens, koop');
ok(s.totaal.videos === 7 && s.totaal.geplaatst === 6, 'totaal mylevel');
ok(s.lessen.automatisch.some(l => l.dimensie === 'haak' && l.cijfers[0].waarde === 'uitdaging' && l.cijfers[0].mediaan === 40), 'les: uitdaging wint met mediaan 40 ' + (s.lessen.automatisch[0] || {}).les);
ok(s.lessen.automatisch.every(l => l.cijfers.every(c => c.n >= 3)), 'les pas vanaf 3 per kant');
ok((await V.meting({ id: 'v2', koop: 2, omzet: 98, bron: 'paddle' })).ok, 'eigen meting');
ok(!(await V.meting({ id: 'bestaatniet', koop: 1 })).ok, 'meting zonder register geweigerd');
ok(!(await V.les({ les: 'kort' })).ok && (await V.les({ les: 'Uitdaging gaf 3x zoveel weergaven na 48 uur (40 tegen 12)', project: 'mylevel', platform: 'youtube', bron: 'test' })).ok, 'les met de hand');
const t = V.tekst(await V.stand({})); ok(t.includes('VIDEOMIND') && t.includes('v1 | mylevel/youtube') && t.includes('LESSEN MET DE HAND'), 'tekst');
ok(!/[—–]/.test(t), 'geen gedachtestreepjes');
const db = await V.dashBlok(); ok(db && db.regels.length >= 3 && typeof db.nu === 'number' && db.nu === 3, 'dashboardblok ' + JSON.stringify(db && db.regels));
// seed
const sd = await V.seed('mylevel'); ok(sd.nieuw === 35 && !sd.fouten.length, 'seed MyLevel: 35 nieuw ' + JSON.stringify(sd.fouten.slice(0, 2)));
const sd2 = await V.seed('mylevel'); ok(sd2.nieuw === 0, 'seed twee keer = niets dubbel');
ok((await V.video('long-dmv')).vorm === 'long' && (await V.video('cdl-0')).link.includes('utm_content=cdl-0'), 'seed velden');
// dashboard
const D = await import('../lib/dashboard.js'); const d = await D.dashData(kv); const p = d.projecten.find(x => x.id === 'video');
ok(p && p.stand && p.stand.regels.length >= 3 && p.advies, 'dashboard: project video met stand en advies');
ok(D.skillsLijst().some(x => x.naam === 'videomind' && x.staat), 'skill videomind in het overzicht');
await kv.raw(['FLUSHDB']); process.exit(process.exitCode || 0);
