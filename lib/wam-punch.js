// Lerende punchlines van WAM (Henkjan 26 nov 2026: "maak deze tekst extreem lerende en iedere dag wisselen de punchlines. Beste blijven
// draaien maar worden ALTIJD gechallenged door andere"). Vier plekken (slots a tot d) in de Clickmind-proef wmn, factor punch. Elke plek
// draagt een punchline uit de voorraad hieronder: een kop en een korte spreuk. Elke dag na 06:00 UTC vervangt punchRonde de zwakste plek die
// niet de leider is door de volgende uitdager uit de voorraad en zet de tellers van die plek op nul. De leider (hoogste kans op beste) blijft
// staan tot een uitdager hem verslaat. Geschiedenis in wmn:punch:log, zodat ook een eerder verslagen regel later terug kan komen.
// Spreuken: alleen spreekwoorden en wapenspreuken zonder auteur, of een breed toegeschreven korte uitspraak met naam.

export const PUNCH = [
  { id: 'p01', kop: 'Alleen sta je machteloos. Samen niet.', quote: 'Eendracht maakt macht.', bron: 'Nederlands spreekwoord' },
  { id: 'p02', kop: 'Eén klacht negeren ze. Duizend niet.', quote: 'Vele kleintjes maken een grote.', bron: 'Nederlands spreekwoord' },
  { id: 'p03', kop: 'Kijk mee, volg, stuur door. Zo worden we een blok.', quote: 'Alleen ga je sneller, samen kom je verder.', bron: 'spreekwoord' },
  { id: 'p04', kop: 'Jij bent niet de enige. Samen worden we gehoord.', quote: 'Alleen kunnen we zo weinig, samen zo veel.', bron: 'Helen Keller' },
  { id: 'p05', kop: 'Ze rekenen erop dat je het opgeeft. Wij geven niet op.', quote: 'Wie niet waagt, die niet wint.', bron: 'Nederlands spreekwoord' },
  { id: 'p06', kop: 'Samen krijgen we wel antwoord.', quote: 'Wie zwijgt, stemt toe.', bron: 'Nederlands spreekwoord' },
  { id: 'p07', kop: 'Van losse klachten naar één stem.', quote: 'L’union fait la force.', bron: 'Belgische wapenspreuk' },
  { id: 'p08', kop: 'Wat je alleen niet lukt, lukt samen wel.', quote: 'Vele handen maken licht werk.', bron: 'Nederlands spreekwoord' },
  { id: 'p09', kop: 'Elke keer dat je doorstuurt, worden we groter.', quote: 'Twee weten meer dan één.', bron: 'Nederlands spreekwoord' },
  { id: 'p10', kop: 'Bedrijven tellen klachten. Wij tellen mee, hardop.', quote: 'Meten is weten.', bron: 'Nederlands spreekwoord' },
  { id: 'p11', kop: 'Help een ander, en je helpt jezelf.', quote: 'Wie goed doet, goed ontmoet.', bron: 'Nederlands spreekwoord' },
  { id: 'p12', kop: 'Klein begonnen. Samen groot.', quote: 'Vele kleintjes maken een grote.', bron: 'Nederlands spreekwoord' }
];
export const SLOTS = ['a', 'b', 'c', 'd'];
const STANDAARD = { a: 'p01', b: 'p02', c: 'p03', d: 'p04' };
export const STANDAARD_SLOTS = STANDAARD;
const K = 'wmn:punch:slots', LOG = 'wmn:punch:log';
const byId = id => PUNCH.find(p => p.id === id) || PUNCH[0];
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function punchSlots(kv) {
  let v = null; try { v = await kv.get(K); } catch (x) {} if (typeof v === 'string') { try { v = JSON.parse(v); } catch (x) { v = null; } }
  const s = { ...STANDAARD, ...(v && v.slots || {}) }; return { slots: s, sinds: (v && v.sinds) || {}, gebruikt: (v && v.gebruikt) || Object.values(STANDAARD) };
}
// HTML: per plek een versie (data-cm-v="punch:<plek>"), plek a zonder hidden; cm.js toont de gekozen plek.
export function punchKop(slots) { return SLOTS.map((p, i) => '<span data-cm-v="punch:' + p + '"' + (i ? ' hidden' : '') + '>' + e(byId(slots[p]).kop) + '</span>').join(''); }
export function punchQuote(slots) { return SLOTS.map((p, i) => { const x = byId(slots[p]); return '<span data-cm-v="punch:' + p + '"' + (i ? ' hidden' : '') + '>“' + e(x.quote) + '” <span class="quote-bron">' + e(x.bron) + '</span></span>'; }).join(''); }

