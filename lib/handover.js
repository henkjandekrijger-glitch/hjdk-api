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
export async function zetOpen(kv, items) {
  if (!Array.isArray(items)) return { ok: false, fout: 'open moet een JSON-lijst zijn' };
  const v = items.map(x => (typeof x === 'string' ? { tekst: x } : x)).filter(x => x && x.tekst).map(x => ({ tekst: String(x.tekst).slice(0, 500), wie: String(x.wie || '').slice(0, 40), sinds: x.sinds || dagStr() })).slice(0, 40);
  await kv.set(OPEN, v); return { ok: true, open: v };
}

export async function handover(kv) {
  const nu = new Date().toISOString().slice(0, 16).replace('T', ' ');
  await deployLog(kv).catch(() => null);
  const [w, log, open, alarmen] = await Promise.all([kv.get('mm:wachtuur:laatst').catch(() => null), lijst(kv, LOG, 40), kv.get(OPEN).catch(() => null), lijst(kv, 'mm:alarm:log', 12)]);
  let saldoMd = null; try { const a = await Promise.race([md('mondiad_get_current_account', {}), new Promise(r => setTimeout(() => r(null), 4000))]); if (a) saldoMd = N((a.account || a).accountBalance); } catch (e) {}
  // Associates: de laatste hele dag met cijfers
  let amz = null; for (let i = 1; i <= 4 && !amz; i++) { const d = dagStr(-i); try { const h = await kv.raw(['HGETALL', 'mm:amz:' + d]); if (h && h.length) { const o = []; for (let j = 0; j < h.length; j += 2) { try { o.push(Object.assign({ tag: h[j] }, JSON.parse(h[j + 1]))); } catch (e) {} } amz = { dag: d, tags: o.sort((a, b) => N(b.verdiend) - N(a.verdiend)) }; } } catch (e) {} }
  let rt = null; try { const { rtStand } = await import('./retarget.js'); rt = await rtStand(kv, { dagen: 14 }); } catch (e) {}
  let tests = []; try { const ks = await kv.raw(['SCAN', '0', 'MATCH', 'mm:ctrtest:*', 'COUNT', '200']); for (const k of (ks && ks[1]) || []) { const t = await kv.get(k).catch(() => null); if (t) tests.push(t); } } catch (e) {}

  const r = [];
  r.push('# Handover campagnes en Clickmind (live, ' + nu + ' UTC)', '');
  r.push('Deze pagina wordt bij elk bezoek opnieuw opgebouwd. Lees hem aan het begin van elke chat. Werk hem bij aan het eind van elke chat: ' + HOST + '/api/mm/handover?log=<wat je deed en wat er nog ligt>&wie=<chat>. Open punten zetten: ?open=<JSON-lijst>.', '');
  r.push('## Eerst lezen', '');
  r.push('- Skill /campagnes-henkjan (altijd gebruiken bij campagnewerk) en de Clickmind-skill.');
  r.push('- Clickmind-overdracht met alle onderdelen en lessen: ' + HOST + '/api/mm/overdracht. Technisch overzicht: ' + HOST + '/api/mm/overzicht. In gewone taal: ' + HOST + '/api/mm/clickmind.');
  r.push('- Repo henkjandekrijger-glitch/hjdk-api (Vercel-project hjdk-api, team henq). Commit met expliciete bestandsnamen, git pull --rebase voor de push. amz-ronde heeft geen repo: niet aanpassen.');
  r.push('- Henkjan: kort, gewoon Nederlands, cijfers, eerst doen dan melden. Saldi onder de grens bovenaan (PropellerAds $150, Mondiad $40, MGID EUR 40, RichAds $30).', '');
  r.push('## Harde grenzen', '');
  r.push('- Nooit campagnes stoppen of pauzeren, nooit bod, budget, dagplanning of targeting wijzigen zonder Henkjans woord. Zones blokkeren mag (nooit de grootste bron van een campagne, nooit in witte-lijstcampagnes).');
  r.push('- Hoogstens $10 per dag per campagne (MGID EUR 20). CPA, gebruikersactiviteit LOW. AMZ hoogstens 10 PropellerAds-starts per PropellerAds-dag (aanvulronde 8 plus 2 handmatig); de dag begint 05:00 UTC.');
  r.push('- Geen conversie-postback naar PropellerAds voor de Amazon-blanket. Oordeel alleen op hele dagen van Associates. Omzet mag nooit omlaag. Sleutels nooit tonen. Alles in de cloud.', '');

  r.push('## Stand nu', '');
  if (saldoMd != null) r.push('- Mondiad-saldo: $' + saldoMd.toFixed(2) + (saldoMd < 40 ? ' (onder de grens)' : ''));
  if (w) {
    const n = w.netten || {}; for (const [net, x] of Object.entries(n)) r.push('- Aankomst ' + net + ' vandaag (' + w.dag + ', UTC): ' + x.aangekomen + ' van ' + x.kliks + ' afgerekende /go-kliks (' + (x.pct == null ? '-' : x.pct + '%') + '), $' + x.kosten + '.');
    const m = w.mensgeld; if (m && m.totaal) r.push('- Per uniek mens vandaag: $' + m.totaal.dubbelGeld + ' van $' + m.totaal.kosten + ' aan /go-kliks ging naar mensen die we die dag al hadden.' + ((m.zinnen || []).length ? ' ' + m.zinnen.slice(0, 3).join(' ') : ''));
    const P = (w.eigen && w.eigen.projecten) || {};
    for (const k of ['shop', 'shop|NL', 'todayin', 'todayin|NL']) { const x = P[k]; if (!x) continue; r.push('- ' + k + ': ' + x.kliks + ' kliks, ' + x.bezoek + ' bezoeken, ' + (x.mens == null ? '' : x.mens + ' echte mensen, ') + x.aanmelding + ' aanmeldingen, ' + x.koop + ' verkopen, $' + x.kosten + (x.perLid ? ', $' + x.perLid + ' per lid' : '') + '.'); }
    r.push('- Uurwacht bijgewerkt: ' + String(w.bijgewerkt || '').slice(0, 16).replace('T', ' ') + ' UTC (' + HOST + '/api/mm/wachtuur?lees=1).');
  }
  if (amz) { r.push('- Associates ' + amz.dag + ' (hele dag, per tag): ' + amz.tags.slice(0, 10).map(t => t.tag + ' ' + N(t.artikelen) + ' art. op ' + N(t.kliks) + ' kliks, $' + N(t.omzet).toFixed(0) + ' besteld' + (N(t.verdiend) ? ', $' + N(t.verdiend).toFixed(2) + ' verdiend' : '')).join('; ') + '.'); }
  else r.push('- Associates: geen hele dag ingevoerd in de laatste 4 dagen. Invoer per tag: ' + HOST + '/api/mm/amazon?dag=&tag=&kliks=&artikelen=&omzet=&verdiend=&bron=associates-heledag (Henkjan stuurt een schermafbeelding van Reports, Yesterday, Group by Tracking ID).');
  if (rt) { const c = rt.instelling || {}; const pub = []; for (const [nm, x] of Object.entries(c.netwerken || {})) for (const p of Object.keys(x.publieken || {})) pub.push(nm + ' ' + p); r.push('- Retargeting (Clickmind-publiek): ' + (c.aan ? 'aan' : 'uit') + ', landen ' + (c.landen || []).join(', ') + ', sites ' + (c.sites || []).join(', ') + ', publieken: ' + (pub.length ? pub.join(', ') : 'nog geen (publieks-id uit het PropellerAds-dashboard nodig)') + ((rt.publieken || []).length ? '; ' + rt.publieken.map(x => x.publiek + ' ' + (x.uniekeMensen == null ? x.gevuurd : x.uniekeMensen) + ' mensen').join(', ') : '') + '.'); }
  for (const t of tests) r.push('- CTR-test ' + t.naam + ': campagne ' + (t.campagne || '?') + ', ' + Object.keys(t.armen || {}).length + ' advertenties, elk naar een eigen zoekterm. Stand: ' + HOST + '/api/mm/ctrtest?naam=' + t.naam + '.');
  r.push('');
  if (alarmen.length) { r.push('## Laatste alarmen (Telegram)', ''); for (const a of alarmen.slice(0, 8)) r.push('- ' + String(a.t || '').slice(0, 16).replace('T', ' ') + ': ' + String(a.tekst || '').slice(0, 220)); r.push(''); }
  r.push('## Open punten', '');
  if (Array.isArray(open) && open.length) for (const o of open) r.push('- ' + o.tekst + (o.sinds ? ' (sinds ' + o.sinds + ')' : '')); else r.push('- Geen.');
  r.push('');
  r.push('## Werklog (nieuwste eerst)', '');
  if (log.length) for (const x of log) r.push('- ' + String(x.t).slice(0, 16).replace('T', ' ') + ' UTC, ' + x.wie + ': ' + x.tekst); else r.push('- Nog leeg.');
  r.push('');
  r.push('## Waar alles staat', '');
  r.push('- Uurwacht: /api/mm/wachtuur?lees=1 (droog=1&dag= om na te rekenen). Per uniek mens: /api/mm/mensgeld?dag=. Welke termen dezelfde mensen delen: /api/mm/overlap?dagen=3 (let op: veel DE-campagnes delen dezelfde 5 advertenties, dus overlap is daar deels de advertentie, niet de interesse).');
  r.push('- Voorspellers: /api/mm/voorspel?dagen=7. Amazon-meter per tag: /api/mm/amazonmeter?dag=. Termlessen: /api/mm/termen. Kliks per campagne en variant: /api/mm/proef?dagen=2.');
  r.push('- Retargeting: /api/mm/retarget (?j= om te zetten). CTR-tests: /api/mm/ctrtest?naam=. Mondiad naar /go kopiëren: /api/mm/mdgo. Mondiad pauzeren alleen op Henkjans woord: /api/mm/mdpauze.');
  r.push('- Yoors Shop en todayin in de uurwacht: lib/eigenwacht.js. Telegram naar Henkjan: todayin-spel /api/meld (MELD_SLEUTEL).');
  return { tekst: r.join('\n'), json: { bijgewerkt: new Date().toISOString(), saldoMondiad: saldoMd, wachtuur: w ? { dag: w.dag, netten: w.netten, mensgeld: w.mensgeld && w.mensgeld.totaal } : null, associates: amz, open: open || [], log, tests: tests.map(t => ({ naam: t.naam, campagne: t.campagne, armen: Object.keys(t.armen || {}).length })) } };
}
