// Test van de takenlijst (lib/taken.js): toestel, vraagpoort met mandaat A en B, stil akkoord, zelf besloten, gewoontes, en het ene overzicht (lib/overzicht.js).
// Draai: node scripts/test-taken.mjs
import * as T from '../lib/taken.js';
import { overzichtHtml } from '../lib/overzicht.js';
const H = new Map(), S = new Map();
const kv = { get: async () => null, set: async () => {}, raw: async a => { const [c, k, f, v] = a; const h = H.get(k) || H.set(k, new Map()).get(k);
  if (c === 'HSET') { h.set(f, v); return 1; } if (c === 'HGET') return h.get(f) ?? null; if (c === 'HDEL') return h.delete(f) ? 1 : 0; if (c === 'HGETALL') return [...h.entries()].flat();
  if (c === 'SET') { if (a.includes('NX') && S.has(k)) return null; S.set(k, f); return 'OK'; } if (c === 'GET') return S.get(k) ?? null; if (c === 'DEL') return S.delete(k) ? 1 : 0; throw new Error('kv ' + c); } };
const ok = (c, n) => { if (!c) { console.log('FOUT', n); process.exitCode = 1; } };
const nu = Date.parse('2026-11-27T12:00:00Z'), uur = 36e5, dg = 864e5, HJ = { henkjan: true };
const VR = { omkeerbaar: false, geld: true, advies: 'Ja: drie ads binnen budget, beste ad nu 2,1% klikratio', bijJa: 'ze gaan morgen live', bijNee: 'ze blijven concept' };

