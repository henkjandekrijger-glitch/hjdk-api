// MONDIAD-LEERLUS voor keuzehulp.best — draait elk uur op Vercel, los van Claude-account en laptop.
//   /api/md/koppel    eenmalig: koppel het Mondiad-account (OAuth; daarna ververst hij zelf)
//   /api/md/callback  terugkeer van Mondiad
//   /api/md/status    wat de lus weet, besloot en deed (openbaar, geen geheimen)
//   /api/md/ronde     de leerronde (cron elk uur; ?droog=1 = alleen rekenen)
// Wat hij leert, per ronde:
//   1. Zones: Mondiad-kliks naast onze eigen tellers (aankomst, gestart, bol-klik) en bol-orders. Nep, dood of zonder bol-kliks -> op de
//      zwarte lijst van ALLE keuzehulp-campagnes (wat in de ene campagne slecht is, is overal slecht). Zones die bol-kliks of orders geven -> hoger bod.
//   2. Advertenties: per campagne zwakke teksten uit, en elke dag een nieuwe variant (Claude) op basis van de beste.
//   3. Portefeuille: welke keuzehulpen een campagne krijgen. Seizoen/actueel (dagelijkse keuzehulpenmaker), wat bij bol kliks en orders geeft,
//      en elke dag nieuwe proberen; slechtste dichtzetten. Bod omhoog als een goede campagne te weinig verkeer krijgt.
//   4. Bewaking: saldo, dagbudget, alles gelogd.
import { kv } from '../lib/db.js';
import { md, mdStart, mdCallback, mdState, mdAutoLogin, mdHeeftSleutel } from '../lib/mdmcp.js';

const SITE = 'https://keuzehulp.best';
const E = (k, d) => { const v = Number(process.env[k]); return Number.isFinite(v) && v > 0 ? v : d; };
const MAX_ACTIEF = () => E('MD_MAX', 8), NIEUW_PER_DAG = () => E('MD_NIEUW_PER_DAG', 2), MIN_SALDO = () => E('MD_MIN_SALDO', 4);
const START_BOD = () => E('MD_BOD', 0.02), MAX_BOD = () => E('MD_MAX_BOD', 0.06), DAG = () => Math.max(10, E('MD_DAG_PER_CAMPAGNE', 10)), TOTAAL = () => E('MD_TOTAAL_PER_CAMPAGNE', 15); // Mondiad: dagbudget min $10, per zone min $2; het totaalbudget is de echte rem
const DEFAULT_SLUGS = ['airfryer', 'matras', 'halloween-kostuum-kind', 'robotstofzuiger', 'thuisbatterij', 'elektrische-deken'];
const K = { log: 'hjdk:md:log', zwart: 'hjdk:md:zwart', laatste: 'hjdk:md:laatste', lock: 'hjdk:md:lock', dag: d => 'hjdk:md:dag:' + d };
const DAY = (o = 0) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10);
const r4 = x => Math.round(x * 10000) / 10000;
let OIDC = '';

async function log(e) { try { const l = (await kv.get(K.log)) || []; l.unshift(Object.assign({ at: new Date().toISOString() }, e)); await kv.set(K.log, l.slice(0, 400)); } catch (x) {} }
const num = v => Number(v) || 0;
const rows = r => Array.isArray(r) ? r : (r && (r.data || r.items || r.rows)) || [];
const findId = o => { let hit = ''; const walk = x => { if (hit || x == null) return; if (typeof x === 'string') { if (/^(icon|image|img|res)[_-]?\w*\.(png|jpe?g|webp|gif)$/i.test(x) || /_\d+_\d+\.(png|jpe?g|webp|gif)$/i.test(x)) hit = x; return; } if (typeof x === 'object') for (const k of Object.keys(x)) { if (/^(fileId|fileName|name|id)$/i.test(k) && typeof x[k] === 'string' && /\.(png|jpe?g|webp|gif)$/i.test(x[k])) { hit = x[k]; return; } walk(x[k]); } }; walk(o); return hit; };
const slugOf = url => { const m = String(url || '').match(/\/keuzehulp\/([a-z0-9-]+)/); return m ? m[1] : 'home'; };

let ITEMS = null;
async function items() { if (ITEMS) return ITEMS; try { const r = await fetch(SITE + '/api/kz?op=list'); const j = await r.json(); ITEMS = j.items || []; return ITEMS; } catch (e) { return []; } }

