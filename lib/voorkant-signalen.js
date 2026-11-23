// Publieke, geaggregeerde voorkeuren. Geen namen, adressen of vrije chattekst.
import { createHash } from 'node:crypto';
import { kv } from './db.js';
import { schoon } from './intentie.js';
import plan from '../data/keuzehulpen-groei/voorkant-plan-2026-11-23.json' with { type: 'json' };

export const SIGNAL_TTL=400*86400;
export const signalBase=(market,scope='preview')=>'front:signals:v1:'+scope+':'+market;
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,32);
const pairs=a=>Object.fromEntries(Array.from({length:Math.floor((a||[]).length/2)},(_,i)=>[a[i*2],a[i*2+1]]));
export const FRONT_SIGNAL_LUA=`
local rate=redis.call('INCR',KEYS[4])
if rate==1 then redis.call('EXPIRE',KEYS[4],120) end
if rate>40 then return {-1} end
if ARGV[1]=='vote' then
 local old=redis.call('GET',KEYS[2]) or ''
 local wanted=ARGV[3]=='1' and ARGV[2] or ''
 if ARGV[3]=='0' and old~=ARGV[2] then wanted=old end
 if old~=wanted then
  if old~='' and tonumber(redis.call('HGET',KEYS[1],old) or '0')>0 then redis.call('HINCRBY',KEYS[1],old,-1) end
  if wanted~='' then redis.call('HINCRBY',KEYS[1],wanted,1) redis.call('SET',KEYS[2],wanted,'EX',ARGV[5]) else redis.call('DEL',KEYS[2]) end
  redis.call('EXPIRE',KEYS[1],ARGV[5])
 end
 return {1,wanted}
end
local once=redis.call('SET',KEYS[2],'1','EX',ARGV[5],'NX')
if not once then return {0} end
if ARGV[1]=='update-detail' then
 redis.call('LPUSH',KEYS[5],ARGV[6])
 redis.call('LTRIM',KEYS[5],0,2999)
 return {1}
end
redis.call('HINCRBY',KEYS[3],ARGV[2]..'|count',1)
redis.call('HSET',KEYS[3],ARGV[2]..'|lastAt',ARGV[4])
redis.call('EXPIRE',KEYS[3],ARGV[5])
return {1}
`;
export async function readFrontSignals(market,{scope='preview',store=kv}={}){
 const base=signalBase(market,scope);
 const [v,u]=await Promise.all([store.raw(['HGETALL',base+':votes']),store.raw(['HGETALL',base+':updates'])]);
 const votes=pairs(v),updates=pairs(u);
 return {ok:true,scope,market,votes:Object.fromEntries((plan.roadmap[market]||[]).filter(p=>p.status!=='done').map(p=>[p.id,Math.max(0,Number(votes[p.id])||0)])),updates:Object.entries(updates).filter(([k])=>k.endsWith('|count')).map(([k,n])=>{const slug=k.slice(0,-6);return {slug,count:Math.max(0,Number(n)||0),lastAt:updates[slug+'|lastAt']||null};}).filter(x=>x.count>0).sort((a,b)=>b.count-a.count||String(b.lastAt).localeCompare(String(a.lastAt)))};
}
export async function writeFrontSignal(body,{market,scope='preview',targets=[],network='unknown',now=new Date(),store=kv}={}){
 const fail=(status,error)=>({status,body:{ok:false,error}});
 if(!['nl','us','de'].includes(market)||!body||!['vote','update','update-detail'].includes(body.action)||!/^[a-zA-Z0-9_-]{16,80}$/.test(body.browser||''))return fail(400,'invalid_request');
 const target=String(body.target||'');let version='',detail='';
 if(body.action==='vote'){
  if(!(plan.roadmap[market]||[]).some(p=>p.id===target&&p.status!=='done')||typeof body.active!=='boolean')return fail(400,'unknown_plan');
 }else{
  const item=targets.find(i=>i.slug===target);if(!item)return fail(400,'unknown_guide');version=item.updatedAt||item.publishedAt||'undated';
  if(body.action==='update-detail'){if(typeof body.detail!=='string')return fail(400,'explain_update');detail=schoon(body.detail);if(detail.length<3||/^update (voor|to|zu) .+:$/.test(detail))return fail(400,'explain_update');}
 }
 const base=signalBase(market,scope),browser=hash(base+':'+body.browser),minute=Math.floor(now.getTime()/60000);
 const once=body.action==='vote'?base+':choice:'+browser:base+':'+(body.action==='update-detail'?'detail-once:':'update-once:')+hash(browser+':'+target+':'+version+(detail?':'+detail:''));
 try{
  const record=body.action==='update-detail'?JSON.stringify({q:detail,site:market,slug:target,bron:'update-'+scope,update:true,scope,at:now.toISOString().slice(0,16)}):'';
  const r=await store.raw(['EVAL',FRONT_SIGNAL_LUA,'5',base+':votes',once,base+':updates',base+':rate:'+hash(network+':'+minute),'kz:int:log',body.action,target,body.active?'1':'0',now.toISOString(),String(SIGNAL_TTL),record]);
  if(Number(r?.[0])===-1)return fail(429,'try_later');
  if(!Array.isArray(r)||![0,1].includes(Number(r[0])))throw Error('write failed');
  if(body.action==='vote')return {status:200,body:{...await readFrontSignals(market,{scope,store}),choice:r[1]||null}};
  return {status:200,body:{ok:true,scope,market,registered:true,duplicate:Number(r[0])===0,target}};
 }catch{return fail(503,'temporarily_unavailable');}
}
