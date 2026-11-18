// Funnel per persoon (18 nov 2026, Henkjan: "de chat van kadoly zodat we weten WIE we in de funnel hebben in welke fase").
// Eén persoon = de Clickmind-cookie mmp (16 hex, HttpOnly, per domein). Op gids.kadoly.com, keuzehulp.best en de shoproute
// (api/shop.js direct en pxVerwerk) komt elke stap hier binnen; per persoon bewaren we de hoogste fase, het onderwerp en de laatste stappen.
// Geen naam, geen e-mail, geen IP: alleen een willekeurige id, de pagina's en wat iemand deed. 120 dagen bewaard.
//
// Fases (oplopend, de hoogste telt):
//   1 Ontdekt     eerste keer gezien (pagina geopend)
//   2 Leest       20 seconden of halverwege gescrold, of via een advertentie op een productpagina
//   3 Vergelijkt  vraag in de chat, keuzevragen of maathulp gebruikt, of komt een andere dag terug
//   4 Wil kopen   klikt naar de winkel of legt in het mandje
//   5 Rekent af   afrekenpagina of betaling gestart
//   6 Klant       betaald
import { kv } from './db.js';

export const FASES = ['', 'Ontdekt', 'Leest', 'Vergelijkt', 'Wil kopen', 'Rekent af', 'Klant'];
const STAP = { zie: 1, diep: 2, klik: 2, bekeken: 2, vraag: 3, keuze: 3, terug: 3, wil: 4, cart: 4, afreken: 5, betaal: 5, koop: 6, blijf: 3, checkin: 3 };
// Mijlpalen van de intentieketen (18 nov 2026, Henkjan: "ALLE bewegingen moeten door clickmind heen en lerend opgeslagen we moeten weten waar mensen in en hoeveel mensen in de funnel zitten"):
// naast de fase telt per persoon de eerste keer dat hij iets in de chat vroeg, bleef (volgen of e-mail), op een check-in antwoordde, naar een winkel klikte of kocht.
export const MIJL = { vraag: 'chat', blijf: 'blijft', checkin: 'checkin', wil: 'winkel', koop: 'gekocht' };
const MIJL_NAMEN = ['chat', 'blijft', 'checkin', 'winkel', 'gekocht'];
const TTL = 120 * 86400;
const DAG = (t = Date.now()) => new Date(t).toISOString().slice(0, 10).replace(/-/g, '');
const schoon = (s, n = 60) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9:_-]/g, '').slice(0, n);
const BOT = /bot|crawl|spider|slurp|facebookexternal|preview|headless|lighthouse|monitor|curl|wget|python|axios|node-fetch/i;

export function fnIdUitCookie(req) { const m = String((req && req.headers && req.headers.cookie) || '').match(/(?:^|;\s*)mmp=([0-9a-f]{16})/); return m ? m[1] : ''; }
export function isFnBot(req) { return BOT.test(String((req && req.headers && req.headers['user-agent']) || '')); }

// bron van het eerste bezoek: utm_source, anders de verwijzer
export function bronVan(ref, utm) {
  const u = schoon(utm, 20); if (u) return u;
  const r = String(ref || '').toLowerCase();
  if (!r) return 'direct';
  if (/google\.|bing\.|duckduckgo|ecosia|yahoo\./.test(r)) return 'zoek';
  if (/chatgpt|openai|perplexity|copilot|gemini|claude\.ai|you\.com/.test(r)) return 'ai';
  if (/tiktok/.test(r)) return 'tiktok';
  if (/facebook|instagram|pinterest|whatsapp|t\.co|twitter|x\.com|linkedin/.test(r)) return 'social';
  if (/keuzehulp\.best|kadoly\.com|whichtobuy|kaufberater/.test(r)) return 'eigen';
  return 'link';
}

