// Alleen geaggregeerde WAM-cijfers uit het bestaande Clickmind-register. Geen tweede bezoektracker.
import { kv } from './db.js';
import { aanmeldStand, lokaleDag } from './wam-aanmelden.js';
const HALF_UUR = 30 * 60000;
const leeg = () => ({ organisch: 0, ai: 0, betaald: 0, campagneOnbekend: 0, verwijzing: 0, directOnbekend: 0, internOnbekend: 0 });
function host(s) { try { return new URL(/^https?:/i.test(s) ? s : 'https://' + String(s || '')).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; } }
export const isWam = r => r?.ty === 'p' && host(r.pg) === 'wearemany.now';
export function kanaal(r) {
  // Een herkenbare advertentieparameter gaat altijd voor een zoekmachine-referrer.
  if (/^(propeller|propellerads|mondiad|richads|mgid|clickadu|tiktok|tt|meta|facebook|fb|google-ads|googleads|bing-ads|bingads|adsterra|popads)$/i.test(r.net || '')) return 'betaald';
  if (r.camp && r.camp !== '-') return 'campagneOnbekend';
  const h = host(r.ref);
  if (h === 'wearemany.now') return 'internOnbekend';
  if (/(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/.test(h)) return 'ai';
  if (/^google\.(com|nl|be|de|fr|co\.uk|com\.br|com\.cw)$/.test(h) || /(^|\.)(bing\.com|duckduckgo\.com|search\.yahoo\.com|search\.brave\.com|ecosia\.org|startpage\.com)$/.test(h)) return 'organisch';
  return h ? 'verwijzing' : 'directOnbekend';
}
const bot = r => !!(r.dc || r.vlag?.hl || r.vlag?.em || Number(r.c?.wd) === 1 || /bot|spider|crawler|headless/i.test(r.ua || ''));
export function vatBezoekenSamen(rijen, dag) {
  // Eén vid heeft twee mensmeterbeacons. Voeg die eerst samen; pageviews worden anders dubbel geteld.
  const views = new Map();
  for (const r of rijen) if (isWam(r) && r.vid && Number.isFinite(Number(r.t))) {
    const oud = views.get(r.vid);
    if (!oud) views.set(r.vid, { ...r, t: Number(r.t), bot: bot(r), mens: !!r.mens });
    else { oud.t = Math.min(oud.t, Number(r.t)); oud.mens ||= !!r.mens; oud.bot ||= bot(r); }
  }
  const per = leeg(), mens = leeg(), sessies = new Map(), paginas = new Map();
  let paginaWeergaven = 0, botWeergaven = 0, nietKoppelbaar = 0, bezoeken = 0;
  for (const r of [...views.values()].sort((a,b) => a.t - b.t)) {
    if (lokaleDag(r.t) === dag) { if (r.bot) botWeergaven++; else { paginaWeergaven++; paginas.set(String(r.pg).split('?')[0], (paginas.get(String(r.pg).split('?')[0]) || 0) + 1); } }
    if (r.bot) continue;
    // Fingerprint als hij er is, anders één gemeten pagina als afzonderlijk bezoek. Geen IP-adressen groeperen.
    const id = /^[a-f0-9]{16}$/.test(r.fp || '') ? r.fp : r.vid, oud = sessies.get(id);
    let sessie = oud;
    if (!oud || r.t - oud.laatst > HALF_UUR) {
      const bron = kanaal(r), telt = lokaleDag(r.t) === dag;
      sessie = { laatst: r.t, bron, telt, mens: false }; sessies.set(id, sessie);
      if (telt) { bezoeken++; per[bron]++; if (id === r.vid) nietKoppelbaar++; }
    }
    sessie.laatst = r.t;
    if (r.mens && !sessie.mens) { sessie.mens = true; if (sessie.telt) mens[sessie.bron]++; }
  }
  return { bezoeken, perKanaal: per, mensBevestigd: mens, paginaWeergaven, botWeergaven, nietKoppelbaar, paginas: [...paginas].sort((a,b) => b[1]-a[1]).map(([pad,weergaven]) => ({pad,weergaven})) };
}
export async function groeiStand(keus, db = kv) {
  const gisteren = lokaleDag(Date.now() - 86400000), d = /^\d{4}-\d{2}-\d{2}$/.test(String(keus || '')) ? keus : gisteren;
  const begin = Date.parse(d + 'T04:00:00Z');
  if (!Number.isFinite(begin) || lokaleDag(begin) !== d || begin > Date.now() || Date.now() - begin > 29 * 86400000) return { ok: false, fout: 'Kies een datum binnen de laatste 29 dagen.' };
  const cache = 'wmn:groei:v1:' + d, bestaand = await db.get(cache).catch(() => null);
  if (bestaand) return { ...bestaand, uitCache: true };
  const { leesRuwBereik, blobKlaar } = await import('./ruwarchief.js');
  const rijen = [], dekking = [], start = Date.now();
  for (const utc of [d, new Date(begin + 86400000).toISOString().slice(0,10)]) {
    let van = 0, totaal = null, volledig = true;
    for (let ronde=0; ronde<20; ronde++) {
      const r = await leesRuwBereik(db, 'rawp', utc, van, 5000); totaal = Number(r.totaal);
      for (const x of r.rijen || []) { let j; try { j = typeof x === 'string' ? JSON.parse(x) : x; } catch { continue; } if (isWam(j) && j.t >= begin - HALF_UUR && j.t < begin + 86400000) rijen.push(j); }
      van += (r.rijen || []).length;
      if (van >= totaal) break;
      if (!(r.rijen || []).length || Date.now()-start > 38000 || ronde === 19) { volledig = false; break; }
    }
    dekking.push({ utcDag: utc, gelezen: van, totaal, volledig });
  }
  const st = vatBezoekenSamen(rijen, d), aanmeldingen = await aanmeldStand(d, db).catch(() => null);
  const meetVolledigVanaf = '2026-11-25'; // de oude cm.js-stand mat vooral bezoeken met campagneparameters
  const volledig = dekking.every(d => d.volledig) && blobKlaar() && d >= meetVolledigVanaf;
  const r = { ok: true, dag: d, tijdzone: 'America/Curacao', gemetenOp: new Date().toISOString(), doel: { perDag: 1000, datum: '2026-12-31', metric: 'organische bezoeken' }, volledig, dekking, archiefBeschikbaar: blobKlaar(), meetVolledigVanaf, ...st, aanmeldingen,
    organischeAanmeldratio: null,
    definitie: 'Clickmind-bezoeken: beacons per vid samengevoegd, herkenbare bots uitgesloten, maximaal 30 minuten inactiviteit per browserfingerprint. Zonder fingerprint is een pagina een afzonderlijk gemeten bezoek. Kanaal van de eerste pagina blijft binnen dat bezoek behouden.',
    beperking: 'Volledige dagen met organische landingen zijn pas vanaf 25 november 2026 beschikbaar. Voor die datum is organisch bezoek onbekend, omdat de oude scriptstand vooral campagneparameters mat. Alleen browsers die Clickmind laden. Geen serverbrede bezoekmeting of GSC-klikken. Bij ontbrekend archief of afgebroken export zijn cijfers onvolledig. Nieuwe bezoekers via een interne link blijven intern/onbekend als de eerdere landing niet gemeten is. Aanmeldratio per verkeerskanaal is nog niet betrouwbaar gekoppeld.',
    voortgang: volledig ? { organisch: st.perKanaal.organisch, percentage: st.perKanaal.organisch / 10, resterend: Math.max(0,1000-st.perKanaal.organisch) } : null };
  if (volledig && d < lokaleDag(Date.now())) await db.set(cache, r, { ex: 3600 });
  return r;
}

// Herstel van de lezersteller (Henkjan 26 nov 2026: "Zet er dan nu views bij die je inschat niet te hebben en geleverd door jouw fout"):
// van 24 november tot de reparatie om 17:06 UTC op 26 november faalde het baken op=dbekeken. Clickmind mat in die tijd wel elke WAM-pagina,
// met dezelfde regel (echt mens = 8 s zichtbaar plus een actie). Dit telt per UTC-dag en per dossier de unieke echte lezers (fingerprint, anders
// vid), zonder bots, en alleen beacons van voor de reparatie. Geen schatting: alleen gemeten bezoekers.
export const HERSTEL_TOT = Date.parse('2026-11-26T17:06:00Z');
const dossierUit = pg => (/^\/(?:(?:en|de|it)\/)?dossier\/([a-z0-9-]+)\/?$/.exec((() => { try { return new URL('https://' + String(pg).replace(/^https?:\/\//, '')).pathname; } catch { return ''; } })()) || [])[1] || '';
export function herstelTelling(rijen, tot = HERSTEL_TOT) {
  const per = new Map();
  for (const r of rijen) {
    if (!isWam(r) || !r.mens || bot(r) || !(Number(r.t) < tot)) continue;
    const id = dossierUit(r.pg); if (!id) continue;
    const wie = /^[a-f0-9]{16}$/.test(r.fp || '') ? r.fp : r.vid; if (!wie) continue;
    const dag = new Date(Number(r.t)).toISOString().slice(0, 10), k = dag + '|' + id;
    if (!per.has(k)) per.set(k, new Set()); per.get(k).add(wie);
  }
  const uit = {}; for (const [k, s] of per) { const [dag, id] = k.split('|'); (uit[dag] ||= {})[id] = s.size; } return uit;
}
export async function herstelLezers(utc, schrijf, db = kv) {
  if (!/^2026-11-2[4-6]$/.test(String(utc || ''))) return { ok: false, fout: 'Alleen 2026-11-24 tot en met 2026-11-26.' };
  const { leesRuwBereik } = await import('./ruwarchief.js');
  const rijen = [], start = Date.now(); let van = 0, totaal = 0, volledig = true;
  for (let ronde = 0; ronde < 40; ronde++) {
    const r = await leesRuwBereik(db, 'rawp', utc, van, 5000); totaal = Number(r.totaal);
    for (const x of r.rijen || []) { let j; try { j = typeof x === 'string' ? JSON.parse(x) : x; } catch { continue; } if (isWam(j)) rijen.push(j); }
    van += (r.rijen || []).length;
    if (van >= totaal) break;
    if (!(r.rijen || []).length || Date.now() - start > 45000) { volledig = false; break; }
  }
  const telling = herstelTelling(rijen)[utc] || {};
  if (!volledig) return { ok: false, utc, gelezen: van, totaal, telling, fout: 'Archief niet helemaal gelezen; niets geschreven.' };
  if (!schrijf) return { ok: true, droog: true, utc, gelezen: van, totaal, telling };
  const nieuw = await db.raw(['SET', 'wmn:mensherstel:' + utc, JSON.stringify(telling), 'NX']).catch(() => null);
  if (!nieuw) return { ok: true, al: true, utc, telling: JSON.parse(await db.raw(['GET', 'wmn:mensherstel:' + utc]).catch(() => '{}') || '{}') };
  for (const [id, n] of Object.entries(telling)) {
    await db.raw(['HINCRBY', 'wmn:mens', id, n]).catch(() => {});
    if (utc === new Date().toISOString().slice(0, 10)) await db.raw(['HINCRBY', 'wmn:mens:' + utc, id, n]).catch(() => {});
  }
  return { ok: true, geschreven: true, utc, gelezen: van, totaal, telling };
}
