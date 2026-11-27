// Videomind: één register en één leergeheugen voor elke video van elk project (Henkjan 26 nov 2026: "We maken een videomind om al het geleerde
// op te slaan en tracken per video voor alle projecten; zet in dashboard; ook beschikbaar voor iedereen deze skill").
// Broertje van Clickmind (leert van elke klik) en Mailmind (leert van elke mail): Videomind leert van elke video.
// Skill: .claude/skills/videomind/SKILL.md (live /api/videomind?op=skill, ook /api/mm/dashboard?vorm=skill&naam=videomind).
//
// Hoe het werkt:
// - Register: elke video krijgt vóór plaatsen een regel (op=zet): project, platform, Zernio-id, titel, vorm (short/long), onderwerp en pagina,
//   haak (titelvorm), lengte, publicatietijd, link met utm_content = video-id. Het video-id is de sleutel overal: Clickmind telt de bezoeken
//   van die link als zone (net = utm_source, zone = utm_content), dus het id moet uniek zijn over alle projecten.
// - Metingen: de ronde (cron elke 6 uur, op=ronde) haalt per geplaatste video de cijfers uit Zernio (weergaven, likes, reacties, delen,
//   kijkduur, uitkijkpercentage) en per dag de bezoeken, echte mensen en uitkomsten uit Clickmind (mm:z en mm:zu). Een project meldt zijn
//   eigen uitkomsten (verkopen, omzet) met op=meting. Na 48 uur en na 7 dagen legt de ronde de weergaven vast (m48, m7), zodat video's
//   eerlijk te vergelijken zijn.
// - Lessen: automatisch uit de cijfers per platform en project (mediaan weergaven na 48 uur per haak, vorm, lengte, uur en onderwerp; doorkliks
//   en echte mensen per 1.000 weergaven), plus lessen met de hand (op=les). Een les telt pas vanaf 3 video's per kant.
// Opslag (Redis, zelfde als Mailmind): vm:v:<id> video, vm:lijst alle id's, vm:m:<id> metingen (laatste 120), vm:ck:<id> bezoeken per dag
// (dag -> "n,mens"), vm:cu:<id> uitkomsten per dag (dag -> "aanmelding,koop,actie"), vm:l lessen met de hand, vm:sam samenvatting van de ronde.
// Geen sleutels in code of URL: Zernio via env ZERNIO_API_KEY (gedeelde team-variabele).
import { kv } from './db.js';

const HOST = 'https://hjdk-api-henq.vercel.app';
export const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const kort = (x, n) => String(x == null ? '' : x).trim().slice(0, n);
const dagUTC = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const ID = /^[a-z0-9][a-z0-9_.-]{1,60}$/i;
export const PLATFORMS = ['youtube', 'tiktok', 'instagram', 'pinterest', 'facebook', 'linkedin', 'x', 'threads'];
const VORMEN = ['short', 'long'];
const UUR = 3600e3, DAG = 24 * UUR;

