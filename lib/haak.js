// Haken in de chat van de keuzehulpen (Henkjan 21 nov 2026: "Ga verder leren ! Zorg dat ze engagen contact willen houden ... vind je hooks
// probeer alles uit . Kijk ook of je iets met peers kan ... Wat nl goed werkt denk ik is wat anderen voor antwoord gaven . Je kunt ook kennis
// test doen ... En je score zien En dan vragen wil je in contact komen met mensen met zelfde score ?").
//
// Factor 'haak' in de proef kzuxnl (lib/proef.js), Thompson sampling, dus wat werkt krijgt vanzelf meer bezoekers:
//   a  geen haak (controle)
//   b  peiling boven de chat: wat is voor jou het belangrijkst; daarna wat anderen kozen (vanaf 5 stemmen) en de passende vraag aan de chat
//   c  kennistest boven de chat: 4 vragen, score, "beter dan x% van n mensen" (vanaf 10), vriend uitdagen, contact met mensen met dezelfde score
//   d  peiling pas na het eerste chatantwoord, als bericht in de chat ("Wat kozen anderen hier?")
//   e  uitdaging: dezelfde test, gebracht als "wie weet meer, jij of je vriend?", delen is de hoofdactie
// Wie binnenkomt via een uitdaging (?uitdaag=<score>) krijgt altijd de test met de score van de vriend; dat telt niet als arm.
// Waarde (kzuxnl): tik 1, pill 2, quiz 6, deel 25, contact 45, plus wat de chat zelf oplevert. Stand: /api/mm/proefstand?site=kzuxnl&vorm=tekst
// en /api/keuze-tools?tool=haak&op=stand.
// Contact met dezelfde score: mailadres in haak:mt:<taal>:<slug>:<score> (120 dagen), plus aanmelding voor updates over het onderwerp.
// Het voorstelmailtje (drie mensen met dezelfde score) gaat pas de deur uit als kv haak:zend op 1 staat (Henkjans woord).
// Nieuwe pagina erbij: zet de inhoud in HAAK hieronder (feiten alleen met bron, geen meningen als juist antwoord).
import { createHash } from 'node:crypto';
import { kv } from './db.js';

export const HAAK = {
  'nl:airfryer': {
    onderwerp: 'airfryers',
    peil: {
      v: 'Wat is voor jou het belangrijkst bij een airfryer?',
      o: ['Groot genoeg voor het hele gezin', 'Zuinig met stroom', 'Makkelijk schoon te maken', 'Zo weinig mogelijk betalen'],
      q: ['Welke airfryer is groot genoeg voor een gezin van 4?', 'Welke airfryer is het zuinigst met stroom?', 'Welke airfryer is het makkelijkst schoon te maken?', 'Wat is de beste goedkope airfryer?'],
    },
    quiz: [
      { v: 'Hoeveel liter heb je nodig voor 4 personen?', o: ['2 tot 3 liter', '3 tot 4 liter', '5 tot 7 liter', 'Meer dan 10 liter'], g: 2, u: 'Reken op ongeveer 1,5 liter per persoon; 3 tot 4 liter is genoeg voor 1 of 2 mensen.' },
      { v: 'Waarom heb je in een airfryer weinig of geen olie nodig?', o: ['Hete lucht blaast snel rond het eten', 'Hij stoomt het eten gaar', 'Er zit een magnetron in', 'De mand trekt het vet eruit'], g: 0, u: 'Een ventilator blaast hete lucht langs het eten, zoals een kleine heteluchtoven. Daardoor wordt de buitenkant krokant.' },
      { v: 'Wat is het voordeel van een airfryer met twee lades?', o: ['Twee gerechten tegelijk, elk met eigen tijd en temperatuur', 'Hij wordt sneller heet', 'Hij gebruikt minder stroom per lade', 'Je kunt er ook in koken met water'], g: 0, u: 'Met twee lades maak je bijvoorbeeld friet en kip tegelijk, en laat je ze op hetzelfde moment klaar zijn.' },
      { v: 'Is een airfryer zuiniger dan een gewone oven voor een kleine portie?', o: ['Ja, meestal: kleinere ruimte en kortere tijd', 'Nee, hij gebruikt altijd meer', 'Ze gebruiken precies evenveel', 'Alleen als je hem voorverwarmt'], g: 0, u: 'De ruimte is veel kleiner en hij is sneller heet, dus voor een kleine portie gebruik je meestal minder stroom.' },
    ],
    deel: 'Ik scoorde {s} van {n} op de airfryer-test. Kun jij beter?',
  },
};
export const haakData = (taal, slug) => HAAK[String(taal) + ':' + String(slug)] || null;

