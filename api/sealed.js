import { anonymousService, CHANNELS } from '../lib/sealed-anonymous.js';
// Sealed Intent (sealedintent.com). Alle verzoeken op die host komen via vercel.json hier binnen.
// Pagina's: / (voordeur), /nl /de /en (hub), /<taal>/<slug> (landingspagina). Verder robots.txt, sitemap.xml, llms.txt, zicht.json,
// logo.svg en het IndexNow-sleutelbestand. POST ?op=intent bewaart een verzegelde intentie en meldt hem via Telegram.
// Eigenaar: ?op=intents&token=HJDK_TOKEN (laatste 50, e-mail gemaskeerd). ?op=indexnow pingt alle URL's één keer per versie (BIJGEWERKT);
// daarna geeft hij alleen de bewaarde uitkomst terug, dus veilig om aan te roepen (kost niets, nooit in een lus).
import { kv } from '../lib/db.js';
import { UI, BIJGEWERKT } from '../lib/sealed-content.js';
import { ICONS } from '../lib/sealed-icons.js';
import { VAST, overdracht, overdrachtTekst } from '../lib/sealed-overdracht.js';
import { proefStand, proefTekst } from '../lib/proef.js';
import { zoekLp, bewaarKoper, vulKoperAan, lijstKopers, LP_INDEX } from '../lib/sealed-lp.js';
import { infoPagina, infoLinks, doorsturen } from '../lib/sealed-info.js';
import { eigenaarPost, koperPost, gesprekkenLijst, maakMailer, bezorgWachtend } from '../lib/sealed-post.js';
import { renderChatPage, renderManagePage, renderThreadPage, kleinePagina } from '../lib/sealed-chatpage.js';
import * as MAIL from '../lib/sealed-mail.js';
import { chatStart, chatEv, chatVrij, chatVraag, chatStand, chatStandTekst, chatLeer } from '../lib/sealed-chat.js';
import { berichten, HAIKU } from '../lib/ai.js';
import { GROWTH_SCRIPT } from '../lib/sealed.js';
import { sitemap, ROBOTS, llms, zichtJson, LOGO_SVG, INDEXNOW_KEY, BASE, HOST, url } from '../lib/sealed.js';

const anonymous = anonymousService(kv);
const INDEX_VERSION = BIJGEWERKT + '-chat-v3'; // 17 nov 2026: 18 pagina's in de nieuwe opmaak, IndexNow pingt ze één keer opnieuw
const GSC_META = process.env.SEALED_GSC_META || '';

// Voordeur kiest de taal van de bezoeker (Henkjan 15 nov 2026: "Moet totaal taal agnostisch zijn based on browser"):
// eerst de eigen keuze (cookie si_taal, gezet bij een tik op een taal), dan Accept-Language op volgorde van q, anders Engels.
// Zonder Accept-Language (de meeste bots) toont hij de voordeur zelf; dat adres is x-default (ZICHT-les vary-bij-taalkeuze).
export function kiesTaal(req) {
  const c = (String(req.headers.cookie || '').match(/(?:^|;\s*)si_taal=([a-z]{2})/) || [])[1];
  if (c && UI[c]) return c;
  const al = String(req.headers['accept-language'] || '').trim();
  if (!al) return '';
  const lijst = al.split(',').map((x, i) => { const [t, q] = x.trim().split(/;\s*q=/); return { t: String(t || '').slice(0, 2).toLowerCase(), q: q == null ? 1 : parseFloat(q) || 0, i }; }).sort((a, b) => b.q - a.q || a.i - b.i);
  for (const x of lijst) if (UI[x.t]) return x.t;
  return 'en';
}
const MANIFEST = JSON.stringify({ name: 'Sealed Intent', short_name: 'Sealed Intent', start_url: '/', display: 'browser', background_color: '#ffffff', theme_color: '#111113', icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }] });

function stuur(res, status, type, body, cache = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400', taal = '', robots = '') {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', cache);
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (/html/.test(type)) { res.setHeader('X-Robots-Tag', robots || (status === 200 ? 'index, follow' : 'noindex')); if (taal) res.setHeader('Content-Language', taal); }
  res.end(body);
}
const schoon = (s, n = 200) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);

