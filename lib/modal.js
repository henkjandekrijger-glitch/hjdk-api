// DE LERENDE MODAL (Henkjan 14 okt 2026): "nog meer uit een klik halen met een lerende modal op onze sites: andere site tonen of e-mail invoeren".
// Eén script op elke eigen pagina:  <script src="https://whichtobuy.best/mmm.js" data-site="<site>" async></script>
//   De server kiest per bezoeker een arm: e-mail (aanmelden), site (een andere eigen site tonen) of geen (controlegroep: geen modal).
//   - Per bezoeker vast (hash van de persoon), hoogstens één keer per 'cap' uur, nooit vóór minSec seconden op de pagina, nooit aan bots (webdriver).
//   - Moment per arm: exit (muis naar boven of snel terugscrollen op mobiel, en terugkomen naar het tabblad), tijd (na sec seconden), scroll (60%).
//   - Gemeten per beslissing (ook bij de controlegroep): toon, klik, sluit, hoofd (de gewone klik naar buiten, bv. naar Amazon), aanmelding,
//     en via de klik-id (mmc) ook wat er op de andere site gebeurt (echt, actie, aanmelding, koop met /mmu.js).
//   - Waarde per bezoeker = hoofd x waarde.hoofd + klik x waarde.klik + aanmelding x waarde.aanmelding + koop x waarde.koop (centen).
//     De controlegroep laat zien of de modal de gewone klik kost. Modus leer: elk uur Thompson per segment (mobiel/desktop x nieuw/terug).
//   - Nooit Amazon in de modal (alleen eigen sites en e-mail), nooit een beloning voor kopen, nooit de terugknop kapen.
//   - E-mail: de pagina mag een eigen aanmeldfunctie hebben (window.mmAanmelden(email) -> Promise<bool>, bv. todayin of finds met hun eigen lijst en bevestiging);
//     anders bewaren we het adres met de toestemmingstekst in mm:mail:<lijst> (bevestigd: false). Mailen pas met dubbele bevestiging en op Henkjans woord.
// Opslag: mm:modal:<site> instelling, mm:modals namen, mm:md:<dag> tellers "<site>|<arm>|<seg>|<veld>" (60 d), mm:cid:<mid> (30 d, veld modal),
//   mm:mu:<mid>:<ev> dubbelcheck, mm:mqc:<site>:<id> cap, mm:mail:<lijst> adressen.
import { createHash } from 'node:crypto';
import { nieuwId, dag } from './mensmeter.js';
import { soortPersoon, beta, uitkomst } from './wissel.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const T = { teller: 60 * 86400, cid: 30 * 86400 };
const paren = h => { if (!h) return []; if (Array.isArray(h)) { const o = []; for (let i = 0; i + 1 < h.length; i += 2) o.push([String(h[i]), h[i + 1]]); return o; } return Object.entries(h); };
export const SEGMENTEN = ['m-n', 'm-t', 'd-n', 'd-t'];
export const EVENTS = ['toon', 'klik', 'sluit', 'hoofd'];
const MOMENT = ['exit', 'tijd', 'scroll'];
// Alleen eigen domeinen, nooit Amazon (een Amazon-link in een pop-up is riskant voor het Associates-account)
const EIGEN = /^(?:[a-z0-9-]+\.)*(todayin\.email|finds\.email|mylevel\.today|whichtobuy\.best|kaufberater\.best|keuzehulp\.best|outname\.now|yoo\.rs|praisy\.me|moonlighter\.email)$/i;
export const eigenHost = h => EIGEN.test(String(h || '').split(':')[0]);
export function siteUrlOk(u) { try { const x = new URL(String(u).replace(/\{[a-z]+\}/g, 'x')); return x.protocol === 'https:' && eigenHost(x.hostname) && !x.username && !x.password; } catch (e) { return false; } }
const tekst = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u2028\u2029]/g, ' ').trim().slice(0, n);

