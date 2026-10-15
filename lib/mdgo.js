// Mondiad naar /go (Henkjan 15 okt: "zet meteen Mondiad op GO om vandaag massa te maken en conversie daar te verhogen").
// Een lopende Mondiad-campagne van link wisselen kan, maar zet hem opnieuw in moderatie (dan staat hij stil). Daarom: per bron een
// /go-kopie met dezelfde zoekterm, tag, beelden en instellingen. Draait de kopie, dan gaat de oude uit (vaste werkwijze: iedere dag
// kopieën, oude uit). Optioneel mal=<campagne-id>: instellingen (bod, witte lijst, targeting) van die campagne, zoekterm, tag en
// beelden van de bron; zo krijgen zwakke oude campagnes de opzet van de winnaar (parfum bl-bku-20).
// Nooit dubbel: mm:mdgo:<bron> onthoudt de kopie. Alleen aanmaken, nooit iets stoppen of wijzigen.
import { md } from './mdmcp.js';

const rows = x => (Array.isArray(x) ? x : Array.isArray(x && x.data) ? x.data : Array.isArray(x && x.items) ? x.items : Array.isArray(x && x.content) ? x.content : x && x.id ? [x] : []);
const MARKT = { 'amazon.com': '', 'amazon.de': 'de', 'amazon.co.uk': 'co.uk', 'amazon.ca': 'ca', 'amazon.fr': 'fr', 'amazon.it': 'it', 'amazon.es': 'es' };

export function amazonDoel(url) {
  let u; try { u = new URL(String(url || '')); } catch (e) { return null; }
  const host = u.hostname.replace(/^www\./, ''); if (!(host in MARKT)) return null;
  const tag = u.searchParams.get('tag'); if (!tag) return null;
  const k = u.searchParams.get('k'), asin = (u.pathname.match(/\/dp\/([A-Z0-9]{10})/) || [])[1];
  if (!k && !asin) return null;
  return { m: MARKT[host], tag, k, asin };
}

export function goLink(d, p) {
  const q = new URLSearchParams(); if (d.k) q.set('k', d.k); else q.set('a', d.asin); if (d.m) q.set('m', d.m); q.set('tag', d.tag); q.set('p', p);
  // Mondiad-macro's met blokhaken blijven leesbaar staan (niet coderen)
  return 'https://whichtobuy.best/go?n=mondiad&c=[campaignid]&z=[zoneid]&s=[clickid]&b=[creativeid]&' + q.toString();
}

const lijst = (x, standaard) => (Array.isArray(x) ? x : standaard);

export function kopiePayload(bron, mal, url, naam) {
  const s = mal || bron;
  const c = {
    name: naam.slice(0, 255), url, status: 'Pending', runAfterModeration: true, startDate: null, endDate: null,
    adType: lijst(s.adType, ['IN_PAGE_PUSH']), bid: s.bid, bidType: s.bidType || 'CPA', cpaGoal: s.bidType === 'CPA' ? s.bid : null,
    // vaste grens: hoogstens $10 per dag per campagne (Henkjan), ook als de bron hoger stond
    budget: s.budget, dailyBudget: Math.min(Number(s.dailyBudget) || 10, 10), zoneIdDailyBudget: s.zoneIdDailyBudget ?? null,
    browserTargeting: lijst(s.browserTargeting, [0]), browserTargetingMap: s.browserTargetingMap || {}, browserTargetingMode: s.browserTargetingMode || 'WHITE_LIST',
    carrierTargeting: lijst(s.carrierTargeting, [0]), carrierTargetingMode: s.carrierTargetingMode || 'WHITE_LIST', connectionType: s.connectionType || 'ALL',
    countryCustomBids: lijst(s.countryCustomBids, []), countryTargeting: lijst(bron.countryTargeting, ['US']), countryTargetingMode: bron.countryTargetingMode || 'WHITE_LIST',
    dayParting: s.dayParting, dayPartingTimezone: s.dayPartingTimezone || 'UTC',
    deviceTargeting: lijst(s.deviceTargeting, [0]), deviceTargetingMode: s.deviceTargetingMode || 'WHITE_LIST',
    domainList: lijst(s.domainList, []), domainListMode: s.domainListMode || 'BLACK_LIST', frequencyCap: s.frequencyCap || null,
    geoObjectTargeting: lijst(bron.geoObjectTargeting, [0]), geoObjectTargetingMode: bron.geoObjectTargetingMode || 'WHITE_LIST', hideReferrer: s.hideReferrer !== false,
    ipAddressTargeting: lijst(s.ipAddressTargeting, []), ipAddressTargetingMode: s.ipAddressTargetingMode || 'WHITE_LIST',
    ispTargeting: lijst(s.ispTargeting, [0]), ispTargetingMode: s.ispTargetingMode || 'WHITE_LIST', keywordTargeting: lijst(s.keywordTargeting, []),
    landingPageType: s.landingPageType || 'MAINSTREAM', languageTargeting: lijst(bron.languageTargeting, [0]), languageTargetingMode: bron.languageTargetingMode || 'WHITE_LIST',
    maxAge: null, minAge: null, offerTypes: lijst(s.offerTypes, []).map(o => (o && typeof o === 'object' ? o.id : o)).filter(x => x != null),
    osTargeting: lijst(s.osTargeting, [0]), osTargetingMode: s.osTargetingMode || 'WHITE_LIST', osVersionTargeting: lijst(s.osVersionTargeting, [0]),
    subIdCustomBids: lijst(s.subIdCustomBids, []), subIdList: lijst(s.subIdList, []), subIdListMode: s.subIdListMode || 'BLACK_LIST',
    subscriptionAgeTargeting: lijst(s.subscriptionAgeTargeting, []), trafficType: lijst(s.trafficType, ['MAINSTREAM']),
    zoneCustomBids: lijst(s.zoneCustomBids, []), zoneIdList: lijst(s.zoneIdList, []), zoneIdListMode: s.zoneIdListMode || 'BLACK_LIST',
    creatives: lijst(bron.creatives, []).filter(x => x && x.status === 'ACTIVE' && x.title && (x.icon || x.image)).slice(0, 6)
      .map((x, i) => ({ title: x.title, description: x.description || '', image: x.image || undefined, icon: x.icon || undefined, tag: String(x.tag || 'c' + i).slice(0, 40) + 'g', status: 'PENDING', bannerFormat: null, campaignId: null })),
  };
  return c;
}

