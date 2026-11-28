// Open intakecontract: criteria komen uit het gesprek, niet uit een eindige lijst branches.
// Definities zijn een vraagplan; bezoekersfeiten vereisen elders nog steeds letterlijk bewijs.
export const GROEPEN = ['situatie', 'doel', 'onderwerp', 'werk', 'inhoud', 'omvang', 'regio', 'termijn', 'budget', 'eisen', 'uitsluitingen', 'fase'];
const norm = v => String(v || '').toLowerCase().normalize('NFKD').replace(/ß/g,'ss').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const schoon = (v,n=160) => String(v || '').replace(/[^\s@]+@[^\s@]+\.[a-z]{2,}/gi,'[verborgen]').replace(/https?:\/\/\S+/gi,'[link]').slice(0,n).trim();
const idVan = v => {const id=String(v||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,36);return /^[a-z][a-z0-9_-]*$/.test(id)&&!['constructor','prototype','__proto__'].includes(id)?id:'';};
export function veldMag(s, veld) { return GROEPEN.includes(veld) || Object.hasOwn(s.intake?.criteria||{},veld); }

export function intakeBij(s, j, antwoord = '') {
  const b=j?.intake; if (!b || typeof b !== 'object' || !Array.isArray(b.criteria)) return false;
  const usecase=idVan(b.usecase)||s.intake?.usecase||'vraag-verhelderen';
  const oud=s.intake||{criteria:{}}, criteria={...oud.criteria};
  for(const c of b.criteria.slice(0,8)){
    const id=idVan(c.id),label=schoon(c.label,65); if(!id||!label)continue;
    const groep=GROEPEN.includes(c.groep)?c.groep:'eisen',pills=[...new Set((Array.isArray(c.pills)?c.pills:[]).map(x=>schoon(x,52)).filter(Boolean))].slice(0,6);
    const eerder=criteria[id],bewijs=schoon(c.bewijs_wijziging,300),wijzig=bewijs.length>=3&&norm(antwoord).includes(norm(bewijs));
    // Een voorwaarde verdwijnt niet stil zodra de volgende vraag makkelijker is.
    const nodig=eerder?.nodig&&c.nodig===false&&!wijzig?true:c.nodig!==false;
    criteria[id]={id,label,groep:eerder&&eerder.groep!==groep&&!wijzig?eerder.groep:groep,nodig,hard:eerder?.hard&&c.hard===false&&!wijzig?true:c.hard===true,prioriteit:Math.max(1,Math.min(10,Number(c.prioriteit)||5)),vraag:schoon(c.vraag,200),pills,meer:c.meer===true,waarom:schoon(c.waarom,160)};
  }
  s.intake={versie:1,usecase,naam:schoon(b.naam,70)||usecase,object:schoon(b.object,50),actor:schoon(b.actor,50),criteria};
  // Een volledig, concreet verhaal is zelf het onderwerp. Geen extra categoriekeuze eisen
  // omdat de AI dezelfde betekenis anders benoemt (bijvoorbeeld Lagerplatz versus fulfilment).
  if(!s.feiten?.onderwerp&&b.concreet===true){
    const tekst=(s.stappen||[]).filter(x=>x.wie==='bezoeker').map(x=>x.zei).find(x=>x.length>=60&&!/^(weet ik|not sure|weiß ich)/i.test(x));
    if(tekst){s.feiten=s.feiten||{};s.feiten.onderwerp={waarde:schoon(tekst,300),bewijs:schoon(tekst,300)};}
  }
  return true;
}

export function benodigdeCriteria(s){
  if(!s.intake)return[];
  return Object.values(s.intake.criteria||{}).filter(c=>c.nodig&&!s.feiten?.[c.id]&&(!(s.onbekend||[]).includes(c.id)||c.hard)).sort((a,b)=>b.prioriteit-a.prioriteit);
}
export function universeelPlan(s, basis=[]){
  const mist=benodigdeCriteria(s).map(c=>c.id),bekend=Object.keys(s.feiten||{}),gevraagd=s.gevraagd||[];
  const lijst=[...new Set([...basis,...mist,...Object.values(s.intake?.criteria||{}).filter(c=>c.nodig).map(c=>c.id)])];
  return lijst.filter(f=>!bekend.includes(f)&&!gevraagd.includes(f)&&(!(s.onbekend||[]).includes(f)||s.intake?.criteria?.[f]?.hard));
}
export function universeelHerstel(s){
  const c=benodigdeCriteria(s).find(c=>!(s.gevraagd||[]).includes(c.id)&&c.vraag.includes('?')&&c.pills.length>=2);
  return c?{vraag:c.vraag,pills:c.pills,sleutel:c.id,veld:c.id,meer:c.meer,klaar:false,waarom:c.waarom}:null;
}
export const veldLabels=s=>Object.fromEntries(Object.values(s.intake?.criteria||{}).map(c=>[c.id,c.label]));
export const veldGroep=(s,id)=>s.intake?.criteria?.[id]?.groep||(GROEPEN.includes(id)?id:'eisen');
export function criteriaRijen(s){return Object.values(s.intake?.criteria||{}).filter(c=>!GROEPEN.includes(c.id)).map(c=>({id:c.id,label:c.label,waarde:s.feiten?.[c.id]?.waarde||'',onbekend:(s.onbekend||[]).includes(c.id),nodig:c.nodig})).filter(c=>c.waarde||c.onbekend);}

export async function registreerUsecase(kv,s){
  if(s.proef||!s.intake)return;
  const k='gw:uc:'+s.intake.usecase,oud=await kv.get(k).catch(()=>null);
  await kv.set(k,{id:s.intake.usecase,naam:s.intake.naam,object:s.intake.object,actor:s.intake.actor,criteria:Object.values(s.intake.criteria).map(c=>({id:c.id,label:c.label,groep:c.groep,nodig:c.nodig})),at:new Date().toISOString()},{ex:120*86400});
  if(!oud){await kv.raw(['LPUSH','gw:usecases',s.intake.usecase]);await kv.raw(['LTRIM','gw:usecases',0,999]);}
}
export async function leerOverzicht(kv){
  const ids=[...new Set(await kv.raw(['LRANGE','gw:usecases',0,24]).catch(()=>[]))],usecases=[];
  for(const id of ids){const x=await kv.get('gw:uc:'+id).catch(()=>null);if(!x)continue;const r=await kv.raw(['HGETALL','gw:uc:'+id+':tel']).catch(()=>[]),telling={};for(let i=0;i<r.length;i+=2)telling[r[i]]=Number(r[i+1])||0;usecases.push({...x,telling});}
  return {usecases,regel:'Elke nieuwe usecase krijgt eigen criteria en uitkomsten; alleen geaggregeerde patronen worden gedeeld, geen gesprekken of persoonlijke gegevens.'};
}
