// Campagne-archief van Clickmind (Henkjan 26 nov 2026: "Haal alles van propeller ads op alle data en gooi die in clikmind en alles van alle
// andere platforms waar we campagnes draaien zodat ook iedere campagne naar CM mind om beter te worden").
// Elke ochtend (cron 05:57 UTC) voor gisteren (UTC), per netwerk alles wat het netwerk weet, naast wat Clickmind zelf mat:
//  - PropellerAds en Google Ads via propellerads-mcp /api/statistiek {archief} (de sleutels blijven daar): instellingen (formaat, biedmodel,
//    bod per land, dagbudget, landing, targeting), creatives (titel, tekst, beeld, cta) en cijfers per campagne, creative, land, os en zone;
//  - Mondiad via de eigen Mondiad-koppeling (lib/mdmcp.js) MET advertenties (27 nov 2026): het rapport per creative (CREATIVE_ID) van de dag,
//    de instellingen (formaat, biedmodel, bod, dagbudget, landing, landen) van alle campagnes in één keer uit mondiad_list_campaigns (kv cm:mdcamps, 24 uur)
//    en tekst en beeld per advertentie in batches uit mondiad_get_creative_details (kv-hash cm:mdcre, 60 dagen), zodat de historie ze niet
//    honderden keren ophaalt; TikTok via lib/tiktok.js per advertentie;
//  - netwerken waarvan de sleutel elders zit (MGID, RichAds, Clickadu) komen uit data/camp-historie/<net>.json via leg(net) (op=campagnes&leg=<net>,
//    alleen de beschermde host): vervangt alleen de campagnes van dat netwerk per dag; een ronde laat ze staan. MGID staat sinds 6 nov uit, de
//    sleutel zit in richads-mcp: alleen de historie (14 en 15 okt, 4 tot 6 nov) is ingelegd, euro's omgerekend naar dollars (kosten_bron houdt de euro's);
//  - eigen uitkomsten per campagne uit Clickmind (mm:cu, mm:cx, mm:c: echt mens, actie, aanmelding, dialoog, koop) en hun waarde in dollars
//    (de munt van /api/geld, lib/waarde.js).
// Elke nieuwe creative krijgt eenmalig labels (haak, emotie, belofte): eerst AI op de server, lukt dat niet dan de werklijst cm:crl:todo die een chat of geplande taak met eigen tokens labelt (op=campagnes&labelwerk=1, terug met &labels=).
// Leren: leer() telt over 14 dagen per kenmerk (netwerk, project, formaat, land, os, biedmodel, bod, landing, cta, haak, emotie, belofte)
// kosten, kliks, echte mensen en waarde, en zet de beste en slechtste naast elkaar. Alleen meten en adviseren: Clickmind wijzigt hier
// geen campagne. RichAds en Clickadu hebben hun sleutel in een eigen koppeling en staan hier nog niet in; leer() meldt in `ontbreekt` wat er echt nog mist.
// ronde({dag, alleen:'mondiad'}) haalt één netwerk opnieuw op en laat de rest van de dag staan; inhaal({van, tot, alleen}) doet dat over een
// periode met een eigen sleutel per netwerk (cm:inhaal:<net>), zodat de gewone inhaal (cm:inhaal) onaangeroerd blijft.
import { kv } from './db.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { projectVan, leesWaarde, waardeVan, EUR_USD } from './waarde.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const r2 = x => Math.round(N(x) * 100) / 100;
const gisteren = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };
const DAG_TTL = 120 * 86400;

async function lus(body, ms = 58000) {
  const s = process.env.SHOP_SLEUTEL || ''; if (!s) return { ok: false, fout: 'geen SHOP_SLEUTEL' };
  try {
    const r = await fetch((process.env.PA_LUS_URL || 'https://propellerads-mcp.vercel.app') + '/api/statistiek', { method: 'POST', headers: { 'content-type': 'application/json', 'x-shop-sleutel': s }, body: JSON.stringify(body), signal: AbortSignal.timeout(ms) });
    return (await r.json().catch(() => null)) || { ok: false, fout: 'HTTP ' + r.status };
  } catch (e) { return { ok: false, fout: String(e && e.message || e).slice(0, 120) }; }
}

// eigen uitkomsten per netwerk|campagne op een dag (zelfde bronnen als /api/geld)
async function uitkomsten(d) {
  const o = {};
  for (const k of ['mm:cu:', 'mm:cx:', 'mm:c:']) {
    let h = null; try { h = await kv.raw(['HGETALL', k + d]); } catch (e) {}
    for (const [f, v] of paren(h)) { const p = f.split('|'); if (p.length < 3) continue; const key = p[0] + '|' + p[1], veld = p.slice(2).join('|'), x = o[key] || (o[key] = {}); x[k + veld] = N(x[k + veld]) + N(v); }
  }
  const uit = {};
  for (const [key, x] of Object.entries(o)) uit[key] = { echt: Math.max(N(x['mm:cu:echt']), N(x['mm:cx:m']), N(x['mm:c:mens'])), actie: N(x['mm:cu:actie']) + N(x['mm:cx:actie']), aanmelding: N(x['mm:cu:aanmelding']) + N(x['mm:cx:aanmelding']), dialoog: N(x['mm:cu:dialoog']), koop: N(x['mm:cu:koop']), bezoek: N(x['mm:c:n']) };
  return uit;
}

