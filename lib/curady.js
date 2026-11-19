// Curady (curady.com), high-ticket tak van Kadoly op dezelfde motor (Henkjan 18 nov 2026: "aparte tak op kadoly met aparte domeinnaam . Maar zelfde motor", naam "Yes leg vast").
// 19 nov 2026, Henkjan: "Nee ik vind t eveel risk . nog . Wil wel eerst tractie zien dus content maken we wel ." Geen leverancier vastgelegd
// (Baltresto vraagt EUR 30.000 per jaar en 100% vooruit), dus eerst koopgidsen met een offerteknop: per product meten wie echt wil kopen.
// Logo: het Kadoly-merk (twee pijlen in een afgeronde tegel) in zwart en wit (Henkjan 19 nov: "curady logo is cadoly maar dan zwart wit").
// Routes (vercel.json, host curady.com): / , /<gids>, /quote (POST), /sitemap.xml, /llms.txt, /favicon.svg, /robots.txt.
// Stand: /api/gids?op=cystand (tellingen per gids, zonder adressen); met &vol=1 alleen op de beschermde host de aanvragen zelf.
import { kv } from './db.js';

const BASE = 'https://curady.com';
const BIJGEWERKT = '2026-11-19';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WA = t => 'https://wa.me/31655395630?text=' + encodeURIComponent('Hi Curady, I have a question about ' + t);

