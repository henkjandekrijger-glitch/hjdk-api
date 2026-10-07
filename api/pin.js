// Pin-beeld (1000x1500 PNG) per keuzehulp, voor Pinterest en delen: /pin/<slug>-<variant>.png
// Variant 0 = titel + productfoto, 1 = "nu actueel"-kop, 2/3 = andere productfoto en kop (voor herhaalpins).
// Faalt het tekenen, dan stuurt hij door naar de productfoto van bol, zodat een pin nooit zonder beeld zit.
import { ImageResponse } from '@vercel/og';
import { kv } from '../lib/db.js';
import { searchCached } from '../lib/bol.js';
import { INTER_500, INTER_800 } from '../lib/pinfont.js';
import seed from '../data/kz.json' with { type: 'json' };

const FONTS = [{ name: 'Inter', data: Buffer.from(INTER_500, 'base64'), weight: 500, style: 'normal' }, { name: 'Inter', data: Buffer.from(INTER_800, 'base64'), weight: 800, style: 'normal' }];
const kortZin = t => { t = String(t || '').trim(); const m = t.match(/^(.{40,130}?[.!?])(\s|$)/); return m ? m[1] : (t.length > 120 ? t.slice(0, 117).replace(/\s+\S*$/, '') + '…' : t); };
const h = (type, style, children) => ({ type, props: { style: Object.assign({ display: 'flex' }, style), children } });

async function itemFor(slug) {
  let it = seed.items.find(i => i.slug === slug) || null;
  try { const v = await kv.get('hjdk:kz:' + slug); if (v && v.slug) it = v.override && it ? Object.assign({}, it, v) : (it && !v.override ? it : v); } catch (e) {}
  return it;
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const m = String(url.searchParams.get('p') || '').match(/^([a-z0-9-]+?)(?:-(\d))?(?:\.png)?$/);
  const slug = m ? m[1] : String(url.searchParams.get('slug') || '').replace(/[^a-z0-9-]/g, '');
  const v = Math.max(0, Math.min(3, Number(m && m[2] != null ? m[2] : url.searchParams.get('v')) || 0));
  const it = slug ? await itemFor(slug) : null;
  if (!it) { res.statusCode = 404; return res.end('onbekend'); }
  let prods = []; try { const r = await searchCached(it.term, { country: 'NL', size: 24, sort: 'RELEVANCE' }); prods = (r.products || []).filter(p => p.image && p.price != null); } catch (e) {}
  const prod = prods.length ? prods[Math.min(prods.length - 1, v >= 2 ? 1 + ((v - 2) % 3) : 0)] : null;
  const prijzen = prods.map(p => p.price).filter(x => x > 0).sort((a, b) => a - b);
  const vanaf = prijzen.length ? '€' + Math.floor(prijzen[Math.floor(prijzen.length * 0.1)]).toLocaleString('nl-NL') : '';
  const kop = v === 1 && it.actueel ? it.title : v >= 2 ? (it.h1 || it.title) : it.title;
  const sub = v === 1 && it.actueel ? it.actueel : (it.kort || it.intro || '');
  try {
    const el = h('div', { width: '100%', height: '100%', flexDirection: 'column', background: '#fafaf9', fontFamily: 'Inter' }, [
      h('div', { flexDirection: 'column', background: '#0f766e', padding: '60px 64px 54px' }, [
        h('div', { fontSize: 28, fontWeight: 800, color: '#99f6e4', letterSpacing: 3 }, 'KEUZEHULP · ' + String(it.cat || '').toUpperCase()),
        h('div', { fontSize: kop.length > 40 ? 70 : 82, fontWeight: 800, color: '#ffffff', lineHeight: 1.08, marginTop: 22 }, kop)
      ]),
      h('div', { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: '34px 64px 6px' },
        prod ? [{ type: 'img', props: { src: prod.image, width: 680, height: 680, style: { objectFit: 'contain', background: '#ffffff', borderRadius: 36, padding: 30 } } }] : [h('div', { fontSize: 44, color: '#44403c', lineHeight: 1.3 }, sub.slice(0, 160))]),
      h('div', { flexDirection: 'column', padding: '0 64px 60px' }, [
        prod ? h('div', { fontSize: 32, color: '#44403c', lineHeight: 1.35, marginBottom: 26 }, kortZin(sub)) : h('div', {}, ''),
        h('div', { alignItems: 'center', justifyContent: 'space-between' }, [
          h('div', { background: '#f59e0b', color: '#1c1917', fontSize: 34, fontWeight: 800, padding: '18px 30px', borderRadius: 999 }, 'Doe de 3 vragen'),
          h('div', { flexDirection: 'column', alignItems: 'flex-end' }, [h('div', { fontSize: 26, color: '#78716c' }, vanaf ? 'prijs van vandaag, vanaf ' + vanaf : 'prijs van vandaag bij bol'), h('div', { fontSize: 32, fontWeight: 800, color: '#0f766e', marginTop: 6 }, 'keuzehulp.best')])
        ])
      ])
    ]);
    const img = new ImageResponse(el, { width: 1000, height: 1500, fonts: FONTS });
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length < 2000) throw new Error('leeg beeld');
    res.setHeader('content-type', 'image/png'); res.setHeader('cache-control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    return res.end(buf);
  } catch (e) {
    try { await kv.incr('c:hjdk6-kz-pin-fout'); } catch (x) {}
    if (prod && prod.image) { res.statusCode = 302; res.setHeader('location', prod.image); res.setHeader('cache-control', 'public, max-age=3600'); return res.end(); }
    res.statusCode = 500; return res.end('pin-beeld mislukt: ' + String(e && e.message || e).slice(0, 120));
  }
}
