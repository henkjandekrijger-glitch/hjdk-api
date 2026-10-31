// gids.kadoly.com: keuzehulpen van Kadoly zelf, voor zoekers in Google en AI-assistenten (Henkjan 30 okt 2026: "We gaan Kadoly.help maken
// en daar keuzehulpen maken voor alle content van Kadoly ... de long game om te verkopen via SEO en LLM ... Dit is ons LAB ook voor Kadoly";
// op de vraag waar: "gids.kadoly.com"). Plan en werkwijze: OVERDRACHT-KADOLY-GIDS.md.
// Regels: eerst de lijst met prijs en levertijd van vandaag, de keuzehulp als knop eronder; per product een eerlijke beperking; afraden alleen
// op harde feiten (maat, onderdelen, levertijd tegenover een deadline), want we hebben de producten niet zelf vastgehad (Henkjan: nog niet
// zelf bestellen). Alles wat AI moet kunnen citeren staat in de HTML. Geen gedachtestreepjes. Prijzen live uit de shopcatalogus.
// Kliks naar de shop gaan via /naar/<pid> (api/shop.js op=gidsuit): Clickmind meet de keten tot betaald per gids.
import { kv } from '../lib/db.js';
import { lookNieuw } from '../lib/look.js';
import { GIDSEN, GIDS_IDS } from '../lib/gidsen-kadoly.js';
import { berichten, HAIKU } from '../lib/ai.js';
import { createHash } from 'node:crypto';

const HOST = 'https://gids.kadoly.com';
const ACC = { acc: '#1D9BF0', acc2: '#E8F4FD', accD: '#60A5FA', acc2D: '#13202E' }; // Kadoly-blauw (30 okt, Henkjan: "Neem design van Kadoly over"; uitgelezen met op=stijl)
const WA = '31655395630'; // WhatsApp van Henkjan voor dringende vragen (30 okt: "Kan escaleren naar mij +31655395630 whatsapp als dringende vragen over iets"); staat ook in de voet van kadoly.com
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = v => '€' + N(v).toFixed(2).replace('.', ',');
const isBot = ua => /bot|crawl|spider|slurp|headless|preview|facebookexternalhit|python|curl|wget|monitor|lighthouse|pingdom/i.test(String(ua || ''));
const DAG = () => new Date().toISOString().slice(0, 10);
const INDEXNOW_KEY = '9eed19b173ae0446f4f8e9d13ef50c6d'; // IndexNow-sleutel van gids.kadoly.com (staat ook als bestand op /9eed19b173ae0446f4f8e9d13ef50c6d.txt)
const AIBOT = /(GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|Claude-User|PerplexityBot|Perplexity-User|Google-Extended|Googlebot|bingbot|Applebot|CCBot|meta-externalagent|Bytespider|DuckAssistBot|YandexBot)/i;
// lerende volgorde (30 okt, Henkjan: "maak wat je neerzet helemaal lerend"): kliks per product (gk:p:<gids>, via /naar) tegen weergaven (_v, via het baken)
async function geleerd(slug) { try { const a = await kv.raw(['HGETALL', 'gk:p:' + slug]); const o = {}; if (Array.isArray(a)) for (let i = 0; i + 1 < a.length; i += 2) o[a[i]] = N(a[i + 1]); return o; } catch (e) { return {}; } }
async function telBot(ua, waar) { const m = String(ua || '').match(AIBOT); if (!m) return; try { const k = 'gk:d:' + DAG(); await kv.raw(['HINCRBY', k, '_bot|' + m[1].toLowerCase() + '|' + waar, '1']); await kv.raw(['EXPIRE', k, String(60 * 86400)]); } catch (e) {} }

let CAT = null, CAT_AT = 0, META = '', META_AT = 0; // META: Search Console-verificatie (gk:gscmeta, gezet door /api/gsc?op=verifieer&methode=META)
async function catalogus() {
  if (CAT && Date.now() - CAT_AT < 300000) return CAT;
  let c = null; try { c = await kv.get('hjdk:shop:cat'); } catch (e) {}
  const m = {}; for (const i of ((c && c.items) || [])) m[i.id] = i;
  CAT = m; CAT_AT = Date.now(); return m;
}
const thuis = i => Math.round((N(i.p) + (i.fs ? 0 : N(i.vk))) * 100) / 100;
const leverDatum = lt => { const d = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' }) + 'T12:00:00Z'); let n = Math.max(1, N(lt) || 5); while (n > 0) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) n--; } return d; };
const nlDatum = d => d.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'long', day: 'numeric', month: 'long' });

// teller per gids per dag in één hash (klein: de database is krap)
async function tel(slug, soort) { try { const k = 'gk:d:' + DAG(); await kv.raw(['HINCRBY', k, slug + '|' + soort, '1']); await kv.raw(['EXPIRE', k, String(60 * 86400)]); } catch (e) {} }

