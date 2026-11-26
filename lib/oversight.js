// Oversight (Henkjan 26 nov 2026: "Doe ieder dag een zoekwoorden check op alle campagnes zodat we nooit aan bleeders uitgeven zet ook in dashboard. Zullen we dat oversight noemen ?")
// Elke dag kijkt een KDP-ronde in Chrome alle lopende Amazon Ads-campagnes na (alle markten) en zet zoekwoorden en zoektermen die geld kosten zonder te verkopen uit.
// De ronde meldt per campagne wat ze bekeek en wat ze uitzette; deze module bewaart dat en toont het op /oversight en op het dashboard.
// Opslag: kv ovs:dag:<JJJJ-MM-DD> (per campagne de laatste melding van die dag), 60 dagen.

export const REGELS = [
  'Bekijk elke dag alle lopende Amazon Ads-campagnes in alle markten (VS, Canada, VK, DE, AU en verder), elk zoekwoord en elk producttarget, en in AUTO- en BROAD-campagnes ook de zoektermen. Periode: laatste 30 dagen.',
  'Bleeder: 10 of meer kliks en geen aankoop, of kosten van minstens één royalty van dat boek (weet je die niet: $5) en geen aankoop.',
  'Een woord of target dat over het hele leven minstens 2 aankopen had onder $9 per aankoop is een oude winnaar: die is pas een bleeder bij 20 kliks zonder aankoop in 30 dagen.',
  'Wat je doet: een bleeder-zoekwoord of -target zet je op pauze. Een bleeder-zoekterm in een AUTO- of BROAD-campagne wordt een negatief exact zoekwoord in die campagne. Meer niet: geen bod, budget of campagne veranderen (dat blijft op Henkjans woord).',
  'Duur maar verkoopt wel (3 of meer aankopen in 30 dagen en meer dan 2 keer de royalty per aankoop): niet uitzetten, wel melden als voorstel met de cijfers.',
  'Meld elke campagne, ook als er niets uit hoefde (bleeders leeg), en sluit de ronde af met rond en het aantal lopende campagnes. Zo ziet Oversight of alles bekeken is.',
];

const dagVan = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const getal = v => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 100) / 100 : 0);
const tekst = (v, n = 120) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const ACTIES = ['pauze', 'negatief', 'gemeld'];

export async function zetOversight(kv, b, wie = '') {
  if (!b || typeof b !== 'object') return { ok: false, fout: 'geef een JSON-object' };
  const dag = /^\d{4}-\d{2}-\d{2}$/.test(String(b.dag || '')) ? b.dag : dagVan();
  const key = 'ovs:dag:' + dag; const r = (await kv.get(key).catch(() => null)) || { dag, campagnes: {}, rond: null };
  if (b.rond) {
    const actief = Math.max(0, Math.round(Number(b.rond.campagnesActief) || 0));
    r.rond = { t: new Date().toISOString(), campagnesActief: actief, wie: tekst(b.rond.wie || wie, 60) };
  } else {
    const id = tekst(b.id, 40); const naam = tekst(b.campagne, 120);
    if (!id && !naam) return { ok: false, fout: 'campagne (naam) of id ontbreekt' };
    const bl = Array.isArray(b.bleeders) ? b.bleeders : [];
    if (bl.length > 300) return { ok: false, fout: 'te veel bleeders in één melding (max 300)' };
    const bleeders = [];
    for (const x of bl) {
      if (!x || !tekst(x.woord)) return { ok: false, fout: 'elke bleeder heeft een woord' };
      const actie = ACTIES.includes(x.actie) ? x.actie : 'pauze';
      bleeders.push({ woord: tekst(x.woord), soort: x.soort === 'zoekterm' ? 'zoekterm' : x.soort === 'target' ? 'target' : 'woord', kliks: Math.max(0, Math.round(Number(x.kliks) || 0)), kosten: getal(x.kosten), aankopen: Math.max(0, Math.round(Number(x.aankopen) || 0)), actie });
    }
    const voorstel = (Array.isArray(b.voorstel) ? b.voorstel : []).slice(0, 30).map(x => tekst(typeof x === 'string' ? x : JSON.stringify(x), 240));
    r.campagnes[id || naam] = { id, campagne: naam, markt: tekst(b.markt || 'US', 8).toUpperCase(), boek: tekst(b.boek, 40), munt: tekst(b.munt || 'USD', 4).toUpperCase(), royalty: b.royalty == null ? null : getal(b.royalty), gecheckt: Math.max(0, Math.round(Number(b.gecheckt) || 0)), bleeders, voorstel, t: new Date().toISOString(), wie: tekst(b.wie || wie, 60) };
  }
  await kv.set(key, r, { ex: 60 * 86400 });
  return { ok: true, dag, campagnes: Object.keys(r.campagnes).length, rond: !!r.rond };
}

