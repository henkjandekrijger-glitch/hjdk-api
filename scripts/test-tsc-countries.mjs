import assert from 'node:assert/strict';
import vm from 'node:vm';
import { COUNTRY_CODES, DESTINATION_CODES, orderedCountries, countryPicker, COUNTRY_PICKER_SCRIPT } from '../lib/tsc-country-picker.js';
import { LIJSTEN } from '../lib/tsc-rank.js';
import { choiceRanking } from '../lib/tsc-ranking-ui.js';
import { reviewRanking } from '../lib/tsc-reviewrank.js';

assert.equal(COUNTRY_CODES.length,249);
assert.equal(new Set(COUNTRY_CODES).size,249);
for(const origin of COUNTRY_CODES){
 const codes=orderedCountries(origin,'nl');
 assert.equal(codes[0],origin);
 assert.equal(codes.length,new Set([...DESTINATION_CODES,origin]).size);
}
const nl=orderedCountries('NL','nl'),us=orderedCountries('US','en'),au=orderedCountries('AU','en');
assert.ok(nl.indexOf('BE')<nl.indexOf('TR'));
assert.ok(us.indexOf('MX')<us.indexOf('NL'));
assert.ok(au.indexOf('TH')<au.indexOf('NL'));
const list=LIJSTEN['procedure-whitening'];
assert.equal(list.klinieken.length,16);
assert.equal(new Set(list.klinieken.map(k=>k.land)).size,12);
const ranking=reviewRanking(list);
assert.ok(ranking.ranked.some(r=>r.k.land==='NL'));
assert.ok(ranking.ranked.some(r=>r.k.land==='PT'));
assert.ok(ranking.unranked.some(r=>r.k.land==='BE'));
for(const language of ['nl','en','de']){
 const html=choiceRanking(list,language,'https://todayin.email/surgery');
 assert.ok(!/<select[^>]*id="sr-country"/.test(html));
 assert.ok(html.includes('aria-haspopup="dialog"'));
 assert.ok(!html.includes('0 platforms'));
 assert.ok(html.includes('data-country="BE"'));
 for(const match of html.matchAll(/<script(?![^>]*application\/json)[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
}

// A small DOM adapter verifies the actual shipped picker script, without network calls.
function setup(query='',saved=''){
 let doc;
 class Element {
  constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.events={};this.value='';this.hidden=false;this.className='';this.textContent='';this.classList={add:x=>this.className+=' '+x,remove:x=>this.className=this.className.replace(x,'')};}
  append(child){this.children.push(child)}
  replaceChildren(){this.children=[]}
  setAttribute(k,v){this.attributes[k]=v}
  removeAttribute(k){delete this.attributes[k]}
  addEventListener(k,f){(this.events[k]??=[]).push(f)}
  dispatchEvent(e){for(const f of this.events[e.type]||[])f(e)}
  focus(){doc.activeElement=this}
  scrollIntoView(){}
  querySelectorAll(){return this.children.filter(x=>Object.hasOwn(x.dataset,'code'))}
  showModal(){this.open=true}
  close(){this.open=false}
 }
 const ids=Object.fromEntries(['cp-data','sr-place-dialog','cp-search','cp-options','sr-origin','sr-country','sr-origin-value','sr-country-value','cp-no-results','cp-title','cp-hint','cp-coverage','sr-origin-button','sr-country-button','cp-close'].map(id=>[id,new Element()]));
 ids['cp-data'].textContent=countryPicker('nl',list).match(/id="cp-data">([\s\S]*?)<\/script>/)[1];
 ids['sr-origin'].value='NL';doc={getElementById:id=>ids[id]||null,createElement:tag=>new Element(tag)};
 const storage={getItem:()=>saved,setItem:(k,v)=>{saved=v}};
 vm.runInNewContext(COUNTRY_PICKER_SCRIPT,{document:doc,location:{search:query},localStorage:storage,URLSearchParams,URL,Event:class{constructor(type){this.type=type}}});
 return {ids,doc,open:mode=>ids['sr-'+mode+'-button'].onclick.call(ids['sr-'+mode+'-button']),items:()=>ids['cp-options'].querySelectorAll(),find:q=>{ids['cp-search'].value=q;ids['cp-search'].dispatchEvent({type:'input'})},saved:()=>saved};
}
const p=setup();p.open('country');
assert.equal(p.items()[0].dataset.code,'');
assert.equal(p.items()[1].dataset.code,'NL');
p.find('belgie');assert.equal(p.items().length,1);assert.equal(p.items()[0].dataset.code,'BE');
p.ids['cp-search'].dispatchEvent({type:'keydown',key:'Enter',preventDefault(){}});
assert.equal(p.ids['sr-country'].value,'BE');assert.equal(p.ids['sr-country-value'].textContent,'België');
assert.equal(p.ids['sr-place-dialog'].open,false);assert.equal(p.doc.activeElement,p.ids['sr-country-button']);
p.open('origin');p.find('united states');assert.equal(p.items()[0].dataset.code,'US');p.items()[0].onclick();
assert.equal(p.saved(),'US');p.open('country');assert.equal(p.items()[1].dataset.code,'US');
assert.ok(p.items().findIndex(x=>x.dataset.code==='MX')<p.items().findIndex(x=>x.dataset.code==='NL'));
p.find('nonsense-country');assert.equal(p.items().length,0);assert.equal(p.ids['cp-no-results'].hidden,false);
p.ids['sr-place-dialog'].dispatchEvent({type:'cancel',preventDefault(){}});assert.equal(p.ids['sr-country'].value,'BE');
const q=setup('?van=CW&land=PL','US');assert.equal(q.ids['sr-origin'].value,'CW');assert.equal(q.ids['sr-country'].value,'PL');
const bad=setup('?van=__proto__&land=ZZ','<script>');assert.equal(bad.ids['sr-origin'].value,'NL');assert.equal(bad.ids['sr-country'].value,'');
const rankedRow={dataset:{country:'NL',name:'dental clinics'},hidden:false},unrankedRow={dataset:{country:'BE',name:'benedenti'},hidden:false};
const field=()=>({value:'',textContent:'',events:{},addEventListener(k,f){this.events[k]=f},dispatchEvent(e){this.events[e.type]?.(e)}});
const fields=Object.fromEntries(['sr-search','sr-country','sr-empty','sr-empty-message','sr-country-reset','sr-country-value'].map(k=>[k,field()]));
const heading=field(),tab=field(),unrankedCount=field(),unranked={hidden:false,open:false,querySelector:()=>unrankedCount};
const section={id:'clinics',querySelectorAll:s=>s.startsWith('.sr-ranked')?[rankedRow]:[rankedRow,unrankedRow],querySelector:s=>s==='h2 span'?heading:unranked};
const filterDoc={getElementById:id=>fields[id]||null,querySelectorAll:s=>s==='[data-provider]'?[rankedRow,unrankedRow]:s==='.sr-cohort'?[section]:[],querySelector:s=>s.startsWith('[data-cohort-count=')?tab:null};
const filterScript=choiceRanking(list,'nl','https://todayin.email/surgery').match(/<script>\(function\(\)\{var d=document,s=([\s\S]*?)<\/script>/)[0].replace(/^<script>|<\/script>$/g,'');
vm.runInNewContext(filterScript,{document:filterDoc,URL,Event:class{constructor(type){this.type=type}}});
fields['sr-country'].value='BE';fields['sr-country'].events.change();
assert.equal(rankedRow.hidden,true);assert.equal(unrankedRow.hidden,false);assert.equal(unranked.open,true);assert.equal(unrankedCount.textContent,1);assert.equal(tab.textContent,1);assert.equal(fields['sr-empty'].hidden,true);
fields['sr-search'].value='not found';fields['sr-search'].events.input();assert.equal(fields['sr-empty'].hidden,false);assert.equal(heading.textContent,0);
fields['sr-country-reset'].onclick();assert.equal(fields['sr-search'].value,'');assert.equal(fields['sr-country'].value,'');assert.equal(tab.textContent,2);
console.log(JSON.stringify({origins:COUNTRY_CODES.length,destinations:DESTINATION_CODES.length,whiteningProviders:list.klinieken.length,whiteningCountries:12,searchKeyboardFocusOriginAndInvalidInputs:'passed'}));