function ldJson(g, items) {
  const org = { '@type': 'Organization', '@id': HOST + '/#org', name: 'Kadoly', url: 'https://kadoly.com' };
  const lijst = { '@type': 'ItemList', name: g.h1, itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: x.naam, image: x.img || undefined, brand: x.merk ? { '@type': 'Brand', name: x.merk } : undefined, description: x.waarom, offers: { '@type': 'Offer', price: N(x.prijs).toFixed(2), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: 'https://kadoly.com/product/' + x.pid, shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: N(x.verzending).toFixed(2), currency: 'EUR' }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NL' } } } } })) };
  const faq = g.faq && g.faq.length ? { '@type': 'FAQPage', mainEntity: g.faq.map(f => ({ '@type': 'Question', name: f.v, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
  const kruim = { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kadoly gids', item: HOST + '/' }, { '@type': 'ListItem', position: 2, name: g.h1, item: HOST + '/' + g.slug }] };
  const art = { '@type': 'Article', headline: g.h1, dateModified: g.bijgewerkt, author: { '@id': HOST + '/#org' }, publisher: { '@id': HOST + '/#org' }, mainEntityOfPage: HOST + '/' + g.slug };
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, art, kruim, lijst, faq].filter(Boolean) }).replace(/</g, '\\u003c');
}

const KAD = 'html{--prim:#111827;--on-prim:#fff;--link:#2563EB;--nav:hsla(0,0%,100%,.86);--veld:rgba(15,23,42,.05);--sh:0 16px 40px -12px rgba(15,23,42,.22),0 2px 6px rgba(15,23,42,.06)}';
const KAD_D = '--ink:#F3F4F6;--ink-2:#F3F4F6;--ink-3:#F3F4F6;--line:rgba(255,255,255,.1);--line-strong:rgba(255,255,255,.22);--bg:#0f1012;--bg-2:#17181c;--acc:#60A5FA;--acc-2:#13202E;--on-acc:#0f1012';
const KAD_D2 = '--prim:#F3F4F6;--on-prim:#0f172a;--link:#60A5FA;--nav:rgba(20,21,23,.86);--veld:hsla(0,0%,100%,.07);--sh:0 16px 40px -12px rgba(0,0,0,.6)';
const CSS_KADOLY = `:root{--ink:#0B0D12;--ink-2:#0B0D12;--ink-3:#0B0D12;--line:#E6E8EB;--line-strong:#C9CED6;--bg:#fff;--bg-2:#F6F7F9;--acc:#1D9BF0;--acc-2:#E8F4FD;--on-acc:#fff}${KAD}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${KAD_D};${KAD_D2}}}:root[data-theme=dark]{${KAD_D};${KAD_D2}}
body{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.kn{position:sticky;top:0;z-index:20;background:var(--nav);-webkit-backdrop-filter:saturate(180%) blur(12px);backdrop-filter:saturate(180%) blur(12px);border-bottom:1px solid var(--line)}
.kn-in{max-width:72rem;margin:0 auto;padding:10px 16px;display:flex;align-items:center;gap:14px}.kn-merk{display:inline-flex;align-items:center;gap:8px;color:var(--ink);text-decoration:none;font-weight:700;font-size:1.125rem;letter-spacing:-.02em;flex:none}
.kn-gids{font-weight:600;color:var(--ink-3);font-size:.9375rem;border-left:1px solid var(--line);padding-left:9px;margin-left:1px}.kn-zoek{position:relative;flex:1;max-width:36rem;margin:0 auto}
.kn-zoek input{width:100%;height:44px;min-height:0;border:1px solid transparent;border-radius:12px;background:var(--veld);color:var(--ink);font:inherit;font-size:1rem;padding:0 14px 0 40px;outline:none;-webkit-appearance:none;appearance:none}
.kn-zoek input:focus{background:var(--bg);border-color:var(--acc);box-shadow:0 0 0 3px var(--acc-2)}.kn-zoek>svg{position:absolute;left:13px;top:13px;color:var(--ink-3);pointer-events:none}
.kn-shop{flex:none;color:var(--ink);text-decoration:none;font-weight:600;font-size:.9375rem;display:inline-flex;gap:7px;align-items:center}
@media(max-width:640px){.kn-in{flex-wrap:wrap;gap:10px}.kn-zoek{order:3;flex-basis:100%;max-width:none}.kn-shop{margin-left:auto}}
.kz{position:absolute;left:0;right:0;top:50px;background:var(--bg);border:1px solid var(--line);border-radius:12px;box-shadow:var(--sh);max-height:70vh;overflow:auto;padding:6px;z-index:25}.kz[hidden]{display:none}
.kzr{display:grid;grid-template-columns:44px 1fr auto;gap:10px;align-items:center;padding:8px;border-radius:8px;color:var(--ink);text-decoration:none;font-size:.9375rem;line-height:1.3}.kzr:hover,.kzr:focus{background:var(--bg-2);outline:none}
.kzr img{width:44px;height:44px;object-fit:cover;border-radius:8px;background:var(--bg-2)}.kzr b{font-weight:700;white-space:nowrap}.kzg{display:block;padding:9px 8px;border-radius:8px;color:var(--ink);text-decoration:none;font-weight:600;font-size:.9375rem}.kzg:hover{background:var(--bg-2)}
.kzk{font-size:.6875rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);padding:8px 8px 4px;font-weight:600}.kzv{width:100%;text-align:left;border:0;background:var(--acc-2);color:var(--ink);border-radius:10px;padding:12px;font:inherit;font-weight:600;cursor:pointer;margin:6px 0 0}
.kc{position:fixed;right:16px;bottom:16px;width:min(26rem,calc(100vw - 32px));height:min(38rem,calc(100vh - 32px));display:flex;flex-direction:column;background:var(--bg);border:1px solid var(--line);border-radius:16px;box-shadow:var(--sh);z-index:40}.kc[hidden]{display:none}
.kc-kop{display:flex;align-items:center;gap:9px;padding:12px 14px;border-bottom:1px solid var(--line);font-weight:700}.kc-kop small{display:block;font-weight:400;color:var(--ink-3);font-size:.75rem}.kc-kop button{margin-left:auto;border:0;background:none;font-size:1.5rem;line-height:1;cursor:pointer;color:var(--ink-2);padding:4px 6px}
.kc-log{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}.kc-m{max-width:90%;padding:10px 12px;border-radius:14px;font-size:.9375rem;line-height:1.5;white-space:pre-wrap}.kc-u{align-self:flex-end;background:var(--prim);color:var(--on-prim);border-bottom-right-radius:4px}.kc-a{align-self:flex-start;background:var(--bg-2);border-bottom-left-radius:4px}
.kc-p{display:grid;grid-template-columns:48px 1fr;gap:10px;align-items:center;margin:8px 0 0;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);text-decoration:none;font-size:.875rem;line-height:1.35;white-space:normal}.kc-p img{width:48px;height:48px;border-radius:8px;object-fit:cover}
.kc-wa{display:inline-flex;align-items:center;gap:8px;margin:10px 0 0;background:#25D366;color:#fff;border-radius:12px;padding:10px 14px;font-weight:700;text-decoration:none;white-space:normal}.kc-in{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line)}
.kc-in input{flex:1;min-width:0;height:44px;min-height:0;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font:inherit;font-size:1rem;padding:0 12px}.kc-in button{height:44px;border:0;border-radius:12px;background:var(--prim);color:var(--on-prim);font:inherit;font-weight:700;padding:0 16px;cursor:pointer}
.kc-voet{font-size:.75rem;color:var(--ink-3);padding:0 14px 10px}.kc-voet a{color:var(--ink-3)}@media(max-width:640px){.kc{right:0;left:0;bottom:0;width:100%;height:88vh;border-radius:16px 16px 0 0}}
.kv{border-top:1px solid var(--line);margin:48px 0 0;padding:28px 0 40px;font-size:.875rem;color:var(--ink-3)}.kv-in{max-width:72rem;margin:0 auto;padding:0 16px}.kv-cols{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:22px}.kv-h{font-weight:700;color:var(--ink);margin:0 0 8px}.kv a{display:block;color:var(--ink-2);text-decoration:none;margin:0 0 6px}.kv a:hover{color:var(--ink)}
.kv-merk{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--ink);font-size:1rem}.kv-pay{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:12px 0 0;font-size:.75rem}.kv-pay img,.kv-pay svg{display:block;height:18px;width:auto}.kv-onder{border-top:1px solid var(--line);margin:22px 0 0;padding:16px 0 0;display:flex;flex-wrap:wrap;gap:8px 18px;justify-content:space-between}.kv-onder a{display:inline;margin:0}.kv-legal{display:flex;flex-wrap:wrap;gap:14px}
@media(max-width:720px){.kv-cols{grid-template-columns:1fr 1fr}}`;
// opmaak van de gidsen: outname.now (Henkjan 30 okt: "betere kadoly opmaak meer LLM optimised bijv looks van outname.now met de plusjes"), in Kadoly-kleuren
const CSS_GIDS = `main.wrap{padding-top:34px}.wrap{max-width:820px}.meta{opacity:1;font-size:16px;margin:0 0 22px}.kicker{color:var(--ink)}.kicker .live-dot{background:var(--acc)}
.btn{border-radius:999px;font-weight:600;font-size:17px;padding:13px 22px}.btn.knop{background:var(--prim);border-color:var(--prim);color:var(--on-prim)}.btn.deel{background:transparent;border:1px solid var(--line-strong);color:var(--ink)}
.toc{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}.toc a{border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:16px;text-decoration:none!important}.toc a:hover{border-color:var(--acc)}
.pk{display:grid;grid-template-columns:120px 1fr;gap:20px;border:1px solid var(--line);border-radius:16px;padding:20px;margin:0 0 14px;background:var(--bg)}.pk-img img{width:120px;height:120px;object-fit:cover;border-radius:12px;background:var(--bg-2);display:block}
.pk h3{margin:2px 0 6px;font-size:20px}.pk p{margin:0 0 10px}.pk-lab{font-size:16px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;display:flex;align-items:center;gap:10px}.pk-nr{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--acc-2);font-size:14px;letter-spacing:0}
.pk-prijs b{font-size:20px}.pk-dag{white-space:nowrap}.pk-let{border-left:3px solid var(--acc);padding:2px 0 2px 12px}.pk .btn{margin:4px 0 0}
dl.rows{margin:0 0 8px;border-top:1px solid var(--line)}dl.rows .r{display:grid;grid-template-columns:minmax(10rem,15rem) 1fr;gap:18px;border-bottom:1px solid var(--line);padding:16px 0}dl.rows dt{font-weight:600}dl.rows dd{margin:0}
.q{margin:32px 0 0}.q fieldset{border:0;padding:0;margin:0 0 18px}.q legend{font-weight:600;margin:0 0 10px;padding:0}.q .opt{position:relative;display:inline-flex;align-items:center}.q .opt input{position:absolute;opacity:0;pointer-events:none}.q .opt:has(input:checked){background:var(--prim);border-color:var(--prim);color:var(--on-prim);font-weight:600}.q .opt:has(input:focus-visible){box-shadow:0 0 0 3px var(--acc-2)}.uitkomst{margin:16px 0 0}.uitkomst:empty{display:none}
details.faq{padding:18px 0}details.faq summary{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}details.faq summary::after{content:"+";flex:none;font-size:28px;line-height:.9;font-weight:300;color:var(--ink);transition:transform .2s}details.faq[open] summary::after{transform:rotate(45deg)}details.faq .a p{margin:10px 0 0}
.kh .opt.on{background:var(--prim);border-color:var(--prim);color:var(--on-prim)}.kh h2{font-size:20px;margin:24px 0 10px}.kh>h2:first-child{margin-top:0}.opt .tel{font-size:inherit;font-weight:400}.kh .pk{margin-top:14px}.cards a.card{text-decoration:none!important}.card .cat{opacity:1}
.rg{display:grid;gap:14px;grid-template-columns:repeat(3,minmax(0,1fr));margin:18px 0 0}.rk{display:flex;flex-direction:column;gap:6px;border:1px solid var(--line);border-radius:16px;padding:14px;text-decoration:none!important;color:var(--ink)}.rk:hover{border-color:var(--acc)}.rk-img{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:0 0 6px}.rk-img img,.rk-img i{width:100%;height:auto;min-width:0;aspect-ratio:1;object-fit:cover;border-radius:10px;background:var(--bg-2);display:block}.rk h3{margin:0;font-size:20px}.rk p{margin:0;font-size:16px}
.pg{display:grid;gap:14px;grid-template-columns:repeat(4,minmax(0,1fr));margin:14px 0 8px}.mk{display:flex;flex-direction:column;gap:3px;text-decoration:none!important;color:var(--ink);font-size:16px;line-height:1.35}.mk img,.mk-leeg{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;background:var(--bg-2);display:block;margin:0 0 6px;border:1px solid var(--line)}.mk:hover img{border-color:var(--acc)}.mk-n{font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.mk-p b{font-size:18px}.tel{font-weight:400;font-size:18px}
@media(max-width:820px){.rg{grid-template-columns:repeat(2,minmax(0,1fr))}.pg{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.rg{grid-template-columns:1fr}}
@media(max-width:640px){.pk{grid-template-columns:84px 1fr;gap:14px;padding:16px}.pk-img img{width:84px;height:84px}dl.rows .r{grid-template-columns:1fr;gap:4px}}`;

function kop(titel, besch, pad, extra, zoekQ) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)}</title><meta name="description" content="${esc(besch)}"><link rel="canonical" href="${HOST}${pad}">${META ? `<meta name="google-site-verification" content="${esc(META)}">` : ''}<meta property="og:title" content="${esc(titel)}"><meta property="og:description" content="${esc(besch)}"><meta property="og:url" content="${HOST}${pad}"><meta property="og:type" content="article"><meta property="og:locale" content="nl_NL"><link rel="icon" type="image/svg+xml" href="https://cdn.kadoly.com/icon/shop/shop-mark.svg?v=1"><link rel="icon" type="image/png" sizes="32x32" href="https://cdn.kadoly.com/icon/shop/icon-32.png?v=1"><link rel="apple-touch-icon" sizes="180x180" href="https://cdn.kadoly.com/icon/shop/apple-180.png?v=1"><meta name="theme-color" content="#ffffff">${extra || ''}<style>${lookNieuw(ACC)}${CSS_KADOLY}${CSS_GIDS}</style></head><body>${KOPBALK(zoekQ)}<main class="wrap">`;
}
// merkteken van kadoly.com zelf (kop van kadoly.com, 30 okt uitgelezen)
const MERK = s => `<svg width="${s}" height="${s}" viewBox="0 0 34 34" aria-hidden="true" focusable="false"><rect width="34" height="34" rx="9" fill="#1D9BF0"/><path d="M17 21l-7-8M17 21l7-8M13 14l-3-1 .6 3.1M23.4 16.1L24 13l-3 1" stroke="#D6ECFC" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M17 28V8M18.6 10.8L17 8l-1.6 2.8" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const SHOPMERK = s => `<svg width="${s}" height="${s}" viewBox="0 0 34 34" aria-hidden="true" focusable="false"><rect width="34" height="34" rx="9" fill="#1D9BF0"/><path d="M9 13h14M19 9l4 4-4 4" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M25 21H11M15 25l-4-4 4-4" stroke="#D6ECFC" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const KOPBALK = zq => `<header class="kn"><div class="kn-in"><a class="kn-merk" href="/" aria-label="Kadoly gids">${MERK(30)}<span>Kadoly</span><span class="kn-gids">Gids</span></a><form class="kn-zoek" role="search" action="/zoek" method="get" id="kf"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" name="q" id="kq" value="${esc(zq || '')}" placeholder="Zoek in Kadoly of stel een vraag" aria-label="Zoek in Kadoly of stel een vraag" autocomplete="off" maxlength="160" enterkeyhint="search" role="combobox" aria-expanded="false" aria-controls="kz"><div class="kz" id="kz" role="listbox" hidden></div></form><a class="kn-shop" href="https://kadoly.com/shop?utm_source=kadoly-gids&amp;utm_medium=gids&amp;utm_campaign=kop">${SHOPMERK(22)}<span>Shop</span></a></div></header>`;
const VOETBALK = `<footer class="kv"><div class="kv-in"><div class="kv-cols"><div><div class="kv-merk">${SHOPMERK(26)}Kadoly Shop</div><div class="kv-pay"><span>Veilig betalen met</span><img src="https://kadoly.com/img/icons/brands/ideal.svg" alt="iDEAL" width="24" height="22" loading="lazy"><img src="https://kadoly.com/img/icons/brands/paypal.png" alt="PayPal" width="62" height="15" loading="lazy" style="height:14px"><svg viewBox="0 0 38 24" width="32" height="20" role="img" aria-label="Mastercard"><circle cx="14" cy="12" r="9" fill="#EB001B"/><circle cx="24" cy="12" r="9" fill="#F79E1B"/><path d="M19 4.5a9 9 0 0 1 0 15 9 9 0 0 1 0-15z" fill="#FF5F00"/></svg></div></div>
<div><div class="kv-h">Kopen</div><a href="https://kadoly.com/shipping">Verzending en levering</a><a href="https://kadoly.com/returns">Retourneren</a><a href="https://kadoly.com/buyer-protection">Veilig kopen</a></div><div><div class="kv-h">Gids</div><a href="/">Alle gidsen</a><a href="#" data-kc>Stel een vraag</a><a href="/llms.txt">Voor AI-assistenten</a></div><div><div class="kv-h">Bedrijf</div><a href="https://kadoly.com/about">Over Kadoly Shop</a><a href="https://kadoly.com/help">Hulp en contact</a><a href="https://kadoly.com/review-policy">Reviewbeleid</a></div></div>
<div class="kv-onder"><span>© ${new Date().getFullYear()} Kadoly Shop · ADSFAIR B.V. · Albert Plesmanplein 20, 2805 AB Gouda · KVK 60126035 · <a href="mailto:henkjan@yoo.rs">henkjan@yoo.rs</a> · <a href="tel:+31655395630">+31 6 55 39 56 30</a></span><span class="kv-legal"><a href="https://kadoly.com/terms">Algemene voorwaarden</a><a href="https://kadoly.com/privacy">Privacybeleid</a><a href="https://kadoly.com/cookies">Cookiebeleid</a></span></div></div></footer>`;
const CHAT = `<section class="kc" id="kc" hidden aria-label="Vraag het Kadoly"><div class="kc-kop">${MERK(26)}<div>Kadoly hulp<small>Antwoord meteen, eerlijk advies</small></div><button type="button" id="kcx" aria-label="Sluiten">×</button></div><div class="kc-log" id="kcl" aria-live="polite"></div><form class="kc-in" id="kcf"><input id="kci" maxlength="400" placeholder="Stel je vraag" aria-label="Je vraag" autocomplete="off" enterkeyhint="send"><button type="submit">Stuur</button></form><div class="kc-voet">Dringend, bijvoorbeeld over een bestelling? <a id="kcw" href="https://wa.me/${WA}" target="_blank" rel="noopener nofollow">WhatsApp Henkjan van Kadoly</a></div></section>`;
// één script voor alle pagina's: armproef (productpagina of meteen afrekenen), zoeken die leert, chat met WhatsApp bij dringende vragen. Alles meet via /gidstel.
function hulpScript(slug, kans) {
  return `<script>(function(){var G=${JSON.stringify(slug)},KANS=${Number(kans) || 0.5},WA=${JSON.stringify(WA)};function t(x){try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(G)+'&s='+x)}catch(e){}}
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var arm;try{arm=localStorage.getItem('kg_arm')}catch(x){}if(arm!=='k'&&arm!=='p'){arm=Math.random()<KANS?'k':'p';try{localStorage.setItem('kg_arm',arm)}catch(x){}}
function naar(a){if(a.dataset.arm)return;a.dataset.arm=1;a.href+=(a.href.indexOf('?')<0?'?':'&')+'a='+arm;if(arm==='k'&&a.classList.contains('knop')&&/Bekijk bij Kadoly/.test(a.textContent))a.textContent='Bestellen bij Kadoly';}
document.querySelectorAll('a[href^="/naar/"]').forEach(naar);t('arm-'+arm);try{new MutationObserver(function(){document.querySelectorAll('a[href^="/naar/"]:not([data-arm])').forEach(naar)}).observe(document.body,{childList:true,subtree:true})}catch(x){}
var f=document.getElementById('kf'),q=document.getElementById('kq'),z=document.getElementById('kz'),tm,lt,laatst='',H='';
function dicht(){z.hidden=true;q.setAttribute('aria-expanded','false')}
function toon(d,v){var h='';if(d.producten&&d.producten.length){h+='<div class="kzk">Producten</div>';d.producten.forEach(function(p){h+='<a class="kzr" role="option" href="/naar/'+encodeURIComponent(p.pid)+'?g=zoek&b=zoek&h='+d.h+'" rel="nofollow"><img src="'+e(p.img)+'" alt="" loading="lazy" width="44" height="44"><span>'+e(p.naam)+'</span><b>'+e(p.prijsTekst)+'</b></a>'})}
if(d.gidsen&&d.gidsen.length){h+='<div class="kzk">Gidsen</div>';d.gidsen.forEach(function(g){h+='<a class="kzg" href="/'+e(g.slug)+'">'+e(g.h1)+'</a>'})}
if(!h)h='<div class="kzk">Niets gevonden in de winkel</div>';h+='<button type="button" class="kzv" id="kzv">Vraag het Kadoly: \\u201c'+e(v)+'\\u201d</button>';z.innerHTML=h;z.hidden=false;q.setAttribute('aria-expanded','true');z.querySelectorAll('a[href^="/naar/"]').forEach(naar);
document.getElementById('kzv').onclick=function(){dicht();open(v)};z.querySelectorAll('.kzr').forEach(function(a){a.addEventListener('click',function(){t('zoek-klik')})})}
q.addEventListener('input',function(){var v=q.value.trim();clearTimeout(tm);clearTimeout(lt);if(v.length<2){dicht();return}tm=setTimeout(function(){fetch('/zoek?f=json&q='+encodeURIComponent(v)).then(function(r){return r.json()}).then(function(d){if(q.value.trim()===v){H=d.h;toon(d,v)}}).catch(function(){})},180);
lt=setTimeout(function(){if(v!==laatst){laatst=v;fetch('/zoek?log=1&g='+encodeURIComponent(G)+'&q='+encodeURIComponent(v),{keepalive:true}).catch(function(){})}},1500)});
q.addEventListener('focus',function(){t('zoek-focus')});q.addEventListener('keydown',function(x){if(x.key==='Escape')dicht()});document.addEventListener('click',function(x){if(!f.contains(x.target))dicht()});
f.addEventListener('submit',function(x){x.preventDefault();var v=q.value.trim();if(v.length<2)return;dicht();open(v)});
var c=document.getElementById('kc'),l=document.getElementById('kcl'),ci=document.getElementById('kci'),hist=[],bezig=false;
function bel(r,html){var d=document.createElement('div');d.className='kc-m '+(r==='u'?'kc-u':'kc-a');d.innerHTML=html;l.appendChild(d);l.scrollTop=l.scrollHeight;return d}
function wa(v){return 'https://wa.me/'+WA+'?text='+encodeURIComponent('Hoi Kadoly, ik heb een vraag via de gids: '+v+' ('+location.href.split('?')[0]+')')}
function vraag(v){if(bezig||!v)return;bezig=true;hist.push({r:'u',t:v});bel('u',e(v));document.getElementById('kcw').href=wa(v);var w=bel('a','<span style="opacity:.6">Even kijken\\u2026</span>');t('chat-vraag');
fetch('/vraag',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({v:hist.slice(-8),p:G,a:arm})}).then(function(r){return r.json()}).then(function(d){var h=e(d.antwoord||'Dat weet ik niet zeker. Henkjan van Kadoly helpt je via WhatsApp.');
(d.producten||[]).forEach(function(p){h+='<a class="kc-p" href="/naar/'+encodeURIComponent(p.pid)+'?g='+encodeURIComponent(G.charAt(0)==='_'?'zoek':G)+'&b=chat" rel="nofollow"><img src="'+e(p.img)+'" alt="" loading="lazy"><span><b>'+e(p.naam)+'</b><br>'+e(p.prijsTekst)+(p.datum?' \\u00b7 in huis rond '+e(p.datum):'')+'</span></a>'});
if(d.dringend){h+='<a class="kc-wa" href="'+wa(v)+'" target="_blank" rel="noopener nofollow" data-wa>WhatsApp Henkjan van Kadoly</a>';t('chat-dringend')}
w.innerHTML=h;w.querySelectorAll('a[href^="/naar/"]').forEach(naar);w.querySelectorAll('.kc-p').forEach(function(a){a.addEventListener('click',function(){t('chat-klik')})});w.querySelectorAll('[data-wa]').forEach(function(a){a.addEventListener('click',function(){t('wa')})});hist.push({r:'a',t:d.antwoord||''});l.scrollTop=l.scrollHeight}).catch(function(){w.innerHTML='Dat lukte nu niet. <a href="'+wa(v)+'" target="_blank" rel="noopener nofollow">Stuur je vraag via WhatsApp</a>.'}).then(function(){bezig=false})}
function open(v){c.hidden=false;t('chat-open');if(!hist.length)bel('a','Hoi! Vertel wat je zoekt, dan help ik je kiezen. Ik zeg het ook eerlijk als iets niet past.');if(v)vraag(v);else ci.focus()}
document.getElementById('kcx').onclick=function(){c.hidden=true};document.getElementById('kcw').addEventListener('click',function(){t('wa')});
document.getElementById('kcf').addEventListener('submit',function(x){x.preventDefault();var v=ci.value.trim();ci.value='';vraag(v)});
document.querySelectorAll('[data-kc]').forEach(function(a){a.addEventListener('click',function(x){x.preventDefault();open('')})});})();</script>`;
}
const VOET = (g, kans) => `<hr style="border:0;border-top:1px solid var(--line);margin:44px 0 18px"><p class="meta">Een gids van <a href="https://kadoly.com">Kadoly</a>, de webshop met producten van onafhankelijke makers. Prijzen en levertijden komen elke paar minuten uit de winkel zelf${g ? ', laatst inhoudelijk bijgewerkt op ' + esc(g.bijgewerkt) : ''}. Wij verdienen aan een bestelling in onze eigen winkel; daarom staat bij elk product ook waarvoor het niet geschikt is.</p><p class="meta"><a href="/">Alle gidsen</a> · <a href="#" data-kc>Stel een vraag</a></p></main>${VOETBALK}${CHAT}${hulpScript(g ? g.slug : '_home', kans)}</body></html>`;

// zoeken in de shopcatalogus en de gidsen (30 okt, Henkjan: "Zet er ook een zoek boven die alles leert en ook een chat kan worden").
// Leert: wat mensen aanklikken na een zoekvraag (gk:zk:<hash>) telt mee in de volgorde; elke vraag en vragen zonder uitkomst per dag in gk:zq:<dag>.
const STOP = new Set('de het een en of voor van met in op aan te je jij ik wil wat welke is zijn er om bij als dat die dit naar zoek zoeken mijn ons onze graag kan hoe iets ook leuk leuke mooi mooie goed goede'.split(' '));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const stam = w => w.length > 4 ? w.replace(/(tjes|tje|jes|je|en|s)$/, '') : w;
const woorden = s => [...new Set(norm(s).split(' ').filter(w => w.length > 1 && !STOP.has(w)))].slice(0, 8);
const qSleutel = ws => ws.slice().sort().join(' ').slice(0, 60);
const qHash = k => createHash('sha1').update(k).digest('hex').slice(0, 12);
let IDX = null, IDX_AT = -1;
async function index() { const cat = await catalogus(); if (IDX && IDX_AT === CAT_AT) return IDX; IDX = Object.values(cat).filter(i => i && i.vr !== false && i.t && i.id).map(i => ({ i, t: ' ' + norm(i.t) + ' ', m: ' ' + norm(i.b) + ' ', c: ' ' + norm((i.c || '') + ' ' + (i.s || '')) + ' ' })); IDX_AT = CAT_AT; return IDX; }
function score(x, ws) { let s = 0, hits = 0; for (const w of ws) { const st = stam(w); let h = 0; if (x.t.includes(' ' + w + ' ')) h = 3; else if (x.t.includes(' ' + w) || x.t.includes(' ' + st)) h = 2; else if (st.length > 3 && x.t.includes(st)) h = 1; if (x.m.includes(' ' + w)) h = Math.max(h, 2); if (x.c.includes(' ' + st)) h = Math.max(h, 1.2); if (h) hits++; s += h; } return hits ? s * (hits / ws.length) : 0; }
const prijsTekst = v => euro(v) + ' incl. verzending';
async function zoek(vraag, n = 8) {
  const ws = woorden(vraag); const k = qSleutel(ws); const h = qHash(k || '-'); if (!ws.length) return { ws, k, h, producten: [], gidsen: [] };
  const idx = await index(); let L = {}; try { const a = await kv.raw(['HGETALL', 'gk:zk:' + h]); if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) L[a[j]] = N(a[j + 1]); } catch (e) {}
  const lijst = []; for (const x of idx) { const s = score(x, ws); const l = N(L[x.i.id]); if (s > 0 || l > 0) lijst.push({ x, s: s + 1.6 * Math.log1p(l) + Math.min(0.4, N(x.i.f) / 60) }); }
  lijst.sort((a, b) => b.s - a.s);
  const producten = lijst.slice(0, n).map(({ x }) => ({ pid: x.i.id, naam: x.i.t, merk: x.i.b || '', prijs: thuis(x.i), prijsTekst: prijsTekst(thuis(x.i)), img: x.i.img || '', lt: N(x.i.lt) || 0, datum: N(x.i.lt) ? nlDatum(leverDatum(x.i.lt)) : '' }));
  const gidsen = GIDS_IDS.map(id => GIDSEN[id]).map(g => { const t = ' ' + norm([g.h1, g.kicker, g.kort, g.keuze.map(c => c.naam || '').join(' ')].join(' ')) + ' '; let s = 0; for (const w of ws) if (t.includes(' ' + stam(w))) s++; return { g, s }; }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map(({ g }) => ({ slug: g.slug, h1: g.h1 }));
  return { ws, k, h, producten, gidsen };
}
async function logZoek(k, nul, g) { if (!k) return; try { const d = 'gk:zq:' + DAG(); await kv.raw(['HINCRBY', d, k, '1']); if (nul) await kv.raw(['HINCRBY', d, '0|' + k, '1']); await kv.raw(['EXPIRE', d, String(90 * 86400)]); } catch (e) {} await tel(g && (GIDSEN[g] || g === '_home') ? g : '_home', 'zoek'); }
async function zoekPagina(vraag, kans) { // zonder JavaScript: gewone uitkomstpagina (niet voor Google)
  const r = await zoek(vraag, 24);
  return kop('Zoeken: ' + vraag + ' | Kadoly gids', 'Zoeken in de winkel van Kadoly.', '/zoek', '<meta name="robots" content="noindex, follow">', vraag) + `<h1>Zoeken: ${esc(vraag)}</h1>${r.gidsen.length ? `<h2>Gidsen</h2><ul>${r.gidsen.map(g => `<li><a href="/${esc(g.slug)}">${esc(g.h1)}</a></li>`).join('')}</ul>` : ''}${r.producten.length ? `<h2>In de winkel</h2>` + r.producten.map(p => `<article class="pk"><a class="pk-img" href="/naar/${encodeURIComponent(p.pid)}?g=zoek&b=zoek&h=${r.h}" rel="nofollow">${p.img ? `<img src="${esc(p.img)}" width="120" height="120" alt="${esc(p.naam)}" loading="lazy">` : ''}</a><div><h3>${esc(p.naam)}</h3><p class="pk-prijs"><b>${esc(p.prijsTekst)}</b>${p.datum ? ` · <span class="pk-dag">in huis rond ${esc(p.datum)}</span>` : ''}</p><a class="btn knop" href="/naar/${encodeURIComponent(p.pid)}?g=zoek&b=zoek&h=${r.h}" rel="nofollow">Bekijk bij Kadoly</a></div></article>`).join('') : '<p>Niets gevonden. <a href="#" data-kc>Stel je vraag</a>, dan zoeken we mee.</p>'}` + VOET(null, kans);
}

// chat: kort, eerlijk, alleen producten uit de winkel; dringend = WhatsApp naar Henkjan. Elke vraag gaat in gk:chat (alleen te lezen via de beschermde host).
const CHAT_SYS = `Je bent de hulp van Kadoly (kadoly.com), een Nederlandse webshop van ADSFAIR B.V. met producten van onafhankelijke Europese makers (wonen, hobby, keuken, beauty, kinderen, mode, tech en meer). Je helpt bezoekers van gids.kadoly.com kiezen en beantwoordt hun vragen.
Regels:
- Antwoord in de taal van de bezoeker (meestal Nederlands), kort: hoogstens 70 woorden, gewone woorden, vriendelijk en zeker. Geen gedachtestreepjes, geen opsommingstekens.
- Noem alleen producten uit KANDIDATEN en zet hun id in "producten" (hoogstens 3, beste eerst). Verzin geen eigenschappen die er niet staan (maat, materiaal, leeftijd): zeg dan dat het op de productpagina staat.
- Eerlijk: past niets, zeg dat en raad af of stel één vraag terug om beter te kiezen (voor wie, budget, gelegenheid). Prijzen zijn inclusief verzending. Levertijd: neem "in huis rond" letterlijk over uit de lijst, verander de dag niet. Producten met uitleg uit onze gids zijn door ons gekozen: gebruik die uitleg als ze passen.
- Bestelinfo die klopt: betalen met iDEAL, PayPal of creditcard, kopen zonder account; het merk verstuurt met track en trace; eerste bestelling gratis verzending; 14 dagen retour met retourlabel en het hele bedrag terug; bundelkorting 5% op 2 tot 20% op 6 producten. Mail: henkjan@yoo.rs.
- Zet "dringend" op true als: een bestelling niet aankomt, kapot of verkeerd is; er een probleem is met betalen of geld terug; iemand een klacht heeft; iemand een mens wil spreken; het om een grote of zakelijke bestelling gaat; of een cadeau zeker voor een vaste datum binnen moet zijn en de levertijd krap is. Zeg dan dat Henkjan van Kadoly via WhatsApp meteen helpt.
- Gaat de vraag niet over Kadoly of zijn producten: kort en vriendelijk terug naar waar je wel mee helpt.
Geef alleen JSON: {"antwoord":"...","producten":["oc_..."],"dringend":false,"onderwerp":"2 tot 4 woorden"}`;
async function leesBody(req) { if (req.body && typeof req.body === 'object') return req.body; if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } } let s = ''; try { for await (const c of req) { s += c; if (s.length > 20000) break; } } catch (e) {} try { return JSON.parse(s); } catch (e) { return {}; } }
async function chatAntwoord(req, oidc) {
  const b = await leesBody(req); const v = (Array.isArray(b.v) ? b.v : []).slice(-8).map(m => ({ r: m && m.r === 'a' ? 'a' : 'u', t: String((m && m.t) || '').replace(/\s+/g, ' ').trim().slice(0, 400) })).filter(m => m.t);
  const laatste = [...v].reverse().find(m => m.r === 'u'); if (!laatste) return { status: 400, j: { ok: false } };
  const p = String(b.p || '').replace(/[^a-z0-9_-]/g, '').slice(0, 60); const g = GIDSEN[p];
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(); const ik = 'gk:rl:' + qHash(ip + DAG());
  if (!b.test) try { const n = N(await kv.raw(['INCR', ik])); if (n === 1) await kv.raw(['EXPIRE', ik, '86400']); const tot = N(await kv.raw(['HINCRBY', 'gk:d:' + DAG(), 'chat|vraag', '1'])); await kv.raw(['EXPIRE', 'gk:d:' + DAG(), String(60 * 86400)]); if (n > 40 || tot > 2500) return { status: 200, j: { ok: true, antwoord: 'Ik krijg nu veel vragen. Henkjan van Kadoly helpt je graag via WhatsApp.', producten: [], dringend: true } }; } catch (e) {}
  const z1 = await zoek(laatste.t, 10); const z2 = v.length > 1 ? await zoek(v.filter(m => m.r === 'u').map(m => m.t).join(' '), 8) : { producten: [] };
  const cat = await catalogus(); const kand = new Map(); const soort = pid => { const i = cat[pid] || {}; return [i.c, i.s].filter(Boolean).join('/'); };
  if (g) for (const c of g.keuze) { const i = cat[c.pid]; if (i && i.vr !== false) kand.set(c.pid, { pid: c.pid, naam: c.naam || i.t, merk: i.b || '', prijs: thuis(i), prijsTekst: prijsTekst(thuis(i)), img: i.img || '', lt: N(i.lt), datum: N(i.lt) ? nlDatum(leverDatum(i.lt)) : '', gids: c.label + ': ' + c.waarom + (c.beperking ? ' Let op: ' + c.beperking : '') }); } // de keuze van deze gids eerst, met onze uitleg
  for (const x of z1.producten.concat(z2.producten)) if (!kand.has(x.pid)) kand.set(x.pid, x);
  const lijst = [...kand.values()].slice(0, 18);
  const ctx = 'VANDAAG: ' + nlDatum(new Date()) + '\nPAGINA: ' + (g ? g.h1 + '\nKORT ANTWOORD VAN DEZE GIDS: ' + g.kort : 'start van de gids') + '\nGIDSEN: ' + GIDS_IDS.map(id => GIDSEN[id].h1 + ' (' + HOST + '/' + id + ')').join('; ') +
    '\nKANDIDATEN (id | naam | merk | soort | prijs incl. verzending | in huis rond | uitleg uit onze gids):\n' + (lijst.length ? lijst.map(x => [x.pid, x.naam, x.merk || '-', soort(x.pid) || '-', euro(x.prijs), x.datum || 'zie product', x.gids || '-'].join(' | ')).join('\n') : '(geen passende producten gevonden)') +
    '\n\nGESPREK:\n' + v.map(m => (m.r === 'u' ? 'Bezoeker: ' : 'Kadoly: ') + m.t).join('\n');
  let out = { antwoord: '', producten: [], dringend: false, onderwerp: '' };
  try { const r = await berichten({ fn: 'gids-chat', model: HAIKU, system: CHAT_SYS, user: ctx, max: 500, oidc, timeout: 20000 }); const m = String(r.txt || '').match(/\{[\s\S]*\}/); if (m) out = Object.assign(out, JSON.parse(m[0])); } catch (e) { out.antwoord = 'Dat lukte nu even niet. Henkjan van Kadoly helpt je via WhatsApp.'; out.dringend = true; }
  const antwoord = String(out.antwoord || '').replace(/\s*[\u2014\u2013]\s*/g, ', ').slice(0, 700);
  const prods = (Array.isArray(out.producten) ? out.producten : []).map(id => kand.get(String(id))).filter(Boolean).slice(0, 3);
  const dringend = !!out.dringend; const onderwerp = norm(out.onderwerp).slice(0, 40);
  if (!b.test) try { await kv.raw(['LPUSH', 'gk:chat', JSON.stringify({ at: Date.now(), p: p || '_home', a: b.a === 'k' ? 'k' : 'p', v: laatste.t.slice(0, 300), ant: antwoord.slice(0, 300), d: dringend ? 1 : 0, o: onderwerp, pr: prods.map(x => x.pid) })]); await kv.raw(['LTRIM', 'gk:chat', '0', '1999']);
    const d = 'gk:zq:' + DAG(); if (onderwerp) await kv.raw(['HINCRBY', d, 'o|' + onderwerp, '1']); if (dringend) await kv.raw(['HINCRBY', 'gk:d:' + DAG(), 'chat|dringend', '1']); if (!prods.length) await kv.raw(['HINCRBY', 'gk:d:' + DAG(), 'chat|zonderproduct', '1']); await kv.raw(['EXPIRE', d, String(90 * 86400)]); } catch (e) {}
  return { status: 200, j: { ok: true, antwoord, producten: prods, dringend } };
}

