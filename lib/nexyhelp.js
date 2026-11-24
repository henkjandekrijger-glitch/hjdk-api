// nexy.help: de AI-keuzehulp (Henkjan 17 nov 2026: "Maak daar een zeer uitgebreide keuzehulp van over AI . En daarin alles Nexy usecases
// meenemen maar alle vragen daarom trent gewoon beantwoorden" en "nexy help gaat op in de keuzehulpen"). Engelstalig, wereldwijd. Draait in
// hjdk-api (route /api/keuze-tools?tool=nexy&p=<pad>, host nexy.help in vercel.json). Data in data/nexy/*.json:
//   ai-tools.json   AI-producten met prijs, gratis versie, privacy, bron en datum (agent, 17 nov)
//   ai-vragen.json  echte vragen met antwoord en cluster (agent)
//   oud.json        de pagina's van de oude nexy.help (Nexy-usecases), zodat bestaande URL's en posities blijven
// Nexy is ons eigen product: overal waar het genoemd wordt staat dat erbij. Look: outname.now (gedeelde CSS uit lib/zorg.js).
import { measureTag } from './kleur.js';
import { vak } from './nexymail.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { kzuxBlok } from './kzux.js';
import { CSS as LOOK } from './zorg.js';

const HOST = 'nexy.help', BASIS = 'https://nexy.help';
const DIR = process.env.NEXY_TEST_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'nexy');
const streep = t => t.replace(/\s*[\u2014\u2013]\s*/g, (m, i, s) => /\d$/.test(s.slice(0, i)) && /^\d/.test(s.slice(i + m.length)) ? '-' : ', ');
const lees = f => { try { return JSON.parse(readFileSync(join(DIR, f), 'utf8'), (k, v) => typeof v === 'string' ? streep(v) : v); } catch (e) { return null; } };
let C = null;
export function data() {
  if (C) return C;
  const tools = ((lees('ai-tools.json') || {}).tools || []).filter(t => t && t.slug && t.naam);
  const vragen = ((lees('ai-vragen.json') || {}).vragen || []).filter(v => v && v.vraag && v.antwoord);
  const oud = ((lees('oud.json') || {}).paginas || []).filter(p => p && p.pad && p.status === 200);
  const extra = lees('teksten.json') || {};
  C = { tools, vragen, oud, extra }; return C;
}
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const knip = (x, n = 155) => { x = String(x || ''); if (x.length <= n) return x; const z = x.slice(0, n), p = z.lastIndexOf('. '); return p > 80 ? z.slice(0, p + 1) : z.replace(/\s+\S*$/, ''); };
const usd = n => n == null || isNaN(n) ? '' : '$' + (Number(n) % 1 ? Number(n).toFixed(2) : String(Number(n)));
const vandaag = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const ORG = { '@type': 'Organization', '@id': 'https://nexy.help/#org', name: 'Nexy', url: 'https://nexy.help/', parentOrganization: { '@type': 'Organization', name: 'AdsFair B.V.' } };
const EIGEN = 'Nexy is made by the same team as this guide (AdsFair B.V.). We list it only where it fits and say what it does not do.';

