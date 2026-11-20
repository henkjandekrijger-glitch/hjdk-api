// Nieuwe bovenkant voor elke keuzehulp (keuzehulp.best, whichtobuy.best, kaufberater.best), lerend.
// Henkjan 15 nov 2026: "Maak UX lerend. Ik ga dan verkeer organiseren zodat je kunt leren ... Voer verbeterde UX overal door bij alle keuzehulpen"
// en "Vanaf nu gaan we dus bouwen aan de 100k intenties ." (prototype: https://claude.ai/artifact/U3EiB4kKBrq13uKpybP38R)
//
// Het blok (versie b van onderdeel 'top' in de Clickmind-proef kzuxnl, kzuxus of kzuxde, lib/proef.js):
// de 3 beste met de prijs van vandaag en de knop naar de winkel, de antwoorden van vraag 1 als pills (tik = advies voor die situatie),
// en een vraagbalk die antwoordt uit de FAQ van de pagina. Elke getypte vraag gaat naar het intentielog (lib/intentie.js).
// Versie a = de pagina zonder dit blok (zoals tot 15 nov). Zonder JavaScript (Google, AI-crawlers) staat het blok er altijd.
// Waarde per bezoeker = de sterkste stap: iets aangetikt 1, pill 2, vraag 4, klik naar de winkel 10.
// Stand: https://keuzehulp.best/api/mm/proefstand?site=kzuxnl&vorm=tekst (ook kzuxus, kzuxde).
import { adVraagJs } from './advraag.js';
import { MIJ_CSS, mijJs } from './geheugen.js';
import { tafelAan, tafelJs } from './tafel.js'; // live tafel met de AI als gastvrouw (20 nov 2026), alleen op lib/tafel.js PAGINAS // één chat die onthoudt (20 nov 2026)

export const RONDE = 3; // 19 nov: factor pillflow; // 17 nov: versie a is niet meer 'geen blok' maar de chat met pills zonder de 3 beste (Henkjan: lerende intentchat op IEDERE keuzehulp) // gelijk aan PROEVEN.kzux*.ronde in lib/proef.js
const ESC = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const T = {
  nl: { top: 'De 3 beste van vandaag', winkel: 'Bekijk bij', datum: 'Prijzen van vandaag', anders: 'Andere situatie? Tik wat bij jou past', vraag: 'Stel je vraag over', geen: 'Goede vraag. Die staat nu op onze lijst: het antwoord komt op deze pagina. Hieronder helpen de vragen je alvast kiezen.', zoek: 'Bekijk de prijzen', knop: 'Vraag', zoekKop: 'Prijzen van vandaag', een: 'Onze keuze van vandaag', denk: 'Even kijken…', bekijk: 'Bekijk:', meld: 'Elke dag een update hierover', volgKnop: 'Volg dit onderwerp', volgen: 'Volgen', volgt: 'Je volgt dit', terugKop: 'Welkom terug. Nog bezig met {wat}?', verder: 'Verder met {wat}', opB: 'Waar twijfel je over bij {term}?', opC: 'Vertel wat je zoekt, dan help ik je kiezen', nieuwSein: 'Wil je een seintje als die keuzehulp klaar is?', blijfVraag: 'Wil je dit bewaren en een seintje als er iets verandert aan {term}?', perMail: 'Per e-mail', perPush: 'Als melding', vraagVolg: 'Zal ik je elke ochtend laten weten wat er verandert aan {term}?', ja: 'Ja, volg', nee: 'Nee, dank je', mailVraag: 'Op welk e-mailadres wil je het?', mailPh: 'Je e-mailadres', mailKnop: 'Volg', check: 'Check je mail en klik op de knop. Daarna staat {term} elke ochtend in je mail.', volgOk: 'Gevolgd. Vanaf morgen staat {term} in je ochtendmail.', fout: 'Dat lukte niet. Probeer het nog eens.', chatKop: 'Vraag het de keuzehulp', tik: 'Tik een vraag of typ je eigen vraag. Antwoord door AI, alleen uit onze pagina\'s.', meer: 'Andere vragen', samen: 'Samen kiezen via WhatsApp', deel: 'Help je mee kiezen?' },
  us: { top: 'Today’s top 3', winkel: 'See on', datum: 'Prices checked today', anders: 'Different situation? Tap what fits you', vraag: 'Ask about', geen: 'Good question. It is on our list now and the answer will appear on this page. The questions below already help you choose.', zoek: 'See today’s prices', knop: 'Ask', zoekKop: 'Today’s prices on Amazon', een: 'Today’s pick', denk: 'Let me check…', bekijk: 'See:', meld: 'Daily update on this', volgKnop: 'Follow this topic', volgen: 'Follow', volgt: 'Following', terugKop: 'Welcome back. Still working on {wat}?', verder: 'Continue with {wat}', opB: 'What are you unsure about with {term}?', opC: 'Tell me what you need and I will help you choose', nieuwSein: 'Want a heads-up when that guide is ready?', blijfVraag: 'Want to keep this and get a heads-up when something changes for {term}?', perMail: 'By email', perPush: 'As a notification', vraagVolg: 'Shall I let you know every morning what changes for {term}?', ja: 'Yes, follow', nee: 'No thanks', mailVraag: 'Which email address should I use?', mailPh: 'Your email', mailKnop: 'Follow', check: 'Check your inbox and tap the button. Then {term} is in your email every morning.', volgOk: 'Following. From tomorrow {term} is in your morning email.', fout: 'That did not work. Please try again.', chatKop: 'Ask the guide', tik: 'Tap a question or type your own. Answers by AI, only from our pages.', meer: 'Other questions', samen: 'Decide together on WhatsApp', deel: 'Can you help me choose?' },
  de: { top: 'Die 3 besten heute', winkel: 'Ansehen bei', datum: 'Preise von heute', anders: 'Andere Situation? Tippe, was zu dir passt', vraag: 'Frag etwas zu', geen: 'Gute Frage. Sie steht jetzt auf unserer Liste, die Antwort kommt auf diese Seite. Die Fragen unten helfen dir schon beim Auswählen.', zoek: 'Preise ansehen', knop: 'Fragen', zoekKop: 'Preise von heute bei Amazon', een: 'Unsere Wahl heute', denk: 'Ich schaue nach…', bekijk: 'Ansehen:', meld: 'Tägliches Update dazu', volgKnop: 'Diesem Thema folgen', volgen: 'Folgen', volgt: 'Du folgst', terugKop: 'Willkommen zurück. Noch dran an {wat}?', verder: 'Weiter mit {wat}', opB: 'Was ist dir bei {term} unklar?', opC: 'Sag mir, was du suchst, ich helfe dir beim Auswählen', nieuwSein: 'Willst du Bescheid bekommen, wenn der Ratgeber fertig ist?', blijfVraag: 'Willst du das behalten und Bescheid bekommen, wenn sich bei {term} etwas ändert?', perMail: 'Per E-Mail', perPush: 'Als Mitteilung', vraagVolg: 'Soll ich dir jeden Morgen sagen, was sich bei {term} ändert?', ja: 'Ja, folgen', nee: 'Nein, danke', mailVraag: 'An welche E-Mail-Adresse?', mailPh: 'Deine E-Mail-Adresse', mailKnop: 'Folgen', check: 'Schau in dein Postfach und tippe auf den Knopf. Dann steht {term} jeden Morgen in deiner Mail.', volgOk: 'Gefolgt. Ab morgen steht {term} in deiner Morgenmail.', fout: 'Das hat nicht geklappt. Bitte versuch es noch einmal.', chatKop: 'Frag den Kaufberater', tik: 'Tippe eine Frage oder schreib deine eigene. Antworten von KI, nur aus unseren Seiten.', meer: 'Andere Fragen', samen: 'Gemeinsam per WhatsApp wählen', deel: 'Hilfst du mir beim Aussuchen?' },
};

