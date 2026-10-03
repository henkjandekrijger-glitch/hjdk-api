// /t/<pagina> — snel lerende bol-pagina (zelfde aanpak als rereview.app/today, vertaald naar bol):
//  - zoek-eerst: zoekbalk + snelle zoekknoppen; zoeken gaat via de bol-API en toont producten OP deze pagina (elke uitgaande link is productspecifiek = volle commissie; nooit een bol-zoekpagina linken = 3%)
//  - rijen met producten (2 naast elkaar, grote foto, prijs met tijdstip, sterren), "Meer laden"
//  - leert per opbouw (zoek/grid), per rij en per product (klik per vertoning), per echt mens (hum: pas bij scroll/tik; 1x per dag per persoon via vid)
//  - postback naar het netwerk bij een productklik (echte koopintentie); subid t_<pagina>-Z<zone>-<opbouw>
//  - ?zone=test telt niet mee. ?q=... = zoekopdracht van de bezoeker (wordt ook vanzelf een knop als hij vaker voorkomt)
import { kv } from '../lib/db.js';
import { searchCached } from '../lib/bol.js';

const BOL_SITE = process.env.BOL_BRIDGE_SITE || '1545836';
const MD_POSTBACK = 'https://postback.mondiad.com/track?uid=31070&clickid={clickid}&payout=0.01';
const PA_POSTBACK = 'https://ad.propellerads.com/conversion.php?aid=3772727&pid=&tid=151850&visitor_id={clickid}&payout=0.01';
const pbFor = (src) => /propeller|propads|^pa$/i.test(String(src || '')) ? PA_POSTBACK : MD_POSTBACK;
const LAYOUTS = ['zoek', 'grid'];
// pagina's: kop, snelle zoekknoppen, rijen (zoekterm bij bol). Aanvullen in KV 'hjdk:tpages' (zelfde vorm) zonder deploy.
const PAGES = {
  'keuken-klein': { title: 'Slim kiezen voor een kleine keuken', sub: 'Echte prijzen van bol, elke 20 minuten ververst.', chips: ['afvalemmer', 'microvezeldoek', 'afwasteil', 'gootsteenorganiser', 'kruidenrek', 'opbergbakken keukenkast'],
    rows: [{ t: 'Populair voor een kleine keuken', q: 'kleine keuken opbergen' }, { t: 'Afvalemmers die onder het blad passen', q: 'pedaalemmer 12 liter' }, { t: 'Onder €25', q: 'keuken organizer', max: 25 }, { t: 'Schoonmaken zonder gedoe', q: 'microvezeldoek vileda' }] },
  'huishouden': { title: 'Huishouden slim aanpakken', sub: 'Echte prijzen van bol, elke 20 minuten ververst.', chips: ['droogrek', 'vloerwisser', 'wasmand', 'strijkplank', 'pedaalemmer', 'douchewisser'],
    rows: [{ t: 'Populair in huishouden', q: 'huishouden handig' }, { t: 'Weinig plek voor de was', q: 'droogrek klein' }, { t: 'Onder €25', q: 'schoonmaak set', max: 25 }, { t: 'Badkamer', q: 'badkamer organizer' }] }
};
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const eur = v => (v == null || isNaN(v)) ? '' : '€' + Number(v).toFixed(2).replace('.', ',');
const tijd = ts => { try { return new Date(ts || Date.now()).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }); } catch (e) { return ''; } };
const stars = r => r == null ? '' : '<span class="st">' + '★'.repeat(Math.round(r)) + '<span class="dim">' + '★'.repeat(5 - Math.round(r)) + '</span></span> <span class="rn">' + Number(r).toFixed(1).replace('.', ',') + '</span>';
const num = v => Number(v) || 0;
function gam(k) { let s = 0; const n = Math.max(1, Math.round(k)); for (let i = 0; i < n; i++) s += -Math.log(1 - Math.random()); return s * (k / n); }
function beta(succ, fail) { const a = gam(succ + 1), b = gam(fail + 1); return a / (a + b); }

