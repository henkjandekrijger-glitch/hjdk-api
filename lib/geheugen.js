// Eén chat die onthoudt, op al onze sites (20 nov 2026). Henkjan: "Maak dit en ik heb altijd bedoeld maar 1 chat te hebben", met de vijf stappen:
// 1. onthouden met toestemming na het eerste nuttige antwoord, 2. wie terugkomt ziet "Jij zocht: ..." (de chat wordt een lijst van eigen wensen),
// 3. elke wens krijgt een datum ("3 is extreem belangrijk"), 4. alleen "zal ik je een appje of mail sturen als er iets verandert", 5. na het tweede
// antwoord "Waar kan ik je nog meer mee helpen?". En: "we maken deze helemaal persoonlijk zonder hulpen eromheen maar clean voor hun over hen. Met dus
// het geheugen wat je toont aan ze. Maak lerend hoe je vertrouwen bouwt. En dat ook werkelijk waar maakt."
//
// Vertrouwen waar maken:
// - De bezoeker ziet altijd alles wat we onthouden (paneel boven de chat en /mij) en kan elke wens of alles in één tik vergeten; vergeten wist ook op de server.
// - We onthouden alleen na een ja. Geen naam, geen gezondheidsgegevens; de chat zet geen telefoonnummers of e-mailadressen in een wens.
// - Contact alleen voor wat de bezoeker koos: een bericht als zijn datum dichtbij komt of als er iets verandert. Versturen staat pas aan na
//   Henkjans akkoord op de teksten (kv mij:zend = 1); de lijst van wie een bericht krijgt staat in tool=mij&op=herinner (droog).
// Lerend (Clickmind-proef van de markt, lib/proef.js): factor onthoud (a na het eerste antwoord, b na het tweede), factor meer (a wel "Waar kan ik je
// nog meer mee helpen?", b niet). Waarde: onthoud 15, datum 30, contact 45.
// Opslag: mij:<pid> profiel (400 dagen), mij:c:<hash contact> lijst pids (samenvoegen op een andere site), mij:d:<dag> tellers, mij:zend schakelaar.
import { createHash } from 'node:crypto';
import { kv } from './db.js';

