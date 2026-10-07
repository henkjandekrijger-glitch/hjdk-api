// /setup — invoerpagina voor bol-sleutels (één keer, alles tegelijk). Beveiligd met de HJDK-token (env HJDK_TOKEN).
// GET  : formulier + status (alleen "ingesteld: ja/nee", nooit de waarden)
// POST : {token, BOL_CLIENT_ID, BOL_CLIENT_SECRET, BOL_REPORT_CLIENT_ID, BOL_REPORT_CLIENT_SECRET, AMZ_ACCESS_KEY, AMZ_SECRET_KEY, AMZ_PARTNER_TAG, AMZ_MARKETPLACE} -> test bij bol/Amazon -> opslaan in KV 'hjdk:secrets'
import { kv } from '../lib/db.js';
import { getToken, forgetCreds, catalog } from '../lib/bol.js';
import { paapi, forgetAmzCreds } from '../lib/amz.js';
import { getApp as pinApp, authUrl as pinAuthUrl, tokenStatus as pinStatus } from '../lib/pinterest.js';
import { randomBytes } from 'node:crypto';

const KEYS = ['BOL_CLIENT_ID', 'BOL_CLIENT_SECRET', 'BOL_REPORT_CLIENT_ID', 'BOL_REPORT_CLIENT_SECRET', 'AMZ_ACCESS_KEY', 'AMZ_SECRET_KEY', 'AMZ_PARTNER_TAG', 'AMZ_MARKETPLACE', 'PINTEREST_APP_ID', 'PINTEREST_APP_SECRET', 'RESEND_API_KEY', 'GOOGLE_CLIENT_ID', 'KZ_WRITE_KEY', 'ANTHROPIC_API_KEY', 'PINTEREST_VERIFY'];
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function status() {
  let s = {}; try { s = (await kv.get('hjdk:secrets')) || {}; } catch (e) {}
  const st = {}; KEYS.forEach(k => { st[k] = process.env[k] ? 'env' : (s[k] ? 'setup' : 'leeg'); });
  return st;
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method === 'POST') {
    let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) { b = {}; }
    if (!process.env.HJDK_TOKEN) return res.status(500).json({ error: 'HJDK_TOKEN ontbreekt in Vercel (Settings → Environment Variables). Zet die eerst.' });
    if (String(b.token || '') !== process.env.HJDK_TOKEN) return res.status(401).json({ error: 'HJDK-token klopt niet' });
    let cur = {}; try { cur = (await kv.get('hjdk:secrets')) || {}; } catch (e) {}
    if (b.action === 'pinterest-auth') { // koppel-link maken: state 10 minuten geldig, alleen via deze (token-beveiligde) weg
      const app = await pinApp(); if (!app) return res.status(400).json({ error: 'Eerst Pinterest app-id en secret opslaan.' });
      const state = randomBytes(16).toString('hex'); await kv.set('hjdk:pinterest:state:' + state, { at: Date.now() }, { ex: 600 });
      return res.status(200).json({ ok: true, url: pinAuthUrl(app, state) });
    }
    const next = Object.assign({}, cur);
    KEYS.forEach(k => { const v = String(b[k] || '').trim(); if (v) next[k] = v; });
    // testen vóór opslaan: token ophalen bij bol met de nieuwe waarden
    const out = {};
    const mk = next.BOL_CLIENT_ID && next.BOL_CLIENT_SECRET ? await getToken('marketing', { id: next.BOL_CLIENT_ID, secret: next.BOL_CLIENT_SECRET }) : { error: 'niet ingevuld' };
    out.marketing = mk.error ? 'FOUT: ' + mk.error : 'OK (token ontvangen)';
    const rp = next.BOL_REPORT_CLIENT_ID && next.BOL_REPORT_CLIENT_SECRET ? await getToken('report', { id: next.BOL_REPORT_CLIENT_ID, secret: next.BOL_REPORT_CLIENT_SECRET }) : { error: 'niet ingevuld' };
    out.reporting = rp.error ? 'FOUT: ' + rp.error : 'OK (token ontvangen)';
    if (next.AMZ_ACCESS_KEY && next.AMZ_SECRET_KEY && next.AMZ_PARTNER_TAG) {
      if (!/^[a-z0-9-]+-2[01]$/i.test(next.AMZ_PARTNER_TAG)) out.amazon = 'FOUT: partner-tag hoort te eindigen op -21 (EU) of -20 (US), bijv. yoorsnl-21';
      else { try { const j = await paapi('SearchItems', { Keywords: 'afvalemmer', ItemCount: 1, Resources: ['ItemInfo.Title', 'Offers.Listings.Price'] }, { key: next.AMZ_ACCESS_KEY, secret: next.AMZ_SECRET_KEY, tag: next.AMZ_PARTNER_TAG, market: next.AMZ_MARKETPLACE || 'www.amazon.nl' }); const it = j.SearchResult && j.SearchResult.Items && j.SearchResult.Items[0]; const pr = it && it.Offers && it.Offers.Listings && it.Offers.Listings[0] && it.Offers.Listings[0].Price; out.amazon = it ? 'OK: zoekproef ' + String(it.ItemInfo && it.ItemInfo.Title ? it.ItemInfo.Title.DisplayValue : it.ASIN).slice(0, 60) + (pr ? ' ' + pr.DisplayAmount : '') : 'OK (token geaccepteerd, geen resultaat)'; } catch (e) { out.amazon = 'FOUT: ' + String(e && e.message || e).slice(0, 200); } }
    } else out.amazon = next.AMZ_PARTNER_TAG && !next.AMZ_ACCESS_KEY ? 'alleen partner-tag: de brug toont een Amazon-knop zonder prijs (prijzen komen pas met PA-API-sleutels)' : (next.AMZ_ACCESS_KEY || next.AMZ_SECRET_KEY ? 'onvolledig (access key, secret én partner-tag nodig)' : 'niet ingevuld');
    out.pinterest = next.PINTEREST_APP_ID && next.PINTEREST_APP_SECRET ? 'app-id en secret opgeslagen — klik daarna op "Verbind Pinterest"' : 'niet ingevuld';
    try { await kv.set('hjdk:secrets', next); forgetCreds(); forgetAmzCreds(); out.opgeslagen = true; } catch (e) { out.opgeslagen = false; out.fout = String(e && e.message || e); }
    if (!mk.error) { try { const j = await catalog('/products/search', { 'search-term': 'afvalemmer', 'country-code': 'NL', 'page-size': 1, 'include-offer': true }, 'nl-NL'); const p = (j.results || j.products || [])[0]; out.proef = p ? 'zoekproef OK: ' + String(p.title || '').slice(0, 60) + (p.offer && p.offer.price != null ? ' €' + p.offer.price : '') : 'zoekproef: geen resultaat'; } catch (e) { out.proef = 'zoekproef FOUT: ' + String(e && e.message || e).slice(0, 160); } }
    return res.status(200).json(out);
  }
  const st = await status();
  const row = (k, label) => `<label>${label}<br><input name="${k}" type="password" autocomplete="off" placeholder="${st[k] === 'leeg' ? 'nog leeg' : 'ingesteld (' + st[k] + ') — laat leeg om te behouden'}"></label>`;
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>hjdk-api · sleutels</title>
<style>body{margin:0;font:16px/1.5 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;background:#f6f7f9;color:#111}main{max-width:560px;margin:0 auto;padding:24px 16px}.c{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:20px}h1{font-size:20px;margin:0 0 6px}p{color:#374151;margin:0 0 14px}label{display:block;margin:12px 0 0;font-weight:600;font-size:14px}input{width:100%;box-sizing:border-box;font:16px system-ui;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;margin-top:4px}button{margin-top:18px;width:100%;background:#0000ff;color:#fff;border:0;border-radius:10px;padding:14px;font-size:17px;font-weight:700}button:disabled{opacity:.5}pre{white-space:pre-wrap;background:#f3f4f6;padding:12px;border-radius:8px;font-size:13px;margin-top:14px}small{color:#6b7280;display:block;margin-top:10px}</style></head>
<body><main><div class="c"><h1>bol- en Amazon-sleutels invoeren</h1><p>Alles in één keer (wat je leeg laat blijft staan). De waarden worden direct bij bol/Amazon getest en daarna server-side opgeslagen; ze verschijnen nergens terug.</p>
<form id="f">
<label>HJDK-token (dezelfde als HJDK_TOKEN in Vercel)<br><input name="token" type="password" autocomplete="off" required></label>
<h3 style="margin:18px 0 0;font-size:15px">Marketing (Catalog) API</h3>${row('BOL_CLIENT_ID', 'Client ID')}${row('BOL_CLIENT_SECRET', 'Client Secret')}
<h3 style="margin:18px 0 0;font-size:15px">Reporting API</h3>${row('BOL_REPORT_CLIENT_ID', 'Client ID')}${row('BOL_REPORT_CLIENT_SECRET', 'Client Secret')}
<h3 style="margin:18px 0 0;font-size:15px">Amazon PA-API (Product Advertising API)</h3>${row('AMZ_ACCESS_KEY', 'Access key')}${row('AMZ_SECRET_KEY', 'Secret key')}<label>Partner-tag (store-ID van de marktplaats hieronder, bijv. yoorsnl-21)<br><input name="AMZ_PARTNER_TAG" autocomplete="off" placeholder="${st.AMZ_PARTNER_TAG === 'leeg' ? 'nog leeg' : 'ingesteld (' + st.AMZ_PARTNER_TAG + ') — laat leeg om te behouden'}"></label><label>Marktplaats<br><select name="AMZ_MARKETPLACE"><option value="">(behouden / standaard www.amazon.nl)</option><option>www.amazon.nl</option><option>www.amazon.de</option><option>www.amazon.com.be</option><option>www.amazon.co.uk</option><option>www.amazon.com</option></select></label>
<h3 style="margin:18px 0 0;font-size:15px">Pinterest (app uit developers.pinterest.com, redirect-URI: https://hjdk-api.vercel.app/api/pinterest/callback)</h3>${row('PINTEREST_APP_ID', 'App ID')}${row('PINTEREST_APP_SECRET', 'App secret')}<p style="margin:8px 0 0;font-size:14px">Status Pinterest: <b>${esc(await pinStatus())}</b> · <a href="#" id="pa">Verbind Pinterest</a> (vul eerst je HJDK-token hierboven in)</p>
<h3 style="margin:18px 0 0;font-size:15px">Resend (mail: keuzehulp-abonnees, deals-mail, Lasting Change)</h3>${row('RESEND_API_KEY', 'Resend API key (begint met re_)')}
<h3 style="margin:18px 0 0;font-size:15px">Keuzehulp (keuzehulp.best)</h3>${row('KZ_WRITE_KEY', 'Schrijfsleutel voor de cloudtaak die nieuwe keuzehulpen plaatst — verzin zelf iets van minstens 20 tekens')}${row('GOOGLE_CLIENT_ID', 'Google client-ID voor de 1-klik Google-aanmelding (optioneel)')}${row('PINTEREST_VERIFY', 'Pinterest-websiteclaim: de code uit de meta-tag p:domain_verify (Pinterest > Instellingen > Geclaimde accounts > Website claimen)')}${row('ANTHROPIC_API_KEY', 'Claude API-sleutel (console.anthropic.com, begint met sk-ant-) — maakt elke dag nieuwe keuzehulpen')}
<button id="b" type="submit">Testen en opslaan</button></form>
<pre id="o" hidden></pre>
<small>Status nu: ${KEYS.map(k => k.toLowerCase() + ' = ' + esc(st[k])).join(' · ')}</small></div></main>
<script>document.getElementById('pa').addEventListener('click',async function(e){e.preventDefault();var t=document.querySelector('input[name=token]').value;var o=document.getElementById('o');o.hidden=false;o.textContent='Koppel-link maken...';try{var r=await fetch('/api/setup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:t,action:'pinterest-auth'})});var j=await r.json();if(j.url){location.href=j.url;}else{o.textContent=j.error||JSON.stringify(j);}}catch(err){o.textContent='Mislukt: '+err;}});
document.getElementById('f').addEventListener('submit',async function(e){e.preventDefault();var b=document.getElementById('b'),o=document.getElementById('o');b.disabled=true;o.hidden=false;o.textContent='Bezig: testen bij bol/Amazon...';var d={};new FormData(e.target).forEach(function(v,k){d[k]=v;});try{var r=await fetch('/api/setup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)});var j=await r.json();o.textContent=Object.keys(j).map(function(k){return k+': '+j[k];}).join('\\n');if(j.opgeslagen){e.target.reset();}}catch(err){o.textContent='Mislukt: '+err;}b.disabled=false;});</script></body></html>`;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
