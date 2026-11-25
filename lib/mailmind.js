// Mailmind: één lerende mailmotor voor alle projecten (Henkjan 25 nov 2026: "Ik wil een intelligente mail motor hebben die alle mail kan versturen en
// altijd lerend is . En dus ook adressen kan vinden die beste zullen scoren . Hoe gaan we die mail motor noemen ?" ... "Ja mailmind").
// Broertje van Clickmind: Clickmind leert van elke klik, Mailmind van elke mail. Skill: .claude/skills/mail-lerend/SKILL.md (live /api/post?op=skill).
//
// Hoe het werkt:
// - Een stroom is één soort mail met één doel (bijv. tk-mailchimp: oude lezers van Tania opnieuw vragen). De stroom levert zijn varianten, zijn mail,
//   zijn links en wat er gebeurt bij ja (STROMEN hieronder; tk-mailchimp staat in lib/tkmc.js). De motor doet de rest.
// - Adressen die het best scoren eerst: elk adres valt in een bak (kenmerken van de stroom, bijv. Mailchimp-score, soort mailadres, jaar van aanmelden).
//   Elke ronde kiest Thompson sampling de bak met de beste kans op ja (voorkennis: 5%), dus wat goed scoort krijgt meer mails en elke bak blijft
//   een beetje proberen. Stand per bak in mlm:<s>:bs:<bak>.
// - Altijd lerend: twee varianten tegelijk, Thompson op ja per verstuurde mail; elke 20 verstuurde mails een leermoment (slechtste variant met 80%
//   kans eruit, na 60 per variant de laagste toch), volgende uit de rij of een uitdager (op=mailmind&s=<s>&uitdager=).
// - Poort per mailbox, over alle stromen samen (ook de clubwerving): gewone Gmail via Zernio hooguit 180 per dag en 12 per uur (Zernio: 200 per dag,
//   10 harde bounces in een uur of dezelfde tekst naar 50+ mensen per uur zet de grens terug). Eén blokkeerlijst voor alle projecten (mlm:af):
//   wie bij één project stop zegt, krijgt nergens meer iets.
// - Post lezen: antwoorden en bounces uit Henkjans mailbox (Zernio), ingedeeld in ja, stop, afwezig, anders; ja gaat naar de stroom (bijv. op de lijst).
// - Volume per stroom: bounce onder 5% en stop onder 3% over 7 dagen (vanaf 40 mails): +10 per 2 dagen tot max; bounce 8% of stop 5%: halveren.
// - Elke mail wordt gemeld in de POST-lus (lib/postlus.js) en elke dag dat er iets gebeurde komt er één regel in het werklog (dashboard).
// - Een stroom gaat pas live op Henkjans "verstuur": LIVE in de stroom én op=mailmind&s=<s>&zet=1&aan=1.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';

export const STROMEN = { 'tk-mailchimp': () => import('./tkmc.js').then(m => m.STROOM) };
const STD = { aan: false, perDag: 40, max: 180, perUur: 8, armen: [0, 1], volgende: 2, knopAt: 0, gedaan: [], extra: [] };
const BOX = { perDag: 180, perUur: 12 };
export const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
export const hm = s => createHash('sha256').update('mlm:' + String(s).toLowerCase().trim()).digest('hex').slice(0, 24);
export const dagNL = (t = Date.now()) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
export const uurNL = (t = Date.now()) => N(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: 'numeric', hour12: false }).format(new Date(t))) % 24;
const dagUTC = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const uurUTC = (t = Date.now()) => new Date(t).toISOString().slice(0, 13);
const hash = l => { const o = {}; if (Array.isArray(l)) for (let i = 0; i < l.length; i += 2) o[l[i]] = N(l[i + 1]); else if (l && typeof l === 'object') for (const [k, v] of Object.entries(l)) o[k] = N(v); return o; };
const hlees = async k => hash(await kv.raw(['HGETALL', k]).catch(() => []));
export const MAILRE = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i;

