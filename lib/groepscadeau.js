// Groepscadeaus op gids.kadoly.com (Henkjan 21 nov 2026): "Doe wel dit vind demanradar hiervoor en maak de paginas in de gids": een pagina per moment
// (afscheidscadeau collega, cadeau voor de juf, pensioen, bedankcadeau) met één knop "Start een groepscadeau", en "maak groepsverhaal lerend".
// Onderwerpen en zoektermen: Demand Radar thema kadoly-samen (NL per maand: afscheidscadeau collega ±5.400, cadeau juf ±3.600, pensioen ±2.400, bedankcadeau ±2.400).
// - Pagina: /api/gids?op=gc&s=<slug>. Zolang een pagina niet in LIVE staat, alleen op de beschermde vercel.app-host (Henkjan 21 nov: "Ik wil eerst zien voor live gaat").
// - Groepscadeau: de organisator start (voor wie, eigen naam), deelt de link in de groepsapp; iedereen kiest mee uit drie cadeaus en zegt met welk bedrag hij meedoet.
//   Het geld loopt niet via ons: de organisator zet zijn eigen betaalverzoek (Tikkie) erbij en bestelt het cadeau met de meeste stemmen bij Kadoly (via Clickmind, /naar).
// - Lerend: Clickmind-proef 'groepscadeau' (lib/proef.js): knoptekst op de pagina en de tekst van het deelbericht; waarde start 10, deel 5, mee 15, bestel 40.
// - Controle: /api/gids?op=gc&stand=1 (beschermd): tellers per dag en lekken met drempel.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { proefBeslis, proefEv } from './proef.js';