// ---- instelling controleren ----
export function checkModal(c, oud) {
  const f = m => ({ ok: false, fout: m });
  if (!c || typeof c !== 'object') return f('geen JSON-object');
  const site = String(c.site || '').toLowerCase(); if (!/^[a-z0-9-]{2,30}$/.test(site)) return f('site: 2-30 tekens a-z, 0-9 of -');
  const domeinen = (Array.isArray(c.domeinen) ? c.domeinen : []).map(d => String(d).toLowerCase().trim()).filter(Boolean).slice(0, 6);
  if (!domeinen.length || !domeinen.every(eigenHost)) return f('domeinen: 1 tot 6 eigen domeinen waar het script mag draaien');
  const w = c.waarde || {};
  const waarde = { hoofd: Math.max(0, Math.min(1000, N(w.hoofd != null ? w.hoofd : 1))), klik: Math.max(0, Math.min(1000, N(w.klik != null ? w.klik : 2))), aanmelding: Math.max(0, Math.min(5000, N(w.aanmelding != null ? w.aanmelding : 70))), koop: Math.max(0, Math.min(100000, N(w.koop != null ? w.koop : 300))) };
  if (!Array.isArray(c.armen) || c.armen.length < 2 || c.armen.length > 8) return f('armen: 2 tot 8 (waarvan minstens één controlegroep, soort geen)');
  const ids = new Set(), armen = [];
  for (const a of c.armen) {
    const id = String(a.id || '').toLowerCase(); if (!/^[a-z0-9-]{1,20}$/.test(id) || ids.has(id)) return f('arm-id ontbreekt, is ongeldig of dubbel: ' + id); ids.add(id);
    const gewicht = Math.max(0, Math.min(1000, N(a.gewicht != null ? a.gewicht : 1)));
    const wie = ['alle', 'nieuw', 'terug'].includes(a.wie) ? a.wie : 'alle';
    if (a.soort === 'geen') { armen.push({ id, soort: 'geen', gewicht, wie }); continue; }
    const moment = MOMENT.includes(a.moment) ? a.moment : 'exit', sec = Math.max(3, Math.min(600, N(a.sec) || 20));
    const basis = { id, soort: a.soort, gewicht, wie, moment, sec, titel: tekst(a.titel, 80), tekst: tekst(a.tekst, 240), knop: tekst(a.knop, 40), nee: tekst(a.nee || 'No thanks', 40), notitie: a.notitie ? tekst(a.notitie, 200) : undefined };
    if (!basis.titel || !basis.knop) return f('arm ' + id + ': titel en knop zijn nodig');
    if (a.soort === 'site') {
      if (!siteUrlOk(a.url)) return f('arm ' + id + ': url moet https zijn en naar een eigen site gaan (nooit Amazon)');
      armen.push({ ...basis, url: String(a.url).slice(0, 600) });
    } else if (a.soort === 'email') {
      const lijst = String(a.lijst || site).toLowerCase(); if (!/^[a-z0-9-]{2,30}$/.test(lijst)) return f('arm ' + id + ': lijst 2-30 tekens');
      armen.push({ ...basis, lijst, veld: tekst(a.veld || 'Your email', 40), klein: tekst(a.klein || 'Unsubscribe anytime. We never share your email.', 160), dank: tekst(a.dank || 'Thanks! Check your inbox.', 120) });
    } else return f('arm ' + id + ': soort moet email, site of geen zijn');
  }
  if (!armen.some(a => a.soort === 'geen' && a.wie === 'alle')) return f('een controlegroep is verplicht (soort geen, wie alle): zonder kun je niet zien of de modal de gewone klik kost');
  const m = {
    site, domeinen, uit: c.uit !== false, modus: c.modus === 'leer' ? 'leer' : 'vast', verken: Math.max(0.02, Math.min(0.5, N(c.verken) || 0.1)),
    controle: Math.max(0.05, Math.min(0.5, N(c.controle) || 0.1)), cap: Math.max(1, Math.min(24 * 30, N(c.cap) || 72)), minSec: Math.max(3, Math.min(120, N(c.minSec) || 8)),
    taal: /^[a-z]{2}$/.test(String(c.taal || '')) ? c.taal : 'en', waarde, armen, notitie: c.notitie ? tekst(c.notitie, 400) : undefined,
    versie: N(oud && oud.versie) + 1, bijgewerkt: new Date().toISOString(), leer: oud && oud.leer, leerAt: oud && oud.leerAt
  };
  return { ok: true, modal: m };
}

const CACHE = new Map();
export async function leesModal(kv, site, vers = false) {
  const k = String(site || '').toLowerCase(), c = CACHE.get(k);
  if (!vers && c && Date.now() - c.at < 30000) return c.m;
  const m = await kv.get('mm:modal:' + k); CACHE.set(k, { at: Date.now(), m: m || null }); return m || null;
}
export async function bewaarModal(kv, c) {
  const oud = await kv.get('mm:modal:' + String(c && c.site || '').toLowerCase());
  const r = checkModal(c, oud); if (!r.ok) return r;
  if (oud && oud.leer) { const ids = new Set(r.modal.armen.map(a => a.id)); r.modal.leer = Object.fromEntries(Object.entries(oud.leer).map(([s, g]) => [s, Object.fromEntries(Object.entries(g || {}).filter(([k]) => ids.has(k)))])); }
  await kv.set('mm:modal:' + r.modal.site, r.modal); await kv.raw(['SADD', 'mm:modals', r.modal.site]); CACHE.delete(r.modal.site);
  return r;
}
export async function alleModals(kv) { const ns = ((await kv.raw(['SMEMBERS', 'mm:modals']).catch(() => [])) || []).map(String).sort(); return (await Promise.all(ns.map(n => kv.get('mm:modal:' + n)))).filter(Boolean); }

