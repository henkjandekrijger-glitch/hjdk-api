// Dashboard voor alle projecten (Henkjan 25 nov 2026: "Maak een klikbaar dashboard voor alle projecten met planning en
// overdracht logboeken en doelstelling En wat de progressie is . Die gebruik ik dus vr alle projecten." en "moet draaien op
// vercel dit plan zodat bereikbaar voor ieder account onafh computer").
// Eén pagina: per project het doel, de voortgang, de planning, de overdracht en het logboek. Draait op Vercel, dus elk account
// en elke chat leest en schrijft hetzelfde.
//   Lezen:    https://hjdk-api-henq.vercel.app/api/mm/dashboard   (?vorm=json of ?vorm=tekst voor een chat; ?project=<id> voor één project)
//   Schrijven: /api/mm/dashboard?zet=<JSON>   met {"project":"kdp", ...} en alleen de velden die veranderen:
//     doel (tekst), nu en doelgetal (getallen) met eenheid en gemeten (tekst), plan ([{"d":"2026-11-27","t":"wat","klaar":false}], vervangt de lijst),
//     klaar (tekst of datum van één planregel die af is), erbij ({"d":..,"t":..} één planregel erbij),
//     naam, wat, overdracht ([[naam,url]]), site, logs (["kdp"]: begin van de naam waarmee chats in het werklog schrijven).
//   Logboek: het bestaande werklog (/api/mm/handover?log=<tekst>&wie=<project>-<chat>); het dashboard toont per project de regels
//   waarvan de naam met een van zijn logs begint, plus de deploys waarvan de commitregel het project noemt.
//   Archiveren (Henkjan 25 nov: "zorg dat ik makkelijk een project kan archiveren dus niet meer zie"): knop Archiveer bij elk project, of
//   ?archiveer=<id>; terug met ?terug=<id> of de knop onder Archief. Een gearchiveerd project staat niet meer in het overzicht, de planning of de tekst.
//   Vormgeving: die van sealedintent.com (lib/sealed.js CSS: Inter, 680 px, inkt #0B1640, accent #2B47C4, ronde knoppen, dunne lijnen).
// De vaste lijst hieronder is het begin; wat een chat met zet opslaat (kv mm:dash:<id>) gaat voor. Geen sleutels of geheimen.

const HOST = 'https://hjdk-api-henq.vercel.app';
const DASH = 'mm:dash:';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const kort = (x, n) => String(x == null ? '' : x).slice(0, n);
const vandaag = () => new Date(Date.now() - 4 * 36e5).toISOString().slice(0, 10); // Curaçao (UTC-4)
const getal = x => { const n = Number(x); return Number.isFinite(n) ? n : null; };