// Live (Henkjan 21 nov 2026, 19:18 Curaçao: "Ok zet live en optimaliseer"): op gids.kadoly.com/<slug>, indexeerbaar met canonical, JSON-LD, sitemap, llms en IndexNow.
// Groepslinks: gids.kadoly.com/samen/<id> (rewrite in vercel.json); acties posten naar /api/gids?op=gc.
export const LIVE = new Set(['afscheidscadeau-collega']); // slugs die op gids.kadoly.com mogen; de rest is concept op de beschermde host
const SITE = 'groepscadeau';
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const h = s => createHash('sha256').update(String(s)).digest('hex');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = x => '€' + (Math.round(N(x) * 100) / 100).toFixed(2).replace('.', ',').replace(',00', '');
const schoon = (v, n) => String(v || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const dagNL = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
const datumNL = () => new Date().toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' });
async function tel(wat, n = 1) { try { const k = 'gc:tel:' + dagNL(); await kv.raw(['HINCRBY', k, wat, String(n)]); await kv.raw(['EXPIRE', k, String(120 * 86400)]); } catch (e) {} }

// ---------- de pagina's (feiten van de producten komen uit de gidsen orchidee-cadeau en kaarsen-cadeau, door de maker opgegeven) ----------
export const PAGINAS = {
  'afscheidscadeau-collega': {
    zoekterm: 'afscheidscadeau collega', titel: 'Afscheidscadeau collega: wat geef je samen?', kicker: 'Keuzehulp · Groepscadeau',
    h1: 'Afscheidscadeau voor een collega: wat geef je samen?', moment: 'afscheid', voorWie: 'je collega', groep: 'collega’s',
    beschrijving: 'Afscheidscadeau voor een collega dat je samen geeft: één eerste keus, wat het per persoon kost, en in één minuut iedereen laten meedoen.',
    llmvraag: 'Wat is een goed afscheidscadeau voor een collega?', vraagKop: 'Afscheidscadeau voor een collega', bijgewerkt: '2026-11-22',
    verder: [['/orchidee-cadeau', 'Orchidee als cadeau: welke plantenset past?'], ['/kaarsen-cadeau', 'Kaarsen als cadeau: kaarsenset of geurkaars kiezen']],
    keuzes: [
      { pid: 'oc_4173958884671489', label: 'Eerste keus voor het team', naam: 'Plantenset Gradience: orchidee en vetplant', kortNaam: 'plantenset Gradience', kort: 'Een orchidee en een vetplant op een schaal, klaar om neer te zetten.', waarom: 'Een orchidee en een vetplant in keramieken potten van roze naar wit, samen op een schaal. Uitpakken en neerzetten, op het nieuwe bureau of thuis; er hoeft niets bij.', beperking: 'De titel noemt roze orchideeën, maar de maker beschrijft een paarse orchidee; de potten zijn roze. De orchidee heeft 2 of 3 stelen.' },
      { pid: 'oc_4174004744241153', label: 'Kleiner budget', naam: 'EDDA geurkaars Aalina, Mountain Air', waarom: 'Een geurkaars in een handgemaakte beker van steengoed, met ceder en citroen. Volgens de maker ongeveer 40 uur brandduur.', beperking: 'Eén kaars, geen set. Niet voor wie geen open vuur in huis wil.' },
      { pid: 'oc_4174005866250241', label: 'Voor op tafel', naam: 'Vivi dip dye kaarsenset', waarom: 'Zes met de hand geverfde dinerkaarsen van 18 cm. Volgens de maker brandt elke kaars ongeveer 6,5 uur.', beperking: 'Paraffine en zonder geur; kandelaars zitten er niet bij.' },
    ],
    tabel: [
      { situatie: 'Met het hele team, 8 tot 15 collega’s', advies: 'De plantenset Gradience.', pid: 'oc_4173958884671489', n: 10 },
      { situatie: 'Met een kleine groep, 3 tot 6 collega’s', advies: 'De EDDA geurkaars.', pid: 'oc_4174004744241153', n: 5 },
      { situatie: 'Ze houdt van een gedekte tafel', advies: 'De Vivi dip dye kaarsenset.', pid: 'oc_4174005866250241', n: 6 },
      { situatie: 'Geen planten en geen open vuur', advies: 'Kies dan een cadeaubon; die verkoopt Kadoly niet.', pid: '' },
    ],
    faq: [
      { v: 'Wat is een goed afscheidscadeau voor een collega?', a: 'Iets dat blijft en dat je samen geeft. Onze eerste keus is de plantenset Gradience: een orchidee en een vetplant op een schaal, meteen klaar om neer te zetten. Voor een kleinere groep past de EDDA geurkaars.' },
      { v: 'Hoeveel geef je per persoon voor een afscheidscadeau?', a: 'Spreek één bedrag per persoon af, dan is het eerlijk en snel geregeld. Met 10 collega’s kost onze eerste keus {pp10} per persoon; in de tabel hierboven staat het per cadeau.' },
      { v: 'Hoe zamel je geld in voor een afscheidscadeau?', a: 'Start een groepscadeau en zet de link in de groepsapp. Iedereen kiest mee en zegt met welk bedrag hij meedoet. Jij zet er je eigen betaalverzoek bij en bestelt het cadeau met de meeste stemmen.' },
      { v: 'Wat geef je je collega’s als je zelf weggaat?', a: 'Dan geef je juist iets kleins aan iedereen, of je trakteert. Dat is een ander cadeau dan wat het team jou geeft; deze pagina gaat over samen een cadeau geven.' },
    ],
  },
};
// live pagina's voor sitemap, IndexNow en de startpagina van de gids (api/gids.js)
export const gcLijst = () => [...LIVE].filter(s => PAGINAS[s]).map(s => ({ pad: '/' + s, versie: 'gc1-' + PAGINAS[s].bijgewerkt, lm: PAGINAS[s].bijgewerkt, naam: PAGINAS[s].h1 }));
export const gcLlms = (cat, HOST) => { const L = [...LIVE].filter(s => PAGINAS[s]); if (!L.length) return ''; let t = '## Samen een cadeau geven (groepscadeau)\n\n';
  for (const s of L) { const P = PAGINAS[s]; t += '### ' + P.h1 + '\n\n' + HOST + '/' + s + '\n\n'; for (const c of P.keuzes) { const i = cat[c.pid]; if (!i || i.vr === false) continue; t += '- ' + c.label + ': ' + c.naam + ', ' + euro(thuis(i)) + ' inclusief btw en verzending. ' + c.waarom + ' Let op: ' + c.beperking + '\n'; }
    t += '\nGratis een groepscadeau starten: iedereen kiest mee uit deze cadeaus en zegt met hoeveel hij meedoet; de organisator vraagt het geld terug met een eigen betaalverzoek en bestelt bij Kadoly.\n\n'; }
  return t; };

// ---------- catalogus: prijs inclusief verzending en levertijd, zoals de gidsen ----------
let CAT = null, CAT_AT = 0;
async function catalogus() { if (CAT && Date.now() - CAT_AT < 600000) return CAT; let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {} const m = {}; for (const i of (c && c.items) || []) if (i && i.id) m[i.id] = i; if (Object.keys(m).length) { CAT = m; CAT_AT = Date.now(); } return m; }
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
const naarUrl = (pid, slug, blok) => 'https://gids.kadoly.com/naar/' + encodeURIComponent(pid) + '?g=gc-' + encodeURIComponent(slug) + '&b=' + encodeURIComponent(blok);

// ---------- proef ----------
const V = (pf, f) => (pf && pf.v && pf.v[f]) || 'a';
const KNOP = { a: () => 'Start een groepscadeau', b: P => 'Regel het samen met je ' + P.groep };
const deelTekst = (g, url, v) => v === 'b'
  ? `Samen een cadeau voor ${g.voor}: kies je mee? Het kost je een minuut. ${url}`
  : `${g.voor} ${g.moment === 'afscheid' ? 'gaat weg' : 'krijgt een cadeau'}. Ik regel een cadeau van ons allemaal: kies mee en zeg met hoeveel je meedoet. ${url}`;
async function beslis(ua) { try { const b = await proefBeslis(kv, { site: SITE, ctx: { m: /mobi|iphone|android/i.test(String(ua)) ? 1 : 0 } }); if (b && b.ok && b.aan) return { pid: b.pid, d: b.d, r: b.r, v: b.v, c: b.c }; } catch (e) {} return null; }
async function ev(pf, e) { if (!pf || !pf.pid) return; try { await proefEv(kv, { site: SITE, pid: pf.pid, d: pf.d, r: pf.r, c: pf.c, e }); } catch (x) {} }

const CSS = `<style>.gc-k{border:1px solid #D7DCE8;border-radius:16px;padding:16px 18px;margin:0 0 16px}.gc-k h2{margin:0 0 8px;font-size:22px}.gc-p{display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:start;border-top:1px solid #D7DCE8;padding:16px 0}.gc-p:first-child{border-top:0;padding-top:0}.gc-p img{width:96px;height:96px;object-fit:cover;border-radius:12px;display:block}.gc-p p{margin:0 0 6px}.gc-l{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.gc-t{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #D7DCE8;border-radius:16px;overflow:hidden;margin:0 0 18px}.gc-t th,.gc-t td{text-align:left;padding:14px 18px;border-bottom:1px solid #D7DCE8;vertical-align:top}.gc-t tr:last-child td{border-bottom:0}.gc-t th{font-size:13px;border-bottom:2px solid #111113}.gc-f{display:grid;gap:10px;max-width:520px}.gc-f input[type=text],.gc-f input[type=url]{min-height:48px;border:1.5px solid #111113;border-radius:12px;padding:10px 12px;font:inherit;background:#fff;color:#111113}.gc-o{display:flex;flex-wrap:wrap;gap:8px}.gc-o label{display:flex;gap:8px;align-items:center;border:2px solid #111113;border-radius:999px;padding:8px 14px;font-weight:700;cursor:pointer}.gc-o input{accent-color:#111113}.gc-c{display:grid;gap:10px;margin:0 0 12px}.gc-c label{display:grid;grid-template-columns:auto 64px 1fr;gap:12px;align-items:center;border:1.5px solid #D7DCE8;border-radius:14px;padding:10px 12px;cursor:pointer}.gc-c label:has(input:checked){border-color:#111113;box-shadow:0 0 0 1px #111113}.gc-c img{width:64px;height:64px;object-fit:cover;border-radius:10px}.gc-c input{width:20px;height:20px;accent-color:#111113}.gc-stap{counter-reset:s;list-style:none;padding:0;margin:0 0 16px}.gc-stap li{counter-increment:s;padding:0 0 10px 34px;position:relative}.gc-stap li::before{content:counter(s);position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;background:#111113;color:#fff;font-weight:700;font-size:13px;display:grid;place-items:center}.gc-tot{font-size:32px;font-weight:700;margin:0 0 4px}.gc-wa{background:#25D366!important;border-color:#25D366!important;color:#fff!important}.gc-hp{position:absolute!important;left:-9999px!important}</style>`;

// ---------- de route ----------
export async function gcOp({ req, res, q, host, ua, kaal, schil, leesBody, isBot, viaPad }) {
  res.setHeader('cache-control', 'no-store');
  const beschermd = /\.vercel\.app$/i.test(host);
  const thuisHost = beschermd ? 'https://' + host : 'https://gids.kadoly.com';
  const base = thuisHost + '/api/gids?op=gc';
  const gUrl = (id, extra = '') => beschermd ? base + '&g=' + id + extra : thuisHost + '/samen/' + id + (extra ? '?' + extra.slice(1) : '');
  const sUrl = (slug, extra = '') => (!beschermd && LIVE.has(slug)) ? thuisHost + '/' + slug + (extra ? '?' + extra.slice(1) : '') : base + '&s=' + slug + extra;
  const sQ = String(q.get('s') || '');
  if (!beschermd && req.method === 'GET' && sQ && !q.get('g') && !viaPad && LIVE.has(sQ)) { res.setHeader('location', sUrl(sQ)); return res.status(301).end(); } // één adres per pagina
  if (beschermd || !viaPad || req.method !== 'GET' || q.get('g')) res.setHeader('x-robots-tag', 'noindex');
  const pagina = (code, titel, inhoud, script = '') => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(code).send(kaal(titel, CSS + inhoud, script + '<script src="https://go.kadoly.com/cm.js" data-site="' + SITE + '" async></script>')); };
  const naar = url => { res.setHeader('location', url); return res.status(303).end(); };
  const nietGevonden = () => res.status(404).send('Niet gevonden');
  const mag = slug => beschermd || LIVE.has(slug);

  if (q.get('stand') === '1') { if (!beschermd) return nietGevonden(); const dagen = {}; for (let i = 0; i < 14; i++) { const d = new Date(Date.now() - i * 864e5).toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' }); const a = await kv.raw(['HGETALL', 'gc:tel:' + d]).catch(() => []); if (Array.isArray(a) && a.length) { dagen[d] = {}; for (let j = 0; j + 1 < a.length; j += 2) dagen[d][a[j]] = N(a[j + 1]); } }
    const som = {}; for (const d of Object.values(dagen)) for (const [k, v] of Object.entries(d)) som[k] = N(som[k]) + v; const L = [];
    const views = Object.entries(som).filter(([k]) => /^view-/.test(k)).reduce((a, [, v]) => a + v, 0);
    if (views >= 200 && !N(som.start)) L.push({ lek: 'niemand start', cijfers: views + ' bezoeken, 0 groepscadeaus gestart', actie: 'knoptekst en plek van de knop; de proef op knop loopt' });
    if (N(som.start) >= 5 && !N(som.mee)) L.push({ lek: 'niemand doet mee', cijfers: N(som.start) + ' gestart, niemand deed mee', actie: 'deelbericht en de groepspagina; de proef op deeltekst loopt' });
    if (N(som.mee) >= 10 && !N(som.bestel)) L.push({ lek: 'niet besteld', cijfers: N(som.mee) + ' keer meegedaan, 0 keer naar de bestelling', actie: 'organisatorpagina: bestelknop en betaalverzoek nakijken' });
    return res.status(200).json({ ok: true, live: [...LIVE], paginas: Object.keys(PAGINAS), laatste14: som, dagen, lekken: L }); }

  // ---------- POST: start, meedoen, betaalverzoek ----------
  if (req.method === 'POST') { if (isBot(ua)) return res.status(403).send('Niet toegestaan'); const b = await leesBody(req), a = String(b.a || '');
    if (b.website) return naar(base);
    if (a === 'start') { const slug = String(b.s || ''); const P = PAGINAS[slug]; if (!P || !mag(slug)) return nietGevonden();
      const voor = schoon(b.voor, 30), door = schoon(b.door, 30); if (!voor || !door) return naar(sUrl(slug, '&fout=1') + '#start');
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), rk = 'gc:rl:' + h(ip + dagNL()).slice(0, 16); const n = N(await kv.incr(rk).catch(() => 0)); if (n === 1) await kv.raw(['EXPIRE', rk, '90000']).catch(() => {}); if (n > 20) return naar(sUrl(slug));
      const id = randomBytes(5).toString('hex'), k = randomBytes(12).toString('hex'); let pf = null; try { const m = String(req.headers.cookie || '').match(/(?:^|;\s*)gcpf=([A-Za-z0-9_-]+)/); pf = m ? JSON.parse(Buffer.from(m[1], 'base64url').toString()) : null; } catch (e) {}
      let pt = ''; try { pt = await (await import('./partner.js')).ptUit(req, null); } catch (e) {} // partner die de groep binnenbracht (lib/partner.js)
      const g = { id, slug, voor, door, moment: P.moment, ak: h(k), keuzes: P.keuzes.map(c => c.pid), mee: [], tikkie: '', at: Date.now(), pf, pt };
      await kv.set('gc:g:' + id, g, { ex: 180 * 86400 }); await tel('start'); await tel('start-' + slug); await ev(pf, 'start'); return naar(gUrl(id, '&k=' + k + '&nieuw=1')); }
    const g = /^[a-f0-9]{10}$/.test(String(b.g || '')) ? await kv.get('gc:g:' + b.g).catch(() => null) : null; if (!g || !mag(g.slug)) return nietGevonden();
    if (a === 'mee') { const naam = schoon(b.naam, 30), bedrag = Math.round(N(String(b.bedrag || '').replace(',', '.')) * 100) / 100, stem = g.keuzes.includes(String(b.stem)) ? String(b.stem) : '';
      if (!naam || !(bedrag > 0 && bedrag <= 100) || g.mee.length >= 60) return naar(gUrl(g.id, '&fout=1') + '#mee');
      const i = g.mee.findIndex(m => m.n.toLowerCase() === naam.toLowerCase()); const rij = { n: naam, b: bedrag, s: stem, t: Date.now() }; if (i >= 0) g.mee[i] = rij; else g.mee.push(rij);
      await kv.set('gc:g:' + g.id, g, { ex: 180 * 86400 }); if (i < 0) { await tel('mee'); await ev(g.pf, 'mee'); } if (stem) await tel('stem'); return naar(gUrl(g.id, '&ok=1')); }
    if (a === 'tikkie') { if (g.ak !== h(String(b.k || ''))) return res.status(403).send('Niet toegestaan'); let u = null; try { u = new URL(String(b.tikkie || '').trim()); } catch (e) {} g.tikkie = u && u.protocol === 'https:' ? u.href.slice(0, 300) : ''; await kv.set('gc:g:' + g.id, g, { ex: 180 * 86400 }); if (g.tikkie) await tel('tikkie'); return naar(gUrl(g.id, '&k=' + encodeURIComponent(String(b.k || '')))); }
    return naar(base); }

  // ---------- doorsturen en bestellen (geteld, dan door) ----------
  const gid = String(q.get('g') || ''), g = /^[a-f0-9]{10}$/.test(gid) ? await kv.get('gc:g:' + gid).catch(() => null) : null;
  if (gid && (!g || !mag(g.slug))) return nietGevonden();
  const cat = await catalogus();
  const deelUrl = g ? gUrl(g.id) : '';
  if (g && q.get('w') === 'wa') { await tel('deel'); await ev(g.pf, 'deel'); return naar('https://wa.me/?text=' + encodeURIComponent(deelTekst(g, deelUrl, V(g.pf, 'deeltekst')))); }
  if (g && q.get('w') === 'bestel') { if (g.ak !== h(String(q.get('k') || ''))) return res.status(403).send('Niet toegestaan'); const pid = g.keuzes.includes(String(q.get('p'))) ? String(q.get('p')) : g.keuzes[0]; await tel('bestel'); await ev(g.pf, 'bestel'); return naar(naarUrl(pid, g.slug, 'groep') + (g.pt ? '&pt=' + encodeURIComponent(g.pt) : '')); }

  // ---------- groepspagina (deelnemers) en organisatorpagina ----------
  if (g) { const P = PAGINAS[g.slug], org = g.ak === h(String(q.get('k') || '')), k = String(q.get('k') || '');
    const items = g.keuzes.map(pid => ({ pid, i: cat[pid], c: P.keuzes.find(x => x.pid === pid) })).filter(x => x.i && x.i.vr !== false);
    const stemmen = {}; for (const m of g.mee) if (m.s) stemmen[m.s] = N(stemmen[m.s]) + 1; const tot = g.mee.reduce((a, m) => a + N(m.b), 0);
    const winnaar = items.slice().sort((a, b) => N(stemmen[b.pid]) - N(stemmen[a.pid]))[0];
    let h1 = org ? `Cadeau voor ${esc(g.voor)}` : `${esc(g.door)} regelt een cadeau voor ${esc(g.voor)}`, x = '';
    if (!org) await tel('open');
    if (org && q.get('nieuw') === '1') x += `<div class="gc-k"><h2>Stuur de link naar de groep</h2><p>Zet hem in de groepsapp van je ${esc(P.groep)}. Iedereen kiest mee en zegt met hoeveel hij meedoet. Deze pagina is alleen voor jou: bewaar hem, hier zie je wie er meedoet.</p><p><a class="btn knop gc-wa" href="${esc(gUrl(g.id, '&w=wa'))}">Stuur via WhatsApp</a></p></div>`;
    if (q.get('ok') === '1') x += `<div class="gc-k"><h2>Je doet mee</h2>${g.tikkie ? `<p>Betaal je deel via het betaalverzoek van ${esc(g.door)}.</p><p><a class="btn knop" href="${esc(g.tikkie)}" rel="nofollow noopener">Betaal je deel</a></p>` : `<p>${esc(g.door)} stuurt je een betaalverzoek.</p>`}<p><a class="btn deel" href="${esc(gUrl(g.id, '&w=wa'))}">Stuur door aan wie nog niet meedoet</a></p></div>`;
    if (tot > 0) x += `<p class="gc-tot">${euro(tot)}</p><p>${g.mee.length === 1 ? '1 persoon doet' : g.mee.length + ' mensen doen'} mee${winnaar && stemmen[winnaar.pid] ? `. Meeste stemmen: ${esc(winnaar.c ? winnaar.c.naam : winnaar.i.t)}` : ''}.</p>`;
    const keus = items.map(({ pid, i, c }) => `<label><input type="radio" name="stem" value="${esc(pid)}"${winnaar && winnaar.pid === pid && stemmen[pid] ? ' checked' : ''}><img src="${esc(i.img)}" alt=""><span><b>${esc(c ? c.naam : i.t)}</b><br>${euro(thuis(i))} inclusief verzending${stemmen[pid] ? ` · ${stemmen[pid]} ${stemmen[pid] === 1 ? 'stem' : 'stemmen'}` : ''}</span></label>`).join('');
    if (!org) x += `<div class="gc-k" id="mee"><h2>Kies mee en doe mee</h2>${q.get('fout') === '1' ? '<p><b>Vul je naam en een bedrag in.</b></p>' : ''}<form class="gc-f" method="post" action="${esc(base)}"><input type="hidden" name="a" value="mee"><input type="hidden" name="g" value="${g.id}"><div class="gc-c">${keus}</div><input type="text" name="naam" required maxlength="30" autocomplete="given-name" placeholder="Je voornaam" aria-label="Je voornaam"><div class="gc-o" role="radiogroup" aria-label="Jouw deel">${[3, 5, 10].map((v, j) => `<label><input type="radio" name="bedrag" value="${v}"${j === 1 ? ' checked' : ''}> ${euro(v)}</label>`).join('')}</div><input type="text" name="website" class="gc-hp" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn knop" type="submit">Ik doe mee</button></form></div>`;
    if (org) { x += `<div class="gc-k"><h2>Wie doet er mee</h2>${g.mee.length ? `<table class="gc-t"><tr><th>Naam</th><th>Deel</th><th>Kiest</th></tr>${g.mee.map(m => { const it = items.find(y => y.pid === m.s); return `<tr><td>${esc(m.n)}</td><td>${euro(m.b)}</td><td>${it ? esc(it.c ? it.c.naam : it.i.t) : ''}</td></tr>`; }).join('')}</table>` : '<p>Stuur de link naar de groep; hier zie je wie er meedoet.</p>'}<p><a class="btn deel gc-wa" href="${esc(gUrl(g.id, '&w=wa'))}">Stuur de link (nog eens) via WhatsApp</a></p></div>`;
      x += `<div class="gc-k"><h2>Je betaalverzoek</h2><p>Plak hier de link van je Tikkie of ander betaalverzoek. Wie meedoet, ziet dan een knop om te betalen.</p><form class="gc-f" method="post" action="${esc(base)}"><input type="hidden" name="a" value="tikkie"><input type="hidden" name="g" value="${g.id}"><input type="hidden" name="k" value="${esc(k)}"><input type="url" name="tikkie" value="${esc(g.tikkie)}" placeholder="https://tikkie.me/..." aria-label="Link van je betaalverzoek"><button class="btn deel" type="submit">Bewaar</button></form></div>`;
      if (winnaar) x += `<div class="gc-k"><h2>Bestellen</h2><p>${stemmen[winnaar.pid] ? 'De meeste stemmen gaan naar' : 'Eerste keus'}: <b>${esc(winnaar.c ? winnaar.c.naam : winnaar.i.t)}</b>, ${euro(thuis(winnaar.i))} inclusief verzending.</p><p><a class="btn knop" href="${esc(gUrl(g.id, '&k=' + k + '&w=bestel&p=' + winnaar.pid))}">Bestel bij Kadoly</a></p></div>`; }
    return pagina(200, h1.replace(/<[^>]+>/g, ''), `<p class="kicker">${esc(P.kicker)}</p><h1>${h1}</h1>${x}<p class="meta">Het geld loopt niet via Kadoly: ${esc(g.door)} betaalt het cadeau en vraagt ieders deel terug. Vragen? App Henkjan van Kadoly: 06 55395630.</p>`); }

  // ---------- de pagina van een moment ----------
  const slug = String(q.get('s') || ''), P = PAGINAS[slug];
  if (!P) { if (!beschermd) return nietGevonden(); return pagina(200, 'Groepscadeaus', `<p class="kicker">Keuzehulp · Groepscadeau</p><h1>Groepscadeaus</h1><ul>${Object.entries(PAGINAS).map(([s, p]) => `<li><a href="${esc(base + '&s=' + s)}">${esc(p.h1)}</a>${LIVE.has(s) ? ' (live)' : ' (concept)'}</li>`).join('')}</ul>`); }
  if (!mag(slug)) return nietGevonden();
  let pf = null; try { const m = String(req.headers.cookie || '').match(/(?:^|;\s*)gcpf=([A-Za-z0-9_-]+)/); pf = m ? JSON.parse(Buffer.from(m[1], 'base64url').toString()) : null; } catch (e) {}
  if (!pf && !isBot(ua)) { pf = await beslis(ua); if (pf) res.setHeader('set-cookie', 'gcpf=' + Buffer.from(JSON.stringify(pf)).toString('base64url') + '; Max-Age=2592000; Path=/; Secure; SameSite=Lax'); }
  if (!isBot(ua)) { await tel('view-' + slug); if (pf) await ev(pf, 'zie'); }
  const items = P.keuzes.map(c => ({ c, i: cat[c.pid] })).filter(x => x.i && x.i.vr !== false); const eerste = items[0];
  const pp = (pid, n) => { const i = cat[pid]; return i && n ? euro(Math.ceil(thuis(i) / n * 2) / 2) : ''; }; // per persoon, afgerond op 50 cent naar boven
  const knopTekst = (KNOP[V(pf, 'knop')] || KNOP.a)(P);
  const pp10 = eerste ? pp(eerste.c.pid, 10) : '', tekst = s => String(s).replace(/\{pp10\}/g, pp10);
  const datum = P.bijgewerkt ? new Date(P.bijgewerkt + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' }) : datumNL();
  let x = `<nav class="crumbs" aria-label="breadcrumb"><a href="/">Gidsen</a> › Groepscadeau</nav><p class="kicker">${esc(P.kicker)}</p><h1>${esc(P.h1)}</h1><p class="meta">Bijgewerkt ${datum}</p>`;
  if (eerste) x += `<div class="answer"><p><b>Geef samen de ${esc(eerste.c.naam.charAt(0).toLowerCase() + eerste.c.naam.slice(1))} (${euro(thuis(eerste.i))} inclusief verzending).</b> ${esc(eerste.c.kort || eerste.c.waarom)} Met 10 ${esc(P.groep)} is dat ${pp10} per persoon.</p></div>`;
  x += `<p><a class="btn knop" href="#start">${esc(knopTekst)}</a></p>`;
  x += `<h2>Onze keuze</h2><div class="gc-k">${items.map(({ c, i }) => `<div class="gc-p"><img src="${esc(i.img)}" alt="${esc(c.naam)}" width="96" height="96" loading="lazy"><div><p class="gc-l">${esc(c.label)}</p><p><b>${esc(c.naam)}</b>, ${euro(thuis(i))} inclusief verzending${N(i.lt) ? `, ongeveer ${N(i.lt)} werkdagen onderweg` : ''}.</p><p>${esc(c.waarom)}</p><p>Let op: ${esc(c.beperking)}</p><p><a class="btn deel" href="${esc(naarUrl(c.pid, slug, 'keuze'))}" rel="nofollow">Bekijk bij Kadoly</a></p></div></div>`).join('')}</div>`;
  x += `<h2>Welk cadeau past bij jullie groep?</h2><table class="gc-t"><tr><th>Situatie</th><th>Ons advies</th><th>Per persoon</th></tr>${P.tabel.map(r => `<tr><td>${esc(r.situatie)}</td><td>${esc(r.advies)}</td><td>${r.pid && r.n ? pp(r.pid, r.n) + ` bij ${r.n}` : ''}</td></tr>`).join('')}</table>`;
  x += `<h2 id="start">${esc(knopTekst)}</h2><div class="gc-k"><ol class="gc-stap"><li>Vul in voor wie het is en wie het regelt.</li><li>Stuur de link naar de groepsapp. Iedereen kiest mee uit deze drie cadeaus en zegt met hoeveel hij meedoet.</li><li>Jij ziet wie er meedoet, zet je eigen betaalverzoek erbij en bestelt het cadeau met de meeste stemmen.</li></ol>${q.get('fout') === '1' ? '<p><b>Vul beide namen in.</b></p>' : ''}<form class="gc-f" method="post" action="${esc(base)}"><input type="hidden" name="a" value="start"><input type="hidden" name="s" value="${esc(slug)}"><input type="text" name="voor" required maxlength="30" placeholder="Voor wie? Bijvoorbeeld: Sanne" aria-label="Voor wie is het cadeau"><input type="text" name="door" required maxlength="30" autocomplete="given-name" placeholder="Jouw voornaam" aria-label="Jouw voornaam"><input type="text" name="website" class="gc-hp" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn knop" type="submit">${esc(knopTekst)}</button></form><p class="meta">Gratis. Het geld loopt niet via Kadoly.</p></div>`;
  x += `<h2>Vragen</h2>${P.faq.map(f => `<details class="faq"><summary>${esc(f.v)}</summary><div class="a"><p>${esc(tekst(f.a))}</p></div></details>`).join('')}`;
  if ((P.verder || []).length) x += `<h2>Meer gidsen</h2><div class="si-l">${P.verder.map(([hr, t]) => `<a href="${esc(hr)}"><b>${esc(t)}</b><i>→</i></a>`).join('')}</div>`;
  x += `<p class="meta">Heb je een site of vereniging? Zet de knop "${esc(KNOP.a(P))}" op je pagina en verdien per bestelling. App Henkjan van Kadoly: 06 55395630.</p>`;
  if (!LIVE.has(slug)) x = `<div class="gc-k"><p><b>Concept.</b> Deze pagina staat nog niet op gids.kadoly.com; alleen jij ziet hem hier.</p></div>` + x;
  if (beschermd || !schil) return pagina(200, P.titel, x);
  // live op gids.kadoly.com: eigen adres, echte omschrijving, gestructureerde gegevens
  const url = 'https://gids.kadoly.com/' + slug;
  const besch = eerste ? `${P.vraagKop}? Geef samen de ${eerste.c.kortNaam || eerste.c.naam}, ${pp10} per persoon bij 10 ${P.groep}. Start een groepscadeau en regel het in één minuut.` : P.beschrijving;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Gidsen', item: 'https://gids.kadoly.com/' }, { '@type': 'ListItem', position: 2, name: P.h1, item: url }] },
    { '@type': 'Article', headline: P.h1, description: besch, dateModified: P.bijgewerkt, inLanguage: 'nl-NL', mainEntityOfPage: url, publisher: { '@type': 'Organization', name: 'Kadoly', url: 'https://kadoly.com' } },
    { '@type': 'ItemList', name: 'Onze keuze', itemListElement: items.map((y, k) => ({ '@type': 'ListItem', position: k + 1, name: y.c.naam, url: 'https://kadoly.com/product/' + y.c.pid })) },
    { '@type': 'FAQPage', mainEntity: P.faq.map(f => ({ '@type': 'Question', name: f.v, acceptedAnswer: { '@type': 'Answer', text: tekst(f.a) } })) }] };
  res.setHeader('content-type', 'text/html; charset=utf-8');
  return res.status(200).send(schil(P.titel + ' | Kadoly', besch, '/' + slug, '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + CSS, x, '<script src="https://go.kadoly.com/cm.js" data-site="' + SITE + '" async></script>'));
}
