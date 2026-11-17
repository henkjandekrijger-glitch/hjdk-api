// TikTok-uurwacht voor Kadoly (16 nov 2026, Henkjan: "Laat uurtaak op vercel draaien . Onafh comput of account ."). Draait als cron op Vercel,
// los van Claude en van zijn laptop. Leest per advertentie uitgave, vertoningen en kliks via de TikTok Marketing API, legt ernaast wat Clickmind zag
// (aangekomen, echt mens, tik op de koopknop, afrekenpagina, mandje, betaald) en zet verliezers uit. Nooit budget, bod, targeting of planning.
//
// Toegang: een eigen app in het TikTok for Business developer portal. App-id en geheim staan als gedeelde team-variabelen TIKTOK_APP_ID en
// TIKTOK_APP_SECRET in Vercel. Eén keer koppelen via /api/shop?op=ttkoppel (beschermde vercel.app-host): TikTok stuurt terug naar op=ttcb, die ruilt
// de code voor een vaste toegangssleutel en bewaart die alleen op de server (kv hjdk:tt:sleutel). Of zet de sleutel zelf als TIKTOK_ADS_TOKEN.
import { kv } from './db.js';

export const TT_ADV = process.env.TIKTOK_ADVERTISER_ID || '7708796437043265537'; // advertentieaccount Kadoly NL (EUR, Amsterdam-tijd)
export const TT_CAMP = '1882032006515938';
export const TT_GROEPEN = { '1882032703867938': 'betaald', '1882048854125746': 'afrekenpagina' };
// Leerregel (Henkjan 16 nov, akkoord op "Yes start en ga leren"): een advertentie gaat uit na EUR 5 uitgave zonder één bewuste afrekenstap
// (tik op de koopknop, afrekenpagina of mandje) volgens Clickmind. Per groep blijven er altijd minstens minAan aan, anders alleen een melding.
export const TT_REGEL = { uitgave: 5, minAan: 3, minKliksAankomst: 30, aankomstAlarm: 0.3, dagMax: 50 };
const API = 'https://business-api.tiktok.com/open_api/v1.3';
const K_SLEUTEL = 'hjdk:tt:sleutel';

export async function ttSleutel() {
  if (process.env.TIKTOK_ADS_TOKEN) return process.env.TIKTOK_ADS_TOKEN;
  try { const s = await kv.get(K_SLEUTEL); return s && s.token ? s.token : (typeof s === 'string' ? s : ''); } catch (e) { return ''; }
}

export function ttKoppelUrl(terug, state) {
  const id = process.env.TIKTOK_APP_ID; if (!id) return '';
  return 'https://business-api.tiktok.com/portal/auth?app_id=' + encodeURIComponent(id) + '&state=' + encodeURIComponent(state) + '&redirect_uri=' + encodeURIComponent(terug);
}