// ---------- onderwerpen van de keuzehulp ----------
export const CATS = [
  { slug: 'best-ai-assistant', naam: 'AI assistants', h1: 'Which AI assistant should you use in 2026?', re: /assistant|general|chatbot/i, cl: ['choose', 'compare'] },
  { slug: 'free-ai', naam: 'Free AI', h1: 'Free AI tools in 2026: what you get without paying', vrij: true, cl: ['price'] },
  { slug: 'ai-on-whatsapp', naam: 'AI on WhatsApp', h1: 'AI on WhatsApp and other chat apps', re: /\bmessaging\b|whatsapp|telegram/i, cl: ['messaging'], nexy: true },
  { slug: 'ai-receptionist', naam: 'AI that calls for you', h1: 'AI receptionists and AI that makes phone calls', re: /call|phone|receptionist|voice agent/i, cl: ['calls'], nexy: true },
  { slug: 'ai-meeting-notes', naam: 'Meeting notes', h1: 'Best AI for meeting notes and call summaries', re: /meeting|note|transcri/i, cl: ['meetings'], nexy: true },
  { slug: 'ai-for-planning-and-groups', naam: 'Planning and groups', h1: 'AI for planning, reminders and groups', re: /plan|calendar|remind|family|group|schedul/i, cl: ['planning-groups'], nexy: true },
  { slug: 'ai-for-small-business', naam: 'Small business', h1: 'AI for a small business: what actually helps', re: /business|customer|receptionist|inbox/i, cl: ['business'], nexy: true },
  { slug: 'ai-for-writing', naam: 'Writing', h1: 'Best AI for writing in 2026', re: /writ|grammar|paraphras/i, cl: ['writing'] },
  { slug: 'ai-image-and-video', naam: 'Images and video', h1: 'Best AI for images and video in 2026', re: /image|video|art|design/i, cl: ['images-video'] },
  { slug: 'ai-voice', naam: 'Voice', h1: 'AI voice tools: talk to AI and make voices', re: /voice|speech|audio/i, cl: ['voice'] },
  { slug: 'ai-for-coding', naam: 'Coding', h1: 'Best AI for coding in 2026', re: /code|coding|developer/i, cl: ['coding'] },
  { slug: 'ai-search-and-research', naam: 'Search and research', h1: 'AI for search and research: which one to trust', re: /search|research/i, cl: [] },
  { slug: 'ai-for-students', naam: 'Students', h1: 'AI for students: what is allowed and what helps', cl: ['study'], re: /assistant|research|notes/ },
  { slug: 'ai-for-seniors', naam: 'Seniors', h1: 'AI for older adults: simple and safe ways to start', cl: ['seniors'], re: /assistant|family|voice/ },
  { slug: 'is-ai-safe', naam: 'Privacy and safety', h1: 'Is AI safe? Privacy per assistant in 2026', prive: true, cl: ['privacy'] },
  { slug: 'getting-started-with-ai', naam: 'Getting started', h1: 'Getting started with AI: a plain guide', cl: ['getting-started', 'agents', 'limits', 'jobs', 'other'], re: /assistant/ },
];
export const VERGELIJK = [['chatgpt', 'claude'], ['chatgpt', 'gemini'], ['claude', 'gemini'], ['chatgpt', 'microsoft-copilot'], ['chatgpt', 'perplexity'], ['gemini', 'microsoft-copilot'], ['chatgpt', 'deepseek'], ['chatgpt', 'grok'], ['claude', 'perplexity'], ['gemini', 'perplexity']];
const tool = slug => data().tools.find(t => t.slug === slug) || data().tools.find(t => t.slug.startsWith(slug));
const toolsVoor = c => c.vrij ? data().tools.filter(t => t.gratis) : c.prive ? data().tools.filter(t => /assistant|general|chatbot/i.test((t.categorien || []).join(' '))) : c.re ? data().tools.filter(t => c.re.test((t.categorien || []).join(' ') + ' ' + (t.bestVoor || ''))) : [];
const vragenVoor = cl => data().vragen.filter(v => cl.includes(v.cluster));
const prijsTekst = t => { const p = (t.plannen || []).filter(x => x && x.usd != null).sort((a, b) => a.usd - b.usd); const f = t.gratis === true ? 'Free plan' : t.gratis === false ? 'No free plan' : ''; const b = p.length ? 'paid from ' + usd(p[0].usd) + '/month' : ''; return f && b ? f + ', ' + b : (f || (b ? b[0].toUpperCase() + b.slice(1) : 'Price not listed')); };
const oudeNexy = () => data().oud.filter(p => p.pad !== '/' && p.pad !== '/how-nexy-works' && p.pad !== '/learning' && !/privacy|terms|waitlist/.test(p.pad));
const nexyVoor = c => NOW_PER_CAT[c.slug] || [];

