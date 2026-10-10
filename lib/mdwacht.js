// VERSPILLINGSWACHT MONDIAD (Henkjan 10 okt: "zodat we nooit verspillen"). Elke 10 minuten via Vercel Cron (/api/md/wacht).
// Zelfde regels als de wacht van PropellerAds (propellerads-mcp lib/ronde.ts) en RichAds (richads-mcp /api/wacht):
//  - campagne met minstens 3 conversies: zone weg bij geld zonder conversie (min. $0.50 en 2x de gemiddelde kosten per
//    conversie) of bij meer dan 3x de gemiddelde kosten per conversie (min. $1);
//  - anders: zone weg bij min. $0.08 en een klikprijs hoger dan 2,5x het campagnegemiddelde, of $0.05 zonder klik.
// Alleen de zwarte lijst aanvullen: nooit pauzeren, nooit bod of budget wijzigen.
// Overgeslagen: campagnes met een eigen lus (SHOP-LUS, TODAYIN, keuzehulp, finds.email, Outnamed) en campagnes met een witte lijst.
import { kv } from './db.js';
import { md } from './mdmcp.js';

const R = { minConversies: 3, convMinKosten: 0.5, convFactor: 3, duurMinKosten: 0.08, duurFactor: 2.5, leegMinKosten: 0.05, dagen: 3, minCampagneKosten: 0.08, maxPerRonde: 40 };
const EIGEN_LUS = /SHOP-LUS|TODAYIN|OUTNAME/i;
// Campagnes met een eigen lus die zones beoordeelt op eigen metingen: keuzehulp (api/md.js), finds.email en Outnamed (eigen cloudtaken).
const EIGEN_URL = /keuzehulp|finds\.email|outname\.now/i;
const LOG = 'hjdk:md:wacht:log', SLOT = 'hjdk:md:wacht:slot';
const num = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dag = (o = 0) => new Date(Date.now() - o * 864e5).toISOString().slice(0, 10);
const rows = x => (Array.isArray(x) ? x : Array.isArray(x && x.data) ? x.data : Array.isArray(x && x.items) ? x.items : Array.isArray(x && x.rows) ? x.rows : Array.isArray(x && x.content) ? x.content : []);

export function zoneOordeel(a, g) {
  if (g.conv >= R.minConversies && g.kosten > 0) {
    const cpa = g.kosten / g.conv;
    if (a.conv === 0 && a.kosten >= Math.max(R.convMinKosten, 2 * cpa)) return '$' + a.kosten.toFixed(2) + ' zonder conversie (gemiddeld $' + cpa.toFixed(2) + ')';
    if (a.conv > 0 && a.kosten >= Math.max(1, R.convFactor * cpa) && a.kosten / a.conv > R.convFactor * cpa) return '$' + (a.kosten / a.conv).toFixed(2) + ' per conversie';
    return '';
  }
  if (g.kliks <= 0) return '';
  const gem = g.kosten / g.kliks;
  if (a.kliks === 0 && a.kosten >= R.leegMinKosten) return '$' + a.kosten.toFixed(2) + ' zonder klik';
  if (a.kliks > 0 && a.kosten >= R.duurMinKosten && a.kosten / a.kliks > R.duurFactor * gem) return 'klikprijs ' + (a.kosten / a.kliks / gem).toFixed(1) + 'x het gemiddelde';
  return '';
}

