// Kadoly: trainen voor centen ("Eindelijk betaald voor je data"), het verlanglijstje dat eruit groeit en de verjaardagskalender voor de familie.
// Henkjan 21 nov 2026: "iedere keer als je de AI gaat trainen wat jij ok vindt krijg je 1 cent en de gene die je uitnodigde ook 1 cent",
// "Er kunnen menselijk checks tussen de trainingen zitten. En je kunt alles vragen salaris etc", "Ja bouw het zo", "Ja zet er in gaan we testen of gebruikt wordt".
// Werking: OVERDRACHT-KADOLY-SPAARPOT.md §4.2f. Live alleen samen met de Spaarpot (kv dk:aan); testwereld met &test=1 op de beschermde host.
// - 100 kaarten, 10 per dag: per dag 7 cadeaus (Wil ik / Niet voor mij), 2 vragen over jezelf en 1 mens-check. Elke kaart 1 cent voor jou en 1 cent voor wie je uitnodigde.
// - Een dag telt niet als iemand binnen SNEL_MS tikt, de check mist of een teruggekomen cadeau (kaart 54) anders beoordeelt. Hij hoort dat de ronde niet telde, niet waarom.
// - Zonder e-mailadres staan de centen klaar (s.ok, s.okVan); bij bevestigen boekt dagkans.bevestig ze op de pot van het nieuwe lid en van wie uitnodigde.
// - Elke "Wil ik" komt op een echte verlanglijst van gids.kadoly.com/w (lib/lijst), met delen, afvinken, samen geven en lootjes van die tool.
// - Verjaardagskalender (op=dkkal): iedereen tikt zijn eigen dag aan; seintje 14 en 3 dagen vooraf. Verjaardagen uit het trainen geven leden 14 dagen vooraf drie cadeaus.
import { randomBytes } from 'node:crypto';
import { kv } from './db.js';
import * as WL from './lijst/data.js';

const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
export const DAG = 10, TOTAAL = 100, SNEL_MS = 700, VRIEND_MAX_DAG = 100;
export const VORM = ['p', 'p', 'p', 'p', 'q', 'p', 'p', 'c', 'p', 'q']; // per dag 7 cadeaus, 2 vragen, 1 check
const HERHAAL = { bij: 38, van: 2 }; // cadeau 38 (kaart 54) is cadeau 2 opnieuw: tegenspraak-check
export const REL = ['Mijn moeder', 'Mijn vader', 'Mijn partner', 'Mijn kind', 'Een vriend(in)', 'Mijn broer of zus'];
export const MAAND = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
export const dagenIn = m => [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] || 0;
export const VRAGEN = [
  { id: 'leeftijd', t: 'Hoe oud ben je?', o: ['Jonger dan 18', '18 tot 25', '25 tot 35', '35 tot 45', '45 tot 55', '55 tot 65', '65 of ouder'] },
  { id: 'jarig1', t: 'Wie is als eerste jarig?', jarig: 1 },
  { id: 'voorwie', t: 'Voor wie koop je dit jaar de meeste cadeaus?', o: ['Mijn partner', 'Mijn kinderen', 'Mijn ouders', 'Vrienden', 'Collega’s'] },
  { id: 'budget', t: 'Wat geef je meestal uit aan een cadeau?', o: ['Tot €15', '€15 tot €30', '€30 tot €50', 'Meer dan €50'] },
  { id: 'salaris', t: 'Wat verdien je ongeveer per maand?', o: ['Tot €2.000', '€2.000 tot €3.500', '€3.500 tot €5.000', 'Meer dan €5.000'], waarom: 'We gebruiken dit om cadeaus in jouw prijsklasse te kiezen.' },
  { id: 'lootjes', t: 'Trek je dit jaar lootjes voor Sinterklaas?', o: ['Ja', 'Nee', 'Weet ik nog niet'] },
  { id: 'wonen', t: 'Met wie woon je?', o: ['Alleen', 'Met mijn partner', 'Met partner en kinderen', 'Met huisgenoten', 'Bij mijn ouders'] },
  { id: 'kinderen', t: 'Heb je kinderen?', o: ['Nee', 'Ja, tot 4 jaar', 'Ja, 5 tot 12 jaar', 'Ja, 13 jaar of ouder'] },
  { id: 'praktisch', t: 'Wat geef je liever?', o: ['Iets praktisch', 'Iets moois', 'Een belevenis'] },
  { id: 'kerst', t: 'Wanneer koop je je kerstcadeaus?', o: ['Begin december', 'Half december', 'De laatste week', 'Op het laatste moment'] },
  { id: 'vrijetijd', t: 'Wat doe je het liefst in je vrije tijd?', o: ['Koken', 'Sporten', 'Lezen', 'Buiten zijn', 'Gamen', 'Reizen'] },
  { id: 'jarig2', t: 'Wie is daarna jarig?', jarig: 1 },
  { id: 'huisdier', t: 'Heb je een huisdier?', o: ['Een hond', 'Een kat', 'Een ander dier', 'Geen huisdier'] },
  { id: 'stijl', t: 'Welke stijl past bij je huis?', o: ['Modern', 'Landelijk', 'Scandinavisch', 'Kleurrijk'] },
  { id: 'belangrijk', t: 'Wat vind je het belangrijkst bij een cadeau?', o: ['De prijs', 'Dat het persoonlijk is', 'Dat het snel in huis is', 'Dat het duurzaam is'] },
  { id: 'grootklein', t: 'Liever één groot cadeau of een paar kleine?', o: ['Eén groot', 'Een paar kleine'] },
  { id: 'drinken', t: 'Koffie of thee?', o: ['Koffie', 'Thee', 'Allebei', 'Geen van beide'] },
  { id: 'waar', t: 'Waar koop je cadeaus het liefst?', o: ['Online', 'In de winkel', 'Allebei'] },
  { id: 'zelf', t: 'Hoe vaak koop je per jaar een cadeau voor jezelf?', o: ['Nooit', 'Een of twee keer', 'Drie keer of vaker'] },
  { id: 'inpakken', t: 'Pak je cadeaus zelf in?', o: ['Ja, graag', 'Liever laten inpakken', 'Ik geef zonder papier'] }
];
export const CHECKS = [['de kaars', ['🧺', '☕', '🕯️'], 2], ['de hond', ['🐱', '🐶', '🐟'], 1], ['de appel', ['🍎', '🍌', '🍇'], 0], ['de zon', ['🌙', '⭐', '☀️'], 2], ['de fiets', ['🚗', '🚲', '✈️'], 1],
  ['het hart', ['❤️', '⭐', '🔷'], 0], ['de boom', ['🌳', '🌵', '🌸'], 0], ['de wekker', ['📷', '⏰', '📱'], 1], ['de vis', ['🐟', '🐦', '🐢'], 0], ['het huis', ['🏢', '⛺', '🏠'], 2]];
