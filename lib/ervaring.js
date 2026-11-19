// Ervaringen van bezoekers, gepubliceerd als één samenvatting (19 nov 2026, Henkjan: "CTA om commentaar te leveren via chat we plaatsen niet meteen
// maar modereren en plaatsen consensus die we ook weer optimaliseren voor SEO en LLM. Dus 8 mensen reageeren maar er staat maar 1 tekst based op
// die 8 reacties . Dat is ons data point ." en "Probeer ook bij review meteen weer contact vast te leggen voor als reactie of er iets verandert .
// Ik wil hiermee ook power to the people terug brengen en is data moat .").
//
// Hoe het werkt
// - Bij elke zaak (lijst en zaakpagina op keuzehulp.best/rotterdam) staat de rustige link "Jouw ervaring". Die opent onder de zaak een klein
//   chatblok: drie vragen met Ja/Nee (snel geholpen, duidelijke uitleg, zou je terug gaan), een vrij veld, en "Wil je bericht als <zaak> reageert
//   of er iets verandert?" met e-mail of 06-nummer. Niets komt meteen online.
// - Opslag (KV, privé): rdam:erv:<dienst>:<zaak> lijst reacties {id, t, p, tekst}; de zaak in de set rdam:erv:wacht. Contact apart in
//   rdam:erv:ct:<dienst>:<zaak> {id, c, soort, t, ok-tekst}: komt nooit op een pagina, in een export of in een overdracht. Hoogstens één reactie per
//   toestel (gehasht IP + browser) per zaak per 30 dagen.
// - Nachtronde (geplande taak in de cloud): leest de wachtrij via /api/keuze-tools?tool=rdam&op=wacht (alleen de beschermde vercel.app-host, zonder
//   contactgegevens), modereert (geen namen van personen, geen beschuldigingen, geen reclame) en schrijft per zaak met minstens 3 reacties één zin
//   die zegt wat de meerderheid vindt, met de woorden waarop mensen zoeken: op=cons&d=&s=&tekst= (beschermd). Verdeeld staat erbij als dat zo is.
// - De samenvatting (rdam:cons:<dienst>, hash zaak -> {tekst, n, terug, dag}) staat in de lijst, op de zaakpagina, in de FAQ (FAQPage) en telt in
//   de Keuzehulp-score als onderdeel Bezoekers (10 punten, vanaf 5 reacties; daaronder neutraal 5).
// - Tellers (/api/hjdk/stats/hits): erv-<dag>-<open|stuur|contact>; stand /api/keuze-tools?tool=rdam&op=ervstand.
import { kv } from './db.js';
import crypto from 'node:crypto';

const SL = s => String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
const VRAGEN = [['snel', 'Snel geholpen?'], ['uitleg', 'Duidelijke uitleg?'], ['terug', 'Zou je terug gaan?']];

