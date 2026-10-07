// bol-API voor de engine en de /t-pagina's (via rewrite /api/bol/:op):
//   GET /api/bol/check                          -> werken de sleutels? (nooit de waarden zelf)
//   GET /api/bol/pick?q=<paginatitel>&country=NL -> één passend product (24u cache): {ok, product:{ean,id,title,url,image,price,strike,rating}}
//   GET /api/bol/search?q=..&page=1&size=24&sort=RELEVANCE&country=NL -> productlijst (20 min cache)
//   GET /api/bol/learn[?days=7&min=300]  -> leren op orders: orders koppelen aan pagina/zone/lay-out, conversie goal=2 terugmelden, advies (zones uitsluiten/houden, pagina's op commissie per 1.000 kliks); cron elke 6 uur
//   GET /api/bol/report?from=YYYY-MM-DD&to=YYYY-MM-DD&what=promotion|orders|commission[&raw=1] -> bol Reporting API v2 (kliks/orders/commissie per dag, site, subid-groep)
import { kv } from '../lib/db.js';
import { getToken, getCreds, searchCached, catalog } from '../lib/bol.js';

const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
// zoekterm uit een paginatitel: "Een afvalemmer kiezen voor een kleine keuken" -> "afvalemmer kleine keuken"
function termFromTitle(t) {
  let s = clean(t).toLowerCase().replace(/[|–—:].*$/, '').replace(/[^a-z0-9àâäéèêëïîôöùûüç\s-]/g, ' ');
  const stop = new Set(['een', 'de', 'het', 'voor', 'kiezen', 'kies', 'welke', 'wat', 'is', 'de', 'beste', 'en', 'of', 'je', 'jouw', 'mijn', 'met', 'zonder', 'in', 'op', 'bij', 'om', 'te', 'naar', 'hoe', 'tips', 'gids', 'keuzehulp', 'review', 'dit', 'dat', 'deze', 'zo', 'als', 'van', 'tot', 'per']);
  const words = s.split(/\s+/).filter(w => w && !stop.has(w) && w.length > 1);
  return words.slice(0, 5).join(' ');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.setHeader('cache-control', 'no-store');
  const url = new URL(req.url, 'http://x');
  const op = url.searchParams.get('op') || url.pathname.replace(/^\/api\/bol\/?/, '').split('/')[0];
  const country = (url.searchParams.get('country') || 'NL').toUpperCase() === 'BE' ? 'BE' : 'NL';
  try {
    if (op === 'check') {
      const out = {};
      for (const kind of ['marketing', 'report']) { const c = await getCreds(kind); if (!c) { out[kind] = 'geen sleutels'; continue; } const t = await getToken(kind); out[kind] = t.error ? 'FOUT: ' + t.error : 'OK (bron: ' + c.from + ')'; }
      if (/^OK/.test(out.marketing)) { try { const j = await catalog('/products/search', { 'search-term': 'afvalemmer', 'country-code': 'NL', 'page-size': 1, 'include-offer': true }, 'nl-NL'); const p = (j.results || j.products || [])[0]; out.proef = p ? 'zoekproef OK: ' + String(p.title || '').slice(0, 60) : 'zoekproef: geen resultaat (antwoord: ' + JSON.stringify(j).slice(0, 120) + ')'; } catch (e) { out.proef = 'zoekproef FOUT: ' + String(e && e.message || e).slice(0, 160); } }
      return res.status(200).json(out);
    }
    if (op === 'pick') {
      // Slim: alleen een product als het ECHT bij de pagina past. Pagina's over Yoors zelf, nieuws, updates enz. krijgen niets (ok:false, reason).
      const q = clean(url.searchParams.get('q') || '').slice(0, 120); if (!q) return res.status(400).json({ ok: false, error: 'q ontbreekt' });
      const NOGO = /\b(yoors|payout|payouts|uitbetaling|deadline|update|updates|community|creators?|nieuwsbrief|newsletter|platform|beleid|policy|voorwaarden|terms|we luisteren|jullie vragen|bedankt|welkom|welcome|introductie|verdien|earn|referral|wedstrijd|contest|winnaar|winner|maandoverzicht|overzicht|column|opinie|mening|gedicht|poem|verhaal|story|dagboek|diary|nieuws|news|politiek|politics|verkiezing|oorlog|war|overleden|rip)\b/i;
      if (NOGO.test(q)) return res.status(200).json({ ok: false, product: null, term: '', reason: 'nogo' });
      const term = termFromTitle(q) || q.toLowerCase();
      const toks = term.split(' ').filter(w => w.length >= 4);
      if (!toks.length) return res.status(200).json({ ok: false, product: null, term, reason: 'te weinig houvast' });
      const key = 'hjdk:pick3:' + country + ':' + term.slice(0, 80); // v23: ook 'alts' (andere passende producten voor extra kaarten)
      try { const c = await kv.get(key); if (c && c.at && Date.now() - c.at < 24 * 3600 * 1000) return res.status(200).json({ ok: !!c.product, product: c.product || null, alts: c.alts || [], term, fit: c.fit, reason: c.reason, cached: true }); } catch (e) {}
      let product = null, alts = [], error = '', fit = 0, reason = '';
      try { const r = await searchCached(term, { country, size: 10, sort: 'RELEVANCE' });
        // pasvorm: hoeveel van de titelwoorden (>=4 letters, stam van 5) komen terug in de producttitel
        const stem = w => w.slice(0, 5);
        const fitOf = p => { const t = String(p.title || '').toLowerCase(); const hits = toks.filter(w => t.indexOf(stem(w)) >= 0).length; return hits / toks.length; };
        const cands = r.products.filter(p => p.price != null && p.image).map(p => Object.assign({}, p, { fit: fitOf(p) })).filter(p => p.fit >= (toks.length <= 2 ? 0.5 : 0.34));
        // voorkeur: pasvorm eerst, dan beoordeling en niet te goedkoop (commissie = prijs × percentage)
        const score = p => p.fit * 3 + Math.min(5, p.rating || 3.5) / 5 + (p.price >= 20 ? 0.5 : 0) + (p.price >= 40 ? 0.25 : 0) - (p.price < 10 ? 0.5 : 0);
        const sorted = cands.slice(0, 8).sort((a, b) => score(b) - score(a));
        product = sorted[0] || null;
        if (product) { fit = product.fit; delete product.fit; alts = sorted.slice(1, 5).filter(a => a.id !== product.id).map(a => { const x = Object.assign({}, a); delete x.fit; return x; }); } else reason = r.products.length ? 'geen passend product' : 'geen resultaat';
      } catch (e) { error = String(e && e.message || e).slice(0, 160); }
      if (!error) { try { await kv.set(key, { at: Date.now(), product, alts, fit, reason }, { ex: 2 * 86400 }); } catch (e) {} }
      return res.status(200).json({ ok: !!product, product, alts, term, fit, reason: reason || undefined, error: error || undefined });
    }
    if (op === 'search') {
      const q = clean(url.searchParams.get('q') || '').slice(0, 120);
      const page = Math.max(1, Math.min(50, Number(url.searchParams.get('page')) || 1)), size = Math.max(1, Math.min(50, Number(url.searchParams.get('size')) || 24));
      const sort = String(url.searchParams.get('sort') || 'RELEVANCE').toUpperCase();
      const r = await searchCached(q, { country, page, size, sort: /^(RELEVANCE|POPULARITY|PRICE_ASC|PRICE_DESC|RELEASE_DATE|RATING)$/.test(sort) ? sort : 'RELEVANCE', category: url.searchParams.get('category') || '' });
      return res.status(200).json({ ok: true, products: r.products, total: r.total, at: r.at });
    }
    if (op === 'report') {
      // Affiliate Reporting API v2: GET /api/bol/report?from=YYYY-MM-DD&to=YYYY-MM-DD&what=promotion|orders|commission&raw=1
      const REP = 'https://api.bol.com/marketing/affiliate/reports/v2';
      const day = d => new Date(d).toISOString().slice(0, 10);
      const today = day(Date.now()), from = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('from') || '') ? url.searchParams.get('from') : day(Date.now() - 6 * 864e5), to = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('to') || '') ? url.searchParams.get('to') : today;
      const what = String(url.searchParams.get('what') || 'promotion');
      const path = what === 'orders' ? '/order-report' : what === 'commission' ? '/commission-report' : '/promotion-report';
      const cacheKey = 'hjdk:bolrep:' + what + ':' + from + ':' + to;
      let rows = null;
      if (to !== today) { try { const c = await kv.get(cacheKey); if (c && c.at && Date.now() - c.at < 6 * 3600 * 1000) rows = c.rows; } catch (e) {} }
      if (!rows) {
        const t = await getToken('report'); if (t.error) return res.status(200).json({ ok: false, error: t.error });
        const r = await fetch(REP + path + '?startDate=' + from + '&endDate=' + to, { headers: { authorization: 'Bearer ' + t.token, accept: 'application/json' } });
        const txt = await r.text();
        if (!r.ok) return res.status(200).json({ ok: false, error: 'bol report ' + r.status + ' ' + txt.slice(0, 200) });
        let j; try { j = JSON.parse(txt); } catch (e) { return res.status(200).json({ ok: false, error: 'geen json: ' + txt.slice(0, 120) }); }
        rows = Array.isArray(j) ? j : (j.results || j.items || j.data || j.rows || []);
        if (to !== today) { try { await kv.set(cacheKey, { at: Date.now(), rows }); } catch (e) {} }
      }
      if (url.searchParams.get('raw')) return res.status(200).json({ ok: true, what, from, to, n: rows.length, rows });
      const num = v => Number(v) || 0;
      // samenvatting: per dag, per site en per subid-groep (br_<slug>, t_<page>, pick, overig)
      const grp = s => { s = String(s || ''); const m = s.match(/^(br|t)_([a-z0-9-]+?)(?:-Z|$)/i); return m ? m[1] + '_' + m[2] : (s.split('-')[0] || '(leeg)'); };
      const add = (o, k, r) => { const x = o[k] || (o[k] = { clicks: 0, orders: 0, commission: 0, revenue: 0, qty: 0 }); x.clicks += num(r.clicks); x.orders += num(r.orders) || (r.orderId ? 1 : 0); x.commission += num(r.commission != null ? r.commission : r.commissionOriginal); x.revenue += num(r.revenueExclVat != null ? r.revenueExclVat : r.priceExclVat != null ? r.priceExclVat : r.revenueOriginalExclVat); x.qty += num(r.quantity) || num(r.quantityPayable); };
      const byDay = {}, bySite = {}, byGroup = {}, byPct = {}, byProduct = {}, total = {};
      for (const r of rows) { add(byDay, r.date || r.orderDate || '?', r); add(bySite, (r.siteName || '') + ' (' + (r.siteCode || '') + ')', r); add(byGroup, grp(r.subId), r); add(total, 'all', r);
        if (r.commissionPercentage != null) add(byPct, String(r.commissionPercentage) + '%', r); // welk commissiepercentage de orders opleveren (7% = Koken & Huishouden/Wonen/Kleding/Verzorging, 6/4/2,5% = lager)
        if (r.productTitle) add(byProduct, String(r.productTitle).slice(0, 70) + (r.commissionPercentage != null ? ' [' + r.commissionPercentage + '%]' : ''), r); }
      const round = o => { for (const k in o) { o[k].commission = Math.round(o[k].commission * 100) / 100; o[k].revenue = Math.round(o[k].revenue * 100) / 100; } return o; };
      // bron per klik: -Z<zone> = betaald (zone van het advertentienetwerk), kz_ zonder zone = gewoon bezoek op keuzehulp.best, de rest = yoors.nl-pagina's
      const bron = s => { s = String(s || ''); const z = (s.match(/-Z(\d+)/) || [])[1]; return z ? 'betaald zone ' + z : /^kz_/.test(s) ? 'keuzehulp.best onbetaald' : s ? 'yoors.nl' : '(geen subId)'; };
      const byDayBron = {}, byDayGroup = {}, bySubId = {};
      for (const r of rows) { const d = r.date || r.orderDate || '?'; add(byDayBron[d] || (byDayBron[d] = {}), bron(r.subId), r); add(byDayGroup[d] || (byDayGroup[d] = {}), grp(r.subId) + ' · ' + bron(r.subId), r); add(bySubId, String(r.subId || '(leeg)'), r); }
      for (const d in byDayBron) { round(byDayBron[d]); round(byDayGroup[d]); }
      const subTop = Object.entries(round(bySubId)).sort((a, b) => b[1].clicks - a[1].clicks).slice(0, 150).map(([s, x]) => Object.assign({ subId: s }, x));
      return res.status(200).json({ ok: true, what, from, to, n: rows.length, total: round(total).all, byDay: round(byDay), byDayBron, byDayGroup, bySite: round(bySite), byGroup: round(byGroup), byPct: round(byPct), byProduct: round(byProduct), subIds: subTop });
    }
    if (op === 'learn') {
      // Leren op ORDERS (cron elke 6 uur, ook handmatig): bol-orders van de laatste `days` dagen koppelen aan pagina/zone/lay-out/clickid,
      // elke nieuwe order als conversie goal=2 (payout = commissie) terugmelden aan het netwerk, en per zone/pagina orders + commissie per 1.000 kliks berekenen.
      const REP = 'https://api.bol.com/marketing/affiliate/reports/v2';
      const day = d => new Date(d).toISOString().slice(0, 10);
      const days = Math.max(1, Math.min(30, Number(url.searchParams.get('days')) || 7));
      const from = day(Date.now() - (days - 1) * 864e5), to = day(Date.now());
      const t = await getToken('report'); if (t.error) return res.status(200).json({ ok: false, error: t.error });
      const pull = async path => { const r = await fetch(REP + path + '?startDate=' + from + '&endDate=' + to, { headers: { authorization: 'Bearer ' + t.token, accept: 'application/json' } }); const txt = await r.text(); if (!r.ok) throw new Error('bol report ' + r.status + ' ' + txt.slice(0, 120)); const j = JSON.parse(txt); return Array.isArray(j) ? j : (j.results || j.items || j.data || []); };
      const [orders, promo] = await Promise.all([pull('/order-report'), pull('/promotion-report')]);
      const num = v => Number(v) || 0;
      const parse = s => { s = String(s || '');
        const m = s.match(/^(br|t)_([a-z0-9-]+?)-Z(\d+)-([a-z])(?:-([a-z0-9]{10}))?$/i); if (m) return { kind: m[1], page: m[2], zone: m[3], layout: m[4], code: m[5] || '' };
        const z = s.match(/^kz_([a-z0-9-]+?)-(\d+)(?:-Z(\d+))?(?:-([a-z0-9]{10}))?$/i); if (z) return { kind: 'kz', page: 'kz:' + z[1], zone: z[3] || 'organisch', layout: 'k', code: z[4] || '' }; // kz_ = keuzehulp.best (slug-route[-Zzone[-clickidcode]])
        const k = s.match(/^(pk|yp)_([a-z0-9-]+?)(?:-Z.*)?$/i); if (k) return { kind: k[1], page: 'yoors:' + k[2], zone: 'yoors', layout: k[1] === 'pk' ? 'p' : 'a', code: '' }; // pk_ = bol-banner op een Yoors-pagina (engine 6.26+), yp_ = eigen productlink in een Yoors-artikel
        if (/^pick(-|$)/.test(s)) return { kind: 'pk', page: 'yoors:(onbekend)', zone: 'yoors', layout: 'p', code: '' };
        return null; };
      const mk = () => ({ clicks: 0, orders: 0, commission: 0, revenue: 0 });
      const zones = {}, pages = {}, layouts = {}, pageZone = {};
      const add = (o, k, f, v) => { const x = o[k] || (o[k] = mk()); x[f] += v; };
      for (const r of promo) { const p = parse(r.subId); if (!p) continue; const c = num(r.clicks); add(zones, p.zone, 'clicks', c); add(pages, p.page, 'clicks', c); add(layouts, p.layout, 'clicks', c); add(pageZone, p.page + '|' + p.zone, 'clicks', c); }
      let posted = 0, matched = 0, unmatched = 0; const postedList = [], byPct = {};
      for (const r of orders) {
        const p = parse(r.subId); const com = num(r.commission), rev = num(r.priceExclVat);
        if (r.commissionPercentage != null) { const k = r.commissionPercentage + '%'; byPct[k] = (byPct[k] || 0) + 1; }
        if (!p) { unmatched++; continue; }
        matched++;
        for (const [o, k] of [[zones, p.zone], [pages, p.page], [layouts, p.layout], [pageZone, p.page + '|' + p.zone]]) { add(o, k, 'orders', 1); add(o, k, 'commission', com); add(o, k, 'revenue', rev); }
        // terugmelden aan het netwerk als conversie goal=2, één keer per orderregel
        const oid = String(r.orderItemId || r.orderId || '') + ':' + String(r.productId || '');
        if (!p.code || !oid || oid === ':') continue;
        try {
          const done = await kv.get('hjdk:opb:' + oid); if (done) continue;
          const cid = await kv.get('hjdk:cid:' + p.code); if (!cid || !cid.c) continue;
          const isPA = /propeller|propads|^pa$/i.test(String(cid.s || '')); const isRA = /richads|^ra$/i.test(String(cid.s || ''));
          const pb = isPA ? 'https://ad.propellerads.com/conversion.php?aid=3772727&pid=&tid=151850&visitor_id=' + encodeURIComponent(cid.c) + '&goal=2&payout=' + com.toFixed(2)
                   : isRA ? 'https://us.ahows.co/log?action=conversion&key=' + encodeURIComponent(cid.c) + '&payout=' + com.toFixed(2)
                          : 'https://postback.mondiad.com/track?uid=31070&clickid=' + encodeURIComponent(cid.c) + '&payout=' + com.toFixed(2);
          const pr = await fetch(pb).catch(() => null);
          await kv.set('hjdk:opb:' + oid, { at: Date.now(), status: pr ? pr.status : 0, net: isPA ? 'propellerads' : isRA ? 'richads' : 'mondiad', zone: p.zone, page: p.page, commission: com }, { ex: 45 * 86400 });
          posted++; postedList.push({ order: oid, net: isPA ? 'propellerads' : isRA ? 'richads' : 'mondiad', zone: p.zone, page: p.page, commission: com, status: pr ? pr.status : 0 });
        } catch (e) {}
      }
      const per1k = o => { for (const k in o) { const x = o[k]; x.commission = Math.round(x.commission * 100) / 100; x.revenue = Math.round(x.revenue * 100) / 100; x.commissionPer1000 = x.clicks ? Math.round(x.commission / x.clicks * 1000 * 100) / 100 : null; } return o; };
      per1k(zones); per1k(pages); per1k(layouts); per1k(pageZone);
      const minClicks = Math.max(50, Number(url.searchParams.get('min')) || 300);
      // advies: zones met veel kliks en geen order = uitsluiten; zones met orders = houden; pagina's gerangschikt op commissie per 1.000 kliks
      const zoneList = Object.entries(zones).map(([zone, x]) => Object.assign({ zone }, x));
      const exclude = zoneList.filter(z => z.clicks >= minClicks && z.orders === 0).sort((a, b) => b.clicks - a.clicks).map(z => z.zone);
      const keep = zoneList.filter(z => z.orders > 0).sort((a, b) => (b.commissionPer1000 || 0) - (a.commissionPer1000 || 0));
      const pageRank = Object.entries(pages).map(([page, x]) => Object.assign({ page }, x)).sort((a, b) => (b.commissionPer1000 || 0) - (a.commissionPer1000 || 0) || b.clicks - a.clicks);
      const out = { ok: true, from, to, days, orders: orders.length, matched, unmatched, posted, postedList, byPct, minClicks, advies: { zonesUitsluiten: exclude, zonesMetOrders: keep, paginasOpCommissie: pageRank, layouts }, zones, pageZone };
      try { await kv.set('hjdk:learn:v1', { at: Date.now(), from, to, zones, pages, layouts, byPct }); } catch (e) {}
      return res.status(200).json(out);
    }
    if (op === 'popular') {
      // Lezersfavorieten: producten die Yoors-lezers via onze bruggen/banners het vaakst bekeken (eigen tellers), met foto en prijs. 1 uur cache.
      const ck = 'hjdk:popular:v1';
      try { const c = await kv.get(ck); if (c && c.at && Date.now() - c.at < 3600 * 1000) return res.status(200).json({ ok: true, products: c.products, cached: true }); } catch (e) {}
      let keys = [], cursor = '0';
      for (let i = 0; i < 20; i++) { const [c, ks] = await kv.scan(cursor, { match: 'hjdk:bridge3:*', count: 500 }); cursor = c; keys = keys.concat(ks.filter(k => !/:last:|:amz:/.test(k))); if (cursor === '0') break; }
      const vals = keys.length ? await kv.mget(...keys) : [];
      const cand = [];
      keys.forEach((k, i) => { const v = vals[i]; if (!v || !v.products) return; const slug = k.replace('hjdk:bridge3:', ''); v.products.forEach(p => { if (p.image && p.price != null) cand.push({ slug, id: p.id, title: p.name || p.title, url: p.url, image: p.image, price: p.price, rating: p.rating, delivery: p.delivery || '' }); }); });
      const ckeys = cand.map(c => 'c:hjdk6-brp-' + c.slug + '-' + c.id + '-clk');
      const clicks = ckeys.length ? await kv.mget(...ckeys) : [];
      cand.forEach((c, i) => { c.clicks = Number(clicks[i]) || 0; });
      const seen = {}; const products = cand.sort((a, b) => b.clicks - a.clicks).filter(c => { if (seen[c.id]) return false; seen[c.id] = 1; return true; }).slice(0, 8);
      try { await kv.set(ck, { at: Date.now(), products }); } catch (e) {}
      return res.status(200).json({ ok: true, products });
    }
    return res.status(400).json({ error: 'bad op', op });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e && e.message || e).slice(0, 200) }); }
}
