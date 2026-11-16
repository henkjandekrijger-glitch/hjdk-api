import { anonymousService, CHANNELS } from '../lib/sealed-anonymous.js';
// Sealed Intent (sealedintent.com). Alle verzoeken op die host komen via vercel.json hier binnen.
// Pagina's: / (voordeur), /nl /de /en (hub), /<taal>/<slug> (landingspagina). Verder robots.txt, sitemap.xml, llms.txt, zicht.json,
// logo.svg en het IndexNow-sleutelbestand. POST ?op=intent bewaart een verzegelde intentie en meldt hem via Telegram.
// Eigenaar: ?op=intents&token=HJDK_TOKEN (laatste 50, e-mail gemaskeerd). ?op=indexnow pingt alle URL's één keer per versie (BIJGEWERKT);
// daarna geeft hij alleen de bewaarde uitkomst terug, dus veilig om aan te roepen (kost niets, nooit in een lus).
import { kv } from '../lib/db.js';
import { PAGINAS, UI, BIJGEWERKT } from '../lib/sealed-content.js';
import { ICONS } from '../lib/sealed-icons.js';
import { VAST, overdracht, overdrachtTekst } from '../lib/sealed-overdracht.js';
import { proefStand, proefTekst } from '../lib/proef.js';
import { renderSealedSpecial, renderPartij, zoekPartij, PARTIJ_INDEX } from '../lib/sealed.js';
import { renderPagina, renderHub, renderVoordeur, zoekPagina, sitemap, ROBOTS, llms, zichtJson, LOGO_SVG, INDEXNOW_KEY, BASE, HOST, url } from '../lib/sealed.js';

const anonymous = anonymousService(kv);
const INDEX_VERSION = BIJGEWERKT + '-anonymous-v2';
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
const MANIFEST = JSON.stringify({ name: 'Sealed Intent', short_name: 'Sealed Intent', start_url: '/', display: 'browser', background_color: '#ffffff', theme_color: '#2B47C4', icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }] });

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
  if(op==='growth'){const days=Array.from({length:7},(_,i)=>new Date(Date.now()-i*864e5).toISOString().slice(0,10)),counts={};for(const d of days){counts[d]={};for(const c of CHANNELS)counts[d][c]={browserSignals:+(await kv.get('si:visit:'+d+':'+c).catch(()=>0))||0,submissions:+(await kv.get('si:conversion:'+d+':'+c).catch(()=>0))||0};}return stuur(res,200,'application/json',JSON.stringify({basis:'Aggregate browser signals; not verified unique humans or confirmed search clicks. Submissions include both intent and counterparty sample replies.',days:counts}),'no-store');}
  if(op==='visit'&&req.method==='POST'){const b=await leesBody(req);if(!CHANNELS.includes(b.channel)||/bot|crawler|spider|headless/i.test(String(req.headers['user-agent']||'')))return stuur(res,400,'application/json','{"ok":false}','no-store');const k='si:visit:'+new Date().toISOString().slice(0,10)+':'+b.channel;try{await kv.incr(k);await kv.raw(['EXPIRE',k,100*86400]);}catch{}return stuur(res,200,'application/json','{"ok":true}','no-store');}
  if (req.method === 'OPTIONS') return stuur(res, 204, 'text/plain', '', 'no-store');
  if (['intent','partij','receipt','withdraw'].includes(op)) {
    if(req.method!=='POST')return stuur(res,405,'application/json','{"ok":false}','no-store');
    return anonymousRequest(req,res,op);
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
    return stuur(res, 200, 'text/html; charset=utf-8', renderVoordeur(opts), 'private, no-store', 'en');
  }
  if (!UI[taal]) return stuur(res, 404, 'text/html; charset=utf-8', renderVoordeur(opts), 'public, max-age=60');
  if (!slug) return stuur(res, 200, 'text/html; charset=utf-8', renderHub(taal, opts), undefined, taal);
  if (zoekPartij(taal, slug)) { const aantal = +(await kv.get('si:n').catch(() => 0)) || 0; return stuur(res, 200, 'text/html; charset=utf-8', renderPartij(taal, { ...opts, aantal }), 'public, max-age=60, s-maxage=300', taal, PARTIJ_INDEX ? '' : 'noindex, follow'); }
  const special=renderSealedSpecial(taal,slug,opts);
  if(special){const priv=['seal','manage','partners'].includes(slug);return stuur(res,200,'text/html; charset=utf-8',special,priv?'private, no-store':undefined,taal,priv?'noindex, follow':'');}
  const p = zoekPagina(taal, slug);
  if (!p) return stuur(res, 404, 'text/html; charset=utf-8', renderHub(taal, opts), 'public, max-age=60');
  return stuur(res, 200, 'text/html; charset=utf-8', renderPagina(p, opts), undefined, taal);
}