// ---- Claude voor advertentieteksten (via Vercel AI Gateway met het OIDC-token van dit project; anders eigen sleutel; anders sjablonen) ----
async function claudeTekst(prompt) {
  const oidc = process.env.VERCEL_OIDC_TOKEN || OIDC; const key = process.env.ANTHROPIC_API_KEY;
  const tries = oidc ? ['anthropic/claude-sonnet-5.5', 'anthropic/claude-sonnet-5', 'anthropic/claude-sonnet-4.5'].map(m => ({ url: 'https://ai-gateway.vercel.sh/v1/messages', h: { authorization: 'Bearer ' + oidc }, m })) : key ? [{ url: 'https://api.anthropic.com/v1/messages', h: { 'x-api-key': key }, m: 'claude-sonnet-4-5' }] : [];
  for (const t of tries) { try { const r = await fetch(t.url, { method: 'POST', headers: Object.assign({ 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, t.h), body: JSON.stringify({ model: t.m, max_tokens: 1200, thinking: { type: 'disabled' }, messages: [{ role: 'user', content: prompt }] }) }); const j = await r.json().catch(() => ({})); if (r.ok) { const s = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join(''); const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a >= 0) return JSON.parse(s.slice(a, b + 1)); } } catch (e) {} }
  return null;
}
function sjablonen(it) { const n = String(it.title || it.slug).replace(/^Welke?\s+/i, '').replace(/\s+past bij (jou|jouw \w+)\??$/i, '').trim(); const N = n.charAt(0).toUpperCase() + n.slice(1);
  return [{ title: (it.title || 'Welke ' + n + ' past bij jou?').slice(0, 40), description: '3 vragen, eerlijk advies, prijs van nu.' }, { title: ('Twijfel je over een ' + n + '?').slice(0, 40), description: 'Beantwoord 3 vragen en kies zeker.' }, { title: (N + ': 3 fouten voorkomen').slice(0, 40), description: 'Lees dit voordat je er een koopt.' }, { title: 'Prijs van vandaag bij bol', description: ('Eerst 3 vragen, dan de beste ' + n + '.').slice(0, 60) }]; }
async function teksten(it, beste, n) {
  const j = await claudeTekst(`Schrijf ${n} Nederlandse in-page-pushadvertenties voor een gratis keuzehulp op keuzehulp.best: "${it.title}" (${it.cat || ''}). ${it.kort ? 'Kern: ' + it.kort : ''}
Wat tot nu toe het best werkte (klik én doorklik): ${beste.length ? beste.map(b => '"' + b.title + '" / "' + b.description + '"').join('; ') : 'nog niets bekend'}.
Regels: titel max 32 tekens, tekst max 55 tekens, eerlijk (geen nep-urgentie, geen 'gratis' tenzij waar, geen merknamen, niet doen alsof het van bol is), concreet en nieuwsgierig makend, elke variant een andere invalshoek (twijfel, fout voorkomen, prijs van vandaag, seizoen/moment, voor wie). Antwoord alleen JSON: {"varianten":[{"title":"","description":""}]}`);
  const v = (j && Array.isArray(j.varianten) ? j.varianten : []).filter(x => x && x.title && x.description).map(x => ({ title: String(x.title).slice(0, 40), description: String(x.description).slice(0, 70) }));
  return v.length ? v.slice(0, n) : sjablonen(it).slice(0, n);
}

async function beelden(slug) {
  const out = { icon: '', image: '' };
  try { out.icon = findId(await md('mondiad_upload_resource_from_url', { resourceType: 'ICON', sourceUrl: SITE + '/pin/' + slug + '-9.png', fileName: 'kz-' + slug + '-icon.png' })); } catch (e) { await log({ soort: 'fout', wat: 'icoon ' + slug, fout: String(e.message).slice(0, 160) }); }
  try { out.image = findId(await md('mondiad_upload_resource_from_url', { resourceType: 'IMAGE', sourceUrl: SITE + '/pin/' + slug + '-8.png', fileName: 'kz-' + slug + '-beeld.png' })); } catch (e) { await log({ soort: 'fout', wat: 'beeld ' + slug, fout: String(e.message).slice(0, 160) }); }
  return out;
}

