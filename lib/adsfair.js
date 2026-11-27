// AdsFair-site, adsfair.xyz (Henkjan 27 nov 2026: "Doe iedere week een update op adsfair website en laat me dat eerst zien ... zet dit als apart project
// te onderhouden in dashboard is onze comms. Zet samenvatting alle projecten die live zijn erbij en haal weg wat niet meer relevant is").
//
// Hoe het werkt:
// - adsfair.xyz is het Vercel-project adsfair (geen repo). Zijn vercel.json herschrijft /, /updates en /llms.txt naar
//   https://keuzehulp.best/api/mm/adsfair?vorm=pagina|updates|llms. Deze module maakt die pagina's. Stijl, favicon, track.js en og.png blijven daar staan.
// - De inhoud per week (kop, updates, de lijst van alles wat live is) staat in kv: mm:adsfair:live (wat er nu staat), mm:adsfair:concept (wat wacht),
//   mm:adsfair:weken (archief per week voor /updates). Zolang er nog geen goedgekeurde week is, geeft vorm=pagina de oude pagina (adsfair.xyz/oud.html).
// - Elke vrijdag maakt een geplande taak het concept volgens WERKWIJZE (vorm=werkwijze) en zet het met zet concept. Dat maakt meteen een vraag in
//   Henkjans lijst met het voorbeeld (toon). Zijn Ja van zijn gekoppelde toestel zet het live (lib/taken.js taakAntwoord roept publiceer aan).
//   Een agent kan niets live zetten: publiceer draait alleen vanuit zijn antwoord. Typt hij iets anders, dan maakt de oppakker een nieuwe versie.
const HOST = 'https://hjdk-api-henq.vercel.app';

const LIVE = 'mm:adsfair:live', CONCEPT = 'mm:adsfair:concept', WEKEN = 'mm:adsfair:weken', OMGEZET = 'mm:adsfair:omgezet';
// Eenmalig: adsfair.xyz overzetten van de statische pagina naar deze module. Klaar staat Vercel-deployment OMZET_DPL (project adsfair, preview, 27 nov 2026);
// na Henkjans eerste Ja promoveert de oppakker die naar productie en zet ?zet={"omgezet":"<deployment-id>"}. Tot dan blijft de oude pagina staan.
export const OMZET_DPL = 'dpl_7HZKfPc9XECdWXyD7EHDEcrdrUfq';
const SITE = 'https://adsfair.xyz', PUB = 'https://keuzehulp.best/api/mm/adsfair';
export const ADSFAIR = { SITE, PUB, LIVE, CONCEPT, WEKEN };

