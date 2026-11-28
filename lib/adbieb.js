// Advertentiebibliotheken van buiten (Henkjan 27 nov 2026: "Ja bouw 4", taak yk8p0f van het dashboard): elke dag per project en zoekterm wat
// anderen aan advertenties laten lopen, als trendkennis en als bron voor de ochtendkopieen (de briefing van lib/paspoort.js).
//
// META: de Meta Ad Library via Zernio (GET https://zernio.com/api/v1/ads/library, platform=meta, geen gekoppeld account nodig). Alleen advertenties
//   die in de EU of het VK zijn vertoond staan erin, dus zoeken we in GB en EU-landen in de taal van de advertentie. LANGLOPERS = WINNAARS: de gewone
//   zoekopdracht geeft de nieuwste eerst, dus vragen we status=ACTIVE met until = vandaag min 90 dagen (te weinig rijen: min 30): advertenties die toen
//   al liepen en nu nog lopen. Winnaar = lang actief en veel bereik (eu_total_reach); meer langlopers van dezelfde pagina is een schaalsignaal.
//   Bewaard wordt wat je mag overnemen als haak en vorm: pagina, sinds, dagen, bereik, titel, eerste tekst (300), kanalen, soort beeld (video, beeld,
//   carrousel, tekst), landingspagina zonder query en de bronlink. De media-URL's van Meta zijn ondertekend en verlopen: die bewaren we NIET.
// TIKTOK: Business API discovery_trending_list (hashtags die stijgen of bovenaan staan, per land en categorie, 7 dagen), discovery_video_list (de trendvideo's
//   van de bovenste hashtags; het land moet een van de top-landen van de hashtag zijn, anders komt er null) en report_ad_benchmark_get (alleen eigen
//   lopende TikTok-campagnes met 1.000+ vertoningen in het venster; zonder dat is metrics leeg en dat is een melding, geen fout).
// Research geeft een voorsprong en beslist niet: eigen cijfers gaan voor. Je neemt de haak en de vorm over, nooit de tekst.
// Whop-bewezen (lib/whop.js, data/whop-bewezen.json) blijft ongemoeid: de productnamen daaruit zijn de Meta-zoektermen van Kadoly en het verse bewijs per
//   product staat in de briefing van Kadoly, zodat het niet meer met de hand hoeft.
//
// Dagronde (cron /api/mm?op=adbieb&run=1, elk uur van 00:07 tot en met 03:07 UTC): elke (project, bron, term) hoogstens eens per dag binnen een tijdbudget
//   van 170 s per aanroep; elke volgende aanroep maakt af wat de vorige niet haalde. Hoogstens 4 Meta-termen per project per dag (wisselt per dag door
//   de lijst), een fout stopt de rest niet. Volgorde: eerst TikTok (korte aanroepen, eigen tijdslot van 60 s), daarna Meta om de beurt per project (de
//   eerste term van elk project, dan de tweede) en elke dag begint een ander project: zo krijgt geen project structureel niets als de tijd op is. Elke
//   Meta-zoekopdracht laat Zernio tot 10 advertenties in een browser openen (media en landingspagina), dat duurt seconden per aanroep. Drie fouten op
//   rij bij een bron stopt die bron voor deze aanroep (sleutel weg of limiet geraakt); de volgende aanroep probeert het opnieuw.
//   De serversleutel (ZERNIO_API_KEY, TikTok-sleutel van lib/tiktok.js) kan ontbreken: dan haalt een chat het op met de MCP-tools en meldt het met
//   op=adbieb (zet). bewaak(): een bron zonder geslaagde ronde in 36 uur zet een taak in Henkjans lijst voor een oppakker (slot van 20 uur).
//
// Opslag (Redis): ab:dag:<dag>:<project> (ruwe dagresultaten per term, 3 dagen), ab:p:<project> (de beste langlopers en hashtags, 21 dagen), ab:stand
//   (per bron laatste geslaagde ronde en laatste fout), ab:zoek (overschrijving van de zoektermen per project), ab:gemeld (wat op welke dag als trend
//   is gemeld: een langloper hoogstens eens per dag, een TikTok-hashtag hoogstens eens per 3 dagen, want Videomind bewaart elke melding apart),
//   ab:taak (slot van de bewaking), ab:eerst (eerste bewaking).
import { kv } from './db.js';
import { projectId } from './buiten.js';
import BEWEZEN from '../data/whop-bewezen.json' with { type: 'json' };