// ---- arm kiezen: per bezoeker vast, de controlegroep krijgt altijd minstens 'controle' ----
export function kiesModalArm(m, seg, abonnee, id) {
  const terug = seg.endsWith('-t');
  const geschikt = m.armen.filter(a => (a.wie === 'alle' || (a.wie === 'terug') === terug) && !(abonnee && a.soort === 'email'));
  if (!geschikt.length) return null;
  const geleerd = m.modus === 'leer' && m.leer ? (m.leer[seg] || m.leer['*']) : null;
  let gw = geschikt.map(a => Math.max(0, geleerd && geleerd[a.id] != null ? N(geleerd[a.id]) : N(a.gewicht)));
  let som = gw.reduce((x, y) => x + y, 0); if (!(som > 0)) { gw = geschikt.map(() => 1); som = gw.length; }
  const ci = geschikt.map((a, i) => (a.soort === 'geen' ? i : -1)).filter(i => i >= 0), csom = ci.reduce((s, i) => s + gw[i], 0);
  if (ci.length && csom / som < m.controle) { // controlegroep ophogen tot het minimum
    const rest = som - csom, doelC = m.controle * rest / (1 - m.controle);
    ci.forEach(i => { gw[i] = csom > 0 ? gw[i] * doelC / csom : doelC / ci.length; }); som = rest + doelC;
  }
  const h = createHash('sha256').update(id + '|' + m.site + '|' + m.versie + '|' + seg).digest().readUInt32BE(0) / 4294967296 * som;
  let acc = 0; for (let i = 0; i < geschikt.length; i++) { acc += gw[i]; if (h < acc) return geschikt[i]; }
  return geschikt[geschikt.length - 1];
}

// ---- beslissing voor één paginabezoek ----
export async function modalBeslis(kv, { site, pid, q, mmc, v, mob, abo, test, origin, land }) {
  const m = await leesModal(kv, site);
  if (!m) return { toon: false, reden: 'onbekende site' };
  let oHost = ''; try { oHost = origin ? new URL(origin).hostname.toLowerCase() : ''; } catch (e) {}
  if (oHost && !m.domeinen.some(d => oHost === d || oHost.endsWith('.' + d))) return { toon: false, reden: 'domein hoort niet bij deze site' };
  if (test) { const a = m.armen.find(x => x.id === String(test).toLowerCase()); return a ? { toon: a.soort !== 'geen', test: true, mid: '', min: 0, arm: openbaar(a, m, { cid: '' }) } : { toon: false, reden: 'onbekende arm' }; }
  if (m.uit) return { toon: false, reden: 'uit' };
  let k = null; if (/^[0-9a-f]{8,24}$/.test(String(mmc || ''))) k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + mmc]).catch(() => null)));
  if (!pid && k && k.pid) pid = k.pid;
  const id = pid || (/^[0-9a-f]{16}$/.test(String(q || '')) ? 'q' + q : '');
  if (!id) return { toon: false, reden: 'geen bezoekers-id' };
  let p = null; if (pid) p = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:p:' + pid]).catch(() => null)));
  const soort = soortPersoon(p && Object.keys(p).length ? p : null);
  const terug = N(v) > 1 || N(p && p.n) > 1, seg = (mob ? 'm' : 'd') + '-' + (terug ? 't' : 'n');
  const abonnee = abo || soort.has('abonnee');
  const capOk = String(await kv.raw(['SET', 'mm:mqc:' + m.site + ':' + id, '1', 'NX', 'EX', Math.round(m.cap * 3600)])) === 'OK';
  if (!capOk) return { toon: false, reden: 'al gezien binnen ' + m.cap + ' uur' };
  const a = kiesModalArm(m, seg, abonnee, id);
  if (!a) return { toon: false, reden: 'geen arm voor deze bezoeker' };
  const mid = nieuwId(6), D = dag();
  await Promise.all([
    kv.raw(['HSET', 'mm:cid:' + mid, 't', Date.now(), 'pid', id, 'wissel', '', 'modal', m.site, 'arm', a.id, 'seg', seg, 'net', (k && k.net) || '-', 'zone', (k && k.zone) || '-', 'camp', (k && k.camp) || '-', 'tag', '', 'van', mmc || '', 'land', land || '']),
    kv.raw(['EXPIRE', 'mm:cid:' + mid, T.cid]),
    kv.raw(['HINCRBY', 'mm:md:' + D, m.site + '|' + a.id + '|' + seg + '|n', 1]), kv.raw(['EXPIRE', 'mm:md:' + D, T.teller])
  ]);
  return { toon: a.soort !== 'geen', mid, min: m.minSec, arm: openbaar(a, m, { cid: mid }) };
}
// wat de browser van een arm te zien krijgt (geen gewichten of notities)
function openbaar(a, m, { cid }) {
  if (a.soort === 'geen') return { id: a.id, soort: 'geen' };
  const o = { id: a.id, soort: a.soort, moment: a.moment, sec: a.sec, titel: a.titel, tekst: a.tekst, knop: a.knop, nee: a.nee, taal: m.taal };
  if (a.soort === 'site') { const u = new URL(a.url.replace(/\{([a-z]+)\}/g, (x, k) => (k === 'cid' ? cid : k === 'site' ? m.site : k === 'arm' ? a.id : ''))); u.searchParams.set('mmc', cid || 'test'); o.href = u.href; }
  if (a.soort === 'email') { o.veld = a.veld; o.klein = a.klein; o.dank = a.dank; }
  return o;
}

