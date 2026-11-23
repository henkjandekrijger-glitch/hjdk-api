import { renderCompleteFront, loadFrontInventory } from '../lib/voorkant-compleet.js';
import { rankUsage, usageDays, dailyUsage } from '../lib/guide-usage.js';
// Voorbeeldroute op verzoek van Henkjan; de bestaande homepages blijven staan.
export default async function handler(req,res){
 res.setHeader('x-robots-tag','noindex, nofollow');res.setHeader('cache-control','private, no-store');
 if(!['GET','HEAD'].includes(req.method||'GET'))return res.status(405).end();
 const q=new URL(req.url,'https://keuzehulp.best').searchParams,mk=['us','de'].includes(q.get('market'))?q.get('market'):'nl';
 const catalog=await loadFrontInventory(mk);let ranked=[];
 try{ranked=rankUsage(await Promise.all(usageDays().map(d=>dailyUsage(mk==='nl'?'kz':mk,d))),catalog.items);}catch{}
 res.setHeader('content-type','text/html; charset=utf-8');
 if(req.method==='HEAD')return res.status(200).end();
 return res.status(200).send(renderCompleteFront(mk,{preview:true,ranked,items:catalog.items,checkedAt:catalog.checkedAt}));
}
