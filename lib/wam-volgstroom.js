// Mailmind-stroom wam-volg (Henkjan 25 nov 2026: "Zorg dat dat geld waardevol is . Dus aanmelden optimaliseren . Volkomen lerend gebruik mailmind .").
// Wie een WAM-dossier gaat volgen (lerende modal of vast veld, lib/wam-aanmelden.js) komt in een bak van deze stroom; de uurronde van Mailmind
// (lib/mailmind.js, /api/post?op=mailmind&ronde=1) stuurt de welkomstmail vanuit Henkjans Gmail (Zernio), tussen 8 en 22 uur NL.
// Lerend: drie varianten, Thompson op 'ja'. Ja = de volger doet iets dat het dossier sterker maakt: zijn ervaring toevoegen (link /v/<tok>/e)
// of het dossier doorsturen (link /v/<tok>/d), of een antwoord op de mail dat Mailmind als ja leest. Openen van het dossier (/v/<tok>/o) telt als zien.
// Bakken: dossier | waar aangemeld (modal-arm of vast veld) | soort adres, zodat Mailmind ook leert welke volgers het meest doen.
// Afmelden: /v/<tok>/x stuurt door naar de persoonlijke afmeldpagina; afmelden zet het adres op de blokkeerlijst van Mailmind.
// Updates bij een nieuwe tijdlijnregel: stroom wam-update (hieronder), gevuld door zijn eigen vooraf() in elke uurronde van Mailmind.
// Antwoordmotor (lib/mailmind.js beantwoord): elke reply krijgt een AI-antwoord als het 100% uit het dossier volgt (met 'AI-antwoord' erboven),
// anders de vraag om nog een keer te antwoorden; een tweede reply gaat naar Henkjan. Kennis per volger: kennis(a) hieronder.
import { createHash } from 'node:crypto';
import { kv } from './db.js';
import * as M from './mailmind.js';
import { DOSSIERLIJST } from './wam-dossiers.js';

export const LIVE = true; // Henkjan 25 nov 2026 16:22 UTC "Verstuur maar" en 17:03 UTC "Volkomen lerend gebruik mailmind"
const BASIS = 'https://wearemany.now', S = 'wam-volg';
const NAAM = { blendle: 'het Blendle-dossier', anp: 'het ANP-dossier', errezeta: 'de oproep over Errezeta Publishing', hosters: 'het onderzoek naar hosting', algemeen: 'de dossiers van we are many now' };
const KORT = { blendle: 'Blendle', anp: 'ANP', errezeta: 'Errezeta Publishing', hosters: 'hostingbedrijven', algemeen: 'grote bedrijven' };
export const pagina = scope => BASIS + (scope && scope !== 'algemeen' ? '/dossier/' + scope : '/dossiers');

// Platte tekst (Gmail via Zernio). {ja} = ervaring toevoegen, {deel} = doorsturen, {dossier} = dossier openen, {start} = eigen melding, {stop} = afmelden.
export const VARIANTEN = [
  { o: 'Je volgt {naam}', t: 'Hoi,\n\nDank dat je {naam} volgt. Je krijgt alleen mail bij een nieuwe stap: een reactie van het bedrijf, een melding bij een toezichthouder, een uitspraak of een terugbetaling.\n\nEén ding helpt meteen. Heb je het zelf meegemaakt, zet je ervaring erbij. Twee zinnen is genoeg:\n{ja}\n\nKen je iemand die hetzelfde meemaakte? Stuur het door:\n{deel}\n\nLoop je vast bij een ander bedrijf? Begin hier: {start}\n\nVraag of opmerking? Antwoord gewoon op deze mail. Je krijgt antwoord.\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' },
  { o: 'Wat heb jij meegemaakt met {kort}?', t: 'Hoi,\n\nJe volgt nu {naam}. Mag ik je één ding vragen: wat heb jij meegemaakt met {kort}? Elke ervaring maakt het dossier sterker, ook een goede of een correctie. Anoniem als je wilt:\n{ja}\n\nKen je iemand die het herkent? Stuur het door:\n{deel}\n\nVraag of opmerking? Antwoord gewoon op deze mail. Je krijgt antwoord.\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' },
  { o: 'Eén klacht negeren ze, honderd niet', t: 'Hoi,\n\nDank dat je {naam} volgt. Eén klacht legt een bedrijf naast zich neer. Honderd mensen met hetzelfde verhaal niet.\n\nKen je iemand die hetzelfde meemaakte met {kort}? Stuur het door, het kost tien seconden:\n{deel}\n\nZelf meegemaakt? Zet je ervaring erbij:\n{ja}\n\nJe hoort van me bij een nieuwe stap, verder niet.\n\nVraag of opmerking? Antwoord gewoon op deze mail. Je krijgt antwoord.\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' }
];

