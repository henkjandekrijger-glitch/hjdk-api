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
//    Sinds 27 nov wordt een gewoonte na de drempel eerst een voorstel: pas na zijn ja doet het dashboard het zelf.
// 4. ZIJN JA IS ONVERVALSBAAR (totale beoordeling 27 nov 2026): antwoorden, opruimen, gewoontes aan of uit en terugdraaien kunnen alleen van een
//    toestel dat Henkjan zelf koppelde met een code uit zijn Telegram (koppelVraag, koppelCode, toestelOk). Via ?zet= of een teamsleutel nooit.
// 5. VRAAGPOORT MET MANDATEN (Henkjan 27 nov 2026: "Ja A en Ja B"): een vraag aan Henkjan zonder advies, gevolg van ja en nee, en de vlaggen
//    omkeerbaar en geld komt er niet door. Omkeerbaar, gratis en onzichtbaar beslist de agent zelf en meldt het achteraf (zelf); omkeerbaar met
//    zichtbaar effect gaat door na 24 uur zwijgen (stil akkoord); geld boven zijn grenzen, mail, nieuw publiek of onomkeerbaar blijft zijn ja.
//    Hooguit QUOTUM open vragen uit de lijst per project: daarboven bundelt de agent.
import crypto from 'node:crypto';
const TAKEN = 'mm:dash:taken', BESLUIT = 'mm:dash:besluit', GEWOON = 'mm:dash:gewoon', ACCS = 'mm:dash:acc', WEG = 'mm:dash:weg', CHATS = 'mm:dash:chats', SLOT = 'mm:dash:taakslot:', TOESTEL = 'mm:dash:toestel', KOPPEL = 'mm:dash:koppel';
const HOST = 'https://hjdk-api-henq.vercel.app';
export const ACCOUNTS = { 'claude-1': 'Claude 1', 'claude-2': 'Claude 2', chatgpt: 'ChatGPT (met de hand)' };
export const ZWAARTE = { licht: 'Licht: snel en goedkoop', gewoon: 'Gewoon', zwaar: 'Zwaar: het beste model' };
export const MODEL = { licht: 'haiku', gewoon: 'sonnet', zwaar: 'opus' }; // de oppakker geeft de taak aan een subagent met dit model
export const DREMPEL = 3, VENSTER = 14; // drie keer gevraagd binnen 14 dagen: daarna uit zichzelf
export const STIL_MIN = 90;             // minuten zonder hartslag: een ander account neemt de taak over
export const STIL_OPPAK = 3;            // uur zonder pak: de oppakker van dat account telt als stil (zelfde grens als de Bewaking op de pagina)
const OPPAKKERS = ['claude-1', 'claude-2']; // de accounts met een oppakker (ChatGPT gaat met de hand)
export const STIL_DAGEN = 3;            // een taak die zo lang wacht, vraagt of hij weg mag (Henkjan 21 nov: "3 dagen !")
export const STIL_UUR = 24, QUOTUM = 5; // stil akkoord na 24 uur zwijgen; hooguit 5 open vragen uit de lijst per project
const TE_ZIEN = /\b(posts?|mails?|advertenties?|creatives?|pagina'?s?|preview|concept(en)?|ontwerp|teksten?|inzage|bekijk)/i;
const SLEUTELS = ['taak', 'pak', 'taakzet', 'antwoord', 'weg', 'terug', 'vraag', 'gewoonte', 'vangnet', 'aanzet', 'herzie', 'zelf', 'terugdraai'];
const ALLEEN_HENKJAN = ['antwoord', 'weg', 'terug', 'gewoonte', 'terugdraai']; // alleen vanaf zijn gekoppelde toestel, nooit via ?zet=
export const isTaken = b => !!b && typeof b === 'object' && SLEUTELS.some(k => b[k] != null);

const kort = (x, n) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, n);
const rid = () => Math.random().toString(36).slice(2, 8).padEnd(6, '0');
const pid = x => String(x || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
const https = x => (/^https:\/\/[^\s"<>]{4,300}$/.test(String(x || '')) ? String(x) : '');
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const uren = ms => Math.max(0, Math.round(ms / 36e4) / 10);
const lijstVan = x => (Array.isArray(x) ? x : (x == null || x === '' ? [] : [x]));
const datum = x => { const m = String(x || '').match(/^(\d{4}-\d{2}-\d{2})/); return m ? m[1] : ''; };
// 28 nov 2026 (oppakker claude-2, mandaat A): "nietVoor":"<tijdstip, ISO>" bij een nieuwe taak of bij terug = te vroeg. Tot dat tijdstip pakt geen
// account de taak op (anders pakt elk account hem elk uur op en geeft hem weer terug met "te vroeg"). Hooguit 30 dagen vooruit; pak met een id gaat erlangs.
const later = (v, nu) => { const t = Date.parse(String(v || '')); return t > nu && t - nu <= 30 * 864e5 ? new Date(t).toISOString() : ''; };
const teVroeg = (x, nu) => !!x.nietVoor && !x.antwoord && Date.parse(x.nietVoor) > nu;
const Z = o => HOST + '/api/mm/dashboard?zet=' + JSON.stringify(o);

// MANDATEN en de vraagpoort. Eén tekst, dezelfde voor elke agent: in de werkwijze, in vorm=bij en in elke foutmelding.
export const MANDAAT = 'Mandaat A (Henkjan 27 nov 2026: "Ja A"): omkeerbaar, gratis en niemand buiten ziet het = beslis zelf, voer uit en meld het achteraf; omkeerbaar met zichtbaar effect, zonder geld, mail of nieuw publiek = vraag met stil akkoord: zwijgt hij 24 uur, dan is het ja; geld, mail naar mensen, nieuw publiek of niet terug te draaien = altijd zijn ja. Mandaat B ("Ja B"): binnen zijn vaste geldgrenzen (hoogstens $10 per dag per campagne, $100 per dag per saldo zonder gegarandeerde omzet, testprojecten $20 per dag en 10 dagen) is geld geen vraag: "geld" betekent daarboven, of een uitzondering erop; een testregel die over zijn 10 dagen is, sluit vanzelf.';
const ZELF = { zelf: { project: '<id>', wat: '<wat je besloot en deed>', waarom: '<waarom dit onder mandaat A of B valt>', terug: '<hoe het terug kan>', link: 'https://<waar het te zien is>' } };
export const VRAAG_VORM = { vraag: '<één zin>', advies: '<wat jij zou doen en waarom>', bijJa: '<wat er dan gebeurt>', bijNee: '<wat er dan gebeurt>', omkeerbaar: true, geld: false, mail: false, publiek: false, zichtbaar: true, toon: 'https://<als er iets te bekijken is>', keuzes: ['Ja', 'Nee'], uiterlijk: 'JJJJ-MM-DD als er een deadline is' };
const VRAAG_FOUT = 'Vraagpoort: een vraag aan Henkjan heeft ' + JSON.stringify(VRAAG_VORM) + '. Kan alleen hij het doen (inloggen, telefoon, account): {"vraag","advies":"<wat het losmaakt>","handeling":true}. ' + MANDAAT;
const TOON_FOUT = 'Vraagpoort: Henkjan moet dit kunnen bekijken. Zet het op een link die hij kan openen en geef die mee als "toon":"https://...". Nooit "kan ik niet laten zien".';
export function poort(o, nu = Date.now()) {
  o = o && typeof o === 'object' ? o : {}; const b = k => o[k] === true;
  const vraag = kort(o.vraag || o.tekst, 240), advies = kort(o.advies, 240), toon = https(o.toon), uiterlijk = datum(o.uiterlijk), vanaf = datum(o.vanaf); // vanaf: pas vanaf die dag in zijn lijst (Henkjan 27 nov: "Meld dat als alert in dashboard met juiste link op maandag")
  if (vraag.length < 8) return { ok: false, fout: VRAAG_FOUT };
  if (b('handeling')) return advies.length < 8 ? { ok: false, fout: VRAAG_FOUT } : { ok: true, v: { vraag, advies, soort: 'handeling', keuzes: ['Gedaan'], toon, uiterlijk, vanaf, bijJa: '', bijNee: '', stilT: '' } };
  if (typeof o.omkeerbaar !== 'boolean' || typeof o.geld !== 'boolean' || advies.length < 8) return { ok: false, fout: VRAAG_FOUT };
  const zwaar = b('geld') || b('mail') || b('publiek') || !b('omkeerbaar');
  if (!zwaar && !b('zichtbaar')) return { ok: false, mandaat: 'A', fout: 'Mandaat A: omkeerbaar, gratis en niemand buiten ziet het. Dit wordt geen vraag aan Henkjan: beslis zelf, voer het uit en meld het achteraf met ' + Z(ZELF) };
  if (kort(o.bijJa, 9).length < 3 || kort(o.bijNee, 9).length < 3) return { ok: false, fout: VRAAG_FOUT };
  if (TE_ZIEN.test(vraag) && !toon) return { ok: false, fout: TOON_FOUT };
  const soort = zwaar ? 'ja' : 'stil', keuzes = lijstVan(o.keuzes).map(k => kort(k, 24)).filter(Boolean).slice(0, 3);
  const stilT = soort === 'stil' ? new Date(Math.max(nu + STIL_UUR * 36e5, uiterlijk ? Date.parse(uiterlijk + 'T14:00:00Z') || 0 : 0)).toISOString() : '';
  return { ok: true, v: { vraag, advies, bijJa: kort(o.bijJa, 200), bijNee: kort(o.bijNee, 200), soort, keuzes: keuzes.length ? keuzes : ['Ja', 'Nee'], toon, uiterlijk, vanaf, stilT, geld: b('geld'), mail: b('mail'), publiek: b('publiek') } };
}
// Kort, voor elke beurt van elke chat (vorm=bij): zo weinig mogelijk tokens. Het geheel staat op vorm=poort.
export const POORT_KORT = 'VRAAGPOORT (Henkjan 27 nov 2026: "Ja A en Ja B"): een vraag aan Henkjan in "wacht" schrijf je als {"vraag","advies","bijJa","bijNee","omkeerbaar":true|false,"geld":true|false,"mail","publiek","zichtbaar","toon":"https://..."}; kan alleen hij het (inloggen, telefoon): {"vraag","advies","handeling":true}. Omkeerbaar, gratis en onzichtbaar: geen vraag, doe het zelf en meld het met zet {"zelf":{"project","wat","waarom","terug","link"}}. Omkeerbaar en zichtbaar zonder geld, mail of nieuw publiek: zwijgt hij 24 uur, dan gaat je advies door. Geld boven zijn grenzen, mail, nieuw publiek of onomkeerbaar: zijn ja. Geld binnen zijn grenzen is geen vraag. Alles: ' + HOST + '/api/mm/dashboard?vorm=poort';
export function poortTekst() { return ['VRAAGPOORT EN MANDATEN', '', MANDAAT, '', 'Een vraag aan Henkjan (in de stand van een chat onder "wacht", of in de takenlijst met taakzet):', JSON.stringify(VRAAG_VORM, null, 1), '', 'Kan alleen hij het doen (inloggen, telefoon, account): {"vraag":"<één zin>","advies":"<wat het losmaakt>","handeling":true}', '', 'Beslis je zelf onder het mandaat, meld het dan achteraf: ' + Z(ZELF), 'Hij ziet het in zijn lijst en kan het met één tik laten terugdraaien.', '', 'Een oude vraag zonder advies zet je door de poort met: ' + Z({ herzie: Object.assign({ project: '<id>', chat: '<naam van de chat>' }, VRAAG_VORM, { vraag: '<de vraag letterlijk uit vorm=bij>' }) }), '', 'Je kunt zijn ja nooit zelf geven: antwoorden kan alleen hij, op zijn gekoppelde toestel. Bewijs van zijn ja bij een besluit: ' + HOST + '/api/mm/dashboard?vorm=ja&id=<besluit-id> (alleen telt:true).', 'Hooguit ' + QUOTUM + ' open vragen uit de takenlijst per project: daarboven bundel je.'].join('\n') + '\n'; }
// Een vraag in de stand van een chat (string of object). Oude strings blijven staan; een object gaat door de poort. Wat al gestructureerd was
// (eerder object, of herzien door een agent) houdt zijn velden en zijn eerste tijdstip, ook als de chat hem later als string terugschrijft.
export function poortChat(item, oudMeta = {}, nu = Date.now()) {
  const nuIso = new Date(nu).toISOString();
  if (item && typeof item === 'object') {
    const q = poort(item, nu), tekst = kort(item.vraag || item.tekst, 240); if (tekst.length < 4) return null;
    if (!q.ok && q.mandaat) return { tekst, weg: true, reden: q.fout };
    if (!q.ok) return { tekst, meta: Object.assign({}, oudMeta[tekst] || {}, { eerst: (oudMeta[tekst] || {}).eerst || nuIso }), melding: q.fout };
    const o = oudMeta[q.v.vraag] || {};
    return { tekst: q.v.vraag, meta: Object.assign({}, q.v, { eerst: o.eerst || nuIso, stilT: o.soort === 'stil' && o.stilT ? o.stilT : q.v.stilT }) };
  }
  const tekst = kort(item, 240); if (tekst.length < 4) return null;
  const o = oudMeta[tekst]; return { tekst, meta: o || { eerst: nuIso }, melding: o && o.soort ? '' : 'Oud formaat, zonder advies. Schrijf hem als object: ' + JSON.stringify(VRAAG_VORM) };
}

// ZIJN TOESTEL. Koppelen: de pagina vraagt een code, die gaat naar zijn Telegram (dat leest geen agent), hij typt hem in, het toestel krijgt
// een cookie dat de pagina niet kan lezen. Elke actie die voor zijn ja telt, controleert dat cookie op de server.
async function telegramStuur(tekst) { const tok = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID; if (!tok || !chat) return false;
  try { const r = await fetch('https://api.telegram.org/bot' + tok + '/sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: tekst, disable_web_page_preview: true }), signal: AbortSignal.timeout(8000) }); return r.ok; } catch (e) { return false; } }
export const geldigToestel = id => /^[a-f0-9]{36}$/.test(String(id || ''));
export async function toestelOk(kv, id) { if (!geldigToestel(id)) return false; try { return !!(await kv.raw(['HGET', TOESTEL, String(id)])); } catch (e) { return false; } }
export async function koppelVraag(kv, stuur = telegramStuur, nu = Date.now()) {
  const rem = await Promise.resolve(kv.raw(['SET', KOPPEL + ':rem', '1', 'NX', 'EX', '90'])).catch(() => 'x'); if (!rem) return { ok: false, fout: 'Er is net een code gestuurd. Kijk in Telegram, of probeer het over anderhalve minuut opnieuw.' };
  const code = String(crypto.randomInt(100000, 1000000));
  await kv.raw(['SET', KOPPEL, JSON.stringify({ code, t: new Date(nu).toISOString(), pogingen: 0 }), 'EX', '900']);
  return (await stuur('Code om een toestel aan je dashboard te koppelen: ' + code + '\nGeldig 15 minuten. Vroeg jij dit niet aan, negeer dit bericht dan.')) ? { ok: true } : { ok: false, fout: 'Telegram stuurde de code niet. Probeer het zo opnieuw.' };
}
export async function koppelCode(kv, code, naam = '', nu = Date.now()) {
  let k = null; try { const r = await kv.raw(['GET', KOPPEL]); k = r ? JSON.parse(r) : null; } catch (e) {}
  if (!k) return { ok: false, fout: 'Geen geldige code. Vraag een nieuwe aan.' };
  if (String(code || '').replace(/\D/g, '') !== k.code) { k.pogingen = (k.pogingen || 0) + 1; if (k.pogingen >= 5) await kv.raw(['DEL', KOPPEL]); else await kv.raw(['SET', KOPPEL, JSON.stringify(k), 'EX', '900']); return { ok: false, fout: k.pogingen >= 5 ? 'Te vaak fout. Vraag een nieuwe code aan.' : 'Die code klopt niet.' }; }
  await kv.raw(['DEL', KOPPEL]); const id = crypto.randomBytes(18).toString('hex');
  await zet(kv, TOESTEL, id, { t: new Date(nu).toISOString(), naam: kort(naam, 80) }); return { ok: true, id };
}
async function alles(kv, key) { let h = []; try { h = (await kv.raw(['HGETALL', key])) || []; } catch (e) {} if (!Array.isArray(h)) h = Object.entries(h).flat(); const uit = {}; for (let i = 0; i + 1 < h.length; i += 2) { try { const v = JSON.parse(h[i + 1]); if (v && typeof v === 'object') uit[String(h[i])] = v; } catch (e) {} } return uit; }
const zet = (kv, key, id, v) => kv.raw(['HSET', key, id, JSON.stringify(v)]);
const wis = (kv, key, id) => Promise.resolve(kv.raw(['HDEL', key, id])).catch(() => null);
const slotWeg = (kv, id) => Promise.resolve(kv.raw(['DEL', SLOT + id])).catch(() => null);

// Alles wat de pagina en de oppakkers nodig hebben. Ruimt zelf op: klaar en weggehaald na een dag, verborgen rijen na 14 dagen, besluiten na 60.
// Een adsfair-vraag die vervalt (nieuwer concept, of de poort weigerde): uit zijn lijst, met de reden
export async function adsfairTaakDicht(kv, id, reden, nu = Date.now()) { const x = (await alles(kv, TAKEN))[String(id)]; if (!x || ['klaar', 'weg'].includes(x.status)) return; Object.assign(x, { was: x.status, status: 'klaar', klaarT: new Date(nu).toISOString(), resultaat: kort(reden, 300) }); await zet(kv, TAKEN, x.id, x); }
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
  if (h.status === 'telt' && recent.length >= DREMPEL) { h.status = 'voorstel'; h.voorstelT = nuIso; h.ritme = ritmeVan(recent); } // eerst zijn ja (beoordeling 27 nov: drie aanroepen mogen nooit vanzelf iets laten lopen)
  if (!h.project && o.project) h.project = pid(o.project);
  await zet(kv, GEWOON, h.id, h);
  return { ok: true, gewoonte: h.id, status: h.status, keren: recent.length, nodig: DREMPEL };
}

async function taakAntwoord(kv, x, tekst, nu, via) {
  const nuIso = new Date(nu).toISOString(), bs = { id: rid(), t: nuIso, soort: via === 'stil' ? 'stil' : 'antwoord', via, tekst, over: x.vraag, project: x.project, taak: x.id, wachtUur: uren(nu - Date.parse(x.vraagT || x.t)) };
  await zet(kv, BESLUIT, bs.id, bs);
  // Adsfair-site (Henkjan 27 nov 2026: "laat me dat eerst zien"): zijn Ja van zijn toestel zet de weekupdate meteen live, nee laat het concept vallen, iets anders gaat als opdracht naar de oppakker
  if (x.actie && x.actie.soort === 'adsfair' && via === 'toestel' && /^(ja|nee)\b/i.test(tekst)) { const A = await import('./adsfair.js'), ja = /^ja\b/i.test(tekst);
    const r = ja ? await A.publiceer(kv, x.actie.concept, bs.id, nu) : await A.conceptWeg(kv, x.actie.concept);
    Object.assign(x, r.ok ? { status: 'klaar', klaarT: nuIso, resultaat: ja ? 'Live op adsfair.xyz: ' + r.label + ' (zijn Ja, besluit ' + bs.id + '). Binnen 10 minuten zichtbaar.' : 'Henkjan zei nee: dit concept gaat niet live.', link: ja ? 'https://adsfair.xyz/#week' : '' } : { status: 'wacht', door: '', reden: r.fout },
      { antwoord: tekst, antwoordT: nuIso, bes: (x.bes || []).concat([bs.id]) }); await zet(kv, TAKEN, x.id, x);
    if (ja && r.ok && !r.omgezet) { const y = { id: rid(), t: nuIso, tekst: kort('Henkjan zei Ja op de weekupdate van adsfair.xyz (besluit ' + bs.id + ', ' + nuIso.slice(0, 16).replace('T', ' ') + ' UTC). adsfair.xyz staat nog op de oude statische pagina: promoveer Vercel-deployment ' + A.OMZET_DPL + ' (project adsfair, team henq) naar productie met de Vercel-tool request_promote. Controleer met web_fetch_vercel_url dat https://adsfair.xyz/ ' + r.label + ' toont, zet daarna https://hjdk-api-henq.vercel.app/api/mm/adsfair?zet={"omgezet":"<id van de productie-deployment>"} en meld klaar.', 800), project: 'adsfair', account: '', zwaarte: 'licht', status: 'wacht', bron: 'antwoord', door: '', bes: [bs.id] }; await zet(kv, TAKEN, y.id, y); }
    return bs; } Object.assign(x, { status: 'wacht', antwoord: tekst, antwoordT: nuIso, door: '', bes: (x.bes || []).concat([bs.id]) }); await zet(kv, TAKEN, x.id, x); return bs;
}
async function chatAntwoord(kv, p, chat, vraag, tekst, nu, via, weg = false) {
  const nuIso = new Date(nu).toISOString(), key = p + '|' + chat; let v = null; try { const r = await kv.raw(['HGET', CHATS, key]); v = r ? JSON.parse(r) : null; } catch (e) {}
  const i = v && Array.isArray(v.wacht) ? v.wacht.indexOf(vraag) : -1; if (i < 0) return { ok: false, fout: 'antwoord: die vraag staat er niet meer' };
  const m = (v.meta && v.meta[vraag]) || {}; v.wacht.splice(i, 1); if (v.meta) delete v.meta[vraag];
  if (weg) v.afgedaan = [{ vraag: kort(vraag, 240), t: nuIso, door: 'weg' }].concat(v.afgedaan || []).slice(0, 10);
  else v.beantwoord = [{ vraag: kort(vraag, 240), tekst, t: nuIso, via }].concat(v.beantwoord || []).slice(0, 10);
  await zet(kv, CHATS, key, v); const uit = { ok: true, chat };
  if (!weg) { const bs = { id: rid(), t: nuIso, soort: via === 'stil' ? 'stil' : 'antwoord', via, tekst, over: kort(vraag, 240), project: p, chat, wachtUur: uren(nu - Date.parse(m.eerst || v.t)) };
    if (!/^nee\b/i.test(tekst)) { const x = { id: rid(), t: nuIso, tekst: kort((via === 'stil' ? 'Stil akkoord (Henkjan zweeg ' + STIL_UUR + ' uur, het advies geldt)' : 'Henkjan antwoordde "' + tekst + '"') + ' op: ' + vraag + ' (chat ' + chat + ').' + (m.advies ? ' Advies was: ' + m.advies : '') + (v.volgende ? ' Daarna stond gepland: ' + v.volgende : '') + (v.link ? ' Chat: ' + v.link : ''), 800), project: p, account: '', zwaarte: '', status: 'wacht', bron: 'antwoord', door: '', bes: [bs.id] }; bs.taak = x.id; await zet(kv, TAKEN, x.id, x); uit.taak = x.id; }
    await zet(kv, BESLUIT, bs.id, bs); uit.besluit = bs.id; }
  return uit;
}
// Stil akkoord: een vraag die omkeerbaar is en waar Henkjan 24 uur op zweeg, gaat door met het advies. Loopt mee met elke lezing (dashData, pak).
export async function stilSweep(kv, nu = Date.now()) {
  const slot = await Promise.resolve(kv.raw(['SET', 'mm:dash:stilslot:' + Math.floor(nu / 24e4), '1', 'NX', 'EX', '300'])).catch(() => 'x'); if (!slot) return 0;
  let n = 0; const t = await alles(kv, TAKEN), c = await alles(kv, CHATS);
  for (const x of Object.values(t)) if (x.status === 'jij' && x.soort === 'stil' && x.stilT && Date.parse(x.stilT) <= nu) { await taakAntwoord(kv, x, 'Ja (stil akkoord, advies gevolgd)', nu, 'stil'); n++; }
  for (const [key, v] of Object.entries(c)) { const j = key.indexOf('|'); if (j < 1 || !Array.isArray(v.wacht) || !v.meta) continue;
    for (const w of v.wacht.slice()) { const m = v.meta[w]; if (m && m.soort === 'stil' && m.stilT && Date.parse(m.stilT) <= nu) { const u = await chatAntwoord(kv, key.slice(0, j), key.slice(j + 1), w, 'Ja (stil akkoord, advies gevolgd)', nu, 'stil'); if (u.ok) n++; } } }
  return n;
}
async function besluitBij(kv, x, velden) { for (const id of x.bes || []) { let h = null; try { const r = await kv.raw(['HGET', BESLUIT, id]); h = r ? JSON.parse(r) : null; } catch (e) {} if (h) await zet(kv, BESLUIT, id, Object.assign(h, velden)); } }

// Eén ingang voor alles wat de lijst verandert. wie = 'Henkjan' voor wat hij zelf op de pagina doet, anders de chat of het account.
export async function zetTaken(kv, b, wie = '', nu = Date.now(), opt = {}) {
  const nuIso = new Date(nu).toISOString(), uit = { ok: true }, vanH = opt.henkjan === true; // alleen fn/mm.js zet dit, na toestelOk op zijn gekoppelde toestel
  const verboden = ALLEEN_HENKJAN.filter(k => b[k] != null); if (verboden.length && !vanH) return { ok: false, fout: verboden.join(', ') + ': alleen Henkjan zelf, op zijn gekoppelde toestel. Een agent kan zijn ja nooit geven of namaken. ' + MANDAAT };
  if (b.taak != null) {
    const o = typeof b.taak === 'string' ? { tekst: b.taak } : (b.taak || {}), tekst = kort(o.tekst, 800), zelf = vanH || /henkjan/i.test(String(o.van || '')), via = vanH ? 'toestel' : 'chat';
    if (tekst.length < 4) return { ok: false, fout: 'taak: {"tekst":"wat moet er gebeuren","project":"<id>","account":"claude-1|claude-2|chatgpt","zwaarte":"licht|gewoon|zwaar","van":"henkjan als hij het vroeg","nietVoor":"<tijdstip, ISO: pas daarna oppakken>"}' };
    const x = { id: rid(), t: nuIso, tekst, project: pid(o.project), account: ACCOUNTS[o.account] ? o.account : '', zwaarte: ZWAARTE[o.zwaarte] ? o.zwaarte : '', status: 'wacht', bron: zelf ? 'henkjan' : 'agent', via: zelf ? via : '', door: '', wie: kort(wie, 40), bes: [] };
    const nv = later(o.nietVoor, nu); if (nv) { x.nietVoor = nv; uit.nietVoor = nv; }
    if (opt.actie && typeof opt.actie === 'object') x.actie = opt.actie; // alleen vanuit code (lib/adsfair.js): wat zijn Ja meteen uitvoert
    if (zelf) { const bs = { id: rid(), t: nuIso, soort: 'taak', via, tekst, project: x.project, taak: x.id }; x.bes.push(bs.id); await zet(kv, BESLUIT, bs.id, bs); }
    await zet(kv, TAKEN, x.id, x); uit.taak = x.id; uit.status = 'wacht';
  }
  if (b.pak != null) {
    const acc = String((b.pak && b.pak.account) || ''), max = Math.max(1, Math.min(3, Number(b.pak && b.pak.max) || 3));
    if (!ACCOUNTS[acc] || acc === 'chatgpt') return { ok: false, fout: 'pak: {"account":"claude-1|claude-2","max":3}' };
    await stilSweep(kv, nu).catch(() => 0); const s = await leesTaken(kv, nu), een = b.pak.id ? String(b.pak.id) : '';
    for (const g of een ? [] : s.gewoon) if (g.status === 'proactief' && (!g.laatst || nu - Date.parse(g.laatst) >= (g.ritme || 1) * 864e5 - 2 * 36e5) && !s.taken.some(x => x.gewoonte === g.id && ['wacht', 'bezig', 'jij'].includes(x.status))) {
      if (!(await Promise.resolve(kv.raw(['SET', 'mm:dash:gewoonslot:' + g.id, acc, 'NX', 'EX', '3600'])).catch(() => 'geen slot'))) continue; // twee accounts kijken tegelijk: één maakt de taak
      const x = { id: rid(), t: nuIso, tekst: g.wat + ' (uit jezelf doen en melden: Henkjan vroeg dit ' + g.recent + ' keer)', project: g.project || '', account: '', zwaarte: '', status: 'wacht', bron: 'gewoonte', gewoonte: g.id, door: '', bes: [] };
      await zet(kv, TAKEN, x.id, x); s.taken.push(x); const h = Object.assign({}, g, { laatst: nuIso }); delete h.recent; await zet(kv, GEWOON, g.id, h);
    }
    const kan = s.taken.filter(x => (x.status === 'wacht' || (x.status === 'bezig' && nu - Date.parse(x.hart || x.pakT || x.t) > STIL_MIN * 6e4)) && (!x.account || x.account === acc) && !(x.niet || []).includes(acc) && (een ? x.id === een : !teVroeg(x, nu))).sort((x, y) => (y.antwoord ? 1 : 0) - (x.antwoord ? 1 : 0) || String(x.t).localeCompare(String(y.t)));
    const gepakt = [];
    for (const x of kan) { if (gepakt.length >= max) break;
      const slot = await Promise.resolve(kv.raw(['SET', SLOT + x.id, acc, 'NX', 'EX', String(STIL_MIN * 60)])).catch(() => 'geen slot'); if (!slot) continue; // een ander account was net eerder
      if (x.status === 'bezig') x.overgenomen = x.door;
      Object.assign(x, { status: 'bezig', door: acc, pakT: nuIso, hart: nuIso }); delete x.nietVoor; await zet(kv, TAKEN, x.id, x);
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
    if (o.vraag) { const q = poort(o, nu); if (!q.ok) return Object.assign({ taak: x.id }, q);
      const open = Object.values(await alles(kv, TAKEN)).filter(y => y.id !== x.id && y.status === 'jij' && (y.project || '') === (x.project || '')).length;
      if (open >= QUOTUM) return { ok: false, taak: x.id, fout: 'Vraagpoort: project ' + (x.project || '(zonder project)') + ' heeft al ' + open + ' open vragen bij Henkjan (hooguit ' + QUOTUM + '). Bundel deze met een open vraag, of beslis zelf binnen je mandaat. ' + MANDAAT };
      Object.assign(x, q.v, { status: 'jij', vraagT: nuIso, antwoord: '' }, /^aanzet\|claude-[12]$/.test(String(o.klaarBij || '')) ? { klaarBij: o.klaarBij } : {}); await slotWeg(kv, x.id); uit.soort = q.v.soort; if (q.v.stilT) uit.stilT = q.v.stilT; }
    if (o.terug) { const gaf = x.door; Object.assign(x, { status: 'wacht', door: '', reden: kort(o.reden, 200) }); await slotWeg(kv, x.id);
      const nv = later(o.nietVoor, nu); if (nv) { x.nietVoor = nv; uit.nietVoor = nv; } else delete x.nietVoor; // te vroeg: tot dan pakt geen account hem op
      // 27 nov 2026 (oppakker claude-2, mandaat A): "niet":true = dit account kan de taak niet doen (geen repo, geen browser). Het krijgt hem niet opnieuw
      // (anders pakt het hem elk uur weer op en geeft hem weer terug); een ander account dat de laatste STIL_OPPAK uur oppakte krijgt hem. Kan geen enkel
      // account het, dan staat hij als handeling bij Henkjan met de reden; na zijn Gedaan mag elk account weer.
      if (o.niet === true && OPPAKKERS.includes(gaf)) { x.niet = [...new Set((x.niet || []).concat([gaf]))];
        const acs = await alles(kv, ACCS), actief = OPPAKKERS.filter(a => a === gaf || (acs[a] && nu - Date.parse(acs[a].t) < STIL_OPPAK * 36e5));
        if (actief.every(a => x.niet.includes(a))) { const q = poort({ vraag: 'Geen account kan deze taak doen: ' + (x.reden || 'toegang ontbreekt'), advies: 'Geef een account de toegang die ontbreekt (repo, browser of inlog) en tik Gedaan: dan pakt de oppakker de taak opnieuw op.', handeling: true }, nu);
          if (q.ok) { Object.assign(x, q.v, { status: 'jij', vraagT: nuIso, antwoord: '' }); delete x.niet; uit.soort = 'handeling'; } }
        uit.niet = x.niet || []; } }
    if (o.klaar) { const res = kort(o.resultaat, 500); if (res.length < 10) return { ok: false, fout: 'taakzet klaar: geef het resultaat in gewone taal ("resultaat"), een link als er iets te zien is ("link") en het id van de output die je meldde ("output")' };
      Object.assign(x, { status: 'klaar', klaarT: nuIso, resultaat: res, link: https(o.link), output: kort(o.output, 12) }); await slotWeg(kv, x.id);
      await besluitBij(kv, x, { klaarT: nuIso, resultaat: res, link: x.link, output: x.output, project: x.project }); }
    await zet(kv, TAKEN, x.id, x); uit.taak = x.id; uit.status = x.status;
  }
  if (b.antwoord != null) { // alleen van zijn gekoppelde toestel (ALLEEN_HENKJAN)
    const o = b.antwoord || {}, tekst = kort(o.tekst, 400); if (!o.weg && !tekst) return { ok: false, fout: 'antwoord: tekst ontbreekt' };
    if (o.id) { const x = (await alles(kv, TAKEN))[String(o.id)]; if (!x || x.status !== 'jij') return { ok: false, fout: 'antwoord: die vraag staat er niet meer' };
      if (o.weg) { Object.assign(x, { was: 'jij', status: 'weg', wegT: nuIso }); await zet(kv, TAKEN, x.id, x); } else await taakAntwoord(kv, x, tekst, nu, 'toestel');
      uit.taak = x.id; uit.status = x.status;
    } else if (o.testregel) { // een testregel die vanzelf sluit (mandaat B): verlengen wordt een taak voor de oppakker, met zijn woorden van zijn toestel
      const P = String(o.testregel).toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20), verleng = /verleng/i.test(tekst); if (!P) return { ok: false, fout: 'antwoord: welke testregel?' };
      const bs = { id: rid(), t: nuIso, soort: 'antwoord', via: 'toestel', tekst, over: 'Testregel ' + P + ' sluit ' + kort(o.sluit, 16).replace('T', ' ') + ' UTC (mandaat B)', project: 'campagnes' };
      await zet(kv, WEG, 'regel|' + P + '|' + kort(o.sluit, 30), { t: nuIso });
      if (verleng) { const x = { id: rid(), t: nuIso, tekst: kort('Henkjan verlengt de testregel van ' + P + ' met 10 dagen (zijn antwoord van zijn gekoppelde toestel op het dashboard, ' + nuIso.slice(0, 16).replace('T', ' ') + ' UTC, besluit ' + bs.id + '). Roep met de PropellerAds-connector budget_regel_open aan: project ' + P + ', citaat "Henkjan op het dashboard ' + nuIso.slice(0, 10) + ': ' + tekst + ' (besluit ' + bs.id + ')". Controleer daarna in budget_stand dat ' + P + ' weer open staat met een nieuwe sluitdatum.', 800), project: 'campagnes', account: '', zwaarte: 'licht', status: 'wacht', bron: 'antwoord', door: '', bes: [bs.id] }; bs.taak = x.id; await zet(kv, TAKEN, x.id, x); uit.taak = x.id; }
      await zet(kv, BESLUIT, bs.id, bs); uit.besluit = bs.id;
    } else if (o.gewoonte) { const h = (await alles(kv, GEWOON))[String(o.gewoonte)]; if (!h) return { ok: false, fout: 'antwoord: onbekende gewoonte' };
      const ja = !/^nee\b/i.test(tekst) && !o.weg; Object.assign(h, ja ? { status: 'proactief', sinds: nuIso } : { status: 'uit', uitT: nuIso }); await zet(kv, GEWOON, h.id, h);
      const bs = { id: rid(), t: nuIso, soort: 'antwoord', via: 'toestel', tekst: ja ? 'Ja' : 'Nee', over: 'Voortaan zelf doen: ' + h.wat, project: h.project || '' }; await zet(kv, BESLUIT, bs.id, bs); uit.gewoonte = { gewoonte: h.id, status: h.status };
    } else { const u = await chatAntwoord(kv, pid(o.project), kort(o.chat, 40), String(o.vraag || ''), tekst, nu, 'toestel', !!o.weg); if (!u.ok) return u; Object.assign(uit, u); }
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
    if (o.uit) { h.status = 'uit'; h.uitT = nuIso; } if (o.aan) { h.status = 'proactief'; h.sinds = nuIso; h.ritme = h.ritme || 1; }
    if (Number(o.ritme) >= 1) h.ritme = Math.min(30, Math.round(Number(o.ritme))); if (o.wat) h.wat = kort(o.wat, 120);
    await zet(kv, GEWOON, h.id, h); uit.gewoonte = { ok: true, gewoonte: h.id, status: h.status };
  }
  if (b.vangnet != null) { const o = b.vangnet || {}, acc = String(o.account || ''); if (!ACCOUNTS[acc]) return { ok: false, fout: 'vangnet: {"account":"claude-1|claude-2","chats":<nagelopen>,"standen":<bijgeschreven>,"fout":"<als je niet bij de chats kon>"}' };
    await zet(kv, ACCS, 'vangnet|' + acc, { t: nuIso, chats: Number(o.chats) || 0, standen: Number(o.standen) || 0, fout: kort(o.fout, 200) }); uit.vangnet = acc; }
  if (b.aanzet != null) { // een account meldt dat zijn oppakker en vangnet aan staan (of uit): alleen dan bewaakt de pagina of ze ook echt lopen
    const o = b.aanzet || {}, acc = String(o.account || ''); if (!ACCOUNTS[acc] || acc === 'chatgpt') return { ok: false, fout: 'aanzet: {"account":"claude-1|claude-2","oppak":true,"vangnet":true} of {"account":"...","uit":true}' };
    if (o.uit) { await Promise.all([wis(kv, ACCS, 'aan|' + acc), wis(kv, ACCS, acc), wis(kv, ACCS, 'vangnet|' + acc)]); uit.aanzet = 'uit'; }
    else { await zet(kv, ACCS, 'aan|' + acc, { t: nuIso, oppak: o.oppak !== false, vangnet: o.vangnet !== false }); uit.aanzet = acc;
      for (const x of Object.values(await alles(kv, TAKEN))) if (x.status === 'jij' && x.klaarBij === 'aanzet|' + acc) { Object.assign(x, { status: 'klaar', klaarT: nuIso, resultaat: 'Oppakker en vangnet staan aan in ' + ACCOUNTS[acc] + '.' }); await zet(kv, TAKEN, x.id, x); uit.herinnering = x.id; } } }
  if (b.herzie != null) { // een agent zet een oude vraag uit een chatstand door de poort: velden erbij, of zelf afdoen onder mandaat A
    const o = b.herzie || {}, p = pid(o.project), chat = kort(o.chat, 40), key = p + '|' + chat, vraag = String(o.vraag || ''); let v = null; try { const r = await kv.raw(['HGET', CHATS, key]); v = r ? JSON.parse(r) : null; } catch (e) {}
    const i = v && Array.isArray(v.wacht) ? v.wacht.indexOf(vraag) : -1; if (i < 0) return { ok: false, fout: 'herzie: die vraag staat er niet meer (project, chat en vraag letterlijk uit vorm=bij)' };
    const q = poort(Object.assign({}, o, { vraag }), nu), oudM = (v.meta && v.meta[vraag]) || {};
    if (!q.ok && !q.mandaat) return q;
    if (!q.ok) { v.wacht.splice(i, 1); if (v.meta) delete v.meta[vraag]; v.afgedaan = [{ vraag: kort(vraag, 240), t: nuIso, door: 'mandaat A' }].concat(v.afgedaan || []).slice(0, 10); await zet(kv, CHATS, key, v);
      const bs = { id: rid(), t: nuIso, soort: 'mandaat', mandaat: 'A', via: 'agent', door: kort(wie, 40), tekst: kort('Zelf afgedaan: ' + vraag, 300), waarom: kort(o.advies, 240), project: p, chat };
      const x = { id: rid(), t: nuIso, tekst: kort('Voer uit zonder Henkjan te vragen (mandaat A: omkeerbaar, gratis, niemand ziet het): ' + vraag + ' Advies: ' + kort(o.advies, 200) + (v.link ? ' Chat: ' + v.link : ''), 800), project: p, account: '', zwaarte: '', status: 'wacht', bron: 'agent', door: '', bes: [bs.id] };
      bs.taak = x.id; await zet(kv, BESLUIT, bs.id, bs); await zet(kv, TAKEN, x.id, x); Object.assign(uit, { mandaat: 'A', taak: x.id, besluit: bs.id });
    } else { v.meta = v.meta || {}; v.meta[vraag] = Object.assign({}, q.v, { vraag: undefined, eerst: oudM.eerst || v.t, stilT: q.v.stilT }); delete v.meta[vraag].vraag; await zet(kv, CHATS, key, v); Object.assign(uit, { herzien: q.v.soort, stilT: q.v.stilT || undefined }); }
  }
  if (b.zelf != null) { // een agent meldt wat hij zelf besloot onder mandaat A of B; Henkjan ziet het in zijn lijst en kan het terugdraaien
    const o = b.zelf || {}, wat = kort(o.wat, 300); if (wat.length < 8 || kort(o.waarom, 9).length < 4) return { ok: false, fout: 'zelf: ' + JSON.stringify(ZELF.zelf) };
    const bs = { id: rid(), t: nuIso, soort: 'mandaat', mandaat: /\bb\b/i.test(String(o.mandaat || '')) ? 'B' : 'A', via: 'agent', door: kort(o.wie || wie, 40), tekst: wat, waarom: kort(o.waarom, 240), terug: kort(o.terug, 240), link: https(o.link), project: pid(o.project), output: kort(o.output, 12) };
    await zet(kv, BESLUIT, bs.id, bs); uit.besluit = bs.id;
  }
  if (b.terugdraai != null) { // Henkjan draait een eigen besluit van een agent terug: wordt een taak van hem
    const id = String(b.terugdraai || ''), bs = (await alles(kv, BESLUIT))[id]; if (!bs || bs.soort !== 'mandaat') return { ok: false, fout: 'terugdraai: onbekend besluit' };
    const x = { id: rid(), t: nuIso, tekst: kort('Draai terug wat een agent zelf besloot: ' + bs.tekst + (bs.terug ? ' Hoe: ' + bs.terug : '') + (bs.link ? ' Link: ' + bs.link : ''), 800), project: bs.project || '', account: '', zwaarte: '', status: 'wacht', bron: 'henkjan', via: 'toestel', door: '', bes: [] };
    const nb = { id: rid(), t: nuIso, soort: 'taak', via: 'toestel', tekst: 'Terugdraaien: ' + kort(bs.tekst, 200), project: x.project, taak: x.id }; x.bes.push(nb.id);
    await zet(kv, BESLUIT, nb.id, nb); await zet(kv, BESLUIT, id, Object.assign(bs, { teruggedraaid: nuIso })); await zet(kv, TAKEN, x.id, x); uit.taak = x.id;
  }
  return uit;
}
// Bewijs voor een actie die zijn ja nodig heeft (geld, mail, publiek, live): alleen een antwoord van zijn toestel of een stil akkoord telt.
export function jaStand(s, id) { const b = s.besluiten.find(x => x.id === String(id || '')); if (!b) return { ok: false, fout: 'onbekend besluit' };
  const ja = (b.soort === 'antwoord' || b.soort === 'stil') && !/^nee\b/i.test(b.tekst); return { ok: true, id: b.id, ja, via: b.via || '', stil: b.soort === 'stil', tekst: b.tekst, over: b.over || '', t: b.t, telt: ja && (b.via === 'toestel' || b.soort === 'stil') }; }

// Besluiten met hun uitkomst: het oordeel komt van de output waar de taak in uitkwam (d = dashData, voor de output per project).
export function besluitStand(s, d) {
  const out = {}; for (const p of (d && d.projecten) || []) for (const it of ((p.output && p.output.items) || [])) out[it.id] = it;
  return s.besluiten.map(b => { const o = b.output && out[b.output], u = o && o.oordeelNu ? o.oordeelNu.uitslag : '';
    const uitslag = u === 'raak' || u === 'mis' ? u : b.soort === 'mandaat' ? (b.teruggedraaid ? 'terug' : 'zelf') : (b.soort !== 'taak' && /^nee\b/i.test(b.tekst) ? 'nee' : (b.klaarT ? (o ? 'meet nog' : 'gedaan') : b.soort === 'stil' ? 'stil' : 'loopt'));
    return Object.assign({}, b, { uitslag, waarom: o && o.oordeelNu ? o.oordeelNu.waarom : '', intentie: o ? o.intentie : '', oordeel: o ? o.oordeel : '' }); });
}
// Wat het dashboard uit zijn beslissingen en gedrag haalt, in gewone zinnen. Alleen wat de data draagt: geen zin zonder getal eronder.
export function lessen(s, d) {
  const bs = besluitStand(s, d), r = [], raak = bs.filter(b => b.uitslag === 'raak'), mis = bs.filter(b => b.uitslag === 'mis');
  if (raak.length + mis.length) r.push('Van je beslissingen met een meting: ' + raak.length + ' raak, ' + mis.length + ' mis.' + (mis.length ? ' Mis: ' + mis.slice(0, 3).map(b => kort(b.tekst, 70)).join('; ') + '.' : ''));
  const w = bs.filter(b => b.soort === 'antwoord' && b.wachtUur != null).map(b => b.wachtUur).sort((a, b) => a - b);
  if (w.length >= 3) r.push('Een vraag wacht meestal ' + String(w[Math.floor(w.length / 2)]).replace('.', ',') + ' uur op je antwoord (' + w.length + ' antwoorden).');
  const md = bs.filter(b => b.soort === 'mandaat'), td = md.filter(b => b.teruggedraaid).length; if (md.length) r.push('Agents besloten ' + md.length + ' keer zelf onder je mandaat' + (td ? '; jij draaide er ' + td + ' terug' : '; niets teruggedraaid') + '.');
  const st = bs.filter(b => b.soort === 'stil').length; if (st) r.push(st + ' keer stil akkoord: je zweeg ' + STIL_UUR + ' uur en het advies ging door.');
  const vs = s.gewoon.filter(g => g.status === 'voorstel'); if (vs.length) r.push('Wacht op je ja om voortaan zelf te doen: ' + vs.map(g => g.wat).join('; ') + '.');
  const zelf = s.gewoon.filter(g => g.status === 'proactief'); if (zelf.length) r.push('Doet het dashboard nu uit zichzelf: ' + zelf.map(g => g.wat).join('; ') + '.');
  const uit = s.gewoon.filter(g => g.status === 'uit'); if (uit.length) r.push('Niet uit zichzelf doen (Henkjan zette het uit): ' + uit.map(g => g.wat).join('; ') + '.');
  return r;
}

const GRENZEN = 'MANDAAT EN GRENZEN, ook bij een taak uit gewoonte. ' + MANDAAT + ' Wat zijn ja nodig heeft: bereid het helemaal voor, zet het op een link en vraag het via stap e. Je kunt zijn ja nooit zelf geven: antwoorden kan alleen hij, op zijn gekoppelde toestel. Een besluit-id controleren: ' + HOST + '/api/mm/dashboard?vorm=ja&id=<besluit-id> (alleen telt:true is zijn ja).';
// De werkwijze voor de oppakker van één account (geplande taak, elk uur). Staat hier en niet in de geplande taak zelf, zodat elke wijziging overal geldt.
export function takenTekst(s, account, d, een = '') {
  const acc = ACCOUNTS[account] && account !== 'chatgpt' ? account : 'claude-1', open = s.taken.filter(x => x.status === 'wacht' || x.status === 'bezig');
  const regel = x => '- ' + x.id + ' [' + x.status + (x.door ? ' ' + x.door : '') + (x.account ? ', alleen ' + x.account : '') + ((x.niet || []).length ? ', niet ' + x.niet.join(' en ') : '') + (x.nietVoor && x.status === 'wacht' ? ', niet voor ' + x.nietVoor.slice(0, 16).replace('T', ' ') + ' UTC' : '') + (x.zwaarte ? ', ' + x.zwaarte : '') + (x.project ? ', ' + x.project : '') + '] ' + kort(x.tekst, 200) + (x.antwoord ? ' | Henkjan antwoordde: ' + x.antwoord + ' (op: ' + kort(x.vraag, 120) + ')' : '');
  const r = ['TAKENLIJST VAN HET DASHBOARD, ' + new Date().toISOString().slice(0, 16) + ' UTC. Jij bent de oppakker van account ' + acc + ' (' + ACCOUNTS[acc] + ').',
    'Lezen en schrijven gaat met de Vercel-tool web_fetch_vercel_url (beschermde host).', '',
    '1. Pak je ' + (een ? 'taak' : 'taken') + ' (heb je dat net al gedaan, sla dit over): ' + Z({ pak: een ? { account: acc, max: 1, id: een } : { account: acc, max: 3 } }),
    '   Krijg je geen taken terug: stop meteen, zonder verder iets te lezen of te schrijven (bespaar tokens).',
    '2. Per taak, in deze volgorde:',
    '   a. Staat er geen project bij, kies het (lijst: ' + HOST + '/api/mm/dashboard?vorm=start) en lees eerst ' + HOST + '/api/mm/dashboard?vorm=bij&project=<id> en de overdracht van dat project.',
    '   b. Staat er geen zwaarte bij, kies die zelf: licht (opzoeken, stand tonen, kleine tekstwijziging), gewoon (het meeste bouwwerk), zwaar (ontwerp, strategie, lastige fout). Meld project en zwaarte: ' + Z({ taakzet: { id: '<id>', project: '<id>', zwaarte: 'licht|gewoon|zwaar', vroeg: '<wat Henkjan hier vraagt in 3 tot 8 woorden, algemeen verwoord; alleen iets wat je ook zonder hem opnieuw kunt doen, zoals een controle, een overzicht of een ronde; weglaten bij een eenmalige bouwopdracht of een antwoord; kies een bestaande omschrijving hieronder als die past>' } }),
    '   c. Geef de taak aan een subagent met het model dat bij de zwaarte hoort (licht = haiku, gewoon = sonnet, zwaar = opus). Heb je geen subagents, doe de taak dan zelf. Zo kost een lichte taak geen zwaar model.',
    '   d. Duurt het langer dan 20 minuten, geef dan elke 20 minuten een hartslag: ' + Z({ taakzet: { id: '<id>', hart: true } }) + ' Na ' + STIL_MIN + ' minuten stilte neemt een ander account de taak over.',
    '   e. Heb je Henkjans ja of een keuze nodig, kijk dan eerst naar je mandaat (punt 4): omkeerbaar, gratis en onzichtbaar beslis je zelf en meld je met ' + Z(ZELF) + ' Anders vraag je het door de vraagpoort: ' + Z({ taakzet: Object.assign({ id: '<id>' }, VRAAG_VORM) }) + ' Kan alleen hij het doen (inloggen, telefoon): ' + Z({ taakzet: { id: '<id>', vraag: '<één zin>', advies: '<wat het losmaakt>', handeling: true } }) + ' Een vraag zonder advies, bij ja, bij nee, omkeerbaar en geld wordt geweigerd; hooguit ' + QUOTUM + ' open vragen per project. Ga daarna door met de volgende taak. Zijn antwoord, of na ' + STIL_UUR + ' uur stil akkoord, komt terug als dezelfde taak met "antwoord".',
    '   f. Klaar: meld eerst de output met intentie bij het project (' + Z({ project: '<id>', output: { wat: '...', intentie: 'welk getal moet bewegen en waarom', metriek: 'nu|opbrengst|kosten|waarde', richting: 'omhoog|omlaag', oordeel: 'JJJJ-MM-DD', link: 'https://...' } }) + ', geeft een output-id terug) en dan: ' + Z({ taakzet: { id: '<id>', klaar: true, resultaat: '<wat er nu is, in gewone taal>', link: 'https://<waar hij het ziet>', output: '<output-id>' } }),
    '   g. Kun je de taak niet doen (geen toegang, onduidelijk): ' + Z({ taakzet: { id: '<id>', terug: true, reden: '<waarom>' } }) + ' of stel de vraag aan Henkjan (e). Ligt het aan wat jouw account kan (geen toegang tot de repo, geen browser met inlog), zet er dan "niet":true bij: jouw account krijgt hem dan niet opnieuw, het andere account wel; kan geen van beide het, dan staat hij vanzelf bij Henkjan met jouw reden. Schrijf in de reden wat er precies ontbreekt. Is het alleen te vroeg (de taak noemt een tijdstip of wacht op iets met een datum), geef hem dan terug met "nietVoor":"<tijdstip, ISO in UTC>": tot dan pakt geen account hem op.',
    '3. Schrijf per project waar Henkjan is gebleven (de zet-regel onderaan vorm=bij) en het werklog (/api/mm/handover?log=...&wie=<project>-oppakker).',
    '4. ' + GRENZEN,
    '5. Eén push per afgeronde taak, eerst git pull --rebase, bestanden bij naam. Blijf nooit langer dan 15 minuten hangen op een fout: andere aanpak, of terug met de reden.',
    '6. Er kijkt niemand mee: stel geen vraag in de chat en wacht nergens op. Een vraag aan Henkjan gaat altijd via stap e. Nederlands, kort, zuinig met tokens.',
    '7. Oude vragen in de stand van een chat (in vorm=bij zonder advies) zet je door de poort met ' + Z({ herzie: Object.assign({ project: '<id>', chat: '<naam van de chat>' }, VRAAG_VORM, { vraag: '<de vraag letterlijk uit vorm=bij>' }) }) + ' Valt hij onder mandaat A, dan haalt het dashboard hem weg en zet er een taak voor in de lijst.', '',
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
    '3. Anders schrijf je de stand bij, met het tijdstip van de chat: ' + Z({ project: '<id>', chat: { naam: '<korte vaste naam van die chat>', waar: '<waar Henkjan is gebleven, 1-2 zinnen>', wacht: [VRAAG_VORM], volgende: '<eerstvolgende stap>', link: 'https://claude.ai/chat/<id>', sinds: '<tijdstip laatste bericht, ISO>', vroeg: '<wat Henkjan in die chat vroeg in 3 tot 8 woorden, algemeen verwoord; alleen iets wat je ook zonder hem opnieuw kunt doen, zoals een controle, een overzicht of een ronde; weglaten bij een eenmalige bouwopdracht of een antwoord>' } }),
    '   Bij "vroeg": kies een bestaande omschrijving uit de lijst hieronder als die past, anders een nieuwe. Vroeg hij meer dingen, meld de andere los: ' + Z({ vraag: { wat: '<omschrijving>', project: '<id>', citaat: '<zijn woorden>', bron: '<naam van de chat>', t: '<tijdstip, ISO>' } }),
    '4. Lees alleen wat nodig is: het laatste stuk van een chat is genoeg. Verzin niets: staat er niet wat op hem wacht, dan "wacht":[]. Een vraag in wacht gaat door de vraagpoort: ' + MANDAAT,
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
// De opdracht die een nieuwe chat in het andere account krijgt (link onder Instellingen en in de herinnering; ?vorm=aanzetlink stuurt erheen).
export const aanzetChat = acc => 'Dashboard · oppakker en vangnet aanzetten (' + acc + ')\n(Dit is de titel van deze chat. Begin je eerste antwoord met deze regel als kop.)\n' + 'Zet voor dit Claude-account (' + acc + ') de twee geplande taken van Henkjans dashboard aan: de oppakker en het vangnet. Lees ' + HOST + '/api/mm/dashboard?vorm=aanzetten&account=' + acc + ' met de Vercel-tool web_fetch_vercel_url en volg het.';
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