async function ronde(droog) {
  ITEMS = null;
  const besluiten = []; const B = (soort, wat, waarom) => besluiten.push({ soort, wat, waarom });
  const acc = await md('mondiad_get_current_account', {}); const saldo = num(acc && acc.account && acc.account.accountBalance);
  const camps = rows(await md('mondiad_list_campaigns', { url: 'keuzehulp', size: 300, excludeStatuses: ['ARCHIVED', 'ARCHIVED_COMPLETED'], responseFields: ['ID', 'NAME', 'STATUS', 'BID', 'BID_TYPE', 'DAILY_BUDGET', 'URL', 'CLICKS', 'SPENT', 'CONVERSIONS', 'REMAINING'] }))
    .filter(c => /utm_source=mondiad/.test(c.url || '') && /keuzehulp/.test(c.url || ''));
  const actief = camps.filter(c => !/PAUSED|REJECTED|FINISHED/i.test(c.status));
  const van = DAY(-13), tot = DAY();
  // ---- verzamelen: Mondiad per zone en per advertentie, eigen tellers, bol-orders ----
  const zMd = {}, perCamp = {};
  for (const c of camps) {
    const pc = perCamp[c.id] = { c, slug: slugOf(c.url), zones: {}, cr: {}, kliks: 0, kosten: 0 };
    try { for (const r of rows(await md('mondiad_campaign_report', { startDate: van, endDate: tot, breakdown: 'ZONE_ID', campaignId: c.id, size: 500 }))) { const z = String(r.zoneId); const x = pc.zones[z] || (pc.zones[z] = { kliks: 0, vert: 0, kosten: 0 }); x.kliks += num(r.clicks); x.vert += num(r.impressions); x.kosten += num(r.spent); pc.kliks += num(r.clicks); pc.kosten += num(r.spent); const g = zMd[z] || (zMd[z] = { kliks: 0, kosten: 0 }); g.kliks += num(r.clicks); g.kosten += num(r.spent); } } catch (e) { B('fout', 'rapport zones ' + c.id, String(e.message).slice(0, 120)); }
    if (!/PAUSED|REJECTED|FINISHED/i.test(c.status)) { try { for (const r of rows(await md('mondiad_campaign_report', { startDate: van, endDate: tot, breakdown: 'CREATIVE_ID', campaignId: c.id, size: 100 }))) { const id = String(r.creativeId || r.creative || ''); if (!id) continue; const x = pc.cr[id] || (pc.cr[id] = { kliks: 0, vert: 0 }); x.kliks += num(r.clicks); x.vert += num(r.impressions); } } catch (e) {} }
  }
  const zs = Object.keys(zMd);
  const eigen = {}; if (zs.length) { const keys = []; zs.forEach(z => ['view', 'start', 'clk', 'conv'].forEach(s => keys.push('c:hjdk6-kz-paid-' + z + '-' + s))); const vals = []; for (let i = 0; i < keys.length; i += 400) vals.push(...await kv.mget(...keys.slice(i, i + 400))); zs.forEach((z, i) => { eigen[z] = { aankomst: num(vals[i * 4]), gestart: num(vals[i * 4 + 1]), bol: num(vals[i * 4 + 2]), conv: num(vals[i * 4 + 3]) }; }); }
  let leer = {}; try { leer = (await kv.get('hjdk:learn:v1')) || {}; } catch (e) {}
  const lz = leer.zones || {}, lp = leer.pages || {};
  // ---- 1. zones ----
  const zwart = new Set(((await kv.get(K.zwart)) || []).map(String)); const nieuwZwart = [];
  let totA = 0, totB = 0; zs.forEach(z => { totA += eigen[z].aankomst; totB += eigen[z].bol; }); const gem = totA ? totB / totA : 0.02;
  const goed = {};
  for (const z of zs) { if (zwart.has(z)) continue; const m = zMd[z], o = eigen[z], b = lz[z] || {};
    let waarom = '';
    if (m.kliks >= 40 && o.aankomst < 0.3 * m.kliks) waarom = `nep: ${m.kliks} kliks bij Mondiad, maar ${o.aankomst} kwamen aan`;
    else if (o.aankomst >= 80 && o.gestart === 0 && o.bol === 0) waarom = `dood: ${o.aankomst} bezoekers, niemand deed iets`;
    else if (o.aankomst >= 250 && o.bol === 0) waarom = `${o.aankomst} bezoekers en geen enkele bol-klik`;
    else if (num(b.clicks) >= 500 && num(b.orders) === 0) waarom = `${b.clicks} bol-kliks en geen bestelling`;
    if (waarom) { nieuwZwart.push(z); zwart.add(z); B('zone uit', z, waarom); continue; }
    const rate = o.aankomst ? o.bol / o.aankomst : 0;
    if (num(b.orders) > 0) goed[z] = 2; else if (o.aankomst >= 40 && rate >= 1.5 * gem && o.bol >= 3) goed[z] = 1.5; }
  // ---- 2+3. per campagne: zwarte lijst, zone-biedingen, advertenties, bod ----
  const vandaag = (await kv.get(K.dag(DAY()))) || { nieuweCampagnes: 0, nieuweTeksten: {}, uit: 0 };
  for (const pc of Object.values(perCamp)) { const c = pc.c; if (/PAUSED|REJECTED|FINISHED/i.test(c.status)) continue;
    let det = null; try { det = (rows(await md('mondiad_get_campaign_details', { ids: [String(c.id)] })) || [])[0]; } catch (e) {} if (!det) continue;
    const upd = { id: c.id };
    const cur = new Set((det.zoneIdList || []).map(String)); const voeg = [...zwart].filter(z => !cur.has(z));
    if (/black/i.test(det.zoneIdListMode || '') && voeg.length) { upd.zoneIdList = [...cur, ...voeg].map(Number).filter(Boolean); upd.zoneIdListMode = 'BLACK_LIST'; B('zwarte lijst', c.id + ' (' + pc.slug + ')', '+' + voeg.length + ' zones'); }
    const bod = num(det.bid) || START_BOD(); const zb = {}; (det.zoneCustomBids || []).forEach(x => { zb[String(x.zoneId)] = num(x.bid); });
    let zbVer = false; for (const [z, f] of Object.entries(goed)) { if (!pc.zones[z]) continue; const nb = r4(Math.min(MAX_BOD(), bod * f)); if (!zb[z] || zb[z] < nb) { zb[z] = nb; zbVer = true; B('zone hoger bod', z + ' in ' + c.id, 'x' + f + ' -> $' + nb); } }
    if (zbVer) upd.zoneCustomBids = Object.entries(zb).map(([zoneId, b]) => ({ zoneId: Number(zoneId), bid: b }));
    // te weinig verkeer terwijl de campagne goed doorklikt: bod omhoog
    const cA = Object.keys(pc.zones).reduce((a, z) => a + (eigen[z] ? eigen[z].aankomst : 0), 0), cB = Object.keys(pc.zones).reduce((a, z) => a + (eigen[z] ? eigen[z].bol : 0), 0);
    if (pc.kliks < 14 * 20 && cA >= 20 && cB / cA >= gem && bod < MAX_BOD()) { upd.bid = r4(Math.min(MAX_BOD(), bod * 1.2)); B('bod omhoog', c.id + ' (' + pc.slug + ')', `weinig verkeer (${pc.kliks} kliks/14d) maar goede doorklik; $${bod} -> $${upd.bid}`); }
    if (Object.keys(upd).length > 1 && !droog) { try { await md('mondiad_update_campaign', { json: JSON.stringify(upd) }); } catch (e) { B('fout', 'bijwerken ' + c.id, String(e.message).slice(0, 160)); } }
    // advertenties: zwakste uit, één nieuwe variant per dag
    const crs = (det.creatives || []).filter(x => x.status === 'ACTIVE' || x.status === 'PENDING');
    const stat = crs.map(x => { const s = pc.cr[String(x.id)] || { kliks: 0, vert: 0 }; return Object.assign({}, x, s, { ctr: s.vert ? s.kliks / s.vert : 0 }); });
    const best = stat.filter(x => x.vert >= 500).sort((a, b) => b.ctr - a.ctr);
    if (best.length >= 3) { const top = best[0].ctr; const zwak = best.filter(x => x.vert >= 3000 && x.ctr < 0.5 * top).slice(0, 1);
      for (const x of zwak) { if (stat.length - 1 < 3) break; B('advertentie uit', x.id + ' "' + x.title + '"', `CTR ${(x.ctr * 100).toFixed(2)}% tegen beste ${(top * 100).toFixed(2)}%`); if (!droog) { try { await md('mondiad_update_creative', { creative: JSON.stringify({ id: x.id, status: 'PAUSED' }) }); } catch (e) { B('fout', 'advertentie uit ' + x.id, String(e.message).slice(0, 120)); } } } }
    if (!vandaag.nieuweTeksten[c.id] && crs.length < 8 && crs.length) { const ref = (best[0] || crs[0]); const it = (await items()).find(i => i.slug === pc.slug) || { slug: pc.slug, title: pc.slug === 'home' ? 'Twijfel je wat je moet kopen?' : 'Welke ' + pc.slug.replace(/-/g, ' ') + ' past bij jou?', kort: pc.slug === 'home' ? '160+ gratis keuzehulpen: 3 vragen en je weet welke je moet hebben' : '' };
      const al = new Set(crs.map(x => String(x.title).toLowerCase())); const v = (await teksten(it, best.slice(0, 3), 4)).find(x => !al.has(String(x.title).toLowerCase())); if (v) { B('nieuwe advertentie', c.id + ' (' + pc.slug + ')', '"' + v.title + '" / "' + v.description + '"'); if (!droog) { try { await md('mondiad_create_creative', { creative: { campaignId: c.id, title: v.title, description: v.description, icon: ref.icon, image: ref.image, tag: 'kz-' + pc.slug.slice(0, 12) + '-' + DAY().slice(5).replace('-', ''), status: 'PENDING' } }); vandaag.nieuweTeksten[c.id] = 1; } catch (e) { B('fout', 'nieuwe advertentie ' + c.id, String(e.message).slice(0, 160)); } } } }
  }
  // goed lopende campagne waarvan het totaalbudget op is: bijvullen (één keer per dag per campagne)
  for (const pc of Object.values(perCamp)) { if (!/FINISHED/i.test(pc.c.status) || vandaag['vul' + pc.c.id]) continue;
    const a = Object.keys(pc.zones).reduce((x, z) => x + (eigen[z] ? eigen[z].aankomst : 0), 0), b = Object.keys(pc.zones).reduce((x, z) => x + (eigen[z] ? eigen[z].bol : 0), 0);
    if (a >= 50 && b / a >= gem && saldo >= MIN_SALDO()) { let det = null; try { det = (rows(await md('mondiad_get_campaign_details', { ids: [String(pc.c.id)] })) || [])[0]; } catch (e) {} if (!det) continue; const nb = Math.round((num(det.budget) + TOTAAL()) * 100) / 100;
      B('budget bijgevuld', pc.c.id + ' (' + pc.slug + ')', `${b} bol-kliks op ${a} bezoekers; totaalbudget $${det.budget} -> $${nb}`); if (!droog) { try { await md('mondiad_update_campaign', { json: JSON.stringify({ id: pc.c.id, budget: nb }) }); vandaag['vul' + pc.c.id] = 1; } catch (e) { B('fout', 'bijvullen ' + pc.c.id, String(e.message).slice(0, 120)); } } } }
  // ---- 3. portefeuille ----
  const waarde = pc => { const p = lp['kz:' + pc.slug] || {}; return (num(p.commission) + num(p.clicks) * 0.004) / (pc.kosten + 0.5); };
  const lopend = Object.values(perCamp).filter(pc => !/PAUSED|REJECTED|FINISHED/i.test(pc.c.status));
  if (lopend.length > 4 && vandaag.uit < 1) { const kand = lopend.filter(pc => pc.kosten >= 3 && !num((lp['kz:' + pc.slug] || {}).orders)).sort((a, b) => waarde(a) - waarde(b))[0];
    const med = lopend.map(waarde).sort((a, b) => a - b)[Math.floor(lopend.length / 2)];
    if (kand && waarde(kand) < 0.5 * med) { B('campagne uit', kand.c.id + ' (' + kand.slug + ')', `$${kand.kosten.toFixed(2)} uitgegeven, laagste opbrengst per dollar`); if (!droog) { try { try { await md('mondiad_update_campaign', { json: JSON.stringify({ id: kand.c.id, status: 'PAUSED' }) }); } catch (e1) { await md('mondiad_update_campaign', { json: JSON.stringify({ id: kand.c.id, dailyBudget: 1 }) }); B('campagne afgeknepen', kand.c.id, 'pauzeren via de API kan niet; dagbudget naar $1'); } vandaag.uit++; } catch (e) { B('fout', 'pauzeren ' + kand.c.id, String(e.message).slice(0, 120)); } } } }
  const heeft = new Set(lopend.map(pc => pc.slug));
  let kandidaten = []; try { const u = await kv.get('hjdk:kz:uitgelicht'); JSON.stringify(u || '').replace(/"([a-z0-9]+(?:-[a-z0-9]+)*)"/g, (m, s) => { kandidaten.push(s); return m; }); } catch (e) {}
  kandidaten.push(...Object.entries(lp).filter(([k]) => k.startsWith('kz:')).sort((a, b) => num(b[1].orders) - num(a[1].orders) || num(b[1].clicks) - num(a[1].clicks)).map(([k]) => k.slice(3)), ...DEFAULT_SLUGS);
  const alle = await items(); const bestaat = new Set(alle.map(i => i.slug));
  kandidaten = [...new Set(kandidaten)].filter(s => bestaat.has(s) && !heeft.has(s));
  const ruimte = Math.min(MAX_ACTIEF() - lopend.length, NIEUW_PER_DAG() - vandaag.nieuweCampagnes);
  if (saldo < MIN_SALDO()) B('let op', 'saldo $' + saldo.toFixed(2), 'te laag voor nieuwe campagnes; bijstorten bij Mondiad');
  else if (ruimte > 0 && kandidaten.length) {
    let tmpl = null; try { const t = (lopend[0] || Object.values(perCamp)[0]); if (t) tmpl = (rows(await md('mondiad_get_campaign_details', { ids: [String(t.c.id)] })) || [])[0]; } catch (e) {}
    for (const slug of kandidaten.slice(0, ruimte)) { const it = alle.find(i => i.slug === slug); const vs = await teksten(it, [], 4); const img = droog ? { icon: '', image: '' } : await beelden(slug);
      if (!droog && (!img.icon || !img.image)) { B('fout', 'nieuwe campagne ' + slug, 'beelden uploaden mislukt'); continue; }
      const camp = Object.assign({ adType: ['IN_PAGE_PUSH'], bidType: 'CPA', countryTargeting: ['NL', 'BE'], countryTargetingMode: 'WHITE_LIST', deviceTargeting: [4, 5], deviceTargetingMode: 'WHITE_LIST', languageTargeting: [137], languageTargetingMode: 'WHITE_LIST', trafficType: ['MAINSTREAM'], landingPageType: 'MAINSTREAM', frequencyCap: { frequency: 1, duration: 24, actionType: 'IMPRESSION', actionScope: 'CAMPAIGN' }, dayPartingTimezone: 'Europe/Amsterdam', hideReferrer: true }, tmpl ? { deviceTargeting: tmpl.deviceTargeting, languageTargeting: tmpl.languageTargeting, frequencyCap: tmpl.frequencyCap } : {}, {
        name: 'KZ-MD | ' + slug + ' | NL-BE | IPP CPA | ' + DAY().replace(/-/g, ''), status: 'Pending', runAfterModeration: true, bid: START_BOD(), dailyBudget: DAG(), budget: TOTAAL(), zoneIdDailyBudget: 2,
        url: SITE + '/keuzehulp/' + slug + '?utm_source=mondiad&utm_medium=ipp&utm_campaign=kzmd-' + slug + '&clickid=[clickid]&zoneid=[zoneid]&campaignid=[campaignid]&creativeid=[creativeid]',
        zoneIdListMode: 'BLACK_LIST', zoneIdList: [...zwart].map(Number).filter(Boolean),
        creatives: vs.map((v, i) => ({ title: v.title, description: v.description, icon: img.icon, image: img.image, tag: 'kz-' + slug.slice(0, 12) + '-' + (i + 1), status: 'PENDING' })) });
      B('nieuwe campagne', slug, vs.map(v => v.title).join(' | '));
      if (!droog) { try { const r = await md('mondiad_create_campaign', { campaign: camp }); vandaag.nieuweCampagnes++; B('aangemaakt', slug, JSON.stringify(r).slice(0, 120)); } catch (e) { B('fout', 'aanmaken ' + slug, String(e.message).slice(0, 200)); } } }
  }
  if (!droog) { await kv.set(K.zwart, [...zwart]); await kv.set(K.dag(DAY()), vandaag, { ex: 3 * 86400 }); }
  const samen = { at: new Date().toISOString(), droog: !!droog, saldo, campagnes: camps.map(c => ({ id: c.id, slug: slugOf(c.url), status: c.status, bod: c.bid, dagbudget: c.dailyBudget, kliks: c.clicks, kosten: c.spent, conversies: c.conversions })), zonesGezien: zs.length, zwarteLijst: zwart.size, nieuwZwart: nieuwZwart.length, gemiddeldeBolKlikPerBezoek: r4(gem), besluiten };
  if (!droog) { await kv.set(K.laatste, samen); for (const b of besluiten) await log(b); }
  return samen;
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x'); const op = (url.searchParams.get('op') || url.pathname.split('/').pop() || 'status').toLowerCase();
  OIDC = String(req.headers['x-vercel-oidc-token'] || '');
  const base = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'keuzehulp.best');
  res.setHeader('cache-control', 'no-store');
  try {
    if (op === 'koppel') {
      const st = await mdState(); const tok = url.searchParams.get('token');
      if (st && st.refresh_token && !st.fout && !url.searchParams.get('opnieuw') && !(process.env.HJDK_TOKEN && tok === process.env.HJDK_TOKEN)) return res.status(200).send('<p style="font:16px system-ui;padding:24px">Mondiad is al gekoppeld. <a href="/api/md/status">Status bekijken</a> · <a href="/api/md/koppel?opnieuw=1">opnieuw koppelen</a></p>');
      if (await mdHeeftSleutel()) { try { await mdAutoLogin(); const acc = await md('mondiad_get_current_account', {}); await log({ soort: 'gekoppeld', wat: 'Mondiad (automatisch met sleutel)', waarom: 'account ' + (acc && acc.account && acc.account.accountId) }); return res.status(200).send('<p style="font:17px system-ui;padding:24px">Mondiad is automatisch gekoppeld met de sleutel uit Vercel (account ' + (acc && acc.account ? acc.account.accountId + ', saldo $' + num(acc.account.accountBalance).toFixed(2) : '?') + '). <a href="/api/md/status">Status</a></p>'); } catch (e) { await log({ soort: 'fout', wat: 'automatisch koppelen', waarom: String(e.message).slice(0, 200) }); } }
      // Mondiad staat alleen een terugkeer naar localhost toe; daarom: inloggen in een nieuw tabblad, daarna het adres uit de adresbalk hier plakken.
      const loc = await mdStart('http://localhost:53682/callback'); if (url.searchParams.get('toon')) return res.status(200).json({ ok: true, authorize: loc });
      res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mondiad koppelen</title><div style="font:17px/1.5 system-ui;max-width:600px;margin:32px auto;padding:0 16px;color:#1c1917">
<h1 style="color:#0f766e;margin:0 0 8px">Mondiad koppelen</h1><p>Eenmalig. Daarna leert de keuzehulp-lus elk uur zelf in de cloud.</p>
<p><b>1.</b> <a href="${loc}" target="_blank" rel="noopener" style="background:#0f766e;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;display:inline-block">Open Mondiad en log in</a><br><span style="font-size:15px;color:#57534e">Vul je Client ID en Client secret in (staan op advertiser.mondiad.com/profile/api, of maak daar een nieuwe sleutel).</span></p>
<p><b>2.</b> Na het inloggen opent een pagina die niet laadt (localhost). Dat klopt. Kopieer het hele adres uit de adresbalk en plak het hier:</p>
<form action="/api/md/callback" method="get"><input name="plak" required placeholder="http://localhost:53682/callback?code=..." style="width:100%;font:16px system-ui;padding:12px;border:1px solid #d6d3d1;border-radius:10px;box-sizing:border-box"><button style="margin-top:10px;background:#f59e0b;border:0;padding:12px 18px;border-radius:10px;font:600 16px system-ui">Koppelen</button></form>
<p style="font-size:14px;color:#78716c">Deze link werkt 30 minuten; daarna deze pagina vernieuwen.</p></div>`);
    }
    if (op === 'callback') {
      const err = url.searchParams.get('error'); if (err) return res.status(400).send('<p style="font:16px system-ui;padding:24px">Mondiad gaf een fout: ' + String(err).replace(/[<>]/g, '') + '. <a href="/api/md/koppel">Opnieuw proberen</a></p>');
      let code = String(url.searchParams.get('code') || ''), state = String(url.searchParams.get('state') || ''); const plak = url.searchParams.get('plak'); if (plak) { try { const u = new URL(String(plak).trim()); code = u.searchParams.get('code') || ''; state = u.searchParams.get('state') || ''; if (u.searchParams.get('error')) throw new Error(u.searchParams.get('error_description') || u.searchParams.get('error')); } catch (e) { return res.status(400).send('<p style="font:16px system-ui;padding:24px">Dat adres klopt niet (' + String(e.message).replace(/[<>]/g, '') + '). <a href="/api/md/koppel">Opnieuw</a></p>'); } }
      await mdCallback(code, state);
      let acc = null; try { acc = await md('mondiad_get_current_account', {}); } catch (e) {}
      await log({ soort: 'gekoppeld', wat: 'Mondiad', waarom: acc && acc.account ? 'account ' + acc.account.accountId : 'ok' });
      return res.status(200).send('<div style="font:17px system-ui;max-width:560px;margin:40px auto;padding:0 16px"><h1 style="color:#0f766e">Mondiad is gekoppeld</h1><p>' + (acc && acc.account ? 'Account ' + acc.account.accountId + ', saldo $' + num(acc.account.accountBalance).toFixed(2) + '.' : '') + ' De leerlus draait vanaf nu elk uur zelf in de cloud.</p><p><a href="/api/md/status">Bekijk wat hij doet →</a></p></div>');
    }
    if (op === 'ronde') {
      const droog = !!url.searchParams.get('droog');
      if (!droog) { const lk = await kv.get(K.lock); if (lk && Date.now() - lk < 280000) return res.status(200).json({ ok: true, overgeslagen: 'ronde loopt al' }); await kv.set(K.lock, Date.now(), { ex: 300 }); }
      try { const out = await ronde(droog); return res.status(200).json(Object.assign({ ok: true }, out)); }
      catch (e) { await log({ soort: 'fout', wat: 'ronde', waarom: String(e.message).slice(0, 200) }); return res.status(200).json({ ok: false, fout: String(e.message), koppelen: /gekoppeld|verlopen|verversen/i.test(String(e.message)) ? base + '/api/md/koppel' : undefined }); }
      finally { if (!droog) { try { await kv.set(K.lock, 0, { ex: 5 }); } catch (e) {} } }
    }
    if (op === 'call') { // Mondiad voor al je andere projecten: POST {tool, args} met header x-hjdk-token (HJDK_TOKEN). Eén koppeling, overal bruikbaar.
      const tk = req.headers['x-hjdk-token'] || url.searchParams.get('token'); if (!process.env.HJDK_TOKEN || tk !== process.env.HJDK_TOKEN) return res.status(401).json({ ok: false, fout: 'token' });
      let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      const tool = String(b.tool || url.searchParams.get('tool') || ''); if (!/^mondiad_[a-z_]+$/.test(tool)) return res.status(400).json({ ok: false, fout: 'tool ontbreekt' });
      return res.status(200).json({ ok: true, result: await md(tool, b.args || {}) });
    }
    if (op === 'tools') { const { mdTools } = await import('../lib/mdmcp.js'); return res.status(200).json({ ok: true, tools: await mdTools() }); }
    // status
    const st = await mdState(); const laatste = await kv.get(K.laatste); const logl = ((await kv.get(K.log)) || []).slice(0, 80);
    return res.status(200).json({ ok: true, gekoppeld: !!(st && st.refresh_token), sleutelInVercel: await mdHeeftSleutel(), mondiadVariabelenGezien: Object.keys(process.env).filter(k => /mondiad/i.test(k)), koppelFout: st && st.fout || null, koppelLink: base + '/api/md/koppel',
      instellingen: { maxActieveCampagnes: MAX_ACTIEF(), nieuwePerDag: NIEUW_PER_DAG(), startbod: START_BOD(), maxBod: MAX_BOD(), dagbudgetPerCampagne: DAG(), totaalPerCampagne: TOTAAL(), minSaldo: MIN_SALDO() },
      laatsteRonde: laatste || null, logboek: logl });
  } catch (e) { return res.status(200).json({ ok: false, fout: String(e && e.message || e) }); }
}