// Eén stap vastleggen. id = mmp; o = onderwerp (gidsslug, keuzehulp-slug of campagne); b = bron (alleen bij het eerste bezoek)
export async function funnelStap(id, stap, o, b) {
  id = schoon(id, 40); const f = STAP[stap]; if (!id || !f) return null;
  try {
    const al = await kv.raw(['GET', 'fn:al:' + id]); if (al) id = String(al); // gekoppeld aan een id van een ander domein (keuzehulp.best -> gids.kadoly.com)
    const k = 'fn:p:' + id; let p = null; try { p = await kv.get(k); } catch (e) {}
    const nu = Date.now(), dag = DAG(nu), on = schoon(o) || '-';
    const nieuw = !p; p = p || { f: 0, e: nu, b: schoon(b, 20) || 'direct', d: [], s: [], os: {}, n: 0 };
    if (stap === 'zie' && !nieuw && p.d.length && p.d[p.d.length - 1] !== dag) { p.terug = (p.terug || 0) + 1; if (p.f < 3) { await kv.raw(['HINCRBY', 'fn:d:' + dag, on + '|f3', '1']).catch(() => {}); await kv.raw(['HINCRBY', 'fn:d:' + dag, 'alle|f3', '1']).catch(() => {}); p.f = 3; } }
    if (!p.d.includes(dag)) p.d = p.d.concat(dag).slice(-30);
    const oud = p.f || 0;
    if (f > oud) { p.f = f; const keys = []; for (let x = oud + 1; x <= f; x++) keys.push([on + '|f' + x], ['alle|f' + x]); for (const [h] of keys) await kv.raw(['HINCRBY', 'fn:d:' + dag, h, '1']); await kv.raw(['EXPIRE', 'fn:d:' + dag, String(90 * 86400)]); }
    const mj = MIJL[stap]; if (mj) { p.m = p.m || {}; if (!p.m[mj]) { p.m[mj] = nu; await kv.raw(['HINCRBY', 'fn:d:' + dag, 'alle|m:' + mj, '1']).catch(() => {}); await kv.raw(['HINCRBY', 'fn:d:' + dag, on + '|m:' + mj, '1']).catch(() => {}); await kv.raw(['EXPIRE', 'fn:d:' + dag, String(90 * 86400)]).catch(() => {}); } }
    p.nu = f; p.o = on !== '-' ? on : p.o; if (on !== '-') p.os[on] = (p.os[on] || 0) + 1;
    p.l = nu; p.n = (p.n || 0) + 1; p.s = p.s.concat([[nu, stap, on]]).slice(-25);
    await kv.set(k, p, { ex: TTL });
    await kv.raw(['ZADD', 'fn:r', String(nu), id]); if (Math.random() < 0.05) await kv.raw(['ZREMRANGEBYRANK', 'fn:r', '0', '-5001']);
    return { id, f: p.f, fase: FASES[p.f] };
  } catch (e) { return null; }
}

export async function funnelKoppel(van, naar) { van = schoon(van, 40); naar = schoon(naar, 40); if (!van || !naar || van === naar) return; try { await kv.raw(['SET', 'fn:al:' + naar, van, 'EX', String(TTL)]); } catch (e) {} }

export async function funnelPersoon(id) { id = schoon(id, 40); if (!id) return null; try { const al = await kv.raw(['GET', 'fn:al:' + id]); return await kv.get('fn:p:' + (al || id)); } catch (e) { return null; } }