// ---- gebeurtenis bij een beslissing (eenmaal per beslissing en soort) ----
export async function modalEv(kv, { mid, e }) {
  mid = String(mid || ''); e = String(e || '');
  if (!/^[0-9a-f]{12}$/.test(mid) || !EVENTS.includes(e)) return { ok: false, fout: 'mid of e' };
  const k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + mid])));
  if (!k.modal) return { ok: false, fout: 'onbekende beslissing' };
  if (String(await kv.raw(['SET', 'mm:mu:' + mid + ':' + e, '1', 'NX', 'EX', T.cid])) !== 'OK') return { ok: true, dubbel: true };
  const D = new Date(N(k.t) || Date.now()).toISOString().slice(0, 10);
  await kv.raw(['HINCRBY', 'mm:md:' + D, k.modal + '|' + k.arm + '|' + k.seg + '|' + e, 1]); await kv.raw(['EXPIRE', 'mm:md:' + D, T.teller]);
  return { ok: true };
}

// ---- e-mail uit de modal ----
const MAIL = /^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i;
export async function modalMail(kv, { mid, email, bewaar, ipNet, land }) {
  mid = String(mid || ''); email = String(email || '').trim().toLowerCase();
  if (!/^[0-9a-f]{12}$/.test(mid)) return { ok: false, fout: 'mid' };
  if (email.length > 254 || !MAIL.test(email)) return { ok: false, fout: 'e-mailadres klopt niet' };
  const rl = 'mm:mailrl:' + createHash('sha256').update(String(ipNet || '')).digest('hex').slice(0, 16);
  if (N(await kv.raw(['INCR', rl])) > 5) return { ok: false, fout: 'te veel aanmeldingen vanaf dit adres, probeer het later' };
  await kv.raw(['EXPIRE', rl, 3600]);
  const k = Object.fromEntries(paren(await kv.raw(['HGETALL', 'mm:cid:' + mid])));
  if (!k.modal) return { ok: false, fout: 'onbekende beslissing' };
  const m = await leesModal(kv, k.modal); const a = m && m.armen.find(x => x.id === k.arm);
  if (!a || a.soort !== 'email') return { ok: false, fout: 'deze beslissing was geen e-mailaanbod' };
  if (bewaar !== false) {
    const oud = await kv.raw(['HGET', 'mm:mail:' + a.lijst, email]);
    if (!oud) await kv.raw(['HSET', 'mm:mail:' + a.lijst, email, JSON.stringify({ t: new Date().toISOString(), site: k.modal, arm: k.arm, net: k.net, zone: k.zone, camp: k.camp, land: land || k.land || '', toestemming: a.titel + ' | ' + a.knop + ' | ' + a.klein, bevestigd: false })]);
  }
  await uitkomst(kv, { cid: mid, soort: 'aanmelding', bron: 'modal:' + k.modal });
  return { ok: true, eigenLijst: bewaar === false };
}

