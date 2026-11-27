// Advies per mail na het chatantwoord op de keuzehulpen (27 nov 2026, taak 3fts1f; Henkjan: ja op 'Stuur mij dit advies per mail' en overleg met de keuzehulp-chat).
// Proef op de tekst van de volgknop onder het chatantwoord (lib/sjabloon.js):
//   a = 'Volg {term} in je ochtendmail' (zoals het was, dubbele opt-in via lib/keuze-updates.js)
//   b = 'Stuur mij dit advies per mail' (EN: 'Email me this advice', DE: 'Schick mir diesen Rat per Mail'): zelfde mailveld, één losse mail met het
//       antwoord uit de chat, de gekozen producten (alleen tekst) en de link terug naar de keuzehulp. Geen affiliate-links, geen winkellinks.
// SCHAKELAAR (veilig standaard UIT): kv-sleutel kz:adviesmail:aan = 1. Mail naar mensen vraagt Henkjans ja en hij ziet de mail eerst op de voorbeeldlink
//   (op=adviesvoorbeeld). Zolang de schakelaar uit staat (of kv niet bereikbaar is) ziet iedereen de oude tekst en gaat er geen adviesmail uit.
//   Aan of uit zonder build: https://hjdk-api-henq.vercel.app/api/keuze-updates?op=adviesschakel&zet=1 (of &zet=0) op de beschermde vercel.app-host (met de Vercel-tool, geen sleutel in de URL),
//   of op een andere host met de teamsleutel; &reset=1 wist de tellers en de uitslag.
// Het antwoord in de mail komt NOOIT uit de browser: fn/keuze-tools.js (op=chat) bewaart het antwoord dat de server zelf gaf per bezoeker en keuzehulp (adviesBewaar, 6 uur),
//   adviesVerstuur leest dat. Zonder bewaard antwoord geen mail.
// Proef: vaste helft per bezoeker (sid uit de browser, parity van een hash), tellen per tekst: getoond, getikt, adres (elk hooguit één keer per bezoeker).
//   Controle met drempel: zodra beide teksten 300 keer getoond zijn kiest beslis() de winnaar (meeste adressen per keer getoond) en blijft die voor
//   iedereen staan; de proef stopt dan zichzelf. Te weinig adressen (minder dan 10 samen) of een gelijke stand: geen winnaar, de huidige tekst (a) blijft staan.
// Stand als tekst: /api/keuze-updates?op=adviesstand (&vorm=json).
import { createHash } from 'node:crypto';
import { kv } from './db.js';
import { UPDATE_SITES, base, esc, page, catalog, mail, sender, hash, random } from './keuze-updates.js';

export const SCHAKELAAR = 'kz:adviesmail:aan';
export const UITSLAG = 'kz:adviesmail:uitslag';
export const DREMPEL = 300;      // keer getoond per tekst voordat de winnaar vaststaat
export const MIN_ADRES = 10;     // adressen samen die minstens nodig zijn om te kiezen
export const REM = { adresDag: 3, adresPauze: 600, ipUur: 5, wereldDag: 500 };

export const adviesAan = async () => { try { const v = await kv.get(SCHAKELAAR); return v === 1 || v === '1' || v === true; } catch (e) { return false; } };

export const schoonSid = s => /^[a-z0-9]{8,40}$/.test(String(s || '')) ? String(s) : '';
// vaste helft per bezoeker: dezelfde sid geeft altijd dezelfde tekst
export const armVoor = sid => { const s = schoonSid(sid); if (!s) return null; return parseInt(createHash('sha256').update('adv1:' + s).digest('hex').slice(0, 2), 16) % 2 ? 'b' : 'a'; };