// Samenvatting per dag en de status: ok (vandaag of binnen 26 uur een complete ronde), half (bekeken maar niet alle campagnes), te laat, nooit.
export async function ovStand(kv, dagen = 14, nu = Date.now()) {
  const lijst = [];
  for (let i = 0; i < dagen; i++) {
    const dag = dagVan(nu - i * 864e5); const r = await kv.get('ovs:dag:' + dag).catch(() => null);
    if (!r) continue;
    const c = Object.values(r.campagnes || {}); const bl = c.flatMap(x => x.bleeders.map(y => Object.assign({ campagne: x.campagne, markt: x.markt, munt: x.munt }, y)));
    const uit = bl.filter(x => x.actie !== 'gemeld');
    lijst.push({ dag, rond: r.rond, campagnes: c, gecheckt: c.length, woorden: c.reduce((s, x) => s + x.gecheckt, 0), bleeders: bl, uit: uit.length,
      geremd: getal(uit.reduce((s, x) => s + x.kosten, 0) / 30), voorstel: c.flatMap(x => x.voorstel.map(v => x.campagne + ': ' + v)),
      compleet: !!(r.rond && c.length >= r.rond.campagnesActief), laatst: c.map(x => x.t).concat(r.rond ? [r.rond.t] : []).sort().pop() || '' });
  }
  const laatsteRond = lijst.find(x => x.rond);
  const uren = laatsteRond ? (nu - Date.parse(laatsteRond.rond.t)) / 36e5 : null;
  let status = 'nooit';
  if (laatsteRond) status = uren > 26 ? 'te laat' : laatsteRond.compleet ? 'ok' : 'half';
  else if (lijst.length) status = 'half';
  const zin = status === 'ok' ? 'Gecheckt ' + kortTijd(laatsteRond.rond.t) + ': ' + laatsteRond.gecheckt + ' campagnes, ' + laatsteRond.uit + ' bleeders uit.'
    : status === 'half' ? 'Laatste check niet compleet: ' + (lijst[0].gecheckt) + ' van ' + ((lijst[0].rond && lijst[0].rond.campagnesActief) || '?') + ' campagnes bekeken.'
      : status === 'te laat' ? 'Geen zoekwoordencheck sinds ' + kortTijd(laatsteRond.rond.t) + ' (' + Math.round(uren) + ' uur).'
        : 'Nog geen zoekwoordencheck gedaan.';
  const week = lijst.filter(x => nu - Date.parse(x.dag) < 7 * 864e5);
  return { status, zin, uren: uren == null ? null : Math.round(uren), dagen: lijst, week: { uit: week.reduce((s, x) => s + x.uit, 0), geremd: getal(week.reduce((s, x) => s + x.geremd, 0)) }, regels: REGELS };
}

const NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
function kortTijd(t) { const d = new Date(t); if (isNaN(d)) return ''; const c = new Date(d.getTime() - 4 * 36e5); return c.getUTCDate() + ' ' + NL[c.getUTCMonth()] + ' ' + String(c.getUTCHours()).padStart(2, '0') + ':' + String(c.getUTCMinutes()).padStart(2, '0'); }
const geld = (n, m) => (m === 'USD' ? '$' : m === 'EUR' ? '€' : m + ' ') + Number(n || 0).toFixed(2).replace('.', ',');

export function ovTekst(s) {
  const r = ['OVERSIGHT (zoekwoordencheck op alle Amazon Ads-campagnes, elke dag)', 'Status: ' + s.status + '. ' + s.zin, 'Afgelopen 7 dagen: ' + s.week.uit + ' bleeders uitgezet, samen ongeveer $' + String(s.week.geremd).replace('.', ',') + ' per dag geremd.', '', 'REGELS'];
  for (const x of s.regels) r.push('- ' + x);
  r.push('', 'MELDEN (beschermde host, of POST met team-sleutel):', '- per campagne: /oversight?zet={"markt":"US","campagne":"<naam>","id":"<id>","boek":"pitboss","royalty":5.05,"gecheckt":<aantal woorden en zoektermen bekeken>,"bleeders":[{"woord":"...","soort":"woord|target|zoekterm","kliks":12,"kosten":6.4,"aankopen":0,"actie":"pauze|negatief|gemeld"}],"voorstel":["..."]}', '- ronde af: /oversight?zet={"rond":{"campagnesActief":<aantal lopende campagnes>,"wie":"kdp-ronde-a"}}');
  for (const d of s.dagen.slice(0, 7)) {
    r.push('', d.dag + ': ' + d.gecheckt + ' campagnes, ' + d.woorden + ' woorden bekeken, ' + d.uit + ' uit' + (d.rond ? (d.compleet ? ', compleet' : ', niet compleet (' + d.gecheckt + ' van ' + d.rond.campagnesActief + ')') : ', ronde niet afgesloten'));
    for (const b of d.bleeders.slice(0, 40)) r.push('  - ' + b.markt + ' ' + b.campagne + ': ' + b.woord + ' (' + b.soort + ', ' + b.kliks + ' kliks, ' + geld(b.kosten, b.munt) + ', ' + b.aankopen + ' aankopen) ' + b.actie);
    for (const v of d.voorstel.slice(0, 10)) r.push('  - voorstel: ' + v);
  }
  return r.join('\n');
}