const T = {
  nl: {
    test: 'Test je kennis over {o}: {n} vragen', uitdaag: 'Wie weet meer over {o}: jij of je vriend? Doe de test en daag hem uit.', start: 'Start de test',
    vriend: 'Je vriend scoorde {s} van {n}. Kun jij beter?', goed: 'Goed.', fout: 'Niet goed.', volgende: 'Volgende vraag', uitslag: 'Bekijk je score',
    score: 'Je score: {s} van {n}.', beter: 'Beter dan {p}% van de {t} mensen die de test deden.', win: 'Je wint van je vriend.', gelijk: 'Gelijk met je vriend.', verlies: 'Je vriend wint deze keer.',
    daag: 'Daag een vriend uit', gekopieerd: 'Link gekopieerd. Stuur hem door.', contactV: 'Wil je in contact komen met mensen met dezelfde score?', ja: 'Ja, graag',
    mailV: 'Op welk mailadres?', mailPh: 'jouw@mail.nl', mailK: 'Aanmelden',
    staat: 'Je staat erbij. Zodra jullie met drie mensen met score {s} zijn, stellen we jullie per mail aan elkaar voor. Alleen zij krijgen je mailadres.',
    staatN: 'Je staat erbij, met {k} andere mensen met score {s}. Zodra jullie met drie zijn, stellen we jullie per mail aan elkaar voor. Alleen zij krijgen je mailadres.',
    anderen: 'Wat kozen anderen hier?', jij: 'Jij koos: {o}.', pct: '{p}% koos dit', ook: '{p}% van de {t} mensen koos hetzelfde.', past: 'Welke past daar het best bij?',
  },
};

const OK = s => /^[a-z0-9-]{2,100}$/.test(String(s || ''));
const N = x => Number(x) || 0;

async function tel(sleutel, veld, aantal) {
  await kv.raw(['HINCRBY', sleutel, String(veld), '1']);
  await kv.raw(['EXPIRE', sleutel, String(400 * 86400)]);
  const r = await kv.raw(['HMGET', sleutel, ...Array.from({ length: aantal }, (_, i) => String(i))]);
  return (r || []).map(N);
}

export async function stem(b) {
  const h = haakData(b.taal, b.slug); const i = N(b.i);
  if (!h || !OK(b.slug) || !(i >= 0 && i < h.peil.o.length)) return { ok: false };
  return { ok: true, n: await tel('haak:p:' + b.taal + ':' + b.slug, i, h.peil.o.length) };
}

export async function quiz(b) {
  const h = haakData(b.taal, b.slug); const s = N(b.s);
  if (!h || !OK(b.slug) || !(s >= 0 && s <= h.quiz.length)) return { ok: false };
  return { ok: true, n: await tel('haak:q:' + b.taal + ':' + b.slug, s, h.quiz.length + 1) };
}

export async function match(b) {
  const h = haakData(b.taal, b.slug); const s = N(b.s); const m = String(b.mail || '').trim().toLowerCase().slice(0, 120);
  if (!h || !OK(b.slug) || !(s >= 0 && s <= h.quiz.length) || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(m)) return { ok: false };
  const k = 'haak:mt:' + b.taal + ':' + b.slug + ':' + s;
  await kv.raw(['SADD', k, m]); await kv.raw(['EXPIRE', k, String(120 * 86400)]);
  const n = N(await kv.raw(['SCARD', k]));
  return { ok: true, anderen: Math.max(0, n - 1) };
}

export async function stand() {
  const uit = {};
  for (const [key, h] of Object.entries(HAAK)) {
    const [taal, slug] = key.split(':');
    const p = (await kv.raw(['HMGET', 'haak:p:' + key, ...h.peil.o.map((_, i) => String(i))]) || []).map(N);
    const q = (await kv.raw(['HMGET', 'haak:q:' + key, ...Array.from({ length: h.quiz.length + 1 }, (_, i) => String(i))]) || []).map(N);
    const mt = []; for (let s = 0; s <= h.quiz.length; s++) mt.push(N(await kv.raw(['SCARD', 'haak:mt:' + key + ':' + s])));
    uit[key] = { taal, slug, peiling: Object.fromEntries(h.peil.o.map((o, i) => [o, p[i]])), scores: q, contactPerScore: mt };
  }
  return { ok: true, haken: uit, zend: String(await kv.raw(['GET', 'haak:zend']) || '') === '1' };
}

