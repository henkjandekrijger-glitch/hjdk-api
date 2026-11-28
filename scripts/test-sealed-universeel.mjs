import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { intakeBij, benodigdeCriteria, veldMag, leerOverzicht } from '../lib/sealed-universeel.js';
import { feitenBij, kaartKwaliteit, vraagPlan, telVraag, uitkomstLessen } from '../lib/sealed-vragen.js';
import { gwStap, gwKaart, gwTrek, gwStatusPagina } from '../lib/sealed-gw.js';
import { agentActie, reacties, agentPagina } from '../lib/sealed-agent.js';
import { verbergContact } from '../lib/sealed-contact.js';

function geheugen(){const M=new Map(),H=new Map(),L=new Map();return{M,H,L,get:async k=>structuredClone(M.get(k)??null),set:async(k,v)=>{M.set(k,structuredClone(v));},mget:async(...ks)=>ks.map(k=>structuredClone(M.get(k)??null)),del:async ks=>[].concat(ks).forEach(k=>M.delete(k)),raw:async([c,k,...r])=>{if(c==='HINCRBY'){const h=H.get(k)||new Map();h.set(r[0],(h.get(r[0])||0)+Number(r[1]));H.set(k,h);return h.get(r[0]);}if(c==='HGETALL')return[...(H.get(k)||new Map())].flatMap(([k,v])=>[k,String(v)]);if(c==='LPUSH'){const l=L.get(k)||[];l.unshift(r[0]);L.set(k,l);return l.length;}if(c==='LTRIM'){L.set(k,(L.get(k)||[]).slice(+r[0],+r[1]+1));return'OK';}if(c==='LRANGE')return(L.get(k)||[]).slice(+r[0],+r[1]+1);return 1;}}}
let n=0;const check=(naam,fn)=>{fn();n++;console.log('ok',naam)};
check('productcodes blijven behouden terwijl contact wordt verborgen',()=>{assert.match(verbergContact('EAN: 8712345678901. Bel 0612345678 of mail qa@voorbeeld.nl'),/8712345678901/);assert.ok(!verbergContact('Bel 0612345678 of mail qa@voorbeeld.nl').includes('0612345678'));});
check('productcode als antwoord op een productvraag blijft intact',()=>assert.equal(verbergContact('8712345678901',400,'ean'),'8712345678901'));
check('een groot bedrag wordt geen telefoonnummer',()=>assert.match(verbergContact('Budget: €100000000'),/100000000/));
const req={headers:{'x-vercel-ip-city':'Willemstad','x-vercel-ip-country':'CW'}};
const cases=[
  ['productlater','aansluiting','Aansluiting','inhoud','Welke aansluiting moet het product hebben?',['USB-C','Thunderbolt'], 'Ik zoek 200 docks voor mijn nieuwe werkplekken. Ik wil alles in maart geleverd krijgen; een agent van de leverancier mag reageren.'],
  ['fabrieksdeel','tolerantie','Tolerantie','eisen','Welke nauwkeurigheid is nodig?',['0,05 mm','0,1 mm'], 'Ik zoek een serie onderdelen voor een machine. Het gaat om een nieuwe productie en de passing moet vooraf goed worden afgesproken.'],
  ['fotografie','gebruiksrecht','Gebruiksrecht','eisen','Waar wil je de beelden gebruiken?',['Alleen eigen website','Ook advertenties'], 'Ik zoek fotografie voor een nieuwe campagne. Ik wil vooraf duidelijke afspraken over het gebruik van het werk kunnen maken.'],
  ['catering','dieetwensen','Dieetwensen','inhoud','Welke dieetwensen moeten worden meegenomen?',['Vegetarisch','Veganistisch'], 'Ik zoek catering voor een zakelijke bijeenkomst. Ik wil een maaltijd die past bij de gasten en vooraf goed kan worden georganiseerd.'],
  ['software','koppeling','Koppeling','eisen','Waar moet de oplossing mee samenwerken?',['Mijn webshop','Mijn administratie'], 'Ik zoek een oplossing om dubbele invoer uit mijn werk te halen. Ik wil dat het in mijn bestaande werkwijze past.'],
  ['ruimteaanbod','toegangstijden','Toegangstijden','termijn','Wanneer kan de ruimte worden gebruikt?',['Alleen overdag','Ook in de avond'], 'Wij bieden een werkruimte die niet iedere dag wordt gebruikt. Wij zoeken iemand die daar onder duidelijke voorwaarden gebruik van maakt.'],
  ['training','startniveau','Startniveau','inhoud','Welk niveau heeft de groep nu?',['Beginners','Gevorderden'], 'Ik zoek een training voor mijn team. Ik wil dat iedereen na afloop de nieuwe manier van werken kan toepassen.'],
  ['licentie','toegestaan_gebruik','Toegestaan gebruik','eisen','Voor welk gebruik is toestemming nodig?',['Intern gebruik','Commercieel gebruik'], 'Ik zoek toestemming om bestaand materiaal in een eigen toepassing te gebruiken. Ik wil vooraf weten welke rechten daarbij horen.'],
  ['onderhoud','stilstand','Stilstand','termijn','Wanneer kan de installatie stil?',['Alleen in het weekend','Ook op werkdagen'], 'Ik zoek onderhoud voor een installatie die dagelijks in gebruik is. Ik wil het werk met zo min mogelijk uitval laten uitvoeren.'],
  ['onderzoek','bewijsniveau','Bewijsniveau','eisen','Welke onderbouwing heb je nodig?',['Een eerste verkenning','Een toetsbaar rapport'], 'Ik zoek hulp bij een onderzoeksvraag voor mijn organisatie. Ik wil een resultaat waar we een besluit op kunnen baseren.'],
  ['vervoer','laadwijze','Laadwijze','inhoud','Hoe kan de lading worden geladen?',['Met een heftruck','Met een laadklep'], 'Ik zoek vervoer voor een partij goederen. Ik wil dat het ophalen en afleveren op de afgesproken manier kan gebeuren.'],
  ['samenwerking','inbreng','Inbreng','omvang','Wat moet de andere kant inbrengen?',['Uitvoering','Distributie'], 'Ik zoek samenwerking om een nieuw idee uit te voeren. Ik wil een partij die iets toevoegt wat ik zelf nog niet kan leveren.']
];
let product=null;
for(const [usecase,id,label,groep,vraag,pills,verhaal]of cases){
  const kv=geheugen();let beurt=0;
  const ai=async()=>{beurt++;return{txt:JSON.stringify({intake:{usecase,naam:usecase,object:usecase==='productlater'?'product':'vraag of aanbod',actor:usecase==='productlater'?'agent':'persoon, bedrijf of agent',concreet:true,criteria:[{id,label,groep,nodig:true,hard:true,prioriteit:9,vraag,pills,waarom:'Dit bepaalt welk aanbod past.'}]},feiten:[],zeg:'',vraag:beurt===1?vraag:'',veld:id,sleutel:id,pills:beurt===1?pills:[],klaar:beurt>1,kaart:{richting:usecase==='ruimteaanbod'?'heeft':'zoekt',soort:usecase,titel:'Een concrete vraag',zoekt:verhaal,biedt:usecase==='ruimteaanbod'?verhaal:'',waarde:'klein'}})}};
  let r=await gwStap(kv,{tekst:verhaal,proef:true},req,{ai,universeel:true});
  check(usecase+': een nieuw criterium werkt zonder branchecode',()=>{assert.equal(r.vraag,vraag);assert.equal(r.usecase,usecase);assert.equal(r.labels[id],label);assert.equal(r.kwaliteit.gereed,false);assert.ok(!r.kaart.waar);});
  const sid=r.sid;r=await gwStap(kv,{sid,keuze:[pills[0]]},req,{ai,universeel:true});
  check(usecase+': antwoord, bewijs en kaart blijven bij elkaar',()=>{assert.ok(r.klaar);assert.ok(r.kwaliteit.gereed);assert.equal(r.kaart.criteria[0].waarde,pills[0]);assert.equal(r.kaart.criteria[0].label,label);});
  if(usecase==='productlater')product={kv,sid,r};
}

