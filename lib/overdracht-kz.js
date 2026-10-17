// Levende overdracht keuzehulpen (Henkjan 16 okt 2026: "complete handover in Vercel zodat de andere chat alles kan doen;
// werk daar altijd status bij; handover is altijd actueel"). Vaste tekst uit lib/overdracht-kz-tekst.js plus bij elke opvraag
// de actuele cijfers uit de database. Lezen: https://hjdk-api-henq.vercel.app/api/kz?op=overdracht
import { kv } from './db.js';
import { TEKST } from './overdracht-kz-tekst.js';
import { stand } from './zicht.js';
import { socialCatalog } from './social-keuzehulpen.js';
import { usageHistory, usageDay } from './guide-usage.js';
import { viewCounts } from './vindbaarheid.js';
import vercel from '../vercel.json' with { type: 'json' };

const DAG = () => new Date().toISOString().slice(0, 10);
const veilig = async (f, d) => { try { return await f(); } catch (e) { return d; } };

export async function overdrachtKz() {
  const nu = new Date().toISOString().slice(0, 16).replace('T', ' '); const d = DAG(); const r = [];
  r.push('# Keuzehulpen: overdracht (live, ' + nu + ' UTC)', '');
  r.push('Deze pagina wordt bij elke opvraag opnieuw opgebouwd: de vaste werkinstructie uit de repo (lib/overdracht-kz-tekst.js) plus de cijfers van dit moment. Werk je iets bij, zet het dan in dezelfde commit in het logboek van dat bestand.', '');
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || ''; const msg = String(process.env.VERCEL_GIT_COMMIT_MESSAGE || '').split('\n')[0];
  if (sha) r.push('Live versie: ' + sha.slice(0, 7) + (msg ? ' (' + msg.slice(0, 160) + ')' : ''), '');

  // ---- keuzehulpen vandaag ----
  r.push('## Stand nu: keuzehulpen', '');
  const plan = await veilig(() => kv.get('hjdk:kz:maak:plan:' + d), null);
  const log = (await veilig(() => kv.get('hjdk:kz:maak:log'), [])) || [];
  if (plan) {
    const klaar = (plan.klaar || []).map(x => x.slug || x); const mis = (plan.mislukt || []).map(m => m.slug + ' (' + String(m.waarom || '').slice(0, 50) + ')');
    r.push('- Vandaag gemaakt: ' + klaar.length + (klaar.length ? ': ' + klaar.join(', ') : ''));
    if (mis.length) r.push('- Vandaag afgevallen: ' + mis.slice(0, 8).join('; '));
    const open = (plan.lijst || []).filter(x => !klaar.includes(x.slug) && !(plan.mislukt || []).some(m => m.slug === x.slug)).slice(0, 10).map(x => x.slug);
    if (open.length) r.push('- Nog in het plan: ' + open.join(', '));
  } else r.push('- Vandaag nog geen plan (de dagronde begint om 03:00 UTC).');
  const laatste = log.find(x => x.stap === 'maak' && x.ok); if (laatste) r.push('- Laatst gemaakt: ' + laatste.url + ' (' + String(laatste.at).slice(0, 16).replace('T', ' ') + ' UTC)');
  const fout = log.find(x => x.ok === false && x.stap !== 'maak'); if (fout) r.push('- Laatste fout in de bouwmotor: ' + fout.stap + ': ' + String(fout.waarom || '').slice(0, 120) + ' (' + String(fout.at).slice(0, 16) + ')');
  r.push('');

  // Dagmeting: Curaçao, elke opvraag actueel; nooit ontbrekende historie als nul presenteren.
  r.push('## Dagmeting verkeer en gebruik (Curaçao)', '');
  const totals = await Promise.allSettled(['nl','us','de'].map(m => socialCatalog(m)));
  let total = 0;
  ['keuzehulp.best','whichtobuy.best','kaufberater.best'].forEach((host,i) => { const n = totals[i].status === 'fulfilled' ? totals[i].value.length : null; if(n!==null)total+=n; r.push('- '+host+': '+(n===null?'onbekend':n)+' keuzehulpen.'); });
  r.push('- Totaal: '+(totals.every(x=>x.status==='fulfilled')?total:'onvolledig bekend')+' keuzehulpen.');
  const today = usageDay();
  const start = await veilig(() => kv.get('guide:tracking-since'), null);
  r.push('- Gebruiksmeting gestart: '+(start || 'bij de eerste gemeten interactie na deze uitrol')+'. Vandaag '+today+' is een lopende dag. Geen terugwerkende meting.');
  const days = await veilig(() => usageHistory(7), null);
  if(days)for(const day of days){
    r.push('### '+day.day+(day.day===today?' (lopend)':''));
    for(const site of ['kz','us','de']){
      const allRows=day.sites[site],rows=allRows.filter(x=>x.slug!=='__fp'),fpViews=allRows.find(x=>x.slug==='__fp')?.view||0,sum=k=>rows.reduce((n,x)=>n+(x[k]||0),0);
      const sources=await veilig(()=>viewCounts(site,day.day),null);
      const measured=start&&day.day>=usageDay(new Date(start));
      r.push('- '+site+': externe bronweergaven '+(sources===null?'onbekend':sources.reduce((n,x)=>n+x.views,0))+'; '+(measured?'FP-weergaven '+fpViews+', gidsweergaven '+sum('view')+', gebruik '+sum('use')+', daarvan vanuit FP '+sum('fpUse')+', geldig voor trending '+sum('eligible'):'nieuwe gebruiksmeting nog niet actief op deze dag')+'.');
    }
  }else r.push('- Dagmetingen tijdelijk niet beschikbaar.');
  r.push('- Gebruik = antwoord kiezen of adviesformulier verzenden, maximaal eenmaal per keuzehulp per tabsessie per dag. Geen unieke personen. Trending: laatste 7 dagen, minimaal 3 geldige gebruiken; FP-herkomst, intern doorklikken, betaald verkeer en herkende bots uitgesloten. FP-herkomst blijft 30 minuten in de tabsessie bewaard.');
  r.push('- Dagrapport en archief: https://keuzehulp.best/api/vindbaarheid (JSON met guideUsage: ?format=json). Dagtellers blijven 45 dagen bewaard; dagelijkse snapshots via de bestaande Vercel-rapporttaak.', '');

  // ---- ZICHT per site ----
  r.push('## Stand nu: vindbaarheid en AI per site', '');
  const st = await veilig(() => stand(), {});
  for (const [id, s] of Object.entries(st || {})) {
    const l = s.laatste || {}; const g = l.gsc || {}; const ix = l.index || {}; const b = l.bezoek || {};
    r.push('- ' + (s.host || id) + ' (meting ' + (l.dag || '?') + '): Google ' + (g.imp ?? '?') + ' vertoningen en ' + (g.clicks ?? '?') + ' kliks in 28 dagen; ' + (ix.geindexeerd != null ? ix.geindexeerd + ' van ' + (ix.bekeken || ix.inSitemap) + ' gecontroleerde pagina\'s in Google' : 'indexstand onbekend') + '; bezoekers uit zoek ' + (b.zoek ?? '?') + ' en uit AI ' + (b.ai ?? '?') + ' (7 dagen); genoemd door Perplexity in ' + (l.llmRate != null ? Math.round(l.llmRate * 100) + '%' : '?') + ' van de testvragen' + ((l.winnaars || []).length ? '; AI noemt wel: ' + l.winnaars.slice(0, 4).map(w => w[0]).join(', ') : '') + '.');
  }
  r.push('');

  // ---- proeven ----
  r.push('## Lopende en afgeronde proeven', '');
  for (const id of ['kz', 'us', 'de']) {
    const list = (await veilig(() => kv.get('zicht:exp:' + id), [])) || [];
    const loopt = list.filter(p => p.status === 'loopt'); const klaar = list.filter(p => p.status !== 'loopt').slice(0, 5);
    if (!list.length) continue;
    r.push('- ' + id + ': ' + loopt.length + ' lopend' + (klaar.length ? ', laatst beoordeeld: ' + klaar.map(p => p.les + ' ' + (p.uitslag || p.status) + (p.effect != null ? ' (' + Math.round(p.effect * 100) + '%)' : '')).join('; ') : ''));
    loopt.slice(0, 8).forEach(p => r.push('  - ' + p.les + ': ' + (p.wat || '').slice(0, 110) + ' | meet ' + p.metric + ', start ' + p.start + ', uitslag ' + p.klaar + ' | ' + (p.urls || []).length + ' pagina\'s' + ((p.controle || []).length ? ' tegen ' + p.controle.length + ' controle' : '')));
  }
  r.push('');

  // ---- gatscans ----
  const scans = await veilig(async () => { const l = (await kv.raw(['LRANGE', 'zicht:gapscan:index', '0', '30'])) || []; const u = [...new Set(l)]; return (u.length ? u : ['maat', 'budget', 'situatie', 'cadeau'].map(n => 'zicht:gapscan:2026-10-17:' + n)).slice(0, 6); }, []);
  if (scans.length) {
    r.push('## Laatste gatscans (AI-antwoorden op keuzevragen)', '');
    for (const k of scans) { const s = await veilig(() => kv.get(k), null); if (!s) continue; r.push('- ' + k.replace('zicht:gapscan:', '') + ': ' + s.gelukt + ' vragen; met prijs ' + s.metPrijs + ', met maat/getal ' + s.metGetal + ', zonder lokale bron ' + s.zonderLokaleBron + '; zwakst: ' + (s.zwaksteEerst || []).slice(0, 3).map(x => '"' + x.vraag + '" (' + x.bronnen.slice(0, 2).join(', ') + ')').join('; ')); }
    r.push('');
  }

  // ---- automatische rondes ----
  r.push('## Automatische rondes (crons in vercel.json, UTC)', '');
  (vercel.crons || []).filter(c => /kzmaak|\/kz\/|zicht|gsc|wtbmaak|bol\/learn/.test(c.path)).forEach(c => r.push('- ' + c.schedule + '  ' + c.path));
  r.push('');
  r.push(TEKST.trim(), '');
  r.push('## Snelle links', '', '- Deze overdracht: https://hjdk-api-henq.vercel.app/api/kz?op=overdracht', '- Keuzehulpen vandaag: https://hjdk-api-henq.vercel.app/api/kzmaak?op=kort', '- ZICHT draaiboek: https://hjdk-api-henq.vercel.app/api/zicht?op=draaiboek&t=1', '- ZICHT stand: https://hjdk-api-henq.vercel.app/api/zicht?op=stand', '- Search Console stand: https://hjdk-api-henq.vercel.app/api/gsc?op=status', '- Indexcheck: https://hjdk-api-henq.vercel.app/api/gsc?op=index&site=kz (us, de)', '- Bol-overdracht: https://hjdk-api-henq.vercel.app/api/bol/overdracht', '- Clickmind-overdracht: https://hjdk-api-henq.vercel.app/api/mm/overdracht', '');
  return r.join('\n');
}

