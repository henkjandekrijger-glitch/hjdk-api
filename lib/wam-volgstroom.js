// Mailmind-stroom wam-volg (Henkjan 25 nov 2026: "Zorg dat dat geld waardevol is . Dus aanmelden optimaliseren . Volkomen lerend gebruik mailmind .").
// Wie een WAM-dossier gaat volgen (lerende modal of vast veld, lib/wam-aanmelden.js) komt in een bak van deze stroom; de uurronde van Mailmind
// (lib/mailmind.js, /api/post?op=mailmind&ronde=1) stuurt de welkomstmail vanuit Henkjans Gmail (Zernio), tussen 8 en 22 uur NL.
// Lerend: drie varianten, Thompson op 'ja'. Ja = de volger doet iets dat het dossier sterker maakt: zijn ervaring toevoegen (link /v/<tok>/e)
// of het dossier doorsturen (link /v/<tok>/d), of een antwoord op de mail dat Mailmind als ja leest. Openen van het dossier (/v/<tok>/o) telt als zien.
// Bakken: dossier | waar aangemeld (modal-arm of vast veld) | soort adres, zodat Mailmind ook leert welke volgers het meest doen.
// Afmelden: /v/<tok>/x stuurt door naar de persoonlijke afmeldpagina; afmelden zet het adres op de blokkeerlijst van Mailmind.
// Updates bij een nieuwe tijdlijnregel lopen (nog) via lib/wam-volgmail.js.
import { kv } from './db.js';
import * as M from './mailmind.js';

export const LIVE = true; // Henkjan 25 nov 2026 16:22 UTC "Verstuur maar" en 17:03 UTC "Volkomen lerend gebruik mailmind"
const BASIS = 'https://wearemany.now', S = 'wam-volg';
const NAAM = { blendle: 'het Blendle-dossier', anp: 'het ANP-dossier', errezeta: 'de oproep over Errezeta Publishing', hosters: 'het onderzoek naar hosting', algemeen: 'de dossiers van we are many now' };
const KORT = { blendle: 'Blendle', anp: 'ANP', errezeta: 'Errezeta Publishing', hosters: 'hostingbedrijven', algemeen: 'grote bedrijven' };
export const pagina = scope => BASIS + (scope && scope !== 'algemeen' ? '/dossier/' + scope : '/dossiers');

// Platte tekst (Gmail via Zernio). {ja} = ervaring toevoegen, {deel} = doorsturen, {dossier} = dossier openen, {start} = eigen melding, {stop} = afmelden.
export const VARIANTEN = [
  { o: 'Je volgt {naam}', t: 'Hoi,\n\nDank dat je {naam} volgt. Je krijgt alleen mail bij een nieuwe stap: een reactie van het bedrijf, een melding bij een toezichthouder, een uitspraak of een terugbetaling.\n\nEén ding helpt meteen. Heb je het zelf meegemaakt, zet je ervaring erbij. Twee zinnen is genoeg:\n{ja}\n\nKen je iemand die hetzelfde meemaakte? Stuur het door:\n{deel}\n\nLoop je vast bij een ander bedrijf? Begin hier: {start}\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' },
  { o: 'Wat heb jij meegemaakt met {kort}?', t: 'Hoi,\n\nJe volgt nu {naam}. Mag ik je één ding vragen: wat heb jij meegemaakt met {kort}? Elke ervaring maakt het dossier sterker, ook een goede of een correctie. Anoniem als je wilt:\n{ja}\n\nJe mag ook gewoon op deze mail antwoorden. Ik lees alles zelf.\n\nKen je iemand die het herkent? Stuur het door:\n{deel}\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' },
  { o: 'Eén klacht negeren ze, honderd niet', t: 'Hoi,\n\nDank dat je {naam} volgt. Eén klacht legt een bedrijf naast zich neer. Honderd mensen met hetzelfde verhaal niet.\n\nKen je iemand die hetzelfde meemaakte met {kort}? Stuur het door, het kost tien seconden:\n{deel}\n\nZelf meegemaakt? Zet je ervaring erbij:\n{ja}\n\nJe hoort van me bij een nieuwe stap, verder niet.\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' }
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
  async bijJa() { return {}; }
};

// Nieuwe volger (of een volger van vóór Mailmind) in de bak, eenmalig per volger (wmn:vm:welkom:<id>).
export async function naarMailmind(id) {
  if (!/^[a-f0-9]{24}$/.test(String(id || ''))) return { ok: false };
  if ((await kv.raw(['SET', 'wmn:vm:welkom:' + id, 'mlm', 'NX', 'EX', String(800 * 86400)]).catch(() => null)) !== 'OK') return { ok: true, al: true };
  const r = await kv.get('wmn:volg:r:' + id).catch(() => null); if (!r || !r.email) return { ok: false };
  if (await M.geblokkeerd(r.email)) return { ok: true, geblokkeerd: true };
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
  const scope = NAAM[a.scope] ? a.scope : 'algemeen', mens = !SCAN.test(String(ua));
  if (w === 'x') { const r = a.id ? await kv.get('wmn:volg:r:' + a.id).catch(() => null) : null;
    if (methode === 'POST') { await M.zegStop(S, a).catch(() => {}); if (r && r.mtok) await import('./wam-aanmelden.js').then(A => A.afmelden({ id: a.id, tok: r.mtok })).catch(() => {}); return null; } // List-Unsubscribe-Post (één klik in Gmail)
    return r && r.mtok ? BASIS + '/afmelden#' + a.id + '.' + r.mtok : BASIS + '/afmelden'; }
  if (mens) { if (w === 'e' || w === 'd') await M.zegJa(S, a, w === 'e' ? 'ervaring' : 'doorsturen', STROOM).catch(() => {}); else await M.zie(S, a).catch(() => {}); }
  if (w === 'e') return pagina(scope) + '?d=mail#reageren';
  if (w === 'd') return 'https://wa.me/?text=' + encodeURIComponent('Herken je dit? ' + NAAM[scope].charAt(0).toUpperCase() + NAAM[scope].slice(1) + ' op we are many now: ' + pagina(scope) + '?d=wa');
  return pagina(scope) + '?d=mail';
}
