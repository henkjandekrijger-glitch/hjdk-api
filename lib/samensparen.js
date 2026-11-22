// Samen sparen bij Kadoly (Henkjan 22 nov 2026): "Samen sparen moet het heten", "1 een heel lekker duidelijk verhaal", "je kunt dus echt dingen
// volledig gratis sparen geen voorwaarden als je maar deelt", "Hoe kunnen we dit via sites laten promoten ? Iedere verkoop krijgen ze 1 euro ?",
// "Ja en ook verenigingen werkt toch ?".
// - Een groep (hooguit 5 plekken) spaart samen. Elke betaalde bestelling van een lid is een zegel van €1 voor ieder ander lid.
//   Een spaarkaart heeft één vakje per euro van het product waarvoor je spaart; vol = het product gratis, ook de verzending.
// - Zegels komen 14 dagen na de bestelling vrij (retourtermijn). Wie zelf niets koopt, spaart toch mee.
// - Een site, vereniging of school (partner, lib/partner.js) die de groep binnenbracht, neemt één van de 5 plekken in en krijgt €1 per
//   bestelling van elk lid, zolang dat lid bij Kadoly koopt (grootboek pt:o:<code>), via de e-mailvingerafdruk, niet via een cookie.
// - Koppeling met de winkel: fn/shop.js pxVerwerk geeft bij elke betaalde bestelling de sha256 van het e-mailadres (u.em) door aan
//   ssBestelling. Leden worden bewaard met dezelfde vingerafdruk (ss:em:<sha256>).
// - Concept tot LIVE = true: alleen op de beschermde host. Berichten bij een zegel en inwisselen in de kassa volgen na Henkjans ja.
// - Controle: /api/gids?op=ss&stand=1 (beschermd): groepen, leden, zegels, kosten per bestelling, lekken met drempels.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';

export const LIVE = false;
const ZEGEL = 1, MAX = 5, VRIJ_DAGEN = 14;
// waar je voor kunt sparen (concept): vier producten uit de gidsen, prijs live uit de catalogus
const DOELEN = ['oc_4173959362543617', 'oc_4174005866250241', 'oc_4174004744241153', 'oc_4173958884671489'];
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

// ---------- de koppeling met de winkel ----------
export async function ssBestelling({ em, v, order, t }) {
  if (!/^[0-9a-f]{64}$/.test(String(em || ''))) return { ok: false };
  const mid = await lees('ss:em:' + em); if (!mid) return { ok: true, geenLid: true };
  if (order) { const nieuw = await kv.raw(['SET', 'ss:ord:' + order, '1', 'NX', 'EX', String(120 * 86400)]).catch(() => null); if (!nieuw) return { ok: true, dubbel: true }; }
  const m = await lees('ss:m:' + mid); if (!m) return { ok: false }; const g = await lees('ss:g:' + m.g); if (!g) return { ok: false };
  const nu = t || Date.now(), vrij = nu + VRIJ_DAGEN * 864e5; let n = 0;
  for (const ander of g.leden.filter(x => x !== mid)) { const a = await lees('ss:m:' + ander); if (!a) continue; a.zegels = (a.zegels || []).concat([{ t: nu, vrij, van: m.naam, o: String(order || '').slice(0, 40) }]).slice(-400); await zet('ss:m:' + ander, a); n++; }
  let partner = false; if (g.pt) { try { const { boekBestelling } = await import('./partner.js'); await boekBestelling('p-' + g.pt, { v, order, t: nu }); partner = true; } catch (e) {} }
  await tel('bestel'); await tel('zegels', n); if (partner) await tel('partnerEuro', 1);
  try { await kv.raw(['RPUSH', 'ss:log', JSON.stringify({ t: nu, g: g.id, v: Math.round(N(v) * 100), zegels: n, partner: !!g.pt })]); await kv.raw(['LTRIM', 'ss:log', '-2000', '-1']); } catch (e) {}
  return { ok: true, zegels: n, partner };
}

