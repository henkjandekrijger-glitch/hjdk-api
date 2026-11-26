// Mobiliseren per bedrijf op de keuzehulpen (Henkjan 26 nov 2026: "geef me UX om overal te mobiliseren per bedrijf als er echt iets aan de hand is.
// Dan hebben we synergie" en na het ontwerp https://claude.ai/artifact/E8Y2V5wiMVoMPD9EwjAoMw: "Ok voer door").
//
// Eén klein blok, op elke pagina met de chat van de keuzehulpen (lib/kzux.js) hetzelfde. Het verschijnt alleen als
//   1. er op we are many now een gepubliceerd dossier over dat bedrijf staat met de tik "ik ook" (IKOOK in lib/wam-dossiers.js), en
//   2. het bedrijf op de pagina echt genoemd wordt, of de bezoeker het in de chat noemt.
// Zonder dossier staat er niets: geen lege teller, geen oproep. Het aantal deelnemers staat er pas vanaf de drempel van de dossiersite
// (DREMPEL.volgers, door de server bevestigde aanmeldingen). Commissie bepaalt nooit of een bedrijf hier staat.
//
// Aanmelden loopt via het bestaande eindpunt van de dossiersite (/api/wam?op=daanmelden, waar = mobi, arm = kz-<site>): zelfde toestemming,
// zelfde welkomstmail (Mailmind-stroom wam-volg), zelfde afmeldlink. Meten: /api/keuze-tools?tool=mobi&op=stand|ev|meet.
// Nieuw dossier erbij: een regel in MOBI en `node scripts/test-mobiliseer.mjs`.
import { kv } from './db.js';

const WAM = 'https://wearemany.now';
// re: patroon dat het bedrijf herkent (hoofdletterongevoelig). Bewust smal: 'ANP' alleen staat ook in gewone bronvermeldingen.
export const MOBI = {
  blendle: { naam: 'Blendle', re: '\\bblendle\\b',
    regel: { nl: 'Er loopt een dossier over Blendle: abonnement opgezegd en geld teruggevraagd.', us: 'There is an open case about Blendle: subscription cancelled and a refund requested.', de: 'Zu Blendle läuft ein Dossier: Abo gekündigt und Geld zurückgefordert.' } },
  anp: { naam: 'ANP', re: 'anp[ -]?(fair licensing|fotoclaim|foto-claim)|fotoclaim van (het )?anp',
    regel: { nl: 'Er loopt een dossier over fotoclaims van het ANP: zo is het bedrag opgebouwd.', us: 'There is an open case about photo claims from ANP.', de: 'Zu Fotoforderungen der ANP läuft ein Dossier.' } },
};
const T = {
  nl: { ook: 'Ik heb dit ook', mee: '{n} mensen doen mee.', kop: 'Doe mee met het dossier {naam}', ph: 'Je e-mailadres', doe: 'Ik doe mee', nota: 'we are many now mag je mailen: elke week een open overzicht van wat er bereikt is, en bij nieuws in dit dossier. Afmelden kan altijd.', privacy: 'Privacy', lees: 'Lees het dossier', klaar: 'Je doet mee. Wie ken je die dit ook heeft?', wa: 'Stuur via WhatsApp', kopie: 'Kopieer link', gekopieerd: 'Gekopieerd', mail: 'Mail', verhaal: 'Vertel wat er bij jou gebeurde', fout: 'Dat lukte niet. Probeer het nog eens.', ongeldig: 'Vul een geldig e-mailadres in.', deel: 'Heb je dit ook bij {naam}? Hier loopt een dossier, doe mee:', uitgever: 'we are many now is van dezelfde uitgever als deze keuzehulp.' },
  us: { ook: 'I have this too', mee: '{n} people have joined.', kop: 'Join the case about {naam}', ph: 'Your email address', doe: 'Count me in', nota: 'we are many now may email you: a weekly open overview of what was achieved, and news in this case. You can unsubscribe at any time.', privacy: 'Privacy', lees: 'Read the case (in Dutch)', klaar: 'You are in. Who else has this?', wa: 'Send via WhatsApp', kopie: 'Copy link', gekopieerd: 'Copied', mail: 'Email', verhaal: 'Tell us what happened to you', fout: 'That did not work. Please try again.', ongeldig: 'Enter a valid email address.', deel: 'Did this happen to you with {naam} too? There is an open case, join here:', uitgever: 'we are many now has the same publisher as this guide.' },
  de: { ook: 'Das habe ich auch', mee: '{n} Menschen machen mit.', kop: 'Mach mit beim Dossier {naam}', ph: 'Deine E-Mail-Adresse', doe: 'Ich mache mit', nota: 'we are many now darf dir mailen: jede Woche eine offene Übersicht, was erreicht wurde, und Neues zu diesem Dossier. Abmelden geht jederzeit.', privacy: 'Datenschutz', lees: 'Dossier lesen (Niederländisch)', klaar: 'Du machst mit. Wen kennst du, der das auch hat?', wa: 'Per WhatsApp senden', kopie: 'Link kopieren', gekopieerd: 'Kopiert', mail: 'E-Mail', verhaal: 'Erzähl, was bei dir passiert ist', fout: 'Das hat nicht geklappt. Bitte versuch es noch einmal.', ongeldig: 'Bitte gib eine gültige E-Mail-Adresse ein.', deel: 'Hast du das bei {naam} auch? Dazu läuft ein Dossier, mach mit:', uitgever: 'we are many now gehört zum selben Herausgeber wie dieser Ratgeber.' },
};
const CSS = '.mobi{border:2px solid currentColor;border-radius:14px;padding:16px 18px;margin:16px 0;font-size:16px;line-height:1.5;text-align:left}.mobi p{margin:0 0 10px;font-size:16px}.mobi p:last-child{margin-bottom:0}.mobi b{font-weight:700}'
  + '.mobi .mb-r{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}.mobi button,.mobi a.mb{font:inherit;font-size:16px;font-weight:600;line-height:1.3;border:2px solid #111113;border-radius:999px;padding:8px 16px;background:#fff;color:#111113;cursor:pointer;text-decoration:none;display:inline-block}'
  + '.mobi .vol,.mobi a.mb.vol,.mobi button.vol{background:#111113;color:#fff}.mobi input{font:inherit;font-size:16px;border:2px solid #111113;border-radius:999px;padding:8px 16px;background:#fff;color:#111113;min-width:0;flex:1 1 200px}.mobi a{color:inherit}'
  + 'html.hs-dk .mobi button,html.hs-dk .mobi a.mb,html.hs-dk .mobi input{background:transparent;color:#F3F4F6;border-color:#F3F4F6}html.hs-dk .mobi .vol,html.hs-dk .mobi a.mb.vol,html.hs-dk .mobi button.vol{background:#F3F4F6;color:#111113}';

