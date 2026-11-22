import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {sitemapTargets,inSiteScope} from '../lib/gsc-sitemap.js';

const site={host:'keuzehulp.best',pathPrefix:'/chirurgie',sitemap:'https://keuzehulp.best/chirurgie/sitemap.xml'};
const urls=Array.from({length:81},(_,i)=>'https://keuzehulp.best/chirurgie/page-'+i),xml='<urlset>'+[...urls,'https://keuzehulp.best/curacao/nl','https://keuzehulp.best/chirurgie-other','https://evil.example/chirurgie/x'].map(u=>'<url><loc>'+u+'</loc></url>').join('')+'</urlset>';
const response=text=>({ok:true,status:200,text:async()=>text});let requested=[];
const result=await sitemapTargets(site,async u=>{requested.push(u);return response(xml)});assert.equal(result.urls.length,81);assert.deepEqual(requested,[site.sitemap]);assert.ok(inSiteScope('https://keuzehulp.best/chirurgie',site));assert.ok(!inSiteScope('https://keuzehulp.best/chirurgie-old',site));
const nested=await sitemapTargets({...site,sitemap:'https://keuzehulp.best/sitemap.xml'},async u=>response(u.endsWith('/sitemap.xml')&&!u.includes('/chirurgie/')?'<sitemapindex><sitemap><loc>'+site.sitemap+'</loc></sitemap></sitemapindex>':xml));assert.equal(nested.urls.length,81);
for(const text of ['<html>login</html>','<urlset></urlset>','<sitemapindex><sitemap><loc>https://evil.example/map.xml</loc></sitemap></sitemapindex>'])await assert.rejects(()=>sitemapTargets(site,async()=>response(text)));
await assert.rejects(()=>sitemapTargets(site,async()=>({ok:false,status:503})));

const zicht=readFileSync(new URL('../lib/zicht.js',import.meta.url),'utf8');
const gsc=readFileSync(new URL('../fn/gsc.js',import.meta.url),'utf8');
const kz=readFileSync(new URL('../fn/kz.js',import.meta.url),'utf8');
const voorkant=readFileSync(new URL('../lib/cadeauvinder.js',import.meta.url),'utf8');
assert.match(zicht,/P2\('surgery', 'keuzehulp\.best'[\s\S]{0,500}pathPrefix: '\/chirurgie'[\s\S]{0,300}sitemap: 'https:\/\/keuzehulp\.best\/chirurgie\/sitemap\.xml'/);
assert.doesNotMatch(zicht,/P2\('surgery', 'todayin\.email'/);
assert.match(zicht,/canonicalExperimentUrl[\s\S]{0,300}keuzehulp\.best\/chirurgie/);
assert.match(gsc,/op === 'surgery'[\s\S]{0,800}propFor\(l, 'keuzehulp\.best'\)[\s\S]{0,800}https:\/\/keuzehulp\.best\/chirurgie\/sitemap\.xml/);
assert.doesNotMatch(gsc,/op === 'surgery'[\s\S]{0,500}propFor\(l, 'todayin\.email'\)/);
assert.match(kz,/rows\.push\(\['\/chirurgie\/nl', '2026-11-19'\]/);
assert.match(kz,/ovRegel\('\/chirurgie\/nl', 'Medische ingrepen en tandheelkunde: kosten, klinieken en broncontrole'\)/);
assert.match(kz,/<a href="\/chirurgie\/nl">Medische ingrepen en tandheelkunde: kosten, klinieken en broncontrole/);
assert.match(voorkant,/\['\/chirurgie\/nl', 'Kosten van een ingreep, ook in het buitenland'\]/);
console.log('ok scoped chirurgie sitemap, canonical ZICHT/GSC scope, root-urlset and visible homepage discovery');