// AI-labels per creative, eenmalig (cm:crl:<hash>). Eerst eigen tokens (Henkjan 26 nov 2026: eigen accounts eerst, gateway als terugval):
// lukt AI op de server niet, dan gaat de tekst naar de werklijst cm:crl:todo; een chat of geplande taak labelt die met eigen tokens
// (op=campagnes&labelwerk=1 lezen, op=campagnes&labels=<JSON> terugzetten). leer() leest de labels bij het tellen.
const crlKey = t => 'cm:crl:' + createHash('sha1').update(t).digest('hex').slice(0, 16);
const crTekst = c => [c.titel, c.tekst].filter(Boolean).join(' / ').slice(0, 400);
async function labels(crs, max = 25) {
  let nieuw = 0, fout = '', aiUit = false;
  for (const c of crs) {
    const t = crTekst(c); if (t.length < 8) continue;
    const k = crlKey(t);
    let l = await kv.get(k).catch(() => null);
    if (!l && !aiUit && nieuw < max) {
      nieuw++;
      try {
        const { berichten, HAIKU } = await import('./ai.js');
        const r = await berichten({ fn: 'cm-creative-label', model: HAIKU, max: 80, timeout: 15000, cacheTtl: 90 * 86400, system: LABEL_SYS, user: t });
        const m = String(r.txt || '').match(/\{[\s\S]*\}/); l = m ? JSON.parse(m[0]) : null;
        if (l) await kv.set(k, l, { ex: 90 * 86400 }).catch(() => {}); else fout = 'geen JSON';
      } catch (e) { fout = String(e && e.message || e).slice(0, 100); aiUit = true; }
    }
    if (l) c.ai = { haak: String(l.haak || '-').toLowerCase(), emotie: String(l.emotie || '-').toLowerCase(), belofte: String(l.belofte || '').slice(0, 40) };
    else await kv.raw(['HSET', 'cm:crl:todo', k.slice(7), t]).catch(() => {});
  }
  return { nieuw, fout };
}
export const LABEL_SYS = 'Je labelt een advertentietekst. Antwoord alleen met JSON: {"haak":"nieuwsgierig|voordeel|angst|bewijs|vraag|getal|korting|gratis|urgentie|persoonlijk|anders","emotie":"blij|bang|boos|nieuwsgierig|neutraal","belofte":"max 4 woorden"}';
export async function labelWerk(n = 80) {
  const h = paren(await kv.raw(['HGETALL', 'cm:crl:todo']).catch(() => null));
  return { uitleg: 'Creatives zonder label. Label elk met ' + LABEL_SYS.slice(46) + ' en zet terug met ?op=campagnes&labels={"<k>":{"haak":..,"emotie":..,"belofte":..}}', open: h.length, werk: h.slice(0, n).map(([k, t]) => ({ k, tekst: t })) };
}
export async function zetLabels(obj) {
  let n = 0; const H = ['nieuwsgierig', 'voordeel', 'angst', 'bewijs', 'vraag', 'getal', 'korting', 'gratis', 'urgentie', 'persoonlijk', 'anders'], E = ['blij', 'bang', 'boos', 'nieuwsgierig', 'neutraal'];
  for (const [k, l] of Object.entries(obj || {})) {
    if (!/^[0-9a-f]{16}$/.test(k) || !l) continue;
    const v = { haak: H.includes(String(l.haak)) ? l.haak : 'anders', emotie: E.includes(String(l.emotie)) ? l.emotie : 'neutraal', belofte: String(l.belofte || '').slice(0, 40), door: 'eigen' };
    await kv.set('cm:crl:' + k, v, { ex: 90 * 86400 }); await kv.raw(['HDEL', 'cm:crl:todo', k]).catch(() => {}); n++;
  }
  return { ok: true, gezet: n };
}

const merkVan = (naam, p) => /KAUFBERATER|WHICHTOBUY|KEUZEHULP/i.test(naam) ? 'keuzehulpen' : /SURGERY|CHIRURG/i.test(naam) ? 'chirurgie' : /SEALED/i.test(naam) ? 'sealed' : p;
const projGads = naam => /kadoly|shop/i.test(naam) ? 'kadoly' : /mylevel|dmv|asvab|citizenship|cdl|real estate/i.test(naam) ? 'mylevel' : projectVan(naam);

// Whop Ads (Meta via Whop, Kadoly; lib/whop.js) in het archief (Henkjan 27 nov 2026: "Kijk ook naar whop"): per dag elke advertentie met
// vertoningen, kliks of uitgaven, gegroepeerd per Whop-campagne, met kop, tekst, beeld, knop en landing; net 'meta' (medium meta in het geheugen).
export function whopCampagnesUit(ads) {
  const js = v => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch (e) { return null; } };
  const teksten = v => (js(v) || []).map(x => typeof x === 'string' ? x : x && x.text).filter(Boolean);
  const per = {};
  for (const a of ads || []) {
    const sp = N(a.spend), kl = Math.max(N(a.link_clicks), N(a.clicks)), vt = N(a.impressions), cv = N(a.purchases) || N(a.conversions);
    if (!(sp > 0 || kl > 0 || vt > 0)) continue;
    const grp = js(a.ad_group) || {}, camp = js(grp.ad_campaign) || {}, cid = String(camp.id || grp.ad_campaign_id || a.ad_campaign_id || grp.id || 'whop');
    const c = per[cid] || (per[cid] = { id: cid, naam: 'KADOLY WHOP ' + String(camp.title || camp.name || grp.title || grp.name || cid).slice(0, 80), vert: 0, kliks: 0, kosten: 0, conv: 0, creatives: [], instellingen: { formaat: 'meta', landing: '' } });
    const cr = (js(a.creatives) || [])[0] || {};
    c.vert += vt; c.kliks += kl; c.kosten = r2(c.kosten + sp); c.conv += cv;
    c.creatives.push({ id: String(a.id), titel: teksten(a.headlines).join(' | ') || String(a.title || ''), tekst: teksten(a.primary_texts).join(' | '), beeld: String(cr.url || cr.image_url || cr.thumbnail_url || '').slice(0, 300), cta: String(a.call_to_action || ''), landing: String(a.url || '').slice(0, 300), vert: vt, kliks: kl, kosten: sp, conv: cv });
    if (!c.instellingen.landing && a.url) c.instellingen.landing = String(a.url).slice(0, 300);
  }
  return Object.values(per);
}
async function whopDag(d) {
  const W = await import('./whop.js'); if (!W.whopKlaar()) return { ok: true, campagnes: [] };
  const r = await W.whopAds(d + 'T00:00:00', d + 'T23:59:59');
  return r.ok ? { ok: true, campagnes: whopCampagnesUit(r.ads) } : { ok: false, fout: String(r.fout || r.status || 'geen antwoord').slice(0, 100) };
}