// armproef (30 okt, Henkjan: "Bekijk maar ook direct naar reken af"): de knop gaat naar de productpagina (p) of meteen naar afrekenen (k).
// Leert: zodra beide armen 40 kliks hebben en de ene duidelijk beter verkoopt (betaald x10, betaling gestart x3, afrekenpagina x1, per klik), krijgt die 80%.
let KANS = null, KANS_AT = 0;
async function armStand(dagen = 28) { const s = { k: { kliks: 0, afreken: 0, cart: 0, betaal: 0, koop: 0, omzet: 0, views: 0 }, p: { kliks: 0, afreken: 0, cart: 0, betaal: 0, koop: 0, omzet: 0, views: 0 } };
  for (let i = 0; i < dagen; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); try { const a = await kv.raw(['HGETALL', 'gk:d:' + d]); if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) { const f = a[j], n = N(a[j + 1]); let m = f.match(/\|uitarm-([kp])$/); if (m) s[m[1]].kliks += n; m = f.match(/\|px-(cart|afreken|betaal|koop)-([kp])$/); if (m) s[m[2]][m[1]] += n; m = f.match(/\|omzet-([kp])$/); if (m) s[m[1]].omzet += n / 100; m = f.match(/\|arm-([kp])$/); if (m) s[m[1]].views += n; } } catch (e) {} }
  return s; }