// Voorstellen: drie mensen met dezelfde score op dezelfde test krijgen samen één mail, met elkaars adres (dat beloofde de pagina).
// Draait elke 2 uur (cron); verstuurt alleen als kv haak:zend op 1 staat, anders telt hij wat klaarstaat. Nooit adressen in de uitvoer.
const MAIL = {
  nl: (h, s, n, url) => ({
    onderwerp: `Drie mensen met score ${s} van ${n} op de ${h.onderwerp.replace(/s$/, '')}-test`,
    tekst: ['Hoi,', '', `Jullie deden alle drie de test over ${h.onderwerp} op keuzehulp.best, scoorden ${s} van ${n} en wilden in contact komen met mensen met dezelfde score. Hier zijn jullie: jullie adressen staan in deze mail.`, '',
      'Klik op Beantwoorden om kennis te maken; je antwoord gaat naar de andere twee. Bijvoorbeeld: welke heb je, of welke twijfel je nog?', '', `De keuzehulp: ${url}`, '',
      'Henkjan de Krijger', 'keuzehulp.best', 'Vragen voor mij? Bel of app +31 6 55395630.'].join('\n'),
  }),
};
export async function voorstel({ droog = false } = {}) {
  const zend = !droog && String(await kv.raw(['GET', 'haak:zend']) || '') === '1';
  const { resendDomeinen } = await import('./terugauto.js').catch(() => ({}));
  let van = null;
  if (zend) {
    const d = resendDomeinen ? await resendDomeinen(kv).catch(() => null) : null; const ok = new Set(((d && d.domeinen) || []).filter(x => x.status === 'verified').map(x => x.naam));
    for (const dom of ['keuzehulp.best', 'whichtobuy.best', 'adsfair.xyz']) if (ok.has(dom)) { van = 'Henkjan de Krijger <henkjan@' + dom + '>'; break; }
  }
  const key = process.env.RESEND_API_KEY || process.env.RESEND || ((await kv.get('hjdk:secrets').catch(() => null)) || {}).RESEND_API_KEY || '';
  const uit = [];
  for (const [k, h] of Object.entries(HAAK)) {
    const [taal, slug] = k.split(':'); const n = h.quiz.length;
    for (let s = 0; s <= n; s++) {
      const leden = (await kv.raw(['SMEMBERS', 'haak:mt:' + k + ':' + s])) || []; const al = new Set((await kv.raw(['SMEMBERS', 'haak:mtd:' + k + ':' + s])) || []);
      const nieuw = leden.filter(m => !al.has(m)); const groepen = Math.floor(nieuw.length / 3);
      if (!nieuw.length) continue;
      const r = { haak: k, score: s, wacht: nieuw.length, groepen, verstuurd: 0 };
      if (zend && van && key && MAIL[taal]) for (let g = 0; g < groepen; g++) {
        const wie = nieuw.slice(g * 3, g * 3 + 3), m = MAIL[taal](h, s, n, 'https://keuzehulp.best/' + slug);
        const x = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json', 'idempotency-key': 'haak-' + createHash('sha256').update(k + '|' + s + '|' + wie.slice().sort().join(',')).digest('hex').slice(0, 32) },
          body: JSON.stringify({ from: van, to: wie, reply_to: wie, subject: m.onderwerp, text: m.tekst, tags: [{ name: 'stroom', value: 'haak-voorstel' }] }) }).then(y => y.ok).catch(() => false);
        if (x) { await kv.raw(['SADD', 'haak:mtd:' + k + ':' + s, ...wie]); await kv.raw(['EXPIRE', 'haak:mtd:' + k + ':' + s, String(400 * 86400)]); r.verstuurd++; }
      }
      uit.push(r);
    }
  }
  return { ok: true, zend, van: van ? van.replace(/<.*>/, '').trim() : null, wacht: uit };
}
export const voorbeeldMail = (k = 'nl:airfryer', s = 3) => { const h = HAAK[k]; const [taal, slug] = k.split(':'); return MAIL[taal](h, s, h.quiz.length, 'https://keuzehulp.best/' + slug); };