async function meld(tekst) {
  const s = process.env.MELD_SLEUTEL; if (!s) return false;
  try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'Sealed Intent', tekst: tekst.slice(0, 3400) }), signal: AbortSignal.timeout(8000) }); const j = await r.json().catch(() => ({})); return !!(j && j.ok); } catch (e) { return false; }
}

async function leesBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const delen = []; for await (const d of req) delen.push(d); try { return JSON.parse(Buffer.concat(delen).toString('utf8') || '{}'); } catch (e) { return {}; }
}

async function anonymousRequest(req,res,op) {
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  try {
    const b=await leesBody(req);
    if(JSON.stringify(b).length>8192)return stuur(res,400,'application/json','{"ok":false}','no-store');
    if(b.website) return stuur(res,400,'application/json','{"ok":false,"error":"spam"}','no-store');
    const r=op==='intent'||op==='partij'?await anonymous.submit(req,b):await anonymous.control(op,b);
    return stuur(res,r.status,'application/json',JSON.stringify(r.body),'no-store');
  } catch { return stuur(res,503,'application/json','{"ok":false,"error":"unavailable"}','no-store'); }
}

async function eigenaar(op, res) {
  if (op === 'intents') {
    const ids = await kv.raw(['LRANGE', 'si:list', 0, 49]).catch(() => []);
    const recs = ids.length ? await kv.mget(...ids.map(i => 'si:i:' + i)) : [];
    const lijst = recs.filter(Boolean).map(r => { const {controlHash,...safe}=r;return {...safe,mail:r.mail?r.mail.replace(/^(.).*(@.*)$/, '$1***$2'):undefined}; });
    const pids = await kv.raw(['LRANGE', 'si:plist', 0, 49]).catch(() => []); const precs = pids.length ? await kv.mget(...pids.map(i => 'si:p:' + i)) : [];
    const aids=await kv.raw(['LRANGE','si:anon-partners',0,49]).catch(()=>[]), arecs=aids.length?await kv.mget(...aids.map(i=>'si:i:'+i)):[];
    const partijen = [...precs,...arecs].filter(Boolean).map(r=>{const {controlHash,...safe}=r;return {...safe,mail:r.mail?r.mail.replace(/^(.).*(@.*)$/, '$1***$2'):undefined};});
    return stuur(res, 200, 'application/json', JSON.stringify({ n: await kv.get('si:n').catch(() => null), lijst, partijen }, null, 1), 'no-store');
  }
  if (op === 'indexnow') {
    const oud = await kv.get('si:indexnow').catch(() => null); if (oud && oud.versie === INDEX_VERSION) return stuur(res, 200, 'application/json', JSON.stringify({ al: true, ...oud }), 'no-store');
    const urlList = [...sitemap().matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
    let status = 0; try { const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: BASE + '/' + INDEXNOW_KEY + '.txt', urlList }), signal: AbortSignal.timeout(15000) }); status = r.status; } catch (e) { status = String(e.message || e).slice(0, 80); }
    try { if (status === 200 || status === 202) await kv.set('si:indexnow', { versie: INDEX_VERSION, t: new Date().toISOString(), status, n: urlList.length }); } catch (e) {}
    return stuur(res, 200, 'application/json', JSON.stringify({ status, n: urlList.length }), 'no-store');
  }
  return stuur(res, 404, 'application/json', '{}', 'no-store');
}

