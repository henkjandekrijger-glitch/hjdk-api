import { kv } from './db.js';
import { tokenStatus, ensureBoard, createPin, api } from './pinterest.js';
import { socialCatalog, pinConcept } from './social-keuzehulpen.js';
import { nextPin, localDay, DAY } from './pinterest-plan.js';
export const CONFIG = 'hjdk:pin-direct:config';
const RECORDS = 'hjdk:pin-direct:records', LOCK = 'hjdk:pin-direct:worker';
export async function directStatus() {
  const config = await kv.get(CONFIG) || {enabled:false, markets:['nl','us','de'], dailyPerMarket:1, standard:false};
  const records = await kv.get(RECORDS) || {};
  return {config, pinterest:await tokenStatus(), records:Object.entries(records).map(([id,r])=>({id,...r})).sort((a,b)=>b.at-a.at).slice(0,100),
    counts:{published:Object.values(records).filter(r=>r.status==='published').length, uncertain:Object.values(records).filter(r=>r.status!=='published').length}};
}
export async function runDirect() {
  const config = await kv.get(CONFIG);
  if (!config?.enabled || !config.standard) return {ok:false, state:'paused', reason:'Activeer na Standard API-toegang'};
  if (!/^verbonden/.test(await tokenStatus())) return {ok:false,state:'unconnected'};
  // Do not release before TTL: an old slow worker must never delete a successor's lease.
  if (await kv.raw(['SET',LOCK,'1','NX','EX','300']) !== 'OK') return {ok:true,state:'busy'};
  const now=Date.now(), day=localDay(now), records=await kv.get(RECORDS)||{};
  for (const market of config.markets) {
    const dailyKey='hjdk:pin-direct:daily:'+day+':'+market;
    if (Number(await kv.get(dailyKey)||0)>=config.dailyPerMarket) continue;
    // Bound Redis record size. Published IDs remain deduped in individual keys.
    const eligible=await socialCatalog(market);
    const keys=eligible.flatMap(item=>[0,1,2].map(v=>market+':'+item.slug+':'+v));
    for(let i=0;i<keys.length;i+=150){const chunk=keys.slice(i,i+150),states=await kv.mget(...chunk.map(id=>'hjdk:pin-direct:done:'+id));states.forEach((r,j)=>{if(r)records[chunk[j]]=r;});}
    const legacy=new Set();
    if(market==='nl')for(let i=0;i<eligible.length;i+=150){const chunk=eligible.slice(i,i+150),states=await kv.mget(...chunk.map(item=>'hjdk:pins:done:kz-'+item.slug));states.forEach((r,j)=>{if(r?.ok)legacy.add(chunk[j].slug);});}
    // Preserve existing NL pins as variant 0, so the two new angles can still follow.
    for(const slug of legacy)if(!records['nl:'+slug+':0']){const id='nl:'+slug+':0';records[id]={status:'published',at:now,legacy:true};await kv.set('hjdk:pin-direct:done:'+id,records[id]);}
    const next=nextPin(eligible,market,records,now,legacy); if(!next)continue;
    const p=pinConcept(next.item,market,next.variant), key='hjdk:pin-direct:done:'+next.id;
    const boardId=await ensureBoard(p.board,market==='nl'?'Keuzehulpen en praktische koopvragen':market==='de'?'Kaufberater und praktische Kaufentscheidungen':'Buying guides and practical purchase questions');
    // Durable marker before POST. Network timeouts/crashes require manual reconciliation.
    const attempt={status:'uncertain',at:now,title:p.title,target:p.target,board:p.board};
    await kv.set(key,attempt); records[next.id]=attempt;
    await kv.incr(dailyKey); await kv.raw(['EXPIRE',dailyKey,'259200']);
    try {
      const pin=await createPin({boardId,title:p.title,description:p.description,link:p.target,imageUrl:p.image,altText:p.headline});
      if(!pin.id)throw new Error('Pinterest gaf geen pin-id terug');
      records[next.id]={...attempt,status:'published',pinId:pin.id};
      await kv.set(key,records[next.id]);
    } catch(e) { records[next.id]={...attempt,error:'Publicatie niet bevestigd; controleer Pinterest vóór opnieuw plaatsen'}; await kv.set(key,records[next.id]); }
    const recent=Object.entries(records).sort((a,b)=>b[1].at-a[1].at).slice(0,120);
    await kv.set(RECORDS,Object.fromEntries(recent));
    return {ok:true,state:records[next.id].status,id:next.id,pinId:records[next.id].pinId};
  }
  return {ok:true,state:'nothing-due'};
}
export async function pinAnalytics(pinId,start,end) {
  if(!/^\d{1,30}$/.test(pinId)||!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))throw new Error('Ongeldige pin of datums');
  const records=await kv.get(RECORDS)||{};
  if(!Object.values(records).some(r=>r.pinId===pinId))throw new Error('Pin ontbreekt in onze publicatieregistratie');
  return api('/pins/'+pinId+'/analytics?'+new URLSearchParams({start_date:start,end_date:end,metric_types:'IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK'}));
}
