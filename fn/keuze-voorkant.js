import { renderCompleteFront, loadFrontInventory, frontUpdateItems } from '../lib/voorkant-compleet.js';
import { readFrontSignals, writeFrontSignal } from '../lib/voorkant-signalen.js';
import { rankUsage, usageDays, dailyUsage } from '../lib/guide-usage.js';
// Voorbeeldroute op verzoek van Henkjan; de bestaande homepages blijven staan.
export default async function handler(req,res){
 res.setHeader('x-robots-tag','noindex, nofollow');res.setHeader('cache-control','private, no-store');
 res.setHeader('x-content-type-options','nosniff');
 const q=new URL(req.url,'https://keuzehulp.best').searchParams,mk=['us','de'].includes(q.get('market'))?q.get('market'):'nl';
 const op=q.get('op')||'';
 if(op==='feedback'){
  if(req.method!=='POST')return res.status(405).json({ok:false});
  const origin=req.headers?.origin,host=req.headers?.host||'';
  try{if((origin&&new URL(origin).host!==host)||req.headers?.['sec-fetch-site']==='cross-site')return res.status(403).json({ok:false});}catch{return res.status(403).json({ok:false});}
  if(!/^application\/json(?:;|$)/i.test(req.headers?.['content-type']||''))return res.status(415).json({ok:false});
  let body=req.body;try{if(typeof body==='string'){if(body.length>2000)return res.status(413).json({ok:false});body=JSON.parse(body);}if(!body||Array.isArray(body)||JSON.stringify(body).length>2000)return res.status(400).json({ok:false});}catch{return res.status(400).json({ok:false});}
  const catalog=body.action==='update'?await loadFrontInventory(mk):{items:[]};
  const result=await writeFrontSignal(body,{market:mk,scope:'preview',targets:frontUpdateItems(catalog.items,mk),network:String(req.headers?.['x-forwarded-for']||req.headers?.['x-real-ip']||'unknown').split(',')[0].trim()});return res.status(result.status).json(result.body);
 }
 if(!['GET','HEAD'].includes(req.method||'GET'))return res.status(405).end();
 let signals=null;try{signals=await readFrontSignals(mk,{scope:'preview'});}catch{}
 if(op==='signalen')return res.status(signals?200:503).json(signals||{ok:false,error:'temporarily_unavailable'});
 if(op)return res.status(400).json({ok:false});
 const catalog=await loadFrontInventory(mk);let ranked=[];
 try{ranked=rankUsage(await Promise.all(usageDays().map(d=>dailyUsage(mk==='nl'?'kz':mk,d))),catalog.items);}catch{}
 res.setHeader('content-type','text/html; charset=utf-8');
 if(req.method==='HEAD')return res.status(200).end();
 return res.status(200).send(renderCompleteFront(mk,{preview:true,ranked,items:catalog.items,checkedAt:catalog.checkedAt,signals}));
}
