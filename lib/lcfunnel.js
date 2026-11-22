// Lasting Change Workbook: eigen funnel op lastingchange.works (verhuisd naar hjdk-api op 22 nov 2026).
// Henkjan 22 nov 2026: "LC ... moet echt totaal geoptimaliseerde mega funnel worden met het boek . Ik heb ook PDF versie die kunnen ze voor de
// helft direct kopen . Via paddle", "Die gaat eind dit jaar max verkopen leveren", "Domeinnaam ook naar dit boek verhuizen".
// Aanbod: PDF van de editie 2027 direct ($9 via Paddle, minder dan de helft van de paperback) of de paperback/hardcover op Amazon.
// Betaling: Paddle.js (openbaar client-token in fn/lc/paddle.json). Na betaling gaat de koper naar /thanks?txn=<id>; de server controleert de
// transactie bij Paddle (PADDLE_API_KEY in Vercel of in kv hjdk:secrets), toont de download en mailt de link één keer (Resend).
// Zonder PADDLE_API_KEY staat de PDF-knop uit en verwijst alles naar Amazon (geen betaling zonder levering).
// Opmaak: dezelfde als bookstuffers.com en sealedintent.com (lib/bs.js CSS). Alleen feiten uit het boek (OVERDRACHT-KDP.md 7a) en de listing.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { CSS, esc } from './bs.js';
import { LC } from './bs-data.js';

export const HOST = 'lastingchange.works', BASE = 'https://' + HOST;
export const BIJGEWERKT = '2026-11-22';
const PADDLE = JSON.parse(fs.readFileSync(new URL('../fn/lc/paddle.json', import.meta.url), 'utf8'));
export const PRIJS_ID = PADDLE.prijs, BEDRAG = PADDLE.bedrag;
const AMZ_PB = 'https://www.amazon.com/dp/' + LC.a, AMZ_HC = 'https://www.amazon.com/dp/' + LC.hc.a;
const COVER = `https://m.media-amazon.com/images/I/${LC.i}._SL900_.jpg`;
const BEDRIJF = 'Lasting Change Workbook is sold by Adsfair B.V., Albert Plesmanplein 20, 2805 AB Gouda, the Netherlands.';
const usd = p => '$' + (Number.isInteger(p) ? p : Number(p).toFixed(2));
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
export const SLUGS = ['', 'how-to-stick-to-new-years-resolutions', 'refund'];

const LC_CSS = `
.lc-held{display:grid;grid-template-columns:1fr 230px;gap:32px;align-items:start}.lc-held img{width:100%;height:auto;border-radius:6px;box-shadow:0 18px 40px rgba(17,17,19,.22)}
.lc-kies{display:flex;flex-direction:column;gap:10px}.lc-kies .btn{align-self:stretch}.lc-kies .pill{align-self:stretch}
.score{font-weight:600}.score b{letter-spacing:.06em}
.lc-tabel{border-collapse:collapse;width:100%}.lc-tabel th,.lc-tabel td{text-align:left;padding:12px 10px;border-bottom:1px solid var(--line);vertical-align:top}.lc-tabel th{font-size:13px;letter-spacing:.06em;text-transform:uppercase}.lc-tabel td b{font-size:20px}
.citaat{border-left:3px solid var(--ink);padding-left:16px;font-weight:600}
.weken{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.weken div{border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:4px}
.kal{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.kal div{border:1px solid var(--ink);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:2px}.kal b{font-size:20px}
.vast{position:sticky;bottom:0;background:#fff;border-top:1px solid var(--line);padding:10px 20px;display:none;gap:12px;align-items:center;justify-content:space-between;z-index:5}
@media (max-width:560px){.lc-held{grid-template-columns:1fr}.lc-held>.cov{order:-1}.lc-held img{max-width:170px}.weken,.kal{grid-template-columns:1fr}.vast{display:flex}}
`;

