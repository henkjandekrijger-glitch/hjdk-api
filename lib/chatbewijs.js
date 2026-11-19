// Laat zien hoeveel er in de chat gebeurt, en leer of dat helpt (19 nov 2026, Henkjan: "Laat het geleerde ook bij de chats meteen zien aantal
// vragen en antwoorden . Aantal mensen nu in gessprek . Maak dit lerend of dat beter converteert of niet .").
//
// Hoe het werkt
// - CB_JS staat in HUISSTIJL_CSS (lib/huisstijl.js), dus op elke keuzehulp met de chat (#kx) op keuzehulp.best, whichtobuy.best en kaufberater.best.
// - Cijfers, alleen echte (/api/keuze-tools?tool=chatbewijs&s=<nl|us|de>&slug=<pagina>, 60 s cache): vragen deze week en hoeveel daarvan een
//   antwoord kregen (kz:chat:d:<dag> velden <site>:vraag en <site>:open, lib/kzchat.js), vragen over deze pagina (kz:chat:pag:<site>, sinds
//   19 nov) en mensen die de afgelopen 10 minuten iets vroegen (kz:chat:actief:<site>, gesorteerde set met een gehashte sessie).
// - Clickmind-proef 'chatbewijs', onderdeel bewijs: a niets tonen (controle), b één regel onder de kop van de chat. Waarde per bezoeker: pill 2,
//   vraag 5, naar de winkel 10. Getallen onder de drempel (minder dan 5 vragen deze week, minder dan 2 mensen nu) laten we weg.
import { kv } from './db.js';

const TXT = {
  nl: { week: '{a} vragen beantwoord deze week', pag: '{p} over deze keuzehulp', nu: '{n} mensen nu in gesprek' },
  us: { week: '{a} questions answered this week', pag: '{p} about this guide', nu: '{n} people chatting now' },
  de: { week: '{a} Fragen diese Woche beantwortet', pag: '{p} zu diesem Ratgeber', nu: '{n} Personen gerade im Gespräch' },
};

