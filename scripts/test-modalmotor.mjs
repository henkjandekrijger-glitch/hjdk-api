// Test van de lerende modal en antwoordmotor (lib/modalmotor.js, lib/modal.js; 25 nov 2026). Draait tegen een eigen, lege Redis:
// KV_REDIS_URL uit de omgeving als die naar localhost wijst, anders start hij zelf redis-server op poort 6391 (en slaat over als die er niet is).
// Geen echte mail, geen AI, geen netwerk: fetch naar Resend wordt hier opgevangen.  node scripts/test-modalmotor.mjs
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
let srv = null;
if (!/127\.0\.0\.1|localhost/.test(process.env.KV_REDIS_URL || '')) {
  if (spawnSync('which', ['redis-server']).status !== 0) { console.log('overgeslagen: geen redis-server'); process.exit(0); }
  srv = spawn('redis-server', ['--port', '6391', '--save', '', '--appendonly', 'no'], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 400));
  process.env.KV_REDIS_URL = 'redis://127.0.0.1:6391';
}
const mails = [], echteFetch = globalThis.fetch;
globalThis.fetch = async (u, o = {}) => { u = String(u);
  if (u.startsWith('https://api.resend.com/emails')) { const b = JSON.parse(o.body); for (const m of [].concat(b)) mails.push(m); return { ok: true, status: 200, json: async () => ({ id: 'm' + mails.length }) }; }
  if (u.startsWith('https://opruimlus.vercel.app')) return { ok: false, status: 404, json: async () => ({}) };
  throw Error('geen netwerk in de test: ' + u); };
process.env.RESEND_API_KEY = 'test';
const { kv } = await import('../lib/db.js'); await kv.raw(['FLUSHDB']);
const MT = await import('../lib/modalmotor.js'), M = await import('../lib/modal.js');
let fout = 0; const ok = (naam, f) => Promise.resolve().then(f).then(() => console.log('ok   ' + naam), e => { fout++; console.log('FOUT ' + naam + ': ' + (e && e.message)); });
const cfg = await MT.project('kadoly');
await kv.set(cfg.klaarSleutel, 1);
await kv.set('hjdk:shop:cat', { items: [{ id: 'oc_1', t: 'Houten naambord gegraveerd met naam', p: 20, vk: 4.95, lt: 4, vr: true, l: Date.now() }, { id: 'oc_2', t: 'Glazen vaas', p: 15, vk: 4.95, lt: 3, vr: true, l: Date.now() - 30 * 864e5 }] });

await ok('modal-sjablonen zijn geldig en gaan naar kv', async () => { const r = await MT.zetModals('kadoly'); assert.ok(r.ok, JSON.stringify(r)); const m = await M.leesModal(kv, 'kadolygids', true);
  assert.equal(m.controle, 0.1); assert.ok(m.zoekRustig); assert.ok(m.armen.filter(a => a.soort === 'email').length >= 5, 'minstens 5 e-mailbeloftes'); assert.ok(m.armen.some(a => a.soort === 'gids') && m.armen.some(a => a.soort === 'chat'));
  for (const a of m.armen) if (a.stijl) assert.fail('stijl per arm'); for (const k of ['knop', 'tekst', 'zacht', 'rand']) assert.equal(m.stijl[k], '#000000', 'zwart-wit: ' + k); });
await ok('verboden woorden: gratis cadeau alleen in de spaarkaart-arm', async () => {
  const basis = { site: 'tst', domeinen: ['kadoly.com'], armen: [{ id: 'geen', soort: 'geen', wie: 'alle' }] };
  assert.ok(M.checkModal({ ...basis, armen: basis.armen.concat([{ id: 'a', soort: 'email', doel: 'kadoly', belofte: 'spaarkaart', titel: 'Je eerste cadeau gratis', tekst: 'gratis cadeau bij 5 zegels', knop: 'Ja' }]) }).ok);
  assert.ok(!M.checkModal({ ...basis, armen: basis.armen.concat([{ id: 'a', soort: 'email', doel: 'kadoly', belofte: 'weekbrief', titel: 'gratis cadeau', knop: 'Ja' }]) }).ok);
  assert.ok(!M.checkModal({ ...basis, armen: basis.armen.concat([{ id: 'a', soort: 'email', doel: 'kadoly', belofte: 'spaarkaart', titel: 'Laatste kans', knop: 'Ja' }]) }).ok); });
