import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(new URL('../lib/energie-keuze.js',import.meta.url),'utf8'),url='data:text/javascript;base64,'+Buffer.from(source).toString('base64'),data=await import(url);
const pageSource=await fs.readFile(new URL('../lib/energie-page.js',import.meta.url),'utf8');
const page=await import('data:text/javascript;base64,'+Buffer.from(pageSource.replace("import { look, ACCENTS } from './look.js';",'const look=()=>"";const ACCENTS={};').replace("'./energie-keuze.js'",JSON.stringify(url))).toString('base64'));
test('all 27 routes render the correct existing-contract, solar and price-risk advice',()=>{
 for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){const route=[a,b,c].join('-'),advice=data.energyAdvice(route),html=page.renderEnergy(route);assert.deepEqual(advice.route,[a,b,c]);assert.ok(html.includes(advice.first));assert.ok(html.includes(advice.solar));assert.ok(html.includes(advice.title));assert.match(html,/method="get"/);assert.match(html,/op=tracker&v=2/);assert.match(html,/geen leverancierstarieven/);const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema['@graph'][2].mainEntity.length,8);}
 assert.deepEqual(data.energyRoute('99--4-abc'),[2,0,2]);
});
test('two all-in offers include only uncounted bonuses and exit costs, never treat missing annual cost as zero',()=>{
 assert.deepEqual(data.compareEnergyOffers(['2400','200','125'],['2300','0','125']),{a:2325,b:2425,difference:100,lower:'a'});
 assert.equal(data.compareEnergyOffers(['','0','0'],['2300','0','0']),null);
 assert.equal(data.parseEnergyCost('1.234,56'),1234.56);assert.equal(data.parseEnergyCost('-1'),null);assert.equal(data.parseEnergyCost('Infinity'),null);
 assert.equal(data.compareEnergyOffers(['1200','0','0'],['1200','0','0']).lower,'equal');
});
test('browser calculator validates, calculates and clears stale answers without sending amounts',()=>{
 const html=page.renderEnergy('0-1-0'),script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1],events={},hits=[],result={textContent:''};let valid=false;
 const fields={'a-annual':{value:'2400'},'a-bonus':{value:'200'},'a-exit':{value:'125'},'b-annual':{value:'2300'},'b-bonus':{value:'0'},'b-exit':{value:'125'},'cost-result':result,'cost-button':{disabled:true,addEventListener:(e,f)=>events['button-'+e]=f},'energy-cost-form':{reportValidity:()=>valid,addEventListener:(e,f)=>events['cost-'+e]=f},'energy-route':{addEventListener:(e,f)=>events['route-'+e]=f}};
 const document={getElementById:id=>fields[id],addEventListener:(e,f)=>events[e]=f};vm.runInNewContext(script,{document,Date,Intl,navigator:{sendBeacon:(u,b)=>hits.push(JSON.parse(b.parts[0]))},Blob:class{constructor(parts){this.parts=parts;}}});
 events['button-click']({preventDefault(){}});assert.equal(result.textContent,'');valid=true;events['button-click']({preventDefault(){}});assert.match(result.textContent,/2\.325,00/);assert.match(result.textContent,/100,00/);assert.match(result.textContent,/geen gegarandeerde/);assert.equal(hits.length,1);assert.doesNotMatch(JSON.stringify(hits),/2400|2300|2325/);events['cost-input']();assert.match(result.textContent,/Bereken opnieuw/);
});
test('calculator input is not serialized into URLs; page does not fabricate current supplier prices',()=>{
 const html=page.renderEnergy('0-0-0'),form=html.match(/<form id="energy-cost-form">([\s\S]*?)<\/form>/)[1];assert.doesNotMatch(form,/name=/);assert.match(form,/required/);assert.match(html,/Geen|geen/);assert.match(html,/Delta/);assert.match(html,/2027/);assert.doesNotMatch(html,/23500|136200|24\.74/);
});
