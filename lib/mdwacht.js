// VERSPILLINGSWACHT MONDIAD (Henkjan 10 okt: "zodat we nooit verspillen"). Elke 10 minuten via Vercel Cron (/api/md/wacht).
// Zelfde regels als de wacht van PropellerAds (propellerads-mcp lib/ronde.ts) en RichAds (richads-mcp /api/wacht):
//  - campagne met minstens 3 conversies: zone weg bij geld zonder conversie (min. $0.50 en 2x de gemiddelde kosten per
//    conversie) of bij meer dan 3x de gemiddelde kosten per conversie (min. $1);
//  - anders: zone weg bij min. $0.08 en een klikprijs hoger dan 2,5x het campagnegemiddelde, of $0.05 zonder klik.
// Alleen de zwarte lijst aanvullen: nooit pauzeren, nooit bod of budget wijzigen.
// Enige uitzondering: de budgetwacht (Henkjan 17 okt 2026: "max 100 per dag als er geen gegarandeerde omzet tegenover staat";
// lib/mdbudget.js). De melding draagt de uitgaven van vandaag per campagne mee; wat de budgetwacht in zijn antwoord laat stoppen
// of weer aanzetten, doet deze wacht (en controleert het). De uitkomst staat in de acties/fouten van de volgende melding.
//  - pop/CPM (geen kliks): dezelfde prijsregel op vertoningen; rereview: eigen zonemeting en aankomst (zie rereviewZones).
// Overgeslagen: campagnes met een eigen lus (SHOP-LUS, TODAYIN, keuzehulp, finds.email, Outnamed) en campagnes met een witte lijst.
import { kv } from './db.js';
import { md } from './mdmcp.js';
import { leesVerslag, schoonUitgaven, voerBudgetUit } from './mdbudget.js';

const R = { minConversies: 3, convMinKosten: 0.5, convFactor: 3, duurMinKosten: 0.08, duurFactor: 2.5, leegMinKosten: 0.05, dagen: 3, minCampagneKosten: 0.08, maxPerRonde: 40 };
// Centrale, lerende regels (propellerads-mcp lib/regels.ts): dezelfde drempels voor alle netwerken. Valt de bron weg,
// dan draait de wacht door op de standaardregels; hij valt nooit stil.
const CENTRAAL = (process.env.WACHT_CENTRAAL_URL || 'https://propellerads-mcp.vercel.app').replace(/\/$/, '');
async function centraleRegels() {
  try {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 6000);
    const r = await fetch(CENTRAAL + '/api/regels', { cache: 'no-store', signal: ac.signal }).finally(() => clearTimeout(t));
    if (!r.ok) return 'centrale regels gaven HTTP ' + r.status + ' (standaard gebruikt)';
    const j = await r.json();
    for (const k of ['minConversies', 'convMinKosten', 'convFactor', 'duurMinKosten', 'duurFactor', 'leegMinKosten']) { const v = Number(j && j.regels && j.regels[k]); if (Number.isFinite(v) && v > 0) R[k] = v; }
    return null;
  } catch (e) { return 'centrale regels niet bereikbaar (standaard gebruikt): ' + String(e.message || e).slice(0, 120); }
}
// Melden, plus de uitgaven van vandaag voor de budgetwacht (zonder uitgaven blijft de vorige melding daar staan).
// vorig = acties/fouten van de budgetwacht uit de vorige ronde. Geeft het budgetantwoord terug ({ fout } bij een fout).
async function meldCentraal(uit, geblokt, uitgaven, vorig) {
  try {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 15000);
    const r = await fetch(CENTRAAL + '/api/wachtlog', { method: 'POST', cache: 'no-store', signal: ac.signal, headers: { 'content-type': 'application/json', 'x-shop-sleutel': process.env.SHOP_SLEUTEL || '' },
      body: JSON.stringify(Object.assign({ net: 'mondiad', tijd: uit.tijd, samenvatting: uit.samenvatting, geblokkeerd: geblokt, fouten: vorig.fouten.concat(uit.fouten), acties: vorig.acties.concat(uit.campagnes.filter(x => x.actie && x.actie !== 'al op orde').map(x => x.id + ' ' + x.actie)).slice(0, 30) }, uitgaven ? { uitgaven } : {})) }).finally(() => clearTimeout(t));
    const j = await r.json().catch(() => null);
    if (!r.ok) return { fout: 'melden gaf HTTP ' + r.status + (j && j.fout ? ' (' + String(j.fout).slice(0, 80) + ')' : '') };
    return (j && j.budget) || null;
  } catch (e) { return { fout: 'melden mislukt: ' + String(e.message || e).slice(0, 150) }; } // melden mag de wacht nooit laten mislukken
}