// de winnaar of de stand, puur (te testen zonder kv)
export function beslis(stand) {
  const a = stand.a || {}, b = stand.b || {}, N = x => Number(x) || 0;
  if (N(a.getoond) < DREMPEL || N(b.getoond) < DREMPEL) return { klaar: false };
  const ra = N(a.adres) / N(a.getoond), rb = N(b.adres) / N(b.getoond), tot = N(a.adres) + N(b.adres);
  const cijfers = 'tekst a: ' + N(a.adres) + ' adressen op ' + N(a.getoond) + ' keer getoond; tekst b: ' + N(b.adres) + ' adressen op ' + N(b.getoond) + ' keer getoond';
  if (tot < MIN_ADRES) return { klaar: true, winnaar: null, reden: 'te weinig adressen om te kiezen (' + tot + ' samen, minimaal ' + MIN_ADRES + '); de huidige tekst (a) blijft staan. ' + cijfers };
  if (ra === rb) return { klaar: true, winnaar: null, reden: 'gelijke stand; de huidige tekst (a) blijft staan. ' + cijfers };
  return { klaar: true, winnaar: rb > ra ? 'b' : 'a', reden: 'meeste adressen per keer getoond. ' + cijfers };
}

const lijst = r => { if (Array.isArray(r)) { const o = {}; for (let i = 0; i + 1 < r.length; i += 2) o[r[i]] = Number(r[i + 1]) || 0; return o; } const o = {}; for (const k of Object.keys(r || {})) o[k] = Number(r[k]) || 0; return o; };
export async function standLees() {
  const out = { a: {}, b: {} };
  for (const arm of ['a', 'b']) { try { out[arm] = lijst(await kv.raw(['HGETALL', 'adv:proef:' + arm])); } catch (e) { out[arm] = {}; } }
  return out;
}
export async function uitslagLees() { try { return await kv.get(UITSLAG); } catch (e) { return null; } }

// Het antwoord van de server bewaren voor de adviesmail (aangeroepen vanuit fn/keuze-tools.js direct na kzChat). Schakelaar uit = geen schrijfactie; een fout of
// time-out hier verandert niets aan het chatantwoord (alles in try/catch, hooguit 400 ms wachten).
export const ANT_TTL = 6 * 3600;
export const antSleutel = (sid, slug) => 'adv:ant:' + hash(sid) + ':' + slug;
export async function adviesBewaar(sid, slug, rc) {
  try {
    if (!rc || !rc.ok || rc.weet === false || !rc.a || rc.geblokt || rc.test) return false;
    slug = String(slug || ''); if (!schoonSid(sid) || !/^[a-z0-9-]{1,130}$/.test(slug)) return false;
    const werk = async () => {
      const t = await tekstVoor(sid); if (!t || t.arm !== 'b') return false;
      const p = (Array.isArray(rc.producten) ? rc.producten : []).map(x => schoon(x && (x.naam || x.n), 70)).filter(Boolean).slice(0, 6);
      await kv.set(antSleutel(sid, slug), { a: schoon(rc.a, 700), p }, { ex: ANT_TTL }); return true;
    };
    return await Promise.race([werk(), new Promise(r => setTimeout(() => r(false), 400))]);
  } catch (e) { return false; }
}

// welke tekst deze bezoeker krijgt; null = de oude tekst (schakelaar uit, geen sid, geen verbinding)
export async function tekstVoor(sid) {
  try {
    if (!(await adviesAan())) return null;
    const eigen = armVoor(sid); if (!eigen) return null;
    const u = await uitslagLees();
    if (u) return { arm: u.winnaar === 'b' ? 'b' : 'a', klaar: true };
    return { arm: eigen, klaar: false };
  } catch (e) { return null; }
}