const r4 = x => Math.round(N(x) * 1e4) / 1e4;
const rijen = x => (Array.isArray(x) ? x : Array.isArray(x && x.data) ? x.data : Array.isArray(x && x.items) ? x.items : Array.isArray(x && x.content) ? x.content : []);
const DAGRE = /^\d{4}-\d{2}-\d{2}$/;

// Mondiad MET advertenties, in batches (27 nov 2026; 1121 campagnes, dagen met 100 tot 350: per campagne aanroepen was te traag). Antwoorden van de
// Mondiad-koppeling (gezien op 27 nov):
//  mondiad_campaign_report {startDate,endDate,breakdown:'CAMPAIGN'|'CREATIVE_ID',size,page} -> {meta:{totalPages,..},data:[{campaignId,(campaignName),creativeId,creativeTag,
//    creativeTitle,carrierName,impressions,clicks,spent,conversions,..}]}; bij CREATIVE_ID kunnen er meerdere rijen per creative zijn (per carrier): optellen;
//  mondiad_list_campaigns {size<=500,page (begint bij 0),responseFields:[..]} -> {meta:{totalRows,totalPages},data:[{id,name,status,bid,dailyBudget,url,
//    countryTargeting:['US'],startDate,adType:['IN_PAGE_PUSH'],bidType:'CPA'}]};
//  mondiad_get_creative_details {ids:[..]} -> [{id,tag,title,description,image|null,icon,status,campaignId}] (veel advertenties in één aanroep).
// Instellingen van alle campagnes uit de lijst in een compacte kaart: kv cm:mdcamps (24 uur, in de module 10 minuten). Tekst en beeld per
// advertentie in de kv-hash cm:mdcre (veld = creative-id, 60 dagen), per dag alleen wat daar nog ontbreekt, in stukken van 50 id's.
let MD_MEM = null;
export function mondiadWis() { MD_MEM = null; }
const MD_VELDEN = ['ID', 'NAME', 'STATUS', 'BID', 'DAILY_BUDGET', 'URL', 'COUNTRY_TARGETING', 'START_DATE', 'AD_TYPE', 'BID_TYPE'];
const MD_STUK = 50, MD_HMGET = 500, MD_CRE_TTL = 60 * 86400;
async function mondiadKaart(mdf, ids, fouten) {
  const nu = Date.now();
  let m = MD_MEM && nu - MD_MEM.gelezen < 10 * 60e3 ? MD_MEM : null;
  if (!m) { const k = await kv.get('cm:mdcamps').catch(() => null); if (k && k.k) m = MD_MEM = { t: N(k.t), k: k.k, gelezen: nu }; }
  if (!m || (ids.some(id => !m.k[id]) && nu - m.t > 36e5)) {
    try {
      const k = {};
      for (let page = 0; page < 10; page++) {
        const r = await mdf('mondiad_list_campaigns', { size: 500, page, responseFields: MD_VELDEN }), l = rijen(r);
        for (const x of l) {
          if (!x || x.id == null) continue;
          k[String(x.id)] = { f: (Array.isArray(x.adType) ? x.adType : [x.adType]).filter(Boolean).join('+').toLowerCase().replace(/_/g, ' '), b: x.bidType || null, bod: N(x.bid), l: (x.countryTargeting || []).map(c => String(c).toLowerCase()), d: N(x.dailyBudget), u: String(x.url || '').slice(0, 300), s: x.status || null, g: DAGRE.test(String(x.startDate || '')) ? x.startDate : undefined };
        }
        const tp = N(r && r.meta && r.meta.totalPages); if (!(tp > page + 1) || !l.length) break;
      }
      if (!Object.keys(k).length) throw new Error('lege lijst');
      const kaart = { t: nu, k }; await kv.set('cm:mdcamps', kaart, { ex: 86400 }).catch(() => {}); m = MD_MEM = { ...kaart, gelezen: nu };
    } catch (e) { fouten.push('instellingen mondiad: campagnelijst mislukt (' + String(e && e.message || e).slice(0, 80) + ')'); }
  }
  return (m && m.k) || {};
}
const mdInst = k => k ? { formaat: k.f, biedmodel: k.b, boden: [{ bod: k.bod, landen: k.l }], dagbudget: k.d, landing: k.u, ...(k.g ? { gestart: k.g } : {}) } : { formaat: '', landing: '' };
// één stuk id's ophalen; faalt het, dan één keer opnieuw in twee helften. Geeft {kaart, fout}: kaart[id] = {tag,titel,tekst,beeld} of {x:1} (id kwam niet terug)
async function mondiadStuk(mdf, ids) {
  const kaart = {}; let fout = '';
  const probeer = async l => {
    const r = rijen(await mdf('mondiad_get_creative_details', { ids: l.map(String) })), er = {};
    for (const x of r) if (x && x.id != null) { const o = { tag: String(x.tag || ''), titel: String(x.title || ''), tekst: String(x.description || ''), beeld: String(x.image || x.icon || '') }; er[String(x.id)] = Object.fromEntries(Object.entries(o).filter(([, v]) => v)); }
    for (const id of l) kaart[id] = er[id] || { x: 1 };
  };
  try { await probeer(ids); } catch (e) {
    fout = String(e && e.message || e).slice(0, 60);
    if (ids.length > 1) { const h = Math.ceil(ids.length / 2); let weg = 0; for (const l of [ids.slice(0, h), ids.slice(h)]) { try { await probeer(l); } catch (e2) { weg += l.length; fout = String(e2 && e2.message || e2).slice(0, 60); } } if (!weg) fout = ''; }
  }
  return { kaart, fout };
}
async function mondiadCreatives(mdf, ids, t0, tijd, nu, fouten) {
  const hoeken = {}; let zonder = 0;
  for (let i = 0; i < ids.length; i += MD_HMGET) {
    const stuk = ids.slice(i, i + MD_HMGET), v = await kv.raw(['HMGET', 'cm:mdcre', ...stuk]).catch(() => []);
    stuk.forEach((id, j) => { try { const o = JSON.parse(v && v[j]); if (o && typeof o === 'object') hoeken[id] = o; } catch (e) {} });
  }
  const mist = ids.filter(id => !hoeken[id]);
  for (let i = 0; i < mist.length; i += MD_STUK) {
    const stuk = mist.slice(i, i + MD_STUK);
    if (nu() - t0 > tijd) { zonder += mist.length - i; break; }
    const { kaart, fout } = await mondiadStuk(mdf, stuk), nieuw = Object.keys(kaart);
    if (fout) fouten.push('creatives mondiad: stuk van ' + stuk.length + ' overgeslagen (' + fout + ')');
    if (nieuw.length) {
      const arg = []; for (const id of nieuw) { hoeken[id] = kaart[id]; arg.push(id, JSON.stringify(kaart[id])); }
      await kv.raw(['HSET', 'cm:mdcre', ...arg]).catch(() => {}); await kv.raw(['EXPIRE', 'cm:mdcre', MD_CRE_TTL]).catch(() => {});
    }
  }
  return { hoeken, zonder };
}
async function mondiadRapport(mdf, d, breakdown) {
  const uit = [];
  for (let page = 0; page < 10; page++) {
    const r = await mdf('mondiad_campaign_report', { startDate: d, endDate: d, breakdown, size: 1000, page });
    uit.push(...rijen(r)); const tp = N(r && r.meta && r.meta.totalPages); if (!(tp > page + 1)) break;
  }
  return uit;
}
export async function mondiadDag(d, { md: mdf, tijd = 35e3, nu = Date.now } = {}) {
  const t0 = nu(), fouten = [];
  if (!mdf) { try { mdf = B.md || (await import('./mdmcp.js')).md; } catch (e) { return { ok: false, fout: String(e && e.message || e).slice(0, 100), campagnes: [] }; } }
  const per = {};
  try {
    for (const r of await mondiadRapport(mdf, d, 'CAMPAIGN')) {
      const id = String(r.campaignId || ''); if (!id) continue;
      const x = per[id] || (per[id] = { net: 'mondiad', id, naam: String(r.campaignName || ''), vert: 0, kliks: 0, kosten: 0, conv: 0, creatives: [] });
      x.vert += N(r.impressions); x.kliks += N(r.clicks); x.kosten += N(r.spent); x.conv += N(r.conversions); if (!x.naam && r.campaignName) x.naam = String(r.campaignName);
    }
  } catch (e) { return { ok: false, fout: String(e && e.message || e).slice(0, 120), campagnes: [] }; }
  const lijst = Object.values(per).filter(c => c.kosten > 0 || c.kliks > 0).sort((a, b) => b.kosten - a.kosten);
  if (!lijst.length) return { ok: true, campagnes: [], fouten };
  const kaart = await mondiadKaart(mdf, lijst.map(c => c.id), fouten);
  const cr = {};
  try {
    for (const r of await mondiadRapport(mdf, d, 'CREATIVE_ID')) {
      const cid = String(r.campaignId || ''), id = String(r.creativeId || ''); if (!per[cid] || !id) continue;
      const x = (cr[cid] || (cr[cid] = {}))[id] || (cr[cid][id] = { id, tag: String(r.creativeTag || ''), titel: String(r.creativeTitle || ''), vert: 0, kliks: 0, kosten: 0, conv: 0 });
      x.vert += N(r.impressions); x.kliks += N(r.clicks); x.kosten += N(r.spent); x.conv += N(r.conversions);
    }
  } catch (e) { fouten.push('creatives mondiad: rapport per creative mislukt (' + String(e && e.message || e).slice(0, 80) + ')'); }
  const actief = c => Object.values(cr[c.id] || {}).filter(x => x.vert || x.kliks || x.kosten);
  const ids = [...new Set(lijst.flatMap(c => actief(c).map(x => x.id)))];
  const { hoeken, zonder } = await mondiadCreatives(mdf, ids, t0, tijd, nu, fouten);
  for (const c of lijst) {
    c.instellingen = mdInst(kaart[c.id]);
    c.creatives = actief(c).map(x => {
      const t = hoeken[x.id] || {}, tag = t.tag || x.tag, tekst = t.tekst, beeld = t.beeld;
      return { id: x.id, ...(tag ? { tag } : {}), titel: t.titel || x.titel, ...(tekst ? { tekst } : {}), ...(beeld ? { beeld } : {}), vert: x.vert, kliks: x.kliks, kosten: r4(x.kosten), conv: x.conv };
    });
    c.kosten = r4(c.kosten); c.project = projectVan(c.naam);
  }
  if (zonder) fouten.unshift('creatives mondiad: tijdsbudget op, ' + zonder + ' advertenties zonder tekst en beeld');
  return { ok: true, campagnes: lijst, fouten: fouten.slice(0, 4) };
}