await ok('beloftes: gratis verzending en advies pas als ze waar zijn', async () => { const w = await MT.waarStand(kv); assert.equal(w.verzending, false); assert.equal(w.advies, false); assert.equal(w.spaarkaart, true); assert.equal(w.weekbrief, true); assert.equal(w.naam, true);
  await kv.set('mm:motor:kadoly:waar:verzending', 1); assert.equal((await MT.waarStand(kv)).verzending, true); await kv.set('mm:motor:kadoly:waar:verzending', 0); });
let besl = null;
await ok('beslissing: controlegroep, arm, vorm zonder afdekken uit Google, factoren', async () => {
  let ctrl = 0, mails0 = 0, over = 0, metFx = 0; const ids = new Set();
  for (let i = 0; i < 300; i++) { const pid = (i.toString(16) + 'a'.repeat(16)).slice(0, 16); const r = await M.modalBeslis(kv, { site: 'kadolygids', pid, mob: i % 2 === 0, ref: 'zoek', origin: 'https://gids.kadoly.com', pa: '/kerstcadeau', pt: 'gids', v: 1, uur: 12 });
    if (r.reden === 'controlegroep' || (r.mid && !r.toon)) ctrl++; if (r.toon) { ids.add(r.arm.id); if (/^(midden|vol)$/.test(r.arm.vorm)) over++; if (r.arm.fx) metFx++; if (r.arm.soort === 'email') { mails0++; assert.notEqual(r.arm.id, 'm-verz'); assert.notEqual(r.arm.id, 'm-advies'); } if (!besl && r.arm.soort === 'gids') besl = r; } }
  assert.ok(ctrl > 10 && ctrl < 60, 'controlegroep rond 10%: ' + ctrl); assert.equal(over, 0, 'uit Google nooit midden of vol'); assert.ok(metFx > 100); assert.ok(mails0 > 0); assert.ok(ids.has('gids') && ids.has('chat'), [...ids].join(',')); });
await ok('gids-arm toont passende gidsen, chat een voorbeeldvraag', async () => {
  assert.ok(besl && besl.arm.gidsen && besl.arm.gidsen.length >= 1, JSON.stringify(besl && besl.arm));
  assert.ok(!('beeld' in (besl.arm.fx || {})), 'geen beeldfactor zonder beeld');
  const g = await MT.gidsenVoor('kadoly', { pa: '/kerstcadeau' }); assert.ok(g.every(x => !/\/kerstcadeau\?/.test(x.url)) && g.length === 3, JSON.stringify(g));
  const t = await M.modalBeslis(kv, { site: 'kadolygids', pid: 'f'.repeat(16), test: 'chat', origin: 'https://gids.kadoly.com', pa: '/serviesset' }); assert.ok(t.arm.keuzes && t.arm.keuzes[0].vraag, JSON.stringify(t.arm.keuzes)); });
await ok('tellers per factor en leren (facLeer)', async () => {
  const m = await M.leesModal(kv, 'kadolygids', true); const st = await M.modalStand(kv, m, 1); assert.ok(st.factoren.grootte.reduce((s, x) => s + x.n, 0) > 50, JSON.stringify(st.factoren.grootte));
  const r = await M.modalLeer(kv, { droog: false }); const n = await M.leesModal(kv, 'kadolygids', true); assert.ok(n.facLeer && n.facLeer.grootte, JSON.stringify(r).slice(0, 200)); });
let tok = '';
await ok('aanmelden spaarkaart via de modal: bevestigmail met de belofte en de toestemming bewaard', async () => {
  const pid = 'e'.repeat(16); let r = null; for (let i = 0; i < 40 && !(r && r.arm && r.arm.id === 'm-spaar'); i++) { await kv.raw(['DEL', 'mm:mqc:kadolygids:' + pid]); r = await M.modalBeslis(kv, { site: 'kadolygids', pid, origin: 'https://gids.kadoly.com', pa: '/', v: 1, uur: 10 }); }
  assert.equal(r.arm.id, 'm-spaar'); await kv.raw(['HSET', 'mm:cid:' + r.mid, 't', Date.now() - 9000]);
  const mm = await M.modalMail(kv, { mid: r.mid, email: 'Lid@Voorbeeld.nl', voornaam: 'Anna', ipNet: 'x1' }); assert.ok(mm.ok && mm.bevestigen, JSON.stringify(mm));
  const b = mails.find(x => /Bevestig/.test(x.subject)); assert.ok(b && /3 zegels/.test(b.html), 'bevestigmail noemt de zegels'); tok = (b.html.match(/t=([a-f0-9]{48})/) || [])[1]; assert.ok(tok);
  const p = await MT.bevestigOpen('kadoly', tok); assert.equal(p.belofte, 'spaarkaart'); assert.ok(/zegels/i.test(p.toestemming)); assert.equal(p.naam, 'Anna'); });
