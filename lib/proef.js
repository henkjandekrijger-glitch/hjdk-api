// Clickmind-proeven: een pagina die zelf leert welke versie van elk onderdeel het meest oplevert.
// Henkjan 10 nov 2026, na de doorlichting van de afrekenpagina van Kadoly: "Ja en maak alles daarvan lerend ."
//
// Hoe het werkt
// - Per site een proef met onderdelen (factoren), elk met versies: 'a' is wat er nu staat, 'b' (en verder) de nieuwe.
// - cm.js vraagt bij het eerste paginabezoek één beslissing voor alle onderdelen (GET /api/mm/proef) en bewaart die 7 dagen in de
//   browser (cmpf:<site>), zodat iemand op de productpagina en de afrekenpagina dezelfde versies ziet.
// - De site zet elke versie in de pagina met data-cm-v="<onderdeel>:<versie>" (de nieuwe met het attribuut hidden); cm.js laat
//   per onderdeel alleen de gekozen versie zien. Gedrag in eigen code: window.cmProef('<onderdeel>') geeft de versie.
// - Telt pas als iemand het onderdeel echt zag (gebeurtenis 'zie', alleen voor onderdelen die op de pagina staan).
// - Waarde per bezoeker = de verste stap op weg naar betalen: 20 s op de afrekenpagina 1, veld aangetikt 3, betaalmethode 5,
//   op Betalen 20, betaald 100 (zelfde ladder voor elk onderdeel). Elk onderdeel leert los (factorieel): iedereen krijgt van elk
//   onderdeel een versie, dus elk onderdeel gebruikt alle bezoekers.
// - Kiezen: Thompson sampling op de gemiddelde waarde per versie, per apparaat (iPhone, Android, computer) met de andere
//   apparaten als terugval; altijd 10% willekeurig zodat het blijft leren. Wint een versie, dan krijgt die vanzelf bijna iedereen.
// - Opslag is krap: tellers in één hash per site en ronde (mm:pf:<site>:<ronde>), per bezoeker één veld in een daghash
//   (mm:pfm:<site>:<dag>, 9 dagen). Geen persoonsgegevens, geen inhoud van velden.
// Lezen: /api/mm/proefstand?site=kadoly[&vorm=tekst]. Aan/uit, onderdelen, nieuwe ronde: /api/mm/proefzet (beschermde host).
import { modalAlias } from './modal.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
export const WAARDE = { b20: 1, veld: 3, methode: 5, betaal: 20, koop: 100 };
export const STAPPEN = Object.keys(WAARDE);
const CTX = ['i', 'a', 'd']; // iPhone/iPad, Android, computer
const CTX_NAAM = { i: 'iPhone', a: 'Android', d: 'computer' };
const DAGEN = 9;
// willekeurig deel: 30% zolang een versie minder dan 200 keer gezien is (één vroege koop van 100 punten mag niet alles beslissen), daarna 10%
const verken = sch => (Math.min(...sch.map(x => x.n)) < 200 ? 0.3 : 0.1);

export const PROEVEN = {
  kadoly: {
    aan: true, ronde: 1, sinds: '2026-11-10',
    factoren: [
      { id: 'levering', pagina: 'kassa', wat: 'Levertijd bovenaan de afrekenpagina', varianten: [{ id: 'a', naam: '"Thuisbezorgd in 5–7 werkdagen · verwacht …" (nu)' }, { id: 'b', naam: 'Alleen de datum: "In huis di 17 – do 19 nov", dezelfde tekst als op de productpagina' }] },
      { id: 'snel', pagina: 'kassa', wat: 'Snelle knoppen', varianten: [{ id: 'a', naam: 'Alleen het PayPal-blok bovenaan (nu)' }, { id: 'b', naam: 'Bovenaan drie knoppen: Apple Pay (iPhone) of Google Pay (Android), PayPal, iDEAL' }] },
      { id: 'kop', pagina: 'kassa', wat: 'Bestelling bovenaan', varianten: [{ id: 'a', naam: 'Kaart met kleine foto (nu)' }, { id: 'b', naam: 'Grote foto met "€prijs · verzending gratis · gratis retour 14 dagen"' }] },
      { id: 'adres', pagina: 'kassa', wat: 'Adres invullen', varianten: [{ id: 'a', naam: 'Adresformulier met landenlijst (nu)' }, { id: 'b', naam: 'E-mail eerst, dan postcode + huisnummer die straat en plaats invullen; Nederland vast, ander land via een link' }] },
      { id: 'vinkje', pagina: 'kassa', wat: 'Voorwaarden', varianten: [{ id: 'a', naam: 'Verplicht vinkje (nu)' }, { id: 'b', naam: 'Geen vinkje, de zin "Door te betalen ga je akkoord met de voorwaarden"' }] },
      { id: 'koopbalk', pagina: 'product', wat: 'Nu kopen-balk op de productpagina', varianten: [{ id: 'a', naam: 'Balk direct in beeld (nu)' }, { id: 'b', naam: 'Balk pas zodra de prijs en de koopknop uit beeld zijn gescrold' }] },
    ],
  },
};

