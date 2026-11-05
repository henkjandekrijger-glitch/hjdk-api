import { kv } from '../lib/db.js';
import { api,createPin,ensureBoard } from '../lib/pinterest.js';
import { createService,authorized,pinImageTree,PREFIX } from '../lib/cm-distribution.js';
import history from '../data/cm-distribution-history.json' with { type:'json' };
export function handlerFor(service,env=process.env) {return async function handler(req,res){
 res.setHeader('cache-control','no-store');res.setHeader('x-robots-tag','noindex,nofollow');
 const op=new URL(req.url,'https://keuzehulp.best').searchParams.get('op')||'health';
 if(op==='health'&&['GET','HEAD'].includes(req.method))return res.status(200).json({ok:true,module:'clickmind-distribution',version:1});
 if(op==='beeld'&&req.method==='GET'){
  const id=new URL(req.url,'https://keuzehulp.best').searchParams.get('id')||'';
  if(!/^[a-f0-9]{24}$/.test(id))return res.status(400).end();
  const row=await kv.get(PREFIX+'item:'+id);if(!row||row.network!=='pinterest')return res.status(404).end();
  const [{ImageResponse},{INTER_500,INTER_800},{default:sharp}]=await Promise.all([import('@vercel/og'),import('../lib/pinfont.js'),import('sharp')]);
  // The catalogue uses WebP, which Satori does not decode. Normalize the actual photo to PNG first.
  const photo=await fetch(row.item.image,{redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!photo.ok)return res.status(503).end();
  const bytes=Buffer.from(await photo.arrayBuffer());if(bytes.length>8e6)return res.status(413).end();
  const png=await sharp(bytes,{limitInputPixels:40e6}).rotate().resize(750,750,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
  const imageRow={...row,item:{...row.item,image:'data:image/png;base64,'+png.toString('base64')}};
  const fonts=[{name:'Inter',data:Buffer.from(INTER_500,'base64'),weight:500,style:'normal'},{name:'Inter',data:Buffer.from(INTER_800,'base64'),weight:800,style:'normal'}];
  const response=new ImageResponse(pinImageTree(imageRow),{width:1000,height:1500,fonts});
  res.setHeader('content-type','image/png');res.setHeader('cache-control','public,max-age=86400');return res.status(200).end(Buffer.from(await response.arrayBuffer()));
 }
 if(!authorized(req,env))return res.status(401).json({ok:false,error:'unauthorized'});
 if(!['GET','POST'].includes(req.method))return res.status(405).end();
 try{
  if(op==='status')return res.status(200).json(await service.report());
  if(op==='dag')return res.status(200).json(await service.scan());
  if(op==='post')return res.status(200).json(await service.publish());
  return res.status(404).json({ok:false,error:'unknown_operation'});
 }catch{return res.status(503).json({ok:false,error:'distribution_unavailable'});}
};}
const service=createService({kv,pinApi:api,createPin,ensureBoard,history,flipFactory:async state=>{
 const {FlipboardBrowser}=await import('../lib/cm-flipboard.js');return new FlipboardBrowser(state);
}});
export default handlerFor(service);