const kort = (x, n) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, n);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const https = x => (/^https:\/\/[^\s"<>]{4,300}$/.test(String(x || '')) ? String(x) : '');
const rid = () => (Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8)).padEnd(12, '0');
const lees = async (kv, k) => { try { const r = await kv.raw(['GET', k]); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
const MAANDEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ISO-week van een tijdstip: { id: '2026-W48', week, jaar, label: 'Week 48 · 23 to 29 November 2026' }
export function isoWeek(t = Date.now()) {
  const d = new Date(t), dag = (d.getUTCDay() + 6) % 7, ma = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dag), don = new Date(ma + 3 * 864e5);
  const jaar = don.getUTCFullYear(), week = Math.ceil(((don - Date.UTC(jaar, 0, 1)) / 864e5 + 1) / 7), a = new Date(ma), z = new Date(ma + 6 * 864e5);
  const dm = x => x.getUTCDate() + ' ' + MAANDEN[x.getUTCMonth()];
  const label = 'Week ' + week + ' · ' + (a.getUTCMonth() === z.getUTCMonth() ? a.getUTCDate() : dm(a) + (a.getUTCFullYear() === z.getUTCFullYear() ? '' : ' ' + a.getUTCFullYear())) + ' to ' + dm(z) + ' ' + z.getUTCFullYear();
  return { id: jaar + '-W' + String(week).padStart(2, '0'), week, jaar, label, ma: a.toISOString().slice(0, 10) };
}
const weekVan = id => { const m = /^(\d{4})-W(\d{2})$/.exec(String(id || '')); if (!m) return null; const j4 = Date.UTC(+m[1], 0, 4), ma = j4 - ((new Date(j4).getUTCDay() + 6) % 7) * 864e5 + (+m[2] - 1) * 7 * 864e5; const w = isoWeek(ma); return w.id === id ? w : null; };

// Regels voor de tekst (die gaan publiek): Henkjans eisen (geen gedachtestreepjes, niet als AI), geen interne tools of cijfers.
const STREEP = /[–—]/, INTERN = /\b(clickmind|mailmind|videomind|propeller ?ads|mondiad|richads|mgid|clickadu|zernio|dashboard|oppakker|vangnet|vercel|kv|cpa|cpc|roas|tl;?dr|bleeders?|campagne|campaign|ad spend|advertentiekosten)\b/i;
export const REGELS = [
  'Engels, kort, voor klanten en partners: wat er voor een gebruiker nieuw is. Alleen wat deze week echt live ging (bron: vorm=bron), nooit wat nog concept of uit staat.',
  'Geen gedachtestreepjes, geen TL;DR, geen stopwoorden, geen superlatieven. Geen interne tools (Clickmind, Mailmind, Videomind, dashboard), geen netwerken of campagnes, geen kosten, omzet of bezoekcijfers.',
  'Geen namen van mensen behalve Henkjan de Krijger en Tania Kross. Geen medische claims. GoonFree alleen als app voor volwassenen, zonder andermans merknamen.',
  'Elke update en elk project een https-link die werkt. Het overzicht (live) bevat alleen wat publiek live staat; haal weg wat stopte of niet meer relevant is.',
];

const tekstFout = (s, waar) => STREEP.test(s) ? waar + ': geen gedachtestreepjes (– of —)' : INTERN.test(s) ? waar + ': intern woord "' + s.match(INTERN)[0] + '" hoort niet op de publieke site' : '';

// Controle van een concept. Geeft { ok, v } of { ok:false, fout }.
export function check(c, vorige, nu = Date.now()) {
  c = c && typeof c === 'object' ? c : {};
  const w = c.week ? weekVan(c.week) : isoWeek(nu); if (!w) return { ok: false, fout: 'week: JJJJ-Www, bijvoorbeeld ' + isoWeek(nu).id };
  const kop = kort(c.kop, 200); if (kop.length < 20) return { ok: false, fout: 'kop: één zin van 20 tot 200 tekens die de week samenvat' };
  const updates = (Array.isArray(c.updates) ? c.updates : []).map(u => ({ project: kort(u && u.project, 40), tekst: kort(u && u.tekst, 320), link: https(u && u.link) }));
  if (updates.length < 2 || updates.length > 7) return { ok: false, fout: 'updates: 2 tot 7 regels {"project","tekst","link"}' };
  for (const [i, u] of updates.entries()) { if (u.project.length < 2 || u.tekst.length < 20 || !u.link) return { ok: false, fout: 'update ' + (i + 1) + ': project, tekst (20 tot 320 tekens) en een https-link' }; }
  const live = Array.isArray(c.live) ? c.live.map(x => ({ naam: kort(x && x.naam, 40), wat: kort(x && x.wat, 240), url: https(x && x.url) })) : ((vorige && vorige.live) || []);
  if (live.length < 3 || live.length > 24) return { ok: false, fout: 'live: 3 tot 24 projecten {"naam","wat","url"} (laat live weg om de lijst van vorige week te houden)' };
  for (const [i, x] of live.entries()) { if (x.naam.length < 2 || x.wat.length < 20 || !x.url) return { ok: false, fout: 'live ' + (i + 1) + ': naam, wat (20 tot 240 tekens) en een https-url' }; }
  for (const [s, waar] of [[kop, 'kop'], ...updates.flatMap((u, i) => [[u.project + ' ' + u.tekst, 'update ' + (i + 1)]]), ...live.map((x, i) => [x.naam + ' ' + x.wat, 'live ' + (i + 1) + ' (' + x.naam + ')'])]) { const f = tekstFout(s, waar); if (f) return { ok: false, fout: f }; }
  return { ok: true, v: { week: w.id, label: w.label, kop, updates, live } };
}

// ---------- de pagina ----------
const toon = u => { try { const x = new URL(u); if (x.hostname === 'play.google.com') return 'Google Play'; if (x.hostname === 'apps.apple.com') return 'App Store'; const p = x.pathname.replace(/\/+$/, ''), eerste = p.split('/')[1] || ''; return x.hostname.replace(/^www\./, '') + (eerste.length > 3 ? p : ''); } catch (e) { return ''; } };
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
const rij = (x, kop, tekst, spoor) => '<a href="' + esc(x) + '" data-track="outbound_' + esc(spoor) + '"><b>' + esc(kop) + '</b><span>' + esc(tekst) + '</span><span class="go">' + esc(toon(x)) + ' →</span></a>';
const NEXY = 'https://nexy.works', IOS = 'https://apps.apple.com/app/id6786402997', PLAY = 'https://play.google.com/store/apps/details?id=works.nexy.mobile';
const namen = live => { const n = live.map(x => x.naam); return n.length < 2 ? n.join('') : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1]; };
const FAQ = live => [
  ['Why is Nexy the main thing?', 'Because the living web is the conversations people already have. Nexy is the product for that: a messenger where the assistant sits inside the conversation, so what was decided gets remembered and done.'],
  ['Is Nexy an app?', 'Yes. Nexy is an app for iPhone (App Store) and Android (Google Play), and it runs on the web at nexy.works. All versions share one memory. Free to start.'],
  ['What does AdsFair run?', namen(live) + '. Each one has its own line under What\'s live, with a link.'],
  ['How often does this page change?', 'Every week. The update lists what changed in each product, and the founder checks it before it goes live.'],
  ['Do the other people need Nexy?', 'No. Someone without Nexy can join a call from a browser without an account, and WhatsApp and Telegram can be connected, so Nexy also works with people who are not on it yet.'],
];
function jsonLd(live) {
  const org = { '@type': 'Organization', '@id': SITE + '/#org', name: 'AdsFair B.V.', alternateName: 'Adsfair BV', url: SITE, logo: SITE + '/favicon.svg', email: 'henkjan@adsfair.xyz', foundingDate: '2014-02-26',
    founder: { '@type': 'Person', '@id': SITE + '/#founder', name: 'Henkjan de Krijger', sameAs: ['https://www.linkedin.com/in/henkjandekrijger'] },
    address: { '@type': 'PostalAddress', streetAddress: 'Albert Plesmanplein 20', postalCode: '2805 AB', addressLocality: 'Gouda', addressCountry: 'NL' }, areaServed: 'Worldwide', vatID: 'NL853775485B01', identifier: 'KVK 60126035', telephone: '+31655395630',
    brand: live.map(x => ({ '@type': 'Brand', name: x.naam, url: x.url, description: x.wat })), sameAs: ['https://www.linkedin.com/in/henkjandekrijger'].concat(live.map(x => x.url)) };
  const app = { '@type': 'MobileApplication', name: 'Nexy: Stop Managing Everything', alternateName: 'Nexy', url: NEXY, applicationCategory: 'CommunicationApplication', operatingSystem: 'iOS, Android, Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, sameAs: [IOS, PLAY], publisher: { '@id': SITE + '/#org' }, description: 'The messenger with an assistant woven in: she remembers, plans and follows up, at home and at work.' };
  const faq = { '@type': 'FAQPage', mainEntity: FAQ(live).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, { '@type': 'WebSite', '@id': SITE + '/#site', url: SITE, name: 'AdsFair', publisher: { '@id': SITE + '/#org' }, inLanguage: 'en' }, app, faq] }).replace(/</g, '\\u003c');
}
function kopHtml(titel, desc, opt) {
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + esc(titel) + '</title>\n<meta name="description" content="' + esc(desc) + '">\n'
    + (opt.concept ? '<meta name="robots" content="noindex, nofollow">\n' : '<link rel="canonical" href="' + esc(opt.canon || SITE) + '">\n')
    + '<meta name="theme-color" content="#ffffff">\n<meta name="author" content="Henkjan de Krijger">\n<link rel="author" href="https://www.linkedin.com/in/henkjandekrijger">\n'
    + '<meta property="og:type" content="website">\n<meta property="og:site_name" content="AdsFair">\n<meta property="og:locale" content="en_GB">\n<meta property="og:url" content="' + esc(opt.canon || SITE) + '">\n<meta property="og:title" content="' + esc(titel) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n'
    + '<meta property="og:image" content="' + SITE + '/og.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + esc(titel) + '">\n<meta name="twitter:description" content="' + esc(desc) + '">\n<meta name="twitter:image" content="' + SITE + '/og.png">\n'
    + '<link rel="icon" href="' + SITE + '/favicon.svg" type="image/svg+xml">\n<link rel="alternate" type="text/plain" href="' + SITE + '/llms.txt" title="LLM summary">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700;750&display=swap">\n<link rel="stylesheet" href="' + SITE + '/styles.css?v=20261105">\n'
    + (opt.ld ? '<script type="application/ld+json">' + opt.ld + '</script>\n' : '') + '</head>\n<body>\n<a class="skip" href="#content">Skip to content</a>\n'
    + '<header class="bar"><div class="wrap-wide"><a class="mark" href="' + SITE + '/">ads<span>fair</span></a><nav aria-label="Primary"><a href="' + SITE + '/#week">This week</a><a href="' + SITE + '/#live">What\'s live</a><a href="' + SITE + '/#nexy">Nexy</a><a href="' + SITE + '/#about">About</a><a class="go" href="' + NEXY + '" data-track="outbound_nexy" data-nexy-get>Get Nexy</a></nav></div></header>\n'
    + (opt.concept ? '<div class="wrap" style="padding-top:16px"><div class="answer"><p><b>Voorbeeld, nog niet live.</b> ' + esc(opt.concept) + '</p></div></div>\n' : '');
}
function voetHtml(live, opt) {
  const lijst = live.map(x => '<li><a href="' + esc(x.url) + '" data-track="outbound_' + slug(x.naam) + '">' + esc(x.naam) + '</a></li>').join('');
  const drie = live.slice(0, 3).map(x => x.naam), rest = live.length - drie.length;
  return '<footer class="site-footer"><div class="wrap-wide">\n<div class="fgrid">\n<div style="max-width:24rem"><p class="fbrand">ads<span>fair</span></p><p style="margin-top:8px">A Dutch internet company behind ' + esc(drie.join(', ')) + (rest > 0 ? ' and ' + rest + ' more live products' : '') + '.</p>'
    + '<p style="margin-top:12px">Contact: <a href="mailto:henkjan@adsfair.xyz">henkjan@adsfair.xyz</a><br>Phone / WhatsApp: <a href="https://wa.me/31655395630" data-track="outbound_whatsapp">+31 6 55 39 56 30</a><br>Video call: <a href="https://meeting.nexy.works/a54blu" data-track="outbound_meeting">start one now</a></p></div>\n'
    + '<div><p class="eyebrow">Products</p><ul class="flist">' + lijst + '</ul></div>\n'
    + '<div><p class="eyebrow">Company</p><ul class="flist"><li><a href="' + SITE + '/#week">This week</a></li>' + (opt.archief ? '<li><a href="' + SITE + '/updates">Earlier weeks</a></li>' : '') + '<li><a href="' + SITE + '/#about">About &amp; contact</a></li><li><a href="https://www.linkedin.com/in/henkjandekrijger" data-track="outbound_linkedin">LinkedIn</a></li><li><a href="' + SITE + '/terms">Terms of service</a></li><li><a href="' + SITE + '/privacy">Privacy policy</a></li></ul></div>\n</div>\n'
    + '<div class="fsmall">\n<p>AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, The Netherlands. Also operating from Curaçao. KVK 60126035, VAT NL853775485B01. Registered 26 February 2014. Dutch and EU consumer law applies. Not an advertising network. Founder: Henkjan de Krijger.</p>\n'
    + '<p>No advertising cookies and no third-party ad trackers. First-party analytics (Vercel) records page and section views so we can see which parts of the site are read. No account is required. This site contains no affiliate links and nothing on it is sponsored.</p>\n'
    + '<p>© ' + new Date().getUTCFullYear() + ' AdsFair B.V. · <a href="' + SITE + '">adsfair.xyz</a> · <a href="' + NEXY + '">nexy.works</a> · <a href="https://kadoly.com">kadoly.com</a> · <a href="https://curacao.day">curacao.day</a></p>\n</div>\n</div></footer>\n'
    + '<script>(function(){var ua=navigator.userAgent||"",d=/iPhone|iPad|iPod/.test(ua)?"' + IOS + '":/Android/.test(ua)?"' + PLAY + '":null;if(d)document.querySelectorAll("[data-nexy-get]").forEach(function(a){a.href=d})})();</script>\n'
    + (opt.concept ? '' : '<script src="' + SITE + '/track.js" defer></script>\n<script defer src="/_vercel/insights/script.js"></script>\n') + '</body>\n</html>\n';
}
const weekBlok = (w, kopTag = 'h2') => '<p class="eyebrow">' + esc(w.label) + '</p>\n<' + kopTag + ' class="sec top">' + esc(w.kop) + '</' + kopTag + '>\n<div class="rows">' + w.updates.map(u => rij(u.link, u.project, u.tekst, 'week_' + slug(u.project))).join('') + '</div>\n';