const hash = s => createHash('sha256').update(String(s) + '|mij').digest('hex').slice(0, 32);
const dag = () => new Date().toISOString().slice(0, 10);
const PID = /^[0-9a-f]{24}$/;
const kort = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\S+@\S+/g, ' ').replace(/(\+?\d[\d\s().-]{6,}\d)/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const ISO = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !isNaN(Date.parse(s)) ? String(s) : '';
const TTL = 400 * 86400;
const SOORT = ['contract', 'examen', 'verjaardag', 'anders'];

async function lees(pid) { if (!PID.test(pid)) return null; return (await kv.get('mij:' + pid).catch(() => null)) || null; }
async function bewaar(pid, p) { p.t = Date.now(); await kv.raw(['SET', 'mij:' + pid, JSON.stringify(p), 'EX', String(TTL)]).catch(() => kv.set('mij:' + pid, p)); }
const tel = async veld => { try { await kv.raw(['HINCRBY', 'mij:d:' + dag(), veld, '1']); await kv.raw(['EXPIRE', 'mij:d:' + dag(), String(120 * 86400)]); } catch (e) {} };
const publiek = p => ({ ok: true, w: (p && p.w) || [], ct: p && p.ct ? { via: p.ct.via, ok: !!p.ct.ok } : null, zend: !!(p && p.zend) });

export async function mijGet(pid) { const p = await lees(pid); const z = await kv.get('mij:zend').catch(() => null); return { ...publiek(p), zendAan: String(z) === '1' }; }

// een wens toevoegen of bijwerken (zelfde id, of zelfde wat op dezelfde site)
export async function mijWens(b) {
  const pid = String(b.pid || ''); if (!PID.test(pid)) return { ok: false };
  const wat = kort(b.wat, 70); if (wat.length < 2) return { ok: false, fout: 'wat' };
  const p = (await lees(pid)) || { w: [], start: Date.now() };
  const id = /^[a-z0-9]{6,16}$/.test(String(b.id || '')) ? String(b.id) : Math.random().toString(36).slice(2, 10);
  const oud = p.w.find(x => x.id === id) || p.w.find(x => x.wat.toLowerCase() === wat.toLowerCase() && x.site === b.site);
  const w = Object.assign(oud || { id, t0: Date.now() }, { wat, extra: kort(b.extra, 80), site: ['nl', 'us', 'de', 'kadoly'].includes(b.site) ? b.site : 'nl', pad: /^\/[\w\/.-]{0,120}$/.test(String(b.pad || '')) ? String(b.pad) : '', t: Date.now() });
  if (b.datum !== undefined) { w.datum = ISO(b.datum); w.soort = SOORT.includes(b.soort) ? b.soort : (w.soort || 'anders'); }
  if (!oud) p.w.unshift(w); p.w = p.w.slice(0, 20);
  await bewaar(pid, p); await tel(oud ? 'bijgewerkt' : 'wens'); if (b.datum) await tel('datum');
  return { ...publiek(p), id: w.id };
}

export async function mijVergeet(b) {
  const pid = String(b.pid || ''); if (!PID.test(pid)) return { ok: false };
  if (b.alles) { const p = await lees(pid); if (p && p.ct && p.ct.h) await kv.raw(['SREM', 'mij:c:' + p.ct.h, pid]).catch(() => {}); await kv.raw(['DEL', 'mij:' + pid]).catch(() => {}); await tel('vergeet_alles'); return { ok: true, w: [], ct: null }; }
  const p = await lees(pid); if (!p) return { ok: true, w: [] };
  p.w = p.w.filter(x => x.id !== String(b.id || '')); await bewaar(pid, p); await tel('vergeet'); return publiek(p);
}

// contact met toestemming: via mail of WhatsApp, alleen voor berichten bij een datum of een verandering. Hetzelfde adres op een andere site
// voegt de profielen samen (zo wordt het één chat over al onze sites).
const MAIL = /^[^\s@<>()[\],;:"]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}$/i;
export async function mijContact(b) {
  const pid = String(b.pid || ''); if (!PID.test(pid) || !b.toestemming) return { ok: false };
  const via = b.via === 'wa' ? 'wa' : 'mail'; let adres = String(b.adres || '').trim();
  if (via === 'mail') { adres = adres.toLowerCase(); if (!MAIL.test(adres) || adres.length > 254) return { ok: false, fout: 'adres' }; }
  else { adres = adres.replace(/[^\d+]/g, ''); if (adres.startsWith('00')) adres = '+' + adres.slice(2); if (adres.startsWith('06')) adres = '+31' + adres.slice(1); if (!/^\+?\d{9,15}$/.test(adres)) return { ok: false, fout: 'adres' }; }
  const h = hash(via + ':' + adres), p = (await lees(pid)) || { w: [], start: Date.now() };
  // samenvoegen met profielen die dit adres eerder gaven (andere site of ander apparaat)
  const ander = ((await kv.raw(['SMEMBERS', 'mij:c:' + h]).catch(() => [])) || []).filter(x => x !== pid && PID.test(x));
  for (const o of ander.slice(0, 5)) { const q = await lees(o); if (q && q.w) q.w.forEach(w => { if (!p.w.some(x => x.id === w.id || (x.wat.toLowerCase() === w.wat.toLowerCase() && x.site === w.site))) p.w.push(w); }); }
  p.w = p.w.slice(0, 20);
  p.ct = { via, adres, h, t: Date.now(), ok: false, tekst: String(b.toestemming).slice(0, 200), site: b.site || 'nl' };
  await bewaar(pid, p); await kv.raw(['SADD', 'mij:c:' + h, pid]).catch(() => {}); await kv.raw(['EXPIRE', 'mij:c:' + h, String(TTL)]).catch(() => {});
  await kv.raw(['SADD', 'mij:contacten', pid]).catch(() => {});
  await tel('contact_' + via); if (ander.length) await tel('samengevoegd');
  return { ...publiek(p), samen: ander.length };
}

// wie een datum heeft die binnen 14 dagen valt en contact gaf: de lijst voor de herinnering. Versturen alleen met mij:zend = 1 (Henkjans akkoord
// op de tekst); dit eindpunt geeft altijd de lijst (droog) zodat te zien is wat er zou gaan.
export async function mijHerinneringen() {
  const pids = ((await kv.raw(['SMEMBERS', 'mij:contacten']).catch(() => [])) || []).filter(x => PID.test(x)).slice(0, 2000), uit = [];
  const nu = Date.now();
  for (let i = 0; i < pids.length; i += 50) { const v = await Promise.all(pids.slice(i, i + 50).map(lees));
    v.forEach((p, k) => { if (!p || !p.ct) return; (p.w || []).forEach(w => { if (!w.datum) return; const d = (Date.parse(w.datum) - nu) / 864e5; if (d >= -1 && d <= 14 && !(w.gemeld || []).includes(w.datum)) uit.push({ pid: pids[i + k], via: p.ct.via, wens: w.wat, datum: w.datum, soort: w.soort, dagen: Math.round(d) }); }); }); }
  const zend = String(await kv.get('mij:zend').catch(() => '')) === '1';
  return { ok: true, zendAan: zend, klaar: uit.length, lijst: uit.slice(0, 50).map(x => ({ ...x, pid: x.pid.slice(0, 6) })) };
}

export async function mijStand() {
  const dagen = []; for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); const h = await kv.raw(['HGETALL', 'mij:d:' + d]).catch(() => []); const o = {}; if (Array.isArray(h)) for (let j = 0; j + 1 < h.length; j += 2) o[h[j]] = Number(h[j + 1]); dagen.push({ dag: d, ...o }); }
  const c = await kv.raw(['SCARD', 'mij:contacten']).catch(() => 0);
  return { ok: true, uitleg: 'Eén chat die onthoudt (lib/geheugen.js): wensen met toestemming, datum per wens, contact alleen voor berichten bij een datum of verandering; versturen staat aan met kv mij:zend = 1.', contacten: Number(c) || 0, dagen };
}

