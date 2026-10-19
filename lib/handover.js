// Handover voor elke chat (Henkjan 17 okt: "Zet handover op Vercel zodat ik met iedere chat verder kan werken en zorg dat deze
// handover continu wordt bijgewerkt"). Eén pagina met alles wat een nieuwe chat nodig heeft om verder te werken aan de campagnes,
// Clickmind en de Amazon-blanket:
//   - de stand van nu, live opgebouwd bij elk bezoek (uurwacht, aankomst, alarmen, geld per uniek mens, Associates per tag,
//     retargeting, CTR-tests, Mondiad-saldo);
//   - open punten (mm:handover:open, te zetten met ?open=<json-lijst>);
//   - het werklog: elke chat schrijft wat hij deed en wat er nog ligt (?log=<tekst>&wie=<chat>), nieuwste bovenaan (mm:handover:log);
//   - de vaste afspraken en de adressen waar alles staat.
// Lezen: https://hjdk-api-henq.vercel.app/api/mm/handover (Vercel-inlog; in een Claude-chat met web_fetch_vercel_url). ?vorm=json voor JSON.
// Alles zonder sleutels of geheimen.
import { md } from './mdmcp.js';
import { WERKING, WERKING_DATUM } from './werking.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const HOST = 'https://hjdk-api-henq.vercel.app';
const LOG = 'mm:handover:log', OPEN = 'mm:handover:open';
const dagStr = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
async function lijst(kv, key, n) { try { return ((await kv.raw(['LRANGE', key, 0, n - 1])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); } catch (e) { return []; } }

export async function logBij(kv, { tekst, wie = '' }) {
  const t = String(tekst || '').trim().slice(0, 1500); if (!t) return { ok: false, fout: 'tekst' };
  const x = { t: new Date().toISOString(), wie: String(wie || 'chat').slice(0, 60), tekst: t };
  await kv.raw(['LPUSH', LOG, JSON.stringify(x)]); await kv.raw(['LTRIM', LOG, 0, 299]);
  return { ok: true, log: x };
}
// elke nieuwe deploy komt één keer in het werklog (commitregel), zodat ook wijzigingen zonder logregel zichtbaar zijn
export async function deployLog(kv) {
  const sha = String(process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7); if (!sha) return null;
  try { const r = await kv.raw(['SET', 'mm:handover:deploy:' + sha, '1', 'NX', 'EX', 30 * 86400]); if (!(r === 'OK' || r === true)) return null; } catch (e) { return null; }
  const msg = String(process.env.VERCEL_GIT_COMMIT_MESSAGE || '').split('\n')[0].slice(0, 300);
  return logBij(kv, { tekst: 'Live gezet ' + sha + ': ' + msg, wie: 'deploy' });
}
// Projecten sturen hun eigen werking en stand (Henkjan 19 okt: complete werking en stand, altijd bijgewerkt). POST /api/mm/handoverzet.
const PROJ = 'mm:handover:project:';
export async function zetProject(kv, b) {
  const p = String((b && b.project) || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30); if (!p) return { ok: false, fout: 'project' };
  const kort = (x, n) => String(x == null ? '' : x).slice(0, n);
  const v = { project: p, naam: kort(b.naam || p, 80), ontvangen: new Date().toISOString(), bijgewerkt: kort(b.bijgewerkt, 40), deploy: b.deploy && typeof b.deploy === 'object' ? { sha: kort(b.deploy.sha, 12), msg: kort(b.deploy.msg, 200), gebouwd: kort(b.deploy.gebouwd, 40) } : null,
    datums: b.datums && typeof b.datums === 'object' ? { werking: kort(b.datums.werking, 40), claude: kort(b.datums.claude, 40) } : {}, stand: (Array.isArray(b.stand) ? b.stand : []).slice(0, 40).map(x => kort(x, 1000)),
    lus: kort(b.lus, 5000), werking: kort(b.werking, 24000), links: (Array.isArray(b.links) ? b.links : []).slice(0, 10).map(x => kort(x, 300)) };
  await kv.set(PROJ + p, v); await kv.raw(['SADD', PROJ + 'lijst', p]);
  return { ok: true, project: p, regels: v.stand.length };
}
async function projecten(kv) {
  let ids = []; try { ids = (await kv.raw(['SMEMBERS', PROJ + 'lijst'])) || []; } catch (e) {}
  const out = []; for (const id of ids.sort()) { const v = await kv.get(PROJ + id).catch(() => null); if (v) out.push(v); }
  return out;
}
// Stand van budget, slots en tempowacht uit propellerads-mcp (zelfde gedeelde sleutel als de wachten).
async function paStand() {
  const s = process.env.SHOP_SLEUTEL; if (!s) return null;
  const base = (process.env.WACHT_CENTRAAL_URL || 'https://propellerads-mcp.vercel.app').replace(/\/$/, '');
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 8000);
  try { const r = await fetch(base + '/api/wachtlog?stand=1', { headers: { 'x-shop-sleutel': s }, signal: ctl.signal }); return r.ok ? await r.json() : null; } catch (e) { return null; } finally { clearTimeout(tm); }
}