export async function mdWacht(droog) {
  const start = Date.now();
  const uit = { tijd: new Date().toISOString(), stand: droog ? 'proef' : 'live', campagnes: [], fouten: [] };
  if (!droog) { const s = await kv.get(SLOT); if (s && Date.now() - s < 540000) return Object.assign(uit, { overgeslagen: 'wacht loopt al' }); await kv.set(SLOT, Date.now(), { ex: 600 }); }
  try {
    // 1. welke campagnes gaven de laatste 3 dagen geld uit
    const rep = rows(await md('mondiad_campaign_report', { startDate: dag(R.dagen - 1), endDate: dag(0), breakdown: 'CAMPAIGN', size: 500, sortBy: 'SPENT', sortDirection: 'DESC' }));
    const kosten = {}; for (const r of rep) kosten[String(r.campaignId)] = { kliks: num(r.clicks), kosten: num(r.spent), conv: num(r.conversions) };
    const lijst = rows(await md('mondiad_list_campaigns', { statuses: ['RUNNING', 'DAILY_LIMIT_REACHED', 'OFF_SCHEDULE', 'OFF_ACCOUNT_BUDGET'], size: 500, responseFields: ['ID', 'NAME', 'STATUS', 'BID_TYPE', 'URL'] }));
    const doel = lijst.filter(c => { const k = kosten[String(c.id)]; return k && k.kosten >= R.minCampagneKosten; })
      .sort((a, b) => kosten[String(b.id)].kosten - kosten[String(a.id)].kosten);
    for (const c of doel) {
      const naam = String(c.name || ''), g = kosten[String(c.id)];
      if (EIGEN_LUS.test(naam) || EIGEN_URL.test(String(c.url || ''))) { uit.campagnes.push({ id: c.id, naam, overgeslagen: 'eigen lus' }); continue; }
      if (Date.now() - start > 240000) { uit.fouten.push('tijd op; rest volgende ronde'); break; }
      try {
        const zr = rows(await md('mondiad_campaign_report', { startDate: dag(R.dagen - 1), endDate: dag(0), breakdown: 'ZONE_ID', campaignId: c.id, size: 500, sortBy: 'SPENT', sortDirection: 'DESC' }));
        const weg = [];
        for (const r of zr) {
          const a = { kliks: num(r.clicks), kosten: num(r.spent), conv: num(r.conversions) };
          const reden = zoneOordeel(a, g);
          if (reden && r.zoneId) weg.push({ zone: Number(r.zoneId), reden, kosten: Math.round(a.kosten * 100) / 100 });
        }
        const regel = { id: c.id, naam, kliks: g.kliks, kosten: Math.round(g.kosten * 100) / 100, conversies: g.conv, zones: zr.length, teBlokkeren: weg.length };
        if (weg.length) {
          const det = (rows(await md('mondiad_get_campaign_details', { ids: [String(c.id)] })) || [])[0] || {};
          const mode = String(det.zoneIdListMode || '');
          const cur = (det.zoneIdList || []).map(Number);
          if (/white/i.test(mode) && cur.length) { regel.overgeslagen = 'witte lijst'; uit.campagnes.push(regel); continue; }
          const bestaand = new Set(cur);
          const nieuw = weg.filter(w => !bestaand.has(w.zone)).slice(0, R.maxPerRonde);
          regel.nieuw = nieuw.slice(0, 15);
          if (nieuw.length && !droog) {
            await md('mondiad_update_campaign', { json: JSON.stringify({ id: c.id, zoneIdList: [...cur, ...nieuw.map(w => w.zone)], zoneIdListMode: 'BLACK_LIST' }) });
            const na = (rows(await md('mondiad_get_campaign_details', { ids: [String(c.id)] })) || [])[0] || {};
            const naSet = new Set((na.zoneIdList || []).map(Number));
            const kwijt = nieuw.filter(w => !naSet.has(w.zone)).length;
            regel.actie = kwijt ? 'FOUT: ' + kwijt + ' zones ontbreken na het schrijven' : '+' + nieuw.length + ' zones geblokkeerd';
            if (kwijt) uit.fouten.push('campagne ' + c.id + ': ' + kwijt + ' zones ontbreken na het schrijven');
          } else regel.actie = nieuw.length ? 'zou +' + nieuw.length + ' blokkeren' : 'al op orde';
        }
        uit.campagnes.push(regel);
      } catch (e) { uit.fouten.push('campagne ' + c.id + ': ' + String(e.message || e).slice(0, 200)); }
    }
    const geblokt = uit.campagnes.reduce((s, x) => s + num(((x.actie || '').match(/^\+(\d+)/) || [])[1]), 0);
    uit.samenvatting = uit.stand + ' | ' + doel.length + ' campagnes met uitgave | ' + geblokt + ' zones geblokkeerd | ' + uit.fouten.length + ' fouten';
  } catch (e) {
    uit.fouten.push(String(e.message || e).slice(0, 300));
    uit.samenvatting = uit.stand + ' | FOUT: ' + String(e.message || e).slice(0, 120);
  } finally {
    if (!droog) { try { await kv.set(SLOT, 0, { ex: 5 }); } catch (e) {} }
  }
  uit.duurMs = Date.now() - start;
  console.log('[md-wacht] ' + uit.samenvatting);
  if (!droog) { try { const l = (await kv.get(LOG)) || []; l.unshift({ tijd: uit.tijd, samenvatting: uit.samenvatting, acties: uit.campagnes.filter(x => x.actie && x.actie !== 'al op orde').map(x => x.id + ' ' + x.actie), fouten: uit.fouten }); await kv.set(LOG, l.slice(0, 300)); } catch (e) {} }
  return uit;
}