let s={stappen:[{wie:'bezoeker',zei:'De datum is flexibel.'}],kaart:{richting:'zoekt'},feiten:{},gevraagd:[]};
intakeBij(s,{intake:{usecase:'nieuwe-toepassing',criteria:[{id:'leverdatum',label:'Leverdatum',groep:'termijn',nodig:true,hard:true,vraag:'Wanneer?',pills:['Nu','Later']},{id:'constructor',label:'Fout',nodig:true}]}},'De datum is flexibel.');
check('prototypevelden zijn geen criterium',()=>assert.ok(!veldMag(s,'constructor')));
intakeBij(s,{intake:{usecase:'nieuwe-toepassing',criteria:[{id:'leverdatum',label:'Leverdatum',groep:'termijn',nodig:false,hard:false}]}},'Iets anders');
check('een noodzakelijke harde voorwaarde verdwijnt niet zonder bewijs',()=>{assert.ok(s.intake.criteria.leverdatum.nodig);assert.ok(s.intake.criteria.leverdatum.hard);});
intakeBij(s,{intake:{usecase:'nieuwe-toepassing',criteria:[{id:'leverdatum',label:'Leverdatum',groep:'termijn',nodig:false,hard:false,bewijs_wijziging:'datum is flexibel'}]}},'De datum is flexibel.');
check('expliciet flexibele datum mag de eis versoepelen',()=>{assert.ok(!s.intake.criteria.leverdatum.nodig);assert.ok(!s.intake.criteria.leverdatum.hard);});
intakeBij(s,{intake:{usecase:'nieuwe-toepassing',criteria:[{id:'onbekende_specificatie',label:'Specificatie',groep:'inhoud',nodig:true,hard:true,vraag:'Welke?',pills:['A','B']}]}},'');s.onbekend=['onbekende_specificatie'];
check('onbekend is geen bewezen harde productspecificatie',()=>assert.ok(benodigdeCriteria(s).some(x=>x.id==='onbekende_specificatie')));
feitenBij(s,'De datum is flexibel.',{feiten:[{veld:'onbekende_specificatie',bewijs:'Specificatie ABC'}]});
check('een nieuwe soort criterium mag geen feit verzinnen',()=>assert.ok(!s.feiten.onbekende_specificatie));