// tellen: één keer per bezoeker per soort; alleen zolang de proef loopt
export async function tel(site, sid, kind) {
  try {
    if (!['getoond', 'getikt', 'adres'].includes(kind) || !UPDATE_SITES[site]) return { ok: false };
    const t = await tekstVoor(sid); if (!t || t.klaar) return { ok: true, geteld: false };
    const eerste = await kv.raw(['SET', 'adv:u:' + hash(sid) + ':' + kind, '1', 'NX', 'EX', String(30 * 86400)]);
    if (!eerste) return { ok: true, geteld: false };
    await kv.raw(['HINCRBY', 'adv:proef:' + t.arm, kind, '1']); await kv.raw(['HINCRBY', 'adv:proef:' + t.arm, site + ':' + kind, '1']);
    await kv.raw(['EXPIRE', 'adv:proef:' + t.arm, String(120 * 86400)]);
    if (kind === 'getoond' || kind === 'adres') await controleer();
    return { ok: true, geteld: true };
  } catch (e) { return { ok: false }; }
}
// na elke telling: staan beide teksten op de drempel, dan één keer de uitslag vastleggen
export async function controleer() {
  if (await uitslagLees()) return null;
  const s = await standLees(), d = beslis(s); if (!d.klaar) return null;
  const vast = await kv.raw(['SET', UITSLAG + ':slot', '1', 'NX', 'EX', '60']); if (!vast) return null;
  const u = { winnaar: d.winnaar, reden: d.reden, at: new Date().toISOString(), a: s.a, b: s.b };
  await kv.set(UITSLAG, u); return u;
}

// ---------------------------------------------------------------------------------------------------------------
// de mail
const NAAM = { kz: 'Keuzehulp', us: 'Which To Buy', de: 'Kaufberater' };
export const MAIL = {
  nl: { onderwerp: t => 'Je advies: ' + t, kop: 'Het advies uit de chat', aan: t => 'Dit is het advies uit de chat op Keuzehulp over ' + t + '.', prods: 'Producten uit dit advies', open: 'Open de keuzehulp', prijzen: 'Daar staan de prijzen van vandaag.', volgT: t => 'Wil je ' + t + ' volgen? Dan staat het elke ochtend in je mail.', volgK: t => 'Volg ' + t, volgB: 'Je krijgt dan eerst een mail om je adres te bevestigen.', eenmalig: h => 'Je kreeg deze mail één keer, omdat je erom vroeg op ' + h + '. Meer mail komt er alleen als je zelf kiest te volgen.', bereik: 'Vragen? App Henkjan op +31 6 55395630.' },
  en: { onderwerp: t => 'Your advice: ' + t, kop: 'The advice from the chat', aan: t => 'This is the advice from the chat on Which To Buy about ' + t + '.', prods: 'Products in this advice', open: 'Open the buying guide', prijzen: 'It shows today’s prices.', volgT: t => 'Want to follow ' + t + '? Then it arrives in your email every morning.', volgK: t => 'Follow ' + t, volgB: 'You will first get an email to confirm your address.', eenmalig: h => 'You got this email once, because you asked for it on ' + h + '. You only get more email if you choose to follow.', bereik: 'Questions? Message Henkjan on +31 6 55395630.' },
  de: { onderwerp: t => 'Dein Rat: ' + t, kop: 'Der Rat aus dem Chat', aan: t => 'Das ist der Rat aus dem Chat bei Kaufberater zu ' + t + '.', prods: 'Produkte in diesem Rat', open: 'Kaufberater öffnen', prijzen: 'Dort stehen die heutigen Preise.', volgT: t => 'Möchtest du ' + t + ' folgen? Dann steht es jeden Morgen in deiner Mail.', volgK: t => t + ' folgen', volgB: 'Du bekommst zuerst eine Mail, um deine Adresse zu bestätigen.', eenmalig: h => 'Du hast diese Mail einmal bekommen, weil du sie auf ' + h + ' angefordert hast. Weitere Mails gibt es nur, wenn du selbst folgen willst.', bereik: 'Fragen? Schreib Henkjan per WhatsApp: +31 6 55395630.' },
};