// Pill-flow (arm b van factor pillflow; docs/chat-pills-ontwerp.md). Henkjan 19 nov 2026: "Chat moet vooral uit pills bestaan om ze te activeren,
// zo weinig mogelijk typen." Per stap één vraag, hooguit 4 pills (welke: geleerd op de server, lib/kzchat.js kzPills) plus "Iets anders";
// elke tik vult een veld zonder AI; na de laatste stap één advies (model of cache per pill-pad), dan blijven (melding, mail) of koppelen aan je assistent.
const PT = {
  nl: { watV: 'Waar wil je hulp bij kiezen?', wat: ['Cadeau', 'Zorgverzekering', 'Energie', 'Thuisbatterij', 'Verzekering', 'Hypotheek', 'Fietsmaat'], vwV: 'Voor wie is het?', vw: ['Mezelf', 'Partner', 'Familie', 'Kind', 'Ouders', 'Collega', 'Vriend of vriendin'], sitV: 'Wat past het best bij jou?', budV: 'Wat wil je ongeveer uitgeven?', bud: ['Goedkoop', 'Prijs-kwaliteit', 'Het beste', 'Middenklasse'], budC: ['Tot €25', 'Tot €50', 'Tot €100', 'Meer dan €100'], geen: 'Maakt niet uit', anders: 'Iets anders', ph: 'Of typ het zelf', voortg: '{n} van {t} klaar', zin: { wat: 'Ik zoek', voorWie: 'Voor', situatie: 'Situatie', budget: 'Budget' }, adv: 'Wat raad je aan? Noem de beste keuze met prijs en waarom.', blijf: 'Wil je een seintje als er iets verandert?', koppelT: 'Koppel aan je assistent', koppel: '/koppel', cadeau: 'cadeau' },
  us: { watV: 'What do you need help choosing?', wat: ['Gift', 'Kitchen appliance', 'Laptop or phone', 'Home energy', 'Power station', 'Air fryer', 'Headphones'], vwV: 'Who is it for?', vw: ['Myself', 'Partner', 'Family', 'Kid', 'Parents', 'Coworker', 'Friend'], sitV: 'What fits you best?', budV: 'What do you want to spend?', bud: ['Budget', 'Best value', 'The best', 'Mid range'], budC: ['Under $25', 'Under $50', 'Under $100', 'Over $100'], geen: 'Does not matter', anders: 'Something else', ph: 'Or type it yourself', voortg: '{n} of {t} done', zin: { wat: 'I am looking for', voorWie: 'For', situatie: 'Situation', budget: 'Budget' }, adv: 'What do you recommend? Name the best pick with price and why.', blijf: 'Want a heads-up when something changes?', koppelT: 'Connect to your assistant', koppel: '/connect', cadeau: 'gift' },
  de: { watV: 'Wobei willst du Hilfe beim Auswählen?', wat: ['Geschenk', 'Küchengerät', 'Laptop oder Handy', 'Stromspeicher', 'Powerstation', 'Kaffee', 'Kopfhörer'], vwV: 'Für wen ist es?', vw: ['Für mich', 'Partner', 'Familie', 'Kind', 'Eltern', 'Kollegen', 'Freund'], sitV: 'Was passt am besten zu dir?', budV: 'Wie viel willst du ausgeben?', bud: ['Günstig', 'Preis-Leistung', 'Das Beste', 'Mittelklasse'], budC: ['Bis 25 €', 'Bis 50 €', 'Bis 100 €', 'Über 100 €'], geen: 'Egal', anders: 'Etwas anderes', ph: 'Oder schreib es selbst', voortg: '{n} von {t} fertig', zin: { wat: 'Ich suche', voorWie: 'Für', situatie: 'Situation', budget: 'Budget' }, adv: 'Was empfiehlst du? Nenne die beste Wahl mit Preis und warum.', blijf: 'Willst du Bescheid bekommen, wenn sich etwas ändert?', koppelT: 'Mit deinem Assistenten verbinden', koppel: '/verbinden', cadeau: 'Geschenk' },
};
function pillStappen(o) {
  if (o.geenPillflow) return { st: [] }; // pagina zonder vaste pill-stappen (artikelen van de Kadoly-redactie): alleen vragen van de pagina als pills
  const p = PT[o.taal] || PT.nl, slug = String(o.slug || ''), kort = l => String(l || '').replace(/\s+/g, ' ').trim();
  const vw = { id: 'voorWie', f: 'voorWie', so: 'alg', v: p.vwV, k: p.vw };
  const bud = c => ({ id: 'budget', f: 'budget', so: c ? 'cadeau' : 'alg', v: p.budV, k: c ? p.budC : p.bud, n: 3, vast: [p.geen] });
  let st, wat = '', klaar = 1;
  if (slug === 'vraag') { st = [{ id: 'wat', f: 'wat', so: 'voorkant', v: p.watV, k: p.wat }, vw, bud(false)]; klaar = 0; }
  else if (slug === 'cadeau-vinden') { wat = p.cadeau; st = [{ ...vw, so: 'cadeau' }, bud(true)]; }
  else {
    wat = kort(o.term).slice(0, 60);
    const sit = (o.opties || []).map(x => kort(x && x.label)).filter(l => l && l.length <= 40).slice(0, 8);
    // Pills passen bij de pagina (20 nov 2026, Henkjan bij energie vergelijken met "Voor wie is het? Mezelf" en "Wat wil je ongeveer uitgeven? Middenklasse":
    // "belachelijk natuurlijk zorg dat die pills kloppen en werken bij de context OVERALL keuzehulpen"). Voor wie en budget horen alleen bij producten:
    // een pagina zonder producten en zonder eigen situaties (diensten, contracten, verzekeringen, advocaten, makelaars, rijscholen, energie) krijgt
    // geen vaste stappen maar de eigen vragen van de pagina als pills; een productpagina zonder situaties alleen de budgetstap; voor wie alleen bij cadeaus.
    const prods = (o.prods || []).length > 0 || !!o.link;
    if (sit.length >= 2) st = [{ id: 'situatie', f: 'situatie', so: slug.slice(0, 60) || 'alg', v: p.sitV, k: sit }].concat(prods ? [bud(false)] : []);
    else if (prods) st = [bud(false)];
    else if (o.reken || o.rekens) st = [vw, bud(false)]; // rekenhulpen: de rekenflow neemt het over (zie kxReken)
    else return { st: [] };
  }
  // rekenhulp in stap 1 (19 nov 2026, chat keuzehulp-pillfix): o.rh = { label in kleine letters: { r: rekenchat in deze chat (o.rekens), pad, t, l } }
  const rh = slug === 'vraag' && o.rh && typeof o.rh === 'object' ? o.rh : null;
  return { st, wat, klaar, tot: 3, anders: p.anders, ph: p.ph, voortg: p.voortg, zin: p.zin, adv: p.adv, blijf: p.blijf, koppelT: p.koppelT, koppel: p.koppel, ...(rh ? { rh } : {}), rhT: p.rhT, rhL: p.rhL };
}
// reserve-antwoord als de chat geen antwoord kan halen (19 nov 2026, Henkjan: een chat mag nooit zonder antwoord eindigen): de site laat dan altijd
// een keuzehulp met link zien plus pills om verder te gaan; de server (lib/kzchat.js reserve) zoekt de beste uit de catalogus, dit is de laatste vangst in de browser
const VERDER = {
  nl: { zin: 'Dat lukte nu niet in de chat. Hier kies je het snelst:', l: [['Alle keuzehulpen', '/keuzehulp'], ['Cadeau vinden', '/cadeau-vinden'], ['Zorgverzekering 2027', '/zorgverzekering']] },
  us: { zin: 'The chat could not answer just now. This is the fastest way to choose:', l: [['All guides', '/all'], ['Gift finder', '/gift-finder']] },
  de: { zin: 'Der Chat konnte gerade nicht antworten. Hier wählst du am schnellsten:', l: [['Alle Kaufberater', '/all'], ['Geschenk finden', '/geschenk-finden']] },
};
// Start van de chat (20 nov 2026, Henkjan: "beste is geen pills vooraf zelfs denk ik of wel maar dan starten ze chat . Maak dit lerend en doe A B tests ook .
// Doel: engagen en intent opslaan en blijven voeden, dus engagen en contact vastleggen."): factor start in de proef van de markt. a = de eigen vragen
// van de pagina als pills; b = geen pills vooraf, de chat stelt zelf een open vraag in het invoerveld; c = drie pills die een gesprek starten.
const START = {
  nl: { b: 'Waar twijfel je over? Typ het, ik denk mee.', c: ['Help me kiezen', 'Ik twijfel tussen twee', 'Wat past bij mij?'] },
  us: { b: 'What are you unsure about? Type it, I will help.', c: ['Help me choose', 'I am torn between two', 'What fits me?'] },
  de: { b: 'Wobei bist du unsicher? Schreib es, ich denke mit.', c: ['Hilf mir beim Auswählen', 'Ich schwanke zwischen zwei', 'Was passt zu mir?'] },
};
START.kadoly = START.nl;
const RH_T = { nl: ['Dat reken je uit op de rekenhulp, in een paar tikken.', 'Naar de rekenhulp'], us: ['You can work that out on the calculator in a few taps.', 'Open the calculator'], de: ['Das rechnest du mit dem Rechner in ein paar Klicks aus.', 'Zum Rechner'] };
Object.keys(PT).forEach(k => { PT[k].rhT = RH_T[k][0]; PT[k].rhL = RH_T[k][1]; });
// Kadoly (gids.kadoly.com, 19 nov 2026, Henkjan: "gebruik de lerende chat die we nu in alle keuzehulpen aan het hangen zijn" en "Die lerende chat blijf
// je lenen van de keuzehulpen want die is dus totaal in beweging"): zelfde chat en proef (markt nl), alleen eigen woorden en ingangen; antwoorden uit de winkel.
T.kadoly = { ...T.nl, chatKop: 'Vraag het Kadoly', tik: 'Tik een vraag of typ je eigen vraag. Antwoord uit de winkel van Kadoly, eerlijk ook als iets niet past.', vraag: 'Vraag iets over', geen: 'Dat weet ik nu niet zeker. Henkjan van Kadoly helpt je via WhatsApp.', opC: 'Vertel wat je zoekt, dan help ik je kiezen', bekijk: 'Bekijk:', samen: 'Samen kiezen via WhatsApp' };
PT.kadoly = { ...PT.nl, blijf: 'Op de hoogte blijven, of liever persoonlijk verder?', watV: 'Waar zoek je iets voor?', wat: ['Cadeau', 'Iets voor in huis', 'Keuken en tafel', 'Voor een kind', 'Sinterklaas', 'Kerst', 'Tuin en buiten'], koppelT: 'App Henkjan', koppel: 'https://wa.me/31655395630?text=' + encodeURIComponent('Hoi Kadoly, ik heb een vraag via de gids') };
VERDER.kadoly = { zin: 'Dat lukte nu niet in de chat. Hier vind je het snelst:', l: [['Alle gidsen van Kadoly', '/'], ['App Henkjan van Kadoly', 'https://wa.me/31655395630']] };