async function ttDag(d) {
  const T = await import('./tiktok.js'), t = await T.ttRapport(d);
  if (!t.ok) return { ok: false, fout: String(t.fout || t.message || 'geen rapport').slice(0, 80), campagnes: [] };
  if (!(t.rijen || []).some(x => x.spend > 0)) return { ok: true, campagnes: [] };
  return { ok: true, campagnes: [{ net: 'tiktok', id: 'tt-kadoly', naam: 'TikTok Kadoly', project: 'kadoly', kosten: r2(t.rijen.reduce((s, x) => s + x.spend, 0)), kliks: t.rijen.reduce((s, x) => s + x.kliks, 0), vert: t.rijen.reduce((s, x) => s + x.vert, 0), conv: t.rijen.reduce((s, x) => s + x.ttKoop, 0), creatives: t.rijen.filter(x => x.spend > 0).map(x => ({ id: x.id, titel: x.naam, kosten: x.spend, kliks: x.kliks, vert: x.vert, conv: x.ttKoop })) }] };
}
async function paDag(d) {
  const pa = await lus({ archief: true, dag: d, max: 100 });
  return pa.ok ? { ok: true, campagnes: (pa.campagnes || []).map(c => ({ net: 'propeller', ...c, project: projectVan(c.naam) })) } : { ok: false, fout: String(pa.fout), campagnes: [] };
}
async function gaDag(d) {
  const ga = await lus({ archief: true, net: 'gads', dag: d});
  return ga.ok ? { ok: true, campagnes: (ga.campagnes || []).map(c => ({ net: 'gads', ...c, project: projGads(c.naam) })), fouten: (ga.fouten || []).map(f => 'gads ' + f) } : { ok: false, fout: String(ga.fout), campagnes: [] };
}
// ophaalfuncties per netwerk (voor de test te vervangen); elke geeft {ok, campagnes, fout?, fouten?}
export const B = { md: null, propeller: paDag, gads: gaDag, mondiad: d => mondiadDag(d, { md: B.md || undefined }), tiktok: ttDag, meta: d => whopDag(d).then(r => r.ok ? { ok: true, campagnes: (r.campagnes || []).map(c => ({ net: 'meta', ...c, project: 'kadoly' })) } : r), labels, uitkomsten, waarde: () => leesWaarde(kv).catch(() => null),
  geheugen: () => import('./paspoort.js').then(P => P.ronde({})).then(g => ({ stukken: g.stukken, raak: g.raak, mis: g.mis })).catch(e => ({ fout: String(e && e.message || e).slice(0, 120) })) };
