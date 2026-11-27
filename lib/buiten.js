// Data van buiten voor ieder merk en project (Henkjan 26 nov 2026: "Ja data van buiten voor ieder merk en project niet alleen vr nexy natuurlijk.").
// Clickmind leert van eigen uitkomsten (kliks, mensen, likes). Dit legt er per project de vraag van buiten naast, één keer per dag:
//  - vraag: de Demand Radar-thema's van het project (Google-zoekvolume per markt en per onderwerp, met groei per jaar);
//  - stijgers en dalers: termen met veel volume die hard groeien of krimpen (waar nieuwe content heen moet, wat je laat liggen);
//  - klachten: recente reviews met 1 of 2 sterren van concurrerende apps (openbare App Store-feed, VS of het land van het project): de beste haken voor posts en video's.
// Geen nieuwe sleutels en geen eigen inkoop: de radar ververst zijn thema's zelf hoogstens eens per week binnen zijn eigen dagrem.
// Lezen: /api/mm?op=buiten (alle projecten) of /api/mm?op=buiten&project=<id>. diststand toont per project de stijgers en klachten naast wat werkte.
import { kv } from './db.js';

const DR = () => process.env.DEMANDRADAR_URL || 'https://demandradar-ivory.vercel.app';

// project → Demand Radar-thema's (ids uit demand_radar api/zoekvraag.js THEMA) en concurrerende apps (App Store-zoekterm)
export const PROJECTEN = {
  nexy: { naam: 'Nexy', themas: ['nexy-now', 'ai-keuze'], apps: ['Google Voice', 'Otter Transcribe Voice Notes', 'Cozi Family Organizer', 'GroupMe'] },
  // Kadoly (27 nov 2026, taak hdg2ux: op=buiten gaf 0 klachten, want er stonden geen apps): grote winkels voor cadeaus, sieraden en wonen, Nederlandse App Store (land: 'nl').
  kadoly: { naam: 'Kadoly', themas: ['kadoly-cadeau', 'kadoly-wonen', 'kadoly-hobby', 'kadoly-print', 'kadoly-samen', 'kadoly-sparen', 'hanglamp', 'meubels', 'sieraden', 'spiritueel', 'wellness'], land: 'nl', apps: ['bol', 'Wehkamp', 'fonQ', 'HEMA', 'IKEA', 'Etsy'] },
  keuzehulpen: { naam: 'Keuzehulpen (keuzehulp, whichtobuy, kaufberater)', themas: ['zorgverzekering', 'verzekeringen', 'batterij', 'energie', 'huiskopen', 'advocaat', 'kaufberater-dienste', 'lokaal-us'] },
  tk: { naam: 'Tania Kross', themas: ['taniakross', 'muziek-medicijn'] },
  curacao: { naam: 'Curaçao (curacao.day, gids)', themas: ['curacao', 'korsou-reizen', 'curacao-kerkdiensten', 'curacao-gokvergunning'] },
  wam: { naam: 'We Are Many', themas: ['machteloos', 'wam-avg', 'wam-us', 'wam-gb', 'wam-ca', 'wam-de'] },
  sealed: { naam: 'SealedIntent', themas: ['bedrijf-verkopen', 'executives', 'stille-intenties'] },
  chirurgie: { naam: 'Keuzehulp chirurgie', themas: ['plastische-chirurgie'] },
  kdp: { naam: 'KDP-boeken en Bookstuffers', themas: ['kdp-boeken', 'fear-boek', 'bookstuffers', 'jaar-reset'] },
  youandai: { naam: 'You and AI', themas: ['ai-en-jij', 'ai-en-jij-nl'] },
  goonfree: { naam: 'GoonFree', themas: [], apps: ['QUITTR quit porn', 'Fortify quit porn', 'Brainbuddy'] },
  mylevel: { naam: 'MyLevel', themas: [], apps: ['DMV Genie permit test', 'ASVAB practice test'] }
};
// namen die andere systemen gebruiken (distlus-projecten, merken van clickmind-distribution) → één project
const ALIAS = { taniakross: 'tk', keuzehulp: 'keuzehulpen', whichtobuy: 'keuzehulpen', kaufberater: 'keuzehulpen', nexyplatform: 'nexy', todayin: 'curacao', bookstuffers: 'kdp' };
export const projectId = p => { p = String(p || '').toLowerCase(); return PROJECTEN[p] ? p : ALIAS[p] || p; };

const kort = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
async function json(url, ms) { try { const r = await fetch(url, { signal: AbortSignal.timeout(ms || 20000) }); return r.ok ? await r.json() : null; } catch (e) { return null; } }

async function thema(id) {
  const j = await json(DR() + '/api/zoekvraag?thema=' + encodeURIComponent(id), 60000);
  if (!j || !j.markten) return { id, fout: (j && j.error) || 'geen antwoord' };
  const termen = [];
  for (const [cc, m] of Object.entries(j.markten)) for (const t of m.top || []) termen.push({ cc, k: t.k, v: t.v || 0, y: t.y != null ? Number(t.y) : null, o: t.o || '-' });
  const onderwerpen = Object.entries(j.onderwerpen || {}).slice(0, 8).map(([o, x]) => ({ o, v: x.v, top: (x.top || []).slice(0, 3).map(t => t.cc + ' ' + t.k + ' ' + t.v) }));
  return { id, naam: j.naam, bijgewerkt: j.bijgewerkt, ontbrekend: j.ontbrekendeMarkten || [], onderwerpen, termen };
}

