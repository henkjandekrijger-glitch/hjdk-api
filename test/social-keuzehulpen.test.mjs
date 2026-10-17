import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const source=await fs.readFile(new URL('../lib/social-keuzehulpen.js',import.meta.url),'utf8');
const pure=source.replace(/^import .*;\n/gm,'');
const {pinConcept,pinCsv,pinImageTree}=await import('data:text/javascript;base64,'+Buffer.from(pure).toString('base64'));
const item={slug:'airfryer',title:'Welke airfryer past in jouw keuken?',kort:'Vergelijk de inhoud en de buitenmaten.',cat:'Keuken',questions:[{q:'Voor hoeveel mensen kook je?',options:[{label:'Eén of twee'},{label:'Drie of vier'},{label:'Meer dan vier'}]}]};
for(const market of ['nl','us','de']){
 const pins=[0,1,2].map(v=>pinConcept(item,market,v));
 assert.equal(new Set(pins.map(p=>p.id)).size,3);
 assert.equal(new Set(pins.map(p=>p.headline)).size,3);
 assert.equal(new Set(pins.map(p=>p.image)).size,3);
 for(const p of pins){assert.ok(p.title.length<=100);assert.ok(p.description.length<=500);assert.equal(p.status,'draft-not-published');assert.equal(new URL(p.target).searchParams.get('utm_source'),'pinterest');assert.ok(new URL(p.target).hostname===new URL(p.image).hostname);assert.equal(pinImageTree(p).props.style.width,'100%');}
 assert.ok(pins[1].bullets.includes('Eén of twee'));
 assert.deepEqual(pins.map(p=>p.proposedDayOffset),[0,7,21]);
 const csv=pinCsv(pins);assert.ok(csv.startsWith('\ufeff"Title","Media URL","Pinterest board"'));assert.equal(csv.split('\r\n').length,4);assert.ok(csv.includes('"","Welke airfryer'));
}
assert.equal(pinConcept(item,'nl',1.6).variant,1);
assert.throws(()=>pinConcept(item,'fr'));
const noQuestions=pinConcept({...item,questions:[]},'de',1);assert.ok(noQuestions.bullets.length);
const escaped=pinCsv([{title:'a "quoted" title',image:'https://example.com/a.png',board:'board',description:'safe',target:'https://example.com/',name:'name'}]);assert.ok(escaped.includes('a ""quoted"" title'));
console.log('PASS: three distinct concepts per guide and market, local destination/UTM, length limits, draft status, offsets, stable image IDs, CSV columns/escaping, image tree and fallback content');
