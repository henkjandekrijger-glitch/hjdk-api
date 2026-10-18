import {verify,createPublicKey} from 'node:crypto';
import {kv} from './db.js';
export function verifyUpdateSignature(token,pem,now=Math.floor(Date.now()/1000)){
 try{const [data,sig,...extra]=String(token).split('.');if(extra.length||!data||!sig||token.length>2000)return null;
 if(!verify(null,Buffer.from(data),createPublicKey(pem),Buffer.from(sig,'base64url')))return null;
 const j=JSON.parse(Buffer.from(data,'base64url').toString());
 if(j.iss!=='propellerads-mcp'||j.aud!=='choice-updates'||!Number.isFinite(j.iat)||!Number.isFinite(j.exp)||j.exp<now||j.iat>now+10||now-j.iat>100||j.exp-j.iat>100||!/^[a-f0-9]{32}$/.test(j.jti||''))return null;
 return j;
 }catch{return null;}
}
export async function authorizedUpdate(req){
 const auth=String(req.headers.authorization||'');
 if(process.env.CRON_SECRET&&auth==='Bearer '+process.env.CRON_SECRET)return true;
 if(process.env.HJDK_TOKEN&&req.headers['x-hjdk-token']===process.env.HJDK_TOKEN)return true;
 if(!auth.startsWith('Choice '))return false;
 let key=await kv.get('updates:central-public-key');
 if(!key||Date.now()-key.at>3600000){const r=await fetch('https://propellerads-mcp.vercel.app/api/leerlus?op=updates-key',{signal:AbortSignal.timeout(8000),redirect:'error'});const j=await r.json();if(!r.ok||!j.publicKey) return false;key={at:Date.now(),publicKey:j.publicKey};await kv.set('updates:central-public-key',key,{ex:2*86400});}
 const claims=verifyUpdateSignature(auth.slice(7),key.publicKey);if(!claims)return false;
 return !!await kv.raw(['SET','updates:auth-used:'+claims.jti,'1','NX','EX','180']);
}