export default async function handler(req, res) {
  const q = req.query || {};
  res.setHeader('cache-control', 'no-store');
  const pageId = String(q.page || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  let pages = PAGES; try { const extra = await kv.get('hjdk:tpages'); if (extra && typeof extra === 'object') pages = Object.assign({}, PAGES, extra); } catch (e) {}
  const P = pages[pageId]; if (!P) return res.status(404).send('onbekende pagina');
  const zoneRaw = String(q.zoneid || q.zone || ''); const isTest = /test/i.test(zoneRaw); const zone = zoneRaw.replace(/\D/g, '').slice(0, 8) || '0';
  const clickid = String(q.clickid || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
  const country = String(q.country || 'NL').toUpperCase() === 'BE' ? 'BE' : 'NL';
  const search = clean(String(q.q || '')).slice(0, 60);
  // opbouw kiezen (leert op klik per mens)
  const lk = LAYOUTS.flatMap(l => ['c:hjdk6-tl-' + pageId + '-' + l + '-hum', 'c:hjdk6-tl-' + pageId + '-' + l + '-clk']);
  let lv = []; try { lv = await kv.mget(...lk); } catch (e) {}
  let layout = LAYOUTS.indexOf(String(q.v || '')) >= 0 ? String(q.v) : '';
  if (!layout) { let best = -1; LAYOUTS.forEach((l, i) => { const hum = num(lv[i * 2]), clk = num(lv[i * 2 + 1]); const s = beta(clk, Math.max(0, hum - clk)); if (s > best) { best = s; layout = l; } }); }
  // rijen ophalen (zoekopdracht van de bezoeker bovenaan als die er is)
  const rows = []; const specs = search ? [{ t: 'Resultaten voor "' + search + '"', q: search, key: 'q' }].concat(P.rows.map((r, i) => Object.assign({ key: 'r' + i }, r))) : P.rows.map((r, i) => Object.assign({ key: 'r' + i }, r));
  const results = await Promise.all(specs.map(sp => searchCached(sp.q, { country, size: 12, sort: sp.max ? 'POPULARITY' : 'RELEVANCE' }).catch(() => ({ products: [], at: Date.now() }))));
  // per product leren: klik per vertoning; volgorde binnen de rij met wat toeval
  const pkeys = []; results.forEach(r => r.products.forEach(p => pkeys.push('c:hjdk6-tp-' + pageId + '-' + p.id + '-imp', 'c:hjdk6-tp-' + pageId + '-' + p.id + '-clk')));
  let pv = []; try { pv = pkeys.length ? await kv.mget(...pkeys) : []; } catch (e) {}
  const stat = {}; pkeys.forEach((k, i) => { stat[k.slice(2)] = num(pv[i]); });
  specs.forEach((sp, i) => { let list = results[i].products.filter(p => p.url && p.image && p.price != null); if (sp.max) list = list.filter(p => p.price <= sp.max);
    list = list.map(p => ({ p, s: beta(stat['hjdk6-tp-' + pageId + '-' + p.id + '-clk'], Math.max(0, stat['hjdk6-tp-' + pageId + '-' + p.id + '-imp'] - stat['hjdk6-tp-' + pageId + '-' + p.id + '-clk'])) })).sort((x, y) => y.s - x.s).map(x => x.p).slice(0, 6);
    if (list.length) rows.push({ t: sp.t, q: sp.q, key: sp.key, at: results[i].at, products: list }); });
  // aankomst tellen (server), vertoningen per product
  if (!isTest) { const hits = [['c:hjdk6-t-' + pageId + '-arr', 1], ['c:hjdk6-tz-' + pageId + '-' + zone + '-arr', 1], ['c:hjdk6-tl-' + pageId + '-' + layout + '-arr', 1]]; rows.forEach(r => r.products.forEach(p => hits.push(['c:hjdk6-tp-' + pageId + '-' + p.id + '-imp', 1]))); if (search) hits.push(['c:hjdk6-tq-' + pageId + '-' + search.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40), 1]); try { await kv.incrMany(hits); } catch (e) {} }
  const subid = ('t_' + pageId.slice(0, 20) + '-Z' + zone + '-' + layout[0]).replace(/[^A-Za-z0-9_-]/g, '');
  const deep = (u) => 'https://partner.bol.com/click/click?p=1&t=url&s=' + BOL_SITE + '&f=TXL&url=' + encodeURIComponent(u.replace(/[?#].*$/, '')) + '&subid=' + encodeURIComponent(subid);
  const postback = clickid ? pbFor(q.utm_source).replace('{clickid}', encodeURIComponent(clickid)) : '';
  const self = '/t/' + pageId + '?' + ['utm_source', 'zoneid', 'clickid', 'campaignid', 'creativeid', 'v'].filter(k => q[k]).map(k => k + '=' + encodeURIComponent(String(q[k]))).join('&');
  const card = (p, rk) => `<a class="pc" data-p="${esc(p.id)}" data-r="${esc(rk)}" href="${esc(deep(p.url))}" rel="sponsored noopener"><img src="${esc(p.image)}" alt="" loading="lazy" decoding="async"><div class="pt">${esc(p.title.slice(0, 70))}</div><div class="pp">${eur(p.price)}${p.strike != null && p.strike > p.price ? ' <s>' + eur(p.strike) + '</s>' : ''}</div>${p.rating != null ? '<div class="rt">' + stars(p.rating) + '</div>' : ''}<span class="bb">Bekijk bij bol →</span></a>`;
  const rowHtml = r => `<section class="row" data-row="${esc(r.key)}"><h2>${esc(r.t)} <span class="at">prijzen gezien ${tijd(r.at)}</span></h2><div class="grid">${r.products.map(p => card(p, r.key)).join('')}</div></section>`;
  const searchBox = `<form class="sf" method="get" action="/t/${esc(pageId)}">${['utm_source', 'zoneid', 'clickid', 'campaignid', 'creativeid'].filter(k => q[k]).map(k => `<input type="hidden" name="${k}" value="${esc(String(q[k]))}">`).join('')}<input class="si" type="search" name="q" value="${esc(search)}" placeholder="Wat zoek je? bijv. ${esc(P.chips[0])}" aria-label="Zoeken"><button class="sb" type="submit">Zoek</button></form><div class="chips">${P.chips.map(c => `<a class="ch" href="${esc(self)}&q=${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}</div>`;
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(P.title)}</title>
<style>body{margin:0;font:16px/1.45 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;background:#f6f7f9;color:#111}main{max-width:640px;margin:0 auto;padding:14px 12px 40px}h1{font-size:22px;line-height:1.25;margin:0 0 4px}.sub{color:#6b7280;font-size:13px;margin:0 0 12px}.sf{display:flex;gap:8px;margin:0 0 8px}.si{flex:1;font:17px system-ui;padding:12px 14px;border:2px solid #0000ff;border-radius:12px;min-width:0}.sb{background:#0000ff;color:#fff;border:0;border-radius:12px;padding:0 18px;font-weight:700;font-size:16px}.chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 16px}.ch{background:#fff;border:1px solid #e5e7eb;border-radius:999px;padding:6px 12px;font-size:14px;color:#111;text-decoration:none}.row{margin:0 0 18px}h2{font-size:16px;margin:0 0 8px}.at{color:#9ca3af;font-weight:400;font-size:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pc{display:block;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px;text-decoration:none;color:#111}.pc img{width:100%;aspect-ratio:1;object-fit:contain;background:#fff;border-radius:8px;display:block}.pt{font-size:13px;line-height:1.3;margin:8px 0 4px;min-height:34px}.pp{font-weight:800;font-size:17px}.pp s{color:#9ca3af;font-weight:400;font-size:13px;margin-left:4px}.rt{margin:2px 0 6px}.st{color:#f59e0b;font-size:12px}.st .dim{color:#e5e7eb}.rn{font-size:12px;color:#6b7280}.bb{display:block;text-align:center;background:#0000ff;color:#fff;font-weight:700;border-radius:9px;padding:9px;font-size:14px;margin-top:6px}small{display:block;margin-top:18px;color:#9ca3af;font-size:12px;text-align:center}.top{margin-bottom:14px}</style></head>
<body><main><h1>${esc(P.title)}</h1><p class="sub">${esc(P.sub || '')}</p>
${layout === 'zoek' ? '<div class="top">' + searchBox + '</div>' : ''}
${rows.map(rowHtml).join('') || '<p>Even geen producten gevonden. Probeer een zoekwoord.</p>'}
${layout === 'grid' ? '<div class="top">' + searchBox + '</div>' : ''}
<small>Affiliate-links: yoo.rs ontvangt een vergoeding van bol, de prijs verandert niet. Prijzen komen van bol en kunnen wijzigen.</small></main>
<script>(function(){var A='/api/hjdk/stats/hits',P=${JSON.stringify(pageId)},Z=${JSON.stringify(zone)},L=${JSON.stringify(layout)},T=${JSON.stringify(isTest)},PB=${JSON.stringify(postback)};
function send(hs){if(T)return;try{var b=JSON.stringify({hits:hs});if(navigator.sendBeacon&&navigator.sendBeacon(A,new Blob([b],{type:'text/plain'})))return;fetch(A,{method:'POST',keepalive:true,headers:{'content-type':'text/plain'},body:b});}catch(e){}}
var vid='';try{vid=localStorage.getItem('hjdk-vid')||'';if(!vid){vid=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('hjdk-vid',vid);}}catch(e){}
var day=new Date().toISOString().slice(0,10);function once(m){try{var k='hjdk-t-'+P+'-'+m+'-'+day;if(localStorage.getItem(k))return false;localStorage.setItem(k,'1');}catch(e){}return true;}
function base(m){return [['hjdk6-t-'+P+'-'+m,1],['hjdk6-tz-'+P+'-'+Z+'-'+m,1],['hjdk6-tl-'+P+'-'+L+'-'+m,1]];}
send(base('view'));
var hum=false;function onHum(){if(hum)return;hum=true;if(once('hum'))send(base('hum'));}
['scroll','touchstart','pointermove','mousemove','keydown'].forEach(function(ev){addEventListener(ev,onHum,{once:true,passive:true});});
var clicked=false;document.querySelectorAll('a.pc').forEach(function(g){['click','auxclick'].forEach(function(ev){g.addEventListener(ev,function(){var h=[['hjdk6-tp-'+P+'-'+g.getAttribute('data-p')+'-clk',1],['hjdk6-tr-'+P+'-'+g.getAttribute('data-r')+'-clk',1]];if(!clicked){clicked=true;if(once('clk'))h=h.concat(base('clk'));if(PB){try{fetch(PB,{mode:'no-cors',keepalive:true});}catch(e){}}}send(h);});});});
document.querySelectorAll('.sf').forEach(function(f){f.addEventListener('submit',function(){send([['hjdk6-t-'+P+'-search',1]]);});});})();</script></body></html>`;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