export const PROJECTEN = [
  { id: 'kdp', naam: 'KDP-boeken', wat: 'Amazon KDP en Amazon Ads voor de boekenplank (287 titels).', site: 'https://kdpreports.amazon.com/royalties',
    doel: '$200 royalty per dag, ook na januari (ongeveer $6.000 per maand).', nu: 47, doelgetal: 200, eenheid: '$ per dag', gemeten: '18-24 nov 2026',
    overdracht: [['Overdracht en plan boekenplank', HOST + '/api/wtb?op=kdpoverdracht']], logs: ['kdp'], woorden: /\bkdp\b/i,
    plan: [
      { d: '2026-11-27', t: 'Oordeel PIT BOSS op voorgesteld bod: ads boven 40% van de PIT BOSS-royalty = terug naar $0,75.' },
      { d: '2026-11-28', t: 'Oordeel Australië (Enoch en Teens AU) op de 40%-regel.' },
      { d: '2026-11-28', t: 'Oordeel Lasting Change NIEUWJAAR: $15 zonder verkoop = generieke woorden terug naar $0,30.' },
      { d: '2026-11-29', t: 'Oordeel Adults VS.' },
      { d: '2026-11-30', t: 'Eerste twee instructieproeven: Adults en Definitive Apocrypha.' },
      { d: '2026-12-01', t: 'Lasting Change-omschakeling: broad-woorden aan, AUTO Loose naar voorgesteld bod.' },
      { d: '2026-12-01', t: 'Maandtoets: royalty november tegen $6.000 en het seizoenboek voor de volgende 8 weken.' },
      { d: '2026-12-18', t: 'Einde kerstvenster Teens en Adults: terugschakelen en afrekenen.' },
    ] },
  { id: 'wam', naam: 'We Are Many', wat: 'Dossiersite wearemany.now: klachten bundelen per bedrijf, plus de chat.', site: 'https://wearemany.now',
    doel: '1.000 organische bezoeken per dag op 31 december 2026 (betaald telt apart).', doelgetal: 1000, eenheid: 'organische bezoeken per dag',
    overdracht: [['Overdracht WAM', HOST + '/api/wam?op=overdracht'], ['Overdracht dossiersite', HOST + '/api/wam?op=doverdracht'], ['Stand dossiers', HOST + '/api/wam?op=dstand']], logs: ['wam'], woorden: /\bwam\b|we are many/i,
    plan: [{ d: '2026-12-01', t: 'Hercontrole vindbaarheid nieuwe NL-pagina\'s (Postcode Loterij, NS, Flanderijn, incassokosten).' }, { d: '2026-12-08', t: 'Tweede hercontrole vindbaarheid.' }, { d: '2026-12-31', t: 'Noordster: 1.000 organische bezoeken per dag.' }] },
  { id: 'keuzehulpen', naam: 'Keuzehulpen', wat: 'keuzehulp.best, whichtobuy.best en kaufberater.best: groei via Google en AI-assistenten.', site: 'https://keuzehulp.best',
    overdracht: [['Levende overdracht', HOST + '/api/kz?op=overdracht'], ['Skill dagelijkse groei', HOST + '/api/zicht?op=skill&naam=keuzehulpen-groei'], ['Skill bouwen', HOST + '/api/zicht?op=skill&naam=keuzehulp-bouw'], ['Skill vindbaarheid', HOST + '/api/zicht?op=skill']], logs: ['kz', 'keuzehulp', 'zicht', 'groei'], woorden: /keuzehulp|whichtobuy|kaufberater|\bzicht\b/i },
  { id: 'curacao', naam: 'curacao.day', wat: 'Bedrijvengids, gidsen als nieuws en de chat op curacao.day.', site: 'https://curacao.day',
    overdracht: [['Overdracht bedrijfspagina\'s', HOST + '/curacao-gids?op=bzoverdracht'], ['Tikken per blok', HOST + '/curacao-gids?op=uxstand'], ['Vindbaarheid', HOST + '/api/gsc?op=curvind']], logs: ['cur', 'curacao', 'todayin'], woorden: /cura[cç]ao|\bcur\b|bedrijvengids/i },
  { id: 'kadoly', naam: 'Kadoly', wat: 'Webshop kadoly.com: gids en redactie, Spaarpot, Samen sparen en clubs.', site: 'https://gids.kadoly.com',
    overdracht: [['Overdracht Spaarpot', HOST + '/api/gids?op=dkoverdracht'], ['Overdracht Samen sparen', HOST + '/api/gids?op=ss&overdracht=1'], ['Stand redactie', HOST + '/api/gids?op=redstand']], logs: ['redactie', 'spaarpot', 'spaar', 'kadoly'], woorden: /kadoly|spaarpot|samen sparen/i },
  { id: 'sealed', naam: 'Sealed Intent', wat: 'sealedintent.com: bedrijfsverkoop met kopers.', site: 'https://sealedintent.com',
    overdracht: [['Overdracht', 'https://sealedintent.com/overdracht']], logs: ['sealed'], woorden: /sealed/i },
  { id: 'chirurgie', naam: 'Keuzehulp chirurgie', wat: 'Rankings van klinieken op whichtobuy.best/surgery, keuzehulp.best/chirurgie en kaufberater.best/chirurgie.', site: 'https://keuzehulp.best/chirurgie/nl',
    overdracht: [['Levende overdracht', 'https://keuzehulp.best/chirurgie/overdracht']], logs: ['surgery', 'chirurgie'], woorden: /chirurgie|surgery/i },
  { id: 'nexy', naam: 'Nexy', wat: 'nexy.now en nexy.help: vraagpagina\'s, redactie en de proef op de landingspagina.', site: 'https://nexy.now',
    overdracht: [['Redactie van vandaag', 'https://nexy.now/api/redactie?merk=nexy&vorm=tekst'], ['Proefstand landingspagina', HOST + '/api/mm/proefstand?site=nexylp&vorm=tekst']], logs: ['nexy'], woorden: /nexy/i },
  { id: 'campagnes', naam: 'Campagnes en Clickmind', wat: 'PropellerAds, Mondiad, RichAds, MGID en Clickmind dat van elke klik leert.', site: HOST + '/api/mm/clickmind',
    overdracht: [['Handover campagnes', HOST + '/api/mm/handover'], ['Overdracht Clickmind', HOST + '/api/mm/overdracht'], ['Alles op één pagina', HOST + '/api/mm/overzicht']], logs: ['campagne', 'clickmind', 'chat', 'wacht', 'dbwacht', 'mm'], woorden: /clickmind|propeller|mondiad|richads|mgid/i },
  { id: 'shop', naam: 'Yoors Shop', wat: 'Campagnes naar yoo.rs/shop met de lerende lus.', site: 'https://yoo.rs/shop',
    overdracht: [['Overdracht', HOST + '/api/shop/overdracht']], logs: ['shop', 'yoors'], woorden: /yoors|\bshop\b/i },
  { id: 'content', naam: 'Content en distributie', wat: 'stockingbooks.com, lastingchange.works, Pinterest voor de boeken en dagelijkse artikelen.', site: 'https://stockingbooks.com',
    overdracht: [['Overdracht met stand', HOST + '/api/bs?op=content']], logs: ['content', 'bs', 'pin'], woorden: /stockingbooks|bookstuffers|pinterest|lastingchange/i },
  { id: 'tk', naam: 'taniakross.media', wat: 'Dossier Muziek als medicijn met elke dag een artikel.', site: 'https://taniakross.media',
    overdracht: [['Overdracht', HOST + '/api/wtb?op=tkoverdracht']], logs: ['tk'], woorden: /taniakross|muziek als medicijn/i },
  { id: 'mail', naam: 'Mail (POST-lus)', wat: 'Elke mail namens Henkjan gaat eerst langs de regels.', site: HOST + '/api/post?op=stand',
    overdracht: [['Stand van alle mail', HOST + '/api/post?op=stand'], ['Regels', HOST + '/api/post?op=regels&t=1'], ['Skill', HOST + '/api/post?op=skill']], logs: ['post', 'mail'], woorden: /\bmail\b|postlus/i },
  { id: 'mylevel', naam: 'MyLevel', wat: 'mylevel.today: van advertentie tot betaling.', site: 'https://mylevel.today',
    overdracht: [['Lekketen', HOST + '/api/mm/lekketen?project=mylevel&vorm=tekst']], logs: ['mylevel'], woorden: /mylevel/i },
  { id: 'kosten', naam: 'Kosten en lussen', wat: 'De kostenwacht houdt elke 2 uur de open lekken per post en project bij.', site: 'https://opruimlus.vercel.app/overdracht',
    overdracht: [['Overdracht opruimlus', 'https://opruimlus.vercel.app/overdracht'], ['Router gezond', HOST + '/api/routergezond']], logs: ['opruim', 'kosten'], woorden: /opruim|kostenwacht/i },
];