export const NETTEN = ['propeller', 'gads', 'mondiad', 'tiktok', 'meta'];
export const LEG_NETTEN = ['mgid', 'richads', 'clickadu']; // sleutel elders: alleen via leg() uit data/camp-historie/<net>.json

// eigen uitkomsten (en hun waarde) bij elke campagne van de dag; ook de campagnes die uit een eerdere ronde blijven staan
// De dagtellers (mm:cu, mm:cx, mm:c) verlopen na 60 dagen: wat een eerdere ronde voor deze campagne al mat (oud = de dag zoals hij in het archief
// stond) blijft staan als er nu niets meer te lezen is, zodat een latere ronde, netwerk-inhaal of leg() geen gemeten uitkomsten op nul zet.
async function verrijk(camps, d, oud = []) {
  const [uit, munt] = await Promise.all([B.uitkomsten(d), B.waarde()]);
  const was = {}; for (const o of oud || []) if (o && o.gemeten && o.eigen) was[o.net + '|' + o.id] = o.eigen;
  for (const c of camps) {
    const id = String(c.id), u = uit[c.net + '|' + id] || uit[c.net + '|' + id.replace(/^g/, '')] || (c.net === 'mgid' ? uit['mgid|mg' + id] : null) || null;
    const eerder = u ? null : ((c.gemeten && c.eigen) || was[c.net + '|' + id] || null);
    c.merk = merkVan(c.naam || '', c.project);
    c.eigen = u || eerder || { echt: 0, actie: 0, aanmelding: 0, dialoog: 0, koop: 0, bezoek: 0 }; c.gemeten = !!(u || eerder);
    c.waarde = munt ? r2(waardeVan(munt, c.project, c.eigen).dollar) : null;
  }
}
const perNet = camps => { const per = {}; for (const c of camps) { const p = per[c.net] || (per[c.net] = { campagnes: 0, kosten: 0, gemeten: 0 }); p.campagnes++; p.kosten = r2(p.kosten + N(c.kosten)); if (c.gemeten) p.gemeten++; } return per; };

// Een netwerk dat nu niet antwoordt maakt een dag die al in het archief staat niet leeg (27 nov 2026: PropellerAds weigert de tijdzone
// voor dagen ouder dan een week, "Time zone is available only in the weekly period", en een nieuwe ronde voor zo'n dag gooide de
// campagnes van dat netwerk weg). De oude campagnes van dat netwerk blijven staan; hun eigen uitkomsten worden opnieuw geteld.
// alleen: één netwerk van NETTEN opnieuw ophalen, de rest van de dag blijft zoals hij is. Ingelegde netwerken (LEG_NETTEN) blijven altijd staan.
export async function ronde({ dag, alleen } = {}) {
  const d = DAGRE.test(String(dag || '')) ? dag : gisteren(), net = alleen ? String(alleen).toLowerCase() : '', fouten = [];
  if (net && !NETTEN.includes(net)) return { ok: false, fout: 'alleen = ' + NETTEN.join(' | ') };
  const wil = NETTEN.filter(n => !net || n === net), mis = new Set(), nieuw = [];
  const res = await Promise.all(wil.map(n => Promise.resolve().then(() => B[n](d)).catch(e => ({ ok: false, fout: String(e && e.message || e).slice(0, 100), campagnes: [] }))));
  wil.forEach((n, i) => { const r = res[i] || {}; if (!r.ok) { fouten.push(n + ': ' + r.fout); mis.add(n); } for (const f of r.fouten || []) fouten.push(f); nieuw.push(...(r.campagnes || [])); });
  const oud = await kv.get('cm:camp:' + d).catch(() => null), oudL = Array.isArray(oud) ? oud : [], camps = [...nieuw];
  if (net && res[0] && res[0].ok && !nieuw.length && !oudL.some(c => c.net === net)) return { ok: true, dag: d, alleen: net, per_netwerk: {}, nieuwe_labels: 0, fouten }; // niets nieuw en niets oud: niets wegschrijven
  for (const c of nieuw) if (c.net === 'mondiad') { const o = oudL.find(x => x.net === 'mondiad' && String(x.id) === String(c.id)); if (!o) continue; if (!(c.creatives || []).length && (o.creatives || []).length) c.creatives = o.creatives; if (o.instellingen && o.instellingen.formaat && !(c.instellingen && c.instellingen.formaat)) c.instellingen = o.instellingen; }
  for (const c of oudL) {
    const gehaald = wil.includes(c.net);
    if (gehaald ? mis.has(c.net) && !camps.some(x => x.net === c.net && String(x.id) === String(c.id)) : (net ? true : LEG_NETTEN.includes(c.net))) camps.push(c);
  }
  if (net && !camps.length && !oudL.length) return { ok: true, dag: d, alleen: net, per_netwerk: {}, nieuwe_labels: 0, fouten };
  await verrijk(camps, d, oudL);
  const L = await B.labels(net ? nieuw.flatMap(c => c.creatives || []) : camps.flatMap(c => c.creatives || []));
  await kv.set('cm:camp:' + d, camps, { ex: DAG_TTL }).catch(e => fouten.push('opslaan: ' + String(e.message || e).slice(0, 80)));
  await kv.raw(['SADD', 'cm:campdagen', d]).catch(() => {});
  const r = { ok: true, dag: d, ...(net ? { alleen: net } : {}), per_netwerk: perNet(camps), nieuwe_labels: L.nieuw, fouten: L.fout ? [...fouten, 'labels: ' + L.fout] : fouten };
  if (!net) await kv.set('cm:camp:laatste', { ...r, t: new Date().toISOString() }).catch(() => {});
  return r;
}