export async function zetOpen(kv, items) {
  if (!Array.isArray(items)) return { ok: false, fout: 'open moet een JSON-lijst zijn' };
  const v = items.map(x => (typeof x === 'string' ? { tekst: x } : x)).filter(x => x && x.tekst).map(x => ({ tekst: String(x.tekst).slice(0, 500), wie: String(x.wie || '').slice(0, 40), sinds: x.sinds || dagStr() })).slice(0, 40);
  await kv.set(OPEN, v); return { ok: true, open: v };
}

export async function handover(kv) {
  const nu = new Date().toISOString().slice(0, 16).replace('T', ' ');
  await deployLog(kv).catch(() => null);
  const [w, log, open, alarmen, proj, pa] = await Promise.all([kv.get('mm:wachtuur:laatst').catch(() => null), lijst(kv, LOG, 40), kv.get(OPEN).catch(() => null), lijst(kv, 'mm:alarm:log', 12), projecten(kv), paStand()]);
  let saldoMd = null; try { const a = await Promise.race([md('mondiad_get_current_account', {}), new Promise(r => setTimeout(() => r(null), 4000))]); if (a) saldoMd = N((a.account || a).accountBalance); } catch (e) {}
  // Associates: de laatste hele dag met cijfers (account gesloten 19 okt; blijft staan als laatste meting)
  let amz = null; for (let i = 1; i <= 4 && !amz; i++) { const d = dagStr(-i); try { const h = await kv.raw(['HGETALL', 'mm:amz:' + d]); if (h && h.length) { const o = []; for (let j = 0; j < h.length; j += 2) { try { o.push(Object.assign({ tag: h[j] }, JSON.parse(h[j + 1]))); } catch (e) {} } amz = { dag: d, tags: o.sort((a, b) => N(b.verdiend) - N(a.verdiend)) }; } } catch (e) {} }
  let rt = null; try { const { rtStand } = await import('./retarget.js'); rt = await rtStand(kv, { dagen: 14 }); } catch (e) {}
  const uur = t => { const ms = Date.now() - Date.parse(t || 0); return Number.isFinite(ms) ? ms / 36e5 : 999; };

  const r = [];
  r.push('# Overdracht: complete werking en stand (live, ' + nu + ' UTC)', '');
  r.push('Deze pagina wordt bij elk bezoek opnieuw opgebouwd uit de live cijfers, de werkingsbeschrijving hieronder en wat de projecten zelf elke 15 minuten meesturen. Lees hem aan het begin van elke chat. Werk hem bij aan het eind van elke chat: ' + HOST + '/api/mm/handover?log=<wat je deed en wat er nog ligt>&wie=<chat>. Open punten zetten: ?open=<JSON-lijst>. Verander je hoe iets werkt: werk in dezelfde commit de werking bij (hjdk-api lib/werking.js of docs/werking.md van het project).', '');
  r.push('## Eerst lezen', '');
  r.push('- Skills: campagnes-henkjan (live: https://propellerads-mcp.vercel.app/api/skill), leerlus-henkjan (live: https://propellerads-mcp.vercel.app/api/leerlus), zicht-vindbaarheid.');
  r.push('- Yoors Shop: ' + HOST + '/api/shop/overdracht. Clickmind in detail: ' + HOST + '/api/mm/overdracht, technisch ' + HOST + '/api/mm/overzicht, in gewone taal ' + HOST + '/api/mm/clickmind.');
  r.push('- Repo henkjandekrijger-glitch/hjdk-api (Vercel-project hjdk-api, team henq). Commit met expliciete bestandsnamen, git pull --rebase voor de push. amz-ronde heeft geen repo: niet aanpassen.');
  r.push('- Henkjan: kort, gewoon Nederlands, cijfers, eerst doen dan melden. Saldi onder de grens bovenaan (PropellerAds $150, Mondiad $40, MGID EUR 40, RichAds $30).', '');
  r.push('## Harde grenzen (actueel)', '');
  r.push('- Budget per saldo hoogstens $100 per budgetdag over alle netwerken; testprojecten (MyLevel, todayin, spellen, shop, overig) $20 per dag en 10 dagen vanaf 18 okt, daarna quitte of stil tot Henkjan de regel openbreekt. Hoogstens $10 per campagne per dag (MGID EUR 20).');
  r.push('- Elke campagne en kopie start op CPA $0,01; hoger alleen bij succes (3 dagen omzet >= 1,2 x kosten, min $5 kosten, verkoopproject min 2 verkopen, gisteren <80% budget op; max +20% een keer per dag). Een dagbudget moet 8 uur meegaan.');
  r.push('- Alleen mobiel, altijd CPA, nooit auto-creatives, knoptekst altijd ingevuld, message match met de pagina. PropellerAds hoogstens 5 nieuwe starts per dag per project, 100 slots per dag totaal (elke creative-wijziging telt).');
  r.push('- Verliezers stoppen mag volgens de stopregel; budget en dagplanning wijzigen alleen met Henkjans woord of mandaat. Bij elke kopie de voorganger uit. Nooit zelf in bulk herstarten: melden en Henkjans woord afwachten. Zones blokkeren mag altijd (nooit een witte lijst wissen).');
  r.push('- Amazon-blanket gestopt (Associates-account gesloten 19 okt). Sleutels nooit tonen. Alles in de cloud.', '');

  r.push('## Werking (bijgewerkt ' + WERKING_DATUM + ')', '');
  for (const l of WERKING) r.push(l);
  r.push('');

  r.push('## Stand nu', '');
  if (pa && pa.budget && pa.budget.tekst) r.push('- ' + pa.budget.tekst);
  else r.push('- Budgetstand niet bereikbaar (propellerads-mcp /api/wachtlog?stand=1).');
  if (pa && pa.budget && Array.isArray(pa.budget.winst) && pa.budget.winst.length) { const wn = pa.budget.winst.filter(x => x.kosten > 0); const top = wn.slice(0, 3), bodem = wn.slice(-3); r.push('- Winst per dollar, beste: ' + top.map(x => x.project + ' ' + x.cid + ' ' + (x.perDollar == null ? '-' : x.perDollar.toFixed(2))).join(', ') + '; slechtste: ' + bodem.map(x => x.project + ' ' + x.cid + ' $' + N(x.kosten).toFixed(2) + ' kosten, $' + N(x.omzet).toFixed(2) + ' omzet').join(', ') + '.'); }
  if (pa && pa.slots && pa.slots.tekst) r.push('- ' + pa.slots.tekst);
  if (pa && Array.isArray(pa.tempo) && pa.tempo.length) r.push('- Tempowacht, laatste ingrepen: ' + pa.tempo.slice(0, 5).map(x => String(x.t || '').slice(5, 16).replace('T', ' ') + ' ' + x.cid + (x.rem ? ' geremd ' + x.rem + ' min' : ' bod ' + x.van + ' -> ' + x.naar)).join('; ') + '.');
  if (saldoMd != null) r.push('- Mondiad-saldo: $' + saldoMd.toFixed(2) + (saldoMd < 40 ? ' (onder de grens)' : ''));
  if (w) {
    const n = w.netten || {}; for (const [net, x] of Object.entries(n)) r.push('- Aankomst ' + net + ' vandaag (' + w.dag + ', UTC): ' + x.aangekomen + ' van ' + x.kliks + ' afgerekende /go-kliks (' + (x.pct == null ? '-' : x.pct + '%') + '), $' + x.kosten + '.');
    const P = (w.eigen && w.eigen.projecten) || {};
    for (const k of ['shop', 'shop|NL', 'todayin', 'todayin|NL']) { const x = P[k]; if (!x) continue; r.push('- ' + k + ': ' + x.kliks + ' kliks, ' + x.bezoek + ' bezoeken, ' + (x.mens == null ? '' : x.mens + ' echte mensen, ') + x.aanmelding + ' aanmeldingen, ' + x.koop + ' verkopen, $' + x.kosten + (x.perLid ? ', $' + x.perLid + ' per lid' : '') + '.'); }
    r.push('- Uurwacht bijgewerkt: ' + String(w.bijgewerkt || '').slice(0, 16).replace('T', ' ') + ' UTC (' + HOST + '/api/mm/wachtuur?lees=1).');
  }
  if (amz) r.push('- Amazon (account gesloten 19 okt), laatste hele dag ' + amz.dag + ': ' + amz.tags.slice(0, 5).map(t => t.tag + ' ' + N(t.artikelen) + ' art. op ' + N(t.kliks) + ' kliks').join('; ') + '.');
  if (rt) { const c = rt.instelling || {}; const pub = []; for (const [nm, x] of Object.entries(c.netwerken || {})) for (const p of Object.keys(x.publieken || {})) pub.push(nm + ' ' + p); r.push('- Remarketing (Clickmind): ' + (c.aan ? 'aan' : 'uit') + ', landen ' + (c.landen || []).join(', ') + ', sites ' + (c.sites || []).join(', ') + ', publieken: ' + (pub.length ? pub.join(', ') : 'geen') + ((rt.publieken || []).length ? '; ' + rt.publieken.map(x => x.publiek + ' ' + (x.uniekeMensen == null ? x.gevuurd : x.uniekeMensen) + ' mensen').join(', ') : '') + '.'); }
  r.push('');

  for (const p of proj) {
    const oud = uur(p.ontvangen);
    const achter = p.datums && p.datums.claude && p.datums.werking && Date.parse(p.datums.claude) - Date.parse(p.datums.werking) > 6 * 36e5;
    r.push('## ' + p.naam + ' (stand ' + String(p.ontvangen || '').slice(0, 16).replace('T', ' ') + ' UTC)', '');
    if (oud > 1) r.push('- LET OP: deze stand is ' + Math.round(oud) + ' uur oud; het project stuurt niet meer (controleer zijn cron).');
    if (achter) r.push('- LET OP: de regels (CLAUDE.md, ' + p.datums.claude.slice(0, 16) + ') zijn nieuwer dan de werking (' + p.datums.werking.slice(0, 16) + '); werk de werking bij.');
    if (p.deploy && p.deploy.sha) r.push('- Live versie: ' + p.deploy.sha + ' ' + p.deploy.msg);
    r.push('', '### Stand', '');
    if (p.stand.length) for (const l of p.stand) r.push('- ' + l); else r.push('- (geen standregels)');
    if (p.lus) { r.push('', '### Laatste ronde van de leerlus', ''); for (const l of p.lus.split('\n')) r.push(l.replace(/^## /, '')); }
    if (p.werking) { r.push('', '### Werking', ''); for (const l of p.werking.split('\n')) { if (/^# /.test(l)) continue; r.push(l.replace(/^## /, '#### ')); } }
    if (p.links && p.links.length) { r.push('', '### Waar', ''); for (const l of p.links) r.push('- ' + l); }
    r.push('');
  }

  if (alarmen.length) { r.push('## Laatste alarmen (Telegram)', ''); for (const a of alarmen.slice(0, 8)) r.push('- ' + String(a.t || '').slice(0, 16).replace('T', ' ') + ': ' + String(a.tekst || '').slice(0, 220)); r.push(''); }
  r.push('## Open punten', '');
  if (Array.isArray(open) && open.length) for (const o of open) r.push('- ' + o.tekst + (o.sinds ? ' (sinds ' + o.sinds + ')' : '')); else r.push('- Geen.');
  r.push('');
  r.push('## Werklog (nieuwste eerst)', '');
  if (log.length) for (const x of log) r.push('- ' + String(x.t).slice(0, 16).replace('T', ' ') + ' UTC, ' + x.wie + ': ' + x.tekst); else r.push('- Nog leeg.');
  r.push('');
  r.push('## Waar alles staat', '');
  r.push('- Uurwacht: /api/mm/wachtuur?lees=1 (droog=1&dag= om na te rekenen). Per uniek mens: /api/mm/mensgeld?dag=. Overlap van termen: /api/mm/overlap?dagen=3.');
  r.push('- Voorspellers: /api/mm/voorspel?dagen=7. Kliks per campagne en variant: /api/mm/proef?dagen=2. Ingrijpen: /api/mm/tagstop. Lookalikes: /api/mm/lookalike.');
  r.push('- Remarketing: /api/mm/retarget (?j= om te zetten). Mondiad pauzeren of aanzetten alleen op Henkjans woord: /api/mm/mdpauze (&aan=1).');
  r.push('- Budget, slots en tempowacht: MCP-tools budget_stand en slot_stand (propellerads-mcp), rondelog: ronde_log. Telegram naar Henkjan: todayin-spel /api/meld (MELD_SLEUTEL).');
  return { tekst: r.join('\n'), json: { bijgewerkt: new Date().toISOString(), werking: { datum: WERKING_DATUM, regels: WERKING }, budget: pa && pa.budget, slots: pa && pa.slots, tempo: pa && pa.tempo, projecten: proj, saldoMondiad: saldoMd, wachtuur: w ? { dag: w.dag, netten: w.netten, mensgeld: w.mensgeld && w.mensgeld.totaal } : null, associates: amz, open: open || [], log } };
}