function ervClient(VR) {
  try {
    var W = window, D = document, N = navigator; if (W.__erv) return; W.__erv = 1;
    var ua = N.userAgent || ''; if (/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(ua) || N.webdriver) return;
    var p = location.pathname.split('/'), dienst = p[2] || ''; if (p[1] !== 'rotterdam' || !dienst) return;
    var dag = new Date().toISOString().slice(0, 10);
    function tel(k) { try { N.sendBeacon('/api/hjdk/stats/hits', new Blob([JSON.stringify({ hits: [['erv-' + dag + '-' + k, 1]] })], { type: 'text/plain' })); } catch (e) {} }
    var css = D.createElement('style');
    css.textContent = '.ev-l{font:inherit;font-size:14px;font-weight:500;background:none;border:0;padding:4px 0;margin:0 18px 0 0;color:#6B7280;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}.ev-l:hover{color:#111113;text-decoration:underline;text-underline-offset:3px}.ev-l svg{width:14px;height:14px}.zaken .dl-pa{display:inline-block}.ev-w{display:inline-block}'
      + '.ev{margin:10px 0 4px;padding:14px;border:1px solid #E5E7EB;border-radius:14px;display:grid;gap:10px;max-width:560px}.ev-b{margin:0;font-size:16px;line-height:1.5}.ev-q{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.ev-q span{flex:1 1 160px;font-size:16px}.ev-q button,.ev-s{font:inherit;font-size:15px;font-weight:600;border:1px solid #D1D5DB;background:#fff;color:#111113;border-radius:999px;padding:7px 16px;cursor:pointer;min-height:40px}.ev-q button[aria-pressed=true]{background:#111113;border-color:#111113;color:#fff}.ev textarea,.ev input{font:inherit;font-size:16px;border:1px solid #D1D5DB;border-radius:12px;padding:10px 12px;width:100%;box-sizing:border-box;background:#fff;color:#111113}.ev textarea{min-height:70px;resize:vertical}.ev-k{margin:0;font-size:13px;color:#6B7280;line-height:1.5}.ev-s{background:#111113;color:#fff;border-color:#111113;justify-self:start}.ev-s:disabled{opacity:.4;cursor:default}.ev-f{margin:0;font-size:14px;color:#B3261E}'
      + '@media (prefers-color-scheme:dark){.ev{border-color:#374151}.ev-l{color:#9CA3AF}.ev-q button,.ev textarea,.ev input{background:#1C1F26;color:#F3F4F6;border-color:#4B5563}.ev-q button[aria-pressed=true],.ev-s{background:#F3F4F6;color:#111113;border-color:#F3F4F6}}';
    (D.head || D.documentElement).appendChild(css);
    var IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function open(knop, zaak, naam) {
      var host = knop.closest('li') || knop.parentNode.parentNode; var oud = host.querySelector('.ev'); if (oud) { oud.remove(); return; }
      tel('open'); var A = {};
      var f = D.createElement('div'); f.className = 'ev'; f.setAttribute('role', 'group'); f.setAttribute('aria-label', 'Jouw ervaring met ' + naam);
      f.innerHTML = '<p class="ev-b">Ben je bij <strong>' + esc(naam) + '</strong> geweest? Drie korte vragen.</p>'
        + VR.map(function (v) { return '<div class="ev-q" data-k="' + v[0] + '"><span>' + esc(v[1]) + '</span><button type="button" data-v="1" aria-pressed="false">Ja</button><button type="button" data-v="0" aria-pressed="false">Nee</button></div>'; }).join('')
        + '<textarea maxlength="400" placeholder="Wat moet een ander weten? (mag leeg)" aria-label="Wat moet een ander weten?"></textarea>'
        + '<p class="ev-b">Wil je bericht als ' + esc(naam) + ' reageert of als er iets verandert?</p>'
        + '<input type="text" inputmode="email" autocomplete="email" maxlength="80" placeholder="E-mail of 06-nummer (mag leeg)" aria-label="E-mail of 06-nummer">'
        + '<p class="ev-k">Alleen voor berichten over deze zaak; afmelden kan altijd. We plaatsen niet meteen: zodra 3 mensen reageerden staat er één samenvatting bij deze zaak.</p>'
        + '<button type="button" class="ev-s" disabled>Versturen</button><p class="ev-f" hidden></p>';
      var after = knop.closest('.ev-w') || knop; after.parentNode.insertBefore(f, after.nextSibling);
      var s = f.querySelector('.ev-s'), fout = f.querySelector('.ev-f');
      f.addEventListener('click', function (e) {
        var b = e.target.closest('.ev-q button'); if (b) { var q = b.parentNode; [].forEach.call(q.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); A[q.getAttribute('data-k')] = +b.getAttribute('data-v'); s.disabled = !('terug' in A); return; }
        if (e.target.closest('.ev-s') && !s.disabled) {
          var c = f.querySelector('input').value.trim(), t = f.querySelector('textarea').value.trim();
          if (c && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c) && !/^(\+|00)?[\d\s-]{9,15}$/.test(c)) { fout.textContent = 'Dat lijkt geen e-mailadres of telefoonnummer. Laat het leeg of pas het aan.'; fout.hidden = false; return; }
          s.disabled = true; fout.hidden = true;
          fetch('/api/keuze-tools?tool=rdam&op=ervaring', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ d: dienst, s: zaak, p: A, t: t, c: c, w: f.querySelector('.hp') ? 'x' : '' }) })
            .then(function (r) { return r.json(); }).then(function (j) {
              if (!j || !j.ok) { fout.textContent = j && j.al ? 'Je gaf al een reactie over deze zaak. Dank je.' : 'Dat lukte niet. Probeer het later nog eens.'; fout.hidden = false; if (!(j && j.al)) s.disabled = false; return; }
              tel('stuur'); if (c) tel('contact');
              f.innerHTML = '<p class="ev-b">Dank je. Je reactie telt mee in de samenvatting bij ' + esc(naam) + '.' + (c ? ' We laten het je weten als ' + esc(naam) + ' reageert of als er iets verandert.' : '') + '</p>';
            }).catch(function () { fout.textContent = 'Dat lukte niet. Probeer het later nog eens.'; fout.hidden = false; s.disabled = false; });
        }
      });
    }
    function zet() {
      var items = [];
      [].forEach.call(D.querySelectorAll('#zl > li, #rtop li'), function (li) { var a = li.querySelector('.n a[href^="/rotterdam/' + dienst + '/"]'); if (a) items.push([li, a.getAttribute('href').split('/')[3], a.textContent.trim()]); });
      if (p[3]) { var kn = D.querySelector('main .kn'), h1 = D.querySelector('h1'); if (kn && h1) items.push([kn, p[3], h1.textContent.trim()]); }
      items.forEach(function (x) {
        var el = x[0]; if (el.__erv) return; el.__erv = 1;
        var w = D.createElement('div'); w.className = 'ev-w'; w.innerHTML = '<button type="button" class="ev-l" data-zaak="' + esc(x[1]) + '" data-naam="' + esc(x[2]) + '">' + IC + '<span>Jouw ervaring</span></button>';
        if (el.tagName === 'LI') el.appendChild(w); else el.parentNode.insertBefore(w, el.nextSibling);
      });
    }
    D.addEventListener('click', function (e) { var k = e.target.closest && e.target.closest('.ev-l'); if (!k) return; e.preventDefault(); open(k, k.getAttribute('data-zaak'), k.getAttribute('data-naam')); });
    var go = function () { zet(); setTimeout(zet, 1500); try { var tm = 0; new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(zet, 400); }).observe(D.getElementById('rtop') || D.body, { childList: true, subtree: true }); } catch (e) {} };
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', go); else go();
  } catch (e) {}
}
export const ERV_JS = '<script data-erv="1">(' + ervClient.toString() + ')(' + JSON.stringify(VRAGEN) + ');</script>';

