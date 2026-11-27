// Test van de Adsfair-site (lib/adsfair.js): controle van het concept, vraag met voorbeeld in Henkjans lijst, alleen zijn Ja zet live, nee laat vallen, pagina's.
// Draai: node scripts/test-adsfair.mjs
import * as A from '../lib/adsfair.js';
import * as T from '../lib/taken.js';
const H = new Map(), S = new Map();
const kv = { get: async () => null, set: async () => {}, raw: async a => { const [c, k, f, v] = a; const h = H.get(k) || H.set(k, new Map()).get(k);
  if (c === 'HSET') { h.set(f, v); return 1; } if (c === 'HGET') return h.get(f) ?? null; if (c === 'HDEL') return h.delete(f) ? 1 : 0; if (c === 'HGETALL') return [...h.entries()].flat();
  if (c === 'SET') { if (a.includes('NX') && S.has(k)) return null; S.set(k, f); return 'OK'; } if (c === 'GET') return S.get(k) ?? null; if (c === 'DEL') return S.delete(k) ? 1 : 0; throw new Error('kv ' + c); } };
const ok = (c, n) => { if (!c) { console.log('FOUT', n); process.exitCode = 1; } };
const nu = Date.parse('2026-11-27T20:00:00Z'), HJ = { henkjan: true };
const live = [['Nexy', 'https://nexy.works'], ['Kadoly', 'https://kadoly.com'], ['curacao.day', 'https://curacao.day'], ['GoonFree', 'https://play.google.com/store/apps/details?id=x']].map(([naam, url]) => ({ naam, url, wat: 'Een regel over ' + naam + ' die lang genoeg is.' }));
const C = { kop: 'You and AI is live and Kadoly opens a new collection this week.', tekst: 'This week AdsFair launched a new daily service and made its shop and guides easier to find. The full list of what runs now stands below, and this page says every week what changed.', live };

// 1. controle
ok(A.check(C, null, nu).ok && A.check(C, null, nu).v.week === '2026-W48', 'concept goed, week vanzelf');
ok(!A.check(Object.assign({}, C, { kop: 'Kadoly — nieuw deze week, echt waar' }), null, nu).ok, 'gedachtestreepje geweigerd');
ok(/intern woord/.test(A.check(Object.assign({}, C, { tekst: C.tekst + ' Clickmind measures every click now on all of our sites.' }), null, nu).fout), 'intern woord geweigerd');
ok(!A.check(Object.assign({}, C, { updates: [{ project: 'Kadoly', tekst: 'Regels per site mogen niet meer', link: 'https://kadoly.com' }] }), null, nu).ok, 'geen regels per site meer');
ok(!A.check(Object.assign({}, C, { live: [live[0], live[1], { naam: 'X', wat: 'Een regel die lang genoeg is voor de lijst.', url: 'http://x.com' }] }), null, nu).ok, 'alleen https');
ok(!A.check(Object.assign({}, C, { live: undefined }), null, nu).ok && A.check(Object.assign({}, C, { live: undefined }), { live }, nu).ok, 'zonder live: de lijst van vorige week');

// 2. zonder goedgekeurde week: nog niets live, concept wordt een vraag met voorbeeld in zijn lijst
ok(!(await A.leesLive(kv)), 'nog niets live');
let u = await A.zetConcept(kv, C, 'test', nu); ok(u.ok && /^https:\/\/keuzehulp\.best\/api\/mm\/adsfair\?vorm=pagina&concept=[a-z0-9]{12}$/.test(u.voorbeeld), 'concept met voorbeeldlink');
let s = await T.leesTaken(kv, nu), x = s.taken.find(y => y.id === u.taak);
ok(x && x.status === 'jij' && x.soort === 'ja' && x.toon === u.voorbeeld && x.project === 'adsfair' && x.actie.concept === u.concept, 'vraag in zijn lijst: zijn ja, met voorbeeld');
const html = A.pagina((await A.leesConcept(kv)), { concept: 'test' });
ok(/noindex/.test(html) && /Voorbeeld, nog niet live/.test(html) && !/track\.js/.test(html), 'voorbeeld: noindex, banner, geen meting');

// 3. een agent kan niet live zetten; een antwoord zonder toestel telt niet
ok(!(await T.zetTaken(kv, { antwoord: { id: u.taak, tekst: 'Ja' } }, 'agent', nu)).ok && !(await A.leesLive(kv)), 'agent kan zijn ja niet geven');

// 4. commentaar gaat naar de oppakker, het concept blijft
u = await A.zetConcept(kv, C, 'test', nu + 1000); const tweede = u; s = await T.leesTaken(kv, nu);
ok(s.taken.filter(y => y.project === 'adsfair' && y.status === 'jij').length === 1, 'nieuw concept vervangt de oude vraag');
await T.zetTaken(kv, { antwoord: { id: tweede.taak, tekst: 'Zet Kadoly bovenaan' } }, 'Henkjan', nu + 2000, HJ);
s = await T.leesTaken(kv, nu); x = s.taken.find(y => y.id === tweede.taak); ok(x.status === 'wacht' && (await A.leesConcept(kv)).id === tweede.concept && !(await A.leesLive(kv)), 'commentaar: taak voor de oppakker, niets live');

// 5. zijn Ja zet live, archief en pagina's
u = await A.zetConcept(kv, C, 'test', nu + 3000);
await T.zetTaken(kv, { antwoord: { id: u.taak, tekst: 'Ja' } }, 'Henkjan', nu + 4000, HJ);
const L = await A.leesLive(kv); s = await T.leesTaken(kv, nu); x = s.taken.find(y => y.id === u.taak);
ok(L && L.week === '2026-W48' && L.besluit && !(await A.leesConcept(kv)) && x.status === 'klaar' && /Live op adsfair\.xyz/.test(x.resultaat), 'Ja: live, besluit erbij, concept weg, taak klaar');
ok(T.jaStand(s, L.besluit).telt === true, 'bewijs van zijn ja telt');
ok(s.taken.some(y => y.project === 'adsfair' && y.status === 'wacht' && y.tekst.includes(A.OMZET_DPL)), 'eerste Ja: taak om adsfair.xyz om te zetten');
const p = A.pagina(L, {}); ok(/Week 48 · 23 to 29 November 2026/.test(p) && p.includes('<p class="p">This week AdsFair launched') && /id="live"/.test(p) && p.includes('curacao.day') && p.includes('Google Play →') && !/[–—]/.test(p) && !/todayin/i.test(p), 'pagina: week, overzicht, geen streepjes of oude namen');
ok(/"@type":"FAQPage"/.test(p) && /canonical/.test(p) && /track\.js/.test(p), 'pagina: json-ld, canonical, meting');
ok(/## Live products/.test(A.llms(L)) && A.updatesPagina({ [L.week]: L }, L.live).includes('Weekly updates'), 'llms en archief');

// 6. nee laat het concept vallen
u = await A.zetConcept(kv, Object.assign({}, C, { week: '2026-W49' }), 'test', nu + 5000);
await T.zetTaken(kv, { antwoord: { id: u.taak, tekst: 'Nee' } }, 'Henkjan', nu + 6000, HJ);
ok(!(await A.leesConcept(kv)) && (await A.leesLive(kv)).week === '2026-W48', 'nee: concept weg, live blijft');
console.log(process.exitCode ? 'adsfair FOUT' : 'adsfair ok');