function cbClient(T) {
  try {
    var W = window, D = document, N = navigator; if (W.__cb) return; W.__cb = 1;
    var ua = N.userAgent || ''; if (/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(ua) || N.webdriver) return;
    var host = location.hostname.replace(/^www\./, ''), s = /kaufberater/.test(host) ? 'de' : /whichtobuy/.test(host) ? 'us' : 'nl', t = T[s];
    var ctx = /iPhone|iPad|iPod/.test(ua) ? 'i' : /Android/.test(ua) ? 'a' : 'd';
    var slug = (location.pathname.replace(/^\/(keuzehulp\/)?/, '').replace(/\/$/, '') || 'home').split('/').pop().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
    var K = 'cbpf', P = null; try { P = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) {} if (P && !(P.pid && P.v && Date.now() - (+P.t || 0) < 6 * 864e5)) P = null;
    function pev(o) { if (!P) return; o.site = 'chatbewijs'; o.pid = P.pid; o.d = P.d; o.r = P.r; var j = JSON.stringify(o); try { if (!(N.sendBeacon && N.sendBeacon('/api/mm/proefev', new Blob([j], { type: 'text/plain' })))) fetch('/api/mm/proefev', { method: 'POST', body: j, keepalive: true }); } catch (e) {} }
    var zien = 0;
    function regel(j, kx) {
      var h = kx.querySelector('.kx-h'); if (!h || kx.querySelector('.kx-bw')) return;
      var dl = []; if (j.week >= 5) dl.push(t.week.replace('{a}', j.week)); if (j.pag >= 3) dl.push(t.pag.replace('{p}', j.pag)); var live = j.nu >= 2 ? t.nu.replace('{n}', j.nu) : '';
      if (!dl.length && !live) return;
      var p = D.createElement('p'); p.className = 'kx-bw';
      p.innerHTML = (live ? '<span class="kx-bl"><i aria-hidden="true"></i>' + live + '</span>' : '') + (dl.length ? '<span>' + dl.join(' · ') + '</span>' : '');
      h.parentNode.insertBefore(p, h.nextSibling);
    }
    function start() {
      var kx = D.getElementById('kx'); if (!kx) return;
      var css = D.createElement('style'); css.textContent = '.kx-bw{margin:-4px 0 12px;font-size:14px;line-height:1.5;color:#111113;display:flex;flex-wrap:wrap;gap:4px 14px}.kx-bl{display:inline-flex;align-items:center;gap:6px;color:#1F7A4D;font-weight:600}.kx-bl i{width:8px;height:8px;border-radius:50%;background:#1F7A4D;display:inline-block}.kx-dk .kx-bw,html.hs-dk .kx-bw{color:#E5E7EB}.kx-dk .kx-bl,html.hs-dk .kx-bl{color:#6FCF97}.kx-dk .kx-bl i,html.hs-dk .kx-bl i{background:#6FCF97}'; (D.head || D.documentElement).appendChild(css);
      var o = W.__kxEv; W.__kxEv = function (e) { try { o && o(e); } catch (x) {} if (e === 'pill' || e === 'tik') pev({ e: 'pill' }); else if (e === 'vraag') pev({ e: 'vraag' }); else if (e === 'winkel') pev({ e: 'winkel' }); };
      var klaar = 0, v = null, J = null, ga = function () { if (++klaar < 2) return; v = (v && v.bewijs) || 'a'; if (!zien) { zien = 1; pev({ e: 'zie', c: ctx, v: { bewijs: v } }); } if (v === 'b' && J) regel(J, kx); };
      fetch('/api/keuze-tools?tool=chatbewijs&s=' + s + '&slug=' + encodeURIComponent(slug)).then(function (r) { return r.json(); }).then(function (j) { if (j && j.ok) J = j; }).catch(function () {}).then(ga);
      if (P) { v = P.v; ga(); return; }
      fetch('/api/mm/proefkies?site=chatbewijs&c=' + ctx, { credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (j) { if (j && j.ok && j.aan && j.pid) { P = { pid: j.pid, d: j.d, r: j.r, v: j.v, t: Date.now() }; try { localStorage.setItem(K, JSON.stringify(P)); } catch (e) {} v = P.v; } }).catch(function () {}).then(ga);
    }
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else start();
  } catch (e) {}
}
export const CB_JS = '<script data-cb="1">(' + cbClient.toString() + ')(' + JSON.stringify(TXT) + ');</script>';

// Aangeroepen door lib/kzchat.js bij elke echte vraag: wie er nu in gesprek is en hoeveel vragen per pagina.
export async function telVraag(site, slug, wie) {
  try {
    const nu = Date.now(), k = 'kz:chat:actief:' + site;
    await kv.raw(['ZADD', k, String(nu), String(wie || 'onbekend').slice(0, 40)]); await kv.raw(['ZREMRANGEBYSCORE', k, '0', String(nu - 3600e3)]); await kv.raw(['EXPIRE', k, '7200']);
    if (slug) await kv.raw(['HINCRBY', 'kz:chat:pag:' + site, String(slug).slice(0, 90), '1']);
  } catch (e) {}
}

const paren = r => { const o = {}; if (Array.isArray(r)) { for (let i = 0; i + 1 < r.length; i += 2) o[r[i]] = Number(r[i + 1]) || 0; } else if (r) Object.entries(r).forEach(([k, v]) => { o[k] = Number(v) || 0; }); return o; };

export async function cijfers(site, slug) {
  const s = ['nl', 'us', 'de'].includes(site) ? site : 'nl'; let vraag = 0, open = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); const h = paren(await kv.raw(['HGETALL', 'kz:chat:d:' + d]).catch(() => null)); vraag += h[s + ':vraag'] || 0; open += h[s + ':open'] || 0; }
  const nu = Number(await kv.raw(['ZCOUNT', 'kz:chat:actief:' + s, String(Date.now() - 600e3), '+inf']).catch(() => 0)) || 0;
  const pag = slug ? Number(await kv.raw(['HGET', 'kz:chat:pag:' + s, String(slug).slice(0, 90)]).catch(() => 0)) || 0 : 0;
  return { ok: true, site: s, week: Math.max(0, vraag - open), gesteld: vraag, pag, nu };
}
