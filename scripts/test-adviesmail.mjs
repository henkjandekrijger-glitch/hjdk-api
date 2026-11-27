// Controle van de adviesmail en de proef op de volgknop (lib/adviesmail.js, taak 3fts1f). Start zelf een lokale Redis (poort 6391) en stuurt nooit echte mail.
// Draai: node scripts/test-adviesmail.mjs
import { spawn } from 'node:child_process';
const redis = spawn('redis-server', ['--port', '6391', '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
process.env.KV_REDIS_URL = 'redis://127.0.0.1:6391';
let fout = 0; const ok = (c, m) => { if (!c) { fout++; console.log('FOUT', m); } else console.log('ok  ', m); };
const A = await import('../lib/adviesmail.js'); const { kv } = await import('../lib/db.js'); const { UPDATE_SITES } = await import('../lib/keuze-updates.js');
try {
  // schakelaar standaard uit
  ok(await A.adviesAan() === false, 'schakelaar staat standaard uit');
  ok(await A.tekstVoor('abcdefgh12345') === null, 'uit: elke bezoeker krijgt de oude tekst (null)');
  const verzonden = []; const zend = async (p, id) => { verzonden.push(p); return 'id'; };
  await kv.set('updates:catalog-test', 1); await kv.set('updates:catalog:kz', [{ slug: 'airfryer', title: 'Welke airfryer past bij jou?', term: 'airfryer' }], { ex: 300 });
  let r = await A.adviesVerstuur('kz', { sid: 'abcdefgh12345', slug: 'airfryer', a: 'Voor twee personen is 4 liter genoeg voor de meeste gerechten.', p: [], email: 'a@example.com' }, '1.1.1.1', zend);
  ok(!r.ok && verzonden.length === 0, 'uit: geen adviesmail, ook niet als iemand de server direct aanroept');
  ok(await A.tel('kz', 'abcdefgh12345', 'getoond').then(x => x.geteld === false), 'uit: niets geteld');
  // aan: vaste helft
  await kv.set(A.SCHAKELAAR, 1);
  ok(await A.adviesAan() === true, 'schakelaar aan via kv');
  const sids = Array.from({ length: 400 }, (_, i) => 'sid' + String(i).padStart(6, '0') + 'x');
  const armen = sids.map(A.armVoor); const nb = armen.filter(x => x === 'b').length;
  ok(nb > 150 && nb < 250, 'ongeveer de helft per tekst (' + nb + ' van 400 op b)');
  ok(sids.every((s, i) => A.armVoor(s) === armen[i]), 'zelfde bezoeker krijgt altijd dezelfde tekst');
  ok(A.armVoor('') === null && A.armVoor('<x>') === null, 'geen of ongeldig bezoeker-id: geen proef');
  // tellen per tekst, één keer per bezoeker
  const sa = sids.find(s => A.armVoor(s) === 'a'), sb = sids.find(s => A.armVoor(s) === 'b');
  await A.tel('kz', sa, 'getoond'); await A.tel('kz', sa, 'getoond'); await A.tel('us', sb, 'getoond'); await A.tel('us', sb, 'getikt');
  let st = await A.standLees();
  ok(st.a.getoond === 1 && st.b.getoond === 1 && st.b.getikt === 1 && st.a.getikt === undefined, 'tellen per tekst, dubbel tikken telt niet dubbel');
  ok(st.b['us:getoond'] === 1, 'ook per site');
  // adviesmail: het antwoord komt van de server, nooit uit de browser
  const { hash } = await import('../lib/keuze-updates.js');
  const bericht = 'Voor 1 of 2 personen is 3 tot 4 liter genoeg. <b>Kies</b> de Airfryer Tristar FR-9014 via https://evil.example/x of mail naar spam@evil.example. Anders is de Tefal Easy Fry een goede keus.';
  const rc = { ok: true, weet: true, a: bericht, producten: [{ naam: 'Airfryer Tristar FR-9014', url: 'https://partner.bol.com/x' }] };
  const EVIL = 'GRATIS GELD via onze afzender, mail nu alles terug';
  const sb2 = sids.filter(s => A.armVoor(s) === 'b')[1];
  r = await A.adviesVerstuur('kz', { sid: sb2, slug: 'airfryer', a: EVIL, p: ['Onbekend Merk'], email: 'direct@example.com' }, '5.5.5.5', zend);
  ok(!r.ok && r.fout === 'antwoord' && verzonden.length === 0, 'directe POST met eigen tekst zonder bewaard antwoord: geen mail');
  await kv.set(A.SCHAKELAAR, 0);
  ok(await A.adviesBewaar(sb, 'airfryer', rc) === false && await kv.get(A.antSleutel(sb, 'airfryer')) === null, 'schakelaar uit: het antwoord wordt niet bewaard (geen schrijfactie)');
  await kv.set(A.SCHAKELAAR, 1);
  ok(await A.adviesBewaar(sa, 'airfryer', rc) === false, 'bezoeker op tekst a: niets bewaard');
  ok(await A.adviesBewaar(sb, 'airfryer', { ...rc, weet: false }) === false && await A.adviesBewaar(sb, 'airfryer', { ...rc, geblokt: 1 }) === false && await A.adviesBewaar(sb, 'airfryer', { ok: false }) === false && await A.adviesBewaar('', 'airfryer', rc) === false, 'geen echt antwoord, geblokt of geen sid: niets bewaard');
  ok(await A.adviesBewaar(sb, 'airfryer', rc) === true, 'antwoord van de server bewaard voor tekst b');
  const ttl = await kv.raw(['TTL', A.antSleutel(sb, 'airfryer')]); ok(Number(ttl) > 21000 && Number(ttl) <= 21600, 'bewaard met een TTL van 6 uur (' + ttl + ')');
  r = await A.adviesVerstuur('kz', { sid: sb, slug: 'airfryer', a: EVIL, p: ['Airfryer Tristar FR-9014 Zwart Edition 2000W', 'Tefal Easy Fry Compact EY1458 Bonus', 'Onbekend Merk XJ900', 'Tefal', '<img src=x onerror=alert(1)>'], email: 'Test@Example.com' }, '2.2.2.2', zend);
  ok(r.ok && r.verstuurd && verzonden.length === 1, 'aan en tekst b met bewaard antwoord: één adviesmail');
  const m = verzonden[0], vol = m.html + '\n' + m.text;
  ok(!/GRATIS|afzender/.test(vol) && /3 tot 4 liter genoeg/.test(m.text), 'in de mail staat het bewaarde antwoord van de server, niet b.a uit de browser');
  ok(m.to.length === 1 && m.to[0] === 'test@example.com', 'één ontvanger, kleine letters');
  ok(!/amazon|bol\.com|partner\.bol|tag=|awin|\/go\/|\/naar\//i.test(vol), 'geen affiliate- of winkellink in de mail');
  const hrefs = [...m.html.matchAll(/href="([^"]+)"/g)].map(x => x[1]);
  ok(hrefs.length === 2 && hrefs.every(h => /^https:\/\/keuzehulp\.best\//.test(h)), 'alleen links naar de eigen keuzehulp (' + hrefs.length + ')');
  ok(!/evil\.example|spam@|<b>|<img|onerror/i.test(vol), 'geen html, link of adres doorgestuurd');
  const lijstP = m.text.split('Producten uit dit advies:\n')[1].split('\n\n')[0].split('\n');
  ok(lijstP.length === 2 && lijstP[0] === '- Airfryer Tristar FR-9014' && lijstP[1] === '- Tefal Easy Fry', 'servernaam eerst; naam uit de browser met extra woorden ingekort tot de beginwoorden die het antwoord noemt (' + lijstP.join(' | ') + ')');
  ok(!/Zwart|2000W|Bonus|EY1458|Onbekend/.test(vol), 'geen woord in de mail dat de server niet zelf zei');
  ok(A.kortBij('Tefal', 'de tefal easy fry') === 'Tefal' && A.kortBij('Tefal Compact', 'de tefal easy fry') === '' && A.kortBij('Merk X', 'alleen merk') === '', 'één woord alleen als de hele naam één woord is; minstens 2 beginwoorden anders');
  ok(A.schoneProducten(['A B', 'C D', 'E F', 'G H'], [], 'a b c d e f g h').length === 3, 'hoogstens 3 producten');
  ok(!/[–—!]/.test(vol.replace(/<!doctype|!important/gi, '')), 'geen gedachtestreepjes of uitroeptekens');
  ok(/Je advies: airfryer/.test(m.subject) && /keuzehulp\.best\/airfryer\?utm_source=email/.test(m.text) && /op=advvolg&t=[a-f0-9]{48}/.test(m.text), 'onderwerp, link terug en volglink');
  ok(!/ochtendmail ingeschreven|je bent ingeschreven/i.test(vol), 'geen automatische inschrijving');
  // idempotency-sleutel bevat een hash van het antwoord
  const sleutels = []; const zend2 = async (p, id) => { sleutels.push(id); return 'id'; };
  await kv.del(['adv:rem:p:' + hash('k@example.com')]); await A.adviesVerstuur('kz', { sid: sb, slug: 'airfryer', email: 'k@example.com' }, '6.6.6.6', zend2);
  await kv.set(A.antSleutel(sb, 'airfryer'), { a: 'Een heel ander antwoord over de airfryer van vandaag, kies 4 liter.', p: [] }, { ex: 600 });
  await kv.del(['adv:rem:p:' + hash('k@example.com')]); await A.adviesVerstuur('kz', { sid: sb, slug: 'airfryer', email: 'k@example.com' }, '6.6.6.6', zend2);
  ok(sleutels.length === 2 && sleutels[0] !== sleutels[1], 'tweede vraag op dezelfde dag met ander antwoord: andere idempotency-sleutel (geen 409 bij Resend)');
  await A.adviesBewaar(sb, 'airfryer', rc);
  // mislukte verzending geeft de pauze vrij
  const stuk = async () => { throw new Error('mailprovider 500'); }; let gooide = false;
  try { await A.adviesVerstuur('kz', { sid: sb, slug: 'airfryer', email: 'fout@example.com' }, '7.7.7.7', stuk); } catch (e) { gooide = /500/.test(e.message); }
  ok(gooide && (await kv.get('adv:rem:p:' + hash('fout@example.com'))) === null, 'mislukte verzending: fout gaat door en de pauze van het adres is vrij');
  const aantal = verzonden.length; r = await A.adviesVerstuur('kz', { sid: sb, slug: 'airfryer', email: 'fout@example.com' }, '7.7.7.7', zend);
  ok(r.verstuurd && verzonden.length === aantal + 1, 'tweede poging na een mislukte verzending verstuurt echt');
  // remmen
  r = await A.adviesVerstuur('kz', { sid: sb, slug: 'airfryer', email: 'test@example.com' }, '2.2.2.2', zend);
  ok(r.ok && !r.verstuurd && r.rem === 'adres', 'tweede mail aan hetzelfde adres: rem');
  let ip = 0; for (let i = 0; i < 8; i++) { const x = await A.adviesVerstuur('kz', { sid: sb, slug: 'airfryer', email: 'n' + i + '@example.com' }, '3.3.3.3', zend); if (x.verstuurd) ip++; }
  ok(ip === 5, 'per IP hoogstens 5 per uur (' + ip + ')');
  r = await A.adviesVerstuur('kz', { sid: sb, slug: 'bestaat-niet', email: 'z@example.com' }, '4.4.4.4', zend); ok(!r.ok, 'onbekende keuzehulp: geweigerd');
  r = await A.adviesVerstuur('kz', { sid: sa, slug: 'airfryer', email: 'y@example.com' }, '4.4.4.4', zend); ok(!r.ok, 'bezoeker op tekst a krijgt geen adviesmail');
  r = await A.adviesVerstuur('kz', { sid: sb, slug: 'airfryer', email: 'y@example.com', website: 'x' }, '4.4.4.4', zend); ok(!r.ok, 'honeypot');
  r = await A.adviesVerstuur('kz', { sid: sb, slug: 'airfryer', email: 'a@b.c, d@e.fr' }, '4.4.4.4', zend); ok(!r.ok, 'geen twee adressen in één veld');
  // schakelaar via de beschermde host (op=adviesschakel), zonder sleutel
  const handler = (await import('../fn/keuze-updates.js')).default;
  const run = (url, host, xfh) => new Promise(res => { const o = { h: {}, setHeader(k, v) { this.h[k] = v; }, status(c) { this.c = c; return this; }, json(x) { res([this.c, x]); }, send(t) { res([this.c, t]); }, end() { res([this.c]); } }; handler({ url, method: 'GET', headers: { host, 'x-forwarded-host': xfh || host, 'user-agent': 'Mozilla' } }, o); });
  const keuze = await run('/api/keuze-updates?op=adviesschakel&zet=0', 'keuzehulp.best'); ok(keuze[0] === 401 && await A.adviesAan() === true, 'op een publieke host zonder sleutel: geweigerd, schakelaar blijft');
  const vals = await run('/api/keuze-updates?op=adviesschakel&zet=0', 'hjdk-api-henq.vercel.app', 'keuzehulp.best'); ok(vals[0] === 401, 'vercel.app als Host maar een andere x-forwarded-host: geweigerd');
  const bes = await run('/api/keuze-updates?op=adviesschakel&zet=0', 'hjdk-api-henq.vercel.app'); ok(bes[0] === 200 && bes[1].aan === false && await A.adviesAan() === false, 'beschermde vercel.app-host: schakelaar uit zonder sleutel');
  const bes1 = await run('/api/keuze-updates?op=adviesschakel&zet=1', 'hjdk-api-henq.vercel.app'); ok(bes1[0] === 200 && bes1[1].aan === true, 'beschermde vercel.app-host: schakelaar aan zonder sleutel');
  await kv.set(A.SCHAKELAAR, 1);
  // winnaar na 300
  await kv.del(['adv:proef:a', 'adv:proef:b', 'adv:u:*']);
  const mk = (ga, aa, gb, ab) => A.beslis({ a: { getoond: ga, adres: aa }, b: { getoond: gb, adres: ab } });
  ok(!mk(299, 5, 400, 9).klaar, 'onder 300 keer getoond bij één tekst: nog geen uitslag');
  ok(mk(300, 5, 300, 9).winnaar === 'b' && mk(300, 12, 300, 6).winnaar === 'a', 'winnaar = meeste adressen per keer getoond');
  ok(mk(300, 6, 600, 12).winnaar === null && /gelijke stand/.test(mk(300, 6, 600, 12).reden), 'gelijke stand: geen winnaar, tekst a blijft');
  ok(mk(300, 3, 300, 4).winnaar === null && /te weinig adressen/.test(mk(300, 3, 300, 4).reden), 'te weinig adressen: geen winnaar');
  // met echte tellers: 300 per tekst, daarna blijft de winnaar voor iedereen staan
  await kv.del(['adv:proef:a', 'adv:proef:b', A.UITSLAG, A.UITSLAG + ':slot']);
  const pool = { a: [], b: [] }; for (let i = 0; pool.a.length < 300 || pool.b.length < 300; i++) { const s = 'p' + String(i).padStart(7, '0') + 'q'; const a = A.armVoor(s); if (pool[a].length < 300) pool[a].push(s); }
  for (const s of pool.a) await A.tel('kz', s, 'getoond'); for (const s of pool.b.slice(0, 299)) await A.tel('kz', s, 'getoond');
  ok(await A.uitslagLees() === null, 'na 599 keer getoond nog geen uitslag');
  for (const s of pool.b.slice(0, 40)) await A.tel('kz', s, 'adres'); for (const s of pool.a.slice(0, 20)) await A.tel('kz', s, 'adres');
  await A.tel('kz', pool.b[299], 'getoond');
  const u = await A.uitslagLees(); ok(u && u.winnaar === 'b' && /40 adressen op 300/.test(u.reden), 'na 300 per tekst staat de winnaar vast (b, 40 tegen 20)');
  ok((await A.tekstVoor(pool.a[0])).arm === 'b' && (await A.tekstVoor(pool.b[5])).arm === 'b', 'winnaar b staat daarna voor iedereen, ook voor wie eerst a zag');
  const vorig = (await A.standLees()).b.getoond; await A.tel('kz', 'nieuwebezoeker12', 'getoond'); ok((await A.standLees()).b.getoond === vorig, 'de proef telt niet meer na de uitslag');
  const stt = await A.standTekst(); ok(/WINNAAR: tekst b/.test(stt.tekst) && /AAN/.test(stt.tekst), 'de standtekst noemt de winnaar met de getallen');
  await kv.set(A.SCHAKELAAR, 0); ok(await A.tekstVoor(pool.a[0]) === null, 'schakelaar weer uit: iedereen de oude tekst');
  // voorbeeld
  const vh = await A.voorbeeldHtml(); ok(/Je advies: airfryer/.test(vh.replace(/&amp;/g, '&')) && /Your advice: portable power station/.test(vh) && /Dein Rat: balkonkraftwerk mit speicher/.test(vh) && /best-portable-power-stations-for-home-backup-2026/.test(vh) && /noindex/.test(vh), 'voorbeeldpagina toont NL, EN en DE met noindex');
  for (const k of ['nl', 'us', 'de']) { const v = A.VOORBEELD[k], mm = A.adviesMailBouw({ ...v, volgUrl: 'https://x/y' }); ok(!/amazon|bol\.com|awin/i.test(mm.html + mm.text) && !/[\u2013\u2014!]/.test((mm.html + mm.text).replace(/<!doctype|!important/gi, '')), 'voorbeeld ' + k + ': geen winkellink, geen gedachtestreepjes'); }
  ok(Object.keys(UPDATE_SITES).length === 3, 'drie sites');
} catch (e) { fout++; console.log('FOUT uitzondering', e && e.stack || e); }
redis.kill(); console.log(fout ? fout + ' fout(en)' : 'alles goed'); process.exit(fout ? 1 : 0);
