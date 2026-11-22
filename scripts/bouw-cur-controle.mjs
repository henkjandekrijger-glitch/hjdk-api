import fs from 'node:fs';
import { vindBedrijf, normaliseerBedrijf, controleRecords, eigenSite, bronDatum } from '../lib/curdata.js';
const today='2026-11-22', rows=JSON.parse(fs.readFileSync('source/current-directory.json')).items;
const proofs=JSON.parse(fs.readFileSync('data/cur/bedrijf-broncorrecties.json'));
const files=fs.readdirSync('data/cur').filter(f=>f.endsWith('.json')&&!/^(bedrijf|controle|gidsnamen|ux-uitdagers)/.test(f));
const guides=files.map(f=>({...JSON.parse(fs.readFileSync('data/cur/'+f)),id:f.replace('.json','')})).filter(d=>Array.isArray(d.items));
const hotels=guides.find(x=>x.id==='hotels'), strand=guides.find(x=>x.id==='stranden');
guides.push({id:'allinclusive',items:hotels.items.filter(x=>(x.tags||[]).includes('all-inclusive'))},{id:'stranden-locals',items:strand.items});
guides.push({id:'autohuur',items:JSON.parse(fs.readFileSync('data/autohuur-curacao.json')).verhuurders});
const map={datum:today,koppelingen:{},perZaak:{},reviews:{}}, open=[], conflicts=[];
let count=0,linked=0,dates=0;
for(const d of guides){const k=map.koppelingen[d.id]={};for(const v of d.items){if(!v.naam)continue;count++;const found=vindBedrijf(v,rows),x=found.zaak;if(!x){open.push({gids:d.id,id:v.id,naam:v.naam,reden:found.reden,kandidaten:found.kandidaten||[]});continue;}linked++;const key=x.cs+'/'+x.slug;k[v.id]={cs:x.cs,slug:x.slug,place_id:x.place_id||null,cid:x.cid||null,reden:found.reden};(map.perZaak[key]??=[]).push({gids:d.id,id:v.id});
for(const s of v.scores||[]){if(!(s.score>0&&s.aantal>0))continue;let q={...s};const plat=String(q.platform).toLowerCase().replace(/ maps$/,'');if(plat==='google'&&eigenSite(q.bron)){if(q.score===x.score&&q.aantal===x.aantal){q={...q,geimporteerdOp:q.peildatum,peildatum:bronDatum(x),bron:x.place_id?'https://www.google.com/maps/place/?q=place_id:'+x.place_id:q.bron};dates++;}else{conflicts.push({gids:d.id,id:v.id,platform:'Google',keuzehulp:[q.score,q.aantal],gids:[x.score,x.aantal]});continue;}}
const old=(map.reviews[key]??={})[plat];if(!old||String(q.peildatum||'')>String(old.peildatum||'')||(q.peildatum===old.peildatum&&q.aantal>old.aantal))map.reviews[key][plat]=q;}
}}
const report={datum:today,bron:'Demand Radar: alle 13 opgeslagen bronpagina’s; geen nieuwe externe bedrijfscontrole',...controleRecords(rows,today),categorieen:new Set(rows.map(x=>x.cs)).size,gidsen:guides.length,gidsItems:count,gekoppeld:linked,nietGekoppeld:open.length,zelfverwijzendeReviewdatumsHersteld:dates,officieelGecontroleerd:Object.keys(proofs).length,nieuwsteBron:rows.map(bronDatum).filter(Boolean).sort().at(-1),oudsteBron:rows.map(bronDatum).filter(Boolean).sort()[0],open,scoreconflicten:conflicts};
fs.writeFileSync('data/cur/bedrijf-koppelingen.json',JSON.stringify(map,null,2)+'\n');fs.writeFileSync('data/cur/bedrijf-controle.json',JSON.stringify(report,null,2)+'\n');
const {open:_,scoreconflicten:__,...short}=report;console.log(JSON.stringify({...short,scoreconflicten:conflicts.length},null,2));