async function armKans() { if (KANS !== null && Date.now() - KANS_AT < 600000) return KANS; let k = 0.5; try { const s = await armStand(28); const w = x => (x.koop * 10 + x.betaal * 3 + Math.max(x.afreken, x.cart)) / Math.max(1, x.kliks); const ev = x => x.koop + x.betaal + Math.max(x.afreken, x.cart);
  if (s.k.kliks >= 40 && s.p.kliks >= 40) { const a = w(s.k), b = w(s.p); if (a >= 1.5 * b && ev(s.k) >= 5) k = 0.8; else if (b >= 1.5 * a && ev(s.p) >= 5) k = 0.2; } } catch (e) {} KANS = k; KANS_AT = Date.now(); return k; }

function productKaart(x, slug, blok, eerste, nr) {
  const dat = leverDatum(x.lt); const href = `/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(slug)}&b=${blok}`;
  return `<article class="pk" id="p-${esc(x.pid)}"><a class="pk-img" href="${href}" rel="nofollow" tabindex="-1" aria-hidden="true">${x.img ? `<img src="${esc(x.img)}" width="120" height="120" alt="${esc(x.naam)}" ${eerste ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : ''}</a><div>
<p class="pk-lab"><span class="pk-nr">${nr}</span>${esc(x.label)}${x.meest ? ' · meest gekozen door lezers' : ''}</p><h3>${esc(x.naam)}</h3>
<p class="pk-prijs"><b>${euro(x.prijs + x.verzending)}</b> inclusief ${x.verzending ? euro(x.verzending) + ' verzending' : 'verzending'}${x.lt ? ` · <span class="pk-dag">in huis rond ${esc(nlDatum(dat))}</span>` : ''}</p>
<p>${esc(x.waarom)}</p>${x.beperking ? `<p class="pk-let"><b>Let op:</b> ${esc(x.beperking)}</p>` : ''}<a class="btn knop" href="${href}" rel="nofollow">Bekijk bij Kadoly</a></div></article>`;
}

// baken: telt echte lezers in de browser (zodat de pagina aan de rand van Vercel bewaard kan worden): weergave met herkomst, 15 en 60 seconden, scrollen
function baken(slug) {
  return `<script>(function(){var g=${JSON.stringify(slug)},s={};function t(x){if(s[x])return;s[x]=1;try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(g)+'&s='+x)}catch(e){}}var r=document.referrer||'',b=/google\./.test(r)?'google':/bing\./.test(r)?'bing':/chatgpt|openai/.test(r)?'chatgpt':/perplexity/.test(r)?'perplexity':/copilot|edgeservices/.test(r)?'copilot':/gemini\.google/.test(r)?'gemini':/claude\.ai/.test(r)?'claude':/duckduckgo/.test(r)?'duckduckgo':/kadoly\.com/.test(r)?'kadoly':r?'overig':'direct';t('v-'+b);setTimeout(function(){if(!document.hidden)t('t15')},15000);setTimeout(function(){if(!document.hidden)t('t60')},60000);addEventListener('scroll',function(){var h=document.documentElement,p=(h.scrollTop+innerHeight)/h.scrollHeight;if(p>.5)t('s50');if(p>.9)t('s90')},{passive:true});})();</script>`;
}
const datumNl = d => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } };
const BESTELLEN = `<dl class="rows"><div class="r"><dt>Betalen</dt><dd>iDEAL, PayPal of creditcard, ook zonder account. Je koopt bij Kadoly (ADSFAIR B.V.).</dd></div><div class="r"><dt>Verzending</dt><dd>Het merk stuurt het pakket rechtstreeks naar jou, met track en trace. Je eerste bestelling wordt gratis verzonden.</dd></div><div class="r"><dt>Retour</dt><dd>14 dagen na ontvangst, met een retourlabel en het hele bedrag terug.</dd></div><div class="r"><dt>Bundelkorting</dt><dd>5% bij 2 producten, oplopend tot 20% bij 6.</dd></div></dl>`;
async function gidsPagina(g) {
  const cat = await catalogus();
  const items = g.keuze.map(k => { const i = cat[k.pid]; if (!i || i.vr === false) return null; return Object.assign({}, k, { naam: k.naam || i.t, prijs: N(i.p), verzending: i.fs ? 0 : N(i.vk), lt: N(i.lt) || 0, img: i.img || '', merk: i.b || '' }); }).filter(Boolean);
  const perPid = {}; items.forEach(x => { perPid[x.pid] = x; });
  // volgorde leert van de lezers: na 60 weergaven telt de klikkans per product (met voorkennis voor de redactievolgorde), daarvoor de redactievolgorde
  const L = await geleerd(g.slug); const vw = N(L._v);
  if (vw >= 60) { items.forEach((x, i) => { x._s = (N(L[x.pid]) + Math.max(0.2, 1.5 - i * 0.2)) / (vw + 30); }); items.sort((a, b) => b._s - a._s); }
  const top = items.reduce((m, x) => (N(L[x.pid]) > N(L[m && m.pid])) ? x : m, null); if (top && N(L[top.pid]) >= 10) top.meest = true;
  const rijen = (g.tabel || []).map(r => { const x = perPid[r.pid]; return `<div class="r"><dt>${esc(r.situatie)}</dt><dd>${esc(r.advies)}${x ? ` <a href="/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(g.slug)}&b=tabel" rel="nofollow">${esc(x.naam)}</a>, ${euro(x.prijs + x.verzending)}` : ''}</dd></div>`; }).join('');
  const checkData = JSON.stringify({ vragen: g.check ? g.check.vragen : [], regels: g.check ? g.check.regels : [], producten: Object.fromEntries(items.map(x => [x.pid, { naam: x.naam, prijs: euro(x.prijs + x.verzending), lt: x.lt }])), slug: g.slug }).replace(/</g, '\\u003c');
  const check = g.check ? `<section class="q" id="check"><h2>Past het bij jou? Snelle check</h2><p>Twee of drie vragen. De uitkomst kan ook zijn dat je het beter niet koopt.</p><form id="gf">${g.check.vragen.map(v => `<fieldset><legend>${esc(v.vraag)}</legend><div class="opts">${v.opties.map(o => `<label class="opt"><input type="radio" name="${esc(v.k)}" value="${esc(o[0])}">${esc(o[1])}</label>`).join('')}</div></fieldset>`).join('')}<button class="btn knop" type="submit">Laat zien wat past</button></form><div class="uitkomst" id="gu" aria-live="polite"></div></section>
