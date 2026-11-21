// Ketentest van Sealed Intent per mail (lib/sealed-mail.js) met nagebootste opslag, mail en AI: node scripts/test-sealed-mail.mjs
// Loopt de hele keten door: bevestigen, lead, schuiladressen, de AI ertussen, keuren, tips en tellen, eerste ronde gratis en VERDER, JA, STOP,
// koper per mail, weekmail, en de mailroute van 21 nov: uitnodigen, markt open bij vijf betalers, houder legt zich vast per antwoordmail,
// kaart keuren, stoplijst, bounces, spamklacht en de controle.
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
ok('eerste antwoord komt met de prijs', /Dit eerste antwoord was gratis/.test(uit[3].text) && /€ 250 exclusief btw/.test(uit[3].text) && /alleen het woord VERDER/.test(uit[3].text) && !!(await kv.get('si:t:'+k2[1])).gratis);
r=await inn('m3',lead.reply_to,'koper@voorbeeld.com','Dat is bespreekbaar. Wat is de omzet ongeveer?'); ok('na de gratis ronde blijft de vraag klaarstaan', r.waarom==='wacht-verder' && uit.length===5 && uit[4].to[0]==='koper@voorbeeld.com' && /Je vraag staat klaar/.test(uit[4].subject) && /€ 250/.test(uit[4].text)); uit.splice(4,1);
r=await inn('m3v',naarE.reply_to,'eigenaar@voorbeeld.nl','VERDER'); ok('VERDER van de eigenaar telt niet', r.waarom==='verder-genegeerd' && !(await kv.get('si:t:'+k2[1])).verder);
r=await inn('m3w',lead.reply_to,'koper@voorbeeld.com','Verder\n\n> eerder'); ok('VERDER: vraag gaat door, bevestiging en factuurmoment', r.waarom==='verder' && r.klaar===1 && uit[4].to[0]==='eigenaar@voorbeeld.nl' && /SCHOON: Dat is bespreekbaar/.test(uit[4].text) && /Je kunt verder praten/.test(uit.at(-1).subject) && /factuurmoment: € 250/.test(melds.at(-1)));
ok('VERDER twee keer telt één keer', (await inn('m3x',lead.reply_to,'koper@voorbeeld.com','VERDER')).waarom==='verder-al' && +(await kv.get('si:f:vd'))===1); uit.splice(5); ok('tip geteld en antwoord geteld', +(await kv.get('si:mail:tip:concrete-vraag:n'))>=1 && +(await kv.get('si:mail:tip:concrete-vraag:r'))===1);
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