const LOGO = '<svg width="24" height="24" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#111113"/><path d="M10 17.5l4 4 8-10" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const FAVICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#111113"/><path d="M10 17.5l4 4 8-10" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Betaal-script: Paddle laadt pas bij de eerste tik op een koopknop (snellere pagina); na betaling naar /thanks met het transactie-id.
const betaalJs = (pdfAan, thanks) => `(function(){var D=document,pd=${pdfAan ? 'true' : 'false'},tok=${json(PADDLE.token)},prijs=${json(PRIJS_ID)},klaar=0,wacht=0;
function laad(f){if(window.Paddle){f();return}if(wacht){return}wacht=1;var s=D.createElement('script');s.src='https://cdn.paddle.com/paddle/v2/paddle.js';s.onload=function(){Paddle.Initialize({token:tok,eventCallback:function(e){if(e&&e.name==='checkout.completed'&&e.data&&e.data.transaction_id){location.href=${json(thanks)}+encodeURIComponent(e.data.transaction_id)}}});klaar=1;f()};D.head.appendChild(s)}
D.addEventListener('click',function(e){var b=e.target.closest('[data-koop]');if(!b)return;if(!pd){return}e.preventDefault();laad(function(){Paddle.Checkout.open({items:[{priceId:prijs,quantity:1}],customData:{src:'lc-funnel',plek:b.getAttribute('data-koop')},settings:{displayMode:'overlay',theme:'light',locale:'en',allowLogout:false}})})});
var k=D.getElementById('kal');if(k){var d=new Date();d.setHours(12);function f(n){var x=new Date(d.getTime()+n*864e5);return x.toLocaleDateString('en-US',{month:'long',day:'numeric'})}k.querySelector('[data-d="0"]').textContent=f(0);k.querySelector('[data-d="30"]').textContent=f(30);k.querySelector('[data-d="66"]').textContent=f(66)}
var v=D.querySelector('.vast'),h=D.getElementById('kopen');if(v&&h&&'IntersectionObserver' in window){new IntersectionObserver(function(x){v.style.visibility=x[0].isIntersecting?'hidden':'visible'}).observe(h)}})();`;

function schil(c, o) {
  const canon = BASE + '/' + o.slug;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">`
    + `<title>${esc(o.title)}</title><meta name="description" content="${esc(o.desc)}"><meta name="robots" content="${c.echt && !o.noindex ? 'index,follow,max-snippet:-1,max-image-preview:large' : 'noindex,nofollow'}"><link rel="canonical" href="${canon}">`
    + `<meta property="og:type" content="website"><meta property="og:site_name" content="Lasting Change"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${COVER}">`
    + `<link rel="icon" type="image/svg+xml" href="${c.echt ? '/favicon.svg' : '/api/bs?site=lc&op=fav'}"><meta name="theme-color" content="#111113"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://m.media-amazon.com">`
    + `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"><style>${CSS}${LC_CSS}</style>`
    + (o.ld || []).map(x => `<script type="application/ld+json">${json(x)}</script>`).join('')
    + `<script src="/cm.js" data-site="lastingchange" async></script></head><body>`
    + `<header><div class="top-in"><a class="merk" href="${c.L('')}">${LOGO}<span>lasting<span>change</span></span></a><nav><a href="${c.L('how-to-stick-to-new-years-resolutions')}">Why resolutions fail</a></nav></div></header>`
    + `<main><article>${o.body}</article></main>`
    + `<footer><div><p>${esc(BEDRIJF)} Payments for the PDF are processed by Paddle. The paperback and hardcover are sold and shipped by Amazon.</p><p><a href="${c.L('refund')}">60-day refund on the PDF</a> · <a href="https://bookstuffers.com/all-books">More books from the same publisher</a></p></div></footer>`
    + (o.vast || '') + `<script>${betaalJs(c.pdf, c.echt ? '/thanks?txn=' : '/api/bs?site=lc&op=thanks&txn=')}</script></body></html>`;
}

function kopen(c, plek) {
  const pdf = c.pdf ? `<a class="btn" href="${c.L('')}#kopen" data-koop="${plek}">Get the PDF now, ${usd(BEDRAG)}</a>` : '';
  return `<div class="lc-kies">${pdf}<a class="${c.pdf ? 'pill' : 'btn'}" href="${AMZ_PB}" rel="noopener">Paperback on Amazon, ${usd(LC.p)}</a></div>`;
}

