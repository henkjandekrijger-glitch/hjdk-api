// Three distinct editorial Pin concepts per live guide. Drafts, not publication claims.
import { kv } from './db.js';
import seed from '../data/kz.json' with { type: 'json' };
import { extraItems } from './keuze-extra-content.js';
import { items as internationalItems, MARKETS } from './wtb.js';
export const SOCIAL_MARKETS={nl:{host:'keuzehulp.best',lang:'nl',brand:'Keuzehulp',all:'Alle keuzehulpen',choose:'Welke past bij jou?',criterion:'Kies op jouw situatie',buy:'Waar te koop?',cta:'Bekijk de keuzehulp',checks:['Vergelijk uitvoering','Controleer actuele prijs','Controleer voorraad en levering'],description:'Ontdek welke optie bij jouw situatie past. Bekijk de keuzehulp, vergelijk eigenschappen en controleer daarna prijs en voorraad bij de winkel.',board:'Keuzehulpen',fallback:'Vergelijk je gebruik, de eigenschappen en de kosten voordat je kiest.'},us:{host:'whichtobuy.best',lang:'en-US',brand:'Which To Buy',all:'All buying guides',choose:'Which one fits your needs?',criterion:'Choose for your situation',buy:'Where can I buy it?',cta:'Open the buying guide',checks:['Compare the exact model','Check the current price','Confirm stock and delivery'],description:'Find an option for your needs. Read the buying guide, compare the features and check current price and stock at the retailer.',board:'Buying guides',fallback:'Compare your needs, the features and the cost before you choose.'},de:{host:'kaufberater.best',lang:'de-DE',brand:'Kaufberater',all:'Alle Kaufberater',choose:'Was passt zu dir?',criterion:'Deine Situation entscheidet',buy:'Wo kann ich das kaufen?',cta:'Kaufberater ansehen',checks:['Genaue Ausführung vergleichen','Aktuellen Preis prüfen','Bestand und Lieferung prüfen'],description:'Finde die passende Option für deinen Alltag. Vergleiche im Kaufberater die Eigenschaften und prüfe anschließend Preis und Verfügbarkeit beim Händler.',board:'Kaufberater',fallback:'Vergleiche deinen Bedarf, die Eigenschaften und die Kosten vor der Auswahl.'}};
const text=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const truncate=(v,n)=>{const s=text(v);return s.length<=n?s:s.slice(0,n-1).replace(/\s+\S*$/,'')+'…';};
export async function socialCatalog(market){
 if(!SOCIAL_MARKETS[market])throw new Error('Unknown market');
 let all;
 if(market==='nl'){
  const idx=await kv.get('hjdk:kz:index').catch(()=>[])||[];let dynamic=[];
  for(let i=0;i<idx.length;i+=150)dynamic.push(...await kv.mget(...idx.slice(i,i+150).map(s=>'hjdk:kz:'+s)));
  dynamic=dynamic.filter(x=>x&&x.slug);const overrides=new Map(dynamic.filter(x=>x.override).map(x=>[x.slug,x]));
  all=extraItems('nl').concat(seed.items||[],dynamic.filter(x=>!x.override)).map(x=>!x.tool&&overrides.has(x.slug)?{...x,...overrides.get(x.slug)}:x);
  if(!all.some(x=>x.slug==='fietsmaat'))all.push({slug:'fietsmaat',title:'Welke maat fiets heb ik nodig? Framemaat berekenen',cat:'Fietsen',kort:'Bereken je framemaat met binnenbeenlengte of lichaamslengte. Vergelijk de maattabel van het merk.'});
 }else all=await internationalItems(MARKETS[market]);
 const today=new Date().toISOString().slice(0,10),seen=new Set();
 return all.filter(x=>x&&/^[a-z0-9-]{1,130}$/.test(x.slug||'')&&(x.title||x.h1)&&(!x.publishAt||x.publishAt<=today)&&!seen.has(x.slug)&&seen.add(x.slug)).sort((a,b)=>(b.priority||0)-(a.priority||0)||String(b.publishAt||'').localeCompare(String(a.publishAt||''))||a.slug.localeCompare(b.slug));
}
export function pinConcept(item,market,variant=0){
 const m=SOCIAL_MARKETS[market];if(!m)throw new Error('Unknown market');
 const v=Math.max(0,Math.min(2,Math.floor(Number(variant)||0)));const name=truncate(item.title||item.h1,115);
 const questions=(item.questions||[]).map(q=>text(q.q)).filter(Boolean);
 const first=item.questions?.[0];
 const bullets=v===2?m.checks:v===1?(first?.options||[]).map(o=>truncate(o.label,160)).filter(Boolean).slice(0,3):questions.slice(0,3);
 const body=truncate(item.kort||item.intro||m.fallback,240);
 const headline=v===1&&questions[0]?truncate(questions[0],115):v===2?m.buy:name;
 const title=truncate(v===2?m.buy+' '+name:v===1?name+' — '+m.criterion:name,100);
 const description=truncate((v===1&&questions[0]?questions[0]+' ':body+' ')+m.description,480);
 const angle=['choice','situation','buy'][v],campaign='guide-'+item.slug;
 const target=new URL('https://'+m.host+'/'+item.slug);target.search=new URLSearchParams({utm_source:'pinterest',utm_medium:'organic_social',utm_campaign:campaign,utm_content:'pin-'+angle}).toString();
 const image='https://'+m.host+'/api/distributie?op=beeld&site='+market+'&slug='+encodeURIComponent(item.slug)+'&v='+v;
 return {id:market+':'+item.slug+':'+angle,market,slug:item.slug,variant:v,angle,title,description,board:m.board+' · '+truncate(item.cat||m.brand,70),image,target:target.href,headline,name,body,bullets:bullets.length?bullets:[m.fallback],cta:m.cta,brand:m.brand,language:m.lang,proposedDayOffset:[0,7,21][v],status:'draft-not-published'};
}
export const PIN_COLUMNS=['Title','Media URL','Pinterest board','Thumbnail','Description','Link','Publish date','Keywords'];
const csv=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
export function pinCsv(pins){return '\ufeff'+[PIN_COLUMNS,...pins.map(p=>[p.title,p.image,p.board,'',p.description,p.target,'',p.name])].map(row=>row.map(csv).join(',')).join('\r\n');}
export function pinImageTree(pin){
 const v=pin.variant,dark=v===2,green=pin.market==='us'?'#2B47C4':pin.market==='de'?'#803B20':'#16624C';
 const node=(type,style,children)=>({type,props:{style:{display:'flex',...style},children}});
 const heading=node('div',{fontSize:pin.headline.length>85?54:pin.headline.length>50?66:82,lineHeight:1.12,fontWeight:800,color:dark?'#FFFFFF':'#17251E'},pin.headline);
 const bulletRows=pin.bullets.map((b,i)=>node('div',{fontSize:30,lineHeight:1.25,padding:'18px 0',borderBottom:dark?'1px solid #FFFFFF44':'1px solid #DCE5DE',color:dark?'#FFFFFF':'#33443A'},(i+1)+'. '+truncate(b,80)));
 return node('div',{width:'100%',height:'100%',fontFamily:'Inter',flexDirection:'column',background:dark?green:v===1?'#FFF7EF':'#F4F8F4',padding:64,justifyContent:'space-between'},[
  node('div',{fontSize:27,fontWeight:800,letterSpacing:2,color:dark?'#FFFFFFBB':green},pin.brand.toUpperCase()),
  node('div',{flexDirection:'column',flexGrow:1,justifyContent:'center',margin:'50px 0'},[
   ...(v===1?[node('div',{fontSize:25,color:green,marginBottom:28},pin.name)]:[]),heading,
   ...(v===2?[node('div',{fontSize:29,lineHeight:1.4,color:'#FFFFFFDD',marginTop:30},pin.name)]:[]),
   node('div',{flexDirection:'column',marginTop:32},bulletRows),
   ...(v===0?[node('div',{fontSize:26,lineHeight:1.45,color:'#51665A',marginTop:32},truncate(pin.body,160))]:[])
  ]),
  node('div',{background:dark?'#FFFFFF':green,color:dark?green:'#FFFFFF',padding:'24px 30px',borderRadius:16,fontSize:29,fontWeight:800,justifyContent:'center'},pin.cta+' →'),
  node('div',{fontSize:24,color:dark?'#FFFFFFCC':green,marginTop:24},SOCIAL_MARKETS[pin.market].host)
 ]);
}
