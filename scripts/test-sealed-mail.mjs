// Ketentest van Sealed Intent per mail (lib/sealed-mail.js) met nagebootste opslag, mail en AI: node scripts/test-sealed-mail.mjs
// Loopt de hele keten door: bevestigen, lead, schuiladressen, de AI ertussen, keuren, tips en tellen, JA, STOP, koper per mail, weekmail.
process.env.HJDK_TOKEN='test-geheim'; process.env.RESEND='re_test';
const M = await import('../lib/sealed-mail.js');
const db=new Map(), lists=new Map();
const kv={ async get(k){return db.has(k)?JSON.parse(db.get(k)):null}, async set(k,v){db.set(k,JSON.stringify(v));return 'OK'}, async incr(k){const n=(+(db.get(k)||0))+1;db.set(k,String(n));return n}, async mget(...ks){return ks.map(k=>db.has(k)?JSON.parse(db.get(k)):null)}, async del(ks){ks.forEach(k=>db.delete(k));return 1},
 async raw(a){const [c,k,...r]=a.map(String); if(c==='LPUSH'){lists.set(k,[r[0],...(lists.get(k)||[])]);return 1} if(c==='LRANGE')return (lists.get(k)||[]).slice(+r[0],+r[1]+1); if(c==='SET'){ if(r.includes('NX')&&db.has(k))return null; db.set(k,JSON.stringify(r[0]));return 'OK'} return 1}};
