// Een agent kan op uitnodiging een voorstel doen voor elk type kaart, ook toekomstige producten.
// Een ontvangen voorstel is geen bevestigde match, levering, bestelling of betaalmandaat.
import { createHash, randomBytes } from 'node:crypto';
import { telVraag } from './sealed-vragen.js';
import { verbergContact } from './sealed-contact.js';
const hash=s=>createHash('sha256').update(String(s)).digest('hex');
const schoon=(s,n=500,veld='')=>verbergContact(s,n,veld).replace(/https?:\/\/\S+/gi,'[link]').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const AGENT_PROTOCOL={versie:1,doel:'Lees een voorwaardelijke vraag en dien een niet-bindend voorstel in, als persoon, bedrijf of agent.',endpoint:'https://sealedintent.com/?op=gwagent',method:'POST',acties:{lees:{actie:'lees',token:'uitnodigingstoken'},antwoord:{actie:'antwoord',token:'uitnodigingstoken',requestId:'unieke-id-van-dit-voorstel',actor:'agent',omschrijving:'Wat kan worden geleverd of geregeld?',aantal:1,prijs:0,munt:'EUR',leverdatum:'YYYY-MM-DD',voorwaarden:['Specificatie, garantie of voorwaarde'],antwoorden:{criterium_id:'Het eigen aanbod op dit criterium'}}},regel:'Alleen een expliciet gedeelde kaart is leesbaar. De eigenaar beslist zelf of een voorstel past. Dit protocol plaatst geen orders en voert geen betalingen uit.'};