// ---------- de mailroute van 21 nov 2026 ----------
const W=(await import('../lib/sealed-markt.js')), wb=W.woorden('bedrijf','nl');
ok('markten: bedrijf open, rol en hotel dicht', W.MARKT.bedrijf.klaar && !W.MARKT.rol.klaar && !W.MARKT.hotel.klaar && W.DREMPEL===5);
ok('klassen per markt uniek', !W.MARKT.rol.klassen.some(c=>W.MARKT.bedrijf.klassen.includes(c)) && !W.MARKT.hotel.klassen.some(c=>W.MARKT.bedrijf.klassen.includes(c)||W.MARKT.rol.klassen.includes(c)));
let pr=await M.nodig(kv,{rol:'houder',markt:'rol',groep:'rol-recht',naam:'Eva',proef:1}); ok('proef rol: tekst zonder versturen', pr.proef && !pr.marktKlaar && /kantoren zoeken een partner als jij/.test(pr.onderwerp) && /zou je wél overstappen/.test(pr.tekst));
ok('dichte markt verstuurt niet', /niet vrijgegeven/.test((await M.nodig(kv,{rol:'houder',markt:'rol',groep:'rol-recht',aan:'eva@kantoor.nl'})).fout||''));
const nb0=uit.length; ok('betaler zonder eerste zin geweigerd', /eerste zin/.test((await M.nodig(kv,{rol:'betaler',aan:'anna@groep.nl',naam:'Anna'})).fout||''));
let nd=await M.nodig(kv,{rol:'betaler',aan:'Anna <anna@groep.nl>',naam:'Anna',zin:'Voorbeeld Groep koopt installatiebedrijven; dat staat op jullie site.'});
ok('mail 1 aan betaler', nd.ok && uit.length===nb0+1 && uit.at(-1).to[0]==='anna@groep.nl' && uit.at(-1).from==='Henkjan de Krijger <henkjan@sealedintent.com>' && uit.at(-1).reply_to==='kopers@sealedintent.com' && uit.at(-1).subject==='Welke bedrijven zoek je?' && /^Hoi Anna,\n\nVoorbeeld Groep koopt/.test(uit.at(-1).text) && /Antwoord NEE/.test(uit.at(-1).text) && /\+31 6 55395630/.test(uit.at(-1).text) && !/https?:/.test(uit.at(-1).text));
ok('zelfde adres niet twee keer', /al uitgenodigd/.test((await M.nodig(kv,{rol:'betaler',aan:'anna@groep.nl',zin:'Voorbeeld Groep koopt installatiebedrijven.'})).fout||''));
koperAi=async()=>({txt:JSON.stringify({buyer:true,kind:'private-equity',sector:'services',size:'1m-3m',criteria:'Zoekt zakelijke dienstverleners en laat het team intact.',language:'nl'})});
ok('antwoord van uitgenodigde betaler telt één keer', (await inn('n1','kopers@sealedintent.com','anna@groep.nl','Wij zoeken zakelijke dienstverleners met 1 tot 3 miljoen winst. Het team blijft.')).waarom==='koper' && +(await kv.get('si:f:ab'))===1);
nd=await M.nodig(kv,{rol:'houder',groep:'services',aan:'peter@zaak.nl',naam:'Peter'}); ok('markt dicht onder vijf betalers', nd.fout==='markt nog dicht' && nd.betalers<5 && nd.nodig===5);
for(const [i,sz,se] of [['c','1m-3m','services'],['d','3m-10m','services'],['e','1m-3m','other']]){const id=i.repeat(24); await kv.set('si:b:'+id,{id,kind:'private-equity',sector:se,market:'worldwide',size:sz,criteria:'Zoekt dienstverleners.',offer:['Het team blijft'],mail:i+'@fonds.nl',language:'nl'}); await kv.raw(['LPUSH','si:buyers',id]);}
const tot=await M.telBetalers(kv,'bedrijf','services'); ok('vijf of meer betalers in de groep', tot>=5 && (await M.telBetalers(kv,'rol','other'))===0);
ok('houder zonder groep geweigerd', /groep/.test((await M.nodig(kv,{rol:'houder',aan:'peter@zaak.nl'})).fout||''));
nd=await M.nodig(kv,{rol:'houder',groep:'services',aan:'peter@zaak.nl',naam:'Peter',soort:'een adviesbureau'}); const m2=uit.at(-1);
ok('mail 2 aan houder met echt getal', nd.ok && nd.betalers===tot && m2.to[0]==='peter@zaak.nl' && m2.subject===tot+' kopers zoeken een bedrijf als het jouwe' && new RegExp('^Hoi Peter,\\n\\n'+tot+' kopers hebben bij ons vastgelegd dat ze een adviesbureau zoeken').test(m2.text) && /Jij betaalt niets, nu niet en later niet/.test(m2.text) && /^o-[a-f0-9]{24}-[a-f0-9]{24}@sealedintent\.com$/.test(m2.reply_to));
let houderAi=async()=>({txt:JSON.stringify({intent:true,no:false,size:null,terms:'Alleen als het team blijft en ik nog twee jaar meedraai.',nogo:'',question:'Wie zijn die kopers?',language:'nl',risk:false})}); const ka=koperAi; koperAi=o=>o.fn==='sealed-mail-houder'?houderAi(o):ka(o);
r=await inn('h0',m2.reply_to,'iemand@anders.nl','Alleen als het team blijft.'); ok('antwoord vanaf ander adres niet verwerkt', r.waarom==='ander-adres');
const u0=uit.length; r=await inn('h1',m2.reply_to,'Peter <peter@zaak.nl>','Alleen als het team blijft en ik nog twee jaar meedraai. Wie zijn die kopers?\n\nGroet,\nPeter Jansen\nJansen Advies BV, Gouda\n06-12345678');
ok('klasse ontbreekt: één vraag terug, vraag naar Henkjan', r.waarom==='teruggevraagd' && uit.length===u0+1 && uit.at(-1).subject==='Nog één ding: hoe groot is het bedrijf?' && uit.at(-1).reply_to===m2.reply_to && /Wie zijn die kopers/.test(melds.at(-1)));
houderAi=async o=>({txt:JSON.stringify({intent:true,no:false,size:/1 tot 3/.test(o.user)?'1m-3m':null,terms:'Alleen als het team blijft en ik nog twee jaar meedraai.',nogo:'verhuizen van de vestiging',question:'',language:'nl',risk:false})});
const u1=uit.length; r=await inn('h2',m2.reply_to,'peter@zaak.nl','1 tot 3 miljoen.\n\nGroet, Peter'); const m3=uit[u1], rec=await kv.get('si:i:'+r.id);
ok('vastgelegd per antwoordmail', r.waarom==='vastgelegd' && r.wacht===true && rec && rec.size==='1m-3m' && rec.sector==='services' && rec.type==='sale' && rec.via==='mail' && rec.nogo==='verhuizen van de vestiging' && !/Jansen|Gouda|12345678|peter@/.test(JSON.stringify(rec)) && (await kv.get('si:notify:'+r.id)).mail==='peter@zaak.nl');
ok('mail 3: kaart en echte aantallen', uit.length===u1+1 && m3.to[0]==='peter@zaak.nl' && m3.subject==='Vastgelegd. '+r.passend+' van de '+r.totaal+' kopers passen bij je voorwaarden' && r.passend>=2 && r.passend<r.totaal && /Winst per jaar: /.test(m3.text) && /Niet bespreekbaar: verhuizen van de vestiging/.test(m3.text) && /Wat zij bieden: Het team blijft \(\d\)/.test(m3.text) && /Ik lees mee en geef niets door/.test(m3.text));
ok('nooit een nul in mail 3', !/\b0 van\b/.test(M.TEKST.houderVast.nl(wb,{naam:'P',kaart:'k',x:0,y:7,biedt:''}).join(' ')) && /Zodra een koper past/.test(M.TEKST.houderVast.nl(wb,{naam:'P',kaart:'k',x:0,y:7,biedt:''})[1]));
const kk=melds.at(-1).match(/op=keur&t=([a-f0-9]{32})&n=0&s=([a-f0-9]{24})/); ok('Henkjan leest mee: leads wachten op zijn tik', !!kk && uit.length===u1+1 && (await kv.get('si:i:'+r.id)).wacht===true);
const kb2=await M.keurBeeld(kv,kk[1],'0',kk[2]); ok('keurbeeld van de kaart', kb2 && kb2.wacht && /Alleen als het team blijft/.test(kb2.tekst) && /Passende kopers: \d van \d/.test(kb2.koper) && !/12345678/.test(kb2.origineel));
ok('kaart met foute code', !(await M.keur(kv,kk[1],'0','f'.repeat(24),true)).ok);
const u2=uit.length, kr=await M.keur(kv,kk[1],'0',kk[2],true); ok('na de tik gaan de leads naar passende kopers', kr.ok && kr.door && kr.leads===r.passend && uit.length===u2+r.passend && uit.slice(u2).every(x=>/^k-/.test(x.reply_to) && /Alleen als het team blijft/.test(x.text) && !/peter@|Jansen/.test(x.text)) && !(await kv.get('si:i:'+r.id)).wacht && !(await kv.get('si:iruw:'+r.id)));
ok('kaart twee keer keuren verstuurt niet opnieuw', (await M.keur(kv,kk[1],'0',kk[2],true)).al && uit.length===u2+r.passend);
r=await inn('h3',m2.reply_to,'peter@zaak.nl','Kan de termijn ook drie jaar zijn?'); ok('later antwoord van vastgelegde houder gaat naar Henkjan', r.waarom==='handmatig' && /al vastligt/.test(melds.at(-1)));
// NEE, stoplijst, bounce, klacht, controle
nd=await M.nodig(kv,{rol:'houder',groep:'services',aan:'kees@zaak.nl',naam:'Kees'}); const m5=uit.at(-1); r=await inn('h4',m5.reply_to,'kees@zaak.nl','Nee'); const u3=uit.length;
ok('NEE: op de stoplijst en nooit meer mail', r.waarom==='stop' && !!(await kv.get('si:stop:'+(await import('node:crypto')).createHash('sha256').update('kees@zaak.nl').digest('hex').slice(0,24))) && (await M._test.stuur(kv,{aan:'kees@zaak.nl',onderwerp:'x',tekst:'y'}))===false && uit.length===u3);
const verz=new Map([['s1',{from:'Henkjan de Krijger <henkjan@sealedintent.com>',to:['weg@zaak.nl'],last_event:'bounced'}],['s2',{from:'today@todayin.email',to:['ander@x.nl'],last_event:'bounced'}],['s3',{from:'post@sealedintent.com',to:['boos@zaak.nl'],last_event:'complained'}],['s4',{from:'post@sealedintent.com',to:['nep@zaak.nl'],last_event:'delivered'}]]), haalV=async(_,id)=>verz.get(id)||null;
const st=async(type,id)=>M.mailIn(kv,{type,data:{email_id:id}},{meld,haalV});
ok('bounce van onze mail: stoplijst', (await st('email.bounced','s1')).waarom==='bounce' && (await M.nodig(kv,{rol:'houder',groep:'services',aan:'weg@zaak.nl'})).fout==='adres staat op de stoplijst');
ok('bounce van een ander domein genegeerd', (await st('email.bounced','s2')).waarom==='niet-van-ons');
ok('verzonnen bounce genegeerd', (await st('email.bounced','s4')).waarom==='niet-bevestigd' && (await st('email.bounced','s1')).waarom==='al-gedaan');
ok('spamklacht zet uitnodigen stil', (await st('email.complained','s3')).waarom==='klacht' && /uitnodigen staat stil/.test((await M.nodig(kv,{rol:'houder',groep:'services',aan:'nieuw@zaak.nl'})).fout||'') && /spam/.test(melds.at(-1)));
await kv.del(['si:nodig:uit']); db.set('si:f:bounce','4'); db.set('si:f:nb','30'); const co=await M.controle(kv,{meld}); ok('controle: te veel bounces zet uitnodigen stil en meldt het', co.bevindingen.some(b=>/stilgezet/.test(b)) && !!(await kv.get('si:nodig:uit')) && /controle van de mailroute/.test(melds.at(-1)));
const ms=await M.mailStand(kv); ok('stand toont de trechter', ms.trechter.houdersGemaild===2 && ms.trechter.houdersVastgelegd===1 && ms.trechter.verder===1 && ms.trechter.gratisRondes===1 && ms.trechter.nee>=1 && ms.uitnodigenStil);
const mst=await M.marktStand(kv); ok('marktstand per groep', mst.markten.bedrijf.perGroep.services.open===true && mst.markten.rol.klaar===false);
const vb=M.voorbeelden('nl'); ok('proef bevat de vier mails', ['mail 1 betalerStart','mail 2 houderStart','mail 3 houderVast','mail 4 naarKoperBetaal'].every(k=>Array.isArray(vb[k]) && vb[k][1].length>40) && Object.values(M.voorbeelden('de')).every(v=>!/undefined/.test(v.join(' '))) && Object.values(M.voorbeelden('en')).every(v=>!/undefined/.test(v.join(' '))) && Object.values(M.voorbeelden('nl','hotel')).every(v=>!/undefined/.test(v.join(' '))));
console.log(fout?('\n'+fout+' FOUT'):'\nalles goed'); if (fout) process.exit(1);