// Budgetwacht: uitgaven van vandaag per campagne in USD (Mondiad rekent in USD), opgeteld per campagne-id.
// Gegarandeerde omzet = 0: 'revenue' in Mondiad is de postbackwaarde (aanmelding, stem), geen geld dat binnenkomt.
export function mdUitgaven(rijen, loopt) {
  const per = new Map();
  for (const r of rijen || []) {
    const id = String(r && r.campaignId || ''); if (!/^\d+$/.test(id)) continue;
    const x = per.get(id) || { cid: id, naam: String(r.campaignName || ''), kosten: 0, omzet: 0, loopt: loopt.has(id) };
    x.kosten += num(r.spent); per.set(id, x);
  }
  return schoonUitgaven([...per.values()]);
}
// Statussen waarin een Mondiad-campagne geld kan (gaan) uitgeven; PAUSED = door ons gepauzeerd.
const MD_AAN = /^(RUNNING|DAILY_LIMIT_REACHED|OFF_SCHEDULE|OFF_ACCOUNT_BUDGET|PENDING|WAITING_START_DATE|NO_ACTIVE_CREATIVES)$/;
const mdStatus = async id => String((((rows(await md('mondiad_get_campaign_details', { ids: [String(id)] })) || [])[0]) || {}).status || '').toUpperCase();
// Pauzeren zoals /api/mm/mdpauze (status PAUSED, bewezen 16 okt). Weer aanzetten: status RUNNING; staat hij daarna nog op PAUSED
// (Mondiad laat bij een update officieel alleen Draft/Pending toe), dan opnieuw indienen met Pending: na de goedkeuring loopt hij
// weer (runAfterModeration). De controle daarna staat in lib/mdbudget.js.
export const mdSchakelaar = {
  async statussen(ids) {
    const uit = new Map();
    for (let i = 0; i < ids.length; i += 20) {
      for (const c of rows(await md('mondiad_get_campaign_details', { ids: ids.slice(i, i + 20).map(String) }))) {
        const s = String(c && c.status || '').toUpperCase();
        uit.set(Number(c.id), s === 'PAUSED' ? 'uit' : MD_AAN.test(s) ? 'aan' : 'status ' + (s || '?'));
      }
    }
    return uit;
  },
  pauzeer: id => md('mondiad_update_campaign', { json: JSON.stringify({ id: Number(id), status: 'PAUSED' }) }),
  async zetAan(id) {
    let e1 = null;
    try { await md('mondiad_update_campaign', { json: JSON.stringify({ id: Number(id), status: 'RUNNING' }) }); } catch (e) { e1 = e; }
    if ((await mdStatus(id)) !== 'PAUSED') return;
    try { await md('mondiad_update_campaign', { json: JSON.stringify({ id: Number(id), status: 'Pending' }) }); }
    catch (e2) { throw new Error('RUNNING: ' + String((e1 && e1.message) || 'bleef PAUSED').slice(0, 80) + '; Pending: ' + String(e2.message || e2).slice(0, 80)); }
  },
  // Henkjan liet hem na de budgetstop pauzeren (/api/mm/mdpauze)? Dan niet weer aanzetten.
  async laterGestopt(id, sinds) {
    const l = (await kv.raw(['LRANGE', 'mm:mdpauze', '0', '99'])) || [];
    for (const x of l) { let j = null; try { j = JSON.parse(x); } catch (e) { continue; } if (Date.parse(j.t) > sinds && (j.uit || []).some(u => String(u.id) === String(id))) return 'Henkjan liet hem daarna pauzeren (mdpauze: ' + String(j.reden || '').slice(0, 60) + ')'; }
    return '';
  },
};
const EIGEN_LUS = /SHOP-LUS|TODAYIN|OUTNAME/i;
// Doorstuurspel (spel.todayin.email): het spel meet zelf per zone of er echte mensen achter de klikken zitten en zet
// zones zonder mensen op een openbare lijst (alleen campagne- en zonenummers). De wacht voegt die zones toe aan de zwarte
// lijst, naast de gewone kostenregels. Nooit de hoofdbron van een campagne: dat bewaakt het spel zelf.
const SPEL_URL = /spel\.todayin\.email/i;
const SPEL_BLOK = process.env.SPEL_BLOK_URL || 'https://spel.todayin.email/api/zones/blok';
async function spelBlok() {
  try {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 6000);
    const r = await fetch(SPEL_BLOK, { cache: 'no-store', signal: ac.signal }).finally(() => clearTimeout(t));
    if (!r.ok) return {};
    const j = await r.json(); return (j && j.blok) || {};
  } catch (e) { return {}; }
}
// Rereview (rereview.app): meet zelf per zone bezoeken (v), echte mensen (h + e) en geeft een oordeel (zwart/verdacht/wit/onbekend),
// over alle rereview-pagina's samen. Zwart en verdacht gaan op de zwarte lijst van rereview-campagnes, wit nooit (Henkjan 14 okt:
// "ik wil niets verspillen"). Daarnaast vergelijkt de wacht wat Mondiad afrekent (pops bij pop, kliks bij de rest) met wat er echt
// aankomt (v). Komt van een zone minder dan 30% aan, dan gaat hij eruit. Komt van de hele campagne minder dan 10% aan, dan is de
// pagina kapot of alles nep: dan blokkeert de wacht niets op aankomst maar meldt hij een ALARM (pauzeren beslist Henkjan).
const REREVIEW_URL = /rereview\.app/i;
const REREVIEW_ZONES = (process.env.REREVIEW_ZONES_URL || 'https://rereview.app/api/b/zones?dagen=3,https://temporary-zippy-granite-cwrt0cb.vercel.app/api/b/zones?dagen=3').split(',');
async function rereviewZones() {
  for (const u of REREVIEW_ZONES) {
    try {
      const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 6000);
      const r = await fetch(u.trim(), { cache: 'no-store', signal: ac.signal }).finally(() => clearTimeout(t));
      if (!r.ok) continue;
      const j = await r.json();
      const z = {};
      for (const x of (Array.isArray(j && j.zones) ? j.zones : [])) if (String(x.netwerk || '') === 'mondiad') z[String(x.zone)] = { v: num(x.v), mens: num(x.h) + num(x.e), oordeel: String(x.oordeel || '') };
      return z;
    } catch (e) { /* volgende bron */ }
  }
  return null;
}
// Clickmind (Henkjan 14 okt: "blokkeren door Clickmind aan", "het moet voor alle MCP's werken"): zones die Clickmind op de eigen
// pagina's als nep of zonder mens beoordeelde (mm:blok:mondiad, elk uur door de leerronde). Alleen als blokkeren aan staat en de
// zone klaar is (nooit "wacht op Henkjan"). Geldt voor elke campagne waar de zone geld kostte, ook campagnes met een eigen lus
// (daar meet Clickmind juist), nooit voor de grootste bron van een campagne en nooit bij een witte lijst.
async function clickmindZones() {
  try {
    const b = await kv.get('mm:blok:mondiad');
    if (!b || !b.aan) return {};
    const wacht = new Set((b.wachtOpHenkjan || []).map(String)), waarom = {};
    for (const d of b.details || []) waarom[String(d.zone)] = String(d.waarom || '');
    const uit = {};
    for (const z0 of (b.zones || []).map(String)) { if (wacht.has(z0)) continue; const z = z0.replace(/^md/i, ''); if (/^\d{1,12}$/.test(z)) uit[z] = 'Clickmind: ' + (waarom[z0] || 'nep of geen mens').slice(0, 80); }
    return uit;
  } catch (e) { return {}; }
}
const AANKOMST = { minZone: 0.30, zoneMinKosten: 0.30, zoneMinPops: 1000, zoneMinKliks: 50, campagneAlarm: 0.10 };
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
  if (g.kliks <= 0) {
    // Pop/CPM: Mondiad telt geen kliks, dus dezelfde prijsregel op vertoningen (pops).
    if (!(g.vert > 0)) return '';
    const gemV = g.kosten / g.vert;
    if (a.vert > 0 && a.kosten >= R.duurMinKosten && a.kosten / a.vert > R.duurFactor * gemV) return 'prijs per pop ' + (a.kosten / a.vert / gemV).toFixed(1) + 'x het gemiddelde';
    return '';
  }
  const gem = g.kosten / g.kliks;
  if (a.kliks === 0 && a.kosten >= R.leegMinKosten) return '$' + a.kosten.toFixed(2) + ' zonder klik';
  if (a.kliks > 0 && a.kosten >= R.duurMinKosten && a.kosten / a.kliks > R.duurFactor * gem) return 'klikprijs ' + (a.kosten / a.kliks / gem).toFixed(1) + 'x het gemiddelde';
  return '';
}

