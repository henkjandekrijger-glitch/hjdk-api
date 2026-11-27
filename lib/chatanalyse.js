// Totale analyse van de lerende chat (27 nov 2026, Henkjan: "doe totale analyse van history van af begin en kom met verbeteringen").
// Leest alleen wat er al ligt: kz:chat:log (laatste 2.000 beurten, met antwoord en gesprek-id sinds 20 nov), kz:chat:open, kz:chat:d:<dag>
// (tellers per dag sinds de start op 16 nov), kz:chat:kost, kz:door:stijl2, de tafels, gk:chat (chat van gids.kadoly.com), iv:d:<dag> en kz:i100.
// Alleen via de beschermde host: /api/keuze-tools?tool=intentie&op=chatanalyse (tekst; &vorm=json voor de cijfers).
import { kv } from './db.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const paren = h => { if (!h) return {}; if (!Array.isArray(h)) return h; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[String(h[i])] = h[i + 1]; return o; };
const lijst = async (k, n) => ((await kv.raw(['LRANGE', k, '0', String(n - 1)]).catch(() => [])) || []).map(x => { try { return typeof x === 'string' ? JSON.parse(x) : x; } catch (e) { return null; } }).filter(Boolean);
const norm = v => String(v || '').toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
const kort = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const dagVan = t => new Date(N(t)).toISOString().slice(0, 10);
const START = '2026-11-16';

