import * as D from '../lib/dashboard.js';
const m=new Map(), sets=new Map();
const log=[{t:'2026-11-25T08:40:00Z',wie:'kdp-statuscheck',tekst:'LC naar voorgesteld bod <b>'},{t:'2026-11-25T07:00:00Z',wie:'deploy',tekst:'Live gezet abc: WAM: tijdlijn'},{t:'2026-11-24T07:00:00Z',wie:'wam-chat',tekst:'x'}];
m.set('mm:wachtuur:laatst',{eigen:{projecten:{todayin:{kliks:1894,aanmelding:48,koop:0},'todayin|NL':{kliks:426,aanmelding:7},shop:{kliks:223,aanmelding:0,koop:0}}}});
const H=new Map();
const kv={get:async k=>m.get(k)??null,set:async(k,v)=>{m.set(k,JSON.parse(JSON.stringify(v)))},raw:async a=>{if(a[0]==='SADD'){(sets.get(a[1])||sets.set(a[1],new Set()).get(a[1])).add(a[2]);return 1}if(a[0]==='SMEMBERS')return [...(sets.get(a[1])||[])];if(a[0]==='LRANGE')return log.map(x=>JSON.stringify(x));if(a[0]==='HSET'){H.set(a[2],a[3]);return 1}if(a[0]==='HDEL'){for(const f of a.slice(2))H.delete(f);return 1}if(a[0]==='HGETALL')return [...H.entries()].flat();if(a[0]==='HKEYS')return [...H.keys()];return null}};
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