// Alleen op de drie keuzehulpsites zelf: niet op nexy.help, gids.kadoly.com, lastingchange.works of de keuzehulp chirurgie (o.geenGeheugen).
export function mobiAan(o) { return !!o && /^(nl|us|de)$/.test(String(o.taal || '')) && /^kz/.test(String(o.site || '')) && !/^kzux(nexy|lc|kadoly)/.test(String(o.site || '')) && !o.geenGeheugen; }

function mobiClient() {
  if (window.__mobi) return; window.__mobi = 1;
  var D = document, klaar = {}, f = D.getElementById('kxf');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]; }); }
  function ev(id, stap, bron) { try { var j = JSON.stringify({ id: id, stap: stap, s: M.s, b: bron }); if (!(navigator.sendBeacon && navigator.sendBeacon('/api/keuze-tools?tool=mobi&op=ev', new Blob([j], { type: 'text/plain' })))) fetch('/api/keuze-tools?tool=mobi&op=ev', { method: 'POST', body: j, keepalive: true, headers: { 'content-type': 'text/plain' } }); } catch (e) {} }
  function blok(d, na, bron) {
    if (klaar[d.id] || !na || !na.parentNode) return; klaar[d.id] = 1;
    var b = D.createElement('div'), url = M.wam + '/dossier/' + d.id, tel = '';
    b.className = 'mobi'; b.setAttribute('data-mobi', d.id);
    function een() { b.innerHTML = '<p>' + esc(d.regel) + (tel ? ' ' + esc(tel) : '') + '</p><div class="mb-r"><button type="button" class="vol" data-mb="ook">' + esc(M.t.ook) + ' &rarr;</button></div>'; b.querySelector('[data-mb=ook]').onclick = function () { ev(d.id, 'tik', bron); twee(); }; }
    function twee(fout) {
      b.innerHTML = '<p><b>' + esc(M.t.kop.replace('{naam}', d.naam)) + '</b></p><p>' + esc(d.regel) + '</p><form class="mb-r" novalidate><input type="email" autocomplete="email" inputmode="email" maxlength="254" required placeholder="' + esc(M.t.ph) + '" aria-label="' + esc(M.t.ph) + '"><button type="submit" class="vol">' + esc(M.t.doe) + ' &rarr;</button></form>'
        + (fout ? '<p role="status"><b>' + esc(fout) + '</b></p>' : '') + '<p>' + esc(M.t.nota) + ' <a href="' + M.wam + '/privacy#updates" target="_blank" rel="noopener">' + esc(M.t.privacy) + '</a> &middot; <a href="' + url + '" target="_blank" rel="noopener">' + esc(M.t.lees) + '</a>. ' + esc(M.t.uitgever) + '</p>';
      var fm = b.querySelector('form'), inp = b.querySelector('input'); try { inp.focus({ preventScroll: true }); } catch (e) {}
      fm.onsubmit = function (e) {
        e.preventDefault(); var em = String(inp.value || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/i.test(em)) return twee(M.t.ongeldig);
        var kn = fm.querySelector('button'); kn.disabled = true;
        fetch('/api/wam?op=daanmelden', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: em, scope: d.id, toestemming: true, website: '', waar: 'mobi', arm: 'kz-' + M.s }) })
          .then(function (r) { return r.json(); }).then(function (j) { if (j && j.ok) { ev(d.id, 'aanmeld', bron); drie(); } else twee((j && j.fout) || M.t.fout); }).catch(function () { twee(M.t.fout); });
      };
    }
    function drie() {
      var zin = M.t.deel.replace('{naam}', d.naam) + ' ' + url;
      b.innerHTML = '<p role="status"><b>' + esc(M.t.klaar) + '</b></p><div class="mb-r"><a class="mb vol" data-mb="wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(zin) + '">' + esc(M.t.wa) + '</a><button type="button" data-mb="kopie">' + esc(M.t.kopie) + '</button><a class="mb" data-mb="mail" href="mailto:?subject=' + encodeURIComponent(d.naam) + '&body=' + encodeURIComponent(zin) + '">' + esc(M.t.mail) + '</a></div><p><a href="' + url + '" target="_blank" rel="noopener">' + esc(M.t.verhaal) + ' &rarr;</a></p>';
      b.querySelector('[data-mb=wa]').onclick = function () { ev(d.id, 'deel', bron); };
      b.querySelector('[data-mb=mail]').onclick = function () { ev(d.id, 'deel', bron); };
      var k = b.querySelector('[data-mb=kopie]'); k.onclick = function () { ev(d.id, 'deel', bron); try { navigator.clipboard.writeText(url).then(function () { k.textContent = M.t.gekopieerd; }, function () {}); } catch (e) {} };
    }
    een(); na.parentNode.insertBefore(b, na.nextSibling);
    fetch('/api/keuze-tools?tool=mobi&op=stand').then(function (r) { return r.json(); }).then(function (j) { var n = j && j.d && j.d[d.id] && j.d[d.id].n; if (n && b.querySelector('[data-mb=ook]')) { tel = M.t.mee.replace('{n}', Number(n).toLocaleString(D.documentElement.lang || 'nl')); een(); } }).catch(function () {});
    try { var io = new IntersectionObserver(function (es) { if (es[0] && es[0].isIntersecting) { io.disconnect(); ev(d.id, 'gezien', bron); } }, { threshold: 0.6 }); io.observe(b); } catch (e) { ev(d.id, 'gezien', bron); }
  }
  function zoek() {
    var h = D.querySelector('main') || D.body, els = h.querySelectorAll('p,li,td,th,h2,h3,summary,figcaption');
    M.d.forEach(function (d) {
      var re = new RegExp(d.re, 'i');
      for (var i = 0; i < els.length; i++) {
        var el = els[i]; if (el.closest('.kx,.mobi,footer,header,nav,script,style')) continue;
        if (re.test(el.textContent || '')) { blok(d, el.closest('ul,ol,table,details') || el, 'pagina'); break; }
      }
    });
  }
  function chat(q) { M.d.forEach(function (d) { if (new RegExp(d.re, 'i').test(q)) setTimeout(function () { blok(d, D.getElementById('kx'), 'chat'); }, 1500); }); }
  if (f) f.addEventListener('submit', function () { var i = D.getElementById('kxq'); chat(String((i && i.value) || '')); }, true);
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', zoek); else zoek();
}

