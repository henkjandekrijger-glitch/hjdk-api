// Dagelijkse, begrensde metingen. Geen rangschikking afleiden uit crawlers of bronbezoek.
import { gzipSync, gunzipSync } from 'node:zlib';
import { kv } from './db.js';
import { kiesModel, tags } from './ai.js';
import { sites as gscSites, propFor, token } from './gsc.js';
import { socialCatalog } from './social-keuzehulpen.js';
import { usageHistory } from './guide-usage.js';
import { extraItems } from './keuze-extra-content.js';
export const REPORT_SITES={kz:'keuzehulp.best',us:'whichtobuy.best',de:'kaufberater.best'};
export const reportDay=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Curacao',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export const previousDay=d=>new Date(Date.parse(d+'T12:00:00Z')-864e5).toISOString().slice(0,10);
export const reportKey=d=>'vind:snapshot:'+d;
const pack=x=>gzipSync(JSON.stringify(x)).toString('base64');
export async function readReport(day){const x=await kv.get(reportKey(day));return x?JSON.parse(gunzipSync(Buffer.from(x,'base64')).toString()):null;}
export function normalizedUrl(value){try{const u=new URL(value);if(!['https:','http:'].includes(u.protocol))return null;return 'https://'+u.hostname.toLowerCase().replace(/^www\./,'')+(u.pathname.replace(/\/$/,'')||'/');}catch{return null;}}
export function visitSource(referrer='',utm='',paid=false){
  let h='';try{h=new URL(referrer).hostname.toLowerCase().replace(/^www\./,'');}catch{}
  const is=d=>h===d||h.endsWith('.'+d),u=String(utm).toLowerCase();
  if(Object.values(REPORT_SITES).some(is))return 'intern';
  if(is('chatgpt.com')||is('chat.openai.com'))return 'chatgpt';if(is('perplexity.ai'))return 'perplexity';if(is('copilot.microsoft.com'))return 'copilot';if(is('gemini.google.com'))return 'gemini';if(is('claude.ai'))return 'claude';
  if(/(^|\.)google\.[a-z.]+$/.test(h))return paid?'google-betaald':'google';if(is('bing.com'))return paid?'bing-betaald':'bing';
  // UTM-herkomst is zelf opgegeven; geen bewijs van een referrer of citaat.
  if(['chatgpt','perplexity','copilot','gemini','claude','google','bing'].includes(u))return u+'-utm';
  return h?'overig':'direct-onbekend';
}
export function probeEvidence(response,target){
  const text=String(response?.choices?.[0]?.message?.content||''),citationUrls=new Set();
  function walk(v,key='',depth=0){if(depth>14||v==null)return;if(typeof v==='string'){if(['url','uri','citations'].includes(key)&&/^https?:\/\//.test(v))citationUrls.add(v);return;}if(Array.isArray(v)){v.forEach(x=>walk(x,key,depth+1));return;}if(typeof v==='object')for(const [k,x]of Object.entries(v)){if(['citations','search_results','annotations','url_citation','provider_metadata','providerMetadata','sources'].includes(k)||['citations','search_results','annotations','url_citation','provider_metadata','providerMetadata','sources'].includes(key))walk(x,k,depth+1);}}
  walk(response);
  const linked=[...new Set(text.match(/https?:\/\/[^\s"'<>\])]+/g)||[])].map(x=>x.replace(/[.,;:]+$/,''));
  const norm=normalizedUrl(target),host=new URL(target).hostname;
  return {citationUrls:[...citationUrls].slice(0,30),answerUrls:linked.slice(0,30),exactCitation:[...citationUrls].some(u=>normalizedUrl(u)===norm),exactAnswerLink:linked.some(u=>normalizedUrl(u)===norm),domainMention:text.toLowerCase().includes(host),answerExcerpt:text.slice(0,900)};
}
async function queryGsc(prop,body,oidc){
  const r=await fetch('https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(prop)+'/searchAnalytics/query',{method:'POST',headers:{authorization:'Bearer '+await token(oidc),'content-type':'application/json'},body:JSON.stringify({...body,dataState:'final',type:'web',rowLimit:25000}),signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw new Error('Search Console HTTP '+r.status);return r.json();
}
export async function googleReport(host,properties,oidc){
  const prop=propFor(properties,host);if(!prop)return {status:'niet-gekoppeld',pages:[]};
  const end=new Date().toISOString().slice(0,10),start=new Date(Date.now()-10*864e5).toISOString().slice(0,10);
  const dates=await queryGsc(prop,{startDate:start,endDate:end,dimensions:['date']},oidc),days=(dates.rows||[]).map(r=>r.keys[0]).sort();
  const latest=days.at(-1);if(!latest)return {status:'geen-data',requestedFrom:start,requestedTo:end,pages:[],dateZone:'America/Los_Angeles'};
  const out=await Promise.allSettled([
    queryGsc(prop,{startDate:latest,endDate:latest,dimensions:['page']},oidc),
    queryGsc(prop,{startDate:latest,endDate:latest,dimensions:['page','query']},oidc)
  ]);
  if(out[0].status!=='fulfilled')throw out[0].reason;
  const raw=out[0].value.rows||[],qs=out[1].status==='fulfilled'?(out[1].value.rows||[]):[],per={};
  for(const r of qs){const key=normalizedUrl(r.keys[0]);(per[key]||= []).push({query:r.keys[1],impressions:r.impressions,clicks:r.clicks,position:r.position});}
  return {status:'ok',dataDate:latest,dateZone:'America/Los_Angeles',queryStatus:out[1].status==='fulfilled'?'ok':'fout',truncated:raw.length>=25000||qs.length>=25000,pages:raw.map(r=>({url:r.keys[0],impressions:r.impressions,clicks:r.clicks,position:r.position,queries:(per[normalizedUrl(r.keys[0])]||[]).sort((a,b)=>b.impressions-a.impressions).slice(0,8)})).sort((a,b)=>b.impressions-a.impressions).slice(0,1500),days:(dates.rows||[]).map(r=>({date:r.keys[0],impressions:r.impressions,clicks:r.clicks}))};
}
async function catalog(site){
  const host=REPORT_SITES[site],manual=extraItems(site==='kz'?'nl':site).map(g=>({slug:g.slug,title:g.h1,url:'https://'+host+'/'+g.slug}));let status='ok';
  try{const r=await fetch('https://'+host+'/sitemap.xml',{signal:AbortSignal.timeout(18000)});if(!r.ok)throw new Error();const xml=await r.text();
    for(const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)){const u=new URL(match[1].replace(/&amp;/g,'&'));const slug=u.pathname.replace(/^\/(keuzehulp\/)?/,'').replace(/\/$/,'');if(u.hostname.replace(/^www\./,'')===host&&/^[a-z0-9-]+$/.test(slug)&&!manual.some(p=>p.slug===slug))manual.push({slug,title:slug.replace(/-/g,' '),url:'https://'+host+'/'+slug});}
  }catch{status='onvolledig';}
  await kv.set('vind:catalog:'+site,manual.slice(0,2000),{ex:2*86400});return {pages:manual,status};
}
export async function allowedSlugs(site){let cached=await kv.get('guide:catalog:'+site).catch(()=>null);if(!cached){cached=(await socialCatalog(site==='kz'?'nl':site)).map(p=>p.slug);await kv.set('guide:catalog:'+site,cached,{ex:300});}return new Set([...cached,...extraItems(site==='kz'?'nl':site).map(p=>p.slug)]);}

const PROBES=[
  {id:'acai-de',site:'de',lang:'de',slug:'acai-bowl-zubereiten',question:'Açaí-Bowl zu Hause machen: gefrorenes Püree oder Pulver kaufen, welcher Mixer eignet sich und was kostet eine Portion?'},
  {id:'acai-nl',site:'kz',lang:'nl',slug:'acai-bowl-maken',question:'Welke açaí-basis moet ik kopen om thuis een dikke bowl te maken: diepvriespuree of poeder? Hoe vergelijk ik portiekosten en blenders?'},
  {id:'heat-de',site:'de',lang:'de',slug:'heizen-mit-mobiler-split-klimaanlage',question:'Welche mobile Split-Klimaanlage eignet sich zum Heizen im Winter und wie unterscheiden sich Midea PortaSplit und PortaSplit Cool?'},
  {id:'heat-nl',site:'kz',lang:'nl',slug:'verwarmen-met-mobiele-airco',question:'Kan ik een kamer verwarmen met Midea PortaSplit en wanneer is dat goedkoper dan een elektrische kachel of gas?'},
  {id:'charge-nl',site:'kz',lang:'nl',slug:'laadpaal',question:'Welke laadoplossing past in Nederland bij eigen terrein, een VvE of parkeren op straat? Wanneer is een 11 kW laadpaal geschikt?'},
  {id:'domain-us',site:'us',lang:'en',slug:'domain-name',question:'How should a US small business choose a clear domain name and check availability, trademarks and renewal costs?'}
];
async function dailyProbes(day,oidc){
  const results=[];
  // Zes vaste vragen, elk maximaal één provider-call per rapportdag; geen onbeperkte publieke prompts.
  for(const p of PROBES){const key='vind:probe:'+day+':'+p.id,cached=await kv.get(key);if(cached){results.push(cached);continue;}
    const lock=await kv.raw(['SET',key+':attempt','1','EX',String(36*86400),'NX']);if(!lock){results.push({...p,status:'bezig-of-onderbroken'});continue;}
    let result;try{
      const auth=process.env.AI_GATEWAY_API_KEY||oidc||process.env.VERCEL_OIDC_TOKEN;if(!auth)throw new Error('Geen AI Gateway-koppeling');
      const model=await kiesModel('perplexity/sonar','chat');const r=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+auth,'content-type':'application/json',...tags('vindbaarheid-probe')},body:JSON.stringify({model,max_tokens:700,messages:[{role:'system',content:p.lang==='de'?'Beantworte die Kauffrage knapp und nenne deine Quellen mit vollständigen URLs.':p.lang==='nl'?'Beantwoord de koopvraag kort en vermeld je bronnen met volledige URLs.':'Answer the buying question briefly and include full source URLs.'},{role:'user',content:p.question}]}),signal:AbortSignal.timeout(24000)});
      if(!r.ok)throw new Error('AI Gateway HTTP '+r.status);const j=await r.json();result={...p,model,status:'ok',at:new Date().toISOString(),...probeEvidence(j,'https://'+REPORT_SITES[p.site]+'/'+p.slug)};
    }catch(e){result={...p,model:'perplexity/sonar',status:'fout',reason:String(e.message).replace(/Bearer\s+\S+/gi,'[afgeschermd]').slice(0,100),at:new Date().toISOString()};}
    await kv.set(key,result,{ex:36*86400});results.push(result);
  }return results;
}
function bingDate(x){const m=String(x).match(/\/Date\((\d+)/);if(m)return new Date(Number(m[1])).toISOString().slice(0,10);const d=new Date(x);return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):null;}
async function bingCall(method,host,page){
  const u=new URL('https://ssl.bing.com/webmaster/api.svc/json/'+method);u.searchParams.set('apikey',process.env.BING_WEBMASTER_KEY);u.searchParams.set('siteUrl','https://'+host+'/');if(page)u.searchParams.set('page',page);
  const r=await fetch(u,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('Bing HTTP '+r.status);const j=await r.json();if(!Array.isArray(j.d))throw new Error('Bing: site of account niet toegankelijk');return j.d;
}
async function bingReport(host){
  if(!process.env.BING_WEBMASTER_KEY)return {status:'niet-gekoppeld',reason:'BING_WEBMASTER_KEY ontbreekt in het Vercel-project hjdk-api. Een sleutel in Demand Radar wordt niet automatisch gedeeld.',pages:[]};
  const rows=await bingCall('GetPageStats',host);const pages=rows.filter(x=>normalizedUrl(x.Query)?.startsWith('https://'+host+'/')).slice(0,250).map(x=>({url:x.Query,date:bingDate(x.Date),impressions:x.Impressions,clicks:x.Clicks,position:x.AvgImpressionPosition,queries:[]}));
  // Query-details van hooguit de tien meest vertoonde pagina's; API wordt wekelijks ververst.
  await Promise.all(pages.slice().sort((a,b)=>b.impressions-a.impressions).slice(0,10).map(async p=>{try{p.queries=(await bingCall('GetPageQueryStats',host,p.url)).slice(0,8).map(x=>({query:x.Query,date:bingDate(x.Date),impressions:x.Impressions,clicks:x.Clicks}));}catch{p.queryStatus='fout';}}));return {status:'ok',refresh:'wekelijks volgens Bing API-documentatie',pages};
}
export async function viewCounts(site,day){const data=await kv.raw(['HGETALL','vind:views:'+day+':'+site]);const out=[];for(let i=0;i<data.length;i+=2){const [slug,source]=data[i].split('|');out.push({slug,source,views:Number(data[i+1])||0});}return out;}
async function legacyBots(site){const hist=await kv.get('zicht:hist:'+site).catch(()=>null);const day=hist?.[0]?.dag;if(!day)return {status:'geen-data'};const m=await kv.get('zicht:meting:'+site+':'+day).catch(()=>null);return {status:m?.aiBots?'ok':'geen-data',measurementDate:day,period:'7 dagen inclusief meetdatum',counts:m?.aiBots||{}};}
export async function buildReport(oidc){
  const day=reportDay(),viewDate=previousDay(day),report={version:1,reportDay:day,generatedAt:new Date().toISOString(),viewDate,viewZone:'America/Curacao',sites:{},probes:[],schedule:'Dagelijks 11:15 UTC / 07:15 Curaçao op Vercel',retentionDays:35};
  await kv.raw(['SET','vind:tracking-since',new Date().toISOString(),'NX']); report.trackingSince=await kv.get('vind:tracking-since');
  let properties=[];try{properties=await gscSites(oidc);}catch{report.googleConnection='fout';}
  for(const [site,host]of Object.entries(REPORT_SITES)){
    const tasks=await Promise.allSettled([catalog(site),googleReport(host,properties,oidc),bingReport(host),viewCounts(site,viewDate),legacyBots(site)]),val=(i,fallback)=>tasks[i].status==='fulfilled'?tasks[i].value:fallback;
    report.sites[site]={host,catalog:val(0,{status:'fout',pages:[]}),google:val(1,{status:'fout',pages:[]}),bing:val(2,{status:'fout',reason:'Bing-data niet beschikbaar; controleer sleutel en site-eigendom.',pages:[]}),visits:{status:tasks[3].status!=='fulfilled'?'fout':viewDate<reportDay(new Date(report.trackingSince))?'nog-geen-meting':viewDate===reportDay(new Date(report.trackingSince))?'deelperiode':'ok',date:viewDate,rows:val(3,[])},crawlers:val(4,{status:'fout'})};
    if(report.googleConnection==='fout')report.sites[site].google.status='verbindingsfout';
  }
  report.usageTrackingSince=await kv.get('guide:tracking-since');report.guideUsage=await usageHistory(7);report.probes=await dailyProbes(day,oidc);report.generatedAt=new Date().toISOString();
  // Alleen compacte, gecomprimeerde dagelijkse snapshots; geen tokens/IP's/providerpayloads.
  await kv.set(reportKey(day),pack(report),{ex:35*86400});await kv.set('vind:latest',day,{ex:36*86400});
  const history=(await kv.get('vind:history').catch(()=>null))||[];await kv.set('vind:history',[{day,at:report.generatedAt,sites:Object.fromEntries(Object.entries(report.sites).map(([s,x])=>[s,{googleDate:x.google.dataDate||null,googleStatus:x.google.status,bingStatus:x.bing.status,visiblePages:x.google.pages.length}]))},...history.filter(x=>x.day!==day)].slice(0,35),{ex:36*86400});return report;
}
export const TRACKER=String.raw`(()=>{try{
 if(/bot|crawl|spider|preview/i.test(navigator.userAgent))return;
 const q=new URLSearchParams(location.search);if(q.get('qa')==='updates')return;const home=/^\/(?:keuzehulp\/?)?$/.test(location.pathname),stamp=Date.now();
 let session='',fp=false,from='';try{session=sessionStorage.getItem('guide-session')||crypto.randomUUID();sessionStorage.setItem('guide-session',session);from=sessionStorage.getItem('guide-fp')||'';}catch{session=crypto.randomUUID();}
 let ref='';try{if(document.referrer){const r=new URL(document.referrer);ref=r.origin+(/^\/(?:keuzehulp\/?)?$/.test(r.pathname)?'/':'/page');}}catch{}
 const own=['keuzehulp.best','whichtobuy.best','kaufberater.best'];let refFP=false;try{const r=new URL(ref);refFP=own.includes(r.hostname.replace(/^www\./,''))&&/^\/(?:keuzehulp\/?)?$/.test(r.pathname);}catch{}
 fp=home||q.get('from')==='fp'||refFP||stamp-Number(from)<30*60e3;
 if(fp)try{sessionStorage.setItem('guide-fp',String(stamp));}catch{}
 if(home){try{navigator.sendBeacon('/api/vindbaarheid?op=visit',new Blob([JSON.stringify({slug:'__fp',kind:'home',session,fp:true,ref,utm:'',paid:false})],{type:'text/plain'}));}catch{}document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');if(!a)return;try{const u=new URL(a.href,location.href);if(u.origin!==location.origin||!/^\/(?:keuzehulp\/)?[a-z0-9-]+$/.test(u.pathname))return;u.searchParams.set('from','fp');a.href=u.href;}catch{}},true);return;}
 const slug=location.pathname.replace(/^\/(keuzehulp\/)?/,'').replace(/\/$/,'');if(!/^[a-z0-9-]{1,120}$/.test(slug))return;
 const body={slug,ref,utm:(q.get('utm_source')||'').slice(0,32),paid:q.has('gclid')||q.has('msclkid')||q.has('clickid')||/^(cpc|ppc|paid)$/i.test(q.get('utm_medium')||''),session,fp};
 function send(kind){try{return navigator.sendBeacon('/api/vindbaarheid?op=visit',new Blob([JSON.stringify({...body,kind})],{type:'text/plain'}));}catch{return false;}}
 // Keep legacy external-source views separate; every real guide is validated server-side.
 send('view');let used=false;
 function use(){if(used)return;used=true;send('use');}
 document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-q] button,.q .opt,[data-option]'))use();},true);
 document.addEventListener('change',e=>{if(e.target.closest&&e.target.closest('#keuzehulp form,.q,form select,form input[type="number"],form input[type="radio"],form input[type="range"],#fietsmaat,#rekenhulp'))use();},true);
 document.addEventListener('submit',e=>{if(e.target.querySelector&&e.target.querySelector('select,input[type="number"],input[type="radio"],input[type="range"]'))use();},true);
}catch{}})();(()=>{if(document.querySelector('script[data-choice-updates]'))return;const s=document.createElement('script');s.src='/api/keuze-updates?op=client';s.defer=true;s.dataset.choiceUpdates='1';document.head.append(s)})();`;