async function kaartVoor(kv,b){
  if(!/^[a-f0-9]{16}$/.test(String(b.i||'')))return null;
  const r=await kv.get('gw:k:'+b.i).catch(()=>null);
  return r&&r.sHash===hash(b.s)&&r.status!=='ingetrokken'&&(!r.expires||Date.parse(r.expires)>Date.now())?r:null;
}
async function uitnodigingVoor(kv,token){
  if(!/^[a-f0-9]{48}$/.test(String(token||'')))return null;
  const cap=await kv.get('gw:agent:'+hash(token)).catch(()=>null);if(!cap||Date.parse(cap.tot)<Date.now())return null;
  const kaart=await kv.get('gw:k:'+cap.i).catch(()=>null);
  if(!kaart||kaart.status==='ingetrokken'||(kaart.expires&&Date.parse(kaart.expires)<Date.now()))return null;
  return {cap,kaart};
}
export async function agentActie(kv,b){
  if(b.actie==='uitnodiging'){
    const r=await kaartVoor(kv,b);if(!r||!r.kwaliteit?.bevestigd)return{ok:false,fout:'kaart niet gevonden of nog niet bevestigd'};
    const token=randomBytes(24).toString('hex'),tot=new Date(Math.min(Date.now()+7*864e5,r.expires?Date.parse(r.expires):Infinity)).toISOString();
    await kv.set('gw:agent:'+hash(token),{i:r.id,tot},{ex:7*86400});
    return{ok:true,link:'https://sealedintent.com/?op=gwagentpagina#'+token,endpoint:AGENT_PROTOCOL.endpoint,token,tot};
  }
  const x=await uitnodigingVoor(kv,b.token);if(!x)return{ok:false,fout:'uitnodiging verlopen of niet geldig'};
  if(b.actie==='lees'){
    const k=x.kaart.kaart;
    return{ok:true,tot:x.cap.tot,vraag:{titel:k.titel,richting:k.richting,object:k.object||'',zoekt:k.zoekt||'',biedt:k.biedt||'',waar:k.waar||'',wanneer:k.wanneer||'',budget:k.budget||'',mits:k.mits||'',niet:k.niet||'',criteria:k.criteria||[]},protocol:AGENT_PROTOCOL};
  }
  if(b.actie!=='antwoord')return{ok:false,fout:'onbekende actie'};
  const rid=String(b.requestId||'');if(!/^[a-zA-Z0-9_-]{6,64}$/.test(rid))return{ok:false,fout:'geef een unieke requestId (6 tot 64 letters, cijfers of streepjes)'};
  const once='gw:agent:once:'+hash(b.token+':'+rid),eerder=await kv.get(once).catch(()=>null);if(eerder)return{ok:true,id:eerder,status:'te_beoordelen',opnieuw:true};
  const omschrijving=schoon(b.omschrijving);if(omschrijving.length<5)return{ok:false,fout:'beschrijf wat wordt aangeboden'};
  const aantal=b.aantal==null||b.aantal===''?null:Number(b.aantal),prijs=b.prijs==null||b.prijs===''?null:Number(b.prijs),munt=String(b.munt||'').toUpperCase();
  if((aantal!=null&&(!Number.isFinite(aantal)||aantal<=0||aantal>1e9))||(prijs!=null&&(!Number.isFinite(prijs)||prijs<0||prijs>1e12))||(prijs!=null&&!/^[A-Z]{3}$/.test(munt)))return{ok:false,fout:'aantal, prijs of munt klopt niet'};
  let leverdatum=String(b.leverdatum||'');if(leverdatum){if(!/^\d{4}-\d{2}-\d{2}$/.test(leverdatum)||Number.isNaN(Date.parse(leverdatum))||new Date(leverdatum).toISOString().slice(0,10)!==leverdatum||leverdatum<new Date().toISOString().slice(0,10))return{ok:false,fout:'geef een geldige huidige of toekomstige leverdatum'};}
  const lijst=await kv.get('gw:reacties:'+x.kaart.id).catch(()=>[])||[];
  if(lijst.length>=30)return{ok:false,fout:'voldoende voorstellen ontvangen; laat de eigenaar eerst beoordelen'};
  const ids=new Set((x.kaart.kaart.criteria||[]).map(c=>c.id)),antwoorden={};for(const [id,v]of Object.entries(b.antwoorden||{}))if(ids.has(id))antwoorden[id]=schoon(v,300,id);
  const r={id:randomBytes(8).toString('hex'),at:new Date().toISOString(),actor:['persoon','bedrijf','agent'].includes(b.actor)?b.actor:'agent',omschrijving,aantal,prijs,munt:prijs==null?'':munt,leverdatum,voorwaarden:(Array.isArray(b.voorwaarden)?b.voorwaarden:[]).slice(0,10).map(x=>schoon(x,300)),antwoorden,status:'te_beoordelen',mandaat:'niet geverifieerd'};
  lijst.push(r);await kv.set('gw:reacties:'+x.kaart.id,lijst,{ex:60*86400});await kv.set(once,r.id,{ex:7*86400});
  if(!x.kaart.proef){const sid=await kv.get('gw:kaart-sessie:'+x.kaart.id).catch(()=>null),s=sid?await kv.get('gw:s:'+sid).catch(()=>null):null;for(const sp of s?.spoor||[])await telVraag(kv,sp,'voorstel_ontvangen');}
  return{ok:true,id:r.id,status:r.status,regel:'Voorstel ontvangen. De eigenaar beoordeelt het; er is geen bestelling of betaling uitgevoerd.'};
}

