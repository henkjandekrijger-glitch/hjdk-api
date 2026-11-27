// Eén sjabloon voor alle productkeuzehulpen op keuzehulp.best, whichtobuy.best en kaufberater.best (27 nov 2026).
// Henkjan: "We gaan alles opschonen . En consistent make dit is een totaale onoverzichtelijke rotzooi geworden" en, na het voorbeeld
// (https://claude.ai/artifact/JYXKwo3AQhogMuEob9jceP): "Ok voer door".
// Opbouw: vraag als titel, één eerste keus met prijs en één knop, de 3 beste, chat (3 pills, antwoord, één winkelknop, één aanbod om te volgen),
// één situatietabel, waar je op let, FAQ, verder kiezen, voet in één regel. Geen stappenplan, tafel, haken, geheugen, delen, pop-up of proeven.
// Opmaak: 4 lettergroottes (13, 16, 22, 32), diktes 400 en 700, één lijnkleur, geen grijs. Controle: scripts/test-sjabloon.mjs.
// Volgknop onder het chatantwoord: tweede tekst 'Stuur mij dit advies per mail' als proef (lib/adviesmail.js), standaard UIT: de schakelaar kv kz:adviesmail:aan
// staat uit tot Henkjan ja zegt; uit = altijd de oude tekst, geen adviesmail.
// Zolang Henkjan het niet live zet, alleen met ?sjabloon=2 (noindex) in fn/kz.js en fn/wtb.js.

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const SJ_TEKST = {
  nl: { lang: 'nl', top: 'De 3 beste van vandaag', bekijk: 'Bekijk bij', kort: 'Bekijk', twijfel: 'Twijfel je? Vraag het', ph: 'Typ je vraag over', sit: 'Welke past bij jouw situatie?', kolom: ['Jouw situatie', 'Onze keuze', 'Prijs'], let: 'Waar je op let', faq: 'Veelgestelde vragen', verder: 'Verder kiezen', bijgewerkt: 'Bijgewerkt', prijzen: 'prijzen van vandaag bij', geenBetaald: 'geen betaalde plaatsing', was: 'was', volg: 'Volg {term} in je ochtendmail', adv: 'Stuur mij dit advies per mail', advOk: 'Gelukt. Het advies staat zo in je mail.', mailPh: 'Je e-mailadres', volgOk: 'Gelukt. Bevestig je adres via de mail die we stuurden.', volgFout: 'Dat lukte niet. Probeer het zo nog eens.', wat: 'Wat bedoel je precies? Typ het product of je situatie, dan kies ik.', denk: 'Even kijken…', ook: 'Bekijk ook', stuur: 'Stuur', voet: 'wij krijgen een kleine vergoeding van {winkel} als je via ons koopt, dat verandert de keuze niet', over: ['Over ons', '/keuzehulp/over'], privacy: ['Privacy', '/keuzehulp/privacy'], alle: ['Alle keuzehulpen', '/keuzehulp'], maanden: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'] },
  us: { lang: 'en', top: 'Today’s top 3', bekijk: 'See on', kort: 'See it', twijfel: 'Not sure? Ask', ph: 'Ask about', sit: 'Which one fits your situation?', kolom: ['Your situation', 'Our pick', 'Price'], let: 'What to look for', faq: 'Questions people ask', verder: 'Keep choosing', bijgewerkt: 'Updated', prijzen: 'prices checked today at', geenBetaald: 'no paid placement', was: 'was', volg: 'Follow {term} in your morning email', adv: 'Email me this advice', advOk: 'Done. The advice is on its way to your inbox.', mailPh: 'Your email address', volgOk: 'Done. Please confirm your address with the email we sent.', volgFout: 'That did not work. Please try again in a moment.', wat: 'What do you mean exactly? Type the product or your situation and I will pick one.', denk: 'Checking…', ook: 'See also', stuur: 'Send', voet: 'we earn a small commission from {winkel} when you buy through us, it does not change the pick', over: ['About', '/about'], privacy: ['Privacy', '/privacy'], alle: ['All guides', '/'], maanden: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] },
  de: { lang: 'de', top: 'Die 3 besten heute', bekijk: 'Ansehen bei', kort: 'Ansehen', twijfel: 'Unsicher? Frag', ph: 'Frag etwas zu', sit: 'Welches passt zu deiner Situation?', kolom: ['Deine Situation', 'Unsere Wahl', 'Preis'], let: 'Worauf es ankommt', faq: 'Häufige Fragen', verder: 'Weiter auswählen', bijgewerkt: 'Aktualisiert', prijzen: 'Preise von heute bei', geenBetaald: 'keine bezahlte Platzierung', was: 'statt', volg: '{term} in deiner Morgenmail folgen', adv: 'Schick mir diesen Rat per Mail', advOk: 'Erledigt. Der Rat ist unterwegs in dein Postfach.', mailPh: 'Deine E-Mail-Adresse', volgOk: 'Erledigt. Bitte bestätige deine Adresse über die Mail, die wir geschickt haben.', volgFout: 'Das hat nicht geklappt. Versuch es gleich noch einmal.', wat: 'Was meinst du genau? Schreib das Produkt oder deine Situation, dann wähle ich.', denk: 'Ich schaue…', ook: 'Siehe auch', stuur: 'Senden', voet: 'wir erhalten eine kleine Provision von {winkel}, wenn du über uns kaufst, das ändert die Wahl nicht', over: ['Über uns', '/about'], privacy: ['Datenschutz', '/privacy'], alle: ['Alle Ratgeber', '/'], maanden: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'] },
};

export const SJ_CSS = ':root{--z:#111113;--l:#D7DCE8;--w:#fff}*{box-sizing:border-box}'
  + 'body{margin:0;background:var(--w);color:var(--z);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif}'
  + 'a{color:var(--z)}.sj-k{font-size:13px}.sj-b{font-weight:700}p{margin:0 0 12px}'
  + 'header.sj{display:flex;justify-content:space-between;align-items:center;max-width:680px;margin:0 auto;padding:16px 20px}'
  + 'header.sj .logo{font-size:22px;font-weight:700;text-decoration:none}header.sj nav a{font-weight:700;text-decoration:none}'
  + 'main.sj{max-width:680px;margin:0 auto;padding:8px 20px 64px}'
  + 'main.sj h1{font-size:32px;line-height:1.15;margin:8px 0}main.sj h2{font-size:22px;line-height:1.25;margin:40px 0 12px}'
  + '.sj-blok{border:1px solid var(--l);border-radius:16px;padding:20px}.sj-prijs{font-size:22px;font-weight:700}'
  + '.sj-knop{display:flex;justify-content:center;align-items:center;width:100%;min-height:52px;border-radius:999px;background:var(--z);color:var(--w);font:inherit;font-weight:700;text-decoration:none;border:2px solid var(--z);cursor:pointer;margin-top:16px}'
  + '.sj-rij{display:grid;grid-template-columns:1fr auto;gap:4px 16px;align-items:center;padding:16px 0;border-bottom:1px solid var(--l)}.sj-rij:last-child{border-bottom:0}.sj-rij a{font-weight:700}.sj-rij div:last-child{text-align:right}'
  + '.sj-pills{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}'
  + '.sj-pill{font:inherit;font-size:16px;background:var(--w);color:var(--z);border:2px solid var(--z);border-radius:999px;padding:10px 16px;cursor:pointer;min-height:44px;text-align:left}.sj-pill.on{background:var(--z);color:var(--w)}'
  + 'form.sj-vraag{display:flex;border:2px solid var(--z);border-radius:999px;padding:4px 4px 4px 18px;margin-top:4px}'
  + 'form.sj-vraag input{flex:1;border:0;font:inherit;font-size:16px;color:var(--z);background:transparent;outline:0;min-width:0}form.sj-vraag input::placeholder{color:var(--z);opacity:1}'
  + 'form.sj-vraag button{width:44px;height:44px;border-radius:999px;border:0;background:var(--z);color:var(--w);font-size:22px;font-weight:700;cursor:pointer}'
  + '.sj-ik{margin:16px 0 12px auto;width:fit-content;max-width:85%;background:var(--z);color:var(--w);font-weight:700;border-radius:18px 18px 4px 18px;padding:10px 16px}'
  + '.sj-zij{border-left:3px solid var(--z);padding:2px 0 2px 16px}.sj-zij .sj-knop{margin:12px 0 8px}'
  + '.sj-volg{display:block;width:100%;font:inherit;font-weight:700;background:none;border:0;padding:8px 0;text-align:left;text-decoration:underline;cursor:pointer;color:var(--z)}'
  + 'main.sj table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--l);border-radius:16px;overflow:hidden}'
  + 'main.sj th,main.sj td{text-align:left;vertical-align:top;padding:14px 16px;border-bottom:1px solid var(--l)}main.sj tr:last-child td{border-bottom:0}'
  + 'main.sj th{font-size:13px;font-weight:700;border-bottom:2px solid var(--z)}main.sj td.p{white-space:nowrap;font-weight:700}'
  + 'main.sj ul{padding-left:20px;margin:0}main.sj li{margin:6px 0}'
  + 'main.sj details{border-bottom:1px solid var(--l);padding:14px 0}main.sj summary{font-weight:700;cursor:pointer;list-style:none}main.sj summary::-webkit-details-marker{display:none}'
  + 'main.sj summary::after{content:"+";float:right;font-weight:700}main.sj details[open] summary::after{content:"–"}main.sj details p{margin:10px 0 0}'
  + '.sj-verder a{display:block;padding:14px 0;border-bottom:1px solid var(--l);font-weight:700;text-decoration:none}.sj-verder a::after{content:" →"}'
  + 'footer.sj{max-width:680px;margin:0 auto;padding:24px 20px 48px;border-top:1px solid var(--l);font-size:13px}'
  + '@media (max-width:420px){main.sj th,main.sj td{padding:12px}}';

export const datumTekst = (taal, d) => { const T = SJ_TEKST[taal] || SJ_TEKST.nl; const x = new Date(String(d || '').slice(0, 10) + 'T12:00:00Z'); if (isNaN(x)) return ''; return taal === 'us' ? T.maanden[x.getUTCMonth()] + ' ' + x.getUTCDate() + ', ' + x.getUTCFullYear() : x.getUTCDate() + (taal === 'de' ? '. ' : ' ') + T.maanden[x.getUTCMonth()] + ' ' + x.getUTCFullYear(); };

// Korte productnaam: tot het eerste streepje, haakje of komma, en hoogstens 60 tekens.
export const kortNaam = t => { const a = String(t || '').replace(/\s+/g, ' ').trim(); const k = a.split(/\s[-–|]\s|\s\(|,\s/)[0].trim(); return (k.length >= 14 ? k : a).slice(0, 60); };

// d: { taal, host, winkel, slug, term, h1, title, desc, canonical, noindex, crumbs:[[tekst, href]], bijgewerkt (JJJJ-MM-DD), kort (tekst),
//   keus:{naam, reden, prijs, was, url}, prods:[{naam, rol, prijs, sterren, url}], pills:[tekst], situaties:[{situatie, keus, prijs, url}],
//   letop:[tekst], faq:[{q,a}], verder:[[tekst, href]], jsonld (object), meet:{site, hitPage, hitClk}, logo }
export function sjabloonHtml(d) {
  const T = SJ_TEKST[d.taal] || SJ_TEKST.nl, w = esc(d.winkel), term = String(d.term || '');
  const prods = (d.prods || []).filter(p => p && p.naam && p.url).slice(0, 3);
  const keus = d.keus && d.keus.naam && d.keus.url ? d.keus : prods[0] ? { naam: prods[0].naam, prijs: prods[0].prijs, url: prods[0].url } : null;
  const ster = s => s ? ' · ★ ' + esc(String(s).replace('.', d.taal === 'us' ? '.' : ',')) : '';
  const meta = [d.bijgewerkt ? T.bijgewerkt + ' ' + datumTekst(d.taal, d.bijgewerkt) : '', prods.length ? T.prijzen + ' ' + d.winkel : '', T.geenBetaald].filter(Boolean).join(' · ');
  const antw = keus ? `<div class="sj-blok" id="sj-keus"><p class="sj-b">${esc(d.kortKop || keus.naam)}</p>${d.kort ? `<p>${esc(d.kort)}</p>` : ''}${keus.prijs ? `<p class="sj-prijs">${esc(keus.prijs)}${keus.was ? ` <span class="sj-k">${esc(T.was)} ${esc(keus.was)}</span>` : ''}</p>` : ''}<a class="sj-knop" href="${esc(keus.url)}" rel="sponsored nofollow noopener" target="_blank" data-sj="keus">${esc(T.bekijk)} ${w}</a></div>`
    : d.kort ? `<div class="sj-blok"><p>${esc(d.kort)}</p>${d.zoekUrl ? `<a class="sj-knop" href="${esc(d.zoekUrl)}" rel="sponsored nofollow noopener" target="_blank" data-sj="zoek">${esc(T.bekijk)} ${w}</a>` : ''}</div>` : '';
  const top = prods.length >= 2 ? `<h2>${esc(T.top)}</h2><div>${prods.map((p, i) => `<div class="sj-rij"><div><span class="sj-b">${esc(p.naam)}</span><br><span class="sj-k">${esc(p.rol || '')}${ster(p.sterren)}</span></div><div>${p.prijs ? `<span class="sj-b">${esc(p.prijs)}</span><br>` : ''}<a href="${esc(p.url)}" rel="sponsored nofollow noopener" target="_blank" data-sj="top${i + 1}">${esc(T.kort)}</a></div></div>`).join('')}</div>` : '';
  const pills = (d.pills || []).filter(Boolean).slice(0, 3);
  // de vraag bij de pills als kop (dagronde 27 nov 2026: op kaufberater stonden 'Ja, mit Wechselrichter' en 'Weiß ich nicht' zonder vraag erboven)
  const pv = pills.length && d.pillVraag ? String(d.pillVraag).replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  const chat = `<h2>${esc(pv || T.twijfel)}</h2>${pills.length ? `<div class="sj-pills">${pills.map(p => `<button type="button" class="sj-pill">${esc(p)}</button>`).join('')}</div>` : ''}<form class="sj-vraag" id="sj-f"><input name="q" maxlength="300" autocomplete="off" placeholder="${esc(T.ph + ' ' + term)}" aria-label="${esc(T.ph + ' ' + term)}"><button aria-label="${esc(T.stuur)}">↑</button></form><div id="sj-gesprek" aria-live="polite"></div>`;
  const sit = (d.situaties || []).filter(r => r && r.situatie && r.keus);
  const tabel = sit.length >= 2 && new Set(sit.map(r => r.keus)).size > 1 ? `<h2>${esc(T.sit)}</h2><table><tr>${T.kolom.map(k => `<th>${esc(k)}</th>`).join('')}</tr>${sit.slice(0, 6).map(r => `<tr><td>${esc(r.situatie)}</td><td>${r.url ? `<a href="${esc(r.url)}" rel="sponsored nofollow noopener" target="_blank" data-sj="sit">${esc(r.keus)}</a>` : esc(r.keus)}</td><td class="p">${esc(r.prijs || '')}</td></tr>`).join('')}</table>` : '';
  const letop = (d.letop || []).filter(Boolean).slice(0, 4);
  // FAQ: eerst de vragen uit Search Console en de aanvulling van de dagronde (lib/aanvulling.js), dan de rest; hoogstens 5 (dagronde 27 nov 2026)
  const faqAlle = (d.faq || []).filter(f => f && f.q && f.a), eerst = f => !!(f.voor || f.bron === 'search-console');
  const faq = faqAlle.filter(eerst).concat(faqAlle.filter(f => !eerst(f))).slice(0, 5);
  // JSON-LD: FAQPage alleen met de vragen die zichtbaar op de pagina staan (Google: gestructureerde data = zichtbare inhoud)
  const ldFaq = o => { const f = n => n && n['@type'] === 'FAQPage' ? (faq.length ? Object.assign({}, n, { mainEntity: faq.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }) : null) : n; return o && Array.isArray(o['@graph']) ? Object.assign({}, o, { '@graph': o['@graph'].map(f).filter(Boolean) }) : f(o); };
  const ldTekst = o => JSON.stringify(ldFaq(o)).replace(/</g, '\\u003c');
  const ldHtml = String(d.ldHtml || '').replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (m, a, j, b) => { try { return a + ldTekst(JSON.parse(j)) + b; } catch (e) { return m; } });
  const verder = (d.verder || []).filter(x => x && x[1]).slice(0, 4);
  const voet = [esc(d.host), esc(T.voet.replace('{winkel}', d.winkel)), `<a href="${esc(T.over[1])}">${esc(T.over[0])}</a>`, `<a href="${esc(T.privacy[1])}">${esc(T.privacy[0])}</a>`].join(' · ');
  const cfg = { taal: d.taal, slug: d.slug, term, pv, prods: prods.map(p => ({ n: p.naam, u: p.url })).concat(keus ? [{ n: keus.naam, u: keus.url }] : []), t: { bekijk: T.bekijk + ' ' + d.winkel, volg: T.volg.replace('{term}', term), adv: T.adv, advOk: T.advOk, mailPh: T.mailPh, ok: T.volgOk, fout: T.volgFout, wat: T.wat, denk: T.denk, ook: T.ook }, meet: d.meet || {} };
  return `<!doctype html><html lang="${T.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.title)}</title><meta name="description" content="${esc(d.desc || '')}"><meta name="robots" content="${d.noindex ? 'noindex,follow' : 'index,follow,max-snippet:-1,max-image-preview:large'}">${d.canonical ? `<link rel="canonical" href="${esc(d.canonical)}">` : ''}<meta property="og:type" content="article"><meta property="og:title" content="${esc(d.title)}"><meta property="og:description" content="${esc(d.desc || '')}">${ldHtml}${d.jsonld ? `<script type="application/ld+json">${ldTekst(d.jsonld)}</script>` : ''}<style>${SJ_CSS}</style>${d.meet && d.meet.site ? `<script src="/cm.js" data-site="${esc(d.meet.site)}" data-modal="geen" async></script>` : ''}</head><body>
<header class="sj"><a class="logo" href="${esc(T.alle[1])}">${esc(d.logo || d.host)}</a><nav><a href="${esc(T.alle[1])}">${esc(T.alle[0])}</a></nav></header>
<main class="sj">${(d.crumbs || []).length ? `<p class="sj-k">${d.crumbs.map(([t, h]) => h ? `<a href="${esc(h)}">${esc(t)}</a>` : esc(t)).join(' › ')}</p>` : ''}
<h1>${esc(d.h1)}</h1><p class="sj-k">${esc(meta)}</p>
${antw}
${top}
${chat}
${tabel}
${letop.length ? `<h2>${esc(T.let)}</h2><ul>${letop.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
${faq.length ? `<h2>${esc(T.faq)}</h2>${faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : ''}
${verder.length ? `<h2>${esc(T.verder)}</h2><div class="sj-verder">${verder.map(([t, h]) => `<a href="${esc(h)}">${esc(t)}</a>`).join('')}</div>` : ''}
</main><footer class="sj">${voet}</footer>
<script>window.__SJ=${JSON.stringify(cfg).replace(/</g, '\\u003c')};${SJ_JS}</script></body></html>`;
}

// Chat en meting in de browser: pill of vraag naar /api/keuze-tools?tool=intentie&op=chat, één antwoord, één winkelknop, één aanbod om te volgen.
// Weet de chat het niet, dan een eerlijke wedervraag (geen reserve-tekst, geen link naar een andere site). Interne opdrachten komen nooit in beeld.
const SJ_JS = `(function(){var C=window.__SJ,g=document.getElementById('sj-gesprek'),f=document.getElementById('sj-f'),bezig=0,volgGetoond=0,AM={arm:null,p:[]},advP=null;
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var cv=0;function conv(w){var c=C.meet.conv;if(!c||cv)return;cv=1;var ok=false;try{ok=navigator.sendBeacon('/api/kz/conv',new Blob([JSON.stringify({c:c.c,w:w})],{type:'text/plain'}))}catch(x){}if(!ok){try{fetch(c.pb,{mode:'no-cors',keepalive:true})}catch(x){}}}
function hit(k){if(!k)return;try{navigator.sendBeacon('/api/hjdk/stats/hits',new Blob([JSON.stringify({hits:[[k,1]]})],{type:'text/plain'}))}catch(x){}}
function sid(){try{var s=localStorage.getItem('kzsid');if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('kzsid',s)}return s}catch(x){return ''}}
function adv(){if(!advP){var s=sid();advP=s?Promise.race([fetch('/api/keuze-updates?op=adviestekst&sid='+encodeURIComponent(s)).then(function(r){return r.json()}).then(function(j){return j&&j.ok&&j.aan&&(j.arm==='a'||j.arm==='b')?{arm:j.arm}:null}).catch(function(){return null}),new Promise(function(r){setTimeout(function(){r(null)},1500)})]):Promise.resolve(null)}return advP}
function advHit(k){try{navigator.sendBeacon('/api/keuze-updates?op=advieshit',new Blob([JSON.stringify({sid:sid(),kind:k})],{type:'text/plain'}))}catch(x){}}
function knopVoor(a){var t=String(a||'').toLowerCase(),b=null;(C.prods||[]).forEach(function(p){if(b)return;var w=String(p.n).toLowerCase().split(/\\s+/).filter(function(x){return x.length>2}).slice(0,3);if(w.length&&w.every(function(x){return t.indexOf(x)>=0}))b=p});return b}
function vraag(tekst,isPill){if(bezig||!tekst)return;bezig=1;var ik=document.createElement('div');ik.className='sj-ik';ik.textContent=tekst;g.appendChild(ik);var z=document.createElement('div');z.className='sj-zij';z.innerHTML='<p>'+e(C.t.denk)+'</p>';g.appendChild(z);
hit(C.meet.hitVraag);conv('start');var ap=adv();var v=isPill?(C.pv?C.pv+' '+tekst:tekst)+' ('+C.term+')':tekst;
fetch('/api/keuze-tools?tool=intentie&op=chat',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({site:C.taal,slug:C.slug,v:v,h:[],sid:sid(),vt:'sj',pc:0})}).then(function(r){return r.json()}).then(function(j){return ap.then(function(A){
var weet=j&&j.ok&&j.weet!==false&&j.a;var h='<p>'+e(weet?j.a:C.t.wat)+'</p>';var p=weet?knopVoor(j.a):null;
if(!p&&weet&&j.producten&&j.producten[0]&&j.producten[0].url)p={n:j.producten[0].naam||'',u:j.producten[0].url};
if(p)h+='<a class="sj-knop" href="'+e(p.u)+'" rel="sponsored nofollow noopener" target="_blank" data-sj="chat">'+e(C.t.bekijk)+'</a>';
if(weet&&j.pagina&&j.pagina!==C.slug&&j.pad&&/^\\/[a-z0-9-]+$/.test(j.pad)&&j.pTitel)h+='<p>'+e(C.t.ook)+': <a href="'+e(j.pad)+'">'+e(j.pTitel)+'</a></p>';
if(weet&&!volgGetoond){volgGetoond=1;AM.arm=A?A.arm:null;AM.p=p&&p.n?[p.n]:[];if(AM.arm)advHit('getoond');h+='<button type="button" class="sj-volg" id="sj-volg">'+e(AM.arm==='b'?C.t.adv:C.t.volg)+'</button>'}
z.innerHTML=h;var vb=document.getElementById('sj-volg');if(vb)vb.onclick=volg;bezig=0})}).catch(function(){z.innerHTML='<p>'+e(C.t.wat)+'</p>';bezig=0})}
function volg(){var b=document.getElementById('sj-volg');var fm=document.createElement('form');fm.className='sj-vraag';fm.innerHTML='<input type="email" required autocomplete="email" inputmode="email" placeholder="'+e(C.t.mailPh)+'" aria-label="'+e(C.t.mailPh)+'"><button aria-label="ok">↑</button>';b.replaceWith(fm);hit(C.meet.hitVolg);if(AM.arm)advHit('getikt');
fm.onsubmit=function(x){x.preventDefault();var m=fm.querySelector('input').value.trim();if(!/^\\S+@\\S+\\.\\S+$/.test(m))return;
if(AM.arm==='b'){fetch('/api/keuze-updates?op=adviesmail',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({sid:sid(),slug:C.slug,p:AM.p,email:m,website:''})}).then(function(r){return r.json()}).then(function(j){if(!j||!j.ok)throw 0;fm.outerHTML='<p class="sj-b">'+e(C.t.advOk)+'</p>';hit(C.meet.hitMail);try{if(window.mmUitkomst)window.mmUitkomst('aanmelding')}catch(_){}}).catch(function(){var p=document.createElement('p');p.textContent=C.t.fout;fm.after(p)});return}
fetch('/api/keuze-updates?op=config&slug='+encodeURIComponent(C.slug)).then(function(r){return r.json()}).then(function(c){if(!c||!c.ok)throw 0;return fetch('/api/keuze-updates?op=subscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:c.token,email:m,zone:Intl.DateTimeFormat().resolvedOptions().timeZone,website:''})})}).then(function(r){return r.json()}).then(function(j){if(!j||!j.ok)throw 0;fm.outerHTML='<p class="sj-b">'+e(C.t.ok)+'</p>';hit(C.meet.hitMail);if(AM.arm)advHit('adres');try{if(window.mmUitkomst)window.mmUitkomst('aanmelding')}catch(_){}}).catch(function(){var p=document.createElement('p');p.textContent=C.t.fout;fm.after(p)})}}
document.querySelectorAll('.sj-pill').forEach(function(b){b.onclick=function(){document.querySelectorAll('.sj-pill').forEach(function(x){x.classList.remove('on')});b.classList.add('on');vraag(b.textContent,1)}});
if(f)f.onsubmit=function(x){x.preventDefault();var q=f.q.value.trim();f.q.value='';vraag(q,0)};
document.addEventListener('click',function(x){var a=x.target.closest&&x.target.closest('a[data-sj]');if(a){conv('start');hit(C.meet.hitClk);hit(C.meet.hitClkAll);hit(C.meet.hitClk&&C.meet.hitClk+'-'+a.getAttribute('data-sj'))}},true);
hit(C.meet.hitPage)})();`;

// Hulp voor de aanroepers: hoogstens n korte zinnen uit een lopende tekst (zonder links of opmaak).
// Zinnen splitsen zonder getallen te breken (1.500 W, 4,5 l, ca. of z.B.): punt tussen cijfers en na een kort woord telt niet als zinseinde.
export function zinLijst(t) { const a = String(t || '').replace(/<[^>]+>/g, '').replace(/\[(\d+)\]/g, '').replace(/\s+/g, ' ').trim().replace(/(\d)\.(\d)/g, '$1\u2024$2').replace(/\b(ca|bijv|bv|z\.B|bzw|usw|etc|e\.g|i\.e|vs|Nr|nr|incl|excl|min|max|ong)\./g, '$1\u2024'); return (a.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || []).map(x => x.replace(/\u2024/g, '.').trim()).filter(Boolean); }
export function zinnen(t, n = 2, max = 220) { const z = zinLijst(t); const out = []; for (const x of z) { const y = x.trim(); if (!y) continue; if (out.join(' ').length + y.length > max && out.length) break; out.push(y); if (out.length >= n) break; } return out.join(' '); }
export const KEUS_LABEL = { nl: 'Onze keuze', us: 'Our pick', de: 'Unsere Wahl' };
