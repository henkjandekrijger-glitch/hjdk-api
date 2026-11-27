// Test van de takenlijst, Henkjans beslissingen en gewoontes (lib/taken.js) en van het ene overzicht (lib/overzicht.js). Draai: node scripts/test-taken.mjs
import * as T from '../lib/taken.js';
import { overzichtHtml } from '../lib/overzicht.js';
const H = new Map(), S = new Map();
const kv = { get: async () => null, set: async () => {}, raw: async a => { const [c, k, f, v] = a; const h = H.get(k) || H.set(k, new Map()).get(k);
  if (c === 'HSET') { h.set(f, v); return 1; } if (c === 'HGET') return h.get(f) ?? null; if (c === 'HDEL') return h.delete(f) ? 1 : 0; if (c === 'HGETALL') return [...h.entries()].flat();
  if (c === 'SET') { if (a.includes('NX') && S.has(k)) return null; S.set(k, f); return 'OK'; } if (c === 'DEL') return S.delete(k) ? 1 : 0; throw new Error('kv ' + c); } };
const ok = (c, n) => { if (!c) { console.log('FOUT', n); process.exitCode = 1; } };
const nu = Date.parse('2026-11-27T12:00:00Z'), uur = 36e5;
// taak van Henkjan: in de lijst, als besluit vastgelegd
let u = await T.zetTaken(kv, { taak: { tekst: 'Maak drie nieuwe advertenties voor Kadoly', project: 'kadoly', zwaarte: 'licht' } }, 'Henkjan', nu); ok(u.ok && u.taak, 'taak'); const id = u.taak;
ok(!(await T.zetTaken(kv, { taak: { tekst: 'x' } }, 'Henkjan', nu)).ok, 'taak te kort');
u = await T.zetTaken(kv, { taak: { tekst: 'Alleen voor account twee', account: 'claude-2' } }, 'kdp-chat', nu); const id2 = u.taak;
let s = await T.leesTaken(kv, nu); ok(s.taken.length === 2 && s.besluiten.length === 1 && s.besluiten[0].soort === 'taak', 'lees');
// pak: account 1 krijgt alleen wat voor hem mag, een tweede keer niets, account 2 de zijne
u = await T.zetTaken(kv, { pak: { account: 'claude-1', max: 3 } }, '', nu + 1); ok(u.taken.length === 1 && u.taken[0].id === id && u.taken[0].model === 'haiku', 'pak 1');
u = await T.zetTaken(kv, { pak: { account: 'claude-1' } }, '', nu + 2); ok(u.ok && u.taken.length === 0, 'pak leeg');
ok(!(await T.zetTaken(kv, { pak: { account: 'chatgpt' } }, '', nu)).ok, 'pak chatgpt');
u = await T.zetTaken(kv, { pak: { account: 'claude-2', max: 1, id: id2 } }, '', nu + 3); ok(u.taken.length === 1 && u.taken[0].id === id2, 'pak één');
// vraag aan Henkjan: iets om te bekijken zonder link wordt geweigerd
ok(!(await T.zetTaken(kv, { taakzet: { id, vraag: 'Ja op de drie advertenties?' } }, '', nu + uur)).ok, 'vraag zonder toon');
u = await T.zetTaken(kv, { taakzet: { id, vraag: 'Ja op de drie advertenties?', keuzes: ['Ja', 'Nee'], toon: 'https://voorbeeld.vercel.app/ads' } }, '', nu + uur); ok(u.status === 'jij', 'vraag');
u = await T.zetTaken(kv, { antwoord: { id, tekst: 'Ja' } }, 'Henkjan', nu + 3 * uur); ok(u.status === 'wacht', 'antwoord');
s = await T.leesTaken(kv, nu + 3 * uur); const b2 = s.besluiten.find(b => b.soort === 'antwoord'); ok(b2 && b2.wachtUur === 2 && b2.over.includes('advertenties'), 'besluit antwoord');
u = await T.zetTaken(kv, { pak: { account: 'claude-2' } }, '', nu + 4 * uur); ok(u.taken.some(x => x.id === id && x.antwoord === 'Ja'), 'pak met antwoord');
// overname: account 2 geeft geen teken van leven, account 1 neemt over na 90 minuten
u = await T.zetTaken(kv, { pak: { account: 'claude-1' } }, '', nu + 4 * uur + 60e3); ok(u.taken.length === 0, 'nog niet overnemen');
S.clear(); u = await T.zetTaken(kv, { pak: { account: 'claude-1' } }, '', nu + 6 * uur); ok(u.taken.some(x => x.id === id && x.overgenomen === 'claude-2'), 'overname');
// klaar: resultaat verplicht, besluit krijgt de uitkomst en de output
ok(!(await T.zetTaken(kv, { taakzet: { id, klaar: true } }, '', nu + 7 * uur)).ok, 'klaar zonder resultaat');
u = await T.zetTaken(kv, { taakzet: { id, klaar: true, resultaat: 'Drie advertenties staan klaar en lopen mee', link: 'https://voorbeeld.vercel.app/ads', output: 'abc123' } }, '', nu + 7 * uur); ok(u.status === 'klaar', 'klaar');
s = await T.leesTaken(kv, nu + 7 * uur); ok(s.besluiten.filter(b => b.taak === id).every(b => b.output === 'abc123' && b.klaarT), 'besluit uitkomst');
const d0 = { projecten: [{ id: 'kadoly', naam: 'Kadoly', output: { items: [{ id: 'abc123', intentie: 'meer kliks', oordeel: '2026-12-04', oordeelNu: { uitslag: 'mis', waarom: 'nu van 3 naar 2' } }] } }] };
ok(T.besluitStand(s, d0).filter(b => b.taak === id).every(b => b.uitslag === 'mis') && T.lessen(s, d0)[0].includes('1 mis') === false && T.lessen(s, d0)[0].includes('2 mis'), 'oordeel uit output');
// opruimen en ongedaan maken; klaar verdwijnt vanzelf na een dag
u = await T.zetTaken(kv, { weg: [id, 'out|x1', 'onzin'] }, 'Henkjan', nu + 8 * uur); ok(u.weg.length === 2, 'weg');
s = await T.leesTaken(kv, nu + 8 * uur); ok(s.taken.find(x => x.id === id).status === 'weg' && s.weg['out|x1'], 'weg gelezen');
u = await T.zetTaken(kv, { terug: [id, 'out|x1'] }, 'Henkjan', nu + 8 * uur); s = await T.leesTaken(kv, nu + 8 * uur); ok(s.taken.find(x => x.id === id).status === 'klaar' && !s.weg['out|x1'], 'terug');
s = await T.leesTaken(kv, nu + 40 * uur); ok(!s.taken.some(x => x.id === id), 'klaar na een dag weg');
// antwoord op een vraag van een chat: uit de stand, als besluit, en als taak verder (niet bij nee)
await kv.raw(['HSET', 'mm:dash:chats', 'nexy|nexy-chat', JSON.stringify({ t: new Date(nu).toISOString(), waar: 'Posts staan klaar', wacht: ['Ja op de posts', 'Ja of nee: budget omhoog'], volgende: 'plaatsen', link: '' })]);
u = await T.zetTaken(kv, { antwoord: { project: 'nexy', chat: 'nexy-chat', vraag: 'Ja op de posts', tekst: 'Ja' } }, 'Henkjan', nu + 5 * uur); ok(u.ok && u.taak, 'chatantwoord taak');
u = await T.zetTaken(kv, { antwoord: { project: 'nexy', chat: 'nexy-chat', vraag: 'Ja of nee: budget omhoog', tekst: 'Nee' } }, 'Henkjan', nu + 5 * uur); ok(u.ok && !u.taak, 'nee geen taak');
ok(!(await T.zetTaken(kv, { antwoord: { project: 'nexy', chat: 'nexy-chat', vraag: 'Ja op de posts', tekst: 'Ja' } }, 'Henkjan', nu)).ok, 'dubbel antwoord');
const st = JSON.parse(await kv.raw(['HGET', 'mm:dash:chats', 'nexy|nexy-chat'])); ok(st.wacht.length === 0 && st.beantwoord.length === 2, 'stand bijgewerkt');
// gewoonte: drie keer gevraagd binnen 14 dagen = daarna uit zichzelf; dezelfde chat binnen 6 uur telt één keer; uitzetten werkt
const dg = 864e5; let g = await T.telVraag(kv, { wat: 'Stand van de campagnes tonen', project: 'campagnes', bron: 'chat-a', citaat: 'hoe staan de campagnes' }, nu);
g = await T.telVraag(kv, { wat: 'stand van de campagnes tonen!', bron: 'chat-a' }, nu + uur); ok(g.keren === 1 && g.status === 'telt', 'zelfde bron telt één keer');
g = await T.telVraag(kv, { wat: 'Stand van de campagnes tonen', bron: 'chat-b' }, nu + dg); ok(g.keren === 2 && g.status === 'telt', 'twee');
g = await T.telVraag(kv, { gewoonte: g.gewoonte, wat: 'campagnes', bron: 'vangnet' }, nu + 2 * dg); ok(g.keren === 3 && g.status === 'proactief', 'drie = proactief');
u = await T.zetTaken(kv, { pak: { account: 'claude-1' } }, '', nu + 2 * dg + uur); const gt = u.taken.find(x => x.gewoonte === g.gewoonte); ok(gt && gt.bron === 'gewoonte' && /uit jezelf/.test(gt.tekst), 'gewoonte wordt taak');
await T.zetTaken(kv, { taakzet: { id: gt.id, klaar: true, resultaat: 'Campagnestand staat in je lijst' } }, '', nu + 2 * dg + 2 * uur);
u = await T.zetTaken(kv, { pak: { account: 'claude-1' } }, '', nu + 2 * dg + 5 * uur); ok(!u.taken.some(x => x.gewoonte === g.gewoonte), 'niet twee keer op een dag');
u = await T.zetTaken(kv, { pak: { account: 'claude-1' } }, '', nu + 3 * dg + 5 * uur); ok(u.taken.some(x => x.gewoonte === g.gewoonte), 'volgende dag weer');
u = await T.zetTaken(kv, { gewoonte: { id: g.gewoonte, uit: true } }, 'Henkjan', nu + 3 * dg + 6 * uur); ok(u.gewoonte.status === 'uit', 'uit');
g = await T.telVraag(kv, { gewoonte: g.gewoonte, bron: 'chat-c' }, nu + 4 * dg); ok(g.status === 'uit', 'uit blijft uit');
// vangnet meldt zich; werkwijze en opdrachten
ok((await T.zetTaken(kv, { vangnet: { account: 'claude-1', chats: 6, standen: 2 } }, '', nu)).ok, 'vangnet');
s = await T.leesTaken(kv, nu + 3 * dg + 6 * uur);
const tt = T.takenTekst(s, 'claude-1', d0); ok(/HARDE GRENZEN/.test(tt) && /"pak"/.test(tt) && /haiku/.test(tt), 'takenTekst'); ok(/recent_chats/.test(T.vangnetTekst(s, 'claude-1', d0)), 'vangnetTekst');
ok(/claude-2/.test(T.aanzetTekst('claude-2')) && T.oppakPrompt('claude-1').includes('"pak"') && T.oppakPrompt('claude-1', 'abc').includes('taak=abc'), 'opdrachten');
ok(T.isTaken({ taak: 'x' }) && !T.isTaken({ project: 'kdp', nu: 1 }), 'isTaken');
// het ene overzicht: rendert met taken, antwoordknoppen, opruimen en zonder gedachtestreepjes of lege tellers
await T.zetTaken(kv, { taak: { tekst: 'Wacht nog op een agent — met streepje' } }, 'Henkjan', nu + 3 * dg + 6 * uur);
await T.zetTaken(kv, { taakzet: { id: (await T.leesTaken(kv, nu + 3 * dg + 6 * uur)).taken.find(x => x.status === 'bezig').id, vraag: 'Mag dit door?', keuzes: ['Ja', 'Nee'] } }, '', nu + 3 * dg + 6 * uur);
s = await T.leesTaken(kv, nu + 3 * dg + 6 * uur);
const d = { gemaakt: new Date(nu + 3 * dg + 6 * uur).toISOString(), vandaag: '2026-11-30', taken: s, wacht: [{ id: 'kadoly', naam: 'Kadoly', chat: 'kadoly-chat', t: new Date(nu).toISOString(), tekst: 'Resend zit vol: zeg "weg" of "upgrade"', toon: 'https://voorbeeld.vercel.app/x' }], achter: [], opvallend: [], geld: { perMunt: [] }, agenda: [], archief: [],
  projecten: [{ id: 'kadoly', naam: 'Kadoly', wat: 'Cadeaus', pct: 20, nu: 3, doelgetal: 15, eenheid: 'aankopen', open: [{ d: '2026-11-20', t: 'Henkjan: ja op de mail' }], telaat: 1, chats: [], log: [], verder: 'https://claude.ai/new?q=x', output: { items: [{ id: 'o1', dag: '2026-11-30', wat: 'Nieuwe pagina', intentie: 'meer aankopen', t: new Date(nu + 3 * dg).toISOString(), wie: 'kadoly-chat' }] } }] };
const html = overzichtHtml(d, { ai: 'browser', melding: { tekst: '2 opgeruimd.', terug: ['a', 'b'] } });
ok(html.includes('Wat moet er gebeuren?') && html.includes('name="taak"') && html.includes('action="/dashboard"'), 'formulier');
ok(html.includes('data-s="jij"') && html.includes('data-s="wacht"') && html.includes('data-s="klaar"') && html.includes('>Upgrade<') && html.includes('>Weg<'), 'rijen en knoppen');
ok(html.includes('Ongedaan maken') && html.includes('alles wat klaar is') && html.includes('Bekijk het eerst') && html.includes('Geleerd van jou'), 'opruimen en geleerd');
ok(!/[—–]/.test(html) && !/>0 (bezig|wacht|klaar)/.test(html) && !/undefined|NaN|\[object/.test(html), 'geen streepjes, nullen of undefined');
ok(overzichtHtml({ gemaakt: new Date(nu).toISOString(), vandaag: '2026-11-27', projecten: [] }).includes('Overzicht'), 'leeg rendert');
console.log(process.exitCode ? 'taken: FOUT' : 'taken ok');
