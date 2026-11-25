// De lerende modal en antwoordmotor als herbruikbare motor (Henkjan 25 nov 2026: "Maak een extreem goed lerende modal die wijst op de chat.
// Wijst op de gidsen. Vraagt om email voor kortingen. Voor de wekelijkse brief dus en de spaarzegel programma van Kadoly. LEER ALLE variabelen.
// Dus grootte opmaak enz. Frequentie en alles instelbaar in de email. Ze mogen replyen als er vragen zijn. We maken hier een modal en reply motor."
// en daarna: "Zorg dat we deze lerende motor op veel meer projecten kunnen aanzetten.").
//
// Eén motor per project (PROJECTEN hieronder; aanvullingen per project in kv mm:motor:<project>):
//   1. de modal zelf is lib/modal.js (Clickmind, Thompson per arm, moment, vorm, stijl, tekst en factoren); de modal-instellingen per site staan
//      hier als sjabloon (MODALS) en gaan met /api/mm/motorbeheer?p=<project>&zet=1 naar kv mm:modal:<site> (geleerde stand blijft staan);
//   2. aanmelden met dubbele opt-in, de belofte en de getoonde tekst als bewijs van toestemming (aanmelden, bevestig, afmelden);
//   3. het voorkeurencentrum (frequentie, onderwerpen, 30 dagen pauze, afmelden met één klik): voorkeurHtml, voorkeurZet, magMailen;
//   4. welkomstmail per belofte (welkom), en de dagronde (dagRonde: kerstherinnering, nieuwe producten met naam, volle spaarkaart);
//   5. de antwoordmotor: Reply-To naar <antwoord@domein> (Resend receiving), AI-antwoord (goedkoopste model via lib/ai.js, alleen feiten)
//      naar de afzender met CC naar het project, klachten, retouren en bestellingen gemarkeerd, elke stroom gemeld bij de POST-lus;
//   6. controle: stand(p) met vertoningen, aanmeldingen, bevestigd, antwoorden en de lekken met drempel.
// Opslag per project onder cfg.prefix (Kadoly: gk:nb, dezelfde sleutels als lib/kadoly-nieuws.js): <prefix>:pending:<hash>, :e:<id>, :af:<hash>,
//   :vt:<hash> (voorkeur), :emails (set), :er:<id>, :dag:<dag>, :rl:<..>. Tellers mt:d:<project>:<dag>. Antwoorden mt:in:<email-id> (dubbel),
//   mt:log:<project> (laatste 300, adressen gehasht), mt:<project>:ontvangklaar. Waarheid van beloftes: mm:motor:<project>:waar:<belofte>.
import { createHash, randomBytes } from 'node:crypto';
import { kv as KV } from './db.js';

const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const h = s => createHash('sha256').update(String(s)).digest('hex');
const tok = () => randomBytes(24).toString('hex');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const okMail = e => /^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i.test(e) && e.length <= 254;
const dagNL = (t = Date.now()) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
const datumNl = d => { try { return new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }); } catch (e) { return String(d); } };
const kaal = a => String(a || '').replace(/^.*</, '').replace(/>.*$/, '').trim().toLowerCase();

// ---------- projecten ----------
// Een nieuw project: voeg hier een blok toe (of zet het met /api/mm/motorbeheer?p=<id>&cfg=<json>), zet MODALS voor zijn sites, laad cm.js
// met data-site="<site>" op zijn pagina's en volg 'Aanzetten op een nieuw project' in lib/werking.js.
export const PROJECTEN = {
  kadoly: {
    id: 'kadoly', naam: 'Kadoly', taal: 'nl', sites: ['kadoly', 'kadolygids'],
    host: 'https://gids.kadoly.com', paden: { bevestig: '/nieuws/bevestig', voorkeur: '/nieuws/voorkeur', af: '/nieuws/af' },
    prefix: 'gk:nb', idZout: 'kd:', klaarSleutel: 'gk:nb:mailklaar',
    domein: 'post.kadoly.com', afzender: 'Kadoly <nieuws@post.kadoly.com>', antwoord: 'antwoord@post.kadoly.com', antwoordNaam: 'Kadoly',
    cc: 'henkjan@kadoly.com', // Henkjan 25 nov 2026: "Antwoord van jou (AI) en CC ook naar mij met je antwoord."
    bedrijf: 'Kadoly Shop · ADSFAIR B.V. · Albert Plesmanplein 20, 2805 AB Gouda · KVK 60126035', logo: 'https://cdn.kadoly.com/icon/shop/apple-180.png?v=1',
    wa: '31655395630', winkel: 'https://kadoly.com', catalogus: 'hjdk:shop:cat', gidsen: 'kadoly', standaardFreq: 'week',
    onderwerpen: [['keuzehulpen', 'Nieuwe keuzehulpen'], ['cadeautips', 'Cadeautips'], ['wonen', 'Wonen en tuin'], ['sieraden', 'Sieraden en horloges'], ['spaarkaart', 'Je spaarkaart'], ['naam', 'Producten met een naam erop'], ['kerst', 'Kerstherinnering']]
  }
};
export const FREQUENTIES = [['week', 'Eén keer per week'], ['2week', 'Eén keer per twee weken'], ['maand', 'Eén keer per maand'], ['acties', 'Alleen als er een actie is'], ['pauze30', '30 dagen pauze']];
const FREQ_DAGEN = { week: 6, '2week': 13, maand: 27 };

// De beloftes van de e-mailarmen. waar() bepaalt of de modal de belofte nu mag doen (lib/modal.js haalt ze er anders uit).
// Henkjan 25 nov 2026 over korting: "gratis verzending + alles wat je bedenkt als maar waar is en converteert. Start me minstens 5 opties."
export const BELOFTES = {
  kadoly: {
    spaarkaart: { label: 'Spaarkaart-test: 3 van de 5 zegels', onderwerpen: ['spaarkaart', 'keuzehulpen', 'cadeautips'] },
    weekbrief: { label: 'De weekbrief met nieuwe keuzehulpen en cadeautips', onderwerpen: ['keuzehulpen', 'cadeautips', 'wonen', 'sieraden'] },
    kerst: { label: 'Kerstherinnering met de laatste besteldag', onderwerpen: ['kerst', 'cadeautips'] },
    naam: { label: 'Als eerste horen van producten met een naam erop', onderwerpen: ['naam', 'cadeautips'] },
    advies: { label: 'Persoonlijk cadeauadvies per mail', onderwerpen: ['cadeautips', 'keuzehulpen'] },
    verzending: { label: 'Gratis verzending op je eerste bestelling', onderwerpen: ['keuzehulpen', 'cadeautips'] }
  }
};

