// Test boeken in Clickmind (taak obiwrz, 27 nov 2026) tegen een lokale Redis: KV_REDIS_URL=redis://127.0.0.1:6391 node scripts/test-boeken-clickmind.mjs
// 1) stockingbooks.com en lastingchange.works mogen doel zijn van een post met korte link (lib/distlus.js DOELEN)
// 2) de korte link /m/<code> loopt via /api/post?op=k: een mailcode gaat voor, een postcode erna, UTM blijft staan, mmc per klik erbij
// 3) mailcodes en postcodes botsen nooit
// 4) onbekende uitkliks leren niet als 0 in het paspoort (lib/paspoort.js meet)
// Geen AI: de posts hier hebben geen tekst, dus labelAI loopt niet.
if (!/127\.0\.0\.1|localhost/.test(String(process.env.KV_REDIS_URL || ''))) { console.log('overgeslagen: alleen tegen een lokale Redis (KV_REDIS_URL=redis://127.0.0.1:...)'); process.exit(0); }
const { kv } = await import('../lib/db.js'); await kv.raw(['FLUSHDB']);
const D = await import('../lib/distlus.js'), PL = await import('../lib/postlus.js'), P = await import('../lib/paspoort.js');
const ok = (c, n) => { if (!c) { console.log('FOUT', n); process.exitCode = 1; } else console.log('ok  ', n); };
const req = (extra = {}) => ({ method: 'GET', headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', ...extra }, rawHeaders: [] });
const res = () => { const h = {}; return { h, statusCode: 0, setHeader: (k, v) => { h[k.toLowerCase()] = v; }, end: function (b) { this.body = b; return this; } }; };

// 1) domeinen
ok(D.kortVoor('https://stockingbooks.com/white-elephant-gifts', 'bcdfg') === 'https://stockingbooks.com/m/bcdfg', 'kortVoor stockingbooks.com');
ok(D.kortVoor('https://www.lastingchange.works/how-to-start-over', 'bcdfg') === 'https://lastingchange.works/m/bcdfg', 'kortVoor lastingchange.works (www weg)');
ok(D.kortVoor('https://bookstuffers.com/x', 'bcdfg') === null, 'oud domein bookstuffers.com blijft geen doel (stuurt zelf door)');
ok(D.kortVoor('http://stockingbooks.com/x', 'bcdfg') === null, 'alleen https');
ok(D.kortVoor('https://curacao.day/x', 'bcdfg') === 'https://curacao.day/d/bcdfg', 'bestaande domeinen ongewijzigd (curacao.day /d/)');
ok(D.kortVoor('https://keuzehulp.best/x', 'bcdfg') === 'https://keuzehulp.best/m/bcdfg', 'bestaande domeinen ongewijzigd (keuzehulp.best /m/)');

// 2) post met korte link: UTM blijft, mmc per klik, src alleen als die ontbrak
const doel = 'https://stockingbooks.com/white-elephant-gifts?utm_source=pinterest&utm_medium=social&utm_content=20261127-test-abcd';
const m = await D.maak({ kanaal: 'pinterest', project: 'content', plek: 'bord sok', onderwerp: 'white elephant', soort: 'pin', doel, doelsoort: 'klik' });
ok(m.ok && /^https:\/\/stockingbooks\.com\/m\/[a-z0-9]{5}$/.test(m.link), 'maak: korte link op stockingbooks.com: ' + m.link);
ok(m.paspoort && m.paspoort.medium === 'pinterest' && m.paspoort.voor.project === 'content' && m.paspoort.doel.soort === 'klik', 'maak: paspoort pinterest, content, klik');
const r1 = res(); await PL.klikAntwoord(req(), r1, m.code);
const loc = r1.h.location ? new URL(r1.h.location) : null;
ok(r1.statusCode === 302 && loc && loc.host === 'stockingbooks.com' && loc.pathname === '/white-elephant-gifts', 'klik: 302 naar dezelfde pagina');
ok(loc && loc.searchParams.get('utm_source') === 'pinterest' && loc.searchParams.get('utm_medium') === 'social' && loc.searchParams.get('utm_content') === '20261127-test-abcd', 'klik: UTM blijft staan');
ok(loc && /^[0-9a-f]{12}$/.test(loc.searchParams.get('mmc') || '') && loc.searchParams.get('src') === 'pinterest', 'klik: mmc per klik en src erbij');
const r2 = res(); await PL.klikAntwoord(req(), r2, m.code); const mmc2 = new URL(r2.h.location).searchParams.get('mmc');
ok(mmc2 && mmc2 !== loc.searchParams.get('mmc'), 'klik: elke klik een eigen mmc');
const r3 = res(); await PL.klikAntwoord(req({ 'user-agent': 'Pinterestbot/1.0 crawl' }), r3, m.code);
const post = await kv.get('dist:r:' + m.id);
ok(post.kliks === 2 && post.scans === 1 && post.status === 'geplaatst', 'klik: 2 mensen geteld, de bot als scan: ' + post.kliks + '/' + post.scans);
const r4 = res(); await PL.klikAntwoord(req(), r4, 'zzzzz'); ok(r4.statusCode === 404, 'onbekende code: 404, niets geschreven');
const lc = await D.maak({ kanaal: 'pinterest', project: 'content', doel: 'https://lastingchange.works/how-to-start-over?utm_source=pinterest&utm_content=lc1', doelsoort: 'klik' });
ok(lc.ok && lc.link.startsWith('https://lastingchange.works/m/'), 'maak: korte link op lastingchange.works');
ok(!(await D.maak({ kanaal: 'pinterest', project: 'content', doel: 'https://amazon.com/dp/B0TEST' })).ok, 'nooit direct naar Amazon');

// mailtracking intact: een mailcode (12 hex + linknummer) en een korte mailcode gaan naar de mail, niet naar de post
const mid = 'a1b2c3d4e5f6';
await kv.set('post:mail:' + mid, { id: mid, project: 'kadoly', variant: 'a', status: 'verstuurd', links: ['https://keuzehulp.best/robotstofzuiger?utm_source=mail'], kort: [] });
const r5 = res(); await PL.klikAntwoord(req(), r5, mid + '1'); const l5 = r5.h.location ? new URL(r5.h.location) : null;
ok(r5.statusCode === 302 && l5 && l5.host === 'keuzehulp.best' && l5.searchParams.get('utm_source') === 'mail' && /^[0-9a-f]{12}$/.test(l5.searchParams.get('mmc') || ''), 'mail: lange code gaat naar de mail');
ok((await kv.get('post:mail:' + mid)).kliks === 1, 'mail: klik geteld op de mail');
await kv.set('post:k:qqqqq', { id: mid, n: 1 });
const r6 = res(); await PL.klikAntwoord(req(), r6, 'qqqqq'); ok(r6.statusCode === 302 && new URL(r6.h.location).host === 'keuzehulp.best', 'mail: korte mailcode gaat naar de mail');

// 3) botsing: een postcode mag nooit een bestaande mailcode zijn (en andersom)
const fs = await import('node:fs'), src = fs.readFileSync(new URL('../lib/distlus.js', import.meta.url), 'utf8'), srcP = fs.readFileSync(new URL('../lib/postlus.js', import.meta.url), 'utf8');
const botsVrij = /kv\.get\('dist:k:' \+ c\)\) && !\(await kv\.get\('post:k:' \+ c\)\)/.test(src) && /kv\.get\('post:k:' \+ c\) \|\| await kv\.get\('dist:k:' \+ c\)/.test(srcP);
ok(botsVrij, 'codes: distlus slaat mailcodes over en de POST-lus slaat postcodes over');

// 4) onbekend is geen 0
const zonderLink = P.stukUitPost({ id: 'aa11', t: new Date().toISOString(), project: 'content', kanaal: 'pinterest', plek: 'bord sok', metLink: false, kliks: 0, status: 'geplaatst', uitkomsten: [], stats: { imp: 900 }, doelsoort: 'klik' });
ok(zonderLink.cijfers.kliks === null && zonderLink.cijfers.vert === 900, 'post zonder korte link: kliks onbekend (null), vertoningen 900');
const s1 = P.schoon(zonderLink).stuk;
ok(!('kliks' in s1.cijfers) && P.meet(s1) === null && P.meet(s1, true) === null, 'meet: alleen vertoningen, uitkliks onbekend: geen meting (was 0 kliks op 900 vertoningen)');
const s2 = P.schoon({ medium: 'pinterest', project: 'content', doel: 'klik', titel: 'Pin', cijfers: { vert: 500 } }).stuk;
ok(P.meet(s2) === null, 'op=stuk met alleen vertoningen: geen meting');
const s3 = P.schoon({ medium: 'pinterest', project: 'content', doel: 'klik', titel: 'Pin', cijfers: { vert: 500, kliks: 0 } }).stuk;
const m3 = P.meet(s3); ok(m3 && m3.uit === 0 && m3.basis === 500 && m3.soort === 'vert', 'gemeten 0 kliks blijft 0 (echt gemeten)');
const metLink = P.stukUitPost({ id: 'aa12', t: new Date().toISOString(), project: 'content', kanaal: 'pinterest', metLink: true, code: 'bcdfg', doel, kliks: 0, status: 'geplaatst', uitkomsten: [], stats: { imp: 900 } });
ok(metLink.cijfers.kliks === 0, 'post met korte link en geen kliks: echt 0');
const vid0 = P.stukUitVideo({ id: 'v1', platform: 'youtube', project: 'content', at: new Date(Date.now() - 864e5).toISOString() }, { weergaven: 300, bezoeken: 0 });
ok(vid0.cijfers.kliks === null, 'video zonder link: bezoek onbekend');
const vid1 = P.stukUitVideo({ id: 'v2', platform: 'youtube', project: 'content', link: 'https://stockingbooks.com/?utm_content=v2', at: new Date(Date.now() - 864e5).toISOString() }, { weergaven: 300, bezoeken: 0 });
ok(vid1.cijfers.kliks === 0, 'video met link: 0 bezoeken is echt 0');
const haak = { id: 'h1', bord: 'sok', doel: b => 'https://stockingbooks.com/x?b=' + b.a, titel: () => 'T', tekst: () => 'X' }, boek = { a: 'B0TEST1234' };
const pinZonder = P.stukUitBoekpin({ id: 'p1', t: new Date().toISOString(), m: { imp: 800, saves: 2 } }, haak, boek);
ok(pinZonder.cijfers.kliks === null && pinZonder.cijfers.vert === 800, 'boekpin met alleen vertoningen van Pinterest: kliks onbekend');
const pinMet = P.stukUitBoekpin({ id: 'p2', t: new Date().toISOString(), m: { imp: 800, klik: 0 } }, haak, boek);
ok(pinMet.cijfers.kliks === 0, 'boekpin met gemeten 0 uitgaande kliks: 0');
// in een stratum met genoeg kliks krijgt een stuk zonder gemeten kliks geen 'mis'
const pins = [];
for (let i = 0; i < 4; i++) pins.push(P.schoon({ id: 'hand:p' + i, medium: 'pinterest', project: 'content', doel: 'klik', titel: 'Pin ' + i + ' met eigen tekst', t: new Date(Date.now() - 6 * 864e5).toISOString(), cijfers: { vert: 1000, kliks: 10 } }).stuk);
pins.push(P.schoon({ id: 'hand:onbekend', medium: 'pinterest', project: 'content', doel: 'klik', titel: 'Pin zonder kliks', t: new Date(Date.now() - 6 * 864e5).toISOString(), cijfers: { vert: 3000 } }).stuk);
P.oordelen(pins); const onb = pins.find(p => p.id === 'hand:onbekend');
ok(onb.oordeel.uitslag === 'geen meting per stuk', 'oordeel: alleen vertoningen geeft geen mis maar: ' + onb.oordeel.uitslag);
const zo = pins.map(p => ({ ...p, cijfers: p.id === 'hand:onbekend' ? { vert: 3000, kliks: 0 } : p.cijfers })); P.oordelen(zo);
ok(zo.find(p => p.id === 'hand:onbekend').oordeel.uitslag === 'mis', 'controle: met kliks 0 zou hetzelfde stuk wel mis zijn (dat was het risico)');

await new Promise(r => setTimeout(r, 300));
await kv.raw(['FLUSHDB']); process.exit(process.exitCode || 0);