export function mailTekst(a, { v, tok }) {
  const scope = NAAM[a.scope] ? a.scope : 'algemeen', L = w => BASIS + '/v/' + tok + '/' + w;
  const vul = s => String(s).split('{naam}').join(NAAM[scope]).split('{kort}').join(KORT[scope]).split('{ja}').join(L('e')).split('{deel}').join(L('d'))
    .split('{dossier}').join(L('o')).split('{start}').join(BASIS + '/start').split('{stop}').join(L('x'));
  const o = vul(v.o); return { onderwerp: o.charAt(0).toUpperCase() + o.slice(1), tekst: vul(v.t), stop: L('x') };
}

export const STROOM = {
  id: S, LIVE, kanaal: 'gmail', fromName: 'Henkjan de Krijger', wie: 'wam', taal: 'nl', soort: 'klant',
  doel: 'Nieuwe volger van een WAM-dossier zet zijn ervaring erbij of stuurt het dossier door', std: { perDag: 60, max: 150, perUur: 10 }, uren: [8, 22],
  varianten: VARIANTEN, mail: (a, o) => mailTekst(a, o),
  bak: a => (NAAM[a.scope] ? a.scope : 'algemeen') + '|' + String(a.bron || 'x').replace(/[^a-z0-9-]/gi, '').slice(0, 14) + '|' + M.soortAdres(a.m),
  voorkennis: () => [1, 4], // verwachting 20% ja: het zijn mensen die net zelf om mail vroegen
  dash: async () => { const { volgersStand } = await import('./wam-aanmelden.js'); const o = await volgersStand(); return { project: 'wam', nu: Object.values(o || {}).reduce((x, y) => x + (Number(y) || 0), 0) }; },
  antwoord: true, kennis: a => kennis(a), bijStop: a => stopVolger(a),
  async bijJa() { return {}; }
};

// Nieuwe volger (of een volger van vóór Mailmind) in de bak, eenmalig per volger (wmn:vm:welkom:<id>).
export async function naarMailmind(id) {
  if (!/^[a-f0-9]{24}$/.test(String(id || ''))) return { ok: false };
  if ((await kv.raw(['SET', 'wmn:vm:welkom:' + id, 'mlm', 'NX', 'EX', String(800 * 86400)]).catch(() => null)) !== 'OK') return { ok: true, al: true };
  const r = await kv.get('wmn:volg:r:' + id).catch(() => null); if (!r || !r.email) return { ok: false };
  if (await M.geblokkeerd(r.email)) return { ok: true, geblokkeerd: true };
  await markeerGezien(id, r.scope || 'algemeen');
  return M.vul(S, [{ m: r.email, id, scope: r.scope || 'algemeen', bron: (r.waar || 'x') + '-' + (r.arm || 'a') }]);
}
export async function inhalen() {
  const ids = (await kv.raw(['ZRANGE', 'wmn:volg:lijst', 0, -1]).catch(() => [])) || [], uit = { volgers: ids.length, erbij: 0, al: 0 };
  for (const id of ids) { const r = await naarMailmind(id); if (r && r.erbij) uit.erbij += r.erbij; else if (r && r.al) uit.al++; }
  return uit;
}

