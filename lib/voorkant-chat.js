// Compacte presentatie voor de voorkant; gebruikt de bestaande keuzehulp-chat-API.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LABELS={
 nl:{label:'Stel je vraag',placeholder:'Waar zoek je hulp bij?',send:'Verstuur',thinking:'Even kijken…',error:'Dat lukte niet. Probeer je vraag opnieuw.',more:'Hele antwoord',guide:'Bekijk de hulp',log:'Je gesprek',history:'Vorige vragen'},
 us:{label:'Ask your question',placeholder:'What do you need help with?',send:'Send',thinking:'Let me check…',error:'That did not work. Please try your question again.',more:'Full answer',guide:'Open the guide',log:'Your conversation',history:'Previous questions'},
 de:{label:'Stelle deine Frage',placeholder:'Wobei brauchst du Hilfe?',send:'Senden',thinking:'Ich schaue nach…',error:'Das hat nicht geklappt. Bitte versuche deine Frage erneut.',more:'Ganze Antwort',guide:'Ratgeber ansehen',log:'Dein Gespräch',history:'Vorherige Fragen'}
};
export function frontReplyParts(reply,market='nl'){
 const full=String(reply.a||'').replace(/\s+/g,' ').trim();
 let sentences;
 try{sentences=[...new Intl.Segmenter({nl:'nl',us:'en',de:'de'}[market],{granularity:'sentence'}).segment(full)].map(x=>x.segment.trim());}catch{sentences=full.match(/[^.!?]+(?:[.!?]+|$)/g)||[];}
 const question=s=>/\?\s*$/.test(s);
 const explicit=String(reply.vervolg||'').trim();
 const follow=(explicit||sentences.find(question)||'').split('?')[0].split(/,?\s+(?:en|and|und)\s+(?=(?:wat|welk\w*|hoe|waar\w*|wie|wanneer|what|which|how|where|who|when|was|welch\w*|wie|wo|wer|wann)\b)/i)[0].trim();
 const answer=sentences.filter(s=>!question(s)).join(' ').trim();
 const candidates=sentences.filter(s=>!question(s));let short='';
 for(const s of candidates.slice(0,1)){if(short&&short.length+s.length>260)break;short+=(short?' ':'')+s;}
 if(short.length>100)short=short.slice(0,97).replace(/\s+\S*$/,'')+'…';
 const options=follow&&Array.isArray(reply.opties)?[...new Set(reply.opties.filter(s=>typeof s==='string'&&s.trim()&&s.length<=90))].slice(0,3):[];
 return {answer,short:short||answer,follow:follow?follow+'?':'',options};
}
export const FRONT_CHAT_CSS=`
.fp-chat{margin:16px 0 0;color:#111113;font:400 16px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.fp-chat *{box-sizing:border-box;font-family:inherit;font-size:16px;line-height:1.5;letter-spacing:0}
.fp-chat .fc-start,.fp-chat .fc-options{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0}
.fp-chat button{cursor:pointer;font:inherit;border:1px solid #111113;border-radius:999px;padding:8px 14px;min-height:44px;color:#111113;background:#fff}
.fp-chat button:focus-visible,.fp-chat a:focus-visible,.fp-chat summary:focus-visible{outline:2px solid #111113;outline-offset:3px}
.fp-chat button:disabled{cursor:wait}.fp-chat .fc-log{max-height:min(320px,45dvh);overflow-y:auto;overscroll-behavior:contain;scrollbar-color:#111113 #fff;scrollbar-width:thin;padding:0 12px 0 0;margin:0 0 16px;overflow-wrap:anywhere}
.fp-chat .fc-history{margin:0 0 12px}.fp-chat .fc-history>summary{cursor:pointer;text-decoration:underline}.fp-chat .fc-history-log{max-height:240px;overflow:auto;margin-top:12px}
.fp-chat .fc-message{margin:0 0 12px;padding:0;border:0;background:none;border-radius:0;max-width:65ch}
.fp-chat .kx-ik{font-weight:700}.fp-chat .kx-ant{font-weight:400}.fp-chat .fc-message p{margin:0 0 8px}.fp-chat .fc-message p:last-child{margin:0}
.fp-chat .fc-more{margin:4px 0 8px}.fp-chat .fc-more summary{cursor:pointer;text-decoration:underline}.fp-chat .fc-more p{margin:8px 0}
.fp-chat .fc-guide{display:inline-block;margin:4px 0 8px;font-weight:400;text-decoration:underline}
.fp-chat .fc-follow{margin-top:8px}.fp-chat .fc-options{margin-top:8px}
.fp-chat #kxf{display:flex;align-items:center;gap:8px;width:100%;padding:4px 4px 4px 16px;border:1px solid #111113;border-radius:999px;background:#fff;box-shadow:none;outline:0}
.fp-chat #kxq{flex:1;min-width:0;margin:0;padding:8px 0;border:0;outline:0;background:transparent;color:#111113;font:inherit}
.fp-chat #kxf:focus-within{border-width:2px;padding:3px 3px 3px 15px}
.fp-chat #kxf>button{flex:0 0 40px;min-height:40px;height:40px;width:40px;padding:0;border:0;border-radius:999px;background:#111113;color:#fff}
.fp-chat .fp-update-mode{margin-top:8px}.fp-chat [hidden]{display:none!important}
`;
export function frontChatClient(config,parts){
 const root=document.getElementById('kx');if(!root)return;
 const log=document.getElementById('kxa'),form=document.getElementById('kxf'),input=document.getElementById('kxq'),submit=form.querySelector('button'),starts=root.querySelector('.fc-start');
 const archive=document.getElementById('fc-history'),archiveLog=document.getElementById('fc-history-log');
 const history=[];let busy=false,sequence=0,pending=null;
 function scroll(){log.scrollTop=0;}
 function bubble(role,html){if(role.split(/\s+/).includes('kx-ik')&&log.children.length){for(const old of log.querySelectorAll('.fc-options'))old.remove();while(log.firstChild)archiveLog.appendChild(log.firstChild);archive.hidden=false;}const el=document.createElement('div');el.className='fc-message '+role;el.innerHTML=html;log.hidden=false;log.appendChild(el);scroll();return el;}
 function paragraph(parent,text,cls){const p=document.createElement('p');p.textContent=text;if(cls)p.className=cls;parent.appendChild(p);return p;}
 function sid(){try{let s=localStorage.getItem('kzsid');if(!s){s=crypto.randomUUID();localStorage.setItem('kzsid',s);}return s;}catch{return '';}}
 function show(el,reply){
  const result=parts(reply,config.market);el.replaceChildren();
  if(result.short)paragraph(el,result.short);
  if(result.answer!==result.short){const more=document.createElement('details');more.className='fc-more';const label=document.createElement('summary');label.textContent=config.text.more;more.appendChild(label);paragraph(more,result.answer);el.appendChild(more);}
  const path=String(reply.pad||('/'+(reply.pagina||'')));
  if(reply.pagina&&/^\/(?!\/)/.test(path)){const a=document.createElement('a');a.href='https://'+config.host+path;a.className='fc-guide';a.textContent=config.text.guide;el.appendChild(a);}
  if(result.follow){paragraph(el,result.follow,'fc-follow');const buttons=document.createElement('div');buttons.className='fc-options';for(const label of result.options){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>ask(label));buttons.appendChild(b);}if(buttons.children.length)el.appendChild(buttons);}
  scroll();
 }
 async function ask(raw){
  const q=String(raw||'').trim();if(busy||root.dataset.frontUpdateMode||q.length<2)return false;const request=++sequence;pending=new AbortController();busy=true;submit.disabled=true;starts.hidden=true;
  for(const old of log.querySelectorAll('.fc-options'))old.remove();
  const question=bubble('kx-ik','');question.textContent=q;const answer=bubble('kx-ant','');answer.textContent=config.text.thinking;input.value='';
  try{
   const r=await fetch('/api/keuze-tools?tool=intentie&op=chat',{method:'POST',headers:{'content-type':'text/plain'},signal:pending.signal,body:JSON.stringify({site:config.market,slug:'vraag',v:q,h:history.slice(-6),sid:sid()})});
   const j=await r.json();if(request!==sequence)return false;if(!r.ok||!j?.ok)throw Error('chat unavailable');show(answer,j);history.push(['v',q],['k',[j.a,j.vervolg].filter(Boolean).join(' ')]);
  }catch{if(request===sequence){answer.textContent=config.text.error;input.value=q;}}
  finally{if(request===sequence){busy=false;submit.disabled=false;pending=null;scroll();}}return true;
 }
 form.addEventListener('submit',e=>{e.preventDefault();ask(input.value);});
 for(const b of starts.querySelectorAll('button'))b.addEventListener('click',()=>ask(b.textContent));
 window.__kx={C:{taal:config.market,slug:'vraag'},bubbel:bubble,vraag:ask,cancel(){sequence++;pending?.abort();pending=null;busy=false;submit.disabled=false;}};
}
export function renderFrontChat(market,questions=[]){
 const text=LABELS[market],config={market,host:{nl:'keuzehulp.best',us:'whichtobuy.best',de:'kaufberater.best'}[market],text};
 return '<style>'+FRONT_CHAT_CSS+'</style><section class="fp-chat" id="kx" aria-label="'+text.label+'"><details class="fc-history" id="fc-history" hidden><summary>'+text.history+'</summary><div class="fc-history-log" id="fc-history-log"></div></details><div class="fc-log" id="kxa" role="log" aria-label="'+text.log+'" aria-live="polite" tabindex="0" hidden></div><form id="kxf"><input id="kxq" name="q" maxlength="160" autocomplete="off" aria-label="'+text.label+'" placeholder="'+text.placeholder+'"><button type="submit" aria-label="'+text.send+'">↑</button></form><div class="fc-start kx-ps">'+questions.slice(0,3).map(q=>'<button type="button">'+esc(q)+'</button>').join('')+'</div></section><script>('+frontChatClient.toString()+')('+JSON.stringify(config).replace(/</g,'\\u003c')+','+frontReplyParts.toString()+');</script>';
}