// Tekst van de bezoeker schoonmaken: geen opmaak, geen links, geen adressen, geen gedachtestreepjes, ingekort op een zinseinde.
export function schoon(t, max = 700) {
  let s = String(t == null ? '' : t).replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+/gi, ' ').replace(/\s[–—]\s/g, ', ').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  if (s.length > max) { const k = s.slice(0, max), p = Math.max(k.lastIndexOf('. '), k.lastIndexOf('! '), k.lastIndexOf('? ')); s = p > max * .5 ? k.slice(0, p + 1) : k.replace(/\s+\S*$/, '') + '…'; }
  return s;
}
// Producten in de mail: eerst de namen die de server zelf bewaarde (alleen als het antwoord ze noemt), daarna namen uit de browser, maar die tellen alleen voor de langste
// reeks beginwoorden die allemaal in het antwoord staan (minstens 2 woorden, of de hele naam als die uit één woord bestaat); de rest van de naam vervalt.
// Zo staat er geen woord in de mail dat de server niet zelf zei. Hoogstens 3.
export function kortBij(naam, antwoord) {
  const a = String(antwoord || '').toLowerCase(), w = schoon(naam, 70).split(' ').filter(Boolean); let k = 0;
  while (k < w.length && a.indexOf(w[k].toLowerCase()) >= 0) k++;
  return (k >= 2 || (w.length === 1 && k === 1)) ? w.slice(0, k).join(' ') : '';
}
export function schoneProducten(serverNamen, clientNamen, antwoord) {
  const uit = [], erbij = n => { if (n && n.length >= 3 && !uit.some(x => x.toLowerCase() === n.toLowerCase() || x.toLowerCase().startsWith(n.toLowerCase() + ' '))) uit.push(n); };
  for (const n of Array.isArray(serverNamen) ? serverNamen.slice(0, 6) : []) { erbij(kortBij(n, antwoord)); if (uit.length >= 3) break; }
  for (const n of Array.isArray(clientNamen) ? clientNamen.slice(0, 6) : []) { if (uit.length >= 3) break; erbij(kortBij(n, antwoord)); }
  return uit.slice(0, 3);
}
export const keuzehulpUrl = (site, slug) => base(site) + '/' + slug + '?utm_source=email&utm_medium=owned&utm_campaign=adviesmail';

// d: { site: kz|us|de, term, slug, antwoord, producten[] (van de server), clientProducten[] (uit de browser, ingekort), volgUrl }  ->  { subject, html, text }
// De antwoordtekst en de productnamen komen als platte tekst binnen en gaan door esc(): de server stuurt nooit html van de browser door.
export function adviesMailBouw(d) {
  const S = UPDATE_SITES[d.site], L = MAIL[S.lang], term = schoon(d.term, 60), ant = schoon(d.antwoord, 700), pr = schoneProducten(d.producten, d.clientProducten, ant);
  const url = keuzehulpUrl(d.site, d.slug), subject = L.onderwerp(term);
  const html = page(d.site, L.kop,
    '<p>' + esc(L.aan(term)) + '</p><div class="k"><p style="margin:0">' + esc(ant) + '</p></div>'
    + (pr.length ? '<h2>' + esc(L.prods) + '</h2><ul>' + pr.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '')
    + '<p><a class="button" href="' + esc(url) + '">' + esc(L.open) + '</a></p><p class="m">' + esc(L.prijzen) + '</p>'
    + (d.volgUrl ? '<p class="m" style="margin-top:28px">' + esc(L.volgT(term)) + ' <a href="' + esc(d.volgUrl) + '">' + esc(L.volgK(term)) + '</a>. ' + esc(L.volgB) + '</p>' : '')
    + '<p class="m">' + esc(L.eenmalig(S.host)) + '<br>' + esc(L.bereik) + '<br>' + esc(NAAM[d.site]) + ' · AdsFair B.V.</p>');
  const text = [L.aan(term), '', ant, ''].concat(pr.length ? [L.prods + ':'].concat(pr.map(x => '- ' + x), ['']) : [], [L.open + ': ' + url, L.prijzen, ''],
    d.volgUrl ? [L.volgT(term) + ' ' + L.volgK(term) + ': ' + d.volgUrl, L.volgB, ''] : [], [L.eenmalig(S.host), L.bereik, NAAM[d.site] + ' · AdsFair B.V.']).join('\n');
  return { subject, html, text };
}

