// Doorsturen bij elk item op alle keuzehulpen (19 nov 2026, Henkjan: "Bij ieder item op slimme plek een doorstuur mogelijkheid . Share sheet op
// mobiel . Copy link . Op desktop . Meet of dit gebeurt en rapporteer ieder uur . Is signaal over wat je content doet . Maak ook de plek WAAR deze
// CTA staat lerend . De CTA zelf . Dit geldt voor alle keuze hulpen .").
//
// Hoe het werkt
// - DEEL_JS staat in HUISSTIJL_CSS (lib/huisstijl.js), dus op elke pagina van keuzehulp.best, whichtobuy.best en kaufberater.best.
// - Een item is de kaart rond een actieknop (bellen, route, website, naar de winkel, aanbieder): de dichtstbijzijnde li, article, tr of
//   [data-item] om a[data-t], a[data-out], a[rel~=nofollow][href^=http] of a.btn[href^=http]. Vindt de pagina er geen, dan is het
//   eerste-keus-blok (.answer, .lead, .kort) het item. Hoogstens 40 items per pagina.
// - Op een telefoon met deelmenu (navigator.share) opent de knop het deelmenu; anders kopieert hij de link en toont "Link gekopieerd".
// - De link gaat naar dezelfde pagina met #<item> en ?deel=1, plus dl=<pid.dag.ronde> van de proef, zodat een binnenkomer de versie van
//   de deler beloont (geen persoonsgegevens: pid is willekeurig).
// - Lerend: Clickmind-proef 'deel' (lib/proef.js): onderdeel plek (a onder de knoppen, b icoon rechtsboven, c onder de naam) en onderdeel
//   tekst (a, b, c per taal). Waarde per bezoeker: tik 1, gedeeld of gekopieerd 10, iemand kwam binnen via de link 25.
// - Tellers (/api/hjdk/stats/hits): deel-<dag>-<site>-<soort> en deel-<dag>-h<uur>-<site>-<soort> met soort zie, tik, share, copy, in;
//   per pagina deel-<dag>-<site>-p-<pagina>-<soort> voor tik, share, copy en in. Stand: /api/keuze-tools?tool=deel&op=stand&vorm=tekst.
import { kv } from './db.js';

export const DEEL_TEKST = {
  nl: { a: 'Stuur door', b: 'Deel met iemand', c: 'Stuur naar wie dit zoekt', ok: 'Link gekopieerd', via: 'via keuzehulp.best' },
  us: { a: 'Send to someone', b: 'Share', c: 'Send to a friend who needs this', ok: 'Link copied', via: 'via whichtobuy.best' },
  de: { a: 'Weiterleiten', b: 'Teilen', c: 'An jemanden schicken, der das sucht', ok: 'Link kopiert', via: 'über kaufberater.best' },
};

