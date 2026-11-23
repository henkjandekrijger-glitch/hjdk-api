// Server-only verified Todayin AI opt-in -> the existing Clickmind modal learner.
import { createHash, timingSafeEqual } from 'node:crypto';
const digest = value => createHash('sha256').update(String(value)).digest();
const result = (status,body) => ({status,body});

export async function confirmAIOptin({kv,modalUitkomst,method,authorization,body,secret}={}) {
  if(method!=='POST')return result(405,{ok:false,fout:'POST'});
  const bearer=/^Bearer\s+(.+)$/i.exec(String(authorization||''));
  if(!secret||!bearer||!timingSafeEqual(digest(bearer[1]),digest(secret)))return result(401,{ok:false,fout:'sleutel'});
  const site=String(body?.site||''),mid=String(body?.mid||'');
  if(!/^ai-(nl|en|de)$/.test(site)||! /^[0-9a-f]{12}$/.test(mid))return result(400,{ok:false,fout:'site of mid'});
  try {
    const raw=await kv.raw(['HGETALL','mm:cid:'+mid]);
    const record=Array.isArray(raw)?Object.fromEntries(Array.from({length:Math.floor(raw.length/2)},(_,i)=>[String(raw[i*2]),raw[i*2+1]])):(raw||{});
    // A leaked or mistyped id must never confirm another project's decision.
    if(record.modal!==site)return result(404,{ok:false,fout:'onbekende AI-beslissing'});
    const outcome=await modalUitkomst(kv,mid,'bevestigd');
    return outcome?.ok?result(200,{ok:true,site,...(outcome.dubbel?{dubbel:true}:{})}):result(400,{ok:false,fout:'beslissing niet bevestigd'});
  } catch { return result(503,{ok:false,fout:'tijdelijk niet beschikbaar'}); }
}
