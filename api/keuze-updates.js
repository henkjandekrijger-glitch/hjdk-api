import { authorizedUpdate } from '../lib/keuze-update-auth.js';
import {createHash} from 'node:crypto';
import {kv} from '../lib/db.js';
import {UPDATE_CLIENT} from '../lib/keuze-updates-client.js';
import {UPDATE_SITES,base,catalog,journey,event,subscribe,confirm,unsubscribe,pushSubscribe,stopPush,click,textFor,page,esc,sendDaily,updateReport,mailKey} from '../lib/keuze-updates.js';
import {vapid,subHash} from '../lib/push.js';
export const config={api:{bodyParser:{sizeLimit:'8kb'}}};
export default async function handler(req,res){
 const url=new URL(req.url,'https://keuzehulp.best'),op=url.searchParams.get('op')||'status',host=String(req.headers['x-forwarded-host']||req.headers.host||'').toLowerCase().replace(/^www\./,'').split(':')[0],site=Object.keys(UPDATE_SITES).find(s=>UPDATE_SITES[s].host===host)||(op==='dag'?'kz':null);
 res.setHeader('cache-control','no-store');res.setHeader('x-robots-tag','noindex');res.setHeader('x-content-type-options','nosniff');
 if(!site)return res.status(400).json({ok:false});
 const c=textFor(site);let b={};try{b=typeof req.body==='string'?JSON.parse(req.body):(req.body||{});}catch{return res.status(400).json({ok:false});}
 try{
 if(op==='client'){res.setHeader('content-type','application/javascript; charset=utf-8');res.setHeader('cache-control','public,max-age=300');return res.status(200).send(UPDATE_CLIENT);}
 if(op==='sw'){res.setHeader('content-type','application/javascript; charset=utf-8');res.setHeader('service-worker-allowed','/');return res.status(200).send(`self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('push',e=>e.waitUntil((async()=>{const s=await self.registration.pushManager.getSubscription();let m=await (await fetch('/api/keuze-updates?op=pushmsg',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({endpoint:s?.endpoint})})).json();if(!m.title){try{m=await(await fetch('/api/kz/pushmsg',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({e:s?.endpoint})})).json()}catch{}}if(m.title)await self.registration.showNotification(m.title,{body:m.body,tag:m.tag||'choice-updates',data:{url:m.url}})})()));self.addEventListener('notificationclick',e=>{e.notification.close();try{const u=new URL(e.notification.data.url,self.location.origin);if(u.origin===self.location.origin)e.waitUntil(self.clients.openWindow(u.href))}catch{}});`);}
 if(op==='status')return res.status(200).json({ok:true,site,mailConfigured:!!(await mailKey()),cronConfigured:!!process.env.CRON_SECRET,scheduledVia:'centrale leerlus (ondertekend, kwartierplanning)',report:await updateReport(site)});
 if(op==='dag'){if(!(await authorizedUpdate(req)))return res.status(401).json({ok:false});return res.status(200).json(await sendDaily({dry:url.searchParams.get('dry')==='1'}));}
 if(op==='confirm'){const t=url.searchParams.get('t')||'',p=await kv.get('updates:pending:'+createHash('sha256').update(t).digest('hex'));if(!p||p.site!==site)return res.status(400).send(page(site,c.error,''));if(req.method!=='POST'){res.setHeader('content-type','text/html; charset=utf-8');return res.status(200).send(page(site,c.confirm,'<p>'+esc(c.confirmText)+'</p><form method="post"><button>'+esc(c.confirmButton)+'</button></form>'));}const done=await confirm(t);res.setHeader('content-type','text/html; charset=utf-8');return res.status(done?200:400).send(page(site,done?c.confirmed:c.error,'<p><a href="/">'+esc(UPDATE_SITES[site].name)+'</a></p>'));}
 if(op==='unsub'){const s=await unsubscribe(url.searchParams.get('t'));res.setHeader('content-type','text/html; charset=utf-8');return res.status(s?200:400).send(page(site,s?c.unsubscribed:c.error,''));}
 if(op==='click'){const p=await click(url.searchParams.get('t'));if(!p||p.site!==site)return res.status(404).end();res.setHeader('location',base(site)+'/'+p.slug+'?utm_source='+(p.channel==='push'?'push':'email')+'&utm_medium=owned&update='+url.searchParams.get('t'));return res.status(302).end();}
 if(req.headers.origin&&new URL(req.headers.origin).hostname.replace(/^www\./,'')!==host)return res.status(403).json({ok:false});
 if(/bot|crawl|spider|preview/i.test(String(req.headers['user-agent']||'')))return res.status(204).end();
 const ip=String(req.headers['x-forwarded-for']||req.headers['x-real-ip']||'unknown').split(',')[0],rk='updates:rate:'+createHash('sha256').update(ip+':'+Math.floor(Date.now()/60000)).digest('hex');const n=await kv.incr(rk);if(n===1)await kv.raw(['EXPIRE',rk,'120']);if(n>60)return res.status(429).json({ok:false});
 if(op==='config'){const slug=url.searchParams.get('slug')||'__home';if(slug!=='__home'&&!(await catalog(site)).some(i=>i.slug===slug))return res.status(404).json({ok:false});const j=await journey(site,slug,url.searchParams.get('token')),v=await vapid();return res.status(200).json({ok:true,site,token:j.token,arm:j.arm,copy:c,vapid:v.pub});}
 if(req.method!=='POST')return res.status(405).json({ok:false});
 if(op==='pushmsg'){const h=subHash(String(b.endpoint||'')),p=await kv.get('updates:p:'+h);if(!p?.active||p.site!==site)return res.status(200).json({});return res.status(200).json(await kv.get('updates:pushmsg:'+h)||{});}
 if(op==='return'){const p=await click(String(b.token||''));if(p?.site!==site)return res.status(400).json({ok:false});await click(String(b.token||''),true);return res.status(200).json({ok:true});}
 if(op==='push-stop')return res.status(200).json(await stopPush(site,String(b.endpoint||'')));
 const j=await kv.get('updates:j:'+String(b.token||''));if(!j||j.site!==site)return res.status(400).json({ok:false});j.token=b.token;
 if(op==='event'){if(['confirmed','push','request'].includes(b.kind))return res.status(400).json({ok:false});return res.status(200).json({ok:true,counted:await event(b.token,b.kind,{scroll:b.scroll})});}
 if(op==='subscribe'){if(b.website||!j.events.cta||Date.now()-j.at<800)return res.status(400).json({ok:false});const er='updates:emailrate:'+createHash('sha256').update(String(b.email||'').toLowerCase()).digest('hex');if(!(await kv.raw(['SET',er,'1','NX','EX','600'])))return res.status(200).json({ok:true});return res.status(200).json(await subscribe(j,b.email,b.zone));}
 if(op==='push')return res.status(200).json(await pushSubscribe(j,String(b.endpoint||''),String(b.route||'').replace(/[^0-9-]/g,'').slice(0,30)));
 return res.status(404).json({ok:false});
 }catch{return res.status(503).json({ok:false,error:c.error});}
}