export function kaart(n) { const dag = Math.floor(n / DAG), i = n % DAG, voor = VORM.slice(0, i); return { s: VORM[i], dag, pi: dag * 7 + voor.filter(x => x === 'p').length, qi: dag * 2 + voor.filter(x => x === 'q').length, ci: dag }; }

const TK = (c, sid) => c.ns + 'tk:' + sid;
const leesT = (c, sid) => /^[a-f0-9]{32}$/.test(sid || '') ? kv.get(TK(c, sid)).catch(() => null) : null;
const bewaarT = (c, s) => kv.set(TK(c, s.sid), s, { ex: 400 * 86400 });
const smem = async k => { try { const r = await kv.raw(['SMEMBERS', k]); return Array.isArray(r) ? r : []; } catch (e) { return []; } };
const schoon = (v, n) => String(v || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
async function magIp(c, H, ip, soort, max) { const k = c.ns + 'rl:' + soort + ':' + H.h(ip + ':' + new Date().toISOString().slice(0, 10)).slice(0, 16); const n = N(await kv.incr(k).catch(() => 0)); if (n === 1) await kv.raw(['EXPIRE', k, '90000']).catch(() => {}); return n <= max; }

// cadeaus: dezelfde snelle, betaalbare cadeaus als de Spaarpot, per persoon in een eigen vaste volgorde
let PC = null, PC_AT = 0;
async function basis(H) { if (PC && PC.length && Date.now() - PC_AT < 600000) return PC; PC = (await H.catalogus()).filter(i => H.snel(i) && H.thuis(i) <= 80).sort((a, b) => H.populair(b) - H.populair(a)).slice(0, 300).map(H.kort); PC_AT = Date.now(); return PC; }
async function productVoor(H, sid, pi) { const L = await basis(H); if (!L.length) return null; const volg = L.map(o => ({ o, r: H.h(sid + ':' + o.pid) })).sort((a, b) => (a.r < b.r ? -1 : a.r > b.r ? 1 : 0)).map(x => x.o); const rep = pi === HERHAAL.bij; return { ...volg[(rep ? HERHAAL.van : pi) % volg.length], rep }; }

// elke "Wil ik" op een echte verlanglijst van gids.kadoly.com/w
async function opLijst(c, s, pr) {
  let l = s.lijst ? await WL.leesLijst(s.lijst) : null;
  if (!l) { const k = WL.rid(20); l = { id: WL.rid(8), naam: 'Mijn verlanglijstje', gel: 'anders', datum: null, taal: 'nl', ek: WL.hash(k), items: [], t: Date.now(), bron: c.test ? 'tiktest' : 'tik' }; s.lijst = l.id; s.lk = k; await WL.tel('lijst_maak', c.test ? 'tiktest' : 'tik'); }
  l.items = l.items || []; if (l.items.some(x => x.kd === pr.pid)) return;
  l.items.unshift({ i: WL.rid(6), t: WL.kort(pr.naam, 140), p: pr.prijs || null, m: 'EUR', img: pr.img || null, w: 'Kadoly', u: 'https://kadoly.com/product/' + encodeURIComponent(pr.pid) + '?utm_source=verlanglijst', b: null, ean: null, kd: pr.pid, zoek: null, add: Date.now() });
  l.items = l.items.slice(0, 200); await WL.bewaarLijst(l);
}
const lijstUrl = s => 'https://gids.kadoly.com/w/' + s.lijst;

async function dagKlaar(c, s, H) {
  const telt = !s.vlag.length, cent = telt ? N(s.dC) : 0; s.laatste = { D: s.D, telt, c: cent, vlag: [...new Set(s.vlag)] };
  await H.tel(c, telt ? 'tik-dag' : 'tik-dagmis'); for (const v of s.laatste.vlag) await H.tel(c, 'tik-mis-' + v);
  if (!cent) return;
  const lid = s.pid ? await H.lees(c, s.pid) : null;
  if (lid && lid.actief) { await H.eco(c, 'tikcent', H.boek(lid, cent, s.D, 'tik')); await H.bewaar(c, lid); } else s.ok = N(s.ok) + cent;
  if (!s.van) return;
  if (!lid) { s.okVan = N(s.okVan) + cent; return; } // pas bij bevestigen naar wie uitnodigde (geen centen voor nepbezoekjes)
  const iv = await H.lees(c, s.van); if (!iv || !iv.actief || (iv.iph && iv.iph === s.iph)) return;
  const k = c.ns + 'tkv:' + s.van + ':' + s.D, tot = N(await kv.raw(['INCRBY', k, String(cent)]).catch(() => 0)); await kv.raw(['EXPIRE', k, String(3 * 86400)]).catch(() => {});
  const mag = Math.max(0, Math.min(cent, VRIEND_MAX_DAG - (tot - cent))); if (mag) { await H.eco(c, 'tikvriendcent', H.boek(iv, mag, s.D, 'tik-vriend')); await H.bewaar(c, iv); s.laatste.vriend = mag; }
}

export const CSS_TK = `<style>.tk-k{border:1px solid var(--line-strong);border-radius:18px;padding:14px;margin:0 0 14px}.tk-k img{width:100%;max-width:420px;aspect-ratio:1;object-fit:cover;border-radius:14px;display:block;margin:0 auto 10px}.tk-n{font-weight:700;margin:0 0 12px}.tk-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tk-2 .btn{width:100%;min-height:52px}.tk-o{display:grid;gap:8px;margin:0 0 12px}.tk-o button,.tk-o a,.tk-g a,.tk-g button{display:block;text-align:left;min-height:48px;border:1.5px solid var(--ink);border-radius:14px;background:var(--bg);color:var(--ink);font:inherit;font-weight:600;padding:10px 14px;cursor:pointer;text-decoration:none}.tk-g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 12px}.tk-g a,.tk-g button{text-align:center;padding:10px 4px}.tk-g.d7{grid-template-columns:repeat(7,1fr)}.tk-c{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 12px}.tk-c button{font-size:52px;line-height:1;padding:16px 0;border:2px solid var(--line-strong);border-radius:16px;background:var(--bg);cursor:pointer}.tk-toast{background:#E6F6EE;color:#0F7A4A;border-radius:12px;padding:8px 12px;font-weight:700;margin:0 0 12px}.tk-mis{background:#FDECEA;color:#B42318;border-radius:12px;padding:12px 14px;font-weight:700;margin:0 0 12px}.tk-b{height:8px;border-radius:4px;background:var(--acc-2);overflow:hidden;margin:6px 0 14px}.tk-b i{display:block;height:100%;background:var(--acc)}.tk-groot{font-size:44px;font-weight:800;line-height:1.1;margin:0 0 8px}.tk-l{list-style:none;padding:0;margin:0 0 14px}.tk-l li{border-bottom:1px solid var(--line-strong);padding:8px 0}.tk-sla{background:none;border:0;color:var(--ink);text-decoration:underline;font:inherit;padding:6px 0;cursor:pointer}</style>`;

// ---------- trainen: op=dktik ----------
export async function tikOp(x, H) {
  const { c, D, req, res, q, pagina, naar, vanHier, leesBody, p0, ip } = x, esc = H.esc;
  const ck = 'dktk' + (c.test ? 't' : ''); let sid = (String(req.headers.cookie || '').match(new RegExp('(?:^|;\\s*)' + ck + '=([a-f0-9]{32})')) || [])[1] || '';
  if (p0 && p0.tik) sid = p0.tik;
  let s = sid ? await leesT(c, sid) : null;
  if (!s) { sid = randomBytes(16).toString('hex'); s = { sid, at: Date.now(), n: 0, D: '', dN: 0, dC: 0, vlag: [], ok: 0, okVan: 0, wil: 0, oord: {}, ant: {}, t0: 0 }; await H.tel(c, 'tik-nieuw'); }
  res.setHeader('set-cookie', ck + '=' + sid + '; Max-Age=' + 400 * 86400 + '; Path=/; Secure; HttpOnly; SameSite=Lax');
  if (!s.iph) s.iph = H.h('ip:' + ip).slice(0, 12);
  const vc = String(q.get('v') || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  if (vc && !s.v && !s.pid) { const r = String((await kv.get(c.ns + 'code:' + vc).catch(() => '')) || ''); if (r && (!p0 || r !== p0.id)) { s.v = vc; s.van = r; await H.tel(c, 'tik-via-vriend'); } }
  if (!s.ad && q.get('n')) s.ad = { n: q.get('n'), z: q.get('z'), c: q.get('c'), s: q.get('s') }; // aanmelden schoont dit op (adVan)
  if (p0) { s.pid = p0.id; if (p0.tik !== sid) { p0.tik = sid; await H.bewaar(c, p0); } }
  if (s.D !== D) { s.D = D; s.dN = 0; s.dC = 0; s.vlag = []; }
  const kk = p0 ? '&k=' + p0.link : '', self = (extra = '') => H.u(c, 'dktik', kk + extra);
  const lid = s.pid ? await H.lees(c, s.pid) : null;

  // delen via WhatsApp, geteld
  if (q.get('w') === 'wa') { if (!lid || !lid.code) return naar(self()); await H.tel(c, 'tik-deel');
    return naar('https://wa.me/?text=' + encodeURIComponent('Eindelijk betaald voor je data 😄 Elke tik op een cadeau is een cent voor jou en een voor mij. Doe je mee? ' + H.u(c, 'dktik', '&v=' + lid.code))); }
  if (q.get('w') === 'lijst') { if (!s.lijst) return naar(self()); await H.tel(c, 'tik-lijstdeel'); return naar('https://wa.me/?text=' + encodeURIComponent('Mijn verlanglijstje: ' + lijstUrl(s))); }

  if (req.method === 'POST') {
    if (!vanHier()) return res.status(403).send('Niet toegestaan'); const b = await leesBody(req), a = String(b.a || '');
    if (a === 'mail') { if (s.pid) return naar(self());
      const r = await H.aanmelden(c, { email: b.email, oud: b.oud, v: s.v, ad: s.ad, ms: 5000, website: b.website, tk: s.sid }, ip, null).catch(() => ({ ok: false, fout: 'Dat lukte even niet. Probeer het zo nog eens.' }));
      if (r.ok) { s.mailAt = Date.now(); s.mailFout = ''; await H.tel(c, 'tik-mail'); } else s.mailFout = String(r.fout || '').slice(0, 160);
      await bewaarT(c, s); return naar(self(r.ok ? '&mail=1' : '&mail=0')); }
    if (s.stop || s.n >= TOTAAL || s.dN >= DAG) return naar(self());
    const k = kaart(s.n), el = Date.now() - N(s.t0); let cent = 0;
    if (k.s === 'p' && (a === 'wil' || a === 'niet')) {
      const pr = await productVoor(H, s.sid, k.pi); if (!pr || String(b.p || '') !== pr.pid) return naar(self()); // dubbele tik of oude kaart
      const ja = a === 'wil'; if (el < SNEL_MS) s.vlag.push('snel');
      if (pr.rep) { const eerder = s.oord[pr.pid]; if (eerder !== undefined && eerder !== (ja ? 1 : 0)) s.vlag.push('tegen'); }
      else { s.oord[pr.pid] = ja ? 1 : 0; if (ja) { await opLijst(c, s, pr).catch(() => {}); s.wil = N(s.wil) + 1; } await kv.raw(['HINCRBY', c.ns + 'tikoord', pr.pid + (ja ? ':j' : ':n'), '1']).catch(() => {}); }
      cent = 1; await H.tel(c, ja ? 'tik-wil' : 'tik-niet');
    } else if (k.s === 'c' && a === 'c') { const goed = String(b.v) === String(CHECKS[k.ci % CHECKS.length][2]); if (goed) cent = 1; else s.vlag.push('check'); await H.tel(c, goed ? 'tik-check' : 'tik-checkmis'); }
    else if (k.s === 'q') { const vr = VRAGEN[k.qi % VRAGEN.length]; if (String(b.q || '') !== vr.id) return naar(self());
      if (a === 'sla') await H.tel(c, 'tik-sla');
      else if (a === 'jarig' && vr.jarig) { const r = N(b.r), m = N(b.m), d = N(b.d); if (!(r >= 0 && r < REL.length && m >= 1 && m <= 12 && d >= 1 && d <= dagenIn(m))) return naar(self()); s.ant[vr.id] = { r: REL[r], m, d }; cent = 1; await H.tel(c, 'tik-jarig'); }
      else if (a === 'o' && vr.o) { const i = Math.floor(N(b.v)); if (!(i >= 0 && i < vr.o.length) || b.v === undefined || b.v === '') return naar(self());
        if (vr.id === 'leeftijd' && i === 0) { s.stop = true; await H.tel(c, 'tik-jong'); await bewaarT(c, s); return naar(self()); }
        s.ant[vr.id] = vr.o[i]; cent = 1; await kv.raw(['HINCRBY', c.ns + 'tikant:' + vr.id, String(i), '1']).catch(() => {}); await H.tel(c, 'tik-vraag'); }
      else return naar(self()); }
    else return naar(self());
    s.n++; s.dN++; s.dC += cent; await H.tel(c, 'tik-kaart');
    if (s.dN >= DAG || s.n >= TOTAAL) await dagKlaar(c, s, H);
    await bewaarT(c, s); return naar(self(cent ? '&g=1' : ''));
  }

  const kop = `<p class="kicker">Kadoly · Eindelijk betaald voor je data</p>`, P = (t, h = '') => pagina(200, t, CSS_TK + kop + h);
  if (s.stop) { await bewaarT(c, s); return P('Meedoen kan vanaf 18 jaar', `<h1>Meedoen kan vanaf 18 jaar</h1><p>Je centen en je antwoorden bewaren we niet. Ben je 18 of ouder, dan kun je later gewoon meedoen.</p>`); }
  const vriendRegel = s.van ? ' en 1 cent voor wie je deze link stuurde' : '';

  // einde van de dag (of alle 100 gedaan)
  if (s.n >= TOTAAL || s.dN >= DAG) { await bewaarT(c, s); const L = s.laatste || {}; let h = `<h1>${s.n >= TOTAAL ? 'Je hebt alle 100 kaarten gedaan' : 'Klaar voor vandaag'}</h1>`;
    if (L.D === D) h += L.telt ? `<p class="tk-groot">+${L.c} cent</p>${s.van ? `<p>Wie je uitnodigde krijgt er ook ${L.c} cent bij${lid ? '' : ' zodra je je centen bewaart'}.</p>` : ''}` : `<div class="tk-mis">Deze ronde telde niet mee. Tik rustig en let op de checks.</div>`;
    if (s.wil && s.lijst) h += `<p>Er ${s.wil === 1 ? 'staat 1 cadeau' : 'staan ' + s.wil + ' cadeaus'} op je verlanglijstje.</p><p><a class="btn deel" href="${esc(lijstUrl(s))}#k=${esc(s.lk)}">Bekijk je lijstje</a> <a class="btn deel" href="${esc(self('&w=lijst'))}">Stuur je lijstje via WhatsApp</a></p>`;
    if (!lid) {
      if (q.get('mail') === '1') h += `<div class="dk-k"><h2>Kijk in je mail</h2><p>Bevestig je e-mailadres, dan staan je centen in je pot en krijg je morgen 10 nieuwe cadeaus in je mail.</p></div>`;
      else h += `<div class="dk-k"><h2>Bewaar je ${N(s.ok) ? N(s.ok) + ' cent' : 'centen'} en je lijstje</h2>${q.get('mail') === '0' && s.mailFout ? `<p class="tk-mis">${esc(s.mailFout)}</p>` : ''}<form class="dk-f" method="post" action="${esc(self())}"><input type="hidden" name="a" value="mail"><input type="email" name="email" required autocomplete="email" placeholder="jouw@e-mailadres.nl" aria-label="E-mailadres"><label class="vk"><input type="checkbox" name="oud" value="1" required> Ik ben 18 jaar of ouder en woon in Nederland</label><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="btn knop" type="submit">Bewaar mijn centen</button></form><p class="meta">Morgen krijg je 10 nieuwe cadeaus in je mail. We gebruiken je antwoorden om cadeaus voor je te kiezen. Wie je bent, verkopen we nooit. <a href="${esc(H.u(c, 'dkregels'))}">Voorwaarden</a></p></div>`;
    } else h += `<div class="dk-k"><h2>Laat een vriend ook verdienen</h2><p>Elke tik van je vriend is ook 1 cent voor jou.</p><p><a class="btn knop" href="${esc(self('&w=wa'))}">Stuur je link via WhatsApp</a></p><p><a href="${esc(H.u(c, 'dkt', '&k=' + lid.link))}">Naar mijn pot</a></p></div>`;
    h += `<p><a href="${esc(H.u(c, 'dkkal'))}">Maak een verjaardagskalender voor je familie</a> · <a href="https://gids.kadoly.com/w/lootjes">Lootjes trekken</a></p>`;
    return P(s.n >= TOTAAL ? 'Alles gedaan' : 'Klaar voor vandaag', h); }

  // de kaart van nu
  const k = kaart(s.n); s.t0 = Date.now(); await bewaarT(c, s);
  let h = q.get('g') === '1' ? `<div class="tk-toast">+1 cent voor jou${s.van ? ' · +1 cent voor wie je uitnodigde' : ''}</div>` : '';
  h += `<p><b>Dag ${k.dag + 1}</b> · kaart ${s.dN + 1} van ${DAG}${N(s.dC) ? ` · vandaag ${s.dC} cent` : ''}</p><div class="tk-b"><i style="width:${s.dN * 10}%"></i></div>`;
  if (s.n === 0) h += `<p>Elke tik is 1 cent voor jou${vriendRegel}. Elke "Wil ik" komt op je verlanglijstje.</p>`;
  const form = (inhoud, a, extra = '') => `<form method="post" action="${esc(self())}"><input type="hidden" name="a" value="${a}">${extra}${inhoud}</form>`;
  if (k.s === 'p') { const pr = await productVoor(H, s.sid, k.pi); if (!pr) return P('Even geduld', '<h1>Even geduld</h1><p>De cadeaus worden net bijgewerkt. Probeer het zo nog eens.</p>');
    h += `<h1>Wil je dit krijgen?</h1><div class="tk-k">${pr.img ? `<img src="${esc(pr.img)}" alt="">` : ''}<p class="tk-n">${esc(pr.naam)}</p><form class="tk-2" method="post" action="${esc(self())}"><input type="hidden" name="p" value="${esc(pr.pid)}"><button class="btn knop" name="a" value="wil" type="submit">Wil ik</button><button class="btn deel" name="a" value="niet" type="submit">Niet voor mij</button></form></div>`;
    return P('Wil je dit krijgen?', h); }
  if (k.s === 'c') { const ch = CHECKS[k.ci % CHECKS.length];
    h += `<h1>Even checken: tik op ${esc(ch[0])}.</h1>${form(`<div class="tk-c">${ch[1].map((e, i) => `<button name="v" value="${i}" type="submit" aria-label="keuze ${i + 1}">${e}</button>`).join('')}</div>`, 'c')}<p>Zo weten we dat er een mens tikt.</p>`;
    return P('Even checken', h); }
  const vr = VRAGEN[k.qi % VRAGEN.length], qv = `<input type="hidden" name="q" value="${vr.id}">`, sla = form(`<button class="tk-sla" type="submit">Sla over</button>`, 'sla', qv);
  if (vr.jarig) { const r = q.get('r'), m = N(q.get('m')), rok = r !== null && N(r) >= 0 && N(r) < REL.length;
    if (!rok) h += `<h1>${esc(vr.t)}</h1><p>1 cent. Twee weken ervoor krijg je drie cadeaus die passen.</p><div class="tk-o">${REL.map((x, i) => `<a href="${esc(self('&r=' + i))}">${esc(x)}</a>`).join('')}</div>${sla}`;
    else if (!(m >= 1 && m <= 12)) h += `<h1>In welke maand is ${esc(REL[N(r)].replace(/^Mijn |^Een /, '').toLowerCase())} jarig?</h1><div class="tk-g">${MAAND.map((x, i) => `<a href="${esc(self('&r=' + N(r) + '&m=' + (i + 1)))}">${x.slice(0, 3)}</a>`).join('')}</div>${sla}`;
    else h += `<h1>Welke dag in ${MAAND[m - 1]}?</h1>${form(`<div class="tk-g d7">${Array.from({ length: dagenIn(m) }, (_, i) => `<button name="d" value="${i + 1}" type="submit">${i + 1}</button>`).join('')}</div>`, 'jarig', qv + `<input type="hidden" name="r" value="${N(r)}"><input type="hidden" name="m" value="${m}">`)}<p class="meta">We bewaren alleen wie het is en de datum, geen naam.</p>${sla}`;
    return P(vr.t, h); }
  h += `<p class="meta">Vraag over jou · 1 cent</p><h1>${esc(vr.t)}</h1>${form(`<div class="tk-o">${vr.o.map((o, i) => `<button name="v" value="${i}" type="submit">${esc(o)}</button>`).join('')}</div>`, 'o', qv)}${vr.waarom ? `<p class="meta">${esc(vr.waarom)}</p>` : ''}${sla}`;
  return P(vr.t, h);
}

// ---------- verjaardagskalender: op=dkkal ----------
const KAL = (c, g) => c.ns + 'kal:' + g;
const leesKal = (c, g) => WL.geldigId(g) ? kv.get(KAL(c, g)).catch(() => null) : null;
const bewaarKal = (c, k) => kv.set(KAL(c, k.gid), k, { ex: 800 * 86400 });
const kalTekst = (c, H, k) => `Ik maak een verjaardagskalender voor ${k.naam}, zodat niemand meer iets vergeet. Wanneer ben jij jarig? Tik je dag aan, dat kost 5 seconden: ${H.u(c, 'dkkal', '&g=' + k.gid)}`;
const volgorde = (D, l) => { const v = N(D.slice(5, 7)) * 100 + N(D.slice(8, 10)), x = l.m * 100 + l.d; return x >= v ? x : x + 1300; };

export async function kalOp(x, H) {
  const { c, D, req, res, q, pagina, naar, vanHier, leesBody, ip } = x, esc = H.esc, g = String(q.get('g') || '');
  const self = (gid, extra = '') => H.u(c, 'dkkal', (gid ? '&g=' + gid : '') + extra), kop = `<p class="kicker">Kadoly · verjaardagskalender</p>`, P = (t, h) => pagina(200, t, CSS_TK + kop + h);
  if (req.method === 'POST') { if (!vanHier()) return res.status(403).send('Niet toegestaan'); const b = await leesBody(req), a = String(b.a || '');
    if (a === 'maak') { const naam = schoon(b.naam, 40); if (!naam || b.website || !(await magIp(c, H, ip, 'kalmaak', 10))) return naar(self());
      const gid = WL.rid(8); await bewaarKal(c, { gid, naam, leden: [], mails: [], at: Date.now() }); await kv.raw(['SADD', c.ns + 'kals', gid]); await H.tel(c, 'kal-maak'); return naar(self(gid, '&nieuw=1')); }
    const k = await leesKal(c, g); if (!k) return naar(self());
    if (a === 'lid') { const naam = schoon(b.naam, 30), m = N(b.m), d = N(b.d); if (!naam || b.website || !(m >= 1 && m <= 12 && d >= 1 && d <= dagenIn(m)) || k.leden.length >= 80 || !(await magIp(c, H, ip, 'kallid', 40))) return naar(self(g));
      k.leden.push({ n: naam, m, d, at: Date.now() }); await bewaarKal(c, k); await H.tel(c, 'kal-lid'); return naar(self(g, '&ok=' + (k.leden.length - 1))); }
    if (a === 'mail') { const e = String(b.email || '').trim().toLowerCase(); if (!H.okMail(e) || b.website || !(await magIp(c, H, ip, 'kalmail', 10))) return naar(self(g));
      const l = b.l !== undefined && b.l !== '' ? N(b.l) : -1; k.mails = k.mails || [];
      if (!k.mails.some(m => m.e === e) && k.mails.length < 80) { k.mails.push({ e, l: l >= 0 && l < k.leden.length ? l : -1, af: randomBytes(12).toString('hex'), at: Date.now() }); await bewaarKal(c, k); await H.tel(c, 'kal-mail'); }
      return naar(self(g, '&mail=1')); }
    return naar(self(g)); }

  if (!g) return P('Verjaardagskalender maken', `<h1>Verjaardagskalender voor je familie</h1><p>Maak de kalender, zet de link in de familiegroep, en iedereen tikt zijn eigen dag aan. Daarna krijgt iedereen die wil een seintje voor elke verjaardag.</p><form class="dk-f" method="post" action="${esc(self())}"><input type="hidden" name="a" value="maak"><input type="text" name="naam" required maxlength="40" placeholder="Bijvoorbeeld: Familie De Vries" aria-label="Naam van de kalender"><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="btn knop" type="submit">Maak de kalender</button></form>`);
  const k = await leesKal(c, g); if (!k) return P('Kalender niet gevonden', `<h1>Deze kalender bestaat niet (meer)</h1><p><a class="btn knop" href="${esc(self())}">Maak een nieuwe kalender</a></p>`);
  const af = String(q.get('af') || ''); if (/^[a-f0-9]{24}$/.test(af)) { const voor = (k.mails || []).length; k.mails = (k.mails || []).filter(m => m.af !== af); if (k.mails.length !== voor) { await bewaarKal(c, k); await H.tel(c, 'kal-af'); } return P('Afgemeld', `<h1>Je krijgt geen seintjes meer</h1><p>Van de kalender ${esc(k.naam)} krijg je geen mail meer.</p>`); }
  if (q.get('w') === 'wa') { await H.tel(c, 'kal-deel'); return naar('https://wa.me/?text=' + encodeURIComponent(kalTekst(c, H, k))); }
  const m = N(q.get('m')), d = N(q.get('d')), ok = q.get('ok'), okN = ok !== null && N(ok) >= 0 && N(ok) < k.leden.length ? N(ok) : -1;
  let h = `<h1>Verjaardagskalender ${esc(k.naam)}</h1>`;
  if (q.get('nieuw') === '1') h += `<div class="dk-k"><h2>Je kalender staat klaar</h2><p>Zet jezelf er eerst in, en stuur de link dan naar de familiegroep.</p><p><a class="btn knop" href="${esc(self(g, '&w=wa'))}">Stuur naar de familiegroep</a></p></div>`;
  if (okN >= 0) h += `<div class="dk-k"><h2>${esc(k.leden[okN].n)} staat erin</h2><p>Zet je gezin er meteen bij: partner, kinderen. Een ouder vult de kinderen in.</p><p><a class="btn deel" href="${esc(self(g, '&m=0'))}">Zet nog iemand erin</a></p>${q.get('mail') === '1' ? '<p><b>Je krijgt een seintje voor elke verjaardag.</b></p>' : `<p><b>Wil je een seintje als iemand jarig is?</b> Twee weken en drie dagen ervoor.</p><form class="dk-f" method="post" action="${esc(self(g))}"><input type="hidden" name="a" value="mail"><input type="hidden" name="l" value="${okN}"><input type="email" name="email" required autocomplete="email" placeholder="jouw@e-mailadres.nl" aria-label="E-mailadres"><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="btn knop" type="submit">Stuur me een seintje</button></form>`}<p><a class="btn knop" href="${esc(self(g, '&w=wa'))}">Stuur de kalender naar de familiegroep</a></p></div>`;
  else if (q.get('mail') === '1') h += `<div class="dk-k"><p><b>Je krijgt een seintje voor elke verjaardag.</b></p></div>`;
  if (m >= 1 && m <= 12 && d >= 1 && d <= dagenIn(m)) h += `<div class="dk-k"><h2>${d} ${MAAND[m - 1]}. Wie is er dan jarig?</h2><form class="dk-f" method="post" action="${esc(self(g))}"><input type="hidden" name="a" value="lid"><input type="hidden" name="m" value="${m}"><input type="hidden" name="d" value="${d}"><input type="text" name="naam" required maxlength="30" autocomplete="given-name" placeholder="Voornaam" aria-label="Voornaam"><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="btn knop" type="submit">Zet in de kalender</button></form><p class="meta">We bewaren alleen de voornaam, dag en maand. Alleen wie de link heeft, ziet de kalender.</p></div>`;
  else if (m >= 1 && m <= 12) h += `<div class="dk-k"><h2>Welke dag in ${MAAND[m - 1]}?</h2><div class="tk-g d7">${Array.from({ length: dagenIn(m) }, (_, i) => `<a href="${esc(self(g, '&m=' + m + '&d=' + (i + 1)))}">${i + 1}</a>`).join('')}</div></div>`;
  else if (okN < 0 || q.get('m') === '0') h += `<div class="dk-k"><h2>${okN >= 0 || q.get('m') === '0' ? 'Wie zet je er nog bij? Kies de maand' : 'Wanneer ben jij jarig?'}</h2><div class="tk-g">${MAAND.map((x, i) => `<a href="${esc(self(g, '&m=' + (i + 1)))}">${x.slice(0, 3)}</a>`).join('')}</div></div>`;
  if (k.leden.length) h += `<h2>Wie er in staat</h2><ul class="tk-l">${k.leden.map((l, i) => ({ l, i })).sort((a, b) => volgorde(D, a.l) - volgorde(D, b.l)).map(({ l }) => `<li><b>${l.d} ${MAAND[l.m - 1]}</b> · ${esc(l.n)}</li>`).join('')}</ul>`;
  if (okN < 0 && !q.get('nieuw')) h += `<p><a class="btn deel" href="${esc(self(g, '&w=wa'))}">Stuur de kalender naar de familiegroep</a></p>`;
  h += `<p><a href="https://gids.kadoly.com/w/lootjes">Lootjes trekken met de familie</a> · <a href="https://gids.kadoly.com/w">Verlanglijstje maken</a></p>`;
  await H.tel(c, 'kal-bezoek'); return P('Verjaardagskalender ' + k.naam, h);
}

// ---------- seintjes in de ochtendronde ----------
function kalMail(c, H, k, lid, nDag, zelf, sub) {
  const url = H.u(c, 'dkkal', '&g=' + k.gid), af = H.u(c, 'dkkal', '&g=' + k.gid + '&af=' + sub.af);
  const inhoud = zelf ? `<h1 style="font-size:24px;margin:0 0 12px">Over ${nDag} dagen ben je jarig</h1><p style="margin:0 0 14px">Stuur je verlanglijstje naar de familie, dan weten ze wat je leuk vindt.</p><p style="margin:0 0 14px">${H.knop('https://gids.kadoly.com/w', 'Maak of bekijk je verlanglijstje')}</p>`
    : `<h1 style="font-size:24px;margin:0 0 12px">Over ${nDag} dagen is ${H.esc(lid.n)} jarig</h1><p style="margin:0 0 14px">${H.esc(lid.d + ' ' + MAAND[lid.m - 1])}, uit de verjaardagskalender ${H.esc(k.naam)}.</p><p style="margin:0 0 14px">${H.knop(url, 'Bekijk de kalender')}</p><p style="margin:0 0 14px">Nog een cadeau nodig? <a href="https://kadoly.com/?utm_source=kalender" style="color:#0B0D12">Kijk bij Kadoly</a>.</p>`;
  return H.mailSchil({ titel: 'Verjaardagskalender', voorkop: zelf ? 'Je verjaardag komt eraan' : lid.n + ' is bijna jarig', inhoud: inhoud + `<p style="margin:0">Vragen? Antwoord op deze mail, of app of bel +31 6 55395630.</p>`, voet: `${H.esc(H.KADOLY_BEDRIJF)}<br><a href="${af}" style="color:#0B0D12">Geen seintjes meer van deze kalender</a>` });
}
export async function samenRonde(c, D, H) {
  const uit = { kal: 0, tik: 0 }, batch = [], md = n => { const x = H.plusDag(D, n); return [N(x.slice(5, 7)), N(x.slice(8, 10))]; };
  for (const gid of await smem(c.ns + 'kals')) { const k = await leesKal(c, gid); if (!k || !(k.leden || []).length || !(k.mails || []).length) continue;
    for (const nDag of [14, 3]) { const [m, d] = md(nDag); k.leden.forEach((lid, i) => { if (lid.m !== m || lid.d !== d) return;
      for (const sub of k.mails) { if (H.nep(sub.e)) continue; const zelf = sub.l === i; batch.push({ to: [sub.e], subject: (c.test ? '[TEST] ' : '') + (zelf ? `Over ${nDag} dagen ben je jarig` : `Over ${nDag} dagen is ${lid.n} jarig`), html: kalMail(c, H, k, lid, nDag, zelf, sub) }); uit.kal++; } }); } }
  // verjaardagen uit het trainen: leden krijgen twee weken ervoor drie cadeaus (via Clickmind, dkgo)
  const [m14, d14] = md(14); let L = null;
  for (const id of await smem(c.ns + 'emails')) { const p = await H.lees(c, id); if (!p || !p.actief || !p.tik || H.nep(p.email)) continue; const s = await leesT(c, p.tik); if (!s || !s.ant) continue;
    for (const vid of ['jarig1', 'jarig2']) { const a = s.ant[vid]; if (!a || a.m !== m14 || a.d !== d14) continue; if (!L) L = (await H.cadeaus(60, 60)).slice(0, 3); if (!L.length) break;
      const wie = String(a.r || '').replace(/^Mijn /, 'je ').replace(/^Een /, 'een ').toLowerCase();
      const lijst = L.map(o => `<p style="margin:0 0 10px"><a href="${H.u(c, 'dkgo', '&w=p&m=1&p=' + encodeURIComponent(o.pid) + '&k=' + p.link)}" style="color:#0B0D12;font-weight:700">${H.esc(o.naam)}</a></p>`).join('');
      batch.push({ to: [p.email], subject: (c.test ? '[TEST] ' : '') + `Over twee weken is ${wie} jarig`, html: H.mailSchil({ titel: 'Bijna jarig', voorkop: 'Drie cadeaus die passen', inhoud: `<h1 style="font-size:24px;margin:0 0 12px">Over twee weken is ${H.esc(wie)} jarig</h1><p style="margin:0 0 14px">Drie cadeaus die passen:</p>${lijst}<p style="margin:14px 0 0">Vragen? Antwoord op deze mail, of app of bel +31 6 55395630.</p>`, voet: H.esc(H.KADOLY_BEDRIJF) }) }); uit.tik++; } }
  for (let i = 0; i < batch.length; i += 90) await H.stuurMails(batch.slice(i, i + 90), 'dk-samen-' + c.ns + D + '-' + i);
  if (uit.kal) await H.tel(c, 'kal-herinner', uit.kal); if (uit.tik) await H.tel(c, 'tik-herinner', uit.tik);
  return uit;
}