// Script van de pill-flow: draait binnen de IIFE van kzuxBlok (deelt C, el, o, bubbel, knop, esc, stuur, vraag, volgen, mailVorm ...), als tekst ingevoegd.
function kxPill() {
  var P = C.pf; if (!P || !P.st || !P.st.length || PFA) return; PFA = 1;
  [].forEach.call(el.querySelectorAll('.kx-ps,p.kx-s'), function (x) { x.hidden = true; });
  var vel = {}, tikt = [], kies = {}, ik2 = 0, sb = C.taal === 'us' || C.taal === 'de' || C.taal === 'kadoly' ? C.taal : 'nl', done = P.klaar || 0, tot = P.tot || 3, inp = document.getElementById('kxq');
  PV = vel; if (P.wat) vel.wat = P.wat; if (inp) inp.placeholder = P.ph;
  function ev(x) { if (bot) return; try { var j = JSON.stringify({ site: sb, ev: x }), u = '/api/keuze-tools?tool=intentie&op=pilev'; if (!(navigator.sendBeacon && navigator.sendBeacon(u, new Blob([j], { type: 'text/plain' })))) fetch(u, { method: 'POST', body: j, keepalive: true, headers: { 'content-type': 'text/plain' } }); } catch (e) {} }
  function waarde(w) { var x = []; tikt.forEach(function (t) { if (t.m < w) { x.push({ e: 'w', id: t.id, so: t.so, l: t.l, oud: t.m, w: w }); t.m = w; } }); if (x.length) ev(x); }
  PFW = function (e) { if (e === 'winkel') waarde(10); else if (e === 'blijf') waarde(12); else if (e === 'gekoppeld') waarde(15); };
  function aantal() { var n = 0; ['wat', 'voorWie', 'budget', 'wanneer'].forEach(function (k) { if (vel[k]) n++; }); return n; }
  function stap(i) {
    var s = P.st[i], lst = (kies[s.id] && kies[s.id].length ? kies[s.id] : s.k).slice(0, s.n || 4);
    var b = bubbel('kx-ant', (done > 0 ? '<small class="kx-pv">' + esc(P.voortg.replace('{n}', String(done)).replace('{t}', String(tot))) + '</small>' : '') + esc(s.v));
    var p = document.createElement('div'); p.className = 'kx-cp kx-pf';
    lst.concat(s.vast || []).forEach(function (l) { p.appendChild(knop(l, function () { tik(i, s, l, p); })); });
    var an = knop(P.anders, function () { stuur({ e: 'tik' }); if (inp) { inp.placeholder = P.ph; try { inp.focus(); } catch (x) {} } }); an.className = 'kx-an'; p.appendChild(an);
    b.appendChild(p); ev([{ e: 'zie', id: s.id, so: s.so, l: lst }]);
    if (i > 0) try { b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (x) {}
  }
  function tik(i, s, l, p) {
    if (busy) return; p.remove(); bubbel('kx-ik', esc(l)); vel[s.f] = l; tikt.push({ id: s.id, so: s.so, l: l, m: 0 }); done++; stuur({ e: 'pill' }); waarde(1);
    if (!ik2 && aantal() >= 2) { ik2 = 1; stuur({ e: 'intentie' }); waarde(3); }
    var rx = s.id === 'wat' && P.rh ? P.rh[String(l).toLowerCase()] : null; if (rx) return naarReken(rx);
    if (i + 1 < P.st.length) stap(i + 1); else advies();
  }
  // rekenhulp gekozen: geen "voor wie" en "budget", maar meteen de rekenchat in deze chat, of één tik naar de rekenhulppagina
  function naarReken(x) {
    if (x.r && C.rks && C.rks[x.r] && typeof REKENS !== 'undefined' && REKENS[x.r] && typeof kxReken === 'function') { kxReken(C.rks[x.r], REKENS[x.r], function () { waarde(4); }); return; }
    var b = bubbel('kx-ant', esc(x.t || P.rhT)), p = document.createElement('div'), a = document.createElement('a'); p.className = 'kx-cp';
    a.href = x.pad; a.textContent = x.l || P.rhL; a.addEventListener('click', function () { stuur({ e: 'tik' }); waarde(4); }); p.appendChild(a); b.appendChild(p);
    try { b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
  }
  function verder(d, l) { if (!l || !l.length) return; var p = document.createElement('div'); p.className = 'kx-cp'; l.forEach(function (x) { var a = document.createElement('a'); a.href = x[1]; a.textContent = x[0]; a.addEventListener('click', function () { stuur({ e: 'tik' }); }); p.appendChild(a); }); d.appendChild(p); }
  function advies() {
    busy = 1; var d = bubbel('kx-ant', esc(C.t.denk)), zin = [];
    var pad = P.st.map(function (s) { return s.f + '=' + String(vel[s.f] || '').toLowerCase(); }).join('>');
    ['wat', 'voorWie', 'situatie', 'budget'].forEach(function (k) { if (vel[k]) zin.push(P.zin[k] + ': ' + vel[k]); });
    var q = zin.join('. ') + '. ' + P.adv; H.push(['v', q]); cmU('actie');
    fetch('/api/keuze-tools?tool=intentie&op=chat', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ site: C.taal, slug: C.slug, v: q, h: [], sid: ivS(), vt: ivT(), pad: pad, velden: vel, pc: 1 }) })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j || !j.ok || !j.a) throw 0; return j; }).catch(function () { return { a: C.vd.zin, weet: false, verder: C.vd.l }; })
      .then(function (j) {
        var h = esc(j.a || C.geen); if (j.pagina) h += '<a class="kx-ga" href="' + esc(j.pad || ('/' + j.pagina)) + '">' + esc(C.t.bekijk + ' ' + (j.pTitel || j.pagina)) + ' \u2192</a>';
        d.innerHTML = h; if (typeof kxProd === 'function') kxProd(d, j); verder(d, j.verder); H.push(['k', String(j.a || '')]); busy = 0; meld = 1;
        try { ikZet({ wat: vel.wat || C.term, voorWie: vel.voorWie, budget: vel.budget }); } catch (x) {}
        waarde(4); blijf(); try { d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (x) {}
      });
  }
  function blijf() {
    var kan = window.__cuVolg || window.__cuOpen, b = bubbel('kx-ant', esc(P.blijf)), p = document.createElement('div'); p.className = 'kx-cp';
    var push = function () { p.remove(); bubbel('kx-ik', esc(C.t.perPush)); volgen(); };
    if (kan && c !== 'i') p.appendChild(knop(C.t.perPush, push));
    p.appendChild(knop(C.t.perMail, function () { p.remove(); bubbel('kx-ik', esc(C.t.perMail)); stuur({ e: 'pill' }); mailVorm(); }));
    if (kan && c === 'i') p.appendChild(knop(C.t.perPush, push));
    var a = document.createElement('a'); a.href = P.koppel; a.textContent = P.koppelT; a.addEventListener('click', function () { stuur({ e: 'gekoppeld' }); }); p.appendChild(a);
    b.appendChild(p);
  }
  var gestart = 0; function start() { if (gestart) return; gestart = 1; stap(0); }
  if (bot || !window.fetch) { start(); return; }
  var to = setTimeout(start, 1200);
  try { fetch('/api/keuze-tools?tool=intentie&op=pills', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ site: sb, st: P.st.map(function (s) { return { id: s.id, so: s.so, k: s.k, n: s.n || 4 }; }) }) })
    .then(function (r) { return r.json(); }).then(function (j) { if (j && j.kies) kies = j.kies; clearTimeout(to); start(); }).catch(function () { clearTimeout(to); start(); }); } catch (e) { clearTimeout(to); start(); }
}
// Rekenchat (19 nov 2026, Henkjan: "Ik denk dat we berekenen ook in de chat moeten doen met pills. Dus komt in de lerende chat bij een dergelijke
// pagina nu veel te veel velden !!"). Herbruikbaar voor elke rekenhulp: kzuxBlok(o.reken) met o.reken = { st, na, js, ... } (zie rekenCfg hieronder).
// Elke stap: één vraag met pills (label, waarde, optioneel velden voor de intentie) en zo nodig "Ander bedrag" met één getalveld; een stap met
// als: [veld, waarde] komt alleen als dat antwoord gegeven is. Na de laatste stap rekent REKEN(invoer, modus) uit o.reken.js in de browser
// (rekenkern van de rekenhulp, geen AI, geen tokens), daarna de pills van na: stap (extra vraag en opnieuw rekenen), zet (waarden zetten en
// opnieuw rekenen), link, blijf (seintje per mail of melding, telt als blijf), koppel (/koppel), zelf (formulier openklappen, ingevuld).
// Meting: stuur() (proef kzux*, factor pillflow: rekenchat = versie b, alleen gemeld voor wie b kreeg), velden als intentie via op=reken.
// 19 nov (chat keuzehulp-pillfix): kxReken(R, F, klaar) start ook een andere rekenchat (voorkant na de pill Fietsmaat, of "wissel" na een uitkomst):
// R = config uit C.rks, F = rekenfunctie uit REKENS, klaar = na de eerste uitkomst. Een uitkomst kan zijn eigen na-pills kiezen (na: sleutel in R.nas).
function kxReken(R0, F, klaar) {
  var R = R0 || C.rk; if (!R || (PFA && !R0)) return; PFA = 1;
  var RF = F || (typeof REKEN !== 'undefined' ? REKEN : null), laatst = null;
  [].forEach.call(el.querySelectorAll('.kx-ps,p.kx-s'), function (x) { x.hidden = true; });
  var inv = {}, vel = { wat: R.wat }, done = 0, ik2 = 0, gerekend = 0, qi = document.getElementById('kxq');
  PV = vel; if (qi && R.ph) qi.placeholder = R.ph;
  function nVel() { var n = 0; ['wat', 'voorWie', 'budget', 'wanneer'].forEach(function (k) { if (vel[k]) n++; }); return n; }
  function past(s) { return !s.als || String(inv[s.als[0]]) === String(s.als[1]); }
  function zicht(b) { try { b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (x) {} }
  function getal(b, p, s, klaar) {
    var f = document.createElement('form'); f.className = 'kx-f kx-rg';
    f.innerHTML = '<input type="text" inputmode="decimal" autocomplete="off" maxlength="12" aria-label="' + esc(s.ander.ph) + '" placeholder="' + esc(s.ander.ph) + '"><button type="submit" aria-label="OK">&#8593;</button>';
    b.appendChild(f); var i = f.querySelector('input'); try { i.focus({ preventScroll: true }); } catch (x) {}
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var t = String(i.value || '').replace(/[^\d,.]/g, ''); if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.'); else t = t.replace(/\.(?=\d{3}(\D|$))/g, '');
      var v = Number(t); if (!(v >= (s.ander.min || 0)) || !(v <= (s.ander.max || 1e9)) || !t) { i.value = ''; i.placeholder = s.ander.ph; return; }
      p.remove(); f.remove(); var l = (s.ander.voor || '') + v.toLocaleString('nl-NL', { maximumFractionDigits: 2 }) + (s.ander.na || ''); bubbel('kx-ik', esc(l)); klaar([l, String(v)]);
    });
  }
  function vraagStap(s, hoofd, klaar) {
    var b = bubbel('kx-ant', (hoofd && done > 0 ? '<small class="kx-pv">' + esc(R.voortg.replace('{n}', String(done)).replace('{t}', String(R.tot))) + '</small>' : '') + esc(s.v));
    var p = document.createElement('div'); p.className = 'kx-cp kx-pf';
    s.p.forEach(function (x) { p.appendChild(knop(x[0], function () { if (busy) return; p.remove(); bubbel('kx-ik', esc(x[0])); klaar(x); })); });
    if (s.ander) { var an = knop(s.ander.l, function () { stuur({ e: 'tik' }); an.remove(); getal(b, p, s, klaar); }); an.className = 'kx-an'; p.appendChild(an); }
    b.appendChild(p); if (done > 0 || !hoofd) zicht(b);
  }
  function stap(i) {
    var j = i; while (j < R.st.length && !past(R.st[j])) j++;
    if (j >= R.st.length) return uitkomst('');
    var s = R.st[j];
    vraagStap(s, !s.als, function (x) {
      inv[s.f] = x[1]; if (x[2]) for (var k in x[2]) vel[k] = x[2][k];
      if (!s.als) done++; stuur({ e: 'pill' });
      if (!ik2 && nVel() >= 2) { ik2 = 1; stuur({ e: 'intentie' }); }
      stap(j + 1);
    });
  }
  function log(r) {
    if (bot) return;
    try { fetch('/api/keuze-tools?tool=intentie&op=reken', { method: 'POST', keepalive: true, headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ site: C.taal, slug: R.slug || C.slug, q: r.q || '', velden: vel, pad: R.st.filter(past).map(function (s) { return s.f + '=' + String(inv[s.f] == null ? '' : inv[s.f]); }).join('>'), sid: ivS(), vt: ivT() }) }); } catch (x) {}
  }
  function uitkomst(modus) {
    var r = null; try { r = RF(inv, modus); } catch (x) { r = null; }
    if (!r || !r.h) { var g = bubbel('kx-ant', esc(C.vd.zin)); [].slice.call(o.querySelectorAll('.kx-rn')).forEach(function (x) { x.remove(); }); var gp = document.createElement('div'); gp.className = 'kx-cp kx-rn'; C.vd.l.forEach(function (x) { var a = document.createElement('a'); a.href = x[1]; a.textContent = x[0]; gp.appendChild(a); }); g.appendChild(gp); return; }
    laatst = r; var d = bubbel('kx-ant kx-rk', r.h); if (r.vel) for (var k in r.vel) if (r.vel[k]) vel[k] = r.vel[k];
    if (!gerekend) { gerekend = 1; stuur({ e: 'vraag' }); cmU('actie'); log(r); try { ikZet({ wat: vel.wat, voorWie: vel.voorWie, budget: vel.budget }); } catch (x) {} if (R.naTekst) bubbel('kx-ant kx-rb', R.naTekst); if (klaar) try { klaar(); } catch (x) {} }
    na(); zicht(d);
  }
  function bewaar() { try { localStorage.setItem('kzreken:' + C.slug, JSON.stringify({ inv: inv, t: Date.now() })); } catch (x) {} }
  function blijfR(x) {
    var kan = window.__cuVolg || window.__cuOpen, b = bubbel('kx-ant', esc(x.v || C.t.blijfVraag)), p = document.createElement('div'); p.className = 'kx-cp';
    var push = function () { p.remove(); bubbel('kx-ik', esc(C.t.perPush)); bewaar(); volgen(); na(); };
    if (kan && c !== 'i') p.appendChild(knop(C.t.perPush, push));
    p.appendChild(knop(C.t.perMail, function () { p.remove(); bubbel('kx-ik', esc(C.t.perMail)); bewaar(); stuur({ e: 'pill' }); mailVorm(); na(); }));
    if (kan && c === 'i') p.appendChild(knop(C.t.perPush, push));
    p.appendChild(knop(C.t.nee, function () { p.remove(); bubbel('kx-ik', esc(C.t.nee)); na(); }));
    b.appendChild(p); zicht(b);
  }
  function zelf() { var d = R.zelf && document.getElementById(R.zelf); if (!d) return; try { d.open = true; } catch (x) {} try { if (window.__rkZet) window.__rkZet(inv); } catch (x) {} try { d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (x) {} }
  function na() {
    [].slice.call(o.querySelectorAll('.kx-rn')).forEach(function (x) { x.remove(); });
    var p = document.createElement('div'); p.className = 'kx-cp kx-rn';
    var L = (laatst && laatst.na && (typeof laatst.na === 'string' ? (R.nas || {})[laatst.na] : laatst.na)) || R.na || [];
    L.forEach(function (x) {
      var kanW = x.s === 'wissel' && C.rks && C.rks[x.r] && typeof REKENS !== 'undefined' && REKENS[x.r];
      if (x.s === 'link' || x.s === 'koppel' || (x.s === 'wissel' && !kanW)) { var a = document.createElement('a'); a.href = x.href; a.textContent = x.l; a.addEventListener('click', function () { stuur({ e: x.s === 'koppel' ? 'gekoppeld' : 'tik' }); }); p.appendChild(a); return; }
      if (x.s === 'blijf' && meld) return;
      p.appendChild(knop(x.l, function () {
        if (busy) return; p.remove(); bubbel('kx-ik', esc(x.l)); stuur({ e: 'pill' });
        if (x.s === 'wissel') { kxReken(C.rks[x.r], REKENS[x.r]); return; }
        if (x.s === 'zet') { for (var k in x.zet) inv[k] = x.zet[k]; uitkomst(x.m || ''); }
        else if (x.s === 'stap') vraagStap(x.st, false, function (y) { (x.wis || []).forEach(function (k) { delete inv[k]; }); inv[x.st.f] = y[1]; uitkomst(x.m || ''); });
        else if (x.s === 'blijf') { meld = 1; blijfR(x); }
        else if (x.s === 'zelf') { zelf(); na(); }
      }));
    });
    o.appendChild(p); o.hidden = false;
  }
  if (R.start) bubbel('kx-ant kx-rb', R.start);
  if (R.st && R.st.length) stap(0); else na();
}
// achtergrond van de pagina achter de chat: donker (luminantie < 0,45) zet kx-dk op <html>
function kxDonker() {
  try {
    var x = el, bg = null, n = 0, d = false;
    while (x && x.nodeType === 1 && n < 40) { var cs = getComputedStyle(x).backgroundColor, m = cs && cs.match(/[\d.]+/g); if (m && m.length >= 3 && (m.length < 4 || parseFloat(m[3]) > 0.5)) { bg = m; break; } x = x.parentElement; n++; }
    if (bg) d = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255 < 0.45;
    else d = /dark/.test(getComputedStyle(document.documentElement).colorScheme || '') && !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('kx-dk', d);
  } catch (e) {}
}