export default async function handler(req, res) {
  const u = new URL(req.url, 'https://' + HOST), q = u.searchParams, op = q.get('op') || '';
  if(op==='growth'){const days=Array.from({length:7},(_,i)=>new Date(Date.now()-i*864e5).toISOString().slice(0,10)),counts={};for(const d of days){counts[d]={};for(const c of CHANNELS){const k='si:conversion:'+d+':'+c;counts[d][c]={browserSignals:+(await kv.get('si:visit:'+d+':'+c).catch(()=>0))||0,submissions:+(await kv.get(k).catch(()=>0))||0,intentSubmissions:+(await kv.get(k+':intent').catch(()=>0))||0,sampleReplySubmissions:+(await kv.get(k+':partner').catch(()=>0))||0,buyerCriteriaSubmissions:+(await kv.get('si:buyer-conv:'+d+':'+c).catch(()=>0))||0};}}return stuur(res,200,'application/json',JSON.stringify({basis:'Aggregate browser signals, not verified unique humans or confirmed search clicks. Anonymous submissions and buyer criteria are reported separately; test is an explicit QA channel.',segmentation:'Mode-specific anonymous counts start on 2026-11-17; earlier anonymous submissions remain only in submissions.',days:counts}),'no-store');}
  if(op==='visit'&&req.method==='POST'){const b=await leesBody(req);if(!CHANNELS.includes(b.channel)||/bot|crawler|spider|headless/i.test(String(req.headers['user-agent']||'')))return stuur(res,400,'application/json','{"ok":false}','no-store');const k='si:visit:'+new Date().toISOString().slice(0,10)+':'+b.channel;try{await kv.incr(k);await kv.raw(['EXPIRE',k,100*86400]);}catch{}return stuur(res,200,'application/json','{"ok":true}','no-store');}
  if (req.method === 'OPTIONS') return stuur(res, 204, 'text/plain', '', 'no-store');
  if (['intent','partij','receipt','withdraw','renew','plausible'].includes(op)) {
    if(req.method!=='POST')return stuur(res,405,'application/json','{"ok":false}','no-store');
    return anonymousRequest(req,res,op);
  }
  if (op === 'chatstart' || op === 'chatev' || op === 'chatvrij' || op === 'chatvraag' || op === 'chatsein') {
    if (req.method !== 'POST') return stuur(res, 405, 'application/json', '{"ok":false}', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    try {
      const b = await leesBody(req); if (JSON.stringify(b).length > 4096) return stuur(res, 400, 'application/json', '{"ok":false}', 'no-store');
      const bot = /bot|crawler|spider|headless/i.test(String(req.headers['user-agent'] || ''));
      if (op === 'chatstart') { const r = await chatStart(kv, { rol: b.rol, taal: b.taal, bot }); return stuur(res, r ? 200 : 400, 'application/json', JSON.stringify(r || { ok: false }), 'no-store'); }
      if (bot) return stuur(res, 200, 'application/json', '{"ok":true}', 'no-store');
      if (op === 'chatev') return stuur(res, 200, 'application/json', JSON.stringify({ ok: await chatEv(kv, b) }), 'no-store');
      if (op === 'chatvraag') return stuur(res, 200, 'application/json', JSON.stringify(await chatVraag(kv, b, o => berichten({ ...o, model: HAIKU }))), 'no-store');
      if (op === 'chatvrij') return stuur(res, 200, 'application/json', JSON.stringify({ ok: await chatVrij(kv, b) }), 'no-store');
      // seintje: alleen met de geldige privésleutel van de inzending; los van de anonieme record bewaard en mee verwijderd bij intrekken
      const mail = String(b.mail || '').trim().toLowerCase().slice(0, 160); if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(mail)) return stuur(res, 400, 'application/json', '{"ok":false}', 'no-store');
      const c = await anonymous.control('receipt', b); if (c.status !== 200) return stuur(res, 404, 'application/json', '{"ok":false}', 'no-store');
      await kv.set('si:notify:' + String(b.id), { mail, at: new Date().toISOString() }, { ex: 37 * 86400 });
      // Staat de mail aan, dan krijgt de eigenaar één bevestigingsmail; na zijn klik loopt alles via zijn inbox (lib/sealed-mail.js).
      let bevestig = false; try { bevestig = await MAIL.vraagBevestiging(kv, c.body.record, mail); } catch { /* mail is extra */ }
      try { await meld(bevestig ? 'Een eigenaar gaf zijn e-mail; de bevestigingsmail is verstuurd.' : 'Een eigenaar vraagt een seintje per mail als een koper past (adres staat bij de inzending, niet in deze melding). De mail staat nog uit.'); } catch { /* melding is extra */ }
      return stuur(res, 200, 'application/json', JSON.stringify({ ok: true, bevestig }), 'no-store');
    } catch { return stuur(res, 503, 'application/json', '{"ok":false,"error":"unavailable"}', 'no-store'); }
  }
  if (op === 'chatstand') { const st = await chatStand(kv); return q.get('format') === 'json' ? stuur(res, 200, 'application/json', JSON.stringify(st, null, 1), 'no-store', '', 'noindex') : stuur(res, 200, 'text/plain; charset=utf-8', chatStandTekst(st) + '\n', 'no-store'); }
  if (op === 'chatleer') { const r = await chatLeer(kv, { ai: o => berichten({ ...o, model: HAIKU }) }); return stuur(res, 200, 'application/json', JSON.stringify(r, null, 1), 'no-store'); }
  if (op === 'koper') {
    if (req.method !== 'POST') return stuur(res, 405, 'application/json', '{"ok":false}', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    try { const b = await leesBody(req); if (JSON.stringify(b).length > 8192) return stuur(res, 400, 'application/json', '{"ok":false}', 'no-store'); const r = await bewaarKoper(kv, req, b, meld); if (r.status === 201) { try { const k = await kv.get('si:b:' + r.body.id), m = maakMailer(kv); if (k) await bezorgWachtend(kv, k, { stuurMail: m && m.koper, meld }); } catch { /* bezorgen is extra */ } try { const k = await kv.get('si:b:' + r.body.id); if (k) await MAIL.koppelKoper(kv, k); } catch { /* mail is extra */ } } return stuur(res, r.status, 'application/json', JSON.stringify(r.body), 'no-store'); } catch { return stuur(res, 503, 'application/json', '{"ok":false,"error":"unavailable"}', 'no-store'); }
  }
  if (op === 'koperplus') {
    if (req.method !== 'POST') return stuur(res, 405, 'application/json', '{"ok":false}', 'no-store');
    try { const b = await leesBody(req); if (JSON.stringify(b).length > 2048) return stuur(res, 400, 'application/json', '{"ok":false}', 'no-store'); return stuur(res, 200, 'application/json', JSON.stringify({ ok: await vulKoperAan(kv, b) }), 'no-store', '', 'noindex, nofollow'); } catch { return stuur(res, 503, 'application/json', '{"ok":false}', 'no-store'); }
  }
  // Anonieme berichten: de eigenaar met zijn privésleutel (op=post), de koper met de sleutel uit zijn link (op=gesprek).
  if (op === 'post' || op === 'gesprek') {
    if (req.method !== 'POST') return stuur(res, 405, 'application/json', '{"ok":false}', 'no-store');
    try { const b = await leesBody(req); if (JSON.stringify(b).length > 4096) return stuur(res, 400, 'application/json', '{"ok":false}', 'no-store', '', 'noindex, nofollow');
      const mailer = maakMailer(kv); let r;
      if (op === 'post') { const c = await anonymous.control('receipt', b); if (c.status !== 200) return stuur(res, 404, 'application/json', '{"ok":false}', 'no-store', '', 'noindex, nofollow'); r = await eigenaarPost(kv, c.body.record, b, { stuurMail: mailer && mailer.koper, meld }); }
      else r = await koperPost(kv, b, { meld, seintje: mailer && mailer.eigenaar });
      return stuur(res, r.ok ? 200 : 400, 'application/json', JSON.stringify(r), 'no-store', '', 'noindex, nofollow');
    } catch { return stuur(res, 503, 'application/json', '{"ok":false,"error":"unavailable"}', 'no-store'); }
  }
  // Sealed Intent per mail (lib/sealed-mail.js): bevestigen, verlengen en keuren via een link uit een mail, inkomende mail van Resend,
  // de dagelijkse ronde "klopt dit nog?" en het instellen (alleen op de beschermde host *.vercel.app, achter de Vercel-inlog).
  if (['bevestig', 'verleng', 'keur', 'mailin', 'mailronde', 'mailzet', 'mailstand', 'mailproef', 'mailaan'].includes(op)) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const beschermd = /\.vercel\.app$/i.test(String(req.headers.host || '')), e = x => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const pag = (taal, titel, html, status = 200) => stuur(res, status, 'text/html; charset=utf-8', kleinePagina(taal, titel, '<section><h1>' + e(titel) + '</h1>' + html + '</section>'), 'private, no-store', taal, 'noindex, nofollow');
    const P = { nl: { bOk: ['Bevestigd', 'Je e-mailadres is bevestigd. Vanaf nu loopt alles via je inbox: een koper die past stelt zijn vraag per mail en zegt wie hij is. Jij beslist of je antwoordt.'], fout: ['Deze link werkt niet', 'De link is verlopen of niet compleet. Vragen? App Henkjan op +31 6 55395630.'], vQ: ['Kloppen je voorwaarden nog?', 'Eén tik en ze staan weer een week aan.', 'Ja, ze kloppen nog'], vOk: 'Je voorwaarden staan weer een week aan.' },
      en: { bOk: ['Confirmed', 'Your email address is confirmed. From now on everything runs through your inbox: a buyer who fits asks his question by email and says who he is. You decide whether to answer.'], fout: ['This link does not work', 'The link has expired or is incomplete. Questions? Message Henkjan on WhatsApp at +31 6 55395630.'], vQ: ['Do your terms still hold?', 'One tap and they are active for another week.', 'Yes, they still hold'], vOk: 'Your terms are active for another week.' },
      de: { bOk: ['Bestätigt', 'Ihre E-Mail-Adresse ist bestätigt. Ab jetzt läuft alles über Ihr Postfach: Ein passender Käufer stellt seine Frage per E-Mail und sagt, wer er ist. Sie entscheiden, ob Sie antworten.'], fout: ['Dieser Link funktioniert nicht', 'Der Link ist abgelaufen oder unvollständig. Fragen? Schreiben Sie Henkjan per WhatsApp unter +31 6 55395630.'], vQ: ['Gelten Ihre Bedingungen noch?', 'Ein Tipp, und sie sind eine weitere Woche aktiv.', 'Ja, sie gelten noch'], vOk: 'Ihre Bedingungen sind eine weitere Woche aktiv.' } };
    const knopJs = (body, klaar) => `<script>document.querySelectorAll('[data-k]').forEach(function(b){b.onclick=function(){var d=${JSON.stringify(body)};d.ok=b.getAttribute('data-k')==='1';document.querySelectorAll('[data-k]').forEach(function(x){x.disabled=true});fetch(location.pathname+'?op=${op}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)}).then(function(r){return r.json()}).then(function(j){document.getElementById('uit').textContent=j.ok?(${klaar}):'Dat ging niet goed.'}).catch(function(){document.getElementById('uit').textContent='Dat ging niet goed.'})}})</script>`;
    try {
      if (op === 'bevestig') { const r = await MAIL.bevestig(kv, q.get('i'), q.get('s'), { meld }), t = r.taal || kiesTaal(req) || 'en'; return r.ok ? pag(t, P[t].bOk[0], '<p>' + e(P[t].bOk[1]) + '</p>') : pag(t, P[t].fout[0], '<p>' + e(P[t].fout[1]) + '</p>', 404); }
      if (op === 'verleng') {
        if (req.method === 'POST') { const b = await leesBody(req), r = await MAIL.verleng(kv, b.i, b.s); return stuur(res, r.ok ? 200 : 404, 'application/json', JSON.stringify({ ok: r.ok }), 'no-store'); }
        const i = q.get('i') || '', s = q.get('s') || '', rec = MAIL.linkKlopt('verleng', i, s) ? await kv.get('si:i:' + i).catch(() => null) : null, t = (rec && UI[rec.language] && rec.language) || kiesTaal(req) || 'en';
        if (!rec) return pag(t, P[t].fout[0], '<p>' + e(P[t].fout[1]) + '</p>', 404);
        return pag(t, P[t].vQ[0], '<p id="uit">' + e(P[t].vQ[1]) + '</p><p><button class="btn" data-k="1">' + e(P[t].vQ[2]) + '</button></p>' + knopJs({ i, s }, JSON.stringify(P[t].vOk)));
      }
      if (op === 'keur') {
        if (req.method === 'POST') { const b = await leesBody(req), r = await MAIL.keur(kv, b.t, b.n, b.s, b.ok === true); return stuur(res, r.ok ? 200 : 404, 'application/json', JSON.stringify(r), 'no-store'); }
        const t = q.get('t') || '', n = q.get('n') || '', s = q.get('s') || '', k = await MAIL.keurBeeld(kv, t, n, s);
        if (!k) return pag('nl', P.nl.fout[0], '<p>' + e(P.nl.fout[1]) + '</p>', 404);
        const kaart = (kop, x) => '<div class="kaart" style="margin:0 0 16px"><div class="kt"><b>' + e(kop) + '</b></div>' + x.split('\n').map(r => '<div class="kr"><span>' + e(r) + '</span></div>').join('') + '</div>';
        return pag('nl', k.wie, '<p style="white-space:pre-wrap">' + e(k.tekst) + '</p>' + (k.afwijkend ? '<p><b>Let op: verstuurd vanaf een ander adres dan bij ons bekend.</b></p>' : '') + '<p id="uit">' + (k.wacht ? 'Doorlaten of tegenhouden?' : k.weg ? 'Al tegengehouden.' : 'Al doorgelaten.') + '</p>' + (k.wacht ? '<p><button class="btn" data-k="1">Laat door</button><button class="btn" data-k="0" style="background:#fff;color:#111113">Houd tegen</button></p>' : '') + kaart('Eigenaar', k.eigenaar) + kaart('Koper', k.koper) + knopJs({ t, n, s }, "j.door?(j.verstuurd?'Doorgelaten en verstuurd.':'Doorgelaten, maar de mail ging niet weg (staat de mail aan?).'):'Tegengehouden.'"));
      }
      if (op === 'mailin') { if (req.method !== 'POST') return stuur(res, 405, 'application/json', '{"ok":false}', 'no-store'); const b = await leesBody(req); const r = await MAIL.mailIn(kv, b, { meld, ai: o => berichten({ ...o, model: HAIKU }) }); return stuur(res, 200, 'application/json', JSON.stringify({ ok: r.ok, waarom: r.waarom }), 'no-store'); }
      if (op === 'mailronde') return stuur(res, 200, 'application/json', JSON.stringify(await MAIL.ronde(kv)), 'no-store');
      if (!beschermd) return stuur(res, 404, 'application/json', '{}', 'no-store');
      if (op === 'mailzet') return stuur(res, 200, 'application/json', JSON.stringify({ domein: await MAIL.domein(kv, q.get('maak') === '1'), haak: q.get('maak') === '1' ? await MAIL.haak(kv, BASE + '/?op=mailin') : undefined }, null, 1), 'no-store');
      if (op === 'mailaan') { if (q.get('zet') === '1' || q.get('zet') === '0') await kv.set('si:mail:aan', q.get('zet') === '1' ? 1 : 0); return stuur(res, 200, 'application/json', JSON.stringify(await MAIL.mailStand(kv), null, 1), 'no-store'); }
      if (op === 'mailstand') return stuur(res, 200, 'application/json', JSON.stringify(await MAIL.mailStand(kv), null, 1), 'no-store');
      if (op === 'mailproef') { const v = MAIL.voorbeelden(q.get('taal') || 'nl'); return stuur(res, 200, 'text/plain; charset=utf-8', Object.entries(v).map(([k, [o, x]]) => '== ' + k + ' ==\nOnderwerp: ' + o + '\n\n' + x).join('\n\n\n') + '\n', 'no-store'); }
    } catch (err) { return stuur(res, 503, 'application/json', JSON.stringify({ ok: false, error: 'unavailable' }), 'no-store'); }
  }
  if (op === 'kopers') {
    if (!process.env.HJDK_TOKEN || q.get('token') !== process.env.HJDK_TOKEN) return stuur(res, 403, 'application/json', '{"ok":false}', 'no-store');
    return stuur(res, 200, 'application/json', JSON.stringify({ ...(await lijstKopers(kv)), mailAan: !!process.env.SEALED_MAIL_FROM || await MAIL.mailAan(kv), gesprekken: await gesprekkenLijst(kv) }, null, 1), 'no-store');
  }
  if (op === 'indexnow') return eigenaar(op, res);
  if (op === 'intents') {
    if (!process.env.HJDK_TOKEN || q.get('token') !== process.env.HJDK_TOKEN) return stuur(res, 403, 'application/json', '{"ok":false}', 'no-store');
    return eigenaar(op, res);
  }
  if (op === 'overdracht') { const r = await overdracht(kv, { proefStand, proefTekst }); res.setHeader('X-Robots-Tag', 'noindex'); if (q.get('format') === 'json') return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify({ werking: VAST, stand: r }, null, 1), 'no-store', '', 'noindex'); return stuur(res, 200, 'text/plain; charset=utf-8', VAST + '\n' + overdrachtTekst(r) + '\n', 'no-store'); }
  if (op === 'robots') return stuur(res, 200, 'text/plain; charset=utf-8', ROBOTS);
  if (op === 'sitemap') return stuur(res, 200, 'application/xml; charset=utf-8', sitemap());
  if (op === 'llms') return stuur(res, 200, 'text/plain; charset=utf-8', llms());
  if (op === 'zicht') return stuur(res, 200, 'application/json; charset=utf-8', JSON.stringify(zichtJson(), null, 1));
  if (op === 'logo') return stuur(res, 200, 'image/svg+xml', LOGO_SVG, 'public, max-age=86400');
  if (op === 'icon') { const f = ICONS[q.get('f') || '']; if (!f) return stuur(res, 404, 'text/plain', '', 'no-store'); res.statusCode = 200; res.setHeader('Content-Type', f[0]); res.setHeader('Cache-Control', 'public, max-age=604800'); return res.end(Buffer.from(f[1], 'base64')); }
  if (op === 'manifest') return stuur(res, 200, 'application/manifest+json', MANIFEST, 'public, max-age=86400');
  if (op === 'key') return stuur(res, 200, 'text/plain; charset=utf-8', INDEXNOW_KEY, 'public, max-age=86400');
  const taal = q.get('taal') || '', slug = q.get('slug') || '';
  const opts = { gscMeta: GSC_META };
  if (!taal) {
    res.setHeader('Vary', 'Accept-Language, Cookie');
    const k = kiesTaal(req);
    if (k) { res.statusCode = 302; res.setHeader('Location', '/' + k + (u.search || '')); res.setHeader('Cache-Control', 'private, no-store'); return res.end(); }
    return stuur(res, 200, 'text/html; charset=utf-8', renderChatPage('en', null, { ...opts, growthScript: GROWTH_SCRIPT, links: infoLinks('en') }), 'private, no-store', 'en');
  }
  const chatOpts = { ...opts, growthScript: GROWTH_SCRIPT };
  // Onbekend adres: dezelfde chatpagina als de voordeur, met 404 en noindex (de oude blauwe hub is weg).
  const nietGevonden = t => stuur(res, 404, 'text/html; charset=utf-8', renderChatPage(t, null, { ...chatOpts, links: infoLinks(t), noindex: true }), 'public, max-age=60', t);
  if (!UI[taal]) return nietGevonden('en');
  if (!slug) return stuur(res, 200, 'text/html; charset=utf-8', renderChatPage(taal, null, { ...chatOpts, links: infoLinks(taal) }), 'public, max-age=60, s-maxage=300', taal);
  if (zoekLp(taal, slug)) return stuur(res, 200, 'text/html; charset=utf-8', renderChatPage(taal, zoekLp(taal, slug), chatOpts), 'public, max-age=60, s-maxage=300', taal, LP_INDEX ? '' : 'noindex, follow');
  // Opgeruimd 17 nov 2026 (Henkjan: "Ja prima voer door"): executive-pagina's, oud formulier, oude partijpagina en 'goede reactie' sturen door.
  const naar = doorsturen(taal, slug);
  if (naar) { res.statusCode = 301; res.setHeader('Location', naar); res.setHeader('Cache-Control', 'public, max-age=3600'); res.setHeader('X-Robots-Tag', 'noindex'); return res.end(); }
  const info = infoPagina(taal, slug, { mail: await MAIL.mailAan(kv).catch(() => false) });
  if (info) return stuur(res, 200, 'text/html; charset=utf-8', renderChatPage(taal, null, { ...chatOpts, pagina: info, links: infoLinks(taal, slug) }), 'public, max-age=60, s-maxage=300', taal);
  if (slug === 'gesprek') return stuur(res, 200, 'text/html; charset=utf-8', renderThreadPage(taal), 'private, no-store', taal, 'noindex, nofollow');
  if (slug === 'manage') return stuur(res, 200, 'text/html; charset=utf-8', renderManagePage(taal), 'private, no-store', taal, 'noindex, nofollow');
  return nietGevonden(taal);
}