const schoonPlan = l => (Array.isArray(l) ? l : []).map(x => (x && typeof x === 'object' ? { d: /^\d{4}-\d{2}-\d{2}$/.test(String(x.d || '')) ? String(x.d) : '', t: kort(x.t, 400).trim(), klaar: !!x.klaar } : null)).filter(x => x && x.t).slice(0, 60);

// Schrijven: alleen de velden die meegestuurd worden veranderen.
export async function zetDash(kv, b, wie = '') {
  const id = String((b && b.project) || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30); if (!id) return { ok: false, fout: 'project ontbreekt' };
  const vast = PROJECTEN.find(p => p.id === id);
  const oud = (await kv.get(DASH + id).catch(() => null)) || {};
  const v = Object.assign({}, oud);
  for (const k of ['naam', 'wat', 'doel', 'eenheid', 'gemeten', 'site']) if (b[k] != null) v[k] = kort(b[k], k === 'doel' || k === 'wat' ? 400 : 160).trim();
  for (const k of ['nu', 'doelgetal']) if (b[k] != null) { const n = getal(b[k]); if (n == null) return { ok: false, fout: k + ' moet een getal zijn' }; v[k] = n; }
  if (b.nu != null && b.gemeten == null) v.gemeten = vandaag();
  if (b.archief != null) { v.archief = !!b.archief; v.gearchiveerd = v.archief ? vandaag() : ''; }
  if (b.plan != null) v.plan = schoonPlan(b.plan);
  const basis = () => (v.plan || (vast && vast.plan ? schoonPlan(vast.plan) : []));
  if (b.erbij) { const e = schoonPlan([b.erbij]); if (!e.length) return { ok: false, fout: 'erbij: {"d":"JJJJ-MM-DD","t":"wat"}' }; v.plan = basis().concat(e); }
  if (b.klaar) { const z = String(b.klaar).toLowerCase(); const p = basis(); let n = 0; for (const r of p) if (!r.klaar && (r.d === z || r.t.toLowerCase().includes(z))) { r.klaar = true; r.af = vandaag(); n++; } if (!n) return { ok: false, fout: 'geen open planregel gevonden met "' + kort(b.klaar, 60) + '"' }; v.plan = p; }
  if (Array.isArray(b.overdracht)) v.overdracht = b.overdracht.filter(x => Array.isArray(x) && /^https:\/\//.test(String(x[1] || ''))).slice(0, 10).map(x => [kort(x[0], 80), kort(x[1], 300)]);
  if (Array.isArray(b.logs)) v.logs = b.logs.map(x => String(x).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)).filter(Boolean).slice(0, 8);
  if (!vast && !v.naam) return { ok: false, fout: 'nieuw project: geef ook naam' };
  v.bijgewerkt = new Date().toISOString(); v.wie = kort(wie || b.wie || 'chat', 60);
  await kv.set(DASH + id, v); await kv.raw(['SADD', DASH + 'lijst', id]);
  return { ok: true, project: id, opgeslagen: Object.keys(b).filter(k => k !== 'project') };
}