const CSS = `<style>.ss-k{border:1px solid #D7DCE8;border-radius:16px;padding:16px 18px;margin:0 0 14px}.ss-f{display:grid;gap:10px;max-width:520px}.ss-f input[type=text],.ss-f input[type=email]{min-height:48px;border:1.5px solid #111113;border-radius:12px;padding:10px 12px;font:inherit;background:#fff;color:#111113}.ss-d{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.ss-d label{border:1.5px solid #D7DCE8;border-radius:14px;padding:10px;cursor:pointer;display:grid;gap:2px}.ss-d label:has(input:checked){border-color:#111113;box-shadow:0 0 0 1.5px #111113}.ss-d input{position:absolute;opacity:0}.ss-kaart{border:2px solid #111113;border-radius:18px;padding:14px;margin:8px 0 12px}.ss-v{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:5px}.ss-v span{aspect-ratio:1;border:1.5px dashed #111113;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700}.ss-v span.vol{border-style:solid;background:#111113;color:#fff}.ss-v span.wacht{border-style:solid}.ss-tel{font-size:28px;font-weight:700;margin:8px 0 0}.ss-l{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.ss-l span{border:1.5px solid #111113;border-radius:999px;padding:2px 10px;font-weight:700;font-size:14px}.ss-wa{background:#1F8F4E!important;border-color:#1F8F4E!important;color:#fff!important}.ss-hp{position:absolute!important;left:-9999px!important}</style>`;

