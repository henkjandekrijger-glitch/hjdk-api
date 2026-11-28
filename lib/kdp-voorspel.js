// KDP forecast and learning. Henkjan 28 Nov 2026: predict first, then learn what moves royalty.
// Account exports stay in protected Redis, never in the public source repository. No paid AI or ad mutations.
import { gunzipSync } from 'node:zlib';
const DAY = 864e5;
const PREFIX = 'kdp:voorspel:';
const money = n => Math.round(n * 100) / 100;
const mean = a => a.length ? a.reduce((s, n) => s + n, 0) / a.length : null;
const quantile = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const validNumber = n => typeof n === 'number' && Number.isFinite(n);
const validDay = s => { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false; const d = new Date(s + 'T00:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s; };
const str = (s, n = 300) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
export const localDay = (now = Date.now()) => new Date(now - 4 * 36e5).toISOString().slice(0, 10);
const shift = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
const wd = d => new Date(d + 'T00:00:00Z').getUTCDay();
const usd = n => n == null ? 'onbekend' : '$' + Number(n).toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function unpackHash(h) { const entries = Array.isArray(h) ? Array.from({ length: h.length / 2 }, (_, i) => [h[2 * i], h[2 * i + 1]]) : Object.entries(h || {}); return entries.flatMap(([, v]) => { try { return [typeof v === 'string' ? JSON.parse(v) : v]; } catch { return []; } }); }
const readHash = async (kv, name) => unpackHash(await kv.raw(['HGETALL', PREFIX + name]));
async function hset(kv, name, id, value) { await kv.raw(['HSET', PREFIX + name, id, JSON.stringify(value)]); }

// Validate the whole batch before writing. Absence is not zero; source timestamp is mandatory.
export async function zetKdpData(kv, input, now = Date.now()) {
  if (!input || typeof input !== 'object') return { ok: false, fout: 'kdpdata ontbreekt' };
  if (input.gzip) { try { if (typeof input.gzip !== 'string' || input.gzip.length > 30000) throw new Error('omvang'); input = JSON.parse(gunzipSync(Buffer.from(input.gzip, 'base64url'), { maxOutputLength: 1024 * 1024 }).toString('utf8')); } catch { return { ok: false, fout: 'ongeldige of te grote gzip-invoer' }; } }
  const collections = ['dagen', 'maanden', 'ads', 'adsdagen', 'kostendagen']; const validated = [];
  for (const name of collections) {
    const rows = input[name] ?? []; if (!Array.isArray(rows) || rows.length > 100) return { ok: false, fout: name + ': maximaal 100 rijen' };
    for (const row of rows) {
      if (!row || !row.bron || !row.gezien || !Number.isFinite(Date.parse(row.gezien)) || Date.parse(row.gezien) > now + 60e3) return { ok: false, fout: 'bron en een geldig waarnemingstijdstip vereist' };
      if (row.munt != null && row.munt !== 'USD') return { ok: false, fout: 'omrekenen en bron vastleggen: invoer is uitsluitend USD' };
      let id;
      if (name === 'dagen' || name === 'adsdagen' || name === 'kostendagen') {
        if (!validDay(row.dag) || row.dag > localDay(now)) return { ok: false, fout: 'ongeldige meetdag' };
        if (name === 'dagen' && (!validNumber(row.royalty) || !validNumber(row.stuks))) return { ok: false, fout: 'royalty en stuks zijn getallen; ontbrekend is geen nul' };
        if (name !== 'dagen' && (!validNumber(row.kosten) || row.kosten < 0)) return { ok: false, fout: 'kosten moeten bekend zijn' };
        if (row.volledig != null && typeof row.volledig !== 'boolean') return { ok: false, fout: 'volledig moet true of false zijn' };
        if (row.dag === localDay(now) && row.afgesloten === true) return { ok: false, fout: 'vandaag kan nog niet afgesloten zijn' };
        id = row.dag;
      } else if (name === 'maanden') {
        if (!validDay(row.maand + '-01') || !validNumber(row.royalty) || !Array.isArray(row.per)) return { ok: false, fout: 'maand met royalty en boekdetails vereist' };
        id = row.maand;
      } else {
        if (!validDay(row.van) || !validDay(row.tot) || row.van > row.tot || !row.id || !validNumber(row.kosten) || row.kosten < 0) return { ok: false, fout: 'advertentie: periode, id en kosten vereist' };
        id = row.van + '|' + row.tot + '|' + str(row.id, 80);
      }
      if (row.per && (!Array.isArray(row.per) || row.per.some(p => !p.boek || !validNumber(p.royalty) || !validNumber(p.stuks)))) return { ok: false, fout: 'boekdetails: boek, royalty en stuks vereist' };
      const clean = { ...row, munt: 'USD', bron: str(row.bron, 600), gezien: new Date(row.gezien).toISOString() };
      if (row.per) clean.per = row.per.slice(0, 400).map(p => ({ boek: str(p.boek, 100), markt: str(p.markt, 60), royalty: money(p.royalty), stuks: p.stuks }));
      validated.push({ name, id, row: clean });
    }
  }
  for (const { name, id, row } of validated) {
    const old = await kv.raw(['HGET', PREFIX + name, id]);
    if (old) { const previous = typeof old === 'string' ? JSON.parse(old) : old; if (Date.parse(previous.gezien) > Date.parse(row.gezien)) continue;
      if (name === 'dagen' && previous.royalty !== row.royalty) await hset(kv, 'herzieningen', id + '|' + row.gezien, { vorige: previous, nieuw: row }); }
    await hset(kv, name, id, row);
  }
  await kv.set(PREFIX + 'voeding', { t: new Date(now).toISOString(), rijen: validated.length });
  return { ok: true, rijen: validated.length };
}

export async function bewaarKdpSnapshot(kv, k, now = Date.now()) {
  if (!validNumber(k.bedrag) || !validDay(k.dag) || k.dag !== localDay(now)) return;
  await hset(kv, 'snapshots:' + k.dag, new Date(now).toISOString(), { ...k, t: new Date(now).toISOString() });
  await kv.raw(['EXPIRE', PREFIX + 'snapshots:' + k.dag, 400 * 86400]);
}

export function dagModel(rows, day, adDays = []) {
  const before = rows.filter(r => r.dag < day && r.afgesloten === true).sort((a, b) => a.dag.localeCompare(b.dag));
  const byDay = Object.fromEntries(before.map(r => [r.dag, r.royalty]));
  const recent = (target, n) => Array.from({ length: n }, (_, i) => byDay[shift(target, -n + i)]).filter(validNumber);
  const adByDay = Object.fromEntries(adDays.filter(a => a.afgesloten && validNumber(a.kosten)).map(a => [a.dag, a.kosten]));
  const adCorrection = (target, lag) => {
    const training = before.filter(r => r.dag < target && r.dag >= shift(target, -56)).flatMap(r => {
      const x = adByDay[shift(r.dag, -lag)], prior = recent(r.dag, 7);
      return validNumber(x) && prior.length === 7 ? [{ x, y: r.royalty - mean(prior) }] : [];
    });
    const x = adByDay[shift(target, -lag)]; if (training.length < 28 || !validNumber(x)) return null;
    const mx = mean(training.map(r => r.x)), my = mean(training.map(r => r.y));
    const variance = mean(training.map(r => (r.x - mx) ** 2)); if (!variance) return null;
    const covariance = mean(training.map(r => (r.x - mx) * (r.y - my)));
    return (my + covariance / variance * (x - mx)) * training.length / (training.length + 20);
  };
  const model = (name, target) => {
    const r = recent(target, name === 'gemiddeld3' ? 3 : name === 'gemiddeld14' ? 14 : 7);
    if (r.length < 3) return null;
    if (name.startsWith('adslag')) { const correction = adCorrection(target, Number(name.slice(6))); return correction == null ? null : Math.max(0, mean(r) + correction); }
    if (name === 'gisteren') return byDay[shift(target, -1)] ?? null;
    if (name === 'mediaan7') return quantile(r, .5);
    if (name === 'recent') { let v = r[0]; for (const n of r.slice(1)) v = .35 * n + .65 * v; return v; }
    if (name === 'weekdag') { const s = [7, 14, 21, 28].map(n => byDay[shift(target, -n)]).filter(validNumber); return s.length >= 3 ? .5 * mean(s) + .5 * mean(r) : null; }
    return mean(r);
  };
  const names = ['gemiddeld7', 'gemiddeld3', 'gemiddeld14', 'mediaan7', 'recent', 'weekdag', 'gisteren', 'adslag1', 'adslag2', 'adslag3', 'adslag7'];
  const tests = before.filter(r => r.dag >= shift(day, -21)); const diagnostics = [];
  for (const name of names) {
    const errors = tests.flatMap(r => { const p = model(name, r.dag); return p == null ? [] : [{ dag: r.dag, fout: r.royalty - p }]; });
    diagnostics.push({ model: name, n: errors.length, mae: errors.length ? money(mean(errors.map(e => Math.abs(e.fout)))) : null, errors });
  }
  const baseline = diagnostics[0]; let selected = baseline;
  for (const c of diagnostics) if (c.n >= 14 && c.n === baseline.n && c.mae < selected.mae && c.mae <= baseline.mae * .9 && model(c.model, day) != null) selected = c;
  const p = model(selected.model, day); if (p == null || recent(day, 7).length < 7) return { ok: false, reden: 'Minder dan zeven aaneengesloten afgesloten meetdagen' };
  const residuals = selected.errors.map(e => e.fout);
  const low = Math.min(p * .7, p + (quantile(residuals, .1) ?? -p * .5));
  const high = Math.max(p * 1.3, p + (quantile(residuals, .9) ?? p * .5));
  return { ok: true, bedrag: money(Math.max(0, p)), laag: money(Math.max(0, low)), hoog: money(Math.max(0, high)), model: selected.model,
    basis: money(mean(recent(day, 7))), proef: diagnostics.map(({ errors, ...rest }) => rest),
    uitleg: 'Doorlopende historische toets: uitsluitend eerdere dagen voorspellen de volgende dag. Definitieve exports waren destijds nog niet allemaal beschikbaar; dit is een terugtest, geen bewezen live nauwkeurigheid. Band is indicatief, geen gekalibreerde kans.' };
}

function bookTotals(rows) { const out = {}; for (const r of rows) for (const p of r.per || []) out[p.boek] = (out[p.boek] || 0) + p.royalty; return out; }
// Profit is only a measurement when royalty, every ad source and other KDP costs are covered.
// Printing is already deducted in KDP royalty. Never subtract it a second time.
export function winstModel(days, adDays, costDays, day, month, goal) {
  if (!goal || !validDay(goal.maand + '-01') || !validNumber(goal.bedrag) || goal.bedrag <= 0) return null;
  const [year, mo] = goal.maand.split('-').map(Number), count = new Date(Date.UTC(year, mo, 0)).getUTCDate();
  const dates = Array.from({ length: count }, (_, i) => goal.maand + '-' + String(i + 1).padStart(2, '0')).filter(d => d < day);
  const missing = []; let actual = 0, measured = 0;
  for (const d of dates) {
    const r = days.find(x => x.dag === d && x.afgesloten && validNumber(x.royalty));
    const a = adDays.find(x => x.dag === d && x.afgesloten && x.volledig === true && validNumber(x.kosten));
    const c = costDays.find(x => x.dag === d && x.afgesloten && x.volledig === true && validNumber(x.kosten));
    const absent = [!r && 'royalty', !a && 'alle advertentiekosten', !c && 'overige KDP-kosten'].filter(Boolean);
    if (absent.length) missing.push({ dag: d, ontbreekt: absent });
    else { actual += r.royalty - a.kosten - c.kosten; measured++; }
  }
  const actualAmount = missing.length ? null : money(actual);
  // A fixed-spend scenario, not an assertion that more sales can be bought for the same cost.
  const tempos = [3, 7].flatMap(n => {
    const rows = Array.from({ length: n }, (_, i) => adDays.find(a => a.dag === shift(day, -i - 1) && a.afgesloten && validNumber(a.kosten)));
    if (rows.some(r => !r)) return [];
    return [{ dagen: n, perDag: money(mean(rows.map(r => r.kosten))), maand: money(mean(rows.map(r => r.kosten)) * count), volledig: rows.every(r => r.volledig === true) }];
  });
  const sameMonth = month?.maand === goal.maand;
  const contributions = sameMonth ? tempos.map(t => money(month.bedrag - t.maand)) : [];
  const remaining = dates.length < count ? count - dates.length : 0;
  const needed = actualAmount == null ? null : Math.max(0, goal.bedrag - actualAmount);
  const plan = validNumber(goal.royaltyPlan) && validNumber(goal.adsAandeelPlan) && goal.adsAandeelPlan >= 0 && goal.adsAandeelPlan < 1 ? {
    royalty: goal.royaltyPlan, adsAandeel: goal.adsAandeelPlan, adsRekenbedrag: money(goal.royaltyPlan * goal.adsAandeelPlan),
    ruimteOverigeKosten: money(goal.royaltyPlan * (1 - goal.adsAandeelPlan) - goal.bedrag),
    uitleg: 'Rekenpad voor het winstdoel; geen extra advertentiebudget of wijziging van bestaande boekgrenzen.'
  } : null;
  return { maand: goal.maand, doel: goal.bedrag, munt: 'USD', perDag: money(goal.bedrag / count),
    definitie: 'KDP-royalty minus alle advertenties en overige KDP-kosten. Drukkosten zijn al van de royalty af.',
    werkelijk: { bedrag: actualAmount, gemetenDeel: money(actual), dagen: measured, verwachteDagen: dates.length, ontbreekt: missing,
      status: !dates.length ? 'De doelmaand is nog niet begonnen.' : missing.length ? 'Winst onbekend: kostendekking of royalty ontbreekt.' : 'Voorlopige winst over alle afgesloten dagen; broncorrecties blijven mogelijk.' },
    resterend: remaining, nogNodig: needed, nodigPerResterendeDag: remaining && needed != null ? money(needed / remaining) : null,
    bijdrageRaming: contributions.length ? { laag: Math.min(...contributions), hoog: Math.max(...contributions), overigeKosten: 'nog niet afgetrokken', adTempo: tempos,
      kostendekkingBevestigd: tempos.every(t => t.volledig), kloofMinimaal: money(Math.max(0, goal.bedrag - Math.max(...contributions))),
      uitleg: 'Huidige royaltyraming minus gelijkblijvende advertentie-uitgaven volgens het tempo van 3 en 7 dagen. Vóór overige kosten; onvolledige advertentiebronnen kunnen dit overschatten. Geen bewezen schaalbare winst.' } : null,
    vereist: [.3, .4, .6].map(share => ({ adsAandeel: share, royaltyMinimaal: money(goal.bedrag / (1 - share)), perDagMinimaal: money(goal.bedrag / (1 - share) / count) })),
    plan };
}

export function decemberModel(days, months, day) {
  const year = Number(day.slice(0, 4)), target = year + '-12';
  const lastNov = months.find(m => m.maand === (year - 1) + '-11'), lastDec = months.find(m => m.maand === (year - 1) + '-12');
  const end = day < year + '-12-01' ? day : year + '-12-01';
  const observed = days.filter(d => d.dag >= year + '-11-01' && d.dag < end && d.afgesloten);
  if (!lastNov || !lastDec || observed.length < 14) return null;
  const n = bookTotals([lastNov]), d = bookTotals([lastDec]), current = bookTotals(observed), week = bookTotals(observed.slice(-7));
  const total = mean(observed.map(r => r.royalty)) * 31;
  const monthRatio = [], recentRatio = [];
  for (const [book, amount] of Object.entries(current)) {
    const factor = n[book] >= 5 ? (d[book] || 0) * 30 / n[book] : 31;
    monthRatio.push({ boek: book, bedrag: money(amount / observed.length * factor) });
    recentRatio.push({ boek: book, bedrag: money((week[book] || 0) / 7 * factor) });
  }
  const a = monthRatio.reduce((s, r) => s + r.bedrag, 0), b = recentRatio.reduce((s, r) => s + r.bedrag, 0);
  // Explicit starting assumption: midpoint of level-adjusted seasonal scenarios. Not a fitted confidence interval.
  const per = recentRatio.map((r, i) => ({ boek: r.boek, bedrag: money((r.bedrag + monthRatio[i].bedrag) / 2) })).sort((x, y) => y.bedrag - x.bedrag);
  const flat = mean(observed.slice(-7).map(r => r.royalty)) * 31;
  let amount = (a + b) / 2, low = Math.min(flat, a), high = Math.max(a, b), progress = null;
  const december = days.filter(r => r.afgesloten && r.dag.startsWith(target) && r.dag < day);
  if (december.length) {
    const actual = december.reduce((s, r) => s + r.royalty, 0), remaining = 31 - december.length, weight = december.length / (december.length + 14), tempo = mean(december.slice(-7).map(r => r.royalty));
    amount = actual + remaining * ((1 - weight) * amount / 31 + weight * tempo);
    low = actual + remaining * Math.min(low / 31, tempo); high = actual + remaining * Math.max(high / 31, tempo);
    progress = { werkelijk: money(actual), dagen: december.length, resterend: remaining, gewicht: money(weight) };
  }
  return { maand: target, bedrag: money(amount), laag: money(low), hoog: money(high), per, voortgang: progress,
    scenarios: { huidigWeektempo: money(flat), heleNovemberMetSeizoen: money(a), recentTempoMetSeizoen: money(b), heleMaandZonderSeizoen: money(total) },
    uitleg: 'Per boek: december/november 2025, toegepast op november 2026 en afzonderlijk op de laatste zeven dagen; het midden is een expliciete startaanname. De weekvariant kan kerstgroei dubbel tellen en is het hoge scenario. Geen automatische terugkeer van PIT BOSS of Lasting Change. In december: werkelijk plus resterende dagen, gemengd met het laatste weektempo met gewicht meetdagen/(meetdagen+14); boekuitsplitsing blijft de oorspronkelijke scenarioverdeling. Valuta van historische detailregels benaderd. Geen statistisch betrouwbaarheidsinterval.' };
}

export function analyseDrivers(days, ads, adDays, day) {
  const recent = days.filter(r => r.afgesloten && r.dag >= shift(day, -7) && r.dag < day);
  const sums = bookTotals(recent), all = Object.values(sums).reduce((s, n) => s + n, 0);
  const books = Object.entries(sums).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([boek, royalty]) => ({ boek, royalty: money(royalty), aandeel: all ? money(100 * royalty / all) : null }));
  const period = ads.filter(a => a.tot < day && a.van < a.tot);
  const opportunities = period.filter(a => a.kliks >= 15 && a.aankopen >= 3).map(a => ({ naam: a.naam, kosten: a.kosten, aankopen: a.aankopen, kliks: a.kliks, perAankoop: money(a.kosten / a.aankopen), conversie: money(100 * a.aankopen / a.kliks) })).sort((a, b) => a.perAankoop - b.perAankoop).slice(0, 5);
  const matched = adDays.filter(a => a.dag < shift(day, -2) && days.some(d => d.dag === a.dag && d.afgesloten));
  return { boeken: books, advertenties: opportunities, advertentieDagen: matched.length,
    geleerd: ['Verkoopvolume per boek en land bepaalt de royalty, samen met royalty per exemplaar. Het grootste huidige boek krijgt eerst aandacht.',
      'Print: besteldatum en royaltydatum verschillen. Vergelijk advertenties op klik-/besteldag met royalty 1, 2, 3 en 7 dagen later; niet dezelfde dag als bewezen effect tellen.',
      matched.length < 28 ? 'Nog minder dan 28 vergelijkbare advertentiedagen: geen betrouwbare advertentie-elasticiteit. Meer uitgeven krijgt daarom geen verzonnen omzetopslag.' : 'Advertentiesignalen zijn hypothesen. Een verband bewijst geen extra verkoop; toets één wijziging met vergelijkbare controle en netto royalty.',
      'Biedingen en nieuwe targets kunnen al zijn verwerkt in het huidige verkooptempo. Tel die groei niet nogmaals bij de voorspelling op.'],
    volgende: opportunities.length ? 'Toets eerst de zoekwoorden uit ' + opportunities[0].naam + ': meer royalty na ads binnen de bestaande boekgrens, met één gecontroleerde wijziging en een gedateerd oordeel.' : 'Vul advertentiecijfers per boek en land aan, inclusief nulverkopen en rapportagevertraging.' };
}

export async function voorspelRonde(kv, now = Date.now()) {
  const day = localDay(now), seen = new Date(now).toISOString();
  const [days, months, ads, adDays, current, costDays, config] = await Promise.all([readHash(kv, 'dagen'), readHash(kv, 'maanden'), readHash(kv, 'ads'), readHash(kv, 'adsdagen'), kv.get('ovs:kdp'), readHash(kv, 'kostendagen'), kv.get('mm:dash:kdp')]);
  // Do not train on rows observed after this run (also keeps replay tests honest).
  const past = days.filter(d => Date.parse(d.gezien) <= now).sort((a, b) => a.dag.localeCompare(b.dag));
  const availableAds = ads.filter(a => Date.parse(a.gezien) <= now), availableAdDays = adDays.filter(a => Date.parse(a.gezien) <= now);
  const month = decemberModel(past, months.filter(m => Date.parse(m.gezien) <= now), day);
  const profit = winstModel(past, availableAdDays, costDays.filter(c => Date.parse(c.gezien) <= now), day, month, config?.winstdoel);
  const model = dagModel(past, day, availableAdDays); const alarms = [];
  const last = past.filter(d => d.afgesloten && d.dag < day).at(-1);
  if (!last || last.dag < shift(day, -1)) alarms.push('Royalty van gisteren ontbreekt; vorige cijfers niet als vandaag presenteren.');
  if (!current || current.dag !== day || now - Date.parse(current.t) > 10 * 36e5) alarms.push('Actuele KDP-tussenstand ontbreekt of is ouder dan tien uur.');
  if (!availableAdDays.some(a => a.dag === shift(day, -1))) alarms.push('Advertentiekosten van gisteren ontbreken; onbekend is geen nul.');
  const scores = [];
  for (let i = 1; i <= 35; i++) {
    const d = shift(day, -i), p = await kv.get(PREFIX + 'dag:' + d), actual = past.find(r => r.dag === d && r.afgesloten);
    if (!p || !actual || !validNumber(p.bedrag)) continue;
    const error = actual.royalty - p.bedrag;
    scores.push({ dag: d, voorspeld: p.bedrag, werkelijk: actual.royalty, fout: money(error), absoluut: money(Math.abs(error)), basisFout: money(Math.abs(actual.royalty - p.basis)), binnenBand: actual.royalty >= p.laag && actual.royalty <= p.hoog, voorlopig: i < 7 || Date.parse(actual.gezien) < Date.parse(d) + 7 * DAY, actualGezien: actual.gezien });
  }
  const mature = scores.filter(s => !s.voorlopig);
  const monthScores = (await readHash(kv, 'maandregister')).filter(m => m.maand < day.slice(0, 7)).map(m => {
    const [y, mo] = m.maand.split('-').map(Number), count = new Date(Date.UTC(y, mo, 0)).getUTCDate(), end = Date.UTC(y, mo, 1);
    const rows = past.filter(r => r.afgesloten && r.dag.startsWith(m.maand)); const complete = rows.length === count;
    const actual = complete ? money(rows.reduce((s, r) => s + r.royalty, 0)) : null;
    return { maand: m.maand, voorspeld: m.bedrag, werkelijk: actual, dagen: rows.length, compleet: complete, fout: actual == null ? null : money(actual - m.bedrag), voorlopig: !complete || rows.some(r => Date.parse(r.gezien) < end + 7 * DAY) };
  });
  const learning = { scores, maanden: monthScores, n: mature.length, mae: mature.length ? money(mean(mature.map(s => s.absoluut))) : null, basisMae: mature.length ? money(mean(mature.map(s => s.basisFout))) : null, bias: mature.length ? money(mean(mature.map(s => s.fout))) : null, dekking: mature.length ? money(100 * mean(mature.map(s => Number(s.binnenBand)))) : null };
  if (!model.ok) { const out = { dag: day, t: seen, status: 'data ontbreekt', winst: profit, leren: learning, alarmen: alarms.concat(model.reden) }; await kv.set(PREFIX + 'laatst', out); return out; }
  const dayKey = PREFIX + 'dag:' + day; const existing = await kv.get(dayKey);
  const observed = current?.dag === day && Date.parse(current.t) <= now ? current.bedrag : null;
  const amount = Math.max(model.bedrag, observed ?? 0);
  const forecast = { dag: day, t: seen, bedrag: money(amount), laag: money(Math.max(observed ?? 0, model.laag)), hoog: money(Math.max(amount, model.hoog)), model: model.model, basis: model.basis, cutoff: seen, omzetsoort: 'KDP geschatte royalty USD, alle boeken; marktdagen', gezienVandaag: observed, proef: model.proef, uitleg: model.uitleg, invoerTot: last?.dag, invoerGezien: past.map(d => d.gezien).sort().at(-1) };
  // SET NX freezes the first genuine prediction of each day, including under concurrent cron runs.
  if (!existing) await kv.raw(['SET', dayKey, JSON.stringify(forecast), 'NX', 'EX', 400 * 86400]);
  const official = await kv.get(dayKey);
  if (month) { await kv.raw(['SET', PREFIX + 'maand:' + month.maand, JSON.stringify({ ...month, t: seen }), 'NX', 'EX', 800 * 86400]); await hset(kv, 'maandregister', month.maand, await kv.get(PREFIX + 'maand:' + month.maand)); }
  const result = { dag: day, t: seen, status: alarms.length ? 'aanvullen' : 'ok', vandaag: official, bijstelling: forecast, december: month,
    maandVast: month ? await kv.get(PREFIX + 'maand:' + month.maand) : null,
    winst: profit, leren: learning,
    factoren: analyseDrivers(past, availableAds, availableAdDays, day), alarmen: alarms, kostenNu: availableAds.filter(a => a.van === day && a.tot === day).length ? money(availableAds.filter(a => a.van === day && a.tot === day).reduce((s, a) => s + a.kosten, 0)) : null,
    bron: 'KDP en Amazon Ads, bron en waarnemingstijd per geïmporteerde rij; geen API-login in de cloud. De bestaande ingelogde rondes moeten nieuwe exports leveren.' };
  await kv.set(PREFIX + 'laatst', result); return result;
}

export async function voorspelStand(kv, now = Date.now()) {
  const r = await kv.get(PREFIX + 'laatst'); if (!r) return null;
  return { ...r, oud: r.dag !== localDay(now) || now - Date.parse(r.t) > 30 * 36e5 };
}

export function voorspelTekst(r) {
  if (!r) return 'KDP-voorspelling: nog niet gestart.';
  const f = r.vandaag, m = r.december;
  const lines = ['KDP VOORSPELLING ' + r.dag + (r.oud ? ' (verouderd)' : '')];
  if (f) lines.push('Vandaag royalty ' + usd(f.bedrag) + '; indicatieve band ' + usd(f.laag) + '–' + usd(f.hoog) + '. Voor ads. Model ' + f.model + ', vastgelegd ' + f.t + '.', 'Dit is royalty voor de auteur, geen winkelomzet of uitbetaling op de bank.');
  if (m) lines.push('December ' + usd(m.bedrag) + '; scenario ' + usd(m.laag) + '–' + usd(m.hoog) + ', voor ads. ' + m.uitleg);
  if (r.winst) { const w = r.winst; lines.push('WINSTDOEL ' + w.maand + ': minimaal ' + usd(w.doel) + ', gemiddeld ' + usd(w.perDag) + ' per dag. ' + w.definitie,
    'Gemeten winst: ' + usd(w.werkelijk.bedrag) + '. ' + w.werkelijk.status + ' Dekking ' + w.werkelijk.dagen + '/' + w.werkelijk.verwachteDagen + ' afgesloten dagen.');
    if (w.bijdrageRaming) lines.push('Huidige decemberbijdrage na gemeten advertentietempo: ' + usd(w.bijdrageRaming.laag) + '–' + usd(w.bijdrageRaming.hoog) + ', overige kosten nog aftrekken. Minimaal tekort ' + usd(w.bijdrageRaming.kloofMinimaal) + '. ' + w.bijdrageRaming.uitleg);
    if (w.plan) lines.push('Rekenpad: ' + usd(w.plan.royalty) + ' royalty, ' + (100 * w.plan.adsAandeel) + '% ads = ' + usd(w.plan.adsRekenbedrag) + ', ruimte overige kosten ' + usd(w.plan.ruimteOverigeKosten) + '. ' + w.plan.uitleg);
    lines.push('Minimaal vereiste royalty vóór overige kosten: ' + w.vereist.map(s => (100 * s.adsAandeel) + '% ads: ' + usd(s.royaltyMinimaal)).join('; ') + '.');
  }
  if (r.factoren) lines.push('Belangrijkste boeken (7 dagen): ' + r.factoren.boeken.map(b => b.boek + ' ' + b.aandeel + '%').join(', '), ...r.factoren.geleerd, 'Volgende omzetproef: ' + r.factoren.volgende);
  if (r.leren?.scores.length) { const s = r.leren.scores[0]; lines.push('Laatste uitkomst ' + s.dag + ': voorspeld ' + usd(s.voorspeld) + ', werkelijk ' + usd(s.werkelijk) + ', verschil ' + usd(s.fout) + (s.voorlopig ? ' (voorlopig)' : '') + '.'); }
  for (const m of r.leren?.maanden || []) lines.push('Maandtoets ' + m.maand + ': voorspeld ' + usd(m.voorspeld) + ', werkelijk ' + usd(m.werkelijk) + ', ' + m.dagen + ' meetdagen' + (m.voorlopig ? ', voorlopig' : ', herlezen na zeven dagen') + '.');
  if (r.leren) lines.push(r.leren.n ? 'Live fout na zeven dagen: ' + usd(r.leren.mae) + ', weekbasis ' + usd(r.leren.basisMae) + '; ' + r.leren.n + ' dagen.' : 'Definitieve live nauwkeurigheid: nog niet gemeten. Eerste vergelijking morgen voorlopig; herzien na 3 en 7 dagen.');
  lines.push(...(r.alarmen || []).map(x => 'Meetpunt: ' + x), 'Voeden (beschermde host): zet {"kdpdata":{"dagen":[{"dag":"JJJJ-MM-DD","royalty":0,"stuks":0,"afgesloten":true,"bron":"KDP Reports USD, datum gecontroleerd","gezien":"ISO-tijdstip","per":[]}]}}; adsdagen met dag,kosten,aankopen,bron,gezien; ads met id,van,tot,kosten,kliks,aankopen,bron,gezien. Nieuwe ronde: /oversight?voorspel=1. Invoer lezen: /oversight?voorspeldata=1.');
  return lines.join('\n');
}

export function voorspelHtml(r) {
  if (!r) return '';
  const f = r.vandaag, m = r.december, w = r.winst; const row = (label, value) => '<div class="r"><b>' + esc(label) + '</b><span>' + esc(value) + '</span></div>';
  const profitHtml = w ? '<div class="blok"><h3>December: minimaal ' + esc(usd(w.doel)) + ' winst</h3><div class="lijst">'
    + row('Nodig', usd(w.perDag) + ' winst per dag gemiddeld.')
    + row('Werkelijk', usd(w.werkelijk.bedrag) + '. ' + w.werkelijk.status)
    + (w.bijdrageRaming ? row('Huidige raming', usd(w.bijdrageRaming.laag) + '–' + usd(w.bijdrageRaming.hoog) + ' na ads, overige kosten nog aftrekken. Minimaal ' + usd(w.bijdrageRaming.kloofMinimaal) + ' tekort.') : '')
    + (w.nodigPerResterendeDag != null ? row('Nog nodig', usd(w.nogNodig) + ' over ' + w.resterend + ' dagen = ' + usd(w.nodigPerResterendeDag) + ' winst per dag.') : '')
    + (w.plan ? row('Rekenpad', usd(w.plan.royalty) + ' royalty, maximaal ' + (w.plan.adsAandeel * 100) + '% ads en ' + usd(w.plan.ruimteOverigeKosten) + ' overige kosten.') : '')
    + '</div><p>' + esc(w.definitie) + '</p>'
    + (w.bijdrageRaming ? '<p>' + esc(w.bijdrageRaming.uitleg) + '</p>' : '')
    + '<details><summary>Benodigde verkoop en kostendekking</summary><div class="in">'
    + w.vereist.map(s => row((s.adsAandeel * 100) + '% ads', 'Minimaal ' + usd(s.royaltyMinimaal) + ' royalty; overige kosten komen daar nog bij.')).join('')
    + row('Kostendekking', w.werkelijk.dagen + '/' + w.werkelijk.verwachteDagen + ' afgesloten dagen volledig gemeten. Onbekende kosten tellen niet als nul.')
    + (w.bijdrageRaming && !w.bijdrageRaming.kostendekkingBevestigd ? '<p>Advertentiebron sluit mogelijk campagnes of netwerken uit; de raming is daarom geen volledige winstmeting.</p>' : '')
    + (w.plan ? '<p>' + esc(w.plan.uitleg) + '</p>' : '') + '</div></details></div>' : '';
  return profitHtml + '<div class="blok"><h3>Voorspeld vóór we de uitslag weten</h3>' + (r.oud ? '<p>Deze voorspelling is verouderd. Nieuwe brondata nodig.</p>' : '') + '<div class="lijst">'
    + (f ? row('Vandaag', usd(f.bedrag) + ' royalty. Band ' + usd(f.laag) + '–' + usd(f.hoog) + '. Vóór advertenties.') : '')
    + (m ? row('December', usd(m.bedrag) + ' royalty. Scenario ' + usd(m.laag) + '–' + usd(m.hoog) + '. Vóór advertenties.') : '')
    + (r.kostenNu != null ? row('Ads nu', usd(r.kostenNu) + ' gemeten in de laatst geïmporteerde tussenstand.') : '')
    + (r.leren?.scores.length ? row('Uitkomst', r.leren.scores[0].dag + ': ' + usd(r.leren.scores[0].werkelijk) + ' tegenover ' + usd(r.leren.scores[0].voorspeld) + ' voorspeld' + (r.leren.scores[0].voorlopig ? ' (voorlopig).' : '.')) : '')
    + (r.leren?.maanden || []).map(m => row(m.maand, usd(m.werkelijk) + ' werkelijk tegenover ' + usd(m.voorspeld) + ' voorspeld' + (m.voorlopig ? ' (voorlopig).' : '.'))).join('')
    + (r.leren ? row('Fout', r.leren.n ? usd(r.leren.mae) + ' per dag, vergeleken met ' + usd(r.leren.basisMae) + ' voor het weekgemiddelde.' : 'Nog geen live toets. Morgen vergelijken; na 3 en 7 dagen opnieuw afrekenen.') : '') + '</div>'
    + '<p>Royalty is je opbrengst als auteur. Meer advertentiegeld telt pas als groei wanneer extra royalty de extra kosten dekt.</p>'
    + '<details><summary><b>Wat beïnvloedt de omzet?</b></summary><div class="in">' + ((r.factoren?.boeken || []).map(b => row(b.boek, b.aandeel + '% van de verkooproyalty in de laatste zeven dagen.')).join(''))
    + (r.factoren?.geleerd || []).map(x => '<p>' + esc(x) + '</p>').join('') + (m ? '<p>' + esc(m.uitleg) + '</p>' : '')
    + '<p>' + esc(f?.uitleg || '') + '</p><p>Vastgelegd: ' + esc(f?.t || r.t) + '. De oorspronkelijke voorspelling blijft staan.</p></div></details>'
    + (r.alarmen?.length ? '<p>' + r.alarmen.map(esc).join(' ') + '</p>' : '') + '</div>';
}

export async function leesVoorspelData(kv) {
  const [dagen, maanden, ads, adsdagen, kostendagen, maandvoorspellingen] = await Promise.all(['dagen', 'maanden', 'ads', 'adsdagen', 'kostendagen', 'maandregister'].map(k => readHash(kv, k)));
  return { dagen, maanden, ads, adsdagen, kostendagen, maandvoorspellingen };
}