// land = App Store-land (twee letters, standaard us); per project in PROJECTEN.<id>.land
export const klachtUrls = (term, land = 'us', id = '') => { const cc = /^[a-z]{2}$/.test(String(land)) ? land : 'us'; return { zoek: `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&limit=1&country=${cc}`, feed: `https://itunes.apple.com/${cc}/rss/customerreviews/id=${id}/sortby=mostrecent/json` }; };
async function klachten(term, land) {
  const z = await json(klachtUrls(term, land).zoek, 10000);
  const app = z && (z.results || [])[0]; if (!app) return { term, app: null, klachten: [] };
  const f = await json(klachtUrls(term, land, app.trackId).feed, 10000);
  const items = ((f && f.feed && f.feed.entry) || []).filter(e => e && e['im:rating']);
  return { term, app: app.trackName, ster: app.averageUserRating ? Math.round(app.averageUserRating * 10) / 10 : null, reviews: app.userRatingCount || 0,
    klachten: items.map(e => ({ ster: Number(e['im:rating'].label), titel: kort(e.title && e.title.label, 90), tekst: kort(e.content && e.content.label, 220) })).filter(x => x.ster <= 2).slice(0, 6) };
}

async function inPlukjes(lijst, n, f) { const uit = []; for (let i = 0; i < lijst.length; i += n) uit.push(...await Promise.all(lijst.slice(i, i + n).map(f))); return uit; }

export async function projectRonde(pid) {
  const P = PROJECTEN[pid]; if (!P) return { project: pid, fout: 'onbekend project' };
  const th = await inPlukjes(P.themas || [], 4, thema);
  const alle = th.flatMap(t => (t.termen || []).map(x => ({ ...x, thema: t.id })));
  const stijgers = alle.filter(x => x.y != null && x.y >= 40 && x.v >= 100).sort((a, b) => b.v * Math.min(b.y, 500) - a.v * Math.min(a.y, 500)).slice(0, 12).map(x => ({ cc: x.cc, k: x.k, v: x.v, groei: x.y + '%', onderwerp: x.o, thema: x.thema }));
  const dalers = alle.filter(x => x.y != null && x.y <= -30 && x.v >= 100).sort((a, b) => b.v - a.v).slice(0, 6).map(x => ({ cc: x.cc, k: x.k, v: x.v, groei: x.y + '%', thema: x.thema }));
  const vraag = {}; for (const x of alle) vraag[x.cc] = (vraag[x.cc] || 0) + x.v;
  const apps = await inPlukjes(P.apps || [], 3, t => klachten(t, P.land));
  const r = { project: pid, naam: P.naam, dag: new Date().toISOString().slice(0, 10), t: new Date().toISOString(),
    vraag_per_markt: vraag, stijgers, dalers,
    themas: th.map(t => ({ id: t.id, naam: t.naam, bijgewerkt: t.bijgewerkt, fout: t.fout, ontbrekende_markten: t.ontbrekend, onderwerpen: t.onderwerpen })),
    concurrenten: apps.filter(a => a.app).map(a => ({ app: a.app, ster: a.ster, reviews: a.reviews, klachten: a.klachten })),
    haken: apps.flatMap(a => a.klachten.slice(0, 2).map(k => a.app + ': ' + k.titel)).slice(0, 8) };
  await kv.set('buiten:' + pid, r, { ex: 8 * 86400 }).catch(() => {});
  return r;
}

// dagronde: elk project hoogstens één keer per dag (kv buiten:dag:<project>)
export async function ronde({ forceer = false, alleen = '' } = {}) {
  const dag = new Date().toISOString().slice(0, 10), log = [];
  for (const pid of Object.keys(PROJECTEN)) {
    if (alleen && pid !== alleen) continue;
    if (!forceer && (await kv.get('buiten:dag:' + pid).catch(() => null)) === dag) { log.push(pid + ': vandaag al'); continue; }
    const r = await projectRonde(pid).catch(e => ({ fout: String(e && e.message || e).slice(0, 200) }));
    if (!r.fout) await kv.set('buiten:dag:' + pid, dag, { ex: 2 * 86400 }).catch(() => {});
    log.push(pid + ': ' + (r.fout || ((r.stijgers || []).length + ' stijgers, ' + (r.concurrenten || []).reduce((s, a) => s + a.klachten.length, 0) + ' klachten')));
  }
  return { ok: true, dag, log };
}

export async function stand(project) {
  if (project) { const pid = projectId(project); return (await kv.get('buiten:' + pid).catch(() => null)) || { project: pid, fout: PROJECTEN[pid] ? 'nog geen ronde' : 'onbekend project', projecten: Object.keys(PROJECTEN) }; }
  const uit = {};
  for (const pid of Object.keys(PROJECTEN)) { const r = await kv.get('buiten:' + pid).catch(() => null); uit[pid] = r ? { dag: r.dag, vraag_per_markt: r.vraag_per_markt, stijgers: r.stijgers.slice(0, 3), haken: r.haken.slice(0, 2) } : null; }
  return { uitleg: 'Data van buiten per project: zoekvraag en stijgers uit Demand Radar, klachten over concurrerende apps uit de App Store. Per project: ?op=buiten&project=<id>.', projecten: uit };
}