<script>(function(){var D=${checkData};var f=document.getElementById('gf'),u=document.getElementById('gu');f.addEventListener('submit',function(e){e.preventDefault();var a={};D.vragen.forEach(function(v){var x=f.querySelector('input[name="'+v.k+'"]:checked');if(x)a[v.k]=x.value;});if(Object.keys(a).length<D.vragen.length){u.innerHTML='<p>Kies bij elke vraag een antwoord.</p>';return;}var r=null;for(var i=0;i<D.regels.length;i++){var R=D.regels[i],ok=true;for(var k in R.als){if(R.als[k].indexOf(a[k])<0){ok=false;break;}}if(ok){r=R;break;}}if(!r){u.innerHTML='<p>Kies bij elke vraag een antwoord.</p>';return;}var h='<div class="answer"><p><strong>'+r.kop+'</strong></p><p>'+r.tekst+'</p>';if(r.pid&&D.producten[r.pid]){var p=D.producten[r.pid];h+='<p style="margin-top:14px"><a class="btn knop" href="/naar/'+encodeURIComponent(r.pid)+'?g='+encodeURIComponent(D.slug)+'&b=check" rel="nofollow">'+p.naam+', '+p.prijs+'</a></p>';}u.innerHTML=h+'</div>';try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(D.slug)+'&s=check-'+(r.id||'x'));}catch(x){}});})();</script>` : '';
  const delen = 'https://wa.me/?text=' + encodeURIComponent(g.h1 + ' ' + HOST + '/' + g.slug);
  const ogImg = items[0] && items[0].img ? `<meta property="og:image" content="${esc(items[0].img)}"><meta name="twitter:card" content="summary_large_image">` : '';
  const andere = GIDS_IDS.filter(id => id !== g.slug).map(id => GIDSEN[id]);
  const toc = [['keuze', 'Onze keuze'], rijen ? ['situatie', 'Welke past bij jou'] : null, g.check ? ['check', 'Snelle check'] : null, (g.uitleg || []).length ? ['uitleg', 'Waar let je op'] : null, ['bestellen', 'Bestellen'], g.faq && g.faq.length ? ['vragen', 'Vragen'] : null].filter(Boolean);
  return kop(g.titel, g.beschrijving, '/' + g.slug, ogImg + `<script type="application/ld+json">${ldJson(g, items)}</script>`) +
    `<article><nav class="crumbs" aria-label="Kruimelpad"><a href="/">Kadoly gids</a> › ${esc(g.h1)}</nav><p class="kicker"><span class="live-dot"></span>${esc(g.kicker)}</p><h1>${esc(g.h1)}</h1>