export async function ttRuil(code) { // auth_code -> vaste toegangssleutel, bewaard op de server
  const id = process.env.TIKTOK_APP_ID, geheim = process.env.TIKTOK_APP_SECRET;
  if (!id || !geheim) return { ok: false, fout: 'TIKTOK_APP_ID of TIKTOK_APP_SECRET ontbreekt in Vercel' };
  try {
    const r = await fetch(API + '/oauth2/access_token/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ app_id: id, secret: geheim, auth_code: code }), signal: AbortSignal.timeout(15000) });
    const j = await r.json().catch(() => ({}));
    if (!j || j.code !== 0 || !j.data || !j.data.access_token) return { ok: false, fout: 'TikTok: ' + (j && j.message || r.status) };
    await kv.set(K_SLEUTEL, { token: j.data.access_token, at: new Date().toISOString(), adv: j.data.advertiser_ids || [], scope: j.data.scope || [] });
    return { ok: true, adv: j.data.advertiser_ids || [] };
  } catch (e) { return { ok: false, fout: String(e.message || e).slice(0, 120) }; }
}

async function api(pad, params, methode = 'GET') {
  const tok = await ttSleutel(); if (!tok) return { ok: false, fout: 'geen sleutel', geenSleutel: true };
  let u = API + pad, init = { method: methode, headers: { 'Access-Token': tok }, signal: AbortSignal.timeout(20000) };
  if (methode === 'GET') { const q = new URLSearchParams(); for (const [k, v] of Object.entries(params || {})) q.set(k, typeof v === 'string' ? v : JSON.stringify(v)); u += '?' + q.toString(); }
  else { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(params || {}); }
  try {
    const r = await fetch(u, init); const j = await r.json().catch(() => ({}));
    if (!j || j.code !== 0) return { ok: false, fout: 'TikTok ' + (j && j.code) + ': ' + String(j && j.message || r.status).slice(0, 160), code: j && j.code };
    return { ok: true, data: j.data };
  } catch (e) { return { ok: false, fout: String(e.message || e).slice(0, 120) }; }
}

const METRICS = ['spend', 'impressions', 'clicks', 'ad_name', 'adgroup_id', 'conversion', 'complete_payment', 'checkout'];
export async function ttRapport(dag) { // dag JJJJ-MM-DD (Amsterdam) of leeg voor de hele looptijd
  const p = { advertiser_id: TT_ADV, report_type: 'BASIC', data_level: 'AUCTION_AD', dimensions: ['ad_id'], metrics: METRICS, page_size: 1000, filtering: [{ field_name: 'campaign_ids', filter_type: 'IN', filter_value: JSON.stringify([TT_CAMP]) }] };
  if (dag) { p.start_date = dag; p.end_date = dag; } else p.query_lifetime = true;
  const r = await api('/report/integrated/get/', p); if (!r.ok) return r;
  const rijen = (r.data.list || []).map(x => { const m = x.metrics || {}; return { id: String(x.dimensions.ad_id), naam: m.ad_name, groep: String(m.adgroup_id || ''), spend: Number(m.spend) || 0, vert: Number(m.impressions) || 0, kliks: Number(m.clicks) || 0, ttConv: Number(m.conversion) || 0, ttKassa: Number(m.checkout) || 0, ttKoop: Number(m.complete_payment) || 0 }; });
  return { ok: true, rijen };
}

export async function ttAds() { // status van elke advertentie in de campagne (aan, uit, keuring)
  const r = await api('/ad/get/', { advertiser_id: TT_ADV, filtering: { campaign_ids: [TT_CAMP] }, fields: ['ad_id', 'ad_name', 'adgroup_id', 'operation_status', 'secondary_status'], page_size: 100 });
  if (!r.ok) return r;
  return { ok: true, ads: (r.data.list || []).map(a => ({ id: String(a.ad_id), naam: a.ad_name, groep: String(a.adgroup_id), aan: a.operation_status === 'ENABLE', status: a.secondary_status || '' })) };
}

export async function ttUit(ids) {
  if (!ids.length) return { ok: true };
  return api('/ad/status/update/', { advertiser_id: TT_ADV, ad_ids: ids.map(String), operation_status: 'DISABLE' }, 'POST');
}

// Welke advertenties gaan uit. stap = tik + afrekenpagina + mandje (Clickmind, sinds het begin). Per groep blijven er minAan aan.
export function ttOordeel(rijen) {
  const uit = [], tegen = [];
  const perGroep = {}; rijen.forEach(x => { if (x.aan) perGroep[x.groep] = (perGroep[x.groep] || 0) + 1; });
  const kandidaten = rijen.filter(x => x.aan && x.spend >= TT_REGEL.uitgave && x.stap === 0).sort((a, b) => b.spend - a.spend);
  for (const x of kandidaten) {
    if ((perGroep[x.groep] || 0) - 1 < TT_REGEL.minAan) { tegen.push(x); continue; }
    perGroep[x.groep]--; uit.push(Object.assign({}, x, { reden: `${x.naam}: EUR ${x.spend.toFixed(2)} uitgegeven, ${x.kliks} kliks, ${x.aanCm} aangekomen, ${x.echt} echt, 0 afrekenstappen` }));
  }
  return { uit, tegen };
}

export async function ttMeld(tekst) { // alleen alarmen (Telegram via spel); het uurrapport staat op /api/shop?op=ttstand
  const s = process.env.MELD_SLEUTEL; if (!s) return false;
  try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'Kadoly TikTok', tekst: String(tekst).slice(0, 3400) }), signal: AbortSignal.timeout(10000) }); const j = await r.json().catch(() => ({})); return !!(j && j.ok); } catch (e) { return false; }
}