// Klik in de mail: wearemany.now/v/<tok>/<e|d|o|x> (rewrite naar /api/wam?op=dvm). Mailscanners tellen niet mee.
const SCAN = /bot|crawl|spider|preview|scan|safe|proofpoint|mimecast|barracuda|headless|python|curl|wget/i;
export async function klik(tok, w, ua = '', methode = 'GET') {
  const a = await M.adres(tok).catch(() => null); if (!a) return BASIS + '/dossiers';
  const scope = NAAM[a.d || a.scope] ? (a.d || a.scope) : 'algemeen', mens = !SCAN.test(String(ua)), st = a.s === 'wam-update' ? 'wam-update' : S, D = st === S ? STROOM : UPDATE;
  if (w === 'x') { const r = a.id ? await kv.get('wmn:volg:r:' + a.id).catch(() => null) : null;
    if (methode === 'POST') { await M.zegStop(st, a, D).catch(() => {}); if (r && r.mtok) await import('./wam-aanmelden.js').then(A => A.afmelden({ id: a.id, tok: r.mtok })).catch(() => {}); return null; } // List-Unsubscribe-Post (één klik in Gmail)
    return r && r.mtok ? BASIS + '/afmelden#' + a.id + '.' + r.mtok : BASIS + '/afmelden'; }
  if (mens) { if (w === 'e' || w === 'd') await M.zegJa(st, a, w === 'e' ? 'ervaring' : 'doorsturen', D).catch(() => {}); else await M.zie(st, a).catch(() => {}); }
  if (w === 'e') return pagina(scope) + '?d=mail#reageren';
  if (w === 'd') return 'https://wa.me/?text=' + encodeURIComponent('Herken je dit? ' + NAAM[scope].charAt(0).toUpperCase() + NAAM[scope].slice(1) + ' op we are many now: ' + pagina(scope) + '?d=wa');
  return pagina(scope) + '?d=mail';
}

// ---------- kennis voor de antwoordmotor: alleen wat op de dossierpagina staat ----------
export function kennis(a) {
  const scope = NAAM[a.d || a.scope] ? (a.d || a.scope) : 'algemeen', L = DOSSIERLIJST.filter(d => scope === 'algemeen' || d.id === scope).slice(0, 4);
  const regel = d => ['DOSSIER ' + d.naam + ' (' + pagina(d.id) + ')', 'Titel: ' + d.titel, 'Kort: ' + d.kort, 'Stand: ' + d.status, d.reactieBedrijf ? 'Reactie bedrijf: ' + d.reactieBedrijf : '', d.volgendeStap ? 'Volgende stap: ' + d.volgendeStap : '',
    'Feiten:\n- ' + (d.feiten || []).join('\n- '), 'Tijdlijn (nieuwste eerst):\n- ' + [...(d.tijdlijn || [])].sort((x, y) => String(y.datum).localeCompare(String(x.datum))).slice(0, 8).map(t => t.datum + ' ' + t.kop + ': ' + t.tekst).join('\n- '),
    'Vragen en antwoorden:\n- ' + (d.vragen || []).slice(0, 10).map(v => v.vraag + ' ' + v.antwoord).join('\n- ')].filter(Boolean).join('\n');
  return [...L.map(regel), 'ALGEMEEN: we are many now bundelt klachten per bedrijf met bronnen; het is geen advocaat en geeft geen juridisch advies. Eigen ervaring toevoegen: op de dossierpagina, onderaan bij "Jouw ervaring" (' + pagina(scope) + '#reageren). Eigen probleem met een ander bedrijf melden: ' + BASIS + '/start. Afmelden: de link onderaan elke mail. Henkjan de Krijger leest alle replies.'].join('\n\n').slice(0, 14000);
}
async function stopVolger(a) { // afmelden via reply of List-Unsubscribe: ook van de WAM-lijst
  const r = a && a.id ? await kv.get('wmn:volg:r:' + a.id).catch(() => null) : null;
  if (r && r.mtok) await import('./wam-aanmelden.js').then(A => A.afmelden({ id: a.id, tok: r.mtok })).catch(() => {});
}