const CSS = '.kx-pr{margin:12px 0 4px;border:1px solid #E5E7EB;border-radius:14px;overflow:hidden;background:#fff}.kx-pk{display:grid;grid-template-columns:48px 1fr auto;gap:12px;align-items:center;padding:10px 14px;border-top:1px solid #E5E7EB;color:#111113!important;text-decoration:none!important}.kx-pk:first-child{border-top:0}.kx-pk img,.kx-pi{width:48px;height:48px;object-fit:contain;border-radius:8px;background:#F3F4F6;display:block}.kx-pk b{display:block;font-size:15px;font-weight:600;line-height:1.3}.kx-pk small{display:block;font-size:13px;line-height:1.4;margin-top:2px}.kx-pk i{font-style:normal;font-size:17px}.kx-pk:hover b{text-decoration:underline;text-underline-offset:3px}.kx-cp a{display:inline-flex;align-items:center}.kx{margin:18px 0 22px;padding:0;border:0}.kx[hidden]{display:none!important}.kx h2.kx-h{font-size:18px;font-weight:700;margin:0 0 6px;letter-spacing:-.01em}'
  + '.kx-l{display:flex;flex-direction:column;border-top:1px solid rgba(127,127,127,.25)}'
  + 'a.kx-r{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:4px 14px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(127,127,127,.25);text-decoration:none!important;color:inherit!important}'
  + '.kx-n{min-width:0}.kx-n b{display:block;font-weight:600;font-size:16px;line-height:1.35;overflow-wrap:anywhere}.kx-n small{display:block;font-size:14px;margin-top:1px}'
  + '.kx-p{font-weight:700;font-size:16px;white-space:nowrap;font-variant-numeric:tabular-nums}.kx-k{background:#fff;color:#111113;border:1px solid #D1D5DB;border-radius:999px;padding:6px 14px;font-size:14px;font-weight:500;white-space:nowrap}a.kx-r:hover .kx-k{border-color:#111113;color:#111113}'
  + '@media (max-width:480px){a.kx-r{grid-template-columns:minmax(0,1fr) auto}.kx-k{grid-column:1/-1;justify-self:start}}'
  + '.kx p.kx-d{font-size:14px;margin:8px 0 0}.kx p.kx-s{font-size:15px;font-weight:600;margin:16px 0 8px}'
  + '.kx-ps{display:flex;flex-wrap:wrap;gap:8px}.kx-ps button{font:inherit;font-size:15px;font-weight:500;line-height:1.35;cursor:pointer;background:#fff;color:#111113;border:1px solid #D1D5DB;border-radius:999px;padding:7px 14px;text-align:left}.kx-ps button:hover,.kx-cp button:hover,.kx-act button:hover,.kx-act a:hover,.kx-vb:hover{border-color:#111113;color:#111113}'
  + 'form.kx-f{display:flex;align-items:center;gap:8px;border:1.5px solid rgba(127,127,127,.45);border-radius:999px;padding:5px 5px 5px 18px;margin:16px 0 0}form.kx-f:focus-within{border-color:#111113}'
  + 'form.kx-f input{flex:1;min-width:0;border:0;background:transparent;font:inherit;font-size:16px;color:inherit;padding:8px 0}form.kx-f input:focus{outline:none}.kx form.kx-f input{border:0!important;border-radius:0!important;box-shadow:none!important;min-height:0!important;padding:8px 0!important;background:transparent!important;font-size:16px!important}.kx form.kx-f button{flex:0 0 42px!important;width:42px!important;height:42px!important;min-height:0!important;min-width:0!important;padding:0!important;margin:0!important;border-radius:50%!important;display:flex!important;align-items:center;justify-content:center;font-size:19px!important;box-shadow:none!important;background:#111113!important;color:#fff!important}.kx form.kx-f{display:flex!important;flex-wrap:nowrap!important;max-width:100%!important;border:1.5px solid rgba(127,127,127,.45)!important;border-radius:999px!important;padding:5px 5px 5px 18px!important;background:#fff!important;box-shadow:none!important}.kx form.kx-f:focus-within{border-color:#111113!important;box-shadow:none!important}#kxf{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;box-sizing:border-box;max-width:100%}#kxf button{flex:0 0 42px!important;width:42px!important;height:42px!important;min-height:0!important;min-width:0!important;padding:0!important;margin:0!important;border-radius:50%!important;display:flex!important;align-items:center;justify-content:center;line-height:1!important;font-size:19px!important;box-shadow:none!important}#kxf #kxq{border:0!important;border-radius:0!important;background:transparent!important;padding:8px 0!important;min-height:0!important;box-shadow:none!important;font-size:16px!important}'
  + 'form.kx-f button{flex:none;width:42px;height:42px;border-radius:50%;border:0;background:#111113;color:#fff;font-size:19px;font-weight:700;cursor:pointer}'
  + '.kx-a{margin:12px 0 0;display:flex;flex-direction:column;gap:10px}.kx-ik{align-self:flex-end;max-width:85%;background:#F3F4F6;color:#111113;border-radius:16px 16px 4px 16px;padding:9px 14px;font-size:16px;line-height:1.45}.kx-ant{font-size:16px;line-height:1.5}.kx-ant a.kx-ga{display:block;margin:6px 0 0;font-weight:600}.kx-cp{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 0}.kx-cp button,.kx-act button,.kx-act a{font:inherit;font-size:15px;font-weight:500;cursor:pointer;background:#fff;color:#111113;border:1px solid #D1D5DB;border-radius:999px;padding:7px 14px;text-decoration:none!important}.kx-vb{font:inherit;font-size:14px;font-weight:500;line-height:1.2;cursor:pointer;background:#fff;color:#111113;border:1px solid #D1D5DB;border-radius:999px;padding:5px 14px;margin:0 0 0 10px;vertical-align:1px}.kx-vb.on{background:transparent;border-color:transparent;color:#6B7280;padding-left:4px;padding-right:4px}p.kx-vr{margin:0 0 14px}p.kx-vr .kx-vb{margin:0}.kx-act{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0}.kx-cp button{text-align:left;line-height:1.35}.kx-ps[hidden],.kx-s[hidden],.kx-l[hidden],.kx-d[hidden]{display:none!important}'
  + '.kx-rk p{margin:0 0 8px;font-size:16px;line-height:1.5}.kx-rk p:last-child{margin-bottom:0}.kx-rk .kx-rk-k{font-size:14px;font-weight:600;margin:0}.kx-rk .kx-rk-g{font-size:30px;line-height:1.15;font-weight:700;letter-spacing:-.01em;margin:2px 0 8px}.kx-rk .kx-rk-w,.kx-rb{font-size:15px}.kx-rb a,.kx-rk a{font-weight:600;color:inherit}#kx .kx-cp a,#kx .kx-cp a:visited{color:#111113!important}.kx-dk #kx .kx-cp a,.kx-dk #kx .kx-cp a:visited{color:#F2F3F5!important}#kx .kx-rb a,#kx .kx-rk a{color:inherit!important}.kx-rg{margin:10px 0 0;max-width:320px}'
  + '.kx-cp a{font:inherit;font-size:15px;font-weight:500;cursor:pointer;background:#fff;color:#111113;border:1px solid #D1D5DB;border-radius:999px;padding:7px 14px;text-decoration:none!important;line-height:1.35}.kx-cp a:hover{border-color:#111113}small.kx-pv{display:block;font-size:14px;font-weight:600;margin:0 0 2px}.kx-cp button.kx-an{border-style:dashed}.kx-cp button,.kx-cp a,.kx-ps button{min-height:40px;touch-action:manipulation;-webkit-tap-highlight-color:rgba(0,0,0,.08)}'
  // donkere modus (19 nov 2026): de chat volgt de echte achtergrond van de pagina (klasse kx-dk op <html>, gezet door het script), niet de instelling van het toestel; veel pagina's blijven wit
  + '.kx-dk .kx-ps button,.kx-dk .kx-cp button,.kx-dk .kx-cp a,.kx-dk .kx-act button,.kx-dk .kx-act a,.kx-dk .kx-vb,.kx-dk .kx-k,.kx-dk .kx-mn button{color:#F2F3F5;background:transparent;border-color:#4A5260}.kx-dk .kx-ik{background:#1F232C;color:#F2F3F5}.kx-dk .kx-ps button:hover,.kx-dk .kx-cp button:hover,.kx-dk .kx-cp a:hover,.kx-dk .kx-act button:hover,.kx-dk .kx-act a:hover,.kx-dk .kx-vb:hover{border-color:#F2F3F5;color:#F2F3F5}.kx-dk .kx form.kx-f{background:transparent!important}.kx-dk .kx form.kx-f button,.kx-dk .kx #kxf button{background:#F2F3F5!important;color:#0B1022!important}.kx-dk .kx form.kx-f:focus-within{border-color:#F2F3F5!important}.kx-dk .kx-vb.on{background:transparent;border-color:transparent;color:#A9B0BC}';