// De hele voorpagina uit één week (live of concept).
export function pagina(w, opt = {}) {
  const live = w.live, n = live.filter(x => !/^nexy$/i.test(x.naam)).length;
  const desc = 'AdsFair B.V. is the Dutch internet company behind ' + namen(live.slice(0, 4)) + ' and more. Every week: what changed in each product, and everything that is live.';
  return kopHtml('AdsFair | We research the living web', desc, Object.assign({ ld: opt.concept ? '' : jsonLd(live) }, opt))
    + '<main id="content">\n<article class="wrap" style="padding-bottom:32px">\n'
    + '<header class="hero"><p class="kicker"><i aria-hidden="true"></i>AdsFair</p>\n<h1>We research the living web.</h1>\n<p class="standfirst">The living web is not a feed. It is the conversations, plans and shops that keep moving after you close the tab. AdsFair builds the software that stays inside that motion.</p></header>\n'
    + '<div class="answer">\n<p><b>Nexy is the main work: the messenger with an assistant woven in.</b> She remembers what was decided, who does what and where you need to be, then plans and follows up, at home and at work. Nexy is an app for iPhone and Android, and runs on the web at <a href="' + NEXY + '" data-track="outbound_nexy">nexy.works</a>.</p>\n'
    + '<p>Around it run ' + n + ' more live products. Each one is listed below, with what changed this week.</p>\n</div>\n'
    + '<div class="btns mb-10"><a class="btn" href="' + NEXY + '" data-track="outbound_nexy" data-nexy-get>Get Nexy →</a><a class="btn ghost" href="#live">See what\'s live</a></div>\n\n'
    + '<section id="week">' + weekBlok(w) + (opt.archief ? '<div class="links"><a href="' + SITE + '/updates">Earlier weeks</a></div>\n' : '') + '</section>\n\n'
    + '<section id="live"><p class="eyebrow">What\'s live</p>\n<h2 class="sec top">Everything AdsFair runs, in one list.</h2>\n<div class="rows">' + live.map(x => rij(x.url, x.naam, x.wat, slug(x.naam))).join('') + '</div>\n</section>\n\n'
    + '<section id="nexy"><p class="eyebrow">The main work</p>\n<div class="featured"><h2>Nexy</h2><p>Stop being the one who manages everything. At home and at work, it\'s you who remembers what was decided, who does what, and where you need to be. Give that job to Nexy. She remembers, plans and follows up. You just talk.</p>\n'
    + '<div class="btns stores"><a class="btn" href="' + IOS + '" data-track="outbound_nexy_appstore">Download on the App Store</a><a class="btn" href="' + PLAY + '" data-track="outbound_nexy_googleplay">Get it on Google Play</a><a class="btn ghost" href="' + NEXY + '" data-track="outbound_nexy">Use it on the web</a></div></div>\n'
    + '<div class="chat" aria-label="Example Nexy conversation">\n<div class="row you"><div><p class="who">YOU</p><p class="b">Ask the ski group who can pick up the lift passes on Friday, and remind whoever says yes.</p></div></div>\n<div class="row nx"><div><p class="who">NEXY</p><p class="b">Sent. Three people answered. Tom will collect them Friday morning. I will nudge him Thursday at 18:00.</p></div></div>\n</div>\n'
    + '<p class="caption">You chat, send a voice memo, a photo or a call. Nexy files it, remembers the decision, gives the task an owner and sets the reminder. iPhone, Android and web share one memory.</p>\n'
    + '<h2 class="sec">What Nexy does</h2>\n<p class="p">Plans, reminders, questions, calls, staying in touch: every one of those is a chain of small messages. Nexy takes the chain.</p>\n'
    + '<div class="rows"><div><b>Photo reminders</b><span>Photograph a school letter, a schedule or an invoice. Nexy reads the dates, asks who they concern and sets the reminders.</span></div><div><b>Group chats that produce</b><span>Decisions and tasks come out of the conversation, each with an owner and a date.</span></div><div><b>Calls with a recap</b><span>Nexy joins your call and writes the agreed points and your to-dos in the chat. She can also answer the calls you miss and brief you after.</span></div><div><b>Ask a group anonymously</b><span>Nexy puts one question to a whole group for you, without saying it came from you.</span></div><div><b>Screening</b><span>Messages from unknown senders, WhatsApp included, are screened. Nexy replies in your tone and passes on only what matters.</span></div></div>\n'
    + '<h2 class="sec">How Nexy is built</h2>\n<div class="rows"><div><b>One memory, every device</b><span>The iPhone app, the Android app and the web version share the same memory. WhatsApp and Telegram can be connected.</span></div><div><b>Your photos stay with you</b><span>What you photograph becomes a date and a reminder; the photo stays yours.</span></div><div><b>Nobody is listened to in secret</b><span>When Nexy is on a call, the other side is told.</span></div><div><b>Guests need nothing</b><span>Someone without Nexy can join a call from a browser, no account needed. Free to start.</span></div></div>\n</section>\n\n'
    + '<section id="about"><h2 class="sec">About</h2>\n<p class="p">AdsFair B.V. is a Dutch internet company, registered in Gouda since 26 February 2014 (KVK 60126035). It builds and runs the products listed above from Gouda and Curaçao. It is not an advertising network.</p>\n'
    + '<p class="p"><b>Henkjan de Krijger</b> is the founder. <a href="https://www.linkedin.com/in/henkjandekrijger" data-track="outbound_linkedin">LinkedIn</a></p>\n'
    + '<div class="rows"><div><b>Talk to us</b><span><a href="https://meeting.nexy.works/a54blu" data-track="outbound_meeting">Start a video call now</a> · <a href="mailto:henkjan@adsfair.xyz">henkjan@adsfair.xyz</a> · <a href="https://wa.me/31655395630" data-track="outbound_whatsapp">WhatsApp +31 6 55 39 56 30</a></span></div></div>\n</section>\n\n'
    + '<section id="faq"><h2 class="sec">Common questions</h2>' + FAQ(live).map(([q, a]) => '<details class="faq"><summary><h3>' + esc(q) + '</h3></summary><p>' + esc(a) + '</p></details>').join('') + '</section>\n\n'
    + '<div class="cta"><h3>Give that job to Nexy.</h3><p>She remembers, plans and follows up. You just talk.</p><div class="btns"><a class="btn" href="' + IOS + '" data-track="outbound_nexy_appstore">Download on the App Store</a><a class="btn" href="' + PLAY + '" data-track="outbound_nexy_googleplay">Get it on Google Play</a></div></div>\n'
    + '</article>\n</main>\n' + voetHtml(live, opt);
}