const FAQ = [
  ['What do I get with the PDF?', `The complete 2027 edition of the Lasting Change Workbook, ${LC.n} pages, the same pages as the paperback. You download it right after paying and get the link by email too. Print the pages you need or fill it in on a tablet.`],
  ['Why is the PDF less than half the price?', 'There is no printing, no shipping and no store in between. You get the same workbook for less.'],
  ['What if I miss a day?', 'There is a bad-day card in the back of the workbook for exactly that day. You do the next check-in and keep going.'],
  ['How much time does it take each day?', 'One exercise and a short check-in. The workbook starts so small that a busy day is not an excuse.'],
  ['Can I get my money back?', 'Yes. If the PDF does not help you, email us within 60 days and you get a full refund. You keep the file.'],
  ['Is this for New Year’s resolutions?', 'Yes, and for any Monday you start over. Day 0 can be today, so you do not have to wait for January 1.'],
];

function home(c) {
  const sc = `<p class="score"><b>★★★★☆</b> ${LC.r} out of 5 from ${LC.c} ratings on Amazon</p>`;
  const krijg = ['A 30-day card, so you always see where you are.', 'One habit to pick, a Day 0 to set it up and a contract with yourself.', 'Every day one exercise, a short Why it works with a real source and the same two-minute check-in.', 'Weekly reviews on days 7, 14, 21 and 28, and a certificate on day 30.', 'Days 31 to 66, one page a day, and a tracker up to day 120.', 'A bad-day card for the day you want to quit.', 'A QR code to message the author with your question.'];
  const weken = [['Week 1', 'Start tiny'], ['Week 2', 'Make it easy on hard days'], ['Week 3', 'Make it stick'], ['Week 4', 'Make it me']];
  const body = `<section class="lc-held"><div class="stack"><p class="eb">New for 2027</p><h1>Don’t throw away another year.</h1>`
    + `<p class="intro">If this year went by without the change you promised yourself, you are not lazy and you are not broken. You never had a way to keep going after day three. This workbook is that way: one habit, 30 days, one short check-in a day.</p>${sc}<div id="kopen">${kopen(c, 'boven')}</div>`
    + (c.pdf ? `<p class="klein">PDF: instant download, 60-day refund. Paperback: ${LC.n} pages, ships from Amazon.</p>` : '')
    + `</div><a class="cov" href="${AMZ_PB}" rel="noopener"><img src="${COVER}" alt="Lasting Change Workbook 2027 edition, book cover" width="600" height="900" loading="eager" decoding="async"></a></section>`
    + `<section class="stack"><h2>Sound familiar?</h2><ul class="k"><li>January 2 I was all in. By January 20 the plan was a plan again.</li><li>I start strong on Monday. By Thursday something comes up and it is over.</li><li>I know exactly what to do. I just do not do it.</li></ul><p class="citaat">The problem was never knowing what to do. It is doing it on the day you do not feel like it.</p></section>`
    + `<section class="stack"><h2>Four weeks, one habit</h2><div class="weken">${weken.map(([w, t]) => `<div><span class="eb">${w}</span><b>${t}</b></div>`).join('')}</div><p>You start so small it feels almost silly, plan for the bad days before they come, and by week four the habit is part of who you are, not something you force.</p></section>`
    + `<section class="stack" id="kal"><h2>If you start today</h2><div class="kal"><div><span class="eb">Day 0</span><b data-d="0">today</b><span>pick one habit</span></div><div><span class="eb">Day 30</span><b data-d="30">in 30 days</b><span>certificate</span></div><div><span class="eb">Day 66</span><b data-d="66">in 66 days</b><span>it runs on its own</span></div></div><p>In a 2010 study by Phillippa Lally and colleagues, a new habit took a median of 66 days to feel automatic. That is why the workbook does not stop at day 30.</p></section>`
    + `<section class="stack"><h2>What is inside</h2><ul class="k">${krijg.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>`
    + `<section class="stack"><h2>Choose how you want it</h2><table class="lc-tabel"><thead><tr><th></th><th>Price</th><th>You get it</th></tr></thead><tbody>`
    + (c.pdf ? `<tr><td>PDF, 2027 edition</td><td><b>${usd(BEDRAG)}</b></td><td>Right now, by download and email</td></tr>` : '')
    + `<tr><td>Paperback</td><td><b>${usd(LC.p)}</b></td><td>Shipped by Amazon</td></tr><tr><td>Hardcover</td><td><b>${usd(LC.hc.p)}</b></td><td>Shipped by Amazon</td></tr></tbody></table>${kopen(c, 'tabel')}<p><a href="${AMZ_HC}" rel="noopener">Or the hardcover on Amazon</a></p></section>`
    + `<section class="stack"><h2>Questions</h2><div class="faq">${FAQ.map(([v, a]) => `<div><h3>${esc(v)}</h3><p>${esc(a)}</p></div>`).join('')}</div></section>`
    + `<section class="stack"><h2>This year, I choose.</h2><p>Not next Monday, not January 1. One habit, starting today.</p>${kopen(c, 'onder')}</section>`;
  const vast = `<div class="vast np"><span><b>${c.pdf ? usd(BEDRAG) + ' PDF' : usd(LC.p)}</b> · ${LC.r}★ (${LC.c})</span>${c.pdf ? `<a class="btn" href="#kopen" data-koop="balk">Get it now</a>` : `<a class="btn" href="${AMZ_PB}" rel="noopener">On Amazon</a>`}</div>`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'Book', name: LC.t, author: { '@type': 'Person', name: LC.auteur }, image: COVER, url: BASE + '/', numberOfPages: LC.n, aggregateRating: { '@type': 'AggregateRating', ratingValue: LC.r, ratingCount: LC.c },
    workExample: [{ '@type': 'Book', bookFormat: 'https://schema.org/Paperback', offers: { '@type': 'Offer', price: Number(LC.p).toFixed(2), priceCurrency: 'USD', url: AMZ_PB } }, ...(c.pdf ? [{ '@type': 'Book', bookFormat: 'https://schema.org/EBook', offers: { '@type': 'Offer', price: Number(BEDRAG).toFixed(2), priceCurrency: 'USD', url: BASE + '/' } }] : [])] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
  return schil(c, { slug: '', title: 'Lasting Change Workbook 2027: One Habit, 30 Days, No More Lost Years', desc: `Did nothing this year? The Lasting Change Workbook is one habit, 30 days and a daily check-in. Rated ${LC.r} out of 5 by ${LC.c} readers on Amazon.`, body, vast, ld });
}