// Eigen beeld: veel stippen (mensen) die van links los naar rechts samen één blok vormen, met het WAM-teken in het midden.
export function punchBeeld() {
  let d = '';
  for (let i = 0; i < 70; i++) {
    const x = (i * 37) % 260 + 10, y = (i * 53) % 120 + 15, r = 3 + (i % 3);
    d += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#111113" opacity="' + (0.25 + (i % 4) * 0.12).toFixed(2) + '"/>';
  }
  for (let c = 0; c < 12; c++) for (let rr = 0; rr < 8; rr++) {
    const x = 330 + c * 17, y = 20 + rr * 15;
    if ((c === 5 || c === 6) && (rr === 3 || rr === 4)) continue;
    d += '<circle cx="' + x + '" cy="' + y + '" r="6" fill="#111113"/>';
  }
  d += '<path d="M275 75 H318" stroke="#111113" stroke-width="3" fill="none"/><path d="M308 66 L320 75 L308 84" stroke="#111113" stroke-width="3" fill="none"/>';
  d += '<circle cx="432.5" cy="72.5" r="16" fill="#fff"/><circle cx="432.5" cy="66" r="4" fill="#111113"/><circle cx="426.5" cy="77" r="4" fill="#111113"/><circle cx="438.5" cy="77" r="4" fill="#111113"/>';
  return '<svg class="manifest-beeld" viewBox="0 0 540 150" role="img" aria-label="Losse stippen worden samen één blok">' + d + '</svg>';
}

export const MANIFEST_CSS = '.manifest{margin:0 0 28px}.manifest-beeld{display:block;width:100%;height:auto;max-width:540px;margin:0 0 18px}.manifest h1{margin-bottom:10px}.manifest-quote{font-size:1.1rem;font-style:italic;margin:0 0 14px}.quote-bron{font-style:normal;font-size:.85rem}.manifest-acties{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:16px 0 0}.manifest-acties .btn{width:100%}@media(min-width:640px){.manifest-acties{grid-template-columns:repeat(4,minmax(0,1fr))}}';

// Vier manieren om mee te doen. Doorsturen is een WhatsApp-link met de pagina; elke tik telt in de proef als deel.
export function manifest(slots, { pad = '/', tekst } = {}) {
  const url = 'https://wearemany.now' + pad, wa = 'https://wa.me/?text=' + encodeURIComponent('Samen staan we sterker tegenover bedrijven die niet luisteren. Kijk mee: ' + url + (url.includes('?') ? '&' : '?') + 'd=wa');
  return '<section class="manifest" aria-labelledby="voor-kop">' + punchBeeld() + '<h1 id="voor-kop">' + punchKop(slots) + '</h1><p class="manifest-quote">' + punchQuote(slots) + '</p><p>' + e(tekst || 'Meekijken, volgen, reageren en doorsturen. Zo help je elkaar, en zo worden losse klachten één blok dat bedrijven niet kunnen negeren.') + '</p>' +
    '<div class="manifest-acties"><a class="btn" href="/#dossiers" data-punch="tik">Kijk mee</a><a class="btn" href="/#aansluiten" data-punch="tik">Volg</a><a class="btn" href="/start" data-punch="tik">Vertel je verhaal</a><a class="btn primary" href="' + e(wa) + '" target="_blank" rel="noopener" data-punch="deel">Stuur door</a></div></section>';
}
// Meet de tikken op de vier knoppen als proefstap (tik of deel) en als Clickmind-actie.
export const MANIFEST_JS = String.raw`(function(){document.querySelectorAll('[data-punch]').forEach(function(a){a.addEventListener('click',function(){try{if(window.wamMeet)window.wamMeet(a.getAttribute('data-punch'))}catch(x){}try{if(window.mmUitkomst)window.mmUitkomst('actie')}catch(x){}})})})();`;