// /updates: alle goedgekeurde weken, nieuwste boven.
export function updatesPagina(weken, live) {
  const lijst = Object.values(weken || {}).filter(w => w && w.week).sort((a, b) => (a.week < b.week ? 1 : -1));
  return kopHtml('Weekly updates | AdsFair', 'What changed in the products of AdsFair B.V., week by week.', { canon: SITE + '/updates' })
    + '<main id="content">\n<article class="wrap" style="padding-bottom:32px">\n<header class="hero"><p class="kicker"><i aria-hidden="true"></i>AdsFair</p>\n<h1>Weekly updates.</h1>\n<p class="standfirst">What changed in each product, week by week. Every update is checked by the founder before it goes live.</p></header>\n'
    + lijst.map(w => '<section id="' + esc(w.week) + '">' + weekBlok(w) + '</section>\n').join('\n') + '</article>\n</main>\n' + voetHtml(live || [], { archief: true });
}

export function llms(w) {
  const L = ['# AdsFair', '', '> AdsFair B.V. is a Dutch internet company in Gouda and Curaçao (KVK 60126035, founded 2014, founder Henkjan de Krijger). Nexy, the messenger with an assistant woven in, is the main work. This file lists everything AdsFair runs and what changed this week.', '', '## Live products', ''];
  for (const x of w.live) L.push('- [' + x.naam + '](' + x.url + '): ' + x.wat);
  L.push('', '## ' + w.label, '', w.kop, ''); for (const u of w.updates) L.push('- ' + u.project + ': ' + u.tekst + ' (' + u.link + ')');
  L.push('', '## Company', '', '- Address: Albert Plesmanplein 20, 2805 AB Gouda, The Netherlands. VAT NL853775485B01.', '- Contact: henkjan@adsfair.xyz, WhatsApp +31 6 55 39 56 30', '- Not an advertising network. No affiliate links or sponsored content on adsfair.xyz.', '- Earlier weeks: ' + SITE + '/updates', '');
  return L.join('\n');
}

