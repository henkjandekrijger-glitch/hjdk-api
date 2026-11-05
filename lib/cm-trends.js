import { createHash } from 'node:crypto';
export const DAY = 86400000;
export const hash = value => createHash('sha256').update(String(value)).digest('hex').slice(0,24);
export const plain = value => String(value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const groups = [
 ['christmas',/\b(kerst\w*|christmas|weihnacht\w*|advent\w*|baubles?|tinsel)\b/i],
 ['sinterklaas',/\b(sinterklaas|schoencadeau\w*|nikolaus)\b/i],
 ['halloween',/\b(halloween|pumpkin|pompoen\w*)\b/i],
 ['light',/\b(lamp\w*|licht\w*|lighting|lantern\w*|lantaarn\w*|candle\w*|kaars\w*)\b/i],
 ['plants',/\b(plant\w*|orchid\w*|orchidee\w*|bloempot\w*|planter\w*|sierpot\w*)\b/i],
 ['vases',/\b(vaas|vazen|vase\w*|bloem\w*|floral|flower\w*)\b/i],
 ['table',/\b(table\w*|tafel\w*|servies|dinnerware|serveer\w*|dining|hosting)\b/i],
 ['craft',/\b(puzz\w*|booknook\w*|book nook|modelbouw\w*|craft\w*|diy|houtbewerking|woodworking)\b/i],
 ['winter',/\b(winter\w*|sokken|socks|alpaca|warm\w*|cozy|cosy|knus\w*)\b/i],
 ['bath',/\b(bath\w*|badkamer\w*|zeep\w*|soap|shav\w*|scheer\w*|scrub\w*)\b/i],
 ['storage',/\b(storage|opberg\w*|basket\w*|mand\w*|declutter\w*)\b/i],
 ['gifts',/\b(gift\w*|cadeau\w*|geschenk\w*)\b/i]
];
export function tags(text) { return groups.filter(([,re])=>re.test(text)).map(([id])=>id); }
export function safeTarget(value) {
 const u = new URL(value);
 if(u.protocol!=='https:' || !['kadoly.com','gids.kadoly.com'].includes(u.hostname) || u.username || u.password || u.port) throw new Error('UNTRUSTED_DESTINATION');
 return u.origin + u.pathname.replace(/\/$/,'');
}
export function inSeason(text, now=Date.now()) {
 const d=new Date(now),m=d.getUTCMonth()+1,day=d.getUTCDate();
 if(/halloween|pompoen|pumpkin/i.test(text) && !(m>=8&&m<=10)) return false;
 if(/sinterklaas|schoencadeau|nikolaus/i.test(text) && !(m>=9&&(m<12||day<=5))) return false;
 if(/kerst|christmas|weihnacht|advent/i.test(text) && !(m>=9&&(m<12||day<=25))) return false;
 return true;
}
export function normalizePinterest(data,region,kind,now=Date.now()) {
 if(!Array.isArray(data?.trends)) throw new Error('PINTEREST_TRENDS_INVALID');
 return data.trends.slice(0,50).flatMap(row=>{
  const keyword=plain(row.keyword).slice(0,180),dates=Object.keys(row.time_series||{}).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)).sort();
  const end=dates.at(-1),dataAt=end?Date.parse(end+'T23:59:59Z'):NaN;
  if(!keyword||!Number.isFinite(dataAt)||dataAt>now+DAY||now-dataAt>10*DAY) return [];
  return [{id:hash('pinterest|'+region+'|'+keyword.toLowerCase()),network:'pinterest',region,keyword,kind,
   observedAt:now,dataAt,source:'https://trends.pinterest.com/detail/?'+new URLSearchParams({country:region,terms:keyword}),
   weekly:Number.isFinite(row.pct_growth_wow)?row.pct_growth_wow:null,monthly:Number.isFinite(row.pct_growth_mom)?row.pct_growth_mom:null,
   yearly:Number.isFinite(row.pct_growth_yoy)?row.pct_growth_yoy:null,signal:'search_growth'}];
 });
}
const field=(xml,name)=>plain(xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'))?.[1]);
export function parseFlipboard(xml,source,now=Date.now()) {
 if(!/^https:\/\/flipboard\.com\/topic\/[a-z]+\.rss$/.test(source)||!/<rss[\s>]/i.test(xml)) throw new Error('FLIPBOARD_FEED_INVALID');
 const rows=[];
 for(const match of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
  const s=match[1],keyword=field(s,'title'),published=Date.parse(field(s,'pubDate')),url=field(s,'link');
  if(!keyword||!Number.isFinite(published)||published>now+3600000||now-published>3*DAY)continue;
  // A recent editorial placement is evidence of a current topic, not search growth or audience size.
  rows.push({id:hash('flipboard|'+url),learningId:hash('flipboard-topic|'+tags(keyword).sort().join('|')),network:'flipboard',region:'international',keyword:keyword.slice(0,220),source,
   article:url,observedAt:now,dataAt:published,signal:'recent_editorial_placement',weekly:null,monthly:null,yearly:null});
 }
 return [...new Map(rows.map(x=>[x.id,x])).values()].slice(0,50);
}
export function fit(item,trend,now=Date.now()) {
 if(!inSeason(item.title,now)||!inSeason(trend.keyword,now)||now-trend.dataAt>10*DAY) return null;
 // NL copy is not automatically sent into an unrelated US audience.
 if(trend.network==='pinterest'&&trend.region!=='NL+BE+LU')return null;
 if(/workshop|schilderen|painting|knutselen|basteln/i.test(trend.keyword)&&!/workshop|schilder|painting|knutsel|bouwpakket|diy|craft/i.test(item.title))return null;
 if(/landelijk|rustic|country style/i.test(trend.keyword)&&!/hout|wood|riet|rattan|ceder|krans|glas|glaz|glass|keramiek|ceramic/i.test(item.title))return null;
 if(/krans|wreath|kranz/i.test(trend.keyword)&&!/krans|wreath|kranz/i.test(item.title))return null;
 if(/\bbuiten\b|outdoor/i.test(trend.keyword)&&!/\bbuiten\b|outdoor/i.test(item.title))return null;
 const a=tags(item.title+' '+(item.category||'')),b=tags(trend.keyword),shared=a.filter(t=>b.includes(t));
 const specific=shared.filter(x=>x!=='gifts'); if(!specific.length) return null;
 const terms=plain(trend.keyword).toLowerCase().match(/[\p{L}\d]{4,}/gu)||[];
 const literal=terms.filter(w=>item.title.toLowerCase().includes(w)).length;
 const growth=Math.max(0,Math.min(100,Math.log10(1+Math.max(0,trend.monthly||0))*30));
 const freshness=Math.max(0,1-(now-trend.dataAt)/(10*DAY));
 return {score:Math.round(specific.length*30+Math.min(3,literal)*8+growth*0.2+freshness*10),shared:specific};
}
export function makePlan(items,trends,history={},performance={},now=Date.now(),limit=3) {
 const result=[];
 for(const network of ['pinterest','flipboard']) {
  const candidates=[];
  for(const item of items) {
   if(!item.title||item.inStock===false||!item.image||history[network+':'+item.id])continue;
   let best=null;
   for(const trend of trends.filter(t=>t.network===network)) {
    const f=fit(item,trend,now);if(!f)continue;
    const perf=performance[network+':'+(trend.learningId||trend.id)]||{};
    // Bounded use of observed outcomes; a tiny sample never overwhelms relevance.
    const learning=perf.visits>=20?Math.min(12,((perf.paid||0)*4+(perf.carts||0))/perf.visits*20):0;
    const row={item,trend,score:f.score+learning,match:f.shared};if(!best||row.score>best.score)best=row;
   }
   if(best)candidates.push(best);
  }
  candidates.sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id));
  const used=new Set(),count={};
  for(const row of candidates) {
   const topic=row.trend.learningId||row.trend.id;
   if((count[topic]||0)>=2||used.has(row.item.id))continue;
   used.add(row.item.id);count[topic]=(count[topic]||0)+1;
   result.push({...row,id:hash(network+'|'+row.item.id),network,createdAt:now,status:'queued'});
   if(used.size>=limit)break;
  }
 }
 return result;
}
