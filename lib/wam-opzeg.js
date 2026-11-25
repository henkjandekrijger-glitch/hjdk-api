// Opzeghulp met check (Henkjan 25 nov 2026: "zorg dat die opzeghulp werkt haal Adsfair er tussen uit laat ze zelf mailen . We moeten wel hun adres
// hebben om te kunnen vragen of gelukt is of toch zien wat postcodeloterij doet . Los dit slim op ."). De bezoeker zegt zelf op (online bij de loterij,
// per brief die hij zelf verstuurt of mailt, of telefonisch); WAM zegt niets namens hem op en ziet geen inloggegevens. Met zijn e-mailadres vraagt
// Mailmind (stroom wam-opzeg) na 7 dagen één keer of het gelukt is: ja / nee / nog niets. De antwoorden per bedrijf (wmn:oz:tel) laten zien wat het
// bedrijf met opzeggingen doet; vanaf 10 antwoorden staan ze op de pagina. Nee gaat naar /start, zodat het geval meetelt in een dossier.
import { createHash, randomBytes } from 'node:crypto';
import { kv } from './db.js';
import * as M from './mailmind.js';

const BASIS = 'https://wearemany.now', S = 'wam-opzeg', DAGEN = 7;
export const LIVE = true; // Henkjan 25 nov 2026 20:07 UTC: "We moeten wel hun adres hebben om te kunnen vragen of gelukt is"
export const OPZEG = {
  postcodeloterij: { naam: 'Postcode Loterij', pad: '/bedrijven/postcodeloterij', online: 'https://mijn.postcodeloterij.nl/loten#abonnementwijzigen', onlineNaam: 'Mijn Postcode Loterij', tel: '088 020 1050', telHref: 'tel:+31880201050', adres: 'Nationale Postcode Loterij N.V.\nt.a.v. Ledenservice\nBeethovenstraat 200\n1077 JZ Amsterdam', adresBron: 'https://www.postcodeloterij.nl/opzeggen/schriftelijk' },
  vriendenloterij: { naam: 'VriendenLoterij', pad: '/vriendenloterij-opzeggen', online: 'https://www.mijnvriendenloterij.nl/', onlineNaam: 'Mijn VriendenLoterij', tel: '088 020 10 20', telHref: 'tel:+31880201020', adres: 'VriendenLoterij\nt.a.v. Ledenservice\nBeethovenstraat 200\n1077 JZ Amsterdam', adresBron: 'https://a.storyblok.com/f/291263997880938/722e8c4bfd/deelnemersreglement-versie-66.pdf' },
};
export const TOESTEMMING = 'Eén mail na 7 dagen met de vraag of de opzegging gelukt is; daarna geen mail meer. Afmelden kan altijd.';
const MAILRE = /^[^\s@]{1,64}@[^\s@]{1,189}\.[a-z]{2,24}$/i;
const h = s => createHash('sha256').update(String(s)).digest('hex');

// Start (op=dopzeg): met adres in de wachtrij voor de check; zonder adres alleen geteld.
export async function opzegStart(b) {
  const id = String(b && b.bedrijf || ''), z = OPZEG[id]; if (!z) return { ok: false, fout: 'onbekend bedrijf' };
  const route = ['online', 'brief', 'bellen', 'direct'].includes(b.route) ? b.route : 'online';
  const email = String(b.email || '').trim().toLowerCase();
  if (!email) { await kv.raw(['HINCRBY', 'wmn:oz:tel', id + '|zonder', 1]).catch(() => {}); return { ok: true, zonder: true }; }
  if (!MAILRE.test(email) || b.website) return { ok: false, fout: 'Vul een geldig e-mailadres in.' };
  if (await M.geblokkeerd(email)) return { ok: true, al: true };
  const sl = 'wmn:oz:e:' + h(email + '|' + id).slice(0, 24);
  if ((await kv.raw(['SET', sl, '1', 'NX', 'EX', String(60 * 86400)]).catch(() => null)) !== 'OK') return { ok: true, al: true };
  const rid = randomBytes(12).toString('hex'), nu = Date.now();
  await kv.set('wmn:oz:r:' + rid, { m: email, bedrijf: id, route, t: nu, toestemming: TOESTEMMING }, { ex: 60 * 86400 });
  await kv.raw(['ZADD', 'wmn:oz:wacht', String(nu + DAGEN * 86400000), rid]);
  await kv.raw(['HINCRBY', 'wmn:oz:tel', id + '|start', 1]).catch(() => {});
  return { ok: true, nieuw: true };
}

