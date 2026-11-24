import * as C from './lib/clubwerf.js'; import { kv } from './lib/db.js'; import * as P from './lib/postlus.js';
const ok=(c,m)=>{ if(!c){console.log('FOUT',m);process.exitCode=1;} else console.log('ok',m); };
// OSM
const els=[{type:'node',id:1,tags:{name:'v.v. De Boys',club:'sport',sport:'soccer',website:'https://www.vvdeboys.nl','addr:city':'Gouda'}},
 {type:'way',id:2,tags:{name:'Basic-Fit Gouda',leisure:'fitness_centre',sport:'fitness',website:'basic-fit.com'}},
 {type:'node',id:3,tags:{name:'HC Gouda',sport:'field_hockey',website:'hcgouda.nl'}},
 {type:'node',id:4,tags:{name:'TC Facebook',club:'sport',website:'https://facebook.com/tc'}},
 {type:'node',id:5,tags:{name:'VV De Boys tweede',club:'sport',website:'https://vvdeboys.nl/jeugd'}}];
const o=C.uitOsm(els); ok(o.length===2&&o[0].s==='voetbal'&&o[1].w==='https://hcgouda.nl','osm filter '+JSON.stringify(o.map(x=>x.n)));
// adressen + score
const html=`<a href="mailto:sponsoring@vvdeboys.nl">mail</a> info [at] vvdeboys.nl <a class="__cf_email__" data-cfemail="${(()=>{const k=0x42,s='secretaris@vvdeboys.nl';return k.toString(16)+[...s].map(c=>(c.charCodeAt(0)^k).toString(16).padStart(2,'0')).join('')})()}">x</a> jan.jansen@gmail.com noreply@vvdeboys.nl`;
const A=C.adressen(html); ok(A.includes('sponsoring@vvdeboys.nl')&&A.includes('info@vvdeboys.nl')&&A.includes('secretaris@vvdeboys.nl'),'adressen '+A.join(','));
ok(C.score('jan.jansen@gmail.com','vvdeboys.nl','v.v. De Boys','sponsor')<0,'persoonlijk gmail van sponsorpagina eruit'); ok(C.score('jan.jansen@gmail.com','vvdeboys.nl','v.v. De Boys','contact')===1,'bestuurslid persoonlijk van contactpagina mag (laagst)'); ok(C.score('vvdeboys@gmail.com','vvdeboys.nl','v.v. De Boys')>=2,'club-gmail mag');
ok(C.score('sponsoring@vvdeboys.nl','vvdeboys.nl','x')>C.score('info@vvdeboys.nl','vvdeboys.nl','x'),'sponsor boven info'); ok(C.score('piet@bouwbedrijf.nl','vvdeboys.nl','x')<0,'werkadres eruit');
// sponsorlinks
const L=C.sponsorLinks('<a href="/club/sponsoring/">Sponsoring</a><a href="https://andere.nl/sponsor">x</a><a href="/nieuws">Nieuws</a><a href="/sponsors">Onze sponsors</a>','https://www.vvdeboys.nl/'); ok(L[0]==='https://www.vvdeboys.nl/club/sponsoring/'&&L.length===2,'sponsorlinks '+L.join(' '));
// scanClub met nep-fetch
const pag={'https://www.vvdeboys.nl':{url:'https://www.vvdeboys.nl/',t:'<a href="/sponsoring">Word sponsor</a>'},'https://www.vvdeboys.nl/sponsoring':{url:'https://www.vvdeboys.nl/sponsoring',t:'<h1>Sponsoring</h1><p>Mail <a href="mailto:sponsoring@vvdeboys.nl">ons</a> of info@vvdeboys.nl</p>'}};
const r=await C.scanClub({n:'v.v. De Boys',w:'https://www.vvdeboys.nl',d:'vvdeboys.nl'},async u=>pag[u]||null); ok(r.st==='klaar'&&r.m==='sponsoring@vvdeboys.nl'&&r.mb.endsWith('/sponsoring'),'scan '+JSON.stringify(r));
const r2=await C.scanClub({n:'HC Gouda',w:'https://hcgouda.nl',d:'hcgouda.nl'},async u=>u==='https://hcgouda.nl'?{url:u+'/',t:'<a href="/contact">Contact</a> info@hcgouda.nl'}:null); ok(r2.st==='klaar'&&r2.m==='info@hcgouda.nl'&&r2.mt==='home','info van homepage '+JSON.stringify(r2));
// mail
const c={id:'on1',n:'v.v. De Boys',m:'sponsoring@vvdeboys.nl'}; const m=C.mailTekst(c,{link:'https://gids.kadoly.com/m/abcde',arm:0,t:Date.parse('2026-11-24T10:00:00Z')});
const woorden=m.tekst.split(/\s+/).length; ok(woorden<=135,'woorden '+woorden); ok(!/[—–!]/.test(m.tekst+m.onderwerp),'geen streepjes of uitroeptekens'); ok(m.onderwerp.length<=60,'onderwerp '+m.onderwerp);
ok((m.tekst.match(/https?:\/\//g)||[]).length===2,'twee links'); ok(/Sinterklaas/.test(m.tekst),'seizoen');
ok(!/Sinterklaas/.test(C.mailTekst(c,{link:'x',t:Date.parse('2026-12-10T10:00:00Z')}).tekst),'na 5 dec geen Sinterklaas');
for(let i=0;i<C.ONDERWERPEN.length;i++) ok(C.onderwerp({n:'Koninklijke Utrechtse Mixed Hockey Club Kampong'},i).length<=60,'onderwerp '+i+' '+C.onderwerp({n:'Koninklijke Utrechtse Mixed Hockey Club Kampong'},i));
console.log('\n'+m.onderwerp+'\n\n'+m.tekst+'\n\n---\n'+C.mailTekst(c,{link:'https://gids.kadoly.com/m/abcde',opvolg:true}).tekst);
// ronde zonder sleutel: wacht
const w=await C.ronde({}); ok(w.wacht&&w.wacht.length>=2,'wacht '+JSON.stringify(w.wacht));
// droge ronde met rij
await kv.raw(['HSET','cw:club','on1',JSON.stringify({...c,w:'https://www.vvdeboys.nl',st:'klaar',mb:'https://www.vvdeboys.nl/sponsoring'})]); await kv.raw(['RPUSH','cw:rij','on1']);
const d=await C.ronde({droog:true}); ok(d.verstuurd===1&&(await kv.raw(['LLEN','cw:rij']))===1,'droog '+JSON.stringify(d));
// echte ronde met nep-Zernio
process.env.ZERNIO_API_KEY='x'; process.env.ZERNIO_MAIL_ACCOUNT='acc1'; await kv.set('cw:regels',{aan:true}); const zs=[];
let bekendDom=''; globalThis.fetch=async(u,o)=>{zs.push({u,b:o&&o.body&&JSON.parse(o.body)});
 if(/email\/threads/.test(u)){const q=decodeURIComponent(u.split('searchQueryNative=')[1]||''); return {ok:true,status:200,json:async()=>({threads: bekendDom&&q.includes(bekendDom)?[{id:'t'}]:[]})};}
 if(/email\/messages\?/.test(u)&&/mailer-daemon/.test(decodeURIComponent(u))) return {ok:true,status:200,json:async()=>({messages:[]})};
 if(/email\/messages\?/.test(u)) return {ok:true,status:200,json:async()=>({messages: globalThis.ANTW||[]})};
 return {ok:true,status:201,json:async()=>({id:'zm1'})};};
// LIVE staat uit in de code: forceer via een kopie
const fs=await import('node:fs'); fs.writeFileSync('lib/cw2.js',fs.readFileSync('lib/clubwerf.js','utf8').replace('export const LIVE = false;','export const LIVE = true;')); 
const C2=await import('./lib/cw2.js'); const nu=Date.parse('2026-11-24T09:30:00Z'); const e=await C2.ronde({nu});
const zm=zs.find(z=>/email\/messages$/.test(z.u)&&z.b); ok(e.verstuurd===1&&zm&&zm.b.to[0].email==='sponsoring@vvdeboys.nl'&&/gids\.kadoly\.com\/m\/abcde/.test(zm.b.text)&&zm.b.headers['List-Unsubscribe'],'verstuurd via zernio '+JSON.stringify(e));
const cc=JSON.parse(await kv.raw(['HGET','cw:club','on1'])); ok(cc.st==='verstuurd'&&cc.zid==='zm1'&&cc.v==='o0','club bijgewerkt');
ok(P.meldingen[0].project==='kadoly-clubs'&&P.meldingen.some(x=>x.uitkomst&&x.uitkomst.uitkomst==='verstuurd'),'gemeld in post-lus');
// opvolg na 7 dagen
zs.length=0; await kv.raw(['DEL','cw:dag:2026-12-01']); const f=await C2.ronde({nu:Date.parse('2026-12-01T09:30:00Z')}); const zf=zs.find(z=>/email\/messages$/.test(z.u)&&z.b);
ok(f.opvolg===1&&zf&&zf.b.replyToMessageId==='zm1'&&/€4/.test(zf.b.text),'opvolg '+JSON.stringify(f));
// bekend in mailbox: overslaan
await kv.raw(['HSET','cw:club','on2',JSON.stringify({id:'on2',n:'HC Gouda',m:'info@hcgouda.nl',d:'hcgouda.nl',w:'https://hcgouda.nl',st:'klaar',mt:'home'})]); await kv.raw(['RPUSH','cw:rij','on2']); bekendDom='hcgouda.nl';
const bk=await C2.ronde({nu:Date.parse('2026-12-01T11:30:00Z')}); ok(bk.bekend===1&&JSON.parse(await kv.raw(['HGET','cw:club','on2'])).st==='bekend','bekend overgeslagen '+JSON.stringify(bk));
ok(C.mailTekst({n:'HC Gouda',mt:'home'},{link:'x'}).tekst.includes('Ik zag de site van HC Gouda.'),'opener zonder sponsorpagina');
// antwoord lezen en leren
ok(C.leesAntwoord('Hallo Henkjan, leuk idee! Hoe werkt de uitbetaling?')==='vraag','vraag'); ok(C.leesAntwoord('Stop')==='stop','stop'); ok(C.leesAntwoord('Wij hebben geen interesse, we doen al Sponsorkliks')==='nee','nee');
ok(C.leesAntwoord('Ik heb het doorgestuurd naar de sponsorcommissie, we komen er op terug')==='later','later'); ok(C.leesAntwoord('Dit is een automatisch antwoord: ik ben afwezig tot 1 december')==='afwezig','afwezig');
ok(C.bezwaren('We doen al mee aan Sponsorkliks en willen leden niet lastigvallen').length===2,'bezwaren');
globalThis.ANTW=[{id:'m9',from:{email:'sponsoring@vvdeboys.nl'},text:'Leuk idee! Wie zijn jullie precies en is dit betrouwbaar?\n\nOp 24 nov schreef Henkjan:\n> oud'}];
const club1=JSON.parse(await kv.raw(['HGET','cw:club','on1'])); delete club1.antw; delete club1.ant; await kv.raw(['HSET','cw:club','on1',JSON.stringify(club1)]);
const la=await C2.ronde({nu:Date.parse('2026-12-01T13:30:00Z')}); const c9=JSON.parse(await kv.raw(['HGET','cw:club','on1']));
ok(c9.antw&&c9.antw.soort==='vraag'&&c9.antw.bz.includes('vertrouwen')&&!/oud/.test(c9.antw.t),'antwoord gelezen '+JSON.stringify(c9.antw));
// afmelden + clubpagina + aanzetten
const res=()=>{const r={h:{},code:0,body:'',setHeader(k,v){r.h[k]=v},status(c){r.code=c;return r},send(b){r.body=b;return r},json(b){r.body=JSON.stringify(b);return r},end(){return r}};return r;};
const kaal=(t,i)=>'<title>'+t+'</title>'+i; const isBot=u=>/bot/i.test(u);
let R=res(); await C2.clubOp({req:{method:'GET',headers:{}},res:R,q:new URLSearchParams('c='+cc.tok),host:'gids.kadoly.com',ua:'Mozilla',kaal,leesBody:async()=>({}),isBot});
ok(R.code===200&&/v\.v\. De Boys krijgt €2/.test(R.body)&&/Zet de pagina aan/.test(R.body),'clubpagina');
fs.writeFileSync('clubpagina.html','<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><body style="font:16px/1.6 system-ui;max-width:680px;margin:auto;padding:16px;color:#111113">'+R.body.replace(/<title>.*?<\/title>/,''));
R=res(); await C2.clubOp({req:{method:'POST',headers:{}},res:R,q:new URLSearchParams('c='+cc.tok),host:'gids.kadoly.com',ua:'Mozilla',kaal,leesBody:async()=>({mail:'sponsoring@vvdeboys.nl',naam:'v.v. De Boys'}),isBot});
ok(R.code===303&&/op=partner&c=v-v-de-boys&k=/.test(R.h.location),'aangezet '+R.h.location);
R=res(); await C2.clubOp({req:{method:'GET',headers:{}},res:R,q:new URLSearchParams('af='+cc.tok),host:'gids.kadoly.com',ua:'Mozilla',kaal,leesBody:async()=>({}),isBot}); ok(/geen mail meer/.test(R.body)&&(await kv.raw(['SCARD','cw:af']))===1,'afgemeld');
const st=await C2.stand(); console.log(JSON.stringify({totaal:st.totaal,perOnderwerp:st.perOnderwerp,wacht:st.wachtOp}));
ok(st.totaal.verstuurd===1&&st.totaal.aan===1&&st.perOnderwerp.o0.succes===1&&st.bezwaren.vertrouwen===1&&st.antwoorden.vraag===1,'stand telt '+JSON.stringify(st.antwoorden));
// vindOsm: een provincie met time-outs houdt de rest niet tegen (24 nov 2026, Noord-Holland bleef hangen)
{ await kv.set('cw:osm', { next: 1, n: 5, per: { 'NL-ZH': 5 }, leeg: {} });
  globalThis.fetch = async (u, o) => { const b = decodeURIComponent(String(o && o.body || '')); if (/NL-NH|Noord-Holland/.test(b)) throw Object.assign(new Error('t'), { name: 'TimeoutError' }); return new Response(JSON.stringify({ elements: [] }), { status: 200, headers: { 'content-type': 'application/json' } }); };
  const r1 = await C.vindOsm(30000), r2 = await C.vindOsm(30000), oo = await kv.get('cw:osm');
  ok(r1.ok === false && r1.provincie === 'NL-NH' && r2.provincie === 'NL-UT' && oo.mis['NL-NH'] === 1, 'osm: mislukte provincie gaat achteraan ' + JSON.stringify([r1.provincie, r2.provincie]));
  await kv.set('cw:osm', { ...oo, per: Object.fromEntries(['NL-ZH','NL-UT','NL-NB','NL-GE','NL-OV','NL-LI','NL-FR','NL-GR','NL-DR','NL-FL','NL-ZE'].map(x => [x, 3])), mis: { 'NL-NH': 4 } });
  const r3 = await C.vindOsm(30000); ok(r3.klaar === true, 'osm: klaar als alleen een overgeslagen provincie over is'); }
