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
// - Doel dichterbij (Henkjan 22 nov: "hoe krijgen we doel dichterbij ? door eenvoudige inspanning van hen"): twee startzegels, één bij aanmelden
//   en één als de eerste persoon via jou meespaart (Nunes en Drèze 2006: kaart van 10 met 2 al gestempeld 34% vol, kaart van 8 leeg 19%).
//   Ze tellen alleen mee voor een volle kaart, dus ze kosten pas iets als er minstens (kaart - 2) echte aankopen achter zitten.
//   Op de kaart staat "Begin met 3 mensen" tot er 3 via jou sparen (LivingSocial Me+3).
// - Berichten (Henkjan 22 nov: "bericht zet aan"): welkomstmail met de link naar je kaart, en een mail bij elke zegel. Zegelmails pas nadat je
//   één keer op de link in je mail klikte (adres bevestigd), met afmelden in één klik. Elke link via Clickmind (op=ss&go=, net mail, campagne samensparen).
// - Concept tot LIVE = true: alleen op de beschermde host. Inwisselen in de kassa volgt.
// - Controle: /api/gids?op=ss&stand=1 (beschermd) met lekken en drempels.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';

export const LIVE = false;
const ZEGEL = 1, VRIJ_DAGEN = 14, UITNODIG_DOEL = 3;
const BASE = () => (LIVE ? 'https://gids.kadoly.com' : 'https://hjdk-api-henq.vercel.app') + '/api/gids?op=ss';
const DOELEN = ['oc_4173959362543617', 'oc_4174005866250241', 'oc_4174004744241153', 'oc_4173958884671489']; // scheerkwast, kaarsenset, geurkaars, plantenset
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const h = s => createHash('sha256').update(String(s)).digest('hex');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = x => '€' + (Math.round(N(x) * 100) / 100).toFixed(2).replace('.', ',').replace(',00', '');
const schoon = (v, n) => String(v || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const dagNL = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
async function tel(wat, n = 1) { try { const k = 'ss:tel:' + dagNL(); await kv.raw(['HINCRBY', k, wat, String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); } catch (e) {} }
async function cat() { let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {} const m = {}; for (const i of (c && c.items) || []) if (i && i.id) m[i.id] = i; return m; }
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
const zegelsVoor = i => Math.ceil(thuis(i) / ZEGEL);
const lees = async k => { try { return await kv.get(k); } catch (e) { return null; } };
const zet = (k, v) => kv.set(k, v, { ex: 400 * 86400 }).catch(() => {});
function stand(m, C, nu = Date.now()) { const i = C[m.doel] || null, nodig = i ? zegelsVoor(i) : 40, z = m.zegels || []; const vrij = z.filter(x => x.vrij <= nu).length; return { i, nodig, vrij: Math.min(vrij, nodig), wacht: z.length - vrij, vol: vrij >= nodig }; }

// ---------- mail (via de Kadoly-afzender van lib/kadoly-nieuws.js) ----------
const goUrl = (m, w) => BASE() + '&go=' + w + '&m=' + m.id + '&k=' + m.k;
function balk(n, van) { const p = Math.max(2, Math.min(100, Math.round(n / Math.max(1, van) * 100))); return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1.5px solid #111113;border-radius:999px;border-collapse:separate"><tr><td width="${p}%" style="background:#111113;height:12px;border-radius:999px;font-size:0;line-height:0">&nbsp;</td><td style="font-size:0;line-height:0">&nbsp;</td></tr></table>`; }
export function mailInhoud(KN, m, soort, x = {}) {
  const C = x.C || {}, s = stand(m, C), wat = s.i ? s.i.t : 'je cadeau', rest = Math.max(0, s.nodig - s.vrij);
  const voet = (af) => `Je krijgt deze mail omdat je bij Kadoly begon met samen sparen.${af ? ` <a href="${BASE()}&af=${m.id}&t=${m.af}" style="color:#0B0D12;font-weight:700">Geen bericht meer bij een zegel</a>` : ''}<br><br>Vragen? Antwoord op deze mail, of bel of app Henkjan van Kadoly: <a href="https://wa.me/31655395630" style="color:#0B0D12;font-weight:700">06 55395630</a>.<br><br>${esc(KN.KADOLY_BEDRIJF)}`;
  const kaart = `<p style="margin:0 0 6px;font-size:24px;font-weight:700">${s.vrij} van ${s.nodig} zegels</p><p style="margin:0 0 10px">voor ${esc(wat)}${s.wacht ? `, en ${s.wacht} ${s.wacht === 1 ? 'zegel komt' : 'zegels komen'} vrij na de retourtermijn van 14 dagen` : ''}.</p>${balk(s.vrij, s.nodig)}`;
  if (soort === 'welkom') return { onderwerp: 'Je spaarkaart bij Kadoly', html: KN.mailSchil({ titel: 'Je spaarkaart bij Kadoly', voorkop: `Je spaart voor ${wat}. Er staat al een zegel op.`,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">Je spaarkaart staat klaar, ${esc(m.naam)}</h1><p style="margin:0 0 16px">Koopt iemand die jij uitnodigde iets bij Kadoly, dan krijg jij een zegel van €1. Kaart vol, dan is je product gratis, ook de verzending. Je eerste zegel is cadeau.</p>${kaart}<p style="margin:0 0 18px">${KN.knop(goUrl(m, 'kaart'), 'Open je spaarkaart')}</p><p style="margin:0;font-size:14px">Bewaar deze mail: met de knop kom je altijd terug op je kaart. Na één klik krijg je ook een bericht bij elke nieuwe zegel.</p>`,
    voet: voet(false) }) };
  const start = !!x.start, van = esc(x.van || 'Iemand');
  const kop = s.vol ? 'Je kaart is vol' : 'Er komt een zegel van €1 op je kaart';
  const zin = start ? `${van} spaart nu via jou mee. Daarvoor krijg je een startzegel, meteen op je kaart. Koopt ${van} iets bij Kadoly, dan krijg jij er nog een.` : `${van} kocht iets bij Kadoly. Omdat jij ${van} uitnodigde, krijg jij een zegel van €1. Hij telt mee na de retourtermijn van 14 dagen.`;
  return { onderwerp: start ? `${x.van || 'Iemand'} spaart mee: een zegel voor jou` : `${x.van || 'Iemand'} kocht iets: een zegel voor jou`, html: KN.mailSchil({ titel: kop, voorkop: s.vol ? `Je ${wat} is gratis.` : `Nog ${rest} zegels voor ${wat}.`,
    inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">${kop}</h1><p style="margin:0 0 16px">${zin}</p>${kaart}<p style="margin:0 0 6px">${KN.knop(goUrl(m, 'kaart'), s.vol ? 'Bestel je cadeau gratis' : 'Bekijk je spaarkaart')}</p>`,
    voet: voet(true) }) };
}
async function mailNaar(m, soort, x = {}) {
  if (!m || !m.mail || !m.k || (soort === 'zegel' && (!m.ok || m.stil))) return false;
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
  if (m.door) { const d = await lees('ss:m:' + m.door); if (d) { d.zegels = (d.zegels || []).concat([{ t: nu, vrij: nu + VRIJ_DAGEN * 864e5, van: m.naam, o: String(order || '').slice(0, 40) }]).slice(-400); await zet('ss:m:' + d.id, d); naar = 'lid'; await tel('zegels'); await mailNaar(d, 'zegel', { van: m.naam, sleutel: order || nu }); } }
  else if (m.pt) { try { const { boekBestelling } = await import('./partner.js'); await boekBestelling('p-' + m.pt, { v, order, t: nu }); naar = 'partner'; await tel('partnerEuro'); } catch (e) {} }
  await tel('bestel');
  try { await kv.raw(['RPUSH', 'ss:log', JSON.stringify({ t: nu, m: mid, v: Math.round(N(v) * 100), naar })]); await kv.raw(['LTRIM', 'ss:log', '-2000', '-1']); } catch (e) {}
  return { ok: true, naar };
}

const CSS = `<style>.ss-k{border:1px solid #D7DCE8;border-radius:16px;padding:16px 18px;margin:0 0 14px}.ss-f{display:grid;gap:10px;max-width:520px}.ss-f input[type=text],.ss-f input[type=email]{min-height:48px;border:1.5px solid #111113;border-radius:12px;padding:10px 12px;font:inherit;background:#fff;color:#111113}.ss-d{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.ss-d label{border:1.5px solid #D7DCE8;border-radius:14px;padding:10px;cursor:pointer;display:grid;gap:2px}.ss-d label:has(input:checked){border-color:#111113;box-shadow:0 0 0 1.5px #111113}.ss-d input{position:absolute;opacity:0}.ss-kaart{border:2px solid #111113;border-radius:18px;padding:14px;margin:8px 0 12px}.ss-v{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:5px}.ss-v span{aspect-ratio:1;border:1.5px dashed #111113;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700}.ss-v span.vol{border-style:solid;background:#111113;color:#fff}.ss-v span.wacht{border-style:solid}.ss-tel{font-size:28px;font-weight:700;margin:8px 0 0}.ss-l{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.ss-l span{border:1.5px solid #111113;border-radius:999px;padding:2px 10px;font-weight:700;font-size:14px}.ss-wa{background:#1F8F4E!important;border-color:#1F8F4E!important;color:#fff!important}.ss-hp{position:absolute!important;left:-9999px!important}</style>`;

export async function ssOp({ req, res, q, host, ua, kaal, leesBody, isBot }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const beschermd = /\.vercel\.app$/i.test(host); if (!beschermd && !LIVE) return res.status(404).send('Niet gevonden');
  const base = (beschermd ? 'https://' + host : 'https://gids.kadoly.com') + '/api/gids?op=ss';
  const naar = u => { res.setHeader('location', u); return res.status(303).end(); };
  const pagina = (titel, x) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(kaal(titel, CSS + (LIVE ? '' : '<div class="ss-k"><p><b>Concept.</b> Dit staat nog niet op gids.kadoly.com; alleen jij ziet het hier.</p></div>') + x, '<script src="https://go.kadoly.com/cm.js" data-site="samensparen" async></script>')); };
  // dichtstbijzijnde doel eerst en voorgekozen (les LivingSocial Me+3: een doel dat binnen bereik ligt, wordt gedeeld)
  const C = await cat(); const doelen = DOELEN.map(p => C[p]).filter(i => i && i.vr !== false).sort((a, b) => zegelsVoor(a) - zegelsVoor(b)); const eerste = doelen[0] ? doelen[0].id : DOELEN[0];

  if (q.get('stand') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden');
    const som = {}; for (let i = 0; i < 14; i++) { const d = new Date(Date.now() - i * 864e5).toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' }); const a = await kv.raw(['HGETALL', 'ss:tel:' + d]).catch(() => []); for (let j = 0; j + 1 < (a || []).length; j += 2) som[a[j]] = N(som[a[j]]) + N(a[j + 1]); }
    const L = [];
    if (N(som.zie) >= 200 && !N(som.start)) L.push({ lek: 'niemand start', cijfers: som.zie + ' bezoekers, niemand begon', actie: 'kop en eerste scherm' });
    if (N(som.start) >= 20 && !N(som.mee)) L.push({ lek: 'niemand nodigt uit', cijfers: som.start + ' gestart, niemand kwam via een uitnodiging', actie: 'de knop en de tekst voor de groepsapp' });
    if (N(som.leden) >= 50 && !N(som.bestel)) L.push({ lek: 'leden kopen niet', cijfers: som.leden + ' leden, 0 bestellingen', actie: 'bericht en winkel; stuurt de kassa de e-mailvingerafdruk mee?' });
    if (N(som.mailNietKlaar) || N(som.mailFout)) L.push({ lek: 'mail gaat niet weg', cijfers: N(som.mailNietKlaar) + ' keer verzenddomein niet klaar, ' + N(som.mailFout) + ' fouten', actie: 'verzenddomein post.kadoly.com bij Resend en de mailsleutel' });
    if (N(som['mail-welkom']) >= 20 && !N(som.mailklik)) L.push({ lek: 'niemand opent de kaart uit de mail', cijfers: som['mail-welkom'] + ' welkomstmails, 0 kliks', actie: 'onderwerp en knop van de welkomstmail' });
    return res.status(200).json({ ok: true, live: LIVE, regel: 'één zegel van €1 per bestelling, voor wie de koper uitnodigde', laatste14: som, lekken: L }); }

  // ---------- link uit een mail: via Clickmind naar je kaart; de eerste klik bevestigt je adres ----------
  const go = String(q.get('go') || ''); if (go) { const m = /^[a-f0-9]{12}$/.test(String(q.get('m') || '')) ? await lees('ss:m:' + q.get('m')) : null, k = String(q.get('k') || '');
    if (!m || m.ak !== h(k)) return res.status(404).send('Niet gevonden');
    const voor = /prefetch|prerender/i.test(String(req.headers['sec-purpose'] || req.headers.purpose || '')) || req.method === 'HEAD';
    const cid = randomBytes(6).toString('hex'); let doel = base + '&m=' + m.id + '&k=' + k + '&mmc=' + cid;
    if (!voor && !isBot(ua)) { if (!m.ok) { m.ok = Date.now(); await zet('ss:m:' + m.id, m); } await tel('mailklik');
      try { const MM = await import('./mensmeter.js'); let mmp = (String(req.headers.cookie || '').match(/(?:^|;\s*)mmp=([0-9a-f]{16})/) || [])[1]; const nieuw = !mmp; if (nieuw) mmp = randomBytes(8).toString('hex');
        MM.laterAf(MM.verwerkKlik(kv, { cid, pid: mmp, nieuw, arm: '302', tag: '-', net: 'mail', camp: LIVE ? 'samensparen' : 'samensparen-test', zone: go.replace(/[^a-z]/g, '').slice(0, 12) || 'kaart', sub: '-', cr: 'mail', kw: '', doel, p: 'ss' }, MM.serverSignalen(req)).catch(() => {}));
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
    let door = '', pt = '';
    if (u && await lees('ss:m:' + u)) door = u; else { try { pt = await (await import('./partner.js')).ptUit(req, null); } catch (e) {} }
    const mid = randomBytes(6).toString('hex'), k = randomBytes(12).toString('hex'), nu = Date.now();
    const m = { id: mid, naam, mail, em, doel, door, pt, zegels: [{ t: nu, vrij: nu, van: 'Kadoly', start: 1 }], ak: h(k), k, af: randomBytes(9).toString('hex'), at: nu };
    await zet('ss:m:' + mid, m); await zet('ss:em:' + em, mid);
    if (door) { const d = await lees('ss:m:' + door); if (d) { d.uitgenodigd = (d.uitgenodigd || []).concat([mid]).slice(-500);
      const tweede = !(d.zegels || []).some(z => z.start === 2); if (tweede) d.zegels = (d.zegels || []).concat([{ t: nu, vrij: nu, van: naam, start: 2 }]); // startzegel voor je eerste meespaarder
      await zet('ss:m:' + door, d); if (tweede) { await tel('startzegel2'); await mailNaar(d, 'zegel', { van: naam, start: true, sleutel: 'start2' }); } } }
    await tel(door ? 'mee' : 'start'); await tel('leden');
    await mailNaar(m, 'welkom', { sleutel: 'eerst' });
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
    const uitn = base + '&u=' + mid, wa = `Spaar je mee bij Kadoly? Koop je iets, dan krijg ik een zegel van €1. Nodig jij mensen uit, dan krijg jij een zegel als zij iets kopen. Kaart vol, dan is je product gratis. ${uitn}`;
    let v = ''; for (let j = 0; j < nodig; j++) { const z = alle[j]; v += z ? `<span class="${z.vrij <= nu ? 'vol' : 'wacht'}" title="zegel van ${esc(z.van)}">${esc(String(z.van || '?').charAt(0))}</span>` : '<span></span>'; }
    const vol = vrijZ.length >= nodig;
    let x = `<p class="kicker">Samen sparen</p><h1>${esc(m.naam)} spaart voor ${esc(i ? i.t : 'een cadeau')}</h1>`;
    if (q.get('nieuw') === '1') x += `<div class="ss-k"><p><b>Je eerste zegel is cadeau.</b> De link naar deze kaart staat ook in je mail. Spaart de eerste persoon via jou mee, dan krijg je er nog een.</p></div>`;
    x += `<div class="ss-kaart"><div class="ss-v" aria-label="${vrijZ.length} van ${nodig} zegels">${v}</div><p class="ss-tel">${Math.min(vrijZ.length, nodig)} van ${nodig} zegels</p>${wachtZ.length ? `<p>${wachtZ.length} ${wachtZ.length === 1 ? 'zegel komt' : 'zegels komen'} vrij na de retourtermijn van 14 dagen.</p>` : ''}</div>`;
    x += vol ? `<p><b>Je kaart is vol. Je ${esc(i ? i.t : 'product')} is gratis.</b></p><p><a class="btn knop" href="https://wa.me/31655395630?text=${encodeURIComponent('Mijn spaarkaart is vol: ' + (i ? i.t : '') + ' (' + mid + ')')}">Bestel gratis</a></p>`
      : `<p>Nog ${nodig - Math.min(vrijZ.length, nodig)} zegels.${namen.length < UITNODIG_DOEL ? ` Begin met ${UITNODIG_DOEL} mensen: <b>${namen.length} van ${UITNODIG_DOEL}</b> spaart via jou.` : ''}</p><p><a class="btn knop ss-wa" href="https://wa.me/?text=${encodeURIComponent(wa)}">Nodig uit om mee te sparen</a></p>`;
    if (namen.length) x += `<p><b>Spaart via jou</b></p><div class="ss-l">${namen.map(n => `<span>${esc(n)}</span>`).join('')}</div>`;
    x += `<p class="meta">${esc(uitleg)} Je hoeft zelf niets te kopen. Vragen? App Henkjan van Kadoly: 06 55395630.</p>`;
    return pagina('Samen sparen: ' + m.naam, x); }

  // ---------- uitnodiging van een lid ----------
  const uid = String(q.get('u') || ''); if (uid) { const u = /^[a-f0-9]{12}$/.test(uid) ? await lees('ss:m:' + uid) : null; if (!u) return res.status(404).send('Niet gevonden');
    if (!isBot(ua)) await tel('open');
    const x = `<p class="kicker">Samen sparen</p><h1>${esc(u.naam)} nodigt je uit om mee te sparen</h1><p>Koop je iets bij Kadoly, dan krijgt ${esc(u.naam)} een zegel van €1. Nodig jij mensen uit, dan krijg jij een zegel als zij iets kopen. Kaart vol, dan is je product gratis. Je eerste zegel is cadeau.</p><div class="ss-k">${fout}<form class="ss-f" method="post" action="${esc(base)}"><input type="hidden" name="u" value="${esc(uid)}"><p><b>Waar spaar jij voor?</b></p>${doelKeus(eerste)}${velden}<button class="btn knop" type="submit">Spaar mee</button></form><p class="meta">Geen voorwaarden. Je hoeft zelf niets te kopen.</p></div>`;
    return pagina('Spaar mee met ' + u.naam, x); }

  // ---------- start (uit een advertentie, of via een site of vereniging) ----------
  if (!isBot(ua)) await tel('zie');
  let pnaam = ''; try { const P = await import('./partner.js'); const pt = await P.ptUit(req, q); if (pt) { const p = await P.partner(pt); pnaam = p ? p.naam : ''; if (pnaam) res.setHeader('set-cookie', 'kpt=' + pt + '; Max-Age=' + (7 * 86400) + '; Path=/; Secure; SameSite=Lax'); } } catch (e) {}
  let x = `<p class="kicker">Samen sparen${pnaam ? ' met ' + esc(pnaam) : ''}</p><h1>Spaar samen iets helemaal gratis</h1><p>${esc(uitleg)} Je eerste zegel is cadeau, en je hoeft zelf niets te kopen.</p>`;
  if (q.get('al') === '1') x += '<div class="ss-k"><p><b>Met dit e-mailadres spaar je al.</b> We stuurden de link naar je kaart opnieuw naar dat adres.</p></div>';
  x += `<div class="ss-k">${fout}<form class="ss-f" method="post" action="${esc(base)}"><p><b>Waar spaar jij voor?</b></p>${doelKeus(eerste)}${velden}<button class="btn knop" type="submit">Start met samen sparen</button></form><p class="meta">Geen voorwaarden. Gratis is echt gratis, ook de verzending.${pnaam ? ' Wat jij koopt, steunt ' + esc(pnaam) + '.' : ''} Kadoly is een webshop van ADSFAIR B.V.</p></div>`;
  return pagina('Samen sparen bij Kadoly', x);
}