// ---- stand per site, per arm en segment ----
export async function modalStand(kv, m, dagen = 14) {
  const D = Array.from({ length: Math.max(1, Math.min(60, dagen)) }, (_, i) => dag(-i));
  const hs = await Promise.all(D.map(d => kv.raw(['HGETALL', 'mm:md:' + d]).catch(() => null)));
  const leeg = () => ({ n: 0, toon: 0, klik: 0, sluit: 0, hoofd: 0, echt: 0, actie: 0, aanmelding: 0, koop: 0 });
  const per = {}; for (const a of m.armen) { per[a.id] = { '*': leeg() }; for (const s of SEGMENTEN) per[a.id][s] = leeg(); }
  for (const h of hs) for (const [f, v] of paren(h)) { const p = f.split('|'); if (p[0] !== m.site || !per[p[1]] || !per[p[1]][p[2]] || !(p[3] in per[p[1]]['*'])) continue; per[p[1]][p[2]][p[3]] += N(v); per[p[1]]['*'][p[3]] += N(v); }
  const w = m.waarde, waardePer1000 = x => (x.n ? Math.round((x.hoofd * w.hoofd + x.klik * w.klik + x.aanmelding * w.aanmelding + x.koop * w.koop) / x.n * 1000) / 100 : null); // dollar per 1.000 bezoekers
  const ctrl = m.armen.filter(a => a.soort === 'geen').map(a => per[a.id]['*']), cn = ctrl.reduce((s, x) => s + x.n, 0), ch = ctrl.reduce((s, x) => s + x.hoofd, 0);
  const hoofdCtrl = cn ? ch / cn : null;
  return m.armen.map(a => { const x = per[a.id]['*']; return { id: a.id, soort: a.soort, moment: a.moment || '', ...x, pctToon: x.n ? Math.round(x.toon / x.n * 1000) / 10 : null, pctHoofd: x.n ? Math.round(x.hoofd / x.n * 1000) / 10 : null, hoofdTegenControle: x.n && hoofdCtrl != null && a.soort !== 'geen' ? Math.round((x.hoofd / x.n - hoofdCtrl) * 1000) / 10 : null, dollarPer1000: waardePer1000(x), segmenten: per[a.id] }; });
}

// ---- Thompson op waarde: per trekking per gebeurtenis een beta, maal de waarde ----
export function thompsonWaarde(rijen, waarde, { verken = 0.1, trekkingen = 3000 } = {}) {
  if (!rijen.length) return {};
  // alleen gebeurtenissen die al eens voorkwamen: een zeldzame dure gebeurtenis (koop) zonder enige meting is anders pure ruis
  const ev = ['hoofd', 'klik', 'aanmelding', 'koop'].filter(e => waarde[e] && rijen.some(x => N(x[e]) > 0)), winst = rijen.map(() => 0);
  for (let i = 0; i < trekkingen; i++) {
    let best = -1, bi = 0;
    rijen.forEach((x, j) => { let v = 0; for (const e of ev) v += beta(1 + N(x[e]), 1 + Math.max(0, N(x.n) - N(x[e]))) * waarde[e]; if (v > best) { best = v; bi = j; } });
    winst[bi]++;
  }
  const k = rijen.length, vloer = Math.min(verken / k, 1 / k), rest = 1 - vloer * k;
  return Object.fromEntries(rijen.map((x, j) => [x.id, Math.round((vloer + rest * winst[j] / trekkingen) * 1000) / 10]));
}
// leerronde: gewichten per segment (alleen segmenten met genoeg beslissingen) en voor iedereen ('*')
export async function modalLeer(kv, { droog = false } = {}) {
  const uit = [];
  for (const m of await alleModals(kv)) {
    const st = await modalStand(kv, m, 14);
    const r = { site: m.site, modus: m.modus, uit: m.uit, beslissingen: st.reduce((s, x) => s + x.n, 0), dollarPer1000: Object.fromEntries(st.map(x => [x.id, x.dollarPer1000])) };
    if (m.modus === 'leer' && r.beslissingen >= 50) {
      const leer = { '*': thompsonWaarde(st.map(x => ({ id: x.id, ...x.segmenten['*'] })), m.waarde, { verken: m.verken }) };
      for (const s of SEGMENTEN) { const rijen = st.map(x => ({ id: x.id, ...x.segmenten[s] })); if (rijen.reduce((t, x) => t + x.n, 0) >= 200) leer[s] = thompsonWaarde(rijen, m.waarde, { verken: m.verken }); }
      r.leer = leer;
      if (!droog) { const vers = await kv.get('mm:modal:' + m.site); if (vers) { vers.leer = leer; vers.leerAt = new Date().toISOString(); await kv.set('mm:modal:' + m.site, vers); CACHE.delete(m.site); } }
    }
    uit.push(r);
  }
  return uit;
}
