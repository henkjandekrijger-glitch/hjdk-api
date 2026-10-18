// BUDGETWACHT-KOPPELING MONDIAD (Henkjan 17 okt 2026: "max 100 per dag als er geen gegarandeerde omzet tegenover staat").
// De centrale budgetwacht (propellerads-mcp lib/budget.ts) telt de uitgaven van alle netwerken samen per budgetdag (de
// PropellerAds-dag, vanaf 05:00 UTC). De Mondiad-wacht (lib/mdwacht.js) stuurt in zijn melding (POST /api/wachtlog) het veld
// uitgaven mee: [{cid, naam, kosten (USD vandaag), omzet (gegarandeerd, USD, standaard 0), loopt}] en krijgt terug:
// budget {stand: ok|let-op|stop, stop: [cid], herstart: [cid], tekst}. Deze module voert dat uit: stop -> pauzeren,
// herstart -> weer aanzetten (alleen campagnes die de budgetwacht eerder zelf stopte), daarna de status controleren.
// De uitkomst gaat in de acties/fouten van de volgende melding. Dit is de enige uitzondering op "nooit pauzeren" in de wacht.
// De budgetwacht geeft een stop of herstart maar een keer door; lukt het hier niet, dan onthoudt deze module hem zelf
// (hjdk:md:budget:open) en probeert hij het de volgende rondes opnieuw (hooguit 6 keer).
// kv en de schakelaar komen als argument binnen (zo is dit droog te testen zonder Redis of Mondiad).

const P = 'hjdk:md:budget:';
const MAX_POGINGEN = 6;
const r2 = x => Math.round(x * 100) / 100;
const fm = e => String((e && e.message) || e).slice(0, 200);
const wacht = ms => new Promise(r => setTimeout(r, ms));

// Alleen campagnes met kosten vandaag, afgerond, in het formaat van het contract.
export function schoonUitgaven(lijst) {
  return (lijst || []).filter(u => u && Number.isFinite(u.kosten) && u.kosten > 0)
    .map(u => ({ cid: String(u.cid), naam: String(u.naam || '').slice(0, 160), kosten: r2(u.kosten), omzet: r2(Math.max(0, Number(u.omzet) || 0)), loopt: !!u.loopt }));
}

// Acties en fouten van de vorige ronde (stop/herstart door de budgetwacht), voor deze melding; daarna gewist.
export async function leesVerslag(kv) {
  try {
    const v = await kv.get(P + 'verslag');
    if (!v) return { acties: [], fouten: [] };
    await kv.del([P + 'verslag']);
    return { acties: Array.isArray(v.acties) ? v.acties.map(String) : [], fouten: Array.isArray(v.fouten) ? v.fouten.map(String) : [] };
  } catch (e) { return { acties: [], fouten: [] }; }
}
async function bewaarVerslag(kv, acties, fouten) {
  if (!acties.length && !fouten.length) return;
  await kv.set(P + 'verslag', { tijd: new Date().toISOString(), acties: acties.slice(0, 20), fouten: fouten.slice(0, 10) }, { ex: 86400 });
}