<p class="meta">Door de redactie van Kadoly · bijgewerkt <time datetime="${esc(g.bijgewerkt)}">${esc(datumNl(g.bijgewerkt))}</time> · prijs en levertijd van vandaag</p>
<div class="answer"><p><strong>In het kort.</strong> ${esc(g.kort)}</p></div>
<nav class="toc" aria-label="Op deze pagina">${toc.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('')}</nav>
<h2 id="keuze">Onze keuze</h2>${items.map((x, i) => productKaart(x, g.slug, 'keuze', i === 0, i + 1)).join('')}
${rijen ? `<h2 id="situatie">${esc(g.tabelKop || 'Welke past bij jouw situatie?')}</h2><dl class="rows">${rijen}</dl>` : ''}
${check}
${(g.uitleg || []).map((b, i) => `<h2${i === 0 ? ' id="uitleg"' : ''}>${esc(b.kop)}</h2>${b.alineas.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
<h2 id="zo-kozen-we">Zo kozen we</h2><p>${esc(g.zoKozenWe)}</p>
<h2 id="bestellen">Zo werkt een bestelling bij Kadoly</h2>${BESTELLEN}
${g.faq && g.faq.length ? `<h2 id="vragen">Veelgestelde vragen</h2>${g.faq.map(f => `<details class="faq"><summary>${esc(f.v)}</summary><div class="a"><p>${esc(f.a)}</p></div></details>`).join('')}` : ''}
<p style="margin:28px 0 0"><a class="btn deel" href="${esc(delen)}" rel="nofollow noopener">Deel deze gids via WhatsApp</a></p>
${andere.length ? `<h2>Andere gidsen van Kadoly</h2><div class="cards">${andere.map(a => `<a class="card" href="/${esc(a.slug)}"><span class="cat">${esc(a.kicker)}</span><h3>${esc(a.h1)}</h3><p>${esc(a.beschrijving)}</p></a>`).join('')}</div>` : ''}</article>
${baken(g.slug)}` + VOET(g, await armKans());
}

// rubrieken (31 okt, Henkjan: "voorkant ... staat nog niets op ... Moeten rubrieken en alles in"): uit de shopcatalogus (c en s), met aantallen,
// prijzen inclusief verzending en levertijd van vandaag. Volgorde per rubriek leert van kliks (gk:p:r-<rubriek>, na 60 weergaven), daarvoor de populariteit in de shop.
const RUBRIEK = { wonen: 'Wonen & decoratie', hobby: 'Hobby & creatief', kids: 'Kinderen & speelgoed', tech: 'Tech & gadgets', beauty: 'Beauty & verzorging', mode: 'Mode & accessoires', keuken: 'Keuken & tafel', cadeaus: 'Cadeaus & downloads', dieren: 'Dieren', sport: 'Tuin, buiten & sport', tuin: 'Tuin, buiten & sport', eten: 'Eten & drinken', overig: 'Overig' }; // namen zoals op kadoly.com/shop
const SUB = { planten: 'Planten & potten', muur: 'Muur & posters', textiel: 'Kussens & plaids', verlichting: 'Verlichting', kaarsen: 'Kaarsen', geuren: 'Geuren', decoratie: 'Decoratie', opbergen: 'Opbergen', diy: 'DIY & bouwpakketten', papier: 'Papier & notitieboeken', tekenen: 'Tekenen & schilderen', haken: 'Haken & breien', spellen: 'Puzzels & spellen', baby: 'Baby', kinderkamer: 'Kinderkamer', haar: 'Haar', bad: 'Bad & douche', huid: 'Huidverzorging', koken: 'Koken & bakken', servies: 'Servies', tafel: 'Tafel', koffie: 'Koffie & thee', cadeausets: 'Cadeausets', opladen: 'Opladen & kabels', audio: 'Audio', gadgets: 'Gadgets', tassen: 'Tassen', dames: 'Dames', heren: 'Heren', sokken: 'Sokken', sieraden: 'Sieraden', accessoires: 'Accessoires', tuin: 'Tuin & balkon', katten: 'Katten', honden: 'Honden', overig: 'Overig' };
const hoofd = x => x ? x.charAt(0).toUpperCase() + x.slice(1).replace(/-/g, ' ') : '';
const naamR = c => RUBRIEK[c] || hoofd(c); const naamS = x => SUB[x] || hoofd(x);
const sleutel = x => norm(x || 'overig').replace(/ /g, '-') || 'overig';
let RUB = null, RUB_AT = -1;
async function rubrieken() { const cat = await catalogus(); if (RUB && RUB_AT === CAT_AT) return RUB; const m = {};
  for (const i of Object.values(cat)) { if (!i || !i.id || !i.t || i.vr === false) continue; const c = sleutel(i.c), sb = sleutel(i.s); const r = m[c] || (m[c] = { c, naam: naamR(c), n: 0, min: Infinity, max: 0, merken: new Set(), subs: {}, items: [], lts: [] });
    r.n++; const pr = thuis(i); if (pr > 0) { r.min = Math.min(r.min, pr); r.max = Math.max(r.max, pr); } if (i.b) r.merken.add(i.b); if (N(i.lt)) r.lts.push(N(i.lt)); (r.subs[sb] = r.subs[sb] || []).push(i); r.items.push(i); }
  RUB = Object.values(m).filter(r => r.n >= 6).sort((a, b) => (a.c === 'overig') - (b.c === 'overig') || b.n - a.n); RUB_AT = CAT_AT; return RUB; }
const mediaan = l => { if (!l.length) return 0; const x = l.slice().sort((a, b) => a - b); return x[Math.floor(x.length / 2)]; };
const rang = (L, vw) => (a, b) => { const la = vw >= 60 ? N(L[a.id]) / (vw + 30) : 0, lb = vw >= 60 ? N(L[b.id]) / (vw + 30) : 0; return (lb - la) || (N(b.sc) - N(a.sc)) || (N(b.v) - N(a.v)) || (N(b.f) - N(a.f)); };
const miniKaart = (i, g, b, eerste) => { const href = `/naar/${encodeURIComponent(i.id)}?g=${encodeURIComponent(g)}&b=${b}`; return `<a class="mk" href="${href}" rel="nofollow">${i.img ? `<img src="${esc(i.img)}" width="240" height="240" alt="${esc(i.t)}" ${eerste ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : '<span class="mk-leeg"></span>'}<span class="mk-n">${esc(i.t)}</span>${i.b ? `<span>${esc(i.b)}</span>` : ''}<span class="mk-p"><b>${euro(thuis(i))}</b> incl. verzending</span>${N(i.lt) ? `<span>in huis rond ${esc(nlDatum(leverDatum(i.lt)))}</span>` : ''}</a>`; };
const prodLd = i => ({ '@type': 'Product', name: i.t, image: i.img || undefined, brand: i.b ? { '@type': 'Brand', name: i.b } : undefined, offers: { '@type': 'Offer', price: thuis(i).toFixed(2), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: 'https://kadoly.com/product/' + i.id } });
const ORG = { '@type': 'Organization', '@id': HOST + '/#org', name: 'Kadoly', legalName: 'ADSFAIR B.V.', url: 'https://kadoly.com', logo: 'https://cdn.kadoly.com/icon/shop/icon-192.png?v=1', email: 'henkjan@yoo.rs', telephone: '+31655395630', address: { '@type': 'PostalAddress', streetAddress: 'Albert Plesmanplein 20', postalCode: '2805 AB', addressLocality: 'Gouda', addressCountry: 'NL' } };
// keuzehulp (31 okt, Henkjan: "het is een keuzehulp, nu is het een voorkant"): stap voor stap kiezen (rubriek, soort, budget, wanneer), dan 3 voorstellen
// met waarom, eerlijk als niets past. Leert: elke keuze telt in gk:zq:<dag> (k|...), kliks per combinatie in gk:zk:<hash> en die tellen mee in de volgorde.
const BUDGET = [['u25', 'Onder €25'], ['25-50', '€25 tot €50'], ['o50', 'Meer dan €50'], ['alle', 'Maakt niet uit']];
const TIJD = [['snel', 'Zo snel mogelijk'], ['week', 'Binnen een week'], ['alle', 'Maakt niet uit']];
const inBudget = (pr, b) => b === 'u25' ? pr < 25 : b === '25-50' ? pr >= 25 && pr <= 50 : b === 'o50' ? pr > 50 : true;
const opTijd = (lt, t) => t === 'snel' ? N(lt) > 0 && N(lt) <= 3 : t === 'week' ? N(lt) > 0 && N(lt) <= 5 : true;
async function kies(c, sb, b, t) {
  const R = (await rubrieken()).find(r => r.c === c); if (!R) return null;
  const pool = sb && sb !== 'alle' && R.subs[sb] ? R.subs[sb] : R.items; const naam = sb && sb !== 'alle' && R.subs[sb] ? naamS(sb) : R.naam;
  const h = qHash('kies|' + [c, sb || 'alle', b, t].join('|')); let L = {}; try { const a = await kv.raw(['HGETALL', 'gk:zk:' + h]); if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) L[a[j]] = N(a[j + 1]); } catch (e) {}
  const srt = (x, y) => (N(L[y.id]) - N(L[x.id])) || (N(y.sc) - N(x.sc)) || (N(y.v) - N(x.v)) || (N(y.f) - N(x.f));
  let lijst = pool.filter(i => inBudget(thuis(i), b) && opTijd(i.lt, t)); let eerlijk = '';
  if (!lijst.length) { const zb = pool.filter(i => inBudget(thuis(i), b)); const zt = pool.filter(i => opTijd(i.lt, t));
    if (zb.length) { lijst = zb; eerlijk = `Binnen je budget komt in ${naam.toLowerCase()} niets ${t === 'snel' ? 'binnen 3 werkdagen' : 'binnen een week'}. Dit past wel in je budget, met de bezorgdag erbij:`; }
    else if (zt.length) { lijst = zt; eerlijk = `In ${naam.toLowerCase()} is niets ${b === 'u25' ? 'onder €25' : b === 'o50' ? 'boven €50' : 'tussen €25 en €50'}. Dit komt wel op tijd:`; }
    else { lijst = pool; eerlijk = `In ${naam.toLowerCase()} past niets precies bij wat je zoekt. Dit komt het dichtst in de buurt:`; } }
  const n = lijst.length; const meestBekeken = new Set(pool.slice().sort((x, y) => N(y.v) - N(x.v)).slice(0, 3).map(i => i.id));
  const top = lijst.sort(srt).slice(0, 3).map(i => { const w = []; if (N(L[i.id]) >= 3) w.push('vaak gekozen door anderen met dezelfde wens'); else if (meestBekeken.has(i.id)) w.push('een van de meest bekeken in ' + naam.toLowerCase()); if (b !== 'alle' && inBudget(thuis(i), b)) w.push('past in je budget'); if (t !== 'alle' && opTijd(i.lt, t)) w.push('op tijd in huis'); if (i.fs) w.push('gratis verzending');
    return { pid: i.id, naam: i.t, merk: i.b || '', prijsTekst: prijsTekst(thuis(i)), img: i.img || '', datum: N(i.lt) ? nlDatum(leverDatum(i.lt)) : '', waarom: w.length ? w.join(', ').replace(/^./, x => x.toUpperCase()) + '.' : '' }; });
  return { h, naam, n, eerlijk, producten: top, kop: eerlijk ? '' : n <= 3 ? (n === 1 ? 'Eén product past:' : n + ' producten passen:') : n + ' producten passen. Dit zijn de 3 die het meest gekozen worden:' };
}
function keuzeHulp(R, preset, g) { // stap voor stap; zonder JavaScript staan de rubrieken als gewone links eronder
  const data = JSON.stringify({ g, preset: preset || '', rub: Object.fromEntries(R.map(r => [r.c, { naam: r.naam, subs: Object.entries(r.subs).filter(([x, l]) => x !== 'overig' && l.length >= 3).sort((a, b) => b[1].length - a[1].length).slice(0, 10).map(([x, l]) => [x, naamS(x), l.length]) }])), budget: BUDGET, tijd: TIJD }).replace(/</g, '\\u003c');
  return `<section class="q kh" id="kiezen" aria-label="Keuzehulp">${preset ? '' : `<h2>Waar ben je naar op zoek?</h2><div class="opts" data-stap="c">${R.filter(r => r.c !== 'overig').map(r => `<button type="button" class="opt" data-v="${esc(r.c)}">${esc(r.naam)}</button>`).join('')}</div>`}
<div data-w="s" hidden><h2>Welke soort?</h2><div class="opts" data-stap="s"></div></div><div data-w="b" hidden><h2>Wat wil je uitgeven?</h2><div class="opts" data-stap="b"></div></div><div data-w="t" hidden><h2>Wanneer moet het er zijn?</h2><div class="opts" data-stap="t"></div></div>
<div class="uitkomst" id="khu" aria-live="polite"></div><p class="meta" style="margin:18px 0 0">Liever in je eigen woorden? <a href="#" data-kc>Vraag het ons</a></p></section>
<script>(function(){var D=${data},A={c:D.preset},el=document.getElementById('kiezen'),u=document.getElementById('khu');function t(x){try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(D.g)+'&s='+x)}catch(e){}}function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function opts(stap,l){var w=el.querySelector('[data-stap="'+stap+'"]');w.innerHTML=l.map(function(o){return '<button type="button" class="opt" data-v="'+e(o[0])+'">'+e(o[1])+(o[2]?' <span class="tel">'+o[2]+'</span>':'')+'</button>'}).join('');}
function toon(stap){var w=el.querySelector('[data-w="'+stap+'"]');if(w){w.hidden=false;}}function verberg(v){['s','b','t'].slice(v).forEach(function(x){var w=el.querySelector('[data-w="'+x+'"]');if(w)w.hidden=true;delete A[x];});u.innerHTML='';}
function startC(c){A.c=c;verberg(0);var r=D.rub[c];if(r&&r.subs.length>1){opts('s',r.subs.concat([['alle','Alles']]));toon('s');}else{A.s='alle';opts('b',D.budget);toon('b');}}
function klaar(){u.innerHTML='<p>Even kijken\\u2026</p>';t('kies-klaar');fetch('/kies?c='+encodeURIComponent(A.c)+'&s='+encodeURIComponent(A.s||'alle')+'&b='+A.b+'&t='+A.t+'&g='+encodeURIComponent(D.g)).then(function(r){return r.json()}).then(function(d){if(!d.ok){u.innerHTML='<p>Dat lukte nu niet. <a href="#" data-kc>Vraag het ons</a>.</p>';return;}
var h='<div class="answer"><p><strong>'+e(d.eerlijk||d.kop)+'</strong></p></div>';d.producten.forEach(function(p,i){h+='<article class="pk"><a class="pk-img" href="/naar/'+encodeURIComponent(p.pid)+'?g='+encodeURIComponent(D.g)+'&b=kies&h='+d.h+'" rel="nofollow" tabindex="-1">'+(p.img?'<img src="'+e(p.img)+'" width="120" height="120" alt="" loading="lazy">':'')+'</a><div><p class="pk-lab"><span class="pk-nr">'+(i+1)+'</span>'+e(p.merk||d.naam)+'</p><h3>'+e(p.naam)+'</h3><p class="pk-prijs"><b>'+e(p.prijsTekst)+'</b>'+(p.datum?' \\u00b7 <span class="pk-dag">in huis rond '+e(p.datum)+'</span>':'')+'</p>'+(p.waarom?'<p>'+e(p.waarom)+'</p>':'')+'<a class="btn knop" href="/naar/'+encodeURIComponent(p.pid)+'?g='+encodeURIComponent(D.g)+'&b=kies&h='+d.h+'" rel="nofollow">Bekijk bij Kadoly</a></div></article>'});
u.innerHTML=h;if(d.eerlijk)t('kies-leeg');u.scrollIntoView({behavior:'smooth',block:'start'});}).catch(function(){u.innerHTML='<p>Dat lukte nu niet.</p>'})}
el.addEventListener('click',function(x){var b=x.target.closest('.opt');if(!b)return;var w=b.parentNode,stap=w.getAttribute('data-stap'),v=b.getAttribute('data-v');w.querySelectorAll('.opt').forEach(function(o){o.classList.toggle('on',o===b)});
if(stap==='c'){t('kies-c');startC(v);}else if(stap==='s'){A.s=v;verberg(1);opts('b',D.budget);toon('b');}else if(stap==='b'){A.b=v;verberg(2);opts('t',D.tijd);toon('t');}else if(stap==='t'){A.t=v;klaar();}});
if(D.preset)startC(D.preset);})();</script>`;
}
const soortRegel = (R, sb, l, g) => { const pr = l.map(thuis).filter(x => x > 0); const lt = mediaan(l.map(i => N(i.lt)).filter(Boolean)); const top = l.slice().sort((x, y) => (N(y.sc) - N(x.sc)) || (N(y.v) - N(x.v))).slice(0, 3);
  return `<div class="r"><dt>${esc(naamS(sb))}</dt><dd>${l.length} producten, ${euro(Math.min(...pr))} tot ${euro(Math.max(...pr))} inclusief verzending${lt ? `, meestal binnen ${lt} werkdagen in huis` : ''}. Populair: ${top.map(i => `<a href="/naar/${encodeURIComponent(i.id)}?g=${encodeURIComponent(g)}&b=soort" rel="nofollow">${esc(i.t)}</a>`).join(', ')}.</dd></div>`; };
async function rubriekPagina(c, kans) {
  const R = (await rubrieken()).find(r => r.c === c); if (!R) return null; const alle = await rubrieken();
  const g = 'r-' + c; const med = mediaan(R.lts); const top = R.items.slice().sort(rang({}, 0)).slice(0, 10);
  const subs = Object.entries(R.subs).sort((a, b) => (a[0] === 'overig') - (b[0] === 'overig') || b[1].length - a[1].length);
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', name: R.naam + ': wat past bij jou?', url: HOST + '/rubriek/' + c, publisher: { '@id': HOST + '/#org' }, dateModified: DAG() }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kadoly gids', item: HOST + '/' }, { '@type': 'ListItem', position: 2, name: R.naam, item: HOST + '/rubriek/' + c }] }, { '@type': 'ItemList', name: 'Populair in ' + R.naam, itemListElement: top.map((i, k) => ({ '@type': 'ListItem', position: k + 1, item: prodLd(i) })) }] }).replace(/</g, '\\u003c');
  const kort = `Bij Kadoly vind je ${R.n} producten in ${R.naam.toLowerCase()}, van ${euro(R.min)} tot ${euro(R.max)} inclusief verzending.${med ? ` De meeste zijn binnen ${med} werkdagen in huis.` : ''} Kies hieronder soort, budget en wanneer je het nodig hebt: je krijgt de 3 die het best passen, en we zeggen het eerlijk als niets past.`;
  return kop(`${R.naam}: wat past bij jou? Keuzehulp van Kadoly`, `Keuzehulp ${R.naam.toLowerCase()}: ${R.n} producten, kies op soort, budget en levertijd. Met prijs inclusief verzending en bezorgdag van vandaag.`, '/rubriek/' + c, `<script type="application/ld+json">${ld}</script>`) +
    `<nav class="crumbs" aria-label="Kruimelpad"><a href="/">Kadoly gids</a> › ${esc(R.naam)}</nav><p class="kicker"><span class="live-dot"></span>Keuzehulp</p><h1>${esc(R.naam)}: wat past bij jou?</h1>