export async function reacties(kv,id){return await kv.get('gw:reacties:'+id).catch(()=>[])||[];}
export function reactiesHtml(lijst){return lijst.length?'<h2>Ontvangen voorstellen</h2>'+lijst.map(r=>`<section class="kaart"><div class="bar">${esc(r.actor==='agent'?'Voorstel van een agent':'Ontvangen voorstel')}</div><dl><div class="row"><dt>Voorstel</dt><dd>${esc(r.omschrijving)}</dd></div>${r.aantal!=null?`<div class="row"><dt>Aantal</dt><dd>${esc(r.aantal)}</dd></div>`:''}${r.prijs!=null?`<div class="row"><dt>Prijs</dt><dd>${esc(r.munt+' '+r.prijs)}</dd></div>`:''}${r.leverdatum?`<div class="row"><dt>Leverdatum</dt><dd>${esc(r.leverdatum)}</dd></div>`:''}${r.voorwaarden.map(v=>`<div class="row"><dt>Voorwaarde</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="rule">Nog te beoordelen. Dit is geen bevestigde levering of bestelling.</p></section>`).join(''):'';}

export function agentPagina(){return`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Respond to an invitation | Sealed Intent</title><style>*{box-sizing:border-box}body{font:17px/1.55 Inter,-apple-system,sans-serif;color:#111;background:#fff;margin:0}main{max-width:680px;margin:auto;padding:24px 20px}h1{font-size:32px;line-height:1.1}input,textarea,select,button{font:inherit;padding:12px;border:1px solid #111;border-radius:12px}input,textarea{display:block;width:100%;margin:6px 0 14px}button{background:#111;color:#fff;cursor:pointer;min-height:44px}dt{font-weight:bold}dd{margin:0 0 12px}pre{white-space:pre-wrap;word-break:break-word}label{display:block}section{border-top:1px solid #ddd;padding-top:16px}</style></head><body><main><h1>A proposal on these conditions</h1><p>This invitation can be answered by a person, company or agent. A proposal is not an order or payment authorisation.</p><p id="status" role="status">Loading the request…</p><dl id="vraag"></dl><form id="form" hidden><label>Responding as<select id="actor"><option value="agent">Agent</option><option value="bedrijf">Company</option><option value="persoon">Person</option></select></label><label>What can you provide?<textarea id="omschrijving" required></textarea></label><label>Quantity (optional)<input id="aantal" type="number" min="0.00001" step="any"></label><label>Total price (optional)<input id="prijs" type="number" min="0" step="any"></label><label>Currency<input id="munt" value="EUR" maxlength="3"></label><label>Available or delivered on (optional)<input id="leverdatum" type="date"></label><label>Conditions, one per line<textarea id="voorwaarden"></textarea></label><button>Submit proposal</button></form><details><summary>For an agent</summary><p>Use the API with the invitation token from the part after # in this URL. POST action lees to read the request or antwoord to submit. The public protocol is at <a href="/?op=gwagent">gwagent</a>.</p></details></main><script>(function(){const $=i=>document.getElementById(i),token=location.hash.slice(1),api='/?op=gwagent',post=async b=>(await fetch(api,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,...b})})).json();const row=(k,v)=>{if(!v)return;const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;$('vraag').append(dt,dd)};post({actie:'lees'}).then(j=>{if(!j.ok)throw Error();for(const k of ['titel','zoekt','biedt','waar','wanneer','budget','mits','niet'])row(k,j.vraag[k]);(j.vraag.criteria||[]).forEach(c=>row(c.label,c.waarde||(c.onbekend?'Still open':'')));$('status').textContent='Read the request and provide your own conditions.';$('form').hidden=false}).catch(()=>$('status').textContent='This invitation is invalid or has expired.');let rid='web-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);$('form').onsubmit=async e=>{e.preventDefault();const b=$('form').querySelector('button');b.disabled=true;try{const j=await post({actie:'antwoord',requestId:rid,actor:$('actor').value,omschrijving:$('omschrijving').value,aantal:$('aantal').value,prijs:$('prijs').value,munt:$('munt').value,leverdatum:$('leverdatum').value,voorwaarden:$('voorwaarden').value.split(String.fromCharCode(10)).filter(Boolean)});if(!j.ok){$('status').textContent=j.fout||'Please check your proposal.';return}$('status').textContent='Proposal received. The owner will review it. No order or payment has been made.';$('form').hidden=true}catch(e){$('status').textContent='Could not send. Your text is still here.'}finally{b.disabled=false}}})()</script></body></html>`;}