// vooraf (elke uurronde van Mailmind): wie 7 dagen geleden begon, gaat in de bak.
export async function vullen(nu = Date.now()) {
  const ids = (await kv.raw(['ZRANGEBYSCORE', 'wmn:oz:wacht', '0', String(nu), 'LIMIT', '0', '200']).catch(() => [])) || [], lijst = [];
  for (const rid of ids) { const r = await kv.get('wmn:oz:r:' + rid).catch(() => null); await kv.raw(['ZREM', 'wmn:oz:wacht', rid]).catch(() => {}); if (r && r.m) lijst.push({ m: r.m, id: rid, bedrijf: r.bedrijf, route: r.route }); }
  return lijst.length ? M.vul(S, lijst) : { erbij: 0 };
}

export const VARIANTEN = [
  { o: 'Is je opzegging bij de {naam} gelukt?', t: 'Hoi,\n\nVorige week begon je op we are many now met het opzeggen van de {naam}. Is het gelukt? Eén klik is genoeg:\n\nJa, ik heb een bevestiging:\n{gelukt}\n\nNee, het lukte niet of er gaat nog geld af:\n{niet}\n\nIk heb nog niets gehoord:\n{wacht}\n\nZo zien we wat de {naam} met opzeggingen doet. Lukte het niet, dan telt jouw geval mee en helpen we je verder.\n\nVraag of opmerking? Antwoord gewoon op deze mail. Je krijgt antwoord.\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' },
  { o: 'Gelukt met de {naam}?', t: 'Hoi,\n\nKorte vraag over je opzegging bij de {naam}: heb je een bevestiging gekregen?\n\nJa: {gelukt}\nNee: {niet}\nNog niets gehoord: {wacht}\n\nMet jouw antwoord zien anderen hoe opzeggen bij de {naam} echt gaat.\n\nVraag of opmerking? Antwoord gewoon op deze mail. Je krijgt antwoord.\n\nHenkjan de Krijger\nwe are many now\n\nGeen mail meer: {stop}' },
];
export function mailTekst(a, { v, tok }) {
  const z = OPZEG[a.bedrijf] || OPZEG.postcodeloterij, L = w => BASIS + '/v/' + tok + '/' + w;
  const vul = s => String(s).split('{naam}').join(z.naam).split('{gelukt}').join(L('g')).split('{niet}').join(L('n')).split('{wacht}').join(L('w')).split('{stop}').join(L('x'));
  return { onderwerp: vul(v.o), tekst: vul(v.t), stop: L('x') };
}
export function kennis(a) {
  const z = OPZEG[a.bedrijf] || OPZEG.postcodeloterij;
  return ['OPZEGGEN ' + z.naam + ' (' + BASIS + z.pad + ')', 'Online: ' + z.onlineNaam + ' ' + z.online + '. Zelf inloggen, lotnummers kiezen, bevestiging bewaren. Zelf opzeggen is gratis.', 'Telefonisch: ' + z.tel + '.', 'Per brief: ' + z.adres.replace(/\n/g, ', ') + ' (controleer het adres op ' + z.adresBron + ').', 'Blijft er geld afgaan na een bevestigde opzegging: vergelijk lotnummer en periode met de bevestiging en vraag de Ledenservice om uitleg; een incasso kun je tot 8 weken na afschrijving bij je bank terugboeken.', 'Probleem melden zodat het meetelt: ' + BASIS + '/start?b=' + encodeURIComponent(z.naam) + '.', 'we are many now zegt niets namens iemand op, vraagt geen inloggegevens en geeft geen juridisch advies. Henkjan de Krijger leest alle replies.'].join('\n');
}

export const STROOM = {
  id: S, LIVE, kanaal: 'gmail', fromName: 'Henkjan de Krijger', wie: 'wam', taal: 'nl', soort: 'klant',
  doel: 'Wie opzegde via de opzeghulp zegt of het gelukt is (ja, nee of nog niets)', std: { perDag: 80, max: 150, perUur: 10 }, uren: [9, 21],
  varianten: VARIANTEN, mail: (a, o) => mailTekst(a, o), vooraf: () => vullen(),
  bak: a => (OPZEG[a.bedrijf] ? a.bedrijf : 'x') + '|' + String(a.route || 'x').slice(0, 8) + '|' + M.soortAdres(a.m),
  voorkennis: () => [3, 4], antwoord: true, kennis: a => kennis(a), async bijJa() { return {}; }
};