const hash = s => crypto.createHash('sha256').update('erv|' + s).digest('hex').slice(0, 20);
const isMail = c => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c), isTel = c => /^(\+|00)?[\d\s-]{9,15}$/.test(c);

// Een reactie bewaren (POST, openbaar). Contact apart en nooit naar buiten.
export async function bewaar(b, req, bestaat) {
  const d = SL(b && b.d), s = SL(b && b.s); if (!d || !s || (b && b.w)) return { ok: false };
  if (bestaat && !(await bestaat(d, s))) return { ok: false };
  const p = {}; ['snel', 'uitleg', 'terug'].forEach(k => { const v = b && b.p && b.p[k]; if (v === 0 || v === 1) p[k] = v; }); if (!('terug' in p)) return { ok: false };
  const tekst = String((b && b.t) || '').replace(/\s+/g, ' ').trim().slice(0, 400), c = String((b && b.c) || '').trim().slice(0, 80);
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), wie = hash(ip + '|' + String(req.headers['user-agent'] || '').slice(0, 120));
  const vrij = await kv.raw(['SET', 'rdam:erv:een:' + d + ':' + s + ':' + wie, '1', 'NX', 'EX', String(30 * 86400)]).catch(() => 'OK'); if (vrij !== 'OK') return { ok: false, al: true };
  const id = crypto.randomBytes(6).toString('hex'), t = new Date().toISOString();
  await kv.raw(['LPUSH', 'rdam:erv:' + d + ':' + s, JSON.stringify({ id, t, p, tekst })]);
  await kv.raw(['SADD', 'rdam:erv:wacht', d + ':' + s]);
  if (c && (isMail(c) || isTel(c))) await kv.raw(['LPUSH', 'rdam:erv:ct:' + d + ':' + s, JSON.stringify({ id, c, soort: isMail(c) ? 'mail' : 'tel', t, ok: 'bericht als de zaak reageert of er iets verandert' })]);
  return { ok: true };
}

