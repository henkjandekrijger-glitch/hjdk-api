import assert from 'node:assert/strict';
import {sitemapTargets,inSiteScope} from '../lib/gsc-sitemap.js';
const site={host:'todayin.email',pathPrefix:'/surgery',sitemap:'https://todayin.email/surgery/sitemap.xml'};
const urls=Array.from({length:81},(_,i)=>'https://todayin.email/surgery/page-'+i),xml='<urlset>'+[...urls,'https://todayin.email/curacao/nl','https://todayin.email/surgery-other','https://evil.example/surgery/x'].map(u=>'<url><loc>'+u+'</loc></url>').join('')+'</urlset>';
const response=text=>({ok:true,status:200,text:async()=>text});let requested=[];
const result=await sitemapTargets(site,async u=>{requested.push(u);return response(xml)});assert.equal(result.urls.length,81);assert.deepEqual(requested,[site.sitemap]);assert.ok(inSiteScope('https://todayin.email/surgery',site));assert.ok(!inSiteScope('https://todayin.email/surgery-old',site));
const nested=await sitemapTargets({...site,sitemap:'https://todayin.email/sitemap.xml'},async u=>response(u.endsWith('/sitemap.xml')&&!u.includes('/surgery/')?'<sitemapindex><sitemap><loc>'+site.sitemap+'</loc></sitemap></sitemapindex>':xml));assert.equal(nested.urls.length,81);
for(const text of ['<html>login</html>','<urlset></urlset>','<sitemapindex><sitemap><loc>https://evil.example/map.xml</loc></sitemap></sitemapindex>'])await assert.rejects(()=>sitemapTargets(site,async()=>response(text)));
await assert.rejects(()=>sitemapTargets(site,async()=>({ok:false,status:503})));console.log('ok explicit scoped sitemap, 81 URLs, recursive index, sibling/foreign exclusion, invalid/empty/failing sources reject without a false zero');
