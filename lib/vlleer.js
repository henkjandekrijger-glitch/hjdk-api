// Verlanglijst van Kadoly: alles meten en elke dag leren (Henkjan 27 nov 2026: "Ja meet alles rond die lijst en zorg dat UX CTA en content lerend zijn .").
// - vlStand: de keten per dag uit de tellers van fn/shop.js op=lijst (c:sh-d<dag>-vl-...): naar de lijst (per ingang), maakpagina, versturen,
//   familie, Koop dit cadeau, besteld en omzet, nieuwe lijsten via een andere lijst. Lezen: /api/shop?op=lijst&stand=1[&vorm=tekst] (beschermde host).
// - vlRonde (dagelijks vanuit /api/shop/ronde na 06:00 UTC, één keer per dag): maakt in de Clickmind-proef kadolyvl (lib/proef.js, versies in
//   lib/verlanglijst.js VL_VAR) een winnaar vast (de andere versies uit) en zet de volgende uitdager aan (versie met wacht), hooguit twee
//   onderdelen per dag; zoekt het lek in de keten (drempels in DREMPEL) en zet bij een lek één taak per dag in de takenlijst van Kadoly;
//   schrijft één regel in het werklog (wie kadoly-verlanglijst), zonder nullen.
import * as PF from './proef.js';

const N = x => Number(x) || 0;
const D8 = t => new Date(t).toISOString().slice(0, 10).replace(/-/g, '');
const eur = c => '€ ' + (N(c) / 100).toFixed(2).replace('.', ',');
const STAP = ['open', 'open-menu', 'open-home', 'open-product', 'b-kies', 'b-lijst', 'b-wa', 'b-kopieer', 'mail', 'maak', 'maak-van', 'view', 'zie', 'koop', 'besteld', 'omzet', 'win'];
export const DREMPEL = { siteZie: 500, open: 50, kies: 20, deel: 15, fam: 20, geef: 5 };

export async function vlStand(kv, dagen = 7, nu = Date.now()) {
  const dg = []; for (let i = 0; i < dagen; i++) dg.push(D8(nu - i * 864e5));
  const keys = []; for (const d of dg) for (const s of STAP) keys.push('c:sh-d' + d + '-vl-' + s);
  let vals = []; try { vals = await kv.mget(...keys); } catch (e) { vals = []; }
  const per = {}, tot = Object.fromEntries(STAP.map(s => [s, 0]));
  dg.forEach((d, i) => { const o = {}; STAP.forEach((s, j) => { const v = N(vals[i * STAP.length + j]); if (v) { o[s] = v; tot[s] += v; } }); if (Object.keys(o).length) per[d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6)] = o; });
  const deel = tot['b-wa'] + tot['b-kopieer'] + tot.mail;
  // aanmelders (Henkjan 27 nov 2026: "we tellen verlanglijst mee als aanmelder"): elke gemaakte lijst plus elk adres voor de winactie vanaf de lijst
  return { dagen, aanmelders: { totaal: tot.maak + tot.win, lijsten: tot.maak, winactie: tot.win }, naarLijst: { menu: tot['open-menu'], voorpagina: tot['open-home'], productpagina: tot['open-product'] }, maakpagina: { geopend: tot.open, kozenCadeau: tot['b-kies'], lijstGeopend: tot['b-lijst'], verstuurd: deel, whatsapp: tot['b-wa'], link: tot['b-kopieer'], mail: tot.mail, lijstenGemaakt: tot.maak },
    familie: { geopend: tot.zie, koopGetikt: tot.koop, besteld: tot.besteld, omzet: tot.omzet / 100 }, rondgang: { nieuweLijstViaLijst: tot['maak-van'] }, perDag: per, tot };
}