// 1. zijn ja is onvervalsbaar: zonder toestel geen antwoord, opruimen, gewoonte of terugdraaien
for (const b of [{ antwoord: { id: 'x', tekst: 'Ja' } }, { weg: ['x'] }, { terug: ['x'] }, { gewoonte: { id: 'x', aan: true } }, { terugdraai: 'x' }]) ok(!(await T.zetTaken(kv, b, 'Henkjan', nu)).ok, 'zonder toestel geweigerd: ' + Object.keys(b)[0]);
let u = await T.zetTaken(kv, { taak: { tekst: 'Maak drie nieuwe advertenties voor Kadoly', project: 'kadoly', zwaarte: 'licht' } }, 'Henkjan', nu, HJ); ok(u.ok && u.taak, 'taak'); const id = u.taak;
u = await T.zetTaken(kv, { taak: { tekst: 'Van een chat doorgegeven', van: 'henkjan' } }, 'kdp-chat', nu); let s = await T.leesTaken(kv, nu);
ok(s.taken.find(x => x.id === u.taak).via === 'chat' && s.besluiten.find(b => b.taak === u.taak).via === 'chat' && s.besluiten.find(b => b.taak === id).via === 'toestel', 'via toestel of chat');
await T.zetTaken(kv, { weg: [u.taak] }, 'Henkjan', nu, HJ);
// 2. toestel koppelen: code via Telegram, vijf pogingen, cookie-id
let verstuurd = ''; u = await T.koppelVraag(kv, async t => { verstuurd = t; return true; }, nu); ok(u.ok && /\d{6}/.test(verstuurd), 'code gestuurd');
ok(!(await T.koppelVraag(kv, async () => true, nu)).ok, 'niet twee codes vlak na elkaar');
const code = verstuurd.match(/\d{6}/)[0]; ok(!(await T.koppelCode(kv, '000000')).ok, 'foute code');
u = await T.koppelCode(kv, code, 'iPhone'); ok(u.ok && T.geldigToestel(u.id) && await T.toestelOk(kv, u.id) && !(await T.toestelOk(kv, 'f'.repeat(36))), 'gekoppeld');
ok(!(await T.koppelCode(kv, code)).ok, 'code maar één keer');
// 3. pak en vraagpoort
u = await T.zetTaken(kv, { pak: { account: 'claude-1', max: 3 } }, '', nu + 1); ok(u.taken.length === 1 && u.taken[0].model === 'haiku', 'pak');
ok(!(await T.zetTaken(kv, { taakzet: { id, vraag: 'Mogen de drie advertenties aan?' } }, '', nu + uur)).ok, 'vraag zonder advies geweigerd');
ok(!(await T.zetTaken(kv, { taakzet: Object.assign({ id, vraag: 'Mogen de drie advertenties aan?' }, VR) }, '', nu + uur)).ok, 'iets te bekijken zonder toon geweigerd');
u = await T.zetTaken(kv, { taakzet: { id, vraag: 'Zal ik de oude kopie van de campagne opruimen?', omkeerbaar: true, geld: false, zichtbaar: false, advies: 'Ja, hij loopt al 3 dagen niet', bijJa: 'kopie weg', bijNee: 'blijft staan' } }, '', nu + uur);
ok(!u.ok && u.mandaat === 'A' && /beslis zelf/.test(u.fout), 'mandaat A: geen vraag');
u = await T.zetTaken(kv, { taakzet: Object.assign({ id, vraag: 'Mogen de drie advertenties aan?', toon: 'https://voorbeeld.vercel.app/ads' }, VR) }, '', nu + uur); ok(u.ok && u.soort === 'ja', 'vraag met jouw ja');
u = await T.zetTaken(kv, { antwoord: { id, tekst: 'Ja' } }, 'Henkjan', nu + 3 * uur, HJ); ok(u.status === 'wacht', 'antwoord via toestel');
s = await T.leesTaken(kv, nu + 3 * uur); const b2 = s.besluiten.find(b => b.soort === 'antwoord' && b.taak === id); ok(b2 && b2.wachtUur === 2 && b2.via === 'toestel', 'besluit antwoord');
ok(T.jaStand(s, b2.id).telt === true && T.jaStand(s, 'nope').ok === false, 'bewijs van zijn ja');
// 4. stil akkoord voor omkeerbaar met zichtbaar effect
u = await T.zetTaken(kv, { taak: { tekst: 'Nieuwe kop op de keuzehulp', project: 'keuzehulpen' } }, 'kz-chat', nu); const id3 = u.taak;
u = await T.zetTaken(kv, { taakzet: { id: id3, vraag: 'Zal ik de nieuwe kop op de keuzehulp zetten?', omkeerbaar: true, geld: false, zichtbaar: true, advies: 'Ja, de oude kop scoort 0,8% klikratio', bijJa: 'nieuwe kop live', bijNee: 'oude kop blijft', toon: 'https://voorbeeld.vercel.app/kop' } }, '', nu);
ok(u.ok && u.soort === 'stil' && Date.parse(u.stilT) === nu + 24 * uur, 'stil akkoord na 24 uur');
ok(await T.stilSweep(kv, nu + 23 * uur) === 0, 'nog niet na 23 uur');
ok(await T.stilSweep(kv, nu + 25 * uur) === 1, 'na 25 uur'); s = await T.leesTaken(kv, nu + 25 * uur);
const x3 = s.taken.find(x => x.id === id3), b3 = s.besluiten.find(b => b.taak === id3 && b.soort === 'stil'); ok(x3.status === 'wacht' && /stil akkoord/.test(x3.antwoord) && b3 && T.jaStand(s, b3.id).telt, 'stil ja telt');
// 5. quotum per project
for (let i = 0; i < 5; i++) { const t = await T.zetTaken(kv, { taak: { tekst: 'Vraag ' + i, project: 'nexy' } }, 'nexy-chat', nu); await T.zetTaken(kv, { taakzet: Object.assign({ id: t.taak, vraag: 'Budget omhoog voor proef ' + i + '?' }, VR) }, '', nu); }
const t6 = await T.zetTaken(kv, { taak: { tekst: 'Vraag 6', project: 'nexy' } }, 'nexy-chat', nu); u = await T.zetTaken(kv, { taakzet: Object.assign({ id: t6.taak, vraag: 'Nog een budgetvraag?' }, VR) }, '', nu); ok(!u.ok && /Bundel/.test(u.fout), 'quotum');
// 6. handeling: alleen hij
u = await T.zetTaken(kv, { taakzet: { id: t6.taak, vraag: 'Log in op het tweede Claude-account', handeling: true, advies: 'dan pakt dat account ook taken op' } }, '', nu); ok(!u.ok, 'quotum geldt ook voor handeling');
// 7. overname en klaar
S.clear(); u = await T.zetTaken(kv, { pak: { account: 'claude-2' } }, '', nu + 30 * uur); ok(u.taken.some(x => x.id === id && x.antwoord === 'Ja'), 'pak met antwoord');
ok(!(await T.zetTaken(kv, { taakzet: { id, klaar: true } }, '', nu + 31 * uur)).ok, 'klaar zonder resultaat');
u = await T.zetTaken(kv, { taakzet: { id, klaar: true, resultaat: 'Drie advertenties lopen', link: 'https://voorbeeld.vercel.app/ads', output: 'abc123' } }, '', nu + 31 * uur); ok(u.status === 'klaar', 'klaar');
s = await T.leesTaken(kv, nu + 31 * uur);
const d0 = { projecten: [{ id: 'kadoly', naam: 'Kadoly', output: { items: [{ id: 'abc123', intentie: 'meer kliks', oordeel: '2026-12-04', oordeelNu: { uitslag: 'mis', waarom: 'nu van 3 naar 2' } }] } }] };
ok(T.besluitStand(s, d0).filter(b => b.taak === id).every(b => b.uitslag === 'mis') && T.lessen(s, d0)[0].includes('2 mis'), 'oordeel uit output');
// 8. zelf besloten onder mandaat, terugdraaien door Henkjan
ok(!(await T.zetTaken(kv, { zelf: { wat: 'kort' } }, 'kz-chat', nu)).ok, 'zelf zonder waarom');
u = await T.zetTaken(kv, { zelf: { project: 'kdp', wat: 'Oude kopie van campagne 123 opgeruimd', waarom: 'omkeerbaar, gratis, niemand ziet het', terug: 'kopie terugzetten' } }, 'kdp-chat', nu + 32 * uur); const zb = u.besluit;
s = await T.leesTaken(kv, nu + 32 * uur); ok(T.besluitStand(s, d0).find(b => b.id === zb).uitslag === 'zelf' && T.lessen(s, d0).some(l => /zelf onder je mandaat/.test(l)), 'zelf besloten');
ok(!(await T.zetTaken(kv, { terugdraai: zb }, 'kdp-chat', nu)).ok, 'terugdraaien alleen Henkjan');
u = await T.zetTaken(kv, { terugdraai: zb }, 'Henkjan', nu + 33 * uur, HJ); s = await T.leesTaken(kv, nu + 33 * uur); ok(u.taak && s.besluiten.find(b => b.id === zb).teruggedraaid && /Draai terug/.test(s.taken.find(x => x.id === u.taak).tekst), 'teruggedraaid');
// 9. vragen uit een chatstand: poortChat, herzie, stil akkoord, antwoord via toestel
const oud = T.poortChat('Ja op de posts', {}, nu); ok(oud.tekst === 'Ja op de posts' && /Oud formaat/.test(oud.melding), 'oude string blijft');
ok(T.poortChat({ vraag: 'Oude kopie opruimen?', omkeerbaar: true, geld: false, zichtbaar: false, advies: 'ja, loopt niet meer', bijJa: 'weg', bijNee: 'blijft' }, {}, nu).weg, 'chatvraag onder mandaat A');
const pc = T.poortChat(Object.assign({ vraag: 'Mag de proef 10 dagen langer?' }, VR), {}, nu); ok(pc.meta.soort === 'ja' && pc.meta.eerst, 'chatvraag met poort');
ok(T.poortChat('Mag de proef 10 dagen langer?', { 'Mag de proef 10 dagen langer?': pc.meta }, nu + uur).meta.soort === 'ja', 'oude string houdt zijn velden');
await kv.raw(['HSET', 'mm:dash:chats', 'nexy|nexy-chat', JSON.stringify({ t: new Date(nu).toISOString(), waar: 'Posts staan klaar', wacht: ['Ja op de posts', 'Zet het oude concept weg', 'Nieuwe ondertitel op de pagina'], meta: {}, volgende: 'plaatsen', link: '' })]);
u = await T.zetTaken(kv, { herzie: { project: 'nexy', chat: 'nexy-chat', vraag: 'Zet het oude concept weg', omkeerbaar: true, geld: false, zichtbaar: false, advies: 'Ja, niemand gebruikt het', bijJa: 'weg', bijNee: 'blijft' } }, 'oppakker', nu); ok(u.mandaat === 'A' && u.taak, 'herzie: mandaat A wordt een taak');
u = await T.zetTaken(kv, { herzie: { project: 'nexy', chat: 'nexy-chat', vraag: 'Nieuwe ondertitel op de pagina', omkeerbaar: true, geld: false, zichtbaar: true, advies: 'Ja, korter en duidelijker', bijJa: 'live', bijNee: 'blijft', toon: 'https://voorbeeld.vercel.app/o' } }, 'oppakker', nu); ok(u.herzien === 'stil', 'herzie: stil akkoord');
u = await T.zetTaken(kv, { herzie: { project: 'nexy', chat: 'nexy-chat', vraag: 'Ja op de posts', omkeerbaar: true, geld: false, publiek: true, advies: 'Ja, op maat per platform', bijJa: 'ze gaan uit', bijNee: 'niets', toon: 'https://nexy.now/api/redactie?merk=nexy&vorm=voorraad' } }, 'oppakker', nu); ok(u.herzien === 'ja', 'herzie: nieuw publiek blijft jouw ja');
let st = JSON.parse(await kv.raw(['HGET', 'mm:dash:chats', 'nexy|nexy-chat'])); ok(st.wacht.length === 2 && st.afgedaan[0].door === 'mandaat A' && st.meta['Ja op de posts'].soort === 'ja', 'stand na herzie');
ok(await T.stilSweep(kv, nu + 25 * uur + 6e5) === 1, 'chatvraag stil akkoord'); st = JSON.parse(await kv.raw(['HGET', 'mm:dash:chats', 'nexy|nexy-chat'])); ok(st.wacht.length === 1 && st.beantwoord[0].via === 'stil', 'stil akkoord in de stand');
u = await T.zetTaken(kv, { antwoord: { project: 'nexy', chat: 'nexy-chat', vraag: 'Ja op de posts', tekst: 'Ja' } }, 'Henkjan', nu + 26 * uur, HJ); ok(u.ok && u.taak, 'chatantwoord wordt taak');
ok(!(await T.zetTaken(kv, { antwoord: { project: 'nexy', chat: 'nexy-chat', vraag: 'Ja op de posts', tekst: 'Ja' } }, 'Henkjan', nu + 26 * uur, HJ)).ok, 'dubbel antwoord');
// 10. gewoonte: na drie keer eerst een voorstel, pas na zijn ja uit zichzelf
let g = await T.telVraag(kv, { wat: 'Stand van de campagnes tonen', project: 'campagnes', bron: 'chat-a' }, nu);
g = await T.telVraag(kv, { wat: 'stand van de campagnes tonen!', bron: 'chat-a' }, nu + uur); ok(g.keren === 1, 'zelfde bron telt één keer');
g = await T.telVraag(kv, { wat: 'Stand van de campagnes tonen', bron: 'chat-b' }, nu + dg); g = await T.telVraag(kv, { gewoonte: g.gewoonte, bron: 'vangnet' }, nu + 2 * dg); ok(g.status === 'voorstel', 'drie = voorstel');
S.clear(); u = await T.zetTaken(kv, { pak: { account: 'claude-1' } }, '', nu + 2 * dg + uur); ok(!u.taken.some(x => x.gewoonte === g.gewoonte), 'voorstel loopt niet vanzelf');
ok(!(await T.zetTaken(kv, { antwoord: { gewoonte: g.gewoonte, tekst: 'Ja' } }, 'oppakker', nu)).ok, 'agent kan gewoonte niet aanzetten');
u = await T.zetTaken(kv, { antwoord: { gewoonte: g.gewoonte, tekst: 'Ja' } }, 'Henkjan', nu + 2 * dg + uur, HJ); ok(u.gewoonte.status === 'proactief', 'ja: voortaan zelf');
S.clear(); await T.zetTaken(kv, { pak: { account: 'claude-1' } }, '', nu + 2 * dg + 2 * uur); ok((await T.leesTaken(kv, nu + 2 * dg + 2 * uur)).taken.some(x => x.gewoonte === g.gewoonte && x.bron === 'gewoonte'), 'gewoonte wordt taak');
// 11. werkwijze, opdrachten en pagina
s = await T.leesTaken(kv, nu + 3 * dg);
const tt = T.takenTekst(s, 'claude-1', d0); ok(/Mandaat A/.test(tt) && /herzie/.test(tt) && /"zelf"/.test(tt) && /vorm=ja/.test(tt), 'werkwijze met mandaat'); ok(/vraagpoort/i.test(T.vangnetTekst(s, 'claude-1', d0)) && /Mandaat A/.test(T.poortTekst()), 'vangnet en poorttekst');
ok(T.oppakPrompt('claude-1').includes('"pak"') && /claude-2/.test(T.aanzetTekst('claude-2')), 'opdrachten');
const d = { gemaakt: new Date(nu + 3 * dg).toISOString(), vandaag: '2026-11-30', taken: s, wacht: [{ id: 'kadoly', naam: 'Kadoly', chat: 'kadoly-chat', t: new Date(nu).toISOString(), tekst: 'Resend zit vol: zeg "weg" of "upgrade"', toon: '', soort: '' }, { id: 'nexy', naam: 'Nexy', chat: 'nexy-chat', t: new Date(nu).toISOString(), tekst: 'Mag de proef 10 dagen langer?', advies: 'Ja, $0,06 per adres', bijJa: 'loopt door', bijNee: 'stopt', soort: 'stil', stilT: new Date(nu + 3 * dg + 5 * uur).toISOString(), keuzes: ['Ja', 'Nee'] }],
  achter: [], opvallend: [], geld: { perMunt: [] }, agenda: [], archief: [], projecten: [{ id: 'kadoly', naam: 'Kadoly', pct: 20, nu: 3, doelgetal: 15, eenheid: 'aankopen', open: [], chats: [], log: [], verder: 'https://claude.ai/new?q=x', output: { items: [] } }] };
let html = overzichtHtml(d, { ai: 'browser', toestel: false });
ok(html.includes('id="koppel"') && html.includes('name="koppel"') && html.includes('name="code"'), 'koppelblok zonder toestel');
html = overzichtHtml(d, { ai: 'browser', toestel: true, melding: { tekst: '2 opgeruimd.', terug: ['a', 'b'] } });
ok(!html.includes('id="koppel"') && html.includes('Advies:') && html.includes('Zeg je niets, dan gaat het advies') && html.includes('>Upgrade<') && html.includes('Ongedaan maken'), 'kaarten met advies en stil akkoord');
ok(html.indexOf('Resend zit vol') < html.indexOf('Mag de proef 10 dagen langer'), 'stil akkoord onderaan');
ok(!html.includes('/dashboard?doe=') && !/method="get"/.test(html) && !/[—–]/.test(html) && !/undefined|NaN|\[object/.test(html), 'alles POST, geen streepjes of undefined');
ok(overzichtHtml({ gemaakt: new Date(nu).toISOString(), vandaag: '2026-11-27', projecten: [] }).includes('Overzicht'), 'leeg rendert');
console.log(process.exitCode ? 'taken: FOUT' : 'taken ok');
