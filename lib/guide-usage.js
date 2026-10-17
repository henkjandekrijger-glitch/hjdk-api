// Cookie-free daily guide usage. One use per tab session/guide/day; FP journeys excluded.
import { kv } from './db.js';
export const usageDay=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Curacao',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export const usageDays=(n=7,now=new Date())=>Array.from({length:n},(_,i)=>new Date(Date.parse(usageDay(now)+'T12:00:00Z')-i*864e5).toISOString().slice(0,10));
export const usageKey=(day,site)=>'guide:daily:'+day+':'+site;
export function decodeUsage(raw=[]){const rows={};for(let i=0;i<raw.length;i+=2){const [slug,event]=String(raw[i]).split('|');if(!rows[slug])rows[slug]={slug,view:0,use:0,fpView:0,fpUse:0,eligible:0};if(Object.hasOwn(rows[slug],event))rows[slug][event]=Number(raw[i+1])||0;}return Object.values(rows);}
export function eligibleUsage(source,fp,paid){return !fp&&!paid&&source!=='intern'&&!/-betaald$/.test(source);}
export function rankUsage(days,items,min=3){const counts=new Map();for(const rows of days)for(const row of rows)counts.set(row.slug,(counts.get(row.slug)||0)+row.eligible);return items.map(i=>({...i,uses:counts.get(i.slug)||0})).filter(i=>i.uses>=min).sort((a,b)=>b.uses-a.uses||a.slug.localeCompare(b.slug)).slice(0,6);}
export async function dailyUsage(site,day){return decodeUsage(await kv.raw(['HGETALL',usageKey(day,site)]));}
export async function usageHistory(n=7){return Promise.all(usageDays(n).map(async day=>({day,sites:Object.fromEntries(await Promise.all(['kz','us','de'].map(async s=>[s,await dailyUsage(s,day)])))})));}
export async function recordUsage({site,slug,event,session,source,fp,paid,day=usageDay()}){
 await kv.raw(['SET','guide:tracking-since',new Date().toISOString(),'NX']);
 const unique='guide:once:'+day+':'+site+':'+slug+':'+event+':'+session;
 const counted=await kv.raw(['SET',unique,'1','EX','172800','NX']);if(!counted)return false;
 const key=usageKey(day,site),fields=[event];if(fp)fields.push(event==='view'?'fpView':'fpUse');if(event==='use'&&eligibleUsage(source,fp,paid))fields.push('eligible');
 for(const field of fields)await kv.raw(['HINCRBY',key,slug+'|'+field,'1']);await kv.raw(['EXPIRE',key,String(45*86400)]);return true;
}
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function trendingBlock(site,items){
 const texts={kz:['Trending keuzehulpen','Vaak gebruikt in de afgelopen 7 dagen. Bezoek vanuit de voorpagina telt niet mee.','We verzamelen gebruiksmetingen. Een keuzehulp verschijnt hier vanaf 3 gebruiken buiten de voorpagina.'],us:['Trending buying guides','Frequently used over the last 7 days. Visits from the home page do not count.','We are collecting usage data. Guides appear after 3 uses outside the home page.'],de:['Trendende Kaufberater','Häufig genutzt in den letzten 7 Tagen. Besuche von der Startseite zählen nicht.','Wir sammeln Nutzungsdaten. Ratgeber erscheinen ab 3 Nutzungen außerhalb der Startseite.']},t=texts[site];
 let ranked=[];let failed=false;try{ranked=rankUsage(await Promise.all(usageDays().map(d=>dailyUsage(site,d))),items);}catch{failed=true;}
 return '<section id="trending-guides"><h2>'+t[0]+'</h2><p>'+t[1]+'</p>'+(ranked.length?'<ul class="cards">'+ranked.map(i=>'<li><a href="/'+escape(i.slug)+'?from=fp">'+escape(i.title||i.h1)+'</a></li>').join('')+'</ul>':'<p class="meta">'+(failed?({kz:'De meting is tijdelijk niet beschikbaar.',us:'Usage data is temporarily unavailable.',de:'Nutzungsdaten sind vorübergehend nicht verfügbar.'}[site]):t[2])+'</p>')+'</section>';
}
