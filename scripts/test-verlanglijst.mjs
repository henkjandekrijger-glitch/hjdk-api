// Test de lerende verlanglijst (lib/verlanglijst.js, lib/proef.js site kadolyvl, lib/vlleer.js) tegen een lokale Redis:
// redis-server --port 6398 --daemonize yes && KV_REDIS_URL=redis://127.0.0.1:6398 node scripts/test-verlanglijst.mjs
if (!/127\.0\.0\.1|localhost/.test(String(process.env.KV_REDIS_URL || ''))) { console.log('overgeslagen: alleen tegen een lokale Redis (KV_REDIS_URL=redis://127.0.0.1:...)'); process.exit(0); }
const { kv } = await import('../lib/db.js'); await kv.raw(['FLUSHDB']);
const VL = await import('../lib/verlanglijst.js'), PF = await import('../lib/proef.js'), L = await import('../lib/vlleer.js');
const ok = (c, n) => { if (!c) { console.log('FOUT', n); process.exitCode = 1; } else console.log('ok  ', n); };

// staat uit tot Henkjans ja; voor de test aan
ok(!(await PF.proefBeslis(kv, { site: 'kadolyvl', ctx: 'i' })).aan, 'proef staat uit tot zijn ja');
await PF.proefZet(kv, 'kadolyvl', { aan: true });
ok(VL.voorbeeldV('c').menu === 'c' && !VL.voorbeeldV('c').cta && VL.voorbeeldV('x') === null, 'voorbeeld per versie');
// beslissing en pf-tekst heen en terug
const b = await PF.proefBeslis(kv, { site: 'kadolyvl', ctx: 'i' });
ok(b.ok && b.aan && /^[0-9a-f]{12}$/.test(b.pid) && Object.keys(b.v).length === VL.VL_FAC.length, 'beslissing voor alle onderdelen');
ok(['a', 'b'].includes(b.v.menu) && b.v.menu !== 'c', 'uitdager met wacht wordt niet gekozen');
const pf = VL.pfVan(VL.pfNaar({ ...b }));
ok(pf && pf.pid === b.pid && pf.d === b.d && pf.r === b.r && JSON.stringify(pf.v) === JSON.stringify(b.v), 'pf heen en terug');
ok(VL.pfVan('xx') === null && VL.pfVan('0123456789ab.20261127.1.zzzz').v.menu === undefined, 'onzin-pf geeft niets');

// keten van één bezoeker: zie op de site, tik, kies, open, deel, familie, geef, besteld
const ev = (e, x) => PF.proefEv(kv, Object.assign({ site: 'kadolyvl', pid: b.pid, d: b.d, r: b.r, e, c: 'i' }, x || {}));
ok((await ev('tik')).niet === 'niets gezien', 'stap zonder zie telt niet');
await ev('zie', { v: { menu: b.v.menu, vkaart: b.v.vkaart } });
for (const e of ['tik', 'kies', 'open']) await ev(e);
await ev('zie', { v: { kop: b.v.kop, deel: b.v.deel } });
for (const e of ['deel', 'fam', 'geef', 'besteld']) await ev(e);
const st = await PF.proefStand(kv, 'kadolyvl');
const vk = st.factoren.find(f => f.id === 'vkaart').versies.find(v => v.id === b.v.vkaart);
ok(vk.gezien === 1 && vk.waarde === 100 && vk.stappen.besteld === 1 && vk.stappen.tik === 1, 'kaart op de voorpagina krijgt de hele keten tot besteld');
const kp = st.factoren.find(f => f.id === 'kop').versies.find(v => v.id === b.v.kop);
ok(kp.gezien === 1 && kp.stappen.tik === 0 && kp.stappen.deel === 1, 'kop van de maakpagina telt pas vanaf zijn eigen zie');

// stand uit de tellers
const d8 = new Date().toISOString().slice(0, 10).replace(/-/g, '');
await kv.incrMany([['c:sh-d' + d8 + '-vl-open', 60], ['c:sh-d' + d8 + '-vl-open-home', 4], ['c:sh-d' + d8 + '-vl-b-kies', 22], ['c:sh-d' + d8 + '-vl-zie', 3], ['c:sh-d' + d8 + '-vl-omzet', 2495], ['c:sh-d' + d8 + '-vl-besteld', 1]]);
const s = await L.vlStand(kv, 7);
ok(s.maakpagina.geopend === 60 && s.naarLijst.voorpagina === 4 && s.familie.omzet === 24.95, 'stand telt per dag en in totaal');
const tx = L.vlTekst(s, st);
ok(/Vanaf kadoly.com naar de lijst: 4 \(voorpagina 4\)/.test(tx) && !/ 0 /.test(tx.split('Lerend')[0]) && /€ 24,95/.test(tx), 'tekst zonder nullen, met omzet');

// lek: 22 kozen een cadeau, niemand verstuurde
const r1 = await L.vlRonde(kv, { droog: true });
ok(r1.lek.some(x => /niemand verstuurde/.test(x)), 'lek gevonden: niemand verstuurt');

// winnaar vastzetten en uitdager aanzetten
const cfg = JSON.parse(JSON.stringify(await PF.leesProef(kv, 'kadolyvl', true)));
const tk = 'mm:pf:kadolyvl:1';
await kv.raw(['HSET', tk, 'menu|a|i|n', '400', 'menu|a|i|s', '400', 'menu|a|i|q', '400', 'menu|b|i|n', '400', 'menu|b|i|s', '2', 'menu|b|i|q', '2']);
const r2 = await L.vlRonde(kv, { droog: true });
ok(r2.gedaan.some(x => /Naam in het menu.*a wint, nieuwe uitdager c/.test(x)), 'droog: winnaar a en uitdager c gemeld');
ok(JSON.stringify((await PF.leesProef(kv, 'kadolyvl', true)).factoren) === JSON.stringify(cfg.factoren), 'droog verandert niets');
await kv.raw(['DEL', 'kd:vl:taak:' + new Date().toISOString().slice(0, 10)]);
const r3 = await L.vlRonde(kv, {});
const m2 = (await PF.leesProef(kv, 'kadolyvl', true)).factoren.find(f => f.id === 'menu');
ok(m2.varianten.find(v => v.id === 'b').uit && !m2.varianten.find(v => v.id === 'c').uit && !m2.varianten.find(v => v.id === 'a').uit, 'echt: b uit, a blijft, c aan');
const b2 = await PF.proefBeslis(kv, { site: 'kadolyvl', ctx: 'i' }); ok(['a', 'c'].includes(b2.v.menu), 'nieuwe beslissing kiest uit a en c');
const log = await kv.raw(['LRANGE', 'mm:handover:log', '0', '0']); ok(/kadoly-verlanglijst/.test(String(log[0])) && /Lerend/.test(String(log[0])), 'werklogregel geschreven');
console.log(process.exitCode ? 'NIET GESLAAGD' : 'alles geslaagd'); process.exit(process.exitCode || 0);