// Script en stijl voor achter de chat (lib/kzux.js kzuxBlok). Geeft niets terug zolang er geen dossier in MOBI staat.
export function mobiJs(o) {
  if (!mobiAan(o) || !Object.keys(MOBI).length) return '';
  const taal = o.taal, t = T[taal] || T.nl;
  const cfg = JSON.stringify({ s: taal, wam: WAM, t, d: Object.entries(MOBI).map(([id, d]) => ({ id, naam: d.naam, re: d.re, regel: d.regel[taal] || d.regel.nl })) }).replace(/</g, '\\u003c');
  return '<style>' + CSS + '</style><script>(function(){var M=' + cfg + ';(' + mobiClient.toString() + ')()})();</script>';
}

// --- server ---
const DAG = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Curacao', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const paren = r => Array.isArray(r) ? Object.fromEntries(Array.from({ length: r.length / 2 }, (_, i) => [r[2 * i], r[2 * i + 1]])) : (r || {});
const STAPPEN = new Set(['gezien', 'tik', 'aanmeld', 'deel']), BRON = new Set(['pagina', 'chat']);
const BOT = /bot|crawl|spider|slurp|headless|preview|lighthouse|pagespeed|gptbot|claude|perplexity|bingpreview/i;

// Aantal deelnemers per dossier voor het blok: door de server bevestigde aanmeldingen, pas vanaf de drempel van de dossiersite.
export async function mobiStand(db = kv) {
  const { volgersStand } = await import('./wam-aanmelden.js'); const { DREMPEL } = await import('./wam-dossiers.js');
  const v = await volgersStand(db).catch(() => ({})), d = {};
  for (const id of Object.keys(MOBI)) { const n = Number(v[id]) || 0; d[id] = n >= DREMPEL.volgers ? { n } : {}; }
  return { ok: true, d };
}
// Eén stap van een bezoeker: teller per Curaçaose dag in één hash, 60 dagen bewaard (Redis zit krap).
export async function mobiEv(b, ua, db = kv) {
  const id = String(b?.id || ''), stap = String(b?.stap || ''), s = String(b?.s || ''), bron = BRON.has(String(b?.b || '')) ? String(b.b) : 'pagina';
  if (!MOBI[id] || !STAPPEN.has(stap) || !/^(nl|us|de)$/.test(s) || BOT.test(String(ua || ''))) return { ok: false };
  const k = 'kz:mobi:' + DAG(); await db.raw(['HINCRBY', k, [s, id, bron, stap].join('|'), 1]); await db.raw(['EXPIRE', k, 60 * 86400]);
  return { ok: true };
}
// Overzicht voor de dagronde (beschermde host): stappen per site, dossier en bron over de laatste dagen, de bevestigde aanmeldingen
// uit de dossiersite (waar = mobi) en het lek: veel gezien, geen bevestigde aanmelding.
export async function mobiMeet(dagen = 14, db = kv) {
  const { aanmeldStand } = await import('./wam-aanmelden.js'); const uit = [], som = {}; let bevestigd = 0;
  for (let i = 0; i < dagen; i++) {
    const dag = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Curacao', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() - i * 864e5));
    const h = paren(await db.raw(['HGETALL', 'kz:mobi:' + dag]).catch(() => [])), a = await aanmeldStand(dag, db).catch(() => ({}));
    const mob = Object.fromEntries(Object.entries(a).filter(([k]) => /^mobi\|/.test(k)));
    for (const [k, n] of Object.entries(h)) { const st = k.split('|').pop(); som[st] = (som[st] || 0) + Number(n || 0); }
    for (const n of Object.values(mob)) bevestigd += Number(n || 0);
    if (Object.keys(h).length || Object.keys(mob).length) uit.push({ dag, stappen: Object.fromEntries(Object.entries(h).map(([k, n]) => [k, Number(n)])), bevestigd: mob });
  }
  const gezien = som.gezien || 0, lek = gezien >= 200 && !bevestigd ? 'Blok ' + gezien + ' keer gezien en geen bevestigde aanmelding: eerst de regel of de knoptekst aanpassen (één factor).' : null;
  return { ok: true, dossiers: Object.keys(MOBI), dagen: uit, som, bevestigd, lek };
}