// Remmen: per adres 3 per dag en 10 minuten tussen twee mails, per IP 5 per uur, wereldwijd 500 per dag. Een rem geeft geen foutmelding terug
// (de pagina meldt gelukt): zo vult niemand andermans inbox en lekt er niet uit welk adres al kreeg.
export async function rem(email, ip) {
  const dag = new Date().toISOString().slice(0, 10), uur = Math.floor(Date.now() / 3600000);
  const w = await kv.incr('adv:rem:w:' + dag); if (w === 1) await kv.raw(['EXPIRE', 'adv:rem:w:' + dag, '172800']); if (w > REM.wereldDag) return 'wereld';
  const i = await kv.incr('adv:rem:ip:' + hash(ip) + ':' + uur); if (i === 1) await kv.raw(['EXPIRE', 'adv:rem:ip:' + hash(ip) + ':' + uur, '7200']); if (i > REM.ipUur) return 'ip';
  const pauze = await kv.raw(['SET', 'adv:rem:p:' + hash(email), '1', 'NX', 'EX', String(REM.adresPauze)]); if (!pauze) return 'adres';
  const e = await kv.incr('adv:rem:e:' + hash(email) + ':' + dag); if (e === 1) await kv.raw(['EXPIRE', 'adv:rem:e:' + hash(email) + ':' + dag, '172800']); if (e > REM.adresDag) return 'adres';
  return null;
}

// Verzenden. b: { sid, slug, p[] (namen uit de browser), email, website }. Het antwoord komt van de server (adviesBewaar), nooit uit b.
// Geeft { ok, verstuurd } terug; ok:true ook als een rem greep (zie rem()). Mislukt het verzenden, dan komt de pauze van dat adres vrij en gaat de fout door.
export async function adviesVerstuur(site, b, ip, zend = mail) {
  const email = String(b.email || '').trim().toLowerCase();
  if (b.website || !/^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/.test(email) || email.length > 254) return { ok: false, fout: 'email' };
  const t = await tekstVoor(b.sid); if (!t || t.arm !== 'b') return { ok: false, fout: 'uit' };
  const slug = String(b.slug || ''); if (!/^[a-z0-9-]{1,130}$/.test(slug)) return { ok: false, fout: 'slug' };
  const it = (await catalog(site)).find(x => x.slug === slug); if (!it) return { ok: false, fout: 'slug' };
  const bew = await kv.get(antSleutel(b.sid, slug)); const ant = bew && bew.a ? schoon(bew.a, 700) : ''; if (ant.length < 20) return { ok: false, fout: 'antwoord' };
  const gr = await rem(email, ip); if (gr) return { ok: true, verstuurd: false, rem: gr };
  const vt = random(); await kv.set('updates:advvolg:' + hash(vt), { email, site, slug }, { ex: 14 * 86400 });
  const m = adviesMailBouw({ site, term: it.term || it.title || it.h1 || slug, slug, antwoord: ant, producten: bew.p, clientProducten: Array.isArray(b.p) ? b.p : [], volgUrl: base(site) + '/api/keuze-updates?op=advvolg&t=' + vt });
  try { await zend({ to: [email], subject: m.subject, html: m.html, text: m.text }, 'advies-' + hash(email + '|' + slug + '|' + new Date().toISOString().slice(0, 10) + '|' + hash(ant))); }
  catch (e) { try { await kv.del(['adv:rem:p:' + hash(email)]); } catch (x) { /* de fout zelf gaat door */ } throw e; }
  await tel(site, b.sid, 'adres'); try { await kv.incr('adv:verstuurd:' + new Date().toISOString().slice(0, 10)); } catch (e) { /* telling is bijzaak */ }
  return { ok: true, verstuurd: true };
}

