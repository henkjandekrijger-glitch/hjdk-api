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
const MAX_ACTIEF = () => E('MD_MAX', 12), NIEUW_PER_DAG = () => E('MD_NIEUW_PER_DAG', 2), MIN_SALDO = () => E('MD_MIN_SALDO', 4);
const BIEDING = () => (process.env.MD_BIEDING || 'CPC').toUpperCase(); // CPC geeft volume; CPA leverde bijna niets (Mondiad levert pas als er conversies zijn)
const START_BOD = () => E('MD_BOD', BIEDING() === 'CPC' ? 0.018 : 0.02), MAX_BOD = () => E('MD_MAX_BOD', BIEDING() === 'CPC' ? 0.03 : 0.06), DAG = () => Math.max(10, E('MD_DAG_PER_CAMPAGNE', 10)), TOTAAL = () => E('MD_TOTAAL_PER_CAMPAGNE', 15); // NL in-page push kost gemiddeld ~$0,02 per klik; lager bieden = alleen restverkeer (bots). Mondiad: dagbudget min $10, per zone min $2; het totaalbudget is de echte rem
const DEFAULT_SLUGS = ['thuisbatterij', 'robotstofzuiger', 'boxspring', 'wasmachine', 'koelkast', 'e-bike', 'vaatwasser', 'bank', 'wasdroger', 'airfryer', 'matras', 'elektrische-deken']; // hoge orderwaarde x hoge bol-commissie (wonen/huishouden 7%) eerst, tot de bol-cijfers het overnemen
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
  if (process.env.MD_KZ_AAN !== '1' && !droog) { const st = { at: new Date().toISOString(), uit: true, waarom: 'Betaald verkeer voor keuzehulp staat uit (besluit 8 okt 2026). Weer aan: zet MD_KZ_AAN=1 in Vercel.' }; return st; }
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
    try { for (const r of rows(await md('mondiad_campaign_report', { startDate: van, endDate: tot, breakdown: 'ZONE_ID', campaignId: c.id, size: 500 }))) { const z = String(r.zoneId); const x = pc.zones[z] || (pc.zones[z] = { kliks: 0, vert: 0, kosten: 0 }); x.kliks += num(r.clicks); x.vert += num(r.impressions); x.kosten += num(r.spent); pc.kliks += num(r.clicks); pc.kosten += num(r.spent); const g = zMd[z] || (zMd[z] = { kliks: 0, kosten: 0, vert: 0 }); g.kliks += num(r.clicks); g.kosten += num(r.spent); g.vert += num(r.impressions); } } catch (e) { B('fout', 'rapport zones ' + c.id, String(e.message).slice(0, 120)); }
    if (!/PAUSED|REJECTED|FINISHED/i.test(c.status)) { try { for (const r of rows(await md('mondiad_campaign_report', { startDate: van, endDate: tot, breakdown: 'CREATIVE_ID', campaignId: c.id, size: 100 }))) { const id = String(r.creativeId || r.creative || ''); if (!id) continue; const x = pc.cr[id] || (pc.cr[id] = { kliks: 0, vert: 0 }); x.kliks += num(r.clicks); x.vert += num(r.impressions); } } catch (e) {} }
  }
  const zs = Object.keys(zMd);
  const eigen = {}; if (zs.length) { const keys = []; const KS = ['view', 'start', 'clk', 'conv', 'v2', 'mens', 'eng']; zs.forEach(z => KS.forEach(s => keys.push('c:hjdk6-kz-paid-' + z + '-' + s))); const vals = []; for (let i = 0; i < keys.length; i += 420) vals.push(...await kv.mget(...keys.slice(i, i + 420))); const L = KS.length; zs.forEach((z, i) => { eigen[z] = { aankomst: num(vals[i * L]), gestart: num(vals[i * L + 1]), bol: num(vals[i * L + 2]), conv: num(vals[i * L + 3]), v2: num(vals[i * L + 4]), mens: num(vals[i * L + 5]), eng: num(vals[i * L + 6]) }; }); }
  let leer = {}; try { leer = (await kv.get('hjdk:learn:v1')) || {}; } catch (e) {}
  const lz = leer.zones || {}, lp = leer.pages || {};
  // ---- 1. zones ----
  const zwart = new Set(((await kv.get(K.zwart)) || []).map(String)); const nieuwZwart = [];
  let totA = 0, totB = 0; zs.forEach(z => { totA += eigen[z].aankomst; totB += eigen[z].bol; }); const gem = totA ? totB / totA : 0.02;
  const goed = {}, slecht = {}, zoneTabel = [];
  // kwaliteit per plek: echte mens (beweegt), blijft 20s, start de keuzehulp, klikt naar bol. Met een kleine voorkennis zodat 2 bezoekers niets beslissen.
  let sQ = 0, sN = 0; zs.forEach(z => { const o = eigen[z]; if (o.v2 >= 5) { sQ += o.mens + 2 * o.eng + 4 * o.gestart + 10 * o.bol; sN += o.v2; } }); const qGem = sN ? sQ / sN : 0.8;
  const kwal = o => (o.mens + 2 * o.eng + 4 * o.gestart + 10 * o.bol + qGem * 8) / (o.v2 + 8);
  for (const z of zs) { const m = zMd[z], o = eigen[z], b = lz[z] || {}; const ctr = m.vert ? m.kliks / m.vert : 0; const q = kwal(o);
    const rij = { plek: z, kliks: m.kliks, getoond: m.vert, ctr: r4(ctr), kwamAan: o.aankomst, gemeten: o.v2, mens: o.mens, bleef: o.eng, gestart: o.gestart, naarBol: o.bol, kwaliteit: r4(q / (qGem || 1)), oordeel: zwart.has(z) ? 'uitgesloten' : 'test' }; zoneTabel.push(rij);
    if (zwart.has(z)) continue;
    let waarom = '';
    if (m.kliks >= 15 && o.aankomst < 0.4 * m.kliks) waarom = `nep: ${m.kliks} kliks bij Mondiad, maar ${o.aankomst} kwamen aan`;
    else if (m.kliks >= 10 && ctr >= 0.15 && o.v2 >= 6 && o.mens < 0.5 * o.v2) waarom = `klikfraude of misklikken: ${(ctr * 100).toFixed(0)}% van wie het zag klikte, maar maar ${o.mens} van ${o.v2} bewogen`;
    else if (o.v2 >= 12 && o.mens < 0.25 * o.v2) waarom = `geen echte mensen: van ${o.v2} bezoekers bewogen er maar ${o.mens} (scrollen/tikken)`;
    else if (o.aankomst >= 60 && o.gestart === 0 && o.bol === 0) waarom = `dood: ${o.aankomst} bezoekers, niemand deed iets`;
    else if (o.v2 >= 40 && o.eng === 0 && o.bol === 0) waarom = `${o.v2} bezoekers, niemand bleef 20 seconden en niemand klikte naar bol`;
    else if (o.aankomst >= 250 && o.bol === 0) waarom = `${o.aankomst} bezoekers en geen enkele bol-klik`;
    else if (num(b.clicks) >= 500 && num(b.orders) === 0) waarom = `${b.clicks} bol-kliks en geen bestelling`;
    if (waarom) { nieuwZwart.push(z); zwart.add(z); rij.oordeel = 'uitgesloten'; rij.waarom = waarom; B('zone uit', z, waarom); continue; }
    const rate = o.aankomst ? o.bol / o.aankomst : 0;
    if (num(b.orders) > 0) goed[z] = 2; else if (o.aankomst >= 40 && rate >= 1.5 * gem && o.bol >= 3) goed[z] = 1.5; else if (o.v2 >= 10 && q >= 1.4 * qGem) goed[z] = 1.4; else if (o.v2 >= 25 && o.mens >= 0.6 * o.v2 && o.eng >= 0.25 * o.v2) goed[z] = 1.3; // echte mensen die blijven = meer verkeer van die plek
    else if (o.v2 >= 10 && q < 0.6 * qGem) slecht[z] = 0.6; // twijfelachtig: niet uitsluiten, wel minder betalen
    rij.oordeel = goed[z] ? 'goed: hoger bod' : slecht[z] ? 'matig: lager bod' : 'test'; }
  // ---- 2+3. per campagne: zwarte lijst, zone-biedingen, advertenties, bod ----
  const vandaag = (await kv.get(K.dag(DAY()))) || { nieuweCampagnes: 0, nieuweTeksten: {}, uit: 0 };
  for (const pc of Object.values(perCamp)) { const c = pc.c; if (/PAUSED|REJECTED|FINISHED/i.test(c.status)) continue;
    let det = null; try { det = (rows(await md('mondiad_get_campaign_details', { ids: [String(c.id)] })) || [])[0]; } catch (e) {} if (!det) continue;
    const upd = { id: c.id };
    const cur = new Set((det.zoneIdList || []).map(String)); const voeg = [...zwart].filter(z => !cur.has(z));
    if (/black/i.test(det.zoneIdListMode || '') && voeg.length) { upd.zoneIdList = [...cur, ...voeg].map(Number).filter(Boolean); upd.zoneIdListMode = 'BLACK_LIST'; B('zwarte lijst', c.id + ' (' + pc.slug + ')', '+' + voeg.length + ' zones'); }
    const bod = num(det.bid) || START_BOD(); const zb = {}; (det.zoneCustomBids || []).forEach(x => { zb[String(x.zoneId)] = num(x.bid); });
    let zbVer = false; for (const [z, f] of Object.entries(goed)) { if (!pc.zones[z]) continue; const nb = r4(Math.min(MAX_BOD(), bod * f)); if (!zb[z] || zb[z] < nb) { zb[z] = nb; zbVer = true; B('zone hoger bod', z + ' in ' + c.id, 'x' + f + ' -> $' + nb); } }
    for (const [z, f] of Object.entries(slecht)) { if (!pc.zones[z]) continue; const nb = r4(Math.max(0.001, bod * f)); if (zb[z] == null || zb[z] > nb) { zb[z] = nb; zbVer = true; B('zone lager bod', z + ' in ' + c.id, 'weinig echte mensen; x' + f + ' -> $' + nb); } }
    for (const z of zwart) if (zb[z] != null) { delete zb[z]; zbVer = true; }
    if (zbVer && String(c.bidType || det.bidType || '').toUpperCase() !== 'CPA') upd.zoneCustomBids = Object.entries(zb).map(([zoneId, b]) => ({ zoneId: Number(zoneId), bid: b }));
    // te weinig verkeer terwijl de campagne goed doorklikt: bod omhoog
    const cA = Object.keys(pc.zones).reduce((a, z) => a + (eigen[z] ? eigen[z].aankomst : 0), 0), cB = Object.keys(pc.zones).reduce((a, z) => a + (eigen[z] ? eigen[z].bol : 0), 0);
    if (pc.kliks < 14 * 20 && cA >= 20 && cB >= 3 && gem > 0 && cB / cA >= gem && bod < MAX_BOD()) { upd.bid = r4(Math.min(MAX_BOD(), bod * 1.2)); B('bod omhoog', c.id + ' (' + pc.slug + ')', `weinig verkeer (${pc.kliks} kliks/14d) maar goede doorklik; $${bod} -> $${upd.bid}`); }
    // CPC met te weinig volume, maar de bezoekers zijn echte mensen: bod stapsgewijs omhoog (meer veilingen winnen bij goede plekken)
    if (!upd.bid && String(c.bidType || det.bidType || '').toUpperCase() === 'CPC' && bod < MAX_BOD() && !vandaag['bod' + c.id]) { const zz = Object.keys(pc.zones).filter(z => !zwart.has(z) && eigen[z]); const v2 = zz.reduce((a, z) => a + eigen[z].v2, 0); const qs = zz.reduce((a, z) => a + kwal(eigen[z]) * eigen[z].v2, 0); const dagen = Math.max(1, Math.min(14, Math.ceil((Date.now() - new Date(det.createdAt || det.startDate || Date.now() - 864e5).getTime()) / 864e5)));
      if (pc.kliks / dagen < 40 && v2 >= 8 && qs / v2 >= qGem) { upd.bid = r4(Math.min(MAX_BOD(), bod * 1.25)); vandaag['bod' + c.id] = 1; B('bod omhoog', c.id + ' (' + pc.slug + ')', `echte mensen (${v2} gemeten bezoekers, kwaliteit ${(qs / v2 / (qGem || 1)).toFixed(2)}x gemiddeld) maar weinig kliks; $${bod} -> $${upd.bid}`); } }
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
  const lopend = Object.values(perCamp).filter(pc => !/PAUSED|REJECTED|FINISHED/i.test(pc.c.status) && !(String(pc.c.bidType || '').toUpperCase() === 'CPA' && pc.kliks < 100));
  if (lopend.length > 4 && vandaag.uit < 1) { const kand = lopend.filter(pc => pc.kosten >= 3 && !num((lp['kz:' + pc.slug] || {}).orders)).sort((a, b) => waarde(a) - waarde(b))[0];
    const med = lopend.map(waarde).sort((a, b) => a - b)[Math.floor(lopend.length / 2)];
    if (kand && waarde(kand) < 0.5 * med) { B('campagne uit', kand.c.id + ' (' + kand.slug + ')', `$${kand.kosten.toFixed(2)} uitgegeven, laagste opbrengst per dollar`); if (!droog) { try { try { await md('mondiad_update_campaign', { json: JSON.stringify({ id: kand.c.id, status: 'PAUSED' }) }); } catch (e1) { await md('mondiad_update_campaign', { json: JSON.stringify({ id: kand.c.id, dailyBudget: 1 }) }); B('campagne afgeknepen', kand.c.id, 'pauzeren via de API kan niet; dagbudget naar $1'); } vandaag.uit++; } catch (e) { B('fout', 'pauzeren ' + kand.c.id, String(e.message).slice(0, 120)); } } } }
  const heeft = new Set(lopend.map(pc => pc.slug));
  let uit = []; try { const u = await kv.get('hjdk:kz:uitgelicht'); JSON.stringify(u || '').replace(/"([a-z0-9]+(?:-[a-z0-9]+)*)"/g, (m, s2) => { uit.push(s2); return m; }); } catch (e) {}
  // volgorde = waar de omzet zit: eerst wat bij bol al bestellingen/kliks gaf, dan hoge orderwaarde, dan seizoen/actueel
  let kandidaten = [...Object.entries(lp).filter(([k, x]) => k.startsWith('kz:') && (num(x.orders) > 0 || num(x.clicks) >= 20)).sort((a, b) => num(b[1].commission) - num(a[1].commission) || num(b[1].orders) - num(a[1].orders) || num(b[1].clicks) - num(a[1].clicks)).map(([k]) => k.slice(3)), ...DEFAULT_SLUGS, ...uit];
  const alle = await items(); const bestaat = new Set(alle.map(i => i.slug));
  kandidaten = [...new Set(kandidaten)].filter(s => bestaat.has(s) && !heeft.has(s));
  const ruimte = Math.min(MAX_ACTIEF() - lopend.length, NIEUW_PER_DAG() - vandaag.nieuweCampagnes);
  if (saldo < MIN_SALDO()) B('let op', 'saldo $' + saldo.toFixed(2), 'te laag voor nieuwe campagnes; bijstorten bij Mondiad');
  else if (ruimte > 0 && kandidaten.length) {
    let tmpl = null; try { const t = (lopend[0] || Object.values(perCamp)[0]); if (t) tmpl = (rows(await md('mondiad_get_campaign_details', { ids: [String(t.c.id)] })) || [])[0]; } catch (e) {}
    for (const slug of kandidaten.slice(0, ruimte)) { const it = alle.find(i => i.slug === slug); const vs = await teksten(it, [], 4); const img = droog ? { icon: '', image: '' } : await beelden(slug);
      if (!droog && (!img.icon || !img.image)) { B('fout', 'nieuwe campagne ' + slug, 'beelden uploaden mislukt'); continue; }
      const camp = Object.assign({ adType: ['IN_PAGE_PUSH'], bidType: BIEDING(), countryTargeting: (process.env.MD_LANDEN || 'NL').split(','), countryTargetingMode: 'WHITE_LIST', deviceTargeting: [4, 5], deviceTargetingMode: 'WHITE_LIST', languageTargeting: [137], languageTargetingMode: 'WHITE_LIST', trafficType: ['MAINSTREAM'], landingPageType: 'MAINSTREAM', frequencyCap: { frequency: 1, duration: 24, actionType: 'IMPRESSION', actionScope: 'CAMPAIGN' }, dayPartingTimezone: 'Europe/Amsterdam', hideReferrer: true }, tmpl ? { deviceTargeting: tmpl.deviceTargeting, languageTargeting: tmpl.languageTargeting, frequencyCap: tmpl.frequencyCap } : {}, {
        name: 'KZ-MD ' + BIEDING() + ' | ' + slug + ' | NL | IPP | ' + DAY().replace(/-/g, ''), status: 'Pending', runAfterModeration: true, bid: START_BOD(), dailyBudget: DAG(), budget: TOTAAL(), zoneIdDailyBudget: 2,
        url: SITE + '/keuzehulp/' + slug + '?utm_source=mondiad&utm_medium=ipp&utm_campaign=kzmd-' + slug + '&clickid=[clickid]&zoneid=[zoneid]&campaignid=[campaignid]&creativeid=[creativeid]',
        zoneIdListMode: 'BLACK_LIST', zoneIdList: [...zwart].map(Number).filter(Boolean),
        creatives: vs.map((v, i) => ({ title: v.title, description: v.description, icon: img.icon, image: img.image, tag: 'kz-' + slug.slice(0, 12) + '-' + (i + 1), status: 'PENDING' })) });
      B('nieuwe campagne', slug, vs.map(v => v.title).join(' | '));
      if (!droog) { try { const r = await md('mondiad_create_campaign', { campaign: camp }); vandaag.nieuweCampagnes++; B('aangemaakt', slug, JSON.stringify(r).slice(0, 120)); } catch (e) { B('fout', 'aanmaken ' + slug, String(e.message).slice(0, 200)); } } }
  }
  if (!droog) { await kv.set(K.zwart, [...zwart]); await kv.set(K.dag(DAY()), vandaag, { ex: 3 * 86400 }); }
  const samen = { at: new Date().toISOString(), droog: !!droog, saldo, campagnes: camps.map(c => ({ id: c.id, slug: slugOf(c.url), status: c.status, bod: c.bid, dagbudget: c.dailyBudget, kliks: c.clicks, kosten: c.spent, conversies: c.conversions })), zonesGezien: zs.length, zones: zoneTabel.sort((a, b) => b.kliks - a.kliks).slice(0, 60), zwarteLijst: zwart.size, nieuwZwart: nieuwZwart.length, gemiddeldeBolKlikPerBezoek: r4(gem), besluiten };
  if (!droog) { await kv.set(K.laatste, samen); for (const b of besluiten) await log(b); }
  return samen;
}


