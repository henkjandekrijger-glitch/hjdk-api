// Dagelijkse producttest op TikTok voor Kadoly (17 nov 2026, Henkjan: "we gaan iedere dag een aantal testen of toevoegen aan
// lopende testen om de winnaars te vinden ook met de TT ads data er bij").
// Elke ochtend (cron op=tttest, 04:57 UTC, vóór TikTok de catalogus ophaalt om 06:15 NL) komen er hoogstens PER_DAG producten bij in de
// lopende test. In de catalogus krijgen ze custom_label_2 = test (productset Test), winnaars custom_label_3 = winnaar (productset
// Winnaars). Alleen producten die per verkoop minstens MIN_MARGE opleveren (een TikTok-verkoop kost rond EUR 11).
// Oordeel per product op wat Clickmind ziet van TikTok (sh-tt-p<pid>-*: aangekomen, echt mens, tik, afrekenpagina, betaald),
// en de uitgave per advertentie uit TikTok zodra de uurwacht TikTok kan lezen (lib/tiktok.js):
//   winnaar : minstens 1 betaling, of minstens 2 bewuste afrekenaars
//   uit     : minstens UIT_ECHT echte mensen zonder één tik of afrekenstap, of MAX_DAGEN in de test zonder winnaar
//   rust    : een product dat uit ging komt RUST_DAGEN niet terug
export const TT_TEST = { PER_DAG: 8, MAX_LOPEND: 24, MIN_MARGE: 15, UIT_ECHT: 40, MAX_DAGEN: 7, RUST_DAGEN: 30 };
const KERSTW = ['kerst', 'advent', 'kerstbal', 'kerstboom', 'christmas', 'xmas', 'sneeuw', 'krans', 'piek'];
const pk = pid => String(pid).toLowerCase().replace(/[^a-z0-9]/g, '');
const num = v => Number(v) || 0;
export const margeVan = (it, k) => { if (!k || k.c == null) return null; const vk = it.fs ? 0 : num(it.vk), T = num(it.p) + vk, z = num(k.z) > 0 ? num(k.z) : vk / 1.21; return Math.round((T / 1.21 - num(k.c) - z - (0.029 * T + 0.30)) * 100) / 100; };
const dagen = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

// t = tellers per pk: { dv, dm, dwk, dkp, koop } (Clickmind, alleen TikTok)
export function testRonde(state, items, kaart, tel, dag, opties = {}) {
  const st = state && state.items ? state : { items: {} }; const perId = {}; (items || []).forEach(i => { perId[i.id] = i; });
  const gedaan = [];
  for (const [pid, x] of Object.entries(st.items)) {
    if (x.uitslag !== 'loopt') continue; const t = tel[pk(pid)] || {}; const it = perId[pid];
    const echt = num(t.dm), stap = num(t.dwk) + num(t.dkp), koop = num(t.koop);
    if (!it || it.vr === false) { x.uitslag = 'uit'; x.eind = dag; x.reden = 'niet meer op voorraad'; }
    else if (koop >= 1 || num(t.dkp) >= 2) { x.uitslag = 'winnaar'; x.eind = dag; x.reden = koop + ' betaald, ' + num(t.dkp) + ' afrekenaars, ' + echt + ' echte mensen'; }
    else if (echt >= TT_TEST.UIT_ECHT && stap === 0) { x.uitslag = 'uit'; x.eind = dag; x.reden = echt + ' echte mensen, niemand tikte of rekende af'; }
    else if (dagen(x.start, dag) >= TT_TEST.MAX_DAGEN) { x.uitslag = 'uit'; x.eind = dag; x.reden = TT_TEST.MAX_DAGEN + ' dagen zonder winnaar (' + echt + ' echt, ' + stap + ' stappen)'; }
    else continue;
    gedaan.push({ pid, t: it ? it.t : pid, uitslag: x.uitslag, reden: x.reden });
  }
  const lopend = Object.values(st.items).filter(x => x.uitslag === 'loopt').length;
  const ruimte = Math.max(0, Math.min(opties.perDag || TT_TEST.PER_DAG, TT_TEST.MAX_LOPEND - lopend));
  const kand = [];
  for (const it of items || []) {
    if (it.vr === false || !it.img || !(num(it.p) > 0)) continue; const x = st.items[it.id];
    if (x && (x.uitslag === 'loopt' || x.uitslag === 'winnaar' || (x.eind && dagen(x.eind, dag) < TT_TEST.RUST_DAGEN))) continue;
    const m = margeVan(it, kaart[it.id]); if (m == null || m < TT_TEST.MIN_MARGE) continue;
    const kerst = KERSTW.some(w => (it.t + ' ' + (it.c || '') + ' ' + (it.s || '')).toLowerCase().includes(w));
    const md = String(dag).slice(5, 10), seizoen = md >= '11-01' && md <= '12-24';
    kand.push({ it, m, score: m + 2 * Math.log1p(num(it.v) + 3 * num(it.f)) + (kerst && seizoen ? 8 : 0) + (num(it.lt) && num(it.lt) <= 3 ? 2 : 0) });
  }
  kand.sort((a, b) => b.score - a.score);
  const nieuw = kand.slice(0, ruimte).map(k => { st.items[k.it.id] = { start: dag, uitslag: 'loopt', marge: k.m }; return { pid: k.it.id, t: k.it.t, marge: k.m }; });
  st.at = new Date().toISOString(); st.dag = dag;
  return { state: st, gedaan, nieuw, kandidaten: kand.length, lopend: lopend + nieuw.length };
}

export function testLabels(state) { const out = {}; for (const [pid, x] of Object.entries((state && state.items) || {})) out[pid] = x.uitslag === 'loopt' ? 'test' : x.uitslag === 'winnaar' ? 'winnaar' : ''; return out; }

export function testTekst(st, tel, perId) {
  if (!st || !st.items) return 'Nog geen producttest.';
  const r = Object.entries(st.items), regel = ([pid, x]) => { const t = tel[pk(pid)] || {}; return '- ' + String((perId[pid] || {}).t || pid).slice(0, 60) + ' (sinds ' + x.start + ', marge EUR ' + (x.marge || 0).toFixed(2) + '): ' + num(t.dv) + ' aangekomen, ' + num(t.dm) + ' echt, ' + num(t.dwk) + ' tik, ' + num(t.dkp) + ' afrekenen, ' + num(t.koop) + ' betaald' + (x.reden ? ' -> ' + x.reden : ''); };
  const L = s => r.filter(([, x]) => x.uitslag === s);
  return 'Producttest TikTok (' + (st.dag || '') + ')\nWinnaars:\n' + (L('winnaar').map(regel).join('\n') || '- nog geen') + '\nLopend:\n' + (L('loopt').map(regel).join('\n') || '- geen') + '\nUit (laatste 10):\n' + (L('uit').slice(-10).map(regel).join('\n') || '- geen');
}