export function ttTekst(st) { // het uurrapport in gewone taal
  if (!st) return 'Nog geen ronde.';
  if (st.wacht) return `Kadoly TikTok, ${st.at}\nDe uurwacht draait, maar kan TikTok nog niet lezen: ${st.wacht}\nClickmind vandaag: ${st.dag.aan} aangekomen, ${st.dag.echt} echt mens, ${st.dag.tik} tik op de koopknop, ${st.dag.kassa} afrekenpagina, ${st.dag.koop} betaald.`;
  const g = Object.entries(st.groepen || {}).map(([id, x]) => `Groep ${TT_GROEPEN[id] || id}: EUR ${x.vandaag.toFixed(2)} vandaag (EUR ${x.spend.toFixed(2)} totaal), ${x.vert} vertoningen, ${x.kliks} kliks, ${x.aan} advertenties aan`).join('\n');
  const top = (st.rijen || []).filter(x => x.spend > 0).slice(0, 8).map(x => `- ${x.naam}: EUR ${x.spend.toFixed(2)}, ${x.kliks} kliks, ${x.aanCm} aan, ${x.echt} echt, ${x.stap} afrekenstap${x.stap === 1 ? '' : 'pen'}${x.koop ? ', ' + x.koop + ' betaald' : ''}${x.aan ? '' : ' (uit)'}`).join('\n');
  return `Kadoly TikTok, stand ${st.at}\n${g}\nClickmind vandaag: ${st.dag.aan} aangekomen, ${st.dag.echt} echt mens, ${st.dag.tik} tik op de koopknop, ${st.dag.kassa} afrekenpagina, ${st.dag.koop} betaald.\n` + (top ? 'Per advertentie (meeste uitgave eerst):\n' + top + '\n' : '') + ((st.uitgezet || []).length ? 'Deze ronde uitgezet: ' + st.uitgezet.map(u => u.reden).join(' | ') + '\n' : '') + ((st.tegen || []).length ? 'Zou uit moeten maar blijft aan (minder dan ' + TT_REGEL.minAan + ' over in de groep): ' + st.tegen.map(x => x.naam).join(', ') + '\n' : '');
}

// Video per product, dezelfde als in de TikTok-advertentie (17 nov): de shop zet hem bovenaan de productpagina bij utm_source=tiktok.
// Openbaar via /api/shop/ttvideo?p=<pid> (JSON mp4 + poster, of 404). Nieuwe advertentievideo? Zet hem hier erbij.
const TT_V = 'https://propellerads-mcp.vercel.app/tt/';
export const TT_VIDEO = { oc_4174003627704321: 'kadoly_skull_lantaarn', oc_4174003416580097: 'kadoly_gouden_kerstboom', oc_4174003366658049: 'kadoly_pietra_lantaarn', oc_4174002164744193: 'kadoly_tafelhaard_a', oc_4173958884671489: 'kadoly_orchidee_a', oc_4173958833750017: 'kadoly_travertine_a', oc_4173957639913473: 'kadoly_penhouder_a', oc_4174003619020802: 'kadoly_bethlehem_a', oc_4174003417645057: 'kadoly_colyn_a', oc_4174003462815745: 'kadoly_doppio_a', oc_4173958188548097: 'kadoly_rieten_tray_a', oc_4174002224513026: 'kadoly_spiegel_a', oc_4173958185697282: 'kadoly_bamboe_mand_a', voorkant: 'kadoly_algemeen' };
export const ttVideo = pid => { const n = TT_VIDEO[pid]; return n ? { mp4: TT_V + n + '.mp4', poster: TT_V + 'cover/' + n + '.jpg' } : null; };
