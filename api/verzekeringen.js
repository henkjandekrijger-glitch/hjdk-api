import data from '../data/verzekeringen.json' with { type:'json' };
import { kv } from '../lib/db.js';
import { INSURANCE_KINDS } from '../lib/verzekeringen-content.js';
import { insuranceStats, insuranceSource, insuranceCsv, insuranceBot, validInsuranceEvent } from '../lib/verzekeringen.js';
import { renderInsurance, renderInsurancePartners, renderInsuranceStatus } from '../lib/verzekeringen-view.js';
import { insuranceReport, recordInsuranceEvent, checkInsuranceSources, INSURANCE_MONITOR_KEY } from '../lib/verzekeringen-monitor.js';

export default async function handler(req,res){
  const u=new URL(req.url,'https://keuzehulp.best'),q=u.searchParams,op=q.get('op')||'page';
  const path=u.pathname,publicPage=(op==='page');
  res.setHeader('cache-control','no-store');res.setHeader('x-robots-tag',publicPage?'index,follow':'noindex');
  res.setHeader('referrer-policy','no-referrer');res.setHeader('x-content-type-options','nosniff');
  try{
    if(op==='page'){
      if(req.method!=='GET'&&req.method!=='HEAD')return res.status(405).end();
      res.setHeader('content-type','text/html; charset=utf-8');
      const monitor=await kv.get(INSURANCE_MONITOR_KEY).catch(()=>null);
      return res.status(200).send(renderInsurance(data,monitor));
    }
    if(op==='partners'){res.setHeader('content-type','text/html; charset=utf-8');return res.status(200).send(renderInsurancePartners(data));}
    if(op==='status'){
      const report=await insuranceReport(kv,data);report.catalog=insuranceStats(data);
      if(q.get('format')==='html'){res.setHeader('content-type','text/html; charset=utf-8');return res.status(200).send(renderInsuranceStatus(report));}
      return res.status(200).json(report);
    }
    if(op==='catalog')return res.status(200).json({ok:true,...data,stats:insuranceStats(data)});
    if(op==='csv'){res.setHeader('content-type','text/csv; charset=utf-8');res.setHeader('content-disposition','attachment; filename="verzekeringen-NL-'+data.reviewedAt+'.csv"');return res.status(200).send(insuranceCsv(data));}
    if(op==='out'){
      if(!['GET','HEAD'].includes(req.method))return res.status(405).end();
      const p=data.policies.find(p=>p.id===q.get('id'));const target=p&&insuranceSource(data,p);
      if(!target)return res.status(404).json({ok:false,error:'Onbekende polisbron.'});
      const preload=/prefetch|prerender/i.test(String(req.headers.purpose||req.headers['sec-purpose']||''));
      if(req.method==='GET'&&!preload&&!insuranceBot(req.headers['user-agent']))await recordInsuranceEvent(kv,'source_click',{policy:p.id}).catch(()=>{});
      res.setHeader('location',target);return res.status(302).end();
    }
    if(op==='event'){
      if(req.method!=='POST')return res.status(405).json({ok:false,error:'POST vereist'});
      const origin=req.headers.origin;if(origin&&origin!=='https://keuzehulp.best')return res.status(403).json({ok:false,error:'Onjuiste herkomst'});
      if(insuranceBot(req.headers['user-agent']))return res.status(204).end();
      if(Number(req.headers['content-length']||0)>1500)return res.status(413).end();
      let body=req.body;try{if(Buffer.isBuffer(body))body=body.toString('utf8');if(typeof body==='string')body=JSON.parse(body);}catch{return res.status(400).json({ok:false,error:'Ongeldige gebeurtenis'});}
      // Beacons mogen uitsluitend deze gesloten gebeurteniscodes doorgeven; geen vrije tekst of klantprofiel.
      if(!validInsuranceEvent(body,data,INSURANCE_KINDS)||body.event==='source_click')return res.status(400).json({ok:false,error:'Onbekende gebeurtenis'});
      await recordInsuranceEvent(kv,body.event);return res.status(200).json({ok:true});
    }
    if(op==='controle'){
      // Alleen openbare bronnen ophalen; geen aankoop, poliswijziging of leadverzending.
      // Hooguit één ronde per zes uur, vaste bronnenlijst, tijdelijke lock.
      return res.status(200).json(await checkInsuranceSources(kv,data));
    }
    return res.status(404).json({ok:false,error:'Onbekende route'});
  }catch(error){console.error('verzekeringen',op,String(error.message||error).slice(0,180));return res.status(503).json({ok:false,error:'Dit onderdeel is tijdelijk niet beschikbaar. De bronverwijzingen en polistabel worden niet automatisch aangepast.'});}
}