// ---------- vormgeving ----------
const NAV = '<nav class="tl"><a href="/">Find your AI</a><a href="/best-ai-assistant">Assistants</a><a href="/free-ai">Free AI</a><a href="/compare">Compare</a><a href="/questions">Questions</a><a href="https://nexy.now/?utm_source=nexyhelp&utm_medium=nav">Nexy app</a></nav>';
const EXTRA = `.tag{display:inline-block;font-size:12px;font-weight:600;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:1px 8px;margin-left:6px}.eigen{font-size:14px;color:var(--muted)}.k3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:12px 0}@media (max-width:760px){.k3{grid-template-columns:1fr}}.kies{border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin:22px 0}.kies h2{margin:0 0 6px;font-size:20px}.kies .chips a{cursor:pointer}.tt .mp{display:none}@media (max-width:560px){.tt th:nth-child(3),.tt td:nth-child(3){display:none}.tt .mp{display:block;font-weight:600;color:var(--ink);font-size:14px;margin-top:4px}.tt td:first-child{width:38%}}`;
const MEET = measureTag('nexy', '#nwf button,a[href*="nexy.works"],a[href*="nexy.now"]', '.kx-ps button,#kxf button', 'nexy'); // bezoek per bron in dezelfde tellers als de andere keuzehulpen (c:nexy-hv-<dag>-<bron>)
function doc({ titel, desc, pad, body, schema, noindex }) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(titel) + '</title><meta name="description" content="' + esc(knip(desc)) + '"><link rel="canonical" href="' + BASIS + pad + '">' + (noindex ? '<meta name="robots" content="noindex,follow">' : '') +
    '<link rel="icon" href="data:,"><style>' + LOOK + EXTRA + '</style><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script></head><body><header><div class="wrap"><a class="mark" href="/">nexy<em>.help</em></a>' + NAV + '</div></header><main><div class="wrap">' + body +
    '' + (pad === '/questions' || pad === '/compare' ? vak(pad, 'AI tools') : vak(pad, onderwerp(pad).naam)) + '</div></main><footer><div class="wrap"><p>nexy.help is an independent guide to AI tools. Prices and features come from the makers\' own sites, with date; check them before you pay. ' + esc(EIGEN) + ' Updated ' + esc(vandaag()) + '.</p><p>AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands. <a href="https://nexy.now/?utm_source=nexyhelp&utm_medium=footer">About Nexy</a> · <a href="/questions">All questions</a> · <a href="https://keuzehulp.best/">keuzehulp.best</a></p></div></footer>' + MEET + '</body></html>';
}
const chat = (slug, term, faq) => kzuxBlok({ alleenChat: true, kop: 'Ask the AI guide', taal: 'us', site: 'kzuxnexy', slug: 'nexy-' + (slug || 'home'), term, shop: '', prods: [], opties: [], faq: (faq || []).slice(0, 12).map(([q, a]) => ({ q, a })) });
const faqBlok = (faq, kop) => faq.length ? '<h2>' + esc(kop || 'Questions') + '</h2>' + faq.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') : '';
const faqSchema = faq => faq.length ? { '@type': 'FAQPage', mainEntity: faq.slice(0, 40).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } : null;
const bronnen = list => { const u = [...new Set(list.filter(Boolean))].slice(0, 14); return u.length ? '<p class="klein">Sources: ' + u.map((x, i) => '<a href="' + esc(x) + '" rel="nofollow noopener" target="_blank">' + (i + 1) + '</a>').join(' · ') + '</p>' : ''; };
const chips = (lijst) => '<div class="chips">' + lijst.map(([href, t]) => '<a href="' + esc(href) + '">' + esc(t) + '</a>').join('') + '</div>';
const gestopt = t => /^Discontinued/i.test(t.beperkingen || '');
function toolTabel(ts) {
  if (!ts.length) return '';
  ts = [...ts.filter(t => !gestopt(t)), ...ts.filter(gestopt)];
  return '<div class="tw"><table class="tabel tt"><thead><tr><th>Tool</th><th>Best for</th><th>Price</th></tr></thead><tbody>' + ts.map(t => '<tr><td><a href="/tools/' + esc(t.slug) + '">' + esc(t.naam) + '</a><br><span class="klein">' + esc(t.maker || '') + '</span><span class="mp">' + esc(gestopt(t) ? 'Stopped' : prijsTekst(t)) + '</span></td><td>' + esc(knip(t.bestVoor, 160)) + '</td><td class="n">' + esc(gestopt(t) ? 'Stopped' : prijsTekst(t)) + '</td></tr>').join('') + '</tbody></table></div>' + bronnen(ts.flatMap(t => t.bronnen || []));
}
// Nexy zelf staat sinds 24 nov 2026 op nexy.now (lerende LP, repo clickmind-distribution). Henkjan: "Wat doen we met Nexy help asessen en hier heen transferen".
// nexy.help blijft de onafhankelijke AI-gids; alles over Nexy verwijst naar nexy.now, oude Nexy-pagina's gaan met 301 naar de passende pagina daar.
const NOW = 'https://nexy.now';
const NOW_LINKS = {
  '/v/ai-answering-service-for-personal-use': 'An AI that answers the calls you miss',
  '/u/unknown-messages': 'A stranger messages you. Nexy answers.',
  '/v/ai-note-taker-for-in-person-meetings': 'Minutes of a meeting at the table, from your phone',
  '/v/call-summary-app-iphone': 'A written summary of every phone call',
  '/u/group-call-recap': 'Call your group. What you agree becomes a to-do.',
  '/v/family-organizer-app-iphone-and-android': 'A family organizer for iPhone and Android',
  '/v/shared-reminders-iphone-and-android': 'Shared reminders between iPhone and Android',
  '/v/school-newsletter-to-calendar': 'School newsletter dates into the family calendar',
  '/v/carpool-organizer-for-parents': 'Organize a carpool with other parents',
  '/u/group-chat-to-tasks': 'Decisions in the group chat become tasks',
  '/u/text-nexy': 'Text Nexy like a friend. She remembers.',
};
const NOW_PER_CAT = {
  'ai-on-whatsapp': ['/u/group-chat-to-tasks', '/u/text-nexy', '/v/family-organizer-app-iphone-and-android'],
  'ai-receptionist': ['/v/ai-answering-service-for-personal-use', '/u/unknown-messages', '/v/call-summary-app-iphone'],
  'ai-meeting-notes': ['/v/ai-note-taker-for-in-person-meetings', '/u/group-call-recap', '/v/call-summary-app-iphone'],
  'ai-for-planning-and-groups': ['/v/family-organizer-app-iphone-and-android', '/v/shared-reminders-iphone-and-android', '/v/school-newsletter-to-calendar', '/v/carpool-organizer-for-parents'],
  'ai-for-small-business': ['/v/ai-answering-service-for-personal-use', '/u/unknown-messages', '/v/ai-note-taker-for-in-person-meetings'],
};
const nowUrl = (pad, waar) => NOW + pad + '?utm_source=nexyhelp&utm_medium=' + waar;
const NEXY_ZIN = 'Nexy is a messenger with an assistant built in. She remembers what was agreed, reminds the right person, writes the minutes and answers the calls you miss. Free to start on iPhone, Android and the web.';
const nexyBlok = ps => ps.length ? '<div class="kaart"><p><strong>Where Nexy fits</strong></p><p>' + esc(NEXY_ZIN) + '</p>' + chips(ps.map(p => [nowUrl(p, 'blok'), NOW_LINKS[p] || 'Nexy'])) + '<p class="eigen">' + esc(EIGEN) + '</p></div>' : '';
// oude Nexy-pagina van nexy.help -> pagina op nexy.now (301 in fn/keuze-tools.js)
export function naarNexyNow(pad) {
  pad = '/' + String(pad || '').replace(/^\/+|\/+$/g, '').toLowerCase();
  const vast = { '/how-nexy-works': '/', '/learning': '/', '/waitlist': '/', '/use-cases': '/',
    '/a-receptionist-that-answers-your-phone': '/v/ai-answering-service-for-personal-use', '/phone-call-with-a-written-summary': '/v/call-summary-app-iphone',
    '/photo-of-a-phone-number-to-call-it': '/u/call-any-number', '/call-in-to-hear-what-is-waiting-for-you': '/u/missed-calls',
    '/school-letter-into-calendar-dates': '/v/school-newsletter-to-calendar', '/agree-who-returns-school-consent-form': '/u/photo-to-reminders',
    '/shared-reminder-for-a-group': '/v/shared-reminders-iphone-and-android', '/confirm-driver-for-one-carpool-journey': '/v/carpool-organizer-for-parents',
    '/an-assistant-for-a-team-that-remembers-everything': '/u/text-nexy' };
  if (vast[pad]) return NOW + vast[pad];
  if (!data().oud.some(x => x.pad === pad) || pad === '/') return null;
  return NOW + (/agree|confirm|find-replacement|prepare|arrange|hand-over|ask-a-group|share-care/.test(pad) ? '/u/group-chat-to-tasks' : '/');
}
// wachtlijst Nexy (KV nexy:wacht): één veld, één knop
const wacht = () => '<section class="zm" style="border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin:24px 0"><h2 style="font-size:20px;margin:0 0 4px">Get Nexy when it opens</h2><p class="klein" style="margin:0">One email when your spot is ready. Nothing else.</p><form id="nwf" novalidate><div style="display:grid;grid-template-columns:1fr auto;gap:10px;margin:14px 0 10px"><input id="nwe" type="email" autocomplete="email" placeholder="Your email" aria-label="Your email" style="min-width:0;min-height:48px;border:1px solid var(--line2);border-radius:999px;padding:10px 18px;font:inherit;font-size:16px;background:var(--bg);color:var(--ink)"><button type="submit" style="min-height:48px;border:0;border-radius:999px;background:var(--acc);color:#fff;font:inherit;font-weight:600;padding:10px 22px;cursor:pointer">Join</button></div><p class="klein" id="nwu" style="margin:0">Unsubscribe in one click.</p></form></section><script>(function(){var f=document.getElementById("nwf");if(!f)return;f.addEventListener("submit",function(e){e.preventDefault();var m=document.getElementById("nwe").value.trim(),u=document.getElementById("nwu");if(!/^\\S+@\\S+\\.\\S+$/.test(m)){u.textContent="Please enter a valid email.";return}fetch("/api/keuze-tools?tool=nexy&op=wacht",{method:"POST",headers:{"content-type":"text/plain"},body:JSON.stringify({email:m,pad:location.pathname})}).then(function(r){return r.json()}).then(function(j){f.innerHTML=j&&j.ok?"<p><strong>You are on the list.</strong> We email you once, when it opens.</p>":"<p>That did not work. Please try again.</p>"}).catch(function(){u.textContent="That did not work. Please try again."})})})()</script>';