<p class="meta">Door de redactie van Kadoly · bijgewerkt <time datetime="${DAG()}">${esc(datumNl(DAG()))}</time> · prijs en levertijd van vandaag</p><div class="answer"><p><strong>In het kort.</strong> ${esc(kort)}</p></div>
${keuzeHulp(alle, c, g)}
<h2 id="aanbod">Wat er is in ${esc(R.naam.toLowerCase())}</h2><dl class="rows">${subs.map(([sb, l]) => soortRegel(R, sb, l, g)).join('')}</dl>
<h2 id="bestellen">Zo werkt een bestelling bij Kadoly</h2>${BESTELLEN}${baken(g)}` + VOET(null, kans);
}

async function home(kans) {
  const R = await rubrieken(); const alle = R.reduce((t, r) => t + r.n, 0); const med = mediaan(R.flatMap(r => r.lts));
  const faq = [['Wat is Kadoly?', `Kadoly is een Nederlandse webshop van ADSFAIR B.V. uit Gouda met ${alle} producten van onafhankelijke Europese makers, in ${R.filter(r => r.c !== 'overig').map(r => r.naam.toLowerCase()).join(', ')}.`],
    ['Wie verstuurt mijn bestelling?', 'Het merk of de maker stuurt het pakket rechtstreeks naar jou, met track en trace. Je koopt en betaalt bij Kadoly.'],
    ['Hoe snel is het in huis?', `Dat verschilt per maker. ${med ? `De meeste producten zijn binnen ${med} werkdagen in huis. ` : ''}Bij elk product staat de verwachte bezorgdag als je vandaag bestelt.`],
    ['Kan ik iets terugsturen?', 'Ja. Je hebt 14 dagen na ontvangst, je krijgt een retourlabel en het hele bedrag terug.'],
    ['Hoe betaal ik?', 'Met iDEAL, PayPal of creditcard. Een account is niet nodig.'],
    ['Krijg ik korting als ik meer koop?', 'Ja, bundelkorting: 5% bij 2 producten, oplopend tot 20% bij 6. Je eerste bestelling wordt gratis verzonden.']];
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebSite', name: 'Kadoly gids', url: HOST + '/', publisher: { '@id': HOST + '/#org' }, inLanguage: 'nl-NL' }, { '@type': 'ItemList', name: 'Keuzehulpen van Kadoly', itemListElement: R.map((r, k) => ({ '@type': 'ListItem', position: k + 1, name: r.naam, url: HOST + '/rubriek/' + r.c })) }, { '@type': 'FAQPage', mainEntity: faq.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) }] }).replace(/</g, '\\u003c');
  const rij = R.map(r => `<div class="r"><dt><a href="/rubriek/${esc(r.c)}">${esc(r.naam)}</a></dt><dd>${r.n} producten, ${euro(r.min)} tot ${euro(r.max)} inclusief verzending. ${esc(Object.entries(r.subs).filter(([x]) => x !== 'overig').sort((a, b) => b[1].length - a[1].length).slice(0, 5).map(([x]) => naamS(x)).join(', '))}</dd></div>`).join('');
  return kop('Kadoly gids: keuzehulp voor alles van Kadoly', `Keuzehulp van Kadoly: kies stap voor stap wat bij je past uit ${alle} producten van onafhankelijke makers, met prijs inclusief verzending en bezorgdag van vandaag. Eerlijk, ook als niets past.`, '/', `<script type="application/ld+json">${ld}</script>`) +
    `<p class="kicker"><span class="live-dot"></span>Kadoly keuzehulp</p><h1>Eerlijk kiezen, ook als het antwoord niet kopen is</h1><p class="standfirst">Beantwoord een paar vragen en je krijgt de 3 producten die het best bij je passen, met wat het vandaag kost inclusief verzending en wanneer het in huis is. Past niets, dan zeggen we dat.</p>
${keuzeHulp(R, '', '_home')}
<h2 id="rubrieken">Per rubriek</h2><dl class="rows">${rij}</dl>
${GIDS_IDS.length ? `<h2 id="gidsen">Uitgebreide keuzehulpen</h2><ul>${GIDS_IDS.map(id => GIDSEN[id]).map(x => `<li><a href="/${esc(x.slug)}">${esc(x.h1)}</a></li>`).join('')}</ul>` : ''}
<h2 id="vragen">Vragen over Kadoly</h2>${faq.map(([v, a]) => `<details class="faq"><summary>${esc(v)}</summary><div class="a"><p>${esc(a)}</p></div></details>`).join('')}${baken('_home')}` + VOET(null, kans);
}

async function sitemap() {
  const cat = await catalogus();
  const R = await rubrieken();
  const u = [{ loc: HOST + '/', lm: DAG(), img: [] }].concat(GIDS_IDS.map(id => ({ loc: HOST + '/' + id, lm: GIDSEN[id].bijgewerkt, img: GIDSEN[id].keuze.map(k => cat[k.pid]).filter(i => i && i.img && i.vr !== false).map(i => i.img) }))).concat(R.map(r => ({ loc: HOST + '/rubriek/' + r.c, lm: DAG(), img: r.items.slice().sort(rang({}, 0)).filter(i => i.img).slice(0, 5).map(i => i.img) })));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + u.map(x => `<url><loc>${x.loc}</loc><lastmod>${x.lm}</lastmod>${x.img.map(i => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`).join('')}</url>`).join('') + '</urlset>';
}
// alles wat AI moet kunnen citeren in platte tekst (llms-full.txt)
async function llmsVol() {
  const cat = await catalogus(); let t = '# Kadoly gids: volledige tekst\n\nKeuzehulpen van Kadoly (kadoly.com, ADSFAIR B.V.). Prijzen inclusief verzending en levertijden komen live uit de winkel. Bij elk product staat waarvoor het niet geschikt is.\n\n';
  for (const id of GIDS_IDS) { const g = GIDSEN[id]; t += '## ' + g.h1 + '\n\n' + HOST + '/' + id + '\n\n' + g.kort + '\n\n### Onze keuze\n\n';
    for (const k of g.keuze) { const i = cat[k.pid]; if (!i || i.vr === false) continue; t += '- ' + k.label + ': ' + (k.naam || i.t) + ', ' + euro(thuis(i)) + ' inclusief verzending, https://kadoly.com/product/' + k.pid + '. ' + k.waarom + (k.beperking ? ' Let op: ' + k.beperking : '') + '\n'; }
    if (g.tabel && g.tabel.length) { t += '\n### ' + (g.tabelKop || 'Welke past bij jouw situatie?') + '\n\n'; for (const r of g.tabel) t += '- ' + r.situatie + ': ' + r.advies + '\n'; }
    for (const b of (g.uitleg || [])) t += '\n### ' + b.kop + '\n\n' + b.alineas.join('\n\n') + '\n';
    t += '\n### Zo kozen we\n\n' + g.zoKozenWe + '\n\n### Veelgestelde vragen\n\n' + (g.faq || []).map(f => '**' + f.v + '**\n' + f.a).join('\n\n') + '\n\n'; }
  return t;
}
// zicht.json: het manifest voor de ZICHT-lus (lib/zicht-projecten.js), met eigen meting van lezers en AI-bots
async function zichtJson() {
  const vragen = []; for (const id of GIDS_IDS) { const g = GIDSEN[id]; vragen.push(g.h1.replace(/\?$/, '')); for (const f of (g.faq || [])) vragen.push(f.v); }
  const per = { google: 0, bing: 0, chatgpt: 0, perplexity: 0, copilot: 0, gemini: 0, claude: 0, duckduckgo: 0 }, bots = {};
  for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); try { const a = await kv.raw(['HGETALL', 'gk:d:' + d]); if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) { const f = a[j], n = N(a[j + 1]); const m = f.match(/\|v-([a-z]+)$/); if (m && per[m[1]] !== undefined) per[m[1]] += n; const b = f.match(/^_bot\|([a-z-]+)\|/); if (b) bots[b[1]] = N(bots[b[1]]) + n; } } catch (e) {} }
  const zoek = per.google + per.bing + per.duckduckgo, ai = per.chatgpt + per.perplexity + per.copilot + per.gemini + per.claude;
  return { zicht: 1, site: { vragen: vragen.slice(0, 30), merk: ['Kadoly', 'kadoly.com', 'gids.kadoly.com', 'Kadoly gids'], taal: 'nl', land: 'NL', repo: 'henkjandekrijger-glitch/hjdk-api' }, toegepast: [{ les: 'antwoord-bovenaan', dag: '2026-10-30', wat: 'kort antwoord bovenaan elke gids' }, { les: 'ssr-gids-inhoud', dag: '2026-10-30', wat: 'alle inhoud in de HTML, ook de check' }, { les: 'beelden-vindbaar', dag: '2026-10-30', wat: 'image:image in de sitemap' }], nvt: [], proeven: [], lessen: [], meting: { bezoek7d: { zoek, ai, perBron: per }, aiBots7d: bots } };
}
async function llms() {
  const cat = await catalogus();
  let t = '# Kadoly gids\n\n> Keuzehulpen van Kadoly (kadoly.com), een Nederlandse webshop met producten van onafhankelijke makers. Per gids: korte keuze, prijs inclusief verzending en levertijd van vandaag, waarvoor een product niet geschikt is, en antwoorden op veelgestelde vragen.\n\n';
  const R = await rubrieken(); t += '## Rubrieken\n\n' + R.map(r => '- ' + r.naam + ': ' + r.n + ' producten van ' + r.merken.size + ' makers, ' + euro(r.min) + ' tot ' + euro(r.max) + ' inclusief verzending, ' + HOST + '/rubriek/' + r.c).join('\n') + '\n\n';
  for (const id of GIDS_IDS) { const g = GIDSEN[id]; t += '## ' + g.h1 + '\n\n' + HOST + '/' + id + '\n\n' + g.kort + '\n\n'; for (const k of g.keuze) { const i = cat[k.pid]; if (!i || i.vr === false) continue; t += '- ' + k.label + ': ' + (k.naam || i.t) + ', ' + euro(thuis(i)) + ' inclusief verzending. ' + k.waarom + (k.beperking ? ' Let op: ' + k.beperking : '') + '\n'; } t += '\n'; }
  return t;
}

