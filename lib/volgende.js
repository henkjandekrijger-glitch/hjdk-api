// Wat je daarna toont, lerend en per persoon (19 nov 2026, Henkjan bij "More buying guides" op whichtobuy: "Maak ook lerend . Wat je daarna
// toont based op die persoon . die daar al zit .").
//
// Hoe het werkt
// - VOLG_JS staat in HUISSTIJL_CSS (lib/huisstijl.js), dus op elke pagina van keuzehulp.best, whichtobuy.best en kaufberater.best.
// - Een lijst is elke groep van minstens 3 links a.card.ov-r met dezelfde ouder (Ook handig om te kiezen, More buying guides, Weitere
//   Kaufberater, Nieuw toegevoegd). De server zet er tot 14 in de HTML; die links blijven altijd allemaal staan (interne links voor Google),
//   alleen de volgorde verandert in de browser.
// - Profiel per persoon, alleen in de eigen browser (localStorage kxvolg, niets naar de server): woorden uit de titels van de pagina's die
//   iemand las (gewicht 1, elke nieuwe pagina telt het oude voor 85%), uit de keuzes die hij aantikte (pills, opties, gewicht 2) en uit wat
//   hij in de chat typte (gewicht 3), plus de gidsen die hij al zag. Woorden worden vergeleken op hun eerste 6 letters (fiets, fietsen).
// - Lerend over iedereen: per gids hoe vaak hij in de bovenste 5 van een lijst stond (z) en hoe vaak erop getikt werd (k), 7 dagen
//   (/api/keuze-tools?tool=volg&op=ctr&s=<site>, 15 minuten gecachet).
// - Clickmind-proef 'volg' (lib/proef.js), onderdeel volgorde: a vaste volgorde van de server (controle), b eigen interesse 60% plus wat bij
//   iedereen werkt 40%, c alleen wat bij iedereen werkt. Bij b en c staat wat iemand al las onderaan, en heeft het tikpercentage een beetje
//   toeval (minder zeker bij minder vertoningen), zodat nieuwe gidsen ook boven komen.
// - Waarde per bezoeker: lijst gezien 0, gids aangetikt 5, op de volgende pagina verder gegaan (naar een winkel of aanbieder, of een keuze
//   aangetikt) 10.
// - Tellers (/api/hjdk/stats/hits): vg-<dag>-<site>-<zie|klik|verder>, hetzelfde per uur vg-<dag>-h<uu>-<site>-..., en per gids
//   vg-<dag>-<site>-z-<gids> en vg-<dag>-<site>-k-<gids>. Stand: /api/keuze-tools?tool=volg&op=stand&vorm=tekst.
import { kv } from './db.js';

const STOP = 'best,beste,which,what,should,would,your,with,from,that,this,than,them,they,have,will,when,where,about,buying,guide,guides,choose,choosing,review,reviews,compare,comparison,vergelijken,vergelijk,welke,kopen,koop,keuzehulp,keuze,kiezen,voor,over,zijn,deze,naar,wat,waar,hoeveel,kosten,welcher,welche,welches,kaufen,kaufberater,vergleich,beste,besten,sollte,ich,der,die,das,und,oder,mit,fur,fuer,eine,einen,2024,2025,2026,2027,need,under,near,much'.split(',');