function voornemens(c) {
  const stappen = [['Pick one habit, not five.', 'Every extra goal splits the energy you have on a hard day.'], ['Make it so small you cannot say no.', 'Two minutes counts. You grow it once it runs on its own.'], ['Tie it to something you already do.', 'After coffee, after brushing your teeth, after you park the car.'], ['Plan the bad day before it comes.', 'Decide now what the smallest version is on a sick, busy or tired day.'], ['Check in every day.', 'One tick on paper shows you the streak, and a broken streak gets restarted the next day, not next Monday.'], ['Give it 66 days, not 21.', 'In a 2010 study by Phillippa Lally and colleagues, the median time for a new habit to feel automatic was 66 days.']];
  const vragen = [['Why do most New Year’s resolutions fail?', 'They are too big, too many and depend on motivation, which fades within weeks. Habits that start tiny and come with a plan for bad days last longer.'], ['How long does it take to form a habit?', 'In the 2010 study by Lally and colleagues the median was 66 days, with a wide range from 18 to 254 days depending on the person and the habit.'], ['Should I start on January 1?', 'You can start any day. Day 0 can be today, so the habit is already running when January comes.']];
  const body = `<div class="kopblok"><p class="eb">Updated ${new Date(BIJGEWERKT + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p><h1>How to stick to your New Year’s resolutions</h1></div>`
    + `<p class="intro">Pick one habit, start it so small you cannot say no, plan your bad days in advance and check in every day for 66 days. Motivation gets you started. A system keeps you going.</p>`
    + `<section class="stack"><h2>Six steps that make it stick</h2><ol class="stappen">${stappen.map(([k, t]) => `<li><b>${esc(k)}</b> ${esc(t)}</li>`).join('')}</ol></section>`
    + `<section class="lc-held"><div class="stack"><p class="eb">The workbook for this</p><h2>Lasting Change Workbook</h2><p>These six steps, day by day for 30 days, with a check-in and a bad-day card. ${LC.r} out of 5 from ${LC.c} ratings on Amazon.</p>${kopen(c, 'artikel')}</div><a class="cov" href="${c.L('')}"><img src="${COVER}" alt="Lasting Change Workbook, book cover" width="600" height="900" loading="lazy" decoding="async"></a></section>`
    + `<section class="stack"><h2>Questions</h2><div class="faq">${vragen.map(([v, a]) => `<div><h3>${esc(v)}</h3><p>${esc(a)}</p></div>`).join('')}</div></section>`;
  return schil(c, { slug: 'how-to-stick-to-new-years-resolutions', title: 'How to Stick to Your New Year’s Resolutions: 6 Steps', desc: 'Why most New Year’s resolutions fail and six steps that make one stick: one habit, start tiny, plan bad days, check in daily, give it 66 days.', body, ld: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: vragen.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) }] });
}