export async function mdWacht(droog) {
  const start = Date.now();
  const uit = { tijd: new Date().toISOString(), stand: droog ? 'proef' : 'live', campagnes: [], fouten: [] };
  let uitgaven = null;
  const regelFout = await centraleRegels(); if (regelFout) uit.melding = regelFout;
  uit.regels = { duurFactor: R.duurFactor, duurMinKosten: R.duurMinKosten, leegMinKosten: R.leegMinKosten, convFactor: R.convFactor, convMinKosten: R.convMinKosten, minConversies: R.minConversies };
  if (!droog) { const s = await kv.get(SLOT); if (s && Date.now() - s < 540000) return Object.assign(uit, { overgeslagen: 'wacht loopt al' }); await kv.set(SLOT, Date.now(), { ex: 600 }); }
  try {
    // 1. welke campagnes gaven de laatste 3 dagen geld uit
    const rep = rows(await md('mondiad_campaign_report', { startDate: dag(R.dagen - 1), endDate: dag(0), breakdown: 'CAMPAIGN', size: 500, sortBy: 'SPENT', sortDirection: 'DESC' }));
    const kosten = {}; for (const r of rep) kosten[String(r.campaignId)] = { kliks: num(r.clicks), vert: num(r.impressions), kosten: num(r.spent), conv: num(r.conversions) };
    const lijst = rows(await md('mondiad_list_campaigns', { statuses: ['RUNNING', 'DAILY_LIMIT_REACHED', 'OFF_SCHEDULE', 'OFF_ACCOUNT_BUDGET'], size: 500, responseFields: ['ID', 'NAME', 'STATUS', 'BID_TYPE', 'URL'] }));
    const doel = lijst.filter(c => { const k = kosten[String(c.id)]; return k && k.kosten >= R.minCampagneKosten; })
      .sort((a, b) => kosten[String(b.id)].kosten - kosten[String(a.id)].kosten);
    let spel = null, rere;
    const cm = await clickmindZones(), cmAantal = Object.keys(cm).length;
    uit.clickmind = { zones: cmAantal };
    for (const c of doel) {
      const naam = String(c.name || ''), g = kosten[String(c.id)];
      const eigen = EIGEN_LUS.test(naam) || EIGEN_URL.test(String(c.url || ''));
      if (eigen && !cmAantal) { uit.campagnes.push({ id: c.id, naam, overgeslagen: 'eigen lus' }); continue; }
      if (Date.now() - start > 240000) { uit.fouten.push('tijd op; rest volgende ronde'); break; }
      if (!eigen && SPEL_URL.test(String(c.url || '')) && !spel) spel = await spelBlok();
      if (!eigen && REREVIEW_URL.test(String(c.url || '')) && rere === undefined) { rere = await rereviewZones(); if (!rere) uit.fouten.push('rereview-zonemeting niet bereikbaar; alleen kostenregels'); }
      try {
        const zr = rows(await md('mondiad_campaign_report', { startDate: dag(R.dagen - 1), endDate: dag(0), breakdown: 'ZONE_ID', campaignId: c.id, size: 500, sortBy: 'SPENT', sortDirection: 'DESC' }));
        const weg = [];
        // campagnes met een eigen lus: alleen de Clickmind-zones (de eigen lus doet de rest)
        if (!eigen) for (const r of zr) {
          const a = { kliks: num(r.clicks), vert: num(r.impressions), kosten: num(r.spent), conv: num(r.conversions) };
          const reden = zoneOordeel(a, g);
          if (reden && r.zoneId) weg.push({ zone: Number(r.zoneId), reden, kosten: Math.round(a.kosten * 100) / 100 });
        }
        if (cmAantal) {
          const al = new Set(weg.map(w => w.zone));
          const top = zr.reduce((b, r) => (num(r.spent) > num(b && b.spent) ? r : b), null), topZone = top ? Number(top.zoneId) : 0;
          for (const r of zr) { const z = Number(r.zoneId); if (z && cm[String(z)] && num(r.spent) > 0 && z !== topZone && !al.has(z)) { weg.push({ zone: z, reden: cm[String(z)], kosten: Math.round(num(r.spent) * 100) / 100 }); al.add(z); } }
        }
        if (eigen && !weg.length) { uit.campagnes.push({ id: c.id, naam, overgeslagen: 'eigen lus' }); continue; }
        if (spel && SPEL_URL.test(String(c.url || ''))) {
          const al = new Set(weg.map(w => w.zone));
          for (const z of (spel[String(c.id)] || []).map(Number).filter(Boolean)) if (!al.has(z)) weg.push({ zone: z, reden: 'geen echte mensen (spel)', kosten: 0 });
        }
        if (rere && REREVIEW_URL.test(String(c.url || ''))) {
          const al = new Set(weg.map(w => w.zone));
          const wit = new Set(Object.keys(rere).filter(z => rere[z].oordeel === 'wit' || rere[z].mens > 0).map(Number));
          // Nooit de grootste bron van de campagne automatisch blokkeren (skill campagnes-henkjan); die wordt een ALARM.
          const top = zr.reduce((b, r) => (num(r.spent) > num(b && b.spent) ? r : b), null);
          const topZone = top ? Number(top.zoneId) : 0; wit.add(topZone);
          // a) oordeel van rereview zelf
          for (const [z, x] of Object.entries(rere)) if ((x.oordeel === 'zwart' || x.oordeel === 'verdacht') && x.mens === 0 && Number(z) !== topZone && !al.has(Number(z))) { weg.push({ zone: Number(z), reden: 'geen echte mensen (rereview, ' + x.oordeel + ')', kosten: 0 }); al.add(Number(z)); }
          // b) afgerekend tegen aangekomen
          const pop = !(g.kliks > 0);
          let tot = 0, aan = 0, topAlarm = ''; const kand = [];
          for (const r of zr) {
            const z = Number(r.zoneId); if (!z) continue;
            const afg = pop ? num(r.impressions) : num(r.clicks), v = (rere[String(z)] || {}).v || 0, k = num(r.spent);
            tot += afg; aan += Math.min(v, afg);
            const slecht = k >= AANKOMST.zoneMinKosten && afg >= (pop ? AANKOMST.zoneMinPops : AANKOMST.zoneMinKliks) && v / afg < AANKOMST.minZone;
            if (slecht && z === topZone && (rere[String(z)] || {}).mens === 0) topAlarm = ('ALARM campagne ' + c.id + ': grootste zone ' + z + ' kost $' + k.toFixed(2) + ' en maar ' + Math.round(100 * v / afg) + '% komt aan; niet automatisch geblokkeerd (grootste bron), Henkjan beslist.');
            if (slecht && !wit.has(z) && !al.has(z)) kand.push({ zone: z, reden: Math.round(100 * v / afg) + '% komt aan (' + v + ' van ' + afg + (pop ? ' pops' : ' kliks') + ')', kosten: Math.round(k * 100) / 100 });
          }
          if (tot >= (pop ? AANKOMST.zoneMinPops : AANKOMST.zoneMinKliks) && aan / tot < AANKOMST.campagneAlarm) {
            uit.fouten.push('ALARM campagne ' + c.id + ' (' + naam.slice(0, 40) + '): maar ' + (100 * aan / tot).toFixed(1) + '% van het afgerekende verkeer komt aan op rereview (' + aan + ' van ' + tot + ', $' + g.kosten.toFixed(2) + ' in ' + R.dagen + ' dagen). Pagina kapot of alles nep; niets op aankomst geblokkeerd, pauzeren beslist Henkjan.');
          } else { for (const w of kand) weg.push(w); if (topAlarm) uit.fouten.push(topAlarm); }
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
    // 2. budgetwacht: uitgaven van vandaag per campagne (alle campagnes, ook gepauzeerde). 'Vandaag' = de Mondiad-dag (dag(0),
    //    zoals deze wacht zijn rapporten al opvraagt). De budgetdag begint om 05:00 UTC; die kleine verschuiving is bewust
    //    geaccepteerd. Lukt het ophalen niet, dan gaan er geen uitgaven mee en blijft de vorige melding bij de budgetwacht staan.
    try {
      const vandaag = [];
      for (let page = 0; page < 5; page++) {
        const r = rows(await md('mondiad_campaign_report', { startDate: dag(0), endDate: dag(0), breakdown: 'CAMPAIGN', size: 500, page, sortBy: 'SPENT', sortDirection: 'DESC' }));
        vandaag.push(...r);
        if (r.length < 500 || !(num(r[r.length - 1].spent) > 0)) break;
      }
      const extra = rows(await md('mondiad_list_campaigns', { statuses: ['PENDING', 'WAITING_START_DATE', 'NO_ACTIVE_CREATIVES'], size: 500, responseFields: ['ID', 'STATUS'] }));
      uitgaven = mdUitgaven(vandaag, new Set([...lijst, ...extra].map(c => String(c.id))));
      uit.budget = { dag: dag(0), campagnes: uitgaven.length, kosten: Math.round(uitgaven.reduce((t, u) => t + u.kosten, 0) * 100) / 100, uitgaven };
    } catch (e) { uitgaven = null; uit.fouten.push('budgetwacht: uitgaven van vandaag: ' + String(e.message || e).slice(0, 200)); }
    uit.samenvatting = uit.stand + ' | ' + doel.length + ' campagnes met uitgave | ' + geblokt + ' zones geblokkeerd | ' + uit.fouten.length + ' fouten';
  } catch (e) {
    uit.fouten.push(String(e.message || e).slice(0, 300));
    uit.samenvatting = uit.stand + ' | FOUT: ' + String(e.message || e).slice(0, 120);
  } finally {
    if (!droog) { try { await kv.set(SLOT, 0, { ex: 5 }); } catch (e) {} }
  }
  uit.duurMs = Date.now() - start;
  console.log('[md-wacht] ' + uit.samenvatting);
  let bu = null;
  if (!droog && !uit.overgeslagen) {
    const geblokt = uit.campagnes.reduce((s, x) => s + num(((x.actie || '').match(/^\+(\d+)/) || [])[1]), 0);
    const vorig = await leesVerslag(kv);
    const antwoord = await meldCentraal(uit, geblokt, uitgaven, vorig);
    // budgetwacht: stoppen en weer aanzetten wat hij zegt, en controleren (uitkomst in de volgende melding)
    try { bu = await voerBudgetUit(kv, antwoord, mdSchakelaar, new Map((uitgaven || []).map(u => [u.cid, u.naam]))); } catch (e) { bu = { acties: [], fouten: ['budgetwacht: ' + String(e.message || e).slice(0, 200)] }; }
    uit.budget = Object.assign(uit.budget || {}, { antwoord, uitkomst: bu });
    if (bu && (bu.acties.length || bu.fouten.length)) console.log('[md-wacht] budgetwacht: ' + bu.acties.concat(bu.fouten).join(' | '));
  }
  if (!droog) { try { const l = (await kv.get(LOG)) || []; l.unshift({ tijd: uit.tijd, samenvatting: uit.samenvatting, acties: uit.campagnes.filter(x => x.actie && x.actie !== 'al op orde').map(x => x.id + ' ' + x.actie).concat(bu ? bu.acties : []), fouten: uit.fouten.concat(bu ? bu.fouten : []) }); await kv.set(LOG, l.slice(0, 300)); } catch (e) {} }
  return uit;
}
