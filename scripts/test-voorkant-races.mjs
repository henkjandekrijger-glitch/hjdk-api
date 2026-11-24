// Reproduceert de fouten uit de vier onafhankelijke UX-reviews met vertraagde antwoorden.
import assert from 'node:assert/strict';
import {frontChatClient,frontReplyParts} from '../lib/voorkant-chat.js';
import {frontFeedbackClient,FRONT_FEEDBACK_TEXT} from '../lib/voorkant-interactie.js';
const tick=()=>new Promise(r=>setImmediate(r));
function fixture(){
 const created=[],requests=[],cache=new Map();
 class E{
  constructor(tag='div'){this.tag=tag;this.children=[];this.events={};this.attrs={};this.dataset={};this.className='';this.value='';this.placeholder='Stel je vraag';this.disabled=false;this.hidden=false;this._text='';created.push(this);}
  get firstChild(){return this.children[0]||null;}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this._text=String(v);this.replaceChildren();}set innerHTML(v){this.textContent=v;}
  appendChild(c){if(c.parentNode)c.remove();c.parentNode=this;this.children.push(c);return c;}
  replaceChildren(...xs){for(const c of this.children)c.parentNode=null;this.children=[];for(const x of xs)this.appendChild(x);}
  remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(c=>c!==this);this.parentNode=null;}}
  addEventListener(k,f,capture=false){(this.events[k]||=[]).push({f,capture});}
  async emit(k){const e={stopped:false,preventDefault(){},stopImmediatePropagation(){this.stopped=true;}};for(const h of [...(this.events[k]||[])].sort((a,b)=>Number(b.capture)-Number(a.capture))){await h.f(e);if(e.stopped)break;}}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}removeAttribute(k){delete this.attrs[k];}
  focus(){document.activeElement=this;}scrollIntoView(){}dispatchEvent(){}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  querySelectorAll(s){const all=[];function walk(e){for(const c of e.children){all.push(c);walk(c);}}walk(this);return all.filter(e=>s.split(',').some(part=>{const t=part.trim().split(/\s+/).at(-1);return t.startsWith('.')?e.className.split(/\s+/).includes(t.slice(1)):t.startsWith('[data-front-')?Object.hasOwn(e.dataset,t.includes('update')?'frontUpdate':t.includes('vote]')?'frontVote':'votesFor'):t==='button'||t==='button[type=submit]'?e.tag==='button':false;}));}
 }
 const outer=new E(),root=new E(),form=new E('form'),input=new E('input'),submit=new E('button'),log=new E(),archive=new E('details'),archiveLog=new E(),starts=new E(),status=new E();
 root.id='kx';form.id='kxf';input.id='kxq';log.id='kxa';archive.id='fc-history';archiveLog.id='fc-history-log';starts.className='fc-start kx-ps';submit.type='submit';
 form.appendChild(input);form.appendChild(submit);archive.appendChild(archiveLog);root.appendChild(archive);root.appendChild(log);root.appendChild(form);root.appendChild(starts);outer.appendChild(root);outer.appendChild(status);
 const starter=new E('button');starter.textContent='Een cadeau vinden';starts.appendChild(starter);
 const links=['fietsmaat','airfryer'].map(slug=>{const a=new E('a');a.dataset={frontUpdate:slug,updateTitle:slug};a.textContent='Vraag om update';outer.appendChild(a);return a;});
 globalThis.document={activeElement:null,querySelector:s=>s==='[data-front]'?outer:s==='[data-front-feedback]'?status:input,querySelectorAll:s=>s.includes('>')?root.children.filter(c=>c.className.includes('kx-ps')):root.querySelectorAll(s),getElementById:id=>created.find(e=>e.id===id&&(!e.parentNode?e===outer:false))||created.find(e=>e.id===id&&e.parentNode),createElement:tag=>new E(tag)};
 globalThis.localStorage={getItem:k=>cache.get(k),setItem:(k,v)=>cache.set(k,v)};globalThis.window={};
 globalThis.fetch=(url,opts)=>new Promise((resolve,reject)=>requests.push({url,body:JSON.parse(opts.body),resolve,reject}));
 const ok=(i,body={ok:true,registered:true})=>requests[i].resolve({ok:true,json:async()=>body});
 const fail=i=>requests[i].reject(Error('offline'));
 frontChatClient({market:'nl',host:'keuzehulp.best',text:{thinking:'Even kijken',error:'Probeer opnieuw',more:'Hele antwoord',guide:'Bekijk hulp'}},frontReplyParts);
 frontFeedbackClient({market:'nl',scope:'preview',text:FRONT_FEEDBACK_TEXT.nl});
 return {root,input,submit,form,links,log,starter,requests,ok,fail,created,other:()=>created.find(e=>e.className==='fp-new-question'&&e.parentNode)};
}
{
 const f=fixture(),a=f.links[0].emit('click');f.input.value='Toelichting A';const b=f.links[1].emit('click');f.ok(1);await b;f.ok(0);await a;f.input.value='Toelichting B';const p=f.form.emit('submit');assert.equal(f.requests[2].body.target,'airfryer');f.ok(2);await p;
}
{
 const f=fixture(),p=f.links[0].emit('click');assert.equal(f.submit.disabled,true);f.input.value='De prijs is verouderd';await f.form.emit('submit');assert.equal(f.requests.length,1);assert.equal(f.root.dataset.frontUpdateMode,'1');f.ok(0);await p;assert.equal(f.input.value,'De prijs is verouderd');
}
{
 const f=fixture(),p=window.__kx.vraag('Oude koopvraag');f.input.value='Nieuw koopconcept';f.fail(0);await p;assert.equal(f.input.value,'Nieuw koopconcept');assert.equal(document.activeElement,f.input);
}
{
 const f=fixture(),a=f.links[0].emit('click');f.ok(0);await a;f.input.value='Eerste toelichting';const p=f.form.emit('submit');f.input.value='Nieuw concept';f.ok(1);await p;assert.equal(f.input.value,'Nieuw concept');
}
{
 const f=fixture();f.input.value='Mijn koopconcept';let p=f.links[0].emit('click');assert.equal(f.input.value,'');f.ok(0);await p;f.input.value='Mijn fietsconcept';p=f.links[1].emit('click');assert.equal(f.input.value,'');f.ok(1);await p;f.input.value='Mijn airfryerconcept';await f.other().emit('click');assert.equal(f.input.value,'Mijn koopconcept');p=f.links[0].emit('click');assert.equal(f.input.value,'Mijn fietsconcept');f.ok(2);await p;
}
{
 const f=fixture(),p=f.links[0].emit('click');await f.other().emit('click');f.ok(0);await p;assert.ok(!f.root.dataset.frontUpdateMode);const q=window.__kx.vraag('Een nieuwe koopvraag');assert.ok(f.requests[1].url.includes('op=chat'));f.ok(1,{ok:true,a:'Een antwoord.'});await q;
}
{
 const f=fixture(),p=f.links[0].emit('click');f.fail(0);await p;f.input.value='Prijs controleren';const detail=f.form.emit('submit');assert.equal(f.requests[1].body.action,'update');f.ok(1);await tick();assert.equal(f.requests[2].body.action,'update-detail');f.ok(2);await detail;assert.equal(f.input.value,'');assert.match(f.links[0].getAttribute('aria-label'),/^Vraag om update:/);
}
{
 const f=fixture();const p=f.starter.emit('click');assert.equal(document.activeElement,f.input);f.ok(0,{ok:true,a:'Ik help je kiezen.',vervolg:'Voor wie?',opties:['Partner','Kind']});await p;const option=f.log.querySelector('.fc-options').querySelector('button');const q=option.emit('click');assert.equal(document.activeElement,f.input);f.ok(1,{ok:true,a:'Een tweede antwoord.'});await q;
}
console.log('8 UX-regressies geslaagd: laatste klik wint, pending blijft update, koop- en updatedrafts blijven, modussen gescheiden, annuleren, retry en toetsenbordfocus.');