const HOST = 'https://hjdk-api-henq.vercel.app', DAG = 864e5, ZERNIO = 'https://zernio.com/api/v1/ads/library';
export const MAX_META_PER_DAG = 4, STIL_UREN = 36, META_LIMIT = 10, TT_SLOT_MS = 60000, FOUTEN_OP_RIJ = 3;
const dagUtc = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const kort = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const nl = n => String(Math.round(N(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const pid = p => projectId(String(p || '').toLowerCase());
const sleutelNaam = t => kort(t, 60).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');

// ---------- zoektermen per project ----------
// meta: [zoekterm in de taal van de advertentie, landen (GB en EU: alleen daar staan commerciele advertenties in), taal]; tt: land en 1 tot 3 categorieen
// (enum category_name van discovery_trending_list). Projecten zijn die van lib/buiten.js; een overschrijving staat in kv ab:zoek.
// TikTok alleen voor projecten die op TikTok posten of adverteren (28 nov 2026: Kadoly met advertenties en video, Nexy met posts): de server heeft geen
// TikTok-sleutel (TIKTOK_APP_ID of TIKTOK_ADS_TOKEN staat niet in Vercel), dus elke categorie kost een chat aanroepen, en voor een project dat niet
// op TikTok zit is een hashtaglijst ruis. Gaat een project op TikTok: zet hier tt erbij, of zonder nieuwe build met op=adbieb&zoek=.
export const ZOEK = {
  nexy: { meta: [['family organizer app', 'GB,IE', 'en'], ['shared family calendar app', 'GB,IE', 'en'], ['voicemail transcription app', 'GB,IE', 'en'], ['familie app agenda', 'NL,BE', 'nl'], ['AI assistent app', 'NL,BE', 'nl']], tt: { land: 'US', cats: ['PRODUCTIVITY_AND_EFFICIENCY', 'SOFTWARE_AND_APPS'] } },
  kadoly: { meta: [['cadeau', 'NL,BE', 'nl'], ['hanglamp', 'NL,BE', 'nl'], ['sieraden cadeau', 'NL,BE', 'nl'], ['woondecoratie', 'NL,BE', 'nl']], tt: { land: 'NL', cats: ['HOME_AND_GARDEN', 'HOUSEHOLD_PRODUCTS'] } },
  keuzehulpen: { meta: [['zorgverzekering vergelijken', 'NL', 'nl'], ['beste airfryer', 'NL,BE', 'nl'], ['best air fryer', 'GB,IE', 'en'], ['Kaufberater Test Vergleich', 'DE,AT', 'de'], ['energie vergelijken', 'NL', 'nl']] },
  tk: { meta: [['muziektherapie', 'NL,BE', 'nl'], ['music therapy', 'GB,IE', 'en'], ['muziek en gezondheid', 'NL,BE', 'nl']] },
  curacao: { meta: [['Curacao vakantie', 'NL,BE', 'nl'], ['Curacao holiday', 'GB,IE', 'en'], ['Curacao Urlaub', 'DE,AT', 'de'], ['Curacao stranden', 'NL,BE', 'nl']] },
  wam: { meta: [['schadevergoeding claimen', 'NL,BE', 'nl'], ['collectieve claim', 'NL,BE', 'nl'], ['consumer claim compensation', 'GB,IE', 'en'], ['klacht bedrijf opzeggen', 'NL', 'nl']] },
  sealed: { meta: [['bedrijf verkopen', 'NL,BE', 'nl'], ['sell my business', 'GB,IE', 'en'], ['bedrijfsovername', 'NL,BE', 'nl'], ['business exit planning', 'GB,IE', 'en']] },
  chirurgie: { meta: [['plastische chirurgie', 'NL,BE', 'nl'], ['cosmetic surgery abroad', 'GB,IE', 'en'], ['Schoenheitsoperation Ausland', 'DE,AT', 'de'], ['borstvergroting', 'NL,BE', 'nl']] },
  kdp: { meta: [['kleurboek volwassenen', 'NL,BE', 'nl'], ['puzzelboek', 'NL,BE', 'nl'], ['activity book adults', 'GB,IE', 'en'], ['guided journal', 'GB,IE', 'en']] },
  youandai: { meta: [['AI cursus', 'NL,BE', 'nl'], ['leren werken met ChatGPT', 'NL,BE', 'nl'], ['learn AI skills', 'GB,IE', 'en']] },
  goonfree: { meta: [['digital detox app', 'GB,IE', 'en'], ['stop bad habits app', 'GB,IE', 'en'], ['dopamine detox', 'GB,IE', 'en']] },
  mylevel: { meta: [['driving theory test app', 'GB,IE', 'en'], ['practice test app', 'GB,IE', 'en'], ['rijbewijs theorie oefenen', 'NL,BE', 'nl']] }
};
const MEDIA_BETAALD = ['propeller', 'mondiad', 'gads', 'tiktok-ads', 'meta', 'bing', 'richads', 'mgid', 'clickadu', 'amazon-ads'];

// De termen van een project: de overschrijving uit kv (ab:zoek) gaat voor; Kadoly krijgt de productnamen uit het Whop-bewijs erbij.
export function termenVan(project, over = null) {
  const o = over && over[project], basis = { meta: [], tt: null, ...(ZOEK[project] || {}) };
  const meta = (o && Array.isArray(o.meta) ? o.meta : basis.meta).map(x => Array.isArray(x) ? { q: kort(x[0], 100), landen: kort(x[1] || 'GB,NL', 40).toUpperCase(), taal: kort(x[2], 5).toLowerCase() } : { q: kort(x && x.q, 100), landen: kort((x && x.landen) || 'GB,NL', 40).toUpperCase(), taal: kort(x && x.taal, 5).toLowerCase() }).filter(x => x.q);
  if (project === 'kadoly' && !(o && Array.isArray(o.meta))) for (const p of (BEWEZEN.producten || [])) if (p && p.naam) meta.push({ q: kort(p.naam, 100), landen: 'NL,BE', taal: 'nl', product: p.naam });
  const tt = o && o.tiktok ? { land: kort(o.tiktok.land, 2).toUpperCase() || 'NL', cats: (o.tiktok.cats || []).slice(0, 3).map(c => kort(c, 50)).filter(Boolean) } : basis.tt;
  return { meta, tt: tt && tt.cats && tt.cats.length ? { land: tt.land, cats: tt.cats.slice(0, 3) } : null };
}
// Hoogstens 4 Meta-termen per project per dag; is de lijst langer, dan schuift het venster elke dag op zodat alles aan bod komt.
export function termenVandaag(lijst, nu = Date.now(), max = MAX_META_PER_DAG) {
  if (lijst.length <= max) return lijst.slice();
  const start = (Math.floor(nu / DAG) * max) % lijst.length; return Array.from({ length: max }, (_, i) => lijst[(start + i) % lijst.length]);
}
export const termSleutel = t => sleutelNaam(t.q) + '|' + t.landen.replace(/,/g, '');

// ---------- Meta normaliseren en kiezen ----------
const strip = u => { try { const x = new URL(String(u)); return (x.origin + x.pathname).slice(0, 200); } catch (e) { return ''; } };
const eerste = a => Array.isArray(a) ? a.map(x => kort(x, 400)).filter(Boolean)[0] || '' : kort(a, 400);
// Gaat de advertentie over de zoekterm? Meta zoekt ruim (live gezien 28 nov 2026: 'family organizer app' gaf een busverhuurder met alleen het woord
// family, 'music therapy' een weegschaal): de woorden van de term (4 letters of meer) moeten in de tekst, titel, omschrijving of paginanaam staan,
// bij een of twee woorden allemaal, bij meer twee derde. Als deel van een woord telt ook (cadeau in kerstcadeau, eiken in eikenhout).
export function raakt(term, tekst) {
  const alle = String(term || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean), w = alle.filter(x => x.length >= 4).length ? alle.filter(x => x.length >= 4) : alle; if (!w.length) return true;
  const t = String(tekst || '').toLowerCase(), raak = w.filter(x => t.includes(x)).length;
  return raak >= (w.length <= 2 ? w.length : Math.ceil(w.length * 2 / 3));
}
export function normMeta(r, nu = Date.now(), term = '') {
  if (!r || !r.id) return null;
  const sinds = kort(r.ad_delivery_start_time || r.ad_creation_time, 10), t0 = Date.parse(sinds + 'T00:00:00Z'), dagen = Number.isFinite(t0) ? Math.max(0, Math.floor((nu - t0) / DAG)) : 0;
  const med = Array.isArray(r.media) ? r.media : null, n = med ? med.length : 0;
  const beeld = !med ? 'onbekend' : n > 1 ? 'carrousel (' + n + ')' : n === 1 ? (med[0].type === 'video' ? 'video' : 'beeld') : 'tekst';
  const landing = strip(Array.isArray(r.destination_urls) ? r.destination_urls[0] : '');
  // bereik: eu_total_reach, of de som per gebied als die hoger is (een advertentie die alleen in het VK liep heeft geen EU-bereik)
  const perGebied = (Array.isArray(r.total_reach_by_location) ? r.total_reach_by_location : []).reduce((a, x) => a + N(x && x.value), 0), alles = [r.page_name, r.ad_creative_bodies, r.ad_creative_link_titles, r.ad_creative_link_descriptions, r.ad_creative_link_captions].flat().filter(Boolean).join(' ');
  return { id: String(r.id), pid: String(r.page_id || ''), pagina: kort(r.page_name, 80), sinds, dagen, bereik: Math.max(N(r.eu_total_reach), perGebied), titel: kort(eerste(r.ad_creative_link_titles), 110), tekst: kort(eerste(r.ad_creative_bodies), 300),
    kanalen: (Array.isArray(r.publisher_platforms) ? r.publisher_platforms : []).slice(0, 6).map(x => kort(x, 20)), beeld, landing, bron: /^https:\/\//.test(String(r.ad_library_url || '')) ? r.ad_library_url : 'https://www.facebook.com/ads/library/?id=' + String(r.id).replace(/\D/g, ''), term: kort(term, 60), raak: raakt(term, alles) };
}
// Lang actief en veel bereik: het bereik telt zwaar mee (316 mensen in 108 dagen is geen winnaar, 11.000 in een jaar wel), zonder bereik blijft er weinig over.
const score = x => x.dagen * Math.max(0.2, Math.log10(1 + N(x.bereik)) - 1);
const schaalTekst = x => (x.schaal > 1 ? ', ' + x.schaal + ' langlopers van deze pagina' : '') + (x.paginasDomein > 1 ? ', ' + x.paginasDomein + ' pagina\'s sturen naar dit domein' : '');
// Winnaars: lang actief en veel bereik; dezelfde tekst van dezelfde pagina telt een keer (kopieen), hoogstens perPagina per pagina,
// en per pagina het aantal verschillende langlopers (schaal) erbij.
// Eén adverteerder stuurt vaak vanaf meerdere pagina's naar hetzelfde domein (live gezien 28 nov 2026: vijf paginanamen naar één winkel vulden de
// hele lijst): hoogstens perDomein per landingsdomein, met het aantal pagina's dat ernaar stuurt erbij (ook een schaalsignaal).
const domein = u => { try { return new URL(String(u)).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };
export function kiesLanglopers(rijen, { n = 12, perPagina = 3, perDomein = 2, nu = Date.now() } = {}) {
  const per = new Map(); for (const r of rijen || []) if (r && r.id) per.set(r.id, { ...r, dagen: Math.max(N(r.dagen), r.sinds && Number.isFinite(Date.parse(r.sinds + 'T00:00:00Z')) ? Math.floor((nu - Date.parse(r.sinds + 'T00:00:00Z')) / DAG) : 0) });
  const tekstSl = new Map(); for (const r of [...per.values()].sort((a, b) => score(b) - score(a))) { const k = (r.pid || r.pagina) + '|' + (r.tekst || r.titel || r.id).slice(0, 80).toLowerCase(); if (!tekstSl.has(k)) tekstSl.set(k, r); }
  const uniek = [...tekstSl.values()], schaal = {}, opDomein = {}; for (const r of uniek) { schaal[r.pid || r.pagina] = (schaal[r.pid || r.pagina] || 0) + 1; const h = domein(r.landing); if (h) (opDomein[h] = opDomein[h] || new Set()).add(r.pid || r.pagina); }
  const tel = {}, telD = {}, uit = []; for (const r of uniek.sort((a, b) => score(b) - score(a))) { const p = r.pid || r.pagina, h = domein(r.landing); if ((tel[p] || 0) >= perPagina || (h && (telD[h] || 0) >= perDomein)) continue; tel[p] = (tel[p] || 0) + 1; if (h) telD[h] = (telD[h] || 0) + 1;
    uit.push({ ...r, schaal: schaal[p], paginasDomein: h && opDomein[h].size > 1 ? opDomein[h].size : undefined }); if (uit.length >= n) break; }
  return uit;
}

// ---------- TikTok normaliseren en kiezen ----------
// Eerst de hashtags die in het land van het project zelf groot zijn (het land staat bij de top-landen van de hashtag), dan de rest op rang: in de lijst
// van NL staan ook wereldwijde hashtags (lego, squishy) waar Nederland niet bij de top-landen hoort. rank_change is een getal of 'NEW' (nieuw in de
// lijst): nieuw telt als stijger (live gezien 28 nov 2026: de getallen zijn klein, de nieuwkomers zijn de echte stijgers).
const lokaalEerst = (a, b) => (b.lokaal ? 1 : 0) - (a.lokaal ? 1 : 0) || (a.rang || 9e9) - (b.rang || 9e9);
export function kiesHashtags(lijst, { land = '', cat = '', n = 8 } = {}) {
  const l = (Array.isArray(lijst) ? lijst : []).filter(x => x && x.hashtag_id && x.hashtag_name).map(x => { const nieuw = String(x.rank_change).toUpperCase() === 'NEW', landen = (Array.isArray(x.top_country_list) ? x.top_country_list : []).slice(0, 5).map(c => kort(c, 3));
    return { id: String(x.hashtag_id), naam: kort(x.hashtag_name, 60), rang: N(x.rank_position), verandering: nieuw ? 0 : N(x.rank_change), nieuw: nieuw || undefined, weergaven: N(x.views), posts: N(x.posts), landen, lokaal: (!!land && landen.includes(land)) || undefined, land, cat }; });
  const top = [...l].sort(lokaalEerst).slice(0, 5), stijgers = l.filter(x => (x.nieuw || x.verandering >= 5) && x.weergaven >= 10000).sort((a, b) => (b.lokaal ? 1 : 0) - (a.lokaal ? 1 : 0) || b.verandering - a.verandering || b.weergaven - a.weergaven).slice(0, 3);
  const gezien = new Set(), uit = []; for (const x of [...top, ...stijgers]) { if (gezien.has(x.id)) continue; gezien.add(x.id); uit.push({ ...x, stijger: !!x.nieuw || x.verandering >= 5 }); }
  return uit.slice(0, n);
}
export function kiesVideos(lijst, { max = 3 } = {}) {
  const uit = []; for (const h of Array.isArray(lijst) ? lijst : []) { if (!h || !Array.isArray(h.top_video_list)) continue; for (const v of h.top_video_list.slice(0, max)) { const u = String(v && v.share_url || '').replace(/\?.*$/, ''); if (/^https:\/\/www\.tiktok\.com\//.test(u)) uit.push({ hashtag: String(h.hashtag_id), naam: kort(h.hashtag_name, 60), id: String(v.video_id || ''), url: u.slice(0, 200) }); } }
  return uit;
}
// Benchmark: items[].metrics is leeg bij minder dan 1.000 vertoningen in het venster. Dat is een melding, geen fout.
export function benchSamen(data) {
  const items = (data && Array.isArray(data.items)) ? data.items : [], met = items.filter(x => x && x.metrics && Object.keys(x.metrics).length);
  return { totaal: items.length, metWaarden: met.length, zonder: items.length - met.length, ads: met.slice(0, 8).map(x => ({ ad: String(x.info && x.info.ad_id || ''), plek: kort(x.info && x.info.placement, 30), ctr: x.metrics.ctr, cpc: x.metrics.cpc, cpm: x.metrics.cpm, cvr: x.metrics.cvr, cpa: x.metrics.cpa })),
    melding: !items.length ? 'geen advertenties teruggekregen' : !met.length ? 'alle ' + items.length + ' advertenties hebben minder dan 1.000 vertoningen in het venster: nog geen benchmark' : met.length + ' van ' + items.length + ' advertenties hebben benchmarkwaarden (de rest heeft minder dan 1.000 vertoningen)' };
}

// ---------- opslag per dag en per project ----------
const kDag = (dag, p) => 'ab:dag:' + dag + ':' + p, kP = p => 'ab:p:' + p;
const leegDag = () => ({ meta: {}, tt: {}, videos: null, bench: null, fout: {} });

// Zet de dagresultaten van een project samen met wat er al stond (rijen die 10 dagen niet meer zijn gezien vervallen) tot de beste 12.
export async function afronden(project, dag, { kvx = kv, nu = Date.now() } = {}) {
  const d = (await kvx.get(kDag(dag, project)).catch(() => null)) || leegDag(), oud = (await kvx.get(kP(project)).catch(() => null)) || {};
  const nieuw = []; for (const [k, x] of Object.entries(d.meta || {})) for (const r of x.rijen || []) nieuw.push({ ...r, gezien: dag });
  const grens = dagUtc(nu - 10 * DAG), behoud = (oud.meta || []).filter(r => r.raak === true && (r.gezien || '') >= grens && !nieuw.some(y => y.id === r.id)); // alleen rijen die de toets op de zoekwoorden haalden
  const meta = kiesLanglopers([...nieuw, ...behoud], { nu }).map(r => ({ ...r, gezien: (nieuw.find(y => y.id === r.id) || r).gezien || dag }));
  const producten = { ...(oud.producten || {}) };
  for (const [k, x] of Object.entries(d.meta || {})) if (x.product) { const rs = (x.rijen || []).map(r => ({ ...r, dagen: N(r.dagen) })), top = rs.sort((a, b) => score(b) - score(a))[0]; producten[x.product] = { dag, aantal: rs.length, langste: rs.reduce((m, r) => Math.max(m, r.dagen), 0), bereik: rs.reduce((m, r) => Math.max(m, N(r.bereik)), 0), paginas: new Set(rs.map(r => r.pid || r.pagina)).size, top: top ? { pagina: top.pagina, titel: top.titel, bron: top.bron } : null, venster: x.venster || '' }; }
  const hs = new Map(), alleCats = Object.entries(d.tt || {}); for (const [, x] of alleCats) for (const h of x.hashtags || []) { const b = hs.get(h.id); if (!b || h.rang < b.rang) hs.set(h.id, h); }
  const hashtags = [...hs.values()].sort(lokaalEerst).slice(0, 10), videos = (d.videos && d.videos.lijst) || [];
  const tt = (hashtags.length || (oud.tt && oud.tt.hashtags && oud.tt.hashtags.length)) ? { dag: hashtags.length ? dag : oud.tt.dag, land: (alleCats[0] && alleCats[0][1].land) || (oud.tt && oud.tt.land) || '', cats: alleCats.length ? alleCats.map(([c]) => c) : (oud.tt && oud.tt.cats) || [], hashtags: hashtags.length ? hashtags : oud.tt.hashtags, videos: hashtags.length ? videos : (oud.tt && oud.tt.videos) || [] } : null;
  const bench = d.bench ? { dag, ...d.bench } : (oud.bench || null);
  const termen = Object.entries(d.meta || {}).map(([k, x]) => ({ bron: 'meta', term: x.q, landen: x.landen, n: (x.rijen || []).length, venster: x.venster || '' }));
  const r = { project, t: new Date(nu).toISOString(), dag, termen: termen.length ? termen : oud.termen || [], meta, paginas: meta.reduce((o, x) => { o[x.pagina] = x.schaal; return o; }, {}), producten: Object.keys(producten).length ? producten : undefined, tt, bench };
  await kvx.set(kP(project), r, { ex: 21 * 86400 }).catch(() => {});
  return r;
}

// ---------- ophalen ----------
const tijd = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('time-out')), ms))]);
// De REST-naam van de mediaparameter staat niet in de documentatie (de MCP-tool noemt hem include_media): eerst includeMedia; geeft dat een 400 of rijen
// zonder media en landingspagina, dan include_media. De spelling die media geeft blijft onthouden zolang de functie warm is, zodat het geen aanroepen kost.
let mediaNaam = '';
async function zernioZoek(basis, { haal, sleutel }) {
  let zonder = null;
  for (const naam of mediaNaam ? [mediaNaam] : ['includeMedia', 'include_media']) {
    const r = await haal(ZERNIO + '?' + new URLSearchParams({ ...basis, [naam]: 'true' }), { headers: { authorization: 'Bearer ' + sleutel }, signal: AbortSignal.timeout(50000) });
    if (!r.ok) { const tekst = kort(await r.text().catch(() => ''), 180); if (r.status === 400 && !mediaNaam && naam === 'includeMedia') continue; throw new Error('Zernio HTTP ' + r.status + (tekst ? ': ' + tekst : '')); }
    const j = await r.json(), lijst = Array.isArray(j && j.data) ? j.data : Array.isArray(j && j.ads) ? j.ads : [];
    if (!lijst.length) return { lijst, media: true };
    if (lijst.some(x => x && ('media' in x || 'destination_urls' in x))) { mediaNaam = naam; return { lijst, media: true }; }
    zonder = lijst;
  }
  if (!mediaNaam) mediaNaam = 'includeMedia'; // geen van beide gaf media: niet bij elke term opnieuw dubbel vragen, de melding staat in de stand
  return { lijst: zonder || [], media: false };
}
async function metaZoek(t, { haal, sleutel, nu, stop = () => false }) {
  const rijen = new Map(); let venster = '', melding = '', gekregen = 0, naast = 0;
  for (const dagenTerug of [90, 30]) {
    if (venster && stop()) { melding = [melding, 'tijd op: het venster van 30 dagen is overgeslagen'].filter(Boolean).join('; '); break; }
    const basis = { platform: 'meta', q: t.q, status: 'ACTIVE', until: dagUtc(nu - dagenTerug * DAG), limit: String(META_LIMIT), countries: t.landen }; if (t.taal) basis.languages = t.taal;
    const r = await zernioZoek(basis, { haal, sleutel });
    if (!r.media) melding = 'de rijen hebben geen media en landingspagina: de mediaparameter is genegeerd';
    for (const x of r.lijst) { const n = normMeta(x, nu, t.q); if (!n) continue; gekregen++; if (n.raak) rijen.set(n.id, n); else naast++; }
    venster = String(dagenTerug); if (rijen.size >= 5) break;
  }
  if (naast) melding = [melding, naast + ' van ' + gekregen + ' rijen weggelaten: de zoekwoorden staan niet in de advertentie'].filter(Boolean).join('; ');
  return { rijen: [...rijen.values()], venster, melding };
}
async function ttApi(pad, params, { haal, sleutel }) {
  const q = new URLSearchParams(); for (const [k, v] of Object.entries(params)) q.set(k, typeof v === 'string' ? v : JSON.stringify(v));
  const r = await haal('https://business-api.tiktok.com/open_api/v1.3' + pad + '?' + q, { headers: { 'Access-Token': sleutel }, signal: AbortSignal.timeout(30000) }), j = await r.json().catch(() => ({}));
  if (!j || j.code !== 0) throw new Error('TikTok ' + (j && j.code) + ': ' + kort(j && j.message || r.status, 160));
  return j.data || {};
}

// ---------- de dagronde ----------
// Lijst van wat vandaag moet: per project de Meta-termen van vandaag en de TikTok-categorieen; afgevinkt wat in kv al staat.
export async function werkVandaag({ kvx = kv, nu = Date.now(), alleen = '' } = {}) {
  const over = await kvx.get('ab:zoek').catch(() => null), dag = dagUtc(nu), uit = [];
  for (const p of Object.keys(ZOEK)) {
    if (alleen && p !== alleen) continue; const T = termenVan(p, over), d = (await kvx.get(kDag(dag, p)).catch(() => null)) || leegDag();
    for (const t of termenVandaag(T.meta, nu)) uit.push({ project: p, bron: 'meta', sleutel: termSleutel(t), t, klaar: !!d.meta[termSleutel(t)] });
    if (T.tt) { for (const c of T.tt.cats) uit.push({ project: p, bron: 'tiktok', soort: 'lijst', sleutel: c, land: T.tt.land, klaar: !!d.tt[c] });
      uit.push({ project: p, bron: 'tiktok', soort: 'videos', sleutel: 'videos', land: T.tt.land, klaar: !!d.videos }); }
    if (p === 'kadoly') uit.push({ project: p, bron: 'tiktok', soort: 'benchmark', sleutel: 'benchmark', klaar: !!d.bench });
  }
  return { dag, uit };
}
async function bronOk(kvx, bron, nu, fout, ok = true) {
  const s = (await kvx.get('ab:stand').catch(() => null)) || {}; s.bronnen = s.bronnen || {}; const b = s.bronnen[bron] || {};
  if (ok) { b.ok = new Date(nu).toISOString(); if (!fout) b.fout = ''; } if (fout) { b.fout = kort(fout, 200); b.foutT = new Date(nu).toISOString(); }
  s.bronnen[bron] = b; await kvx.set('ab:stand', s, { ex: 30 * 86400 }).catch(() => {});
}
export async function ronde({ budgetMs = 170000, forceer = false, alleen = '', haal = fetch, nu = Date.now(), kvx = kv, sleutels = null, hulp = {} } = {}) {
  const t0 = Date.now(), dag = dagUtc(nu), log = [], fouten = [];
  const zk = sleutels && 'zernio' in sleutels ? sleutels.zernio : (process.env.ZERNIO_API_KEY || process.env.ZERNIO_KEY || '');
  let tk = sleutels && 'tiktok' in sleutels ? sleutels.tiktok : null, adv = (sleutels && sleutels.adv) || null;
  if (tk == null) { try { const T = await import('./tiktok.js'); tk = await T.ttSleutel(); adv = adv || T.TT_ADV; } catch (e) { tk = ''; } }
  const W = await werkVandaag({ kvx, nu, alleen }), open = W.uit.filter(x => forceer || !x.klaar), aangeraakt = new Set(), klaarMeta = { ok: 0, fout: 0 }, klaarTt = { ok: 0, fout: 0 };
  const dagData = {}, lees = async p => dagData[p] || (dagData[p] = (await kvx.get(kDag(dag, p)).catch(() => null)) || leegDag()), bewaar = p => kvx.set(kDag(dag, p), dagData[p], { ex: 3 * 86400 }).catch(() => {});
  const stop = () => Date.now() - t0 > budgetMs, stopTt = () => Date.now() - t0 > Math.min(budgetMs, TT_SLOT_MS);
  // Eerst TikTok in zijn eigen tijdslot: alle lijsten, dan de video's (die hebben de hashtags van de lijsten nodig), dan de benchmark. Daarna Meta om de
  // beurt per project (eerste term van elk project, dan de tweede), en elke dag begint een ander project: geen project krijgt structureel niets.
  const perP = {}; for (const x of open.filter(x => x.bron === 'meta')) (perP[x.project] = perP[x.project] || []).push(x);
  const ps = Object.keys(perP), draai = ps.length ? Math.floor(nu / DAG) % ps.length : 0, beurt = [...ps.slice(draai), ...ps.slice(0, draai)], metaRij = [];
  for (let i = 0, diep = Math.max(0, ...ps.map(p => perP[p].length)); i < diep; i++) for (const p of beurt) if (perP[p][i]) metaRij.push(perP[p][i]);
  const volgorde = [...open.filter(x => x.soort === 'lijst'), ...open.filter(x => x.soort === 'videos'), ...open.filter(x => x.soort === 'benchmark'), ...metaRij];
  const opRij = { meta: 0, tiktok: 0 }, gestopt = {};
  for (const w of volgorde) {
    if (gestopt[w.bron]) continue;
    if (w.bron === 'tiktok' ? stopTt() : stop()) { gestopt[w.bron] = true; log.push((w.bron === 'tiktok' ? 'tijdslot van TikTok op' : 'tijdbudget op') + ': de rest volgt bij de volgende aanroep'); continue; }
    const d = await lees(w.project); aangeraakt.add(w.project);
    try {
      if (w.bron === 'meta') {
        if (!zk) throw new Error('geen Zernio-sleutel op de server: een chat haalt het op met de MCP-tool ad_library_search_ad_library en meldt het met op=adbieb');
        const r = await metaZoek(w.t, { haal, sleutel: zk, nu, stop }); d.meta[w.sleutel] = { q: w.t.q, landen: w.t.landen, product: w.t.product || undefined, venster: r.venster, melding: r.melding || undefined, rijen: kiesLanglopers(r.rijen, { n: 25, perPagina: 25, perDomein: 25, nu }), t: new Date(nu).toISOString() };
        delete d.fout['meta|' + w.sleutel]; klaarMeta.ok++; log.push(w.project + ' meta ' + w.t.q + ': ' + r.rijen.length + ' rijen (venster ' + r.venster + ' dagen)' + (r.melding ? ' | ' + r.melding : ''));
      } else {
        if (!tk) throw new Error('geen TikTok-sleutel op de server: een chat haalt het op met tool_execute (discovery_trending_list, discovery_video_list) en meldt het met op=adbieb');
        const o = { haal, sleutel: tk };
        if (w.soort === 'lijst') { const data = await ttApi('/discovery/trending_list/', { advertiser_id: adv, discovery_type: 'HASHTAG', country_code: w.land, category_name: w.sleutel, date_range: '7DAY' }, o); d.tt[w.sleutel] = { land: w.land, hashtags: kiesHashtags(data.list, { land: w.land, cat: w.sleutel }), t: new Date(nu).toISOString() }; log.push(w.project + ' tiktok ' + w.sleutel + ': ' + d.tt[w.sleutel].hashtags.length + ' hashtags'); }
        else if (w.soort === 'videos') {
          const hs = [...new Map(Object.values(d.tt).flatMap(x => x.hashtags || []).sort(lokaalEerst).map(h => [h.id, h])).values()].slice(0, 3), groepen = {};
          if (!hs.length) throw new Error('nog geen hashtags van dit project: de lijsten zijn vandaag niet gelukt'); // niet afvinken met een lege lijst
          for (const h of hs) { const c = h.landen.includes(w.land) ? w.land : (h.landen[0] || w.land); (groepen[c] = groepen[c] || []).push(h); }
          const lijst = []; for (const [c, g] of Object.entries(groepen)) { const data = await ttApi('/discovery/video_list/', { advertiser_id: adv, discovery_type: 'HASHTAG', hashtag_ids: g.map(h => h.id), country_code: c, date_range: '7DAY' }, o); lijst.push(...kiesVideos(data.list)); }
          d.videos = { lijst, t: new Date(nu).toISOString() }; log.push(w.project + ' tiktok video\'s: ' + lijst.length);
        } else {
          const T = await import('./tiktok.js'), data = await ttApi('/report/ad_benchmark/get/', { advertiser_id: adv, dimensions: ['PLACEMENT'], filtering: { campaign_ids: T.TT_CAMPS }, compare_time_window: '30', page_size: 20 }, o);
          d.bench = benchSamen(data); log.push(w.project + ' tiktok benchmark: ' + d.bench.melding);
        }
        delete d.fout['tiktok|' + w.sleutel]; klaarTt.ok++;
      }
      opRij[w.bron] = 0;
    } catch (e) { const m = kort(e && e.message || e, 220); d.fout[w.bron + '|' + w.sleutel] = m; fouten.push(w.project + ' ' + w.bron + ' ' + (w.t ? w.t.q : w.sleutel) + ': ' + m); (w.bron === 'meta' ? klaarMeta : klaarTt).fout++;
      if (++opRij[w.bron] >= FOUTEN_OP_RIJ) { gestopt[w.bron] = true; log.push(w.bron + ': ' + FOUTEN_OP_RIJ + ' fouten op rij, deze aanroep gestopt (de volgende probeert het opnieuw)'); } }
    await bewaar(w.project);
  }
  for (const p of aangeraakt) await afronden(p, dag, { kvx, nu }).catch(e => fouten.push(p + ' afronden: ' + kort(e && e.message, 100)));
  const laatste = fouten.filter(f => / meta /.test(f)).pop(), laatsteTt = fouten.filter(f => / tiktok /.test(f)).pop();
  if (klaarMeta.ok || laatste) await bronOk(kvx, 'meta', nu, laatste || '', !!klaarMeta.ok);
  if (klaarTt.ok || laatsteTt) await bronOk(kvx, 'tiktok', nu, laatsteTt || '', !!klaarTt.ok);
  const s = (await kvx.get('ab:stand').catch(() => null)) || {}; s.ronde = { dag, t: new Date(nu).toISOString(), open: open.length, meta: klaarMeta, tiktok: klaarTt, fouten: fouten.slice(0, 8) }; await kvx.set('ab:stand', s, { ex: 30 * 86400 }).catch(() => {});
  const trend = await meldTrend({ kvx, nu, hulp }).catch(e => ({ ok: false, fout: kort(e && e.message, 100) }));
  const taak = await bewaak({ kvx, nu, hulp }).catch(e => ({ ok: false, fout: kort(e && e.message, 100) }));
  return { ok: true, dag, open: open.length, meta: klaarMeta, tiktok: klaarTt, log, fouten, trend, taak };
}

// ---------- zet: een chat heeft het met de MCP-tools opgehaald ----------
// b: { project, bron: 'meta', term, landen?, taal?, rijen: [ruwe rijen van Meta] }
//  of { project, bron: 'tiktok', land, cat, lijst: [ruwe rijen van discovery_trending_list], videos: [ruwe list van discovery_video_list], benchmark: { items } }
export async function zet(b, { kvx = kv, nu = Date.now(), hulp = {} } = {}) {
  if (Array.isArray(b)) { const uit = []; for (const x of b.slice(0, 40)) uit.push(await zet(x, { kvx, nu, hulp })); return { ok: uit.every(x => x.ok), uit }; }
  const project = pid(b && b.project), dag = dagUtc(nu); if (!ZOEK[project]) return { ok: false, fout: 'project: ' + Object.keys(ZOEK).join(', ') };
  const bron = b.bron === 'tiktok' ? 'tiktok' : b.bron === 'meta' ? 'meta' : ''; if (!bron) return { ok: false, fout: 'bron: meta of tiktok' };
  const d = (await kvx.get(kDag(dag, project)).catch(() => null)) || leegDag(), gedaan = [];
  if (bron === 'meta') {
    const q = kort(b.term || b.q, 100), rijen = Array.isArray(b.rijen) ? b.rijen : Array.isArray(b.data) ? b.data : []; if (!q || !rijen.length) return { ok: false, fout: 'meta: {"project","bron":"meta","term":"zoekterm","landen":"NL,BE","rijen":[ruwe rijen van ad_library_search_ad_library]}' };
    const T = termenVan(project, await kvx.get('ab:zoek').catch(() => null)), landen = kort(b.landen || '', 40).toUpperCase(), bekend = T.meta.find(t => t.q.toLowerCase() === q.toLowerCase()), t = { q, landen: landen || (bekend && bekend.landen) || 'GB,NL', taal: bekend ? bekend.taal : kort(b.taal, 5), product: bekend && bekend.product || undefined };
    const norm = rijen.slice(0, 100).map(r => normMeta(r, nu, q)).filter(x => x && x.raak); if (!norm.length) return { ok: false, fout: 'geen bruikbare rijen (id ontbreekt, of de zoekwoorden staan niet in de advertentie)' };
    d.meta[termSleutel(t)] = { q, landen: t.landen, product: t.product, venster: kort(b.venster, 3) || '?', melding: 'gemeld door een chat', rijen: kiesLanglopers(norm, { n: 25, perPagina: 25, perDomein: 25, nu }), t: new Date(nu).toISOString() }; gedaan.push('meta ' + q + ': ' + norm.length + ' rijen');
  } else {
    const land = kort(b.land, 2).toUpperCase() || (ZOEK[project].tt && ZOEK[project].tt.land) || 'NL', cat = kort(b.cat, 50) || 'ALL';
    if (Array.isArray(b.lijst) && b.lijst.length) { d.tt[cat] = { land, hashtags: kiesHashtags(b.lijst, { land, cat }), t: new Date(nu).toISOString() }; gedaan.push('tiktok ' + cat + ': ' + d.tt[cat].hashtags.length + ' hashtags'); }
    if (Array.isArray(b.videos) && b.videos.length) { d.videos = { lijst: kiesVideos(b.videos), t: new Date(nu).toISOString() }; gedaan.push('tiktok video\'s: ' + d.videos.lijst.length); }
    if (b.benchmark) { d.bench = benchSamen(b.benchmark.data || b.benchmark); gedaan.push('benchmark: ' + d.bench.melding); }
    if (!gedaan.length) return { ok: false, fout: 'tiktok: {"project","bron":"tiktok","land":"NL","cat":"HOME_AND_GARDEN","lijst":[data.list van discovery_trending_list],"videos":[data.list van discovery_video_list],"benchmark":{data van report_ad_benchmark_get}}' };
  }
  await kvx.set(kDag(dag, project), d, { ex: 3 * 86400 }); const r = await afronden(project, dag, { kvx, nu }); await bronOk(kvx, bron, nu, '');
  const trend = await meldTrend({ kvx, nu, hulp }).catch(() => null); return { ok: true, project, gedaan, langlopers: r.meta.length, hashtags: r.tt ? r.tt.hashtags.length : 0, trend };
}

// De overschrijving van de zoektermen (beschermde host): { "<project>": { "meta": [["term","GB,IE","en"]], "tiktok": { "land": "NL", "cats": ["TRAVEL"] } } }; null haalt een project terug naar de standaard.
export async function zetZoek(o, { kvx = kv } = {}) {
  if (!o || typeof o !== 'object') return { ok: false, fout: 'zoek: {"<project>":{"meta":[["term","GB,IE","en"]],"tiktok":{"land":"NL","cats":["TRAVEL"]}}}' };
  const nu = (await kvx.get('ab:zoek').catch(() => null)) || {}, fouten = [];
  for (const [p, v] of Object.entries(o)) { if (!ZOEK[p]) { fouten.push(p + ': onbekend project'); continue; } if (v == null) { delete nu[p]; continue; }
    const meta = Array.isArray(v.meta) ? v.meta.slice(0, 20) : undefined, tiktok = v.tiktok && typeof v.tiktok === 'object' ? { land: kort(v.tiktok.land, 2), cats: (v.tiktok.cats || []).slice(0, 3) } : undefined;
    if (!meta && !tiktok) { fouten.push(p + ': geef meta of tiktok'); continue; } nu[p] = { ...(meta ? { meta } : {}), ...(tiktok ? { tiktok } : {}) }; }
  await kvx.set('ab:zoek', nu); return { ok: !fouten.length, fouten: fouten.length ? fouten : undefined, zoek: nu };
}

// ---------- trendkennis (lib/trend.js) ----------
// Per medium hoogstens 12 items, verdeeld over de projecten (om de beurt de beste van elk), alleen wat vandaag nog niet is gemeld.
export async function meldTrend({ kvx = kv, nu = Date.now(), hulp = {} } = {}) {
  const dag = dagUtc(nu), oudG = (await kvx.get('ab:gemeld').catch(() => null)) || {}, G = {}, per = { meta: [], tiktok: [] };
  for (const [k, d] of Object.entries(oudG)) if (d >= dagUtc(nu - 10 * DAG)) G[k] = d; // wat op welke dag is gemeld, 10 dagen terug
  // een langloper hoogstens eens per dag (zetTrend ververst dezelfde regel), een TikTok-hashtag hoogstens eens per 3 dagen (Videomind bewaart elke melding apart)
  const gemeld = { has: k => !!G[k] && (k.startsWith('t|') ? G[k] > dagUtc(nu - 3 * DAG) : G[k] === dag), add: k => { G[k] = dag; } };
  const rij = { meta: {}, tiktok: {} };
  for (const p of Object.keys(ZOEK)) {
    const r = await kvx.get(kP(p)).catch(() => null); if (!r || nu - Date.parse(r.t) > 3 * DAG) continue;
    rij.meta[p] = (r.meta || []).slice(0, 3).map(x => ({ key: 'm|' + x.id, project: p, wat: 'Langloper bij ' + x.pagina + ' (' + p + '): ' + (x.titel || x.tekst).slice(0, 110) + (x.tekst && x.titel ? ' / ' + x.tekst.slice(0, 80) : ''), vorm: 'Neem de haak en de vorm over (' + x.beeld + (x.landing ? ', naar ' + x.landing.replace(/^https:\/\//, '') : '') + '), nooit de tekst.', maat: 'loopt ' + x.dagen + ' dagen, bereik ' + nl(x.bereik) + schaalTekst(x), bron: x.bron }));
    if (r.tt) { const v = r.tt.videos || []; rij.tiktok[p] = (r.tt.hashtags || []).slice(0, 3).map(h => { const vb = v.find(x => x.hashtag === h.id); return { key: 't|' + p + '|' + h.id, project: p, wat: 'Hashtag #' + h.naam + (h.nieuw ? ' is nieuw in de lijst' : h.stijger ? ' stijgt' : ' staat bovenaan') + ' op TikTok ' + (h.land || '') + ' (' + (h.cat || p) + ')', vorm: 'Gebruik als haak of hashtag en neem de vorm van de trendvideo over.', voorbeeld: vb ? vb.url : '', maat: 'rang ' + h.rang + (h.verandering ? ' (' + (h.verandering > 0 ? '+' : '') + h.verandering + ')' : '') + ', ' + nl(h.weergaven) + ' weergaven en ' + nl(h.posts) + ' posts in 7 dagen', bron: 'https://www.tiktok.com/tag/' + encodeURIComponent(h.naam) }; }); }
  }
  for (const m of ['meta', 'tiktok']) { const lijsten = Object.values(rij[m]).map(l => l.filter(x => !gemeld.has(x.key))); for (let i = 0; per[m].length < 12 && i < 3; i++) for (const l of lijsten) if (l[i] && per[m].length < 12) per[m].push(l[i]); }
  const TR = hulp.trend || await import('./trend.js'), uit = {};
  for (const m of ['meta', 'tiktok']) { if (!per[m].length) continue; const r = await TR.zetTrend({ medium: m, wie: 'adbieb', items: per[m].map(({ key, ...x }) => x) }); uit[m] = { erbij: r.erbij, geweigerd: r.geweigerd, ok: r.ok }; if (r.ok) for (const x of per[m]) gemeld.add(x.key); }
  if (Object.keys(uit).length) await kvx.set('ab:gemeld', G, { ex: 12 * 86400 }).catch(() => {});
  return uit;
}

// ---------- de briefing ----------
// medium: elk betaald medium krijgt de langlopers van het project (ook PropellerAds: zijn ochtendkopieen lezen de briefing van hun eigen medium);
// tiktok en tiktok-ads krijgen daarbovenop de hashtags, de trendvideo's en de benchmark. Kadoly: het verse bewijs per Whop-product.
export async function voorBriefing({ project, medium, nu = Date.now(), kvx = kv } = {}) {
  project = pid(project); if (!ZOEK[project]) return null;
  const r = await kvx.get(kP(project)).catch(() => null), betaald = MEDIA_BETAALD.includes(medium), tikt = medium === 'tiktok' || medium === 'tiktok-ads';
  if (!betaald && !tikt) return null;
  const leeg = !r || (!(r.meta || []).length && !(r.tt && r.tt.hashtags && r.tt.hashtags.length)), dagenOud = r ? Math.floor((nu - Date.parse(r.t)) / DAG) : null, vers = !!r && dagenOud <= 2;
  const regels = []; let hasMeta = false;
  if (r && betaald) for (const x of (r.meta || []).slice(0, 6)) { hasMeta = true; const dagen = Math.max(N(x.dagen), x.sinds ? Math.floor((nu - Date.parse(x.sinds + 'T00:00:00Z')) / DAG) : 0);
    regels.push(x.pagina + ': loopt ' + dagen + ' dagen, bereik ' + nl(x.bereik) + schaalTekst(x) + ' | haak: ' + (x.titel || '-') + ' / ' + (x.tekst || '').slice(0, 140) + ' | beeld: ' + x.beeld + (x.landing ? ' | landing: ' + x.landing.replace(/^https:\/\//, '') : '') + ' [' + x.bron + ']'); }
  const tt = [];
  if (r && tikt && r.tt) { for (const h of (r.tt.hashtags || []).slice(0, 6)) { const vb = ((r.tt.videos || []).find(v => v.hashtag === h.id) || {}).url; tt.push('#' + h.naam + (h.nieuw ? ' (nieuw in de lijst)' : h.stijger ? ' (stijgt)' : '') + (h.lokaal ? '' : ' (wereldwijd, niet groot in ' + (h.land || 'dit land') + ')') + ': rang ' + h.rang + ', ' + nl(h.weergaven) + ' weergaven en ' + nl(h.posts) + ' posts in 7 dagen' + (vb ? ' | voorbeeld ' + vb : '')); }
    if (r.bench) tt.push('Benchmark van eigen TikTok-advertenties (' + r.bench.dag + '): ' + r.bench.melding + (r.bench.ads && r.bench.ads.length ? ' | ' + r.bench.ads.slice(0, 3).map(a => 'ad ' + a.ad + ' ctr ' + a.ctr + ' cpc ' + a.cpc + ' cpm ' + a.cpm).join('; ') + ' (ruwe waarden van TikTok, de schaal is niet gecontroleerd)' : '')); }
  const prod = []; if (r && betaald && project === 'kadoly' && r.producten) for (const [naam, x] of Object.entries(r.producten)) if (x.aantal > 0) prod.push(naam + ': ' + x.aantal + ' langlopers bij ' + x.paginas + ' pagina\'s, langste ' + x.langste + ' dagen, hoogste bereik ' + nl(x.bereik) + ' (' + x.dag + ')' + (x.top && x.top.bron ? ' [' + x.top.bron + ']' : ''));
  return { dag: r ? r.dag : '', dagenOud, vers, leeg, langlopers: regels, tiktok: tt, producten: prod, betaald, tikt, hasMeta };
}

// ---------- lezen ----------
export async function stand({ kvx = kv, nu = Date.now() } = {}) {
  const s = (await kvx.get('ab:stand').catch(() => null)) || {}, W = await werkVandaag({ kvx, nu }), projecten = {};
  for (const p of Object.keys(ZOEK)) { const r = await kvx.get(kP(p)).catch(() => null); projecten[p] = r ? { dag: r.dag, langlopers: (r.meta || []).length, hashtags: r.tt ? (r.tt.hashtags || []).length : 0, benchmark: r.bench ? r.bench.melding : null } : null; }
  const bronnen = {}; for (const b of ['meta', 'tiktok']) { const x = (s.bronnen || {})[b] || {}; bronnen[b] = { laatsteOk: x.ok || null, uurGeleden: x.ok ? Math.round((nu - Date.parse(x.ok)) / 36e5) : null, laatsteFout: x.fout || null, foutT: x.foutT || null }; }
  return { t: new Date(nu).toISOString(), dag: W.dag, bronnen, ronde: s.ronde || null, vandaag: { totaal: W.uit.length, klaar: W.uit.filter(x => x.klaar).length }, open: W.uit.filter(x => !x.klaar).map(x => ({ project: x.project, bron: x.bron, ...(x.t ? { term: x.t.q, landen: x.t.landen, taal: x.t.taal } : { soort: x.soort, cat: x.soort === 'lijst' ? x.sleutel : undefined, land: x.land }) })), projecten };
}
export async function tekst(project = '', { kvx = kv, nu = Date.now() } = {}) {
  const S = await stand({ kvx, nu }), over = await kvx.get('ab:zoek').catch(() => null), L = ['ADVERTENTIEBIBLIOTHEKEN (Meta Ad Library via Zernio, TikTok discovery): wat anderen laten lopen. Research is een voorsprong en geen wet: eigen cijfers gaan voor; neem haak en vorm over, nooit de tekst.', ''];
  for (const b of ['meta', 'tiktok']) { const x = S.bronnen[b]; L.push(b + ': ' + (x.laatsteOk ? 'laatste geslaagde ronde ' + x.laatsteOk.slice(0, 16).replace('T', ' ') + ' UTC (' + x.uurGeleden + ' uur geleden)' : 'nog nooit geslaagd') + (x.laatsteFout ? ' | laatste fout: ' + x.laatsteFout : '')); }
  L.push('Vandaag: ' + S.vandaag.klaar + ' van ' + S.vandaag.totaal + ' onderdelen klaar.', '');
  for (const p of Object.keys(ZOEK)) {
    if (project && p !== project) continue; const r = await kvx.get(kP(p)).catch(() => null), T = termenVan(p, over);
    L.push('== ' + p + ' ==', 'Zoektermen Meta: ' + (T.meta.map(t => t.q + ' [' + t.landen + ']').join('; ') || '-') + (T.tt ? ' | TikTok ' + T.tt.land + ': ' + T.tt.cats.join(', ') : ''));
    if (!r) { L.push('Nog geen ronde.', ''); continue; }
    L.push('Stand ' + r.dag + ':');
    for (const x of r.meta || []) L.push('- ' + x.pagina + ': loopt ' + x.dagen + ' dagen, bereik ' + nl(x.bereik) + schaalTekst(x) + ' | ' + (x.titel || '-') + ' / ' + (x.tekst || '').slice(0, 120) + ' | ' + x.beeld + ' | ' + (x.landing || 'geen landingspagina') + ' [' + x.bron + ']');
    if (r.producten) for (const [n, x] of Object.entries(r.producten)) L.push('- Whop-product ' + n + ': ' + (x.aantal ? x.aantal + ' langlopers, langste ' + x.langste + ' dagen' : 'geen langlopers gevonden') + ' (' + x.dag + ')');
    if (r.tt) { for (const h of r.tt.hashtags || []) L.push('- TikTok #' + h.naam + ' rang ' + h.rang + ' (' + (h.nieuw ? 'nieuw' : h.verandering) + (h.lokaal ? '' : ', wereldwijd') + '), ' + nl(h.weergaven) + ' weergaven, ' + nl(h.posts) + ' posts'); for (const v of (r.tt.videos || []).slice(0, 6)) L.push('  video ' + v.url); }
    if (r.bench) L.push('- Benchmark: ' + r.bench.melding);
    L.push('');
  }
  return L.join('\n');
}

// ---------- controle met ingreep ----------
// Een bron zonder geslaagde ronde in 36 uur (of nooit, 36 uur na de eerste controle): hoogstens een taak per 20 uur en niet als er al een open staat.
export async function bewaak({ kvx = kv, nu = Date.now(), hulp = {} } = {}) {
  const s = (await kvx.get('ab:stand').catch(() => null)) || {}, b = s.bronnen || {}; let eerst = await kvx.get('ab:eerst').catch(() => null);
  if (!eerst) { eerst = new Date(nu).toISOString(); await kvx.set('ab:eerst', eerst, { ex: 90 * 86400 }).catch(() => {}); }
  const stil = ['meta', 'tiktok'].filter(m => { const t = Date.parse((b[m] && b[m].ok) || eerst); return nu - t > STIL_UREN * 36e5; });
  if (!stil.length) return { ok: true, stil: [] };
  if (!(await kvx.raw(['SET', 'ab:taak', '1', 'NX', 'EX', String(20 * 3600)]).catch(() => null))) return { ok: true, stil, taak: 'vandaag al gezet' };
  try {
    const T = hulp.taken || await import('./taken.js'), open = ((await T.leesTaken(kvx)).taken || []).some(x => /^Advertentiebibliotheken voor Clickmind/.test(x.tekst || '') && ['wacht', 'bezig', 'jij'].includes(x.status));
    if (open) return { ok: true, stil, taak: 'staat al open' };
    const fouten = stil.map(m => m + ': ' + ((b[m] && b[m].fout) || 'geen ronde gelukt')).join('; ');
    const r = await T.zetTaken(kvx, { taak: { tekst: 'Advertentiebibliotheken voor Clickmind: ' + stil.join(' en ') + ' heeft ' + STIL_UREN + ' uur geen geslaagde ronde van de server (' + fouten + '). Haal het zelf op met de MCP-tools en meld het. Welke termen vandaag open staan: ' + HOST + '/api/mm?op=adbieb&vorm=json (veld open). '
      + (stil.includes('meta') ? 'META: per open term mcp__Zernio__call_tool met name ad_library_search_ad_library en arguments {"platform":"meta","q":"<term>","countries":"<landen>","languages":"<taal>","status":"ACTIVE","until":"<vandaag min 90 dagen, JJJJ-MM-DD>","include_media":true,"limit":5} (is het minder dan 5 rijen: until vandaag min 30 dagen). Hoogstens 4 zoekopdrachten, alleen lezen. Meld de ruwe rijen met ' + HOST + '/api/mm?op=adbieb&j={"project":"<id>","bron":"meta","term":"<term>","landen":"<landen>","rijen":[...]} (POST met dezelfde JSON mag ook). ' : '')
      + (stil.includes('tiktok') ? 'TIKTOK: mcp__TikTok_for_Business__tool_execute met tool_name discovery_trending_list en params {"advertiser_id":"7708796437043265537","discovery_type":"HASHTAG","country_code":"<land>","category_name":"<categorie>","date_range":"7DAY"}, daarna discovery_video_list met hashtag_ids van 3 hashtags die het land bij hun top_country_list hebben (anders komt er niets terug). Het antwoord van de lijst is 470.000 tekens: lees het uit het bestand met een script en stuur alleen de bovenste 5 op rang plus de 3 grootste met rank_change NEW of 5 en hoger, per rij alleen hashtag_id, hashtag_name, posts, views, rank_position, rank_change en top_country_list; van de video\'s per hashtag 3 keer share_url en video_id. Meld per categorie met een GET op ' + HOST + '/api/mm?op=adbieb&j={"project":"<id>","bron":"tiktok","land":"<land>","cat":"<categorie>","lijst":[...],"videos":[{"hashtag_id","hashtag_name","top_video_list":[{"share_url","video_id"}]}]} (JSON in de URL gecodeerd). Voor Kadoly ook report_ad_benchmark_get met {"advertiser_id":"7708796437043265537","dimensions":["PLACEMENT"],"filtering":{"campaign_ids":[de campagnes TT_CAMPS uit lib/tiktok.js]},"compare_time_window":"30","page_size":20} en meld "benchmark":{"items":[...]} (per item info en metrics). Alleen discovery_* en dit rapport lezen, nooit iets aanmaken of wijzigen. ' : '')
      + 'Klaar als ' + HOST + '/api/mm?op=adbieb bij die bron een recente geslaagde ronde toont. Zoek ook uit waarom de eigen ronde niet slaagt (de laatste fout staat in die tekst) en meld dat.', project: 'clickmind', zwaarte: 'gewoon' } }, 'clickmind-adbieb');
    return { ok: true, stil, taak: r.taak || null };
  } catch (e) { return { ok: false, stil, fout: kort(e && e.message || e, 100) }; }
}
