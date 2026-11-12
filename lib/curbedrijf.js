// Bedrijfspagina's van curacao.day (bedrijvengids, lib/cur.js renderGidsBedrijf) voor de zoeker én de eigenaar (Henkjan 12 nov 2026: "Zorg dat
// dit extreem geoptimaliseerd wordt dan ga ik bedrijven mailen": wat de zoeker wil weten: open nu, bel of WhatsApp met één tik, het menu of de deal
// van vandaag, reviews van lezers). Hier:
// - openingstijden lezen (x.uren per dag), "Nu open · tot 21:00" in Curaçao-tijd (server en browser), korte weekregel voor titel en description,
//   openingHoursSpecification voor Google
// - reviews van lezers (sterren in één tik, korte tekst mag): KV cur:rev:<cat>:<slug>; tekst met link, e-mail of telefoon wacht op controle
// - eigenaar: claim (gratis) met deal of menu, Henkjan krijgt een Telegram-bericht met een goedkeurlink (HMAC met CRON_SECRET); pas na zijn tik
//   staat de deal op de pagina. Cijfers per zaak (bekeken, tikken op bellen, WhatsApp, route, website) voor de eigenaarspagina.
import { kv } from './db.js';
import { createHash, createHmac } from 'node:crypto';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const DAGEN = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const isMobielCW = t => /^\+?5999[56]\d{6}$/.test(String(t || '').replace(/[^\d+]/g, '')); // mobiel op Curaçao: 9-5xx en 9-6xx (9-4xx, 9-7xx, 9-8xx zijn vaste lijnen zonder WhatsApp)

