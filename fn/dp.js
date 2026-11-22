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
//   AW Dropship EU (lib/awdrop.js, 21 nov 2026): op=awfeed (X-Lus-Key), op=awkeur (cron 05:23 UTC), op=awtoken, op=awstand,
//   op=awapi (beschermde host), POST op=aworder (X-Lus-Key; mandje bij AW, betalen alleen met kv aw:order:auto = ja)
import { wcRoute, dpSleutels, dpStand, dpLog, dpFeed, dpNieuweOrder, dpOrderStatus, DP_HOST } from '../lib/droppery.js';
import { dpProbe, dpTokenZet, dpTokenStand, dpApi, dpScan, dpKeurCatalogus, dpKeurLaatste, vraagIdx } from '../lib/dpapi.js';
import { keurStand } from '../lib/dpkeur.js';
import { laterAf } from '../lib/mensmeter.js';
import { awTokenZet, awTokenStand, awKeur, awKeurLaatste, awFeed, awApi, awNieuweOrder, awOrders, awZoek, awPakketten, logRegel as awLog } from '../lib/awdrop.js';

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
      const feed = { producten: [], vraagdata: false }; for (let s = 0; s < 5000; s += 500) { const f = await dpFeed({ start: s, size: 500 }); feed.producten.push(...f.producten); feed.vraagdata = f.vraagdata; if (!f.volgende) break; } uit.brug = Object.assign(keurStand(feed.producten), { vraagdata: feed.vraagdata, lijst: feed.producten.map(p => ({ sku: p.sku, titel: p.titel, categorie: p.categorie, prijs_kadoly: p.prijs_kadoly, keur: p.keur })).sort((a, b) => b.keur.score - a.keur.score) });
      const inBrug = new Set(feed.producten.map(p => p.sku).filter(Boolean)); const titels = new Map(feed.producten.map(p => [p.sku, p.titel])); const onderdelen = new Set(feed.producten.filter(p => p.fitting_sku).map(p => p.fitting_sku));
      uit.catalogus = (op === 'nacht' || q.get('vers')) ? await dpKeurCatalogus({ inBrug, onderdelen, titels }) : (await dpKeurLaatste()) || { ok: false, fout: 'nog geen keuring van de catalogus (token of nachtronde)' };
      if (q.get('kort')) { uit.brug.lijst = uit.brug.lijst.slice(0, 40); if (uit.catalogus && uit.catalogus.importeer) uit.catalogus.importeer = uit.catalogus.importeer.slice(0, 60); }
      return res.status(200).json(uit);
    }
    // AW Dropship EU (lib/awdrop.js, 21 nov 2026): eigen hoek "Rust & ritueel" in Kadoly
    if (op === 'awtoken') {
      if (!beschermd) return res.status(404).send('Niet gevonden');
      let melding = '';
      if (req.method === 'POST') { const b = typeof req.body === 'object' && req.body ? req.body : Object.fromEntries(new URLSearchParams(String(req.body || ''))); const r = await awTokenZet(b.token); melding = r.ok ? `<p style="background:#e6f4ea;color:#0a5c2b;padding:12px;border-radius:8px"><b>Gelukt.</b> AW antwoordt${r.profiel && r.profiel.naam ? ' (' + esc(r.profiel.naam) + ')' : ''}. Orders van Kadoly worden nu mandjes bij AW; je mag dit venster sluiten.</p>` : `<p style="background:#fde8e8;color:#8a1010;padding:12px;border-radius:8px"><b>Niet gelukt.</b> ${esc(r.fout)}</p>`; }
      const st = await awTokenStand(); res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AW API-token</title><body style="font:16px/1.5 system-ui;max-width:640px;margin:32px auto;padding:0 16px;color:#0b1620"><h1 style="font-size:24px">AW Dropship API-token voor Kadoly</h1>${melding}<p>${st.klaar ? 'Er staat al een token (sinds ' + esc(st.sinds || 'eerder') + '). Plak hieronder alleen een nieuw token als je het vervangt.' : 'Ga in <b>aw-dropship.eu</b> naar <b>Channels, Kadoly (Manual/API), Api</b>, druk op <b>Generate API token</b> en kopieer het hele token uit de popup. AW laat hem maar één keer zien.'}</p><form method="post"><p><label for="t"><b>Token</b></label><br><input id="t" name="token" type="password" autocomplete="off" required style="width:100%;font:16px monospace;padding:10px;border:2px solid #0b1620;border-radius:8px"></p><p><button style="font:700 16px system-ui;padding:12px 20px;border:0;border-radius:999px;background:#0b1620;color:#fff">Opslaan en testen</button></p></form><p>Het token wordt opgeslagen en nergens getoond. Deze pagina staat achter de Vercel-inlog.</p></body>`);
    }
    if (op === 'awkeur') { if (!beschermd && !lus && !cron) return res.status(404).send('Niet gevonden'); const k = await awKeur({ vers: true }); delete k.lijst; if (cron) await awLog('AW-keuring: ' + k.stand.inWinkel + ' van ' + k.inAanmerking + ' producten naar Rust & ritueel (' + Object.entries(k.perHoek).map(([h, n]) => h + ' ' + n).join(', ') + ')'); return res.status(200).json(k); }
    if (op === 'awfeed') { if (!beschermd && !lus) return res.status(401).json({ ok: false, fout: 'X-Lus-Key ontbreekt' }); return res.status(200).json(await awFeed({ start: q.get('start'), size: q.get('size'), alles: !!q.get('alles') && beschermd })); }
    if (op === 'awzoek') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json(await awZoek({ q: q.get('q'), min: q.get('min'), max: q.get('max'), n: q.get('n') })); }
    if (op === 'awpakket') { if (!beschermd && !lus) return res.status(404).send('Niet gevonden'); let kand = null; if (q.get('kern')) kand = [{ id: 'proef', slug: 'proef', naam: 'Proef', kern: q.get('kern').split(',').map(x => { const [s, n] = x.split('*'); return [s, Number(n) || 1]; }) }]; return res.status(200).json(await awPakketten({ kandidaten: kand })); }
    if (op === 'hoeken') { if (!beschermd && !lus) return res.status(404).send('Niet gevonden'); const { hoekenStand, HOEK_REGEL } = await import('../lib/hoeken.js'); return res.status(200).json({ regel: HOEK_REGEL, hoeken: await hoekenStand() }); }
    if (op === 'awlijst') { // 21 nov (Henkjan: "Geef me link van kadoly AW producten"): overzicht van wat de shop in de hoek Rust & ritueel moet zetten
      if (!beschermd) return res.status(404).send('Niet gevonden');
      const f = await awFeed({ size: 500 }); const eur = v => '€ ' + Number(v || 0).toFixed(2).replace('.', ',');
      const pak = (f.pakketten || []).map(p => `<div class="k"><div class="b">${p.regels.map(r => r.beeld ? `<img src="${esc(r.beeld)}" alt="">` : '').join('')}</div><h3>${esc(p.naam)}</h3><p>${esc(p.verhaal)}</p><p><b>${eur(p.prijs)}</b> <s>${eur(p.los)}</s> + ${eur(p.verzending_klant)} verzending</p><ul>${p.regels.map(r => `<li>${esc(r.naam)} (${eur(r.los)})</li>`).join('')}</ul></div>`).join('');
      const groep = {}; for (const p of f.producten.filter(x => x.rol === 'product')) (groep[p.subcategorie] = groep[p.subcategorie] || []).push(p);
      const prod = Object.entries(groep).sort((a, b) => b[1].length - a[1].length).map(([g, l]) => `<h2>${esc(g)} (${l.length})</h2><div class="g">${l.map(p => `<div class="k"><div class="b">${p.beelden[0] ? `<img src="${esc(p.beelden[0])}" alt="">` : ''}</div><h3>${esc(p.titel_en)}</h3><p><b>${eur(p.prijs_kadoly)}</b> · marge ${eur(p.keur.marge)}${p.keur.vraag && p.keur.vraag.term ? ' · zoekterm "' + esc(p.keur.vraag.term) + '" ' + Number(p.keur.vraag.perMaand).toLocaleString('nl-NL') + ' per maand' : ''}</p><p>${esc(p.aw_sku)} · voorraad ${p.voorraad}</p></div>`).join('')}</div>`).join('');
      res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Rust & ritueel: AW-producten</title><style>body{font:16px/1.5 Inter,system-ui;margin:0 auto;max-width:1100px;padding:16px;color:#0b1620;background:#fff}h1{font-size:30px;margin:8px 0}h2{font-size:24px;margin:28px 0 8px}h3{font-size:18px;margin:8px 0 4px}p{margin:4px 0}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}.k{border:2px solid #0b1620;border-radius:12px;padding:12px}.b{display:flex;gap:4px;overflow:hidden}.b img{width:100%;max-width:200px;aspect-ratio:1;object-fit:cover;border-radius:8px}.p .b img{max-width:90px}s{color:#8a1010}ul{margin:6px 0;padding-left:18px}</style><h1>Rust & ritueel</h1><p>${f.pakketten.length} pakketten en ${f.producten.filter(x => x.rol === 'product').length} producten van AW Dropship, goedgekeurd door de keuring van ${esc(f.bijgewerkt)} UTC. Titels nog in het Engels: de shop vertaalt ze bij het importeren (TAAK A). Nog niet live op kadoly.com.</p><h2>Pakketten</h2><div class="g p">${pak}</div>${prod}</body>`);
    }
    // Shopify-inkoopwinkel (lib/shophub.js, 21 nov 2026): elke Shopify-dropship-app (Syncee, Gelato, Printful ...) achter Kadoly
    if (op === 'shtoken') {
      if (!beschermd) return res.status(404).send('Niet gevonden');
      const { shZet, shStandToegang } = await import('../lib/shophub.js'); let melding = '';
      if (req.method === 'POST') { const b = typeof req.body === 'object' && req.body ? req.body : Object.fromEntries(new URLSearchParams(String(req.body || ''))); const r = await shZet({ shop: b.shop, id: b.id, geheim: b.geheim }); melding = r.oauth ? `<p style="background:#fff4d6;color:#5a3d00;padding:12px;border-radius:8px"><b>Bijna.</b> Gegevens opgeslagen; de directe route mag niet (${esc(r.fout)}). Geef toestemming in Shopify:</p><p><a href="/api/dp?op=shauth" style="display:inline-block;font:700 16px system-ui;padding:12px 20px;border-radius:999px;background:#0b1620;color:#fff;text-decoration:none">Koppel via Shopify</a></p>` : r.ok ? `<p style="background:#e6f4ea;color:#0a5c2b;padding:12px;border-radius:8px"><b>Gelukt.</b> ${esc((r.winkel && r.winkel.name) || 'De winkel')} antwoordt, ${esc(String(r.producten == null ? '' : r.producten))} producten. Rechten: ${esc(r.scopes || '')}</p>` : `<p style="background:#fde8e8;color:#8a1010;padding:12px;border-radius:8px"><b>Niet gelukt.</b> ${esc(r.fout)}</p>`; }
      const st = await shStandToegang(); const veld = (n, l, t, v) => `<p><label for="${n}"><b>${l}</b></label><br><input id="${n}" name="${n}" type="${t}" autocomplete="off" required value="${esc(v || '')}" style="width:100%;font:16px monospace;padding:10px;border:2px solid #0b1620;border-radius:8px"></p>`;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Inkoopwinkel koppelen</title><body style="font:16px/1.5 system-ui;max-width:640px;margin:32px auto;padding:0 16px;color:#0b1620"><h1 style="font-size:24px">Kadoly Inkoop (Shopify) koppelen</h1>${melding}<p>${st.klaar ? 'Gekoppeld met ' + esc(st.winkel) + '.myshopify.com sinds ' + esc(st.sinds) + '. Vul alleen opnieuw in als je de app vervangt.' : 'Vul de gegevens van de app uit het Shopify Dev Dashboard in (Settings van de app).'}</p><form method="post">${veld('shop', 'Winkeladres (…myshopify.com)', 'text', q.get('shop') || (st.winkel ? st.winkel + '.myshopify.com' : ''))}${veld('id', 'Client ID', 'text', q.get('id') || '')}${veld('geheim', 'Client secret (Dev Dashboard, app Kadoly brug, Overview, Credentials: kopieerknop)', 'password')}<p><button style="font:700 16px system-ui;padding:12px 20px;border:0;border-radius:999px;background:#0b1620;color:#fff">Opslaan en testen</button></p></form><p>Wordt opgeslagen en nergens getoond. Deze pagina staat achter de Vercel-inlog.</p></body>`);
    }
    if (op === 'kadolyhtml') { // 21 nov: vormgeving van kadoly.com ophalen voor het Shopify-thema (alleen beschermde host)
      if (!beschermd) return res.status(404).send('Niet gevonden');
      const pad = String(q.get('u') || '/').replace(/^https?:\/\/[^/]+/, ''); if (!/^\/[\w\-\/.?=&%]*$/.test(pad)) return res.status(400).send('pad');
      const r = await fetch('https://kadoly.com' + pad, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36', 'accept-language': 'nl-NL,nl' }, signal: AbortSignal.timeout(20000) });
      res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(r.status).send(await r.text());
    }
    if (op === 'shauth') { // start (zonder code) of terugkeer van Shopify (met code)
      if (!beschermd) return res.status(404).send('Niet gevonden');
      const H = await import('../lib/shophub.js');
      if (!q.get('code')) { const s0 = await H.shAuthStart(); if (s0.fout) return res.status(400).send(esc(s0.fout)); res.setHeader('location', s0.url); return res.status(302).end(); }
      const r = await H.shAuthTerug(q); res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Inkoopwinkel</title><body style="font:16px/1.5 system-ui;max-width:640px;margin:32px auto;padding:0 16px;color:#0b1620"><h1 style="font-size:24px">Kadoly Inkoop</h1>${r.ok ? `<p style="background:#e6f4ea;color:#0a5c2b;padding:12px;border-radius:8px"><b>Gekoppeld.</b> ${esc((r.winkel && r.winkel.name) || 'De winkel')} antwoordt, ${esc(String(r.producten == null ? 0 : r.producten))} producten. Je mag dit venster sluiten.</p>` : `<p style="background:#fde8e8;color:#8a1010;padding:12px;border-radius:8px"><b>Niet gelukt.</b> ${esc(r.fout)}</p>`}</body>`);
    }
    if (op === 'shthemazip') { // Shopify haalt het thema op (openbare host, eenmalige sleutel van op=shthema&doe=maak)
      const T = await import('../lib/shoptheme.js');
      if (!(await T.themaZipSleutel(String(q.get('k') || '')))) return res.status(404).send('Niet gevonden');
      const z = T.zip(await T.bouwThema()); res.setHeader('content-type', 'application/zip'); res.setHeader('content-disposition', 'attachment; filename="kadoly-thema.zip"'); return res.status(200).send(z);
    }
    if (op === 'shvernieuw' || op === 'shthema') {
      if (!beschermd && !(cron && op === 'shthema' && q.get('doe') === 'sync')) return res.status(404).send('Niet gevonden');
      if (op === 'shvernieuw') { const H = await import('../lib/shophub.js'); return res.status(200).json(await H.shVernieuw()); }
      if (q.get('doe') === 'levertijd') { const H = await import('../lib/shophub.js'); return res.status(200).json(await H.shLevertijd({ merk: q.get('merk') || '', min: q.get('min'), max: q.get('max') })); }
      if (q.get('doe') === 'meta') { const H = await import('../lib/shophub.js'); return res.status(200).json(await H.shMeta()); }
      if (q.get('doe') === 'opschonen') { const H = await import('../lib/shophub.js'); return res.status(200).json(await H.shOpschonen({ proef: q.get('proef') === '1' })); }
      if (q.get('doe') === 'verzend' || q.get('doe') === 'verzendzet') { const H = await import('../lib/shophub.js'); return res.status(200).json(q.get('doe') === 'verzend' ? await H.shVerzendStand() : await H.shVerzendZet({ proef: q.get('proef') === '1' })); }
      const T = await import('../lib/shoptheme.js'); const doe = String(q.get('doe') || 'stand');
      if (doe === 'maak') return res.status(200).json(await T.themaMaak({}));
      if (doe === 'sync') { const r = await T.themaSync({}); if (cron && !r.ok && r.fout !== 'nog geen thema (op=shthema&doe=maak)') await awLog('Kadoly-thema Shopify: bijwerken uit kadoly.com mislukt: ' + (r.fouten || [r.fout]).join('; ').slice(0, 200)); return res.status(200).json(r); }
      if (doe === 'publiceer') { if (q.get('ja') !== 'henkjan') return res.status(400).json({ ok: false, fout: 'live zetten alleen op Henkjans woord: &ja=henkjan' }); return res.status(200).json(await T.themaPubliceer()); }
      if (doe === 'bestand') { const f = await T.bouwThema(); const n = String(q.get('n') || ''); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(f[n] ? 200 : 404).send(f[n] || Object.keys(f).map(k => k + ' ' + f[k].length).join('\n')); }
      return res.status(200).json(await T.themaStand());
    }
    if (op === 'shstand' || op === 'shscan' || op === 'shnacht' || op === 'shfeed' || op === 'shorder') {
      const H = await import('../lib/shophub.js');
      if (op === 'shstand') { if (!beschermd) return res.status(404).send('Niet gevonden'); const k = await H.shKeur(); delete k.lijst; return res.status(200).json({ toegang: await H.shStandToegang(), keuring: k, orders: await H.shOrders() }); }
      if (op === 'shscan' || op === 'shnacht') { if (!beschermd && !cron) return res.status(404).send('Niet gevonden'); const st = await H.shStandToegang(); if (!st.klaar) return res.status(200).json({ ok: false, fout: 'nog niet gekoppeld (op=shtoken)' }); const r = await H.shScan({}); if (r.ok && op === 'shnacht') { try { const o = await H.shOpschonen({}); if (o.concept && o.concept.length) await awLog('Inkoopwinkel: ' + o.concept.length + ' afgekeurde producten op concept (' + o.concept.slice(0, 5).map(c => c.merk + ': ' + c.titel).join(', ') + ')'); } catch (e) {} } const k = await H.shKeur(); if (cron && r.ok) await awLog('Inkoopwinkel: ' + r.varianten + ' varianten gelezen, ' + k.stand.inWinkel + ' goedgekeurd (' + Object.values(k.perHoek).map(h => h.leverancier + ' ' + h.n).join(', ') + ')'); return res.status(200).json(Object.assign(r, { goedgekeurd: k.stand.inWinkel, perHoek: k.perHoek })); }
      if (op === 'shfeed') { if (!beschermd && !lus) return res.status(401).json({ ok: false, fout: 'X-Lus-Key ontbreekt' }); return res.status(200).json(await H.shFeed({ start: q.get('start'), size: q.get('size') })); }
      if (op === 'shorder') { if (!lus) return res.status(401).json({ ok: false, fout: 'X-Lus-Key ontbreekt' }); if (req.method !== 'POST') return res.status(405).json({ ok: false, fout: 'POST' }); const b = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}'); const r = await H.shOrder(b); return res.status(r.ok ? 200 : 400).json(r); }
    }
    if (op === 'awstand') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json({ token: await awTokenStand(), keuring: await awKeurLaatste(), orders: await awOrders() }); }
    if (op === 'awapi') { if (!beschermd) return res.status(404).send('Niet gevonden'); const pad = String(q.get('pad') || 'user-profile').replace(/[^a-z0-9/_-]/gi, '').slice(0, 80); const params = {}; for (const [k, v] of q.entries()) if (!['op', 'pad'].includes(k)) params[k] = v; const r = await awApi(pad, { params }); return res.status(200).json({ st: r.st, fout: r.fout || null, data: r.data, tekst: r.tekst }); }
    if (op === 'aworder') {
      if (!lus) return res.status(401).json({ ok: false, fout: 'X-Lus-Key ontbreekt' });
      if (req.method !== 'POST') return res.status(405).json({ ok: false, fout: 'POST' });
      const b = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
      const r = await awNieuweOrder(b); return res.status(r.ok ? 200 : 400).json(r);
    }
    if (op === 'stand') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json(await dpStand()); }
    if (op === 'log') { if (!beschermd) return res.status(404).send('Niet gevonden'); return res.status(200).json(await dpLog(Number(q.get('n')) || 100)); }
    if (op === 'feed') { if (!beschermd && !lus) return res.status(401).json({ ok: false, fout: 'X-Lus-Key ontbreekt' }); return res.status(200).json(await dpFeed({ start: q.get('start'), size: q.get('size') })); }
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