// zoekvak op de voorpagina: elke zoekvraag (bij Enter of als het veld verlaten wordt) gaat naar het intentielog, met of er een keuzehulp bij was
export const zoekLogJs = site => `<script>(function(){var s={};document.querySelectorAll('input[type=search]').forEach(function(i){i.addEventListener('change',function(){var q=(i.value||'').trim().toLowerCase();if(q.length<3||s[q])return;s[q]=1;var r=document.getElementById('zres');try{fetch('/api/keuze-tools?tool=intentie',{method:'POST',keepalive:true,headers:{'content-type':'text/plain'},body:JSON.stringify({q:q,site:${JSON.stringify(site)},bron:'zoek',m:r&&!r.hidden?1:0})})}catch(e){}})})})();</script>`;

// productnaam kort en leesbaar: delen tot ~20 tekens, nooit midden in een woord afgekapt
function naamKort(n) {
  const delen = String(n || '').replace(/\s+/g, ' ').trim().split(/\s[-–|]\s|,\s|\s\(/); let out = '';
  for (const d of delen) { if (out.length >= 18) break; out = out ? out + ' ' + d : d; }
  if (out.length > 60) out = out.slice(0, 60).replace(/\s+\S*$/, '');
  return out.replace(/[\s,(-]+$/, '');
}

// o: { taal: 'nl'|'us'|'de', site: 'kzuxnl'|'kzuxus'|'kzuxde', slug, term, prods: [{naam, rol, prijs, url}], shop, link, opties: [{qi, oi, label}], faq: [{q, a}] }
export function kzuxBlok(o) {
  const t = Object.assign({}, T[o.taal] || T.nl, o.t || {}); const prods = (o.prods || []).filter(p => p && p.naam && p.url).slice(0, 3).map(p => ({ ...p, naam: naamKort(p.naam) }));
  const kop = o.kop ? o.kop : !prods.length ? (o.link ? t.zoekKop : t.chatKop) : prods.length === 1 ? t.een : prods.length < 3 ? t.top.replace('3', String(prods.length)) : t.top;
  const rows = prods.length
    ? prods.map(p => `<a class="kx-r" href="${ESC(p.url)}" target="_blank" rel="sponsored nofollow noopener" data-kx="winkel"><span class="kx-n"><b>${ESC(p.naam)}</b>${p.rol ? `<small>${ESC(p.rol)}</small>` : ''}</span><span class="kx-p">${ESC(p.prijs || '')}</span><span class="kx-k">${ESC(t.winkel + ' ' + (o.shop || 'bol'))}</span></a>`).join('')
    : (o.link ? `<a class="kx-r" href="${ESC(o.link)}" target="_blank" rel="sponsored nofollow noopener" data-kx="winkel"><span class="kx-n"><b>${ESC(o.term || '')}</b></span><span class="kx-p"></span><span class="kx-k">${ESC(t.zoek)}</span></a>` : '');
  const opts = (o.opties || []).filter(x => x && x.label).slice(0, 5);
  const faq = (o.faq || []).filter(f => f && f.q && f.a).slice(0, 12).map(f => [String(f.q).slice(0, 200), String(f.a).slice(0, 600)].concat(f.pad ? [String(f.pad), String(f.titel || '')] : []));
  // vraag-eerst (18 nov 2026, 100k intenties): o.vragen zijn startvragen die naar de AI-chat gaan (geen FAQ), zodat elke tik een intentie wordt
  const startPills = opts.length || o.reken ? [] : Array.isArray(o.vragen) && o.vragen.length ? o.vragen.map(String).filter(q => q.length <= 90).slice(0, 6) : faq.map(f => f[0]).filter(q => q.length <= 90).slice(0, 4);
  if (!startPills.length && !opts.length && !o.reken) startPills.push(...((START[o.taal] || START.nl).c)); // altijd pills om in te stappen (20 nov 2026): zonder eigen vragen de drie gespreksstarters
  const mn = o.mening && o.mening.u && o.mening.label ? o.mening : null; // mening geven over een zaak (makelaars, 19 nov 2026): sterren en een paar woorden, anoniem
  const dagIso = new Date().toISOString().slice(0, 10); let dagTekst = dagIso;
  try { dagTekst = new Date(dagIso + 'T12:00:00Z').toLocaleDateString({ nl: 'nl-NL', us: 'en-US', de: 'de-DE' }[o.taal] || 'nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) {}
  // keuzehulp.best heeft verder geen productlijst in de gestructureerde gegevens; US/DE wel (api/wtb.js), dus daar niet dubbel
  const ld = o.taal === 'nl' && prods.length ? '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: kop + ': ' + (o.term || ''), itemListOrder: 'https://schema.org/ItemListOrderAscending', numberOfItems: prods.length, itemListElement: prods.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.naam })) }).replace(/</g, '\\u003c') + '</script>' : '';
  const rk = o.reken ? Object.fromEntries(Object.entries(o.reken).filter(([k]) => k !== 'js')) : 0;
  const rks = o.rekens ? Object.fromEntries(Object.entries(o.rekens).map(([n, x]) => [n, Object.fromEntries(Object.entries(x).filter(([k]) => k !== 'js'))])) : 0;
  const vd = VERDER[o.taal] || VERDER.nl;
  const cfg = JSON.stringify({ sv: START[o.taal] || START.nl, pf: pillStappen(o), rk, rks, vd: { zin: vd.zin, l: vd.l }, nv: o.geenVolg ? 1 : 0, tg: o.terug ? 1 : 0, s: o.site, r: RONDE, slug: o.slug || '', taal: o.taal, term: String(o.term || ''), ha: prods.length ? 0 : 1, faq, geen: t.geen, kopA: t.chatKop, t: Object.fromEntries(['denk', 'bekijk', 'meld', 'samen', 'deel', 'meer', 'volgKnop', 'vraagVolg', 'ja', 'nee', 'mailVraag', 'mailPh', 'mailKnop', 'check', 'volgOk', 'fout', 'volgen', 'volgt', 'blijfVraag', 'perMail', 'perPush', 'opB', 'opC', 'nieuwSein', 'terugKop', 'verder'].map(k => [k, String(t[k] || '').split('{term}').join(String(o.term || ''))])) }).replace(/</g, '\\u003c');
  return `<style>${CSS}</style><section class="kx" id="kx" aria-label="${ESC(kop)}"><h2 class="kx-h">${ESC(kop)}</h2>${rows ? `<div class="kx-l">${rows}</div>` : ''}${prods.length ? `<p class="kx-d">${ESC(t.datum)}: <time datetime="${dagIso}">${ESC(dagTekst)}</time></p>` : ''}${ld}`
    + (opts.length ? `<p class="kx-s">${ESC(t.anders)}</p><div class="kx-ps">${opts.map(x => `<button type="button" data-q="${x.qi}" data-o="${x.oi}"${x.q ? ` data-vq="${ESC(x.q)}"` : ''}>${ESC(x.label)}</button>`).join('')}</div>` : '')
    + (startPills.length ? `<p class="kx-s">${ESC(t.tik)}</p><div class="kx-ps">${startPills.map(q => `<button type="button" data-v="1">${ESC(q)}</button>`).join('')}</div>` : '')
    + (mn ? `<div class="kx-mn"><button type="button" id="kxmn" data-t="mening" data-pl="${ESC(mn.pl || '')}" data-s="${ESC(mn.s || '')}">${ESC(mn.label)}</button></div>` : '')
    + `<form class="kx-f" id="kxf"><input id="kxq" name="q" maxlength="160" autocomplete="off" placeholder="${ESC(o.ph || (t.vraag + ' ' + (o.term || '')))}"><button type="submit" aria-label="${ESC(t.knop)}">&#8593;</button></form><div class="kx-a" id="kxa" hidden></div></section>`
    + `<script>(function(){var C=${cfg},el=document.getElementById("kx");if(!el)return;var K="kzux1",st=null,ua=navigator.userAgent,c=/iPhone|iPad|iPod/.test(ua)?"i":/Android/.test(ua)?"a":"d",bot=navigator.webdriver===true,PFA=0,PFW=null,PV=null,IA=0,PF="a";`
    + kxDonker.toString() + kxPill.toString() + (o.reken || o.rekens ? kxReken.toString() + 'var REKENS={};' + Object.values(o.rekens || {}).map(x => String((x && x.js) || '')).join('') + String((o.reken && o.reken.js) || '') : '') +'kxDonker();document.addEventListener("DOMContentLoaded",kxDonker);window.addEventListener("load",kxDonker);try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",kxDonker)}catch(e){}'
    + 'try{st=JSON.parse(localStorage.getItem(K)||"null")}catch(e){}if(st&&(st.s!==C.s||st.r!==C.r||!st.d||!st.v||Date.now()-Date.parse(st.d)>6*864e5))st=null;'
    + 'function stuur(o){try{window.__kxEv&&window.__kxEv(o.e)}catch(x){}try{if(PFW)PFW(o.e)}catch(x){}if(!st)return;o.site=C.s;o.pid=st.pid;o.d=st.d;o.r=st.r;var j=JSON.stringify(o);try{if(!(navigator.sendBeacon&&navigator.sendBeacon("/api/mm/proefev",new Blob([j],{type:"text/plain"}))))fetch("/api/mm/proefev",{method:"POST",body:j,keepalive:true,headers:{"content-type":"text/plain"}})}catch(e){}}'
    + 'function adv(f){if(C.ha&&!f)return;var a=document.getElementById("adv");if(a)a.hidden=!f}'
    + 'function hoog(){var h=document.querySelector("article h1, main h1");if(!h)return;var r=h.closest(".hero")||h,x=r.nextElementSibling;while(x&&(x===el||/^(STYLE|SCRIPT)$/.test(x.tagName)||/(^|\\s)(kz-meta|kx-vr|lead|standfirst)(\\s|$)/.test(x.className||""))){if(x!==el&&!/^(STYLE|SCRIPT)$/.test(x.tagName))r=x;x=x.nextElementSibling}if(r.nextElementSibling!==el)r.parentNode.insertBefore(el,r.nextSibling)}function volgKnop(){if(C.nv)return;var h=document.querySelector("article h1, main h1");if(!h||document.querySelector(".kx-vb"))return;var b=document.createElement("button");b.type="button";b.className="kx-vb";b.textContent=C.t.volgen;var m=h.nextElementSibling;if(m&&/(^|\\s)kz-meta(\\s|$)/.test(m.className||""))m.appendChild(b);else{var p=document.createElement("p");p.className="kx-vr";p.appendChild(b);h.parentNode.insertBefore(p,h.nextSibling)}function zetStaat(){try{if(window.__cuVolgt&&window.__cuVolgt()){b.textContent=C.t.volgt;b.classList.add("on")}}catch(e){}}zetStaat();document.addEventListener("cu:klaar",zetStaat);b.addEventListener("click",function(){if(b.classList.contains("on"))return;stuur({e:"pill"});if(!window.__cuVolg){if(window.__cuOpen)window.__cuOpen();return}window.__cuVolg().then(function(r){if(r&&r.stand==="mail"){el.scrollIntoView({behavior:"smooth",block:"start"});mailVorm();return}if(r&&r.stand!=="vol"){b.textContent=C.t.volgt;b.classList.add("on")}}).catch(function(){el.scrollIntoView({behavior:"smooth",block:"start"});mailVorm()})})}'
    + 'var V="b";function alleenChat(){[].forEach.call(el.querySelectorAll(".kx-l,.kx-d"),function(x){x.hidden=true});var k=el.querySelector("h2.kx-h");if(k&&el.querySelector(".kx-l"))k.textContent=C.kopA}function zet(){V=C.ha?"a":(st.v&&st.v.top||"a");try{var OV=st.v&&st.v.opener||"a",OT=OV==="b"?C.t.opB:OV==="c"?C.t.opC:"",HH=el.querySelector(".kx-h");if(OT&&HH)HH.textContent=OT}catch(x){}if(window.ikTerug2)window.ikTerug2();el.style.visibility="";if(V==="a")alleenChat();hoog();if(V==="a"){}else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){if(!window.__kxOpen)adv(false)});else if(!window.__kxOpen)adv(false);var SV=(st&&st.v&&st.v.start)||"";PF=(st&&st.v&&st.v.pillflow)||"a";if(PF==="b"&&IA&&!C.rk)PF="a";if(SV==="b"&&!C.rk)PF="a";try{if(SV&&!C.rk){var sp=null;[].forEach.call(el.querySelectorAll(".kx-ps"),function(p){if(p.querySelector("button[data-v]"))sp=p});if(SV==="b"){if(sp){sp.hidden=true;var s0=sp.previousElementSibling;if(s0&&/kx-s/.test(s0.className))s0.hidden=true}var iq=document.getElementById("kxq");if(iq&&C.sv)iq.placeholder=C.sv.b.replace("{term}",C.term||"")}else if(SV==="c"&&sp&&C.sv){sp.innerHTML=C.sv.c.map(function(x){return \'<button type="button" data-v="1">\'+String(x).replace(/</g,"&lt;")+"</button>"}).join("")}}}catch(x){}if(PF==="b"&&!C.rk)setTimeout(function(){kxPill()},0);var vv=C.rk&&PF!=="b"?{}:{pillflow:PF};try{if(st&&st.v){if(SV&&!C.rk)vv.start=SV;if(st.v.onthoud)vv.onthoud=st.v.onthoud;if(st.v.meer)vv.meer=st.v.meer;if(st.v.top)vv.top=V;if(st.v.opener)vv.opener=st.v.opener;if(st.v.blijf)vv.blijf=st.v.blijf}}catch(x){}stuur({e:"zie",c:c,v:vv})}'
    + 'volgKnop();hoog();if(C.rk)setTimeout(function(){kxReken()},0);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",hoog);var F=(location.search.match(/[?&]kx=([abp])/)||[])[1];if(F){V=F==="p"?"a":F;st=null;bot=true;if(F==="p"){alleenChat();hoog();setTimeout(function(){kxPill()},0)}else if(F==="a"){alleenChat();hoog()}else{hoog();if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){adv(false)});else adv(false)}}'
    + 'if(!bot){if(st)zet();else if(window.fetch){var to=0;fetch("/api/mm/proefkies?site="+C.s+"&c="+c,{credentials:"omit"}).then(function(r){return r.json()}).then(function(j){clearTimeout(to);if(j&&j.ok&&j.aan&&j.pid&&j.r===C.r){st={s:C.s,pid:j.pid,d:j.d,r:j.r,v:j.v};try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}zet()}else el.style.visibility=""}).catch(function(){clearTimeout(to);el.style.visibility=""})}}'
    + 'function open(){window.__kxOpen=1;adv(true)}'
    + 'document.addEventListener("click",function(e){if(!e.target.closest)return;if(el.contains(e.target))IA=1;var a=e.target.closest("a[href]");if(a){var h=a.getAttribute("href")||"";if(a.hasAttribute("data-kx")||a.hasAttribute("data-kz")||a.hasAttribute("data-amz")||/partner\\.bol\\.com|amazon\\.|amzn\\.to|^\\/naar\\//.test(h)){stuur({e:"winkel"});return}}'
    + 'var p=e.target.closest(".kx-ps button");if(p&&p.hasAttribute("data-v")){vraag(p.textContent);stuur({e:"pill"});return}if(p){var vq=p.getAttribute("data-vq");vraag(vq?vq+" "+p.textContent+". "+((C.pf&&C.pf.adv)||(C.t&&C.t.adv)||""):p.textContent);stuur({e:"pill"});return}'
    + 'if(e.target.closest(".opt")){open();stuur({e:"tik"});return}if(e.target.closest("button,summary,input"))stuur({e:"tik"})},true);'
    + 'var STOP=/^(de|het|een|en|of|voor|met|van|in|op|je|jij|bij|wat|hoe|welke|welk|is|are|the|a|an|and|or|for|with|of|to|what|which|how|do|does|der|die|das|ein|eine|und|oder|f\\u00fcr|mit|von|zu|was|wie|welche|ist|ich|my|mijn|mein|hoeveel|much|many|wieviel|viel|kan|can|kann|moet|should|soll|beste|best|goed|good|gut|niet|not|nicht|wel|zijn|ben|heb|have|hat|haben|this|dit|deze|dieser)$/;'
    + 'function w(s){return String(s).toLowerCase().replace(/[^a-z0-9\\u00c0-\\u024f ]/g," ").split(/\\s+/).filter(function(x){return x.length>2&&!STOP.test(x)})}'
    + 'function esc(s){return String(s).replace(/[&<>"]/g,function(x){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[x]})}'
    // 18 nov: intentie per persoon volgen (lib/intentvolg.js): sessie-id en volgtoken mee met elke vraag, en na volgen of aanmelden koppelen
    + 'function ivS(){try{var s=localStorage.getItem("kzsid");if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem("kzsid",s)}return s}catch(e){return ""}}function ivT(){try{var v=JSON.parse(localStorage.getItem("kzvolg:"+({nl:"kz",us:"us",de:"de"}[C.taal]||"kz"))||"null");return v&&v.t||""}catch(e){return ""}}function cmU(x){try{if(window.mmUitkomst){window.mmUitkomst(x);if(x==="actie")window.mmUitkomst("dialoog")}}catch(e){}}function ikL(){try{var a=JSON.parse(localStorage.getItem("kzik")||"[]");return Array.isArray(a)?a.filter(function(x){return x&&x.wat&&Date.now()-x.t<12096e5}):[]}catch(e){return []}}function ikZet(i){try{if(!i||!i.wat)return;var a=ikL().filter(function(x){return String(x.wat).toLowerCase()!==String(i.wat).toLowerCase()});a.unshift({wat:String(i.wat).slice(0,60),voorWie:String(i.voorWie||"").slice(0,40),budget:String(i.budget||"").slice(0,30),wanneer:String(i.wanneer||"").slice(0,30),t:Date.now()});localStorage.setItem("kzik",JSON.stringify(a.slice(0,5)))}catch(e){}}function ikTerug(){window.ikTerug2=ikTerug;try{var a=ikL();if(!C.tg||!a[0])return;var hh=el.querySelector(".kx-h");if(hh)hh.textContent=C.t.terugKop.split("{wat}").join(a[0].wat);var ps=el.querySelector(".kx-ps");if(ps&&!ps.querySelector("[data-kik]")){var bt=document.createElement("button");bt.type="button";bt.setAttribute("data-v","1");bt.setAttribute("data-kik","1");bt.textContent=C.t.verder.split("{wat}").join(a[0].wat);ps.insertBefore(bt,ps.firstChild)}}catch(e){}}function BV(){try{return (st&&st.v&&st.v.blijf)||"a"}catch(e){return "a"}}function BN(){return BV()==="b"?1:2}function ivK(){var t=ivT(),s=ivS();if(t){cmU("aanmelding");try{stuur({e:"blijf"})}catch(e){}};if(t&&s)try{fetch("/api/keuze-tools?tool=intentie&op=koppel",{method:"POST",headers:{"content-type":"text/plain"},body:JSON.stringify({sid:s,vt:t,site:C.taal})})}catch(e){}}'
    + 'var o=document.getElementById("kxa"),H=[],busy=0,meld=0,G={},NA=0;ikTerug();function volgen(){stuur({e:"pill"});if(!window.__cuVolg){if(window.__cuOpen)window.__cuOpen();return}window.__cuVolg().then(function(r){ivK();if(r&&r.stand==="mail")return mailVorm();var F=window.__cuTekst||function(){return ""};var t=r.stand==="vol"?F("vol"):r.stand==="wacht"?F("wacht"):r.stand==="al"?F("al"):(F("ok")||C.t.volgOk);bubbel("kx-ant",esc(t||C.t.volgOk))}).catch(function(){mailVorm()})}function mailVorm(){var d=bubbel("kx-ant",esc(C.t.mailVraag));var f=document.createElement("form");f.className="kx-f";f.innerHTML=\'<input type="email" autocomplete="email" inputmode="email" required placeholder="\'+esc(C.t.mailPh)+\'"><button type="submit" aria-label="\'+esc(C.t.mailKnop)+\'">&#8593;</button>\';d.appendChild(f);try{f.querySelector("input").focus({preventScroll:true})}catch(x){}f.addEventListener("submit",function(e){e.preventDefault();var m=f.querySelector("input").value.trim();if(!/^\\S+@\\S+\\.\\S+$/.test(m))return;f.remove();bubbel("kx-ik",esc(m));if(!window.__cuMail){if(window.__cuOpen)window.__cuOpen();return}window.__cuMail(m).then(function(){ivK();bubbel("kx-ant",esc(C.t.check))}).catch(function(){bubbel("kx-ant",esc(C.t.fout))})})}function bubbel(c,h){var d=document.createElement("div");d.className=c;d.innerHTML=h;o.appendChild(d);o.hidden=false;return d}'
    + 'function lokaal(q){var tw=w(C.term),qw=w(q).filter(function(x){return tw.indexOf(x)<0}),best=null,bs=0;C.faq.forEach(function(f){var fw=w(f[0]+" "+f[1]),s=0;qw.forEach(function(x){if(fw.indexOf(x)>=0)s+=(w(f[0]).indexOf(x)>=0?2:1)});if(s>bs){bs=s;best=f}});return best&&bs>=3?best[1]:null}'
    + 'function kxProd(d,j){if(!j||!j.producten||!j.producten.length)return;var w=document.createElement("div");w.className="kx-pr";j.producten.slice(0,3).forEach(function(x){var a=document.createElement("a");a.className="kx-pk";a.href=x.u;a.rel="nofollow";a.setAttribute("data-kx","winkel");a.innerHTML=(x.i?"<img src=\'"+esc(x.i)+"\' alt=\'\' loading=\'lazy\' width=\'48\' height=\'48\'>":"<span class=\'kx-pi\'></span>")+"<span><b>"+esc(x.n)+"</b><small>"+esc(x.p+(x.d?" \u00b7 "+x.d:""))+"</small></span><i aria-hidden=\'true\'>\u2192</i>";w.appendChild(a)});d.appendChild(w)}'
    + 'function knop(t,f){var b=document.createElement("button");b.type="button";b.textContent=t;b.onclick=f;return b}'
    + 'function toon(el,j){var h=esc(j.a||C.geen);if(j.pagina)h+="<a class=\'kx-ga\' href=\'"+esc(j.pad||("/"+j.pagina))+"\'>"+esc(C.t.bekijk+" "+(j.pTitel||j.pagina))+" →</a>";el.innerHTML=h;kxProd(el,j);H.push(["k",String(j.a||"")]);if(j.verder&&j.verder.length){var vp=document.createElement("div");vp.className="kx-cp";j.verder.forEach(function(x){var va=document.createElement("a");va.href=x[1];va.textContent=x[0];va.addEventListener("click",function(){stuur({e:"tik"})});vp.appendChild(va)});el.appendChild(vp)}'
    + 'if(j.vervolg){var v=bubbel("kx-ant",esc(j.vervolg));if(j.opties&&j.opties.length){var p=document.createElement("div");p.className="kx-cp";j.opties.forEach(function(x){p.appendChild(knop(x,function(){vraag(x)}))});v.appendChild(p)}}else{var rest=C.faq.filter(function(f){return !G[f[0]]&&f[0].length<=90}).slice(0,3);if(rest.length){var p2=document.createElement("div");p2.className="kx-cp";rest.forEach(function(f){p2.appendChild(knop(f[0],function(){vraag(f[0])}))});el.appendChild(p2)}}'
    + 'var a=document.createElement("div");a.className="kx-act";NA++;var kan=window.__cuVolg||window.__cuOpen||document.getElementById("pushb");if(!meld&&kan&&NA!==BN()){var m=knop(C.t.volgKnop,function(){meld=1;m.remove();if(window.__cuVolg||window.__cuOpen)volgen();else{try{document.getElementById("pushb").click()}catch(x){}stuur({e:"pill"})}});a.appendChild(m)}'
    + 'if(j.samen){var l=document.createElement("a");l.href="https://wa.me/?text="+encodeURIComponent(C.t.deel+" "+location.origin+location.pathname);l.target="_blank";l.rel="noopener";l.textContent=C.t.samen;a.appendChild(l)}'
    + 'if(a.children.length)el.appendChild(a);if(NA===BN()&&!meld&&BV()==="b"){meld=1;stuur({e:"tik"});var bb=bubbel("kx-ant",esc(C.t.blijfVraag));var bq=document.createElement("div");bq.className="kx-cp";bq.appendChild(knop(C.t.perMail,function(){bq.remove();bubbel("kx-ik",esc(C.t.perMail));stuur({e:"pill"});mailVorm()}));if(kan)bq.appendChild(knop(C.t.perPush,function(){bq.remove();bubbel("kx-ik",esc(C.t.perPush));volgen()}));bq.appendChild(knop(C.t.nee,function(){bq.remove();bubbel("kx-ik",esc(C.t.nee))}));bb.appendChild(bq)}else if(NA===2&&!meld&&kan){meld=1;var vb=bubbel("kx-ant",esc(C.t.vraagVolg));var pp=document.createElement("div");pp.className="kx-cp";pp.appendChild(knop(C.t.ja,function(){pp.remove();bubbel("kx-ik",esc(C.t.ja));volgen()}));pp.appendChild(knop(C.t.nee,function(){pp.remove();bubbel("kx-ik",esc(C.t.nee));stuur({e:"tik"})}));vb.appendChild(pp)}if(!j.weet&&!meld){meld=1;var nb=bubbel("kx-ant",esc(C.t.nieuwSein));var nq=document.createElement("div");nq.className="kx-cp";nq.appendChild(knop(C.t.perMail,function(){nq.remove();bubbel("kx-ik",esc(C.t.perMail));stuur({e:"pill"});mailVorm()}));if(kan)nq.appendChild(knop(C.t.perPush,function(){nq.remove();bubbel("kx-ik",esc(C.t.perPush));volgen()}));nq.appendChild(knop(C.t.nee,function(){nq.remove();bubbel("kx-ik",esc(C.t.nee))}));nb.appendChild(nq)}if(!j.weet)open()}'
    + 'function vraag(q){q=String(q||"").trim();if(busy||q.length<2)return;busy=1;[].slice.call(o.querySelectorAll(".kx-cp,.kx-act")).forEach(function(x){x.remove()});G[q]=1;[].forEach.call(document.querySelectorAll("#kx .kx-ps button[data-v]"),function(b){var w=b.parentNode;if(w&&!w.hidden){w.hidden=true;var l=w.previousElementSibling;if(l&&/kx-s/.test(l.className))l.hidden=true}});bubbel("kx-ik",esc(q));var el=bubbel("kx-ant",esc(C.t.denk));var hs=H.slice(-6);H.push(["v",q]);stuur({e:"vraag"});var fq=null;C.faq.forEach(function(f){if(f[0]===q)fq=f});if(fq){cmU("actie");try{fetch("/api/keuze-tools?tool=intentie",{method:"POST",keepalive:true,headers:{"content-type":"text/plain"},body:JSON.stringify({q:q,site:C.taal==="us"||C.taal==="de"?C.taal:"nl",slug:C.slug,bron:"chat",m:1})})}catch(x){}setTimeout(function(){toon(el,{a:fq[1],weet:true,pagina:fq[2]?"1":"",pad:fq[2],pTitel:fq[3]});busy=0;el.scrollIntoView({block:"nearest",behavior:"smooth"})},250);return}'
    + 'fetch("/api/keuze-tools?tool=intentie&op=chat",{method:"POST",headers:{"content-type":"text/plain"},body:JSON.stringify({site:C.taal,slug:C.slug,v:q,h:hs,velden:PV||undefined,sid:ivS(),vt:ivT(),ik:ikL().slice(0,3).map(function(x){return [x.wat,x.voorWie,x.budget,x.wanneer].filter(Boolean).join(", ")})})},cmU("actie")).then(function(r){return r.json()}).then(function(j){if(!j||!j.ok)throw 0;ikZet(j.i);try{var ni=0;["wat","voorWie","budget","wanneer"].forEach(function(k){if(j.i&&j.i[k])ni++});if(ni>=2&&!window.__kxI2){window.__kxI2=1;stuur({e:"intentie"})}}catch(x){}toon(el,j)}).catch(function(){var l=lokaal(q);toon(el,{a:l||C.vd.zin,weet:!!l,verder:l?null:C.vd.l})}).then(function(){busy=0;el.scrollIntoView({block:"nearest",behavior:"smooth"})})}'
    + 'document.getElementById("kxf").addEventListener("submit",function(e){e.preventDefault();var i=document.getElementById("kxq"),q=(i.value||"").trim();i.value="";vraag(q)});'
    + 'var _toon=toon;toon=function(el,j){_toon(el,j);try{window.__kxNa&&window.__kxNa(el,j)}catch(x){}};window.__kx={C:C,vraag:vraag,stuur:stuur,bubbel:bubbel,knop:knop,st:function(){return st},ik:function(){return ikL()[0]}};'
    + '})();</script>' + (o.geenGeheugen ? '' : '<style>' + MIJ_CSS + '</style>' + mijJs()) + (tafelAan(o.taal, o.slug) ? tafelJs(o.taal, o.slug, o.term) : '') + (mn ? mnJs(mn) : '') + adVraagJs(o.slug);
}

// Mening over een zaak in de chat (19 nov 2026, makelaars op keuzehulp.best; Henkjan: "neem mee ook de meningen anoniem in de chat ... We plaatsen
// niet de mening maar de consensus van meerdere meningen"): tik op de regel, kies sterren, schrijf eventueel een paar woorden, verstuur naar mn.u.
// Eén mening per persoon per zaak (localStorage en de server); wat de server terugzegt komt als antwoord in de chat.
const MN_CSS = '.kx-mn{margin:10px 0 0}.kx-mn button{font:inherit;font-size:15px;font-weight:500;line-height:1.35;cursor:pointer;background:#fff;color:#111113;border:1px solid #D1D5DB;border-radius:999px;padding:7px 14px;text-align:left}.kx-mn button:disabled{opacity:.6;cursor:default}.kx-mnf{display:grid;gap:8px}.kx-mnf textarea{font:inherit;font-size:16px;line-height:1.45;border:1px solid #D1D5DB;border-radius:14px;padding:10px 12px;background:transparent;color:inherit;resize:vertical}.kx-mnf button{justify-self:start}'
  + '.kx-dk .kx-mn button{color:#F2F3F5;background:transparent;border-color:#4A5260}.kx-dk .kx-mnf textarea{border-color:#4A5260}';
function mnJs(mn) {
  const M = JSON.stringify({ u: String(mn.u), pl: String(mn.pl || ''), s: String(mn.s || ''), vraag: mn.vraag || 'Hoeveel sterren geef je? Je mening is anoniem.', uitleg: mn.uitleg || 'Wat ging goed of kan beter? Een paar woorden is genoeg. We plaatsen nooit een losse mening, alleen de rode draad van alle meningen samen.', ph: mn.ph || 'Bijvoorbeeld over contact, kennis van de buurt of de prijs', stuur: mn.stuur || 'Verstuur', al: mn.al || 'Je gaf al je mening over dit kantoor. Dank je.', fout: 'Dat lukte niet. Probeer het later nog eens.' }).replace(/</g, '\\u003c');
  return '<style>' + MN_CSS + '</style><script>(function(){var M=' + M + ',b=document.getElementById("kxmn"),o=document.getElementById("kxa");if(!b||!o)return;var K="kzmn:"+M.pl+"/"+M.s,t0=Date.now();'
    + 'function sid(){try{var s=localStorage.getItem("kzsid");if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem("kzsid",s)}return s}catch(e){return ""}}'
    + 'function esc(s){return String(s).replace(/[&<>"]/g,function(x){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[x]})}'
    + 'function bub(c,h){var d=document.createElement("div");d.className=c;d.innerHTML=h;o.appendChild(d);o.hidden=false;return d}'
    + 'function al(){try{return localStorage.getItem(K)}catch(e){return null}}'
    + 'function start(){if(b.disabled)return;if(al()){bub("kx-ant",esc(M.al));return}b.disabled=true;bub("kx-ant",esc(M.vraag));var p=document.createElement("div");p.className="kx-cp";[5,4,3,2,1].forEach(function(n){var k=document.createElement("button");k.type="button";k.textContent=Array(n+1).join("\\u2605")+Array(6-n).join("\\u2606");k.setAttribute("aria-label",n+(n===1?" ster":" sterren"));k.onclick=function(){p.remove();bub("kx-ik",Array(n+1).join("\\u2605"));tekst(n)};p.appendChild(k)});o.appendChild(p);try{p.scrollIntoView({block:"nearest"})}catch(e){}}'
    + 'function tekst(n){bub("kx-ant",esc(M.uitleg));var f=document.createElement("div");f.className="kx-cp kx-mnf";var ta=document.createElement("textarea");ta.maxLength=280;ta.rows=3;ta.placeholder=M.ph;ta.setAttribute("aria-label",M.ph);var s=document.createElement("button");s.type="button";s.textContent=M.stuur;s.onclick=function(){var v=ta.value.trim();f.remove();if(v)bub("kx-ik",esc(v));zend(n,v)};f.appendChild(ta);f.appendChild(s);o.appendChild(f);ta.focus()}'
    + 'function zend(n,t){fetch(M.u,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pl:M.pl,s:M.s,st:n,t:String(t||"").slice(0,280),ms:Date.now()-t0,sid:sid(),website:""})}).then(function(r){return r.json()}).then(function(j){if(j&&(j.ok||j.al)){try{localStorage.setItem(K,"1")}catch(e){}}bub("kx-ant",esc((j&&j.tekst)||M.fout));if(!(j&&(j.ok||j.al)))b.disabled=false}).catch(function(){bub("kx-ant",esc(M.fout));b.disabled=false})}'
    + 'b.addEventListener("click",start);if(/[?&]mening=1/.test(location.search))setTimeout(start,400);'
    + '})();</script>';
}