// ---------------------------------------------------------------------------------------------------------------
// stand en voorbeeld
export async function standTekst() {
  const aan = await adviesAan(), s = await standLees(), u = await uitslagLees(), dag = new Date().toISOString().slice(0, 10);
  let mails = 0; try { mails = Number(await kv.get('adv:verstuurd:' + dag)) || 0; } catch (e) { /* geen verbinding */ }
  const N = x => Number(x) || 0, pct = (x, y) => y ? (100 * x / y).toFixed(1).replace('.', ',') + '%' : '-';
  const regel = (n, x) => n + ': getoond ' + N(x.getoond) + ', getikt ' + N(x.getikt) + ' (' + pct(N(x.getikt), N(x.getoond)) + '), adres ' + N(x.adres) + ' (' + pct(N(x.adres), N(x.getoond)) + ' van getoond)';
  const perSite = Object.keys(UPDATE_SITES).map(k => '  ' + k + ': a ' + N(s.a[k + ':getoond']) + ' getoond, ' + N(s.a[k + ':adres']) + ' adres; b ' + N(s.b[k + ':getoond']) + ' getoond, ' + N(s.b[k + ':adres']) + ' adres');
  const uit = u ? (u.winnaar ? 'WINNAAR: tekst ' + u.winnaar + ' (' + (u.winnaar === 'b' ? 'Stuur mij dit advies per mail' : 'Volg {term} in je ochtendmail') + '), staat nu voor iedereen. ' + u.reden : 'GEEN WINNAAR: ' + u.reden) + ' (' + u.at + ')' : 'Proef loopt; de winnaar staat vast zodra beide teksten ' + DREMPEL + ' keer getoond zijn (minimaal ' + MIN_ADRES + ' adressen samen).';
  return { aan, tekst: ['ADVIES PER MAIL, proef op de volgknop', 'Schakelaar (kv ' + SCHAKELAAR + '): ' + (aan ? 'AAN' : 'UIT, bezoekers zien alleen de oude tekst en er gaat geen adviesmail uit'), uit, '',
    regel('Tekst a, Volg {term} in je ochtendmail', s.a), regel('Tekst b, Stuur mij dit advies per mail', s.b), 'Per site:'].concat(perSite, ['', 'Adviesmails verstuurd vandaag: ' + mails + ' (rem: ' + REM.adresDag + ' per adres per dag, ' + REM.ipUur + ' per IP per uur, ' + REM.wereldDag + ' per dag samen)',
    'Aan of uit zonder build: https://hjdk-api-henq.vercel.app/api/keuze-updates?op=adviesschakel&zet=1 (of &zet=0; op de beschermde vercel.app-host of met de teamsleutel); &reset=1 wist tellers en uitslag.']).join('\n'), json: { aan, stand: s, uitslag: u, mailsVandaag: mails } };
}

