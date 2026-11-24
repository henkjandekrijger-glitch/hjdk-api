import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {frontSearchWords,frontSearchEntries} from '../lib/voorkant-zoeken.js';
import snapshot from '../data/keuzehulpen-voorkant.json' with {type:'json'};

// De echte browserfunctie testen met de bewaarde catalogus; geen netwerk of bezoekersdata.
const source=fs.readFileSync(new URL('../lib/voorkant-compleet.js',import.meta.url),'utf8');
const client=source.slice(source.indexOf('export function frontClient(')+7,source.indexOf('export function frontInventory('));
const gift={nl:{slug:'cadeau-vinden',title:'Cadeau vinden'},us:{slug:'gift-finder',title:'Gift finder'},de:{slug:'geschenk-finden',title:'Geschenk finden'}};
const questions={nl:'Ik zoek een cadeau',us:'I am looking for a gift',de:'Ich suche ein Geschenk'};
let scenarios=0;
for(const market of ['nl','us','de']){
 const items=snapshot.items.filter(i=>i.market===market),added={...gift[market],updatedAt:null};
 const entries=frontSearchEntries(items,[added,added,items[0]],market);
 assert.equal(entries.length,items.length+1);
 assert.equal(entries.find(i=>i.slug===added.slug).updatedAt,null);
 const rows=entries.map(item=>({hidden:false,dataset:{frontGuide:item.slug,category:item.category,find:item.title+' '+item.slug.replace(/-/g,' ')+' '+item.category}}));
 const groups=[...new Set(entries.map(i=>i.category))].map((category,n)=>({open:n===0,hidden:false,querySelectorAll:()=>rows.filter(r=>r.dataset.category===category)}));
 const initial=groups.map(g=>g.open),events={},result={hidden:true,textContent:''};
 const search={value:'',addEventListener:(name,f)=>{events[name]=f}};
 const all={dataset:{frontFilter:''},setAttribute(){},removeAttribute(){},addEventListener(name,f){this.click=f;}};
 const category={...all,dataset:{frontFilter:added.slug==='cadeau-vinden'?'Cadeaus':market==='us'?'Gifts':'Geschenke'}};
 const root={dataset:{market,found:'matches',empty:'empty'},querySelector:selector=>selector.includes('search')?search:result,querySelectorAll:selector=>selector==='[data-front-filter]'?[all,category]:selector==='[data-front-group]'?groups:selector==='[data-front-guide]'?rows:[]};
 const run=vm.runInNewContext('('+client+')',{document:{querySelector:()=>root}});
 run(frontSearchWords);
 search.value=questions[market];events.input();
 assert.equal(rows.find(r=>r.dataset.frontGuide===added.slug).hidden,false,questions[market]);
 assert.notEqual(result.textContent,'empty');scenarios++;
 category.click({preventDefault(){}});
 assert.ok(rows.filter(r=>!r.hidden).every(r=>r.dataset.category===category.dataset.frontFilter));scenarios++;
 all.click({preventDefault(){}});search.value='';events.input();
 assert.ok(rows.every(r=>!r.hidden));assert.equal(result.hidden,true);assert.deepEqual(groups.map(g=>g.open),initial);scenarios++;
 search.value={nl:'ik zoek',us:'I am looking',de:'ich suche'}[market];events.input();
 assert.equal(result.textContent,'empty');assert.ok(rows.every(r=>r.hidden));scenarios++;
}
assert.deepEqual(frontSearchWords('Batterij zonder zonnepanelen 500 euro','nl'),['batterij','zonder','zonnepanelen','500','euro']);
assert.deepEqual(frontSearchWords('battery without solar under 500','us'),['battery','without','solar','under','500']);
assert.deepEqual(frontSearchWords('Speicher ohne Solarpanel 500 Euro','de'),['speicher','ohne','solarpanel','500','euro']);
assert.deepEqual(frontSearchWords('Ik zoek een AÇAÍ-bowl','nl'),['acai','bowl']);
console.log(scenarios+' zoekscenario’s geslaagd in NL/EN/DE: gewone zinnen, cadeauvinder, filters, wissen en lege inhoud. Eigenschappen, ontkenningen en bedragen blijven zoekcriteria.');