const zin = (kop, delen) => { const d = delen.filter(x => x[0] > 0).map(x => x[0] + ' ' + x[1]); return d.length ? kop + d.join(', ') : ''; };
export function vlTekst(s, p) {
  const t = s.tot, L = ['Verlanglijst Kadoly, laatste ' + s.dagen + ' dagen'];
  const naar = t['open-menu'] + t['open-home'] + t['open-product'];
  if (naar) L.push('Vanaf kadoly.com naar de lijst: ' + naar + ' (' + [[t['open-menu'], 'menu'], [t['open-home'], 'voorpagina'], [t['open-product'], 'productpagina']].filter(x => x[0]).map(x => x[1] + ' ' + x[0]).join(', ') + ')');
  const m = zin('Maakpagina: ', [[t.open, 'keer geopend'], [t['b-kies'], 'kozen zelf een cadeau'], [t['b-lijst'], 'openden hun lijst'], [s.maakpagina.verstuurd, 'verstuurd'], [t.maak, 'lijsten gemaakt']]);
  if (m) L.push(m + (s.maakpagina.verstuurd ? ' (' + [[t['b-wa'], 'WhatsApp'], [t['b-kopieer'], 'link'], [t.mail, 'mail']].filter(x => x[0]).map(x => x[1] + ' ' + x[0]).join(', ') + ')' : ''));
  const f = zin('Familie: ', [[t.zie, 'keer geopend'], [t.koop, 'keer Koop dit cadeau'], [t.besteld, 'besteld']]); if (f) L.push(f + (t.omzet ? ' (' + eur(t.omzet) + ')' : ''));
  if (t.maak || t.win) L.push(zin('Aanmelders: ' + (t.maak + t.win) + ' (', [[t.maak, 'lijsten'], [t.win, 'mee met de winactie']]) + ')');
  if (t['maak-van']) L.push('Rondgang: ' + t['maak-van'] + ' nieuwe lijsten via een andere lijst');
  if (L.length === 1) L.push('Nog geen bezoek aan de verlanglijst.');
  const dagen = Object.entries(s.perDag).map(([d, o]) => d.slice(8) + '-' + d.slice(5, 7) + ': ' + [[o.open, 'open'], [o['b-kies'], 'kies'], [N(o.maak) + N(o.win), 'aanmelders'], [N(o['b-wa']) + N(o['b-kopieer']) + N(o.mail), 'verstuurd'], [o.zie, 'familie'], [o.koop, 'koop'], [o.besteld, 'besteld']].filter(x => x[0]).map(x => x[0] + ' ' + x[1]).join(', ')).filter(x => !/: $/.test(x));
  if (dagen.length) L.push('', 'Per dag:', ...dagen.map(x => '  ' + x));
  if (p && p.ok) { const r = proefRegels(p); if (r.length) L.push('', 'Lerend (Clickmind-proef kadolyvl, ronde ' + p.ronde + '):', ...r.map(x => '  ' + x)); }
  return L.join('\n');
}
// per onderdeel: winnaar, of de versie die nu voorligt (vanaf 30 keer gezien)
function proefRegels(p) {
  const uit = [];
  for (const f of p.factoren) { if (f.uit) continue; const vs = f.versies.filter(v => !v.uit), n = vs.reduce((a, v) => a + v.gezien, 0); if (n < 30) continue;
    const top = vs.slice().sort((a, b) => b.kansBeste - a.kansBeste)[0];
    uit.push(f.wat + ': ' + (f.oordeel.startsWith('winnaar') ? 'winnaar ' + top.id + ' "' + top.naam + '"' : top.id + ' "' + top.naam + '" ligt voor (' + top.kansBeste + '% kans), ' + n + ' keer gezien')); }
  return uit;
}

// winnaar vastzetten en de volgende uitdager aanzetten
async function promoveer(kv, p, droog) {
  const gedaan = []; const cfg = JSON.parse(JSON.stringify(await PF.leesProef(kv, 'kadolyvl', true) || {})); if (!cfg.factoren) return gedaan;
  // nieuwe onderdelen en versies uit de code (VL_VAR in lib/verlanglijst.js) komen erbij, ook als er al een kopie in KV staat
  const { VL_PROEF } = await import('./verlanglijst.js'); let bij = 0;
  for (const cf of VL_PROEF.factoren) { const f = cfg.factoren.find(x => x.id === cf.id); if (!f) { cfg.factoren.push(JSON.parse(JSON.stringify(cf))); bij++; continue; } for (const v of cf.varianten) if (!f.varianten.some(x => x.id === v.id)) { f.varianten.push({ ...v }); bij++; } }
  if (bij) gedaan.push(bij + ' nieuwe versies uit de code erbij');
  for (const st of p.factoren) {
    if (gedaan.filter(x => / wint/.test(x)).length >= 2 || !st.oordeel.startsWith('winnaar: ')) continue; const w = st.oordeel.slice(9).trim();
    const f = cfg.factoren.find(x => x.id === st.id); if (!f) continue;
    const volgende = f.varianten.find(v => v.wacht);
    for (const v of f.varianten) { if (v.id !== w && !v.wacht) v.uit = true; }
    if (volgende) { delete volgende.uit; delete volgende.wacht; }
    gedaan.push(f.wat + ': ' + w + ' wint' + (volgende ? ', nieuwe uitdager ' + volgende.id + ' "' + volgende.naam + '"' : ', geen uitdager meer'));
  }
  if (gedaan.length && !droog) await PF.proefZet(kv, 'kadolyvl', { j: { factoren: cfg.factoren } });
  return gedaan;
}

