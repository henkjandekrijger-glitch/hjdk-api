// Mailmind-stroom wam-volg (Henkjan 25 nov 2026: "Check mailmind en maak de lerende modal daarmee om aanmeldingen te krijgen").
// Wie een dossier volgt (lerende modal of vast veld, lib/wam-aanmelden.js), krijgt:
//   1. een welkomstmail direct na aanmelden, met de persoonlijke afmeldlink (record.mtok);
//   2. één mail per nieuwe regel in de tijdlijn van dat dossier (volgRonde), nooit twee keer dezelfde regel (wmn:vm:gehad:<id>:<regel>).
// Volgers van 'algemeen' krijgen de regels van alle dossiers. Verzenden via Resend vanaf wam@wearemany.now (lib/wam-post.js stuurMail).
// Aan sinds Henkjans "verstuur" (25 nov 2026): LIVE hieronder. Uit geeft /api/wam?op=dvolgmail&s=<dossier> (beschermde host) alleen het voorbeeld en
// het aantal ontvangers. Tellers per dag in wmn:vm:dag:<dag> (welkom, update, fout).
import { createHash } from 'node:crypto';
import { kv } from './db.js';
import { stuurMail, BEDRIJF } from './wam-post.js';
import { DOSSIERLIJST, dossierDatum } from './wam-dossiers.js';

