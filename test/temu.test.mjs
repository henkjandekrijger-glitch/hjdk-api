import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import vm from'node:vm';
async function source(name){try{return await readFile(new URL('../lib/'+name,import.meta.url),'utf8')}catch{return readFile(new URL(name,import.meta.url),'utf8')}}
const dataSrc=await source('temu-alternatieven.js'),uri='data:text/javascript;base64,'+Buffer.from(dataSrc).toString('base64'),data=await import(uri);
let pageSrc=await source('temu-page.js');pageSrc=pageSrc.replace("import {look,ACCENTS} from './look.js';","const look=()=>'',ACCENTS={keuzehulp:{}};").replace("'./temu-alternatieven.js'",JSON.stringify(uri));const page=await import('data:text/javascript;base64,'+Buffer.from(pageSrc).toString('base64'));
test('all 54 routes produce relevant tagged shopping links, SSR and valid schema',()=>{
 for(let c=0;c<6;c++)for(let p=0;p<3;p++)for(let b=0;b<3;b++){
  const r=[c,p,b],a=data.temuAdvice(r);const shop=new URL(data.temuShop(r));assert.equal(shop.hostname,'yoo.rs');assert.equal(shop.pathname,'/shop');assert.equal(shop.searchParams.get('cat'),data.TEMU_CATEGORIES[c].shopCategory);assert.equal(shop.searchParams.get('utm_content'),'route-'+r.join(''));assert.equal(a.category,data.TEMU_CATEGORIES[c].name);
  const html=page.renderTemuPage(r);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(html.includes('href="https://yoo.rs/shop?cat='));assert.ok(!html.toLowerCase().includes('orderchamp'));
  const link=new URL(data.temuBol(a.query,r));assert.equal(link.searchParams.get('s'),'1547300');assert.equal(new URL(link.searchParams.get('url')).searchParams.get('searchtext'),a.query);assert.ok(link.searchParams.get('subid').endsWith(r.join('')));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema['@graph'][2].mainEntity.length,data.TEMU_FAQ.length);
  assert.ok(html.includes('<link rel="canonical" href="https://keuzehulp.best/temu-alternatieven">'));
 }
 assert.deepEqual(data.temuRoute(['<script>',999,-1]),[0,0,0]);
});
test('client executes and updates result, URL and metrics on real form flow',()=>{
 const html=page.renderTemuPage([0,0,0]),handlers={},nodes={};
 nodes['temu-config']={textContent:JSON.stringify({categories:data.TEMU_CATEGORIES})};nodes['temu-form']={addEventListener:(e,f)=>handlers[e]=f};nodes['advies']={innerHTML:''};[5,1,2].forEach((v,i)=>nodes['q'+i]={value:String(v)});
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];const hits=[];let destination='';
 const context={document:{getElementById:id=>nodes[id],addEventListener:()=>{}},URL,URLSearchParams,Date,Blob,navigator:{sendBeacon:(u,b)=>hits.push([u,b])},location:{href:'https://keuzehulp.best/temu-alternatieven?c=0'},history:{replaceState:(s,t,u)=>destination=u.href}};
 vm.runInNewContext(scripts[0][1],context);handlers.change();handlers.submit({preventDefault(){}});assert.ok(nodes.advies.innerHTML.includes('Elektronica'));assert.ok(destination.includes('a=5-1-2'));assert.ok(!destination.includes('c=0'));assert.ok(hits.length>=4);
});