function volgClient(STOP) {
  try {
    var W = window, D = document, N = navigator; if (W.__volg) return; W.__volg = 1;
    var ua = N.userAgent || ''; if (/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(ua) || N.webdriver) return;
    var host = location.hostname.replace(/^www\./, ''), s = /kaufberater/.test(host) ? 'de' : /whichtobuy/.test(host) ? 'us' : 'nl';
    var dag = new Date().toISOString().slice(0, 10), uu = 'h' + new Date().toISOString().slice(11, 13);
    var ctx = /iPhone|iPad|iPod/.test(ua) ? 'i' : /Android/.test(ua) ? 'a' : 'd';
    var SW = {}; STOP.forEach(function (w) { SW[w] = 1; });
    function slugVan(h) { try { var p = new URL(h, location.href); if (p.hostname.replace(/^www\./, '') !== host) return ''; return (p.pathname.replace(/^\/(keuzehulp\/)?/, '').replace(/\/$/, '') || 'home').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60); } catch (e) { return ''; } }
    var hier = slugVan(location.href);
    function woorden(t) { var o = {}; String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).forEach(function (w) { if (w.length >= 4 && !SW[w] && !/^\d+$/.test(w)) o[w.slice(0, 6)] = 1; }); return Object.keys(o); }
    function tel(lijst) { var h = []; lijst.forEach(function (x) { h.push([x, 1]); }); try { N.sendBeacon('/api/hjdk/stats/hits', new Blob([JSON.stringify({ hits: h })], { type: 'text/plain' })); } catch (e) {} }
    function telSoort(soort, extra) { var h = ['vg-' + dag + '-' + s + '-' + soort, 'vg-' + dag + '-' + uu + '-' + s + '-' + soort]; tel(h.concat(extra || [])); }
    // profiel
    var PK = 'kxvolg', pr = null; try { pr = JSON.parse(localStorage.getItem(PK) || 'null'); } catch (e) {}
    if (!pr || typeof pr !== 'object' || !pr.w) pr = { w: {}, z: [] };
    function bewaar() { try { var e = Object.keys(pr.w).sort(function (a, b) { return pr.w[b] - pr.w[a]; }).slice(0, 120), w = {}; e.forEach(function (k) { w[k] = Math.round(pr.w[k] * 100) / 100; }); pr.w = w; pr.z = pr.z.slice(-60); localStorage.setItem(PK, JSON.stringify(pr)); } catch (e) {} }
    function voeg(t, g) { woorden(t).forEach(function (w) { pr.w[w] = (pr.w[w] || 0) + g; }); }
    if (pr.l !== hier) { Object.keys(pr.w).forEach(function (k) { pr.w[k] *= 0.85; if (pr.w[k] < 0.05) delete pr.w[k]; }); var h1 = D.querySelector('h1'); voeg((h1 ? h1.textContent : '') + ' ' + hier.replace(/-/g, ' '), 1); if (pr.z.indexOf(hier) < 0) pr.z.push(hier); pr.l = hier; bewaar(); }
    // proef
    var K = 'volgpf', P = null; try { P = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) {} if (P && !(P.pid && P.v && Date.now() - (+P.t || 0) < 6 * 864e5)) P = null;
    function pev(o) { if (!P) return; o.site = 'volg'; o.pid = P.pid; o.d = P.d; o.r = P.r; var j = JSON.stringify(o); try { if (!(N.sendBeacon && N.sendBeacon('/api/mm/proefev', new Blob([j], { type: 'text/plain' })))) fetch('/api/mm/proefev', { method: 'POST', body: j, keepalive: true }); } catch (e) {} }
    // kwam iemand via een lijst binnen? dan telt de eerste echte stap hier als 'verder'
    var VK = 'volg-k', vk = null; try { vk = JSON.parse(sessionStorage.getItem(VK) || 'null'); } catch (e) {}
    if (vk && (vk.n !== hier || Date.now() - vk.t > 30 * 6e4)) vk = null;
    D.addEventListener('click', function (e) {
      var x = e.target && e.target.closest ? e.target : null; if (!x) return;
      var a = x.closest('a.card.ov-r');
      if (a && a.__vg) { var sl = slugVan(a.href); telSoort('klik', ['vg-' + dag + '-' + s + '-k-' + sl]); pev({ e: 'klik' }); try { sessionStorage.setItem(VK, JSON.stringify({ n: sl, t: Date.now() })); } catch (e2) {} if (pr.z.indexOf(sl) < 0) pr.z.push(sl); voeg(a.textContent, 1); bewaar(); return; }
      var b = x.closest('.opt,.pl-g>button,.kx-ps button,.kx-cp button,a.card.ov-c,button[data-vq]');
      if (b) { voeg(b.textContent, 2); bewaar(); }
      if (vk && (b || x.closest('a[data-t],a[data-out],a[rel~="nofollow"][href^="http"],a.btn[href^="http"]'))) { telSoort('verder'); pev({ e: 'verder' }); vk = null; try { sessionStorage.removeItem(VK); } catch (e3) {} }
    }, true);
    D.addEventListener('submit', function (e) { try { var f = e.target; var i = f && f.querySelector && f.querySelector('input[type=text],input[type=search],input:not([type]),textarea'); if (i && i.value && !/@/.test(i.value)) { voeg(i.value, 3); bewaar(); } } catch (e2) {} }, true);
    // lijsten vinden en ordenen
    function lijsten() { var g = []; [].forEach.call(D.querySelectorAll('a.card.ov-r'), function (a) { var p = a.parentNode; if (p && g.indexOf(p) < 0 && !p.closest('header,footer,nav')) g.push(p); }); return g.filter(function (p) { return p.querySelectorAll(':scope>a.card.ov-r').length >= 3; }); }
    var CTR = null;
    function ctr(sl) { var z = (CTR && CTR.z[sl]) || 0, k = Math.min((CTR && CTR.k[sl]) || 0, z), p = (k + 0.5) / (z + 5); return p * (1 + (Math.random() - 0.5) * 2 / Math.sqrt(z + 1)); }
    function orden(p, v) {
      var as = [].slice.call(p.querySelectorAll(':scope>a.card.ov-r')); if (v === 'a') return as;
      var sc = as.map(function (a, i) { var sl = slugVan(a.href), ws = woorden(a.textContent + ' ' + sl.replace(/-/g, ' ')), I = 0; ws.forEach(function (w) { I += pr.w[w] || 0; }); return { a: a, i: i, I: I / Math.sqrt(ws.length || 1), C: ctr(sl), al: pr.z.indexOf(sl) >= 0 }; });
      var mI = Math.max.apply(null, sc.map(function (x) { return x.I; }).concat([1e-9])), mC = Math.max.apply(null, sc.map(function (x) { return x.C; }).concat([1e-9]));
      sc.forEach(function (x) { x.S = (v === 'b' ? 0.6 * x.I / mI + 0.4 * x.C / mC : x.C / mC) - (x.al ? 2 : 0) - x.i * 0.001; });
      sc.sort(function (x, y) { return y.S - x.S; });
      var u = sc.map(function (x) { return x.a; }); u.forEach(function (a) { p.appendChild(a); }); return u;
    }
    function zet(v) {
      v = (v && v.volgorde) || 'a'; var gs = lijsten(); if (!gs.length) return;
      gs.forEach(function (p) {
        if (p.__vg) return; p.__vg = 1; var u = orden(p, v); u.forEach(function (a) { a.__vg = 1; });
        // hoogstens 6 zichtbaar (UX-review 19 nov 2026: 14 regels met schmink en regenjas onder een raamrobot); de rest achter Meer, in de HTML blijven alle links
        if (u.length > 7) { u.slice(6).forEach(function (a) { a.hidden = true; }); var mb = D.createElement('button'); mb.type = 'button'; mb.className = 'vg-meer'; mb.textContent = ({ nl: 'Meer keuzehulpen', us: 'More guides', de: 'Weitere Ratgeber' })[s] + ' (' + (u.length - 6) + ')'; mb.addEventListener('click', function () { u.forEach(function (a) { a.hidden = false; }); mb.remove(); telSoort('meer'); }); p.parentNode.insertBefore(mb, p.nextSibling); if (!D.getElementById('vg-css')) { var cs = D.createElement('style'); cs.id = 'vg-css'; cs.textContent = '.vg-meer{font:inherit;font-size:16px;font-weight:700;background:none;border:0;padding:12px 0;color:#111113;cursor:pointer;text-decoration:underline;text-underline-offset:3px}a.card.ov-r[hidden]{display:none!important}'; (D.head || D.documentElement).appendChild(cs); } }
        var top = u.slice(0, 5).map(function (a) { return 'vg-' + dag + '-' + s + '-z-' + slugVan(a.href); }), klaar = false;
        var zie = function () { if (klaar) return; klaar = true; telSoort('zie', top); if (!W.__vgZie) { W.__vgZie = 1; pev({ e: 'zie', c: ctx, v: { volgorde: v } }); } };
        try { var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { zie(); io.disconnect(); } }, { threshold: 0.3 }); io.observe(p); } catch (e) { zie(); }
      });
    }
    function start() {
      var klaar = 0, v = null, ga = function () { if (++klaar === 2) zet(v); };
      fetch('/api/keuze-tools?tool=volg&op=ctr&s=' + s).then(function (r) { return r.json(); }).then(function (j) { if (j && j.z) CTR = j; }).catch(function () {}).then(ga);
      if (P) { v = P.v; ga(); return; }
      fetch('/api/mm/proefkies?site=volg&c=' + ctx, { credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (j) { if (j && j.ok && j.aan && j.pid) { P = { pid: j.pid, d: j.d, r: j.r, v: j.v, t: Date.now() }; try { localStorage.setItem(K, JSON.stringify(P)); } catch (e) {} v = P.v; } }).catch(function () {}).then(ga);
    }
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else start();
  } catch (e) {}
}
export const VOLG_JS = '<script data-volg="1">(' + volgClient.toString() + ')(' + JSON.stringify(STOP) + ');</script>';

