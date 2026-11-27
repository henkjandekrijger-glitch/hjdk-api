import * as D from '../lib/dashboard.js';
const m=new Map(), sets=new Map();
const log=[{t:'2026-11-25T08:40:00Z',wie:'kdp-statuscheck',tekst:'LC naar voorgesteld bod <b>'},{t:'2026-11-25T07:00:00Z',wie:'deploy',tekst:'Live gezet abc: WAM: tijdlijn'},{t:'2026-11-24T07:00:00Z',wie:'wam-chat',tekst:'x'}];
m.set('mm:wachtuur:laatst',{eigen:{projecten:{todayin:{kliks:1894,aanmelding:48,koop:0},'todayin|NL':{kliks:426,aanmelding:7},shop:{kliks:223,aanmelding:0,koop:0}}}});
const H=new Map();
const kv={get:async k=>m.get(k)??null,set:async(k,v)=>{m.set(k,JSON.parse(JSON.stringify(v)))},raw:async a=>{if(a[0]==='SADD'){(sets.get(a[1])||sets.set(a[1],new Set()).get(a[1])).add(a[2]);return 1}if(a[0]==='SMEMBERS')return [...(sets.get(a[1])||[])];if(a[0]==='LRANGE')return log.map(x=>JSON.stringify(x));const HH=k=>H.get(k)||(H.set(k,new Map()),H.get(k));if(a[0]==='HSET'){HH(a[1]).set(a[2],a[3]);return 1}if(a[0]==='HDEL'){for(const f of a.slice(2))HH(a[1]).delete(f);return 1}if(a[0]==='HGETALL')return [...HH(a[1]).entries()].flat();if(a[0]==='HKEYS')return [...HH(a[1]).keys()];return null}};
const ok=(c,n)=>{if(!c){console.log('FOUT',n);process.exitCode=1}};
let d=await D.dashData(kv); const k=d.projecten.find(p=>p.id==='kdp');
ok(k.pct===24,'pct');ok(k.log.length===1,'log kdp');ok(d.projecten.find(p=>p.id==='wam').log.length===2,'log wam');ok(d.agenda.some(a=>a.id==='kdp'&&a.d==='2026-11-27')&&d.agenda.every((a,i)=>!i||d.agenda[i-1].d<=a.d),'agenda');
ok((await D.zetDash(kv,{project:'kdp',nu:61.95,klaar:'pit boss'})).ok,'zet');
ok(!(await D.zetDash(kv,{project:'kdp',klaar:'bestaat niet'})).ok,'klaar fout');
ok(!(await D.zetDash(kv,{project:'nieuw'})).ok,'nieuw zonder naam');
ok((await D.zetDash(kv,{project:'nieuw',naam:'Proef',doel:'x',erbij:{d:'2026-11-20',t:'oud'}})).ok,'nieuw');
d=await D.dashData(kv); const k2=d.projecten.find(p=>p.id==='kdp');
ok(k2.pct===31,'pct2 '+k2.pct);ok(k2.plan.filter(x=>x.klaar).length===1,'klaar');ok(k2.plan.length===8,'plan heel');
ok(d.projecten.some(p=>p.id==='nieuw'&&p.telaat===1),'nieuw te laat');
const h=D.dashHtml(d);ok(h.includes('&lt;b&gt;')&&!h.includes('<b>\''),'escape');ok(!/[—–]/.test(h),'streepjes');
const t=D.dashTekst(d,'kdp');ok(t.includes('Voortgang: 61,95 van 200'),'tekst');
ok((await D.zetDash(kv,{project:'wam',archief:true})).ok,'archiveer');
d=await D.dashData(kv);ok(!d.projecten.some(p=>p.id==='wam')&&d.archief.some(a=>a.id==='wam'),'archief weg uit overzicht');ok(!d.agenda.some(a=>a.id==='wam'),'archief weg uit planning');
const h2=D.dashHtml(d,{tekst:'x',terug:'wam'});ok(h2.includes('?terug=wam')&&h2.includes('<b>Archief</b>')&&!h2.includes('id="wam"'),'archief html');ok(h2.includes('?archiveer=kdp'),'archiveerknop');ok(!D.dashTekst(d).includes('## We Are Many'),'archief tekst');
ok((await D.zetDash(kv,{project:'wam',archief:false})).ok,'terug');d=await D.dashData(kv);ok(d.projecten.some(p=>p.id==='wam')&&!d.archief.length,'terug in overzicht');
const c=d.projecten.find(p=>p.id==='clickmind');ok(c&&c.nu===2.3&&c.pct===46,'clickmind live '+(c&&c.nu));ok(c.advies&&!c.doel,'advies geen doel');
const kk=d.projecten.find(p=>p.id==='kdp');ok(kk.verder.startsWith('https://claude.ai/code/new?q=')&&kk.verder.includes('&repo=henkjandekrijger-glitch%2Fhjdk-api')&&kk.verder.length<2500,'verder kdp '+kk.verder.length);ok(decodeURIComponent(kk.verder).includes('project=kdp'),'verder inhoud');
ok(d.projecten.find(p=>p.id==='tk').verder.startsWith('https://claude.ai/new?q='),'verder zonder repo');
ok(!(await D.zetDash(kv,{project:'kdp',claude:'https://evil.example/x'})).ok,'claude url geweigerd');ok((await D.zetDash(kv,{project:'kdp',claude:'https://claude.ai/project/abc-123'})).ok,'claude url');
ok((await D.dashData(kv)).projecten.find(p=>p.id==='kdp').verder.startsWith('https://claude.ai/project/abc-123?q='),'verder project');
ok(D.dashHtml(d).includes('Verder in Claude'),'knop');
ok(D.LEERPROMPT.length>2500&&D.LEERPROMPT.length<9000&&!/[—–]/.test(D.LEERPROMPT),'leerprompt '+D.LEERPROMPT.length);
ok((await D.dashData(kv)).leerprompt.tekst===D.LEERPROMPT,'leerprompt standaard');ok(!(await D.zetLeerprompt(kv,'kort')).ok,'leerprompt te kort');
ok((await D.zetLeerprompt(kv,'NIEUW '+'x'.repeat(300))).ok,'leerprompt zet');let dl=await D.dashData(kv);ok(dl.leerprompt.tekst.startsWith('NIEUW')&&dl.leerprompt.heeftVorige,'leerprompt gelezen');
ok(D.dashTekst(dl,'kdp').includes('NIEUW xxx')&&D.dashHtml(dl).includes('id="lp"'),'leerprompt in tekst en pagina');
ok((await D.vorigeLeerprompt(kv)).ok&&(await D.leesLeerprompt(kv)).tekst===D.LEERPROMPT,'leerprompt vorige terug');
const vd=new Date().toISOString().slice(0,10), gd=new Date(Date.now()-864e5).toISOString().slice(0,10);
ok((await D.zetDash(kv,{project:'kdp',geld:{dag:gd,opbrengst:{royalty:61.95},kosten:{'Amazon Ads':18.23}}})).ok,'geld zet');ok(!(await D.zetDash(kv,{project:'kdp',geld:{kosten:{x:-1}}})).ok,'geld negatief');
m.set('mm:wachtuur:laatst',{eigen:{projecten:{todayin:{kliks:1894,aanmelding:48,koop:0,kosten:6.2},'todayin|NL':{kliks:426,kosten:1.3},shop:{kliks:223,kosten:0.64}}}});
let dg=await D.dashData(kv);const us=dg.geld.perMunt[0];ok(us&&us.munt==='USD'&&us.totaal.kosten===25.07&&us.totaal.opbrengst===61.95,'geld totaal '+JSON.stringify(us&&us.totaal));
ok(us.projecten.find(x=>x.id==='curacao').kosten===6.2&&us.dagen.find(x=>x.dag===gd).saldo===43.72,'geld per project en dag');
ok(dg.opvallend.some(o=>o.id==='curacao'&&o.verder.includes('INGRIJPEN')),'opvallend kosten zonder opbrengst');ok(!dg.opvallend.some(o=>o.id==='kdp'&&/kosten/.test(o.tekst)),'kdp niet opvallend');
const hg=D.dashHtml(dg);ok(hg.includes('Laat Claude ingrijpen')&&hg.includes('<h2>Geld, laatste 7 dagen</h2>'),'geld html');ok(D.dashTekst(dg).includes('GELD laatste 7 dagen')&&D.dashTekst(dg,'kdp').includes('opbrengst: royalty'),'geld tekst');
ok((await D.zetDash(kv,{project:'kdp',geld:{dag:gd,kosten:{'Amazon Ads':0}}})).ok&&(await D.dashData(kv)).geld.perMunt[0].totaal.kosten===6.84,'geld weghalen');
ok(D.LEERPROMPT.includes('RANGORDE')&&D.LEERPROMPT.includes('WAARDE ALS ER NOG GEEN OMZET IS'),'leerprompt rangorde en waarde');
ok(!(await D.zetDash(kv,{project:'curacao',waarde:{bedrag:0.5}})).ok,'waarde zonder waarom');ok((await D.zetDash(kv,{project:'curacao',waarde:{bedrag:0.5,per:'aanmelding',waarom:'proefschatting voor de test, lager dan de inkoopprijs'}})).ok,'waarde zet');
await D.dashData(kv);let dw=await D.dashData(kv);const cw=dw.geld.perMunt[0].projecten.find(x=>x.id==='curacao');ok(cw.waarde===24&&cw.opbrengst===0&&dw.geld.perMunt[0].totaal.opbrengst===61.95,'waarde apart van opbrengst '+cw.waarde);
ok(!dw.opvallend.some(o=>o.id==='curacao'&&/kosten/.test(o.tekst)),'waarde dekt kosten: niet opvallend');ok(D.dashHtml(dw).includes('geen omzet'),'waarde html');
const tl=D.telLanden({dagen:[{dag:'2026-11-24',rijen:[{cc:'ve',s:3},{cc:'co',s:1},{s:2}]},{dag:'2026-11-25',rijen:[{cc:'ve',s:1},{cc:'cw',s:4},{cc:'nl',s:0}]}]});
ok(tl.dag==='2026-11-25'&&tl.vandaag===5&&tl.totaal===11&&tl.landen[0].cc==='ve'&&tl.landen[0].totaal===4&&tl.landen.find(x=>x.cc==='cw').vandaag===4&&tl.landen.some(x=>x.cc==='??'),'landen tellen');ok(D.telLanden({})===null,'landen leeg');
m.set('mm:dash:landen:curacao',Object.assign({t:Date.now()},tl));const dlnd=await D.dashData(kv);ok(D.dashTekst(dlnd,'curacao').includes('Venezuela: vandaag 1, totaal 4')&&D.dashHtml(dlnd).includes('Adressen per land'),'landen in tekst en pagina');
ok((await D.zetDash(kv,{project:'nexyplatform',vast:[{post:'AWS (70%)',perMaand:365,bron:'test'}]})).ok,'vast zet');const dv=await D.dashData(kv);const nv=dv.geld.perMunt[0].projecten.find(x=>x.id==='nexyplatform');ok(nv&&nv.kosten===84,'vast per dag in kasboek '+(nv&&nv.kosten));ok(D.dashHtml(dv).includes('AWS (70%) $365,00 per maand')&&D.dashTekst(dv,'nexyplatform').includes('Vaste kosten per maand'),'vast zichtbaar');
console.log('klaar',h.length,d.projecten.length);