export async function chatAnalyse() {
  const nu = Date.now();
  const log = (await lijst('kz:chat:log', 2000)).reverse(); // oud naar nieuw
  const open = await lijst('kz:chat:open', 500);
  const gk = (await lijst('gk:chat', 2000)).reverse();

  // 1. tellers per dag sinds de start (ook van voor het log)
  const dagen = []; for (let t = Date.parse(START + 'T00:00:00Z'); t <= nu; t += 864e5) dagen.push(dagVan(t));
  const perDag = [];
  for (const d of dagen) {
    const h = paren(await kv.raw(['HGETALL', 'kz:chat:d:' + d]).catch(() => null)); const kost = N(await kv.raw(['HGET', 'kz:chat:kost', d]).catch(() => 0)) / 1e6;
    const som = {}; for (const [k, v] of Object.entries(h)) { const [site, veld] = k.split(':'); (som[veld] = som[veld] || {})[site] = N(v); }
    const tot = f => Object.values(som[f] || {}).reduce((a, b) => a + b, 0);
    const iv = paren(await kv.raw(['HGETALL', 'iv:d:' + d]).catch(() => null));
    const i100 = paren(await kv.raw(['HGETALL', 'kz:i100:d:' + d]).catch(() => null));
    perDag.push({ dag: d, vraag: tot('vraag'), open: tot('open'), reken: tot('reken'), samen: tot('samen'), bot: tot('bot'), onzin: tot('onzin'), mcp: tot('mcp'), perSite: som.vraag || {}, kostUsd: Math.round(kost * 100) / 100, intenties: Object.values(i100).reduce((a, b) => a + N(b), 0), volg: Object.fromEntries(Object.entries(iv).map(([k, v]) => [k, N(v)])) });
  }
  const i100tot = N(await kv.raw(['GET', 'kz:i100:tot']).catch(() => 0));

  // 2. beurten uit het log
  const rs = log.filter(r => r && r.t);
  const chatR = rs.filter(r => r.b !== 'reken');
  const soort = r => r.b === 'reken' ? 'reken' : r.b === 'mcp' ? 'mcp' : r.pad ? 'pill' : 'getypt';
  const sites = {};
  for (const r of rs) {
    const s = (sites[r.site] = sites[r.site] || { beurten: 0, getypt: 0, pill: 0, reken: 0, mcp: 0, weet: 0, fout: 0, door: 0, cache: 0, samen: 0, int2: 0, wat: 0, voorWie: 0, budget: 0, wanneer: 0 });
    s.beurten++; s[soort(r)]++; if (r.weet) s.weet++; if (r.f) s.fout++; if (r.p && r.p !== r.s) s.door++; if (r.c) s.cache++; if (r.samen) s.samen++;
    const i = r.i || {}; const vv = ['wat', 'voorWie', 'budget', 'wanneer'].filter(k => String(i[k] || '').trim()); for (const k of vv) s[k]++; if (vv.length >= 2) s.int2++;
  }
  const fouten = {}; for (const r of chatR) if (r.f) fouten[r.f] = (fouten[r.f] || 0) + 1;

  // 3. gesprekken: zelfde gesprek-id, site en pagina, hooguit 30 minuten tussen twee beurten
  const gesprekken = []; const laatst = {};
  for (const r of chatR) { if (!r.w) continue; const k = r.w + '|' + r.site + '|' + r.s; const g = laatst[k]; if (g && N(r.t) - g.eind <= 1800000) { g.rs.push(r); g.eind = N(r.t); } else { const ng = { site: r.site, slug: r.s, rs: [r], eind: N(r.t) }; gesprekken.push(ng); laatst[k] = ng; } }
  const diepte = { een: 0, twee: 0, drie: 0, vierplus: 0 }; for (const g of gesprekken) { const n = g.rs.length; diepte[n === 1 ? 'een' : n === 2 ? 'twee' : n === 3 ? 'drie' : 'vierplus']++; }
  const metId = chatR.filter(r => r.w).length;
  // doorpraten na het eerste antwoord, per stijl, per soort eerste beurt, en of het antwoord eindigt op een vraag
  const verder = {}; const zet = (k, door) => { (verder[k] = verder[k] || { n: 0, door: 0 }).n++; if (door) verder[k].door++; };
  for (const g of gesprekken) {
    const r = g.rs[0], door = g.rs.length > 1, a = String(r.a || '');
    zet('alles', door); zet('stijl ' + (r.st || '-'), door); zet('eerste beurt ' + soort(r), door); zet(r.weet ? 'antwoord gevonden' : 'geen antwoord', door);
    zet(/\?\s*$/.test(a) ? 'antwoord eindigt op een vraag' : 'antwoord zonder vraag aan het eind', door);
    zet(a.length < 250 ? 'antwoord kort (<250 tekens)' : a.length < 450 ? 'antwoord middel (250-450)' : 'antwoord lang (450+)', door);
    zet('site ' + g.site, door);
  }
  // 4. vragen: meest gesteld en zonder antwoord (getypt en pill apart)
  const telV = (arr) => { const m = {}; for (const r of arr) { const k = norm(r.v); if (!k) continue; const x = (m[k] = m[k] || { v: kort(r.v, 90), n: 0, weet: 0, sites: new Set() }); x.n++; if (r.weet) x.weet++; x.sites.add(r.site); } return Object.values(m).sort((a, b) => b.n - a.n).map(x => ({ v: x.v, n: x.n, weet: pct(x.weet, x.n), sites: [...x.sites].join(',') })); };
  const getypt = chatR.filter(r => soort(r) === 'getypt');
  const topGetypt = telV(getypt).slice(0, 30);
  const topPill = telV(chatR.filter(r => soort(r) === 'pill')).slice(0, 12);
  const zonder = telV(getypt.filter(r => !r.weet)).slice(0, 30);
  const uniekGetypt = new Set(getypt.map(r => norm(r.v))).size;
  // 5. pagina's
  const pag = {}; for (const r of chatR) { const k = r.site + ':' + (r.s || '-'); const x = (pag[k] = pag[k] || { pagina: k, beurten: 0, weet: 0, door: 0 }); x.beurten++; if (r.weet) x.weet++; if (r.p && r.p !== r.s) x.door++; }
  const gPag = {}; for (const g of gesprekken) { const k = g.site + ':' + (g.slug || '-'); const x = (gPag[k] = gPag[k] || { g: 0, verder: 0 }); x.g++; if (g.rs.length > 1) x.verder++; }
  const paginas = Object.values(pag).sort((a, b) => b.beurten - a.beurten).slice(0, 25).map(x => ({ ...x, weetPct: pct(x.weet, x.beurten), gesprekken: (gPag[x.pagina] || {}).g || 0, verderPct: pct((gPag[x.pagina] || {}).verder || 0, (gPag[x.pagina] || {}).g || 0) }));
  // 6. uren (UTC) en antwoordlengte
  const uren = Array(24).fill(0); for (const r of chatR) uren[new Date(N(r.t)).getUTCHours()]++;
  const lens = chatR.filter(r => r.a).map(r => String(r.a).length).sort((a, b) => a - b); const med = lens.length ? lens[Math.floor(lens.length / 2)] : 0;
  const herhaal = chatR.filter((r, i) => { const vorig = chatR.slice(Math.max(0, i - 8), i).reverse().find(x => x.w && x.w === r.w && x.site === r.site); return vorig && norm(vorig.v) === norm(r.v); }).length;
  const zelfdeAntw = (() => { let n = 0; for (const g of gesprekken) for (let i = 1; i < g.rs.length; i++) if (g.rs[i].a && norm(g.rs[i].a).slice(0, 60) === norm(g.rs[i - 1].a).slice(0, 60)) n++; return n; })();

  // 7. stijlen (doorpraten binnen 15 minuten, sinds 20 nov schoon)
  const st = paren(await kv.raw(['HGETALL', 'kz:door:stijl2']).catch(() => null)); const stijlen = {};
  for (const [k, v] of Object.entries(st)) { const m = /^(\w+):(\w):(toon|door)$/.exec(k); if (!m) continue; const x = (stijlen[m[1] + ' ' + m[2]] = stijlen[m[1] + ' ' + m[2]] || { toon: 0, door: 0 }); x[m[3]] = N(v); }

  // 8. tafels
  const kamers = ((await kv.raw(['SMEMBERS', 'tafel:kamers']).catch(() => [])) || []).slice(0, 400);
  const tafel = { kamers: kamers.length, metBerichten: 0, berichten: 0, gastvrouw: 0, mensen: 0, mensenNamen: 0, laatste: [] };
  const nicks = new Set();
  for (const k of kamers) { const ms = await lijst('tafel:m:' + k, 400); if (!ms.length) continue; tafel.metBerichten++; for (const m of ms) { tafel.berichten++; if (m.gast) tafel.gastvrouw++; else { tafel.mensen++; nicks.add(k + '|' + (m.pid || m.nick || '')); } } const mens = ms.filter(m => !m.gast).slice(0, 2); for (const m of mens) tafel.laatste.push({ kamer: k, t: N(m.t), tekst: kort(m.tekst, 120) }); }
  tafel.mensenNamen = nicks.size; tafel.laatste = tafel.laatste.sort((a, b) => b.t - a.t).slice(0, 10).map(x => ({ ...x, t: new Date(x.t).toISOString().slice(0, 16) }));

  // 9. gids.kadoly.com (eigen chatlog)
  const gks = { beurten: gk.length, eerste: gk.length ? dagVan(gk[0].at) : '', dringend: gk.filter(r => r.d).length, zonderProduct: gk.filter(r => !(r.pr || []).length).length, perSoort: {}, top: [] };
  for (const r of gk) gks.perSoort[r.a || '-'] = (gks.perSoort[r.a || '-'] || 0) + 1;
  { const m = {}; for (const r of gk) { const k = norm(r.v); if (!k) continue; (m[k] = m[k] || { v: kort(r.v, 90), n: 0, zp: 0 }).n++; if (!(r.pr || []).length) m[k].zp++; } gks.top = Object.values(m).sort((a, b) => b.n - a.n).slice(0, 15); }

  // 10. voorbeelden: diepste gesprekken, afhakers na een goed antwoord, geen antwoord
  const toon = g => ({ site: g.site, pagina: g.slug, beurten: g.rs.length, dag: dagVan(g.rs[0].t), rs: g.rs.map(r => ({ v: kort(r.v, 140), a: kort(r.a, 260), weet: !!r.weet, st: r.st || '', soort: soort(r) })) });
  const diepst = gesprekken.filter(g => g.rs.length >= 3).sort((a, b) => b.rs.length - a.rs.length).slice(0, 8).map(toon);
  const afhakers = gesprekken.filter(g => g.rs.length === 1 && g.rs[0].weet && g.rs[0].a && soort(g.rs[0]) === 'getypt').slice(-10).map(toon);
  const geenAntw = getypt.filter(r => !r.weet && r.a).slice(-10).map(r => ({ site: r.site, pagina: r.s, v: kort(r.v, 140), a: kort(r.a, 200) }));

  return {
    ok: true, at: new Date(nu).toISOString(),
    bereik: { logBeurten: rs.length, logVan: rs.length ? new Date(N(rs[0].t)).toISOString().slice(0, 16) : '', logTot: rs.length ? new Date(N(rs[rs.length - 1].t)).toISOString().slice(0, 16) : '', metGesprekId: metId, openLijst: open.length, logVol: rs.length >= 1999 },
    perDag, i100tot, sites, fouten, gesprekken: gesprekken.length, diepte, verder: Object.entries(verder).map(([k, x]) => ({ k, n: x.n, door: x.door, pct: pct(x.door, x.n) })).sort((a, b) => a.k < b.k ? -1 : 1),
    uniekGetypt, getyptTotaal: getypt.length, topGetypt, topPill, zonder, paginas, uren, antwoordLengte: { mediaan: med, max: lens[lens.length - 1] || 0 }, herhaaldeVraag: herhaal, herhaaldAntwoord: zelfdeAntw,
    stijlen: Object.entries(stijlen).map(([k, x]) => ({ k, ...x, pct: pct(x.door, x.toon) })), tafel, kadolyGids: gks, diepst, afhakers, geenAntw,
  };
}