// ---------- stroom wam-update: één mail per nieuwe tijdlijnregel aan wie het dossier (of alles) volgt ----------
export const nieuwste = d => [...(d.tijdlijn || [])].map((t, i) => [t, i]).sort((x, y) => String(y[0].datum).localeCompare(String(x[0].datum)) || y[1] - x[1])[0][0];
export const regelSleutel = (d, t) => createHash('sha256').update(d.id + '|' + t.datum + '|' + t.kop).digest('hex').slice(0, 16);
const datumNL = d => new Date(d + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const UPDATE_VARIANTEN = [
  { o: '{kort}: {kop}', t: 'Hoi,\n\nEr is een nieuwe stap in {naam}.\n\n{datum}: {kop}.\n{tekst}\n\nDe hele tijdlijn en de bronnen: {dossier}\n\nZelf meegemaakt? Zet je ervaring erbij:\n{ja}\n\nKen je iemand die het herkent? Stuur het door:\n{deel}\n\nVraag of opmerking? Antwoord gewoon op deze mail. Je krijgt antwoord.\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' },
  { o: 'Nieuw in {naam}', t: 'Hoi,\n\n{kop} ({datum}).\n\n{tekst}\n\nHoe meer mensen hun ervaring delen, hoe moeilijker het is om dit te negeren. Zelf meegemaakt?\n{ja}\n\nOf stuur het door naar iemand die het herkent:\n{deel}\n\nVraag of opmerking? Antwoord gewoon op deze mail. Je krijgt antwoord.\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' }
];
export function updateTekst(a, o) {
  const v = { o: String(o.v.o), t: String(o.v.t) }, vul = x => x.split('{datum}').join(datumNL(a.dt)).split('{kop}').join(a.k).split('{tekst}').join(a.tx);
  const m = mailTekst({ ...a, scope: a.d }, { v: { o: vul(v.o), t: vul(v.t) }, tok: o.tok }); m.onderwerp = m.onderwerp.slice(0, 90); return m;
}
// Bij de aanmelding: de huidige stand geldt als gezien, zodat een nieuwe volger alleen latere stappen krijgt.
export async function markeerGezien(id, scope) {
  for (const d of DOSSIERLIJST.filter(x => scope === 'algemeen' || x.id === scope)) { const t = nieuwste(d); await kv.raw(['SET', 'wmn:vm:gehad:' + id + ':' + regelSleutel(d, t), '1', 'EX', String(400 * 86400)]).catch(() => {}); }
}
// vooraf (elke uurronde): per dossier de nieuwste tijdlijnregel in de bak voor elke volger die hem nog niet kreeg.
export async function updatesVullen() {
  const ids = (await kv.raw(['ZRANGE', 'wmn:volg:lijst', 0, -1]).catch(() => [])) || [], items = [];
  if (!ids.length) return { volgers: 0, erbij: 0 };
  const rs = await kv.raw(['MGET', ...ids.map(id => 'wmn:volg:r:' + id)]).catch(() => []);
  for (const d of DOSSIERLIJST) { const t = nieuwste(d), sl = regelSleutel(d, t);
    for (let i = 0; i < ids.length; i++) { let r = rs && rs[i]; try { r = typeof r === 'string' ? JSON.parse(r) : r; } catch (e) { r = null; }
      if (!r || !r.email || !(r.scope === d.id || r.scope === 'algemeen')) continue;
      if ((await kv.raw(['SET', 'wmn:vm:gehad:' + ids[i] + ':' + sl, '1', 'NX', 'EX', String(400 * 86400)]).catch(() => null)) !== 'OK') continue;
      if (await M.geblokkeerd(r.email)) continue;
      items.push({ m: r.email, id: ids[i], scope: r.scope, d: d.id, dt: t.datum, k: String(t.kop).slice(0, 120), tx: String(t.tekst).slice(0, 700), sl }); } }
  return items.length ? M.vul('wam-update', items) : { volgers: ids.length, erbij: 0 };
}
export const UPDATE = {
  id: 'wam-update', LIVE, kanaal: 'gmail', fromName: 'Henkjan de Krijger', wie: 'wam', taal: 'nl', soort: 'klant',
  doel: 'Volger leest een nieuwe dossierstap en zet zijn ervaring erbij of stuurt het dossier door', std: { perDag: 150, max: 150, perUur: 12 }, uren: [8, 22],
  varianten: UPDATE_VARIANTEN, mail: (a, o) => updateTekst(a, o), vooraf: () => updatesVullen(),
  bak: a => (NAAM[a.d] ? a.d : 'algemeen') + '|' + (a.scope === 'algemeen' ? 'alles' : 'dossier') + '|' + M.soortAdres(a.m),
  voorkennis: () => [1, 9], antwoord: true, kennis: a => kennis(a), bijStop: a => stopVolger(a), async bijJa() { return {}; }
};
