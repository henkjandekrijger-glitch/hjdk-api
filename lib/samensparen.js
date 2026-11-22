// Samen sparen bij Kadoly (Henkjan 22 nov 2026): "Samen sparen moet het heten", "geen voorwaarden als je maar deelt", "ook verenigingen",
// "Mag geen lek in zitten" en de vorm: "Of helemaal geen bedrag aan hangen en de spaarzegels die nodig zijn ergens neer zetten En spaarzegels
// die je krijgt bij aan koop in je winkelmandje tonen".
//
// Spelregels (zo staan ze ook op de pagina's, SPELREGELS hieronder):
// 1. Bij elk product staat hoeveel spaarzegels het geeft; in je winkelmandje zie je hoeveel je krijgt. Wie jou uitnodigde krijgt er evenveel.
// 2. Elk spaarcadeau heeft een eigen aantal zegels. Kaart vol: het cadeau is gratis, ook de verzending.
// 3. Kwam je via een site of vereniging, dan krijgt die €1 voor elke spaarzegel die jij krijgt.
// 4. Zegels tellen 30 dagen na je bestelling mee (levering plus retourtermijn). Stuur je iets terug, dan vervallen ze.
// 5. Zegels blijven 6 maanden geldig na je laatste zegel; daarna heb je 3 weken om een cadeau te kiezen of iets te bestellen.
// 6. Wie jij uitnodigt, begint met een kaart met 2 zegels.
//
// Waarom dit niet kan lekken (doorgerekend 22 nov op de echte marges, op=ss&marges=1: mediaan 5,4% van de prijs, 75% onder 10%):
// - Zegels per product = marge (euro, zonder btw) / 4, naar beneden afgerond, hooguit 10 per stuk. De koper krijgt dat aantal, en precies één
//   uitnodiger krijgt evenveel: een lid (zegels), of een site of vereniging (€1 per zegel), of de partner van de klik (7 dagen). Nooit twee.
// - Een spaarcadeau kost zoveel zegels als het ons kost (inkoop met btw plus verzending, naar boven afgerond in euro). Elke zegel staat dus voor
//   hooguit €1 kosten, en achter elke zegel zit minstens €4 marge, waarvan twee zegels (koper en uitnodiger) samen hooguit de helft opmaken.
// - Startzegels tellen alleen voor een volle kaart; ook dan zitten er genoeg echte zegels achter (zie de test). Producten met minder dan €4 marge
//   geven geen zegels.
// - Alles gebeurt in de controle van de datapagina van de shop (fn/shop.js haalFeed, elk uur), waar de regels van de bestelling bekend zijn;
//   één keer per bestelling (ss:ord). Retour of terugbetaald: zegels en partnergeld van die bestelling gaan eraf (ssRetour).
// - Wie nog niet spaart, ziet de zegels in het mandje; meldt hij zich binnen 60 dagen aan met hetzelfde e-mailadres, dan staan ze erop (ss:los).
//
// Groepskaart (Henkjan 22 nov: "En een echt gezamenlijke kaart ?" en "kan dan 1 zegel zijn"): een gezin, vriendengroep, collega's of club spaart
// op één kaart (ss:g:<id>, hooguit 50 leden). Elke aankoop van een lid zet de zegels van het product één keer op de groepskaart; er is dan geen
// aparte uitnodiger (alleen de site of vereniging waar de groep begon krijgt €1 per zegel). Elk lid brengt één welkomstzegel mee.
// Gratis zegels (start, welkom) vullen hooguit twee derde van een kaart (maxGratis), op elke kaart, ook de eigen.
// Deeldrempel, acties, geldigheid, berichten en controle: zie de blokken hieronder. Concept tot LIVE = true: pagina's alleen op de beschermde host;
// de zegels per product en per mandje (op=ss&product=, op=ss&mand=) zijn openbaar voor de shop en geven alleen aantallen.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';

export const LIVE = false;
const VRIJ_DAGEN = 30, UITNODIG_DOEL = 3, CADEAU_MAX = 5, GELDIG_DAGEN = 182, AFLOOP_DAGEN = 21, MARGE_PER_ZEGEL = 4, MAX_PER_STUK = 10, LOS_DAGEN = 60;
const REGELS0 = { zelf: 1, eersteMee: 1, armen: [2] };
export const SPELREGELS = [
  'Bij elk product staat hoeveel spaarzegels het geeft. In je winkelmandje zie je hoeveel je krijgt. Wie jou uitnodigde, krijgt er evenveel.',
  'Elk spaarcadeau heeft een eigen aantal zegels. Kaart vol: het cadeau is gratis, ook de verzending.',
  'Kwam je via een site of vereniging, dan krijgt die €1 voor elke spaarzegel die jij krijgt.',
  'Zegels tellen 30 dagen na je bestelling mee. Stuur je iets terug, dan vervallen de zegels van die bestelling.',
  'Zegels blijven 6 maanden geldig na je laatste zegel. Daarna heb je 3 weken om een cadeau te kiezen of iets te bestellen.',
  'Wie jij uitnodigt, begint met een kaart met 2 zegels.',
  'Spaar je met een groep, dan komen de zegels van ieders aankopen op één groepskaart, voor één cadeau.',
  'Gratis zegels vullen hooguit twee derde van een kaart. Het laatste stuk spaar je met aankopen.'];
