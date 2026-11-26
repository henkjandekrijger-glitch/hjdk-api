import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const meetUrl = new URL('../lib/bsmeet.js', import.meta.url).href;
const source = (await readFile(new URL('../lib/bsorganisch.js', import.meta.url), 'utf8'))
 .replace("import { telegram } from './dagoverzicht.js';", 'const telegram = async () => { throw new Error("Telegram forbidden"); };')
 .replace("'./bsmeet.js'", JSON.stringify(meetUrl));
const { rapportData } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const now = new Date('2026-11-27T00:00:00.001Z');
function fixture(overrides = {}, failure = null) {
 const hashes = { 'bs:tel:2026-11-26': ['bs|pinterest','3','bs|google','2','bs|p|/', '5','bs|p|/private-person','20','lc|direct','0'], 'bs:tel:2026-11-25': ['bs|direct','13'], 'bs:klik:2026-11-26':['BOOK','23'], 'bs:gosrc:2026-11-26':['bs|pinterest','2'], ...overrides };
 return { get: async () => [{ slug:'live-guide',status:'live' },{ slug:'secret-draft',status:'concept' }], raw: async ([op,k]) => { if(failure===k) throw new Error('secret internal error'); if(op==='HGETALL')return hashes[k]??[]; if(op==='HGET')return null; throw new Error('writes forbidden: '+op); }, set: async()=>{throw new Error('write forbidden')},del:async()=>{throw new Error('write forbidden')} };
}
test('closed UTC day, source buckets and explicit zeros remain distinct', async()=>{
 const r=await rapportData(fixture(),{nu:now});assert.equal(r.dag.meetdag,'2026-11-26');assert.equal(r.vorige.meetdag,'2026-11-25');
 assert.deepEqual(r.dag.site.bs.perBron,{pinterest:3,google:2});assert.equal(r.dag.site.bs.paginaOpeningen,5);assert.equal(r.dag.site.bs.organischeOpeningen,5);
 assert.equal(r.dag.site.lc.paginaOpeningen,0);assert.equal(r.dag.site.lc.amazonVerzoeken,null);assert.equal(r.dag.pdfVerkoop,null);
 assert.equal(r.dag.amazonVerzoeken,23);assert.equal(r.dag.site.bs.amazonVerzoeken,2);
 assert.equal(r.dag.meetperiode.totExclusief,'2026-11-27T00:00:00.000Z');
});
test('missing, read error and malformed data are unknown, not zero',async()=>{
 for(const [o,f,status] of [[{'bs:tel:2026-11-26':[]},null,'ontbreekt'],[{},'bs:tel:2026-11-26','leesfout'],[{'bs:tel:2026-11-26':['bs|direct','NaN']},null,'ongeldig'],[{'bs:tel:2026-11-26':['bs|direct',true]},null,'ongeldig']]){
  const r=await rapportData(fixture(o,f),{nu:now});assert.equal(r.dag.leesstatus['bs:tel:2026-11-26'],status);assert.equal(r.dag.site.bs.paginaOpeningen,null);assert.equal(r.dag.site.bs.perBron,null);assert.doesNotMatch(JSON.stringify(r),/secret internal error/);
 }
});
test('unknown site/source, free paths and draft pages are never disclosed',async()=>{
 const r=await rapportData(fixture({'bs:tel:2026-11-26':['bs|direct','4','bs|private-source-name','8','unrelated|direct','9','bs|p|/private-person','10','bs|p|/','4']}),{nu:now});
 assert.equal(r.dag.site.bs.paginaOpeningen,4);assert.deepEqual(r.dag.site.bs.paginas,[{pad:'/',openingen:4}]);
 assert.doesNotMatch(JSON.stringify(r),/private-person|private-source-name|unrelated/);
});
const routeSource=await readFile(new URL('../fn/bs.js',import.meta.url),'utf8');
const start=routeSource.indexOf("  if (op === 'dagrapport') {");
const end=routeSource.indexOf('  // Pinbeeld',start);
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const route=new AsyncFunction('op','req','res','q','kv','beschermd','rapportData','SLUGS','stuur','fetch','indexNow','dagRapport',routeSource.slice(start,end));
const fail=async()=>{throw new Error('side effect forbidden')};
async function run(url,allowed=true){
 const response={};const stuur=(res,status,type,body)=>Object.assign(res,{status,type,body:JSON.parse(body)});
 await route('dagrapport',{headers:{}},response,new URL(url).searchParams,fixture(),()=>allowed,rapportData,[''],stuur,fail,fail,fail);
 return response;
}
test('actual handler dry JSON branch sends no Telegram/provider/indexNow or storage writes',async()=>{
 const r=await run('https://example.test/?droog=1&vorm=json');assert.equal(r.status,200);assert.equal(r.body.droog,true);
 assert.doesNotMatch(JSON.stringify(r),/secret-draft|private-person/);
});
test('structured data branch retains existing authorization guard',async()=>{
 const r=await run('https://example.test/?droog=1&vorm=json',false);assert.equal(r.status,403);
});