// Dagelijkse uitdaging. Leider = hoogste kans op beste met minstens 50 keer gezien; die blijft. De zwakste andere plek (laagste waarde,
// bij gelijkspel de oudste) krijgt de volgende ongebruikte punchline; zijn tellers gaan op nul. Eenmaal per UTC-dag, na 06:00.
export async function punchRonde(kv, { nu = Date.now(), forceer = false, stand } = {}) {
  const dag = new Date(nu).toISOString().slice(0, 10);
  if (!forceer && new Date(nu).getUTCHours() < 6) return { ok: true, wacht: 'na 06:00 UTC' };
  if (!forceer) { const n = await kv.raw(['SET', 'wmn:punch:dag:' + dag, '1', 'NX', 'EX', 172800]).catch(() => null); if (!n) return { ok: true, al: dag }; }
  const { proefStand } = await import('./proef.js');
  const st = stand || await proefStand(kv, 'wmn'); if (!st || !st.ok) return { ok: false, fout: 'geen stand' };
  const f = (st.factoren || []).find(x => x.id === 'punch'); if (!f) return { ok: false, fout: 'geen factor punch' };
  const cur = await punchSlots(kv), vs = f.versies.filter(v => SLOTS.includes(v.id));
  const leider = [...vs].filter(v => v.gezien >= 50).sort((x, y) => y.kansBeste - x.kansBeste)[0];
  const kandidaten = vs.filter(v => !leider || v.id !== leider.id).sort((x, y) => (x.waarde ?? 0) - (y.waarde ?? 0) || String(cur.sinds[x.id] || '').localeCompare(String(cur.sinds[y.id] || '')));
  const weg = kandidaten[0]; if (!weg) return { ok: true, niets: 'geen kandidaat' };
  const live = new Set(Object.values(cur.slots)), gebruikt = new Set(cur.gebruikt);
  const nieuw = PUNCH.find(p => !live.has(p.id) && !gebruikt.has(p.id)) || PUNCH.find(p => !live.has(p.id)); if (!nieuw) return { ok: true, niets: 'voorraad op' };
  const oud = cur.slots[weg.id];
  cur.slots[weg.id] = nieuw.id; cur.sinds[weg.id] = dag; gebruikt.add(nieuw.id);
  await kv.set(K, JSON.stringify({ slots: cur.slots, sinds: cur.sinds, gebruikt: [...gebruikt] }));
  const tk = 'mm:pf:wmn:' + st.ronde, keys = await kv.raw(['HKEYS', tk]).catch(() => []);
  const wis = (Array.isArray(keys) ? keys : []).filter(k => String(k).startsWith('punch|' + weg.id + '|'));
  if (wis.length) await kv.raw(['HDEL', tk, ...wis]).catch(() => {});
  const regel = { dag, leider: leider ? { plek: leider.id, id: cur.slots[leider.id], kans: leider.kansBeste, gezien: leider.gezien, waarde: leider.waarde } : null, eruit: { plek: weg.id, id: oud, gezien: weg.gezien, waarde: weg.waarde }, erin: { plek: weg.id, id: nieuw.id } };
  await kv.raw(['LPUSH', LOG, JSON.stringify(regel)]).catch(() => {}); await kv.raw(['LTRIM', LOG, 0, 199]).catch(() => {});
  return { ok: true, ...regel };
}
export async function punchLog(kv) { const r = await kv.raw(['LRANGE', LOG, 0, 29]).catch(() => []); return (Array.isArray(r) ? r : []).map(x => { try { return JSON.parse(x); } catch (y) { return null; } }).filter(Boolean); }
