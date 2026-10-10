// Kleurtest-tellers ophalen (5 min in geheugen), voor colourHead() en voor de statuspagina's.
import { kv } from './db.js';
import { PALETTES, colourHead } from './look.js';
const mem = {};
export async function colourCounts(prefix, n) {
  const c = mem[prefix]; if (c && Date.now() - c.at < 300000) return c.v;
  let r = []; try { r = await kv.mget(...Array.from({ length: n }, (_, i) => ['c:col-' + prefix + '-v' + i + '-imp', 'c:col-' + prefix + '-v' + i + '-clk']).flat()); } catch (e) {}
  const v = Array.from({ length: n }, (_, i) => [Number(r[i * 2]) || 0, Number(r[i * 2 + 1]) || 0]); mem[prefix] = { at: Date.now(), v }; return v;
}
// kleurtest draait pas bij genoeg verkeer (minstens 100 echte weergaven per kleur per dag); daaronder de vaste huiskleur en geen meting
const gate = {};
async function genoeg(scoreKey, n) { const g = gate[scoreKey]; if (g && Date.now() - g.at < 600000) return g.ok; let ok = false; try { const s = await kv.get('hjdk:score:' + scoreKey); ok = !!(s && s.gisteren && s.gisteren.weergaven >= 100 * n); } catch (e) {} gate[scoreKey] = { at: Date.now(), ok }; return ok; }
export async function colourTag(site, prefix, clickSel, dark, scoreKey) { const pal = PALETTES[site]; if (scoreKey && !(await genoeg(scoreKey, pal.length))) return ''; return colourHead(prefix, pal, await colourCounts(prefix, pal.length), clickSel, dark); }
export async function colourReport(site, prefix) {
  const pal = PALETTES[site]; mem[prefix] = null; const v = await colourCounts(prefix, pal.length);
  return pal.map((p, i) => ({ kleur: p.naam, hex: p.acc, weergaven: v[i][0], winkelkliks: v[i][1], klikPct: v[i][0] ? Math.round(1000 * v[i][1] / v[i][0]) / 10 : null }));
}

// Meten wat echte bezoekers doen (in de browser, dus zonder bots): per dag bezoeken per bron, paginaweergaven, gestarte keuzehulpen en winkelkliks,
// per pagina en per bron. Tellers: c:<P>-hv-<dag>-<bron> (sessies), -hp-<dag>-<pagina>, -hs-<dag>-<pagina>, -hss-<dag>-<bron>, -hc-<dag>-<pagina>, -hcs-<dag>-<bron>.
export const BRONNEN = ['google', 'bing', 'duckduckgo', 'chatgpt', 'perplexity', 'copilot', 'gemini', 'pinterest', 'social', 'mail', 'push', 'betaald', 'ads-bing', 'ads-google', 'direct', 'overig'];
export function measureTag(P, clickSel, startSel) {
  return `<script>(function(){try{var ua=navigator.userAgent||'';if(/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(ua)||navigator.webdriver)return;
var P=${JSON.stringify(P)},d=new Date().toISOString().slice(0,10),sl=(location.pathname.replace(/^\\/(keuzehulp\\/)?/,'').replace(/\\/$/,'')||'home').toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,60)||'home',H=[];
function send(h){try{navigator.sendBeacon('/api/hjdk/stats/hits',new Blob([JSON.stringify({hits:h})],{type:'text/plain'}))}catch(e){}}
var src=null;try{src=sessionStorage.getItem(P+'-src')}catch(e){}
if(!src){var q=new URLSearchParams(location.search),u=(q.get('utm_source')||'').toLowerCase(),r=document.referrer||'',h='';try{h=r?new URL(r).hostname.replace(/^www\\./,''):''}catch(e){}
var me=location.hostname.replace(/^www\\./,'');
var md=q.get('utm_medium')||'';src=(q.get('msclkid')||(/bing/.test(u)&&/cpc/.test(md)))?'ads-bing':(q.get('gclid')||(/google/.test(u)&&/cpc/.test(md)))?'ads-google':(q.get('zoneid')||q.get('clickid')||/cpc|paid|ads/.test(md))?'betaald':/pinterest/.test(u)?'pinterest':/mail|nieuwsbrief/.test(u)?'mail':/push/.test(u)?'push':/chatgpt/.test(u)?'chatgpt':/perplexity/.test(u)?'perplexity':
!h?'direct':h===me?'intern':/gemini\\.google/.test(h)?'gemini':/(^|\\.)google\\./.test(h)?'google':/bing\\./.test(h)?'bing':/duckduckgo/.test(h)?'duckduckgo':/chatgpt|openai/.test(h)?'chatgpt':/perplexity/.test(h)?'perplexity':/copilot/.test(h)?'copilot':/pinterest/.test(h)?'pinterest':/facebook|instagram|^t\\.co$|x\\.com|twitter|linkedin|reddit|tiktok|whatsapp/.test(h)?'social':'overig';
if(src!=='intern'){try{sessionStorage.setItem(P+'-src',src)}catch(e){}H.push([P+'-hv-'+d+'-'+src,1]);H.push([P+'-sp-'+d+'-'+src+'-'+sl,1]);var vc=(q.get('utm_content')||'').match(/^v([0-9])$/);if(vc&&src==='pinterest')H.push([P+'-pvv-'+d+'-v'+vc[1],1])}else src='direct'}
H.push([P+'-hp-'+d+'-'+sl,1]);send(H);var st=0,ck=0;
document.addEventListener('click',function(e){var t=e.target;if(!t||!t.closest)return;
if(!st&&t.closest(${JSON.stringify(startSel)})){st=1;send([[P+'-hs-'+d+'-'+sl,1],[P+'-hss-'+d+'-'+src,1]])}
var L=t.closest('a[href*="partner.bol.com"]');if(L&&L.href.indexOf('subid=')>0&&!L.getAttribute('data-src')){try{var U=new URL(L.href),sb=U.searchParams.get('subid')||'';if(!/-(ads-bing|ads-google|google|bing|pinterest|chatgpt|direct|overig|social|mail|push|betaald|perplexity|copilot|gemini|duckduckgo)$/.test(sb)){U.searchParams.set('subid',sb+'-'+src);L.href=U.toString()}L.setAttribute('data-src',src)}catch(e){}}
if(!ck&&t.closest(${JSON.stringify(clickSel)})){ck=1;send([[P+'-hc-'+d+'-'+sl,1],[P+'-hcs-'+d+'-'+src,1],[P+'-sc-'+d+'-'+src+'-'+sl,1]])}},true)}catch(e){}})();</script>`;
}
