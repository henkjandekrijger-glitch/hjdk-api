// Pinterest: elke dag automatisch pins naar Yoors-pagina's (cron), plus verbinden en wachtrij. Via rewrite /api/pinterest/:op en /pins.
//   GET  /api/pinterest/callback?code&state   <- Pinterest stuurt hierheen na "Verbind Pinterest" (state komt uit /setup)
//   GET  /api/pinterest/status                -> verbonden? boards? wachtrij? laatste pins (geen geheimen)
//   GET  /api/pinterest/post[?n=2]            -> cron: n pins plaatsen (wachtrij eerst, dan automatisch de best lopende Yoors-pagina's)
//   GET  /pins                                -> pagina om URL's in de wachtrij te zetten (HJDK-token)
//   POST /api/pinterest/queue {token, urls}   -> wachtrij vullen; regel: <url> | <bordnaam optioneel>
import { kv } from '../lib/db.js';
import kzSeed from '../data/kz.json' with { type: 'json' };
import { getApp, exchangeCode, tokenStatus, listBoards, ensureBoard, createPin } from '../lib/pinterest.js';

const QUEUE = 'hjdk:pins:queue', LOG = 'hjdk:pins:log';
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
// bord kiezen op woorden in de titel/slug
const BOARDS = [
  [/kleurplaat|kleuren op nummer|dobbel/i, 'Kleurplaten'],
  [/haak|haken|brei|patroon|wol|amigurumi/i, 'Haken en breien'],
  [/bak|taart|koek|trakt|recept|cupcake/i, 'Bakken en traktaties'],
  [/knutsel|strijkkralen|diy|maken|vouwen|ijzerdraad/i, 'Knutselen met kinderen'],
  [/vaderdag|moederdag|sinterklaas|kerst|halloween|pasen|verjaardag|feest/i, 'Feestdagen en cadeaus'],
  [/keuken|huishouden|opberg|schoonmaak|wonen|inrichten/i, 'Slim wonen en huishouden']
];
const boardFor = t => { for (const [re, name] of BOARDS) if (re.test(t)) return name; return 'Yoors ideeën'; };

async function pageInfo(url) {
  const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; hjdk-pins/1.0)', accept: 'text/html' }, redirect: 'follow', signal: ctrl.signal }); clearTimeout(tm);
    if (!r.ok) return { error: 'pagina ' + r.status };
    const html = await r.text();
    const og = re => { const m = html.match(re); return m ? clean(m[1]) : ''; };
    const title = og(/property="og:title"\s+content="([^"]*)"/i) || og(/<title>([^<]*)<\/title>/i) || og(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const image = og(/property="og:image"\s+content="([^"]*)"/i);
    const desc = og(/property="og:description"\s+content="([^"]*)"/i) || og(/name="description"\s+content="([^"]*)"/i);
    return { title: title.replace(/\s*[|\-–—:]\s*(yoors|yoo\.rs)\s*$/i, '').slice(0, 100), image, desc: desc.slice(0, 400) };
  } catch (e) { clearTimeout(tm); return { error: String(e && e.message || e).slice(0, 100) }; }
}
// automatisch kandidaten: Yoors-pagina's waar de bol-banner het vaakst een product plaatste (tellers hjdk6-pick-<slug>-ok), nog niet gepind
async function autoCandidates(limit) {
  const out = []; let cursor = '0';
  for (let i = 0; i < 40; i++) { const [c, keys] = await kv.scan(cursor, { match: 'c:hjdk6-pick-*-ok', count: 1000 }); cursor = c; for (const k of keys) out.push(k); if (cursor === '0') break; }
  if (!out.length) return [];
  const vals = await kv.mget(...out);
  const rows = out.map((k, i) => ({ slug: k.replace(/^c:hjdk6-pick-/, '').replace(/-ok$/, ''), n: Number(vals[i]) || 0 })).filter(r => r.n >= 3 && r.slug.length < 60 && !/^(home|faviconico|x|test)$/.test(r.slug)).sort((a, b) => b.n - a.n);
  const res = [];
  for (const r of rows) { if (res.length >= limit) break; const done = await kv.get('hjdk:pins:done:' + r.slug); if (done) continue; res.push({ url: 'https://yoo.rs/' + r.slug.replace(/-html$/, '.html'), slug: r.slug, auto: true }); }
  return res;
}

