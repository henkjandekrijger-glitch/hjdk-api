// Partnermodel van Kadoly (Henkjan 21 nov 2026: "En daarna terug naar affiliate model want hebben we nog steeds niet" en eerder
// "Een site die zo'n knop plaatst, krijgt hetzelfde bedrag per bestelling als een club").
// Een site, vereniging, school of maker meldt zich aan, krijgt een code en eigen links naar de gidsen en de groepscadeaupagina's,
// en verdient een vast bedrag per bestelling op kadoly.com die binnen 7 dagen na een klik via zijn link wordt gedaan.
// - Meten loopt via Clickmind: wie via /p/<code> binnenkomt krijgt cookie kpt; een klik naar een product (/naar, fn/shop.js op=gidsuit)
//   krijgt dan campagne p-<code>; een betaalde bestelling op die klik komt in het grootboek pt:o:<code> (fn/shop.js pxVerwerk).
// - Bedrag: €2 per aankoop (23 nov 2026, lib/samensparen.js: elke aankoop geeft 1 zegel aan de koper, en de club of site van die koper krijgt
//   €2 in plaats van een zegel; een lid kan zijn eigen zegel ook aan de club geven, dan €4). Drempel voor uitbetalen in kv pt:regels ({ drempel }).
// - Concept: alleen op de beschermde host tot LIVE true (Henkjan 21 nov: "Ik wil eerst zien voor live gaat").
// - Controle: /api/gids?op=partner&stand=1 (beschermd) met lekken en drempels.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';

