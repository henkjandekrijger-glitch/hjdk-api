import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import { insuranceStats, insurancePrice, insuranceSource, insuranceSelection, insuranceCsv, insuranceSchema, insuranceMonitorResult, insuranceEscape, validInsuranceEvent, insuranceDay } from '../lib/verzekeringen.js';
import { INSURANCE_KINDS, INSURANCE_FAQ } from '../lib/verzekeringen-content.js';
import { renderInsurance, renderInsurancePartners } from '../lib/verzekeringen-view.js';
import { INSURANCE_CLIENT } from '../lib/verzekeringen-client.js';
import { checkInsuranceSources, recordInsuranceEvent, insuranceReport } from '../lib/verzekeringen-monitor.js';
const data=JSON.parse(await readFile(new URL('../data/verzekeringen.json',import.meta.url),'utf8'));
test('catalogus heeft unieke producten, bekende soorten en uitsluitend HTTPS-bronnen',()=>{
 assert.equal(new Set(data.policies.map(p=>p.id)).size,data.policies.length);
 assert.equal(insuranceStats(data).policies,72);assert.equal(insuranceStats(data).carriers,22);
 for(const p of data.policies){assert.ok(INSURANCE_KINDS.some(k=>k.id===p.kind),p.kind);assert.ok(data.sources[p.source],p.id);assert.ok(insuranceSource(data,p)?.startsWith('https://'),p.id);assert.equal(p.reviewedAt,'2026-11-10');}
});
test('slechts primaire bevestigde 2027-premies dragen dat jaar; bronjaar blijft in prijs',()=>{
 const ps=data.policies.filter(p=>p.year===2027);assert.equal(ps.length,2);assert.equal(ps.find(p=>p.carrier==='DSW').premium,173.25);assert.equal(ps.find(p=>p.carrier==='Stad Holland').premium,176.50);
 assert.match(insurancePrice(data.policies.find(p=>p.carrier==='CZ')),/2026, referentie/);
 assert.equal(insurancePrice({premium:null,year:2027}),'Premie niet bronbevestigd');
 assert.equal(insurancePrice({premium:100}),'Premie niet bronbevestigd');
});
test('vergelijklijst begrenst aantal en sluit vergelijking tussen andere productsoorten uit',()=>{
 const zorg=data.policies.filter(p=>p.kind==='zorg');const auto=data.policies.find(p=>p.kind==='auto');
 assert.equal(insuranceSelection(data,[zorg[0].id,zorg[1].id]).ok,true);
 assert.equal(insuranceSelection(data,[zorg[0].id,auto.id]).ok,false);
 assert.equal(insuranceSelection(data,zorg.slice(0,5).map(p=>p.id)).ok,false);
 assert.equal(insuranceSelection(data,['niet-bestaand']).ok,false);
 assert.equal(insuranceSelection(data,[zorg[0].id,zorg[0].id]).selected.length,1);
});
test('CSV behoudt onbekende prijs als lege cel en koppelt iedere rij aan bron en jaar',()=>{
 const csv=insuranceCsv(data);assert.ok(csv.startsWith('\uFEFF'));assert.equal(csv.split('\r\n').length,73);assert.match(csv,/'?/);
 const row=csv.split('\r\n').find(l=>l.includes('VGZ')&&l.includes('Basis Keuze'));assert.ok(row.includes('"2026";"";'));assert.ok(row.includes('https://www.vgz.nl/'));
});
test('HTML bevat polistabel, juiste aantallen, eerlijke reikwijdte en werkende JSON-blokken',async()=>{
 const html=renderInsurance(data,null);assert.ok(html.includes('72'));assert.match(html,/geen volledige marktvergelijker/);assert.match(html,/Premie niet bronbevestigd/);assert.match(html,/2026 referentie/);
 const json=[...html.matchAll(/<script[^>]*type="(?:application\/ld\+json|application\/json)"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));assert.equal(json.length,2);assert.ok(json[0]['@graph']);assert.equal(json[1].policies.length,72);
 for(const k of INSURANCE_KINDS)assert.ok(html.includes('id="'+k.id+'"'));
 await writeFile(new URL('../insurance-preview.html',import.meta.url),html);
});
test('schema beschrijft artikel en zichtbare FAQ, geen nepbeoordeling of persoonlijk aanbod',()=>{
 const schema=insuranceSchema(data,INSURANCE_FAQ);assert.equal(schema['@graph'][0].author['@type'],'Organization');assert.equal(schema['@graph'][2].mainEntity.length,INSURANCE_FAQ.length);assert.ok(!JSON.stringify(schema).includes('aggregateRating'));assert.ok(!JSON.stringify(schema).includes('Offer'));
});
test('HTML- en scriptwaarden kunnen geen eigen tags injecteren',()=>{
 assert.equal(insuranceEscape('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');
 const changed=structuredClone(data);changed.policies[0].name='</script><img src=x onerror=alert(1)>';
 const html=renderInsurance(changed,null);assert.ok(!html.includes('</script><img src=x onerror=alert(1)>'));for(const m of html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>JSON.parse(m[1]));
});
test('script compileert; alle statische DOM-doelen bestaan in de pagina',()=>{
 assert.doesNotThrow(()=>new vm.Script(INSURANCE_CLIENT));const html=renderInsurance(data,null);
 for(const m of INSURANCE_CLIENT.matchAll(/getElementById\('([^']+)'\)/g))assert.ok(html.includes('id="'+m[1]+'"'),m[1]);
 assert.match(html,/#verzekeringen|insurance-dialog/);
});
test('commercieel dossier maakt historische tarieven en niet-actieve status expliciet',()=>{
 const html=renderInsurancePartners(data);assert.match(html,/noindex,follow/);assert.match(html,/niet actief/);assert.match(html,/historisch tarief/);assert.equal(data.commercial.affiliatesConfigured,false);assert.equal(data.commercial.leadDeliveryConfigured,false);assert.equal(data.commercial.confirmedRevenue,null);
 assert.equal(data.partners.find(p=>p.id==='zorgkiezer').amount,null);assert.equal(data.partners.find(p=>p.id==='independer-zorg').amount,23.5);
});
test('gebeurtenissen accepteren geen vrije tekst, contactgegevens of onbekende IDs',()=>{
 assert.equal(validInsuranceEvent({event:'compare'},data,INSURANCE_KINDS),true);
 assert.equal(validInsuranceEvent({event:'search',query:'medische situatie'},data,INSURANCE_KINDS),false);
 assert.equal(validInsuranceEvent({event:'compare',email:'niet-opslaan@example.test'},data,INSURANCE_KINDS),false);
 assert.equal(validInsuranceEvent({event:'compare',policy:'vals'},data,INSURANCE_KINDS),false);
 assert.equal(validInsuranceEvent({event:'compare',kind:'vals'},data,INSURANCE_KINDS),false);
});
test('technische bronwijziging wordt geen nieuwe premie of redactionele reviewdatum',()=>{
 const before={hash:'old'};const after=insuranceMonitorResult(before,{id:'x',url:'https://example.test',status:200,hash:'new',yearsMentioned:['2027']},'2026-11-11T07:15:00Z');
 assert.equal(after.reviewRequired,true);assert.equal(after.premium,undefined);assert.equal(after.reviewedAt,undefined);
 const blocked=insuranceMonitorResult(before,{id:'x',url:'https://example.test',status:403,hash:'bad'},'now');assert.equal(blocked.changed,false);assert.equal(blocked.hash,'old');
});
function memoryKV(){const m=new Map(),h=new Map();return{m,h,get:async k=>m.get(k)||null,set:async(k,v)=>m.set(k,v),del:async ks=>ks.forEach(k=>m.delete(k)),raw:async a=>{if(a[0]==='SET'){if(a.includes('NX')&&m.has(a[1]))return null;m.set(a[1],a[2]);return 'OK';}if(a[0]==='HINCRBY'){const row=h.get(a[1])||{};row[a[2]]=(row[a[2]]||0)+Number(a[3]);h.set(a[1],row);return row[a[2]];}if(a[0]==='HGETALL')return Object.entries(h.get(a[1])||{}).flat();if(a[0]==='EXPIRE')return 1;throw Error(a.join(' '));}};}
test('broncontrole gebruikt vaste bronnen, cachet en verandert de polisdata niet',async()=>{
 const kv=memoryKV(),before=JSON.stringify(data),small={...data,sources:{dsw:data.sources.dsw},partners:[],demandResearch:{lastAttemptUtcDay:'2099-01-01'}};let calls=0;
 const fetcher=async()=>{calls++;return{status:200,headers:new Headers({'content-type':'text/html'}),arrayBuffer:async()=>new TextEncoder().encode('<main>Polis 2027</main>').buffer};};
 const first=await checkInsuranceSources(kv,small,fetcher);assert.equal(first.results.length,1);assert.equal(first.results[0].reviewRequired,false);await checkInsuranceSources(kv,small,fetcher);assert.equal(calls,1);assert.equal(JSON.stringify(data),before);
});
test('rapport meet gebeurtenissen en houdt omzet onbekend',async()=>{
 const kv=memoryKV();await recordInsuranceEvent(kv,'compare');await recordInsuranceEvent(kv,'source_click',{policy:data.policies[0].id});const report=await insuranceReport(kv,data,7);assert.equal(report.days[0].events.compare,1);assert.equal(report.days[0].events.source_click,1);assert.equal(report.commercial.confirmedRevenue,null);assert.equal(report.timeZone,'America/Curacao');
});
test('Curaçao-dagtelling loopt niet op UTC vooruit',()=>{assert.equal(insuranceDay(new Date('2026-11-11T02:00:00Z')),'2026-11-10');});
test('publicatie heeft één centrale gids, dagelijkse controle en vaste canonical',async()=>{
 const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));assert.ok(config.rewrites.some(x=>x.source==='/verzekeringen'&&x.destination==='/api/verzekeringen?op=page'));assert.ok(config.crons.some(x=>x.path==='/api/verzekeringen?op=controle'&&x.schedule==='15 7 * * *'));assert.ok(renderInsurance(data,null).includes('rel="canonical" href="https://keuzehulp.best/verzekeringen"'));
});
function clientHarness(){
 class Element{constructor(props={}){Object.assign(this,{dataset:{},handlers:{},hidden:false,value:'',textContent:'',innerHTML:'',attrs:{}},props);}addEventListener(k,fn){this.handlers[k]=fn;}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}focus(){}showModal(){this.open=true;}close(){this.open=false;}}
 const ids=Object.fromEntries([...INSURANCE_CLIENT.matchAll(/getElementById\('([^']+)'\)/g)].map(m=>[m[1],new Element()]));ids['insurance-data'].textContent=JSON.stringify({policies:data.policies});
 const rows=data.policies.map(p=>new Element({dataset:{policy:p.id,year:String(p.year||''),search:[p.carrier,p.name,p.coverage,p.kind].join(' ').toLowerCase()}}));
 const sections=INSURANCE_KINDS.map(k=>{const el=new Element({dataset:{insuranceKind:k.id}});el.querySelectorAll=()=>rows.filter(row=>data.policies.find(p=>p.id===row.dataset.policy).kind===k.id);return el;});
 const filters=['all',...INSURANCE_KINDS.map(k=>k.id)].map(kind=>new Element({dataset:{kindFilter:kind}}));
 const picks=data.policies.map(p=>new Element({dataset:{pickPolicy:p.id}}));
 const document={getElementById:id=>ids[id],querySelectorAll:q=>q==='[data-insurance-kind]'?sections:q==='[data-kind-filter]'?filters:q==='[data-pick-policy]'?picks:[]};
 vm.runInNewContext(INSURANCE_CLIENT,{document,location:{search:'?qa=updates'},URLSearchParams,Intl,Set,JSON,window:{print(){}},setTimeout:()=>1,clearTimeout(){},navigator:{sendBeacon(){throw Error('QA mag niet meten');}}});
 return{ids,rows,filters,picks,visible:()=>rows.filter(r=>!r.hidden),clickFilter:kind=>filters.find(x=>x.dataset.kindFilter===kind).handlers.click(),pick:id=>picks.find(x=>x.dataset.pickPolicy===id).handlers.click()};
}
test('echte clientcode toont 2027-rijen nadat eerder op CZ en auto is gefilterd',()=>{
 const ui=clientHarness();ui.ids['insurance-search'].value='CZ';ui.ids['insurance-search'].handlers.input();assert.equal(ui.visible().length,3);
 ui.clickFilter('auto');assert.equal(ui.visible().length,9);assert.equal(ui.ids['insurance-search'].value,'');
 ui.ids['insurance-year'].value='2027';ui.ids['insurance-year'].handlers.change();assert.equal(ui.visible().length,2);
 const carriers=ui.visible().map(r=>data.policies.find(p=>p.id===r.dataset.policy).carrier).sort();assert.deepEqual(carriers,['DSW','Stad Holland']);
});
test('echte clientcode vergelijkt, weigert gemengde soorten en kan daarna opnieuw kiezen',()=>{
 const ui=clientHarness(),zorg=data.policies.filter(p=>p.carrier==='CZ'),auto=data.policies.filter(p=>p.kind==='auto');
 ui.pick(zorg[0].id);ui.pick(zorg[1].id);assert.equal(ui.ids['insurance-compare'].disabled,false);ui.ids['insurance-compare'].handlers.click();
 assert.equal(ui.ids['insurance-dialog'].open,true);assert.ok(ui.ids['insurance-comparison'].innerHTML.includes(zorg[0].name));assert.ok(ui.ids['insurance-comparison'].innerHTML.includes('2026, referentie'));
 ui.ids['insurance-close'].handlers.click();assert.equal(ui.ids['insurance-dialog'].open,false);
 ui.pick(auto[0].id);assert.match(ui.ids['insurance-selection-message'].textContent,/dezelfde verzekeringssoort/);
 ui.ids['insurance-clear'].handlers.click();assert.equal(ui.ids['insurance-tray'].hidden,true);
 ui.pick(auto[0].id);ui.pick(auto[1].id);ui.ids['insurance-compare'].handlers.click();assert.ok(ui.ids['insurance-comparison'].innerHTML.includes(auto[0].name));
});