// Netwerken waarvan de sleutel elders zit (MGID, RichAds, Clickadu): data/camp-historie/<net>.json
// { net, bron, munt, dagen: { 'JJJJ-MM-DD': [campagne in de archiefvorm, zonder net/project/merk/eigen/waarde] } }.
// leg(net) zet per dag alleen de campagnes van dat netwerk in cm:camp:<dag> (de rest blijft), met project, merk, eigen uitkomsten en waarde zoals ronde().
// Het archief telt in dollars: euro's (MGID rekent in euro) gaan bij het inleggen om met de koers van /api/geld (lib/waarde.js eurUsd, standaard EUR_USD);
// het bedrag van het netwerk blijft staan in kosten_bron, met munt_bron en koers. Een andere munt wordt niet omgerekend: die houdt zijn veld munt en leer() meldt het.
function naarDollar(c, koers) {
  if (String(c.munt || '').toUpperCase() !== 'EUR') return c;
  const x = { ...c, munt: 'USD', munt_bron: 'EUR', koers, kosten_bron: N(c.kosten), kosten: r2(N(c.kosten) * koers) };
  x.creatives = (c.creatives || []).map(y => ({ ...y, kosten: r4(N(y.kosten) * koers) }));
  if (c.instellingen && Array.isArray(c.instellingen.boden)) x.instellingen = { ...c.instellingen, boden: c.instellingen.boden.map(b => ({ ...b, bod: r4(N(b.bod) * koers) })) };
  return x;
}
function leesHistorie(net) { for (const p of [process.cwd() + '/data/camp-historie/' + net + '.json', new URL('../data/camp-historie/' + net + '.json', import.meta.url).pathname]) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) {} } return null; }
export async function leg(net, { bestand } = {}) {
  net = String(net || '').toLowerCase(); if (!LEG_NETTEN.includes(net)) return { ok: false, fout: 'leg = ' + LEG_NETTEN.join(' | ') };
  const j = bestand || leesHistorie(net); if (!j || !j.dagen || typeof j.dagen !== 'object') return { ok: false, fout: 'geen data/camp-historie/' + net + '.json' };
  const w = await B.waarde(), koers = N(w && w.eurUsd) > 0 ? N(w.eurUsd) : EUR_USD;
  const per = {}; let totaal = 0, bron = 0, om = 0;
  for (const [d, lijst] of Object.entries(j.dagen)) {
    if (!DAGRE.test(d) || !Array.isArray(lijst)) continue;
    const eigen = lijst.map(c => naarDollar({ ...c, net, project: projectVan(c.naam), munt: c.munt || j.munt || undefined }, koers));
    const oud = await kv.get('cm:camp:' + d).catch(() => null), oudL = Array.isArray(oud) ? oud : [], camps = [...oudL.filter(c => c.net !== net), ...eigen];
    await verrijk(camps, d, oudL); await B.labels(eigen.flatMap(c => c.creatives || []), 0);
    await kv.set('cm:camp:' + d, camps, { ex: DAG_TTL }); await kv.raw(['SADD', 'cm:campdagen', d]);
    const k = r2(eigen.reduce((s, c) => s + N(c.kosten), 0)), kb = r2(eigen.reduce((s, c) => s + N(c.kosten_bron != null ? c.kosten_bron : c.kosten), 0));
    per[d] = { campagnes: eigen.length, kosten: k, kosten_bron: kb }; totaal = r2(totaal + k); bron = r2(bron + kb); om += eigen.filter(c => c.munt_bron).length;
  }
  const uit = { ok: true, net, bron: j.bron || null, munt: om ? 'USD' : (j.munt || null), ...(om ? { munt_bron: 'EUR', koers } : {}), dagen: Object.keys(per).length, kosten_totaal: totaal, kosten_bron_totaal: bron, per };
  await kv.set('cm:leg:' + net, { t: new Date().toISOString(), dagen: uit.dagen, kosten: totaal, munt: uit.munt, ...(om ? { kosten_bron: bron, munt_bron: 'EUR', koers } : {}) }).catch(() => {});
  return uit;
}

// Historie inhalen (Henkjan 27 nov 2026: "Zit alle hist prop ad data hier al in nu ?" en "Ja ik geef toegang"): een rij dagen die nog niet in
// het archief staan, oudste eerst, met alle netwerken van de ronde (PropellerAds, Google Ads, Mondiad, TikTok). Elke aanroep (cron elke 5 minuten,
// /api/mm?op=campagnes&inhaal=1; starten met &van=&tot=) doet dagen tot ~200 seconden op zijn, met een slot zodat er nooit twee tegelijk lopen.
// Een dag waarop PropellerAds faalt komt nog twee keer terug. Klaar: het geheugen leest alles opnieuw in en de cron doet daarna niets meer (één lees).
// Met alleen=<net> (bijv. mondiad, nu met advertenties) gaat het om één netwerk, met eigen toestand cm:inhaal:<net> en eigen slot: de gewone
// inhaal blijft onaangeroerd. De cron zonder parameters (inhaalCron) doet eerst de gewone inhaal en daarna pas de netwerk-inhaal die nog loopt.
// Google Ads-inloglink voor Henkjan (propellerads-mcp gadsInlog, 10 minuten geldig): /api/mm?op=gadslogin op de beschermde host stuurt hem door
export async function gadsInlogLink() { return lus({ gadsInlog: true }, 15000); }