const uit=[]; const inbox=new Map();
globalThis.fetch=async(u,o={})=>{ if(String(u).endsWith('/emails')&&o.method==='POST'){uit.push(JSON.parse(o.body));return {ok:true,json:async()=>({id:'x'})}} const m=String(u).match(/receiving\/(.+)$/); if(m)return {ok:inbox.has(m[1]),json:async()=>inbox.get(m[1])}; return {ok:false,json:async()=>({})}};
const melds=[]; const meld=async t=>{melds.push(t);return true};
let fout=0; const ok=(n,c)=>{ if(!c){fout++;console.log('FOUT',n)} else console.log('ok  ',n)};
const iid='a'.repeat(32), bid='b'.repeat(24);
await kv.set('si:i:'+iid,{id:iid,mode:'intent',type:'sale',sector:'services',size:'1m-3m',terms:'Het bedrijf staat niet te koop; alleen bij het juiste bod. Het team blijft.',language:'nl',expires:new Date(Date.now()+6*864e5).toISOString()});
await kv.raw(['LPUSH','si:list',iid]);
await kv.set('si:b:'+bid,{id:bid,kind:'strategic',sector:'services',market:'worldwide',size:'1m-3m',criteria:'Wij kopen dienstverleners.',mail:'koper@voorbeeld.com',language:'nl'}); await kv.raw(['LPUSH','si:buyers',bid]);
await kv.set('si:notify:'+iid,{mail:'eigenaar@voorbeeld.nl',at:'x'});
// uit: niets versturen
ok('mail uit: geen bevestiging', (await M.vraagBevestiging(kv,await kv.get('si:i:'+iid),'eigenaar@voorbeeld.nl'))===false && uit.length===0);
await kv.set('si:mail:aan',1); await kv.set('si:mail:klaar',1);
ok('bevestigingsmail', await M.vraagBevestiging(kv,await kv.get('si:i:'+iid),'eigenaar@voorbeeld.nl') && /op=bevestig&i=/.test(uit[0].text));
ok('foute handtekening geweigerd', !(await M.bevestig(kv,iid,'0'.repeat(24))).ok);
const s=uit[0].text.match(/&s=([a-f0-9]{24})/)[1];
const b=await M.bevestig(kv,iid,s,{meld}); ok('bevestigd + 1 lead', b.ok && b.leads===1);
const lead=uit[1]; ok('lead naar koper met schuiladres', lead.to[0]==='koper@voorbeeld.com' && /^k-[a-f0-9]{24}-[a-f0-9]{24}@sealedintent\.com$/.test(lead.reply_to) && /Het team blijft/.test(lead.text) && !/eigenaar@/.test(lead.text));
ok('tweede keer bevestigen: geen dubbele lead', (await M.bevestig(kv,iid,s)).leads===0 && uit.length===2);
const inn=async(id,to,from,text)=>{inbox.set(id,{to:[to],from,subject:'Re',text});return M.mailIn(kv,{type:'email.received',data:{email_id:id}},{meld,ai})};
let koperAi=null; let ai=async o=>{ if(o.fn==='sealed-mail-schoon'){const u=JSON.parse(o.user); const owner=u.sender==='owner'; return {txt:JSON.stringify({clean:'SCHOON: '+u.message.split('\n')[0].replace(/Piet Jansen/g,''),tip_receiver:owner?'':'De koper vraagt naar één ding: een meerderheidsbelang.',tip_sender:owner?'':'Zeg erbij wat je het team biedt.',cat:owner?'geen':'concrete-vraag',risk:/RISICO/.test(u.message)})}} return koperAi(o)};
let r=await inn('m1',lead.reply_to,'Anna <koper@voorbeeld.com>','Ik ben Anna de Vries van Voorbeeld Groep. Overweeg je ook een meerderheidsbelang? Bel me op +31 6 12345678 of anna@voorbeeld.com.\n\nOp wo 18 nov 2026 om 10:00 schreef Sealed Intent <post@sealedintent.com>:\n> Een eigenaar');
ok('eerste bericht koper wacht', r.waarom==='wacht' && uit.length===2 && /op=keur/.test(melds.at(-1)));
ok('dubbele webhook genegeerd', (await M.mailIn(kv,{type:'email.received',data:{email_id:'m1'}},{meld})).waarom==='al-gedaan');
const kl=melds.at(-1).match(/t=([a-f0-9]{24})&n=(\d+)&s=([a-f0-9]{24})/);
const kb=await M.keurBeeld(kv,kl[1],kl[2],kl[3]); ok('keurbeeld schoon + origineel + tips', kb && kb.wacht && /^SCHOON: Ik ben Anna/.test(kb.tekst) && /Anna/.test(kb.origineel) && /meerderheidsbelang/.test(kb.tip) && /team biedt/.test(kb.tipAfzender) && !/12345678|anna@/.test(kb.origineel) && !/12345678|anna@/.test(kb.tekst) && !/Een eigenaar$/.test(kb.tekst));
ok('keur met foute code', !(await M.keur(kv,kl[1],kl[2],'f'.repeat(24),true)).ok);
r=await M.keur(kv,kl[1],kl[2],kl[3],true); const naarE=uit[2]; ok('tip bij ontvanger en losse tip naar afzender', /Suggestie van Sealed Intent: De koper vraagt/.test(naarE.text) && uit[3].to[0]==='koper@voorbeeld.com' && /Zeg erbij wat je het team biedt/.test(uit[3].text) && uit.length===4); uit.splice(3,1); ok('origineel weg na keuren', !(await kv.get('si:t:'+kl[1])).msgs[0].ruw);
ok('doorgelaten naar eigenaar', r.verstuurd && naarE.to[0]==='eigenaar@voorbeeld.nl' && /^e-/.test(naarE.reply_to) && /Anna de Vries/.test(naarE.text) && !/koper@voorbeeld|12345678/.test(naarE.text));
ok('twee keer keuren verstuurt niet opnieuw', (await M.keur(kv,kl[1],kl[2],kl[3],true)).al && uit.length===3);
r=await inn('m2',naarE.reply_to,'eigenaar@voorbeeld.nl','Ja, mits ik 30 procent houd.\n\nMet vriendelijke groet,\nPiet Jansen\nBakkerij Jansen BV\n06-12345678\n\nVan: Sealed Intent\n> Een koper schrijft');
ok('antwoord eigenaar wacht, zonder handtekening', r.waarom==='wacht' && !/Jansen/.test(melds.at(-1)) && /30 procent/.test(melds.at(-1)));
const k2=melds.at(-1).match(/t=([a-f0-9]{24})&n=(\d+)&s=([a-f0-9]{24})/); r=await M.keur(kv,k2[1],k2[2],k2[3],true);
ok('antwoord naar koper', r.verstuurd && uit[3].to[0]==='koper@voorbeeld.com' && /30 procent/.test(uit[3].text) && !/eigenaar@|Jansen/.test(uit[3].text));
r=await inn('m3',lead.reply_to,'koper@voorbeeld.com','Dat is bespreekbaar. Wat is de omzet ongeveer?'); ok('tweede bericht koper gaat direct door, schoon', r.waarom==='door' && uit[4].to[0]==='eigenaar@voorbeeld.nl' && /SCHOON: Dat is bespreekbaar/.test(uit[4].text)); uit.splice(5,1); ok('tip geteld en antwoord geteld', +(await kv.get('si:mail:tip:concrete-vraag:n'))>=1 && +(await kv.get('si:mail:tip:concrete-vraag:r'))===1);
await kv.set('si:mail:keur',0); r=await inn('m3b',naarE.reply_to,'eigenaar@voorbeeld.nl','De omzet is ruim voldoende.'); ok('keuren uit: antwoord eigenaar gaat direct door', r.waarom==='door'); r=await inn('m3c',naarE.reply_to,'eigenaar@voorbeeld.nl','RISICO onze zaak aan de Markt in Gouda'); ok('keuren uit maar risico: wacht toch', r.waarom==='wacht'); const sv=ai; ai=null; r=await inn('m3d',lead.reply_to,'koper@voorbeeld.com','Zonder AI bericht'); ok('zonder AI: wacht altijd', r.waarom==='wacht'); ai=sv; await kv.set('si:mail:keur',1);
r=await inn('m4',lead.reply_to,'iemand@anders.com','Hallo ik ben een ander'); ok('ander adres wacht', r.waarom==='wacht');
r=await inn('m5',lead.reply_to,'koper@voorbeeld.com','JA\n\n> eerder'); r=await inn('m6',naarE.reply_to,'eigenaar@voorbeeld.nl','Ja.'); ok('twee keer ja gemeld', /Twee keer ja per mail/.test(melds.at(-1)));
r=await inn('m7',lead.reply_to.replace(/-[a-f0-9]{24}@/,'-'+'0'.repeat(24)+'@'),'koper@voorbeeld.com','test'); ok('vervalst schuiladres genegeerd', r.waarom==='onbekend-adres');
// koper per mail
koperAi=async()=>({txt:JSON.stringify({buyer:true,kind:'search-fund',sector:'services',size:'1m-3m',criteria:'Zoekt een zakelijke dienstverlener en laat het team intact.',language:'nl'})});
const n0=uit.length; r=await inn('m8','henkjan@sealedintent.com','Tom <tom@fonds.com>','Wij zoeken zakelijke dienstverleners met 1 tot 3 miljoen winst. Team blijft.\n\nGroet, Tom');
ok('koper per mail vastgelegd + kaart + lead', r.waarom==='koper' && r.leads===1 && uit.length===n0+2 && /Zo zien eigenaren je/.test(uit[n0].text) && /past nu 1 eigenaar/.test(uit[n0].text));
koperAi=async()=>({txt:JSON.stringify({buyer:true,kind:null,sector:null,size:null,criteria:'x',language:'en'})});
r=await inn('m9','kopers@sealedintent.com','jim@x.com','We buy companies, tell me more about what you have.'); ok('omvang ontbreekt: teruggevraagd', r.waarom==='teruggevraagd' && /how large/i.test(uit.at(-1).subject));
r=await inn('m10','kopers@sealedintent.com','jim@x.com','STOP'); ok('stop', r.waarom==='stop');
// week
const it=await kv.get('si:i:'+iid); it.expires=new Date(Date.now()+10*3600e3).toISOString(); await kv.set('si:i:'+iid,it);
const n1=uit.length; let ro=await M.ronde(kv); ok('weekmail', ro.verstuurd===1 && /op=verleng/.test(uit[n1].text)); ro=await M.ronde(kv); ok('weekmail niet dubbel', ro.verstuurd===0);
const vs=uit[n1].text.match(/op=verleng&i=([a-f0-9]{32})&s=([a-f0-9]{24})/); const ve=await M.verleng(kv,vs[1],vs[2]); ok('verlengd', ve.ok && Date.parse((await kv.get('si:i:'+iid)).expires)>Date.now()+6*864e5);
r=await inn('m11',naarE.reply_to,'eigenaar@voorbeeld.nl','stop'); ok('eigenaar stop wist adres', r.waarom==='stop' && !(await kv.get('si:notify:'+iid)));
console.log(fout?('\n'+fout+' FOUT'):'\nalles goed'); if (fout) process.exit(1);