async function scanDag(pat) {
  const out = {}; let cursor = 0;
  do { const r = await kv.scan(cursor, { match: pat, count: 500 }); cursor = Number(r[0]); const keys = r[1] || []; if (keys.length) { const vals = await kv.mget(...keys); keys.forEach((k, i) => { out[k.slice(2)] = Number(vals[i]) || 0; }); } } while (cursor !== 0);
  return out;
}

// Tikpercentage per gids over 7 dagen, voor de volgorde in de browser.
export async function ctr(site) {
  const s = ['nl', 'us', 'de'].includes(site) ? site : 'nl', z = {}, k = {};
  const dagen = [...Array(7)].map((_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const lijst = await Promise.all(dagen.map(d => scanDag('c:vg-' + d + '-' + s + '-[zk]-*')));
  lijst.forEach(o => Object.entries(o).forEach(([key, n]) => { const m = key.match(/^vg-\d{4}-\d\d-\d\d-[a-z]+-([zk])-(.+)$/); if (m) { const t = m[1] === 'z' ? z : k; t[m[2]] = (t[m[2]] || 0) + n; } }));
  return { site: s, z, k };
}

// Stand voor het uurrapport: per site vandaag en het vorige uur, en de gidsen waar het meest op getikt wordt.
export async function stand() {
  const dag = new Date().toISOString().slice(0, 10), uu = 'h' + new Date(Date.now() - 3600e3).toISOString().slice(11, 13);
  const out = await scanDag('c:vg-' + dag + '-*'), g = k => out['vg-' + dag + '-' + k] || 0, SO = ['zie', 'klik', 'verder'];
  const sites = ['nl', 'us', 'de'].map(s => ({ site: s, vandaag: Object.fromEntries(SO.map(x => [x, g(s + '-' + x)])), vorigUur: Object.fromEntries(SO.map(x => [x, g(uu + '-' + s + '-' + x)])) }));
  const gids = {}; Object.entries(out).forEach(([key, n]) => { const m = key.match(/^vg-\d{4}-\d\d-\d\d-(nl|us|de)-([zk])-(.+)$/); if (m) { const id = m[1] + '/' + m[3]; gids[id] = gids[id] || { z: 0, k: 0 }; gids[id][m[2]] += n; } });
  const top = Object.entries(gids).filter(([, v]) => v.k > 0).sort((a, b) => b[1].k - a[1].k).slice(0, 8).map(([p, v]) => ({ gids: p, ...v }));
  return { dag, sites, top };
}
export function standTekst(x) {
  const NM = { nl: 'keuzehulp.best', us: 'whichtobuy.best', de: 'kaufberater.best' };
  const r = s => s.zie + ' keer lijst gezien, ' + s.klik + ' keer een volgende gids aangetikt, ' + s.verder + ' keer daarna verder gegaan';
  return 'Volgende gids (lijsten onderaan) ' + x.dag + ' (UTC)\n' + x.sites.map(s => NM[s.site] + ' vandaag: ' + r(s.vandaag) + '\n  vorig uur: ' + r(s.vorigUur)).join('\n') + (x.top.length ? '\nMeest aangetikt:\n' + x.top.map(p => '  ' + p.gids + ': ' + p.k + ' van ' + p.z + ' keer bovenaan').join('\n') : '') + '\nVersies (vast, eigen interesse, wat werkt): /api/mm/proefstand?site=volg&vorm=tekst';
}
