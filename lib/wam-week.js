// Mailmind-stroom wam-week: elke maandag een open overzicht voor iedereen die WAM volgt (Henkjan 26 nov 2026: "En dan krijg je wekelijkse update
// van wat er bereikt is volledig transparant ."). Een mail per adres, ook als iemand meer dossiers volgt.
// Inhoud, alleen echte tellers: nieuwe tijdlijnregels van de afgelopen 7 dagen, de stand per dossier (status uit lib/wam-dossiers.js), mensen die
// meedoen (wmn:volg:scope), ervaringen via Ja ik ook (wmn:ikook), meldingen via /start (wmn:tel), keer gedeeld (wmn:deel), opzeghulp (wmn:oz:tel),
// steeds met wat er deze week bij kwam (momentopname wmn:week:snap:<week>). Een getal van nul wordt weggelaten; wat nog niet bereikt is staat er wel.
// Lerend: twee varianten, Thompson op ja (doorsturen of ervaring toevoegen); openen telt als zien. Links via /v/<tok>/<w> (lib/wam-volgstroom.js klik).
// Alleen adressen met de toestemming waarin de weekupdate staat (TOESTEMMING in lib/wam-aanmelden.js sinds 26 nov 2026).
import { kv } from './db.js';
import * as M from './mailmind.js';
import { DOSSIERLIJST } from './wam-dossiers.js';