// klik in de mail: g = gelukt, n = niet, w = nog niets, x = afmelden. Eén antwoord per mail telt.
export async function klik(a, w, mens, methode = 'GET') {
  const z = OPZEG[a.bedrijf] || OPZEG.postcodeloterij;
  if (w === 'x') { await M.zegStop(S, a, STROOM).catch(() => {}); return methode === 'POST' ? null : BASIS + z.pad + '?afgemeld=1'; }
  if (mens && ['g', 'n', 'w'].includes(w) && (await kv.raw(['SET', 'wmn:oz:antw:' + a.tok, w, 'NX', 'EX', String(400 * 86400)]).catch(() => null)) === 'OK') {
    await kv.raw(['HINCRBY', 'wmn:oz:tel', a.bedrijf + '|' + ({ g: 'gelukt', n: 'niet', w: 'wacht' })[w], 1]).catch(() => {});
    await M.zegJa(S, a, ({ g: 'gelukt', n: 'niet', w: 'wacht' })[w], STROOM).catch(() => {});
  }
  if (w === 'n') return BASIS + '/start?b=' + encodeURIComponent(z.naam) + '&d=mail';
  return BASIS + z.pad + '?d=mail&oz=' + w + '#opzeggen';
}

export async function stand(id) {
  const t = Object.fromEntries(((await kv.raw(['HGETALL', 'wmn:oz:tel']).catch(() => [])) || []).reduce((o, x, i, l) => (i % 2 ? o : o.concat([[x, Number(l[i + 1]) || 0]])), []));
  const g = id ? k => t[id + '|' + k] || 0 : null;
  return id ? { start: g('start'), zonder: g('zonder'), gelukt: g('gelukt'), niet: g('niet'), wacht: g('wacht') } : t;
}