// skills-overzicht (25 nov): elke skill in de lijst staat in de repo en is op te vragen
{ const D = await import('../lib/dashboard.js'); const l = D.skillsLijst();
  if (l.length < 9 || l.some(k => !k.staat)) throw new Error('skill ontbreekt: ' + l.filter(k => !k.staat).map(k => k.naam).join(', '));
  if (!D.skillTekst('clickmind') || D.skillTekst('bestaat-niet') !== null || D.skillTekst('../../package') !== null) throw new Error('skillTekst');
  console.log('skills ok', l.length); }

// startopdracht voor een chat (26 nov): bovenaan de HTML (commentaar) en bovenaan vorm=tekst
{ const D = await import('../lib/dashboard.js'); const st = D.startTekst({ projecten: [{ id: 'kdp', naam: 'KDP-boeken', doel: 'x' }] });
  if (!/STARTOPDRACHT/.test(st) || !/vorm=tekst&project=<id>/.test(st) || /--/.test(st.replace(/https?:\/\/\S+/g, ''))) throw new Error('startTekst');
  console.log('startopdracht ok'); }
// output en outcome (Henkjan 26 nov 2026)
{
  const O = await import('../lib/output.js');
  const vd2=new Date().toISOString().slice(0,10), dg=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);
  ok(!(await D.zetDash(kv,{project:'kdp',output:{wat:'x'}})).ok,'output zonder intentie geweigerd');
  const u=await D.zetDash(kv,{project:'kdp',output:{wat:'PIT BOSS EXACT aan met 16 winnaars',intentie:'PIT BOSS-royalty omhoog, KDP royalty per dag omhoog',metriek:'opbrengst',drempel:5,oordeel:vd2,dag:dg(3)}});
  ok(u.ok&&u.output,'output zet '+JSON.stringify(u));
  for(let i=1;i<=10;i++) await D.zetDash(kv,{project:'kdp',geld:{dag:dg(i),opbrengst:{royalty:i<=3?80:50}}});
  let dd=await D.dashData(kv,{dagen:30}); const kk=dd.projecten.find(p=>p.id==='kdp');
  ok(kk.nu>=50&&/kasboek/.test(kk.gemeten),'kdp nu uit kasboek '+kk.nu+' '+kk.gemeten);
  ok(kk.output&&kk.output.tel.gemaakt>=1,'kdp output');
  const it=kk.output.items.find(x=>x.id===u.output); ok(it&&['raak','mis','geen meting'].includes(it.oordeelNu.uitslag),'oordeel '+JSON.stringify(it&&it.oordeelNu));
  ok((await D.zetDash(kv,{project:'kdp',oordeel:{id:u.output,uitslag:'mis',waarom:'royalty steeg niet boven 5 dollar per dag'}})).ok,'zelf oordelen');
  dd=await D.dashData(kv); ok(dd.projecten.find(p=>p.id==='kdp').output.items.find(x=>x.id===u.output).oordeelNu.uitslag==='mis','oordeel gaat voor');
  const hh=D.dashHtml(dd); ok(hh.includes('Output en outcome')&&hh.includes('Outcome: doel en getal')&&hh.includes('id="vraag"')&&!/[—–]/.test(hh),'output html');
  ok(D.dashTekst(dd).includes('OUTPUT EN OUTCOME')&&D.dashTekst(dd,'kdp').includes('Output (wat we maakten'),'output tekst');
  ok(O.outputTekst(dd.output,'kdp').includes('[mis] PIT BOSS EXACT'),'output tekst los');
  console.log(process.exitCode?'output FOUT':'output ok');
}