const BASE = () => (LIVE ? 'https://gids.kadoly.com' : 'https://hjdk-api-henq.vercel.app') + '/api/gids?op=ss';
const DOELEN = ['oc_4173959362543617', 'oc_4174005866250241', 'oc_4174004744241153', 'oc_4173958884671489']; // scheerkwast, kaarsenset, geurkaars, plantenset
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const h = s => createHash('sha256').update(String(s)).digest('hex');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = x => '€' + (Math.round(N(x) * 100) / 100).toFixed(2).replace('.', ',').replace(',00', '');
const schoon = (v, n) => String(v || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const dagNL = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
const datum = t => new Date(t).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' });
const zt = n => n === 1 ? '1 zegel' : n + ' zegels';
const szt = n => n === 1 ? '1 spaarzegel' : n + ' spaarzegels';
async function tel(wat, n = 1) { try { const k = 'ss:tel:' + dagNL(); await kv.raw(['HINCRBY', k, wat, String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); } catch (e) {} }
async function telNiv(L, wat, n = 1) { if (!L) return; try { await kv.raw(['HINCRBY', 'ss:niv', L + '|' + wat, String(n)]); } catch (e) {} }
async function cat() { let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {} const m = {}; for (const i of (c && c.items) || []) if (i && i.id) m[i.id] = i; return m; }
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
const item = (C, pid) => C[pid] || C[String(pid || '').split('-').slice(0, 2).join('-')] || C[String(pid || '').split('-')[0]] || null;
// zegels per stuk: een kwart van de marge, in hele zegels van €4 marge; onbekende marge of minder dan €4: geen zegels
export const zegelsPerStuk = i => i && i.mg != null && N(i.mg) > 0 ? Math.min(MAX_PER_STUK, Math.floor(N(i.mg) / MARGE_PER_ZEGEL)) : 0;
// wat een spaarcadeau ons kost: inkoop met btw plus verzending (prijs en verzending van de klant min de marge met btw); onbekende marge: de prijs
export const zegelsNodig = i => Math.max(1, Math.ceil(i && i.mg != null ? thuis(i) - N(i.mg) * 1.21 : thuis(i || {})));
const lees = async k => { try { return await kv.get(k); } catch (e) { return null; } };
const zet = (k, v) => kv.set(k, v, { ex: 400 * 86400 }).catch(() => {});
const nodigVan = (m, C) => N(m.nodig) || (C[m.doel] ? zegelsNodig(C[m.doel]) : 40);
// Gratis zegels (start, welkom, later dagzegels) vullen hooguit twee derde van een kaart; het laatste derde komt van aankopen. Zo zit er achter
// elke volle kaart minstens een derde aankoopzegels, en die dekken het cadeau (zie de toelichting bovenaan).
const maxGratis = nodig => nodig - Math.ceil(nodig / 3);
function stand(m, C, nu = Date.now()) { const i = C[m.doel] || null, nodig = nodigVan(m, C), z = m.zegels || []; const vz = z.filter(x => x.vrij <= nu), gratis = vz.filter(x => x.start).length, echt = vz.length - gratis, gTelt = Math.min(gratis, maxGratis(nodig)); const vrij = Math.min(nodig, echt + gTelt); return { i, nodig, vrij, wacht: z.length - vz.length, vol: vrij >= nodig, gratisVol: gratis >= maxGratis(nodig) && echt + gTelt < nodig }; }
const laatst = m => Math.max(N(m.at), ...(m.zegels || []).map(z => N(z.t)));
const geldigTot = m => laatst(m) + GELDIG_DAGEN * 864e5;
const aankoopZegels = (m, nu = Date.now()) => (m.zegels || []).filter(z => !z.start && z.vrij <= nu).length; // startzegels tellen alleen voor een volle kaart
const startZegels = (n, van, soort, nu) => Array.from({ length: n }, () => ({ t: nu, vrij: nu, van, start: soort }));
const aankoop = (n, van, nu, o) => Array.from({ length: n }, () => ({ t: nu, vrij: nu + VRIJ_DAGEN * 864e5, van, o }));
// het spaarlijstje: de doelen met wat ze kosten in zegels, dichtstbijzijnde eerst
// Kleinste kaart 9 zegels: met hooguit 6 startzegels (5 cadeau plus 1 voor je eerste meespaarder) zitten er dan altijd minstens 3 echte zegels
// achter, en per echte zegel houden we na de zegel van de andere kant minstens €3 marge over: 3 x €3 = €9, genoeg voor een kaart van 9 (en
// groter gaat vanzelf goed, want dan groeit het aantal echte zegels mee).
const MIN_KAART = 9;
const spaarlijst = C => DOELEN.map(p => C[p]).filter(i => i && i.vr !== false).map(i => ({ i, nodig: zegelsNodig(i) })).filter(d => d.nodig >= MIN_KAART).sort((a, b) => a.nodig - b.nodig);

// ---------- regels en acties: welk cadeau geeft een uitnodiger ----------
export async function regels() { const r = await lees('ss:regels'); const R = { ...REGELS0, ...(r || {}) }; R.armen = (Array.isArray(R.armen) && R.armen.length ? R.armen : REGELS0.armen).map(x => Math.min(CADEAU_MAX, Math.max(1, Math.round(N(x))))); return R; }
async function actieNu() { const a = await lees('ss:actie'); return a && a.naam && Date.now() < N(a.tot) ? a : null; }
async function aanbod(m, aNaam) { // { niv: aantal zegels op de kaart van wie je uitnodigt, L: label voor de meting, actie }
  const A = await actieNu(); let niv = Math.min(CADEAU_MAX, Math.max(1, N(m && m.niv) || REGELS0.armen[0])), L = 'cadeau ' + niv, act = null;
  if (A) { niv = A.cadeau; L = 'actie ' + A.naam + ' (' + A.cadeau + ')'; act = A; }
  const an = String(aNaam || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
  if (an && (!A || A.naam !== an)) { try { const o = JSON.parse(await kv.raw(['HGET', 'ss:acties', an]) || 'null'); if (o && Date.now() < N(o.tot) + 30 * 864e5 && N(o.cadeau) > niv) { niv = N(o.cadeau); L = 'actie ' + an + ' (' + niv + ')'; act = o; } } catch (e) {} } // een belofte uit een actie blijft gelden
  return { niv, L, actie: act };
}
const uitnodigLink = (base, m, AB) => base + '&u=' + m.id + (AB.actie && AB.actie.naam ? '&a=' + AB.actie.naam : '');
const waTekst = (base, m, AB) => `Spaar je mee bij Kadoly? Ik geef je een spaarkaart met al ${zt(AB.niv)} erop. Bij elke aankoop krijg je spaarzegels, en ik krijg er evenveel. Kaart vol, dan is je cadeau gratis. ${uitnodigLink(base, m, AB)}`;

// ---------- mail (via de Kadoly-afzender van lib/kadoly-nieuws.js) ----------
const goUrl = (m, w) => BASE() + '&go=' + w + '&m=' + m.id + '&k=' + m.k;
function balk(n, van) { const p = Math.max(2, Math.min(100, Math.round(n / Math.max(1, van) * 100))); return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1.5px solid #111113;border-radius:999px;border-collapse:separate"><tr><td width="${p}%" style="background:#111113;height:12px;border-radius:999px;font-size:0;line-height:0">&nbsp;</td><td style="font-size:0;line-height:0">&nbsp;</td></tr></table>`; }
export function mailInhoud(KN, m, soort, x = {}) {
  const C = x.C || {}, G = x.kaart || null, s = stand(G || m, C), wat = s.i ? s.i.t : 'je cadeau', rest = Math.max(0, s.nodig - s.vrij), n = N(x.n) || 1;
  const voet = (af) => `Je krijgt deze mail omdat je bij Kadoly begon met samen sparen.${af ? ` <a href="${BASE()}&af=${m.id}&t=${m.af}" style="color:#0B0D12;font-weight:700">Geen bericht meer bij een zegel</a>` : ''}<br><br>Vragen? Antwoord op deze mail, of bel of app Henkjan van Kadoly: <a href="https://wa.me/31655395630" style="color:#0B0D12;font-weight:700">06 55395630</a>.<br><br>${esc(KN.KADOLY_BEDRIJF)}`;
  const kaart = `<p style="margin:0 0 6px;font-size:24px;font-weight:700">${s.vrij} van ${s.nodig} zegels</p><p style="margin:0 0 10px">voor ${esc(wat)}${s.wacht ? `, en ${zt(s.wacht)} ${s.wacht === 1 ? 'telt' : 'tellen'} mee na 30 dagen` : ''}.</p>${balk(s.vrij, s.nodig)}`;
  if (soort === 'welkom' && G) return { onderwerp: `Je spaart mee op de groepskaart van ${G.naam}`, html: KN.mailSchil({ titel: 'Groepskaart ' + G.naam, voorkop: `Samen sparen voor ${wat}.`,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Welkom op de groepskaart van ${esc(G.naam)}, ${esc(m.naam)}</h1><p style="margin:0 0 16px">Koopt iemand in de groep iets bij Kadoly, dan komen de spaarzegels van dat product op jullie kaart. Kaart vol, dan is het cadeau gratis, ook de verzending.</p>${kaart}<p style="margin:0 0 18px">${KN.knop(goUrl(m, 'kaart'), 'Open de groepskaart')}</p><p style="margin:0;font-size:14px">Bewaar deze mail: met de knop kom je altijd terug op de kaart. Na één klik krijg je ook een bericht als er zegels bij komen.</p>`,
    voet: voet(false) }) };
  if (soort === 'groep') return { onderwerp: `${x.van || 'Iemand'} kocht iets: ${szt(n)} op de groepskaart`, html: KN.mailSchil({ titel: s.vol ? 'De groepskaart is vol' : 'Zegels op de groepskaart', voorkop: s.vol ? `Het cadeau is gratis.` : `Nog ${zt(rest)} voor ${wat}.`,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">${s.vol ? 'De groepskaart is vol' : `Er ${n === 1 ? 'komt 1 spaarzegel' : 'komen ' + n + ' spaarzegels'} op jullie kaart`}</h1><p style="margin:0 0 16px">${esc(x.van || 'Iemand')} uit ${esc(G ? G.naam : 'de groep')} kocht iets bij Kadoly. De zegels tellen mee na 30 dagen.</p>${kaart}<p style="margin:0 0 6px">${KN.knop(goUrl(m, 'kaart'), 'Bekijk de groepskaart')}</p>`,
    voet: voet(true) }) };
  if (soort === 'welkom') { const ns = (m.zegels || []).filter(z => z.start).length, nl = (m.zegels || []).filter(z => !z.start).length, van = x.cadeauVan ? esc(x.cadeauVan) : '';
    return { onderwerp: van ? `Je spaarkaart met ${zt(ns)} van ${x.cadeauVan}` : 'Je spaarkaart bij Kadoly', html: KN.mailSchil({ titel: 'Je spaarkaart bij Kadoly', voorkop: `Je spaart voor ${wat}. Er ${ns + nl === 1 ? 'staat al 1 zegel' : 'staan al ' + (ns + nl) + ' zegels'} op.`,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Je spaarkaart staat klaar, ${esc(m.naam)}</h1><p style="margin:0 0 16px">${van ? `${van} gaf je ${zt(ns)} cadeau. ` : 'Je eerste zegel is cadeau. '}${nl ? `Je bestelling van de afgelopen tijd gaf er ${nl} bij. ` : ''}Bij elke aankoop bij Kadoly krijg je spaarzegels, en wie jou uitnodigde krijgt er evenveel. Kaart vol, dan is je cadeau gratis, ook de verzending.</p>${kaart}<p style="margin:0 0 18px">${KN.knop(goUrl(m, 'kaart'), 'Open je spaarkaart')}</p><p style="margin:0;font-size:14px">Bewaar deze mail: met de knop kom je altijd terug op je kaart. Na één klik krijg je ook een bericht bij elke nieuwe zegel. Je zegels blijven 6 maanden geldig na je laatste zegel.</p>`,
    voet: voet(false) }) }; }
  if (soort === 'afloop') { const H = G || m, w = aankoopZegels(H), kan = spaarlijst(C).filter(d => d.nodig <= s.vrij);
    return { onderwerp: `Je ${zt(w)} vervallen over 3 weken`, html: KN.mailSchil({ titel: 'Je zegels vervallen over 3 weken', voorkop: kan.length ? `Je kunt er nu ${kan[0].i.t} mee krijgen.` : 'Eén bestelling houdt je kaart open.',
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Je zegels vervallen over 3 weken</h1><p style="margin:0 0 16px">Er kwam 6 maanden geen zegel bij op ${G ? 'de groepskaart' : 'je kaart'}. Bestel je voor ${datum(H.afloop)} iets bij Kadoly, of koopt iemand die jij uitnodigde iets, dan blijft je kaart gewoon staan.${kan.length ? ` Je kunt je zegels ook nu inwisselen voor ${esc(kan[0].i.t)}.` : ''}</p>${kaart}<p style="margin:0 0 6px">${KN.knop(goUrl(m, 'kaart'), kan.length ? 'Kies je cadeau' : 'Bekijk je spaarkaart')}</p>`,
    voet: voet(false) }) }; }
  const start = !!x.start, eigen = soort === 'eigen', van = esc(x.van || 'Iemand');
  const kop = s.vol ? 'Je kaart is vol' : `Er ${n === 1 ? 'komt 1 spaarzegel' : 'komen ' + n + ' spaarzegels'} op je kaart`;
  const zin = eigen ? `Je bestelling bij Kadoly gaf ${szt(n)}. Ze tellen mee na 30 dagen.` : start ? `${van} spaart nu via jou mee. Daarvoor krijg je een startzegel, meteen op je kaart. Koopt ${van} iets bij Kadoly, dan krijg jij er evenveel als ${van}.` : `${van} kocht iets bij Kadoly. Omdat jij ${van} uitnodigde, krijg jij evenveel spaarzegels als ${van}: ${n}. Ze tellen mee na 30 dagen.`;
  const onderwerp = eigen ? `Je bestelling gaf ${szt(n)}` : start ? `${x.van || 'Iemand'} spaart mee: een zegel voor jou` : `${x.van || 'Iemand'} kocht iets: ${szt(n)} voor jou`;
  return { onderwerp, html: KN.mailSchil({ titel: kop, voorkop: s.vol ? `Je ${wat} is gratis.` : `Nog ${zt(rest)} voor ${wat}.`,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">${kop}</h1><p style="margin:0 0 16px">${zin}</p>${kaart}<p style="margin:0 0 6px">${KN.knop(goUrl(m, 'kaart'), s.vol ? 'Bestel je cadeau gratis' : 'Bekijk je spaarkaart')}</p>`,
    voet: voet(true) }) };
}
async function mailNaar(m, soort, x = {}) {
  if (!m || !m.mail || !m.k || ((soort === 'zegel' || soort === 'eigen' || soort === 'groep') && (!m.ok || m.stil)) || (soort === 'afloop' && !m.ok)) return false; // afloop: één keer, ook als je zegelberichten uitzette
  try { const KN = await import('./kadoly-nieuws.js'); if (!(await KN.mailKlaar())) { await tel('mailNietKlaar'); return false; }
    const { onderwerp, html } = mailInhoud(KN, m, soort, { ...x, C: x.C || await cat() });
    const headers = soort === 'zegel' || soort === 'eigen' || soort === 'groep' ? { 'List-Unsubscribe': '<' + BASE() + '&af=' + m.id + '&t=' + m.af + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined;
    await KN.stuurMails([{ to: [m.mail], subject: onderwerp, html, ...(headers ? { headers } : {}) }], 'ss-' + soort + '-' + m.id + '-' + String(x.sleutel || dagNL()).slice(0, 60));
    await tel('mail-' + soort); return true;
  } catch (e) { await tel('mailFout'); return false; }
}

// ---------- zegels voor een mandje of een product (openbaar voor de shop: alleen aantallen) ----------
export async function zegelsMand(regels, C) { C = C || await cat(); let n = 0; const per = {}; for (const r of regels || []) { const z = zegelsPerStuk(item(C, r.p)) * Math.max(1, Math.min(50, Math.round(N(r.n) || 1))); per[r.p] = (per[r.p] || 0) + z; n += z; } return { zegels: n, per }; }

// ---------- de koppeling met de winkel: aangeroepen vanuit de controle van de datapagina (fn/shop.js haalFeed), één keer per bestelling ----------
// regels: [{ p: product-id, n: aantal }]; klikPartner: campagne p-<code> van de klik waarop besteld werd (7 dagen)
export async function ssBestelling({ em, order, t, regels: rg, klikPartner }) {
  order = String(order || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40); if (!order) return { ok: false };
  const nieuw = await kv.raw(['SET', 'ss:ord:' + order, '1', 'NX', 'EX', String(200 * 86400)]).catch(() => null); if (!nieuw) return { ok: true, dubbel: true };
  const C = await cat(), { zegels: Z } = await zegelsMand(rg, C), nu = t || Date.now();
  await tel('bestel'); if (!Z) { await tel('bestelZonderZegels'); return { ok: true, zegels: 0 }; }
  const geldig = /^[0-9a-f]{64}$/.test(String(em || '')); const mid = geldig ? await lees('ss:em:' + em) : null; const m = mid ? await lees('ss:m:' + mid) : null;
  const info = { Z, koper: m ? m.id : '', door: '', pt: '', groep: '' }; let naar = '';
  const g = m && m.g ? await lees('ss:g:' + m.g) : null;
  if (g) { // groepskaart (Henkjan 22 nov: "kan dan 1 zegel zijn"): de zegels van het product één keer op de kaart van de groep, geen aparte uitnodiger
    g.zegels = (g.zegels || []).concat(aankoop(Z, m.naam, nu, order)).slice(-1000); if (g.afloop) { g.afloop = 0; await tel('afloopGered'); } await zet('ss:g:' + g.id, g); info.groep = g.id; naar = 'groep'; await tel('zegelsGroep', Z); if (g.pt) info.pt = g.pt;
    for (const lid of (g.leden || []).slice(0, 25)) { const l = lid === m.id ? m : await lees('ss:m:' + lid); if (l) await mailNaar(l, 'groep', { van: m.naam, n: Z, sleutel: order, C, kaart: g }); } }
  else if (m) { m.zegels = (m.zegels || []).concat(aankoop(Z, m.naam, nu, order)).slice(-600); if (m.afloop) { m.afloop = 0; await tel('afloopGered'); } await zet('ss:m:' + m.id, m); await tel('zegelsKoper', Z); await mailNaar(m, 'eigen', { n: Z, sleutel: order, C });
    if (m.door) { const d = await lees('ss:m:' + m.door); if (d) { d.zegels = (d.zegels || []).concat(aankoop(Z, m.naam, nu, order)).slice(-600); if (d.afloop) { d.afloop = 0; await tel('afloopGered'); } await zet('ss:m:' + d.id, d); info.door = d.id; naar = 'lid'; await tel('zegelsUitnodiger', Z); await telNiv(m.via, 'koop'); await mailNaar(d, 'zegel', { van: m.naam, n: Z, sleutel: order, C }); } }
    else if (m.pt) { info.pt = m.pt; naar = 'partner'; }
  } else if (geldig) { try { await kv.raw(['RPUSH', 'ss:los:' + em, JSON.stringify({ o: order, Z, t: nu })]); await kv.raw(['EXPIRE', 'ss:los:' + em, String(LOS_DAGEN * 86400)]); } catch (e) {} await tel('zegelsLos', Z); } // nog geen spaarder: bewaard voor als hij zich aanmeldt
  if (!info.door && !info.pt && klikPartner && /^p-/.test(klikPartner)) { info.pt = String(klikPartner).slice(2); naar = 'klikpartner'; } // precies één uitnodiger per bestelling
  if (info.pt) { try { const { boekBestelling } = await import('./partner.js'); await boekBestelling('p-' + info.pt, { order, t: nu, cent: Z * 100 }); await tel('partnerEuro', Z); } catch (e) {} }
  try { await kv.set('ss:ordinfo:' + order, info, { ex: 200 * 86400 }); await kv.raw(['RPUSH', 'ss:log', JSON.stringify({ t: nu, o: order, Z, naar })]); await kv.raw(['LTRIM', 'ss:log', '-2000', '-1']); } catch (e) {}
  return { ok: true, zegels: Z, naar, lid: !!m };
}
// retour of terugbetaald: de zegels van die bestelling eraf bij koper en uitnodiger, en het partnergeld teruggeboekt
export async function ssRetour(order) {
  order = String(order || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40); if (!order) return { ok: false };
  const info = await lees('ss:ordinfo:' + order); if (!info || info.retour) return { ok: true, niets: true };
  for (const key of [info.koper && 'ss:m:' + info.koper, info.door && 'ss:m:' + info.door, info.groep && 'ss:g:' + info.groep].filter(Boolean)) { const m = await lees(key); if (m) { const voor = (m.zegels || []).length; m.zegels = (m.zegels || []).filter(z => z.o !== order); if (m.zegels.length !== voor) await zet(key, m); } }
  if (info.pt) { try { const { stornoBestelling } = await import('./partner.js'); await stornoBestelling(order); } catch (e) {} }
  info.retour = Date.now(); await kv.set('ss:ordinfo:' + order, info, { ex: 200 * 86400 }).catch(() => {}); await tel('retour'); return { ok: true };
}

// ---------- doorrekenen (Henkjan 22 nov: "reken alles weer goed door . Mag geen lek in zitten") ----------
// marge per product (mg = euro zonder btw, p = prijs met btw) tegen wat elk spaarmodel per product kost. Lek = meer dan de helft van de marge.
export async function ssMarges() {
  let c = null, f = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {} try { f = await kv.get('hjdk:shop:lusfeed'); } catch (e) {}
  const items = ((c && c.items) || []).filter(i => i && N(i.p) > 0), Z = 0.83;
  const MOD = { 'nu: spaarzegels per product (marge/4) voor jou en evenveel voor de uitnodiger, zegel kost hooguit €1': i => 2 * zegelsPerStuk(i) * 1, 'oud: 1 zegel per bestelling voor wie uitnodigde': () => Z, 'oud: per €10 1 voor jou en 1 voor wie uitnodigde': i => 2 * Math.floor(N(i.p) / 10) * Z };
  const EM = [['verlies', -1e9, 0], ['0-10%', 0, .1], ['10-20%', .1, .2], ['20-30%', .2, .3], ['30-40%', .3, .4], ['40% en meer', .4, 1e9]];
  const uit = { producten: items.length, metMarge: 0, spaarproducten: 0, zegelsPerStuk: {}, margeAlsDeelVanPrijs: {}, verkochtLaatste30: {}, mediaan: null, mediaanVerkocht: null, modellen: {} };
  const rs = [], rw = [];
  for (const i of items) { if (i.mg == null) continue; const p = N(i.p), mg = N(i.mg), r = mg / p, w = N(i.so30), z = zegelsPerStuk(i); uit.metMarge++; rs.push(r); for (let k = 0; k < w; k++) rw.push(r);
    if (z) { uit.spaarproducten++; uit.zegelsPerStuk[z] = N(uit.zegelsPerStuk[z]) + 1; }
    const e = EM.find(x => r >= x[1] && r < x[2])[0]; uit.margeAlsDeelVanPrijs[e] = N(uit.margeAlsDeelVanPrijs[e]) + 1; if (w) uit.verkochtLaatste30[e] = N(uit.verkochtLaatste30[e]) + w;
    for (const [naam, fn] of Object.entries(MOD)) { const k = fn(i), M = uit.modellen[naam] = uit.modellen[naam] || { producten: 0, bovenHelft: 0, bovenHeel: 0 }; M.producten++; if (k > 0 && k > mg / 2 + 1e-9) M.bovenHelft++; if (k > 0 && k > mg + 1e-9) M.bovenHeel++; } } // geen zegels is geen lek van het sparen
  const med = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return Math.round(s[Math.floor(s.length / 2)] * 1000) / 10 + '%'; };
  uit.mediaan = med(rs); uit.mediaanVerkocht = med(rw);
  for (const M of Object.values(uit.modellen)) M.lek = Math.round(M.bovenHelft / Math.max(1, M.producten) * 1000) / 10 + '% boven de helft van de marge, ' + Math.round(M.bovenHeel / Math.max(1, M.producten) * 1000) / 10 + '% boven de hele marge';
  const C = {}; for (const i of items) C[i.id] = i; const ord = {};
  for (const o of ((f && f.orders) || []).filter(o => /paid|betaald/i.test(String(o.s || '')))) { const k = o.id || Math.random(); const x = ord[k] = ord[k] || { v: 0, mg: 0, zegels: 0, onbekend: 0 }; x.v = Math.max(x.v, N(o.v)); const it = item(C, o.p); if (it && it.mg != null) { x.mg += N(it.mg) * Math.max(1, N(o.n)); x.zegels += zegelsPerStuk(it) * Math.max(1, N(o.n)); } else x.onbekend++; }
  uit.betaaldeBestellingen = Object.values(ord).map(x => ({ bedrag: x.v, marge: Math.round(x.mg * 100) / 100, zegelsKoper: x.zegels, kostenHooguit: 2 * x.zegels, onbekend: x.onbekend }));
  uit.spaarlijst = spaarlijst(C).map(d => ({ cadeau: d.i.t, winkelprijs: thuis(d.i), zegels: d.nodig }));
  return uit;
}

// ---------- dagelijkse ronde: geldigheid (vanuit de cron op=indexnow in fn/gids.js) ----------
export async function ssRonde(nu = Date.now()) {
  const uit = { leden: 0, afloopMail: 0, verlopen: 0 }; let ids = []; try { ids = await kv.raw(['SMEMBERS', 'ss:leden']) || []; } catch (e) {}
  const C = await cat();
  for (const id of ids.slice(0, 5000)) { const m = await lees('ss:m:' + id); if (!m) continue; uit.leden++;
    if (!(m.zegels || []).length) continue;
    if (m.afloop && nu > m.afloop) { const n = m.zegels.length; m.zegels = []; m.afloop = 0; m.verlopen = N(m.verlopen) + n; await zet('ss:m:' + id, m); await tel('verlopen', n); uit.verlopen += n; continue; }
    if (!m.afloop && nu > geldigTot(m)) {
      if (aankoopZegels(m, nu) > 0) { m.afloop = nu + AFLOOP_DAGEN * 864e5; await zet('ss:m:' + id, m); if (await mailNaar(m, 'afloop', { sleutel: 'afloop-' + laatst(m), C })) uit.afloopMail++; }
      else { const n = m.zegels.length; m.zegels = []; m.verlopen = N(m.verlopen) + n; await zet('ss:m:' + id, m); await tel('verlopen', n); uit.verlopen += n; } } // alleen startzegels: vervallen zonder mail
  }
  let gids = []; try { gids = await kv.raw(['SMEMBERS', 'ss:groepen']) || []; } catch (e) {} uit.groepen = 0; // groepskaarten: dezelfde regel, het bericht gaat naar wie de groep begon
  for (const id of gids.slice(0, 2000)) { const g = await lees('ss:g:' + id); if (!g || !(g.zegels || []).length) continue; uit.groepen++;
    if (g.afloop && nu > g.afloop) { const n = g.zegels.length; g.zegels = []; g.afloop = 0; await zet('ss:g:' + id, g); await tel('verlopen', n); uit.verlopen += n; continue; }
    if (!g.afloop && nu > geldigTot(g)) { if (aankoopZegels(g, nu) > 0) { g.afloop = nu + AFLOOP_DAGEN * 864e5; await zet('ss:g:' + id, g); const b = await lees('ss:m:' + g.beheerder); if (b && await mailNaar(b, 'afloop', { sleutel: 'afloop-g-' + laatst(g), C, kaart: g })) uit.afloopMail++; }
      else { const n = g.zegels.length; g.zegels = []; await zet('ss:g:' + id, g); await tel('verlopen', n); uit.verlopen += n; } } }
  return uit;
}

const CSS = `<style>.ss-k{border:1px solid #D7DCE8;border-radius:16px;padding:16px 18px;margin:0 0 14px}.ss-f{display:grid;gap:10px;max-width:520px}.ss-f input[type=text],.ss-f input[type=email]{min-height:48px;border:1.5px solid #111113;border-radius:12px;padding:10px 12px;font:inherit;background:#fff;color:#111113}.ss-d{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.ss-d label{border:1.5px solid #D7DCE8;border-radius:14px;padding:10px;cursor:pointer;display:grid;gap:2px}.ss-d label:has(input:checked){border-color:#111113;box-shadow:0 0 0 1.5px #111113}.ss-d input{position:absolute;opacity:0}.ss-kaart{border:2px solid #111113;border-radius:18px;padding:14px;margin:8px 0 12px}.ss-v{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:5px}.ss-v span{aspect-ratio:1;border:1.5px dashed #111113;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700}.ss-v span.vol{border-style:solid;background:#111113;color:#fff}.ss-v span.wacht{border-style:solid}.ss-tel{font-size:28px;font-weight:700;margin:8px 0 0}.ss-l{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.ss-l span{border:1.5px solid #111113;border-radius:999px;padding:2px 10px;font-weight:700;font-size:14px}.ss-wa{background:#1F8F4E!important;border-color:#1F8F4E!important;color:#fff!important}.ss-hp{position:absolute!important;left:-9999px!important}.ss-cadeau{border:2px solid #111113;border-radius:16px;padding:12px 14px;margin:0 0 14px;font-weight:700}.ss-r{margin:0;padding-left:20px}.ss-r li{margin:0 0 6px}</style>`;
const regelsHtml = () => `<details class="ss-k"><summary><b>Spelregels</b></summary><ol class="ss-r">${SPELREGELS.map(r => `<li>${esc(r)}</li>`).join('')}</ol></details>`;

export async function ssOp({ req, res, q, host, ua, kaal, leesBody, isBot }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const beschermd = /\.vercel\.app$/i.test(host);
  // ---------- openbaar voor de shop: zegels per product of per mandje (alleen aantallen) ----------
  if (q.get('product') || q.get('mand')) { res.setHeader('access-control-allow-origin', '*'); const C = await cat();
    const rg = q.get('product') ? [{ p: String(q.get('product')).slice(0, 60), n: 1 }] : String(q.get('mand')).split(',').slice(0, 40).map(x => { const [p, n] = x.split(':'); return { p: String(p || '').slice(0, 60), n: N(n) || 1 }; }).filter(r => r.p);
    const { zegels, per } = await zegelsMand(rg, C);
    return res.status(200).json({ ok: true, live: LIVE, zegels, per, tekst: zegels ? `Met ${q.get('product') ? 'dit product' : 'deze bestelling'} krijg je ${szt(zegels)}. Wie jou uitnodigde, krijgt er evenveel.` : '', link: zegels ? (LIVE ? 'https://gids.kadoly.com/samen-sparen' : null) : null }); }
  if (!beschermd && !LIVE) return res.status(404).send('Niet gevonden');
  const base = (beschermd ? 'https://' + host : 'https://gids.kadoly.com') + '/api/gids?op=ss';
  const naar = u => { res.setHeader('location', u); return res.status(303).end(); };
  const pagina = (titel, x) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(kaal(titel, CSS + (LIVE ? '' : '<div class="ss-k"><p><b>Concept.</b> Dit staat nog niet op gids.kadoly.com; alleen jij ziet het hier.</p></div>') + x, '<script src="https://go.kadoly.com/cm.js" data-site="samensparen" async></script>')); };
  const C = await cat(); const lijst = spaarlijst(C); const eerste = lijst[0] ? lijst[0].i.id : DOELEN[0];

  // ---------- instellen: armen en acties (alleen beschermde host) ----------
  if (q.get('zet') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden');
    const R = await regels();
    if (q.get('armen')) { const a = String(q.get('armen')).split(',').map(x => Math.round(N(x))).filter(x => x >= 1 && x <= CADEAU_MAX).slice(0, 4); if (a.length) { R.armen = a; await kv.set('ss:regels', R); } }
    const an = String(q.get('actie') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
    if (an === 'uit') await kv.set('ss:actie', null).catch(() => {});
    else if (an) { const c = Math.round(N(q.get('cadeau'))), d = Math.min(31, Math.max(1, Math.round(N(q.get('dagen')) || 7)));
      if (c < 1 || c > CADEAU_MAX) return res.status(400).json({ ok: false, fout: 'cadeau moet 1 tot ' + CADEAU_MAX + ' zegels zijn' });
      const A = { naam: an, cadeau: c, van: Date.now(), tot: Date.now() + d * 864e5 }; await kv.set('ss:actie', A); await kv.raw(['HSET', 'ss:acties', an, JSON.stringify(A)]).catch(() => {}); }
    return res.status(200).json({ ok: true, regels: await regels(), actie: await actieNu() }); }

  if (q.get('marges') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json({ ok: true, ...(await ssMarges()) }); }

  if (q.get('stand') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden');
    const som = {}; for (let i = 0; i < 14; i++) { const d = new Date(Date.now() - i * 864e5).toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' }); const a = await kv.raw(['HGETALL', 'ss:tel:' + d]).catch(() => []); for (let j = 0; j + 1 < (a || []).length; j += 2) som[a[j]] = N(som[a[j]]) + N(a[j + 1]); }
    const L = [];
    if (N(som.zie) >= 200 && !N(som.start)) L.push({ lek: 'niemand start', cijfers: som.zie + ' bezoekers, niemand begon', actie: 'kop en eerste scherm' });
    if (N(som.start) >= 20 && !N(som.mee)) L.push({ lek: 'niemand nodigt uit', cijfers: som.start + ' gestart, niemand kwam via een uitnodiging', actie: 'het cadeau voor wie je uitnodigt (zet een actie) en de tekst voor de groepsapp' });
    if (N(som.leden) >= 50 && !N(som.zegelsKoper)) L.push({ lek: 'leden kopen niet', cijfers: som.leden + ' leden, 0 bestellingen met zegels', actie: 'bericht en winkel; staan de zegels in het mandje?' });
    if (N(som.bestel) >= 20 && N(som.bestelZonderZegels) / N(som.bestel) > 0.8) L.push({ lek: 'bestellingen zonder zegels', cijfers: som.bestelZonderZegels + ' van ' + som.bestel + ' bestellingen gaven geen zegels (marge onder €4)', actie: 'spaarproducten (marge vanaf €4) beter in beeld, of de prijs van de best verkochte producten' });
    if (N(som.mailNietKlaar) || N(som.mailFout)) L.push({ lek: 'mail gaat niet weg', cijfers: N(som.mailNietKlaar) + ' keer verzenddomein niet klaar, ' + N(som.mailFout) + ' fouten', actie: 'verzenddomein post.kadoly.com bij Resend en de mailsleutel' });
    if (N(som['mail-welkom']) >= 20 && !N(som.mailklik)) L.push({ lek: 'niemand opent de kaart uit de mail', cijfers: som['mail-welkom'] + ' welkomstmails, 0 kliks', actie: 'onderwerp en knop van de welkomstmail' });
    const nv = {}, raw = await kv.raw(['HGETALL', 'ss:niv']).catch(() => []); for (let j = 0; j + 1 < (raw || []).length; j += 2) { const [l, w] = String(raw[j]).split('|'); (nv[l] = nv[l] || {})[w] = N(raw[j + 1]); }
    const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : null;
    const aanbodStand = Object.entries(nv).map(([l, x]) => ({ aanbod: l, kaartGezien: N(x.zie), gedeeld: N(x.deel), geopend: N(x.open), meespaarders: N(x.mee), aankopen: N(x.koop), deelPer100Kaarten: pct(N(x.deel), N(x.zie)), meespaardersPer100Delen: pct(N(x.mee), N(x.deel)), aankopenPerMeespaarder: N(x.mee) ? Math.round(N(x.koop) / N(x.mee) * 100) / 100 : null }));
    const genoeg = aanbodStand.filter(x => x.kaartGezien >= 200); const best = genoeg.slice().sort((a, b) => (b.meespaarders / b.kaartGezien) - (a.meespaarders / a.kaartGezien))[0];
    return res.status(200).json({ ok: true, live: LIVE, spelregels: SPELREGELS, regels: await regels(), actie: await actieNu(), spaarlijst: lijst.map(d => ({ cadeau: d.i.t, winkelprijs: thuis(d.i), zegels: d.nodig })), laatste14: som, aanbod: aanbodStand, deeldrempel: genoeg.length >= 2 && best ? 'meeste meespaarders per 100 kaarten: ' + best.aanbod : 'nog te weinig: elk aanbod moet 200 keer gezien zijn', lekken: L }); }

  // ---------- link uit een mail of de deelknop: via Clickmind; de eerste mailklik bevestigt je adres ----------
  const go = String(q.get('go') || ''); if (go) { const m = /^[a-f0-9]{12}$/.test(String(q.get('m') || '')) ? await lees('ss:m:' + q.get('m')) : null, k = String(q.get('k') || '');
    if (!m || m.ak !== h(k)) return res.status(404).send('Niet gevonden');
    const voor = /prefetch|prerender/i.test(String(req.headers['sec-purpose'] || req.headers.purpose || '')) || req.method === 'HEAD';
    const cid = randomBytes(6).toString('hex'), w = ['kaart', 'deel', 'kies'].includes(go) ? go : 'kaart'; let doel, net = 'mail';
    const gD = w === 'deel' && m.g ? await lees('ss:g:' + m.g) : null;
    if (gD) { doel = 'https://wa.me/?text=' + encodeURIComponent(`Spaar je mee op onze groepskaart bij Kadoly? Koopt iemand van ons iets, dan komen er spaarzegels op de kaart van ${gD.naam}. Kaart vol, dan is het cadeau gratis. ${base}&g=${gD.id}`); net = 'web'; if (!voor && !isBot(ua)) await tel('groepDeel'); }
    else if (w === 'deel') { const AB = await aanbod(m); doel = 'https://wa.me/?text=' + encodeURIComponent(waTekst(base, m, AB)); net = 'web'; if (!voor && !isBot(ua)) { await telNiv(AB.L, 'deel'); await tel('deel'); } }
    else if (w === 'kies') { const d = lijst.find(x => x.i.id === String(q.get('c') || '')) || lijst[0]; doel = 'https://wa.me/31655395630?text=' + encodeURIComponent(`Ik wil mijn spaarzegels inwisselen voor ${d ? d.i.t : 'een cadeau'}. Spaarkaart ${m.id}`); net = 'web'; }
    else doel = base + '&m=' + m.id + '&k=' + k + '&mmc=' + cid;
    if (!voor && !isBot(ua)) { if (net === 'mail') { if (!m.ok) { m.ok = Date.now(); await zet('ss:m:' + m.id, m); } await tel('mailklik'); }
      try { const MM = await import('./mensmeter.js'); let mmp = (String(req.headers.cookie || '').match(/(?:^|;\s*)mmp=([0-9a-f]{16})/) || [])[1]; const nieuw = !mmp; if (nieuw) mmp = randomBytes(8).toString('hex');
        MM.laterAf(MM.verwerkKlik(kv, { cid, pid: mmp, nieuw, arm: '302', tag: '-', net, camp: LIVE ? 'samensparen' : 'samensparen-test', zone: w, sub: '-', cr: w, kw: '', doel, p: 'ss' }, MM.serverSignalen(req)).catch(() => {}));
        res.setHeader('set-cookie', 'mmp=' + mmp + '; Max-Age=15552000; Path=/; Secure; HttpOnly; SameSite=Lax'); } catch (e) {} }
    return naar(doel); }

  // ---------- geen bericht meer bij een zegel (één klik vanuit de mailapp, of de knop) ----------
  const af = String(q.get('af') || ''); if (af) { const m = /^[a-f0-9]{12}$/.test(af) ? await lees('ss:m:' + af) : null; if (!m || !m.af || m.af !== String(q.get('t') || '')) return res.status(404).send('Niet gevonden');
    if (req.method === 'POST') { m.stil = Date.now(); await zet('ss:m:' + m.id, m); await tel('stil'); if (q.get('knop') !== '1') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('Afgemeld'); }
      return pagina('Geen berichten meer', '<p class="kicker">Samen sparen</p><h1>Je krijgt geen bericht meer bij een zegel</h1><p>Je kaart en je zegels blijven gewoon staan.</p>'); }
    return pagina('Geen bericht meer bij een zegel', `<p class="kicker">Samen sparen</p><h1>Geen bericht meer bij een zegel?</h1><p>Je kaart en je zegels blijven staan. Je krijgt alleen geen mail meer als er een zegel bij komt.</p><form method="post" action="${esc(base + '&af=' + m.id + '&t=' + m.af + '&knop=1')}"><button class="btn knop" type="submit">Geen berichten meer</button></form>`); }

  if (req.method === 'POST') { if (isBot(ua)) return res.status(403).send('Niet toegestaan'); const b = await leesBody(req); if (b.website) return naar(base);
    const naam = schoon(b.naam, 20), mail = schoon(b.mail, 120).toLowerCase(), doel = lijst.some(d => d.i.id === String(b.doel)) ? String(b.doel) : eerste, u = /^[a-f0-9]{12}$/.test(String(b.u || '')) ? String(b.u) : '';
    if (!naam || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail)) return naar(base + (u ? '&u=' + u : '') + '&fout=1');
    const em = h(mail), al = await lees('ss:em:' + em);
    if (al) { const m0 = await lees('ss:m:' + al); if (m0) { const g0 = m0.g ? await lees('ss:g:' + m0.g) : null; await mailNaar(m0, 'welkom', { sleutel: 'opnieuw-' + dagNL(), C, ...(g0 ? { kaart: g0 } : {}) }); } return naar(base + '&al=1'); } // de link naar je kaart nog eens naar dat adres (hooguit één keer per dag)
    // ---------- groepskaart: meedoen (g) of beginnen (groep): elke aankoop van iemand in de groep zet de zegels van het product op één kaart ----------
    const gid = /^[a-f0-9]{10}$/.test(String(b.g || '')) ? String(b.g) : '', gnaam = schoon(b.groep, 30);
    if (gid || gnaam) { const nu = Date.now(), mid = randomBytes(6).toString('hex'), k = randomBytes(12).toString('hex');
      let g = gid ? await lees('ss:g:' + gid) : null; if (gid && !g) return naar(base + '&fout=1');
      if (g && (g.leden || []).length >= 50) return naar(base + '&g=' + g.id + '&vol=1');
      if (!g) { let pt = ''; try { pt = await (await import('./partner.js')).ptUit(req, null); } catch (e) {} const dI = C[doel]; g = { id: randomBytes(5).toString('hex'), naam: gnaam, doel, nodig: dI ? zegelsNodig(dI) : 40, pt, leden: [], beheerder: mid, zegels: [], at: nu }; try { await kv.raw(['SADD', 'ss:groepen', g.id]); } catch (e) {} await tel('groepStart'); } else await tel('groepMee');
      g.leden = (g.leden || []).concat([mid]); g.zegels = (g.zegels || []).concat(startZegels(1, naam, 'welkom', nu)); // welkomstzegel per lid; gratis zegels vullen hooguit twee derde
      try { const los = await kv.raw(['LRANGE', 'ss:los:' + em, '0', '-1']) || []; for (const x of los) { const o = JSON.parse(x); if (o && o.Z && N(o.t) > nu - LOS_DAGEN * 864e5) { g.zegels = g.zegels.concat(aankoop(N(o.Z), naam, N(o.t), o.o)); try { const inf = await lees('ss:ordinfo:' + o.o); if (inf && !inf.koper && !inf.groep) { inf.groep = g.id; await kv.set('ss:ordinfo:' + o.o, inf, { ex: 200 * 86400 }); } } catch (e) {} } } if (los.length) { await kv.raw(['DEL', 'ss:los:' + em]).catch(() => {}); await tel('losBijgeschreven', los.length); } } catch (e) {}
      const m = { id: mid, naam, mail, em, g: g.id, doel: g.doel, nodig: g.nodig, zegels: [], ak: h(k), k, af: randomBytes(9).toString('hex'), at: nu };
      await zet('ss:g:' + g.id, g); await zet('ss:m:' + mid, m); await zet('ss:em:' + em, mid); try { await kv.raw(['SADD', 'ss:leden', mid]); } catch (e) {}
      await tel('leden'); await mailNaar(m, 'welkom', { sleutel: 'eerst', C, kaart: g });
      return naar(base + '&m=' + mid + '&k=' + k + '&nieuw=1'); }
    let door = null, pt = '';
    if (u) door = await lees('ss:m:' + u); if (!door) { try { pt = await (await import('./partner.js')).ptUit(req, null); } catch (e) {} }
    const R = await regels(), mid = randomBytes(6).toString('hex'), k = randomBytes(12).toString('hex'), nu = Date.now();
    const AB = door ? await aanbod(door, b.a) : null; // het cadeau dat de uitnodiger je gaf
    const dI = C[doel]; const m = { id: mid, naam, mail, em, doel, nodig: dI ? zegelsNodig(dI) : 40, door: door ? door.id : '', pt, via: AB ? AB.L : '', niv: R.armen[Math.floor(Math.random() * R.armen.length)],
      zegels: AB ? startZegels(AB.niv, door.naam, 'cadeau', nu) : startZegels(R.zelf, 'Kadoly', 1, nu), ak: h(k), k, af: randomBytes(9).toString('hex'), at: nu };
    try { const los = await kv.raw(['LRANGE', 'ss:los:' + em, '0', '-1']) || []; for (const x of los) { const o = JSON.parse(x); if (o && o.Z && N(o.t) > nu - LOS_DAGEN * 864e5) { m.zegels = m.zegels.concat(aankoop(N(o.Z), naam, N(o.t), o.o)); try { const inf = await lees('ss:ordinfo:' + o.o); if (inf && !inf.koper) { inf.koper = mid; await kv.set('ss:ordinfo:' + o.o, inf, { ex: 200 * 86400 }); } } catch (e) {} } } if (los.length) { await kv.raw(['DEL', 'ss:los:' + em]).catch(() => {}); await tel('losBijgeschreven', los.length); } } catch (e) {} // zegels van bestellingen van voor je aanmelding
    await zet('ss:m:' + mid, m); await zet('ss:em:' + em, mid); try { await kv.raw(['SADD', 'ss:leden', mid]); } catch (e) {}
    if (door) { door.uitgenodigd = (door.uitgenodigd || []).concat([mid]).slice(-500);
      const tweede = !(door.zegels || []).some(z => z.start === 2); if (tweede) { door.zegels = (door.zegels || []).concat(startZegels(R.eersteMee, naam, 2, nu)); if (door.afloop) door.afloop = 0; } // startzegel voor je eerste meespaarder
      await zet('ss:m:' + door.id, door); await telNiv(AB.L, 'mee'); if (tweede) { await tel('startzegel2'); await mailNaar(door, 'zegel', { van: naam, start: true, sleutel: 'start2', C }); } }
    await tel(door ? 'mee' : 'start'); await tel('leden');
    await mailNaar(m, 'welkom', { sleutel: 'eerst', cadeauVan: door ? door.naam : '', C });
    return naar(base + '&m=' + mid + '&k=' + k + '&nieuw=1'); }

  const doelKeus = sel => `<div class="ss-d" role="radiogroup" aria-label="Waar spaar jij voor?">${lijst.map(d => `<label><input type="radio" name="doel" value="${esc(d.i.id)}"${d.i.id === sel ? ' checked' : ''}><span>${esc(d.i.t)}</span><b>${zt(d.nodig)}</b><span>in de winkel ${euro(thuis(d.i))}</span></label>`).join('')}</div>`;
  const velden = `<input type="text" name="naam" required maxlength="20" autocomplete="given-name" placeholder="Je voornaam" aria-label="Je voornaam"><input type="email" name="mail" required maxlength="120" autocomplete="email" placeholder="Je e-mail" aria-label="Je e-mail"><input type="text" name="website" class="ss-hp" tabindex="-1" autocomplete="off" aria-hidden="true">`;
  const fout = q.get('fout') === '1' ? '<p><b>Vul je voornaam en een geldig e-mailadres in.</b></p>' : '';
  const uitleg = 'Bij elke aankoop bij Kadoly krijg je spaarzegels, en wie jou uitnodigde krijgt er evenveel. Kaart vol, dan is je cadeau gratis, ook de verzending.';

  // ---------- jouw spaarkaart ----------
  const mid = String(q.get('m') || ''); if (mid) { const m = /^[a-f0-9]{12}$/.test(mid) ? await lees('ss:m:' + mid) : null; if (!m || m.ak !== h(String(q.get('k') || ''))) return res.status(404).send('Niet gevonden');
    const G = m.g ? await lees('ss:g:' + m.g) : null, H = G || m; // groepskaart of je eigen kaart
    const i = C[H.doel]; const s = stand(H, C), nodig = s.nodig, nu = Date.now(), kk = String(q.get('k'));
    const vrijZ = (H.zegels || []).filter(z => z.vrij <= nu), echt = vrijZ.filter(z => !z.start), gratis = vrijZ.filter(z => z.start).slice(0, maxGratis(nodig)), wachtZ = (H.zegels || []).filter(z => z.vrij > nu), alle = echt.concat(gratis, wachtZ);
    const namen = []; for (const l of (G ? G.leden : m.uitgenodigd || []).slice(-30)) { if (G && l === m.id) continue; const x = await lees('ss:m:' + l); if (x) namen.push(x.naam); }
    const AB = G ? null : await aanbod(m); if (AB && !isBot(ua)) await telNiv(AB.L, 'zie');
    let v = ''; for (let j = 0; j < nodig; j++) { const z = alle[j]; v += z ? `<span class="${z.vrij <= nu ? 'vol' : 'wacht'}" title="${z.start ? 'cadeau van' : 'zegel van'} ${esc(z.van)}">${esc(String(z.van || '?').charAt(0))}</span>` : '<span></span>'; }
    const vol = s.vol, kan = lijst.filter(d => d.nodig <= s.vrij && d.i.id !== H.doel);
    let x = `<p class="kicker">${G ? 'Groepskaart' : 'Samen sparen'}</p><h1>${esc(G ? G.naam : m.naam)} spaart voor ${esc(i ? i.t : 'een cadeau')}</h1>`;
    if (q.get('nieuw') === '1') { const ns = (m.zegels || []).filter(z => z.start).length; x += `<div class="ss-k"><p><b>${G ? 'Je spaart mee op de groepskaart.' : m.door ? `Je kaart begint met ${zt(ns)} cadeau.` : 'Je eerste zegel is cadeau.'}</b> De link naar deze kaart staat ook in je mail. ${G ? 'Koopt iemand in de groep iets, dan komen de zegels van dat product hier.' : m.door ? '' : 'Spaart de eerste persoon via jou mee, dan krijg je er nog een.'}</p></div>`; }
    if (H.afloop && !vol) x += `<div class="ss-cadeau"><p style="margin:0">De zegels vervallen op ${datum(H.afloop)}. Bestel iets bij Kadoly en de kaart blijft gewoon staan.</p></div>`;
    x += `<div class="ss-kaart"><div class="ss-v" aria-label="${s.vrij} van ${nodig} zegels">${v}</div><p class="ss-tel">${s.vrij} van ${nodig} zegels</p>${wachtZ.length ? `<p>${zt(wachtZ.length)} ${wachtZ.length === 1 ? 'telt' : 'tellen'} mee na 30 dagen.</p>` : ''}${s.gratisVol ? '<p><b>De gratis zegels zijn op.</b> Het laatste stuk spaar je met aankopen.</p>' : ''}</div>`;
    x += vol ? `<p><b>${G ? 'De kaart is vol. Het cadeau' : 'Je kaart is vol. Je ' + esc(i ? i.t : 'cadeau')} is gratis.</b></p><p><a class="btn knop" href="${esc(base + '&go=kies&c=' + H.doel + '&m=' + m.id + '&k=' + kk)}">Bestel ${G ? 'het' : 'je'} cadeau gratis</a></p>`
      : G ? `<p>Nog ${zt(nodig - s.vrij)}. ${s.gratisVol ? 'Die komen van aankopen in de groep.' : 'Hoe meer mensen meedoen, hoe sneller de kaart vol is.'}</p><p><a class="btn knop ss-wa" href="${esc(base + '&go=deel&m=' + m.id + '&k=' + kk)}">Nodig uit voor de groepskaart</a></p>`
      : `<div class="ss-cadeau"><p style="margin:0">${AB.actie && AB.actie.tot ? `Actie tot ${datum(AB.actie.tot)}: ` : ''}iedereen die jij uitnodigt, begint met een kaart met ${zt(AB.niv)}.</p></div><p>Nog ${zt(nodig - s.vrij)}.${namen.length < UITNODIG_DOEL ? ` Begin met ${UITNODIG_DOEL} mensen: <b>${namen.length} van ${UITNODIG_DOEL}</b> spaart via jou.` : ''}</p><p><a class="btn knop ss-wa" href="${esc(base + '&go=deel&m=' + m.id + '&k=' + kk)}">Nodig uit en geef ${zt(AB.niv)}</a></p>`;
    if (!vol && kan.length) x += `<p>Met de zegels kun je nu ook ${esc(kan[0].i.t)} krijgen. <a href="${esc(base + '&go=kies&c=' + kan[0].i.id + '&m=' + m.id + '&k=' + kk)}">Kies dit cadeau</a></p>`;
    if (namen.length) x += `<p><b>${G ? 'Spaart mee' : 'Spaart via jou'}</b></p><div class="ss-l">${namen.map(n => `<span>${esc(n)}</span>`).join('')}</div>`;
    x += regelsHtml() + `<p class="meta">De zegels blijven geldig tot ${datum(geldigTot(H))}; elke nieuwe zegel verlengt dat. Vragen? App Henkjan van Kadoly: 06 55395630.</p>`;
    return pagina('Samen sparen: ' + (G ? G.naam : m.naam), x); }

  // ---------- uitnodiging voor een groepskaart ----------
  const gidQ = String(q.get('g') || ''); if (gidQ) { const g = /^[a-f0-9]{10}$/.test(gidQ) ? await lees('ss:g:' + gidQ) : null; if (!g) return res.status(404).send('Niet gevonden');
    if (!isBot(ua)) await tel('groepOpen'); const s = stand(g, C), i = C[g.doel], namen = []; for (const l of (g.leden || []).slice(-12)) { const x = await lees('ss:m:' + l); if (x) namen.push(x.naam); }
    const x = `<p class="kicker">Groepskaart</p><h1>Spaar mee met ${esc(g.naam)}</h1><p>${esc(namen.length ? namen.slice(0, 3).join(', ') + (namen.length > 3 ? ' en ' + (namen.length - 3) + ' anderen' : '') : 'De groep')} ${namen.length === 1 ? 'spaart' : 'sparen'} samen voor ${esc(i ? i.t : 'een cadeau')}: ${s.vrij} van ${s.nodig} zegels. Koopt iemand in de groep iets bij Kadoly, dan komen de zegels van dat product op deze kaart. Kaart vol, dan is het cadeau gratis.</p>${q.get('vol') === '1' ? '<div class="ss-k"><p><b>Deze groep is vol.</b> Begin gerust je eigen kaart.</p></div>' : ''}<div class="ss-k">${fout}<form class="ss-f" method="post" action="${esc(base)}"><input type="hidden" name="g" value="${esc(g.id)}">${velden}<button class="btn knop" type="submit">Spaar mee op de groepskaart</button></form><p class="meta">Geen voorwaarden. Je hoeft zelf niets te kopen.</p></div>${regelsHtml()}`;
    return pagina('Spaar mee met ' + g.naam, x); }

  // ---------- uitnodiging van een lid: een kaart met zegels cadeau ----------
  const uid = String(q.get('u') || ''); if (uid) { const u = /^[a-f0-9]{12}$/.test(uid) ? await lees('ss:m:' + uid) : null; if (!u) return res.status(404).send('Niet gevonden');
    const AB = await aanbod(u, q.get('a')); if (!isBot(ua)) { await tel('open'); await telNiv(AB.L, 'open'); }
    const x = `<p class="kicker">Samen sparen</p><h1>${esc(u.naam)} geeft je een spaarkaart met ${zt(AB.niv)}</h1><p>${esc(uitleg)} Koop jij iets, dan krijgt ${esc(u.naam)} er evenveel.</p><div class="ss-k">${fout}<form class="ss-f" method="post" action="${esc(base)}"><input type="hidden" name="u" value="${esc(uid)}">${AB.actie && AB.actie.naam ? `<input type="hidden" name="a" value="${esc(AB.actie.naam)}">` : ''}<p><b>Waar spaar jij voor?</b></p>${doelKeus(eerste)}${velden}<button class="btn knop" type="submit">Pak je kaart met ${zt(AB.niv)}</button></form><p class="meta">Geen voorwaarden. Je hoeft zelf niets te kopen.</p></div>${regelsHtml()}`;
    return pagina(u.naam + ' geeft je een spaarkaart', x); }

  // ---------- start (uit een advertentie, of via een site of vereniging) ----------
  if (!isBot(ua)) await tel('zie');
  let pnaam = ''; try { const P = await import('./partner.js'); const pt = await P.ptUit(req, q); if (pt) { const p = await P.partner(pt); pnaam = p ? p.naam : ''; if (pnaam) res.setHeader('set-cookie', 'kpt=' + pt + '; Max-Age=' + (7 * 86400) + '; Path=/; Secure; SameSite=Lax'); } } catch (e) {}
  let x = `<p class="kicker">Samen sparen${pnaam ? ' met ' + esc(pnaam) : ''}</p><h1>Spaar samen iets helemaal gratis</h1><p>${esc(uitleg)} Je eerste zegel is cadeau.</p>`;
  if (q.get('al') === '1') x += '<div class="ss-k"><p><b>Met dit e-mailadres spaar je al.</b> We stuurden de link naar je kaart opnieuw naar dat adres.</p></div>';
  x += `<div class="ss-k">${fout}<form class="ss-f" method="post" action="${esc(base)}"><p><b>Waar spaar jij voor?</b></p>${doelKeus(eerste)}${velden}<input type="text" name="groep" maxlength="30" placeholder="Spaar je met een groep? Naam van je groep (mag leeg)" aria-label="Naam van je groep, mag leeg"><button class="btn knop" type="submit">Start met samen sparen</button></form><p class="meta">Geen voorwaarden. Gratis is echt gratis, ook de verzending.${pnaam ? ' Wat jij koopt, steunt ' + esc(pnaam) + '.' : ''} Kadoly is een webshop van ADSFAIR B.V.</p></div>${regelsHtml()}`;
  return pagina('Samen sparen bij Kadoly', x);
}
