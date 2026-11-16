// Daily, selected-topic mail. Existing changes-only subscribers keep their original consent.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';
import { SITE, SRC } from './tsc-data.js';
import NEWS from '../data/tsc-nieuws.json' with { type:'json' };
import { PROCEDURES, procedureSlug, procedureLabel } from './tsc-catalog.js';
import { signupPreferences, selectedTopics, matchesTopics, dueToday, dailyLesson, experimentVerdict, learningCohort, warmth, STAGES, CONSENT_VERSION } from './tsc-engagement.js';
import { stuur, tel, geopend, klik, stand as oldStand } from './tsc-mail.js';
import { decisionOverview } from './tsc-dental.js';
import { attribution, campaignKey, validView, normaliseCountry, exposureCohort, ACQUISITION_VERSION } from './tsc-acquisition.js';
export { geopend, klik, tel };
const hash=s=>createHash('sha256').update(String(s)).digest('hex');
const token=()=>randomBytes(24).toString('hex');
const day=()=>new Date().toISOString().slice(0,10);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=s=>SITE.base+(s?'/'+s:'');
const validToken=t=>/^[a-f0-9]{48}$/.test(t||'');
const texts={
 nl:{confirm:'Bevestig jouw dagelijkse updates',confirmP:'Je vroeg dagelijkse updates aan over onderstaande ingrepen. We bewaren je e-mailadres en gekozen gezondheidsinteresses om je deze mails te sturen. Bevestig alleen als je dit zelf hebt aangevraagd.',yes:'Ja, bevestig mijn keuzes',ignore:'Niet aangevraagd? Negeer deze mail.',heading:'Jouw dagelijkse keuzehulp',welcome:'Welkom bij jouw keuzehulp',news:'Nieuw voor jouw onderwerpen',oldNews:'Recente wijzigingen voor jouw onderwerpen',noNews:'Vandaag geen nieuwe bronwijziging voor jouw onderwerpen. Hieronder staat een keuzevraag uit onze vaste gids.',lesson:'Keuzevraag van vandaag',notNews:'Vaste keuzehulp, geen nieuw nieuws',ranking:'Bekijk de reviewranking',source:'Bron',prefs:'Mijn onderwerpen en keuzefase aanpassen',unsubscribe:'Afmelden met één klik',why:'Je krijgt deze mail na je bevestigde aanmelding. Je kunt je voorkeuren altijd wijzigen. Informatie, geen medisch advies.',daily:'Dagelijks rond 08:10 UTC.',changes:'Alleen bij wijzigingen.',stage:'Waar sta je nu? Geef het zelf aan bij je voorkeuren. We leiden dit niet af uit mailopens.',subjectA:'Jouw dagupdate: ',subjectB:'Meer duidelijkheid over ',saved:'Je voorkeuren zijn opgeslagen.'},
 en:{confirm:'Confirm your daily updates',confirmP:'You requested daily updates about the procedures below. We store your email and chosen health interests to provide these emails. Confirm only if you made this request.',yes:'Yes, confirm my choices',ignore:'Did not request this? Ignore this email.',heading:'Your daily decision help',welcome:'Welcome to your decision help',news:'New for your topics',oldNews:'Recent changes for your topics',noNews:'No new source changes for your topics today. Below is a decision question from our standing guide.',lesson:'Today’s decision question',notNews:'Standing decision help, not new news',ranking:'View the review ranking',source:'Source',prefs:'Change my topics and decision stage',unsubscribe:'Unsubscribe in one click',why:'You receive this after confirming your subscription. Change preferences at any time. Information, not medical advice.',daily:'Daily around 08:10 UTC.',changes:'Only when something changes.',stage:'Where are you in your decision? Tell us in your preferences. We do not infer this from email opens.',subjectA:'Your daily update: ',subjectB:'More clarity on ',saved:'Your preferences are saved.'},
 de:{confirm:'Tägliche Updates bestätigen',confirmP:'Sie haben tägliche Updates zu den folgenden Eingriffen angefordert. Dafür speichern wir E-Mail und gewählte Gesundheitsinteressen. Bestätigen Sie nur Ihre eigene Anfrage.',yes:'Ja, meine Auswahl bestätigen',ignore:'Nicht angefordert? Ignorieren Sie diese E-Mail.',heading:'Ihre tägliche Entscheidungshilfe',welcome:'Willkommen bei Ihrer Entscheidungshilfe',news:'Neu für Ihre Themen',oldNews:'Letzte Änderungen zu Ihren Themen',noNews:'Heute gibt es keine neuen Quellenänderungen zu Ihren Themen. Es folgt eine Entscheidungsfrage aus unserem bestehenden Leitfaden.',lesson:'Entscheidungsfrage des Tages',notNews:'Bestehende Entscheidungshilfe, keine neue Nachricht',ranking:'Bewertungsranking ansehen',source:'Quelle',prefs:'Themen und Entscheidungsphase ändern',unsubscribe:'Mit einem Klick abmelden',why:'Diese E-Mail folgt Ihrer bestätigten Anmeldung. Einstellungen sind jederzeit änderbar. Information, keine medizinische Beratung.',daily:'Täglich etwa 08:10 UTC.',changes:'Nur bei Änderungen.',stage:'Wo stehen Sie bei der Entscheidung? Teilen Sie es in den Einstellungen mit. E-Mail-Öffnungen bestimmen dies nicht.',subjectA:'Ihr Tagesupdate: ',subjectB:'Mehr Klarheit zu ',saved:'Ihre Einstellungen wurden gespeichert.'}
};
const items=()=>[...(NEWS.items||[])].sort((a,b)=>String(b.dag).localeCompare(String(a.dag)));
const language=a=>texts[a.taal]?a.taal:'en';
export function past(it,a) {
 if(!(it.taal==='*'||it.taal===language(a))||!matchesTopics(it,a))return false;
 const home=normaliseCountry(a.van),homes=it.home_countries||['*'];if(!homes.includes('*')&&!homes.includes(home))return false;
 const chosen=Array.isArray(a.follow_countries)?a.follow_countries:[],destinations=it.countries||['*'];if(chosen.length&&!destinations.includes('*')&&!chosen.some(c=>destinations.includes(c)))return false;
 return a.naar==='any'||!a.naar||(it.naar||['*']).some(x=>x==='*'||x===a.naar||x==='abroad'&&a.naar!=='home');
}
const wrap=(lang,title,body,footer)=>`<!doctype html><html lang="${lang}"><meta charset="utf-8"><body style="margin:0;background:#fff;color:#111;font:16px/1.6 Arial,sans-serif"><div style="max-width:580px;margin:auto;padding:24px"><p><b>todayin surgery</b></p><h1 style="font-size:24px">${esc(title)}</h1>${body}<hr><p style="font-size:13px">${footer}<br>AdsFair B.V. · Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands<br><a href="mailto:henkjan@todayin.email">henkjan@todayin.email</a></p></div></body></html>`;
const asText=html=>html.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,'$2 ($1)').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const topicNames=a=>selectedTopics(a).map(id=>procedureLabel(id,language(a))).join(', ');
export function routeMail(a,list,welcome=false,d=day()) {
 const lang=language(a),t=texts[lang],lesson=dailyLesson(a,d),first=selectedTopics(a)[0],slug=procedureSlug(lesson.topic,lang),variant=a.subject_variant==='B'?'B':'A';
 const pref=url('preferences')+'?t='+a.pref+'&mailday='+d;
 const news=list.length?`<h2 style="font-size:18px">${esc(welcome?t.oldNews:t.news)}</h2>`+list.map(it=>`<section><p style="font-size:13px">${esc(it.dag)}</p><h3 style="font-size:18px"><a href="${esc(url(it.pagina||'')+'?bron=mail')}">${esc(it.kop)}</a></h3><p>${esc(it.tekst)}</p>${SRC[it.bron]?`<p>${ext(SRC[it.bron].u,t.source+': '+SRC[it.bron].t)}</p>`:/^https?:\/\//.test(it.source_url||'')?`<p>${ext(it.source_url,t.source)}</p>`:''}</section>`).join(''):`<p>${esc(t.noNews)}</p>`;
 const body=`<p>${esc(topicNames(a))}</p>${news}${decisionOverview(a,lang,SITE.base,welcome,d)}<h2 style="font-size:18px">${esc(t.lesson)}: ${esc(lesson.title)}</h2><p>${esc(lesson.text)}</p><p style="font-size:13px">${esc(t.notNews)} · ${ext(lesson.source,t.source)}</p><p><a href="${esc(url(slug)+'?bron=mail')}">${esc(t.ranking)}: ${esc(lesson.label)}</a></p><p>${esc(t.stage)}</p><p><a href="${esc(pref)}">${esc(t.prefs)}</a></p>`;
 const html=wrap(lang,welcome?t.welcome:t.heading,body,`${esc(t.why)} ${esc(a.frequency==='daily'?t.daily:t.changes)} <a href="${esc(url('af')+'?t='+a.af)}">${esc(t.unsubscribe)}</a>`);
 return {subject:welcome?t.welcome:(variant==='B'?t.subjectB:t.subjectA)+topicNames(a).slice(0,100),html,text:asText(html),headers:{'List-Unsubscribe':'<'+url('af')+'?t='+a.af+'>','List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}};
}
const ext=(u,t)=>`<a href="${esc(u)}">${esc(t)}</a>`;
async function experiment(kind,cohort,variant,event,n=1) {
 const key='tsc:learn:'+kind+':'+cohort;
 await kv.raw(['HINCRBY',key,variant+'_'+event,String(n)]);await kv.raw(['EXPIRE',key,'34560000']);await kv.raw(['SADD','tsc:learn:cohorts',kind+':'+cohort]);
}
const readHash=raw=>Array.isArray(raw)?Object.fromEntries(Array.from({length:raw.length/2},(_,i)=>[raw[i*2],Number(raw[i*2+1])||0])):raw||{};
async function acquisitionMetric(at,event) {
 const labels=attribution(at),id=hash(campaignKey(labels)).slice(0,20),key='tsc:acq:'+day()+':'+id;
 await kv.set('tsc:acq:label:'+id,labels,{ex:34560000});await kv.raw(['SADD','tsc:acq:days:'+day(),id]);await kv.raw(['EXPIRE','tsc:acq:days:'+day(),'34560000']);await kv.raw(['HINCRBY',key,event,'1']);await kv.raw(['EXPIRE',key,'34560000']);
}
export async function acquisitionStand(days=7) {
 const rows=[];for(let i=0;i<Math.min(30,days);i++){const d=new Date(Date.now()-i*864e5).toISOString().slice(0,10);for(const id of (await kv.raw(['SMEMBERS','tsc:acq:days:'+d])||[]).slice(0,100)){rows.push({day:d,attribution:await kv.get('tsc:acq:label:'+id),...readHash(await kv.raw(['HGETALL','tsc:acq:'+d+':'+id]))});}}
 return {version:ACQUISITION_VERSION,unit:'browser_reported_visible_form_receipts; confirmed_first_optins',not_unique_people:true,delivery:'provider_acceptance_not_inbox_delivery',rows};
}
export async function mailEvent(b,ip,ua='') {
 if(!['signup_assign','signup_view'].includes(b.event)||b.visible!==true||!validView(b.view)||/bot|crawl|spider|preview|headless/i.test(ua))return {ok:false};
 if(b.event==='signup_view'){
  const r=validToken(b.receipt)?await kv.get('tsc:exposure-token:'+hash(b.receipt)):null;if(!r||r.view!==hash(b.view)||r.variant!==b.variant)return {ok:false};
  if(await kv.raw(['SET','tsc:exposure-count:'+hash(b.receipt),'1','NX','EX','259200'])){await kv.set('tsc:exposure-token:'+hash(b.receipt),{...r,seen:true},{ex:259200});await experiment('signup',r.cohort,r.variant,'seen');await acquisitionMetric(r.attribution,'visible_forms');}
  return {ok:true,variant:r.variant,receipt:r.token};
 }
 const lang=texts[b.taal]?b.taal:'en',topic=PROCEDURES.some(p=>p.id===b.topic)?b.topic:'all',cohort=exposureCohort(lang,topic),key='tsc:exposure:'+hash(b.view+':'+cohort);
 let receipt=await kv.get(key);if(receipt)return {ok:true,variant:receipt.variant,receipt:receipt.token};
 const rk='tsc:mv:'+hash(ip+':'+Math.floor(Date.now()/60000)).slice(0,24),n=await kv.incr(rk);if(n===1)await kv.raw(['EXPIRE',rk,'120']);if(n>30)return {ok:false,retry:true};
 const verdict=await policy('signup',cohort),variant=verdict.winner?(Math.random()<.9?verdict.winner:verdict.winner==='A'?'B':'A'):(parseInt(hash(b.view+':'+cohort).slice(0,4),16)%2?'B':'A');
 receipt={token:token(),variant,cohort,view:hash(b.view),seen:false,attribution:attribution(b.attribution),at:Date.now()};
 if(await kv.raw(['SET',key,JSON.stringify(receipt),'NX','EX','259200'])){await kv.set('tsc:exposure-token:'+hash(receipt.token),receipt,{ex:259200});}
 else receipt=await kv.get(key);
 return {ok:true,variant:receipt.variant,receipt:receipt.token};
}
// Atomic partial updates preserve concurrent unsubscribe and preference changes.
export async function patchSubscription(id,patch) {
 const key='tsc:abo:'+id;
 for(let attempt=0;attempt<12;attempt++){
  const previous=await kv.raw(['GET',key]);if(!previous)return null;
  const merged={...JSON.parse(previous),...patch},next=JSON.stringify(merged);
  const saved=await kv.raw(['EVAL',"if redis.call('GET',KEYS[1])==ARGV[1] then redis.call('SET',KEYS[1],ARGV[2]); return 1 else return 0 end",'1',key,previous,next]);
  if(Number(saved)===1)return merged;
 }
 throw Error('subscription changed; retry');
}
export async function afmelden(t) {
 if(!validToken(t))return null;const id=await kv.get('tsc:af:'+hash(t));if(!id)return null;
 const a=await patchSubscription(id,{actief:false,afAt:Date.now()});if(!a)return null;
 await kv.raw(['SREM','tsc:abos',id]);await tel('af');return a;
}
const preferenceSignature=a=>hash(JSON.stringify([selectedTopics(a),a.frequency||'changes',a.consent_version||'legacy',a.naar||'any',a.taal,a.van||'other',a.follow_countries||[]]));
async function policy(kind,cohort) {
 const m=readHash(await kv.raw(['HGETALL','tsc:learn:'+kind+':'+cohort]).catch(()=>[]));
 return experimentVerdict(m.A_seen,m.A_yes,m.B_seen,m.B_yes);
}
export async function deliver(a,news,welcome=false,d=day()) {
 const lock='tsc:sendlock:'+a.id,value=token();if(!await kv.raw(['SET',lock,value,'NX','EX','600']))return false;
 try{
  let fresh=await kv.get('tsc:abo:'+a.id);if(!fresh?.actief||fresh.laatst===d)return false;
  if(!fresh.pref){const pref=token();await kv.set('tsc:pref:'+hash(pref),fresh.id);fresh=await patchSubscription(fresh.id,{pref});}
  news=items().filter(it=>past(it,fresh)&&(welcome||!(Array.isArray(fresh.gezien)?fresh.gezien:[]).includes(it.id))).slice(0,welcome?3:4);
  if(!welcome&&!dueToday(fresh,d,news))return false;
  const key='tsc:outbox:'+a.id+':'+d;let box=await kv.get(key);
  if(!box){
   const cohort=learningCohort(fresh),verdict=fresh.learn?await policy('subject',cohort):{winner:null};
   let variant=fresh.subject_variant==='B'?'B':'A';
   if(verdict.winner)variant=parseInt(hash(a.id+':'+d).slice(0,4),16)%10===0?(verdict.winner==='A'?'B':'A'):verdict.winner;
   const candidate={message:routeMail({...fresh,subject_variant:variant},news,welcome,d),news:news.map(x=>x.id),cohort,variant,signature:preferenceSignature(fresh),at:Date.now()};
   await kv.raw(['SET',key,JSON.stringify(candidate),'NX','EX','691200']);box=await kv.get(key);
  }
  const latest=await kv.get('tsc:abo:'+a.id);if(!latest?.actief||preferenceSignature(latest)!==box.signature)return false;
  await stuur([{to:[fresh.email],...box.message}],'tsc-daily-v3-'+fresh.id+'-'+d);
  const update={gezien:[...new Set([...(Array.isArray(fresh.gezien)?fresh.gezien:[]),...box.news])].slice(-300),laatst:d};
  if(fresh.learn)update.last_experiment={day:d,cohort:box.cohort,variant:box.variant};
  fresh=await patchSubscription(a.id,update);
  if(await kv.raw(['SET','tsc:sentmetric:'+fresh.id+':'+d,'1','NX','EX','691200'])){await tel('verstuurd');if(fresh.learn)await experiment('subject',box.cohort,box.variant,'seen');await acquisitionMetric(fresh.attribution,'daily_provider_accepted');}
  return true;
 }finally{await kv.raw(['EVAL',"if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",'1',lock,value]).catch(()=>null);}
}
export async function aanmelden(b,ip) {
 const email=String(b.email||'').trim().toLowerCase();if(!/^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i.test(email)||email.length>254)return {ok:false,fout:'email'};
 if(b.website)return {ok:true};
 const p=signupPreferences(b);if(!p.ok)return p;
 const rk='tsc:rl:'+hash(ip+':'+Math.floor(Date.now()/60000)).slice(0,24),n=await kv.incr(rk);if(n===1)await kv.raw(['EXPIRE',rk,'120']);if(n>6)return {ok:false,fout:'druk',retry:true};
 const id=hash('tsc:'+email).slice(0,32),lock='tsc:confirm-send:'+id,lockValue=token();if(!await kv.raw(['SET',lock,lockValue,'NX','EX','60']))return {ok:false,fout:'bezig',retry:true};
 try {
  const lang=texts[b.taal]?b.taal:'en',origin=normaliseCountry(b.van),follow=Array.isArray(b.follow_countries)?[...new Set(b.follow_countries.map(x=>normaliseCountry(x,'')).filter(Boolean))].slice(0,8):[],receipt=validToken(b.receipt)?await kv.get('tsc:exposure-token:'+hash(b.receipt)):null;
  const signature=hash(JSON.stringify([email,lang,p.topics,p.frequency,p.learn,p.stage,origin,follow])),boxKey='tsc:confirmbox:'+id;let box=await kv.get(boxKey);
  if(box?.signature===signature&&box.sent)return {ok:true};
  if(!box||box.signature!==signature){
   const dn=await kv.incr('tsc:bevdag:'+day());if(dn===1)await kv.raw(['EXPIRE','tsc:bevdag:'+day(),'172800']);if(dn>400)return {ok:false,fout:'druk',retry:true};
   const confirm=token(),pending={...p,id,email,taal:lang,naar:'any',van:origin,follow_countries:follow,pad:String(b.pad||'').replace(/[^a-z0-9/-]/g,'').slice(0,100),at:Date.now(),attribution:receipt?.attribution||attribution(b.attribution),exposure:receipt?hash(b.receipt):null,consent_method:b.consent_method==='request_button_and_email_confirmation'?b.consent_method:'explicit_request_and_email_confirmation',signup_variant:receipt?.variant||null,signup_cohort:receipt?.cohort||null,subject_variant:parseInt(hash(id).slice(0,4),16)%2?'A':'B'};
   box={signature,confirm,pending,sent:false};await kv.set(boxKey,box,{ex:600});await kv.set('tsc:pend:'+hash(confirm),pending,{ex:259200});
  }
  const t=texts[lang],body=`<p>${esc(t.confirmP)}</p><p><b>${esc(topicNames(box.pending))}</b></p><p>${esc(p.frequency==='daily'?t.daily:t.changes)}</p><p>${ext(url('bevestig')+'?t='+box.confirm+'&taal='+lang,t.yes)}</p><p>${esc(t.ignore)}</p>`,html=wrap(lang,t.confirm,body,'AdsFair B.V.');
  await stuur([{to:[email],subject:t.confirm,html,text:asText(html)}],'tsc-bev-'+hash(box.confirm).slice(0,32));
  await kv.set(boxKey,{...box,sent:true},{ex:600});
  if(await kv.raw(['SET','tsc:confirm-request-count:'+hash(box.confirm),'1','NX','EX','259200'])){await tel('aanvraag');await tel('aanvraag_'+lang);await acquisitionMetric(box.pending.attribution,'confirmation_requests');}
  return {ok:true};
 }catch(e){await tel('bevestigmail_fout').catch(()=>null);await acquisitionMetric(attribution(b.attribution),'confirmation_provider_error').catch(()=>null);return {ok:false,fout:'mail_tijdelijk',retry:true};}
 finally{await kv.raw(['EVAL',"if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",'1',lock,lockValue]).catch(()=>null);}
}
export async function bevestig(t) {
 if(!validToken(t))return null;const p=await kv.get('tsc:pend:'+hash(t));if(!p)return null;
 const old=await kv.get('tsc:abo:'+p.id);if(p.klaar){const a={...(old||p),al:true};if(old?.actief&&old.laatst!==day()){try{a.welcome_accepted=await deliver(old,[],true);}catch(e){a.welcome_accepted=false;}}return a;}
 if(!await kv.raw(['SET','tsc:confirm-lock:'+hash(t),'1','NX','EX','30']))return old||p;
 const a={...(old||{}),...p,actief:true,bevestigd:Date.now(),af:old?.af||token(),pref:old?.pref||token(),gezien:Array.isArray(old?.gezien)?old.gezien:[]};delete a.ok;delete a.klaar;
 // Pending requests made before this version remain changes-only.
 if(p.consent_version!==CONSENT_VERSION){a.frequency='changes';a.learn=false;}
 a.stage_at=a.stage?Date.now():null;
 await kv.set('tsc:abo:'+p.id,a);await kv.set('tsc:af:'+hash(a.af),p.id);await kv.set('tsc:pref:'+hash(a.pref),p.id);await kv.raw(['SADD','tsc:abos',p.id]);await kv.set('tsc:pend:'+hash(t),{...p,klaar:Date.now()},{ex:259200});
 if(!old?.bevestigd){await tel('bevestigd');await tel('bevestigd_'+a.taal);await acquisitionMetric(a.attribution,'confirmed_first_optins');if(p.signup_cohort&&p.exposure&&(await kv.get('tsc:exposure-token:'+p.exposure))?.seen&&await kv.raw(['SET','tsc:exposure-outcome:'+p.exposure,'1','NX','EX','34560000']))await experiment('signup',p.signup_cohort,p.signup_variant,'yes');}
 const news=items().filter(it=>past(it,a)).slice(0,3);
 // Welcome counts as this day's mail. The cron must not send a second daily message.
 try{a.welcome_accepted=await deliver(a,news,true);}catch(e){a.welcome_accepted=false;await tel('mailfout');}
 return a;
}
export async function preferences(t) {
 if(!validToken(t))return null;const id=await kv.get('tsc:pref:'+hash(t));return id?kv.get('tsc:abo:'+id):null;
}
export async function savePreferences(b) {
 const a=await preferences(b.token);if(!a)return {ok:false,fout:'token'};
 const pref=signupPreferences(b);if(!pref.ok)return pref;
 const prior=a.stage,patch={...pref,stage_at:pref.stage?Date.now():null,preferences_at:Date.now()};delete patch.ok;
 if(b.van)patch.van=normaliseCountry(b.van);if(Array.isArray(b.follow_countries))patch.follow_countries=[...new Set(b.follow_countries.map(x=>normaliseCountry(x,'')).filter(Boolean))].slice(0,8);
 const saved=await patchSubscription(a.id,patch);if(!saved)return {ok:false};
 // Only a deliberate POST and separately consented measurement can contribute to the email experiment.
 if(saved.learn&&saved.stage&&prior!==saved.stage){await tel('fase_'+saved.stage);const x=saved.last_experiment;if(x&&b.mailday===x.day&&Date.now()-Date.parse(x.day+'T00:00:00Z')<7*864e5){if(await kv.raw(['SET','tsc:subject-action:'+saved.id+':'+x.day,'1','NX','EX','691200']))await experiment('subject',x.cohort,x.variant,'yes');}}
 return {ok:true,warmth:warmth(saved)};
}
export async function ronde({droog=false}={}) {
 const ids=((await kv.raw(['SMEMBERS','tsc:abos']))||[]).sort(),d=day(),out={dag:d,abonnees:ids.length,mail:0,geenNieuws:0,alVandaag:0,fouten:[],droog},all=items();
 let cursor=0;
 const worker=async()=>{while(cursor<ids.length){const id=ids[cursor++];
  try{
   const a=await kv.get('tsc:abo:'+id);if(!a?.actief)continue;
   const seen=new Set(Array.isArray(a.gezien)?a.gezien:[]),news=all.filter(it=>past(it,a)&&!seen.has(it.id)).slice(0,4);
   if(a.laatst===d){out.alVandaag++;continue;}if(!dueToday(a,d,news)){out.geenNieuws++;continue;}
   if(droog){out.mail++;continue;}
   if(await deliver(a,news,false,d))out.mail++;
  }catch(e){out.fouten.push(String(e.message||e).slice(0,100));if(!droog)await tel('mailfout');}
 }};
 // Every active subscriber is considered. No first-90 starvation; bounded concurrent provider requests.
 await Promise.all(Array.from({length:Math.min(5,ids.length)},worker));
 if(!droog)await kv.set('tsc:ronde',{...out,fouten:out.fouten.slice(0,10),at:new Date().toISOString()});
 return {...out,fouten:out.fouten.slice(0,10)};
}

export async function learningStand() {
 const keys=(await kv.raw(['SMEMBERS','tsc:learn:cohorts']).catch(()=>[]))||[],cohorts=[];
 for(const key of keys.slice(0,300)){const m=readHash(await kv.raw(['HGETALL','tsc:learn:'+key]));cohorts.push({cohort:key,...m,verdict:experimentVerdict(m.A_seen,m.A_yes,m.B_seen,m.B_yes)});}
 return {version:ACQUISITION_VERSION,outcomes:{signup:'confirmed_first_optin_per_acknowledged_visible_form',subject:'explicit_changed_stage_after_mail_among_consented_readers'},opens_used_for_warmth:false,automatic_clicks_used_for_warmth:false,cohorts};
}
export async function stand(){return {...await oldStand(),learning:await learningStand(),acquisition:await acquisitionStand(),delivery:'daily_for_explicit_daily_consent; legacy_changes_only',warmth_basis:'self_declared_stage; not a medical assessment or consultation request'};}

