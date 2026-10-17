// Bounded aggregate discovery analytics. No raw questions, IPs, cookies or per-person history.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { kv } from '../lib/db.js';
import { FRONT_MARKETS, FRONT_VERSION } from '../lib/koop-front.js';
const TTL = 45 * 86400;
const EVENTS = new Set('view more_results input_start submit results empty example category intent reset guide_click guide_view guide_start guide_answer advice_view retailer_click faq directory_open section_how section_faq language_nl language_us language_de'.split(' '));
const INTENTS = new Set(['choose', 'where', 'price', 'stock']);
const SOURCES = new Set(['ai', 'search', 'social', 'referral', 'direct']);
const HOSTS = new Set(Object.values(FRONT_MARKETS).map(m => m.host));
const day = () => new Date().toISOString().slice(0, 10);
const hostFor = req => String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().replace(/^www\./, '').replace(/:\d+$/, '');
function authorized(req) {
  const expected = process.env.HJDK_TOKEN || '';
  const actual = String(req.headers['x-hjdk-token'] || '').slice(0, 256);
  return expected && expected.length === actual.length && timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}
export function validateEvent(body) {
  if (!body || !FRONT_MARKETS[body.market] || !EVENTS.has(body.event)) return null;
  return { market: body.market, event: body.event, variant: body.variant === 'b' ? 'b' : 'a', intent: INTENTS.has(body.intent) ? body.intent : 'choose', source: SOURCES.has(body.source) ? body.source : 'direct', slug: /^[a-z0-9-]{1,130}$/.test(String(body.slug || '')) ? String(body.slug) : '' };
}
async function catalogSlugs(market) {
  const cacheKey = 'fp:catalog:' + market;
  let found = await kv.get(cacheKey).catch(() => null); if (found) return new Set(found);
  const [{ extraItems }, seed] = await Promise.all([import('../lib/keuze-extra-content.js'), market === 'nl' ? import('../data/kz.json', { with: { type: 'json' } }) : Promise.resolve(null)]);
  const index = await kv.get(market === 'nl' ? 'hjdk:kz:index' : 'hjdk:wtb:' + market + ':index').catch(() => []);
  found = [...new Set([...extraItems(market).map(i => i.slug), ...(seed?.default?.items || []).map(i => i.slug), ...(index || [])])];
  await kv.set(cacheKey, found, { ex: 600 }).catch(() => {}); return new Set(found);
}
export async function frontReport(market, days = 7) {
  const dates = Array.from({ length: Math.min(45, Math.max(1, Number(days) || 7)) }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const rows = await Promise.all(dates.map(async d => [d, await kv.raw(['HGETALL', 'fp:day:' + market + ':' + d])]));
  const totals = {}, daily = [];
  for (const [date, values] of rows) { const data = {}; for (let i = 0; i < values.length; i += 2) { const k = values[i], n = Number(values[i + 1]) || 0; totals[k] = (totals[k] || 0) + n; data[k] = n; } daily.push({ date, counts: data }); }
  const variants = ['a', 'b'].map(variant => { const views = totals['variant:' + variant + ':view'] || 0, clicks = totals['variant:' + variant + ':guide_click'] || 0, shops = totals['variant:' + variant + ':retailer_click'] || 0; return { variant, views, guideClicks: clicks, retailerClicks: shops, guideClickEventsPerView: views ? clicks / views : null, retailerClickEventsPerView: views ? shops / views : null }; });
  const top = Object.entries(totals).filter(([k]) => k.startsWith('slug:') && k.endsWith(':guide_click')).map(([k, clicks]) => ({ slug: k.slice(5, -12), clicks, retailerClicks: totals[k.replace(/guide_click$/, 'retailer_click')] || 0 })).sort((a, b) => b.clicks - a.clicks).slice(0, 20);
  return { ok: true, version: FRONT_VERSION, market, days: dates.length, unit: 'events; not unique people or purchases', counts: totals, variants, top, daily, learning: { sufficientExposure: variants.every(v => v.views >= 100), decision: 'Collect at least 100 views per variant and compare downstream retailer-click events; no automatic winner or causal SEO claim.', next: (totals.empty || 0) > (totals.submit || 0) * 0.15 ? 'Review unmatched demand and catalog coverage. Full questions are intentionally not retained.' : 'Review guides with many starts and few retailer clicks; preserve relevance before changing ranking.' }, retentionDays: 45 };
}
export const TRACKER = `(()=>{const tag=document.currentScript,q=new URLSearchParams(location.search);if(!tag||q.get('via')!=='fp')return;const market=tag.dataset.market,slug=tag.dataset.slug;const variant=q.get('fpv')==='b'?'b':'a',intent=['choose','where','price','stock'].includes(q.get('fpi'))?q.get('fpi'):'choose',source=['ai','search','social','referral','direct'].includes(q.get('fps'))?q.get('fps'):'direct';const seen=new Set();function send(event,once){if(once&&seen.has(event))return;seen.add(event);const body=JSON.stringify({event,market,slug,variant,intent,source});try{if(navigator.sendBeacon('/api/ontdek',new Blob([body],{type:'text/plain'})))return}catch(e){}fetch('/api/ontdek',{method:'POST',body,keepalive:true}).catch(()=>{})}send('guide_view',true);['change','submit'].forEach(ev=>document.addEventListener(ev,e=>{if(e.target.closest('main form,main input,main select,.tool')){send('guide_start',true);send('guide_answer')}},true));document.addEventListener('click',e=>{const b=e.target.closest('.opt,.keuze-opt,[data-o]');if(b){send('guide_start',true);send('guide_answer')}const a=e.target.closest('a');if(a&&/bol\\.com|amazon\\.(com|de)|amzn\\./i.test(a.href))send('retailer_click')},true);const adv=document.querySelector('#adv,#advies');if(adv&&'IntersectionObserver'in window){const ob=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){send('advice_view',true);ob.disconnect()}},{threshold:.3});ob.observe(adv)}})();`;
export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const q = new URL(req.url, 'https://x').searchParams, op = q.get('op') || '';
  if (req.method === 'GET' && op === 'tracker') { res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('cache-control', 'public,max-age=300'); return res.status(200).send(TRACKER); }
  if (req.method === 'GET' && op === 'report') {
    if (!authorized(req)) return res.status(403).json({ ok: false, error: 'x-hjdk-token required' });
    const market = q.get('market') || 'nl'; if (!FRONT_MARKETS[market]) return res.status(400).json({ ok: false });
    try { return res.status(200).json(await frontReport(market, q.get('days'))); } catch (_) { return res.status(503).json({ ok: false, error: 'measurement unavailable' }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const host = hostFor(req); if (!HOSTS.has(host)) return res.status(403).json({ ok: false });
  if (req.headers.origin) { try { if (new URL(req.headers.origin).hostname.replace(/^www\./, '') !== host) return res.status(403).json({ ok: false }); } catch (_) { return res.status(403).json({ ok: false }); } }
  if (/bot|spider|crawl|preview|headless/i.test(String(req.headers['user-agent'] || ''))) return res.status(202).json({ ok: true, ignored: true });
  let b; try { b = typeof req.body === 'string' ? JSON.parse(req.body.slice(0, 1200)) : req.body; } catch (_) { return res.status(400).json({ ok: false }); }
  if (Number(req.headers['content-length']) > 1200) return res.status(413).json({ ok: false });
  const event = validateEvent(b); if (!event || FRONT_MARKETS[event.market].host !== host) return res.status(400).json({ ok: false });
  try {
    // Per-minute HMAC rate key expires after 120 seconds. Never persist raw IPs.
    const secret = process.env.HJDK_TOKEN; if (!secret) return res.status(503).json({ ok: false });
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const hash = createHmac('sha256', secret).update(day() + ':' + ip + ':' + String(req.headers['user-agent'] || '')).digest('hex').slice(0, 24);
    const limiter = 'fp:rate:' + Math.floor(Date.now() / 60000) + ':' + hash;
    const n = Number(await kv.raw(['EVAL', "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],120) end return n", 1, limiter]));
    if (n > 90) return res.status(429).json({ ok: false });
    if (event.slug && !(await catalogSlugs(event.market)).has(event.slug)) return res.status(400).json({ ok: false });
    const key = 'fp:day:' + event.market + ':' + day();
    const fields = [event.event, 'variant:' + event.variant + ':' + event.event, 'intent:' + event.intent + ':' + event.event, 'source:' + event.source + ':' + event.event];
    if (event.slug) fields.push('slug:' + event.slug + ':' + event.event);
    // One bounded daily hash rather than an unbounded key per query/person. TTL atomically set with increment.
    const lua = "for i=1,#ARGV-1 do redis.call('HINCRBY',KEYS[1],ARGV[i],1) end redis.call('EXPIRE',KEYS[1],ARGV[#ARGV]) return 1";
    await kv.raw(['EVAL', lua, 1, key, ...fields, TTL]);
    return res.status(202).json({ ok: true });
  } catch (_) { return res.status(503).json({ ok: false, error: 'measurement unavailable' }); }
}