// Kadoly-merk in zwart en wit; in donkere modus omgekeerd.
const MERK = s => `<svg class="mk" width="${s}" height="${s}" viewBox="0 0 34 34" aria-hidden="true" focusable="false"><rect class="mk-b" width="34" height="34" rx="9"/><path class="mk-1" d="M9 13h14M19 9l4 4-4 4" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path class="mk-2" d="M25 21H11M15 25l-4-4 4-4" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const FAVICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34"><rect width="34" height="34" rx="9" fill="#111"/><path d="M9 13h14M19 9l4 4-4 4" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M25 21H11M15 25l-4-4 4-4" stroke="#bdbdbd" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

// Koopgidsen. Alleen algemene, controleerbare kennis; geen prijzen of levertijden zolang er geen leverancier vastligt.
export const GIDSEN = {
  'barrel-saunas': {
    kort: 'Barrel saunas', titel: 'Barrel sauna buying guide: size, heater, wood and placement',
    desc: 'How to choose an outdoor barrel sauna: how many people, wood or electric heater, which wood, what base it needs and how long it lasts.',
    lede: 'A barrel sauna is a round wooden cabin for the garden. The round shape heats up faster than a square cabin of the same size, because there is less air above the benches. The choice comes down to four things: how many people, which heater, which wood and where it stands.',
    delen: [
      ['How big', 'Count the people who will use it at the same time, not the people in the house. Two to three people fit on one long bench. Four to six people need two benches or a longer barrel. A longer barrel needs a stronger heater and takes longer to warm up, so do not buy more space than you will use.'],
      ['Wood or electric heater', 'A wood-burning heater needs no power cable, gives the classic soft heat and smell, and suits a garden far from the house. It needs a chimney, dry firewood and someone to keep the fire going. An electric heater is easier: switch on, wait, sit. Most need a heavier connection than a normal socket, so ask an electrician before you order. Electric heaters are sized in kilowatts against the volume of the cabin; the seller should match the two for you.'],
      ['Which wood', 'Spruce is the common choice: light, affordable and fine with a good roof and some care. Thermowood is wood that is heat-treated so it takes up less water and moves less; it costs more and lasts longer outside. Cedar smells strong and resists rot well, and is the most expensive. Whatever the wood, the roof cover matters as much as the wood itself.'],
      ['Base and place', 'A barrel sauna rests on cradles and needs a flat, firm base: paving slabs, a concrete strip or a wooden deck that does not move. Leave room around it to reach the heater and for air to flow. Check local rules for a wood stove and a chimney close to neighbours.'],
      ['Delivery and assembly', 'Barrel saunas come in panels or fully built. Panels go through a garden gate and two handy people can build them in a day or two. A fully built barrel needs a truck with a crane and clear access to the spot. Ask before you order which of the two you get.'],
    ],
    faq: [
      ['How hot does a barrel sauna get?', 'A traditional Finnish sauna runs at about 70 to 90 degrees Celsius. A good heater in a well-sized barrel reaches that comfortably.'],
      ['Can a barrel sauna stand outside all year?', 'Yes, that is what it is made for. Give it a roof cover, keep it off the wet ground on its cradles, and let it dry out with the door open after use.'],
      ['Wood or electric, which is cheaper to run?', 'That depends on your price for power and for firewood. Electric is simpler to use every day; wood needs no connection at all.'],
    ],
  },
  'wood-fired-hot-tubs': {
    kort: 'Wood-fired hot tubs', titel: 'Wood-fired hot tub buying guide: stove, tub material, size and care',
    desc: 'How to choose a wood-fired hot tub: inside or outside stove, wood, fibreglass or acrylic tub, size, heating time and how to keep the water clean.',
    lede: 'A wood-fired hot tub heats its water with a small stove instead of a power cable. That makes it work anywhere in the garden. The choice is about the stove, the tub material, the size and how much time you want to spend on the water.',
    delen: [
      ['Stove inside or outside', 'An internal stove sits in the water behind a guard. It heats fast and takes no extra space, but takes room inside the tub and you feed it from the edge. An external stove stands next to the tub and pumps or lets water flow through it. It leaves the whole tub free, is easier to clean and to feed, and needs a little more space.'],
      ['Tub material', 'An all-wood tub is the old way: it looks beautiful but needs water in it to stay tight, and needs more care. Most tubs now have a fibreglass or acrylic liner inside a wooden or composite outside. The liner is smooth, easy to clean and does not leak when empty.'],
      ['Size', 'Count the people who will sit in it together. A bigger tub holds more water, so it takes longer to heat and uses more wood. A lid keeps heat in overnight and cuts the next heating time.'],
      ['Keeping the water clean', 'Without a filter you change the water often. A filter with a small pump, and in some tubs air bubbles or LED lights, need a power point near the tub. Decide before you buy if you want those, because they change where the tub can stand.'],
      ['Base and place', 'A full tub is very heavy. It needs a flat, firm base that can carry the weight of the water and the people. Keep the chimney away from trees, fences and roofs.'],
    ],
    faq: [
      ['How long does a wood-fired hot tub take to heat?', 'It depends on the size of the tub, the stove, the starting temperature of the water and the weather. A lid and an insulated tub make a large difference.'],
      ['Do I need electricity for a wood-fired hot tub?', 'Not for heating. Only extras such as a filter pump, bubbles or lights need power.'],
      ['Can I use it in winter?', 'Yes, many people use it most in winter. Drain it or keep it heated in frost so water cannot freeze in the pipes and stove.'],
    ],
  },
  'massage-chairs': {
    kort: 'Massage chairs', titel: 'Massage chair buying guide: L or SL track, body fit, space and features',
    desc: 'How to choose a massage chair: S, L or SL track, body height, zero gravity, airbags, heat, and how much room you need behind and in front of the chair.',
    lede: 'A good massage chair is chosen on your body and your room before anything else. The track decides which parts of your back the rollers reach, your height decides if the chair fits, and the room decides which model can recline fully.',
    delen: [
      ['The track: S, L or SL', 'An S track follows the curve of the spine from neck to lower back. An L track goes on under the seat to the glutes and the back of the thighs. An SL track does both. If your lower back or hips are the problem, an L or SL track reaches them; an S track does not.'],
      ['Fit for your height', 'Every chair works best for a range of body heights. Check that range against everyone who will use it. A chair that is too short pushes the shoulder rollers into the neck; one that is too long misses the shoulders.'],
      ['Room to recline', 'Many chairs recline far back. Some need space behind them, others slide forward and stand close to the wall. Measure the spot and the door to the room before you order: these chairs are large and heavy.'],
      ['Zero gravity, airbags and heat', 'Zero gravity tilts you back with your knees above your heart, which takes weight off the spine. Airbags squeeze arms, legs and feet. Heat in the back or the calves loosens muscles. These are worth more than a long list of programmes you will never use.'],
      ['Service', 'A massage chair has motors and moving parts. Ask who repairs it at home, how long the warranty runs, and who pays for the transport if it has to go back.'],
    ],
    faq: [
      ['What is the difference between an L track and an SL track?', 'An L track runs from the neck down under the seat. An SL track adds the S-curve along the spine, so it follows your back more closely and reaches further down.'],
      ['How much space does a massage chair need?', 'Check the size of the chair when it is fully reclined, plus the space it needs behind it. Space-saving models slide forward instead of tilting back.'],
      ['Who should not use a massage chair?', 'Ask your doctor first if you are pregnant, have a pacemaker, recent surgery, a blood clot or a serious back problem.'],
    ],
  },
  'kamado-grills': {
    kort: 'Kamado grills', titel: 'Kamado grill buying guide: size, ceramic, accessories and use',
    desc: 'How to choose a kamado grill: diameter for your group, ceramic quality, stand or table, heat deflector and what you can cook on it.',
    lede: 'A kamado is a thick ceramic egg-shaped grill. The ceramic holds heat for hours on little charcoal, so one grill can sear a steak, smoke a brisket low and slow, and bake a pizza. The choice is mainly about size and what comes with it.',
    delen: [
      ['Size', 'Kamados are sized by the diameter of the grill grate. A small one is fine for two people; a family or regular guests need a medium or large one. A larger kamado takes more charcoal and longer to heat, but gives room for two zones.'],
      ['Ceramic and build', 'Thick, well-fired ceramic holds heat and does not crack easily. Look at the hinge that carries the lid, the gasket that seals it, and the vents at the top and bottom: those are what you touch every time.'],
      ['Stand or table', 'A kamado is heavy. A stand on wheels lets you move it; a built-in table gives work space and looks finished on a terrace. Make sure the surface under it can take the weight and the heat.'],
      ['What you need with it', 'A heat deflector turns the kamado into an oven for slow cooking and baking. A pizza stone, a second grate level and a good thermometer are the accessories most people use. Buy a full set if it is a gift.'],
    ],
    faq: [
      ['What can you cook on a kamado?', 'Grilling, smoking, roasting and baking: from steaks and vegetables to pulled pork, bread and pizza.'],
      ['Does a kamado use a lot of charcoal?', 'No. Because the ceramic holds the heat, it runs long on a small amount of lump charcoal.'],
      ['Can a kamado stay outside?', 'Yes, with a cover. Keep it dry inside and protect it from frost when it is wet.'],
    ],
  },
};
const VOLG = ['barrel-saunas', 'wood-fired-hot-tubs', 'massage-chairs', 'kamado-grills'];

const CSS = `:root{--bg:#fbfaf7;--ink:#141414;--sub:#55524d;--line:#e3e0da;--card:#fff;--btn:#141414;--btnt:#fff;--mk-b:#141414;--mk-1:#fff;--mk-2:#bdbdbd}
@media (prefers-color-scheme:dark){:root{--bg:#121212;--ink:#f2f0ec;--sub:#b3aea6;--line:#33312e;--card:#1b1b1b;--btn:#f2f0ec;--btnt:#121212;--mk-b:#f2f0ec;--mk-1:#121212;--mk-2:#555}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 Inter,system-ui,-apple-system,sans-serif}
.mk-b{fill:var(--mk-b)}.mk-1{stroke:var(--mk-1)}.mk-2{stroke:var(--mk-2)}
header{border-bottom:1px solid var(--line)}header .in{max-width:760px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;gap:10px}
.brand{display:flex;align-items:center;gap:10px;color:var(--ink);text-decoration:none;font-weight:700;font-size:18px}
nav{margin-left:auto;display:flex;gap:14px;flex-wrap:wrap}
@media (max-width:700px){header .in{flex-wrap:wrap}nav{margin-left:0;width:100%;flex-wrap:nowrap;overflow-x:auto;white-space:nowrap;padding-bottom:2px}}nav a{color:var(--sub);text-decoration:none;font-size:16px}nav a:hover{color:var(--ink)}
main{max-width:760px;margin:0 auto;padding:36px 20px 24px}
h1{font-size:32px;line-height:1.15;margin:0 0 14px}h2{font-size:18px;font-weight:700;margin:28px 0 6px}
p{margin:0 0 14px;color:var(--sub)}p.lede{color:var(--ink)}
.g{display:grid;gap:12px;margin:24px 0}.k{display:block;border:1px solid var(--line);border-radius:14px;padding:16px 18px;background:var(--card);color:var(--ink);text-decoration:none}.k h2{margin:0 0 4px}.k p{margin:0}
.b{display:inline-block;background:var(--btn);color:var(--btnt);text-decoration:none;font-weight:700;border:0;border-radius:12px;padding:12px 18px;font-size:16px;cursor:pointer}
.b2{display:inline-block;color:var(--ink);font-weight:700;padding:12px 4px;text-decoration:underline}
form.q{border:1px solid var(--line);border-radius:14px;padding:18px;background:var(--card);margin:30px 0}
form.q label{display:block;font-weight:700;margin:12px 0 4px}form.q input,form.q select,form.q textarea{width:100%;font:16px Inter,system-ui,sans-serif;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)}
form.q textarea{min-height:84px}.ok{font-weight:700;color:var(--ink)}.klein{font-size:13px}
details{border-top:1px solid var(--line);padding:12px 0}summary{font-weight:700;cursor:pointer}
footer{max-width:760px;margin:0 auto;padding:10px 20px 40px;font-size:13px;color:var(--sub)}footer a{color:var(--sub)}`;

function kop() {
  return `<header><div class="in"><a class="brand" href="/" aria-label="Curady">${MERK(28)}<span>Curady</span></a><nav>${VOLG.map(s => `<a href="/${s}">${esc(GIDSEN[s].kort)}</a>`).join('')}</nav></div></header>`;
}
function voet() {
  return `<footer>Curady is part of Kadoly, run by AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands. Updated ${BIJGEWERKT}.</footer>`;
}
function pagina({ titel, desc, pad, body, ld }) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titel)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${BASE}${pad}">
<meta name="robots" content="index,follow,max-snippet:-1"><meta property="og:title" content="${esc(titel)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${BASE}${pad}"><meta property="og:site_name" content="Curady">
<link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="alternate" type="text/plain" href="/llms.txt">
<style>${CSS}</style>${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}
<script src="https://whichtobuy.best/cm.js" data-site="curady" data-modal="geen" async></script></head><body>${kop()}<main>${body}</main>${voet()}</body></html>`;
}

function offerteForm(slug) {
  const opties = VOLG.map(s => `<option value="${s}"${s === slug ? ' selected' : ''}>${esc(GIDSEN[s].kort)}</option>`).join('');
  return `<form class="q" id="q" method="post" action="/quote">
<h2 style="margin-top:0">Ask for a quote</h2>
<p>Tell us what you are looking for. We come back with a matching model, the price delivered to your door and the delivery time. No obligation.</p>
<label for="q-p">Product</label><select id="q-p" name="product">${opties}</select>
<label for="q-w">What do you need?</label><textarea id="q-w" name="wens" maxlength="1200" placeholder="For example: sauna for 4 people, wood heater, garden in Utrecht"></textarea>
<label for="q-b">Budget</label><select id="q-b" name="budget"><option value="">Not sure yet</option><option>Under 3,000 euro</option><option>3,000 to 6,000 euro</option><option>6,000 to 10,000 euro</option><option>Over 10,000 euro</option></select>
<label for="q-t">When</label><select id="q-t" name="wanneer"><option value="">Not sure yet</option><option>As soon as possible</option><option>Within 3 months</option><option>This year</option><option>Just looking</option></select>
<label for="q-l">Country</label><input id="q-l" name="land" maxlength="60" placeholder="Netherlands">
<label for="q-n">Name</label><input id="q-n" name="naam" maxlength="100" autocomplete="name">
<label for="q-e">Email</label><input id="q-e" name="email" type="email" maxlength="160" autocomplete="email" required>
<input type="text" name="web" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
<p class="klein" style="margin-top:12px">We only use your details to answer this request.</p>
<button class="b" type="submit">Send my request</button> <a class="b2" href="${WA(GIDSEN[slug] ? GIDSEN[slug].kort.toLowerCase() : 'your products')}">or WhatsApp us</a>
<p class="ok" id="q-ok" hidden>Thank you. We will reply by email within one working day.</p>
</form>
<script>(function(){var f=document.getElementById('q');if(!f||!window.fetch)return;f.addEventListener('submit',function(e){e.preventDefault();var d={};new FormData(f).forEach(function(v,k){d[k]=v});d.pad=location.pathname;d.ref=document.referrer||'';d.qs=location.search||'';var b=f.querySelector('button');b.disabled=true;fetch('/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok){[].forEach.call(f.querySelectorAll('label,select,textarea,input,.klein,button,.b2'),function(x){x.hidden=true;x.style.display='none'});document.getElementById('q-ok').hidden=false;try{window.cmEvent&&window.cmEvent('aanvraag')}catch(e){}}else{b.disabled=false;alert('Please check your email address.')}}).catch(function(){b.disabled=false})})})()</script>`;
}

function home() {
  const kaart = VOLG.map(s => `<a class="k" href="/${s}"><h2>${esc(GIDSEN[s].kort)}</h2><p>${esc(GIDSEN[s].desc)}</p></a>`).join('');
  const ld = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Curady', url: BASE, logo: BASE + '/favicon.svg', parentOrganization: { '@type': 'Organization', name: 'Kadoly', url: 'https://kadoly.com' }, telephone: '+31655395630', address: { '@type': 'PostalAddress', streetAddress: 'Albert Plesmanplein 20', postalCode: '2805 AB', addressLocality: 'Gouda', addressCountry: 'NL' } };
  return pagina({ titel: 'Curady | Saunas, hot tubs and massage chairs, chosen with care', desc: 'Buying guides and personal quotes for barrel saunas, wood-fired hot tubs, massage chairs and kamado grills, delivered to your home in Europe.', pad: '/', ld,
    body: `<h1>Wellness at home, chosen with care</h1>
<p class="lede">We help you choose the right sauna, hot tub, massage chair or kamado for your home and garden. Read the guide, tell us what you need, and we send you a quote with the price delivered to your door.</p>
<div class="g">${kaart}</div>${offerteForm('')}` });
}

function gids(slug) {
  const g = GIDSEN[slug];
  const delen = g.delen.map(([h, t]) => `<h2>${esc(h)}</h2><p>${esc(t)}</p>`).join('');
  const faq = g.faq.map(([v, a]) => `<details><summary>${esc(v)}</summary><p>${esc(a)}</p></details>`).join('');
  const ld = [{ '@context': 'https://schema.org', '@type': 'Article', headline: g.titel, description: g.desc, dateModified: BIJGEWERKT, author: { '@type': 'Organization', name: 'Curady' }, publisher: { '@type': 'Organization', name: 'Curady', url: BASE }, mainEntityOfPage: BASE + '/' + slug },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: g.faq.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
  return pagina({ titel: g.titel + ' | Curady', desc: g.desc, pad: '/' + slug, ld,
    body: `<h1>${esc(g.titel)}</h1><p class="lede">${esc(g.lede)}</p>
<p><a class="b" href="#q">Ask for a quote</a></p>${delen}<h2>Questions</h2>${faq}${offerteForm(slug)}` });
}

function sitemap() {
  const u = ['/', ...VOLG.map(s => '/' + s)].map(p => `<url><loc>${BASE}${p}</loc><lastmod>${BIJGEWERKT}</lastmod></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u}</urlset>`;
}
function llms() {
  return `# Curady\n\nCurady (curady.com) helps people in Europe choose and buy outdoor saunas, wood-fired hot tubs, massage chairs and kamado grills. Part of Kadoly, run by AdsFair B.V., Gouda, the Netherlands. Contact: +31 6 55395630 (phone or WhatsApp).\n\n## Buying guides\n\n${VOLG.map(s => `- [${GIDSEN[s].titel}](${BASE}/${s}): ${GIDSEN[s].desc}`).join('\n')}\n`;
}

async function leesBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let s = typeof req.body === 'string' ? req.body : '';
  if (!s) { try { for await (const c of req) { s += c; if (s.length > 20000) break; } } catch (e) {} }
  try { return JSON.parse(s); } catch (e) { return Object.fromEntries(new URLSearchParams(s)); }
}
const kap = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

async function aanvraag(req, res) {
  const b = await leesBody(req);
  const email = kap(b.email, 160).toLowerCase();
  const isForm = !String(req.headers['content-type'] || '').includes('json');
  const klaar = ok => isForm ? res.status(303).setHeader('location', '/?quote=' + (ok ? 'ok' : 'fout')).end() : res.status(ok ? 200 : 400).json({ ok });
  if (kap(b.web, 50)) return klaar(true); // honingpot: bots krijgen een ok maar worden niet bewaard
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return klaar(false);
  const product = GIDSEN[b.product] ? b.product : 'onbekend';
  const r = { t: new Date().toISOString(), product, wens: kap(b.wens, 1200), budget: kap(b.budget, 40), wanneer: kap(b.wanneer, 40), land: kap(b.land, 60), naam: kap(b.naam, 100), email, pad: kap(b.pad, 80), ref: kap(b.ref, 200), qs: kap(b.qs, 200) };
  await kv.raw(['LPUSH', 'cy:aanvragen', JSON.stringify(r)]);
  await kv.raw(['LTRIM', 'cy:aanvragen', '0', '1999']);
  await kv.incrMany([['cy:n:' + product, 1], ['cy:n:totaal', 1]]);
  return klaar(true);
}

async function stand(q, host, res) {
  const tel = await kv.mget(...['totaal', ...VOLG].map(s => 'cy:n:' + s));
  const uit = { bijgewerkt: new Date().toISOString(), aanvragen: { totaal: Number(tel[0]) || 0 } };
  VOLG.forEach((s, i) => { uit.aanvragen[s] = Number(tel[i + 1]) || 0; });
  if (q.get('vol') === '1' && /\.vercel\.app$/i.test(host)) {
    uit.laatste = ((await kv.raw(['LRANGE', 'cy:aanvragen', '0', '99'])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
  }
  res.setHeader('cache-control', 'no-store');
  return res.status(200).json(uit);
}

export async function cyOp(op, { req, res, q, host }) {
  if (op === 'cyrobots') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(`User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`); }
  if (op === 'cysitemap') { res.setHeader('content-type', 'application/xml; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600'); return res.status(200).send(sitemap()); }
  if (op === 'cyllms') { res.setHeader('content-type', 'text/plain; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=3600'); return res.status(200).send(llms()); }
  if (op === 'cyfav') { res.setHeader('content-type', 'image/svg+xml'); res.setHeader('cache-control', 'public, max-age=86400'); return res.status(200).send(FAVICON); }
  if (op === 'cyquote') { if (req.method !== 'POST') return res.status(405).send('POST only'); return aanvraag(req, res); }
  if (op === 'cystand') return stand(q, host, res);
  const s = String(q.get('s') || '');
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=300');
  if (op === 'cygids') { if (!GIDSEN[s]) return res.status(404).send(pagina({ titel: 'Page not found | Curady', desc: 'Page not found.', pad: '/' + s, body: '<h1>Page not found</h1><p><a href="/">Back to Curady</a></p>' })); return res.status(200).send(gids(s)); }
  let h = home(); if (q.get('quote') === 'ok') h = h.replace('<main>', '<main><p class="ok">Thank you. We will reply by email within one working day.</p>');
  return res.status(200).send(h);
}
