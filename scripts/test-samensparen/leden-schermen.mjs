import { kv } from './lib/db.js'; import * as SS from './lib/samensparen.js'; import * as PT from './lib/partner.js'; import * as GC from './lib/groepscadeau.js'; import { MAILS } from './lib/kadoly-nieuws.js'; import { createHash } from 'node:crypto'; import { writeFileSync } from 'node:fs';
const ok=(c,m)=>{console.log((c?'ok   ':'FOUT ')+m); if(!c) process.exitCode=1;};
const D='voorbeeld.test', ml=n=>n+'@'+D, sha=s=>createHash('sha256').update(s).digest('hex'), ctrl=e=>parseInt(sha(e).slice(0,6),16)%100<10;
const kaal=(t,i,s)=>`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"><style>body{font:16px/1.55 Inter,system-ui;max-width:680px;margin:0 auto;padding:28px 18px;color:#111113;background:#fff}a{color:#111113}.btn{display:inline-block;border-radius:999px;padding:11px 22px;font-weight:700;text-decoration:none;border:2px solid #111113;background:#fff;color:#111113;font-size:16px;cursor:pointer}.btn.knop{background:#111113;color:#fff}.kicker{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.meta{font-size:13px}h1{font-size:32px;line-height:1.15}</style></head><body><main>${i}</main></body></html>`;
let jar='';
async function call(fn,url,{method='GET',body={},host='hjdk-api-henq.vercel.app'}={}){const q=new URL(url,'https://x').searchParams;const r={h:{}};const res={setHeader(k,v){r.h[k]=v;if(k==='set-cookie'&&/^kpt/.test(v))jar=v.split(';')[0]},status(c){r.code=c;return this},send(b){r.body=b;return r},json(b){r.body=b;return r},end(){return r}};await fn({req:{method,headers:{cookie:jar,'x-forwarded-for':'5.5.5.5'}},res,q,host,ua:'Mozilla iPhone',kaal,leesBody:async()=>body,isBot:()=>false,gc:GC});return r;}
const IMG="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23EDE6DA'/%3E%3Ccircle cx='50' cy='45' r='22' fill='%23C9A877'/%3E%3Crect x='38' y='66' width='24' height='18' rx='3' fill='%23111113'/%3E%3C/svg%3E";
const CAT=[{id:'oc_4173959362543617',t:'Houten scheerkwast classic',p:14.95,fs:1,mg:5.09,img:IMG},{id:'oc_4174005866250241',t:'Vivi dip dye kaarsenset',p:29.44,fs:1,mg:1.2,img:IMG},{id:'oc_4174004744241153',t:'EDDA geurkaars Aalina',p:37.29,fs:1,mg:1.5,img:IMG},{id:'oc_4173958884671489',t:'Plantenset Gradience',p:56.95,fs:1,mg:12,img:IMG},{id:'oc_A',t:'Tafellamp Lumen',p:44.95,fs:1,mg:16,img:IMG},{id:'oc_B',t:'Koffiemok',p:15,fs:1,mg:1.5,img:IMG}];
await kv.set('hjdk:shop:cat',{items:CAT}); await kv.set('ss:regels',{armen:[1],dagen:[7]});
const mid=loc=>loc.match(/m=([a-f0-9]{12})/)[1], mk=loc=>loc.match(/k=([a-f0-9]+)/)[1];
const lid=async id=>kv.get('ss:m:'+id), naarMail=a=>MAILS.filter(x=>x.to[0]===a);
const R=await SS.regels();
ok(SS.kaartenVoor(CAT[0],R)===1,'scheerkwast: 1 kaart'); ok(SS.kaartenVoor(CAT[1],R)===3,'kaarsenset (weinig marge): 3 kaarten'); ok(SS.kaartenVoor(CAT[2],R)===4,'geurkaars: 4 kaarten');
let r=await call(SS.ssOp,'/?op=ss&product=oc_4173959362543617',{host:'gids.kadoly.com'}); ok(r.body.zegels===1&&r.body.kaarten===1&&/1 kaart van 5 zegels/.test(r.body.tekst),'product: '+r.body.tekst);
r=await call(SS.ssOp,'/?op=ss&mand=oc_B:1',{host:'gids.kadoly.com'}); ok(r.body.zegels===1&&/Deze bestelling geeft 1 zegel/.test(r.body.tekst),'mandje met alleen een mok (weinig marge): toch 1 zegel');
r=await call(PT.partnerOp,'/?op=partner',{method:'POST',body:{a:'aan',naam:'HC De Vlinders',mail:ml('club'),soort:'club'}}); const pk=mk(r.h.location);
jar=''; r=await call(SS.ssOp,'/?op=ss&pt=hc-de-vlinders'); writeFileSync('ss2/start-club.html',r.body); ok(/Spaar mee met HC De Vlinders/.test(r.body)&&/HC De Vlinders €2/.test(r.body),'clubstart');
r=await call(SS.ssOp,'/?op=ss',{method:'POST',body:{naam:'Sanne',mail:ml('sanne')}}); const S=mid(r.h.location), Sk=mk(r.h.location);
{const rr=await call(SS.ssOp,'/?op=ss&m='+S+'&k='+Sk+'&nieuw=1'); writeFileSync('ss2/kaart-start.html',rr.body); writeFileSync('ss2/mail-welkom-sanne.html',naarMail(ml('sanne'))[0].html);}
let s=await lid(S); ok(s.pt==='hc-de-vlinders'&&s.zegels.length===1&&s.ontvangen===1,'Sanne: via club, 1 zegel cadeau, 1 om door te geven');
await call(SS.ssOp,'/?op=ss&go=kaart&m='+S+'&k='+Sk); ok((await lid(S)).ok,'Sanne bevestigt via mail');
r=await call(SS.ssOp,'/?op=ss&go=deel&m='+S+'&k='+Sk); const wa=decodeURIComponent(r.h.location); const dcode=wa.match(/d=([a-f0-9]{10})/)[1]; ok(/Ik geef je een zegel bij Kadoly. Pak hem voor/.test(wa),'deelbericht: '+wa.slice(0,120));
writeFileSync('ss2/deel.txt',wa);
jar=''; r=await call(SS.ssOp,'/?op=ss&u='+S+'&d='+dcode); writeFileSync('ss2/uitnodiging.html',r.body); ok(/Sanne geeft je een zegel/.test(r.body)&&/Pak hem voor/.test(r.body),'uitnodiging met deadline');
r=await call(SS.ssOp,'/?op=ss',{method:'POST',body:{u:S,d:dcode,naam:'Petra',mail:ml('petra')}}); const P=mid(r.h.location);
ok((await lid(P)).zegels.length===1&&(await lid(P)).zegels[0].start==='cadeau'&&(await lid(S)).gegeven===1,'Petra pakt de zegel van Sanne; Sanne heeft hem doorgegeven');
r=await call(SS.ssOp,'/?op=ss&u='+S+'&d='+dcode); ok(/nodigt je uit/.test(r.body),'tweede vriend: Sanne heeft geen zegel meer over om te geven');
{const bb=await SS.ssBestelling({em:sha(ml('sanne')),order:'K0',regels:[{p:'oc_B',n:1}],bedrag:15}); const rr=await call(SS.ssOp,'/?op=ss&m='+S+'&k='+Sk); writeFileSync('ss2/kaart-2.html',rr.body); const em=naarMail(ml('sanne')).at(-1); writeFileSync('ss2/mail-eigen-sanne.html',em.html);}
let b=await SS.ssBestelling({em:sha(ml('petra')),order:'K1',regels:[{p:'oc_B',n:1}],bedrag:15}); ok(b.zegels===1&&b.naar==='lid','Petra koopt een mok: 1 zegel voor Petra en 1 voor Sanne');
ok((await lid(P)).zegels.length===2&&(await lid(S)).zegels.length===2,'Petra 2, Sanne 2'); const zm=naarMail(ml('sanne')).at(-1); writeFileSync('ss2/mail-zegel.html',zm.html); ok(/Petra kocht iets: 1 zegel voor jou/.test(zm.subject),'mail aan Sanne: '+zm.subject);
b=await SS.ssBestelling({em:sha(ml('petra')),order:'K1',regels:[{p:'oc_B',n:1}]}); ok(b.dubbel,'zelfde bestelling telt niet twee keer');
b=await SS.ssBestelling({em:sha(ml('petra')),order:'K0',regels:[{p:'oc_B',n:1}],bedrag:0}); ok(b.zegels===0,'gratis bestelling (bedrag 0): geen zegel');
b=await SS.ssBestelling({em:sha(ml('sanne')),order:'K2',regels:[{p:'oc_A',n:1}],bedrag:44.95}); ok(b.naar==='partner'&&b.zegels===1,'Sanne koopt: 1 zegel voor Sanne, €2 voor de club');
r=await call(PT.partnerOp,'/?op=partner&c=hc-de-vlinders&k='+pk); writeFileSync('ss2/club-dash.html',r.body); ok(/€2<\/p><p>verdiend met 1 aankoop/.test(r.body),'club: €2 van 1 bestelling');
let kim='kim0'; for(let i=0;i<50&&ctrl(ml(kim));i++) kim='kim'+i; let ct='c0'; for(let i=0;i<500&&!ctrl(ml(ct));i++) ct='c'+i;
b=await SS.ssBestelling({em:sha(ml(kim)),order:'K3',regels:[{p:'oc_A',n:1}]}); ok(b.zegels===1&&!b.lid,'Kim spaart nog niet: zegel bewaard');
b=await SS.ssBestelling({em:sha(ml(ct)),order:'K4',regels:[{p:'oc_A',n:1}]}); ok(b.ctrl&&b.zegels===0,'controlegroep: geen zegel');
ok(Number((await kv.raw(['HGETALL','ss:grp:ctrl'])).join(',').includes('kopers,1')),'controlegroep geteld');
b=await SS.ssBestelling({em:sha(ml('onbekend2')),order:'K5',regels:[{p:'oc_A',n:1}],klikPartner:'p-hc-de-vlinders'}); ok(b.naar==='klikpartner','klik via de club zonder kaart: €2 voor de club (nooit controlegroep)');
await SS.ssRetour('K1'); ok(!(await lid(P)).zegels.some(z=>z.o==='K1')&&!(await lid(S)).zegels.some(z=>z.o==='K1'),'retour K1: zegels eraf bij Petra en Sanne');
r=await call(SS.ssOp,'/?op=ss',{method:'POST',body:{naam:'Kim',mail:ml(kim)}}); ok((await lid(mid(r.h.location))).zegels.length===2,'Kim meldt zich aan: zegel cadeau en die van haar bestelling');
// kaart vol en inwisselen
s=await lid(S); for(let i=0;i<3;i++) s.zegels.push({t:Date.now(),van:'Sanne',o:'X'+i}); s.ontvangen+=3; await kv.set('ss:m:'+S,s);
let st=SS.stand(await lid(S)); ok(st.kaarten===1&&st.vol,'Sanne: 1 volle kaart ('+JSON.stringify(st)+')');
r=await call(SS.ssOp,'/?op=ss&m='+S+'&k='+Sk); writeFileSync('ss2/kaart-vol.html',r.body); ok(/Je kaart is vol/.test(r.body)&&/Kies je cadeau/.test(r.body)&&/Geef mijn zegels aan HC De Vlinders/.test(r.body),'kaart vol, met clubkeuze');
r=await call(SS.ssOp,'/?op=ss&m='+S+'&k='+Sk+'&kies=1'); writeFileSync('ss2/kies.html',r.body); ok(/Neem nu/.test(r.body)&&/Spaar hiervoor/.test(r.body),'kies je cadeau');
r=await call(SS.ssOp,'/?op=ss&inwissel=1&m='+S+'&c=oc_4173959362543617'); ok(r.body.ok&&r.body.kaarten===1&&r.body.over.totaal===0,'inwisselen scheerkwast: 1 kaart eraf, '+JSON.stringify(r.body.over));
ok(Number((await kv.raw(['HGET','ss:kost','cadeauCent'])))===900,'kosten geboekt: €9');
await SS.ssRetour('K2'); ok((await lid(S)).schuld===1,'retour K2 na inwisselen: kaart staat 1 zegel achter');
r=await call(SS.ssOp,'/?op=ss',{method:'POST',body:{a:'club',m:S,k:Sk,aan:'1'}}); ok((await lid(S)).club==='hc-de-vlinders','Sanne geeft haar zegels aan de club');
b=await SS.ssBestelling({em:sha(ml('sanne')),order:'K6',regels:[{p:'oc_A',n:1}]}); r=await call(PT.partnerOp,'/?op=partner&c=hc-de-vlinders&k='+pk); ok(b.zegels===0&&/€6<\/p>/.test(r.body),'Sanne koopt met clubkeuze: geen zegel, club €4 (nu €6 totaal)');
// cadeauzegels hooguit 2 per kaart
r=await call(SS.ssOp,'/?op=ss',{method:'POST',body:{naam:'Bas',mail:ml('bas')}}); const Bi=mid(r.h.location), Bk=mk(r.h.location); const Bm=await lid(Bi); Bm.zegels=Bm.zegels.concat([1,2,3].map(()=>({t:Date.now(),van:'X',start:'cadeau'})),[{t:Date.now(),van:'Bas',o:'B0'}]); await kv.set('ss:m:'+Bi,Bm);
st=SS.stand(await lid(Bi)); ok(st.kaarten===0&&st.opKaart===3&&st.gratisOp,'4 cadeauzegels en 1 aankoop: 3 tellen, cadeauzegels op');
r=await call(SS.ssOp,'/?op=ss&m='+Bi+'&k='+Bk); writeFileSync('ss2/kaart.html',r.body); ok(/3 van 5 zegels/.test(r.body)&&/cadeauzegels voor deze kaart zijn op/.test(r.body),'kaart Bas');
// verlopen deellink
const Sm=await lid(S); Sm.ontvangen=10; await kv.set('ss:m:'+S,Sm); r=await call(SS.ssOp,'/?op=ss&go=deel&m='+S+'&k='+Sk); const d2=decodeURIComponent(r.h.location).match(/d=([a-f0-9]{10})/)[1]; const rec=await kv.get('ss:deel:'+d2); rec.tot=Date.now()-1000; await kv.set('ss:deel:'+d2,rec);
r=await call(SS.ssOp,'/?op=ss',{method:'POST',body:{u:S,d:d2,naam:'Laat',mail:ml('laat')}}); const La=await lid(mid(r.h.location)); ok(La.zegels.length===1&&La.zegels[0].start==='start'&&La.door===S,'te laat gepakt: geen cadeau van Sanne, wel gekoppeld en de gewone eerste zegel');
const k=await SS.ssKetting({knop:false}); ok(/Nog te weinig voor een oordeel/.test(k.regel),'kettingmeter: '+k.regel);
const rd=await SS.ssRonde(); ok(rd.leden>=5&&typeof rd.ketting==='string','ronde: '+JSON.stringify(rd));
r=await call(SS.ssOp,'/?op=ss&stand=1'); ok(r.body.spelregels.length===7&&r.body.ketting,'stand');
r=await call(SS.ssOp,'/?op=ss&marges=1'); ok(r.body.kostenPerAankoop===4,'doorrekening: '+JSON.stringify({b:r.body.margeBovenKosten,o:r.body.margeOnderKosten,k:r.body.kaartenPerCadeau}));
r=await call(SS.ssOp,'/?op=ss&o=ABC123'); writeFileSync('ss2/na-bestelling.html',r.body); ok(/Je bestelling gaf 1 zegel/.test(r.body),'pagina na bestelling');
r=await call(SS.ssOp,'/?op=ss',{host:'gids.kadoly.com'}); ok(r.code===404,'concept niet op gids.kadoly.com');
// mails om te laten zien
const pm=naarMail(ml('petra')); writeFileSync('ss2/mail-welkom.html',pm[0].html); ok(/Sanne geeft je 1 zegel bij Kadoly/.test(pm[0].subject),'welkomstmail Petra: '+pm[0].subject);
const KN=await import('./lib/kadoly-nieuws.js'); const Sv=await lid(S); Sv.zegels=[{t:Date.now(),van:'Kadoly',start:'start'}].concat([1,2,3,4].map(i=>({t:Date.now(),van:'Petra',o:'Y'+i}))); Sv.schuld=0; Sv.ok=1;
writeFileSync('ss2/mail-vol.html',SS.mailInhoud(KN,Sv,'zegel',{van:'Petra'}).html); console.log('onderwerp vol:',SS.mailInhoud(KN,Sv,'zegel',{van:'Petra'}).onderwerp);
const Pv=await lid(P); Pv.zegels.push({t:Date.now(),van:'Petra',o:'Z1'}); Pv.ontvangen=2; writeFileSync('ss2/mail-eigen.html',SS.mailInhoud(KN,Pv,'eigen',{}).html); console.log('onderwerp eigen:',SS.mailInhoud(KN,Pv,'eigen',{}).onderwerp);
console.log('clubmails:', JSON.stringify(MAILS.flat().map(m=>m.subject||m[0]?.subject).filter(s=>/Vlinders|staat aan|€/.test(String(s)))));

for (const m of MAILS) { if (/staat aan$/.test(m.subject)) writeFileSync('ss2/club-welkom.html',m.html); if (/^De eerste €2/.test(m.subject)) writeFileSync('ss2/club-eerste.html',m.html); }