// Overzicht: per onderwerp hoeveel personen elke fase bereikten (dagen terug), en de laatste personen met hun fase
export async function funnelStand(dagen = 7, aantal = 60) {
  const per = {}; const tot = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; const mtot = {}, mper = {};
  for (let i = 0; i < Math.min(60, Math.max(1, dagen)); i++) {
    let h = null; try { h = await kv.raw(['HGETALL', 'fn:d:' + DAG(Date.now() - i * 864e5)]); } catch (e) {}
    const paren = Array.isArray(h) ? h : h ? Object.entries(h).flat() : [];
    for (let j = 0; j + 1 < paren.length; j += 2) { const [o, fx] = String(paren[j]).split('|'); const n = Number(paren[j + 1]) || 0; if (/^m:/.test(fx || '')) { const mn = fx.slice(2); if (o === 'alle') mtot[mn] = (mtot[mn] || 0) + n; else { mper[o] = mper[o] || {}; mper[o][mn] = (mper[o][mn] || 0) + n; } continue; } const f = Number(String(fx).slice(1)); if (!f) continue; if (o === 'alle') { tot[f] += n; continue; } per[o] = per[o] || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; per[o][f] += n; }
  }
  let ids = []; try { ids = await kv.raw(['ZREVRANGE', 'fn:r', '0', String(aantal - 1)]); } catch (e) {}
  const ps = ids.length ? await kv.mget(...ids.map(x => 'fn:p:' + x)) : [];
  const personen = ids.map((id, i) => ({ id, p: ps[i] })).filter(x => x.p).map(({ id, p }) => ({ id: id.slice(0, 8), fase: FASES[p.f] || '-', nu: FASES[p.nu] || '-', onderwerp: p.o || '-', bron: p.b, dagen: (p.d || []).length, stappen: p.n, eerst: new Date(p.e).toISOString().slice(0, 16), laatst: new Date(p.l).toISOString().slice(0, 16), spoor: (p.s || []).slice(-6).map(s => s[1] + (s[2] && s[2] !== '-' ? ':' + s[2] : '')).join(' > ') }));
  const onderwerpen = Object.entries(per).map(([o, f]) => ({ onderwerp: o, ...Object.fromEntries([1, 2, 3, 4, 5, 6].map(x => [FASES[x], f[x]])) })).sort((a, b) => b.Ontdekt - a.Ontdekt).slice(0, 40);
  // nu in de funnel: iedereen die in deze periode actief was, naar zijn hoogste fase en zijn mijlpalen (hoogstens 3000 personen)
  const nu = { personen: 0, fase: Object.fromEntries(FASES.slice(1).map(x => [x, 0])), mijlpaal: Object.fromEntries(MIJL_NAMEN.map(x => [x, 0])), bron: {} };
  try { const van = Date.now() - Math.min(60, Math.max(1, dagen)) * 864e5; const act = await kv.raw(['ZREVRANGEBYSCORE', 'fn:r', '+inf', String(van), 'LIMIT', '0', '3000']) || [];
    for (let i = 0; i < act.length; i += 200) { const blok = act.slice(i, i + 200); const pp = await kv.mget(...blok.map(x => 'fn:p:' + x)); for (const p of pp) { if (!p || !p.f) continue; nu.personen++; nu.fase[FASES[p.f]] = (nu.fase[FASES[p.f]] || 0) + 1; for (const m of Object.keys(p.m || {})) if (m in nu.mijlpaal) nu.mijlpaal[m]++; const b = p.b || 'direct'; nu.bron[b] = (nu.bron[b] || 0) + 1; } } } catch (e) {}
  const mijlpalen = Object.fromEntries(MIJL_NAMEN.map(x => [x, mtot[x] || 0]));
  return { dagen, nu, mijlpalen, mijlPerOnderwerp: Object.entries(mper).map(([o, m]) => ({ onderwerp: o, ...m })).sort((a, b) => (b.chat || 0) - (a.chat || 0)).slice(0, 40), uitleg: 'Aantal personen dat in deze periode een fase voor het eerst bereikte. Fase = hoogste stap: ' + FASES.slice(1).join(' > '), totaal: Object.fromEntries([1, 2, 3, 4, 5, 6].map(x => [FASES[x], tot[x]])), onderwerpen, personen };
}

