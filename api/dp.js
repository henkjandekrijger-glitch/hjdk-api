// Droppery-brug voor Kadoly (lib/droppery.js). Routes:
//   https://gids.kadoly.com/wp-json/...            WooCommerce-REST voor Droppery (consumer key/secret)
//   /api/dp?op=sleutels                            consumer key en secret tonen (alleen beschermde vercel.app-host, voor Henkjan)
//   /api/dp?op=stand | op=log                      stand en logboek van Droppery-aanroepen (beschermde host)
//   /api/dp?op=feed                                producten voor de Kadoly-shop (header X-Lus-Key = SHOP_FEED_KEY, of beschermde host)
//   POST /api/dp?op=order                          betaalde Kadoly-order met Droppery-producten (X-Lus-Key)
//   /api/dp?op=status&order=<kadoly-order-id>      status en track-and-trace terug (X-Lus-Key)
//   /api/dp?op=token                               Droppery API-token plakken (beschermde host, POST; lib/dpapi.js, 21 nov 2026)
//   /api/dp?op=api&pad=products&size=2             ruwe API-aanroep om de vorm te zien (beschermde host; token gaat nooit mee terug)
//   /api/dp?op=scan | op=keur | op=nacht           catalogus inlezen, keuring (brug + catalogus), nachtronde (cron 04:53 UTC)
import { wcRoute, dpSleutels, dpStand, dpLog, dpFeed, dpNieuweOrder, dpOrderStatus, DP_HOST } from '../lib/droppery.js';
import { dpProbe, dpTokenZet, dpTokenStand, dpApi, dpScan, dpKeurCatalogus, dpKeurLaatste, vraagIdx } from '../lib/dpapi.js';
import { keurStand } from '../lib/dpkeur.js';
import { laterAf } from '../lib/mensmeter.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://x'); const q = url.searchParams;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0];
  const beschermd = /\.vercel\.app$/i.test(host);
  const lus = !!process.env.SHOP_FEED_KEY && String(req.headers['x-lus-key'] || '') === process.env.SHOP_FEED_KEY;
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  try {
    if (q.has('wc')) return await wcRoute(req, res, q.get('wc') || '', q);
    const op = q.get('op') || '';
    if (op === 'sleutels') {
      if (!beschermd) return res.status(404).send('Niet gevonden');
      const k = await dpSleutels(true); res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Droppery-koppeling Kadoly</title><body style="font:16px/1.5 system-ui;max-width:640px;margin:32px auto;padding:0 16px"><h1 style="font-size:24px">Droppery koppelen aan Kadoly</h1><p>Zet in Droppery onder <b>Settings, Base information</b> de Store URL op <code>${esc(DP_HOST)}</code> (webshop type WooCommerce). Zet daarna onder <b>Settings, API credentials</b>:</p><p>Consumer key<br><input readonly style="width:100%;font:14px monospace;padding:8px" value="${esc(k.key)}" onclick="this.select()"></p><p>Consumer secret<br><input readonly style="width:100%;font:14px monospace;padding:8px" value="${esc(k.secret)}" onclick="this.select()"></p><p>Druk op Submit. Deze pagina staat alleen achter de Vercel-inlog; deel de waarden niet.</p></body>`);
    }
    if (op === 'token') { // 21 nov 2026 (Henkjan: "Heb je geen droppery API ?"): token uit platform.droppery.io, menu API token
      if (!beschermd) return res.status(404).send('Niet gevonden');
      let melding = '';
      if (req.method === 'POST') {
        const b = typeof req.body === 'object' && req.body ? req.body : Object.fromEntries(new URLSearchParams(String(req.body || '')));
        const r = await dpTokenZet(b.token);
        melding = r.ok ? `<p style="background:#e6f4ea;color:#0a5c2b;padding:12px;border-radius:8px"><b>Gelukt.</b> Droppery antwoordt. Ik lees vannacht de hele catalogus in en keur elk product; je mag dit venster sluiten.</p>` : `<p style="background:#fde8e8;color:#8a1010;padding:12px;border-radius:8px"><b>Niet gelukt.</b> ${esc(r.fout)}</p>`;
        if (r.ok) laterAf(dpScan({ maxPaginas: 20, tijd: 60e3 }).catch(() => {})); // eerste stukken meteen, de rest in de nachtronde
      }
      const st = await dpTokenStand(); res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Droppery API-token</title><body style="font:16px/1.5 system-ui;max-width:640px;margin:32px auto;padding:0 16px;color:#0b1620"><h1 style="font-size:24px">Droppery API-token voor Kadoly</h1>${melding}<p>${st.klaar ? 'Er staat al een token (sinds ' + esc(st.sinds || 'eerder') + '). Plak hieronder alleen een nieuw token als je het vervangt.' : 'Ga in <b>platform.droppery.io</b> naar het menu <b>API token</b>, maak een token aan en kopieer hem. Droppery laat hem maar één keer zien.'}</p><form method="post"><p><label for="t"><b>Token</b></label><br><input id="t" name="token" type="password" autocomplete="off" required style="width:100%;font:16px monospace;padding:10px;border:2px solid #0b1620;border-radius:8px"></p><p><button style="font:700 16px system-ui;padding:12px 20px;border:0;border-radius:999px;background:#169def;color:#fff">Opslaan en testen</button></p></form><p>Het token wordt versleuteld opgeslagen en nergens getoond. Deze pagina staat achter de Vercel-inlog.</p></body>`);
    }
    if (op === 'api') { // ruwe aanroep om de vorm van de API te leren; alleen lezen (GET), alleen de beschermde host
      if (!beschermd) return res.status(404).send('Niet gevonden');
      const pad = String(q.get('pad') || 'products').replace(/[^a-z0-9/_-]/gi, '').slice(0, 80); const params = {}; for (const [k, v] of q.entries()) if (!['op', 'pad'].includes(k)) params[k] = v;
      const r = await dpApi(pad, params); return res.status(200).json({ st: r.st, fout: r.fout || null, data: r.data, tekst: r.tekst });
    }
    if (op === 'probe') { if (!beschermd) return res.status(404).send('Niet gevonden'); const p = q.getAll('p'); return res.status(200).json(await dpProbe(p.length ? p : ['api/v1/webshop/products?size=2&start=0', 'api/v1/webshop/product?size=2&start=0', 'api/v1/webshop', 'api/v1/webshop/orders?size=2&start=0', 'api/v1/products?size=2&start=0', 'api/webshop/v1/products?size=2', 'api/v1/webshop/products/list?size=2', 'api/v1/webshop/catalog?size=2', 'api/v1/webshop/supplier-products?size=2', 'api/v1/webshop/suppliers', 'api/v1/me', 'api/v1/webshop/me'])); }
    const cron = /vercel-cron/i.test(String(req.headers['user-agent'] || '')) || (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET);
    if (op === 'scan') { if (!beschermd && !cron) return res.status(404).send('Niet gevonden'); return res.status(200).json(await dpScan({ maxPaginas: Number(q.get('n')) || 30 })); }
    if (op === 'keur' || op === 'nacht') { // keuring van de brug (wat Droppery al naar Kadoly stuurt) en van de catalogus via de API
      if (!beschermd && !lus && !cron) return res.status(404).send('Niet gevonden');
      const uit = { at: new Date().toISOString() };
      if (op === 'nacht') { try { await vraagIdx(true); } catch (e) {} uit.scan = await dpScan({ maxPaginas: 60, tijd: 220e3 }); }
      const feed = await dpFeed(); uit.brug = Object.assign(keurStand(feed.producten), { vraagdata: feed.vraagdata, lijst: feed.producten.map(p => ({ sku: p.sku, titel: p.titel, categorie: p.categorie, prijs_kadoly: p.prijs_kadoly, keur: p.keur })).sort((a, b) => b.keur.score - a.keur.score) });
      const inBrug = new Set(feed.producten.map(p => p.sku).filter(Boolean)); const titels = new Map(feed.producten.map(p => [p.sku, p.titel])); const onderdelen = new Set(feed.producten.filter(p => p.fitting_sku).map(p => p.fitting_sku));
      uit.catalogus = (op === 'nacht' || q.get('vers')) ? await dpKeurCatalogus({ inBrug, onderdelen, titels }) : (await dpKeurLaatste()) || { ok: false, fout: 'nog geen keuring van de catalogus (token of nachtronde)' };
      if (q.get('kort')) { uit.brug.lijst = uit.brug.lijst.slice(0, 40); if (uit.catalogus && uit.catalogus.importeer) uit.catalogus.importeer = uit.catalogus.importeer.slice(0, 60); }
      return res.status(200).json(uit);
    }
    if (op === 'stand') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json(await dpStand()); }
    if (op === 'log') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json(await dpLog(Number(q.get('n')) || 100)); }
    if (op === 'feed') { if (!beschermd && !lus) return res.status(401).json({ ok: false, fout: 'X-Lus-Key ontbreekt' }); return res.status(200).json(await dpFeed()); }
    if (op === 'order') {
      if (!lus) return res.status(401).json({ ok: false, fout: 'X-Lus-Key ontbreekt' });
      if (req.method !== 'POST') return res.status(405).json({ ok: false, fout: 'POST' });
      const b = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
      const r = await dpNieuweOrder(b); return res.status(r.ok ? 200 : 400).json(r);
    }
    if (op === 'status') { if (!lus && !beschermd) return res.status(401).json({ ok: false, fout: 'X-Lus-Key ontbreekt' }); return res.status(200).json(await dpOrderStatus(q.get('order'))); }
    return res.status(404).json({ ok: false, fout: 'onbekend' });
  } catch (e) { return res.status(500).json({ ok: false, fout: String(e.message || e).slice(0, 200) }); }
}