// ---------- opslag en goedkeuring ----------
export const leesLive = kv => lees(kv, LIVE);
export const leesConcept = kv => lees(kv, CONCEPT);
export const voorbeeldLink = id => PUB + '?vorm=pagina&concept=' + id; // werkt altijd, ook voor adsfair.xyz is omgezet
export const isOmgezet = async kv => { try { return !!(await kv.raw(['GET', OMGEZET])); } catch (e) { return false; } };

// Concept zetten (agent, geplande taak of chat): controle, opslaan, en de vraag met het voorbeeld in Henkjans lijst. Vervangt een vorig concept.
export async function zetConcept(kv, c, wie = '', nu = Date.now()) {
  const vorige = await leesLive(kv), r = check(c, vorige, nu); if (!r.ok) return Object.assign(r, { regels: REGELS });
  const T = await import('./taken.js'), id = rid(), nuIso = new Date(nu).toISOString(), toonUrl = voorbeeldLink(id);
  const oud = await leesConcept(kv); if (oud && oud.taak) await T.adsfairTaakDicht(kv, oud.taak, 'Vervangen door een nieuwer concept (' + id + ').', nu);
  const t = await T.zetTaken(kv, { taak: { tekst: 'Weekupdate adsfair.xyz ' + r.v.label + ': concept ' + id + ' wacht op Henkjans ja. Typt hij iets anders dan ja of nee, maak dan een nieuwe versie volgens ' + HOST + '/api/mm/adsfair?vorm=werkwijze (zet concept opnieuw; dit concept vervalt dan vanzelf). Live zetten doet alleen zijn Ja.', project: 'adsfair', zwaarte: 'licht' } }, wie || 'adsfair', nu, { actie: { soort: 'adsfair', concept: id } });
  if (!t.ok) return t;
  const q = await T.zetTaken(kv, { taakzet: { id: t.taak, vraag: 'Adsfair-site: weekupdate ' + r.v.label.replace(/ ·.*/, '') + ' en het overzicht van alles wat live is, live zetten?', advies: (await isOmgezet(kv) ? '' : 'Eenmalig zet je Ja ook de nieuwe opbouw van adsfair.xyz live. ') + 'Ja als de tekst klopt: alleen wat deze week echt live ging, geen interne cijfers of tools. Typ anders wat er anders moet.', bijJa: 'Binnen 10 minuten staat het op adsfair.xyz.', bijNee: 'Niets gaat live; de site blijft zoals hij is.', omkeerbaar: true, geld: false, mail: false, publiek: true, zichtbaar: true, toon: toonUrl, keuzes: ['Ja', 'Nee'] } }, wie || 'adsfair', nu);
  if (!q.ok) { await T.adsfairTaakDicht(kv, t.taak, 'Vraag kon niet door de poort: ' + kort(q.fout, 200), nu); return q; }
  await kv.raw(['SET', CONCEPT, JSON.stringify(Object.assign({ id, t: nuIso, wie: kort(wie, 40), taak: t.taak }, r.v))]);
  return { ok: true, concept: id, week: r.v.week, voorbeeld: toonUrl, taak: t.taak, regels: 'Het staat als vraag in Henkjans lijst met het voorbeeld. Live gaat het alleen met zijn Ja.' };
}