function terug(c) {
  const body = `<div class="kopblok"><h1>60-day refund on the PDF</h1></div><p class="intro">If the PDF of the Lasting Change Workbook does not help you, email us within 60 days of buying it and you get your money back in full, including any tax. You keep the file.</p><p>The refund goes back to the card or account you paid with through Paddle and shows up within five to ten working days. The paperback and hardcover are sold by Amazon, so Amazon’s return policy applies to them.</p><p>${esc(BEDRIJF)}</p>`;
  return schil(c, { slug: 'refund', title: 'Refund Policy: 60 Days on the Lasting Change PDF', desc: 'Email us within 60 days of buying the Lasting Change Workbook PDF and get a full refund. You keep the file. Paperback returns go through Amazon.', body });
}

const PAG = { '': home, 'how-to-stick-to-new-years-resolutions': voornemens, refund: terug };
export function renderLc(slug, c) { const f = PAG[slug]; return f ? f(c) : null; }

// --- betaling en levering -------------------------------------------------------------------------------------------------------
export async function paddleSleutel(kv) { if (process.env.PADDLE_API_KEY) return process.env.PADDLE_API_KEY; try { const s = (await kv.get('hjdk:secrets')) || {}; return s.PADDLE_API_KEY || ''; } catch (e) { return ''; } }
const geheim = () => process.env.HJDK_TOKEN || process.env.RESEND_API_KEY || 'lc';
export function tekenDownload(txn, dagen = 30) { const e = Math.floor(Date.now() / 1000) + dagen * 86400, s = crypto.createHmac('sha256', geheim()).update(`lc|${txn}|${e}`).digest('base64url').slice(0, 32); return `t=${encodeURIComponent(txn)}&e=${e}&s=${s}`; }
export function checkDownload(q) { const t = q.get('t') || '', e = +q.get('e') || 0, s = q.get('s') || ''; if (!t || !e || e < Date.now() / 1000) return false; const v = crypto.createHmac('sha256', geheim()).update(`lc|${t}|${e}`).digest('base64url').slice(0, 32); return s.length === v.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(v)); }
export const PDF_PAD = new URL('../fn/lc/lasting-change-workbook-2027.pdf', import.meta.url);

