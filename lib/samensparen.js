// Samen sparen bij Kadoly (Henkjan 22 nov 2026): "Samen sparen moet het heten", "1 een heel lekker duidelijk verhaal", "geen voorwaarden als je
// maar deelt", "Iedere verkoop krijgen ze 1 euro ?", "ook verenigingen", en de regel zelf: "ik heb jou uitgenodigd dus ik krijg 1 zegel als JIJ
// koopt . Dus er wordt maar 1 zegel uitgegeven per aankoop ."
// - Iedereen heeft één uitnodiger: een persoon, of een site, vereniging of school (partner, lib/partner.js).
// - Elke betaalde bestelling geeft precies één zegel van €1 aan wie de koper uitnodigde. Was dat een site of vereniging, dan krijgt die €1 geld
//   (grootboek pt:o:<code>). Wie via een advertentie zelf begon, heeft geen uitnodiger: dan gaat er niets uit.
// - Een spaarkaart heeft één vakje per euro van het product waarvoor je spaart; vol = het product gratis, ook de verzending.
//   Zegels komen 14 dagen na de bestelling vrij (retourtermijn). Je hoeft zelf niets te kopen: je spaart met de aankopen van wie jij uitnodigde.
// - Koppeling met de winkel: fn/shop.js pxVerwerk geeft bij elke betaalde bestelling de sha256 van het e-mailadres (u.em) door aan ssBestelling.
// - Kosten: hooguit één zegel per bestelling (€1 tegoed kost ons €0,83) of €1 voor een partner.
// - Startzegels (Henkjan 22 nov: "hoe krijgen we doel dichterbij ? door eenvoudige inspanning van hen" en "uitnodigen geeft iemand dus een kaart met
//   twee zegels er op"): wie zelf begint krijgt 1, wie wordt uitgenodigd krijgt een kaart met het cadeau van de uitnodiger (standaard 2), en de
//   uitnodiger krijgt 1 als de eerste persoon via hem meespaart (Nunes en Drèze 2006: kaart van 10 met 2 al gestempeld 34% vol, leeg van 8 19%).
//   Startzegels tellen alleen voor een volle kaart (geen korting), dus ze kosten pas iets als er minstens (kaart - startzegels) echte aankopen
//   achter zitten. Het cadeau is hooguit 5 (de kleinste kaart is 15). Op de kaart staat "Begin met 3 mensen" tot er 3 via jou sparen.
// - Deeldrempel vinden (Henkjan 22 nov: "We moeten zo kunnen inregelen dat we acties kunnen doen om de deeltreshold te vinden"): het cadeau per
//   uitnodiger komt uit kv ss:regels.armen (willekeurig per lid bij aanmelden) of uit een lopende actie (kv ss:actie, geldt voor iedereen tot de
//   einddatum; een uitnodiging uit een actie blijft 30 dagen na het einde geldig, zodat een belofte nooit verandert). Instellen op de beschermde host:
//   op=ss&zet=1&armen=2,3 of &actie=<naam>&cadeau=3&dagen=7 (of actie=uit). Meten per aanbod in hash ss:niv: kaart gezien, gedeeld (tik op de
//   knop), uitnodiging geopend, meespaarders, hun aankopen. Stand: op=ss&stand=1 onder aanbod.
// - Geldigheid (Henkjan 22 nov: "12 maanden of korter om aankoop push te geven", na onderzoek: "Ja zo bouwen"): elke nieuwe zegel verlengt de hele
//   kaart tot 6 maanden na die zegel. Daarna één mail: je aankoopzegels zijn €1 per stuk waard als korting, 3 weken lang; komt er in die 3 weken
//   een zegel bij, dan loopt de kaart gewoon door. Daarna vervallen ze. Alleen startzegels: die vervallen zonder mail. Dagelijks via ssRonde
//   (aangeroepen vanuit de cron op=indexnow in fn/gids.js). Korting inwisselen nu via WhatsApp aan Henkjan, tot de kassa een code aankan.
// - Berichten (Henkjan 22 nov: "bericht zet aan"): welkomstmail met de link naar je kaart, en een mail bij elke zegel. Zegelmails pas nadat je
//   één keer op de link in je mail klikte (adres bevestigd), met afmelden in één klik. Elke link via Clickmind (op=ss&go=, net mail of web).
// - Concept tot LIVE = true: alleen op de beschermde host.
// - Controle: /api/gids?op=ss&stand=1 (beschermd) met lekken en drempels.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';