export async function ssOp({ req, res, q, host, ua, kaal, leesBody, isBot }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const beschermd = /\.vercel\.app$/i.test(host); if (!beschermd && !LIVE) return res.status(404).send('Niet gevonden');
  const base = (beschermd ? 'https://' + host : 'https://gids.kadoly.com') + '/api/gids?op=ss';
  const naar = u => { res.setHeader('location', u); return res.status(303).end(); };
  const pagina = (titel, x) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(kaal(titel, CSS + (LIVE ? '' : '<div class="ss-k"><p><b>Concept.</b> Dit staat nog niet op gids.kadoly.com; alleen jij ziet het hier.</p></div>') + x, '<script src="https://go.kadoly.com/cm.js" data-site="samensparen" async></script>')); };
  const C = await cat(); const doelen = DOELEN.map(p => C[p]).filter(i => i && i.vr !== false);

  if (q.get('stand') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden');
    const som = {}; for (let i = 0; i < 14; i++) { const d = new Date(Date.now() - i * 864e5).toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' }); const a = await kv.raw(['HGETALL', 'ss:tel:' + d]).catch(() => []); for (let j = 0; j + 1 < (a || []).length; j += 2) som[a[j]] = N(som[a[j]]) + N(a[j + 1]); }
    // kosten: een zegel van €1 kost ons hooguit €1/1,21 (geen btw over korting), de €1 voor een site of vereniging is geld; grens €3,30 = de helft van €6,60 winst per bestelling
    const L = []; const kosten = N(som.zegels) * ZEGEL / 1.21 + N(som.partnerEuro), best = N(som.bestel);
    if (best >= 20 && kosten / best > 3.3) L.push({ lek: 'zegels kosten meer dan de helft van de winst', cijfers: euro(kosten / best) + ' per bestelling', actie: 'weekregel: zegelwaarde voor nieuwe bestellingen omlaag, of groepen kleiner; wat al op een kaart staat blijft' });
    if (N(som.zie) >= 200 && !N(som.start)) L.push({ lek: 'niemand start', cijfers: som.zie + ' bezoekers, 0 groepen', actie: 'kop en eerste scherm' });
    if (N(som.start) >= 20 && !N(som.mee)) L.push({ lek: 'niemand spaart mee', cijfers: som.start + ' groepen, niemand nodigde iemand uit die meedeed', actie: 'uitnodiging in de groepsapp' });
    if (N(som.leden) >= 50 && !best) L.push({ lek: 'leden kopen niet', cijfers: som.leden + ' leden, 0 bestellingen', actie: 'bericht met zegels en de winkel; staat de e-mailvingerafdruk aan in de kassa?' });
    return res.status(200).json({ ok: true, live: LIVE, zegelwaarde: ZEGEL, groepMax: MAX, laatste14: som, kostenPerBestelling: best ? Math.round(kosten / best * 100) / 100 : null, lekken: L }); }

  if (req.method === 'POST') { if (isBot(ua)) return res.status(403).send('Niet toegestaan'); const b = await leesBody(req); if (b.website) return naar(base);
    const a = String(b.a || ''), naam = schoon(b.naam, 20), mail = schoon(b.mail, 120).toLowerCase(), doel = DOELEN.includes(String(b.doel)) ? String(b.doel) : DOELEN[2];
    if (!naam || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail)) return naar(base + (b.g ? '&g=' + encodeURIComponent(b.g) : '') + '&fout=1');
    const em = h(mail); if (await lees('ss:em:' + em)) return naar(base + '&al=1');
    let g;
    if (a === 'start') { let pt = ''; try { pt = await (await import('./partner.js')).ptUit(req, null); } catch (e) {} g = { id: randomBytes(5).toString('hex'), naam: schoon(b.groep, 30) || 'Onze groep', leden: [], pt, at: Date.now() }; }
    else if (a === 'mee') { g = /^[a-f0-9]{10}$/.test(String(b.g || '')) ? await lees('ss:g:' + b.g) : null; if (!g) return res.status(404).send('Niet gevonden'); if (g.leden.length + (g.pt ? 1 : 0) >= MAX) return naar(base + '&g=' + g.id + '&vol=1'); }
    else return naar(base);
    const mid = randomBytes(6).toString('hex'), k = randomBytes(12).toString('hex');
    g.leden.push(mid); await zet('ss:g:' + g.id, g);
    await zet('ss:m:' + mid, { id: mid, g: g.id, naam, mail, em, doel, zegels: [], ak: h(k), at: Date.now() }); await zet('ss:em:' + em, mid);
    await tel(a === 'start' ? 'start' : 'mee'); await tel('leden');
    return naar(base + '&m=' + mid + '&k=' + k + (a === 'start' ? '&nieuw=1' : '')); }

  const doelKeus = sel => `<div class="ss-d" role="radiogroup" aria-label="Waar spaar jij voor?">${doelen.map(i => `<label><input type="radio" name="doel" value="${esc(i.id)}"${i.id === sel ? ' checked' : ''}><span>${esc(i.t)}</span><b>${zegelsVoor(i)} zegels · ${euro(thuis(i))}</b></label>`).join('')}</div>`;
  const veld = `<input type="text" name="naam" required maxlength="20" autocomplete="given-name" placeholder="Je voornaam" aria-label="Je voornaam"><input type="email" name="mail" required maxlength="120" autocomplete="email" placeholder="Je e-mail" aria-label="Je e-mail"><input type="text" name="website" class="ss-hp" tabindex="-1" autocomplete="off" aria-hidden="true">`;
  const fout = q.get('fout') === '1' ? '<p><b>Vul je voornaam en een geldig e-mailadres in.</b></p>' : '';

  // ---------- jouw spaarkaart ----------
  const mid = String(q.get('m') || ''); if (mid) { const m = /^[a-f0-9]{12}$/.test(mid) ? await lees('ss:m:' + mid) : null; if (!m || m.ak !== h(String(q.get('k') || ''))) return res.status(404).send('Niet gevonden');
    const g = await lees('ss:g:' + m.g) || { naam: '', leden: [] }; const i = C[m.doel]; const nodig = i ? zegelsVoor(i) : 40; const nu = Date.now();
    const vrijZ = (m.zegels || []).filter(z => z.vrij <= nu), wachtZ = (m.zegels || []).filter(z => z.vrij > nu); const alle = vrijZ.concat(wachtZ);
    const namen = []; for (const l of g.leden) { const x = l === mid ? null : await lees('ss:m:' + l); if (x) namen.push(x.naam); }
    let partnerNaam = ''; if (g.pt) { try { const p = await (await import('./partner.js')).partner(g.pt); partnerNaam = p ? p.naam : ''; } catch (e) {} }
    const uitn = base + '&g=' + g.id, wa = `Zullen we samen sparen bij Kadoly? Elke bestelling van een van ons is een zegel van €1 voor ieder ander. Kaart vol, dan is je product gratis. Spaar je mee met ${g.naam}? ${uitn}`;
    let v = ''; for (let j = 0; j < nodig; j++) { const z = alle[j]; v += z ? `<span class="${z.vrij <= nu ? 'vol' : 'wacht'}" title="zegel van ${esc(z.van)}">${esc(String(z.van || '?').charAt(0))}</span>` : '<span></span>'; }
    const vol = vrijZ.length >= nodig;
    let x = `<p class="kicker">Samen sparen</p><h1>${esc(g.naam)}</h1><div class="ss-l"><span>Jij</span>${namen.map(n => `<span>${esc(n)}</span>`).join('')}${partnerNaam ? `<span>${esc(partnerNaam)}</span>` : ''}</div>`;
    if (q.get('nieuw') === '1') x += `<div class="ss-k"><p><b>Bewaar deze pagina.</b> Hier zie je je spaarkaart. Nodig nu je groep uit: hoe meer mensen meesparen, hoe sneller je kaart vol is.</p></div>`;
    x += `<div class="ss-kaart"><p><b>${esc(i ? i.t : 'Je product')}</b> · ${i ? euro(thuis(i)) : ''}</p><div class="ss-v" aria-label="${vrijZ.length} van ${nodig} zegels">${v}</div><p class="ss-tel">${Math.min(vrijZ.length, nodig)} van ${nodig} zegels</p>${wachtZ.length ? `<p>${wachtZ.length} ${wachtZ.length === 1 ? 'zegel komt' : 'zegels komen'} vrij na de retourtermijn van 14 dagen.</p>` : ''}</div>`;
    x += vol ? `<p><b>Je kaart is vol. Je ${esc(i ? i.t : 'product')} is gratis.</b></p><p><a class="btn knop" href="https://wa.me/31655395630?text=${encodeURIComponent('Mijn spaarkaart is vol: ' + (i ? i.t : '') + ' (' + mid + ')')}">Bestel gratis</a></p>`
      : `<p>Nog ${nodig - Math.min(vrijZ.length, nodig)} zegels.</p><p><a class="btn knop ss-wa" href="https://wa.me/?text=${encodeURIComponent(wa)}">Nodig uit om samen te sparen</a></p>`;
    x += `<p class="meta">Elke bestelling bij Kadoly van iemand in je groep is een zegel van €1 voor jou. Je hoeft zelf niets te kopen. Vragen? App Henkjan van Kadoly: 06 55395630.</p>`;
    return pagina('Samen sparen: ' + g.naam, x); }

  // ---------- uitnodiging ----------
  const gid = String(q.get('g') || ''); if (gid) { const g = /^[a-f0-9]{10}$/.test(gid) ? await lees('ss:g:' + gid) : null; if (!g) return res.status(404).send('Niet gevonden');
    if (!isBot(ua)) await tel('open');
    const vol = g.leden.length + (g.pt ? 1 : 0) >= MAX || q.get('vol') === '1';
    let x = `<p class="kicker">Samen sparen</p><h1>Spaar mee met ${esc(g.naam)}</h1><p>${g.leden.length === 1 ? 'Er spaart al iemand' : g.leden.length + ' mensen sparen al'}. Elke bestelling in de groep is een zegel van €1 voor iedereen, ook voor jou. Kaart vol, dan is je product gratis.</p>`;
    x += vol ? `<div class="ss-k"><p><b>Deze groep is vol.</b> Start je eigen groep.</p><p><a class="btn knop" href="${esc(base)}">Start met samen sparen</a></p></div>`
      : `<div class="ss-k">${fout}<form class="ss-f" method="post" action="${esc(base)}"><input type="hidden" name="a" value="mee"><input type="hidden" name="g" value="${esc(g.id)}"><p><b>Waar spaar jij voor?</b></p>${doelKeus(DOELEN[2])}${veld}<button class="btn knop" type="submit">Spaar mee</button></form><p class="meta">Geen voorwaarden. Je hoeft zelf niets te kopen.</p></div>`;
    return pagina('Spaar mee met ' + g.naam, x); }

  // ---------- start ----------
  if (!isBot(ua)) await tel('zie');
  let pnaam = ''; try { const P = await import('./partner.js'); const pt = await P.ptUit(req, q); if (pt) { const p = await P.partner(pt); pnaam = p ? p.naam : ''; if (pnaam) res.setHeader('set-cookie', 'kpt=' + pt + '; Max-Age=' + (7 * 86400) + '; Path=/; Secure; SameSite=Lax'); } } catch (e) {}
  let x = `<p class="kicker">Samen sparen${pnaam ? ' met ' + esc(pnaam) : ''}</p><h1>Spaar samen iets helemaal gratis</h1><p>Elke bestelling in je groep is een zegel van €1 voor iedereen. Kaart vol, dan is je product gratis, ook de verzending. Je hoeft zelf niets te kopen.</p>`;
  if (q.get('al') === '1') x += '<div class="ss-k"><p><b>Met dit e-mailadres spaar je al.</b> Gebruik de link uit je mail of app Henkjan.</p></div>';
  x += `<div class="ss-k">${fout}<form class="ss-f" method="post" action="${esc(base)}"><input type="hidden" name="a" value="start"><p><b>Waar spaar jij voor?</b></p>${doelKeus(DOELEN[2])}<input type="text" name="groep" maxlength="30" placeholder="Naam van je groep, bijvoorbeeld Familie de Vries" aria-label="Naam van je groep">${veld}<button class="btn knop" type="submit">Start met samen sparen</button></form><p class="meta">Geen voorwaarden. Gratis is echt gratis, ook de verzending.${pnaam ? ' ' + esc(pnaam) + ' spaart mee in je groep.' : ''} Kadoly is een webshop van ADSFAIR B.V.</p></div>`;
  return pagina('Samen sparen bij Kadoly', x);
}