export async function inhaal({ van, tot, tijd = 200e3, alleen } = {}) {
  const net = alleen ? String(alleen).toLowerCase() : ''; if (net && !NETTEN.includes(net)) return { ok: false, fout: 'alleen = ' + NETTEN.join(' | ') };
  const K = net ? 'cm:inhaal:' + net : 'cm:inhaal', ok = x => DAGRE.test(String(x || ''));
  let w = await kv.get(K).catch(() => null);
  if (ok(van) && ok(tot) && van <= tot) { w = { van, tot, ...(net ? { alleen: net } : {}), gedaan: [], poging: {}, fouten: {}, per: {}, start: new Date().toISOString() }; await kv.set(K, w, { ex: 30 * 86400 }); }
  if (!w || w.klaar) return { ok: true, klaar: w ? w.klaar : null, rest: 0, per: w ? w.per : undefined };
  const slot = await kv.raw(['SET', K + ':slot', '1', 'NX', 'EX', '290']).catch(() => null);
  if (!slot) return { ok: true, bezig: true };
  const begin = Date.now(), alle = [], nu = [];
  for (let t = Date.parse(w.van + 'T00:00:00Z'); t <= Date.parse(w.tot + 'T00:00:00Z'); t += 864e5) alle.push(new Date(t).toISOString().slice(0, 10));
  try {
    for (const d of alle) {
      if (w.gedaan.includes(d)) continue;
      if (Date.now() - begin > tijd) break;
      const r = await ronde({ dag: d, alleen: net || undefined }).catch(e => ({ ok: false, fouten: [(net || 'propeller') + ': ' + String(e && e.message || e).slice(0, 120)] }));
      w.poging[d] = (w.poging[d] || 0) + 1;
      if ((r.fouten || []).length) w.fouten[d] = r.fouten.slice(0, 3); else delete w.fouten[d];
      // netwerk-inhaal Mondiad: was het tijdsbudget voor tekst en beeld op, dan komt de dag terug (de kv vult zich per poging), hooguit 5 keer
      const opnieuw = f => f.startsWith((net || 'propeller') + ':') || (net === 'mondiad' && /tijdsbudget op/.test(f));
      if (!(r.fouten || []).some(opnieuw) || w.poging[d] >= (net ? 5 : 3)) {
        w.gedaan.push(d);
        for (const [n, p] of Object.entries(r.per_netwerk || {})) { if (net && n !== net) continue; const x = w.per[n] || (w.per[n] = { dagen: 0, campagnes: 0, kosten: 0 }); x.dagen++; x.campagnes += p.campagnes; x.kosten = r2(x.kosten + p.kosten); }
      }
      nu.push(d); await kv.set(K, w, { ex: 30 * 86400 }).catch(() => {});
    }
    const rest = alle.filter(d => !w.gedaan.includes(d)).length;
    if (!rest) {
      w.klaar = new Date().toISOString();
      w.geheugen = await B.geheugen();
      await kv.set(K, w, { ex: 30 * 86400 }).catch(() => {});
    }
    return { ok: true, ...(net ? { alleen: net } : {}), nu, rest, per: w.per, dagenMetFout: Object.keys(w.fouten).length, klaar: w.klaar || null };
  } finally { await kv.raw(['DEL', K + ':slot']).catch(() => {}); }
}
// cron elke 5 minuten zonder parameters: eerst de gewone inhaal; is die klaar (of er is er geen), dan de eerste netwerk-inhaal die nog loopt
export async function inhaalCron(opt = {}) {
  const g = await inhaal(opt); if (g.bezig || N(g.rest) > 0) return g;
  for (const n of NETTEN) { const w = await kv.get('cm:inhaal:' + n).catch(() => null); if (w && !w.klaar) return { gewoon: { klaar: g.klaar }, netwerk: await inhaal({ ...opt, alleen: n }) }; }
  return g;
}

const bodVak = b => b == null ? '-' : b < 0.02 ? '<0.02' : b < 0.05 ? '0.02-0.05' : b < 0.2 ? '0.05-0.20' : b < 1 ? '0.20-1' : '1+';
const hostVan = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return '-'; } };

async function dagen(n) { const uit = []; for (let i = 1; i <= n; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); const x = await kv.get('cm:camp:' + d).catch(() => null); if (x) uit.push(...x.map(c => ({ ...c, dag: d }))); } return uit; }

// wat er echt nog niet in het archief staat (27 nov 2026): netwerken met de sleutel in een eigen koppeling
async function ontbreekt() {
  const uit = [], nm = { mgid: 'MGID', richads: 'RichAds', clickadu: 'Clickadu' };
  for (const n of LEG_NETTEN) {
    const l = await kv.get('cm:leg:' + n).catch(() => null), best = !!leesHistorie(n);
    if (n === 'mgid') uit.push(l ? 'MGID: alleen de historie uit data/camp-historie/mgid.json is ingelegd (' + l.dagen + ' dagen, ' + String(l.t).slice(0, 10) + '); dagelijks niet: de sleutel zit in richads-mcp en MGID staat sinds 6 nov uit' : best ? 'MGID: historie staat klaar in data/camp-historie/mgid.json maar is nog niet ingelegd (?op=campagnes&leg=mgid); dagelijks niet: de sleutel zit in richads-mcp en MGID staat sinds 6 nov uit' : 'MGID: sleutel in richads-mcp, nog niet in het archief');
    else uit.push(l ? nm[n] + ': alleen de historie uit het bestand is ingelegd (' + l.dagen + ' dagen); dagelijks niet: sleutel in eigen koppeling' : nm[n] + ': sleutel in eigen koppeling, nog niet in het archief');
  }
  return uit;
}