// tag=<eigen tag>: vervangt de Amazon-tag van de bron (voor bronnen die een tag delen met PropellerAds of een andere site,
// zodat de Associates-cijfers per tag zuiver blijven). Gebruik alleen een geregistreerde, vrije tag.
export async function mondiadNaarGo(kv, { ids = [], p = 'mdus', mal = null, tag = null, droog = false, tijd = 45000 } = {}) {
  const t0 = Date.now(), uit = [];
  let malC = null;
  if (mal) { malC = rows(await md('mondiad_get_campaign_details', { ids: [String(mal)] }))[0] || null; if (!malC) return { ok: false, fout: 'mal ' + mal + ' niet gevonden' }; }
  for (const id of ids) {
    if (Date.now() - t0 > tijd) { uit.push({ bron: id, status: 'nog niet (tijd op, roep opnieuw aan)' }); continue; }
    try {
      const al = await kv.get('mm:mdgo:' + id); if (al) { uit.push({ bron: id, status: 'had al een kopie', kopie: al }); continue; }
      const b = rows(await md('mondiad_get_campaign_details', { ids: [String(id)] }))[0];
      if (!b) { uit.push({ bron: id, status: 'niet gevonden' }); continue; }
      const d = amazonDoel(b.url); if (!d) { uit.push({ bron: id, status: 'geen Amazon-zoek- of productlink', url: String(b.url || '').slice(0, 80) }); continue; }
      const oudeTag = d.tag; if (tag) d.tag = tag;
      const dagNaam = new Date().toISOString().slice(8, 10).replace(/^0/, '') + ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][new Date().getUTCMonth()];
      const naam = dagNaam + ' GO ' + String(b.name || '').replace(/^\S*\d+\s?(sep|okt|oct)\S*\s*/i, '').replace(/\s*CPA[\d.]+\s*$/i, '') + (tag && tag !== oudeTag ? ' | tag ' + tag : '') + (malC ? ' | mal ' + mal : '') + ' | go';
      const payload = kopiePayload(b, malC, goLink(d, p), naam);
      if (!payload.creatives.length) { uit.push({ bron: id, status: 'geen actieve beelden' }); continue; }
      if (droog) { uit.push({ bron: id, status: 'droog', naam: payload.name, url: payload.url, bod: payload.bid, beelden: payload.creatives.length }); continue; }
      const r = await md('mondiad_create_campaign', { campaign: payload });
      const nid = r && (r.id || (r.data && r.data.id));
      if (!nid) { uit.push({ bron: id, status: 'aanmaken mislukt', antwoord: JSON.stringify(r).slice(0, 200) }); continue; }
      await kv.set('mm:mdgo:' + id, String(nid), { ex: 60 * 86400 });
      uit.push({ bron: id, status: 'aangemaakt', kopie: nid, naam: payload.name });
    } catch (e) { uit.push({ bron: id, status: 'fout', fout: String(e.message || e).slice(0, 200) }); }
  }
  return { ok: true, p, mal, aangemaakt: uit.filter(x => x.status === 'aangemaakt').length, uit };
}