// Controleert een transactie bij Paddle: betaald en met onze prijs. Geeft { ok, email } of { ok:false, reden }.
export async function checkTransactie(kv, txn) {
  if (!/^txn_[a-z0-9]{10,40}$/i.test(txn)) return { ok: false, reden: 'ongeldig' };
  const key = await paddleSleutel(kv); if (!key) return { ok: false, reden: 'geen sleutel' };
  try {
    const r = await fetch(`https://api.paddle.com/transactions/${txn}?include=customer`, { headers: { Authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return { ok: false, reden: 'paddle ' + r.status };
    const d = (await r.json()).data || {};
    const betaald = ['paid', 'completed'].includes(d.status), onze = (d.items || []).some(i => i.price && i.price.id === PRIJS_ID);
    return betaald && onze ? { ok: true, email: (d.customer && d.customer.email) || '', bedrag: d.details && d.details.totals && d.details.totals.grand_total } : { ok: false, reden: betaald ? 'ander product' : 'nog niet betaald (' + d.status + ')' };
  } catch (e) { return { ok: false, reden: 'paddle niet bereikbaar' }; }
}

export function bedanktPagina(c, { ok, link, reden }) {
  const body = ok
    ? `<div class="kopblok"><p class="eb">Thank you</p><h1>Your workbook is ready.</h1></div><p class="intro">Download it now. We also sent the link to your email, so you can always find it again.</p><a class="btn" href="${link}">Download the PDF</a><section class="stack"><h2>Start with Day 0 today</h2><ol class="stappen"><li>Open the PDF and read How it works.</li><li>Pick your one habit on the Choose a habit page.</li><li>Fill in Day 0 and the contract. That is all for today.</li></ol><p>Tomorrow is Day 1. If you get stuck, the QR code in the book lets you message the author.</p></section>`
    : `<div class="kopblok"><h1>We are checking your payment.</h1></div><p class="intro">This usually takes a few seconds. This page refreshes by itself. If it takes longer, the download link is also on its way to your email.</p><script>setTimeout(function(){location.reload()},4000)</script>`;
  return schil(c, { slug: 'thanks', title: 'Thank you: your Lasting Change Workbook', desc: 'Download your Lasting Change Workbook PDF.', body, noindex: true });
}

export async function mailDownload(email, link) {
  const key = process.env.RESEND_API_KEY; if (!key || !email) return false;
  const html = `<div style="font:16px/1.6 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:#111113;max-width:520px;margin:0 auto;padding:24px 16px"><p>Hi,</p><p>Thank you for getting the Lasting Change Workbook. Here is your PDF:</p><p><a href="${link}" style="display:inline-block;background:#111113;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Download the workbook</a></p><p>Start with Day 0 today: pick one habit and fill in the contract. That is all.</p><p>John Warrior</p><p style="font-size:13px">The link works for 30 days. Lost it? Reply to this email. Not helpful? Reply within 60 days for a full refund.</p></div>`;
  try { const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.LC_FROM || 'Lasting Change <john@lastingchange.works>', to: [email], subject: 'Your Lasting Change Workbook (PDF)', html }), signal: AbortSignal.timeout(10000) }); return r.ok; } catch (e) { return false; }
}

export const ROBOTS = `User-agent: *\nAllow: /\nDisallow: /thanks\nDisallow: /download\n\nSitemap: ${BASE}/sitemap.xml\n`;
export const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SLUGS.map(s => `<url><loc>${BASE}/${s}</loc><lastmod>${BIJGEWERKT}</lastmod></url>`).join('\n')}\n</urlset>\n`;
export const llms = () => `# Lasting Change Workbook\n\n> A 30-day habit workbook (2027 edition, ${LC.n} pages) for people who did nothing with this year and want next year to be different: one habit, start tiny, plan bad days, a daily check-in, then days 31 to 66 and a tracker to day 120. Rated ${LC.r} out of 5 by ${LC.c} readers on Amazon. Paperback ${usd(LC.p)} on Amazon; PDF ${usd(BEDRAG)} on this site with a 60-day refund.\n\n## Pages\n- [Lasting Change Workbook](${BASE}/): what is inside, the four weeks and how to buy.\n- [How to stick to New Year's resolutions](${BASE}/how-to-stick-to-new-years-resolutions): six steps, why resolutions fail, how long a habit takes (66 days median, Lally 2010).\n- [Refund policy](${BASE}/refund): 60 days on the PDF.\n`;