export const VOORBEELD = {
  nl: { site: 'kz', slug: 'airfryer', term: 'airfryer', antwoord: 'Voor 1 of 2 personen is 3 tot 4 liter genoeg. Een grotere mand kan ook, maar neemt meer ruimte op het aanrecht in en warmt langer op. Wil je het compact en goedkoop houden, kies dan de Airfryer Tristar FR‑9014. Wil je meer, dan is de Tefal Easy Fry Compact EY1458 onze keuze.', producten: ['Airfryer Tristar FR‑9014', 'Tefal Easy Fry Compact EY1458'] },
  us: { site: 'us', slug: 'best-portable-power-stations-for-home-backup-2026', term: 'portable power station', antwoord: 'For camping, a CPAP or a short outage, about 1 kWh with 1,500 to 2,000 W is enough: Anker SOLIX C1000 Gen 2 (1,024 Wh, 2,000 W), EcoFlow DELTA 3 Plus (1,024 Wh, 1,800 W) or Jackery Explorer 1000 v2 (1,070 Wh, 1,500 W).', producten: ['Anker SOLIX C1000 Gen 2', 'EcoFlow DELTA 3 Plus', 'Jackery Explorer 1000 v2'] },
  de: { site: 'de', slug: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', term: 'balkonkraftwerk mit speicher', antwoord: 'Hast du schon ein Balkonkraftwerk mit Wechselrichter, ist ein AC-Speicher an der Steckdose am einfachsten, etwa EcoFlow STREAM AC Pro (1,92 kWh), Marstek Venus E 3.0 (5,12 kWh) oder Jackery SolarVault 3 Pro Max AC (2,52 kWh).', producten: ['EcoFlow STREAM AC Pro', 'Marstek Venus E 3.0', 'Jackery SolarVault 3 Pro Max AC'] },
};
// De voorbeeldpagina voor Henkjan: dezelfde bouwfunctie als de echte mail, dus het voorbeeld kan nooit afwijken.
export async function voorbeeldHtml() {
  let van = 'Keuzehulp <deals@lastingchange.works>'; try { van = await sender(); } catch (e) { /* standaard */ }
  const delen = Object.keys(VOORBEELD).map(k => {
    const v = VOORBEELD[k], m = adviesMailBouw({ ...v, volgUrl: base(v.site) + '/api/keuze-updates?op=advvolg&t=' + '0'.repeat(48) }), taal = { nl: 'Nederlands (keuzehulp.best)', us: 'Engels (whichtobuy.best)', de: 'Duits (kaufberater.best)' }[k];
    return '<section><h2>' + esc(taal) + '</h2><table><tr><th>Onderwerp</th><td>' + esc(m.subject) + '</td></tr><tr><th>Van</th><td>' + esc(van) + '</td></tr><tr><th>Aan</th><td>het adres dat de bezoeker invulde</td></tr></table>'
      + '<iframe sandbox title="' + esc(taal) + '" srcdoc="' + esc(m.html) + '"></iframe><details><summary>Dezelfde mail als platte tekst</summary><pre>' + esc(m.text) + '</pre></details></section>';
  }).join('');
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Voorbeeld advies per mail</title><style>body{margin:0;background:#fff;color:#111113;font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif}main{max-width:720px;margin:0 auto;padding:24px 20px 64px}h1{font-size:32px;line-height:1.15;margin:0 0 8px}h2{font-size:22px;margin:40px 0 12px}table{border-collapse:collapse;width:100%;margin:0 0 12px}th,td{text-align:left;vertical-align:top;padding:8px 12px 8px 0;border-bottom:1px solid #D7DCE8}th{width:110px;font-size:13px}iframe{width:100%;height:560px;border:1px solid #D7DCE8;border-radius:16px}pre{white-space:pre-wrap;font:inherit}.k{font-size:13px}</style></head><body><main><h1>Voorbeeld: advies per mail</h1>'
    + '<p class="k">Zo gaat de mail de deur uit als iemand onder het chatantwoord kiest voor Stuur mij dit advies per mail. Dit scherm gebruikt dezelfde functie als de echte mail. Het antwoord is hier een voorbeeld met tekst en producten van de keuzehulp zelf (NL keuzehulp.best/airfryer, EN whichtobuy.best/best-portable-power-stations-for-home-backup-2026, DE kaufberater.best/balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek); in de echte mail staat het antwoord dat de chat die bezoeker gaf. De mail staat UIT tot Henkjan ja zegt: de schakelaar staat nu ' + ((await adviesAan()) ? 'AAN' : 'UIT') + '. De mail bevat geen affiliate-links en geen winkellinks: de enige links gaan naar de keuzehulp zelf en naar het volgen van het onderwerp (dat via een bevestigingsmail loopt).</p>' + delen + '</main></body></html>';
}

// Volgen vanuit de adviesmail: GET toont de knop (scanners doen niets), POST start de gewone dubbele opt-in met hetzelfde adres.
export async function advVolgLees(t) { if (!/^[a-f0-9]{48}$/.test(t || '')) return null; try { return await kv.get('updates:advvolg:' + hash(t)); } catch (e) { return null; } }