// Alleen vanuit Henkjans Ja (lib/taken.js taakAntwoord, via zijn gekoppelde toestel). besluit = id van zijn antwoord, bewijs op vorm=ja.
export async function publiceer(kv, conceptId, besluit, nu = Date.now()) {
  const c = await leesConcept(kv); if (!c || c.id !== conceptId) return { ok: false, fout: 'Dat concept staat er niet meer (vervangen of al live).' };
  const live = Object.assign({}, c, { liveT: new Date(nu).toISOString(), besluit }); delete live.taak;
  await kv.raw(['SET', LIVE, JSON.stringify(live)]); await kv.raw(['HSET', WEKEN, live.week, JSON.stringify({ week: live.week, label: live.label, kop: live.kop, updates: live.updates, liveT: live.liveT, besluit })]); await kv.raw(['DEL', CONCEPT]);
  return { ok: true, week: live.week, label: live.label, omgezet: await isOmgezet(kv) };
}
export async function conceptWeg(kv, conceptId) { const c = await leesConcept(kv); if (c && c.id === conceptId) await kv.raw(['DEL', CONCEPT]); return { ok: true }; }

async function weken(kv) { let h = []; try { h = (await kv.raw(['HGETALL', WEKEN])) || []; } catch (e) {} if (!Array.isArray(h)) h = Object.entries(h).flat(); const uit = {}; for (let i = 0; i + 1 < h.length; i += 2) { try { uit[h[i]] = JSON.parse(h[i + 1]); } catch (e) {} } return uit; }