const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Blok bovenaan de opzegpagina; uitslag (antwoorden van lezers) pas vanaf 10 antwoorden, geen nullen.
export function uitslagHtml(z, st) {
  const n = st.gelukt + st.niet + st.wacht, pct = x => Math.round(100 * x / n);
  return n >= 10 ? '<p class="opzeg-uitslag"><b>Wat lezers terugmeldden:</b> van ' + n + ' mensen die via deze pagina opzegden, had ' + pct(st.gelukt) + '% na een week een bevestiging, lukte het bij ' + pct(st.niet) + '% niet en hoorde ' + pct(st.wacht) + '% nog niets.</p>' : '';
}
export function opzegBlok(id, st = null) {
  const z = OPZEG[id]; if (!z) return '';
  const uitslag = st ? uitslagHtml(z, st) : '<!--oz-uitslag-->';
  const brief = 'Betreft: opzegging deelname\n\nGeachte heer, mevrouw,\n\nHierbij zeg ik mijn deelname aan de ' + z.naam + ' op, voor alle loten op mijn naam [of: voor lotnummer(s) ...]. Ik vraag u ook de incassomachtiging te beëindigen en mij de opzegging schriftelijk te bevestigen, met de lotnummers en de einddatum.\n\nNaam: [naam]\nAdres: [straat en huisnummer]\nPostcode en plaats: [postcode en plaats]\nIBAN waarvan wordt afgeschreven: [IBAN]\n\nMet vriendelijke groet,\n[naam en handtekening]\n[datum]';
  return '<div class="opzeg" id="opzeghulp" data-opzeg="' + id + '"><p><b>Zeg zelf op, wij checken of het lukt.</b></p><p>Laat je e-mailadres achter. Over een week vragen we één keer: is het gelukt? Zo zien we wat de ' + e(z.naam) + ' met opzeggingen doet.</p>'
    + '<form class="opzeg-form" novalidate><label class="sr-only" for="opzeg-email">Je e-mailadres</label><div class="composer"><input id="opzeg-email" type="email" autocomplete="email" inputmode="email" required maxlength="254" placeholder="Je e-mailadres"><button type="submit" class="primary">Start opzeggen</button></div><label class="trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><p class="consent-note">' + e(TOESTEMMING) + ' We zeggen niets namens je op en vragen nooit om je inloggegevens. <a href="/privacy#updates">Privacy</a>.</p><p class="msg" role="status"></p></form>'
    + '<p class="meta"><a href="' + e(z.online) + '" target="_blank" rel="noopener noreferrer" data-opzeg-direct>Liever zonder check: direct naar ' + e(z.onlineNaam) + '</a></p>'
    + '<div class="opzeg-na" hidden><ol class="opzeg-stappen"><li><b>Online, het snelst.</b> <a class="btn primary" href="' + e(z.online) + '" target="_blank" rel="noopener noreferrer" data-opzeg-route="online">Open ' + e(z.onlineNaam) + ' <span aria-hidden="true">→</span></a><br>Log zelf in, kies de lotnummers die stoppen en bewaar de bevestiging.</li>'
    + '<li><b>Of per brief of mail die je zelf stuurt.</b> Vul de stukken tussen haken in.<pre class="opzeg-brief">' + e(z.adres) + '\n\n' + e(brief) + '</pre><div class="acts"><button type="button" data-opzeg-kopie>Kopieer de brief</button><a class="btn" data-opzeg-route="brief" href="mailto:?subject=' + encodeURIComponent('Opzegging deelname ' + z.naam) + '&body=' + encodeURIComponent(brief) + '">Zet hem in je mail</a></div><p class="meta">Controleer het adres in <a href="' + e(z.adresBron) + '" target="_blank" rel="noopener noreferrer">de officiële uitleg</a> voor je verstuurt. Een brief met je handtekening is het sterkste bewijs.</p></li>'
    + '<li><b>Of bel.</b> <a href="' + z.telHref + '" data-opzeg-route="bellen">' + e(z.tel) + '</a>. Vraag een bevestiging per e-mail met lotnummers en einddatum.</li></ol></div>' + uitslag + '</div>';
}
export const OPZEG_CSS = '.opzeg{border:2px solid currentColor;border-radius:14px;padding:16px 18px;margin:16px 0 24px}.opzeg p{margin:0 0 10px}.opzeg-form .composer{align-items:stretch;flex-wrap:wrap}.opzeg-form .composer input{flex:1 1 100%;width:100%}.opzeg-form .composer button{flex:1 1 100%}.opzeg-stappen{padding-left:22px;margin:8px 0}.opzeg-stappen li{margin:0 0 18px}.opzeg-stappen .btn{margin:8px 0}.opzeg-brief{white-space:pre-wrap;font:inherit;font-size:16px;border-left:3px solid currentColor;padding:8px 0 8px 12px;margin:10px 0}.opzeg-uitslag{margin-top:14px}';
export const OPZEG_JS = String.raw`(function(){var W=window,D=document;D.querySelectorAll('[data-opzeg]').forEach(function(b){var id=b.dataset.opzeg,f=b.querySelector('.opzeg-form'),na=b.querySelector('.opzeg-na');
function uit(s){try{if(typeof W.mmUitkomst==='function')W.mmUitkomst(s)}catch(x){}}
function post(o){return fetch('/api/wam?op=dopzeg',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({bedrijf:id},o)),keepalive:true}).then(function(r){return r.json()})}
f.addEventListener('submit',async function(x){x.preventDefault();var i=f.querySelector('input[type=email]'),k=f.querySelector('button'),m=f.querySelector('[role=status]'),v=String(i.value||'').trim();if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)){m.textContent='Vul een geldig e-mailadres in.';i.focus();return}k.disabled=true;m.textContent='Even opslaan…';
try{var j=await post({email:v,website:(f.querySelector('[name=website]')||{}).value||''});if(!j.ok)throw Error(j.fout||'Opslaan lukt nu niet.');uit('actie');if(j.nieuw)uit('aanmelding');f.querySelector('.composer').hidden=true;f.querySelector('.consent-note').hidden=true;m.textContent='Gelukt. Over een week vragen we of het gelukt is. Kies hieronder hoe je opzegt.';na.hidden=false;var d=b.querySelector('[data-opzeg-direct]');if(d)d.parentNode.hidden=true;na.scrollIntoView({block:'start'})}catch(y){m.textContent=y.message;k.disabled=false}});
var d=b.querySelector('[data-opzeg-direct]');if(d)d.addEventListener('click',function(){uit('actie');post({route:'direct'}).catch(function(){})});
b.querySelectorAll('[data-opzeg-route]').forEach(function(a){a.addEventListener('click',function(){uit('actie')})});
var kp=b.querySelector('[data-opzeg-kopie]');if(kp)kp.addEventListener('click',function(){try{navigator.clipboard.writeText(b.querySelector('.opzeg-brief').textContent);kp.textContent='Gekopieerd'}catch(x){}});
})})();`;