export function funnelHtml(s) {
  const e = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kol = FASES.slice(1);
  return `<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Funnel per persoon</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:16px;color:#1c1917}table{border-collapse:collapse;width:100%;margin:8px 0 24px}th,td{border-bottom:1px solid #e7e5e4;padding:6px 8px;text-align:left;font-size:14px}th{background:#f5f5f4}td.n{text-align:right}h1{font-size:24px}h2{font-size:18px}</style>
<h1>Funnel per persoon, laatste ${e(s.dagen)} dagen</h1><p>${e(s.uitleg)}</p>
<h2>Nu in de funnel (actief in deze periode: ${e((s.nu || {}).personen || 0)} personen)</h2><table><tr>${kol.map(k => `<th>${k}</th>`).join('')}</tr><tr>${kol.map(k => `<td class="n">${((s.nu || {}).fase || {})[k] || 0}</td>`).join('')}</tr></table>
<h2>Mijlpalen van de intentieketen</h2><p>Personen die het in deze periode voor het eerst deden. Nu in de funnel: ${Object.entries((s.nu || {}).mijlpaal || {}).map(([k, v]) => e(k) + ' ' + v).join(', ')}. Bron: ${Object.entries((s.nu || {}).bron || {}).map(([k, v]) => e(k) + ' ' + v).join(', ')}.</p><table><tr>${Object.keys(s.mijlpalen || {}).map(k => `<th>${e(k)}</th>`).join('')}</tr><tr>${Object.values(s.mijlpalen || {}).map(v => `<td class="n">${v}</td>`).join('')}</tr></table>
<h2>Totaal</h2><table><tr>${kol.map(k => `<th>${k}</th>`).join('')}</tr><tr>${kol.map(k => `<td class="n">${s.totaal[k] || 0}</td>`).join('')}</tr></table>
<h2>Per onderwerp</h2><table><tr><th>Onderwerp</th>${kol.map(k => `<th>${k}</th>`).join('')}</tr>${s.onderwerpen.map(r => `<tr><td>${e(r.onderwerp)}</td>${kol.map(k => `<td class="n">${r[k] || 0}</td>`).join('')}</tr>`).join('')}</table>
<h2>Laatste personen</h2><table><tr><th>Persoon</th><th>Hoogste fase</th><th>Onderwerp</th><th>Bron</th><th>Dagen</th><th>Laatst (UTC)</th><th>Spoor</th></tr>${s.personen.map(p => `<tr><td>${e(p.id)}</td><td>${e(p.fase)}</td><td>${e(p.onderwerp)}</td><td>${e(p.bron)}</td><td class="n">${p.dagen}</td><td>${e(p.laatst)}</td><td>${e(p.spoor)}</td></tr>`).join('')}</table></html>`;
}

// Script voor gids.kadoly.com en keuzehulp.best: meldt zie, diep (20 s of halverwege), keuze (eerste tik op een knop), vraag (formulier),
// en wil (klik naar de winkel); plakt de eigen id als f= aan links naar gids.kadoly.com/naar/ zodat de persoon over domeinen heen dezelfde blijft.
export const FN_JS = (o) => `<script>(function(){var O=${JSON.stringify(String(o || '').slice(0, 60))}||(location.pathname.split('/').filter(Boolean).pop()||'home'),F='',U='/api/gids?op=fn';function s(st,x){try{var q=U+'&s='+st+'&o='+encodeURIComponent(x||O);if(st==='zie'){var u=new URLSearchParams(location.search);q+='&b='+encodeURIComponent(u.get('utm_source')||u.get('n')||'')+'&r='+encodeURIComponent(document.referrer.slice(0,200))+'&m='+encodeURIComponent(u.get('mmc')||'')}return fetch(q,{method:'POST',keepalive:true,credentials:'same-origin'}).then(function(r){return r.json()}).then(function(j){if(j&&j.f){F=j.f;zet()}}).catch(function(){})}catch(e){}}
function zet(){if(!F)return;var a=document.querySelectorAll('a[href*="/naar/"]');for(var i=0;i<a.length;i++){try{var l=new URL(a[i].href,location.href);if(!l.searchParams.get('f')){l.searchParams.set('f',F);a[i].href=l.href}}catch(e){}}}
s('zie');var d=0;function diep(){if(d)return;d=1;s('diep')}setTimeout(function(){if(document.visibilityState!=='hidden')diep()},20000);addEventListener('scroll',function(){if(scrollY+innerHeight>document.body.scrollHeight*0.5)diep()},{passive:true});
var k=0;document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('a,button,[role=button],.pill,label');if(!t)return;var h=t.getAttribute&&t.getAttribute('href')||'';if(/\\/naar\\/|kadoly\\.com\\/(product|checkout|shop)|go\\.kadoly/.test(h)||/sponsored/.test(t.getAttribute&&t.getAttribute('rel')||'')){s('wil');return}if(t.tagName!=='A'&&!k){k=1;s('keuze')}},true);
document.addEventListener('submit',function(){s('vraag')},true);})();</script>`;