export const LIVE = true; // Henkjan 25 nov 2026 16:22 UTC: "Verstuur maar zorg dat juiste links erin zitten zodat iemand kan beginnen en cta voor doorsturen"
const BASIS = 'https://wearemany.now', PRE = 'wmn:volg:', MAX = 50;
const NAAM = { blendle: 'het Blendle-dossier', anp: 'het ANP-dossier', errezeta: 'de oproep over Errezeta Publishing', hosters: 'het onderzoek naar hosting', algemeen: 'de dossiers van we are many now' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dag = () => new Date().toISOString().slice(0, 10);
const tel = async wat => { try { const k = 'wmn:vm:dag:' + dag(); await kv.raw(['HINCRBY', k, wat, 1]); await kv.raw(['EXPIRE', k, 90 * 86400]); } catch (e) {} };
const afmeld = (id, r) => BASIS + '/afmelden#' + id + '.' + r.mtok;

// Zwart-wit, zoals de site: geen grijs, één knop, afmelden in de voet.
// Een alinea is tekst, of [tekst, linktekst, url]: dan staat de link als onderstreepte tekst achter de zin (in de platte tekst met de URL erachter).
const alineaHtml = a => Array.isArray(a) ? esc(a[0]) + ' <a href="' + esc(a[2]) + '" style="color:#111113;font-weight:700">' + esc(a[1]) + '</a>' : esc(a);
const alineaTekst = a => Array.isArray(a) ? a[0] + ' ' + a[1] + ': ' + a[2] : a;
// Zwart-wit, zoals de site: geen grijs, één knop, afmelden in de voet.
export function html({ alineas, knop, url, stop }) {
  return '<!doctype html><html><body style="margin:0;background:#ffffff"><div style="max-width:560px;margin:0 auto;padding:28px 20px;font:17px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111113">'
    + '<div style="font-weight:700;font-size:18px;margin:0 0 20px">we are many now</div>'
    + alineas.map(a => '<p style="margin:0 0 16px">' + alineaHtml(a) + '</p>').join('')
    + '<p style="margin:22px 0 0"><a href="' + esc(url) + '" style="display:inline-block;background:#111113;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">' + esc(knop) + '</a></p>'
    + '<p style="font-size:14px;line-height:1.5;margin:28px 0 0;border-top:1px solid #111113;padding-top:14px">Je krijgt deze mail omdat je je op wearemany.now hebt aangemeld. <a href="' + esc(stop) + '" style="color:#111113">Afmelden</a><br>' + esc(BEDRIJF.replace('We Are Many', 'we are many now')) + '</p></div></body></html>';
}
const tekst = ({ alineas, knop, url, stop }) => alineas.map(alineaTekst).join('\n\n') + '\n\n' + knop + ': ' + url + '\n\n--\nAfmelden: ' + stop + '\n' + BEDRIJF.replace('We Are Many', 'we are many now');

// Doorsturen: de link telt als binnengekomen via mail of WhatsApp (?d=, wmn:deel in|<dossier>|<kanaal>).
const paginaVan = scope => BASIS + (scope && scope !== 'algemeen' ? '/dossier/' + scope : '/dossiers');
const waLink = (scope, naam) => 'https://wa.me/?text=' + encodeURIComponent('Herken je dit? ' + naam.charAt(0).toUpperCase() + naam.slice(1) + ' op we are many now: ' + paginaVan(scope) + '?d=wa');
const doorstuur = (scope, naam) => ['Ken je iemand die hetzelfde meemaakte? Stuur deze mail door, of', 'deel het via WhatsApp', waLink(scope, naam)];

export function welkomMail(id, r) {
  const naam = NAAM[r.scope] || NAAM.algemeen, eigen = r.scope && r.scope !== 'algemeen', url = paginaVan(r.scope);
  const alineas = ['Je volgt nu ' + naam + '.', 'Je krijgt alleen een mail als er een nieuwe stap is: een reactie van het bedrijf, een melding bij een toezichthouder, een uitspraak of een terugbetaling. Verder niets.',
    eigen ? ['Zelf meegemaakt? Ook een goede ervaring of een correctie helpt.', 'Zet je ervaring erbij', url + '#reageren'] : ['Herken je een van de zaken? Op elke dossierpagina kun je je eigen ervaring toevoegen.', 'Bekijk de dossiers', url],
    ['Loop je zelf vast bij een ander bedrijf?', 'Begin hier met je eigen melding', BASIS + '/start'],
    doorstuur(r.scope, naam)];
  const m = { alineas, knop: 'Bekijk ' + (eigen ? 'het dossier' : 'de dossiers'), url, stop: afmeld(id, r) };
  return { onderwerp: 'Je volgt ' + naam, html: html(m), tekst: tekst(m) };
}

export function nieuwsteRegel(d) {
  return d.tijdlijn.map((t, i) => [t, i]).sort((a, b) => b[0].datum.localeCompare(a[0].datum) || b[1] - a[1])[0][0];
}
export function updateMail(id, r, d, t) {
  const alineas = [dossierDatum(t.datum) + ': ' + t.kop + '.', t.tekst, 'De volledige tijdlijn en de bronnen staan in het dossier.', ['Zelf meegemaakt?', 'Zet je ervaring erbij', BASIS + '/dossier/' + d.id + '#reageren'], doorstuur(d.id, NAAM[d.id] || d.naam)];
  const m = { alineas, knop: 'Lees het dossier', url: BASIS + '/dossier/' + d.id, stop: afmeld(id, r) };
  return { onderwerp: d.naam + ': ' + t.kop, html: html(m), tekst: tekst(m) };
}
const regelSleutel = (d, t) => createHash('sha256').update(d.id + '|' + t.datum + '|' + t.kop).digest('hex').slice(0, 16);

async function volgers() {
  const ids = await kv.raw(['ZRANGE', PRE + 'lijst', 0, -1]).catch(() => []), uit = [];
  for (const id of ids || []) { const r = await kv.get(PRE + 'r:' + id).catch(() => null); if (r && r.email && r.mtok) uit.push([id, r]); }
  return uit;
}

export async function welkom(id) {
  if (!LIVE || !/^[a-f0-9]{24}$/.test(String(id || ''))) return { ok: true, verstuurd: false };
  const r = await kv.get(PRE + 'r:' + id).catch(() => null); if (!r || !r.mtok) return { ok: false };
  if (await kv.raw(['EXISTS', 'wmn:vm:welkom:' + id]).catch(() => 0)) return { ok: true, verstuurd: false, al: true };
  const m = welkomMail(id, r);
  try { await stuurMail({ to: r.email, subject: m.onderwerp, html: m.html, text: m.tekst, idem: 'wam-welkom-' + id }); await kv.raw(['SET', 'wmn:vm:welkom:' + id, '1', 'EX', 800 * 86400]); await tel('welkom'); return { ok: true, verstuurd: true }; }
  catch (e) { await tel('fout'); return { ok: false }; }
}

// Eén ronde voor één dossier: de nieuwste tijdlijnregel naar elke volger die hem nog niet kreeg. Droog of niet live: alleen tellen en voorbeeld.
export async function volgRonde({ dossier, droog = true } = {}) {
  const d = DOSSIERLIJST.find(x => x.id === dossier);
  if (!d) return { ok: false, fout: 'kies s=' + DOSSIERLIJST.map(x => x.id).join('|') };
  const t = nieuwsteRegel(d), sl = regelSleutel(d, t), alle = await volgers();
  const doel = alle.filter(([, r]) => r.scope === d.id || r.scope === 'algemeen');
  const nog = []; for (const [id, r] of doel) if (!(await kv.raw(['EXISTS', 'wmn:vm:gehad:' + id + ':' + sl]).catch(() => 0))) nog.push([id, r]);
  const voorbeeld = updateMail('0'.repeat(24), { mtok: '0'.repeat(40) }, d, t);
  const uit = { ok: true, live: LIVE, dossier: d.id, regel: t.datum + ' ' + t.kop, volgers: doel.length, nogTeSturen: nog.length, voorbeeld: { onderwerp: voorbeeld.onderwerp, tekst: voorbeeld.tekst } };
  if (droog || !LIVE) return { ...uit, verstuurd: 0, waarom: LIVE ? 'droog' : 'uit tot Henkjans verstuur (LIVE in lib/wam-volgmail.js)' };
  let n = 0;
  for (const [id, r] of nog.slice(0, MAX)) {
    const m = updateMail(id, r, d, t);
    try { await stuurMail({ to: r.email, subject: m.onderwerp, html: m.html, text: m.tekst, idem: 'wam-upd-' + id + '-' + sl }); await kv.raw(['SET', 'wmn:vm:gehad:' + id + ':' + sl, '1', 'EX', 400 * 86400]); await tel('update'); n++; }
    catch (e) { await tel('fout'); }
  }
  return { ...uit, verstuurd: n };
}

// Inhaalronde: welkomstmail voor elke volger die zich aanmeldde toen de stroom nog uit stond (eenmalig per volger, wmn:vm:welkom:<id>).
export async function welkomInhalen({ droog = true } = {}) {
  const alle = await volgers(); let n = 0, al = 0;
  for (const [id] of alle) { if (await kv.raw(['EXISTS', 'wmn:vm:welkom:' + id]).catch(() => 0)) { al++; continue; } if (!droog) { const r = await welkom(id); if (r.verstuurd) n++; } }
  return { ok: true, live: LIVE, volgers: alle.length, alGehad: al, verstuurd: n, droog };
}

export async function volgStand() {
  const dagen = {}; for (let i = 0; i < 7; i++) { const k = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); const r = await kv.raw(['HGETALL', 'wmn:vm:dag:' + k]).catch(() => []); if (r && r.length) dagen[k] = r; }
  return { live: LIVE, dagen };
}