const ok = s => /^[a-z0-9-]{2,30}$/.test(String(s || ''));
const dag = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const paren = h => { if (!h) return {}; if (!Array.isArray(h)) return h; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[String(h[i])] = h[i + 1]; return o; };
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

const CFG = new Map(), ST = new Map();
async function siteNaam(kv, s) { s = String(s || '').toLowerCase(); if (!ok(s)) return ''; const a = await modalAlias(kv, s).catch(() => ''); return a || s; }
export async function leesProef(kv, site, vers = false) {
  const c = CFG.get(site); if (!vers && c && Date.now() - c.at < 60000) return c.v;
  let v = null; try { v = await kv.get('mm:proef:' + site); } catch (e) {} if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { v = null; } }
  v = v && Array.isArray(v.factoren) ? v : (PROEVEN[site] || null); CFG.set(site, { at: Date.now(), v }); return v;
}
async function leesTellers(kv, site, r, vers = false) {
  const k = site + ':' + r, c = ST.get(k); if (!vers && c && Date.now() - c.at < 60000) return c.v;
  let v = {}; try { v = paren(await kv.raw(['HGETALL', 'mm:pf:' + k])); } catch (e) {} ST.set(k, { at: Date.now(), v }); return v;
}
const actief = f => (f.varianten || []).filter(x => !x.uit);

// schatting per versie: dit apparaat telt vol, de andere apparaten half, plus 2 waarnemingen op het gemiddelde van het onderdeel
function schat(st, f, vs, c) {
  const g = (v, cc, x) => N(st[f.id + '|' + v + '|' + cc + '|' + x]);
  let N0 = 0, S0 = 0, Q0 = 0; const r = vs.map(x => { let n = 0, s = 0, q = 0; for (const cc of CTX) { n += g(x.id, cc, 'n'); s += g(x.id, cc, 's'); q += g(x.id, cc, 'q'); } N0 += n; S0 += s; Q0 += q; return { id: x.id, n, s, q, nc: c ? g(x.id, c, 'n') : n, sc: c ? g(x.id, c, 's') : s }; });
  const mu0 = N0 ? S0 / N0 : 0.5, var0 = Math.max(1, N0 ? Q0 / N0 - mu0 * mu0 : 1);
  return r.map(x => { const ne = x.nc + 0.5 * (x.n - x.nc) + 2, m = (x.sc + 0.5 * (x.s - x.sc) + 2 * mu0) / ne; return { ...x, m, sd: Math.sqrt(var0 / ne) }; });
}
function kies(st, f, c) {
  const vs = actief(f); if (!vs.length) return 'a'; if (vs.length === 1) return vs[0].id;
  const sch = schat(st, f, vs, c);
  if (Math.random() < verken(sch)) return vs[Math.floor(Math.random() * vs.length)].id;
  let best = vs[0].id, bw = -Infinity; for (const x of sch) { const w = x.m + gauss() * x.sd; if (w > bw) { bw = w; best = x.id; } } return best;
}

export async function proefBeslis(kv, { site, ctx }) {
  site = await siteNaam(kv, site); if (!site) return { ok: false, fout: 'site' };
  const cfg = await leesProef(kv, site); if (!cfg || !cfg.aan) return { ok: true, site, aan: false };
  const c = CTX.includes(ctx) ? ctx : 'd', st = await leesTellers(kv, site, N(cfg.ronde) || 1), v = {};
  for (const f of cfg.factoren) if (!f.uit) v[f.id] = kies(st, f, c);
  const a = new Uint8Array(6); globalThis.crypto.getRandomValues(a);
  return { ok: true, site, aan: true, pid: [...a].map(x => (x + 256).toString(16).slice(1)).join(''), d: dag(), r: N(cfg.ronde) || 1, v };
}