const STATUS_NL = { RUNNING: 'loopt', PENDING: 'wacht op goedkeuring', PAUSED: 'gepauzeerd', FINISHED: 'budget op', DAILY_LIMIT_REACHED: 'dagbudget op', REJECTED: 'afgekeurd', NO_ACTIVE_CREATIVES: 'geen advertentie actief', OFF_ACCOUNT_BUDGET: 'saldo op', WAITING_START_DATE: 'start later' };
const SOORT_NL = { 'zone uit': 'Advertentieplek uitgesloten', 'zwarte lijst': 'Zwarte lijst bijgewerkt', 'zone hoger bod': 'Hoger bod op goede plek', 'zone lager bod': 'Lager bod op matige plek', 'bod omhoog': 'Bod verhoogd', 'nieuwe advertentie': 'Nieuwe advertentietekst', 'advertentie uit': 'Zwakke advertentie uitgezet', 'nieuwe campagne': 'Nieuwe campagne voorbereid', aangemaakt: 'Campagne aangemaakt', 'campagne uit': 'Campagne stilgezet', 'budget bijgevuld': 'Budget bijgevuld', 'let op': 'Let op', fout: 'Fout', gekoppeld: 'Gekoppeld' };
const hx = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nlTijd = iso => { try { return new Date(iso).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } };
async function statusPagina(st, laatste, logl) {
  const vandaag = DAY(); let camps = [], tot = { kliks: 0, kosten: 0 }, saldo = laatste ? laatste.saldo : null;
  try { const ids = new Set(((laatste && laatste.campagnes) || []).map(c => String(c.id))); const rep = rows(await md('mondiad_campaign_report', { startDate: vandaag, endDate: vandaag, breakdown: 'CAMPAIGN', size: 300 })); const per = {}; rep.forEach(r => { per[String(r.campaignId)] = r; });
    const lijst = rows(await md('mondiad_list_campaigns', { url: 'keuzehulp', size: 300, excludeStatuses: ['ARCHIVED', 'ARCHIVED_COMPLETED'], responseFields: ['ID', 'NAME', 'STATUS', 'BID', 'BID_TYPE', 'URL'] })).filter(c => /utm_source=mondiad/.test(c.url || ''));
    camps = lijst.map(c => { const r = per[String(c.id)] || {}; return { id: c.id, slug: slugOf(c.url), status: STATUS_NL[String(c.status).toUpperCase()] || String(c.status).toLowerCase(), soort: String(c.bidType).toUpperCase() === 'CPC' ? 'per klik' : 'per resultaat', bod: num(c.bid), kliks: num(r.clicks), kosten: num(r.spent) }; }).sort((a, b) => b.kliks - a.kliks);
    camps.forEach(c => { tot.kliks += c.kliks; tot.kosten += c.kosten; });
    const acc = await md('mondiad_get_current_account', {}); saldo = num(acc && acc.account && acc.account.accountBalance); } catch (e) {}
  let bol = null; try { const r = await fetch(SITE + '/api/bol/report?from=' + vandaag + '&to=' + vandaag + '&what=promotion&only=sites'); const j = await r.json(); bol = { tot: j.total || {}, sites: j.bySite || {} }; } catch (e) {}
  let kz = null; try { const r = await fetch(SITE + '/api/kz/status'); kz = await r.json(); } catch (e) {}
  const kzSite = bol ? Object.entries(bol.sites).find(([k]) => /1547300/.test(k)) : null;
  const eur = v => '€' + num(v).toFixed(2).replace('.', ','), usd = v => '$' + num(v).toFixed(2).replace('.', ',');
  const kaart = (t, v, sub) => `<div class="k"><div class="kt">${hx(t)}</div><div class="kv">${v}</div>${sub ? `<div class="ks">${sub}</div>` : ''}</div>`;
  const besl = logl.slice(0, 25).map(b => `<li><span class="t">${hx(nlTijd(b.at))}</span> <b>${hx(SOORT_NL[b.soort] || b.soort)}</b>: ${hx(String(b.wat || '').replace(/^(\d+) \(([^)]+)\)$/, '$2'))}${b.waarom ? ' — ' + hx(String(b.waarom).replace(/[{}"\\]/g, '').slice(0, 160)) : ''}</li>`).join('');
  const FN = ['Standaardadvies bovenaan', 'Deal van vandaag bovenaan', 'Eerst prijsalarm, dan advies']; let frij = ''; try { const ks = []; [0, 1, 2].forEach(i => ['imp', 'clk', 'sub', 'ok'].forEach(x => ks.push('c:hjdk6-kz-fun-v' + i + '-' + x))); const v = await kv.mget(...ks); frij = [0, 1, 2].map(i => { const [a, b, c, d] = [0, 1, 2, 3].map(j => num(v[i * 4 + j])); return `<tr><td>${FN[i]}</td><td class="n">${a}</td><td class="n">${b}</td><td class="n">${c}</td><td class="n">${a ? (100 * d / a).toFixed(1).replace('.', ',') + '%' : '-'}</td></tr>`; }).join(''); } catch (e) {}
  const zrij = ((laatste && laatste.zones) || []).filter(z => z.kliks > 0 || z.kwamAan > 0).slice(0, 30).map(z => `<tr><td>${hx(z.plek)}</td><td class="n">${z.kliks}</td><td class="n">${z.kwamAan}</td><td class="n">${z.mens}</td><td class="n">${z.bleef}</td><td class="n">${z.gestart}</td><td class="n">${z.naarBol}</td><td>${hx(z.oordeel)}</td></tr>`).join('');
  const rijen = camps.map(c => `<tr><td>${hx(c.slug)}</td><td>${hx(c.status)}</td><td>${hx(c.soort)} · $${c.bod.toFixed(3).replace('.', ',')}</td><td class="n">${c.kliks}</td><td class="n">${usd(c.kosten)}</td></tr>`).join('');
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Keuzehulp status</title>
<style>:root{--bg:#fafaf9;--card:#fff;--ink:#1c1917;--mut:#78716c;--line:#e7e5e4;--acc:#0f766e}@media(prefers-color-scheme:dark){:root{--bg:#1c1917;--card:#292524;--ink:#f5f5f4;--mut:#a8a29e;--line:#44403c;--acc:#5eead4}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,sans-serif}main{max-width:860px;margin:0 auto;padding:20px 16px 40px}h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:28px 0 10px}.mut{color:var(--mut);font-size:14px}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.k{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}.kt{font-size:13px;color:var(--mut)}.kv{font-size:24px;font-weight:700;margin-top:2px}.ks{font-size:13px;color:var(--mut)}
.tw{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:12px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);white-space:nowrap}th{color:var(--mut);font-weight:600}td.n,th.n{text-align:right}
ul{padding-left:18px;margin:0}li{margin:0 0 8px}.t{color:var(--mut);font-size:13px}</style></head><body><main>
<h1>Keuzehulp: hoe staat het?</h1><div class="mut">Bijgewerkt ${hx(nlTijd(new Date().toISOString()))} (Nederlandse tijd) · de lerende lus draait elk half uur${st && st.refresh_token ? '' : ' · <b>Mondiad niet gekoppeld</b>'}</div>
<h2>Vandaag</h2><div class="g">
${kaart('Bestellingen bij bol', bol ? num(bol.tot.orders) : '?', bol ? 'commissie ' + eur(bol.tot.commission) : '')}
${kaart('Kliks naar bol', bol ? num(bol.tot.clicks) : '?', kzSite ? 'waarvan Keuzehulp-site ' + num(kzSite[1].clicks) : 'Keuzehulp-site nog 0')}
${kaart('Mondiad-kliks (keuzehulp)', tot.kliks, 'kosten ' + usd(tot.kosten))}
${kaart('Mondiad-saldo', saldo != null ? usd(saldo) : '?', '')}
${kaart('Aanmeldingen', kz ? num(kz.abonnees) + ' mail' : '?', kz && kz.meldingen ? num(kz.meldingen.aangezet) + ' push' : '')}
${kaart('Plekken uitgesloten', laatste ? num(laatste.zwarteLijst) : 0, 'geen echte mensen of geen bol-kliks')}
</div>
<h2>Campagnes bij Mondiad</h2><div class="tw"><table><tr><th>Keuzehulp</th><th>Status</th><th>Betaling · bod</th><th class="n">Kliks vandaag</th><th class="n">Kosten vandaag</th></tr>${rijen || '<tr><td colspan="5">Geen campagnes gevonden</td></tr>'}</table></div>
<h2>Welke aanpak laat mensen kopen? (test loopt vanzelf)</h2><div class="mut" style="margin-bottom:8px">Elke betaalde bezoeker krijgt één van drie pagina's. De lus stuurt steeds meer bezoekers naar de aanpak die het best werkt.</div><div class="tw"><table><tr><th>Aanpak</th><th class="n">Bezoekers</th><th class="n">Naar bol</th><th class="n">Aangemeld</th><th class="n">Succes</th></tr>${frij || '<tr><td colspan="5">Nog geen gegevens</td></tr>'}</table></div>
<h2>Advertentieplekken (14 dagen)</h2><div class="mut" style="margin-bottom:8px">Per plek waar onze advertentie stond: hoeveel er klikten, hoeveel echt aankwamen, hoeveel echt bewogen (mens), bleven (20 sec), de keuzehulp startten en naar bol gingen.</div><div class="tw"><table><tr><th>Plek</th><th class="n">Kliks</th><th class="n">Kwam aan</th><th class="n">Mens</th><th class="n">Bleef</th><th class="n">Gestart</th><th class="n">Naar bol</th><th>Oordeel</th></tr>${zrij || '<tr><td colspan="8">Nog geen gegevens</td></tr>'}</table></div>
<h2>Wat de lus besloot</h2><ul>${besl || '<li>Nog niets.</li>'}</ul>
<p class="mut" style="margin-top:24px">Bestellingen bij bol komen vaak pas 1 tot een paar dagen na de klik binnen.</p></main></body></html>`;
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
    // status: alleen met de geheime sleutel (?k=...). Eenmalig aanmaken met ?maak=1 zolang er nog geen sleutel is.
    let sk = process.env.MD_STATUS_KEY || await kv.get('hjdk:md:statuskey');
    if (!sk && url.searchParams.get('maak')) { sk = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 8); await kv.set('hjdk:md:statuskey', sk); return res.status(200).json({ ok: true, link: base + '/api/md/status?k=' + sk }); }
    if (!sk || url.searchParams.get('k') !== sk) { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(403).send('<p style="font:16px system-ui;padding:24px">Deze pagina is privé.</p>'); }
    const st = await mdState(); const laatste = await kv.get(K.laatste); const logl = ((await kv.get(K.log)) || []).slice(0, 80);
    if (url.searchParams.get('json')) return res.status(200).json({ ok: true, gekoppeld: !!(st && st.refresh_token), laatsteRonde: laatste || null, logboek: logl });
    res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(await statusPagina(st, laatste, logl));
  } catch (e) { return res.status(200).json({ ok: false, fout: String(e && e.message || e) }); }
}