export const LIVE = false;
const STD = { perBestelling: 2, drempel: 10 }; // euro per bestelling (zelfde bedrag als een club in het samen-model), uitbetalen vanaf
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const h = s => createHash('sha256').update(String(s)).digest('hex');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = x => '€' + (Math.round(N(x) * 100) / 100).toFixed(2).replace('.', ',').replace(',00', '');
const schoon = (v, n) => String(v || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const dagNL = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
export const codeOk = c => /^[a-z0-9][a-z0-9-]{2,29}$/.test(String(c || ''));
async function tel(wat, n = 1) { try { const k = 'pt:tel:' + dagNL(); await kv.raw(['HINCRBY', k, wat, String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); } catch (e) {} }
export async function regels() { let r = null; try { r = await kv.get('pt:regels'); } catch (e) {} return { ...STD, ...(r && typeof r === 'object' ? r : {}) }; }
export async function partner(code) { if (!codeOk(code)) return null; try { return await kv.get('pt:p:' + code); } catch (e) { return null; } }

// nieuwe partner met eigen code en geheime sleutel voor het dashboard (ook gebruikt door de clubwerving, lib/clubwerf.js)
export async function maakPartner({ naam, mail, soort, web, extra }) {
  let stam = String(naam || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24); if (stam.length < 3) stam = 'partner';
  if (extra && extra.test) stam = ('test-' + stam).slice(0, 29);
  let code = stam; for (let i = 2; i < 50 && (await kv.get('pt:p:' + code).catch(() => null)); i++) code = stam + '-' + i;
  const k = randomBytes(12).toString('hex');
  const P = { code, naam, mail, soort, web, ak: h(k), k, at: Date.now(), ...(extra || {}) }; await kv.set('pt:p:' + code, P); await mailClub(P, 'welkom'); if (!(extra && extra.test)) { await kv.raw(['SADD', 'pt:alle', code]).catch(() => {}); await tel('aan'); await tel('aan-' + soort); }
  return { code, k };
}

// ---------- grootboek: aangeroepen vanuit fn/shop.js bij een betaalde bestelling op een klik met campagne p-<code> ----------
// 23 nov: het bedrag komt van Samen sparen (lib/samensparen.js ssBestelling): €2 per aankoop (Henkjan: "Alles geeft een zegel"; de keten wordt
// gemeten met de kettingmeter). Geboekt vanuit de controle van de datapagina van de shop, waar de regels van de bestelling
// bekend zijn; één keer per bestelling (pt:ord). Zonder bedrag (cent 0) wordt er niets geboekt.
export async function boekBestelling(camp, { v, order, t, cent, test }) {
  const code = String(camp || '').replace(/^p-/, ''); if (!codeOk(code)) return;
  cent = Math.round(N(cent)); if (cent <= 0) return;
  if (order) { try { const nieuw = await kv.raw(['SET', 'pt:ord:' + String(order).slice(0, 40), code + '|' + cent, 'NX', 'EX', String(200 * 86400)]); if (!nieuw) { await tel('dubbelGeweigerd'); return; } } catch (e) {} } // één keer per bestelling
  try { await kv.raw(['RPUSH', 'pt:o:' + code, JSON.stringify({ t: t || Date.now(), v: Math.round(N(v) * 100), o: String(order || '').slice(0, 40), cent })]);
    const nb = N(await kv.raw(['HINCRBY', 'pt:s:' + code, 'bestel', '1'])), nc = N(await kv.raw(['HINCRBY', 'pt:s:' + code, 'cent', String(cent)])); if (!test) await tel('bestel');
    const R = await regels(), d = R.drempel * 100, betaald = N(await kv.raw(['HGET', 'pt:s:' + code, 'betaald']).catch(() => 0));
    if (nb === 1 || (nc - betaald >= d && nc - cent - betaald < d)) { const P = await partner(code); if (P) await mailClub(P, nb === 1 ? 'eerste' : 'drempel', { cent: nc - betaald, bestel: nb }); } } catch (e) {}
}
// retour of terugbetaald: het bedrag van die bestelling eraf (lib/samensparen.js ssRetour)
export async function stornoBestelling(order, test) {
  const o = String(order || '').slice(0, 40); if (!o) return; let w = null; try { w = await kv.raw(['GET', 'pt:ord:' + o]); } catch (e) {} if (!w || /\|storno$/.test(w)) return;
  const [code, c] = String(w).split('|'); const cent = Math.round(N(c)); if (!codeOk(code) || cent <= 0) return;
  try { await kv.raw(['SET', 'pt:ord:' + o, code + '|' + cent + '|storno', 'EX', String(200 * 86400)]); await kv.raw(['RPUSH', 'pt:o:' + code, JSON.stringify({ t: Date.now(), o, cent: -cent, retour: 1 })]);
    await kv.raw(['HINCRBY', 'pt:s:' + code, 'bestel', '-1']); await kv.raw(['HINCRBY', 'pt:s:' + code, 'cent', String(-cent)]); if (!test) await tel('retour'); } catch (e) {}
}

// ---------- de club warm houden en uitbetalen (Henkjan 23 nov 2026, ja op het advies: berichten bij mijlpalen, vaste maandelijkse uitbetaling) ----------
export const clubLink = code => LIVE ? 'https://gids.kadoly.com/p/' + code + '/samen-sparen' : 'https://hjdk-api-henq.vercel.app/api/gids?op=ss&pt=' + code;
export const groepsTekst = (naam, link) => `Koop je cadeaus via deze link: ${naam} krijgt €2 per aankoop, en jij spaart voor een gratis cadeau. ${link}`;
export const ibanOk = v => { const s = String(v || '').replace(/\s+/g, '').toUpperCase(); if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return ''; const r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55)); let m = 0; for (const d of r) m = (m * 10 + Number(d)) % 97; return m === 1 ? s : ''; };
async function stand(code) { const a = await kv.raw(['HGETALL', 'pt:s:' + code]).catch(() => []); const o = {}; for (let j = 0; j + 1 < (a || []).length; j += 2) o[a[j]] = N(a[j + 1]); return o; }
async function teBetalen(R) { const uit = []; for (const c of ((await kv.raw(['SMEMBERS', 'pt:alle']).catch(() => [])) || [])) { const s = await stand(c), open = N(s.cent) - N(s.betaald); if (open >= R.drempel * 100) { const P = await partner(c); if (P) uit.push({ code: c, naam: P.naam, open, iban: P.iban || '', tnv: P.tnv || '' }); } } return uit.sort((a, b) => b.open - a.open); }
// één mail per moment, met één knop: aangezet, de eerste aankoop, de drempel gehaald, en elke maand de stand
export async function mailClub(P, soort, s = {}) {
  if (!P || !P.mail || !P.k) return false;
  try { const KN = await import('./kadoly-nieuws.js'); if (!(await KN.mailKlaar())) { await tel('mailNietKlaar'); return false; }
    const host = LIVE ? 'https://gids.kadoly.com' : 'https://hjdk-api-henq.vercel.app', dash = host + '/api/gids?op=partner&c=' + P.code + '&k=' + P.k, wa = 'https://wa.me/?text=' + encodeURIComponent(groepsTekst(P.naam, clubLink(P.code)));
    const eur = euro(N(s.cent) / 100), n = N(s.bestel);
    const T = { welkom: ['De pagina van ' + P.naam + ' staat aan', 'Jullie pagina staat aan', 'Zet het bericht in de groepsapp van de club. Bij elke aankoop van een lid krijgt de club €2.', 'Stuur naar de groepsapp', wa],
      eerste: ['De eerste €2 voor ' + P.naam, 'De eerste €2 is binnen', 'Een lid kocht iets via jullie link. Zet het bericht nog eens in de groepsapp, dan volgen er meer.', 'Stuur nog eens naar de groepsapp', wa],
      drempel: [P.naam + ' heeft ' + eur + ' gespaard', eur + ' voor de clubkas', P.iban ? 'Op de 1e van de maand maken we het over.' : 'Geef het rekeningnummer van de club door, dan maken we het op de 1e van de maand over.', P.iban ? 'Stuur nog eens naar de groepsapp' : 'Geef het rekeningnummer door', P.iban ? wa : dash + '#iban'],
      maand: [P.naam + ': ' + eur + ' voor de clubkas', eur + ' voor ' + P.naam, (n === 1 ? '1 aankoop' : n + ' aankopen') + ' van leden tot nu toe. Zet het bericht deze maand nog eens in de groepsapp.', 'Stuur opnieuw naar de groepsapp', wa] }[soort];
    if (!T) return false;
    const html = KN.mailSchil({ titel: T[1], voorkop: T[2], inhoud: `<h1 style="font-size:24px;line-height:1.25;margin:0 0 12px">${esc(T[1])}</h1><p style="margin:0 0 18px">${esc(T[2])}</p><p style="margin:0 0 14px">${KN.knop(T[4], T[3])}</p><p style="margin:0"><a href="${dash}" style="color:#0B0D12;font-weight:700">Bekijk jullie pagina</a></p>`,
      voet: 'Je krijgt deze mail omdat ' + esc(P.naam) + ' meedoet met Kadoly. Vragen of stoppen? Antwoord op deze mail, of bel of app Henkjan: 06 55395630.<br><br>' + esc(KN.KADOLY_BEDRIJF) });
    await KN.stuurMails([{ to: [P.mail], subject: T[0], html }], 'pt-' + soort + '-' + P.code + '-' + (soort === 'maand' ? dagNL().slice(0, 7) : soort)); await tel('mail-' + soort); return true;
  } catch (e) { await tel('mailFout'); return false; }
}
// dagelijks (vanuit lib/samensparen.js ssRonde): op de 1e van de maand de stand naar elke club met aankopen, en de lijst om uit te betalen naar Henkjan
export async function maandRonde() {
  if (Number(dagNL().slice(8, 10)) !== 1) return { niet: 'geen 1e van de maand' }; const maand = dagNL().slice(0, 7);
  if (!(await kv.raw(['SET', 'pt:maand:' + maand, '1', 'NX', 'EX', String(40 * 86400)]).catch(() => null))) return { al: maand };
  const R = await regels(); let n = 0; for (const c of ((await kv.raw(['SMEMBERS', 'pt:alle']).catch(() => [])) || [])) { const s = await stand(c); if (N(s.bestel) > 0) { const P = await partner(c); if (P && await mailClub(P, 'maand', s)) n++; } }
  const L = await teBetalen(R); if (L.length && process.env.MELD_SLEUTEL) { try { await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': process.env.MELD_SLEUTEL }, body: JSON.stringify({ bron: 'Kadoly uitbetalen', tekst: 'Uitbetalen aan clubs: ' + L.length + ', samen ' + euro(L.reduce((a, p) => a + p.open, 0) / 100) + '. Lijst: https://hjdk-api-henq.vercel.app/api/gids?op=partner&uitbetalen=1' }), signal: AbortSignal.timeout(10000) }); } catch (e) {} }
  return { maand, mails: n, uitbetalen: L.length };
}

// ---------- pagina's ----------
const CSS = `<style>.pt-big{font-size:44px;font-weight:700;line-height:1;margin:8px 0 4px}.pt-link{font-size:14px;overflow-wrap:anywhere}.pt-link span{font-weight:700;user-select:all}.pt-meer{margin:28px 0 0;border-top:1px solid #D7DCE8;padding:14px 0 0}.pt-meer summary{cursor:pointer;font-weight:700;text-decoration:underline}.pt-f{display:grid;gap:10px;max-width:520px;margin:12px 0}.pt-t{width:100%;table-layout:fixed}.pt-t td,.pt-t th{overflow-wrap:anywhere;word-break:break-word}.pt-code{width:100%;box-sizing:border-box}.pt-k{border:1px solid #D7DCE8;border-radius:16px;padding:16px 18px;margin:0 0 16px}.pt-k h2{margin:0 0 8px;font-size:22px}.pt-f{display:grid;gap:10px;max-width:520px}.pt-f input[type=text],.pt-f input[type=email],.pt-f input[type=url]{min-height:48px;border:1.5px solid #111113;border-radius:12px;padding:10px 12px;font:inherit;background:#fff;color:#111113}.pt-o{display:flex;flex-wrap:wrap;gap:8px}.pt-o label{display:flex;gap:8px;align-items:center;border:2px solid #111113;border-radius:999px;padding:8px 14px;font-weight:700;cursor:pointer}.pt-o input{accent-color:#111113}.pt-stap{counter-reset:s;list-style:none;padding:0;margin:0 0 16px}.pt-stap li{counter-increment:s;padding:0 0 10px 34px;position:relative}.pt-stap li::before{content:counter(s);position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;background:#111113;color:#fff;font-weight:700;font-size:13px;display:grid;place-items:center}.pt-t{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #D7DCE8;border-radius:16px;overflow:hidden;margin:0 0 18px}.pt-t th,.pt-t td{text-align:left;padding:14px 18px;border-bottom:1px solid #D7DCE8;vertical-align:top}.pt-t tr:last-child td{border-bottom:0}.pt-t th{font-size:13px;border-bottom:2px solid #111113}.pt-code{display:block;width:100%;min-height:96px;border:1.5px solid #111113;border-radius:12px;padding:10px 12px;font:14px/1.45 ui-monospace,Menlo,monospace;color:#111113;background:#fff;white-space:pre-wrap;word-break:break-all}.pt-big{font-size:32px;font-weight:700;margin:0}.pt-hp{position:absolute!important;left:-9999px!important}.pt-wa{background:#25D366!important;border-color:#25D366!important;color:#fff!important}</style>`;

// de pagina's waar een partner naar linkt: groepscadeaus eerst (die verkopen per groep), dan de gidsen
function bestemmingen(gc) { const L = [{ pad: 'samen-sparen', naam: 'Samen sparen bij Kadoly', knop: 'Spaar samen bij Kadoly' }]; for (const s of [...gc.LIVE]) if (gc.PAGINAS[s]) L.push({ pad: s, naam: gc.PAGINAS[s].h1, knop: 'Start een groepscadeau' }); L.push({ pad: '', naam: 'Alle gidsen van Kadoly', knop: 'Kies een cadeau' }); return L; }

export async function partnerOp({ req, res, q, host, ua, kaal, leesBody, isBot, gc }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const beschermd = /\.vercel\.app$/i.test(host), mag = beschermd || LIVE;
  const thuis = beschermd ? 'https://' + host : 'https://gids.kadoly.com', base = thuis + '/api/gids?op=partner';
  const pLink = (code, pad) => beschermd && !LIVE && (!pad || pad === 'samen-sparen') ? 'https://' + host + '/api/gids?op=ss&pt=' + code : 'https://gids.kadoly.com/p/' + code + (pad ? '/' + pad : '');
  const pagina = (titel, inhoud) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(200).send(kaal(titel, CSS + (LIVE ? '' : '<div class="pt-k"><p><b>Concept.</b> Dit staat nog niet op gids.kadoly.com; alleen jij ziet het hier.</p></div>') + inhoud, '<script src="https://go.kadoly.com/cm.js" data-site="kadolypartner" async></script>')); };
  const naar = u => { res.setHeader('location', u); return res.status(303).end(); };
  if (!mag) return res.status(404).send('Niet gevonden');
  const R = await regels();

  if (q.get('stand') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden');
    const dagen = {}, som = {}; for (let i = 0; i < 14; i++) { const d = new Date(Date.now() - i * 864e5).toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' }); const a = await kv.raw(['HGETALL', 'pt:tel:' + d]).catch(() => []); if (Array.isArray(a) && a.length) { dagen[d] = {}; for (let j = 0; j + 1 < a.length; j += 2) { dagen[d][a[j]] = N(a[j + 1]); som[a[j]] = N(som[a[j]]) + N(a[j + 1]); } } }
    const codes = ((await kv.raw(['SMEMBERS', 'pt:alle']).catch(() => [])) || []).slice(0, 500), per = {};
    for (const c of codes) { const a = await kv.raw(['HGETALL', 'pt:s:' + c]).catch(() => []); const o = {}; for (let j = 0; j + 1 < (a || []).length; j += 2) o[a[j]] = N(a[j + 1]); per[c] = o; }
    const L = []; if (N(som.zie) >= 200 && !N(som.aan)) L.push({ lek: 'niemand meldt zich aan', cijfers: som.zie + ' keer de aanmeldpagina, 0 aanmeldingen', actie: 'kop, bedrag en formulier nakijken' });
    const actief = Object.values(per).filter(o => N(o.klik) > 0).length; if (codes.length >= 10 && !actief) L.push({ lek: 'partners delen niet', cijfers: codes.length + ' partners, niemand stuurde bezoekers', actie: 'het knopje en de WhatsApp-tekst op het dashboard' });
    const kl = Object.values(per).reduce((a, o) => a + N(o.klik), 0), be = Object.values(per).reduce((a, o) => a + N(o.bestel), 0); if (kl >= 300 && !be) L.push({ lek: 'bezoekers van partners kopen niet', cijfers: kl + ' kliks via partners, 0 bestellingen', actie: 'de pagina waar partners naartoe sturen' });
    return res.status(200).json({ ok: true, live: LIVE, regels: R, laatste14: som, dagen, partners: codes.length, per, lekken: L }); }

  if (q.get('uitbetalen') === '1') { if (!beschermd) return res.status(404).send('Niet gevonden'); const L = await teBetalen(R);
    let x = `<h1>Uitbetalen</h1><p>${L.length ? L.length + (L.length === 1 ? ' club of site' : ' clubs en sites') + ', samen ' + euro(L.reduce((a, p) => a + p.open, 0) / 100) + '.' : 'Niemand staat open boven ' + euro(R.drempel) + '.'}</p>`;
    for (const p of L) x += `<div class="pt-k"><p><b>${esc(p.naam)}</b>: ${euro(p.open / 100)}<br>${p.iban ? esc(p.iban) + ', ' + esc(p.tnv || '') : 'Nog geen rekeningnummer'}</p>${p.iban ? `<form method="post" action="${esc(base)}"><input type="hidden" name="a" value="betaald"><input type="hidden" name="c" value="${esc(p.code)}"><button class="btn knop" type="submit">Betaald</button></form>` : ''}</div>`;
    return pagina('Uitbetalen', x); }
  if (req.method === 'POST') { if (isBot(ua)) return res.status(403).send('Niet toegestaan'); const b = await leesBody(req);
    if (b.website) return naar(base);
    if (String(b.a) === 'iban') { const code = String(b.c || ''), P = await partner(code); if (!P || P.ak !== h(String(b.k || ''))) return naar(base);
      const ib = ibanOk(b.iban), tnv = schoon(b.tnv, 70); if (!ib || !tnv) return naar(base + '&c=' + code + '&k=' + b.k + '&fout=iban#iban');
      P.iban = ib; P.tnv = tnv; await kv.set('pt:p:' + code, P); await tel('iban'); return naar(base + '&c=' + code + '&k=' + b.k + '&ok=iban'); }
    if (String(b.a) === 'betaald') { if (!beschermd) return naar(base); const code = String(b.c || ''); const s = await stand(code), open = N(s.cent) - N(s.betaald); if (open > 0) { await kv.raw(['HINCRBY', 'pt:s:' + code, 'betaald', String(open)]); await kv.raw(['RPUSH', 'pt:o:' + code, JSON.stringify({ t: Date.now(), cent: 0, betaald: open })]); await tel('uitbetaald', Math.round(open / 100)); } return naar(base + '&uitbetalen=1'); }
    if (String(b.a) === 'aan') { const naam = schoon(b.naam, 60), mail = schoon(b.mail, 120).toLowerCase(), soort = ['site', 'club', 'school', 'maker'].includes(String(b.soort)) ? String(b.soort) : 'site', web = schoon(b.web, 200);
      if (!naam || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail)) return naar(base + '&fout=1#aan');
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), rk = 'pt:rl:' + h(ip + dagNL()).slice(0, 16); const n = N(await kv.incr(rk).catch(() => 0)); if (n === 1) await kv.raw(['EXPIRE', rk, '90000']).catch(() => {}); if (n > 5) return naar(base);
      const { code, k } = await maakPartner({ naam, mail, soort, web });
      return naar(base + '&c=' + code + '&k=' + k + '&nieuw=1'); }
    return naar(base); }

  // ---------- dashboard van een partner (Henkjan 23 nov 2026: "Alle schermen simpeler !! ZO min mogelijjk op een scherm"): bedrag, één knop, de link; de rest onder Meer ----------
  const code = String(q.get('c') || ''); if (code) { const P = await partner(code); if (!P || P.ak !== h(String(q.get('k') || ''))) return res.status(404).send('Niet gevonden');
    const s = {}; { const a = await kv.raw(['HGETALL', 'pt:s:' + code]).catch(() => []); for (let j = 0; j + 1 < (a || []).length; j += 2) s[a[j]] = N(a[j + 1]); }
    const orders = ((await kv.raw(['LRANGE', 'pt:o:' + code, '-20', '-1']).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(x => x && x.cent && !x.betaald).reverse();
    const B = bestemmingen(gc), eerst = B[0], link = pLink(code, eerst.pad), wa = 'https://wa.me/?text=' + encodeURIComponent(groepsTekst(P.naam, link)), open = N(s.cent) - N(s.betaald), kk = String(q.get('k'));
    const knopHtml = d => `<a href="${pLink(code, d.pad)}" style="display:inline-block;background:#111113;color:#fff;border-radius:999px;padding:12px 22px;font:600 16px/1.2 system-ui,sans-serif;text-decoration:none">${d.knop}</a>`;
    const ibanNodig = open >= R.drempel * 100 && !P.iban;
    let x = `<h1>${esc(P.naam)}</h1>`;
    if (q.get('ok') === 'iban') x += `<p><b>Opgeslagen.</b> Op de 1e van de maand maken we het over.</p>`;
    else if (q.get('nieuw') === '1') x += `<p><b>Jullie pagina staat aan.</b> De link naar deze pagina staat ook in je mail.</p>`;
    x += N(s.cent) > 0 ? `<p class="pt-big">${euro(N(s.cent) / 100)}</p><p>verdiend met ${N(s.bestel) === 1 ? '1 aankoop' : N(s.bestel) + ' aankopen'} van leden.</p>` : `<p>Zet het bericht in de groepsapp van de club. Bij elke aankoop van een lid krijgt de club €2.</p>`;
    if (ibanNodig) x += `<form class="pt-f" id="iban" method="post" action="${esc(base)}"><input type="hidden" name="a" value="iban"><input type="hidden" name="c" value="${esc(code)}"><input type="hidden" name="k" value="${esc(kk)}"><p style="margin:0"><b>Waar maken we het geld heen?</b></p>${q.get('fout') === 'iban' ? '<p style="margin:0"><b>Dit rekeningnummer klopt niet.</b></p>' : ''}<input type="text" name="iban" required maxlength="40" autocomplete="off" placeholder="Rekeningnummer (IBAN)" aria-label="Rekeningnummer (IBAN)"><input type="text" name="tnv" required maxlength="70" placeholder="Op naam van" aria-label="Op naam van"><button class="btn knop" type="submit">Opslaan</button></form><p><a href="${esc(wa)}">Stuur naar de groepsapp</a></p>`;
    else x += `<p><a class="btn knop" href="${esc(wa)}">Stuur naar de groepsapp</a></p>${P.iban && open > 0 ? `<p>Op de 1e van de maand maken we het over naar de rekening die eindigt op ${esc(String(P.iban).slice(-4))}.</p>` : ''}`;
    x += `<p class="pt-link">Jullie link: <span>${esc(link)}</span></p>`;
    x += `<details class="pt-meer"><summary>Meer</summary>`;
    x += `<p>Je krijgt €2 bij elke aankoop van iedereen die via jullie link meespaart, zolang ze bij Kadoly kopen. Een gewone klik via de link telt 7 dagen. Vanaf ${euro(R.drempel)} maken we het op de 1e van de maand over.${N(s.betaald) > 0 ? ' Al overgemaakt: ' + euro(N(s.betaald) / 100) + '.' : ''}</p>`;
    if (orders.length) x += `<h2>Laatste aankopen</h2><table class="pt-t"><tr><th>Dag</th><th>Voor de club</th></tr>${orders.map(o => `<tr><td>${new Date(o.t).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' })}</td><td>${euro(N(o.cent) / 100)}</td></tr>`).join('')}</table>`;
    x += `<h2>Knop voor jullie site of nieuwsbrief</h2><p>${knopHtml(eerst)}</p><textarea class="pt-code" readonly onclick="this.select()">${esc(knopHtml(eerst))}</textarea>`;
    x += `<h2>Alle links</h2><table class="pt-t"><tr><th>Pagina</th><th>Link</th></tr>${B.map(d => `<tr><td>${esc(d.naam)}</td><td>${esc(pLink(code, d.pad))}</td></tr>`).join('')}</table>`;
    if (P.iban) x += `<p>Uitbetaling naar de rekening die eindigt op ${esc(String(P.iban).slice(-4))}, op naam van ${esc(P.tnv || P.naam)}.</p>`;
    x += `<p>Vragen of stoppen? Bel of app Henkjan van Kadoly: 06 55395630.</p></details>`;
    return pagina('Kadoly partner: ' + P.naam, x); }

  // ---------- aanmelden ----------
  if (!isBot(ua)) await tel('zie');
  let x = `<p class="kicker">Kadoly partner</p><h1>Verdien €2 per aankoop met een knop op je site</h1><p class="meta">Voor sites, verenigingen, scholen en makers</p>`;
  x += `<div class="answer"><p><b>Zet de knop "Spaar samen bij Kadoly" op je site of in de groepsapp van je club.</b> Wie via jou meespaart, krijgt bij elke aankoop een zegel. Jij krijgt €2 bij elke aankoop, zolang hij bij Kadoly koopt. Het kost niets en je hoeft niets te verkopen.</p></div>`;
  x += `<div class="pt-k"><ol class="pt-stap"><li>Meld je aan met je naam en e-mail. Je krijgt meteen je eigen links en een knop.</li><li>Zet de knop op je site, in je nieuwsbrief of in de groepsapp van je club of klas.</li><li>Iedereen die zich via jou aanmeldt, blijft bij jou horen. Bij elke aankoop krijg jij €2. Vanaf ${euro(R.drempel)} maken we het over.</li></ol></div>`;
  x += `<h2 id="aan">Meld je aan</h2><div class="pt-k">${q.get('fout') === '1' ? '<p><b>Vul een naam en een geldig e-mailadres in.</b></p>' : ''}<form class="pt-f" method="post" action="${esc(base)}"><input type="hidden" name="a" value="aan"><input type="text" name="naam" required maxlength="60" placeholder="Naam van je site, club of school" aria-label="Naam van je site, club of school"><input type="email" name="mail" required maxlength="120" autocomplete="email" placeholder="Je e-mailadres" aria-label="Je e-mailadres"><div class="pt-o" role="radiogroup" aria-label="Wat ben je">${[['site', 'Site of blog'], ['club', 'Vereniging'], ['school', 'School of klas'], ['maker', 'Maker']].map(([v, t], j) => `<label><input type="radio" name="soort" value="${v}"${j === 0 ? ' checked' : ''}> ${t}</label>`).join('')}</div><input type="url" name="web" maxlength="200" placeholder="Je website (mag leeg)" aria-label="Je website"><input type="text" name="website" class="pt-hp" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn knop" type="submit">Maak mijn links</button></form><p class="meta">Gratis. Je e-mail gebruiken we alleen voor de uitbetaling.</p></div>`;
  x += `<h2>Vragen</h2>${[['Wat moet ik doen?', 'Een knop op je site zetten of een link delen. Wij doen de rest: de pagina, de bestelling en de verzending.'], ['Wanneer telt een bestelling voor mij?', 'Iedereen die via jouw link samen spaart, blijft bij jou horen: elke bestelling die hij doet, telt voor jou. Klikt iemand alleen door naar de winkel, dan telt zijn bestelling als hij binnen 7 dagen betaalt. Je krijgt €2 per bestelling. Stuurt iemand iets terug, dan gaat het bedrag van die bestelling eraf. Je ziet elke bestelling op je eigen pagina.'], ['Hoe krijg ik het geld?', 'Vanaf ' + euro(R.drempel) + ' maken we het over. Henkjan van Kadoly neemt daarvoor contact met je op.'], ['Kost het mijn bezoekers iets extra?', 'Nee. Ze betalen dezelfde prijs als zonder jouw link.']].map(([v, a]) => `<details class="faq"><summary>${esc(v)}</summary><div class="a"><p>${esc(a)}</p></div></details>`).join('')}`;
  return pagina('Kadoly partner: verdien per aankoop', x);
}

// ---------- /p/<code>/<pagina>: partnerlink, zet cookie kpt en stuur door naar de gids ----------
export async function ptOp({ req, res, q, host, ua, isBot, gc }) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const beschermd = /\.vercel\.app$/i.test(host); const code = String(q.get('c') || ''), pad = String(q.get('n') || '').replace(/[^a-z0-9-]/g, '').slice(0, 80);
  const doel = 'https://gids.kadoly.com/' + pad; // altijd naar de echte gids, ook in de test op de beschermde host
  if (!(beschermd || LIVE) || !codeOk(code) || !(await partner(code))) { res.setHeader('location', doel); return res.status(302).end(); }
  if (!isBot(ua)) { await kv.raw(['HINCRBY', 'pt:s:' + code, 'klik', '1']).catch(() => {}); await tel('klik'); }
  res.setHeader('set-cookie', 'kpt=' + code + '; Max-Age=' + (7 * 86400) + '; Path=/; Secure; SameSite=Lax');
  res.setHeader('location', doel); return res.status(302).end();
}
// partnercode uit cookie of parameter, alleen als hij bestaat (voor op=gidsuit en de groepscadeaus)
export async function ptUit(req, q) { const m = String(req.headers.cookie || '').match(/(?:^|;\s*)kpt=([a-z0-9-]{3,30})/); const c = (q && q.get('pt')) || (m ? m[1] : ''); return codeOk(c) && (await partner(c)) ? c : ''; }