// productfeiten van kadoly.com voor het schrijven van gidsen (alleen via de beschermde vercel.app-host)
async function feiten(pid) {
  let u = 'https://kadoly.com/product/' + encodeURIComponent(pid) + '?lang=nl', html = '';
  for (let i = 0; i < 4; i++) { const r = await fetch(u, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'accept-language': 'nl-NL,nl;q=0.9' }, signal: AbortSignal.timeout(12000) }); if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { u = new URL(r.headers.get('location'), u).href; continue; } html = await r.text(); break; }
  const ld = []; for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) { try { ld.push(JSON.parse(m[1])); } catch (e) {} }
  const tekst = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const prod = ld.flatMap(x => (x['@graph'] || [x])).find(x => x && /Product/.test(String(x['@type']))) || null;
  const s = tekst.search(/Omschrijving|Beschrijving|Over dit product|Productinformatie/i);
  return { pid, url: u, product: prod ? { naam: prod.name, omschrijving: String(prod.description || '').slice(0, 2500), afbeeldingen: [].concat(prod.image || []).slice(0, 4) } : null, tekst: (s >= 0 ? tekst.slice(s, s + 2500) : tekst.slice(0, 2500)) };
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://gids.kadoly.com'); const q = url.searchParams; const op = q.get('op') || ''; const ua = req.headers['user-agent'] || '';
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0];
  if (Date.now() - META_AT > 300000) { META_AT = Date.now(); try { META = String((await kv.get('gk:gscmeta')) || ''); } catch (e) {} }
  try {
    if (op === 'ixkey') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(INDEXNOW_KEY); }
    if (op === 'llmsfull') { await telBot(ua, 'llmsfull'); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(await llmsVol()); }
    if (op === 'zicht') { res.setHeader('content-type', 'application/json; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=0, s-maxage=3600'); return res.status(200).json(await zichtJson()); }
    if (op === 'indexnow') { // dagelijks (cron): nieuwe en gewijzigde gidsen melden bij Bing en de andere IndexNow-zoekmachines; Bing voedt ook ChatGPT-zoeken en Copilot
      const RR = await rubrieken(); const urls = [HOST + '/'].concat(GIDS_IDS.map(id => HOST + '/' + id)).concat(RR.map(r => HOST + '/rubriek/' + r.c)); const stand = GIDS_IDS.map(id => id + '@' + GIDSEN[id].bijgewerkt).join(',') + '|' + RR.map(r => r.c).join(',');
      let oud = null; try { oud = await kv.get('gk:indexnow'); } catch (e) {} if (oud && oud.stand === stand && q.get('alles') !== '1') return res.status(200).json({ ok: true, niets: true });
      let status = 0; try { const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: 'gids.kadoly.com', key: INDEXNOW_KEY, keyLocation: HOST + '/' + INDEXNOW_KEY + '.txt', urlList: urls }), signal: AbortSignal.timeout(15000) }); status = r.status; } catch (e) {}
      if (status >= 200 && status < 300) { try { await kv.set('gk:indexnow', { at: Date.now(), stand }); } catch (e) {} }
      return res.status(200).json({ ok: status >= 200 && status < 300, status, gemeld: urls.length }); }
    if (op === 'robots') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('User-agent: *\nAllow: /\nDisallow: /naar/\n\n# Voor AI-assistenten: ' + HOST + '/llms.txt en ' + HOST + '/llms-full.txt\nSitemap: ' + HOST + '/sitemap.xml\n'); }
    if (op === 'sitemap') { await telBot(ua, 'sitemap'); res.setHeader('content-type', 'application/xml; charset=utf-8'); return res.status(200).send(await sitemap()); }
    if (op === 'llms') { await telBot(ua, 'llms'); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(await llms()); }
    if (op === 'tel') { const g = String(q.get('g') || ''); const s = String(q.get('s') || '').replace(/[^a-z0-9-]/g, '').slice(0, 30); if ((GIDSEN[g] || g === '_home' || g === '_zoek' || /^r-[a-z0-9-]{2,30}$/.test(g)) && s && !isBot(ua)) { await tel(g, s); if (/^v-/.test(s) && (GIDSEN[g] || /^r-/.test(g) || g === '_home')) { try { await kv.raw(['HINCRBY', 'gk:p:' + (g === '_home' ? 'home' : g), '_v', '1']); await kv.raw(['EXPIRE', 'gk:p:' + (g === '_home' ? 'home' : g), String(120 * 86400)]); } catch (e) {} } } return res.status(204).end(); }
    if (op === 'kies') { const c = String(q.get('c') || '').replace(/[^a-z0-9-]/g, '').slice(0, 30), sb = String(q.get('s') || 'alle').replace(/[^a-z0-9-]/g, '').slice(0, 30), b = ['u25', '25-50', 'o50'].includes(q.get('b')) ? q.get('b') : 'alle', t = ['snel', 'week'].includes(q.get('t')) ? q.get('t') : 'alle';
      const r = await kies(c, sb, b, t); if (!r) return res.status(404).json({ ok: false });
      if (!isBot(ua)) { try { const d = 'gk:zq:' + DAG(); await kv.raw(['HINCRBY', d, 'k|' + [c, sb, b, t].join('|'), '1']); if (r.eerlijk) await kv.raw(['HINCRBY', d, '0|k|' + [c, sb, b, t].join('|'), '1']); await kv.raw(['EXPIRE', d, String(90 * 86400)]); } catch (e) {} }
      res.setHeader('cache-control', 'no-store'); return res.status(200).json(Object.assign({ ok: true }, r)); }
    if (op === 'zoek') { const v = String(q.get('q') || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      if (q.get('log') === '1') { res.setHeader('cache-control', 'no-store'); if (!isBot(ua) && v) { const r = await zoek(v, 8); await logZoek(r.k, !r.producten.length && !r.gidsen.length, String(q.get('g') || '')); } return res.status(204).end(); }
      if (q.get('f') === 'json') { res.setHeader('cache-control', 'public, max-age=60, s-maxage=300'); const r = await zoek(v, 8); return res.status(200).json({ ok: true, h: r.h, producten: r.producten, gidsen: r.gidsen }); }
      res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'no-store'); if (!isBot(ua) && v) { const r0 = await zoek(v, 8); await logZoek(r0.k, !r0.producten.length, '_home'); } return res.status(200).send(await zoekPagina(v || 'kadoly', await armKans())); }
    if (op === 'vraag') { res.setHeader('cache-control', 'no-store'); if (req.method !== 'POST' && /\.vercel\.app$/i.test(host) && q.get('q')) { const oidc0 = String(req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN || ''); const r = await chatAntwoord({ headers: { 'x-forwarded-for': 'test' }, body: { v: [{ r: 'u', t: String(q.get('q')) }], p: String(q.get('p') || ''), test: 1 } }, oidc0); return res.status(r.status).json(r.j); } // proef via de beschermde host, telt niet mee
      if (req.method !== 'POST') return res.status(405).json({ ok: false }); if (isBot(ua)) return res.status(403).json({ ok: false });
      const oidc = String(req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN || ''); const r = await chatAntwoord(req, oidc); return res.status(r.status).json(r.j); }
    if (op === 'feiten') { if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden'); const pids = String(q.get('p') || '').split(',').filter(x => /^oc_\d+$/.test(x)).slice(0, 8); const uit = []; for (const p of pids) { try { uit.push(await feiten(p)); } catch (e) { uit.push({ pid: p, fout: String(e.message || e) }); } } return res.status(200).json({ ok: true, feiten: uit }); }
    if (op === 'pagina') { // een pagina van kadoly.com zoals een NL-telefoon hem krijgt (alleen lezen, beschermde vercel.app-host): voor het kassalek
      if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const pad = String(q.get('u') || '/'); if (!/^\/[\w\/\-?=&.%]*$/.test(pad)) return res.status(400).json({ ok: false });
      let u = 'https://kadoly.com' + pad, r, html = ''; const hops = [];
      for (let i = 0; i < 4; i++) { r = await fetch(u, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'accept-language': 'nl-NL,nl;q=0.9' }, signal: AbortSignal.timeout(12000) }); hops.push(r.status + ' ' + u.replace('https://kadoly.com', '')); if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { u = new URL(r.headers.get('location'), u).href; continue; } html = await r.text(); break; }
      const velden = [...html.matchAll(/<(input|select|textarea|button)\b[^>]*>/gi)].map(m => m[0].replace(/\s+/g, ' ').slice(0, 200)).slice(0, 60);
      const scripts = [...html.matchAll(/<script[^>]*src=["']([^"']+)/gi)].map(m => m[1]).slice(0, 30);
      const formulieren = [...html.matchAll(/<form\b[^>]*>/gi)].map(m => m[0].slice(0, 200));
      const tekst = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      const van = N(q.get('van'));
      return res.status(200).json({ ok: true, hops, status: r && r.status, bytes: html.length, formulieren, velden, scripts, tekst: tekst.slice(van, van + 6000) }); }
    if (op === 'shopapi') { // hoeveel producten geeft de shop-API echt (alleen lezen, beschermde host)? 31 okt, Henkjan: "Er zijn er veel meer producten"
      if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const KOPS = { 'user-agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36', accept: 'application/json', 'accept-language': 'nl-NL,nl;q=0.9' };
      const pad = String(q.get('u') || '/shop/api/shop?lang=nl&offset=0').replace(/[^\w\/\-?=&.%]/g, '');
      const r = await fetch('https://kadoly.com' + pad, { headers: KOPS, signal: AbortSignal.timeout(15000) }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {}
      const its = j && (j.items || j.products || j.data) || [];
      return res.status(200).json({ status: r.status, bytes: t.length, sleutels: j ? Object.keys(j) : null, meta: j ? Object.fromEntries(Object.entries(j).filter(([k, v]) => typeof v !== 'object' || v === null)) : null, aantal: Array.isArray(its) ? its.length : null, eerste: Array.isArray(its) && its[0] ? Object.keys(its[0]) : null, begin: j ? null : t.slice(0, 400) }); }
    if (op === 'stijl') { // de look van kadoly.com uitlezen (alleen lezen, beschermde vercel.app-host): kleuren, letters, logo, kop en voet, om de gids er gelijk aan te maken
      if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const KOPS = { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'accept-language': 'nl-NL,nl;q=0.9' };
      let u = 'https://kadoly.com' + (String(q.get('u') || '/').replace(/[^\w\/\-?=&.%]/g, '')), html = '';
      for (let i = 0; i < 4; i++) { const r = await fetch(u, { redirect: 'manual', headers: KOPS, signal: AbortSignal.timeout(12000) }); if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { u = new URL(r.headers.get('location'), u).href; continue; } html = await r.text(); break; }
      const css = [...html.matchAll(/<link\b[^>]*rel=["']?[^"'>]*stylesheet[^>]*>/gi)].map(m => (m[0].match(/href=["']([^"']+)/i) || [])[1]).filter(Boolean).map(h => new URL(h, u).href);
      let alle = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
      for (const h of css.slice(0, 8)) { try { const r = await fetch(h, { headers: KOPS, signal: AbortSignal.timeout(10000) }); alle += '\n' + await r.text(); } catch (e) {} }
      const tel2 = (re, f) => { const o = {}; for (const m of alle.matchAll(re)) { const k = f(m); o[k] = (o[k] || 0) + 1; } return Object.entries(o).sort((a, b) => b[1] - a[1]); };
      const vars = [...alle.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => m[1] + ': ' + m[2].trim()).filter((x, i, l) => l.indexOf(x) === i).slice(0, 120);
      const fonts = tel2(/font-family\s*:\s*([^;}]+)/gi, m => m[1].trim()).slice(0, 12);
      const fontface = [...alle.matchAll(/@font-face\s*{[^}]*}/gi)].map(m => m[0].replace(/\s+/g, ' ').slice(0, 300)).slice(0, 10);
      const kleuren = tel2(/#[0-9a-f]{3,8}\b|rgba?\([^)]+\)/gi, m => m[0].toLowerCase()).slice(0, 40);
      const radius = tel2(/border-radius\s*:\s*([^;}]+)/gi, m => m[1].trim()).slice(0, 8);
      const knoppen = [...alle.matchAll(/([^{}]*\b(btn|button)[^{}]*){([^}]*)}/gi)].map(m => (m[1].trim().slice(-80) + ' {' + m[3].trim().slice(0, 260) + '}')).slice(0, 14);
      const kopHtml = (html.match(/<header\b[\s\S]*?<\/header>/i) || [''])[0].replace(/\s+/g, ' ').slice(0, 5000);
      const voetHtml = (html.match(/<footer\b[\s\S]*?<\/footer>/i) || [''])[0].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\s+/g, ' ').slice(0, 5000);
      const logo = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]).filter(t => /logo|kadoly/i.test(t)).slice(0, 4);
      const iconen = [...html.matchAll(/<link\b[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi)].map(m => m[0]).slice(0, 6);
      const theme = (html.match(/<meta\b[^>]*name=["']theme-color["'][^>]*>/i) || [''])[0];
      const bodyKlas = (html.match(/<body\b[^>]*>/i) || [''])[0];
      return res.status(200).json({ ok: true, url: u, css, bytesCss: alle.length, theme, bodyKlas, iconen, logo, fonts, fontface, vars, kleuren, radius, knoppen, kopHtml, voetHtml }); }
    if (op === 'stand') { const dagen = Math.min(28, Math.max(1, N(q.get('dagen')) || 7)); const uit = {}; for (let i = 0; i < dagen; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); try { const a = await kv.raw(['HGETALL', 'gk:d:' + d]); const o = {}; if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) o[a[j]] = N(a[j + 1]); uit[d] = o; } catch (e) {} } const geleerdPer = {}; for (const id of GIDS_IDS) geleerdPer[id] = await geleerd(id); const zq = {}; for (let i = 0; i < dagen; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); try { const a = await kv.raw(['HGETALL', 'gk:zq:' + d]); if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) zq[a[j]] = N(zq[a[j]]) + N(a[j + 1]); } catch (e) {} }
      const rij = re => Object.entries(zq).filter(([k]) => re.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, n]) => [k.replace(/^(0|o)\|/, ''), n]);
      let chat = null; if (/\.vercel\.app$/i.test(host)) { try { chat = ((await kv.raw(['LRANGE', 'gk:chat', '0', '49'])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean); } catch (e) {} }
      return res.status(200).json({ ok: true, gidsen: GIDS_IDS, perDag: uit, kliksPerProduct: geleerdPer, armproef: { kansAfrekenen: await armKans(), stand28d: await armStand(28) }, zoeken: { vragen: rij(/^(?!0\||o\||k\|)/), keuzes: rij(/^k\|/), zonderUitkomst: rij(/^0\|/), chatOnderwerpen: rij(/^o\|/) }, chatLaatste: chat }); }
    res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    const slug = String(q.get('slug') || '');
    const rub = String(q.get('rubriek') || '').replace(/[^a-z0-9-]/g, '').slice(0, 30);
    if (rub) { const html = await rubriekPagina(rub, await armKans()); if (!html) { res.setHeader('cache-control', 'no-store'); return res.status(404).send(kop('Niet gevonden', 'Deze rubriek bestaat niet.', '/', '') + '<h1>Deze rubriek bestaat niet</h1><p><a href="/#rubrieken">Naar alle rubrieken</a></p>' + VOET(null, 0.5)); } await telBot(ua, 'r-' + rub); return res.status(200).send(html); }
    if (!slug) return res.status(200).send(await home(await armKans()));
    const g = GIDSEN[slug]; if (!g) { res.setHeader('cache-control', 'no-store'); return res.status(404).send(kop('Niet gevonden', 'Deze gids bestaat niet.', '/', '') + '<h1>Deze gids bestaat (nog) niet</h1><p><a href="/">Naar alle gidsen</a></p>' + VOET(null, 0.5)); }
    await telBot(ua, slug);
    return res.status(200).send(await gidsPagina(g));
  } catch (e) { res.setHeader('cache-control', 'no-store'); return res.status(500).send('Er ging iets mis: ' + esc(String(e && e.message || e).slice(0, 120))); }
}
