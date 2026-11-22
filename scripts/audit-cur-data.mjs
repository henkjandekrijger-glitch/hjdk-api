import fs from 'node:fs';
import path from 'node:path';
const today='2026-11-22';
const pages=fs.readdirSync('source').filter(x=>/^listings-\d+\.json$/.test(x)).sort((a,b)=>parseInt(a.match(/\d+/)[0])-parseInt(b.match(/\d+/)[0])).map(x=>JSON.parse(fs.readFileSync('source/'+x)));
const all=pages.flatMap(x=>x.page?.items||[]), rows=all.filter(x=>x.naam&&(x.land==='CW'||(!x.land&&x.lat>11.95&&x.lat<12.45&&x.lng>-69.2&&x.lng<-68.7)));
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' en ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70).replace(/-+$/,'');
const bayes=x=>x.score?(x.score*x.aantal+40)/(x.aantal+10):0;
const cats={}; for(const x of rows){const cs=slug(x.cat)||'other';(cats[cs]??=[]).push({...x,cs});}
for(const items of Object.values(cats)){const used=new Set();items.sort((a,b)=>bayes(b)-bayes(a)||(b.aantal-a.aantal)||a.naam.localeCompare(b.naam));for(const x of items){let sl=slug(x.naam)||'bedrijf';if(used.has(sl)){let i=2;while(used.has(sl+'-'+i))i++;sl+='-'+i;}used.add(sl);x.slug=sl;}}
const built=Object.values(cats).flat();fs.writeFileSync('source/current-directory.json',JSON.stringify({at:'2026-10-22',items:built,cats:Object.fromEntries(Object.entries(cats).map(([k,v])=>[k,v.length]))}));
const guideFiles=fs.readdirSync('data/cur').filter(f=>f.endsWith('.json'));const guides=guideFiles.map(f=>({file:f,...JSON.parse(fs.readFileSync('data/cur/'+f))})).filter(x=>Array.isArray(x.items)&&x.id);
const report={vandaag:today,raw:all.length,cw:built.length,categorieen:Object.keys(cats).length,gidsen:guides.length,gidsItems:guides.reduce((s,g)=>s+g.items.length,0),datums:{},status:{},dubbeleNamen:[],uren:[],kleineletters:0,hoofdletters:0};
for(const x of built){const d=String(x.bijgewerkt||'').slice(0,10);report.datums[d]=(report.datums[d]||0)+1;report.status[x.status||'onbekend']=(report.status[x.status||'onbekend']||0)+1;const letters=x.naam.replace(/[^\p{L}]/gu,'');if(letters.length>2&&letters===letters.toLowerCase())report.kleineletters++;if(letters.length>3&&letters===letters.toUpperCase())report.hoofdletters++;if(Object.values(x.uren||{}).some(v=>/24:00|00:00-00:00/.test(v)))report.uren.push({cs:x.cs,slug:x.slug,naam:x.naam,bijgewerkt:x.bijgewerkt});}
const grouped={};for(const x of built)(grouped[slug(x.naam)]??=[]).push(x);report.dubbeleNamen=Object.values(grouped).filter(xs=>xs.length>1).map(xs=>xs.map(x=>({naam:x.naam,cs:x.cs,slug:x.slug,place_id:x.place_id,adres:x.adres})));
fs.writeFileSync('source/audit-baseline.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,datums:{nieuwste:Object.keys(report.datums).sort().at(-1),oudste:Object.keys(report.datums).sort()[0]},uren:report.uren.length,dubbeleNamen:report.dubbeleNamen.length},null,2));
