import assert from 'node:assert/strict';
import fs from 'node:fs';
import {frontInventory,FRONT_ROADMAP} from '../lib/voorkant-compleet.js';
import handler from '../fn/keuze-voorkant.js';
const counts={nl:511,us:176,de:131};
for(const market of ['nl','us','de']){
 const headers={};let status=200,html='';
 const req={url:'/api/keuze-voorkant?market='+market,method:'GET',headers:{host:'example.test','user-agent':'test'}};
 const res={setHeader:(k,v)=>{headers[k]=v},getHeader:k=>headers[k],status(n){status=n;return this},send(v){html=v;return this}};
 await handler(req,res);assert.equal(status,200);assert.match(headers['x-robots-tag'],/noindex/);
 assert.equal((html.match(/data-front-guide=/g)||[]).length,counts[market]);
 assert.equal((html.match(/id="kx"/g)||[]).length,1);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/class="fp-header"/g)||[]).length,1);
 assert.ok(!html.includes('class="topbar"'));
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 assert.ok(schemas.some(s=>s['@type']==='CollectionPage'&&s.mainEntity.numberOfItems===counts[market]));
 for(const plan of FRONT_ROADMAP[market]){assert.ok(html.includes(plan.title.replace(/&/g,'&amp;')));if(!plan.slug)assert.ok(!html.includes('href="https://'+({nl:'keuzehulp.best',us:'whichtobuy.best',de:'kaufberater.best'}[market])+'/'+plan.id+'"'));}
 fs.writeFileSync('preview/front/'+market+'.html',html);
}
assert.equal(frontInventory('unknown').length,511);
console.log('Complete voorkant: drie handlerresponsen, 818 gidsen, één chat/kop, schema en eerlijke geplande kaarten gecontroleerd.');