export async function project(p) {
  const id = String(p || '').toLowerCase(), basis = PROJECTEN[id]; let extra = null;
  try { extra = await KV.get('mm:motor:' + id); } catch (e) {}
  if (!basis && !(extra && extra.domein)) return null;
  return { ...(extra && typeof extra === 'object' ? extra : {}), ...(basis || {}), id, ...(extra && extra.overschrijf ? extra.overschrijf : {}) };
}
// Een project zonder eigen blok hierboven kan zich met één config aanmelden (beschermde host): domein, afzender, antwoord, cc, host, naam.
export async function zetProject(p, c) {
  const id = String(p || '').toLowerCase(); if (!/^[a-z0-9-]{2,30}$/.test(id)) return { ok: false, fout: 'project-id' };
  if (!c || typeof c !== 'object') return { ok: false, fout: 'cfg moet JSON zijn' };
  const t = (x, n) => String(x == null ? '' : x).replace(/[<>\u0000-\u001f]/g, ' ').trim().slice(0, n);
  const o = { naam: t(c.naam, 40), taal: /^[a-z]{2}$/.test(String(c.taal || '')) ? c.taal : 'nl', sites: (Array.isArray(c.sites) ? c.sites : [id]).map(x => String(x).toLowerCase()).filter(x => /^[a-z0-9-]{2,30}$/.test(x)).slice(0, 6),
    host: /^https:\/\/[a-z0-9.-]+$/.test(String(c.host || '')) ? c.host : 'https://whichtobuy.best', domein: /^[a-z0-9.-]+\.[a-z]{2,}$/.test(String(c.domein || '')) ? c.domein : '',
    afzender: t(c.afzender, 120), antwoord: okMail(String(c.antwoord || '')) ? c.antwoord : '', antwoordNaam: t(c.antwoordNaam, 60), cc: okMail(String(c.cc || '')) ? c.cc : '', bedrijf: t(c.bedrijf, 200),
    onderwerpen: Array.isArray(c.onderwerpen) ? c.onderwerpen.filter(x => Array.isArray(x) && /^[a-z0-9-]{2,20}$/.test(x[0])).map(x => [x[0], t(x[1], 40)]).slice(0, 12) : [['nieuws', 'Nieuws']],
    standaardFreq: FREQ_DAGEN[c.standaardFreq] ? c.standaardFreq : 'week', kennis: t(c.kennis, 3000), winkel: /^https:\/\//.test(String(c.winkel || '')) ? c.winkel : '' };
  if (!o.domein || !o.afzender || !o.cc) return { ok: false, fout: 'domein, afzender en cc zijn nodig' };
  o.prefix = 'mt:' + id; o.idZout = 'mt:' + id + ':'; o.klaarSleutel = 'mt:' + id + ':mailklaar';
  if (!o.antwoord) o.antwoord = 'antwoord@' + o.domein;
  o.paden = { bevestig: '/api/mm/motor?p=' + id + '&stap=bevestig', voorkeur: '/api/mm/motor?p=' + id + '&stap=voorkeur', af: '/api/mm/motor?p=' + id + '&stap=af' };
  await KV.set('mm:motor:' + id, o); return { ok: true, project: o };
}
const url = (cfg, pad, t) => cfg.host + cfg.paden[pad] + (cfg.paden[pad].includes('?') ? '&' : '?') + 't=' + t;
async function tel(cfg, wat, n = 1) { try { const k = 'mt:d:' + cfg.id + ':' + dagNL(); await KV.raw(['HINCRBY', k, wat, String(n)]); await KV.raw(['EXPIRE', k, String(90 * 86400)]); } catch (e) {} }
async function tellers(cfg, dagen = 7) { const o = {}; for (let i = 0; i < dagen; i++) { let a = null; try { a = await KV.raw(['HGETALL', 'mt:d:' + cfg.id + ':' + dagNL(Date.now() - i * 864e5)]); } catch (e) {} if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) o[a[j]] = N(o[a[j]]) + N(a[j + 1]); else for (const [k, v] of Object.entries(a || {})) o[k] = N(o[k]) + N(v); } return o; }
export async function mailKlaar(cfg) { try { return !!(await KV.get(cfg.klaarSleutel)); } catch (e) { return false; } }
export async function ontvangKlaar(cfg) { try { return !!(await KV.get('mt:' + cfg.id + ':ontvangklaar')); } catch (e) { return false; } }
// Reply-To: het antwoordadres zodra ontvangen werkt; daarvoor gaat een antwoord rechtstreeks naar het CC-adres (een mens), nooit naar een gat
export async function replyTo(cfg) { return (await ontvangKlaar(cfg)) ? (cfg.antwoordNaam ? cfg.antwoordNaam + ' <' + cfg.antwoord + '>' : cfg.antwoord) : cfg.cc; }
async function sleutel() { if (process.env.RESEND_API_KEY || process.env.RESEND) return process.env.RESEND_API_KEY || process.env.RESEND; try { return ((await KV.get('hjdk:secrets')) || {}).RESEND_API_KEY || ''; } catch (e) { return ''; } }
export async function stuur(cfg, mails, idem) { // mails: [{to, subject, html, text, cc, headers}]
  const key = await sleutel(); if (!key) throw Error('geen mailsleutel'); const rt = await replyTo(cfg);
  const body = mails.map(m => ({ from: cfg.afzender, reply_to: rt, ...m }));
  const r = await fetch('https://api.resend.com/emails' + (body.length > 1 ? '/batch' : ''), { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json', ...(idem ? { 'idempotency-key': String(idem).slice(0, 250) } : {}) }, body: JSON.stringify(body.length > 1 ? body : body[0]) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw Error('mail ' + r.status + ' ' + String(j.message || j.name || '').slice(0, 120)); return j;
}

// ---------- wat waar is (lib/modal.js leest dit elke minuut) ----------
export async function kerstDag(cfg) {
  try { const v = await KV.get('mm:motor:' + cfg.id + ':kerstdag'); if (/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return { dag: String(v), bron: 'Henkjan' }; } catch (e) {}
  try { const c = await KV.get('mt:' + cfg.id + ':kerstcalc'); if (c && c.dag && Date.now() - N(c.at) < 12 * 36e5) return c; } catch (e) {}
  // mediaan van de opgegeven levertijden (werkdagen) uit de winkelcatalogus; uiterlijk op 23 december in huis, plus één dag marge
  let lts = []; try { const cat = await KV.get(cfg.catalogus || 'hjdk:shop:cat'); lts = ((cat && cat.items) || []).filter(i => i && i.vr !== false && N(i.lt) > 0).map(i => N(i.lt)).sort((a, b) => a - b); } catch (e) {}
  const med = lts.length ? lts[Math.floor(lts.length / 2)] : 5, jaar = new Date().getUTCFullYear();
  let d = new Date(Date.UTC(jaar, 11, 23, 12)), w = 0; while (w < med + 1) { d = new Date(d.getTime() - 864e5); const wd = d.getUTCDay(); if (wd !== 0 && wd !== 6) w++; }
  const uit = { dag: d.toISOString().slice(0, 10), mediaanLevertijd: med, producten: lts.length, bron: 'catalogus', at: Date.now() };
  try { await KV.set('mt:' + cfg.id + ':kerstcalc', uit, { ex: 86400 }); } catch (e) {}
  return uit;
}
export async function waarStand(kv = KV) {
  const uit = { _bewijs: {} };
  for (const p of Object.keys(BELOFTES)) {
    const cfg = await project(p); if (!cfg) continue; const klaar = await mailKlaar(cfg), get = async k => { try { return await kv.get('mm:motor:' + p + ':waar:' + k); } catch (e) { return null; } };
    const nu = dagNL(), kd = await kerstDag(cfg), kerstTot = new Date(Date.parse(kd.dag + 'T12:00:00Z') - 3 * 864e5).toISOString().slice(0, 10);
    for (const b of Object.keys(BELOFTES[p])) {
      const uitgezet = N(await get(b)) === -1; let w = klaar && !uitgezet;
      if (b === 'verzending') w = w && N(await get(b)) === 1; // pas aan als bevestigd is dat de winkel het echt doet (TAAK E in lib/shopprompt.js)
      if (b === 'kerst') w = w && nu <= kerstTot;
      if (b === 'advies') w = w && await ontvangKlaar(cfg); // antwoorden per mail kan pas als ontvangen werkt
      uit[b] = w;
    }
    try { uit._bewijs[p] = N(await kv.raw(['SCARD', cfg.prefix + ':emails'])) >= 25; } catch (e) {}
  }
  return uit;
}
export async function bewijsTekst(kv, p) { const cfg = await project(p || 'kadoly'); if (!cfg) return ''; const n = N(await kv.raw(['SCARD', cfg.prefix + ':emails']).catch(() => 0)); return n >= 25 ? n + ' mensen krijgen deze mail al' : ''; }

// ---------- gidsen en voorbeeldvragen per pagina ----------
const STOP = new Set('de het een en van voor met op in bij je jouw welke wat past kiezen kies is of te om aan als die dat er hoe naar niet ook nog zo the a an of for to and with on in at by is it this that product'.split(' '));
const woorden = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w));
async function gidsLijst(p) {
  if (p !== 'kadoly') return [];
  const G = await import('./gidsen-kadoly.js');
  return G.GIDS_IDS.map(id => G.GIDSEN[id]).filter(Boolean).map(g => ({ slug: g.slug, titel: String(g.h1 || g.titel || g.slug).split(':')[0].trim(), kort: String(g.kort || ''), faq: (g.faq || [])[0], w: new Set(woorden(g.slug + ' ' + g.h1 + ' ' + (g.kicker || ''))), bijgewerkt: g.bijgewerkt }));
}
const SEIZOEN = () => { const m = new Date().getUTCMonth() + 1, d = new Date().getUTCDate(); return m === 12 && d <= 24 || m === 11 ? ['kerstcadeau', 'cadeau-voor-haar', 'cadeau-voor-hem'] : ['cadeau-voor-haar', 'cadeau-voor-hem', 'housewarming-cadeau']; };
export async function gidsenVoor(p, { pa = '', kw = '' } = {}) {
  const cfg = await project(p || 'kadoly'); if (!cfg) return [];
  const L = await gidsLijst(cfg.id); if (!L.length) return [];
  const pad = String(pa || '').replace(/^\/+|\/+$/g, ''), eigen = L.find(g => g.slug === pad.split('/').pop());
  const q = new Set(woorden(pad.replace(/^(product|p|rubriek|redactie)\//, '') + ' ' + kw + ' ' + (eigen ? eigen.titel : '')));
  const score = g => [...g.w].filter(w => q.has(w) || [...q].some(x => x.length > 4 && (w.startsWith(x.slice(0, 5)) || x.startsWith(w.slice(0, 5))))).length;
  let top = L.filter(g => g !== eigen).map(g => ({ g, s: score(g) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || String(b.g.bijgewerkt).localeCompare(String(a.g.bijgewerkt))).map(x => x.g);
  for (const s of SEIZOEN()) if (top.length < 3) { const g = L.find(x => x.slug === s && x !== eigen && !top.includes(x)); if (g) top.push(g); }
  return top.slice(0, 3).map(g => ({ titel: g.titel, url: cfg.host + '/' + g.slug + '?utm_source=modal&utm_medium=owned&utm_campaign=gidsdeur', sub: g.kort.split(/(?<=\.)\s/)[0].slice(0, 110) }));
}
// Eén concrete vraag die de chat echt kan beantwoorden: de eerste FAQ-vraag van de gids van deze pagina, anders een cadeauvraag van het seizoen.
export async function voorbeeldVragen(p, { pa = '', pt = '' } = {}) {
  const L = await gidsLijst(String(p || 'kadoly')); const slug = String(pa || '').replace(/^\/+|\/+$/g, '').split('/').pop(), g = L.find(x => x.slug === slug);
  if (g && g.faq && g.faq.v && String(g.faq.v).length <= 70) return [String(g.faq.v)];
  if (pt === 'product') return ['Is dit een goed cadeau, en wanneer is het er?'];
  const m = new Date().getUTCMonth() + 1; return [m === 11 || m === 12 ? 'Wat is een goed kerstcadeau onder €30?' : 'Ik zoek een cadeau voor iemand die alles al heeft'];
}

// ---------- aanmelden, bevestigen, afmelden ----------
const idVan = (cfg, email) => h((cfg.idZout || 'mt:' + cfg.id + ':') + email).slice(0, 32);
const P = (cfg, k) => cfg.prefix + ':' + k;
export async function aanmelden(p, b, ip) {
  const cfg = await project(p); if (!cfg) return { ok: false, fout: 'project' };
  const email = String(b.email || '').trim().toLowerCase(); if (!okMail(email)) return { ok: false, fout: 'email' };
  if (!(await mailKlaar(cfg))) return { ok: false, fout: 'nogniet' };
  if (b.website || N(b.ms) < 1200) return { ok: true }; // honingpot of te snel: stil negeren
  const rk = P(cfg, 'rl:' + h(ip + ':' + Math.floor(Date.now() / 60000)).slice(0, 24)); const n = await KV.incr(rk); if (n === 1) await KV.raw(['EXPIRE', rk, '120']); if (n > 6) return { ok: false, fout: 'druk' };
  const id = idVan(cfg, email), belofte = /^[a-z0-9-]{2,20}$/.test(String(b.belofte || '')) ? String(b.belofte) : '';
  const s = await KV.get(P(cfg, 'e:' + id));
  if (s && s.actief) { // al aangemeld en bevestigd: een nieuwe belofte geldt meteen (toestemming is er al), anders hetzelfde antwoord zonder mail
    if (belofte && !(s.beloftes || [s.belofte]).includes(belofte) && await KV.raw(['SET', P(cfg, 'nb:' + id + ':' + belofte), '1', 'NX', 'EX', String(30 * 86400)])) {
      s.beloftes = (s.beloftes || [s.belofte].filter(Boolean)).concat([belofte]); s.onderwerpen = [...new Set((s.onderwerpen || []).concat(((BELOFTES[cfg.id] || {})[belofte] || {}).onderwerpen || []))];
      await KV.set(P(cfg, 'e:' + id), s); await naBevestig(cfg, id, s, belofte).catch(() => null); await tel(cfg, 'extraBelofte|' + belofte); }
    return { ok: true, al: true };
  }
  if (!(await KV.raw(['SET', P(cfg, 'er:' + id), '1', 'NX', 'EX', '600']))) return { ok: true }; // hooguit één bevestigingsmail per 10 minuten per adres
  const dk = P(cfg, 'dag:' + dagNL()); const d = await KV.incr(dk); if (d === 1) await KV.raw(['EXPIRE', dk, '172800']); if (d > 300) return { ok: false, fout: 'druk' };
  const t = tok(), mid = /^[0-9a-f]{12}$/.test(String(b.mid || '')) ? String(b.mid) : undefined;
  const pend = { id, email, at: Date.now(), arm: String(b.arm || 'c').slice(0, 20), waar: String(b.waar || '').slice(0, 60) || undefined, mid, belofte: belofte || undefined, site: String(b.site || '').slice(0, 30) || undefined,
    toestemming: String(b.toestemming || '').slice(0, 600) || undefined, naam: String(b.naam || '').slice(0, 30) || undefined };
  await KV.set(P(cfg, 'pending:' + h(t)), pend, { ex: 2 * 86400 });
  await stuur(cfg, [{ to: [email], subject: 'Bevestig je aanmelding bij ' + cfg.naam, html: mailBevestig(cfg, url(cfg, 'bevestig', t), belofte), text: tekstBevestig(cfg, url(cfg, 'bevestig', t), belofte) }], cfg.id + '-bevestig-' + h(t).slice(0, 32));
  await tel(cfg, 'aanvraag'); await tel(cfg, 'aanvraag|' + (belofte || 'geen')); return { ok: true };
}
export async function bevestigOpen(p, t) { const cfg = await project(p); if (!cfg || !/^[a-f0-9]{48}$/.test(t || '')) return null; return await KV.get(P(cfg, 'pending:' + h(t))); }
export async function bevestig(p, t, basis = {}) {
  const cfg = await project(p); const pend = await bevestigOpen(p, t); if (!pend) return null;
  const oud = await KV.get(P(cfg, 'e:' + pend.id)); if (pend.klaar || (oud && oud.actief)) return { ...(oud || { email: pend.email }), al: true };
  const af = (oud && oud.af) || tok(), vt = (oud && oud.vt) || tok(), bel = pend.belofte || 'weekbrief';
  const s = { ...basis, ...(oud || {}), email: pend.email, actief: true, arm: pend.arm || 'c', at: (oud && oud.at) || pend.at, bevestigd: Date.now(), af, vt,
    belofte: bel, beloftes: [...new Set(((oud && oud.beloftes) || []).concat([bel]))], waar: pend.waar, site: pend.site, mid: pend.mid, naam: pend.naam,
    toestemming: pend.toestemming, toestemmingAt: Date.now(), freq: (oud && oud.freq) || cfg.standaardFreq || 'week',
    onderwerpen: (oud && oud.onderwerpen) || (((BELOFTES[cfg.id] || {})[bel] || {}).onderwerpen) || (cfg.onderwerpen || []).map(x => x[0]) };
  await KV.set(P(cfg, 'e:' + pend.id), s); await KV.set(P(cfg, 'af:' + h(af)), pend.id); await KV.set(P(cfg, 'vt:' + h(vt)), pend.id); await KV.raw(['SADD', P(cfg, 'emails'), pend.id]);
  await KV.set(P(cfg, 'pending:' + h(t)), { ...pend, klaar: Date.now() }, { ex: 2 * 86400 });
  await tel(cfg, 'bevestigd'); await tel(cfg, 'bevestigd|' + bel);
  if (pend.mid) { try { const M = await import('./modal.js'); await M.modalUitkomst(KV, pend.mid, 'bevestigd'); } catch (e) {} }
  try { await naBevestig(cfg, pend.id, s, bel); } catch (e) { await tel(cfg, 'welkomFout'); }
  return s;
}
export async function afmelden(p, t, weer) {
  const cfg = await project(p); if (!cfg || !/^[a-f0-9]{48}$/.test(t || '')) return null; const id = await KV.get(P(cfg, 'af:' + h(t))); if (!id) return null; const s = await KV.get(P(cfg, 'e:' + id)); if (!s) return null;
  if (weer) { if (!s.actief) { s.actief = true; s.weer = Date.now(); await KV.set(P(cfg, 'e:' + id), s); await KV.raw(['SADD', P(cfg, 'emails'), id]); await tel(cfg, 'weer'); } return s; }
  if (s.actief) { s.actief = false; s.afAt = Date.now(); await KV.set(P(cfg, 'e:' + id), s); await KV.raw(['SREM', P(cfg, 'emails'), id]); await tel(cfg, 'af'); await tel(cfg, 'af|' + (s.belofte || 'geen')); } return s;
}
// zorgt dat een abonnee een voorkeurtoken heeft (oudere aanmeldingen) en geeft de link
export async function voorkeurLink(cfg, id, s) { if (!s.vt) { s.vt = tok(); await KV.set(P(cfg, 'vt:' + h(s.vt)), id); await KV.set(P(cfg, 'e:' + id), s); } return url(cfg, 'voorkeur', s.vt); }

// ---------- voorkeurencentrum ----------
export async function voorkeurLees(p, t) { const cfg = await project(p); if (!cfg || !/^[a-f0-9]{48}$/.test(t || '')) return null; const id = await KV.get(P(cfg, 'vt:' + h(t))); if (!id) return null; const s = await KV.get(P(cfg, 'e:' + id)); return s ? { cfg, id, s } : null; }
export async function voorkeurZet(p, t, b) {
  const r = await voorkeurLees(p, t); if (!r) return null; const { cfg, id, s } = r; b = b || {};
  if (b.af === '1') { await afmelden(p, s.af); return { ...r, s: { ...s, actief: false }, af: true }; }
  if (b.aan === '1' && !s.actief) { await afmelden(p, s.af, true); s.actief = true; }
  const fr = FREQUENTIES.map(x => x[0]); if (fr.includes(b.freq)) { if (b.freq === 'pauze30') { s.pauzeTot = Date.now() + 30 * 864e5; if (s.freq !== 'pauze30') s.freqVoor = s.freq; } else { s.pauzeTot = 0; s.freqVoor = undefined; } s.freq = b.freq; }
  const ow = (cfg.onderwerpen || []).map(x => x[0]); const gekozen = [].concat(b.o || []).map(String).filter(x => ow.includes(x)); if (b.o !== undefined || b.opslaan === '1') s.onderwerpen = gekozen;
  s.voorkeurAt = Date.now(); await KV.set(P(cfg, 'e:' + id), s); await tel(cfg, 'voorkeur'); await tel(cfg, 'freq|' + s.freq);
  return { cfg, id, s, opgeslagen: true };
}
// Mag deze abonnee nu deze soort mail krijgen? soort: 'week' (de gewone brief), 'actie', 'herinnering' (iets wat hij zelf vroeg: kerst, spaarkaart)
export function magMailen(s, soort = 'week', nu = Date.now()) {
  if (!s || !s.actief) return false;
  if (s.pauzeTot && nu < N(s.pauzeTot)) return false;
  const f = s.freq === 'pauze30' ? (s.freqVoor || 'week') : (s.freq || 'week');
  if (soort === 'herinnering') return true;
  if (f === 'acties') return soort === 'actie';
  const d = FREQ_DAGEN[f] || 6; return !s.laatsteMail || nu - N(s.laatsteMail) >= d * 864e5;
}
export function wilOnderwerp(s, ow) { return !s || !Array.isArray(s.onderwerpen) || !s.onderwerpen.length ? true : [].concat(ow).some(x => s.onderwerpen.includes(x)); }
// welke onderwerpen een gids van Kadoly raakt (voor de vrijdagbrief)
export function gidsOnderwerpen(g) { const t = String((g && (g.slug + ' ' + g.h1)) || '').toLowerCase(); const o = ['keuzehulpen'];
  if (/cadeau|sinterklaas|kado/.test(t)) o.push('cadeautips'); if (/kerst/.test(t)) o.push('kerst', 'cadeautips'); if (/sierad|ketting|armband|oorbel|horloge|\bring\b/.test(t)) o.push('sieraden'); if (/naam|graveer|gepersonaliseerd/.test(t)) o.push('naam');
  if (!/cadeau|sierad|horloge/.test(t)) o.push('wonen'); return [...new Set(o)]; }

const ZW = { tekst: '#000000', achter: '#ffffff', rand: '#000000' }; // zwart-wit, maximaal contrast, geen grijs (skill keuzehulp-bouw)
export function voorkeurHtml(cfg, s, t, { opgeslagen = false, actie = '' } = {}) {
  const freq = s.freq === 'pauze30' && s.pauzeTot && Date.now() < s.pauzeTot ? 'pauze30' : (s.freq === 'pauze30' ? (s.freqVoor || 'week') : (s.freq || 'week'));
  const ow = cfg.onderwerpen || [], aan = new Set(Array.isArray(s.onderwerpen) && s.onderwerpen.length ? s.onderwerpen : ow.map(x => x[0]));
  const radio = FREQUENTIES.map(([k, l]) => `<label class="mv-o"><input type="radio" name="freq" value="${k}"${freq === k ? ' checked' : ''}><span>${esc(l)}${k === 'pauze30' && freq === 'pauze30' ? ' (tot ' + esc(new Date(s.pauzeTot).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })) + ')' : ''}</span></label>`).join('');
  const vink = ow.map(([k, l]) => `<label class="mv-o"><input type="checkbox" name="o" value="${k}"${aan.has(k) ? ' checked' : ''}><span>${esc(l)}</span></label>`).join('');
  const melding = opgeslagen ? `<p class="mv-ok" role="status">Opgeslagen. ${s.actief ? 'Zo krijg je voortaan je mail.' : 'Je krijgt geen mail meer.'}</p>` : '';
  if (!s.actief) return `<div class="mv">${melding}<h1>Je krijgt geen mail meer van ${esc(cfg.naam)}</h1><p>Afgemeld op ${esc(s.email)}. Vergissing?</p><form method="post"><input type="hidden" name="aan" value="1"><button class="mv-k" type="submit">Meld me weer aan</button></form></div>`;
  return `<div class="mv">${melding}<h1>Jouw mail van ${esc(cfg.naam)}</h1><p>Voor <b>${esc(s.email)}</b>. Kies hoe vaak en waarover. Je hoeft niets te bevestigen.</p>
<form method="post"><input type="hidden" name="opslaan" value="1"><fieldset><legend>Hoe vaak?</legend>${radio}</fieldset><fieldset><legend>Waarover?</legend>${vink}</fieldset><button class="mv-k" type="submit">Opslaan</button></form>
<form method="post" class="mv-af"><input type="hidden" name="af" value="1"><button class="mv-l" type="submit">Afmelden met één klik</button></form>
<p class="mv-s">Vragen of een cadeauvraag? Antwoord gewoon op een mail van ons${cfg.wa ? `, of app Henkjan: <a href="https://wa.me/${esc(cfg.wa)}">+${esc(cfg.wa)}</a>` : ''}.</p></div>`;
}
export const VOORKEUR_CSS = `.mv{max-width:560px}.mv h1{font-size:30px;line-height:1.2;margin:0 0 10px}.mv p{font-size:16px;line-height:1.5}.mv fieldset{border:1px solid ${ZW.rand};border-radius:12px;padding:12px 16px 6px;margin:18px 0}.mv legend{font-weight:700;font-size:18px;padding:0 6px}
.mv-o{display:flex;gap:10px;align-items:center;min-height:44px;font-size:16px;cursor:pointer}.mv-o input{width:22px;height:22px;accent-color:#000;margin:0}.mv-k{min-height:48px;border:0;border-radius:999px;background:#000;color:#fff;font:inherit;font-size:16px;font-weight:700;padding:0 26px;cursor:pointer}
.mv-k:focus-visible,.mv-l:focus-visible,.mv-o input:focus-visible{outline:3px solid #000;outline-offset:3px}.mv-af{margin:14px 0}.mv-l{border:0;background:none;color:#000;font:inherit;font-size:16px;text-decoration:underline;cursor:pointer;padding:10px 0;min-height:44px}
.mv-ok{border:2px solid #000;border-radius:12px;padding:12px 14px;font-weight:700}.mv-s{font-size:16px}.mv a{color:#000}`;
export function paginaHtml(cfg, titel, inhoud) { // losse pagina voor projecten zonder eigen site-opmaak
  return `<!doctype html><html lang="${esc(cfg.taal || 'nl')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(titel)} | ${esc(cfg.naam)}</title><style>body{margin:0;background:#fff;color:#000;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}main{max-width:600px;margin:0 auto;padding:32px 18px}${VOORKEUR_CSS}</style></head><body><main>${inhoud}<p class="mv-s">${esc(cfg.bedrijf || cfg.naam)}</p></main></body></html>`;
}

// ---------- mails ----------
function schil(cfg, { titel, voorkop, inhoud, voet }) {
  const F = '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif';
  return `<!doctype html><html lang="${esc(cfg.taal || 'nl')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(titel)}</title></head><body style="margin:0;padding:0;background:#ffffff"><span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(voorkop || '')}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:24px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #000000;border-radius:14px"><tr><td style="padding:22px 24px 0;font:700 18px/1 ${F};color:#000000">${cfg.logo ? `<img src="${esc(cfg.logo)}" width="28" height="28" alt="" style="vertical-align:middle;border-radius:7px;margin-right:8px">` : ''}${esc(cfg.naam)}</td></tr>
<tr><td style="padding:16px 24px 24px;font:16px/1.55 ${F};color:#000000">${inhoud}</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="padding:14px 24px 6px;font:13px/1.55 ${F};color:#000000">${voet}</td></tr></table></td></tr></table></body></html>`;
}
const knopHtml = (href, t) => `<a href="${esc(href)}" style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:999px">${esc(t)}</a>`;
const BEVESTIG_ZIN = { spaarkaart: 'Klik op de knop en de 3 zegels staan op je spaarkaart.', kerst: 'Klik op de knop en je krijgt op tijd de laatste besteldag voor kerst.', naam: 'Klik op de knop en je hoort als eerste van producten met een naam erop.', advies: 'Klik op de knop en je kunt ons daarna per mail om cadeauadvies vragen.', verzending: 'Klik op de knop en je eerste bestelling wordt gratis verzonden.', weekbrief: 'Klik op de knop en je krijgt de nieuwe keuzehulpen en cadeautips, standaard hooguit één mail per week.' };
function mailBevestig(cfg, link, belofte) {
  return schil(cfg, { titel: 'Bevestig je aanmelding bij ' + cfg.naam, voorkop: 'Eén klik om te bevestigen.',
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Bevestig je aanmelding</h1><p style="margin:0 0 20px">${esc(BEVESTIG_ZIN[belofte] || 'Klik op de knop om je aanmelding te bevestigen.')} Hoe vaak en waarover kies je daarna zelf.</p><p style="margin:0 0 22px">${knopHtml(link, 'Ja, meld me aan')}</p><p style="margin:0;font-size:14px">Heb je je niet aangemeld? Dan hoef je niets te doen. Zonder bevestiging krijg je niets van ons en vervalt deze aanvraag na twee dagen.</p>`,
    voet: esc(cfg.bedrijf || cfg.naam) });
}
const tekstBevestig = (cfg, link, belofte) => (BEVESTIG_ZIN[belofte] || 'Bevestig je aanmelding bij ' + cfg.naam + '.') + '\n\nJa, meld me aan: ' + link + '\n\nNiet aangemeld? Dan hoef je niets te doen.\n\n' + (cfg.bedrijf || cfg.naam);
export async function voet(cfg, id, s, { reden = '' } = {}) {
  const vk = await voorkeurLink(cfg, id, s), af = url(cfg, 'af', s.af), ok = await ontvangKlaar(cfg);
  return `${esc(reden || 'Je krijgt deze mail omdat je je bij ' + cfg.naam + ' aanmeldde en je adres bevestigde.')} <a href="${esc(vk)}" style="color:#000000;font-weight:700">Kies hoe vaak en waarover</a> · <a href="${esc(af)}" style="color:#000000;font-weight:700">Afmelden met één klik</a><br><br>${esc(cfg.bedrijf || cfg.naam)}<br>${ok ? 'Vragen? Antwoord gewoon op deze mail.' : 'Vragen? Mail ' + esc(cfg.cc) + '.'}`;
}
export function lijstKop(cfg, af) { return { 'List-Unsubscribe': '<' + url(cfg, 'af', af) + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }; }

// Welkomstmail per belofte (mail 1, direct na bevestigen). Spaarkaart in twee zinnen (Henkjan: "Extreem korte uitleg").
async function welkom(cfg, id, s, belofte) {
  const vraagOk = await ontvangKlaar(cfg), vraag = vraagOk ? '<p style="margin:16px 0 0"><b>Voor wie zoek je iets?</b> Antwoord gewoon op deze mail, je krijgt binnen een paar minuten antwoord.</p>' : '';
  const gid = await gidsenVoor(cfg.id, {}).catch(() => []);
  const gl = gid.length ? '<p style="margin:16px 0 6px;font-weight:700">Begin hier</p>' + gid.map(g => `<p style="margin:0 0 8px"><a href="${esc(g.url.replace('utm_source=modal', 'utm_source=welkom'))}" style="color:#000000;font-weight:700">${esc(g.titel)}</a></p>`).join('') : '';
  let onderwerp = 'Welkom bij ' + cfg.naam, kop = 'Welkom', tekst = '';
  if (cfg.id === 'kadoly' && belofte === 'spaarkaart') {
    let stand = null; try { const SS = await import('./samensparen.js'); stand = await SS.ssModalStart({ mail: s.email, n: 3, naam: s.naam || '' }); if (stand && stand.mid) { s.ss = stand.mid; await KV.set(P(cfg, 'e:' + id), s); } } catch (e) {}
    if (!stand || !stand.ok) throw Error('spaarkaart niet vastgelegd');
    onderwerp = 'Je spaarkaart: 3 van de 5 zegels staan erop'; kop = '3 van de 5 zegels staan erop';
    tekst = `<p style="margin:0 0 12px">Je spaarkaart is gestart met 3 van de 5 zegels.</p><p style="margin:0 0 12px">Zo werkt het: elke bestelling bij Kadoly met dit e-mailadres geeft 1 zegel. Nog 2 bestellingen en je kaart is vol. Dan mailen we je en kies je een cadeau uit onze spaarcadeaus, gratis.</p><p style="margin:0 0 12px">Dit is nieuw bij Kadoly en we testen het nu.</p><p style="margin:0">${knopHtml(cfg.winkel + '/shop?utm_source=welkom&utm_medium=owned&utm_campaign=spaarkaart', 'Naar de winkel')}</p>`;
  } else if (belofte === 'kerst') {
    const kd = await kerstDag(cfg), her = new Date(Date.parse(kd.dag + 'T12:00:00Z') - 2 * 864e5).toISOString().slice(0, 10);
    onderwerp = 'Je kerstherinnering staat klaar'; kop = 'We herinneren je op tijd';
    tekst = `<p style="margin:0 0 12px">Op ${esc(datumNl(her))} krijg je één mail: de laatste dag om voor kerst te bestellen is volgens onze planning <b>${esc(datumNl(kd.dag))}</b>. Bij elk product staat de verwachte bezorgdatum; die gaat voor.</p>`;
  } else if (belofte === 'naam') {
    onderwerp = 'Je hoort het als eerste'; kop = 'Producten met een naam erop';
    tekst = '<p style="margin:0 0 12px">Zodra er bij Kadoly iets nieuws komt dat je met een naam kunt laten maken (graveren, kraamcadeau, sterrenkaart), krijg je een mail. Niet vaker dan dat.</p>';
  } else if (belofte === 'advies') {
    onderwerp = 'Waar zoek je een cadeau voor?'; kop = 'Vraag het ons gewoon';
    tekst = '<p style="margin:0 0 12px">Antwoord op deze mail met voor wie je iets zoekt, je budget en de gelegenheid. Je krijgt binnen een paar minuten drie ideeën uit de winkel, met prijs en link. Henkjan leest mee.</p>';
  } else if (belofte === 'verzending') {
    let hoe = ''; try { hoe = String((await KV.get('mm:motor:' + cfg.id + ':verzendtekst')) || ''); } catch (e) {}
    onderwerp = 'Je eerste bestelling: gratis verzending'; kop = 'Gratis verzending op je eerste bestelling';
    tekst = `<p style="margin:0 0 12px">${esc(hoe || 'De verzending van je eerste bestelling is gratis; je ziet het op de afrekenpagina voordat je betaalt.')}</p><p style="margin:0">${knopHtml(cfg.winkel + '/shop?utm_source=welkom&utm_medium=owned&utm_campaign=verzending', 'Naar de winkel')}</p>`;
  } else {
    onderwerp = 'Welkom: zo werkt je mail van ' + cfg.naam; kop = 'Gelukt, je bent aangemeld';
    tekst = `<p style="margin:0 0 12px">Je krijgt de nieuwe keuzehulpen en cadeautips${s.freq === 'week' ? ', hooguit één mail per week en alleen als er iets nieuws is' : ''}. Hoe vaak en waarover kies je zelf met de link onderaan.</p>`;
  }
  const html = schil(cfg, { titel: onderwerp, voorkop: onderwerp, inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">${esc(kop)}</h1>${tekst}${vraag}${belofte === 'spaarkaart' ? '' : gl}`, voet: await voet(cfg, id, s) });
  await stuur(cfg, [{ to: [s.email], subject: onderwerp, html, headers: lijstKop(cfg, s.af) }], cfg.id + '-welkom-' + id + '-' + belofte);
  await tel(cfg, 'welkom|' + belofte);
}
async function naBevestig(cfg, id, s, belofte) { await welkom(cfg, id, s, belofte); }

// ---------- dagronde (Kadoly: vanuit lib/kadoly-nieuws.js ronde, elke dag) ----------
const NAAM_RE = /graveer|gegraveerd|gepersonaliseerd|personaliseer|met (je |jouw |eigen )?naam|naamketting|naambord|sterrenkaart|geboortebord|kraamcadeau|custom name|engrav/i;
export async function dagRonde(p, { droog = false } = {}) {
  const cfg = await project(p); if (!cfg) return { ok: false };
  const uit = { kerst: 0, naam: 0, spaarVol: 0, fouten: [] }, nu = Date.now(), dagNu = dagNL();
  try { uit.ontvangKlaar = await ontvangCheck(cfg); } catch (e) { uit.fouten.push('ontvang ' + String(e.message || e).slice(0, 60)); }
  if (!(await mailKlaar(cfg))) return { ...uit, mail: 'niet klaar' };
  const ids = (await KV.raw(['SMEMBERS', P(cfg, 'emails')]).catch(() => [])) || [];
  const kd = await kerstDag(cfg), kerstHer = new Date(Date.parse(kd.dag + 'T12:00:00Z') - 2 * 864e5).toISOString().slice(0, 10);
  let nieuwNaam = [];
  if (cfg.id === 'kadoly') { try { const cat = await KV.get(cfg.catalogus); const na = N(await KV.get('mt:' + cfg.id + ':naamAt')) || nu - 7 * 864e5;
    nieuwNaam = ((cat && cat.items) || []).filter(i => i && i.vr !== false && NAAM_RE.test(String(i.t || '')) && N(i.l) > na).slice(0, 6); } catch (e) {} }
  for (const id of ids.slice(0, 3000)) { try {
    const s = await KV.get(P(cfg, 'e:' + id)); if (!s || !s.actief) continue; const bel = s.beloftes || [s.belofte];
    // kerst: twee dagen voor de laatste besteldag, één keer per jaar, voor wie dat vroeg of kerst aan heeft
    if (dagNu === kerstHer && (bel.includes('kerst') || wilOnderwerp(s, 'kerst')) && magMailen(s, 'herinnering') && await KV.raw(['SET', P(cfg, 'kerst:' + id + ':' + kd.dag.slice(0, 4)), '1', 'NX', 'EX', String(60 * 86400)])) {
      if (!droog) await stuur(cfg, [{ to: [s.email], subject: 'Laatste besteldag voor kerst: ' + datumNl(kd.dag), html: schil(cfg, { titel: 'Kerst', voorkop: 'Nog op tijd voor kerst', inhoud: `<h1 style="font-size:24px;margin:0 0 12px">Nog op tijd voor kerst</h1><p style="margin:0 0 14px">De laatste dag om bij ${esc(cfg.naam)} te bestellen voor kerst is volgens onze planning <b>${esc(datumNl(kd.dag))}</b>. Kijk bij elk product naar de verwachte bezorgdatum; die gaat voor.</p><p>${knopHtml(cfg.host + '/kerstcadeau?utm_source=kerstmail&utm_medium=owned', 'Kerstcadeaus bekijken')}</p>`, voet: await voet(cfg, id, s, { reden: 'Je vroeg om deze herinnering.' }) }), headers: lijstKop(cfg, s.af) }], cfg.id + '-kerst-' + id + '-' + kd.dag);
      uit.kerst++; }
    // producten met naam: hooguit één mail per week, alleen met echt nieuwe producten
    if (nieuwNaam.length && (bel.includes('naam') || wilOnderwerp(s, 'naam')) && magMailen(s, bel.includes('naam') ? 'herinnering' : 'week') && nu - N(s.naamMail) > 6 * 864e5) {
      if (!droog) { await stuur(cfg, [{ to: [s.email], subject: nieuwNaam.length === 1 ? 'Nieuw met naam: ' + String(nieuwNaam[0].t).slice(0, 60) : nieuwNaam.length + ' nieuwe producten met een naam erop', html: schil(cfg, { titel: 'Nieuw met naam', voorkop: 'Je vroeg om dit als eerste te horen', inhoud: '<h1 style="font-size:24px;margin:0 0 12px">Nieuw: met een naam erop</h1>' + nieuwNaam.map(i => `<p style="margin:0 0 10px"><a href="${esc(cfg.winkel + '/product/' + i.id + '?utm_source=naammail&utm_medium=owned')}" style="color:#000000;font-weight:700">${esc(i.t)}</a></p>`).join(''), voet: await voet(cfg, id, s, { reden: 'Je vroeg om dit als eerste te horen.' }) }), headers: lijstKop(cfg, s.af) }], cfg.id + '-naam-' + id + '-' + dagNu); s.naamMail = nu; await KV.set(P(cfg, 'e:' + id), s); }
      uit.naam++; }
    // spaarkaart vol: mail met de vraag welk cadeau, CC naar het project (Henkjan wisselt in tot de kassa het kan, OVERDRACHT-SAMEN-SPAREN.md)
    if (s.ss && !s.ssVol) { const m = await KV.get('ss:m:' + s.ss); if (m) { const SS = await import('./samensparen.js'); const st = SS.stand(m);
      if (st.kaarten >= 1) { if (!droog) { await stuur(cfg, [{ to: [s.email], cc: [cfg.cc], subject: 'Je spaarkaart is vol: kies je gratis cadeau', html: schil(cfg, { titel: 'Spaarkaart vol', voorkop: '5 van de 5 zegels', inhoud: `<h1 style="font-size:24px;margin:0 0 12px">5 van de 5 zegels: je cadeau is gratis</h1><p style="margin:0 0 12px">Antwoord op deze mail met welk cadeau je wilt uit de spaarcadeaus van één kaart, of vraag ons om een tip. Henkjan regelt het met je.</p>`, voet: await voet(cfg, id, s, { reden: 'Je doet mee met de spaarkaart-test van ' + cfg.naam + '.' }) }) }], cfg.id + '-spaarvol-' + id); s.ssVol = nu; await KV.set(P(cfg, 'e:' + id), s); await tel(cfg, 'spaarVol'); } uit.spaarVol++; } } }
  } catch (e) { uit.fouten.push(String(e.message || e).slice(0, 80)); } }
  if (!droog && nieuwNaam.length) await KV.set('mt:' + cfg.id + ':naamAt', nu).catch(() => {});
  if (!droog) await KV.set('mt:' + cfg.id + ':laatsteRonde', { ...uit, at: new Date().toISOString() }).catch(() => {});
  return uit;
}

// ---------- ontvangen (Resend receiving) ----------
export async function ontvangCheck(cfg) { // MX van receiving geverifieerd? (zet mt:<p>:ontvangklaar; pas dan vragen we mensen om te antwoorden)
  const key = await sleutel(); if (!key) return false; const H = { authorization: 'Bearer ' + key };
  const lijst = await (await fetch('https://api.resend.com/domains', { headers: H, signal: AbortSignal.timeout(8000) })).json(); const d = (lijst.data || []).find(x => x.name === cfg.domein); if (!d) return false;
  const v = await (await fetch('https://api.resend.com/domains/' + d.id, { headers: H, signal: AbortSignal.timeout(8000) })).json();
  const ok = (v.records || []).some(r => r.record === 'Receiving' && r.status === 'verified');
  await KV.set('mt:' + cfg.id + ':ontvangklaar', ok ? 1 : 0); return ok;
}
// Receiving aanzetten voor het verzenddomein, de webhook (email.received) naar de motor leggen en de DNS-records teruggeven die er moeten staan.
export async function ontvangAan(p, webhook = 'https://whichtobuy.best/api/mm/motorin') {
  const cfg = await project(p); if (!cfg) return { fout: 'project' };
  const key = await sleutel(); if (!key) return { fout: 'geen mailsleutel' }; const H = { authorization: 'Bearer ' + key, 'content-type': 'application/json' };
  const lijst = await (await fetch('https://api.resend.com/domains', { headers: H, signal: AbortSignal.timeout(8000) })).json(); const d = (lijst.data || []).find(x => x.name === cfg.domein);
  if (!d) return { fout: 'domein ' + cfg.domein + ' staat niet bij Resend' };
  const up = await fetch('https://api.resend.com/domains/' + d.id, { method: 'PATCH', headers: H, body: JSON.stringify({ capabilities: { sending: 'enabled', receiving: 'enabled' } }), signal: AbortSignal.timeout(8000) }); const upj = await up.json().catch(() => ({}));
  await fetch('https://api.resend.com/domains/' + d.id + '/verify', { method: 'POST', headers: H, signal: AbortSignal.timeout(8000) }).catch(() => null);
  const v = await (await fetch('https://api.resend.com/domains/' + d.id, { headers: H, signal: AbortSignal.timeout(8000) })).json();
  let hooks = null, gemaakt = null;
  try { const wr = await fetch('https://api.resend.com/webhooks', { headers: H, signal: AbortSignal.timeout(8000) }); const wj = await wr.json().catch(() => ({}));
    hooks = (wj.data || []).map(w => ({ id: w.id, endpoint: w.endpoint, events: w.events, status: w.status }));
    if (wr.ok && !hooks.some(w => String(w.endpoint || '').includes('/api/mm/motorin'))) { const cr = await fetch('https://api.resend.com/webhooks', { method: 'POST', headers: H, body: JSON.stringify({ endpoint: webhook, events: ['email.received'] }), signal: AbortSignal.timeout(8000) }); const cj = await cr.json().catch(() => ({})); gemaakt = cr.ok ? { id: cj.id } : { fout: cr.status + ' ' + String(cj.message || '').slice(0, 120) }; }
    else if (!wr.ok) hooks = { fout: wr.status + ' ' + String(wj.message || '').slice(0, 120) };
  } catch (e) { hooks = { fout: String(e && e.message || e).slice(0, 120) }; }
  const rec = (v.records || []).map(r => ({ soort: r.record, type: r.type, naam: r.name, waarde: r.value, prioriteit: r.priority, status: r.status }));
  const ok = rec.some(r => r.soort === 'Receiving' && r.status === 'verified'); await KV.set('mt:' + cfg.id + ':ontvangklaar', ok ? 1 : 0);
  return { domein: cfg.domein, patch: up.ok ? 'ok' : up.status + ' ' + String(upj.message || '').slice(0, 160), capabilities: v.capabilities, ontvangKlaar: ok, records: rec, nogInDns: rec.filter(r => r.status !== 'verified'), webhooks: hooks, webhookGemaakt: gemaakt };
}

// ---------- de antwoordmotor ----------
const KLACHT = /klacht|kapot|beschadigd|stuk\b|niet (ontvangen|geleverd|aangekomen|bezorgd)|waar blijft|retour|terugsturen|geld terug|terugbetal|annuleer|annuleren|verkeerd (product|artikel)|ontbreekt|bestelnummer|bestelling|order|track|pakket|factuur|oplichting|fraude/i;
const STOP_RE = /^\s*(stop|afmelden|uitschrijven|unsubscribe|geen mail meer)\b/i, MINDER_RE = /^\s*(minder|minder mail|minder vaak|pauze|even pauze)\b/i;
const zonderCitaat = t => { const r = String(t || '').replace(/\r/g, ''); const i = r.search(/\n(>|Op .{5,80} schreef|On .{5,80} wrote|-----Original|Van: |From: )/); return (i > 0 ? r.slice(0, i) : r).trim().slice(0, 3000); };
async function haalOntvangen(id) { const key = await sleutel(); if (!key || !id) return null; const r = await fetch('https://api.resend.com/emails/receiving/' + encodeURIComponent(id), { headers: { authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(10000) }).catch(() => null); return r && r.ok ? r.json() : null; }
async function kennis(cfg, vraag) { // feiten, gidsen en producten die bij de vraag passen; alleen dit mag de AI gebruiken
  const delen = [];
  if (cfg.id === 'kadoly') {
    try { const KC = await import('./kadolychat.js'), wv = N(await KV.get('mm:motor:kadoly:waar:verzending').catch(() => 0)) === 1; delen.push('FEITEN:\n- ' + KC.kadolyFeiten(wv).join('\n- ')); } catch (e) {}
    try { const L = await gidsLijst('kadoly'); const q = new Set(woorden(vraag)); const g = L.map(x => ({ x, s: [...x.w].filter(w => q.has(w)).length })).sort((a, b) => b.s - a.s).slice(0, 6).map(y => y.x);
      delen.push('GIDSEN (eerlijke keuzehulpen, link: ' + cfg.host + '/<slug>):\n' + g.map(x => '- ' + x.titel + ': ' + cfg.host + '/' + x.slug + ' (' + x.kort.slice(0, 140) + ')').join('\n')); } catch (e) {}
    try { const cat = await KV.get(cfg.catalogus); const q = woorden(vraag), bud = (String(vraag).match(/€\s?(\d{1,4})|(\d{1,4})\s?(euro|eur)/i) || []).slice(1).find(Boolean);
      const it = ((cat && cat.items) || []).filter(i => i && i.vr !== false && i.t).map(i => ({ i, s: woorden(i.t).filter(w => q.includes(w)).length, pr: Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100 })).filter(x => x.s > 0 && (!bud || x.pr <= N(bud))).sort((a, b) => b.s - a.s || N(b.i.sc) - N(a.i.sc)).slice(0, 8);
      if (it.length) delen.push('PRODUCTEN (prijs inclusief btw en verzending, levertijd in werkdagen):\n' + it.map(x => '- ' + x.i.t + ': €' + x.pr.toFixed(2).replace('.', ',') + (N(x.i.lt) ? ', ' + N(x.i.lt) + ' werkdagen' : '') + ', ' + cfg.winkel + '/product/' + x.i.id).join('\n')); } catch (e) {}
  } else if (cfg.kennis) delen.push('FEITEN:\n' + cfg.kennis);
  return delen.join('\n\n');
}
async function aiAntwoord(cfg, { vraag, onderwerp, label, naam }) {
  const { berichten, HAIKU } = await import('./ai.js'); const ken = await kennis(cfg, onderwerp + ' ' + vraag);
  const system = `Je beantwoordt namens ${cfg.naam} een mail van een klant of abonnee. Schrijf in het Nederlands, kort (hoogstens 120 woorden), warm en recht voor zijn raap, je-vorm, zonder gedachtestreepjes.
Gebruik ALLEEN de feiten, gidsen en producten hieronder. Verzin niets: geen kortingen, geen gratis dingen, geen levertijden of prijzen die er niet staan. Weet je iets niet, zeg dat Henkjan persoonlijk antwoordt (hij leest mee).
Bij een cadeauvraag: noem twee of drie producten of gidsen uit de lijst met hun link. ${label === 'aandacht' ? 'Dit gaat over een bestelling, retour of klacht: toon begrip, noem wat de feiten zeggen (bijvoorbeeld retour binnen 14 dagen) en zeg dat Henkjan het vandaag persoonlijk oppakt; beloof geen uitkomst.' : ''}
Geen aanhef met "Beste klant". Begin met ${naam ? '"Hoi ' + naam + '," ' : '"Hoi,"'} en sluit af met "Groet, ${cfg.antwoordNaam || cfg.naam}". Alleen de tekst van de mail, geen onderwerpregel.

${ken}`;
  const r = await berichten({ fn: 'antwoordmotor-' + cfg.id, model: HAIKU, system, user: 'Onderwerp: ' + onderwerp + '\n\nMail:\n' + vraag, max: 450, timeout: 25000, check: t => t && t.length > 20 && !/korting(scode)?\b|gratis verzending/i.test(t.replace(/geen korting/gi, '')) });
  const t = String(r && r.txt || '').trim(); if (!t || /korting(scode)?\b/i.test(t.replace(/geen korting/gi, ''))) throw Error('geen bruikbaar antwoord');
  return t;
}
const masker = a => { const [u, d] = String(a || '').split('@'); return (u || '').slice(0, 2) + '***@' + (d || ''); };
export async function mailIn(payload, { haal = haalOntvangen, ai = aiAntwoord, stuurF = stuur } = {}) {
  const d = (payload && payload.data) || {}; if (!payload || payload.type !== 'email.received') return { ok: true, overgeslagen: payload && payload.type };
  const aan0 = [].concat(d.to || [], d.cc || []).map(kaal), mid = String(d.email_id || d.id || '').replace(/[^a-z0-9-]/gi, '').slice(0, 60);
  let cfg = null; for (const p of Object.keys(PROJECTEN).concat(await (async () => { try { return ((await KV.raw(['SMEMBERS', 'mm:motoren'])) || []).map(String); } catch (e) { return []; } })())) { const c = await project(p); if (c && c.domein && aan0.some(a => a.endsWith('@' + c.domein))) { cfg = c; break; } }
  if (!cfg) return { ok: true, nietVoorMotor: true };
  if (!mid) return { ok: false, waarom: 'geen id' };
  if ((await KV.raw(['SET', 'mt:in:' + mid, '1', 'NX', 'EX', String(7 * 86400)]).catch(() => 'OK')) !== 'OK') return { ok: true, waarom: 'al-gedaan' };
  const m = await haal(mid); if (!m) { await KV.raw(['DEL', 'mt:in:' + mid]).catch(() => {}); return { ok: false, waarom: 'niet-op-te-halen' }; }
  const van = kaal(m.from), naamVan = (String(m.from || '').match(/^\s*"?([^"<@]{2,40})"?\s*</) || [])[1], onderwerp = String(m.subject || '').replace(/^(re|aw|antw|fwd?):\s*/i, '').slice(0, 140);
  const kop = JSON.stringify(m.headers || '').toLowerCase(), ruw = zonderCitaat(m.text || String(m.html || '').replace(/<(br|\/p|\/div)[^>]*>/gi, '\n').replace(/<blockquote[\s\S]*$/i, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'));
  const log = async x => { try { await KV.raw(['LPUSH', 'mt:log:' + cfg.id, JSON.stringify({ t: new Date().toISOString(), van: masker(van), onderwerp: onderwerp.slice(0, 80), ...x })]); await KV.raw(['LTRIM', 'mt:log:' + cfg.id, 0, 299]); } catch (e) {} };
  if (!okMail(van) || /mailer-daemon|postmaster|no-?reply|bounce/i.test(van) || /auto-submitted":"auto|auto-generated|auto-replied|x-autoreply|x-autorespond/.test(kop) || van.endsWith('@' + cfg.domein)) { await tel(cfg, 'in|automaat'); await log({ label: 'automaat' }); return { ok: true, waarom: 'automaat' }; }
  await tel(cfg, 'in');
  // abonnee erbij zoeken: stop, minder en pauze direct uitvoeren (onderzoek regel 29)
  const id = idVan(cfg, van), s = await KV.get(P(cfg, 'e:' + id)).catch(() => null); let label = KLACHT.test(onderwerp + ' ' + ruw) ? 'aandacht' : 'vraag', tekst = '';
  if (s && STOP_RE.test(ruw)) { await afmelden(cfg.id, s.af); s.actief = false; label = 'stop'; tekst = 'Hoi,\n\nGedaan: je krijgt geen mail meer van ' + cfg.naam + '. Toch weer aanmelden kan altijd via een gids op ' + cfg.host.replace('https://', '') + '.\n\nGroet, ' + (cfg.antwoordNaam || cfg.naam); }
  else if (s && MINDER_RE.test(ruw)) { s.freq = /pauze/i.test(ruw) ? 'pauze30' : 'maand'; if (s.freq === 'pauze30') { s.pauzeTot = Date.now() + 30 * 864e5; s.freqVoor = 'maand'; } await KV.set(P(cfg, 'e:' + id), s); label = 'minder'; tekst = 'Hoi,\n\nGedaan: ' + (s.freq === 'pauze30' ? 'je krijgt 30 dagen geen mail, daarna hooguit één per maand.' : 'je krijgt voortaan hooguit één mail per maand.') + ' Zelf aanpassen kan altijd: ' + await voorkeurLink(cfg, id, s) + '\n\nGroet, ' + (cfg.antwoordNaam || cfg.naam); }
  // grenzen: hoogstens 5 AI-antwoorden per afzender per dag en 200 per project per dag; daarboven alleen naar de mens (CC)
  const rl = N(await KV.incr('mt:rl:' + cfg.id + ':' + h(van).slice(0, 16) + ':' + dagNL()).catch(() => 0)), tot = N(await KV.incr('mt:tot:' + cfg.id + ':' + dagNL()).catch(() => 0));
  await KV.raw(['EXPIRE', 'mt:tot:' + cfg.id + ':' + dagNL(), String(2 * 86400)]).catch(() => {}); await KV.raw(['EXPIRE', 'mt:rl:' + cfg.id + ':' + h(van).slice(0, 16) + ':' + dagNL(), String(2 * 86400)]).catch(() => {});
  const t0 = Date.now(); let viaAi = false;
  if (!tekst && rl <= 5 && tot <= 200) { try { tekst = await ai(cfg, { vraag: ruw || onderwerp, onderwerp, label, naam: (s && s.naam) || (naamVan ? naamVan.trim().split(/\s+/)[0] : '') }); viaAi = true; } catch (e) { await tel(cfg, 'in|aiFout'); } }
  if (!tekst) tekst = 'Hoi,\n\nDank je voor je mail. Henkjan leest hem en antwoordt je persoonlijk, uiterlijk de volgende werkdag.\n\nGroet, ' + (cfg.antwoordNaam || cfg.naam);
  const eerlijk = viaAi ? '<p style="margin:14px 0 0;font-size:14px">Dit antwoord schreef de AI-assistent van ' + esc(cfg.naam) + ', alleen met onze eigen gegevens. Henkjan krijgt een kopie en leest mee; klopt er iets niet, antwoord dan gewoon.</p>' : '';
  const html = schil(cfg, { titel: 'Re: ' + onderwerp, voorkop: tekst.slice(0, 90), inhoud: tekst.split(/\n{2,}/).map(a => '<p style="margin:0 0 12px">' + esc(a).replace(/\n/g, '<br>').replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" style="color:#000000;font-weight:700">$1</a>') + '</p>').join('') + eerlijk + '<p style="margin:18px 0 0;font-size:14px;border-left:3px solid #000000;padding-left:10px">' + esc(ruw.slice(0, 600)).replace(/\n/g, '<br>') + '</p>', voet: esc(cfg.bedrijf || cfg.naam) + (s && s.actief ? '<br><a href="' + esc(await voorkeurLink(cfg, id, s)) + '" style="color:#000000">Kies hoe vaak en waarover je mail krijgt</a>' : '') });
  const msgId = (String(kop).match(/"message-id":"([^"]+)"/) || [])[1] || d.message_id || '';
  const merk = label === 'aandacht' ? '[AANDACHT: bestelling, retour of klacht] ' : '';
  try {
    await stuurF(cfg, [{ to: [van], cc: [cfg.cc], subject: 'Re: ' + onderwerp.slice(0, 120), html, text: tekst, headers: { ...(msgId ? { 'In-Reply-To': msgId, References: msgId } : {}), ...(merk ? { 'X-Kadoly-Label': label } : {}) } }], cfg.id + '-antwoord-' + mid);
    if (merk) await stuurF(cfg, [{ to: [cfg.cc], subject: merk + onderwerp.slice(0, 100), html: schil(cfg, { titel: 'Aandacht', voorkop: 'Pak dit vandaag op', inhoud: `<p style="margin:0 0 12px"><b>Aandacht nodig</b>: ${esc(masker(van))} schreef over een bestelling, retour of klacht. De AI antwoordde al (kopie in je inbox); pak het vandaag persoonlijk op.</p><p style="margin:0 0 12px;border-left:3px solid #000000;padding-left:10px">${esc(ruw.slice(0, 1500)).replace(/\n/g, '<br>')}</p>`, voet: 'Antwoordmotor ' + esc(cfg.naam) }), headers: { 'Reply-To': van } }], cfg.id + '-aandacht-' + mid);
    await tel(cfg, 'antwoord'); await tel(cfg, 'antwoord|' + label); if (viaAi) await tel(cfg, 'antwoord|ai');
  } catch (e) { await tel(cfg, 'in|verstuurFout'); await log({ label, ok: false, fout: String(e.message || e).slice(0, 80) }); return { ok: false, waarom: 'versturen' }; }
  await log({ label, ok: true, ai: viaAi, ms: Date.now() - t0, abonnee: !!s });
  if (s && s.mid) { try { const M = await import('./modal.js'); await M.modalUitkomst(KV, s.mid, 'contact'); } catch (e) {} }
  if (s) { s.antwoorden = N(s.antwoorden) + 1; s.laatsteVraag = Date.now(); if (s.actief) await KV.set(P(cfg, 'e:' + id), s).catch(() => {}); }
  // POST-lus (skill mail-lerend: "alle mail moet altijd eerst langs iets"): elk antwoord gemeld als verstuurde klantmail, privé (geen adres in het werklog)
  try { const PL = await import('./postlus.js'); await PL.meld({ project: cfg.id, doel: 'Vraag van een klant of abonnee beantwoorden (antwoordmotor)', aan: van, soort: 'klant', taal: cfg.taal || 'nl', onderwerp: 'Re: ' + onderwerp.slice(0, 120), variant: viaAi ? 'ai' : 'vast', status: 'verstuurd', wie: 'antwoordmotor', prive: true }); } catch (e) {}
  return { ok: true, label, ai: viaAi };
}

// ---------- controle en stand (CLAUDE.md "Nooit vastlopen": meten of het werkt, met een drempel) ----------
export async function stand(p, kv = KV) {
  const cfg = await project(p); if (!cfg) return { ok: false, fout: 'onbekend project' };
  const M = await import('./modal.js'), sites = [];
  for (const site of cfg.sites || []) { const m = await M.leesModal(kv, site, true); if (!m) { sites.push({ site, bestaat: false }); continue; } const st = await M.modalStand(kv, m, 7);
    const som = k => [...st].reduce((s, x) => s + N(x[k]), 0); sites.push({ site, aan: !m.uit, beslissingen: som('n'), getoond: som('toon'), klik: som('klik'), contact: som('contact'), aanmeldingen: som('aanmelding'), bevestigd: som('bevestigd'), koop: som('koop'), gesloten: som('sluit'),
      perArm: [...st].filter(x => x.n).map(x => ({ id: x.id, n: x.n, toon: x.toon, klik: x.klik, aanmelding: x.aanmelding, bevestigd: x.bevestigd, sluit: x.sluit })), rem: m.rem || {}, factoren: Object.fromEntries(Object.entries(st.factoren || {}).map(([f, l]) => [f, l.map(x => ({ waarde: x.waarde, n: x.n, toon: x.toon, klik: x.klik, aanmelding: x.aanmelding }))])), facLeer: m.facLeer || {} }); }
  const t = await tellers(cfg, 7), w = await waarStand(kv), abonnees = N(await kv.raw(['SCARD', cfg.prefix + ':emails']).catch(() => 0));
  const uit = { ok: true, project: cfg.id, at: new Date().toISOString(), mailKlaar: await mailKlaar(cfg), ontvangKlaar: await ontvangKlaar(cfg), abonnees, beloftesWaar: Object.fromEntries(Object.entries(w).filter(([k]) => (BELOFTES[cfg.id] || {})[k] !== undefined)), kerst: await kerstDag(cfg), tellers7d: t, sites, laatsteRonde: await kv.get('mt:' + cfg.id + ':laatsteRonde').catch(() => null) };
  try { uit.antwoorden = ((await kv.raw(['LRANGE', 'mt:log:' + cfg.id, 0, 9])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); } catch (e) {}
  // lekken met drempel; volgende oordeel = de volgende uurlijkse leerronde van Clickmind (modalLeer) en de dagronde
  const L = [], g = sites.filter(x => x.bestaat !== false);
  if (!uit.mailKlaar) L.push('Verzenddomein ' + cfg.domein + ' niet klaar: geen enkele e-mailbelofte wordt getoond.');
  if (!uit.ontvangKlaar) L.push('Antwoorden ontvangen staat nog niet aan (MX voor ' + cfg.domein + ' bij Resend receiving): antwoorden gaan zolang rechtstreeks naar ' + cfg.cc + ', de belofte advies wordt niet getoond.');
  for (const x of g) { if (x.aan === false) L.push(x.site + ': modal staat uit.');
    if (x.beslissingen >= 300 && x.getoond === 0) L.push(x.site + ': ' + x.beslissingen + ' beslissingen en 0 keer getoond (script of moment werkt niet).');
    if (x.getoond >= 300 && x.klik === 0 && x.aanmeldingen === 0) L.push(x.site + ': ' + x.getoond + ' keer getoond, 0 kliks en 0 aanmeldingen.');
    if (x.getoond >= 100 && x.gesloten / x.getoond > 0.7) L.push(x.site + ': ' + Math.round(x.gesloten / x.getoond * 100) + ' van de 100 klikken de modal weg (UX-rem grijpt per versie in).'); }
  if (N(t.aanvraag) >= 5 && !N(t.bevestigd)) L.push(N(t.aanvraag) + ' aanvragen in 7 dagen en 0 bevestigd: bevestigingsmail komt niet aan of overtuigt niet.');
  if (N(t.in) > N(t.antwoord) + N(t['in|automaat']) + 2) L.push(N(t.in) + ' mails binnen, ' + N(t.antwoord) + ' beantwoord: kijk mt:log:' + cfg.id + '.');
  uit.lekken = L; uit.oordeel = L.length ? 'let op' : 'werkt'; uit.volgendeOordeel = 'elk uur (leerronde Clickmind) en dagelijks 17:47 UTC (dagronde)';
  return uit;
}

// ---------- de modal-sjablonen per site (naar kv met /api/mm/motorbeheer?p=kadoly&zet=1; de geleerde stand blijft staan) ----------
const KLEIN = 'Eerst bevestigen, dan pas mail. Hoe vaak en waarover kies je zelf. Afmelden met één klik.';
const ZWART = { knop: '#000000', knopTekst: '#ffffff', kaart: '#ffffff', tekst: '#000000', zacht: '#000000', rand: '#000000', font: 'Inter', ronding: 14, kant: 'rechts', balkPlek: 'onder', logo: 'https://cdn.kadoly.com/icon/shop/apple-180.png?v=1' };
const MAILARMEN = paginas => [
  { id: 'm-spaar', soort: 'email', doel: 'kadoly', project: 'kadoly', belofte: 'spaarkaart', beeldSoort: 'zegels', titel: 'Spaar voor een gratis cadeau', tekst: 'Elke bestelling bij Kadoly geeft je 1 zegel. Bij 5 zegels is je kaart vol en krijg je een cadeau van ons. Meld je aan en je begint meteen met 3. Nieuw: we testen dit nu.', punten: ['Je begint met 3 van de 5 zegels', 'Elke bestelling bij Kadoly = 1 zegel', 'Kaart vol: je kiest een cadeau, gratis'], knop: 'Start met 3 zegels', vraag: 'Spaar je mee voor een gratis cadeau?', freqTekst: 'Hooguit één mail per week, zelf aan te passen.', nee: 'Nee, dank je', veld: 'Je e-mailadres', klein: KLEIN, dank: 'Bijna klaar: bevestig via de mail die we je net stuurden, dan staan je 3 zegels erop.', ...(paginas ? { paginas } : {}) },
  { id: 'm-week', soort: 'email', doel: 'kadoly', project: 'kadoly', belofte: 'weekbrief', titel: 'Nieuwe keuzehulpen en cadeautips in je mail', tekst: 'Elke week de eerlijke keuzehulpen die erbij kwamen, met cadeautips. Alleen als er iets nieuws is.', punten: ['Eerlijk: ook waarvoor iets niet past', 'Zelf kiezen: wekelijks, maandelijks of alleen acties', 'Antwoord op de mail voor persoonlijk advies'], knop: 'Stuur ze mij', vraag: 'Nieuwe keuzehulpen in je mail?', freqTekst: 'Standaard één mail per week, zelf aan te passen.', nee: 'Nee, dank je', veld: 'Je e-mailadres', klein: KLEIN, dank: 'Bijna klaar: bevestig via de mail die we je net stuurden.' },
  { id: 'm-kerst', soort: 'email', doel: 'kadoly', project: 'kadoly', belofte: 'kerst', titel: 'Op tijd voor kerst?', tekst: 'Wij mailen je één keer: de laatste dag om te bestellen zodat het voor kerst in huis is.', punten: ['Eén herinnering, geen reeks', 'Met de kerstgidsen erbij', 'Bezorgdatum per product blijft leidend'], knop: 'Herinner mij', vraag: 'Een herinnering voor kerst?', freqTekst: 'Eén mail, daarna niets tenzij je meer wilt.', nee: 'Nee, dank je', veld: 'Je e-mailadres', klein: KLEIN, dank: 'Bijna klaar: bevestig via de mail die we je net stuurden.' },
  { id: 'm-naam', soort: 'email', doel: 'kadoly', project: 'kadoly', belofte: 'naam', titel: 'Iets met een naam erop?', tekst: 'Graveren, een kraamcadeau of een sterrenkaart met naam: je hoort het als eerste als het er is.', knop: 'Laat het me weten', vraag: 'Als eerste horen van cadeaus met naam?', freqTekst: 'Alleen als er echt iets nieuws is.', nee: 'Nee, dank je', veld: 'Je e-mailadres', klein: KLEIN, dank: 'Bijna klaar: bevestig via de mail die we je net stuurden.' },
  { id: 'm-advies', soort: 'email', doel: 'kadoly', project: 'kadoly', belofte: 'advies', titel: 'Cadeauadvies per mail', tekst: 'Vertel voor wie en je budget. Je krijgt binnen een paar minuten drie ideeën uit de winkel, Henkjan leest mee.', knop: 'Vraag advies', vraag: 'Hulp bij een cadeau per mail?', freqTekst: 'Daarna hooguit één mail per week, zelf aan te passen.', nee: 'Nee, dank je', veld: 'Je e-mailadres', klein: KLEIN, dank: 'Bijna klaar: bevestig via de mail die we je net stuurden.' },
  { id: 'm-verz', soort: 'email', doel: 'kadoly', project: 'kadoly', belofte: 'verzending', titel: 'Gratis verzending op je eerste bestelling', tekst: 'Meld je aan en je eerste bestelling wordt gratis verzonden.', knop: 'Ja, graag', vraag: 'Gratis verzending op je eerste bestelling?', freqTekst: 'Daarna hooguit één mail per week, zelf aan te passen.', nee: 'Nee, dank je', veld: 'Je e-mailadres', klein: KLEIN, dank: 'Bijna klaar: bevestig via de mail die we je net stuurden.' }
];
const GEMEEN = { taal: 'nl', modus: 'leer', verken: 0.1, controle: 0.1, cap: 72, minSec: 6, zoekRustig: true, sluitRem: 0.7, project: 'kadoly', catalogus: false, claude: true, stijl: ZWART,
  momenten: ['tijd:8', 'tijd:12', 'tijd:25', 'scroll:30', 'scroll:50', 'pag:2', 'pag:3', 'stil:30', 'exit'],
  factoren: { grootte: ['s', 'm', 'l'], tekst: ['kort', 'normaal', 'lang'], beeld: ['geen', 'ja'], stap: ['direct', 'twee'], velden: ['1', '2'], bewijs: ['geen', 'echt'], freq: ['ja', 'nee'], herhaal: ['1', '3', '7'] },
  instructies: 'Kadoly is een Nederlandse webshop voor bijzondere spullen en cadeaus (ADSFAIR B.V.) met eerlijke keuzehulpen op gids.kadoly.com. Toon: warm, kort, gewone woorden, je-vorm. Beloof alleen wat de tekst van de versie al belooft; geen korting, prijzen of winacties.',
  nooit: ['/checkout', '/cart', '/winkelwagen', '/account', '/login', '/register', '/connect', '/chat', '/admin', '/seller', '/order', '/nieuws'] };
export const MODALS = {
  kadolygids: { ...GEMEEN, site: 'kadolygids', domeinen: ['kadoly.com'], uit: false, vormen: ['onder', 'hoek', 'balk', 'tab', 'midden'], remOp: 'hoofd',
    waarde: { hoofd: 2, klik: 3, veld: 0, typ: 1, echt: 0, actie: 0, aanmelding: 30, bevestigd: 150, mand: 8, kassa: 1, bewust: 20, koop: 800, verder: 1, contact: 20, open: 1 },
    notitie: 'Henkjan 25 nov 2026: lerende modal met chat, gidsen en e-mailbeloftes; gids.kadoly.com. Controlegroep 10%, zoekRustig (Google), UX-rem 70% sluiten.',
    armen: [{ id: 'geen', soort: 'geen', gewicht: 0, wie: 'alle' },
      { id: 'chat', soort: 'chat', corpus: 'site', voorbeeldAuto: true, project: 'kadoly', titel: 'Twijfel je nog?', tekst: 'Vraag het de cadeauhulp van Kadoly, je krijgt meteen antwoord.', knop: 'Vraag', veld: 'Typ je vraag', nee: 'Nee, dank je' },
      { id: 'gids', soort: 'gids', project: 'kadoly', url: 'https://gids.kadoly.com/?utm_source=modal&utm_medium=owned&utm_campaign=gidsdeur', titel: 'Dit lezen anderen ook', tekst: 'Eerlijke keuzehulpen die bij deze pagina passen.', knop: 'Alle keuzehulpen', nee: 'Nee, dank je' },
      ...MAILARMEN()] },
  kadoly: { ...GEMEEN, site: 'kadoly', domeinen: ['kadoly.com'], uit: false, vormen: ['midden', 'onder', 'hoek', 'balk', 'blok', 'tab'], remOp: 'mand', controle: 0.1,
    netArm: { pa: 'm-spaar', propeller: 'm-spaar' }, // 25 nov (Henkjan: "Zorg dan dat ze aanmelden via propads !!!"): PropellerAds-bezoekers kopen niet, ze krijgen de spaarkaart (3 van 5 zegels)
    waarde: { hoofd: 0, klik: 0, veld: 0, typ: 1, echt: 0, actie: 0, aanmelding: 30, bevestigd: 150, mand: 8, kassa: 1, bewust: 20, koop: 800, verder: 1, contact: 20, open: 1 },
    notitie: 'Henkjan 10 nov: "Ja bouw en zet aan mail komt er aan"; 11 nov chatversie (vraag) met WhatsApp naar zijn eigen nummer; 25 nov: lerende modal met chat, gidsen en e-mailbeloftes (lib/modalmotor.js). Leert op de trechter en op bevestigde aanmeldingen; controlegroep 10%, rem op mand.',
    armen: [{ id: 'geen', soort: 'geen', gewicht: 0, wie: 'alle' },
      { id: 'zeker', soort: 'knop', paginas: ['product'], waarAls: 'verzending', titel: 'Zo bestel je zonder zorgen', tekst: 'Gratis verzending bij je eerste bestelling. 14 dagen gratis retour. Betalen met iDEAL of PayPal.', zonderWaar: { tekst: 'De verzending zit in de prijs, bij de kassa komt er niets bij. 14 dagen gratis retour. Betalen met iDEAL of PayPal.' }, knop: 'Bestellen', nee: 'Ik kijk nog even', doelKnop: 'koop' },
      { id: 'twijfel', soort: 'knop', paginas: ['product'], titel: 'Niet helemaal wat je zoekt?', tekst: 'Kijk wat anderen kozen die dit ook bekeken.', knop: 'Laat zien', nee: 'Nee, dank je', doelKnop: 'ookgekozen' },
      { id: 'klaar', soort: 'knop', wie: 'kassa', titel: 'Je keuze staat nog klaar', tekst: 'Afrekenen duurt een halve minuut, met iDEAL of PayPal.', knop: 'Verder met afrekenen', nee: 'Nu niet', doelKnop: 'kassa' },
      { id: 'vraag', soort: 'chat', corpus: 'kadoly', wa: '31655395630', voorbeeldAuto: true, project: 'kadoly', titel: 'Twijfel je nog ergens over?', tekst: 'Vraag het ons, je krijgt meteen antwoord.', knop: 'Stuur', nee: 'Nee, dank je', veld: 'Typ je vraag' },
      { id: 'vraagblok', soort: 'chat', corpus: 'kadoly', wa: '31655395630', paginas: ['product'], vorm: 'blok', plek: 'product', titel: 'Vragen over dit product?', tekst: 'Stel ze hier, je krijgt meteen antwoord. Of app ons direct.', knop: 'Stuur', nee: 'Sluiten', veld: 'Typ je vraag' },
      { id: 'gids', soort: 'gids', project: 'kadoly', url: 'https://gids.kadoly.com/?utm_source=modal&utm_medium=owned&utm_campaign=gidsdeur-shop', titel: 'Hulp bij kiezen', tekst: 'Eerlijke keuzehulpen van Kadoly die hierbij passen.', knop: 'Alle keuzehulpen', nee: 'Nee, dank je' },
      { id: 'ideeenblok', soort: 'email', doel: 'kadoly', project: 'kadoly', belofte: 'weekbrief', paginas: ['product'], vorm: 'blok', plek: 'product', titel: 'Nog even nadenken?', tekst: 'Nieuwe cadeau-ideeën van Kadoly in je mail. Hoe vaak kies je zelf.', knop: 'Stuur ze mij', nee: 'Sluiten', lijst: 'kadoly', veld: 'Je e-mailadres', klein: KLEIN, dank: 'Bijna klaar: bevestig je aanmelding via de mail die we je net stuurden.' },
      ...MAILARMEN()] }
};
export async function zetModals(p) { // sjablonen naar kv (lib/modal.js bewaarModal houdt de geleerde stand vast)
  const cfg = await project(p); if (!cfg) return { ok: false, fout: 'project' }; const M = await import('./modal.js'), uit = [];
  for (const site of cfg.sites || []) { const t = MODALS[site]; if (!t) { uit.push({ site, fout: 'geen sjabloon' }); continue; }
    const r = await M.bewaarModal(KV, t); uit.push({ site, ok: r.ok, fout: r.fout, versie: r.modal && r.modal.versie, armen: r.modal && r.modal.armen.map(a => a.id) }); }
  try { await KV.raw(['SADD', 'mm:motoren', cfg.id]); } catch (e) {}
  return { ok: uit.every(x => x.ok), uit };
}
export const _test = { idVan, magMailen, gidsOnderwerpen, zonderCitaat, KLACHT, STOP_RE, MINDER_RE, MAILARMEN, kaal };
