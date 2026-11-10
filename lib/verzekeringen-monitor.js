import { createHash } from 'node:crypto';
import { insuranceDay, normalizeInsuranceSource, insuranceMonitorResult } from './verzekeringen.js';
export const INSURANCE_MONITOR_KEY='verzekering:source-check:last';
const eventKey=day=>'verzekering:events:'+day;
export async function recordInsuranceEvent(kv,event,extra={}) {
  const key=eventKey(insuranceDay());
  await kv.raw(['HINCRBY',key,event,'1']);
  if (extra.policy) await kv.raw(['HINCRBY',key,'policy:'+extra.policy,'1']);
  // Enkele compacte daghashes; geen sessie-, IP-, e-mail- of risicoprofielopslag.
  await kv.raw(['EXPIRE',key,String(90*86400)]);
}
export async function insuranceReport(kv,data,days=7) {
  const today=insuranceDay(),dates=Array.from({length:Math.min(30,Math.max(1,days))},(_,i)=>new Date(Date.parse(today+'T12:00:00Z')-i*864e5).toISOString().slice(0,10));
  const rows=await Promise.all(dates.map(async day=>{const raw=await kv.raw(['HGETALL',eventKey(day)]).catch(()=>[]);const events={};for(let i=0;i<raw.length;i+=2)events[raw[i]]=Number(raw[i+1])||0;return{day,events};}));
  return {ok:true,reviewedAt:data.reviewedAt,day:today,timeZone:'America/Curacao',unit:'Gebeurtenissen; geen unieke personen, leads of verkochte polissen.',days:rows,sources:await kv.get(INSURANCE_MONITOR_KEY).catch(()=>null),commercial:data.commercial,next:'Breng interesse en ontbrekende informatie in kaart. Een partnerconversie of commissie telt pas met goedgekeurde externe rapportage; die koppeling is nog niet actief.'};
}
export async function checkInsuranceSources(kv,data,fetcher=fetch) {
  const previous=await kv.get(INSURANCE_MONITOR_KEY).catch(()=>null);
  if(previous&&Date.now()-Date.parse(previous.checkedAt)<6*3600e3)return{...previous,cached:true};
  const lock=await kv.raw(['SET','verzekering:source-check:lock','1','NX','EX','180']);
  if(lock!=='OK')return{ok:true,busy:true,checkedAt:previous?.checkedAt||null};
  try{
    const sources=[...Object.values(data.sources),...data.partners.map(p=>({id:'partner-'+p.id,url:p.url}))].slice(0,64),out=[];let cursor=0;
    const checkedAt=new Date().toISOString();
    const worker=async()=>{while(cursor<sources.length){const source=sources[cursor++];let result;
      try{const response=await fetcher(source.url,{signal:AbortSignal.timeout(7500),headers:{'user-agent':'KeuzehulpSourceCheck/1.0 (+https://keuzehulp.best/verzekeringen)','accept':'text/html,application/pdf;q=0.8'}});
        const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>6*1024*1024)throw new Error('bron te groot');
        const isPdf=/application\/pdf/i.test(response.headers.get('content-type')||'');
        const value=isPdf?bytes:Buffer.from(normalizeInsuranceSource(bytes.toString('utf8')));
        const hash=createHash('sha256').update(value).digest('hex');const text=isPdf?'':value.toString();
        result={id:source.id,url:source.url,status:response.status,hash,yearsMentioned:[...new Set(text.match(/\b202[6-9]\b/g)||[])]};
      }catch(error){result={id:source.id,url:source.url,status:0,error:String(error.message||error).slice(0,140)};}
      const old=previous?.results?.find(x=>x.id===source.id);const item=insuranceMonitorResult(old,result,checkedAt);if(result.error)item.error=result.error;out.push(item);
    }};
    await Promise.all(Array.from({length:5},worker));
    const report={ok:true,checkedAt,editorialReviewAt:data.reviewedAt,definition:'Bereikbaarheid en technische inhoudshash. Geen automatische aanpassing van premie, polisjaar, dekking of persoonlijke aanbeveling.',results:out.sort((a,b)=>a.id.localeCompare(b.id))};
    const demandKey='verzekering:demand:last';const demand=await kv.get(demandKey).catch(()=>null);
    const utcDay=new Date().toISOString().slice(0,10);
    // De eerste poging op 10 nov bereikte de gedeelde dagrem. Niet nogmaals op die UTC-dag kopen.
    if(utcDay>(demand?.attemptUtcDay||data.demandResearch?.lastAttemptUtcDay||'')&&(!demand?.ok||Date.now()-Date.parse(demand.at)>7*864e5)){
      let result;try{const r=await fetcher(data.demandResearch.endpoint,{signal:AbortSignal.timeout(15000)});const j=await r.json();result={ok:r.ok,attemptUtcDay:utcDay,at:new Date().toISOString(),status:r.status,error:r.ok?null:String(j.error||'niet beschikbaar').slice(0,160),endpoint:data.demandResearch.endpoint};}catch(error){result={ok:false,attemptUtcDay:utcDay,at:new Date().toISOString(),error:String(error.message).slice(0,160)};}
      await kv.set(demandKey,result,{ex:35*86400});report.demand=result;
    }else report.demand=demand||data.demandResearch;
    await kv.set(INSURANCE_MONITOR_KEY,report,{ex:90*86400});
    await kv.set('verzekering:source-check:'+insuranceDay(),report,{ex:35*86400});return report;
  }finally{await kv.del(['verzekering:source-check:lock']).catch(()=>{});}
}