await ok('bevestigen: 3 zegels echt vastgelegd, welkomstmail in 2 zinnen, bevestigd geteld', async () => {
  const s = await MT.bevestig('kadoly', tok); assert.ok(s && s.actief && s.vt && s.freq === 'week'); const sid = await kv.get('ss:em:' + (await import('node:crypto')).createHash('sha256').update('lid@voorbeeld.nl').digest('hex'));
  const m = await kv.get('ss:m:' + sid); assert.equal(m.zegels.length, 3); const SS = await import('../lib/samensparen.js'); assert.equal(SS.stand(m).opKaart, 3);
  const w = mails.find(x => /3 van de 5 zegels/.test(x.subject)); assert.ok(w, 'welkomstmail'); assert.ok(/test/.test(w.html) && /2 bestellingen/.test(w.html)); assert.ok(w.headers['List-Unsubscribe']);
  assert.ok(/\/nieuws\/voorkeur\?t=/.test(w.html), 'voorkeurlink in de mail');
  const nog = await MT.bevestig('kadoly', tok); assert.ok(nog.al); });
await ok('voorkeurencentrum: frequentie, onderwerpen, pauze, afmelden', async () => {
  const id = MT._test.idVan(cfg, 'lid@voorbeeld.nl'), s = await kv.get('gk:nb:e:' + id); const html = MT.voorkeurHtml(cfg, s, s.vt); assert.ok(/type="radio" name="freq" value="week" checked/.test(html) && /Afmelden met één klik/.test(html)); assert.ok(!/#[0-9a-f]{3,6}/i.test(MT.VOORKEUR_CSS.replace(/#(000000|ffffff|000|fff)\b/gi, '')), 'geen grijs');
  let r = await MT.voorkeurZet('kadoly', s.vt, { opslaan: '1', freq: 'maand', o: ['wonen', 'kerst'] }); assert.equal(r.s.freq, 'maand'); assert.deepEqual(r.s.onderwerpen, ['wonen', 'kerst']);
  assert.ok(MT.magMailen({ ...r.s, laatsteMail: Date.now() - 28 * 864e5 })); assert.ok(!MT.magMailen({ ...r.s, laatsteMail: Date.now() - 10 * 864e5 }));
  assert.ok(MT.wilOnderwerp(r.s, MT.gidsOnderwerpen({ slug: 'vaas-kiezen', h1: 'Vaas kiezen' }))); assert.ok(!MT.wilOnderwerp(r.s, MT.gidsOnderwerpen({ slug: 'cadeau-voor-haar', h1: 'Cadeau voor haar' })));
  r = await MT.voorkeurZet('kadoly', s.vt, { freq: 'pauze30' }); assert.ok(!MT.magMailen(r.s)); assert.ok(MT.magMailen(r.s, 'herinnering') === false);
  r = await MT.voorkeurZet('kadoly', s.vt, { freq: 'week' }); assert.ok(MT.magMailen(r.s));
  r = await MT.voorkeurZet('kadoly', s.vt, { af: '1' }); assert.ok(r.af); assert.equal((await kv.get('gk:nb:e:' + id)).actief, false);
  r = await MT.voorkeurZet('kadoly', s.vt, { aan: '1' }); assert.equal((await kv.get('gk:nb:e:' + id)).actief, true); });
await ok('dagronde: nieuw product met naam, volle spaarkaart', async () => {
  const id = MT._test.idVan(cfg, 'lid@voorbeeld.nl'), s = await kv.get('gk:nb:e:' + id); await MT.voorkeurZet('kadoly', s.vt, { opslaan: '1', freq: 'week', o: ['naam', 'spaarkaart'] });
  const m = await kv.get('ss:m:' + s.ss); m.zegels.push({ t: Date.now(), o: 'o1' }, { t: Date.now(), o: 'o2' }); await kv.set('ss:m:' + s.ss, m);
  const r = await MT.dagRonde('kadoly'); assert.equal(r.naam, 1, JSON.stringify(r)); assert.equal(r.spaarVol, 1); assert.ok(mails.some(x => /spaarkaart is vol/.test(x.subject) && (x.cc || []).includes('henkjan@kadoly.com')));
  const r2 = await MT.dagRonde('kadoly'); assert.equal(r2.spaarVol, 0); assert.equal(r2.naam, 0); });
await ok('antwoordmotor: vraag krijgt AI-antwoord met CC, klacht gemarkeerd, stop meldt af, dubbel niet', async () => {
  const n0 = mails.length, ai = async (c, x) => 'Hoi Anna,\n\nKijk eens naar https://gids.kadoly.com/vaas-kiezen.\n\nGroet, ' + c.antwoordNaam;
  const haal = async id => ({ from: 'Anna <lid@voorbeeld.nl>', to: ['antwoord@post.kadoly.com'], subject: id === 'k1' ? 'Re: mijn pakket is niet aangekomen' : id === 's1' ? 'stop' : 'Re: Welkom', text: id === 's1' ? 'stop\n\nOp 1 dec schreef Kadoly:\n> oud' : 'Ik zoek een vaas voor mijn moeder', headers: {} });
  const P = (id) => ({ type: 'email.received', data: { email_id: id, to: ['antwoord@post.kadoly.com'] } });
  let r = await MT.mailIn(P('v1'), { haal, ai }); assert.ok(r.ok && r.label === 'vraag' && r.ai, JSON.stringify(r)); const a = mails[n0]; assert.deepEqual(a.cc, ['henkjan@kadoly.com']); assert.ok(/vaas-kiezen/.test(a.html));
  r = await MT.mailIn(P('v1'), { haal, ai }); assert.equal(r.waarom, 'al-gedaan');
  r = await MT.mailIn(P('k1'), { haal, ai }); assert.equal(r.label, 'aandacht'); assert.ok(mails.some(x => /AANDACHT/.test(x.subject) && x.to[0] === 'henkjan@kadoly.com'));
  r = await MT.mailIn({ type: 'email.received', data: { email_id: 'x9', to: ['iets@wearemany.now'] } }, { haal, ai }); assert.ok(r.nietVoorMotor);
  r = await MT.mailIn(P('s1'), { haal, ai }); assert.equal(r.label, 'stop'); assert.equal((await kv.get('gk:nb:e:' + MT._test.idVan(cfg, 'lid@voorbeeld.nl'))).actief, false);
  const lg = await kv.raw(['LRANGE', 'mt:log:kadoly', 0, -1]); assert.ok(lg.length >= 3 && !lg.join(' ').includes('lid@voorbeeld.nl'), 'log zonder adres'); });
await ok('controle: stand meet en noemt lekken', async () => { const st = await MT.stand('kadoly', kv); assert.ok(st.ok && Array.isArray(st.lekken) && st.sites.length === 2); assert.ok(st.lekken.some(l => /ontvangen/i.test(l))); assert.ok(st.tellers7d.bevestigd >= 1); });
await ok('alle vormen en maten in beide sjablonen; xs en xl leren mee', async () => {
  for (const site of ['kadoly', 'kadolygids']) { const m = await M.leesModal(kv, site, true); assert.deepEqual(m.vormen, M.VORMEN, site + ': alle vormen'); assert.deepEqual(m.factoren.grootte, ['xs', 's', 'm', 'l', 'xl']); assert.ok(m.armen.some(a => a.id === 'm-push' && a.soort === 'push'), site + ': push-arm'); }
  const g = new Set(); for (let i = 0; i < 200; i++) { await kv.raw(['DEL', 'mm:mqc:kadolygids:qa' + String(i).padStart(15, '0')]); const r = await M.modalBeslis(kv, { site: 'kadolygids', q: 'a' + String(i).padStart(15, '0'), origin: 'https://gids.kadoly.com', pa: '/vaas-kiezen', pt: 'gids', v: 1, uur: 9 }); if (r.toon && r.arm.fx) g.add(r.arm.fx.grootte); }
  assert.ok(g.has('xs') && g.has('xl'), [...g].join(',')); });
await ok('nieuwe maat en vorm zonder cijfers krijgen evenveel kans als de geleerde beste', async () => {
  const m = await M.leesModal(kv, 'kadolygids', true); await kv.set('mm:modal:kadolygids', { ...(await kv.get('mm:modal:kadolygids')), facLeer: { grootte: { s: 90, m: 5, l: 5 } }, vormLeer: { m: { onder: 90, hoek: 5 }, d: { onder: 90, hoek: 5 } } }); await M.leesModal(kv, 'kadolygids', true);
  const t = {}; for (let i = 0; i < 300; i++) { const r = await M.modalBeslis(kv, { site: 'kadolygids', q: 'b' + String(i).padStart(15, '0'), origin: 'https://gids.kadoly.com', pa: '/', pt: 'home', v: 1, uur: 9 }); if (r.toon) { t['g' + r.arm.fx.grootte] = (t['g' + r.arm.fx.grootte] || 0) + 1; t[r.arm.vorm] = (t[r.arm.vorm] || 0) + 1; } }
  assert.ok(t.gxs > 25 && t.gxl > 25 && t.tab > 15 && t.midden > 15, JSON.stringify(t)); await kv.set('mm:modal:kadolygids', { ...(await kv.get('mm:modal:kadolygids')), facLeer: m.facLeer || {}, vormLeer: m.vormLeer || {} }); await M.leesModal(kv, 'kadolygids', true); });
await ok('controlegroep krijgt een schijnmoment (weg binnen 10 s eerlijk te vergelijken)', async () => {
  let c = null; for (let i = 0; i < 400 && !c; i++) { const r = await M.modalBeslis(kv, { site: 'kadolygids', q: 'c' + String(i).padStart(15, '0'), origin: 'https://gids.kadoly.com', pa: '/', pt: 'home', v: 1, uur: 9 }); if (r.mid && !r.toon) c = r; }
  assert.ok(c && c.schijn && c.arm.soort === 'geen' && /^(tijd|scroll|pag|stil|exit)/.test(c.arm.moment), JSON.stringify(c));
  assert.ok((await M.modalEv(kv, { mid: c.mid, e: 'schijn' })).ok); assert.ok((await M.modalEv(kv, { mid: c.mid, e: 'weg10' })).ok); });
await ok('push met één klik: alleen waar het kan, bewaard met belofte en toestemming, telt als bevestigde aanmelding', async () => {
  const zoek = async (extra) => { for (let i = 0; i < 800; i++) { const r = await M.modalBeslis(kv, { site: 'kadolygids', q: (extra.k + 'e' + String(i)).padStart(16, '0'), ...extra, pa: '/vaas-kiezen', pt: 'gids', v: 1, uur: 9 }); if (r.toon && r.arm.soort === 'push') return r; } return null; };
  assert.equal(await zoek({ k: '1', origin: 'https://gids.kadoly.com' }), null, 'zonder pu (browser kan het niet) nooit push');
  assert.equal(await zoek({ k: '2', origin: 'https://kadoly.com', pu: true }), null, 'kadoly.com heeft nog geen service worker van ons');
  const r = await zoek({ k: '3', origin: 'https://gids.kadoly.com', pu: true }); assert.ok(r, 'push-arm op gids.kadoly.com'); assert.equal(r.arm.sw, '/kadoly-sw.js'); assert.ok(r.arm.vapid && r.arm.vapid.length > 40); assert.ok(!r.arm.project);
  assert.equal((await M.modalPush(kv, { mid: r.mid, endpoint: 'https://evil.example/x', ipNet: 'p1' })).ok, false, 'alleen echte push-diensten');
  const ep = 'https://fcm.googleapis.com/fcm/send/abc123'; const p = await M.modalPush(kv, { mid: r.mid, endpoint: ep, host: 'gids.kadoly.com', ipNet: 'p1' }); assert.ok(p.ok, JSON.stringify(p));
  const { subHash } = await import('../lib/push.js'); const rec = await kv.get('gk:nb:mp:' + subHash(ep)); assert.equal(rec.belofte, 'meldingen'); assert.ok(/meldingen/i.test(rec.toestemming)); assert.equal(rec.waar, 'modal-kadolygids-m-push');
  assert.ok((await kv.get('gk:nb:p:' + subHash(ep))).actief, 'op de bestaande meldingenlijst van de gidsen');
  const k = await kv.raw(['HGETALL', 'mm:cid:' + r.mid]); const o = {}; for (let i = 0; i < k.length; i += 2) o[k[i]] = k[i + 1]; assert.ok(o['u:aanmelding'] && o['mu:bevestigd'], 'aanmelding en bevestigd geteld');
  const st = await MT.stand('kadoly', kv); assert.equal(st.pushAbonnees, 1); });
await ok('niemand wegjagen: weg binnen 10 s per vorm en grootte, rem 7 dagen bij 80 tegen 80 en kans > 95%', async () => {
  const { FEAT } = M, D = new Date().toISOString().slice(0, 10), x = mob => FEAT.map((f, i) => (i === 0 ? 1 : f === 'mob' ? mob : 0)), cmds = [];
  let n = 0; const rij = (o, ev) => { const mid = (++n).toString(16).padStart(12, '0'); cmds.push(['RPUSH', 'mm:mdl:' + D, JSON.stringify({ mid, s: 'kadolygids', t: Date.now(), x: x(n % 2), pt: 'gids', ...o })]); for (const e of ev) cmds.push(['HSET', 'mm:mdv:' + D, mid + '|' + e, 1]); };
  for (let i = 0; i < 120; i++) rij({ a: 'geen', ty: 'geen', hoe: 'controle', sm: 'tijd:12' }, ['schijn', 'verder'].concat(i % 10 === 0 ? ['weg10'] : []));
  for (let i = 0; i < 120; i++) rij({ a: 'gids', ty: 'gids', hoe: 'model', m: 'tijd:12', f: 'vol', fx: 'grootte=m' }, ['toon', 'verder'].concat(i % 5 < 2 ? ['weg10'] : [])); // vol: 40% weg tegen 10%
  for (let i = 0; i < 120; i++) rij({ a: 'gids', ty: 'gids', hoe: 'model', m: 'tijd:12', f: 'hoek', fx: 'grootte=xl' }, ['toon'].concat(i % 10 === 0 ? ['weg10'] : [])); // xl: niet vaker weg, wel minder verder
  for (let i = 0; i < 120; i++) rij({ a: 'gids', ty: 'gids', hoe: 'model', m: 'tijd:12', f: 'onder', fx: 'grootte=s' }, ['toon', 'verder'].concat(i % 10 === 1 ? ['weg10'] : [])); // onder en s: zoals zonder modal
  await kv.raw(['DEL', 'mm:mdl:' + D, 'mm:mdv:' + D]); for (const c of cmds) await kv.raw(c); // alleen deze rijen: de beslissingen van de tests hierboven hebben geen browser (nooit 'verder')
  const m = await M.leesModal(kv, 'kadolygids', true), ws = M.wegStand(m, (await kv.raw(['LRANGE', 'mm:mdl:' + D, 0, -1])).map(s => JSON.parse(s)), new Map(Object.entries((await kv.raw(['HGETALL', 'mm:mdv:' + D])).reduce((o, v, i, a) => { if (i % 2 === 0) { const [mid, e] = v.split('|'); (o[mid] = o[mid] || new Set()).add(e); } return o; }, {}))));
  const v = ws.weg10.find(y => y.key === '#vol'); assert.ok(v.n >= 80 && v.nC >= 80 && v.kansHoger > 0.95, JSON.stringify(v)); assert.ok(ws.weg10.find(y => y.key === '#onder').kansHoger < 0.95);
  const L = M.wegLekken(ws).map(y => y.key); assert.ok(L.includes('#vol') && L.includes('%grootte=xl'), L.join(',')); assert.ok(!L.includes('#onder') && !L.includes('%grootte=s'), L.join(','));
  await M.modalLeer(kv, { droog: false }); const n2 = await M.leesModal(kv, 'kadolygids', true);
  assert.ok(n2.rem['#vol'] && /10 seconden/.test(n2.rem['#vol'].reden), JSON.stringify(n2.rem)); assert.ok(n2.rem['%grootte=xl'] && /verder/.test(n2.rem['%grootte=xl'].reden)); assert.ok(!n2.rem['#onder']); assert.ok(n2.wegMeting && n2.wegMeting.nControleSchijn >= 120);
  let vol = 0, xl = 0, getoond = 0, vormen = new Set(); for (let i = 0; i < 150; i++) { const r = await M.modalBeslis(kv, { site: 'kadolygids', q: 'd' + String(i).padStart(15, '0'), origin: 'https://gids.kadoly.com', pa: '/', pt: 'home', v: 1, uur: 9 }); if (r.toon) { getoond++; vormen.add(r.arm.vorm); if (r.arm.vorm === 'vol') vol++; if (r.arm.fx && r.arm.fx.grootte === 'xl') xl++; } }
  assert.ok(getoond > 80 && vormen.has('midden') && vormen.has('tab') && !vormen.has('hoek'), getoond + ' ' + [...vormen] + ' ' + Object.keys(n2.rem)); assert.equal(vol, 0, 'vol staat 7 dagen uit'); assert.equal(xl, 0, 'xl staat 7 dagen uit');
  const st = await MT.stand('kadoly', kv); assert.ok(st.lekken.some(l => /vorm vol: jaagt mensen weg: \d+ van de 100 gingen binnen 10 seconden weg/.test(l) && /drempel: 80 tegen 80/.test(l)), st.lekken.join(' | ')); });
await ok('kerstdag uit de catalogus ligt voor 23 december op een werkdag', async () => { const k = await MT.kerstDag(cfg); assert.ok(/^\d{4}-12-(0[1-9]|1\d|2[0-2])$/.test(k.dag), k.dag); const wd = new Date(k.dag + 'T12:00:00Z').getUTCDay(); assert.ok(wd >= 1 && wd <= 5); });
await ok('welkomstmail van een eigen lijst telt terug (mailopen, mailklik) zonder adres, eenmaal, alleen bekend adres', async () => {
  const { createHash } = await import('node:crypto'); const adres = 'lezer@voorbeeld.test', k = createHash('sha256').update(adres).digest('hex').slice(0, 24);
  assert.equal(M.mailMidSleutel(adres), 'mm:mailmid:' + k, 'zelfde sleutel als de site uitrekent');
  let c = null; for (let i = 0; i < 400 && !c; i++) { const r = await M.modalBeslis(kv, { site: 'kadolygids', q: 'd' + String(i).padStart(15, '0'), origin: 'https://gids.kadoly.com', pa: '/', pt: 'home', v: 1, uur: 9 }); if (r.mid) c = r; }
  assert.ok(c, 'beslissing'); await kv.raw(['SET', M.mailMidSleutel(adres), c.mid]);
  assert.equal((await M.modalMailEv(kv, { k: '0'.repeat(24), e: 'mailopen' })).onbekend, true, 'onbekend adres geweigerd');
  assert.equal((await M.modalMailEv(kv, { k, e: 'open' })).ok, false, 'alleen de mailsoorten');
  assert.equal((await M.modalMailEv(kv, { k: 'xyz', e: 'mailopen' })).ok, false, 'k moet 24 hex zijn');
  const a = await M.modalMailEv(kv, { k, e: 'mailopen' }); assert.ok(a.ok && !a.dubbel); assert.ok((await M.modalMailEv(kv, { k, e: 'mailopen' })).dubbel, 'eenmaal per soort');
  assert.ok((await M.modalMailEv(kv, { k, e: 'mailklik' })).ok);
  const h = Object.fromEntries((await M.modalMailEv(kv, { k: '1'.repeat(24), e: 'mailklik' }), [])); const dag = new Date().toISOString().slice(0, 10), t = await kv.raw(['HGETALL', 'mm:md:' + dag]); assert.ok(JSON.stringify(t).includes('|mailklik'), 'teller staat in de dag');
  assert.equal((await M.modalEv(kv, { mid: c.mid, e: 'mailopen' })).ok, false, 'het openbare modalev kent ze niet (alleen modalmailev)'); });
globalThis.fetch = echteFetch; try { await kv.raw(['FLUSHDB']); } catch (e) {} if (srv) srv.kill();
console.log(fout ? fout + ' FOUT(EN)' : 'ALLES GOED'); process.exit(fout ? 1 : 0);