export function chatAnalyseTekst(x) {
  const L = [];
  const b = x.bereik;
  L.push('ANALYSE LERENDE CHAT ' + x.at.slice(0, 16) + ' UTC');
  L.push('Log: ' + b.logBeurten + ' beurten van ' + b.logVan + ' tot ' + b.logTot + (b.logVol ? ' (log vol: oudere beurten zijn eruit, de dagtellers hieronder gaan wel terug tot de start)' : '') + '; ' + b.metGesprekId + ' met gesprek-id.');
  L.push('', 'PER DAG (alle sites): dag vragen | zonder antwoord | rekenhulp | samen | bot | onzin | MCP | AI-kosten | intenties (2+ velden) | volgen');
  for (const d of x.perDag) if (d.vraag || d.reken || d.kostUsd) L.push(d.dag + ' ' + d.vraag + ' | ' + d.open + ' | ' + d.reken + ' | ' + d.samen + ' | ' + d.bot + ' | ' + d.onzin + ' | ' + d.mcp + ' | $' + d.kostUsd + ' | ' + d.intenties + ' | ' + Object.entries(d.volg).map(([k, v]) => k + ' ' + v).join(', ') + '  [' + Object.entries(d.perSite).map(([k, v]) => k + ' ' + v).join(', ') + ']');
  L.push('Intenties totaal (doel 100.000 op 31 dec): ' + x.i100tot);
  L.push('', 'PER SITE (log): beurten, getypt/pill/reken/mcp, antwoord gevonden, fout, doorverwezen, uit cache, samen, intentie 2+ velden, velden wat/voor wie/budget/wanneer');
  for (const [s, v] of Object.entries(x.sites)) L.push(s + ': ' + v.beurten + ', ' + v.getypt + '/' + v.pill + '/' + v.reken + '/' + v.mcp + ', weet ' + pct(v.weet, v.beurten) + '%, fout ' + v.fout + ', door ' + v.door + ', cache ' + v.cache + ', samen ' + v.samen + ', int2 ' + pct(v.int2, v.beurten) + '%, velden ' + [v.wat, v.voorWie, v.budget, v.wanneer].map(n => pct(n, v.beurten) + '%').join('/'));
  if (Object.keys(x.fouten).length) L.push('Fouten: ' + Object.entries(x.fouten).map(([k, v]) => k + ' ' + v).join(', '));
  L.push('', 'GESPREKKEN: ' + x.gesprekken + ' (1 beurt ' + x.diepte.een + ', 2 ' + x.diepte.twee + ', 3 ' + x.diepte.drie + ', 4+ ' + x.diepte.vierplus + '). Zelfde vraag direct herhaald: ' + x.herhaaldeVraag + '; zelfde antwoord herhaald: ' + x.herhaaldAntwoord + '. Antwoord mediaan ' + x.antwoordLengte.mediaan + ' tekens.');
  L.push('Doorpraten na het eerste antwoord (n, verder, %):'); for (const v of x.verder) L.push('  ' + v.k + ': ' + v.n + ', ' + v.door + ', ' + v.pct + '%');
  L.push('Stijlen (toon, door binnen 15 min, %): ' + x.stijlen.map(s => s.k + ' ' + s.toon + '/' + s.door + ' ' + s.pct + '%').join('; '));
  L.push('', 'GETYPTE VRAGEN: ' + x.getyptTotaal + ' (' + x.uniekGetypt + ' verschillend). Meest gesteld (n, % met antwoord, sites):'); for (const v of x.topGetypt) L.push('  ' + v.n + 'x ' + v.weet + '% [' + v.sites + '] ' + v.v);
  L.push('Pill-paden meest gekozen:'); for (const v of x.topPill) L.push('  ' + v.n + 'x ' + v.weet + '% [' + v.sites + '] ' + v.v);
  L.push('Getypt zonder antwoord:'); for (const v of x.zonder) L.push('  ' + v.n + 'x [' + v.sites + '] ' + v.v);
  L.push('', "PAGINA'S (beurten, % antwoord, gesprekken, % verder, doorverwezen):"); for (const p of x.paginas) L.push('  ' + p.pagina + ': ' + p.beurten + ', ' + p.weetPct + '%, ' + p.gesprekken + ', ' + p.verderPct + '%, ' + p.door);
  L.push('Uren UTC: ' + x.uren.map((n, h) => h + 'u ' + n).filter(s => !/ 0$/.test(s)).join(', '));
  const t = x.tafel; L.push('', 'TAFELS: ' + t.kamers + ' kamers, ' + t.metBerichten + ' met berichten, ' + t.berichten + ' berichten (' + t.gastvrouw + ' gastvrouw, ' + t.mensen + ' van ' + t.mensenNamen + ' mensen).'); for (const m of t.laatste) L.push('  ' + m.t + ' ' + m.kamer + ': ' + m.tekst);
  const g = x.kadolyGids; L.push('', 'GIDS.KADOLY.COM CHAT: ' + g.beurten + ' vragen sinds ' + g.eerste + ', dringend ' + g.dringend + ', zonder product ' + g.zonderProduct + ', soort ' + Object.entries(g.perSoort).map(([k, v]) => k + ' ' + v).join(', ')); for (const v of g.top) L.push('  ' + v.n + 'x (zonder product ' + v.zp + ') ' + v.v);
  L.push('', 'DIEPSTE GESPREKKEN:'); for (const c of x.diepst) { L.push('- ' + c.site + ':' + c.pagina + ' ' + c.dag + ' (' + c.beurten + ' beurten)'); for (const r of c.rs) L.push('   V[' + r.soort + ']: ' + r.v + '\n   A[' + r.st + (r.weet ? '' : ',weet niet') + ']: ' + r.a); }
  L.push('', 'AFGEHAAKT NA EEN GOED ANTWOORD (getypt):'); for (const c of x.afhakers) { const r = c.rs[0]; L.push('- ' + c.site + ':' + c.pagina + ' ' + c.dag + '\n   V: ' + r.v + '\n   A[' + r.st + ']: ' + r.a); }
  L.push('', 'GEEN ANTWOORD (getypt, laatste):'); for (const r of x.geenAntw) L.push('- ' + r.site + ':' + r.pagina + ' V: ' + r.v + ' | A: ' + r.a);
  return L.join('\n');
}