// gebeurtenis van de pagina: 'zie' (welke onderdelen stonden er, met welke versie) of een stap op weg naar betalen
export async function proefEv(kv, b) {
  const site = await siteNaam(kv, b.site), pid = String(b.pid || ''), d = String(b.d || ''), e = String(b.e || '');
  if (!site || !/^[0-9a-f]{12}$/.test(pid) || !/^\d{4}-\d{2}-\d{2}$/.test(d) || (e !== 'zie' && !STAPPEN.includes(e))) return { ok: false, fout: 'invoer' };
  if (Date.now() - Date.parse(d) > (DAGEN - 1) * 864e5 || Date.parse(d) > Date.now() + 864e5) return { ok: false, fout: 'te oud' };
  const cfg = await leesProef(kv, site); if (!cfg) return { ok: false, fout: 'geen proef' }; if (!cfg.aan) return { ok: true, uit: true };
  const r = N(cfg.ronde) || 1; if (N(b.r) !== r) return { ok: true, oud: true };
  const hk = 'mm:pfm:' + site + ':' + d, tk = 'mm:pf:' + site + ':' + r;
  let rec = null; try { rec = JSON.parse(await kv.raw(['HGET', hk, pid]) || 'null'); } catch (x) {}
  const cmd = [];
  if (e === 'zie') {
    const c = CTX.includes(b.c) ? b.c : 'd', fs = {}; for (const f of cfg.factoren) fs[f.id] = f;
    rec = rec || { v: {}, c, f: [], m: 0, st: '' };
    const nieuw = [];
    for (const [fid, vid] of Object.entries(b.v || {})) { const f = fs[fid]; if (!f || rec.f.includes(fid) || !(f.varianten || []).some(x => x.id === vid)) continue; rec.v[fid] = vid; rec.f.push(fid); nieuw.push(fid); }
    if (!nieuw.length) return { ok: true, dubbel: true };
    const sec = b.sec == null || b.sec === '' ? null : N(b.sec);
    for (const fid of nieuw) { const vid = rec.v[fid]; cmd.push(['HINCRBY', tk, fid + '|' + vid + '|' + rec.c + '|n', 1]);
      if (fs[fid].pagina === 'kassa' && sec != null) { const sg = sec < 15 ? 'S' : 'L'; (rec.g = rec.g || {})[fid] = sg; cmd.push(['HINCRBY', tk, fid + '|' + vid + '|' + sg + '|n', 1]); } }
  } else {
    if (!rec || !rec.f.length) return { ok: true, niet: 'niets gezien' };
    const w = WAARDE[e], m = N(rec.m), eerst = !String(rec.st || '').split(',').includes(e);
    if (w <= m && !eerst) return { ok: true, dubbel: true };
    if (eerst) rec.st = (rec.st ? rec.st + ',' : '') + e;
    const dw = w > m ? w - m : 0, dq = w > m ? w * w - m * m : 0, eur = e === 'koop' ? Math.max(0, Math.min(5000, N(b.bedrag))) : 0;
    if (w > m) rec.m = w;
    for (const fid of rec.f) { const vid = rec.v[fid], p = fid + '|' + vid + '|';
      for (const cc of [rec.c, ...(rec.g && rec.g[fid] ? [rec.g[fid]] : [])]) { if (dw) { cmd.push(['HINCRBYFLOAT', tk, p + cc + '|s', dw]); cmd.push(['HINCRBYFLOAT', tk, p + cc + '|q', dq]); } }
      if (eerst) cmd.push(['HINCRBY', tk, p + '*|' + e, 1]); if (eur) cmd.push(['HINCRBYFLOAT', tk, p + '*|eur', eur]); }
  }
  cmd.push(['HSET', hk, pid, JSON.stringify(rec)], ['EXPIRE', hk, DAGEN * 86400]);
  await Promise.all(cmd.map(x => kv.raw(x)));
  return { ok: true };
}