// per kenmerk: kosten, kliks, echte mensen, waarde; campagne-kenmerken op campagneniveau, creative-kenmerken op creativeniveau
export async function leer({ dagen: n = 14, project = '', net = '' } = {}) {
  let rs = await dagen(Math.min(60, n));
  if (project) rs = rs.filter(c => c.project === project || c.merk === project); if (net) rs = rs.filter(c => c.net === net);
  const G = {}, LC = {};
  for (const c of rs) for (const cr of c.creatives || []) if (!cr.ai) { const t = crTekst(cr); if (t.length < 8) continue; const k = crlKey(t); if (!(k in LC)) LC[k] = await kv.get(k).catch(() => null); const l = LC[k]; if (l) cr.ai = { haak: String(l.haak || '-'), emotie: String(l.emotie || '-'), belofte: String(l.belofte || '') }; }
  const tel = (k, w, x) => { const g = (G[k] || (G[k] = {}))[w] || (G[k][w] = { kosten: 0, kliks: 0, echt: 0, uitkomsten: 0, waarde: 0, n: 0 }); g.kosten += N(x.kosten); g.kliks += N(x.kliks); g.echt += N(x.echt); g.uitkomsten += N(x.uitkomsten); g.waarde += N(x.waarde); g.n++; };
  for (const c of rs) {
    const e = c.eigen || {}, x = { kosten: c.kosten, kliks: c.kliks, echt: e.echt, uitkomsten: N(e.actie) + N(e.aanmelding) + N(e.dialoog) + N(e.koop), waarde: c.waarde }, i = c.instellingen || {};
    tel('netwerk', c.net, x); tel('merk', c.merk || c.project || '-', x); tel('formaat', c.net + ':' + (i.formaat ?? '-'), x); tel('biedmodel', c.net + ':' + (i.biedmodel ?? '-'), x);
    tel('bod', bodVak((i.boden || [])[0] ? i.boden[0].bod : null), x); tel('landing', hostVan(i.landing), x);
    for (const l of c.landen || []) tel('land', String(l.land), { kosten: l.kosten, kliks: l.kliks });
    for (const o of c.os || []) tel('os', String(o.os), { kosten: o.kosten, kliks: o.kliks });
    // creatives: eigen uitkomsten zijn er per campagne; verdeel ze naar rato van de kliks van de creative
    const kl = (c.creatives || []).reduce((s, y) => s + N(y.kliks), 0) || 1;
    for (const cr of c.creatives || []) { const a = N(cr.kliks) / kl, y = { kosten: cr.kosten, kliks: cr.kliks, echt: N(e.echt) * a, uitkomsten: x.uitkomsten * a, waarde: N(c.waarde) * a };
      if (cr.ai) { tel('haak', cr.ai.haak, y); tel('emotie', cr.ai.emotie, y); } tel('cta', cr.cta || '-', y); }
  }
  const lijst = {};
  for (const [k, ws] of Object.entries(G)) lijst[k] = Object.entries(ws).map(([w, g]) => ({ w, kosten: r2(g.kosten), kliks: Math.round(g.kliks), echt: Math.round(g.echt), uitkomsten: Math.round(g.uitkomsten), waarde: r2(g.waarde), per_echt: g.echt ? r2(g.kosten / g.echt) : null, waarde_per_dollar: g.kosten ? r2(g.waarde / g.kosten) : null, cpc: g.kliks ? Math.round(10000 * g.kosten / g.kliks) / 10000 : null }))
    .sort((a, b) => b.kosten - a.kosten).slice(0, 25);
  // advies: per kenmerk de beste en slechtste met minstens $5 kosten (op waarde per dollar, anders op kosten per echt mens)
  const advies = [];
  for (const [k, l] of Object.entries(lijst)) {
    const m = l.filter(x => x.kosten >= 5 && x.w !== '-' && x.w !== '–'); if (m.length < 2 || !m.some(x => x.echt > 0 || x.waarde > 0)) continue; // land en os hebben alleen netwerkcijfers
    const opWaarde = m.some(x => x.waarde > 0), sc = x => opWaarde ? N(x.waarde_per_dollar) : (x.per_echt == null ? -1e9 : -x.per_echt);
    const s = [...m].sort((a, b) => sc(b) - sc(a)), best = s[0], slecht = s[s.length - 1];
    advies.push(opWaarde ? `${k}: ${best.w} levert $${best.waarde_per_dollar} per $1 (${best.kosten} uitgegeven), ${slecht.w} $${slecht.waarde_per_dollar} (${slecht.kosten})`
      : `${k}: ${best.w} kost $${best.per_echt ?? '?'} per echt mens (${best.kosten} uitgegeven), ${slecht.w} $${slecht.per_echt ?? 'geen mens'} (${slecht.kosten})`);
  }
  const camps = {}; for (const c of rs) { const k = c.net + ':' + c.id, x = camps[k] || (camps[k] = { net: c.net, id: c.id, naam: c.naam, project: c.project, kosten: 0, kliks: 0, echt: 0, waarde: 0, dagen: 0 }); x.kosten += N(c.kosten); x.kliks += N(c.kliks); x.echt += N((c.eigen || {}).echt); x.waarde += N(c.waarde); x.dagen++; }
  const cl = Object.values(camps).map(x => ({ ...x, kosten: r2(x.kosten), waarde: r2(x.waarde), per_echt: x.echt ? r2(x.kosten / x.echt) : null, zonder_meting: x.echt === 0 && x.kosten >= 3 })).sort((a, b) => b.kosten - a.kosten);
  const vreemd = rs.filter(c => c.munt && c.munt !== 'USD').length;
  return { uitleg: 'Campagne-archief van Clickmind: alles wat de netwerken weten (instellingen, creatives, cijfers per creative, land, os, zone) naast de eigen uitkomsten en hun waarde. per_echt = kosten per echt mens; waarde_per_dollar = waarde van de uitkomsten per uitgegeven dollar. Per campagne: ?op=campagnes&campagne=<net>:<id>.',
    laatste_ronde: await kv.get('cm:camp:laatste').catch(() => null), dagen: n, campagnes: cl.length, advies, kenmerken: lijst, top_campagnes: cl.slice(0, 30),
    ...(vreemd ? { let_munt: vreemd + ' campagnes staan niet in dollars (veld munt) en zijn niet omgerekend: tel ze dus niet zonder omrekening bij dollars op' } : {}), ontbreekt: await ontbreekt() };
}

export async function campagne(sleutel, n = 30) {
  const [net, id] = String(sleutel || '').split(':'); const rs = (await dagen(Math.min(60, n))).filter(c => c.net === net && String(c.id) === String(id));
  return { campagne: sleutel, dagen: rs.length, laatste_instellingen: (rs[0] || {}).instellingen || null, creatives: (rs[0] || {}).creatives || [], per_dag: rs.map(c => ({ dag: c.dag, kosten: c.kosten, kliks: c.kliks, vert: c.vert, eigen: c.eigen, waarde: c.waarde, landen: (c.landen || []).slice(0, 5), zones: (c.zones || []).slice(0, 5) })) };
}