// campagnestand (Henkjan 27 nov 2026: "Ik merk dat dashboard niet op de hoogte is van campagnes laatste status zorg daarvoor")
{ const C=await import('../lib/campstand.js'); const nu=Date.parse('2026-11-27T12:00:00Z');
  const pa={budget:{dag:'2026-11-27',grens:100,saldo:2.1,kosten:2.1,omzet:0,stand:'ok',projecten:{WAM:{kosten:0.5,saldo:0.5,test:true,dagen:8,grens:4},'SHOP-LUS':{kosten:0.63,saldo:0.63,test:true,dagen:30,open:'x'},OVERIG:{kosten:0.94,saldo:0.94,test:true}},perNet:{pa:{kosten:2.1,omzet:0,gemeld:'2026-11-27T11:43:45Z',oud:false},mondiad:{kosten:0,omzet:0,oud:false}},
    winst:[{net:'pa',project:'WAM',cid:'12190793',naam:'WAM INCASSO rekenhulp NL',kosten:0.17,omzet:0},{net:'pa',project:'WAM',cid:'12190794',naam:'WAM ANP fotoclaim NL',kosten:0.13,omzet:0},{net:'pa',project:'OVERIG',cid:'12196034',naam:'[In-Page] KADOLYWIN ZEGEL spaarkaart',kosten:0.85,omzet:0},{net:'pa',project:'SHOP-LUS',cid:'12190846',naam:'[In-Page] SHOP-LUS PAKKET Bureau set',kosten:0.42,omzet:0},{net:'pa',project:'OVERIG',cid:'12182934',naam:'WHICHTOBUY POWER STATION CHAT US',kosten:0.09,omzet:0},{net:'pa',project:'OVERIG',cid:'1',naam:'ONBEKEND iets',kosten:0.05,omzet:0}]},slots:{gebruikt:7,grens:100},tempo:[{t:'2026-11-26T19:57:18Z',cid:'12190846',naam:'[In-Page] SHOP-LUS PAKKET Bureau set winactie',waarom:'tempo'}]};
  const uur={netten:{propeller:{kliks:221,aangekomen:207,pct:93.7},mondiad:{kliks:0,aangekomen:0,pct:null}},eigen:{projecten:{todayin:{kliks:1894,aanmelding:48,koop:0},'todayin|NL':{kliks:426,aanmelding:7},shop:{kliks:223,aanmelding:0,koop:1}}}};
  const c=C.campBouw(pa,uur,nu,nu);
  ok(C.campProject('TODAYIN CURACAO TIER1 NL','TODAYIN')==='curacao'&&C.campProject('x','SHOP-LUS')==='kadoly'&&C.campProject('ONBEKEND','OVERIG')==='campagnes','camp project');
  ok(c.projecten.wam.campagnes.length===2&&c.projecten.wam.kosten===0.3&&c.projecten.kadoly.campagnes.length===2&&c.projecten.kadoly.kosten===1.27&&c.projecten.keuzehulpen.kosten===0.09&&c.projecten.campagnes.campagnes.length===1,'camp per project');
  ok(c.projecten.curacao.kliks===1894&&c.projecten.curacao.aanmelding===48&&c.projecten.kadoly.koop===1,'camp clickmind');
  const rw=C.campRegels(c,'wam'), rc=C.campRegels(c,'campagnes',{wam:'We Are Many',kadoly:'Kadoly'});
  ok(rw[0]==='Vandaag 2 campagnes met kosten: $0,30, gegarandeerde omzet $0,00.'&&rw[1].startsWith('Testbudget WAM: $0,50 van $4,00 vandaag, testdag 8')&&rw.some(x=>x.includes('12190793'))&&rw[rw.length-1]==='Stand van 27 nov 12:00 UTC.','camp regels wam '+rw[0]);
  ok(rc[0].startsWith('Vandaag: kosten $2,10')&&rc[1].startsWith('Per netwerk: PropellerAds $2,10')&&rc[2].includes('Kadoly $1,27 (2)')&&rc[2].includes('We Are Many $0,30 (2)')&&rc.some(x=>x.includes('207 van 221 kliks (93,7%)'))&&rc.some(x=>x.startsWith('Starts PropellerAds: 7 van 100')),'camp regels totaal');
  ok(C.campRegels(c,'tk').length===0&&C.campRegels(null,'kdp',{},'Amazon Ads: x').length===1&&C.campOpvallend(c)===null&&C.campOpvallend(null)===null,'camp leeg');
  ok(C.campOpvallend(C.campBouw(pa,uur,nu-31*60e3,nu)).tekst.includes('ouder dan 30 minuten')&&C.campOpvallend(C.campBouw({budget:{...pa.budget,stand:'alarm'}},uur,nu,nu)).tekst.includes('Budgetwacht staat op alarm'),'camp opvallend');
  const kvc={get:async k=>k==='mm:dash:camp'?{t:Date.now()-60e3,pa}:kv.get(k),set:kv.set,raw:kv.raw}; const dc=await D.dashData(kvc); const pw=dc.projecten.find(p=>p.id==='wam'), pc=dc.projecten.find(p=>p.id==='campagnes');
  ok(dc.campagnes&&dc.campagnes.budget.kosten===2.1&&pw.campagnes.regels.length>=3&&pc.campagnes.regels[0].startsWith('Vandaag: kosten $2,10'),'camp in dashData');
  ok(D.dashHtml(dc).includes('<h3>Campagnes nu</h3>')&&D.dashTekst(dc,'wam').includes('Campagnes: Vandaag 2 campagnes met kosten')&&!/[\u2014\u2013]/.test(D.dashHtml(dc)),'camp html en tekst');
  ok(!(await D.dashData(kv)).campagnes,'camp zonder bron');
  console.log('campagnestand ok'); }
