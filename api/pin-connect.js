import { timingSafeEqual, randomBytes } from 'node:crypto';
import { kv } from '../lib/db.js';
import { getApp, authUrl, REDIRECT } from '../lib/pinterest.js';
import { CONFIG, directStatus, runDirect, pinAnalytics } from '../lib/pinterest-direct.js';
import { validateConfig } from '../lib/pinterest-plan.js';
const same=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length>0&&x.length===y.length&&timingSafeEqual(x,y);};
export default async function handler(req,res){
 res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','no-referrer');
 const url=new URL(req.url,'https://keuzehulp.best');
 if(req.method==='GET'&&url.searchParams.get('op')==='health')return res.status(200).json({ok:true,service:'pinterest-direct',version:1});
 if(req.method==='POST'){
  let b;try{b=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch{return res.status(400).json({error:'Ongeldige aanvraag'});}
  const token=String(req.headers.authorization||'').replace(/^Bearer /i,'')||b.token;
  if(!same(token,process.env.HJDK_TOKEN))return res.status(401).json({error:'Beheersleutel klopt niet'});
  if(req.headers.origin&&!['https://keuzehulp.best','https://whichtobuy.best','https://kaufberater.best','https://hjdk-api.vercel.app','https://hjdk-api-henq.vercel.app'].includes(req.headers.origin))return res.status(403).json({error:'Ongeldige herkomst'});
  try{
   if(b.op==='status')return res.status(200).json({...await directStatus(),app:!!await getApp(),redirect:REDIRECT,cronConfigured:!!process.env.CRON_SECRET});
   if(b.op==='credentials'){
    if(!/^\d{3,30}$/.test(b.appId||'')||typeof b.appSecret!=='string'||b.appSecret.length<10||b.appSecret.length>500)return res.status(400).json({error:'Vul een geldig app-id en app-secret in'});
    const secrets=await kv.get('hjdk:secrets')||{};secrets.PINTEREST_APP_ID=b.appId;secrets.PINTEREST_APP_SECRET=b.appSecret;await kv.set('hjdk:secrets',secrets);
    return res.status(200).json({ok:true,message:'App opgeslagen. Gebruik nu Verbind Pinterest.'});
   }
   if(b.op==='connect'){
    const app=await getApp();if(!app)return res.status(400).json({error:'Sla eerst de Pinterest-app op'});
    const state=randomBytes(24).toString('hex');await kv.set('hjdk:pinterest:state:'+state,{at:Date.now()},{ex:600});
    return res.status(200).json({url:authUrl(app,state)});
   }
   if(b.op==='config'){
    const config=validateConfig(b);if(config.enabled&&(!config.standard||!/^verbonden/.test((await directStatus()).pinterest)))return res.status(400).json({error:'Koppel Pinterest en bevestig eerst Standard-toegang'});
    await kv.set(CONFIG,config);return res.status(200).json({ok:true,config});
   }
   if(b.op==='run')return res.status(200).json(await runDirect());
   if(b.op==='analytics')return res.status(200).json(await pinAnalytics(b.pinId,b.start,b.end));
   return res.status(400).json({error:'Onbekende actie'});
  }catch{return res.status(502).json({error:'Actie niet voltooid. Controleer de status of Vercel-logboeken; herhaal een onzekere publicatie niet automatisch.'});}
 }
 if(req.method!=='GET')return res.status(405).end();
 res.setHeader('content-type','text/html; charset=utf-8');
 return res.status(200).send(`<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Pinterest · keuzehulpen</title>
 <style>body{font:17px/1.55 system-ui;color:#18332a;margin:0;background:#fafbf9}main{max-width:720px;margin:auto;padding:40px 22px}h1{font-size:30px}section{background:white;border:1px solid #dce4de;border-radius:16px;padding:24px;margin:20px 0}label{display:block;margin:12px 0}input[type=password],input[type=text]{box-sizing:border-box;width:100%;padding:12px;border:1px solid #bbc9bf;border-radius:8px;font:inherit}button{background:#16624c;color:white;padding:12px 18px;border:0;border-radius:8px;font:inherit;cursor:pointer;margin:8px 6px 0 0}a{color:#16624c}pre{white-space:pre-wrap;word-break:break-word;font:13px/1.5 monospace}small{color:#56665c}code{overflow-wrap:anywhere}</style>
 <main><h1>Pinterest voor onze keuzehulpen</h1><p>Rechtstreeks plannen en meten, zonder Metricool. Drie inhoudelijke varianten per gids: kiezen, situatie en kopen. De vervolgpins komen minstens 7 en 21 dagen na de eerste pin.</p>
 <section><h2>1. Beheer openen</h2><label>HJDK-beheersleutel<input id="token" type="password" autocomplete="off"></label><button id="status">Status ophalen</button><small>De sleutel blijft alleen in dit formulier en wordt niet in een URL of browseropslag gezet.</small></section>
 <section><h2>2. Eigen Pinterest-app</h2><p>Open <a href="https://developers.pinterest.com/apps/" target="_blank" rel="noopener">Pinterest Developer: My apps</a>. Registreer een app voor onze eigen keuzehulpsites. Voor publiek zichtbare pins is Standard-toegang nodig; Trial is alleen zichtbaar voor de maker.</p><p>OAuth redirect-URI: <code>${REDIRECT}</code></p><label>App ID<input id="appId" type="text" autocomplete="off"></label><label>App secret<input id="appSecret" type="password" autocomplete="off"></label><button id="save">App opslaan</button><button id="connect">Verbind Pinterest</button><p>Voer geheimen hier in, nooit in de chat. Bij al ingestelde Vercel-teamvariabelen hoef je niets opnieuw in te vullen.</p></section>
 <section><h2>3. Publicatie instellen</h2><label><input type="checkbox" id="nl" checked> Nederland · keuzehulp.best</label><label><input type="checkbox" id="us" checked> US · whichtobuy.best</label><label><input type="checkbox" id="de" checked> Duitsland · kaufberater.best</label><label><input type="checkbox" id="standard"> Mijn Pinterest-app heeft Standard API-toegang</label><label>Maximum per land per dag <select id="daily"><option>1</option><option>2</option><option>3</option></select></label><button id="enable">Start planning</button><button id="pause">Pauzeer</button><p>Begint met één pin per land per dag. De bestaande Vercel-ronde verwerkt maximaal één nieuwe pin per uur. Oude keuzehulp-publicaties worden meegenomen; dezelfde variant wordt niet opnieuw geplaatst. Een onzekere publicatie wordt vastgehouden voor controle.</p><a href="/api/distributie">Bekijk de pinconcepten</a></section>
 <section><h2>Status en publicaties</h2><pre id="out">Nog niet opgehaald.</pre><h3>Resultaten van een geplaatste pin</h3><label>Pin-ID<input id="pinId" type="text"></label><label>Vanaf <input type="date" id="start"></label><label>Tot <input type="date" id="end"></label><button id="analytics">Haal Pinterest-resultaten op</button><p>Vertoningen, bewaard, pin-kliks en uitgaande kliks komen uit Pinterest. Bezoek en winkelkliks blijven aparte websitemetingen; dit zijn geen bevestigde aankopen.</p></section></main>
 <script>const $=id=>document.getElementById(id);async function call(op,data={}){const r=await fetch('/api/pin-connect',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+$('token').value},body:JSON.stringify({op,...data})});const j=await r.json();$('out').textContent=JSON.stringify(j,null,2);return j;}$('status').onclick=()=>call('status');$('save').onclick=async()=>{await call('credentials',{appId:$('appId').value,appSecret:$('appSecret').value});$('appSecret').value='';};$('connect').onclick=async()=>{const j=await call('connect');if(j.url)location.href=j.url;};async function config(enabled){await call('config',{enabled,standard:$('standard').checked,markets:['nl','us','de'].filter(m=>$(m).checked),dailyPerMarket:Number($('daily').value)});}$('enable').onclick=()=>config(true);$('pause').onclick=()=>config(false);$('analytics').onclick=()=>call('analytics',{pinId:$('pinId').value,start:$('start').value,end:$('end').value});</script></html>`);
}
