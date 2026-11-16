// Resolve explicit project sitemaps. Failure never replaces inspection history with a false zero.
export function inSiteScope(value,site){try{const u=new URL(value),p=String(site.pathPrefix||'').replace(/\/$/,'');return /^https?:$/.test(u.protocol)&&u.hostname===site.host&&(!p||u.pathname===p||u.pathname.startsWith(p+'/'));}catch{return false;}}
export async function sitemapTargets(site,fetcher=fetch){
 const root=site.sitemap||'https://'+site.host+'/sitemap.xml',seen=new Set(),pages=new Set();let requests=0;
 async function visit(address,depth=0){
  const u=new URL(address);if(u.hostname!==site.host||!/^https?:$/.test(u.protocol))throw Error('sitemap outside project host');if(seen.has(u.href))return;seen.add(u.href);
  if(depth>3||++requests>24)throw Error('sitemap traversal limit');
  const r=await fetcher(u.href,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('sitemap HTTP '+r.status);
  const xml=await r.text();if(!/<(?:urlset|sitemapindex)(?:\s|>)/i.test(xml))throw Error('response is not a sitemap');
  const locations=[...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(m=>m[1].replace(/&amp;/g,'&'));
  if(/<sitemapindex(?:\s|>)/i.test(xml)){for(const next of locations)await visit(next,depth+1);}
  else for(const value of locations)if(inSiteScope(value,site)&&!new URL(value).pathname.endsWith('.xml'))pages.add(value);
 }
 await visit(root);if(!pages.size)throw Error('sitemap contains no project URLs');return{sitemap:root,urls:[...pages]};
}