// ---------- openingstijden ----------
function minuten(h, mm, ap) { let u = Number(h) % 24; const m = Number(mm || 0); if (ap) { const p = ap.toLowerCase(); if (p === 'pm' && u < 12) u += 12; if (p === 'am' && u === 12) u = 0; } return u * 60 + m; }
// "11:30-21:00", "11:30 AM–9:00 PM", "08:00-12:00, 13:00-17:00", "closed", "Open 24 hours" → [[van, tot], ...] in minuten (tot > 1440 = na middernacht)
export function urenVan(s) {
  const t = String(s || '').trim(); if (!t || /closed|gesloten|dicht|cerrado|fechado|geschlossen/i.test(t)) return [];
  if (/24\s*(h|hours|uur|horas|stunden)/i.test(t)) return [[0, 1440]];
  const out = [], re = /(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*[-–—]\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/gi; let r;
  while ((r = re.exec(t))) { const van = minuten(r[1], r[2], (r[3] || '').replace(/\./g, '')), totM = minuten(r[4], r[5], (r[6] || '').replace(/\./g, '')); out.push([van, totM <= van ? totM + 1440 : totM]); }
  return out;
}
export function rooster(uren) { if (!uren || typeof uren !== 'object') return null; const R = {}; let iets = false; for (const k of DAGEN) { R[k] = urenVan(uren[k]); if (R[k].length) iets = true; } return iets ? R : null; }
const hm = m => { const x = ((m % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
// status nu: { open, tot } of { open:false, dag (0 = vandaag, 1 = morgen, ...), om }. Ook in de browser (toString), dus zelfstandig.
export function statusNu(R, nu) {
  var D = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], c = new Date(nu - 4 * 3600e3), w = (c.getUTCDay() + 6) % 7, m = c.getUTCHours() * 60 + c.getUTCMinutes(), i, j, r;
  var gist = R[D[(w + 6) % 7]] || []; for (i = 0; i < gist.length; i++) { if (gist[i][1] > 1440 && m < gist[i][1] - 1440) return { open: true, tot: gist[i][1] - 1440 }; }
  var nu0 = R[D[w]] || []; for (i = 0; i < nu0.length; i++) { if (m >= nu0[i][0] && m < nu0[i][1]) return { open: true, tot: nu0[i][1] % 1440, laat: nu0[i][1] - m <= 60 }; }
  for (j = 0; j < 7; j++) { r = R[D[(w + j) % 7]] || []; for (i = 0; i < r.length; i++) { if (j > 0 || r[i][0] > m) return { open: false, dag: j, om: r[i][0], wd: (w + j) % 7 }; } }
  return null;
}
const T = {
  nl: { open: 'Nu open', tot: 'tot', dicht: 'Nu gesloten', opent: 'opent', vandaag: 'vandaag', morgen: 'morgen', sluit: 'sluit om', dag: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'], kort: ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'], gesl: 'gesloten', route: 'Route', tijd: 'Curaçao-tijd' },
  en: { open: 'Open now', tot: 'until', dicht: 'Closed now', opent: 'opens', vandaag: 'today', morgen: 'tomorrow', sluit: 'closes at', dag: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], kort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], gesl: 'closed', route: 'Directions', tijd: 'Curaçao time' },
  de: { open: 'Jetzt geöffnet', tot: 'bis', dicht: 'Jetzt geschlossen', opent: 'öffnet', vandaag: 'heute', morgen: 'morgen', sluit: 'schließt um', dag: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'], kort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], gesl: 'geschlossen', route: 'Route', tijd: 'Ortszeit Curaçao' },
  es: { open: 'Abierto ahora', tot: 'hasta las', dicht: 'Cerrado ahora', opent: 'abre', vandaag: 'hoy', morgen: 'mañana', sluit: 'cierra a las', dag: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'], kort: ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'], gesl: 'cerrado', route: 'Cómo llegar', tijd: 'hora de Curazao' },
  pt: { open: 'Aberto agora', tot: 'até', dicht: 'Fechado agora', opent: 'abre', vandaag: 'hoje', morgen: 'amanhã', sluit: 'fecha às', dag: ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'], kort: ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'], gesl: 'fechado', route: 'Como chegar', tijd: 'hora de Curaçao' },
};
export function statusTekst(m, s) {
  const t = T[m] || T.en; if (!s) return '';
  if (s.open) return t.open + ' · ' + t.tot + ' ' + hm(s.tot);
  return t.dicht + ' · ' + t.opent + ' ' + (s.dag === 0 ? t.vandaag + ' ' : s.dag === 1 ? t.morgen + ' ' : t.dag[s.wd] + ' ') + hm(s.om);
}
// "di-zo 11:30-21:00 · ma gesloten" (dagen met dezelfde tijden samen)
export function weekRegel(m, R) {
  const t = T[m] || T.en, sl = DAGEN.map(k => (R[k] || []).map(r => hm(r[0]) + '-' + hm(r[1])).join(', ') || '-'), groepen = [];
  for (let i = 0; i < 7; i++) { const g = groepen[groepen.length - 1]; if (g && g.v === sl[i] && g.b === i - 1) g.b = i; else groepen.push({ a: i, b: i, v: sl[i] }); }
  const per = {}; for (const g of groepen) (per[g.v] = per[g.v] || []).push(g.a === g.b ? t.kort[g.a] : t.kort[g.a] + '-' + t.kort[g.b]);
  return Object.entries(per).sort((a, b) => (a[0] === '-') - (b[0] === '-')).map(([v, d]) => d.join(', ') + ' ' + (v === '-' ? t.gesl : v)).join(' · ');
}
export function ohSchema(R) {
  const N = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], out = [];
  DAGEN.forEach((k, i) => (R[k] || []).forEach(r => out.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: N[i], opens: hm(r[0]), closes: r[1] >= 1440 && r[1] - 1440 === 0 ? '23:59' : hm(r[1]) })));
  return out;
}

// ---------- titel en description (zoekers zoeken op naam: "flakos curacao", "dominos curacao") ----------
const TT = {
  nl: n => n + ': openingstijden, telefoon en reviews', en: n => n + ': hours, phone and reviews', de: n => n + ': Öffnungszeiten, Telefon und Bewertungen', es: n => n + ': horario, teléfono y opiniones', pt: n => n + ': horário, telefone e avaliações',
};
export function titel(m, naam) { const plek = { nl: 'Curaçao', en: 'Curaçao', de: 'Curaçao', es: 'Curazao', pt: 'Curaçao' }[m] || 'Curaçao', n = /cura[cç]ao|curazao|willemstad/i.test(naam) ? naam : naam + ' ' + plek; return (TT[m] || TT.en)(n); }
export function beschrijving(m, x, R, rev) {
  const del = [R ? weekRegel(m, R) : '', x.score ? x.score + '★ (' + x.aantal + ' Google)' : '', rev && rev.n ? rev.gem + '★ (' + rev.n + ' ' + ({ nl: 'lezers', en: 'readers', de: 'Leser', es: 'lectores', pt: 'leitores' }[m] || 'readers') + ')' : '', x.adres ? String(x.adres).replace(/,\s*Cura[cç]ao$/i, '') : '', x.tel || ''];
  return del.filter(Boolean).join(' · ').slice(0, 158);
}

