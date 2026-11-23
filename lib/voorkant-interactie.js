export const FRONT_FEEDBACK_TEXT={
 nl:{updated:'Bijgewerkt',published:'Toegevoegd',unknown:'Updatedatum onbekend',update:'Vraag om update',sent:'Verzoek geregistreerd',failed:'Dat is niet opgeslagen. Probeer opnieuw.',busy:'Even opslaan…',vote:'Deze wil ik eerst',chosen:'Jouw stem · intrekken',votes:'stemmen',oneVote:'Welke wil jij als eerste? Kies je favoriet. Je kunt je stem veranderen of intrekken.',voteSaved:'Je stem is opgeslagen.',voteRemoved:'Je stem is ingetrokken.',request:'Ik wil een update van: ',reply:'Je updateverzoek is geregistreerd. Wat wil je laten controleren?',draft:'Update voor ',draftEnd:': ',nojs:'Zet JavaScript aan om te stemmen of een updateverzoek te registreren.'},
 us:{updated:'Updated',published:'Added',unknown:'Update date unknown',update:'Request an update',sent:'Request recorded',failed:'This was not saved. Please try again.',busy:'Saving…',vote:'I want this first',chosen:'Your vote · withdraw',votes:'votes',oneVote:'Which would you like first? Pick your favourite. You can change or withdraw your vote.',voteSaved:'Your vote has been saved.',voteRemoved:'Your vote has been withdrawn.',request:'I would like an update to: ',reply:'Your update request is recorded. What would you like us to check?',draft:'Update to ',draftEnd:': ',nojs:'Enable JavaScript to vote or record an update request.'},
 de:{updated:'Aktualisiert',published:'Hinzugefügt',unknown:'Aktualisierungsdatum unbekannt',update:'Update anfragen',sent:'Anfrage erfasst',failed:'Das wurde nicht gespeichert. Bitte erneut versuchen.',busy:'Wird gespeichert…',vote:'Das möchte ich zuerst',chosen:'Deine Stimme · zurückziehen',votes:'Stimmen',oneVote:'Was möchtest du zuerst sehen? Wähle deinen Favoriten. Du kannst deine Stimme ändern oder zurückziehen.',voteSaved:'Deine Stimme wurde gespeichert.',voteRemoved:'Deine Stimme wurde zurückgezogen.',request:'Ich möchte ein Update zu: ',reply:'Deine Update-Anfrage wurde erfasst. Was sollen wir überprüfen?',draft:'Update zu ',draftEnd:': ',nojs:'Aktiviere JavaScript, um abzustimmen oder eine Update-Anfrage zu erfassen.'}
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validFrontDate(v,today=new Date().toISOString().slice(0,10)){
 const d=String(v||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d&&d<=today?d:null;
}
export function frontDate(item,market){
 const t=FRONT_FEEDBACK_TEXT[market],updated=validFrontDate(item?.updatedAt),published=validFrontDate(item?.publishedAt||item?.publishAt),d=updated||published;
 return '<span class="fp-updated">'+(d?(updated?t.updated:t.published)+' <time datetime="'+d+'">'+new Date(d+'T12:00:00Z').toLocaleDateString({nl:'nl-NL',us:'en-US',de:'de-DE'}[market],{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})+'</time>':t.unknown)+'</span>';
}
export function frontUpdate(item,market){
 const t=FRONT_FEEDBACK_TEXT[market];return '<div class="fp-maintenance">'+frontDate(item,market)+'<a class="fp-update" href="#kx" data-front-update="'+esc(item.slug)+'" data-update-title="'+esc(item.title||item.slug)+'">'+t.update+'</a></div>';
}
export function frontVote(plan,market,count){
 const t=FRONT_FEEDBACK_TEXT[market];return '<div class="fp-vote"><button type="button" class="fp-action" data-front-vote="'+esc(plan.id)+'" aria-pressed="false">'+t.vote+'</button><span class="fp-vote-count" data-votes-for="'+esc(plan.id)+'"'+(!(count>0)?' hidden':'')+'>'+(count>0?count+' '+t.votes:'')+'</span></div>';
}
export const FRONT_FEEDBACK_CSS=`.fp-maintenance{display:flex;flex-wrap:wrap;gap:5px 14px;align-items:baseline;margin:7px 0 15px;font-size:13px}.fp-updated{display:block;font-size:13px}.fp-guide .fp-update,.fp-update{display:inline-flex;align-items:center;min-height:44px;padding:5px 0;text-decoration:underline;font-size:13px}.fp-tool-wrap{border:1px solid #111113;border-radius:20px;padding:22px;min-width:0}.fp-tool-wrap>.fp-tool{border:0;padding:0;border-radius:0}.fp-tool-wrap>.fp-maintenance{margin-bottom:0}.fp-vote{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:auto;padding-top:4px}.fp-vote button{font:inherit;background:#fff;color:#111113;cursor:pointer}.fp-vote button[aria-pressed=true]{background:#111113;color:#fff}.fp-vote-count{font-size:13px}.fp-vote~.fp-action{margin-top:0}.fp-feedback{font-size:16px;max-width:65ch}.fp-feedback:empty{display:none}.fp-service{border:1px solid #111113;border-radius:20px;padding:18px;min-width:0}.fp-service>.fp-pill{border:0;padding:0;min-height:0;font-weight:700;text-decoration:underline}.fp-service>.fp-maintenance{margin-bottom:0}.fp-services{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.fp-action[disabled],.fp-update[aria-disabled=true]{cursor:wait}@media(max-width:760px){.fp-services{grid-template-columns:1fr 1fr}}@media(max-width:480px){.fp-services{grid-template-columns:1fr}}`;
export function frontFeedbackClient(config){
 const root=document.querySelector('[data-front]');if(!root)return;
 const t=config.text,status=document.querySelector('[data-front-feedback]'),voteButtons=[...root.querySelectorAll('[data-front-vote]')];
 const key='front-choice:'+config.scope+':'+config.market;let selected='',busy=false;
 function get(k){try{return localStorage.getItem(k)||'';}catch{return '';}}
 function put(k,v){try{localStorage.setItem(k,v);}catch{}}
 let browser=get('front-browser');if(!/^[a-zA-Z0-9_-]{16,80}$/.test(browser)){browser=globalThis.crypto?.randomUUID?.()||Array.from({length:32},()=>Math.floor(Math.random()*16).toString(16)).join('');put('front-browser',browser);}
 selected=get(key);
 function votes(choice,counts){selected=choice||'';for(const b of voteButtons){const on=b.dataset.frontVote===selected;b.setAttribute('aria-pressed',String(on));b.textContent=on?t.chosen:t.vote;b.disabled=false;}if(counts)for(const el of root.querySelectorAll('[data-votes-for]')){const n=Number(counts[el.dataset.votesFor])||0;el.hidden=n<=0;el.textContent=n>0?n+' '+t.votes:'';}}
 votes(selected);
 async function send(action,target,active){const r=await fetch('/api/keuze-voorkant?market='+config.market+'&op=feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,target,active,browser})});const j=await r.json();if(!r.ok||!j.ok)throw Error('not saved');return j;}
 for(const b of voteButtons)b.addEventListener('click',async()=>{if(busy)return;busy=true;for(const x of voteButtons)x.disabled=true;status.textContent=t.busy;try{const j=await send('vote',b.dataset.frontVote,selected!==b.dataset.frontVote);votes(j.choice,j.votes);put(key,selected);status.textContent=selected?t.voteSaved:t.voteRemoved;}catch{status.textContent=t.failed;votes(selected);}finally{busy=false;}});
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 for(const a of root.querySelectorAll('[data-front-update]'))a.addEventListener('click',async e=>{
  e.preventDefault();if(a.getAttribute('aria-disabled')==='true')return;a.setAttribute('aria-disabled','true');const original=a.textContent;a.textContent=t.busy;
  try{await send('update',a.dataset.frontUpdate);a.textContent=t.sent;const title=a.dataset.updateTitle||a.dataset.frontUpdate,kx=window.__kx;
   if(kx?.bubbel){kx.bubbel('kx-ik',escape(t.request+title));kx.bubbel('kx-ant',escape(t.reply));}
   const chat=document.getElementById('kx'),input=document.querySelector('#kxf input[name=q]');if(chat)chat.scrollIntoView({behavior:'smooth',block:'start'});if(input){input.value=t.draft+title.slice(0,65)+t.draftEnd;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});}else status.textContent=t.sent;
  }catch{a.textContent=original;status.textContent=t.failed;status.scrollIntoView({behavior:'smooth',block:'nearest'});}finally{a.removeAttribute('aria-disabled');}
 });
}