export const LIVE = false;
const ZEGEL = 1, VRIJ_DAGEN = 14, UITNODIG_DOEL = 3, CADEAU_MAX = 5, GELDIG_DAGEN = 182, AFLOOP_DAGEN = 21;
const REGELS0 = { zelf: 1, eersteMee: 1, armen: [2] };
const BASE = () => (LIVE ? 'https://gids.kadoly.com' : 'https://hjdk-api-henq.vercel.app') + '/api/gids?op=ss';
const DOELEN = ['oc_4173959362543617', 'oc_4174005866250241', 'oc_4174004744241153', 'oc_4173958884671489']; // scheerkwast, kaarsenset, geurkaars, plantenset
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const h = s => createHash('sha256').update(String(s)).digest('hex');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = x => '€' + (Math.round(N(x) * 100) / 100).toFixed(2).replace('.', ',').replace(',00', '');
const schoon = (v, n) => String(v || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const dagNL = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
const datum = t => new Date(t).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' });
const zegelsTekst = n => n === 1 ? '1 zegel' : n + ' zegels';
async function tel(wat, n = 1) { try { const k = 'ss:tel:' + dagNL(); await kv.raw(['HINCRBY', k, wat, String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); } catch (e) {} }
async function telNiv(L, wat) { if (!L) return; try { await kv.raw(['HINCRBY', 'ss:niv', L + '|' + wat, '1']); } catch (e) {} }
async function cat() { let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {} const m = {}; for (const i of (c && c.items) || []) if (i && i.id) m[i.id] = i; return m; }
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
const zegelsVoor = i => Math.ceil(thuis(i) / ZEGEL);
const lees = async k => { try { return await kv.get(k); } catch (e) { return null; } };
const zet = (k, v) => kv.set(k, v, { ex: 400 * 86400 }).catch(() => {});
function stand(m, C, nu = Date.now()) { const i = C[m.doel] || null, nodig = i ? zegelsVoor(i) : 40, z = m.zegels || []; const vrij = z.filter(x => x.vrij <= nu).length; return { i, nodig, vrij: Math.min(vrij, nodig), wacht: z.length - vrij, vol: vrij >= nodig }; }
const laatst = m => Math.max(N(m.at), ...(m.zegels || []).map(z => N(z.t)));
const geldigTot = m => laatst(m) + GELDIG_DAGEN * 864e5;
const kortingWaard = (m, nu = Date.now()) => (m.zegels || []).filter(z => !z.start && z.vrij <= nu).length * ZEGEL; // startzegels tellen alleen voor een volle kaart
const startZegels = (n, van, soort, nu) => Array.from({ length: n }, () => ({ t: nu, vrij: nu, van, start: soort }));

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
const waTekst = (base, m, AB) => `Spaar je mee bij Kadoly? Ik geef je een spaarkaart met al ${zegelsTekst(AB.niv)} erop. Koop je iets, dan krijg ik een zegel van €1. Kaart vol, dan is je product gratis. ${uitnodigLink(base, m, AB)}`;

// ---------- mail (via de Kadoly-afzender van lib/kadoly-nieuws.js) ----------
const goUrl = (m, w) => BASE() + '&go=' + w + '&m=' + m.id + '&k=' + m.k;
function balk(n, van) { const p = Math.max(2, Math.min(100, Math.round(n / Math.max(1, van) * 100))); return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1.5px solid #111113;border-radius:999px;border-collapse:separate"><tr><td width="${p}%" style="background:#111113;height:12px;border-radius:999px;font-size:0;line-height:0">&nbsp;</td><td style="font-size:0;line-height:0">&nbsp;</td></tr></table>`; }
export function mailInhoud(KN, m, soort, x = {}) {
  const C = x.C || {}, s = stand(m, C), wat = s.i ? s.i.t : 'je cadeau', rest = Math.max(0, s.nodig - s.vrij);
  const voet = (af) => `Je krijgt deze mail omdat je bij Kadoly begon met samen sparen.${af ? ` <a href="${BASE()}&af=${m.id}&t=${m.af}" style="color:#0B0D12;font-weight:700">Geen bericht meer bij een zegel</a>` : ''}<br><br>Vragen? Antwoord op deze mail, of bel of app Henkjan van Kadoly: <a href="https://wa.me/31655395630" style="color:#0B0D12;font-weight:700">06 55395630</a>.<br><br>${esc(KN.KADOLY_BEDRIJF)}`;
  const kaart = `<p style="margin:0 0 6px;font-size:24px;font-weight:700">${s.vrij} van ${s.nodig} zegels</p><p style="margin:0 0 10px">voor ${esc(wat)}${s.wacht ? `, en ${s.wacht} ${s.wacht === 1 ? 'zegel komt' : 'zegels komen'} vrij na de retourtermijn van 14 dagen` : ''}.</p>${balk(s.vrij, s.nodig)}`;
  if (soort === 'welkom') { const n = (m.zegels || []).filter(z => z.start).length, van = x.cadeauVan ? esc(x.cadeauVan) : '';
    return { onderwerp: van ? `Je spaarkaart met ${zegelsTekst(n)} van ${x.cadeauVan}` : 'Je spaarkaart bij Kadoly', html: KN.mailSchil({ titel: 'Je spaarkaart bij Kadoly', voorkop: `Je spaart voor ${wat}. Er ${n === 1 ? 'staat al 1 zegel' : 'staan al ' + n + ' zegels'} op.`,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Je spaarkaart staat klaar, ${esc(m.naam)}</h1><p style="margin:0 0 16px">${van ? `${van} gaf je ${zegelsTekst(n)} cadeau. ` : 'Je eerste zegel is cadeau. '}Koopt iemand die jij uitnodigde iets bij Kadoly, dan krijg jij een zegel van €1. Kaart vol, dan is je product gratis, ook de verzending.</p>${kaart}<p style="margin:0 0 18px">${KN.knop(goUrl(m, 'kaart'), 'Open je spaarkaart')}</p><p style="margin:0;font-size:14px">Bewaar deze mail: met de knop kom je altijd terug op je kaart. Na één klik krijg je ook een bericht bij elke nieuwe zegel. Je zegels blijven 6 maanden geldig na je laatste zegel.</p>`,
    voet: voet(false) }) }; }
  if (soort === 'afloop') { const w = kortingWaard(m);
    return { onderwerp: `Je ${zegelsTekst(w)} vervallen over 3 weken`, html: KN.mailSchil({ titel: 'Gebruik je zegels als korting', voorkop: `Ze zijn samen ${euro(w)} waard.`,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Gebruik je zegels nu als korting</h1><p style="margin:0 0 16px">Er kwam 6 maanden geen zegel bij op je kaart. Je ${zegelsTekst(w)} zijn samen <b>${euro(w)}</b> waard. Gebruik ze voor ${datum(m.afloop)} als korting op een bestelling bij Kadoly. Komt er voor die tijd een nieuwe zegel bij, dan blijft je kaart gewoon staan.</p><p style="margin:0 0 6px">${KN.knop(goUrl(m, 'korting'), 'Gebruik ' + euro(w) + ' als korting')}</p>`,
    voet: voet(false) }) }; }
  const start = !!x.start, van = esc(x.van || 'Iemand');
  const kop = s.vol ? 'Je kaart is vol' : 'Er komt een zegel van €1 op je kaart';
  const zin = start ? `${van} spaart nu via jou mee. Daarvoor krijg je een startzegel, meteen op je kaart. Koopt ${van} iets bij Kadoly, dan krijg jij er nog een.` : `${van} kocht iets bij Kadoly. Omdat jij ${van} uitnodigde, krijg jij een zegel van €1. Hij telt mee na de retourtermijn van 14 dagen.`;
  return { onderwerp: start ? `${x.van || 'Iemand'} spaart mee: een zegel voor jou` : `${x.van || 'Iemand'} kocht iets: een zegel voor jou`, html: KN.mailSchil({ titel: kop, voorkop: s.vol ? `Je ${wat} is gratis.` : `Nog ${rest} zegels voor ${wat}.`,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">${kop}</h1><p style="margin:0 0 16px">${zin}</p>${kaart}<p style="margin:0 0 6px">${KN.knop(goUrl(m, 'kaart'), s.vol ? 'Bestel je cadeau gratis' : 'Bekijk je spaarkaart')}</p>`,
    voet: voet(true) }) };
}
async function mailNaar(m, soort, x = {}) {
  if (!m || !m.mail || !m.k || (soort === 'zegel' && (!m.ok || m.stil)) || (soort === 'afloop' && !m.ok)) return false; // afloop: één keer, ook als je zegelberichten uitzette
  try { const KN = await import('./kadoly-nieuws.js'); if (!(await KN.mailKlaar())) { await tel('mailNietKlaar'); return false; }
    const { onderwerp, html } = mailInhoud(KN, m, soort, { ...x, C: await cat() });
    const headers = soort === 'zegel' ? { 'List-Unsubscribe': '<' + BASE() + '&af=' + m.id + '&t=' + m.af + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined;
    await KN.stuurMails([{ to: [m.mail], subject: onderwerp, html, ...(headers ? { headers } : {}) }], 'ss-' + soort + '-' + m.id + '-' + String(x.sleutel || dagNL()).slice(0, 60));
    await tel('mail-' + soort); return true;
  } catch (e) { await tel('mailFout'); return false; }
}

// ---------- de koppeling met de winkel: één zegel per bestelling, voor wie de koper uitnodigde ----------
export async function ssBestelling({ em, v, order, t }) {
  if (!/^[0-9a-f]{64}$/.test(String(em || ''))) return { ok: false };
  const mid = await lees('ss:em:' + em); if (!mid) return { ok: true, geenLid: true };
  if (order) { const nieuw = await kv.raw(['SET', 'ss:ord:' + order, '1', 'NX', 'EX', String(120 * 86400)]).catch(() => null); if (!nieuw) return { ok: true, dubbel: true }; }
  const m = await lees('ss:m:' + mid); if (!m) return { ok: false };
  const nu = t || Date.now(); let naar = '';
  if (m.door) { const d = await lees('ss:m:' + m.door); if (d) { d.zegels = (d.zegels || []).concat([{ t: nu, vrij: nu + VRIJ_DAGEN * 864e5, van: m.naam, o: String(order || '').slice(0, 40) }]).slice(-400); if (d.afloop) { d.afloop = 0; await tel('afloopGered'); } // nieuwe zegel: de kaart loopt door
    await zet('ss:m:' + d.id, d); naar = 'lid'; await tel('zegels'); await telNiv(m.via, 'koop'); await mailNaar(d, 'zegel', { van: m.naam, sleutel: order || nu }); } }
  else if (m.pt) { try { const { boekBestelling } = await import('./partner.js'); await boekBestelling('p-' + m.pt, { v, order, t: nu }); naar = 'partner'; await tel('partnerEuro'); } catch (e) {} }
  await tel('bestel');
  try { await kv.raw(['RPUSH', 'ss:log', JSON.stringify({ t: nu, m: mid, v: Math.round(N(v) * 100), naar })]); await kv.raw(['LTRIM', 'ss:log', '-2000', '-1']); } catch (e) {}
  return { ok: true, naar };
}

// ---------- doorrekenen (Henkjan 22 nov: "reken alles weer goed door . Mag geen lek in zitten"): marge per product uit de catalogus
// (mg = marge in euro zonder btw, p = prijs met btw) tegen wat elk spaarmodel per product kost. Een zegel kost ons hooguit €1/1,21 = €0,83
// (als korting; als product minder). Lek = kosten meer dan de helft van de marge (de andere helft moet winst blijven) of meer dan de hele marge.
export async function ssMarges() {
  let c = null, f = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {} try { f = await kv.get('hjdk:shop:lusfeed'); } catch (e) {}
  const items = ((c && c.items) || []).filter(i => i && N(i.p) > 0), Z = 0.83;
  const MOD = { 'nu: 1 zegel per bestelling voor wie uitnodigde': p => Z, 'per bestelling 1 voor jou en 1 voor wie uitnodigde': p => 2 * Z, 'per €10: 1 voor jou en 1 voor wie uitnodigde': p => 2 * Math.floor(p / 10) * Z, 'per €10: alleen voor jou': p => Math.floor(p / 10) * Z, 'site of vereniging: €1 plus per €10 1 voor jou': p => 1 + Math.floor(p / 10) * Z };
  const EM = [['verlies', -1e9, 0], ['0-10%', 0, .1], ['10-20%', .1, .2], ['20-30%', .2, .3], ['30-40%', .3, .4], ['40% en meer', .4, 1e9]];
  const uit = { producten: items.length, metMarge: 0, margeAlsDeelVanPrijs: {}, verkochtLaatste30: {}, mediaan: null, mediaanVerkocht: null, modellen: {} };
  const rs = [], rw = [];
  for (const i of items) { if (i.mg == null) continue; const p = N(i.p), mg = N(i.mg), r = mg / p, w = N(i.so30); uit.metMarge++; rs.push(r); for (let k = 0; k < w; k++) rw.push(r);
    const e = EM.find(x => r >= x[1] && r < x[2])[0]; uit.margeAlsDeelVanPrijs[e] = N(uit.margeAlsDeelVanPrijs[e]) + 1; if (w) uit.verkochtLaatste30[e] = N(uit.verkochtLaatste30[e]) + w;
    for (const [naam, fn] of Object.entries(MOD)) { const k = fn(p), M = uit.modellen[naam] = uit.modellen[naam] || { producten: 0, bovenHelft: 0, bovenHeel: 0, verkocht: 0, verkochtBovenHelft: 0, verkochtBovenHeel: 0 }; M.producten++; M.verkocht += w; if (k > mg / 2) { M.bovenHelft++; M.verkochtBovenHelft += w; } if (k > mg) { M.bovenHeel++; M.verkochtBovenHeel += w; } } }
  const med = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return Math.round(s[Math.floor(s.length / 2)] * 1000) / 10 + '%'; };
  uit.mediaan = med(rs); uit.mediaanVerkocht = med(rw);
  for (const M of Object.values(uit.modellen)) { M.lekProducten = Math.round(M.bovenHelft / Math.max(1, M.producten) * 1000) / 10 + '% boven de helft, ' + Math.round(M.bovenHeel / Math.max(1, M.producten) * 1000) / 10 + '% boven de hele marge'; M.lekVerkocht = M.verkocht ? Math.round(M.verkochtBovenHelft / M.verkocht * 1000) / 10 + '% boven de helft, ' + Math.round(M.verkochtBovenHeel / M.verkocht * 1000) / 10 + '% boven de hele marge' : null; }
  // echte bestellingen uit de datapagina van de shop (laatste dagen): marge per bestelling uit de catalogus
  const perId = {}; for (const i of items) perId[i.id] = i; const ord = {};
  for (const o of ((f && f.orders) || []).filter(o => /paid|betaald/i.test(String(o.s || '')))) { const k = o.id || Math.random(); const x = ord[k] = ord[k] || { v: 0, mg: 0, onbekend: 0 }; x.v = Math.max(x.v, N(o.v)); const it = perId[o.p] || perId[String(o.p || '').split('-')[0]]; if (it && it.mg != null) x.mg += N(it.mg) * Math.max(1, N(o.n)); else x.onbekend++; }
  uit.betaaldeBestellingen = Object.values(ord).map(x => ({ bedrag: x.v, marge: Math.round(x.mg * 100) / 100, margePct: x.v ? Math.round(x.mg / x.v * 1000) / 10 : null, onbekend: x.onbekend }));
  return uit;
}

// ---------- dagelijkse ronde: geldigheid (vanuit de cron op=indexnow in fn/gids.js) ----------
export async function ssRonde(nu = Date.now()) {
  const uit = { leden: 0, afloopMail: 0, verlopen: 0 }; let ids = []; try { ids = await kv.raw(['SMEMBERS', 'ss:leden']) || []; } catch (e) {}
  for (const id of ids.slice(0, 5000)) { const m = await lees('ss:m:' + id); if (!m) continue; uit.leden++;
    if (!(m.zegels || []).length) continue;
    if (m.afloop && nu > m.afloop) { const n = m.zegels.length; m.zegels = []; m.afloop = 0; m.verlopen = N(m.verlopen) + n; await zet('ss:m:' + id, m); await tel('verlopen', n); uit.verlopen += n; continue; }
    if (!m.afloop && nu > geldigTot(m)) {
      if (kortingWaard(m, nu) > 0) { m.afloop = nu + AFLOOP_DAGEN * 864e5; await zet('ss:m:' + id, m); if (await mailNaar(m, 'afloop', { sleutel: 'afloop-' + laatst(m) })) uit.afloopMail++; }
      else { const n = m.zegels.length; m.zegels = []; m.verlopen = N(m.verlopen) + n; await zet('ss:m:' + id, m); await tel('verlopen', n); uit.verlopen += n; } } // alleen startzegels: vervallen zonder mail
  }
  return uit;
}

const CSS = `<style>.ss-k{border:1px solid #D7DCE8;border-radius:16px;padding:16px 18px;margin:0 0 14px}.ss-f{display:grid;gap:10px;max-width:520px}.ss-f input[type=text],.ss-f input[type=email]{min-height:48px;border:1.5px solid #111113;border-radius:12px;padding:10px 12px;font:inherit;background:#fff;color:#111113}.ss-d{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.ss-d label{border:1.5px solid #D7DCE8;border-radius:14px;padding:10px;cursor:pointer;display:grid;gap:2px}.ss-d label:has(input:checked){border-color:#111113;box-shadow:0 0 0 1.5px #111113}.ss-d input{position:absolute;opacity:0}.ss-kaart{border:2px solid #111113;border-radius:18px;padding:14px;margin:8px 0 12px}.ss-v{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:5px}.ss-v span{aspect-ratio:1;border:1.5px dashed #111113;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700}.ss-v span.vol{border-style:solid;background:#111113;color:#fff}.ss-v span.wacht{border-style:solid}.ss-tel{font-size:28px;font-weight:700;margin:8px 0 0}.ss-l{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.ss-l span{border:1.5px solid #111113;border-radius:999px;padding:2px 10px;font-weight:700;font-size:14px}.ss-wa{background:#1F8F4E!important;border-color:#1F8F4E!important;color:#fff!important}.ss-hp{position:absolute!important;left:-9999px!important}.ss-cadeau{border:2px solid #111113;border-radius:16px;padding:12px 14px;margin:0 0 14px;font-weight:700}</style>`;

export async function ssOp({ req, res, q, host, ua, kaal, leesBody, isBot }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const beschermd = /\.vercel\.app$/i.test(host); if (!beschermd && !LIVE) return res.status(404).send('Niet gevonden');
  const base = (beschermd ? 'https://' + host : 'https://gids.kadoly.com') + '/api/gids?op=ss';
  const naar = u => { res.setHeader('location', u); return res.status(303).end(); };
  const pagina = (titel, x) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(kaal(titel, CSS + (LIVE ? '' : '<div class="ss-k"><p><b>Concept.</b> Dit staat nog niet op gids.kadoly.com; alleen jij ziet het hier.</p></div>') + x, '<script src="https://go.kadoly.com/cm.js" data-site="samensparen" async></script>')); };
  // dichtstbijzijnde doel eerst en voorgekozen (les LivingSocial Me+3: een doel dat binnen bereik ligt, wordt gedeeld)
  const C = await cat(); const doelen = DOELEN.map(p => C[p]).filter(i => i && i.vr !== false).sort((a, b) => zegelsVoor(a) - zegelsVoor(b)); const eerste = doelen[0] ? doelen[0].id : DOELEN[0];

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
    if (N(som.leden) >= 50 && !N(som.bestel)) L.push({ lek: 'leden kopen niet', cijfers: som.leden + ' leden, 0 bestellingen', actie: 'bericht en winkel; stuurt de kassa de e-mailvingerafdruk mee?' });
    if (N(som.mailNietKlaar) || N(som.mailFout)) L.push({ lek: 'mail gaat niet weg', cijfers: N(som.mailNietKlaar) + ' keer verzenddomein niet klaar, ' + N(som.mailFout) + ' fouten', actie: 'verzenddomein post.kadoly.com bij Resend en de mailsleutel' });
    if (N(som['mail-welkom']) >= 20 && !N(som.mailklik)) L.push({ lek: 'niemand opent de kaart uit de mail', cijfers: som['mail-welkom'] + ' welkomstmails, 0 kliks', actie: 'onderwerp en knop van de welkomstmail' });
    // deeldrempel: per aanbod (cadeau van 1 tot 5 zegels, of een actie) hoe vaak de kaart gezien, gedeeld, geopend, meegespaard en gekocht
    const nv = {}, raw = await kv.raw(['HGETALL', 'ss:niv']).catch(() => []); for (let j = 0; j + 1 < (raw || []).length; j += 2) { const [l, w] = String(raw[j]).split('|'); (nv[l] = nv[l] || {})[w] = N(raw[j + 1]); }
    const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : null;
    const aanbodStand = Object.entries(nv).map(([l, x]) => ({ aanbod: l, kaartGezien: N(x.zie), gedeeld: N(x.deel), geopend: N(x.open), meespaarders: N(x.mee), aankopen: N(x.koop), deelPer100Kaarten: pct(N(x.deel), N(x.zie)), meespaardersPer100Delen: pct(N(x.mee), N(x.deel)), aankopenPerMeespaarder: N(x.mee) ? Math.round(N(x.koop) / N(x.mee) * 100) / 100 : null }));
    const genoeg = aanbodStand.filter(x => x.kaartGezien >= 200); const best = genoeg.slice().sort((a, b) => (b.meespaarders / b.kaartGezien) - (a.meespaarders / a.kaartGezien))[0];
    return res.status(200).json({ ok: true, live: LIVE, regel: 'één zegel van €1 per bestelling, voor wie de koper uitnodigde', regels: await regels(), actie: await actieNu(), laatste14: som, aanbod: aanbodStand, deeldrempel: genoeg.length >= 2 && best ? 'meeste meespaarders per 100 kaarten: ' + best.aanbod : 'nog te weinig: elk aanbod moet 200 keer gezien zijn', lekken: L }); }

  // ---------- link uit een mail of de deelknop: via Clickmind; de eerste mailklik bevestigt je adres ----------
  const go = String(q.get('go') || ''); if (go) { const m = /^[a-f0-9]{12}$/.test(String(q.get('m') || '')) ? await lees('ss:m:' + q.get('m')) : null, k = String(q.get('k') || '');
    if (!m || m.ak !== h(k)) return res.status(404).send('Niet gevonden');
    const voor = /prefetch|prerender/i.test(String(req.headers['sec-purpose'] || req.headers.purpose || '')) || req.method === 'HEAD';
    const cid = randomBytes(6).toString('hex'), w = ['kaart', 'deel', 'korting'].includes(go) ? go : 'kaart'; let doel, net = 'mail';
    if (w === 'deel') { const AB = await aanbod(m); doel = 'https://wa.me/?text=' + encodeURIComponent(waTekst(base, m, AB)); net = 'web'; if (!voor && !isBot(ua)) { await telNiv(AB.L, 'deel'); await tel('deel'); } }
    else if (w === 'korting') doel = 'https://wa.me/31655395630?text=' + encodeURIComponent(`Ik wil mijn ${zegelsTekst(kortingWaard(m))} (${euro(kortingWaard(m))}) als korting gebruiken. Spaarkaart ${m.id}`);
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
    const naam = schoon(b.naam, 20), mail = schoon(b.mail, 120).toLowerCase(), doel = DOELEN.includes(String(b.doel)) ? String(b.doel) : eerste, u = /^[a-f0-9]{12}$/.test(String(b.u || '')) ? String(b.u) : '';
    if (!naam || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail)) return naar(base + (u ? '&u=' + u : '') + '&fout=1');
    const em = h(mail), al = await lees('ss:em:' + em);
    if (al) { const m0 = await lees('ss:m:' + al); if (m0) await mailNaar(m0, 'welkom', { sleutel: 'opnieuw-' + dagNL() }); return naar(base + '&al=1'); } // de link naar je kaart nog eens naar dat adres (hooguit één keer per dag)
    let door = null, pt = '';
    if (u) door = await lees('ss:m:' + u); if (!door) { try { pt = await (await import('./partner.js')).ptUit(req, null); } catch (e) {} }
    const R = await regels(), mid = randomBytes(6).toString('hex'), k = randomBytes(12).toString('hex'), nu = Date.now();
    const AB = door ? await aanbod(door, b.a) : null; // het cadeau dat de uitnodiger je gaf
    const m = { id: mid, naam, mail, em, doel, door: door ? door.id : '', pt, via: AB ? AB.L : '', niv: R.armen[Math.floor(Math.random() * R.armen.length)],
      zegels: AB ? startZegels(AB.niv, door.naam, 'cadeau', nu) : startZegels(R.zelf, 'Kadoly', 1, nu), ak: h(k), k, af: randomBytes(9).toString('hex'), at: nu };
    await zet('ss:m:' + mid, m); await zet('ss:em:' + em, mid); try { await kv.raw(['SADD', 'ss:leden', mid]); } catch (e) {}
    if (door) { door.uitgenodigd = (door.uitgenodigd || []).concat([mid]).slice(-500);
      const tweede = !(door.zegels || []).some(z => z.start === 2); if (tweede) { door.zegels = (door.zegels || []).concat(startZegels(R.eersteMee, naam, 2, nu)); if (door.afloop) door.afloop = 0; } // startzegel voor je eerste meespaarder
      await zet('ss:m:' + door.id, door); await telNiv(AB.L, 'mee'); if (tweede) { await tel('startzegel2'); await mailNaar(door, 'zegel', { van: naam, start: true, sleutel: 'start2' }); } }
    await tel(door ? 'mee' : 'start'); await tel('leden');
    await mailNaar(m, 'welkom', { sleutel: 'eerst', cadeauVan: door ? door.naam : '' });
    return naar(base + '&m=' + mid + '&k=' + k + '&nieuw=1'); }

  const doelKeus = sel => `<div class="ss-d" role="radiogroup" aria-label="Waar spaar jij voor?">${doelen.map(i => `<label><input type="radio" name="doel" value="${esc(i.id)}"${i.id === sel ? ' checked' : ''}><span>${esc(i.t)}</span><b>${zegelsVoor(i)} zegels · ${euro(thuis(i))}</b></label>`).join('')}</div>`;
  const velden = `<input type="text" name="naam" required maxlength="20" autocomplete="given-name" placeholder="Je voornaam" aria-label="Je voornaam"><input type="email" name="mail" required maxlength="120" autocomplete="email" placeholder="Je e-mail" aria-label="Je e-mail"><input type="text" name="website" class="ss-hp" tabindex="-1" autocomplete="off" aria-hidden="true">`;
  const fout = q.get('fout') === '1' ? '<p><b>Vul je voornaam en een geldig e-mailadres in.</b></p>' : '';
  const uitleg = 'Koopt iemand die jij uitnodigde iets bij Kadoly, dan krijg jij een zegel van €1. Kaart vol, dan is je product gratis, ook de verzending.';

  // ---------- jouw spaarkaart ----------
  const mid = String(q.get('m') || ''); if (mid) { const m = /^[a-f0-9]{12}$/.test(mid) ? await lees('ss:m:' + mid) : null; if (!m || m.ak !== h(String(q.get('k') || ''))) return res.status(404).send('Niet gevonden');
    const i = C[m.doel]; const nodig = i ? zegelsVoor(i) : 40; const nu = Date.now();
    const vrijZ = (m.zegels || []).filter(z => z.vrij <= nu), wachtZ = (m.zegels || []).filter(z => z.vrij > nu), alle = vrijZ.concat(wachtZ);
    const namen = []; for (const l of (m.uitgenodigd || []).slice(-30)) { const x = await lees('ss:m:' + l); if (x) namen.push(x.naam); }
    const AB = await aanbod(m); if (!isBot(ua)) await telNiv(AB.L, 'zie');
    let v = ''; for (let j = 0; j < nodig; j++) { const z = alle[j]; v += z ? `<span class="${z.vrij <= nu ? 'vol' : 'wacht'}" title="${z.start ? 'cadeau van' : 'zegel van'} ${esc(z.van)}">${esc(String(z.van || '?').charAt(0))}</span>` : '<span></span>'; }
    const vol = vrijZ.length >= nodig;
    let x = `<p class="kicker">Samen sparen</p><h1>${esc(m.naam)} spaart voor ${esc(i ? i.t : 'een cadeau')}</h1>`;
    if (q.get('nieuw') === '1') { const ns = (m.zegels || []).filter(z => z.start).length; x += `<div class="ss-k"><p><b>${m.door ? `Je kaart begint met ${zegelsTekst(ns)} cadeau.` : 'Je eerste zegel is cadeau.'}</b> De link naar deze kaart staat ook in je mail. ${m.door ? '' : 'Spaart de eerste persoon via jou mee, dan krijg je er nog een.'}</p></div>`; }
    if (m.afloop && !vol) x += `<div class="ss-cadeau"><p style="margin:0">Je zegels vervallen op ${datum(m.afloop)}. Gebruik je ${euro(kortingWaard(m))} nu als korting, of nodig iemand uit: een nieuwe zegel houdt je kaart gewoon open.</p><p style="margin:10px 0 0"><a class="btn knop" href="${esc(base + '&go=korting&m=' + m.id + '&k=' + String(q.get('k')))}">Gebruik ${euro(kortingWaard(m))} als korting</a></p></div>`;
    x += `<div class="ss-kaart"><div class="ss-v" aria-label="${vrijZ.length} van ${nodig} zegels">${v}</div><p class="ss-tel">${Math.min(vrijZ.length, nodig)} van ${nodig} zegels</p>${wachtZ.length ? `<p>${wachtZ.length} ${wachtZ.length === 1 ? 'zegel komt' : 'zegels komen'} vrij na de retourtermijn van 14 dagen.</p>` : ''}</div>`;
    x += vol ? `<p><b>Je kaart is vol. Je ${esc(i ? i.t : 'product')} is gratis.</b></p><p><a class="btn knop" href="https://wa.me/31655395630?text=${encodeURIComponent('Mijn spaarkaart is vol: ' + (i ? i.t : '') + ' (' + mid + ')')}">Bestel gratis</a></p>`
      : `<div class="ss-cadeau"><p style="margin:0">${AB.actie && AB.actie.tot ? `Actie tot ${datum(AB.actie.tot)}: ` : ''}iedereen die jij uitnodigt, begint met een kaart met ${zegelsTekst(AB.niv)}.</p></div><p>Nog ${nodig - Math.min(vrijZ.length, nodig)} zegels.${namen.length < UITNODIG_DOEL ? ` Begin met ${UITNODIG_DOEL} mensen: <b>${namen.length} van ${UITNODIG_DOEL}</b> spaart via jou.` : ''}</p><p><a class="btn knop ss-wa" href="${esc(base + '&go=deel&m=' + m.id + '&k=' + String(q.get('k')))}">Nodig uit en geef ${zegelsTekst(AB.niv)}</a></p>`;
    if (namen.length) x += `<p><b>Spaart via jou</b></p><div class="ss-l">${namen.map(n => `<span>${esc(n)}</span>`).join('')}</div>`;
    x += `<p class="meta">${esc(uitleg)} Je hoeft zelf niets te kopen. Je zegels blijven geldig tot ${datum(geldigTot(m))}; elke nieuwe zegel verlengt dat met 6 maanden. Vragen? App Henkjan van Kadoly: 06 55395630.</p>`;
    return pagina('Samen sparen: ' + m.naam, x); }

  // ---------- uitnodiging van een lid: een kaart met zegels cadeau ----------
  const uid = String(q.get('u') || ''); if (uid) { const u = /^[a-f0-9]{12}$/.test(uid) ? await lees('ss:m:' + uid) : null; if (!u) return res.status(404).send('Niet gevonden');
    const AB = await aanbod(u, q.get('a')); if (!isBot(ua)) { await tel('open'); await telNiv(AB.L, 'open'); }
    const x = `<p class="kicker">Samen sparen</p><h1>${esc(u.naam)} geeft je een spaarkaart met ${zegelsTekst(AB.niv)}</h1><p>Spaar mee bij Kadoly. Kaart vol, dan is je product gratis, ook de verzending. Koop je iets, dan krijgt ${esc(u.naam)} een zegel van €1. Nodig jij mensen uit, dan krijg jij een zegel als zij iets kopen.</p><div class="ss-k">${fout}<form class="ss-f" method="post" action="${esc(base)}"><input type="hidden" name="u" value="${esc(uid)}">${AB.actie && AB.actie.naam ? `<input type="hidden" name="a" value="${esc(AB.actie.naam)}">` : ''}<p><b>Waar spaar jij voor?</b></p>${doelKeus(eerste)}${velden}<button class="btn knop" type="submit">Pak je kaart met ${zegelsTekst(AB.niv)}</button></form><p class="meta">Geen voorwaarden. Je hoeft zelf niets te kopen. Zegels blijven 6 maanden geldig na je laatste zegel.</p></div>`;
    return pagina(u.naam + ' geeft je een spaarkaart', x); }

  // ---------- start (uit een advertentie, of via een site of vereniging) ----------
  if (!isBot(ua)) await tel('zie');
  let pnaam = ''; try { const P = await import('./partner.js'); const pt = await P.ptUit(req, q); if (pt) { const p = await P.partner(pt); pnaam = p ? p.naam : ''; if (pnaam) res.setHeader('set-cookie', 'kpt=' + pt + '; Max-Age=' + (7 * 86400) + '; Path=/; Secure; SameSite=Lax'); } } catch (e) {}
  let x = `<p class="kicker">Samen sparen${pnaam ? ' met ' + esc(pnaam) : ''}</p><h1>Spaar samen iets helemaal gratis</h1><p>${esc(uitleg)} Je eerste zegel is cadeau, en je hoeft zelf niets te kopen.</p>`;
  if (q.get('al') === '1') x += '<div class="ss-k"><p><b>Met dit e-mailadres spaar je al.</b> We stuurden de link naar je kaart opnieuw naar dat adres.</p></div>';
  x += `<div class="ss-k">${fout}<form class="ss-f" method="post" action="${esc(base)}"><p><b>Waar spaar jij voor?</b></p>${doelKeus(eerste)}${velden}<button class="btn knop" type="submit">Start met samen sparen</button></form><p class="meta">Geen voorwaarden. Gratis is echt gratis, ook de verzending. Zegels blijven 6 maanden geldig na je laatste zegel.${pnaam ? ' Wat jij koopt, steunt ' + esc(pnaam) + '.' : ''} Kadoly is een webshop van ADSFAIR B.V.</p></div>`;
  return pagina('Samen sparen bij Kadoly', x);
}