export const LIVE = true; // Henkjan 26 nov 2026: wekelijkse update, volledig transparant
const BASIS = 'https://wearemany.now', S = 'wam-week';
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const paren = l => { const o = {}; for (let i = 0; i + 1 < (l || []).length; i += 2) o[l[i]] = l[i + 1]; return o; };
const hash = async k => paren(await kv.raw(['HGETALL', k]).catch(() => []));
const nlDeel = (t, o) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', ...o }).format(new Date(t));
export function weekVan(t = Date.now()) { // ISO-week in Nederlandse tijd, bv. 2026-W48
  const [d, m, j] = nlDeel(t, { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').map(Number), u = new Date(Date.UTC(j, m - 1, d));
  const dw = u.getUTCDay() || 7; u.setUTCDate(u.getUTCDate() + 4 - dw); const y = u.getUTCFullYear(), w = Math.ceil(((u - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}
const vorigeWeek = t => weekVan(t - 7 * 864e5);
const datumNL = d => new Date(d + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', timeZone: 'UTC' });

export async function cijfers() {
  const [volg, ik, tel, deel, oz] = await Promise.all([hash('wmn:volg:scope'), hash('wmn:ikook'), hash('wmn:tel'), hash('wmn:deel'), hash('wmn:oz:tel')]);
  const som = o => Object.values(o).reduce((s, x) => s + N(x), 0), deelVan = k => Object.entries(oz).filter(([f]) => f.endsWith('|' + k)).reduce((s, [, x]) => s + N(x), 0);
  return { mensen: som(volg), ervaringen: som(ik), meldingen: som(tel), gedeeld: som(deel), opzegStart: deelVan('start'), opzegGelukt: deelVan('gelukt'), opzegNiet: deelVan('niet') };
}

export function weekTekst(c, vorig = {}, nu = Date.now()) {
  const grens = new Date(nu - 7 * 864e5).toISOString().slice(0, 10), stappen = [];
  for (const d of DOSSIERLIJST) for (const t of d.tijdlijn || []) if (String(t.datum) >= grens) stappen.push({ d, t });
  stappen.sort((a, b) => String(b.t.datum).localeCompare(String(a.t.datum)));
  const erbij = k => { const x = N(c[k]) - N(vorig[k]); return vorig[k] != null && x > 0 ? ' (deze week ' + x + ' erbij)' : ''; };
  const rij = (k, tekst) => (N(c[k]) > 0 ? '- ' + tekst + ': ' + N(c[k]) + erbij(k) : '');
  const cijferRegels = [rij('mensen', 'Mensen die meedoen'), rij('ervaringen', 'Mensen met hetzelfde verhaal (Ja, ik ook)'), rij('meldingen', 'Eigen meldingen over een bedrijf'), rij('gedeeld', 'Keer een dossier gedeeld'),
    rij('opzegStart', 'Keer de opzeghulp voor loterijen gestart'), rij('opzegGelukt', 'Opzeggen gelukt gemeld'), rij('opzegNiet', 'Opzeggen niet gelukt gemeld')].filter(Boolean);
  const stand = DOSSIERLIJST.filter(d => d.uitgelicht && d.status).map(d => '- ' + d.naam + ': ' + String(d.status).replace(/\s+/g, ' ').slice(0, 220));
  return [
    stappen.length ? 'Wat er deze week gebeurde:\n' + stappen.slice(0, 8).map(x => '- ' + (x.d.id === 'hosters' ? 'Onderzoek hosting' : x.d.naam) + ', ' + datumNL(x.t.datum) + ': ' + x.t.kop).join('\n') : 'Deze week kwam er geen nieuwe stap bij in de dossiers. Dat zeg ik er eerlijk bij.',
    cijferRegels.length ? 'De cijfers, zoals ze nu staan:\n' + cijferRegels.join('\n') : '',
    stand.length ? 'Waar elk dossier staat:\n' + stand.join('\n') : '',
    'Nog niet bereikt: ' + (N(c.opzegGelukt) ? 'een bevestigde oplossing of terugbetaling in een van de dossiers.' : 'een bevestigde oplossing of terugbetaling. Zodra dat er is, lees je het hier als eerste.')
  ].filter(Boolean).join('\n\n');
}

// Platte tekst (Gmail via Zernio). {week} = weeknummer, {overzicht} = weekTekst, {deel} = doorsturen, {ja} = ervaring toevoegen, {start} = eigen melding, {stop} = afmelden.
export const VARIANTEN = [
  { o: 'Week {week}: wat we samen bereikten', t: 'Hoi,\n\nZoals beloofd: het open overzicht van deze week.\n\n{overzicht}\n\nHoe meer mensen meedoen, hoe moeilijker het is om ons te negeren. Ken je iemand die het herkent? Stuur het door:\n{deel}\n\nZelf iets meegemaakt? Zet je ervaring erbij:\n{ja}\n\nVraag of opmerking? Antwoord gewoon op deze mail. Je krijgt antwoord.\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' },
  { o: 'Open boek, week {week}: de echte cijfers', t: 'Hoi,\n\nGeen mooie praatjes, gewoon de stand.\n\n{overzicht}\n\nEén ding helpt nu het meest: stuur dit door naar iemand die hetzelfde meemaakte.\n{deel}\n\nLoop je vast bij een ander bedrijf? Begin hier: {start}\n\nVraag of opmerking? Antwoord gewoon op deze mail. Je krijgt antwoord.\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' }
];
export function mailTekst(a, { v, tok }) {
  const L = w => BASIS + '/v/' + tok + '/' + w, nr = String(a.w || '').split('-W')[1] || '';
  const vul = s => String(s).split('{week}').join(String(N(nr))).split('{overzicht}').join(a.tx || '').split('{deel}').join(L('d')).split('{ja}').join(L('e'))
    .split('{start}').join(BASIS + '/start').split('{stop}').join(L('x'));
  return { onderwerp: vul(v.o).slice(0, 90), tekst: vul(v.t), stop: L('x') };
}

// vooraf (elke uurronde van Mailmind): op maandag (NL) eenmaal per week de bak vullen.
export async function weekVullen(nu = Date.now(), { forceer = false } = {}) {
  const w = weekVan(nu); if (!forceer && nlDeel(nu, { weekday: 'short' }) !== 'Mon') return { wacht: 'maandag', week: w };
  if ((await kv.raw(['SET', 'wmn:week:gevuld:' + w, String(nu), 'NX', 'EX', String(40 * 86400)]).catch(() => null)) !== 'OK') return { al: true, week: w };
  const c = await cijfers(), vorig = (await kv.get('wmn:week:snap:' + vorigeWeek(nu)).catch(() => null)) || {};
  await kv.set('wmn:week:snap:' + w, c, { ex: 120 * 86400 }).catch(() => {});
  const tx = weekTekst(c, vorig, nu), ids = (await kv.raw(['ZRANGE', 'wmn:volg:lijst', 0, -1]).catch(() => [])) || [], gezien = new Set(), items = [];
  for (let i = 0; i < ids.length; i += 200) {
    const deel = ids.slice(i, i + 200), rs = await kv.raw(['MGET', ...deel.map(id => 'wmn:volg:r:' + id)]).catch(() => []);
    for (let k = 0; k < deel.length; k++) { let r = rs && rs[k]; try { r = typeof r === 'string' ? JSON.parse(r) : r; } catch (e) { r = null; }
      if (!r || !r.email || (r.taal && r.taal !== 'nl') || ['us', 'uk', 'ca', 'de'].includes(r.scope) || !/week/.test(String(r.toestemming || '')) || gezien.has(r.email)) continue; // weekupdate is Nederlands gezien.add(r.email);
      if (await M.geblokkeerd(r.email)) continue;
      items.push({ m: r.email, id: deel[k], scope: 'algemeen', w, tx }); }
  }
  return items.length ? { week: w, ...(await M.vul(S, items)) } : { week: w, erbij: 0, volgers: ids.length };
}

export const WEEK = {
  id: S, LIVE, kanaal: 'gmail', fromName: 'Henkjan de Krijger', wie: 'wam', taal: 'nl', soort: 'klant',
  doel: 'Volger leest het wekelijkse open overzicht van WAM en stuurt het door of zet zijn ervaring erbij', std: { perDag: 150, max: 150, perUur: 12 }, uren: [9, 21],
  varianten: VARIANTEN, mail: (a, o) => mailTekst(a, o), vooraf: async () => weekVullen(),
  bak: a => 'week|' + M.soortAdres(a.m), voorkennis: () => [1, 9], antwoord: true, bijStop: a => import('./wam-volgstroom.js').then(V => V.stopVolger(a)),
  kennis: a => import('./wam-volgstroom.js').then(V => V.kennis({ ...a, scope: 'algemeen' })), async bijJa() { return {}; }
};
