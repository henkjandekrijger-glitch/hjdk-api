// Browserdeel van de verlanglijst. Wordt als tekst geserveerd op /w/app.js: (klant.toString())().
// Gebruikt alleen window.WL (taal, teksten, basis, scherm, gegevens) en de API op /w/api. Geen bibliotheken.
export function klant() {
  'use strict';
  var W = window.WL || {}; var T = W.t || {}; var B = W.basis || '/w';
  var LOC = { nl: 'nl-NL', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' }[W.taal] || 'nl-NL';
  var app = document.getElementById('app');
  function t(k, v) { var s = T[k] || k; if (v) for (var x in v) s = s.split('{' + x + '}').join(String(v[x])); return s; }
  function geld(n, m) { var x = Number(n); if (!(x > 0)) return ''; try { return new Intl.NumberFormat(LOC, { style: 'currency', currency: m || 'EUR' }).format(x); } catch (e) { return '€ ' + x.toFixed(2); } }
  var opslag = { get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  function h(tag, a) {
    var el = document.createElement(tag); var kids = Array.prototype.slice.call(arguments, 2);
    if (a) for (var k in a) { var v = a[k]; if (v == null || v === false) continue;
      if (k === 'on') { for (var e in v) el.addEventListener(e, v[e]); } else if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v;
      else if (k === 'style') el.setAttribute('style', v); else if (typeof v !== 'string' && k in el) el[k] = v; else el.setAttribute(k, v === true ? '' : v); }
    (function add(l) { l.forEach(function (c) { if (c == null || c === false) return; if (Array.isArray(c)) return add(c); voeg(el, c.nodeType ? c : document.createTextNode(String(c))); }); })(kids);
    return el;
  }
  function api(op, d) {
    return fetch(B + '/api', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ op: op, taal: W.taal }, d || {})) })
      .then(function (r) { return r.json(); }).catch(function () { return { ok: false, fout: 'fout' }; });
  }
  function voeg(el) { var kids = Array.prototype.slice.call(arguments, 1); (function add(l) { l.forEach(function (c) { if (c == null || c === false) return; if (Array.isArray(c)) return add(c); el.appendChild(c.nodeType ? c : document.createTextNode(String(c))); }); })(kids); return el; }
  function melding(s) { var m = h('div', { class: 'melding', role: 'status' }, s); document.body.append(m); setTimeout(function () { m.remove(); }, 2800); }
  function foutTekst(j) { return t(j && j.fout && T[j.fout] ? j.fout : 'fout'); }
  function kopieer(s) { (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(function () { melding('✓ ' + t('gekopieerd')); }, function () { prompt(t('kopieer'), s); }); }
  var ICON = {
    cadeau: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>',
    foto: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/></svg>'
  };
  function ic(n) { return h('span', { html: ICON[n], style: 'display:inline-flex' }); }
  var hp = new URLSearchParams(location.hash.slice(1));
  if (location.hash.length > 1) history.replaceState(null, '', location.pathname + location.search);
  function bewaarEigen(id, k, naam) {
    opslag.set('wl:k:' + id, k); var mijn = (opslag.get('wl:mijn') || []).filter(function (x) { return x.id !== id; });
    mijn.unshift({ id: id, naam: naam || '' }); opslag.set('wl:mijn', mijn.slice(0, 20));
  }
  function datumTekst(d) { return d ? new Date(d + 'T12:00:00').toLocaleDateString(LOC, { day: 'numeric', month: 'long' }) : ''; }
  function aftel(d) { if (!d) return ''; var a = new Date(d + 'T12:00:00'), b = new Date(); b.setHours(12, 0, 0, 0); var n = Math.round((a - b) / 86400000); if (n < 0) return ''; if (n === 0) return t('vandaag'); if (n === 1) return t('nog1'); return t('nog', { n: n }); }
  function jaarDatum(md) { var n = new Date(), y = n.getFullYear(); var d = y + '-' + md; return new Date(d + 'T23:00:00') < n ? (y + 1) + '-' + md : d; }
  function veld(a) { return h('input', Object.assign({ class: 'veld' }, a)); }
  function lb(s) { return h('label', { class: 'lb' }, s); }
  function foto(it) { return h('div', { class: 'fo' }, it.img ? h('img', { src: it.img, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer', on: { error: function () { this.replaceWith(ic('cadeau')); } } }) : ic('cadeau')); }
  function verklein(f) {
    return new Promise(function (res) { var img = new Image(); var u = URL.createObjectURL(f);
      img.onload = function () { var s = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight)); var c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', 0.82).split(',')[1]); };
      img.onerror = function () { res(null); }; img.src = u; });
  }
  function mailKaart(kop, uitleg, doe, okTekst) {
    var v = veld({ type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: t('mail_ph'), required: true });
    var knop = h('button', { class: 'k', type: 'submit' }, t('stuur'));
    var f = h('form', { class: 'kaart', on: { submit: function (e) { e.preventDefault(); knop.disabled = true;
      doe(v.value.trim()).then(function (j) { if (j.ok) { f.innerHTML = ''; voeg(f, h('p', { class: 'okbg', style: 'margin:0' }, '✓ ' + (okTekst || t('verstuurd')))); } else { knop.disabled = false; melding(foutTekst(j)); } }); } } },
      h('h2', null, kop), uitleg ? h('p', null, uitleg) : null, h('div', { class: 'rij nw' }, v, knop), h('p', { class: 'klein', style: 'margin:8px 0 0' }, t('ok_mail')));
    return f;
  }
  function deelRij(url, tekst, titel) {
    return h('div', { class: 'rij' },
      navigator.share ? h('button', { class: 'k', type: 'button', on: { click: function () { api('ev', { e: 'deel' }); navigator.share({ title: titel, text: tekst, url: url }).catch(function () {}); } } }, t('deel')) : null,
      h('a', { class: 'k2', href: 'https://wa.me/?text=' + encodeURIComponent(tekst + (tekst.indexOf(url) < 0 ? ' ' + url : '')), target: '_blank', rel: 'noopener', on: { click: function () { api('ev', { e: 'deel_wa' }); } } }, t('wa')),
      h('button', { class: 'k2', type: 'button', on: { click: function () { kopieer(url); api('ev', { e: 'deel_kopie' }); } } }, t('kopieer')));
  }
  function lijstKop(L) {
    var regel = [t('g_' + (L.gel || 'anders')), datumTekst(L.datum), aftel(L.datum)].filter(Boolean).join(' · ');
    return [h('h1', null, t('van', { n: L.naam })), regel ? h('p', { class: 'sub', style: 'margin-top:-4px' }, regel) : null];
  }

  // ---------- start ----------
  function home() {
    var mijn = opslag.get('wl:mijn') || []; var nu = new Date(); var mnd = nu.getMonth();
    var gel = W.taal === 'nl' && (mnd === 10 || (mnd === 11 && nu.getDate() <= 5)) ? 'sint' : (mnd >= 10 ? 'kerst' : 'verj');
    var naam = veld({ autocomplete: 'given-name', maxlength: 40, placeholder: t('je_naam'), value: opslag.get('wl:naam') || '' });
    var datum = veld({ type: 'date' }); var chips = h('div', { class: 'chips' });
    var gels = ['verj', 'sint', 'kerst', 'brui', 'baby', 'anders'].filter(function (g) { return g !== 'sint' || W.taal === 'nl'; });
    function zetDatum() { if (gel === 'sint') datum.value = jaarDatum('12-05'); else if (gel === 'kerst') datum.value = jaarDatum(W.taal === 'nl' ? '12-25' : '12-24'); }
    function tekenChips() { chips.innerHTML = ''; gels.forEach(function (g) { voeg(chips, h('button', { type: 'button', class: 'chip' + (g === gel ? ' aan' : ''), 'aria-pressed': String(g === gel), on: { click: function () { gel = g; tekenChips(); zetDatum(); } } }, t('g_' + g))); }); }
    tekenChips(); zetDatum();
    var knop = h('button', { class: 'k vol', type: 'submit' }, t('maak'));
    var form = h('form', { class: 'kaart', on: { submit: function (e) { e.preventDefault(); var n = naam.value.trim(); if (!n) { naam.focus(); return; } knop.disabled = true;
      api('maak', { naam: n, gel: gel, datum: datum.value }).then(function (j) { if (!j.ok) { knop.disabled = false; melding(foutTekst(j)); return; } opslag.set('wl:naam', n); bewaarEigen(j.id, j.k, n); location.href = B + '/' + j.id; }); } } },
      lb(t('je_naam')), naam, lb(t('waarvoor')), chips, lb(t('datum')), datum, h('div', { style: 'margin-top:16px' }, knop), h('p', { class: 'klein', style: 'margin:10px 0 0;text-align:center' }, t('geen_acc')));
    voeg(app, h('h1', null, t('h1')), h('p', { class: 'sub' }, t('sub')), form,
      h('ol', { class: 'stappen' }, h('li', null, t('hoe1')), h('li', null, t('hoe2')), h('li', null, t('hoe3'))),
      h('div', { class: 'tegels' }, h('a', { class: 'tegel', href: B + '/lootjes' }, h('b', null, t('t_lootjes')), h('span', null, t('t_lootjes_s'))), h('a', { class: 'tegel', href: B + '/zoek' }, h('b', null, t('t_zoek')), h('span', null, t('t_zoek_s')))),
      mijn.length ? h('div', { class: 'kaart' }, h('h2', null, t('mijn')), mijn.map(function (x) { return h('p', { style: 'margin:6px 0' }, h('a', { href: B + '/' + x.id }, t('van', { n: x.naam }))); })) : null);
  }

  // ---------- lijst ----------
  function lijst() {
    var L0 = W.data; var k = hp.get('k') || opslag.get('wl:k:' + L0.id);
    if (hp.get('k')) bewaarEigen(L0.id, hp.get('k'), L0.naam);
    api('lees', { l: L0.id, k: k }).then(function (j) { app.innerHTML = ''; if (!j.ok) { voeg(app, h('p', null, foutTekst(j))); return; } if (j.eigen) eigenaar(j.lijst, k); else gast(j); });
  }
  function eigenaar(L, k) {
    var items = L.items || []; var lijstEl = h('div', { class: 'kaart' });
    var status = h('p', { class: 'klein', 'aria-live': 'polite', style: 'margin:8px 0 0' });
    var invoer = veld({ placeholder: t('toe_ph'), enterkeyhint: 'go', autocomplete: 'off', maxlength: 2000 });
    var knop = h('button', { class: 'k', type: 'submit' }, t('toe'));
    var file = h('input', { type: 'file', accept: 'image/*', class: 'verberg' });
    var form = h('form', { class: 'kaart blauw', on: { submit: function (e) { e.preventDefault(); var v = invoer.value.trim(); if (!v) { invoer.focus(); return; } knop.disabled = true; status.textContent = t('bezig');
      api('toe', { l: L.id, k: k, tekst: v }).then(function (j) { knop.disabled = false; if (!j.ok) { status.textContent = foutTekst(j); return; } invoer.value = ''; items.unshift(j.item); status.textContent = j.half ? t('toe_half') : ''; teken(); if (j.half && open1) open1(); }); } } },
      invoer, h('div', { class: 'twee', style: 'margin-top:10px' }, knop, h('button', { type: 'button', class: 'k2', on: { click: function () { file.click(); } } }, ic('foto'), t('foto'))), file, status);
    file.addEventListener('change', function () { var f = file.files[0]; if (!f) return; status.textContent = t('bezig');
      verklein(f).then(function (b64) { file.value = ''; if (!b64) { status.textContent = t('fout'); return; }
        return api('foto', { l: L.id, k: k, b64: b64, mime: 'image/jpeg' }).then(function (j) { if (!j.ok) { status.textContent = foutTekst(j); return; } items.unshift(j.item); status.textContent = ''; teken(); }); }); });
    var open1 = null;
    function teken() { open1 = null; lijstEl.innerHTML = ''; if (!items.length) { voeg(lijstEl, h('p', { style: 'margin:0' }, t('leeg_eigen'))); return; } items.forEach(function (it) { voeg(lijstEl, eigenItem(it)); }); }
    function eigenItem(it) {
      var rij = h('div', { class: 'it' }); var info = h('div');
      function toon() { info.innerHTML = '';
        voeg(info, it.f ? h('span', { class: 'fav' }, '★ ' + t('fav')) : null, h('p', { class: 'tt' }, it.t), h('p', { class: 'pr' }, it.p ? h('b', null, geld(it.p, it.m)) : null, it.w ? ' ' + t('bij', { w: it.w }) : null), it.n ? h('p', { class: 'klein' }, it.n) : null,
          h('div', { class: 'rij' }, h('button', { class: 'k3', type: 'button', on: { click: ster } }, (it.f ? '★ ' : '☆ ') + t('fav')), h('button', { class: 'k3', type: 'button', on: { click: bewerk } }, t('wijzig')), h('button', { class: 'k3', type: 'button', on: { click: weg } }, t('weg')))); }
      function ster() { it.f = it.f ? 0 : 1; toon(); api('wijzig', { l: L.id, k: k, i: it.i, f: it.f }); }
      function weg() { items = items.filter(function (x) { return x !== it; }); api('weg', { l: L.id, k: k, i: it.i }); teken(); }
      function bewerk() { info.innerHTML = ''; var tt = veld({ value: it.t, maxlength: 140 }); var pr = veld({ inputmode: 'decimal', value: it.p ? String(it.p) : '', placeholder: '0.00' }); var no = veld({ value: it.n || '', maxlength: 200, placeholder: t('notitie') });
        voeg(info, lb(t('titel')), tt, lb(t('prijs')), pr, lb(t('notitie')), no, h('div', { class: 'rij', style: 'margin-top:10px' },
          h('button', { class: 'k', type: 'button', on: { click: function () { api('wijzig', { l: L.id, k: k, i: it.i, t: tt.value, p: pr.value, n: no.value }).then(function (j) { if (j.ok) Object.assign(it, j.item); toon(); }); } } }, t('bewaar')),
          h('button', { class: 'k3', type: 'button', on: { click: toon } }, t('annuleer')))); }
      if (!open1) open1 = function () { bewerk(); var v = info.querySelector('input'); if (v) { v.focus(); v.select(); } };
      rij.append(foto(it), info); toon(); return rij;
    }
    teken();
    var deelUrl = location.origin + B + '/' + L.id;
    var smaakEl = h('div');
    function tekenSmaak() { smaakEl.innerHTML = '';
      if (L.smaak && L.smaak.tekst) voeg(smaakEl, h('div', { class: 'kaart' }, h('h2', null, t('smaak_kop', { n: L.naam })), h('p', null, L.smaak.tekst), (L.smaak.richtingen || []).length ? h('ul', { class: 'ul' }, L.smaak.richtingen.map(function (r) { return h('li', null, r); })) : null, h('button', { class: 'k3', type: 'button', on: { click: start } }, t('smaak'))));
      else voeg(smaakEl, h('div', { class: 'kaart' }, h('h2', null, t('smaak')), h('p', null, t('smaak_s')), h('button', { class: 'k2', type: 'button', on: { click: start } }, t('start')))); }
    function start() { smaakTest(L, k, function (s) { L.smaak = s; tekenSmaak(); }); }
    tekenSmaak();
    voeg(app, lijstKop(L));
    voeg(app, h('p', { class: 'note' }, t('jouw')), form, lijstEl,
      h('div', { class: 'kaart' }, h('h2', null, t('deel')), h('p', null, t('deel_s')), deelRij(deelUrl, t('deel_tekst', { u: deelUrl }), t('van', { n: L.naam }))),
      smaakEl, mailKaart(t('mailmij'), t('mailmij_s'), function (m) { return api('mailmij', { l: L.id, k: k, mail: m }); }));
  }
  function smaakTest(L, k, klaar) {
    var keuzes = []; var kl = [['#FFE7C2', '#DDE7FF'], ['#E4E7EC', '#FFE1D6'], ['#E2F0E5', '#F7E1F0'], ['#DFF1D8', '#F2E8DA'], ['#FFE3D3', '#E6E3FA'], ['#FFD9E8', '#E1EEF2'], ['#D9F0FF', '#EFE6D8'], ['#FFF1C9', '#E3F1E9']];
    var m = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }); var doos = h('div', { class: 'doos' }); m.append(doos); document.body.append(m);
    function vraag(i) { doos.innerHTML = ''; if (i >= 8) return klaarMaken();
      voeg(doos, h('p', { class: 'klein', style: 'margin:0' }, (i + 1) + ' / 8'), h('h2', null, t('smaak_v')),
        h('div', { class: 'keus' }, ['a', 'b'].map(function (x, j) { return h('button', { type: 'button', style: 'background:' + kl[i][j], on: { click: function () { keuzes.push(j); vraag(i + 1); } } }, t('s' + (i + 1) + x)); })),
        h('button', { class: 'k3', type: 'button', on: { click: function () { m.remove(); } } }, t('annuleer'))); }
    function klaarMaken() { voeg(doos, h('p', null, t('bezig'))); api('smaak', { l: L.id, k: k, keuzes: keuzes }).then(function (j) { m.remove(); if (j.ok) klaar(j.smaak); else melding(foutTekst(j)); }); }
    vraag(0);
  }
  function gast(j) {
    var L = j.lijst; var claims = j.claims || {}; var potten = j.potten || {}; var hooks = {};
    voeg(app, lijstKop(L));
    if (L.smaak && L.smaak.tekst) voeg(app, h('div', { class: 'kaart blauw' }, h('h2', null, t('smaak_kop', { n: L.naam })), h('p', null, L.smaak.tekst), (L.smaak.richtingen || []).length ? h('ul', { class: 'ul' }, L.smaak.richtingen.map(function (r) { return h('li', null, r); })) : null));
    voeg(app, gastLijst(L, claims, potten, hooks));
    var tipsEl = h('div'); voeg(app, tipsEl); laadTips(L, tipsEl, hooks);
    if (L.datum && (new Date(L.datum + 'T12:00:00') - Date.now()) / 86400000 > 8) voeg(app, mailKaart(t('herinner'), null, function (m) { return api('herinner', { l: L.id, mail: m }); }, t('herinner_ok')));
    voeg(app, h('div', { class: 'kaart blauw', style: 'text-align:center' }, h('a', { class: 'k vol', href: B, on: { click: function () { api('ev', { e: 'maak_ook' }); } } }, t('maak_ook'))));
  }
  function gastLijst(L, claims, potten, hooks) {
    var el = h('div', { class: 'kaart' });
    if (!(L.items || []).length) voeg(el, h('p', { style: 'margin:0' }, t('leeg_gast', { n: L.naam })));
    (L.items || []).forEach(function (it) { voeg(el, gastItem(L, it, claims, potten, hooks)); });
    return el;
  }
  function bronLink(z, q, l, cls) { return h('a', { class: cls || 'k2', href: B + '/uit?z=' + z + '&q=' + encodeURIComponent(q) + '&l=' + (l || ''), target: '_blank', rel: 'noopener' }, (W.bronnaam || {})[z] || z); }
  function gastItem(L, it, claims, potten, hooks) {
    var rij = h('div', { class: 'it' }); var info = h('div'); var open = '';
    function mijn() { return opslag.get('wl:c:' + L.id + ':' + it.i); }
    function bekijk() { return it.u ? h('a', { class: 'k2', href: B + '/uit?l=' + L.id + '&i=' + it.i, target: '_blank', rel: 'noopener' }, t('bekijk')) : bronLink((W.bronnen || ['g'])[0], it.zoek || it.t, L.id); }
    function toon() {
      info.innerHTML = ''; var c = claims[it.i]; var p = potten[it.i]; var mc = mijn(); var vanMij = !!(c && mc && mc.pid === c.pid);
      rij.classList.toggle('bezet', !!c && !vanMij && !c.pot);
      voeg(info, it.f ? h('span', { class: 'fav' }, '★ ' + t('fav')) : null, h('p', { class: 'tt' }, it.t), h('p', { class: 'pr' }, it.p ? h('b', null, geld(it.p, it.m)) : null, it.w ? ' ' + t('bij', { w: it.w }) : null), it.n ? h('p', { class: 'klein' }, it.n) : null);
      if (c && c.pot && p) voeg(info, potBlok(p, vanMij));
      else if (c) { voeg(info, h('p', { class: vanMij ? 'okbg' : 'bezetlabel' }, vanMij ? '✓ ' + t('jij_geeft') : (c.naam ? t('gekozen', { n: c.naam }) : t('gekozen_x'))));
        if (vanMij) voeg(info, h('div', { class: 'rij' }, bekijk(), h('button', { class: 'k3', type: 'button', on: { click: ontclaim } }, t('toch_niet')))); }
      else if (open === 'claim') voeg(info, claimForm());
      else voeg(info, h('div', { class: 'rij' }, h('button', { class: 'k', type: 'button', on: { click: function () { open = 'claim'; toon(); } } }, ic('cadeau'), t('geef')), bekijk()));
      if (!c || vanMij) voeg(info, meer());
      if (it.kdAlt) voeg(info, h('a', { class: 'kdalt', href: B + '/uit?kd=' + it.kdAlt.pid + '&l=' + L.id, target: '_blank', rel: 'noopener' }, h('span', null, t('lijkt_kd')), h('b', null, (it.kdAlt.titel || it.kdAlt.t) + ' · ' + geld(it.kdAlt.p, 'EUR'))));
    }
    function claimForm() {
      var n = veld({ maxlength: 40, placeholder: t('je_naam'), value: opslag.get('wl:naam') || '' });
      var kn = h('button', { class: 'k', type: 'submit' }, t('geef'));
      return h('form', { class: 'mini', on: { submit: function (e) { e.preventDefault(); kn.disabled = true; var nm = n.value.trim();
        api('claim', { l: L.id, i: it.i, naam: nm }).then(function (j) { if (!j.ok) { kn.disabled = false; melding(foutTekst(j)); if (j.claim) { claims[it.i] = j.claim; open = ''; toon(); } return; }
          if (nm) opslag.set('wl:naam', nm); opslag.set('wl:c:' + L.id + ':' + it.i, { pid: j.pid, c: j.c }); claims[it.i] = { pid: j.pid, naam: nm }; open = ''; toon(); melding('✓ ' + t('jij_geeft')); }); } } },
        h('p', { class: 'klein', style: 'margin:0 0 6px' }, t('naam_gever')), n, h('div', { class: 'rij', style: 'margin-top:8px' }, kn, h('button', { class: 'k3', type: 'button', on: { click: function () { open = ''; toon(); } } }, t('annuleer'))));
    }
    function ontclaim() { var mc = mijn(); if (!mc) return; api('unclaim', { l: L.id, i: it.i, c: mc.c }).then(function (j) { if (j.ok) { delete claims[it.i]; delete potten[it.i]; opslag.set('wl:c:' + L.id + ':' + it.i, null); toon(); } }); }
    function meer() {
      var r = h('div', { class: 'rij meer' });
      r.append(h('button', { class: 'k3', type: 'button', on: { click: function () { open = open === 'verg' ? '' : 'verg'; if (open) api('ev', { e: 'vergelijk' }); toon(); } } }, t('vergelijk')));
      if (!claims[it.i]) r.append(h('button', { class: 'k3', type: 'button', on: { click: function () { open = open === 'pot' ? '' : 'pot'; toon(); } } }, t('samen')));
      if (it.u && it.p) r.append(h('button', { class: 'k3', type: 'button', on: { click: function () { open = open === 'alarm' ? '' : 'alarm'; toon(); } } }, t('alarm')));
      var box = h('div');
      if (open === 'verg') voeg(box, h('div', { class: 'rij', style: 'margin-top:6px' }, (W.bronnen || []).map(function (z) { return bronLink(z, it.ean || it.zoek || it.t, L.id); })));
      if (open === 'pot') voeg(box, potStart());
      if (open === 'alarm') { var v = veld({ type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: t('mail_ph') }); var kn = h('button', { class: 'k', type: 'submit' }, t('stuur'));
        voeg(box, h('form', { class: 'mini', on: { submit: function (e) { e.preventDefault(); kn.disabled = true; api('alarm', { l: L.id, i: it.i, mail: v.value.trim() }).then(function (j) { if (j.ok) { box.innerHTML = ''; voeg(box, h('p', { class: 'okbg' }, '✓ ' + t('alarm_ok'))); } else { kn.disabled = false; melding(foutTekst(j)); } }); } } },
          h('div', { class: 'rij nw' }, v, kn), h('p', { class: 'klein', style: 'margin:6px 0 0' }, t('ok_mail')))); }
      return h('div', null, r, box);
    }
    function potStart() {
      var n = veld({ maxlength: 40, placeholder: t('je_naam'), value: opslag.get('wl:naam') || '' }); var d = veld({ inputmode: 'decimal', value: it.p ? String(it.p) : '', placeholder: '0.00' });
      var li = veld({ type: 'url', inputmode: 'url', placeholder: 'https://tikkie.me/…' }); var kn = h('button', { class: 'k', type: 'submit' }, t('pot_start'));
      return h('form', { class: 'mini', on: { submit: function (e) { e.preventDefault(); kn.disabled = true;
        api('pot', { l: L.id, i: it.i, naam: n.value.trim(), doel: d.value, link: li.value.trim() }).then(function (j) { if (!j.ok) { kn.disabled = false; melding(foutTekst(j)); return; }
          opslag.set('wl:c:' + L.id + ':' + it.i, { pid: j.pid, c: j.c }); claims[it.i] = { pid: j.pid, naam: n.value.trim(), pot: 1 }; potten[it.i] = j.pot; open = ''; toon(); }); } } },
        h('p', { class: 'klein' }, t('samen_s')), lb(t('je_naam')), n, lb(t('pot_doel')), d, lb(t('pot_link')), li, h('div', { style: 'margin-top:10px' }, kn));
    }
    function potBlok(p, vanMij) {
      var som = Number(p.som) || 0; var pct = Math.min(100, Math.round(som / (Number(p.doel) || 1) * 100)); var box = h('div', { class: 'pot' });
      voeg(box, h('p', { style: 'margin:0;font-weight:700' }, t('pot_door', { n: p.naam })), h('div', { class: 'balk' }, h('i', { style: 'width:' + pct + '%' })),
        h('p', { class: 'klein', style: 'margin:0 0 8px' }, t('pot_stand', { a: geld(som, p.munt) || '0', b: geld(p.doel, p.munt) }) + (p.n ? ' · ' + p.n + ' ×' : '')));
      if (som >= Number(p.doel)) voeg(box, h('p', { class: 'okbg' }, t('pot_vol')));
      else { var b = veld({ inputmode: 'decimal', placeholder: t('pot_bedrag') }); var n = veld({ maxlength: 40, placeholder: t('je_naam'), value: opslag.get('wl:naam') || '' }); var kn = h('button', { class: 'k', type: 'submit' }, t('pot_mee'));
        voeg(box, h('form', { class: 'mini', on: { submit: function (e) { e.preventDefault(); kn.disabled = true; api('potmee', { l: L.id, i: it.i, naam: n.value.trim(), bedrag: b.value }).then(function (j) { if (!j.ok) { kn.disabled = false; melding(foutTekst(j)); return; } potten[it.i] = j.pot; toon(); }); } } },
          h('div', { class: 'potrij' }, b, n), h('div', { style: 'margin-top:8px' }, kn))); }
      if (p.link) voeg(box, h('a', { class: 'k2 vol', style: 'margin-top:8px', href: p.link, target: '_blank', rel: 'noopener nofollow' }, t('pot_betaal', { n: p.naam }) + (p.host ? ' (' + p.host + ')' : '')));
      if (vanMij) voeg(box, h('button', { class: 'k3', type: 'button', on: { click: ontclaim } }, t('toch_niet')));
      return box;
    }
    hooks[it.i] = function (kd) { it.kdAlt = kd; toon(); };
    rij.append(foto(it), info); toon(); return rij;
  }
  function kdRij(x, l) { return h('a', { class: 'kdrij', href: B + '/uit?kd=' + x.pid + '&l=' + (l || 'zoek'), target: '_blank', rel: 'noopener' }, foto({ img: x.img }), h('div', null, h('p', { class: 'tt' }, x.titel || x.t), h('p', { class: 'pr' }, h('b', null, geld(x.p, 'EUR')), ' ' + t('bij', { w: 'Kadoly' })), x.waarom ? h('p', { class: 'klein' }, x.waarom) : null)); }
  function laadTips(L, el, hooks) {
    if (!(L.items || []).length) return;
    api('tips', { l: L.id }).then(function (j) { if (!j.ok) return; for (var i in (j.per || {})) if (hooks[i]) hooks[i](j.per[i]);
      if ((j.tips || []).length) voeg(el, h('div', { class: 'kaart' }, h('h2', null, t('tips')), j.tips.map(function (x) { return kdRij(x, L.id); }))); });
  }

  // ---------- lootjes ----------
  function lootjes() {
    var nu = new Date(); var sint = W.taal === 'nl' && (nu.getMonth() === 10 || (nu.getMonth() === 11 && nu.getDate() <= 5));
    var naam = veld({ maxlength: 60, placeholder: t('lt_naam_ph') }); var datum = veld({ type: 'date', value: sint ? jaarDatum('12-05') : jaarDatum(W.taal === 'nl' ? '12-25' : '12-24') });
    var budget = veld({ inputmode: 'decimal', placeholder: '20', maxlength: 6 });
    var namen = [opslag.get('wl:naam') || '', '', '', '']; var niet = [];
    var rijen = h('div');
    function teken() { rijen.innerHTML = ''; voeg(rijen, h('div', { class: 'naamkop' }, h('span', null, t('titel')), h('span', null, t('lt_niet'))));
      namen.forEach(function (n, i) { var inp = veld({ value: n, maxlength: 40, placeholder: (i + 1) + '.', 'aria-label': t('je_naam') + ' ' + (i + 1) });
        inp.addEventListener('input', function () { namen[i] = inp.value; vul(); }); var sel = h('select', { class: 'veld', 'aria-label': t('lt_niet') });
        sel.addEventListener('change', function () { niet[i] = sel.value === '' ? null : Number(sel.value); }); voeg(rijen, h('div', { class: 'naamrij' }, inp, sel)); }); vul(); }
    function vul() { Array.prototype.forEach.call(rijen.querySelectorAll('select'), function (sel, i) { var keep = niet[i]; sel.innerHTML = ''; voeg(sel, h('option', { value: '' }, '—'));
      namen.forEach(function (n, j) { if (j !== i && n.trim()) voeg(sel, h('option', { value: String(j), selected: keep === j }, n.trim())); }); }); }
    teken();
    function verstuur(zelf, kn) { var idx = {}, leden = [];
      namen.forEach(function (n, i) { if (n.trim()) { idx[i] = leden.length; leden.push({ naam: n.trim() }); } });
      namen.forEach(function (n, i) { if (n.trim() && niet[i] != null && idx[niet[i]] != null) leden[idx[i]].niet = idx[niet[i]]; });
      if (!zelf && leden.length < 3) { melding(t('lt_min')); return; } kn.disabled = true;
      api('groep', { naam: naam.value.trim(), datum: datum.value, budget: budget.value, gel: sint ? 'sint' : 'kerst', leden: zelf ? [] : leden, zelf: zelf }).then(function (j) {
        if (!j.ok) { kn.disabled = false; melding(foutTekst(j)); return; } opslag.set('wl:ak:' + j.gid, j.ak); if (namen[0].trim()) opslag.set('wl:naam', namen[0].trim()); location.href = B + '/g/' + j.gid; }); }
    var trek = h('button', { class: 'k vol', type: 'button', on: { click: function () { verstuur(false, trek); } } }, t('lt_trek'));
    var zelf = h('button', { class: 'k2 vol', type: 'button', on: { click: function () { verstuur(true, zelf); } } }, t('lt_aanmeld_link'));
    voeg(app, h('h1', null, t('lt_h1')), h('p', { class: 'sub' }, t('lt_sub')),
      h('div', { class: 'kaart' }, lb(t('lt_naam')), naam, h('div', { class: 'twee' }, h('div', null, lb(t('datum')), datum), h('div', null, lb(t('lt_budget')), budget)),
        lb(t('lt_wie')), rijen, h('button', { class: 'k3', type: 'button', on: { click: function () { namen.push(''); teken(); } } }, '+ ' + t('lt_erbij')), h('div', { style: 'margin-top:14px' }, trek)),
      h('div', { class: 'kaart blauw' }, h('h2', null, t('lt_zelf')), h('p', null, t('lt_zelf_s')), zelf));
  }
  function groepKop(G) { var r = [datumTekst(G.datum), aftel(G.datum), G.budget ? t('lt_budget') + ': ' + geld(G.budget, 'EUR') : ''].filter(Boolean).join(' · '); return [h('h1', null, G.naam || t('lt_h1')), r ? h('p', { class: 'sub', style: 'margin-top:-4px' }, r) : null]; }
  function groep() {
    var gid = W.data.g; var ak = hp.get('ak') || opslag.get('wl:ak:' + gid); if (hp.get('ak')) opslag.set('wl:ak:' + gid, hp.get('ak'));
    var jk = hp.get('j');
    if (ak) return beheer(gid, ak);
    var lid = opslag.get('wl:lid:' + gid); if (lid && lid.m && !jk) { location.replace(B + '/g/' + gid + '/' + lid.m); return; }
    app.innerHTML = '';
    if (jk) return aanmelden(gid, jk, app);
    voeg(app, h('h1', null, W.data.naam || t('lt_h1')), h('p', null, t('lt_wacht')));
  }
  function aanmelden(gid, jk, doel, naChange) {
    var n = veld({ maxlength: 40, placeholder: t('je_naam'), value: opslag.get('wl:naam') || '' }); var kn = h('button', { class: 'k', type: 'submit' }, t('lt_mee'));
    if (!naChange) voeg(doel, h('h1', null, t('lt_doe_mee', { g: W.data.naam || '' })), W.data.datum ? h('p', { class: 'sub' }, datumTekst(W.data.datum)) : null);
    voeg(doel, h('form', { class: 'kaart', on: { submit: function (e) { e.preventDefault(); if (!n.value.trim()) { n.focus(); return; } kn.disabled = true;
      api('aanmeld', { g: gid, j: jk, naam: n.value.trim() }).then(function (j) { if (!j.ok) { kn.disabled = false; melding(foutTekst(j)); return; } opslag.set('wl:naam', n.value.trim()); opslag.set('wl:lid:' + gid, { m: j.m, s: j.s });
        if (naChange) naChange(); else location.href = B + '/g/' + gid + '/' + j.m; }); } } }, lb(t('je_naam')), h('div', { class: 'rij nw' }, n, kn)));
  }
  function beheer(gid, ak) {
    api('groeplees', { g: gid, ak: ak }).then(function (j) { app.innerHTML = ''; if (!j.ok) { voeg(app, h('p', null, foutTekst(j))); return; }
      var G = j.groep; voeg(app, groepKop(G)); voeg(app, h('p', { class: 'note' }, t('lt_beheer')));
      var basis = location.origin + B + '/g/' + gid; var ik = opslag.get('wl:lid:' + gid);
      if (G.zelf && !G.getrokken) {
        var url = basis + '#j=' + j.jk;
        voeg(app, h('div', { class: 'kaart blauw' }, h('h2', null, t('lt_deel_aanmeld')), h('p', { class: 'klein', style: 'word-break:break-all' }, url), deelRij(url, t('lt_aanmeld_wa', { g: G.naam, u: url }), G.naam)));
        if (!ik) { var plek = h('div'); voeg(app, plek); aanmelden(gid, j.jk, plek, function () { beheer(gid, ak); }); }
      }
      var lijstEl = h('div', { class: 'kaart' }, h('h2', null, G.getrokken && !G.zelf ? t('lt_links') : t('lt_wie')), G.getrokken && !G.zelf ? h('p', null, t('lt_links_s')) : null);
      G.leden.forEach(function (x) { var link = j.links && j.links[x.m] ? basis + '/' + x.m + '#s=' + j.links[x.m] : null;
        voeg(lijstEl, h('div', { class: 'lidrij' }, h('div', null, h('b', null, x.naam), h('p', { class: 'klein', style: 'margin:2px 0 0' }, [G.getrokken ? (x.open ? '✓ ' + t('lt_open') : t('lt_dicht')) : '', x.lijst ? t('lt_heeft_lijst') : ''].filter(Boolean).join(' · '))),
          link && G.getrokken ? h('div', { class: 'rij' }, h('a', { class: 'k2 klein-k', href: 'https://wa.me/?text=' + encodeURIComponent(t('lt_wa', { n: x.naam, g: G.naam, u: link })), target: '_blank', rel: 'noopener' }, t('wa')), h('button', { class: 'k3', type: 'button', on: { click: function () { kopieer(link); } } }, t('kopieer'))) : null)); });
      voeg(app, lijstEl);
      if (!G.getrokken && G.leden.length >= 3) voeg(app, h('button', { class: 'k vol', type: 'button', on: { click: function () { this.disabled = true; api('trek', { g: gid, ak: ak }).then(function (r) { if (!r.ok) melding(foutTekst(r)); beheer(gid, ak); }); } } }, t('lt_trek_nu') + ' (' + G.leden.length + ')'));
      if (G.getrokken && !G.leden.some(function (x) { return x.open; })) voeg(app, h('button', { class: 'k3', type: 'button', on: { click: function () { api('trek', { g: gid, ak: ak }).then(function (r) { if (!r.ok) melding(foutTekst(r)); else melding('✓'); beheer(gid, ak); }); } } }, t('lt_opnieuw')));
      if (ik) voeg(app, h('p', { style: 'margin-top:14px' }, h('a', { class: 'k2', href: basis + '/' + ik.m }, t('lot_jij') + ' …')));
    });
  }
  function lid() {
    var g = W.data.g, m = W.data.m; var s = hp.get('s'); if (s) opslag.set('wl:lid:' + g, { m: m, s: s }); else { var x = opslag.get('wl:lid:' + g); if (x && x.m === m) s = x.s; }
    if (!s) { app.innerHTML = ''; voeg(app, h('p', null, t('fout'))); return; }
    api('lot', { g: g, m: m, s: s }).then(function (j) { app.innerHTML = ''; if (!j.ok) { voeg(app, h('p', null, foutTekst(j))); return; }
      var G = j.groep; voeg(app, groepKop(G));
      if (!j.doel) voeg(app, h('div', { class: 'kaart blauw' }, h('p', { style: 'margin:0' }, t('lt_aangemeld')), h('p', { style: 'margin:8px 0 0' }, t('lt_wacht'))));
      else {
        var D = j.doel; var lotEl = h('div');
        var toonLot = function () { lotEl.innerHTML = ''; voeg(lotEl, h('div', { class: 'lot open' }, h('span', null, t('lot_jij')), h('span', { class: 'nm' }, D.naam)));
          if (D.lijst) { voeg(lotEl, h('h2', { style: 'margin:18px 0 8px' }, t('lot_lijst', { n: D.naam }))); if (D.lijst.smaak && D.lijst.smaak.tekst) voeg(lotEl, h('div', { class: 'kaart blauw' }, h('p', { style: 'margin:0' }, D.lijst.smaak.tekst)));
            var hooks = {}; voeg(lotEl, gastLijst(D.lijst, D.claims || {}, D.potten || {}, hooks)); var te = h('div'); voeg(lotEl, te); laadTips(D.lijst, te, hooks); }
          else voeg(lotEl, h('div', { class: 'kaart' }, h('p', null, t('lot_geen', { n: D.naam })), h('a', { class: 'k2', href: B + '/zoek?voor=' + encodeURIComponent(D.naam) }, t('t_zoek'))));
          if ((j.roddel || []).length) voeg(lotEl, h('div', { class: 'kaart' }, h('h2', null, t('rod_voor', { n: D.naam })), h('ul', { class: 'ul' }, j.roddel.map(function (r) { return h('li', null, r); }))));
          voeg(lotEl, gedichtKaart({ g: g, m: m, s: s }, D.naam)); };
        if (opslag.get('wl:lotopen:' + g) || j.ik.open) toonLot();
        else voeg(lotEl, h('button', { class: 'lot', type: 'button', on: { click: function () { opslag.set('wl:lotopen:' + g, 1); toonLot(); } } }, ic('cadeau'), h('span', null, t('lot_tik'))));
        voeg(app, lotEl);
      }
      var eigen = h('div', { class: 'kaart' }, h('h2', null, t('lot_eigen')), h('p', null, t('lot_eigen_s')),
        h('button', { class: j.ik.lijst ? 'k2' : 'k', type: 'button', on: { click: function () { this.disabled = true; api('lotlijst', { g: g, m: m, s: s }).then(function (r) { if (!r.ok) { melding(foutTekst(r)); return; } bewaarEigen(r.id, r.k, j.ik.naam); location.href = B + '/' + r.id; }); } } }, j.ik.lijst ? t('lot_eigen_open') : t('maak')));
      voeg(app, eigen);
      var anderen = (j.leden || []); if (anderen.length) {
        var sel = h('select', { class: 'veld' }, anderen.map(function (x) { return h('option', { value: x.m }, x.naam); })); var tx = h('textarea', { class: 'veld', maxlength: 300, placeholder: t('rod_ph') }); var kn = h('button', { class: 'k', type: 'submit' }, t('rod_stuur'));
        var f = h('form', { class: 'kaart', on: { submit: function (e) { e.preventDefault(); if (!tx.value.trim()) { tx.focus(); return; } kn.disabled = true; api('roddel', { g: g, m: m, s: s, over: sel.value, tekst: tx.value.trim() }).then(function (r) { kn.disabled = false; if (r.ok) { tx.value = ''; melding('✓ ' + t('rod_ok')); } else melding(foutTekst(r)); }); } } },
          h('h2', null, t('rod')), h('p', null, t('rod_s')), lb(t('rod_over')), sel, h('div', { style: 'height:10px' }), tx, h('div', { style: 'margin-top:10px' }, kn));
        voeg(app, f); }
    });
  }
  function gedichtKaart(ctx, naam) {
    var tx = h('textarea', { class: 'veld', maxlength: 300, placeholder: t('ged_ph') }); var uit = h('div'); var kn = h('button', { class: 'k', type: 'submit' }, t('ged_knop'));
    return h('form', { class: 'kaart', on: { submit: function (e) { e.preventDefault(); kn.disabled = true; uit.innerHTML = ''; voeg(uit, h('p', null, t('bezig')));
      api('gedicht', Object.assign({ extra: tx.value.trim() }, ctx)).then(function (r) { kn.disabled = false; uit.innerHTML = ''; if (!r.ok) { melding(foutTekst(r)); return; } kn.textContent = t('ged_weer');
        voeg(uit, h('div', { class: 'gedicht' }, r.tekst), h('button', { class: 'k3', type: 'button', on: { click: function () { kopieer(r.tekst); } } }, t('kopieer'))); }); } } },
      h('h2', null, t('ged')), h('p', null, t('ged_s', { n: naam })), tx, h('div', { style: 'margin-top:10px' }, kn), uit);
  }

  // ---------- cadeauzoeker ----------
  function zoek() {
    var tx = h('textarea', { class: 'veld', maxlength: 600, placeholder: t('zk_ph') }); if (W.data && W.data.voor) tx.value = W.data.voor + ', ';
    var kn = h('button', { class: 'k vol', type: 'submit' }, t('zk_knop')); var uit = h('div');
    voeg(app, h('h1', null, t('zk_h1')), h('p', { class: 'sub' }, t('zk_sub')),
      h('form', { class: 'kaart blauw', on: { submit: function (e) { e.preventDefault(); if (tx.value.trim().length < 4) { tx.focus(); return; } kn.disabled = true; uit.innerHTML = ''; voeg(uit, h('p', null, t('bezig')));
        api('zoek', { tekst: tx.value.trim(), l: (W.data && W.data.l) || '' }).then(function (j) { kn.disabled = false; uit.innerHTML = ''; if (!j.ok) { voeg(uit, h('p', null, foutTekst(j))); return; }
          if ((j.kadoly || []).length) voeg(uit, h('div', { class: 'kaart' }, h('h2', null, t('zk_kd')), j.kadoly.map(function (x) { return kdRij(x, 'zoek'); })));
          if ((j.ideeen || []).length) voeg(uit, h('div', { class: 'kaart' }, h('h2', null, t('zk_ideeen')), j.ideeen.map(function (x) { return h('div', { class: 'idee' }, h('p', { class: 'tt' }, x.titel), h('p', { class: 'klein' }, x.waarom), h('div', { class: 'rij' }, (W.bronnen || []).map(function (z) { return bronLink(z, x.zoek, 'zoek', 'k3'); }))); })));
          uit.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); } } }, tx, h('div', { style: 'margin-top:10px' }, kn)), uit);
  }

  var V = { home: home, lijst: lijst, lootjes: lootjes, groep: groep, lid: lid, zoek: zoek }[W.view];
  if (V) { if (W.view !== 'lijst' && W.view !== 'lid' && W.view !== 'groep') app.innerHTML = ''; V(); }
}
