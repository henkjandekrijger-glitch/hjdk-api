import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const src = await fs.readFile(new URL('../lib/koop-front.js', import.meta.url), 'utf8');
const front = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const catalog = [
  {slug:'airfryer',title:'Airfryer voor kleine keuken',term:'airfryer',cat:'Keuken',kort:'Vergelijk inhoud en afmetingen.'},
  {slug:'robotstofzuiger',title:'Robotstofzuiger voor dierenharen',term:'robotstofzuiger',cat:'Wonen',kort:'Kies zuigkracht voor dierenharen.'},
  {slug:'fietsmaat',title:'Fietsmaat berekenen',term:'fiets',cat:'Fietsen',kort:'Meet de binnenbeenlengte.'},
  {slug:'evil',title:'</script><img src=x onerror=alert(1)>',cat:'<x>',kort:'<script>alert(1)</script>'}
];
assert.equal(front.rankGuides(catalog,'Waar kan ik een airfryer kopen?')[0].slug,'airfryer');
assert.equal(front.rankGuides(catalog,'Where can I buy an air fryer?')[0].slug,'airfryer');
assert.equal(front.rankGuides(catalog,'Wo kann ich eine Heißluftfritteuse kaufen?')[0].slug,'airfryer');
assert.equal(front.rankGuides(catalog,'Where can I buy headphones?').length,0);
assert.equal(front.rankGuides(catalog,'airfryer','Wonen').length,0);
assert.equal(front.rankGuides(catalog,'', 'Fietsen')[0].slug,'fietsmaat');
assert.throws(()=>front.renderFront('fr',catalog));
for (const market of ['nl','us','de']) {
  const html=front.renderFront(market,catalog);
  const m=front.FRONT_MARKETS[market];
  assert.ok(html.includes('<html lang="'+m.locale+'">'));
  assert.ok(html.includes('rel="canonical" href="https://'+m.host+'/"'));
  for(const mm of Object.values(front.FRONT_MARKETS))assert.ok(html.includes('hreflang="'+mm.locale+'" href="https://'+mm.host+'/"'));
  assert.ok(html.includes('href="/airfryer?via=fp"'));
  assert.ok(html.includes('&lt;/script&gt;&lt;img'));
  assert.ok(!html.includes('<img src=x onerror='));
  let scripts=0;
  for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if(match[1].includes('ld+json')) JSON.parse(match[2]); else if(match[2]) new vm.Script(match[2]);
    scripts++;
  }
  assert.equal(scripts,3);
  if(process.env.FRONT_PREVIEW_DIR) await fs.writeFile(process.env.FRONT_PREVIEW_DIR+'/preview-'+market+'.html',html);
}
const api=await fs.readFile(new URL('../api/ontdek.js',import.meta.url),'utf8');
const testable=api.replace(/^import .*;\n/gm,'');
const mock = 'const kv={raw:async()=>["view","10","variant:a:view","10","variant:a:guide_click","3","slug:airfryer:guide_click","3","slug:airfryer:retailer_click","1"]};const FRONT_MARKETS='+JSON.stringify(front.FRONT_MARKETS)+';const FRONT_VERSION="test";';
const analytics=await import('data:text/javascript;base64,'+Buffer.from(mock+testable).toString('base64'));
assert.equal(analytics.validateEvent({market:'fr',event:'view'}),null);
assert.equal(analytics.validateEvent({market:'nl',event:'delete'}),null);
assert.equal(analytics.validateEvent({market:'nl',event:'view',slug:'../bad'}).slug,'');
assert.equal(analytics.validateEvent({market:'nl',event:'view',source:'secret-query'}).source,'direct');
const report=await analytics.frontReport('nl',1);
assert.equal(report.variants[0].guideClickEventsPerView,.3);
assert.equal(report.top[0].slug,'airfryer');
assert.equal(report.top[0].retailerClicks,1);
new vm.Script(analytics.TRACKER);
console.log('PASS: NL/EN/DE question matching, categories, no-result state, reviewed-locale requirement, SSR links, canonical/hreflang, XSS escaping, JSON-LD, embedded scripts, input validation and funnel report arithmetic.');