// ---- in de pagina ----
const CSS = '.hk{border:2px solid #111113;border-radius:16px;padding:16px 18px;margin:4px 0 16px}.hk p{margin:0 0 10px;font-size:16px;line-height:1.5}.hk p.hk-t{font-weight:700}'
  + '.hk .kx-cp{margin:0 0 4px}.hk-r{display:grid;gap:6px;margin:0 0 12px}.hk-r div{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #111113;padding:0 0 6px}.hk-r b{font-variant-numeric:tabular-nums;white-space:nowrap}'
  + '.hk form.kx-f{margin:6px 0 0}.kx-dk .hk{border-color:#F2F3F5}.kx-dk .hk-r div{border-color:#F2F3F5}';

function haakClient(H) {
  try {
    var W = window, D = document; if (W.__haak) return; W.__haak = 1;
    var ua = navigator.userAgent || ''; if (/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(ua) || navigator.webdriver) return;
    var kx = D.getElementById('kx'); if (!kx) return;
    var t = H.t, Q = H.quiz, n = Q.length, ctx = /iPhone|iPad|iPod/.test(ua) ? 'i' : /Android/.test(ua) ? 'a' : 'd';
    var sp = new URLSearchParams(location.search), vr = sp.get('uitdaag'); vr = /^\d$/.test(vr || '') && +vr <= n ? +vr : null;
    function f(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function ev(e) { try { W.__kx && W.__kx.stuur({ e: e }); } catch (x) {} }
    function api(op, b) { b.taal = H.taal; b.slug = H.slug; return fetch('/api/keuze-tools?tool=haak&op=' + op, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(function (r) { return r.json(); }).catch(function () { return {}; }); }
    function el(tag, cls, html) { var d = D.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; }
    function knoppen(lijst, cb) { var p = el('div', 'kx-cp'); lijst.forEach(function (x, i) { var b = el('button'); b.type = 'button'; b.textContent = x; b.onclick = function () { cb(i, b, p); }; p.appendChild(b); }); return p; }
    function boven(c) { var h = kx.querySelector('.kx-bw') || kx.querySelector('.kx-h'); if (h) h.parentNode.insertBefore(c, h.nextSibling); else kx.insertBefore(c, kx.firstChild); }
    function mailVorm(doos, klaar) {
      var vr2 = el('p', '', esc(t.mailV)); doos.appendChild(vr2);
      var fm = el('form', 'kx-f', '<input type="email" autocomplete="email" inputmode="email" required placeholder="' + esc(t.mailPh) + '" aria-label="' + esc(t.mailV) + '"><button type="submit" aria-label="' + esc(t.mailK) + '">&#8593;</button>');
      doos.appendChild(fm); try { fm.querySelector('input').focus({ preventScroll: true }); } catch (x) {}
      fm.addEventListener('submit', function (e) { e.preventDefault(); var m = fm.querySelector('input').value.trim(); if (!/^\S+@\S+\.\S+$/.test(m)) return; fm.remove(); vr2.remove(); klaar(m); try { W.__cuMail && W.__cuMail(m); } catch (x) {} ev('contact'); });
    }
    function delen(s, knop) {
      var u = location.origin + location.pathname + '?uitdaag=' + s + '&utm_medium=deel&utm_source=haak', tx = f(H.deel, { s: s, n: n });
      ev('deel');
      if (navigator.share && (('ontouchstart' in W) || navigator.maxTouchPoints > 0)) { navigator.share({ text: tx, url: u }).catch(function () {}); return; }
      try { navigator.clipboard.writeText(tx + ' ' + u).then(function () { knop.textContent = t.gekopieerd; }); } catch (x) {}
    }
    // kennistest; vorm 'c' (zelf), 'e' (uitdaging) of 'v' (binnen via een vriend)
    function test(vorm) {
      var c = el('div', 'hk'), goed = 0, i = 0;
      var kop = vorm === 'v' ? f(t.vriend, { s: vr, n: n }) : vorm === 'e' ? f(t.uitdaag, { o: H.onderwerp }) : f(t.test, { o: H.onderwerp, n: n });
      c.appendChild(el('p', 'hk-t', esc(kop)));
      var vak = el('div'); c.appendChild(vak);
      function vraag() {
        vak.innerHTML = ''; var q = Q[i], volg = q.o.map(function (_, k) { return k; }).sort(function () { return Math.random() - .5; });
        vak.appendChild(el('p', '', '<b>' + (i + 1) + '/' + n + '</b> ' + esc(q.v)));
        vak.appendChild(knoppen(volg.map(function (k) { return q.o[k]; }), function (j, b, p) {
          ev(i === 0 ? 'tik' : 'pill'); var juist = volg[j] === q.g; if (juist) goed++;
          p.remove(); vak.appendChild(el('p', '', '<b>' + esc(juist ? t.goed : t.fout) + '</b> ' + esc(q.u)));
          var laatste = i === n - 1;
          vak.appendChild(knoppen([laatste ? t.uitslag : t.volgende], function () { if (laatste) uitslag(); else { i++; vraag(); } }));
        }));
      }
      function uitslag() {
        ev('quiz'); vak.innerHTML = '';
        var r = el('p', 'hk-t', esc(f(t.score, { s: goed, n: n })) + (vorm === 'v' ? ' ' + esc(goed > vr ? t.win : goed === vr ? t.gelijk : t.verlies) : '')); vak.appendChild(r);
        var reg = el('p'); vak.appendChild(reg);
        api('quiz', { s: goed }).then(function (j) {
          if (!j || !j.n) return; var tot = 0, lager = 0; j.n.forEach(function (x, k) { tot += x; if (k < goed) lager += x; });
          var pc = Math.round(100 * lager / tot); if (tot >= 10 && pc >= 1) reg.textContent = f(t.beter, { p: pc, t: tot }); else reg.remove();
        });
        var deelK = knoppen([t.daag], function (_, b) { delen(goed, b); }); vak.appendChild(deelK);
        var cv = el('p', '', esc(t.contactV)); vak.appendChild(cv);
        vak.appendChild(knoppen([t.ja], function (_, b, p) {
          ev('pill'); p.remove();
          mailVorm(vak, function (m) {
            api('match', { s: goed, mail: m }).then(function (j) { var k = j && j.anderen || 0; vak.appendChild(el('p', '', esc(k > 0 ? f(t.staatN, { k: k, s: goed }) : f(t.staat, { s: goed })))); });
          });
        }));
      }
      vraag(); return c;
    }
    // peiling; plek 'boven' (kaart boven de chat) of 'chat' (bericht in de chat)
    function peiling(plek) {
      var P = H.peil, c = plek === 'chat' ? el('div', 'kx-ant') : el('div', 'hk');
      c.appendChild(el('p', plek === 'chat' ? '' : 'hk-t', esc(plek === 'chat' ? t.anderen + ' ' + P.v : P.v)));
      c.appendChild(knoppen(P.o, function (i, b, p) {
        ev('pill'); p.remove(); var r = el('div', 'hk-r'); c.appendChild(el('p', '', esc(f(t.jij, { o: P.o[i] })))); c.appendChild(r);
        api('stem', { i: i }).then(function (j) {
          var tot = 0; (j && j.n || []).forEach(function (x) { tot += x; });
          if (tot >= 5) { P.o.forEach(function (o, k) { r.appendChild(el('div', '', '<span>' + (k === i ? '<b>' + esc(o) + '</b>' : esc(o)) + '</span><b>' + Math.round(100 * j.n[k] / tot) + '%</b>')); }); }
          else r.remove();
          c.appendChild(knoppen([P.q[i]], function () { try { W.__kx.vraag(P.q[i]); } catch (x) {} }));
        });
      }));
      return c;
    }
    function begin(v) {
      if (vr != null) { boven(test('v')); return; }
      try { W.__kx.stuur({ e: 'zie', c: ctx, v: { haak: v } }); } catch (x) {}
      if (v === 'b') boven(peiling('boven'));
      else if (v === 'c') boven(test('c'));
      else if (v === 'e') boven(test('e'));
      else if (v === 'd') { var vorig = W.__kxEv, klaar = 0; W.__kxEv = function (e) { try { vorig && vorig(e); } catch (x) {} if (e === 'vraag' && !klaar) { klaar = 1; setTimeout(function () { var o = D.getElementById('kxa'); if (o) o.appendChild(peiling('chat')); }, 6000); } }; }
    }
    var poging = 0;
    (function wacht() { var st = null; try { st = W.__kx && W.__kx.st(); } catch (x) {} if (!st || !st.v) { if (++poging < 40) return setTimeout(wacht, 250); return begin('a'); } begin(st.v.haak || 'a'); })();
  } catch (e) {}
}

export function haakJs(taal, slug) {
  const h = haakData(taal, slug); if (!h) return '';
  const H = { taal, slug, t: T[taal] || T.nl, onderwerp: h.onderwerp, peil: h.peil, quiz: h.quiz, deel: h.deel };
  return '<style>' + CSS + '</style><script>(' + haakClient.toString() + ')(' + JSON.stringify(H).replace(/</g, '\\u003c') + ')</script>';
}
