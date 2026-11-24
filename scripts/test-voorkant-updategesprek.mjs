// Regressie van Henkjans werkelijke fout: een update-toelichting mag geen koopvraag worden.
import assert from 'node:assert/strict';
import {frontFeedbackClient,FRONT_FEEDBACK_TEXT} from '../lib/voorkant-interactie.js';
import {writeFrontSignal} from '../lib/voorkant-signalen.js';
class Element{
 constructor(){this.events={};this.dataset={};this.attrs={};this.children=[];this.value='';this.placeholder='Stel je vraag';this.textContent='';}
 addEventListener(n,f,capture){this.events[n]={f,capture};}
 setAttribute(k,v){this.attrs[k]=v;} getAttribute(k){return this.attrs[k];} removeAttribute(k){delete this.attrs[k];}
 appendChild(c){this.children.push(c);} remove(){this.removed=true;} focus(){} scrollIntoView(){} dispatchEvent(){}
 querySelector(){return submit;}
}
const root=new Element(),status=new Element(),input=new Element(),form=new Element(),chat=new Element(),submit=new Element(),link=new Element();
link.dataset={frontUpdate:'cadeau-vinden',updateTitle:'Cadeau vinden'};link.textContent='Vraag om update';
root.querySelectorAll=sel=>sel==='[data-front-update]'?[link]:[];
const created=[],messages=[],requests=[],storage=new Map();
globalThis.document={querySelector:sel=>sel==='[data-front]'?root:sel==='[data-front-feedback]'?status:input,querySelectorAll:()=>[],getElementById:id=>id==='kxf'?form:id==='kx'?chat:created.find(x=>x.id===id),createElement:()=>{const x=new Element();created.push(x);return x;}};
globalThis.window={__kx:{bubbel:(role,text)=>{const e=new Element();e.textContent=text;messages.push({role,element:e});return e;}}};
globalThis.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
let offline=false;globalThis.fetch=async(url,opts)=>{requests.push({url,body:JSON.parse(opts.body)});if(offline)throw Error('offline');return {ok:true,json:async()=>({ok:true,registered:true})};};
frontFeedbackClient({market:'nl',scope:'preview',text:FRONT_FEEDBACK_TEXT.nl});
await link.events.click.f({preventDefault(){}});
assert.equal(requests[0].body.action,'update');assert.equal(input.value,'');assert.match(input.placeholder,/veranderen/);
assert.ok(messages.some(m=>m.element.textContent.includes('updateverzoek is geregistreerd')));
assert.equal(form.events.submit.capture,true);
input.value='De prijs is verouderd';let prevented=false,stopped=false;
await form.events.submit.f({preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});
assert.ok(prevented&&stopped);assert.equal(requests[1].body.action,'update-detail');assert.equal(requests[1].body.target,'cadeau-vinden');assert.equal(requests[1].body.detail,'De prijs is verouderd');
assert.ok(requests.every(r=>r.url.includes('op=feedback')&&!r.url.includes('op=chat')));
assert.equal(input.value,'');assert.ok(messages.some(m=>m.element.textContent.includes('toelichting staat bij het updateverzoek')));
offline=true;input.value='De opties zijn verouderd';await form.events.submit.f({preventDefault(){},stopImmediatePropagation(){}});assert.equal(input.value,'De opties zijn verouderd');assert.match(messages.at(-1).element.textContent,/niet opgeslagen/);
const other=created.find(x=>x.className==='fp-new-question');other.events.click.f();assert.equal(input.placeholder,'Stel je vraag');stopped=false;await form.events.submit.f({preventDefault(){},stopImmediatePropagation(){stopped=true}});assert.equal(stopped,false);
let commands=[];let r=await writeFrontSignal({action:'update-detail',target:'cadeau-vinden',browser:'test-browser-123456789',detail:'De prijs is fout. Mail mij abc@example.com of +31612345678'}, {market:'nl',targets:[{slug:'cadeau-vinden'}],store:{raw:async a=>{commands.push(a);return [1]}}});
assert.equal(r.status,200);const record=JSON.parse(commands[0].at(-1));assert.equal(record.slug,'cadeau-vinden');assert.equal(record.bron,'update-preview');assert.ok(!record.q.includes('@'));assert.ok(!record.q.includes('061234'));assert.equal(record.update,true);
r=await writeFrontSignal({action:'update-detail',target:'cadeau-vinden',browser:'test-browser-123456789',detail:'Update voor Cadeau vinden:'},{market:'nl',targets:[{slug:'cadeau-vinden'}]});assert.equal(r.status,400);
console.log('Updategesprek: correcte hulp en toelichting opgeslagen, gewone koopchat overgeslagen, opslagfout houdt tekst vast, Nieuwe vraag sluit modus, contactgegevens verwijderd.');