export function ovHtml(s, CSS) {
  const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const r = (l, i) => '<div class="r"><b>' + l + '</b><span>' + i + '</span></div>';
  const lijst = a => (a.length ? '<div class="lijst">' + a.join('') + '</div>' : '');
  const kop = s.status === 'ok' ? 'Alles bekeken' : s.status === 'half' ? 'Niet alles bekeken' : s.status === 'te laat' ? 'Te laat' : 'Nog niet gestart';
  const dagen = s.dagen.map(d => '<details' + (d === s.dagen[0] ? ' open' : '') + '><summary><b>' + esc(d.dag.slice(8, 10).replace(/^0/, '') + ' ' + NL[Number(d.dag.slice(5, 7)) - 1]) + '</b><i>' + d.uit + '</i><span>' + d.gecheckt + ' campagnes, ' + d.woorden + ' woorden bekeken' + (d.rond ? (d.compleet ? ', compleet' : ', ' + d.gecheckt + ' van ' + d.rond.campagnesActief) : ', ronde niet afgesloten') + '</span></summary><div class="in">'
    + lijst(d.bleeders.map(b => r(esc(b.actie === 'negatief' ? 'Negatief' : b.actie === 'gemeld' ? 'Gemeld' : 'Uit'), esc(b.woord) + '<br>' + esc(b.markt + ' · ' + b.campagne + ' · ' + b.kliks + ' kliks · ' + geld(b.kosten, b.munt) + ' · ' + b.aankopen + ' aankopen'))))
    + (d.bleeders.length ? '' : '<p>Geen bleeders gevonden.</p>')
    + (d.voorstel.length ? '<h3>Voorstel voor jou</h3>' + lijst(d.voorstel.map(v => r('', esc(v)))) : '')
    + '<h3>Bekeken</h3>' + lijst(d.campagnes.map(c => r(esc(c.markt), esc(c.campagne) + ' · ' + c.gecheckt + ' woorden · ' + c.bleeders.length + ' bleeders')))
    + '</div></details>').join('');
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><title>Oversight</title><link rel="alternate" type="text/plain" href="?vorm=tekst">'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"><style>' + CSS + '</style></head><body><div class="w"><header><a class="merk" href="/dashboard">Dashboard</a><span class="meta">Oversight</span></header>'
    + '<section class="tool"><h1>' + esc(kop) + '</h1><p>' + esc(s.zin) + '</p><p>Afgelopen 7 dagen ' + s.week.uit + ' bleeders uitgezet, samen ongeveer $' + esc(String(s.week.geremd).replace('.', ',')) + ' per dag minder verspild.</p></section>'
    + '<section><h2>Per dag</h2><div class="lijst">' + (dagen || '<p>Nog geen check gemeld.</p>') + '</div></section>'
    + '<section><h2>Regels</h2>' + lijst(s.regels.map((x, i) => r(String(i + 1), esc(x)))) + '</section>'
    + '<footer><p>Voor chats: <a href="?vorm=tekst">Oversight als tekst</a>.</p></footer></div></body></html>';
}

// Voor het dashboard: een melding onder Opvallend als de check te laat of niet compleet is, of als er voorstellen liggen.
export function ovOpvallend(s) {
  if (s.status === 'ok' && !(s.dagen[0] && s.dagen[0].voorstel.length)) return null;
  const tekstje = s.status === 'ok' ? 'Oversight: ' + s.dagen[0].voorstel.length + ' voorstel(len) voor dure woorden die wel verkopen.' : 'Oversight: ' + s.zin;
  return { id: 'kdp', naam: 'Oversight', zwaar: s.status === 'te laat' || s.status === 'nooit' ? 50 : 10, tekst: tekstje,
    opdracht: 'Oversight (de dagelijkse zoekwoordencheck op alle Amazon Ads-campagnes) meldt: ' + s.zin + ' Lees https://hjdk-api-henq.vercel.app/oversight?vorm=tekst, doe de check nu volgens de regels daar in Claude in Chrome, meld elke campagne en sluit af met rond.' };
}