// keuzehulp.best: per run een paar keuzehulpen pinnen die nog niet gepind zijn (nieuwste eerst, ook de dagelijks gemaakte), met het eigen pin-beeld
async function kzCandidates(k) {
  const today = new Date().toISOString().slice(0, 10); let extra = [];
  try { const idx = (await kv.get('hjdk:kz:index')) || []; const vals = idx.length ? await kv.mget(...idx.map(s => 'hjdk:kz:' + s)) : []; extra = vals.filter(v => v && v.slug && v.title && !v.override); } catch (e) {}
  const seen = new Set(); const items = extra.concat(kzSeed.items || []).filter(i => { if (seen.has(i.slug)) return false; seen.add(i.slug); return !i.publishAt || i.publishAt <= today; }).sort((a, b) => String(b.publishAt || '').localeCompare(String(a.publishAt || '')));
  const out = []; for (const i of items) { if (out.length >= k) break; const done = await kv.get('hjdk:pins:done:kz-' + i.slug); if (!done) out.push({ url: 'https://keuzehulp.best/' + i.slug + '?utm_source=pinterest&utm_medium=pin', slug: 'kz-' + i.slug, board: 'Keuzehulpen ' + String(i.cat || 'slim kiezen').toLowerCase(), kz: i }); }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const url = new URL(req.url, 'http://x');
  const op = url.searchParams.get('op') || url.pathname.replace(/^\/api\/pinterest\/?/, '').split('/')[0];
  try {
    if (op === 'callback') {
      const code = url.searchParams.get('code'), state = url.searchParams.get('state');
      const st = state ? await kv.get('hjdk:pinterest:state:' + state) : null;
      if (!code || !st) return res.status(400).send('Ongeldige of verlopen koppel-link. Ga terug naar /setup en klik opnieuw op "Verbind Pinterest".');
      const app = await getApp(); if (!app) return res.status(400).send('Geen Pinterest app-id/secret ingesteld (zet die eerst via /setup).');
      await exchangeCode(app, code);
      let who = ''; try { const { api } = await import('../lib/pinterest.js'); const u = await api('/user_account'); who = u.username || ''; } catch (e) {}
      res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send('<!doctype html><meta charset="utf-8"><body style="font:17px system-ui;padding:30px"><h2>Pinterest verbonden' + (who ? ' als ' + esc(who) : '') + ' ✓</h2><p>Je kunt dit venster sluiten. Vanaf nu plaatst hjdk-api elke dag pins. Wachtrij en status: <a href="/pins">/pins</a>.</p></body>');
    }
    if (op === 'status') {
      const app = await getApp(); const status = await tokenStatus();
      let boards = [], err = ''; if (/^verbonden/.test(status)) { try { boards = await listBoards(); } catch (e) { err = String(e && e.message || e).slice(0, 160); } }
      const queue = (await kv.get(QUEUE)) || []; const log = (await kv.get(LOG)) || [];
      return res.status(200).json({ app: app ? 'ingesteld (' + app.from + ')' : 'geen app-id/secret', pinterest: status, boards: boards.map(b => b.name), fout: err || undefined, wachtrij: queue.length, laatste: log.slice(0, 10) });
    }
    if (op === 'queue') {
      if (req.method !== 'POST') return res.status(405).end();
      let b = {}; try { b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) {}
      if (!process.env.HJDK_TOKEN || String(b.token || '') !== process.env.HJDK_TOKEN) return res.status(401).json({ error: 'HJDK-token klopt niet' });
      const lines = String(b.urls || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const queue = (await kv.get(QUEUE)) || []; let added = 0;
      for (const l of lines) { const [u, board] = l.split('|').map(x => x.trim()); if (!/^https?:\/\//.test(u)) continue; if (queue.some(q => q.url === u)) continue; queue.push({ url: u, board: board || '', at: Date.now() }); added++; }
      await kv.set(QUEUE, queue);
      return res.status(200).json({ ok: true, toegevoegd: added, wachtrij: queue.length });
    }
    if (op === 'post') {
      const n = Math.max(1, Math.min(5, Number(url.searchParams.get('n')) || 2));
      const status = await tokenStatus(); if (!/^verbonden/.test(status)) return res.status(200).json({ ok: false, error: 'Pinterest ' + status });
      let queue = (await kv.get(QUEUE)) || []; const log = (await kv.get(LOG)) || []; const done = [];
      const todo = queue.slice(0, n); const kzs = await kzCandidates(Math.max(0, Math.min(10, Number(process.env.KZ_PINS_PER_RUN || 2)))); todo.push(...kzs); if (todo.length < n + kzs.length) todo.push(...(await autoCandidates(n + kzs.length - todo.length)));
      for (const item of todo) {
        const info = item.kz ? { title: item.kz.title, image: 'https://keuzehulp.best/pin/' + item.kz.slug + '-0.png', desc: (item.kz.kort || item.kz.intro || '') + ' In 3 vragen naar het product dat bij jou past, met de prijs van vandaag bij bol.' } : await pageInfo(item.url);
        const slug = item.slug || item.url.replace(/^https?:\/\/(www\.)?yoo\.rs\//, '').replace(/\.html$/, '-html').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
        let entry = { at: Date.now(), url: item.url, board: '', ok: false };
        if (info.error || !info.image) { entry.error = info.error || 'geen afbeelding (og:image) op de pagina'; }
        else {
          try {
            const boardName = item.board || boardFor(info.title + ' ' + slug);
            const boardId = await ensureBoard(boardName, item.kz ? 'Keuzehulpen van keuzehulp.best: in 3 vragen naar het product dat bij jou past, met de prijs van vandaag.' : 'Ideeën en tips van Yoors (yoo.rs)');
            const desc = item.kz ? info.desc : (info.desc || info.title) + ' Lees het hele artikel op yoo.rs.';
            const pin = await createPin({ boardId, title: info.title, description: desc, link: item.url, imageUrl: info.image, altText: info.title });
            entry = Object.assign(entry, { ok: true, board: boardName, title: info.title, pinId: pin.id });
          } catch (e) { entry.error = String(e && e.message || e).slice(0, 200); }
        }
        try { await kv.set('hjdk:pins:done:' + slug, { at: Date.now(), ok: entry.ok, error: entry.error || '' }, { ex: 180 * 86400 }); } catch (e) {}
        queue = queue.filter(q => q.url !== item.url); done.push(entry); log.unshift(entry);
      }
      await kv.set(QUEUE, queue); await kv.set(LOG, log.slice(0, 100));
      return res.status(200).json({ ok: true, geplaatst: done.filter(d => d.ok).length, mislukt: done.filter(d => !d.ok).length, details: done, wachtrij: queue.length });
    }
    if (op === 'pins' || op === '') {
      const status = await tokenStatus(); const queue = (await kv.get(QUEUE)) || []; const log = (await kv.get(LOG)) || [];
      const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>hjdk-api · Pinterest</title>
<style>body{margin:0;font:16px/1.5 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;background:#f6f7f9;color:#111}main{max-width:640px;margin:0 auto;padding:24px 16px}.c{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:20px;margin-bottom:14px}h1{font-size:20px;margin:0 0 6px}h2{font-size:16px;margin:0 0 8px}p{color:#374151;margin:0 0 12px}label{display:block;margin:12px 0 0;font-weight:600;font-size:14px}input,textarea{width:100%;box-sizing:border-box;font:15px system-ui;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;margin-top:4px}textarea{min-height:120px}button{margin-top:14px;width:100%;background:#e60023;color:#fff;border:0;border-radius:10px;padding:14px;font-size:17px;font-weight:700}pre{white-space:pre-wrap;background:#f3f4f6;padding:12px;border-radius:8px;font-size:13px}li{font-size:14px;margin:4px 0}.ok{color:#166534}.err{color:#b91c1c}</style></head>
<body><main><div class="c"><h1>Pinterest</h1><p>Status: <b>${esc(status)}</b>. Elke dag om 09:15 (NL) plaatst de cron 2 pins: eerst uit de wachtrij, daarna automatisch de Yoors-pagina's waar de bol-banner het meest actief is.</p>
<form id="f"><label>HJDK-token<br><input name="token" type="password" autocomplete="off" required></label><label>Wachtrij vullen: één Yoors-URL per regel, eventueel <code>| bordnaam</code> erachter<br><textarea name="urls" placeholder="https://yoo.rs/mijn-artikel | Bakken en traktaties"></textarea></label><button type="submit">Toevoegen aan wachtrij</button></form><pre id="o" hidden></pre></div>
<div class="c"><h2>Wachtrij (${queue.length})</h2><ul>${queue.slice(0, 30).map(q => '<li>' + esc(q.url) + (q.board ? ' → ' + esc(q.board) : '') + '</li>').join('') || '<li>leeg (dan kiest de cron zelf)</li>'}</ul></div>
<div class="c"><h2>Laatste pins</h2><ul>${log.slice(0, 20).map(l => '<li class="' + (l.ok ? 'ok' : 'err') + '">' + new Date(l.at).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }) + ' · ' + esc(l.title || l.url) + (l.ok ? ' → ' + esc(l.board) : ' · ' + esc(l.error)) + '</li>').join('') || '<li>nog geen</li>'}</ul></div></main>
<script>document.getElementById('f').addEventListener('submit',async function(e){e.preventDefault();var o=document.getElementById('o');o.hidden=false;o.textContent='Bezig...';var d={};new FormData(e.target).forEach(function(v,k){d[k]=v;});try{var r=await fetch('/api/pinterest/queue',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)});var j=await r.json();o.textContent=JSON.stringify(j);if(j.ok)setTimeout(function(){location.reload();},800);}catch(err){o.textContent='Mislukt: '+err;}});</script></body></html>`;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }
    return res.status(400).json({ error: 'bad op', op });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e && e.message || e).slice(0, 200) }); }
}