// ---------- keuzehulp: wat wil je doen? ----------
function kiezer() {
  const ops = CATS.filter(c => !c.prive).map(c => [c.slug, c.naam]);
  return '<div class="kies"><h2>What do you want AI to do?</h2><p class="klein">Tap one. You get the tools that do it well, what they cost and what to watch out for.</p>' + chips(ops.map(([s, n]) => ['/' + s, n])) + '</div>';
}

// ---------- pagina's ----------
function home() {
  const d = data(), oudHome = d.oud.find(p => p.pad === '/') || {}, vr = d.vragen.slice(0, 10).map(v => [v.vraag, v.antwoord]);
  const ass = d.tools.filter(t => /assistant|general|chatbot/i.test((t.categorien || []).join(' '))).slice(0, 10);
  const body = '<h1>Find the right AI for what you need</h1>' + chat('home', 'AI', vr) +
    '<p class="lead">An independent guide to ' + (d.tools.length || 'the main') + ' AI tools: which one to use for what, what it costs, what you get for free and what happens with your data. Every price checked on the maker\'s own site, with date.</p>' + kiezer() +
    (ass.length ? '<h2>The main AI assistants side by side</h2>' + toolTabel(ass) : '') +
    '<h2>Compare</h2>' + chips(VERGELIJK.filter(([a, b]) => tool(a) && tool(b)).map(([a, b]) => ['/compare/' + a + '-vs-' + b, tool(a).naam + ' vs ' + tool(b).naam])) +
    '<h2>What is Nexy?</h2><p>' + esc(NEXY_ZIN) + '</p><p><a href="' + nowUrl('/', 'home') + '">Get Nexy</a></p>' +
    '<h3>Things people use Nexy for</h3>' + chips(Object.keys(NOW_LINKS).map(p => [nowUrl(p, 'home'), NOW_LINKS[p]])) + '<p class="eigen">' + esc(EIGEN) + '</p>' + faqBlok(vr, 'Questions people ask about AI') + '<p><a href="/questions">All ' + d.vragen.length + ' questions</a></p>';
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebSite', url: BASIS + '/', name: 'nexy.help', inLanguage: 'en' }, { '@type': 'SoftwareApplication', name: 'Nexy', applicationCategory: 'CommunicationApplication', operatingSystem: 'iOS, Android, Web', url: NOW + '/', publisher: { '@id': ORG['@id'] } }, faqSchema(vr)].filter(Boolean) };
  return doc({ titel: 'Nexy help: find the right AI for what you need (2026)', desc: 'Which AI should you use? ' + (d.tools.length || '') + ' AI tools compared on price, free plan, privacy and what they are best at. Plus Nexy, the messenger with an assistant built in.', pad: '/', body, schema });
}
function catPagina(c) {
  const d = data(), t = (d.extra[c.slug] || {}), ts = toolsVoor(c), vr = [...(t.faq || []), ...vragenVoor(c.cl).map(v => [v.vraag, v.antwoord])].slice(0, 30), nx = c.nexy ? nexyVoor(c) : [];
  const priv = c.prive ? '<h2>What happens with your data</h2><div class="tw"><table class="tabel"><thead><tr><th>Assistant</th><th>Privacy</th></tr></thead><tbody>' + ts.map(x => '<tr><td><a href="/tools/' + esc(x.slug) + '">' + esc(x.naam) + '</a></td><td>' + esc(x.privacy || 'Not stated') + '</td></tr>').join('') + '</tbody></table></div>' : '';
  const body = '<p class="crumbs"><a href="/">nexy.help</a> › ' + esc(c.naam) + '</p><h1>' + esc(c.h1) + '</h1>' + chat(c.slug, c.naam, vr) + (t.kort ? '<div class="kaart"><p>' + esc(t.kort) + '</p></div>' : '') + (t.alineas || []).map(a => '<p>' + esc(a) + '</p>').join('') +
    (c.prive ? priv : ts.length ? '<h2>' + ts.length + ' tools compared</h2>' + toolTabel(ts) : '') + nexyBlok(nx) + faqBlok(vr) + kiezer();
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'ItemList', name: c.h1, itemListElement: ts.slice(0, 30).map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.naam, url: BASIS + '/tools/' + x.slug })) }, faqSchema(vr)].filter(Boolean) };
  return doc({ titel: c.h1.slice(0, 64), desc: t.kort || (c.h1 + ': ' + ts.length + ' tools compared on price, free plan and what they do best. Checked ' + vandaag() + '.'), pad: '/' + c.slug, body, schema, noindex: !ts.length && vr.length < 4 && !t.kort });
}
function toolPagina(t) {
  const vr = data().vragen.filter(v => new RegExp('\\b' + t.naam.split(/\s/)[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(v.vraag)).slice(0, 12).map(v => [v.vraag, v.antwoord]);
  const plannen = (t.plannen || []).filter(Boolean);
  const cats = CATS.filter(c => c.re && c.re.test((t.categorien || []).join(' ')));
  const body = '<p class="crumbs"><a href="/">nexy.help</a> › <a href="/best-ai-assistant">Tools</a> › ' + esc(t.naam) + '</p><h1>' + esc(t.naam) + ' in 2026: price, free plan and what it is good at</h1>' + chat('tool-' + t.slug, t.naam, vr) +
    '<div class="kaart"><p><strong>Best for:</strong> ' + esc(t.bestVoor || '') + '</p><p><strong>Free:</strong> ' + (t.gratis ? 'Yes. ' + esc(t.gratisWat || '') : 'No free plan.') + '</p>' + (plannen.length ? '<p><strong>Paid plans</strong><br>' + plannen.map(p => '<strong>' + esc(p.naam) + (p.usd != null ? ' ' + usd(p.usd) + '/month' : '') + '</strong>' + (p.wat ? ': ' + esc(p.wat) : '')).join('<br>') + '</p>' : '') + '</div>' +
    (t.platforms && t.platforms.length ? '<p><strong>Works on:</strong> ' + esc(t.platforms.join(', ')) + '</p>' : '') + (t.privacy ? '<h2>Privacy</h2><p>' + esc(t.privacy) + '</p>' : '') + (t.beperkingen ? '<h2>Limits</h2><p>' + esc(t.beperkingen) + '</p>' : '') +
    bronnen(t.bronnen || []) + '<p class="klein">Checked ' + esc(t.bronDatum || '') + '. Made by ' + esc(t.maker || '') + '.</p>' +
    (cats.length ? '<h2>Compare with others</h2>' + chips(cats.map(c => ['/' + c.slug, c.naam]).concat(VERGELIJK.filter(p => p.includes(t.slug) && tool(p[0]) && tool(p[1])).map(([a, b]) => ['/compare/' + a + '-vs-' + b, tool(a).naam + ' vs ' + tool(b).naam]))) : '') + faqBlok(vr);
  const p0 = plannen.filter(p => p.usd != null).sort((a, b) => a.usd - b.usd)[0];
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'SoftwareApplication', name: t.naam, applicationCategory: 'BusinessApplication', operatingSystem: (t.platforms || []).join(', ') || 'Web', author: { '@type': 'Organization', name: t.maker || t.naam }, offers: [...(t.gratis ? [{ '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' }] : []), ...plannen.filter(p => p.usd != null).map(p => ({ '@type': 'Offer', price: String(p.usd), priceCurrency: 'USD', name: p.naam }))] }, faqSchema(vr)].filter(Boolean) };
  return doc({ titel: t.naam + ' 2026: price, free plan, privacy', desc: t.naam + ': ' + (t.gratis ? 'free plan available' : 'no free plan') + (p0 ? ', paid from ' + usd(p0.usd) + ' a month' : '') + '. ' + (t.bestVoor || ''), pad: '/tools/' + t.slug, body, schema });
}
function vergelijkPagina(a, b) {
  const A = tool(a), B = tool(b); if (!A || !B) return null;
  const rij = (k, f) => '<tr><td>' + esc(k) + '</td><td>' + esc(f(A)) + '</td><td>' + esc(f(B)) + '</td></tr>';
  const vr = data().vragen.filter(v => { const q = v.vraag.toLowerCase(); return q.includes(A.naam.split(/\s/)[0].toLowerCase()) && q.includes(B.naam.split(/\s/)[0].toLowerCase()); }).map(v => [v.vraag, v.antwoord]).slice(0, 10);
  const body = '<p class="crumbs"><a href="/">nexy.help</a> › <a href="/compare">Compare</a> › ' + esc(A.naam) + ' vs ' + esc(B.naam) + '</p><h1>' + esc(A.naam) + ' vs ' + esc(B.naam) + ' in 2026</h1>' + chat('vs-' + a + '-' + b, A.naam + ' or ' + B.naam, vr) +
    '<div class="tw"><table class="tabel"><thead><tr><th></th><th>' + esc(A.naam) + '</th><th>' + esc(B.naam) + '</th></tr></thead><tbody>' + rij('Best for', x => x.bestVoor || '') + rij('Free', x => x.gratis ? (x.gratisWat || 'Yes') : 'No') + rij('Price', x => prijsTekst(x)) + rij('Works on', x => (x.platforms || []).join(', ')) + rij('Privacy', x => x.privacy || '') + rij('Limits', x => x.beperkingen || '') + '</tbody></table></div>' +
    bronnen([...(A.bronnen || []), ...(B.bronnen || [])]) + faqBlok(vr) + '<h2>More comparisons</h2>' + chips(VERGELIJK.filter(p => !(p[0] === a && p[1] === b) && tool(p[0]) && tool(p[1])).map(([x, y]) => ['/compare/' + x + '-vs-' + y, tool(x).naam + ' vs ' + tool(y).naam]));
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', url: BASIS + '/compare/' + a + '-vs-' + b, name: A.naam + ' vs ' + B.naam, inLanguage: 'en' }, faqSchema(vr)].filter(Boolean) };
  return doc({ titel: A.naam + ' vs ' + B.naam + ' (2026): price, free plan, privacy', desc: A.naam + ' or ' + B.naam + '? Side by side: what each is best at, ' + prijsTekst(A).toLowerCase() + ' versus ' + prijsTekst(B).toLowerCase() + ', and how they handle your data.', pad: '/compare/' + a + '-vs-' + b, body, schema });
}
function vergelijkHub() {
  const ps = VERGELIJK.filter(([a, b]) => tool(a) && tool(b));
  const body = '<p class="crumbs"><a href="/">nexy.help</a> › Compare</p><h1>Compare AI tools side by side</h1>' + chips(ps.map(([a, b]) => ['/compare/' + a + '-vs-' + b, tool(a).naam + ' vs ' + tool(b).naam])) + '<h2>All tools</h2>' + toolTabel(data().tools);
  return doc({ titel: 'Compare AI tools side by side (2026)', desc: 'ChatGPT, Claude, Gemini, Copilot, Perplexity and more compared on price, free plan, privacy and what they do best.', pad: '/compare', body, schema: { '@context': 'https://schema.org', '@graph': [ORG] } });
}
const CL = { choose: 'Choosing an AI', compare: 'Comparisons', price: 'Price and free plans', privacy: 'Privacy and safety', messaging: 'AI in chat apps', calls: 'Calls and receptionists', meetings: 'Meetings and notes', 'planning-groups': 'Planning and groups', business: 'Small business', study: 'Students', seniors: 'Older adults', writing: 'Writing', 'images-video': 'Images and video', voice: 'Voice', coding: 'Coding', 'getting-started': 'Getting started', agents: 'AI agents', limits: 'What AI cannot do', jobs: 'AI and jobs', other: 'Other' };
const kslug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function vragenPagina() {
  const v = data().vragen, g = {}; v.forEach(x => (g[x.cluster || 'other'] = g[x.cluster || 'other'] || []).push(x));
  const ks = Object.keys(g).sort((a, b) => g[b].length - g[a].length);
  const body = '<p class="crumbs"><a href="/">nexy.help</a> › Questions</p><h1>' + v.length + ' questions about AI, answered</h1>' + chat('questions', 'AI') + '<p class="lead">Real questions people ask about AI, with a short answer. Is yours not here? Ask the guide above.</p>' + chips(ks.map(k => ['#' + kslug(k), CL[k] || k])) +
    ks.map(k => '<h2 id="' + kslug(k) + '">' + esc(CL[k] || k) + '</h2>' + g[k].map(x => '<details><summary>' + esc(x.vraag) + '</summary><p>' + esc(x.antwoord) + (x.bron ? ' <a href="' + esc(x.bron) + '" rel="nofollow noopener" target="_blank">Source</a>' : '') + '</p></details>').join('')).join('');
  return doc({ titel: v.length + ' questions about AI, answered (2026)', desc: 'Which AI to use, what it costs, is it safe, AI on WhatsApp, AI that calls for you and more: ' + v.length + ' real questions with a short answer.', pad: '/questions', body, schema: { '@context': 'https://schema.org', '@graph': [ORG, faqSchema(v.slice(0, 150).map(x => [x.vraag, x.antwoord]))].filter(Boolean) }, noindex: v.length < 20 });
}
// oude Nexy-pagina's in het nieuwe jasje (zelfde URL, zelfde tekst), met de AI-tools die hetzelfde doen
const rel = p => { const o = data().oud, r = (p.gerelateerd || []).map(x => o.find(y => y.pad === (typeof x === 'string' ? x : x.pad))).filter(Boolean); return r.length ? '<h2>Related use cases</h2>' + chips(r.map(y => [y.pad, y.h1 || y.title])) : ''; };
function oudPagina(p) {
  const faq = (p.faq || []).filter(f => f && f[0] && f[1]);
  const c = CATS.find(c => c.nexy && nexyVoor(c).some(x => x.pad === p.pad));
  const ts = c ? toolsVoor(c).slice(0, 6) : [];
  const body = '<p class="crumbs"><a href="/">nexy.help</a> › <a href="/how-nexy-works">Nexy</a></p><h1>' + esc(p.h1 || p.title) + '</h1>' + chat('oud' + p.pad.replace(/\//g, '-'), p.h1 || 'Nexy', faq) + (p.intro ? '<p class="lead">' + esc(p.intro) + '</p>' : '') +
    (p.secties || []).filter(s => !/^(Do this with Nexy|Related use cases)$/.test(s.kop || '')).map(s => (s.kop ? '<h2>' + esc(s.kop) + '</h2>' : '') + String(s.tekst || '').split(/\n+/).filter(x => x && !/^\[knop\]/.test(x)).map(x => { const m = s.kop === 'What it looks like' && x.match(/^(You|Them|Nexy|[A-Z][a-z]+):\s*(.*)$/); if (m) return '<p><strong>' + esc(m[1]) + ':</strong> ' + esc(m[2]) + '</p>'; const l = x.match(/^(.+?) \((\/[a-z0-9-]+)\):\s*(.*)$/); if (l) return '<p><a href="' + esc(l[2]) + '"><strong>' + esc(l[1]) + '</strong></a>. ' + esc(l[3]) + '</p>'; const k = x.match(/^([^:]{3,40}):\s+(.*)$/); return k && s.kop !== 'What it looks like' ? '<p><strong>' + esc(k[1]) + '.</strong> ' + esc(k[2]) + '</p>' : '<p>' + esc(x) + '</p>'; }).join('')).join('') +
    ((p.stappen || []).length ? '<h2>Step by step</h2><ol>' + p.stappen.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>' : '') +
    '<p class="eigen">' + esc(EIGEN) + '</p>' + (ts.length ? '<h2>Other AI tools for this</h2>' + toolTabel(ts) : '') + faqBlok(faq) + rel(p) + (c ? kiezer() : '');
  const schema = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'HowTo', name: p.h1 || p.title, step: (p.stappen || []).map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })) }, faqSchema(faq)].filter(Boolean) };
  return doc({ titel: p.title || p.h1, desc: p.description || p.intro || p.h1, pad: p.pad, body, schema });
}
export const DOORSTUUR = {};
export function pagina(pad) {
  pad = '/' + String(pad || '').replace(/^\/+|\/+$/g, '').toLowerCase();
  if (pad === '/') return home();
  if (pad === '/questions') return vragenPagina();
  if (pad === '/compare') return vergelijkHub();
  let m = pad.match(/^\/compare\/([a-z0-9-]+)-vs-([a-z0-9-]+)$/); if (m) return vergelijkPagina(m[1], m[2]);
  m = pad.match(/^\/tools\/([a-z0-9-]+)$/); if (m) { const t = data().tools.find(x => x.slug === m[1]); return t ? toolPagina(t) : null; }
  const c = CATS.find(x => '/' + x.slug === pad); if (c) return catPagina(c);
  if (pad === '/learning') return null;
  const o = data().oud.find(x => x.pad === pad); if (o) return oudPagina(o);
  return null;
}
// onderwerp voor de dagelijkse AI-update (lib/nexymail.js): categorie bij een pad (categorie, tool of oude Nexy-pagina), met de vraag van de dag
// uit dat cluster en de tool van de dag uit die categorie (prijs en gratis deel zoals gecontroleerd, met datum)
export function onderwerp(pad) {
  pad = '/' + String(pad || '').replace(/^\/+|\/+$/g, '').toLowerCase();
  let c = CATS.find(x => '/' + x.slug === pad);
  const tm = pad.match(/^\/tools\/([a-z0-9-]+)$/); if (!c && tm) { const t = tool(tm[1]); if (t) c = CATS.find(x => toolsVoor(x).some(y => y.slug === t.slug) && !x.vrij && !x.prive); }
  if (!c) { const o = data().oud.find(x => x.pad === pad); if (o) c = CATS.find(x => x.nexy && nexyVoor(x).some(y => y.pad === pad)) || CATS.find(x => x.slug === 'ai-for-planning-and-groups'); }
  return c || CATS[0];
}
export function digestDeel(pad, dag) {
  const c = onderwerp(pad), n = Math.floor(Date.parse(dag + 'T12:00:00Z') / 864e5);
  const vr = vragenVoor(c.cl || []), ts = toolsVoor(c).filter(t => !gestopt(t));
  const v = vr.length ? vr[n % vr.length] : null, t = ts.length ? ts[n % ts.length] : null;
  return { slug: c.slug, naam: c.naam, h1: c.h1, url: BASIS + '/' + c.slug, vraag: v ? { q: v.vraag, a: v.antwoord } : null, tool: t ? { naam: t.naam, maker: t.maker, bestVoor: t.bestVoor, prijs: prijsTekst(t), gratis: t.gratisWat || '', datum: t.bronDatum || '', url: BASIS + '/tools/' + t.slug } : null };
}
export function paden() {
  const d = data();
  return ['/', '/questions', '/compare', ...CATS.map(c => '/' + c.slug), ...VERGELIJK.filter(([a, b]) => tool(a) && tool(b)).map(([a, b]) => '/compare/' + a + '-vs-' + b), ...d.tools.map(t => '/tools/' + t.slug)];
}
export function sitemap() { return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + [...new Set(paden())].map(p => '<url><loc>' + BASIS + (p === '/' ? '/' : p) + '</loc></url>').join('') + '</urlset>'; }
export function robots() { return 'User-agent: *\nAllow: /\n\nSitemap: ' + BASIS + '/sitemap.xml\n'; }
export function llms() {
  const d = data();
  return '# nexy.help\n\n> An independent guide to AI tools in 2026: which AI to use for what, prices, free plans and privacy, checked on the makers\' own sites. Nexy itself, a messenger with an assistant built in, lives at https://nexy.now/. ' + EIGEN + '\n\n## Topics\n\n' + CATS.map(c => '- [' + c.h1 + '](' + BASIS + '/' + c.slug + ')').join('\n') + '\n\n## Tools\n\n' + d.tools.map(t => '- [' + t.naam + '](' + BASIS + '/tools/' + t.slug + '): ' + prijsTekst(t) + '. ' + (t.bestVoor || '')).join('\n') + '\n\n## Comparisons\n\n' + VERGELIJK.filter(([a, b]) => tool(a) && tool(b)).map(([a, b]) => '- [' + tool(a).naam + ' vs ' + tool(b).naam + '](' + BASIS + '/compare/' + a + '-vs-' + b + ')').join('\n') + '\n\n## Nexy\n\n- [Nexy](' + NOW + '/): ' + NEXY_ZIN + '\n' + Object.keys(NOW_LINKS).map(p => '- [' + NOW_LINKS[p] + '](' + NOW + p + ')').join('\n') + '\n\n## Questions\n\n- [' + d.vragen.length + ' questions about AI](' + BASIS + '/questions)\n';
}
// voor de chat (lib/kzchat.js, site us): elke pagina als keuzehulp met de feiten erin; pad absoluut
export function chatItems() {
  const d = data(), feiten = d.tools.map(t => t.naam + ' (' + (t.maker || '') + '): ' + prijsTekst(t) + '. Best for: ' + (t.bestVoor || '') + ' Privacy: ' + (t.privacy || 'not stated') + '.').join(' ');
  const nexy = d.oud.slice(0, 40).map(p => (p.h1 || p.title) + ': ' + (p.intro || p.description || '')).join(' ');
  const it = (slug, pad, title, kort, faq) => ({ slug: 'nexy-' + slug, pad: BASIS + pad, term: title.toLowerCase(), title, kort, uitleg: 'AI tools checked ' + vandaag() + ': ' + feiten + ' Nexy (our own product, say so when you mention it): ' + nexy, faq: (faq || []).slice(0, 10).map(([q, a]) => ({ q, a })) });
  return [it('home', '/', 'Find the right AI', 'Which AI to use for what.', d.vragen.slice(0, 10).map(v => [v.vraag, v.antwoord])), it('questions', '/questions', 'Questions about AI', 'Questions about AI answered.'),
    ...CATS.map(c => it(c.slug, '/' + c.slug, c.h1, c.h1, vragenVoor(c.cl).map(v => [v.vraag, v.antwoord]))),
    ...d.tools.map(t => it('tool-' + t.slug, '/tools/' + t.slug, t.naam, t.bestVoor || t.naam)),
    ...VERGELIJK.filter(([a, b]) => tool(a) && tool(b)).map(([a, b]) => it('vs-' + a + '-' + b, '/compare/' + a + '-vs-' + b, tool(a).naam + ' vs ' + tool(b).naam, tool(a).naam + ' or ' + tool(b).naam)),
    ...d.oud.filter(p => p.pad !== '/').map(p => it('oud' + p.pad.replace(/\//g, '-'), p.pad, p.h1 || p.title, p.intro || p.description || '', p.faq || []))];
}
