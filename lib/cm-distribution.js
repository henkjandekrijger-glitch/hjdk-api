import { randomUUID, timingSafeEqual } from 'node:crypto';
import { DAY,hash,plain,safeTarget,normalizePinterest,parseFlipboard,makePlan,inSeason } from './cm-trends.js';
export const PREFIX='cm:distribution:v1:';
export const FEEDS=['interiordesign','christmas','diy','gifts'].map(t=>'https://flipboard.com/topic/'+t+'.rss');
export const localDay=now=>new Date(now-4*3600000).toISOString().slice(0,10);
export function authorized(req,env=process.env) {
 const got=String(req.headers?.authorization||'').replace(/^Bearer /,'');
 return [env.CRON_SECRET,env.HJDK_TOKEN].filter(Boolean).some(secret=>{
  const a=Buffer.from(got),b=Buffer.from(secret);return a.length===b.length&&timingSafeEqual(a,b);
 });
}
async function publicRead(url,fetcher=fetch) {
 const u=new URL(url);
 if(u.protocol!=='https:'||!['flipboard.com','kadoly.com','gids.kadoly.com'].includes(u.hostname)||u.username||u.password||u.port)throw new Error('SOURCE_NOT_ALLOWED');
 const r=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(12000),headers:{'user-agent':'Kadoly-Clickmind/1.0 (+https://kadoly.com)'}});
 if(!r.ok)throw new Error('SOURCE_HTTP_'+r.status);
 const text=await r.text();if(Buffer.byteLength(text)>12e6)throw new Error('SOURCE_TOO_LARGE');return text;
}
export async function collectTrends(pinApi,fetcher=fetch,now=Date.now()) {
 const tasks=[...['growing','seasonal'].map(kind=>({source:'pinterest:'+kind,run:async()=>normalizePinterest(await pinApi('/trends/keywords/NL%2BBE%2BLU/top/'+kind+'?limit=50'),'NL+BE+LU',kind,now)})),
  ...FEEDS.map(source=>({source,run:async()=>parseFlipboard(await publicRead(source,fetcher),source,now)}))];
 const responses=await Promise.allSettled(tasks.map(t=>t.run()));
 const diagnostics=responses.map((r,i)=>({source:tasks[i].source,status:r.status==='fulfilled'&&r.value.length?'ok':'unavailable',count:r.status==='fulfilled'?r.value.length:0}));
 const signals=responses.flatMap(r=>r.status==='fulfilled'?r.value:[]);
 return {at:now,signals:[...new Map(signals.map(t=>[t.id,t])).values()],sources:diagnostics};
}
export function catalogItems(catalog,now=Date.now()) {
 if(!catalog?.at||now-Number(catalog.at)>24*3600000||!Array.isArray(catalog.items))throw new Error('CATALOG_STALE');
 const seen=new Set();return catalog.items.flatMap(p=>{
  if(!/^(oc_\d[\w-]*|c2b_[a-f0-9-]+)$/.test(p.id||'')||seen.has(p.id)||p.vr===false||!p.t||!p.img)return [];
  let image;try{image=new URL(p.img);if(image.protocol!=='https:'||image.username||image.password||image.port||!['cdn.kadoly.com','kadoly.com','cdn.yoo.rs','yoo.rs','cdn.orderchamp.com'].includes(image.hostname))return [];}catch{return [];}
  seen.add(p.id);return [{id:p.id,title:plain(p.t),image:image.href,url:'https://kadoly.com/product/'+p.id,category:plain(p.cat||p.categorie||''),inStock:true,kind:'product'}];
 });
}
export function boardName(row) {
 const t=row.match;
 if(t.includes('craft'))return 'Kadoly | Hobby & creatief';
 if(t.includes('bath'))return 'Kadoly | Beauty & verzorging';
 if(t.includes('table'))return 'Kadoly | Keuken & tafel';
 if(t.includes('winter')&&!t.some(x=>['light','christmas','plants'].includes(x)))return 'Kadoly | Mode & accessoires';
 return 'Kadoly | Wonen & decoratie';
}
export function publication(row) {
 safeTarget(row.item.url);
 const link=new URL('https://keuzehulp.best/api/shop/distuit');link.searchParams.set('id',row.id);
 // Only Pinterest's own keywords become a headline. Never copy another publisher's headline.
 const title=(row.network==='pinterest'?row.trend.keyword+': ':'')+row.item.title;
 const description=plain(row.item.title)+'. Bekijk de productfoto’s, actuele prijs, maat en levertijd bij Kadoly. '+(row.network==='pinterest'?'Inspiratie bij '+row.trend.keyword+'. ':'')+'Samengesteld door Kadoly, de webshop van ADSFAIR B.V.';
 return {title:title.slice(0,100),description:description.slice(0,500),image:'https://keuzehulp.best/api/cm-distributie?op=beeld&id='+row.id,target:link.href,board:boardName(row)};
}
export function pinImageTree(row) {
 const el=(type,style,children,props={})=>({type,props:{style,...props,children}});
 return el('div',{display:'flex',flexDirection:'column',width:'100%',height:'100%',background:'#fff',color:'#172244',padding:64,fontFamily:'Inter'},[
  el('div',{display:'flex',alignItems:'center',gap:18,fontSize:30},[el('img',{width:68,height:68},undefined,{src:'https://kadoly.com/img/logos/kadoly-mark.png'}),'Kadoly']),
  el('div',{display:'flex',fontSize:64,fontWeight:800,lineHeight:1.06,marginTop:38},plain(row.trend.keyword).slice(0,90)),
  el('div',{display:'flex',height:690,marginTop:30,alignItems:'center',justifyContent:'center',background:'#f5f6fb',borderRadius:24},[el('img',{width:650,height:650,objectFit:'contain'},undefined,{src:row.item.image})]),
  el('div',{display:'flex',fontSize:40,fontWeight:800,lineHeight:1.15,marginTop:36},row.item.title.slice(0,120)),
  el('div',{display:'flex',fontSize:28,marginTop:'auto',color:'#2b47c4'},'Ontdek de details op Kadoly.com')
 ]);
}
export async function acquire(kv,name,seconds=300) {
 const token=randomUUID();const ok=await kv.raw(['SET',PREFIX+'lock:'+name,token,'NX','EX',String(seconds)]);return ok==='OK'?token:null;
}
export async function release(kv,name,token) {
 await kv.raw(['EVAL',"if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",'1',PREFIX+'lock:'+name,token]);
}
export function createService({kv,pinApi,createPin,ensureBoard,flipFactory,fetcher=fetch,now=()=>Date.now(),env=process.env,history={productIds:[],urls:[]}}) {
 async function readiness() {
  let pinterest='unconnected';try{const user=await pinApi('/user_account');pinterest=user.username==='kadoly_shop'?(env.CM_PINTEREST_STANDARD==='1'?'ready':'standard_access_unconfirmed'):'wrong_account';}catch{}
  return {pinterest,flipboard:env.FLIPBOARD_STORAGE_STATE_B64?'configured_not_yet_verified':'login_required'};
 }
 async function report() {
  const snapshot=await kv.get(PREFIX+'trends'),plan=await kv.get(PREFIX+'plan')||[],log=await kv.get(PREFIX+'recent')||[];
  const states=await Promise.all(plan.map(id=>kv.get(PREFIX+'record:'+id)));
  return {at:now(),sources:snapshot?.sources||[],lastScan:snapshot?.at||null,trends:snapshot?.signals?.length||0,queued:states.filter(s=>!s).length,records:log,performance:await kv.get(PREFIX+'performance')||{},readiness:await readiness()};
 }
 async function performance(rows) {
  const totals={};
  for(const row of rows.slice(0,120)) {
   const codes=await kv.raw(['SMEMBERS',PREFIX+'codes:'+row.id]);
   const records=codes?.length?await kv.mget(...codes.slice(-200).map(c=>'hjdk:shc:'+c)):[];
   const value={visits:0,humans:0,carts:0,checkout:0,paid:0};
   for(const r of records.filter(Boolean)){if(r.t)continue;value.visits++;if(r.ym)value.humans++;if(r.px?.cart)value.carts++;if(r.px?.afreken)value.checkout++;if(Object.keys(r.px||{}).some(k=>k.startsWith('koop')))value.paid++;}
   const key=row.network+':'+row.trendId,target=totals[key]||Object.fromEntries(Object.keys(value).map(k=>[k,0]));for(const k of Object.keys(value))target[k]+=value[k];totals[key]=target;
  }
  return totals;
 }
 async function scan() {
  const token=await acquire(kv,'pipeline',600);if(!token)return {state:'busy'};
  try{
   const at=now(),catalog=await kv.get('hjdk:shop:cat'),items=catalogItems(catalog,at),trends=await collectTrends(pinApi,fetcher,at);
   await kv.set(PREFIX+'trends',trends,{ex:14*86400});
   const done={};for(const network of ['pinterest','flipboard'])for(let i=0;i<items.length;i+=200){const batch=items.slice(i,i+200),values=await kv.mget(...batch.map(p=>PREFIX+'done:'+network+':'+p.id));values.forEach((v,j)=>{if(v)done[network+':'+batch[j].id]=true;});}
   for(const id of history.productIds||[])done['flipboard:'+id]=true;
   const recent=await kv.get(PREFIX+'recent')||[],perf=await performance(recent),plan=makePlan(items,trends.signals,done,perf,at,3);
   // Retain only today's selection. Uncertain and published URLs remain permanently deduped.
   for(const row of plan){row.post=publication(row);await kv.set(PREFIX+'item:'+row.id,row);}
   await kv.set(PREFIX+'plan',plan.map(r=>r.id),{ex:2*86400});await kv.set(PREFIX+'performance',perf,{ex:14*86400});
   return {state:'planned',at,products:items.length,signals:trends.signals.length,selected:plan.map(r=>({id:r.id,network:r.network,title:r.post.title,trend:r.trend.keyword,source:r.trend.source,score:r.score})),sources:trends.sources};
  } finally{await release(kv,'pipeline',token);}
 }
 async function publish() {
  if(env.VERCEL_ENV&&env.VERCEL_ENV!=='production')return {state:'preview_no_publication'};
  const token=await acquire(kv,'pipeline',600);if(!token)return {state:'busy'};
  let flip;
  try {
   const ids=await kv.get(PREFIX+'plan')||[],ready=await readiness(),results=[];
   for(const id of ids){
    const row=await kv.get(PREFIX+'item:'+id);if(!row)continue;
    const doneKey=PREFIX+'done:'+row.network+':'+row.item.id;if(await kv.get(doneKey))continue;
    if(now()-row.createdAt>DAY||!inSeason(row.trend.keyword,now()))continue;
    const fresh=catalogItems(await kv.get('hjdk:shop:cat'),now());if(!fresh.some(p=>p.id===row.item.id))continue;
    const dayKey=PREFIX+'daily:'+localDay(now())+':'+row.network;if(Number(await kv.get(dayKey)||0)>=3)continue;
    if(row.network==='pinterest'&&ready.pinterest!=='ready'){results.push({network:row.network,state:ready.pinterest});continue;}
    if(row.network==='flipboard'&&!env.FLIPBOARD_STORAGE_STATE_B64){results.push({network:row.network,state:'login_required'});continue;}
    let marker=false;
    const before=async()=>{const record={id,network:row.network,itemId:row.item.id,trendId:row.trend.learningId||row.trend.id,status:'uncertain',at:now()};await kv.set(doneKey,record);await kv.set(PREFIX+'record:'+id,record);await kv.incr(dayKey);await kv.raw(['EXPIRE',dayKey,String(3*86400)]);marker=true;};
    try{
     let result;
     if(row.network==='pinterest'){
      // Never create a pin whose new creative has not actually rendered at its public URL.
      const imageResponse=await fetcher(row.post.image,{redirect:'error',signal:AbortSignal.timeout(20000)});
      if(!imageResponse.ok||!/^image\/png/i.test(imageResponse.headers?.get('content-type')||'')||(await imageResponse.arrayBuffer()).byteLength<2000)throw new Error('PIN_IMAGE_NOT_READY');
      const boardId=await ensureBoard(row.post.board,'Bijzondere vondsten en praktisch productadvies van Kadoly.');await before();
      result=await createPin({boardId,title:row.post.title,description:row.post.description,link:row.post.target,imageUrl:row.post.image,altText:row.item.title});
      if(!result.id)throw new Error('NO_PUBLICATION_ID');result={verified:true,pinId:result.id};
     } else {
      flip ||= await flipFactory(env.FLIPBOARD_STORAGE_STATE_B64);
      result=await flip.add(row.post.target,before);
      if(!result.verified)throw new Error('NOT_VERIFIED');
      if(!marker)await before();
     }
     const record={id,network:row.network,itemId:row.item.id,trendId:row.trend.learningId||row.trend.id,status:'published',at:now(),pinId:result.pinId||null};
     await kv.set(doneKey,record);await kv.set(PREFIX+'record:'+id,record);const recent=await kv.get(PREFIX+'recent')||[];await kv.set(PREFIX+'recent',[record,...recent.filter(r=>r.id!==id)].slice(0,120));
     results.push(record);
    }catch(e){
     const record={id,network:row.network,itemId:row.item.id,trendId:row.trend.learningId||row.trend.id,status:marker?'uncertain':'blocked',at:now(),reason:marker?'PUBLICATION_REQUIRES_RECONCILIATION':'CONNECTION_CHECK_FAILED'};
     if(marker){await kv.set(PREFIX+'record:'+id,record);const recent=await kv.get(PREFIX+'recent')||[];await kv.set(PREFIX+'recent',[record,...recent.filter(r=>r.id!==id)].slice(0,120));}
     results.push(record);break;
    }
    // Small, bounded server run. Remaining due items are handled by the next cron.
    if(results.filter(r=>r.status==='published').length>=2)break;
   }
   return {state:'finished',results};
  }finally{await flip?.close();await release(kv,'pipeline',token);}
 }
 return {scan,publish,report,performance};
}