// ---------- reviews van lezers ----------
const RT = {
  nl: { kop: 'Wat lezers zeggen', leeg: 'Nog geen review van lezers. Was je er? Geef sterren in één tik.', ph: 'Wat viel op? (mag leeg)', naam: 'Je naam (mag leeg)', knop: 'Plaats review', dank: 'Dank je! Je review staat er zo op.', lezer: 'Lezer', n: n => n === 1 ? '1 lezer' : n + ' lezers', fout: 'Dat lukte niet. Probeer het later nog eens.', al: 'Je gaf hier al een review.', sterren: s => s + ' van 5 sterren' },
  en: { kop: 'What readers say', leeg: 'No reader reviews yet. Been there? Rate it in one tap.', ph: 'What stood out? (optional)', naam: 'Your name (optional)', knop: 'Post review', dank: 'Thanks! Your review will appear shortly.', lezer: 'Reader', n: n => n === 1 ? '1 reader' : n + ' readers', fout: 'That did not work. Please try again later.', al: 'You already reviewed this place.', sterren: s => s + ' out of 5 stars' },
  de: { kop: 'Was Leser sagen', leeg: 'Noch keine Leserbewertung. Warst du dort? Bewerte mit einem Tipp.', ph: 'Was ist dir aufgefallen? (optional)', naam: 'Dein Name (optional)', knop: 'Bewertung senden', dank: 'Danke! Deine Bewertung erscheint gleich.', lezer: 'Leser', n: n => n + ' Leser', fout: 'Das hat nicht geklappt. Bitte später noch einmal.', al: 'Du hast hier schon bewertet.', sterren: s => s + ' von 5 Sternen' },
  es: { kop: 'Lo que dicen los lectores', leeg: 'Aún no hay opiniones de lectores. ¿Has estado? Valóralo con un toque.', ph: '¿Qué destacarías? (opcional)', naam: 'Tu nombre (opcional)', knop: 'Publicar opinión', dank: '¡Gracias! Tu opinión aparecerá en breve.', lezer: 'Lector', n: n => n === 1 ? '1 lector' : n + ' lectores', fout: 'No funcionó. Inténtalo más tarde.', al: 'Ya opinaste sobre este lugar.', sterren: s => s + ' de 5 estrellas' },
  pt: { kop: 'O que dizem os leitores', leeg: 'Ainda sem avaliações de leitores. Já esteve lá? Avalie com um toque.', ph: 'O que chamou atenção? (opcional)', naam: 'Seu nome (opcional)', knop: 'Publicar avaliação', dank: 'Obrigado! Sua avaliação aparecerá em breve.', lezer: 'Leitor', n: n => n === 1 ? '1 leitor' : n + ' leitores', fout: 'Não funcionou. Tente mais tarde.', al: 'Você já avaliou este lugar.', sterren: s => s + ' de 5 estrelas' },
};
const sleutel = (cs, slug) => String(cs).replace(/[^a-z0-9-]/g, '').slice(0, 60) + ':' + String(slug).replace(/[^a-z0-9-]/g, '').slice(0, 80);
export async function reviews(cs, slug) {
  const l = await kv.raw(['LRANGE', 'cur:rev:' + sleutel(cs, slug), '0', '99']).catch(() => []);
  const lijst = (l || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(r => r && r.s >= 1 && r.s <= 5);
  const n = lijst.length, gem = n ? Math.round(10 * lijst.reduce((a, r) => a + r.s, 0) / n) / 10 : 0;
  return { n, gem, lijst: lijst.slice(0, 20) };
}
// tekst mag geen reclame of contactgegevens bevatten; zulke teksten wachten op controle (de sterren tellen meteen)
const VIES = /\b(kut|kanker|tering|klootzak|hoer|fuck|shit|bitch|asshole|puta|mierda|pendejo|coño|scheisse|arschloch|porra|caralho)\b/i;
function tekstOk(t) { return !(/https?:|www\.|\.(com|cw|nl|net|org)\b|@|\d{6,}|(\d[\s.-]?){7,}/i.test(t) || VIES.test(t) || (t.length > 12 && t === t.toUpperCase() && /[A-Z]/.test(t))); }
export async function reviewPost(req, res, body) {
  res.setHeader('access-control-allow-origin', '*'); res.setHeader('cache-control', 'no-store');
  const b = body || {}, cs = String(b.cs || ''), slug = String(b.slug || ''), s = Math.round(Number(b.s)), m = T[b.m] ? b.m : 'en';
  if (!cs || !slug || !(s >= 1 && s <= 5) || b.website || !(Number(b.ms) > 2500)) return res.status(200).json({ ok: false });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), ih = createHash('sha256').update(ip + '|' + (process.env.CRON_SECRET || 'cw')).digest('hex').slice(0, 16), k = sleutel(cs, slug);
  const vrij = await kv.raw(['SET', 'cur:revip:' + k + ':' + ih, '1', 'NX', 'EX', String(180 * 86400)]).catch(() => 'OK'); if (!vrij) return res.status(200).json({ ok: false, al: true });
  const dagIp = await kv.incr('cur:revdag:' + new Date().toISOString().slice(0, 10) + ':' + ih).catch(() => 1); if (dagIp > 8) return res.status(200).json({ ok: false });
  const tekst = String(b.t || '').replace(/\s+/g, ' ').trim().slice(0, 280), naam = String(b.n || '').replace(/[<>"@]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
  const r = { s, d: new Date().toISOString().slice(0, 10), m, ...(naam ? { n: naam } : {}) };
  if (tekst && tekstOk(tekst)) r.t = tekst; else if (tekst) await kv.raw(['LPUSH', 'cur:rev:wacht', JSON.stringify({ ...r, t: tekst, cs, slug, at: Date.now() })]).catch(() => {});
  await kv.raw(['LPUSH', 'cur:rev:' + k, JSON.stringify(r)]); await kv.raw(['LTRIM', 'cur:rev:' + k, '0', '499']).catch(() => {});
  await kv.incrMany([['cur:revtel:' + new Date().toISOString().slice(0, 10), 1]]).catch(() => {});
  return res.status(200).json({ ok: true, wacht: !!(tekst && !r.t) });
}
export function reviewBlok(m, cs, slug, rev, API) {
  const t = RT[m] || RT.en, ster = n => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  const lijst = rev.lijst.filter(r => r.t || r.n).slice(0, 8).map(r => '<div class="rv-r"><p class="rv-s" aria-label="' + esc(t.sterren(r.s)) + '">' + ster(r.s) + '</p>' + (r.t ? '<p class="rv-t">' + esc(r.t) + '</p>' : '') + '<p class="rv-w">' + esc(r.n || t.lezer) + ' · ' + esc(r.d) + '</p></div>').join('');
  return '<section class="rv" id="reviews"><h2>' + esc(t.kop) + '</h2>' + (rev.n ? '<p class="rv-gem"><b>' + String(rev.gem).replace('.', m === 'en' ? '.' : ',') + '</b> <span aria-hidden="true">' + ster(Math.round(rev.gem)) + '</span> · ' + esc(t.n(rev.n)) + '</p>' + lijst : '<p>' + esc(t.leeg) + '</p>')
    + '<form class="rv-f" id="rvf"><div class="rv-k" role="radiogroup">' + [1, 2, 3, 4, 5].map(n => '<button type="button" data-s="' + n + '" aria-label="' + esc(t.sterren(n)) + '">★</button>').join('') + '</div><div class="rv-meer" hidden><textarea name="t" maxlength="280" rows="2" placeholder="' + esc(t.ph) + '"></textarea><input name="n" maxlength="30" placeholder="' + esc(t.naam) + '"><input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button type="submit" class="cta">' + esc(t.knop) + '</button></div><p class="rv-ok" hidden></p></form></section>'
    + '<script>(function(){var f=document.getElementById("rvf");if(!f)return;var t0=Date.now(),S=0,k=f.querySelectorAll(".rv-k button"),meer=f.querySelector(".rv-meer"),ok=f.querySelector(".rv-ok");k.forEach(function(b){b.onclick=function(){S=+b.getAttribute("data-s");k.forEach(function(x){x.classList.toggle("aan",+x.getAttribute("data-s")<=S)});meer.hidden=false;if(window.__curHit)window.__curHit("rv-ster")}});'
    + 'f.onsubmit=function(e){e.preventDefault();if(!S)return;var bt=f.querySelector("button[type=submit]");bt.disabled=true;fetch(' + JSON.stringify(API + '/api/keuze-tools?tool=cur&op=review') + ',{method:"POST",headers:{"content-type":"text/plain"},body:JSON.stringify({cs:' + JSON.stringify(cs) + ',slug:' + JSON.stringify(slug) + ',s:S,t:f.t.value,n:f.n.value,website:f.website.value,m:' + JSON.stringify(m) + ',ms:Date.now()-t0})}).then(function(r){return r.json()}).catch(function(){return{}}).then(function(j){meer.hidden=true;f.querySelector(".rv-k").hidden=true;ok.hidden=false;ok.textContent=j&&j.ok?' + JSON.stringify(t.dank) + ':j&&j.al?' + JSON.stringify(t.al) + ':' + JSON.stringify(t.fout) + ';if(j&&j.ok&&window.__curHit)window.__curHit("rv-post")})}})();</script>';
}
export const BZ_CSS = '.nu{display:flex;align-items:center;gap:8px;font-weight:700;font-size:17px;margin:0 0 12px}.nu i{width:10px;height:10px;border-radius:50%;background:#2F7D73;flex:0 0 auto}.nu.dicht i{background:#B54A2B}.nu small{font-weight:400;font-size:13px;opacity:.8}'
  + '.tik{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:0 0 14px}.tik a{display:flex;align-items:center;justify-content:center;gap:6px;min-height:48px;border-radius:999px;font-weight:700;font-size:16px;text-decoration:none;background:#EEF1FC;color:#002B7F;border:1px solid #D5DBF3}.tik a.hoofd{background:#002B7F;color:#fff;border-color:#002B7F}.tik a.wa{background:#25D366;color:#063;border-color:#25D366}'
  + '.rv h2{margin-bottom:6px}.rv-gem{font-size:17px;margin:0 0 10px}.rv-gem span,.rv-s{color:#C4923A;letter-spacing:2px}.rv-r{padding:10px 0;border-top:1px solid #D5DBF3}.rv-r p{margin:0}.rv-t{margin:2px 0!important}.rv-w{font-size:13px;opacity:.85}.rv-f{margin:12px 0 0}.rv-k{display:flex;gap:6px}.rv-k button{font-size:30px;line-height:1;background:none;border:0;color:#C9D2F0;cursor:pointer;padding:4px}.rv-k button.aan{color:#C4923A}.rv-meer[hidden],.rv-k[hidden]{display:none!important}.rv-meer{display:flex;flex-direction:column;gap:8px;margin:8px 0 0;max-width:460px}.rv-meer textarea,.rv-meer input{font:inherit;font-size:16px;padding:10px 12px;border:1px solid #D5DBF3;border-radius:12px}.rv-ok{font-weight:600}'
  + '.deal{background:#FFF8EC;border-left:6px solid #E3A93B;border-radius:12px;padding:14px 16px;margin:0 0 16px}.deal .lb{margin:0 0 4px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#7A4E00}.deal p{margin:0}.eig{border-top:1px solid #D5DBF3;padding-top:14px}.eig p{margin:0 0 8px}'
  + '@media (prefers-color-scheme:dark){.tik a{background:#18224A;color:#C9D3F5;border-color:#2C3A72}.tik a.hoofd{background:#F9E814;color:#002B7F;border-color:#F9E814}.deal{background:#2a2410}.deal .lb{color:#F2C46B}.rv-r{border-color:#2C3A72}}';

// ---------- eigenaar: deal of menu, claim, cijfers ----------
const ET = {
  nl: { kop: 'Is dit jouw zaak?', tekst: 'Zet gratis je deal van vandaag, je menu en foto\'s op deze pagina, en zie hoeveel mensen je hier vinden.', link: 'Bekijk je cijfers en claim gratis →', deal: 'Deal van vandaag', menu: 'Menu', via: 'via de eigenaar' },
  en: { kop: 'Is this your business?', tekst: 'Add today\'s deal, your menu and photos to this page for free, and see how many people find you here.', link: 'See your numbers and claim for free →', deal: 'Today\'s deal', menu: 'Menu', via: 'from the owner' },
  de: { kop: 'Ist das dein Unternehmen?', tekst: 'Stell kostenlos dein Angebot des Tages, deine Speisekarte und Fotos auf diese Seite und sieh, wie viele Leute dich hier finden.', link: 'Zahlen ansehen und kostenlos übernehmen →', deal: 'Angebot des Tages', menu: 'Speisekarte', via: 'vom Inhaber' },
  es: { kop: '¿Es tu negocio?', tekst: 'Añade gratis la oferta del día, tu menú y fotos a esta página, y mira cuántas personas te encuentran aquí.', link: 'Ver tus cifras y reclamar gratis →', deal: 'Oferta del día', menu: 'Menú', via: 'del dueño' },
  pt: { kop: 'É o seu negócio?', tekst: 'Adicione grátis a oferta do dia, seu cardápio e fotos a esta página e veja quantas pessoas encontram você aqui.', link: 'Ver seus números e reivindicar grátis →', deal: 'Oferta do dia', menu: 'Cardápio', via: 'do dono' },
};
export const eigenaarUrl = (host, pre, m, cs, slug) => 'https://' + host + pre + '/eigenaar?g=' + encodeURIComponent(cs + '/' + slug);
export function eigenaarBlok(m, url) { const t = ET[m] || ET.en; return '<section class="eig"><h2>' + esc(t.kop) + '</h2><p>' + esc(t.tekst) + '</p><p><a href="' + esc(url) + '" rel="nofollow" data-out="eig">' + esc(t.link) + '</a></p></section>'; }
export async function deal(cs, slug) { const d = await kv.get('cur:deal:' + sleutel(cs, slug)).catch(() => null); if (!d || !d.ok) return null; if (d.tot && d.tot < new Date(Date.now() - 4 * 3600e3).toISOString().slice(0, 10)) return null; return d; }
export function dealBlok(m, d) { if (!d) return ''; const t = ET[m] || ET.en, tekst = typeof d.t === 'object' ? (d.t[m] || d.t.en || Object.values(d.t)[0]) : d.t; return '<div class="deal"><p class="lb">' + esc(d.soort === 'menu' ? t.menu : t.deal) + ' · ' + esc(t.via) + '</p>' + (tekst ? '<p>' + esc(tekst) + '</p>' : '') + (d.url ? '<p><a href="' + esc(d.url) + '" target="_blank" rel="noopener nofollow" data-out="deal">' + esc(d.soort === 'menu' ? t.menu : t.deal) + ' →</a></p>' : '') + '</div>'; }

async function meld(tekst) {
  const s = process.env.MELD_SLEUTEL; if (s) { try { const r = await fetch((process.env.MELD_URL || 'https://spel.todayin.email') + '/api/meld', { method: 'POST', headers: { 'content-type': 'application/json', 'x-meld-sleutel': s }, body: JSON.stringify({ bron: 'curacao.day bedrijven', tekst: tekst.slice(0, 3400) }), signal: AbortSignal.timeout(10000) }); const j = await r.json().catch(() => ({})); if (j && j.ok) return true; } catch (e) {} }
  const tok = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID; if (!tok || !chat) return false;
  try { const r = await fetch('https://api.telegram.org/bot' + tok + '/sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: tekst.slice(0, 3900), disable_web_page_preview: true }), signal: AbortSignal.timeout(8000) }); return r.ok; } catch (e) { return false; }
}
const handtekening = id => createHmac('sha256', process.env.CRON_SECRET || 'cw-claim').update('claim:' + id).digest('hex').slice(0, 24);
// claim van een eigenaar: opslaan, Henkjan krijgt de gegevens en een goedkeurlink; hij belt of appt eerst het nummer van de zaak zelf
export async function claimPost(req, res, body, info) {
  res.setHeader('access-control-allow-origin', '*'); res.setHeader('cache-control', 'no-store');
  const b = body || {}, cs = String(b.cs || ''), slug = String(b.slug || ''); if (!cs || !slug || b.website || !(Number(b.ms) > 4000)) return res.status(200).json({ ok: false });
  const vel = (x, n) => String(x || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
  const c = { id: Math.random().toString(36).slice(2, 10), at: Date.now(), cs, slug, m: T[b.m] ? b.m : 'en', naam: vel(b.naam, 60), rol: vel(b.rol, 30), mail: vel(b.mail, 80), tel: vel(b.tel, 30), deal: vel(b.deal, 240), menu: /^https?:\/\//.test(String(b.menu || '')) ? vel(b.menu, 200) : '', zaak: info ? { naam: info.naam, tel: info.tel || '', url: info.url } : null };
  if (!c.naam || !(c.mail.includes('@') || c.tel.replace(/\D/g, '').length >= 7)) return res.status(200).json({ ok: false, reden: 'contact' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), ih = createHash('sha256').update(ip).digest('hex').slice(0, 12);
  if ((await kv.incr('cur:claimip:' + new Date().toISOString().slice(0, 10) + ':' + ih).catch(() => 1)) > 5) return res.status(200).json({ ok: false });
  await kv.set('cur:claim:' + c.id, c, { ex: 120 * 86400 }); await kv.raw(['LPUSH', 'cur:claims', c.id]).catch(() => {});
  const ok = 'https://keuzehulp.best/api/keuze-tools?tool=cur&op=claimok&id=' + c.id + '&s=' + handtekening(c.id);
  await meld('Nieuwe claim op curacao.day: ' + (c.zaak ? c.zaak.naam : slug) + ' (' + cs + ')\nDoor: ' + c.naam + (c.rol ? ', ' + c.rol : '') + '\nContact: ' + [c.mail, c.tel].filter(Boolean).join(' · ') + (c.deal ? '\nDeal: ' + c.deal : '') + (c.menu ? '\nMenu: ' + c.menu : '') + '\nBel of app eerst het nummer van de zaak' + (c.zaak && c.zaak.tel ? ' (' + c.zaak.tel + ')' : '') + ' om te checken dat het klopt.\nGoedkeuren (deal live, 7 dagen): ' + ok + (c.zaak ? '\nPagina: ' + c.zaak.url : '')).catch(() => {});
  return res.status(200).json({ ok: true });
}
export async function claimOk(res, id, s) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('content-type', 'text/html; charset=utf-8');
  if (!/^[a-z0-9]{6,12}$/.test(String(id)) || s !== handtekening(id)) return res.status(403).send('<p>Ongeldige link.</p>');
  const c = await kv.get('cur:claim:' + id).catch(() => null); if (!c) return res.status(404).send('<p>Claim niet gevonden.</p>');
  c.ok = Date.now(); await kv.set('cur:claim:' + id, c, { ex: 365 * 86400 });
  await kv.set('cur:eigenaar:' + sleutel(c.cs, c.slug), { naam: c.naam, rol: c.rol, mail: c.mail, tel: c.tel, sinds: new Date().toISOString().slice(0, 10), claim: id });
  if (c.deal || c.menu) await kv.set('cur:deal:' + sleutel(c.cs, c.slug), { ok: true, t: c.deal, url: c.menu, soort: c.deal ? 'deal' : 'menu', tot: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), claim: id });
  return res.status(200).send('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:18px/1.5 system-ui;padding:24px"><p><b>Goedgekeurd.</b> ' + esc(c.zaak ? c.zaak.naam : c.slug) + (c.deal || c.menu ? ': de ' + (c.deal ? 'deal' : 'menu-link') + ' staat 7 dagen op de pagina (binnen 10 minuten zichtbaar).' : ' is geclaimd.') + '</p>' + (c.zaak ? '<p><a href="' + esc(c.zaak.url) + '">Bekijk de pagina →</a></p>' : '') + '</body>');
}
// cijfers per zaak (30 dagen): bekeken, tikken (bellen, WhatsApp, route, website), reviews
export async function cijfers(cs, slug, talen) {
  const dagen = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)), k = String(slug).slice(0, 36);
  const soorten = { tel: 'out-g-' + k + '-tel', wa: 'out-g-' + k + '-wa', route: 'out-g-' + k + '-route', kaart: 'out-g-' + k + '-kaart', site: 'out-g-' + k, view: 'bv-' + String(slug).slice(0, 47) };
  const keys = []; for (const d of dagen) for (const m of talen) for (const [s, kk] of Object.entries(soorten)) keys.push([s, 'cur:h:' + d + ':' + m + ':gids:' + kk]);
  const uit = { view: 0, tel: 0, wa: 0, route: 0, site: 0 };
  for (let i = 0; i < keys.length; i += 400) { const deel = keys.slice(i, i + 400), v = await kv.mget(...deel.map(x => x[1])).catch(() => []); deel.forEach(([s], j) => { const n = Number(v[j]) || 0; if (s === 'kaart') uit.route += n; else uit[s] += n; }); }
  return uit;
}