// stand: per onderdeel en versie gezien, stappen, gemiddelde waarde, kans dat het de beste is en het aandeel dat hij nu krijgt
export async function proefStand(kv, site) {
  site = await siteNaam(kv, site); const cfg = site ? await leesProef(kv, site, true) : null; if (!cfg) return { ok: false, fout: 'geen proef voor deze site' };
  const r = N(cfg.ronde) || 1, st = await leesTellers(kv, site, r, true), g = k => N(st[k]);
  const factoren = cfg.factoren.map(f => {
    const vs = actief(f), sch = schat(st, f, vs, ''), win = Object.fromEntries(vs.map(x => [x.id, 0])), T = 4000;
    for (let i = 0; i < T; i++) { let b = '', bw = -Infinity; for (const x of sch) { const w = x.m + gauss() * x.sd; if (w > bw) { bw = w; b = x.id; } } win[b]++; }
    const nmin = Math.min(...sch.map(x => x.n)), top = Object.entries(win).sort((x, y) => y[1] - x[1])[0];
    const oordeel = top && top[1] / T >= 0.95 && nmin >= 300 ? 'winnaar: ' + top[0] : 'nog geen winnaar' + (nmin < 300 ? ' (elke versie moet 300 keer gezien zijn)' : '');
    return { id: f.id, wat: f.wat, pagina: f.pagina, uit: !!f.uit, oordeel, versies: (f.varianten || []).map(x => { const s = sch.find(y => y.id === x.id) || { n: 0, s: 0, m: 0 }, p = x.id + '|';
      const per = Object.fromEntries([...CTX, 'S', 'L'].map(cc => { const n = g(f.id + '|' + p + cc + '|n'); return [cc, { gezien: n, waarde: n ? Math.round(100 * g(f.id + '|' + p + cc + '|s') / n) / 100 : null }]; }));
      const kans = x.uit ? 0 : win[x.id] / T;
      return { id: x.id, naam: x.naam, uit: !!x.uit, gezien: s.n, stappen: Object.fromEntries(STAPPEN.map(e => [e, g(f.id + '|' + p + '*|' + e)])), omzet: Math.round(100 * g(f.id + '|' + p + '*|eur')) / 100,
        waarde: s.n ? Math.round(100 * s.s / s.n) / 100 : null, kansBeste: Math.round(100 * kans), aandeelNu: x.uit ? 0 : Math.round(100 * (verken(sch) / vs.length + (1 - verken(sch)) * kans)), perApparaat: per }; }) };
  });
  return { ok: true, site, aan: !!cfg.aan, ronde: r, sinds: cfg.sinds || '', waarde: WAARDE, factoren };
}
export function proefTekst(s) {
  if (!s.ok) return s.fout || 'fout';
  const STAP = { b20: '20 s', veld: 'veld', methode: 'betaalmethode', betaal: 'op Betalen', koop: 'betaald' };
  const L = [`Clickmind-proef ${s.site} (ronde ${s.ronde}, sinds ${s.sinds}) — ${s.aan ? 'AAN' : 'UIT'}`, `Waarde per bezoeker: 20 s op de afrekenpagina 1, veld 3, betaalmethode 5, op Betalen 20, betaald 100.`, ''];
  for (const f of s.factoren) {
    L.push(`${f.wat} (${f.id}, ${f.pagina}${f.uit ? ', UIT' : ''}) — ${f.oordeel}`);
    for (const v of f.versies) { const pa = v.perApparaat, ap = CTX.filter(c => pa[c].gezien).map(c => `${CTX_NAAM[c]} ${pa[c].gezien}×${pa[c].waarde}`).join(', '), sn = pa.S.gezien || pa.L.gezien ? ` · snel naar kassa ${pa.S.gezien}×${pa.S.waarde ?? '-'}, rustig ${pa.L.gezien}×${pa.L.waarde ?? '-'}` : '';
      L.push(`  ${v.id}: ${v.naam}${v.uit ? ' [uit]' : ''}`, `     gezien ${v.gezien}, waarde ${v.waarde ?? '-'}, ${STAPPEN.map(e => STAP[e] + ' ' + v.stappen[e]).join(', ')}${v.omzet ? ', omzet €' + v.omzet : ''} · kans beste ${v.kansBeste}% · krijgt nu ${v.aandeelNu}%${ap ? ' · ' + ap : ''}${sn}`); }
    L.push('');
  }
  return L.join('\n');
}

// aan/uit, onderdelen aanpassen of een nieuwe ronde (tellers opnieuw; de oude ronde blijft staan)
export async function proefZet(kv, site, { aan, j, ronde }) {
  site = await siteNaam(kv, site); if (!site) return { ok: false, fout: 'site' };
  const cfg = JSON.parse(JSON.stringify((await leesProef(kv, site, true)) || { aan: false, ronde: 1, factoren: [] }));
  if (j) { const n = typeof j === 'string' ? JSON.parse(j) : j; if (!n || !Array.isArray(n.factoren) || !n.factoren.every(f => ok(f.id) && Array.isArray(f.varianten) && f.varianten.length && f.varianten.every(v => /^[a-z]$/.test(v.id)))) return { ok: false, fout: 'factoren: [{id, pagina, wat, varianten: [{id: a|b|…, naam}]}]' }; cfg.factoren = n.factoren; if (n.sinds) cfg.sinds = n.sinds; }
  if (aan != null) cfg.aan = !!aan;
  if (ronde) { cfg.ronde = (N(cfg.ronde) || 1) + 1; cfg.sinds = dag(); }
  await kv.set('mm:proef:' + site, JSON.stringify(cfg)); CFG.delete(site);
  return { ok: true, site, aan: cfg.aan, ronde: cfg.ronde, factoren: cfg.factoren.map(f => f.id + (f.uit ? ' (uit)' : '')) };
}