// ---------- in de browser (wordt in elke chat van lib/kzux.js gezet) ----------
const TX = {
  nl: { jij: 'Jij zocht', onthoudt: 'Dit onthoud ik voor je, alleen omdat je ja zei. Nooit verkocht.', allesWeg: 'Alles vergeten', weg: 'vergeet', alleIn: 'Alles bij elkaar', welkom: 'Welkom terug',
    onthoud: 'Zal ik onthouden dat je {wat} zoekt? Dan klopt mijn volgende advies meteen.', ja: 'Ja, onthoud het', nee: 'Nee, liever niet', bewaard: 'Onthouden. Je ziet het bovenaan de chat en kunt het altijd vergeten.',
    datum: { contract: 'Wanneer loopt je huidige contract af?', examen: 'Wanneer is je examen?', verjaardag: 'Wanneer is de verjaardag of het moment?', anders: 'Wanneer wil je het geregeld hebben?' },
    snel: ['Binnen een week', 'Binnen een maand', 'Over 3 maanden', 'Ik kies een datum', 'Weet ik nog niet'], kies: 'Kies de datum', ok: 'Opslaan', datumOk: 'Genoteerd: {d}.',
    contact: 'Zal ik je een berichtje sturen als je datum dichtbij komt of als er iets verandert? Alleen dan.', viaWa: 'Per WhatsApp', viaMail: 'Per mail', geen: 'Nee, dank je', mailPh: 'jouw@email.nl', waPh: '06 12345678',
    toest: 'Je mag me een bericht sturen over deze wensen. Stoppen kan altijd.', contactOk: 'Afgesproken. Je hoort alleen van me als je datum dichtbij komt of er iets verandert.', samen: 'Je eerdere wensen staan er nu ook bij.',
    meer: 'Waar kan ik je nog meer mee helpen?', meerPills: ['Energiecontract', 'Zorgverzekering', 'Een cadeau', 'Iets voor in huis'], fout: 'Dat lukte niet. Probeer het nog eens.' },
  us: { jij: 'You were looking for', onthoudt: 'I remember this for you, only because you said yes. Never sold.', allesWeg: 'Forget everything', weg: 'forget', alleIn: 'Everything in one place', welkom: 'Welcome back',
    onthoud: 'Shall I remember that you are looking for {wat}? Then my next advice fits right away.', ja: 'Yes, remember it', nee: 'No thanks', bewaard: 'Remembered. You see it at the top of the chat and can forget it any time.',
    datum: { contract: 'When does your current contract end?', examen: 'When is your test?', verjaardag: 'When is the birthday or the occasion?', anders: 'When do you want it sorted?' },
    snel: ['Within a week', 'Within a month', 'In 3 months', 'Pick a date', 'Not sure yet'], kies: 'Pick the date', ok: 'Save', datumOk: 'Noted: {d}.',
    contact: 'Shall I send you a short message when your date gets close or something changes? Only then.', viaWa: 'By WhatsApp', viaMail: 'By email', geen: 'No thanks', mailPh: 'you@email.com', waPh: '+1 555 123 4567',
    toest: 'You may send me a message about these wishes. I can stop any time.', contactOk: 'Deal. You only hear from me when your date gets close or something changes.', samen: 'Your earlier wishes are here too now.',
    meer: 'What else can I help you with?', meerPills: ['A gift', 'Kitchen appliance', 'Laptop or phone', 'Home backup power'], fout: 'That did not work. Please try again.' },
  de: { jij: 'Du hast gesucht', onthoudt: 'Das merke ich mir für dich, nur weil du ja gesagt hast. Nie verkauft.', allesWeg: 'Alles vergessen', weg: 'vergessen', alleIn: 'Alles an einem Ort', welkom: 'Willkommen zurück',
    onthoud: 'Soll ich mir merken, dass du {wat} suchst? Dann passt mein nächster Rat sofort.', ja: 'Ja, merk es dir', nee: 'Nein, lieber nicht', bewaard: 'Gemerkt. Du siehst es oben im Chat und kannst es jederzeit vergessen.',
    datum: { contract: 'Wann endet dein aktueller Vertrag?', examen: 'Wann ist deine Prüfung?', verjaardag: 'Wann ist der Geburtstag oder der Anlass?', anders: 'Bis wann soll es erledigt sein?' },
    snel: ['Innerhalb einer Woche', 'Innerhalb eines Monats', 'In 3 Monaten', 'Datum wählen', 'Weiß ich noch nicht'], kies: 'Datum wählen', ok: 'Speichern', datumOk: 'Notiert: {d}.',
    contact: 'Soll ich dir eine kurze Nachricht schicken, wenn dein Datum näher kommt oder sich etwas ändert? Nur dann.', viaWa: 'Per WhatsApp', viaMail: 'Per E-Mail', geen: 'Nein, danke', mailPh: 'du@email.de', waPh: '0151 1234567',
    toest: 'Du darfst mir zu diesen Wünschen schreiben. Ich kann jederzeit stoppen.', contactOk: 'Abgemacht. Du hörst nur von mir, wenn dein Datum näher kommt oder sich etwas ändert.', samen: 'Deine früheren Wünsche sind jetzt auch hier.',
    meer: 'Wobei kann ich dir noch helfen?', meerPills: ['Ein Geschenk', 'Küchengerät', 'Laptop oder Handy', 'Stromspeicher'], fout: 'Das hat nicht geklappt. Bitte noch einmal.' },
};
TX.kadoly = TX.nl;
export const MIJ_CSS = '.kx-mij{border:1px solid #111113;border-radius:16px;padding:12px 14px;margin:0 0 12px;background:#fff;color:#111113}.kx-mij h3{font-size:16px!important;font-weight:700;margin:0 0 6px!important}.kx-mij ul{list-style:none;margin:0;padding:0}.kx-mij li{display:flex;gap:8px;align-items:baseline;justify-content:space-between;padding:6px 0;border-top:1px solid #E5E7EB;font-size:16px}.kx-mij li:first-child{border-top:0}.kx-mij li a{color:#111113}.kx-mij li small{font-size:14px;color:#111113}.kx-mij button.kx-x{font:inherit;font-size:14px;background:none;border:0;color:#111113;text-decoration:underline;cursor:pointer;padding:0}.kx-mij p{font-size:14px!important;margin:8px 0 0!important;color:#111113}.kx-mijf{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.kx-mijf input{font:inherit;font-size:16px;padding:9px 12px;border:1px solid #111113;border-radius:12px;flex:1 1 180px;color:#111113;background:#fff}.kx-mijf label{font-size:14px;display:flex;gap:6px;align-items:flex-start;width:100%}'
  + '.kx-dk .kx-mij{background:transparent;color:#F2F3F5;border-color:#F2F3F5}.kx-dk .kx-mij li a,.kx-dk .kx-mij li small,.kx-dk .kx-mij p,.kx-dk .kx-mij button.kx-x{color:#F2F3F5}.kx-dk .kx-mijf input{background:transparent;color:#F2F3F5;border-color:#F2F3F5}';