async function lijst(kv, key, n) { try { return ((await kv.raw(['LRANGE', key, 0, n - 1])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); } catch (e) { return []; } }

export async function dashData(kv) {
  let ids = []; try { ids = (await kv.raw(['SMEMBERS', DASH + 'lijst'])) || []; } catch (e) {}
  let gestuurdIds = []; try { gestuurdIds = (await kv.raw(['SMEMBERS', 'mm:handover:project:lijst'])) || []; } catch (e) {}
  const alle = [...new Set(PROJECTEN.map(p => p.id).concat(ids))];
  const [log, eigen, gestuurd] = await Promise.all([
    lijst(kv, 'mm:handover:log', 300),
    Promise.all(alle.map(id => kv.get(DASH + id).catch(() => null))),
    Promise.all(gestuurdIds.map(id => kv.get('mm:handover:project:' + id).catch(() => null))),
  ]);
  const dag = vandaag();
  const projecten = alle.map((id, i) => {
    const vast = PROJECTEN.find(p => p.id === id) || { id, logs: [id] }; const e = eigen[i] || {};
    const p = { id, naam: e.naam || vast.naam || id, wat: e.wat || vast.wat || '', site: e.site || vast.site || '', doel: e.doel || vast.doel || '',
      nu: e.nu != null ? e.nu : (vast.nu != null ? vast.nu : null), doelgetal: e.doelgetal != null ? e.doelgetal : (vast.doelgetal != null ? vast.doelgetal : null),
      eenheid: e.eenheid || vast.eenheid || '', gemeten: e.gemeten || vast.gemeten || '', overdracht: e.overdracht || vast.overdracht || [], logs: e.logs || vast.logs || [id],
      plan: e.plan || schoonPlan(vast.plan || []), bijgewerkt: e.bijgewerkt || '', wie: e.wie || '', archief: !!e.archief, gearchiveerd: e.gearchiveerd || '' };
    p.pct = p.nu != null && p.doelgetal ? Math.max(0, Math.min(100, Math.round(100 * p.nu / p.doelgetal))) : null;
    p.plan = p.plan.slice().sort((a, b) => (a.klaar - b.klaar) || String(a.d || '9').localeCompare(String(b.d || '9')));
    p.open = p.plan.filter(r => !r.klaar); p.telaat = p.open.filter(r => r.d && r.d < dag).length;
    p.log = log.filter(x => { const w = String(x.wie || '').toLowerCase(); return p.logs.some(l => w.startsWith(l)) || (w === 'deploy' && vast.woorden && vast.woorden.test(String(x.tekst || ''))); }).slice(0, 25);
    const g = gestuurd.find(x => x && (x.project === id || p.logs.includes(x.project))); if (g) p.stand = { ontvangen: g.ontvangen, regels: (g.stand || []).slice(0, 12) };
    p.laatste = p.log[0] ? p.log[0].t : '';
    return p;
  });
  const archief = projecten.filter(p => p.archief).map(p => ({ id: p.id, naam: p.naam, sinds: p.gearchiveerd }));
  const actief = projecten.filter(p => !p.archief);
  const agenda = []; for (const p of actief) for (const r of p.open) if (r.d) agenda.push({ d: r.d, t: r.t, id: p.id, naam: p.naam, telaat: r.d < dag });
  agenda.sort((a, b) => a.d.localeCompare(b.d));
  return { gemaakt: new Date().toISOString(), vandaag: dag, projecten: actief, archief, agenda, zonderDoel: actief.filter(p => !p.doel).map(p => p.naam), zonderPlan: actief.filter(p => !p.open.length).map(p => p.naam) };
}

const NL_MND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const dagKort = d => (/^\d{4}-\d{2}-\d{2}/.test(String(d || '')) ? Number(String(d).slice(8, 10)) + ' ' + NL_MND[Number(String(d).slice(5, 7)) - 1] : '');
const tijdKort = t => (t ? dagKort(t) + ' ' + String(t).slice(11, 16) + ' UTC' : '');
const num = n => (n == null ? '' : String(Math.round(n * 100) / 100).replace('.', ','));

export function dashTekst(d, alleen) {
  const r = ['DASHBOARD ALLE PROJECTEN, ' + d.vandaag + ' (Curaçao). Bron: ' + HOST + '/api/mm/dashboard', ''];
  if (!alleen) { r.push('WAT KOMT ERAAN'); for (const a of d.agenda.slice(0, 20)) r.push('- ' + dagKort(a.d) + (a.telaat ? ' (te laat)' : '') + ' | ' + a.naam + ': ' + a.t); r.push(''); }
  for (const p of d.projecten.filter(x => !alleen || x.id === alleen)) {
    r.push('## ' + p.naam + ' (' + p.id + ')'); if (p.wat) r.push(p.wat);
    r.push('Doel: ' + (p.doel || 'niet gezet'));
    if (p.pct != null) r.push('Voortgang: ' + num(p.nu) + ' van ' + num(p.doelgetal) + ' ' + p.eenheid + ' = ' + p.pct + '%' + (p.gemeten ? ' (gemeten ' + p.gemeten + ')' : ''));
    if (p.plan.length) { r.push('Planning:'); for (const x of p.plan) r.push('- ' + (x.klaar ? '[af] ' : '[open] ') + (x.d ? dagKort(x.d) + ': ' : '') + x.t); }
    for (const o of p.overdracht) r.push('Overdracht: ' + o[0] + ' ' + o[1]);
    if (p.stand) for (const s of p.stand.regels) r.push('Stand: ' + s);
    if (p.log.length) { r.push('Logboek:'); for (const x of p.log.slice(0, alleen ? 25 : 5)) r.push('- ' + tijdKort(x.t) + ' [' + x.wie + '] ' + x.tekst); }
    r.push('');
  }
  if (!alleen && d.archief.length) r.push('Gearchiveerd (niet in het overzicht): ' + d.archief.map(a => a.naam + ' (' + a.id + ')').join(', '), '');
  r.push('Bijwerken: ' + HOST + '/api/mm/dashboard?zet=<JSON> met {"project":"<id>","nu":<getal>,"klaar":"<tekst of datum>","erbij":{"d":"JJJJ-MM-DD","t":"wat"},"doel":"..."}; logboek: ' + HOST + '/api/mm/handover?log=<tekst>&wie=<project>-<chat>');
  return r.join('\n') + '\n';
}

const CSS = ':root{--bg:#fff;--ink:#0B1640;--accent:#2B47C4;--on:#fff;--soft:#EEF1FC;--line:#D3DAF4}'
  + '@media (prefers-color-scheme:dark){:root{--bg:#0A1030;--ink:#EEF1FC;--accent:#9DB0FF;--on:#0A1030;--soft:#141D4A;--line:#2A3670;color-scheme:dark}}'
  + '*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}'
  + 'body{margin:0;background:var(--bg);color:var(--ink);font:400 18px/1.55 "Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}'
  + '.w{max-width:680px;margin:0 auto;padding:18px max(16px,env(safe-area-inset-left,0px)) 56px;display:flex;flex-direction:column;gap:30px}'
  + 'header{display:flex;align-items:center;justify-content:space-between;gap:12px}.merk{font-weight:700;letter-spacing:-.01em;color:var(--ink);text-decoration:none}.meta{color:var(--accent)}'
  + 'h1,h2,h3{margin:0;text-wrap:balance}h1{font-size:40px;line-height:1.08;font-weight:700;letter-spacing:-.025em}h2{font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-.015em}h3{font-size:18px;line-height:1.4;font-weight:700}'
  + 'p{margin:0}a{color:var(--accent);text-underline-offset:4px;text-decoration-thickness:1px}'
  + 'section{display:flex;flex-direction:column;gap:14px}'
  + '.lijst{display:flex;flex-direction:column;border-top:1px solid var(--line)}'
  + '.rij{display:grid;grid-template-columns:1fr auto;gap:2px 16px;padding:14px 0;border-bottom:1px solid var(--line);text-decoration:none;color:var(--ink)}.rij b{font-weight:700}.rij .pct{color:var(--accent);font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}.rij span{grid-column:1/-1;color:var(--accent)}.rij .balk{grid-column:1/-1}'
  + '.balk{height:8px;border-radius:999px;background:var(--soft);overflow:hidden;margin-top:6px}.balk i{display:block;height:100%;border-radius:999px;background:var(--accent)}'
  + '.agenda div{display:grid;grid-template-columns:76px 1fr;gap:2px 14px;padding:13px 0;border-bottom:1px solid var(--line)}.agenda b{color:var(--accent);font-variant-numeric:tabular-nums}.agenda a{font-weight:700;color:var(--ink)}'
  + 'details{border:1px solid var(--line);border-radius:16px;background:var(--bg)}details[open]{padding-bottom:18px}summary{cursor:pointer;padding:18px;font-weight:700;display:flex;justify-content:space-between;gap:14px;list-style:none}summary::-webkit-details-marker{display:none}summary .pct{color:var(--accent);font-variant-numeric:tabular-nums}'
  + '.in{padding:0 18px;display:flex;flex-direction:column;gap:22px}.blok{display:flex;flex-direction:column;gap:8px}'
  + '.groot{font-size:40px;font-weight:700;letter-spacing:-.03em;line-height:1.05;font-variant-numeric:tabular-nums}'
  + '.plan{display:flex;flex-direction:column;border-top:1px solid var(--line)}.plan div{display:grid;grid-template-columns:76px 1fr;gap:14px;padding:11px 0;border-bottom:1px solid var(--line)}.plan b{color:var(--accent);font-variant-numeric:tabular-nums}.plan .af span{text-decoration:line-through}'
  + '.log{display:flex;flex-direction:column;gap:14px}.log div{border-left:3px solid var(--accent);padding-left:16px;overflow-wrap:anywhere}.log b{display:block;color:var(--accent);font-weight:600}'
  + '.knoppen{display:flex;flex-wrap:wrap;gap:10px}.btn{background:var(--accent);color:var(--on);border:0;border-radius:999px;padding:13px 22px;font:inherit;font-weight:700;line-height:1.2;text-decoration:none;text-align:center}.btn.rand{background:var(--bg);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}'
  + '.link{color:var(--accent);font-weight:600;text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:1px;align-self:flex-start}'
  + '.tool{background:var(--soft);border-radius:18px;padding:22px;display:flex;flex-direction:column;gap:10px}'
  + 'footer{padding-top:18px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px}'
  + ':focus-visible{outline:2px solid var(--accent);outline-offset:3px}'
  + '@media (max-width:480px){h1{font-size:32px}h2{font-size:23px}.groot{font-size:30px}.btn{flex:1 1 100%}}';

export function dashHtml(d, melding) {
  const balk = p => (p.pct == null ? '' : '<div class="balk" role="img" aria-label="' + p.pct + ' procent"><i style="width:' + p.pct + '%"></i></div>');
  const onder = p => [p.pct == null ? (p.doel ? 'Doel gezet, meting volgt' : 'Doel nog zetten') : '', p.open.length ? p.open.length + ' open' + (p.telaat ? ', ' + p.telaat + ' te laat' : '') : '', p.laatste ? 'laatste werk ' + dagKort(p.laatste) : ''].filter(Boolean).join(' · ');
  const rij = p => '<a class="rij" href="#' + esc(p.id) + '"><b>' + esc(p.naam) + '</b>' + (p.pct != null ? '<i class="pct" style="font-style:normal">' + p.pct + '%</i>' : '<i></i>') + (onder(p) ? '<span>' + esc(onder(p)) + '</span>' : '') + balk(p) + '</a>';
  const blok = (k, h) => (h ? '<div class="blok"><h3>' + k + '</h3>' + h + '</div>' : '');
  const kaart = p => '<details id="' + esc(p.id) + '"><summary><span>' + esc(p.naam) + '</span>' + (p.pct != null ? '<span class="pct">' + p.pct + '%</span>' : '') + '</summary><div class="in">'
    + (p.wat ? '<p>' + esc(p.wat) + '</p>' : '')
    + blok('Doel', '<p>' + (p.doel ? esc(p.doel) : 'Zeg het doel in een chat, dan staat het hier.') + '</p>')
    + (p.pct != null ? blok('Voortgang', '<p class="groot">' + esc(num(p.nu)) + ' van ' + esc(num(p.doelgetal)) + '</p><p>' + esc(p.eenheid) + (p.gemeten ? ', gemeten ' + esc(p.gemeten) : '') + '</p>' + balk(p)) : '')
    + (p.plan.length ? blok('Planning', '<div class="plan">' + p.plan.map(x => '<div' + (x.klaar ? ' class="af"' : '') + '><b>' + (x.klaar ? 'Af' : (x.d ? esc(dagKort(x.d)) : 'Open')) + '</b><span>' + esc(x.t) + (!x.klaar && x.d && x.d < d.vandaag ? ' (te laat)' : '') + '</span></div>').join('') + '</div>') : '')
    + (p.stand && p.stand.regels.length ? blok('Stand van het project zelf', '<div class="log">' + p.stand.regels.map(s => '<div>' + esc(s) + '</div>').join('') + '</div>') : '')
    + blok('Overdracht', '<p class="knoppen">' + p.overdracht.map(o => '<a class="btn" href="' + esc(o[1]) + '">' + esc(o[0]) + '</a>').join('') + (p.site ? '<a class="btn rand" href="' + esc(p.site) + '">Naar de site</a>' : '') + '</p>')
    + blok('Logboek', p.log.length ? '<div class="log">' + p.log.map(x => '<div><b>' + esc(tijdKort(x.t)) + ' · ' + esc(x.wie) + '</b>' + esc(x.tekst) + '</div>').join('') + '</div>' : '<p>Chats schrijven hier met de naam ' + esc(p.logs[0]) + '-&lt;chat&gt;.</p>')
    + '<a class="link" href="?archiveer=' + esc(p.id) + '">Archiveer ' + esc(p.naam) + '</a>'
    + '</div></details>';
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><title>Dashboard alle projecten</title>'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap">'
    + '<style>' + CSS + '</style></head><body><div class="w"><header><a class="merk" href="?">Dashboard</a><span class="meta">' + esc(dagKort(d.vandaag)) + '</span></header>'
    + (melding ? '<div class="tool"><p>' + esc(melding.tekst) + '</p>' + (melding.terug ? '<a class="link" href="?terug=' + esc(melding.terug) + '">Toch terugzetten</a>' : '') + '</div>' : '')
    + '<section><h1>Alle projecten</h1><p>Tik op een project voor doel, voortgang, planning, overdracht en logboek.</p><div class="lijst">' + d.projecten.map(rij).join('') + '</div></section>'
    + (d.agenda.length ? '<section><h2>Wat komt eraan</h2><div class="lijst agenda">' + d.agenda.slice(0, 20).map(a => '<div><b>' + esc(dagKort(a.d)) + '</b><span><a href="#' + esc(a.id) + '">' + esc(a.naam) + '</a>' + (a.telaat ? ' (te laat)' : '') + '<br>' + esc(a.t) + '</span></div>').join('') + '</div></section>' : '')
    + '<section><h2>Per project</h2>' + d.projecten.map(kaart).join('') + '</section>'
    + (d.archief.length ? '<section><h2>Archief</h2><div class="lijst">' + d.archief.map(a => '<div class="rij"><b>' + esc(a.naam) + '</b><a href="?terug=' + esc(a.id) + '">Terugzetten</a>' + (a.sinds ? '<span>Gearchiveerd ' + esc(dagKort(a.sinds)) + '</span>' : '') + '</div>').join('') + '</div></section>' : '')
    + '<footer><p>Voor chats: <a href="?vorm=tekst">het dashboard als tekst</a>. Bijwerken met dashboard?zet=&lt;JSON&gt; (doel, nu, klaar, erbij, plan, archief). Logboek met handover?log=&lt;tekst&gt;&amp;wie=&lt;project&gt;-&lt;chat&gt;.</p></footer></div>'
    + '<script>function o(){var h=location.hash.slice(1);if(!h)return;var e=document.getElementById(h);if(e&&e.tagName==="DETAILS"){e.open=true;e.scrollIntoView()}}addEventListener("hashchange",o);o()</script>'
    + '</body></html>';
}