// Bron voor het concept: per publiek project wat er de afgelopen 7 dagen gebeurde, kort (de geplande taak leest dit, niet het hele dashboard).
const PUBLIEK = ['nexyplatform', 'nexy', 'kadoly', 'curacao', 'keuzehulpen', 'chirurgie', 'surgery', 'youandai', 'wam', 'sealed', 'sharedby', 'content', 'kdp', 'mylevel', 'goonfree', 'tk'];
export async function bron(kv, nu = Date.now()) {
  const D = await import('./dashboard.js'), d = await D.dashData(kv, {}), sinds = nu - 7 * 864e5, live = await leesLive(kv), concept = await leesConcept(kv);
  const projecten = (d.projecten || []).filter(p => PUBLIEK.includes(p.id) && !p.archief).map(p => ({ id: p.id, naam: p.naam, site: p.site,
    output: ((p.output && p.output.items) || []).filter(o => Date.parse(o.dag) >= sinds - 864e5).slice(0, 10).map(o => o.dag.slice(5) + ' ' + kort(o.wat, 200)),
    waar: (p.chats || []).filter(c => Date.parse(c.t) >= sinds).slice(0, 4).map(c => kort(c.waar, 260)),
    log: (p.log || []).filter(l => Date.parse(l.t) >= sinds).slice(0, 6).map(l => l.t.slice(5, 10) + ' ' + kort(l.tekst, 220)) }));
  return { week: isoWeek(nu), nuLive: live ? { week: live.week, kop: live.kop, live: live.live } : null, concept: concept ? { id: concept.id, week: concept.week, voorbeeld: voorbeeldLink(concept.id) } : null, regels: REGELS, projecten };
}

export function werkwijze() {
  return ['WERKWIJZE WEEKUPDATE ADSFAIR.XYZ (Henkjan 27 nov 2026: "Doe iedere week een update op adsfair website en laat me dat eerst zien")', '',
    'Elke vrijdag, door de geplande taak "Adsfair weekupdate" (of een chat die het overneemt). Lees alles met de Vercel-tool web_fetch_vercel_url.', '',
    '1. Lees ' + HOST + '/api/mm/dashboard?vorm=bij&project=adsfair (stand, open vragen, antwoorden van Henkjan op vorige concepten).',
    '2. Lees ' + HOST + '/api/mm/adsfair?vorm=bron: per publiek project wat er deze week live ging (output, waar de chats zijn, werklog), de lijst die nu live staat en de regels.',
    '3. Schrijf het concept in het Engels. kop: één zin die de week samenvat. updates: 3 tot 6 regels, één per project waar voor een gebruiker iets nieuws live ging, met de link waar het te zien is. live: de volledige lijst van wat publiek live is, Nexy eerst; haal weg wat stopte, zet erbij wat nieuw live ging (laat live weg als er niets verandert).',
    '   Regels: ' + REGELS.join(' '),
    '   Kijk elke link na met web_fetch_vercel_url (geen 404). Twijfel je of iets live is: laat het weg.',
    '4. Zet het concept: ' + HOST + '/api/mm/adsfair?zet=' + JSON.stringify({ concept: { kop: '...', updates: [{ project: 'Kadoly', tekst: '...', link: 'https://...' }], live: [{ naam: 'Nexy', wat: '...', url: 'https://nexy.works' }] } }) + ' (URL-gecodeerd; de week vult zich vanzelf). Het antwoord geeft de voorbeeldlink; de vraag met die link staat dan in Henkjans lijst. Een fout zegt wat er mis is: verbeter en zet opnieuw.',
    '5. Bekijk het voorbeeld zelf (web_fetch_vercel_url op de voorbeeldlink): de week, de updates en de lijst staan erin.',
    '6. Werklog: ' + HOST + '/api/mm/handover?log=<week, wat erin staat, voorbeeldlink>&wie=adsfair-weekupdate en de stand: ' + HOST + '/api/mm/dashboard?zet={"project":"adsfair","chat":{"naam":"adsfair-weekupdate","waar":"<week> klaar als voorbeeld","wacht":[],"volgende":"Henkjans ja op het dashboard","link":"<voorbeeldlink>"}} (de vraag zelf staat al in zijn lijst via het concept).',
    '', 'Nooit live zetten: dat kan alleen Henkjans Ja op zijn gekoppelde toestel. Typt hij commentaar, dan komt dat als taak bij de oppakker: maak een nieuwe versie (stap 3 tot 6) en meld die taak klaar.',
    'Code: lib/adsfair.js in hjdk-api. adsfair.xyz is het Vercel-project adsfair (zonder repo): / , /updates en /llms.txt herschrijven naar ' + PUB + '?vorm=pagina|updates|llms.', ''].join('\n');
}

