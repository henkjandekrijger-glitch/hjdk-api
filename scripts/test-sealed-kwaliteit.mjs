import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { feitenBij, vraagPlan, keurVraag, kaartKwaliteit, criteriaKaart, uitkomstLessen, VRAAG_VERSIE } from '../lib/sealed-vragen.js';
import { gwStap, gwStand, gwPagina, gwProef, gwKaart, gwTrek, gwBewaking, openPills } from '../lib/sealed-gw.js';
import { helperStand, helperActie, helperPagina, ontwerpPagina } from '../lib/sealed-helper.js';

let controles = 0;
function check(naam, fn) { fn(); controles++; console.log('ok', naam); }
function geheugen() {
  const mem = new Map(), hashes = new Map(), lijsten = new Map();
  return {
    mem, hashes, lijsten,
    get: async k => mem.has(k) ? structuredClone(mem.get(k)) : null,
    set: async (k,v) => { mem.set(k, structuredClone(v)); },
    mget: async (...ks) => ks.map(k => mem.has(k) ? structuredClone(mem.get(k)) : null),
    del: async ks => { for (const k of [].concat(ks)) mem.delete(k); },
    raw: async ([cmd,k,...r]) => {
      if(cmd === 'HINCRBY'){const h=hashes.get(k)||new Map();h.set(r[0],(h.get(r[0])||0)+Number(r[1]));hashes.set(k,h);return h.get(r[0]);}
      if(cmd === 'HGETALL')return [...(hashes.get(k)||new Map())].flatMap(([k,v])=>[k,String(v)]);
      if(cmd === 'LPUSH'){const l=lijsten.get(k)||[];l.unshift(r[0]);lijsten.set(k,l);return l.length;}
      if(cmd === 'LTRIM'){lijsten.set(k,(lijsten.get(k)||[]).slice(+r[0],+r[1]+1));return 'OK';}
      if(cmd === 'LRANGE')return (lijsten.get(k)||[]).slice(+r[0],+r[1]+1);
      if(cmd === 'EXPIRE')return 1;
      return 0;
    }
  };
}
const req = { headers: { 'x-vercel-ip-city': 'Willemstad', 'x-vercel-ip-country': 'CW' } };
const situatie = () => ({ kaart:{richting:'zoekt'}, stappen:[{wie:'bezoeker',zei:'Ik zoek een fulfilmentpartner voor 1500 orders per maand. Ik wil de verzending uitbesteden. Het gaat om kleding.'}], feiten:{}, gevraagd:[], spoor:[] });
const bewijs = [ {veld:'inhoud',bewijs:'kleding'}, {veld:'onderwerp',bewijs:'fulfilmentpartner'}, {veld:'omvang',bewijs:'1500 orders per maand'}, {veld:'doel',bewijs:'de verzending uitbesteden'} ];
let s = situatie();
feitenBij(s,s.stappen[0].zei,{feiten:[...bewijs,{veld:'regio',bewijs:'Nederland'},{veld:'budget',bewijs:'€5.000'}]});
check('alleen bezoekersbewijs, geen verzonnen locatie of budget',()=>{assert.equal(s.feiten.omvang.waarde,'1500 orders per maand');assert.ok(!s.feiten.regio);assert.ok(!s.feiten.budget);});
s.kaart.waar='Willemstad';s.kaart.budget='€5.000';
check('browserplaats en onbewezen kaartvelden verdwijnen',()=>{const k=criteriaKaart(s);assert.equal(k.waar,'');assert.equal(k.budget,'');assert.equal(k.doel,'de verzending uitbesteden');});
check('matchplan slaat bekend volume over en vraagt regio/eisen',()=>{assert.ok(!vraagPlan(s).nog_nodig.includes('omvang'));assert.equal(vraagPlan(s).nog_nodig[0],'regio');});
check('logistieke match is nog niet gereed zonder regio/eisen',()=>assert.equal(kaartKwaliteit(s).gereed,false));
const herstelsituatie=situatie(); herstelsituatie.stappen[0].zei += ' De regio is Zuid-Holland.';
feitenBij(herstelsituatie,herstelsituatie.stappen[0].zei,{kaart:{waar:'Zuid-Holland',budget:'€5000'}});
check('letterlijk genoemde regio wordt ook uit kaartveld hersteld',()=>{assert.equal(herstelsituatie.feiten.regio.waarde,'Zuid-Holland');assert.ok(!herstelsituatie.feiten.budget);});
const prioriteit={...situatie(),n:5,feiten:{onderwerp:{waarde:'fulfilmentpartner'},doel:{waarde:'uitbesteden'},inhoud:{waarde:'kleding'},omvang:{waarde:'1500'},eisen:{waarde:'retouren'}},gevraagd:['onderwerp','omvang','eisen']};
check('essentiële matchvraag gaat aan het eind voor optionele timing',()=>assert.equal(keurVraag({vraag:'Wanneer starten?',veld:'termijn',pills:['Nu','Later']},prioriteit,'nl').veld,'regio'));
const rol={stappen:[{wie:'bezoeker',zei:'We need an interim operations manager to reduce warehouse delays'}],kaart:{richting:'zoekt'},feiten:{},gevraagd:[]};
check('een functie in logistiek blijft een personeelsvraag',()=>assert.equal(vraagPlan(rol).profiel,'personeel'));
const doelBewaren={kaart:{richting:'heeft'},stappen:[{wie:'bezoeker',zei:'Wir suchen neue Webshops als Kunden.'}],gevraagd:[],feiten:{}};
feitenBij(doelBewaren,'Wir suchen neue Webshops als Kunden.',{});
check('expliciet uitgesproken doel blijft behouden zonder extra modelmetadata',()=>assert.equal(doelBewaren.feiten.doel.waarde,'Wir suchen neue Webshops als Kunden'));
const mistDoel={...situatie(),feiten:{onderwerp:{waarde:'magazijnruimte'},inhoud:{waarde:'kleding'},omvang:{waarde:'1500'},regio:{waarde:'Nederland'},eisen:{waarde:'retouren'}},gevraagd:[]};
check('een noodzakelijk doel ontbreekt nooit in het vraagplan',()=>assert.ok(vraagPlan(mistDoel).nog_nodig.includes('doel')));
const hersteld=keurVraag({vraag:'Hoeveel orders?',veld:'omvang',pills:['Klein','Groot']},s,'nl');
check('dubbele vraag wordt vervangen door een relevant ontbrekend criterium',()=>{assert.equal(hersteld.veld,'regio');assert.ok(hersteld.hersteld);});
const stuk=keurVraag({vraag:'Waar?',veld:'regio',pills:['Nederland','Nederland']},s,'en');
check('kapotte pills krijgen een complete herstelvraag in de bezoekerstaal',()=>{assert.ok(stuk.hersteld);assert.ok(stuk.vraag.startsWith('Where'));assert.ok(stuk.pills.length>=2);});
s.veld='budget';s.stappen.push({wie:'bezoeker',zei:'Weet ik nog niet'});feitenBij(s,'Weet ik nog niet');
check('onbekend wordt geen voorkeur, bedrag of harde eis',()=>{assert.ok(!s.feiten.budget);assert.ok(s.onbekend.includes('budget'));});
s.veld='regio';s.stappen.push({wie:'bezoeker',zei:'Nederland'});feitenBij(s,'Nederland');s.veld='';s.stappen.push({wie:'bezoeker',zei:'Correctie: Duitsland, niet Nederland'});feitenBij(s,'Correctie: Duitsland, niet Nederland',{feiten:[{veld:'regio',bewijs:'Duitsland'}]});
check('een expliciete correctie vervangt het oude criterium',()=>assert.equal(s.feiten.regio.waarde,'Duitsland'));
feitenBij(s,'Ander antwoord',{feiten:[{veld:'regio',bewijs:'Nederland'}]});
check('een oude aanname kan een correctie niet terugdraaien',()=>assert.equal(s.feiten.regio.waarde,'Duitsland'));
const lang='a'.repeat(430)+' het belangrijke einde van het verhaal';
let ontving='';const kv=geheugen();
const ai = async o => {
  const i=JSON.parse(o.user);ontving=i.gesprek.filter(x=>x.wie==='bezoeker').at(-1).zei;
  const n=i.vraag_nummer;
  return {txt:JSON.stringify({zeg:'Je verzendeis bepaalt welke partij kan helpen.',vraag:n===1?'In welk land moet het magazijn staan?':n===2?'In welk land moet het magazijn staan?':'',veld:'regio',sleutel:'regio',waarom:'Hiermee vallen partijen buiten je levergebied af.',pills:n<3?['Nederland','België','Weet ik nog niet']:[],klaar:n>=3,feiten:bewijs,kaart:{richting:'zoekt',soort:'fulfilment',titel:'Fulfilment voor een webshop',zoekt:'Fulfilmentpartner voor een webshop',waar:'Curaçao',budget:'€5.000',waarde:'middel'}})};
};
let r=await gwStap(kv,{taal:'nl',tekst:situatie().stappen[0].zei,proef:true},req,{ai});const sid=r.sid;
check('eerste beurt neemt bekend volume over en vraagt ontbrekende regio',()=>{assert.equal(r.versie,VRAAG_VERSIE);assert.equal(r.vraag,'In welk land moet het magazijn staan?');assert.equal(r.kaart.waar,'');assert.equal(r.kaart.budget,'');});
const qid=r.qid;
r=await gwStap(kv,{sid,taal:'nl',keuze:['Nederland']},req,{ai});
check('repetitieve AI wordt ook tijdens het echte gesprek hersteld',()=>{assert.notEqual(r.vraag,'In welk land moet het magazijn staan?');assert.match(r.vraag,/partner/);assert.equal(r.kaart.waar,'Nederland');});
r=await gwStap(kv,{sid,taal:'nl',keuze:['Dezelfde dag verzenden']},req,{ai});
check('bruikbare kaart wordt een concept, nog geen automatische vastlegging',()=>{assert.ok(r.klaar);assert.ok(r.kwaliteit.gereed);assert.ok(!r.kwaliteit.bevestigd);});
check('uitzetten voor controle wordt geweigerd',()=>{});assert.equal((await gwStap(kv,{sid,actie:'kies',keuze:'uitzetten'},req)).ok,false);
assert.equal((await gwStap(kv,{sid,actie:'controle'},req)).ok,true);
check('bevestiging is apart en eenmalig',()=>{});assert.equal((await gwStap(kv,{sid,actie:'controle'},req)).ok,true);
const bewaard=await gwStap(kv,{sid,actie:'kies',keuze:'uitzetten'},req);const url=new URL(bewaard.link,'https://sealedintent.com');
const k=await gwKaart(kv,url.searchParams.get('i'),url.searchParams.get('s'));
check('gecontroleerde kaart heeft statuslink en zeven dagen geldigheid',()=>{assert.ok(bewaard.ok);assert.equal(k.status,'uitgezet');assert.ok(k.kwaliteit.bevestigd);assert.ok(k.expires);});
check('proeven vervuilen geen funnel, netwerk, hulpwachtrij of uitkomstlessen',()=>{assert.equal(kv.lijsten.get('gw:lijst'),undefined);assert.equal(kv.lijsten.get('gw:hulp:lijst'),undefined);assert.equal(kv.hashes.size,0);});
assert.ok(await gwTrek(kv,url.searchParams.get('i'),url.searchParams.get('s')));
check('privékaart is alleen met juiste sleutel leesbaar en kan worden ingetrokken',()=>{});assert.equal(await gwKaart(kv,url.searchParams.get('i'),'fout'),null);
await gwStap(kv,{tekst:lang,proef:true},req,{ai:async o=>{ontving=JSON.parse(o.user).gesprek[0].zei;return {txt:'ongeldig'};}});
check('lange verhalen behouden ook hun relevante einde',()=>assert.match(ontving,/het belangrijke einde/));
const foutAI=async()=>({txt:JSON.stringify({kaart:{},vraag:'',pills:[],klaar:false})});
const k2=geheugen();r=await gwStap(k2,{tekst:'Ik weet nog niet precies wat ik nodig heb',proef:true},req,{ai:foutAI});
check('lege modelvraag levert geen vals afgeronde kaart',()=>{assert.ok(!r.klaar);assert.ok(r.vraag);assert.ok(r.pills.length>=2);});
let n=1;const seen=new Set([r.vraag]);while(!r.klaar&&n<8){r=await gwStap(k2,{sid:r.sid,keuze:[r.pills.at(-1)],proef:true},req,{ai:foutAI});if(r.vraag){assert.ok(!seen.has(r.vraag));seen.add(r.vraag)}n++;}
check('zes vragen is een stop voor de intake, geen toestemming om een onvolledige kaart uit te zetten',()=>{assert.ok(r.klaar);assert.ok(!r.kwaliteit.gereed);assert.ok(n<=6);});
assert.equal((await gwStap(k2,{sid:r.sid,actie:'controle'},req)).ok,false);
const hulp=await gwStap(k2,{sid:r.sid,actie:'hulp'},req);
check('hulp is mogelijk zonder contactgegevens of een complete kaart',()=>assert.equal(hulp.hulp.status,'wacht'));
check('proefhulp staat niet in de echte helperlijst',()=>{});assert.equal((await helperStand(k2)).gesprekken.length,0);
const k3=geheugen();r=await gwStap(k3,{tekst:situatie().stappen[0].zei},req,{ai});const hsid=r.sid;
await gwStap(k3,{sid:hsid,actie:'hulp'},req);
check('een echte hulpvraag staat privé met de context klaar',()=>{});assert.equal((await helperStand(k3)).gesprekken.length,1);
assert.equal((await helperActie(k3,{sid:hsid,actie:'antwoord',tekst:'Wat is voor jou de belangrijkste verzendeis?'})).ok,true);
check('een mens kan antwoorden in hetzelfde gesprek',()=>{});assert.match((await gwStap(k3,{sid:hsid,actie:'hulpstand'},req)).hulp.antwoord,/verzendeis/);
await gwStap(k3,{sid:hsid,actie:'feedback',qid:r.qid,antwoord:'nee'},req);await gwStap(k3,{sid:hsid,actie:'feedback',qid:r.qid,antwoord:'nee'},req);
check('feedback telt per vraag hoogstens één keer',()=>assert.equal(k3.hashes.get('gw:q:'+r.qid).get('hielp_niet'),1));
assert.equal((await helperActie(k3,{sid:hsid,actie:'uitkomst',uitkomst:'passend',reden:'Een bevestigde partij voldoet aan alle getoetste voorwaarden.'})).ok,true);
assert.equal((await helperActie(k3,{sid:hsid,actie:'uitkomst',uitkomst:'passend',reden:'Dit mag niet dubbel tellen.'})).ok,false);
check('een match telt uitsluitend na onderbouwde menselijke beoordeling en niet dubbel',()=>assert.equal(k3.hashes.get('gw:kwaliteit').get('match_bevestigd'),1));
check('weinig data geeft geen schijnles of winnaar',()=>{});assert.equal((await uitkomstLessen(k3,'logistiek')).lessen.length,0);
await k3.raw(['HINCRBY','gw:stat:'+new Date().toISOString().slice(0,10),'start',30]);
const bewaking=await gwBewaking(k3);
check('uurcontrole signaleert gesprekken zonder bevestigde kaarten',()=>assert.ok(bewaking.alarmen.length));
const dir=mkdtempSync(join(tmpdir(),'sealed-kwaliteit-'));
for(const taal of ['nl','en','de']){
  const html=gwPagina(taal,{geo:{stad:'Gouda',land:'NL'},open:await openPills(kv,taal)}),js=html.match(/<script>([\s\S]*?)<\/script>/)[1],f=join(dir,taal+'.js');writeFileSync(f,js);execFileSync(process.execPath,['--check',f]);writeFileSync(join(dir,taal+'.html'),html);
  check('browsercode '+taal+' is geldig en heeft kaartcontrole en hulproute',()=>{assert.match(html,/actie:'controle'/);assert.match(html,/actie:'hulp'/);assert.match(html,/\[hidden\]/);});
}
for(const [naam,html] of [['helper',helperPagina()],['ontwerp',ontwerpPagina()]]){
  const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'',f=join(dir,naam+'.js');writeFileSync(f,js);execFileSync(process.execPath,['--check',f]);writeFileSync(join(dir,naam+'.html'),html);check(naam+' browsercode is geldig',()=>assert.ok(js));
}
const fn=readFileSync(new URL('../fn/sealed.js',import.meta.url),'utf8');
check('helperscherm weigert openbare hosts en wijzigingen van een andere origin',()=>{assert.match(fn,/!== 'hjdk-api-henq\.vercel\.app'/);assert.match(fn,/req\.headers\.origin !== 'https:\/\/hjdk-api-henq\.vercel\.app'/);});
const stand=await gwStand(k3);check('stand maakt meetbeperkingen en kwaliteitsversie zichtbaar',()=>{assert.equal(stand.versie,VRAAG_VERSIE);assert.ok(stand.bewaking);assert.match(stand.meetregel,/geen bevestigde match/);});
console.log(`${controles} controles geslaagd; browserbestanden: ${dir}`);
