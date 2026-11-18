import { koopBlok, koopMeetScript } from '../lib/koopblok.js';
// Zelfstandige dienstkeuzehulpen binnen de bestaande drie sites.
// Geen aankoop of domeinregistratie: uitsluitend een openbare beschikbaarheidsopvraag.
import { createHash } from 'node:crypto';
import { kv } from '../lib/db.js';
import { look, ACCENTS, lookNieuw } from '../lib/look.js';
import { DOMAIN_GUIDES, LAADPAAL_ITEM, UPDATED_TOOLS } from '../lib/keuze-extra-content.js';
import { THEMA_GUIDES } from '../lib/thema-gidsen.js';
import { renderThema, themaSchema, THEME_CLIENT, portionCost, heatCost, themeAdvice } from '../lib/thema-tools.js';
import { TOOL_CLIENT } from '../lib/keuze-client.js';
import { esc, TOOL_CSS, DOMAIN_TLDS, validDomain, normalizeLabel, nameScore, suggestDomains, normalizeQuotes, annualCosts, renderDomain, domainSchema, laadAdvice, laadResult, renderLaadpaal, laadProducts, selectChargers } from '../lib/keuze-tools.js';

const RATE = new Map();
async function rateAllowed(req) {
  const network = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
  const id = createHash('sha256').update(network + ':' + Math.floor(Date.now() / 60000)).digest('hex').slice(0, 24);
  try { const k = 'tool:domain:rate:' + id, n = await kv.incr(k); if (n === 1) await kv.raw(['EXPIRE', k, '120']); return n <= 12; }
  catch { const now = Date.now(); for (const [k, v] of RATE) if (now - v.at > 120000) RATE.delete(k); if (RATE.size > 1000 && !RATE.has(id)) return false; const r = RATE.get(id) || { at: now, n: 0 }; r.n++; RATE.set(id, r); return r.n <= 12; }
}
const rules = () => 'const DOMAIN_TLDS = new Set(' + JSON.stringify([...DOMAIN_TLDS]) + ');\n' + [validDomain, normalizeLabel, nameScore, suggestDomains, annualCosts].map(fn => 'export ' + fn.toString()).join('\n');
async function chargerProducts(route) {
  const a = laadAdvice(route);
  // Alleen voor een bekende 3-fasenaansluiting. Geen modeltoezegging voor VvE, straat of onbekende aansluiting.
  if (a.mode !== 'home' || a.route[1] !== 2) return [];
  try {
    const { searchCached } = await import('../lib/bol.js');
    const wish = a.route[2], feature = ['', 'zonnestroom', 'dynamisch laden', 'MID meter'][wish];
    const result = await Promise.race([searchCached('laadpaal auto 11 kW ' + feature, { country: 'NL', size: 24, sort: 'RELEVANCE' }), new Promise(resolve => setTimeout(() => resolve({ products: [] }), 5500))]);
    const candidates = selectChargers((result.products || []).filter(p => !wish || (wish === 1 ? /zonne|solar|pv/i : wish === 2 ? /dynamisch|dynamic|tarie[fv]/i : /\bmid\b|verreken/i).test(p.title)));
    return candidates.map(p => ({ checkedAt: result.at || null, id: String(p.id).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40), title: p.title, price: p.price, url: 'https://partner.bol.com/click/click?p=1&t=url&s=1547300&f=TXL&url=' + encodeURIComponent(p.url) + '&subid=' + encodeURIComponent('kz_laadpaal-' + a.route.join('')) }));
  } catch { return []; }
}
function document(g, body, schema, tool) {
  const canonical = 'https://' + g.host + '/' + g.slug;
  const translations = THEMA_GUIDES[tool] ? Object.values(THEMA_GUIDES[tool]).map(x => '<link rel="alternate" hreflang="' + x.lang + '" href="https://' + x.host + '/' + x.slug + '">').join('') : tool === 'domain' ? Object.values(DOMAIN_GUIDES).map(x => '<link rel="alternate" hreflang="' + x.lang + '" href="https://' + x.host + '/' + x.slug + '">').join('') + '<link rel="alternate" hreflang="en" href="https://whichtobuy.best/domain-name"><link rel="alternate" hreflang="x-default" href="https://whichtobuy.best/domain-name">' : '';
  return '<!doctype html><html lang="' + g.lang + '"><head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2064%2064%27%3E%3Crect%20width%3D%2764%27%20height%3D%2764%27%20rx%3D%2714%27%20fill%3D%27%232B47C4%27%2F%3E%3Cpath%20d%3D%27M18%2033l9%209%2019-20%27%20fill%3D%27none%27%20stroke%3D%27%23fff%27%20stroke-width%3D%277%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"><title>' + esc(g.title) + '</title><meta name="description" content="' + esc(g.description) + '"><link rel="canonical" href="' + canonical + '">' + translations + '<meta property="og:type" content="website"><meta property="og:title" content="' + esc(g.title) + '"><meta property="og:description" content="' + esc(g.description) + '"><meta property="og:url" content="' + canonical + '"><meta property="og:locale" content="' + g.lang.replace('-', '_') + '"><meta property="og:site_name" content="' + esc(g.site) + '"><meta name="twitter:card" content="summary"><link rel="alternate" type="text/plain" href="/llms.txt"><style>' + lookNieuw() + TOOL_CSS + '.table-scroll{overflow-x:auto}.guide-table{min-width:420px}section.txt{margin:32px 0}</style><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head><body><header class="topbar"><div class="wrap"><a class="mark" href="/">' + esc(g.site) + '</a><nav class="topnav" aria-label="Menu"><a href="/">' + esc(g.ui.home) + '</a></nav></div></header><main><div class="wrap">' + body + '</div></main><footer><div class="wrap">' + esc(g.site) + ' · AdsFair B.V. · <a href="/privacy">' + (g.id === 'de' ? 'Datenschutz' : 'Privacy') + '</a><p>' + (THEMA_GUIDES[tool] ? (g.id === 'de' ? 'Unabhängige Kaufhilfe. Partnerlinks können eine Vergütung ergeben.' : 'Onafhankelijke keuzehulp. Bij aankopen via partnerlinks kunnen wij een vergoeding ontvangen.') : tool === 'laadpaal' ? 'Vergelijk laadoplossingen en stroomkosten voor jouw situatie.' : g.id === 'nl' ? 'Onafhankelijke keuzehulp. De naamgenerator is gratis; er worden geen domeinen geregistreerd.' : g.id === 'de' ? 'Unabhängiger Ratgeber. Der Namensgenerator ist kostenlos; es werden keine Domains registriert.' : 'Independent guide. The name generator is free and does not register domains.') + '</p></div></footer>' + koopMeetScript() + '<script defer src="/api/vindbaarheid?op=tracker&v=2"></script></body></html>';
}
function laadSchema() {
  const url = 'https://keuzehulp.best/laadpaal';
  return { '@context': 'https://schema.org', '@graph': [{ '@type': 'Article', headline: LAADPAAL_ITEM.h1, description: LAADPAAL_ITEM.intro, inLanguage: 'nl-NL', datePublished: UPDATED_TOOLS, dateModified: UPDATED_TOOLS, mainEntityOfPage: url, author: { '@type': 'Organization', name: 'Keuzehulp', url: 'https://keuzehulp.best' }, publisher: { '@type': 'Organization', name: 'Keuzehulp', url: 'https://keuzehulp.best' } }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Keuzehulp', item: 'https://keuzehulp.best/' }, { '@type': 'ListItem', position: 2, name: 'Laadpaal kiezen', item: url }] }] };
}
export default async function handler(req, res) {
  const url = new URL(req.url, 'https://keuzehulp.best'), q = url.searchParams; let op = q.get('op') || '';
  res.setHeader('x-content-type-options', 'nosniff');
  { // huisstijl van alle keuzehulpen (lib/huisstijl.js, 18 nov 2026): elke HTML-pagina van deze rekenhulpen en gidsen krijgt dezelfde kop, voet en opmaak
    const tl = q.get('tool') || '', mk = String(q.get('market') || q.get('m') || 'nl');
    if (!/^(cur|tsc)$/.test(tl)) { const H = await import('../lib/huisstijl.js'); const st = tl === 'nexy' || /nexy\.help/.test(String(req.headers.host || '')) ? 'nexy' : mk === 'us' || mk === 'en' ? 'us' : mk === 'de' ? 'de' : 'nl';
      const G = tl === 'rdam' ? 'rotterdam' : tl === 'zorg' ? 'zorg' : tl === 'nexy' ? 'nexy' : 'rekenhulpen', P = st === 'us' ? 'wtbus' : st === 'de' ? 'wtbde' : st === 'nexy' ? 'nexy' : 'kz';
      H.metHuisstijl(res, st, { meet: { P, G }, chat: tl === 'rdam' ? { term: 'diensten in Rotterdam', slug: 'rotterdam' } : true, voetExtra: tl === 'rdam' ? 'Gegevens uit OpenStreetMap (© OpenStreetMap-bijdragers, ODbL) en reviewscores met link naar de bron; de ranglijst is onze eigen berekening' : '' }); }
  }
  if(q.get('tool')==='nexy'){ // nexy.help: AI-keuzehulp (lib/nexyhelp.js, 17 nov 2026)
    const N=await import('../lib/nexyhelp.js');
    { const pp=String(q.get('p')||'').replace(/^\/+/,''); if(!op&&pp==='sitemap.xml')op='sitemap'; else if(!op&&pp==='robots.txt')op='robots'; else if(!op&&pp==='llms.txt')op='llms'; else if(pp==='466971cbc1bbe43e6bb64a94465e4470.txt'){res.setHeader('content-type','text/plain');return res.status(200).send('466971cbc1bbe43e6bb64a94465e4470');} }
    if(op==='aanmelden'||op==='tel'){res.setHeader('cache-control','no-store');if(req.method!=='POST')return res.status(405).json({ok:false});let b=req.body;try{if(typeof b==='string')b=JSON.parse(b.slice(0,2000));}catch{b={};}b=b||{};const M=await import('../lib/nexymail.js');
      if(op==='tel'){if(/bot|crawl|spider|preview/i.test(String(req.headers['user-agent']||'')))return res.status(204).end();const w=String(b.w||'');if(/^toon_(blok|modal)$/.test(w)){await M.tel(w);if(/^[ab]$/.test(String(b.v||'')))await M.tel(w+'_v'+b.v);}return res.status(204).end();}
      const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();return res.status(200).json(await M.aanmelden(b,ip));}
    if(op==='bevestig'||op==='af'){res.setHeader('cache-control','no-store');res.setHeader('x-robots-tag','noindex');const M=await import('../lib/nexymail.js');const a=op==='bevestig'?await M.bevestig(String(q.get('t')||'')):await M.afmelden(String(q.get('t')||''));res.setHeader('content-type','text/html; charset=utf-8');const t=op==='bevestig'?(a?'<h1>You are in.</h1><p>Your first daily AI update is on its way. One short email a day, unsubscribe in one click.</p>':'<h1>That link has expired.</h1><p>Sign up again on any page of nexy.help.</p>'):(a?'<h1>You are unsubscribed.</h1><p>You will not get the daily AI update anymore.</p>':'<h1>That link does not work.</h1>');return res.status(200).send('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><meta name=robots content=noindex><title>nexy.help</title><div style="font:17px/1.6 Inter,Arial,sans-serif;max-width:560px;margin:48px auto;padding:0 20px;color:#111113">'+t+'<p><a href="https://nexy.help/" style="color:#2B47C4">Back to nexy.help</a></p></div>');}
    if(op==='ronde'||op==='mailstand'){res.setHeader('cache-control','no-store');if(!/\.vercel\.app$/i.test(String(req.headers.host||''))&&!(process.env.CRON_SECRET&&String(req.headers.authorization||'')==='Bearer '+process.env.CRON_SECRET))return res.status(403).json({ok:false});const M=await import('../lib/nexymail.js');return res.status(200).json(op==='ronde'?await M.ronde({droog:q.get('droog')==='1'}):await M.stand());}
    if(op==='wacht'){res.setHeader('cache-control','no-store');if(req.method!=='POST')return res.status(405).json({ok:false});let b=req.body;try{if(typeof b==='string')b=JSON.parse(b.slice(0,1000));}catch{b={};}const e=String((b&&b.email)||'').trim().toLowerCase();if(!/^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i.test(e))return res.status(200).json({ok:false});const {kv}=await import('../lib/db.js');const {createHash}=await import('node:crypto');const id=createHash('sha256').update('nexy:'+e).digest('hex').slice(0,32);await kv.set('nexy:wacht:'+id,{email:e,pad:String((b&&b.pad)||'').slice(0,120),at:Date.now()});await kv.raw(['SADD','nexy:wacht',id]);return res.status(200).json({ok:true});}
    if(op==='sitemap'||op==='robots'||op==='llms'){res.setHeader('content-type',op==='sitemap'?'application/xml; charset=utf-8':'text/plain; charset=utf-8');res.setHeader('cache-control','public, s-maxage=3600');return res.status(200).send(op==='sitemap'?N.sitemap():op==='robots'?N.robots():N.llms());}
    if(op==='ping'){res.setHeader('cache-control','no-store');if(!/\.vercel\.app$/i.test(String(req.headers.host||''))&&!(process.env.CRON_SECRET&&String(req.headers.authorization||'')==='Bearer '+process.env.CRON_SECRET))return res.status(403).json({ok:false});const key='466971cbc1bbe43e6bb64a94465e4470',urlList=[...new Set(N.paden())].map(p=>'https://nexy.help'+p);const r=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'content-type':'application/json; charset=utf-8'},body:JSON.stringify({host:'nexy.help',key,keyLocation:'https://nexy.help/'+key+'.txt',urlList}),signal:AbortSignal.timeout(20000)}).catch(()=>null);return res.status(200).json({n:urlList.length,status:r?r.status:'fout'});}
    { const pd='/'+String(q.get('p')||'').replace(/^\/+|\/+$/g,'').toLowerCase(); if(N.DOORSTUUR[pd]){res.setHeader('location',N.DOORSTUUR[pd]);return res.status(301).end();} }
    const html=N.pagina(String(q.get('p')||''));res.setHeader('content-type','text/html; charset=utf-8');
    if(!html){res.setHeader('x-robots-tag','noindex');return res.status(404).send('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Not found</title><p style="font:17px/1.6 Inter,Arial,sans-serif;max-width:640px;margin:40px auto;padding:0 20px">This page does not exist (anymore). <a href="/">Find the right AI for what you need</a> or <a href="/questions">see all questions</a>.</p>');}
    res.setHeader('cache-control','public, s-maxage=600, stale-while-revalidate=86400');return res.status(200).send(html);}
  if(q.get('tool')==='groepen'){ // verkeer per groep keuzehulpen, per uur (lib/kzgroepen.js, 18 nov 2026); chatvragen alleen via de vercel.app-host of met CRON_SECRET
    res.setHeader('cache-control','no-store');res.setHeader('x-robots-tag','noindex');
    const intern=/\.vercel\.app$/i.test(String(req.headers.host||''))||(process.env.CRON_SECRET&&String(req.headers.authorization||'')==='Bearer '+process.env.CRON_SECRET);
    const GR=await import('../lib/kzgroepen.js');const o=await GR.groepen({zet:intern&&q.get('zet')==='1'});if(!intern)o.chats=[];
    if(q.get('vorm')==='tekst'){res.setHeader('content-type','text/plain; charset=utf-8');return res.status(200).send(GR.groepenTekst(o));}
    return res.status(200).json({ok:true,...o,tekst:GR.groepenTekst(o)});}
  if(q.get('tool')==='stand4'){ // stand per 4 uur over alle keuzehulpen (lib/kzstand4.js, 17 nov 2026); alleen via de vercel.app-host of met CRON_SECRET
    res.setHeader('cache-control','no-store');res.setHeader('x-robots-tag','noindex');
    if(!/\.vercel\.app$/i.test(String(req.headers.host||''))&&!(process.env.CRON_SECRET&&String(req.headers.authorization||'')==='Bearer '+process.env.CRON_SECRET))return res.status(403).json({ok:false});
    const S=await import('../lib/kzstand4.js');const o=await S.stand4({zet:q.get('zet')==='1',uren:Math.min(24,Math.max(1,Number(q.get('uren'))||4))});
    if(q.get('vorm')==='tekst'){res.setHeader('content-type','text/plain; charset=utf-8');return res.status(200).send(S.stand4Tekst(o));}
    return res.status(200).json({ok:true,...o,tekst:S.stand4Tekst(o)});}
  if(q.get('tool')==='zorg'){ // zorgverzekering 2027 voor heel Nederland (lib/zorg.js, 17 nov 2026)
    const Z=await import('../lib/zorg.js');
    if(op==='sitemap'){res.setHeader('content-type','application/xml; charset=utf-8');res.setHeader('cache-control','public, s-maxage=3600');return res.status(200).send(Z.sitemap());}
    if(op==='ping'){res.setHeader('cache-control','no-store');if(!/\.vercel\.app$/i.test(String(req.headers.host||''))&&!(process.env.CRON_SECRET&&String(req.headers.authorization||'')==='Bearer '+process.env.CRON_SECRET))return res.status(403).json({ok:false});const key='466971cbc1bbe43e6bb64a94465e4470',urlList=Z.paden().map(p=>'https://keuzehulp.best/zorgverzekering'+(p?'/'+p:''));const r=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'content-type':'application/json; charset=utf-8'},body:JSON.stringify({host:'keuzehulp.best',key,keyLocation:'https://keuzehulp.best/'+key+'.txt',urlList}),signal:AbortSignal.timeout(20000)}).catch(()=>null);return res.status(200).json({n:urlList.length,status:r?r.status:'fout'});}
    const zBeschermd=/\.vercel\.app$/i.test(String(req.headers.host||''))||(process.env.CRON_SECRET&&String(req.headers.authorization||'')==='Bearer '+process.env.CRON_SECRET);
    if(op==='aanmelden'){res.setHeader('cache-control','no-store');res.setHeader('access-control-allow-origin','*');if(req.method!=='POST')return res.status(405).json({ok:false});let b=req.body;try{if(typeof b==='string')b=JSON.parse(b.slice(0,2000));}catch{b={};}const M=await import('../lib/zorgmail.js');const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();return res.status(200).json(await M.aanmelden(b||{},ip,Z.labelLijst()));}
    if(op==='ronde'||op==='check'||op==='mailstand'){res.setHeader('cache-control','no-store');res.setHeader('x-robots-tag','noindex');if(op!=='mailstand'&&!zBeschermd)return res.status(403).json({ok:false});if(op==='check'){const C=await import('../lib/zorgcheck.js');return res.status(200).json(await C.check());}const M=await import('../lib/zorgmail.js');return res.status(200).json(op==='ronde'?await M.ronde({droog:q.get('droog')==='1'}):await M.stand());}
    const pz=String(q.get('p')||'').toLowerCase();
    if(pz==='bevestig'||pz==='af'){const M=await import('../lib/zorgmail.js');res.setHeader('content-type','text/html; charset=utf-8');res.setHeader('cache-control','no-store');res.setHeader('x-robots-tag','noindex');const a=pz==='af'?await M.afmelden(String(q.get('t')||'')):await M.bevestig(String(q.get('t')||''));return res.status(200).send(pz==='af'?Z.melding(a?'Je bent afgemeld':'Link verlopen',a?'Je krijgt geen mails meer over zorgverzekeringen.':'Deze afmeldlink werkt niet meer. Je bent waarschijnlijk al afgemeld.'):Z.melding(a?'Aanmelding bevestigd':'Link verlopen',a?'Je krijgt nu een mail zodra er iets verandert aan zorgverzekeringen'+(a.labelNaam?' en aan '+a.labelNaam:'')+'. De eerste staat al in je inbox.':'Deze bevestigingslink is verlopen. Meld je opnieuw aan op de pagina.'));}
    const html=Z.pagina(pz);res.setHeader('content-type','text/html; charset=utf-8');
    if(!html){res.setHeader('x-robots-tag','noindex');return res.status(404).send('<!doctype html><meta charset=utf-8><p>Niet gevonden. <a href="/zorgverzekering">Zorgverzekering 2027 vergelijken</a></p>');}
    res.setHeader('cache-control','public, s-maxage=600, stale-while-revalidate=86400');return res.status(200).send(html);}
  if(q.get('tool')==='rdam'){ // dienstengids Rotterdam (lib/rdam.js, 17 nov 2026)
    const R=await import('../lib/rdam.js');const beschermd=/\.vercel\.app$/i.test(String(req.headers.host||''))||(process.env.CRON_SECRET&&String(req.headers.authorization||'')==='Bearer '+process.env.CRON_SECRET);
    if(op==='tik'){let b=req.body;try{if(typeof b==='string')b=JSON.parse(b.slice(0,800));}catch{b={};}res.setHeader('cache-control','no-store');return res.status(200).json(await R.tik(b||{}));}
    if(op==='ververs'){res.setHeader('cache-control','no-store');if(!beschermd)return res.status(403).json({ok:false});const r=q.get('d')?await R.ververs(q.get('d')):await R.verversOudste();const m=await R.meldNieuw().catch(e=>({fout:String(e.message||e).slice(0,80)}));return res.status(200).json({...r,indexnow:m});}
    if(op==='probe'){res.setHeader('cache-control','no-store');if(!beschermd)return res.status(403).json({ok:false});const u=String(q.get('u')||'');if(!/^https:\/\/(www\.)?(zorgkaartnederland\.nl|tandarts\.nl|werkspot\.nl|trustpilot\.com|klantenvertellen\.nl)\//.test(u))return res.status(400).json({ok:false});try{const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0 (compatible; keuzehulp.best gids)','accept-language':'nl-NL'},signal:AbortSignal.timeout(20000)});const t=await r.text();const ld=[...t.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1].slice(0,1500));if(q.get('raw')){const i=Math.max(0,t.indexOf(q.get('raw')));return res.status(200).json({status:r.status,html:t.slice(Math.max(0,i-2500),i+1500)});}return res.status(200).json({status:r.status,len:t.length,ld:ld.slice(0,4),tekst:t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,2500)});}catch(e){return res.status(200).json({fout:String(e.message||e).slice(0,100)});}}
    if(op==='zorgkaart'){res.setHeader('cache-control','no-store');if(!beschermd)return res.status(403).json({ok:false});return res.status(200).json(await R.zorgkaart(q.get('d')||'tandarts'));}
    if(op==='verrijk'){res.setHeader('cache-control','no-store');if(!beschermd)return res.status(403).json({ok:false});return res.status(200).json(q.get('d')?await R.verrijk(q.get('d'),Math.min(30,Number(q.get('n'))||25)):await R.verrijkRonde());}
    if(op==='stand'){res.setHeader('cache-control','no-store');return res.status(200).json(await R.stand());}
    if(op==='sitemap'){const x=await R.sitemap();res.setHeader('content-type','application/xml; charset=utf-8');res.setHeader('cache-control','public, s-maxage=3600');return res.status(200).send(x.xml);}
    const html=q.get('z')?await R.zaakPagina(q.get('d'),q.get('z')):q.get('d')?await R.dienstPagina(q.get('d')):await R.hub();
    res.setHeader('content-type','text/html; charset=utf-8');if(!html){res.setHeader('x-robots-tag','noindex');return res.status(404).send('<!doctype html><meta charset=utf-8><p>Niet gevonden. <a href="/rotterdam">Alle diensten in Rotterdam</a></p>');}
    res.setHeader('cache-control','public, s-maxage=300, stale-while-revalidate=3600');return res.status(200).send(html);}
  if(q.get('tool')==='intentie'){ // intentielog van de vraagbalk en het zoekvak (lib/intentie.js, 15 nov 2026); stand openbaar zonder de vragen, met vragen op de beschermde host
    const I=await import('../lib/intentie.js');res.setHeader('cache-control','no-store');res.setHeader('x-robots-tag','noindex');
    const beschermd=/\.vercel\.app$/i.test(String(req.headers.host||''))||(process.env.CRON_SECRET&&String(req.headers.authorization||'')==='Bearer '+process.env.CRON_SECRET);
    if(op==='chat'||op==='chatstand'){const C=await import('../lib/kzchat.js'); // intentiechat op alle keuzehulpen (lib/kzchat.js, 16 nov 2026)
      if(op==='chatstand')return res.status(200).json(await C.kzChatStand(beschermd).catch(()=>({ok:false})));
      if(req.method!=='POST'&&!(beschermd&&req.query.v))return res.status(405).json({ok:false}); // GET alleen beschermd, om de chat te testen
      let b=req.method==='POST'?req.body:{site:req.query.site,slug:req.query.slug,v:req.query.v,h:[],test:1};try{if(typeof b==='string'){if(b.length>6000)throw new Error('groot');b=JSON.parse(b);}}catch{return res.status(400).json({ok:false});}
      b=b||{};const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
      return res.status(200).json(await C.kzChat({site:b.site,slug:String(b.slug||'').replace(/[^a-z0-9-]/gi,'').slice(0,90),vraag:b.v,hist:b.h,ip,oidc:String(req.headers['x-vercel-oidc-token']||process.env.VERCEL_OIDC_TOKEN||''),test:!!(b.test&&beschermd)}).catch(e=>({ok:false,fout:String(e.message||e).slice(0,80)})));}
    if(op==='model'||op==='bouw'||op==='rijen'){const M=await import('../lib/intentmodel.js'); // intentiemodel (lib/intentmodel.js): samenvatting openbaar, bouwen en rijen alleen beschermd of via de cron
      if(op==='model')return res.status(200).json({ok:true,stand:await M.modelStand(kv)});
      if(!beschermd)return res.status(403).json({ok:false});
      if(op==='bouw')return res.status(200).json({ok:true,stand:await M.bouwModel(kv).catch(e=>({fout:String(e.message||e).slice(0,200)}))});
      const r=await M.modelRijen(q.get('site')||'nl'),b=q.get('bron');return res.status(200).json({ok:true,n:r.length,rijen:r.filter(x=>!b||x.bron===b).slice(0,Math.min(2000,Number(q.get('n'))||200))});}
    if(req.method==='POST'){let b=req.body;try{if(typeof b==='string'){if(b.length>2000)throw new Error('groot');b=JSON.parse(b);}}catch{return res.status(400).json({ok:false});}return res.status(200).json(await I.intentieLog(kv,b||{},req).catch(()=>({ok:false})));}
    return res.status(200).json(await I.intentieStand(kv,{vol:/\.vercel\.app$/i.test(String(req.headers.host||'')),n:Math.min(200,Number(q.get('n'))||40)}).catch(()=>({ok:false})));
  }
  if(q.get('tool')==='tsc'){const {tscHandler}=await import('../lib/tsc.js');return tscHandler(req,res,url);}
  if(q.get('tool')==='cur'){const {curHandler}=await import('../lib/cur.js');return curHandler(req,res,url);}
  if(q.get('tool')==='autohuur'){const {autohuurHandler}=await import('../lib/autohuur-curacao.js');return autohuurHandler(req,res,url,q.get('market')||'nl');}
  if(q.get('tool')==='energy'){const {energyHandler}=await import('../lib/energie-page.js');return energyHandler(req,res);}
  if(q.get('tool')==='resale'){const {resaleHandler}=await import('../lib/clothes-resale-page.js');return resaleHandler(req,res,url,q.get('market')||'nl');}
  if(q.get('tool')==='sephora'){const {sephoraHandler}=await import('../lib/sephora-page.js');return sephoraHandler(req,res);}
  if(q.get('tool')==='temu'){const {temuHandler}=await import('../lib/temu-page.js');return temuHandler(req,res);}
  if(q.get('tool')==='battery'){const {batteryHandler}=await import('../lib/stekkerbatterij-page.js');return batteryHandler(req,res);}
  if (['client','rules','theme-client','theme-rules'].includes(op)) {
    res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600'); res.setHeader('x-robots-tag', 'noindex'); return res.status(200).send(op === 'client' ? TOOL_CLIENT : op === 'theme-client' ? THEME_CLIENT : op === 'theme-rules' ? [portionCost, heatCost, themeAdvice].map(fn => 'export ' + fn.toString()).join('\n') : rules());
  }
  if (op === 'domains') {
    res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return res.status(405).json({ ok: false, error: 'POST required' }); }
    let b = req.body;
    try { if (typeof b === 'string') { if (b.length > 8192) throw new Error(); b = JSON.parse(b); } } catch { return res.status(400).json({ ok: false, error: 'Invalid JSON' }); }
    const ds = b?.domains;
    if (!Array.isArray(ds) || ds.length < 1 || ds.length > 10 || !ds.every(validDomain)) return res.status(400).json({ ok: false, error: 'Provide 1–10 valid supported domains' });
    if (!await rateAllowed(req)) return res.status(429).json({ ok: false, error: 'Please try again later' });
    if (ds.every(d => /\.(nl|de)$/.test(d))) return res.status(200).json({ ok: true, results: normalizeQuotes({}, [...new Set(ds)]), checkedAt: new Date().toISOString() });
    try {
      const response = await fetch('https://api.vercel.com/v1/registrar/domains/search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domains: [...new Set(ds)].filter(d => !/\.(nl|de)$/.test(d)) }), signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('Upstream unavailable');
      const data = await response.json(); const results = normalizeQuotes(data, [...new Set(ds)]);
      return res.status(200).json({ ok: true, results, checkedAt: new Date().toISOString() });
    } catch { return res.status(502).json({ ok: false, error: 'Availability could not be confirmed' }); }
  }
  if (op === 'laadadvies') {
    res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
    const advice = laadAdvice((q.get('a') || '').split('-')); const products = await chargerProducts(advice.route);
    return res.status(200).json({ ok: true, route: advice.route, html: laadResult(advice), productsHtml: laadProducts(products) });
  }
  if (req.method && !['GET', 'HEAD'].includes(req.method)) { res.setHeader('allow', 'GET, HEAD'); return res.status(405).send('Method not allowed'); }
  if (q.get('tool') && !['domain', 'laadpaal','acai','heat'].includes(q.get('tool'))) return res.status(404).send('Not found');
  const isLaadpaal = q.get('tool') === 'laadpaal', market = q.get('market') || 'nl', g = DOMAIN_GUIDES[market];
  if (!g || (isLaadpaal && market !== 'nl')) return res.status(404).send('Not found');
  let html, koopProducts = [];
  const theme = THEMA_GUIDES[q.get('tool')]?.[market];
  if (THEMA_GUIDES[q.get('tool')] && !theme) return res.status(404).send('Not found');
  if (theme) html = document({ ...theme, ui: { home: market === 'de' ? 'Alle Kaufhilfen' : 'Alle keuzehulpen' } }, renderThema(q.get('tool'), market), themaSchema(q.get('tool'), market), q.get('tool'));
  else if (isLaadpaal) {
    const advice = laadAdvice([q.get('q0'), q.get('q1'), q.get('q2')]); const products = await chargerProducts(advice.route); koopProducts = products;
    const evGuide = { ...g, slug: 'laadpaal', title: 'Laadpaal kiezen: thuis, VvE of openbaar laden in Nederland', description: LAADPAAL_ITEM.intro };
    html = document(evGuide, renderLaadpaal(advice.route, products), laadSchema(), 'laadpaal');
  } else html = document(g, renderDomain(g), domainSchema(g), 'domain');
  const prefix = market === 'nl' ? 'hjdk6-kz-' : 'wtb-' + market + '-';
  const slug = theme ? theme.slug : isLaadpaal ? 'laadpaal' : g.slug;
  if (!theme) html = html.replace('</div></main>', koopBlok({ market, subject: isLaadpaal ? 'een laadpaal' : 'een domeinnaam', slug, products: koopProducts, kind: isLaadpaal ? 'product' : 'domain' }) + '</div></main>');
  const ua = String(req.headers['user-agent'] || '');
  const bot = /bot|crawl|spider|ChatGPT-User|Claude-User|Perplexity-User/i.test(ua);
  if (bot) { try { await kv.incrMany([['c:' + prefix + slug + '-bot', 1]]); } catch {} }
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', isLaadpaal ? 'public, max-age=300' : 'public, max-age=600'); res.setHeader('x-robots-tag', 'index, follow');
  return res.status(200).send(html);
}