function deelClient(T) {
  try {
    var W = window, D = document, N = navigator; if (W.__deel) return; W.__deel = 1;
    var ua = N.userAgent || ''; if (/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(ua) || N.webdriver) return;
    var host = location.hostname.replace(/^www\./, ''), s = /kaufberater/.test(host) ? 'de' : /whichtobuy/.test(host) ? 'us' : 'nl', t = T[s];
    var dag = new Date().toISOString().slice(0, 10), uu = 'h' + new Date().toISOString().slice(11, 13);
    var sl = (location.pathname.replace(/^\/(keuzehulp\/)?/, '').replace(/\/$/, '') || 'home').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50) || 'home';
    var mob = !!(N.share && (('ontouchstart' in W) || N.maxTouchPoints > 0)), ctx = /iPhone|iPad|iPod/.test(ua) ? 'i' : /Android/.test(ua) ? 'a' : 'd';
    function tel(soort, pp) { var h = [['deel-' + dag + '-' + s + '-' + soort, 1], ['deel-' + dag + '-' + uu + '-' + s + '-' + soort, 1]]; if (pp) h.push(['deel-' + dag + '-' + s + '-p-' + sl + '-' + soort, 1]); try { N.sendBeacon('/api/hjdk/stats/hits', new Blob([JSON.stringify({ hits: h })], { type: 'text/plain' })); } catch (e) {} }
    var K = 'deelpf', P = null; try { P = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) {} if (P && !(P.pid && P.v && Date.now() - (+P.t || 0) < 6 * 864e5)) P = null;
    function pev(o) { if (!P) return; o.site = 'deel'; o.pid = P.pid; o.d = P.d; o.r = P.r; var j = JSON.stringify(o); try { if (!(N.sendBeacon && N.sendBeacon('/api/mm/proefev', new Blob([j], { type: 'text/plain' })))) fetch('/api/mm/proefev', { method: 'POST', body: j, keepalive: true }); } catch (e) {} }
    // binnengekomen via een gedeelde link: tel en beloon de versie van de deler
    var Q = new URLSearchParams(location.search);
    if (Q.get('deel')) { try { if (!sessionStorage.getItem('deel-in')) { sessionStorage.setItem('deel-in', '1'); tel('in', 1); var dl = String(Q.get('dl') || '').split('.'); if (dl.length === 3 && /^[0-9a-f]{12}$/.test(dl[0])) { var j = JSON.stringify({ site: 'deel', pid: dl[0], d: dl[1], r: +dl[2] || 1, e: 'binnen' }); N.sendBeacon('/api/mm/proefev', new Blob([j], { type: 'text/plain' })); } } } catch (e) {} }
    var css = D.createElement('style');
    css.textContent = '.dl-k{font:inherit;font-size:14px;font-weight:500;line-height:1.2;cursor:pointer;background:none!important;color:#6B7280!important;border:0!important;border-radius:0;padding:4px 0;margin:0;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;box-shadow:none!important;min-height:0!important;width:auto!important}.dl-k:hover{color:#111113!important;text-decoration:underline;text-underline-offset:3px}.dl-k svg{width:14px;height:14px;flex:none}.dl-pa{margin-top:6px}.dl-pc{margin:2px 0 4px}.dl-rel{position:relative}.dl-pb{position:absolute;top:10px;right:10px}.dl-pb .dl-k{padding:4px}.dl-pb .dl-k span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.dl-ok{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111113;color:#fff;padding:10px 16px;border-radius:999px;font-size:15px;z-index:99999}@media (prefers-color-scheme:dark){.dl-k{color:#9CA3AF!important}.dl-k:hover{color:#F3F4F6!important}}@media print{.dl-k{display:none}}';
    (D.head || D.documentElement).appendChild(css);
    var IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v13"/><path d="M7 8l5-5 5 5"/></svg>';
    function naam(el) { if (el.matches && el.matches('.answer,.lead,.kort,.mk-antw,.ov-lead')) { var h1 = D.querySelector('h1'); if (h1) return h1.textContent.replace(/\s+/g, ' ').trim().slice(0, 80); } var n = el.querySelector('h2,h3,h4,.n,.naam,.t,strong,b,a'); return String((n && n.textContent) || el.textContent || '').replace(/\s+/g, ' ').trim().replace(/^\d+\.\s*/, '').slice(0, 80); }
    var BOX = '[data-item],li,.pr,.card,.pick,.kaart,.item,article'; // geen tabelrijen: een knop per rij is onrustig (Henkjan 19 nov: "ZIET ER NIET UIT")
    function bron(c) { var l = c.closest('ul,ol,table'); var x = l ? l.previousElementSibling : null, n = 0; while (x && n < 4) { if (/^H[2-4]$/.test(x.tagName)) return /bron|source|quelle|lees ook|related|siehe auch/i.test(x.textContent); x = x.previousElementSibling; n++; } return false; }
    function vind() {
      var it = [], zie = [];
      var lead = D.querySelector('.answer,.lead,.kort,.mk-antw,.ov-lead'); if (lead && !lead.closest('.kx,#kx')) { zie.push(lead); it.push(lead); }
      [].forEach.call(D.querySelectorAll('a[data-t],a[data-out],a[rel~="nofollow"][href^="http"],a.btn[href^="http"]'), function (a) {
        if (a.closest('header,footer,nav,table,.kx,#kx,details,.faq,.dl-k,[data-deel="nee"]')) return;
        var c = a.closest(BOX); if (!c || zie.indexOf(c) >= 0 || c.querySelector('h1') || c.matches('main,body,.wrap') || (c.offsetHeight || 0) > 1100 || bron(c)) return;
        if (it.some(function (x) { return x.contains(c) && x !== lead; })) return;
        zie.push(c); it.push(c);
      });
      return it.slice(0, 40);
    }
    function zet(v) {
      v = W.__dlV || v || {}; W.__dlV = v; var plek = v.plek || 'a', tk = v.tekst || 'a', label = t[tk] || t.a, n = 0;
      vind().forEach(function (el, i) {
        if (el.__dl) return; el.__dl = 1; n++;
        if (!el.id) el.id = 'i-' + (naam(el).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item-' + (i + 1));
        var k = D.createElement('button'); k.type = 'button'; k.className = 'dl-k'; k.setAttribute('aria-label', label + ': ' + naam(el)); k.innerHTML = IC + '<span>' + label + '</span>';
        k.setAttribute('data-dl', el.id);
        var w = D.createElement(el.tagName === 'TR' ? 'span' : 'div'); w.className = 'dl-p' + plek; w.appendChild(k);
        if (el.tagName === 'TR') { var td = el.lastElementChild; if (td) td.appendChild(w); return; }
        if (plek === 'b') { el.classList.add('dl-rel'); el.appendChild(w); return; }
        if (plek === 'c') { var nm = el.querySelector('h2,h3,h4,.n,.naam'); if (nm && nm.parentNode) { nm.parentNode.insertBefore(w, nm.nextSibling); return; } }
        el.appendChild(w);
      });
      if (n && location.hash && !W.__dlSc) { var h = D.getElementById(decodeURIComponent(location.hash.slice(1))); if (h) { W.__dlSc = 1; h.scrollIntoView({ block: 'start' }); } }
      if (n && !W.__dlZie) { W.__dlZie = 1; tel('zie'); pev({ e: 'zie', c: ctx, v: { plek: plek, tekst: tk } }); }
    }
    function url(el) { var u = new URL(location.href); u.hash = el.id; u.search = ''; u.searchParams.set('deel', '1'); if (P) u.searchParams.set('dl', P.pid + '.' + P.d + '.' + P.r); return u.toString(); }
    function ok(msg) { var o = D.createElement('div'); o.className = 'dl-ok'; o.setAttribute('role', 'status'); o.textContent = msg; D.body.appendChild(o); setTimeout(function () { o.remove(); }, 2200); }
    function deel(el, k) {
      tel('tik', 1); pev({ e: 'tik' }); var u = url(el), nm = naam(el);
      if (mob) { N.share({ title: nm, text: nm + ' ' + t.via, url: u }).then(function () { tel('share', 1); pev({ e: 'deel' }); }).catch(function () {}); return; }
      var klaar = function () { tel('copy', 1); pev({ e: 'deel' }); ok(t.ok); };
      try { N.clipboard.writeText(u).then(klaar, function () { oud(u) && klaar(); }); } catch (e) { if (oud(u)) klaar(); }
    }
    function oud(u) { try { var x = D.createElement('textarea'); x.value = u; x.style.position = 'fixed'; x.style.opacity = '0'; D.body.appendChild(x); x.select(); var r = D.execCommand('copy'); x.remove(); return r; } catch (e) { return false; } }
    D.addEventListener('click', function (e) { var k = e.target && e.target.closest && e.target.closest('.dl-k'); if (!k) return; e.preventDefault(); e.stopPropagation(); var el = k.closest('[data-item],li,article,tr,.answer,.lead,.kort,.mk-antw') || D.getElementById(k.getAttribute('data-dl')); if (el) deel(el, k); }, true);
    function start() {
      if (P) { zet(P.v); return; }
      fetch('/api/mm/proefkies?site=deel&c=' + ctx, { credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (j) { if (j && j.ok && j.aan && j.pid) { P = { pid: j.pid, d: j.d, r: j.r, v: j.v, t: Date.now() }; try { localStorage.setItem(K, JSON.stringify(P)); } catch (e) {} } zet(P && P.v); }).catch(function () { zet(null); });
    }
    var go = function () { start(); setTimeout(function () { zet(P && P.v); }, 2500); var tm = 0; try { new MutationObserver(function (m) { for (var i = 0; i < m.length; i++) { var x = m[i].target; if (x && x.closest && x.closest('.dl-p' + 'a,.dl-pb,.dl-pc,.dl-ok')) return; } clearTimeout(tm); tm = setTimeout(function () { if (W.__dlV) zet(W.__dlV); }, 400); }).observe(D.body, { childList: true, subtree: true }); } catch (e) {} };
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', go); else go();
  } catch (e) {}
}
export const DEEL_JS = '<script data-deel="1">(' + deelClient.toString() + ')(' + JSON.stringify(DEEL_TEKST) + ');</script>';

// Stand: per site en per soort vandaag, het laatste uur, en de pagina's waar het meest gedeeld wordt.
export async function stand() {
  const dag = new Date().toISOString().slice(0, 10), uu = 'h' + new Date(Date.now() - 3600e3).toISOString().slice(11, 13), nu = 'h' + new Date().toISOString().slice(11, 13);
  const out = {}; let cursor = 0;
  do { const r = await kv.scan(cursor, { match: 'c:deel-' + dag + '-*', count: 500 }); cursor = Number(r[0]); const keys = r[1] || []; if (keys.length) { const vals = await kv.mget(...keys); keys.forEach((k, i) => { out[k.slice(2)] = Number(vals[i]) || 0; }); } } while (cursor !== 0);
  const g = k => out['deel-' + dag + '-' + k] || 0, SO = ['zie', 'tik', 'share', 'copy', 'in'];
  const sites = ['nl', 'us', 'de'].map(s => ({ site: s, vandaag: Object.fromEntries(SO.map(x => [x, g(s + '-' + x)])), vorigUur: Object.fromEntries(SO.map(x => [x, g(uu + '-' + s + '-' + x)])), ditUur: Object.fromEntries(SO.map(x => [x, g(nu + '-' + s + '-' + x)])) }));
  const pag = {}; Object.entries(out).forEach(([k, v]) => { const m = k.match(/^deel-\d{4}-\d\d-\d\d-(nl|us|de)-p-(.+)-(tik|share|copy|in)$/); if (m) { const id = m[1] + '/' + m[2]; pag[id] = pag[id] || { tik: 0, share: 0, copy: 0, in: 0 }; pag[id][m[3]] += v; } });
  const top = Object.entries(pag).sort((a, b) => (b[1].share + b[1].copy + b[1].in) - (a[1].share + a[1].copy + a[1].in) || b[1].tik - a[1].tik).slice(0, 8).map(([p, v]) => ({ pagina: p, ...v }));
  return { dag, sites, top };
}
export function standTekst(x) {
  const NM = { nl: 'keuzehulp.best', us: 'whichtobuy.best', de: 'kaufberater.best' };
  const r = s => s.zie + ' bezoeken met knop, ' + s.tik + ' tikken, ' + s.share + ' gedeeld, ' + s.copy + ' link gekopieerd, ' + s.in + ' binnen via een gedeelde link';
  return 'Doorsturen ' + x.dag + ' (UTC)\n' + x.sites.map(s => NM[s.site] + ' vandaag: ' + r(s.vandaag) + '\n  vorig uur: ' + r(s.vorigUur)).join('\n') + (x.top.length ? '\nPagina\'s:\n' + x.top.map(p => '  ' + p.pagina + ': ' + p.tik + ' tik, ' + (p.share + p.copy) + ' gedeeld, ' + p.in + ' binnen').join('\n') : '') + '\nVersies (plek en tekst): /api/mm/proefstand?site=deel&vorm=tekst';
}
