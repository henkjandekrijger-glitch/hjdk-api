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
// - Concept tot LIVE = true: alleen op de beschermde host. Berichten bij een zegel en inwisselen in de kassa volgen na Henkjans ja.
// - Controle: /api/gids?op=ss&stand=1 (beschermd) met lekken en drempels.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';

export const LIVE = false;
const ZEGEL = 1, VRIJ_DAGEN = 14;
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

// ---------- de koppeling met de winkel: één zegel per bestelling, voor wie de koper uitnodigde ----------
export async function ssBestelling({ em, v, order, t }) {
  if (!/^[0-9a-f]{64}$/.test(String(em || ''))) return { ok: false };
  const mid = await lees('ss:em:' + em); if (!mid) return { ok: true, geenLid: true };
  if (order) { const nieuw = await kv.raw(['SET', 'ss:ord:' + order, '1', 'NX', 'EX', String(120 * 86400)]).catch(() => null); if (!nieuw) return { ok: true, dubbel: true }; }
  const m = await lees('ss:m:' + mid); if (!m) return { ok: false };
  const nu = t || Date.now(); let naar = '';
  if (m.door) { const d = await lees('ss:m:' + m.door); if (d) { d.zegels = (d.zegels || []).concat([{ t: nu, vrij: nu + VRIJ_DAGEN * 864e5, van: m.naam, o: String(order || '').slice(0, 40) }]).slice(-400); await zet('ss:m:' + d.id, d); naar = 'lid'; await tel('zegels'); } }
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
    return res.status(200).json({ ok: true, live: LIVE, regel: 'één zegel van €1 per bestelling, voor wie de koper uitnodigde', laatste14: som, lekken: L }); }

  if (req.method === 'POST') { if (isBot(ua)) return res.status(403).send('Niet toegestaan'); const b = await leesBody(req); if (b.website) return naar(base);
    const naam = schoon(b.naam, 20), mail = schoon(b.mail, 120).toLowerCase(), doel = DOELEN.includes(String(b.doel)) ? String(b.doel) : eerste, u = /^[a-f0-9]{12}$/.test(String(b.u || '')) ? String(b.u) : '';
    if (!naam || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail)) return naar(base + (u ? '&u=' + u : '') + '&fout=1');
    const em = h(mail); if (await lees('ss:em:' + em)) return naar(base + '&al=1');
    let door = '', pt = '';
    if (u && await lees('ss:m:' + u)) door = u; else { try { pt = await (await import('./partner.js')).ptUit(req, null); } catch (e) {} }
    const mid = randomBytes(6).toString('hex'), k = randomBytes(12).toString('hex');
    await zet('ss:m:' + mid, { id: mid, naam, mail, em, doel, door, pt, zegels: [], ak: h(k), at: Date.now() }); await zet('ss:em:' + em, mid);
    if (door) { const d = await lees('ss:m:' + door); if (d) { d.uitgenodigd = (d.uitgenodigd || []).concat([mid]).slice(-500); await zet('ss:m:' + door, d); } }
    await tel(door ? 'mee' : 'start'); await tel('leden');
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
    if (q.get('nieuw') === '1') x += `<div class="ss-k"><p><b>Bewaar deze pagina.</b> Hier zie je je spaarkaart. ${uitleg}</p></div>`;
    x += `<div class="ss-kaart"><div class="ss-v" aria-label="${vrijZ.length} van ${nodig} zegels">${v}</div><p class="ss-tel">${Math.min(vrijZ.length, nodig)} van ${nodig} zegels</p>${wachtZ.length ? `<p>${wachtZ.length} ${wachtZ.length === 1 ? 'zegel komt' : 'zegels komen'} vrij na de retourtermijn van 14 dagen.</p>` : ''}</div>`;
    x += vol ? `<p><b>Je kaart is vol. Je ${esc(i ? i.t : 'product')} is gratis.</b></p><p><a class="btn knop" href="https://wa.me/31655395630?text=${encodeURIComponent('Mijn spaarkaart is vol: ' + (i ? i.t : '') + ' (' + mid + ')')}">Bestel gratis</a></p>`
      : `<p>Nog ${nodig - Math.min(vrijZ.length, nodig)} zegels.</p><p><a class="btn knop ss-wa" href="https://wa.me/?text=${encodeURIComponent(wa)}">Nodig uit om mee te sparen</a></p>`;
    if (namen.length) x += `<p><b>Spaart via jou</b></p><div class="ss-l">${namen.map(n => `<span>${esc(n)}</span>`).join('')}</div>`;
    x += `<p class="meta">${esc(uitleg)} Je hoeft zelf niets te kopen. Vragen? App Henkjan van Kadoly: 06 55395630.</p>`;
    return pagina('Samen sparen: ' + m.naam, x); }

  // ---------- uitnodiging van een lid ----------
  const uid = String(q.get('u') || ''); if (uid) { const u = /^[a-f0-9]{12}$/.test(uid) ? await lees('ss:m:' + uid) : null; if (!u) return res.status(404).send('Niet gevonden');
    if (!isBot(ua)) await tel('open');
    const x = `<p class="kicker">Samen sparen</p><h1>${esc(u.naam)} nodigt je uit om mee te sparen</h1><p>Koop je iets bij Kadoly, dan krijgt ${esc(u.naam)} een zegel van €1. Nodig jij mensen uit, dan krijg jij een zegel als zij iets kopen. Kaart vol, dan is je product gratis.</p><div class="ss-k">${fout}<form class="ss-f" method="post" action="${esc(base)}"><input type="hidden" name="u" value="${esc(uid)}"><p><b>Waar spaar jij voor?</b></p>${doelKeus(eerste)}${velden}<button class="btn knop" type="submit">Spaar mee</button></form><p class="meta">Geen voorwaarden. Je hoeft zelf niets te kopen.</p></div>`;
    return pagina('Spaar mee met ' + u.naam, x); }

  // ---------- start (uit een advertentie, of via een site of vereniging) ----------
  if (!isBot(ua)) await tel('zie');
  let pnaam = ''; try { const P = await import('./partner.js'); const pt = await P.ptUit(req, q); if (pt) { const p = await P.partner(pt); pnaam = p ? p.naam : ''; if (pnaam) res.setHeader('set-cookie', 'kpt=' + pt + '; Max-Age=' + (7 * 86400) + '; Path=/; Secure; SameSite=Lax'); } } catch (e) {}
  let x = `<p class="kicker">Samen sparen${pnaam ? ' met ' + esc(pnaam) : ''}</p><h1>Spaar samen iets helemaal gratis</h1><p>${esc(uitleg)} Je hoeft zelf niets te kopen.</p>`;
  if (q.get('al') === '1') x += '<div class="ss-k"><p><b>Met dit e-mailadres spaar je al.</b> Gebruik de link uit je mail of app Henkjan.</p></div>';
  x += `<div class="ss-k">${fout}<form class="ss-f" method="post" action="${esc(base)}"><p><b>Waar spaar jij voor?</b></p>${doelKeus(eerste)}${velden}<button class="btn knop" type="submit">Start met samen sparen</button></form><p class="meta">Geen voorwaarden. Gratis is echt gratis, ook de verzending.${pnaam ? ' Wat jij koopt, steunt ' + esc(pnaam) + '.' : ''} Kadoly is een webshop van ADSFAIR B.V.</p></div>`;
  return pagina('Samen sparen bij Kadoly', x);
}