// Client: draait na de chat; praat met de chat via window.__kx (vraag, stuur, bubbel, knop, C, st) en window.__kxNa (na elk antwoord).
function mijClient(TX) {
  var K = 'kxmij', X = window.__kx; if (!X || !X.C) return; var C = X.C, T = TX[C.taal] || TX.nl;
  function L() { try { var m = JSON.parse(localStorage.getItem(K) || 'null'); if (m && /^[0-9a-f]{24}$/.test(m.pid)) return m; } catch (e) {} var p = ''; for (var i = 0; i < 24; i++) p += Math.floor(Math.random() * 16).toString(16); return { pid: p, w: [], ask: {} }; }
  function S(m) { try { localStorage.setItem(K, JSON.stringify(m)); } catch (e) {} }
  var M = L(); M.ask = M.ask || {}; S(M);
  function api(op, b) { b.pid = M.pid; b.site = C.taal; return fetch('/api/keuze-tools?tool=mij&op=' + op, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(b) }).then(function (r) { return r.json(); }); }
  function V(f) { try { return (X.st() && X.st().v && X.st().v[f]) || 'a'; } catch (e) { return 'a'; } }
  function e(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dTekst(d) { try { return new Date(d + 'T12:00:00Z').toLocaleDateString(C.taal === 'us' ? 'en-US' : C.taal === 'de' ? 'de-DE' : 'nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (x) { return d; } }
  function paneel() {
    var el = document.getElementById('kx'); if (!el) return; var oud = el.querySelector('.kx-mij'); if (oud) oud.remove(); if (!M.w || !M.w.length) return;
    var d = document.createElement('div'); d.className = 'kx-mij';
    d.innerHTML = '<h3>' + e(T.jij) + '</h3><ul>' + M.w.slice(0, 6).map(function (w) { return '<li><span>' + (w.pad ? '<a href="' + e(w.pad) + '">' + e(w.wat) + '</a>' : e(w.wat)) + (w.datum ? ' <small>· ' + e(dTekst(w.datum)) + '</small>' : '') + '</span><button type="button" class="kx-x" data-id="' + e(w.id) + '">' + e(T.weg) + '</button></li>'; }).join('') + '</ul><p>' + e(T.onthoudt) + ' <button type="button" class="kx-x" data-alles="1">' + e(T.allesWeg) + '</button> · <a href="/mij">' + e(T.alleIn) + '</a></p>';
    d.addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('button.kx-x'); if (!b) return; if (b.getAttribute('data-alles')) { api('vergeet', { alles: 1 }).catch(function () {}); M.w = []; } else { var id = b.getAttribute('data-id'); M.w = M.w.filter(function (w) { return w.id !== id; }); api('vergeet', { id: id }).catch(function () {}); } S(M); paneel(); });
    var h = el.querySelector('h2.kx-h'); if (h && h.nextSibling) el.insertBefore(d, h.nextSibling); else el.insertBefore(d, el.firstChild);
  }
  // server is de bron (vergeten op een ander apparaat, samengevoegd na contact)
  api('get', {}).then(function (j) { if (j && j.ok) { M.w = j.w || []; M.ct = j.ct; M.zendAan = !!j.zendAan; S(M); paneel(); } }).catch(function () { paneel(); });
  paneel();
  function soortVan() { var t = (C.slug + ' ' + C.term).toLowerCase(); if (/contract|energie|stroom|gas|verzeker|insurance|versicher|hypothe|abonnement|tagesgeld|internet|mobiel|sim|lease/.test(t)) return 'contract'; if (/examen|theorie|rijbewijs|test|exam|prüfung|fuehrer|führer|permit|dmv/.test(t)) return 'examen'; if (/cadeau|kado|gift|geschenk|verjaardag|birthday|sinterklaas|kerst/.test(t)) return 'verjaardag'; return 'anders'; }
  var N = 0, huidig = null;
  function plus(dagen) { var d = new Date(Date.now() + dagen * 864e5); return d.toISOString().slice(0, 10); }
  function vraagDatum(w) {
    var so = soortVan(), b = X.bubbel('kx-ant', e(T.datum[so] || T.datum.anders)), p = document.createElement('div'); p.className = 'kx-cp';
    var zet = function (d) { p.remove(); api('wens', { id: w.id, wat: w.wat, pad: w.pad, datum: d, soort: so }).then(function (j) { if (j && j.ok) { M.w = j.w; S(M); paneel(); } }).catch(function () {}); if (d) { X.stuur({ e: 'datum' }); X.bubbel('kx-ant', e(T.datumOk.replace('{d}', dTekst(d)))); } vraagContact(); };
    [7, 30, 90].forEach(function (n, i) { p.appendChild(X.knop(T.snel[i], function () { zet(plus(n)); })); });
    p.appendChild(X.knop(T.snel[3], function () { var f = document.createElement('form'); f.className = 'kx-mijf'; f.innerHTML = '<input type="date" required aria-label="' + e(T.kies) + '" min="' + plus(0) + '"><button type="submit">' + e(T.ok) + '</button>'; f.onsubmit = function (ev) { ev.preventDefault(); var v = f.querySelector('input').value; if (v) { f.remove(); zet(v); } }; b.appendChild(f); }));
    p.appendChild(X.knop(T.snel[4], function () { zet(''); }));
    b.appendChild(p);
  }
  function vraagContact() {
    if (M.ct || M.ask.ct) return; M.ask.ct = Date.now(); S(M);
    var b = X.bubbel('kx-ant', e(T.contact)), p = document.createElement('div'); p.className = 'kx-cp';
    var vorm = function (via) { p.remove(); var f = document.createElement('form'); f.className = 'kx-mijf'; f.innerHTML = '<input ' + (via === 'wa' ? 'type="tel" autocomplete="tel" inputmode="tel" placeholder="' + e(T.waPh) + '"' : 'type="email" autocomplete="email" inputmode="email" placeholder="' + e(T.mailPh) + '"') + ' required><button type="submit">' + e(T.ok) + '</button><label><input type="checkbox" required> ' + e(T.toest) + '</label>';
      f.onsubmit = function (ev) { ev.preventDefault(); var a = f.querySelector('input').value; api('contact', { via: via, adres: a, toestemming: T.toest }).then(function (j) { if (!j || !j.ok) throw 0; M.ct = j.ct; M.w = j.w; S(M); paneel(); f.remove(); X.stuur({ e: 'contact' }); X.bubbel('kx-ant', e(T.contactOk + (j.samen ? ' ' + T.samen : ''))); }).catch(function () { X.bubbel('kx-ant', e(T.fout)); }); };
      b.appendChild(f); };
    p.appendChild(X.knop(T.viaWa, function () { vorm('wa'); })); p.appendChild(X.knop(T.viaMail, function () { vorm('mail'); })); p.appendChild(X.knop(T.geen, function () { p.remove(); }));
    b.appendChild(p);
  }
  function vraagOnthoud(j) {
    // alleen wat in DIT gesprek op DEZE pagina gezegd is (20 nov 2026, Henkjan: "Weer bol ? !!!": de kapperspagina bood aan "vandaag bij bol" te onthouden, uit een oude zoekvraag op een andere pagina)
    var i = j && j.i && j.i.wat ? j.i : null, wat = (i && i.wat) || C.term || ''; if (/(^|\s)(bol|bol\.com|amazon|vandaag|deals?|heute|today)(\s|$)/i.test(wat)) wat = C.term || ''; if (!wat || M.ask[wat.toLowerCase()]) return; M.ask[wat.toLowerCase()] = Date.now(); S(M);
    var extra = i ? [i.voorWie, i.budget].filter(Boolean).join(', ') : '';
    var b = X.bubbel('kx-ant', e(T.onthoud.replace('{wat}', wat))), p = document.createElement('div'); p.className = 'kx-cp';
    p.appendChild(X.knop(T.ja, function () { p.remove(); api('wens', { wat: wat, extra: extra, pad: location.pathname }).then(function (j) { if (!j || !j.ok) throw 0; M.w = j.w; S(M); paneel(); X.stuur({ e: 'onthoud' }); X.bubbel('kx-ant', e(T.bewaard)); var w = (j.w || []).filter(function (x) { return x.id === j.id; })[0]; if (w && !w.datum) vraagDatum(w); }).catch(function () { X.bubbel('kx-ant', e(T.fout)); }); }));
    p.appendChild(X.knop(T.nee, function () { p.remove(); }));
    b.appendChild(p);
  }
  function vraagMeer() { var b = X.bubbel('kx-ant', e(T.meer)), p = document.createElement('div'); p.className = 'kx-cp'; T.meerPills.forEach(function (x) { p.appendChild(X.knop(x, function () { p.remove(); X.vraag(x); })); }); b.appendChild(p); }
  window.__kxNa = function (el, j) {
    if (!j || j.weet === false) return; N++;
    var na = V('onthoud') === 'b' ? 2 : 1;
    if (N === na) setTimeout(function () { vraagOnthoud(j); }, 400);
    else if (N === 2 && V('meer') !== 'b') setTimeout(vraagMeer, 400);
  };
}
export function mijJs() { return '<script>(' + mijClient.toString() + ')(' + JSON.stringify(TX) + ');</script>'; }

// /mij: de chat helemaal persoonlijk, zonder keuzehulp eromheen ("clean voor hun over hen"): alleen jouw wensen met datum, de chat en wat we onthouden.
const PG = {
  nl: { titel: 'Jouw keuzehulp', lead: 'Wat je zocht, met je datums. Vraag verder waar je bent gebleven, of begin iets nieuws.', vertrouwen: 'Wat ik onthoud', regels: ['Alleen wat je zelf liet onthouden, na een ja.', 'Je ziet hier alles en vergeet het met één tik; dan is het ook bij ons weg.', 'Een bericht krijg je alleen als je daarom vroeg: als je datum dichtbij komt of er iets verandert.', 'We verkopen niets door. Merken kunnen geen plek kopen.'], term: 'je wensen',
    faq: [['Wat onthoud je van mij?', 'Alleen de wensen waarbij je ja zei, met de datum als je die gaf, en je mail of WhatsApp als je om een bericht vroeg. Geen naam en geen gezondheidsgegevens.'], ['Hoe vergeet ik alles?', 'Tik in het blok bovenaan op Alles vergeten. Dan wissen we het ook op de server.'], ['Sturen jullie mijn gegevens door?', 'Nee. We verkopen of delen je wensen en je contact niet.']] },
  us: { titel: 'Your guide', lead: 'What you were looking for, with your dates. Pick up where you left off, or start something new.', vertrouwen: 'What I remember', regels: ['Only what you asked me to remember, after a yes.', 'You see everything here and can forget it in one tap; then it is gone on our side too.', 'You only get a message if you asked for one: when your date gets close or something changes.', 'We never sell anything on. Brands cannot buy a place.'], term: 'your wishes',
    faq: [['What do you remember about me?', 'Only the wishes you said yes to, with the date if you gave one, and your email or WhatsApp if you asked for a message. No name and no health details.'], ['How do I forget everything?', 'Tap Forget everything in the box at the top. Then we delete it on the server too.'], ['Do you share my details?', 'No. We do not sell or share your wishes or your contact.']] },
  de: { titel: 'Dein Kaufberater', lead: 'Was du gesucht hast, mit deinen Terminen. Mach weiter, wo du aufgehört hast, oder fang etwas Neues an.', vertrouwen: 'Was ich mir merke', regels: ['Nur was du mich merken lässt, nach einem Ja.', 'Du siehst hier alles und vergisst es mit einem Tipp; dann ist es auch bei uns weg.', 'Eine Nachricht bekommst du nur, wenn du darum gebeten hast: wenn dein Termin näher kommt oder sich etwas ändert.', 'Wir verkaufen nichts weiter. Marken können keinen Platz kaufen.'], term: 'deine Wünsche',
    faq: [['Was merkst du dir über mich?', 'Nur die Wünsche, bei denen du ja gesagt hast, mit dem Datum, wenn du eins genannt hast, und deine E-Mail oder WhatsApp, wenn du um eine Nachricht gebeten hast. Kein Name und keine Gesundheitsdaten.'], ['Wie vergesse ich alles?', 'Tippe oben im Kasten auf Alles vergessen. Dann löschen wir es auch auf dem Server.'], ['Gebt ihr meine Daten weiter?', 'Nein. Wir verkaufen oder teilen deine Wünsche und deinen Kontakt nicht.']] },
};
export async function mijPagina(taal) {
  const { kzuxBlok } = await import('./kzux.js'), { huisstijlPagina } = await import('./huisstijl.js');
  const t = PG[taal] || PG.nl, lang = taal === 'us' ? 'en' : taal === 'de' ? 'de' : 'nl';
  const chat = kzuxBlok({ alleenChat: true, kop: { nl: 'Vraag verder', us: 'Ask away', de: 'Frag weiter' }[taal] || 'Vraag verder', taal: taal === 'us' || taal === 'de' ? taal : 'nl', site: 'kzuxmij' + (taal === 'nl' ? '' : taal), slug: 'mij', term: t.term, shop: '', prods: [], opties: [], faq: t.faq.map(([q, a]) => ({ q, a })), geenVolg: true });
  const body = '<h1>' + t.titel + '</h1><p class="lead">' + t.lead + '</p>' + chat + '<h2>' + t.vertrouwen + '</h2><ul>' + t.regels.map(r => '<li>' + r + '</li>').join('') + '</ul>';
  const html = '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + t.titel + '</title><meta name="robots" content="noindex"></head><body><header><nav></nav></header><main><article>' + body + '</article></main><footer></footer></body></html>';
  return huisstijlPagina(html, taal === 'us' || taal === 'de' ? taal : 'nl', {});
}