export async function tekst(kv) {
  const live = await leesLive(kv), c = await leesConcept(kv), w = await weken(kv);
  return ['ADSFAIR.XYZ', 'adsfair.xyz: ' + (await isOmgezet(kv) ? 'omgezet naar deze module' : 'nog statisch; na Henkjans eerste Ja promoveert de oppakker deployment ' + OMZET_DPL + ' naar productie'), 'Live: ' + (live ? live.label + ' (goedgekeurd ' + String(live.liveT).slice(0, 16).replace('T', ' ') + ' UTC, besluit ' + live.besluit + '), ' + live.live.length + ' projecten in het overzicht' : 'nog de oude pagina (geen goedgekeurde week)'),
    'Concept: ' + (c ? c.label + ', wacht op Henkjans ja: ' + voorbeeldLink(c.id) : 'geen'), 'Weken in het archief: ' + Object.keys(w).length, 'Werkwijze: ' + HOST + '/api/mm/adsfair?vorm=werkwijze', ''].join('\n');
}

// Eindpunt /api/mm/adsfair (fn/mm.js). Publiek: vorm=pagina, updates, llms (ook ?concept=<id> voor het voorbeeld, noindex). Beschermd: werkwijze, bron, tekst, zet.
export async function adsfairHandler(req, res, kv, { beschermd, q, leesJson }) {
  const vorm = String(q('vorm') || (q('zet') || req.method === 'POST' ? '' : 'pagina')), stuur = (code, type, body, cache) => { res.setHeader('content-type', type); res.setHeader('cache-control', cache || 'no-store'); return res.status(code).send(body); };
  const HTML = 'text/html; charset=utf-8', TXT = 'text/plain; charset=utf-8', KORT = 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400';
  if (vorm === 'pagina' || vorm === 'updates' || vorm === 'llms') {
    const cid = String(q('concept') || '').replace(/[^a-z0-9]/g, '').slice(0, 12);
    if (cid) { const c = await leesConcept(kv); res.setHeader('x-robots-tag', 'noindex, nofollow');
      if (!c || c.id !== cid) { const l = await leesLive(kv); return stuur(200, HTML, l && l.week ? '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><p style="font:16px Inter,system-ui;padding:24px">Dit voorbeeld is niet meer actueel: het staat al live of er is een nieuwere versie. <a href="' + SITE + '/">Bekijk adsfair.xyz</a></p>' : '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><p style="font:16px Inter,system-ui;padding:24px">Dit voorbeeld bestaat niet meer.</p>'); }
      return stuur(200, HTML, pagina(c, { concept: c.label + ' en het overzicht van alles wat live is. Zeg Ja op je dashboard en dit staat binnen 10 minuten op adsfair.xyz.' })); }
    const live = await leesLive(kv);
    if (!live) { const oud = vorm === 'llms' ? '/oud-llms.txt' : '/oud.html'; try { const r = await fetch(SITE + oud, { signal: AbortSignal.timeout(5000) }); if (r.ok) return stuur(200, vorm === 'llms' ? TXT : HTML, await r.text(), KORT); } catch (e) {} return stuur(503, TXT, 'AdsFair is updating this page. Try again in a minute.', 'no-store'); }
    if (vorm === 'llms') return stuur(200, TXT, llms(live), KORT);
    const w = await weken(kv); if (vorm === 'updates') return stuur(200, HTML, updatesPagina(w, live.live), KORT);
    return stuur(200, HTML, pagina(live, { archief: Object.keys(w).length > 1 }), KORT);
  }
  if (!beschermd(req) && req.method !== 'POST') return stuur(403, TXT, 'alleen via de beschermde vercel.app-host');
  if (req.method === 'POST' && !beschermd(req)) { const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const given = [req.headers['x-hjdk-token'], bearer].filter(Boolean); const ok = [process.env.ZICHT_TOKEN, process.env.GADS_TOKEN, process.env.HJDK_TOKEN].filter(Boolean); if (!given.some(g => ok.includes(g))) return res.status(401).json({ ok: false, fout: 'sleutel' }); }
  const zetRuw = req.method === 'POST' ? req.body : q('zet');
  if (zetRuw) { const b = (typeof zetRuw === 'string' ? leesJson(zetRuw) : zetRuw) || {};
    if (b.omgezet) { if (!/^dpl_[A-Za-z0-9]{10,40}$/.test(String(b.omgezet))) return res.status(400).json({ ok: false, fout: 'omgezet: het id van de productie-deployment van adsfair (dpl_...)' }); await kv.raw(['SET', OMGEZET, JSON.stringify({ dpl: b.omgezet, t: new Date().toISOString() })]); return res.status(200).json({ ok: true, omgezet: b.omgezet }); }
    if (b.publiceer || b.live) return res.status(403).json({ ok: false, fout: 'Live zetten kan alleen Henkjans Ja op zijn gekoppelde toestel, op de vraag in zijn lijst.' });
    if (!b.concept) return res.status(400).json({ ok: false, fout: 'zet: {"concept":{"kop","updates":[...],"live":[...]}}', regels: REGELS });
    res.setHeader('cache-control', 'no-store'); return res.status(200).json(await zetConcept(kv, b.concept, b.wie || q('wie') || 'adsfair'));
  }
  if (vorm === 'werkwijze') return stuur(200, TXT, werkwijze());
  if (vorm === 'bron') { res.setHeader('cache-control', 'no-store'); return res.status(200).json(await bron(kv)); }
  return stuur(200, TXT, await tekst(kv));
}
