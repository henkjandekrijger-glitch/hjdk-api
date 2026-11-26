import { doelKeten, ketenTekst, doelBewaar, doelDag, lijnVan } from '../lib/doelketen.js';
const c=(naam,project,kliks,bezoek,mens,actie,aanmelding,kosten=1)=>({naam,project,kliks,bezoek,mens,actie,aanmelding,koop:0,kosten});
const camps=[c('KAUFBERATER SPEICHER CHAT DE | In-Page | Android','overig',481,480,0,232,0,3.23),c('KAUFBERATER SPEICHER CHAT DE | In-Page | x','overig',393,393,0,203,0,.94),
c('TODAYIN CURACAO CO DO VE | In-Page','todayin',1727,1585,509,0,44),c('TODAYIN CURACAO CO DO VE | In-Page | 24nov','todayin',621,615,241,0,37),
c('WAM BLENDLE NL | In-Page','overig',151,156,0,0,0),c('[In-Page] SHOP-LUS PAKKET Bureau set | thuis','shop',84,75,null,2,0),c('[In-Page] SHOP-LUS SIERADEN Polly','shop',84,40,null,1,0),c('LEEG','overig',0,0,0,0,0)];
const k=doelKeten(camps); const ok=(v,n)=>{if(!v){console.log('FOUT',n);process.exitCode=1}};
ok(lijnVan('[In-Page] SHOP-LUS PAKKET x | y')==='SHOP-LUS','lijn shop');
ok(k.kliks===3541&&k.uit===81&&k.nu===2.3,'totaal '+k.kliks+' '+k.uit+' '+k.nu);
ok(k.grootste==='KAUFBERATER SPEICHER CHAT DE','grootste '+k.grootste);
ok(k.lijnen[0].tekort===43.7&&k.lijnen[0].meetgat,'tekort '+k.lijnen[0].tekort);
ok(k.meetgaten.includes('WAM BLENDLE NL'),'wam meetgat');
const s=k.lijnen.find(l=>l.lijn==='SHOP-LUS');ok(s.mens===null&&s.campagnes===2&&/^aankomst: 68%/.test(s.stap),'shop '+s.stap);
ok(k.lijnen.find(l=>l.lijn==='TODAYIN CURACAO CO DO VE').tekort===36.4,'todayin tekort');
ok(doelKeten([]).nu===null&&ketenTekst(doelKeten([])).length===0,'leeg');
const H=new Map(),kv={raw:async a=>a[0]==='HSET'?(H.set(a[2],a[3]),1):H.get(a[2])??null};
ok(await doelBewaar(kv,'2026-11-25',k)&&(await doelDag(kv,'2026-11-25')).nu===2.3&&!(await doelDag(kv,'x')),'bewaar');
ok(!(await doelBewaar(kv,'d',doelKeten([camps[4].kliks?c('A','x',50,50,1,1,1):0]))),'te weinig');
const t=ketenTekst(k);ok(!/[—–]/.test(t.join())&&t.some(z=>z.startsWith('Grootste lek: KAUFBERATER')),'tekst');
const {campUitkomst,adresMeetgat}=await import('../lib/doelketen.js');const C=[],kv2={raw:async a=>(C.push(a),1)};
ok(await campUitkomst(kv2,'pa','12190846','aanmelding','2026-11-26')&&C[0].join(' ')==='HINCRBY mm:cu:2026-11-26 propeller|12190846|aanmelding 1'&&C[1][0]==='EXPIRE','campUitkomst');
ok(!(await campUitkomst(kv2,'x','1','aanmelding'))&&!(await campUitkomst(kv2,'pa','','aanmelding'))&&!(await campUitkomst(kv2,'pa','1','raar'))&&C.length===2,'campUitkomst weigert');
ok(adresMeetgat(4,0)&&adresMeetgat(6,2)&&!adresMeetgat(2,0)&&!adresMeetgat(6,3)&&!adresMeetgat(0,0),'adresMeetgat');
const sk=doelKeten([c('[In-Page] SHOP-LUS PAKKET Bureau set winactie','shop',500,480,null,0,4)]).lijnen[0];ok(sk.uit===4&&sk.per100===0.8&&/^van mens naar uitkomst: 4 uitkomsten$/.test(sk.stap),'shop adres telt '+sk.stap);
console.log(process.exitCode?'doelketen FOUT':'doelketen ok');