// ---------- soort mailadres (kenmerk voor de bakken) ----------
const GRATIS = /^(gmail|googlemail|hotmail|outlook|live|msn|icloud|me|mac|yahoo|ymail|aol|proton|protonmail|gmx|web)\./;
const PROVIDER = /^(ziggo|kpnmail|kpnplanet|home|planet|hetnet|upcmail|xs4all|chello|zonnet|quicknet|casema|telfort|tele2|online|tiscali|wanadoo|caiway|solcon|zeelandnet|hccnet|onsbrabantnet|telenet|skynet|scarlet)\./;
export const soortAdres = m => { const d = String(m).split('@')[1] || '', l = String(m).split('@')[0] || ''; if (/^(info|contact|admin|office|mail|post|secretariaat|bestuur|sales|hello|hallo)$/.test(l)) return 'algemeen'; return GRATIS.test(d) ? 'gratis' : PROVIDER.test(d) ? 'provider' : 'eigen'; };

// ---------- Thompson ----------
const normaal = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
function gamma(k) { if (k < 1) return gamma(k + 1) * Math.pow(Math.random(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = normaal(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
export const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
const PRIOR = [0.5, 9.5]; // verwachting 5% ja (een stroom kan per bak eigen voorkennis geven met D.voorkennis(bak) = [a, b]), zodat een bak met een paar mails zonder ja niet meteen afvalt en een lege bak niet overdreven lokt
export function kiesBak(stats, kansen, prior = () => PRIOR) { let best = null, bv = -1; for (const b of kansen) { const s = stats[b] || {}; const j = N(s.ja), v = N(s.verstuurd), [pa, pb] = prior(b) || PRIOR; const x = beta(pa + j, pb + Math.max(0, v - j)); if (x > bv) { bv = x; best = b; } } return best; }
export function kansSlechtst(S, n = 4000) { const k = Object.keys(S), w = Object.fromEntries(k.map(x => [x, 0])); for (let i = 0; i < n; i++) { let sl = null, sv = 2; for (const x of k) { const s = N(S[x].ja), v = N(S[x].verstuurd); const b = beta(s + 1, Math.max(0, v - s) + 1); if (b < sv) { sv = b; sl = x; } } w[sl]++; } for (const x of k) w[x] = Math.round(w[x] / n * 1000) / 1000; return w; }
function kiesArm(R, S) {
  const k = R.armen.map(i => 'o' + i), weinig = k.filter(x => N(S[x] && S[x].verstuurd) < 10);
  if (weinig.length) return weinig.sort((a, b) => N(S[a] && S[a].verstuurd) - N(S[b] && S[b].verstuurd))[0];
  let best = k[0], bv = -1; for (const x of k) { const s = N(S[x].ja), v = N(S[x].verstuurd); const b = beta(s + 1, Math.max(0, v - s) + 1); if (b > bv) { bv = b; best = x; } } return best;
}

// ---------- opslag per stroom ----------
export async function stroom(s) { const f = STROMEN[s]; if (!f) throw new Error('onbekende stroom ' + s); return f(); }
export async function regels(s) { const r = await kv.get('mlm:' + s + ':regels').catch(() => null); const D = await stroom(s); return { ...STD, ...(D.std || {}), ...(r && typeof r === 'object' ? r : {}) }; }
export async function zetRegels(s, R) { await kv.set('mlm:' + s + ':regels', R); }
export const pool = (D, R) => [...D.varianten, ...((R && R.extra) || [])];
export async function tel(s, wat, n = 1, t = Date.now()) { try { const k = 'mlm:' + s + ':tel:' + dagNL(t); await kv.raw(['HINCRBY', k, wat, String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); await kv.raw(['HINCRBY', 'mlm:' + s + ':tot', wat, String(n)]); } catch (e) {} }
async function arm(s, v, wat) { try { await kv.raw(['HINCRBY', 'mlm:' + s + ':arm:' + v, wat, '1']); } catch (e) {} }
async function bak(s, b, wat) { try { await kv.raw(['HINCRBY', 'mlm:' + s + ':bs:' + b, wat, '1']); } catch (e) {} }
export async function adres(tok) { const x = await kv.raw(['HGET', 'mlm:a', String(tok).slice(0, 16)]).catch(() => null); try { return x ? JSON.parse(x) : null; } catch (e) { return null; } }
export async function bewaar(a) { await kv.raw(['HSET', 'mlm:a', a.tok, JSON.stringify(a)]); }
export async function geblokkeerd(m) { return !!N(await kv.raw(['SISMEMBER', 'mlm:af', hm(m)]).catch(() => 0)); }
export async function blokkeer(m) { if (m) await kv.raw(['SADD', 'mlm:af', hm(m)]).catch(() => {}); }
async function armStand(s, R) { const o = {}; for (const i of R.armen) o['o' + i] = await hlees('mlm:' + s + ':arm:o' + i); return o; }

// Adressen in de bakken van een stroom zetten. lijst = [{m, ...kenmerken}]; de stroom bepaalt de bak (D.bak(a)).
export async function vul(s, lijst) {
  const D = await stroom(s), per = {}; let n = 0;
  for (const a of lijst) { if (!a || !MAILRE.test(String(a.m || ''))) continue; const b = String(D.bak(a)).replace(/[^a-z0-9|_-]/gi, '').slice(0, 40) || 'x'; (per[b] = per[b] || []).push(JSON.stringify({ ...a, b })); n++; }
  for (const [b, l] of Object.entries(per)) { for (let i = 0; i < l.length; i += 500) await kv.raw(['RPUSH', 'mlm:' + s + ':b:' + b, ...l.slice(i, i + 500)]); await kv.raw(['SADD', 'mlm:' + s + ':bakken', b]); }
  return { ok: true, erbij: n, bakken: Object.fromEntries(Object.entries(per).map(([b, l]) => [b, l.length])) };
}
export async function bakken(s) {
  const l = ((await kv.raw(['SMEMBERS', 'mlm:' + s + ':bakken']).catch(() => [])) || []).sort(), o = {};
  for (const b of l) o[b] = { rij: N(await kv.raw(['LLEN', 'mlm:' + s + ':b:' + b]).catch(() => 0)), ...(await hlees('mlm:' + s + ':bs:' + b)) };
  return o;
}

// ---------- Zernio (Henkjans Gmail) ----------
const ZK = () => process.env.ZERNIO_API_KEY || process.env.ZERNIO_KEY || '';
export async function zApi(pad, { method = 'GET', body, raw = false } = {}) {
  const r = await fetch('https://zernio.com/api/v1' + pad, { method, headers: { authorization: 'Bearer ' + ZK(), 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(25000) });
  if (raw) return r; return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
}
export const idVan = x => x && (x.id || x._id || x.accountId || x.messageId || (x.message && (x.message.id || x.message._id)) || (x.data && (x.data.id || x.data._id)));
export const lijstVan = j => (j && (j.messages || j.threads || j.accounts || j.data || j.items)) || (Array.isArray(j) ? j : []);
export async function zAccount() {
  if (process.env.ZERNIO_MAIL_ACCOUNT) return String(process.env.ZERNIO_MAIL_ACCOUNT).split(',')[0].trim();
  const k = await kv.get('cw:zacc').catch(() => null); if (k && Array.isArray(k.ids) && k.ids[0]) return k.ids[0]; if (!ZK()) return '';
  const r = await zApi('/accounts?limit=200'); const a = lijstVan(r.j).find(x => /mail|gmail|google|outlook|imap/i.test(String(x.platform || x.type || '')) && /@/.test(String(x.username || x.email || '')));
  return a ? String(idVan(a) || '') : '';
}

// ---------- poort per mailbox (alle stromen samen, ook lib/clubwerf.js) ----------
export async function poort({ aan, stroom: s = '' } = {}) {
  if (aan && await geblokkeerd(aan)) return { ok: false, fout: 'geblokkeerd (zei ergens stop)' };
  const d = N(await kv.get('mlm:box:d:' + dagUTC()).catch(() => 0)), u = N(await kv.get('mlm:box:u:' + uurUTC()).catch(() => 0)), hb = N(await kv.get('mlm:box:hb:' + uurUTC()).catch(() => 0));
  if (d >= BOX.perDag) return { ok: false, fout: 'mailbox vol vandaag (' + d + ')', vol: true };
  if (u >= BOX.perUur) return { ok: false, fout: 'mailbox vol dit uur (' + u + ')', vol: true };
  if (hb >= 6) return { ok: false, fout: hb + ' bounces dit uur: pauze tot het volgende uur', vol: true };
  return { ok: true, dag: d, uur: u, stroom: s };
}
export async function verzonden() { try { for (const [k, ex] of [['mlm:box:d:' + dagUTC(), 2 * 86400], ['mlm:box:u:' + uurUTC(), 7200]]) { await kv.raw(['INCR', k]); await kv.raw(['EXPIRE', k, String(ex)]); } } catch (e) {} }
async function bounceTel() { try { const k = 'mlm:box:hb:' + uurUTC(); await kv.raw(['INCR', k]); await kv.raw(['EXPIRE', k, '7200']); } catch (e) {} }
export async function verstuurGmail({ aan, onderwerp, tekst, stop, fromName = 'Henkjan de Krijger', metadata = {}, antwoordOp }) {
  const p = await poort({ aan }); if (!p.ok) return { ok: false, fout: p.fout, vol: p.vol };
  const acc = await zAccount(); if (!acc) return { ok: false, fout: 'geen mailbox gekoppeld in Zernio' };
  const body = { accountId: acc, to: [{ email: aan }], fromName, subject: onderwerp, text: tekst, trackReplies: true, metadata, headers: stop ? { 'List-Unsubscribe': '<' + stop + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined };
  if (antwoordOp) body.replyToMessageId = antwoordOp;
  const r = await zApi('/email/messages', { method: 'POST', body });
  if (!r.ok) return { ok: false, status: r.status, vol: r.status === 429, fout: 'zernio ' + r.status + ' ' + String((r.j && (r.j.error && (r.j.error.code || r.j.error.message) || r.j.message)) || '').slice(0, 80) };
  await verzonden(); return { ok: true, id: String(idVan(r.j) || '') };
}

// ---------- post lezen ----------
const schoon = t => String(t || '').replace(/<br\s*\/?>|<\/p>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').split(/\n(?:op .{5,80} schreef|on .{5,80} wrote|-----|van:|from:)/i)[0].split('\n').filter(r => !/^\s*>/.test(r)).join('\n').replace(/[ \t]+/g, ' ').trim().slice(0, 600);
export function soortAntwoord(t) {
  const s = String(t || '').toLowerCase();
  if (/automatisch|afwezig|out of office|auto-?reply|met vakantie|niet aanwezig/.test(s) && s.length < 2500) return 'afwezig';
  if (/afmelden|uitschrijven|haal (me|mij) (eraf|van)|geen (mail|e-mail) meer|niet meer (mailen|op de lijst)|verwijder|\bnee\b|liever niet|unsubscribe/.test(s)) return 'stop';
  if (/\bja\b|graag|blijf|houd me|hou me|leuk|natuurlijk|zeker|prima|\byes\b/.test(s)) return 'ja';
  return 'anders';
}
const vanAdres = x => (String((x && (x.from && (x.from.email || x.from.address || x.from)) || x.sender || '')).toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/) || [''])[0];
async function leesPost(s, D) {
  const acc = await zAccount(); if (!acc) return { gelezen: false };
  const toks = ((await kv.raw(['LRANGE', 'mlm:' + s + ':gestuurd', '-400', '-1']).catch(() => [])) || []), open = [];
  for (const t of toks) { const a = await adres(t); if (a && a.vo && Date.now() - a.vo < 21 * 86400000 && !a.antw && !a.bo && !a.ja && !a.stop) open.push(a); }
  const uit = { gelezen: true, antwoord: 0, bounce: 0 }, na = new Date(Date.now() - 22 * 86400000).toISOString();
  const zoek = async q => { const r = await zApi('/email/messages?accountId=' + encodeURIComponent(acc) + '&after=' + encodeURIComponent(na) + '&limit=50&searchQueryNative=' + encodeURIComponent(q)); return r.ok ? lijstVan(r.j) : []; };
  for (let i = 0; i < open.length; i += 15) { const deel = open.slice(i, i + 15); const L = await zoek('from:(' + deel.map(a => a.m).join(' OR ') + ')');
    for (const a of deel) { const m = L.find(x => vanAdres(x) === a.m); if (!m) continue;
      let t = m.text || m.snippet || m.body || ''; if (!m.text && idVan(m)) { const r = await zApi('/email/messages/' + encodeURIComponent(idVan(m)) + '?accountId=' + encodeURIComponent(acc) + '&clean=true'); const x = r.ok ? (r.j.message || r.j.data || r.j) : {}; t = (x.clean && x.clean.text) || x.text || x.html || t; }
      const soort = soortAntwoord(schoon(t)); if (soort === 'afwezig') continue;
      a.antw = { soort, t: schoon(t).slice(0, 300), at: Date.now() }; uit.antwoord++; await tel(s, 'antw-' + soort); await arm(s, a.v, 'antwoord'); await bak(s, a.b, 'antwoord');
      if (soort === 'ja') await zegJa(s, a, 'antwoord', D); else if (soort === 'stop') await zegStop(s, a); else await bewaar(a);
      await kv.raw(['RPUSH', 'mlm:' + s + ':antw', a.tok]).catch(() => {}); } }
  const b = await zoek('from:(mailer-daemon OR postmaster) newer_than:3d'); const bs = JSON.stringify(b).toLowerCase();
  for (const a of open) if (!a.antw && !a.bo && bs.includes(a.m)) { a.bo = Date.now(); uit.bounce++; await bewaar(a); await tel(s, 'bounce'); await arm(s, a.v, 'bounce'); await bak(s, a.b, 'bounce'); await blokkeer(a.m); if (Date.now() - a.vo < 3600e3) await bounceTel(); }
  return uit;
}
export async function zegJa(s, a, hoe, D) {
  if (a.ja) return { al: true }; a.ja = Date.now(); a.jaHoe = hoe; await bewaar(a); await tel(s, 'ja'); await arm(s, a.v, 'ja'); await bak(s, a.b, 'ja');
  D = D || await stroom(s); let r = {}; try { r = D.bijJa ? await D.bijJa(a) : {}; } catch (e) { r = { fout: String(e.message).slice(0, 60) }; }
  a.gevolg = r; await bewaar(a); return r;
}
export async function zegStop(s, a) { if (a.stop) return; a.stop = Date.now(); await bewaar(a); await tel(s, 'stop'); await arm(s, a.v, 'stop'); await bak(s, a.b, 'stop'); await blokkeer(a.m); }
export async function zie(s, a) { if (a.zie) return; a.zie = Date.now(); await bewaar(a); await tel(s, 'zie'); await arm(s, a.v, 'zie'); await bak(s, a.b, 'zie'); }

// ---------- leren ----------
export async function leerMoment(s, R, D) {
  const S = await armStand(s, R), k = R.armen.map(i => 'o' + i); if (!k.every(x => N(S[x].verstuurd) >= 20)) return null;
  const P = kansSlechtst(S), [sl, p] = Object.entries(P).sort((a, b) => b[1] - a[1])[0];
  const genoeg = k.every(x => N(S[x].verstuurd) >= 60), r = x => N(S[x].ja) / Math.max(1, N(S[x].verstuurd));
  const weg = p >= 0.8 ? sl : genoeg ? k.slice().sort((a, b) => r(a) - r(b))[0] : null; if (!weg || R.volgende >= pool(D, R).length) return null;
  const blijf = k.find(x => x !== weg); R.armen = [N(blijf.slice(1)), R.volgende]; R.volgende++;
  const g = { dag: dagNL(), weg, blijf, kansSlechtst: P[weg], cijfers: Object.fromEntries(k.map(x => [x, N(S[x].ja) + ' ja op ' + N(S[x].verstuurd)])), nieuw: 'o' + R.armen[1] };
  R.gedaan = [...(R.gedaan || []), g].slice(-30); await kv.raw(['RPUSH', 'mlm:' + s + ':lessen', JSON.stringify(g)]).catch(() => {}); return g;
}
async function volume(s, R) {
  let V = 0, B = 0, A = 0; for (let i = 0; i < 7; i++) { const t = await hlees('mlm:' + s + ':tel:' + dagNL(Date.now() - i * 864e5)); V += N(t.verstuurd); B += N(t.bounce); A += N(t.stop); }
  if (V < 40) return null; const oud = R.perDag;
  if (B / V >= 0.08 || A / V >= 0.05) { R.perDag = Math.max(10, Math.floor(R.perDag / 2)); R.knopAt = Date.now(); }
  else if (B / V < 0.05 && A / V < 0.03 && Date.now() - N(R.knopAt) > 2 * 86400000 && R.perDag < R.max) { R.perDag = Math.min(R.max, R.perDag + 10); R.knopAt = Date.now(); }
  return oud !== R.perDag ? 'volume ' + oud + ' naar ' + R.perDag + ' per dag (' + B + ' bounces, ' + A + ' stops op ' + V + ')' : null;
}
async function logRegel(tekst, wie) { try { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: new Date().toISOString(), wie, tekst: String(tekst).slice(0, 900) })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } catch (e) {} }

// ---------- de ronde (cron elk uur: /api/post?op=mailmind&ronde=1) ----------
export async function wachtOp(s, R, D) { const w = []; if (!D.LIVE || !R.aan) w.push('Henkjans verstuur (LIVE in de stroom en aan)'); if (D.kanaal === 'gmail') { if (!ZK()) w.push('ZERNIO_API_KEY in Vercel'); else if (!(await zAccount())) w.push('mailbox in Zernio'); } if (!Object.values(await bakken(s)).some(b => b.rij)) w.push('adressen in de bakken'); return w; }
export async function rondeStroom(s, { nu = Date.now(), droog = false } = {}) {
  const D = await stroom(s), R = await regels(s), w = await wachtOp(s, R, D); if (w.length && !droog) return { ok: true, wacht: w };
  const uur = uurNL(nu), [van, tot] = D.uren || [9, 21]; if (!droog && (uur < van || uur >= tot)) return { ok: true, rust: uur + 'u NL' };
  const uit = { ok: true, verstuurd: 0, fouten: [] };
  if (!droog) { uit.post = await leesPost(s, D).catch(e => ({ fout: String(e.message).slice(0, 80) }));
    if ((await kv.raw(['SET', 'mlm:' + s + ':dag:' + dagNL(nu), '1', 'NX', 'EX', '90000']).catch(() => null)) === 'OK') { uit.volume = await volume(s, R); await zetRegels(s, R);
      const g = await hlees('mlm:' + s + ':tel:' + dagNL(nu - 864e5)); if (N(g.verstuurd) || N(g.ja)) await logRegel('Mailmind ' + s + ' gisteren: ' + N(g.verstuurd) + ' verstuurd, ' + N(g.ja) + ' ja, ' + N(g.stop) + ' stop, ' + N(g.bounce) + ' bounces' + (uit.volume ? '; ' + uit.volume : ''), (D.wie || 'post') + '-mailmind'); } }
  const vandaag = await hlees('mlm:' + s + ':tel:' + dagNL(nu));
  let ruimte = Math.max(0, Math.min(R.perUur, Math.ceil((R.perDag - N(vandaag.verstuurd)) / Math.max(1, tot - uur))));
  const S = await armStand(s, R), B = await bakken(s), kansen = Object.keys(B).filter(b => B[b].rij > 0), ctx = D.context ? await D.context().catch(() => ({})) : {};
  if (droog) { const keuze = {}; for (let i = 0; i < 200; i++) { const b = kiesBak(B, kansen, D.voorkennis); keuze[b] = N(keuze[b]) + 1; } return { ...uit, zou: ruimte, bakKeuzeOp200: keuze, regels: R }; }
  let P = null; try { P = await import('./postlus.js'); } catch (e) {}
  while (ruimte > 0 && kansen.length) {
    const b = kiesBak(B, kansen, D.voorkennis); const x = await kv.raw(['LPOP', 'mlm:' + s + ':b:' + b]).catch(() => null);
    if (!x) { kansen.splice(kansen.indexOf(b), 1); continue; } let a; try { a = JSON.parse(x); } catch (e) { continue; }
    if (await geblokkeerd(a.m)) { await tel(s, 'overgeslagen'); continue; }
    let tok = ''; for (let i = 0; i < 5; i++) { tok = randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, 'x').slice(0, 11); if (!N(await kv.raw(['HEXISTS', 'mlm:a', tok]).catch(() => 1))) break; }
    const v = kiesArm(R, S), m = D.mail(a, { v: pool(D, R)[N(v.slice(1))] || D.varianten[0], tok, ctx });
    const g = P ? await P.meld({ project: s, doel: D.doel, aan: a.m, soort: D.soort || 'anders', taal: D.taal || 'nl', onderwerp: m.onderwerp, variant: v, lessen: 'doel-een-zin,kort,recht-voor-zn-raap,bereikbaar,alleen-echte-feiten', wie: 'mailmind' }).catch(() => null) : null;
    const r = await verstuurGmail({ aan: a.m, onderwerp: m.onderwerp, tekst: m.tekst, stop: m.stop, fromName: D.fromName, metadata: { stroom: s, tok } });
    if (!r.ok) { if (!/geblokkeerd/.test(r.fout)) await kv.raw(['LPUSH', 'mlm:' + s + ':b:' + b, x]); uit.fouten.push(r.fout); if (g && g.id) await P.uitkomst({ id: g.id, uitkomst: 'geen', toelichting: 'niet verstuurd: ' + r.fout }).catch(() => {}); if (r.vol || !/geblokkeerd/.test(r.fout)) break; continue; }
    if (g && g.id) await P.uitkomst({ id: g.id, uitkomst: 'verstuurd' }).catch(() => {});
    Object.assign(a, { s, tok, v, vo: nu, zid: r.id, pid: g && g.id }); await bewaar(a); await kv.raw(['RPUSH', 'mlm:' + s + ':gestuurd', tok]);
    await tel(s, 'verstuurd', 1, nu); await arm(s, v, 'verstuurd'); await bak(s, b, 'verstuurd'); S[v] = S[v] || {}; S[v].verstuurd = N(S[v].verstuurd) + 1; B[b].verstuurd = N(B[b].verstuurd) + 1; uit.verstuurd++; ruimte--;
    if (N((await hlees('mlm:' + s + ':tot')).verstuurd) % 20 === 0) { const l = await leerMoment(s, R, D); if (l) { uit.geleerd = l; await zetRegels(s, R); await logRegel('Mailmind ' + s + ': variant ' + l.weg + ' eruit (' + l.cijfers[l.weg] + '), ' + l.blijf + ' blijft (' + l.cijfers[l.blijf] + '), ' + l.nieuw + ' erbij', (D.wie || 'post') + '-mailmind'); } }
    await new Promise(z => setTimeout(z, 2500 + Math.random() * 4000));
  }
  await kv.set('mlm:' + s + ':laatste', { at: nu, ...uit }).catch(() => {});
  return uit;
}
export async function ronde(opts = {}) { const uit = {}; for (const s of Object.keys(STROMEN)) { try { uit[s] = await rondeStroom(s, opts); } catch (e) { uit[s] = { fout: String(e.message).slice(0, 120) }; } } return { ok: true, stromen: uit }; }

// ---------- stand ----------
export async function stand(s) {
  const D = await stroom(s), R = await regels(s), tot = await hlees('mlm:' + s + ':tot'), S = await armStand(s, R), V = N(tot.verstuurd), B = await bakken(s);
  const dagen = {}; for (let i = 0; i < 14; i++) { const d = dagNL(Date.now() - i * 864e5), t = await hlees('mlm:' + s + ':tel:' + d); if (Object.keys(t).length) dagen[d] = t; }
  const L = [];
  if (V >= 60 && !N(tot.ja) && !N(tot.antwoord)) L.push({ lek: 'niemand zegt ja of antwoordt', cijfers: V + ' mails, 0 ja', gedaan: 'varianten wisselen elke 20 mails, bakken met Thompson', oordeel: 'volgende 20 mails' });
  if (V >= 40 && N(tot.bounce) / V >= 0.08) L.push({ lek: 'veel bounces', cijfers: tot.bounce + ' op ' + V, gedaan: 'volume automatisch gehalveerd, bounce-adressen geblokkeerd', oordeel: 'volgende dag' });
  if (N(tot.zie) >= 20 && N(tot.ja) / Math.max(1, N(tot.zie)) < 0.3) L.push({ lek: 'mensen openen de knoppagina maar zeggen geen ja', cijfers: tot.zie + ' bekeken, ' + N(tot.ja) + ' ja', gedaan: 'nog niets: knoppagina nakijken', oordeel: 'na 20 keer bekeken' });
  const P = pool(D, R), perVariant = Object.fromEntries(Object.entries(S).map(([k, x]) => [k, { onderwerp: (P[N(k.slice(1))] || {}).o, ...x, jaPct: x.verstuurd ? Math.round(1000 * N(x.ja) / x.verstuurd) / 10 : 0 }]));
  const perBak = Object.fromEntries(Object.entries(B).map(([b, x]) => [b, { ...x, jaPct: x.verstuurd ? Math.round(1000 * N(x.ja) / x.verstuurd) / 10 : null }]));
  return { ok: true, stroom: s, doel: D.doel, live: !!(D.LIVE && R.aan), wachtOp: await wachtOp(s, R, D), regels: R, inRij: Object.values(B).reduce((a, x) => a + N(x.rij), 0), totaal: tot, perVariant,
    kansSlechtst: R.armen.every(i => N(S['o' + i] && S['o' + i].verstuurd) > 0) ? kansSlechtst(S) : undefined, varianten: P.map((v, i) => ({ id: 'o' + i, onderwerp: v.o })), perBak,
    mailbox: { vandaag: N(await kv.get('mlm:box:d:' + dagUTC()).catch(() => 0)), max: BOX.perDag, ditUur: N(await kv.get('mlm:box:u:' + uurUTC()).catch(() => 0)), maxUur: BOX.perUur }, geblokkeerd: N(await kv.raw(['SCARD', 'mlm:af']).catch(() => 0)),
    lessen: ((await kv.raw(['LRANGE', 'mlm:' + s + ':lessen', '-10', '-1']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return x; } }).reverse(), dagen, lekken: L, laatsteRonde: await kv.get('mlm:' + s + ':laatste').catch(() => null) };
}

// ---------- eindpunt /api/post?op=mailmind (beheer alleen op de beschermde host) ----------
export async function mailmindOp({ req, res, q }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || ''), beschermd = /\.vercel\.app$/i.test(host), ua = String(req.headers['user-agent'] || '');
  const cron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(ua);
  if (!beschermd && !cron) return res.status(404).send('Niet gevonden');
  if (q.get('ronde') === '1') return res.status(200).json(q.get('s') ? await rondeStroom(q.get('s'), { droog: q.get('droog') === '1' }) : await ronde({ droog: q.get('droog') === '1' }));
  if (!beschermd) return res.status(404).send('Niet gevonden');
  const s = q.get('s');
  if (!s) { const o = {}; for (const k of Object.keys(STROMEN)) { try { const x = await stand(k); o[k] = { doel: x.doel, live: x.live, wachtOp: x.wachtOp, inRij: x.inRij, totaal: x.totaal, perDag: x.regels.perDag, lekken: x.lekken }; } catch (e) { o[k] = { fout: String(e.message).slice(0, 80) }; } }
    return res.status(200).json({ ok: true, naam: 'Mailmind', stromen: o, uitleg: 'per stroom: ?op=mailmind&s=<stroom>; ronde ?ronde=1 (&droog=1)' }); }
  if (!STROMEN[s]) return res.status(404).json({ fout: 'onbekende stroom', stromen: Object.keys(STROMEN) });
  if (q.get('zet') === '1') { const R = await regels(s), ok = []; // alleen op Henkjans woord (in de chat)
    if (q.has('aan')) { R.aan = q.get('aan') === '1'; ok.push('aan=' + R.aan); } if (q.has('perDag')) { R.perDag = Math.max(1, Math.min(R.max, N(q.get('perDag')) || R.perDag)); ok.push('perDag=' + R.perDag); }
    await zetRegels(s, R); return res.status(200).json({ ok: true, gezet: ok, regels: R }); }
  if (q.get('uitdager')) { const R = await regels(s); let v; try { v = JSON.parse(q.get('uitdager')); } catch (e) { return res.status(400).json({ fout: 'uitdager={"o":"onderwerp","t":"tekst met {aanhef} {ja} {stop}"}' }); }
    if (!v || !v.o || !v.t || !/\{ja\}/.test(v.t) || !/\{stop\}/.test(v.t) || String(v.o).length > 60 || /—|–/.test(v.o + v.t)) return res.status(400).json({ fout: 'onderwerp hooguit 60 tekens, tekst met {ja} en {stop}, geen gedachtestreepjes' });
    R.extra = [...(R.extra || []), { o: String(v.o), t: String(v.t).slice(0, 1400), gift: v.gift === 'g1' ? 'g1' : '' }].slice(-20); await zetRegels(s, R); return res.status(200).json({ ok: true, varianten: pool(await stroom(s), R).length }); }
  if (q.get('leer') === '1') { const ids = ((await kv.raw(['LRANGE', 'mlm:' + s + ':antw', '-40', '-1']).catch(() => [])) || []), l = []; for (const t of ids) { const a = await adres(t); if (a && a.antw) l.push({ variant: a.v, bak: a.b, soort: a.antw.soort, tekst: a.antw.t }); } return res.status(200).json({ ok: true, antwoorden: l.reverse(), stand: await stand(s) }); }
  return res.status(200).json(await stand(s));
}