export async function vlRonde(kv, { droog = false } = {}) {
  const s = await vlStand(kv, 7); let p = null; try { p = await PF.proefStand(kv, 'kadolyvl'); } catch (e) {}
  const t = s.tot, deel = s.maakpagina.verstuurd, naar = t['open-menu'] + t['open-home'] + t['open-product'];
  const siteZie = p && p.ok ? p.factoren.filter(f => f.pagina === 'site').reduce((a, f) => a + f.versies.reduce((b, v) => b + v.gezien, 0), 0) : 0;
  const lek = [];
  if (siteZie >= DREMPEL.siteZie && !naar) lek.push('op kadoly.com ' + siteZie + ' keer gezien, niemand ging naar de lijst');
  if (t.open >= DREMPEL.open && !t['b-kies']) lek.push('maakpagina ' + t.open + ' keer geopend, niemand koos zelf een cadeau');
  if (t['b-kies'] >= DREMPEL.kies && !deel) lek.push(t['b-kies'] + ' kozen een cadeau, niemand verstuurde zijn lijst');
  if (deel >= DREMPEL.deel && !t.zie) lek.push(deel + ' keer verstuurd, de familie opende geen enkele lijst');
  if (t.zie >= DREMPEL.fam && !t.koop) lek.push('familie opende ' + t.zie + ' keer, niemand tikte Koop dit cadeau');
  if (t.koop >= DREMPEL.geef && !t.besteld) lek.push(t.koop + ' keer Koop dit cadeau, geen bestelling');
  const gedaan = p && p.ok ? await promoveer(kv, p, droog) : [];
  const regel = vlTekst(s, p).split('\n').filter(x => x && !/^(Per dag|  \d)/.test(x)).slice(1, 6).join('. ') + (gedaan.length ? '. Lerend: ' + gedaan.join('; ') : '') + (lek.length ? '. Lek: ' + lek.join('; ') + '. Taak gezet.' : '');
  const uit = { ok: true, droog, regel, lek, gedaan, stand: s };
  if (droog) return uit;
  const dag = new Date().toISOString().slice(0, 10);
  try { await kv.raw(['LPUSH', 'mm:handover:log', JSON.stringify({ t: new Date().toISOString(), wie: 'kadoly-verlanglijst', tekst: ('Verlanglijst ' + dag + ': ' + regel).slice(0, 900) })]); await kv.raw(['LTRIM', 'mm:handover:log', '0', '299']); } catch (e) {}
  if (lek.length && (await kv.raw(['SET', 'kd:vl:taak:' + dag, '1', 'NX', 'EX', '172800']).catch(() => null)) === 'OK') {
    try { const T = await import('./taken.js'); uit.taak = await T.zetTaken(kv, { taak: { tekst: 'Verlanglijst Kadoly heeft een lek (' + lek.join('; ') + '). Lees /api/shop?op=lijst&stand=1&vorm=tekst en /api/mm/proefstand?site=kadolyvl&vorm=tekst, zoek de oorzaak (B = MAP: waarde, frictie, prompt) en los het op in lib/verlanglijst.js (een nieuwe versie in VL_VAR als uitdager, of een reparatie); meld in het werklog met wie=kadoly-verlanglijst.', project: 'kadoly', zwaarte: 'gewoon' } }, 'verlanglijst'); } catch (e) { uit.taakFout = String(e.message || e).slice(0, 80); }
  }
  return uit;
}
