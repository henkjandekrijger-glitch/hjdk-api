// De takenlijst van het dashboard: Henkjans interface in plaats van de losse chats (Henkjan 27 nov 2026: "Dat wordt dit dus mn interface en
// niet meer de betreffende chat ? Dan moet je wel een betere interface maken bijv een betere lijst . En ik moet lijst makkelijk kunnen
// opschonen . En kun je account laten kiezen waar dan tokens zijn en altijd zorgen dat we juiste model pakken en dus tokens besparen").
// Drie dingen in één module:
// 1. TAKEN: Henkjan typt wat er moet gebeuren, een oppakker per Claude-account pakt het op (pak), vraagt zijn ja met een link (vraag + toon)
//    en meldt het af (klaar). Een taak zonder hartslag van 90 minuten neemt een ander account over: zo maakt het niet uit welk account vol zit.
// 2. BESLUITEN ("ik wil mijn eigen beslissingen gemonitord hebben onder motorkap dus is mijn output resulterend in gewenste outcome en wat
//    leert het dashboard daarvan"): elke taak en elk antwoord van Henkjan wordt vastgelegd, met hoe lang het op hem wachtte en, zodra de taak
//    af is, het stuk output waar het in uitkwam. Het oordeel raak of mis komt van die output (lib/output.js), nooit van de taak zelf.
// 3. GEWOONTES ("dashboard leert van mijn gedrag dus als ik iets vaker vraag wordt het daarna pro actief gedaan en gemeld"): elke chat en het
//    vangnet melden wat Henkjan vroeg (vroeg). Drie keer hetzelfde binnen 14 dagen = het dashboard zet het daarna zelf als taak klaar, op het
//    ritme waarin hij het vroeg, en meldt de uitkomst in de lijst. Eén tik zet het uit. De harde grenzen blijven: geld uitgeven, een campagne
//    stoppen of wijzigen, mail versturen en iets live zetten wat uit stond gebeurt nooit zonder zijn ja, ook niet uit gewoonte.
const TAKEN = 'mm:dash:taken', BESLUIT = 'mm:dash:besluit', GEWOON = 'mm:dash:gewoon', ACCS = 'mm:dash:acc', WEG = 'mm:dash:weg', CHATS = 'mm:dash:chats', SLOT = 'mm:dash:taakslot:';
const HOST = 'https://hjdk-api-henq.vercel.app';
export const ACCOUNTS = { 'claude-1': 'Claude 1', 'claude-2': 'Claude 2', chatgpt: 'ChatGPT (met de hand)' };
export const ZWAARTE = { licht: 'Licht: snel en goedkoop', gewoon: 'Gewoon', zwaar: 'Zwaar: het beste model' };
export const MODEL = { licht: 'haiku', gewoon: 'sonnet', zwaar: 'opus' }; // de oppakker geeft de taak aan een subagent met dit model
export const DREMPEL = 3, VENSTER = 14; // drie keer gevraagd binnen 14 dagen: daarna uit zichzelf
export const STIL_MIN = 90;             // minuten zonder hartslag: een ander account neemt de taak over
export const STIL_DAGEN = 3;            // een taak die zo lang wacht, vraagt of hij weg mag (Henkjan 21 nov: "3 dagen !")
const TE_ZIEN = /\b(posts?|mails?|advertenties?|creatives?|pagina'?s?|preview|concept(en)?|ontwerp|teksten?|inzage|bekijk)/i;
const SLEUTELS = ['taak', 'pak', 'taakzet', 'antwoord', 'weg', 'terug', 'vraag', 'gewoonte', 'vangnet', 'aanzet'];
export const isTaken = b => !!b && typeof b === 'object' && SLEUTELS.some(k => b[k] != null);

const kort = (x, n) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, n);
const rid = () => Math.random().toString(36).slice(2, 8).padEnd(6, '0');
const pid = x => String(x || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
const https = x => (/^https:\/\/[^\s"<>]{4,300}$/.test(String(x || '')) ? String(x) : '');
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const uren = ms => Math.max(0, Math.round(ms / 36e4) / 10);
const lijstVan = x => (Array.isArray(x) ? x : (x == null || x === '' ? [] : [x]));
async function alles(kv, key) { let h = []; try { h = (await kv.raw(['HGETALL', key])) || []; } catch (e) {} if (!Array.isArray(h)) h = Object.entries(h).flat(); const uit = {}; for (let i = 0; i + 1 < h.length; i += 2) { try { const v = JSON.parse(h[i + 1]); if (v && typeof v === 'object') uit[String(h[i])] = v; } catch (e) {} } return uit; }
const zet = (kv, key, id, v) => kv.raw(['HSET', key, id, JSON.stringify(v)]);
const wis = (kv, key, id) => Promise.resolve(kv.raw(['HDEL', key, id])).catch(() => null);
const slotWeg = (kv, id) => Promise.resolve(kv.raw(['DEL', SLOT + id])).catch(() => null);

// Alles wat de pagina en de oppakkers nodig hebben. Ruimt zelf op: klaar en weggehaald na een dag, verborgen rijen na 14 dagen, besluiten na 60.
export async function leesTaken(kv, nu = Date.now()) {
  const [t, b, g, a, w] = await Promise.all([alles(kv, TAKEN), alles(kv, BESLUIT), alles(kv, GEWOON), alles(kv, ACCS), alles(kv, WEG)]);
  const op = [], taken = [], besluiten = [], weg = {};
  for (const [id, x] of Object.entries(t)) { if ((x.status === 'klaar' && nu - Date.parse(x.klaarT || x.t) > 864e5) || (x.status === 'weg' && nu - Date.parse(x.wegT || x.t) > 864e5)) op.push(wis(kv, TAKEN, id)); else taken.push(x); }
  for (const [id, x] of Object.entries(b)) { if (nu - Date.parse(x.t) > 60 * 864e5) op.push(wis(kv, BESLUIT, id)); else besluiten.push(x); }
  for (const [k, x] of Object.entries(w)) { if (nu - Date.parse(x.t) > 14 * 864e5) op.push(wis(kv, WEG, k)); else weg[k] = x.t; }
  await Promise.all(op);
  taken.sort((x, y) => String(x.t).localeCompare(String(y.t))); besluiten.sort((x, y) => String(y.t).localeCompare(String(x.t)));
  const gewoon = Object.values(g).map(h => Object.assign(h, { recent: (h.keren || []).filter(k => nu - Date.parse(k.t) < VENSTER * 864e5).length })).sort((x, y) => (y.status === 'proactief') - (x.status === 'proactief') || y.recent - x.recent);
  return { taken, besluiten, gewoon, accounts: a, weg };
}

// Wat Henkjan vroeg telt mee voor een gewoonte. Dezelfde bron binnen 6 uur telt één keer (een chat schrijft elke beurt zijn stand).
function ritmeVan(keren) { const t = keren.map(k => Date.parse(k.t)).sort((a, b) => a - b), g = []; for (let i = 1; i < t.length; i++) g.push((t[i] - t[i - 1]) / 864e5); g.sort((a, b) => a - b); return Math.max(1, Math.min(7, Math.round(g[Math.floor(g.length / 2)] || 1))); }
export async function telVraag(kv, o, nu = Date.now()) {
  const g = await alles(kv, GEWOON), wat = kort(o.wat, 120), sleutel = norm(wat), nuIso = new Date(nu).toISOString();
  let h = (o.gewoonte && g[String(o.gewoonte)]) || (sleutel && Object.values(g).find(x => norm(x.wat) === sleutel));
  if (!h) { if (sleutel.length < 6) return { ok: false, fout: 'vraag: {"wat":"<wat Henkjan vroeg in 3 tot 8 woorden, algemeen verwoord>","project":"<id>","citaat":"<zijn woorden>","bron":"<chat>"}' }; h = { id: rid(), wat, project: pid(o.project), status: 'telt', keren: [], t: nuIso }; }
  const t = /^\d{4}-\d{2}-\d{2}T/.test(String(o.t || '')) && Date.parse(o.t) <= nu ? new Date(Date.parse(o.t)).toISOString() : nuIso, bron = kort(o.bron, 60);
  if (!(h.keren || []).some(k => k.bron === bron && Math.abs(Date.parse(k.t) - Date.parse(t)) < 6 * 36e5)) h.keren = (h.keren || []).concat([{ t, bron, citaat: kort(o.citaat, 160) }]).sort((x, y) => String(x.t).localeCompare(String(y.t))).slice(-12);
  const recent = h.keren.filter(k => nu - Date.parse(k.t) < VENSTER * 864e5);
  if (h.status === 'telt' && recent.length >= DREMPEL) { h.status = 'proactief'; h.sinds = nuIso; h.ritme = ritmeVan(recent); }
  if (!h.project && o.project) h.project = pid(o.project);
  await zet(kv, GEWOON, h.id, h);
  return { ok: true, gewoonte: h.id, status: h.status, keren: recent.length, nodig: DREMPEL };
}

async function besluitBij(kv, x, velden) { for (const id of x.bes || []) { let h = null; try { const r = await kv.raw(['HGET', BESLUIT, id]); h = r ? JSON.parse(r) : null; } catch (e) {} if (h) await zet(kv, BESLUIT, id, Object.assign(h, velden)); } }

// Eén ingang voor alles wat de lijst verandert. wie = 'Henkjan' voor wat hij zelf op de pagina doet, anders de chat of het account.
export async function zetTaken(kv, b, wie = '', nu = Date.now()) {
  const nuIso = new Date(nu).toISOString(), uit = { ok: true }, vanH = wie === 'Henkjan';
  if (b.taak != null) {
    const o = typeof b.taak === 'string' ? { tekst: b.taak } : (b.taak || {}), tekst = kort(o.tekst, 800), zelf = vanH || /henkjan/i.test(String(o.van || ''));
    if (tekst.length < 4) return { ok: false, fout: 'taak: {"tekst":"wat moet er gebeuren","project":"<id>","account":"claude-1|claude-2|chatgpt","zwaarte":"licht|gewoon|zwaar","van":"henkjan als hij het vroeg"}' };
    const x = { id: rid(), t: nuIso, tekst, project: pid(o.project), account: ACCOUNTS[o.account] ? o.account : '', zwaarte: ZWAARTE[o.zwaarte] ? o.zwaarte : '', status: 'wacht', bron: zelf ? 'henkjan' : 'agent', door: '', wie: kort(wie, 40), bes: [] };
    if (zelf) { const bs = { id: rid(), t: nuIso, soort: 'taak', tekst, project: x.project, taak: x.id }; x.bes.push(bs.id); await zet(kv, BESLUIT, bs.id, bs); }
    await zet(kv, TAKEN, x.id, x); uit.taak = x.id; uit.status = 'wacht';
  }
  if (b.pak != null) {
    const acc = String((b.pak && b.pak.account) || ''), max = Math.max(1, Math.min(3, Number(b.pak && b.pak.max) || 3));
    if (!ACCOUNTS[acc] || acc === 'chatgpt') return { ok: false, fout: 'pak: {"account":"claude-1|claude-2","max":3}' };
    const s = await leesTaken(kv, nu), een = b.pak.id ? String(b.pak.id) : '';
    for (const g of een ? [] : s.gewoon) if (g.status === 'proactief' && (!g.laatst || nu - Date.parse(g.laatst) >= (g.ritme || 1) * 864e5 - 2 * 36e5) && !s.taken.some(x => x.gewoonte === g.id && ['wacht', 'bezig', 'jij'].includes(x.status))) {
      if (!(await Promise.resolve(kv.raw(['SET', 'mm:dash:gewoonslot:' + g.id, acc, 'NX', 'EX', '3600'])).catch(() => 'geen slot'))) continue; // twee accounts kijken tegelijk: één maakt de taak
      const x = { id: rid(), t: nuIso, tekst: g.wat + ' (uit jezelf doen en melden: Henkjan vroeg dit ' + g.recent + ' keer)', project: g.project || '', account: '', zwaarte: '', status: 'wacht', bron: 'gewoonte', gewoonte: g.id, door: '', bes: [] };
      await zet(kv, TAKEN, x.id, x); s.taken.push(x); const h = Object.assign({}, g, { laatst: nuIso }); delete h.recent; await zet(kv, GEWOON, g.id, h);
    }
    const kan = s.taken.filter(x => (x.status === 'wacht' || (x.status === 'bezig' && nu - Date.parse(x.hart || x.pakT || x.t) > STIL_MIN * 6e4)) && (!x.account || x.account === acc) && (!een || x.id === een)).sort((x, y) => (y.antwoord ? 1 : 0) - (x.antwoord ? 1 : 0) || String(x.t).localeCompare(String(y.t)));
    const gepakt = [];
    for (const x of kan) { if (gepakt.length >= max) break;
      const slot = await Promise.resolve(kv.raw(['SET', SLOT + x.id, acc, 'NX', 'EX', String(STIL_MIN * 60)])).catch(() => 'geen slot'); if (!slot) continue; // een ander account was net eerder
      if (x.status === 'bezig') x.overgenomen = x.door;
      Object.assign(x, { status: 'bezig', door: acc, pakT: nuIso, hart: nuIso }); await zet(kv, TAKEN, x.id, x);
      gepakt.push({ id: x.id, tekst: x.tekst, project: x.project, zwaarte: x.zwaarte, model: MODEL[x.zwaarte] || '', bron: x.bron, gewoonte: x.gewoonte || '', vraag: x.vraag || '', antwoord: x.antwoord || '', overgenomen: x.overgenomen || '' }); }
    if (!een) await zet(kv, ACCS, acc, { t: nuIso, gepakt: gepakt.length, open: kan.length - gepakt.length });
    uit.account = acc; uit.taken = gepakt; uit.werkwijze = HOST + '/api/mm/dashboard?vorm=taken&account=' + acc;
  }
  if (b.taakzet != null) {
    const o = b.taakzet || {}, x = (await alles(kv, TAKEN))[String(o.id || '')]; if (!x) return { ok: false, fout: 'taakzet: onbekende taak ' + kort(o.id, 12) };
    if (o.project != null) x.project = pid(o.project);
    if (ZWAARTE[o.zwaarte]) x.zwaarte = o.zwaarte;
    if (o.vroeg) { const u = await telVraag(kv, { wat: o.vroeg, project: x.project, bron: 'taak-' + x.id, citaat: x.tekst, t: x.t, gewoonte: o.gewoonte }, nu); if (u.ok && !x.gewoonte) x.soort = u.gewoonte; uit.gewoonte = u; }
    if (o.hart) { x.hart = nuIso; await Promise.resolve(kv.raw(['SET', SLOT + x.id, x.door || '', 'EX', String(STIL_MIN * 60)])).catch(() => null); }
    if (o.vraag) { const v = kort(o.vraag, 400), toon = https(o.toon);
      if (TE_ZIEN.test(v) && !toon) return { ok: false, fout: 'vraag: Henkjan moet dit kunnen bekijken. Zet het op een link die hij kan openen en geef die mee als "toon":"https://...". Nooit "kan ik niet laten zien".' };
      Object.assign(x, { status: 'jij', vraag: v, vraagT: nuIso, keuzes: lijstVan(o.keuzes).map(k => kort(k, 24)).filter(Boolean).slice(0, 3), toon, antwoord: '' }); await slotWeg(kv, x.id); }
    if (o.terug) { Object.assign(x, { status: 'wacht', door: '', reden: kort(o.reden, 200) }); await slotWeg(kv, x.id); }
    if (o.klaar) { const res = kort(o.resultaat, 500); if (res.length < 10) return { ok: false, fout: 'taakzet klaar: geef het resultaat in gewone taal ("resultaat"), een link als er iets te zien is ("link") en het id van de output die je meldde ("output")' };
      Object.assign(x, { status: 'klaar', klaarT: nuIso, resultaat: res, link: https(o.link), output: kort(o.output, 12) }); await slotWeg(kv, x.id);
      await besluitBij(kv, x, { klaarT: nuIso, resultaat: res, link: x.link, output: x.output, project: x.project }); }
    await zet(kv, TAKEN, x.id, x); uit.taak = x.id; uit.status = x.status;
  }
  if (b.antwoord != null) {
    const o = b.antwoord || {}, tekst = kort(o.tekst, 400); if (!o.weg && !tekst) return { ok: false, fout: 'antwoord: tekst ontbreekt' };
    if (o.id) { // antwoord op een vraag van een taak: de taak gaat terug in de rij, met het antwoord erbij
      const x = (await alles(kv, TAKEN))[String(o.id)]; if (!x || x.status !== 'jij') return { ok: false, fout: 'antwoord: die vraag staat er niet meer' };
      if (o.weg) Object.assign(x, { was: 'jij', status: 'weg', wegT: nuIso });
      else { const bs = { id: rid(), t: nuIso, soort: 'antwoord', tekst, over: x.vraag, project: x.project, taak: x.id, wachtUur: uren(nu - Date.parse(x.vraagT || x.t)) }; await zet(kv, BESLUIT, bs.id, bs);
        Object.assign(x, { status: 'wacht', antwoord: tekst, antwoordT: nuIso, door: '', bes: (x.bes || []).concat([bs.id]) }); }
      await zet(kv, TAKEN, x.id, x); uit.taak = x.id; uit.status = x.status;
    } else { // antwoord op een vraag van een chat: uit de stand van die chat, als besluit vastgelegd, en als taak verder (behalve bij nee)
      const p = pid(o.project), chat = kort(o.chat, 40), vraag = String(o.vraag || ''), key = p + '|' + chat; let v = null; try { const r = await kv.raw(['HGET', CHATS, key]); v = r ? JSON.parse(r) : null; } catch (e) {}
      const i = v && Array.isArray(v.wacht) ? v.wacht.indexOf(vraag) : -1; if (i < 0) return { ok: false, fout: 'antwoord: die vraag staat er niet meer' };
      v.wacht.splice(i, 1); if (!o.weg) v.beantwoord = [{ vraag: kort(vraag, 240), tekst, t: nuIso }].concat(v.beantwoord || []).slice(0, 5);
      await zet(kv, CHATS, key, v);
      if (!o.weg) { const bs = { id: rid(), t: nuIso, soort: 'antwoord', tekst, over: kort(vraag, 240), project: p, chat, wachtUur: uren(nu - Date.parse(v.t)) };
        if (!/^nee\b/i.test(tekst)) { const x = { id: rid(), t: nuIso, tekst: kort('Henkjan antwoordde "' + tekst + '" op: ' + vraag + ' (chat ' + chat + ').' + (v.volgende ? ' Daarna stond gepland: ' + v.volgende : '') + (v.link ? ' Chat: ' + v.link : ''), 800), project: p, account: '', zwaarte: '', status: 'wacht', bron: 'antwoord', door: '', bes: [bs.id] }; bs.taak = x.id; await zet(kv, TAKEN, x.id, x); uit.taak = x.id; }
        await zet(kv, BESLUIT, bs.id, bs); }
      uit.chat = chat;
    }
  }
  if (b.weg != null) { // opruimen: een taak gaat een dag in de prullenbak, een rij uit een chat of uit de output wordt verborgen tot hij verandert
    const t = await alles(kv, TAKEN); uit.weg = [];
    for (const k of lijstVan(b.weg).map(String).slice(0, 80)) { if (t[k]) { if (t[k].status !== 'weg') { Object.assign(t[k], { was: t[k].status, status: 'weg', wegT: nuIso }); await zet(kv, TAKEN, k, t[k]); await slotWeg(kv, k); } uit.weg.push(k); } else if (/^(chat|out|voorstel)\|.{1,150}$/.test(k)) { await zet(kv, WEG, k, { t: nuIso }); uit.weg.push(k); } }
  }
  if (b.terug != null) { // ongedaan maken
    const t = await alles(kv, TAKEN); uit.terug = [];
    for (const k of lijstVan(b.terug).map(String).slice(0, 80)) { if (t[k] && t[k].status === 'weg') { t[k].status = t[k].was === 'bezig' ? 'wacht' : (t[k].was || 'wacht'); delete t[k].was; delete t[k].wegT; await zet(kv, TAKEN, k, t[k]); uit.terug.push(k); } else if (/^(chat|out|voorstel)\|/.test(k)) { await wis(kv, WEG, k); uit.terug.push(k); } }
  }
  if (b.vraag != null) { const u = await telVraag(kv, b.vraag || {}, nu); if (!u.ok) return u; uit.gewoonte = u; }
  if (b.gewoonte != null) {
    const o = b.gewoonte || {}, h = (await alles(kv, GEWOON))[String(o.id || '')]; if (!h) return { ok: false, fout: 'gewoonte: onbekend id' };
    if (o.uit) { h.status = 'uit'; h.uitT = nuIso; } if (o.aan) { h.status = 'proactief'; h.sinds = h.sinds || nuIso; h.ritme = h.ritme || 1; }
    if (Number(o.ritme) >= 1) h.ritme = Math.min(30, Math.round(Number(o.ritme))); if (o.wat) h.wat = kort(o.wat, 120);
    await zet(kv, GEWOON, h.id, h); uit.gewoonte = { ok: true, gewoonte: h.id, status: h.status };
  }
  if (b.vangnet != null) { const o = b.vangnet || {}, acc = String(o.account || ''); if (!ACCOUNTS[acc]) return { ok: false, fout: 'vangnet: {"account":"claude-1|claude-2","chats":<nagelopen>,"standen":<bijgeschreven>,"fout":"<als je niet bij de chats kon>"}' };
    await zet(kv, ACCS, 'vangnet|' + acc, { t: nuIso, chats: Number(o.chats) || 0, standen: Number(o.standen) || 0, fout: kort(o.fout, 200) }); uit.vangnet = acc; }
  if (b.aanzet != null) { // een account meldt dat zijn oppakker en vangnet aan staan (of uit): alleen dan bewaakt de pagina of ze ook echt lopen
    const o = b.aanzet || {}, acc = String(o.account || ''); if (!ACCOUNTS[acc] || acc === 'chatgpt') return { ok: false, fout: 'aanzet: {"account":"claude-1|claude-2","oppak":true,"vangnet":true} of {"account":"...","uit":true}' };
    if (o.uit) { await Promise.all([wis(kv, ACCS, 'aan|' + acc), wis(kv, ACCS, acc), wis(kv, ACCS, 'vangnet|' + acc)]); uit.aanzet = 'uit'; }
    else { await zet(kv, ACCS, 'aan|' + acc, { t: nuIso, oppak: o.oppak !== false, vangnet: o.vangnet !== false }); uit.aanzet = acc; } }
  return uit;
}

// Besluiten met hun uitkomst: het oordeel komt van de output waar de taak in uitkwam (d = dashData, voor de output per project).
export function besluitStand(s, d) {
  const out = {}; for (const p of (d && d.projecten) || []) for (const it of ((p.output && p.output.items) || [])) out[it.id] = it;
  return s.besluiten.map(b => { const o = b.output && out[b.output], u = o && o.oordeelNu ? o.oordeelNu.uitslag : '';
    const uitslag = u === 'raak' || u === 'mis' ? u : (b.soort === 'antwoord' && /^nee\b/i.test(b.tekst) ? 'nee' : (b.klaarT ? (o ? 'meet nog' : 'gedaan') : 'loopt'));
    return Object.assign({}, b, { uitslag, waarom: o && o.oordeelNu ? o.oordeelNu.waarom : '', intentie: o ? o.intentie : '', oordeel: o ? o.oordeel : '' }); });
}
// Wat het dashboard uit zijn beslissingen en gedrag haalt, in gewone zinnen. Alleen wat de data draagt: geen zin zonder getal eronder.
export function lessen(s, d) {
  const bs = besluitStand(s, d), r = [], raak = bs.filter(b => b.uitslag === 'raak'), mis = bs.filter(b => b.uitslag === 'mis');
  if (raak.length + mis.length) r.push('Van je beslissingen met een meting: ' + raak.length + ' raak, ' + mis.length + ' mis.' + (mis.length ? ' Mis: ' + mis.slice(0, 3).map(b => kort(b.tekst, 70)).join('; ') + '.' : ''));
  const w = bs.filter(b => b.soort === 'antwoord' && b.wachtUur != null).map(b => b.wachtUur).sort((a, b) => a - b);
  if (w.length >= 3) r.push('Een vraag wacht meestal ' + String(w[Math.floor(w.length / 2)]).replace('.', ',') + ' uur op je antwoord (' + w.length + ' antwoorden).');
  const zelf = s.gewoon.filter(g => g.status === 'proactief'); if (zelf.length) r.push('Doet het dashboard nu uit zichzelf: ' + zelf.map(g => g.wat).join('; ') + '.');
  const uit = s.gewoon.filter(g => g.status === 'uit'); if (uit.length) r.push('Niet uit zichzelf doen (Henkjan zette het uit): ' + uit.map(g => g.wat).join('; ') + '.');
  return r;
}

const GRENZEN = 'HARDE GRENZEN, ook bij een taak uit gewoonte: geen geld uitgeven, geen campagne stoppen of starten, geen bod, budget of planning wijzigen, geen mail of post versturen en niets live zetten wat uit stond zonder Henkjans ja. Bereid het dan helemaal voor, zet het op een link die hij kan openen en vraag zijn ja met taakzet vraag + toon. Hooguit $10 per dag per campagne.';
const Z = o => HOST + '/api/mm/dashboard?zet=' + JSON.stringify(o);
// De werkwijze voor de oppakker van één account (geplande taak, elk uur). Staat hier en niet in de geplande taak zelf, zodat elke wijziging overal geldt.
export function takenTekst(s, account, d, een = '') {
  const acc = ACCOUNTS[account] && account !== 'chatgpt' ? account : 'claude-1', open = s.taken.filter(x => x.status === 'wacht' || x.status === 'bezig');
  const regel = x => '- ' + x.id + ' [' + x.status + (x.door ? ' ' + x.door : '') + (x.account ? ', alleen ' + x.account : '') + (x.zwaarte ? ', ' + x.zwaarte : '') + (x.project ? ', ' + x.project : '') + '] ' + kort(x.tekst, 200) + (x.antwoord ? ' | Henkjan antwoordde: ' + x.antwoord + ' (op: ' + kort(x.vraag, 120) + ')' : '');
  const r = ['TAKENLIJST VAN HET DASHBOARD, ' + new Date().toISOString().slice(0, 16) + ' UTC. Jij bent de oppakker van account ' + acc + ' (' + ACCOUNTS[acc] + ').',
    'Lezen en schrijven gaat met de Vercel-tool web_fetch_vercel_url (beschermde host).', '',
    '1. Pak je ' + (een ? 'taak' : 'taken') + ' (heb je dat net al gedaan, sla dit over): ' + Z({ pak: een ? { account: acc, max: 1, id: een } : { account: acc, max: 3 } }),
    '   Krijg je geen taken terug: stop meteen, zonder verder iets te lezen of te schrijven (bespaar tokens).',
    '2. Per taak, in deze volgorde:',
    '   a. Staat er geen project bij, kies het (lijst: ' + HOST + '/api/mm/dashboard?vorm=start) en lees eerst ' + HOST + '/api/mm/dashboard?vorm=bij&project=<id> en de overdracht van dat project.',
    '   b. Staat er geen zwaarte bij, kies die zelf: licht (opzoeken, stand tonen, kleine tekstwijziging), gewoon (het meeste bouwwerk), zwaar (ontwerp, strategie, lastige fout). Meld project en zwaarte: ' + Z({ taakzet: { id: '<id>', project: '<id>', zwaarte: 'licht|gewoon|zwaar', vroeg: '<wat Henkjan hier vraagt in 3 tot 8 woorden, algemeen verwoord; alleen iets wat je ook zonder hem opnieuw kunt doen, zoals een controle, een overzicht of een ronde; weglaten bij een eenmalige bouwopdracht of een antwoord; kies een bestaande omschrijving hieronder als die past>' } }),
    '   c. Geef de taak aan een subagent met het model dat bij de zwaarte hoort (licht = haiku, gewoon = sonnet, zwaar = opus). Heb je geen subagents, doe de taak dan zelf. Zo kost een lichte taak geen zwaar model.',
    '   d. Duurt het langer dan 20 minuten, geef dan elke 20 minuten een hartslag: ' + Z({ taakzet: { id: '<id>', hart: true } }) + ' Na ' + STIL_MIN + ' minuten stilte neemt een ander account de taak over.',
    '   e. Heb je Henkjans ja of een keuze nodig: ' + Z({ taakzet: { id: '<id>', vraag: '<de vraag in één zin>', keuzes: ['Ja', 'Nee'], toon: 'https://<link waarop hij het kan bekijken>' } }) + ' en ga door met de volgende taak. Zijn antwoord komt terug als dezelfde taak met "antwoord".',
    '   f. Klaar: meld eerst de output met intentie bij het project (' + Z({ project: '<id>', output: { wat: '...', intentie: 'welk getal moet bewegen en waarom', metriek: 'nu|opbrengst|kosten|waarde', richting: 'omhoog|omlaag', oordeel: 'JJJJ-MM-DD', link: 'https://...' } }) + ', geeft een output-id terug) en dan: ' + Z({ taakzet: { id: '<id>', klaar: true, resultaat: '<wat er nu is, in gewone taal>', link: 'https://<waar hij het ziet>', output: '<output-id>' } }),
    '   g. Kun je de taak niet doen (geen toegang, onduidelijk): ' + Z({ taakzet: { id: '<id>', terug: true, reden: '<waarom>' } }) + ' of stel de vraag aan Henkjan (e).',
    '3. Schrijf per project waar Henkjan is gebleven (de zet-regel onderaan vorm=bij) en het werklog (/api/mm/handover?log=...&wie=<project>-oppakker).',
    '4. ' + GRENZEN,
    '5. Eén push per afgeronde taak, eerst git pull --rebase, bestanden bij naam. Blijf nooit langer dan 15 minuten hangen op een fout: andere aanpak, of terug met de reden.',
    '6. Er kijkt niemand mee: stel geen vraag in de chat en wacht nergens op. Een vraag aan Henkjan gaat altijd via stap e. Nederlands, kort, zuinig met tokens.', '',
    'OPEN NU (' + open.length + '):'].concat(open.length ? open.map(regel) : ['- niets']);
  if (s.gewoon.length) r.push('', 'WAT HENKJAN VAKER VRAAGT (kies bij "vroeg" een bestaande omschrijving als die past; ' + DREMPEL + ' keer in ' + VENSTER + ' dagen = het dashboard zet het daarna zelf als taak klaar):', ...s.gewoon.slice(0, 20).map(g => '- ' + g.id + ' [' + g.status + ', ' + g.recent + ' keer] ' + g.wat));
  const l = lessen(s, d); if (l.length) r.push('', 'GELEERD VAN HENKJANS BESLISSINGEN (neem mee in je voorstel):', ...l.map(x => '- ' + x));
  return r.join('\n') + '\n';
}
// De werkwijze voor het vangnet (geplande taak, twee keer per dag): chats nalopen die zelf geen stand schreven.
export function vangnetTekst(s, account, d) {
  const acc = ACCOUNTS[account] && account !== 'chatgpt' ? account : 'claude-1', vorige = s.accounts['vangnet|' + acc];
  const r = ['VANGNET VAN HET DASHBOARD, account ' + acc + ' (Henkjan 27 nov 2026: "Dashboard haalt zelf statussen op als ik wel ergens gewoon in chat werk ?" Ja).',
    'Het dashboard kan niet in chats kijken. Jij wel: loop de chats van dit account na en schrijf bij wat ontbreekt. Lezen en schrijven met web_fetch_vercel_url.', '',
    '1. Haal de chats van dit account op die zijn bijgewerkt sinds ' + (vorige && vorige.t ? vorige.t : 'gisteren') + ' (tool recent_chats, hooguit 20). Heb je die tool niet: meld ' + Z({ vangnet: { account: acc, fout: 'geen toegang tot de chats van dit account' } }) + ' en stop.',
    '2. Per chat: over welk project ging het (lijst: ' + HOST + '/api/mm/dashboard?vorm=start)? Geen project van Henkjan: overslaan. Lees ' + HOST + '/api/mm/dashboard?vorm=bij&project=<id>. Staat daar al een stand van deze chat die nieuwer is dan het laatste bericht: overslaan.',
    '3. Anders schrijf je de stand bij, met het tijdstip van de chat: ' + Z({ project: '<id>', chat: { naam: '<korte vaste naam van die chat>', waar: '<waar Henkjan is gebleven, 1-2 zinnen>', wacht: ['<elke vraag of ja die van hem nodig is>'], volgende: '<eerstvolgende stap>', link: 'https://claude.ai/chat/<id>', sinds: '<tijdstip laatste bericht, ISO>', vroeg: '<wat Henkjan in die chat vroeg in 3 tot 8 woorden, algemeen verwoord; alleen iets wat je ook zonder hem opnieuw kunt doen, zoals een controle, een overzicht of een ronde; weglaten bij een eenmalige bouwopdracht of een antwoord>' } }),
    '   Bij "vroeg": kies een bestaande omschrijving uit de lijst hieronder als die past, anders een nieuwe. Vroeg hij meer dingen, meld de andere los: ' + Z({ vraag: { wat: '<omschrijving>', project: '<id>', citaat: '<zijn woorden>', bron: '<naam van de chat>', t: '<tijdstip, ISO>' } }),
    '4. Lees alleen wat nodig is: het laatste stuk van een chat is genoeg. Verzin niets: staat er niet wat op hem wacht, dan "wacht":[].',
    '5. Meld af: ' + Z({ vangnet: { account: acc, chats: '<aantal nagelopen>', standen: '<aantal bijgeschreven>' } }), ''];
  if (s.gewoon.length) r.push('WAT HENKJAN VAKER VRAAGT:', ...s.gewoon.slice(0, 20).map(g => '- ' + g.id + ' [' + g.recent + ' keer] ' + g.wat));
  return r.join('\n') + '\n';
}

// De opdrachten van de geplande taken. Kort, want de werkwijze staat op het dashboard: een lege ronde kost één keer ophalen.
export const oppakPrompt = (acc, een = '') => (een
  ? 'Pak taak ' + een + ' van Henkjans dashboard op en voer hem uit. Lees eerst ' + HOST + '/api/mm/dashboard?vorm=taken&account=' + acc + '&taak=' + een + ' met de Vercel-tool web_fetch_vercel_url en volg wat daar staat.'
  : 'Je bent de oppakker van Henkjans dashboard voor account ' + acc + '. Stap 1: haal met de Vercel-tool web_fetch_vercel_url deze URL op (codeer de JSON in de URL): ' + Z({ pak: { account: acc, max: 3 } }) + ' Stap 2: staat er in het antwoord een lege lijst "taken", stop dan meteen en doe verder niets. Stap 3: kreeg je taken, lees dan eerst de werkwijze op ' + HOST + '/api/mm/dashboard?vorm=taken&account=' + acc + ' en volg die precies, harde grenzen inbegrepen.');
export const vangnetPrompt = acc => 'Je bent het vangnet van Henkjans dashboard voor account ' + acc + ': je loopt de chats van dit account na en schrijft bij waar Henkjan was gebleven en wat hij vroeg. Lees ' + HOST + '/api/mm/dashboard?vorm=vangnet&account=' + acc + ' met de Vercel-tool web_fetch_vercel_url en volg precies wat daar staat.';
export const ROOSTER = { oppak: '0 * * * *', vangnet: '47 10,22 * * *' }; // UTC: elk uur, en twee keer per dag
// Voor een tweede account: de twee geplande taken aanzetten (link onder Instellingen op de pagina).
export function aanzetTekst(account) {
  const acc = ACCOUNTS[account] && account !== 'chatgpt' ? account : 'claude-2';
  return ['ZET DE TWEE GEPLANDE TAKEN VAN HET DASHBOARD AAN VOOR ACCOUNT ' + acc, '',
    'Kijk eerst of ze in dit account al bestaan (list_triggers). Maak alleen wat ontbreekt (create_trigger), in de cloud, niet afhankelijk van een computer:',
    '1. Naam "Dashboard oppakker ' + acc + '", rooster ' + ROOSTER.oppak + ' (elk uur), opdracht:', '   ' + oppakPrompt(acc),
    '2. Naam "Dashboard vangnet ' + acc + '", rooster ' + ROOSTER.vangnet + ' (UTC, twee keer per dag), opdracht:', '   ' + vangnetPrompt(acc), '',
    'Heb je geen tool om geplande taken te maken: zeg dat in één zin tegen Henkjan en doe verder niets.',
    'Meld daarna dat ze aan staan, dan bewaakt het dashboard of ze ook echt lopen: ' + Z({ aanzet: { account: acc, oppak: true, vangnet: true } }),
    'Klaar: zeg in één zin tegen Henkjan dat beide aan staan. Het dashboard toont onder Bewaking wanneer ze voor het laatst liepen.'].join('\n') + '\n';
}