// ---------- register ----------
export function schoonVideo(b, oud = {}) {
  const id = kort(b.id || b.utm_content || oud.id, 61);
  if (!ID.test(id)) return { fout: 'id: letters, cijfers, - _ . (2-61 tekens); gebruik hetzelfde id als utm_content in de link' };
  const v = Object.assign({}, oud, { id });
  const project = kort(b.project != null ? b.project : oud.project, 30).toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!project) return { fout: 'project ontbreekt (bijv. mylevel, kadoly, nexy, wam)' };
  v.project = project;
  const platform = kort(b.platform != null ? b.platform : oud.platform, 20).toLowerCase();
  if (!PLATFORMS.includes(platform)) return { fout: 'platform: ' + PLATFORMS.join(', ') };
  v.platform = platform;
  if (b.vorm != null) { const f = String(b.vorm).toLowerCase(); if (!VORMEN.includes(f)) return { fout: 'vorm: short of long' }; v.vorm = f; }
  if (!v.vorm) v.vorm = 'short';
  for (const [k, n] of [['zid', 40], ['extern', 60], ['url', 300], ['titel', 160], ['onderwerp', 60], ['pagina', 200], ['haak', 40], ['taal', 8], ['arm', 12], ['utm_content', 61], ['net', 30], ['camp', 30], ['link', 400], ['notitie', 300], ['doelsoort', 12], ['trend', 60]])
    if (b[k] != null) v[k] = kort(b[k], n);
  if (b.haak != null) v.haakHand = b.haakHand !== false;
  if (b.lengte != null) v.lengte = Math.max(0, Math.round(N(b.lengte)));
  if (b.at != null) { const t = Date.parse(b.at); if (!Number.isFinite(t)) return { fout: 'at: ISO-tijd van plaatsen (UTC)' }; v.at = new Date(t).toISOString(); }
  if (v.link && !/^https:\/\//.test(v.link)) return { fout: 'link moet met https:// beginnen' };
  if (!v.utm_content) v.utm_content = id;
  if (!v.net) v.net = v.platform;
  if (!v.haak && v.titel) v.haak = haakVan(v.titel, v.vorm);
  v.bijgewerkt = new Date().toISOString(); if (!v.sinds) v.sinds = v.bijgewerkt;
  return { v };
}
// titelvorm afleiden als de chat hem niet opgeeft: grove soorten, zodat lessen per soort kunnen
export function haakVan(t, vorm) {
  const s = String(t || '').toLowerCase().replace(/#\w+/g, '').trim();
  if (/\b\d+\s+(questions|vragen|questions avec|fragen|preguntas)\b/.test(s)) return 'n-vragen';
  if (/can you answer|weet jij|sauriez|kannst du|could you pass|would you pass/.test(s)) return 'uitdaging';
  if (/\?\s*$/.test(s)) return 'vraag';
  if (/^(how|why|what|hoe|waarom|wat)\b/.test(s)) return 'uitleg';
  if (/\b(top|best|beste)\s*\d*/.test(s)) return 'lijst';
  return vorm === 'long' ? 'lang-overig' : 'overig';
}
export async function video(id) { return kv.get('vm:v:' + id).catch(() => null); }
export async function zet(b) {
  if (!b || typeof b !== 'object') return { ok: false, fout: 'JSON met id, project, platform, ...' };
  const id = kort(b.id || b.utm_content, 61); const oud = ID.test(id) ? (await video(id)) || {} : {};
  if (oud.project && b.project && oud.project !== String(b.project).toLowerCase()) return { ok: false, fout: 'id ' + id + ' is al van project ' + oud.project + '; kies een uniek id (bijv. ' + String(b.project).toLowerCase() + '-' + id + ')' };
  const r = schoonVideo(b, oud); if (r.fout) return { ok: false, fout: r.fout, id };
  await kv.set('vm:v:' + r.v.id, r.v); await kv.raw(['SADD', 'vm:lijst', r.v.id]);
  return { ok: true, id: r.v.id, nieuw: !oud.id, link: r.v.link || '', clickmind: r.v.net + '|' + r.v.utm_content };
}
export async function zetVeel(lijst) { const uit = { ok: true, gezet: 0, nieuw: 0, fouten: [] }; for (const b of (Array.isArray(lijst) ? lijst : []).slice(0, 200)) { const r = await zet(b); if (r.ok) { uit.gezet++; if (r.nieuw) uit.nieuw++; } else uit.fouten.push(r); } return uit; }
export async function alleIds() { return ((await kv.raw(['SMEMBERS', 'vm:lijst']).catch(() => [])) || []).sort(); }
export async function alleVideos() { const ids = await alleIds(); if (!ids.length) return []; const l = []; for (let i = 0; i < ids.length; i += 100) l.push(...(await kv.mget(...ids.slice(i, i + 100).map(x => 'vm:v:' + x)))); return l.filter(Boolean); }

// eenmalig: de bestaande video's van een project (lib/videomind-seed.js). Bestaande regels blijven staan; alleen lege velden worden aangevuld.
export async function seed(project = 'mylevel') {
  const S = await import('./videomind-seed.js'); const l = project === 'mylevel' ? S.SEED_MYLEVEL : [];
  const uit = { ok: true, project, aangeboden: l.length, nieuw: 0, aangevuld: 0, fouten: [] };
  for (const b of l) { const oud = await video(b.id); const extra = {}; for (const [k, x] of Object.entries(b)) if (!oud || oud[k] == null || oud[k] === '') extra[k] = x;
    if (oud && Object.keys(extra).length === 0) continue; const r = await zet(Object.assign({ id: b.id, project: b.project, platform: b.platform }, extra, extra.haak != null ? { haakHand: false } : {})); if (!r.ok) uit.fouten.push(r); else if (r.nieuw) uit.nieuw++; else uit.aangevuld++; }
  return uit;
}

// ---------- metingen ----------
const METVELDEN = ['weergaven', 'likes', 'reacties', 'delen', 'bewaard', 'kijkduur', 'uitkijk', 'kliks', 'mens', 'aanmelding', 'koop', 'omzet', 'volgers'];
export async function meting(b, bron = 'post') {
  const id = kort(b && b.id, 61); if (!ID.test(id)) return { ok: false, fout: 'id ontbreekt' };
  const v = await video(id); if (!v) return { ok: false, fout: 'video ' + id + ' staat niet in het register: eerst op=zet' };
  const m = { t: b.t && Number.isFinite(Date.parse(b.t)) ? new Date(Date.parse(b.t)).toISOString() : new Date().toISOString(), bron: kort(b.bron || bron, 30) };
  let n = 0; for (const k of METVELDEN) if (b[k] != null && Number.isFinite(Number(b[k]))) { m[k] = Number(b[k]); n++; }
  if (!n) return { ok: false, fout: 'geen getal; velden: ' + METVELDEN.join(', ') };
  await kv.raw(['RPUSH', 'vm:m:' + id, JSON.stringify(m)]); await kv.raw(['LTRIM', 'vm:m:' + id, '-120', '-1']);
  await mijlpaal(v, m); return { ok: true, id, meting: m };
}
export async function metingen(id, n = 120) { return ((await kv.raw(['LRANGE', 'vm:m:' + id, String(-n), '-1']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); }
// weergaven na 48 uur en na 7 dagen vastleggen: de eerste meting met weergaven na dat moment (hooguit 36 uur later, anders te scheef)
async function mijlpaal(v, m) {
  if (!v.at || m.weergaven == null) return; const leeftijd = Date.parse(m.t) - Date.parse(v.at); let veranderd = false;
  for (const [k, ms, marge] of [['m48', 48 * UUR, 12 * UUR], ['m7', 7 * DAG, 30 * UUR]]) if (!v[k] && leeftijd >= ms && leeftijd <= ms + marge) { v[k] = { weergaven: m.weergaven, uur: Math.round(leeftijd / UUR), t: m.t }; veranderd = true; }
  if (veranderd) await kv.set('vm:v:' + v.id, v);
}

// ---------- Zernio (server-side, gedeelde team-variabele ZERNIO_API_KEY) ----------
const ZK = () => process.env.ZERNIO_API_KEY || process.env.ZERNIO_KEY || '';
async function zGet(pad) {
  const r = await fetch('https://zernio.com/api/v1' + pad, { headers: { authorization: 'Bearer ' + ZK() }, signal: AbortSignal.timeout(15000) });
  return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
}
export function uitZernio(j) {
  const a = (j && j.analytics) || {}; const p = ((j && j.platformAnalytics) || [])[0] || {};
  return { weergaven: N(a.views), likes: N(a.likes), reacties: N(a.comments), delen: N(a.shares), bewaard: N(a.saves), kijkduur: N(a.igReelsAvgWatchTime) || undefined, uitkijk: N(a.completionRate) || undefined,
    lengte: N(a.videoDurationSeconds) || undefined, url: (j && j.platformPostUrl) || a.platformPostUrl || p.platformPostUrl || '', extern: p.platformPostId || '', status: (j && j.status) || '' };
}
// titel en link uit de post zelf als het register ze nog niet heeft
async function zernioPost(v) {
  const r = await zGet('/posts/' + encodeURIComponent(v.zid)); if (!r.ok) return {}; const p = r.j.post || r.j.data || r.j;
  const pl = (p.platforms || [])[0] || {}; const ps = pl.platformSpecificData || {};
  const titel = p.title || ps.title || ''; const link = (String(p.content || '').match(/https:\/\/[^\s]+utm_content=[^\s&]+[^\s]*/) || [''])[0];
  return { titel, link };
}
// wanneer opnieuw meten: jong vaak, oud zelden
const interval = leeftijd => (leeftijd < 3 * DAG ? 5 * UUR : leeftijd < 14 * DAG ? 20 * UUR : 6.5 * DAG);

// ---------- Clickmind: bezoeken en uitkomsten per video (net = utm_source, zone = utm_content) ----------
const dagen = (vanaf, n) => { const l = []; for (let i = 0; i < n; i++) { const d = dagUTC(Date.now() - i * DAG); if (d < vanaf) break; l.push(d); } return l; };
async function clickmindSync(vs) {
  const uit = { videos: vs.length, bezoeken: 0, mens: 0, uitkomsten: 0 }; if (!vs.length) return uit;
  const zk = v => v.net + '|' + (v.utm_content || v.id);
  // bezoeken (mm:z, 14 dagen bewaard): elke ronde de dagen opnieuw, de som over alle dagen blijft in vm:ck staan
  for (const d of dagen('2026-11-01', 14)) {
    const vel = []; for (const v of vs) if (!v.at || d >= dagUTC(Date.parse(v.at))) vel.push(v); if (!vel.length) continue;
    const r = await kv.raw(['HMGET', 'mm:z:' + d, ...vel.flatMap(v => [zk(v) + '|n', zk(v) + '|mens'])]).catch(() => null); if (!r) continue;
    for (let i = 0; i < vel.length; i++) { const n = N(r[2 * i]), m = N(r[2 * i + 1]); if (n || m) { await kv.raw(['HSET', 'vm:ck:' + vel[i].id, d, n + ',' + m]); uit.bezoeken += n; uit.mens += m; } }
  }
  // uitkomsten (mm:zu, 60 dagen; alleen kliks met een klik-id via /go of /w)
  for (const d of dagen('2026-11-01', 30)) {
    const vel = vs.filter(v => !v.at || d >= dagUTC(Date.parse(v.at))); if (!vel.length) continue;
    const r = await kv.raw(['HMGET', 'mm:zu:' + d, ...vel.flatMap(v => [zk(v) + '|aanmelding', zk(v) + '|koop', zk(v) + '|actie'])]).catch(() => null); if (!r) continue;
    for (let i = 0; i < vel.length; i++) { const a = N(r[3 * i]), k = N(r[3 * i + 1]), x = N(r[3 * i + 2]); if (a || k || x) { await kv.raw(['HSET', 'vm:cu:' + vel[i].id, d, a + ',' + k + ',' + x]); uit.uitkomsten += a + k; } }
  }
  return uit;
}
async function perDag(k) { const h = (await kv.raw(['HGETALL', k]).catch(() => [])) || []; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[h[i]] = String(h[i + 1]).split(',').map(N); return o; }

// ---------- de ronde (cron elke 6 uur: /api/videomind?op=ronde) ----------
export async function ronde({ max = 40, droog = false } = {}) {
  const t0 = Date.now(), vs = await alleVideos(), uit = { ok: true, videos: vs.length, zernio: { gemeten: 0, wacht: 0, fout: 0, aangevuld: 0 }, clickmind: null };
  if (!ZK()) uit.zernio.geenSleutel = 'ZERNIO_API_KEY ontbreekt in Vercel: Zernio-cijfers alleen via op=meting';
  else {
    const kans = []; for (const v of vs) { if (!v.zid || !v.at || Date.parse(v.at) > Date.now()) continue; const leeftijd = Date.now() - Date.parse(v.at); const l = await metingen(v.id, 1); const laatst = l.length ? Date.parse(l[0].t) : 0; if (Date.now() - laatst >= interval(leeftijd)) kans.push({ v, laatst }); }
    kans.sort((a, b) => a.laatst - b.laatst); uit.zernio.teDoen = kans.length;
    for (const { v } of kans.slice(0, max)) {
      if (droog || Date.now() - t0 > 200e3) break;
      try {
        const r = await zGet('/analytics?postId=' + encodeURIComponent(v.zid));
        if (r.status === 202) { uit.zernio.wacht++; continue; } if (!r.ok) { uit.zernio.fout++; continue; }
        const z = uitZernio(r.j); const m = { bron: 'zernio' }; for (const k of ['weergaven', 'likes', 'reacties', 'delen', 'bewaard', 'kijkduur', 'uitkijk']) if (z[k] != null) m[k] = z[k];
        await meting(Object.assign({ id: v.id }, m), 'zernio'); uit.zernio.gemeten++;
        const extra = {}; if (z.url && !v.url) extra.url = z.url; if (z.extern && !v.extern) extra.extern = z.extern; if (z.lengte && !v.lengte) extra.lengte = z.lengte;
        // de titel in Zernio is de echte titel (het register kan een oudere versie hebben): één keer ophalen; haak opnieuw afleiden tenzij een chat hem zelf gaf
        if (!v.titelZ || !v.link) { const p = await zernioPost(v).catch(() => ({})); if (p.titel) { extra.titelZ = true; if (p.titel !== v.titel) extra.titel = p.titel; } if (p.link && !v.link) extra.link = p.link; }
        if (Object.keys(extra).length) { const nu = (await video(v.id)) || v; const t = extra.titel || nu.titel; if (t && (!nu.haak || (extra.titelZ && !nu.haakHand))) extra.haak = haakVan(t, nu.vorm); await kv.set('vm:v:' + v.id, Object.assign(nu, extra)); uit.zernio.aangevuld++; }
      } catch (e) { uit.zernio.fout++; }
    }
  }
  if (!droog) { uit.clickmind = await clickmindSync(vs).catch(e => ({ fout: String(e.message).slice(0, 80) })); const s = await samenvatting(); await kv.set('vm:sam', s).catch(() => {}); uit.week = s.week; uit.besteLes = s.besteLes; }
  await kv.set('vm:laatste', { at: new Date().toISOString(), ...uit }).catch(() => {});
  return uit;
}

// ---------- stand per video ----------
export async function standVideo(v) {
  const l = await metingen(v.id), ck = await perDag('vm:ck:' + v.id), cu = await perDag('vm:cu:' + v.id);
  const laatste = {}; for (const m of l) for (const k of METVELDEN) if (m[k] != null) laatste[k] = m[k];
  let bezoeken = 0, mens = 0, bezoeken7 = 0, mens7 = 0, aanmelding = 0, koop = 0; const grens = dagUTC(Date.now() - 6 * DAG);
  for (const [d, [n, m]] of Object.entries(ck)) { bezoeken += N(n); mens += N(m); if (d >= grens) { bezoeken7 += N(n); mens7 += N(m); } }
  for (const [, [a, k]] of Object.entries(cu)) { aanmelding += N(a); koop += N(k); }
  const w = N(laatste.weergaven); const zw = l.filter(m => m.weergaven != null);
  const oud7 = zw.filter(m => Date.parse(m.t) <= Date.now() - 7 * DAG).pop();
  const groei7 = v.at && Date.parse(v.at) >= Date.now() - 7 * DAG ? w : oud7 ? Math.max(0, w - N(oud7.weergaven)) : null;
  const eigenKoop = N(laatste.koop), eigenMens = N(laatste.mens);
  return { id: v.id, project: v.project, platform: v.platform, vorm: v.vorm, haak: v.haak || '', titel: v.titel || '', onderwerp: v.onderwerp || '', trend: v.trend || '', at: v.at || '', url: v.url || '', link: v.link || '', lengte: v.lengte || null,
    geplaatst: !!(v.at && Date.parse(v.at) <= Date.now()), weergaven: w, likes: N(laatste.likes), reacties: N(laatste.reacties), kijkduur: laatste.kijkduur || null, uitkijk: laatste.uitkijk || null,
    m48: v.m48 && N(v.m48.uur) <= 60 ? v.m48.weergaven : null, m7: v.m7 && N(v.m7.uur) <= 7 * 24 + 30 ? v.m7.weergaven : null, groei7, metingen: l.length, laatsteMeting: l.length ? l[l.length - 1].t : '',
    bezoeken, mens: Math.max(mens, eigenMens), bezoeken7, mens7, aanmelding, koop: Math.max(koop, eigenKoop), omzet: N(laatste.omzet),
    perDuizend: w >= 100 ? { bezoeken: Math.round(10000 * bezoeken / w) / 10, mens: Math.round(10000 * Math.max(mens, eigenMens) / w) / 10 } : null };
}
export async function stand({ project = '', id = '' } = {}) {
  let vs = await alleVideos(); if (project) vs = vs.filter(v => v.project === project); if (id) vs = vs.filter(v => v.id === id);
  const rijen = []; for (const v of vs) rijen.push(await standVideo(v));
  rijen.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const tot = rijen.reduce((t, r) => { t.videos++; if (r.geplaatst) t.geplaatst++; t.weergaven += r.weergaven; t.bezoeken += r.bezoeken; t.mens += r.mens; t.koop += r.koop; t.aanmelding += r.aanmelding; return t; }, { videos: 0, geplaatst: 0, weergaven: 0, bezoeken: 0, mens: 0, koop: 0, aanmelding: 0 });
  return { ok: true, naam: 'Videomind', project: project || 'alle', totaal: tot, perProject: groepTot(rijen, 'project'), videos: rijen, lessen: await lessen({ project, rijen }), laatsteRonde: await kv.get('vm:laatste').catch(() => null) };
}
function groepTot(rijen, k) { const o = {}; for (const r of rijen) { const g = o[r[k]] || (o[r[k]] = { videos: 0, weergaven: 0, bezoeken: 0, mens: 0, koop: 0 }); g.videos++; g.weergaven += r.weergaven; g.bezoeken += r.bezoeken; g.mens += r.mens; g.koop += r.koop; } return o; }

// ---------- lessen ----------
const NL = n => String(Math.round(N(n) * 10) / 10).replace('.', ',');
const mediaan = l => { const s = l.slice().sort((a, b) => a - b), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
const lengteBak = s => (!s ? '' : s <= 20 ? 'tot 20 s' : s <= 60 ? '21-60 s' : s <= 180 ? '1-3 min' : s <= 600 ? '3-10 min' : 'langer dan 10 min');
const uurBak = at => { if (!at) return ''; const h = new Date(at).getUTCHours(); const b = Math.floor(h / 3) * 3; return String(b).padStart(2, '0') + '-' + String(b + 3).padStart(2, '0') + ' UTC'; };
const DIMENSIES = [['haak', r => r.haak, 'titelvorm'], ['vorm', r => r.vorm, 'vorm'], ['lengte', r => lengteBak(r.lengte), 'lengte'], ['uur', r => uurBak(r.at), 'uur van plaatsen'], ['onderwerp', r => r.onderwerp, 'onderwerp'], ['trend', r => r.trend ? 'volgt een trend' : 'eigen idee', 'trend gevolgd']];
// Eerlijk vergelijken: weergaven na 48 uur als die er zijn (minstens 3 per kant); anders de stand nu van video's die minstens 48 uur staan, met die waarschuwing erbij.
export function afleiden(rijen, minN = 3) {
  const uit = []; const groepen = {};
  for (const r of rijen.filter(x => x.geplaatst)) { const g = r.platform + '/' + r.project; (groepen[g] = groepen[g] || []).push(r); }
  for (const [g, l] of Object.entries(groepen)) {
    const met48 = l.filter(r => r.m48 != null); const oud = l.filter(r => r.at && Date.now() - Date.parse(r.at) >= 48 * UUR);
    const basis = met48.length >= 2 * minN ? { l: met48, w: r => r.m48, maat: 'mediaan weergaven na 48 uur' } : { l: oud, w: r => r.weergaven, maat: 'mediaan weergaven nu (video\'s van ongelijke leeftijd, 48 uur-meting nog te dun)' };
    for (const [dim, f, naam] of DIMENSIES) {
      const per = {}; for (const r of basis.l) { const k = f(r); if (k) (per[k] = per[k] || []).push(r); }
      const ks = Object.entries(per).filter(([, x]) => x.length >= minN); if (ks.length < 2) continue;
      const cijfers = ks.map(([k, x]) => { const w = x.reduce((t, r) => t + r.weergaven, 0), b = x.reduce((t, r) => t + r.bezoeken, 0), m = x.reduce((t, r) => t + r.mens, 0);
        return { waarde: k, n: x.length, mediaan: mediaan(x.map(basis.w)), bezoekenPer1000: w ? Math.round(10000 * b / w) / 10 : 0, mensPer1000: w ? Math.round(10000 * m / w) / 10 : 0, koop: x.reduce((t, r) => t + r.koop, 0) }; })
        .sort((a, b) => b.mediaan - a.mediaan);
      const best = cijfers[0], twee = cijfers[1]; const factor = twee.mediaan ? Math.round(10 * best.mediaan / twee.mediaan) / 10 : null;
      uit.push({ groep: g, dimensie: dim, maat: basis.maat, cijfers, factor,
        les: g + ', ' + naam + ': ' + cijfers.map(c => '"' + c.waarde + '" ' + NL(c.mediaan) + ' (n=' + c.n + ', ' + NL(c.bezoekenPer1000) + ' bezoeken en ' + NL(c.mensPer1000) + ' echte mensen per 1.000 weergaven' + (c.koop ? ', ' + c.koop + (c.koop === 1 ? ' verkoop' : ' verkopen') : '') + ')').join(' tegen ') + '; ' + basis.maat + '.' });
    }
  }
  return uit.sort((a, b) => N(b.factor) - N(a.factor));
}
export async function handLessen() { return ((await kv.raw(['LRANGE', 'vm:l', '0', '99']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); }
export async function les(b) {
  const t = kort(b && (b.les || b.tekst), 600); if (t.length < 15) return { ok: false, fout: 'les: één zin met het getal erbij (minstens 15 tekens)' };
  const r = { t: new Date().toISOString(), les: t, project: kort(b.project, 30).toLowerCase(), platform: kort(b.platform, 20).toLowerCase(), bron: kort(b.bron, 200), wie: kort(b.wie || 'chat', 60), videos: kort(b.videos, 300) };
  await kv.raw(['LPUSH', 'vm:l', JSON.stringify(r)]); await kv.raw(['LTRIM', 'vm:l', '0', '199']); return { ok: true, les: r };
}
export async function lessen({ project = '', platform = '', rijen = null } = {}) {
  if (!rijen) { let vs = await alleVideos(); if (project) vs = vs.filter(v => v.project === project); rijen = []; for (const v of vs) rijen.push(await standVideo(v)); }
  if (platform) rijen = rijen.filter(r => r.platform === platform);
  const hand = (await handLessen()).filter(l => (!project || !l.project || l.project === project) && (!platform || !l.platform || l.platform === platform));
  return { automatisch: afleiden(rijen), hand };
}

// ---------- samenvatting (dashboard) ----------
export async function samenvatting() {
  const s = await stand(); const wk = Date.now() - 7 * DAG;
  const week = { geplaatst: s.videos.filter(r => r.geplaatst && Date.parse(r.at) >= wk).length, gepland: s.videos.filter(r => !r.geplaatst).length,
    weergaven: s.videos.reduce((t, r) => t + N(r.groei7), 0), bezoeken: s.videos.reduce((t, r) => t + r.bezoeken7, 0), mens: s.videos.reduce((t, r) => t + r.mens7, 0) };
  const a = s.lessen.automatisch[0]; const h = s.lessen.hand[0];
  return { t: new Date().toISOString(), totaal: s.totaal, week, perProject: s.perProject, besteLes: a ? a.les : h ? h.les : '', handLes: h ? h.les : '', top: s.videos.filter(r => r.geplaatst).sort((x, y) => y.weergaven - x.weergaven).slice(0, 3).map(r => r.id + ' (' + r.project + ', ' + r.weergaven + ' weergaven, ' + r.bezoeken + ' bezoeken)') };
}
export async function dashBlok() {
  let s = await kv.get('vm:sam').catch(() => null); if (!s || Date.now() - Date.parse(s.t) > 8 * UUR) { s = await samenvatting().catch(() => null); if (s) await kv.set('vm:sam', s).catch(() => {}); }
  if (!s) return null;
  const regels = ['Deze week: ' + s.week.geplaatst + ' video\'s geplaatst (' + s.week.gepland + ' ingepland), ' + s.week.weergaven + ' weergaven erbij, ' + s.week.bezoeken + ' bezoeken via video, ' + s.week.mens + ' echte mensen.',
    'Totaal: ' + s.totaal.videos + ' video\'s in het register, ' + s.totaal.weergaven + ' weergaven, ' + s.totaal.bezoeken + ' bezoeken, ' + s.totaal.mens + ' echte mensen, ' + s.totaal.koop + ' verkopen.',
    'Per project: ' + Object.entries(s.perProject).map(([p, x]) => p + ' ' + x.videos + (x.videos === 1 ? ' video, ' : ' video\'s, ') + x.weergaven + ' weergaven, ' + x.bezoeken + ' bezoeken').join('; ') + '.'];
  if (s.besteLes) regels.push('Beste les: ' + s.besteLes); else regels.push('Beste les: nog geen (vanaf 3 video\'s per kant).');
  if (s.top.length) regels.push('Meeste weergaven: ' + s.top.join(', ') + '.');
  return { nu: s.week.mens, regels, ontvangen: s.t };
}

// ---------- tekst voor mensen en chats ----------
const tijd = t => (t ? String(t).slice(0, 16).replace('T', ' ') + ' UTC' : '');
export function tekst(s) {
  const r = ['VIDEOMIND, ' + tijd(new Date().toISOString()) + '. Register en leergeheugen voor elke video van elk project. Bron: ' + HOST + '/api/videomind', '',
    'Skill (lees vóór elke video): ' + HOST + '/api/videomind?op=skill', '',
    'TOTAAL (' + s.project + '): ' + s.totaal.videos + ' video\'s, ' + s.totaal.geplaatst + ' geplaatst, ' + s.totaal.weergaven + ' weergaven, ' + s.totaal.bezoeken + ' bezoeken via de link, ' + s.totaal.mens + ' echte mensen, ' + s.totaal.aanmelding + ' aanmeldingen, ' + s.totaal.koop + ' verkopen.'];
  for (const [p, x] of Object.entries(s.perProject)) r.push('- ' + p + ': ' + x.videos + ' video\'s, ' + x.weergaven + ' weergaven, ' + x.bezoeken + ' bezoeken, ' + x.mens + ' echte mensen, ' + x.koop + ' verkopen');
  r.push('', 'LESSEN (automatisch uit de cijfers, sterkste verschil eerst)'); if (!s.lessen.automatisch.length) r.push('- nog geen: een les telt vanaf 3 geplaatste video\'s per kant');
  for (const l of s.lessen.automatisch.slice(0, 12)) r.push('- ' + l.les);
  if (s.lessen.hand.length) { r.push('', 'LESSEN MET DE HAND'); for (const l of s.lessen.hand.slice(0, 15)) r.push('- ' + tijd(l.t).slice(0, 10) + (l.project ? ' [' + l.project + (l.platform ? '/' + l.platform : '') + ']' : '') + ' ' + l.les + (l.bron ? ' (' + l.bron + ')' : '')); }
  r.push('', 'VIDEO\'S (nieuwste eerst): id | project/platform | vorm, haak | geplaatst | weergaven (48 u, 7 d) | bezoeken, echte mensen | titel');
  for (const v of s.videos.slice(0, 80)) r.push('- ' + v.id + ' | ' + v.project + '/' + v.platform + ' | ' + v.vorm + ', ' + (v.haak || '-') + ' | ' + (v.at ? (v.geplaatst ? '' : 'gepland ') + tijd(v.at) : 'geen tijd') + ' | ' + v.weergaven + (v.m48 != null || v.m7 != null ? ' (' + (v.m48 != null ? v.m48 : '-') + ', ' + (v.m7 != null ? v.m7 : '-') + ')' : '') + ' | ' + v.bezoeken + ', ' + v.mens + (v.koop ? ', ' + v.koop + ' verkopen' : '') + ' | ' + (v.titel || '(titel volgt uit Zernio)'));
  const lr = s.laatsteRonde; r.push('', 'Laatste ronde: ' + (lr ? tijd(lr.at) + ', Zernio ' + N(lr.zernio && lr.zernio.gemeten) + ' gemeten' + (lr.zernio && lr.zernio.geenSleutel ? ' (' + lr.zernio.geenSleutel + ')' : '') + ', Clickmind ' + N(lr.clickmind && lr.clickmind.bezoeken) + ' bezoeken' : 'nog niet gedraaid') + '. Cron elke 6 uur (:19).');
  r.push('', 'Schrijven (beschermde host, of POST met de gedeelde team-sleutel in x-hjdk-token):',
    '- video registreren: ' + HOST + '/api/videomind?op=zet&json={"id":"<project>-<onderwerp>-<n>","project":"<id>","platform":"youtube","vorm":"short","titel":"...","onderwerp":"...","pagina":"/...","zid":"<Zernio-id>","at":"2026-12-01T14:00:00Z","link":"https://...?utm_source=youtube&utm_medium=shorts&utm_content=<id>"}',
    '- meting van het project zelf: ' + HOST + '/api/videomind?op=meting&json={"id":"<id>","koop":1,"omzet":49,"bron":"paddle"}',
    '- les met de hand: ' + HOST + '/api/videomind?op=les&les=<zin met getal>&project=<id>&platform=<platform>&bron=<waar het getal vandaan komt>');
  return r.join('\n') + '\n';
}
export function lessenTekst(L) {
  const r = ['VIDEOMIND LESSEN, ' + tijd(new Date().toISOString()), ''];
  if (!L.automatisch.length) r.push('Automatisch: nog geen (vanaf 3 geplaatste video\'s per kant).');
  for (const l of L.automatisch) r.push('- ' + l.les);
  r.push('', 'Met de hand:'); if (!L.hand.length) r.push('- nog geen');
  for (const l of L.hand) r.push('- ' + tijd(l.t).slice(0, 10) + (l.project ? ' [' + l.project + (l.platform ? '/' + l.platform : '') + ']' : '') + ' ' + l.les + (l.bron ? ' (' + l.bron + ')' : ''));
  return r.join('\n') + '\n';
}

// ---------- trends: eerst kijken wat op dat platform extreem goed loopt (Henkjan 27 nov 2026) ----------
// "Organische vids gaan we naar 3 per dag doen . Zorg dat ze briljant zijn . 3 per dag op 4 platformen en kijk met video mind -bouw dat in -
// eerst altijd naar wat er op dat platform extreem goed loopt ." Voor een project video's maakt, legt het per platform vast wat daar nu
// extreem goed loopt in zijn soort (vorm, haak, eerste seconde, lengte, geluid), met het voorbeeld, het getal en de bron. Elke video noemt in
// `trend` welke trend hij volgt; de lessen vergelijken 'volgt een trend' met 'eigen idee'. Een scan is 7 dagen geldig, daarna eerst opnieuw kijken.
// Opslag vm:t (laatste 400). Velden: platform, project, niche, wat, haak, voorbeeld (https), maat (bijv. "2,1 mln weergaven in 5 dagen"), bron, at.
export const TREND_DAGEN = 7;
export async function trendZet(b) {
  const l = Array.isArray(b) ? b : Array.isArray(b && b.trends) ? b.trends : [b]; const uit = { ok: true, gezet: 0, fouten: [] };
  for (const x of l) {
    const platform = kort(x && x.platform, 20).toLowerCase(); const wat = kort(x && x.wat, 300); const maat = kort(x && x.maat, 120); const bron = kort(x && x.bron, 200); const voorbeeld = kort(x && x.voorbeeld, 400);
    if (!PLATFORMS.includes(platform)) { uit.fouten.push('platform: ' + PLATFORMS.join(', ')); continue; }
    if (wat.length < 10 || !maat || !bron) { uit.fouten.push('wat (wat loopt er, minstens 10 tekens), maat (het getal) en bron zijn verplicht'); continue; }
    if (voorbeeld && !/^https:\/\//.test(voorbeeld)) { uit.fouten.push('voorbeeld moet met https:// beginnen'); continue; }
    const r = { at: new Date().toISOString(), platform, project: kort(x.project, 30).toLowerCase(), niche: kort(x.niche, 60), wat, haak: kort(x.haak, 40), voorbeeld, maat, bron, wie: kort(x.wie || 'chat', 60) };
    await kv.raw(['LPUSH', 'vm:t', JSON.stringify(r)]); uit.gezet++;
  }
  await kv.raw(['LTRIM', 'vm:t', '0', '399']).catch(() => {}); if (!uit.gezet) uit.ok = false; return uit;
}
export async function trends({ platform = '', project = '', dagen = TREND_DAGEN } = {}) {
  const grens = Date.now() - dagen * DAG;
  const l = ((await kv.raw(['LRANGE', 'vm:t', '0', '399']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean)
    .filter(t => Date.parse(t.at) >= grens && (!platform || t.platform === platform) && (!project || !t.project || t.project === project));
  const per = {}; for (const t of l) (per[t.platform] = per[t.platform] || []).push(t);
  const ontbreekt = ['tiktok', 'instagram', 'youtube', 'pinterest'].filter(p => (!platform || p === platform) && !per[p]);
  return { dagen, trends: l, perPlatform: per, ontbreekt, oordeel: ontbreekt.length ? 'eerst kijken: geen trendscan van de laatste ' + dagen + ' dagen voor ' + ontbreekt.join(', ') : 'trendscan actueel' };
}
export function trendTekst(T) {
  const r = ['TRENDS: wat nu extreem goed loopt per platform (laatste ' + T.dagen + ' dagen)', T.oordeel, ''];
  for (const [p, l] of Object.entries(T.perPlatform)) { r.push(p.toUpperCase()); for (const t of l.slice(0, 8)) r.push('- ' + t.at.slice(0, 10) + (t.niche ? ' [' + t.niche + ']' : '') + ' ' + t.wat + ' | ' + t.maat + (t.haak ? ' | haak ' + t.haak : '') + (t.voorbeeld ? ' | ' + t.voorbeeld : '') + ' | bron ' + t.bron); r.push(''); }
  return r.join('\n');
}
