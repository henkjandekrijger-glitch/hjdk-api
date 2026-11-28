// Trendkennis en voorstellen van Clickmind (Henkjan 27 nov 2026: "Maak inderdaad voor ieder platform alles native EN check er altijd bij wat
// op dat moment goed werkt en maak daar altijd een alternatief mee . Dus trending of mega op dat plaform die kennis gebruik je ." en bij de
// Kadoly-advertenties met een prijs: "Ok test" en "Ja geen prijzen als dat beter is").
//
// TREND = wat op dit moment groot is op een platform: een vorm, geluid, onderwerp of haak, met de bron waar het staat. Niets verzinnen: een
//   trend zonder bron wordt geweigerd. Een chat of ronde zoekt het op (eigen tokens, webzoeken) en meldt het met op=trend. De kennis is 3 dagen
//   vers ("op dat moment") en vervalt na 14 dagen. De briefing (lib/paspoort.js) toont hem bij elk medium; is hij oud of leeg, dan zegt de
//   briefing dat je eerst moet zoeken en melden. De dagronde zet zelf een taak in Henkjans lijst als een platform dat gebruikt wordt geen
//   verse trendkennis heeft (hoogstens één open taak tegelijk).
// VOORSTEL = nieuwe stukken die Henkjan eerst moet zien (advertentieteksten, een proef): oud naast nieuw op één link (/voorstel). Niets gaat
//   live zonder zijn ja. Een nieuwe advertentietekst met een prijs of levertijd wordt geweigerd (vaste regel).
//   LIVE-CHECK (27 nov 2026, les uit het voorstel kadoly-zonder-prijs: gemaakt uit de cijfers van gisteren, terwijl 5 van de 6 campagnes
//   die ochtend al uit stonden en de prijsadvertentie in de zesde ook): bij een advertentievoorstel kijkt zetVoorstel per campagne of hij
//   vandaag loopt (kosten vandaag in de budgetwacht van propellerads-mcp via lib/campstand.js) en of de oude advertentie nog loopt (geheugen,
//   laatste dag met vertoningen). Loopt geen enkele campagne, dan wordt het voorstel geweigerd; loopt een deel niet, dan staat dat bij het stuk.
//   Een voorstel dat niet meer kan, sluit je met besluit=vervallen en een notitie.
//
// VIDEOMIND heeft sinds 27 nov 2026 een eigen trendscan voor video (lib/videomind.js trendZet en trends, opslag vm:t, 7 dagen geldig, met het
//   getal erbij). Dat blijft de plek voor video: een trend voor tiktok of youtube, of een trend met soort 'video', met een getal (maat) gaat
//   daarheen, en leesTrend leest beide, zodat de briefing van Clickmind alles op één plek toont en er geen tweede lijst naast ontstaat.
//
// Opslag (Redis): ps:trend:<medium> { medium, items: [{ id, wat, vorm, voorbeeld, maat, bron, t, wie }] }, ps:trendtaak (slot voor de taak),
// ps:vs:<id> voorstel, ps:vsix (zset id op tijd).
import { randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { MEDIA, mediumId, projectId, regelCheck, N } from './paspoort.js';

const HOST = 'https://hjdk-api-henq.vercel.app', DAG = 864e5;
export const VERS_DAGEN = 3, VERVAL_DAGEN = 14;
const kort = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rid = () => randomBytes(4).toString('hex');

// ---------- trend ----------
// b: { medium, wie, items: [{ wat, vorm, voorbeeld, bron }] } of één trend direct: { medium, wat, vorm, voorbeeld, bron }
export async function zetTrend(b = {}) {
  const medium = mediumId(b.medium); if (!medium) return { ok: false, fout: 'medium: ' + Object.keys(MEDIA).join(', ') };
  const inv = Array.isArray(b.items) ? b.items : [b], nieuw = [], geweigerd = []; let naarVideomind = 0;
  const VM = await import('./videomind.js').catch(() => null);
  for (const x of inv.slice(0, 12)) {
    const wat = kort(x && x.wat, 260), bron = kort(x && x.bron, 300);
    if (wat.length < 12) { geweigerd.push('wat ontbreekt of is te kort'); continue; }
    if (!/^https:\/\/[^\s]+\.[^\s]+/.test(bron)) { geweigerd.push(kort(wat, 40) + ': bron moet een https-adres zijn waar het staat (niets verzinnen)'); continue; }
    const maat = kort(x.maat, 120), vb = kort(x.voorbeeld, 300);
    if (maat && VM && VM.PLATFORMS.includes(medium) && (medium === 'tiktok' || medium === 'youtube' || x.soort === 'video')) { // een videotrend met een getal: de trendscan van Videomind is de plek
      const r = await VM.trendZet({ platform: medium, project: kort(b.project || x.project, 30), niche: kort(x.niche, 60), wat: [wat, kort(x.vorm, 200)].filter(Boolean).join(' Zo gebruik je het: ').slice(0, 300), haak: kort(x.haak, 40), voorbeeld: /^https:\/\//.test(vb) ? vb : '', maat, bron, wie: kort(b.wie || x.wie || 'clickmind', 60) });
      if (r.ok) naarVideomind++; else geweigerd.push(kort(wat, 40) + ': ' + (r.fouten || []).join('; ')); continue; }
    nieuw.push({ id: rid(), wat, vorm: kort(x.vorm, 260), voorbeeld: vb, maat, bron, t: new Date().toISOString(), wie: kort(b.wie || x.wie, 40) });
  }
  if (!nieuw.length && naarVideomind) return { ok: true, medium, erbij: 0, videomind: naarVideomind, geweigerd: geweigerd.length ? geweigerd : undefined };
  if (!nieuw.length) return { ok: false, fout: 'geen geldige trend: {"medium":"x","items":[{"wat":"wat nu groot is","vorm":"hoe je het native gebruikt","voorbeeld":"...","bron":"https://..."}]}', geweigerd };
  const oud = (await kv.get('ps:trend:' + medium).catch(() => null)) || { items: [] }, grens = Date.now() - VERVAL_DAGEN * DAG;
  const norm = t => String(t).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 60), al = new Set(nieuw.map(x => norm(x.wat)));
  const items = [...nieuw, ...(oud.items || []).filter(x => Date.parse(x.t) > grens && !al.has(norm(x.wat)))].slice(0, 24);
  await kv.set('ps:trend:' + medium, { medium, items }, { ex: 60 * 86400 });
  return { ok: true, medium, erbij: nieuw.length, totaal: items.length, videomind: naarVideomind || undefined, geweigerd: geweigerd.length ? geweigerd : undefined, ids: nieuw.map(x => x.id) };
}
export async function leesTrend(medium, nu = Date.now()) {
  medium = mediumId(medium); const d = medium ? await kv.get('ps:trend:' + medium).catch(() => null) : null;
  const items = ((d && d.items) || []).filter(x => nu - Date.parse(x.t) < VERVAL_DAGEN * DAG).map(x => ({ ...x, versTot: Date.parse(x.t) + VERS_DAGEN * DAG }));
  try { const VM = await import('./videomind.js'); if (VM.PLATFORMS.includes(medium)) for (const t of (await VM.trends({ platform: medium, dagen: VERVAL_DAGEN })).trends || []) // de trendscan van Videomind (7 dagen geldig)
    items.push({ id: 'vm', wat: t.wat + (t.niche ? ' (' + t.niche + ')' : ''), vorm: t.haak ? 'haak ' + t.haak : '', voorbeeld: t.voorbeeld || '', maat: t.maat || '', bron: t.bron, t: t.at, wie: t.wie || 'videomind', versTot: Date.parse(t.at) + VM.TREND_DAGEN * DAG }); } catch (e) {}
  items.sort((a, b) => b.t.localeCompare(a.t));
  return { medium, items: items.slice(0, 8), laatst: items.length ? items[0].t : '', vers: items.some(x => nu < x.versTot) };
}
export async function alleTrends(media = null) {
  if (!media) { media = Object.keys(MEDIA).filter(m => !MEDIA[m].betaald && !['mail', 'site', 'anders'].includes(m)); for (const m of ['meta', 'tiktok-ads']) if ((await leesTrend(m)).items.length) media.push(m); } // betaalde media alleen zodra er items staan (advertentiebibliotheken, lib/adbieb.js)
  const uit = {}; for (const m of media) { const t = await leesTrend(m); uit[m] = { vers: t.vers, laatst: t.laatst, aantal: t.items.length, items: t.items.slice(0, 3).map(x => ({ wat: x.wat, maat: x.maat || undefined, bron: x.bron, t: x.t })) }; }
  return uit;
}
// de dagronde: gebruikt een platform geen verse trendkennis, zet dan één taak in de lijst (een oppakker zoekt het op en meldt het)
export async function trendTaak(mediaInGebruik = []) {
  const oud = []; for (const m of mediaInGebruik) { const t = await leesTrend(m); if (!t.vers) oud.push(m); }
  if (!oud.length) return { ok: true, oud: [] };
  if (!(await kv.raw(['SET', 'ps:trendtaak', '1', 'NX', 'EX', String(20 * 3600)]).catch(() => null))) return { ok: true, oud, taak: 'vandaag al gezet' };
  try {
    const T = await import('./taken.js'), open = ((await T.leesTaken(kv)).taken || []).some(x => /^Trendcheck voor Clickmind/.test(x.tekst || '') && ['wacht', 'bezig', 'jij'].includes(x.status));
    if (open) return { ok: true, oud, taak: 'staat al open' };
    const r = await T.zetTaken(kv, { taak: { tekst: 'Trendcheck voor Clickmind: zoek op wat deze week groot is op ' + oud.map(m => MEDIA[m].naam).join(', ') + ' (vormen, geluiden, onderwerpen, haken; per platform minstens 2 bronnen van deze week, niets verzinnen) en meld het per platform met ' + HOST + '/api/mm?op=trend&j={"medium":"<platform>","wie":"trendcheck","items":[{"wat":"...","vorm":"hoe je het native gebruikt","voorbeeld":"...","bron":"https://..."}]}. Klaar als ' + HOST + '/api/mm?op=trend&vorm=tekst bij elk platform vers zegt.', project: 'clickmind', zwaarte: 'gewoon' } }, 'clickmind-geheugen');
    return { ok: true, oud, taak: r.taak || null };
  } catch (e) { return { ok: false, oud, fout: String(e.message || e).slice(0, 100) }; }
}
export async function trendTekst() {
  const A = await alleTrends(), L = ['WAT NU GROOT IS PER PLATFORM (trendkennis van Clickmind; vers = nagekeken in de laatste ' + VERS_DAGEN + ' dagen)', ''];
  for (const [m, t] of Object.entries(A)) { L.push(MEDIA[m].naam + ': ' + (t.vers ? 'vers' : t.aantal ? 'OUD' : 'LEEG') + (t.laatst ? ' (' + t.laatst.slice(0, 10) + ')' : '')); for (const x of t.items) L.push('- ' + x.wat + (x.maat ? ' | ' + x.maat : '') + ' [' + x.bron + ']'); }
  L.push('', 'Melden: ' + HOST + '/api/mm?op=trend&j={"medium":"<platform>","wie":"<chat>","items":[{"wat":"...","vorm":"...","voorbeeld":"...","maat":"het getal dat laat zien dat het groot is","bron":"https://..."}]}', 'Een videotrend (tiktok, youtube, of "soort":"video") met een getal gaat vanzelf naar de trendscan van Videomind: ' + HOST + '/api/videomind?op=trend');
  return L.join('\n');
}

// ---------- voorstel: nieuwe stukken die Henkjan eerst ziet ----------
// b: { id?, titel, project, medium, uitleg, kosten, meten, stop, items: [{ campagne, campagneNaam, oudId, oudTitel, oudTekst, titel, tekst, cta, variant, waarom, nieuw }] } (nieuw: true = advertentie van een nieuwe campagne, telt niet als 'loopt niet')
export async function zetVoorstel(b = {}) {
  const medium = mediumId(b.medium), project = projectId(b.project); if (!medium || !project || !kort(b.titel, 120)) return { ok: false, fout: 'voorstel: {"titel":"...","project":"...","medium":"...","uitleg":"...","items":[{"campagne":"<id>","campagneNaam":"...","oudId":"...","oudTitel":"...","oudTekst":"...","titel":"...","tekst":"...","cta":"...","variant":"native|trend","waarom":"..."}]}' };
  const id = /^[a-z0-9-]{4,40}$/.test(String(b.id || '')) ? b.id : 'v' + rid(), oud = await kv.get('ps:vs:' + id).catch(() => null), items = [], geweigerd = [];
  for (const x of (Array.isArray(b.items) ? b.items : []).slice(0, 120)) {
    const it = { campagne: kort(x.campagne, 30), campagneNaam: kort(x.campagneNaam, 120), oudId: kort(x.oudId, 90), oudTitel: kort(x.oudTitel, 200), oudTekst: kort(x.oudTekst, 400), titel: kort(x.titel, 200), tekst: kort(x.tekst, 400), cta: kort(x.cta, 60), variant: x.variant === 'trend' ? 'trend' : 'native', waarom: kort(x.waarom, 200), loopt: x.loopt === false ? false : x.loopt === true ? true : null, nieuw: !!x.nieuw };
    if (!it.titel && !it.tekst) { geweigerd.push('leeg stuk'); continue; }
    const rc = regelCheck({ betaald: !!MEDIA[medium].betaald, inhoud: { titel: it.titel, tekst: it.tekst } });
    if (rc.length) { geweigerd.push(kort(it.titel, 50) + ': ' + rc.join(', ')); continue; }
    items.push(it);
  }
  if (!items.length) return { ok: false, fout: 'geen geldige stukken in het voorstel', geweigerd };
  const live = MEDIA[medium].betaald ? await liveCheck(items, b.nu) : null;
  if (live && live.bekend && !items.some(x => x.loopt !== false)) return { ok: false, fout: 'geen van deze campagnes loopt vandaag (' + [...new Set(items.map(x => x.campagne))].join(', ') + '). Kijk de live stand na voor je Henkjan iets vraagt.', live };
  const v = { id, t: (oud && oud.t) || new Date().toISOString(), bij: new Date().toISOString(), titel: kort(b.titel, 120), project, medium, uitleg: kort(b.uitleg, 700), kosten: kort(b.kosten, 200), meten: kort(b.meten, 300), stop: kort(b.stop, 300), wie: kort(b.wie, 40), items, status: (oud && oud.status) || 'wacht', besluit: (oud && oud.besluit) || null };
  await kv.set('ps:vs:' + id, v, { ex: 120 * 86400 }); await kv.raw(['ZADD', 'ps:vsix', String(Date.parse(v.t)), id]).catch(() => {});
  const loopt = items.filter(x => x.loopt === false).length;
  return { ok: true, id, stukken: items.length, geweigerd: geweigerd.length ? geweigerd : undefined, let: loopt ? loopt + ' stukken staan in een campagne die vandaag niet loopt of naast een advertentie die al uit staat' : undefined, link: HOST + '/voorstel?id=' + id };
}
// Loopt de campagne vandaag (kosten in de budgetwacht) en loopt de oude advertentie nog (geheugen: laatste dag met vertoningen)?
// bekend = false als de budgetwacht niet te lezen is: dan geen oordeel en geen weigering.
async function liveCheck(items, nu = Date.now()) {
  let lopend = null; try { const C = await import('./campstand.js'); const c = await C.campStand(kv, null, nu); if (c && c.projecten) { lopend = new Set(); for (const p of Object.values(c.projecten)) for (const x of p.campagnes || []) if (x.kosten > 0) lopend.add(String(x.cid)); } } catch (e) {}
  const grens = new Date(nu - 2 * DAG).toISOString().slice(0, 10);
  for (const x of items) {
    if (x.nieuw) { x.loopt = null; continue; } // nieuwe campagne (27 nov): loopt nog niet en hoeft dat ook niet
    const st = x.oudId ? await kv.get('ps:s:' + x.oudId).catch(() => null) : null, oudUit = !!(st && st.laatst && st.laatst < grens);
    x.loopt = lopend ? lopend.has(String(x.campagne)) && !oudUit : oudUit ? false : null;
    if (x.loopt === false) x.waarom = [x.waarom, lopend && !lopend.has(String(x.campagne)) ? 'campagne loopt vandaag niet' : 'de oude advertentie draait niet meer'].filter(Boolean).join('; ');
  }
  return { bekend: !!lopend, lopend: lopend ? lopend.size : null };
}
export const leesVoorstel = id => kv.get('ps:vs:' + String(id || '').replace(/[^a-z0-9-]/g, '')).catch(() => null);
export async function voorstellen(n = 20) {
  const ids = (await kv.raw(['ZREVRANGE', 'ps:vsix', '0', String(n - 1)]).catch(() => [])) || []; if (!ids.length) return [];
  return (await kv.mget(...ids.map(i => 'ps:vs:' + i))).filter(Boolean);
}
// status: wacht (op Henkjans ja), ja, nee, geplaatst. Alleen een chat of ronde die zijn ja heeft gekregen zet ja of geplaatst.
export async function besluitVoorstel(id, status, { wie = '', notitie = '' } = {}) {
  const v = await leesVoorstel(id); if (!v) return { ok: false, fout: 'onbekend voorstel' };
  if (!['wacht', 'ja', 'nee', 'geplaatst', 'vervallen'].includes(status)) return { ok: false, fout: 'besluit=wacht|ja|nee|geplaatst|vervallen' };
  if (status === 'geplaatst' && v.status !== 'ja' && v.status !== 'geplaatst') return { ok: false, fout: 'plaatsen kan alleen na Henkjans ja (besluit=ja)' };
  v.status = status; v.besluit = { t: new Date().toISOString(), wie: kort(wie, 40), notitie: kort(notitie, 300) };
  await kv.set('ps:vs:' + v.id, v, { ex: 120 * 86400 }); return { ok: true, id: v.id, status };
}
const STATUS_NAAM = { wacht: 'Wacht op jouw ja', ja: 'Akkoord, wordt geplaatst', nee: 'Afgewezen', geplaatst: 'Geplaatst', vervallen: 'Vervallen' };
export function voorstelTekst(v) {
  const L = ['VOORSTEL ' + v.titel + ' (' + v.project + ', ' + MEDIA[v.medium].naam + '): ' + STATUS_NAAM[v.status] + (v.besluit && v.besluit.notitie ? '. ' + v.besluit.notitie : ''), v.uitleg, v.kosten ? 'Kosten: ' + v.kosten : '', v.meten ? 'Zo meten we: ' + v.meten : '', v.stop ? 'Stoppen bij: ' + v.stop : '', ''].filter(x => x !== '');
  let camp = ''; for (const x of v.items) { if (x.campagneNaam !== camp) { camp = x.campagneNaam; L.push('', camp + (x.campagne ? ' (' + x.campagne + ')' : '')); }
    L.push('- NU: ' + [x.oudTitel, x.oudTekst].filter(Boolean).join(' / '), '  NIEUW' + (x.variant === 'trend' ? ' (trend)' : '') + (x.loopt === false ? ' (LOOPT NIET)' : '') + ': ' + [x.titel, x.tekst].filter(Boolean).join(' / ') + (x.cta ? ' [' + x.cta + ']' : '') + (x.waarom ? ' | ' + x.waarom : '')); }
  return L.join('\n');
}
export function voorstelHtml(v, CSS, lijst = []) {
  const kop = t => '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><title>' + esc(t) + '</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"><style>' + CSS + '</style></head><body><div class="w"><header><a class="merk" href="/dashboard">Dashboard</a><span class="meta">Voorstel</span></header>';
  const r = (l, i) => '<div class="r"><b>' + l + '</b><span>' + i + '</span></div>';
  if (!v) return kop('Voorstellen') + '<section class="tool"><h1>Voorstellen</h1><p>Nieuwe stukken die je eerst ziet. Niets gaat live zonder jouw ja.</p></section><section><div class="lijst">' + lijst.map(x => r(esc(STATUS_NAAM[x.status] || x.status), '<a href="/voorstel?id=' + esc(x.id) + '">' + esc(x.titel) + '</a><br>' + esc(x.project + ' · ' + MEDIA[x.medium].naam + ' · ' + x.items.length + ' stukken · ' + x.t.slice(0, 10)))).join('') + '</div></section><footer><p><a href="/geheugen">Geheugen</a></p></footer></div></body></html>';
  const groepen = []; for (const x of v.items) { let g = groepen.find(y => y.naam === x.campagneNaam); if (!g) groepen.push(g = { naam: x.campagneNaam, id: x.campagne, items: [] }); g.items.push(x); }
  return kop(v.titel) + '<section class="tool"><h1>' + esc(v.titel) + '</h1><p><b>' + esc(STATUS_NAAM[v.status] || v.status) + '.</b> ' + (v.besluit && v.besluit.notitie ? esc(v.besluit.notitie) + '</p><p>' : '') + esc(v.uitleg) + '</p>'
    + (v.kosten ? '<p>Kosten: ' + esc(v.kosten) + '</p>' : '') + (v.meten ? '<p>Zo meten we: ' + esc(v.meten) + '</p>' : '') + (v.stop ? '<p>Stoppen bij: ' + esc(v.stop) + '</p>' : '') + '</section>'
    + groepen.map(g => '<section><h2>' + esc(g.naam || 'Stukken') + '</h2><div class="lijst">' + g.items.map(x => r(x.loopt === false ? 'Loopt niet' : x.variant === 'trend' ? 'Trend' : 'Nieuw', '<b>' + esc(x.titel) + '</b>' + (x.tekst ? '<br>' + esc(x.tekst) : '') + (x.cta ? '<br>Knop: ' + esc(x.cta) : '') + (x.oudTitel || x.oudTekst ? '<br><br>Nu: ' + esc([x.oudTitel, x.oudTekst].filter(Boolean).join(' / ')) : '') + (x.waarom ? '<br>' + esc(x.waarom) : ''))).join('') + '</div></section>').join('')
    + '<footer><p>' + v.items.length + ' stukken. Gemaakt ' + esc(v.t.slice(0, 16).replace('T', ' ')) + ' UTC. Zeg ja of nee in de chat. <a href="/voorstel">Alle voorstellen</a> · <a href="/voorstel?id=' + esc(v.id) + '&vorm=tekst">als tekst</a></p></footer></div></body></html>';
}
