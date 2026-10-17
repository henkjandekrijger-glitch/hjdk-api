import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { US_GUIDES, guideDecision, guideAnswers, runningCost } from '../lib/us-demand-guides.js';
import { decisionHtml, guideSections } from '../lib/us-demand-view.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('route decisions cover every answer combination and retain meaningful compromises',()=>{
 for(const it of US_GUIDES)for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){
  const d=guideDecision(it,[a,b,c]);assert.ok(d.title&&d.query&&d.why&&d.tradeoff&&d.budget);
 }
 const [heater,glass]=US_GUIDES;
 assert.match(guideDecision(heater,[0,1,0]).title,/oil-filled/);
 assert.match(guideDecision(heater,[2,2,2]).note,/too large/);
 assert.match(guideDecision(glass,[2,0,0]).budget,/poor fit/);
 assert.match(guideDecision(glass,[0,1,0]).title,/dual-zone/);
 assert.match(guideDecision(glass,[0,2,0]).title,/basket/);
 assert.deepEqual(guideAnswers(glass,'99--1.5'),[0,0,0]);
});
test('electricity math uses active hours, rejects invalid input, and includes zero cost',()=>{
 assert.deepEqual(runningCost(1500,4,0.2),{hourly:0.30000000000000004,daily:1.2000000000000002,total:36.00000000000001});
 assert.equal(runningCost(750,4,0.2).total,18.000000000000004);
 assert.equal(runningCost(1500,0,0.2).total,0);
 for(const args of [[1500,-1,.2],[1500,25,.2],[1500,4,Infinity],[1500,4,-.2]])assert.equal(runningCost(...args),null);
});
test('rendering keeps explicit affiliate links and approved-container guidance',()=>{
 const glass=US_GUIDES[1],d=guideDecision(glass,[0,0,0]);
 const h=decisionHtml(d,'https://www.amazon.com/s?k=a&tag=bl-t15-20',esc);
 assert.match(h,/tag=bl-t15-20/);assert.match(h,/sponsored nofollow noopener/);assert.match(h,/Amazon Associate/);
 assert.ok(!h.includes('<script'));
 assert.match(guideSections(US_GUIDES[0],esc),/Switch off before sleep/);
 assert.match(glass.guide,/containers approved/);
});
test('SSR and advice API resolve manual catalog rows, share selections and preserve US tag',async()=>{
 const kv={get:async()=>null,incrMany:async()=>{}};
 const market={id:'us',host:'whichtobuy.best',locale:'en-US',name:'Which To Buy',s:{disc:'As an Amazon Associate we earn from qualifying purchases.',related:'More buying guides',q:'Answer 3 quick questions',guide:'What actually matters',mistakes:'Common mistakes',faq:'Questions people ask'},tag:()=> 'bl-t15-20'};
 const searchLink=(m,k)=>'https://www.amazon.com/s?k='+encodeURIComponent(k)+'&tag='+m.tag();
 globalThis.__wtbGuideTest={guideAnswers,guideDecision,decisionHtml,guideSections,kv,look:()=>'',ACCENTS:{whichtobuy:{}},colourTag:async()=>'',colourReport:async()=>({}),measureTag:()=>'',MARKETS:{us:market},marketFor:()=>market,K:{item:()=>'',index:()=>''},DAY:()=> '2026-10-17',esc,items:async()=>US_GUIDES,amzSearch:async()=>null,amzReady:()=>false,searchLink,INDEXNOW_KEY:'fixture',koopBlok:()=>'',koopMeetScript:()=>''};
 let src=await readFile(new URL('../api/wtb.js',import.meta.url),'utf8');
 src=src.replace(/^import .*;\n/gm,'');src='const {'+Object.keys(globalThis.__wtbGuideTest).join(',')+'}=globalThis.__wtbGuideTest;\n'+src;
 const h=(await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'))).default;
 const response=()=>({setHeader(){},status(n){this.code=n;return this;},json(v){this.body=v;return this;},send(v){this.body=v;return this;},end(){}});
 try{
  let r=response();await h({url:'/api/wtb?m=us&slug=glass-air-fryer&answers=2-0-0',headers:{}},r);
  assert.equal(r.code,200);assert.match(r.body,/Compare a larger glass system/);assert.match(r.body,/aria-pressed="true"/);assert.match(r.body,/Copy this result/);assert.match(r.body,/tag=bl-t15-20/);
  for(const it of US_GUIDES){r=response();await h({url:'/api/wtb?op=advice&m=us&slug='+it.slug+'&a=0-1-0&html=1',headers:{}},r);assert.equal(r.code,200);assert.equal(r.body.ok,true);assert.match(r.body.html,/Based on your answers/);}
  r=response();await h({url:'/api/wtb?op=advice&m=us&slug=missing',headers:{}},r);assert.equal(r.code,404);
 }finally{delete globalThis.__wtbGuideTest;}
});