const lees = async (d, s) => ((await kv.raw(['LRANGE', 'rdam:erv:' + d + ':' + s, '0', '199']).catch(() => [])) || []).map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);

// Wachtrij voor de nachtronde: per zaak alle reacties (zonder contact), met het aandeel ja per vraag. Alleen beschermd.
export async function wacht() {
  const leden = (await kv.raw(['SMEMBERS', 'rdam:erv:wacht']).catch(() => [])) || [], out = [];
  for (const k of leden) {
    const [d, s] = k.split(':'), r = await lees(d, s), cons = await kv.raw(['HGET', 'rdam:cons:' + d, s]).catch(() => null);
    const ja = q => { const v = r.filter(x => q in x.p); return v.length ? Math.round(100 * v.filter(x => x.p[q] === 1).length / v.length) : null; };
    out.push({ d, s, n: r.length, ja: { snel: ja('snel'), uitleg: ja('uitleg'), terug: ja('terug') }, teksten: r.map(x => x.tekst).filter(Boolean), nu: cons ? JSON.parse(cons) : null });
  }
  return { ok: true, uitleg: 'Per zaak met nieuwe reacties: n, % ja per vraag, de teksten (ongemodereerd, niet publiceren). Vanaf n>=3: schrijf met op=cons&d=&s=&tekst= één zin van hoogstens 30 woorden die zegt wat de meerderheid vindt; geen namen van personen, geen beschuldigingen, geen reclame; verdeeld = zeg dat. Onder 3: laat staan. Afwijzen (spam): op=cons&d=&s=&uit=1.', zaken: out.sort((a, b) => b.n - a.n) };
}

// Samenvatting zetten (beschermd). Haalt de zaak uit de wachtrij als hij verwerkt is.
export async function zetCons(d, s, tekst, uit) {
  d = SL(d); s = SL(s); if (!d || !s) return { ok: false };
  if (uit) { await kv.raw(['SREM', 'rdam:erv:wacht', d + ':' + s]); return { ok: true, uit: true }; }
  tekst = String(tekst || '').replace(/\s+/g, ' ').replace(/[–—]/g, ',').trim().slice(0, 260); if (tekst.length < 15) return { ok: false, fout: 'tekst te kort' };
  const r = await lees(d, s); if (r.length < 3) return { ok: false, fout: 'minder dan 3 reacties' };
  const v = r.filter(x => 'terug' in x.p), terug = v.length ? Math.round(100 * v.filter(x => x.p.terug === 1).length / v.length) : null;
  const c = { tekst, n: r.length, terug, dag: new Date().toISOString().slice(0, 10) };
  await kv.raw(['HSET', 'rdam:cons:' + d, s, JSON.stringify(c)]); await kv.raw(['SREM', 'rdam:erv:wacht', d + ':' + s]);
  return { ok: true, ...c };
}

// Alle samenvattingen van een dienst: { zaak: {tekst, n, terug, dag} }.
export async function consensus(d) {
  const r = (await kv.raw(['HGETALL', 'rdam:cons:' + SL(d)]).catch(() => [])) || [], o = {};
  if (Array.isArray(r)) { for (let i = 0; i + 1 < r.length; i += 2) { try { o[r[i]] = JSON.parse(r[i + 1]); } catch {} } } else Object.entries(r).forEach(([k, v]) => { try { o[k] = JSON.parse(v); } catch {} });
  return o;
}

export async function stand() {
  const dagen = [...Array(7)].map((_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)), keys = [];
  dagen.forEach(d => ['open', 'stuur', 'contact'].forEach(k => keys.push('c:erv-' + d + '-' + k)));
  const v = await kv.mget(...keys).catch(() => []), out = {};
  dagen.forEach((d, i) => { out[d] = { open: +v[i * 3] || 0, stuur: +v[i * 3 + 1] || 0, contact: +v[i * 3 + 2] || 0 }; });
  const wachtN = Number(await kv.raw(['SCARD', 'rdam:erv:wacht']).catch(() => 0)) || 0;
  return { per_dag: out, zaken_in_wachtrij: wachtN };
}