// sch = { statussen(ids) -> Map(id -> 'aan' | 'uit' | andere tekst), pauzeer(id), zetAan(id), laterGestopt(id, sindsMs) -> reden of '' }
export async function voerBudgetUit(kv, budget, sch, namen) {
  if (!budget) return null;
  const uit = { stand: String(budget.stand || '?'), tekst: String(budget.tekst || budget.fout || ''), gestopt: [], weerAan: [], acties: [], fouten: [] };
  if (budget.fout) { uit.fouten.push('budgetwacht: ' + String(budget.fout).slice(0, 200)); await bewaarVerslag(kv, uit.acties, uit.fouten).catch(() => null); return uit; }
  const dag = String(budget.dag || '');
  let open = null;
  try { open = await kv.get(P + 'open'); } catch (e) {}
  open = Object.assign({ dag: '', stop: {}, herstart: {} }, open || {});
  if (open.dag !== dag) open.stop = {}; // nieuwe budgetdag: oude stops niet meer doorzetten (de budgetwacht begint opnieuw)
  open.dag = dag;
  for (const c of (budget.stop || []).map(String)) if (!open.stop[c]) open.stop[c] = { naam: (namen && namen.get(c)) || '', pogingen: 0 };
  if (uit.stand !== 'stop') for (const c of (budget.herstart || []).map(String)) if (!open.herstart[c]) open.herstart[c] = { pogingen: 0, sinds: new Date().toISOString() };
  for (const c of Object.keys(open.stop)) delete open.herstart[c]; // wat nu gestopt moet worden, gaat niet ook weer aan
  for (const [c, h] of Object.entries(open.herstart)) if (Date.now() - Date.parse(h.sinds) > 2 * 86400000) { delete open.herstart[c]; uit.fouten.push('budgetwacht: herstart campagne ' + c + ' na 2 dagen opgegeven (nog niet weer aan)'); }
  const bewaarOpen = async () => {
    if (!Object.keys(open.stop).length && !Object.keys(open.herstart).length) await kv.del([P + 'open']);
    else await kv.set(P + 'open', open, { ex: 3 * 86400 });
  };
  const stopIds = Object.keys(open.stop).map(Number).filter(x => Number.isInteger(x) && x > 0);
  const herIds = uit.stand === 'stop' ? [] : Object.keys(open.herstart).map(Number).filter(x => Number.isInteger(x) && x > 0);
  if (!stopIds.length && !herIds.length) { await bewaarOpen().catch(() => null); return uit; }

  let voor;
  try { voor = await sch.statussen([...stopIds, ...herIds]); }
  catch (e) { uit.fouten.push('budgetwacht: status lezen mislukt, volgende ronde opnieuw: ' + fm(e)); await bewaarOpen().catch(() => null); await bewaarVerslag(kv, uit.acties, uit.fouten).catch(() => null); return uit; }
  const pog = (rec, c, wat, e) => { rec.pogingen++; uit.fouten.push('budgetwacht: ' + wat + ' campagne ' + c + ' mislukt (poging ' + rec.pogingen + ' van ' + MAX_POGINGEN + '): ' + fm(e)); return rec.pogingen >= MAX_POGINGEN; };
  const tekst = budget.ongedekt !== undefined && budget.grens !== undefined ? ' ($' + Number(budget.ongedekt).toFixed(2) + ' van $' + budget.grens + ' zonder gegarandeerde omzet)' : '';

  // stoppen
  const teStoppen = [];
  for (const cid of stopIds) {
    const c = String(cid), rec = open.stop[c], st = voor.get(cid) || 'onbekend';
    if (st === 'uit') { uit.acties.push(c + ' stond al uit (budgetwacht stop' + tekst + ')'); delete open.stop[c]; continue; }
    try { await sch.pauzeer(cid); teStoppen.push(cid); } catch (e) { if (pog(rec, c, 'stoppen', e)) delete open.stop[c]; }
  }
  // weer aanzetten
  const teStarten = [];
  for (const cid of herIds) {
    const c = String(cid), rec = open.herstart[c], st = voor.get(cid) || 'onbekend';
    if (st === 'aan') { uit.acties.push(c + ' staat al aan (budgetwacht herstart)'); delete open.herstart[c]; continue; }
    if (st !== 'uit') { uit.acties.push(c + ' niet weer aangezet (' + st + '; budgetwacht herstart)'); delete open.herstart[c]; continue; }
    let eigen = 0;
    try { const g = await kv.get(P + 'gestopt:' + c); eigen = g && g.tijd ? Date.parse(g.tijd) : 0; } catch (e) {}
    let later = '';
    try { later = sch.laterGestopt ? await sch.laterGestopt(cid, eigen) : ''; } catch (e) {}
    if (later) { uit.acties.push(c + ' niet weer aangezet: ' + later); delete open.herstart[c]; continue; }
    try { await sch.zetAan(cid); teStarten.push(cid); } catch (e) { if (pog(rec, c, 'weer aanzetten', e)) delete open.herstart[c]; }
  }

  // controleren (soms heeft het netwerk even nodig: na 2 seconden nog een keer)
  const controleer = async (ids, goed) => {
    if (!ids.length) return new Map();
    let na = await sch.statussen(ids);
    if (ids.some(id => !goed(na.get(id) || 'onbekend'))) { await wacht(2000); na = await sch.statussen(ids); }
    return na;
  };
  try {
    const na = await controleer(teStoppen, s => s !== 'aan');
    for (const cid of teStoppen) {
      const c = String(cid), s = na.get(cid) || 'onbekend';
      if (s !== 'aan') {
        uit.gestopt.push(c);
        uit.acties.push(c + ' gestopt door de budgetwacht' + tekst + (s !== 'uit' ? ', status nu ' + s : ''));
        await kv.set(P + 'gestopt:' + c, { tijd: new Date().toISOString(), dag }, { ex: 7 * 86400 }).catch(() => null);
        delete open.stop[c];
      } else if (open.stop[c] && pog(open.stop[c], c, 'stoppen', new Error('staat na het pauzeren nog aan'))) delete open.stop[c];
    }
  } catch (e) { uit.fouten.push('budgetwacht: controle na stoppen mislukt, volgende ronde opnieuw: ' + fm(e)); }
  try {
    const na = await controleer(teStarten, s => s !== 'uit');
    for (const cid of teStarten) {
      const c = String(cid), s = na.get(cid) || 'onbekend';
      if (s !== 'uit') {
        uit.weerAan.push(c);
        uit.acties.push(c + ' weer aan (budgetwacht, nieuwe budgetdag' + (s !== 'aan' ? ', status nu ' + s : '') + ')');
        await kv.del([P + 'gestopt:' + c]).catch(() => null);
        delete open.herstart[c];
      } else if (open.herstart[c] && pog(open.herstart[c], c, 'weer aanzetten', new Error('staat na het aanzetten nog uit'))) delete open.herstart[c];
    }
  } catch (e) { uit.fouten.push('budgetwacht: controle na aanzetten mislukt, volgende ronde opnieuw: ' + fm(e)); }

  await bewaarOpen().catch(e => uit.fouten.push('budgetwacht: open stappen bewaren mislukt: ' + fm(e)));
  await bewaarVerslag(kv, uit.acties, uit.fouten).catch(() => null);
  return uit;
}