const leerKv=geheugen();for(let i=0;i<20;i++)await telVraag(leerKv,{id:'uniekevraag',groep:'zelfde-soort',usecase:'een-andere-vraag',vaardigheid:'termijn'},'antwoord');
const lessen=await uitkomstLessen(leerKv,'nog-nooit-gezien',['nieuwe_dimensie']);
check('een nieuwe usecase kan leren van dezelfde soort beslisinformatie',()=>assert.equal(lessen.overdraagbaar.find(x=>x.groep==='termijn').antwoord,20));
check('de overdraagbare les bevat geen tekst van een ander gesprek',()=>assert.ok(!JSON.stringify(lessen).includes('De datum is flexibel')));

const {kv,sid}=product;assert.ok((await gwStap(kv,{sid,actie:'controle'},req)).ok);const bewaard=await gwStap(kv,{sid,actie:'kies',keuze:'uitzetten'},req),u=new URL(bewaard.link,'https://sealedintent.com'),i=u.searchParams.get('i'),sleutel=u.searchParams.get('s');
assert.ok(!(await agentActie(kv,{actie:'uitnodiging',i,s:'fout'})).ok);
const uitnodiging=await agentActie(kv,{actie:'uitnodiging',i,s:sleutel});
check('alleen de eigenaar kan een uitnodiging voor zijn bevestigde kaart maken',()=>{assert.ok(uitnodiging.ok);assert.match(uitnodiging.token,/^[a-f0-9]{48}$/);});
const lees=await agentActie(kv,{actie:'lees',token:uitnodiging.token});
check('de agent leest de specificaties zonder eigenaarsleutel of contactgegevens',()=>{assert.ok(lees.ok);assert.equal(lees.vraag.criteria[0].waarde,'USB-C');assert.ok(!JSON.stringify(lees).includes(sleutel));assert.ok(!JSON.stringify(lees).includes('sHash'));});
assert.ok(!(await agentActie(kv,{actie:'lees',token:'0'.repeat(48)})).ok);
const later=new Date(Date.now()+90*864e5).toISOString().slice(0,10),voorstel={actie:'antwoord',token:uitnodiging.token,requestId:'eerste-voorstel',actor:'agent',omschrijving:'200 USB-C docks, geschikt voor de opgegeven aansluiting',aantal:200,prijs:15000,munt:'EUR',leverdatum:later,voorwaarden:['Levering op het afgesproken moment'],antwoorden:{aansluiting:'USB-C',onbekend_veld:'mag niet mee'}};
const reactie=await agentActie(kv,voorstel),nogeens=await agentActie(kv,voorstel);
check('een agent kan nu een voorstel voor levering over drie maanden indienen',()=>{assert.ok(reactie.ok);assert.equal(reactie.status,'te_beoordelen');assert.ok(later>uitnodiging.tot.slice(0,10));});
check('herhalen van hetzelfde agentverzoek maakt geen dubbele reactie',()=>{assert.equal(reactie.id,nogeens.id);assert.ok(nogeens.opnieuw);});
let rr=await reacties(kv,i);check('prijs, aantal, leverdatum en antwoorden blijven bij het voorstel',()=>{assert.equal(rr.length,1);assert.equal(rr[0].aantal,200);assert.equal(rr[0].prijs,15000);assert.equal(rr[0].leverdatum,later);assert.equal(rr[0].antwoorden.aansluiting,'USB-C');assert.ok(!rr[0].antwoorden.onbekend_veld);});
check('een voorstel is geen geverifieerd mandaat, match, levering of bestelling',()=>{assert.equal(rr[0].mandaat,'niet geverifieerd');assert.equal(rr[0].status,'te_beoordelen');assert.ok(!kv.H.get('gw:kwaliteit'));});
assert.ok(!(await agentActie(kv,{...voorstel,requestId:'negatieve-prijs',prijs:-1})).ok);
assert.ok(!(await agentActie(kv,{...voorstel,requestId:'ongeldige-datum',leverdatum:'2030-02-31'})).ok);
check('ongeldige bedragen en onmogelijke kalenderdatums worden geweigerd',()=>{});
const verlopen=await agentActie(kv,{actie:'uitnodiging',i,s:sleutel});await kv.set('gw:agent:'+createHash('sha256').update(verlopen.token).digest('hex'),{i,tot:'2020-01-01T00:00:00Z'});assert.ok(!(await agentActie(kv,{actie:'lees',token:verlopen.token})).ok);
check('een verlopen uitnodiging geeft geen toegang',()=>{});
const kaart=await gwKaart(kv,i,sleutel);const html=gwStatusPagina('nl',kaart);
check('de privékaart toont het agentvoorstel en de uitnodiging',()=>{assert.match(html,/200 USB-C docks/);assert.match(html,/Laat een agent reageren/);assert.match(html,/USB-C/);});
const dir=mkdtempSync(join(tmpdir(),'sealed-universeel-'));for(const [naam,pagina]of[['status',html],['agent',agentPagina()]]){let nr=0;for(const m of pagina.matchAll(/<script>([\s\S]*?)<\/script>/g)){const f=join(dir,naam+(nr++)+'.js');writeFileSync(f,m[1]);execFileSync(process.execPath,['--check',f]);}assert.ok(nr);}
check('browsercode voor uitnodigen en reageren compileert',()=>{});
await gwTrek(kv,i,sleutel);assert.ok(!(await agentActie(kv,{actie:'lees',token:uitnodiging.token})).ok);assert.ok(!(await agentActie(kv,{...voorstel,requestId:'na-intrekken'})).ok);
check('intrekken stopt ook bestaande agentuitnodigingen en reacties',()=>{});
check('technische proeven vervuilen de echte usecaselijst niet',()=>{});assert.equal((await leerOverzicht(kv)).usecases.length,0);
console.log(n+' universele controles geslaagd');
